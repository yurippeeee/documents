# -*- coding: utf-8 -*-
# 13 章 モータを回す の図

# ---- 例のモータ（例の値）: 巻線の抵抗・インダクタンス・k・慣性モーメント・負荷のトルク・電源の電圧 ----
_F13_R, _F13_L, _F13_K, _F13_J, _F13_TL, _F13_V = 2.0, 1e-3, 0.02, 1e-5, 0.01, 12.0

# ---- 補助: 記号・回路の部品 ----
def _f13_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]（09 章の図と同じ書き方。
    添字の後の文字は dy で元の高さに戻す）。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82 - 2, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    pend = 0
    for s, sub, it in parts:
        o.append('<tspan font-style="%s"%s>%s</tspan>' % ("italic" if it else "normal", (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g" font-style="normal">%s</tspan>' % (sz * 0.72, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)

def _f13_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f13_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f13_coilh(x1, x2, y, c=INK, lw=1.5, n=4):
    """横向きのコイル（上へふくらむ山の並び）。"""
    w = (x2 - x1) / n
    d = "M%g,%g" % (x1, y)
    for i in range(n):
        d += " a%g,%g 0 0 1 %g,0" % (w / 2, w / 2 * 1.1, w)
    return PATH(d, c=c, lw=lw)

def _f13_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return (W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6)
            + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2))

def _f13_swv(x, y1, y2, closed, c=INK, lw=1.5):
    """縦向きのスイッチ（y1 から y2 へ）。closed で入っている。"""
    ya, yb = y1 + (y2 - y1) * 0.28, y1 + (y2 - y1) * 0.72
    o = W(x, y1, x, ya, c=c, lw=lw) + W(x, yb, x, y2, c=c, lw=lw) + D(x, ya, c, 2.2) + D(x, yb, c, 2.2)
    o += W(x, ya, x + (0 if closed else 9), yb - (0 if closed else 1), c=c, lw=lw + 0.3)
    return o

def _f13_motor(x, y, r=13, c=PUR, label="M"):
    return CIRC(x, y, r, c=c, lw=1.6, fill=soft(c)) + T(x, y + 4, label, "middle", 11, c, True)

# ---- 例のモータの数値計算（細かい時間刻みで 2 つの式を解く。本文の値の元） ----
def _f13_tl(w, tm, tl):
    """摩擦のような負荷: 回っていれば tl、止まっていればモータのトルクを打ち消す（tl まで）。"""
    if w > 1e-9:
        return tl
    return min(tl, max(-tl, tm))

def _f13_run(tend, dt, ramp=0.0, Rin=0.0, keep=500):
    """12 V を加える（ramp > 0 なら平均の電圧を ramp 秒で 0 から上げる）。
    返り値: (点の列 [(t, I, w, 電源の端子電圧)], 電流の最大, 電圧の最小)"""
    R, L, k, J, TL, V = _F13_R, _F13_L, _F13_K, _F13_J, _F13_TL, _F13_V
    I = w = 0.0
    n = int(round(tend / dt))
    ev = max(1, n // keep)
    out, ipk, vmin = [], 0.0, V
    for i in range(n + 1):
        t = i * dt
        Dd = min(1.0, t / ramp) if ramp > 0 else 1.0
        Vs = V - Rin * Dd * I                     # 電源の電流は平均で D I
        if i % ev == 0:
            out.append((t, I, w, Vs))
        ipk = max(ipk, I); vmin = min(vmin, Vs)
        I += (Dd * Vs - R * I - k * w) / L * dt
        if I < 0:
            I = 0.0
        tm = k * I
        w += (tm - _f13_tl(w, tm, TL)) / J * dt
        if w < 0:
            w = 0.0
    return out, ipk, vmin

def _f13_panel(o, p, title, yl, yt, yfmt, xt=None, xfmt=None, xl=None):
    """縦に並べるグラフの 1 枚（x の目盛の文字は xl を渡したものだけに書く）。"""
    if title:
        o.append(T(p.x, p.y - 7, title, "start", 10.5, INK, True))
    for v in yt:
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
        o.append(T(p.x - 6, p.Y(v) + 3.5, yfmt(v), "end", 9.5, MUT))
    for v in (xt or []):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        if xl:
            o.append(T(p.X(v), p.y + p.h + 14, xfmt(v), "middle", 9.5, MUT))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    o.append(T(p.x - 40, p.y + p.h / 2, yl, "middle", 9.5, MUT, rot=-90))
    if xl:
        o.append(T(p.x + p.w / 2, p.y + p.h + 30, xl, "middle", 10, MUT))

# ================= 1 節 =================
def _f13_model():
    o = []
    # ---- 左: 巻線の等価回路 ----
    xl, xr, yt, yb = 86, 340, 62, 196
    o.append(T(213, 24, "電気の側（巻線）", "middle", 11.5, INK, True))
    # 加える電圧（左の縦）
    o.append(W(xl, yt, xl, 108, c=INK, lw=1.5) + W(xl, 150, xl, yb, c=INK, lw=1.5))
    o.append(CIRC(xl, 129, 21, c=GLD, lw=1.6, fill=GOSOFT))
    o.append(T(xl, 125, "+", "middle", 12, GLD, True) + T(xl, 145, "−", "middle", 12, GLD, True))
    o.append(_f13_m(xl - 28, 133, [("V", None, True)], "end", 13, GLD, True))
    o.append(T(xl - 26, 160, "加える電圧", "end", 9.5, GLD))
    # 上の線: R と L
    o.append(W(xl, yt, 120, yt, c=INK, lw=1.5) + _f13_resh(120, 176, yt) + W(176, yt, 198, yt, c=INK, lw=1.5)
             + _f13_coilh(198, 260, yt) + W(260, yt, xr, yt, c=INK, lw=1.5))
    o.append(_f13_m(148, yt - 12, [("R", None, True)], "middle", 12, INK))
    o.append(T(148, yt + 22, "巻線の抵抗", "middle", 9.5, MUT))
    o.append(_f13_m(229, yt - 18, [("L", None, True)], "middle", 12, INK))
    o.append(T(229, yt + 22, "インダクタンス", "middle", 9.5, MUT))
    o.append(ARR(94, yt - 9, 116, yt - 9, c=SIG, lw=1.6, head=6))
    o.append(_f13_m(105, yt - 15, [("I", None, True)], "middle", 12, SIG, True))
    # 右の縦: 逆起電力の電圧源
    o.append(W(xr, yt, xr, 108, c=INK, lw=1.5) + W(xr, 150, xr, yb, c=INK, lw=1.5))
    o.append(CIRC(xr, 129, 21, c=PUR, lw=1.6, fill=PSOFT))
    o.append(T(xr, 125, "+", "middle", 12, PUR, True) + T(xr, 145, "−", "middle", 12, PUR, True))
    o.append(_f13_m(xr - 28, 126, [("kω", None, True)], "end", 12.5, PUR, True))
    o.append(T(xr - 28, 141, "逆起電力", "end", 9.5, PUR))
    o.append(W(xl, yb, xr, yb, c=INK, lw=1.5))
    o.append(T(213, yb + 26, "V = R I + L dI/dt + kω", "middle", 11.5, INK))
    # ---- 右: 回る側 ----
    cx, cy, r = 520, 130, 50
    o.append(T(560, 24, "回る側（軸と負荷）", "middle", 11.5, INK, True))
    o.append(CIRC(cx, cy, r, c=PUR, lw=1.6, fill=PSOFT))
    o.append(CIRC(cx, cy, 5, c=PUR, lw=1.4, fill=PUR))
    o.append(_f13_m(cx, cy + 24, [("J", None, True)], "middle", 12, PUR, True))
    o.append(T(cx, cy + 37, "慣性モーメント", "middle", 9, PUR))
    o.append(CARR(cx - 48, cy - 34, cx + 30, cy - 62, bend=0.28, c=SIG, lw=1.8, head=7))
    o.append(_f13_m(cx - 70, cy - 52, [("kI", None, True)], "end", 12, SIG, True))
    o.append(T(cx - 70, cy - 37, "モータのトルク", "end", 9.5, SIG))
    o.append(CARR(cx + 46, cy + 36, cx - 28, cy + 60, bend=0.28, c=ALI, lw=1.8, head=7))
    o.append(_f13_m(cx + 66, cy + 52, [("T", "L", True)], "start", 12, ALI, True))
    o.append(T(cx + 66, cy + 67, "負荷のトルク", "start", 9.5, ALI))
    o.append(_f13_m(cx + 60, cy - 30, [("ω", None, True)], "start", 13, INK, True))
    o.append(T(cx + 60, cy - 15, "角速度", "start", 9.5, MUT))
    o.append(_f13_m(560, yb + 26, [("J dω/dt = kI − T", "L", False)], "middle", 11.5, INK))
    # ---- 2 つをつなぐもの ----
    o.append(DARR(xr + 30, 129, cx - r - 8, 129, c=MUT, lw=1.3))
    o.append(T((xr + cx - r) / 2 + 11, 117, "k でつながる", "middle", 9.5, MUT))
    o.append(T(350, yb + 52, "電力の釣り合い: 逆起電力が受け取る kω × I = 軸が渡す kI × ω（トルク定数 = 逆起電力定数 = k）", "middle", 10, MUT))
    return SVG(700, yb + 62, o, "DC モータの模型。巻線は、抵抗 R とインダクタンス L に、角速度に比例する逆起電力 kω の電圧源をつないだものとして表せる。回る側では、電流に比例するモータのトルク kI から負荷のトルクを引いた分が、角速度を変える。")
F["e13_model"] = _f13_model()

def _f13_startfig():
    o = []
    R, k, TL, V = _F13_R, _F13_K, _F13_TL, _F13_V
    taum = _F13_J * R / k ** 2
    wf = (V - R * TL / k) / k
    a, ipk, _ = _f13_run(0.3, 5e-6)
    c, ipk2, vmin2 = _f13_run(0.3, 5e-6, Rin=1.0)
    ms = lambda t: t * 1e3
    xt = [0, 50, 100, 150, 200, 250, 300]
    pa = Plot(80, 34, 560, 92, (0, 300), (0, 7))
    pb = Plot(80, 160, 560, 92, (0, 300), (0, 600))
    pc = Plot(80, 286, 560, 92, (0, 300), (6, 12.5))
    _f13_panel(o, pa, "(a) 電流（12 V を一気に加える）", "電流 [A]", [0, 2, 4, 6], lambda v: "%g" % v, xt)
    _f13_panel(o, pb, "(b) 角速度", "角速度 [rad/s]", [0, 200, 400, 600], lambda v: "%g" % v, xt)
    _f13_panel(o, pc, "(c) 電源の端子電圧（内部抵抗 1 Ω の電源のとき）", "電圧 [V]", [6, 8, 10, 12], lambda v: "%g" % v, xt, lambda v: "%g" % v, "時間 [ms]")
    # (a)
    o.append(pa.line([(0, V / R), (300, V / R)], c=ALI, lw=1.1, dash="5 3"))
    o.append(T(pa.X(300) - 4, pa.Y(V / R) - 4, "拘束電流 V/R = 6 A", "end", 9.5, ALI))
    o.append(pa.line([(ms(t), TL / k + (V / R - TL / k) * math.exp(-t / taum)) for t in [i * 0.002 for i in range(151)]], c=MUT, lw=1.3, dash="4 3"))
    o.append(pa.line([(ms(t), I) for t, I, w, _ in a], c=SIG, lw=2))
    o.append(T(pa.X(10), pa.Y(5.8) + 4, "最大 %.1f A（2.4 ms）" % ipk, "start", 9.5, SIG, True, halo=True))
    o.append(T(pa.X(205), pa.Y(0.5) - 6, "回っている間 0.5 A", "start", 9.5, SIG, halo=True))
    # (b)
    o.append(pb.line([(0, wf), (300, wf)], c=FNT, lw=1, dash="3 3"))
    o.append(pb.line([(ms(t), wf * (1 - math.exp(-t / taum))) for t in [i * 0.002 for i in range(151)]], c=MUT, lw=1.3, dash="4 3"))
    o.append(pb.line([(ms(t), w) for t, I, w, _ in a], c=PUR, lw=2))
    o.append(D(pb.X(50), pb.Y(wf * (1 - math.exp(-1))), PUR, 3.6))
    o.append(_f13_m(pb.X(56), pb.Y(wf * (1 - math.exp(-1))) + 14, [("τ", "m", False), (" = 50 ms で 63 %", None, False)], "start", 9.5, PUR, True))
    o.append(T(pb.X(300) - 4, pb.Y(wf) + 14, "550 rad/s", "end", 9.5, PUR, halo=True))
    # (c)
    o.append(pc.line([(ms(t), vs) for t, I, w, vs in c], c=GLD, lw=2))
    o.append(T(pc.X(14), pc.Y(vmin2) + 4, "最低 %.1f V（電流の最大 %.1f A）" % (vmin2, ipk2), "start", 9.5, GLD, True, halo=True))
    o.append(LEGEND(80, 420, [(SIG, "電流（数値で解いた値）"), (PUR, "角速度（同）"), (MUT, "破線: L を省いた式")]))
    return SVG(700, 430, o, "例のモータに 12 V を一気に加えたとき（例の値。L も含めた 2 つの式を数値で解いた値と、L を省いた式）。電流は 2.4 ms で拘束電流の近くまで上がり、速さが上がるにつれて逆起電力に押し戻されて、回っている間の値に下がる。内部抵抗のある電源では、その間に端子電圧が下がる。")
F["e13_start"] = _f13_startfig()

# ================= 2 節 =================
def _f13_hb(o, x0, y0, title, sub, on, path=None, pc=SIG, tc=INK, note=None):
    """H ブリッジ 1 つ。on = (左上, 左下, 右上, 右下) の入り切り。path は電流の道の点の列（強調して描く）。"""
    xl, xr, xm = x0 + 26, x0 + 110, x0 + 68
    yt, yb, ym = y0 + 22, y0 + 150, y0 + 86
    o.append(T(xm, y0 + 4, title, "middle", 10.5, tc, True))
    if path:
        o.append(PL(path, c=soft(pc), lw=7))
    o.append(W(xl - 8, yt, xr + 8, yt, c=GLD, lw=1.8))
    o.append(T(xr + 12, yt + 4, "V", "start", 9.5, GLD, True))
    o.append(W(xl - 8, yb, xr + 8, yb, c=MUT, lw=1.8))
    o.append(T(xr + 12, yb + 4, "0 V", "start", 9, MUT))
    ul, ll, ur, lr = on
    o.append(_f13_swv(xl, yt, ym - 6, ul, c=INK) + W(xl, ym - 6, xl, ym, c=INK, lw=1.5))
    o.append(W(xl, ym, xl, ym + 6, c=INK, lw=1.5) + _f13_swv(xl, ym + 6, yb, ll, c=INK))
    o.append(_f13_swv(xr, yt, ym - 6, ur, c=INK) + W(xr, ym - 6, xr, ym, c=INK, lw=1.5))
    o.append(W(xr, ym, xr, ym + 6, c=INK, lw=1.5) + _f13_swv(xr, ym + 6, yb, lr, c=INK))
    o.append(W(xl, ym, xm - 13, ym, c=INK, lw=1.5) + W(xm + 13, ym, xr, ym, c=INK, lw=1.5))
    o.append(D(xl, ym, INK, 2.4) + D(xr, ym, INK, 2.4))
    o.append(_f13_motor(xm, ym))
    if note:
        for (ax, ay, bx, by) in note:
            o.append(ARR(ax, ay, bx, by, c=pc, lw=1.8, head=7))
    for i, l in enumerate(sub):
        o.append(T(xm, y0 + 172 + i * 14, l, "middle", 9.5, tc if i == 0 else MUT))

def _f13_hbridge():
    o = []
    w = 138
    def P(k):
        x0 = 6 + k * w
        return x0, x0 + 26, x0 + 110, x0 + 68
    y0 = 8
    yt, yb, ym = y0 + 22, y0 + 150, y0 + 86
    # (a) 正転: 左上 → 巻線（左から右）→ 右下
    x0, xl, xr, xm = P(0)
    _f13_hb(o, x0, y0, "(a) 正転", ["左上と右下を入れる", "電流は左から右へ"], (1, 0, 0, 1),
            [(xl, yt), (xl, ym), (xr, ym), (xr, yb)], SIG, note=[(xm - 10, ym - 22, xm + 12, ym - 22)])
    x0, xl, xr, xm = P(1)
    _f13_hb(o, x0, y0, "(b) 逆転", ["右上と左下を入れる", "電流は右から左へ"], (0, 1, 1, 0),
            [(xr, yt), (xr, ym), (xl, ym), (xl, yb)], SIG, note=[(xm + 10, ym - 22, xm - 12, ym - 22)])
    x0, xl, xr, xm = P(2)
    _f13_hb(o, x0, y0, "(c) 下の 2 つ", ["巻線の両端がつながる", "（3 節の短絡ブレーキ）"], (0, 1, 0, 1),
            [(xm, ym), (xl, ym), (xl, yb), (xr, yb), (xr, ym), (xm, ym)], PUR, note=[(xm + 10, ym - 22, xm - 12, ym - 22)])
    x0, xl, xr, xm = P(3)
    _f13_hb(o, x0, y0, "(d) 4 つとも切る", ["巻線に電圧を加えない", "（3 節の惰性停止）"], (0, 0, 0, 0))
    x0, xl, xr, xm = P(4)
    _f13_hb(o, x0, y0, "(e) 同じ側の上下", ["電源から 0 V へ短絡", "決してしない"], (1, 1, 0, 0),
            [(xl, yt), (xl, yb)], ALI, tc=ALI, note=[(xl - 12, ym - 30, xl - 12, ym + 30)])
    return SVG(700, y0 + 200, o, "H ブリッジ（スイッチは記号で描いた。実際は MOSFET。回路は組み込み回路シリーズ 22 章）。入れる 2 つの組で、巻線に加える電圧の向きが決まる。塗った線は電流の道。(c) では、回っている巻線の逆起電力が電流を流す。")
F["e13_hbridge"] = _f13_hbridge()

# ---- PWM の 1 周期（速さは一定とみなす）の閉じた式。速さは二分法で求める ----
def _f13_cycle(V, R, L, k, D, f, w, diode):
    tau, T_ = L / R, 1.0 / f
    t1, t2 = D * T_, (1 - D) * T_
    Ion, Ioff = (V - k * w) / R, -k * w / R
    x1, x2 = math.exp(-t1 / tau), math.exp(-t2 / tau)
    Ia = (Ioff * (1 - x2) + Ion * (1 - x1) * x2) / (1 - x1 * x2)
    tz = None
    if diode and Ia < 0:              # 電流が 0 で止まる（不連続）: 各周期 0 から始まる
        Ia = 0.0
        Ib = max(0.0, Ion * (1 - x1))
        tz = t2 if Ioff >= 0 else min(t2, tau * math.log((Ib - Ioff) / (-Ioff)))
    else:
        Ib = Ion + (Ia - Ion) * x1
    q = Ion * t1 + (Ia - Ion) * tau * (1 - x1)
    if tz is None:
        q += Ioff * t2 + (Ib - Ioff) * tau * (1 - x2)
    else:
        q += Ioff * tz + (Ib - Ioff) * tau * (1 - math.exp(-tz / tau))
    return dict(Ia=Ia, Ib=Ib, tz=tz, Iavg=q / T_, t1=t1, t2=t2, tau=tau, Ion=Ion, Ioff=Ioff)

def _f13_ss(D, f, diode, V=_F13_V, R=_F13_R, L=_F13_L, k=_F13_K, TL=_F13_TL):
    c0 = _f13_cycle(V, R, L, k, D, f, 0.0, diode)
    if k * c0["Iavg"] <= TL:
        return 0.0, c0
    lo, hi = 0.0, V / k
    for _ in range(60):
        mid = (lo + hi) / 2
        if k * _f13_cycle(V, R, L, k, D, f, mid, diode)["Iavg"] > TL:
            lo = mid
        else:
            hi = mid
    w = (lo + hi) / 2
    return w, _f13_cycle(V, R, L, k, D, f, w, diode)

def _f13_wave(c, n=4, m=120):
    out = []
    T_ = c["t1"] + c["t2"]
    for p in range(n):
        for i in range(m + 1):
            t = i / m * T_
            if t <= c["t1"]:
                I = c["Ion"] + (c["Ia"] - c["Ion"]) * math.exp(-t / c["tau"])
            else:
                u = t - c["t1"]
                I = 0.0 if (c["tz"] is not None and u >= c["tz"]) else c["Ioff"] + (c["Ib"] - c["Ioff"]) * math.exp(-u / c["tau"])
            out.append((p * T_ + t, I))
    return out

def _f13_onoff(o, p, f, D, n, sc, y, h=12, c=GLD):
    """ON・OFF の帯（ON を塗る）。sc は秒 → 軸の単位。"""
    T_ = 1.0 / f
    for q in range(n):
        o.append(RECT(p.X(q * T_ * sc), y, p.X(D * T_ * sc) - p.X(0), h, 1, soft(c), c, 0.8))
    o.append(T(p.x - 6, y + h - 2, "ON", "end", 9, c, True))

def _f13_ripple():
    o = []
    D = 0.5
    wa, ca = _f13_ss(D, 20e3, True)
    wb, cb = _f13_ss(D, 2e3, True)
    ws, cs = _f13_ss(D, 2e3, False)
    pa = Plot(80, 56, 560, 100, (0, 200), (0.35, 0.72))
    pb = Plot(80, 250, 560, 130, (0, 2.0), (-0.45, 1.65))
    o.append(T(14, 18, "(a) 20 kHz（デューティ比 0.5）", "start", 10.5, INK, True))
    _f13_panel(o, pa, "", "電流 [A]", [0.4, 0.5, 0.6, 0.7], lambda v: "%g" % v, [0, 50, 100, 150, 200], lambda v: "%g" % v, "時間 [µs]")
    _f13_onoff(o, pa, 20e3, D, 4, 1e6, 30)
    o.append(pa.line([(t * 1e6, I) for t, I in _f13_wave(ca)], c=SIG, lw=2))
    o.append(pa.line([(0, 0.5), (200, 0.5)], c=MUT, lw=1, dash="4 3"))
    xx = pa.X(125)
    o.append(DIM(xx, pa.Y(ca["Ib"]), xx, pa.Y(ca["Ia"]), None, c=ALI))
    o.append(T(pa.X(127), pa.Y(0.66), "ΔI = %.3f A（式 V D (1 − D)/(L f) = %.3f A）" % (ca["Ib"] - ca["Ia"], 12 * D * (1 - D) / (1e-3 * 20e3)), "start", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(2), pa.Y(0.66), "破線: 平均 0.5 A", "start", 9, MUT, halo=True))
    o.append(T(14, 212, "(b) 2 kHz（デューティ比 0.5）", "start", 10.5, INK, True))
    _f13_panel(o, pb, "", "電流 [A]", [-0.4, 0, 0.4, 0.8, 1.2, 1.6], lambda v: "%g" % v, [0, 0.5, 1.0, 1.5, 2.0], lambda v: "%g" % v, "時間 [ms]")
    _f13_onoff(o, pb, 2e3, D, 4, 1e3, 224)
    o.append(pb.line([(0, 0), (2.0, 0)], c=FNT, lw=1))
    o.append(pb.line([(t * 1e3, I) for t, I in _f13_wave(cs)], c=PUR, lw=1.6, dash="5 3"))
    o.append(pb.line([(t * 1e3, I) for t, I in _f13_wave(cb)], c=SIG, lw=2))
    o.append(T(pb.X(0.02), pb.Y(1.48), "実線: ダイオードで流す。電流は 0 で止まり、速さ %.0f rad/s" % wb, "start", 9.5, SIG, True, halo=True))
    o.append(T(pb.X(0.02), pb.Y(1.48) + 14, "破線: 下の 2 つで流す。負まで流れ、速さ %.0f rad/s" % ws, "start", 9.5, PUR, True, halo=True))
    return SVG(700, 424, o, "PWM の電流の波（例のモータ、12 V、デューティ比 0.5、速さが落ち着いた後。閉じた式で計算した値）。(a) 20 kHz では、電流は平均の上下に 0.15 A だけ揺れる。(b) 2 kHz では揺れが平均より大きく、ダイオードで流すと電流が 0 で途切れ、速さがデューティ比から求めた 250 rad/s からずれる。")
F["e13_ripple"] = _f13_ripple()

def _f13_dI(f, D=0.5, V=_F13_V, R=_F13_R, L=_F13_L):
    """リップルの厳密な値（下の 2 つで流す場合。逆起電力によらない）。"""
    tau, T_ = L / R, 1.0 / f
    x1, x2 = math.exp(-D * T_ / tau), math.exp(-(1 - D) * T_ / tau)
    return V / R * (1 - x1) * (1 - x2) / (1 - x1 * x2)

def _f13_loss(f):
    """リップルの損失 R ΔI²/12 と、スイッチの損失 1/2 V I (tr + tf) f（tr + tf = 1 µs、I = 0.5 A。例の値）[W]。"""
    dI = _f13_dI(f)
    return _F13_R * dI * dI / 12.0, 0.5 * _F13_V * 0.5 * 1e-6 * f

def _f13_freq():
    o = []
    fs = [10 ** (2 + i * 3 / 120.0) for i in range(121)]
    pa = Plot(78, 40, 250, 200, (100, 1e5), (0.01, 10), xlog=True, ylog=True)
    pb = Plot(430, 40, 250, 200, (100, 1e5), (0.001, 10), xlog=True, ylog=True)
    xf = lambda v: {100: "100 Hz", 1e3: "1 kHz", 1e4: "10 kHz", 1e5: "100 kHz"}[v]
    for p in (pa, pb):
        o.append(RECT(p.X(100), p.y, p.X(2e4) - p.X(100), p.h, 0, MSOFT, "none", 0))
    o.append(pa.axes(xl="PWM の周波数", yl="リップル ΔI [A]", xt=[100, 1e3, 1e4, 1e5], yt=[0.01, 0.1, 1, 10], xfmt=xf, yfmt=lambda v: "%g" % v))
    o.append(pb.axes(xl="PWM の周波数", yl="損失 [W]", xt=[100, 1e3, 1e4, 1e5], yt=[0.001, 0.01, 0.1, 1, 10], xfmt=xf, yfmt=lambda v: "%g" % v))
    o.append(T(pa.x, 26, "(a) 電流のリップル（デューティ比 0.5）", "start", 10.5, INK, True))
    o.append(T(pb.x, 26, "(b) 損失の目安", "start", 10.5, INK, True))
    o.append(pa.line([(f, min(10, 12 / (4 * 1e-3 * f))) for f in fs if 12 / (4 * 1e-3 * f) <= 10], c=MUT, lw=1.3, dash="4 3"))
    o.append(pa.line([(f, _f13_dI(f)) for f in fs], c=SIG, lw=2.2))
    o.append(D(pa.X(2e4), pa.Y(_f13_dI(2e4)), SIG, 3.6))
    o.append(T(pa.X(2e4) + 6, pa.Y(_f13_dI(2e4)) - 6, "20 kHz: 0.15 A", "start", 9.5, SIG, True, halo=True))
    o.append(T(pa.X(130), pa.Y(0.02), "破線: 式 V/(4Lf)", "start", 9, MUT, halo=True))
    o.append(T(pa.X(115), pa.Y(0.9), "6 A（V/R）で頭打ち", "start", 9, SIG, halo=True))
    pr = [(f, _f13_loss(f)[0]) for f in fs]
    ps = [(f, _f13_loss(f)[1]) for f in fs]
    pt = [(f, a + b) for (f, a), (_, b) in zip(pr, ps)]
    o.append(pb.line([q for q in pr if 0.001 <= q[1] <= 10], c=SIG, lw=1.6))
    o.append(pb.line([q for q in ps if 0.001 <= q[1] <= 10], c=GLD, lw=1.6))
    o.append(pb.line([q for q in pt if 0.001 <= q[1] <= 10], c=ALI, lw=2.2))
    fmin = min(pt, key=lambda q: q[1])
    o.append(D(pb.X(fmin[0]), pb.Y(fmin[1]), ALI, 3.6))
    o.append(T(pb.X(fmin[0]), pb.Y(fmin[1]) - 10, "和の最小 %.0f mW" % (fmin[1] * 1e3), "middle", 9, ALI, True, halo=True))
    o.append(T(pb.X(130), pb.Y(0.25), "リップル R ΔI²/12", "start", 9, SIG, True, halo=True))
    o.append(T(pb.X(3e4), pb.Y(0.025), "スイッチ", "middle", 9, GLD, True, halo=True))
    for p in (pa, pb):
        o.append(T(p.X(1e3), p.y + 14, "耳に聞こえる（20 kHz 程度まで）", "start", 9, MUT, halo=True))
    return SVG(700, 290, o, "PWM の周波数とリップル・損失（例のモータ、12 V、0.5 A。スイッチの入れ切りに合わせて 1 µs かかるとした例の値。網の部分は人の耳に聞こえる周波数）。周波数を下げると、リップルによる巻線の熱と音が増え、上げると、スイッチの損失が増える。")
F["e13_freq"] = _f13_freq()

# ================= 3 節 =================
def _f13_softfig():
    o = []
    cases = [(0.0, ALI, "一気に"), (0.2, SIG, "0.2 s で上げる"), (0.5, GRN, "0.5 s で上げる")]
    pa = Plot(80, 52, 560, 88, (0, 600), (0, 7))
    pb = Plot(80, 176, 560, 88, (0, 600), (0, 600))
    pc = Plot(80, 300, 560, 88, (0, 600), (7, 12.5))
    xt = [0, 100, 200, 300, 400, 500, 600]
    _f13_panel(o, pa, "(a) 電流（内部抵抗の無い 12 V の電源）", "電流 [A]", [0, 2, 4, 6], lambda v: "%g" % v, xt)
    _f13_panel(o, pb, "(b) 角速度", "角速度 [rad/s]", [0, 200, 400, 600], lambda v: "%g" % v, xt)
    _f13_panel(o, pc, "(c) 電源の端子電圧（内部抵抗 1 Ω の電源のとき）", "電圧 [V]", [8, 10, 12], lambda v: "%g" % v, xt, lambda v: "%g" % v, "時間 [ms]")
    lx = 80
    for i, (ramp, c, lab) in enumerate(cases):
        a, ipk, _ = _f13_run(0.6, 1e-5, ramp=ramp)
        b, _, vmin = _f13_run(0.6, 1e-5, ramp=ramp, Rin=1.0)
        o.append(pa.line([(t * 1e3, I) for t, I, w, _ in a], c=c, lw=1.8))
        o.append(pb.line([(t * 1e3, w) for t, I, w, _ in a], c=c, lw=1.8))
        o.append(pc.line([(t * 1e3, v) for t, I, w, v in b], c=c, lw=1.8))
        o.append(T(pa.X(560) - 4, pa.Y(6.3) + i * 13, "%s: 最大 %.2f A" % (lab, ipk), "end", 9.5, c, True, halo=True))
        o.append(T(pc.X(560) - 4, pc.Y(9.6) + i * 13, "%s: 最低 %.2f V" % (lab, vmin), "end", 9.5, c, True, halo=True))
    o.append(_f13_m(pa.X(205), pa.Y(1.88) - 6, [("式 (Jα + T", "L", False), (")/k = 1.88 A", None, False)], "start", 9, SIG))
    return SVG(700, 430, o, "回し始めに加える平均の電圧を、一気に 12 V にした場合と、0.2 s・0.5 s で 0 から上げた場合（例のモータ。数値で解いた値）。ゆっくり上げるほど、電流の最大と電源の電圧の落ち込みは小さく、目標の速さに届くのは遅い。")
F["e13_soft"] = _f13_softfig()

def _f13_stopsim(method, tdec=0.1, C=470e-6, Iother=0.1, sink=False, vlim=None, tend=0.7, dt=1e-5, keep=400):
    """止め方のシミュレーション（H ブリッジを平均の電圧で表す）。電源は 12 V を下回るときだけ電流を出す（吸い込めない）。
    method: "coast"・"short"・"regen"（平均の電圧を tdec で 1 → 0 に下げる）。vlim を超えたら短絡ブレーキへ。"""
    R, L, k, J, TL, V0 = _F13_R, _F13_L, _F13_K, _F13_J, _F13_TL, _F13_V
    w = (V0 - R * TL / k) / k; I = TL / k; Vb = V0
    mode = method; t = 0.0; out = []; tstop = None; vmax = Vb; imin = 0.0
    ER = Eload = Eret = 0.0
    n = int(round(tend / dt)); ev = max(1, n // keep)
    for i in range(n + 1):
        if i % ev == 0:
            out.append((t, w, I, Vb))
        if mode == "coast":
            vm = -Vb if I > 1e-12 else None          # 電流が残る間はダイオードを通って電源へ
        elif mode == "short":
            vm = 0.0
        else:
            vm = max(0.0, 1.0 - t / tdec) * Vb
            if vlim is not None and Vb > vlim:
                mode = "short"; vm = 0.0
        if vm is None:
            I = 0.0; ib = 0.0
        else:
            I += (vm - R * I - k * w) / L * dt
            if mode == "coast" and I < 0:
                I = 0.0
            ib = vm * I / Vb                           # ブリッジが電源の線から取る電流
        tm = k * I; tl = _f13_tl(w, tm, TL)
        w += (tm - tl) / J * dt
        if w < 0:
            w = 0.0
        if sink:
            Vb = V0
        else:
            Vb += (max(0.0, (V0 - Vb) / 0.05) - Iother - ib) / C * dt
        ER += R * I * I * dt; Eload += tl * w * dt
        if vm is not None and vm * I < 0:
            Eret += -vm * I * dt
        vmax = max(vmax, Vb); imin = min(imin, I)
        if tstop is None and w <= 0.0:
            tstop = t
        t += dt
    return dict(out=out, tstop=tstop, vmax=vmax, imin=imin, ER=ER, Eload=Eload, Eret=Eret)

def _f13_stopfig():
    o = []
    cases = [("coast", SIG, "惰性停止"), ("short", PUR, "短絡ブレーキ"), ("regen", ALI, "回生しながら 0.1 s で減速")]
    pa = Plot(80, 52, 560, 88, (0, 700), (0, 600))
    pb = Plot(80, 176, 560, 88, (0, 700), (-6, 1))
    pc = Plot(80, 300, 560, 88, (0, 700), (10, 34))
    xt = [0, 100, 200, 300, 400, 500, 600, 700]
    _f13_panel(o, pa, "(a) 角速度", "角速度 [rad/s]", [0, 200, 400, 600], lambda v: "%g" % v, xt)
    _f13_panel(o, pb, "(b) モータの電流（負は逆向き）", "電流 [A]", [-6, -4, -2, 0], lambda v: "%g" % v, xt)
    _f13_panel(o, pc, "(c) 電源の線の電圧（470 µF、電源は電流を吸い込めない）", "電圧 [V]", [12, 20, 30], lambda v: "%g" % v, xt, lambda v: "%g" % v, "止め始めてからの時間 [ms]")
    for i, (m, c, lab) in enumerate(cases):
        r = _f13_stopsim(m)
        o.append(pa.line([(t * 1e3, w) for t, w, I, v in r["out"]], c=c, lw=1.8))
        o.append(pb.line([(t * 1e3, I) for t, w, I, v in r["out"]], c=c, lw=1.8))
        o.append(pc.line([(t * 1e3, v) for t, w, I, v in r["out"]], c=c, lw=1.8))
        o.append(T(pa.X(690), pa.Y(560) + i * 13, "%s: %.2f s で止まる" % (lab, r["tstop"]), "end", 9.5, c, True, halo=True))
        if m != "coast":
            o.append(T(pb.X(690), pb.Y(-3.6) + (i - 1) * 13, "%s: 最も負で %.1f A" % (lab, r["imin"]), "end", 9.5, c, True, halo=True))
    rr = _f13_stopsim("regen")
    o.append(T(pc.X(250), pc.Y(rr["vmax"]) + 4, "最大 %.0f V" % rr["vmax"], "start", 9.5, ALI, True, halo=True))
    o.append(T(pc.X(690), pc.Y(12) - 6, "惰性停止・短絡ブレーキでは 12 V のまま", "end", 9.5, MUT, halo=True))
    return SVG(700, 430, o, "550 rad/s で回っている例のモータの 3 つの止め方（例の値。ほかの回路が電源の線から 0.1 A を使う。数値で解いた値）。短絡ブレーキは速く止まるが、拘束電流に近い電流が流れる。回生しながら減速すると、戻った電力で電源の線のコンデンサの電圧が上がる。")
F["e13_stop"] = _f13_stopfig()

def _f13_energy():
    o = []
    R, k = _F13_R, _F13_K
    kw = k * 550.0
    pa = Plot(70, 44, 250, 190, (0, 6), (0, 16))
    o.append(pa.axes(xl="逆向きの電流 |I| [A]", yl="電源へ戻る電力 [W]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 5, 10, 15], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(pa.x, 26, "(a) 戻る電力 P = kω|I| − RI²（550 rad/s）", "start", 10.5, INK, True))
    o.append(pa.line([(x / 50.0, kw * x / 50.0 - R * (x / 50.0) ** 2) for x in range(0, int(kw / R * 50) + 1)], c=ALI, lw=2.2))
    o.append(D(pa.X(kw / R / 2), pa.Y(kw * kw / 4 / R), ALI, 3.6))
    o.append(T(pa.X(kw / R / 2), pa.Y(kw * kw / 4 / R) - 7, "最大 %.0f W" % (kw * kw / 4 / R), "middle", 9.5, ALI, True, halo=True))
    o.append(D(pa.X(kw / R), pa.Y(0), PUR, 3.6))
    o.append(T(pa.X(kw / R) - 2, pa.Y(0) - 22, "短絡ブレーキ", "middle", 9.5, PUR, True, halo=True))
    o.append(T(pa.X(kw / R) - 2, pa.Y(0) - 9, "kω/R = 5.5 A: 0 W", "middle", 9, PUR, halo=True))
    o.append(T(pa.X(0.1), pa.Y(1.5), "電流 0: 0 W", "start", 9, MUT, halo=True))
    # (b) 減速の時間と電圧の最大
    pb = Plot(430, 44, 250, 190, (0, 0.8), (10, 35))
    o.append(pb.axes(xl="減速の時間 [s]", yl="電源の線の電圧の最大 [V]", xt=[0, 0.2, 0.4, 0.6, 0.8], yt=[12, 20, 30], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(pb.x, 26, "(b) 回生しながら減速したとき", "start", 10.5, INK, True))
    tds = [0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8]
    for C, c, lab in ((470e-6, ALI, "470 µF"), (1000e-6, GLD, "1000 µF")):
        pts = [(td, _f13_stopsim("regen", tdec=td, C=C, dt=2e-5, tend=min(0.9, td + 0.25), keep=10)["vmax"]) for td in tds]
        o.append(pb.line(pts, c=c, lw=2))
        o.append(T(pb.X(pts[2][0]) + 6, pb.Y(pts[2][1]) - 6, lab, "start", 9.5, c, True, halo=True))
    tc = _F13_J * 550.0 / _F13_TL
    o.append(W(pb.X(tc), pb.y, pb.X(tc), pb.y + pb.h, c=GRN, lw=1.3, dash="4 3"))
    o.append(T(pb.X(tc) - 4, pb.Y(30), "惰性停止の時間", "end", 9.5, GRN, True, halo=True))
    o.append(_f13_m(pb.X(tc) - 4, pb.Y(30) + 13, [("Jω", "0", False), ("/T", "L", False), (" = 0.55 s", None, False)], "end", 9.5, GRN))
    return SVG(700, 290, o, "回生で電源へ戻る電力と、電源の線の電圧（例のモータ。ほかの回路が 0.1 A を使い、電源は電流を吸い込めない。(b) は数値で解いた値）。戻る電力は、電流 0 と短絡ブレーキの電流で 0 になり、その中間で最大になる。惰性停止の時間より長くかけて減速すれば、電流が逆向きにならず、電圧は上がらない。")
F["e13_energy"] = _f13_energy()

# ================= 4 節 =================
def _f13_swbox(x, y1, y2, label, side, c=INK, lc=MUT):
    """縦向きのスイッチを四角で描き、入れ方を横に書く（side = -1 で左、1 で右）。"""
    ym = (y1 + y2) / 2
    o = W(x, y1, x, ym - 9, c=INK, lw=1.5) + W(x, ym + 9, x, y2, c=INK, lw=1.5)
    o += RECT(x - 6, ym - 9, 12, 18, 2, PAN, c, 1.4)
    o += T(x + side * 12, ym + 4, label, "start" if side > 0 else "end", 9, lc, True)
    return o

def _f13_sense():
    o = []
    # (a) 回路: H ブリッジの下にシャント抵抗。正転の PWM（左上を入れ切り、右下は入れたまま）
    xl, xr, xm = 118, 236, 177
    yt, ym, yb = 52, 126, 198
    o.append(T(14, 22, "(a) ローサイドのシャント抵抗（正転の PWM）", "start", 10.5, INK, True))
    o.append(PL([(xl, yt), (xl, ym), (xr, ym), (xr, yb), (xm, yb), (xm, yb + 34)], c=SSOFT, lw=7))
    o.append(PL([(xl + 5, ym + 3), (xl + 5, yb - 4), (xr - 5, yb - 4), (xr - 5, ym + 3)], c=PSOFT, lw=6))
    o.append(W(xl - 10, yt, xr + 10, yt, c=GLD, lw=1.8) + T(xr + 14, yt + 4, "V", "start", 9.5, GLD, True))
    o.append(_f13_swbox(xl, yt, ym, "ON の間だけ入る", -1, SIG, SIG))
    o.append(_f13_swbox(xl, ym, yb, "OFF の間だけ入る", -1, PUR, PUR))
    o.append(_f13_swbox(xr, yt, ym, "切ったまま", 1))
    o.append(_f13_swbox(xr, ym, yb, "入れたまま", 1))
    o.append(W(xl, ym, xm - 14, ym, c=INK, lw=1.5) + W(xm + 14, ym, xr, ym, c=INK, lw=1.5) + _f13_motor(xm, ym, 14))
    o.append(D(xl, ym, INK, 2.4) + D(xr, ym, INK, 2.4))
    o.append(W(xl, yb, xr, yb, c=INK, lw=1.5) + D(xm, yb, INK, 2.6))
    o.append(_f13_resv(xm, yb, yb + 34, c=GLD) + _f13_gnd(xm, yb + 34))
    o.append(_f13_m(xm - 12, yb + 22, [("R", "sh", True)], "end", 11, GLD, True))
    o.append(T(xm - 12, yb + 36, "20 mΩ", "end", 9, GLD))
    ax = 250
    o.append(W(xm, yb + 4, xm + 26, yb + 4, xm + 26, yb + 16, ax, yb + 16, c=INK, lw=1.3))
    o.append(PL([(ax, yb + 4), (ax, yb + 32), (ax + 30, yb + 18)], c=TEA, lw=1.5, fill=TSOFT))
    o.append(T(ax + 11, yb + 22, "×20", "middle", 8.5, TEA, True))
    o.append(W(ax + 30, yb + 18, ax + 40, yb + 18, c=INK, lw=1.3))
    o.append(RECT(ax + 40, yb + 6, 44, 24, 4, SSOFT, SIG, 1.3) + T(ax + 62, yb + 23, "ADC", "middle", 10, SIG, True))
    o.append(T(14, yb + 66, "青: ON の間の電流（シャント抵抗を通る）", "start", 9.5, SIG, True))
    o.append(T(14, yb + 81, "紫: OFF の間の電流（下の 2 つを回り、通らない）", "start", 9.5, PUR, True))
    # (b) 波形
    p = Plot(424, 70, 256, 150, (0, 150), (0, 0.75))
    o.append(T(384, 22, "(b) 電流と、測る時刻（20 kHz・デューティ比 0.5）", "start", 10.5, INK, True))
    w, c = _f13_ss(0.5, 20e3, False)
    wave = _f13_wave(c, 3, 60)
    for q in range(3):
        o.append(RECT(p.X(q * 50), 40, p.X(25) - p.X(0), 12, 1, GOSOFT, GLD, 0.8))
    o.append(T(p.x - 6, 50, "ON", "end", 9, GLD, True))
    o.append(p.axes(xl="時間 [µs]", yl="電流 [A]", xt=[0, 50, 100, 150], yt=[0, 0.25, 0.5, 0.75], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(t * 1e6, I) for t, I in wave], c=PUR, lw=1.6, dash="5 3"))
    sh = []
    for t, I in wave:
        on = (t * 1e6) % 50 < 25 - 1e-9
        sh.append((t * 1e6, I if on else 0.0))
    o.append(p.line(sh, c=SIG, lw=2))
    for q in range(3):
        o.append(D(p.X(q * 50 + 12.5), p.Y(c["Ion"] + (c["Ia"] - c["Ion"]) * math.exp(-12.5e-6 / c["tau"])), ALI, 4))
    o.append(p.line([(0, c["Iavg"]), (150, c["Iavg"])], c=ALI, lw=1, dash="3 3"))
    o.append(LEGEND(384, 274, [(SIG, "シャント抵抗の電流"), (PUR, "巻線の電流（破線）")]))
    o.append(T(384, 292, "赤い点: ON の中央で測った値 = 1 周期の平均 0.5 A", "start", 9.5, ALI, True))
    return SVG(700, 302, o, "電流検出。(a) H ブリッジと 0 V の間のシャント抵抗の電圧を増幅して ADC で測る。(b) シャント抵抗には ON の間だけ巻線の電流が流れる。電流は三角の形なので、ON の中央の値は 1 周期の平均の電流に等しい。")
F["e13_sense"] = _f13_sense()

def _f13_stall_py(i_ma, duty_pm, v_mv, r_mohm, st):
    """本文の stall_step() と同じ判定（図のため）。st = [acc_ms, stalled]"""
    lock = duty_pm * v_mv // r_mohm
    sus = lock >= 1500 and i_ma * 100 >= lock * 70
    if sus:
        st[0] = min(150, st[0] + 1)
    elif st[0] > 0:
        st[0] -= 1
    if st[0] >= 150:
        st[1] = True
    return sus, lock

def _f13_stallfig():
    o = []
    R, L, k, J, TL, V = _F13_R, _F13_L, _F13_K, _F13_J, _F13_TL, _F13_V
    dt, I, w, t = 1e-5, 0.0, 0.0, 0.0
    tlock, ramp = 0.6, 0.2
    st = [0, False]; rows = []; isum = 0.0; ns = 0; tdet = None
    while t < 1.0:
        Dd = min(1.0, t / ramp)
        I += (Dd * V - R * I - k * w) / L * dt
        if I < 0:
            I = 0.0
        if t >= tlock:
            w = 0.0
        else:
            tm = k * I; w += (tm - _f13_tl(w, tm, TL)) / J * dt
            if w < 0:
                w = 0.0
        isum += I; ns += 1; t += dt
        if ns == 100:
            im = isum / ns; isum = 0.0; ns = 0
            dpm = int(Dd * 1000 + 0.5)
            sus, lock = _f13_stall_py(int(im * 1000 + 0.5), dpm, 12000, 2800, st)
            rows.append((t, im, lock / 1000.0, st[0], sus))
            if st[1] and tdet is None:
                tdet = t
    pa = Plot(80, 46, 560, 120, (0, 1000), (0, 6.5))
    pb = Plot(80, 210, 560, 80, (0, 1000), (0, 160))
    xt = [0, 200, 400, 600, 800, 1000]
    _f13_panel(o, pa, "(a) 電流と、しきい値（0.2 s で加速し、0.6 s で止められる）", "電流 [A]", [0, 2, 4, 6], lambda v: "%g" % v, xt)
    _f13_panel(o, pb, "(b) 疑いの積算", "積算 [ms]", [0, 50, 100, 150], lambda v: "%g" % v, xt, lambda v: "%g" % v, "時間 [ms]")
    o.append(pa.line([(r[0] * 1e3, r[2]) for r in rows], c=GLD, lw=1.3, dash="5 3"))
    o.append(pa.line([(r[0] * 1e3, r[2] * 0.7) for r in rows], c=ALI, lw=1.3, dash="2 2"))
    o.append(pa.line([(r[0] * 1e3, r[1]) for r in rows], c=SIG, lw=2))
    o.append(T(pa.X(260), pa.Y(4.29) - 6, "拘束電流 DV/R（温まった巻線 2.8 Ω で計算）", "start", 9.5, GLD, True, halo=True))
    o.append(T(pa.X(260), pa.Y(3.0) - 6, "その 70 %（しきい値）", "start", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(380), pa.Y(1.3), "回っている間 0.5 A", "start", 9.5, SIG, halo=True))
    o.append(T(pa.X(612), pa.Y(5.8) + 4, "止められた", "start", 9.5, SIG, True, halo=True))
    o.append(W(pa.X(600), pa.y, pa.X(600), pb.y + pb.h, c=FNT, lw=1, dash="3 3"))
    o.append(pb.steps([(r[0] * 1e3, r[3]) for r in rows], c=PUR, lw=1.8))
    o.append(W(pb.X(0), pb.Y(150), pb.X(1000), pb.Y(150), c=ALI, lw=1.2, dash="4 3"))
    mx = max(r[3] for r in rows if r[0] < 0.6)
    o.append(T(pb.X(150), pb.Y(mx) - 6, "加速の間の疑い（最大 %d ms）は、すぐ減る" % mx, "start", 9.5, PUR, halo=True))
    if tdet:
        o.append(D(pb.X(tdet * 1e3), pb.Y(150), ALI, 4))
        o.append(T(pb.X(tdet * 1e3) - 6, pb.Y(150) + 14, "%.0f ms で拘束と決める" % (tdet * 1e3), "end", 9.5, ALI, True, halo=True))
    return SVG(700, 336, o, "拘束の検出（例のモータ、12 V。数値で解いた電流を 1 ms ごとに判定に渡した）。加速の間も、電流は拘束電流の 7 割を超えることがあるが、積算が 150 ms に届く前に減る。止められると、電流は 6 A に上がり、150 ms で拘束と決める。")
F["e13_stall"] = _f13_stallfig()

def _f13_guard():
    o = []
    rows = [("電流・速さの変化で挟み込みを見つけ、止めて少し戻す", "マイコン（ソフト）", SIG, False),
            ("ドライバの電流の上限で、出せる力そのものを限る", "回路", GLD, True),
            ("すべるクラッチ・ギアで、伝わる力を限る", "機構", PUR, True),
            ("縁・端のスイッチで、モータの電流を直接切る", "回路（マイコンを通さない）", GLD, True),
            ("ウォッチドッグでリセットしたら、ドライバは止まる側", "回路", GLD, True),
            ("止まったとき: 挟む力が残らない・重い扉が落ちない", "機構（ブレーキなど）", PUR, True)]
    x1, x2, x3, y0, rh = 14, 392, 566, 46, 32
    o.append(T(x1, 26, "守り", "start", 10.5, INK, True))
    o.append(T(x2, 26, "何がするか", "start", 10.5, INK, True))
    o.append(T(x3, 26, "マイコンが止まったら", "start", 10.5, INK, True))
    for i, (what, who, c, ok) in enumerate(rows):
        y = y0 + i * rh
        o.append(RECT(x1 - 4, y, 690 - x1, rh - 5, 5, soft(c), c, 1.0))
        o.append(T(x1 + 4, y + 17, what, "start", 10, INK))
        o.append(T(x2, y + 17, who, "start", 10, c, True))
        o.append(T(x3, y + 17, "効く" if ok else "効かない", "start", 10, GRN if ok else ALI, True))
    yb = y0 + len(rows) * rh + 14
    o.append(T(x1, yb, "挟む力や止まるまでの時間の上限は、製品の種類ごとの安全規格で確かめる。", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "挟み込みから人を守る守りの重ね方。マイコンのソフトでする検出は、マイコンが暴走したり測り誤ったりすると働かないので、力そのものを回路と機構で限り、マイコンを通さずに電流を切る守りを重ねる。")
F["e13_guard"] = _f13_guard()

# ================= 5 節 =================
def _f13_stepseq():
    o = []
    x0, sw = 100, 66                      # 1 段の幅
    X = lambda s: x0 + s * sw
    seqA = [1, -1, -1, 1, 1, -1, -1, 1]
    seqB = [1, 1, -1, -1, 1, 1, -1, -1]
    o.append(T(14, 20, "(a) 1 段ずつ（2 つの巻線に同時に流す）", "start", 10.5, INK, True))
    # 磁界の向き（電気角）
    for s in range(8):
        cx, cy = X(s + 0.5), 46
        ang = math.radians(45 + 90 * s)
        o.append(CIRC(cx, cy, 13, c=LIN, lw=1.1, fill=PAN))
        o.append(ARR(cx - 9 * math.cos(ang), cy + 9 * math.sin(ang), cx + 10 * math.cos(ang), cy - 10 * math.sin(ang), c=SIG, lw=1.6, head=5))
    o.append(T(x0 - 8, 50, "磁界の向き", "end", 9.5, SIG))
    def wave(seq, y, lab, c, n=8):
        pts = []
        for s, v in enumerate(seq[:n]):
            yy = y - v * 13
            if pts:
                pts.append((X(s), pts[-1][1]))
            pts += [(X(s), yy), (X(s + 1), yy)]
        o.append(W(X(0), y, X(n), y, c=FNT, lw=1))
        o.append(PL(pts, c=c, lw=2))
        o.append(T(x0 - 8, y + 4, lab, "end", 10, c, True))
    wave(seqA, 96, "巻線 A", GLD)
    wave(seqB, 138, "巻線 B", TEA)
    for s in range(9):
        o.append(T(X(s), 166, "%.1f°" % (1.8 * s), "middle", 9, MUT))
    o.append(T(x0 - 18, 168, "回転子の角度", "end", 9.5, MUT))
    # (b) マイクロステップ（1/8）
    o.append(T(14, 196, "(b) マイクロステップ（1 段を 8 つに分ける）", "start", 10.5, INK, True))
    def micro(fn, y, lab, c):
        pts = []
        for m in range(64):
            v = fn(math.radians(45 + 90 * m / 8.0))
            yy = y - v * 15
            if pts:
                pts.append((x0 + m * sw / 8.0, pts[-1][1]))
            pts += [(x0 + m * sw / 8.0, yy), (x0 + (m + 1) * sw / 8.0, yy)]
        o.append(W(X(0), y, X(8), y, c=FNT, lw=1))
        o.append(PL(pts, c=c, lw=1.8))
        o.append(T(x0 - 8, y + 4, lab, "end", 10, c, True))
    micro(lambda a: math.cos(a) * 1.41421356, 232, "巻線 A", GLD)
    micro(lambda a: math.sin(a) * 1.41421356, 276, "巻線 B", TEA)
    o.append(T(14, 312, "縦は電流（上が正の向き）。磁界の向きが 90° 回るごとに、回転子は 1 段（1.8°）回る。", "start", 9.5, MUT))
    return SVG(700, 322, o, "ステッピングモータ（2 つの巻線、ステップ角 1.8°）の巻線の電流。(a) 電流の向きを順に切り替えると、磁界の向きが 90° ずつ回り、回転子が 1 段ずつ回る。(b) 2 つの巻線の電流を正弦波の形で少しずつ変えると、1 段を細かく分けて進められる。")
F["e13_stepseq"] = _f13_stepseq()

def _f13_tp(v):
    return 0.4 / math.sqrt(1 + (v / 800.0) ** 2)

def _f13_trap():
    o = []
    vmax, a, N = 3000.0, 10000.0, 4000.0
    ta = vmax / a; da = vmax * vmax / (2 * a); tc = (N - 2 * da) / vmax
    pa = Plot(66, 46, 270, 190, (0, 1.8), (0, 3500))
    o.append(pa.axes(xl="時間 [s]", yl="速さ [段/s]", xt=[0, 0.5, 1.0, 1.5], yt=[0, 1000, 2000, 3000], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(pa.x, 26, "(a) 台形の速度（4000 段を動かす）", "start", 10.5, INK, True))
    pts = [(0, 0), (ta, vmax), (ta + tc, vmax), (2 * ta + tc, 0)]
    o.append(PL([(pa.X(0), pa.Y(0)), (pa.X(ta), pa.Y(vmax)), (pa.X(ta), pa.Y(0))], c=SIG, lw=0, fill=SSOFT, op=0.9))
    o.append(PL([(pa.X(ta + tc), pa.Y(0)), (pa.X(ta + tc), pa.Y(vmax)), (pa.X(2 * ta + tc), pa.Y(0))], c=ALI, lw=0, fill=ASOFT, op=0.9))
    o.append(pa.line(pts, c=INK, lw=2))
    o.append(T(pa.X(ta / 2) + 4, pa.Y(700), "加速", "middle", 9.5, SIG, True, halo=True))
    o.append(T(pa.X(ta / 2) + 4, pa.Y(350), "450 段", "middle", 9, SIG, halo=True))
    o.append(T(pa.X(ta + tc + ta / 2) - 4, pa.Y(700), "減速", "middle", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(ta + tc + ta / 2) - 4, pa.Y(350), "450 段", "middle", 9, ALI, halo=True))
    o.append(T(pa.X(ta + tc) - 4, pa.Y(vmax) + 20, "残りが v²/(2a) = 450 段", "end", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(ta + tc) - 4, pa.Y(vmax) + 34, "になったら減速を始める", "end", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(ta) + 4, pa.Y(vmax) - 6, "a = 10,000 段/s²", "start", 9.5, INK, halo=True))
    # (b) 速さと要るトルク・出せるトルク
    pb = Plot(420, 46, 260, 190, (0, 5000), (0, 0.42))
    o.append(pb.axes(xl="速さ [段/s]", yl="トルク [N·m]", xt=[0, 1000, 2000, 3000, 4000, 5000], yt=[0, 0.1, 0.2, 0.3, 0.4], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(pb.x - 30, 26, "(b) 加速の間に要るトルクと出せるトルク", "start", 10.5, INK, True))
    o.append(pb.line([(v, _f13_tp(v)) for v in range(0, 5001, 50)], c=GRN, lw=2.2))
    o.append(T(pb.X(800), pb.Y(_f13_tp(800)) - 8, "出せるトルク", "start", 9.5, GRN, True, halo=True))
    th = math.pi / 100
    for acc, c, lab in ((10000, SIG, "a = 10,000"), (30000, ALI, "a = 30,000")):
        need = 1e-4 * acc * th + 0.05
        o.append(pb.line([(0, need), (3000, need)], c=c, lw=1.8))
        o.append(T(pb.X(40), pb.Y(need) - 5, "%s: %.3f N·m" % (lab, need), "start", 9, c, True, halo=True))
    o.append(pb.line([(0, 0.05), (5000, 0.05)], c=MUT, lw=1.1, dash="4 3"))
    o.append(T(pb.X(4950), pb.Y(0.05) + 13, "負荷のトルク 0.05", "end", 9, MUT, halo=True))
    vx = 800 * math.sqrt((0.4 / (1e-4 * 30000 * th + 0.05)) ** 2 - 1)
    o.append(D(pb.X(vx), pb.Y(_f13_tp(vx)), ALI, 4))
    o.append(T(pb.X(vx) + 8, pb.Y(_f13_tp(vx)) - 22, "%.0f 段/s で足りなくなり" % round(vx, -1), "start", 9.5, ALI, True, halo=True))
    o.append(T(pb.X(vx) + 8, pb.Y(_f13_tp(vx)) - 9, "脱調する", "start", 9.5, ALI, True, halo=True))
    o.append(W(pb.X(3000), pb.y, pb.X(3000), pb.y + pb.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(pb.X(3000) + 4, pb.Y(0.3), "最高の速さ", "start", 9, MUT, halo=True))
    return SVG(700, 290, o, "ステッピングモータの加減速（例の値: 保持トルク 0.4 N·m、慣性モーメント 1 × 10⁻⁴ kg·m²、負荷のトルク 0.05 N·m）。(a) 台形の速度。減速を始める位置は v²/(2a) で決まる。(b) 出せるトルクは速いほど小さい。加速の間に要るトルクが、最高の速さまでの間に出せるトルクを超えないように加速度を決める。")
F["e13_trap"] = _f13_trap()

# ================= 6 節 =================
def _f13_servo():
    o = []
    # (a) 周期の全体（1.5 ms のパルス）
    p1 = Plot(70, 54, 290, 46, (0, 45), (0, 1))
    o.append(T(14, 22, "(a) 20 ms ごとのパルス", "start", 10.5, INK, True))
    pts = []
    for q in range(3):
        t0 = q * 20
        pts += [(t0, 0), (t0, 1), (t0 + 1.5, 1), (t0 + 1.5, 0)]
    pts.append((45, 0))
    o.append(p1.line(pts, c=SIG, lw=2))
    for v in (0, 20, 40):
        o.append(T(p1.X(v), p1.y + p1.h + 14, "%d" % v, "middle", 9, MUT))
    o.append(T(p1.X(45), p1.y + p1.h + 14, "ms", "end", 9, MUT))
    o.append(DIM(p1.X(1.5), p1.y + 10, p1.X(20), p1.y + 10, None, c=MUT))
    o.append(T(p1.X(10.8), p1.y + 6, "周期 20 ms（50 Hz）", "middle", 9.5, MUT))
    # 拡大: 幅と角度
    p2 = Plot(70, 150, 220, 120, (0, 3), (0, 3))
    o.append(T(14, 138, "幅を拡大（代表値。製品で確かめる）", "start", 9.5, MUT))
    for i, (wd, ang, lab) in enumerate(((1.0, -60, "1.0 ms"), (1.5, 0, "1.5 ms"), (2.0, 60, "2.0 ms"))):
        y = 2.6 - i * 1.0
        o.append(p2.line([(0, y - 0.6), (0.4, y - 0.6), (0.4, y), (0.4 + wd, y), (0.4 + wd, y - 0.6), (3, y - 0.6)], c=SIG, lw=1.8))
        o.append(T(p2.X(0.4 + wd) + 6, p2.Y(y) + 10, lab, "start", 9.5, SIG, True))
        cx, cy = 330, p2.Y(y - 0.3)
        o.append(CIRC(cx, cy, 15, c=PUR, lw=1.3, fill=PSOFT))
        aa = math.radians(90 - ang)
        o.append(W(cx, cy, cx + 13 * math.cos(aa), cy - 13 * math.sin(aa), c=PUR, lw=2.2))
        o.append(T(cx + 22, cy + 4, ("%+d°" % ang) if ang else "中央", "start", 9.5, PUR, True))
    # (b) 電流
    pb = Plot(440, 40, 240, 200, (0, 400), (0, 2.6))
    o.append(pb.axes(xl="時間 [ms]", yl="サーボの電源の電流 [A]", xt=[0, 100, 200, 300, 400], yt=[0, 0.5, 1, 1.5, 2, 2.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(410, 22, "(b) 3 台を動かすときの電流（代表的な形）", "start", 10.5, INK, True))
    def pulse(t, t0):
        if t < t0:
            return 0.03
        u = t - t0
        return 0.03 + (0.8 if u < 120 else 0.0) * (0.25 + 0.75 * math.exp(-u / 25.0)) * min(1.0, u / 2.0)
    ts = [i * 1.0 for i in range(401)]
    o.append(pb.line([(t, 3 * pulse(t, 20) - 0.06) for t in ts], c=ALI, lw=1.8))
    o.append(pb.line([(t, pulse(t, 20) + pulse(t, 140) + pulse(t, 260) - 0.06) for t in ts], c=SIG, lw=1.8))
    o.append(T(pb.X(30), pb.Y(2.4), "同時に動かす: 最大 2.4 A", "start", 9.5, ALI, True, halo=True))
    o.append(T(pb.X(160), pb.Y(1.1), "120 ms ずつずらす: 0.8 A", "start", 9.5, SIG, True, halo=True))
    return SVG(700, 306, o, "サーボモータ（RC サーボ）の信号と電流。(a) パルスの幅で角度を指令する（周期・幅・角度の範囲は製品で違う）。(b) 動き始めるたびに、中の DC モータの起動電流が流れる。同時に動かすと電流が重なる（電流の値は例の値）。")
F["e13_servo"] = _f13_servo()

# ================= 7 節 =================
def _f13_ocv(q):
    """3 セルのリチウムイオン電池の起電力の代表的な形（q: 使った割合 0〜1）。"""
    pts = [(0, 4.20), (0.1, 4.06), (0.2, 3.97), (0.3, 3.89), (0.4, 3.82), (0.5, 3.77), (0.6, 3.72), (0.7, 3.68), (0.8, 3.62), (0.9, 3.50), (0.95, 3.35), (1.0, 3.00)]
    for (a, va), (b, vb) in zip(pts, pts[1:]):
        if q <= b:
            return 3 * (va + (vb - va) * (q - a) / (b - a))
    return 9.0

def _f13_batt():
    o = []
    R, k, TL, Rin = _F13_R, _F13_K, _F13_TL, 0.3
    I = TL / k
    qs = [i / 200.0 for i in range(201)]
    def comp(q):
        E = _f13_ocv(q)
        Dd = min(1.0, 9.0 / (E - Rin * min(1.0, 9.0 / E) * I))
        Vt = E - Rin * Dd * I
        return Vt, Dd, (Dd * Vt - R * I) / k
    def nocomp(q):
        E = _f13_ocv(q); Dd = 9.0 / 12.6
        Vt = E - Rin * Dd * I
        return Vt, Dd, (Dd * Vt - R * I) / k
    pa = Plot(80, 46, 560, 80, (0, 100), (8.5, 13))
    pb = Plot(80, 166, 560, 70, (0, 100), (0.6, 1.05))
    pc = Plot(80, 276, 560, 80, (0, 100), (250, 420))
    xt = [0, 20, 40, 60, 80, 100]
    _f13_panel(o, pa, "(a) 電池の端子電圧（3 セルのリチウムイオン電池の代表的な形）", "電圧 [V]", [9, 10, 11, 12, 13], lambda v: "%g" % v, xt)
    _f13_panel(o, pb, "(b) デューティ比", "デューティ比", [0.7, 0.8, 0.9, 1.0], lambda v: "%g" % v, xt)
    _f13_panel(o, pc, "(c) 速さ", "角速度 [rad/s]", [250, 300, 350, 400], lambda v: "%g" % v, xt, lambda v: "%g" % v, "使った電荷の割合 [%]")
    o.append(pa.line([(q * 100, comp(q)[0]) for q in qs], c=GLD, lw=2))
    o.append(pa.line([(0, 9), (100, 9)], c=SIG, lw=1.2, dash="4 3"))
    o.append(_f13_m(pa.X(2), pa.Y(9) - 5, [("V", "set", True), (" = 9 V（目標の平均の電圧）", None, False)], "start", 9.5, SIG))
    o.append(pb.line([(q * 100, comp(q)[1]) for q in qs], c=SIG, lw=2))
    o.append(pb.line([(q * 100, nocomp(q)[1]) for q in qs], c=ALI, lw=1.6, dash="5 3"))
    o.append(pc.line([(q * 100, comp(q)[2]) for q in qs], c=SIG, lw=2))
    o.append(pc.line([(q * 100, nocomp(q)[2]) for q in qs], c=ALI, lw=1.6, dash="5 3"))
    o.append(_f13_m(pb.X(4), pb.Y(0.9), [("直す: D = V", "set", False), (" / V", None, False)], "start", 9.5, SIG, True))
    o.append(T(pb.X(4), pb.Y(0.714) + 14, "直さない: 0.714 のまま", "start", 9.5, ALI, True, halo=True))
    o.append(T(pc.X(4), pc.Y(400) - 6, "直す: %.0f rad/s のまま" % comp(0.5)[2], "start", 9.5, SIG, True, halo=True))
    q93 = 0.95 + 0.05 * (3.35 - 3.10) / 0.35            # 起電力 9.3 V の所
    o.append(T(pc.X(88), pc.Y(285), "直さない: %.0f rad/s → 起電力 9.3 V で %.0f rad/s" % (nocomp(0)[2], nocomp(q93)[2]), "end", 9.5, ALI, True, halo=True))
    return SVG(700, 400, o, "電池が減ったときのデューティ比と速さ（例のモータ、電池の内部抵抗 0.3 Ω。電池の電圧は代表的な形の例）。デューティ比を満充電のときのままにすると、電池が減るにつれて遅くなる。測った電池の電圧で目標の平均の電圧を割ってデューティ比にすると、速さは変わらない。")
F["e13_batt"] = _f13_batt()

def _f13_split():
    o = []
    def bat(x, y):
        o.append(RECT(x, y, 36, 72, 4, GOSOFT, GLD, 1.4))
        o.append(T(x + 18, y + 32, "電池", "middle", 9.5, GLD, True))
        o.append(T(x + 18, y + 47, "12 V", "middle", 9, GLD))
        o.append(T(x + 41, y + 12, "+", "start", 11, GLD, True) + T(x + 41, y + 68, "−", "start", 11, GLD, True))
    def box(x, y, w, h, t, c):
        o.append(RECT(x, y, w, h, 5, soft(c), c, 1.3))
        o.append(T(x + w / 2, y + h / 2 + 4, t, "middle", 9.5, c, True))
    # ---- (a) 同じ線でつなぐ ----
    o.append(T(14, 22, "(a) 同じ線でつなぐ", "start", 10.5, ALI, True))
    bat(16, 56)
    yp, yn = 66, 120                                  # + と − の線の高さ
    o.append(PL([(52, yp), (150, yp)], c=ASOFT, lw=7) + PL([(52, yn), (150, yn)], c=ASOFT, lw=7))
    o.append(W(52, yp, 80, yp, c=INK, lw=1.5) + _f13_resh(80, 122, yp) + W(122, yp, 150, yp, c=INK, lw=1.5))
    o.append(W(52, yn, 80, yn, c=INK, lw=1.5) + _f13_resh(80, 122, yn) + W(122, yn, 150, yn, c=INK, lw=1.5))
    o.append(T(101, yp - 12, "共通の線の抵抗", "middle", 9, ALI))
    o.append(W(150, 44, 150, 96, c=INK, lw=1.5) + D(150, yp, INK, 2.6))
    o.append(W(150, 44, 190, 44, c=INK, lw=1.5) + W(150, 96, 190, 96, c=INK, lw=1.5))
    box(190, 32, 110, 24, "モータのドライバ", PUR)
    box(190, 84, 110, 24, "マイコンの電源", SIG)
    o.append(W(300, 44, 322, 44, 322, yn, 150, yn, c=INK, lw=1.5) + W(300, 96, 312, 96, 312, yn, c=INK, lw=1.5) + D(312, yn, INK, 2.4) + D(150, yn, INK, 2.6))
    o.append(T(14, 154, "モータの電流が共通の線の抵抗に電圧を生み、", "start", 9.5, ALI))
    o.append(T(14, 168, "マイコンの電源の電圧が下がり、GND も揺れる", "start", 9.5, ALI))
    # ---- (b) 電池の端子で道を分ける ----
    o.append(T(366, 22, "(b) 電池の端子で道を分ける", "start", 10.5, GRN, True))
    bx = 366
    bat(bx, 56)
    xp = bx + 36
    # モータの道（紫）: + から上へ、ドライバの右から − へ
    o.append(W(xp, 62, 420, 62, 420, 44, 560, 44, c=PUR, lw=1.6))
    box(560, 32, 120, 24, "モータのドライバ", PUR)
    o.append(W(680, 44, 690, 44, 690, 140, 420, 140, 420, 124, xp, 124, c=PUR, lw=1.6))
    # マイコンの道（青）: + からダイオード・コンデンサを通って
    o.append(W(xp, 70, 440, 70, 440, 96, 470, 96, c=SIG, lw=1.4))
    o.append(PL([(470, 90), (470, 102), (481, 96)], c=SIG, lw=1.2, fill=SSOFT) + W(481, 90, 481, 102, c=SIG, lw=1.6))
    o.append(W(481, 96, 560, 96, c=SIG, lw=1.4) + D(505, 96, SIG, 2.4))
    o.append(W(505, 96, 505, 103, c=SIG, lw=1.4) + W(497, 103, 513, 103, c=SIG, lw=1.8) + W(497, 108, 513, 108, c=SIG, lw=1.8) + W(505, 108, 505, 116, c=SIG, lw=1.4))
    box(560, 84, 120, 24, "マイコンの電源", SIG)
    o.append(W(620, 108, 620, 116, 430, 116, 430, 116, c=SIG, lw=1.4) + W(430, 116, xp, 116, c=SIG, lw=1.4) + D(505, 116, SIG, 2.4))
    o.append(T(475, 84, "ダイオード", "middle", 9, SIG))
    o.append(T(520, 128, "コンデンサ", "start", 9, SIG))
    o.append(T(366, 160, "電池の端子でモータの道とマイコンの道に分ける。モータの電流は", "start", 9.5, GRN))
    o.append(T(366, 174, "マイコンの線を通らない。短い落ち込みの間はコンデンサが電流を出す", "start", 9.5, GRN))
    return SVG(700, 184, o, "電池でモータとマイコンを動かすときの配線。(a) 同じ線でつなぐと、モータの電流による電圧の低下がマイコンの電源と GND に現れる。(b) 電池の端子の所で道を分け、マイコンの側にはダイオードとコンデンサを置く（ダイオードは、コンデンサの電荷がモータの側へ流れ出るのを防ぐ）。")
F["e13_split"] = _f13_split()
