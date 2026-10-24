# -*- coding: utf-8 -*-
# 05 章 状態機械とタイムアウト の図


# ---- この章の小さな部品（シーケンス図を時刻どおりの位置に描く） ----
def _f05_lane(o, x, y0, y1, name, c, sz=11):
    bw = max(64, tw(name, sz) + 18)
    o.append(RECT(x - bw / 2, y0, bw, 26, 7, soft(c), c, 1.3))
    o.append(T(x, y0 + 17, name, "middle", sz, c, True))
    o.append(W(x, y0 + 26, x, y1, c=c, lw=1.2, dash="3 4"))

def _f05_msg(o, x1, y1, x2, y2, label=None, c=INK, lost=None, dash=False, lsz=10, lpos=0.5, ldy=-5, la="middle", b=False):
    """x1,y1 から x2,y2 への矢印。lost=0〜1 で、その割合の位置で失われる（×）。"""
    if lost is not None:
        fx, fy = x1 + (x2 - x1) * lost, y1 + (y2 - y1) * lost
        o.append(W(x1, y1, fx, fy, c=ALI, lw=1.6, dash="5 3"))
        o.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=2))
        o.append(W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=2))
        c = ALI
    else:
        o.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=7, dash="5 3" if dash else None))
    if label:
        o.append(T(x1 + (x2 - x1) * lpos, y1 + (y2 - y1) * lpos + ldy, label, la, lsz, c, b))

def _f05_note(o, x, y, lines, c, a="end", sz=10, b=False):
    """注記の箱（不透明の下地の上に色の薄い塗り）。a は箱の x の基準（end なら x が右端）。返り値は箱の高さ。"""
    w = max(tw(l, sz) for l in lines) + 14
    h = len(lines) * sz * 1.4 + 8
    x0 = x - w if a == "end" else (x - w / 2 if a == "middle" else x)
    o.append(RECT(x0, y, w, h, 5, PAN, "none", 0))
    o.append(RECT(x0, y, w, h, 5, soft(c), c, 1))
    for i, l in enumerate(lines):
        o.append(T(x0 + w / 2, y + 4 + sz + i * sz * 1.4, l, "middle", sz, c, b))
    return h

def _f05_span(o, x, y0, y1, label, c=TEA, side=-1, sz=9.5):
    """ライフラインの横の括弧（タイマが動いている区間など）。"""
    xb = x + side * 7
    o.append(W(xb, y0, xb + side * 5, y0, xb + side * 5, y1, xb, y1, c=c, lw=1.3))
    if label:
        lines = label.split("\n")
        for i, l in enumerate(lines):
            o.append(T(xb + side * 9, (y0 + y1) / 2 + 4 + (i - (len(lines) - 1) / 2) * (sz + 3), l, "end" if side < 0 else "start", sz, c))

# ---- 1 節: 状態機械 ----
def _f05_nest():
    o = []
    # 左: 悪い例（待つループの中に別の手順を書き足す）
    o.append(T(14, 22, "悪い例: 待つループの中に、別の手順を書き足す", "start", 11.5, ALI, True))
    lv = [  # (x, y, w, h)
        (14, 34, 398, 270), (28, 82, 376, 214), (42, 162, 354, 126), (56, 210, 332, 70)]
    for i, (x, y, w, h) in enumerate(lv):
        c = SIG if i == 0 else (MUT if i == 1 else GLD)
        o.append(RECT(x, y, w, h, 6, soft(c) if i else SSOFT, c, 1.3))
    o.append(T(24, 52, "センサを読む手順", "start", 11, SIG, True))
    o.append(T(24, 70, "① コマンドを送る", "start", 10.5, INK))
    o.append(T(38, 100, "② 応答を待つループ", "start", 10.5, INK, True))
    o.append(T(38, 118, "応答が届いた → 値を返す", "start", 10, INK))
    o.append(T(38, 134, "時間切れ → 送り直す", "start", 10, INK))
    o.append(T(38, 152, "★ ボタンが押された → 表示を変える", "start", 10, GLD, True))
    o.append(T(52, 180, "★ サーバの命令が届いた → 命令の手順", "start", 10, GLD, True))
    o.append(T(52, 198, "モジュールにコマンドを送る", "start", 10, INK))
    o.append(T(66, 228, "応答を待つループ（もう 1 段）", "start", 10, INK, True))
    o.append(T(66, 246, "命令の応答が届いた → …", "start", 10, INK))
    o.append(T(66, 266, "センサの応答が届いたら、どこへ渡す？", "start", 10, ALI, True))
    o.append(T(213, 320, "手順を足すたびに、入れ子が 1 段ずつ深くなる", "middle", 10, MUT))
    # 右: 良い例（手順ごとの状態機械と、1 つのイベントループ）
    xr = 436
    o.append(T(xr, 22, "良い例: 手順ごとに進み具合を覚えておく", "start", 11.5, GRN, True))
    o.append(BOX(xr, 34, 252, 54, "出来事を配るループ（2 節）", "出来事（応答・時間切れ・ボタン・命令）を 1 つずつ取り出して、その手順に渡す", GRN, GSOFT, INK, sz=11, ssz=9.5))
    for k, (title, x) in enumerate((("センサの手順", xr), ("命令の手順", xr + 132))):
        o.append(RECT(x, 116, 120, 132, 8, PAN, SIG, 1.3))
        o.append(T(x + 60, 134, title, "middle", 10.5, SIG, True))
        o.append(STATE(x + 60, 166, 84, 26, "待機", SIG))
        o.append(STATE(x + 60, 226, 84, 26, "応答待ち", SIG))
        o.append(EDGE(x + 40, 179, x + 40, 213, None, c=MUT, lw=1.3))
        o.append(EDGE(x + 80, 213, x + 80, 179, None, c=MUT, lw=1.3))
        o.append(ARR(x + 60, 88, x + 60, 114, c=GRN, lw=1.4))
    o.append(T(xr + 126, 270, "どの手順も、出来事を 1 つ受けたら", "middle", 10, GRN))
    o.append(T(xr + 126, 285, "すぐ戻る（待っていることは覚えておく）", "middle", 10, GRN))
    return SVG(700, 330, o, "応答を待つ手順に、別の仕事（ボタン・サーバからの命令）を足す場合の比較。左のように待つループの中に書き足すと、入れ子が深くなり、内側で待っている間に届いた外側の手順の応答の行き場がなくなる。右のように、手順ごとに「今どこまで進んだか」を覚えておき、届いた出来事を 1 つのループからそれぞれの手順に渡せば、手順はいくつ足しても入れ子にならない（この節の後半で、状態機械として説明する）。")
F["e05_nest"] = _f05_nest()

def _f05_shift():
    o = []
    xa, xb = 262, 560
    _f05_lane(o, xa, 10, 404, "マイコン（親機）", SIG)
    _f05_lane(o, xb, 10, 404, "センサの子機", GRN)
    _f05_msg(o, xa, 58, xb, 66, "READ（1 回目の依頼）", INK)
    _f05_span(o, xa, 58, 118, "100 ms", TEA, side=1)
    _f05_note(o, xa - 14, 66, ["100 ms 待っても来ない", "→ 送り直す"], GLD)
    _f05_msg(o, xa, 118, xb, 126, "READ（送り直し）", INK, lpos=0.2)
    _f05_msg(o, xb, 100, xa, 140, "値 A（遅れた）", MUT, dash=True, lpos=0.2, ldy=-9)
    _f05_note(o, xa - 14, 132, ["1 回目への応答 値 A を、送り直し", "への応答として受け取り、戻る"], GRN)
    _f05_msg(o, xb, 160, xa, 172, "値 A'（送り直しへの応答）", MUT)
    _f05_note(o, xa - 14, 180, ["もう誰も待っていない", "→ 受信バッファに残る"], GLD)
    _f05_note(o, xb + 14, 110, ["子機は、2 回届いた", "READ の両方に答える"], GRN, a="start")
    for xx in (xa, xb):
        o.append(W(xx - 6, 230, xx + 6, 236, c=FNT, lw=1.2) + W(xx - 6, 236, xx + 6, 242, c=FNT, lw=1.2))
    o.append(T((xa + xb) / 2, 241, "1 分後", "middle", 10, FNT))
    _f05_msg(o, xa, 270, xb, 278, "READ（2 回目の依頼）", INK)
    _f05_note(o, xa - 14, 274, ["残っていた値 A' をすぐ読み、", "2 回目の応答と取り違える"], ALI, b=True)
    _f05_msg(o, xb, 308, xa, 318, "値 B", MUT)
    _f05_note(o, xa - 14, 328, ["値 B は残り、3 回目の依頼で読まれる", "（以後ずっと 1 つ前の値を返す）"], ALI, b=True)
    return SVG(700, 412, o, "順に書いた形（送り直しあり）で起きる取り違え。1 回目の応答が遅れたため送り直すと、子機は 2 つの READ の両方に答える。2 つ目の応答は誰も待っていないので受信バッファに残り、次の依頼の応答として読まれる。以後、応答は 1 つずつずれる。時間は上から下へ進む。")
F["e05_shift"] = _f05_shift()

# 状態遷移図の座標（デモ w05_fsm と同じ配置）
_F05_ST = {"idle": (110, 124, 96), "wait": (360, 124, 112), "reset": (600, 124, 124)}

def _f05_fsm():
    o = []
    (xi, y, wi), (xw, _, ww), (xr, _, wr) = _F05_ST["idle"], _F05_ST["wait"], _F05_ST["reset"]
    h = 40
    o.append(STATE(xi, y, wi, h, "待機", SIG, start=True))
    o.append(STATE(xw, y, ww, h, "応答待ち", SIG))
    o.append(STATE(xr, y, wr, h, "リセット待ち", SIG))
    # 待機 → 応答待ち（上の弧）
    o.append(CARR(xi + wi / 2, y - 8, xw - ww / 2, y - 8, 0.28, GRN, 1.6))
    o.append(T((xi + xw) / 2 + 4, y - 52, "依頼 / 送る、タイマ開始", "middle", 10, GRN, True))
    # 応答待ち → 待機（下の弧）
    o.append(CARR(xw - ww / 2, y + 8, xi + wi / 2, y + 8, 0.28, GRN, 1.6))
    o.append(T((xi + xw) / 2 + 4, y + 60, "応答 / 結果を渡す", "middle", 10, GRN, True))
    # 応答待ち の自分への遷移（上）
    o.append(SELF(xw, y - h / 2, None, GLD, 18))
    o.append(T(xw, y - 78, "時間切れ [回数 < 3] /", "middle", 10, GLD, True))
    o.append(T(xw, y - 64, "送り直す、タイマ開始", "middle", 10, GLD, True))
    # 応答待ち → リセット待ち
    xm = (xw + ww / 2 + xr - wr / 2) / 2
    o.append(ARR(xw + ww / 2 + 2, y, xr - wr / 2 - 2, y, c=ALI, lw=1.6))
    o.append(T(xm, y - 24, "時間切れ [回数 = 3]", "middle", 10, ALI, True))
    o.append(T(xm, y - 10, "/ 子機をリセット", "middle", 10, ALI, True))
    # リセット待ち → 待機（下の大きな弧）
    yb = y + 118
    o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (xr, y + h / 2, xr, yb, xi, yb, xi + 2, y + h / 2 + 8), c=ALI, lw=1.6))
    o.append(PL([(xi + 2, y + h / 2 + 1), (xi - 3, y + h / 2 + 10), (xi + 7, y + h / 2 + 10)], c=ALI, lw=1, fill=ALI))
    ylow = 0.125 * (y + h / 2) + 0.75 * yb + 0.125 * (y + h / 2 + 8)   # 弧のいちばん下
    o.append(T((xi + xr) / 2, ylow + 16, "時間切れ / 失敗を渡す", "middle", 10, ALI, True))
    o.append(T(350, ylow + 44, "矢印の文字は「イベント [条件] / 動作」。タイマは、応答待ちで 100 ms、リセット待ちで 500 ms。", "middle", 10, MUT))
    o.append(T(350, ylow + 60, "図にない組み合わせ（待機中に届いた応答など）は捨てる。応答待ち・リセット待ちに来た依頼には「使用中」と答える。", "middle", 10, MUT))
    return SVG(700, ylow + 70, o, "センサを読む手順の状態遷移図。状態は 3 つで、いつもどれか 1 つにいる。依頼で応答待ちに入り、応答が届けば待機に戻る。時間切れのたびに送り直し、3 回送っても応答がなければ子機をリセットし、500 ms 待ってから失敗を知らせる。")
F["e05_fsm"] = _f05_fsm()

# ---- 2 節: 待ち方 ----
def _f05_wait():
    o = []
    x0, x1 = 186, 684
    X = lambda t: x0 + (x1 - x0) * t / 100.0
    ys = [64, 132, 200]
    ev = [(5, "依頼を送る", INK), (30, "ボタンが押される", GLD), (60, "応答が届く", SIG)]
    for t, lab, c in ev:
        o.append(W(X(t), 30, X(t), ys[-1] + 36, c=FNT, lw=1, dash="3 3"))
        o.append(T(X(t), 24, lab, "middle", 10, c, True))
    names = [("ブロッキング", "（応答だけを待つ）"), ("ノンブロッキング", "（ポーリング）"), ("イベント駆動", "（出来事が来たら起きる）")]
    for (n1, n2), y in zip(names, ys):
        o.append(T(14, y + 10, n1, "start", 11, INK, True))
        o.append(T(14, y + 25, n2, "start", 9.5, MUT))
        o.append(W(x0, y + 26, x1, y + 26, c=LIN, lw=1))
    bh = 20
    # A: ブロッキング
    y = ys[0]
    o.append(RECT(X(5), y + 4, X(60) - X(5), bh, 3, ASOFT, ALI, 1.1))
    o.append(T((X(5) + X(60)) / 2, y + 18, "応答だけを待つ（ほかの仕事はできない）", "middle", 9.5, ALI, True))
    o.append(RECT(X(60), y + 4, X(64) - X(60), bh, 2, SSOFT, SIG, 1.1))
    o.append(RECT(X(64), y + 4, X(68) - X(64), bh, 2, GOSOFT, GLD, 1.1))
    o.append(DIM(X(30), y + 38, X(64), y + 38, None, c=GLD))
    o.append(T(X(70), y + 18, "ボタンの処理が 34 ms 遅れる", "start", 9.5, GLD, True))
    # B: ポーリング
    y = ys[1]
    for k in range(25):
        t = k * 4
        if 30 <= t < 34 or 60 <= t < 64:
            continue
        o.append(RECT(X(t), y + 4, X(t + 1.6) - X(t), bh, 1, MSOFT, MUT, 0.8))
    o.append(RECT(X(30), y + 4, X(34) - X(30), bh, 2, GOSOFT, GLD, 1.1))
    o.append(RECT(X(60), y + 4, X(64) - X(60), bh, 2, SSOFT, SIG, 1.1))
    o.append(T(X(50), y + 44, "何もなくても「来たか」を確かめ続ける（CPU は眠れない）", "middle", 9.5, MUT))
    # C: イベント駆動
    y = ys[2]
    o.append(T(X(17.5), y + 18, "眠る", "middle", 9.5, MUT))
    o.append(T(X(45), y + 18, "眠る", "middle", 9.5, MUT))
    o.append(T(X(80), y + 18, "眠る", "middle", 9.5, MUT))
    o.append(RECT(X(5), y + 4, X(7) - X(5), bh, 2, MSOFT, INK, 1.1))
    o.append(RECT(X(30), y + 4, X(33) - X(30), bh, 2, GOSOFT, GLD, 1.1))
    o.append(RECT(X(60), y + 4, X(63) - X(60), bh, 2, SSOFT, SIG, 1.1))
    o.append(T(X(50), y + 44, "出来事が来たときだけ起きて、来た順に処理する", "middle", 9.5, MUT))
    ya = ys[2] + 64
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1.1))
    for t in range(0, 101, 20):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d ms" % t, "middle", 9.5, MUT))
    o.append(LEGEND(x0, ya + 38, [(SIG, "応答の処理"), (GLD, "ボタンの処理"), (MUT, "「来たか」を確かめる・送る")]))
    return SVG(700, ya + 48, o, "同じ出来事の列（5 ms に依頼を送り、30 ms にボタンが押され、60 ms に応答が届く）に対する 3 つの待ち方。ブロッキングで応答だけを待つと、その間の出来事への対応が遅れる。ポーリングは遅れが小さいが、何もない間も確かめ続ける。イベント駆動は、出来事が来たときだけ起きて処理する。")
F["e05_wait"] = _f05_wait()

def _f05_owner():
    o = []
    # 悪い例
    o.append(T(14, 20, "悪い例: 2 つのタスクが、同じ UART に直接書く", "start", 11.5, ALI, True))
    o.append(BOX(14, 32, 130, 34, "タスク A（測定）", None, SIG, SSOFT, SIG, sz=10.5))
    o.append(BOX(14, 76, 130, 34, "タスク B（設定）", None, PUR, PSOFT, PUR, sz=10.5))
    o.append(BOX(214, 54, 66, 34, "UART", None, GLD, GOSOFT, GLD, sz=10.5))
    o.append(ARR(146, 49, 212, 66, c=SIG, lw=1.5))
    o.append(ARR(146, 93, 212, 77, c=PUR, lw=1.5))
    xs = 300
    for k, (lab, c) in enumerate((("A1", SIG), ("A2", SIG), ("B1", PUR), ("A3", SIG), ("B2", PUR), ("B3", PUR))):
        o.append(RECT(xs + k * 40, 59, 34, 24, 4, soft(c), c, 1.1))
        o.append(T(xs + k * 40 + 17, 75, lab, "middle", 10, c, True, True))
    o.append(ARR(xs + 6 * 40, 71, 598, 71, c=MUT, lw=1.4))
    o.append(BOX(600, 54, 86, 34, "子機", None, GRN, GSOFT, GRN, sz=10.5))
    o.append(T(xs + 118, 104, "2 つのメッセージのバイトが混ざって届く", "middle", 10, ALI, True))
    o.append(T(xs + 118, 119, "応答も、待っている 2 つのタスクのどちらが読むか決まらない", "middle", 10, ALI))
    # 良い例
    y0 = 150
    o.append(T(14, y0, "良い例: 通信タスクだけが UART を使い、ほかのタスクはキューで頼む", "start", 11.5, GRN, True))
    o.append(BOX(14, y0 + 14, 130, 34, "タスク A（測定）", None, SIG, SSOFT, SIG, sz=10.5))
    o.append(BOX(14, y0 + 62, 130, 34, "タスク B（設定）", None, PUR, PSOFT, PUR, sz=10.5))
    # キュー
    qx, qy = 196, y0 + 38
    for k in range(4):
        c = (SIG, PUR, SIG, None)[k]
        o.append(RECT(qx + k * 20, qy, 18, 24, 2, soft(c) if c else PAN, c or LIN, 1.1))
    o.append(T(qx + 39, qy - 8, "依頼のキュー", "middle", 10, INK, True))
    o.append(ARR(146, y0 + 31, qx - 2, qy + 8, c=SIG, lw=1.5))
    o.append(ARR(146, y0 + 79, qx - 2, qy + 18, c=PUR, lw=1.5))
    o.append(ARR(qx + 80, qy + 12, 298, qy + 12, c=MUT, lw=1.5))
    o.append(RECT(300, y0 + 22, 150, 56, 8, GSOFT, GRN, 1.4))
    o.append(T(375, y0 + 42, "通信タスク", "middle", 11, INK, True))
    o.append(T(375, y0 + 57, "状態機械とタイマで、", "middle", 9.5, MUT))
    o.append(T(375, y0 + 70, "依頼を 1 つずつ進める", "middle", 9.5, MUT))
    o.append(DARR(452, qy + 12, 482, qy + 12, c=MUT, lw=1.4))
    o.append(RECT(484, y0 + 22, 100, 56, 8, GOSOFT, GLD, 1.4))
    o.append(T(534, y0 + 42, "UART", "middle", 10.5, INK, True))
    o.append(T(534, y0 + 57, "ISR と", "middle", 9, MUT))
    o.append(T(534, y0 + 70, "リングバッファ", "middle", 9, MUT))
    o.append(DARR(586, qy + 12, 604, qy + 12, c=MUT, lw=1.4))
    o.append(BOX(606, y0 + 32, 80, 36, "子機", None, GRN, GSOFT, GRN, sz=10.5))
    # 結果を返す
    yr = y0 + 112
    o.append(W(375, y0 + 80, 375, yr, 80, yr, c=GRN, lw=1.4, dash="5 3"))
    o.append(ARR(80, yr, 80, y0 + 98, c=GRN, lw=1.4, dash="5 3"))
    o.append(T(232, yr + 15, "結果は、依頼したタスクへ返す（返事のキュー・通知など）", "middle", 10, GRN))
    return SVG(700, yr + 26, o, "1 つの通信路を複数のタスクが使う場合。上のように各タスクが直接書くと、メッセージのバイトが混ざり、応答の受け取り手も決まらない。下のように通信路の持ち主を 1 つのタスクに決め、ほかのタスクはキューで依頼すれば、送受信は 1 か所で順に行われる。")
F["e05_owner"] = _f05_owner()

# ---- 3 節: ティックの一周と期限の比較 ----
def _f05_arc(cx, cy, r, a0, a1, c, lw):
    """時計回りの角度 a0→a1（度、真上が 0）の円弧。"""
    p = lambda a: (cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a)))
    (x0, y0), (x1, y1) = p(a0), p(a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return '<path d="M%.2f,%.2f A%g,%g 0 %d 1 %.2f,%.2f" fill="none" stroke="%s" stroke-width="%g" stroke-linecap="butt"/>' % (x0, y0, r, r, large, x1, y1, c, lw)

def _f05_wrap():
    o = []
    cx, cy, r = 150, 150, 86
    o.append(T(cx, 22, "32 ビットのカウンタは輪のように一周する", "middle", 11, INK, True))
    o.append(CIRC(cx, cy, r, LIN, 1.2))
    for v, lab, a in ((0, "00000000", 0), (0x40000000, "40000000", 90), (0x80000000, "80000000", 180), (0xC0000000, "C0000000", 270)):
        x = cx + (r + 8) * math.sin(math.radians(a)); y = cy - (r + 8) * math.cos(math.radians(a))
        o.append(T(x + (4 if a == 90 else (-4 if a == 270 else 0)), y + (4 if a in (90, 270) else (-2 if a == 0 else 12)), lab, "start" if a == 90 else ("end" if a == 270 else "middle"), 9.5, MUT, False, True))
    ad, an = 24, -34          # 期限と今の位置（誇張して描く）
    o.append(_f05_arc(cx, cy, r - 12, ad, ad + 180, GRN, 7))
    o.append(_f05_arc(cx, cy, r - 12, ad + 180, ad + 360, GLD, 7))
    pd = (cx + r * math.sin(math.radians(ad)), cy - r * math.cos(math.radians(ad)))
    pn = (cx + r * math.sin(math.radians(an)), cy - r * math.cos(math.radians(an)))
    o.append(D(pd[0], pd[1], ALI, 5)); o.append(D(pn[0], pn[1], SIG, 5))
    o.append(T(pd[0] + 8, pd[1] - 6, "期限", "start", 10.5, ALI, True))
    o.append(T(pn[0] - 8, pn[1] - 6, "今", "end", 10.5, SIG, True))
    o.append(W(cx, cy, cx + r * math.sin(math.radians(ad + 180)), cy - r * math.cos(math.radians(ad + 180)), c=FNT, lw=1, dash="3 3"))
    o.append(T(cx + 26, cy - 22, "期限から", "middle", 9.5, GRN, True))
    o.append(T(cx + 26, cy - 9, "時計回りに半周", "middle", 9.5, GRN, True))
    o.append(T(cx + 26, cy + 4, "＝ 過ぎた", "middle", 9.5, GRN, True))
    o.append(T(cx - 30, cy - 34, "残りの半周", "middle", 9.5, GLD, True))
    o.append(T(cx - 30, cy - 21, "＝ まだ", "middle", 9.5, GLD, True))
    o.append(T(cx, cy + r + 38, "時間は時計回りに進む（位置は誇張）", "middle", 9.5, MUT))
    # 右: 一周の前後の数直線
    x0, x1 = 340, 660
    X = lambda v: x0 + (x1 - x0) * (v + 0x20) / 0x50
    o.append(T((x0 + x1) / 2, 22, "期限 00000010 に対する 2 つの判定", "middle", 11, INK, True))
    rows = [(68, "now >= deadline", [(-0x20, 0, ALI, "成り立つ（誤り）"), (0, 0x10, MSOFT, "成り立たない"), (0x10, 0x30, GRN, "成り立つ")]),
            (138, "(int32_t)(now - deadline) >= 0", [(-0x20, 0x10, MSOFT, "成り立たない（まだ）"), (0x10, 0x30, GRN, "成り立つ")])]
    for y, lab, segs in rows:
        o.append(T(x0, y - 10, lab, "start", 10.5, INK, True, True))
        for a, b, c, t in segs:
            fill = soft(c) if c != MSOFT else MSOFT
            sc = c if c != MSOFT else MUT
            o.append(RECT(X(a), y, X(b) - X(a), 24, 3, fill, sc, 1.1))
            o.append(T((X(a) + X(b)) / 2, y + 16, t, "middle", 9.5, sc, True))
    ya = 190
    o.append(ARR(x0, ya, x1 + 14, ya, c=MUT, lw=1.2))
    o.append(T(x1 + 14, ya - 8, "今（時間の向き）", "end", 9.5, MUT))
    for v in range(-0x20, 0x31, 0x10):
        o.append(W(X(v), ya - 4, X(v), ya + 4, c=MUT, lw=1))
        o.append(T(X(v), ya + 17, "%08X" % (v & 0xFFFFFFFF), "middle", 9, MUT, False, True))
    o.append(W(X(0), 62, X(0), 98, c=FNT, lw=1, dash="3 3") + W(X(0), 133, X(0), ya, c=FNT, lw=1, dash="3 3"))
    o.append(T(X(0), ya + 33, "一周して 0 に戻る", "middle", 9.5, MUT))
    o.append(W(X(0x10), 62, X(0x10), 98, c=ALI, lw=1.4, dash="4 3") + W(X(0x10), 133, X(0x10), ya, c=ALI, lw=1.4, dash="4 3"))
    o.append(T(X(0x10) + 4, ya + 33, "期限", "start", 9.5, ALI, True))
    o.append(T((x0 + x1) / 2, ya + 56, "期限は、今 = FFFFFFF0 のときに 0x20 ティック先として決めた。", "middle", 9.5, MUT))
    return SVG(700, max(ya + 68, cy + r + 48), o, "ティックのカウンタの一周と、期限を過ぎたかの判定。左: 差を符号付きで読むと、期限から時計回りに半周（2^31 ティック）までが「過ぎた」、残りの半周が「まだ」になる。右: 期限が一周の直後（00000010）にあるとき、now >= deadline は一周の前の時刻でも成り立ってしまうが、差を符号付きで読む判定は正しい。")
F["e05_wrap"] = _f05_wrap()

# ---- 4 節: 確認応答と再送 ----
def _f05_arq():
    o = []
    titles = ["(a) 失われない", "(b) データが失われる", "(c) ACK が失われる"]
    sums = [["1 往復で 1 つ届く"], ["送り手は時間切れで再送し、", "2 回目で届く"], ["データは届いていたのに再送する", "→ 受け手に同じデータが 2 回"]]
    for i in range(3):
        px = 4 + i * 232
        xa, xb = px + 70, px + 194
        o.append(T(px + 116, 18, titles[i], "middle", 11, ALI if i else GRN, True))
        _f05_lane(o, xa, 28, 214, "送り手", SIG, 10.5)
        _f05_lane(o, xb, 28, 214, "受け手", GRN, 10.5)
        if i == 0:
            _f05_msg(o, xa, 72, xb, 84, "データ 0", INK)
            _f05_msg(o, xb, 92, xa, 104, "ACK 0", GRN)
            _f05_msg(o, xa, 124, xb, 136, "データ 1", INK)
            _f05_msg(o, xb, 144, xa, 156, "ACK 1", GRN)
        else:
            if i == 1:
                _f05_msg(o, xa, 72, xb, 84, "データ 0", INK, lost=0.55)
            else:
                _f05_msg(o, xa, 72, xb, 84, "データ 0", INK)
                _f05_msg(o, xb, 92, xa, 104, "ACK 0", GRN, lost=0.5)
            _f05_span(o, xa, 72, 150, None, TEA)
            o.append(T(xa - 16, 108, "時間", "end", 9.5, TEA))
            o.append(T(xa - 16, 121, "切れ", "end", 9.5, TEA))
            _f05_msg(o, xa, 150, xb, 162, "データ 0（再送）", INK)
            _f05_msg(o, xb, 170, xa, 182, "ACK 0", GRN)
            if i == 2:
                o.append(T(xb + 6, 88, "渡す", "start", 9.5, GRN, True))
                o.append(T(xb + 6, 168, "2 回目", "start", 9.5, ALI, True))
        for k, l in enumerate(sums[i]):
            o.append(T(px + 116, 236 + k * 15, l, "middle", 10, ALI if (i == 2) else (GRN if i == 0 else INK), i == 2))
    return SVG(700, 266, o, "ストップアンドウェイトの 3 つの場合（時間は上から下へ進む）。送り手は、決めた時間のうちに ACK が来なければ再送する。送り手には (b) と (c) の区別がつかないので、(c) では、届いていたデータをもう一度送ることになる。")
F["e05_arq"] = _f05_arq()

def _f05_seq():
    o = []
    for side in range(2):
        px = 4 + side * 350
        xa, xb = px + 42, px + 186
        good = side == 1
        o.append(T(px + 4, 18, "良い例: 1 ビットのシーケンス番号を付ける" if good else "悪い例: 番号を付けない", "start", 11, GRN if good else ALI, True))
        _f05_lane(o, xa, 28, 236, "送り手", SIG, 10.5)
        _f05_lane(o, xb, 28, 236, "受け手", GRN, 10.5)
        nd = lambda n: ("データ %d（+1）" % n) if good else "データ（+1）"
        _f05_msg(o, xa, 70, xb, 82, nd(0), INK)
        _f05_msg(o, xb, 90, xa, 102, "ACK 0" if good else "ACK", GRN, lost=0.5)
        _f05_span(o, xa, 70, 146, None, TEA)
        o.append(T(xa - 16, 106, "時間", "end", 9.5, TEA)); o.append(T(xa - 16, 119, "切れ", "end", 9.5, TEA))
        _f05_msg(o, xa, 146, xb, 158, "データ（+1）（再送）" if not good else "データ 0（再送）", INK)
        _f05_msg(o, xb, 168, xa, 180, "ACK 0" if good else "ACK", GRN)
        if good:
            _f05_note(o, xb + 10, 62, ["番号 0 を待っていた", "→ 渡す（合計 1）", "次は 1 を待つ"], GRN, a="start", sz=9.5)
            _f05_note(o, xb + 10, 134, ["番号 0 は受け取り済み", "→ 捨てて ACK だけ返す"], GRN, a="start", sz=9.5, b=True)
            _f05_msg(o, xa, 200, xb, 212, "データ 1", INK)
            _f05_note(o, xb + 10, 198, ["番号 1 → 渡す"], GRN, a="start", sz=9.5)
        else:
            _f05_note(o, xb + 10, 62, ["新しいデータ", "→ 渡す（合計 1）"], GRN, a="start", sz=9.5)
            _f05_note(o, xb + 10, 134, ["新しいデータに見える", "→ 渡す（合計 2）"], ALI, a="start", sz=9.5, b=True)
            o.append(T(px + 172, 222, "同じ操作が 2 回行われる", "middle", 10.5, ALI, True))
    return SVG(700, 248, o, "ACK が失われて再送したときの受け手。番号がないと、受け手は再送されたデータと新しいデータを区別できず、同じ操作（ここでは +1）を 2 回行う。0 と 1 を交互に使う番号を付ければ、受け手は既に受け取った番号のデータを捨て、ACK だけを返す。")
F["e05_seq"] = _f05_seq()

def _f05_eff():
    o = []
    x0 = 120
    ys, yr = 52, 122
    o.append(T(x0 - 12, ys + 4, "送り手", "end", 10.5, SIG, True))
    o.append(T(x0 - 12, yr + 4, "受け手", "end", 10.5, GRN, True))
    o.append(W(x0, ys + 12, 690, ys + 12, c=LIN, lw=1))
    o.append(W(x0, yr + 12, 690, yr + 12, c=LIN, lw=1))
    Tf, prop, proc, Ta = 150, 22, 26, 30
    t = x0
    for k in range(2):
        # データ（送り手の線の上の時間 Tf、受け手には prop 遅れて届く）
        o.append(RECT(t, ys - 8, Tf, 20, 3, SSOFT, SIG, 1.2))
        o.append(T(t + Tf / 2, ys + 6, "データ %d" % k, "middle", 10, SIG, True))
        o.append(PL([(t, ys + 12), (t + Tf, ys + 12), (t + Tf + prop, yr - 8), (t + prop, yr - 8)], c=SIG, lw=0.8, fill=SSOFT, op=0.6))
        o.append(RECT(t + prop, yr - 8, Tf, 20, 3, SSOFT, SIG, 1.2))
        tr = t + Tf + prop
        o.append(RECT(tr, yr - 8, proc, 20, 3, MSOFT, MUT, 1.1))
        o.append(RECT(tr + proc, yr - 8, Ta, 20, 3, GSOFT, GRN, 1.2))
        o.append(T(tr + proc + Ta / 2, yr + 6, "ACK", "middle", 9.5, GRN, True))
        ta = tr + proc
        o.append(PL([(ta, yr - 8), (ta + Ta, yr - 8), (ta + Ta + prop, ys + 12), (ta + prop, ys + 12)], c=GRN, lw=0.8, fill=GSOFT, op=0.6))
        o.append(RECT(ta + prop, ys - 8, Ta, 20, 3, GSOFT, GRN, 1.2))
        if k == 0:
            o.append(DIM(t, ys - 18, t + Tf, ys - 18, None, c=SIG))
            o.append(T(t + Tf / 2, ys - 24, "送る時間（長さ ÷ 速さ）", "middle", 10, SIG, True))
            o.append(DIM(t + Tf, ys - 18, ta + Ta + prop, ys - 18, None, c=TEA))
            o.append(T((t + Tf + ta + Ta + prop) / 2, ys - 24, "往復時間（RTT）", "middle", 10, TEA, True))
            o.append(T(tr + proc / 2, yr + 28, "処理", "middle", 9.5, MUT))
        t = ta + Ta + prop
    o.append(T(t + 6, ys + 6, "…", "start", 11, MUT))
    o.append(T(405, yr + 50, "1 周期 = 送る時間 + RTT のうち、線でデータを送っているのは「送る時間」だけ", "middle", 10, INK))
    # 効率のグラフ
    p = Plot(120, yr + 78, 540, 150, (0.01, 1000), (0, 100), xlog=True)
    o.append(p.axes(xl="RTT ÷ 送る時間", yl="効率 [%]", xt=[0.01, 0.1, 1, 10, 100, 1000], yt=[0, 25, 50, 75, 100],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    pts = [(10 ** (k / 25.0), 100 / (1 + 10 ** (k / 25.0))) for k in range(-50, 76)]
    o.append(p.line(pts, c=SIG, lw=2.2))
    for a, c, lab, dx, dy in ((1.6944 / 5.5556, GRN, "UART の例: 76.6 %", 10, -6), (100 / 0.8, ALI, "インターネットの例: 0.79 %", -6, -44)):
        xq, yq = p.X(a), p.Y(100 / (1 + a))
        o.append(D(xq, yq, c, 4.5))
        if dy < -20:
            o.append(W(xq, yq - 5, xq, yq + dy + 4, c=c, lw=1))
        o.append(T(xq + dx, yq + dy, lab, "start" if dx > 0 else "end", 10, c, True))
    return SVG(700, yr + 78 + 150 + 44, o, "ストップアンドウェイトの時間の使い方（上、縮尺は誇張）と効率（下）。送り手は、送り終えてから ACK が届くまでの往復時間（RTT）の間、何も送らない。効率 = 送る時間 ÷ (送る時間 + RTT) は、RTT が送る時間より長くなるほど下がる。")
F["e05_eff"] = _f05_eff()

# ---- 5 節: 指数バックオフとジッタ ----
def _f05_waits():
    o = []
    p = Plot(90, 20, 560, 200, (0.5, 10.5), (0, 72))
    o.append(p.axes(xl="何回目の試みか（k）", yl="試みの前の待ち時間 [s]", xt=list(range(1, 11)), yt=[0, 16, 32, 48, 64],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    ks = list(range(1, 11))
    cap = 64
    w = lambda k: min(cap, 2 ** (k - 1))
    # 全部をランダムにしたときの範囲（帯）
    band = [(p.X(k - 0.38), p.Y(w(k))) for k in ks]
    for k in ks:
        o.append(RECT(p.X(k) - 16, p.Y(w(k)), 32, p.Y(0) - p.Y(w(k)), 2, TSOFT, "none", 0))
    import random as _r
    rr = _r.Random(5)
    for k in ks:
        for j in range(4):
            o.append(D(p.X(k) - 9 + 6 * j, p.Y(rr.uniform(0, w(k))), TEA, 2.6))
    # 固定・指数（上限なし）・指数（上限あり）
    o.append(p.line([(1, 2), (10, 2)], c=GLD, lw=2))
    o.append(T(p.X(10.3), p.Y(2) - 6, "固定（2 s）", "end", 10, GLD, True))
    nc = [(k, 2 ** (k - 1)) for k in range(1, 8)]
    o.append(p.line(nc + [(7.3, 72)], c=ALI, lw=1.6, dash="5 4"))
    o.append(T(p.X(7.4), p.Y(70), "上限なし: 128, 256, … と増え続ける", "start", 10, ALI))
    o.append(p.line([(k, w(k)) for k in ks], c=SIG, lw=2.4))
    for k in ks:
        o.append(D(p.X(k), p.Y(w(k)), SIG, 3.6))
    o.append(T(p.X(9.5), p.Y(64) + 16, "上限 64 s", "middle", 10, SIG, True))
    o.append(LEGEND(90, 268, [(SIG, "指数バックオフ（1, 2, 4, … s、上限 64 s）"), (TEA, "全部をランダムに（0〜その値の一様乱数。点は例）")]))
    return SVG(700, 280, o, "k 回目の試みの前の待ち時間。固定の間隔に対し、指数バックオフは失敗するたびに 2 倍にし、上限で止める。全部をランダムにする方式では、待ち時間を 0 からその値までの一様乱数で選ぶ（帯の範囲）。")
F["e05_waits"] = _f05_waits()

def _f05_sync():
    o = []
    import random as _r
    rr = _r.Random(11)
    x0, x1 = 150, 684
    X = lambda t: x0 + (x1 - x0) * t / 70.0
    pols = [("固定（2 s ごと）", "fixed"), ("指数バックオフ", "exp"), ("指数バックオフ +", "full")]
    y = 30
    for name, pol in pols:
        o.append(T(14, y + 26, name, "start", 11, INK, True))
        if pol == "full":
            o.append(T(14, y + 41, "全部をランダムに", "start", 11, INK, True))
        times_all = []
        for d in range(4):
            yy = y + 10 + d * 14
            o.append(T(x0 - 8, yy + 4, "機器 %d" % (d + 1), "end", 9, MUT))
            o.append(W(x0, yy, x1, yy, c=GRD, lw=1))
            t, k, ts = 0.0, 1, []
            while True:
                if pol == "fixed":
                    wv = 2.0
                elif pol == "exp":
                    wv = min(64, 2 ** (k - 1))
                else:
                    wv = rr.uniform(0, min(64, 2 ** (k - 1)))
                t += wv; k += 1
                if t > 70: break
                ts.append(t)
            for tt in ts:
                o.append(D(X(tt), yy, SIG if pol != "full" else TEA, 3.4))
            times_all.append(ts)
        if pol != "full":
            for tt in times_all[0]:
                o.append(W(X(tt), y + 3, X(tt), y + 10 + 3 * 14 + 7, c=ALI, lw=1, dash="2 2"))
            o.append(T(x1, y + 3, "4 台が同じ時刻に試みる（赤の線）", "end", 9.5, ALI, True))
        else:
            o.append(T(x1, y + 3, "時刻が散らばる", "end", 9.5, TEA, True))
        y += 86
    o.append(W(x0, y - 10, x1, y - 10, c=MUT, lw=1.1))
    for t in range(0, 71, 10):
        o.append(W(X(t), y - 10, X(t), y - 6, c=MUT, lw=1))
        o.append(T(X(t), y + 4, "%d s" % t, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, y + 22, "切断に気づいてからの時間（4 台とも 0 s に気づいたとする）", "middle", 10, MUT))
    return SVG(700, y + 32, o, "同じ時刻に切断に気づいた 4 台の機器が、再接続を試みる時刻（点）。固定の間隔でも指数バックオフでも、全台が同じ規則で待つので、同じ時刻に試み続ける。待ち時間を乱数で選ぶと、試みの時刻が散らばる。")
F["e05_sync"] = _f05_sync()

def _f05_stormsim(N=1000, C=50, Tdown=30.0, base=1.0, cap=64.0, policy="full", seed=1):
    import random as _r, heapq as _h
    rnd = _r.Random(seed)
    def wait(k):
        w = base if policy == "fixed" else min(cap, base * 2 ** k)
        return rnd.uniform(0, w) if policy == "full" else w
    h = [(wait(0), i, 0) for i in range(N)]
    _h.heapify(h)
    used, att, ok = {}, {}, {}
    last, total = 0.0, 0
    while h:
        t, i, k = _h.heappop(h)
        b = int(t)
        att[b] = att.get(b, 0) + 1; total += 1
        if t >= Tdown and used.get(b, 0) < C:
            used[b] = used.get(b, 0) + 1; ok[b] = ok.get(b, 0) + 1; last = t
            continue
        _h.heappush(h, (t + wait(k + 1), i, k + 1))
    return att, ok, last, total

def _f05_storm():
    o = []
    tmax, ymax = 130, 200
    rows = [("固定（1 s ごと）", "fixed"), ("指数バックオフ（ジッタなし）", "exp"), ("指数バックオフ + 全部をランダムに", "full")]
    y = 16
    for name, pol in rows:
        att, ok, last, total = _f05_stormsim(policy=pol)
        p = Plot(70, y + 20, 600, 86, (0, tmax), (0, ymax))
        o.append(T(70, y + 10, name, "start", 11, INK, True))
        o.append(T(670, y + 10, "全台がつながる: %s s ・ 試みの合計 %s 件" % ("%d" % round(last), "{:,}".format(total)), "end", 10, SIG if pol == "full" else ALI, True))
        o.append(RECT(p.X(0), p.y, p.X(30) - p.X(0), p.h, 0, MSOFT, "none", 0))
        o.append(p.axes(yt=[0, 50, 100, 200], xt=list(range(0, tmax + 1, 10)) if pol == "full" else [], yfmt=lambda v: "%d" % v,
                        xfmt=lambda v: "%d" % v, sz=9))
        o.append(p.line([(0, 50), (tmax, 50)], c=GRN, lw=1.1, dash="4 3"))
        clip = False
        for b in range(0, tmax):
            a = att.get(b, 0); g = ok.get(b, 0)
            if not a: continue
            av = min(a, ymax)
            o.append(RECT(p.X(b) + 0.4, p.Y(av), p.X(b + 1) - p.X(b) - 0.8, p.Y(0) - p.Y(av), 0, ASOFT, ALI, 0.6))
            if g:
                o.append(RECT(p.X(b) + 0.4, p.Y(g), p.X(b + 1) - p.X(b) - 0.8, p.Y(0) - p.Y(g), 0, GSOFT, GRN, 0.6))
            if a > ymax:
                clip = True
                if pol == "exp" and b >= 15:
                    o.append(T(p.X(b + 0.5), p.Y(ymax) - 3, "%d" % a, "middle", 8.5, ALI, True))
        if pol == "fixed":
            o.append(T(p.X(56), p.Y(150), "← 止まっている間は毎秒 1000 件（縦軸の外）", "start", 9.5, ALI))
        if pol == "exp":
            o.append(T(p.X(33), p.Y(150), "← 1・3・7 s にも", "start", 9.5, ALI))
            o.append(T(p.X(33) + 12, p.Y(150) + 13, "1000 件ずつ", "start", 9.5, ALI))
            o.append(T(p.X(128), p.Y(150), "次の山は 191 s、255 s、…（図の外）", "end", 9.5, ALI))
        if pol == "full":
            o.append(T(p.X(40), p.Y(150), "← 最初の数秒は 200 件を超える（縦軸の外）", "start", 9.5, ALI))
        y += 128
    o.append(T(370, y + 14, "時刻 [s]（灰色: サーバが止まっている 30 s。緑の破線: サーバが 1 秒に受け付けられる 50 件）", "middle", 10, MUT))
    o.append(LEGEND(70, y + 34, [(GRN, "つながった試み"), (ALI, "断られた試み（1 秒あたりの件数。縦軸は 200 で切っている）")]))
    return SVG(700, y + 44, o, "1000 台が同時に切断に気づき、30 s 止まったサーバに再接続する場合の、サーバに届く 1 秒ごとの試みの数（最初の待ち時間 1 s、上限 64 s。サーバは戻った後、1 秒に 50 件まで受け付けるとした）。ジッタのない指数バックオフでは 1000 台が同じ瞬間に試み続け、1 回の山で 50 台しかつながらないので、全台がつながるまでに 1200 s 以上かかる。")
F["e05_storm"] = _f05_storm()

# ---- 6 節: ウォッチドッグ ----
def _f05_wdt():
    o = []
    x0, x1 = 150, 684
    X = lambda t: x0 + (x1 - x0) * t / 6.0
    hang, P, Tw = 3.0, 0.25, 1.0
    rows = [(34, "通信タスク", "チェックイン", SIG), (64, "センサのタスク", "チェックイン", PUR), (94, "監視タスク", "キック", GRN)]
    for y, n1, n2, c in rows:
        o.append(T(x0 - 10, y + 4, n1, "end", 10.5, c, True))
        o.append(T(x0 - 10, y + 17, n2, "end", 9, MUT))
        o.append(W(x0, y + 4, x1, y + 4, c=GRD, lw=1))
    for k in range(0, 60):
        t = k * 0.1
        if t < hang - 1e-9:
            o.append(W(X(t), 28, X(t), 40, c=SIG, lw=1.4))
    o.append(W(X(hang) - 5, 29, X(hang) + 5, 39, c=ALI, lw=2) + W(X(hang) - 5, 39, X(hang) + 5, 29, c=ALI, lw=2))
    o.append(T(X(hang) + 9, 32, "3 s で止まる（以後チェックインしない）", "start", 9.5, ALI, True))
    for k in range(0, 31):
        o.append(W(X(k * 0.2), 58, X(k * 0.2), 70, c=PUR, lw=1.4))
    lastkick = 0.0
    for k in range(0, 25):
        t = k * P
        if t <= hang + 1e-9:
            o.append(D(X(t), 98, GRN, 3.4)); lastkick = t
        else:
            o.append(CIRC(X(t), 98, 3.2, ALI, 1.2))
    o.append(T(X(hang + 0.4), 116, "○: 通信タスクのチェックインがないので、キックしない", "start", 9.5, ALI))
    # 残り時間
    p = Plot(x0, 130, x1 - x0, 90, (0, 6), (0, 1.1))
    o.append(p.axes(yl="残り [s]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.5, 1.0], xfmt=lambda v: "%d s" % v, yfmt=lambda v: "%g" % v, sz=9))
    pts = [(0, Tw)]
    t = 0.0
    while t < lastkick - 1e-9:
        pts.append((t + P, Tw - P)); pts.append((t + P, Tw)); t += P
    pts.append((lastkick + Tw, 0))
    o.append(p.line(pts, c=GLD, lw=2))
    o.append(D(p.X(lastkick + Tw), p.Y(0), ALI, 5))
    o.append(T(p.X(lastkick + Tw) + 8, p.Y(0) - 22, "残りが 0 →", "start", 10, ALI, True))
    o.append(T(p.X(lastkick + Tw) + 8, p.Y(0) - 8, "マイコンをリセット", "start", 10, ALI, True))
    o.append(DIM(p.X(lastkick), p.Y(1.05), p.X(lastkick + Tw), p.Y(1.05), None, c=MUT))
    o.append(T(p.X(lastkick + Tw / 2) + 14, p.Y(1.05) + 14, "ウォッチドッグの時間 1 s", "start", 9.5, MUT))
    o.append(T(14, 176, "ウォッチドッグ", "start", 10.5, GLD, True))
    o.append(T(14, 190, "の残り時間", "start", 10.5, GLD, True))
    return SVG(700, 262, o, "ウォッチドッグタイマの動き（監視の周期 0.25 s、ウォッチドッグの時間 1 s）。監視タスクは、全タスクのチェックインがそろっているときだけキックし、残り時間を戻す。通信タスクが 3 s で止まると、次の監視からキックされなくなり、最後のキックから 1 s でマイコンがリセットされる。")
F["e05_wdt"] = _f05_wdt()

def _f05_kick():
    o = []
    cols = [["CPU ごと止まる", "（割り込みも", "止まる）"], ["あるタスクが", "CPU を使い続ける", "（無限ループ）"], ["あるタスクが", "永久に待つ", "（デッドロックなど）"], ["通信の手順が", "同じ状態から", "進まない"]]
    rows = [(["タイマ割り込みの", "中でキックする"], [1, 0, 0, 0]),
            (["アイドルタスク（最も優先度", "の低いタスク）でキックする"], [1, 1, 0, 0]),
            (["監視タスク: 全タスクの", "チェックインでキックする"], [1, 1, 1, 0]),
            (["監視タスク + 通信タスクは", "手順が進むときだけチェックイン"], [1, 1, 1, 1])]
    xl, cw, y0, hh, rh = 14, 116, 10, 54, 40
    xc = 230
    o.append(T(xl, y0 + 22, "キックする場所", "start", 10.5, INK, True))
    o.append(T(xl, y0 + 38, "＼ 起きた故障", "start", 10.5, INK, True))
    for j, lines in enumerate(cols):
        x = xc + j * cw
        o.append(RECT(x + 2, y0, cw - 4, hh, 5, MSOFT, LIN, 1))
        for i, l in enumerate(lines):
            o.append(T(x + cw / 2, y0 + 16 + i * 14, l, "middle", 9.5, INK, i < 2))
    for r, (lab, vals) in enumerate(rows):
        y = y0 + hh + 6 + r * (rh + 4)
        good = r == 3
        o.append(RECT(xl, y, xc - xl - 6, rh, 5, GSOFT if good else PAN, GRN if good else LIN, 1.2 if good else 1))
        for i, l in enumerate(lab):
            o.append(T(xl + 8, y + 16 + i * 14, l, "start", 9.5, INK, good))
        for j, v in enumerate(vals):
            x = xc + j * cw
            c = GRN if v else ALI
            o.append(RECT(x + 2, y, cw - 4, rh, 5, soft(c), c, 1))
            o.append(T(x + cw / 2, y + 25, "○ 検出する" if v else "× 検出しない", "middle", 10.5, c, True))
    yb = y0 + hh + 6 + 4 * (rh + 4) + 14
    o.append(T(xl, yb, "どの故障でも検出できるのは、各タスクと通信の手順が「進んでいる」ことを確かめてからキックする形だけである。", "start", 10, INK))
    return SVG(700, yb + 10, o, "ウォッチドッグをキックする場所と、検出できる故障。タイマ割り込みは、タスクが止まっていても動き続けるので、CPU ごと止まったときしか検出しない。アイドルタスクは、どれかのタスクが CPU を使い続けると動けなくなるが、タスクが眠ったまま待ち続けると動いてしまう。")
F["e05_kick"] = _f05_kick()
