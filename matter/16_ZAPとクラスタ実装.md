# 16. ZAP とクラスタ実装 — 定義から生成コード、そしてコールバックへ

> **この章がなぜ必要なのか——ここが「実際にコードを書く」場所だから.**
>
> 「電球を Matter 対応にする」の具体的な作業は、突き詰めると 2 つである。
>
> 1. **どのクラスタを載せるかを ZAP で定義する**
> 2. **生成されたコールバックに、ハードウェアを叩くコードを書く**
>
> それ以外の膨大な部分（暗号、ネットワーク、インタラクションモデル）は
> SDK がやってくれる。この分業を理解すると、作業量の見通しが一気に良くなる。

## 1. ZAP とは

**ZAP**（ZCL Advanced Platform）は、
**「この機器はどんなクラスタを持つか」を定義し、対応するコードを生成する**ツールである。

```
    .zap ファイル（GUI で編集する設定）
         ↓  ZAP ジェネレータ
    ┌────────────────────────────────────┐
    │ .matter ファイル（人が読める形の定義） │
    │ endpoint_config.h（属性の格納領域）    │
    │ CHIPClusters.h / callback stubs 等     │
    │ IM のディスパッチテーブル               │
    └────────────────────────────────────┘
         ↓
    あなたが書くコード（コールバックの中身）
```

| ファイル | 内容 |
|---|---|
| **`*.zap`** | ZAP GUI が読み書きする JSON。**これが原本** |
| **`*.matter`** | 生成される、人間可読な IDL 形式の定義。**レビューに使う** |
| `zap-generated/` | 生成された C++ コード |

> **`.matter` ファイルが差分レビューに極めて有用である.**
> `.zap` は JSON で差分が読みにくいが、`.matter` は
> 「どのクラスタのどの属性が増減したか」が一目で分かる。
> **PR では `.matter` の差分を必ず確認すること。**

## 2. ZAP の使い方

```bash
# ZAP GUI を起動（SDK 内のスクリプト）
./scripts/tools/zap/run_zaptool.sh examples/lighting-app/lighting-common/lighting-app.zap

# GUI で編集して保存したあと、コードを再生成
./scripts/tools/zap/generate.py examples/lighting-app/lighting-common/lighting-app.zap

# すべての .zap を一括再生成（SDK 全体を触ったとき）
./scripts/tools/zap_regen_all.py
```

### GUI での作業

```
1. Endpoint を追加
2. その Endpoint の Device Type を選ぶ（例: Dimmable Light）
      → 必須クラスタが自動的に有効になる
3. クラスタごとに Server / Client を有効化
4. 属性ごとに:
      - 有効/無効
      - 保存方式（RAM / 不揮発 / 外部）
      - デフォルト値
      - 範囲
5. コマンドの有効/無効
6. FeatureMap の値を設定
```

> **Device Type を選ぶと必須クラスタが自動で入る**のが ZAP の親切な点である。
> ただし **FeatureMap は手で設定する**必要がある。
> ここで「対応する」と宣言した機能は必ず実装すること（08 章）。

## 3. 属性の格納方式

各属性について、値をどこに置くかを選べる。**これが実装の分岐点になる。**

| 方式 | 内容 | 使いどころ |
|---|---|---|
| **RAM** | SDK 内部の配列に保持 | 揮発してよい状態（現在の明るさなど） |
| **NVM（不揮発）** | 電源断で保持 | 設定値、`NodeLabel`、`StartUpOnOff` |
| **External** | **SDK は値を持たず、毎回コールバックで取得** | センサー値、ハードウェアから直接読む値 |

### External が重要な理由

```cpp
// External に設定した属性は、読まれるたびにこれが呼ばれる
Protocols::InteractionModel::Status
emberAfExternalAttributeReadCallback(EndpointId endpoint, ClusterId cluster,
                                     const EmberAfAttributeMetadata * metadata,
                                     uint8_t * buffer, uint16_t maxReadLength)
{
    if (cluster == TemperatureMeasurement::Id &&
        metadata->attributeId == TemperatureMeasurement::Attributes::MeasuredValue::Id)
    {
        int16_t v = ReadSensorHardware();   // ← 実際のセンサーを読む
        memcpy(buffer, &v, sizeof(v));
        return Protocols::InteractionModel::Status::Success;
    }
    return Protocols::InteractionModel::Status::Failure;
}
```

> **センサー値を RAM に置くと、「定期的に SDK の変数を更新する」コードが必要になる.**
> External にすれば、**読まれたときだけハードウェアを叩く**。
> 消費電力の観点で有利になることが多い。
>
> ただし **External では自動的な変更通知が飛ばない**ので、
> 値が変わったときは自分で `MatterReportingAttributeChangeCallback` を呼ぶ必要がある（10 章）。

## 4. コールバックの構造

生成されるコードは、いくつかのフックを提供する。

### (a) クラスタの初期化

```cpp
void emberAfOnOffClusterInitCallback(EndpointId endpoint)
{
    // このクラスタが有効な Endpoint ごとに 1 回呼ばれる
    // ハードウェアの初期化、初期値の反映など
}
```

### (b) 属性の変更通知（自分の実装への反映）

```cpp
void MatterPostAttributeChangeCallback(const ConcreteAttributePath & path,
                                       uint8_t type, uint16_t size, uint8_t * value)
{
    if (path.mClusterId == OnOff::Id &&
        path.mAttributeId == OnOff::Attributes::OnOff::Id)
    {
        bool on = *value;
        SetRelay(path.mEndpointId, on);   // ← 実際にリレーを叩く
    }
    else if (path.mClusterId == LevelControl::Id &&
             path.mAttributeId == LevelControl::Attributes::CurrentLevel::Id)
    {
        SetPwm(path.mEndpointId, *value);  // ← PWM を設定
    }
}
```

> **これが「Matter 対応」の中核である.**
> コントローラが `On` コマンドを送る
> → SDK が `OnOff` 属性を true にする
> → このコールバックが呼ばれる
> → あなたのコードがリレーを ON にする
>
> **やることは、この対応づけを書くだけ**である。

### (c) コマンドハンドラ（属性で表せない動作）

```cpp
bool emberAfIdentifyClusterIdentifyCallback(
    CommandHandler * commandObj, const ConcreteCommandPath & commandPath,
    const Commands::Identify::DecodableType & commandData)
{
    StartBlinking(commandPath.mEndpointId, commandData.identifyTime);
    commandObj->AddStatus(commandPath, Protocols::InteractionModel::Status::Success);
    return true;
}
```

### (d) 属性の書き込み前フック（検証）

```cpp
Protocols::InteractionModel::Status
MatterPreAttributeChangeCallback(const ConcreteAttributePath & path,
                                 uint8_t type, uint16_t size, uint8_t * value)
{
    // 書き込みを拒否できる
    if (IsLocked(path.mEndpointId))
        return Protocols::InteractionModel::Status::ConstraintError;
    return Protocols::InteractionModel::Status::Success;
}
```

## 5. 逆方向 — ハードウェアからの変更

**物理スイッチで電球が点いた**場合、Matter 側に反映する必要がある。

```cpp
void OnPhysicalSwitchPressed(EndpointId endpoint, bool on)
{
    // SDK の属性を更新する（自動的に報告がトリガされる）
    OnOff::Attributes::OnOff::Set(endpoint, on);
}
```

> **これを忘れると「アプリの表示が実際と食い違う」バグになる.**
>
> 「アプリから操作すると動くが、壁スイッチで操作したらアプリに反映されない」——
> 極めてよくある症状である。
>
> **双方向の同期を必ず実装すること。**
> Matter → ハードウェア（コールバック）と、
> ハードウェア → Matter（属性の Set）の両方が要る。

## 6. スレッドセーフティ

> **SDK の API は、原則として Matter のイベントループ（スレッド）から呼ぶ必要がある.**
>
> センサーの割り込みハンドラや別スレッドから
> `OnOff::Attributes::OnOff::Set()` を直接呼ぶと、**内部状態が壊れる**。
>
> 正しい方法:
>
> ```cpp
> // 別スレッド／割り込みから、Matter スレッドに処理を依頼する
> DeviceLayer::PlatformMgr().ScheduleWork(
>     [](intptr_t arg) {
>         OnOff::Attributes::OnOff::Set(1, true);
>     }, 0);
>
> // または明示的にロックを取る
> DeviceLayer::PlatformMgr().LockChipStack();
> OnOff::Attributes::OnOff::Set(1, true);
> DeviceLayer::PlatformMgr().UnlockChipStack();
> ```
>
> **これを守らないと、「たまにクラッシュする」「たまに値が壊れる」という
> 最も厄介な種類のバグになる。** 再現性が低く、原因究明に時間を溶かす。

## 7. Endpoint を動的に追加する

ブリッジ（19 章）などでは、実行時に Endpoint を増やす必要がある。

```cpp
// 事前に ZAP で「テンプレート」となる Endpoint を定義しておき、
// 実行時に有効化する
emberAfSetDynamicEndpoint(index, endpointId, &bridgedLightEndpoint,
                          dataVersionStorage, deviceTypeList, parentEndpointId);

// 削除
emberAfClearDynamicEndpoint(index);
```

> **上限は ZAP で定義した数で決まる.**
> 「最大 32 台のブリッジ機器」を想定するなら、
> ZAP でその分の領域を確保しておく必要がある。
> **メモリを消費するので、上限の設定は慎重に。**

## 8. 独自クラスタの追加

どうしても必要な場合（07 章の警告を読んだうえで）。

```
1. ZAP の XML でクラスタを定義
   （src/app/zap-templates/zcl/data-model/ に配置）
2. Cluster ID は 上位 16 bit = 自社の VID
3. ZAP GUI で有効化
4. 生成されたコールバックを実装
```

> **独自クラスタは他社エコシステムから完全に無視される.**
> 基本機能は必ず標準クラスタでも提供すること。
> 「Matter 対応だが自社アプリでしか主要機能が使えない」製品は、
> ユーザーの期待を裏切る。

## 9. 実装の進め方（推奨）

```
1. Device Library で必須クラスタを確認（08 章）
       ↓
2. 最も近いサンプルアプリをコピーして出発点にする
   （lighting-app、lock-app、all-clusters-app…）
       ↓
3. ZAP で不要なクラスタを削り、必要なものを追加
       ↓
4. .matter の差分をレビュー
       ↓
5. コード生成
       ↓
6. コールバックを実装（Matter → ハードウェア）
       ↓
7. ハードウェア → Matter の反映を実装
       ↓
8. chip-tool で 1 つずつ属性・コマンドを検証
       ↓
9. Device Library に照らして実装漏れをチェック
```

> **Step 2 が最重要である.**
> ゼロから作らないこと。サンプルには
> コミッショニング、OTA、診断、Factory Data の読み込みなど、
> **必要だが目立たない実装が全部入っている**。

## 10. 落とし穴

| 落とし穴 | 内容 |
|---|---|
| 生成コードを手で編集する | 再生成で消える。ZAP か自分のコード側で対処する |
| `.zap` と `.matter` の不整合 | 生成を忘れている。CI でチェックする |
| FeatureMap の宣言と実装の不一致 | 認証で落ちる |
| 別スレッドから SDK を呼ぶ | **たまにクラッシュ**。ScheduleWork か Lock を使う |
| 報告トリガの呼び忘れ | 「読めば正しいが通知が来ない」（10 章） |
| ハードウェア → Matter の反映漏れ | 物理操作がアプリに反映されない |
| External 属性で通知を出さない | 同上 |
| 属性の永続化を忘れる | 電源断で設定が消える |
| コールバックの中でブロックする | スタック全体が止まる（09 章） |
| 動的 Endpoint の上限不足 | ブリッジで機器を追加できない |

> **CI で「ZAP の再生成差分がゼロであること」をチェックすべきである.**
> `.zap` を編集したのに生成を忘れると、
> 定義と実装が食い違ったままビルドが通ってしまう。
> SDK にはこれをチェックするスクリプトがある。

## 11. まとめ

- **ZAP** が「どのクラスタを載せるか」を定義し、コードを生成する。
  `.zap` が原本、`.matter` はレビュー用、`zap-generated/` が生成物。
- 属性の格納方式は **RAM / NVM / External**。
  センサー値は External が有利だが、**変更通知は自分で出す**。
- 実装の中核は 2 方向のコールバック:
  - **Matter → ハードウェア**: `MatterPostAttributeChangeCallback` など
  - **ハードウェア → Matter**: 属性の `Set()`（**忘れやすい**）
- **別スレッドから SDK API を直接呼ばない**。`ScheduleWork` かロックを使う。
  違反すると再現性の低いクラッシュになる。
- **サンプルアプリをコピーして始める**。ゼロから書かない。
- 生成コードは手で編集しない。CI で再生成差分をチェックする。
