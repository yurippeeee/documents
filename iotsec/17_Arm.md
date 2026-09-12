# 17. Arm のセキュリティアーキテクチャ

> **この章がなぜ必要なのか——Arm が業界の共通語だから.**
>
> IoT 向け MCU の大多数が Arm コアを採用している。
> そして各社の「独自機能」の多くは、**Arm が定めた枠組みの上に載っている**。
>
> だから **Arm の考え方（TrustZone-M、PSA、TF-M）を先に理解すると、
> 18〜21 章の各社の説明が「その会社流の実装」として整理できる。**

> **注意:** 以下は執筆時点の公開情報に基づく概観である。
> 具体的な対応状況は、**必ず対象品種のデータシートと Arm の公式資料で確認すること。**

## 1. Arm のセキュリティ製品群の地図

### Arm のセキュリティ機能マップ

コアや機能を選ぶと、それが何を提供し、どの章の概念に対応するかが表示される。

| 層 | 名称 | 内容 |
|---|---|---|
| **アーキテクチャ** | **TrustZone-M**（Armv8-M） | Secure / Non-secure の分離（07 章） |
| **アーキテクチャ** | **TrustZone-A**（Armv7-A/v8-A） | アプリケーションプロセッサ向けの分離 |
| **アーキテクチャ** | **PACBTI**（Armv8.1-M） | 制御フロー保護（15 章） |
| **アーキテクチャ** | **CCA / RME**（Armv9-A） | Realm による、ハイパーバイザからも隔離された実行環境 |
| **IP** | **CryptoCell / CryptoIsland** | 暗号サブシステム。ベンダが SoC に組み込む |
| **仕様** | **PSA**（Platform Security Architecture） | セキュリティ要件・API・認証の枠組み |
| **実装** | **Trusted Firmware-M / -A** | 参照実装（オープンソース） |
| **仕様** | **ADAC** | 認証付きデバッグ（11 章） |
| **認証** | **PSA Certified** | 第三者評価プログラム（03 章） |

## 2. Cortex-M のセキュリティ機能の世代

| コア | アーキテクチャ | TrustZone | 特記事項 |
|---|---|---|---|
| **Cortex-M0/M0+/M1** | Armv6-M | なし | MPU（オプション） |
| **Cortex-M3/M4/M7** | Armv7-M | なし | MPU。**現役だが新規設計では推奨しにくい** |
| **Cortex-M23** | Armv8-M Baseline | **あり** | 低消費電力。TrustZone 入門 |
| **Cortex-M33** | Armv8-M Mainline | **あり** | **最も広く使われる**。DSP / FPU オプション |
| **Cortex-M35P** | Armv8-M Mainline | あり | **物理セキュリティ機能**（耐タンパ、パリティ）を追加 |
| **Cortex-M55** | Armv8.1-M | あり | Helium（MVE）。AI 向け。**PACBTI 対応** |
| **Cortex-M85** | Armv8.1-M | あり | 高性能。**PACBTI 対応** |

> **新規設計で TrustZone が欲しいなら、Cortex-M33 が現実的な第一候補である.**
>
> ほぼすべての主要ベンダが M33 ベースの品種を持っている。
> - ST: STM32L5 / U5 / H5 / WBA
> - NXP: LPC55S6x、i.MX RT500/600
> - Nordic: nRF5340、nRF9160、nRF54L
> - Renesas: RA4M2/RA6M4 など
> - Silicon Labs: EFR32 Series 2 の一部
> - Microchip: SAM L11 は M23
> - TI: CC13x4/CC26x4
> - Infineon: PSoC 64 / PSoC Edge

### Cortex-M35P の位置づけ

**M33 に物理攻撃対策を加えたコア**である。

| 機能 | 内容 |
|---|---|
| 命令キャッシュのパリティ | ビット反転の検出 |
| アンチタンパリング機能 | 物理攻撃の検出支援 |
| （実装依存の追加機能） | ベンダが組み合わせる |

> **ただし「M35P を選べば物理攻撃に強い」わけではない.**
>
> コアだけでなく、**メモリ・暗号エンジン・電源系まで含めた SoC 全体の設計**が要る。
> 実際の耐性は、**PSA Certified Level 3 や CC の取得状況**で判断すること（03 章）。

### PACBTI（Armv8.1-M）

15 章で触れた制御フロー保護である。

| 機能 | 内容 |
|---|---|
| **PAC** | 戻りアドレスに認証コードを付与。改ざんを検出 |
| **BTI** | 間接分岐の飛び先が正当な landing pad かを検証 |

**ROP / JOP 攻撃への直接的な対策**であり、
**メモリ安全性のバグを実際の攻撃に変換することを困難にする**。

コンパイラの `-mbranch-protection=standard` で有効化する。

## 3. TrustZone-M の実装詳細

07 章で概念を扱ったので、ここでは実装に関わる点を補う。

### SAU と IDAU の関係

```fig
s17_sau
```

| ユニット | 誰が決めるか | 変更 |
|---|---|---|
| **IDAU** | **チップベンダ**がシリコンに実装 | 不可 |
| **SAU** | ソフトウェア（Secure 側のみ） | 可能（起動時に設定） |

> **IDAU の設計はベンダごとに大きく違う.**
>
> よくあるのは、**アドレスのビット 28（0x1000_0000）で Secure / Non-secure を分ける**方式である。
>
> ```fig
> s17_alias
> ```
>
> つまり**同じ物理メモリが 2 つのアドレスに見える**。
> この「エイリアス」の理解が、TrustZone-M 開発の最初の壁になる。
>
> **どのアドレスが何にマップされるかは、必ずベンダのリファレンスマニュアルで確認すること。**

### 開発ツールの対応

| 項目 | 内容 |
|---|---|
| **プロジェクトの分割** | Secure プロジェクトと Non-secure プロジェクトを別々にビルドする |
| **インポートライブラリ** | Secure 側が `--out-implib` で生成し、Non-secure 側がリンクする |
| **CMSE の属性** | `__attribute__((cmse_nonsecure_entry))` で入口関数を宣言 |
| **ベニア (veneer)** | コンパイラが NSC 領域に自動生成する |
| **デバッグ** | 両方のプロジェクトを同時にデバッグできる環境が必要 |

```c
/* Secure 側: Non-secure から呼べる関数 */
#include <arm_cmse.h>

int32_t __attribute__((cmse_nonsecure_entry))
secure_get_random(uint8_t *buf, size_t len)
{
    /* ★ ポインタ検証（07 章） */
    if (cmse_check_address_range(buf, len,
            CMSE_NONSECURE | CMSE_MPU_READWRITE) == NULL) {
        return -1;
    }
    return trng_read(buf, len);
}
```

```c
/* Non-secure 側: 生成されたヘッダをインクルードして普通に呼ぶ */
#include "secure_interface.h"

uint8_t buf[32];
if (secure_get_random(buf, sizeof(buf)) != 0) { /* エラー処理 */ }
```

## 4. PSA — Platform Security Architecture

**Arm が定めた、IoT セキュリティの包括的な枠組みである。**

### 4 つの段階

| 段階 | 内容 |
|---|---|
| **Analyze** | 脅威モデル（Threat Model and Security Analysis, TMSA）を作る（02 章） |
| **Architect** | セキュリティ要件を満たすアーキテクチャを設計する |
| **Implement** | **TF-M** などで実装する |
| **Certify** | **PSA Certified** で第三者評価を受ける（03 章） |

### PSA の 10 のセキュリティ目標

PSA Certified Level 1 の質問票は、次の目標に沿っている。

| # | 目標 |
|---|---|
| 1 | 一意の識別（Unique Identification） |
| 2 | セキュリティライフサイクル（14 章） |
| 3 | アテステーション（04 章） |
| 4 | セキュアブート（05 章） |
| 5 | セキュア更新（13 章） |
| 6 | アンチロールバック（13 章） |
| 7 | 分離（07 章） |
| 8 | インタラクション（分離間の安全な通信） |
| 9 | 暗号サービス（08 章） |
| 10 | セキュアストレージ（06 章） |

> **この 10 項目が、本シリーズの第 II 部〜第 IV 部とほぼ一致する.**
>
> 偶然ではない。**PSA は、組み込みセキュリティの合意された要件集**として
> 広く参照されており、業界の共通認識になっている。
>
> **自社の設計をレビューするとき、この 10 項目でチェックするのは有効である。**

### PSA-RoT と ARoT

```fig
s17_psa
```

**PSA-RoT と ARoT を分けるのは、07 章の「Secure 側を小さく保つ」の実装である。**

## 5. PSA Functional API

**Arm が定めた、移植性のあるセキュリティ API 群である。**

| API | 用途 |
|---|---|
| **PSA Crypto API** | 暗号処理全般。鍵は**ハンドル**で管理 |
| **PSA Internal Trusted Storage (ITS)** | チップ内蔵の保護ストレージ |
| **PSA Protected Storage (PS)** | 外部メモリでも使えるよう暗号化して保存 |
| **PSA Initial Attestation API** | アテステーショントークンの生成 |
| **PSA Firmware Update API** | セキュア OTA の制御 |

### PSA Crypto API の設計

```c
#include "psa/crypto.h"

psa_crypto_init();

/* 鍵の属性を設定 */
psa_key_attributes_t attr = PSA_KEY_ATTRIBUTES_INIT;
psa_set_key_usage_flags(&attr, PSA_KEY_USAGE_SIGN_HASH);
psa_set_key_algorithm(&attr, PSA_ALG_ECDSA(PSA_ALG_SHA_256));
psa_set_key_type(&attr, PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1));
psa_set_key_bits(&attr, 256);
psa_set_key_lifetime(&attr, PSA_KEY_LIFETIME_PERSISTENT);   /* 不揮発に保存 */

/* ★ チップ内で鍵を生成する（12 章の方式 B） */
psa_key_id_t key_id;
psa_generate_key(&attr, &key_id);

/* 使う: 鍵の値は返ってこない */
uint8_t sig[64]; size_t sig_len;
psa_sign_hash(key_id, PSA_ALG_ECDSA(PSA_ALG_SHA_256),
              hash, 32, sig, sizeof(sig), &sig_len);
```

> **この API の優れた点を整理しておく.**
>
> | 点 | 内容 |
> |---|---|
> | **鍵をハンドルで扱う** | 平文の鍵がアプリケーションのメモリに現れない（06 章） |
> | **用途を宣言する** | `PSA_KEY_USAGE_SIGN_HASH` だけなら、暗号化には使えない |
> | **アルゴリズムを固定する** | 鍵ごとに 1 つ。アルゴリズム混同攻撃を防ぐ |
> | **ハードウェアに透過的** | 実装がアクセラレータを使うかは API に現れない |
> | **セキュアエレメントも同じ API** | ドライバを差し替えるだけ（22 章） |
>
> **「危険な使い方ができない API」を設計することが、最良の防御である。**

### PSA Crypto API と移植性

**PSA Crypto API は Mbed TLS の標準 API になった**（Mbed TLS 3.x 以降）。
つまり **TrustZone がないチップでも、同じ API で書ける**。

```fig
s17_migrate
```

**これは実務上、非常に大きな利点である。**

## 6. Trusted Firmware-M（TF-M）

**PSA の参照実装であり、事実上の標準になりつつある。**

| 構成要素 | 役割 |
|---|---|
| **SPM**（Secure Partition Manager） | セキュアパーティションの管理、IPC |
| **BL1 / BL2**（MCUboot ベース） | セキュアブート（05 章） |
| **Crypto Service** | Mbed TLS ベースの暗号サービス |
| **ITS / PS** | セキュアストレージ |
| **Initial Attestation** | PSA トークンの生成 |
| **Firmware Update** | OTA の制御 |
| **Platform Service** | ベンダ固有の機能（リセット理由、NV カウンタなど） |

### 分離レベル

| レベル | 内容 |
|---|---|
| **Isolation Level 1** | SPE と NSPE の分離のみ |
| **Isolation Level 2** | + PSA-RoT と ARoT の分離 |
| **Isolation Level 3** | + **各セキュアパーティション同士も分離** |

> **PSA Certified Level 2 以上では、Isolation Level 2 以上が要求される.**
>
> Level 3 は、Secure 側のパーティション同士も MPU で隔離するので、
> 「あるセキュアサービスの脆弱性が、他に波及しない」。
> **その分、実装と設定が複雑になり、性能オーバーヘッドも増える。**

### TF-M を使うか、自作するか

| 選択 | 評価 |
|---|---|
| **TF-M を使う** | 認証取得が楽。移植性が高い。**推奨** |
| **ベンダの独自 SPE** | ベンダの機能に最適化されている。移植性は低い |
| **自作** | **強く非推奨**。TrustZone の落とし穴が多すぎる（07 章） |

> **TF-M のコストも認識しておくこと.**
>
> - **フラッシュを数十〜百数十 KB 消費する**（構成による）
> - RAM も相応に使う
> - ビルドと設定が複雑（CMake、Kconfig、プラットフォームポート）
> - IPC のオーバーヘッドがある
>
> **小さなセンサノードには重すぎることがある。**
> その場合は「TrustZone は使うが TF-M は使わず、最小限の Secure 側を書く」
> という選択もありうる。ただし**認証取得は難しくなる。**

## 7. Cortex-A のセキュリティ

IoT ゲートウェイやエッジ AI 機器では Cortex-A が使われる。

| 機能 | 内容 |
|---|---|
| **TrustZone-A** | Secure World / Normal World。EL3 のモニタが切り替える（07 章） |
| **OP-TEE** | 代表的な TEE OS。GlobalPlatform API に準拠 |
| **TF-A**（Trusted Firmware-A） | EL3 のファームウェア。BL1/BL2/BL31 の構成 |
| **PAC / BTI**（Armv8.3/8.5-A） | 制御フロー保護 |
| **MTE**（Memory Tagging、Armv8.5-A） | **メモリ安全性のハードウェア支援** |
| **CCA / RME**（Armv9-A） | Realm。**ハイパーバイザからも隔離される** |

### MTE — メモリ安全性への画期的なアプローチ

```fig
s17_mte
```

> **MTE は、C/C++ のメモリ安全性問題への現実的な緩和策である.**
>
> Rust への全面移行が難しい既存コードベースに対して、
> **再コンパイルだけで（ほぼ）メモリ安全性を得られる**。
>
> 現時点では主に高性能な Cortex-A で利用可能だが、
> **将来的に組み込み向けに降りてくる可能性がある技術として、押さえておく価値がある。**

### Armv9-A CCA

```fig
s17_cca
```

**クラウドやエッジで、「インフラ提供者からもデータを守る」ための機構である。**
IoT ゲートウェイでも、マルチテナントのワークロード分離に使える可能性がある。

## 8. Arm 系を選ぶときの確認事項

| 確認項目 | 見るところ |
|---|---|
| **コアの世代** | TrustZone が要るなら Armv8-M（M23/M33/M55/M85） |
| **PACBTI** | Armv8.1-M（M55/M85）が必要 |
| **IDAU の設計** | ベンダのリファレンスマニュアル。**エイリアスアドレスの構成** |
| **周辺・DMA の分離** | ベンダ独自のコントローラ（GTZC / SPU / AHB Secure Controller など） |
| **TF-M の対応** | ベンダが公式にポートを提供しているか。**バージョンの追従状況** |
| **PSA Certified** | **Level 1 / 2 / 3 のどれを取得しているか**（03 章） |
| **PSA Functional API 認証** | Crypto API などの適合試験に通っているか |
| **暗号 IP** | CryptoCell か、ベンダ独自か。DPA 対策の有無 |
| **ADAC** | 認証付きデバッグに対応しているか（11・14 章） |

> **PSA Certified の取得レベルは、必ず PSA Certified の Web サイトで確認すること.**
>
> ベンダの資料に「PSA Certified」とだけ書かれていても、
> **Level 1 なのか Level 3 なのかで意味がまったく違う**。
>
> また、**「チップが認証されている」ことと「あなたの製品が認証される」ことは別**である。
> チップの認証は土台であって、その上のソフトウェアは別途評価される。

## 9. この章のまとめ

| ポイント | 内容 |
|---|---|
| なぜ Arm から | **業界の共通語**。各社の独自機能はこの枠組みの上に載る |
| TrustZone-M | Armv8-M（M23/M33/M35P/M55/M85）。**新規設計なら M33 が第一候補** |
| M35P | 物理セキュリティ機能を追加。ただし**SoC 全体の設計と認証で判断する** |
| PACBTI | Armv8.1-M（M55/M85）。**ROP 攻撃への直接的な対策** |
| IDAU | ベンダ固定。**エイリアスアドレスの理解が最初の壁** |
| PSA の 10 目標 | 本シリーズの第 II〜IV 部とほぼ一致。**設計レビューのチェックリストに使える** |
| PSA Crypto API | **鍵をハンドルで扱う**。危険な使い方ができない API 設計 |
| 移植性 | Mbed TLS 3.x も PSA Crypto API。**TrustZone なしから移行できる** |
| TF-M | 参照実装。**認証取得が楽**だが、フラッシュと RAM を相応に消費する |
| Cortex-A | TrustZone-A + OP-TEE。**MTE** はメモリ安全性の画期的な緩和策 |
| 確認事項 | **PSA Certified のレベル**を必ず公式サイトで確認する |

次章から、具体的なベンダの実装を見ていく。まず STMicroelectronics。

→ 次章: [18. STMicroelectronics — STM32](18_ST.md)
