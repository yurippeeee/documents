# -*- coding: utf-8 -*-
# 21 章 総合演習 — 倒立振子を立てる の図
import numpy as _f21_np
from scipy import linalg as _f21_la

# =====================================================================
# 例の値（本文と同じ。17〜20 章の倒立振子）
# =====================================================================
_F21_M, _F21_m, _F21_l, _F21_g = 0.5, 0.2, 0.3, 9.81
_F21_D = math.pi / 180
_F21_TS = 0.001                       # サンプリング周期（20 章と同じ 1 ms）
_F21_SP, _F21_SPH = 1e-3, 0.1 * _F21_D  # 観測ノイズの標準偏差（位置 1 mm、角度 0.1°）
_F21_UMAX = 5.0                       # 力の上限（電流の上限 5 A × 1 N/A）
_F21_FC = 0.3                         # クーロン摩擦（例の値）
_F21_VC = 0.01                        # 摩擦の補償で、推定した速さの向きを見る幅 [m/s]


def _f21_AB(M=_F21_M, m=_F21_m, l=_F21_l):
    A = _f21_np.array([[0, 1, 0, 0], [0, 0, -m * _F21_g / M, 0], [0, 0, 0, 1], [0, 0, (M + m) * _F21_g / (M * l), 0.0]])
    B = _f21_np.array([[0.0], [1 / M], [0.0], [-1 / (M * l)]])
    return A, B


_F21_A, _F21_B = _f21_AB()
_F21_C = _f21_np.array([[1.0, 0, 0, 0], [0, 0, 1.0, 0]])


def _f21_lqr(Q, R):
    X = _f21_la.solve_continuous_are(_F21_A, _F21_B, Q, _f21_np.array([[R]]))
    return (_F21_B.T @ X / R)[0]


def _f21_acker(poles):
    A, B = _F21_A, _F21_B
    n = 4
    W = _f21_np.hstack([_f21_np.linalg.matrix_power(A, i) @ B for i in range(n)])
    ph = _f21_np.real(_f21_np.poly(poles))
    P = sum(ph[k] * _f21_np.linalg.matrix_power(A, n - k) for k in range(n + 1))
    e = _f21_np.zeros((1, n)); e[0, -1] = 1.0
    return (e @ _f21_np.linalg.inv(W) @ P)[0]


_F21_FLQ = _f21_lqr(_f21_np.diag([4.0, 0, 0, 0]), 0.04)     # 19 章 [−10.00, −6.896, −30.19, −4.925]
_F21_FPP = _f21_acker([-4.0] * 4)                           # 18 章 [−3.914, −3.914, −22.44, −3.574]


def _f21_c2d(A, B, h):
    n, k = A.shape[0], B.shape[1]
    Mx = _f21_np.zeros((n + k, n + k)); Mx[:n, :n] = A * h; Mx[:n, n:] = B * h
    E = _f21_la.expm(Mx)
    return E[:n, :n], E[:n, n:]


def _f21_kf(Ts=_F21_TS, sa=0.3, sal=3.0):
    """20 章の方法のカルマンフィルタ（ゲインが一定になった後）。sa・sal: 台車の加速度と振子の角加速度に加わる
    プロセスノイズの標準偏差（T_s ごとに新しい値）。返り値 (H, A_d, B_d)。"""
    Ad, Bd = _f21_c2d(_F21_A, _F21_B, Ts)
    G = _f21_np.array([[0, 0], [1.0, 0], [0, 0], [0, 1.0]])
    _, Gd = _f21_c2d(_F21_A, G, Ts)
    W = Gd @ _f21_np.diag([sa ** 2, sal ** 2]) @ Gd.T
    V = _f21_np.diag([_F21_SP ** 2, _F21_SPH ** 2])
    P = _f21_la.solve_discrete_are(Ad.T, _F21_C.T, W, V)
    H = P @ _F21_C.T @ _f21_np.linalg.inv(_F21_C @ P @ _F21_C.T + V)
    return H, Ad, Bd


# =====================================================================
# 乱数（widgets.js の U.rng と同じ列。デモと同じ観測ノイズにする）
# =====================================================================
class _F21Rng:
    def __init__(self, seed):
        self.a = (seed & 0xFFFFFFFF) or 1

    def nx(self):
        self.a = (self.a + 0x6D2B79F5) & 0xFFFFFFFF
        x = self.a
        t = ((x ^ (x >> 15)) * (1 | x)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def normal(self):
        u = 1 - self.nx(); v = self.nx()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


# =====================================================================
# 対象: 線形でない式（17 章 2 節）+ クーロン摩擦（止まりと滑りを切り替える）+ おもりを押す力
# =====================================================================
def _f21_acc(x, Fcart, fd, M, m, l):
    p, pd, ph, phd = x
    s, c = math.sin(ph), math.cos(ph)
    pdd = (Fcart + fd - m * _F21_g * s * c - fd * c * c + m * l * phd * phd * s) / (M + m * s * s)
    return (pd, pdd, phd, (_F21_g * s - pdd * c + fd / m * c) / l)


def _f21_acc_stuck(x, fd, m, l):
    ph, phd = x[2], x[3]
    return (0.0, 0.0, phd, (_F21_g * math.sin(ph) + fd / m * math.cos(ph)) / l)


def _f21_rk(f, x, h):
    k1 = f(x)
    x2 = tuple(x[i] + h / 2 * k1[i] for i in range(4)); k2 = f(x2)
    x3 = tuple(x[i] + h / 2 * k2[i] for i in range(4)); k3 = f(x3)
    x4 = tuple(x[i] + h * k3[i] for i in range(4)); k4 = f(x4)
    return tuple(x[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) for i in range(4))


class _F21Plant:
    """台車と振子。Fc > 0 なら台車にクーロン摩擦。止まっている間は、台車を止めておくのに要る力が Fc 以下なら止まったまま、
    動いている間に速さの符号が変わる刻みでは、その時刻を 2 分法で求めて、そこで止まるか、逆向きに滑るかを決める。"""

    def __init__(self, x0=(0, 0, 0, 0), M=_F21_M, m=_F21_m, l=_F21_l, Fc=0.0):
        self.x = tuple(float(v) for v in x0); self.M, self.m, self.l, self.Fc = M, m, l, Fc
        self.stuck = False

    def freq(self, x, u, fd):
        """台車を止めておくのに要る摩擦の力（右向きが正）"""
        m, l = self.m, self.l
        s, c = math.sin(x[2]), math.cos(x[2])
        return m * _F21_g * s * c + fd * c * c - m * l * x[3] * x[3] * s - u - fd

    def step(self, u, fd, h):
        M, m, l, Fc = self.M, self.m, self.l, self.Fc
        x = self.x
        if Fc <= 0:
            self.x = _f21_rk(lambda z: _f21_acc(z, u, fd, M, m, l), x, h)
            return
        stuckf = lambda z: _f21_acc_stuck(z, fd, m, l)
        if self.stuck or x[1] == 0.0:
            fr = self.freq(x, u, fd)
            if abs(fr) <= Fc:
                self.stuck = True
                xn = _f21_rk(stuckf, x, h)
                self.x = (xn[0], 0.0, xn[2], xn[3])
                return
            self.stuck = False
            sg = 1.0 if -fr > 0 else -1.0
        else:
            sg = 1.0 if x[1] > 0 else -1.0
        f = lambda z: _f21_acc(z, u - Fc * sg, fd, M, m, l)
        xn = _f21_rk(f, x, h)
        if (xn[1] > 0) != (sg > 0) and xn[1] != 0.0:
            lo, hi = 0.0, h
            for _ in range(40):
                mid = (lo + hi) / 2
                xm = _f21_rk(f, x, mid)
                if (xm[1] > 0) == (sg > 0):
                    lo = mid
                else:
                    hi = mid
            xc = _f21_rk(f, x, lo); xc = (xc[0], 0.0, xc[2], xc[3]); rem = h - lo
            fr = self.freq(xc, u, fd)
            if abs(fr) <= Fc:
                self.stuck = True
                xn = _f21_rk(stuckf, xc, rem); xn = (xn[0], 0.0, xn[2], xn[3])
            else:
                sg2 = 1.0 if -fr > 0 else -1.0
                xn = _f21_rk(lambda z: _f21_acc(z, u - Fc * sg2, fd, M, m, l), xc, rem)
        self.x = xn


# =====================================================================
# マイコンの制御器: T_s ごとに測り、次の周期の頭で出す（16 章 1 節の (B)）
#   x̂ = x̂⁻ + H (y − C x̂⁻)、u = −F x̂（上限で切る）+ 摩擦の補償、x̂⁻ ← A_d x̂ + B_d u_k
# =====================================================================
def _f21_run(T=6.0, Ts=_F21_TS, h=None, x0=(0, 0, 0, 0), F=None, est="kf", H=None, Ad=None, Bd=None,
             M=_F21_M, m=_F21_m, l=_F21_l, Fc=0.0, ffc=0.0, umax=_F21_UMAX, noise=False, seed=1, Ls=0.0,
             off=0.0, push=None, inj=None, every=1, stop_deg=60.0, sa=0.3, sal=3.0, timing="B", sgn=(1, 1, 1)):
    """返り値 dict(t, x（本当の状態）, xh（推定）, u（出した力）, uc（制御器が計算した力。inj を足す前）, fell)。
    est: "kf"（カルマンフィルタ）・"true"（本当の状態を使う。比べるため）。Ls: 測る値の遅れ [s]。off: 角度の 0 点のずれ [rad]。
    push = (開始, 長さ, 力)（おもりを水平に押す）。inj = (振幅, 角周波数)（出す力に正弦波を足す。6 節）。
    timing="A" なら、測ってすぐ計算した力を出す（すべてを測る連続の計算と比べるため）。
    sgn = (位置のセンサ, 角度のセンサ, 力) の向き（−1 で逆。6 節の配線の誤り）"""
    F = _F21_FLQ if F is None else _f21_np.asarray(F, float)
    if est == "kf" and H is None:
        H, Ad, Bd = _f21_kf(Ts, sa, sal)
    h = h or Ts
    nsub = int(round(Ts / h)); nd = int(round(Ls / h)); n = int(round(T / Ts))
    pl = _F21Plant(x0, M, m, l, Fc); rg = _F21Rng(seed)
    hist = [pl.x] * (nd + 1)
    Fl = [float(v) for v in F]
    if est == "kf":
        Hl = [[float(H[i][j]) for j in range(2)] for i in range(4)]
        Adl = [[float(Ad[i][j]) for j in range(4)] for i in range(4)]
        Bdl = [float(Bd[i][0]) for i in range(4)]
    xm = None; u_next = 0.0; uc_next = 0.0
    R = {"t": [], "x": [], "xh": [], "u": [], "uc": [], "fell": None}
    for k in range(n + 1):
        t = k * Ts
        xs = hist[0]
        e1, e2 = (rg.normal(), rg.normal()) if noise else (0.0, 0.0)
        y0 = sgn[0] * xs[0] + _F21_SP * e1; y1 = sgn[1] * xs[2] + off + _F21_SPH * e2
        u_k = u_next; uc_k = uc_next
        if est == "true":
            xh = list(xs)
        else:
            if xm is None:
                xm = [y0, 0.0, y1, 0.0]
            e0, ee1 = y0 - xm[0], y1 - xm[2]
            xh = [xm[i] + Hl[i][0] * e0 + Hl[i][1] * ee1 for i in range(4)]
        uc = -(Fl[0] * xh[0] + Fl[1] * xh[1] + Fl[2] * xh[2] + Fl[3] * xh[3])
        if ffc:
            uc += ffc * max(-1.0, min(1.0, xh[1] / _F21_VC))
        if umax is not None:
            uc = max(-umax, min(umax, uc))
        uc_next = uc
        u_next = uc + (inj[0] * math.sin(inj[1] * (t + Ts)) if inj else 0.0)
        if umax is not None:
            u_next = max(-umax, min(umax, u_next))
        if timing == "A":
            u_k, uc_k = u_next, uc
        if est == "kf":       # 足した正弦波は、推定から見て知らない外乱にする（予測には計算した力を使う）
            ue = uc_k if inj else u_k
            xm = [sum(Adl[i][j] * xh[j] for j in range(4)) + Bdl[i] * ue for i in range(4)]
        if k % every == 0:
            R["t"].append(t); R["x"].append(pl.x); R["xh"].append(tuple(xh)); R["u"].append(u_k); R["uc"].append(uc_k)
        if k == n:
            break
        for j in range(nsub):
            tj = t + j * h
            fd = push[2] if (push and push[0] - 1e-9 <= tj < push[0] + push[1] - 1e-9) else 0.0
            pl.step(sgn[2] * u_k, fd, h)
            if nd:
                hist.append(pl.x); hist.pop(0)
            else:
                hist[0] = pl.x
        if abs(pl.x[2]) > stop_deg * _F21_D:
            R["fell"] = t + Ts
            R["t"].append(t + Ts); R["x"].append(pl.x); R["xh"].append(tuple(xh)); R["u"].append(u_k); R["uc"].append(uc_k)
            break
    for kk in ("t", "x", "xh", "u", "uc"):
        R[kk] = _f21_np.array(R[kk])
    return R


def _f21_settle(t, y, tol):
    """|y| が tol を最後に超えた後、tol に戻った時刻（刻みの間は直線で補う）。最後まで超えていれば inf。"""
    idx = _f21_np.where(_f21_np.abs(y) > tol)[0]
    if len(idx) == 0:
        return 0.0
    i = idx[-1]
    if i + 1 >= len(t):
        return float("inf")
    a, b = abs(y[i]), abs(y[i + 1])
    return t[i] + (t[i + 1] - t[i]) * (a - tol) / (a - b)


def _f21_sci(v, d=2):
    """0.000061 → "6.1 × 10⁻⁵"（0.01 以上はそのまま有効数字 d 桁）"""
    if v == 0:
        return "0"
    if abs(v) >= 0.01:
        return _f21_fg(v, d)
    e = int(math.floor(math.log10(abs(v)))); mnt = v / 10 ** e
    sup = str(e).translate(str.maketrans("-0123456789", "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"))
    return ("%.*f" % (d - 1, mnt)).replace("-", "−") + " × 10" + sup


def _f21_pow10(v):
    """目盛の 10 のべき（1e-6 → "10⁻⁶"）"""
    e = int(round(math.log10(v)))
    return "1" if e == 0 else ("10" if e == 1 else "10" + str(e).translate(str.maketrans("-0123456789", "⁻⁰¹²³⁴⁵⁶⁷⁸⁹")))


def _f21_ff(v, d=2):
    s = "%.*f" % (d, v)
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f21_fg(v, d=3):
    """有効数字 d 桁、負号は −。"""
    if v == 0:
        return "0"
    s = "%.*g" % (d, v)
    if "e" in s:
        s = "%.*f" % (max(0, d - 1 - int(math.floor(math.log10(abs(v))))), v)
    return s.replace("-", "−")


# =====================================================================
# 描画の補助
# =====================================================================
def _f21_ground(x0, x1, y):
    o = [W(x0, y, x1, y, c=MUT, lw=1.6)]
    xx = x0 + 6
    while xx < x1:
        o.append(W(xx, y, xx - 7, y + 7, c=FNT, lw=1))
        xx += 12
    return "".join(o)


def _f21_pendcart(cx, gy, phi, L=70, cw=50, ch=20, c=SIG, dash=None, lw=2.4, bob=7, rod=INK):
    """地面 gy の上の、中心 cx の台車と、角度 phi [rad]（真上から右が正）の振子。返り値 (svg, 軸の点, おもりの点)。"""
    o = [RECT(cx - cw / 2, gy - ch - 12, cw, ch, 4, soft(c) if not dash else SCR, c, 1.5, dash),
         CIRC(cx - cw * 0.28, gy - 6, 6, c=c, lw=1.3, fill=SCR, dash=dash), CIRC(cx + cw * 0.28, gy - 6, 6, c=c, lw=1.3, fill=SCR, dash=dash)]
    px, py = cx, gy - ch - 12
    bx, by = px + L * math.sin(phi), py - L * math.cos(phi)
    o.append(W(px, py, bx, by, c=rod if not dash else c, lw=lw, dash=dash))
    o.append(CIRC(bx, by, bob, c=c, lw=1.5, fill=SCR if dash else soft(c), dash=dash))
    o.append(D(px, py, INK if not dash else c, 2.8))
    return "".join(o), (px, py), (bx, by)


def _f21_vbox(x, y, w, h, title, sub, c=LIN, tc=INK):
    """縦に並べる箱（題と説明 1 行）。"""
    o = [RECT(x, y, w, h, 7, PAN if c == LIN else soft(c), c, 1.4)]
    o.append(T(x + w / 2, y + (h / 2 - 3 if sub else h / 2 + 4), title, "middle", 10.5, tc, True))
    if sub:
        o.append(TX(x + w / 2, y + h / 2 + 11, sub, "middle", 9.5, MUT))
    return "".join(o)


# =====================================================================
# 1 節: 装置と仕様の数
# =====================================================================
def _f21_system_fig():
    o = []
    o.append(T(12, 18, "(a) 装置: レールの上の台車をベルトとモータで動かす", "start", 11.5, INK, True))
    gy = 200
    X = lambda pm: 222 + pm * 360          # 台車の位置 [m] → 横の座標（±0.5 m が 42〜402）
    # レール（棒）と端の止め
    o.append(RECT(X(-0.56), gy, X(0.56) - X(-0.56), 6, 2, MSOFT, MUT, 1.2))
    for s in (-1, 1):
        o.append(RECT(X(0.5 * s) - (8 if s > 0 else 0), gy - 28, 8, 28, 2, MSOFT, MUT, 1.2))
    # 台車が動いてよい範囲
    for s in (-1, 1):
        o.append(W(X(0.35 * s), gy - 150, X(0.35 * s), gy + 4, c=GRN, lw=1.2, dash="5 3"))
    o.append(T(X(-0.35) + 4, gy - 152, "台車は ±0.35 m 以内", "start", 9.5, GRN, True, halo=True))
    # ベルトとプーリー（レールの下）。右のプーリーの軸がモータの軸
    yb = gy + 18
    o.append(RECT(X(0.53) - 15, yb - 9, 30, 30, 4, GOSOFT, GLD, 1.3))
    o.append(RECT(X(0.53) + 10, yb - 15, 9, 9, 2, TSOFT, TEA, 1.2))
    for xp in (X(-0.53), X(0.53)):
        o.append(CIRC(xp, yb + 6, 6, c=MUT, lw=1.3, fill=SCR))
    o.append(W(X(-0.53), yb, X(0.53), yb, c=MUT, lw=1.2)); o.append(W(X(-0.53), yb + 12, X(0.53), yb + 12, c=MUT, lw=1.2))
    o.append(T(X(0.53) + 20, yb + 18, "モータ", "start", 9.5, GLD, True))
    o.append(T(X(0.53) + 22, yb - 12, "位置のセンサ", "start", 9.5, TEA, True))
    o.append(T(X(0.53) + 22, yb, "（σ 1 mm）", "start", 9.5, TEA))
    o.append(DIM(X(-0.5), gy + 54, X(0.5), gy + 54, None, c=MUT))
    o.append(T(X(0), gy + 70, "レール ±0.5 m", "middle", 9.5, MUT))
    # 台車と振子
    cx = X(0.04)
    s, piv, bob = _f21_pendcart(cx, gy, 9 * _F21_D, L=0.3 * 360, cw=58, ch=22)
    o.append(s)
    o.append(W(cx, gy + 6, cx, yb, c=MUT, lw=1.6))           # 台車をベルトにつなぐ
    o.append(T(cx + 36, gy - 20, "台車 M = 0.5 kg", "start", 9.5, SIG, True, halo=True))
    o.append(T(bob[0] + 12, bob[1] + 4, "おもり m = 0.2 kg", "start", 9.5, SIG, True, halo=True))
    o.append(TX((piv[0] + bob[0]) / 2 - 8, (piv[1] + bob[1]) / 2, "l = 0.3 m", "end", 9.5, INK, halo=True))
    # 角度センサ（軸）・押す力・台車を押す力
    o.append(CIRC(piv[0], piv[1], 6, c=TEA, lw=1.8))
    o.append(T(piv[0] - 12, piv[1] - 8, "角度センサ（σ 0.1°）", "end", 9.5, TEA, True, halo=True))
    o.append(ARR(bob[0] - 44, bob[1], bob[0] - 11, bob[1], c=PUR, lw=2.2))
    o.append(T(bob[0] - 48, bob[1] + 4, "押す 1 N・0.1 s", "end", 9.5, PUR, True, halo=True))
    o.append(ARR(cx - 74, gy - 23, cx - 32, gy - 23, c=GLD, lw=2.4))
    o.append(TX(cx - 78, gy - 19, "力 u（±5 N まで）", "end", 9.5, GLD, True, halo=True))
    # (b) 信号の流れ
    x0 = 504
    o.append(T(x0 - 6, 18, "(b) 信号の流れ", "start", 11.5, INK, True))
    bw, bh, gap = 190, 38, 16
    items = [("マイコン（1 ms ごと）", "推定 → u = −F x̂", SIG),
             ("モータドライバ", "電流のループ（上限 5 A）", LIN),
             ("モータとベルト", "力 = 1.0 N/A × 電流", LIN),
             ("台車と振子", "17 章 2 節の式 + 摩擦", LIN),
             ("センサ", "台車の位置 p・角度 φ", TEA)]
    ys = []
    for i, (t1, t2, c) in enumerate(items):
        y = 30 + i * (bh + gap)
        ys.append(y)
        o.append(_f21_vbox(x0, y, bw, bh, t1, t2, c=c, tc=(SIG if c == SIG else (TEA if c == TEA else INK))))
        if i > 0:
            o.append(ARR(x0 + bw / 2, ys[i - 1] + bh, x0 + bw / 2, y, c=GLD if i <= 3 else SIG, lw=1.6))
    # センサからマイコンへ戻る線
    xr = x0 + bw + 8
    o.append(W(x0 + bw, ys[4] + bh / 2, xr, ys[4] + bh / 2, xr, ys[0] + bh / 2, c=TEA, lw=1.5))
    o.append(ARR(xr, ys[0] + bh / 2, x0 + bw + 1, ys[0] + bh / 2, c=TEA, lw=1.5, head=6))
    return SVG(704, 286, o, cap="倒立振子の装置（値はどれも例の値）。(a) 台車はレールの上を、モータの回すベルトで動く。振子の角度は軸の角度センサで、台車の位置はモータの軸の回転から測る。緑の破線は、台車が動いてよい範囲（仕様）。(b) マイコンは 1 ms ごとに 2 つの値を測り、状態を推定して力を計算し、モータドライバへ電流の指令として渡す。")


F["e21_system"] = _f21_system_fig()


# =====================================================================
# 1 節: 仕様を、波形の許される範囲として描く（19 章の設計: すべての状態を測る）
# =====================================================================
def _f21_band(P, x0, x1, y0, y1):
    """Plot P の (x0..x1, y0..y1) を、許されない範囲として薄い赤で塗る（枠で切る）。"""
    xa, xb = max(P.xr[0], x0), min(P.xr[1], x1)
    ya, yb = max(P.yr[0], min(y0, y1)), min(P.yr[1], max(y0, y1))
    if xb <= xa or yb <= ya:
        return ""
    return RECT(P.X(xa), P.Y(yb), P.X(xb) - P.X(xa), P.Y(ya) - P.Y(yb), 0, ASOFT, "none", 0)


def _f21_spec_fig():
    o = []
    T_ = 4.0
    r1 = _f21_run(T=T_, est="true", x0=(0, 0, 10 * _F21_D, 0))
    r2 = _f21_run(T=T_, est="true", push=(0.5, 0.1, 1.0))
    cols = [("(a) 10° から静かに放す", r1, 2.5), ("(b) おもりを右へ 1 N で 0.1 s 押す", r2, 3.5)]
    rows = [("角度 φ [°]", lambda r: r["x"][:, 2] / _F21_D, (-15, 12), [-10, -5, 0, 5, 10], SIG),
            ("台車の位置 p [cm]", lambda r: r["x"][:, 0] * 100, (-45, 45), [-35, 0, 35], SIG),
            ("力 u [N]", lambda r: r["u"], (-6.5, 6.5), [-5, 0, 5], GLD)]
    pw, ph, x0s = 270, 74, (66, 418)
    for ci, (title, r, tok) in enumerate(cols):
        x0 = x0s[ci]
        o.append(T(x0 - 50, 18, title, "start", 11.5, INK, True))
        for ri, (yl, fy, yr, yt, c) in enumerate(rows):
            y0 = 32 + ri * (ph + 26)
            P = Plot(x0, y0, pw, ph, (0, T_), yr)
            if ri == 0:
                o.append(_f21_band(P, tok, T_, 2, 99)); o.append(_f21_band(P, tok, T_, -99, -2))
            elif ri == 1:
                o.append(_f21_band(P, 0, T_, 35, 99)); o.append(_f21_band(P, 0, T_, -99, -35))
            else:
                o.append(_f21_band(P, 0, T_, 5, 99)); o.append(_f21_band(P, 0, T_, -99, -5))
            o.append(P.axes(xl="時間 t [s]" if ri == 2 else None, yt=yt, xt=[0, 1, 2, 3, 4],
                            xfmt=(lambda v: "%g" % v) if ri == 2 else (lambda v: ""), yfmt=lambda v: ("%g" % v).replace("-", "−")))
            o.append(T(x0 + pw - 4, y0 + 11, yl, "end", 9.5, INK, True, halo=True))
            o.append(P.clip(list(zip(r["t"], fy(r))), c=c, lw=2))
        # 許される範囲の説明
    o.append(T(x0s[0] + 4, 32 + ph - 6, "2.5 s 後は ±2° の内側", "start", 9, ALI, halo=True))
    o.append(T(x0s[1] + 4, 32 + ph - 6, "押して 3 s 後は ±2° の内側", "start", 9, ALI, halo=True))
    o.append(T(x0s[0] + 4, 32 + ph + 26 + 12, "±35 cm の外へ出ない", "start", 9, ALI, halo=True))
    o.append(T(x0s[0] + 4, 32 + 2 * (ph + 26) + 12, "±5 N を超えて出せない", "start", 9, ALI, halo=True))
    return SVG(704, 32 + 3 * (ph + 26) + 22, o, cap="仕様を、波形が入ってはいけない範囲（薄い赤）として描いたもの。青と金の線は、19 章 4 節の最適レギュレータで、すべての状態を誤差なく測れるとしたときの応答（摩擦なし、力の上限 5 N）。(a) 10° から放す試験、(b) おもりを押す試験。どちらも許される範囲に入っている。")


F["e21_spec"] = _f21_spec_fig()


# =====================================================================
# 2 節: モータで台車を動かす（電圧 → 電流 → トルク → 力）
# =====================================================================
_F21_RA, _F21_KT, _F21_J, _F21_RP = 2.0, 0.02, 1e-5, 0.02     # 2 章 3 節のモータ、プーリーの半径 20 mm（例の値）


def _f21_motor_fig():
    o = []
    o.append(T(12, 18, "(a) プーリーとベルトで、回転を台車の動きに直す", "start", 11.5, INK, True))
    # モータとプーリー（左）、ベルト、台車（右）
    cxm, cym, R = 92, 112, 34
    o.append(CIRC(cxm, cym, R + 14, c=GLD, lw=1.4, fill=GOSOFT))
    o.append(CIRC(cxm, cym, R, c=MUT, lw=1.6, fill=SCR))
    o.append(D(cxm, cym, INK, 3))
    o.append(W(cxm, cym, cxm + R * 0.8, cym - R * 0.6, c=INK, lw=1.2))
    o.append(TX(cxm + 8, cym - 16, "r_p", "start", 10, INK, halo=True))
    o.append(CARR(cxm - R - 22, cym + 12, cxm - 6, cym - R - 20, 0.32, c=GLD, lw=1.6))
    o.append(TX(cxm - 64, cym - 36, "トルク K_t i", "middle", 10, GLD, True, halo=True))
    o.append(TX(cxm, cym + R + 32, "角速度 ω_m = \\dot{p}/r_p", "middle", 10, INK, halo=True))
    # ベルト（上下）と台車
    xt = 300
    o.append(W(cxm, cym - R, xt, cym - R, c=MUT, lw=1.6)); o.append(W(cxm, cym + R, xt + 40, cym + R, c=MUT, lw=1.6))
    o.append(RECT(xt - 4, cym - R - 26, 72, 34, 5, SSOFT, SIG, 1.5))
    o.append(T(xt + 32, cym - R - 5, "台車", "middle", 10.5, SIG, True))
    o.append(ARR(xt + 70, cym - R - 9, xt + 112, cym - R - 9, c=GLD, lw=2.2))
    o.append(TX(xt + 116, cym - R - 5, "力 u", "start", 10, GLD, True))
    o.append(ARR(xt + 36, cym - R + 20, xt + 76, cym - R + 20, c=SIG, lw=1.4))
    o.append(TX(xt + 80, cym - R + 24, "速さ \\dot{p}", "start", 10, SIG))
    # 式
    yq = 214
    o.append(TX(20, yq, "回る側: J\\dot{ω}_m = K_t i − r_p u　→　u = (K_t/r_p) i − (J/r_p^2) \\ddot{p}", "start", 10.5, INK))
    o.append(TX(20, yq + 20, "電気の側（2 章 3 節）: L_a di/dt + R_a i + (K_t/r_p) \\dot{p} = v", "start", 10.5, INK))
    o.append(TX(20, yq + 40, "K_t/r_p = 0.02/0.02 = 1.0 N/A（= V/(m/s)）、J/r_p^2 = 10^{−5}/0.02^2 = 0.025 kg", "start", 10.5, SIG, True))
    # (b) 2 つの動かし方
    xb = 448
    o.append(T(xb - 6, 18, "(b) 電圧で動かす（インダクタンスは無視）", "start", 11.5, INK, True))
    yc = 70
    s, pos, xe = CHAIN(xb, yc, [("a", 18, "v", GLD), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 14, None, GLD),
                               ("b", ("1", "R_a"), "ra", LIN), ("a", 20, "i", GLD), ("b", "1.0", "kt", LIN), ("a", 20, "u", GLD),
                               ("b", "台車", "cart", SIG), ("a", 22, "\\dot{p}", SIG), ("t", "pv", SIG)])
    o.append(s)
    o.append(FBPATH(pos["pv"], pos["s1"], yc, 50, c=SIG, box="1.0"))
    o.append(TX(pos["pv"] - 4, yc + 66, "逆起電力 (K_t/r_p) \\dot{p}", "end", 9.5, SIG))
    o.append(TX(xb, yc + 96, "u = 0.5 v − 0.5 \\dot{p}（ダンパ 0.5 N·s/m と同じ）", "start", 10, INK))
    o.append(T(xb - 6, yc + 128, "(c) 電流で動かす（14 章 4 節の内側のループ）", "start", 11.5, INK, True))
    yc2 = yc + 164
    s2, pos2, xe2 = CHAIN(xb, yc2, [("a", 30, "i_{ref}", GLD), ("b", "電流のループ", "cl", SIG), ("a", 26, "i", GLD), ("b", "1.0", "kt2", LIN), ("a", 34, "u", GLD)])
    o.append(s2)
    o.append(TX(xb, yc2 + 36, "u = 1.0 × i（速さによらない）。上限 5 A → 5 N", "start", 10, INK))
    return SVG(704, 278, o, cap="(a) モータの軸のプーリー（半径 20 mm、例の値）がベルトで台車を引く。回る側の運動の法則から、台車を押す力は電流に比例する分と、回転子とプーリーを回す分に分かれる。(b) 電圧で動かすと、逆起電力が速さに比例した力を引くので、台車にダンパを付けたのと同じになる。(c) モータドライバの電流のループが電流を指令に合わせれば、力は電流の指令に比例し、速さによらない。")


F["e21_motor"] = _f21_motor_fig()


# =====================================================================
# 2 節: パラメータを測る（吊り下げた振子の揺れ・力の段差）
# =====================================================================
def _f21_swing(T=6.0, th0=5.0, zeta=0.01, l=_F21_l, seed=21):
    """台車を押さえ、吊り下げた振子を th0 [°] から放した記録（1 ms ごと、角度のノイズ 0.1°）。
    軸の摩擦を減衰比 zeta の粘性摩擦として足す（例の値）。返り値 (t, 測った角度 [°], 読んだ周期, 読んだ l)。"""
    h = 0.001; n = int(round(T / h)); wn = math.sqrt(_F21_g / l)
    x = (th0 * _F21_D, 0.0); rg = _F21Rng(seed); ts, ys = [], []
    f = lambda z: (z[1], -_F21_g / l * math.sin(z[0]) - 2 * zeta * wn * z[1])
    for k in range(n + 1):
        ts.append(k * h); ys.append(x[0] / _F21_D + 0.1 * rg.normal())
        k1 = f(x); k2 = f((x[0] + h / 2 * k1[0], x[1] + h / 2 * k1[1])); k3 = f((x[0] + h / 2 * k2[0], x[1] + h / 2 * k2[1]))
        k4 = f((x[0] + h * k3[0], x[1] + h * k3[1]))
        x = (x[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]))
    ts = _f21_np.array(ts); ys = _f21_np.array(ys)
    # 21 点の移動平均でならしてから、0 を横切る時刻（上向き・下向きの両方）を直線で補って読む
    ker = _f21_np.ones(21) / 21; sm = _f21_np.convolve(ys, ker, mode="same")
    zc = []
    for i in range(20, len(sm) - 21):
        if (sm[i] < 0 <= sm[i + 1]) or (sm[i] >= 0 > sm[i + 1]):
            zc.append(ts[i] + (ts[i + 1] - ts[i]) * (-sm[i]) / (sm[i + 1] - sm[i]))
    per = (zc[10] - zc[0]) / 5
    wd = 2 * math.pi / per
    return ts, ys, zc, per, _F21_g / wd ** 2


def _f21_steps(forces=(0.5, 0.75, 1.0), T=0.6, M=_F21_M, Fc=_F21_FC, seed=22):
    """振子を外した台車に、電流の指令で一定の力を加えた記録（1 ms ごと、位置のノイズ 1 mm）。
    返り値 [(力, t, 測った位置, 当てはめた加速度), ...]。当てはめは p = c0 + c1 t + a t²/2 の最小二乗。"""
    out = []; rg = _F21Rng(seed)
    for u in forces:
        a_true = (u - Fc) / M
        ts = _f21_np.arange(0, T + 1e-9, 0.001)
        ps = 0.5 * a_true * ts ** 2 + _f21_np.array([_F21_SP * rg.normal() for _ in ts])
        Aq = _f21_np.vstack([_f21_np.ones_like(ts), ts, 0.5 * ts ** 2]).T
        coef = _f21_np.linalg.lstsq(Aq, ps, rcond=None)[0]
        out.append((u, ts, ps, coef[2]))
    return out


def _f21_ident_fig():
    o = []
    ts, ys, zc, per, lest = _f21_swing()
    o.append(T(12, 18, "(a) 台車を押さえ、吊り下げた振子を 5° から放す", "start", 11.5, INK, True))
    P = Plot(60, 32, 610, 96, (0, 6), (-6, 6))
    o.append(P.axes(xl="時間 t [s]", yl="角度 [°]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[-5, 0, 5], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(P.line(list(zip(ts[::4], ys[::4])), c=TEA, lw=1.0))
    for i in range(11):
        o.append(D(P.X(zc[i]), P.Y(0), GLD, 2.6))
    for i in (0, 10):
        o.append(W(P.X(zc[i]), P.y, P.X(zc[i]), P.y + P.h, c=GLD, lw=1.4, dash="4 3"))
    yy = P.Y(5.3)
    o.append(DARR(P.X(zc[0]), yy, P.X(zc[10]), yy, c=GLD, lw=1.3))
    o.append(T((P.X(zc[0]) + P.X(zc[10])) / 2, yy - 4, "5 周期 = %.3f s → 周期 %.4f s" % (zc[10] - zc[0], per), "middle", 9.5, GLD, True, halo=True))
    o.append(TX(P.x + P.w - 6, P.y + P.h - 8, "l = g/(2π/周期)^2 = %.3f m" % lest, "end", 10, SIG, True, halo=True))
    # (b) 力の段差
    st = _f21_steps()
    o.append(T(12, 186, "(b) 振子を外し、一定の力で押す", "start", 11.5, INK, True))
    Pb = Plot(60, 200, 270, 120, (0, 0.6), (0, 0.32))
    o.append(Pb.axes(xl="時間 t [s]", yl="台車の位置 p [m]", xt=[0, 0.2, 0.4, 0.6], yt=[0, 0.1, 0.2, 0.3]))
    cols = [TEA, PUR, GLD]
    for (u, tt, pp, a), c in zip(st, cols):
        o.append(Pb.line(list(zip(tt[::6], pp[::6])), c=c, lw=1.0))
        o.append(Pb.line([(t_, 0.5 * a * t_ * t_) for t_ in _f21_np.linspace(0, 0.6, 61)], c=c, lw=1.6, dash="5 3"))
        o.append(T(Pb.X(0.6) + 4, Pb.Y(0.5 * a * 0.36) + 4, "%g N" % u, "start", 9.5, c, True))
    o.append(T(Pb.x + 6, Pb.y + 12, "点: 測った位置　破線: 当てはめた放物線", "start", 9, MUT, halo=True))
    # (c) 加速度と力
    us = _f21_np.array([s_[0] for s_ in st]); As = _f21_np.array([s_[3] for s_ in st])
    k1, k0 = _f21_np.polyfit(us, As, 1)
    Mest, Fcest = 1 / k1, -k0 / k1
    o.append(T(386, 186, "(c) 加速度と力の直線", "start", 11.5, INK, True))
    Pc = Plot(424, 200, 250, 120, (0, 1.1), (-0.7, 1.6))
    o.append(Pc.axes(xl="力 u [N]", yl="加速度 [m/s²]", xt=[0, 0.3, 0.5, 0.75, 1.0], yt=[-0.5, 0, 0.5, 1, 1.5],
                     xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pc.x, Pc.Y(0), Pc.x + Pc.w, Pc.Y(0), c=MUT, lw=1))
    o.append(Pc.line([(0, k0), (1.1, k0 + 1.1 * k1)], c=SIG, lw=1.6))
    for u, a_, c in zip(us, As, cols):
        o.append(D(Pc.X(u), Pc.Y(a_), c, 4))
    o.append(D(Pc.X(Fcest), Pc.Y(0), ALI, 4))
    o.append(T(Pc.X(Fcest) - 4, Pc.Y(0) + 14, "%.2f N = 摩擦" % Fcest, "end", 9.5, ALI, True, halo=True))
    o.append(T(Pc.x + 6, Pc.y + 12, "傾き %.2f /kg → M = %.3f kg" % (k1, Mest), "start", 9.5, SIG, True, halo=True))
    return SVG(704, 364, o, cap="パラメータを測る試験の記録（ノイズのある測定を数値計算で作ったもの。本当の値は l = 0.3 m、M = 0.5 kg、摩擦 0.3 N）。(a) 吊り下げた振子の揺れ。ノイズをならしてから 0 を横切る時刻を読み、5 周期の長さから周期と l を求める。(b) 3 つの大きさの力で押したときの台車の位置と、当てはめた放物線。(c) 放物線の加速度を力に対して並べた直線の傾きが 1/M、加速度が 0 になる力が摩擦の大きさ。")


F["e21_ident"] = _f21_ident_fig()


# =====================================================================
# 3 節: 角度だけの PID・カスケード・状態フィードバック（連続の制御器、すべての状態を測る、摩擦なし）
# =====================================================================
_F21_KP, _F21_KD, _F21_KI = 30.19, 3.741, 30.19          # 角度の PD（極 −12.47 の 2 つ）と、I を足すときの K_I（T_I = 1 s）
_F21_KPO, _F21_KDO = 0.15, 0.16                         # カスケードの外側（位置の PD）[rad/m]・[rad/(m/s)]


def _f21_ctrl(kind, off=0.0):
    """連続の制御器 u(z)。z = [p, ṗ, φ, φ̇, w]（w = 測った角度の積分）。off は角度のセンサの 0 点のずれ [rad]。"""
    KP, KD, KI, KPO, KDO = _F21_KP, _F21_KD, _F21_KI, _F21_KPO, _F21_KDO
    F = _F21_FLQ
    if kind == "pd":
        return lambda z: KP * (z[2] + off) + KD * z[3]
    if kind == "pid":
        return lambda z: KP * (z[2] + off) + KD * z[3] + KI * z[4]
    if kind == "casc":
        return lambda z: KP * (z[2] + off + KPO * z[0] + KDO * z[1]) + KD * z[3]
    return lambda z: -(F[0] * z[0] + F[1] * z[1] + F[2] * (z[2] + off) + F[3] * z[3])


def _f21_cont(kind, x0=(0, 0, 0, 0), T=6.0, h=0.002, off=0.0, push=None, every=5):
    """連続の制御器で閉ループを 4 次のルンゲ・クッタ法で解く（18 章の _f18_run と同じ考え方。押す力は刻みの境目で切り替える）。"""
    u = _f21_ctrl(kind, off)
    z = list(x0) + [0.0]; n = int(round(T / h)); cur = [0.0]
    M, m, l = _F21_M, _F21_m, _F21_l

    def f(zz):
        a = _f21_acc(zz[:4], u(zz), cur[0], M, m, l)
        return list(a) + [zz[2] + off]
    ts, xs, us = [0.0], [tuple(z)], [u(z)]
    for k in range(n):
        tk = k * h
        cur[0] = push[2] if (push and push[0] - 1e-9 <= tk < push[0] + push[1] - 1e-9) else 0.0
        k1 = f(z); k2 = f([z[i] + h / 2 * k1[i] for i in range(5)]); k3 = f([z[i] + h / 2 * k2[i] for i in range(5)])
        k4 = f([z[i] + h * k3[i] for i in range(5)])
        z = [z[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) for i in range(5)]
        if (k + 1) % every == 0:
            ts.append((k + 1) * h); xs.append(tuple(z)); us.append(u(z))
    return _f21_np.array(ts), _f21_np.array(xs), _f21_np.array(us)


_F21_CS = {"pd": (ALI, "5 3", "角度の PD"), "pid": (GLD, "2 3", "角度の PID"), "casc": (PUR, None, "カスケード"), "lqr": (SIG, None, "19 章の F")}


def _f21_pid_fig():
    o = []
    th0 = 10 * _F21_D
    R = {k: _f21_cont(k, (0, 0, th0, 0), T=6.0) for k in ("pd", "pid", "casc", "lqr")}
    # (a) 角度とその面積
    o.append(T(12, 18, "(a) 10° から放したときの角度と、その面積", "start", 11.5, INK, True))
    Pa = Plot(60, 30, 270, 112, (0, 2), (-6, 10.5))
    o.append(Pa.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 0.5, 1, 1.5, 2], yt=[-5, 0, 5, 10], yfmt=lambda v: ("%g" % v).replace("-", "−"), xfmt=lambda v: "%g" % v))
    for k in ("pd", "lqr"):
        t, x, _ = R[k]; c = _F21_CS[k][0]
        sel = t <= 2.0
        pts = [(Pa.X(a), Pa.Y(b / _F21_D)) for a, b in zip(t[sel], x[sel, 2])]
        o.append(PL([(Pa.X(0), Pa.Y(0))] + pts + [(Pa.X(t[sel][-1]), Pa.Y(0))], c="none", lw=0, fill=soft(c), op=0.75))
        o.append(Pa.line(list(zip(t[sel], x[sel, 2] / _F21_D)), c=c, lw=2, dash=_F21_CS[k][1]))
    tp, xp, _ = R["pd"]; area_pd = _f21_np.trapezoid(xp[:, 2], tp)
    tl, xl_, _ = R["lqr"]; area_lq = _f21_np.trapezoid(xl_[:, 2], tl)
    o.append(T(Pa.X(0.42), Pa.Y(6.2), "角度の PD: 面積 %.4f rad·s" % area_pd, "start", 9.5, ALI, True, halo=True))
    o.append(T(Pa.X(0.62), Pa.Y(-3.6), "19 章の F: 面積 %.4f rad·s" % abs(area_lq), "start", 9.5, SIG, True, halo=True))
    # (b) 台車の速さ
    o.append(T(386, 18, "(b) 台車の速さ", "start", 11.5, INK, True))
    Pb = Plot(424, 30, 260, 112, (0, 6), (-0.3, 0.6))
    o.append(Pb.axes(xl="時間 t [s]", yl="速さ [m/s]", xt=[0, 2, 4, 6], yt=[-0.2, 0, 0.2, 0.4], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pb.x, Pb.Y(0), Pb.x + Pb.w, Pb.Y(0), c=MUT, lw=1))
    for k in ("pd", "pid", "casc", "lqr"):
        t, x, _ = R[k]; c, dash, _lab = _F21_CS[k]
        o.append(Pb.clip(list(zip(t, x[:, 1])), c=c, lw=2, dash=dash))
    vpd = R["pd"][1][-1, 1]
    o.append(T(Pb.X(6) - 4, Pb.Y(vpd) - 6, "%.3f m/s のまま（g × 面積 = %.3f）" % (vpd, _F21_g * area_pd), "end", 9.5, ALI, True, halo=True))
    # (c) 台車の位置
    o.append(T(12, 200, "(c) 台車の位置", "start", 11.5, INK, True))
    Pc = Plot(60, 212, 270, 120, (0, 6), (-0.2, 0.7))
    o.append(Pc.axes(xl="時間 t [s]", yl="位置 p [m]", xt=[0, 2, 4, 6], yt=[0, 0.25, 0.5], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pc.x, Pc.Y(0.5), Pc.x + Pc.w, Pc.Y(0.5), c=ALI, lw=1.2, dash="4 3"))
    o.append(T(Pc.x + Pc.w - 4, Pc.Y(0.5) - 5, "レールの端 0.5 m", "end", 9, ALI, halo=True))
    for k in ("pd", "pid", "casc", "lqr"):
        t, x, _ = R[k]; c, dash, _lab = _F21_CS[k]
        o.append(Pc.clip(list(zip(t, x[:, 0])), c=c, lw=2, dash=dash))
    ppid = R["pid"][1][-1, 0]
    o.append(T(Pc.X(6) - 4, Pc.Y(ppid) + 14, "PID: %.2f m で止まる" % ppid, "end", 9.5, GLD, True, halo=True))
    # (d) 角度のセンサの 0 点が 0.5° ずれたとき
    o.append(T(386, 200, "(d) 角度のセンサの 0 点が 0.5° ずれたとき", "start", 11.5, INK, True))
    Pd = Plot(424, 212, 260, 120, (0, 6), (-0.6, 0.1))
    o.append(Pd.axes(xl="時間 t [s]", yl="位置 p [m]", xt=[0, 2, 4, 6], yt=[-0.5, -0.25, 0], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pd.x, Pd.Y(-0.5), Pd.x + Pd.w, Pd.Y(-0.5), c=ALI, lw=1.2, dash="4 3"))
    for k in ("pd", "pid", "casc", "lqr"):
        t, x, _ = _f21_cont(k, (0, 0, 0, 0), T=6.0, off=0.5 * _F21_D)
        c, dash, _lab = _F21_CS[k]
        o.append(Pd.clip(list(zip(t, x[:, 0])), c=c, lw=2, dash=dash))
        if k == "lqr":
            o.append(T(Pd.X(6) - 4, Pd.Y(x[-1, 0]) + 14, "19 章の F: %.1f cm" % (x[-1, 0] * 100), "end", 9.5, SIG, True, halo=True))
    o.append(LEGL(60, 374, [(_F21_CS[k][0], _F21_CS[k][1], _F21_CS[k][2]) for k in ("pd", "pid", "casc", "lqr")]))
    return SVG(704, 384, o, cap="角度だけを戻す PD・PID と、台車の位置も戻すカスケード・状態フィードバックの比較（線形でない式、すべての状態を測れるとき、力の上限なし）。(a) 振子が立った後の台車の速さは、角度の面積の g 倍になる。角度の PD は面積が正のまま残り、19 章の F は反対側へ傾いて面積を 0 にする。(b)(c) PD の台車は流れ続け、PID は止まるが戻らない。(d) 角度のセンサの 0 点がずれると、角度だけの制御では台車が加速し続ける。")


F["e21_pid"] = _f21_pid_fig()


def _f21_cascade_fig():
    o = []
    o.append(T(12, 18, "(a) カスケードの PID: 外側のループが、内側のループの角度の目標値を決める", "start", 11.5, INK, True))
    yc = 70
    s, pos, xe = CHAIN(22, yc, [("a", 34, "r = 0", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 24, None, INK),
                               ("b", "K_{Po} + K_{Do} s", "c1", LIN), ("a", 50, "φ_{ref}", INK), ("s", {"l": "+", "b": "−"}, "s2"),
                               ("a", 24, None, INK), ("b", "−(K_P + K_D s)", "c2", SIG), ("a", 46, "u", GLD),
                               ("b", "台車と振子", "pl", LIN), ("a", 40, "φ", SIG), ("t", "tp", SIG)])
    o.append(s)
    o.append(FBPATH(pos["tp"], pos["s2"], yc, 34, c=SIG))
    o.append(T((pos["tp"] + pos["s2"]) / 2, yc + 30, "内側のループ（角度）", "middle", 9.5, SIG, True, halo=True))
    xp = (pos["pl"][0] + pos["pl"][1]) / 2
    o.append(W(xp, yc + 17, xp, yc + 66, pos["s1"], yc + 66, c=PUR, lw=1.5))
    o.append(ARR(pos["s1"], yc + 66, pos["s1"], yc + 15, c=PUR, lw=1.5, head=6))
    o.append(TX(xp + 6, yc + 50, "p", "start", 10, PUR, True))
    o.append(T((xp + pos["s1"]) / 2, yc + 62, "外側のループ（台車の位置）", "middle", 9.5, PUR, True, halo=True))
    # (b) 状態フィードバックとの対応
    yb = 172
    o.append(T(12, yb, "(b) 展開すると、状態フィードバックになる", "start", 11.5, INK, True))
    o.append(TX(20, yb + 24, "φ_{ref} = −K_{Po} p − K_{Do} \\dot{p}、　u = K_P(φ − φ_{ref}) + K_D \\dot{φ}", "start", 10.5, INK))
    o.append(TX(20, yb + 46, "u = K_P K_{Po} p + K_P K_{Do} \\dot{p} + K_P φ + K_D \\dot{φ} = −F x", "start", 10.5, INK, True))
    rows = [("", "K_P", "K_D", "K_{Po}", "K_{Do}", "F", None),
            ("内側から 1 段ずつ", "30.19", "3.741", "0.15", "0.16", "[−4.53, −4.83, −30.19, −3.74]", PUR),
            ("19 章の F を直す", "30.19", "4.925", "0.331", "0.228", "[−10.00, −6.90, −30.19, −4.93]", SIG)]
    xs = [20, 132, 180, 226, 274, 322]
    for i, r in enumerate(rows):
        yy = yb + 76 + i * 20
        for j in range(6):
            o.append(TX(xs[j], yy, r[j], "start", 10, (r[6] or MUT) if i else MUT, bool(i == 0 or j == 0)))
    o.append(W(18, yb + 81, 470, yb + 81, c=LIN, lw=1))
    # (c) 閉ループの極
    o.append(T(498, yb, "(c) 閉ループの極", "start", 11.5, INK, True))
    P = Plot(512, yb + 14, 180, 120, (-8, 8), (-10, 10))
    o.append(RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8)); o.append(SPLANE(P))
    o.append(P.axes(xt=[-8, -4, 0, 4, 8], yt=[-8, 0, 8], grid=False, sz=9, xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(PZ(P, [0j, 6.766 + 0j, -6.766 + 0j], [], c=MUT, r=4.5))
    Fc_ = [-_F21_KP * _F21_KPO, -_F21_KP * _F21_KDO, -_F21_KP, -_F21_KD]
    for F_, c in ((Fc_, PUR), (_F21_FLQ, SIG)):
        ev = _f21_np.linalg.eigvals(_F21_A - _F21_B @ _f21_np.array(F_)[None, :])
        o.append(PZ(P, ev, [], c=c, r=5))
    o.append(T(P.x + P.w - 4, P.y + P.h - 6, "灰: 開ループ", "end", 9, MUT, halo=True))
    o.append(T(P.x + P.w - 3, P.Y(0) - 5, "実部", "end", 9, MUT, halo=True))
    o.append(T(P.X(0) + 4, P.y + 11, "虚部", "start", 9, MUT, halo=True))
    return SVG(704, 340, o, cap="(a) 台車の位置の偏差から振子の角度の目標値を作り（外側）、角度をそれに合わせる力を出す（内側）。力から角度への伝達関数は負なので、内側の制御器には負の符号が付く。(b) 2 つの PD を展開すると、4 つの状態に比例した力、つまり状態フィードバックになる（18 章 3 節）。(c) 内側から 1 段ずつ決めたカスケード（紫）は、外側の極が −1.26 ± j1.03 と遅い。19 章の F（青）は、同じ形で、4 つのゲインを評価関数から一度に決めたもの。")


F["e21_cascade"] = _f21_cascade_fig()


# =====================================================================
# 4・5 節: 実装した形（1 周期の計算遅れ (B)、推定あり）の、入力の点で切ったループ
# =====================================================================
from scipy import signal as _f21_sg


def _f21_loop_tf(F, Ts, H=None, Ad=None, Bd=None, timing="B"):
    """入力の点で切った一巡伝達関数 L(z) を、状態方程式のまま表す（1 ms では極が z = 1 のすぐ近くに集まり、
    分子と分母の多項式に直すと桁落ちするため）。H が None なら、すべての状態を測る（(A): u_k = −F x_k、(B): u_{k+1} = −F x_k）。
    H があれば、カルマンフィルタ（予測と更新）で推定し、(B) で出す: x̂ = x̂⁻ + H(y − C x̂⁻)、u_{k+1} = −F x̂、x̂⁻ ← A_d x̂ + B_d u_k。"""
    F = _f21_np.asarray(F, float)
    if Ad is None:
        Ad, Bd = _f21_c2d(_F21_A, _F21_B, Ts)
    if H is None:
        return {"kind": "full", "F": F, "Ad": Ad, "Bd": Bd, "B": timing == "B"}
    I = _f21_np.eye(4); C = _F21_C
    Ac = _f21_np.zeros((5, 5)); Bc = _f21_np.zeros((5, 2))
    Ac[:4, :4] = Ad @ (I - H @ C); Ac[:4, 4] = Bd[:, 0]; Bc[:4, :] = Ad @ H
    Ac[4, :4] = -F @ (I - H @ C); Bc[4, :] = -F @ H
    return {"kind": "est", "Ac": Ac, "Bc": Bc, "Ad": Ad, "Bd": Bd}


def _f21_loop_eval(L, Ts, ws):
    z = _f21_np.exp(1j * _f21_np.asarray(ws, float) * Ts)
    N = len(z)
    def res(A, B):     # (zI − A)^{-1} B をすべての z でまとめて解く
        n = A.shape[0]
        M_ = z[:, None, None] * _f21_np.eye(n)[None, :, :] - A[None, :, :]
        return _f21_np.linalg.solve(M_, _f21_np.broadcast_to(B, (N,) + B.shape).astype(complex))
    G = res(L["Ad"], L["Bd"])                       # (N, 4, 1)
    if L["kind"] == "full":
        v = _f21_np.einsum("i,nij->n", L["F"], G)
        return v / z if L["B"] else v
    P = _f21_np.einsum("ij,njk->nik", _F21_C, G)[:, :, 0]      # (N, 2)
    K = res(L["Ac"], L["Bc"])[:, 4, :]                          # (N, 2)  出力は u（5 番目の状態）
    return -(K * P).sum(axis=1)


def _f21_margins(L, Ts, wlo=0.1):
    """位相余裕 [°]・ゲイン交差角周波数・許されるむだ時間 [s]・安定な力の倍率の範囲 (下限, 上限)・−1 からの最短距離。"""
    whi = math.pi / Ts * 0.999
    ws = _f21_np.logspace(math.log10(wlo), math.log10(whi), 6000)
    v = _f21_loop_eval(L, Ts, ws); mag = _f21_np.abs(v)
    f = lambda w: abs(_f21_loop_eval(L, Ts, [w])[0]) - 1
    pm, wgc = None, None
    for i in range(1, len(ws)):
        if (mag[i - 1] - 1) * (mag[i] - 1) < 0:
            from scipy.optimize import brentq as _bq
            wgc = _bq(f, ws[i - 1], ws[i], xtol=1e-10)
            ph = math.degrees(_f21_np.angle(_f21_loop_eval(L, Ts, [wgc])[0]))
            pm = (ph + 180) % 360
            if pm > 180:
                pm -= 360
            break
    lo, hi = 0.0, float("inf")
    for i in range(1, len(ws)):
        if v[i - 1].imag * v[i].imag < 0:
            a = v[i - 1].real + (v[i].real - v[i - 1].real) * (-v[i - 1].imag) / (v[i].imag - v[i - 1].imag)
            if a < -1:
                lo = max(lo, -1 / a)
            elif -1 < a < 0:
                hi = min(hi, -1 / a)
    return pm, wgc, (math.radians(pm) / wgc if pm else None), (lo, hi), float(_f21_np.abs(1 + v).min())


def _f21_kf_phys(Ts, mul=1.0):
    """20 章の 1 ms のプロセスノイズ（0.3 m/s²・3 rad/s²）を 1 s あたりの強さで同じにして、T_s での標準偏差に直す。mul はその分散の倍率。"""
    k = math.sqrt(mul * 0.001 / Ts)
    return _f21_kf(Ts, 0.3 * k, 3.0 * k)


def _f21_force_std(F, Ts, H, Ad, Bd):
    """観測ノイズだけによる力の揺れの標準偏差（線形の式、(B) で出す）。"""
    I = _f21_np.eye(4); C = _F21_C
    Ac = _f21_np.zeros((5, 5)); Bc = _f21_np.zeros((5, 2))
    Ac[:4, :4] = Ad @ (I - H @ C); Ac[:4, 4] = Bd[:, 0]; Bc[:4, :] = Ad @ H
    Ac[4, :4] = -F @ (I - H @ C); Bc[4, :] = -F @ H
    Phi = _f21_np.zeros((9, 9)); Phi[:4, :4] = Ad; Phi[:4, 8] = Bd[:, 0]
    Phi[4:, :4] = Bc @ C; Phi[4:, 4:] = Ac
    G = _f21_np.zeros((9, 2)); G[4:, :] = Bc
    S = _f21_la.solve_discrete_lyapunov(Phi, G @ _f21_np.diag([_F21_SP ** 2, _F21_SPH ** 2]) @ G.T)
    return math.sqrt(S[8, 8])


def _f21_ts_fig():
    o = []
    tss = [0.001, 0.002, 0.003, 0.005, 0.007, 0.01, 0.015, 0.02, 0.03]
    fa, fb, kb, ns = [], [], [], []
    for Ts in tss:
        fa.append(_f21_margins(_f21_loop_tf(_F21_FLQ, Ts, timing="A"), Ts)[0])
        fb.append(_f21_margins(_f21_loop_tf(_F21_FLQ, Ts, timing="B"), Ts)[0])
        H, Ad, Bd = _f21_kf_phys(Ts)
        kb.append(_f21_margins(_f21_loop_tf(_F21_FLQ, Ts, H, Ad, Bd), Ts)[0])
        ns.append(_f21_force_std(_F21_FLQ, Ts, H, Ad, Bd))
    o.append(T(12, 18, "(a) 入力の点の位相余裕とサンプリング周期", "start", 11.5, INK, True))
    P = Plot(66, 34, 400, 190, (0, 30), (0, 65))
    o.append(P.axes(xl="サンプリング周期 T_s [ms]", yl="位相余裕 [°]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 20, 40, 60]))
    o.append(W(P.x, P.Y(40), P.x + P.w, P.Y(40), c=GRN, lw=1.2, dash="5 3"))
    o.append(T(P.x + P.w - 4, P.Y(40) - 5, "仕様 8: 40°", "end", 9.5, GRN, True, halo=True))
    xs = [t * 1000 for t in tss]
    o.append(P.line([(0, 60.12), (30, 60.12 - math.degrees(17.72 * 1.5 * 0.03))], c=FNT, lw=1.2, dash="2 3"))
    for ys, c, dash in ((fa, MUT, "5 3"), (fb, SIG, None), (kb, ALI, None)):
        o.append(P.line(list(zip(xs, ys)), c=c, lw=2, dash=dash))
        for a, b in zip(xs, ys):
            o.append(D(P.X(a), P.Y(b), c, 2.8))
    o.append(LEGL(P.x - 40, P.y + P.h + 52, [(MUT, "5 3", "すべてを測り、すぐ出す (A)"), (SIG, None, "すべてを測り、次の周期の頭で出す (B)"), (ALI, None, "推定して (B)")], sz=9.5, gap=12))
    o.append(T(P.X(1) + 4, P.Y(kb[0]) - 7, "%.1f°" % kb[0], "start", 9.5, ALI, True, halo=True))
    o.append(T(P.X(1) + 4, P.Y(fb[0]) - 7, "%.1f°" % fb[0], "start", 9.5, SIG, True, halo=True))
    o.append(T(P.x + 4, P.y + P.h - 6, "細い点線: 15 章 2 節の式 60.1° − ω_gc·1.5 T_s", "start", 9, MUT, halo=True))
    # (b) 力のノイズ
    o.append(T(498, 18, "(b) 観測ノイズによる力の揺れ", "start", 11.5, INK, True))
    Pb = Plot(540, 34, 150, 190, (0, 30), (0, 0.2))
    o.append(Pb.axes(xl="T_s [ms]", yl="標準偏差 [N]", xt=[0, 10, 20, 30], yt=[0, 0.05, 0.1, 0.15, 0.2]))
    o.append(Pb.clip(list(zip(xs, ns)), c=ALI, lw=2))
    for a, b in zip(xs, ns):
        if b <= 0.2:
            o.append(D(Pb.X(a), Pb.Y(b), ALI, 2.8))
    o.append(T(Pb.X(1) + 4, Pb.Y(ns[0]) - 7, "%.3f N" % ns[0], "start", 9.5, ALI, True, halo=True))
    return SVG(704, 296, o, cap="サンプリング周期を変えたときの、入力の点で切ったループの位相余裕（19 章 6 節）と、観測ノイズによる力の揺れ（線形化した式とサンプリングした状態方程式で計算）。カルマンフィルタは、20 章の 1 ms の乱れの大きさを 1 s あたりで同じにして、周期ごとに設計し直した。周期を延ばすと、測る回数が減って推定が遅れ、余裕が減り、揺れも大きくなる。")


F["e21_ts"] = _f21_ts_fig()


# =====================================================================
# 4 節: 固定小数点（係数の大きさと Q 形式の刻み、整数で計算した力と浮動小数点の差）
# =====================================================================
def _f21_rsr(v, sft):
    """v ÷ 2^sft を四捨五入（負の数も 0 から遠い方へ。16 章 4 節の rshift_round）"""
    h = 1 << (sft - 1)
    return (v + h) >> sft if v >= 0 else -((h - v) >> sft)


class _F21Fix:
    """制御器（更新・力・予測）を整数で計算する。状態と力は小数部 fs ビット、A_d・B_d・H は小数部 fc ビット、F は小数部 ff ビット。"""

    def __init__(self, H, Ad, Bd, F, fs, fc, ff):
        q = lambda v, f: int(round(float(v) * 2 ** f))
        self.fs, self.fc, self.ff = fs, fc, ff
        self.Ad = [[q(Ad[i][j], fc) for j in range(4)] for i in range(4)]
        self.Bd = [q(Bd[i][0], fc) for i in range(4)]
        self.H = [[q(H[i][j], fc) for j in range(2)] for i in range(4)]
        self.F = [q(F[i], ff) for i in range(4)]
        self.xm = None; self.umax = q(_F21_UMAX, fs)

    def step(self, y0, y1, u_k):
        fs, fc, ff = self.fs, self.fc, self.ff
        Y0, Y1, U = int(round(y0 * 2 ** fs)), int(round(y1 * 2 ** fs)), int(round(u_k * 2 ** fs))
        if self.xm is None:
            self.xm = [Y0, 0, Y1, 0]
        e0, e1 = Y0 - self.xm[0], Y1 - self.xm[2]
        xh = [self.xm[i] + _f21_rsr(self.H[i][0] * e0 + self.H[i][1] * e1, fc) for i in range(4)]
        un = -_f21_rsr(sum(self.F[i] * xh[i] for i in range(4)), ff)
        un = max(-self.umax, min(self.umax, un))
        self.xm = [_f21_rsr(sum(self.Ad[i][j] * xh[j] for j in range(4)) + self.Bd[i] * U, fc) for i in range(4)]
        return un / 2 ** fs


class _F21Flt:
    """同じ計算を浮動小数点で（_f21_np.float32 なら C の float と同じ桁）。"""

    def __init__(self, H, Ad, Bd, F, dt=float):
        self.dt = dt
        cv = lambda a: _f21_np.asarray(a, dtype=dt)
        self.H, self.Ad, self.Bd, self.F = cv(H), cv(Ad), cv(Bd[:, 0]), cv(F)
        self.xm = None

    def step(self, y0, y1, u_k):
        dt = self.dt
        if self.xm is None:
            self.xm = _f21_np.array([y0, 0, y1, 0], dtype=dt)
        e = _f21_np.array([y0 - self.xm[0], y1 - self.xm[2]], dtype=dt)
        xh = self.xm + self.H @ e
        un = float(-(self.F @ xh)); un = max(-_F21_UMAX, min(_F21_UMAX, un))
        self.xm = self.Ad @ xh + self.Bd * dt(u_k)
        return un


def _f21_run_ctl(ctl, T=4.0, x0=(0, 0, 10 * _F21_D, 0), seed=7):
    """制御器 ctl（step(y0, y1, u_k) → 次の周期の力）を、1 ms ごと・(B) の出し方で、対象（摩擦なし）につなぐ。"""
    pl = _F21Plant(x0); rg = _F21Rng(seed); n = int(round(T / _F21_TS)); u_next = 0.0; us = []
    for k in range(n + 1):
        y0 = pl.x[0] + _F21_SP * rg.normal(); y1 = pl.x[2] + _F21_SPH * rg.normal()
        u_k = u_next
        u_next = ctl.step(y0, y1, u_k)
        us.append(u_k)
        if k == n:
            break
        pl.step(u_k, 0.0, _F21_TS)
    return _f21_np.array(us)


def _f21_fixed_fig():
    o = []
    H, Ad, Bd = _f21_kf(_F21_TS)
    # (a) 係数の大きさ
    o.append(T(12, 18, "(a) 1 ms の係数の大きさと、Q 形式の刻み", "start", 11.5, INK, True))
    P = Plot(66, 30, 300, 210, (0, 22), (1e-10, 10), ylog=True)
    o.append(P.axes(yl="係数の大きさ", xt=[], yt=[1e-10, 1e-8, 1e-6, 1e-4, 1e-2, 1],
                    yfmt=_f21_pow10))
    groups = [("A_d", [(Ad[0][1], ""), (Ad[0][2], ""), (Ad[0][3], ""), (Ad[1][2], ""), (Ad[1][3], ""), (Ad[2][2] - 1, "d"), (Ad[2][3], ""), (Ad[3][2], ""), (Ad[3][3] - 1, "d")]),
              ("B_d", [(Bd[i][0], "") for i in range(4)]),
              ("H", [(H[i][j], "") for i in range(4) for j in range(2)])]
    xk = 0.7; q16, q28 = 2.0 ** -16, 2.0 ** -28
    n0 = 0
    for gname, vals in groups:
        x_start = xk
        for v, tag in vals:
            av = abs(v)
            c = ALI if av < q16 / 2 else SIG
            o.append(W(P.X(xk), P.Y(1e-10), P.X(xk), P.Y(max(av, 1e-10)), c=c, lw=3))
            if tag == "d":
                o.append(CIRC(P.X(xk), P.Y(av), 3.5, c=c, lw=1.4, fill=SCR))
            n0 += av < q16 / 2
            xk += 1
        o.append(TX((P.X(x_start) + P.X(xk - 1)) / 2, P.y + P.h + 16, gname, "middle", 10, INK, True))
        xk += 0.6
    for qv, lab, c in ((q16, "Q16.16 の刻み 1.5 × 10⁻⁵", ALI), (q28, "Q4.28 の刻み 3.7 × 10⁻⁹", GRN)):
        o.append(W(P.x, P.Y(qv), P.x + P.w, P.Y(qv), c=c, lw=1.2, dash="5 3"))
        o.append(T(P.x + P.w - 4, P.Y(qv) - 4, lab, "end", 9, c, True, halo=True))
    o.append(T(P.x + 4, P.y + 12, "赤: Q16.16 では 0 に丸められる（%d 個）" % n0, "start", 9, ALI, True, halo=True))
    o.append(T(P.x + 4, P.y + 26, "○: 対角の要素は 1 との差", "start", 9, MUT, halo=True))
    # (b) 浮動小数点（倍精度）との差
    o.append(T(398, 18, "(b) 倍精度で計算した力との差（10° から放す）", "start", 11.5, INK, True))
    ref = _f21_run_ctl(_F21Flt(H, Ad, Bd, _F21_FLQ))
    cases = [(_F21Flt(H, Ad, Bd, _F21_FLQ, _f21_np.float32), MUT, "float（単精度）"),
             (_F21Fix(H, Ad, Bd, _F21_FLQ, 16, 16, 16), ALI, "すべて Q16.16"),
             (_F21Fix(H, Ad, Bd, _F21_FLQ, 24, 28, 24), GRN, "係数 Q4.28・信号 Q8.24")]
    Pb = Plot(440, 30, 248, 210, (0, 4), (1e-8, 1), ylog=True)
    o.append(Pb.axes(xl="時間 t [s]", yl="力の差 [N]", xt=[0, 1, 2, 3, 4], yt=[1e-8, 1e-6, 1e-4, 1e-2, 1],
                     yfmt=_f21_pow10))
    ts = _f21_np.arange(len(ref)) * _F21_TS
    maxd = []
    for ctl, c, lab in cases:
        d = _f21_np.abs(_f21_run_ctl(ctl) - ref)
        maxd.append(d.max())
        # 100 点ごとの最大で描く（1e-8 未満は 1e-8 に）
        pts = [(ts[i], max(1e-8, d[i:i + 40].max())) for i in range(0, len(d) - 1, 40)]
        o.append(Pb.line(pts, c=c, lw=1.6))
    for k in range(3):
        o.append(LEGL(440, 286 + k * 16, [(cases[k][1], None, "%s: 最大 %s N" % (cases[k][2], _f21_sci(maxd[k])))], sz=9.5))
    return SVG(704, 326, o, cap="(a) 1 ms ごとのサンプリングした状態方程式の係数 A_d・B_d と、20 章のカルマンフィルタのゲイン H（観測ノイズ 1 mm・0.1°）の大きさ。Q16.16 の刻みより小さい係数は 0 に丸められ、1 に近い対角の要素は 1 との差が大きく狂う。(b) 同じ計算を整数で行ったときの、倍精度の浮動小数点との力の差（観測ノイズあり。40 周期ごとの最大）。")


F["e21_fixed"] = _f21_fixed_fig()


# =====================================================================
# 5 節: 力の上限で立て直せる傾き
# =====================================================================
def _f21_maxtilt(**kw):
    """力の上限 5 N で、静かに放して立て直せる初めの傾き [°]（2 分法。6 s 後に角度 1° 以内・台車 5 cm 以内なら立て直せた）。"""
    lo, hi = 15.0, 36.0
    for _ in range(13):
        mid = (lo + hi) / 2
        r = _f21_run(T=6.0, x0=(0, 0, mid * _F21_D, 0), stop_deg=89.0, **kw)
        xe = r["x"][-1]
        if r["fell"] is None and abs(xe[2]) < _F21_D and abs(xe[0]) < 0.05:
            lo = mid
        else:
            hi = mid
    return lo


def _f21_sat_fig():
    o = []
    H, Ad, Bd = _f21_kf(_F21_TS)
    lim = math.degrees(math.atan(_F21_UMAX / ((_F21_M + _F21_m) * _F21_g)))
    vals = [("どんな制御器でも（18 章 4 節）", lim, MUT),
            ("極配置・すべてを測る", _f21_maxtilt(F=_F21_FPP, est="true", timing="A"), MUT),
            ("19 章の F・すべてを測る", _f21_maxtilt(est="true", timing="A"), SIG),
            ("19 章の F・推定・1 ms (B)", _f21_maxtilt(H=H, Ad=Ad, Bd=Bd), ALI)]
    o.append(T(12, 18, "(a) 力の上限 5 N で立て直せる初めの傾き", "start", 11.5, INK, True))
    x0, w = 210, 150
    for i, (lab, v, c) in enumerate(vals):
        y = 34 + i * 30
        o.append(T(x0 - 8, y + 14, lab, "end", 9.5, INK))
        o.append(RECT(x0, y + 2, w * v / 40, 18, 3, soft(c), c, 1.2))
        o.append(T(x0 + w * v / 40 + 5, y + 15, "%.1f°" % v, "start", 9.5, c, True))
    o.append(W(x0 + w * 20 / 40, 30, x0 + w * 20 / 40, 34 + 4 * 30, c=GRN, lw=1.2, dash="4 3"))
    o.append(T(x0 + w * 20 / 40, 34 + 4 * 30 + 12, "仕様 2: 20°", "middle", 9.5, GRN, True))
    vmax = vals[3][1]
    # (b) 推定・1 ms で、限界の前後から放す
    o.append(T(12, 196, "(b) 19 章の F・推定・1 ms で、%.0f° と %.0f° から放す" % (math.floor(vmax - 1), math.ceil(vmax + 1)), "start", 11.5, INK, True))
    Pa = Plot(66, 210, 270, 110, (0, 3), (-40, 90))
    Pu = Plot(424, 210, 260, 110, (0, 3), (-6, 6))
    o.append(Pa.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 1, 2, 3], yt=[-30, 0, 30, 60, 90], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(Pu.axes(xl="時間 t [s]", yl="力 u [N]", xt=[0, 1, 2, 3], yt=[-5, 0, 5], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    for v in (5, -5):
        o.append(W(Pu.x, Pu.Y(v), Pu.x + Pu.w, Pu.Y(v), c=ALI, lw=1, dash="4 3"))
    for ang, c, dash in ((math.floor(vmax - 1), GRN, None), (math.ceil(vmax + 1), ALI, "5 3")):
        r = _f21_run(T=3.0, x0=(0, 0, ang * _F21_D, 0), H=H, Ad=Ad, Bd=Bd, stop_deg=89.0)
        o.append(Pa.clip(list(zip(r["t"], r["x"][:, 2] / _F21_D)), c=c, lw=2, dash=dash))
        o.append(Pu.clip(list(zip(r["t"], r["u"])), c=c, lw=1.6, dash=dash))
        if r["fell"] is None:
            o.append(T(Pa.X(3) - 4, Pa.Y(r["x"][-1, 2] / _F21_D) + 14, "%d°: 立て直す" % ang, "end", 9.5, c, True, halo=True))
        else:
            o.append(T(Pa.X(0.62), Pa.Y(-30), "%d°: 戻しすぎて反対側へ倒れる" % ang, "start", 9.5, c, True, halo=True))
    return SVG(704, 362, o, cap="(a) 力の上限 5 N の下で、静かに放して立て直せる初めの傾き（線形でない式。「すべてを測る」は、測ってすぐ力を出す連続の計算とほぼ同じもの）。どんな制御器でも、傾きが (M + m) g tan φ = 5 N を超える角度からは戻せない。推定と 1 ms ごとの計算を入れても、すべての状態を測った連続の計算とほとんど変わらない。(b) 限界の前後の 2 つの傾きから放したときの角度と力。力は上限に張り付き、戻せない方は、張り付いている間に振子が勢いを付けて真上を通り過ぎ、反対側へ倒れる。")


F["e21_sat"] = _f21_sat_fig()


# =====================================================================
# 5 節: クーロン摩擦とリミットサイクル
# =====================================================================
def _f21_friction_fig():
    o = []
    H, Ad, Bd = _f21_kf(_F21_TS)
    # (a) 摩擦の力と速さ
    o.append(T(12, 18, "(a) 摩擦の力と台車の速さ", "start", 11.5, INK, True))
    Pa = Plot(66, 30, 250, 130, (-0.1, 0.1), (-0.5, 0.5))
    o.append(Pa.axes(xl="台車の速さ [m/s]", yl="摩擦の力 [N]", xt=[-0.1, -0.05, 0, 0.05, 0.1], yt=[-0.3, 0, 0.3],
                     xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(Pa.x, Pa.Y(0), Pa.x + Pa.w, Pa.Y(0), c=MUT, lw=1)); o.append(W(Pa.X(0), Pa.y, Pa.X(0), Pa.y + Pa.h, c=MUT, lw=1))
    o.append(Pa.clip([(-0.1, 0.6), (0.1, -0.6)], c=MUT, lw=1.4, dash="5 3"))
    o.append(W(Pa.X(-0.1), Pa.Y(0.3), Pa.X(0), Pa.Y(0.3), c=ALI, lw=2.4))
    o.append(W(Pa.X(0), Pa.Y(0.3), Pa.X(0), Pa.Y(-0.3), c=ALI, lw=4))
    o.append(W(Pa.X(0), Pa.Y(-0.3), Pa.X(0.1), Pa.Y(-0.3), c=ALI, lw=2.4))
    o.append(T(Pa.X(0.004), Pa.Y(0.12), "止まっている間は", "start", 9, ALI, halo=True))
    o.append(T(Pa.X(0.004), Pa.Y(0.12) + 12, "±0.3 N まで打ち消す", "start", 9, ALI, halo=True))
    o.append(T(Pa.X(0.098), Pa.Y(-0.3) - 6, "動いている間は 0.3 N", "end", 9, ALI, True, halo=True))
    o.append(T(Pa.X(-0.098), Pa.Y(-0.43), "破線: 粘性摩擦", "start", 9, MUT, halo=True))
    # (b) リミットサイクル
    o.append(T(370, 18, "(b) 摩擦 0.3 N で、2° から放す", "start", 11.5, INK, True))
    r = _f21_run(T=12.0, x0=(0, 0, 2 * _F21_D, 0), H=H, Ad=Ad, Bd=Bd, Fc=_F21_FC, every=5)
    Pb = Plot(418, 30, 270, 56, (0, 12), (-45, 45)); Pc = Plot(418, 104, 270, 56, (0, 12), (-2, 2))
    st = r["x"][:, 1] == 0.0
    i = 0
    while i < len(st):
        if st[i]:
            j = i
            while j < len(st) and st[j]:
                j += 1
            for P_ in (Pb, Pc):
                o.append(RECT(P_.X(r["t"][i]), P_.y, P_.X(r["t"][j - 1]) - P_.X(r["t"][i]), P_.h, 0, GOSOFT, "none", 0))
            i = j
        else:
            i += 1
    o.append(Pb.axes(yl="p [mm]", xt=[0, 4, 8, 12], yt=[-30, 0, 30], xfmt=lambda v: "", yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(Pc.axes(xl="時間 t [s]", yl="φ [°]", xt=[0, 4, 8, 12], yt=[-1, 0, 1], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(Pb.line(list(zip(r["t"], r["x"][:, 0] * 1000)), c=SIG, lw=1.8))
    o.append(Pc.line(list(zip(r["t"], r["x"][:, 2] / _F21_D)), c=SIG, lw=1.8))
    o.append(T(Pb.x + Pb.w - 4, Pb.y + 11, "金の帯: 台車が止まっている", "end", 9, GLD, True, halo=True))
    # (c) 補償
    o.append(T(12, 214, "(c) 推定した速さの向きに摩擦を足す（摩擦 0.3 N）", "start", 11.5, INK, True))
    Pd = Plot(66, 228, 250, 110, (8, 16), (-45, 45))
    o.append(Pd.axes(xl="時間 t [s]", yl="台車 p [mm]", xt=[8, 10, 12, 14, 16], yt=[-30, 0, 30], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    for ffc, c, dash in ((0.0, MUT, "5 3"), (0.45, GLD, None), (0.3, GRN, None)):
        rr = _f21_run(T=16.0, x0=(0, 0, 2 * _F21_D, 0), H=H, Ad=Ad, Bd=Bd, Fc=_F21_FC, ffc=ffc, every=5)
        sel = rr["t"] >= 8
        o.append(Pd.line(list(zip(rr["t"][sel], rr["x"][sel, 0] * 1000)), c=c, lw=1.8, dash=dash))
    o.append(LEGL(66, 380, [(MUT, "5 3", "足さない"), (GRN, None, "0.3 N を足す"), (GLD, None, "0.45 N（多すぎ）")], sz=9.5, gap=12))
    # (d) 揺れの幅と摩擦の大きさ
    o.append(T(370, 214, "(d) 台車の揺れの幅と摩擦の大きさ", "start", 11.5, INK, True))
    Pe = Plot(418, 228, 270, 110, (0, 1.0), (0, 120))
    o.append(Pe.axes(xl="摩擦の大きさ [N]", yl="片側の幅 [mm]", xt=[0, 0.25, 0.5, 0.75, 1.0], yt=[0, 30, 60, 90, 120], xfmt=lambda v: "%g" % v))
    o.append(Pe.line([(0, 0), (1.0, 1000 / abs(_F21_FLQ[0]))], c=FNT, lw=1.4, dash="4 3"))
    for fc in (0.1, 0.3, 0.5, 0.75, 1.0):
        rr = _f21_run(T=14.0, x0=(0, 0, 2 * _F21_D, 0), H=H, Ad=Ad, Bd=Bd, Fc=fc, every=5)
        sel = rr["t"] >= 6
        amp = (rr["x"][sel, 0].max() - rr["x"][sel, 0].min()) / 2 * 1000
        o.append(D(Pe.X(fc), Pe.Y(amp), SIG, 3.6))
    o.append(T(Pe.x + 6, Pe.y + 12, "点: 数値計算　破線: 摩擦 ÷ |f₁|", "start", 9, MUT, halo=True))
    return SVG(704, 392, o, cap="(a) クーロン摩擦は、動いている間は速さによらない一定の大きさで動きを妨げ、止まっている間は、その大きさまでの力を打ち消す。粘性摩擦（破線）は、遅いほど小さい。(b) 4 節の制御器（19 章の F と 20 章のカルマンフィルタ、1 ms）で、台車は止まっては動くことを繰り返し、振子も揺れ続ける。(c) 推定した速さの向きに、見込んだ摩擦を足すと、揺れは小さくなるが、多すぎると振子の揺れが増える。(d) 揺れの幅は摩擦の大きさにほぼ比例し、摩擦 ÷ 状態フィードバックの位置のゲインの 1.1 倍ほどである。")


F["e21_friction"] = _f21_friction_fig()


# =====================================================================
# 5 節: 推定を入れたループの余裕と、カルマンフィルタの重み
# =====================================================================
_F21_WMULS = (1, 2, 4, 10, 30, 100)


def _f21_margin_fig():
    o = []
    # (a) 位相余裕と力のノイズの釣り合い
    o.append(T(12, 18, "(a) 位相余裕と力の揺れ", "start", 11.5, INK, True))
    P = Plot(66, 34, 270, 170, (0.0, 0.3), (25, 65))
    o.append(RECT(P.X(0), P.Y(65), P.X(0.2) - P.X(0), P.Y(40) - P.Y(65), 0, GSOFT, "none", 0))
    o.append(P.axes(xl="力の揺れの標準偏差 [N]", yl="位相余裕 [°]", xt=[0, 0.1, 0.2, 0.3], yt=[30, 40, 50, 60], xfmt=lambda v: "%g" % v))
    o.append(T(P.X(0.005), P.Y(63), "仕様 6・8 を満たす範囲", "start", 9, GRN, True, halo=True))
    pts = []
    for mul in _F21_WMULS:
        H, Ad, Bd = _f21_kf(_F21_TS, 0.3 * math.sqrt(mul), 3.0 * math.sqrt(mul))
        pm = _f21_margins(_f21_loop_tf(_F21_FLQ, _F21_TS, H, Ad, Bd), _F21_TS)[0]
        ns = _f21_force_std(_F21_FLQ, _F21_TS, H, Ad, Bd)
        pts.append((ns, pm, mul))
    o.append(P.line([(a, b) for a, b, _ in pts], c=ALI, lw=1.6))
    for a, b, mul in pts:
        c = SIG if mul == 4 else ALI
        o.append(D(P.X(a), P.Y(b), c, 4.2 if mul == 4 else 3.2))
        o.append(T(P.X(a) + 6, P.Y(b) + 13, "×%g" % mul, "start", 9.5, c, mul == 4, halo=True))
    full = _f21_margins(_f21_loop_tf(_F21_FLQ, _F21_TS, timing="B"), _F21_TS)[0]
    o.append(W(P.x, P.Y(full), P.x + P.w, P.Y(full), c=MUT, lw=1.2, dash="4 3"))
    o.append(T(P.x + P.w - 4, P.Y(full) - 5, "すべてを測るとき %.1f°" % full, "end", 9, MUT, halo=True))
    # (b) ナイキスト線図
    o.append(T(380, 18, "(b) 入力の点で切ったループのナイキスト線図", "start", 11.5, INK, True))
    cp, Pn = CPLANE(414, 34, 270, 170, (-3.2, 1.0), (-1.3, 1.35), [-3, -2, -1, 0, 1], [-1, 0, 1])
    o.append(cp)
    th = _f21_np.linspace(0, 2 * math.pi, 181)
    o.append(Pn.clip([(-1 + math.cos(a), math.sin(a)) for a in th], c=GRN, lw=1.2, dash="3 3"))
    ws = _f21_np.logspace(-0.3, math.log10(math.pi / _F21_TS * 0.99), 900)
    cases = [(_f21_loop_tf(_F21_FLQ, _F21_TS, timing="B"), MUT, "5 3"),
             (_f21_loop_tf(_F21_FLQ, _F21_TS, *_f21_kf(_F21_TS)), ALI, None),
             (_f21_loop_tf(_F21_FLQ, _F21_TS, *_f21_kf(_F21_TS, 0.6, 6.0)), SIG, None)]
    for L, c, dash in cases:
        v = _f21_loop_eval(L, _F21_TS, ws)
        o.append(Pn.clip([(z.real, z.imag) for z in v], c=c, lw=1.8, dash=dash))
    o.append(M1(Pn))
    o.append(T(Pn.x + 4, Pn.y + 11, "緑の点線: −1 を中心とする半径 1 の円", "start", 9, GRN, halo=True))
    o.append(LEGL(380, 246, [(MUT, "5 3", "すべてを測る"), (ALI, None, "20 章の W（×1）"), (SIG, None, "W を 4 倍")], sz=9.5, gap=12))
    # (c) 遅れ 30 ms
    o.append(T(12, 282, "(c) 測る値が 30 ms 遅れるとき、10° から放す", "start", 11.5, INK, True))
    Pc = Plot(66, 296, 618, 96, (0, 4), (-9, 11))
    o.append(Pc.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 1, 2, 3, 4], yt=[-5, 0, 5, 10], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    for (sa, sal), c, lab in (((0.3, 3.0), ALI, "20 章の W"), ((0.6, 6.0), SIG, "W を 4 倍")):
        r = _f21_run(T=4.0, x0=(0, 0, 10 * _F21_D, 0), sa=sa, sal=sal, Ls=0.03, every=2)
        o.append(Pc.clip(list(zip(r["t"], r["x"][:, 2] / _F21_D)), c=c, lw=1.8))
    o.append(LEGL(400, 316, [(ALI, None, "20 章の W"), (SIG, None, "W を 4 倍")], sz=9.5, gap=12))
    return SVG(704, 436, o, cap="(a) カルマンフィルタのプロセスノイズの分散を 1〜100 倍に見込んだときの、入力の点の位相余裕と、観測ノイズによる力の揺れ（1 ms、(B) の出し方）。推定が速くなり、余裕はすべてを測るときに近づくが、ノイズを多く通す。(b) 推定を入れると、ナイキスト線図は −1 を中心とする円（19 章 6 節）の中に入り、−1 に近づく。(c) 測る値に 30 ms のむだ時間があると、20 章の W のままでは揺れが長く残る。")


F["e21_margin"] = _f21_margin_fig()


# =====================================================================
# 5 節: モデルの誤差（振子の長さと台車の質量のずれ）
# =====================================================================
def _f21_cl_eig(lr, Mr, H, Ad, Bd, F=None):
    """本当の対象の長さ・質量が lr・Mr 倍のとき、(B) の出し方とカルマンフィルタ（名目のモデル）の閉ループの固有値（z）。"""
    F = _F21_FLQ if F is None else F
    At, Bt = _f21_AB(_F21_M * Mr, _F21_m, _F21_l * lr)
    Adt, Bdt = _f21_c2d(At, Bt, _F21_TS)
    I = _f21_np.eye(4); C = _F21_C
    Ac = _f21_np.zeros((5, 5)); Bc = _f21_np.zeros((5, 2))
    Ac[:4, :4] = Ad @ (I - H @ C); Ac[:4, 4] = Bd[:, 0]; Bc[:4, :] = Ad @ H
    Ac[4, :4] = -F @ (I - H @ C); Bc[4, :] = -F @ H
    Phi = _f21_np.zeros((9, 9)); Phi[:4, :4] = Adt; Phi[:4, 8] = Bdt[:, 0]
    Phi[4:, :4] = Bc @ C; Phi[4:, 4:] = Ac
    return _f21_np.linalg.eigvals(Phi)


def _f21_class(ev):
    """0: 不安定、1: 揺れが長く残る（最も小さい減衰比が 0.1 未満）、2: 立つ"""
    if _f21_np.abs(ev).max() >= 1.0:
        return 0
    s_ = _f21_np.log(ev.astype(complex)) / _F21_TS
    z = min((-v.real / abs(v)) for v in s_ if abs(v) > 1e-9)
    return 1 if z < 0.1 else 2


def _f21_map(P, H, Ad, Bd, nl=29, nm=29):
    o = []
    lrs = _f21_np.linspace(0.4, 2.6, nl); mrs = _f21_np.linspace(0.3, 3.1, nm)
    dl, dm = lrs[1] - lrs[0], mrs[1] - mrs[0]
    cols = {0: ALI, 1: GLD, 2: GRN}
    for a in lrs:
        for b in mrs:
            k = _f21_class(_f21_cl_eig(a, b, H, Ad, Bd))
            o.append(RECT(P.X(b - dm / 2), P.Y(a + dl / 2), P.X(b + dm / 2) - P.X(b - dm / 2) + 1.0, P.Y(a - dl / 2) - P.Y(a + dl / 2) + 1.0, 0, cols[k], "none", 0, op=0.32))
    o.append(RECT(P.X(0.8), P.Y(1.2), P.X(1.2) - P.X(0.8), P.Y(0.8) - P.Y(1.2), 0, "none", INK, 1.4))
    o.append(D(P.X(1), P.Y(1), INK, 3))
    return "".join(o)


def _f21_model_fig():
    o = []
    for k, ((sa, sal), title) in enumerate((((0.3, 3.0), "(a) 20 章の W"), ((0.6, 6.0), "(b) W を 4 倍"))):
        H, Ad, Bd = _f21_kf(_F21_TS, sa, sal)
        x0 = 66 + k * 236
        o.append(T(x0 - 50, 18, title, "start", 11.5, INK, True))
        P = Plot(x0, 30, 170, 150, (0.3, 3.1), (0.4, 2.6))
        o.append(_f21_map(P, H, Ad, Bd))
        o.append(P.axes(xl="台車の質量の倍率", yl="振子の長さの倍率" if k == 0 else None, xt=[0.5, 1, 1.5, 2, 2.5, 3], yt=[0.5, 1, 1.5, 2, 2.5], grid=False, xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(LEGEND(66, 230, [(GRN, "立つ"), (GLD, "揺れが長く残る（減衰比 < 0.1）"), (ALI, "不安定")], sz=9.5))
    o.append(T(66, 248, "枠: 仕様 9 の ±20 %、点: 名目の値", "start", 9.5, MUT))
    # (c) 押す試験を ±20 % の 4 つの角で
    o.append(T(520, 18, "(c) W を 4 倍、押す試験", "start", 11.5, INK, True))
    Pc = Plot(556, 30, 134, 150, (0, 4), (-18, 8))
    o.append(Pc.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 2, 4], yt=[-15, -10, -5, 0, 5], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    worst = 0
    for lr, mr, c in ((1, 1, INK), (0.8, 0.8, TEA), (1.2, 0.8, PUR), (0.8, 1.2, GLD), (1.2, 1.2, ALI)):
        r = _f21_run(T=4.0, push=(0.5, 0.1, 1.0), sa=0.6, sal=6.0, l=_F21_l * lr, M=_F21_M * mr, every=4)
        worst = max(worst, abs(r["x"][:, 2]).max() / _F21_D)
        o.append(Pc.clip(list(zip(r["t"], r["x"][:, 2] / _F21_D)), c=c, lw=1.5))
    o.append(T(520, 232, "長さ・質量の倍率", "start", 9.5, MUT, True))
    for i, (lab, c) in enumerate((("1・1", INK), ("0.8・0.8", TEA), ("1.2・0.8", PUR), ("0.8・1.2", GLD), ("1.2・1.2", ALI))):
        o.append(W(520 + (i % 3) * 60, 246 + (i // 3) * 14, 536 + (i % 3) * 60, 246 + (i // 3) * 14, c=c, lw=2))
        o.append(T(539 + (i % 3) * 60, 250 + (i // 3) * 14, lab, "start", 9, MUT))
    return SVG(704, 274, o, cap="振子の長さと台車の質量が、モデル（名目の値）から何倍ずれていても立つか（線形化した式に、1 ms ごとの計算とカルマンフィルタを入れた閉ループの固有値で判定）。カルマンフィルタは名目のモデルで推定する。(a)(b) どちらの W でも、仕様の ±20 %（枠）は十分に内側にある。W を 4 倍にすると、短く軽い側の不安定な範囲が狭まる。(c) ±20 % の 4 つの角で、おもりを押したときの角度（線形でない式）。最も傾くのは、長くて重い組である。")


F["e21_model"] = _f21_model_fig()


# =====================================================================
# 6 節: 調整と検証の手順、向き（符号）の誤り
# =====================================================================
def _f21_flow_fig():
    o = []
    steps = [("1. 安全の準備", "非常停止・端のスイッチ・30° で止める", "16 章 5 節", ALI),
             ("2. 向きと 0 点を確かめる", "センサと力の向きを 1 つずつ", "17 章 2 節", GLD),
             ("3. 値を測る", "揺れの周期・力の段差・ノイズ（2 節）", "3・4 章", LIN),
             ("4. ホストで模型と動かす", "同じ C のコードで仕様の表を", "16 章 6 節", LIN),
             ("5. 手で支えて始める", "内側の角度だけ → 全部の状態", "14 章 4 節", SIG),
             ("6. ログを模型と重ねる", "1 ms ごとの p・φ・推定・力", "16 章 6 節", SIG),
             ("7. 試験を順に", "10° から放す・押す・立てたまま", "18・19 章", SIG),
             ("8. 余裕を測る", "正弦波を力に足して一巡伝達関数", "8・16 章", SIG),
             ("9. 仕様の表で判定", "満たさない行は 5 節の直し方へ", "1 節", GRN)]
    bw, bh, gx, gy = 212, 50, 24, 20
    pos = []
    for i, (t1, t2, ch, c) in enumerate(steps):
        col, row = i % 3, i // 3
        x = 14 + col * (bw + gx); y = 14 + row * (bh + gy)
        pos.append((x, y))
        o.append(RECT(x, y, bw, bh, 7, PAN if c == LIN else soft(c), c, 1.4))
        o.append(T(x + 8, y + 18, t1, "start", 10.5, INK if c == LIN else c, True))
        o.append(T(x + 8, y + 36, t2, "start", 9, MUT))
        o.append(T(x + bw - 6, y + 18, ch, "end", 9, MUT))
    for i in range(len(steps) - 1):
        (x1, y1), (x2, y2) = pos[i], pos[i + 1]
        if (i % 3) < 2:
            o.append(ARR(x1 + bw, y1 + bh / 2, x2, y2 + bh / 2, c=MUT, lw=1.5, head=6))
        else:
            o.append(W(x1 + bw / 2, y1 + bh, x1 + bw / 2, y1 + bh + gy / 2, x2 + bw / 2, y1 + bh + gy / 2, c=MUT, lw=1.5))
            o.append(ARR(x2 + bw / 2, y1 + bh + gy / 2, x2 + bw / 2, y2, c=MUT, lw=1.5, head=6))
    # 9 → 4 に戻る
    (x9, y9), (x4, y4) = pos[8], pos[3]
    o.append(W(x9 + bw / 2, y9 + bh, x9 + bw / 2, y9 + bh + 14, x4 - 8 + 0, y9 + bh + 14, c=ALI, lw=1.5, dash="5 3"))
    o.append(W(x4 - 8, y9 + bh + 14, x4 - 8, y4 + bh / 2, c=ALI, lw=1.5, dash="5 3"))
    o.append(ARR(x4 - 8, y4 + bh / 2, x4, y4 + bh / 2, c=ALI, lw=1.5, head=6, dash="5 3"))
    o.append(T(x9 + bw / 2 - 8, y9 + bh + 28, "満たさない行があれば、設計を直して 4. からやり直す", "end", 9.5, ALI, True))
    return SVG(704, 14 + 3 * (bh + gy) + 34, o, cap="実機で振子を立てるまでの手順。右上の灰色の字は、主に使う章。危ない順（倒れる・台車がぶつかる）に先に手を打ち、閉ループにする前に、向きと値を 1 つずつ確かめる。実機で試す前に、同じコードをホストで模型と動かして仕様の表を確かめておく。")


F["e21_flow"] = _f21_flow_fig()


def _f21_signs_fig():
    o = []
    cases = [((1, 1, 1), SIG, None, "正しい"), ((1, -1, 1), ALI, None, "角度のセンサが逆"),
             ((-1, 1, 1), GLD, None, "位置のセンサが逆"), ((1, 1, -1), PUR, "5 3", "力の向きが逆")]
    o.append(T(12, 18, "向きを 1 か所だけ逆にして、2° から放す（4 節の制御器、W を 4 倍）", "start", 11.5, INK, True))
    Pa = Plot(66, 34, 270, 150, (0, 3), (-10, 65))
    Pb = Plot(418, 34, 270, 150, (0, 3), (-0.6, 1.2))
    o.append(Pa.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 1, 2, 3], yt=[0, 20, 40, 60]))
    o.append(Pb.axes(xl="時間 t [s]", yl="台車の位置 p [m]", xt=[0, 1, 2, 3], yt=[-0.5, 0, 0.5, 1.0], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    for v in (0.5, -0.5):
        o.append(W(Pb.x, Pb.Y(v), Pb.x + Pb.w, Pb.Y(v), c=ALI, lw=1, dash="4 3"))
    for sg, c, dash, lab in cases:
        r = _f21_run(T=3.0, x0=(0, 0, 2 * _F21_D, 0), sa=0.6, sal=6.0, sgn=sg, stop_deg=60.0, every=2)
        o.append(Pa.clip(list(zip(r["t"], r["x"][:, 2] / _F21_D)), c=c, lw=2, dash=dash))
        o.append(Pb.clip(list(zip(r["t"], r["x"][:, 0])), c=c, lw=2, dash=dash))
        if r["fell"] is not None:
            if sg[0] < 0:
                o.append(T(Pa.X(r["fell"]) - 6, Pa.Y(32), "%s: %.2f s で倒れる" % (lab, r["fell"]), "end", 9.5, c, True, halo=True))
            else:
                o.append(T(Pa.X(0.34), Pa.Y(52) + (0 if sg[1] < 0 else 14), "%s: %.2f s で倒れる" % (lab, r["fell"]), "start", 9.5, c, True, halo=True))
    o.append(LEGL(66, 236, [(c, dash, lab) for _, c, dash, lab in cases], sz=9.5, gap=14))
    return SVG(704, 246, o, cap="センサか力の向きを 1 か所だけ逆にしたときの動き（線形でない式）。角度のセンサや力の向きが逆だと、制御器は振子を倒す向きに押し、0.3 s ほどで倒れる。位置のセンサが逆だと、振子はしばらく立つが、台車を戻すつもりの力が台車を押し出し、レールの端を越えてから倒れる。")


F["e21_signs"] = _f21_signs_fig()


def _f21_inject_meas(H, Ad, Bd, ws=(4, 7, 10, 14, 20, 28, 40), A=0.3, seed=3, sa=0.6, sal=6.0):
    """力に振幅 A [N] の正弦波を足し、立てたまま記録して、L(jω) = −U_c/U を読む（16 章 6 節）。観測ノイズあり。"""
    out = []
    for w in ws:
        per = 2 * math.pi / w; nper = max(3, int(math.ceil(1.5 / per)))
        r = _f21_run(T=2.0 + nper * per, H=H, Ad=Ad, Bd=Bd, noise=True, seed=seed, inj=(A, w))
        t = r["t"]; sel = t >= t[-1] - nper * per + 1e-9
        e = _f21_np.exp(-1j * w * t[sel])
        out.append((w, -(r["uc"][sel] * e).sum() / (r["u"][sel] * e).sum()))
    return out


def _f21_inject_fig():
    o = []
    H, Ad, Bd = _f21_kf(_F21_TS, 0.6, 6.0)
    L = _f21_loop_tf(_F21_FLQ, _F21_TS, H, Ad, Bd)
    ws = _f21_np.logspace(0, 2, 300)
    v = _f21_loop_eval(L, _F21_TS, ws)
    db = 20 * _f21_np.log10(_f21_np.abs(v)); ph = _f21_np.degrees(_f21_np.unwrap(_f21_np.angle(v)))
    ph = ph - 360 * round((ph[0] - (-200)) / 360)       # 低い角周波数で −180° 付近から描く
    svg, pm, pp, hgt = BODE(66, 22, 600, [(ws, db, ph, SIG, None)], (1, 100), (-10, 20), (-225, -90), hm=120, hp=110, dbt=[-10, 0, 10, 20], pht=[-225, -180, -135, -90])
    o.append(svg)
    meas = _f21_inject_meas(H, Ad, Bd)
    for w, Lm in meas:
        d_ = 20 * math.log10(abs(Lm)); p_ = math.degrees(_f21_np.angle(Lm))
        p_ = p_ - 360 * round((p_ - _f21_np.interp(w, ws, ph)) / 360)
        o.append(CIRC(pm.X(w), pm.Y(d_), 4, c=ALI, lw=1.8, fill=SCR)); o.append(CIRC(pp.X(w), pp.Y(p_), 4, c=ALI, lw=1.8, fill=SCR))
    # 測った点を直線で補って、|L| = 1 の角周波数と位相余裕を読む
    mw = [m[0] for m in meas]; md = [20 * math.log10(abs(m[1])) for m in meas]
    mp = [math.degrees(_f21_np.angle(m[1])) for m in meas]
    mp = [p_ - 360 * round((p_ - _f21_np.interp(w, ws, ph)) / 360) for w, p_ in zip(mw, mp)]
    k = next(i for i in range(1, len(md)) if md[i - 1] > 0 >= md[i])
    a = md[k - 1] / (md[k - 1] - md[k]); lw_ = math.log10(mw[k - 1]) + a * (math.log10(mw[k]) - math.log10(mw[k - 1]))
    wgc = 10 ** lw_; phc = mp[k - 1] + a * (mp[k] - mp[k - 1]); pmm = 180 + phc
    pm_model = _f21_margins(L, _F21_TS)
    o.append(W(pm.X(wgc), pm.y, pm.X(wgc), pp.y + pp.h, c=GLD, lw=1.2, dash="4 3"))
    o.append(T(pm.X(wgc) + 5, pm.y + 14, "|L| = 1: %.1f rad/s" % wgc, "start", 9.5, GLD, True, halo=True))
    o.append(DARR(pp.X(wgc) - 12, pp.Y(-180), pp.X(wgc) - 12, pp.Y(phc), c=GLD, lw=1.3))
    o.append(T(pp.X(wgc) - 20, (pp.Y(-180) + pp.Y(phc)) / 2 + 4, "位相余裕 %.1f°（モデル %.1f°）" % (pmm, pm_model[0]), "end", 9.5, GLD, True, halo=True))
    o.append(LEGL(66, hgt + 6, [(SIG, None, "モデルの一巡伝達関数"), (ALI, None, "力に正弦波を足して測った点（○）")], sz=9.5))
    return SVG(704, hgt + 16, o, cap="立てたまま、制御器が計算した力に振幅 0.3 N の正弦波を足して記録し、16 章 6 節の方法で、入力の点で切った一巡伝達関数 L を 7 つの角周波数で測ったもの（観測ノイズあり。推定には足す前の力を使う）。測った点を直線で補って |L| = 1 の角周波数と位相余裕を読むと、5 節で計算した値とほとんど同じになる。")


F["e21_inject"] = _f21_inject_fig()


# =====================================================================
# 7 節: この演習の各段で使った章
# =====================================================================
def _f21_map_fig():
    o = []
    steps = [("1 仕様", ["01", "04", "09", "11"]),
             ("2 モデル", ["02", "03", "04", "14", "17"]),
             ("3 設計", ["10", "12", "13", "14", "18", "19"]),
             ("4 実装", ["15", "16", "17", "20"]),
             ("5 現実の問題", ["05", "06", "07", "09", "11", "14", "19", "20"]),
             ("6 検証", ["08", "16"])]
    part = {"01": SIG, "02": SIG, "03": SIG, "04": SIG, "05": PUR, "06": PUR, "07": PUR, "08": PUR, "09": PUR,
            "10": GLD, "11": GLD, "12": GLD, "13": GLD, "14": GLD, "15": TEA, "16": TEA, "17": GRN, "18": GRN, "19": GRN, "20": GRN}
    bw, gx, x0 = 104, 12, 14
    for i, (name, chs) in enumerate(steps):
        x = x0 + i * (bw + gx)
        o.append(RECT(x, 14, bw, 30, 7, SSOFT, SIG, 1.5))
        o.append(T(x + bw / 2, 34, name, "middle", 11, SIG, True))
        if i < len(steps) - 1:
            o.append(ARR(x + bw, 29, x + bw + gx, 29, c=SIG, lw=1.6, head=6))
        for k, ch in enumerate(chs):
            y = 58 + k * 24
            c = part[ch]
            o.append(RECT(x + 22, y, bw - 44, 19, 4, soft(c), c, 1.1))
            o.append(T(x + bw / 2, y + 13.5, ch + " 章", "middle", 9.5, c, True))
    # 部の凡例
    o.append(LEGEND(14, 270, [(SIG, "第 I 部 1〜4 章"), (PUR, "第 II 部 5〜9 章"), (GLD, "第 III 部 10〜14 章"), (TEA, "第 IV 部 15・16 章"), (GRN, "第 V 部 17〜20 章")], sz=9.5, gap=12))
    return SVG(704, 282, o, cap="この章の 6 つの段（上）と、それぞれで主に使った章（下。色は部）。どの部の道具も、1 つの装置を立てるのに使われる。")


F["e21_map"] = _f21_map_fig()
