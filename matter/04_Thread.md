# 04. Thread — 低消費電力 IPv6 メッシュ

> **この章がなぜ必要なのか——Matter デバイスの多くが Thread を選ぶから.**
>
> 電池で動くセンサーやドアロックを Wi-Fi で作るのは現実的でない。
> Wi-Fi の消費電力では、単三電池で 2 年持たせるのはまず無理である。
>
> Thread は 802.15.4 の上に IPv6 を載せた低消費電力メッシュで、
> **数年の電池寿命**と**メッシュによる到達範囲の拡大**を両立する。
>
> ただし Thread には Wi-Fi にはない概念が多い——ノードの役割、Leader、
> Border Router、Operational Dataset。**これらを知らないと必ず詰まる。**
> しかも Thread は Matter とは別団体（Thread Group）の仕様である。

## 1. Thread の位置づけ

| 層 | Thread での中身 |
|---|---|
| アプリケーション | **Matter**（Thread は中身を問わない） |
| トランスポート | UDP |
| ネットワーク | **IPv6** + 6LoWPAN（ヘッダ圧縮・フラグメント） |
| MAC / PHY | **IEEE 802.15.4-2006**（2.4 GHz、250 kbps） |

| 特性 | 値 |
|---|---|
| 周波数帯 | 2.4 GHz（Wi-Fi・BLE と同じ帯域） |
| データレート | 250 kbps |
| フレーム長 | **127 bytes**（物理層） |
| 到達距離 | 屋内で 10〜30 m 程度／メッシュで中継 |
| 消費電力 | Wi-Fi の 1/10〜1/100 のオーダー |
| セキュリティ | ネットワーク鍵による AES-CCM（Matter の暗号とは**別レイヤ**） |

> **暗号が二重にかかる.**
> Thread はネットワーク鍵でリンク層を暗号化し、
> Matter はセッション鍵でアプリ層を暗号化する。
> **Thread の鍵が漏れても Matter の中身は読めない**——これは設計として正しい。
> ただし処理コストは二重にかかるので、性能見積りで忘れないこと。

## 2. ノードの役割

Thread ではノードが役割を持つ。**ここが Wi-Fi と最も違う点**である。

| 役割 | 略称 | 中継 | 常時受信 | 電源 |
|---|---|---|---|---|
| **Leader** | — | ○ | ○ | 常時給電 |
| **Router** | — | ○ | ○ | 常時給電 |
| **Router Eligible End Device** | REED | ×（昇格可） | ○ | 常時給電 |
| **Full End Device** | FED | × | ○ | 常時給電 |
| **Minimal End Device** | MED | × | ○ | 常時給電 |
| **Sleepy End Device** | **SED** | × | **×（間欠）** | **電池** |
| **Synchronized SED** | SSED | × | 同期受信 | 電池 |

### Leader

ネットワークに**ただ 1 台**。Router ID の割り当てとネットワーク設定の管理を担う。

> **Leader が落ちても止まらない.**
> 他の Router が自動的に Leader に昇格する（分散的な選出）。
> 「Leader = 単一障害点」ではない点が Thread の売りの 1 つである。

### Router

パケットを中継する。**最大 32 台**まで。REED は必要に応じて自動的に Router に昇格する。

### Sleepy End Device (SED) — 電池機器の主役

**普段は無線を切って眠っている。** 起きたときだけ親（Router）にデータを取りに行く。

```
   ← Polling Interval →
   ┌──┐              ┌──┐              ┌──┐
   │起││    睡眠     ││起││    睡眠     ││起│
   └──┘              └──┘              └──┘
    ↑ 親に「私宛のデータある？」と聞く（Data Poll）
```

| パラメータ | 効果 |
|---|---|
| **ポーリング間隔が短い** | 応答が速い。電池が減る |
| **ポーリング間隔が長い** | 電池が持つ。**下り方向のレイテンシが増える** |

> **これが電池機器の設計の核心である.**
> ポーリング間隔 1 秒なら反応は速いが電池は数か月。
> 30 秒なら数年持つが、「アプリから鍵を開ける」のに最悪 30 秒かかる。
>
> ドアロックのように**下り方向の即応性が要る機器**と、
> 温度センサーのように**上り方向だけでよい機器**では、まったく設計が違う。
>
> Matter 側では **ICD (Intermittently Connected Device)** の仕組みで
> この間欠動作をアプリケーション層に伝える（17 章）。

### 親子関係

End Device は必ず 1 台の Router を**親**として持つ。
親は子宛てのパケットを**バッファし**、子が Poll してきたときに渡す。

> **親を失うと通信できなくなる.**
> 親の Router が電源断や移動で消えると、子は新しい親を探す（Reattach）。
> この間は通信できない。**親が 1 台しかない配置は危険**である。
> 実運用では常時給電の Router を複数、家の中に分散させるのが定石。

## 3. Thread Border Router — Matter で最も重要な要素

**Thread ネットワークと通常の IP ネットワーク（Wi-Fi / Ethernet）を繋ぐ装置。**

```
[スマホ]──Wi-Fi──[ルータ]──Ethernet──[Border Router]──802.15.4──[Thread メッシュ]
                                          ↑                        ├ 電球
                                     ここが橋渡し                  ├ センサー
                                                                   └ ドアロック
```

### Border Router がやること

| 仕事 | 内容 |
|---|---|
| **ルーティング** | Thread ↔ IP のパケット転送 |
| **プレフィックス配布** | OMR プレフィックスを Thread 側に配る（03 章） |
| **SRP サーバ** | Thread 機器のサービス登録を受け付ける（次節） |
| **mDNS プロキシ** | Thread 機器のサービスを Wi-Fi 側の mDNS で広告する |
| **NAT64（任意）** | Thread 機器から IPv4 のインターネットへ |

> **Border Router がなければ Thread の Matter 機器は使えない.**
> スマホから見えないし、コミッショニングも完了できない。
>
> 実際には、Apple TV / HomePod、Google Nest Hub、Amazon Echo、SmartThings Hub などが
> Border Router を内蔵している。ユーザーは「ハブが必要」と認識することになる。
>
> **開発時は自前で用意する必要がある**（OpenThread Border Router を Raspberry Pi で動かすのが定番）。

### SRP（Service Registration Protocol）

Thread 機器は**マルチキャスト mDNS を常時受信できない**（SED は寝ているし、
メッシュ全体へのマルチキャストは高コスト）。

そこで、機器は自分のサービス情報を **Border Router の SRP サーバにユニキャストで登録**する。
Border Router がそれを mDNS として Wi-Fi 側に広告する。

```
[Thread 機器] ──SRP 登録（ユニキャスト）──> [Border Router] ──mDNS 広告──> [Wi-Fi 側]
```

> **「Thread の機器が見つからない」の最頻出原因がここである.**
> SRP 登録が失敗している、リース期限が切れている、Border Router が SRP サーバとして
> 動いていない、といったケースが多い。
> OpenThread Border Router なら `ot-ctl srp server state` などで確認できる。

## 4. Operational Dataset — Thread の「ネットワーク設定」

Thread ネットワークに参加するには、以下をまとめた **Operational Dataset** が必要である。

| 項目 | 内容 |
|---|---|
| Network Name | ネットワーク名 |
| **Extended PAN ID** | 64 bit の一意な識別子 |
| PAN ID | 16 bit |
| **Channel** | 802.15.4 のチャネル（11〜26） |
| Channel Mask | 使用可能チャネル |
| **Network Key** | 128 bit。**これが本体の秘密** |
| PSKc | コミッショナ用の事前共有鍵 |
| Mesh-Local Prefix | ULA プレフィックス |
| Security Policy | 鍵ローテーションなどのポリシー |
| Active Timestamp | 設定のバージョン |

これは **TLV でエンコードされた 1 本のバイト列**として扱われ、
Matter のコミッショニングでは `Network Commissioning` クラスタの
`AddOrUpdateThreadNetwork` コマンドで機器に渡される（13 章）。

```bash
# OpenThread Border Router から Dataset を取り出す
ot-ctl dataset active -x
# → 0e08000000000001000035060004001fffe00208...（16 進の長い文字列）

# chip-tool でコミッショニングするときに使う
chip-tool pairing ble-thread 1 hex:0e08000000000001... 20202021 3840
```

> **Network Key の扱いは慎重に.**
> これが漏れると、Thread ネットワークに任意の機器を参加させられる。
> ログや issue に貼らないこと。開発用と本番用は必ず分ける。
>
> ただし前述のとおり、Thread の鍵が漏れても**Matter のセッションは別鍵で守られている**。
> 多層防御が効いている例である。

## 5. チャネルと Wi-Fi の干渉

Thread（802.15.4）と Wi-Fi は**同じ 2.4 GHz 帯**を使う。BLE も同じである。

| 802.15.4 チャネル | 中心周波数 | 干渉しやすい Wi-Fi チャネル |
|---|---|---|
| 11〜14 | 2405〜2420 MHz | Wi-Fi 1 |
| 15〜20 | 2425〜2450 MHz | Wi-Fi 6 |
| 21〜26 | 2455〜2480 MHz | Wi-Fi 11 |

> **比較的空いているのは 15、20、25、26 とされる**（Wi-Fi の 1/6/11 の谷間）。
> ただし環境依存であり、**現地でスペクトラムを見るのが確実**である。
>
> **開発中の症状**: 「時々パケットが落ちる」「遠い機器だけ不安定」——
> これがソフトのバグではなく干渉であることは非常に多い。
> チャネルを変えて再現するか確認するのが早い切り分けになる。

## 6. Thread と Zigbee の違い

同じ 802.15.4 を使うので混同されるが、上位が根本的に違う。

| | Thread | Zigbee |
|---|---|---|
| ネットワーク層 | **IPv6** | Zigbee 独自 |
| IP 到達性 | あり（直接届く） | なし（ゲートウェイで変換） |
| アプリ層 | 規定しない（Matter などを載せる） | ZCL |
| 単一障害点 | なし（Leader は自動交代） | Coordinator |
| Matter | **そのまま載る** | 載らない（ブリッジが必要、19 章） |

> **既存の Zigbee 機器を Matter 化するには、必ずブリッジが要る**（19 章）。
> 「同じ 802.15.4 だからファームだけ入れ替えれば」とはいかない。
> ネットワーク層から別物である。

## 7. 開発環境の作り方

### OpenThread

Thread のオープンソース実装。Google が中心となって開発している。

| コンポーネント | 役割 |
|---|---|
| **openthread** | Thread スタック本体（機器に載せる） |
| **ot-br-posix** | Border Router（Linux 上で動く） |
| **ot-ctl / ot-cli** | コマンドライン制御 |
| **RCP / NCP** | 無線チップを別 SoC から使う構成 |

### 最小構成の開発セットアップ

```
[Linux PC or Raspberry Pi]
   + 802.15.4 ドングル（nRF52840 dongle など、RCP ファーム書き込み済み）
   → ot-br-posix を動かして Border Router にする

[開発ボード]（nRF52840 DK / ESP32-H2 / EFR32 など）
   → Matter のサンプルアプリを書き込む

[Linux PC]
   → chip-tool でコミッショニング
```

```bash
# Border Router の状態確認（よく使う）
ot-ctl state              # leader / router / child / detached
ot-ctl dataset active     # 現在のネットワーク設定
ot-ctl ipaddr             # 自分の IPv6 アドレス一覧
ot-ctl router table       # ルータ一覧
ot-ctl child table        # 子デバイス一覧（SED の Poll 間隔も見える）
ot-ctl netstat            # 接続状況
ot-ctl srp server state   # SRP サーバが動いているか
ot-ctl srp server host    # 登録されているホスト
ot-ctl srp server service # 登録されているサービス（Matter の _matter._tcp が見えるはず）
```

> **`ot-ctl srp server service` は極めて有用である.**
> ここに機器の `_matter._tcp` が出ていれば、少なくとも
> 「機器が Thread に入り、Border Router にサービス登録できた」ところまでは成功している。
> 出ていなければ、その手前で止まっている。

## 8. 落とし穴

| 落とし穴 | 対処 |
|---|---|
| Border Router が無い／動いていない | 最初に `ot-ctl state` で `leader` か `router` を確認 |
| SRP 登録の失敗 | `ot-ctl srp server service` で確認。リース期限にも注意 |
| SED の親が 1 台しかない | 常時給電の Router を複数配置する |
| ポーリング間隔が短すぎる | 電池寿命の実測を必ず取る |
| Wi-Fi との干渉 | チャネルを変えて切り分ける |
| 大きなペイロード | 127 バイトフレーム。フラグメントを避ける設計に（03 章） |
| Router が 32 台の上限に達する | 大規模設置では設計時に確認 |
| Dataset の不一致 | チャネル・PAN ID・鍵のどれか 1 つ違うだけで参加できない |
| 開発用 Dataset の混在 | 近所の別の開発機と同じ設定にしない |

> **最も多いのは「Dataset が違う」である.**
> チャネル・Extended PAN ID・Network Key のどれか 1 つでも食い違うと、機器は参加できない。
> しかもエラーメッセージは「参加できません」としか出ないことが多い。
> **コミッショニングに使った Dataset と、Border Router の Dataset を必ず突き合わせること。**

## 9. Thread を選ぶべきか

| 条件 | 推奨 |
|---|---|
| 電池駆動、数か月〜数年 | **Thread**（Wi-Fi では現実的でない） |
| 常時給電、大きなデータ（カメラなど） | **Wi-Fi**（Thread の 250 kbps では足りない） |
| 家中に多数配置、到達範囲が課題 | **Thread**（メッシュで中継される） |
| ユーザーにハブを買わせたくない | **Wi-Fi**（Border Router 不要） |
| 既存 Wi-Fi 製品の Matter 対応 | **Wi-Fi**（ハードを変えずに済む可能性） |

> **「ハブが要るかどうか」はビジネス上の大きな分岐点である.**
> Thread 機器は Border Router がないと動かない。
> ユーザーが Apple TV や Nest Hub を持っていない場合、「箱を開けたが使えない」となる。
> 技術的な優位（電池・メッシュ）と、この購入障壁を天秤にかける必要がある。
>
> 実際には、Thread と Wi-Fi の両方のモデルを用意するメーカーも多い。

## 10. まとめ

- Thread は **802.15.4 + 6LoWPAN + IPv6** の低消費電力メッシュ。Matter はその上に載る。
- ノードには役割がある。**SED（電池機器）は寝ていて、Poll で起きる**。
  ポーリング間隔が電池寿命とレイテンシを直接決める。
- **Border Router が必須**。ルーティング・プレフィックス配布・**SRP サーバ**・mDNS 中継を担う。
- ネットワーク参加には **Operational Dataset**（チャネル・PAN ID・Network Key…）が必要。
  1 つ違うだけで参加できない。
- Zigbee とは 802.15.4 が同じなだけで、**ネットワーク層から別物**。
- 2.4 GHz なので **Wi-Fi と干渉する**。不安定さの原因になりうる。
