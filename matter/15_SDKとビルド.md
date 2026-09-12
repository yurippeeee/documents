# 15. SDK とビルド — connectedhomeip をどう扱うか

> **この章がなぜ必要なのか——最初のビルドで挫折する人が多いから.**
>
> Matter SDK（`connectedhomeip`）は巨大である。
> サブモジュールを全部取ると **数 GB**、初回ビルドは環境によっては数十分かかる。
> 依存関係も多い。
>
> だが構造さえ分かれば怖くない。
> この章では、リポジトリの地図・ビルドの仕組み・最短で動かす手順を示す。

## 1. リポジトリの構造

```
connectedhomeip/
├── src/                     ← SDK 本体（C++）
│   ├── app/                 ← インタラクションモデル、クラスタ実装の基盤
│   │   └── clusters/        ← 各クラスタのサーバ実装
│   ├── controller/          ← コントローラ側の API
│   ├── crypto/              ← 暗号の抽象化（mbedTLS / OpenSSL / PSA など）
│   ├── credentials/         ← 証明書の処理
│   ├── lib/                 ← core、support（TLV、メモリ、ログなど）
│   ├── messaging/           ← Exchange、MRP
│   ├── protocols/           ← Secure Channel、BDX、IM
│   ├── transport/           ← UDP、TCP、BLE
│   ├── platform/            ← **プラットフォーム抽象化**（章の要）
│   │   ├── ESP32/  nrfconnect/  silabs/  Linux/  Darwin/  Android/ …
│   ├── setup_payload/       ← QR / 手動コードの生成・解析
│   └── python_testing/      ← Python のテストフレームワーク
├── examples/                ← **サンプルアプリ（ここから始める）**
│   ├── all-clusters-app/    ← ほぼ全クラスタを実装した参照実装
│   ├── lighting-app/        ← 調光・調色ライト
│   ├── lock-app/            ← ドアロック
│   ├── bridge-app/          ← ブリッジ（19 章）
│   ├── ota-provider-app/    ← OTA 配布側（18 章）
│   ├── ota-requestor-app/   ← OTA 受信側
│   ├── chip-tool/           ← **CLI コントローラ（必携）**
│   └── ...
├── zzz_generated/           ← ZAP が生成したコード（16 章）
├── credentials/             ← テスト用証明書、開発用 PAA
├── scripts/                 ← ビルド補助、環境構築
├── third_party/             ← サブモジュール（mbedTLS、OpenThread、各社 SDK…）
├── config/                  ← ビルド設定
└── docs/                    ← ドキュメント
```

> **`src/platform/` がポーティングの中心である.**
> 新しい SoC に載せるとき、ここに実装を追加する。
> ただし主要な SoC はすでにサポートされているので、
> **多くの場合は既存のプラットフォーム層を使うだけで済む**。

## 2. ビルドシステム

Matter SDK は **GN + Ninja** を主に使う（Chromium 由来）。

| ツール | 役割 |
|---|---|
| **GN** | ビルド設定の記述（`BUILD.gn`）→ Ninja ファイルを生成 |
| **Ninja** | 実際のビルド実行。高速 |
| **CMake** | 一部のプラットフォーム（ESP-IDF、nRF Connect SDK など）で使う |
| **Bazel / Pigweed** | 一部のツールチェーン管理 |

> **プラットフォームによってビルド方法が違うのが混乱の元である.**
>
> | 対象 | ビルド方法 |
> |---|---|
> | Linux / macOS | GN + Ninja（SDK 直接） |
> | ESP32 | **ESP-IDF の `idf.py`**（CMake ベース、esp-matter を使うことも） |
> | Nordic nRF | **nRF Connect SDK の `west`**（CMake ベース） |
> | Silicon Labs | GN + Ninja または Simplicity Studio |
>
> **「どのビルド方法を使うか」は SoC の選定で決まる。**
> 公式ドキュメントの該当プラットフォームの手順に従うのが確実である。

## 3. 最短で動かす（Linux / macOS）

```bash
# 1. クローン（サブモジュールが巨大なので時間がかかる）
git clone https://github.com/project-chip/connectedhomeip.git
cd connectedhomeip

# 2. 必要なサブモジュールだけ取る（プラットフォームを絞ると速い）
./scripts/checkout_submodules.py --shallow --platform linux

# 3. 依存パッケージ（Ubuntu の例）
sudo apt-get install -y git gcc g++ pkg-config libssl-dev libdbus-1-dev \
  libglib2.0-dev libavahi-client-dev ninja-build python3-venv python3-dev \
  python3-pip unzip libgirepository1.0-dev libcairo2-dev libreadline-dev

# 4. 環境を作る（初回は数分〜十数分）
source scripts/activate.sh
#    2 回目以降も毎回これを実行する（環境変数と Python venv を設定する）

# 5. サンプルアプリをビルド
./scripts/examples/gn_build_example.sh examples/all-clusters-app/linux out/all-clusters

# 6. chip-tool をビルド
./scripts/examples/gn_build_example.sh examples/chip-tool out/chip-tool

# 7. 実行（別々のターミナルで）
./out/all-clusters/chip-all-clusters-app
./out/chip-tool/chip-tool pairing onnetwork 1 20202021
./out/chip-tool/chip-tool onoff toggle 1 1
```

> **`source scripts/activate.sh` を忘れると必ず失敗する.**
> これは Python の仮想環境とツールチェーンのパスを設定するスクリプトである。
> 新しいターミナルを開くたびに実行する必要がある。
>
> 初回は `bootstrap.sh` が走って数十分かかることもある。
> 2 回目以降は数秒で終わる。

### よくあるビルドエラー

| エラー | 原因・対処 |
|---|---|
| サブモジュールが見つからない | `checkout_submodules.py` を実行する |
| Python のバージョン不一致 | SDK が要求するバージョンを確認 |
| `pw_env_setup` の失敗 | ネットワーク（プロキシ環境で頻発）、ディスク容量 |
| `dbus`/`avahi` のヘッダがない | 依存パッケージのインストール漏れ（Linux） |
| リンクエラーの大量発生 | ビルドディレクトリを消してやり直す |
| 「ディスクがない」 | **数 GB〜十数 GB 必要**。想定より大きい |

## 4. chip-tool — 最重要のツール

コントローラの CLI 実装。**開発中はこれで機器を叩く**。

```bash
# コミッショニング
chip-tool pairing onnetwork <node-id> <passcode>
chip-tool pairing ble-wifi <node-id> <ssid> <password> <passcode> <discriminator>
chip-tool pairing ble-thread <node-id> hex:<dataset> <passcode> <discriminator>
chip-tool pairing code <node-id> <QR or manual code>
chip-tool pairing unpair <node-id>

# 属性の読み書き
chip-tool onoff read on-off <node-id> <endpoint>
chip-tool levelcontrol read current-level <node-id> <endpoint>
chip-tool basicinformation read vendor-name <node-id> 0
chip-tool basicinformation write node-label '"MyLight"' <node-id> 0

# コマンド
chip-tool onoff on <node-id> <endpoint>
chip-tool onoff toggle <node-id> <endpoint>
chip-tool levelcontrol move-to-level 128 10 0 0 <node-id> <endpoint>

# ID 直接指定（未対応クラスタや独自クラスタに便利）
chip-tool any read-by-id 0x0006 0x0000 <node-id> <endpoint>
chip-tool any command-by-id 0x0006 0x02 '{}' <node-id> <endpoint>

# ワイルドカード
chip-tool descriptor read parts-list <node-id> 0
chip-tool any read-by-id 0xFFFFFFFF 0xFFFFFFFF <node-id> 0xFFFF

# サブスクリプション
chip-tool onoff subscribe on-off <min> <max> <node-id> <endpoint>

# インタラクティブモード（セッションを維持できるので速い）
chip-tool interactive start
```

> **`interactive start` を使うべきである.**
> 通常モードでは 1 コマンドごとに CASE セッションを張り直す。
> インタラクティブモードならセッションが維持され、
> **応答が劇的に速くなり、サブスクリプションも継続できる**。

### 設定の保存場所

chip-tool は Fabric の情報（RCAC、鍵、Node ID）をローカルに保存する。

```bash
# 保存場所（環境により異なる）
/tmp/chip_tool_config.ini
~/.chip-tool/

# 別 Fabric として動かす（マルチアドミンのテスト、14 章）
chip-tool --commissioner-name beta pairing code 1 <code>
```

> **「昨日は動いたのに今日動かない」の原因がこれであることがある.**
> `/tmp` はマシンの再起動で消える。Fabric 情報が失われ、
> 機器側には古い Fabric が残ったまま——という状態になる。
> **機器側をファクトリリセットするか、保存場所を永続的な場所に変えること。**

## 5. chip-repl — Python のコントローラ

```python
# chip-repl を起動
# ./out/python_env/bin/chip-repl

# コミッショニング
devCtrl.CommissionOnNetwork(nodeId=1, setupPinCode=20202021)

# 属性の読み取り
await devCtrl.ReadAttribute(1, [(1, Clusters.OnOff.Attributes.OnOff)])

# コマンド
await devCtrl.SendCommand(1, 1, Clusters.OnOff.Commands.Toggle())

# サブスクリプション
sub = await devCtrl.ReadAttribute(
    1, [(1, Clusters.OnOff.Attributes.OnOff)],
    reportInterval=(1, 60))
sub.SetAttributeUpdateCallback(lambda path, tx: print(path, tx))
```

> **自動テストを書くなら Python 側が圧倒的に楽である**（21 章）。
> chip-tool はシェルスクリプトからの利用が前提だが、
> chip-repl / Python API なら**条件分岐や検証ロジックを自然に書ける**。

## 6. プラットフォーム別の実際

### ESP32（Espressif）

```bash
# esp-matter を使う方法（推奨）
git clone --recursive https://github.com/espressif/esp-matter.git
cd esp-matter
./install.sh
source export.sh

cd examples/light
idf.py set-target esp32c3
idf.py build
idf.py -p /dev/ttyUSB0 flash monitor
```

### Nordic nRF52840 / nRF5340

```bash
# nRF Connect SDK に Matter が同梱されている
west build -b nrf52840dk_nrf52840 samples/matter/light_bulb
west flash
```

### Silicon Labs EFR32

```bash
./scripts/examples/gn_silabs_example.sh examples/lighting-app/silabs \
    out/lighting-app BRD4187C
```

> **各社が「Matter 対応の SDK パッケージ」を提供している.**
> 素の connectedhomeip をポーティングするより、
> **SoC ベンダーの提供するパッケージを使う方が圧倒的に早い**。
> ドキュメント・サンプル・Factory Data のツールまで揃っていることが多い。

## 7. バージョン管理

> **SDK のバージョンを固定すること.**
> `master` を追い続けると、ある日突然ビルドが通らなくなる。
>
> - リリースタグ（`v1.3.0.0` など）をチェックアウトする
> - どの Matter 仕様バージョンに対応するかを確認する
> - **認証を取るバージョンで固定し、以降は必要最小限の更新に留める**
>
> SDK は仕様のリリースに合わせてタグが打たれる。
> 認証テストも仕様バージョンごとに行われるので、
> **「開発中に SDK を上げたら仕様バージョンが変わっていた」は事故になる**（22 章）。

## 8. ディスクと時間の見積り

| 項目 | 目安 |
|---|---|
| クローン（`--shallow`、単一プラットフォーム） | 1〜3 GB |
| クローン（全サブモジュール） | 数 GB〜十数 GB |
| ビルド成果物 | 数 GB |
| 初回の環境構築 | 10〜30 分 |
| 初回ビルド | 10〜40 分（マシン次第） |
| 増分ビルド | 数秒〜数分 |

> **CI で毎回フルビルドすると時間とコストが跳ね上がる.**
> ccache / sccache とビルドキャッシュの活用は実質的に必須である。

## 9. 落とし穴

| 落とし穴 | 対処 |
|---|---|
| `activate.sh` を忘れる | 毎回実行する。シェルの関数にしておくとよい |
| サブモジュールを全部取る | `--platform` で絞る |
| `master` を追う | リリースタグで固定する |
| ディスク不足 | 事前に十数 GB を確保 |
| プロキシ環境でのブートストラップ失敗 | プロキシ設定を環境変数に |
| chip-tool の設定が `/tmp` にある | 永続的な場所に移すか、リセット手順を決める |
| ビルド方法をプラットフォーム間で混同 | 対象の公式手順に従う |
| 生成コードを手で編集する | ZAP で再生成すると消える（16 章） |

## 10. まとめ

- SDK は `src/`（本体）、`examples/`（サンプル）、`zzz_generated/`（生成コード）、
  `src/platform/`（ポーティング層）が主要な構成。
- ビルドは **GN + Ninja** が基本。**ESP32 は idf.py、Nordic は west** と、
  プラットフォームごとに違う。混同しないこと。
- **`source scripts/activate.sh` を毎回実行する。**
- **chip-tool は必携**。`interactive start` でセッションを維持すると速い。
- 自動テストは **chip-repl / Python API** の方が書きやすい。
- 実機では **SoC ベンダーの Matter パッケージ**を使う方が早い。
- **SDK のバージョンはリリースタグで固定する**。認証と直結する。
- ディスクは十数 GB、初回ビルドは数十分を見込む。
