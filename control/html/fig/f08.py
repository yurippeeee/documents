# -*- coding: utf-8 -*-
# 08 章 周波数応答とボード線図 の図
import numpy as _f08_np
from scipy import signal as _f08_sg


# =====================================================================
# 補助
# =====================================================================
def _f08_G(num, den, w, L=0.0):
    """周波数伝達関数 G(jω)（むだ時間 L を含む）。"""
    w = _f08_np.asarray(w, dtype=float)
    s = 1j * w
    return _f08_np.polyval(num, s) / _f08_np.polyval(den, s) * _f08_np.exp(-1j * w * L)


def _f08_ph0(num, den):
    """低い角周波数の漸近形 K0/(jω)^N の位相 [°]（K0 が負なら −180°）。位相の始まりをこれにそろえる。"""
    n = list(num); d = list(den); N = 0
    while len(d) > 1 and d[-1] == 0:
        d.pop(); N += 1
    while len(n) > 1 and n[-1] == 0:
        n.pop(); N -= 1
    return (-180.0 if n[-1] / d[-1] < 0 else 0.0) - 90.0 * N


def _f08_bd(num, den, ws, L=0.0):
    """ゲイン [dB] と位相 [°]（連続につなぐ）。"""
    ws = _f08_np.asarray(ws, dtype=float)
    g = _f08_G(num, den, ws)
    db = 20 * _f08_np.log10(_f08_np.abs(g))
    ph = _f08_np.degrees(_f08_np.unwrap(_f08_np.angle(g)))
    ph = ph + 360.0 * round((_f08_ph0(num, den) - ph[0]) / 360.0)
    return db, ph - _f08_np.degrees(ws * L)


def _f08_lw(a, b, n=400):
    return _f08_np.logspace(math.log10(a), math.log10(b), n)


def _f08_pts(xs, ys):
    return [(float(a), float(b)) for a, b in zip(xs, ys)]


def _f08_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    return s.replace("-", "−")


def _f08_bode(x, y, w, wr, dbr, phr, hm=120, hp=100, gap=34, dbt=None, pht=None, xl="角周波数 ω [rad/s]"):
    """BODE の軸だけを描き、(svg, ゲインの Plot, 位相の Plot, 高さ) を返す。線は clip で足す。"""
    return BODE(x, y, w, [], wr, dbr, phr, hm, hp, gap, dbt, pht, xl)


def _f08_cart(x, y, w=46, h=24, c=SIG):
    """台車の絵（左上 x, y）。"""
    o = [RECT(x, y, w, h, 4, soft(c), c, 1.4)]
    for xx in (x + 10, x + w - 10):
        o.append(CIRC(xx, y + h + 5, 5, c=c, lw=1.4, fill=SCR))
    return "".join(o)


# =====================================================================
# 1 節: 台車を正弦波で押し引きする
# =====================================================================
_F08_CN, _F08_CD = [0.5], [0.5, 1.0]


def _f08_sine3_fig():
    o = []
    # 線図
    s_, pos, xe = CHAIN(64, 42, [("a", 150, "力 u = sin ωt [N]", GLD), ("b", ("0.5", "0.5s + 1"), "g", SIG, SSOFT), ("a", 130, "速度 y [m/s]", SIG)])
    o.append(s_)
    o.append(T((pos["g"][0] + pos["g"][1]) / 2, 13, "台車の速度", "middle", 10, SIG, True))
    o.append(LEGL(552, 46, [(GLD, None, "u [N]"), (SIG, None, "y [m/s]")], sz=10, gap=10))
    rows = [(0.5, [0, 10, 20, 30], "(a)"), (2.0, [0, 2, 4, 6, 8], "(b)"), (8.0, [0, 0.5, 1, 1.5, 2], "(c)")]
    y0 = 84
    for w, xt, lab in rows:
        per = 2 * math.pi / w
        tend = 3 * per
        t = _f08_np.linspace(0, tend, 1500)
        u = _f08_np.sin(w * t)
        _, yy, _ = _f08_sg.lsim((_F08_CN, _F08_CD), u, t)
        g = _f08_G(_F08_CN, _F08_CD, w)
        gain, ph = abs(g), math.degrees(math.atan2(g.imag, g.real))
        p = Plot(64, y0, 420, 84, (0, tend), (-1.2, 1.2))
        o.append(p.axes(xl="時間 t [s]", yl="u・y", xt=xt, yt=[-1, 0, 1], xfmt=lambda v: ("%g" % v)))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.8))
        # 定常状態の振幅（2 周期目から）
        o.append(W(p.X(per), p.Y(gain), p.X(tend), p.Y(gain), c=SIG, lw=0.9, dash="3 3"))
        o.append(W(p.X(per), p.Y(-gain), p.X(tend), p.Y(-gain), c=SIG, lw=0.9, dash="3 3"))
        o.append(p.line(_f08_pts(t, u), c=GLD, lw=1.6))
        o.append(p.line(_f08_pts(t, yy), c=SIG, lw=2.2))
        # 3 周期目の山
        tu = (math.pi / 2 + 4 * math.pi) / w
        ty = tu - math.radians(ph) / w
        o.append(W(p.X(tu), p.Y(1), p.X(tu), p.Y(-1.2), c=GLD, lw=1, dash="2 2"))
        o.append(W(p.X(ty), p.Y(gain), p.X(ty), p.Y(-1.2), c=SIG, lw=1, dash="2 2"))
        o.append(D(p.X(tu), p.Y(1), GLD, 3.4))
        o.append(D(p.X(ty), p.Y(gain), SIG, 3.4))
        # 右の読み
        xr = 500
        o.append(TX(xr, y0 + 12, "%s ω = %g rad/s（周期 %s s）" % (lab, w, ("%.3g" % per)), "start", 10.5, INK, True))
        o.append(TX(xr, y0 + 32, "速度の振幅 %.3f m/s" % gain, "start", 10, SIG))
        o.append(TX(xr, y0 + 48, "山の遅れ %.3f s" % (-math.radians(ph) / w), "start", 10, SIG))
        o.append(TX(xr, y0 + 68, "ゲイン %.3f (m/s)/N" % gain, "start", 10, INK, True))
        o.append(TX(xr, y0 + 84, "位相 %s°" % _f08_f(ph, 1), "start", 10, INK, True))
        y0 += 134
    return SVG(700, y0 - 4, o, "止まっている台車（ばねなし。伝達関数 0.5/(0.5s + 1) (m/s)/N）を、振幅 1 N の正弦波の力で押し引きしたときの速度（細かい刻み幅の数値計算）。初めの短い間を過ぎると、速度は力と同じ角周波数の正弦波になる（破線は定常状態の振幅）。角周波数が高いほど振幅は小さく、山（点）は力の山より遅れ、その遅れの 1 周期に対する割合（位相）は大きくなる。")


F["e08_sine3"] = _f08_sine3_fig()


def _f08_terms_fig():
    o = []
    o.append(T(14, 18, "(a) Y(s) の分母の根（ω = 2 rad/s）", "start", 11, INK, True))
    p = Plot(46, 38, 176, 224, (-3.2, 1.2), (-2.8, 2.8))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(p))
    o.append(p.axes(xl="実部 σ [1/s]", yl="虚部 [rad/s]", xt=[-3, -2, -1, 0, 1], yt=[-2, 0, 2], grid=False, xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(PZ(p, [complex(-2, 0)], [], SIG))
    o.append(PZ(p, [complex(0, 2), complex(0, -2)], [], GLD))
    o.append(T(p.X(-2), p.Y(0) + 22, "台車の極 −2", "middle", 10, SIG, True, halo=True))
    o.append(T(p.X(0) + 9, p.Y(2) - 9, "入力の根 j2", "start", 10, GLD, True, halo=True))
    o.append(T(p.X(0) + 9, p.Y(-2) + 18, "−j2", "start", 10, GLD, True, halo=True))
    # (b) 項と和
    o.append(T(300, 18, "(b) 速度 = 極の項 + 入力の根の項", "start", 11, INK, True))
    q = Plot(340, 38, 340, 200, (0, 6), (-0.45, 0.62))
    o.append(q.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[-0.4, -0.2, 0, 0.2, 0.4, 0.6], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=0.9))
    t = _f08_np.linspace(0, 6, 1201)
    tr = 0.25 * _f08_np.exp(-2 * t)
    ss = math.sqrt(0.125) * _f08_np.sin(2 * t - math.pi / 4)
    o.append(q.line(_f08_pts(t, tr), c=MUT, lw=1.6, dash="5 3"))
    o.append(q.line(_f08_pts(t, ss), c=GRN, lw=1.6, dash="5 3"))
    o.append(q.line(_f08_pts(t, tr + ss), c=SIG, lw=2.4))
    ts = _f08_np.linspace(0, 6, 25)
    _, ysim, _ = _f08_sg.lsim((_F08_CN, _F08_CD), _f08_np.sin(2 * t), t)
    for tk in ts:
        k = int(round(tk / 6 * 1200))
        o.append(D(q.X(tk), q.Y(float(ysim[k])), SIG, 2.3))
    o.append(TX(q.X(0.08), q.Y(0.555), "極 −2 の項 0.25e^{−2t}", "start", 10, MUT, True, halo=True))
    o.append(ARR(q.X(0.5), q.Y(0.53), q.X(0.32), q.Y(0.14), c=MUT, lw=1, head=5))
    o.append(TX(q.X(0.12), q.Y(-0.30), "入力の根 ±j2 の項", "start", 10, GRN, True, halo=True))
    o.append(TX(q.X(0.12), q.Y(-0.40), "0.354 sin(2t − 45°)", "start", 10, GRN, True, halo=True))
    o.append(TX(q.X(3.25), q.Y(0.555), "和（速度）・点は数値計算", "start", 10, SIG, True, halo=True))
    o.append(T(q.x, 292, "極の項は 2 s 後に 0.0046 m/s（定常状態の振幅の 1.3 %）になる", "start", 9.5, MUT))
    return SVG(700, 302, o, "ω = 2 rad/s の正弦波の力で押した台車の速度を、部分分数の項に分けたもの。(a) Y(s) = 2/((s + 2)(s<sup>2</sup> + 4)) の分母の根は、台車の極 −2 と、入力の正弦波から来る ±j2 である。(b) 極 −2 の項は時定数 0.5 s で消え、±j2 の 2 つの項をまとめた正弦波（振幅 |G(j2)| = 0.354、位相 −45°）だけが残る。2 つの和は数値計算の速度（点）と一致する。")


F["e08_terms"] = _f08_terms_fig()


# =====================================================================
# 2 節: 周波数伝達関数
# =====================================================================
def _f08_vector_fig():
    o = []
    o.append(T(14, 18, "(a) 回る矢印の影が正弦波（ω = 2 rad/s、ωt = 60° の瞬間）", "start", 11, INK, True))
    cx, cy, R = 118, 150, 88
    o.append(W(cx - R - 12, cy, cx + R + 12, cy, c=MUT, lw=1))
    o.append(W(cx, cy - R - 12, cx, cy + R + 12, c=MUT, lw=1))
    o.append(CIRC(cx, cy, R, c=FNT, lw=1, dash="3 3"))
    o.append(T(cx + R + 12, cy + 14, "実部", "end", 9.5, MUT))
    o.append(T(cx + 6, cy + R + 12, "虚部", "start", 9.5, MUT))
    th = math.radians(60)
    gi = math.sqrt(0.125)
    xi, yi = cx + R * math.cos(th), cy - R * math.sin(th)
    tho = th - math.pi / 4
    xo, yo = cx + R * gi * math.cos(tho), cy - R * gi * math.sin(tho)
    o.append(ARR(cx, cy, xi, yi, c=GLD, lw=2.2, head=8))
    o.append(ARR(cx, cy, xo, yo, c=SIG, lw=2.6, head=8))
    # 角の弧（60° → 15°）
    pts = [(cx + 46 * math.cos(math.radians(a)), cy - 46 * math.sin(math.radians(a))) for a in range(60, 14, -3)]
    o.append(PL(pts, c=SIG, lw=1.2))
    o.append(T(cx + 52, cy - 34, "−45°", "start", 10, SIG, True, halo=True))
    o.append(TX(xi - 6, yi - 10, "e^{jωt}（長さ 1）", "end", 10, GLD, True, halo=True))
    o.append(TX(cx + 6, cy + 30, "G(j2) e^{jωt}", "start", 10, SIG, True, halo=True))
    o.append(T(cx + 6, cy + 44, "（長さ 0.354）", "start", 9.5, SIG, halo=True))
    # 右の波形（縦の目盛は円と同じ）
    wx, ww = 250, 180
    X = lambda a: wx + a / 360.0 * ww
    o.append(W(wx, cy, wx + ww, cy, c=MUT, lw=0.9))
    o.append(W(wx, cy - R - 6, wx, cy + R + 6, c=MUT, lw=0.9))
    ts = list(range(0, 361, 3))
    o.append(PL([(X(a), cy - R * math.sin(math.radians(a))) for a in ts], c=GLD, lw=1.6))
    o.append(PL([(X(a), cy - R * gi * math.sin(math.radians(a - 45))) for a in ts], c=SIG, lw=2.2))
    xc = X(60)
    o.append(W(xc, cy - R - 6, xc, cy + R + 6, c=FNT, lw=1, dash="3 3"))
    o.append(W(xi, yi, xc, yi, c=GLD, lw=1, dash="2 3"))
    o.append(W(xo, yo, xc, yo, c=SIG, lw=1, dash="2 3"))
    o.append(D(xc, yi, GLD, 3.2)); o.append(D(xc, yo, SIG, 3.2))
    for a, s_ in ((0, "0"), (180, "180°"), (360, "360°")):
        o.append(T(X(a), cy + R + 20, s_, "middle", 9.5, MUT))
    o.append(T(wx + ww + 4, cy + 4, "ωt", "start", 9.5, MUT))
    o.append(LEGL(236, cy + R + 40, [(GLD, None, "入力 sin ωt"), (SIG, None, "出力 0.354 sin(ωt − 45°)")], sz=9.5, gap=12))
    # (b) 角周波数ごとの G(jω)
    o.append(T(462, 18, "(b) 台車の G(jω) の矢印", "start", 11, INK, True))
    p = Plot(476, 70, 210, 115, (-0.04, 0.62), (-0.30, 0.062))
    o.append(W(p.X(-0.04), p.Y(0), p.X(0.62), p.Y(0), c=MUT, lw=1))
    o.append(W(p.X(0), p.Y(-0.30), p.X(0), p.Y(0.06), c=MUT, lw=1))
    o.append(T(p.X(0.62), p.Y(0) - 6, "実部", "end", 9.5, MUT))
    o.append(T(p.X(0) + 4, p.Y(-0.30) + 2, "虚部", "start", 9.5, MUT))
    for v in (0.25, 0.5):
        o.append(W(p.X(v), p.Y(0) - 3, p.X(v), p.Y(0) + 3, c=MUT, lw=1))
        o.append(T(p.X(v), p.Y(0) - 6, "%g" % v, "middle", 9, MUT))
    o.append(W(p.X(0) - 3, p.Y(-0.25), p.X(0) + 3, p.Y(-0.25), c=MUT, lw=1))
    o.append(T(p.X(0) - 5, p.Y(-0.25) + 3, "−0.25", "end", 9, MUT))
    circ = [(p.X(0.25 + 0.25 * math.cos(a)), p.Y(0.25 * math.sin(a))) for a in _f08_np.linspace(-math.pi, 0, 80)]
    o.append(PL(circ, c=SIG, lw=1.2, dash="4 3"))
    for w in (0.5, 1, 4, 8):
        g = complex(_f08_G(_F08_CN, _F08_CD, w))
        o.append(W(p.X(0), p.Y(0), p.X(g.real), p.Y(g.imag), c=MUT, lw=1.1))
        o.append(D(p.X(g.real), p.Y(g.imag), MUT, 2.6))
        dx, dy = g.real - 0.25, g.imag
        r = math.hypot(dx, dy)
        lx, ly = p.X(g.real) + dx / r * 14, p.Y(g.imag) - dy / r * 14
        o.append(T(lx, ly + 3, "%g" % w, "middle", 9.5, MUT, halo=True))
    g2 = complex(_f08_G(_F08_CN, _F08_CD, 2.0))
    o.append(ARR(p.X(0), p.Y(0), p.X(g2.real), p.Y(g2.imag), c=SIG, lw=2.4, head=8))
    o.append(T(p.X(g2.real) + 2, p.Y(g2.imag) + 15, "ω = 2", "middle", 10, SIG, True, halo=True))
    o.append(D(p.X(0.5), p.Y(0), INK, 3))
    o.append(T(p.X(0.5), p.Y(0) + 14, "ω = 0", "middle", 9.5, INK, halo=True))
    o.append(T(p.X(0) + 4, p.Y(0) + 14, "∞", "start", 10, INK, halo=True))
    arc = [(p.X(0) + 30 * math.cos(math.radians(a)), p.Y(0) + 30 * math.sin(math.radians(a))) for a in range(0, 46, 3)]
    o.append(PL(arc, c=SIG, lw=1.1))
    o.append(T(p.X(0) + 36, p.Y(0) + 16, "−45°", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.x, 222, "数字は ω [rad/s]。先端は円の下半分を", "start", 9.5, MUT))
    o.append(T(p.x, 238, "たどる（中心 0.25、半径 0.25）", "start", 9.5, MUT))
    return SVG(700, 290, o, "周波数伝達関数を矢印で見る。(a) 入力 sin ωt は、長さ 1 で反時計回りに回る矢印 e<sup>jωt</sup> を虚軸に映した影である。G(jω) を掛けると、矢印は長さが |G(jω)| 倍になり、∠G(jω) だけ回る。その影が定常状態の出力である（台車、ω = 2 rad/s で 0.354 倍・−45°）。(b) 台車の G(jω) = 0.5/(1 + j0.5ω) を角周波数ごとに描くと、ω = 0 の 0.5（定常ゲイン）から、短くなりながら時計回りに回り、先端は円の下半分をたどって原点に近づく。")


F["e08_vector"] = _f08_vector_fig()


_F08_SN, _F08_SD = [2.0, 25.0], [1.0, 2.0, 25.0]


def _f08_geom_fig():
    o = []
    o.append(T(14, 18, "(a) 零点と極から jω へ引いた矢印（ω = 5 rad/s）", "start", 11, INK, True))
    p = Plot(40, 34, 300, 260, (-13.5, 1.5), (-5.6, 7.4))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(p))
    o.append(p.axes(xl="実部 σ [1/s]", yl=None, xt=[-12, -8, -4, 0], yt=[-4, 0, 4], grid=False, xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    z = complex(-12.5, 0); p1 = complex(-1, math.sqrt(24)); p2 = p1.conjugate()
    jw = complex(0, 5)
    o.append(ARR(p.X(z.real), p.Y(z.imag), p.X(0) - 2, p.Y(5) + 1, c=TEA, lw=2, head=8))
    o.append(ARR(p.X(p1.real), p.Y(p1.imag), p.X(0) - 3, p.Y(5), c=PUR, lw=2, head=7))
    o.append(ARR(p.X(p2.real), p.Y(p2.imag), p.X(0) - 1, p.Y(5) + 3, c=PUR, lw=2, head=8))
    o.append(PZ(p, [p1, p2], [z], SIG))
    o.append(D(p.X(0), p.Y(5), GLD, 4.5))
    o.append(ARR(p.X(0) + 10, p.Y(1), p.X(0) + 10, p.Y(6.6), c=GLD, lw=1.2, head=6))
    o.append(TX(p.X(0) - 6, p.Y(6.4), "jω", "end", 11, GLD, True, halo=True))
    o.append(T(p.X(-6.6), p.Y(2.0) + 4, "13.46（21.8°）", "middle", 10, TEA, True, halo=True))
    o.append(T(p.X(-1.6), p.Y(5.9), "1.005（5.8°）", "end", 10, PUR, True, halo=True))
    o.append(T(p.X(-1.0), p.Y(-1.6), "9.95（84.2°）", "end", 10, PUR, True, halo=True))
    o.append(T(p.X(-12.5), p.Y(0) + 20, "零点 −12.5", "middle", 10, SIG, halo=True))
    o.append(T(p.X(-1) - 8, p.Y(-4.9) + 4, "極 −1 − j4.90", "end", 10, SIG, halo=True))
    o.append(T(392, 326, "ω = 5: ゲイン = 2 × 13.46 ÷ (1.005 × 9.95) = 2.69", "start", 9.5, INK))
    o.append(T(392, 342, "位相 = 21.8° − 5.8° − 84.2° = −68.2°", "start", 9.5, INK))
    # (b) ゲインと位相
    o.append(T(392, 18, "(b) ゲインと位相（ふつうの目盛）", "start", 11, INK, True))
    ws = _f08_np.linspace(0.01, 15, 600)
    g = _f08_G(_F08_SN, _F08_SD, ws)
    q = Plot(424, 40, 256, 100, (0, 15), (0, 3))
    o.append(q.axes(xl=None, yl="ゲイン（倍）", xt=[0, 5, 10, 15], yt=[0, 1, 2, 3], xfmt=lambda v: "%g" % v))
    o.append(q.line(_f08_pts(ws, _f08_np.abs(g)), c=SIG, lw=2.2))
    r = Plot(424, 180, 256, 96, (0, 15), (-150, 0))
    o.append(r.axes(xl="角周波数 ω [rad/s]", yl="位相 [°]", xt=[0, 5, 10, 15], yt=[-150, -100, -50, 0], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    _, ph = _f08_bd(_F08_SN, _F08_SD, ws)
    o.append(r.line(_f08_pts(ws, ph), c=SIG, lw=2.2))
    for w, dx, a in ((2, 0, "middle"), (5, 8, "start"), (10, 0, "middle")):
        gv = complex(_f08_G(_F08_SN, _F08_SD, w))
        pv = float(_f08_bd(_F08_SN, _F08_SD, [w])[1][0])
        o.append(D(q.X(w), q.Y(abs(gv)), GLD, 3.4))
        o.append(D(r.X(w), r.Y(pv), GLD, 3.4))
        o.append(T(q.X(w) + dx, q.Y(abs(gv)) - 8, "%.2f" % abs(gv), a, 9.5, GLD, True, halo=True))
        o.append(T(r.X(w) + (6 if w != 10 else 0), r.Y(pv) + (14 if w != 2 else -8), _f08_f(pv, 1) + "°", "start" if w != 10 else "middle", 9.5, GLD, True, halo=True))
    return SVG(700, 350, o, "付け根を動かす台車 G(s) = (2s + 25)/(s<sup>2</sup> + 2s + 25) の周波数伝達関数を、零点と極からの矢印で求める。(a) 点 jω が虚軸を上へ動くとき、ゲインは β = 2 × 零点からの距離 ÷ 極からの距離の積、位相は零点からの矢印の角度 − 極からの矢印の角度の和である。ω = 5 rad/s では上の極までの距離 1.005 が小さく、ゲインが 2.69 と大きい。(b) ω を変えたゲインと位相（点は表の ω = 2・5・10 rad/s）。")


F["e08_geom"] = _f08_geom_fig()


# =====================================================================
# 3 節: デシベルとボード線図
# =====================================================================
def _f08_db_fig():
    o = []
    o.append(T(14, 18, "(a) 振幅の比と dB（同じ位置に並ぶ）", "start", 11, INK, True))
    X = lambda r: 70 + (math.log10(r) + 2) * 140
    ya = 74
    o.append(W(X(0.01), ya, X(100), ya, c=INK, lw=1.4))
    o.append(T(14, ya - 8, "振幅の比", "start", 10, INK, True))
    o.append(T(14, ya + 22, "dB", "start", 10, INK, True))
    marks = [(0.01, "0.01", "−40", 0), (0.1, "0.1", "−20", 0), (0.5, "0.5", "−6.02", 0), (1 / math.sqrt(2), "0.707", "−3.01", 1),
             (1, "1", "0", 0), (math.sqrt(2), "1.414", "3.01", 1), (2, "2", "6.02", 0), (10, "10", "20", 0), (100, "100", "40", 0)]
    for r, a, b, lvl in marks:
        x = X(r)
        big = r in (0.01, 0.1, 1, 10, 100)
        o.append(W(x, ya - (7 if big else 5), x, ya + (7 if big else 5), c=INK, lw=1.4 if big else 1.0))
        o.append(T(x, ya - 10 - lvl * 14, a, "middle", 9.5, SIG, big))
        o.append(T(x, ya + 20 + lvl * 14, b, "middle", 9.5, GLD, big))
    for k in range(-2, 2):
        for m in range(2, 10):
            x = X(m * 10 ** k)
            o.append(W(x, ya - 3, x, ya + 3, c=MUT, lw=0.8))
    for k, (r0, r1, lab) in enumerate(((1, 2, "×2 で +6.02 dB"), (2, 10, "×5 で +13.98 dB"), (1, 10, "×10 で +20 dB（= 6.02 + 13.98）"))):
        yy = 126 + k * 19
        o.append(W(X(r0), yy - 4, X(r0), yy + 4, c=GRN, lw=1.2))
        o.append(ARR(X(r0), yy, X(r1), yy, c=GRN, lw=1.6, head=6))
        o.append(T(X(10) + 8, yy + 4, lab, "start", 9.5, GRN, True))
    # (b) 角周波数の対数の目盛
    o.append(T(14, 196, "(b) 角周波数の対数の目盛（例の対象の時定数の逆数・固有角周波数）", "start", 11, INK, True))
    Xw = lambda w: 70 + (math.log10(w) + 3) * 80
    yw = 248
    o.append(W(Xw(0.001), yw, Xw(10000), yw, c=INK, lw=1.4))
    for k in range(-3, 5):
        x = Xw(10 ** k)
        o.append(W(x, yw - 6, x, yw + 6, c=INK, lw=1.3))
        o.append(T(x, yw + 20, ("%g" % (10 ** k)) if k < 4 else "10000", "middle", 9.5, MUT))
        if k < 4:
            for m in range(2, 10):
                xx = Xw(m * 10 ** k)
                o.append(W(xx, yw - 3, xx, yw + 3, c=MUT, lw=0.7))
    o.append(T(Xw(10000) + 4, yw + 34, "ω [rad/s]", "end", 9.5, MUT))
    o.append(DIM(Xw(1), yw + 34, Xw(10), yw + 34, "1 dec", c=MUT, sz=9.5, above=False))
    objs = [(0.002, "温度の板 0.002", 222, "start", TEA), (2, "台車の速度 2", 222, "end", SIG), (5, "台車とばね 5", 208, "end", PUR),
            (10, "RC 回路 10", 208, "start", GLD), (20, "モータ 20", 222, "start", GRN), (1980, "モータの巻線 1980", 222, "middle", ALI)]
    for w, s_, yl, a, c in objs:
        x = Xw(w)
        o.append(D(x, yw, c, 4))
        o.append(W(x, yw - 4, x, yl + 3, c=c, lw=1))
        dx = -4 if a == "end" else (4 if a == "start" else 0)
        o.append(T(x + dx, yl, s_, a, 9.5, c, True, halo=True))
    return SVG(700, yw + 52, o, "対数の目盛。(a) 振幅の比を対数の目盛に並べると、dB の目盛と同じ位置になる。比が 10 倍で 20 dB、2 倍で 6.02 dB、1/√2 倍で −3.01 dB で、比の積は dB の和になる。(b) 角周波数の対数の目盛では、どのディケード（10 倍の幅）も同じ長さになる。例の対象の時定数の逆数と固有角周波数 [rad/s] は、6 ディケードにわたって並ぶ。")


F["e08_db"] = _f08_db_fig()


def _f08_axes_fig():
    o = []
    o.append(T(14, 18, "(a) ふつうの目盛", "start", 11, INK, True))
    ws = _f08_np.linspace(0.0, 10, 400)
    g = _f08_G(_F08_CN, _F08_CD, ws)
    p = Plot(70, 40, 240, 104, (0, 10), (0, 0.55))
    o.append(p.axes(xl=None, yl="ゲイン [(m/s)/N]", xt=[0, 2, 4, 6, 8, 10], yt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line(_f08_pts(ws, _f08_np.abs(g)), c=SIG, lw=2.2))
    q = Plot(70, 180, 240, 84, (0, 10), (-90, 0))
    o.append(q.axes(xl="角周波数 ω [rad/s]", yl="位相 [°]", xt=[0, 2, 4, 6, 8, 10], yt=[-90, -45, 0], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(q.line(_f08_pts(ws, _f08_np.degrees(_f08_np.angle(g))), c=SIG, lw=2.2))
    for w in (0.5, 2, 8):
        gv = complex(_f08_G(_F08_CN, _F08_CD, w))
        o.append(D(p.X(w), p.Y(abs(gv)), GLD, 3.4))
        o.append(D(q.X(w), q.Y(math.degrees(math.atan2(gv.imag, gv.real))), GLD, 3.4))
        o.append(T(p.X(w) + 6, p.Y(abs(gv)) - 6, "%g" % w, "start", 9.5, GLD, True, halo=True))
    # (b) ボード線図
    o.append(T(380, 18, "(b) ボード線図", "start", 11, INK, True))
    s_, pm, pp, h = _f08_bode(410, 40, 270, (0.01, 100), (-50, 0), (-90, 0), hm=104, hp=84, gap=36, dbt=[-40, -30, -20, -10, 0], pht=[-90, -45, 0])
    o.append(s_)
    wl = _f08_lw(0.01, 100)
    db, ph = _f08_bd(_F08_CN, _F08_CD, wl)
    o.append(pm.line([(0.01, -6.02), (2, -6.02)], c=MUT, lw=1.2, dash="5 3"))
    o.append(pm.line([(2, -6.02), (100, -6.02 - 20 * math.log10(50))], c=MUT, lw=1.2, dash="5 3"))
    o.append(pm.line(_f08_pts(wl, db), c=SIG, lw=2.2))
    o.append(pp.line(_f08_pts(wl, ph), c=SIG, lw=2.2))
    for w in (0.5, 2, 8):
        gv = complex(_f08_G(_F08_CN, _F08_CD, w))
        o.append(D(pm.X(w), pm.Y(20 * math.log10(abs(gv))), GLD, 3.4))
        o.append(D(pp.X(w), pp.Y(math.degrees(math.atan2(gv.imag, gv.real))), GLD, 3.4))
    o.append(T(pm.X(0.012), pm.Y(-6.02) + 15, "−6.02 dB（0.5）", "start", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(2) - 2, pm.Y(-9.03) + 18, "2 rad/s で −9.03 dB", "end", 9.5, GLD, True, halo=True))
    o.append(T(pm.X(9), pm.Y(-30), "−20 dB/dec", "start", 9.5, MUT, True, halo=True))
    o.append(T(pp.X(2) + 6, pp.Y(-45) - 4, "−45°", "start", 9.5, GLD, True, halo=True))
    return SVG(700, h + 4, o, "台車の速度 0.5/(0.5s + 1) の周波数応答を、2 通りの目盛で描く。点は 1 節の ω = 0.5・2・8 rad/s。(a) ふつうの目盛では、ゲインは曲線で減り、どこで何が起きるかが読みにくい。(b) ボード線図（横軸は対数の目盛、ゲインは dB）では、ゲインの線は低い角周波数の水平な直線と、傾き −20 dB/dec の直線（破線）にほぼ重なり、2 本は 2 rad/s で交わる。")


F["e08_axes"] = _f08_axes_fig()


def _f08_sgyr_fig():
    o = []
    # ループの線図（07 章 2 節と同じ並び）
    yc = 52
    s_, pos, xe = CHAIN(96, yc, [("a", 46, "R(s)", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, "E(s)", INK), ("b", "C = 8", "c"),
                                 ("a", 46, "U(s)", GLD), ("b", ("0.5", "0.5s + 1"), "p"), ("a", 30, None, SIG), ("s", {"l": "+", "t": "+"}, "s2"),
                                 ("a", 50, None, SIG), ("t", "tap", SIG), ("a", 50, "Y(s)", SIG)])
    o.append(s_)
    o.append(TOPIN(pos["s2"], yc, 40, "D(s)（制御量に入る外乱）", PUR))
    o.append(FBPATH(pos["tap"], pos["s1"], yc, 40, c=TEA, lab="測った値 Y(s) + N(s)（N は観測ノイズ）"))
    o.append(T((pos["p"][0] + pos["p"][1]) / 2, yc - 30, "台車の速度", "middle", 9.5, MUT))
    o.append(TX(xe + 14, yc - 18, "S: D → Y", "start", 10, PUR, True))
    o.append(TX(xe + 14, yc, "G_{yr}: R → Y", "start", 10, TEA, True))
    o.append(TX(xe + 14, yc + 18, "−G_{yr}: N → Y", "start", 10, TEA, True))
    Gyr, _Gyd, Ss = CLOOP([0.5], [0.5, 1.0], [8.0], [1.0])
    p = Plot(64, 128, 600, 190, (0.1, 1000), (-40, 6), xlog=True)
    o.append(p.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [dB]", yt=[-40, -30, -20, -10, 0], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1.1))
    wl = _f08_lw(0.1, 1000)
    dbS, _ = _f08_bd(list(Ss[0]), list(Ss[1]), wl)
    dbG, _ = _f08_bd(list(Gyr[0]), list(Gyr[1]), wl)
    o.append(p.line(_f08_pts(wl, dbS), c=PUR, lw=2.4))
    o.append(p.line(_f08_pts(wl, dbG), c=TEA, lw=2.4))
    for w, ys, yg in ((1, -13.05, -1.98), (10, -2.84, -4.95), (50, -0.16, -16.09)):
        o.append(W(p.X(w), p.y, p.X(w), p.y + p.h, c=FNT, lw=1, dash="3 3"))
        o.append(D(p.X(w), p.Y(ys), PUR, 3.6)); o.append(D(p.X(w), p.Y(yg), TEA, 3.6))
    o.append(T(p.X(1) + 6, p.Y(-13.05) + 15, "0.222（−13.05 dB）", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(1) + 6, p.Y(-1.98) + 15, "0.796（−1.98 dB）", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(10), p.Y(-37.5), "10 rad/s: S 0.721・G_{yr} 0.566", "middle", 9.5, INK, True, halo=True))
    o.append(T(p.X(50) + 6, p.Y(-0.16) + 15, "0.981（−0.16 dB）", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(50) + 6, p.Y(-16.09) + 15, "0.157（−16.09 dB）", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(0.12), p.Y(-13.98) + 16, "S(jω): 外乱 → 制御量", "start", 10, PUR, True, halo=True))
    o.append(TX(p.X(30), p.Y(-31), "G_{yr}(jω): 目標値・ノイズ → 制御量", "middle", 10, TEA, True, halo=True))
    o.append(T(p.X(0.4), p.Y(-28), "遅い外乱は 1/5 に縮む", "middle", 10, PUR, halo=True))
    o.append(T(p.X(0.4), p.Y(-34), "目標値は 0.8 倍が現れる", "middle", 10, TEA, halo=True))
    o.append(T(p.X(400), p.Y(-6), "速いノイズは通らない", "middle", 10, TEA, halo=True))
    return SVG(700, 356, o, "台車の速度の比例制御（K<sub>P</sub> = 8 N/(m/s)）の感度関数 S と、目標値から制御量までの閉ループ伝達関数 G<sub>yr</sub> のゲイン。点は 1 rad/s・10 rad/s・50 rad/s の値（倍）。低い角周波数では S が小さく、遅い外乱を抑える。高い角周波数では G<sub>yr</sub> が小さく、速い観測ノイズを制御量に通さない。10 rad/s では両方が 1 に近く、ゲインの和は 1 を越える（S + G<sub>yr</sub> = 1 は複素数の和）。")


F["e08_sgyr"] = _f08_sgyr_fig()


# =====================================================================
# 4 節: 基本要素
# =====================================================================
def _f08_elem_fig():
    o = []
    o.append(T(14, 18, "(a) 定数・積分・微分", "start", 11, INK, True))
    s_, pm, pp, h = _f08_bode(56, 46, 256, (0.1, 10), (-30, 30), (-135, 135), hm=104, hp=100, gap=34, dbt=[-20, 0, 20], pht=[-90, 0, 90])
    o.append(s_)
    o.append(pm.line([(0.1, 20), (10, 20)], c=PUR, lw=2.2))
    o.append(pm.line([(0.1, 20), (10, -20)], c=SIG, lw=2.2))
    o.append(pm.line([(0.1, -20), (10, 20)], c=GRN, lw=2.2))
    o.append(pp.line([(0.1, 0), (10, 0)], c=PUR, lw=2.2))
    o.append(pp.line([(0.1, -90), (10, -90)], c=SIG, lw=2.2))
    o.append(pp.line([(0.1, 90), (10, 90)], c=GRN, lw=2.2))
    o.append(LEGL(56, 34, [(PUR, None, "10（定数）"), (SIG, None, "1/s（積分）"), (GRN, None, "s（微分）")], sz=9.5, gap=10))
    o.append(T(pm.X(9.5), pm.Y(-20) + 14, "−20 dB/dec", "end", 9.5, SIG, halo=True))
    o.append(T(pm.X(0.106), pm.Y(-20) + 14, "+20 dB/dec", "start", 9.5, GRN, halo=True))
    o.append(T(pp.X(9.5), pp.Y(90) + 13, "+90°", "end", 9.5, GRN, True, halo=True))
    o.append(T(pp.X(9.5), pp.Y(0) - 5, "0°", "end", 9.5, PUR, True, halo=True))
    o.append(T(pp.X(9.5), pp.Y(-90) - 5, "−90°", "end", 9.5, SIG, True, halo=True))
    # (b) 一次遅れと一次進み
    o.append(T(376, 18, "(b) 一次遅れ 1/(1 + Ts) と一次進み 1 + Ts", "start", 11, INK, True))
    s2, qm, qp, h2 = _f08_bode(410, 46, 270, (0.01, 100), (-45, 45), (-90, 90), hm=104, hp=100, gap=34, dbt=[-40, -20, 0, 20, 40], pht=[-90, -45, 0, 45, 90], xl="ωT（角周波数 × 時定数）")
    o.append(s2)
    x = _f08_lw(0.01, 100)
    lag = 1 / (1 + 1j * x)
    o.append(qm.line([(0.01, 0), (1, 0), (100, -40)], c=GLD, lw=1.4, dash="5 3"))
    o.append(qm.line([(1, 0), (100, 40)], c=GRN, lw=1.2, dash="5 3"))
    o.append(qm.line(_f08_pts(x, -20 * _f08_np.log10(_f08_np.abs(lag))), c=GRN, lw=1.6))
    o.append(qm.line(_f08_pts(x, 20 * _f08_np.log10(_f08_np.abs(lag))), c=SIG, lw=2.4))
    o.append(qp.line([(0.01, 0), (0.1, 0), (10, -90), (100, -90)], c=GLD, lw=1.4, dash="5 3"))
    o.append(qp.line(_f08_pts(x, -_f08_np.degrees(_f08_np.angle(lag))), c=GRN, lw=1.6))
    o.append(qp.line(_f08_pts(x, _f08_np.degrees(_f08_np.angle(lag))), c=SIG, lw=2.4))
    o.append(D(qm.X(1), qm.Y(-3.01), SIG, 3.4))
    o.append(T(qm.X(1) - 6, qm.Y(-3.01) + 15, "−3.01 dB", "end", 9.5, SIG, True, halo=True))
    o.append(W(qm.X(1), qm.Y(0), qm.X(0.3), qm.Y(13), c=GLD, lw=1))
    o.append(T(qm.X(0.3) - 2, qm.Y(13) - 3, "折れ点 1/T", "end", 9.5, GLD, True, halo=True))
    o.append(T(qm.X(8), qm.Y(-31), "−20 dB/dec", "end", 9.5, SIG, True, halo=True))
    o.append(T(qm.X(8), qm.Y(27), "+20 dB/dec", "end", 9.5, GRN, True, halo=True))
    o.append(T(qm.X(0.012), qm.Y(-10), "破線は漸近線", "start", 9.5, GLD, halo=True))
    o.append(D(qp.X(1), qp.Y(-45), SIG, 3.4))
    o.append(T(qp.X(1) + 7, qp.Y(-45) + 4, "−45°", "start", 9.5, SIG, True, halo=True))
    o.append(T(qp.X(80), qp.Y(-90) - 6, "−90°", "end", 9.5, SIG, True, halo=True))
    o.append(T(qp.X(80), qp.Y(90) + 13, "+90°（1 + Ts）", "end", 9.5, GRN, True, halo=True))
    return SVG(700, max(h, h2) + 4, o, "基本要素のボード線図。(a) 定数 10 は 20 dB の水平な線で位相 0°、積分 1/s は ω = 1 rad/s で 0 dB を通る −20 dB/dec の直線で位相 −90°、微分 s はその逆（+20 dB/dec、+90°）。(b) 一次遅れ（青）は、0 dB と −20 dB/dec の 2 本の漸近線（金の破線）が ωT = 1（折れ点 1/T）で交わる形で、折れ点では −3.01 dB・−45° になる。位相の破線は、折れ点の 1/10 から 10 倍までを直線で結んだ近似。一次進み 1 + Ts（緑）は上下が逆になる。")


F["e08_elem"] = _f08_elem_fig()


def _f08_lag2_fig():
    o = []
    s_, pm, pp, h = _f08_bode(56, 20, 400, (0.1, 10), (-40, 20), (-180, 0), hm=160, hp=110, gap=34, dbt=[-40, -20, 0, 20], pht=[-180, -135, -90, -45, 0], xl="ω/ω_n（角周波数 ÷ 固有角周波数）")
    o.append(s_)
    o.append(pm.line([(0.1, 0), (1, 0), (10, -40)], c=MUT, lw=1.4, dash="5 3"))
    zl = [(0.1, ALI), (0.2, SIG), (0.3, PUR), (0.5, TEA), (0.707, GRN), (1.0, GLD)]
    x = _f08_lw(0.1, 10, 600)
    for z, c in zl:
        db, ph = _f08_bd([1], [1, 2 * z, 1], x)
        lw = 2.6 if z == 0.2 else 1.7
        o.append(pm.clip(_f08_pts(x, db), c=c, lw=lw))
        o.append(pp.line(_f08_pts(x, ph), c=c, lw=lw))
        if z < 0.7:
            wr = math.sqrt(1 - 2 * z * z); Mr = 1 / (2 * z * math.sqrt(1 - z * z))
            o.append(D(pm.X(wr), pm.Y(20 * math.log10(Mr)), c, 3.2))
    o.append(T(pm.X(1.25), pm.Y(14.02) + 4, "14.0 dB", "start", 9.5, ALI, True, halo=True))
    o.append(T(pm.X(1.3), pm.Y(8.14) + 6, "8.14 dB", "start", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(0.62), pm.Y(4.85) - 6, "4.85 dB", "end", 9.5, PUR, True, halo=True))
    o.append(T(pm.X(5), pm.Y(-28) - 10, "−40 dB/dec", "start", 9.5, MUT, True, halo=True))
    o.append(TX(pp.X(1) + 6, pp.Y(-90) - 6, "ω_n で −90°", "start", 9.5, INK, halo=True))
    # 凡例と台車とばねの値
    lx, ly = 486, 34
    o.append(T(lx, ly, "減衰比 ζ（共振ピーク）", "start", 10.5, INK, True))
    labs = {0.1: "0.1（14.0 dB）", 0.2: "0.2（8.14 dB）台車とばね", 0.3: "0.3（4.85 dB）", 0.5: "0.5（1.25 dB）", 0.707: "0.707（山なし）", 1.0: "1（山なし）"}
    for i, (z, c) in enumerate(zl):
        yy = ly + 20 + i * 17
        o.append(W(lx, yy - 4, lx + 22, yy - 4, c=c, lw=2.6 if z == 0.2 else 1.8))
        o.append(T(lx + 28, yy, labs[z], "start", 9.5, c, z == 0.2))
    o.append(W(lx, ly + 20 + 6 * 17 - 4, lx + 22, ly + 20 + 6 * 17 - 4, c=MUT, lw=1.4, dash="5 3"))
    o.append(T(lx + 28, ly + 20 + 6 * 17, "漸近線（0 dB と −40 dB/dec）", "start", 9.5, MUT))
    ny = 200
    o.append(T(lx, ny, "台車とばね・ダンパ（例の値）", "start", 10.5, SIG, True))
    for i, l in enumerate(["低い角周波数 0.04 m/N（−27.96 dB）", "4.80 rad/s で 0.102 m/N", "（−19.82 dB。+8.14 dB の山）", "5 rad/s で 0.1 m/N・−90°",
                           "（1 N で揺らすと 10 cm）"]):
        o.append(T(lx, ny + 18 + i * 15, l, "start", 9.5, INK))
    return SVG(700, h + 4, o, "二次遅れ ω<sub>n</sub><sup>2</sup>/(s<sup>2</sup> + 2ζω<sub>n</sub>s + ω<sub>n</sub><sup>2</sup>) のボード線図（横軸は ω/ω<sub>n</sub>）。漸近線は 0 dB と −40 dB/dec で、ω<sub>n</sub> で交わる。ζ が 0.707 より小さいと、ω<sub>n</sub> の少し手前に山（共振ピーク。点）ができ、ζ が小さいほど高く鋭い。位相は ω<sub>n</sub> で −90° を通って −180° へ移り、ζ が小さいほど急に変わる。")


F["e08_lag2"] = _f08_lag2_fig()


def _f08_delay_fig():
    o = []
    o.append(TX(14, 18, "(a) e^{−jωL} の矢印（L = 20 s）", "start", 11, INK, True))
    cx, cy, R = 136, 160, 92
    o.append(W(cx - R - 14, cy, cx + R + 14, cy, c=MUT, lw=1))
    o.append(W(cx, cy - R - 14, cx, cy + R + 14, c=MUT, lw=1))
    o.append(CIRC(cx, cy, R, c=FNT, lw=1.2, dash="3 3"))
    vs = [(0.0, "ω = 0: 0°", 0, -10), (0.01, "0.01: −11.5°", 6, 10), (0.05, "0.05: −57.3°", 8, 8), (math.pi / 40, "0.0785: −90°", 0, 16),
          (math.pi / 20, "0.157: −180°", 4, 18), (0.2, "0.2: −229°", -8, -6)]
    for w, lab, dx, dy in vs:
        a = -w * 20
        xe, ye = cx + R * math.cos(a), cy - R * math.sin(a)
        o.append(ARR(cx, cy, xe, ye, c=SIG, lw=1.8 if w else 1.4, head=7))
        anc = "start" if math.cos(a) > 0.3 else ("end" if math.cos(a) < -0.3 else "middle")
        if abs(w - math.pi / 20) < 1e-9:
            anc = "start"; dx = -6
        o.append(T(xe + dx + (6 if anc == "start" else (-6 if anc == "end" else 0)), ye + dy + (4 if abs(math.cos(a)) > 0.3 else 0), lab, anc, 9.5, SIG, True, halo=True))
    arc = [(cx + 40 * math.cos(math.radians(t_)), cy + 40 * math.sin(math.radians(t_))) for t_ in range(5, 215, 5)]
    o.append(PL(arc, c=GLD, lw=1.3))
    o.append(_head(arc[-2][0], arc[-2][1], arc[-1][0], arc[-1][1], GLD, 7))
    o.append(T(cx - 6, cy + 58, "ω を上げると時計回り", "middle", 9.5, GLD, True, halo=True))
    o.append(T(cx, cy + R + 32, "長さはいつも 1（0 dB）", "middle", 9.5, INK))
    # (b) 温度の板
    o.append(TX(330, 18, "(b) 温度の板 1.25e^{−20s}/(500s + 1)", "start", 11, INK, True))
    s_, pm, pp, h = _f08_bode(366, 40, 314, (0.0001, 1), (-60, 10), (-360, 0), hm=104, hp=140, gap=34, dbt=[-60, -40, -20, 0], pht=[-360, -270, -180, -90, 0])
    o.append(s_)
    wl = _f08_lw(0.0001, 1, 500)
    db, ph0 = _f08_bd([1.25], [500, 1], wl)
    _, ph1 = _f08_bd([1.25], [500, 1], wl, L=20)
    o.append(pm.line(_f08_pts(wl, db), c=SIG, lw=2.2))
    o.append(pp.line(_f08_pts(wl, ph0), c=MUT, lw=1.6, dash="5 3"))
    o.append(pp.clip(_f08_pts(wl, ph1), c=SIG, lw=2.2))
    o.append(T(pm.X(0.0003), pm.Y(-14), "ゲインは、むだ時間の有無で同じ", "start", 9.5, SIG, halo=True))
    for w, v in ((0.05, -145.0), (0.1, -203.4)):
        o.append(D(pp.X(w), pp.Y(v), GLD, 3.4))
    o.append(T(pp.X(0.05) - 6, pp.Y(-145) + 4, "0.05: −145.0°", "end", 9.5, GLD, True, halo=True))
    o.append(T(pp.X(0.1) - 6, pp.Y(-203.4) + 6, "0.1: −203.4°", "end", 9.5, GLD, True, halo=True))
    o.append(T(pp.X(0.00012), pp.Y(-90) + 14, "むだ時間なし（−90° で止まる）", "start", 9.5, MUT, halo=True))
    o.append(T(pp.X(0.00012), pp.Y(-270) + 4, "むだ時間 20 s あり", "start", 9.5, SIG, True, halo=True))
    return SVG(700, h + 4, o, "むだ時間の周波数応答。(a) e<sup>−jωL</sup> は長さ 1 の矢印で、角周波数を上げると、角度 −ωL で時計回りに限りなく回る（数字は ω [rad/s] と位相）。ゲインはどの角周波数でも 0 dB である。(b) 温度の板（時定数 500 s、むだ時間 20 s）のボード線図。ゲインはむだ時間の無い一次遅れと同じで、位相はむだ時間の無い場合（破線、−90° に近づく）より ωL だけ遅れ、上限なく遅れていく。")


F["e08_delay"] = _f08_delay_fig()


# =====================================================================
# 5 節: 折れ線で組み合わせる
# =====================================================================
def _f08_steps_fig():
    o = []
    wr = (0.5, 500)
    wl = _f08_lw(0.5, 500)
    rows = [("① 定数 10.5", lambda w: 20 * math.log10(10.5) + 0 * w, lambda w: 20 * math.log10(10.5) + 0 * w),
            ("② 積分 1/s", lambda w: -20 * _f08_np.log10(w), lambda w: -20 * _f08_np.log10(w)),
            ("③ 一次遅れ 1/(1 + s/20)", lambda w: -10 * _f08_np.log10(1 + (w / 20) ** 2), lambda w: _f08_np.where(w < 20, 0.0, -20 * _f08_np.log10(w / 20)))]
    y0 = 22
    for i, (lab, ex, asy) in enumerate(rows):
        o.append(T(14 if i == 0 else 30, y0, lab, "start", 10.5, INK, True))
        if i > 0:
            o.append(T(14, y0, "＋", "start", 11, INK, True))
        p = Plot(64, y0 + 10, 230, 62, wr, (-60, 40), xlog=True)
        o.append(p.axes(xl=None, yl=None, yt=[-40, 0, 40], xfmt=(lambda v: "%g" % v) if i == 2 else (lambda v: ""), yfmt=lambda v: ("%g" % v).replace("-", "−")))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.9))
        o.append(p.clip(_f08_pts(wl, asy(wl)), c=GLD, lw=1.6, dash="5 3"))
        o.append(p.clip(_f08_pts(wl, ex(wl)), c=SIG, lw=1.6))
        y0 += 96
    o.append(T(64 + 115, y0 + 4, "角周波数 ω [rad/s]", "middle", 9.5, MUT))
    o.append(T(14, y0 + 28, "＝ 漸近線の傾きの和", "start", 10.5, GLD, True))
    o.append(T(30, y0 + 46, "ω < 20: −20 dB/dec（②）", "start", 10, GLD))
    o.append(T(30, y0 + 62, "ω > 20: −20 − 20 = −40 dB/dec（②＋③）", "start", 10, GLD))
    # 右: 和
    o.append(TX(370, 18, "④ P(s)C(s) = 10.5/(s(1 + 0.05s))", "start", 11, INK, True))
    s_, pm, pp, h = _f08_bode(400, 34, 280, wr, (-60, 40), (-180, -90), hm=170, hp=110, gap=34, dbt=[-60, -40, -20, 0, 20, 40], pht=[-180, -135, -90])
    o.append(s_)
    db, ph = _f08_bd([10.5], [0.05, 1, 0], wl)
    asy = 20 * math.log10(10.5) - 20 * _f08_np.log10(wl) + _f08_np.where(wl < 20, 0.0, -20 * _f08_np.log10(wl / 20))
    o.append(pm.clip(_f08_pts(wl, asy), c=GLD, lw=2.0, dash="6 3"))
    o.append(pm.clip(_f08_pts(wl, db), c=SIG, lw=2.4))
    o.append(pp.line(_f08_pts(wl, ph), c=SIG, lw=2.4))
    o.append(pp.line([(0.5, -90), (500, -90)], c=MUT, lw=1.1, dash="4 3"))
    o.append(D(pm.X(1), pm.Y(20.42), GLD, 3.4))
    o.append(T(pm.X(1) + 6, pm.Y(20.42) - 6, "ω = 1 で 20.42 dB", "start", 9.5, GLD, True, halo=True))
    o.append(T(pm.X(2.6), pm.Y(2), "−20 dB/dec", "end", 9.5, GLD, True, halo=True))
    o.append(T(pm.X(60), pm.Y(-16), "−40 dB/dec", "start", 9.5, GLD, True, halo=True))
    o.append(D(pm.X(20), pm.Y(-5.60), GLD, 3.4)); o.append(D(pm.X(20), pm.Y(-8.61), SIG, 3.4))
    o.append(T(pm.X(20) + 5, pm.Y(-5.60) - 5, "−5.60", "start", 9.5, GLD, True, halo=True))
    o.append(T(pm.X(20) - 5, pm.Y(-8.61) + 13, "−8.61", "end", 9.5, SIG, True, halo=True))
    o.append(D(pm.X(9.487), pm.Y(0), SIG, 3.4))
    o.append(T(pm.X(9.487), pm.Y(0) - 8, "9.49", "middle", 9.5, SIG, True, halo=True))
    for i, l in enumerate(["折れ点 20 rad/s: 漸近線 −5.60 dB、", "本当の線 −8.61 dB（3.01 dB 下）", "0 dB を横切る: 本当 9.49 rad/s、", "漸近線では 10.5 rad/s"]):
        o.append(T(pm.X(0.56), pm.Y(-31) + i * 14, l, "start", 9.5, SIG if i in (1, 2) else GLD, False, halo=True))
    o.append(D(pp.X(20), pp.Y(-135), SIG, 3.4)); o.append(D(pp.X(9.487), pp.Y(-115.4), SIG, 3.4))
    o.append(T(pp.X(20) + 6, pp.Y(-135) + 12, "−135°（20 rad/s）", "start", 9.5, SIG, True, halo=True))
    o.append(T(pp.X(9.487) - 6, pp.Y(-115.4) - 2, "−115.4°", "end", 9.5, SIG, True, halo=True))
    o.append(T(pp.X(1.2), pp.Y(-90) - 6, "積分の −90°", "start", 9.5, MUT, halo=True))
    return SVG(700, max(h, y0 + 60) + 4, o, "モータの位置の比例制御の一巡伝達関数 10.5/(s(1 + 0.05s)) を、要素の和として描く手順。左の ①〜③ は要素ごとのゲイン（青）と漸近線（金の破線）で、dB で足すと右の ④ になる。漸近線は ω = 1 で 20.42 dB を通る −20 dB/dec の直線から始まり、折れ点 20 rad/s で −40 dB/dec に折れる。本当の線（青）は折れ点で 3.01 dB 下にあり、9.49 rad/s で 0 dB を横切る。位相は積分の −90° と一次遅れの位相の和で、20 rad/s で −135° になる。")


F["e08_steps"] = _f08_steps_fig()


def _f08_suspension_fig():
    o = []
    o.append(TX(14, 18, "(a) (1 + s/12.5)/(1 + 0.08s + 0.04s^2) の組み立て", "start", 11, INK, True))
    wr = (0.1, 100)
    wl = _f08_lw(0.1, 100, 600)
    s_, pm, pp, h = _f08_bode(56, 34, 380, wr, (-40, 20), (-180, 90), hm=150, hp=110, gap=34, dbt=[-40, -20, 0, 20], pht=[-180, -90, 0, 90])
    o.append(s_)
    a2 = _f08_np.where(wl < 5, 0.0, -40 * _f08_np.log10(wl / 5))
    az = _f08_np.where(wl < 12.5, 0.0, 20 * _f08_np.log10(wl / 12.5))
    o.append(pm.clip(_f08_pts(wl, a2), c=PUR, lw=1.4, dash="4 3"))
    o.append(pm.clip(_f08_pts(wl, az), c=GRN, lw=1.4, dash="4 3"))
    o.append(pm.clip(_f08_pts(wl, a2 + az), c=GLD, lw=2.0, dash="6 3"))
    db, ph = _f08_bd(_F08_SN, _F08_SD, wl)
    _, ph2 = _f08_bd([25], [1, 2, 25], wl)
    phz = _f08_np.degrees(_f08_np.arctan(wl / 12.5))
    o.append(pm.clip(_f08_pts(wl, db), c=SIG, lw=2.4))
    o.append(pp.line(_f08_pts(wl, ph2), c=PUR, lw=1.3))
    o.append(pp.line(_f08_pts(wl, phz), c=GRN, lw=1.3))
    o.append(pp.line(_f08_pts(wl, ph), c=SIG, lw=2.4))
    o.append(D(pm.X(4.824), pm.Y(8.74), SIG, 3.4))
    o.append(T(pm.X(4.824) - 6, pm.Y(8.74) - 4, "4.82 rad/s で 8.74 dB", "end", 9.5, SIG, True, halo=True))
    for i, (c, dsh, l) in enumerate(((PUR, "4 3", "二次遅れ（折れ点 5）"), (GRN, "4 3", "零点（折れ点 12.5）"), (GLD, "6 3", "和の折れ線 0 → −40 → −20 dB/dec"), (SIG, None, "本当の線"))):
        o.append(LEGL(pm.X(0.12), pm.Y(-17) + i * 14, [(c, dsh, l)], sz=9.5))
    o.append(T(pp.X(0.12), pp.Y(60), "零点（緑）・二次遅れ（紫）・和（青）", "start", 9.5, INK, halo=True))
    o.append(T(pp.X(90), pp.Y(-90) + 14, "−90° に近づく", "end", 9.5, SIG, True, halo=True))
    # (b) 路面の揺れと車体
    o.append(T(470, 18, "(b) 付け根（路面）と台車（車体）", "start", 11, INK, True))
    for k, (w, yb) in enumerate(((1.0, 40), (20.0, 196))):
        per = 2 * math.pi / w
        t = _f08_np.linspace(0, 2 * per, 400)
        g = complex(_f08_G(_F08_SN, _F08_SD, w))
        q = Plot(500, yb + 14, 186, 92, (0, 2 * per), (-3.2, 3.2))
        o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, round(per, 2), round(2 * per, 2)], yt=[-2, 0, 2], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
        o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=0.8))
        o.append(q.line(_f08_pts(t, 2 * _f08_np.sin(w * t)), c=GLD, lw=1.6))
        o.append(q.line(_f08_pts(t, 2 * abs(g) * _f08_np.sin(w * t + math.atan2(g.imag, g.real))), c=SIG, lw=2.2))
        o.append(T(500, yb + 6, "%g rad/s: 車体は %.3g 倍%s" % (w, abs(g), "（ほぼ従う）" if w < 2 else "（縮む）"), "start", 10, INK, True))
    o.append(LEGL(500, 354, [(GLD, None, "路面 ±2 cm"), (SIG, None, "車体")], sz=9.5, gap=10))
    return SVG(700, max(h, 362) + 4, o, "付け根を動かす台車（自動車のばねと緩衝器と同じ形）のボード線図を要素から組み立てる。(a) 二次遅れ（ω<sub>n</sub> = 5 rad/s、ζ = 0.2）の漸近線（紫の破線）と零点 12.5 rad/s の漸近線（緑の破線）を足すと、和の折れ線（金）は 0 dB → −40 → −20 dB/dec となる。本当の線（青）は 5 rad/s の近くに共振の山をもつ。位相は二次遅れと零点の和で、−90° に近づく。(b) 定常状態で、ゆっくりした路面の起伏には車体が従い、速い凹凸は縮んで伝わる。")


F["e08_suspension"] = _f08_suspension_fig()


def _f08_minphase_fig():
    o = []
    o.append(T(14, 18, "(a) ボイラの水位: 零点 +0.033 と −0.033", "start", 11, INK, True))
    wl = _f08_lw(0.001, 10, 600)
    s_, pm, pp, h = _f08_bode(56, 40, 286, (0.001, 10), (-20, 60), (-270, 0), hm=110, hp=130, gap=34, dbt=[-20, 0, 20, 40, 60], pht=[-270, -180, -90, 0])
    o.append(s_)
    db, phb = _f08_bd([-15, 0.5], [10, 1, 0], wl)
    _, phm = _f08_bd([15, 0.5], [10, 1, 0], wl)
    o.append(pm.line(_f08_pts(wl, db), c=SIG, lw=2.4))
    o.append(pp.line(_f08_pts(wl, phm), c=GRN, lw=2.2))
    o.append(pp.line(_f08_pts(wl, phb), c=ALI, lw=2.2))
    o.append(T(pm.X(0.4), pm.Y(30), "ゲインは 2 つとも同じ", "start", 9.5, SIG, True, halo=True))
    o.append(T(pp.X(0.0012), pp.Y(-58), "零点 −0.033（最小位相）", "start", 9.5, GRN, True, halo=True))
    o.append(T(pp.X(0.0012), pp.Y(-252), "零点 +0.033（ボイラ）", "start", 9.5, ALI, True, halo=True))
    o.append(D(pp.X(0.0577), pp.Y(-60), GRN, 3.2)); o.append(D(pp.X(0.0577), pp.Y(-180), ALI, 3.2))
    o.append(T(pp.X(0.0577) + 6, pp.Y(-60) - 4, "−60°", "start", 9.5, GRN, True, halo=True))
    o.append(T(pp.X(0.0577) - 6, pp.Y(-180) + 14, "−180°", "end", 9.5, ALI, True, halo=True))
    o.append(T(pp.X(1) + 4, pp.Y(-262.4) - 6, "−262°", "start", 9.5, ALI, True, halo=True))
    # (b) 温度の板
    o.append(T(376, 18, "(b) 温度の板: むだ時間の有無", "start", 11, INK, True))
    wl2 = _f08_lw(0.0001, 1, 600)
    s2, qm, qp, h2 = _f08_bode(410, 40, 270, (0.0001, 1), (-60, 10), (-360, 0), hm=110, hp=130, gap=34, dbt=[-60, -40, -20, 0], pht=[-360, -270, -180, -90, 0])
    o.append(s2)
    db2, p0 = _f08_bd([1.25], [500, 1], wl2)
    _, p1 = _f08_bd([1.25], [500, 1], wl2, L=20)
    o.append(qm.line(_f08_pts(wl2, db2), c=SIG, lw=2.4))
    o.append(qp.line(_f08_pts(wl2, p0), c=GRN, lw=2.2))
    o.append(qp.clip(_f08_pts(wl2, p1), c=ALI, lw=2.2))
    o.append(T(qm.X(0.0003), qm.Y(-14), "ゲインは 2 つとも同じ", "start", 9.5, SIG, True, halo=True))
    o.append(T(qp.X(0.00012), qp.Y(-90) + 14, "むだ時間なし（最小位相）", "start", 9.5, GRN, True, halo=True))
    o.append(T(qp.X(0.00012), qp.Y(-300), "むだ時間 20 s（ωL だけ遅れる）", "start", 9.5, ALI, True, halo=True))
    return SVG(700, max(h, h2) + 4, o, "ゲインが同じで位相が違う伝達関数。(a) ボイラの水位 (−15s + 0.5)/(s(10s + 1)) と、零点を左半平面へ移した (15s + 0.5)/(s(10s + 1)) は、ゲインがどの角周波数でも同じだが、右半平面の零点をもつボイラ（赤）の位相は −270° まで遅れる。(b) 温度の板の、むだ時間 20 s の有無。ゲインは同じで、むだ時間のある方（赤）は ωL だけ遅れる。どちらも、最小位相のもの（緑）の位相の遅れが最も小さい。")


F["e08_minphase"] = _f08_minphase_fig()


# =====================================================================
# 6 節: 時間応答との関係
# =====================================================================
def _f08_bw_fig():
    o = []
    cases = [(0.21, GRN), (1.0, GLD), (10.0, ALI)]
    o.append(TX(14, 18, "(a) 閉ループ G_{yr} のゲイン（モータの位置の比例制御）", "start", 11, INK, True))
    p = Plot(64, 40, 300, 180, (1, 1000), (-30, 18), xlog=True)
    o.append(p.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [dB]", yt=[-30, -20, -10, -3, 0, 10], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(p.x, p.Y(-3.01), p.x + p.w, p.Y(-3.01), c=MUT, lw=1.1, dash="5 3"))
    wl = _f08_lw(1, 1000, 600)
    info = {0.21: (14.84, 0.1447, None), 1.0: (45.61, 0.0425, (28.28, 4.44)), 10.0: (154.3, 0.0110, (98.99, 14.02))}
    for kp, c in cases:
        Gyr, _Gyd, _S = CLOOP([50.0], [0.05, 1.0, 0.0], [kp], [1.0])
        db, _ = _f08_bd(list(Gyr[0]), list(Gyr[1]), wl)
        o.append(p.clip(_f08_pts(wl, db), c=c, lw=2.2))
        wb, tr, pk = info[kp]
        o.append(D(p.X(wb), p.Y(-3.01), c, 3.6))
        if pk:
            o.append(D(p.X(pk[0]), p.Y(pk[1]), c, 3.2))
    o.append(T(p.X(14.84) - 5, p.Y(-3.01) + 15, "14.8", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(45.61) - 5, p.Y(-3.01) + 15, "45.6", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(154.3) + 6, p.Y(-3.01) + 15, "154", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(28.28) - 6, p.Y(4.44) - 6, "4.44 dB", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(98.99) - 6, p.Y(14.02) - 2, "14.0 dB", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1.15), p.Y(-13), "破線: −3.01 dB（バンド幅を読む線）", "start", 9.5, MUT, halo=True))
    o.append(LEGL(64, 268, [(GRN, None, "K_P = 0.21 V/rad"), (GLD, None, "1 V/rad"), (ALI, None, "10 V/rad")], sz=10, gap=16))
    # (b) ステップ応答
    o.append(T(420, 18, "(b) ステップ応答（目標 1 rad）", "start", 11, INK, True))
    q = Plot(440, 40, 240, 180, (0, 0.4), (0, 1.8))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 0.5, 1, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=MUT, lw=1, dash="4 3"))
    t = _f08_np.linspace(0, 0.4, 1601)
    for j, (kp, c) in enumerate(cases):
        Gyr, _Gyd, _S = CLOOP([50.0], [0.05, 1.0, 0.0], [kp], [1.0])
        _, y = _f08_sg.step((Gyr[0], Gyr[1]), T=t)
        o.append(q.line(_f08_pts(t, y), c=c, lw=2.2))
        i10 = int(_f08_np.argmax(y >= 0.1)); i90 = int(_f08_np.argmax(y >= 0.9))
        yy = 0.44 + 0.08 * j
        o.append(W(q.X(t[i10]), q.Y(yy), q.X(t[i90]), q.Y(yy), c=c, lw=3.2))
    o.append(TX(q.X(0.4) - 2, q.Y(0.36), "t_r = 0.145 s・0.0425 s・0.0110 s", "end", 9.5, INK, halo=True))
    o.append(TX(q.X(0.4) - 2, q.Y(0.22), "ω_b × t_r = 2.15・1.94・1.70", "end", 9.5, INK, halo=True))
    o.append(T(q.X(0.4) - 2, q.Y(1.72), "行き過ぎ 5.0 %・35.1 %・72.9 %", "end", 9.5, INK, halo=True))
    return SVG(700, 280, o, "モータの位置の比例制御の閉ループ伝達関数 1000K<sub>P</sub>/(s<sup>2</sup> + 20s + 1000K<sub>P</sub>) を、比例ゲイン 3 通りで比べる。(a) 比例ゲインを上げると、ゲインが −3.01 dB になる角周波数（バンド幅、点）が広がり、共振ピークが高くなる。(b) ステップ応答では、立ち上がり時間（太い横線は 10 % から 90 % までの時間）が縮み、行き過ぎ量が大きくなる。バンド幅と立ち上がり時間の積は 2 前後である。")


F["e08_bw"] = _f08_bw_fig()


def _f08_peak_fig():
    o = []
    o.append(T(14, 18, "(a) 共振ピークと行き過ぎ量（二次遅れ）", "start", 11, INK, True))
    p = Plot(64, 40, 270, 200, (0, 20), (0, 100))
    o.append(p.axes(xl="共振ピーク M_r [dB]", yl="行き過ぎ量 M_p [%]", xt=[0, 5, 10, 15, 20], yt=[0, 20, 40, 60, 80, 100], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    zs = _f08_np.linspace(0.05, 0.7071, 300)
    mr = 20 * _f08_np.log10(1 / (2 * zs * _f08_np.sqrt(1 - zs * zs)))
    mp = 100 * _f08_np.exp(-math.pi * zs / _f08_np.sqrt(1 - zs * zs))
    o.append(p.line(_f08_pts(mr, mp), c=SIG, lw=2.2))
    o.append(p.line([(0, 4.32), (0, 0)], c=SIG, lw=2.2, dash="4 3"))
    for z in (0.1, 0.2, 0.3, 0.4, 0.5, 0.6):
        m1 = 20 * math.log10(1 / (2 * z * math.sqrt(1 - z * z))); m2 = 100 * math.exp(-math.pi * z / math.sqrt(1 - z * z))
        o.append(D(p.X(m1), p.Y(m2), SIG, 3))
        if z < 0.55 and z != 0.3:
            o.append(T(p.X(m1) + 6, p.Y(m2) + 12, "ζ %g" % z, "start", 9.5, SIG, halo=True))
        elif z == 0.3:
            o.append(T(p.X(m1) - 8, p.Y(m2) - 4, "ζ 0.3", "end", 9.5, SIG, halo=True))
    o.append(T(p.X(2.2), p.Y(5), "ζ ≥ 0.707: 0 dB・4.3 % 以下", "start", 9.5, SIG, halo=True))
    o.append(D(p.X(4.44), p.Y(35.1), GLD, 4.5)); o.append(D(p.X(14.02), p.Y(72.9), ALI, 4.5))
    o.append(TX(p.X(4.44) + 8, p.Y(35.1) + 16, "モータ K_P = 1", "start", 9.5, GLD, True, halo=True))
    o.append(TX(p.X(14.02) - 6, p.Y(72.9) - 8, "モータ K_P = 10", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(8.14) + 8, p.Y(52.7) - 10, "台車とばね", "start", 9.5, PUR, True, halo=True))
    o.append(CIRC(p.X(8.14), p.Y(52.7), 6, c=PUR, lw=1.6))
    # (b) 3 つの ζ
    o.append(T(380, 18, "(b) ζ = 0.1・0.3・0.6 のゲインとステップ応答", "start", 11, INK, True))
    q = Plot(410, 40, 270, 90, (0.1, 10), (-30, 16), xlog=True)
    o.append(q.axes(xl="ω/ω_n", yl="ゲイン [dB]", yt=[-20, 0, 15], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    r = Plot(410, 176, 270, 64, (0, 15), (0, 1.9))
    o.append(r.axes(xl="ω_n t", yl=None, xt=[0, 5, 10, 15], yt=[0, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(W(r.x, r.Y(1), r.x + r.w, r.Y(1), c=MUT, lw=1, dash="4 3"))
    wl = _f08_lw(0.1, 10, 500)
    t = _f08_np.linspace(0, 15, 1500)
    for z, c in ((0.1, ALI), (0.3, GLD), (0.6, GRN)):
        db, _ = _f08_bd([1], [1, 2 * z, 1], wl)
        o.append(q.clip(_f08_pts(wl, db), c=c, lw=2))
        _, y = _f08_sg.step(([1], [1, 2 * z, 1]), T=t)
        o.append(r.line(_f08_pts(t, y), c=c, lw=2))
    o.append(T(q.X(1.3), q.Y(14) + 4, "14.0 dB", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(1.35), q.Y(4.85) + 8, "4.85", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(0.12), q.Y(-22), "0.35 dB（ζ 0.6）", "start", 9.5, GRN, True, halo=True))
    o.append(T(r.X(4.5), r.Y(1.73) + 2, "72.9 %", "start", 9.5, ALI, True, halo=True))
    o.append(T(r.X(13.5), r.Y(1.55), "37.2 %・9.5 %", "end", 9.5, INK, halo=True))
    return SVG(700, 280, o, "二次遅れの共振ピークと行き過ぎ量。(a) どちらも減衰比 ζ だけで決まるので、1 本の曲線の上に並ぶ（点は ζ = 0.1〜0.6）。共振ピークが高いほど、行き過ぎ量は大きい。ζ が 0.707 以上では共振の山は無く、行き過ぎ量は 4.3 % 以下である。モータの位置の比例制御と台車とばね・ダンパの値も、この曲線の上にある。(b) 共振ピークの高い ζ = 0.1 は大きく行き過ぎて長く揺れ、山の無い ζ = 0.6 はわずかに行き過ぎるだけである。")


F["e08_peak"] = _f08_peak_fig()


# ---- 周波数掃引（デモ w08_sweep と同じ計算。U.rng を移したもの） ----
def _f08_i32(x):
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x & 0x80000000 else x


def _f08_imul(a, b):
    return _f08_i32(((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF)


class _f08_Rng:
    def __init__(self, seed):
        self.a = (seed & 0xFFFFFFFF) or 1

    def nx(self):
        a = _f08_i32(_f08_i32(self.a) + 0x6D2B79F5)
        self.a = a
        t = _f08_imul(a ^ ((a & 0xFFFFFFFF) >> 15), 1 | a)
        t = _f08_i32(t + _f08_imul(t ^ ((t & 0xFFFFFFFF) >> 7), 61 | t)) ^ t
        return ((t ^ ((t & 0xFFFFFFFF) >> 14)) & 0xFFFFFFFF) / 4294967296.0

    def normal(self):
        u = 1 - self.nx(); v = self.nx()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


def _f08_sweep(seed=1, nper=3, ppd=3, M=100):
    """温度の板（K 1.25 K/W、T 500 s、L 20 s、40 W ± 40 W、ノイズ 0.3 K）の周波数掃引。"""
    K, Tc, L, amp, sd = 1.25, 500.0, 20.0, 40.0, 0.3
    rg = _f08_Rng(seed)
    wlo, whi = 0.001, 0.2
    n = int(round(math.log10(whi / wlo) * ppd)) + 1
    out, ttot = [], 0.0
    for k in range(n):
        w = wlo * (whi / wlo) ** (k / (n - 1))
        P = 2 * math.pi / w; dt = P / M
        Wp = max(1, math.ceil(5 * Tc / P))
        a = math.exp(-dt / Tc); x = 0.0; ss = sc = 0.0; rec = []
        for i in range((Wp + nper) * M):
            t = i * dt
            if i >= Wp * M:
                yv = x + sd * rg.normal()
                ss += yv * math.sin(w * t); sc += yv * math.cos(w * t)
                rec.append((t - Wp * P, yv))
            tm = t + dt / 2 - L
            u = amp * math.sin(w * tm) if tm >= 0 else 0.0
            x = a * x + (1 - a) * K * u
        re_, im_ = 2 * ss / (nper * M) / amp, 2 * sc / (nper * M) / amp
        out.append(dict(w=w, gain=math.hypot(re_, im_), ph=math.degrees(math.atan2(im_, re_)), rec=rec, P=P, re=re_, im=im_))
        ttot += (Wp + nper) * P
    prev = None
    for r in out:
        if prev is None:
            while r["ph"] > 90:
                r["ph"] -= 360
        else:
            while r["ph"] - prev > 180:
                r["ph"] -= 360
            while r["ph"] - prev < -180:
                r["ph"] += 360
        prev = r["ph"]
    best = None
    for i in range(801):
        Tf = 10 ** (1 + 3 * i / 800)
        rr = [20 * math.log10(q["gain"]) + 10 * math.log10(1 + (q["w"] * Tf) ** 2) for q in out]
        kdb = sum(rr) / len(rr)
        e = sum((v - kdb) ** 2 for v in rr)
        if best is None or e < best[0]:
            best = (e, Tf, 10 ** (kdb / 20))
    _, Tf, Kf = best
    num = den = 0.0
    for q in out:
        res = -math.radians(q["ph"]) - math.atan(q["w"] * Tf)
        num += q["w"] * res; den += q["w"] ** 2
    return out, ttot, Kf, Tf, num / den


def _f08_sweep_fig():
    out, ttot, Kf, Tf, Lf = _f08_sweep()
    o = []
    o.append(T(14, 18, "(a) 記録の例（平均に使う 3 周期。点は測った温度、青は求めた正弦波）", "start", 11, INK, True))
    for j, (idx, x0) in enumerate(((3, 64), (6, 400))):
        r = out[idx]
        P = r["P"]; g = r["gain"] * 40; phr = math.radians(r["ph"])
        ymax = max(abs(v) for _, v in r["rec"])
        lim = math.ceil(ymax * 1.15 * 2) / 2
        o.append(T(x0, 40, "ω = %.4g rad/s（周期 %.0f s）: 振幅 %.2f K" % (r["w"], P, g), "start", 10, INK, True))
        # 入力の帯
        yb = 50
        o.append(RECT(x0, yb, 270, 18, 2, SCR, LIN, 0.8))
        tt = _f08_np.linspace(0, 3 * P, 300)
        o.append(PL([(x0 + t_ / (3 * P) * 270, yb + 9 - 7 * math.sin(r["w"] * t_)) for t_ in tt], c=GLD, lw=1.3))
        o.append(T(x0 - 6, yb + 13, "入力", "end", 9.5, GLD))
        p = Plot(x0, 76, 270, 96, (0, 3 * P), (-lim, lim))
        xt = [0, round(P), round(2 * P), round(3 * P)]
        o.append(p.axes(xl="平均に使う記録の時間 [s]", yl="温度のずれ [K]" if j == 0 else None, xt=xt, yt=[-lim, 0, lim], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
        for t_, v in r["rec"][::2]:
            o.append(D(p.X(t_), p.Y(v), TEA, 1.3))
        o.append(p.line([(t_, g * math.sin(r["w"] * t_ + phr)) for t_ in tt], c=SIG, lw=2))
    # (b) ボード線図
    o.append(T(14, 228, "(b) 測った点（8 点）と本当の線・合わせたモデル", "start", 11, INK, True))
    s_, pm, pp, h = _f08_bode(64, 246, 400, (0.0005, 0.5), (-45, 5), (-360, 0), hm=110, hp=130, gap=34, dbt=[-40, -20, 0], pht=[-360, -270, -180, -90, 0])
    o.append(s_)
    wl = _f08_lw(0.0005, 0.5, 500)
    db, ph = _f08_bd([1.25], [500, 1], wl, L=20)
    _, ph0 = _f08_bd([1.25], [500, 1], wl)
    dbf, phf = _f08_bd([Kf], [Tf, 1], wl, L=Lf)
    o.append(pm.line(_f08_pts(wl, db), c=SIG, lw=2.2))
    o.append(pm.line(_f08_pts(wl, dbf), c=GLD, lw=1.6, dash="5 3"))
    o.append(pp.line(_f08_pts(wl, ph0), c=MUT, lw=1.4, dash="4 3"))
    o.append(pp.clip(_f08_pts(wl, ph), c=SIG, lw=2.2))
    o.append(pp.clip(_f08_pts(wl, phf), c=GLD, lw=1.6, dash="5 3"))
    for r in out:
        o.append(CIRC(pm.X(r["w"]), pm.Y(20 * math.log10(r["gain"])), 3.6, c=TEA, lw=2, fill=SCR))
        o.append(CIRC(pp.X(r["w"]), pp.Y(r["ph"]), 3.6, c=TEA, lw=2, fill=SCR))
    o.append(T(pp.X(0.0006), pp.Y(-90) + 14, "むだ時間の無い一次遅れ（−90° で止まる）", "start", 9.5, MUT, halo=True))
    lx = 500
    o.append(T(lx, 262, "合わせた値（本当の値）", "start", 10.5, INK, True))
    for i, l in enumerate(["K = %.3f K/W（1.25）" % Kf, "T = %.0f s（500）" % Tf, "L = %.1f s（20）" % Lf]):
        o.append(T(lx, 282 + i * 17, l, "start", 10, GLD, True))
    o.append(T(lx, 346, "かかった時間 %.1f 時間" % (ttot / 3600), "start", 10, INK, True))
    o.append(T(lx, 362, "（ステップ応答は 4000 s）", "start", 9.5, MUT))
    o.append(LEGL(lx, 396, [(SIG, None, "本当の線")], sz=9.5))
    o.append(LEGL(lx, 414, [(GLD, "5 3", "合わせたモデル")], sz=9.5))
    o.append(CIRC(lx + 12, 428, 3.6, c=TEA, lw=2, fill=SCR))
    o.append(T(lx + 30, 432, "測った点", "start", 9.5, MUT))
    return SVG(700, h + 4, o, "温度の板の周波数掃引（ヒータ 40 W のまわりに振幅 40 W の正弦波、観測ノイズ 0.3 K、1 ディケードに 3 点、各点で 2500 s 以上待ってから 3 周期を平均）。(a) 測った温度（点）に sin と cos を掛けて平均し、ゲインと位相を求める。高い角周波数ほど振幅が小さく、ノイズの影響が大きい。(b) 測った点は本当の線の近くに並び、位相はむだ時間の分だけ −90° より遅れていく。点に合わせたモデルは K・T・L をほぼ正しく与えるが、測るのに 16.8 時間かかる。")


F["e08_sweep"] = _f08_sweep_fig()
