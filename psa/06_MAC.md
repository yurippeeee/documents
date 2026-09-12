# 06. MAC — 鍵付きハッシュで改ざんを検出する

> **この章のゴール.**
>
> `psa_mac_compute()` / `psa_mac_verify()` と分割版を使えるようになり、
> HMAC と CMAC の使い分け、**タグ長の切り詰め**、
> そして「MAC 用の鍵属性は SIGN / VERIFY」という規則を理解すること。

## 1. MAC とは何か

**MAC**（Message Authentication Code、メッセージ認証コード）は、
**鍵とメッセージから作る短い値（タグ）**で、鍵を知っている者だけが正しいタグを作れる。
受信側は同じ鍵でタグを計算し直し、届いたタグと一致すれば「鍵を知る相手が送った、途中で変わっていないメッセージ」だと分かる。

前章の最後で述べたように、ハッシュ単体では改ざんを防げない。
MAC は、**ハッシュに鍵を混ぜる**ことでその欠点を埋める。

```fig
s06_what
```

PSA が対応する MAC は 2 系統ある。

| アルゴリズム定数 | 中身 | 鍵の種類 | タグ長 |
|---|---|---|---|
| `PSA_ALG_HMAC(hash)` | ハッシュ関数を 2 回入れ子にして鍵を混ぜる（RFC 2104） | `PSA_KEY_TYPE_HMAC` | ハッシュの出力長（SHA-256 で 32） |
| `PSA_ALG_CMAC` | AES のブロック暗号を連鎖させて作る（NIST SP 800-38B——米国標準技術研究所の規格文書） | `PSA_KEY_TYPE_AES` | 16（AES のブロック長） |
| `PSA_ALG_CBC_MAC` | CBC モードの最終ブロック。**固定長メッセージ以外では安全でない** | `PSA_KEY_TYPE_AES` | 16 |

- **HMAC-SHA256** が標準的な選択。プロトコル（TLS、JWT——Web の認証トークン形式——、AWS——Amazon のクラウド——の API 署名など）で広く使われている
- **CMAC** は AES のハードウェアしかない小さなチップで有利。また、AES 鍵しか配布されていない環境（自動車の SecOC——車載ネットワークのメッセージ認証規格——など）で使う
- CBC-MAC は互換目的以外では選ばない

## 2. 鍵の属性

MAC の鍵は、**「計算」を `SIGN_MESSAGE`、「検証」を `VERIFY_MESSAGE`** として扱う（3 章で述べた）。

```c
psa_key_attributes_t attr = PSA_KEY_ATTRIBUTES_INIT;
psa_set_key_type(&attr, PSA_KEY_TYPE_HMAC);
psa_set_key_bits(&attr, 256);                          /* 32 バイト鍵 */
psa_set_key_usage_flags(&attr, PSA_KEY_USAGE_SIGN_MESSAGE | PSA_KEY_USAGE_VERIFY_MESSAGE);
psa_set_key_algorithm(&attr, PSA_ALG_HMAC(PSA_ALG_SHA_256));
PSA_CHECK(psa_generate_key(&attr, &key));    /* または psa_import_key で共有鍵を取り込む */
```

送信専用の装置には `SIGN_MESSAGE` だけ、受信専用の装置には `VERIFY_MESSAGE` だけを付ける。
「受信側の鍵が漏れても、偽のメッセージは作れない」——とはならない（MAC は対称鍵なので、検証できる者は生成もできる）。
だから用途フラグはあくまで**誤用防止**であり、送信と受信の権限を分けたいなら署名（9 章）を使う。

HMAC の鍵長は、内部のハッシュのブロック長（SHA-256 なら 64 バイト = 512 ビット）以下が推奨。
それより長い鍵は内部で一度ハッシュされて 32 バイトに縮むので、長くしても強度は上がらない。
短すぎる鍵（16 バイト未満）は総当たりに弱い。**32 バイトが標準**である。

## 3. 一発関数

```c
psa_status_t psa_mac_compute(psa_key_id_t key, psa_algorithm_t alg,
                             const uint8_t *input, size_t input_length,
                             uint8_t *mac, size_t mac_size, size_t *mac_length);

psa_status_t psa_mac_verify(psa_key_id_t key, psa_algorithm_t alg,
                            const uint8_t *input, size_t input_length,
                            const uint8_t *mac, size_t mac_length);
```

```c
/* 送信側 */
uint8_t tag[PSA_MAC_LENGTH(PSA_KEY_TYPE_HMAC, 256, PSA_ALG_HMAC(PSA_ALG_SHA_256))];  /* 32 */
size_t tag_len;
PSA_CHECK(psa_mac_compute(key, PSA_ALG_HMAC(PSA_ALG_SHA_256), msg, msg_len, tag, sizeof tag, &tag_len));
send(msg, msg_len); send(tag, tag_len);

/* 受信側 */
st = psa_mac_verify(key, PSA_ALG_HMAC(PSA_ALG_SHA_256), msg, msg_len, tag, tag_len);
if (st == PSA_ERROR_INVALID_SIGNATURE) { /* 改ざん、または鍵が違う */ }
```

`psa_mac_verify()` は**一定時間で比較**する。
受信したタグを `psa_mac_compute()` で計算し直して `memcmp` で比べるコードを書いてはいけない（5 章のタイミング攻撃）。

タグ長は `PSA_MAC_LENGTH(key_type, key_bits, alg)` で計算する。
実行時にアルゴリズムが決まるなら `PSA_MAC_MAX_SIZE`（通常 64）。

```fig
s06_flow
```

## 4. 分割関数

```c
psa_mac_operation_t op = PSA_MAC_OPERATION_INIT;
psa_status_t psa_mac_sign_setup(psa_mac_operation_t *op, psa_key_id_t key, psa_algorithm_t alg);
psa_status_t psa_mac_verify_setup(psa_mac_operation_t *op, psa_key_id_t key, psa_algorithm_t alg);
psa_status_t psa_mac_update(psa_mac_operation_t *op, const uint8_t *input, size_t input_length);
psa_status_t psa_mac_sign_finish(psa_mac_operation_t *op, uint8_t *mac, size_t mac_size, size_t *mac_length);
psa_status_t psa_mac_verify_finish(psa_mac_operation_t *op, const uint8_t *mac, size_t mac_length);
psa_status_t psa_mac_abort(psa_mac_operation_t *op);
```

ハッシュの分割関数（5 章）との違いは 2 点だけである。

1. **`setup` が 2 種類**ある。計算するなら `psa_mac_sign_setup()`、検証するなら `psa_mac_verify_setup()`。この時点で鍵の用途フラグ（SIGN か VERIFY か）が確認される
2. **`finish` も 2 種類**。`sign_setup` で始めたら `sign_finish`、`verify_setup` で始めたら `verify_finish`。組み合わせを間違えると `PSA_ERROR_BAD_STATE`

```c
psa_status_t verify_stream(psa_key_id_t key, stream_t *s, const uint8_t *tag, size_t tag_len)
{
    psa_mac_operation_t op = PSA_MAC_OPERATION_INIT;
    uint8_t buf[128]; size_t n;
    psa_status_t st = psa_mac_verify_setup(&op, key, PSA_ALG_HMAC(PSA_ALG_SHA_256));
    if (st != PSA_SUCCESS) goto cleanup;
    while ((n = stream_read(s, buf, sizeof buf)) > 0) {
        st = psa_mac_update(&op, buf, n);
        if (st != PSA_SUCCESS) goto cleanup;
    }
    st = psa_mac_verify_finish(&op, tag, tag_len);   /* 一致なら SUCCESS */
cleanup:
    psa_mac_abort(&op);
    return st;
}
```

```fig
s06_state
```

## 5. タグの切り詰め

無線のフレームのように 1 バイトでも惜しい場面では、32 バイトのタグは長すぎる。
PSA は**タグを短くしたアルゴリズム**を定数で表す。

```c
PSA_ALG_TRUNCATED_MAC(PSA_ALG_HMAC(PSA_ALG_SHA_256), 16)   /* 先頭 16 バイトだけ使う */
PSA_ALG_TRUNCATED_MAC(PSA_ALG_CMAC, 8)                     /* CMAC を 8 バイトに */
```

切り詰めたアルゴリズムを鍵の属性と関数の両方に指定すれば、`psa_mac_compute()` の出力が短くなり、`psa_mac_verify()` も短いタグを受け付ける。
`PSA_MAC_LENGTH()` も切り詰め後の長さを返す。

**どこまで短くしてよいか**——タグが n バイトなら、攻撃者が当てずっぽうで検証を通す確率は 1 回あたり 2^(−8n) である。
8 バイト（2^64 分の 1）なら、1 秒に 100 万回試しても 58 万年かかる。
**4 バイト未満は避ける**（2^32 = 43 億回で当たる。オンラインでも現実的な回数）。
また、切り詰めた MAC を鍵の導出に使い回すと、切り詰めた分だけ弱くなることに注意する。

鍵の属性で「n バイト以上なら許す」と幅を持たせるには `PSA_ALG_AT_LEAST_THIS_LENGTH_MAC(alg, n)` を使う。

```fig
s06_trunc
```

## 6. MAC の典型的な使い方

### 6.1 通信フレームの認証

MAC は「送信者の認証」と「改ざん検出」を同時に行うが、**再送攻撃**（正しいフレームを録音して後で再生する）は防げない。
必ず**カウンタかタイムスタンプをメッセージに含めて**、MAC の対象にする。
受信側は「前回より大きいカウンタ」だけを受け付ける。

```c
/* フレーム = [counter(4)] [payload] [tag(8)] */
uint8_t frame[4 + PAYLOAD_MAX + 8];
put_be32(frame, ++tx_counter);
memcpy(frame + 4, payload, plen);
psa_mac_compute(key, PSA_ALG_TRUNCATED_MAC(PSA_ALG_CMAC, 8),
                frame, 4 + plen, frame + 4 + plen, 8, &tag_len);
```

### 6.2 「暗号化しないが改ざんは防ぐ」設定データ

フラッシュ上の設定領域に MAC を付けておけば、書き換えられたら起動時に検出できる。
ただし、鍵がそのマイコンから読み出せるなら意味がない——鍵は PSA の永続鍵（12 章）として、できれば TF-M のセキュア側に置く。

### 6.3 暗号化と組み合わせるなら AEAD

「暗号化 + MAC」を自分で組み合わせるのは間違いやすい（順序、鍵の使い分け、対象範囲）。
その組み合わせを**1 つの操作にまとめた**のが次々章の AEAD であり、**暗号化を伴うなら MAC を直接使わず AEAD を使う**のが原則である。
MAC を単独で使うのは「暗号化は不要だが、改ざんと成りすましを防ぎたい」ときである。

## 7. 手を動かす

### HMAC を実際に計算する

## 8. 仕様書に逃がす

| 関数・定数 | 用途 |
|---|---|
| `PSA_ALG_FULL_LENGTH_MAC(alg)` | 切り詰めた定数から元の（完全長の）定数に戻す |
| `PSA_MAC_TRUNCATED_LENGTH(alg)` / `PSA_ALG_IS_HMAC` / `PSA_ALG_IS_BLOCK_CIPHER_MAC` | アルゴリズム定数の分解・判定 |
| `PSA_ALG_CBC_MAC` | 互換目的のみ |

---

## この章のポイント

- MAC = **鍵付きハッシュ**。鍵を知る相手からの、改ざんのないメッセージだと分かる
- 鍵の用途は **SIGN_MESSAGE / VERIFY_MESSAGE**。HMAC-SHA256・256 ビット鍵が標準、CMAC は AES 鍵で
- 検証は `psa_mac_verify()` に任せる。**再計算 + `memcmp` は禁止**
- 分割版は `sign_setup`/`verify_setup` と `sign_finish`/`verify_finish` の**組み合わせを揃える**
- タグは `PSA_ALG_TRUNCATED_MAC` で短くできる。**4 バイト未満は不可**。再送攻撃はカウンタで防ぐ
- 暗号化も要るなら MAC ではなく **AEAD**（8 章）

→ 次: [07. 対称暗号](07_対称暗号.md)
