# 07. Ready リストの実装 — なぜ O(1) で次のタスクが決まるのか

> **この章がなぜ必要なのか——リアルタイム OS の「リアルタイム」はここにある.**
>
> 「最高優先度の Ready タスクを選ぶ」——素朴にやればタスク数に比例した時間がかかる。
> だが**タスク数に依存して切り替え時間が変わる OS は、リアルタイム OS を名乗れない**。
> 最悪実行時間が計算できなくなるからである。
>
> FreeRTOS はこれを **O(1)**、つまり**タスクが何個あっても一定時間**で行う。
> その仕掛けは驚くほど単純で、そして美しい。

## 1. `list.c` — すべての土台

FreeRTOS のカーネルは、**たった 1 種類のデータ構造**の上に立っている。
**番兵付き循環双方向リンクリスト**である。

```c
typedef struct xLIST_ITEM
{
    TickType_t          xItemValue;     /* 並べ替えの鍵（優先度 or 起床時刻） */
    struct xLIST_ITEM  *pxNext;
    struct xLIST_ITEM  *pxPrevious;
    void               *pvOwner;        /* この項目を持っている TCB へのポインタ */
    struct xLIST       *pvContainer;    /* いま所属しているリストへのポインタ */
} ListItem_t;

typedef struct xLIST
{
    volatile UBaseType_t uxNumberOfItems;
    ListItem_t * volatile pxIndex;      /* 走査用のカーソル */
    MiniListItem_t xListEnd;            /* 番兵（終端マーカー） */
} List_t;
```

### 3 つの工夫

**工夫 1: 循環している**

```
     ┌──────────────────────────────────┐
     ↓                                  │
  [xListEnd] ⇄ [ItemA] ⇄ [ItemB] ⇄ [ItemC]
     ↑                                  │
     └──────────────────────────────────┘
```

末尾の次は先頭に戻る。だから「末尾に追加」も「先頭を取る」も、
**NULL チェックが要らない**。分岐が減り、コードが短くなる。

**工夫 2: 番兵 (`xListEnd`) がある**

`xListEnd.xItemValue = portMAX_DELAY`（最大値）に固定されている。
昇順ソートで挿入するとき、**必ず番兵の手前で止まる**ので、
「リストの終端に着いた」という特別扱いが不要になる。

**工夫 3: `pvContainer` を持っている**

各項目が「自分がいまどのリストにいるか」を知っている。だから——

```c
void uxListRemove( ListItem_t * const pxItemToRemove )
{
    List_t * const pxList = pxItemToRemove->pvContainer;    /* 自分で分かる */

    pxItemToRemove->pxNext->pxPrevious = pxItemToRemove->pxPrevious;
    pxItemToRemove->pxPrevious->pxNext = pxItemToRemove->pxNext;

    if( pxList->pxIndex == pxItemToRemove ) {
        pxList->pxIndex = pxItemToRemove->pxPrevious;
    }
    pxItemToRemove->pvContainer = NULL;
    ( pxList->uxNumberOfItems )--;

    return pxList->uxNumberOfItems;
}
```

**リストを探索せずに、O(1) で削除できる。**
これが「イベント待ちのタスクを 2 つのリストから外す」（04 章）を高速にしている。

### リストの操作

挿入・削除・カーソル移動が実際にどう動くかを確かめられる。

### 2 種類の挿入

| 関数 | 挿入位置 | 使われる場面 |
|---|---|---|
| `vListInsertEnd()` | **カーソル `pxIndex` の直前**（＝実質「末尾」） | Ready リストへの追加。**O(1)** |
| `vListInsert()` | `xItemValue` の**昇順を保つ位置** | 遅延リスト、イベント待ちリスト。**O(n)** |

> **`vListInsert()` は O(n) だが、それでよい.**
>
> 遅延リストは「起床時刻の昇順」で並んでいる必要がある。
> そうすれば「先頭だけ見れば、次に起きるタスクが分かる」からである（10 章）。
>
> 挿入に O(n) かかるが、**ティックごとの判定は O(1)** になる。
> ティック割り込みは毎ミリ秒来るのに対し、遅延リストへの挿入は
> タスクが寝るときだけ——**頻度の高い方を速くする**、正しいトレードオフである。

## 2. Ready リスト — 優先度ごとの配列

```c
static List_t pxReadyTasksLists[ configMAX_PRIORITIES ];
```

```
優先度 4: pxReadyTasksLists[4] → [空]
優先度 3: pxReadyTasksLists[3] → [TaskA]
優先度 2: pxReadyTasksLists[2] → [TaskB] → [TaskC] → [TaskD]
優先度 1: pxReadyTasksLists[1] → [空]
優先度 0: pxReadyTasksLists[0] → [Idle]
```

**優先度ごとに独立したリストを持つ**——これが O(1) の第 1 の鍵である。

なぜなら:

- **追加**: `vListInsertEnd(&pxReadyTasksLists[prio], item)` → **O(1)**（ソート不要）
- **削除**: `uxListRemove(item)` → **O(1)**（`pvContainer` のおかげ）
- **選択**: 「空でない最高優先度」を見つけて、その先頭を取る → **ここが問題**

残った問題は「空でない最高優先度をどう見つけるか」だけである。

### Ready リストの動作

タスクの優先度を変えたり、Ready/Blocked を切り替えたりして、
リストの状態と選ばれるタスクがどう変わるかを確かめられる。

## 3. 選択方法 A: 汎用版（ビットマップなし）

```c
#define taskSELECT_HIGHEST_PRIORITY_TASK()                                  \
{                                                                            \
    UBaseType_t uxTopPriority = uxTopReadyPriority;                          \
                                                                             \
    /* 空でないリストが見つかるまで優先度を下げていく */                      \
    while( listLIST_IS_EMPTY( &( pxReadyTasksLists[ uxTopPriority ] ) ) ) {   \
        configASSERT( uxTopPriority );                                       \
        --uxTopPriority;                                                     \
    }                                                                        \
                                                                             \
    /* そのリストの「次の」項目を取る（＝ラウンドロビン） */                  \
    listGET_OWNER_OF_NEXT_ENTRY( pxCurrentTCB,                               \
                                 &( pxReadyTasksLists[ uxTopPriority ] ) );  \
    uxTopReadyPriority = uxTopPriority;                                      \
}
```

これは厳密には O(1) ではなく、**O(`configMAX_PRIORITIES`)** である。

ただし——**タスク数には依存しない**。
優先度の段数はコンパイル時に決まる定数なので、
**最悪実行時間は計算できる**。リアルタイム性の観点では、これで十分合格である。

> **`uxTopReadyPriority` は「ヒント」である.**
>
> この変数は「Ready なタスクがいる最高優先度**以上**の値」を保っている。
> **正確な値とは限らない**（タスクがブロックしても下げないことがある）。
>
> だから上のループは「ヒントから始めて、実際に空でないところまで下る」という形になる。
> ヒントが多少ずれていても、**下れば必ず正しい答えに着く**（優先度 0 にはアイドルタスクが必ずいるから）。
>
> `configASSERT( uxTopPriority )` は「優先度 0 まで下って、そこも空だった」を捕まえる。
> これが起きたら**アイドルタスクが消えている**ということで、カーネルの深刻な破損である。

### `listGET_OWNER_OF_NEXT_ENTRY` — ラウンドロビンの実体

```c
#define listGET_OWNER_OF_NEXT_ENTRY( pxTCB, pxList )                     \
{                                                                         \
    List_t * const pxConstList = ( pxList );                              \
    ( pxConstList )->pxIndex = ( pxConstList )->pxIndex->pxNext;          \
    if( ( void * ) ( pxConstList )->pxIndex                               \
          == ( void * ) &( ( pxConstList )->xListEnd ) ) {                \
        ( pxConstList )->pxIndex = ( pxConstList )->pxIndex->pxNext;      \
    }                                                                     \
    ( pxTCB ) = ( pxConstList )->pxIndex->pvOwner;                        \
}
```

**カーソル `pxIndex` を 1 つ進めて、そこの持ち主を返す。**
番兵に当たったらもう 1 つ進めて飛ばす。

これだけで、同一優先度のタスクが**順繰りに選ばれる**。
リストを並べ替える必要も、カウンタを持つ必要もない。**カーソルが 1 個あればよい。**

> **これは非常にエレガントな実装である.**
>
> ラウンドロビンを実装しようとすると、多くの人は
> 「実行したタスクをリストの末尾に移動する」と考える。
> それでも動くが、**リストの操作が 2 回（削除＋挿入）必要**になる。
>
> FreeRTOS は**リストを一切触らず、カーソルだけ動かす**。
> 操作は「ポインタを 1 つ進める」だけである。

## 4. 選択方法 B: ビットマップ最適化版

```c
#define configUSE_PORT_OPTIMISED_TASK_SELECTION  1
```

こちらは**真の O(1)** である。

```c
#define taskRECORD_READY_PRIORITY( uxPriority )                          \
    portRECORD_READY_PRIORITY( ( uxPriority ), uxTopReadyPriority )

/* Cortex-M の実装例 */
#define portRECORD_READY_PRIORITY( uxPriority, uxReadyPriorities )       \
    ( uxReadyPriorities ) |= ( 1UL << ( uxPriority ) )

#define portGET_HIGHEST_PRIORITY( uxTopPriority, uxReadyPriorities )     \
    uxTopPriority = ( 31UL - ( uint32_t ) __builtin_clz( uxReadyPriorities ) )
```

### 仕組み

`uxTopReadyPriority` を**優先度ビットマップ**として使う。

```
uxTopReadyPriority = 0b00001101
                       ││││││││
                       │││││││└─ 優先度 0 に Ready あり（アイドル）
                       ││││││└── 優先度 1 は空
                       │││││└─── 優先度 2 に Ready あり
                       ││││└──── 優先度 3 に Ready あり
                       └───────── 優先度 4 以上は空

最高優先度 = 最上位の立っているビット = 3
```

「最上位の立っているビットを求める」は、多くの CPU に**専用命令がある**。

| CPU | 命令 | 意味 |
|---|---|---|
| ARM | `CLZ` | Count Leading Zeros（先頭のゼロを数える） |
| RISC-V (Zbb) | `clz` | 同上 |
| x86 | `BSR` / `LZCNT` | Bit Scan Reverse |
| PowerPC | `cntlzw` | Count Leading Zeros Word |

`CLZ` は**1 命令、1 サイクル**である。だから優先度の選択が

$$
\text{priority} = 31 - \text{CLZ}(\text{bitmap})
$$

——**1 サイクル**で終わる。これが真の O(1) である。

### ビットマップの制約

| 制約 | 理由 |
|---|---|
| `configMAX_PRIORITIES` ≤ 32 | ビットマップが 1 ワード（32 bit）だから |
| CPU に `CLZ` 相当がある | ない場合は C のループになり、利点が薄れる |

> **32 段を超えたい場合はどうするか.**
>
> 大きな OS では**多段ビットマップ**を使う。
> Linux の O(1) スケジューラ（2.6 初期）は 140 段の優先度を
> 「ビットマップの配列 ＋ そのビットマップ」の 2 段構成で扱っていた。
>
> だが組み込みで 32 段を超える設計はまず必要ない。
> **段数が多いほど、どこに置くべきか分からなくなる**（06 章）。

## 5. 2 つの方式の比較

| 観点 | 汎用版 | ビットマップ版 |
|---|---|---|
| 計算量 | O(`configMAX_PRIORITIES`) | **O(1)** |
| 実測（優先度 8 段） | 約 10〜30 サイクル | **約 3 サイクル** |
| 優先度の上限 | 制限なし | **32** |
| 移植性 | **どの CPU でも動く** | `CLZ` 相当が必要 |
| コードサイズ | 小 | 小 |

> **どちらを選ぶか.**
>
> **CPU が対応しているなら、迷わずビットマップ版**を使うべきである。
> Cortex-M3 以上、RISC-V（Zbb 拡張あり）なら対応している。
>
> Cortex-M0/M0+ は `CLZ` を持たないので汎用版になる。
> ただし優先度が 5 段程度なら、汎用版でも数十サイクルで済む。
> **48 MHz なら 1 µs 未満**なので、実用上の問題はまずない。

## 6. リストの使われ方まとめ

`List_t` は、カーネル全体でこう使われている。

| リスト | `xItemValue` の意味 | ソート | 挿入 |
|---|---|---|---|
| `pxReadyTasksLists[p]` | 優先度（使われない） | しない | `vListInsertEnd` |
| `xDelayedTaskList1/2` | **起床時刻**（絶対ティック） | **昇順** | `vListInsert` |
| イベント待ちリスト | **`configMAX_PRIORITIES - 優先度`** | **昇順** | `vListInsert` |
| `xSuspendedTaskList` | （使われない） | しない | `vListInsertEnd` |
| `xPendingReadyList` | （使われない） | しない | `vListInsertEnd` |
| `xTasksWaitingTermination` | （使われない） | しない | `vListInsertEnd` |

> **イベント待ちリストのソート鍵に注目してほしい.**
>
> `configMAX_PRIORITIES - uxPriority` を鍵にして**昇順**に並べる。
> つまり実質的には**優先度の降順**である。
>
> なぜこうするか。キューにデータが来たとき、
> **待っているタスクのうち最高優先度のものを起こす**必要があるからである。
> 昇順ソート済みなら、**先頭を取るだけで最高優先度が手に入る**（O(1)）。
>
> 「昇順ソートしか用意せず、鍵の方をひっくり返す」——
> **コードを 1 種類に保つための工夫**である。

## 7. この章のまとめ

| ポイント | 内容 |
|---|---|
| 唯一のデータ構造 | 番兵付き循環双方向リンクリスト |
| 循環の利点 | NULL チェックが不要 |
| 番兵の利点 | ソート挿入で終端の特別扱いが不要 |
| `pvContainer` | **探索せずに O(1) で削除**できる |
| Ready リスト | **優先度ごとに独立したリスト**。追加も削除も O(1) |
| 汎用版の選択 | O(`configMAX_PRIORITIES`)。**タスク数には依存しない** |
| ビットマップ版 | `CLZ` 1 命令で O(1)。**優先度 32 段まで** |
| ラウンドロビン | **カーソル `pxIndex` を 1 つ進めるだけ**。リストは触らない |
| イベント待ちの鍵 | 優先度を反転して昇順に。**先頭が最高優先度** |

次章では、この全体を駆動する唯一の時間源——ティック割り込みを見る。

→ 次章: [08. ティックとタイムスライス](08_ティックとタイムスライス.md)
