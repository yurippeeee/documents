# -*- coding: utf-8 -*-
# 20 章 オブザーバとカルマンフィルタ の図
import numpy as _f20_np
from scipy import linalg as _f20_la

# =====================================================================
# 例の値（本文と同じ）
# =====================================================================
_F20_M, _F20_m, _F20_l, _F20_g = 0.5, 0.2, 0.3, 9.81                   # 倒立振子（17 章 2 節）
_F20_A = _f20_np.array([[0.0, 1.0, 0.0, 0.0],
                        [0.0, 0.0, -_F20_m * _F20_g / _F20_M, 0.0],
                        [0.0, 0.0, 0.0, 1.0],
                        [0.0, 0.0, (_F20_M + _F20_m) * _F20_g / (_F20_M * _F20_l), 0.0]])
_F20_B = _f20_np.array([[0.0], [1.0 / _F20_M], [0.0], [-1.0 / (_F20_M * _F20_l)]])
_F20_C = _f20_np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 0.0, 1.0, 0.0]])
_F20_D2R = math.pi / 180.0
_F20_TS = 0.001                                                          # サンプリング周期 1 ms
_F20_SP, _F20_SPH = 0.001, 0.1 * _F20_D2R                                # 観測ノイズの標準偏差（位置 1 mm、角度 0.1°）
_F20_SA, _F20_SAL = 0.3, 3.0                                             # プロセスノイズ（台車の加速度 m/s²、振子の角加速度 rad/s²）
_F20_V = _f20_np.diag([_F20_SP ** 2, _F20_SPH ** 2])
_F20_ACART = _f20_np.array([[0.0, 1.0], [-25.0, -2.0]])                  # 台車とばね・ダンパ
_F20_BCART = _f20_np.array([[0.0], [1.0]])
_F20_FCART = _f20_np.array([[25.0, 8.0]])                                # 18 章 1 節（極 −5 ± j5）
_F20_APH = _f20_np.array([[0.0, 1.0], [(_F20_M + _F20_m) * _F20_g / (_F20_M * _F20_l), 0.0]])   # 振子の角度と角速度


def _f20_c2d(A, B, h):
    """零次ホールドの離散化（17 章 5 節）。"""
    A = _f20_np.asarray(A, float); B = _f20_np.asarray(B, float)
    n, k = A.shape[0], B.shape[1]
    Mx = _f20_np.zeros((n + k, n + k)); Mx[:n, :n] = A * h; Mx[:n, n:] = B * h
    E = _f20_la.expm(Mx)
    return E[:n, :n], E[:n, n:]


def _f20_acker(A, b, poles):
    """アッカーマンの式（18 章 3 節）。返り値 1 行 n 列。"""
    A = _f20_np.asarray(A, float); n = A.shape[0]
    b = _f20_np.asarray(b, float).reshape(-1, 1)
    W = _f20_np.hstack([_f20_np.linalg.matrix_power(A, i) @ b for i in range(n)])
    ph = _f20_np.real(_f20_np.poly(poles))
    P = sum(ph[k] * _f20_np.linalg.matrix_power(A, n - k) for k in range(n + 1))
    e = _f20_np.zeros((1, n)); e[0, -1] = 1.0
    return e @ _f20_np.linalg.inv(W) @ P


# 19 章 4 節の最適レギュレータ（Q = diag(4, 0, 0, 0)、R = 0.04）
_F20_X = _f20_la.solve_continuous_are(_F20_A, _F20_B, _f20_np.diag([4.0, 0, 0, 0]), _f20_np.array([[0.04]]))
_F20_F = (_F20_B.T @ _F20_X) / 0.04
_F20_AD, _F20_BD = _f20_c2d(_F20_A, _F20_B, _F20_TS)
_, _F20_GD = _f20_c2d(_F20_A, _f20_np.array([[0.0, 0.0], [1.0, 0.0], [0.0, 0.0], [0.0, 1.0]]), _F20_TS)


def _f20_W(sa=_F20_SA, sal=_F20_SAL):
    """プロセスノイズの共分散行列（台車の加速度と振子の角加速度が 1 周期の間一定のでたらめな値）。"""
    return _F20_GD @ _f20_np.diag([sa ** 2, sal ** 2]) @ _F20_GD.T


def _f20_obs_gain(wo, wo2=None):
    """予測と更新の形のオブザーバのゲイン。推定誤差の行列 (I − HC)A_d の固有値を、台車の 2 つを e^{−wo T_s}、
    振子の 2 つを e^{−wo2 T_s} に置く（台車の位置で台車の 2 状態を、振子の角度で振子の 2 状態を直す形の H）。"""
    wo2 = wo if wo2 is None else wo2
    H = _f20_np.zeros((4, 2))
    for i0, j, w in ((0, 0, wo), (2, 1, wo2)):
        Ab = _F20_AD[i0:i0 + 2, i0:i0 + 2]
        z = math.exp(-w * _F20_TS)
        h = _f20_acker(Ab.T, Ab[0:1, :].T, [z, z]).T
        H[i0:i0 + 2, j] = h[:, 0]
    return H


def _f20_kf_gain(scale=1.0, sa=_F20_SA, sal=_F20_SAL):
    """定常のカルマンゲイン（W を scale 倍）。返り値 (H, 予測の共分散 Σ⁻)。"""
    W = _f20_W(sa, sal) * scale
    P = _f20_la.solve_discrete_are(_F20_AD.T, _F20_C.T, W, _F20_V)
    return P @ _F20_C.T @ _f20_np.linalg.inv(_F20_C @ P @ _F20_C.T + _F20_V), P


def _f20_est_poles(H):
    """予測と更新の形の推定誤差の極（s 平面に写した値）。"""
    z = _f20_np.linalg.eigvals((_f20_np.eye(4) - H @ _F20_C) @ _F20_AD).astype(complex)
    return _f20_np.log(z) / _F20_TS


def _f20_force_std(H):
    """測定のノイズだけによる、力のノイズの標準偏差（分散の式。閉ループは線形化した式で 1 ms ごと）。"""
    Ad, Bd, F, C = _F20_AD, _F20_BD, _F20_F, _F20_C
    Phi = _f20_np.block([[Ad, -Bd @ F], [H @ C @ Ad, Ad - Bd @ F - H @ C @ Ad]])
    Gv = _f20_np.vstack([_f20_np.zeros((4, 2)), H])
    S = _f20_la.solve_discrete_lyapunov(Phi, Gv @ _F20_V @ Gv.T)
    Fz = _f20_np.hstack([_f20_np.zeros((1, 4)), -F])
    return math.sqrt((Fz @ S @ Fz.T)[0, 0])


def _f20_diff_sys(tau):
    """差分を時定数 tau の一次遅れ（後退差分）でならして使う閉ループ（状態 x、前回の読み、ならした速度）。"""
    Ts = _F20_TS
    a = tau / (tau + Ts) if tau > 0 else 0.0
    F = _F20_F
    Fp = _f20_np.array([[F[0, 0], F[0, 2]]]); Fv = _f20_np.array([[F[0, 1], F[0, 3]]]); I2 = _f20_np.eye(2)
    rowx = _f20_np.hstack([_F20_AD, -_F20_BD @ Fp, -_F20_BD @ Fv]); rowy = _F20_C @ rowx
    rowv = (1 - a) / Ts * (_F20_C @ rowx) + _f20_np.hstack([_f20_np.zeros((2, 4)), -(1 - a) / Ts * I2, a * I2])
    Phi = _f20_np.vstack([rowx, rowy, rowv]); Gv = _f20_np.vstack([_f20_np.zeros((4, 2)), I2, (1 - a) / Ts * I2])
    return Phi, Gv, Fp, Fv


def _f20_diff_force_std(tau):
    Phi, Gv, Fp, Fv = _f20_diff_sys(tau)
    S = _f20_la.solve_discrete_lyapunov(Phi, Gv @ _F20_V @ Gv.T)
    Fz = _f20_np.hstack([_f20_np.zeros((1, 4)), -Fp, -Fv])
    return math.sqrt((Fz @ S @ Fz.T)[0, 0])


def _f20_diff_zeta(tau):
    """閉ループの極（s 平面に写した値）の減衰比の最も小さい値。"""
    Phi = _f20_diff_sys(tau)[0]
    s = _f20_np.log(_f20_np.linalg.eigvals(Phi).astype(complex)) / _F20_TS
    return min(-x.real / abs(x) for x in s)


def _f20_errcov(H, W):
    """推定誤差の共分散行列（定常）: ε[k] = (I − HC)A_d ε[k−1] + (I − HC)w − H v。"""
    I = _f20_np.eye(4)
    Ae = (I - H @ _F20_C) @ _F20_AD
    Qe = (I - H @ _F20_C) @ W @ (I - H @ _F20_C).T + H @ _F20_V @ H.T
    return _f20_la.solve_discrete_lyapunov(Ae, Qe)


# ---- 乱数（widgets.js の U.rng と同じ列。図とデモで同じノイズになる） ----
def _f20_rng(seed):
    st = [(seed & 0xFFFFFFFF) or 1]

    def nx():
        x = (st[0] + 0x6D2B79F5) & 0xFFFFFFFF
        st[0] = x
        t = ((x ^ (x >> 15)) * (1 | x)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def normal():
        u = 1 - nx(); v = nx()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)
    return normal


def _f20_run(kind, x0, T, seed=20, H=None, tau=0.02, noise=1.0, proc=0.0, push=None, umax=None, sub=1, kgain=1.0):
    """倒立振子の線形でない式（17 章 2 節）を 4 次のルンゲ・クッタ法で解き、1 ms ごとに測って推定し u = −F x̂ を出す（デモ w20_lqg と同じ計算）。
    kind: "ideal"（4 つの状態を誤差なく使う）・"diff"（差分を時定数 tau の一次遅れでならす）・"est"（予測と更新の形でゲイン H）。
    noise: 観測ノイズの倍率、proc: プロセスノイズ（でたらめな加速度）の倍率、push = (開始, 長さ, 力 [N])（おもりを押す）、
    umax: 力の上限、sub: 1 ms を何刻みに分けるか、kgain: 対象が受ける力の倍率（推定は計算した力を使う）。
    乱数は周期ごとに 位置のノイズ・角度のノイズ・台車の加速度・振子の角加速度 の順に引く。返り値 dict(t, x, xh, u, y（測った値）, fell)。"""
    M, m, l, g = _F20_M, _F20_m, _F20_l, _F20_g
    Ts = _F20_TS; h = Ts / sub; nrm = _f20_rng(seed)
    f1, f2, f3, f4 = [float(v) for v in _F20_F[0]]
    Ad, Bd = _F20_AD, _F20_BD[:, 0]
    n = int(round(T / Ts))
    p, pd, ph, phd = [float(v) for v in x0]
    a = tau / (tau + Ts) if tau > 0 else 0.0
    xh = None; yprev = None; vf = [0.0, 0.0]; u = 0.0
    T_, X_, XH_, U_, Y_ = [], [], [], [], []
    fell = None

    def der(p, pd, ph, phd, uu, fd, ap, aal):
        s, c = math.sin(ph), math.cos(ph)
        pdd = (uu + fd - m * g * s * c - fd * c * c + m * l * phd * phd * s) / (M + m * s * s)
        return pd, pdd + ap, phd, (g * s - pdd * c + fd / m * c) / l + aal
    for k in range(n + 1):
        e1 = nrm(); e2 = nrm()
        y0 = p + noise * _F20_SP * e1; y1 = ph + noise * _F20_SPH * e2
        if kind == "ideal":
            xh = [p, pd, ph, phd]
        elif kind == "diff":
            if yprev is None:
                yprev = [y0, y1]
            vf = [a * vf[0] + (1 - a) * (y0 - yprev[0]) / Ts, a * vf[1] + (1 - a) * (y1 - yprev[1]) / Ts]
            yprev = [y0, y1]
            xh = [y0, vf[0], y1, vf[1]]
        else:
            if xh is None:
                xp = _f20_np.array([y0, 0.0, y1, 0.0])
            else:
                xp = Ad @ _f20_np.array(xh) + Bd * u
            r0 = y0 - xp[0]; r1 = y1 - xp[2]
            xh = list(xp + H[:, 0] * r0 + H[:, 1] * r1)
        u = -(f1 * xh[0] + f2 * xh[1] + f3 * xh[2] + f4 * xh[3])
        if umax is not None:
            u = max(-umax, min(umax, u))
        T_.append(k * Ts); X_.append((p, pd, ph, phd)); XH_.append(tuple(xh)); U_.append(u); Y_.append((y0, y1))
        if k == n:
            break
        ap = proc * _F20_SA * nrm(); aal = proc * _F20_SAL * nrm()
        tm = (k + 0.5) * Ts
        fd = push[2] if (push and push[0] <= tm < push[0] + push[1]) else 0.0
        ua = kgain * u
        for _ in range(sub):
            k1 = der(p, pd, ph, phd, ua, fd, ap, aal)
            k2 = der(p + h / 2 * k1[0], pd + h / 2 * k1[1], ph + h / 2 * k1[2], phd + h / 2 * k1[3], ua, fd, ap, aal)
            k3 = der(p + h / 2 * k2[0], pd + h / 2 * k2[1], ph + h / 2 * k2[2], phd + h / 2 * k2[3], ua, fd, ap, aal)
            k4 = der(p + h * k3[0], pd + h * k3[1], ph + h * k3[2], phd + h * k3[3], ua, fd, ap, aal)
            p += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); pd += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
            ph += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]); phd += h / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3])
        if abs(ph) > math.pi / 2:
            fell = (k + 1) * Ts
            break
    return {"t": _f20_np.array(T_), "x": _f20_np.array(X_), "xh": _f20_np.array(XH_), "u": _f20_np.array(U_), "y": _f20_np.array(Y_), "fell": fell}


def _f20_settle(t, y, tol):
    """|y| が tol 以下に入り、その後出ない時刻（最後に出た所を線形補間）。"""
    idx = _f20_np.where(_f20_np.abs(y) > tol)[0]
    if len(idx) == 0:
        return 0.0
    i = idx[-1]
    if i + 1 >= len(t):
        return float("inf")
    a, b = abs(y[i]), abs(y[i + 1])
    return float(t[i] + (t[i + 1] - t[i]) * (a - tol) / (a - b))


def _f20_f(v, d=2):
    """小数 d 桁、負号は −。"""
    s = "%.*f" % (d, v)
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f20_g(v, d=3):
    """有効数字 d 桁、負号は −。"""
    if v == 0:
        return "0"
    e = int(math.floor(math.log10(abs(v))))
    s = "%.*f" % (max(0, d - 1 - e), v)
    return s.replace("-", "−")


def _f20_ground(x0, x1, y):
    o = [W(x0, y, x1, y, c=MUT, lw=1.6)]
    xx = x0 + 6
    while xx < x1:
        o.append(W(xx, y, xx - 7, y + 7, c=FNT, lw=1))
        xx += 12
    return "".join(o)


def _f20_pendcart(cx, gy, phi, L=70, cw=50, ch=20, c=SIG, lw=2.4, bob=7):
    """地面 gy の上の、中心 cx の台車と、角度 phi [rad]（真上から右が正）の振子（18 章の図と同じ見た目）。"""
    y0 = gy - ch - 12
    o = [RECT(cx - cw / 2, y0, cw, ch, 4, soft(c), c, 1.5),
         CIRC(cx - cw * 0.28, y0 + ch + 6, 6, c=c, lw=1.3, fill=SCR), CIRC(cx + cw * 0.28, y0 + ch + 6, 6, c=c, lw=1.3, fill=SCR)]
    bx, by = cx + L * math.sin(phi), y0 - L * math.cos(phi)
    o.append(W(cx, y0, bx, by, c=INK, lw=lw))
    o.append(CIRC(bx, by, bob, c=c, lw=1.5, fill=soft(c)))
    o.append(D(cx, y0, INK, 2.8))
    return "".join(o)


def _f20_box(P):
    return RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8)


def _f20_xmark(P, z, c, r=5.5, lw=2.2):
    x, y = P.X(z.real), P.Y(z.imag)
    return W(x - r, y - r, x + r, y + r, c=c, lw=lw) + W(x - r, y + r, x + r, y - r, c=c, lw=lw)


def _f20_mat(x, y, rows, sz=11, c=INK, gap=12, pad=6):
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


# =====================================================================
# 1 節: 測れる量と、u = −Fx に要る量
# =====================================================================
def _f20_need_fig():
    o = []
    o.append(T(14, 18, "(a) 倒立振子で測る量", "start", 11.5, INK, True))
    gy = 196
    o.append(_f20_ground(30, 300, gy))
    cx, ph = 150, 14 * _F20_D2R
    o.append(_f20_pendcart(cx, gy, ph, L=104, cw=64, ch=24, c=SIG))
    py = gy - 24 - 12
    # 位置の物差し
    for k in range(-3, 4):
        xx = cx + k * 34
        o.append(W(xx, gy + 12, xx, gy + 18, c=TEA, lw=1.1))
    o.append(W(cx - 102, gy + 15, cx + 102, gy + 15, c=TEA, lw=1.1))
    o.append(W(cx, gy + 2, cx, gy + 22, c=TEA, lw=1.8))
    o.append(TX(cx + 8, gy + 34, "p を測る（ノイズ ±1 mm）", "start", 10, TEA, True))
    # 角度のセンサ
    bx, by = cx + 104 * math.sin(ph), py - 104 * math.cos(ph)
    o.append(W(cx, py, cx, py - 70, c=MUT, lw=1, dash="3 3"))
    pts = [(cx + 46 * math.sin(a), py - 46 * math.cos(a)) for a in _f20_np.linspace(0, ph, 20)]
    o.append(PL(pts, c=TEA, lw=1.8))
    o.append(TX(cx + 30, py - 60, "φ を測る（ノイズ ±0.1°）", "start", 10, TEA, True))
    # 測れない速さ
    o.append(ARR(cx - 34, py + 6, cx - 78, py + 6, c=ALI, lw=1.8))
    o.append(TX(cx - 82, py - 2, "\\dot{p}: 測れない", "end", 10, ALI, True))
    arc = [(cx + 118 * math.sin(a), py - 118 * math.cos(a)) for a in _f20_np.linspace(ph - 0.03, ph + 0.30, 16)]
    o.append(PL(arc, c=ALI, lw=1.8))
    o.append(_head(arc[-3][0], arc[-3][1], arc[-1][0], arc[-1][1], ALI, 7))
    o.append(TX(bx + 26, by + 18, "\\dot{φ}: 測れない", "start", 10, ALI, True))
    # (b) 4 つの項
    xb = 352
    o.append(T(xb, 18, "(b) u = −Fx の 4 つの項（19 章 4 節の F）", "start", 11.5, INK, True))
    F = _F20_F[0]
    rows = [("p", F[0], "N/m", True), ("\\dot{p}", F[1], "N/(m/s)", False), ("φ", F[2], "N/rad", True), ("\\dot{φ}", F[3], "N/(rad/s)", False)]
    for i, (nm, f, un, ok) in enumerate(rows):
        y = 50 + i * 27
        c = GRN if ok else ALI
        o.append(TX(xb + 4, y, ("u = " if i == 0 else "  + ") + _f20_g(-f, 4) + " " + un + " ×", "start", 10.5, INK))
        o.append(TX(xb + 168, y, nm, "start", 11.5, c, True))
        s, w = CHIP(xb + 196, y, "測れる" if ok else "測れない", c, 9.5)
        o.append(s)
    o.append(T(xb, 170, "測れるのは 2 つの量だけ:", "start", 10.5, INK, True))
    s1, w1, h1 = _f20_mat(xb, 182, [["y_1"], ["y_2"]], 11)
    o.append(s1)
    o.append(T(xb + w1 + 6, 182 + h1 / 2 + 4, "=", "start", 12, INK))
    s2, w2, h2 = _f20_mat(xb + w1 + 22, 182, [["1", "0", "0", "0"], ["0", "0", "1", "0"]], 11, TEA)
    o.append(s2)
    s3, w3, h3 = _f20_mat(xb + w1 + w2 + 28, 174, [["p"], ["\\dot{p}"], ["φ"], ["\\dot{φ}"]], 9.5)
    o.append(s3)
    xe = xb + w1 + w2 + w3 + 36
    o.append(TX(xe, 182 + h1 / 2 + 4, "+ v", "start", 12, INK))
    o.append(TX(xb, 254, "C: 出力行列（17 章 2 節）　v: 観測ノイズ", "start", 10, MUT))
    return SVG(700, 266, o,
               "倒立振子で、台車の位置 p と振子の角度 φ を 1 ms ごとに測る。19 章 4 節の最適レギュレータは、測れない台車の速度と振子の角速度にもゲインを掛ける。測った値には観測ノイズ v（標準偏差は位置 1 mm、角度 0.1°。例の値）が乗る。")


F["e20_need"] = _f20_need_fig()


# =====================================================================
# 1 節: 差分で作った速度のノイズと、ならしたときの遅れ
# =====================================================================
def _f20_diff_fig():
    o = []
    r = _f20_run("ideal", [0, 0, 10 * _F20_D2R, 0], 1.2, seed=20)
    t, x, y = r["t"], r["x"], r["y"]
    Ts = _F20_TS
    dy = _f20_np.concatenate([[0.0], _f20_np.diff(y[:, 0]) / Ts])

    def filt(tau):
        a = tau / (tau + Ts); v = _f20_np.zeros_like(dy); acc = 0.0
        for i, d in enumerate(dy):
            acc = a * acc + (1 - a) * d; v[i] = acc
        return v
    o.append(T(14, 18, "(a) 差分で作った台車の速度（10° から放したとき）", "start", 11.5, INK, True))
    P1 = Plot(64, 40, 270, 96, (0, 1.2), (-2.2, 2.2))
    o.append(_f20_box(P1))
    o.append(P1.axes(xl=None, yl="\\dot{p} [m/s]", xt=[0, 0.4, 0.8, 1.2], yt=[-2, -1, 0, 1, 2], xfmt=lambda v: "", yfmt=lambda v: _f20_g(v, 1) if v else "0"))
    o.append(P1.clip(list(zip(t, dy)), c=ALI, lw=0.6))
    o.append(P1.line(list(zip(t, x[:, 1])), c=SIG, lw=2.2))
    o.append(T(P1.X(1.18), P1.y + 13, "差分のまま（ノイズ 1.41 m/s）", "end", 9.5, ALI, True, halo=True))
    P2 = Plot(64, 160, 270, 96, (0, 1.2), (-0.4, 0.6))
    o.append(_f20_box(P2))
    o.append(P2.axes(xl="時間 t [s]", yl="\\dot{p} [m/s]", xt=[0, 0.4, 0.8, 1.2], yt=[-0.4, -0.2, 0, 0.2, 0.4, 0.6], xfmt=lambda v: "%g" % v, yfmt=lambda v: _f20_g(v, 1) if v else "0"))
    o.append(P2.clip(list(zip(t, filt(0.1))), c=PUR, lw=1.8, dash="6 3"))
    o.append(P2.clip(list(zip(t, filt(0.02))), c=TEA, lw=1.4))
    o.append(P2.clip(list(zip(t, x[:, 1])), c=SIG, lw=2.2))
    o.append(LEGL(64, 306, [(SIG, None, "本当の速度"), (TEA, None, "20 ms でならす"), (PUR, "6 3", "100 ms")], 9.5, 12))
    # (b) 釣り合い
    o.append(T(378, 18, "(b) ならす時定数と、力のノイズ・閉ループの減衰比", "start", 11.5, INK, True))
    taus = _f20_np.logspace(math.log10(0.002), math.log10(0.3), 40)
    fs = [_f20_diff_force_std(tt) for tt in taus]
    zs = [_f20_diff_zeta(tt) for tt in taus]
    Pa = Plot(420, 40, 230, 216, (2, 300), (0.05, 10), xlog=True, ylog=True)
    o.append(_f20_box(Pa))
    o.append(Pa.axes(xl="ならす一次遅れの時定数 [ms]", yl="力のノイズの標準偏差 [N]", xt=[2, 10, 100, 300], yt=[0.1, 1, 10], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(Pa.clip([(tt * 1000, f) for tt, f in zip(taus, fs)], c=GLD, lw=2.2))
    Pz = Plot(420, 40, 230, 216, (2, 300), (0, 1.0), xlog=True)
    for v in (0, 0.25, 0.5, 0.75, 1.0):
        o.append(W(Pz.x + Pz.w, Pz.Y(v), Pz.x + Pz.w + 4, Pz.Y(v), c=MUT, lw=1))
        o.append(T(Pz.x + Pz.w + 7, Pz.Y(v) + 3.3, "%g" % v, "start", 9.5, GRN))
    o.append(TX(Pz.x + Pz.w + 40, Pz.y + Pz.h / 2, "減衰比の最も小さい値", "middle", 10, GRN, rot=90))
    o.append(Pz.clip([(tt * 1000, z) for tt, z in zip(taus, zs)], c=GRN, lw=2.2, dash="6 3"))
    for tt in (0.02, 0.1):
        f, z = _f20_diff_force_std(tt), _f20_diff_zeta(tt)
        o.append(D(Pa.X(tt * 1000), Pa.Y(f), GLD, 3.6)); o.append(D(Pz.X(tt * 1000), Pz.Y(z), GRN, 3.6))
        o.append(T(Pa.X(tt * 1000) + 5, Pa.Y(f) - 7, "%s N" % _f20_g(f, 2), "start", 9.5, GLD, True, halo=True))
        o.append(T(Pz.X(tt * 1000) - 5, Pz.Y(z) - 7, "ζ = %s" % _f20_g(z, 2), "end", 9.5, GRN, True, halo=True))
    o.append(T(Pa.x + 6, Pa.y + 14, "金: 力のノイズ（左の目盛）", "start", 9.5, GLD, halo=True))
    o.append(T(Pa.x + 6, Pa.y + 28, "緑の破線: 減衰比（右の目盛）", "start", 9.5, GRN, halo=True))
    return SVG(700, 316, o,
               "(a) 台車の位置を 1 ms ごとに標準偏差 1 mm のノイズで測り、差分から速度を作る。差分のままではノイズが本当の速度より大きい。一次遅れでならすとノイズは減るが、時定数だけ遅れる。(b) ならした速度と角速度で 19 章の F を使い、立てたまま測定のノイズだけを加えたとき。時定数を長くすると力のノイズは減るが、閉ループの極の減衰比が下がり、揺れやすくなる（線形化した式で、1 ms ごとの計算をそのまま入れて求めた）。")


F["e20_diff"] = _f20_diff_fig()


# =====================================================================
# 2 節: 出力が同じになる 2 つの初めの状態
# =====================================================================
def _f20_unobs_fig():
    o = []
    ts = _f20_np.linspace(0, 1000, 201)
    sm, df = _f20_np.exp(-0.002 * ts), _f20_np.exp(-0.004 * ts)
    a1, a2 = 25 + 5 * sm + 5 * df, 25 + 5 * sm - 5 * df        # 35 °C と 25 °C から
    b1 = 25 + 5 * sm                                          # 30 °C と 30 °C から
    specs = [("(a) 2 枚の板の平均を測る", 64, True), ("(b) 板 1 だけを測る", 420, False)]
    for title, x0, avg in specs:
        o.append(T(x0 - 50, 18, title, "start", 11.5, INK, True))
        P = Plot(x0, 36, 240, 112, (0, 1000), (24, 36))
        o.append(_f20_box(P))
        o.append(P.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 250, 500, 750, 1000], yt=[25, 30, 35], xfmt=lambda v: "%g" % v))
        o.append(P.line(list(zip(ts, a1)), c=MUT, lw=1.2)); o.append(P.line(list(zip(ts, a2)), c=MUT, lw=1.2))
        o.append(P.line(list(zip(ts, b1)), c=MUT, lw=1.2, dash="5 3"))
        if avg:
            o.append(P.line(list(zip(ts, (a1 + a2) / 2)), c=TEA, lw=3.2))
            o.append(P.line(list(zip(ts, b1)), c=SIG, lw=1.6, dash="6 4"))
            o.append(T(P.X(980), P.Y(30.6), "出力（平均）はどちらも同じ", "end", 9.5, TEA, True, halo=True))
        else:
            o.append(P.line(list(zip(ts, a1)), c=TEA, lw=2.6))
            o.append(P.line(list(zip(ts, b1)), c=SIG, lw=2.0, dash="6 4"))
            o.append(T(P.X(980), P.Y(33.0), "出力（板 1）が違う", "end", 9.5, TEA, True, halo=True))
    o.append(LEGL(30, 196, [(MUT, None, "板 1・板 2（35 °C・25 °C から）"), (MUT, "5 3", "板 1 = 板 2（30 °C から）"), (TEA, None, "その出力"), (SIG, "6 4", "その出力")], 9.5, 10))
    # (c) (d) 倒立振子
    tp = _f20_np.linspace(0, 0.5, 201)
    A, B = _F20_A, _F20_B

    def free(x0):
        return _f20_np.array([_f20_la.expm(A * tt) @ _f20_np.array(x0) for tt in tp])
    xa = free([0, 0, 1 * _F20_D2R, 0]); xb = free([0.1, 0.2, 1 * _F20_D2R, 0]); xc = free([0, 0, 0, 0])
    xd = free([0, 0, 1 * _F20_D2R, 0])
    y0 = 232
    o.append(T(14, y0, "(c) 振子の角度だけを測る（力 0 で放す）", "start", 11.5, INK, True))
    P = Plot(64, y0 + 18, 240, 112, (0, 0.5), (0, 16))
    o.append(_f20_box(P))
    o.append(P.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 0.25, 0.5], yt=[0, 5, 10, 15], xfmt=lambda v: "%g" % v))
    o.append(P.line(list(zip(tp, xa[:, 2] / _F20_D2R)), c=TEA, lw=3.2))
    o.append(P.line(list(zip(tp, xb[:, 2] / _F20_D2R)), c=SIG, lw=1.6, dash="6 4"))
    o.append(T(P.X(0.02), P.Y(14), "台車が 0 で止まっていても、", "start", 9.5, TEA, True, halo=True))
    o.append(T(P.X(0.02), P.Y(14) + 14, "10 cm の所を 20 cm/s で動いていても", "start", 9.5, TEA, True, halo=True))
    o.append(T(P.X(0.02), P.Y(14) + 28, "角度は同じ（台車の状態が分からない）", "start", 9.5, TEA, True, halo=True))
    o.append(T(420 - 50, y0, "(d) 台車の位置だけを測る（力 0 で放す）", "start", 11.5, INK, True))
    P = Plot(420, y0 + 18, 240, 112, (0, 0.5), (-4, 1))
    o.append(_f20_box(P))
    o.append(P.axes(xl="時間 t [s]", yl="台車の位置 p [cm]", xt=[0, 0.25, 0.5], yt=[-4, -2, 0], xfmt=lambda v: "%g" % v))
    o.append(P.line(list(zip(tp, xc[:, 0] * 100)), c=SIG, lw=1.6, dash="6 4"))
    o.append(P.line(list(zip(tp, xd[:, 0] * 100)), c=TEA, lw=2.6))
    o.append(T(P.X(0.02), P.Y(-3.2), "傾き 1° から: 台車は左へ動き出す", "start", 9.5, TEA, True, halo=True))
    o.append(T(P.X(0.48), P.Y(0.45), "傾き 0° から: 動かない（破線）", "end", 9.5, SIG, True, halo=True))
    return SVG(700, y0 + 18 + 112 + 44, o,
               "出力が同じなら、初めの状態の違いは見分けられない。(a) 2 枚の板（18 章 2 節）で、平均が同じで差の違う 2 つの状態から冷えると、2 枚の平均の温度はまったく同じ曲線になる。(b) 板 1 だけを測ると違いが見える。(c) 倒立振子の角度の動きは、台車の位置と速度によらない。(d) 台車の位置には、振子の傾きが加速度として現れる（線形化した式）。")


F["e20_unobs"] = _f20_unobs_fig()


# =====================================================================
# 2 節: 可観測性行列
# =====================================================================
def _f20_obsv_fig():
    o = []
    o.append(T(14, 18, "(a) 出力とその微分を並べると 𝒪x(0)", "start", 11.5, INK, True))
    rows = [("y(0)", "C"), ("\\dot{y}(0)", "CA"), ("\\ddot{y}(0)", "CA^2"), ("⋮", "⋮"), ("y^{(n−1)}(0)", "CA^{n−1}")]
    s1, w1, h1 = _f20_mat(24, 40, [[r[0]] for r in rows], 11.5, TEA)
    o.append(s1)
    o.append(T(24 + w1 + 10, 40 + h1 / 2 + 4, "=", "start", 13, INK))
    s2, w2, h2 = _f20_mat(24 + w1 + 30, 40, [[r[1]] for r in rows], 11.5, SIG)
    o.append(s2)
    o.append(TX(24 + w1 + 36 + w2, 40 + h1 / 2 + 4, "x(0)", "start", 12, INK))
    o.append(TX(24 + w1 + 30 + w2 / 2, 40 + h2 + 18, "可観測性行列 𝒪", "middle", 10.5, SIG, True))
    xs = 24 + w1 + 30 + w2 + 60
    for i, l in enumerate(["入力が 0 のとき y = Cx、", "微分するたびに A が掛かる",
                           "（\\dot{x} = Ax だから）", "",
                           "𝒪 の階数が n なら、", "x(0) がただ 1 つに決まる"]):
        if l:
            o.append(TX(xs, 58 + i * 17, l, "start", 10, INK if i < 3 else SIG, i >= 4))
    o.append(T(24, 214, "階数が n より小さいと、𝒪x₀ = 0 の x₀ ≠ 0 があり、", "start", 10, ALI))
    o.append(T(24, 231, "x₀ から放しても 0 から放しても出力は同じ 0", "start", 10, ALI))
    # (b) 表
    xb = 372
    o.append(T(xb, 18, "(b) 測る量と、𝒪 の階数", "start", 11.5, INK, True))
    A2 = _f20_np.array([[-0.003, 0.001], [0.001, -0.003]])
    Ah = _f20_np.array([[0.0, 1.0], [2.0, -1.0]])
    cases = [("倒立振子", "p と φ", _F20_A, _F20_C, "可観測"),
             ("倒立振子", "p だけ", _F20_A, _f20_np.array([[1.0, 0, 0, 0]]), "可観測"),
             ("倒立振子", "φ だけ", _F20_A, _f20_np.array([[0, 0, 1.0, 0]]), "p・\\dot{p} が分からない"),
             ("倒立振子", "\\dot{p} だけ", _F20_A, _f20_np.array([[0, 1.0, 0, 0]]), "p のずれが分からない"),
             ("2 枚の板", "板 1", A2, _f20_np.array([[1.0, 0]]), "可観測"),
             ("2 枚の板", "平均", A2, _f20_np.array([[0.5, 0.5]]), "差が分からない"),
             ("17 章 4 節の例", "−x_1 + x_2", Ah, _f20_np.array([[-1.0, 1.0]]), "増えるモードが分からない")]
    hy = 44
    for x, h in ((xb, "対象"), (xb + 92, "測る量"), (xb + 152, "階数"), (xb + 196, "判定")):
        o.append(T(x, hy, h, "start", 10, MUT, True))
    o.append(W(xb, hy + 6, xb + 320, hy + 6, c=LIN, lw=1))
    for i, (obj, meas, A, C, verdict) in enumerate(cases):
        y = hy + 26 + i * 25
        n = A.shape[0]
        O = _f20_np.vstack([C @ _f20_np.linalg.matrix_power(A, k) for k in range(n)])
        rk = _f20_np.linalg.matrix_rank(O)
        ok = rk == n
        o.append(T(xb, y, obj, "start", 10, INK))
        o.append(TX(xb + 92, y, meas, "start", 10.5, TEA, True))
        o.append(T(xb + 152, y, "%d / %d" % (rk, n), "start", 10.5, GRN if ok else ALI, True))
        o.append(TX(xb + 196, y, verdict, "start", 10, GRN if ok else ALI, True))
    return SVG(700, 246, o,
               "(a) 入力を 0 とすると、出力とその微分を t = 0 で並べたものは 𝒪x(0) である。𝒪 の階数が状態変数の数 n なら初めの状態が決まり、n より小さければ、出力に現れない初めの状態がある。(b) 測る量を変えたときの階数（数値で計算した値）。倒立振子は、台車の位置だけでも可観測だが、角度だけでは台車の状態が分からない。")


F["e20_obsv"] = _f20_obsv_fig()


# =====================================================================
# 3 節: オブザーバのブロック線図
# =====================================================================
def _f20_obs_bd_fig():
    o = []
    yp, yo = 74, 222
    R = 15
    # 枠（実物とマイコンの中）
    o.append(RECT(52, yp - 46, 420, 110, 8, "none", MUT, 1.0, "5 4"))
    o.append(T(60, yp - 32, "制御対象（実物）", "start", 10, MUT, True))
    o.append(RECT(52, yo - 70, 574, 162, 8, "none", SIG, 1.2, "5 4"))
    o.append(T(618, yo + 84, "オブザーバ（マイコンの中の計算）", "end", 10, SIG, True))
    # ---- 制御対象の段 ----
    xu = 70
    o.append(ARR(16, yp, 96, yp, c=GLD, lw=1.6)); o.append(TX(30, yp - 8, "u", "middle", 11, GLD, True))
    o.append(D(xu, yp, GLD, 3.6))
    s, wB = TFBOX(96, yp, "B"); o.append(s)
    xs1 = 96 + wB + 30 + R
    o.append(ARR(96 + wB, yp, xs1 - R, yp, c=INK, lw=1.6))
    o.append(SUMJ(xs1, yp, {"l": "+", "b": "+"}))
    xi = xs1 + R + 36
    o.append(ARR(xs1 + R, yp, xi, yp, c=INK, lw=1.6)); o.append(TX((xs1 + R + xi) / 2, yp - 8, "\\dot{x}", "middle", 10, INK, True, halo=True))
    s, wI = TFBOX(xi, yp, ("1", "s"), c=LIN); o.append(s)
    xt = xi + wI + 34
    o.append(W(xi + wI, yp, xt, yp, c=INK, lw=1.6)); o.append(TX(xi + wI + 17, yp - 8, "x", "middle", 11, INK, True, halo=True))
    o.append(D(xt, yp, INK, 3.6))
    xc = xt + 28
    o.append(ARR(xt, yp, xc, yp, c=INK, lw=1.6))
    s, wC = TFBOX(xc, yp, "C"); o.append(s)
    xsv = xc + wC + 30 + R
    o.append(ARR(xc + wC, yp, xsv - R, yp, c=INK, lw=1.6))
    o.append(SUMJ(xsv, yp, {"l": "+", "t": "+"}))
    o.append(ARR(xsv, yp - 46, xsv, yp - R, c=TEA, lw=1.6)); o.append(TX(xsv + 8, yp - 34, "v", "start", 11, TEA, True))
    xy = 560
    o.append(ARR(xsv + R, yp, 680, yp, c=SIG, lw=1.8)); o.append(TX(660, yp - 8, "y", "middle", 11, SIG, True))
    o.append(D(xy, yp, SIG, 3.6))
    # A の戻り（制御対象）
    yb = yp + 40
    s, wA = TFBOX(xi + wI / 2 - 20, yb, "A", w=40, h=26); o.append(s)
    o.append(W(xt, yp, xt, yb, xi + wI / 2 + 20 + 6, yb, c=INK, lw=1.5)); o.append(_head(xt, yb, xi + wI / 2 + 20, yb, INK, 6))
    o.append(W(xi + wI / 2 - 20, yb, xs1, yb, c=INK, lw=1.5)); o.append(ARR(xs1, yb, xs1, yp + R, c=INK, lw=1.5, head=6))
    # ---- オブザーバの段 ----
    o.append(W(xu, yp, xu, yo, c=GLD, lw=1.5)); o.append(ARR(xu, yo, 96, yo, c=GLD, lw=1.5))
    s, _ = TFBOX(96, yo, "B"); o.append(s)
    o.append(ARR(96 + wB, yo, xs1 - R, yo, c=MUT, lw=1.6))
    o.append(SUMJ(xs1, yo, {"l": "+", "t": "+", "b": "+"}))
    o.append(ARR(xs1 + R, yo, xi, yo, c=MUT, lw=1.6))
    s, _ = TFBOX(xi, yo, ("1", "s"), c=LIN); o.append(s)
    o.append(W(xi + wI, yo, xt, yo, c=SIG, lw=1.8)); o.append(TX(xi + wI + 17, yo - 9, "x̂", "middle", 11, SIG, True, halo=True))
    o.append(D(xt, yo, SIG, 3.6))
    o.append(ARR(xt, yo, xc, yo, c=SIG, lw=1.6))
    s, _ = TFBOX(xc, yo, "C"); o.append(s)
    xs3 = xy
    o.append(ARR(xc + wC, yo, xs3 - R, yo, c=MUT, lw=1.6)); o.append(TX((xc + wC + xs3 - R) / 2, yo - 8, "Cx̂", "middle", 10, MUT, True, halo=True))
    o.append(SUMJ(xs3, yo, {"l": "−", "t": "+"}))
    o.append(ARR(xy, yp, xy, yo - R, c=SIG, lw=1.5))
    # x̂ を外へ
    o.append(ARR(xt, yo, xt, yo + 92, c=SIG, lw=1.4, head=6)); o.append(TX(xt + 6, yo + 104, "x̂ を u = −Fx̂ に使う（4 節）", "start", 9.5, SIG, True))
    # A の戻り（オブザーバ。上を通る）
    ya = yo - 40
    s, _ = TFBOX(xi + wI / 2 - 20, ya, "A", w=40, h=26); o.append(s)
    o.append(W(xt, yo, xt, ya, xi + wI / 2 + 20 + 6, ya, c=MUT, lw=1.5)); o.append(_head(xt, ya, xi + wI / 2 + 20, ya, MUT, 6))
    o.append(W(xi + wI / 2 - 20, ya, xs1, ya, c=MUT, lw=1.5)); o.append(ARR(xs1, ya, xs1, yo - R, c=MUT, lw=1.5, head=6))
    # H の道（下を通る）
    yh = yo + 50
    xhm = (xs1 + xs3) / 2 + 30
    s, wH = TFBOX(xhm - 20, yh, "H", w=40, h=28, c=SIG, fill=SSOFT); o.append(s)
    o.append(W(xs3, yo + R, xs3, yh, xhm + 20 + 6, yh, c=SIG, lw=1.6)); o.append(_head(xs3, yh, xhm + 20, yh, SIG, 6))
    o.append(TX(xs3 + 6, yh - 8, "y − Cx̂", "start", 10, SIG, True, halo=True))
    o.append(W(xhm - 20, yh, xs1, yh, c=SIG, lw=1.6)); o.append(ARR(xs1, yh, xs1, yo + R, c=SIG, lw=1.6, head=6))
    o.append(TX(xs1 + 8, yh - 8, "H(y − Cx̂)", "start", 10, SIG, True, halo=True))
    return SVG(700, yo + 112, o,
               "オブザーバのブロック線図。上の段が制御対象、下の段がマイコンの中で計算するオブザーバで、同じ A・B・C のモデルに同じ入力 u を入れる。測った出力 y と、推定した状態から計算した出力 Cx̂ の差に、オブザーバゲイン H を掛けて、推定の式に足す。")


F["e20_obs_bd"] = _f20_obs_bd_fig()


# =====================================================================
# 3 節: モデルを並べただけの推定と、オブザーバの推定誤差
# =====================================================================
def _f20_cart_H(wo):
    """台車とばね・ダンパ（位置を測る）で、オブザーバの 2 つの極を −wo に置く H。"""
    return _f20_np.array([[2 * wo - 2.0], [wo * wo - 4 * wo - 21.0]])


def _f20_obs_err_fig():
    o = []
    C1 = _f20_np.array([[1.0, 0.0]])
    t = _f20_np.linspace(0, 4, 801)
    H1 = _f20_cart_H(20)
    ec = _f20_np.array([(_f20_la.expm(_F20_ACART * tt) @ _f20_np.array([0.1, 0]))[0] for tt in t])
    eo = _f20_np.array([(_f20_la.expm((_F20_ACART - H1 @ C1) * tt) @ _f20_np.array([0.1, 0]))[0] for tt in t])
    o.append(T(14, 18, "(a) 台車とばね・ダンパ（位置を測る）", "start", 11.5, INK, True))
    P = Plot(64, 36, 260, 120, (0, 4), (-8, 11))
    o.append(_f20_box(P))
    o.append(P.axes(xl="時間 t [s]", yl="位置の推定誤差 [cm]", xt=[0, 1, 2, 3, 4], yt=[-5, 0, 5, 10], xfmt=lambda v: "%g" % v))
    o.append(P.line(list(zip(t, ec * 100)), c=ALI, lw=1.8))
    o.append(P.line(list(zip(t, eo * 100)), c=SIG, lw=2.4))
    o.append(T(P.X(1.25), P.Y(6.6), "モデルを並べただけ（H = 0）", "start", 9.5, ALI, True, halo=True))
    o.append(T(P.X(1.25), P.Y(6.6) + 14, "対象の固有値 −1 ± j4.90 で減る", "start", 9.5, ALI, halo=True))
    o.append(T(P.X(0.32), P.Y(-6), "オブザーバ（極 −20、−20）: 0.26 s で 2 mm 以内", "start", 9.5, SIG, True, halo=True))
    # (b) 振子
    Hp = _f20_np.array([[40.0], [445.78]])
    tp = _f20_np.linspace(0, 0.5, 251)
    pc = _f20_np.array([(_f20_la.expm(_F20_APH * tt) @ _f20_np.array([1.0, 0]))[0] for tt in tp])
    po = _f20_np.array([(_f20_la.expm((_F20_APH - Hp @ C1) * tt) @ _f20_np.array([1.0, 0]))[0] for tt in tp])
    o.append(T(380, 18, "(b) 振子の角度と角速度（角度を測る）", "start", 11.5, INK, True))
    Q = Plot(420, 36, 250, 120, (0, 0.5), (-1, 16))
    o.append(_f20_box(Q))
    o.append(Q.axes(xl="時間 t [s]", yl="角度の推定誤差 [°]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yt=[0, 5, 10, 15], xfmt=lambda v: "%g" % v))
    o.append(Q.clip(list(zip(tp, pc)), c=ALI, lw=1.8))
    o.append(Q.line(list(zip(tp, po)), c=SIG, lw=2.4))
    o.append(T(Q.X(0.03), Q.Y(13.5), "H = 0: 固有値 +6.77 で増える", "start", 9.5, ALI, True, halo=True))
    o.append(T(Q.X(0.03), Q.Y(13.5) + 14, "（0.5 s で 14.7 倍）", "start", 9.5, ALI, halo=True))
    o.append(T(Q.X(0.12), Q.Y(3.2), "オブザーバ（極 −20、−20）", "start", 9.5, SIG, True, halo=True))
    # s 平面
    for k, (A, H, tl) in enumerate(((_F20_ACART, H1, "台車"), (_F20_APH, Hp, "振子"))):
        x0 = 64 if k == 0 else 420
        S_ = Plot(x0, 212, 250 if k else 260, 70, (-24, 8), (-6, 6))
        o.append(_f20_box(S_)); o.append(SPLANE(S_))
        o.append(S_.axes(xl="実部 [1/s]", xt=[-20, -10, 0], yt=[-5, 0, 5], grid=False, sz=9))
        for z in _f20_np.linalg.eigvals(A):
            o.append(_f20_xmark(S_, complex(z), ALI, 4.5, 1.8))
        o.append(_f20_xmark(S_, complex(-20, 0), SIG, 5.5, 2.4))
        o.append(T(S_.X(-20), S_.Y(0) - 9, "−20（2 つ）", "middle", 9, SIG, True, halo=True))
        o.append(T(x0, 204, "%s: 赤 × は A の固有値、青 × は A − HC の固有値" % tl, "start", 9.5, MUT))
    return SVG(700, 320, o,
               "推定を 0 から始めたときの推定誤差。(a) 台車とばね・ダンパを 10 cm ずらして放す。モデルを並べただけでは、誤差は対象そのものの速さでしか減らない。(b) 振子では、モデルを並べただけの誤差は増えていく。測った出力との差で直すオブザーバ（H = [38, 299]ᵀ と [40, 445.78]ᵀ）では、どちらも誤差の固有値 −20 の速さで 0 に近づく。")


F["e20_obs_err"] = _f20_obs_err_fig()


# =====================================================================
# 3 節: オブザーバの極の速さ — ノイズと、モデルに無い力
# =====================================================================
def _f20_cart_noise(wo, sig=0.001, Ts=0.001):
    """観測ノイズ（Ts ごとに新しい値、標準偏差 sig）による、推定した位置と速度の標準偏差。"""
    H = _f20_cart_H(wo)
    Ae = _F20_ACART - H @ _f20_np.array([[1.0, 0.0]])
    Ph, Gm = _f20_c2d(Ae, H, Ts)
    S = _f20_la.solve_discrete_lyapunov(Ph, Gm @ Gm.T * sig * sig)
    return _f20_np.sqrt(_f20_np.diag(S))


def _f20_cart_push_err(wo, d=0.5, t0=0.5, t1=1.0, T_=3.0, h=0.001):
    """モデルに無い力 d [N] で台車を t0〜t1 の間押したときの、速度の推定誤差の最大値 [m/s]（推定誤差の式を厳密に離散化）。"""
    H = _f20_cart_H(wo)
    Ae = _F20_ACART - H @ _f20_np.array([[1.0, 0.0]])
    Ph, Gm = _f20_c2d(Ae, _F20_BCART, h)
    e = _f20_np.zeros(2); mx = 0.0
    for k in range(int(round(T_ / h))):
        tm = (k + 0.5) * h
        e = Ph @ e + Gm[:, 0] * (d if t0 <= tm < t1 else 0.0)
        mx = max(mx, abs(e[1]))
    return mx


def _f20_obs_trade_fig():
    o = []
    ws = _f20_np.logspace(math.log10(5), 2, 30)
    nz = [_f20_cart_noise(w)[1] * 1000 for w in ws]
    pe = [_f20_cart_push_err(w) * 1000 for w in ws]
    P = Plot(74, 24, 380, 240, (5, 100), (0.1, 1000), xlog=True, ylog=True)
    o.append(_f20_box(P))
    o.append(P.axes(xl="オブザーバの極の速さ ω_o [rad/s]（2 つの極を −ω_o に置く）", yl="速度の推定誤差 [mm/s]", xt=[5, 10, 20, 50, 100], yt=[0.1, 1, 10, 100, 1000], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(P.line(list(zip(ws, nz)), c=TEA, lw=2.4))
    o.append(P.line(list(zip(ws, pe)), c=PUR, lw=2.4))
    o.append(W(P.x, P.Y(1414), P.x + P.w, P.Y(1414), c=ALI, lw=1.2, dash="5 3"))
    for w in (10, 20, 40, 80):
        a, b = _f20_cart_noise(w)[1] * 1000, _f20_cart_push_err(w) * 1000
        o.append(D(P.X(w), P.Y(a), TEA, 3.6)); o.append(D(P.X(w), P.Y(b), PUR, 3.6))
        o.append(T(P.X(w) + 4, P.Y(a) + 14, _f20_g(a, 3), "start", 9, TEA, True, halo=True))
        o.append(T(P.X(w) + 4, P.Y(b) - 6, _f20_g(b, 3), "start", 9, PUR, True, halo=True))
    o.append(T(P.X(98), P.Y(1414) + 13, "1 節の差分（1 ms）: 1414 mm/s", "end", 9.5, ALI, True, halo=True))
    o.append(T(P.X(98), P.Y(55), "モデルに無い力（0.5 N で 0.5 s 押す）", "end", 9.5, PUR, True, halo=True))
    o.append(T(P.X(98), P.Y(55) + 14, "による最大のずれ", "end", 9.5, PUR, True, halo=True))
    o.append(T(P.X(98), P.Y(0.16), "観測ノイズ（1 mm）によるばらつき", "end", 9.5, TEA, True, halo=True))
    o.append(T(P.X(98), P.Y(0.16) + 14, "（標準偏差）", "end", 9.5, TEA, True, halo=True))
    xr = 484
    for i, l in enumerate(["極を速くする（H を大きくする）と", "・推定誤差は速く 0 に近づき、", "  モデルに無い力にもすぐ追いつく", "・測定のノイズを推定に多く通す", "",
                           "極を遅くすると、その逆", "",
                           "どこで釣り合わせるかは、", "ノイズと乱れの大きさで決まる", "（5 節のカルマンフィルタ）"]):
        if l:
            o.append(T(xr, 48 + i * 18, l, "start", 10, INK if i not in (7, 8, 9) else SIG, i in (0, 5)))
    return SVG(700, 300, o,
               "台車とばね・ダンパの位置を測るオブザーバで、2 つの極を置く位置（極の速さ）を変えたときの、速度の推定誤差。観測ノイズ（1 ms ごとに新しい値、標準偏差 1 mm）によるばらつきは極を速くするほど増え、オブザーバの知らない力で押されたときのずれは極を速くするほど減る。どの ω_o でも、1 節の差分よりずっと小さい。")


F["e20_obs_trade"] = _f20_obs_trade_fig()


# =====================================================================
# 4 節: 推定した状態でフィードバックする閉ループ
# =====================================================================
def _f20_sep_bd_fig():
    o = []
    o.append(T(14, 18, "(a) 推定した状態でフィードバックする", "start", 11.5, INK, True))
    # 制御対象
    o.append(RECT(160, 36, 190, 50, 8, PAN, LIN, 1.4))
    o.append(T(255, 56, "制御対象", "middle", 11, INK, True))
    o.append(TX(255, 75, "\\dot{x} = Ax + Bu", "middle", 10.5, INK))
    # オブザーバ
    o.append(RECT(160, 122, 190, 64, 8, SSOFT, SIG, 1.6))
    o.append(T(255, 144, "オブザーバ", "middle", 11, SIG, True))
    o.append(TX(255, 162, "A − HC の速さで", "middle", 10, INK))
    o.append(TX(255, 177, "x̂ が x に近づく", "middle", 10, INK))
    # y
    o.append(W(350, 61, 400, 61, 400, 154, 356, 154, c=SIG, lw=1.7)); o.append(_head(400, 154, 350, 154, SIG, 7))
    o.append(TX(405, 108, "y = Cx + v", "start", 10.5, SIG, True))
    # −F
    o.append(RECT(46, 156, 64, 32, 6, PAN, GLD, 1.6)); o.append(TX(78, 177, "−F", "middle", 12, GLD, True))
    o.append(ARR(160, 172, 110, 172, c=SIG, lw=1.6)); o.append(TX(136, 166, "x̂", "middle", 11, SIG, True, halo=True))
    o.append(W(78, 156, 78, 61, 154, 61, c=GLD, lw=1.7)); o.append(_head(78, 61, 160, 61, GLD, 7))
    o.append(TX(96, 54, "u = −Fx̂", "start", 10.5, GLD, True))
    o.append(D(128, 61, GLD, 3.4)); o.append(W(128, 61, 128, 138, c=GLD, lw=1.5)); o.append(ARR(128, 138, 160, 138, c=GLD, lw=1.5, head=6))
    o.append(T(14, 214, "F は 18・19 章で、H は 3 節で、別々に決める", "start", 10, MUT))
    # (b) 行列
    xb = 450
    o.append(T(xb - 20, 18, "(b) x と推定誤差 ε で書いた閉ループ", "start", 11.5, INK, True))
    o.append(TX(xb - 10, 74, "d/dt", "start", 11, INK))
    s1, w1, h1 = _f20_mat(xb + 24, 50, [["x"], ["ε"]], 11.5)
    o.append(s1)
    o.append(T(xb + 30 + w1, 74, "=", "start", 12, INK))
    s2, w2, h2 = _f20_mat(xb + 46 + w1, 50, [[("A − BF", SIG), ("BF", MUT)], [("0", GRN), ("A − HC", TEA)]], 11.5)
    o.append(s2)
    s3, w3, h3 = _f20_mat(xb + 54 + w1 + w2, 50, [["x"], ["ε"]], 11.5)
    o.append(s3)
    o.append(T(xb - 10, 124, "左下のかたまりが 0", "start", 10.5, GRN, True))
    o.append(T(xb - 10, 144, "→ 閉ループの固有値は", "start", 10.5, INK))
    o.append(TX(xb - 10, 163, "A − BF の固有値（制御の極）と", "start", 10.5, SIG, True))
    o.append(TX(xb - 10, 182, "A − HC の固有値（推定の極）を合わせたもの", "start", 10.5, TEA, True))
    o.append(TX(xb - 10, 206, "ε = x − x̂ は u によらず \\dot{ε} = (A − HC)ε", "start", 10, MUT))
    return SVG(700, 226, o,
               "推定した状態でフィードバックする制御系。(a) オブザーバは測った出力 y と、自分が出した入力 u から x̂ を作り、u = −Fx̂ を出す。(b) 状態を x と推定誤差 ε の組にとると、閉ループの行列は左下が 0 のかたまりの形になり、固有値は A − BF の固有値と A − HC の固有値に分かれる（分離定理）。")


F["e20_sep_bd"] = _f20_sep_bd_fig()


def _f20_sep_sim(T_=2.0, n=801, xh0=(0.0, 0.0), wo=20, F=None):
    """台車とばね・ダンパに u = −Fx̂ とオブザーバ（極 −wo × 2）を組み合わせた閉ループ（x(0) = [0.1, 0]）。返り値 t, x, x̂, u。"""
    F = _F20_FCART if F is None else F
    A, B, C = _F20_ACART, _F20_BCART, _f20_np.array([[1.0, 0.0]])
    H = _f20_cart_H(wo) if wo else _f20_np.zeros((2, 1))
    Acl = _f20_np.block([[A, -B @ F], [H @ C, A - B @ F - H @ C]])
    t = _f20_np.linspace(0, T_, n); z0 = _f20_np.array([0.1, 0.0, xh0[0], xh0[1]])
    E = _f20_la.expm(Acl * (t[1] - t[0])); Z = [z0]
    for _ in range(n - 1):
        Z.append(E @ Z[-1])
    Z = _f20_np.array(Z)
    return t, Z[:, :2], Z[:, 2:], -(Z[:, 2:] @ F.T)[:, 0]


def _f20_sep_resp_fig():
    o = []
    # (a) 極
    o.append(T(14, 18, "(a) 閉ループの極", "start", 11.5, INK, True))
    P = Plot(52, 36, 200, 170, (-24, 4), (-9, 9))
    o.append(_f20_box(P)); o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-20, -10, 0], yt=[-5, 0, 5], grid=False, sz=9))
    for z in _f20_np.linalg.eigvals(_F20_ACART):
        o.append(_f20_xmark(P, complex(z), MUT, 4.5, 1.8))
    for z in (complex(-5, 5), complex(-5, -5)):
        o.append(_f20_xmark(P, z, SIG, 6, 2.6))
    o.append(_f20_xmark(P, complex(-20, 0), TEA, 6, 2.6))
    o.append(T(P.X(-5) + 9, P.Y(5) - 7, "−5 ± j5（A − BF）", "start", 9.5, SIG, True, halo=True))
    o.append(T(P.X(-20), P.Y(0) + 20, "−20 × 2（A − HC）", "middle", 9.5, TEA, True, halo=True))
    o.append(T(P.X(-1) - 6, P.Y(-4.9) + 16, "対象 −1 ± j4.90", "end", 9, MUT, halo=True))
    # (b) 位置 (c) 力
    t, x, xh, u = _f20_sep_sim()
    t0, x0, xh0_, u0 = _f20_sep_sim(wo=0)
    tf, xf, xhf, uf = _f20_sep_sim(xh0=(0.1, 0.0))        # 推定を正しく始めると、すべての状態を測ったときと同じ
    o.append(T(290, 18, "(b) 台車を 10 cm ずらして放す（推定は 0 から始める）", "start", 11.5, INK, True))
    Q = Plot(330, 36, 330, 100, (0, 2), (-4, 11))
    o.append(_f20_box(Q))
    o.append(Q.axes(xl=None, yl="位置 p [cm]", xt=[0, 0.5, 1, 1.5, 2], yt=[0, 5, 10], xfmt=lambda v: ""))
    o.append(Q.line(list(zip(t0, x0[:, 0] * 100)), c=ALI, lw=1.4))
    o.append(Q.line(list(zip(tf, xf[:, 0] * 100)), c=MUT, lw=2.0, dash="6 3"))
    o.append(Q.line(list(zip(t, xh[:, 0] * 100)), c=TEA, lw=1.4, dash="3 2"))
    o.append(Q.line(list(zip(t, x[:, 0] * 100)), c=SIG, lw=2.4))
    o.append(T(Q.X(1.98), Q.Y(9.4), "H = 0: 推定は 0 のまま、力も 0", "end", 9.5, ALI, True, halo=True))
    U = Plot(330, 152, 330, 90, (0, 2), (-5.5, 2.5))
    o.append(_f20_box(U))
    o.append(U.axes(xl="時間 t [s]", yl="力 u [N]", xt=[0, 0.5, 1, 1.5, 2], yt=[-4, -2, 0, 2], xfmt=lambda v: "%g" % v))
    o.append(U.line(list(zip(tf, uf)), c=MUT, lw=2.0, dash="6 3"))
    o.append(U.line(list(zip(t, u)), c=GLD, lw=2.4))
    i = int(_f20_np.argmin(u)); j = int(_f20_np.argmax(u))
    o.append(D(U.X(t[i]), U.Y(u[i]), GLD, 3.4)); o.append(T(U.X(t[i]) + 6, U.Y(u[i]) + 4, "%s N" % _f20_f(u[i], 2), "start", 9.5, GLD, True, halo=True))
    o.append(D(U.X(t[j]), U.Y(u[j]), GLD, 3.4)); o.append(T(U.X(t[j]) + 6, U.Y(u[j]) - 4, "+%s N" % _f20_f(u[j], 2), "start", 9.5, GLD, True, halo=True))
    o.append(LEGL(52, 298, [(SIG, None, "台車の位置（オブザーバ −20）"), (TEA, "3 2", "推定した位置"), (MUT, "6 3", "すべての状態を測る"), (ALI, None, "H = 0"), (GLD, None, "力")], 9.5, 10))
    return SVG(700, 308, o,
               "台車とばね・ダンパに、18 章 1 節の F = [25, 8]（極 −5 ± j5）と、3 節のオブザーバ（極 −20 が 2 つ）を組み合わせる。(a) 閉ループの 4 つの極は、2 つの設計の極を合わせたもの。(b) 推定を 0 から始めると、推定が追いつくまで力が遅れて出るので、台車は少し行き過ぎるが、収まる速さはすべての状態を測った場合とほぼ同じ。オブザーバゲインを 0 にすると、推定は 0 のまま動かず、力も出ない。")


F["e20_sep_resp"] = _f20_sep_resp_fig()


# =====================================================================
# 5 節: 1 次のカルマンフィルタ（板の温度、1 s ごと）
# =====================================================================
_F20_KV, _F20_KW = 0.04, 0.0004            # 観測ノイズの分散 V（0.2 K の 2 乗）、プロセスノイズの分散 W（0.02 K の 2 乗）
_F20_KX0 = 60.0                            # 本当の温度の始め [°C]


def _f20_kf1_data(n, mode="walk", seed=20, sw=0.02, sv=0.2, kstep=100, dstep=0.5):
    """本当の温度と読み（デモ w20_kf1 と同じ列）。周期ごとに 乱れ・ノイズ の順に正規乱数を 2 つ引く。
    mode: "const"（一定）・"walk"（ランダムウォーク）・"step"（kstep 回目から dstep だけ上がる）。返り値 (x[1..n], y[1..n])。"""
    nrm = _f20_rng(seed); x = _F20_KX0; xs, ys = [], []
    for k in range(1, n + 1):
        a = nrm(); b = nrm()
        if mode == "step" and k == kstep:
            x += dstep
        xs.append(x); ys.append(x + sv * b)
        if mode == "walk":
            x += sw * a
    return _f20_np.array(xs), _f20_np.array(ys)


def _f20_kf1(ys, W, V, s0=1e9, x0=0.0):
    """1 次のカルマンフィルタ（本文の C のコードと同じ式）。返り値 (推定, 予測の分散 Σ⁻, ゲイン H, 更新の分散 Σ, 予測 x̂⁻)。"""
    x, s = x0, s0; X, SP, HH, SS, XP = [], [], [], [], []
    for y in ys:
        sp = s + W; xp = x
        h = sp / (sp + V)
        x = xp + h * (y - xp); s = h * V
        X.append(x); SP.append(sp); HH.append(h); SS.append(s); XP.append(xp)
    return tuple(_f20_np.array(v) for v in (X, SP, HH, SS, XP))


def _f20_ma(ys, N):
    out = []
    for k in range(len(ys)):
        out.append(float(_f20_np.mean(ys[max(0, k - N + 1):k + 1])))
    return _f20_np.array(out)


def _f20_bell(P, mu, var, c, lw=2.0, dash=None, fill=True, scale=None):
    sd = math.sqrt(var)
    xs = _f20_np.linspace(P.xr[0], P.xr[1], 241)
    pk = 1 / math.sqrt(2 * math.pi * var)
    sc = scale if scale else 1.0
    ys = [sc * math.exp(-(x - mu) ** 2 / (2 * var)) / math.sqrt(2 * math.pi * var) for x in xs]
    pts = [(P.X(x), P.Y(min(v, P.yr[1]))) for x, v in zip(xs, ys)]
    o = []
    if fill:
        o.append(PL([(P.X(xs[0]), P.Y(0))] + pts + [(P.X(xs[-1]), P.Y(0))], c="none", lw=0, fill=soft(c), op=0.5))
    o.append(PL(pts, c=c, lw=lw, dash=dash))
    return "".join(o)


def _f20_kf_cycle_fig():
    o = []
    xs, ys = _f20_kf1_data(80, "walk")
    X, SP, HH, SS, XP = _f20_kf1(ys, _F20_KW, _F20_KV)
    panels = [("(a) 更新（k = 2）: H = %s" % _f20_g(HH[1], 3), 1, "upd"), ("(b) 更新（k = 60）: H = %s" % _f20_g(HH[59], 3), 59, "upd"),
              ("(c) 予測だけを続ける（k = 60 の後）", 59, "pred")]
    for j, (title, i, kind) in enumerate(panels):
        x0 = 16 + j * 230
        o.append(T(x0, 18, title, "start", 11.5, INK, True))
        mu = (XP[i] + ys[i]) / 2 if kind == "upd" else X[i]
        half = 0.62
        P = Plot(x0 + 10, 40, 200, 160, (mu - half, mu + half), (0, 10.5))
        o.append(_f20_box(P))
        o.append(P.axes(xl="温度 [°C]", yl=None, xt=[round(mu - 0.4, 1), round(mu, 1), round(mu + 0.4, 1)], yt=[], xfmt=lambda v: "%.1f" % v, grid=False, sz=9))
        yl = 9.7
        if kind == "upd":
            o.append(_f20_bell(P, XP[i], SP[i], MUT, 1.6, "5 3", fill=False))
            o.append(_f20_bell(P, ys[i], _F20_KV, TEA, 1.6, None, fill=False))
            o.append(_f20_bell(P, X[i], SS[i], SIG, 2.4))
            o.append(W(P.X(ys[i]), P.y + P.h, P.X(ys[i]), P.y + P.h - 8, c=TEA, lw=2))
            o.append(T(P.X(ys[i]), P.y + P.h - 11, "y", "middle", 10, TEA, True, halo=True))
            o.append(TX(P.x + 6, P.Y(yl), "予測 x̂^{−}: 分散 %s" % _f20_g(SP[i], 3), "start", 9, MUT, True, halo=True))
            o.append(TX(P.x + 6, P.Y(yl) + 13, "読み y: 分散 V = 0.04", "start", 9, TEA, True, halo=True))
            o.append(TX(P.x + 6, P.Y(yl) + 26, "更新 x̂: 分散 %s" % _f20_g(SS[i], 3), "start", 9, SIG, True, halo=True))
        else:
            s0 = SS[i]
            for nn, c, dash, lw in ((0, SIG, None, 2.4), (10, MUT, "5 3", 1.6), (50, ALI, None, 1.6)):
                o.append(_f20_bell(P, X[i], s0 + nn * _F20_KW, c, lw, dash, fill=(nn == 0)))
            o.append(TX(P.x + 6, P.Y(yl), "更新した直後: 分散 %s" % _f20_g(s0, 3), "start", 9, SIG, True, halo=True))
            o.append(TX(P.x + 6, P.Y(yl) + 13, "10 回予測だけ: %s" % _f20_g(s0 + 10 * _F20_KW, 3), "start", 9, MUT, True, halo=True))
            o.append(TX(P.x + 6, P.Y(yl) + 26, "50 回予測だけ: %s" % _f20_g(s0 + 50 * _F20_KW, 3), "start", 9, ALI, True, halo=True))
    o.append(T(16, 248, "山の幅は標準偏差（分散の平方根）。更新した山は予測と読みの間にあり、どちらよりも細い。予測のたびに分散は W ずつ増える。", "start", 9.5, MUT))
    return SVG(700, 258, o,
               "板の温度の 1 次のカルマンフィルタ（W = 0.0004 K²、V = 0.04 K²。ランダムウォークの温度を 1 s ごとに測った列で、デモと同じ乱数）。山は、推定の確からしさを正規分布の形で描いたもの。(a) 始めのころは予測と読みが同じくらい不確かで、ゲインは約 0.5。(b) 予測が確かになると、ゲインは小さく、更新は予測の近くに留まる。(c) 読めない回が続いて予測だけをすると、平均はそのままで、分散が W ずつ増える。")


F["e20_kf_cycle"] = _f20_kf_cycle_fig()


def _f20_kf_const_fig():
    o = []
    N = 17
    xs, ys = _f20_kf1_data(100, "const")
    K0 = _f20_kf1(ys, 0.0, _F20_KV)[0]; M = _f20_ma(ys, N)
    ks = _f20_np.arange(1, 101)
    o.append(T(14, 18, "(a) 一定の温度（60 °C）を測る", "start", 11.5, INK, True))
    P = Plot(62, 36, 280, 120, (0, 100), (59.4, 60.6))
    o.append(_f20_box(P))
    o.append(P.axes(xl="回 k（1 s ごと）", yl="温度 [°C]", xt=[0, 20, 40, 60, 80, 100], yt=[59.5, 60, 60.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    for k, y in zip(ks, ys):
        o.append(D(P.X(k), P.Y(min(max(y, 59.4), 60.6)), TEA, 1.6))
    o.append(P.line(list(zip(ks, M)), c=PUR, lw=1.8))
    o.append(P.line(list(zip(ks, K0)), c=SIG, lw=2.4))
    o.append(W(P.x, P.Y(60), P.x + P.w, P.Y(60), c=MUT, lw=1, dash="4 3"))
    # (b) 標準偏差
    o.append(T(380, 18, "(b) 推定誤差の標準偏差", "start", 11.5, INK, True))
    Q = Plot(420, 36, 250, 120, (0, 100), (0, 0.22))
    o.append(_f20_box(Q))
    o.append(Q.axes(xl="回 k", yl="標準偏差 [K]", xt=[0, 20, 40, 60, 80, 100], yt=[0, 0.05, 0.1, 0.15, 0.2], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(Q.line([(1, 0.2), (100, 0.2)], c=TEA, lw=1.4, dash="4 3"))
    o.append(Q.line([(k, 0.2 / math.sqrt(min(k, N))) for k in ks], c=PUR, lw=1.8))
    o.append(Q.line([(k, 0.2 / math.sqrt(k)) for k in ks], c=SIG, lw=2.4))
    o.append(T(Q.X(98), Q.Y(0.2) - 5, "読み 0.2 K", "end", 9.5, TEA, True, halo=True))
    o.append(T(Q.X(98), Q.Y(0.2 / math.sqrt(N)) - 6, "移動平均（N = 17）: 0.2/√17 = 0.049 K", "end", 9.5, PUR, True, halo=True))
    o.append(T(Q.X(98), Q.Y(0.02) - 6, "カルマンフィルタ（W = 0）: 0.2/√k", "end", 9.5, SIG, True, halo=True))
    # (c) 段差
    xs2, ys2 = _f20_kf1_data(250, "step")
    Ka = _f20_kf1(ys2, 0.0, _F20_KV)[0]; Kb = _f20_kf1(ys2, _F20_KW, _F20_KV)[0]; M2 = _f20_ma(ys2, N)
    ks2 = _f20_np.arange(1, 251)
    o.append(T(14, 210, "(c) 100 回目に温度が 0.5 K 上がったとき", "start", 11.5, INK, True))
    R_ = Plot(62, 228, 608, 120, (0, 250), (59.6, 60.8))
    o.append(_f20_box(R_))
    o.append(R_.axes(xl="回 k（1 s ごと）", yl="温度 [°C]", xt=[0, 50, 100, 150, 200, 250], yt=[59.6, 60, 60.4, 60.8], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    for k, y in zip(ks2, ys2):
        if 59.6 <= y <= 60.8:
            o.append(D(R_.X(k), R_.Y(y), TEA, 1.3))
    o.append(R_.line(list(zip(ks2, xs2)), c=MUT, lw=1.4))
    o.append(R_.line(list(zip(ks2, M2)), c=PUR, lw=1.8))
    o.append(R_.line(list(zip(ks2, Ka)), c=SIG, lw=2.2, dash="6 3"))
    o.append(R_.line(list(zip(ks2, Kb)), c=GRN, lw=2.4))
    o.append(LEGL(62, 400, [(TEA, None, "読み（点）"), (MUT, None, "本当の温度"), (SIG, "6 3", "カルマンフィルタ W = 0"), (GRN, None, "カルマンフィルタ W/V = 0.01"), (PUR, None, "移動平均 N = 17")], 9.5, 10))
    return SVG(700, 410, o,
               "変わらない値を測るとき、W = 0 のカルマンフィルタは、それまでのすべての読みの平均と同じで、誤差の標準偏差は 0.2/√k K と減り続ける。17 回の移動平均は 0.049 K から減らない。値が途中で変わると、W = 0 のカルマンフィルタはゲインが 1/k と小さくなっているので追いつけない。W > 0 にすると、一定のゲインで追いつく（デモと同じ乱数の列）。")


F["e20_kf_const"] = _f20_kf_const_fig()


def _f20_kf_ratio_fig():
    o = []
    o.append(T(14, 18, "(a) 定常のカルマンゲインは W/V で決まる", "start", 11.5, INK, True))
    rs = _f20_np.logspace(-4, 2, 200)
    Hs = [((r + math.sqrt(r * r + 4 * r)) / 2) / ((r + math.sqrt(r * r + 4 * r)) / 2 + 1) for r in rs]
    P = Plot(62, 36, 270, 190, (1e-4, 100), (0, 1), xlog=True)
    o.append(_f20_box(P))
    o.append(P.axes(xl="W/V（乱れとノイズの分散の比）", yl="ゲイン H", xt=[1e-4, 1e-3, 1e-2, 1e-1, 1, 10, 100], yt=[0, 0.25, 0.5, 0.75, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(P.line(list(zip(rs, Hs)), c=SIG, lw=2.4))
    for r in (1e-4, 1e-2, 1.0):
        sm = (r + math.sqrt(r * r + 4 * r)) / 2; h = sm / (sm + 1); tc = -1 / math.log(1 - h)
        o.append(D(P.X(r), P.Y(h), SIG, 3.8))
        o.append(T(P.X(r) - 4, P.Y(h) - 9 if r < 0.5 else P.Y(h) + 16, "H = %s（時定数 %s s）" % (_f20_g(h, 3), _f20_g(tc, 3)), "start" if r < 0.5 else "end", 9.5, SIG, True, halo=True))
    o.append(T(P.X(1.5e-4), P.Y(0.92), "大きい: 読みを信じる", "start", 9.5, MUT, halo=True))
    o.append(T(P.X(1.5e-4), P.Y(0.92) + 14, "小さい: 予測を信じる", "start", 9.5, MUT, halo=True))
    # (b) 移動平均との比較
    o.append(T(380, 18, "(b) ランダムウォーク（W/V = 0.01）の推定誤差", "start", 11.5, INK, True))
    W_, V_ = _F20_KW, _F20_KV
    Ns = _f20_np.arange(1, 61)
    es = [math.sqrt(W_ * (N - 1) * (2 * N - 1) / (6 * N) + V_ / N) for N in Ns]
    sm = (W_ + math.sqrt(W_ * W_ + 4 * W_ * V_)) / 2; h = sm / (sm + V_); ek = math.sqrt(h * V_)
    Q = Plot(420, 36, 250, 190, (0, 60), (0, 0.22))
    o.append(_f20_box(Q))
    o.append(Q.axes(xl="移動平均の長さ N", yl="推定誤差の標準偏差 [K]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[0, 0.05, 0.1, 0.15, 0.2], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(Q.line([(1, 0.2), (60, 0.2)], c=TEA, lw=1.4, dash="4 3"))
    o.append(Q.line(list(zip(Ns, es)), c=PUR, lw=2.2))
    o.append(Q.line([(0, ek), (60, ek)], c=SIG, lw=2.2))
    i = int(_f20_np.argmin(es))
    o.append(D(Q.X(Ns[i]), Q.Y(es[i]), PUR, 3.8))
    o.append(T(Q.X(Ns[i]) + 4, Q.Y(es[i]) - 26, "最も小さい移動平均", "start", 9.5, PUR, True, halo=True))
    o.append(T(Q.X(Ns[i]) + 4, Q.Y(es[i]) - 12, "N = %d: %s K" % (Ns[i], _f20_g(es[i], 3)), "start", 9.5, PUR, True, halo=True))
    o.append(T(Q.X(59), Q.Y(ek) + 16, "カルマンフィルタ: %s K" % _f20_g(ek, 3), "end", 9.5, SIG, True, halo=True))
    o.append(T(Q.X(59), Q.Y(0.2) - 5, "読み: 0.2 K", "end", 9.5, TEA, True, halo=True))
    o.append(T(Q.X(3), Q.Y(0.13), "短いとノイズが残る", "start", 9.5, MUT, halo=True))
    o.append(T(Q.X(59), Q.Y(0.122), "長いと温度の変化に遅れる", "end", 9.5, MUT, halo=True))
    return SVG(700, 266, o,
               "(a) ゲインが一定になった後のカルマンゲインは、乱れの分散 W とノイズの分散 V の比だけで決まる（T_s = 1 s での一次の IIR フィルタの時定数も示した）。(b) 本文の例（W/V = 0.01）で、移動平均の長さを変えたときの推定誤差（式で求めた値）。どの長さの移動平均も、カルマンフィルタより誤差が大きい。")


F["e20_kf_ratio"] = _f20_kf_ratio_fig()


# =====================================================================
# 6 節: 倒立振子の推定誤差 — オブザーバの極の速さとカルマンフィルタ
# =====================================================================
_F20_HOBS = _f20_obs_gain(20.0)
_F20_HKF, _F20_PKF = _f20_kf_gain(1.0)


def _f20_pend_err_fig():
    o = []
    W_ = _f20_W()
    Sk = _f20_errcov(_F20_HKF, W_)
    ek = _f20_np.sqrt(_f20_np.diag(Sk))
    ws = _f20_np.logspace(math.log10(5), math.log10(200), 40)
    eo = _f20_np.array([_f20_np.sqrt(_f20_np.diag(_f20_errcov(_f20_obs_gain(w), W_))) for w in ws])
    e20 = _f20_np.sqrt(_f20_np.diag(_f20_errcov(_F20_HOBS, W_)))
    # (a) 推定誤差の極
    o.append(T(14, 18, "(a) 推定誤差の極", "start", 11.5, INK, True))
    P = Plot(46, 36, 170, 180, (-36, 6), (-34, 34))
    o.append(_f20_box(P)); o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", xt=[-30, -20, -10, 0], yt=[-30, -15, 0, 15, 30], grid=False, sz=9))
    for z in _f20_est_poles(_F20_HKF):
        o.append(_f20_xmark(P, complex(z), SIG, 5.5, 2.4))
    o.append(_f20_xmark(P, complex(-20, 0), TEA, 6.5, 2.6))
    o.append(T(P.X(-20), P.Y(0) + 20, "オブザーバ −20 × 4", "middle", 9, TEA, True, halo=True))
    o.append(T(P.X(-12.25) + 2, P.Y(12.25) - 9, "−12.25 ± j12.25", "middle", 9, SIG, True, halo=True))
    o.append(T(P.X(-29.71) + 4, P.Y(28.93) + 16, "−29.71 ± j28.93", "start", 9, SIG, True, halo=True))
    o.append(T(46, 266, "青: カルマンフィルタ（台車の側が遅く、", "start", 9.5, SIG))
    o.append(T(46, 280, "振子の側が速い）", "start", 9.5, SIG))
    # (b) (c)
    specs = [("(b) 台車の速度の推定誤差", 1, 1000.0, "標準偏差 [mm/s]", (1, 30), [1, 3, 10, 30], 268, "差分のままでは 1414 mm/s"),
             ("(c) 振子の角速度の推定誤差", 3, 1 / _F20_D2R, "標準偏差 [°/s]", (0.5, 5), [0.5, 1, 2, 5], 488, "差分のままでは 141 °/s")]
    for title, j, sc, yl, yr, yt, x0, note in specs:
        o.append(T(x0 - 36, 18, title, "start", 11.5, INK, True))
        Q = Plot(x0, 36, 190, 180, (5, 200), yr, xlog=True, ylog=True)
        o.append(_f20_box(Q))
        o.append(Q.axes(xl="オブザーバの極 −ω_o の ω_o [rad/s]", yl=yl, xt=[5, 10, 20, 50, 100, 200], yt=yt, xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9))
        o.append(Q.clip(list(zip(ws, eo[:, j] * sc)), c=TEA, lw=2.2))
        o.append(Q.line([(5, ek[j] * sc), (200, ek[j] * sc)], c=SIG, lw=2.0, dash="6 3"))
        o.append(D(Q.X(20), Q.Y(e20[j] * sc), TEA, 4))
        o.append(T(Q.X(20) + 4, Q.Y(e20[j] * sc) - 8, "−20: %s" % _f20_g(e20[j] * sc, 3), "start", 9, TEA, True, halo=True))
        o.append(T(Q.X(195), Q.Y(ek[j] * sc) + 14, "カルマンフィルタ %s" % _f20_g(ek[j] * sc, 3), "end", 9, SIG, True, halo=True))
        o.append(T(Q.X(6), Q.y + 13, note, "start", 9, ALI, halo=True))
    return SVG(700, 290, o,
               "倒立振子の位置と角度を 1 ms ごとに測り（ノイズ 1 mm・0.1°）、台車と振子に標準偏差 0.3 m/s²・3 rad/s² のでたらめな加速度が加わるとしたとき。(a) カルマンフィルタの推定誤差の極（青）と、4 つの極を −20 に置いたオブザーバ（青緑）。(b)(c) オブザーバの 4 つの極を同じ位置に置き、その位置を変えたときの推定誤差の標準偏差（分散の式で求めた値）は谷の形になる。カルマンフィルタ（破線）は、どの位置のオブザーバよりも小さい。")


F["e20_pend_err"] = _f20_pend_err_fig()


# =====================================================================
# 6 節: 力のノイズと、押されたときの傾きの釣り合い
# =====================================================================
def _f20_push_tilt(kind, **kw):
    r = _f20_run(kind, [0, 0, 0, 0], 4.0, noise=0.0, proc=0.0, push=(0.5, 0.1, 1.0), **kw)
    return -float(r["x"][:, 2].min()) / _F20_D2R, r


def _f20_pend_front_fig():
    o = []
    fam = []
    taus = [0.002, 0.005, 0.01, 0.02, 0.03, 0.05, 0.07, 0.1, 0.15, 0.2]
    fam.append(("差分＋一次遅れ", PUR, [(_f20_diff_force_std(tt), _f20_push_tilt("diff", tau=tt)[0]) for tt in taus]))
    wos = [8, 10, 15, 20, 30, 40, 60, 80, 100]
    fam.append(("オブザーバ", TEA, [(_f20_force_std(_f20_obs_gain(w)), _f20_push_tilt("est", H=_f20_obs_gain(w))[0]) for w in wos]))
    cs = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000]
    fam.append(("カルマンフィルタ", SIG, [(_f20_force_std(_f20_kf_gain(c)[0]), _f20_push_tilt("est", H=_f20_kf_gain(c)[0])[0]) for c in cs]))
    ideal, ri = _f20_push_tilt("ideal")
    o.append(T(14, 18, "(a) 力のノイズと、押したときの傾き", "start", 11.5, INK, True))
    P = Plot(62, 36, 300, 236, (0.01, 5), (10, 21), xlog=True)
    o.append(_f20_box(P))
    o.append(P.axes(xl="力のノイズの標準偏差 [N]（測定のノイズだけ）", yl="押したときに左へ傾く最大 [°]", xt=[0.01, 0.1, 1, 5], yt=[10, 12, 14, 16, 18, 20], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(W(P.x, P.Y(ideal), P.x + P.w, P.Y(ideal), c=MUT, lw=1.2, dash="5 3"))
    o.append(T(P.X(0.012), P.Y(ideal) - 5, "すべての状態を測る: %s°" % _f20_f(ideal, 2), "start", 9, MUT, halo=True))
    for name, c, pts in fam:
        o.append(P.clip(pts, c=c, lw=2.2))
        for a, b in pts:
            if P.xr[0] <= a <= P.xr[1]:
                o.append(D(P.X(a), P.Y(b), c, 2.4))
    ex = [("20 ms", PUR, _f20_diff_force_std(0.02), _f20_push_tilt("diff", tau=0.02)[0], 6, -8),
          ("100 ms", PUR, _f20_diff_force_std(0.1), _f20_push_tilt("diff", tau=0.1)[0], 6, 14),
          ("−20", TEA, _f20_force_std(_F20_HOBS), _f20_push_tilt("est", H=_F20_HOBS)[0], 6, -6),
          ("本文の W", SIG, _f20_force_std(_F20_HKF), _f20_push_tilt("est", H=_F20_HKF)[0], -6, 16)]
    for lab, c, a, b, dx, dy in ex:
        o.append(CIRC(P.X(a), P.Y(b), 5.5, c=c, lw=2.0, fill=SCR)); o.append(D(P.X(a), P.Y(b), c, 2.6))
        o.append(T(P.X(a) + dx, P.Y(b) + dy, lab, "start" if dx > 0 else "end", 9.5, c, True, halo=True))
    for i, (c, lab) in enumerate(((PUR, "差分＋一次遅れ（時定数を変える）"), (TEA, "オブザーバ（極の速さを変える）"), (SIG, "カルマンフィルタ（W の倍率を変える）"))):
        o.append(W(P.X(0.12), P.Y(20.4) + i * 17 - 4, P.X(0.12) + 22, P.Y(20.4) + i * 17 - 4, c=c, lw=2.2))
        o.append(T(P.X(0.12) + 28, P.Y(20.4) + i * 17, lab, "start", 9.5, c, True, halo=True))
    # (b) 押したときの波形
    runs = [("すべて", MUT, "6 3", ri), ("差分 20 ms", PUR, None, _f20_push_tilt("diff", tau=0.02)[1]),
            ("オブザーバ", TEA, None, _f20_push_tilt("est", H=_F20_HOBS)[1]), ("カルマン", SIG, None, _f20_push_tilt("est", H=_F20_HKF)[1])]
    o.append(T(398, 18, "(b) おもりを右へ 1 N で 0.1 s 押す（ノイズなし）", "start", 11.5, INK, True))
    Q = Plot(440, 36, 230, 104, (0, 4), (-17, 8))
    o.append(_f20_box(Q))
    o.append(Q.axes(xl=None, yl="角度 φ [°]", xt=[0, 1, 2, 3, 4], yt=[-15, -10, -5, 0, 5], xfmt=lambda v: "", yfmt=lambda v: _f20_g(v, 2) if v else "0"))
    R_ = Plot(440, 160, 230, 104, (0, 4), (-10, 38))
    o.append(_f20_box(R_))
    o.append(R_.axes(xl="時間 t [s]", yl="台車の位置 p [cm]", xt=[0, 1, 2, 3, 4], yt=[0, 10, 20, 30], xfmt=lambda v: "%g" % v))
    for lab, c, dash, r in runs:
        o.append(Q.clip(list(zip(r["t"], r["x"][:, 2] / _F20_D2R)), c=c, lw=1.9, dash=dash))
        o.append(R_.clip(list(zip(r["t"], r["x"][:, 0] * 100)), c=c, lw=1.9, dash=dash))
    o.append(LEGL(398, 306, [(MUT, "6 3", "すべて測る"), (PUR, None, "差分 20 ms")], 9.5, 10))
    o.append(LEGL(398, 322, [(TEA, None, "オブザーバ −20"), (SIG, None, "カルマンフィルタ")], 9.5, 10))
    return SVG(700, 334, o,
               "倒立振子を位置と角度だけで立てるときの、推定のしかたの比べ方。(a) 横軸は、立てたまま測定のノイズだけを加えたときの力のノイズ（分散の式）、縦軸は、ノイズを除いておもりを押したときに傾く最大の角度（線形でない式）。ならす時定数・オブザーバの極の速さ・カルマンフィルタの W を変えると、それぞれ 1 本の線になる。力のノイズを 0.2 N 程度より小さくする範囲では、カルマンフィルタの線が最も下にある。(b) 印を付けた 4 つの設計で押したときの角度と台車の位置。")


F["e20_pend_front"] = _f20_pend_front_fig()


# =====================================================================
# 6 節: 入力の点で切ったループの余裕
# =====================================================================
def _f20_loop(kind, H=None, tau=0.02):
    """入力の点で切った一巡伝達関数（1 ms ごとの計算を含む）。z を受け取り複素数を返す関数。"""
    Ad, Bd, F, C = _F20_AD, _F20_BD, _F20_F, _F20_C
    I4 = _f20_np.eye(4)
    if kind == "ideal":
        return lambda z: complex((F @ _f20_np.linalg.solve(z * I4 - Ad, Bd))[0, 0])
    if kind == "diff":
        a = tau / (tau + _F20_TS) if tau > 0 else 0.0

        def f(z):
            Pz = C @ _f20_np.linalg.solve(z * I4 - Ad, Bd)
            Dz = (1 - a) / _F20_TS * (1 - 1 / z) / (1 - a / z)
            return complex(F[0, 0] * Pz[0, 0] + F[0, 1] * Dz * Pz[0, 0] + F[0, 2] * Pz[1, 0] + F[0, 3] * Dz * Pz[1, 0])
        return f
    Phc = (I4 - H @ C) @ (Ad - Bd @ F)

    def g(z):
        Kz = F @ _f20_np.linalg.solve(z * I4 - Phc, z * H)
        Pz = C @ _f20_np.linalg.solve(z * I4 - Ad, Bd)
        return complex((Kz @ Pz)[0, 0])
    return g


def _f20_margins(L):
    """位相余裕 [°]・ゲイン交差角周波数・安定な力の倍率の範囲・−1 からの最短距離（ω は 0.1〜π/T_s rad/s）。"""
    ws = _f20_np.logspace(-1, math.log10(math.pi / _F20_TS * 0.999), 6000)
    Ls = _f20_np.array([L(_f20_np.exp(1j * w * _F20_TS)) for w in ws])
    mag = _f20_np.abs(Ls)
    pm, wgc = None, None
    for j in range(1, len(ws)):
        if (mag[j - 1] - 1) * (mag[j] - 1) <= 0:
            a, b = ws[j - 1], ws[j]
            for _ in range(50):
                mm = math.sqrt(a * b)
                if (abs(L(_f20_np.exp(1j * a * _F20_TS))) - 1) * (abs(L(_f20_np.exp(1j * mm * _F20_TS))) - 1) <= 0:
                    b = mm
                else:
                    a = mm
            w = math.sqrt(a * b); v = L(_f20_np.exp(1j * w * _F20_TS))
            p_ = 180 - abs(math.degrees(math.atan2(v.imag, v.real)))
            if pm is None or p_ < pm:
                pm, wgc = p_, w
    lo, hi = 0.0, float("inf")
    for j in range(1, len(ws)):
        if Ls[j - 1].imag * Ls[j].imag <= 0 and Ls[j].real < 0:
            x = Ls[j - 1].real + (Ls[j].real - Ls[j - 1].real) * (Ls[j - 1].imag / (Ls[j - 1].imag - Ls[j].imag))
            if x < -1:
                lo = max(lo, -1 / x)
            elif x > -1:
                hi = min(hi, -1 / x)
    return pm, wgc, lo, hi, float(_f20_np.min(_f20_np.abs(1 + Ls)))


def _f20_pend_margin_fig():
    o = []
    cases = [("すべて測る", MUT, _f20_loop("ideal")), ("差分 20 ms", PUR, _f20_loop("diff", tau=0.02)),
             ("オブザーバ −20", TEA, _f20_loop("est", H=_F20_HOBS)), ("カルマン", SIG, _f20_loop("est", H=_F20_HKF))]
    o.append(T(14, 18, "(a) 入力の点で切ったナイキスト線図", "start", 11.5, INK, True))
    s, P = CPLANE(52, 36, 300, 240, (-3.5, 1.5), (-2, 2), [-3, -2, -1, 0, 1], [-2, -1, 0, 1, 2])
    o.append(s)
    th = _f20_np.linspace(0, 2 * math.pi, 121)
    o.append(PL([(P.X(-1 + math.cos(a)), P.Y(math.sin(a))) for a in th], c=ALI, lw=1.2, fill=soft(ALI), op=0.55))
    ws = _f20_np.logspace(math.log10(0.4), math.log10(math.pi / _F20_TS * 0.999), 900)
    for name, c, L in cases:
        vs = [L(_f20_np.exp(1j * w * _F20_TS)) for w in ws]
        o.append(P.clip([(v.real, v.imag) for v in vs], c=c, lw=2.0 if c != MUT else 2.4, dash="6 3" if c == MUT else None))
    o.append(M1(P))
    o.append(T(P.X(1.45), P.Y(-1.8), "ω → 0 で左の枠の外へ", "end", 9, MUT, halo=True))
    # (b) 表
    xb = 384
    o.append(T(xb, 18, "(b) 余裕（1 ms ごとの計算を含む）", "start", 11.5, INK, True))
    cols = [(xb, "推定"), (xb + 110, "位相余裕"), (xb + 170, "安定な力の倍率"), (xb + 262, "最短距離")]
    for x, h in cols:
        o.append(T(x, 46, h, "start", 9.5, MUT, True))
    o.append(W(xb, 52, xb + 316, 52, c=LIN, lw=1))
    for i, (name, c, L) in enumerate(cases):
        pm, wgc, lo, hi, dmin = _f20_margins(L)
        y = 74 + i * 26
        o.append(W(xb, y - 4, xb + 18, y - 4, c=c, lw=2.4, dash="6 3" if c == MUT else None))
        o.append(T(xb + 24, y, name, "start", 9.5, INK))
        o.append(T(xb + 110, y, "%s°" % _f20_f(pm, 1), "start", 10, c, True))
        o.append(T(xb + 170, y, "%s〜%s 倍" % (_f20_g(lo, 2) if lo > 0 else "0", "∞" if not math.isfinite(hi) or hi > 1000 else _f20_g(hi, 3)), "start", 10, c, True))
        o.append(T(xb + 262, y, _f20_g(dmin, 2), "start", 10, c, True))
    lines = ["推定はモデル（対象は計算した力で動く）を", "使うので、実際の力が大きく違うと推定が外れ、", "上側にも安定の限界ができる。",
             "最短距離は |1 + L(e^{jωT_s})| の最も小さい値で、", "1 より小さいと、−1 を中心とする円に入る。"]
    for i, l in enumerate(lines):
        o.append(TX(xb, 196 + i * 17, l, "start", 9.5, INK if i < 3 else MUT))
    return SVG(700, 300, o,
               "推定した状態で立てる倒立振子の、入力の点で切った一巡伝達関数（19 章 6 節と同じ切り方。マイコンは計算した力で推定を進め、対象はその k 倍の力を受ける）。すべての状態を測る最適レギュレータの線図は、−1 を中心とする半径 1 の円（赤）にほとんど入らない（1 ms ごとの計算でわずかに入る）。オブザーバとカルマンフィルタを使うと線図は円に入り、位相余裕が減り、力の倍率に上の限界ができる。")


F["e20_pend_margin"] = _f20_pend_margin_fig()
