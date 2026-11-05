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

    def f(t, x):
        u = ctrl(t, x)
        fd = push[2] if (push and push[0] - 1e-12 <= t < push[0] + push[1] - 1e-12) else 0.0
        d = dist(t) if dist else 0.0
        dx = plant(x, u, fd, d)
        if fI is not None:
            dx = dx + [(r(t) if r else 0.0) - x[0]]
        return dx

    n = int(round(T / h))
    x = _f18_np.array(list(x0) + ([0.0] if fI is not None else []), float)
    ts, xs, us = [0.0], [x.copy()], [ctrl(0.0, x)]
    fell = False
    for k in range(n):
        x = _f18_rk4(f, k * h, x, h)
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
           "ω": 0.81, "ζ": 0.51, "σ": 0.63, "ṗ": 0.61, "ẋ": 0.55}


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


import re as _f18_re
_F18_DOTRE = _f18_re.compile(r"(\\d?dot\{.\}(?:_\{[^}]*\}|_[A-Za-z0-9]+)?)")


def _f18_tx(x, y, s, a="start", sz=10, c=INK, b=False, halo=False):
    """TX と同じ書き方の文字。上の点の付いた文字（\\dot{p} など）を別に置き、点が前の文字の幅の見積もりでずれないようにする。"""
    parts = [q for q in _F18_DOTRE.split(s) if q]
    w = sum(_f18_aw(q, sz) for q in parts)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    xs0 = x0
    n0 = len(_BOXES)
    o = []
    for q in parts:
        o.append(TX(x0, y, q, "start", sz, c, b, halo))
        x0 += _f18_aw(q, sz)
    if _CHECK:   # 重なりの検査には、分けて描いた部品をまとめた 1 つの箱を使う
        del _BOXES[n0:]
        _BOXES.append((xs0, y - sz * 0.82, xs0 + w, y + sz * 0.22 + 2, s))
    return "".join(o)


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
    o.append(T((pos["P"][0] + pos["P"][1]) / 2, yc - 30, "台車（状態は p と ṗ）", "middle", 9.5, MUT))
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
    o.append(T(xe2 + 8, yc2 - 10, "x = [p, ṗ]ᵀ", "start", 10, SIG, True, halo=True))
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
    o.append(TX(20, yfb + 34, "u = −Fx = −f_1p − f_2ṗ（目標値は 5 節で加える）", "start", 10.5, INK))
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
    o.append(_f18_tx(xc, gy + 50, "m \\ddot{p} + (c + f_2)ṗ + (k + f_1)p = 0", "start", 10.5, INK))
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
    P = Plot(56, 34, 300, 250, (-20, 2), (-11, 11))
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
        px, py = 412 + col * 150, 56 + row * 118
        q = Plot(px, py, 120, 66, (0, 4), (-10, 10))
        o.append(q.axes(xl=None, yl=None, xt=[0, 1, 2, 3, 4], yt=[-10, 0, 10], sz=9))
        Acl = A - _f18_np.outer(Bv, _f18_np.array(Fv, float))
        t, xs = _f18_free(Acl, [10.0, 0.0], 4.0, 400)
        o.append(q.clip(list(zip(t, xs[:, 0])), c=c, lw=2.0))
        o.append(W(q.X(0), q.Y(0.2), q.X(4), q.Y(0.2), c=FNT, lw=0.8, dash="2 2"))
        o.append(W(q.X(0), q.Y(-0.2), q.X(4), q.Y(-0.2), c=FNT, lw=0.8, dash="2 2"))
        o.append(TX(px - 6, py - 7, lab, "start", 9.5, c, True))
        o.append(T(px + 118, py + 14, "±2 mm に " + ts2, "end", 9, c, True, halo=True))
    o.append(T(560, 56 + 118 + 66 + 32, "時間 t [s]（どの図も 0〜4 s）", "middle", 9.5, MUT))
    return SVG(700, 326, o,
               "台車とばね・ダンパ（1 kg、2 N·s/m、25 N/m）に状態フィードバック u = −f₁p − f₂ṗ を加えたときの、閉ループの極と応答。(a) f₁ だけを増やすと、極の和は変わらず、極は実部 −1 の縦の線の上を動く（揺れが速くなるだけ）。f₂ だけを増やすと、極の積は変わらず、極は半径 5 の円の上を左へ動いて −5 で重なり、その先は実軸の上を左右に分かれる。2 つを合わせると、2 つの極をどこへでも動かせる。(b) 10 cm ずらして静かに放したときの位置。点線は ±2 mm（初めのずれの 2 %）。")


F["e18_move"] = _f18_move_fig()
