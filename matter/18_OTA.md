# 18. OTA ソフトウェア更新 — Provider / Requestor と BDX

> **この章がなぜ必要なのか——出荷後に直せない製品は作ってはいけない.**
>
> セキュリティ脆弱性、相互運用性の不具合、仕様の更新——
> **出荷後にファームウェアを更新できないことは、それ自体がリスク**である。
>
> Matter は OTA を標準の枠組みとして定義している。
> エコシステム側が更新を配信してくれるので、
> **メーカーが独自のクラウドを持たなくてよい**——これは大きな利点である。

## 1. 登場人物

| ロール | クラスタ | 役割 |
|---|---|---|
| **OTA Provider** | `0x0029` | イメージを配布する側。ハブやクラウド連携ノード |
| **OTA Requestor** | `0x002A` | 更新を受ける側。**あなたの機器** |

```
[OTA Provider]                          [OTA Requestor（機器）]
（ハブ、または                              │
  エコシステムのクラウド                     │
  と連携したノード）                         │
      │<──── QueryImage ──────────────────│ 「更新ありますか？」
      │────> QueryImageResponse ─────────>│ 「あります。バージョン X」
      │<──── BDX でイメージを転送 ─────────>│
      │<──── ApplyUpdateRequest ──────────│ 「適用してよいですか？」
      │────> ApplyUpdateResponse ────────>│ 「どうぞ」
      │                                   │ ← 再起動して適用
      │<──── NotifyUpdateApplied ─────────│ 「適用しました」
```

## 2. Requestor 側の流れ

### (a) Provider を知る

| 方法 | 内容 |
|---|---|
| `DefaultOTAProviders` 属性 | コミッショニング時などに設定される |
| `AnnounceOTAProvider` コマンド | Provider が「私がいます」と通知 |

### (b) QueryImage

```
QueryImage {
    VendorID, ProductID,
    SoftwareVersion,          ← 現在のバージョン
    ProtocolsSupported,       ← BDX Synchronous など
    HardwareVersion,          ← 任意
    Location, RequestorCanConsent, MetadataForProvider
}
    ↓
QueryImageResponse {
    Status,                   ← UpdateAvailable / Busy / NotAvailable / DownloadProtocolNotSupported
    DelayedActionTime,        ← Busy のとき、次に聞くまでの待ち時間
    ImageURI,                 ← bdx:// または https://
    SoftwareVersion,          ← 新しいバージョン
    SoftwareVersionString,
    UpdateToken,              ← このセッションの識別子
    UserConsentNeeded,
    MetadataForRequestor
}
```

> **`Busy` と `DelayedActionTime` が重要である.**
> 家中の機器が一斉に更新を要求すると、Provider が過負荷になる。
> `Busy` + 待ち時間で**更新を分散させる**。
>
> **Requestor 側は必ずこれを尊重すること。** 無視して即座に再試行する実装は、
> 認証テストでも問題になるし、実運用でネットワークを詰まらせる。

### (c) ダウンロード（BDX）

**BDX**（Bulk Data Exchange）は、Matter のセッション上で大きなデータを転送するプロトコル。

| 特徴 | 内容 |
|---|---|
| Matter のセッション上で動く | **暗号化・認証済み** |
| ブロック単位の転送 | ブロックサイズを折衝 |
| 再開 | 一部の実装では途中から再開可能 |
| フロー制御 | 受信側のペースに合わせる |

`https://` の URI が返される場合もある（大きなイメージや、Wi-Fi 機器向け）。
その場合は通常の HTTPS でダウンロードする。

> **Thread 機器での BDX は遅い.**
> 250 kbps、実効はさらに低い。**1 MB のイメージに数分〜数十分**かかる。
>
> 対策:
> - **イメージを小さくする**（差分更新の仕組みを独自に持つメーカーもある）
> - 圧縮する
> - 更新中も基本機能が動くようにする（A/B 面）
> - ユーザーに進捗を見せる
>
> 「更新中は使えません」が 30 分続く製品は、ユーザーに嫌われる。

### (d) 適用

```
ApplyUpdateRequest { UpdateToken, NewVersion }
    ↓
ApplyUpdateResponse {
    Action,        ← Proceed / AwaitNextAction / Discontinue
    DelayedActionTime
}
```

| Action | 意味 |
|---|---|
| **Proceed** | 適用してよい |
| **AwaitNextAction** | 待て（あとで再度聞け） |
| **Discontinue** | 中止せよ |

> **`AwaitNextAction` の使いどころ.**
> 「ドアロックが施錠中は更新しない」「照明が点いている間は更新しない」
> といった制御を Provider 側から行える。
>
> Requestor 側でも、**危険な状態での再起動を避ける**判断が必要である。
> 調理家電が加熱中に再起動してはいけない。

### (e) 適用後

```
NotifyUpdateApplied { UpdateToken, SoftwareVersion }
```

これで Provider は更新の成功を知る。

## 3. UpdateState の遷移

`OtaSoftwareUpdateRequestor` クラスタの `UpdateState` 属性で外部から観測できる。

| 状態 | 意味 |
|---|---|
| `Unknown` | 不明 |
| `Idle` | 何もしていない |
| `Querying` | 問い合わせ中 |
| `DelayedOnQuery` | Busy を受けて待機中 |
| `Downloading` | ダウンロード中 |
| `Applying` | 適用中 |
| `DelayedOnApply` | 適用待機中 |
| `RollingBack` | ロールバック中 |
| `DelayedOnUserConsent` | ユーザー同意待ち |

`UpdateStateProgress` 属性でダウンロードの進捗（0〜100）も公開される。

> **これらを正しく更新すること.**
> アプリが「更新中 45%」と表示できるかどうかは、この属性次第である。
> ユーザー体験に直結する。

## 4. イメージのフォーマット

Matter の OTA イメージには標準ヘッダが定義されている。

| フィールド | 内容 |
|---|---|
| File Identifier | **`0x1BEEF11E`** |
| Total Size | ヘッダ + ペイロードの全長 |
| Header Size | ヘッダ長 |
| **Vendor ID / Product ID** | 対象製品 |
| **Software Version** | 新しいバージョン（数値） |
| Software Version String | 表示用 |
| Payload Size | 本体のサイズ |
| Min/Max Applicable Version | 適用可能な現行バージョンの範囲 |
| Release Notes URL | 任意 |
| Image Digest / Digest Type | ハッシュ |

```bash
# SDK のツールでイメージを作る
./src/app/ota_image_tool.py create \
    -v 0xFFF1 -p 0x8000 -vn 2 -vs "2.0" -da sha256 \
    firmware.bin firmware-ota.bin

# 中身を確認
./src/app/ota_image_tool.py show firmware-ota.bin
```

> **`Min/Max Applicable Version` が段階的更新を可能にする.**
> 「v1 → v3 に直接は上げられない。まず v2 を経由せよ」という制約を表現できる。
> データ形式の移行が必要な更新で使う。

## 5. セキュリティ

> **OTA は最も危険な攻撃経路である.**
> 任意のファームウェアを流し込めれば、機器を完全に乗っ取れる。

| 対策 | 内容 |
|---|---|
| **転送路の保護** | BDX は Matter セッション上なので暗号化・認証済み |
| **イメージの署名検証** | **機器側で必ず検証する。最重要** |
| **セキュアブート** | 署名されていないイメージは起動しない |
| バージョンのダウングレード防止 | 古い（脆弱な）版に戻せないようにする |
| **ロールバック** | 起動に失敗したら旧イメージに戻る |

> **署名検証を SoC のセキュアブートに任せるのが定石である.**
> アプリケーション層で検証してから書き込むより、
> **ブートローダが起動前に検証する**方が強い（書き込み後に改竄されても防げる）。
>
> **Matter の仕様は「転送の保護」までしか規定していない。**
> **イメージ自体の署名と検証はメーカーの責任**である。
> ここを実装しないと、Provider を偽装できれば任意コード実行になる。

### A/B 更新とロールバック

```
[領域 A: 現在動作中]   [領域 B: 空き]
        ↓ ダウンロード
[領域 A: 現在動作中]   [領域 B: 新イメージ]
        ↓ 再起動、B から起動
[領域 A: 旧イメージ]   [領域 B: 動作中（試用期間）]
        ↓ 正常に動作すれば確定
        ↓ 起動に失敗すれば A に戻る
```

> **「試用期間」の判定基準を決める必要がある.**
> - 起動しただけで成功とするか
> - ネットワークに繋がったら成功とするか
> - コントローラと通信できたら成功とするか
>
> **緩すぎると、起動はするが通信できないファームで文鎮化する。**
> 「Matter のセッションが 1 回確立できたら確定」あたりが実用的な基準である。

## 6. Provider 側の実装

自社でハブを作る、または開発時に検証する場合。

```bash
# SDK のサンプル Provider
./out/ota-provider-app/chip-ota-provider-app --filepath firmware-ota.bin

# コミッショニングして ACL を設定
chip-tool pairing onnetwork 2 20202021
chip-tool accesscontrol write acl '[{"privilege":5,"authMode":2,"subjects":[112233],"targets":null},{"privilege":3,"authMode":2,"subjects":null,"targets":null}]' 2 0

# Requestor に Provider を教える
chip-tool otasoftwareupdaterequestor announce-otaprovider 2 0 0 0 1 0

# 状態を見る
chip-tool otasoftwareupdaterequestor read update-state 1 0
chip-tool otasoftwareupdaterequestor read update-state-progress 1 0
```

> **Provider の ACL 設定が必要である.**
> Requestor が Provider の `QueryImage` を呼べるように、
> **Provider 側の ACL に「誰でも Operate 可」のエントリ**が要る
> （上の例の 2 番目のエントリ）。
> ここを忘れると `UNSUPPORTED_ACCESS` で止まる（14 章）。

## 7. 運用上の考慮

| 項目 | 内容 |
|---|---|
| **配信の分散** | 全機器が同時に更新すると帯域を食い潰す |
| **バージョン管理** | `SoftwareVersion` は単調増加の整数（08 章） |
| **DCL への登録** | OTA 情報を DCL に載せる方式もある（12 章） |
| **エコシステム経由** | 各社が独自に配信する場合、それぞれに提出が必要 |
| **失敗時の再試行** | 指数バックオフ |
| **電源断への耐性** | 更新中に電源が切れても壊れない設計 |
| **ユーザー通知** | 更新の有無・進捗・完了 |

> **エコシステムごとに配信の仕組みが違う点に注意.**
> Apple / Google / Amazon がそれぞれ独自のパイプラインを持つ。
> **どこにイメージを提出し、どう承認されるか**は各社のプログラムに従う。
> 認証取得（22 章）とセットで確認すべき事項である。

## 8. 落とし穴

| 落とし穴 | 対処 |
|---|---|
| **Flash 容量が足りない** | 設計時に 2 面分を確保（17 章） |
| **イメージの署名検証を実装しない** | **重大な脆弱性**。セキュアブートを使う |
| ロールバックがない | 更新失敗で文鎮化 |
| `SoftwareVersion` が非単調 | 更新判定が壊れる |
| Provider の ACL 未設定 | `UNSUPPORTED_ACCESS` |
| Busy / DelayedActionTime を無視 | Provider を圧迫、テストで問題になる |
| Thread での転送時間を見積もらない | 数十分かかる |
| 更新中に機器が使えない | UX の悪化。A/B 面で回避 |
| 電源断への耐性がない | ブリックする |
| 進捗属性を更新しない | アプリで進捗が見えない |
| 危険な状態での再起動 | 加熱中・施錠動作中などは避ける |

## 9. まとめ

- OTA は **Provider（配布）** と **Requestor（機器）** の 2 者。
  `QueryImage` → **BDX でダウンロード** → `ApplyUpdateRequest` → 適用 → `NotifyUpdateApplied`。
- **BDX は Matter セッション上**なので転送路は保護されている。
  だが**イメージ自体の署名検証はメーカーの責任**。**セキュアブートで検証するのが定石**。
- **A/B 更新とロールバック**は必須。「試用期間の成功判定」を明確に決める。
- **Thread では転送に数十分かかりうる**。イメージを小さく、更新中も使えるように。
- **Flash 容量は最初から 2 面分**。後から足せない。
- `Busy` / `DelayedActionTime` を尊重して配信を分散させる。
- `UpdateState` / `UpdateStateProgress` を正しく更新する。ユーザー体験に直結する。
