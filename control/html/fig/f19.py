# -*- coding: utf-8 -*-
# 19 章 最適レギュレータ の図
import numpy as _f19_np
from scipy import linalg as _f19_la
from scipy.optimize import linear_sum_assignment as _f19_lsa

# =====================================================================
# 例の値（本文と同じ）
# =====================================================================
_F19_M, _F19_m, _F19_l, _F19_g = 0.5, 0.2, 0.3, 9.81                   # 倒立振子（17 章 2 節）
_F19_A = _f19_np.array([[0.0, 1.0, 0.0, 0.0],
                        [0.0, 0.0, -_F19_m * _F19_g / _F19_M, 0.0],
                        [0.0, 0.0, 0.0, 1.0],
                        [0.0, 0.0, (_F19_M + _F19_m) * _F19_g / (_F19_M * _F19_l), 0.0]])
_F19_B = _f19_np.array([0.0, 1.0 / _F19_M, 0.0, -1.0 / (_F19_M * _F19_l)])
_F19_D2R = math.pi / 180.0
_F19_ACART = _f19_np.array([[0.0, 1.0], [-25.0, -2.0]])                 # 台車とばね・ダンパ
_F19_BCART = _f19_np.array([0.0, 1.0])


# =====================================================================
# 計算の補助
# =====================================================================
def _f19_lqr(A, B, Q, R):
    """最適レギュレータ。返り値 (F（1 次元の並び。u = −F x）, X)。"""
    B2 = _f19_np.asarray(B, float).reshape(-1, 1)
    X = _f19_la.solve_continuous_are(_f19_np.asarray(A, float), B2, _f19_np.asarray(Q, float), _f19_np.atleast_2d(float(R)))
    return (B2.T @ X / float(R)).ravel(), X


def _f19_acker(A, B, poles):
    """アッカーマンの式（18 章 3 節）。"""
    A = _f19_np.asarray(A, float); n = A.shape[0]
    Bc = _f19_np.asarray(B, float).reshape(-1, 1)
    W = _f19_np.hstack([_f19_np.linalg.matrix_power(A, i) @ Bc for i in range(n)])
    ph = _f19_np.real(_f19_np.poly(poles))
    P = sum(ph[k] * _f19_np.linalg.matrix_power(A, n - k) for k in range(n + 1))
    e = _f19_np.zeros(n); e[-1] = 1.0
    return e @ _f19_np.linalg.inv(W) @ P


def _f19_design(pmax, phmax=None, umax=5.0):
    """ブライソンの規則の重み（台車の位置 pmax [m]、振子の角度 phmax [°]（None で評価しない）、力 umax [N]）の最適レギュレータ。"""
    q3 = 0.0 if phmax is None else 1.0 / (phmax * _F19_D2R) ** 2
    Q = _f19_np.diag([1.0 / pmax ** 2, 0.0, q3, 0.0])
    R = 1.0 / umax ** 2
    F, X = _f19_lqr(_F19_A, _F19_B, Q, R)
    return F, X, Q, R


def _f19_sim(F, x0, T, h=0.001, umax=None, push=None):
    """倒立振子の線形でない式（17 章 2 節）に u = −F x を加え、4 次のルンゲ・クッタ法で解く。
    push = (開始, 長さ, 力 [N]) はおもりを水平に押す力（刻みの間は一定）。返り値 (t, p, ṗ, φ, φ̇, u) の並び（刻みごと）。"""
    M, m, l, g = _F19_M, _F19_m, _F19_l, _F19_g
    f1, f2, f3, f4 = [float(v) for v in F]

    def ctrl(p, pd, ph, phd):
        u = -(f1 * p + f2 * pd + f3 * ph + f4 * phd)
        if umax is not None:
            u = max(-umax, min(umax, u))
        return u

    def der(p, pd, ph, phd, fd):
        u = ctrl(p, pd, ph, phd)
        s, c = math.sin(ph), math.cos(ph)
        pdd = (u + fd - m * g * s * c - fd * c * c + m * l * phd * phd * s) / (M + m * s * s)
        return pd, pdd, phd, (g * s - pdd * c + fd / m * c) / l

    n = int(round(T / h))
    p, pd, ph, phd = [float(v) for v in x0]
    out = [[0.0], [p], [pd], [ph], [phd], [ctrl(p, pd, ph, phd)]]
    for k in range(n):
        tm = (k + 0.5) * h
        fd = push[2] if (push and push[0] <= tm < push[0] + push[1]) else 0.0
        a = der(p, pd, ph, phd, fd)
        b = der(p + h / 2 * a[0], pd + h / 2 * a[1], ph + h / 2 * a[2], phd + h / 2 * a[3], fd)
        c_ = der(p + h / 2 * b[0], pd + h / 2 * b[1], ph + h / 2 * b[2], phd + h / 2 * b[3], fd)
        d = der(p + h * c_[0], pd + h * c_[1], ph + h * c_[2], phd + h * c_[3], fd)
        p += h / 6 * (a[0] + 2 * b[0] + 2 * c_[0] + d[0]); pd += h / 6 * (a[1] + 2 * b[1] + 2 * c_[1] + d[1])
        ph += h / 6 * (a[2] + 2 * b[2] + 2 * c_[2] + d[2]); phd += h / 6 * (a[3] + 2 * b[3] + 2 * c_[3] + d[3])
        for lst, v in zip(out, ((k + 1) * h, p, pd, ph, phd, ctrl(p, pd, ph, phd))):
            lst.append(v)
        if abs(ph) > math.pi / 2:
            break
    return [_f19_np.array(v) for v in out]


def _f19_settle(t, y, tol):
    """|y| が tol 以下に入り、その後出ない時刻（最後に出た所を線形補間）。"""
    idx = _f19_np.where(_f19_np.abs(y) > tol)[0]
    if len(idx) == 0:
        return 0.0
    i = idx[-1]
    if i + 1 >= len(t):
        return float("inf")
    a, b = abs(y[i]), abs(y[i + 1])
    return float(t[i] + (t[i + 1] - t[i]) * (a - tol) / (a - b))


def _f19_lyapJ(Acl, Qt, x0):
    """∫ xᵀ Qt x dt（ẋ = Acl x、x(0) = x0）。Aclᵀ P + P Acl + Qt = 0 の P で x0ᵀ P x0。"""
    P = _f19_la.solve_continuous_lyapunov(_f19_np.asarray(Acl, float).T, -_f19_np.asarray(Qt, float))
    x0 = _f19_np.asarray(x0, float)
    return float(x0 @ P @ x0)


def _f19_L(F, w):
    """入力の点で切った一巡伝達関数 F (jωI − A)⁻¹ B（倒立振子）。"""
    return complex(_f19_np.asarray(F, float) @ _f19_np.linalg.solve(1j * w * _f19_np.eye(4) - _F19_A, _F19_B))


def _f19_f(v, d=2):
    """小数 d 桁、負号は −。"""
    s = "%.*f" % (d, v)
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f19_g(v, d=3):
    """有効数字 d 桁、負号は −。"""
    if v == 0:
        return "0"
    e = int(math.floor(math.log10(abs(v))))
    s = "%.*f" % (max(0, d - 1 - e), v)
    return s.replace("-", "−")


def _f19_mat(x, y, rows, sz=11, c=INK, gap=12, pad=6):
    """角括弧つきの行列。rows は行のリストで、要素は TX の文字列か (文字列, 色)。(x, y) は左上。返り値 (svg, 幅, 高さ)。"""
    lh = sz * 1.55
    ncol = max(len(r) for r in rows)

    def cell(e):
        return e if isinstance(e, tuple) else (e, c)

    cw = [max(TXW(cell(r[j])[0], sz) for r in rows if j < len(r)) for j in range(ncol)]
    w = pad * 2 + sum(cw) + gap * (ncol - 1)
    h = lh * len(rows) + 4
    o = [W(x + 4, y, x, y, x, y + h, x + 4, y + h, c=c, lw=1.2),
         W(x + w - 4, y, x + w, y, x + w, y + h, x + w - 4, y + h, c=c, lw=1.2)]
    xx = x + pad
    for j in range(ncol):
        for i, r in enumerate(rows):
            if j < len(r):
                s, cc = cell(r[j])
                o.append(TX(xx + cw[j] / 2, y + 2 + lh * i + lh * 0.7, s, "middle", sz, cc))
        xx += cw[j] + gap
    return "".join(o), w, h


def _f19_contour(xs, ys, Z, lev):
    """等高線（マーチング・スクエア）。xs・ys は格子の値の並び、Z[j, i] は (xs[i], ys[j]) の値。返り値は線分の並び。"""
    segs = []
    ny, nx = Z.shape
    for j in range(ny - 1):
        for i in range(nx - 1):
            c4 = [(xs[i], ys[j], Z[j, i]), (xs[i + 1], ys[j], Z[j, i + 1]), (xs[i + 1], ys[j + 1], Z[j + 1, i + 1]), (xs[i], ys[j + 1], Z[j + 1, i])]
            if any(not _f19_np.isfinite(q[2]) for q in c4):
                continue
            pts = []
            for k in range(4):
                (xa, ya, za), (xb, yb, zb) = c4[k], c4[(k + 1) % 4]
                if (za - lev) * (zb - lev) < 0:
                    tq = (lev - za) / (zb - za)
                    pts.append((xa + tq * (xb - xa), ya + tq * (yb - ya)))
            if len(pts) == 2:
                segs.append(pts)
            elif len(pts) == 4:
                segs.append(pts[:2]); segs.append(pts[2:])
    return segs


def _f19_segpath(P, segs, c, lw=1.1, dash=None):
    """線分の並びを Plot P の座標で 1 本の path にする。"""
    d = " ".join("M%.1f,%.1f L%.1f,%.1f" % (P.X(a[0]), P.Y(a[1]), P.X(b[0]), P.Y(b[1])) for a, b in segs)
    return PATH(d, c=c, lw=lw, dash=dash) if d else ""


def _f19_track(roots_list):
    """根の並びの列を、1 つ前に近い根どうしでつなぐ（枝ごとの配列 R[枝, 番号]）。"""
    rows, prev = [], None
    for r in roots_list:
        r = _f19_np.asarray(r, complex)
        if prev is not None:
            i, j = _f19_lsa(_f19_np.abs(prev[:, None] - r[None, :]))
            r = r[j[_f19_np.argsort(i)]]
        rows.append(r); prev = r
    return _f19_np.array(rows).T


def _f19_xmark(P, z, c, r=5.5, lw=2.2):
    x, y = P.X(z.real), P.Y(z.imag)
    return W(x - r, y - r, x + r, y + r, c=c, lw=lw) + W(x - r, y + r, x + r, y - r, c=c, lw=lw)


# ---- この章の例の設計（本文と同じ値） ----
_F19_FA, _F19_XA, _F19_QA, _F19_RA = _f19_design(0.5, None, 5.0)        # 例: Q = diag(4, 0, 0, 0)、R = 0.04
_F19_FB, _F19_XB, _F19_QB, _F19_RB = _f19_design(0.5, 10.0, 5.0)        # 最初の案: 角度 10° も評価する
_F19_WPS = 5.6978                                                        # 台車が ±1 cm に収まる時間が例と同じになる極配置の速さ
_F19_FPP4 = _f19_acker(_F19_A, _F19_B, [-4.0] * 4)                       # 18 章 4 節
_F19_FPPW = _f19_acker(_F19_A, _F19_B, [-_F19_WPS] * 4)
_F19_FBAD = _f19_acker(_F19_A, _F19_B, [-3 + 3j, -3 - 3j, -3 + 3j, -3 - 3j])
_F19_X10 = [0.0, 0.0, 10 * _F19_D2R, 0.0]                                # 10° 傾けて静かに放す
_F19_PUSH = (0.0, 0.1, 1.0)                                              # おもりを右へ 1 N で 0.1 s 押す


# =====================================================================
# 1 節: 2 乗の面積
# =====================================================================
def _f19_area_fig():
    o = []
    cases = [(0.0, MUT, "4 3"), (1.0, TEA, None), (8.0, SIG, None)]
    ts = _f19_np.linspace(0, 1.5, 301)
    # (a) 速度と、その 2 乗
    o.append(T(14, 18, "(a) 速度 v と、その 2 乗", "start", 11.5, INK, True))
    p1 = Plot(62, 34, 270, 96, (0, 1.5), (0, 1.0))
    o.append(p1.axes(xl=None, yl="v [m/s]", xt=[0, 0.5, 1, 1.5], yt=[0, 0.5, 1.0], xfmt=lambda v: ""))
    p2 = Plot(62, 150, 270, 96, (0, 1.5), (0, 1.0))
    o.append(p2.axes(xl="時間 t [s]", yl="v^2 [m^2/s^2]", xt=[0, 0.5, 1, 1.5], yt=[0, 0.5, 1.0], xfmt=lambda v: "%g" % v))
    for F, c, dash in cases:
        v = _f19_np.exp(-(2 + F) * ts)
        o.append(p1.line(list(zip(ts, v)), c=c, lw=2.0, dash=dash))
        pts = [(p2.X(0), p2.Y(0))] + [(p2.X(a), p2.Y(b * b)) for a, b in zip(ts, v)] + [(p2.X(1.5), p2.Y(0))]
        o.append(PL(pts, c=c, lw=1.6, fill=soft(c), op=0.55, dash=dash))
    o.append(T(p1.X(0.62), p1.Y(0.47), "F = 0（押さない）", "start", 9.5, MUT, True, halo=True))
    o.append(T(p1.X(0.6), p1.Y(0.06), "F = 1", "start", 9.5, TEA, True, halo=True))
    o.append(T(p1.X(0.24), p1.Y(0.2), "F = 8", "start", 9.5, SIG, True, halo=True))
    o.append(T(p2.X(1.48), p2.Y(0.9), "面積 ∫v² dt [m²/s]", "end", 9.5, INK, True, halo=True))
    o.append(T(p2.X(1.48), p2.Y(0.9) + 15, "F = 0: 0.25", "end", 9.5, MUT, True, halo=True))
    o.append(T(p2.X(1.48), p2.Y(0.9) + 29, "F = 1: 0.167", "end", 9.5, TEA, True, halo=True))
    o.append(T(p2.X(1.48), p2.Y(0.9) + 43, "F = 8: 0.05", "end", 9.5, SIG, True, halo=True))
    # (b) 力と、その 2 乗
    o.append(T(372, 18, "(b) 力 u と、その 2 乗", "start", 11.5, INK, True))
    q1 = Plot(420, 34, 270, 96, (0, 1.5), (-8.5, 0.5))
    o.append(q1.axes(xl=None, yl="u [N]", xt=[0, 0.5, 1, 1.5], yt=[-8, -4, 0], xfmt=lambda v: ""))
    q2 = Plot(420, 150, 270, 96, (0, 1.5), (0, 8))
    o.append(q2.axes(xl="時間 t [s]", yl="u^2 [N^2]", xt=[0, 0.5, 1, 1.5], yt=[0, 4, 8], xfmt=lambda v: "%g" % v))
    for F, c, dash in cases:
        u = -F * _f19_np.exp(-(2 + F) * ts)
        o.append(q1.line(list(zip(ts, u)), c=c, lw=2.0, dash=dash))
        if F > 0:
            uu = _f19_np.minimum(u * u, 8.0)
            pts = [(q2.X(0), q2.Y(0))] + [(q2.X(a), q2.Y(b)) for a, b in zip(ts, uu)] + [(q2.X(1.5), q2.Y(0))]
            o.append(PL(pts, c="none", lw=0, fill=soft(c), op=0.55))
            o.append(q2.clip(list(zip(ts, u * u)), c=c, lw=1.6))
    o.append(T(q2.X(0.13), q2.Y(7.0), "F = 8 は t = 0 で 64（上は枠の外）", "start", 9, SIG, halo=True))
    o.append(T(q1.X(0.5), q1.Y(-1.6), "F = 1", "start", 9.5, TEA, True, halo=True))
    o.append(T(q1.X(0.2) + 6, q1.Y(-6.5), "F = 8", "start", 9.5, SIG, True, halo=True))
    o.append(T(q1.X(1.48), q1.Y(0) - 5, "F = 0 は押さない", "end", 9, MUT, halo=True))
    o.append(T(q2.X(1.48), q2.Y(5.6), "面積 ∫u² dt [N²·s]", "end", 9.5, INK, True, halo=True))
    o.append(T(q2.X(1.48), q2.Y(5.6) + 15, "F = 0: 0", "end", 9.5, MUT, True, halo=True))
    o.append(T(q2.X(1.48), q2.Y(5.6) + 29, "F = 1: 0.167", "end", 9.5, TEA, True, halo=True))
    o.append(T(q2.X(1.48), q2.Y(5.6) + 43, "F = 8: 3.2", "end", 9.5, SIG, True, halo=True))
    return SVG(700, 290, o,
               "ばねの無い台車（1 kg、2 N·s/m）を 1 m/s から u = −Fv で止めるときの速度と力（F の単位は N/(m/s)）。下の段は 2 乗で、塗った面積が速度と力の大きさを表す。F を大きくすると速度の面積は減り、力の面積は増える。")


F["e19_area"] = _f19_area_fig()


# =====================================================================
# 1 節: xᵀQx の計算と、等しい値の線
# =====================================================================
def _f19_quad_fig():
    o = []
    o.append(T(14, 18, "(a) 状態変数が 2 つのときの xᵀQx の計算", "start", 11.5, INK, True))
    y0 = 40
    s1, w1, h1 = _f19_mat(20, y0, [["p", "\\dot{p}"]], 11)
    o.append(s1)
    s2, w2, h2 = _f19_mat(20 + w1 + 8, y0 - 12, [["q_{11}", "q_{12}"], ["q_{12}", "q_{22}"]], 11, SIG)
    o.append(s2)
    s3, w3, h3 = _f19_mat(20 + w1 + w2 + 16, y0 - 12, [["p"], ["\\dot{p}"]], 11)
    o.append(s3)
    xe = 20 + w1 + w2 + w3 + 26
    o.append(T(xe, y0 + 14, "=", "start", 12, INK))
    s4, w4, h4 = _f19_mat(xe + 16, y0, [["p", "\\dot{p}"]], 11)
    o.append(s4)
    s5, w5, h5 = _f19_mat(xe + 24 + w4, y0 - 12, [["q_{11}p + q_{12}\\dot{p}"], ["q_{12}p + q_{22}\\dot{p}"]], 11)
    o.append(s5)
    o.append(TX(20, y0 + 62, "= q_{11}p^2 + 2q_{12}p\\dot{p} + q_{22}\\dot{p}^2", "start", 12, INK))
    o.append(T(20, y0 + 86, "対角の Q（q₁₂ = 0）なら、状態変数ごとの 2 乗の重み付きの和", "start", 10, MUT))
    o.append(TX(20, y0 + 104, "例: Q = diag(100, 1) なら 100p^2 + \\dot{p}^2", "start", 10.5, SIG, True))
    o.append(T(20, y0 + 128, "Q は対称（q₁₂ = q₂₁）で、どんな x でも xᵀQx ≥ 0 に選ぶ", "start", 10, MUT))
    o.append(T(20, y0 + 146, "R は正（入力が 1 つなら正の数）", "start", 10, MUT))
    # (b) 等しい値の線
    o.append(T(392, 18, "(b) xᵀQx = 1 の線（台車とばね・ダンパ）", "start", 11.5, INK, True))
    P = Plot(440, 34, 240, 180, (-0.15, 0.15), (-1.5, 1.5))
    o.append(RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8))
    o.append(P.axes(xl="位置 p [m]", yl="速度 \\dot{p} [m/s]", xt=[-0.1, 0, 0.1], yt=[-1, 0, 1], xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(P.X(0), P.y, P.X(0), P.y + P.h, c=MUT, lw=1)); o.append(W(P.x, P.Y(0), P.x + P.w, P.Y(0), c=MUT, lw=1))
    th = _f19_np.linspace(0, 2 * math.pi, 181)
    for Qm, c, dash in (([[100, 0], [0, 1]], SIG, None), ([[400, 0], [0, 1]], TEA, "5 3"), ([[100, 6], [6, 1]], PUR, "2 3")):
        Qm = _f19_np.array(Qm, float)
        ev, V = _f19_np.linalg.eigh(Qm)
        pts = [V @ _f19_np.array([math.cos(a) / math.sqrt(ev[0]), math.sin(a) / math.sqrt(ev[1])]) for a in th]
        o.append(P.clip([(q[0], q[1]) for q in pts], c=c, lw=2.0, dash=dash))
    o.append(TX(P.X(0.012), P.Y(1.22), "diag(100, 1)", "start", 9.5, SIG, True, halo=True))
    o.append(TX(P.X(0.052), P.Y(-0.62), "diag(400, 1)", "start", 9.5, TEA, True, halo=True))
    o.append(TX(P.X(-0.145), P.Y(-1.28), "対角の外 6: 傾く", "start", 9.5, PUR, True, halo=True))
    o.append(T(P.X(0.1), P.Y(0) + 13, "0.1", "middle", 9, SIG, halo=True))
    return SVG(700, 254, o,
               "状態の重み行列 Q。(a) 状態変数が 2 つのとき、xᵀQx は 2 乗と積に重みを掛けて足した 1 つの数になる。(b) 台車とばね・ダンパの状態 (p, ṗ) で、xᵀQx が 1 になる点を結んだ楕円。位置の重みを 4 倍にすると、半分のずれ（0.05 m）で同じ大きさに数える。対角の外の要素は楕円を傾ける。")


F["e19_quad"] = _f19_quad_fig()


# =====================================================================
# 1 節: 速度の面積と力の面積の釣り合い
# =====================================================================
def _f19_tradeoff_fig():
    o = []
    P = Plot(70, 24, 420, 250, (0, 0.27), (0, 5.0))
    o.append(P.axes(xl="速度の面積 ∫v^2 dt [m^2/s]", yl="力の面積 ∫u^2 dt [N^2·s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yt=[0, 1, 2, 3, 4, 5]))
    Fs = _f19_np.concatenate([_f19_np.linspace(0, 2, 41), _f19_np.linspace(2, 14, 121)])
    cur = [(1 / (2 * (F + 2)), F * F / (2 * (F + 2))) for F in Fs]
    o.append(P.clip(cur, c=INK, lw=2.2))
    for F in (0, 1, 2, 4, 8, 12):
        x, y = 1 / (2 * (F + 2)), F * F / (2 * (F + 2))
        o.append(D(P.X(x), P.Y(y), INK, 3.2))
        lab = "F = %g" % F
        if F == 0:
            o.append(T(P.X(x) - 4, P.Y(y) - 7, lab, "end", 9.5, INK, halo=True))
        elif F in (2, 4, 12):
            o.append(T(P.X(x) + 7, P.Y(y) + 4, lab, "start", 9.5, INK, halo=True))
    # 傾き −Q/R の直線（J が等しい線）
    for QR, Fo, c in ((5.0, 1.0, TEA), (96.0, 8.0, SIG)):
        Jo = (QR + Fo * Fo) / (2 * (Fo + 2))
        for Jv, lw, dash in ((Jo, 1.8, None), (Jo * 1.6, 1.1, "5 4"), (Jo * 0.7, 1.1, "2 3")):
            o.append(P.clip([(0, Jv), (Jv / QR, 0)], c=c, lw=lw, dash=dash))
        xo, yo = 1 / (2 * (Fo + 2)), Fo * Fo / (2 * (Fo + 2))
        o.append(CIRC(P.X(xo), P.Y(yo), 6.5, c=c, lw=2.2, fill=SCR))
        o.append(D(P.X(xo), P.Y(yo), INK, 3.2))
    o.append(TX(P.X(0.172), P.Y(0.86), "Q/R = 5: F = 1 で触れる", "start", 10, TEA, True, halo=True))
    o.append(TX(P.X(0.058), P.Y(3.55), "Q/R = 96: F = 8 で触れる", "start", 10, SIG, True, halo=True))
    o.append(T(P.X(0.26), P.Y(4.78), "F を大きくすると左上へ", "end", 9.5, INK, halo=True))
    # 右の説明
    xr = 510
    o.append(T(xr, 40, "J = Q∫v²dt + R∫u²dt が", "start", 10.5, INK, True))
    o.append(T(xr, 56, "同じ値の点は、傾き −Q/R の", "start", 10.5, INK, True))
    o.append(T(xr, 72, "直線の上に並ぶ", "start", 10.5, INK, True))
    lines = ["直線を左下から近づけて、", "曲線に初めて触れる点が", "J の最も小さい F である", "",
             "Q と R を同じ倍率で変えても", "傾きは変わらない", "（F を決めるのは比 Q/R）", "",
             "実線: 触れる直線", "破線: J が 1.6 倍の直線", "点線: J が 0.7 倍の直線"]
    for i, l in enumerate(lines):
        if l:
            o.append(T(xr, 98 + i * 16, l, "start", 10, MUT))
    return SVG(700, 316, o,
               "台車で F を 0 から 14 N/(m/s) まで変えたときの、速度の面積と力の面積の組（太い曲線。点は F の値）。J が等しい組は傾き −Q/R の直線の上にあり、J が最も小さい点は、その直線が曲線に接する点である。Q/R = 5 (N/(m/s))² では F = 1、96 では F = 8 が選ばれる。")


F["e19_tradeoff"] = _f19_tradeoff_fig()


# =====================================================================
# 2 節: J の谷
# =====================================================================
def _f19_valley_fig():
    o = []
    o.append(T(14, 18, "(a) u = −Fv の形で F を変えたときの J（R = 1、v(0) = 1 m/s）", "start", 11.5, INK, True))
    P = Plot(62, 36, 300, 220, (0, 24), (0, 20))
    o.append(P.axes(xl="ゲイン F [N/(m/s)]", yl="評価関数 J", xt=[0, 4, 8, 12, 16, 20, 24], yt=[0, 4, 8, 12, 16, 20]))
    Fs = _f19_np.linspace(0, 24, 241)
    for QR, c, Fo in ((5.0, TEA, 1.0), (96.0, SIG, 8.0)):
        o.append(P.clip([(F, (QR + F * F) / (2 * (F + 2))) for F in Fs], c=c, lw=2.2))
        Jo = (QR + Fo * Fo) / (2 * (Fo + 2))
        o.append(D(P.X(Fo), P.Y(Jo), c, 4.5))
        o.append(W(P.X(Fo), P.Y(Jo), P.X(Fo), P.Y(0), c=c, lw=1, dash="3 3"))
    o.append(TX(P.X(23.5), P.Y(18.6), "Q/R = 96: 底は F = 8、J = 8", "end", 9.5, SIG, True, halo=True))
    o.append(TX(P.X(23.5), P.Y(18.6) + 15, "Q/R = 5: 底は F = 1、J = 1", "end", 9.5, TEA, True, halo=True))
    o.append(D(P.X(4), P.Y((96 + 16) / 12.0), SIG, 3.2)); o.append(D(P.X(16), P.Y((96 + 256) / 36.0), SIG, 3.2))
    o.append(T(P.X(4) + 4, P.Y(9.33) - 7, "F = 4: 9.33", "start", 9, SIG, halo=True))
    o.append(T(P.X(16), P.Y(9.78) - 8, "F = 16: 9.78", "middle", 9, SIG, halo=True))
    # (b) 最適な入力との差の 2 乗
    o.append(T(392, 18, "(b) Q/R = 96 で、最適な入力 −8v との差", "start", 11.5, INK, True))
    Q2 = Plot(440, 36, 240, 150, (0, 0.5), (0, 70))
    o.append(Q2.axes(xl="時間 t [s]", yl="R(u + 8v)^2", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yt=[0, 20, 40, 60]))
    ts = _f19_np.linspace(0, 0.5, 201)
    for F, c, lab, area in ((16.0, PUR, "F = 16", 64 / 36.0), (4.0, GLD, "F = 4", 16 / 12.0)):
        v = _f19_np.exp(-(2 + F) * ts)
        y = ((8 - F) * v) ** 2
        pts = [(Q2.X(0), Q2.Y(0))] + [(Q2.X(a), Q2.Y(b)) for a, b in zip(ts, y)] + [(Q2.X(0.5), Q2.Y(0))]
        o.append(PL(pts, c=c, lw=1.8, fill=soft(c), op=0.5))
    o.append(T(Q2.X(0.035), Q2.Y(60), "F = 16: 面積 1.78", "start", 9.5, PUR, True, halo=True))
    o.append(T(Q2.X(0.12), Q2.Y(14), "F = 4: 面積 1.33", "start", 9.5, GLD, True, halo=True))
    o.append(T(392, 252, "J = J_min + ∫R(u + 8v)² dt の 2 つ目の項", "start", 10, INK))
    o.append(T(392, 270, "9.33 = 8 + 1.33、9.78 = 8 + 1.78", "start", 10, INK))
    return SVG(700, 300, o,
               "ばねの無い台車で J を最も小さくする。(a) 入力を u = −Fv の形に限り、F を変えたときの J は谷の形をしていて、底は最適なゲインの式の F（Q/R = 5 で 1、96 で 8 N/(m/s)）にあり、底の高さは J の最小値 RFv(0)²/b に一致する。(b) 最適でない F の入力と、最適な入力 −8v の差の 2 乗。その面積が、J の最小値からの増え分になる。")


F["e19_valley"] = _f19_valley_fig()


# =====================================================================
# 2 節: 不安定な対象と、鏡に映した極
# =====================================================================
def _f19_mirror_fig():
    o = []
    o.append(T(14, 18, "(a) 重みの比 Q/R を変えたときの閉ループの極（s 平面の実軸）", "start", 11.5, INK, True))
    xs0, xs1 = 70, 680
    for row, (a, lab, cc) in enumerate(((-2.0, "減衰係数 2 N·s/m の台車（a = −2）", SIG), (2.0, "減衰係数 −2 N·s/m の仮の台車（a = +2）", PUR))):
        yc = 78 + row * 104
        P = Plot(xs0, yc - 10, xs1 - xs0, 20, (-12, 3), (-1, 1))
        o.append(RECT(P.X(0), yc - 12, P.X(3) - P.X(0), 24, 0, soft(ALI), "none", 0))
        o.append(W(xs0, yc, xs1, yc, c=MUT, lw=1.2))
        for v in range(-12, 4, 2):
            o.append(W(P.X(v), yc - 3, P.X(v), yc + 3, c=MUT, lw=1))
            o.append(T(P.X(v), yc + 15, ("%d" % v).replace("-", "−"), "middle", 9, MUT))
        o.append(W(P.X(0), yc - 12, P.X(0), yc + 12, c=MUT, lw=1.4))
        o.append(T(xs0, yc - 36, lab, "start", 10, cc, True))
        o.append(_f19_xmark(P, complex(a, 0), MUT, 6, 2.4))
        for QR in (5.0, 21.0, 96.0):
            s_ = -math.sqrt(4 + QR)
            o.append(_f19_xmark(P, complex(s_, 0), cc, 5.5, 2.4))
            o.append(T(P.X(s_), yc - 17, "Q/R = %g" % QR, "middle", 9, cc, halo=True))
        o.append(ARR(P.X(-3.2), yc + 26, P.X(-11.6), yc + 26, c=cc, lw=1.4, head=6))
        o.append(T(P.X(-7.4), yc + 40, "Q/R を大きくすると左へ（−√(4 + Q/R)）", "middle", 9, cc, halo=True))
        if a > 0:
            o.append(T(P.X(2), yc + 30, "対象の極 +2", "middle", 9, MUT, halo=True))
            o.append(CARR(P.X(2), yc - 7, P.X(-2), yc - 7, -0.28, c=ALI, lw=1.3, head=6, dash="4 3"))
            o.append(D(P.X(-2), yc, PUR, 3.2))
            o.append(T(P.X(0), yc - 42, "Q/R → 0 でも、鏡に映した −2 にとどまる", "middle", 9, ALI, True, halo=True))
        else:
            o.append(T(P.X(-1.4), yc + 30, "対象の極 −2（Q/R → 0 で押さない）", "start", 9, MUT, halo=True))
    o.append(T(P.X(2.95), 54, "右半平面", "end", 9, ALI, halo=True))
    # (b) ゲイン
    o.append(T(14, 262, "(b) 最適なゲイン F", "start", 11.5, INK, True))
    G = Plot(62, 278, 250, 150, (0.1, 1000), (0, 40), xlog=True)
    o.append(G.axes(xl="重みの比 Q/R [(N/(m/s))^2]", yl="F [N/(m/s)]", xt=[0.1, 1, 10, 100, 1000], yt=[0, 10, 20, 30, 40], xfmt=lambda v: "%g" % v))
    qs = _f19_np.logspace(-1, 3, 200)
    o.append(G.line([(q, -2 + math.sqrt(4 + q)) for q in qs], c=SIG, lw=2.2))
    o.append(G.line([(q, 2 + math.sqrt(4 + q)) for q in qs], c=PUR, lw=2.2))
    o.append(T(G.X(300) - 6, G.Y(2 + math.sqrt(304)) - 4, "a = +2", "end", 9.5, PUR, True, halo=True))
    o.append(T(G.X(300) + 6, G.Y(-2 + math.sqrt(304)) + 12, "a = −2", "start", 9.5, SIG, True, halo=True))
    o.append(T(G.X(0.12), G.Y(13), "Q/R → 0 で、a = +2 は 4 に、", "start", 9.5, INK, halo=True))
    o.append(T(G.X(0.12), G.Y(13) + 14, "a = −2 は 0 に近づく（差は 2a/b = 4）", "start", 9.5, INK, halo=True))
    # (c) 安定にする力の面積と、置いた極
    o.append(T(372, 262, "(c) 極を −σ に置くのに要る力の面積", "start", 11.5, INK, True))
    C = Plot(430, 278, 250, 150, (0, 10), (0, 10))
    o.append(C.axes(xl="閉ループの極の位置 σ [1/s]（極は −σ）", yl="∫u^2 dt [N^2·s]", xt=[0, 2, 4, 6, 8, 10], yt=[0, 2, 4, 6, 8, 10]))
    sg = _f19_np.linspace(0.2, 10, 197)
    o.append(C.clip([(s, (2 + s) ** 2 / (2 * s)) for s in sg], c=PUR, lw=2.2))
    sg2 = _f19_np.linspace(2, 10, 161)
    o.append(C.clip([(s, (s - 2) ** 2 / (2 * s)) for s in sg2], c=SIG, lw=2.2))
    o.append(D(C.X(2), C.Y(4), PUR, 4.2))
    o.append(T(C.X(2) + 6, C.Y(4) + 14, "a = +2: σ = 2 で最小（4）", "start", 9.5, PUR, True, halo=True))
    o.append(T(C.X(0.4), C.Y(9.2), "遅く戻すほど増える", "start", 9, PUR, halo=True))
    o.append(T(C.X(9.8), C.Y(0.9), "a = −2: σ = 2 で 0", "end", 9.5, SIG, True, halo=True))
    return SVG(700, 476, o,
               "状態変数が 1 つの対象の最適レギュレータ（b = 1、v(0) = 1 m/s）。(a) 閉ループの極は −√(a² + Q/R) で、a の符号によらない。押さなくても速さが増えていく a = +2 の仮の台車では、Q/R を 0 に近づけても、極は対象の極 +2 を虚軸について鏡に映した −2 にとどまる。(b) 最適なゲインは、a = +2 の方が 4 N/(m/s) 大きい。(c) 極を −σ に置く u = −Fv の力の面積。a = +2 では鏡の位置 σ = 2 で最も小さく、それより遅く戻しても力は減らない。")


F["e19_mirror"] = _f19_mirror_fig()


# =====================================================================
# 3 節: リッカチ方程式を手で解く（台車とばね・ダンパ）
# =====================================================================
def _f19_ric2_fig():
    o = []
    o.append(TX(14, 18, "(a) (3) の各項（A = [0 1; −25 −2]、B = [0; 1]、X は対称）", "start", 11.5, INK, True))
    y = 34
    o.append(TX(20, y + 26, "A^{T}X + XA =", "start", 11, INK))
    s, w, h = _f19_mat(118, y, [["−50X_{12}", "X_{11} − 2X_{12} − 25X_{22}"], ["X_{11} − 2X_{12} − 25X_{22}", "2X_{12} − 4X_{22}"]], 11)
    o.append(s)
    y2 = y + h + 14
    o.append(TX(20, y2 + 26, "XBR^{−1}B^{T}X =", "start", 11, INK))
    o.append(FRAC(146, y2 + 22, "1", "R", 11)[0])
    s, w2, h2 = _f19_mat(160, y2, [["X_{12}^2", "X_{12}X_{22}"], ["X_{12}X_{22}", "X_{22}^2"]], 11)
    o.append(s)
    o.append(TX(160 + w2 + 34, y2 + 26, "Q =", "start", 11, INK))
    s, w3, h3 = _f19_mat(160 + w2 + 64, y2, [["q_1", "0"], ["0", "q_2"]], 11)
    o.append(s)
    o.append(TX(160 + w2 + 64 + w3 + 24, y2 + 26, "B^{T}X = [X_{12}  X_{22}]", "start", 11, INK))
    # (b) 要素ごとに解く
    yb = y2 + h2 + 34
    o.append(TX(14, yb, "(b) 要素ごとに 0 とおき、順に解く（数値は q_1/R = 2400、q_2 = 0、R = 1）", "start", 11.5, INK, True))
    rows = [("①", "(1, 1)", "−50X_{12} − X_{12}^2/R + q_1 = 0", "X_{12} = R(−25 ± √(625 + q_1/R))", "30（−80 は ✗）"),
            ("②", "(2, 2)", "2X_{12} − 4X_{22} − X_{22}^2/R + q_2 = 0", "X_{22} = R(−2 ± √(4 + (2X_{12} + q_2)/R))", "6（−10 は ✗）"),
            ("③", "(1, 2)", "X_{11} − 2X_{12} − 25X_{22} − X_{12}X_{22}/R = 0", "X_{11} = 2X_{12} + 25X_{22} + X_{12}X_{22}/R", "390")]
    for i, (n, el, eq, sol, val) in enumerate(rows):
        yy = yb + 28 + i * 30
        o.append(T(20, yy, n, "start", 11, SIG, True))
        o.append(T(40, yy, el, "start", 10, MUT))
        o.append(TX(88, yy, eq, "start", 10.5, INK))
        o.append(T(330, yy, "→", "start", 11, MUT))
        o.append(TX(350, yy, sol, "start", 10.5, INK))
        o.append(TX(686, yy, val, "end", 10.5, SIG, True))
    yn = yb + 28 + 3 * 30 - 6
    o.append(TX(40, yn, "✗: X_{12} = −80 なら f_1 = −80 で 25 + f_1 < 0（ばねが負）、X_{22} = −10 なら f_2 = −10 で 2 + f_2 < 0（ダンパが負）。どちらも不安定", "start", 9.5, ALI))
    # (c) 結果
    yc = yn + 26
    o.append(TX(14, yc, "(c) 結果", "start", 11.5, INK, True))
    o.append(TX(20, yc + 30, "X =", "start", 11, INK))
    s, w4, h4 = _f19_mat(48, yc + 8, [["390", "30"], ["30", "6"]], 11, SIG)
    o.append(s)
    o.append(TX(48 + w4 + 20, yc + 30, "F = R^{−1}B^{T}X = [30  6]", "start", 11, SIG, True))
    o.append(TX(330, yc + 22, "閉ループ: λ^2 + (2 + f_2)λ + (25 + f_1) = λ^2 + 8λ + 55", "start", 10.5, INK))
    o.append(TX(330, yc + 42, "極 −4 ± j6.24（固有角周波数 7.42 rad/s、減衰比 0.539）", "start", 10.5, INK))
    o.append(TX(330, yc + 62, "10 cm から: J_{min} = x(0)^{T}Xx(0) = 390 × 0.1^2 = 3.9", "start", 10.5, INK))
    return SVG(700, yc + 80, o,
               "台車とばね・ダンパ（1 kg、2 N·s/m、25 N/m）のリッカチ方程式を手で解く。(a) 対称な X の 3 つの要素で (3) の各項を書く。(b) (1, 1) 要素の式は X₁₂ だけを含み、(2, 2) 要素の式は X₁₂ と X₂₂ を含むので、①・②・③ の順に解ける。2 次方程式の 2 つの解のうち、閉ループが安定になる方を選ぶ。(c) X と F、閉ループの極、J の最小値。")


F["e19_ric2"] = _f19_ric2_fig()


# =====================================================================
# 3 節: J のお椀（台車とばね・ダンパ、Q = diag(2400, 0)、R = 1）
# =====================================================================
def _f19_bowl_fig():
    o = []
    A, B = _F19_ACART, _F19_BCART
    Q = _f19_np.diag([2400.0, 0.0]); R = 1.0
    f1s = _f19_np.linspace(-22, 80, 69); f2s = _f19_np.linspace(-1.5, 20, 49)

    def Jat(f1, f2, x0):
        Fv = _f19_np.array([f1, f2]); Acl = A - _f19_np.outer(B, Fv)
        if 25 + f1 <= 0 or 2 + f2 <= 0:
            return _f19_np.nan
        return _f19_lyapJ(Acl, Q + R * _f19_np.outer(Fv, Fv), x0)

    for k, (x0, title, Jmin) in enumerate((([0.1, 0.0], "(a) 10 cm ずらして放す", 3.9), ([0.0, 0.5], "(b) 0.5 m/s の速度を与えて放す", 1.5))):
        x00 = 62 + k * 340
        o.append(T(x00 - 48, 18, title, "start", 11.5, INK, True))
        P = Plot(x00, 34, 280, 220, (-22, 80), (-1.5, 20))
        o.append(RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8))
        Z = _f19_np.array([[Jat(a, b, x0) for a in f1s] for b in f2s])
        for mult, c, lw in ((1.05, SIG, 1.6), (1.2, SIG, 1.3), (1.5, SIG, 1.1), (2.0, FNT, 1.1), (3.0, FNT, 1.0), (5.0, FNT, 1.0)):
            o.append(_f19_segpath(P, _f19_contour(f1s, f2s, Z, Jmin * mult), c, lw))
        o.append(P.axes(xl="位置のゲイン f_1 [N/m]", yl="速度のゲイン f_2 [N/(m/s)]", xt=[-20, 0, 20, 40, 60, 80], yt=[0, 5, 10, 15, 20], grid=False,
                        xfmt=lambda v: ("%g" % v).replace("-", "−")))
        pts = [((30, 6), SIG, "[30 6]: J = %s（底）" % _f19_g(Jmin, 2), "start", 7, 14),
               ((25, 8), TEA, None, None, 0, 0), ((0, 0), MUT, None, None, 0, 0), ((0, 8), PUR, None, None, 0, 0)]
        for (a, b), c, lab, anc, dx, dy in pts:
            o.append(D(P.X(a), P.Y(b), c, 4.2 if c == SIG else 3.6))
        jv = {key: Jat(key[0], key[1], x0) for key in ((25, 8), (0, 0), (0, 8))}
        o.append(T(P.X(30) + 7, P.Y(6) + 15, "[30 6]: 底 %s" % _f19_g(Jmin, 2), "start", 9.5, SIG, True, halo=True))
        o.append(T(P.X(25) - 2, P.Y(8) - 8, "[25 8]: %s" % _f19_f(jv[(25, 8)], 2), "middle", 9.5, TEA, True, halo=True))
        o.append(T(P.X(0) + 6, P.Y(0) + 14, "[0 0]: %s" % _f19_f(jv[(0, 0)], 2), "start", 9.5, MUT, True, halo=True))
        o.append(T(P.X(0) - 4, P.Y(8) - 7, "[0 8]: %s" % _f19_f(jv[(0, 8)], 2), "end", 9.5, PUR, True, halo=True))
        o.append(T(P.X(78), P.Y(19), "等高線: 最小値の", "end", 9, MUT, halo=True))
        o.append(T(P.X(78), P.Y(19) + 13, "1.05・1.2・1.5・2・3・5 倍", "end", 9, MUT, halo=True))
    return SVG(700, 300, o,
               "台車とばね・ダンパに F = [f₁ f₂] を加えたときの J（q₁ = 2400、q₂ = 0、R = 1）の等高線。どちらの初めの状態でも、J はお椀の形で、底はリッカチ方程式から求めた F = [30 6] にある。底の値は x(0)ᵀXx(0)（3.9 と 1.5）に一致する。点は 18 章 1 節で調べたゲインで、数は J の値。")


F["e19_bowl"] = _f19_bowl_fig()


# =====================================================================
# 4 節: J の 3 つの項（10° から放す）
# =====================================================================
_F19_SIMA10 = _f19_sim(_F19_FA, _F19_X10, 4.0)
_F19_SIMB10 = _f19_sim(_F19_FB, _F19_X10, 4.0)


def _f19_bryson_fig():
    o = []
    th10 = 10 * _F19_D2R
    for k, (sim, title, parts, angle_on) in enumerate(((_F19_SIMB10, "(a) 最初の案（0.5 m・10°・5 N）", ("0.036", "0.087", "0.074", "0.197"), True),
                                                      (_F19_SIMA10, "(b) 例（0.5 m・角度は評価しない・5 N）", ("0.034", "0", "0.053", "0.087"), False))):
        x00 = 62 + k * 340
        o.append(T(x00 - 48, 18, title, "start", 11.5, INK, True))
        P = Plot(x00, 34, 270, 170, (0, 1.5), (0, 3))
        o.append(P.axes(xl="時間 t [s]", yl="（量 ÷ 許せる最大値）^2", xt=[0, 0.5, 1, 1.5], yt=[0, 1, 2, 3], xfmt=lambda v: "%g" % v))
        t, p, pd, ph, phd, u = sim
        o.append(P.clip(list(zip(t, (p / 0.5) ** 2)), c=SIG, lw=2.0))
        o.append(P.clip(list(zip(t, (ph / th10) ** 2)), c=TEA if angle_on else FNT, lw=2.0, dash=None if angle_on else "4 3"))
        o.append(P.clip(list(zip(t, (u / 5.0) ** 2)), c=GLD, lw=2.0))
        um = float(_f19_np.max(_f19_np.abs(u)))
        o.append(TX(P.X(0.05), P.Y(min((um / 5) ** 2, 2.9)) + 4, "(u/5 N)^2 の初め %s" % _f19_f((um / 5) ** 2, 2), "start", 9.5, GLD, True, halo=True))
        if angle_on:
            o.append(TX(P.X(0.22), P.Y(1.25), "(φ/10°)^2 の初め 1", "start", 9.5, TEA, True, halo=True))
        else:
            o.append(TX(P.X(0.30), P.Y(0.62), "(φ/10°)^2（J には入れない）", "start", 9.5, MUT, True, halo=True))
        o.append(TX(P.X(0.62), P.Y(0.22), "(p/0.5 m)^2", "start", 9.5, SIG, True, halo=True))
        yb = 246
        o.append(T(x00 - 48, yb, "J の内訳: 位置 %s ＋ 角度 %s ＋ 力 %s ＝ %s" % parts, "start", 10, INK))
    o.append(LEGL(62, 272, [(SIG, None, "(p/0.5 m)^2"), (TEA, None, "(φ/10°)^2"), (GLD, None, "(u/5 N)^2")]))
    return SVG(700, 282, o,
               "10° 傾けて静かに放したときの、J の各項の時間の変化（線形でない式）。項の面積の和が J である。(a) 最初の案では、初めにある角度のずれを速く減らすために、力の項が初めに 2.9 まで大きくなる（8.53 N）。(b) 角度を評価しない例では、力の項は初めに 1.11（5.27 N）で、台車の位置と力の釣り合いで応答が決まる。")


F["e19_bryson"] = _f19_bryson_fig()


# =====================================================================
# 4 節: 重みの効き方
# =====================================================================
def _f19_wfx_fig():
    o = []
    des = [(10.0, ALI, None, "10°"), (20.0, PUR, "6 3", "20°"), (30.0, TEA, "2 3", "30°"), (None, SIG, None, "評価しない（例）")]
    o.append(T(14, 18, "(a) 10° から放したときの力", "start", 11.5, INK, True))
    Pa = Plot(62, 34, 270, 150, (0, 2), (-6, 9))
    o.append(Pa.axes(xl="時間 t [s]", yl="力 u [N]", xt=[0, 0.5, 1, 1.5, 2], yt=[-5, 0, 5], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pa.x, Pa.Y(5), Pa.x + Pa.w, Pa.Y(5), c=ALI, lw=1, dash="3 3"))
    o.append(W(Pa.x, Pa.Y(-5), Pa.x + Pa.w, Pa.Y(-5), c=ALI, lw=1, dash="3 3"))
    o.append(W(Pa.x, Pa.Y(0), Pa.x + Pa.w, Pa.Y(0), c=MUT, lw=1))
    o.append(T(392, 18, "(b) おもりを 1 N で 0.1 s 押したときの角度", "start", 11.5, INK, True))
    Pb = Plot(420, 34, 260, 150, (0, 3), (-12, 4))
    o.append(Pb.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 1, 2, 3], yt=[-12, -8, -4, 0, 4], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pb.x, Pb.Y(0), Pb.x + Pb.w, Pb.Y(0), c=MUT, lw=1))
    for phm, c, dash, lab in des:
        F_, X_, Q_, R_ = _f19_design(0.5, phm, 5.0)
        t, p, pd, ph, phd, u = _f19_sim(F_, _F19_X10, 2.0)
        o.append(Pa.clip(list(zip(t, u)), c=c, lw=2.0, dash=dash))
        t2, p2, pd2, ph2, phd2, u2 = _f19_sim(F_, [0, 0, 0, 0], 3.0, push=_F19_PUSH)
        o.append(Pb.clip(list(zip(t2, ph2 / _F19_D2R)), c=c, lw=2.0, dash=dash))
    o.append(T(Pa.X(0.05) + 4, Pa.Y(8.53) + 4, "8.53 N（10°）", "start", 9.5, ALI, True, halo=True))
    o.append(T(Pa.X(0.05) + 4, Pa.Y(5.27) + 18, "5.27 N（評価しない）", "start", 9.5, SIG, True, halo=True))
    o.append(T(Pa.X(1.98), Pa.Y(5) - 5, "上限 5 N", "end", 9, ALI, halo=True))
    o.append(T(Pb.X(0.95), Pb.Y(-10.5) + 2, "−10.5°（評価しない）", "start", 9.5, SIG, True, halo=True))
    o.append(T(Pb.X(0.85), Pb.Y(-7.3) - 10, "−7.3°（10°）", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(62, 226, [(ALI, None, "角度の最大値 10°"), (PUR, "6 3", "20°"), (TEA, "2 3", "30°"), (SIG, None, "評価しない（例）")]))
    # (c) 位置の最大値
    o.append(T(14, 262, "(c) 角度を評価せず、台車の位置の最大値を変える（10° から）", "start", 11.5, INK, True))
    Pc = Plot(62, 278, 270, 150, (0, 3), (-2, 16))
    o.append(Pc.axes(xl="時間 t [s]", yl="台車の位置 p [cm]", xt=[0, 1, 2, 3], yt=[0, 5, 10, 15], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pc.x, Pc.Y(0), Pc.x + Pc.w, Pc.Y(0), c=MUT, lw=1))
    for pm, c, dash in ((0.25, GRN, "6 3"), (0.5, SIG, None), (1.0, MUT, "2 3")):
        F_, X_, Q_, R_ = _f19_design(pm, None, 5.0)
        t, p, pd, ph, phd, u = _f19_sim(F_, _F19_X10, 3.0)
        o.append(Pc.clip(list(zip(t, p * 100)), c=c, lw=2.0, dash=dash))
    o.append(T(Pc.X(0.62), Pc.Y(15.6) - 4, "1 m: 15.6 cm、±1 cm に 1.65 s", "start", 9.5, MUT, True, halo=True))
    o.append(T(Pc.X(1.0), Pc.Y(11.0) - 2, "0.5 m（例）: 13.3 cm、1.22 s", "start", 9.5, SIG, True, halo=True))
    o.append(T(Pc.X(1.2), Pc.Y(5.6), "0.25 m: 11.7 cm、0.92 s", "start", 9.5, GRN, True, halo=True))
    xr = 372
    lines = [("効くのは比 q_{11}/R = u_{max}^2/p_{max}^2 だけ", INK, True),
             ("0.25 m・5 N と 0.5 m・10 N は同じ F", MUT, False),
             ("1 m・5 N と 0.5 m・2.5 N も同じ F", MUT, False),
             ("", MUT, False),
             ("位置の最大値を小さくする（重みを大きく）と", INK, False),
             ("台車は速く戻るが、初めの力が増える", INK, False),
             ("0.25 m: 7.07 N、0.5 m: 5.27 N、1 m: 4.22 N", MUT, False)]
    for i, (l, c, b) in enumerate(lines):
        if l:
            o.append(TX(xr, 296 + i * 18, l, "start", 10, c, b))
    return SVG(700, 476, o,
               "倒立振子の重みの効き方（台車の位置 0.5 m・力 5 N を基準に、ブライソンの規則で決めた重み）。(a) 角度を許せる最大値を小さくする（重みを大きくする）ほど、10° から放したときの初めの力が大きい。(b) その代わり、おもりを押したときに、台車を戻す途中で振子が傾く角度は小さくなる。(c) 角度を評価しないとき、台車の位置を許せる最大値を小さくするほど、台車は速く戻る。")


F["e19_wfx"] = _f19_wfx_fig()


# =====================================================================
# 4 節: 重みを変えたときの閉ループの極
# =====================================================================
def _f19_srl_fig():
    o = []
    P = Plot(60, 24, 380, 340, (-15, 1), (-9.6, 9.6))
    o.append(RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-14, -12, -10, -8, -6, -4, -2, 0], yt=[-8, -4, 0, 4, 8], grid=False,
                    xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    # 位置の重みを変える（角度は評価しない）
    qs = _f19_np.logspace(-4, 3, 160)
    R1 = _f19_track([_f19_np.linalg.eigvals(_F19_A - _f19_np.outer(_F19_B, _f19_lqr(_F19_A, _F19_B, _f19_np.diag([q, 0, 0, 0]), 0.04)[0])) for q in qs])
    for br in R1:
        o.append(P.clip([(z.real, z.imag) for z in br], c=SIG, lw=2.0))
    # 角度の重みを加える（位置は 0.5 m）
    phs = _f19_np.concatenate([[None], _f19_np.logspace(_f19_np.log10(180), _f19_np.log10(4), 80)])
    R2 = _f19_track([_f19_np.linalg.eigvals(_F19_A - _f19_np.outer(_F19_B, _f19_design(0.5, ph, 5.0)[0])) for ph in phs])
    for br in R2:
        o.append(P.clip([(z.real, z.imag) for z in br], c=PUR, lw=1.8, dash="6 3"))
    # 開ループの極・鏡・例・最初の案
    for z in (0j, 0j, 6.766 + 0j, -6.766 + 0j):
        o.append(_f19_xmark(P, z, MUT, 5.5, 2.0))
    for z in _f19_np.linalg.eigvals(_F19_A - _f19_np.outer(_F19_B, _F19_FA)):
        o.append(_f19_xmark(P, z, SIG, 6.5, 2.8))
    for z in _f19_np.linalg.eigvals(_F19_A - _f19_np.outer(_F19_B, _F19_FB)):
        o.append(_f19_xmark(P, z, PUR, 6, 2.4))
    o.append(T(P.X(0.85), P.Y(0) - 9, "+6.77", "end", 9, MUT, halo=True))
    o.append(T(P.X(-6.77), P.Y(0) + 17, "−6.77（鏡の位置）", "middle", 9, MUT, True, halo=True))
    o.append(T(P.X(-5.6), P.Y(0) - 10, "−5.72", "start", 9, SIG, halo=True))
    o.append(T(P.X(-2.6), P.Y(3.1), "例（0.5 m）", "start", 9.5, SIG, True, halo=True))
    o.append(T(P.X(-11.0) + 9, P.Y(8.71) + 4, "最初の案（10°）", "start", 9.5, PUR, True, halo=True))
    o.append(T(P.X(-1.3), P.Y(-1.25) + 14, "台車の極", "end", 9, SIG, halo=True))
    # 右の説明
    xr = 466
    lines = [("青の実線: 角度は評価せず、", SIG, True), ("位置の重み q₁₁ を 10⁻⁴ から 10³ へ", SIG, False),
             ("・小さいと、2 つは 0 に、2 つは", INK, False), ("　鏡の位置 −6.77 に近づく", INK, False),
             ("・大きくすると、台車の 2 つの極が", INK, False), ("　左へ離れ、振子の 2 つの極は", INK, False),
             ("　−5.72（零点 +5.72 の鏡）に近づく", INK, False), ("", INK, False),
             ("紫の破線: 位置は 0.5 m のまま、", PUR, True), ("角度の最大値を 180° から 4° へ", PUR, False),
             ("・振子の 2 つの極が左へ離れ、", INK, False), ("　台車の 2 つの極は原点に近づく", INK, False),
             ("", INK, False), ("灰色の ×: 対象の固有値 0・0・±6.77", MUT, False)]
    for i, (l, c, b) in enumerate(lines):
        if l:
            o.append(T(xr, 40 + i * 18, l, "start", 10, c, b))
    return SVG(700, 400, o,
               "倒立振子の最適レギュレータの閉ループの極（力の最大値 5 N）。重みを変えると、極は決まった道筋をたどる。力を嫌う重みでは、振子の不安定な固有値 +6.77 は鏡に映した −6.77 まで動かすだけで済ませる。台車の位置の重みは台車の 2 つの極を、角度の重みは振子の 2 つの極を、左へ動かす。太い × は例の重み、紫の × は最初の案（角度 10°）の極。")


F["e19_srl"] = _f19_srl_fig()


# =====================================================================
# 5 節: 同じ速さの極配置との比較（10° から放す）
# =====================================================================
_F19_SIMW10 = _f19_sim(_F19_FPPW, _F19_X10, 4.0)


def _f19_cmp_fig():
    o = []
    # (a) 極
    o.append(T(14, 18, "(a) 閉ループの極", "start", 11.5, INK, True))
    P = Plot(56, 34, 270, 180, (-8, 1), (-4.5, 4.5))
    o.append(RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-8, -6, -4, -2, 0], yt=[-4, -2, 0, 2, 4], grid=False,
                    xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    for z in (0j, -6.766 + 0j):
        o.append(_f19_xmark(P, z, MUT, 5, 2.0))
    o.append(T(P.X(0.95), P.Y(-4.1), "+6.77 は右の枠の外", "end", 8.5, MUT, halo=True))
    o.append(W(P.X(-6.766), P.Y(-4.3), P.X(-6.766), P.Y(4.3), c=FNT, lw=1, dash="2 3"))
    o.append(T(P.X(-6.766) + 4, P.Y(4.0) + 3, "鏡の位置 −6.77", "start", 9, MUT, halo=True))
    for z in _f19_np.linalg.eigvals(_F19_A - _f19_np.outer(_F19_B, _F19_FA)):
        o.append(_f19_xmark(P, z, SIG, 6, 2.6))
    o.append(_f19_xmark(P, complex(-_F19_WPS, 0), PUR, 6.5, 2.6))
    o.append(_f19_xmark(P, complex(-4.0, 0), TEA, 6, 2.2))
    o.append(T(P.X(-_F19_WPS), P.Y(0) + 20, "−5.70 × 4", "middle", 9.5, PUR, True, halo=True))
    o.append(T(P.X(-4.0) + 2, P.Y(0) - 10, "−4 × 4（18 章）", "start", 9, TEA, True, halo=True))
    o.append(T(P.X(-2.88) + 8, P.Y(2.55) - 5, "−2.88 ± j2.55", "start", 9.5, SIG, True, halo=True))
    o.append(T(P.X(-6.65) + 8, P.Y(0.40) - 18, "−6.65 ± j0.40", "start", 9.5, SIG, True, halo=True))
    sims = ((_F19_SIMA10, SIG, None), (_F19_SIMW10, PUR, "6 3"))
    # (b) 力
    o.append(T(380, 18, "(b) 力 u [N]", "start", 11.5, INK, True))
    Pb = Plot(420, 34, 260, 150, (0, 2), (-3, 8))
    o.append(Pb.axes(xl="時間 t [s]", yl=None, xt=[0, 0.5, 1, 1.5, 2], yt=[-2, 0, 2, 4, 6, 8], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pb.x, Pb.Y(5), Pb.x + Pb.w, Pb.Y(5), c=ALI, lw=1, dash="3 3"))
    for sim, c, dash in sims:
        o.append(Pb.clip(list(zip(sim[0], sim[5])), c=c, lw=2.0, dash=dash))
    o.append(T(Pb.X(0.06) + 4, Pb.Y(7.14) + 4, "7.14 N", "start", 9.5, PUR, True, halo=True))
    o.append(T(Pb.X(0.06) + 4, Pb.Y(5.27) + 15, "5.27 N", "start", 9.5, SIG, True, halo=True))
    o.append(T(Pb.X(1.98), Pb.Y(5) - 5, "上限 5 N", "end", 9, ALI, halo=True))
    # (c) 角度
    o.append(T(14, 262, "(c) 角度 φ [°]", "start", 11.5, INK, True))
    Pc = Plot(56, 278, 270, 150, (0, 3), (-6, 11))
    o.append(Pc.axes(xl="時間 t [s]", yl=None, xt=[0, 1, 2, 3], yt=[-5, 0, 5, 10], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pc.x, Pc.Y(0), Pc.x + Pc.w, Pc.Y(0), c=MUT, lw=1))
    for sim, c, dash in sims:
        o.append(Pc.clip(list(zip(sim[0], sim[3] / _F19_D2R)), c=c, lw=2.0, dash=dash))
    o.append(T(Pc.X(1.0), Pc.Y(6.5), "±0.2° に 1.85 s（青）・1.71 s（紫）", "start", 9.5, INK, halo=True))
    # (d) 台車の位置
    o.append(T(380, 262, "(d) 台車の位置 p [cm]", "start", 11.5, INK, True))
    Pd = Plot(420, 278, 260, 150, (0, 3), (-2, 15))
    o.append(Pd.axes(xl="時間 t [s]", yl=None, xt=[0, 1, 2, 3], yt=[0, 5, 10, 15], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pd.x, Pd.Y(0), Pd.x + Pd.w, Pd.Y(0), c=MUT, lw=1))
    for sim, c, dash in sims:
        o.append(Pd.clip(list(zip(sim[0], sim[1] * 100)), c=c, lw=2.0, dash=dash))
    o.append(T(Pd.X(0.42), Pd.Y(13.3) - 6, "13.3 cm", "end", 9.5, SIG, True, halo=True))
    o.append(T(Pd.X(0.62), Pd.Y(11.6) + 15, "11.6 cm", "start", 9.5, PUR, True, halo=True))
    o.append(T(Pd.X(1.3), Pd.Y(6.5), "±1 cm に、どちらも 1.22 s", "start", 9.5, INK, halo=True))
    o.append(LEGL(56, 478, [(SIG, None, "最適レギュレータ（例: Q = diag(4, 0, 0, 0)、R = 0.04）"), (PUR, "6 3", "極配置（4 つの極を −5.70）")]))
    return SVG(700, 488, o,
               "台車が ±1 cm に収まる時間が同じ（1.22 s）最適レギュレータと極配置を、10° 傾けて静かに放す試験で比べる（線形でない式）。(a) 最適レギュレータは、振子の 2 つの極を、不安定な固有値 +6.77 の鏡の位置の近くに残し、台車の 2 つの極を減衰比 0.75 の組に置く。(b) 最大の力は 5.27 N と 7.14 N。(c) 角度は極配置の方が少し早く収まり、(d) 台車は極配置の方が少しだけ動かない。")


F["e19_cmp"] = _f19_cmp_fig()


# =====================================================================
# 5 節: 極配置の族と最適レギュレータの族
# =====================================================================
def _f19_front_fig():
    o = []
    x0 = _f19_np.array(_F19_X10)
    JA = float(x0 @ _F19_XA @ x0)
    o.append(TX(14, 18, "(a) 4 つの極を −ω_p に置いたときの J（例の重み）", "start", 11.5, INK, True))
    P = Plot(62, 34, 270, 190, (3, 8), (0, 0.25))
    o.append(P.axes(xl="極配置の速さ ω_p [rad/s]", yl="評価関数 J", xt=[3, 4, 5, 6, 7, 8], yt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yfmt=lambda v: "%g" % v))
    wps = _f19_np.linspace(3, 8, 101)
    Js = []
    for wp in wps:
        Fw = _f19_acker(_F19_A, _F19_B, [-wp] * 4)
        Acl = _F19_A - _f19_np.outer(_F19_B, Fw)
        Js.append(_f19_lyapJ(Acl, _F19_QA + _F19_RA * _f19_np.outer(Fw, Fw), x0))
    o.append(P.clip(list(zip(wps, Js)), c=PUR, lw=2.2))
    o.append(W(P.X(3), P.Y(JA), P.X(8), P.Y(JA), c=SIG, lw=2.0))
    o.append(T(P.X(7.95), P.Y(JA) + 14, "最適レギュレータ 0.0868", "end", 9.5, SIG, True, halo=True))
    for wp, lab, dy in ((4.0, "ω_p = 4（18 章）: +%s %%", -26), (5.0, "5: +%s %%", -12), (_F19_WPS, "5.70（同じ速さ）: +%s %%", -10)):
        Fw = _f19_acker(_F19_A, _F19_B, [-wp] * 4)
        Jw = _f19_lyapJ(_F19_A - _f19_np.outer(_F19_B, Fw), _F19_QA + _F19_RA * _f19_np.outer(Fw, Fw), x0)
        lab = lab % _f19_f(100 * (Jw / JA - 1), 1)
        o.append(D(P.X(wp), P.Y(Jw), PUR, 3.8))
        o.append(TX(P.X(wp) + (6 if wp != 5.0 else 0), P.Y(Jw) + dy, lab, "start" if wp != 5.0 else "middle", 9.5, PUR, True, halo=True))
    # (b) 速さと最大の力
    o.append(T(372, 18, "(b) 10° から立て直す最大の力と速さ", "start", 11.5, INK, True))
    Q2 = Plot(420, 34, 260, 190, (0.6, 3.0), (0, 15))
    o.append(Q2.axes(xl="台車が ±1 cm に収まる時間 [s]", yl="最大の力 [N]", xt=[1, 1.5, 2, 2.5, 3], yt=[0, 5, 10, 15], xfmt=lambda v: "%g" % v))
    o.append(W(Q2.x, Q2.Y(5), Q2.x + Q2.w, Q2.Y(5), c=ALI, lw=1, dash="3 3"))
    lq, pp = [], []
    for pm in (3.0, 2.0, 1.5, 1.0, 0.7, 0.5, 0.35, 0.25, 0.18, 0.13):
        F_ = _f19_design(pm, None, 5.0)[0]
        t, p, pd, ph, phd, u = _f19_sim(F_, _F19_X10, 6.0, h=0.002)
        lq.append((_f19_settle(t, p, 0.01), float(_f19_np.max(_f19_np.abs(u))), pm))
    for wp in (3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0, 9.0):
        F_ = _f19_acker(_F19_A, _F19_B, [-wp] * 4)
        t, p, pd, ph, phd, u = _f19_sim(F_, _F19_X10, 6.0, h=0.002)
        pp.append((_f19_settle(t, p, 0.01), float(_f19_np.max(_f19_np.abs(u))), wp))
    o.append(Q2.clip([(a, b) for a, b, c in lq], c=SIG, lw=2.2))
    o.append(Q2.clip([(a, b) for a, b, c in pp], c=PUR, lw=2.2, dash="6 3"))
    for a, b, wp in pp:
        if wp in (4.0, 5.0, 6.0, 7.0, 8.0) and 0.6 <= a <= 3.0 and b <= 15:
            o.append(D(Q2.X(a), Q2.Y(b), PUR, 3.2))
            o.append(TX(Q2.X(a) + 5, Q2.Y(b) - 4, "ω_p = %g" % wp, "start", 9, PUR, halo=True))
    for a, b, pm in lq:
        if pm in (1.0, 0.5, 0.25) and 0.6 <= a <= 3.0:
            o.append(D(Q2.X(a), Q2.Y(b), SIG, 3.4))
            o.append(T(Q2.X(a) - 4, Q2.Y(b) + 14, "%g m" % pm, "end", 9, SIG, halo=True))
    o.append(T(Q2.X(2.95), Q2.Y(5) - 5, "上限 5 N", "end", 9, ALI, halo=True))
    o.append(TX(Q2.X(1.7), Q2.Y(12.5), "極配置（−ω_p × 4）", "start", 9.5, PUR, True, halo=True))
    o.append(T(Q2.X(1.7), Q2.Y(10.5), "最適レギュレータ", "start", 9.5, SIG, True, halo=True))
    o.append(T(Q2.X(1.7), Q2.Y(10.5) + 13, "（角度は評価せず、位置の", "start", 9, SIG, halo=True))
    o.append(T(Q2.X(1.7), Q2.Y(10.5) + 26, "最大値を 3 m から 0.13 m へ）", "start", 9, SIG, halo=True))
    return SVG(700, 270, o,
               "(a) 4 つの極を同じ点 −ω<sub>p</sub> に置く極配置の J（例の重み、10° から放す）。ω<sub>p</sub> = 5 rad/s で最も小さく、最適レギュレータとの差は 1.0 %。(b) 10° から立て直す最大の力と、台車が ±1 cm に収まる時間。同じ速さなら、最適レギュレータの方が力が小さく、差は速い設計ほど大きい。点の数字は ω<sub>p</sub> と、台車の位置を許せる最大値。")


F["e19_front"] = _f19_front_fig()


# =====================================================================
# 6 節: 入力の点でループを切る
# =====================================================================
def _f19_cut_fig():
    o = []
    o.append(T(14, 18, "(a) 状態フィードバックのループを、入力 u の所で切る", "start", 11.5, INK, True))
    yc = 70
    s, pos, xe = CHAIN(24, yc, [("a", 44, "0", MUT), ("s", {"l": "+", "b": "−"}, "s"), ("w", 30, GLD), ("w", 46, GLD),
                                ("a", 46, "u", GLD), ("b", "(sI − A)^{−1}B", "P", SIG, SSOFT), ("w", 40, SIG), ("t", "tx", SIG), ("a", 40, None, SIG)])
    o.append(s)
    xs = pos["s"]
    xcut = xs + 15 + 40
    o.append(W(xcut - 5, yc - 10, xcut - 5, yc + 10, c=ALI, lw=2.2)); o.append(W(xcut + 5, yc - 10, xcut + 5, yc + 10, c=ALI, lw=2.2))
    o.append(T(xcut, yc - 18, "切る", "middle", 9.5, ALI, True, halo=True))
    o.append(W(pos["tx"], yc - 1.5, pos["tx"], yc + 1.5, c=SIG, lw=4))
    o.append(T(pos["tx"] - 22, yc - 9, "x", "middle", 10.5, SIG, True, halo=True))
    o.append(FBPATH(pos["tx"], xs, yc, 56, c=SIG, box="F"))
    o.append(TX(xs + 34, yc + 50, "Fx", "start", 10, SIG, True, halo=True))
    o.append(T((pos["P"][0] + pos["P"][1]) / 2, yc - 28, "対象（u から x まで）", "middle", 9.5, MUT))
    o.append(TX(xcut + 10, yc + 30, "入れる信号 u_{in}", "start", 9.5, GLD, True))
    o.append(TX(20, yc + 92, "戻ってくる信号 = −F(sI − A)^{−1}B u_{in}", "start", 10, INK))
    o.append(TX(20, yc + 112, "一巡伝達関数: F(sI − A)^{−1}B", "start", 10.5, SIG, True))
    # (b) 同じループを 1 本の線図で
    o.append(T(392, 18, "(b) 7 章の形に書き直す", "start", 11.5, INK, True))
    yc2 = 70
    s2, pos2, xe2 = CHAIN(402, yc2, [("a", 30, None, MUT), ("s", {"l": "+", "b": "−"}, "s"), ("a", 34, "u", GLD),
                                     ("b", "F(sI − A)^{−1}B", "P", SIG, SSOFT), ("t", "ty", SIG), ("a", 30, "Fx", SIG)])
    o.append(s2)
    o.append(FBPATH(pos2["ty"], pos2["s"], yc2, 44, c=SIG, box="1"))
    o.append(TX(402, yc2 + 82, "対象 P(s) → F(sI − A)^{−1}B（u から Fx まで）", "start", 9.5, INK))
    o.append(TX(402, yc2 + 98, "制御器 C(s) → 1", "start", 9.5, INK))
    o.append(TX(402, yc2 + 118, "閉ループの極: 1 + F(sI − A)^{−1}B = 0 の根", "start", 10, SIG, True))
    o.append(TX(402, yc2 + 134, "＝ A − BF の固有値", "start", 10, SIG, True))
    return SVG(700, 214, o,
               "入力の点で切った一巡伝達関数。(a) 状態フィードバックのループを、入力 u の所で切って信号を入れると、対象を通って状態になり、F を掛けられ、符号を変えて戻ってくる。一周で掛かる伝達関数 F(sI − A)⁻¹B が一巡伝達関数である。(b) 入力から Fx までを 1 つの対象とみると、7 章のフィードバック系（制御器は 1）と同じ形になる。")


F["e19_cut"] = _f19_cut_fig()


# =====================================================================
# 6 節: −1 を中心とする円と、余裕の読み方
# =====================================================================
def _f19_disk_common(x, y, title):
    o = [TX(x - 44, 18, title, "start", 11.5, INK, True)]
    sv, P = CPLANE(x, y, 290, 207, (-2.8, 1.2), (-1.45, 1.45), [-2, -1, 0, 1], [-1, 0, 1])
    o.append(sv)
    th = _f19_np.linspace(0, 2 * math.pi, 181)
    o.append(PL([(P.X(-1 + math.cos(a)), P.Y(math.sin(a))) for a in th], c=ALI, lw=1.4, fill=soft(ALI), op=0.6))
    ws = _f19_np.logspace(_f19_np.log10(1.7), 3, 500)
    v = [_f19_L(_F19_FA, w) for w in ws]
    o.append(P.clip([(z.real, z.imag) for z in v], c=FNT, lw=1.6))
    o.append(P.clip([(z.real, -z.imag) for z in v], c=FNT, lw=1.2, dash="4 3"))
    return o, P


def _f19_disk_fig():
    o = []
    oa, P = _f19_disk_common(56, 30, "(a) 力が k 倍になる: −1/k を見る")
    o += oa
    o.append(W(P.X(-2), P.Y(0), P.X(0), P.Y(0), c=GRN, lw=4))
    for kk, lab, dy in ((0.5, "k = 1/2", -9), (1.0, "k = 1", 16), (2.0, "k = 2", -9)):
        o.append(D(P.X(-1 / kk), P.Y(0), GRN if kk != 1 else ALI, 4))
        o.append(T(P.X(-1 / kk), P.Y(0) + dy, lab, "middle", 9.5, GRN if kk != 1 else ALI, True, halo=True))
    o.append(T(P.X(-0.05), P.Y(0) + 16, "k → ∞", "end", 9.5, GRN, True, halo=True))
    o.append(T(P.X(-1), P.Y(-1.25), "−1/k（k > 1/2）は円の中", "middle", 9.5, GRN, True, halo=True))
    ob, Q = _f19_disk_common(406, 30, "(b) 単位円を横切る点（ゲイン交差）の位相")
    o += ob
    arc = [(math.cos(a), math.sin(a)) for a in _f19_np.linspace(2 * math.pi / 3, 4 * math.pi / 3, 61)]
    o.append(Q.line(arc, c=GRN, lw=4))
    for sg in (1, -1):
        zx, zy = -0.5, sg * math.sqrt(3) / 2
        o.append(D(Q.X(zx), Q.Y(zy), GRN, 4))
        o.append(W(Q.X(0), Q.Y(0), Q.X(zx), Q.Y(zy), c=GRN, lw=1.1, dash="3 3"))
    o.append(TX(Q.X(-0.5) - 2, Q.Y(math.sqrt(3) / 2) - 8, "−1/2 + j√3/2", "middle", 9.5, GRN, True, halo=True))
    o.append(W(Q.X(0), Q.Y(0), Q.X(-1), Q.Y(0), c=GRN, lw=1.1, dash="3 3"))
    a60 = [(0.32 * math.cos(a), 0.32 * math.sin(a)) for a in _f19_np.linspace(2 * math.pi / 3, math.pi, 20)]
    o.append(Q.line(a60, c=GRN, lw=1.4))
    o.append(T(Q.X(-0.36), Q.Y(0.32), "60°", "end", 9.5, GRN, True, halo=True))
    o.append(T(Q.X(-1), Q.Y(-1.25), "−1 から ±60° の弧は円の中", "middle", 9.5, GRN, True, halo=True))
    o.append(LEGL(56, 286, [(ALI, None, "線図が入らない円 |1 + F(jωI − A)^{−1}B| < 1"), (FNT, None, "例の線図（ω > 0）"), (FNT, "4 3", "鏡像")]))
    return SVG(700, 296, o,
               "最適レギュレータのナイキスト線図は、−1 を中心とする半径 1 の円（赤）に入らない。回る回数は、見る点が線図を横切らなければ変わらない。(a) 力が k 倍になったときは、元の線図が −1/k を回る回数を見ればよい。k > 1/2 なら −1/k は円の中なので、回る回数は −1 のときと同じで、安定なままである。(b) ゲイン交差角周波数では、線図は単位円の上にある。単位円のうち −1 から ±60° の弧（緑）は円の中にあり、線図はそこを通れないので、位相は −180° から 60° 以上離れる。位相余裕は 60° 以上である。")


F["e19_disk"] = _f19_disk_fig()


# =====================================================================
# 6 節: 倒立振子のナイキスト線図（最適レギュレータと極配置）
# =====================================================================
def _f19_nyq_fig():
    o = []
    cases = ((_F19_FA, SIG, "(a) 最適レギュレータ（例）"), (_F19_FBAD, PUR, "(b) 極配置（2 組の −3 ± j3）"))
    for k, (Fv, c, title) in enumerate(cases):
        x0 = 56 + k * 350
        o.append(T(x0 - 44, 18, title, "start", 11.5, INK, True))
        sv, P = CPLANE(x0, 32, 280, 244, (-3.4, 1.2), (-2.0, 2.0), [-3, -2, -1, 0, 1], [-2, -1, 0, 1, 2])
        o.append(sv)
        th = _f19_np.linspace(0, 2 * math.pi, 181)
        o.append(PL([(P.X(-1 + math.cos(a)), P.Y(math.sin(a))) for a in th], c=ALI, lw=1.2, fill=soft(ALI), op=0.55))
        ws = _f19_np.logspace(_f19_np.log10(0.6), 3, 1200)
        v = _f19_np.array([_f19_L(Fv, w) for w in ws])
        o.append(P.clip([(z.real, -z.imag) for z in v], c=c, lw=1.3, dash="4 3"))
        o.append(P.clip([(z.real, z.imag) for z in v], c=c, lw=2.3))
        for wv in (2.5, 7.0, 25.0):
            kk = int(_f19_np.argmin(_f19_np.abs(ws - wv)))
            o.append(CURVEHEAD(P, list(v), kk, c, 8))
        o.append(M1(P, lab=False))
        o.append(T(P.X(-1), P.Y(0) + 15, "−1", "middle", 9.5, ALI, True, halo=True))
        # 負の実軸を横切る点
        wl, wh = 3.0, 6.0
        for _ in range(60):
            wm = (wl + wh) / 2
            if _f19_L(Fv, wl).imag * _f19_L(Fv, wm).imag <= 0:
                wh = wm
            else:
                wl = wm
        zc = _f19_L(Fv, wl)
        o.append(D(P.X(zc.real), P.Y(0), c, 4.2))
        o.append(T(P.X(zc.real), P.Y(0) - 9, _f19_f(zc.real, 2), "middle", 9.5, c, True, halo=True))
        # 単位円を横切る点（位相余裕）
        wl, wh = 6.0, 60.0
        for _ in range(60):
            wm = math.sqrt(wl * wh)
            if (abs(_f19_L(Fv, wl)) - 1) * (abs(_f19_L(Fv, wm)) - 1) <= 0:
                wh = wm
            else:
                wl = wm
        zg = _f19_L(Fv, wl)
        pm = 180 - abs(math.degrees(math.atan2(zg.imag, zg.real)))
        ang = math.atan2(zg.imag, zg.real)
        arc = [(0.62 * math.cos(a), 0.62 * math.sin(a)) for a in _f19_np.linspace(-math.pi, ang, 30)]
        o.append(P.line(arc, c=GLD, lw=1.6))
        o.append(W(P.X(0), P.Y(0), P.X(zg.real), P.Y(zg.imag), c=GLD, lw=1.0, dash="3 3"))
        o.append(D(P.X(zg.real), P.Y(zg.imag), GLD, 3.8))
        o.append(T(P.X(-0.15), P.Y(-1.25), "位相余裕 %s°" % _f19_f(pm, 1), "start", 9.5, GLD, True, halo=True))
        o.append(TX(P.X(-0.15), P.Y(-1.25) + 14, "（ω_gc = %s rad/s）" % _f19_f(wl, 1), "start", 9, GLD, halo=True))
        o.append(T(P.X(-3.35), P.Y(1.75), "力の下限 %s 倍" % _f19_f(-1 / zc.real, 3), "start", 9.5, c, True, halo=True))
        if k == 1:
            dists = _f19_np.abs(1 + v); kk = int(_f19_np.argmin(dists))
            zz = v[kk]
            o.append(W(P.X(-1), P.Y(0), P.X(zz.real), P.Y(zz.imag), c=ALI, lw=1.6))
            o.append(T(P.X(-1.55), P.Y(-0.55) - 2, "円の中を通る", "end", 9.5, ALI, True, halo=True))
            o.append(T(P.X(-1.55), P.Y(-0.55) + 11, "（最も近い所 %s）" % _f19_f(float(dists[kk]), 3), "end", 9, ALI, halo=True))
        else:
            o.append(T(P.X(-1.9), P.Y(-0.95) + 4, "円の外を通る", "end", 9.5, SIG, True, halo=True))
        o.append(T(P.X(1.15), P.Y(-1.75), "ω → 0 で右の枠の外へ", "end", 9, MUT, halo=True))
    # (c) −1 からの距離
    o.append(T(12, 336, "(c) −1 からの距離 |1 + F(jωI − A)⁻¹B|", "start", 11.5, INK, True))
    G = Plot(56, 352, 560, 110, (0.3, 100), (-8, 8), xlog=True)
    o.append(G.axes(xl="角周波数 ω [rad/s]", yl="[dB]", xt=[1, 10, 100], yt=[-8, -4, 0, 4, 8], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(G.x, G.Y(0), G.x + G.w, G.Y(0), c=MUT, lw=1.2))
    ws = _f19_np.logspace(_f19_np.log10(0.3), 2, 400)
    for Fv, c, dash, lab in ((_F19_FA, SIG, None, "最適レギュレータ（例）"), (_F19_FPP4, TEA, "6 3", "極配置 −4 × 4（18 章）"), (_F19_FBAD, PUR, "2 3", "極配置 2 組の −3 ± j3")):
        o.append(G.clip([(w, 20 * math.log10(abs(1 + _f19_L(Fv, w)))) for w in ws], c=c, lw=2.0, dash=dash))
    o.append(T(G.X(62), G.Y(0) - 5, "0 dB（半径 1）", "middle", 9, MUT, halo=True))
    o.append(T(G.X(5.2), G.Y(-5.4) + 3, "−5.4 dB（0.536）", "end", 9.5, PUR, True, halo=True))
    o.append(T(G.X(7.3) + 4, G.Y(-0.83) + 14, "−0.83 dB（0.909）", "start", 9.5, TEA, True, halo=True))
    o.append(LEGL(56, 510, [(SIG, None, "最適レギュレータ（例）"), (TEA, "6 3", "極配置 −4 × 4（18 章）"), (PUR, "2 3", "極配置 2 組の −3 ± j3")]))
    return SVG(700, 520, o,
               "倒立振子の、入力の点で切った一巡伝達関数 F(jωI − A)⁻¹B のナイキスト線図（−1 のまわりを拡大。破線は鏡像）。開ループには右半平面の固有値 +6.77 があり、どれも −1 を反時計回りに 1 回まわって安定である。(a) 最適レギュレータの線図は赤い円に入らず、負の実軸を −2.21 で横切る（力が 0.452 倍まで下がっても安定）。位相余裕は 60.1°。(b) 極配置によっては、線図が円の中を通り、余裕が小さい。(c) −1 からの距離。最適レギュレータは、どの角周波数でも 0 dB 以上である。")


F["e19_nyq"] = _f19_nyq_fig()
