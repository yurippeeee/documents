# 16. TF-M での実装 — 壁の向こうで PSA を動かす

> **この章のゴール.**
>
> TF-M の構造（SPE / NSPE、SPM、パーティション、ベニア）を理解し、
> 非セキュア側から PSA API を呼ぶときに**何が起きているか**、
> ビルドの主要オプション、そして TF-M 固有のエラー（`PROGRAMMER_ERROR`、メモリ検査、クライアント ID）を説明できるようになること。

## 1. TF-M とは

**TF-M**（Trusted Firmware-M）は、Arm が主導する **Cortex-M 向けセキュアファームウェアの参照実装**である。
PSA Certified の「PSA-RoT」（PSA Root of Trust、信頼の起点となる最小限のセキュアなソフトウェア）をそのまま形にしたもので、
**PSA Functional API のサーバ側**——Crypto、ITS、PS、Initial Attestation、Firmware Update、Platform の各サービス——を提供する。

前提となるハードウェアは **Armv8-M の TrustZone**（Cortex-M23 / M33 / M35P / M55 / M85）である。
CPU がセキュア状態と非セキュア状態を持ち、メモリと周辺機器を SAU / IDAU（セキュリティ属性ユニット）で 2 つの世界に分ける（iotsec 編 7 章）。
TrustZone のないコア（Cortex-M4 など）でも、デュアルコア（CPU コアが 2 つある構成）で片方をセキュア専用にする構成（PSoC 64、LPC55S69 の一部構成）で動く。

```fig
s16_arch
```

| 用語 | 意味 |
|---|---|
| **SPE**（Secure Processing Environment） | セキュア側の世界。TF-M 本体と PSA サービスが動く |
| **NSPE**（Non-Secure Processing Environment） | 非セキュア側。RTOS とアプリケーションが動く。読者のコードはここ |
| **SPM**（Secure Partition Manager） | セキュア側のカーネルに相当。パーティションの起動、呼び出しの振り分け、隔離の実施 |
| **セキュアパーティション**（Secure Partition） | 1 つのサービスを収めた「部屋」。Crypto パーティション、ITS パーティションなど。マニフェスト（YAML——人が読み書きしやすい設定ファイル形式——で書く宣言書）で権限・メモリ・提供するサービスを宣言 |
| **PSA-RoT / Application RoT** | パーティションの格。PSA-RoT は TF-M 標準のサービス、ARoT はベンダやアプリケーションが追加するもの。隔離レベルによって扱いが変わる |
| **ベニア**（veneer） | NSPE から SPE への入口関数。Armv8-M の `SG`（Secure Gateway）命令で始まる小さなコード。非セキュア側はここにしか飛べない |
| **BL2** | TF-M のブートローダ。実体は MCUboot。SPE と NSPE のイメージを検証してから起動する |

## 2. 呼び出しの流れ — `psa_sign_hash()` が壁を越えるまで

非セキュア側のアプリケーションが `psa_sign_hash(key, alg, hash, 32, sig, 64, &len)` を呼ぶと、次のことが起きる。

1. **NS インタフェースライブラリ**（`tfm_ns_interface`、`libtfm_api_ns.a`）の `psa_sign_hash()` が呼ばれる。これは本物ではなく、引数を**入出力ベクタ**（`psa_invec` / `psa_outvec`——「このアドレスからこの長さ」の記述）にまとめ、`psa_call()` を呼ぶスタブ
2. `psa_call()` は、RTOS 用のロック（`tfm_ns_interface_dispatch()` の中のミューテックス）を取り、**ベニア**（`tfm_psa_call_veneer`）に分岐する
3. ベニアの `SG` 命令で CPU がセキュア状態に切り替わる。**非セキュア側のレジスタとスタックはそのまま**で、SPM がそれを引き取る
4. SPM は、渡されたポインタが**すべて非セキュア側のメモリを指しているか検査**する（セキュア側のメモリを指していたら `PSA_ERROR_PROGRAMMER_ERROR`——非セキュア側がセキュアメモリを読み書きさせようとする攻撃を防ぐ）
5. SPM が Crypto パーティションに要求を渡す（隔離レベルによっては別スタック・別 MPU 設定に切り替える）
6. Crypto パーティションの中で、**本物の**（Mbed TLS / TF-PSA-Crypto の）`psa_sign_hash()` が実行される。鍵は Crypto パーティションのメモリか ITS にある
7. 結果を outvec のバッファ（非セキュア側）に書き、`psa_status_t` を返してセキュア状態から復帰する

往復のコストは、TF-M の隔離レベル 1 で数 µs、レベル 2〜3 で 10〜20 µs 程度（Cortex-M33 100 MHz）。
署名 1 回（数 ms）に比べれば無視できるが、**1 バイトずつ `psa_hash_update()` を呼ぶような書き方は避ける**。

```fig
s16_call
```

### 2.1 SFN モデルと IPC モデル

パーティションが要求を受け取る方式が 2 つある。

| | **SFN**（Secure Function）モデル | **IPC** モデル |
|---|---|---|
| 仕組み | SPM がパーティションの関数を直接呼ぶ | パーティションが自分のスレッドで `psa_wait()` して要求を待つ |
| 特徴 | 小さく速い。Profile Small / Medium の既定 | パーティション間の非同期通信ができる。Profile Large |
| アプリケーションへの影響 | **なし**。どちらも NSPE からは同じ `psa_*` |

### 2.2 隔離レベル

| レベル | 何が隔離されるか | 用途 |
|---|---|---|
| **1** | SPE と NSPE だけ。セキュア側のパーティションは互いに読める | 小さな製品。Profile Small |
| **2** | さらに PSA-RoT と ARoT の間を MPU で隔離 | 標準。Profile Medium の既定 |
| **3** | すべてのパーティションを互いに隔離 | PSA Certified Level 3 を狙う製品 |

レベルが上がるほど、呼び出しごとの MPU 再設定で遅くなり、RAM も増える。

## 3. ビルド

TF-M は CMake（ビルド手順を記述する汎用ツール）で構築する。主要オプションだけ示す。

```sh
git clone https://git.trustedfirmware.org/TF-M/trusted-firmware-m.git
cd trusted-firmware-m
cmake -S . -B build \
      -DTFM_PLATFORM=arm/mps2/an521 \          # または stm/stm32u5xx など
      -DTFM_TOOLCHAIN_FILE=toolchain_GNUARM.cmake \
      -DTFM_PROFILE=profile_medium \            # small / medium / medium_arot-less / large
      -DTFM_ISOLATION_LEVEL=2 \
      -DTFM_PARTITION_CRYPTO=ON \
      -DTFM_PARTITION_INTERNAL_TRUSTED_STORAGE=ON \
      -DTFM_PARTITION_PROTECTED_STORAGE=ON \
      -DTFM_PARTITION_INITIAL_ATTESTATION=ON \
      -DTFM_PARTITION_PLATFORM=ON \
      -DBL2=ON \                                # MCUboot を使う
      -DMCUBOOT_IMAGE_NUMBER=2 \                # S と NS を別イメージに
      -DCMAKE_BUILD_TYPE=MinSizeRel
cmake --build build -- install
```

`install` で `build/api_ns/` に **NSPE 側が必要なもの一式**（ヘッダ `psa/*.h`、`libtfm_api_ns.a`、ベニアのアドレスを持つ `s_veneers.o`、リンカスクリプト（メモリ配置を決めるリンカの設定ファイル）の断片、`platform/` の設定）が出力される。
非セキュア側のアプリケーションはこれをリンクするだけで PSA API が呼べる。

| オプション | 意味 |
|---|---|
| `TFM_PROFILE` | 機能セットの既定値。**small**: Crypto（対称のみ）+ ITS、レベル 1。**medium**: 非対称暗号 + PS + 認証、レベル 2。**large**: IPC、全機能、レベル 3 |
| `TFM_PARTITION_*` | 各サービスの有無。切ればフラッシュが減る |
| `CRYPTO_ASYM_SIGN_MODULE_ENABLED` など | Crypto パーティション内の機能単位の ON/OFF |
| `TFM_MBEDCRYPTO_CONFIG_PATH` / `TFM_MBEDCRYPTO_PSA_CRYPTO_CONFIG_PATH` | Mbed TLS の設定ヘッダ（`PSA_WANT_*`）を差し替える |
| `ITS_MAX_ASSET_SIZE` / `PS_MAX_ASSET_SIZE` | ストレージの 1 オブジェクトの最大サイズ（13 章） |
| `CRYPTO_ENGINE_BUF_SIZE` | Crypto パーティションのヒープ。RSA を使うなら増やす（既定 0x2000 前後） |
| `TFM_NS_MANAGE_NSID` | 複数の NS クライアント ID を RTOS が管理する |
| `CONFIG_TFM_ENABLE_FP` | セキュア側で FPU（浮動小数点演算ユニット）を使うか |

```fig
s16_build
```

## 4. 非セキュア側の書き方

### 4.1 初期化

RTOS を使うなら、**NS インタフェースにロックを与える**必要がある（複数スレッドが同時にセキュア側を呼ぶのを直列化する）。

```c
#include "tfm_ns_interface.h"

/* RTOS 用: セキュア呼び出しの直列化 */
static SemaphoreHandle_t s_lock;
int32_t tfm_ns_interface_dispatch(veneer_fn fn, uint32_t a0, uint32_t a1, uint32_t a2, uint32_t a3)
{
    xSemaphoreTake(s_lock, portMAX_DELAY);
    int32_t r = fn(a0, a1, a2, a3);
    xSemaphoreGive(s_lock);
    return r;
}
uint32_t tfm_ns_interface_init(void) { s_lock = xSemaphoreCreateMutex(); return s_lock ? 0 : 1; }
```

TF-M には FreeRTOS / RTX / Zephyr 向けのこの実装が同梱されている（`interface/src/os_wrapper/`）。

その後は、通常どおり `psa_crypto_init()` を呼ぶ。TF-M では実体は「セキュア側がすでに初期化済み」の確認である。

### 4.2 メモリの規則

**セキュア側に渡すバッファは、すべて非セキュア側の RAM になければならない。**

- スタック上・静的配列・ヒープ: 可
- **フラッシュ上の定数**（`const uint8_t key[] = {...}` を `psa_import_key()` に渡す）: プラットフォームによっては NG。SPM の検査で非セキュア側のフラッシュが「読める領域」として登録されていれば可だが、そうでなければ `PSA_ERROR_PROGRAMMER_ERROR`。**RAM にコピーしてから渡す**のが安全
- 別のセキュア領域（他の TrustZone ソフトウェア）のアドレス: 不可

`PSA_ERROR_PROGRAMMER_ERROR`（−129）を見たら、まず**ポインタの指す先**を疑う。

### 4.3 クライアント ID と鍵の所有

TF-M は、呼び出し元ごとに**クライアント ID**（`int32_t`）を持つ。セキュアパーティションは正、非セキュア側は負（既定 −1）である。
PSA 鍵は「作ったクライアント」の所有になり、**他のクライアントは同じ鍵 ID を指定しても使えない**（`PSA_ERROR_INVALID_HANDLE`）。
ITS の UID も同様に名前空間が分かれる（13 章）。

非セキュア側の RTOS が複数のスレッドやプロセスを別クライアントとして扱う（`TFM_NS_MANAGE_NSID`）と、スレッド A が作った鍵はスレッド B から見えなくなる。
既定では非セキュア側全体が 1 つのクライアント（−1）なので、通常は気にしなくてよい。

```fig
s16_client
```

## 5. セキュア側に自分のコードを置く

「鍵を使う処理そのもの」を非セキュア側から見えなくしたい——例えば「乗っ取られても暗号化ログの復号鍵は使わせない」——なら、**自分のセキュアパーティション**を作る。

1. `partitions/my_service/` にマニフェスト `my_service.yaml`（名前、パーティション ID、提供するサービス名と SID——サービスを識別する 32 ビット番号——、必要な権限、スタックサイズ）と実装 `my_service.c` を書く
2. サービスの入口関数で `psa_invec` から引数を受け取り、PSA Crypto API（パーティション内から直接呼べる）で処理し、`psa_outvec` に書く
3. NSPE 側の呼び出しスタブ（`psa_call(handle, type, in_vec, in_len, out_vec, out_len)` を包む関数）を書く
4. `tfm_manifest_list.yaml` にパーティションを登録し、ビルドする

これは FF-M（Firmware Framework for M）の仕様に従う作業で、TF-M のドキュメント "Adding Secure Partition" が手順を示している。
Crypto / ITS などの標準サービスを使うだけなら不要である。

## 6. デバッグ

- **セキュア側のログ**: `TFM_SPM_LOG_LEVEL` / `TFM_PARTITION_LOG_LEVEL` で UART に出す。パーティションがどのエラーを返したかが分かる
- **`PSA_ERROR_PROGRAMMER_ERROR`**: ポインタの領域違反。マニフェストの MMIO/メモリ宣言、フラッシュ定数の直接渡し
- **`PSA_ERROR_CONNECTION_REFUSED` / `CONNECTION_BUSY`**: サービスが無効（パーティションを OFF でビルドした）か、IPC モデルで同時接続数を超えた
- **`PSA_ERROR_INSUFFICIENT_MEMORY`（Crypto）**: `CRYPTO_ENGINE_BUF_SIZE` 不足。RSA 鍵生成や大きな AEAD で発生
- **ハードフォールト（セキュア側。CPU が回復不能な例外で停止すること）**: 隔離レベル 2 以上でパーティションが権限外のメモリに触った。ARoT の MPU 設定とマニフェストの `mmio_regions` を確認
- **デバッガ**: セキュア側にブレークポイントを置くには、デバッグ認証（DAuth）が許可されている必要がある。製品のライフサイクル `SECURED` では通常不可

## 7. 手を動かす

### 壁越しの呼び出しを追う

## 8. 仕様書に逃がす

| 項目 | 参照先 |
|---|---|
| FF-M（Firmware Framework for M）仕様: `psa_connect` / `psa_call` / `psa_close`、マニフェスト形式、SID | Arm "PSA Firmware Framework for M" 1.1 |
| TF-M のプラットフォームポート（新しいチップに移植する） | TF-M docs "Platform integration guide" |
| MCUboot の署名鍵の差し替え、イメージの署名手順 | TF-M docs "Secure boot"、`bl2/ext/mcuboot/` |
| プロビジョニング（HUK、IAK、ライフサイクルの書き込み） | TF-M docs "Provisioning"、`platform/ext/common/provisioning_bundle` |
| Firmware Update パーティション（`psa_fwu_*`） | TF-M docs "Firmware Update Service"、PSA Firmware Update API 1.0 |

---

## この章のポイント

- TF-M は **PSA API のサーバ側**。SPE（セキュア側）にパーティションとして Crypto / ITS / PS / Attestation を置く
- NSPE の `psa_*` は**スタブ**であり、引数をベクタにして `psa_call` → **ベニア** → SPM → パーティションの本物へ届く
- **渡すバッファは非セキュア側の RAM**。フラッシュ定数の直接渡しは `PROGRAMMER_ERROR` の元
- RTOS では `tfm_ns_interface_dispatch()` にロックを実装する
- 鍵と ITS はクライアントごとに所有される。既定では NSPE 全体が 1 クライアント（−1）
- ビルドは `TFM_PROFILE` + `TFM_PARTITION_*` + `ITS_MAX_ASSET_SIZE` / `CRYPTO_ENGINE_BUF_SIZE` を押さえる

→ 次: [17. 実践パターン](17_実践パターン.md)
