# 20. Espressif — ESP32 系

> **この章の位置づけ.**
>
> ESP32 系は、**Wi-Fi / BLE 一体型で圧倒的に安価**なため、
> IoT 製品で非常に広く使われている。
>
> だが——**セキュリティ機能は「既定で無効」であり、
> 有効化しないまま出荷される事例が極めて多い。**
>
> 機能自体は充実している。**問題は「使われていない」ことである。**

> **注意:** ESP32 系は品種（ESP32 / S2 / S3 / C3 / C6 / H2 / P4 など）と
> **シリコンリビジョン**で機能が大きく異なる。
> **必ず対象品種の Technical Reference Manual と
> ESP-IDF の Security ドキュメントで確認すること。**

## 1. ファミリの整理

### ESP32 のセキュリティ機能を調べる

品種を選ぶと、対応する機能と設定手順の要点が表示される。

| 品種 | コア | 特記事項 |
|---|---|---|
| **ESP32**（初代） | Xtensa LX6 ×2 | Secure Boot v1（旧）／ **v2 はリビジョン 3 以降** |
| **ESP32-S2** | Xtensa LX7 ×1 | Secure Boot v2、Flash Encryption（XTS） |
| **ESP32-S3** | Xtensa LX7 ×2 | 上記 + AI 命令。**HMAC / DS ペリフェラル** |
| **ESP32-C3** | **RISC-V** ×1 | 低コスト。Secure Boot v2、DS ペリフェラル |
| **ESP32-C6** | RISC-V | Wi-Fi 6、Thread/Zigbee。**ESP-TEE 対応**（ESP-IDF v5.4 以降） |
| **ESP32-H2** | RISC-V | Thread/Zigbee 専用（Wi-Fi なし） |
| **ESP32-P4** | RISC-V ×2 | 高性能。無線なし |

> **「ESP32」と一括りにしないこと.**
>
> 初代 ESP32 の**リビジョン 1 では Secure Boot v2 が使えない**。
> 新規設計では、**S3 / C3 / C6 など新しい世代を選ぶこと**を強く推奨する。

## 2. eFuse — すべての土台

ESP32 のセキュリティ設定は、**すべて eFuse で制御される**（06 章）。

| eFuse ブロック | 用途 |
|---|---|
| **BLOCK0** | 各種の設定ビット（機能の有効／無効、保護フラグ） |
| **BLOCK1** | システム用（キャリブレーションなど） |
| **BLOCK2** | システム用 |
| **BLOCK3 / BLOCK_KEYn** | **ユーザ鍵の格納**（S2/S3/C3 などは KEY0〜KEY5 の 6 ブロック） |

**各ブロックには「読み出し保護」と「書き込み保護」のビットがある。**

```fig
s20_efuse
```

> **`espefuse.py` の操作は、すべて不可逆である.**
>
> ```bash
> # 必ず --do-not-confirm なしで、内容を確認してから実行する
> espefuse.py -p /dev/ttyUSB0 burn_key BLOCK_KEY0 secure_boot_key.pem SECURE_BOOT_DIGEST0
> espefuse.py -p /dev/ttyUSB0 summary        # ← 状態を確認する
> ```
>
> **間違えたチップは廃棄するしかない。**
> 量産前に、**捨ててよいチップで手順を通しで検証すること。**

### 用途ビット（KEY_PURPOSE）

**鍵ブロックに「何に使うか」を宣言する**のが優れた設計である。

| 用途 | 内容 |
|---|---|
| `SECURE_BOOT_DIGEST0/1/2` | セキュアブートの公開鍵ダイジェスト（**3 個持てる**） |
| `XTS_AES_128_KEY` / `XTS_AES_256_KEY_1/2` | Flash Encryption 用 |
| `HMAC_UP` / `HMAC_DOWN_*` | HMAC / DS ペリフェラル用 |
| `USER` | アプリケーションが自由に使う |

> **セキュアブートのダイジェストが 3 個持てるのは重要である**（12 章）。
>
> 署名鍵が漏洩したら、**その鍵を失効させて、残りの鍵で運用を継続できる**。
> `SECURE_BOOT_KEY_REVOKE0/1/2` の eFuse で個別に失効できる。
>
> **鍵の失効機構を持つのは、この価格帯の MCU では特筆すべき点である。**

## 3. Secure Boot v2

| 項目 | 内容 |
|---|---|
| **署名アルゴリズム** | **RSA-PSS 3072**（全世代）。**ECDSA**（P-192/P-256、対応品種） |
| **eFuse に焼くもの** | 公開鍵のダイジェスト（SHA-256）。**鍵本体はブートローダに含まれる** |
| **検証の連鎖** | ROM → 第 2 段ブートローダ → アプリケーション |
| **鍵の失効** | 3 個のダイジェストを個別に失効可能 |

```fig
s20_boot
```

### 有効化の手順

```bash
# menuconfig で設定
idf.py menuconfig
  → Security features
      → [*] Enable hardware Secure Boot in bootloader
      → Secure Boot: Signing scheme = RSA-3072
      → [*] Sign binaries during build
      → Secure bootloader mode = One-time flash（★推奨）

# 署名鍵を生成（★ HSM 管理を推奨。ここでは例示）
espsecure.py generate_signing_key --version 2 secure_boot_signing_key.pem

# ビルド・書き込み
idf.py build
idf.py -p /dev/ttyUSB0 flash
```

> **「Reflashable」モードを量産で使わないこと.**
>
> ESP-IDF には 2 つのモードがある。
>
> | モード | 内容 |
> |---|---|
> | **One-time flash** | eFuse にダイジェストを焼き、**以後は署名済みイメージしか書けない** |
> | **Reflashable** | 開発の利便性のため、鍵を再利用できる |
>
> **Reflashable は開発専用である。** 量産では One-time flash を使う。

### 見落としがちな設定

| eFuse | 意味 |
|---|---|
| `SECURE_BOOT_EN` | セキュアブート有効 |
| **`DIS_DOWNLOAD_MODE`** | **シリアルダウンロードモードの無効化** |
| `DIS_DIRECT_BOOT` / `DIS_LEGACY_SPI_BOOT` | 代替ブート経路の無効化 |
| **`SOFT_DIS_JTAG` / `HARD_DIS_JTAG`** | **JTAG の無効化** |
| `DIS_USB_JTAG` / `DIS_USB_SERIAL_JTAG` | USB 経由の JTAG 無効化 |

> **これが 11 章のチェックリストそのものである.**
>
> **Secure Boot を有効にしても、
> シリアルダウンロードモードや JTAG が開いていたら意味がない。**
>
> ESP-IDF の menuconfig には
> `Security features → UART ROM download mode` の設定があり、
> **Permanently disabled** を選べる。
>
> **量産では必ず無効化すること。**

## 4. Flash Encryption

**外付け SPI フラッシュの内容を暗号化する**（06 章）。

| 項目 | 内容 |
|---|---|
| **アルゴリズム** | **AES-256 XTS**（S2/S3/C3 以降）／ ESP32 初代は AES-256（tweak 付き ECB 相当） |
| **鍵の場所** | **eFuse の鍵ブロック**。読み出し保護をかける |
| **透過性** | フラッシュコントローラが自動で復号する。**XIP のまま動く** |
| **暗号化される範囲** | ブートローダ、パーティションテーブル、アプリ、NVS 鍵など（設定による） |

### Development モードと Release モード

**この違いが決定的に重要である。**

| モード | 内容 | 用途 |
|---|---|---|
| **Development** | **平文のイメージを書き込める**（チップが暗号化してくれる）。UART ダウンロード可 | 開発中のみ |
| **Release** | **平文の書き込みを禁止**。UART ダウンロードで復号もできない | **量産必須** |

> **Development モードのまま出荷する事故が実際にある.**
>
> Development モードでは、**攻撃者が UART 経由で平文を書き込める**。
> つまり**任意のファームウェアを動かせる**。Flash Encryption の意味がない。
>
> ```text
> Security features
>   → Enable flash encryption on boot
>   → Enable usage mode = Release   ★ 必ず Release
> ```
>
> **一度 Release にすると Development には戻せない。**
> だからこそ、**量産前に Release モードで全機能を検証すること**（14 章）。

### Flash Encryption が守るもの・守らないもの

| 守る | 守らない |
|---|---|
| フラッシュを外して読まれる（機密性） | **完全性**（改ざんの検出）← Secure Boot が担当 |
| SPI バスの盗聴 | 実行中の RAM の内容 |
| クローン（鍵がチップ固有） | サイドチャネル攻撃 |

> **Secure Boot と Flash Encryption は、必ず両方有効にすること.**
>
> | 有効にしたもの | 残る穴 |
> |---|---|
> | Secure Boot のみ | フラッシュを読める → 鍵やロジックが漏れる |
> | Flash Encryption のみ | **改ざんを検出できない**（06 章の「暗号化 ≠ 完全性」） |
> | **両方** | 実用上の防御が成立する |

## 5. HMAC と DS ペリフェラル

**ESP32-S2/S3/C3 以降が持つ、非常に有用な機能である。**

### HMAC ペリフェラル

```fig
s20_hmac
```

| 用途 | 内容 |
|---|---|
| チャレンジ・レスポンス認証 | サーバとの相互認証 |
| **鍵導出** | HMAC を KDF として使い、用途別の鍵を派生させる |
| JTAG の一時的な有効化 | HMAC でトークンを検証して JTAG を開く（**認証付きデバッグ相当**） |

### DS（Digital Signature）ペリフェラル

**これが最も特徴的な機能である。**

```fig
s20_ds
```

| 効果 | 内容 |
|---|---|
| **TLS クライアント認証の秘密鍵を保護できる** | ファームウェアを読まれても鍵が取れない |
| **鍵がチップに縛られる** | 別のチップにコピーしても使えない |
| **外付け SE なしで、ある程度の鍵保護が得られる** | BOM コストが上がらない |

> **これは ESP32 系の大きな価値である.**
>
> 06 章で述べた「鍵の不可視化」を、
> **追加のチップなしで実現できる**。
>
> ESP-IDF には `esp_secure_cert_mgr` というコンポーネントがあり、
> **DS ペリフェラルを使った TLS クライアント認証**が
> AWS IoT / Azure IoT との接続で使える。
>
> ただし——**物理攻撃（クラス 4 以上）への耐性は、
> 専用のセキュアエレメントには及ばない**ことを理解しておくこと（22 章）。

## 6. NVS 暗号化

**設定値やユーザデータを保存する NVS（Non-Volatile Storage）も暗号化できる。**

| 項目 | 内容 |
|---|---|
| **鍵の保管** | 専用パーティションに保存し、**Flash Encryption で保護する** |
| **または** | HMAC ペリフェラルから導出する（対応品種） |
| **暗号化方式** | AES-XTS |

> **Wi-Fi のパスワードやクラウドのトークンは、NVS に保存されることが多い.**
>
> **NVS 暗号化を有効にしないと、フラッシュを読むだけでこれらが取れる。**
> Flash Encryption を有効にしていれば間接的に守られるが、
> **NVS 暗号化も併せて有効にするのが正しい構成である。**

## 7. ESP-TEE（新しい取り組み）

**ESP-IDF v5.4 以降、ESP32-C6 向けに ESP-TEE が導入された。**

| 項目 | 内容 |
|---|---|
| **仕組み** | **APM**（Access Permission Management）による、Secure / Non-secure の分離 |
| **提供するもの** | セキュアサービス（暗号、ストレージ、アテステーション） |
| **位置づけ** | TrustZone-M に相当する機能を、RISC-V + APM で実現する |

> **RISC-V には標準の TrustZone 相当がない**（07 章）ので、
> **ベンダ独自の機構で埋めている**という構図である。
>
> 対応品種と成熟度は発展途上なので、
> **採用を検討する場合は、最新の ESP-IDF ドキュメントで
> 対応状況を確認すること。**

## 8. ESP32 の設定チェックリスト

**この章の内容を、実行可能な形にまとめる。**

| # | 確認項目 | 設定場所 |
|---|---|---|
| 1 | **Secure Boot v2 が有効か** | menuconfig → Security features |
| 2 | **One-time flash モードか**（Reflashable でないか） | 同上 |
| 3 | **署名鍵は HSM で管理されているか**（12 章） | 運用 |
| 4 | **Flash Encryption が有効か** | menuconfig |
| 5 | **Release モードか**（Development でないか） | menuconfig |
| 6 | **NVS 暗号化が有効か** | menuconfig + パーティションテーブル |
| 7 | **UART ダウンロードモードが無効化されているか** | eFuse `DIS_DOWNLOAD_MODE` |
| 8 | **JTAG が無効化されているか** | eFuse `SOFT/HARD_DIS_JTAG`、`DIS_USB_JTAG` |
| 9 | **eFuse の読み出し保護・書き込み保護が焼かれているか** | `espefuse.py summary` |
| 10 | **鍵の失効機構を理解し、予備の鍵を準備しているか** | 運用 |
| 11 | **秘密鍵は DS ペリフェラルで保護されているか** | esp_secure_cert |
| 12 | **OTA が署名検証つきか、ロールバック防止が有効か**（13 章） | menuconfig `Enable app rollback support` |
| 13 | **TLS の証明書検証が有効か**（16 章） | コード |
| 14 | **ファームウェアに秘密が埋まっていないか**（11 章） | CI の `strings` チェック |

```bash
# 出荷前に必ず実行する確認コマンド
espefuse.py -p /dev/ttyUSB0 summary
# → SECURE_BOOT_EN = True
# → SPI_BOOT_CRYPT_CNT が Release 相当の値
# → DIS_DOWNLOAD_MODE = True
# → 鍵ブロックが読み出し保護されている
```

## 9. 実務上の注意点

| 注意点 | 内容 |
|---|---|
| **ブートローダのサイズ制限** | Secure Boot 有効時にブートローダが大きくなり、パーティションに収まらないことがある |
| **起動時間の増加** | 署名検証と復号で数十〜数百 ms 増える |
| **OTA イメージのサイズ** | 署名が付く分、パーティション設計に余裕を持たせる |
| **一度きりの設定** | eFuse は不可逆。**捨ててよいチップで全手順を検証する** |
| **モジュール品** | ESP32-WROOM などのモジュールでも、eFuse の操作は同じ |
| **Espressif の事前プロビジョニング** | モジュールに鍵と証明書を事前注入するサービスがある（12 章） |

> **「起動時間が伸びる」は製品要件に影響する.**
>
> 電池駆動で「ボタンを押したら即座に反応する」製品では、
> Secure Boot + Flash Encryption の起動時間増加が問題になりうる。
>
> **企画段階で実測し、要件に織り込むこと。**
> 後から「起動が遅いのでセキュリティを切る」は最悪の判断である。

## 10. この章のまとめ

| ポイント | 内容 |
|---|---|
| 最大の問題 | 機能はあるが、**既定で無効**。有効化されないまま出荷される |
| 品種差 | **初代 ESP32 のリビジョン 1 では Secure Boot v2 が使えない** |
| eFuse | すべての設定の土台。**不可逆**。捨てチップで手順を検証する |
| 鍵ブロック | **用途ビット（KEY_PURPOSE）**で宣言する。優れた設計 |
| Secure Boot v2 | RSA-PSS 3072 / ECDSA。**ダイジェストを 3 個持て、個別に失効できる** |
| 量産設定 | **One-time flash**。Reflashable は開発専用 |
| Flash Encryption | **Release モード必須**。Development のままだと平文を書き込める |
| 両方必須 | **Secure Boot（完全性）と Flash Encryption（機密性）**は片方では不十分 |
| DS ペリフェラル | **秘密鍵を CPU に見せずに署名できる**。外付け SE なしで鍵を保護できる |
| 忘れがちな設定 | **UART ダウンロードモードと JTAG の無効化**（11 章） |
| NVS 暗号化 | Wi-Fi パスワードやトークンを守るために併せて有効化する |
| ESP-TEE | ESP32-C6 以降。RISC-V での分離機構（発展途上） |
| 起動時間 | 数十〜数百 ms 増える。**企画段階で織り込む** |

次章は、その他の主要ベンダをまとめて見る。

→ 次章: [21. Nordic・Silicon Labs・TI・Microchip・Renesas・Infineon](21_その他ベンダ.md)
