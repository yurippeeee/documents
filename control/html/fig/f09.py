# -*- coding: utf-8 -*-
# 09 章 安定性と安定余裕 の図
import numpy as _f09_np
from scipy.optimize import brentq as _f09_brentq
from scipy.optimize import fsolve as _f09_fsolve
from scipy.linalg import expm as _f09_expm
from scipy import signal as _f09_sg

# =====================================================================
# 補助
# =====================================================================
def _f09_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f09_g(v, d=3):
    """有効数字 d 桁（負号は −）。"""
    return (("%." + str(d) + "g") % v).replace("-", "−")


def _f09_n(v):
    return ("%g" % v).replace("-", "−")


# ---- 例の一巡伝達関数 P(s)C(s)（s は複素数の配列でもよい） ----
def _f09_Lcart(s, K, L=0.1):
    """台車の速度（質量 1 kg、減衰係数 2 N·s/m）の比例制御。測った値の遅れ L を含む。"""
    s = _f09_np.asarray(s, dtype=complex)
    return K * _f09_np.exp(-L * s) / (s + 2.0)


def _f09_Lmotor(s, K, La=True):
    """モータの位置の比例制御。La=True で巻線のインダクタンスを含む 2×10⁶/(s(s² + 2000s + 40000))。"""
    s = _f09_np.asarray(s, dtype=complex)
    if La:
        return 2e6 * K / (s * (s * s + 2000.0 * s + 40000.0))
    return 50.0 * K / (s * (0.05 * s + 1.0))


def _f09_Lplate(s, K, L=20.0):
    """温度の板（1.25 K/W、時定数 500 s、むだ時間 L）の比例制御。K は W/K。"""
    s = _f09_np.asarray(s, dtype=complex)
    return 1.25 * K * _f09_np.exp(-L * s) / (500.0 * s + 1.0)


def _f09_jw(Lf, ws):
    return Lf(1j * _f09_np.asarray(ws, dtype=float))


def _f09_lw(a, b, n=600):
    return _f09_np.logspace(math.log10(a), math.log10(b), n)


def _f09_phase(Lf, ws, start=0.0):
    """位相 [°]（連続につなぐ。最も低い角周波数の値を start の近くにそろえる）。"""
    g = _f09_jw(Lf, ws)
    ph = _f09_np.degrees(_f09_np.unwrap(_f09_np.angle(g)))
    return ph + 360.0 * round((start - ph[0]) / 360.0)


def _f09_wpc_cart(L):
    """台車の位相が −180° になる角周波数。"""
    return _f09_brentq(lambda w: math.atan(w / 2.0) + w * L - math.pi, 1e-6, math.pi / L)


def _f09_wpc_plate(L=20.0):
    return _f09_brentq(lambda w: math.atan(500.0 * w) + w * L - math.pi, 1e-7, math.pi / L)


_F09_WPC = _f09_wpc_cart(0.1)                     # 16.89 rad/s
_F09_KB = math.hypot(_F09_WPC, 2.0)               # 境目の比例ゲイン 17.0 N/(m/s)


def _f09_sim_cart(K, L=0.1, tend=3.0, dt=2e-4, u0=2.0, r=1.0):
    """1 章の台車の速度: u = u0 + K (r − 測った速度)、測った速度は L 遅れる。厳密な離散化。返り値 (t, v)。"""
    n = int(round(tend / dt)); nd = int(round(L / dt)); a = math.exp(-2.0 * dt)
    v = _f09_np.zeros(n + 1)
    for k in range(n):
        vm = v[k - nd] if k >= nd else 0.0
        u = u0 + K * (r - vm)
        vi = u / 2.0
        v[k + 1] = vi + (v[k] - vi) * a
        if abs(v[k + 1]) > 1e3:
            v[k + 1:] = _f09_np.nan
            break
    return _f09_np.arange(n + 1) * dt, v


def _f09_cart_root(K, L=0.1, guess=(-1.0, 16.0)):
    """閉ループの特性方程式 s + 2 + K e^{−Ls} = 0 の根（初めの値の近くのもの）。"""
    def f(x):
        s = complex(x[0], x[1]); v = s + 2.0 + K * _f09_np.exp(-L * s)
        return [v.real, v.imag]
    r = _f09_fsolve(f, list(guess), xtol=1e-12)
    return complex(r[0], r[1])


def _f09_sim_tf(num, den, K, L=0.0, tend=1.0, dt=1e-4, r=1.0, ff=0.0):
    """有理式の制御対象 num/den（出力が L 遅れる）を比例制御 u = ff r + K (r − y) したときの y。零次ホールドの厳密な離散化。"""
    A, B, C, D = _f09_sg.tf2ss(num, den)
    n = A.shape[0]
    M = _f09_np.zeros((n + 1, n + 1)); M[:n, :n] = A * dt; M[:n, n:] = B * dt
    E = _f09_expm(M); Ad, Bd = E[:n, :n], E[:n, n:]
    N = int(round(tend / dt)); nd = int(round(L / dt))
    x = _f09_np.zeros((n, 1)); y = _f09_np.zeros(N + 1); yr = _f09_np.zeros(N + 1)
    for k in range(N + 1):
        yr[k] = float((C @ x)[0, 0])
        y[k] = yr[k - nd] if k >= nd else 0.0
        u = ff * r + K * (r - y[k])
        x = Ad @ x + Bd * u
        if abs(y[k]) > 1e6:
            y[k + 1:] = _f09_np.nan
            break
    return _f09_np.arange(N + 1) * dt, y


# ---- 複素平面の地 ----
def _f09_cplane(x, y, w, h, xr, yr, xt, yt, unit=True, m1=True, sz=9, lab=True, grid=True):
    """複素平面（ナイキスト線図の地）。縦と横の目盛の間隔をそろえる（w/(xr 幅) = h/(yr 幅) にする）。返り値 (svg, Plot)。"""
    p = Plot(x, y, w, h, xr, yr)
    o = [RECT(x, y, w, h, 0, SCR, LIN, 0.8)]
    if grid:
        for v in xt:
            o.append(W(p.X(v), y, p.X(v), y + h, c=GRD, lw=1))
        for v in yt:
            o.append(W(x, p.Y(v), x + w, p.Y(v), c=GRD, lw=1))
    for v in xt:
        o.append(W(p.X(v), y + h, p.X(v), y + h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), y + h + 14, _f09_n(v), "middle", sz, MUT))
    for v in yt:
        o.append(W(x - 4, p.Y(v), x, p.Y(v), c=MUT, lw=1))
        o.append(T(x - 6, p.Y(v) + 3.2, _f09_n(v), "end", sz, MUT))
    if yr[0] < 0 < yr[1]:
        o.append(W(x, p.Y(0), x + w, p.Y(0), c=MUT, lw=1))
    if xr[0] < 0 < xr[1]:
        o.append(W(p.X(0), y, p.X(0), y + h, c=MUT, lw=1))
    if unit:
        pts = [(math.cos(a), math.sin(a)) for a in _f09_np.linspace(0, 2 * math.pi, 181)]
        o.append(p.clip(pts, c=FNT, lw=1.1, dash="4 3"))
    if lab:
        o.append(T(x + w - 3, p.Y(0) - 5 if yr[0] < 0 < yr[1] else y + h - 4, "実部", "end", sz, MUT, halo=True))
        o.append(T(p.X(0) + 4 if xr[0] < 0 < xr[1] else x + 4, y + 11, "虚部", "start", sz, MUT, halo=True))
    return "".join(o), p


def _f09_m1(p, lab=True, a="above"):
    """−1 の点（赤い ×）。"""
    xx, yy = p.X(-1), p.Y(0)
    o = [W(xx - 5, yy - 5, xx + 5, yy + 5, c=ALI, lw=2.2), W(xx - 5, yy + 5, xx + 5, yy - 5, c=ALI, lw=2.2)]
    if lab:
        o.append(T(xx, yy - 9 if a == "above" else yy + 18, "−1", "middle", 10, ALI, True, halo=True))
    return "".join(o)


def _f09_cpts(vals):
    return [(float(v.real), float(v.imag)) for v in vals]


def _f09_arrow_mid(p, vals, k, c, head=7):
    """曲線 vals（複素数の並び）の k 番目の点に、進む向きの矢じりを置く。"""
    a, b = vals[k - 1], vals[k + 1]
    return _head(p.X(a.real), p.Y(a.imag), p.X(b.real), p.Y(b.imag), c, head)


def _f09_bode(x, y, w, wr, dbr, phr, hm=110, hp=110, gap=30, dbt=None, pht=None, xl="角周波数 ω [rad/s]"):
    """BODE の軸だけ（線は clip で足す）。返り値 (svg, ゲインの Plot, 位相の Plot, 高さ)。"""
    return BODE(x, y, w, [], wr, dbr, phr, hm, hp, gap, dbt, pht, xl)


def _f09_sine(p, amp, ph_deg, c, lw=2.0, n=240, dash=None, x0=0.0, x1=720.0):
    """横軸を ωt [°] とした正弦波 amp sin(ωt + ph)。"""
    pts = [(a, amp * math.sin(math.radians(a + ph_deg))) for a in _f09_np.linspace(x0, x1, n)]
    return p.clip(pts, c=c, lw=lw, dash=dash)


# =====================================================================
# 1 節: ループを切って正弦波を一周させる
# =====================================================================
def _f09_cutloop_fig():
    o = []
    R = 15
    o.append(T(14, 18, "(a) ループを加え合わせ点の後で切り、切り口から正弦波を入れる（目標値は 0）", "start", 11.5, INK, True))
    yc = 76
    xs = 80
    o.append(ARR(20, yc, xs - R, yc, c=MUT, lw=1.6))
    o.append(TX(22, yc - 9, "r = 0", "start", 10, MUT, True))
    o.append(SUMJ(xs, yc, {"l": "+", "b": "−"}))
    xcut = 206
    o.append(ARR(xs + R, yc, xcut - 9, yc, c=SIG, lw=1.8))
    o.append(W(xcut - 6, yc - 11, xcut - 6, yc + 11, c=INK, lw=2.2))
    o.append(W(xcut + 6, yc - 11, xcut + 6, yc + 11, c=INK, lw=2.2))
    o.append(T(xcut, yc - 17, "切る", "middle", 9.5, INK, True))
    o.append(TX((xs + R + xcut - 9) / 2, yc - 8, "戻る信号 B", "middle", 10, SIG, True, halo=True))
    s, P, xe = CHAIN(xcut + 9, yc, [("a", 76, "入れる信号 A", GLD), ("b", "K_P", "c", SIG, SSOFT), ("a", 46, "u", GLD),
                                    ("b", ("e^{−0.1s}", "s + 2"), "p", SIG, SSOFT), ("a", 50, None, SIG), ("t", "bp", SIG),
                                    ("a", 56, "y", SIG)])
    o.append(s)
    o.append(TX(xcut + 12, yc + 22, "A = sin ωt", "start", 10, GLD, True))
    o.append(T((P["c"][0] + P["c"][1]) / 2, yc + 31, "制御器", "middle", 9.5, MUT))
    o.append(T((P["p"][0] + P["p"][1]) / 2, yc + 36, "台車（測った値の遅れを含む）", "middle", 9.5, MUT))
    o.append(FBPATH(P["bp"], xs, yc, 66, SIG))
    o.append(TX((P["bp"] + xs) / 2 + 40, yc + 60, "y が加え合わせ点で符号を変えて B = −y になる", "middle", 10, SIG, True, halo=True))
    xr = xe + 8
    o.append(TX(xr, yc - 6, "B = −P(s)C(s)A", "start", 10.5, INK, True))
    o.append(T(xr, yc + 11, "（7 章 2 節）", "start", 9.5, MUT))
    # (b) 3 つの比例ゲイン
    yb = 178
    o.append(T(14, yb, "(b) ω = 16.9 rad/s（周期 0.372 s）で入れたとき、戻る波 B は A と同じ向きになる", "start", 11.5, INK, True))
    for i, (K, col) in enumerate(((10.0, GRN), (_F09_KB, SIG), (25.0, ALI))):
        x0 = 62 + i * 214
        p = Plot(x0, yb + 26, 168, 92, (0, 720), (-1.6, 1.6))
        o.append(p.axes(xl=None, yl=None, xt=[0, 180, 360, 540, 720], yt=[-1, 0, 1], sz=9))
        o.append(_f09_sine(p, 1.0, 0.0, GLD, 1.8))
        g = K / _F09_KB
        o.append(_f09_sine(p, g, 0.0, SIG, 2.2))
        o.append(TX(x0 + 84, yb + 20, "K_P = %s N/(m/s)" % ("17.0" if i == 1 else "%g" % K), "middle", 10, col, True))
        lab = ["B は A の %.2f 倍（小さい）" % g, "B は A とちょうど同じ", "B は A の %.2f 倍（大きい）" % g][i]
        o.append(T(x0 + 84, yb + 26 + 92 + 30, lab, "middle", 10, col, True))
    o.append(LEGL(62, yb + 172, [(GLD, None, "入れた A"), (SIG, None, "戻る B")]))
    o.append(T(686, yb + 172, "横軸は ωt [°]（1 周期が 360°）", "end", 9.5, MUT))
    return SVG(700, yb + 180, o, "(a) ループを加え合わせ点の後で切り、切り口から正弦波 A を入れると、A は制御器と制御対象を通って y になり、加え合わせ点で符号を変えて、切り口のもう片側に B として戻る。(b) 1 章の台車（測った速度が 0.1 s 遅れて届く）で、ω = 16.9 rad/s の A を入れると、十分に時間がたった後の B は A と同じ向き（同じ位相）になる。B の大きさは比例ゲインに比例し、K<sub>P</sub> = 17.0 N/(m/s) でちょうど A と同じになる。")


F["e09_cutloop"] = _f09_cutloop_fig()


def _f09_phase180_fig():
    o = []
    K = _F09_KB
    o.append(TX(14, 18, "(a) 一巡伝達関数のボード線図（K_P = 17.0 N/(m/s)）", "start", 11.5, INK, True))
    ws = _f09_lw(0.3, 100, 500)
    Ld = lambda s: _f09_Lcart(s, K, 0.1)
    L0 = lambda s: _f09_Lcart(s, K, 0.0)
    svg, pm, pp, hh = _f09_bode(62, 34, 300, (0.3, 100), (-20, 30), (-360, 0), hm=110, hp=120, gap=28,
                                dbt=[-20, -10, 0, 10, 20, 30], pht=[-360, -270, -180, -90, 0])
    o.append(svg)
    for Lf, c, d in ((L0, MUT, "5 3"), (Ld, SIG, None)):
        g = _f09_jw(Lf, ws)
        o.append(pm.clip(list(zip(ws, 20 * _f09_np.log10(_f09_np.abs(g)))), c=c, lw=2.0, dash=d))
        o.append(pp.clip(list(zip(ws, _f09_phase(Lf, ws, 0.0))), c=c, lw=2.0, dash=d))
    w0 = _F09_WPC
    o.append(W(pm.X(w0), pm.y, pm.X(w0), pp.y + pp.h, c=ALI, lw=1.1, dash="3 3"))
    o.append(D(pm.X(w0), pm.Y(0), ALI, 3.6)); o.append(D(pp.X(w0), pp.Y(-180), ALI, 3.6))
    o.append(T(pm.X(w0) + 5, pm.Y(0) - 7, "16.9 rad/s で 0 dB", "start", 9.5, ALI, True, halo=True))
    o.append(T(pp.X(w0) + 5, pp.Y(-180) + 14, "16.9 rad/s で −180°", "start", 9.5, ALI, True, halo=True))
    o.append(T(pp.X(0.35), pp.Y(-90) - 6, "遅れなし: −90° より遅れない", "start", 9.5, MUT, halo=True))
    o.append(T(pp.X(30), pp.Y(-300) + 2, "遅れあり", "start", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(0.35), pm.Y(-14), "ゲインは遅れの有無で同じ", "start", 9.5, MUT, halo=True))
    # (b) 3 つの角周波数の A と B
    o.append(TX(410, 18, "(b) 同じ K_P で角周波数を変える", "start", 11.5, INK, True))
    rows = [(5.0, "ω = 5 rad/s"), (w0, "ω = 16.9 rad/s"), (30.0, "ω = 30 rad/s")]
    for i, (w, nm) in enumerate(rows):
        y0 = 40 + i * 88
        g = complex(_f09_jw(Ld, [w])[0])
        amp = abs(g); ph = math.degrees(math.atan2(g.imag, g.real)) + 180.0
        while ph > 180: ph -= 360
        while ph <= -180: ph += 360
        p = Plot(440, y0 + 8, 160, 56, (0, 720), (-3.4, 3.4))
        o.append(p.axes(xl=None, yl=None, xt=[0, 360, 720], yt=[-3, 0, 3], sz=9))
        o.append(_f09_sine(p, 1.0, 0.0, GLD, 1.6))
        o.append(_f09_sine(p, amp, ph, SIG, 2.0))
        o.append(T(608, y0 + 16, nm, "start", 9.5, INK, True))
        o.append(T(608, y0 + 31, "B は %.2f 倍" % amp, "start", 9.5, SIG))
        if abs(ph) < 0.5:
            t2, c2 = "同じ向き", ALI
        elif ph > 0:
            t2, c2 = "%.0f° 進む" % ph, MUT
        else:
            t2, c2 = "%.0f° 遅れる" % (-ph), MUT
        o.append(T(608, y0 + 46, t2, "start", 9.5, c2, True))
    o.append(LEGL(440, hh + 2, [(GLD, None, "A"), (SIG, None, "B")]))
    o.append(T(686, hh + 2, "横軸は ωt [°]", "end", 9.5, MUT))
    return SVG(700, hh + 10, o, "(a) 台車の一巡伝達関数 17.0e<sup>−0.1s</sup>/(s + 2) のボード線図。むだ時間が位相を −ωL だけ遅らせるので、16.9 rad/s で位相が −180° になり、そこでのゲインはちょうど 0 dB である。むだ時間が無いと（破線）、ゲインは同じだが、位相は −90° より遅れない。(b) 同じ比例ゲインで、3 つの角周波数の A と B を、ωt を横軸にして比べる。B が A と同じ向き・同じ大きさになるのは 16.9 rad/s だけで、5 rad/s では B は大きいが向きがずれている。")


F["e09_phase180"] = _f09_phase180_fig()


def _f09_cartsim_fig():
    o = []
    cases = [(14.0, GRN, "K_P = 14 N/(m/s): 揺れは収まる"), (_F09_KB, SIG, "K_P = 17.0 N/(m/s): 同じ振れ幅で続く"),
             (20.0, ALI, "K_P = 20 N/(m/s): 大きくなり続ける")]
    y = 14
    for i, (K, c, nm) in enumerate(cases):
        t, v = _f09_sim_cart(K, 0.1, 2.0)
        p = Plot(62, y + 14, 380, 76, (0, 2), (-1, 3))
        o.append(p.axes(xl="時間 t [s]" if i == 2 else None, yl=None, xt=[0, 0.5, 1, 1.5, 2], yt=[-1, 0, 1, 2, 3], sz=9))
        o.append(W(p.X(0), p.Y(1), p.X(2), p.Y(1), c=MUT, lw=1, dash="5 3"))
        o.append(p.clip(list(zip(t[::5], v[::5])), c=c, lw=2.0))
        o.append(TX(p.x + 6, y + 10, nm, "start", 10, c, True))
        o.append(T(p.x - 34, p.y + p.h / 2 + 4, "m/s", "middle", 9, MUT))
        y += 106
    # 右: 閉ループの支配極
    o.append(T(470, 18, "閉ループの極（虚軸に最も近い組）", "start", 11, INK, True))
    p = Plot(500, 40, 180, 200, (-3.0, 3.0), (-22, 22))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(p))
    o.append(p.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-3, -2, -1, 0, 1, 2, 3], yt=[-20, -10, 0, 10, 20], sz=9, xfmt=_f09_n, yfmt=_f09_n))
    o.append(SPLANE(p, rhp=False))
    o.append(T(p.X(2.9), p.Y(-19.5), "右半平面", "end", 9, ALI, halo=True))
    for j, (K, c, nm) in enumerate(cases):
        r = _f09_cart_root(K, 0.1, (-0.5, 16.5))
        o.append(PZ(p, [r, r.conjugate()], [], c))
        o.append(TX(476, 286 + j * 16, "K_P = %s: %s ± j%s" % ("17.0" if j == 1 else "%g" % K, _f09_f(r.real, 2), _f09_f(r.imag, 1)), "start", 9.5, c, True))
    return SVG(700, 356, o, "測った速度が 0.1 s 遅れて届く台車の比例制御（1 章 5 節と同じ。目標値 1 m/s、決めた力 2 N を足す）。比例ゲインが 17.0 N/(m/s) より小さいと揺れは収まり、ちょうど 17.0 では同じ振れ幅のまま続き、大きいと大きくなり続ける。揺れの周期は 0.391 s・0.372 s・0.359 s で、境目の周期は 2π/16.9 = 0.372 s である。右は、閉ループの特性方程式 s + 2 + K<sub>P</sub>e<sup>−0.1s</sup> = 0 の根のうち虚軸に最も近い組で、K<sub>P</sub> = 17.0 でちょうど虚軸の上の ±j16.9 にある。")


F["e09_cartsim"] = _f09_cartsim_fig()
# =====================================================================
# 2 節: ラウス表
# =====================================================================
def _f09_routh_rows(c):
    """ラウス表の行（1 列目が 0 になったら、その先は nan）。"""
    c = [float(x) for x in c]; n = len(c) - 1; m = (n + 2) // 2
    r1 = c[0::2] + [0.0] * (m - len(c[0::2])); r2 = c[1::2] + [0.0] * (m - len(c[1::2]))
    rows = [r1, r2]
    for k in range(2, n + 1):
        a, b = rows[-2], rows[-1]
        if b[0] == 0:
            rows.append([float("nan")] * m); continue
        rows.append([(b[0] * a[i + 1] - a[0] * b[i + 1]) / b[0] for i in range(m - 1)] + [0.0])
    return rows


def _f09_routh_calc_fig():
    o = []
    o.append(TX(14, 18, "(a) 表の作り方（3 次の Δ(s) = a_{0}s^3 + a_{1}s^2 + a_{2}s + a_{3}）", "start", 11.5, INK, True))
    xl, x1, x2 = 34, 96, 160
    ys = [62, 92, 122, 152]
    o.append(RECT(x1 - 26, ys[0] - 20, 52, ys[3] - ys[0] + 30, 6, soft(SIG), "none", 0))
    o.append(T(x1, ys[0] - 26, "1 列目", "middle", 9.5, SIG, True))
    o.append(W(58, ys[0] - 18, 58, ys[3] + 10, c=MUT, lw=1.2))
    labs = ["s^3", "s^2", "s^1", "s^0"]
    cells = [("a_{0}", "a_{2}"), ("a_{1}", "a_{3}"), ("b_{1}", "0"), ("a_{3}", "")]
    for i, (l, (c1, c2)) in enumerate(zip(labs, cells)):
        o.append(TX(xl, ys[i], l, "middle", 11, MUT))
        o.append(TX(x1, ys[i], c1, "middle", 12, INK, True))
        if c2:
            o.append(TX(x2, ys[i], c2, "middle", 12, INK, True))
    # たすき掛け（b1）
    o.append(W(x1 + 9, ys[1] - 5, x2 - 9, ys[0] - 5, c=SIG, lw=1.4))
    o.append(W(x1 + 9, ys[0] - 3, x2 - 9, ys[1] - 7, c=ALI, lw=1.4))
    xf = 196
    o.append(TX(xf, ys[0] - 2, "1 行目: a_{0} から 1 つおきの係数", "start", 10, MUT))
    o.append(TX(xf, ys[1] - 2, "2 行目: 残りの係数", "start", 10, MUT))
    o.append(FRAC(xf + 72, ys[2] - 4 + 2, "a_{1}a_{2} − a_{0}a_{3}", "a_{1}", 11)[0])
    o.append(TX(xf, ys[2] + 2, "b_{1} =", "start", 11, INK, True))
    o.append(TX(xf, ys[2] + 26, "（青の積 − 赤の積）÷ 1 つ上の 1 列目", "start", 9.5, MUT))
    o.append(TX(xf, ys[3] + 18, "s^0 の行: (b_{1}a_{3} − a_{1}·0)/b_{1} = a_{3}", "start", 10, MUT))
    # (b) モータの位置の比例制御
    xb = 400
    o.append(TX(xb, 18, "(b) モータの位置の比例制御（L_a を含む）", "start", 11.5, INK, True))
    o.append(TX(xb, 38, "Δ(s) = s^3 + 2000s^2 + 40000s + 2×10^{6}K_P", "start", 10.5, MUT))
    c1x, c2x = xb + 78, xb + 196
    o.append(RECT(c1x - 52, ys[0] - 14, 104, ys[3] - ys[0] + 24, 6, soft(SIG), "none", 0))
    o.append(W(xb + 22, ys[0] - 12, xb + 22, ys[3] + 10, c=MUT, lw=1.2))
    vals = [("1", "40000"), ("2000", "2×10^{6}K_P"), ("40000 − 1000K_P", "0"), ("2×10^{6}K_P", "")]
    for i, (l, (a, b)) in enumerate(zip(labs, vals)):
        o.append(TX(xb + 6, ys[i], l, "middle", 11, MUT))
        o.append(TX(c1x, ys[i], a, "middle", 11.5, INK, True))
        if b:
            o.append(TX(c2x, ys[i], b, "middle", 11.5, INK, True))
    o.append(TX(xb, ys[3] + 24, "s^1 の 1 列目 = (2000·40000 − 1·2×10^{6}K_P)/2000", "start", 9.5, MUT))
    # (c) 3 つの比例ゲイン
    yc = 204
    o.append(TX(14, yc, "(c) 1 列目の符号を上から見る", "start", 11.5, INK, True))
    cases = [(10.0, "安定", GRN, "根 −1985, −7.54 ± j100.1"), (40.0, "安定限界", GLD, "根 −2000, ±j200"),
             (50.0, "不安定", ALI, "根 −2005, 2.46 ± j223")]
    for k, (K, verdict, c, rt) in enumerate(cases):
        x0 = 30 + k * 228
        rows = _f09_routh_rows([1, 2000, 40000, 2e6 * K])
        col = [r[0] for r in rows]
        o.append(TX(x0, yc + 24, "K_P = %g V/rad" % K, "start", 10.5, c, True))
        prev = None; nch = 0
        for i, v in enumerate(col):
            yy = yc + 46 + i * 20
            if v != v:
                txt, sg = "（この行は計算しない）", None
            else:
                if abs(v) < 1e5:
                    txt = "%g" % v
                else:
                    ex = int(math.floor(math.log10(abs(v)) + 1e-9)); mt = v / 10 ** ex
                    txt = ("10^{%d}" % ex) if abs(mt - 1) < 1e-9 else ("%g×10^{%d}" % (mt, ex))
                sg = 0 if v == 0 else (1 if v > 0 else -1)
            o.append(TX(x0 + 6, yy, labs[i], "start", 9.5, MUT))
            o.append(TX(x0 + 40, yy, txt.replace("-", "−"), "start", 10.5, INK if sg != -1 else ALI, True))
            if sg is not None:
                o.append(CHIP(x0 + 150, yy, "+" if sg > 0 else ("−" if sg < 0 else "0"), GRN if sg > 0 else (ALI if sg < 0 else GLD), 9.5, a="middle")[0])
            if prev is not None and sg is not None and sg != 0 and prev != 0 and sg != prev:
                nch += 1
                o.append(CARR(x0 + 166, yy - 26, x0 + 166, yy - 6, -0.5, c=ALI, lw=1.3, head=5))
            if sg is not None:
                prev = sg
        if K == 40.0:
            msg = "s^1 の行が 0: 虚軸の上に根"
        else:
            msg = "符号の変化 %d 回 → 右半平面の根 %d 個" % (nch, nch)
        o.append(TX(x0, yc + 140, msg, "start", 10, c, True))
        o.append(TX(x0, yc + 156, verdict + "（" + rt + "）", "start", 9.5, MUT))
    return SVG(700, yc + 166, o, "ラウス表。(a) 1 行目と 2 行目に係数を 1 つおきに並べ、3 行目からは、すぐ上の 2 行の 1 列目と右隣の列でたすき掛けをして、1 つ上の行の 1 列目で割る。(b) モータの位置の比例制御（巻線のインダクタンスを含む）の特性方程式の表。(c) 1 列目の符号は、K<sub>P</sub> = 10 V/rad では変わらず、50 V/rad では 2 回変わる（右半平面の根が 2 つ）。40 V/rad では s<sup>1</sup> の行が 0 になり、虚軸の上に根の組 ±j200 がある。")


F["e09_routh_calc"] = _f09_routh_calc_fig()


def _f09_paths(polyfun, mus):
    """μ ごとの多項式 polyfun(μ) の根を、前の μ の根に近い順につないだ道筋。返り値は根ごとの点の並び。"""
    prev = None; paths = None
    for mu in mus:
        r = list(_f09_np.roots(polyfun(mu)))
        if prev is None:
            paths = [[z] for z in r]; prev = r; continue
        used = set(); cur = [None] * len(prev)
        for i, z0 in enumerate(prev):
            if i >= len(paths): break
            best = None
            for j, z in enumerate(r):
                if j in used: continue
                if best is None or abs(z - z0) < abs(r[best] - z0): best = j
            if best is not None:
                used.add(best); cur[i] = r[best]; paths[i].append(r[best])
        prev = [c if c is not None else prev[i] for i, c in enumerate(cur)]
    return paths


def _f09_routh_why_fig():
    o = []
    o.append(TX(14, 18, "Δ(s) = s^3 + 2s^2 + 4s + 12 の表を 1 行ずつ下りる（μ を 0 から 1 へ動かしたときの根の動き）", "start", 11, INK, True))
    mus = list(_f09_np.linspace(0, 0.9, 200)) + list(1 - _f09_np.logspace(-1, -4, 3000))
    steps = [
        ("(a) η = 1/2 > 0", "s^3 + 2s^2 + 4s + 12", "2s^2 − 2s + 12", lambda m: [1 - m, 2, 4 - 6 * m, 12], (-6.5, 1.5), (-3.2, 3.2),
         "去る根は左へ: 右半平面の根 2 → 2", GRN),
        ("(b) η = 2/(−2) < 0", "2s^2 − 2s + 12", "−2s + 12", lambda m: [2 * (1 - m), -2, 12], (-2, 16), (-7, 7),
         "去る根は右へ: 右半平面の根 2 → 1", ALI),
        ("(c) η = −2/12 < 0", "−2s + 12", "12（定数）", lambda m: [-2 * (1 - m), 12], (-2, 16), (-7, 7),
         "去る根は右へ: 右半平面の根 1 → 0", ALI)]
    for k, (ttl, fr, to, pf, xr, yr, msg, mc) in enumerate(steps):
        x0 = 44 + k * 226
        wpx = 176; hpx = wpx * (yr[1] - yr[0]) / (xr[1] - xr[0])
        y0 = 60
        o.append(TX(x0 - 30, 40, ttl, "start", 10.5, INK, True))
        p = Plot(x0, y0, wpx, hpx, xr, yr)
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
        o.append(SPLANE(p))
        xt = [-6, -4, -2, 0] if k == 0 else [0, 5, 10, 15]
        o.append(p.axes(xl=None, yl=None, xt=xt, yt=[-3, 0, 3] if k == 0 else [-5, 0, 5], sz=9, xfmt=_f09_n, yfmt=_f09_n))
        o.append(SPLANE(p, rhp=False))
        paths = _f09_paths(pf, mus)
        for path in paths:
            pts = [(z.real, z.imag) for z in path]
            o.append(p.clip(pts, c=SIG, lw=1.8))
            z0 = path[0]
            if xr[0] <= z0.real <= xr[1]:
                o.append(PZ(p, [z0], [], MUT, 4.5))
            z1 = path[-1]
            if xr[0] < z1.real < xr[1] and abs(z1) < 1e3:
                o.append(D(p.X(z1.real), p.Y(z1.imag), SIG, 3.4))
        # 去る根の向き
        if k == 0:
            o.append(ARR(p.x + 26, p.Y(0) + 12, p.x + 4, p.Y(0) + 12, c=GRN, lw=1.6, head=6))
            o.append(T(p.x + 30, p.Y(0) + 16, "−∞ へ", "start", 9, GRN, True, halo=True))
        else:
            o.append(ARR(p.x + p.w - 26, p.Y(0) + 12, p.x + p.w - 4, p.Y(0) + 12, c=ALI, lw=1.6, head=6))
            o.append(T(p.x + p.w - 30, p.Y(0) + 16, "+∞ へ", "end", 9, ALI, True, halo=True))
        yb = y0 + hpx + 32
        o.append(TX(x0 - 30, yb, "μ = 0: " + fr, "start", 9.5, MUT))
        o.append(TX(x0 - 30, yb + 15, "μ = 1: " + to, "start", 9.5, SIG))
        o.append(T(x0 - 30, yb + 31, msg, "start", 9.5, mc, True))
    ybot = 60 + 136.9 + 32 + 54
    o.append(LEGL(14, ybot, [(SIG, None, "根の動き")], sz=9.5))
    o.append(T(110, ybot, "× μ = 0 の根　● μ = 1 の根", "start", 9.5, MUT))
    o.append(TX(330, ybot, "表の 1 列目: 1, 2, −2, 12（符号の変化 2 回 = 右半平面の根 2 個）", "start", 10, INK, True))
    return SVG(700, ybot + 10, o, "ラウス表の 1 行ずつが、次数を 1 つ下げた多項式に当たる。Δ<sub>μ</sub>(s) = Δ(s) − μηsΔ<sub>2</sub>(s) の μ を 0 から 1 へ動かすと、根は虚軸を横切らずに動き、1 つの根だけが無限に遠くへ去る。η（1 列目の隣り合う 2 つの比）が正なら左へ去り、右半平面の根の数は変わらない。負なら右へ去り、右半平面の根が 1 つ減る。(a) 右半平面の組 0.204 ± j2.22 は 0.5 ± j2.40 へ動き、−2.41 の根が左へ去る。(b)(c) 符号が変わる 2 か所で、右半平面の根が 1 つずつ去る。")


F["e09_routh_why"] = _f09_routh_why_fig()


def _f09_routh_range_fig():
    o = []
    o.append(TX(14, 18, "(a) モータの位置の比例制御: 1 列目の要素と根", "start", 11.5, INK, True))
    Ks = _f09_np.linspace(0.0, 60.0, 601)
    p1 = Plot(76, 40, 270, 96, (0, 60), (-2.5, 4.5))
    o.append(RECT(p1.X(40), p1.y, p1.X(60) - p1.X(40), p1.h, 0, soft(ALI), "none", 0))
    o.append(p1.axes(xl=None, yl=None, xt=[0, 10, 20, 30, 40, 50, 60], yt=[-2, 0, 2, 4], sz=9, xfmt=_f09_n, yfmt=_f09_n))
    o.append(W(p1.x, p1.Y(0), p1.x + p1.w, p1.Y(0), c=MUT, lw=1))
    o.append(p1.line([(k, (40000 - 1000 * k) / 1e4) for k in Ks], c=SIG, lw=2.2))
    o.append(TX(p1.x + 6, p1.y + 14, "s^1 の行の要素 40000 − 1000K_P [×10^{4}]", "start", 9.5, SIG, True, halo=True))
    p2 = Plot(76, 162, 270, 96, (0, 60), (-12, 4))
    o.append(RECT(p2.X(40), p2.y, p2.X(60) - p2.X(40), p2.h, 0, soft(ALI), "none", 0))
    o.append(p2.axes(xl="比例ゲイン K_P [V/rad]", yl=None, xt=[0, 10, 20, 30, 40, 50, 60], yt=[-12, -8, -4, 0, 4], sz=9, xfmt=_f09_n, yfmt=_f09_n))
    o.append(W(p2.x, p2.Y(0), p2.x + p2.w, p2.Y(0), c=MUT, lw=1))
    mx = [(k, max(r.real for r in _f09_np.roots([1, 2000, 40000, 2e6 * k]))) for k in Ks[1:]]
    o.append(p2.clip(mx, c=PUR, lw=2.2))
    o.append(T(p2.x + 6, p2.y + 14, "閉ループの最も右の根の実部 [1/s]", "start", 9.5, PUR, True, halo=True))
    for p in (p1, p2):
        o.append(W(p.X(40), p.y, p.X(40), p.y + p.h, c=ALI, lw=1.2, dash="4 3"))
    o.append(T(p1.X(50), p1.y + p1.h - 8, "不安定", "middle", 9.5, ALI, True, halo=True))
    o.append(TX(p2.X(40) + 3, p2.y + p2.h - 8, "K_P = 40", "start", 9.5, ALI, True, halo=True))
    # (b) PI 制御の安定な範囲
    xb = 400
    o.append(TX(xb, 18, "(b) PI 制御 C(s) = K_P + K_I/s の安定な範囲", "start", 11.5, INK, True))
    q = Plot(xb + 44, 40, 236, 200, (0, 40), (0, 260))
    kk = _f09_np.linspace(0, 40, 161)
    reg = [(q.X(k), q.Y(k * (40 - k) / 2)) for k in kk] + [(q.X(40), q.Y(0)), (q.X(0), q.Y(0))]
    o.append(PL(reg, c="none", lw=0, fill=soft(GRN)))
    o.append(q.axes(xl="K_P [V/rad]", yl="K_I [V/(rad·s)]", xt=[0, 10, 20, 30, 40], yt=[0, 50, 100, 150, 200, 250], sz=9))
    o.append(q.line([(k, k * (40 - k) / 2) for k in kk], c=GRN, lw=2.2))
    o.append(TX(q.X(20), q.Y(200) - 8, "K_I = K_P(40 − K_P)/2", "middle", 9.5, GRN, True, halo=True))
    o.append(T(q.X(20), q.Y(60), "安定", "middle", 11, GRN, True, halo=True))
    for (kp, ki, ok) in ((10, 100, True), (10, 200, False), (20, 150, True), (20, 250, False)):
        if ok:
            o.append(D(q.X(kp), q.Y(ki), SIG, 4))
        else:
            o.append(W(q.X(kp) - 4, q.Y(ki) - 4, q.X(kp) + 4, q.Y(ki) + 4, c=ALI, lw=2))
            o.append(W(q.X(kp) - 4, q.Y(ki) + 4, q.X(kp) + 4, q.Y(ki) - 4, c=ALI, lw=2))
        o.append(T(q.X(kp) + 7, q.Y(ki) + 4, "(%d, %d)" % (kp, ki), "start", 9, SIG if ok else ALI, halo=True))
    return SVG(700, 300, o, "(a) モータの位置の比例制御では、ラウス表の s<sup>1</sup> の行の要素 40000 − 1000K<sub>P</sub> が K<sub>P</sub> = 40 V/rad で負になり、同じ所で、閉ループの根を数値で求めたときの最も右の根の実部が正になる。(b) 同じモータを PI 制御すると、特性方程式は 4 次になる。ラウス表の 1 列目がすべて正になるのは 0 < K<sub>P</sub> < 40 と 0 < K<sub>I</sub> < K<sub>P</sub>(40 − K<sub>P</sub>)/2 のときで、緑の範囲の外の点（×）では閉ループの根の組が右半平面にある。")


F["e09_routh_range"] = _f09_routh_range_fig()
# =====================================================================
# 3 節: ナイキスト線図
# =====================================================================
def _f09_tag(x, y, t, c=INK, r=7.5):
    """番号の札（丸の中に数字）。"""
    return CIRC(x, y, r, c=c, lw=1.2, fill=SCR) + T(x, y + 3.4, t, "middle", 9, c, True)


def _f09_nyq_bode_fig():
    o = []
    K = 8.0
    Lf = lambda s: _f09_Lcart(s, K, 0.1)
    o.append(TX(14, 18, "(a) ボード線図（台車、K_P = 8 N/(m/s)、遅れ 0.1 s）", "start", 11.5, INK, True))
    ws = _f09_lw(0.3, 60, 500)
    svg, pm, pp, hh = _f09_bode(62, 34, 270, (0.3, 60), (-20, 20), (-360, 0), hm=110, hp=120, gap=28,
                                dbt=[-20, -10, 0, 10, 20], pht=[-360, -270, -180, -90, 0])
    o.append(svg)
    g = _f09_jw(Lf, ws); ph = _f09_phase(Lf, ws, 0.0)
    o.append(pm.clip(list(zip(ws, 20 * _f09_np.log10(_f09_np.abs(g)))), c=SIG, lw=2.0))
    o.append(pp.clip(list(zip(ws, ph)), c=SIG, lw=2.0))
    o.append(W(pm.x, pm.Y(0), pm.x + pm.w, pm.Y(0), c=GRN, lw=1.6))
    o.append(W(pp.x, pp.Y(-180), pp.x + pp.w, pp.Y(-180), c=ALI, lw=1.6))
    o.append(T(pm.x + pm.w - 4, pm.Y(0) - 5, "0 dB", "end", 9.5, GRN, True, halo=True))
    o.append(T(pp.x + 4, pp.Y(-180) + 13, "−180°", "start", 9.5, ALI, True, halo=True))
    wgc = math.sqrt(K * K - 4.0)
    marks = [1.0, 4.0, wgc, 12.0, _F09_WPC, 30.0]
    # (b) ナイキスト線図
    o.append(T(380, 18, "(b) 同じ一巡伝達関数のナイキスト線図", "start", 11.5, INK, True))
    sv, p = _f09_cplane(392, 40, 294, 196, (-1.6, 4.4), (-2.8, 1.2), [-1, 0, 1, 2, 3, 4], [-2, -1, 0, 1])
    o.append(sv)
    wn = _f09_lw(0.01, 300, 3000)
    v = _f09_jw(Lf, wn)
    o.append(p.clip(_f09_cpts(_f09_np.conj(v)), c=SIG, lw=1.3, dash="4 3"))
    o.append(p.clip(_f09_cpts(v), c=SIG, lw=2.2))
    for kk in (900, 1500):
        o.append(_f09_arrow_mid(p, v, kk, SIG))
    o.append(_f09_m1(p, a="below"))
    # 極座標の読み（ω = 4）
    g4 = complex(Lf(4j))
    o.append(ARR(p.X(0), p.Y(0), p.X(g4.real), p.Y(g4.imag), c=GLD, lw=1.8, head=7))
    arc = [(p.X(0) + 26 * math.cos(math.radians(a)), p.Y(0) - 26 * math.sin(math.radians(a))) for a in _f09_np.linspace(0, math.degrees(math.atan2(g4.imag, g4.real)), 30)]
    o.append(PL(arc, c=GLD, lw=1.2))
    o.append(T(p.X(0) + 30, p.Y(0) + 26, "角度 −86.3° = 位相", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(g4.real) + 12, p.Y(g4.imag) + 4, "長さ 1.79 = ゲイン 5.05 dB", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(-1.55), p.Y(1.05), "単位円（点線）= 0 dB", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(-1.55), p.Y(0.2), "負の実軸 = −180°", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(4.35), p.Y(0.2), "ω = 0 で 4", "end", 9.5, SIG, halo=True))
    o.append(T(p.X(4.35), p.Y(0.85), "破線は ω < 0 の鏡像", "end", 9.5, MUT, halo=True))
    # 番号の札（両方の図）
    for i, w in enumerate(marks):
        gv = complex(Lf(1j * w)); db = 20 * math.log10(abs(gv)); phv = float(_f09_phase(Lf, [0.3, w], 0.0)[1])
        c = ALI if i == 4 else (GRN if i == 2 else INK)
        o.append(D(pm.X(w), pm.Y(db), c, 3.2)); o.append(D(pp.X(w), pp.Y(phv), c, 3.2))
        o.append(_f09_tag(pm.X(w) + (9 if i != 5 else -9), pm.Y(db) - 10, str(i + 1), c))
        o.append(_f09_tag(pp.X(w) + (9 if i != 5 else -9), pp.Y(phv) - 10 if i < 4 else pp.Y(phv) + 12, str(i + 1), c))
        o.append(D(p.X(gv.real), p.Y(gv.imag), c, 3.4))
        dx, dy = gv.real - 0.0, gv.imag - 0.0
        rr = math.hypot(dx, dy) or 1
        off = 13 if i not in (4, 5) else 12
        lx = p.X(gv.real) + (dx / rr) * off * (1 if i < 4 else -1); ly = p.Y(gv.imag) - (dy / rr) * off * (1 if i < 4 else -1)
        if i == 4:
            lx, ly = p.X(gv.real), p.Y(gv.imag) + 15
        o.append(_f09_tag(lx, ly, str(i + 1), c))
    yt = 260
    rows = []
    for i, w in enumerate(marks):
        gv = complex(Lf(1j * w)); phv = float(_f09_phase(Lf, [0.3, w], 0.0)[1])
        rows.append("%d: %s rad/s・%s dB・%s°" % (i + 1, _f09_g(w, 3), _f09_f(20 * math.log10(abs(gv)), 1), _f09_f(phv, 1)))
    for i, r in enumerate(rows):
        o.append(T(392 + (i % 2) * 150, yt + (i // 2) * 15, r, "start", 9.5, ALI if i == 4 else (GRN if i == 2 else MUT)))
    return SVG(700, max(hh, yt + 40) + 4, o, "ナイキスト線図とボード線図の対応（台車、K<sub>P</sub> = 8 N/(m/s)、測った値の遅れ 0.1 s）。同じ番号の点は同じ角周波数の P(jω)C(jω) で、原点からの距離がゲイン、正の実軸からの角度が位相である。ゲイン 0 dB（緑の線）は単位円に、位相 −180°（赤の線）は負の実軸に、−1 の点は 0 dB と −180° が重なる点に当たる。3 は単位円を、5 は負の実軸を横切る点で、5 は −0.470 にある。")


F["e09_nyq_bode"] = _f09_nyq_bode_fig()


def _f09_nyq_gallery_fig():
    o = []
    panels = [
        ("(a) 台車（遅れなし）、K_P = 8", lambda s: _f09_Lcart(s, 8.0, 0.0), (-1.5, 4.5), (-2.5, 2.25), _f09_lw(0.01, 1e3, 1500), None, None),
        ("(b) 台車（遅れ 0.1 s）、K_P = 8", lambda s: _f09_Lcart(s, 8.0, 0.1), (-1.5, 4.5), (-2.5, 2.25), _f09_lw(0.01, 1e3, 4000), _F09_WPC, "16.9 rad/s で −0.470"),
        ("(c) モータの位置、K_P = 10 V/rad", lambda s: _f09_Lmotor(s, 10.0, True), (-2.5, 0.5), (-1.9, 0.475), _f09_lw(1, 1e4, 3000), 200.0, "200 rad/s で −0.25"),
        ("(d) 温度の板（遅れ 20 s）、K_P = 12 W/K", lambda s: _f09_Lplate(s, 12.0), (-2.0, 4.0), (-3.5, 1.25), _f09_lw(1e-4, 2, 4000), _f09_wpc_plate(), "0.0798 rad/s で −0.376")]
    for k, (ttl, Lf, xr, yr, ws, wx, lab) in enumerate(panels):
        x0 = 56 + (k % 2) * 344; y0 = 36 + (k // 2) * 252
        o.append(TX(x0 - 42, y0 - 14, ttl, "start", 10.5, INK, True))
        w = 250; h = w * (yr[1] - yr[0]) / (xr[1] - xr[0])
        step = 1.0 if xr[1] - xr[0] > 4 else 0.5
        xt = [v for v in _f09_np.arange(math.ceil(xr[0] / step) * step, xr[1] + 1e-9, step)]
        yt = [v for v in _f09_np.arange(math.ceil(yr[0] / step) * step, yr[1] + 1e-9, step)]
        sv, p = _f09_cplane(x0, y0, w, h, xr, yr, [round(v, 2) for v in xt], [round(v, 2) for v in yt], sz=8.5)
        o.append(sv)
        if k == 2:
            v0 = _f09_jw(lambda s: _f09_Lmotor(s, 10.0, False), ws)
            o.append(p.clip(_f09_cpts(v0), c=MUT, lw=1.6, dash="5 3"))
            o.append(T(p.X(-2.4), p.Y(-1.7), "灰色の破線: L_a を無視", "start", 9, MUT, halo=True))
        v = _f09_jw(Lf, ws)
        o.append(p.clip(_f09_cpts(v), c=SIG, lw=2.0))
        n = len(ws)
        for kk in ((n // 3, 2 * n // 3) if k != 2 else (n // 4, n // 2)):
            pt = v[kk]
            if xr[0] < pt.real < xr[1] and yr[0] < pt.imag < yr[1]:
                o.append(_f09_arrow_mid(p, v, kk, SIG, 6))
        o.append(_f09_m1(p))
        if wx:
            gx = complex(Lf(1j * wx))
            o.append(D(p.X(gx.real), p.Y(gx.imag), ALI, 3.6))
            o.append(T(p.X(gx.real) + 4, p.Y(gx.imag) + 15, lab, "middle" if k == 2 else "start", 9, ALI, True, halo=True))
        if k == 0:
            o.append(T(p.X(2.0), p.Y(-2.25), "中心 2・半径 2 の円の下半分", "middle", 9, SIG, halo=True))
            o.append(T(p.X(4.4), p.Y(0.25), "ω = 0 で 4", "end", 9, SIG, halo=True))
        if k == 1:
            o.append(T(p.X(4.4), p.Y(0.25), "ω = 0 で 4", "end", 9, SIG, halo=True))
        if k == 3:
            o.append(T(p.X(3.9), p.Y(0.35), "ω = 0 で 15（枠の外）", "end", 9, SIG, halo=True))
        if k == 2:
            o.append(T(p.X(-2.4), p.Y(0.25), "ω → 0 で −j∞ へ", "start", 9, SIG, halo=True))
    return SVG(700, 36 + 252 + 2.375 * 250 / 3.0 + 50, o, "例の一巡伝達関数のナイキスト線図（ω ≥ 0 の部分。矢じりは ω が増える向き）。(a) 遅れの無い台車は円の下半分で、位相が −90° より遅れないので負の実軸に届かない。(b) 測った値が 0.1 s 遅れると、各点が ωL だけ時計回りに回って渦巻きになり、16.9 rad/s で負の実軸を横切る。(c) モータの位置は、積分のため ω が 0 に近いと限りなく遠くにある。巻線のインダクタンスを無視した式（破線）は負の実軸を横切らないが、含めると 200 rad/s で横切る。(d) 温度の板は、むだ時間 20 s のため渦巻きになる。比例ゲインを変えると線図は原点を中心に伸び縮みし、横切る点は K<sub>P</sub> に比例して動く。")


F["e09_nyq_gallery"] = _f09_nyq_gallery_fig()
