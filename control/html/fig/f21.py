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
             off=0.0, push=None, inj=None, every=1, stop_deg=60.0, sa=0.3, sal=3.0):
    """返り値 dict(t, x（本当の状態）, xh（推定）, u（出した力）, uc（制御器が計算した力。inj を足す前）, fell)。
    est: "kf"（カルマンフィルタ）・"true"（本当の状態を使う。比べるため）。Ls: 測る値の遅れ [s]。off: 角度の 0 点のずれ [rad]。
    push = (開始, 長さ, 力)（おもりを水平に押す）。inj = (振幅, 角周波数)（出す力に正弦波を足す。6 節）"""
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
        y0 = xs[0] + _F21_SP * e1; y1 = xs[2] + off + _F21_SPH * e2
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
        if est == "kf":
            xm = [sum(Adl[i][j] * xh[j] for j in range(4)) + Bdl[i] * u_k for i in range(4)]
        if k % every == 0:
            R["t"].append(t); R["x"].append(pl.x); R["xh"].append(tuple(xh)); R["u"].append(u_k); R["uc"].append(uc_k)
        if k == n:
            break
        for j in range(nsub):
            tj = t + j * h
            fd = push[2] if (push and push[0] - 1e-9 <= tj < push[0] + push[1] - 1e-9) else 0.0
            pl.step(u_k, fd, h)
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
