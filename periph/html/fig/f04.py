# -*- coding: utf-8 -*-
# 04 章 電池で動かす制御 の図

# ---- 補助: 記号・回路の部品 ----
def _f04_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。例 [("R", "in", True)]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s">'
         % (round(x0, 2), y, sz, c, "700" if b else "400")]
    for s, sub, it in parts:
        o.append('<tspan font-style="%s">%s</tspan>' % ("italic" if it else "normal", E(s)))
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan><tspan dy="-3"></tspan>' % (sz * 0.72, E(sub)))
    o.append("</text>")
    return "".join(o)

def _f04_resh(x1, x2, y, c=INK, lw=1.5, h=6, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f04_resv(x, y1, y2, c=INK, lw=1.5, h=6, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f04_capv(x, y, c=SIG, w=13):
    """縦向きのコンデンサ（2 枚の板）。(x, y) は 2 枚の間の中心。"""
    return W(x - w, y - 4, x + w, y - 4, c=c, lw=2.2) + W(x - w, y + 4, x + w, y + 4, c=c, lw=2.2)

def _f04_src(x, y, r=15, c=GLD):
    """電圧の源（丸に + と −）。"""
    return (CIRC(x, y, r, c=c, lw=1.6, fill=PAN) + T(x, y - r * 0.18, "+", "middle", 11, c, True)
            + T(x, y + r * 0.72, "−", "middle", 11, c, True))

def _f04_isrc(x, y, r=14, c=PUR):
    """電流の源（丸に下向きの矢印）。負荷の電流を表す。"""
    return CIRC(x, y, r, c=c, lw=1.6, fill=PAN) + ARR(x, y - r + 4, x, y + r - 3, c=c, lw=1.5, head=6)

def _f04_cellv(x, y, c=GLD):
    """縦向きの電池の記号（上がプラス）。(x, y) は中心。"""
    return W(x - 13, y - 4, x + 13, y - 4, c=c, lw=1.8) + W(x - 7, y + 4, x + 7, y + 4, c=c, lw=3.2)

def _f04_diode(x, y, c=INK, s=8, left=False):
    """横向きのダイオード（既定は左から右へ流す）。(x, y) は三角の先。"""
    k = -1 if left else 1
    return (PL([(x - k * 1.6 * s, y - s), (x - k * 1.6 * s, y + s), (x, y)], c=c, lw=1.4, fill=soft(c))
            + W(x, y - s, x, y + s, c=c, lw=1.8))

def _f04_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return W(x, y, x, y + 6, c=c, lw=1.4) + W(x - 8, y + 6, x + 8, y + 6, c=c, lw=1.6) + W(x - 5, y + 10, x + 5, y + 10, c=c, lw=1.4) + W(x - 2, y + 14, x + 2, y + 14, c=c, lw=1.2)

# ---- 回路の式: 電池（E, R_in）＋コンデンサ（C, ESR）＋負荷の電流（区分的に一定） ----
def _f04_r(t, Rin, C, Re):
    """1 A の電流を時刻 0 から流し続けたときの端子電圧の低下 [V]（t < 0 なら 0）。"""
    if t < 0:
        return 0.0
    if C <= 0:
        return Rin
    Rp = Rin * Re / (Rin + Re)
    tau = C * (Rin + Re)
    return Rin - (Rin - Rp) * math.exp(-t / tau)

def _f04_v(t, E, Rin, C, Re, pulses):
    """pulses = [(始まり, 長さ, 電流), ...] のときの端子電圧（重ね合わせ）。"""
    d = 0.0
    for s, L, I in pulses:
        d += I * (_f04_r(t - s, Rin, C, Re) - _f04_r(t - s - L, Rin, C, Re))
    return E - d

def _f04_drop(I, t, Rin, C, Re):
    return I * _f04_r(t, Rin, C, Re)

_F04_E, _F04_RIN, _F04_C, _F04_RE = 2.8, 100.0, 100e-6, 0.5

# ---- 1 節: 大容量コンデンサ ----
def _f04_bulk():
    o = []
    # 回路（左）
    yt, yb = 92, 262
    o.append(RECT(10, 50, 116, 232, 8, "none", GLD, 1.2, dash="4 3"))
    o.append(T(18, 68, "電池（模型）", "start", 10, GLD, True))
    xs = 38
    o.append(W(xs, yt, xs, 160, c=INK, lw=1.5) + W(xs, 192, xs, yb, c=INK, lw=1.5))
    o.append(_f04_src(xs, 176, 16, GLD))
    o.append(_f04_m(60, 181, [("E", None, True), (" = 2.8 V", None, False)], "start", 10.5, GLD, True))
    o.append(W(xs, yt, 56, yt, c=INK, lw=1.5) + _f04_resh(56, 106, yt, c=INK) + W(106, yt, 238, yt, c=INK, lw=1.5))
    o.append(_f04_m(81, 120, [("R", "in", True)], "middle", 11, INK))
    o.append(T(81, 134, "100 Ω", "middle", 10, INK))
    o.append(W(xs, yb, 238, yb, c=INK, lw=1.5))
    # コンデンサの枝
    xc = 158
    o.append(D(xc, yt, INK, 3) + D(xc, yb, INK, 3))
    o.append(W(xc, yt, xc, 118, c=SIG, lw=1.5) + _f04_resv(xc, 118, 158, c=SIG) + W(xc, 158, xc, 186, c=SIG, lw=1.5))
    o.append(_f04_capv(xc, 190, SIG) + W(xc, 194, xc, yb, c=SIG, lw=1.5))
    o.append(_f04_m(148, 143, [("R", "ESR", True)], "end", 10.5, SIG))
    o.append(T(148, 195, "C", "end", 11, SIG, True))
    o.append(T(xc, 220, "100 µF", "middle", 9.5, SIG))
    o.append(T(xc, 233, "ESR 0.5 Ω", "middle", 9.5, SIG))
    # 負荷
    xl = 238
    o.append(W(xl, yt, xl, 161, c=PUR, lw=1.5) + _f04_isrc(xl, 176, 15, PUR) + W(xl, 191, xl, yb, c=PUR, lw=1.5))
    o.append(T(xl, 210, "負荷", "middle", 10, PUR, True))
    o.append(T(xl, 223, "送信", "middle", 9.5, PUR))
    o.append(T(xl, 236, "15 mA", "middle", 9.5, PUR))
    o.append(T(xl, 249, "3 ms", "middle", 9.5, PUR))
    # 電流の矢印
    o.append(ARR(116, yt - 14, 148, yt - 14, c=GLD, lw=1.6, head=6))
    o.append(T(132, yt - 21, "電池の電流", "middle", 9.5, GLD, True))
    o.append(ARR(xc + 16, 152, xc + 16, 114, c=SIG, lw=1.6, head=6))
    o.append(T(xc + 21, 128, "コンデンサ", "start", 9.5, SIG, True))
    o.append(T(xc + 21, 141, "の電流", "start", 9.5, SIG, True))
    o.append(T(14, 302, "負荷の両端の電圧が端子電圧 V", "start", 9.5, MUT))
    # 波形（右）
    E, Rin, C, Re = _F04_E, _F04_RIN, _F04_C, _F04_RE
    ps = [(5e-3, 3e-3, 15e-3)]
    pI = Plot(330, 34, 346, 92, (0, 40), (0, 16))
    o.append(T(290, 22, "電池が出す電流", "start", 10.5, INK, True))
    o.append(pI.axes(xt=[0, 10, 20, 30, 40], yt=[0, 5, 10, 15], xfmt=lambda v: "", yfmt=lambda v: "%d" % v))
    o.append(T(pI.x - 30, pI.y + pI.h / 2, "mA", "middle", 9.5, MUT, rot=-90))
    o.append(pI.line([(0, 0), (5, 0), (5, 15), (8, 15), (8, 0), (40, 0)], c=ALI, lw=1.6, dash="5 3"))
    ib = [(k * 0.1, (E - _f04_v(k * 1e-4, E, Rin, C, Re, ps)) / Rin * 1e3) for k in range(0, 401)]
    o.append(pI.line(ib, c=GLD, lw=2.2))
    o.append(T(pI.X(8.8), pI.Y(14.2), "(a) 15 mA をそのまま出す", "start", 9.5, ALI, True, halo=True))
    o.append(T(pI.X(14), pI.Y(4.4), "(b) 最大 3.9 mA のゆるやかな山", "start", 9.5, GLD, True, halo=True))
    pV = Plot(330, 168, 346, 112, (0, 40), (1.0, 3.0))
    o.append(T(290, 156, "端子電圧", "start", 10.5, INK, True))
    o.append(pV.axes(xt=[0, 10, 20, 30, 40], yt=[1.0, 1.5, 2.0, 2.5, 3.0], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(pV.x - 34, pV.y + pV.h / 2, "V", "middle", 9.5, MUT, rot=-90))
    o.append(T(pV.x + pV.w, pV.y + pV.h + 28, "時間 [ms]", "end", 9.5, MUT))
    o.append(pV.line([(0, 2.2), (40, 2.2)], c=ALI, lw=1.1, dash="3 3"))
    o.append(T(pV.X(39.5), pV.Y(2.2) + 12, "最低の電圧 2.2 V（例）", "end", 9, ALI, halo=True))
    o.append(pV.line([(0, 2.8), (5, 2.8), (5, 1.3), (8, 1.3), (8, 2.8), (40, 2.8)], c=ALI, lw=1.6, dash="5 3"))
    vv = [(k * 0.1, _f04_v(k * 1e-4, E, Rin, C, Re, ps)) for k in range(0, 401)]
    o.append(pV.line(vv, c=GLD, lw=2.2))
    o.append(T(pV.X(8.8), pV.Y(1.3) + 4, "(a) コンデンサなし: 1.3 V", "start", 9.5, ALI, True, halo=True))
    o.append(T(pV.X(13), pV.Y(2.48) + 4, "(b) 100 µF: 最低 2.41 V", "start", 9.5, GLD, True, halo=True))
    return SVG(700, 312, o, "大容量コンデンサがパルスを受け持つ（例の値: 起電力 2.8 V・内部抵抗 100 Ω の電池、送信 15 mA を 3 ms）。破線 (a) はコンデンサが無い場合で、電池が 15 mA をそのまま出し、端子電圧は 1.3 V まで落ちる。実線 (b) は 100 µF のコンデンサがある場合で、電池の電流は最大 3.9 mA のゆるやかな山になり、端子電圧は 2.41 V までしか下がらない。山の面積（電荷）は (a) と同じ 45 µC である。")
F["e04_bulk"] = _f04_bulk()

def _f04_dv():
    o = []
    E, Rin, C, Re, I = _F04_E, _F04_RIN, _F04_C, _F04_RE, 15e-3
    tau = C * (Rin + Re)
    # (a) パルスの間
    o.append(T(14, 20, "(a) パルスの間の低下（0〜3 ms）", "start", 11, INK, True))
    p = Plot(70, 40, 250, 180, (0, 3), (0, 0.6))
    o.append(p.axes(xt=[0, 1, 2, 3], yt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(p.x - 40, p.y + p.h / 2, "低下 ΔV [V]", "middle", 9.5, MUT, rot=-90))
    o.append(T(p.x + p.w, p.y + p.h + 28, "パルスの始まりからの時間 [ms]", "end", 9.5, MUT))
    for CC, c, lab, dy in ((100e-6, SIG, "100 µF", 0), (330e-6, TEA, "330 µF", 0)):
        bnd = [(0, I * Re), (3, I * 3e-3 / CC + I * Re)]
        o.append(p.line([(0, 0)] + bnd, c=c, lw=1.4, dash="5 3"))
        ex = [(k * 0.03, I * _f04_r(k * 3e-5, Rin, CC, Re)) for k in range(0, 101)]
        o.append(p.line(ex, c=c, lw=2.2))
    o.append(T(p.X(2.95), p.Y(0.4575) - 7, "上限 0.458 V", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(2.95), p.Y(0.3926) + 15, "回路の式の解 0.393 V", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(2.95), p.Y(0.144) - 7, "330 µF の上限 0.144 V", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(2.95), p.Y(0.1365) + 15, "解 0.137 V", "end", 9.5, TEA, True, halo=True))
    o.append(_f04_m(p.X(0.12), p.Y(0.56), [("傾き ", None, False), ("I", None, True), ("/", None, False), ("C", None, True), (" = 0.15 V/ms（100 µF）", None, False)], "start", 9.5, SIG))
    o.append(_f04_m(p.X(0.12), p.Y(0.505), [("段差 ", None, False), ("I R", "ESR", True), (" = 7.5 mV", None, False)], "start", 9.5, MUT))
    # (b) パルスの後
    o.append(T(370, 20, "(b) パルスの後の再充電", "start", 11, INK, True))
    q = Plot(420, 40, 260, 180, (0, 60), (0, 0.45))
    o.append(q.axes(xt=[0, 10, 20, 30, 40, 50, 60], yt=[0, 0.1, 0.2, 0.3, 0.4], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(q.x - 40, q.y + q.h / 2, "不足分 u [V]", "middle", 9.5, MUT, rot=-90))
    o.append(T(q.x + q.w, q.y + q.h + 28, "パルスの終わりからの時間 [ms]", "end", 9.5, MUT))
    u0 = I * _f04_r(3e-3, Rin, C, Re) - I * (Rin * Re / (Rin + Re))
    o.append(q.line([(k * 0.3, u0 * math.exp(-k * 0.3e-3 / tau)) for k in range(0, 201)], c=SIG, lw=2.2))
    for k, lab in ((1, "τ = 10 ms: 37 %"), (3, "3τ: 5 %"), (5, "5τ: 0.7 %")):
        tt = k * tau * 1e3
        uu = u0 * math.exp(-k)
        o.append(W(q.X(tt), q.Y(0), q.X(tt), q.Y(uu), c=FNT, lw=1, dash="3 3"))
        o.append(D(q.X(tt), q.Y(uu), SIG, 3.4))
        o.append(T(q.X(tt) + 5, q.Y(uu) - 8 - (14 if k == 5 else 0), lab, "start", 9.5, SIG, True, halo=True))
    o.append(_f04_m(q.X(12), q.Y(0.40), [("u", None, True), (" = ", None, False), ("u", None, True), ("(0) e", None, False)], "start", 10, INK))
    o.append(_f04_m(q.X(12) + 70, q.Y(0.40) - 5, [("−t/τ", None, True)], "start", 8.5, INK))
    o.append(_f04_m(q.X(12), q.Y(0.345), [("τ = (", None, False), ("R", "in", True), (" + ", None, False), ("R", "ESR", True), (") ", None, False), ("C", None, True)], "start", 10, INK))
    return SVG(700, 262, o, "(a) パルスの間の端子電圧の低下（例の値: 15 mA、内部抵抗 100 Ω、ESR 0.5 Ω）。破線は、電流をすべてコンデンサが出すとした上限 I t/C + I R_ESR（ESR の段差 7.5 mV は細くて見えない）、実線は電池の電流も含めて回路の式を解いた値。容量が大きく、パルスが時定数 τ より短いほど、2 つは近い。(b) パルスの後、電圧の不足分は時定数 τ = 10 ms で減り、5τ（50 ms）で 0.7 % になる。")
F["e04_dv"] = _f04_dv()

# ---- 2 節: 動作の並べ方 ----
def _f04_order():
    o = []
    E, Rin, C, Re = _F04_E, _F04_RIN, _F04_C, _F04_RE
    led = (2e-3, 20e-3, 5e-3)
    cases = [("(a) LED の途中で送信", (19e-3, 3e-3, 15e-3), "1.98 V でリセット", ALI),
             ("(b) LED を消した直後に送信", (22e-3, 3e-3, 15e-3), "2.09 V でリセット", ALI),
             ("(c) LED を消して 25 ms 後に送信", (47e-3, 3e-3, 15e-3), "最低 2.37 V（LED のとき）", GRN)]
    y0, rh = 18, 128
    for k, (title, tx, res, rc) in enumerate(cases):
        y = y0 + k * rh
        o.append(T(14, y + 14, title, "start", 10.5, INK, True))
        o.append(T(14, y + 32, res, "start", 10, rc, True))
        p = Plot(240, y + 34, 430, 70, (0, 60), (1.8, 2.9))
        # 動作の帯
        for (s, L, I), c, nm in ((led, PUR, "LED 5 mA"), (tx, GLD, "送信 15 mA")):
            xa, xb = p.X(s * 1e3), p.X((s + L) * 1e3)
            yy = y + 6 if c == PUR else y + 20
            o.append(RECT(xa, yy, xb - xa, 11, 2, soft(c), c, 1.0))
            if c == PUR:
                o.append(T((xa + xb) / 2, yy + 9, nm, "middle", 8.5, c, True))
            else:
                o.append(T(xb + 4, yy + 9, nm, "start", 8.5, c, True))
        o.append(p.axes(xt=[0, 10, 20, 30, 40, 50, 60], yt=[2.0, 2.4, 2.8], xfmt=(lambda v: "%d" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: "%.1f" % v, grid=True))
        o.append(p.line([(0, 2.2), (60, 2.2)], c=ALI, lw=1.1, dash="3 3"))
        o.append(p.line([(0, 2.3), (60, 2.3)], c=GRN, lw=1.0, dash="2 3"))
        pts = []
        for i in range(0, 601):
            t = i * 1e-4
            pts.append((t * 1e3, max(1.8, _f04_v(t, E, Rin, C, Re, [led, tx]))))
        o.append(p.line(pts, c=SIG, lw=2.0))
        vmin = min(v for _, v in pts)
        tmin = [t for t, v in pts if v == vmin][0]
        o.append(D(p.X(tmin), p.Y(vmin), rc, 3.6))
        o.append(T(p.x - 34, p.y + p.h / 2, "V", "middle", 9, MUT, rot=-90))
    yb = y0 + 3 * rh
    o.append(T(670, yb + 10, "時間 [ms]", "end", 9.5, MUT))
    o.append(LEGEND(14, yb + 30, [(SIG, "端子電圧"), (ALI, "最低の電圧 2.2 V（下回るとリセット）"), (GRN, "守りたい 2.3 V")]))
    return SVG(700, yb + 40, o, "LED（5 mA・20 ms）と送信（15 mA・3 ms）の並べ方と端子電圧（例の値: 起電力 2.8 V・内部抵抗 100 Ω の電池と 100 µF・ESR 0.5 Ω のコンデンサ、τ = 10 ms）。流れる電荷はどれも同じだが、(a) 重ねると 2 つの低下が足され、(b) 続けるとコンデンサが回復しきらないうちに次の低下が加わる。(c) 間を 25 ms 空けると、送信の間の最低は 2.38 V で、2.3 V を守れる。")
F["e04_order"] = _f04_order()
