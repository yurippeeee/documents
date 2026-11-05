# -*- coding: utf-8 -*-
# 18 章 状態フィードバック の図
import numpy as _f18_np
from scipy import linalg as _f18_la

# =====================================================================
# 例の値（本文と同じ）
# =====================================================================
_F18_M, _F18_m, _F18_l, _F18_g = 0.5, 0.2, 0.3, 9.81            # 倒立振子
_F18_AP = _f18_np.array([[0.0, 1.0, 0.0, 0.0],
                         [0.0, 0.0, -_F18_m * _F18_g / _F18_M, 0.0],
                         [0.0, 0.0, 0.0, 1.0],
                         [0.0, 0.0, (_F18_M + _F18_m) * _F18_g / (_F18_M * _F18_l), 0.0]])
_F18_BP = _f18_np.array([0.0, 1.0 / _F18_M, 0.0, -1.0 / (_F18_M * _F18_l)])
_F18_ACART = _f18_np.array([[0.0, 1.0], [-25.0, -2.0]])            # 台車とばね・ダンパ（m = 1 kg）
_F18_BCART = _f18_np.array([0.0, 1.0])
_F18_UMAX = 5.0                                                      # 力の上限（例の値）


# =====================================================================
# 計算の補助
# =====================================================================
def _f18_ctrb(A, B):
    A = _f18_np.asarray(A, float); B = _f18_np.asarray(B, float).reshape(-1, 1)
    n = A.shape[0]
    return _f18_np.hstack([_f18_np.linalg.matrix_power(A, i) @ B for i in range(n)])


def _f18_acker(A, B, poles):
    """アッカーマンの式 F = [0 … 0 1] C⁻¹ ā(A)。返り値は 1 次元の並び（u = −F x）。"""
    A = _f18_np.asarray(A, float)
    n = A.shape[0]
    ph = _f18_np.real(_f18_np.poly(poles))
    P = sum(ph[k] * _f18_np.linalg.matrix_power(A, n - k) for k in range(n + 1))
    W = _f18_ctrb(A, B)
    e = _f18_np.zeros(n); e[-1] = 1.0
    return e @ _f18_np.linalg.inv(W) @ P


def _f18_pnl(x, u, fd=0.0, d=0.0):
    """倒立振子の線形でない式（17 章 2 節）。fd: おもりを水平に押す力、d: 台車に加わる外乱の力。"""
    M, m, l, g = _F18_M, _F18_m, _F18_l, _F18_g
    p, pd, ph, phd = x[0], x[1], x[2], x[3]
    s, c = math.sin(ph), math.cos(ph)
    Fc = u + d
    pdd = (Fc + fd - m * g * s * c - fd * c * c + m * l * phd * phd * s) / (M + m * s * s)
    phdd = (g * s - pdd * c + fd / m * c) / l
    return [pd, pdd, phd, phdd]


def _f18_plin(x, u, fd=0.0, d=0.0):
    """線形化した式。"""
    M, m, l, g = _F18_M, _F18_m, _F18_l, _F18_g
    Fc = u + d
    return [x[1], (Fc - m * g * x[2]) / M, x[3], ((M + m) * g * x[2] - Fc) / (M * l) + fd / (m * l)]


def _f18_rk4(f, t, x, h):
    k1 = _f18_np.array(f(t, x)); k2 = _f18_np.array(f(t + h / 2, x + h / 2 * k1))
    k3 = _f18_np.array(f(t + h / 2, x + h / 2 * k2)); k4 = _f18_np.array(f(t + h, x + h * k3))
    return x + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)


def _f18_run(F, x0, T, h=0.001, nl=True, umax=None, push=None, dist=None, r=None, fI=None, every=1):
    """閉ループを 4 次のルンゲ・クッタ法で解く。入力は微分方程式の中で計算する（連続の制御器）。
    push=(開始, 長さ, 力) はおもりを押す力、dist(t) は台車の外乱、r(t) は台車の位置の目標値。
    fI が None でなければ積分型サーボ系（w = ∫(r − p) dt を 5 番目の状態に。u = −F x − fI w）。
    fI が None で r があれば u = −F (x − x_r)。返り値 (t, x, u, 倒れたか)。"""
    F = _f18_np.asarray(F, float)
    plant = _f18_pnl if nl else _f18_plin

    def ctrl(t, x):
        if fI is not None:
            u = -F @ x[:4] - fI * x[4]
        elif r is not None:
            u = -(F[0] * (x[0] - r(t)) + F[1] * x[1] + F[2] * x[2] + F[3] * x[3])
        else:
            u = -F @ x[:4]
        if umax is not None:
            u = max(-umax, min(umax, u))
        return u

    cur = [0.0, 0.0]          # 押す力と外乱（刻みの始めの時刻で決め、その刻みの間は一定。変わる時刻は刻みの境目にそろえる）

    def f(t, x):
        u = ctrl(t, x)
        dx = plant(x, u, cur[0], cur[1])
        if fI is not None:
            dx = dx + [(r(t) if r else 0.0) - x[0]]
        return dx

    n = int(round(T / h))
    x = _f18_np.array(list(x0) + ([0.0] if fI is not None else []), float)
    ts, xs, us = [0.0], [x.copy()], [ctrl(0.0, x)]
    fell = False
    for k in range(n):
        tk = k * h
        cur[0] = push[2] if (push and push[0] - 1e-9 <= tk < push[0] + push[1] - 1e-9) else 0.0
        cur[1] = dist(tk + 1e-9) if dist else 0.0
        x = _f18_rk4(f, tk, x, h)
        if (k + 1) % every == 0:
            ts.append((k + 1) * h); xs.append(x.copy()); us.append(ctrl((k + 1) * h, x))
        if abs(x[2]) > math.pi / 2:
            fell = True
            ts.append((k + 1) * h); xs.append(x.copy()); us.append(ctrl((k + 1) * h, x))
            break
    return _f18_np.array(ts), _f18_np.array(xs), _f18_np.array(us), fell


def _f18_free(A, x0, T, n=800):
    """入力の無い線形の式 ẋ = A x を厳密に解く。返り値 (t, x)。"""
    ts = _f18_np.linspace(0, T, n + 1)
    E = _f18_la.expm(_f18_np.asarray(A, float) * (T / n))
    xs = [_f18_np.asarray(x0, float)]
    for _ in range(n):
        xs.append(E @ xs[-1])
    return ts, _f18_np.array(xs)


def _f18_fmt(v, d=3):
    """有効数字 d 桁、負号は −。"""
    if v == 0:
        return "0"
    s = "%.*g" % (d, v)
    if "e" in s:
        s = "%.*f" % (max(0, d - 1 - int(math.floor(math.log10(abs(v))))), v)
    return s.replace("-", "−")


def _f18_fx(v, d=1):
    s = "%.*f" % (d, v)
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


# =====================================================================
# 描画の補助
# =====================================================================
# 文字の幅（font-size に対する割合）。図のページの var(--sans) で測った値（ブラウザとフォントで少し変わる）
_F18_CW = {" ": 0.28, "(": 0.37, ")": 0.37, "[": 0.37, "]": 0.37, "−": 0.66, "·": 0.29, "=": 0.66, "+": 0.66, ",": 0.29,
           ".": 0.29, ":": 0.29, "/": 0.36, "i": 0.24, "l": 0.24, "j": 0.24, "t": 0.34, "f": 0.37, "r": 0.39, "m": 0.88,
           "w": 0.82, "M": 0.9, "W": 0.99, "I": 0.27, "×": 0.66, "λ": 0.64, "x": 0.55, "k": 0.55, "s": 0.53, "c": 0.57,
           "a": 0.56, "e": 0.58, "u": 0.59, "n": 0.59, "y": 0.57, "1": 0.41, "ᵀ": 0.43, "°": 0.46, "φ": 0.72, "θ": 0.62,
           "ω": 0.81, "ζ": 0.51, "σ": 0.63}


def _f18_aw(s, sz):
    """TX の文字列の実際の幅に近い見積もり（式を横に並べるときの配置だけに使う）。"""
    w = 0.0
    for k, t in _tx_tokens(s):
        f = sz * (0.72 if k in ("sub", "sup") else (0.58 if k == "supsub" else 1.0))
        for ch in t:
            o_ = ord(ch)
            if ch in _F18_CW:
                w += f * _F18_CW[ch]
            elif o_ < 128:
                w += f * (0.66 if ch.isupper() else (0.61 if ch.isdigit() else 0.59))
            elif 0x370 <= o_ <= 0x3FF or 0x1E00 <= o_ <= 0x1EFF:
                w += f * 0.62
            elif 0x300 <= o_ <= 0x36F:
                pass
            elif 0x2080 <= o_ <= 0x209F:
                w += f * 0.4
            else:
                w += f * 1.0
    return w


def _f18_mat(x, y, rows, sz=11, c=INK, gap=12, lh=None, pad=6, pos=None):
    """行列（角括弧つき）。rows は行のリスト、要素は TX の文字列か (文字列, 色)。(x, y) は左上。返り値 (svg, 幅, 高さ)。"""
    lh = lh or sz * 1.5
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
                if pos is not None:
                    pos[(i, j)] = (xx + cw[j] / 2, y + 2 + lh * i + lh * 0.45)
        xx += cw[j] + gap
    return "".join(o), w, h


def _f18_row(x, yc, items, sz=11, c=INK):
    """横に並べた式。items: ("t", 文字, 色)・("m", 行のリスト, 色)・("g", 幅)。yc は行の縦の中心。返り値 (svg, 右端の x)。"""
    o = []
    for it in items:
        k = it[0]
        if k == "t":
            cc = it[2] if len(it) > 2 and it[2] else c
            o.append(TX(x, yc + sz * 0.36, it[1], "start", sz, cc))
            x += _f18_aw(it[1], sz) + 5
        elif k == "m":
            cc = it[2] if len(it) > 2 and it[2] else c
            nr = len(it[1])
            h = sz * 1.5 * nr + 4
            s, w, _ = _f18_mat(x, yc - h / 2, it[1], sz, cc)
            o.append(s)
            x += w + 5
        elif k == "g":
            x += it[1]
    return "".join(o), x


def _f18_ground(x0, x1, y):
    o = [W(x0, y, x1, y, c=MUT, lw=1.6)]
    xx = x0 + 6
    while xx < x1:
        o.append(W(xx, y, xx - 7, y + 7, c=FNT, lw=1))
        xx += 12
    return "".join(o)


def _f18_cart(x, y, w, h, c=SIG, fill=None, dash=None, lw=1.5):
    """台車（左上 x, y）。"""
    f = fill if fill is not None else soft(c)
    return (RECT(x, y, w, h, 4, f, c, lw, dash) + CIRC(x + w * 0.22, y + h + 6, 6, c=c, lw=1.3, fill=SCR, dash=dash)
            + CIRC(x + w * 0.78, y + h + 6, 6, c=c, lw=1.3, fill=SCR, dash=dash))


def _f18_pendcart(cx, gy, phi, L=70, cw=50, ch=20, c=SIG, dash=None, lw=2.4, bob=7, fill=None, rod=INK):
    """地面 gy の上の、中心 cx の台車と、角度 phi [rad]（真上から右が正）の振子。"""
    o = [_f18_cart(cx - cw / 2, gy - ch - 12, cw, ch, c, fill, dash)]
    px, py = cx, gy - ch - 12
    bx, by = px + L * math.sin(phi), py - L * math.cos(phi)
    o.append(W(px, py, bx, by, c=rod if not dash else c, lw=lw, dash=dash))
    o.append(CIRC(bx, by, bob, c=c, lw=1.5, fill=SCR if dash else soft(c), dash=dash))
    o.append(D(px, py, INK if not dash else c, 2.8))
    return "".join(o)


def _f18_spring(x0, x1, y, c=MUT, n=7, amp=7, lw=1.5, dash=None):
    """横向きのばね（x0 から x1 へ）。"""
    L = x1 - x0
    a = L * 0.15
    pts = [(x0, y), (x0 + a, y)]
    seg = (L - 2 * a) / n
    for k in range(n):
        pts.append((x0 + a + seg * (k + 0.5), y + (amp if k % 2 == 0 else -amp)))
    pts += [(x1 - a, y), (x1, y)]
    return PL(pts, c=c, lw=lw, dash=dash)


def _f18_damper(x0, x1, y, c=MUT, lw=1.5, dash=None):
    """横向きのダンパ（シリンダとピストン）。"""
    L = x1 - x0
    xa, xb = x0 + L * 0.3, x0 + L * 0.7
    o = [W(x0, y, xa + 6, y, c=c, lw=lw, dash=dash),
         W(xa, y - 8, xb, y - 8, c=c, lw=lw, dash=dash), W(xa, y + 8, xb, y + 8, c=c, lw=lw, dash=dash),
         W(xa, y - 8, xa, y + 8, c=c, lw=lw, dash=dash),
         W(xa + 12, y - 6, xa + 12, y + 6, c=c, lw=lw + 0.6, dash=dash),
         W(xa + 12, y, x1, y, c=c, lw=lw, dash=dash)]
    return "".join(o)


def _f18_box(P):
    """枠と地（s 平面・状態の平面の背景）。"""
    return RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8)


def _f18_axes0(P):
    o = []
    if P.yr[0] < 0 < P.yr[1]:
        o.append(W(P.x, P.Y(0), P.x + P.w, P.Y(0), c=MUT, lw=1))
    if P.xr[0] < 0 < P.xr[1]:
        o.append(W(P.X(0), P.y, P.X(0), P.y + P.h, c=MUT, lw=1))
    return "".join(o)


def _f18_X(P, z, c=SIG, r=5.5, lw=2.2):
    """s 平面の × 1 つ。"""
    x, y = P.X(z.real), P.Y(z.imag)
    return W(x - r, y - r, x + r, y + r, c=c, lw=lw) + W(x - r, y + r, x + r, y - r, c=c, lw=lw)


def _f18_ff(v):
    return ("%g" % v).replace("-", "−")


# =====================================================================
# 1 節: 比例制御と状態フィードバックのブロック線図、ばねとダンパを足す働き
# =====================================================================
def _f18_bd_fig():
    o = []
    # (a) 比例制御
    o.append(T(14, 18, "(a) 位置の比例制御: 状態のうち位置だけを戻す", "start", 11.5, INK, True))
    yc = 64
    s, pos, xe = CHAIN(20, yc, [("a", 40, "r", MUT), ("s", {"l": "+", "b": "−"}, "s"), ("a", 40, "e", INK),
                                ("b", "K_P", "K"), ("a", 48, "u", GLD),
                                ("b", ("1", "ms^2 + cs + k"), "P"), ("a", 44, None, SIG), ("t", "ty", SIG),
                                ("a", 40, "p", SIG)])
    o.append(s)
    o.append(FBPATH(pos["ty"], pos["s"], yc, 44, c=SIG))
    o.append(T((pos["ty"] + pos["s"]) / 2, yc + 38, "測るのは位置 p だけ", "middle", 9.5, SIG, True, halo=True))
    o.append(TX((pos["P"][0] + pos["P"][1]) / 2, yc - 30, "台車（状態は p と \\dot{p}）", "middle", 9.5, MUT))
    # (b) 状態フィードバック
    yb = 156
    o.append(T(14, yb, "(b) 状態フィードバック: 状態をすべて測って戻す（太い線は状態ベクトル）", "start", 11.5, INK, True))
    yc2 = yb + 52
    s2, p2, xe2 = CHAIN(20, yc2, [("a", 40, "0", MUT), ("s", {"l": "+", "b": "−"}, "s"), ("a", 66, "u", GLD),
                                  ("b", "\\dot{x} = Ax + Bu", "P", SIG, SSOFT)])
    o.append(s2)
    xt = xe2 + 70
    o.append(W(xe2, yc2, xe2 + 96, yc2, c=SIG, lw=4))
    o.append(_head(xe2 + 80, yc2, xe2 + 104, yc2, SIG, 10))
    o.append(D(xt, yc2, SIG, 4.6))
    o.append(TX(xe2 + 8, yc2 - 10, "x = [p, \\dot{p}]ᵀ", "start", 10, SIG, True, halo=True))
    yfb = yc2 + 52
    o.append(W(xt, yc2, xt, yfb, c=SIG, lw=4))
    wF = TFBW("F = [f_1  f_2]")
    xm = (xt + p2["s"]) / 2 + 20
    o.append(W(xt, yfb, xm + wF / 2 + 4, yfb, c=SIG, lw=4))
    o.append(_head(xm + wF / 2 + 22, yfb, xm + wF / 2, yfb, SIG, 10))
    o.append(TFBOX(xm - wF / 2, yfb, "F = [f_1  f_2]", wF, SIG, PAN)[0])
    o.append(W(xm - wF / 2, yfb, p2["s"], yfb, c=GLD, lw=1.5))
    o.append(ARR(p2["s"], yfb, p2["s"], yc2 + 15, c=GLD, lw=1.5, head=6))
    o.append(TX((xm - wF / 2 + p2["s"]) / 2, yfb - 6, "Fx", "middle", 10, GLD, True, halo=True))
    o.append(TX(20, yfb + 34, "u = −Fx = −f_{1}p − f_{2}\\dot{p}（目標値は 5 節で加える）", "start", 10.5, INK))
    # (c) ばねとダンパを足したのと同じ
    xc = 480
    o.append(T(xc, 18, "(c) ばねとダンパを足したのと同じ", "start", 11.5, INK, True))
    gy = 176
    xl, xr = 490, 690                       # 左の壁（本物）と右の壁（制御器が作る）
    o.append(_f18_ground(xl, xr, gy))
    o.append(W(xl, gy, xl, gy - 78, c=MUT, lw=3))
    for k in range(5):
        o.append(W(xl, gy - 72 + k * 15, xl - 7, gy - 64 + k * 15, c=FNT, lw=1))
    o.append(W(xr, gy, xr, gy - 78, c=SIG, lw=2, dash="4 3"))
    cx0, cw, ch = 566, 48, 40
    o.append(RECT(cx0, gy - ch - 12, cw, ch, 4, SSOFT, SIG, 1.5))
    o.append(CIRC(cx0 + 12, gy - 6, 6, c=SIG, lw=1.3, fill=SCR)); o.append(CIRC(cx0 + cw - 12, gy - 6, 6, c=SIG, lw=1.3, fill=SCR))
    o.append(T(cx0 + cw / 2, gy - ch / 2 - 8, "m", "middle", 12, SIG, True))
    ys1, ys2 = gy - 44, gy - 22
    o.append(_f18_spring(xl, cx0, ys1, MUT, 6, 6))
    o.append(_f18_damper(xl, cx0, ys2, MUT))
    o.append(_f18_spring(cx0 + cw, xr, ys1, SIG, 6, 6, 1.6, "4 3"))
    o.append(_f18_damper(cx0 + cw, xr, ys2, SIG, 1.6, "4 3"))
    o.append(T((xl + cx0) / 2, gy - 96, "本物", "middle", 10, MUT, True))
    o.append(T((xl + cx0) / 2, gy - 80, "ばね k・ダンパ c", "middle", 9.5, MUT))
    o.append(T((cx0 + cw + xr) / 2, gy - 96, "制御器が足す", "middle", 10, SIG, True))
    o.append(TX((cx0 + cw + xr) / 2, gy - 80, "ばね f_1・ダンパ f_2", "middle", 9.5, SIG))
    o.append(ARR(cx0 + cw / 2, gy + 18, cx0 + cw / 2 + 36, gy + 18, c=SIG, lw=1.3, head=6))
    o.append(TX(cx0 + cw / 2 + 40, gy + 22, "p", "start", 10.5, SIG, True))
    o.append(TX(xc, gy + 50, "m\\ddot{p} + (c + f_2)\\dot{p} + (k + f_1)p = 0", "start", 10.5, INK))
    o.append(T(xc, gy + 68, "制御器のばね・ダンパは負の値にもできる", "start", 9.5, MUT))
    return SVG(700, 300, o,
               "比例制御と状態フィードバック。(a) 位置の比例制御は、台車の状態（位置と速度）のうち位置だけを測って戻す。(b) 状態フィードバックは、状態ベクトルのすべての要素にゲインを掛けて足し、符号を変えて入力にする。この節では目標値を 0 とし、外乱などでずれた状態を 0 へ戻す。(c) 台車とばね・ダンパでは、u = −f₁p − f₂ṗ は、ばね定数 f₁ のばねと減衰係数 f₂ のダンパを台車に足したのと同じ働きをする。")


F["e18_bd"] = _f18_bd_fig()


# =====================================================================
# 1 節: ゲインで極が動く（台車とばね・ダンパ）
# =====================================================================
def _f18_move_fig():
    o = []
    A, Bv = _F18_ACART, _F18_BCART
    o.append(T(14, 18, "(a) ゲインを増やしたときの極の動き", "start", 11.5, INK, True))
    P = Plot(56, 34, 300, 300, (-20, 2), (-11, 11))
    o.append(_f18_box(P))
    o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-20, -15, -10, -5, 0], yt=[-10, -5, 0, 5, 10], grid=False))
    # f1 だけ: 実部 −1 の縦の線
    for sg in (1, -1):
        pts = [(-1.0, sg * math.sqrt(24 + f1)) for f1 in _f18_np.linspace(0, 75, 40)]
        o.append(P.line(pts, c=TEA, lw=2.4))
        o.append(_head(P.X(-1), P.Y(sg * 8.6), P.X(-1), P.Y(sg * 9.95), TEA, 8))
    # f2 だけ: 半径 5 の円の上 → 実軸の上を左右へ
    arc = []
    for f2 in _f18_np.linspace(0, 8, 60):
        s_ = (2 + f2) / 2
        arc.append((-s_, math.sqrt(max(25 - s_ * s_, 0))))
    o.append(P.line(arc, c=PUR, lw=2.4)); o.append(P.line([(a, -b) for a, b in arc], c=PUR, lw=2.4))
    o.append(P.line([(-5, 0), (-1.339746, 0)], c=PUR, lw=2.4)); o.append(P.line([(-5, 0), (-18.660254, 0)], c=PUR, lw=2.4))
    o.append(_head(P.X(-4.0), P.Y(0), P.X(-1.34), P.Y(0), PUR, 8))
    o.append(_head(P.X(-15), P.Y(0), P.X(-18.66), P.Y(0), PUR, 8))
    a2 = (2 + 6.0) / 2
    o.append(_head(P.X(-a2 + 0.5), P.Y(math.sqrt(25 - (a2 - 0.5) ** 2)), P.X(-a2), P.Y(math.sqrt(25 - a2 * a2)), PUR, 8))
    o.append(P.clip([(5 * math.cos(t_), 5 * math.sin(t_)) for t_ in _f18_np.linspace(0, 2 * math.pi, 120)], c=FNT, lw=1, dash="3 3"))
    # 開ループの極と、F = [25 8] の極
    for z in (complex(-1, 4.899), complex(-1, -4.899)):
        o.append(_f18_X(P, z, MUT, 6, 2.4))
    for z in (complex(-5, 5), complex(-5, -5)):
        o.append(_f18_X(P, z, SIG, 6, 2.6))
    o.append(TX(P.X(-0.6), P.Y(10.3), "f_1 だけ: 0 → 75", "start", 9.5, TEA, True, halo=True))
    o.append(TX(P.X(-9.2), P.Y(-2.0) + 12, "f_2 だけ: 0 → 18", "middle", 9.5, PUR, True, halo=True))
    o.append(T(P.X(-18.66), P.Y(0) - 8, "−18.66", "middle", 9, PUR, halo=True))
    o.append(T(P.X(-1.6), P.Y(-7.4), "開ループの極 −1 ± j4.90", "end", 9, MUT, halo=True))
    o.append(TX(P.X(-5.6), P.Y(5.6) - 6, "F = [25  8]: −5 ± j5", "end", 9.5, SIG, True, halo=True))
    o.append(T(P.X(-5.2), P.Y(-4.4), "半径 5 の円", "end", 9, FNT, halo=True))
    # (b) 10 cm ずらして放したときの位置
    o.append(T(392, 18, "(b) 10 cm ずらして放したときの位置 p [cm]", "start", 11.5, INK, True))
    cases = [([0, 0], MUT, "F = [0  0]（何もしない）", "3.92 s"),
             ([75, 0], TEA, "F = [75  0]（ばねを足す）", "3.84 s"),
             ([0, 8], PUR, "F = [0  8]（ダンパを足す）", "1.17 s"),
             ([25, 8], SIG, "F = [25  8]（両方）", "0.84 s")]
    for i, (Fv, c, lab, ts2) in enumerate(cases):
        col, row = i % 2, i // 2
        px, py = 412 + col * 150, 60 + row * 150
        q = Plot(px, py, 120, 66, (0, 4), (-10, 10))
        o.append(q.axes(xl=None, yl=None, xt=[0, 1, 2, 3, 4], yt=[-10, 0, 10], sz=9))
        Acl = A - _f18_np.outer(Bv, _f18_np.array(Fv, float))
        t, xs = _f18_free(Acl, [10.0, 0.0], 4.0, 400)
        o.append(q.clip(list(zip(t, xs[:, 0])), c=c, lw=2.0))
        o.append(W(q.X(0), q.Y(0.2), q.X(4), q.Y(0.2), c=FNT, lw=0.8, dash="2 2"))
        o.append(W(q.X(0), q.Y(-0.2), q.X(4), q.Y(-0.2), c=FNT, lw=0.8, dash="2 2"))
        o.append(TX(px - 6, py - 7, lab, "start", 9.5, c, True))
        o.append(T(px + 118, py + 14, "±2 mm に " + ts2, "end", 9, c, True, halo=True))
    o.append(T(560, 60 + 150 + 66 + 34, "時間 t [s]（どの図も 0〜4 s）", "middle", 9.5, MUT))
    return SVG(700, 376, o,
               "台車とばね・ダンパ（1 kg、2 N·s/m、25 N/m）に状態フィードバック u = −f₁p − f₂ṗ を加えたときの、閉ループの極と応答。(a) f₁ だけを増やすと、極の和は変わらず、極は実部 −1 の縦の線の上を動く（揺れが速くなるだけ）。f₂ だけを増やすと、極の積は変わらず、極は半径 5 の円の上を左へ動いて −5 で重なり、その先は実軸の上を左右に分かれる。2 つを合わせると、2 つの極をどこへでも動かせる。(b) 10 cm ずらして静かに放したときの位置。点線は ±2 mm（初めのずれの 2 %）。")


F["e18_move"] = _f18_move_fig()


# =====================================================================
# 2 節: 2 枚の板（例の値: C 400 J/K、R 1.25 K/W、つなぐ金具 2.5 K/W）
# =====================================================================
_F18_CTH, _F18_RTH, _F18_R12 = 400.0, 1.25, 2.5


def _f18_plates_AB(rho, R12=_F18_R12):
    k = 0.0 if R12 is None else 1.0 / R12
    A = _f18_np.array([[-1 / _F18_RTH - k, k], [k, -1 / _F18_RTH - k]]) / _F18_CTH
    B = _f18_np.array([rho, 1 - rho]) / _F18_CTH
    return A, B


def _f18_step_lin(A, B, x0, q, T, n=500):
    """入力一定 q のときの ẋ = A x + B q を厳密に解く。返り値 (t, x)。"""
    nn = A.shape[0]
    Mx = _f18_np.zeros((nn + 1, nn + 1)); Mx[:nn, :nn] = A * (T / n); Mx[:nn, nn] = B * q * (T / n)
    E = _f18_la.expm(Mx)
    xs = [_f18_np.asarray(x0, float)]
    for _ in range(n):
        xs.append(E[:nn, :nn] @ xs[-1] + E[:nn, nn])
    return _f18_np.linspace(0, T, n + 1), _f18_np.array(xs)


def _f18_plates_fig():
    o = []
    # (a) 絵
    o.append(T(14, 18, "(a) 2 枚の板と 1 つのヒータ", "start", 11.5, INK, True))
    y0 = 96
    for i, (x, nm) in enumerate(((26, "板 1"), (142, "板 2"))):
        o.append(RECT(x, y0, 72, 22, 3, MSOFT, MUT, 1.4))
        o.append(TX(x + 36, y0 + 15, nm + "  θ_" + str(i + 1), "middle", 10, INK, True))
        for k in range(2):
            xx = x + 22 + k * 28
            o.append(PATH("M%g,%g c-4,-5 4,-9 0,-14 c-4,-5 4,-9 0,-14" % (xx, y0 - 3), c=ALI, lw=1.3))
    o.append(TX(120, 50, "周りへ逃げる（R_th）", "middle", 9.5, ALI))
    o.append(T(120, 36, "周りの温度 θₐ = 25 °C", "middle", 9.5, MUT))
    o.append(RECT(98, y0 + 6, 44, 10, 2, GOSOFT, GLD, 1.2))
    o.append(TX(120, y0 + 34, "金具 R_{12}", "middle", 9.5, GLD))
    o.append(RECT(30, y0 + 66, 180, 14, 3, PSOFT, PUR, 1.3))
    o.append(T(120, y0 + 96, "ヒータ（電力 q）", "middle", 10, PUR, True))
    o.append(ARR(62, y0 + 64, 62, y0 + 26, c=PUR, lw=2))
    o.append(ARR(178, y0 + 64, 178, y0 + 26, c=PUR, lw=2))
    o.append(TX(68, y0 + 52, "ρq", "start", 10, PUR, True))
    o.append(TX(172, y0 + 52, "(1 − ρ)q", "end", 10, PUR, True))
    o.append(T(14, y0 + 124, "ρ = 1/2: 半分ずつ入れる", "start", 10, INK))
    o.append(T(14, y0 + 140, "ρ = 1: 全部を板 1 に入れる", "start", 10, INK))
    o.append(T(14, y0 + 162, "板 1 が 35 °C、板 2 が 25 °C から、", "start", 9.5, MUT))
    o.append(T(14, y0 + 177, "ヒータ 0・40・80 W で 500 s 温める", "start", 9.5, MUT))
    # (b)(c) 状態の平面
    cols = [(MUT, 0.0, "0 W"), (TEA, 40.0, "40 W"), (PUR, 80.0, "80 W")]
    for j, (rho, title, xp) in enumerate(((0.5, "(b) ρ = 1/2（半分ずつ）", 282), (1.0, "(c) ρ = 1（板 1 だけ）", 500))):
        o.append(T(xp - 30, 18, title, "start", 11.5, INK, True))
        P = Plot(xp, 44, 190, 132, (20, 85), (20, 65))
        o.append(_f18_box(P))
        o.append(P.axes(xl="板 1 の温度 θ_1 [°C]", yl="板 2 の温度 θ_2 [°C]" if j == 0 else None, xt=[20, 40, 60, 80], yt=[20, 40, 60]))
        o.append(P.clip([(20, 20), (65, 65)], c=FNT, lw=1, dash="3 3"))
        A, Bv = _f18_plates_AB(rho)
        marks = []
        for c, q, lab in cols:
            t, xs = _f18_step_lin(A, Bv, [10.0, 0.0], q, 500.0, 500)
            th = xs + 25.0
            o.append(P.clip([(a, b) for a, b in th], c=c, lw=2.0))
            o.append(_head(P.X(th[-6, 0]), P.Y(th[-6, 1]), P.X(th[-1, 0]), P.Y(th[-1, 1]), c, 7))
            m = th[250]
            marks.append(m)
            o.append(D(P.X(m[0]), P.Y(m[1]), c, 4))
        o.append(D(P.X(35), P.Y(25), INK, 3.4))
        o.append(T(P.X(35) + 4, P.Y(25) + 14, "始め", "start", 9, INK, halo=True))
        if rho == 0.5:
            dd = marks[0][0] - marks[0][1]
            o.append(P.clip([(20 + dd, 20), (65 + dd, 65)], c=ALI, lw=1.4, dash="5 3"))
            o.append(T(P.X(70), P.Y(38), "250 s 後の差は", "middle", 9.5, ALI, True, halo=True))
            o.append(T(P.X(70), P.Y(38) + 13, "どれも 3.68 K", "middle", 9.5, ALI, True, halo=True))
        else:
            o.append(T(xp - 30, 236, "250 s 後の差:", "start", 9.5, INK, True))
            for i, ((c, q, lab), m) in enumerate(zip(cols, marks)):
                o.append(T(xp + 44 + i * 52, 236, "%s K" % _f18_fmt(m[0] - m[1], 3), "start", 9.5, c, True))
        if j == 0:
            o.append(LEGL(xp - 30, 236, [(MUT, None, "0 W"), (TEA, None, "40 W"), (PUR, None, "80 W")], 9.5, 12))
    o.append(T(282 - 30, 256, "点は 250 s 後、矢じりは 500 s 後。破線の斜めの線は 2 枚が同じ温度", "start", 9.5, MUT))
    return SVG(700, 284, o,
               "2 枚の同じ板を熱抵抗 2.5 K/W の金具でつなぎ、1 つのヒータで温める（熱容量 400 J/K、周りへの熱抵抗 1.25 K/W）。(b) ヒータを半分ずつ入れると、電力を 0・40・80 W のどれにしても、250 s 後の 2 枚の温度の差は同じ 3.68 K で、点は傾き 45° の同じ直線の上に並ぶ。差は電力によらず時定数 250 s で減るだけで、ヒータでは動かせない。(c) 全部を板 1 に入れると、金具を通って板 2 にも熱が届き、差も電力で変わる。")


F["e18_plates"] = _f18_plates_fig()


def _f18_reach(A, Bv, T, qm, n=600, ndir=180):
    """0 から、|入力| ≤ qm で時間 T のうちに届く状態の範囲の境界（凸の多角形の頂点）。"""
    sig = _f18_np.linspace(0, T, n + 1)
    lam, V = _f18_np.linalg.eigh(A)
    g = _f18_np.array([V @ (_f18_np.exp(lam * s) * (V.T @ Bv)) for s in sig])
    wq = _f18_np.full(n + 1, T / n); wq[0] = wq[-1] = T / n / 2
    pts = []
    for k in range(ndir):
        th = 2 * math.pi * k / ndir
        d = _f18_np.array([math.cos(th), math.sin(th)])
        s = _f18_np.sign(g @ d)
        pts.append(qm * (wq * s) @ g)
    return _f18_np.array(pts)


def _f18_ctrb_fig():
    o = []
    o.append(T(14, 18, "(a) 可制御性行列の 2 つの列 B・AB の向き", "start", 11.5, INK, True))
    for i, rho in enumerate((0.5, 0.75, 1.0)):
        cx, cy = 74 + i * 130, 118
        R = 46
        o.append(RECT(cx - 58, cy - 62, 116, 124, 4, SCR, LIN, 0.8))
        o.append(W(cx - 50, cy, cx + 50, cy, c=MUT, lw=0.8)); o.append(W(cx, cy - 54, cx, cy + 54, c=MUT, lw=0.8))
        for v in ((1, 1), (1, -1)):
            nv = math.hypot(*v)
            o.append(W(cx - 52 * v[0] / nv, cy + 52 * v[1] / nv, cx + 52 * v[0] / nv, cy - 52 * v[1] / nv, c=FNT, lw=1, dash="3 3"))
        A, Bv = _f18_plates_AB(rho)
        b = Bv / _f18_np.linalg.norm(Bv)
        ab = A @ Bv
        ab = ab / _f18_np.linalg.norm(ab)
        pB, pAB = (cx + R * b[0], cy - R * b[1]), (cx + R * ab[0], cy - R * ab[1])
        det = _f18_np.linalg.det(_f18_ctrb(A, Bv))
        if abs(det) > 1e-15:
            o.append(PL([(cx, cy), pB, (pB[0] + pAB[0] - cx, pB[1] + pAB[1] - cy), pAB], c="none", lw=0, fill=SSOFT))
        o.append(ARR(cx, cy, pB[0], pB[1], c=GLD, lw=2.2))
        o.append(ARR(cx, cy, pAB[0], pAB[1], c=PUR, lw=2.2))
        o.append(T(cx, cy - 68, "ρ = %s" % ("1/2" if rho == 0.5 else _f18_ff(rho)), "middle", 10.5, INK, True))
        lab = "det = 0（階数 1）" if abs(det) < 1e-15 else "det = %s × 10⁻⁹" % _f18_fmt(det * 1e9, 2)
        o.append(T(cx, cy + 78, lab, "middle", 9.5, ALI if abs(det) < 1e-15 else SIG, True))
    o.append(LEGL(20, 226, [(GLD, None, "B（入力が直接入る向き）"), (PUR, None, "AB（その先へ伝わる向き）")], 9.5, 14))
    o.append(T(20, 246, "長さはそろえて描いた。破線は固有ベクトルの向き [1, 1]ᵀ・[1, −1]ᵀ", "start", 9.5, MUT))
    # (b) 届く範囲
    xb = 452
    o.append(T(xb - 40, 18, "(b) 500 s のうちに届く状態", "start", 11.5, INK, True))
    P = Plot(xb, 34, 230, 190, (-30, 30), (-25, 25))
    o.append(_f18_box(P))
    o.append(P.axes(xl="板 1 の温度のずれ [K]", yl="板 2 の温度のずれ [K]", xt=[-30, -20, -10, 0, 10, 20, 30], yt=[-20, -10, 0, 10, 20]))
    o.append(_f18_axes0(P))
    for rho, c in ((1.0, SIG), (0.6, GLD), (0.5, ALI)):
        A, Bv = _f18_plates_AB(rho)
        pts = _f18_reach(A, Bv, 500.0, 40.0)
        if rho == 0.5:
            o.append(P.clip([tuple(pts[:, 0].min() * _f18_np.array([1, 1])), tuple(pts[:, 0].max() * _f18_np.array([1, 1]))], c=c, lw=3))
        else:
            o.append(PL([(P.X(a), P.Y(b)) for a, b in pts], c=c, lw=1.6, fill=soft(c), op=0.6))
    o.append(T(P.X(14), P.Y(-17), "ρ = 1", "start", 9.5, SIG, True, halo=True))
    o.append(T(P.X(-4), P.Y(-6) + 4, "ρ = 0.6", "end", 9.5, GLD, True, halo=True))
    o.append(T(P.X(9), P.Y(14) - 2, "ρ = 1/2（線の上だけ）", "end", 9.5, ALI, True, halo=True))
    o.append(T(xb - 40, 276, "ヒータを 40 W のまわりで ±40 W 変える", "start", 9.5, MUT)); o.append(T(xb - 40, 290, "（ずれは 40 W での釣り合いの温度からの差）", "start", 9.5, MUT))
    return SVG(700, 298, o,
               "可制御性行列 [B AB] と、入力で届く状態の範囲（2 枚の板）。(a) ρ = 1/2 では、B と AB がどちらも 2 枚がそろって上下する向き [1, 1]ᵀ に並び（逆向き）、2 本が張る平行四辺形がつぶれて行列式が 0 になる。ρ = 0.75・1 では向きが違い、行列式は 0 でない。(b) ヒータの電力を ±40 W の範囲で変えて、500 s のうちに届く状態。ρ = 1/2 では線の上にしか行けない。ρ = 0.6 も可制御だが、範囲が細く、差の向きへはわずかしか動かせない。")


F["e18_ctrb"] = _f18_ctrb_fig()


# =====================================================================
# 2 節: 1 台の台車に 2 本の振子
# =====================================================================
def _f18_twop_AB(l1, l2, m1=0.2, m2=0.2):
    """x = [p, ṗ, φ1, φ̇1, φ2, φ̇2]。p̈ = (u − m1 g φ1 − m2 g φ2)/M、l_i φ̈_i = g φ_i − p̈。"""
    M, g = _F18_M, _F18_g
    A = _f18_np.zeros((6, 6)); Bv = _f18_np.zeros(6)
    A[0, 1] = 1; A[2, 3] = 1; A[4, 5] = 1
    A[1, 2] = -m1 * g / M; A[1, 4] = -m2 * g / M; Bv[1] = 1 / M
    for i, ll in ((3, l1), (5, l2)):
        A[i, :] = -A[1, :] / ll; A[i, i - 1] += g / ll; Bv[i] = -Bv[1] / ll
    return A, Bv


def _f18_twopend_fig():
    o = []
    o.append(T(14, 18, "(a) 1 台の台車に 2 本の振子", "start", 11.5, INK, True))
    for k, (l1, l2, lab, c) in enumerate(((0.3, 0.3, "同じ長さ 0.3 m・0.3 m", ALI), (0.3, 0.6, "0.3 m・0.6 m", GRN))):
        cx, gy = 70 + k * 120, 200
        o.append(_f18_ground(cx - 50, cx + 50, gy))
        o.append(_f18_cart(cx - 34, gy - 32, 68, 20, SIG))
        for j, (ll, ph) in enumerate(((l1, 0.10), (l2, -0.06))):
            px = cx - 16 + 32 * j
            L = ll * 220
            bx, by = px + L * math.sin(ph), gy - 32 - L * math.cos(ph)
            o.append(W(px, gy - 32, bx, by, c=INK, lw=2.2))
            o.append(CIRC(bx, by, 6, c=SIG, lw=1.4, fill=SSOFT))
            o.append(D(px, gy - 32, INK, 2.6))
        o.append(T(cx, gy + 22, lab, "middle", 9.5, c, True))
    rows = [("長さ", "階数", "6 つの極を −6 に置く F の最大の要素"), ("0.3・0.3 m", "4", "置けない（±5.72 が残る）"),
            ("0.3・0.6 m", "6", "574"), ("0.3・0.4 m", "6", "859"), ("0.3・0.32 m", "6", "3009")]
    for i, (a, b, c_) in enumerate(rows):
        y = 240 + i * 15
        cc = INK if i == 0 else (ALI if i == 1 else MUT)
        o.append(T(16, y, a, "start", 9.5, cc, i == 0)); o.append(T(96, y, b, "middle", 9.5, cc, i == 0)); o.append(T(118, y, c_, "start", 9.5, cc, i == 0))
    # (b) s 平面: 同じ長さ
    A, Bv = _f18_twop_AB(0.3, 0.3)
    m2 = 0.4
    As = _f18_np.array([[0, 1, 0, 0], [0, 0, -m2 * _F18_g / _F18_M, 0], [0, 0, 0, 1], [0, 0, (_F18_M + m2) * _F18_g / (_F18_M * 0.3), 0]])
    Bs = _f18_np.array([0, 1 / _F18_M, 0, -1 / (_F18_M * 0.3)])
    Fs = _f18_acker(As, Bs, [-4] * 4)
    F6 = _f18_np.array([Fs[0], Fs[1], Fs[2] / 2, Fs[3] / 2, Fs[2] / 2, Fs[3] / 2])
    ev_cl = _f18_np.linalg.eigvals(A - _f18_np.outer(Bv, F6))
    ev_ol = _f18_np.linalg.eigvals(A)
    xs_ = 286
    o.append(T(xs_ - 30, 18, "(b) 同じ長さ: 極の位置", "start", 11.5, INK, True))
    P = Plot(xs_, 34, 170, 170, (-9, 9), (-9, 9))
    o.append(_f18_box(P)); o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-8, -4, 0, 4, 8], yt=[-8, -4, 0, 4, 8], grid=False))
    for z in ev_ol:
        o.append(_f18_X(P, z, MUT, 5, 1.8))
    for z in ev_cl:
        fixed = abs(abs(z.real) - math.sqrt(_F18_g / 0.3)) < 1e-3 and abs(z.imag) < 1e-6
        o.append(_f18_X(P, z, ALI if fixed else SIG, 6, 2.4))
        if fixed:
            o.append(CIRC(P.X(z.real), P.Y(0), 10, c=ALI, lw=1.3))
    o.append(T(P.X(5.72), P.Y(0) - 16, "±5.72 は動かない", "middle", 9.5, ALI, True, halo=True))
    o.append(T(P.X(-4), P.Y(0) + 24, "4 つは −4 へ", "middle", 9.5, SIG, True, halo=True))
    o.append(T(P.X(0), P.Y(-7.4), "灰色: 開ループ 0・0・±5.72・±7.67", "middle", 9, MUT, halo=True))
    # (c) 時間の応答: 2 本がそろう動きは立つが、差は増える
    xc = 520
    o.append(T(xc - 30, 18, "(c) 同じ長さ: 傾き", "start", 11.5, INK, True))
    Q = Plot(xc, 34, 170, 170, (0, 0.8), (-25, 25))
    o.append(Q.axes(xl="時間 t [s]", yl="傾き [°]", xt=[0, 0.2, 0.4, 0.6, 0.8], yt=[-20, -10, 0, 10, 20], xfmt=lambda v: "%g" % v))
    Acl = A - _f18_np.outer(Bv, F6)
    t, xs = _f18_free(Acl, [0, 0, 1.0, 0, 0, 0], 0.8, 400)
    o.append(Q.clip(list(zip(t, xs[:, 2])), c=SIG, lw=2.0))
    o.append(Q.clip(list(zip(t, xs[:, 4])), c=TEA, lw=2.0, dash="6 3"))
    o.append(Q.clip(list(zip(t, xs[:, 2] - xs[:, 4])), c=ALI, lw=1.4, dash="2 3"))
    o.append(TX(Q.X(0.04), Q.Y(16), "φ_1", "start", 10, SIG, True, halo=True))
    o.append(TX(Q.X(0.04), Q.Y(-12), "φ_2", "start", 10, TEA, True, halo=True))
    o.append(TX(Q.X(0.36), Q.Y(21), "差 φ_1 − φ_2", "end", 9.5, ALI, True, halo=True))
    o.append(T(xc - 30, 246, "初めに振子 1 だけを 1° 傾ける。", "start", 9.5, MUT))
    o.append(T(xc - 30, 261, "そろう動きは −4 の極で収まるが、", "start", 9.5, MUT))
    o.append(T(xc - 30, 276, "差は cosh(5.72t) × 1° で増える", "start", 9.5, ALI))
    return SVG(700, 312, o,
               "1 台の台車に立てた 2 本の振子（おもりはどちらも 0.2 kg）。(a) 2 本の長さが同じだと、台車の加速度は 2 本に同じように効くので、2 本の傾きの差は動かせない（可制御性行列の階数は 6 のうち 4）。長さが違えば可制御だが、長さが近いほど大きなゲインが要る。(b) 同じ長さで、2 本がそろう動きと台車の 4 つの極を −4 に置いても、差のモードの固有値 ±5.72 は残る。(c) そのとき振子 1 だけを 1° 傾けると、2 本は逆向きに倒れていく（線形化した式で計算）。")


F["e18_twopend"] = _f18_twopend_fig()


# =====================================================================
# 3 節: 2 次の対象で係数を比べる計算
# =====================================================================
_F18_AB = "ā"     # 望む特性多項式の係数の記号（a の上に横線）


def _f18_num(x, y, k, c=SIG):
    return CIRC(x, y, 10, c=c, lw=1.3, fill=soft(c)) + T(x, y + 4, str(k), "middle", 11, c, True)


def _f18_coef_fig():
    o = []
    sz = 11
    ab = _F18_AB
    x0 = 48
    ys = [40, 102, 174, 238, 290]
    for k, y in enumerate(ys):
        o.append(_f18_num(26, y, k + 1))
    s1, xe = _f18_row(x0, ys[0], [("t", "A − BF ="), ("m", [["a_{11} − b_{1}f_{1}", "a_{12} − b_{1}f_{2}"], ["a_{21} − b_{2}f_{1}", "a_{22} − b_{2}f_{2}"]])], sz)
    o.append(s1)
    o.append(TX(xe + 14, ys[0] - 4, "BF の i 行 j 列は b_{i}f_{j}（B は 2 行 1 列、F は 1 行 2 列）", "start", 10, MUT))
    o.append(TX(xe + 14, ys[0] + 12, "A = [a_{ij}]、B = [b_1, b_2]ᵀ、F = [f_1, f_2]", "start", 10, MUT))
    o.append(TX(x0, ys[1] - 6, "det(λI − A + BF) = λ^2 + (b_{1}f_{1} + b_{2}f_{2} − a_{11} − a_{22})λ", "start", sz, INK))
    o.append(TX(x0 + 112, ys[1] + 14, "+ det A + (a_{12}b_{2} − a_{22}b_{1})f_{1} + (a_{21}b_{1} − a_{11}b_{2})f_{2}", "start", sz, INK))
    o.append(T(690, ys[1] + 30, "（f₁f₂ の項は打ち消し合う）", "end", 9.5, MUT))
    o.append(TX(x0, ys[2] - 26, ab + "(λ) = λ^2 + " + ab + "_{1}λ + " + ab + "_{0} と係数を比べる:", "start", 10.5, INK))
    s3, xe = _f18_row(x0, ys[2] + 6, [("m", [[("b_1", SIG), ("b_2", SIG)], [("a_{12}b_{2} − a_{22}b_{1}", SIG), ("a_{21}b_{1} − a_{11}b_{2}", SIG)]]),
                                      ("m", [["f_1"], ["f_2"]], GLD), ("t", "="),
                                      ("m", [[ab + "_1 + a_{11} + a_{22}"], [ab + "_0 − det A"]])], sz)
    o.append(s3)
    o.append(TX(x0, ys[3], "左の行列の行列式 = a_{21}b_{1}^2 + (a_{22} − a_{11})b_{1}b_{2} − a_{12}b_{2}^2 = det [B  AB]", "start", sz, SIG, True))
    o.append(TX(x0, ys[3] + 18, "→ 可制御（det [B  AB] ≠ 0）なら、どんな " + ab + "_1・" + ab + "_0 にも、f_1・f_2 がただ 1 つ決まる", "start", 10, INK))
    o.append(TX(x0, ys[4], "台車（a_{11} = 0、a_{12} = 1、a_{21} = −25、a_{22} = −2、b_1 = 0、b_2 = 1）: f_2 = " + ab + "_1 − 2、f_1 = " + ab + "_0 − 25", "start", 10.5, INK))
    o.append(TX(x0, ys[4] + 20, "極 −5 ± j5 なら " + ab + "(λ) = (λ + 5)^2 + 25 = λ^2 + 10λ + 50 なので F = [25  8]", "start", 10.5, GLD, True))
    return SVG(700, 322, o,
               "2 次の対象で、閉ループの特性多項式の係数を望む多項式の係数と比べて F を求める手順。① A − BF を作り、② その特性多項式を f₁・f₂ で表すと、係数は f₁・f₂ の 1 次式になる。③ 望む多項式 ā(λ) と係数を等しいとおくと、f₁・f₂ の連立 1 次方程式になる。④ その行列の行列式は、可制御性行列 [B AB] の行列式と同じ式である。⑤ 台車とばね・ダンパに当てはめた例。")


F["e18_coef"] = _f18_coef_fig()


# =====================================================================
# 3 節: 可制御正準形の引き算、ケーリー・ハミルトンの定理、アッカーマンの式の手順（台車）
# =====================================================================
def _f18_acker_fig():
    o = []
    ab = _F18_AB
    o.append(T(14, 18, "(a) 可制御正準形: ゲインが係数を 1 つずつずらす（台車）", "start", 11.5, INK, True))
    rows = [("定数の項", "a_0 = 25", ab + "_0 = 50", 25.0, 50.0, "f_1 = 25"), ("λ の係数", "a_1 = 2", ab + "_1 = 10", 2.0, 10.0, "f_2 = 8")]
    X = lambda v: 110 + v * 3.6
    for i, (nm, a_, b_, va, vb, fl) in enumerate(rows):
        y = 52 + i * 46
        o.append(T(20, y + 4, nm, "start", 10, INK, True))
        o.append(RECT(X(0), y - 8, X(va) - X(0), 14, 2, MSOFT, MUT, 1.1))
        o.append(TX(X(0) + 4, y + 22, a_, "start", 9.5, MUT))
        o.append(ARR(X(va), y - 1, X(vb), y - 1, c=GLD, lw=2.2))
        o.append(TX((X(va) + X(vb)) / 2, y - 12, "+" + fl, "middle", 10, GLD, True, halo=True))
        o.append(D(X(vb), y - 1, SIG, 4))
        o.append(TX(X(vb) + 8, y + 3, b_, "start", 10, SIG, True))
    o.append(TX(20, 150, "最後の行: [−a_{0} − f_{1}, −a_{1} − f_{2}] = [−50, −10]", "start", 10, INK))
    # (b) ケーリー・ハミルトンの定理
    xb = 380
    o.append(T(xb, 18, "(b) ケーリー・ハミルトンの定理（台車）", "start", 11.5, INK, True))
    o.append(TX(xb, 44, "a(λ) = λ^2 + 2λ + 25 の λ に A を入れる:", "start", 10, INK))
    s, xe = _f18_row(xb, 82, [("t", "A^2 + 2A + 25I ="), ("m", [["−25", "−2"], ["50", "−21"]]), ("t", "+"),
                              ("m", [["0", "2"], ["−50", "−4"]]), ("t", "+"), ("m", [["25", "0"], ["0", "25"]])], 10.5)
    o.append(s)
    s, xe = _f18_row(xb + 70, 130, [("t", "="), ("m", [["0", "0"], ["0", "0"]], SIG)], 10.5)
    o.append(s)
    o.append(T(xb + 130, 134, "（どの行列も自分の特性多項式を満たす）", "start", 9.5, MUT))
    # (c) アッカーマンの式の手順
    yc = 186
    o.append(T(14, yc, "(c) アッカーマンの式 F = [0 … 0 1][B  AB …]⁻¹ ā(A) の手順（台車、極 −5 ± j5）", "start", 11.5, INK, True))
    yb = yc + 54
    s, xe = _f18_row(20, yb, [("t", "[B  AB] ="), ("m", [["0", "1"], ["1", "−2"]]), ("t", "→ 逆行列"), ("m", [["2", "1"], [("1", SIG), ("0", SIG)]])], 10.5)
    o.append(s)
    o.append(T(xe + 2, yb + 26, "の 2 行目", "start", 9.5, SIG))
    s, xe2 = _f18_row(xe + 62, yb, [("t", ab + "(A) = A^2 + 10A + 50I ="), ("g", 10), ("m", [[("25", GLD), ("8", GLD)], ["−200", "9"]])], 10.5)
    o.append(s)
    o.append(TX(20, yb + 60, "F = [1  0] " + ab + "(A) = （" + ab + "(A) の 1 行目）= [25  8]", "start", 11, GLD, True))
    o.append(TX(20, yb + 82, "倒立振子（4 行 4 列）も同じ手順で、[B  AB  A^{2}B  A^{3}B] の逆行列の 4 行目に " + ab + "(A) を掛ける", "start", 10, MUT))
    return SVG(700, yb + 96, o,
               "極配置の 2 つの道具（台車とばね・ダンパ、望む極 −5 ± j5、ā(λ) = λ² + 10λ + 50）。(a) 可制御正準形では、f₁ が定数の項を、f₂ が λ の係数を、それぞれ望む値へずらす。台車の A と B はもともとこの形で、引き算だけで F が求まる。(b) 行列 A を自分の特性多項式に入れると 0 の行列になる。(c) アッカーマンの式は、可制御性行列の逆行列の最後の行に、望む多項式に A を入れた行列を掛ける。係数の比較と同じ F = [25 8] になる。")


F["e18_acker"] = _f18_acker_fig()


# =====================================================================
# 3 節: 比例だけのカスケード制御と状態フィードバック（モータ）
# =====================================================================
def _f18_cascade_fig():
    o = []
    o.append(T(14, 18, "(a) 比例だけの 3 段のカスケード制御（14 章 4 節の構成）", "start", 11.5, INK, True))
    yc = 64
    s, pos, xe = CHAIN(16, yc, [("a", 30, "r", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 18, None, INK), ("b", "K_θ", "k1"),
                                ("a", 50, None, INK), ("s", {"l": "+", "b": "−"}, "s2"), ("a", 18, None, INK), ("b", "K_ω", "k2"),
                                ("a", 50, None, INK), ("s", {"l": "+", "b": "−"}, "s3"), ("a", 18, None, INK), ("b", "K_i", "k3"),
                                ("a", 40, "v", GLD), ("b", "モータ", "P", SIG, SSOFT)])
    o.append(s)
    o.append(T((pos["k1"][1] + pos["s2"] - 15) / 2, yc - 9, "角速度の目標", "middle", 9, MUT, halo=True))
    o.append(T((pos["k2"][1] + pos["s3"] - 15) / 2, yc - 9, "電流の目標", "middle", 9, MUT, halo=True))
    xo = xe
    outs = [("i", -11, 26, "s3", TEA), ("ω_m", 0, 46, "s2", PUR), ("θ_m", 11, 66, "s1", SIG)]
    for k, (nm, dy, dep, sn, c) in enumerate(outs):
        x2 = xo + 26 + k * 22
        o.append(W(xo, yc + dy, x2, yc + dy, c=c, lw=1.5))
        o.append(W(x2, yc + dy, x2, yc + dep, c=c, lw=1.5))
        o.append(W(x2, yc + dep, pos[sn], yc + dep, c=c, lw=1.5))
        o.append(ARR(pos[sn], yc + dep, pos[sn], yc + 15, c=c, lw=1.5, head=6))
        o.append(TX(x2 + 4, yc + dy - 3 if k < 2 else yc + dy + 12, nm, "start", 10, c, True, halo=True))
    o.append(TX(16, yc + 92, "v = K_{i}{K_{ω}(K_{θ}(r − θ_{m}) − ω_{m}) − i} = −K_{i}i − K_{i}K_{ω}ω_{m} − K_{i}K_{ω}K_{θ}θ_{m} + K_{i}K_{ω}K_{θ}r", "start", 10.5, INK))
    # (b) 状態フィードバック
    yb = 196
    o.append(TX(14, yb, "(b) 状態フィードバック（x = [i, ω_{m}, θ_{m}]ᵀ）", "start", 11.5, INK, True))
    yc2 = yb + 44
    s, p2, xe2 = CHAIN(16, yc2, [("a", 30, "r", MUT), ("b", "f_3", "g"), ("a", 30, None, INK), ("s", {"l": "+", "b": "−"}, "s"),
                                  ("a", 54, "v", GLD), ("b", "モータ", "P", SIG, SSOFT)])
    o.append(s)
    xt = xe2 + 56
    o.append(W(xe2, yc2, xt + 30, yc2, c=SIG, lw=4))
    o.append(_head(xt + 20, yc2, xt + 40, yc2, SIG, 10))
    o.append(D(xt, yc2, SIG, 4.6))
    o.append(T(xe2 + 6, yc2 - 9, "x", "start", 11, SIG, True, halo=True))
    yfb = yc2 + 44
    wF = TFBW("F = [f_1  f_2  f_3]")
    xm = (xt + p2["s"]) / 2 + 30
    o.append(W(xt, yc2, xt, yfb, c=SIG, lw=4))
    o.append(W(xt, yfb, xm + wF / 2 + 4, yfb, c=SIG, lw=4))
    o.append(_head(xm + wF / 2 + 22, yfb, xm + wF / 2, yfb, SIG, 10))
    o.append(TFBOX(xm - wF / 2, yfb, "F = [f_1  f_2  f_3]", wF, SIG, PAN)[0])
    o.append(W(xm - wF / 2, yfb, p2["s"], yfb, c=GLD, lw=1.5))
    o.append(ARR(p2["s"], yfb, p2["s"], yc2 + 15, c=GLD, lw=1.5, head=6))
    # (c) 対応
    xc = 440
    o.append(T(xc, yb, "(c) 2 つは同じ形", "start", 11.5, INK, True))
    lines = [("f_{1} = K_{i} = 0.5 V/A", INK), ("f_{2} = K_{i}K_{ω} = 0.5 V/(rad/s)", INK), ("f_{3} = K_{i}K_{ω}K_{θ} = 40 V/rad", INK),
             ("極 −100・−400・−2000 に置く F は", SIG), ("K_{i} = 0.5、K_{ω} = 1.0、K_{θ} = 80 /s の 3 段と同じ", SIG)]
    for i, (l, c) in enumerate(lines):
        o.append(TX(xc, yb + 26 + i * 19, l, "start", 10, c, i >= 3))
    return SVG(700, yfb + 32, o,
               "DC モータの角度の制御。(a) 3 つのループを比例だけにしたカスケード制御は、外側から順に、角度の偏差から角速度の目標、角速度の偏差から電流の目標、電流の偏差から電圧を作る。(b) 展開すると、電流・角速度・角度にゲインを掛けて足す状態フィードバックに、目標値の項を足したものになる。(c) 極配置で求めた F は、ゲインを内側から順に掛け合わせた形に書き直せる。")


F["e18_cascade"] = _f18_cascade_fig()


# =====================================================================
# 4 節: 倒立振子の極配置（極 −4 × 4）
# =====================================================================
_F18_F4 = _f18_acker(_F18_AP, _F18_BP, [-4.0] * 4)          # [−3.914, −3.914, −22.44, −3.574]


def _f18_fast(F, x0, T, h=0.002, umax=None, nl=True):
    """倒立振子の閉ループ（u = −F x、飽和つき）を、numpy を使わない 4 次のルンゲ・クッタ法で解く（限界を二分法で探すため）。
    返り値 (最後の状態, 倒れたか)。"""
    M, m, l, g = _F18_M, _F18_m, _F18_l, _F18_g
    f1, f2, f3, f4 = (float(v) for v in F)

    def f(p, pd, ph, phd):
        u = -(f1 * p + f2 * pd + f3 * ph + f4 * phd)
        if umax is not None:
            u = umax if u > umax else (-umax if u < -umax else u)
        if nl:
            s, c = math.sin(ph), math.cos(ph)
            pdd = (u - m * g * s * c + m * l * phd * phd * s) / (M + m * s * s)
            phdd = (g * s - pdd * c) / l
        else:
            pdd = (u - m * g * ph) / M
            phdd = ((M + m) * g * ph - u) / (M * l)
        return pd, pdd, phd, phdd

    p, pd, ph, phd = x0
    for _ in range(int(round(T / h))):
        a = f(p, pd, ph, phd)
        b = f(p + h / 2 * a[0], pd + h / 2 * a[1], ph + h / 2 * a[2], phd + h / 2 * a[3])
        c = f(p + h / 2 * b[0], pd + h / 2 * b[1], ph + h / 2 * b[2], phd + h / 2 * b[3])
        d = f(p + h * c[0], pd + h * c[1], ph + h * c[2], phd + h * c[3])
        p += h / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]); pd += h / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1])
        ph += h / 6 * (a[2] + 2 * b[2] + 2 * c[2] + d[2]); phd += h / 6 * (a[3] + 2 * b[3] + 2 * c[3] + d[3])
        if abs(ph) > math.pi / 2:
            return (p, pd, ph, phd), True
    return (p, pd, ph, phd), False


def _f18_maxtilt(F, umax, h=0.002, T=8.0):
    """立て直せる初めの傾きの上限 [°]（二分法。8 s 後に角度 0.5° 以内・台車 5 cm 以内に戻れば立て直せたとする）。"""
    def ok(d):
        x, fell = _f18_fast(F, (0.0, 0.0, math.radians(d), 0.0), T, h, umax)
        return (not fell) and abs(x[2]) < math.radians(0.5) and abs(x[0]) < 0.05
    lo, hi = 0.0, 89.0
    if not ok(0.5):
        return 0.0
    for _ in range(14):
        mid = (lo + hi) / 2
        if ok(mid):
            lo = mid
        else:
            hi = mid
    return lo


def _f18_pendF_fig():
    o = []
    F = _F18_F4
    o.append(T(14, 18, "(a) 極を −4 に 4 つ置く", "start", 11.5, INK, True))
    P = Plot(50, 34, 220, 160, (-9, 9), (-6.5, 6.5))
    o.append(_f18_box(P)); o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl="虚部 [rad/s]", xt=[-8, -4, 0, 4, 8], yt=[-5, 0, 5], grid=False))
    for z, dy in ((6.766, 0), (0.0, 0), (-6.766, 0)):
        o.append(CARR(P.X(z), P.Y(0) - 8, P.X(-4) + (8 if z > -4 else -8), P.Y(0) - 8, 0.35 if z > -4 else -0.35, MUT, 1.2, 6))
    for z in (6.766, 0.0, -6.766):
        o.append(_f18_X(P, complex(z, 0), MUT, 5.5, 2.0))
    o.append(_f18_X(P, complex(-4, 0), SIG, 7, 2.8))
    o.append(T(P.X(0) + 4, P.Y(0) + 18, "0（2 つ）", "start", 9.5, MUT, halo=True))
    o.append(T(P.X(6.766), P.Y(0) + 18, "+6.77", "middle", 9.5, MUT, halo=True))
    o.append(T(P.X(-6.766), P.Y(0) + 18, "−6.77", "middle", 9.5, MUT, halo=True))
    o.append(T(P.X(-4), P.Y(0) + 34, "−4（4 つ）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(P.X(0), P.Y(-5.3), "灰色: 開ループの極", "middle", 9, MUT, halo=True))
    # (b) ゲインと意味
    xb = 312
    o.append(T(xb, 18, "(b) 入力 u = −Fx の 4 つの項", "start", 11.5, INK, True))
    rows = [("φ", F[2], "N/rad", "振子が傾いた向きへ台車を押す", SIG),
            ("\\dot{φ}", F[3], "N/(rad/s)", "傾く速さの向きへ押す", SIG),
            ("p", F[0], "N/m", "台車が右にあると、さらに右へ押す", GLD),
            ("\\dot{p}", F[1], "N/(m/s)", "台車が右へ動いていると、さらに右へ", GLD)]
    for i, (nm, f, un, mean, c) in enumerate(rows):
        y = 48 + i * 26
        o.append(TX(xb, y, "+" + _f18_fx(-f, 3 if abs(f) < 10 else 2) + " " + un + " × ", "start", 10.5, c, True))
        o.append(TX(xb + 128, y, nm, "start", 11, c, True))
        o.append(T(xb + 150, y, mean, "start", 10, INK))
    o.append(T(xb, 158, "位置と速度のゲインが負（u に正で効く）でなければならない理由:", "start", 10, INK, True))
    o.append(TX(xb, 178, "閉ループの特性多項式の定数の項 = −(g/(Ml))f_{1} = 65.4 × 3.914 = 256", "start", 10, INK))
    o.append(T(xb, 196, "安定な多項式の係数はすべて正（9 章 2 節）なので f₁ < 0", "start", 10, ALI, True))
    # (c) 台車を 10 cm ずらして放す
    yc = 258
    o.append(T(14, yc, "(c) 台車を 10 cm 右にずらして放す（線形でない式）: 台車はまず、さらに右へ進む", "start", 11.5, INK, True))
    ts, xs, us, fell = _f18_run(F, [0.1, 0, 0, 0], 3.0, h=0.001)
    specs = [("台車の位置 p [cm]", xs[:, 0] * 100, (-2, 12), [0, 5, 10], GLD), ("振子の角度 φ [°]", _f18_np.degrees(xs[:, 2]), (-1.5, 1.0), [-1, 0, 1], SIG),
             ("力 u [N]", us, (-0.3, 0.45), [-0.2, 0, 0.2, 0.4], GLD)]
    for k, (yl, ys, yr, yt, c) in enumerate(specs):
        q = Plot(58 + k * 228, yc + 30, 180, 100, (0, 3), yr)
        o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 1, 2, 3], yt=yt, xfmt=lambda v: "%g" % v, yfmt=lambda v: _f18_ff(v)))
        o.append(TX(q.x - 4, q.y - 8, yl, "start", 10, c, True))
        o.append(W(q.X(0), q.Y(0), q.X(3), q.Y(0), c=FNT, lw=1))
        o.append(q.clip(list(zip(ts, ys)), c=c if k != 1 else SIG, lw=2.0))
        if k == 0:
            i = int(_f18_np.argmax(xs[:, 0]))
            o.append(D(q.X(ts[i]), q.Y(xs[i, 0] * 100), ALI, 3.6))
            o.append(T(q.X(ts[i]) + 6, q.Y(xs[i, 0] * 100) + 14, "0.22 s に 10.43 cm", "start", 9.5, ALI, True, halo=True))
        if k == 1:
            i = int(_f18_np.argmin(xs[:, 2]))
            o.append(D(q.X(ts[i]), q.Y(math.degrees(xs[i, 2])), ALI, 3.6))
            o.append(T(q.X(ts[i]) + 6, q.Y(math.degrees(xs[i, 2])) + 4, "左へ 1.22°", "start", 9.5, ALI, True, halo=True))
        if k == 2:
            o.append(T(q.X(0.08), q.Y(0.39) + 4, "初めは右へ 0.39 N", "start", 9.5, GLD, True, halo=True))
    return SVG(700, yc + 30 + 100 + 44, o,
               "倒立振子の 4 つの極を −4 に置いた状態フィードバック F = [−3.914 −3.914 −22.44 −3.574]。(a) 開ループの極 0・0・±6.77 が −4 へ移る。(b) 角度と角速度の項は、振子が傾いた向きへ台車を押す。位置と速度の項も正の向きに効き、台車が右にあると、さらに右へ押す。(c) 台車を 10 cm ずらして放すと、台車はいったん右へ進んで振子を左へ傾け、それから左へ戻る。台車を左へ動かすには、振子を先に左へ傾けておかなければならないからである。")


F["e18_pendF"] = _f18_pendF_fig()


def _f18_pend_resp_fig():
    o = []
    F = _F18_F4
    # (a) 押したときの連続した絵
    o.append(T(14, 18, "(a) 振子のおもりを右へ 1 N で 0.1 s 押す（線形でない式。位置と長さは同じ縮尺）", "start", 11.5, INK, True))
    tp, xp, up, fp = _f18_run(F, [0, 0, 0, 0], 4.0, h=0.001, push=(0.0, 0.1, 1.0))
    frames = [0.0, 0.12, 0.3, 0.49, 0.8, 1.5, 3.0]
    sc = 170.0
    gy = 132
    for k, t0 in enumerate(frames):
        x0 = 54 + k * 98
        i = int(round(t0 / 0.001))
        p, ph, u = xp[i, 0], xp[i, 2], up[i]
        o.append(_f18_ground(x0 - 44, x0 + 50, gy))
        o.append(W(x0, gy + 2, x0, gy + 10, c=MUT, lw=1.2))
        o.append(_f18_pendcart(x0 + p * sc, gy, ph, L=_F18_l * sc, cw=34, ch=14, c=SIG, lw=2.0, bob=6))
        if abs(u) > 0.05:
            cx = x0 + p * sc
            L = 10 + 8 * abs(u)
            if u > 0:
                o.append(ARR(cx - 17 - L, gy - 19, cx - 17, gy - 19, c=GLD, lw=2))
            else:
                o.append(ARR(cx + 17 + L, gy - 19, cx + 17, gy - 19, c=GLD, lw=2))
        if t0 == 0.0:
            bx = x0 + _F18_l * sc * math.sin(ph); by = gy - 26 - _F18_l * sc * math.cos(ph)
            o.append(ARR(bx - 30, by, bx - 8, by, c=PUR, lw=2.2))
        o.append(T(x0, gy + 22, "%g s" % t0, "middle", 10, INK, True))
        o.append(T(x0, gy + 36, "%s°・%s cm" % (_f18_fx(math.degrees(ph), 1), _f18_fx(p * 100, 1)), "middle", 9, MUT))
    o.append(T(14, gy + 54, "紫の矢印: 押す力　金の矢印: 制御器が台車を押す力（長さは力の大きさ）　縦の線: 台車の初めの位置", "start", 9.5, MUT))
    # (b)(c) 波形
    tt, xt, ut, ft = _f18_run(F, [0, 0, math.radians(10), 0], 4.0, h=0.001)
    tl, xl, ul, fl = _f18_run(F, [0, 0, math.radians(10), 0], 4.0, h=0.001, nl=False)
    yb = gy + 82
    cols = [("(b) 10° 傾けて放す", tt, xt, ut, tl, xl, ul, 58), ("(c) (a) の押す場合", tp, xp, up, None, None, None, 400)]
    specs = [("角度 φ [°]", 2, (-10, 12), [-10, 0, 10], SIG, 180 / math.pi), ("台車の位置 p [cm]", 0, (-5, 30), [0, 10, 20, 30], GLD, 100.0),
             ("力 u [N]", None, (-2, 4.5), [-2, 0, 2, 4], GLD, 1.0)]
    for title, t1, x1, u1, t2, x2, u2, xq in cols:
        o.append(T(xq - 44, yb, title, "start", 11.5, INK, True))
        for k, (yl, idx, yr, yt, c, scl) in enumerate(specs):
            q = Plot(xq, yb + 22 + k * 78, 250, 52, (0, 4), yr)
            o.append(q.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 1, 2, 3, 4], yt=yt, xfmt=(lambda v: "%g" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: _f18_ff(v), sz=9))
            o.append(TX(q.x + q.w - 6, q.y + 11, yl, "end", 9.5, c, True, halo=True))
            o.append(W(q.X(0), q.Y(0), q.X(4), q.Y(0), c=FNT, lw=1))
            ys1 = (u1 if idx is None else x1[:, idx]) * scl
            o.append(q.clip(list(zip(t1, ys1)), c=c, lw=2.0))
            if t2 is not None:
                ys2 = (u2 if idx is None else x2[:, idx]) * scl
                o.append(q.clip(list(zip(t2, ys2)), c=MUT, lw=1.4, dash="5 3"))
    o.append(LEGL(58, yb + 22 + 3 * 78 + 20, [(SIG, None, "線形でない式"), (MUT, "5 3", "線形化した式（(b) だけ）")], 9.5, 16))
    return SVG(700, yb + 22 + 3 * 78 + 30, o,
               "線形化した式で決めた F（4 つの極を −4）を、線形でない式の倒立振子につないだ応答。(a) おもりを右へ押すと、台車がすぐに下へ回り込むので、振子は右へ 2.0° しか傾かない。台車を元の位置へ戻すために振子を左へ傾け（0.49 s に −8.7°）、押し始めから 2.6 s で ±0.2° に収まる。(b) 10° から放すと、力は初めの 3.92 N が最大で、2.37 s で ±0.2° に収まる。線形化した式との差は小さい。(c) (a) の角度・台車の位置・力。")


F["e18_pend_resp"] = _f18_pend_resp_fig()


def _f18_pend_limit_fig():
    o = []
    F = _F18_F4
    o.append(T(14, 18, "(a) 立て直せる初めの傾きと、力の上限", "start", 11.5, INK, True))
    P = Plot(60, 36, 260, 200, (0, 20), (0, 90))
    o.append(P.axes(xl="力の上限 [N]", yl="初めの傾きの上限 [°]", xt=[0, 5, 10, 15, 20], yt=[0, 30, 60, 90]))
    um = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]
    ys = [_f18_maxtilt(F, u) for u in um]
    st = [(u, math.degrees(math.atan(u / ((_F18_M + _F18_m) * _F18_g)))) for u in _f18_np.linspace(0, 20, 81)]
    o.append(P.line(st, c=ALI, lw=1.8, dash="6 4"))
    o.append(P.line(list(zip(um, ys)), c=SIG, lw=2.2))
    for u, y in zip(um, ys):
        o.append(D(P.X(u), P.Y(y), SIG, 2.6))
    ynl = _f18_maxtilt(F, None)
    o.append(W(P.X(0), P.Y(ynl), P.X(20), P.Y(ynl), c=MUT, lw=1.2, dash="3 3"))
    o.append(T(P.X(19.6), P.Y(ynl) + 14, "上限なし: %s°（線形化の範囲の限界）" % _f18_fx(ynl, 1), "end", 9.5, MUT, halo=True))
    o.append(T(P.X(1.0), P.Y(84), "どんな制御器でも越えられない", "start", 9.5, ALI, True, halo=True))
    o.append(T(P.X(1.0), P.Y(84) + 13, "tan φ = 上限 ÷ ((M + m)g)（赤の破線）", "start", 9.5, ALI, True, halo=True))
    y5 = _f18_maxtilt(F, 5.0)
    o.append(D(P.X(5), P.Y(y5), SIG, 4.2)); o.append(D(P.X(5), P.Y(36.06), ALI, 4.2))
    o.append(T(P.X(5) + 6, P.Y(y5) + 15, "5 N: %s°" % _f18_fx(y5, 1), "start", 9.5, SIG, True, halo=True))
    o.append(T(P.X(5) - 6, P.Y(36.06) - 6, "36.1°", "end", 9.5, ALI, True, halo=True))
    o.append(T(P.X(10), P.Y(10), "極 −4 × 4 の F", "start", 9.5, SIG, True, halo=True))
    # (b) 上限 5 N で 25° と 32°
    xb = 410
    o.append(T(xb - 40, 18, "(b) 力の上限 5 N で、25° と 32° から", "start", 11.5, INK, True))
    q = Plot(xb, 36, 270, 96, (0, 3), (-40, 90))
    o.append(q.axes(xl=None, yl=None, xt=[0, 1, 2, 3], yt=[-30, 0, 30, 60, 90], xfmt=lambda v: "", yfmt=lambda v: _f18_ff(v), sz=9))
    o.append(TX(q.x - 34, q.y + q.h / 2, "角度 φ [°]", "middle", 9.5, MUT, rot=-90))
    r = Plot(xb, 160, 270, 76, (0, 3), (-6, 6))
    o.append(r.axes(xl="時間 t [s]", yl=None, xt=[0, 1, 2, 3], yt=[-5, 0, 5], xfmt=lambda v: "%g" % v, yfmt=lambda v: _f18_ff(v), sz=9))
    o.append(TX(r.x - 34, r.y + r.h / 2, "力 u [N]", "middle", 9.5, MUT, rot=-90))
    for d0, c in ((25.0, GRN), (32.0, ALI)):
        ts, xs, us, fell = _f18_run(F, [0, 0, math.radians(d0), 0], 3.0, h=0.001, umax=5.0)
        o.append(q.clip(list(zip(ts, _f18_np.degrees(xs[:, 2]))), c=c, lw=2.0))
        o.append(r.clip(list(zip(ts, us)), c=c, lw=2.0))
    o.append(W(r.X(0), r.Y(5), r.X(3), r.Y(5), c=FNT, lw=1, dash="3 3")); o.append(W(r.X(0), r.Y(-5), r.X(3), r.Y(-5), c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(1.2), q.Y(-12), "25°: 上限に張り付いた後に立つ", "start", 9.5, GRN, True, halo=True))
    o.append(T(q.X(0.66), q.Y(62), "32°: 倒れる", "start", 9.5, ALI, True, halo=True))
    return SVG(700, 276, o,
               "倒立振子を立て直せる初めの傾き（線形でない式、振子は静かに放す）。(a) 力に上限が無くても、線形化した式で決めた F で立て直せるのは 55.9° まで。上限があると、(M + m)g tan φ を超える力は出せないので、その角度（赤の破線）より傾くと、どんな制御器でも傾きが増えるのを止められない。極を −4 に置いた F は、その少し手前まで立て直せる（5 N で 30.2°）。(b) 上限 5 N のとき、25° からは力が張り付いた後に立ち、32° からは倒れる。")


F["e18_pend_limit"] = _f18_pend_limit_fig()


# =====================================================================
# 5 節: 積分型サーボ系
# =====================================================================
_F18_CY = _f18_np.array([1.0, 0, 0, 0])
_F18_AI = _f18_np.block([[_F18_AP, _f18_np.zeros((4, 1))], [-_F18_CY[None, :], _f18_np.zeros((1, 1))]])
_F18_BI = _f18_np.concatenate([_F18_BP, [0.0]])
_F18_FI = _f18_acker(_F18_AI, _F18_BI, [-4.0] * 5)          # [−19.57, −10.26, −36.74, −6.079, 15.66]


def _f18_servo_bd_fig():
    o = []
    yc = 70
    o.append(T(14, 18, "積分型サーボ系（台車の位置 y = p を目標値 r に追従させる）", "start", 11.5, INK, True))
    s, pos, xe = CHAIN(14, yc, [("a", 30, "r", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 34, "e", INK),
                                ("b", ("1", "s"), "I", SIG, SSOFT), ("a", 34, "w", SIG), ("b", "f_I", "fi"), ("a", 30, None, GLD),
                                ("s", {"l": "−", "b": "−"}, "s2"), ("a", 34, "u", GLD), ("s", {"l": "+", "t": "+"}, "s3"),
                                ("a", 30, None, GLD), ("b", "\\dot{x} = Ax + Bu + Bd", "P", SIG, SSOFT)])
    o.append(s)
    o.append(TOPIN(pos["s3"], yc, 40, "外乱 d", PUR))
    o.append(T((pos["I"][0] + pos["I"][1]) / 2, yc + 36, "偏差の積分", "middle", 9.5, SIG, True))
    o.append(T((pos["I"][0] + pos["I"][1]) / 2, yc + 49, "（5 つ目の状態 w）", "middle", 9.5, SIG))
    xt = xe + 40
    o.append(W(xe, yc, xt + 26, yc, c=SIG, lw=4))
    o.append(_head(xt + 16, yc, xt + 36, yc, SIG, 10))
    o.append(T(xe + 6, yc - 9, "x", "start", 11, SIG, True, halo=True))
    o.append(D(xt, yc, SIG, 4.6))
    y1, y2 = yc + 70, yc + 116
    o.append(W(xt, yc, xt, y2, c=SIG, lw=4))
    wF = TFBW("F")
    xmF = (xt + pos["s2"]) / 2 + 40
    o.append(W(xt, y1, xmF + wF / 2 + 4, y1, c=SIG, lw=4))
    o.append(_head(xmF + wF / 2 + 22, y1, xmF + wF / 2, y1, SIG, 10))
    o.append(TFBOX(xmF - wF / 2, y1, "F", wF, SIG, PAN)[0])
    o.append(W(xmF - wF / 2, y1, pos["s2"], y1, c=GLD, lw=1.5))
    o.append(ARR(pos["s2"], y1, pos["s2"], yc + 15, c=GLD, lw=1.5, head=6))
    o.append(TX((xmF - wF / 2 + pos["s2"]) / 2, y1 - 6, "Fx", "middle", 10, GLD, True, halo=True))
    wC = TFBW("C")
    xmC = (xt + pos["s1"]) / 2 + 60
    o.append(W(xt, y2, xmC + wC / 2 + 4, y2, c=SIG, lw=4))
    o.append(_head(xmC + wC / 2 + 22, y2, xmC + wC / 2, y2, SIG, 10))
    o.append(TFBOX(xmC - wC / 2, y2, "C", wC, LIN, PAN)[0])
    o.append(W(xmC - wC / 2, y2, pos["s1"], y2, c=SIG, lw=1.5))
    o.append(ARR(pos["s1"], y2, pos["s1"], yc + 15, c=SIG, lw=1.5, head=6))
    o.append(TX((xmC - wC / 2 + pos["s1"]) / 2, y2 - 6, "y = Cx = p", "middle", 10, SIG, True, halo=True))
    o.append(TX(14, y2 + 40, "u = −Fx − f_{I}w = −[F  f_{I}][x; w]（状態が 5 つの系の状態フィードバック）。落ち着くと \\dot{w} = r − y = 0 なので y = r", "start", 10.5, INK))
    return SVG(700, y2 + 54, o,
               "積分型サーボ系のブロック線図。偏差 e = r − y を積分した w を新しい状態にし、元の状態 x と合わせた 5 つの状態に状態フィードバックを掛ける。閉ループが安定なら、落ち着いたとき w の変わる速さ e が 0 なので、一定の外乱 d があっても制御量 y は目標値 r に一致する。外乱を打ち消す一定の力は、たまった積分 w が出す。")


F["e18_servo_bd"] = _f18_servo_bd_fig()


def _f18_servo_resp_fig():
    o = []
    r = lambda t: 0.5
    d = lambda t: 0.5 if t >= 6.0 else 0.0
    tn, xn, un, fn = _f18_run(_F18_F4, [0, 0, 0, 0], 14.0, h=0.002, r=r, dist=d)
    ti, xi, ui, fi = _f18_run(_F18_FI[:4], [0, 0, 0, 0], 14.0, h=0.002, r=r, dist=d, fI=_F18_FI[4])
    o.append(T(14, 18, "台車を 0.5 m 右の目標へ運び、6 s に右向き 0.5 N の外乱を加える（線形でない式）", "start", 11.5, INK, True))
    specs = [("台車の位置 p [m]", 0, (-0.1, 0.7), [0, 0.2, 0.4, 0.6], 1.0, 120),
             ("振子の角度 φ [°]", 2, (-4, 8), [-4, 0, 4, 8], 180 / math.pi, 70),
             ("力 u [N]", None, (-2.2, 1.4), [-2, -1, 0, 1], 1.0, 70)]
    y = 40
    Ps = []
    for k, (yl, idx, yr, yt, scl, hh) in enumerate(specs):
        q = Plot(64, y, 600, hh, (0, 14), yr)
        o.append(q.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 2, 4, 6, 8, 10, 12, 14], yt=yt,
                        xfmt=(lambda v: "%g" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: _f18_ff(v), sz=9))
        if k == 0:
            o.append(TX(q.x + 6, q.y + 12, yl, "start", 9.5, INK, True, halo=True))
        else:
            o.append(TX(q.x + q.w - 6, q.y + 12, yl, "end", 9.5, INK, True, halo=True))
        o.append(W(q.X(6), q.y, q.X(6), q.y + q.h, c=PUR, lw=1, dash="3 3"))
        if k == 0:
            o.append(W(q.X(0), q.Y(0.5), q.X(14), q.Y(0.5), c=MUT, lw=1.2, dash="6 4"))
        else:
            o.append(W(q.X(0), q.Y(0), q.X(14), q.Y(0), c=FNT, lw=1))
        ya = (un if idx is None else xn[:, idx]) * scl
        yb_ = (ui if idx is None else xi[:, idx]) * scl
        o.append(q.clip(list(zip(tn, ya)), c=ALI, lw=1.8, dash="6 3"))
        o.append(q.clip(list(zip(ti, yb_)), c=GRN, lw=2.2))
        Ps.append(q)
        y += hh + 26
    q = Ps[0]
    o.append(T(q.X(6) + 4, q.Y(0.2), "外乱 0.5 N", "start", 9.5, PUR, True, halo=True))
    o.append(T(q.X(14) - 4, q.Y(0.5) - 6, "目標 0.5 m", "end", 9.5, MUT, halo=True))
    o.append(T(q.X(13.8), q.Y(0.3723) + 14, "積分なし: 12.8 cm 左で止まる", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(8.9), q.Y(0.6), "積分あり: 左へ 2.8 cm ずれてから戻る", "start", 9.5, GRN, True, halo=True))
    o.append(T(q.X(2.1), q.Y(0.6), "先に左へ: 2.2 cm（積分なし）、1.1 cm（あり）", "start", 9.5, INK, halo=True))
    o.append(LEGL(64, y + 18, [(ALI, "6 3", "積分なし u = −F(x − x_r)（4 節の F）"), (GRN, None, "積分型サーボ系（5 つの極を −4）")], 9.5, 16))
    return SVG(700, y + 28, o,
               "倒立振子の台車を 0.5 m 右へ運ぶ。積分なし（赤の破線）は、初めに左向き 1.96 N で押して台車を先に左へ動かし、振子を右へ傾けてから運ぶ。6 s に一定の外乱が加わると、12.8 cm のずれが残る。積分型サーボ系（緑）は、目標値が積分を通してだけ入るので初めの力は 0 で、外乱の後も、積分がたまって外乱を打ち消す −0.5 N を出し、目標の位置へ戻る。")


F["e18_servo_resp"] = _f18_servo_resp_fig()


# =====================================================================
# 6 節: 極の速さ・観測ノイズ・並べ方
# =====================================================================
def _f18_speed_fig():
    o = []
    cases = [(2.0, TEA, "6 3"), (4.0, SIG, None), (8.0, PUR, None)]   # 2 rad/s は破線（色の近い 4 rad/s と区別する）
    o.append(TX(14, 18, "(a) 4 つの極を −ω_{p} に置いて、10° から立て直す", "start", 11.5, INK, True))
    runs = []
    for wp, c, dsh in cases:
        F = _f18_acker(_F18_AP, _F18_BP, [-wp] * 4)
        runs.append((wp, c, dsh, F) + _f18_run(F, [0, 0, math.radians(10), 0], 5.0, h=0.001)[:3])
    specs = [("角度 φ [°]", 2, (-8, 11), [-5, 0, 5, 10], 180 / math.pi), ("台車の位置 p [cm]", 0, (-5, 50), [0, 20, 40], 100.0),
             ("力 u [N]", None, (-4, 15), [0, 5, 10, 15], 1.0)]
    y = 40
    for k, (yl, idx, yr, yt, scl) in enumerate(specs):
        q = Plot(58, y, 300, 70, (0, 5), yr)
        o.append(q.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 1, 2, 3, 4, 5], yt=yt,
                        xfmt=(lambda v: "%g" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: _f18_ff(v), sz=9))
        o.append(TX(q.x + q.w - 4, q.y + 12, yl, "end", 9.5, INK, True, halo=True))
        o.append(W(q.X(0), q.Y(0), q.X(5), q.Y(0), c=FNT, lw=1))
        if idx is None:
            o.append(W(q.X(0), q.Y(5), q.X(5), q.Y(5), c=ALI, lw=1, dash="4 3"))
            o.append(T(q.X(5) - 2, q.Y(5) - 4, "5 N", "end", 9, ALI, halo=True))
        for wp, c, dsh, F, ts, xs, us in runs:
            ys = (us if idx is None else xs[:, idx]) * scl
            o.append(q.clip(list(zip(ts, ys)), c=c, lw=1.9, dash=dsh))
        y += 96
    o.append(LEGL(58, y + 22, [(TEA, "6 3", "ω_p = 2 rad/s"), (SIG, None, "4 rad/s"), (PUR, None, "8 rad/s")], 9.5, 14))
    # (b) ω_p に対する値
    xb = 448
    o.append(TX(xb - 40, 18, "(b) 極の速さ ω_p [rad/s] による違い", "start", 11.5, INK, True))
    wps = [2, 3, 4, 5, 6, 8]
    vals = {"u": [], "p": [], "lim": []}
    for wp in wps:
        F = _f18_acker(_F18_AP, _F18_BP, [-wp] * 4)
        ts, xs, us, fell = _f18_run(F, [0, 0, math.radians(10), 0], 6.0, h=0.002)
        vals["u"].append(float(_f18_np.abs(us).max())); vals["p"].append(float(_f18_np.abs(xs[:, 0]).max() * 100))
        vals["lim"].append(_f18_maxtilt(F, 5.0))
    rows = [("10° からの最大の力 [N]", "u", (0, 16), [0, 5, 10, 15], SIG), ("台車が動く最大の距離 [cm]", "p", (0, 50), [0, 25, 50], GLD),
            ("上限 5 N で立て直せる傾き [°]", "lim", (0, 40), [0, 20, 40], GRN)]
    for k, (yl, key, yr, yt, c) in enumerate(rows):
        q = Plot(xb, 40 + k * 96, 230, 64, (1.5, 8.5), yr)
        o.append(q.axes(xl="極の速さ ω_p [rad/s]" if k == 2 else None, yl=None, xt=wps, yt=yt,
                        xfmt=(lambda v: "%g" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: "%g" % v, sz=9))
        if key == "u":
            o.append(T(q.x + 6, q.y + 12, yl, "start", 9.5, INK, True, halo=True))
            o.append(W(q.X(1.5), q.Y(5), q.X(8.5), q.Y(5), c=ALI, lw=1, dash="4 3"))
            o.append(T(q.X(8.4), q.Y(5) + 12, "上限 5 N", "end", 9, ALI, halo=True))
        else:
            o.append(T(q.x + q.w - 4, q.y + 12, yl, "end", 9.5, INK, True, halo=True))
        o.append(q.line(list(zip(wps, vals[key])), c=c, lw=2))
        for w_, v in zip(wps, vals[key]):
            o.append(D(q.X(w_), q.Y(v), c, 3))
    return SVG(700, y + 34, o,
               "倒立振子の 4 つの極を同じ点 −ω<sub>p</sub> に置き、ω<sub>p</sub> を変えて比べる（線形でない式、振子を 10° 傾けて放す）。(a) 極を遠くへ置くほど、振子は速く立ち、台車の動きも小さいが、初めに要る力が大きい。(b) 最大の力は ω<sub>p</sub> とともに急に増え、上限 5 N（赤の破線）を超えると飽和して、立て直せる傾きが小さくなる。極が近いと、台車が大きく動く。")


F["e18_speed"] = _f18_speed_fig()


def _f18_noise_fig():
    o = []
    sig = _f18_np.array([0.001, 0.01, math.radians(0.1), math.radians(1.0)])
    o.append(T(14, 18, "(a) 立っているときの力（状態の測定に観測ノイズ）", "start", 11.5, INK, True))
    rng = _f18_np.random.default_rng(7)
    h = 0.001
    y = 40
    for wp, c in ((4.0, SIG), (8.0, PUR)):
        F = _f18_acker(_F18_AP, _F18_BP, [-wp] * 4)
        Acl = _F18_AP - _f18_np.outer(_F18_BP, F)
        Mx = _f18_np.zeros((5, 5)); Mx[:4, :4] = _F18_AP * h; Mx[:4, 4] = _F18_BP * h
        E = _f18_la.expm(Mx); Ad, Bd = E[:4, :4], E[:4, 4]
        x = _f18_np.zeros(4); us = []
        for k in range(3000):
            n = rng.normal(size=4) * sig
            u = -F @ (x + n)
            us.append(u)
            x = Ad @ x + Bd * u
        us = _f18_np.array(us[1000:])
        q = Plot(58, y, 300, 70, (0, 2), (-1.5, 1.5))
        o.append(q.axes(xl="時間 t [s]" if wp == 8.0 else None, yl=None, xt=[0, 0.5, 1, 1.5, 2], yt=[-1, 0, 1],
                        xfmt=(lambda v: "%g" % v) if wp == 8.0 else (lambda v: ""), yfmt=lambda v: _f18_ff(v), sz=9))
        tt = _f18_np.arange(len(us)) * h
        o.append(q.line(list(zip(tt[::4], us[::4])), c=c, lw=1.0))
        sd = math.sqrt(float(((_f18_np.abs(F) * sig) ** 2).sum()))
        o.append(TX(q.x + 6, q.y + 12, "力 u [N]、ω_p = %g rad/s: 標準偏差 %s N" % (wp, _f18_fmt(sd, 2)), "start", 9.5, c, True, halo=True))
        y += 96
    o.append(T(14, y + 22, "ノイズの標準偏差（例の値）: 位置 1 mm、速度 1 cm/s、角度 0.1°、角速度 1 °/s", "start", 9.5, MUT))
    # (b) 寄与
    xb = 420
    o.append(TX(xb - 30, 18, "(b) 力のノイズの内訳 |f_{i}| × 標準偏差 [N]", "start", 11.5, INK, True))
    q = Plot(xb, 40, 250, 150, (0, 3), (0, 0.5))
    o.append(q.axes(xl=None, yl=None, xt=[], yt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yfmt=lambda v: "%g" % v, sz=9))
    cols = [(GLD, "位置"), (TEA, "速度"), (SIG, "角度"), (PUR, "角速度")]
    for g_, wp in enumerate((2.0, 4.0, 8.0)):
        F = _f18_acker(_F18_AP, _F18_BP, [-wp] * 4)
        terms = _f18_np.abs(F) * sig
        for j, (c, nm) in enumerate(cols):
            x0 = q.X(g_ + 0.12 + j * 0.16)
            o.append(RECT(x0, q.Y(terms[j]), q.X(0.14) - q.X(0), q.Y(0) - q.Y(terms[j]), 1, soft(c), c, 1.0))
        tot = math.sqrt(float((terms ** 2).sum()))
        o.append(W(q.X(g_ + 0.08), q.Y(tot), q.X(g_ + 0.8), q.Y(tot), c=ALI, lw=1.6))
        o.append(T(q.X(g_ + 0.44), q.Y(tot) - 5, "計 %s" % _f18_fmt(tot, 2), "middle", 9, ALI, True, halo=True))
        o.append(TX(q.X(g_ + 0.44), q.y + q.h + 15, "ω_p = %g" % wp, "middle", 9.5, INK))
    o.append(LEGEND(xb - 20, q.y + q.h + 40, [(c, nm) for c, nm in cols], 9.5, 12))
    o.append(T(xb - 20, q.y + q.h + 60, "赤の線: 合わせた標準偏差（2 乗の和の平方根）", "start", 9.5, ALI))
    return SVG(700, max(y + 32, q.y + q.h + 72), o,
               "状態を測る値に観測ノイズが加わると、力にはゲイン倍されたノイズが加わる（線形化した式、1 ms ごとに独立なノイズ）。(a) 極の速さ ω<sub>p</sub> を 4 から 8 rad/s にすると、ゲインが大きくなり、力のノイズは約 5 倍になる。(b) ノイズの内訳。極を遠くへ置くほど、どの項も大きくなる。とくに速度と角速度の項が大きい。")


F["e18_noise"] = _f18_noise_fig()


def _f18_pattern_fig():
    o = []
    pats = [([-4.0] * 4, SIG, "−4 を 4 つ"), ([-3.0, -3.0, -6.0, -6.0], TEA, "−3 と −6 を 2 つずつ"), ([-2.0, -2.0, -8.0, -8.0], PUR, "−2 と −8 を 2 つずつ")]
    o.append(T(14, 18, "(a) 極の並べ方", "start", 11.5, INK, True))
    P = Plot(40, 40, 230, 80, (-9, 1), (-1.6, 1.6))
    o.append(_f18_box(P)); o.append(SPLANE(P))
    o.append(P.axes(xl="実部 [1/s]", yl=None, xt=[-8, -6, -4, -2, 0], yt=[], grid=False))
    for k, (pl, c, nm) in enumerate(pats):
        yy = 0.9 - k * 0.9
        for z in sorted(set(pl)):
            o.append(_f18_X(P, complex(z, yy), c, 5.5, 2.2))
            o.append(T(P.X(z), P.Y(yy) - 9, "×%d" % pl.count(z), "middle", 9, c, True, halo=True))
    o.append(T(40, 168, "（重ならないよう縦にずらして描いた。どれも実軸の上）", "start", 9, MUT))
    o.append(T(14, 196, "10° から立て直すとき:", "start", 10, INK, True))
    res = []
    for pl, c, nm in pats:
        F = _f18_acker(_F18_AP, _F18_BP, pl)
        ts, xs, us, fell = _f18_run(F, [0, 0, math.radians(10), 0], 6.0, h=0.001)
        idx = _f18_np.where(_f18_np.abs(xs[:, 0]) > 0.01)[0]
        t1 = ts[idx[-1] + 1]
        res.append((pl, c, nm, ts, xs, us, t1, float(_f18_np.abs(us).max())))
    for k, (pl, c, nm, ts, xs, us, t1, um) in enumerate(res):
        o.append(T(14, 216 + k * 18, "%s: ±1 cm に %s s、最大の力 %s N" % (nm, _f18_fmt(t1, 3), _f18_fmt(um, 3)), "start", 9.5, c, True))
    xb = 330
    o.append(T(xb - 30, 18, "(b) 台車の位置と力", "start", 11.5, INK, True))
    q = Plot(xb, 40, 340, 100, (0, 4), (-2, 18))
    o.append(q.axes(xl=None, yl=None, xt=[0, 1, 2, 3, 4], yt=[0, 5, 10, 15], xfmt=lambda v: "", yfmt=lambda v: "%g" % v, sz=9))
    o.append(T(q.x + q.w - 6, q.y + 12, "台車の位置 p [cm]", "end", 9.5, INK, True, halo=True))
    r = Plot(xb, 170, 340, 90, (0, 4), (-2, 5.5))
    o.append(r.axes(xl="時間 t [s]", yl=None, xt=[0, 1, 2, 3, 4], yt=[-2, 0, 2, 4], xfmt=lambda v: "%g" % v, yfmt=lambda v: _f18_ff(v), sz=9))
    o.append(T(r.x + r.w - 6, r.y + 12, "力 u [N]", "end", 9.5, INK, True, halo=True))
    # −3・−6 は破線（色の近い −4 と区別する）
    o.append(LEGL(xb, 158, [(SIG, None, "−4 を 4 つ"), (TEA, "6 3", "−3 と −6"), (PUR, None, "−2 と −8")], 9.5, 16))
    for v in (1, -1):
        o.append(W(q.X(0), q.Y(v), q.X(4), q.Y(v), c=FNT, lw=0.8, dash="2 2"))
    for pl, c, nm, ts, xs, us, t1, um in res:
        dsh = "6 3" if c == TEA else None
        o.append(q.clip(list(zip(ts, xs[:, 0] * 100)), c=c, lw=2, dash=dsh))
        o.append(r.clip(list(zip(ts, us)), c=c, lw=2, dash=dsh))
    return SVG(700, 300, o,
               "同じくらいの速さでも、極の並べ方で要る力は変わる（倒立振子、線形でない式、10° から）。−4 を 4 つ置いたものと、−3 と −6 を 2 つずつ置いたものは、台車が ±1 cm に収まるまでの時間がほぼ同じだが、後者は最大の力が 15 % 大きい。−2 と −8 に分けると、遅く、力も大きい。")


F["e18_pattern"] = _f18_pattern_fig()
