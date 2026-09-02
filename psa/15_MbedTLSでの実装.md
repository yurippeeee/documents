# 15. Mbed TLS での実装 — 設定・乱数源・ドライバ

> **この章のゴール.**
>
> Mbed TLS（および TF-PSA-Crypto）で PSA Crypto API を有効にする**設定の書き方**、
> マイコンで必ず必要な**エントロピー源の接続**、
> 従来の `mbedtls_*` API との共存、そして**ドライバ**（ハードウェア暗号エンジンやセキュアエレメント）の仕組みを理解すること。

## 1. Mbed TLS と PSA の関係の変遷

| 時期 | 状態 |
|---|---|
| Mbed TLS 2.x 後半 | PSA Crypto API が「実験的」に追加。従来の `mbedtls_aes_*` などが主 |
| Mbed TLS 3.x（2021〜） | PSA が正式 API に。`MBEDTLS_USE_PSA_CRYPTO` で TLS/X.509 の内部も PSA を使える。従来 API と**共存** |
| Mbed TLS 3.6 LTS（2024〜2027） | 長期サポート版。3.x 系で最後。**現時点で最も多くのマイコン SDK が使っている** |
| **TF-PSA-Crypto 1.0 / Mbed TLS 4.0**（2025 年末〜） | 暗号部分が **TF-PSA-Crypto** という別リポジトリに分離。Mbed TLS 4.0 は TLS/X.509 だけになり、**暗号は PSA API のみ**（`mbedtls_aes_*` などの旧 API は削除） |

本シリーズは 3.6 と 4.0 の両方で通用する書き方をする。
**新規プロジェクトは PSA API だけを使い、`mbedtls_*` の暗号関数を呼ばない**ようにしておけば、移行で困らない。

```fig
s15_history
```

## 2. 設定 — 何を有効にするか

Mbed TLS の設定は、ヘッダファイルの `#define` で行う。3.x では `mbedtls_config.h`（従来）と `psa/crypto_config.h`（PSA 用）の 2 つがある。

### 2.1 PSA を有効にする基本セット（3.6）

```c
/* mbedtls_config.h */
#define MBEDTLS_PSA_CRYPTO_C              /* PSA Crypto API 本体 */
#define MBEDTLS_PSA_CRYPTO_CONFIG         /* 有効化を psa/crypto_config.h の PSA_WANT_* で行う */
#define MBEDTLS_USE_PSA_CRYPTO            /* TLS/X.509/PK モジュールも内部で PSA を使う */
#define MBEDTLS_PSA_CRYPTO_STORAGE_C      /* 永続鍵（ITS が必要） */
#define MBEDTLS_PSA_ITS_FILE_C            /* PC 用: ITS をファイルで模擬。マイコンでは外す */
#define MBEDTLS_ENTROPY_C
#define MBEDTLS_CTR_DRBG_C                /* 乱数生成器 */
```

### 2.2 アルゴリズムの選択 — `PSA_WANT_*`

`MBEDTLS_PSA_CRYPTO_CONFIG` を有効にすると、**どのアルゴリズム・鍵種別を使うかを `PSA_WANT_*` マクロで宣言**する方式になる（4.0 ではこれが唯一の方式）。
宣言していないアルゴリズムを呼ぶと `PSA_ERROR_NOT_SUPPORTED` になる。

```c
/* psa/crypto_config.h（抜粋）*/
#define PSA_WANT_ALG_SHA_256                    1
#define PSA_WANT_ALG_HMAC                       1
#define PSA_WANT_ALG_GCM                        1
#define PSA_WANT_ALG_CTR                        1
#define PSA_WANT_ALG_ECDSA                      1
#define PSA_WANT_ALG_DETERMINISTIC_ECDSA        1
#define PSA_WANT_ALG_ECDH                       1
#define PSA_WANT_ALG_HKDF                       1
#define PSA_WANT_ECC_SECP_R1_256                1   /* P-256 曲線 */
#define PSA_WANT_KEY_TYPE_AES                   1
#define PSA_WANT_KEY_TYPE_HMAC                  1
#define PSA_WANT_KEY_TYPE_DERIVE                1
#define PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC    1   /* ECC 鍵ペアを持てる */
#define PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_IMPORT   1   /* import できる */
#define PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_EXPORT   1   /* export できる（公開鍵の export はこれが要る）*/
#define PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_GENERATE 1   /* generate できる */
#define PSA_WANT_KEY_TYPE_ECC_PUBLIC_KEY        1
#define PSA_WANT_GENERATE_RANDOM                1
```

**鍵ペアの `_BASIC` / `_IMPORT` / `_EXPORT` / `_GENERATE` / `_DERIVE` が別々**なのは、フラッシュを 1 バイトでも削るためである。
「検証だけする装置」は `ECC_PUBLIC_KEY` だけで足り、鍵生成のコードをリンクしなくてよい。
逆に、`psa_generate_key()` が `NOT_SUPPORTED` を返したら、`_GENERATE` の宣言漏れを最初に疑う。

```fig
s15_want
```

> **サイズの目安.**
>
> Cortex-M4、-Os、上の設定（SHA-256 + AES-GCM + ECDSA/ECDH P-256 + HKDF）で、
> PSA Crypto のコードは概ね 60〜90 KB、RAM は鍵スロット 32 個で数 KB である。
> RSA を足すと +30 KB、ハードウェア AES ドライバに置き換えると −10 KB 程度。
> `MBEDTLS_PSA_KEY_SLOT_COUNT` で鍵スロット数を減らせば RAM を節約できる。

## 3. 乱数源 — マイコンで最初に詰まるところ

`psa_crypto_init()` は内部で DRBG を種付けする。
その種はエントロピー源から取るが、**マイコンには既定のエントロピー源がない**（PC では `/dev/urandom` が使われる）。
未設定だと、`psa_crypto_init()` が `PSA_ERROR_INSUFFICIENT_ENTROPY` で失敗する。

方法は 2 つある。

### 3.1 ハードウェア TRNG をエントロピー源として登録する

```c
/* mbedtls_config.h */
#define MBEDTLS_ENTROPY_HARDWARE_ALT
#undef  MBEDTLS_NO_PLATFORM_ENTROPY   /* ← これは定義する（プラットフォームの既定源がないと宣言）*/
#define MBEDTLS_NO_PLATFORM_ENTROPY

/* アプリケーション側で実装する関数 */
int mbedtls_hardware_poll(void *data, unsigned char *output, size_t len, size_t *olen)
{
    (void)data;
    for (size_t i = 0; i < len; i += 4) {
        uint32_t r = hal_trng_read();            /* チップの TRNG レジスタ */
        memcpy(output + i, &r, (len - i < 4) ? len - i : 4);
    }
    *olen = len;
    return 0;
}
```

Mbed TLS の CTR_DRBG が、この関数から取った種で擬似乱数を生成する。

### 3.2 外部 RNG をそのまま使う

TRNG が十分に速く、DRBG を挟む必要がないなら、**すべての乱数を外部関数から取る**設定がある。
TF-M やセキュアエレメントの RNG を使うときもこれである。

```c
#define MBEDTLS_PSA_CRYPTO_EXTERNAL_RNG

psa_status_t mbedtls_psa_external_get_random(mbedtls_psa_external_random_context_t *ctx,
                                             uint8_t *output, size_t output_size, size_t *output_length)
{
    (void)ctx;
    hal_trng_fill(output, output_size);
    *output_length = output_size;
    return PSA_SUCCESS;
}
```

**TRNG の健全性テスト**（出力が偏っていないか。NIST SP 800-90B の反復カウントテストなど）は、チップの TRNG ドライバが行うことが多いが、確認しておく。
乱数が壊れると ECDSA の秘密鍵が漏れる（9 章）。

```fig
s15_entropy
```

## 4. 従来 API との橋渡し

3.x では、既存コードが `mbedtls_pk_*`（公開鍵の汎用モジュール）や X.509 を使っていることが多い。
PSA 鍵と行き来する関数を知っておく。

| やりたいこと | 関数 |
|---|---|
| PEM/DER の秘密鍵ファイルを PSA 鍵にする | `mbedtls_pk_parse_key()` で読み、`mbedtls_pk_get_psa_attributes()` + `mbedtls_pk_import_into_psa()`（3.6〜） |
| PSA 鍵を TLS のクライアント証明書の秘密鍵として使う | `mbedtls_pk_setup_opaque(&pk, key_id)` — pk コンテキストが PSA 鍵 ID を指すだけになり、秘密鍵の値は TLS スタックにも出ない |
| X.509 証明書の公開鍵を PSA 鍵にする | `mbedtls_x509_crt_parse()` → `crt.pk` に対し `mbedtls_pk_get_psa_attributes()` + `mbedtls_pk_import_into_psa()` |
| ECDSA 署名の DER ⇄ raw 変換 | `mbedtls_ecdsa_der_to_raw()` / `mbedtls_ecdsa_raw_to_der()`（3.6〜） |
| PSA 鍵を pk コンテキストに「コピー」する | `mbedtls_pk_copy_from_psa()` / `mbedtls_pk_copy_public_from_psa()`（3.6〜） |

```c
/* TLS クライアントで、装置の永続鍵を秘密鍵として使う */
mbedtls_pk_context pk;
mbedtls_pk_init(&pk);
PSA_CHECK(mbedtls_pk_setup_opaque(&pk, KEY_ID_DEVICE_SIGN));
mbedtls_ssl_conf_own_cert(&conf, &device_crt, &pk);
```

`mbedtls_pk_setup_opaque()` は、**TLS で鍵を使いたいが、鍵の値はセキュア側やセキュアエレメントから出したくない**ときの要である。
TLS ハンドシェイクの署名は PSA の `psa_sign_hash()` として呼ばれ、鍵の場所に応じてドライバが処理する。

4.0 では PK モジュール自体が PSA 前提に書き直され、これらの橋渡しは不要になる方向である。

## 5. ドライバ — ハードウェアとセキュアエレメントの接続

PSA Crypto 実装の内部には、**ドライバラッパー**（`psa_crypto_driver_wrappers`）という層があり、
各 API 呼び出しを「ソフトウェア実装」「ハードウェアアクセラレータ」「セキュアエレメント」のどれかに振り分ける。

| ドライバの種類 | 鍵の場所（location） | 何をするか | 例 |
|---|---|---|---|
| **透過ドライバ**（transparent） | 0（ローカル） | 鍵の値はソフトウェアが持ち、**計算だけ**をハードウェアに任せる。AES・SHA アクセラレータ、ECC アクセラレータ | ST の CRYP/HASH、NXP の CASPER/Hashcrypt、Nordic の CryptoCell（cc3xx） |
| **不透明ドライバ**（opaque） | 1 以上 | **鍵がドライバの向こう側**にある。実装は鍵の値を知らない。署名や復号をチップに依頼する | STSAFE-A、SE05x、OPTIGA Trust M、CryptoCell の KMU、TrustZone 上の別 PSA 実装 |

ドライバは、`psa_crypto_driver_wrappers.h` が呼ぶ**決まった名前の関数**（`xxx_sign_hash()`、`xxx_import_key()`、`xxx_export_public_key()` など）を実装した C ファイルであり、
Mbed TLS の JSON ドライバ記述（`scripts/driver_templates/`）からラッパーを生成する仕組みがある（3.x では手書きの `psa_crypto_driver_wrappers.c` を差し替える方法も使われた）。

アプリケーションから見ると、**ドライバの存在は lifetime の location 以外では見えない**。
ベンダ SDK が提供する PSA 実装を使うとき、「この SDK では `PSA_KEY_LOCATION_xxx` を指定すると鍵がセキュアエレメントに入る」という一行がドキュメントにあるはずで、それだけを読めばよい。

```fig
s15_driver
```

> **組み込み鍵（builtin key）.**
>
> チップに焼かれたハードウェア固有鍵（HUK）や、ROM に置かれた検証用公開鍵は、`psa_import_key()` を通らずに最初から存在する。
> Mbed TLS では `MBEDTLS_PSA_CRYPTO_BUILTIN_KEYS` を有効にし、
> `mbedtls_psa_platform_get_builtin_key()` を実装して「この鍵 ID は、このドライバのこのスロットにある」と答える。
> アプリケーションは決められた鍵 ID（TF-M では `TFM_BUILTIN_KEY_ID_HUK` = 0x7FFF815B など）を渡すだけである。

## 6. ベンダ SDK での実際

| ベンダ / SDK | PSA の提供形態 |
|---|---|
| Nordic nRF Connect SDK（SDK＝ベンダが配る開発キット） | **PSA が標準**。`CONFIG_NRF_SECURITY`、`CONFIG_PSA_WANT_*` を Kconfig（Linux 由来のメニュー式設定システム）で指定。nRF5340 / nRF54L では TF-M 上、nRF52 では Mbed TLS 単体。CryptoCell（Arm 設計の暗号エンジン）と KMU（鍵管理ユニット。鍵を CPU から見えない場所に置く回路）をドライバとして統合 |
| ST STM32Cube | X-CUBE-CRYPTOLIB / STM32Cube PSA。STM32U5/H5/WBA では TF-M（STM32CubeU5 の TFM_Appli）または STiRoT 上。STSAFE-A のドライバ |
| NXP MCUXpresso SDK | Mbed TLS 3.x + PSA。LPC55S69 / i.MX RT は TF-M サンプルあり。SE05x の PSA ドライバは Plug & Trust ミドルウェア |
| Renesas RA FSP | PSA Crypto を FSP のモジュール（`rm_psa_crypto`）として提供。SCE/RSIP がドライバ |
| Espressif ESP-IDF | Mbed TLS 3.x を同梱。PSA API は使えるが、ESP-IDF のセキュア機能（eFuse——一度だけ書ける電気ヒューズ——の鍵、HMAC 周辺機器）は独自 API。TF-M なし |
| Silicon Labs Gecko SDK | PSA Crypto が標準。Secure Vault（Series 2 チップの鍵保護機能）の鍵ラップ（鍵を別の鍵で包んで保存すること）を不透明ドライバで提供 |
| Infineon ModusToolbox | PSoC 64 は TF-M。OPTIGA Trust M の PSA ドライバ |
| Zephyr RTOS | Mbed TLS / TF-PSA-Crypto をモジュールとして統合。`CONFIG_PSA_CRYPTO_CLIENT` / `CONFIG_BUILD_WITH_TFM` で TF-M 上も可。ITS の実装として `secure_storage` サブシステム |

**同じ `psa_*` の呼び出しが、これらすべてで動く**——それが PSA の価値である。
差は設定（Kconfig か `#define` か）とドライバの有無だけである。

## 7. 終了処理とスレッド

- `mbedtls_psa_crypto_free()`: すべての揮発鍵と操作を破棄し、ライブラリを未初期化状態に戻す。テストで初期化をやり直すときや、プロセス終了時に呼ぶ。永続鍵はストレージに残る
- **スレッド安全性**: 3.6 以降、`MBEDTLS_THREADING_C` を有効にすると PSA API はスレッドセーフ（鍵ストアをミューテックスで保護）。ただし**1 つの操作オブジェクトを複数スレッドで同時に使うことはできない**。それ以前のバージョンではアプリケーション側で排他が必要
- **割り込みハンドラから呼ばない**。フラッシュ書き込みやミューテックスが絡む

## 8. 手を動かす

### 設定を組み立てる

## 9. 仕様書に逃がす

| 項目 | 参照先 |
|---|---|
| ドライバインタフェースの完全な仕様 | Mbed TLS `docs/proposed/psa-driver-interface.md`（PSA 側では "PSA Cryptoprocessor Driver Interface" 仕様） |
| 各 `PSA_WANT_*` と `MBEDTLS_PSA_ACCEL_*`（アクセラレータで置き換える宣言）の一覧 | `include/psa/crypto_config.h`、`docs/psa-transition.md` |
| 3.x → 4.0 移行ガイド | Mbed TLS `docs/psa-transition.md`、TF-PSA-Crypto `docs/` |
| `MBEDTLS_PSA_CRYPTO_KEY_ID_ENCODES_OWNER` | TF-M で鍵 ID に所有者を埋め込む設定 |
| `MBEDTLS_PSA_CRYPTO_SPM` | Mbed TLS を TF-M のパーティションとして組み込むときの設定 |

---

## この章のポイント

- **Mbed TLS 4.0 / TF-PSA-Crypto 1.0** から暗号は PSA API のみ。新規コードは `mbedtls_*` の暗号関数を呼ばない
- 有効化は `MBEDTLS_PSA_CRYPTO_C` + `PSA_WANT_*`。鍵ペアは `_BASIC/_IMPORT/_EXPORT/_GENERATE` を個別に宣言
- マイコンでは**エントロピー源の接続が必須**。`mbedtls_hardware_poll()` か `MBEDTLS_PSA_CRYPTO_EXTERNAL_RNG`
- TLS で PSA 鍵を使うには `mbedtls_pk_setup_opaque()`
- ドライバは**透過**（計算だけ）と**不透明**（鍵ごと向こう側）。アプリケーションからは location の違いにしか見えない

→ 次: [16. TF-M での実装](16_TF-Mでの実装.md)
