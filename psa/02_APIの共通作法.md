# 02. API の共通作法 — 戻り値・初期化・バッファの流儀

> **この章のゴール.**
>
> どの PSA 関数にも共通する 5 つの決まりごと——
> **戻り値、初期化、定数の作り方、出力バッファの渡し方、操作オブジェクトの寿命**——
> を覚え、初めて見る関数でも引数の意味が推測できるようになること。

## 1. すべての関数は `psa_status_t` を返す

PSA API の関数は、ほぼ例外なく **`psa_status_t`**（32 ビット符号付き整数）を返す。
成功は **`PSA_SUCCESS`（値 0）**、失敗は**負の値**である。
計算結果は戻り値ではなく、**引数として渡したポインタの先**に書き込まれる。

```c
psa_status_t st = psa_hash_compute(PSA_ALG_SHA_256, in, in_len, out, sizeof out, &out_len);
if (st != PSA_SUCCESS) {
    /* 失敗。out の中身は不定。out_len も信用しない */
}
```

エラーコードは `psa/error.h` で定義され、**全 API で共通**である（Crypto でもストレージでも同じ番号）。
よく見る値を、実際に遭遇する順に並べる。

| 定数 | 値 | 意味 | 初心者が踏む典型的な原因 |
|---|---|---|---|
| `PSA_SUCCESS` | 0 | 成功 | — |
| `PSA_ERROR_BAD_STATE` | −137 | 呼ぶ順番が違う | `psa_crypto_init()` を忘れた。分割操作で `setup` の前に `update` を呼んだ |
| `PSA_ERROR_NOT_SUPPORTED` | −134 | この実装はそのアルゴリズム・鍵種別に対応していない | ビルド設定で無効。`PSA_WANT_ALG_*` を確認（15 章） |
| `PSA_ERROR_NOT_PERMITTED` | −133 | 鍵の用途（usage）や方針が許していない | 鍵属性に `PSA_KEY_USAGE_SIGN_HASH` を付け忘れた。書き込み専用ストレージに再書き込み |
| `PSA_ERROR_INVALID_ARGUMENT` | −135 | 引数の組み合わせが不正 | 鍵種別とアルゴリズムが合わない。鍵長が不正。ハッシュ長が違う |
| `PSA_ERROR_BUFFER_TOO_SMALL` | −138 | 出力バッファが足りない | サイズマクロを使わずに決め打ちした |
| `PSA_ERROR_INVALID_HANDLE` | −136 | 鍵 ID が無効 | 破棄済みの鍵、未初期化の `psa_key_id_t`（値 0） |
| `PSA_ERROR_INVALID_SIGNATURE` | −149 | 署名・MAC・AEAD タグの検証に失敗 | 改ざんされた、または鍵・データ・アルゴリズムのどれかが一致しない |
| `PSA_ERROR_ALREADY_EXISTS` | −139 | 同じ ID の永続鍵がすでにある | 前回の実行で作った鍵が残っている（12 章） |
| `PSA_ERROR_DOES_NOT_EXIST` | −140 | 指定した ID のデータがない | ストレージの UID（保存データの識別番号。13 章）間違い。鍵が未作成 |
| `PSA_ERROR_INSUFFICIENT_MEMORY` | −141 | メモリ不足 | ヒープが小さい。鍵スロット（実装が鍵を保持する枠）数の上限（`MBEDTLS_PSA_KEY_SLOT_COUNT`） |
| `PSA_ERROR_INSUFFICIENT_STORAGE` | −142 | 不揮発ストレージの空きがない | ITS/PS の領域が満杯 |
| `PSA_ERROR_INSUFFICIENT_ENTROPY` | −148 | 乱数の種が足りない | エントロピー源（乱数の元になる物理的なゆらぎの供給源）が未設定 |
| `PSA_ERROR_STORAGE_FAILURE` | −146 | ストレージの読み書きが失敗 | フラッシュドライバの不具合 |
| `PSA_ERROR_HARDWARE_FAILURE` | −147 | 暗号エンジンなどのハードウェア異常 | ドライバの実装バグ、クロック未供給 |
| `PSA_ERROR_CORRUPTION_DETECTED` | −151 | 内部データの整合性が壊れている | メモリ破壊。**攻撃の可能性も** |
| `PSA_ERROR_COMMUNICATION_FAILURE` | −145 | セキュア側との通信失敗 | TF-M の呼び出しが途切れた。セキュアエレメントの応答なし |
| `PSA_ERROR_GENERIC_ERROR` | −132 | 分類できない失敗 | 実装の内部エラー |
| `PSA_ERROR_PROGRAMMER_ERROR` | −129 | 呼び出し側の明らかな誤用（TF-M で発生） | セキュア側に渡したポインタが非セキュア側のメモリを指していない |

```fig
s02_status
```

> **エラーを「握りつぶさない」ための最小の型.**
>
> 組み込みでは戻り値を無視するコードが横行するが、PSA では無視すると
> **「暗号化したつもりで平文を送る」**という最悪の事態になる。
> 次の形を全関数に貼る習慣をつけよ。
>
> ```c
> #define PSA_CHECK(expr) do { psa_status_t _s = (expr); \
>     if (_s != PSA_SUCCESS) { log_error(#expr, _s); goto cleanup; } } while (0)
> ```
>
> `cleanup:` ラベルの先で操作オブジェクトを `abort` し、鍵を破棄する（この章の 5 節）。

### エラーコードを読み解く

## 2. `psa_crypto_init()` — 全ての前に 1 回

Crypto API は、**最初に `psa_crypto_init()` を呼ぶ**まで使えない。
これは乱数生成器（RNG）の初期化、鍵ストレージの読み込み、ハードウェアドライバの起動を行う。
呼び忘れると、ほとんどの関数が `PSA_ERROR_BAD_STATE` を返す。

```c
psa_status_t psa_crypto_init(void);
```

- **何度呼んでも安全**（2 回目以降は何もせず `PSA_SUCCESS`）。ライブラリの各モジュールの先頭で気軽に呼んでよい
- 失敗する主な理由は**エントロピー源がない**こと。PC では OS の乱数を使うので失敗しないが、マイコンでは乱数のハードウェア（TRNG、真性乱数生成器）かそれに代わる仕組みを設定する必要がある（15 章）
- TF-M 環境では非セキュア側からも呼べるが、実体はセキュア側の初期化がすでに済んでいることの確認である

ストレージ API（13 章）とアテステーション API（14 章）には初期化関数が**ない**。
実装の起動時に準備されている前提である。

```fig
s02_init
```

## 3. 定数の作り方 — 「種類」を整数で表す

PSA API の引数には、次の 4 種類の**整数で表される「種類」**が繰り返し登場する。
これらは単なる列挙値ではなく、**ビットの区画に意味がある 32 ビット（または 16 ビット）の符号化された値**である。
仕組みを知っておくと、エラーメッセージに出た数字の意味を読み解ける。

| 型 | 例 | 何を表すか |
|---|---|---|
| `psa_algorithm_t`（32 ビット） | `PSA_ALG_SHA_256` = 0x02000009、`PSA_ALG_GCM` = 0x05500200 | アルゴリズム。上位 8 ビットが「分類」（0x02 ハッシュ、0x03 MAC、0x04 暗号、0x05 AEAD、0x06 署名、0x07 公開鍵暗号、0x08 鍵導出、0x09 鍵合意） |
| `psa_key_type_t`（16 ビット） | `PSA_KEY_TYPE_AES` = 0x2400、`PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1)` = 0x7112 | 鍵の種類。上位ビットが「対称 / 公開鍵 / 鍵ペア」、下位に曲線などの詳細 |
| `psa_key_usage_t`（32 ビット） | `PSA_KEY_USAGE_SIGN_HASH` = 0x1000 | 用途。1 ビット 1 用途で、OR で組み合わせる |
| `psa_key_lifetime_t`（32 ビット） | `PSA_KEY_LIFETIME_PERSISTENT` = 1 | 揮発 / 永続と、鍵の置き場所 |

**アルゴリズムはマクロで組み立てる**ことが多い。
`PSA_ALG_HMAC(PSA_ALG_SHA_256)` は「SHA-256 を使う HMAC」であり、
`PSA_ALG_ECDSA(PSA_ALG_SHA_256)` は「SHA-256 でハッシュしてから ECDSA 署名」である。
括弧の中にハッシュを入れるという規則を覚えれば、ほとんどのアルゴリズム定数が読める。

```c
PSA_ALG_HMAC(PSA_ALG_SHA_256)            /* MAC       0x03800009 */
PSA_ALG_ECDSA(PSA_ALG_SHA_256)           /* 署名      0x06000609 */
PSA_ALG_RSA_OAEP(PSA_ALG_SHA_256)        /* 公開鍵暗号 0x07000309 */
PSA_ALG_HKDF(PSA_ALG_SHA_256)            /* 鍵導出    0x08000109 */
PSA_ALG_KEY_AGREEMENT(PSA_ALG_ECDH, PSA_ALG_HKDF(PSA_ALG_SHA_256))   /* 鍵合意+導出 */
```

逆向きに調べるマクロもある。
`PSA_ALG_IS_HASH(alg)`、`PSA_ALG_IS_MAC(alg)`、`PSA_ALG_GET_HASH(alg)`（署名や MAC から中のハッシュを取り出す）、
`PSA_KEY_TYPE_IS_ASYMMETRIC(type)`、`PSA_KEY_TYPE_ECC_GET_FAMILY(type)` などである。
汎用的なコード（複数のアルゴリズムを引数で受ける関数）を書くときに使う。

```fig
s02_alg
```

## 4. 出力バッファの流儀 — 「サイズ」と「長さ」のペア

PSA 関数が結果をバイト列として返すときは、**必ず次の 3 つ組**で受け取る。

```c
uint8_t buf[SIZE];      /* 出力先 */
size_t  buf_size = sizeof buf;  /* バッファの大きさ（呼ぶ側が伝える） */
size_t  out_len;        /* 実際に書かれた長さ（関数が返す） */

st = psa_xxx(..., buf, buf_size, &out_len);
```

- バッファが足りなければ `PSA_ERROR_BUFFER_TOO_SMALL` が返り、**何も書かれない**（部分的な出力はない）
- 成功時、`out_len` ≤ `buf_size`。**必ず `out_len` を使う**。`buf_size` は上限であって出力長ではない
- 入力は `(const uint8_t *data, size_t length)` の 2 つ組。PSA には「文字列」の概念はなく、常にバイト列と長さである

バッファの大きさは、**サイズマクロ**で決める。決め打ちの数字（「AES だから 16」）は、アルゴリズムを変えた瞬間に壊れる。

| マクロ | 何のサイズか |
|---|---|
| `PSA_HASH_LENGTH(alg)` | ハッシュの出力長（SHA-256 なら 32） |
| `PSA_MAC_LENGTH(key_type, key_bits, alg)` | MAC の出力長 |
| `PSA_CIPHER_ENCRYPT_OUTPUT_SIZE(key_type, alg, input_length)` | 暗号文の長さ（IV 込み） |
| `PSA_AEAD_ENCRYPT_OUTPUT_SIZE(key_type, alg, plaintext_length)` | AEAD 暗号文（タグ込み） |
| `PSA_SIGN_OUTPUT_SIZE(key_type, key_bits, alg)` | 署名の長さ |
| `PSA_EXPORT_KEY_OUTPUT_SIZE(key_type, key_bits)` | 鍵をエクスポートしたときの長さ |
| `PSA_EXPORT_PUBLIC_KEY_OUTPUT_SIZE(key_type, key_bits)` | 公開鍵をエクスポートしたときの長さ |
| `PSA_RAW_KEY_AGREEMENT_OUTPUT_SIZE(key_type, key_bits)` | 鍵合意の共有秘密の長さ |
| `PSA_HASH_MAX_SIZE`、`PSA_MAC_MAX_SIZE`、`PSA_SIGNATURE_MAX_SIZE` など | 「この実装で扱う全アルゴリズムの最大」。アルゴリズムが実行時に決まるときに使う |

`PSA_BITS_TO_BYTES(bits)`（ビットをバイトに切り上げ）と `PSA_BYTES_TO_BITS(bytes)` も頻出である。
鍵長は**ビット**で指定し（`psa_set_key_bits(&attr, 256)`）、データはバイトで扱うので、変換が必要になる。

```fig
s02_buffer
```

> **なぜ「サイズと長さの 2 つ」なのか.**
>
> 「関数が必要な分だけ malloc して返す」設計にしなかったのは、
> PSA が**動的メモリのないマイコン**でも動くことを最優先したからである。
> 呼ぶ側が静的配列を用意し、関数はそこに書く。
> そしてセキュア側（TF-M）から非セキュア側のメモリに書き込むときは、
> 「どこからどこまで書いてよいか」を明示する必要があり、そのために `buf_size` が要る。

## 5. 操作オブジェクト — 分割処理の作法

ハッシュ・MAC・暗号・AEAD・鍵導出には、「一発で処理する関数」のほかに、
**データを分割して少しずつ処理する関数群**がある。
1 MB のファームウェアイメージをハッシュするとき、全体をメモリに置けないからだ。

分割処理は、**操作オブジェクト**（operation object）という構造体を使い、
決まった順番で関数を呼ぶ。

```c
psa_hash_operation_t op = PSA_HASH_OPERATION_INIT;   /* ① 初期化子で宣言 */
PSA_CHECK(psa_hash_setup(&op, PSA_ALG_SHA_256));     /* ② setup：アルゴリズム決定 */
PSA_CHECK(psa_hash_update(&op, chunk1, len1));       /* ③ update：何回でも */
PSA_CHECK(psa_hash_update(&op, chunk2, len2));
PSA_CHECK(psa_hash_finish(&op, hash, sizeof hash, &hash_len));  /* ④ finish：結果を取り出す */
```

すべての操作オブジェクトに共通する規則:

1. **必ず初期化子で宣言する**。`PSA_HASH_OPERATION_INIT`、`PSA_MAC_OPERATION_INIT`、`PSA_CIPHER_OPERATION_INIT`、`PSA_AEAD_OPERATION_INIT`、`PSA_KEY_DERIVATION_OPERATION_INIT`。または `psa_xxx_operation_init()` 関数で初期化する。ゼロ初期化されていないオブジェクトに `setup` すると動作は未定義
2. **状態は「inactive → active → inactive」**。`setup` で active になり、`finish` / `verify` / `abort` で inactive に戻る。active でないときに `update` すると `PSA_ERROR_BAD_STATE`
3. **どこかでエラーが出たら、必ず `abort` する**。エラーが出た時点でオブジェクトは「壊れた状態」であり、`abort` で inactive に戻さないと再利用できない。`abort` は inactive なオブジェクトに対して呼んでも安全（何もしない）
4. **`finish` が成功したら abort は不要**だが、呼んでも害はない。「エラー経路で必ず abort」を守るために、`cleanup:` で無条件に `abort` するのが一番簡単
5. **オブジェクトをコピーしてはいけない**（`memcpy` や代入）。中に実装依存の状態やハードウェアのハンドル（暗号エンジン側の処理を指す参照番号）が入っている。ハッシュだけは `psa_hash_clone()` という専用の複製関数がある

```fig
s02_opstate
```

## 6. 鍵 ID の作法

鍵を表す型は `psa_key_id_t`（32 ビット符号なし整数）である。
値 0 は `PSA_KEY_ID_NULL`（「鍵なし」）で、未初期化の変数を渡すと `PSA_ERROR_INVALID_HANDLE` になる。

```c
psa_key_id_t key = PSA_KEY_ID_NULL;   /* 宣言時に NULL にしておく癖 */
...
if (key != PSA_KEY_ID_NULL) psa_destroy_key(key);   /* cleanup で安全に破棄 */
```

古い資料には `psa_key_handle_t` と `psa_open_key()` / `psa_close_key()` が出てくる。
これは Crypto API 1.0 で**廃止**された古い作法で、現在は鍵 ID をそのまま渡す。
Mbed TLS 3.x で `mbedtls_svc_key_id_t` という型を見ることがあるが、
これは TF-M 環境で「鍵の所有者（どのクライアントが作ったか）」を鍵 ID と一緒に持つための型で、通常は `psa_key_id_t` と同じものだと思ってよい。

## 7. 全体の型 — 1 つの関数を呼ぶまでのテンプレート

ここまでの作法を 1 つにまとめると、PSA を使う関数は次の骨格になる。
以後の章のコードは、すべてこの骨格の変奏である。

```c
psa_status_t do_something(const uint8_t *in, size_t in_len,
                          uint8_t *out, size_t out_size, size_t *out_len)
{
    psa_status_t st;
    psa_key_id_t key = PSA_KEY_ID_NULL;
    psa_key_attributes_t attr = PSA_KEY_ATTRIBUTES_INIT;
    psa_xxx_operation_t op = PSA_XXX_OPERATION_INIT;

    st = psa_crypto_init();
    if (st != PSA_SUCCESS) goto cleanup;

    /* 鍵の属性を宣言して鍵を用意する（03・04 章） */
    psa_set_key_type(&attr, ...);
    psa_set_key_usage_flags(&attr, ...);
    psa_set_key_algorithm(&attr, ...);
    st = psa_import_key(&attr, ..., &key);
    if (st != PSA_SUCCESS) goto cleanup;

    /* 操作する */
    st = psa_xxx_setup(&op, key, alg);          if (st != PSA_SUCCESS) goto cleanup;
    st = psa_xxx_update(&op, in, in_len);        if (st != PSA_SUCCESS) goto cleanup;
    st = psa_xxx_finish(&op, out, out_size, out_len);

cleanup:
    psa_xxx_abort(&op);                 /* 無条件。inactive なら何もしない */
    psa_reset_key_attributes(&attr);    /* 属性構造体の後片付け（4 章） */
    if (key != PSA_KEY_ID_NULL) psa_destroy_key(key);
    return st;
}
```

---

## この章のポイント

- 戻り値は常に `psa_status_t`。**0 が成功、負が失敗**。結果はポインタ引数に書かれる
- `psa_crypto_init()` を最初に 1 回。忘れると `PSA_ERROR_BAD_STATE`
- アルゴリズム定数は `PSA_ALG_XXX(ハッシュ)` の形で**組み立てる**。上位 8 ビットが分類
- 出力は **(バッファ, サイズ, &実長)** の 3 つ組。サイズは**マクロで計算**する
- 分割処理は **INIT → setup → update… → finish**。エラー時は**必ず abort**

→ 次: [03. 鍵と属性](03_鍵と属性.md)
