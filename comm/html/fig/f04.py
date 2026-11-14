# -*- coding: utf-8 -*-
# 04 章 割り込み・DMA・リングバッファ の図
# 色: UART・バッファ = SIG、ISR・DMA（運ぶもの）= GLD、タスク = PUR、失われるもの = ALI、時間 = TEA

def _f04_lv(x0, u, y, h, segs, c=SIG, lw=1.8):
    """0/1 の時間変化を線で描く。segs = [(t0, t1, 0 か 1), ...]（t は u 倍して x0 に足す）。"""
    pts = []
    for t0, t1, v in segs:
        yy = y + (0 if v else h)
        if pts and abs(pts[-1][1] - yy) > 0.1:
            pts.append((x0 + t0 * u, pts[-1][1]))
        pts.append((x0 + t0 * u, yy))
        pts.append((x0 + t1 * u, yy))
    return PL(pts, c=c, lw=lw)

def _f04_cells(x, y, w, h, vals, fills=None, sz=10.5, mono=True, c=SIG):
    """横に並ぶ箱（配列）。vals は各箱の文字、fills は各箱の色（None なら空）。"""
    o = []
    for i, v in enumerate(vals):
        f = fills[i] if fills else None
        o.append(RECT(x + i * w, y, w, h, 2, soft(f) if f else PAN, f or LIN, 1.1))
        if v != "":
            o.append(T(x + i * w + w / 2, y + h / 2 + sz * 0.36, v, "middle", sz, f or INK, True, mono))
    return "".join(o)

# ---- 1 節: 受信レジスタと 3 つの受け取り方 ----
def _f04_rxpath():
    o = []
    o.append(RECT(176, 26, 386, 160, 10, "none", SIG, 1.2, dash="5 4"))
    o.append(T(188, 43, "UART（マイコンの周辺回路）", "start", 10.5, SIG, True))
    o.append(T(20, 46, "RX の線", "start", 10.5, INK, True))
    o.append(DWAVE(20, 62, [0, 1, 0, 0, 0, 0, 0, 1, 0, 1], bit_w=13, h=18, c=SIG, lw=1.8))
    o.append(T(85, 100, "1 ビットずつ届く", "middle", 9.5, MUT))
    o.append(ARR(154, 74, 192, 74, c=SIG, lw=1.6))
    o.append(BOX(194, 54, 132, 44, "シフトレジスタ", "ビットを 1 つずつ集める", SIG, SSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(328, 76, 390, 76, c=SIG, lw=1.6))
    o.append(T(359, 69, "1 バイト", "middle", 9.5, SIG))
    o.append(BOX(392, 54, 156, 44, "受信データレジスタ", "読まれるまで 1 バイトを置く", SIG, SSOFT, INK, sz=11, ssz=9.5))
    o.append(T(470, 112, "（FIFO なら数バイト〜数十バイト）", "middle", 9.5, MUT))
    o.append(ARR(550, 76, 600, 76, c=PUR, lw=1.6))
    o.append(T(575, 69, "読む", "middle", 9.5, PUR, True))
    o.append(BOX(602, 54, 88, 44, "CPU", "ソフトウェア", PUR, PSOFT, INK, sz=11, ssz=9.5))
    s, w = CHIP(194, 140, "受信データあり", SIG, sz=10)
    o.append(s)
    o.append(T(194 + w + 8, 140, "1 バイトを移したときに立ち、読むと消える", "start", 10, INK))
    s, w = CHIP(194, 168, "オーバーラン", ALI, sz=10)
    o.append(s)
    o.append(T(194 + w + 8, 168, "移す先が読まれていないときに立つ（1 バイトを失う）", "start", 10, ALI))
    return SVG(700, 200, o, "UART の受信の経路。RX の線から届いたビットはシフトレジスタに集められ、ストップビットまで受け取ると 1 バイトが受信データレジスタに移されて、「受信データあり」の印が立つ。ソフトウェアがそれを読む前に次のバイトを受け取り終えると、オーバーランになる。")
F["e04_rxpath"] = _f04_rxpath()

def _f04_overrun():
    o = []
    x0, u = 156, 110
    X = lambda t: x0 + t * u
    def panel(y, title, good):
        o.append(T(20, y, title, "start", 11, GRN if good else ALI, True))
        yl, yr = y + 30, y + 74
        o.append(T(x0 - 10, yl + 15, "線の上（RX）", "end", 10, MUT))
        o.append(T(x0 - 10, yr + 15, "受信データレジスタ", "end", 10, MUT))
        for k in range(4):
            o.append(RECT(X(k) + 1, yl, u - 2, 22, 3, SSOFT, SIG, 1.1))
            o.append(T(X(k) + u / 2, yl + 15, "バイト %d を受信中" % (k + 1), "middle", 9.5, SIG))
        o.append(RECT(X(0), yr, X(4.7) - X(0), 22, 3, SCR, LIN, 1))
        if good:
            for k in range(1, 5):
                o.append(ARR(X(k), yl + 23, X(k), yr - 1, c=SIG, lw=1.2, head=5))
                o.append(RECT(X(k), yr, 0.32 * u, 22, 3, SSOFT, SIG, 1.2))
                o.append(T(X(k) + 0.16 * u, yr + 15, str(k), "middle", 10, SIG, True, True))
                o.append(ARR(X(k + 0.32), yr + 24, X(k + 0.32), yr + 38, c=GRN, lw=1.4, head=5))
                o.append(T(X(k + 0.32), yr + 50, "読む", "middle", 9.5, GRN))
        else:
            o.append(ARR(X(1), yl + 23, X(1), yr - 1, c=SIG, lw=1.2, head=5))
            o.append(RECT(X(1), yr, X(3.5) - X(1), 22, 3, SSOFT, SIG, 1.2))
            o.append(T((X(1) + X(3.5)) / 2, yr + 15, "バイト 1（まだ読まれていない）", "middle", 9.5, SIG, True))
            for k in (2, 3):
                ym = (yl + 22 + yr) / 2
                o.append(W(X(k), yl + 23, X(k), ym - 3, c=ALI, lw=1.2))
                o.append(W(X(k) - 5, ym - 5, X(k) + 5, ym + 5, c=ALI, lw=2.2))
                o.append(W(X(k) - 5, ym + 5, X(k) + 5, ym - 5, c=ALI, lw=2.2))
                o.append(T(X(k) + 9, ym + 4, "移せない", "start", 9.5, ALI))
                o.append(T(X(k), yr + 40, "バイト %d を失う" % k, "middle", 9.5, ALI, True))
            o.append(ARR(X(3.5), yr + 24, X(3.5), yr + 38, c=MUT, lw=1.4, head=5))
            o.append(T(X(3.5) + 4, yr + 50, "やっと読む", "middle", 9.5, MUT))
            o.append(ARR(X(4), yl + 23, X(4), yr - 1, c=SIG, lw=1.2, head=5))
            o.append(RECT(X(4), yr, 0.32 * u, 22, 3, SSOFT, SIG, 1.2))
            o.append(T(X(4) + 0.16 * u, yr + 15, "4", "middle", 10, SIG, True, True))
    panel(20, "良い例: 次のバイトを受け取り終える前に読む", True)
    o.append(DIM(X(1), 42, X(2), 42, None, c=TEA))
    o.append(T(X(2) + 8, 46, "1 バイトの時間（115200 bps・8N1 で 86.8 µs）以内に読む", "start", 9.5, TEA))
    panel(178, "悪い例: 読むのが遅れると、後から受け取り終えたバイトが失われる", False)
    return SVG(700, 312, o,"受信データレジスタが 1 バイト分の UART。送り手が続けて送ると、バイトは 1 バイトの時間ごとに受け取り終わる。その前に読めば失われない（上）。読むのが遅れると、受け取り終えたバイトを移す先がなく、オーバーランで失われる（下。多くの UART では後から届いたバイトが失われる）。")
F["e04_overrun"] = _f04_overrun()

def _f04_three():
    o = []
    x0, u = 150, 58
    X = lambda t: x0 + t * u
    o.append(T(x0 - 12, 32, "線の上（RX）", "end", 10, MUT))
    for k in range(8):
        o.append(RECT(X(k) + 1, 20, u - 2, 18, 3, SSOFT, SIG, 1))
        o.append(T(X(k) + u / 2, 33, str(k + 1), "middle", 9.5, SIG, True, True))
    o.append(T(X(8) + 8, 33, "…", "start", 10, MUT))
    rows = [("ポーリング", 64), ("割り込み", 124), ("DMA", 184)]
    for name, y in rows:
        o.append(T(20, y + 14, name, "start", 11.5, INK, True))
        o.append(W(20, y - 12, 690, y - 12, c=LIN, lw=1))
    # ポーリング
    y = 64
    o.append(T(x0 - 12, y + 15, "CPU", "end", 10, MUT))
    o.append(RECT(X(0), y, X(8.6) - X(0), 22, 3, MSOFT, MUT, 1.1))
    o.append(T(X(0) + 8, y + 15, "印を見に行き続ける（その間ほかの仕事はできない）", "start", 9.5, MUT, True))
    for k in range(1, 9):
        o.append(D(X(k + 0.08), y + 30, GRN, 3))
    o.append(T(X(1.08), y + 46, "● 印が立ったらすぐ読む", "start", 9.5, GRN))
    # 割り込み
    y = 124
    o.append(T(x0 - 12, y + 15, "CPU", "end", 10, MUT))
    o.append(RECT(X(0), y, X(8.6) - X(0), 22, 3, PSOFT, PUR, 1.1))
    o.append(T(X(0.2), y + 15, "タスク", "start", 9.5, PUR, True))
    for k in range(1, 9):
        o.append(RECT(X(k + 0.05), y - 3, 9, 28, 2, GOSOFT, GLD, 1.3))
    o.append(T(X(1.05) + 4, y + 42, "ISR（1 バイトごとに短く動く）", "start", 9.5, GLD, True))
    # DMA
    y = 184
    o.append(T(x0 - 12, y + 15, "DMA", "end", 10, GLD))
    for k in range(1, 9):
        o.append(RECT(X(k + 0.05), y + 4, 9, 14, 2, GOSOFT, GLD, 1.1))
    o.append(T(X(1.05) + 4, y + 33, "DMA が 1 バイトずつ運ぶ", "start", 9.5, GLD, True))
    o.append(T(x0 - 12, y + 57, "CPU", "end", 10, MUT))
    o.append(RECT(X(0), y + 42, X(8.6) - X(0), 22, 3, PSOFT, PUR, 1.1))
    o.append(T(X(0.2), y + 57, "タスク（受信には関わらない）", "start", 9.5, PUR, True))
    o.append(RECT(X(8.1), y + 39, 11, 28, 2, GOSOFT, GLD, 1.3))
    o.append(T(X(8.1) - 6, y + 82, "決めた数（例: 8 バイト）ごとに知らせ", "end", 9.5, GLD, True))
    o.append(ARR(X(8.1) - 4, y + 77, X(8.1) + 3, y + 69, c=GLD, lw=1.2, head=5))
    return SVG(700, 278, o,"3 つの受け取り方で、CPU が受信に関わる時間。ポーリングでは CPU が印を見続ける。割り込みでは、1 バイト届くたびに短い ISR が動き、それ以外の時間はタスクが動く。DMA では専用の回路が 1 バイトずつ運び、CPU は決めた数を運び終えたときなどに知らせを受けるだけになる。")
F["e04_three"] = _f04_three()

# ---- 2 節: 割り込みハンドラは短く ----
def _f04_latency():
    o = []
    tb = 10 / 115200.0 * 1e3          # 1 バイトの時間 [ms]
    x0, sc = 130, 120.0               # 時刻 0 の x、1 ms の幅
    X = lambda t: x0 + t * sc
    T_END = 4.5
    t0, dur = 0.30, 40 * tb + 0.13    # 長い ISR の始まりと長さ（printf の 3.47 ms と解析）
    def fifo_plot(y, good):
        h = 54
        o.append(RECT(X(0), y, X(T_END) - X(0), h, 2, SCR, LIN, 1))
        o.append(T(x0 - 10, y + h / 2 - 2, "FIFO にたまった", "end", 9.5, MUT))
        o.append(T(x0 - 10, y + h / 2 + 11, "バイト数", "end", 9.5, MUT))
        yv = lambda v: y + h - v / 16.0 * (h - 6)
        o.append(W(X(0), yv(16), X(T_END), yv(16), c=ALI, lw=1.1, dash="5 4"))
        o.append(T(X(T_END) + 4, yv(16) + 4, "16", "start", 9.5, ALI))
        o.append(T(X(T_END) + 4, yv(0) + 4, "0", "start", 9.5, MUT))
        if good:
            o.append(W(X(0), yv(0), X(T_END), yv(0), c=SIG, lw=2))
            o.append(T(X(2.2), yv(0) - 10, "ISR がすぐ読むので、たまるのは多くとも 1 バイト", "middle", 9.5, SIG, True))
        else:
            pts = [(X(0), yv(0))]
            lvl, t, k = 0, t0, 1
            tend = t0 + dur
            full_t = None
            while True:
                ta = t0 + k * tb
                if ta > tend:
                    break
                if lvl < 16:
                    pts.append((X(ta), yv(lvl))); lvl += 1; pts.append((X(ta), yv(lvl)))
                    if lvl == 16:
                        full_t = ta
                k += 1
            pts.append((X(tend), yv(lvl))); pts.append((X(tend), yv(0))); pts.append((X(T_END), yv(0)))
            o.append(PL(pts, c=SIG, lw=2))
            o.append(RECT(X(full_t), y + 1, X(tend) - X(full_t), h - 2, 0, ASOFT, "none", 0))
            o.append(T((X(full_t) + X(tend)) / 2, y + h / 2 + 12, "満杯の後に届いたバイトは失われる", "middle", 9.5, ALI, True))
            o.append(DIM(X(t0), y - 8, X(full_t), y - 8, None, c=TEA))
            o.append(T((X(t0) + X(full_t)) / 2, y - 13, "猶予 16 × 86.8 µs = 1.39 ms", "middle", 9.5, TEA))
        # 届くバイトの目盛
        k = 0
        while k * tb <= T_END:
            o.append(W(X(k * tb), y + h, X(k * tb), y + h + 4, c=FNT, lw=0.8))
            k += 1
    # 悪い例
    o.append(T(20, 20, "悪い例: 受信の ISR の中で、解析して printf で 40 文字を出力する", "start", 11, ALI, True))
    y = 34
    o.append(T(x0 - 10, y + 15, "CPU", "end", 10, MUT))
    o.append(RECT(X(0), y, X(t0) - X(0), 22, 2, PSOFT, PUR, 1))
    o.append(RECT(X(t0), y, X(t0 + dur) - X(t0), 22, 2, GOSOFT, GLD, 1.3))
    o.append(T((X(t0) + X(t0 + dur)) / 2, y + 15, "受信の ISR（解析と、printf の出力が終わるのを待つ）", "middle", 9.5, GLD, True))
    o.append(RECT(X(t0 + dur), y, X(T_END) - X(t0 + dur), 22, 2, PSOFT, PUR, 1))
    fifo_plot(y + 50, False)
    # 良い例
    y2 = 186
    o.append(T(20, y2 - 14, "良い例: ISR は受信バッファに入れて知らせるだけ。解析と printf はタスクで行う", "start", 11, GRN, True))
    o.append(T(x0 - 10, y2 + 11, "ISR", "end", 10, GLD))
    k = 1
    while k * tb <= T_END:
        o.append(W(X(k * tb), y2 + 2, X(k * tb), y2 + 14, c=GLD, lw=1.4))
        k += 1
    y3 = y2 + 20
    o.append(T(x0 - 10, y3 + 15, "CPU", "end", 10, MUT))
    o.append(RECT(X(0), y3, X(t0) - X(0), 22, 2, PSOFT, PUR, 1))
    o.append(RECT(X(t0), y3, X(t0 + dur) - X(t0), 22, 2, PSOFT, PUR, 1.3))
    o.append(T((X(t0) + X(t0 + dur)) / 2, y3 + 15, "タスク: 解析と printf（途中に ISR が割り込んでよい）", "middle", 9.5, PUR, True))
    o.append(RECT(X(t0 + dur), y3, X(T_END) - X(t0 + dur), 22, 2, PSOFT, PUR, 1))
    o.append(T(X(T_END), y3 + 36, "上の金の線: 1 バイトごとに数 µs だけ動く ISR", "end", 9.5, GLD))
    y2 = y3
    fifo_plot(y2 + 46, True)
    yb = y2 + 46 + 54 + 20
    for v in range(0, 5):
        o.append(T(X(v), yb, "%d ms" % v, "middle", 9.5, MUT))
    o.append(T(X(T_END), yb + 16, "時間（目盛の短い線は、115200 bps で 1 バイトを受け取り終える時刻）", "end", 9.5, MUT))
    return SVG(700, yb + 26, o, "受信の ISR を長くした場合（上）と短くした場合（下）。深さ 16 の FIFO は 1.39 ms しか待てないので、ISR の中で 3.47 ms かかる出力を待つと、その間に届いたバイトの多くが失われる。ISR は受信バッファに入れて知らせるだけにし、時間のかかる処理をタスクで行えば、タスクの途中にも ISR が割り込んで、1 バイトずつすぐに読める。")
F["e04_latency"] = _f04_latency()

def _f04_isrjob():
    o = []
    y, h = 46, 96
    o.append(BOX(20, y + 22, 92, 52, "UART", "受信データ", SIG, SSOFT, INK, sz=11.5, ssz=9.5))
    o.append(ARR(114, y + 48, 158, y + 48, c=GLD, lw=1.6))
    o.append(T(136, y + 40, "割り込み", "middle", 9.5, GLD))
    o.append(RECT(160, y, 196, h, 8, GOSOFT, GLD, 1.6))
    o.append(T(258, y + 18, "ISR（短く）", "middle", 11.5, GLD, True))
    for i, s in enumerate(["① FIFO を空になるまで読む", "② 誤りの印を読み、数える", "③ 受信バッファに入れる", "④ タスクに知らせる"]):
        o.append(T(172, y + 38 + i * 16, s, "start", 10, INK))
    o.append(ARR(358, y + 48, 398, y + 48, c=SIG, lw=1.6))
    o.append(T(378, y + 40, "入れる", "middle", 9.5, SIG))
    o.append(BOX(400, y + 18, 130, 60, "受信バッファ", "リングバッファ（3 節）", SIG, SSOFT, INK, sz=11.5, ssz=9.5))
    o.append(ARR(532, y + 48, 572, y + 48, c=PUR, lw=1.6))
    o.append(T(552, y + 40, "取り出す", "middle", 9.5, PUR))
    o.append(RECT(574, y, 116, h, 8, PSOFT, PUR, 1.6))
    o.append(T(632, y + 18, "タスク", "middle", 11.5, PUR, True))
    for i, s in enumerate(["区切りの復号", "誤りの検査", "応答・ログ"]):
        o.append(T(632, y + 42 + i * 16, s, "middle", 10, INK))
    o.append(CARR(300, y - 2, 620, y - 2, bend=0.12, c=GLD, lw=1.4, dash="5 3"))
    o.append(T(460, 18, "知らせる（RTOS ならタスク通知など）", "middle", 9.5, GLD))
    yb = y + h + 26
    o.append(T(160, yb, "ISR でしないこと", "start", 10.5, ALI, True))
    for i, s in enumerate(["× 解析・誤りの検査など時間のかかる処理", "× 待つこと（ループ、RTOS の待つ関数）", "× printf などのライブラリの関数"]):
        o.append(T(160, yb + 18 + i * 16, s, "start", 10, ALI))
    o.append(T(574, yb, "時間のかかる処理はここで", "start", 10, PUR, True))
    o.append(T(574, yb + 18, "（途中に ISR が", "start", 10, PUR))
    o.append(T(574, yb + 34, "割り込んでもよい）", "start", 10, PUR))
    return SVG(700, yb + 62, o, "受信の仕事の分け方。ISR は、読む・誤りを数える・受信バッファに入れる・知らせる、だけをすぐに済ませる。時間のかかる処理は、知らせを受けたタスクが受信バッファから取り出して行う。")
F["e04_isrjob"] = _f04_isrjob()

# ---- 3 節: リングバッファ ----
def _f04_ring():
    o = []
    cx, cy, R = 196, 134, 70
    vals = ["", "", "B", "C", "D", "E", "", ""]
    for i in range(8):
        a = math.radians(-90 + 45 * i)
        x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        f = SIG if vals[i] else None
        o.append(RECT(x - 18, y - 13, 36, 26, 4, SSOFT if f else PAN, SIG if f else LIN, 1.3))
        if vals[i]:
            o.append(T(x, y + 4, vals[i], "middle", 11.5, SIG, True, True))
        o.append(T(cx + (R + 28) * math.cos(a), cy + (R + 28) * math.sin(a) + 4, str(i), "middle", 9.5, FNT, False, True))
    # 向きを示す矢印（時計回り）
    o.append(PATH("M%g,%g A34,34 0 0,1 %g,%g" % (cx - 24, cy - 24, cx + 24, cy - 24), c=MUT, lw=1.3))
    o.append(PL([(cx + 18, cy - 31), (cx + 25, cy - 24), (cx + 15, cy - 21)], c=MUT, lw=1.3))
    o.append(T(cx, cy + 4, "書く向き", "middle", 9.5, MUT))
    # tail（位置 2）と head（位置 6）
    o.append(ARR(cx + R + 36, cy + 34, cx + R + 18, cy + 12, c=PUR, lw=1.5))
    o.append(T(cx + R + 30, cy + 48, "tail（次に読む）", "start", 10, PUR, True))
    o.append(ARR(cx - R - 36, cy + 34, cx - R - 18, cy + 12, c=GLD, lw=1.5))
    o.append(T(cx - R - 30, cy + 48, "head（次に書く）", "end", 10, GLD, True))
    # 右: 配列として
    x0, w = 406, 36
    o.append(T(x0, 24, "同じものを配列として見ると", "start", 10.5, INK, True))
    o.append(CARR(x0 + 8 * w - 8, 84, x0 + 8, 84, bend=-0.16, c=MUT, lw=1.3))
    o.append(T(x0 + 4 * w, 52, "最後の次は先頭（0）に戻る", "middle", 9.5, MUT))
    o.append(_f04_cells(x0, 86, w, 30, vals, [SIG if v else None for v in vals], sz=11.5))
    for i in range(8):
        o.append(T(x0 + i * w + w / 2, 132, str(i), "middle", 9.5, FNT, False, True))
    o.append(ARR(x0 + 2 * w + w / 2, 164, x0 + 2 * w + w / 2, 140, c=PUR, lw=1.5))
    o.append(T(x0 + 2 * w + w / 2, 178, "tail", "middle", 10, PUR, True))
    o.append(ARR(x0 + 6 * w + w / 2, 164, x0 + 6 * w + w / 2, 140, c=GLD, lw=1.5))
    o.append(T(x0 + 6 * w + w / 2, 178, "head", "middle", 10, GLD, True))
    o.append(T(x0 - 10, 206, "書き手（ISR）は head の位置に書いて head を進め、", "start", 10, INK))
    o.append(T(x0 - 10, 222, "読み手（タスク）は tail の位置から読んで tail を進める。", "start", 10, INK))
    o.append(T(x0 - 10, 238, "tail から head の手前までが、まだ読まれていないデータ。", "start", 10, SIG))
    return SVG(700, 252, o, "大きさ 8 のリングバッファ。配列の最後の次は先頭に戻り、輪のように使う。B C D E の 4 バイトが書かれ、まだ読まれていない。次に読むのは位置 2（tail）、次に書くのは位置 6（head）。")
F["e04_ring"] = _f04_ring()

def _f04_fullempty():
    o = []
    w = 22
    xs = [30, 262, 494]
    def arr(x, y, filled, t, h, hn=None):
        vals = ["" for _ in range(8)]
        fills = [SIG if i in filled else None for i in range(8)]
        for i in range(8):
            o.append(T(x + i * w + w / 2, y - 5, str(i), "middle", 8.5, FNT, False, True))
        o.append(_f04_cells(x, y, w, 24, vals, fills))
        if t == h:
            o.append(T(x + t * w + w / 2, y + 38, "t・h", "middle", 9.5, INK, True))
        else:
            o.append(T(x + t * w + w / 2, y + 38, "t", "middle", 10, PUR, True))
            o.append(T(x + h * w + w / 2, y + 38, "h", "middle", 10, GLD, True))
    # 方式 1
    o.append(T(20, 20, "1 つ空ける方式: head・tail は位置（0〜7）。入るのは 7 個", "start", 11, INK, True))
    y = 60
    states = [("空", [], 3, 3, "head = tail（3）なら空"),
              ("3 個入っている", [3, 4, 5], 3, 6, "(6 − 3 + 8) mod 8 = 3 個"),
              ("満杯（7 個）", [3, 4, 5, 6, 7, 0, 1], 3, 2, "head の次（3）が tail なら満杯")]
    for x, (nm, fl, t, h, txt) in zip(xs, states):
        o.append(T(x, y - 18, nm, "start", 10.5, SIG, True))
        arr(x, y, fl, t, h)
        o.append(T(x, y + 56, txt, "start", 9.5, MUT))
    # 方式 2
    o.append(T(20, 150, "増え続ける添字の差で数える方式: head・tail は総数、位置 = 添字 & 7。入るのは 8 個", "start", 11, INK, True))
    y = 190
    states = [("空", [], 11, 11, "head − tail = 11 − 11 = 0 → 空"),
              ("3 個入っている", [3, 4, 5], 11, 14, "head − tail = 14 − 11 = 3 個"),
              ("満杯（8 個）", list(range(8)), 11, 19, "head − tail = 19 − 11 = 8 → 満杯")]
    for x, (nm, fl, t, h, txt) in zip(xs, states):
        o.append(T(x, y - 18, nm, "start", 10.5, SIG, True))
        arr(x, y, fl, t & 7, h & 7)
        o.append(T(x, y + 56, txt, "start", 9.5, MUT))
        o.append(T(x, y + 72, "tail = %d（位置 %d）、head = %d（位置 %d）" % (t, t & 7, h, h & 7), "start", 9.5, MUT))
    o.append(T(20, 290, "t = tail（次に読む位置）、h = head（次に書く位置）。満杯の head の位置は、どちらの方式でも空のときと同じ所に来る。", "start", 9.5, MUT))
    return SVG(700, 302, o, "空と満杯の区別の仕方 2 つ（大きさ 8）。上は要素を 1 つ空けておき、head の次が tail なら満杯とする。下は head と tail を書いた総数・読んだ総数として増やし続け、差で個数を数える。下の満杯の状態では、位置だけを見ると空と同じだが、差は 8 になる。")
F["e04_fullempty"] = _f04_fullempty()

def _f04_wrap():
    o = []
    # (a) 32 ビットの一周
    o.append(T(20, 20, "(a) 32 ビットの添字が一周しても、head − tail は入っている個数になる", "start", 11, INK, True))
    vals = ["0xFFFFFFFC", "0xFFFFFFFD", "0xFFFFFFFE", "0xFFFFFFFF", "0x00000000", "0x00000001", "0x00000002", "0x00000003", "0x00000004"]
    x0, w, y = 34, 70, 56
    for i, v in enumerate(vals):
        f = SIG if 2 <= i <= 6 else None
        o.append(RECT(x0 + i * w, y, w - 4, 26, 3, soft(f) if f else PAN, f or LIN, 1.1))
        o.append(T(x0 + i * w + (w - 4) / 2, y + 17, v, "middle", 9.5, f or MUT, f is not None, True))
    xb = x0 + 4 * w - 2
    o.append(W(xb, y - 10, xb, y + 36, c=TEA, lw=1.8, dash="4 3"))
    o.append(T(xb, y - 14, "ここで一周（0 に戻る）", "middle", 9.5, TEA, True))
    o.append(ARR(x0 + 2 * w + 33, y + 52, x0 + 2 * w + 33, y + 30, c=PUR, lw=1.5))
    o.append(T(x0 + 2 * w + 33, y + 66, "tail", "middle", 10, PUR, True))
    o.append(ARR(x0 + 7 * w + 33, y + 52, x0 + 7 * w + 33, y + 30, c=GLD, lw=1.5))
    o.append(T(x0 + 7 * w + 33, y + 66, "head", "middle", 10, GLD, True))
    o.append(T(20, y + 92, "数学の引き算では 3 − 4294967294 = −4294967291。uint32_t の引き算は 2³² = 4294967296 を足し戻して 5（入っている 5 個）。", "start", 9.5, INK))
    # (b) 8 ビットの添字
    yb = 186
    o.append(T(20, yb, "(b) 添字が 8 ビット（256 で一周）のとき、位置 = 添字 mod N は一周の前後で続くか", "start", 11, INK, True))
    idx = [250, 251, 252, 253, 254, 255, 0, 1, 2, 3]
    x1, w1 = 150, 52
    y1 = yb + 18
    o.append(T(x1 - 10, y1 + 17, "添字", "end", 10, MUT))
    for i, v in enumerate(idx):
        o.append(RECT(x1 + i * w1, y1, w1 - 4, 24, 3, SCR, LIN, 1))
        o.append(T(x1 + i * w1 + (w1 - 4) / 2, y1 + 16, str(v), "middle", 10, INK, False, True))
    xb = x1 + 6 * w1 - 2
    o.append(W(xb, y1 - 4, xb, y1 + 96, c=TEA, lw=1.8, dash="4 3"))
    for r, (N, c, msg) in enumerate([(8, GRN, "N = 8: 位置は 2, 3, …, 7, 0, 1 と続く"), (6, ALI, "N = 6: 252 と 0 が同じ位置 0")]):
        yy = y1 + 34 + r * 34
        o.append(T(x1 - 10, yy + 17, "N = %d の位置" % N, "end", 10, c, True))
        for i, v in enumerate(idx):
            p = v % N
            bad = (N == 6 and v in (252, 0))
            o.append(RECT(x1 + i * w1, yy, w1 - 4, 24, 3, ASOFT if bad else soft(c), ALI if bad else c, 1.6 if bad else 1))
            o.append(T(x1 + i * w1 + (w1 - 4) / 2, yy + 16, str(p), "middle", 10.5, ALI if bad else c, True, True))
    o.append(T(20, y1 + 116, "N = 6 では、4 つしか離れていない添字 252 と 0（本当の通し番号では 256）が同じ位置を使う。5 個以上入っていると、", "start", 9.5, ALI))
    o.append(T(20, y1 + 132, "書き手がまだ読まれていないデータを上書きする。N が 2 のべき乗（256 を割り切る）なら、一周の前後で位置が続く。", "start", 9.5, ALI))
    return SVG(700, y1 + 146, o, "増え続ける添字が一周するとき。(a) 32 ビットの符号なし整数の引き算は 2³² を法として計算されるので、head が一周して tail より小さな値になっても、差は入っている個数に等しい。(b) 位置を添字 mod N で求めるとき、N が添字の一周（ここでは 256）を割り切らないと、一周の前後で位置が飛び、離れた添字が同じ位置を使う。")
F["e04_wrap"] = _f04_wrap()

# ---- 4 節: 割り込みとタスクで共有するときの注意 ----
def _f04_order():
    o = []
    cols = [(20, True, "正しい順番: データを読んでから tail を進める"),
            (366, False, "逆の順番: tail を進めてからデータを読む")]
    cw = 314
    for x, good, title in cols:
        c = GRN if good else ALI
        o.append(T(x, 22, title, "start", 10.5, c, True))
        o.append(T(x, 46, "始め: 満杯（tail = 0、head = 4）", "start", 9.5, MUT))
        o.append(_f04_cells(x + 196, 34, 28, 22, list("ABCD"), [SIG] * 4, sz=10.5))
        steps = ["① t = tail;            → t = 0", "② head == t か → 4 ≠ 0（空でない）"]
        steps += (["③ *b = buf[t & 3];  → b = A"] if good else ["③ tail = t + 1;      → tail = 1"])
        for i, s in enumerate(steps):
            o.append(T(x + 8, 80 + i * 20, s, "start", 10, PUR, False, True))
        # ISR
        yi = 132
        o.append(RECT(x + 20, yi, cw - 30, 62, 6, GOSOFT, GLD, 1.4))
        o.append(T(x + 30, yi + 16, "ここで ISR が割り込む: ring_put(E)", "start", 10, GLD, True))
        if good:
            o.append(T(x + 30, yi + 34, "head − tail = 4 − 0 = 4 → 満杯", "start", 10, INK, False, True))
            o.append(T(x + 30, yi + 52, "E を捨てて、捨てた数を数える", "start", 10, INK))
        else:
            o.append(T(x + 30, yi + 34, "head − tail = 4 − 1 = 3 → 空きあり", "start", 10, INK, False, True))
            o.append(T(x + 30, yi + 52, "位置 4 & 3 = 0 に E を書き、head = 5", "start", 10, ALI, True))
        s4 = "④ tail = t + 1;      → tail = 1" if good else "④ *b = buf[t & 3];  → b = E"
        o.append(T(x + 8, 216, s4, "start", 10, PUR if good else ALI, not good, True))
        o.append(T(x, 248, "後: ", "start", 9.5, MUT))
        after = list("ABCD") if good else list("EBCD")
        o.append(_f04_cells(x + 26, 236, 28, 22, after, [ALI if (not good and i == 0) else SIG for i in range(4)], sz=10.5))
        o.append(T(x + 148, 251, "tail = 1、head = %d" % (4 if good else 5), "start", 9.5, MUT))
        if good:
            o.append(T(x, 280, "タスクは A を受け取る（正しい）。", "start", 10, GRN, True))
            o.append(T(x, 296, "E は満杯だったので捨てた（数えてある）。", "start", 10, GRN))
        else:
            o.append(T(x, 280, "タスクは A の代わりに E を受け取る。", "start", 10, ALI, True))
            o.append(T(x, 296, "A は失われ、E は後でもう一度読まれる。", "start", 10, ALI))
    o.append(W(350, 14, 350, 300, c=LIN, lw=1))
    return SVG(700, 312, o, "大きさ 4 の満杯の受信バッファから、タスクが ring_get で 1 バイト取り出す途中（3 番目と 4 番目の文の間）に、E を受け取った ISR が割り込んだ場合。正しい順番では、ISR から見たバッファはまだ満杯なので、E を捨てる。逆の順番では、ISR は位置 0 が空いたと判断して E を書き、タスクは A の代わりに E を読む。")
F["e04_order"] = _f04_order()

def _f04_count():
    o = []
    def lane(x, title, good):
        c = GRN if good else ALI
        o.append(T(x, 20, title, "start", 10.5, c, True))
        xt, xi = x + 6, x + 172
        o.append(T(xt + 70, 44, "タスク（count−−）", "middle", 10, PUR, True))
        o.append(T(xi + 72, 44, "ISR（count++）", "middle", 10, GLD, True))
        yend = 194 if not good else 242
        o.append(W(xt + 70, 52, xt + 70, yend, c=PUR, lw=1, dash="3 4"))
        o.append(W(xi + 72, 52, xi + 72, yend, c=GLD, lw=1, dash="3 4"))
        def tb(xx, y, s, cc, wdt=140):
            o.append(RECT(xx, y, wdt, 24, 4, PAN, "none", 0))
            o.append(RECT(xx, y, wdt, 24, 4, soft(cc), cc, 1.2))
            o.append(T(xx + wdt / 2, y + 16, s, "middle", 9.5, INK, False, True))
        if not good:
            tb(xt, 62, "読む: c = 5", PUR)
            tb(xi, 96, "読む 5 → 書く 6", GLD, 144)
            tb(xt, 130, "1 を引く: c = 4", PUR)
            tb(xt, 164, "書く: count = 4", PUR)
            o.append(T(x, 216, "count = 4。正しくは 5（1 つ入り、1 つ出た）。", "start", 10, ALI, True))
            o.append(T(x, 234, "ISR が足した 1 が、タスクの書き戻しで消えた。", "start", 10, ALI))
            o.append(T(x, 252, "count を volatile にしても防げない。", "start", 10, ALI))
        else:
            tb(xt, 62, "割り込みを禁止", TEA)
            tb(xt, 92, "読む: c = 5", PUR)
            tb(xt, 122, "1 を引く: c = 4", PUR)
            tb(xt, 152, "書く: count = 4", PUR)
            tb(xt, 182, "割り込みを戻す", TEA)
            o.append(RECT(xi, 92, 144, 84, 4, PAN, GLD, 1.2, dash="4 3"))
            o.append(T(xi + 72, 124, "要求は出ているが", "middle", 9.5, GLD))
            o.append(T(xi + 72, 140, "待たされる", "middle", 9.5, GLD))
            tb(xi, 212, "読む 4 → 書く 5", GLD, 144)
            o.append(T(x, 258, "count = 5（正しい）。ISR は、禁止していた", "start", 10, GRN, True))
            o.append(T(x, 274, "時間だけ遅れる（割り込み遅延が増える）。", "start", 10, GRN))
    lane(16, "悪い例: 個数を 1 つの変数 count で数える", False)
    lane(364, "クリティカルセクションで囲む", True)
    o.append(W(352, 12, 352, 280, c=LIN, lw=1))
    return SVG(700, 290, o, "読んで・変えて・書き戻す操作の競合。左: タスクの count−− が読んでから書き戻すまでの間に ISR の count++ が入ると、ISR の変更が消える。右: タスクがその間だけ割り込みを禁止すれば、ISR は禁止が解けるまで待ってから動く。リングバッファでは head と tail を別々の変数にし、それぞれを片方だけが書き換えることで、この競合そのものを避けている。")
F["e04_count"] = _f04_count()

# ---- 5 節: バッファの大きさ ----
def _f04_levelsim(rate, period, cap, stall_at, stall_len, tend, N, dt=0.05):
    """届く速さ rate [B/ms]、読み手の周期 period [ms]、1 回に取り出せる上限 cap [B]。
    stall_at の回の読み出しを stall_len [ms] 遅らせる。返り値は (点の列, 捨てた時刻の列)。"""
    lvl, t, pts, drops = 0.0, 0.0, [(0.0, 0.0)], []
    reads = []
    tr = period
    while tr <= tend:
        if stall_at is not None and abs(tr - stall_at) < 1e-9:
            tr += stall_len - period
        reads.append(tr)
        tr += period
    ri = 0
    while t < tend - 1e-9:
        t2 = t + dt
        lvl += rate * dt
        if lvl > N:
            drops.append(t2); lvl = float(N)
        pts.append((t2, lvl))
        if ri < len(reads) and t2 >= reads[ri] - 1e-9:
            lvl = max(0.0, lvl - cap); pts.append((t2, lvl)); ri += 1
        t = t2
    return pts, drops

def _f04_level():
    o = []
    N = 256
    rate = 11.52                        # 115200 bps: 11.52 バイト/ms
    # 良い例
    o.append(T(20, 18, "読み手がときどき 20 ms 止まる（届く 11520 B/s、読み手は 10 ms ごとに全部取り出す）", "start", 10.5, GRN, True))
    p = Plot(90, 30, 560, 96, (0, 150), (0, 300))
    o.append(p.axes(yl="量 [バイト]", xt=[0, 25, 50, 75, 100, 125, 150], yt=[0, 100, 200, 300], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9.5))
    pts, _ = _f04_levelsim(rate, 10, 1e9, 70, 20, 150, N)
    o.append(p.line([(0, N), (150, N)], c=ALI, lw=1.1, dash="5 4"))
    o.append(T(p.X(150) + 4, p.Y(N) + 4, "N = 256", "start", 9.5, ALI))
    o.append(p.line(pts, c=SIG, lw=1.8))
    o.append(T(p.X(80) + 6, p.Y(230.4) + 2, "20 ms 止まると 230.4 バイト", "start", 9.5, SIG, True))
    o.append(T(p.X(150), p.Y(0) + 28, "時間 [ms]", "end", 9.5, MUT))
    # 悪い例
    y2 = 186
    o.append(T(20, y2 - 12, "読み手の平均の速さが足りない（届く 11520 B/s、読み手は 10 ms ごとに 100 バイトまで = 10000 B/s）", "start", 10.5, ALI, True))
    p2 = Plot(90, y2, 560, 110, (0, 300), (0, 360))
    o.append(p2.axes(yl="量 [バイト]", xt=[0, 50, 100, 150, 200, 250, 300], yt=[0, 100, 200, 300], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9.5))
    # 読んだ直後の量（いちばん少ない所）を結ぶ線: 1 秒あたり 1520 バイトずつ増える
    o.append(p2.line([(10, 15.2), (100, 152)], c=TEA, lw=1.3, dash="5 3"))
    pts2, drops = _f04_levelsim(rate, 10, 100, None, 0, 300, N)
    o.append(p2.line([(0, N), (300, N)], c=ALI, lw=1.1, dash="5 4"))
    o.append(T(p2.X(300) + 4, p2.Y(N) + 4, "N = 256", "start", 9.5, ALI))
    o.append(p2.line(pts2, c=SIG, lw=1.8))
    if drops:
        d0 = drops[0]
        o.append(RECT(p2.X(d0), p2.Y(360), p2.X(300) - p2.X(d0), p2.Y(N) - p2.Y(360), 0, ASOFT, "none", 0))
        o.append(T(p2.X(d0) + 6, p2.Y(360) + 16, "%.0f ms で満杯になり、あふれた分を捨てる" % d0, "start", 9.5, ALI, True))
    o.append(T(p2.X(112), p2.Y(70), "読んだ直後の量（破線）が 1 秒あたり 1520 バイトずつ増える", "start", 9.5, TEA, True))
    o.append(T(p2.X(300), p2.Y(0) + 28, "時間 [ms]", "end", 9.5, MUT))
    return SVG(700, y2 + 146, o, "受信バッファの中の量の時間変化（115200 bps で続けて届く場合）。上: 読み手が 10 ms ごとに全部取り出すなら、たまるのは 115 バイトまでで、1 回だけ 20 ms 止まると 230 バイトになる。256 バイトあれば足りる。下: 読み手が 1 秒あたり平均 10000 バイトしか取り出せないと、読んだ直後の量が 1 秒あたり 1520 バイトずつ増え、この例では 109 ms で満杯になる（読んだ直後の量が 256 に届く 256 ÷ 1520 = 0.17 秒より早い）。")
F["e04_level"] = _f04_level()

# ---- 6 節: DMA ----
def _f04_dma():
    o = []
    o.append(BOX(20, 40, 120, 60, "UART", "受信データレジスタ", SIG, SSOFT, INK, sz=11.5, ssz=9.5))
    o.append(ARR(142, 70, 196, 70, c=GLD, lw=1.8))
    o.append(T(169, 62, "1 バイト", "middle", 9.5, GLD))
    o.append(RECT(198, 26, 200, 92, 8, GOSOFT, GLD, 1.6))
    o.append(T(298, 44, "DMA コントローラ", "middle", 11.5, GLD, True))
    for i, s_ in enumerate(["読み出し元: 受信データレジスタ", "書き込み先: バッファ + 位置", "残り転送数: N − 位置"]):
        o.append(T(210, 64 + i * 17, s_, "start", 9.5, INK))
    o.append(ARR(400, 70, 446, 70, c=GLD, lw=1.8))
    # RAM のバッファ
    x0, w = 448, 30
    o.append(T(x0, 30, "RAM のバッファ（N バイト）", "start", 10.5, SIG, True))
    vals = ["", "", "", "", "", "", "", ""]
    o.append(_f04_cells(x0, 56, w, 28, vals, [SIG, SIG, SIG, SIG, SIG, None, None, None]))
    o.append(ARR(x0 + 5 * w + w / 2, 40, x0 + 5 * w + w / 2, 54, c=GLD, lw=1.4, head=5))
    o.append(T(x0 + 5 * w + w / 2 + 6, 46, "次に書く位置", "start", 9.5, GLD))
    o.append(CARR(x0 + 8 * w - 6, 90, x0 + 6, 90, bend=0.14, c=MUT, lw=1.3))
    o.append(T(x0 + 4 * w, 136, "循環モード: 最後まで書いたら先頭へ", "middle", 9.5, MUT))
    # CPU
    o.append(BOX(250, 186, 200, 46, "CPU", "1 バイトごとには動かない", PUR, PSOFT, INK, sz=11.5, ssz=9.5))
    o.append(ARR(298, 120, 330, 184, c=GLD, lw=1.4))
    o.append(T(324, 150, "半分完了・全部完了", "start", 9.5, GLD, True))
    o.append(T(324, 164, "の割り込み", "start", 9.5, GLD, True))
    o.append(ARR(80, 102, 248, 200, c=SIG, lw=1.4))
    o.append(T(70, 150, "アイドルライン", "middle", 9.5, SIG, True))
    o.append(T(70, 164, "の割り込み", "middle", 9.5, SIG, True))
    o.append(T(470, 206, "知らせを受けたら、前回の位置から", "start", 10, INK))
    o.append(T(470, 222, "今の位置までをまとめて処理する", "start", 10, INK))
    return SVG(700, 246, o, "DMA で受け取る構成。UART が 1 バイト受け取るたびに、DMA コントローラがそれを RAM のバッファへ運び、残り転送数を 1 減らす。循環モードでは、最後まで書くと先頭に戻って書き続ける。CPU は、半分完了・全部完了・アイドルラインの割り込みを受けたときだけ動く。")
F["e04_dma"] = _f04_dma()

def _f04_dmatime():
    o = []
    N = 128
    msgs = [(0, 40), (70, 190), (220, 240)]          # メッセージ（始め、終わり）[バイトの時間]
    TE = 262
    p = Plot(110, 60, 560, 110, (0, TE), (0, N))
    X, Y = p.X, p.Y
    o.append(T(100, 34, "RX の線", "end", 10, MUT))
    for i, (a, b) in enumerate(msgs):
        o.append(RECT(X(a), 22, X(b) - X(a), 18, 3, SSOFT, SIG, 1.1))
        lab = "%d バイト" % (b - a)
        if X(b) - X(a) >= tw(lab, 9.5) + 8:
            o.append(T((X(a) + X(b)) / 2, 35, lab, "middle", 9.5, SIG, True))
        else:
            o.append(T(X(b) + 4, 35, lab, "start", 9.5, SIG, True))
    o.append(p.axes(yl="次に書く位置", xt=[0, 50, 100, 150, 200, 250], yt=[0, 64, 128], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9.5))
    pts, pos = [(0, 0)], 0
    for a, b in msgs:
        pts.append((a, pos))
        for t in range(a + 1, b + 1):
            pos += 1
            if pos == N:
                pts.append((t, N)); pos = 0; pts.append((t, 0))
        pts.append((b, pos))
    pts.append((TE, pos))
    o.append(p.line([(0, 64), (TE, 64)], c=FNT, lw=1, dash="3 3"))
    o.append(T(X(TE) + 4, Y(64) + 4, "半分", "start", 9.5, MUT))
    o.append(T(X(TE) + 4, Y(N) + 4, "N", "start", 9.5, MUT))
    o.append(T(X(TE) + 4, Y(0) + 4, "時間", "start", 9.5, MUT))
    ev = [(41, "アイドル", SIG, "0〜39"), (94, "半分", GLD, "40〜63"), (158, "全部", GLD, "64〜127"), (191, "アイドル", SIG, "0〜31"), (241, "アイドル", SIG, "32〜51")]
    for t, nm, c, rg in ev:
        o.append(W(X(t), Y(N) - 4, X(t), Y(0), c=c, lw=1, dash="2 3"))
    o.append(p.line(pts, c=GLD, lw=2))
    ye = 214
    o.append(T(100, ye + 4, "知らせと", "end", 10, MUT))
    o.append(T(100, ye + 18, "処理する範囲", "end", 10, MUT))
    for t, nm, c, rg in ev:
        s_, w = CHIP(X(t), ye, nm, c, sz=9.5, a="middle")
        o.append(s_)
        o.append(T(X(t), ye + 22, rg, "middle", 9.5, INK, False, True))
    ye2 = 270
    o.append(T(100, ye2 + 4, "アイドルライン", "end", 10, MUT))
    o.append(T(100, ye2 + 18, "検出なし", "end", 10, MUT))
    for t, nm, c, rg in ev:
        if nm == "アイドル":
            continue
        s_, w = CHIP(X(t), ye2, nm, c, sz=9.5, a="middle")
        o.append(s_)
        o.append(T(X(t), ye2 + 22, "0〜63" if t == 94 else "64〜127", "middle", 9.5, INK, False, True))
    o.append(T(X(41), ye2 + 4, "40 バイトは", "middle", 9.5, ALI))
    o.append(T(X(41), ye2 + 18, "「半分」まで待つ", "middle", 9.5, ALI))
    o.append(T(X(224), ye2 + 4, "最後の 32 + 20 バイトは", "middle", 9.5, ALI))
    o.append(T(X(224), ye2 + 18, "次の「半分」まで待つ", "middle", 9.5, ALI))
    return SVG(700, ye2 + 34, o, "大きさ N = 128 の DMA の受信バッファに、40・120・20 バイトのメッセージが届く場合（横軸は 1 バイトの時間を単位とする）。金の線は DMA が次に書く位置で、128 に達すると 0 に戻る。半分完了・全部完了の知らせに加えて、メッセージの後のアイドルラインでも知らせを受けると、各メッセージをすぐに処理できる（中段）。アイドルライン検出がないと、短いメッセージやメッセージの終わりの部分は、半分がたまるまで知らされない（下段）。")
F["e04_dmatime"] = _f04_dmatime()

def _f04_dmacirc():
    o = []
    N, w = 64, 8.6
    x0 = 100
    rows = [(40, 10, 40, "一続き: last = 10、pos = 64 − 24 = 40", "rx_deliver(&dma_buf[10], 30)"),
            (168, 50, 10, "一周をまたぐ: last = 50、pos = 64 − 54 = 10", "rx_deliver(&dma_buf[50], 14); rx_deliver(&dma_buf[0], 10)")]
    for y, last, pos, title, call in rows:
        o.append(T(20, y - 14, title, "start", 10.5, INK, True))
        for i in range(N):
            new = (last <= i < pos) if pos > last else (i >= last or i < pos)
            o.append(RECT(x0 + i * w, y, w, 26, 1, SSOFT if new else PAN, SIG if new else LIN, 0.8))
        for i in (0, 20, 30, 60, 63):
            o.append(T(x0 + i * w + w / 2, y + 40, str(i), "middle", 8.5, FNT, False, True))
        o.append(T(x0 - 8, y + 17, "N = 64", "end", 9.5, MUT))
        for v, nm, c in ((last, "last", PUR), (pos, "pos", GLD)):
            o.append(ARR(x0 + v * w, y + 58, x0 + v * w, y + 30, c=c, lw=1.4, head=5))
            o.append(T(x0 + v * w, y + 70, "%s = %d" % (nm, v), "middle", 9.5, c, True))
        o.append(T(20, y + 92, "処理: " + call, "start", 9.5, SIG, False, True))
    return SVG(700, 270, o, "知らせを受けたときに処理する範囲（N = 64）。DMA が次に書く位置 pos = N − 残り転送数を求め、前回処理し終えた位置 last から pos の手前までを処理する（青）。pos が last より小さければ一周をまたいでいるので、last から末尾までと、先頭から pos の手前までの 2 つに分ける。")
F["e04_dmacirc"] = _f04_dmacirc()

# ---- 7 節: 送信 ----
def _f04_txpath():
    o = []
    y, h = 46, 50
    # UART の枠
    o.append(RECT(392, 22, 296, 196, 10, "none", SIG, 1.2, dash="5 4"))
    o.append(T(678, 210, "UART", "end", 10.5, SIG, True))
    o.append(BOX(10, y, 92, h, "タスク", "uart_write", PUR, PSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(104, y + h / 2, 126, y + h / 2, c=PUR, lw=1.5, head=6))
    o.append(BOX(128, y, 112, h, "送信バッファ", "リングバッファ", SIG, SSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(242, y + h / 2, 264, y + h / 2, c=GLD, lw=1.5, head=6))
    o.append(BOX(266, y, 104, h, "送信の ISR", "uart_tx_isr", GLD, GOSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(372, y + h / 2, 404, y + h / 2, c=GLD, lw=1.5, head=6))
    o.append(BOX(406, y, 136, h, "送信データレジスタ", "1 バイト", SIG, SSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(544, y + h / 2, 562, y + h / 2, c=SIG, lw=1.5, head=6))
    o.append(BOX(564, y, 110, h, "シフトレジスタ", "1 ビットずつ線へ", SIG, SSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(662, y + h + 2, 662, y + h + 30, c=SIG, lw=1.5, head=6))
    o.append(T(656, y + h + 26, "TX の線へ", "end", 9.5, SIG, True))
    # TXE: 送信データレジスタが空 → ISR へ
    s_, w = CHIP(420, 136, "TXE", GLD, sz=10)
    o.append(s_)
    o.append(W(474, y + h, 474, 118, c=GLD, lw=1.2, dash="3 3"))
    o.append(T(420 + w + 6, 136, "送信データレジスタが空", "start", 9.5, INK))
    o.append(CARR(416, 132, 318, y + h + 2, bend=-0.25, c=GLD, lw=1.3))
    o.append(T(250, 140, "TXE の割り込み", "middle", 9.5, GLD, True))
    o.append(T(250, 154, "→ 次のバイトを書く", "middle", 9.5, GLD))
    # TC: 両方が空 → DE など
    s_, w = CHIP(420, 184, "TC", GRN, sz=10)
    o.append(s_)
    o.append(W(590, y + h, 590, 166, 452, 166, c=GRN, lw=1.2, dash="3 3"))
    o.append(T(420 + w + 6, 178, "送信データレジスタが空で、シフトレジスタも", "start", 9.5, INK))
    o.append(T(420 + w + 6, 192, "最後のストップビットまで出し終えた", "start", 9.5, INK))
    o.append(ARR(416, 180, 250, 196, c=GRN, lw=1.3))
    o.append(T(20, 194, "TC の割り込み", "start", 9.5, GRN, True))
    o.append(T(20, 208, "→ RS-485 の DE を戻す・眠る前に待つ", "start", 9.5, GRN))
    return SVG(700, 230, o, "送信の経路。タスクは送るバイトを送信バッファに入れ、送信の ISR がそれを 1 バイトずつ送信データレジスタに書く。UART は送信データレジスタの中身をシフトレジスタに移して線に出す。送信データレジスタが空くと TXE、シフトレジスタも最後のビットまで出し終えると TC が立つ。")
F["e04_txpath"] = _f04_txpath()

def _f04_txetc():
    o = []
    x0, u = 166, 21.0                   # 時刻 0 の x、1 ビット時間の幅
    X = lambda t: x0 + t * u
    rows = {}
    y = 30
    o.append(T(x0 - 10, y + 15, "TX の線", "end", 10, MUT))
    o.append(RECT(X(1), y, 10 * u, 22, 3, SSOFT, SIG, 1.1))
    o.append(T(X(6), y + 15, "最後から 2 番目のバイト", "middle", 9.5, SIG, True))
    o.append(RECT(X(11), y, 10 * u, 22, 3, SSOFT, SIG, 1.1))
    o.append(T(X(16), y + 15, "最後のバイト", "middle", 9.5, SIG, True))
    y = 66
    o.append(T(x0 - 10, y + 15, "送信データレジスタ", "end", 10, MUT))
    o.append(RECT(X(0), y, X(24) - X(0), 22, 3, SCR, LIN, 1))
    o.append(RECT(X(1.6), y, X(11) - X(1.6), 22, 3, SSOFT, SIG, 1.1))
    o.append(T(X(6.3), y + 15, "最後のバイトが待つ", "middle", 9.5, SIG))
    lv = [("TXE（空）", 104, [(0, 1.6, 1), (1.6, 11, 0), (11, 24, 1)], GLD),
          ("TC（送信完了）", 140, [(0, 1, 1), (1, 21, 0), (21, 24, 1)], GRN),
          ("DE（TC で戻す）", 186, [(0, 0.5, 0), (0.5, 21, 1), (21, 24, 0)], GRN),
          ("DE（TXE で戻す）", 222, [(0, 0.5, 0), (0.5, 11, 1), (11, 24, 0)], ALI)]
    for nm, yy, segs, c in lv:
        o.append(T(x0 - 10, yy + 13, nm, "end", 10, c, True))
        o.append(_f04_lv(x0, u, yy, 18, segs, c=c, lw=2))
    o.append(W(X(11), 22, X(11), 262, c=GLD, lw=1, dash="3 3"))
    o.append(W(X(21), 22, X(21), 262, c=GRN, lw=1, dash="3 3"))
    o.append(T(X(11) + 4, 130, "最後のバイトがシフトレジスタへ", "start", 9.5, GLD))
    o.append(T(X(21) + 4, 166, "出し終えた", "start", 9.5, GRN))
    o.append(T(X(11) + 6, 256, "ここで DE を戻すと、最後のバイトは線に出ない", "start", 9.5, ALI, True))
    o.append(DIM(X(11), 270, X(21), 270, None, c=TEA))
    o.append(T(X(16), 286, "1 文字分（115200 bps・8N1 で 86.8 µs）", "middle", 9.5, TEA))
    return SVG(700, 298, o, "最後の 2 バイトを送るときの、送信データレジスタ空（TXE）と送信完了（TC）の時刻。TXE は最後のバイトがシフトレジスタに移ったときに立ち、TC はそのバイトのストップビットが線から出終わったときに立つ。2 つは 1 文字分離れているので、RS-485 の DE は TC で戻す（02 章 5 節）。")
F["e04_txetc"] = _f04_txetc()
