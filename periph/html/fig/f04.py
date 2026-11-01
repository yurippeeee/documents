# -*- coding: utf-8 -*-
# 04 章 電池で動かす制御 の図

# ---- 補助: 記号・回路の部品 ----
def _f04_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か[, 上付き]), ...]。例 [("R", "in", True)]、[("e", None, False, "−t/τ")]。"""
    w = 0.0
    for q in parts:
        s_, sub, it = q[0], q[1], q[2]
        sup = q[3] if len(q) > 3 else None
        w += tw(s_, sz) + (tw(sub, sz * 0.72) if sub else 0) + (tw(sup, sz * 0.72) if sup else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82 - 3, x0 + w, y + sz * 0.22 + 2, "".join(q[0] + (q[1] or "") for q in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s">'
         % (round(x0, 2), y, sz, c, "700" if b else "400")]
    for q in parts:
        s_, sub, it = q[0], q[1], q[2]
        sup = q[3] if len(q) > 3 else None
        o.append('<tspan font-style="%s">%s</tspan>' % ("italic" if it else "normal", E(s_)))
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan><tspan dy="-3"></tspan>' % (sz * 0.72, E(sub)))
        if sup:
            o.append('<tspan dy="-5" font-size="%g" font-style="italic">%s</tspan><tspan dy="5"></tspan>' % (sz * 0.72, E(sup)))
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
    o.append(T(xl + 8, 212, "負荷", "start", 10, PUR, True))
    o.append(T(xl + 8, 225, "送信", "start", 9.5, PUR))
    o.append(T(xl + 8, 238, "15 mA", "start", 9.5, PUR))
    o.append(T(xl + 8, 251, "3 ms", "start", 9.5, PUR))
    # 電流の矢印
    o.append(ARR(130, yt - 12, 152, yt - 12, c=GLD, lw=1.6, head=6))
    o.append(T(156, yt - 8, "電池の電流", "start", 9.5, GLD, True))
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
    o.append(T(pV.x - 30, pV.y + pV.h / 2 + 4, "V", "middle", 9.5, MUT))
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
    o.append(_f04_m(q.X(12), q.Y(0.40), [("u", None, True), (" = ", None, False), ("u", None, True), ("(0) e", None, False, "−t/τ")], "start", 10, INK))
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
        o.append(T(p.x - 30, p.y + p.h / 2 + 4, "V", "middle", 9.5, MUT))
    yb = y0 + 3 * rh
    o.append(T(670, yb + 10, "時間 [ms]", "end", 9.5, MUT))
    o.append(LEGEND(14, yb + 30, [(SIG, "端子電圧"), (ALI, "最低の電圧 2.2 V（下回るとリセット）"), (GRN, "守りたい 2.3 V")]))
    return SVG(700, yb + 40, o, "LED（5 mA・20 ms）と送信（15 mA・3 ms）の並べ方と端子電圧（例の値: 起電力 2.8 V・内部抵抗 100 Ω の電池と 100 µF・ESR 0.5 Ω のコンデンサ、τ = 10 ms）。流れる電荷はどれも同じだが、(a) 重ねると 2 つの低下が足され、(b) 続けるとコンデンサが回復しきらないうちに次の低下が加わる。(c) 間を 25 ms 空けると、送信の間の最低は 2.38 V で、2.3 V を守れる。")
F["e04_order"] = _f04_order()

# ---- 3 節: 例の模型（コイン形リチウム電池に似せた例。実際の電池の値ではない） ----
import random as _f04_random
def _f04_ocv(s):
    """使った割合 s での、電流を流していないときの電圧 [V]。"""
    x = max(0.0, (s - 0.75) / 0.25)
    return 3.05 - 0.15 * s - 0.75 * x ** 2.5
def _f04_rin(s, T):
    """内部抵抗 [Ω]。使い終わりに近いほど、温度 T [°C] が低いほど大きい。"""
    return (15.0 * (1 + 1.2 * s * s) + 400.0 * max(0.0, s - 0.85) ** 2) * math.exp(0.035 * (25.0 - T))
def _f04_vop(s, T):
    """送信（15 mA・3 ms）の直後の端子電圧（100 µF・ESR 0.5 Ω のコンデンサあり）。"""
    return _f04_ocv(s) - _f04_drop(15e-3, 3e-3, _f04_rin(s, T), _F04_C, _F04_RE)
_F04_LIFE_D = 0.220 * 3600 / 3e-6 / 86400        # 平均 3 µA で 220 mAh を使い切る日数（約 3056 日）

def _f04_trap():
    o = []
    Y = _F04_LIFE_D / 365.0
    p = Plot(70, 30, 600, 230, (6.0, 8.5), (1.8, 3.1))
    o.append(p.axes(xt=[6.0, 6.5, 7.0, 7.5, 8.0, 8.5], yt=[1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0], xfmt=lambda v: "%g 年" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(p.x - 42, p.y + p.h / 2, "端子電圧 [V]", "middle", 9.5, MUT, rot=-90))
    o.append(T(p.x + p.w, p.y + p.h + 30, "電池を入れてからの年数（平均 3 µA、使い切るまで約 8.4 年）", "end", 9.5, MUT))
    # リセットを繰り返す期間
    def find(f, target):
        lo, hi = 0.5, 1.1
        for _ in range(60):
            m = (lo + hi) / 2
            if f(m) > target: lo = m
            else: hi = m
        return lo
    s1 = find(lambda s: _f04_vop(s, 0), 2.2)
    s2 = find(lambda s: _f04_ocv(s), 2.45)
    o.append(RECT(p.X(s1 * Y), p.y, p.X(s2 * Y) - p.X(s1 * Y), p.h, 0, ASOFT, "none", 0))
    o.append(p.line([(6.0, 2.2), (8.5, 2.2)], c=ALI, lw=1.2, dash="5 3"))
    o.append(p.line([(6.0, 2.45), (8.5, 2.45)], c=MUT, lw=1.1, dash="2 3"))
    def curve(f):
        return [(6.0 + k * 0.01, max(1.8, f((6.0 + k * 0.01) / Y))) for k in range(0, 251)]
    o.append(p.line(curve(_f04_ocv), c=GLD, lw=2.2))
    o.append(p.line(curve(lambda s: _f04_vop(s, 25)), c=SIG, lw=2.0))
    o.append(p.line(curve(lambda s: _f04_vop(s, 0)), c=TEA, lw=2.0))
    o.append(T(p.X(6.05), p.Y(_f04_ocv(6.05 / Y)) - 8, "休んでいるとき（起電力）", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(6.05), p.Y(_f04_vop(6.05 / Y, 25)) - 8, "送信の直後（25 °C）", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(6.05), p.Y(_f04_vop(6.05 / Y, 0)) + 16, "送信の直後（0 °C）", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(6.05), p.Y(2.2) + 14, "最低の電圧 2.2 V", "start", 9.5, ALI, halo=True))
    o.append(T(p.X(6.05), p.Y(2.45) + 14, "休んでいるときの電圧で止めるしきい値 2.45 V（悪い例）", "start", 9.5, MUT, halo=True))
    x1, x2 = p.X(s1 * Y), p.X(s2 * Y)
    o.append(D(x1, p.Y(2.2), TEA, 4) + D(x1, p.Y(_f04_ocv(s1)), GLD, 4))
    o.append(W(x1, p.Y(2.2), x1, p.Y(_f04_ocv(s1)), c=FNT, lw=1, dash="3 3"))
    o.append(T(x1 - 6, p.Y(_f04_ocv(s1)) - 10, "まだ %.2f V" % _f04_ocv(s1), "end", 9.5, GLD, True, halo=True))
    o.append(D(x2, p.Y(2.45), MUT, 4))
    o.append(T((x1 + x2) / 2, p.y + 14, "リセットを", "middle", 9.5, ALI, True, halo=True))
    o.append(T((x1 + x2) / 2, p.y + 27, "繰り返す", "middle", 9.5, ALI, True, halo=True))
    o.append(T((x1 + x2) / 2, p.y + 40, "約 %.0f 日" % ((s2 - s1) * _F04_LIFE_D), "middle", 9.5, ALI, True, halo=True))
    return SVG(700, 300, o, "例の模型で計算した、使い終わりの近くの端子電圧（6 年より前はほとんど平ら）。休んでいるときの電圧はなかなか下がらないが、送信の直後の電圧は内部抵抗の分だけ低く、寒いほど低い。0 °C の送信の直後の電圧が 2.2 V を割ってから、休んでいるときの電圧が 2.45 V を割るまでの間、寒い時間に送信するたびにリセットする。")
F["e04_trap"] = _f04_trap()

def _f04_hyst():
    o = []
    rnd = _f04_random.Random(7)
    d0, d1 = 2560, 2720
    hours = []
    for h in range(d0 * 24, d1 * 24):
        s = h / 24.0 / _F04_LIFE_D
        T_ = 5.0 + 7.0 * math.sin(2 * math.pi * ((h % 24) - 9) / 24.0)
        hours.append((h / 24.0, _f04_vop(s, T_) + rnd.gauss(0, 0.010)))
    p = Plot(70, 30, 600, 170, (d0, d1), (2.30, 2.70))
    o.append(p.axes(xt=list(range(d0, d1 + 1, 20)), yt=[2.3, 2.4, 2.5, 2.6, 2.7], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(p.x - 42, p.y + p.h / 2, "送信の直後 [V]", "middle", 9.5, MUT, rot=-90))
    # 1 日ごとの最小と最大の帯
    days = {}
    for t, v in hours:
        k = int(t)
        a = days.setdefault(k, [9, 0])
        a[0] = min(a[0], v); a[1] = max(a[1], v)
    ks = sorted(days)
    top = [(k + 0.5, days[k][1]) for k in ks]
    bot = [(k + 0.5, days[k][0]) for k in reversed(ks)]
    o.append(PL([(p.X(a), p.Y(b)) for a, b in top + bot], c=SIG, lw=0.8, fill=SSOFT))
    for v, c, lab in ((2.60, GRN, "LOW から戻る 2.60 V"), (2.45, GLD, "LOW に入る 2.45 V")):
        o.append(p.line([(d0, v), (d1, v)], c=c, lw=1.3, dash="5 3"))
        o.append(T(p.X(d1) - 4, p.Y(v) - 5, lab, "end", 9.5, c, True, halo=True))
    o.append(T(p.X(d0) + 6, p.Y(2.68), "測った電圧の 1 日の最小〜最大（気温 −2〜12 °C、誤差 10 mV）", "start", 9.5, SIG, halo=True))
    # 判定の帯
    def states(exit_v, N):
        st, n_low, n_ok, out = 0, 0, 0, []
        for t, v in hours:
            n_low = n_low + 1 if v < 2.45 else 0
            n_ok = n_ok + 1 if v >= exit_v else 0
            if st == 0 and n_low >= N: st = 1
            elif st == 1 and n_ok >= N: st = 0
            out.append((t, st))
        return out
    rows = [("(a) しきい値 1 つ（2.45 V）", states(2.45, 1)), ("(b) ヒステリシス（2.45 V で入り 2.60 V を超えて戻る）・3 回続けて", states(2.6001, 3))]
    for i, (lab, ss) in enumerate(rows):
        yy = p.y + p.h + 52 + i * 38
        seg0, cur = ss[0][0], ss[0][1]
        nchg = 0
        for t, stt in ss[1:] + [(d1, None)]:
            if stt != cur:
                c = GRN if cur == 0 else GLD
                o.append(RECT(p.X(seg0), yy, max(0.6, p.X(t) - p.X(seg0)), 16, 0, soft(c), c, 0.6))
                if stt is not None:
                    nchg += 1
                seg0, cur = t, stt
        o.append(T(p.x, yy - 5, lab + ": 状態の変化 %d 回" % nchg, "start", 9.5, ALI if nchg > 5 else INK, True))
    yl = p.y + p.h + 52 + 2 * 38 + 6
    o.append(T(p.X(d1), p.y + p.h + 30, "電池を入れてからの日数", "end", 9.5, MUT))
    o.append(LEGEND(p.x, yl, [(GRN, "OK"), (GLD, "LOW（電池が少ない）")]))
    return SVG(700, yl + 10, o, "使い終わりが近づいた 160 日間の、送信の直後の電圧と判定（例の模型）。電圧は 1 日に約 1.3 mV ずつ下がるが、気温で 1 日に約 0.04 V 上下する。(a) しきい値 1 つでは、寒い夜に LOW、暖かい昼に OK と、何十日も入れ替わる。(b) 2.45 V で LOW に入り、2.60 V を超えるまで戻らないようにし、3 回続いたときだけ変えると、変化は 1 回になる。")
F["e04_hyst"] = _f04_hyst()

def _f04_stop():
    o = []
    # 左: しきい値の積み上げ
    p = Plot(70, 24, 60, 210, (0, 1), (2.1, 2.7))
    o.append(W(p.x, p.y, p.x, p.y + p.h, c=MUT, lw=1.2))
    for v in (2.2, 2.3, 2.4, 2.5, 2.6, 2.7):
        o.append(W(p.x - 4, p.Y(v), p.x, p.Y(v), c=MUT, lw=1) + T(p.x - 7, p.Y(v) + 3.5, "%.1f" % v, "end", 9.5, MUT))
    o.append(T(p.x - 42, p.y + p.h / 2, "送信の直後の電圧 [V]", "middle", 9.5, MUT, rot=-90))
    lv = [(2.60, GRN, "LOW から戻る 2.60 V"), (2.45, GLD, "LOW に入る 2.45 V"), (2.35, ALI, "CRIT に入る 2.35 V"), (2.20, ALI, "最低の電圧 2.2 V")]
    for v, c, lab in lv:
        o.append(W(p.x, p.Y(v), p.x + 90, p.Y(v), c=c, lw=1.6, dash=None if v != 2.20 else "5 3"))
        o.append(T(p.x + 96, p.Y(v) + 4, lab, "start", 9.5, c, True))
    o.append(DIM(p.x + 30, p.Y(2.60), p.x + 30, p.Y(2.45), None, c=GLD))
    o.append(T(p.x + 38, p.Y(2.525) + 4, "幅 0.15 V", "start", 9, GLD))
    o.append(DIM(p.x + 30, p.Y(2.35), p.x + 30, p.Y(2.20), None, c=ALI))
    o.append(T(p.x + 38, p.Y(2.275) + 4, "余裕 0.15 V", "start", 9, ALI))
    o.append(T(14, 262, "幅: 昼夜の上下（0.04 V）と誤差より大きく。", "start", 9, MUT))
    o.append(T(14, 276, "余裕: 誤差と、後始末の間の低下の分。", "start", 9, MUT))
    # 右: 状態
    xo, xl, xc, ys = 360, 495, 630, 112
    o.append(STATE(xo, ys, 92, 40, "OK", GRN))
    o.append(STATE(xl, ys, 92, 40, "LOW", GLD))
    o.append(STATE(xc, ys, 92, 40, "CRIT", ALI))
    o.append(EDGE(xo + 47, ys - 8, xl - 47, ys - 8, None, 0, GLD))
    o.append(T((xo + xl) / 2, ys - 36, "2.45 V 未満が", "middle", 9.5, GLD))
    o.append(T((xo + xl) / 2, ys - 23, "3 回続く", "middle", 9.5, GLD))
    o.append(EDGE(xl - 47, ys + 10, xo + 47, ys + 10, None, 0, GRN))
    o.append(T((xo + xl) / 2, ys + 32, "2.60 V 超えが", "middle", 9.5, GRN))
    o.append(T((xo + xl) / 2, ys + 45, "3 回続く", "middle", 9.5, GRN))
    o.append(EDGE(xl + 47, ys, xc - 47, ys, None, 0, ALI))
    o.append(T((xl + xc) / 2, ys - 49, "2.35 V 未満が", "middle", 9.5, ALI))
    o.append(T((xl + xc) / 2, ys - 36, "3 回続く", "middle", 9.5, ALI))
    o.append(T((xl + xc) / 2, ys - 23, "（OK からも）", "middle", 9.5, ALI))
    acts = [(xo, GRN, ["ふだんどおり"]), (xl, GLD, ["利用者に知らせる", "LED などを止める", "送る間隔を延ばす"]),
            (xc, ALI, ["記録を 1 回書く", "最後の知らせを送る", "最も深く眠る"])]
    for x, c, lines in acts:
        for i, l in enumerate(lines):
            o.append(T(x, ys + 72 + i * 15, l, "middle", 9.5, c))
    yb = ys + 128
    o.append(W(xc + 46, ys, 690, ys, 690, yb, 318, yb, 318, ys, c=GRN, lw=1.3, dash="4 3"))
    o.append(ARR(318, ys, xo - 47, ys, c=GRN, lw=1.3, head=6))
    o.append(T(504, yb + 16, "電池を替えたときだけ戻る（起動したとき、", "middle", 9.5, GRN))
    o.append(T(504, yb + 30, "休んでいるときの電圧が 2.9 V を超えたとき）", "middle", 9.5, GRN))
    return SVG(700, 292, o, "低電池の判定の 3 つの状態（値は例）。左: しきい値は、最低の電圧 2.2 V に余裕を足して CRIT に入る値を決め、その上に LOW に入る値と、ヒステリシスの幅を足した戻る値を置く。右: 各状態ですること。CRIT からは、電池を替えたことが分かるまで戻らない。")
F["e04_stop"] = _f04_stop()

# ---- 4 節: 残量の推定 ----
_F04_LI = [(0, 3.30), (5, 3.45), (10, 3.55), (20, 3.62), (30, 3.67), (40, 3.71), (50, 3.76), (60, 3.82), (70, 3.89), (80, 3.96), (90, 4.05), (100, 4.18)]
def _f04_li_ocv(p):
    """例のリチウムイオン電池の、残量 p [%] での起電力 [V]（例の表）。"""
    for (a, va), (b, vb) in zip(_F04_LI, _F04_LI[1:]):
        if a <= p <= b:
            return va + (vb - va) * (p - a) / (b - a)
    return _F04_LI[-1][1] if p > 100 else _F04_LI[0][1]
def _f04_li_soc(v):
    for (a, va), (b, vb) in zip(_F04_LI, _F04_LI[1:]):
        if va <= v <= vb:
            return a + (b - a) * (v - va) / (vb - va)
    return 100.0 if v > _F04_LI[-1][1] else 0.0
def _f04_coin_soc(v):
    """コイン形の例の模型で、休んでいるときの電圧 v から読む残量 [%]（220 mAh に対して）。"""
    lo, hi = 0.0, 1.1
    for _ in range(60):
        m = (lo + hi) / 2
        if _f04_ocv(m) > v: lo = m
        else: hi = m
    return max(0.0, 100.0 - lo * 100.0)

def _f04_ocvfig():
    o = []
    # (a) リチウムイオン電池
    o.append(T(14, 18, "(a) リチウムイオン電池（例の表）", "start", 11, INK, True))
    p = Plot(70, 34, 250, 190, (0, 100), (3.2, 4.3))
    o.append(p.axes(xt=[0, 20, 40, 60, 80, 100], yt=[3.2, 3.4, 3.6, 3.8, 4.0, 4.2], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(p.x - 40, p.y + p.h / 2, "起電力 [V]", "middle", 9.5, MUT, rot=-90))
    o.append(T(p.x + p.w, p.y + p.h + 28, "残量 [%]", "end", 9.5, MUT))
    o.append(p.line([(q, _f04_li_ocv(q)) for q in range(0, 101)], c=GLD, lw=2.2))
    v50 = _f04_li_ocv(50)
    pa, pb = _f04_li_soc(v50 - 0.015), _f04_li_soc(v50 + 0.015)
    o.append(RECT(p.X(pa), p.y, p.X(pb) - p.X(pa), p.h, 0, SSOFT, "none", 0))
    o.append(RECT(p.x, p.Y(v50 + 0.015), p.w, p.Y(v50 - 0.015) - p.Y(v50 + 0.015), 0, SSOFT, "none", 0))
    o.append(T(p.X(52), p.Y(3.25) + 0, "±15 mV → ±%.1f %%" % ((pb - pa) / 2), "start", 9.5, SIG, True, halo=True))
    vl = v50 - 1.0 * 0.10
    pl = _f04_li_soc(vl)
    o.append(D(p.X(50), p.Y(vl), ALI, 3.6))
    o.append(ARR(p.X(50) - 4, p.Y(vl), p.X(pl) + 4, p.Y(vl), c=ALI, lw=1.3, head=6))
    o.append(W(p.X(pl), p.Y(vl), p.X(pl), p.Y(3.2), c=ALI, lw=1, dash="3 3"))
    o.append(T(p.X(pl) + 4, p.Y(vl) - 26, "1 A を流しながら測ると", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(pl) + 4, p.Y(vl) - 13, "%.2f V → %.0f %% と読む" % (vl, pl), "start", 9.5, ALI, True, halo=True))
    # (b) コイン形
    o.append(T(372, 18, "(b) コイン形（3 節の例の模型）", "start", 11, INK, True))
    q = Plot(430, 34, 250, 190, (0, 100), (2.2, 3.1))
    o.append(q.axes(xt=[0, 20, 40, 60, 80, 100], yt=[2.2, 2.4, 2.6, 2.8, 3.0], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(q.x - 40, q.y + q.h / 2, "電圧 [V]", "middle", 9.5, MUT, rot=-90))
    o.append(T(q.x + q.w, q.y + q.h + 28, "残量 [%]（220 mAh に対して）", "end", 9.5, MUT))
    o.append(q.line([(r, max(2.2, _f04_ocv(1 - r / 100.0))) for r in range(0, 101)], c=GLD, lw=2.2))
    o.append(q.line([(r, max(2.2, _f04_vop(1 - r / 100.0, 0))) for r in range(0, 101)], c=TEA, lw=1.8, dash="5 3"))
    vb = _f04_ocv(0.5)
    ra, rb = _f04_coin_soc(vb + 0.015), _f04_coin_soc(vb - 0.015)
    o.append(RECT(q.X(min(ra, rb)), q.y, abs(q.X(rb) - q.X(ra)), q.h, 0, SSOFT, "none", 0))
    o.append(RECT(q.x, q.Y(vb + 0.015), q.w, q.Y(vb - 0.015) - q.Y(vb + 0.015), 0, SSOFT, "none", 0))
    o.append(T(q.X(36), q.Y(2.26), "±15 mV → ±%.0f %%" % (abs(rb - ra) / 2), "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(72), q.Y(3.065), "休んでいるとき", "middle", 9.5, GLD, True, halo=True))
    vt = _f04_vop(0.3, 0)
    rt = _f04_coin_soc(vt)
    o.append(D(q.X(70), q.Y(vt), ALI, 3.6))
    o.append(ARR(q.X(70) - 4, q.Y(vt), q.X(rt) + 4, q.Y(vt), c=ALI, lw=1.3, head=6))
    o.append(T(q.X(98), q.Y(vt) + 16, "送信の直後（0 °C）", "end", 9.5, TEA, True, halo=True))
    o.append(T(q.X(rt) + 2, q.Y(vt) - 22, "本当は 70 % でも", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(rt) + 2, q.Y(vt) - 9, "%.0f %% と読む" % rt, "start", 9.5, ALI, True, halo=True))
    return SVG(700, 266, o, "電圧から残量を推定するときの誤差（例の値）。青の帯は、電圧の誤差 ±15 mV が残量の誤差になる幅で、放電曲線が平らな (b) では (a) の約 4 倍になる。電流を流しながら測ると、電圧は内部抵抗の分だけ低いので、休んでいるときの表で引くと少なく読める。")
F["e04_ocv"] = _f04_ocvfig()

def _f04_cc():
    o = []
    # (a) 二次電池: 毎日 100 mAh、測った電流は 2 % 小さく、0.5 mA 小さい（数える電荷が少ない）
    o.append(T(14, 18, "(a) 二次電池（1000 mAh）: 数えた残量のずれ", "start", 11, INK, True))
    p = Plot(70, 34, 250, 190, (0, 10), (0, 100))
    o.append(p.axes(xt=[0, 2, 4, 6, 8, 10], yt=[0, 20, 40, 60, 80, 100], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(T(p.x - 40, p.y + p.h / 2, "残量 [%]", "middle", 9.5, MUT, rot=-90))
    o.append(T(p.x + p.w, p.y + p.h + 28, "時間 [日]（1 日に 100 mAh を使う）", "end", 9.5, MUT))
    true = lambda t: 100 - 10 * t
    cnt = lambda t: 100 - (0.98 * 100 * t - 0.5 * 24 * t) / 10.0   # 数えた残量
    o.append(p.line([(0, 100), (10, 0)], c=INK, lw=1.6))
    o.append(p.line([(t / 10.0, cnt(t / 10.0)) for t in range(0, 101)], c=GLD, lw=1.8, dash="5 3"))
    # 5 日目に長く休み、電圧で合わせ直す。8 日目に使い終わりの近くで電圧で合わせ直す
    def fix(t):
        if t < 5: return cnt(t)
        if t < 8.5: return true(5) - (cnt(5) - cnt(t))
        return true(t)
    o.append(p.line([(t / 20.0, fix(t / 20.0)) for t in range(0, 101)], c=SIG, lw=2.2))
    o.append(T(p.X(10), p.Y(95), "破線: 数えただけ。本当は", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(10), p.Y(88), "0 %% のときに %.0f %% と示す" % cnt(10), "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.3), p.Y(12), "本当の残量", "start", 9.5, INK, True, halo=True))
    o.append(D(p.X(5), p.Y(true(5)), SIG, 3.6) + D(p.X(8.5), p.Y(true(8.5)), SIG, 3.6))
    o.append(T(p.X(5) + 6, p.Y(true(5)) - 30, "長く休んだので", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(5) + 6, p.Y(true(5)) - 17, "電圧で合わせ直す", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(8.5) - 6, p.Y(true(8.5)) + 16, "使い終わりの近くで", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(8.5) - 6, p.Y(true(8.5)) + 29, "電圧で合わせ直す", "end", 9.5, SIG, True, halo=True))
    # (b) 一次電池: 数えた電荷が 15 % 少ない
    o.append(T(372, 18, "(b) 一次電池: 低電池の判定で合わせ直す", "start", 11, INK, True))
    q = Plot(430, 34, 250, 190, (100, 0), (0, 100))
    o.append(q.axes(xt=[100, 80, 60, 40, 20, 0], yt=[0, 20, 40, 60, 80, 100], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(T(q.x - 40, q.y + q.h / 2, "示す残量 [%]", "middle", 9.5, MUT, rot=-90))
    o.append(T(q.x + q.w, q.y + q.h + 28, "本当の残量 [%]（右へ使っていく）", "end", 9.5, MUT))
    o.append(q.line([(100, 100), (0, 0)], c=INK, lw=1.4))
    c2 = lambda r: 100 - 0.85 * (100 - r)
    o.append(q.line([(100, 100), (0, c2(0))], c=GLD, lw=1.8, dash="5 3"))
    rl = 4.0
    comb = [(r, c2(r)) for r in range(100, int(rl), -1)] + [(rl, c2(rl)), (rl, 10.0), (0.4, 10.0), (0.4, 0.0), (0, 0)]
    o.append(q.line(comb, c=SIG, lw=2.2))
    o.append(T(q.X(0), q.Y(66), "破線: 数えただけ。", "end", 9.5, GLD, True, halo=True))
    o.append(T(q.X(0), q.Y(59), "%.0f %% と示したまま止まる" % c2(0), "end", 9.5, GLD, True, halo=True))
    o.append(D(q.X(rl), q.Y(c2(rl)), SIG, 3.6))
    o.append(W(q.X(rl) - 4, q.Y(c2(rl)) + 3, q.X(40), q.Y(12), c=SIG, lw=1, dash="2 2"))
    o.append(T(q.X(68), q.Y(17), "LOW になったので", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(68), q.Y(10), "10 % 以下に下げ、", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(68), q.Y(3), "CRIT で 0 %", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(95), q.Y(85), "本当の残量", "start", 9.5, INK, True, halo=True))
    return SVG(700, 266, o, "電荷を数える方法のずれと、電圧による合わせ直し（例の値）。(a) 電流を 2 % と 0.5 mA 少なく測ると、数えた残量は本当より多くなり続ける（破線）。長く休んだときと使い終わりの近くで電圧の表に合わせ直すと（実線）、ずれは 0 に戻る。(b) 一次電池で、動作 1 回の電荷を 15 % 少なく見積もると、0 % のときに 15 % と示す。3 節の判定が LOW になったら示す値を下げれば、残量があると示したまま止まることを防げる。")
F["e04_cc"] = _f04_cc()

# ---- 5 節: 充電 ----
def _f04_chg_sim():
    """CC/CV 充電の簡単な模型（1000 mAh、0.5 A、4.2 V、内部抵抗 0.3 Ω、終了 0.1 A、予備充電 0.1 A）。
    返り値は [(時間 h, 電流 A, 端子電圧 V, 起電力 V, 残量 %, 段)] と、CV の始まり、終わり。"""
    def ocv(p):
        if p < 0:
            return 3.30 + (p / 2.0) * 0.5          # 残量 −2 % で 2.8 V（予備充電の範囲を表すための例）
        return _f04_li_ocv(p)
    p, t, dt = -2.0, 0.0, 1.0 / 3600
    out, cv, end = [], None, None
    while t < 4:
        Eo = ocv(p)
        if Eo < 3.0:
            I, ph = 0.1, "pre"
        elif Eo + 0.5 * 0.3 < 4.2:
            I, ph = 0.5, "cc"
        else:
            I, ph = (4.2 - Eo) / 0.3, "cv"
            if cv is None:
                cv = (t, p, Eo)
            if I <= 0.1:
                end = (t, p)
                break
        out.append((t, I, Eo + I * 0.3, Eo, p, ph))
        p += I * dt / 1.0 * 100
        t += dt
    return out, cv, end

def _f04_cccv():
    o = []
    data, cv, end = _f04_chg_sim()
    tpre = [d[0] for d in data if d[5] == "cc"][0]
    pI = Plot(80, 34, 560, 100, (0, 2.5), (0, 600))
    o.append(T(14, 22, "充電の電流", "start", 10.5, INK, True))
    o.append(pI.axes(xt=[0, 0.5, 1.0, 1.5, 2.0, 2.5], yt=[0, 100, 300, 500], xfmt=lambda v: "", yfmt=lambda v: "%d" % v))
    o.append(T(pI.x - 42, pI.y + pI.h / 2, "mA", "middle", 9.5, MUT, rot=-90))
    pV = Plot(80, 176, 560, 130, (0, 2.5), (2.8, 4.3))
    o.append(T(14, 164, "電池の電圧", "start", 10.5, INK, True))
    o.append(pV.axes(xt=[0, 0.5, 1.0, 1.5, 2.0, 2.5], yt=[2.8, 3.2, 3.6, 4.0, 4.2], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    o.append(T(pV.x - 42, pV.y + pV.h / 2, "V", "middle", 9.5, MUT, rot=-90))
    o.append(T(pV.x + pV.w, pV.y + pV.h + 28, "時間 [時間]", "end", 9.5, MUT))
    # 段の帯
    for a, b, c, lab in ((0, tpre, TEA, "予備充電"), (tpre, cv[0], GLD, "定電流（CC）"), (cv[0], end[0], SIG, "定電圧（CV）")):
        for pp in (pI, pV):
            o.append(RECT(pp.X(a), pp.y, pp.X(b) - pp.X(a), pp.h, 0, soft(c), "none", 0, op=0.5))
        o.append(T((pI.X(a) + pI.X(b)) / 2 if b - a > 0.2 else pI.X(b) + 4, pI.y + 14, lab, "middle" if b - a > 0.2 else "start", 9.5, c, True, halo=True))
    o.append(pI.line([(0, 100), (2.5, 100)], c=ALI, lw=1.1, dash="3 3"))
    o.append(T(pI.X(1.2), pI.Y(100) - 5, "終了電流 100 mA", "middle", 9.5, ALI, halo=True))
    step = max(1, len(data) // 400)
    o.append(pI.line([(d[0], d[1] * 1000) for d in data[::step]] + [(end[0], 100), (end[0], 0), (2.5, 0)], c=GLD, lw=2.2))
    o.append(pV.line([(0, 4.2), (2.5, 4.2)], c=ALI, lw=1.1, dash="3 3"))
    o.append(T(pV.X(0.05), pV.Y(4.2) - 6, "充電電圧 4.2 V", "start", 9.5, ALI, halo=True))
    o.append(pV.line([(d[0], d[2]) for d in data[::step]] + [(end[0], 4.2)], c=GLD, lw=2.2))
    o.append(pV.line([(d[0], d[3]) for d in data[::step]], c=PUR, lw=1.6, dash="5 3"))
    o.append(T(pV.X(0.45), pV.Y(3.42), "起電力 E（破線）", "middle", 9.5, PUR, True, halo=True))
    o.append(_f04_m(pV.X(0.62), pV.Y(3.93), [("端子電圧 ", None, False), ("V", None, True), (" = ", None, False), ("E", None, True), (" + ", None, False), ("I R", "in", True)], "middle", 9.5, GLD, True))
    o.append(D(pV.X(cv[0]), pV.Y(cv[2]), PUR, 3.6))
    o.append(W(pV.X(cv[0]), pV.Y(cv[2]) + 4, pV.X(cv[0]), pV.Y(3.38), c=PUR, lw=1, dash="2 2"))
    o.append(T(pV.X(cv[0]) - 4, pV.Y(3.42), "%.1f 時間: 起電力 %.2f V（残量 %.0f %%）" % (cv[0], cv[2], cv[1]), "end", 9.5, PUR, True, halo=True))
    o.append(T(pV.X(cv[0]) - 4, pV.Y(3.42) + 14, "で定電圧に移る", "end", 9.5, PUR, True, halo=True))
    o.append(D(pI.X(end[0]), pI.Y(100), ALI, 3.6))
    o.append(W(pI.X(end[0]), pI.Y(100), pI.X(end[0]), pI.y + pI.h + 6, c=ALI, lw=1, dash="2 2"))
    o.append(T(pI.X(end[0]) + 4, pI.y + pI.h + 18, "%.1f 時間: 電流が 100 mA まで減り、残量 %.0f %% で終了" % (end[0], end[1]), "end", 9.5, ALI, True, halo=True))
    return SVG(700, 344, o, "CC/CV 充電の例（簡単な模型: 1000 mAh、500 mA、充電電圧 4.2 V、充電の間の内部抵抗 0.3 Ω、終了電流 100 mA）。端子電圧は起電力より I R_in だけ高いので、定電流のまま 4.2 V に達したとき、起電力はまだ 4.05 V である。電圧を 4.2 V に保つと、電流 (4.2 V − E)/R_in は起電力が上がるほど減り、100 mA で終わる。")
F["e04_cccv"] = _f04_cccv()

def _f04_path():
    o = []
    for k, title in enumerate(("(a) パワーパスなし", "(b) パワーパスあり")):
        x0 = 14 + k * 350
        o.append(T(x0, 20, title, "start", 11, INK, True))
        o.append(BOX(x0, 44, 70, 40, "USB", "5 V", GLD, GOSOFT, INK, sz=11, ssz=9.5))
        o.append(ARR(x0 + 72, 64, x0 + 106, 64, c=GLD, lw=1.6))
        o.append(BOX(x0 + 108, 40, 96, 48, "充電器 IC", "パワーパス付き" if k else None, GLD, PAN, INK, sz=11, ssz=9))
        o.append(BOX(x0 + 250, 150, 80, 40, "機器", "150 mA", PUR, PSOFT, INK, sz=11, ssz=9.5))
        o.append(BOX(x0 + 110, 150, 92, 40, "電池", None, GLD, GOSOFT, INK, sz=11))
    # (a)
    x0 = 14
    o.append(W(x0 + 156, 90, x0 + 156, 120, c=GLD, lw=1.6) + D(x0 + 156, 120, INK, 3))
    o.append(ARR(x0 + 156, 120, x0 + 156, 148, c=GLD, lw=1.6))
    o.append(W(x0 + 156, 120, x0 + 290, 120, c=PUR, lw=1.6) + ARR(x0 + 290, 120, x0 + 290, 148, c=PUR, lw=1.6))
    o.append(T(x0 + 162, 108, "充電器が見る電流 = 電池 + 機器", "start", 9.5, ALI, True, halo=True))
    o.append(T(x0 + 150, 140, "電池へ", "end", 9.5, GLD))
    o.append(T(x0, 214, "満充電に近づき電池へ入る電流が 0 になっても、", "start", 9.5, ALI))
    o.append(T(x0, 229, "充電器が見る電流は 150 mA より下がらない。", "start", 9.5, ALI))
    o.append(T(x0, 244, "終了電流 100 mA に届かず、充電が終わらない。", "start", 9.5, ALI, True))
    o.append(T(x0, 259, "空の電池では、予備充電の電流では機器が起動できない。", "start", 9.5, ALI))
    # (b)
    x0 = 364
    o.append(W(x0 + 206, 64, x0 + 290, 64, c=PUR, lw=1.6) + ARR(x0 + 290, 64, x0 + 290, 148, c=PUR, lw=1.6))
    o.append(T(x0 + 296, 104, "入力から", "start", 9.5, PUR))
    o.append(T(x0 + 296, 117, "機器へ", "start", 9.5, PUR))
    o.append(DARR(x0 + 156, 92, x0 + 156, 148, c=GLD, lw=1.6))
    o.append(T(x0 + 162, 116, "充電は電池へだけ", "start", 9.5, GLD, True, halo=True))
    o.append(T(x0 + 162, 130, "（入力が無いと逆向き）", "start", 9, GLD, halo=True))
    o.append(T(x0, 214, "充電器は電池の電流だけを見るので、", "start", 9.5, GRN))
    o.append(T(x0, 229, "100 mA まで減れば終わる。", "start", 9.5, GRN, True))
    o.append(T(x0, 244, "電池が空でも、入力から機器を動かせる。", "start", 9.5, GRN))
    o.append(T(x0, 259, "入力を抜くと、電池から機器へ切り替わる。", "start", 9.5, GRN))
    return SVG(700, 272, o, "パワーパスの有無。(a) 機器を電池に直接つなぐと、充電器 IC が流す電流は、電池へ入る電流と機器の電流の和になり、満充電を見分けられない。(b) パワーパスは、入力から機器へ直接送り、残りで電池を充電する。入力が無くなると、電池から機器へ送るように切り替わる。")
F["e04_path"] = _f04_path()

def _f04_chgsm():
    o = []
    xs = {"none": (110, 60), "chg": (350, 60), "full": (590, 60), "temp": (230, 190), "fault": (470, 190)}
    o.append(STATE(*xs["none"], 120, 42, "入力なし", MUT))
    o.append(STATE(*xs["chg"], 120, 42, "充電中", GLD))
    o.append(STATE(*xs["full"], 120, 42, "満充電", GRN))
    o.append(STATE(*xs["temp"], 140, 42, "温度で一時停止", TEA))
    o.append(STATE(*xs["fault"], 140, 42, "異常で停止", ALI))
    o.append(EDGE(172, 52, 288, 52, None, 0, GLD))
    o.append(T(230, 44, "USB をつないだ", "middle", 9.5, GLD))
    o.append(EDGE(288, 70, 172, 70, None, 0, MUT))
    o.append(T(230, 86, "抜いた", "middle", 9.5, MUT))
    o.append(EDGE(412, 60, 528, 60, None, 0, GRN))
    o.append(T(470, 46, "IC が満充電を", "middle", 9.5, GRN))
    o.append(T(470, 76, "知らせた", "middle", 9.5, GRN))
    o.append(EDGE(320, 82, 252, 168, None, 0, TEA))
    o.append(T(244, 118, "電池の温度が", "end", 9.5, TEA))
    o.append(T(244, 131, "範囲の外", "end", 9.5, TEA))
    o.append(EDGE(272, 168, 340, 82, None, 0, TEA))
    o.append(T(316, 146, "範囲に", "start", 9.5, TEA))
    o.append(T(316, 159, "戻った", "start", 9.5, TEA))
    o.append(EDGE(380, 82, 450, 168, None, 0, ALI))
    o.append(T(430, 112, "予定の 1.5 倍の時間", "start", 9.5, ALI))
    o.append(T(430, 125, "IC が異常を知らせた", "start", 9.5, ALI))
    o.append(T(470, 228, "USB を抜くまで止めたまま。知らせる", "middle", 9.5, ALI))
    o.append(NOTE(14, 252, 672, ["マイコンが見るもの: 充電器 IC の状態（ピン・レジスタ）、電池の温度（サーミスタ）、充電を始めてからの時間。",
                                  "止める方法: 充電器 IC の充電を止める入力。マイコンが止まっても、IC の設定と保護回路で安全に終わるようにしておく。"], c=SIG, sz=9.5)[0])
    return SVG(700, 300, o, "マイコンによる充電の見張り（もう 1 つの見張り）。充電そのものは充電器 IC が行い、マイコンは状態を読み、温度と時間が決めた範囲の外なら IC の充電を止めて知らせる。")
F["e04_chg"] = _f04_chgsm()

# ---- 6 節: 逆接続・過放電・出荷時 ----
def _f04_revpanel(o, x0, kind):
    yt, yb = 64, 150
    xb, xr = x0 + 26, x0 + 168
    titles = {"none": "(a) 保護なし", "diode": "(b) 直列のダイオード", "pmos": "(c) P チャネル MOSFET"}
    o.append(T(x0 + 2, 22, titles[kind], "start", 11, INK, True))
    # 電池（逆に入れた状態は (a) で示す）
    rev = (kind == "none")
    o.append(W(xb, yt, xb, 98, c=INK, lw=1.5) + W(xb, 114, xb, yb, c=INK, lw=1.5))
    if rev:
        o.append(W(xb - 7, 102, xb + 7, 102, c=ALI, lw=3.2) + W(xb - 13, 110, xb + 13, 110, c=ALI, lw=1.8))
        o.append(T(xb - 16, 96, "−", "end", 11, ALI, True) + T(xb - 16, 124, "+", "end", 11, ALI, True))
        o.append(T(xb + 18, 110, "逆に入れた", "start", 9, ALI, True))
    else:
        o.append(_f04_cellv(xb, 106, GLD))
        o.append(T(xb - 16, 98, "+", "end", 11, GLD, True) + T(xb - 16, 124, "−", "end", 11, GLD, True))
    # 回路（負荷）: 中の保護用のダイオード（GND から電源へ向き）
    o.append(RECT(xr, yt - 10, 50, yb - yt + 20, 6, PSOFT, PUR, 1.3))
    o.append(T(xr + 25, yt + 6, "回路", "middle", 9.5, PUR, True))
    o.append(W(xr + 25, yt + 12, xr + 25, 96, c=PUR, lw=1.1) + W(xr + 25, 120, xr + 25, yb - 4, c=PUR, lw=1.1))
    o.append(PL([(xr + 17, 120), (xr + 33, 120), (xr + 25, 108)], c=PUR, lw=1.2, fill=PSOFT) + W(xr + 17, 106, xr + 33, 106, c=PUR, lw=1.6))
    o.append(W(xb, yb, xr, yb, c=INK, lw=1.5))
    if kind == "none":
        o.append(W(xb, yt, xr, yt, c=INK, lw=1.5))
        o.append(PATH("M%g,%g L%g,%g L%g,%g L%g,%g" % (xb + 8, yb - 8, xr + 18, yb - 8, xr + 18, yt + 8, xb + 8, yt + 8), c=ALI, lw=1.6, dash="5 3"))
        o.append(ARR(xr - 30, yb - 8, xr - 10, yb - 8, c=ALI, lw=1.6, head=6))
        o.append(T((xb + xr) / 2 + 6, yt - 8, "大きな電流（数 A のことも）", "middle", 9, ALI, True, halo=True))
    elif kind == "diode":
        xm = (xb + xr) / 2 + 10
        o.append(W(xb, yt, xm - 13, yt, c=INK, lw=1.5) + _f04_diode(xm, yt, INK, 7) + W(xm, yt, xr, yt, c=INK, lw=1.5))
        o.append(_f04_m(xm - 6, yt - 13, [("V", "F", True), (" 0.2〜0.5 V", None, False)], "middle", 9.5, INK))
    else:
        xd, xs_ = x0 + 70, x0 + 124
        o.append(W(xb, yt, xd, yt, c=INK, lw=1.5) + W(xs_, yt, xr, yt, c=INK, lw=1.5))
        # MOSFET（簡略）: 横向きのチャネル、下にゲート
        o.append(W(xd, yt, xd + 10, yt, c=SIG, lw=1.5) + W(xs_ - 10, yt, xs_, yt, c=SIG, lw=1.5))
        o.append(W(xd + 10, yt, xd + 10, yt + 10, c=SIG, lw=1.5) + W(xs_ - 10, yt, xs_ - 10, yt + 10, c=SIG, lw=1.5))
        o.append(W(xd + 6, yt + 10, xs_ - 6, yt + 10, c=SIG, lw=2.2))
        o.append(W(xd + 6, yt + 16, xs_ - 6, yt + 16, c=SIG, lw=1.8))
        xg = (xd + xs_) / 2
        o.append(W(xg, yt + 16, xg, yt + 26, c=SIG, lw=1.5) + _f04_resv(xg, yt + 26, yt + 62, c=INK, h=5, n=5) + W(xg, yt + 62, xg, yb, c=INK, lw=1.5) + D(xg, yb, INK, 2.6))
        o.append(T(xd + 9, yt - 6, "D", "middle", 9.5, SIG, True) + T(xs_ - 9, yt - 6, "S", "middle", 9.5, SIG, True) + T(xg + 8, yt + 24, "G", "start", 9.5, SIG, True))
        # ボディダイオード（D → S）
        o.append(W(xd, yt, xd, yt - 22, c=TEA, lw=1.2) + W(xs_, yt, xs_, yt - 22, c=TEA, lw=1.2))
        o.append(W(xd, yt - 22, xg - 7, yt - 22, c=TEA, lw=1.2) + _f04_diode(xg + 4, yt - 22, TEA, 5) + W(xg + 4, yt - 22, xs_, yt - 22, c=TEA, lw=1.2))
        o.append(T(xg, yt - 32, "ボディダイオード", "middle", 8.5, TEA, True))
    # 結果
    res = {"none": [("正しく: 低下なし", GRN), ("逆: 回路の中のダイオードを通って", ALI), ("大きな電流が流れ、焼ける", ALI)],
           "diode": [None, None, ("逆: 流れない", GRN)],
           "pmos": [("正しく: オン抵抗 × 電流だけ下がる", GRN), ("（50 mΩ・15 mA で 0.75 mV）", GRN), ("逆: ゲートが高い側で入らず、流れない", GRN)]}
    for i, item in enumerate(res[kind]):
        if item is None:
            continue
        l, c = item
        o.append(T(x0 + 2, 186 + i * 15, l, "start", 9.5, c, i != 1 or kind == "none"))
    if kind == "diode":
        o.append(_f04_m(x0 + 2, 186, [("正しく: ", None, False), ("V", "F", True), (" だけ下がり、", None, False), ("V", "F", True), (" × ", None, False), ("I", None, True), (" が熱に", None, False)], "start", 9.5, GLD, True))
        o.append(_f04_m(x0 + 2, 201, [("（終止電圧が ", None, False), ("V", "F", True), (" だけ上がる）", None, False)], "start", 9.5, GLD))

def _f04_rev():
    o = []
    for k, kind in enumerate(("none", "diode", "pmos")):
        _f04_revpanel(o, 10 + k * 232, kind)
    o.append(T(10, 248, "(c) は、ドレイン（D）を電池の側、ソース（S）を回路の側にし、ゲート（G）を抵抗で GND につなぐ。", "start", 9.5, MUT))
    o.append(T(10, 263, "正しく入れると、ボディダイオードを通って S が上がり、G と S の間に電池の電圧がかかって入る。", "start", 9.5, MUT))
    return SVG(700, 274, o, "逆接続保護の比較。(a) 保護が無いと、逆に入れた電池から、回路の中の保護用のダイオードを通って、電池の内部抵抗だけで決まる電流が流れる。(b) 直列のダイオードは逆向きの電流を止めるが、順方向の電圧の分だけ電圧が下がる。(c) P チャネル MOSFET は、正しく入れたときの低下がオン抵抗 × 電流だけで、逆に入れると入らない。")
F["e04_rev"] = _f04_rev()

def _f04_levels():
    o = []
    # 左: リチウムイオン電池の電圧の段（例の値）
    p = Plot(70, 24, 50, 220, (0, 1), (2.2, 4.4))
    o.append(W(p.x, p.y, p.x, p.y + p.h, c=MUT, lw=1.2))
    for v in (2.4, 2.8, 3.2, 3.6, 4.0, 4.4):
        o.append(W(p.x - 4, p.Y(v), p.x, p.Y(v), c=MUT, lw=1) + T(p.x - 7, p.Y(v) + 3.5, "%.1f" % v, "end", 9.5, MUT))
    o.append(T(p.x - 42, p.y + p.h / 2, "電池の電圧 [V]", "middle", 9.5, MUT, rot=-90))
    o.append(RECT(p.x + 1, p.Y(2.5), 140, p.Y(2.2) - p.Y(2.5), 0, ASOFT, "none", 0))
    lv = [(4.2, GLD, "充電電圧 4.2 V（多くの電池）"), (3.6, GLD, "LOW に入る（例 3.6 V）"), (3.4, ALI, "機器が自分で止まる（例 3.4 V）"),
          (2.5, ALI, "保護回路が切り離す（例 2.5 V）")]
    for v, c, lab in lv:
        o.append(W(p.x, p.Y(v), p.x + 60, p.Y(v), c=c, lw=1.6))
        o.append(T(p.x + 66, p.Y(v) + 4, lab, "start", 9.5, c, True))
    o.append(T(p.x + 66, p.Y(2.35) + 4, "過放電の範囲（電池の仕様書の下限より下）", "start", 9.5, ALI))
    o.append(DIM(p.x + 30, p.Y(3.4), p.x + 30, p.Y(2.5), None, c=MUT))
    o.append(T(p.x + 36, p.Y(2.95) + 4, "この間の電荷で保管の間をしのぐ", "start", 9, MUT))
    # 右: 止まった後に尽きるまでの日数
    o.append(T(392, 30, "500 mAh の 5 %（25 mAh）を残して止まった後、", "start", 10, INK, True))
    o.append(T(392, 46, "保護回路が切り離すまでの日数（自己放電を除く）", "start", 10, INK, True))
    rows = [("眠り続ける（20 µA）", 25e-3 / 20e-6 / 24, ALI), ("回路を切り離す（0.1 µA + 保護回路 3 µA）", 25e-3 / 3.1e-6 / 24, GRN)]
    xb, bw, dmax = 392, 260, 400.0
    for i, (lab, d, c) in enumerate(rows):
        y = 70 + i * 54
        o.append(T(xb, y + 10, lab, "start", 9.5, INK))
        o.append(RECT(xb, y + 16, bw * d / dmax, 18, 2, soft(c), c, 1.2))
        o.append(T(xb + bw * d / dmax + 6, y + 30, "%.0f 日" % d, "start", 10, c, True))
    o.append(T(392, 196, "眠ったまま止まると、2 か月足らずで過放電になる。", "start", 9.5, MUT))
    o.append(T(392, 211, "止まるときは、電池から回路を切り離す。", "start", 9.5, MUT))
    return SVG(700, 266, o, "リチウムイオン電池の電圧の段（例の値。実際の値は電池の仕様書と保護回路で確かめる）。機器は、保護回路が切り離す電圧より十分高い電圧で、自分で止まる。止まった後も、眠りの電流・保護回路の電流・自己放電で電荷は減り続ける。")
F["e04_levels"] = _f04_levels()

def _f04_ship():
    o = []
    rows = [("CR2032（220 mAh）の機器を 1 年", None, None, None),
            ("眠りのまま（2 µA）", 2e-6 * 8760 * 1e3, 220, ALI),
            ("出荷モード（50 nA）", 50e-9 * 8760 * 1e3, 220, GRN),
            ("リチウムイオン電池（500 mAh）の機器を 6 か月", None, None, None),
            ("眠りのまま（20 µA）", 20e-6 * 4380 * 1e3, 500, ALI),
            ("出荷モード（0.1 µA）", 0.1e-6 * 4380 * 1e3, 500, GRN),
            ("電池の中の保護回路（3 µA。出荷モードでも流れる）", 3e-6 * 4380 * 1e3, 500, GLD)]
    xb, bw, pmax = 330, 300, 20.0
    y = 16
    for i, (lab, q, cap, c) in enumerate(rows):
        if q is None:
            o.append(T(14, y + 14, lab, "start", 10.5, INK, True))
            y += 24
            continue
        pct = q / cap * 100
        o.append(T(xb - 8, y + 13, lab, "end", 9.5, INK))
        o.append(RECT(xb, y + 2, max(0.8, bw * pct / pmax), 16, 2, soft(c), c, 1.1))
        o.append(T(xb + max(0.8, bw * pct / pmax) + 6, y + 14, "%.2f mAh（%.1f %%）" % (q, pct) if pct >= 1 else "%.2f mAh（%.2f %%）" % (q, pct), "start", 9.5, c, True))
        y += 24
    for v in (0, 5, 10, 15, 20):
        o.append(W(xb + bw * v / pmax, 34, xb + bw * v / pmax, y, c=GRD, lw=1))
        o.append(T(xb + bw * v / pmax, y + 14, "%d %%" % v, "middle", 9, MUT))
    o.append(T(xb + bw, y + 30, "保管の間に使う電荷（容量に対する割合）", "end", 9.5, MUT))
    return SVG(700, y + 40, o, "保管の間に使う電荷（電流の値は例の値。自己放電は含まない）。出荷モードで電池から回路を切り離すと、保管の間の電荷は数十分の 1 以下になる。電池の中の保護回路の電流は、出荷モードでも止まらない。")
F["e04_ship"] = _f04_ship()
