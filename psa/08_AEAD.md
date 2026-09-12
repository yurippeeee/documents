# 08. AEAD — 暗号化と改ざん検出を 1 つの操作で

> **この章のゴール.**
>
> `psa_aead_encrypt()` / `psa_aead_decrypt()` の引数（ノンス・追加データ・平文・タグ）の役割を理解し、
> **ノンスの管理**を設計でき、分割版の `set_lengths` の意味を説明できるようになること。
> データを暗号化する場面で、迷わずこの章の関数を選べるようになること。

## 1. AEAD とは何か

**AEAD**（Authenticated Encryption with Associated Data、関連データ付き認証暗号）は、
**暗号化（機密性）と MAC（完全性・認証）を 1 つの操作にまとめた**暗号方式である。
前章の最後で述べた「対称暗号を単独で使うな」に対する、標準の答えがこれである。

AEAD は次の 4 つを入力に取る。

| 入力 | 役割 | 秘密か | 出力に含まれるか |
|---|---|---|---|
| **鍵** | 対称鍵（AES など） | 秘密 | 含まれない |
| **ノンス**（nonce、number used once） | 一度きりの値。対称暗号の IV に相当 | 公開でよい | **自分で送る**（PSA の一発関数は出力に含めない） |
| **追加データ**（AD、associated data） | **暗号化はしないが改ざんは検出したい**データ。ヘッダ、宛先、バージョン番号など | 公開 | 含まれない（受信側も同じものを持っている前提） |
| **平文** | 暗号化して守りたいデータ | 秘密 | 暗号文として |

出力は **暗号文 ∥ タグ**（tag。MAC に相当する 16 バイトの認証値）である。
復号側は鍵・ノンス・追加データ・暗号文・タグをすべて揃えて渡し、**1 ビットでも違えば復号は `PSA_ERROR_INVALID_SIGNATURE` で失敗し、平文は出てこない**。

```fig
s08_inputs
```

「追加データ」という概念が初心者には分かりにくい。
例えば無線パケットの宛先アドレスは、中継器がルーティング（次にどこへ送るかの判断）に使うので暗号化できない。
しかし攻撃者に宛先を書き換えられては困る。
そこで宛先を**追加データとしてタグの計算に含める**——暗号化されないが、書き換えればタグが合わなくなる。
これが「関連データ付き」の意味である。

## 2. アルゴリズム

| アルゴリズム定数 | 鍵種別 | ノンス長 | タグ長 | 特徴 |
|---|---|---|---|---|
| `PSA_ALG_GCM` | AES | **12** バイト推奨 | 16 | **標準**。TLS 1.3 の既定。ハードウェア AES で高速。ノンスの繰り返しに**極端に弱い** |
| `PSA_ALG_CCM` | AES | 7〜13 バイト（**通常 13**） | 16（4〜16 の偶数） | 無線規格（Zigbee、Bluetooth LE、Thread——いずれも IoT 向けの低消費電力無線）の標準。AES の暗号化方向だけで実装できるので小さい。**平文長を先に知る必要がある** |
| `PSA_ALG_CHACHA20_POLY1305` | `PSA_KEY_TYPE_CHACHA20` | 12 | 16 | AES ハードウェアがない CPU で高速。ソフトウェアでもサイドチャネルに強い |

タグを短くしたいときは `PSA_ALG_AEAD_WITH_SHORTENED_TAG(PSA_ALG_CCM, 8)` のように書く（MAC の切り詰めと同じ考え。4 バイト未満は避ける）。
ノンス長は `PSA_AEAD_NONCE_LENGTH(key_type, alg)`、タグ長は `PSA_AEAD_TAG_LENGTH(key_type, key_bits, alg)` で得られる。

鍵の属性は対称暗号と同じく `PSA_KEY_USAGE_ENCRYPT | PSA_KEY_USAGE_DECRYPT` と、アルゴリズム定数である。

## 3. 一発関数

```c
psa_status_t psa_aead_encrypt(psa_key_id_t key, psa_algorithm_t alg,
                              const uint8_t *nonce, size_t nonce_length,
                              const uint8_t *additional_data, size_t additional_data_length,
                              const uint8_t *plaintext, size_t plaintext_length,
                              uint8_t *ciphertext, size_t ciphertext_size, size_t *ciphertext_length);

psa_status_t psa_aead_decrypt(psa_key_id_t key, psa_algorithm_t alg,
                              const uint8_t *nonce, size_t nonce_length,
                              const uint8_t *additional_data, size_t additional_data_length,
                              const uint8_t *ciphertext, size_t ciphertext_length,
                              uint8_t *plaintext, size_t plaintext_size, size_t *plaintext_length);
```

引数は多いが、1 節の表の順に並んでいるだけである。
**対称暗号との最大の違いは、ノンスを呼ぶ側が渡す**ことである（一発関数でも自動生成しない）。
これは、AEAD ではノンスの管理方法（乱数かカウンタか）がプロトコルごとに違い、ライブラリが決められないからである。

```c
#define NONCE_LEN PSA_AEAD_NONCE_LENGTH(PSA_KEY_TYPE_AES, PSA_ALG_GCM)   /* 12 */
uint8_t nonce[NONCE_LEN];
uint8_t header[4] = { 0x01, 0x00, dst_id, msg_type };                     /* 追加データ */
uint8_t ct[PSA_AEAD_ENCRYPT_OUTPUT_SIZE(PSA_KEY_TYPE_AES, PSA_ALG_GCM, plen)];  /* plen + 16 */
size_t ct_len;

PSA_CHECK(psa_generate_random(nonce, sizeof nonce));
PSA_CHECK(psa_aead_encrypt(key, PSA_ALG_GCM,
                           nonce, sizeof nonce,
                           header, sizeof header,
                           plain, plen,
                           ct, sizeof ct, &ct_len));
/* 送るもの: header ∥ nonce ∥ ct（ct の末尾 16 バイトがタグ） */
```

受信側:

```c
uint8_t pt[PSA_AEAD_DECRYPT_OUTPUT_SIZE(PSA_KEY_TYPE_AES, PSA_ALG_GCM, ct_len)];   /* ct_len - 16 */
size_t pt_len;
st = psa_aead_decrypt(key, PSA_ALG_GCM, nonce, 12, header, 4, ct, ct_len, pt, sizeof pt, &pt_len);
if (st == PSA_ERROR_INVALID_SIGNATURE) {
    /* 改ざん・鍵違い・ノンス違い・追加データ違いのどれか。pt は使わない */
}
```

**復号が失敗したら平文バッファの中身を一切使ってはいけない**。
仕様は「失敗時は出力バッファに平文の一部も残さない」ことを実装に求めているが、それに頼らず、アプリケーション側でも使わないのが作法である。

```fig
s08_frame
```

## 4. ノンスの管理 — AEAD で唯一難しいところ

AEAD の安全性は、**同じ鍵で同じノンスを二度使わない**ことにかかっている。
GCM でノンスが繰り返されると、認証鍵が漏れて**以後すべてのメッセージが偽造できる**ようになる。
CTR の IV 繰り返し（前章）よりさらに悪い。

ノンスの決め方は 2 通りある。

| 方式 | やり方 | 長所 | 短所 |
|---|---|---|---|
| **乱数** | `psa_generate_random()` で 12 バイト作り、暗号文と一緒に送る | 状態を持たなくてよい | 96 ビットなら 2^32 回（43 億回）程度で衝突の心配が出る。同じ鍵の寿命を制限する |
| **カウンタ** | 送信カウンタ（例: 4 バイトの装置 ID + 8 バイトの通し番号）をノンスにする | 衝突しない。ノンスを送らなくてもよい場合がある | **カウンタを不揮発に保存**しないと、再起動で繰り返す。複数の送信者で同じ鍵を使うなら装置 ID で区別する |

**マイコンで最も多い事故は、カウンタ方式で再起動後にカウンタが 0 に戻ること**である。
対策は、(a) 起動ごとに乱数の「世代番号」をノンスの一部に入れる、(b) カウンタを一定間隔（例: 1000 回ごと）で不揮発ストレージ（13 章）に保存し、起動時に「保存値 + 1000」から始める、のどちらかである。

```fig
s08_nonce
```

> **鍵の寿命.**
>
> 同じ鍵で暗号化してよい回数には上限がある。
> GCM で乱数ノンスなら 2^32 メッセージ、カウンタノンスでも 2^32 ブロック（64 GB）あたりが目安である。
> IoT 機器の一生では届かないことが多いが、「鍵を定期的に更新する」設計（10 章の鍵導出でセッション鍵を作る）が本来の形である。

## 5. 分割関数

```c
psa_aead_operation_t op = PSA_AEAD_OPERATION_INIT;
psa_status_t psa_aead_encrypt_setup(psa_aead_operation_t *op, psa_key_id_t key, psa_algorithm_t alg);
psa_status_t psa_aead_decrypt_setup(psa_aead_operation_t *op, psa_key_id_t key, psa_algorithm_t alg);
psa_status_t psa_aead_set_lengths(psa_aead_operation_t *op, size_t ad_length, size_t plaintext_length);
psa_status_t psa_aead_generate_nonce(psa_aead_operation_t *op, uint8_t *nonce, size_t nonce_size, size_t *nonce_length);
psa_status_t psa_aead_set_nonce(psa_aead_operation_t *op, const uint8_t *nonce, size_t nonce_length);
psa_status_t psa_aead_update_ad(psa_aead_operation_t *op, const uint8_t *input, size_t input_length);
psa_status_t psa_aead_update(psa_aead_operation_t *op, const uint8_t *input, size_t input_length,
                             uint8_t *output, size_t output_size, size_t *output_length);
psa_status_t psa_aead_finish(psa_aead_operation_t *op, uint8_t *ciphertext, size_t ciphertext_size, size_t *ciphertext_length,
                             uint8_t *tag, size_t tag_size, size_t *tag_length);
psa_status_t psa_aead_verify(psa_aead_operation_t *op, uint8_t *plaintext, size_t plaintext_size, size_t *plaintext_length,
                             const uint8_t *tag, size_t tag_length);
psa_status_t psa_aead_abort(psa_aead_operation_t *op);
```

関数が多いが、順番は決まっている。

1. `encrypt_setup` または `decrypt_setup`
2. **`set_lengths`（CCM では必須、GCM では省略可）**——追加データと平文の合計長を先に宣言する。CCM はノンスと長さをヘッダに含めて計算を始めるため、長さが先に要る
3. `generate_nonce`（暗号化のみ）または `set_nonce`
4. `update_ad` を 0 回以上——追加データを流し込む。**`update` の前に全部済ませる**
5. `update` を 0 回以上——平文（または暗号文）を流し込み、暗号文（または平文）を受け取る
6. `finish`（暗号化: 残りの暗号文と**タグ**を返す）または `verify`（復号: 残りの平文を返し、**タグを照合**）

```c
psa_aead_operation_t op = PSA_AEAD_OPERATION_INIT;
uint8_t nonce[12], tag[16]; size_t nonce_len, tag_len, n, total = 0;

PSA_CHECK(psa_aead_encrypt_setup(&op, key, PSA_ALG_GCM));
PSA_CHECK(psa_aead_set_lengths(&op, hdr_len, body_len));
PSA_CHECK(psa_aead_generate_nonce(&op, nonce, sizeof nonce, &nonce_len));
PSA_CHECK(psa_aead_update_ad(&op, hdr, hdr_len));
for (each chunk of body) {
    PSA_CHECK(psa_aead_update(&op, chunk, chunk_len, out + total, out_size - total, &n));
    total += n;
}
PSA_CHECK(psa_aead_finish(&op, out + total, out_size - total, &n, tag, sizeof tag, &tag_len));
total += n;
```

**復号の分割版には、決定的な落とし穴がある。**
`psa_aead_update()` は、タグを照合する**前に**平文を返す。
つまり、`verify` で失敗するまで、アプリケーションは「改ざんされているかもしれない平文」をすでに受け取っている。
仕様は「`verify` が成功するまで、`update` の出力を信用してはならない」と明記している。
大きなファームウェアイメージを分割復号してフラッシュに書く場合、**`verify` が失敗したら書いた領域を無効化する**手順が必須である。
（一部の実装は、この危険を避けるために `update` の出力を内部に溜めて `verify` まで返さない。その場合は `update` の出力長が 0 になることがある。）

```fig
s08_state
```

## 6. AEAD を使う場面の設計例

### 6.1 フレーム形式

```
[header (AD)] [nonce] [ciphertext] [tag]
```

- header: バージョン・種別・宛先など、平文で見える必要のある情報。**必ず AD に入れる**
- nonce: 12 バイト。カウンタ方式なら header 内のシーケンス番号から復元して省略できる
- ciphertext + tag: `psa_aead_encrypt()` の出力そのもの

### 6.2 フラッシュ上の設定データ

「暗号化しない MAC 付き設定」（6 章）を「AEAD で暗号化した設定」にすると、内容も隠せる。
ノンスは書き換えごとに新しく乱数で作り、データと一緒に保存する。
AD には**ストレージ上の位置やバージョン**を入れておくと、「古い設定を別の場所にコピーして戻す」攻撃（ロールバック）を検出できる。

### 6.3 鍵の包み込み

「鍵を別の鍵で暗号化して持つ」ときは AEAD を使う。
改ざんされた鍵を復号して使ってしまう事故を防げる。
PSA には 1.3 で `psa_wrap_key()` が入ったが、AEAD で `psa_export_key()` の出力を包み、`psa_import_key()` で戻す手順でも同等のことができる（`EXPORT` 用途が要る点に注意）。

## 7. 手を動かす

### AEAD の 4 つの入力を触る

## 8. 仕様書に逃がす

| 関数・定数 | 用途 |
|---|---|
| `PSA_ALG_AEAD_WITH_AT_LEAST_THIS_LENGTH_TAG(alg, n)` | 鍵の方針で「タグ長 n 以上なら許す」 |
| `PSA_ALG_AEAD_WITH_DEFAULT_LENGTH_TAG(alg)` | 短縮タグの定数から既定長の定数に戻す |
| `PSA_AEAD_UPDATE_OUTPUT_SIZE` / `PSA_AEAD_FINISH_OUTPUT_SIZE` / `PSA_AEAD_VERIFY_OUTPUT_SIZE` | 分割版のバッファ見積もり |
| `PSA_ALG_XCHACHA20_POLY1305` | 24 バイトノンス版（1.3 で追加、乱数ノンスの衝突余裕が大きい） |

---

## この章のポイント

- AEAD = **暗号化 + 改ざん検出**。入力は鍵・ノンス・追加データ・平文、出力は暗号文 ∥ タグ
- 追加データは「**暗号化しないが改ざんは検出する**」ヘッダ類。必ず入れる
- **ノンスは呼ぶ側が渡す**。同じ鍵で二度と繰り返さない。カウンタ方式は再起動対策が必須
- 復号失敗（`INVALID_SIGNATURE`）時は平文を一切使わない。分割版は `verify` 成功まで `update` の出力を信用しない
- CCM は `set_lengths` が必須。GCM が標準、AES がなければ ChaCha20-Poly1305

→ 次: [09. 署名と検証](09_署名と検証.md)
