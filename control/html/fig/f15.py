# -*- coding: utf-8 -*-
# 15 章 サンプリングと離散化 の図
import numpy as _f15_np
from scipy import signal as _f15_sg
from scipy.linalg import expm as _f15_expm
from scipy.optimize import brentq as _f15_brentq
import re as _f15_re

# =====================================================================
# 補助
# =====================================================================
def _f15_n(v):
    return ("%g" % v).replace("-", "−")


def _f15_f(v, d=2):
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f15_cap(s):
    """図の説明文（HTML）で K_P・ω_gc・T_s などを添字のタグに、e^{λT_s} を上付きのタグにする。"""
    s = _f15_re.sub(r"\^\{([^}]*)\}", r"<sup>\1</sup>", s)
    s = _f15_re.sub(r"([A-Za-zωζφλα])_\{([^}]*)\}", r"\1<sub>\2</sub>", s)
    return _f15_re.sub(r"([A-Za-zωζφλα])_([A-Za-z0-9]+)", r"\1<sub>\2</sub>", s)


def _f15_svg(w, h, o, cap):
    return SVG(w, h, o, _f15_cap(cap))


def _f15_ss(num, den):
    A, B, C, D = _f15_sg.tf2ss(_f15_np.atleast_1d(num).astype(float), _f15_np.atleast_1d(den).astype(float))
    return A, B[:, 0], C[0], float(D[0, 0])


def _f15_zoh(A, B, h):
    n = A.shape[0]
    M = _f15_np.zeros((n + 1, n + 1)); M[:n, :n] = A * h; M[:n, n] = B * h
    E = _f15_expm(M)
    return E[:n, :n], E[:n, n]


def _f15_simsd(Pn, Pd, ctrl, Ts, tEnd, M=50, lc=0, r=1.0):
    """サンプリングした閉ループ。対象は h = Ts/M の刻みで厳密に進める（操作量は刻みの間一定）。
    ctrl(e) -> u を Ts ごとに呼ぶ（e = r − y(kTs)）。lc: 測ってから出すまでの刻みの数。返り値 t, y, u（刻みごと）"""
    A, B, C, D = _f15_ss(Pn, Pd); h = Ts / M
    Ad, Bd = _f15_zoh(A, B, h)
    n = int(round(tEnd / h)); x = _f15_np.zeros(A.shape[0])
    T, Y, U = _f15_np.zeros(n + 1), _f15_np.zeros(n + 1), _f15_np.zeros(n + 1)
    uo, pend = 0.0, None
    for i in range(n + 1):
        y = C @ x
        if i % M == 0:
            uc = ctrl(r - y)
            if lc == 0:
                uo = uc
            else:
                pend = (i + lc, uc)
        if pend is not None and i == pend[0]:
            uo = pend[1]; pend = None
        T[i], Y[i], U[i] = i * h, y, uo
        x = Ad @ x + Bd * uo
    return T, Y, U


def _f15_simct(Pn, Pd, Cn, Cd, tEnd, h=2e-5, L=0.0, r=1.0):
    """連続時間の閉ループ（制御器も細かい刻み）。L: ループの中のむだ時間（操作量を遅らせる）。返り値 t, y, u"""
    A, B, C, D = _f15_ss(Pn, Pd); Ac, Bc, Cc, Dc = _f15_ss(Cn, Cd)
    Ad, Bd = _f15_zoh(A, B, h)
    nc = Ac.shape[0]
    if nc:
        Acd, Bcd = _f15_zoh(Ac, Bc, h)
    n = int(round(tEnd / h)); nd = int(round(L / h)); buf = [0.0] * max(1, nd); bi = 0
    x = _f15_np.zeros(A.shape[0]); xc = _f15_np.zeros(nc)
    T, Y, U = _f15_np.zeros(n + 1), _f15_np.zeros(n + 1), _f15_np.zeros(n + 1)
    for i in range(n + 1):
        y = C @ x; e = r - y
        u = (Cc @ xc if nc else 0.0) + Dc * e
        if nd:
            ua = buf[bi]; buf[bi] = u; bi = (bi + 1) % nd
        else:
            ua = u
        T[i], Y[i], U[i] = i * h, y, u
        if nc:
            xc = Acd @ xc + Bcd * e
        x = Ad @ x + Bd * ua
    return T, Y, U


def _f15_simfb(Pn, Pd, Kp, tEnd, h=1e-4, Lm=0.0, Lu=0.0, r=1.0):
    """連続時間の比例制御。測った値を Lm、出す操作量を Lu だけ遅らせる（サンプリングの比べる相手）。返り値 t, y, u"""
    A, B, C, D = _f15_ss(Pn, Pd); Ad, Bd = _f15_zoh(A, B, h)
    n = int(round(tEnd / h)); nm = int(round(Lm / h)); nu = int(round(Lu / h))
    bm = [0.0] * max(1, nm); bu = [0.0] * max(1, nu); im = iu = 0
    x = _f15_np.zeros(A.shape[0])
    T, Y, U = _f15_np.zeros(n + 1), _f15_np.zeros(n + 1), _f15_np.zeros(n + 1)
    for i in range(n + 1):
        y = C @ x
        if nm:
            ym = bm[im]; bm[im] = y; im = (im + 1) % nm
        else:
            ym = y
        u = Kp * (r - ym)
        if nu:
            ua = bu[iu]; bu[iu] = u; iu = (iu + 1) % nu
        else:
            ua = u
        T[i], Y[i], U[i] = i * h, y, ua
        x = Ad @ x + Bd * ua
    return T, Y, U


class _F15Rec:
    """差分式 u[k] = b0 e[k] + b1 e[k−1] + a u[k−1]"""
    def __init__(self, b0, b1, a):
        self.b0, self.b1, self.a, self.e1, self.u1 = b0, b1, a, 0.0, 0.0
    def __call__(self, e):
        u = self.b0 * e + self.b1 * self.e1 + self.a * self.u1
        self.e1, self.u1 = e, u
        return u


def _f15_lead_coef(method, Ts, Kc=0.624, wz=17.3, wp=52.0, w0=30.0):
    """13 章 3 節の進み補償器の係数 (b0, b1, a)。method: fwd / bwd / tus / pre"""
    if method == "fwd":
        return Kc * wp / wz, Kc * (wp * Ts - wp / wz), 1 - wp * Ts
    if method == "bwd":
        a = 1 / (1 + wp * Ts)
        return Kc * (wp / wz) * (1 + wz * Ts) * a, -Kc * (wp / wz) * a, a
    g = 2 / Ts if method == "tus" else w0 / math.tan(w0 * Ts / 2)
    d = g / wp + 1
    return Kc * (g / wz + 1) / d, -Kc * (g / wz - 1) / d, (g / wp - 1) / d


def _f15_metrics(t, y, yf=1.0, band=0.02):
    mp = (y.max() - yf) / abs(yf) * 100
    out = _f15_np.where(_f15_np.abs(y - yf) > band * abs(yf))[0]
    ts = t[out[-1] + 1] if len(out) and out[-1] + 1 < len(t) else float("nan")
    return mp, ts


# 制御対象（本文の例の値）
_F15_PPOS = ([1000.0], [1.0, 20.0, 0.0])      # モータの角度（L_a を無視）rad/V
_F15_PSPD = ([50.0], [0.05, 1.0])             # モータの速度 (rad/s)/V
_F15_LEAD = (0.624 * _f15_np.array([1 / 17.3, 1.0]), _f15_np.array([1 / 52.0, 1.0]))

# 近似の方法の色（図とデモで共通）
_F15_CF, _F15_CB, _F15_CT, _F15_CX = PUR, TEA, SIG, GRN   # 前進差分・後退差分・双一次変換・正しい値


# =====================================================================
# 1 節: マイコンの制御ループ
# =====================================================================
def _f15_glyph(x, y, w, h, kind, c, f=None, n=7):
    """信号の形の小さな絵。kind: cont（連続）・dots（点の列）・stairs（階段）"""
    f = f or (lambda s: 0.5 + 0.38 * math.sin(2 * math.pi * 0.9 * s + 0.4))
    o = [RECT(x, y, w, h, 4, SCR, LIN, 0.8)]
    X = lambda s: x + 5 + s * (w - 10)
    Yv = lambda v: y + h - 4 - v * (h - 8)
    if kind == "cont":
        o.append(PL([(X(s / 60), Yv(f(s / 60))) for s in range(61)], c=c, lw=1.6))
    elif kind == "dots":
        for k in range(n):
            s = k / (n - 1)
            o.append(W(X(s), Yv(0), X(s), Yv(f(s)), c=c, lw=0.9))
            o.append(D(X(s), Yv(f(s)), c, 2.3))
    else:
        pts = []
        for k in range(n - 1):
            s0, s1 = k / (n - 1), (k + 1) / (n - 1)
            pts += [(X(s0), Yv(f(s0))), (X(s1), Yv(f(s0)))]
        o.append(PL(pts, c=c, lw=1.6))
    return "".join(o)


def _f15_loop_fig():
    o = []
    yc = 128
    # マイコンの枠
    o.append(RECT(40, 34, 432, 248, 10, "none", MUT, 1.2, dash="6 4"))
    o.append(TX(52, 54, "マイコン（T_s ごとに測る・計算する・出す）", "start", 10.5, INK, True))
    s_, pos, xe = CHAIN(52, yc, [
        ("a", 44, "r[k]", MUT),
        ("s", {"l": "+", "b": "−"}, "sum"),
        ("a", 40, "e[k]", INK),
        ("b", "差分式", "C", SIG, SSOFT),
        ("a", 86, "u[k]", GLD),
        ("b", "零次ホールド（PWM）", "H", LIN),
        ("a", 92, "u(t)", GLD),
        ("b", "P(s)", "P", LIN),
        ("w", 30, SIG),
        ("t", "tap", SIG),
        ("a", 50, "y(t)", SIG),
    ])
    o.append(s_)
    xt, xs = pos["tap"], pos["sum"]
    yb = yc + 84
    xsw = 340
    o.append(W(xt, yc, xt, yb, xsw + 16, yb, c=SIG, lw=1.5))
    o.append(D(xsw + 16, yb, SIG, 2.8)); o.append(D(xsw - 16, yb, SIG, 2.8))
    o.append(W(xsw + 16, yb, xsw - 13, yb - 12, c=SIG, lw=1.8))
    o.append(CARR(xsw - 4, yb - 26, xsw + 8, yb - 16, bend=0.3, c=TEA, lw=1.2, head=5))
    o.append(T(xsw, yb + 20, "取り込み（ADC など）", "middle", 10, TEA, True))
    o.append(TX(xsw, yb + 34, "T_s ごとに一瞬閉じる", "middle", 9.5, TEA))
    o.append(W(xsw - 16, yb, xs, yb, c=SIG, lw=1.5))
    o.append(ARR(xs, yb, xs, yc + 15, c=SIG, lw=1.5, head=6))
    o.append(TX(xsw - 46, yb - 6, "y[k]", "middle", 10, SIG, True, halo=True))
    o.append(T(pos["P"][0] + 20, yc - 26, "制御対象", "middle", 10, MUT))
    # 信号の形の小さな絵（線の上と下）
    gw, gh = 70, 30
    xu = (pos["C"][1] + pos["H"][0]) / 2
    xU = (pos["H"][1] + pos["P"][0]) / 2
    items = [
        (xu - gw / 2, 66, "dots", GLD), (xU - gw / 2, 66, "stairs", GLD),
        (xt + 8, 66, "cont", SIG), (xs + 20, yb + 12, "dots", SIG),
    ]
    for gx, gy, kind, c in items:
        o.append(_f15_glyph(gx, gy, gw, gh, kind, c))
    o.append(T(xs + 20 + gw + 6, yb + 32, "点の列", "start", 9.5, SIG, True))
    o.append(T(xu + gw / 2 + 4, 86, "点の列", "start", 9.5, GLD, True))
    o.append(T(xU + gw / 2 + 4, 86, "階段", "start", 9.5, GLD, True))
    o.append(T(xt + 8 + gw + 4, 86, "連続", "start", 9.5, SIG, True))
    return _f15_svg(700, 296, o, "マイコンで制御するループ。マイコンの中（破線の枠）では、目標値 r[k]・測った制御量 y[k]・偏差 e[k]・操作量 u[k] は T_s ごとの値の列（点の列）で、差分式（4 節）で計算する。外の制御対象の入力 u(t) と出力 y(t) は連続に変わる。取り込みのスイッチが連続な y(t) から点の列を作り、PWM が点の列 u[k] から、次に書き換えるまで値を保つ階段 u(t) を作る（零次ホールド。2 節）。線の上下の小さな絵は、それぞれの信号の形。")


F["e15_loop"] = _f15_loop_fig()


def _f15_timing_fig():
    o = []
    Ts = 1.0
    x0, x1 = 120, 680
    t0, t1 = -0.15, 3.25
    X = lambda t: x0 + (t - t0) / (t1 - t0) * (x1 - x0)
    tc = 0.08      # 取り込み
    tk = 0.28      # 計算
    f = lambda t: 0.5 + 0.35 * math.sin(1.6 * t + 0.3)
    rows = [("制御量 y(t)", 36), ("タイマの割り込み", 96), ("取り込み・計算", 132), ("(A) すぐ出す", 196), ("(B) 次の周期に出す", 268)]
    for lab, yy in rows:
        o.append(TX(x0 - 8, yy + 4, lab, "end", 10, INK, True))
    # 周期の縦の補助線
    for k in range(4):
        o.append(W(X(k * Ts), 22, X(k * Ts), 300, c=GRD, lw=1, dash="3 3"))
        o.append(TX(X(k * Ts), 314, ("0" if k == 0 else ("T_s" if k == 1 else "%dT_s" % k)), "middle", 9.5, MUT))
    # y(t) と取り出す点
    py = lambda v: 60 - v * 44
    o.append(PL([(X(t), py(f(t))) for t in _f15_np.linspace(t0, t1, 200)], c=SIG, lw=1.8))
    for k in range(4):
        o.append(W(X(k), py(0), X(k), py(f(k)), c=SIG, lw=0.9, dash="2 2"))
        o.append(D(X(k), py(f(k)), SIG, 3.4))
    o.append(TX(X(3.1), py(f(3.1)) - 6, "y[k]", "middle", 9.5, SIG, True, halo=True))
    # タイマの印
    for k in range(4):
        o.append(ARR(X(k), 86, X(k), 102, c=MUT, lw=1.4, head=5))
    # 取り込みと計算の帯
    for k in range(4):
        if X(k) + 10 > x1:
            continue
        o.append(RECT(X(k), 124, X(k + tc) - X(k), 14, 2, TSOFT, TEA, 1))
        if X(k + tc + tk) < x1:
            o.append(RECT(X(k + tc), 124, X(k + tc + tk) - X(k + tc), 14, 2, MSOFT, MUT, 1))
    o.append(T(X(tc / 2), 152, "取り込み", "middle", 9, TEA, True))
    o.append(T(X(tc + tk / 2) + 6, 152, "計算", "middle", 9, MUT, True))
    # 出す値（u[k] は y[k] から計算した値の例）
    uk = [0.75 - 0.5 * f(k) for k in range(4)]
    def stairs(ytop, delay):
        pu = lambda v: ytop + 40 - v * 70
        pts = [(X(t0), pu(0.12))]
        cur = 0.12
        for k in range(4):
            tt = k + delay
            if tt > t1:
                break
            pts += [(X(tt), pu(cur)), (X(tt), pu(uk[k]))]
            cur = uk[k]
        pts.append((X(t1), pu(cur)))
        return PL(pts, c=GLD, lw=2.0), pu
    sA, puA = stairs(176, tc + tk)
    sB, puB = stairs(248, Ts)
    o.append(sA); o.append(sB)
    # L_c の寸法
    o.append(DIM(X(1), 236, X(1 + tc + tk), 236, None, c=GLD))
    o.append(TX(X(1 + tc + tk) + 6, 240, "L_c = 取り込みと計算の時間", "start", 9.5, GLD, True, halo=True))
    o.append(DIM(X(1), 300, X(2), 300, None, c=GLD))
    o.append(TX(X(1.5), 296, "L_c = T_s", "middle", 9.5, GLD, True, halo=True))
    o.append(TX(X(0) + 4, 176 + 8, "u(t)", "start", 9.5, GLD, True, halo=True))
    o.append(TX(X(0) + 4, 248 + 8, "u(t)", "start", 9.5, GLD, True, halo=True))
    return _f15_svg(700, 326, o, "マイコンの制御ループのタイミング（T_s ごとに繰り返す）。タイマの割り込みで制御量 y(t) の値を取り込み（点）、計算した操作量を出して、次に書き換えるまで保つ。(A) 計算が終わりしだい出すと、測ってから出すまでの時間 L_c は取り込みと計算の時間で、回ごとに少し揺れることがある。(B) 次の周期の初めに出すと、L_c はいつもちょうど T_s になる。どちらも、出す値は階段になる。")


F["e15_timing"] = _f15_timing_fig()


# =====================================================================
# 2 節: 零次ホールドとサンプリングの遅れ
# =====================================================================
def _f15_zoh_wave_fig():
    o = []
    wT = 0.6           # ωT_s
    Ts = 1.0; w = wT / Ts
    tend = 16.0
    o.append(TX(14, 18, "(a) 正弦波（ωT_s = 0.6 rad）を T_s ごとに取り出して保った階段", "start", 11, INK, True))
    p = Plot(70, 32, 600, 150, (0, tend), (-1.25, 1.25))
    o.append(p.axes(xl=None, yl="値", xt=list(range(0, 17, 2)), yt=[-1, 0, 1], xfmt=lambda v: "", yfmt=_f15_n))
    t = _f15_np.linspace(0, tend, 1601)
    o.append(p.line(list(zip(t, _f15_np.sin(w * t))), c=MUT, lw=1.4, dash="5 3"))
    o.append(p.line(list(zip(t, _f15_np.sin(w * (t - Ts / 2)))), c=TEA, lw=2.0, dash="7 4"))
    pts = []
    for k in range(int(tend)):
        v = math.sin(w * k * Ts)
        pts += [(k * Ts, v), ((k + 1) * Ts, v)]
        o.append(D(p.X(k * Ts), p.Y(v), GLD, 3.2))
    o.append(p.line(pts, c=GLD, lw=2.2))
    # T_s/2 の印
    k0 = 3
    ym = math.sin(w * k0)
    o.append(DIM(p.X(k0), p.Y(ym) - 10, p.X(k0 + 0.5), p.Y(ym) - 10, None, c=TEA))
    o.append(TX(p.X(k0 + 0.25), p.Y(ym) - 16, "T_s/2", "middle", 9.5, TEA, True, halo=True))
    o.append(LEGL(80, 202, [(MUT, "5 3", "出したい値 sin ωt"), (GLD, None, "保った階段（点は取り出した値）"), (TEA, "7 4", "T_s/2 遅らせた正弦波")], 9.5))
    # (b) 差
    o.append(TX(14, 232, "(b) 階段 − T_s/2 遅らせた正弦波（のこぎりの歯の形の速い成分）", "start", 11, INK, True))
    q = Plot(70, 244, 600, 70, (0, tend), (-0.4, 0.4))
    o.append(q.axes(xl="時間 t / T_s", yl="差", xt=list(range(0, 17, 2)), yt=[-0.3, 0, 0.3], xfmt=_f15_n, yfmt=_f15_n))
    tt = _f15_np.linspace(0, tend - 1e-6, 3201)
    hold = _f15_np.sin(w * _f15_np.floor(tt / Ts) * Ts)
    o.append(q.line(list(zip(tt, hold - _f15_np.sin(w * (tt - Ts / 2)))), c=PUR, lw=1.6))
    # (c) ゲインと位相
    o.append(TX(14, 376, "(c) 階段の中の角周波数 ω の成分の比 G_h(jω)", "start", 11, INK, True))
    xs = _f15_np.linspace(0.001, math.pi, 400)
    g = _f15_np.sin(xs / 2) / (xs / 2)
    pa = Plot(70, 392, 250, 110, (0, math.pi), (0.5, 1.05))
    o.append(pa.axes(xl="ωT_s [rad]", yl="ゲイン", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[0.6, 0.8, 1.0], xfmt=_f15_n, yfmt=_f15_n))
    o.append(pa.line(list(zip(xs, g)), c=GLD, lw=2.2))
    pb = Plot(420, 392, 250, 110, (0, math.pi), (-95, 5))
    o.append(pb.axes(xl="ωT_s [rad]", yl="位相 [°]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[-90, -60, -30, 0], xfmt=_f15_n, yfmt=_f15_n))
    o.append(pb.line(list(zip(xs, -_f15_np.degrees(xs / 2))), c=GLD, lw=2.2))
    o.append(pb.line(list(zip(xs, -_f15_np.degrees(xs / 2))), c=TEA, lw=1.4, dash="6 4"))
    for xv in (0.6, 1.0, 2.0):
        o.append(D(pa.X(xv), pa.Y(math.sin(xv / 2) / (xv / 2)), GLD, 3.4))
        o.append(T(pa.X(xv) + 4, pa.Y(math.sin(xv / 2) / (xv / 2)) + 14, _f15_f(math.sin(xv / 2) / (xv / 2), 3), "start", 9, GLD, True, halo=True))
        o.append(D(pb.X(xv), pb.Y(-math.degrees(xv / 2)), GLD, 3.4))
        o.append(T(pb.X(xv) + 5, pb.Y(-math.degrees(xv / 2)) - 5, _f15_f(-math.degrees(xv / 2), 1) + "°", "start", 9, GLD, True, halo=True))
    o.append(TX(pb.X(1.4), pb.Y(-15), "むだ時間 T_s/2 の位相と同じ", "start", 9.5, TEA, True, halo=True))
    o.append(TX(pa.X(0.15), pa.Y(0.62), "ωT_s が小さいと 1 に近い", "start", 9.5, GLD, True, halo=True))
    return _f15_svg(700, 548, o, "零次ホールドの階段と、T_s/2 のむだ時間。(a) 正弦波を T_s ごとに取り出して保つと、階段の各段の高さは、段の真ん中の時刻より T_s/2 前の正弦波の値になり、階段は T_s/2 遅らせた正弦波（青緑の破線）のまわりで上下する。(b) その差は、のこぎりの歯の形の速い成分である。(c) 階段の中の角周波数 ω の成分は、元の正弦波の sin(ωT_s/2)/(ωT_s/2) 倍で、位相はむだ時間 T_s/2 とちょうど同じ −ωT_s/2 だけ遅れる。")


F["e15_zoh_wave"] = _f15_zoh_wave_fig()


def _f15_zoh_step_fig():
    o = []
    Pn, Pd = _F15_PPOS
    Kp = 0.21
    tend = 1.0
    cases = [(0.02, TEA), (0.05, SIG), (0.1, ALI)]
    o.append(TX(14, 18, "(a) モータの角度の比例制御（K_P = 0.21 V/rad）: 目標を 1 rad 変えたときの角度", "start", 11, INK, True))
    p = Plot(70, 34, 600, 200, (0, tend), (0, 1.45))
    o.append(p.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], yt=[0, 0.5, 1, 1.4], xfmt=_f15_n, yfmt=_f15_n))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.1, dash="5 3"))
    tc, yc_, uc = _f15_simct(Pn, Pd, [Kp], [1.0], tend, h=1e-4)
    o.append(p.line(list(zip(tc[::5], yc_[::5])), c=MUT, lw=1.8, dash="5 3"))
    labs = [(MUT, "5 3", "連続時間（5.0 %）")]
    res = {}
    for Ts, c in cases:
        M = int(round(Ts / 1e-4))
        t, y, u = _f15_simsd(Pn, Pd, lambda e: Kp * e, Ts, tend, M=M)
        td, yd, ud = _f15_simfb(Pn, Pd, Kp, tend, h=1e-4, Lm=Ts / 2)
        o.append(p.line(list(zip(td[::5], yd[::5])), c=c, lw=1.2, dash="3 3"))
        o.append(p.line(list(zip(t[::5], y[::5])), c=c, lw=2.2))
        ks = _f15_np.arange(0, int(tend / Ts) + 1)
        for k in ks:
            i = int(round(k * Ts / 1e-4))
            if i < len(y):
                o.append(D(p.X(t[i]), p.Y(y[i]), c, 2.4))
        mp, _ = _f15_metrics(t, y)
        labs.append((c, None, "T_s = %s ms（%s %%）" % (_f15_n(Ts * 1000), _f15_f(mp, 1))))
        res[Ts] = (t, u)
    o.append(LEGL(80, 292, labs, 9.5, 14))
    o.append(TX(80, 310, "細い破線: 連続時間のループで、測った値に T_s/2 のむだ時間を入れた応答（ほとんど重なる）。点: 取り出した値。", "start", 9.5, MUT))
    # (b) 電圧
    o.append(TX(14, 340, "(b) 電圧（T_s = 50 ms の階段と連続時間）", "start", 11, INK, True))
    q = Plot(70, 354, 600, 110, (0, tend), (-0.12, 0.24))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], yt=[-0.1, 0, 0.1, 0.2], xfmt=_f15_n, yfmt=_f15_n))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(q.line(list(zip(tc[::5], uc[::5])), c=MUT, lw=1.6, dash="5 3"))
    t5, u5 = res[0.05]
    o.append(q.line(list(zip(t5[::5], u5[::5])), c=GLD, lw=2.2))
    return _f15_svg(700, 500, o, "サンプリング周期 T_s を延ばしたときの、モータの角度の比例制御（P(s) = 1000/{s(s + 20)} rad/V、K_P = 0.21 V/rad、測ってすぐ出す）。(a) T_s を延ばすほど行き過ぎ量が増える（連続時間の 5.0 % に対し、20 ms で 8.7 %、50 ms で 16.9 %、100 ms で 34.1 %）。細い破線の、連続時間のループで測った値に T_s/2 のむだ時間を入れた応答と、ほとんど重なる。(b) 電圧は T_s の間一定の階段で、連続時間の電圧より遅れて動く。")


F["e15_zoh_step"] = _f15_zoh_step_fig()


# =====================================================================
# 3 節: エイリアシングと前置フィルタ
# =====================================================================
def _f15_alias_wave_fig():
    o = []
    o.append(TX(14, 18, "(a) 周波数 0.9f_s の正弦波を T_s ごとに取り出す", "start", 11, INK, True))
    p = Plot(70, 34, 600, 150, (0, 12), (-1.3, 1.3))
    o.append(p.axes(xl="時間 t / T_s", yl="値", xt=list(range(0, 13)), yt=[-1, 0, 1], xfmt=_f15_n, yfmt=_f15_n))
    t = _f15_np.linspace(0, 12, 2401)
    o.append(p.line(list(zip(t, _f15_np.sin(2 * math.pi * 0.9 * t))), c=TEA, lw=1.4))
    o.append(p.line(list(zip(t, _f15_np.sin(2 * math.pi * (0.9 - 1.0) * t))), c=ALI, lw=2.2, dash="7 4"))
    for k in range(13):
        v = math.sin(2 * math.pi * 0.9 * k)
        o.append(D(p.X(k), p.Y(v), INK, 3.6))
    o.append(LEGL(80, 240, [(TEA, None, "元の揺れ（0.9f_s）"), (ALI, "7 4", "点の列が示す揺れ（0.1f_s）")], 9.5, 18))
    o.append(T(470, 240, "点: 取り出した値", "start", 9.5, INK))
    # (b) 折り返し
    o.append(TX(14, 272, "(b) 元の周波数 f と、取り出した点の列に現れる周波数 |f − mf_s|", "start", 11, INK, True))
    q = Plot(70, 288, 600, 150, (0, 2.6), (0, 0.6))
    o.append(RECT(q.X(0.5), q.y, q.X(2.6) - q.X(0.5), q.h, 0, ASOFT, "none", 0))
    o.append(q.axes(xl="元の周波数 f / f_s", yl="現れる周波数 / f_s", xt=[0, 0.5, 1, 1.5, 2, 2.5], yt=[0, 0.1, 0.25, 0.5], xfmt=_f15_n, yfmt=_f15_n))
    xs = _f15_np.linspace(0, 2.6, 1041)
    fa = _f15_np.abs(xs - _f15_np.round(xs))
    o.append(q.line(list(zip(xs, fa)), c=SIG, lw=2.2))
    o.append(W(q.x, q.Y(0.1), q.x + q.w, q.Y(0.1), c=ALI, lw=1, dash="4 3"))
    for fv in (0.1, 0.9, 1.1, 1.9, 2.1):
        o.append(D(q.X(fv), q.Y(0.1), ALI, 4))
        o.append(T(q.X(fv), q.Y(0.1) + 16, _f15_n(fv), "middle", 9.5, ALI, True, halo=True))
    o.append(W(q.X(0.5), q.y, q.X(0.5), q.y + q.h, c=MUT, lw=1.2, dash="5 3"))
    o.append(TX(q.X(0.5) + 6, q.y + 14, "ナイキスト周波数 f_s/2: これより速い成分は折り返して現れる", "start", 9.5, ALI, True, halo=True))
    return _f15_svg(700, 476, o, "エイリアシング。(a) 周波数 0.9f_s の正弦波（青緑）を T_s ごとに取り出すと、点の列は周波数 0.1f_s のゆっくりした正弦波（赤の破線。符号は逆）とまったく同じになる。(b) 周波数 f の成分は、f_s の整数倍との差の大きさ |f − mf_s| が最も小さくなる周波数に現れる。グラフは f_s/2 ごとに折り返し、0.1f_s・0.9f_s・1.1f_s・1.9f_s・2.1f_s の成分は、どれも 0.1f_s に現れる。")


F["e15_alias_wave"] = _f15_alias_wave_fig()


def _f15_plate_sim(fm, A, filt, tEnd=1600.0, h=0.1, Tf=0.1):
    """温度の板（1.25e^{−20s}/(500s + 1)）の PI（10 W/K・160 s、1 s ごと、クランプ）。読みに周波数 fm の揺れ（振幅 A）。
    filt: none（そのまま）・rc（時定数 Tf の RC）。返り値 [(t, 板の温度の上がり, 読み, 電力)]（1 s ごと）"""
    K, T, L, Kp, Ti, Ts = 1.25, 500.0, 20.0, 10.0, 160.0, 1.0
    q = math.exp(-h / T); n = int(round(tEnd / h)); nd = int(round(L / h))
    y, I, u = 35.0, 28.0, 28.0; buf = [28.0] * nd; bi = 0; out = []; M = int(round(Ts / h))
    Hm = 1 / (1 + 1j * 2 * math.pi * fm * Tf)
    for i in range(n + 1):
        t = i * h
        if i % M == 0:
            if filt == "none":
                hum = A * math.sin(2 * math.pi * fm * t)
            else:
                hum = A * abs(Hm) * math.sin(2 * math.pi * fm * t + math.atan2(Hm.imag, Hm.real))
            rd = y + hum; e = 35.0 - rd; uc = Kp * e + I
            u = min(max(uc, 0.0), 80.0)
            if not ((uc > 80 and e > 0) or (uc < 0 and e < 0)):
                I += Kp * Ts / Ti * e
            out.append((t, y, rd, u))
        ua = buf[bi]; buf[bi] = u; bi = (bi + 1) % nd
        y = K * ua + (y - K * ua) * q
    return _f15_np.array(out)


def _f15_alias_plate_fig():
    o = []
    a = _f15_plate_sim(50.0025, 0.5, "none")
    b = _f15_plate_sim(50.0025, 0.5, "rc")
    o.append(TX(14, 18, "温度の板の PI 制御（1 s ごと）。読みに 50.0025 Hz・振幅 0.5 K の揺れが乗る", "start", 11, INK, True))
    rows = [("(a) 読み（センサの値）[°C]", 2, (59.2, 60.8), [59.5, 60, 60.5], lambda v: v + 25),
            ("(b) ヒータの電力 [W]", 3, (22, 34), [24, 28, 32], lambda v: v),
            ("(c) 本当の板の温度 [°C]", 1, (59.2, 60.8), [59.5, 60, 60.5], lambda v: v + 25)]
    y0 = 40
    for title, col, yr, yt, fn in rows:
        o.append(TX(70, y0 + 2, title, "start", 10.5, INK, True))
        p = Plot(70, y0 + 10, 600, 90, (0, 1600), yr)
        last = col == 1
        o.append(p.axes(xl="時間 t [s]" if last else None, yl=None, xt=[0, 400, 800, 1200, 1600], yt=yt, xfmt=(_f15_n if last else (lambda v: "")), yfmt=_f15_n))
        if col != 3:
            o.append(W(p.x, p.Y(60), p.x + p.w, p.Y(60), c=MUT, lw=1, dash="5 3"))
        o.append(p.line([(r[0], fn(r[col])) for r in a], c=ALI, lw=1.6))
        o.append(p.line([(r[0], fn(r[col])) for r in b], c=GRN, lw=2.0))
        y0 += 128
    o.append(DIM(70 + 600 * 400 / 1600, 98, 70 + 600 * 800 / 1600, 98, None, c=ALI))
    o.append(T(70 + 600 * 600 / 1600, 94, "周期 400 s", "middle", 9.5, ALI, True, halo=True))
    o.append(LEGL(80, y0 + 18, [(ALI, None, "フィルタなし: 本当の温度が ±0.6 K 揺れる"), (GRN, None, "RC（T_f = 0.1 s）を ADC の前に: ±0.02 K")], 9.5, 18))
    return _f15_svg(700, y0 + 30, o, "温度の板（11 章 3 節の PI、10 W/K・160 s）を 1 s ごとに制御し、読みに商用電源の揺れ（50.0025 Hz、振幅 0.5 K。例の値）が乗る場合。(a) 1 s ごとに取り出した読みには、周期 400 s（0.0025 Hz）のゆっくりした揺れが現れる。(b) 制御器はそれを本当の温度の変化として直そうとし、ヒータの電力を ±3.8 W 動かす。(c) その結果、本当の板の温度が ±0.6 K 揺れる。ADC の前に時定数 0.1 s の RC を置くと、50 Hz は 1/31 に減り、揺れは ±0.02 K に収まる。")


F["e15_alias_plate"] = _f15_alias_plate_fig()


def _f15_aaf_fig():
    o = []
    fcs = [(50.0, PUR), (100.0, SIG), (200.0, TEA), (500.0, GRN)]
    o.append(TX(14, 18, "(a) RC のアンチエイリアスフィルタのゲイン（T_s = 1 ms、f_s = 1 kHz）", "start", 11, INK, True))
    p = Plot(70, 34, 330, 190, (10, 10000), (-40, 3), xlog=True)
    o.append(RECT(p.X(500), p.y, p.X(10000) - p.X(500), p.h, 0, ASOFT, "none", 0))
    o.append(p.axes(xl="周波数 f [Hz]", yl="ゲイン [dB]", yt=[-40, -30, -20, -10, 0], yfmt=_f15_n))
    fs = _f15_np.logspace(1, 4, 400)
    for fc, c in fcs:
        g = -10 * _f15_np.log10(1 + (fs / fc) ** 2)
        o.append(p.clip(list(zip(fs, g)), c=c, lw=2.0))
    o.append(W(p.X(500), p.y, p.X(500), p.y + p.h, c=ALI, lw=1.2, dash="5 3"))
    o.append(W(p.X(1000), p.y, p.X(1000), p.y + p.h, c=ALI, lw=1, dash="2 3"))
    o.append(TX(p.X(500) + 4, p.y + 13, "f_s/2", "start", 9.5, ALI, True, halo=True))
    o.append(TX(p.X(1000) + 4, p.y + 27, "f_s（一定のずれに化ける）", "start", 9, ALI, True, halo=True))
    o.append(T(p.X(800), p.y + p.h - 8, "折り返す範囲", "middle", 9.5, ALI, True, halo=True))
    # (b) 釣り合い
    o.append(TX(434, 18, "(b) 速い揺れの減り方と、交差での位相の遅れ", "start", 11, INK, True))
    q = Plot(474, 34, 200, 190, (0, 6), (0, 0.8))
    o.append(q.axes(xl="30 rad/s での位相の遅れ [°]", yl="500 Hz のゲイン", xt=[0, 2, 4, 6], yt=[0, 0.2, 0.4, 0.6, 0.8], xfmt=_f15_n, yfmt=_f15_n))
    pts = []
    for fc, c in fcs:
        lag = math.degrees(math.atan(30.0 / (2 * math.pi * fc)))
        g5 = 1 / math.sqrt(1 + (500 / fc) ** 2)
        pts.append((lag, g5, c, fc))
    o.append(q.line([(a_, b_) for a_, b_, _, _ in pts], c=FNT, lw=1.2, dash="3 3"))
    for lag, g5, c, fc in pts:
        o.append(D(q.X(lag), q.Y(g5), c, 4.5))
        o.append(T(q.X(lag) + 7, q.Y(g5) + 4, "%g Hz" % fc, "start", 9.5, c, True, halo=True))
    o.append(T(q.X(5.8), q.Y(0.75), "折れ点を下げると", "end", 9, MUT, halo=True))
    o.append(T(q.X(5.8), q.Y(0.75) + 12, "速い揺れは減るが", "end", 9, MUT, halo=True))
    o.append(T(q.X(5.8), q.Y(0.75) + 24, "位相が遅れる", "end", 9, MUT, halo=True))
    o.append(LEGL(80, 272, [(PUR, None, "折れ点 50 Hz"), (SIG, None, "100 Hz"), (TEA, None, "200 Hz"), (GRN, None, "500 Hz")], 9.5, 16))
    return _f15_svg(700, 284, o, "1 ms ごとに測るモータの角度のループ（交差 30 rad/s）に置く、RC のアンチエイリアスフィルタ。(a) 塗った範囲（f_s/2 = 500 Hz より上）の揺れは折り返して遅い揺れに化けるので、サンプリングの前に減らしておく。(b) 折れ点 100 Hz なら 500 Hz の揺れを 0.20 倍に減らし、交差での位相を 2.7° 遅らせる。折れ点を下げるほど揺れは減るが、位相の遅れが増える。")


F["e15_aaf"] = _f15_aaf_fig()


# =====================================================================
# 4 節: 差分で近似する
# =====================================================================
def _f15_diff3_fig():
    o = []
    f = lambda s: 0.5 + 0.3 * s + 0.25 * s * s         # 1 周期の中の値の動き（例）
    exact = 0.5 + 0.3 / 2 + 0.25 / 3
    panels = [("(a) 前進差分", "左端の値 × T_s", _F15_CF, "left", "時刻 k−1 の傾き ≈ 差 ÷ T_s"),
              ("(b) 後退差分", "右端の値 × T_s", _F15_CB, "right", "時刻 k の傾き ≈ 差 ÷ T_s"),
              ("(c) 双一次変換", "両端の平均 × T_s（台形）", _F15_CT, "trap", "両端の傾きの平均 = 差 ÷ T_s")]
    for i, (title, sub, c, kind, der) in enumerate(panels):
        x0 = 20 + i * 228
        o.append(T(x0 + 4, 18, title, "start", 11, c, True))
        p = Plot(x0 + 34, 34, 170, 150, (-0.25, 1.25), (0, 1.3))
        o.append(W(p.X(-0.25), p.Y(0), p.X(1.25), p.Y(0), c=MUT, lw=1.1))
        if kind == "left":
            area = [(0, 0), (0, f(0)), (1, f(0)), (1, 0)]
            approx = f(0)
        elif kind == "right":
            area = [(0, 0), (0, f(1)), (1, f(1)), (1, 0)]
            approx = f(1)
        else:
            area = [(0, 0), (0, f(0)), (1, f(1)), (1, 0)]
            approx = (f(0) + f(1)) / 2
        o.append(PL([(p.X(a), p.Y(b)) for a, b in area], c=c, lw=1.4, fill=soft(c)))
        ss = _f15_np.linspace(-0.2, 1.2, 141)
        o.append(p.line(list(zip(ss, [f(v) for v in ss])), c=INK, lw=2.0))
        o.append(D(p.X(0), p.Y(f(0)), INK, 3.6)); o.append(D(p.X(1), p.Y(f(1)), INK, 3.6))
        o.append(W(p.X(0), p.Y(0), p.X(0), p.Y(0) + 5, c=MUT, lw=1)); o.append(W(p.X(1), p.Y(0), p.X(1), p.Y(0) + 5, c=MUT, lw=1))
        o.append(TX(p.X(0), p.Y(0) + 16, "(k−1)T_s", "middle", 9, MUT))
        o.append(TX(p.X(1), p.Y(0) + 16, "kT_s", "middle", 9, MUT))
        o.append(TX(p.X(0) - 4, p.Y(f(0)) - 6, "u[k−1]", "end", 9, INK, False, True))
        o.append(TX(p.X(1) + 4, p.Y(f(1)) - 4, "u[k]", "start", 9, INK, False, True))
        o.append(TX(x0 + 4, 214, sub, "start", 10, c, True))
        err = (approx - exact) / exact * 100
        o.append(T(x0 + 4, 230, "本当の面積との差: %s %%" % _f15_f(err, 1), "start", 9.5, MUT))
        o.append(TX(x0 + 4, 248, der, "start", 9.5, INK))
    return _f15_svg(700, 260, o, "1 周期の間の面積 ∫u dt（黒い曲線の下）を、両端の値 u[k−1]・u[k] だけで近づける 3 つの方法。(a) 前進差分は左端の値の長方形、(b) 後退差分は右端の値の長方形、(c) 双一次変換は両端を結んだ台形で近づける。どれも、微分を差 (u[k] − u[k−1])/T_s で近づけることと同じで、その差をどの時刻の傾きとみなすかが違う。曲線が直線に近いほど台形の誤差は小さい。")


F["e15_diff3"] = _f15_diff3_fig()


def _f15_map_fig():
    o = []
    pts = [complex(-0.3, 0), complex(-1.5, 0), complex(-3.0, 0), complex(-0.4, 1.2), complex(-1.5, 1.4)]
    def mark(p, z, i, c=INK):
        if not (p.xr[0] <= z.real <= p.xr[1] and p.yr[0] <= z.imag <= p.yr[1]):
            return ""
        s = D(p.X(z.real), p.Y(z.imag), c, 3.6)
        dx, dy, an = {1: (3, -6, "start"), 2: (3, 15, "start"), 3: (-4, -6, "end"), 4: (3, -6, "start"), 5: (4, -5, "start")}[i]
        if z.imag < -1e-9:
            dy = 15
        return s + T(p.X(z.real) + dx, p.Y(z.imag) + dy, str(i), an, 9.5, c, True, halo=True)
    def frame(p, title, xt, yt):
        r = [RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8)]
        r.append(p.axes(xt=xt, yt=yt, xfmt=_f15_n, yfmt=_f15_n, sz=8.5))
        r.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        if p.xr[0] < 0 < p.xr[1]:
            r.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
        r.append(TX(p.x, p.y - 8, title, "start", 10.5, INK, True))
        return "".join(r)
    th = _f15_np.linspace(0, 2 * math.pi, 241)
    unit = lambda p: p.line([(math.cos(a), math.sin(a)) for a in th], c=INK, lw=1.3, dash="4 3")
    # (a) s 平面
    pa = Plot(52, 40, 190, 163, (-3.4, 0.8), (-1.8, 1.8))
    o.append(RECT(pa.x, pa.y, pa.X(0) - pa.x, pa.h, 0, GSOFT, "none", 0))
    o.append(frame(pa, "(a) 連続時間の極 λT_s", [-3, -2, -1, 0], [-1, 0, 1]))
    o.append(pa.clip([(-1 + math.cos(a), math.sin(a)) for a in th], c=_F15_CF, lw=1.4, dash="5 3"))
    o.append(T(pa.X(-1), pa.Y(-1) + 13, "前進差分で発散しない範囲", "middle", 8.5, _F15_CF, True, halo=True))
    for i, z in enumerate(pts, 1):
        o.append(mark(pa, z, i))
    o.append(T(pa.X(-3.3), pa.Y(1.45), "左半平面（安定）", "start", 9, GRN, True, halo=True))
    maps = [("(b) 正しい倍率 exp(λT_s)", lambda z: _f15_np.exp(z), _F15_CX),
            ("(c) 前進差分 1 + λT_s", lambda z: 1 + z, _F15_CF),
            ("(d) 後退差分 1/(1 − λT_s)", lambda z: 1 / (1 - z), _F15_CB),
            ("(e) 双一次変換", lambda z: (1 + z / 2) / (1 - z / 2), _F15_CT)]
    pos = [(300, 40), (500, 40), (52, 262), (300, 262)]
    for (title, fz, c), (px, py) in zip(maps, pos):
        if c == _F15_CF:
            p = Plot(px, py, 150, 150, (-2.3, 1.5), (-1.9, 1.9))
        else:
            p = Plot(px, py, 150, 150, (-1.3, 1.3), (-1.3, 1.3))
        # 左半平面の像を塗る（点を細かく写して多角形で近づける）
        if c == _F15_CF:
            o.append(RECT(p.x, p.y, p.X(1) - p.x, p.h, 0, soft(c), "none", 0))
        else:
            if c == _F15_CB:
                poly = [(0.5 + 0.5 * math.cos(a), 0.5 * math.sin(a)) for a in th]
            else:
                poly = [(math.cos(a), math.sin(a)) for a in th]
            o.append(PL([(p.X(a), p.Y(b)) for a, b in poly], c="none", lw=0, fill=soft(c)))
        o.append(frame(p, title, [-2, -1, 0, 1] if c == _F15_CF else [-1, 0, 1], [-1, 0, 1]))
        o.append(unit(p))
        if c == _F15_CF:
            o.append(W(p.X(1), p.y, p.X(1), p.y + p.h, c=c, lw=1.6))
        elif c == _F15_CB:
            o.append(p.line([(0.5 + 0.5 * math.cos(a), 0.5 * math.sin(a)) for a in th], c=c, lw=1.6))
        else:
            o.append(p.line([(math.cos(a), math.sin(a)) for a in th], c=c, lw=1.6))
        for i, z in enumerate(pts, 1):
            w_ = complex(fz(z))
            o.append(mark(p, w_, i, ALI if abs(w_) > 1 else INK))
            if w_.imag != 0 and z.imag != 0:
                o.append(mark(p, w_.conjugate(), i, ALI if abs(w_) > 1 else INK))
    # 説明
    nx = 500
    notes = [(_F15_CX, "正しい倍率: 左半平面 → 単位円の内側"),
             (_F15_CF, "前進差分: 左半平面 → 1 より左の半平面。"),
             (_F15_CF, "  速い極 3 と揺れる極 4・5 は外（発散）"),
             (_F15_CB, "後退差分: 左半平面 → 小さな円の内側"),
             (_F15_CT, "双一次変換: 左半平面 → 単位円の内側"),
             (INK, "破線の円: 単位円（半径 1）"),
             (INK, "番号: (a) の極 1〜5 の写る先")]
    for i, (c, s) in enumerate(notes):
        o.append(T(nx, 286 + i * 18, s, "start", 9.5, c, True))
    return _f15_svg(700, 444, o, "連続時間の極 λ（(a)。横軸と縦軸は λT_s の実部と虚部）が、1 周期の倍率としてどこに写るか。塗った所は左半平面全体の写る先、破線は原点を中心とする半径 1 の円（単位円）で、倍率がその内側なら計算式は発散しない。(b) 正しい倍率 e^{λT_s} では、左半平面はちょうど単位円の内側に写る。(c) 前進差分では左半平面が 1 より左の半平面に写り、速い極 3 と、虚軸に近い揺れる極 4・5 は単位円の外に出る（赤）。(d) 後退差分では内側の小さな円に、(e) 双一次変換では単位円の内側全体に写る。")


F["e15_map"] = _f15_map_fig()


def _f15_lead_dfreq(Ts, method, ws, w0=30.0):
    b0, b1, a = _f15_lead_coef(method, Ts, w0=w0)
    z = _f15_np.exp(1j * ws * Ts)
    return (b0 + b1 / z) / (1 - a / z)


def _f15_disc_cmp_fig():
    o = []
    Cn, Cd = _F15_LEAD
    Pn, Pd = _F15_PPOS
    Ts = 0.01
    ws = _f15_np.logspace(0, math.log10(math.pi / Ts * 0.999), 500)
    Cc = _f15_np.polyval(Cn, 1j * ws) / _f15_np.polyval(Cd, 1j * ws)
    curves = [(ws, 20 * _f15_np.log10(_f15_np.abs(Cc)), _f15_np.degrees(_f15_np.angle(Cc)), MUT, "5 3")]
    for m, c in (("fwd", _F15_CF), ("bwd", _F15_CB), ("tus", _F15_CT)):
        v = _f15_lead_dfreq(Ts, m, ws)
        curves.append((ws, 20 * _f15_np.log10(_f15_np.abs(v)), _f15_np.degrees(_f15_np.unwrap(_f15_np.angle(v))), c, None))
    o.append(TX(14, 18, "(a) 進み補償器のボード線図（T_s = 10 ms、π/T_s = 314 rad/s まで）", "start", 11, INK, True))
    svg, pm, pp, hb = BODE(70, 34, 270, curves, (1, 330), (-6, 6), (-10, 45), hm=100, hp=110, gap=26, dbt=[-5, 0, 5], pht=[0, 15, 30, 45])
    o.append(svg)
    o.append(W(pp.X(30), pm.y, pp.X(30), pp.y + pp.h, c=FNT, lw=1, dash="3 3"))
    o.append(TX(pp.X(30) + 3, pp.y + 12, "ω_gc", "start", 9, MUT, True, halo=True))
    # (b) ステップ応答
    o.append(TX(380, 18, "(b) 目標を 1 rad 変えたときの角度（T_s = 10 ms）", "start", 11, INK, True))
    q = Plot(420, 34, 260, 160, (0, 0.4), (0, 1.3))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 0.5, 1], xfmt=_f15_n, yfmt=_f15_n))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=MUT, lw=1, dash="5 3"))
    tc, yc_, uc = _f15_simct(Pn, Pd, Cn, Cd, 0.4, h=1e-4)
    o.append(q.line(list(zip(tc[::4], yc_[::4])), c=MUT, lw=1.8, dash="5 3"))
    for m, c in (("fwd", _F15_CF), ("bwd", _F15_CB), ("tus", _F15_CT)):
        b0, b1, a = _f15_lead_coef(m, Ts)
        t, y, u = _f15_simsd(Pn, Pd, _F15Rec(b0, b1, a), Ts, 0.4, M=100)
        o.append(q.line(list(zip(t[::4], y[::4])), c=c, lw=2.0))
    # (c) T_s = 30 ms の電圧
    o.append(TX(380, 250, "(c) T_s = 30 ms の電圧", "start", 11, INK, True))
    r_ = Plot(420, 264, 260, 120, (0, 0.4), (-1.6, 2.0))
    o.append(r_.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[-1, 0, 1, 2], xfmt=_f15_n, yfmt=_f15_n))
    o.append(W(r_.x, r_.Y(0), r_.x + r_.w, r_.Y(0), c=MUT, lw=1))
    for m, c in (("tus", _F15_CT), ("fwd", _F15_CF)):
        b0, b1, a = _f15_lead_coef(m, 0.03)
        t, y, u = _f15_simsd(Pn, Pd, _F15Rec(b0, b1, a), 0.03, 0.4, M=150)
        o.append(r_.line(list(zip(t, u)), c=c, lw=1.8))
    o.append(T(r_.X(0.13), r_.Y(-1.25), "前進差分: 1 回ごとに符号を変えて揺れる", "start", 9, _F15_CF, True, halo=True))
    o.append(LEGL(70, 412, [(MUT, "5 3", "連続時間"), (_F15_CF, None, "前進差分"), (_F15_CB, None, "後退差分"), (_F15_CT, None, "双一次変換")], 9.5, 16))
    return _f15_svg(700, 424, o, "13 章 3 節の進み補償器（0.624(1 + s/17.3)/(1 + s/52.0) V/rad）を 3 つの近似で計算式にしたもの。(a) T_s = 10 ms では、交差 30 rad/s で、前進差分は位相が 4.6° 進み、後退差分は 4.0° 遅れ、双一次変換は連続時間と同じ位相になる（ゲインのずれは小さい）。(b) 零次ホールドの遅れと合わせた位相余裕は 59.9°・51.3°・55.1° で、行き過ぎ量は 7.6・15.8・12.1 %（連続時間は 63.7°・5.1 %）。(c) T_s = 30 ms では、前進差分の制御器の倍率 1 − 52.0T_s が負になり、電圧が 1 回ごとに符号を変えて揺れる。")


F["e15_disc_cmp"] = _f15_disc_cmp_fig()


def _f15_warp_fig():
    o = []
    o.append(TX(14, 18, "(a) 双一次変換の角周波数の目盛のゆがみ ω_w = (2/T_s)tan(ωT_s/2)", "start", 11, INK, True))
    p = Plot(70, 34, 250, 200, (0, 100), (0, 120))
    o.append(p.axes(xl="本当の角周波数 ω [rad/s]", yl="ω_w [rad/s]", xt=[0, 25, 50, 75, 100], yt=[0, 30, 60, 90, 120], xfmt=_f15_n, yfmt=_f15_n))
    o.append(p.line([(0, 0), (100, 100)], c=MUT, lw=1.2, dash="5 3"))
    for Ts, c in ((0.01, TEA), (0.03, SIG)):
        ws = _f15_np.linspace(0, min(100, math.pi / Ts * 0.98), 300)
        o.append(p.clip(list(zip(ws, (2 / Ts) * _f15_np.tan(ws * Ts / 2))), c=c, lw=2.2))
    w1 = (2 / 0.03) * math.atan(30 * 0.03 / 2)
    o.append(W(p.X(w1), p.Y(0), p.X(w1), p.Y(30), p.X(0), p.Y(30), c=ALI, lw=1.2, dash="3 3"))
    o.append(D(p.X(w1), p.Y(30), ALI, 4))
    o.append(T(p.X(w1) + 6, p.Y(30) + 16, "28.2 rad/s → 30", "start", 9.5, ALI, True, halo=True))
    o.append(TX(p.X(60), p.Y(108), "T_s = 30 ms", "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(76), p.Y(84), "10 ms", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(98), p.Y(70), "ω_w = ω", "end", 9.5, MUT, halo=True))
    # (b) 位相
    o.append(TX(370, 18, "(b) 進み補償器の位相（T_s = 30 ms）", "start", 11, INK, True))
    q = Plot(410, 34, 270, 200, (3, 100), (0, 36), xlog=True)
    o.append(q.axes(xl="角周波数 ω [rad/s]", yl="位相 [°]", yt=[0, 10, 20, 30], yfmt=_f15_n))
    Cn, Cd = _F15_LEAD
    ws = _f15_np.logspace(math.log10(3), math.log10(100), 400)
    Cc = _f15_np.polyval(Cn, 1j * ws) / _f15_np.polyval(Cd, 1j * ws)
    o.append(q.line(list(zip(ws, _f15_np.degrees(_f15_np.angle(Cc)))), c=MUT, lw=1.8, dash="5 3"))
    for m, c in (("tus", _F15_CT), ("pre", _F15_CX)):
        v = _f15_lead_dfreq(0.03, m, ws)
        ph = _f15_np.degrees(_f15_np.angle(v))
        o.append(q.line(list(zip(ws, ph)), c=c, lw=2.0))
        i = int(ph.argmax())
        o.append(D(q.X(ws[i]), q.Y(ph[i]), c, 4))
    o.append(W(q.X(30), q.y, q.X(30), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(28.2) - 5, q.Y(30.05) + 18, "山の頂 28.2", "end", 9.5, _F15_CT, True, halo=True))
    o.append(T(q.X(30) + 5, q.Y(30.05) - 8, "30 rad/s", "start", 9.5, _F15_CX, True, halo=True))
    o.append(LEGL(70, 282, [(MUT, "5 3", "連続時間"), (_F15_CT, None, "双一次変換"), (_F15_CX, None, "30 rad/s でプリワーピングした双一次変換")], 9.5, 16))
    return _f15_svg(700, 294, o, "双一次変換の角周波数の目盛のゆがみとプリワーピング。(a) 計算式は、本当の角周波数 ω で、元の伝達関数の ω_w での値を出す。ω_w は ω が小さいとほぼ ω だが、π/T_s に近づくと急に大きくなる。T_s = 30 ms では、元の 30 rad/s の値が本当の 28.2 rad/s に現れる。(b) そのため、進み補償器の位相の山の頂は 28.2 rad/s へずれる。30 rad/s でプリワーピングすると、山の頂は 30 rad/s に戻る。")


F["e15_warp"] = _f15_warp_fig()


# =====================================================================
# 5 節: z 変換と離散時間の極
# =====================================================================
def _f15_zgrid_fig():
    o = []
    rs = [0.5, 0.85, 1.0, 1.1]
    ths = [(0, "0°"), (math.pi / 4, "45°"), (math.pi / 2, "90°"), (math.pi, "180°")]
    rc = lambda r: SIG if r < 1 else (GLD if r == 1 else ALI)
    # 左: z 平面
    o.append(T(14, 18, "(a) z 平面の極の位置", "start", 11, INK, True))
    p = Plot(40, 60, 170, 170, (-1.25, 1.25), (-1.25, 1.25))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1)); o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
    th = _f15_np.linspace(0, 2 * math.pi, 241)
    o.append(p.line([(math.cos(a), math.sin(a)) for a in th], c=INK, lw=1.3, dash="4 3"))
    for th_, lab in ths:
        for r in rs:
            for sg in ((1, -1) if 0 < th_ < math.pi else (1,)):
                z = r * complex(math.cos(th_), sg * math.sin(th_))
                o.append(D(p.X(z.real), p.Y(z.imag), rc(r), 3.2))
    o.append(T(p.x + 4, p.y + p.h + 16, "破線: 単位円", "start", 9.5, INK))
    for i, (r, lab) in enumerate([(0.5, "|z| = 0.5・0.85: 内側"), (1.0, "|z| = 1: 単位円の上"), (1.1, "|z| = 1.1: 外側")]):
        o.append(D(46, p.y + p.h + 34 + i * 16 - 4, rc(r), 3.6))
        o.append(T(56, p.y + p.h + 34 + i * 16, lab, "start", 9.5, rc(r), True))
    # 右: 応答の列
    o.append(T(244, 18, "(b) インパルスを入れたときの出力の列（k = 0〜16）", "start", 11, INK, True))
    cw, ch, gx, gy = 112, 70, 254, 50
    for j, r in enumerate(rs):
        o.append(T(gx + j * cw + cw / 2, gy - 6, "|z| = %s" % _f15_n(r), "middle", 10, rc(r), True))
    for i, (th_, lab) in enumerate(ths):
        o.append(T(gx - 6, gy + i * ch + ch / 2 + 4, lab, "end", 10, INK, True))
        for j, r in enumerate(rs):
            x0, y0 = gx + j * cw, gy + i * ch
            o.append(RECT(x0 + 3, y0 + 3, cw - 6, ch - 6, 4, SCR, LIN, 0.8))
            q = Plot(x0 + 8, y0 + 8, cw - 16, ch - 16, (-0.5, 16.5), (-1.9, 1.9))
            o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=LIN, lw=0.8))
            for k in range(17):
                v = r ** k * math.cos(k * th_)
                vv = max(-1.9, min(1.9, v))
                o.append(W(q.X(k), q.Y(0), q.X(k), q.Y(vv), c=rc(r), lw=1.1))
                o.append(D(q.X(k), q.Y(vv), rc(r), 1.8))
    o.append(T(gx - 30, gy + 4 * ch / 2 + 4, "偏角", "middle", 10, MUT, rot=-90))
    o.append(T(gx, gy + 4 * ch + 18, "列: 極の大きさ（1 回ごとの縮み方）。行: 極の偏角（1 回ごとに回る角度）。", "start", 9.5, INK))
    o.append(T(gx, gy + 4 * ch + 34, "0° は符号を変えずに変わり、180° は 1 回ごとに符号を変える。", "start", 9.5, INK))
    return _f15_svg(700, gy + 4 * ch + 44, o, "離散時間の極 z の位置と、インパルス（k = 0 だけ 1 の列）を入れたときの出力の列（偏角 0° と 180° は実数の極 1 つ、45° と 90° は共役な極の組）。極の大きさが 1 より小さいと列は 1 回ごとに縮み、1 なら同じ大きさで続き、1 より大きいと大きくなり続ける。偏角は 1 回に回る角度で、180°（負の実軸の上）では 1 回ごとに符号を変える。6 章 3 節の s 平面の極と応答の対応を、z 平面に移したもの。")


F["e15_zgrid"] = _f15_zgrid_fig()


def _f15_zmap_fig():
    o = []
    o.append(TX(14, 18, "(a) s 平面（sT_s の実部と虚部）", "start", 11, INK, True))
    p = Plot(60, 34, 230, 300, (-3.2, 0.7), (-7, 7))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(RECT(p.x, p.Y(math.pi), p.w, p.Y(-math.pi) - p.Y(math.pi), 0, MSOFT, "none", 0))
    o.append(p.axes(xt=[-3, -2, -1, 0], yt=[-6, -math.pi, 0, math.pi, 6], xfmt=_f15_n, yfmt=lambda v: {math.pi: "π", -math.pi: "−π"}.get(v, _f15_n(v)), sz=9))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    vcols = [(-2.0, PUR), (-1.0, TEA), (-0.5, GRN), (0.0, INK)]
    for sx, c in vcols:
        o.append(W(p.X(sx), p.Y(math.pi), p.X(sx), p.Y(-math.pi), c=c, lw=2.0))
    for sy in (math.pi / 2, -math.pi / 2):
        o.append(W(p.X(-3.2), p.Y(sy), p.X(0.7), p.Y(sy), c=GLD, lw=1.6, dash="6 3"))
    for sy in (math.pi, -math.pi):
        o.append(W(p.X(-3.2), p.Y(sy), p.X(0.7), p.Y(sy), c=ALI, lw=1.6, dash="3 3"))
    kz = 0.3 / math.sqrt(1 - 0.09)
    o.append(p.clip([(0, 0), (-kz * 7, 7)], c=SIG, lw=1.6))
    o.append(p.clip([(0, 0), (-kz * 7, -7)], c=SIG, lw=1.6))
    lam = complex(-0.5, 2.0); lam2 = complex(-0.5, 2.0 - 2 * math.pi)
    for z, c in ((lam, INK), (lam.conjugate(), INK), (lam2, ALI), (lam2.conjugate(), ALI)):
        o.append(W(p.X(z.real) - 5, p.Y(z.imag) - 5, p.X(z.real) + 5, p.Y(z.imag) + 5, c=c, lw=2))
        o.append(W(p.X(z.real) - 5, p.Y(z.imag) + 5, p.X(z.real) + 5, p.Y(z.imag) - 5, c=c, lw=2))
    o.append(T(p.X(-0.5) + 8, p.Y(2.0) + 4, "λ", "start", 10, INK, True, halo=True))
    o.append(TX(p.X(-0.5) + 8, p.Y(2.0 - 2 * math.pi) + 4, "λ − j2π/T_s", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(-3.1), p.Y(math.pi) - 5, "虚部 ±π: ナイキスト周波数", "start", 9, ALI, True, halo=True))
    # (b) z 平面
    o.append(TX(360, 18, "(b) z 平面（z = exp(sT_s)）", "start", 11, INK, True))
    q = Plot(380, 54, 260, 260, (-1.15, 1.15), (-1.15, 1.15))
    o.append(RECT(q.x, q.y, q.w, q.h, 0, SCR, LIN, 0.8))
    o.append(q.axes(xt=[-1, -0.5, 0, 0.5, 1], yt=[-1, -0.5, 0, 0.5, 1], xfmt=_f15_n, yfmt=_f15_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1)); o.append(W(q.X(0), q.y, q.X(0), q.y + q.h, c=MUT, lw=1))
    th = _f15_np.linspace(0, 2 * math.pi, 361)
    for sx, c in vcols:
        rr = math.exp(sx)
        o.append(q.line([(rr * math.cos(a), rr * math.sin(a)) for a in th], c=c, lw=2.0))
    for ang in (math.pi / 2, -math.pi / 2):
        o.append(q.line([(0, 0), (1.15 * math.cos(ang), 1.15 * math.sin(ang))], c=GLD, lw=1.6, dash="6 3"))
    o.append(q.line([(0, 0), (-1.15, 0)], c=ALI, lw=1.6, dash="3 3"))
    sp = []
    for wv in _f15_np.linspace(0, 6.0, 200):
        s_ = complex(-0.3 / math.sqrt(1 - 0.09) * wv, wv)
        z = _f15_np.exp(s_)
        sp.append((z.real, z.imag))
    o.append(q.line(sp, c=SIG, lw=1.6))
    zz = _f15_np.exp(lam)
    for z in (zz, zz.conjugate()):
        o.append(W(q.X(z.real) - 5, q.Y(z.imag) - 5, q.X(z.real) + 5, q.Y(z.imag) + 5, c=INK, lw=2))
        o.append(W(q.X(z.real) - 5, q.Y(z.imag) + 5, q.X(z.real) + 5, q.Y(z.imag) - 5, c=INK, lw=2))
    o.append(TX(q.X(zz.real) - 8, q.Y(zz.imag) - 8, "λ と λ − j2π/T_s の写る先", "end", 9.5, INK, True, halo=True))
    labs = [(PUR, None, "実部 −2"), (TEA, None, "−1"), (GRN, None, "−0.5"), (INK, None, "0（虚軸 → 単位円）"),
            (GLD, "6 3", "虚部 ±π/2"), (ALI, "3 3", "±π"), (SIG, None, "減衰比 0.3")]
    o.append(LEGL(30, 372, labs[:4], 9.5, 14))
    o.append(LEGL(30, 392, labs[4:], 9.5, 14))
    return _f15_svg(700, 404, o, "s 平面の点 s を z 平面の点 z = e^{sT_s} に写す（横軸・縦軸は sT_s の実部と虚部）。実部が同じ縦の線は原点を中心とする円に（虚軸は単位円に、左半平面は単位円の内側に）、虚部が同じ横の線は原点からの半直線に写る。灰色の帯（虚部が −π/T_s から π/T_s）だけで z 平面全体を覆い、虚部が 2π/T_s 違う極 λ と λ − j2π/T_s（赤）は、z 平面の同じ点に写る（3 節のエイリアシングと同じこと）。減衰比 0.3 の線は渦巻きに写る。".replace("e^{sT_s}", "e<sup>sT<sub>s</sub></sup>"))


F["e15_zmap"] = _f15_zmap_fig()


def _f15_zloop_fig():
    o = []
    K, Tm, Kp = 50.0, 0.05, 0.1
    zp = lambda Ts: 1 - (1 + K * Kp) * (1 - math.exp(-Ts / Tm))
    o.append(TX(14, 18, "(a) 閉ループの極の動き（T_s を延ばす）", "start", 11, INK, True))
    p = Plot(56, 40, 250, 200, (-1.5, 1.2), (-1.0, 1.0))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(p.axes(xt=[-1.5, -1, -0.5, 0, 0.5, 1], yt=[-1, 0, 1], xfmt=_f15_n, yfmt=_f15_n, sz=9))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1)); o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
    th = _f15_np.linspace(0, 2 * math.pi, 241)
    o.append(p.clip([(math.cos(a), math.sin(a)) for a in th], c=INK, lw=1.3, dash="4 3"))
    Tss = _f15_np.linspace(0.0, 0.025, 200)
    o.append(p.clip([(zp(t), 0.0) for t in Tss], c=SIG, lw=3.0))
    marks = [(0.001, "1"), (0.002, "2"), (0.005, "5"), (0.00912, "9.12"), (0.015, "15"), (0.0203, "20.3"), (0.025, "25 ms")]
    for i, (Ts, lab) in enumerate(marks):
        z = zp(Ts)
        c = SIG if abs(z) < 1 - 1e-3 else (GLD if abs(z) < 1 + 1e-3 else ALI)
        o.append(D(p.X(z), p.Y(0), c, 4))
        o.append(T(p.X(z), p.Y(0) + (-10 if i % 2 == 0 else 20), lab, "middle", 9, c, True, halo=True))
    o.append(T(p.X(0.6), p.Y(0.3), "0 より右: 単調", "middle", 9, SIG, True, halo=True))
    o.append(T(p.X(-0.55), p.Y(0.62), "0 より左: 符号を変えて揺れる", "middle", 9, PUR, True, halo=True))
    o.append(T(p.X(-1.42), p.Y(-0.8), "単位円の外: 発散", "start", 9, ALI, True, halo=True))
    # (b) 応答
    o.append(T(340, 18, "(b) 目標を 100 rad/s にしたときの角速度", "start", 11, INK, True))
    q = Plot(380, 40, 300, 200, (0, 0.2), (0, 170))
    o.append(q.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2], yt=[0, 50, 83.3, 100, 150], xfmt=_f15_n, yfmt=_f15_n))
    o.append(W(q.x, q.Y(83.33), q.x + q.w, q.Y(83.33), c=MUT, lw=1, dash="5 3"))
    t = _f15_np.linspace(0, 0.2, 801)
    Tcl = Tm / (1 + K * Kp)
    o.append(q.line(list(zip(t, 83.333 * (1 - _f15_np.exp(-t / Tcl)))), c=MUT, lw=1.8, dash="5 3"))
    labs = [(MUT, "5 3", "連続時間")]
    for Ts, c in ((0.002, TEA), (0.010, SIG), (0.015, PUR), (0.020, ALI)):
        tt, yy, uu = _f15_simsd([K], [Tm, 1.0], lambda e: Kp * e, Ts, 0.2, M=int(round(Ts / 1e-4)), r=100.0)
        o.append(q.clip(list(zip(tt[::2], yy[::2])), c=c, lw=1.8))
        for k in range(int(0.2 / Ts) + 1):
            i = int(round(k * Ts / 1e-4))
            if i < len(yy) and yy[i] <= 170:
                o.append(D(q.X(tt[i]), q.Y(yy[i]), c, 2.4))
        labs.append((c, None, "%s ms" % _f15_n(Ts * 1000)))
    o.append(LEGL(350, 282, labs, 9.5, 10))
    o.append(TX(56, 282, "点の数字: T_s [ms]", "start", 9.5, INK))
    return _f15_svg(700, 294, o, "モータの速度の比例制御（K_P = 0.1 V/(rad/s)）を T_s ごとに測って計算するとき。(a) 閉ループの極 z = 1 − 6(1 − e^{−T_s/0.05}) は、T_s を延ばすと実軸の上を 1 から左へ動き、9.12 ms で 0、20.3 ms で −1 を通って単位円の外へ出る。(b) 極が負になると、角速度は 1 回ごとに目標の両側へ揺れ、20 ms ではほとんど揺れ続ける。連続時間では、この閉ループは時定数 8.33 ms の一次遅れで、振動しない（最終値は 83.3 rad/s。偏差が残るのは比例制御だから）。".replace("e^{−T_s/0.05}", "e<sup>−T<sub>s</sub>/0.05</sup>"))


F["e15_zloop"] = _f15_zloop_fig()


# =====================================================================
# 6 節: サンプリング周期の選び方
# =====================================================================
def _f15_dmargin(numz, denz, Ts, extra=0):
    ws = _f15_np.logspace(-2, math.log10(math.pi / Ts * 0.999999), 20000)
    z = _f15_np.exp(1j * ws * Ts)
    g = _f15_np.polyval(numz, z) / _f15_np.polyval(denz, z) * z ** (-extra)
    mag = _f15_np.abs(g); ph = _f15_np.unwrap(_f15_np.angle(g))
    idx = _f15_np.where(_f15_np.diff(_f15_np.sign(mag - 1)))[0]
    if not len(idx):
        return None
    i = idx[0]
    return 180 + math.degrees(ph[i])


def _f15_ts_pm_fig():
    o = []
    Pn, Pd = _F15_PPOS
    wgc, pm0 = 30.007, 63.73
    o.append(TX(14, 18, "モータの角度の進み補償（13 章 3 節、双一次変換）: サンプリング周期 T_s と位相余裕", "start", 11, INK, True))
    p = Plot(70, 36, 600, 230, (0, 30), (-20, 70))
    o.append(RECT(p.x, p.Y(0), p.w, p.Y(-20) - p.Y(0), 0, ASOFT, "none", 0))
    o.append(p.axes(xl="サンプリング周期 T_s [ms]", yl="位相余裕 [°]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[-20, 0, 20, 40, 60], xfmt=_f15_n, yfmt=_f15_n))
    o.append(W(p.x, p.Y(pm0), p.x + p.w, p.Y(pm0), c=MUT, lw=1.2, dash="5 3"))
    o.append(T(p.X(29.5), p.Y(pm0) - 5, "連続時間 63.7°", "end", 9.5, MUT, True, halo=True))
    for k, c in ((0.5, SIG), (1.5, ALI)):
        o.append(p.clip([(0, pm0), (30, pm0 - math.degrees(wgc * k * 0.030))], c=c, lw=2.0))
    Cn, Cd = _F15_LEAD
    for Ts_ms in (1, 2, 5, 10, 15, 20, 25, 30):
        Ts = Ts_ms / 1000.0
        nd, dd, _ = _f15_sg.cont2discrete((Pn, Pd), Ts, method="zoh")
        nd = _f15_np.atleast_1d(_f15_np.squeeze(nd)); dd = _f15_np.atleast_1d(_f15_np.squeeze(dd))
        b0, b1, a = _f15_lead_coef("tus", Ts)
        Ln = _f15_np.polymul([b0, b1], nd); Ld = _f15_np.polymul([1.0, -a], dd)
        for ex, c in ((0, SIG), (1, ALI)):
            v = _f15_dmargin(Ln, Ld, Ts, ex)
            if v is not None and -20 <= v <= 70:
                o.append(D(p.X(Ts_ms), p.Y(v), c, 4))
    o.append(W(p.X(4.6), p.y, p.X(4.6), p.y + p.h, c=GRN, lw=1.4, dash="4 3"))
    o.append(T(p.X(4.6) + 5, p.Y(-8), "立ち上がり時間の 1/10（4.6 ms）", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(29.5), p.Y(-15), "不安定", "end", 9.5, ALI, True, halo=True))
    o.append(TX(p.X(15.5), p.Y(56.5), "(A) すぐ出す: 減り ω_gc T_s/2", "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(6), p.Y(8), "(B) 次の周期に出す: 減り 3ω_gc T_s/2", "start", 9.5, ALI, True, halo=True))
    o.append(TX(p.x, 312, "線: 2 節の式（63.7° から 57.3° × ω_gc × 遅れ [s] を引く）。点: 離散時間のループで厳密に求めた値（5 節）。", "start", 9.5, INK))
    return _f15_svg(700, 324, o, "サンプリング周期 T_s と、モータの角度の進み補償（双一次変換で離散化）の位相余裕。線は 2 節の式で、計算が終わりしだい出す (A) では ω_gc T_s/2、次の周期に出す (B) では 3ω_gc T_s/2 だけ減る。点は 5 節の方法で厳密に求めた値で、線とほぼ重なる。立ち上がり時間の 1/10 の 4.6 ms では、(A) で 4.0°、(B) で 11.9° 減る。(B) では 25 ms 付近で不安定になる。")


F["e15_ts_pm"] = _f15_ts_pm_fig()


def _f15_plate_tr():
    Pn, Pd = [1.25], [500.0, 1.0]
    t, y, u = _f15_simct(Pn, Pd, [1600.0, 10.0], [160.0, 0.0], 1500.0, h=0.05, L=20.0)
    t10 = t[_f15_np.where(y >= 0.1)[0][0]]; t90 = t[_f15_np.where(y >= 0.9)[0][0]]
    return t90 - t10


def _f15_ts_loops_fig():
    o = []
    rows = [("モータの電流の PI（14 章 4 節）", 50e-6, 0.44e-3),
            ("モータの速度の PI（10 章 5 節）", 1e-3, 22e-3),
            ("モータの角度の進み遅れ補償（13 章 6 節）", 1e-3, 21e-3),
            ("モータの角度の進み補償（13 章 3 節）", 1e-3, 46e-3),
            ("温度の板の PI（11 章 3 節）", 1.0, _f15_plate_tr())]
    o.append(TX(14, 18, "例の対象のサンプリング周期 T_s（点）と、閉ループの立ち上がり時間 t_r（四角）", "start", 11, INK, True))
    p = Plot(300, 40, 380, 5 * 40, (1e-5, 1e3), (0, 5), xlog=True)
    o.append(p.axes(xl="時間 [s]", yl=None, xt=[1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1, 10, 100, 1000], yt=[], xfmt=lambda v: {1e-5: "10 µs", 1e-4: "100 µs", 1e-3: "1 ms", 1e-2: "10 ms", 1e-1: "0.1 s", 1: "1 s", 10: "10 s", 100: "100 s", 1000: "1000 s"}[v], sz=8.5))
    for i, (name, Ts, tr) in enumerate(rows):
        yy = p.y + 20 + i * 40
        o.append(T(p.x - 10, yy + 4, name, "end", 10, INK, True))
        o.append(W(p.X(Ts), yy, p.X(tr), yy, c=MUT, lw=2.2))
        o.append(RECT(p.X(tr / 10) - 1, yy - 7, 2, 14, 0, GRN, "none", 0))
        o.append(D(p.X(Ts), yy, GLD, 5))
        o.append(RECT(p.X(tr) - 5, yy - 5, 10, 10, 1, SIG, "none", 0))
        o.append(TX(p.X(tr) + 9, yy + 4, "t_r/T_s = %s" % ("%.0f" % (tr / Ts)), "start", 9, MUT, True, halo=True))
    o.append(RECT(300, 288, 2, 12, 0, GRN, "none", 0))
    o.append(TX(308, 298, "緑の線: t_r/10（立ち上がり時間に 10 回の目安）", "start", 9.5, GRN, True))
    return _f15_svg(700, 310, o, "例の対象で使う程度のサンプリング周期（点）と、閉ループの立ち上がり時間（四角）。横軸は対数。速いループほど短い T_s が要り、モータの電流のループは数十 µs、温度の板は 1 s である。どのループも、立ち上がり時間の中に 9 回から数十回サンプリングしている。値はどれも例の値。".replace("t_r", "t<sub>r</sub>"))


F["e15_ts_loops"] = _f15_ts_loops_fig()
