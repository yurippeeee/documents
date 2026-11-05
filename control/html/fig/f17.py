# -*- coding: utf-8 -*-
# 17 章 状態空間モデル の図
import numpy as _f17_np
from scipy import linalg as _f17_la


# =====================================================================
# 例の値（本文と同じ）
# =====================================================================
_F17_M, _F17_C, _F17_K = 1.0, 2.0, 25.0                       # 台車とばね・ダンパ
_F17_RA, _F17_LA, _F17_KT, _F17_J = 2.0, 1e-3, 0.02, 1e-5      # DC モータ
_F17_PM, _F17_Pm, _F17_PL, _F17_G = 0.5, 0.2, 0.3, 9.81        # 倒立振子
_F17_AP = (_F17_PM + _F17_Pm) * _F17_G / (_F17_PM * _F17_PL)    # 45.78
_F17_W0 = math.sqrt(_F17_AP)                                    # 6.766


def _f17_amsd(c=_F17_C, k=_F17_K, m=_F17_M):
    return _f17_np.array([[0.0, 1.0], [-k / m, -c / m]])


_F17_AMOT = _f17_np.array([[-_F17_RA / _F17_LA, -_F17_KT / _F17_LA], [_F17_KT / _F17_J, 0.0]])
_F17_BMOT = _f17_np.array([1.0 / _F17_LA, 0.0])
_F17_APEND = _f17_np.array([[0.0, 1.0], [_F17_AP, 0.0]])


# =====================================================================
# 補助
# =====================================================================
def _f17_sim(A, B, x0, uf, t0, t1, n):
    """dx/dt = A x + B u を零次ホールドで厳密に離散化して進める（u は刻みの中央の値で一定）。返り値 (t の並び, x の並び)。"""
    A = _f17_np.asarray(A, float)
    nn = A.shape[0]
    dt = (t1 - t0) / n
    Mx = _f17_np.zeros((nn + 1, nn + 1))
    Mx[:nn, :nn] = A * dt
    if B is not None:
        Mx[:nn, nn] = _f17_np.asarray(B, float) * dt
    E = _f17_la.expm(Mx)
    Ad, Bd = E[:nn, :nn], E[:nn, nn]
    xs = [_f17_np.asarray(x0, float)]
    ts = [t0]
    for i in range(n):
        t = t0 + i * dt
        u = uf(t + dt / 2) if uf else 0.0
        xs.append(Ad @ xs[-1] + Bd * u)
        ts.append(t + dt)
    return _f17_np.array(ts), _f17_np.array(xs)


def _f17_free(A, x0, t1, n=600):
    """入力 0 の動き e^{At} x0。返り値 (t, x)。"""
    return _f17_sim(A, None, x0, None, 0.0, t1, n)


def _f17_fmt(v, d=3):
    """有効数字 d 桁、負号は −。"""
    if v == 0:
        return "0"
    s = "%.*g" % (d, v)
    if "e" in s:
        s = "%.*f" % (max(0, d - 1 - int(math.floor(math.log10(abs(v))))), v)
    return s.replace("-", "−")


# 図の文字（var(--sans)）の字幅をブラウザで測った値（字の大きさに対する比）。式を横に並べる配置だけに使う
_F17_CW = {"0": 0.63, "1": 0.41, "2": 0.61, "3": 0.62, "4": 0.65, "5": 0.61, "6": 0.62, "7": 0.57, "8": 0.62, "9": 0.62,
           "a": 0.56, "b": 0.59, "c": 0.53, "d": 0.59, "e": 0.54, "f": 0.39, "g": 0.59, "h": 0.59, "i": 0.24, "j": 0.24,
           "k": 0.55, "l": 0.24, "m": 0.88, "n": 0.59, "o": 0.56, "p": 0.59, "q": 0.59, "r": 0.39, "s": 0.53, "t": 0.35,
           "u": 0.59, "v": 0.56, "w": 0.82, "x": 0.55, "y": 0.56, "z": 0.55, "A": 0.69, "B": 0.66, "C": 0.73, "D": 0.72,
           "E": 0.6, "F": 0.59, "G": 0.75, "H": 0.74, "I": 0.27, "J": 0.57, "K": 0.67, "L": 0.57, "M": 0.91, "N": 0.76,
           "O": 0.77, "P": 0.64, "Q": 0.77, "R": 0.65, "S": 0.64, "T": 0.52, "U": 0.75, "V": 0.69, "W": 0.99, "X": 0.68,
           "Y": 0.68, "Z": 0.63, " ": 0.28, "(": 0.37, ")": 0.37, "[": 0.37, "]": 0.37, "−": 0.62, "·": 0.24, "=": 0.6,
           "+": 0.62, ",": 0.29, ".": 0.29, ":": 0.29, "/": 0.36, "ᵀ": 0.43, "×": 0.66, "ṗ": 0.59, "ẋ": 0.55, "λ": 0.64,
           "φ": 0.72, "ω": 0.81, "θ": 0.62, "τ": 0.47, "Λ": 0.69, "∫": 0.37}


def _f17_aw(s, sz):
    """TX の文字列の実際の幅に近い見積もり（配置だけに使う。共通の tw は記号を全角で数えるので、式の並びに隙間ができる）。"""
    w = 0.0
    for k, t in _tx_tokens(s):
        f = sz * (0.72 if k in ("sub", "sup") else (0.58 if k == "supsub" else 1.0))
        for ch in t:
            o_ = ord(ch)
            if ch in _F17_CW:
                w += f * _F17_CW[ch]
            elif o_ < 128:
                w += f * 0.6
            elif 0x370 <= o_ <= 0x3FF or 0x1E00 <= o_ <= 0x1EFF:
                w += f * 0.7
            elif 0x300 <= o_ <= 0x36F:
                pass
            else:
                w += f * 1.03
    return w * 1.04


def _f17_txs(x, y, s, sz, c, b=False, halo=False):
    """左端をそろえた TX。重なりの検査の箱は、_f17_aw の幅で登録し直す（左端そろえなので、文字は x から始まる）。"""
    n0 = len(_BOXES)
    out = TX(x, y, s, "start", sz, c, b, halo)
    if _CHECK and len(_BOXES) > n0:
        del _BOXES[n0:]
        _BOXES.append((x, y - sz * 0.82, x + _f17_aw(s, sz), y + sz * 0.22 + 2, s))
    return out


def _f17_mat(x, y, rows, sz=11, c=INK, gap=12, lh=None, pad=6, pos=None):
    """行列（角括弧つき）。rows は行のリスト、要素は TX の文字列か (文字列, 色)。(x, y) は左上。返り値 (svg, 幅, 高さ)。
    pos に辞書を渡すと、(行, 列) → 要素の中心 (x, y) を入れる。"""
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


def _f17_row(x, yc, items, sz=11, c=INK):
    """横に並べた式。items: ("t", 文字, 色) 文字（TX）、("m", 行のリスト, 色) 行列、("f", 分子, 分母, 色) 分数、("g", 幅) 空き。
    yc は行の縦の中心。返り値 (svg, 右端の x)。"""
    o = []
    for it in items:
        k = it[0]
        if k == "t":
            cc = it[2] if len(it) > 2 and it[2] else c
            o.append(_f17_txs(x, yc + sz * 0.36, it[1], sz, cc))
            x += _f17_aw(it[1], sz) + 5
        elif k == "m":
            cc = it[2] if len(it) > 2 and it[2] else c
            nr = len(it[1])
            h = sz * 1.5 * nr + 4
            s, w, _ = _f17_mat(x, yc - h / 2, it[1], sz, cc)
            o.append(s)
            x += w + 5
        elif k == "f":
            cc = it[3] if len(it) > 3 and it[3] else c
            s, w = FRAC(x + (max(TXW(it[1], sz), TXW(it[2], sz)) + 6) / 2, yc, it[1], it[2], sz, cc)
            w = max(TXW(it[1], sz), TXW(it[2], sz)) + 6
            o.append(s)
            x += w + 4
        elif k == "g":
            x += it[1]
    return "".join(o), x


def _f17_field(P, A, nx, ny, c=FNT, L=9.0):
    """位相平面の各格子点に、状態の変わる速さ A x の向きを、同じ長さの小さな矢印で描く。"""
    o = []
    x0, x1 = P.xr
    y0, y1 = P.yr
    for i in range(nx):
        for j in range(ny):
            a = x0 + (x1 - x0) * (i + 0.5) / nx
            b = y0 + (y1 - y0) * (j + 0.5) / ny
            d = A @ _f17_np.array([a, b])
            sx = P.X(a + d[0] * 1e-3) - P.X(a)
            sy = P.Y(b + d[1] * 1e-3) - P.Y(b)
            nrm = math.hypot(sx, sy)
            if nrm < 1e-12:
                continue
            ux, uy = sx / nrm * L, sy / nrm * L
            X, Y = P.X(a), P.Y(b)
            o.append(ARR(X - ux / 2, Y - uy / 2, X + ux / 2, Y + uy / 2, c=c, lw=1.0, head=4))
    return "".join(o)


def _f17_line(P, v, c, lw=1.8, dash=None):
    """原点を通り、向き v の直線（枠で切る）。"""
    R = 1e3 * max(abs(P.xr[0]), abs(P.xr[1]), abs(P.yr[0]), abs(P.yr[1]))
    n = math.hypot(v[0], v[1])
    return P.clip([(-R * v[0] / n, -R * v[1] / n), (R * v[0] / n, R * v[1] / n)], c=c, lw=lw, dash=dash)


def _f17_trajs(P, A, starts, t1, c=SIG, lw=1.5, n=500, head=True, dash=None):
    """いくつかの初めの状態からの軌跡（枠で切る）。head なら途中に進む向きの矢じり。"""
    o = []
    for x0 in starts:
        t, xs = _f17_free(A, x0, t1, n)
        pts = [(a, b) for a, b in xs]
        o.append(P.clip(pts, c=c, lw=lw, dash=dash))
        if head:
            # 枠の中で、始めから少し進んだ所に矢じり
            for k in range(6, len(pts) - 2):
                a, b = pts[k]
                if not (P.xr[0] < a < P.xr[1] and P.yr[0] < b < P.yr[1]):
                    break
                if math.hypot(P.X(a) - P.X(pts[0][0]), P.Y(b) - P.Y(pts[0][1])) > 26:
                    p1 = pts[k - 2]
                    if math.hypot(P.X(a) - P.X(p1[0]), P.Y(b) - P.Y(p1[1])) > 0.8:
                        o.append(_head(P.X(p1[0]), P.Y(p1[1]), P.X(a), P.Y(b), c, 6))
                    break
        o.append(D(P.X(pts[0][0]), P.Y(pts[0][1]), c, 2.4))
    return "".join(o)


def _f17_list(x, y, items, sz=10.5, c=INK, b=False, sep=", "):
    """「p, ṗ, φ」のような並びを、要素ごとに別の TX で描く（上の点の位置が前の文字の幅の見積もりでずれないように）。"""
    o = []
    for i, it in enumerate(items):
        o.append(TX(x, y, it, "start", sz, c, b))
        x += TXW(it, sz)
        if i + 1 < len(items):
            o.append(T(x, y, sep.strip(), "start", sz, c, b))
            x += sz * 0.75
    return "".join(o)


def _f17_box(P):
    """枠と地（位相平面・s 平面の背景）。"""
    return RECT(P.x, P.y, P.w, P.h, 0, SCR, LIN, 0.8)


def _f17_axes0(P):
    """原点を通る 2 本の軸。"""
    o = []
    if P.yr[0] < 0 < P.yr[1]:
        o.append(W(P.x, P.Y(0), P.x + P.w, P.Y(0), c=MUT, lw=1))
    if P.xr[0] < 0 < P.xr[1]:
        o.append(W(P.X(0), P.y, P.X(0), P.y + P.h, c=MUT, lw=1))
    return "".join(o)


def _f17_strip(x0, y, w, t0, t1, segs, c=GLD, h=11, label=None):
    """入力の帯。segs = [(開始, 終了), ...] の間だけ塗る。"""
    X = lambda t: x0 + (t - t0) / (t1 - t0) * w
    o = [RECT(x0, y, w, h, 2, SCR, LIN, 0.8)]
    for a, b in segs:
        o.append(RECT(X(a), y, X(b) - X(a), h, 1, soft(c), c, 1.0))
    if label:
        o.append(T(x0 - 6, y + h - 2, label, "end", 9.5, c))
    return "".join(o)


# =====================================================================
# 1 節: 同じ位置でも速度が違えば未来が違う／違う過去でも同じ状態なら同じ未来
# =====================================================================
def _f17_future_fig():
    o = []
    A = _f17_amsd()
    B = _f17_np.array([0.0, 1.0])
    # (a) 同じ位置 2 cm、速度だけ違う
    o.append(T(14, 18, "(a) 同じ位置 2 cm から、速度だけを変えて放す（力は加えない）", "start", 11.5, INK, True))
    p = Plot(62, 32, 372, 132, (0, 3), (-3.5, 4.5))
    o.append(p.axes(xl="時間 t [s]", yl="位置 p [cm]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[-2, 0, 2, 4]))
    q = Plot(508, 32, 172, 132, (-4, 5), (-30, 30))
    o.append(_f17_box(q))
    o.append(q.axes(xl="位置 p [cm]", yl=None, xt=[-4, -2, 0, 2, 4], yt=[-30, -15, 0, 15, 30]))
    o.append(TX(q.x - 30, q.y + q.h / 2, "速度 \\dot{p} [cm/s]", "middle", 10, MUT, rot=-90))
    o.append(_f17_axes0(q))
    o.append(W(q.X(2), q.y, q.X(2), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    cases = [(20.0, TEA, "右へ 20 cm/s"), (0.0, SIG, "速度 0"), (-20.0, PUR, "左へ 20 cm/s")]
    for v0, cc, lab in cases:
        t, xs = _f17_free(A, [2.0, v0], 3.0, 600)
        o.append(p.clip(list(zip(t, xs[:, 0])), c=cc, lw=2.0))
        o.append(q.clip(list(zip(xs[:, 0], xs[:, 1])), c=cc, lw=1.6))
        o.append(D(q.X(2), q.Y(v0), cc, 3.2))
    o.append(T(p.X(0.36), p.Y(3.97) - 5, "右へ 20 cm/s: 3.97 cm まで", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(0.66), p.Y(-1.05) + 14, "速度 0: −1.05 cm", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.3), p.Y(-3.05) + 4, "左へ 20 cm/s: −2.80 cm", "start", 9.5, PUR, True, halo=True))
    o.append(T(q.X(2) + 4, q.y + 11, "p = 2 cm", "start", 9, MUT, halo=True))
    # (b) 違う過去から同じ状態へ
    yb = 214
    o.append(T(14, yb, "(b) 違う過去から、時刻 0 に同じ位置と速度へ来た 2 つの台車（時刻 0 からは力を加えない）", "start", 11.5, INK, True))
    tA, xA = _f17_sim(A, B, [0.0, 0.0], lambda t: 1.0 if t < 0 else 0.0, -1.0, 3.0, 4000)
    xB0 = _f17_la.expm(-A) @ xA[1000]
    tB, xB = _f17_sim(A, B, xB0, None, -1.0, 3.0, 4000)
    o.append(LEGL(62, yb + 20, [(SIG, None, "1 s の間 1 N で押した台車"), (TEA, "6 4", "押さずに、1 s 前に弾いた台車")], 9.5))
    p2 = Plot(62, yb + 30, 372, 124, (-1, 3), (-9, 7))
    o.append(p2.axes(xl=None, yl="位置 p [cm]", xt=[-1, 0, 1, 2, 3], yt=[-8, -4, 0, 4]))
    o.append(T(p2.x + p2.w / 2, p2.y + p2.h + 50, "時間 t [s]", "middle", 10, MUT))
    o.append(W(p2.X(0), p2.y, p2.X(0), p2.y + p2.h, c=ALI, lw=1, dash="3 3"))
    o.append(p2.clip(list(zip(tA, xA[:, 0] * 100)), c=SIG, lw=2.4))
    o.append(p2.clip(list(zip(tB, xB[:, 0] * 100)), c=TEA, lw=1.8, dash="6 4"))
    o.append(D(p2.X(0), p2.Y(xA[1000, 0] * 100), ALI, 3.6))
    o.append(T(p2.X(0) + 6, p2.Y(4.02) - 8, "時刻 0: 4.02 cm・−7.38 cm/s", "start", 9.5, ALI, True, halo=True))
    o.append(T(p2.X(2.95), p2.Y(-6.2), "時刻 0 からは 2 本が重なる", "end", 9.5, MUT, halo=True))
    o.append(_f17_strip(p2.x, p2.y + p2.h + 22, p2.w, -1, 3, [(-1, 0)], GLD, 9, "力"))
    o.append(T(p2.X(-0.5), p2.y + p2.h + 30, "1 N", "middle", 9, GLD, True))
    q2 = Plot(508, yb + 30, 172, 124, (-9, 7), (-60, 40))
    o.append(_f17_box(q2))
    o.append(q2.axes(xl="位置 p [cm]", yl=None, xt=[-8, -4, 0, 4], yt=[-60, -40, -20, 0, 20, 40]))
    o.append(TX(q2.x - 30, q2.y + q2.h / 2, "速度 \\dot{p} [cm/s]", "middle", 10, MUT, rot=-90))
    o.append(_f17_axes0(q2))
    o.append(q2.clip([(a * 100, b * 100) for a, b in xA], c=SIG, lw=2.2))
    o.append(q2.clip([(a * 100, b * 100) for a, b in xB], c=TEA, lw=1.6, dash="6 4"))
    o.append(D(q2.X(xA[1000, 0] * 100), q2.Y(xA[1000, 1] * 100), ALI, 3.8))
    o.append(D(q2.X(xB0[0] * 100), q2.Y(xB0[1] * 100), TEA, 3.0))
    o.append(T(q2.X(xB0[0] * 100) + 5, q2.Y(xB0[1] * 100) + 3, "1 s 前", "start", 9, TEA, halo=True))
    return SVG(700, yb + 30 + 124 + 58, o,
               "台車とばね・ダンパ（1 kg、2 N·s/m、25 N/m）。(a) 同じ位置から放しても、速度が違えば、その後の動きは違う。右は位置と速度の平面（位相平面）で、3 つの点は同じ縦の線（位置 2 cm）の上にある。(b) 1 s の間押されていた台車と、押されずに弾かれた台車は、過去が違うが、時刻 0 に同じ位置と速度になり、その後はまったく同じに動く。位相平面では、2 本の軌跡が時刻 0 の点で合わさり、そこから 1 本になる。")


F["e17_future"] = _f17_future_fig()


# =====================================================================
# 1 節: エネルギーをためる所と状態変数
# =====================================================================
def _f17_storage_fig():
    o = []
    o.append(T(14, 18, "(a) エネルギーをためる所と、ためる量（状態変数になる）", "start", 11.5, INK, True))
    items = [("質量", "運動のエネルギー", ("m", "\\dot{p}^2/2"), "速度 \\dot{p}", "mass"),
             ("ばね", "伸びのエネルギー", "kp^2/2", "伸び（位置）p", "spring"),
             ("コイル", "磁気のエネルギー", "L_{a}i^2/2", "電流 i", "coil"),
             ("回る軸", "回転のエネルギー", "Jω_m^2/2", "角速度 ω_m", "rotor"),
             ("熱容量", "熱", "C_{th}θ", "温度 θ", "heat")]
    bw, gap, x0, y0 = 124, 10, 14, 30
    for i, (nm, en, f, st, kind) in enumerate(items):
        x = x0 + i * (bw + gap)
        o.append(RECT(x, y0, bw, 150, 7, PAN, LIN, 1.2))
        o.append(T(x + bw / 2, y0 + 16, nm, "middle", 11, INK, True))
        cx, cy = x + bw / 2, y0 + 50
        if kind == "mass":
            o.append(RECT(cx - 24, cy - 14, 48, 28, 3, SSOFT, SIG, 1.4))
            o.append(ARR(cx + 28, cy, cx + 50, cy, c=SIG, lw=1.6, head=6))
            o.append(D(cx - 14, cy + 17, MUT, 3.5)); o.append(D(cx + 14, cy + 17, MUT, 3.5))
        elif kind == "spring":
            pts = [(cx - 40, cy), (cx - 30, cy)]
            for k in range(7):
                pts.append((cx - 26 + k * 8, cy + (-9 if k % 2 == 0 else 9)))
            pts += [(cx + 30, cy), (cx + 40, cy)]
            o.append(PL(pts, c=SIG, lw=1.6))
            o.append(W(cx - 40, cy - 12, cx - 40, cy + 12, c=MUT, lw=2))
        elif kind == "coil":
            d = "M%g,%g" % (cx - 36, cy)
            for k in range(5):
                d += " a7,9 0 1 1 14,0"
            o.append(PATH(d, c=SIG, lw=1.6))
            o.append(W(cx - 44, cy, cx - 36, cy, c=SIG, lw=1.6)); o.append(W(cx + 34, cy, cx + 44, cy, c=SIG, lw=1.6))
        elif kind == "rotor":
            o.append(CIRC(cx, cy, 17, c=SIG, lw=1.6, fill=SSOFT))
            o.append(D(cx, cy, SIG, 3))
            o.append(PATH("M%g,%g A24,24 0 0 1 %g,%g" % (cx - 17, cy - 17, cx + 17, cy - 17), c=SIG, lw=1.4))
            o.append(_head(cx + 10, cy - 22, cx + 18, cy - 16, SIG, 6))
        elif kind == "heat":
            o.append(RECT(cx - 30, cy - 4, 60, 16, 2, MSOFT, MUT, 1.3))
            for k in range(3):
                xx = cx - 18 + k * 18
                o.append(PATH("M%g,%g c-4,-5 4,-9 0,-14" % (xx, cy - 6), c=ALI, lw=1.4))
        o.append(T(x + bw / 2, y0 + 92, en, "middle", 9.5, MUT))
        if isinstance(f, tuple):
            o.append(T(x + bw / 2 - 6, y0 + 108, f[0], "end", 10, MUT))
            o.append(TX(x + bw / 2 - 5, y0 + 108, f[1], "start", 10, MUT))
        else:
            o.append(TX(x + bw / 2, y0 + 108, f, "middle", 10, MUT))
        o.append(TX(x + bw / 2, y0 + 136, st, "middle", 11, SIG, True))
    o.append(T(14, y0 + 172, "ためる量は急に跳べない（有限の電力でしか増減しない）ので、今の値が次の瞬間の値を決める", "start", 10, INK))
    # (b) 例の対象の状態変数
    yb = y0 + 202
    o.append(T(14, yb, "(b) 例の対象の状態変数", "start", 11.5, INK, True))
    rows = [("一次遅れ（ばねの無い台車の速度・温度の板）", ["\\dot{p} または θ"], "1"),
            ("台車とばね・ダンパ", ["p", "\\dot{p}"], "2"),
            ("DC モータ（L_a を含む）", ["i", "ω_m（回転角も見るなら θ_m を加える）"], "2（3）"),
            ("台車に立てた振子（倒立振子）", ["p", "\\dot{p}", "φ", "\\dot{φ}"], "4")]
    o.append(T(330, yb + 22, "状態変数", "start", 10, MUT, True))
    o.append(T(672, yb + 22, "数 n", "end", 10, MUT, True))
    for i, (a, b, n) in enumerate(rows):
        y = yb + 42 + i * 22
        o.append(TX(20, y, a, "start", 10.5, INK))
        o.append(_f17_list(330, y, b, 10.5, SIG, True))
        o.append(T(672, y, n, "end", 10.5, INK, True))
        o.append(W(14, y + 7, 686, y + 7, c=GRD, lw=1))
    return SVG(700, yb + 42 + 3 * 22 + 14, o,
               "状態変数の多くは、エネルギーをためる所の量である。(a) 質量の速度・ばねの伸び・コイルの電流・回る軸の角速度・熱容量の温度は、ためたエネルギーが有限の電力でしか変わらないので、急には跳ばない。(b) 例の対象の状態変数。位置そのものを知りたいときは、エネルギーをためない量（台車の位置・モータの回転角）も、速度を積分した量として状態変数に加える。")


F["e17_storage"] = _f17_storage_fig()


# =====================================================================
# 2 節: 状態空間モデルのブロック線図
# =====================================================================
def _f17_toppath(xf, xt, yc, h, box, c=SIG, R=15):
    """上を通って左へ戻る線: 引き出し点 xf（右）から h 上がり、左へ進んで箱を通り、加え合わせ点（中心 xt）の上から入る。"""
    yt = yc - h
    w = TFBW(box)
    xm = (xf + xt) / 2
    o = [W(xf, yc, xf, yt, c=c, lw=1.5),
         ARR(xf, yt, xm + w / 2, yt, c=c, lw=1.5, head=6),
         TFBOX(xm - w / 2, yt, box, w, h=26)[0],
         W(xm - w / 2, yt, xt, yt, c=c, lw=1.5),
         ARR(xt, yt, xt, yc - R, c=c, lw=1.5, head=6)]
    return "".join(o)


def _f17_ssbd_fig():
    o = []
    o.append(T(14, 18, "(a) 状態方程式と出力方程式（x と ẋ は、n 個の状態変数を並べたベクトル）", "start", 11.5, INK, True))
    yc = 104
    s, pos, xe = CHAIN(30, yc, [("a", 48, "u", GLD), ("t", "tu", GLD), ("a", 36, None, GLD), ("b", "B", "B"), ("a", 40, "Bu", INK),
                                ("s", {"l": "+", "b": "+"}, "s1"), ("a", 52, "\\dot{x}", INK), ("b", ("1", "s"), "I", SIG, SSOFT),
                                ("a", 52, "x", INK), ("t", "tx", INK), ("a", 40, None, INK), ("b", "C", "C"), ("a", 44, None, INK),
                                ("s", {"l": "+", "t": "+"}, "s2"), ("a", 48, "y", SIG)])
    o.append(s)
    o.append(FBPATH(pos["tx"], pos["s1"], yc, 50, c=INK, box="A"))
    o.append(FFPATH(pos["tu"], pos["s2"], yc, 50, c=GLD, box="D"))
    o.append(T((pos["I"][0] + pos["I"][1]) / 2, yc + 34, "積分", "middle", 9.5, SIG, True))
    o.append(T(pos["s1"] - 2, yc + 68, "Ax", "end", 10, INK, halo=True))
    o.append(T(686, 140, " ", "end", 9, MUT))
    o.append(TX(560, 176, "\\dot{x} = Ax + Bu（状態方程式）", "middle", 10.5, INK))
    o.append(TX(560, 192, "y = Cx + Du（出力方程式）", "middle", 10.5, INK))
    # (b) 台車
    yb = 222
    o.append(T(14, yb, "(b) 台車とばね・ダンパ: 積分の箱の出力が状態変数（2 つ）", "start", 11.5, INK, True))
    yc2 = yb + 76
    s, pos, xe = CHAIN(30, yc2, [("a", 50, "u", GLD), ("b", ("1", "m"), "im"), ("a", 44, None, INK),
                                 ("s", {"l": "+", "b": "−", "t": "−"}, "s"), ("a", 54, "\\ddot{p}", INK), ("b", ("1", "s"), "I1", SIG, SSOFT),
                                 ("a", 70, "\\dot{p} = x_2", SIG), ("t", "tv", SIG), ("a", 40, None, SIG), ("b", ("1", "s"), "I2", SIG, SSOFT),
                                 ("a", 70, "p = x_1", SIG), ("t", "tp", SIG), ("a", 60, "y", SIG)])
    o.append(s)
    o.append(FBPATH(pos["tv"], pos["s"], yc2, 44, c=MUT, box="c"))
    o.append(_f17_toppath(pos["tp"], pos["s"], yc2, 48, "k", c=MUT))
    xm1 = (pos["tv"] + pos["s"]) / 2
    xm2 = (pos["tp"] + pos["s"]) / 2
    o.append(T(xm1, yc2 + 72, "ダンパの力 c\u1e57", "middle", 9.5, MUT))
    o.append(T(xm2, yc2 - 66, "ばねの力 kp", "middle", 9.5, MUT))
    return SVG(700, yc2 + 80, o,
               "状態空間モデルのブロック線図。(a) 状態の変わる速さ ẋ を積分して状態 x を作る。A は状態を状態の変わる速さへ戻し、B は入力をそこへ加える。C は状態から出力を取り出し、D は入力を直接出力へ通す。(b) 台車とばね・ダンパでは、力を質量で割った加速度を 2 回積分する。2 つの積分の出力（速度と位置）が状態変数で、ばねとダンパの力が状態から戻る。")


F["e17_ssbd"] = _f17_ssbd_fig()


# =====================================================================
# 2 節: 行列の要素と物理の対応（台車とモータ）
# =====================================================================
def _f17_mat_fig():
    o = []

    def note(px, py, tx, ty, text, c, a="middle"):
        o.append(W(px, py, tx, ty - 11, c=c, lw=0.9))
        o.append(TX(tx, ty, text, a, 9.5, c, True))

    # (a) 台車
    o.append(T(14, 18, "(a) 台車とばね・ダンパ（状態は位置と速度）", "start", 11.5, INK, True))
    yc = 64
    x = 40
    sz = 11.5
    s1, w1, h1 = _f17_mat(x, yc - 22, [["ẋ_1"], ["ẋ_2"]], sz)
    o.append(s1); x += w1 + 6
    o.append(T(x, yc + 4, "=", "start", 12, INK)); x += 16
    PA = {}
    s2, w2, h2 = _f17_mat(x, yc - 22, [[("0", MUT), ("1", MUT)], [("−k/m", SIG), ("−c/m", SIG)]], sz, gap=18, pos=PA)
    o.append(s2); x += w2 + 4
    s3, w3, _ = _f17_mat(x, yc - 22, [["x_1"], ["x_2"]], sz)
    o.append(s3); x += w3 + 6
    o.append(T(x, yc + 4, "+", "start", 12, INK)); x += 16
    PB = {}
    s4, w4, _ = _f17_mat(x, yc - 22, [["0"], [("1/m", GLD)]], sz, pos=PB)
    o.append(s4); x += w4 + 4
    o.append(TX(x, yc + 4, "u", "start", 12, GLD)); x += 24
    o.append(TX(x, yc + 4, "y = [1  0] x", "start", 11.5, INK))
    ya = 128
    note(PA[(0, 1)][0] + 8, PA[(0, 1)][1] - 8, PA[(0, 1)][0] + 64, yc - 32, "1 行目: 位置の変わる速さは速度（定義）", MUT, "start")
    note(PA[(1, 0)][0], PA[(1, 0)][1] + 10, PA[(1, 0)][0] - 18, ya, "ばねの力 ÷ 質量", SIG)
    note(PA[(1, 1)][0], PA[(1, 1)][1] + 10, PA[(1, 1)][0] + 44, ya + 16, "ダンパの力 ÷ 質量", SIG)
    note(PB[(1, 0)][0], PB[(1, 0)][1] + 10, PB[(1, 0)][0] + 36, ya, "押す力 ÷ 質量", GLD)
    o.append(T(500, 108, "例の値", "start", 10, MUT, True))
    sA, wA, _ = _f17_mat(526, 116, [["0", "1"], ["−25", "−2"]], 10.5)
    o.append(TX(520, 138, "A =", "end", 10.5, INK)); o.append(sA)
    o.append(TX(526 + wA + 26, 138, "B =", "end", 10.5, INK))
    sB, wB, _ = _f17_mat(526 + wA + 30, 116, [["0"], ["1"]], 10.5)
    o.append(sB)
    # (b) モータ
    y0 = 172
    o.append(T(14, y0, "(b) DC モータ（状態は電流と角速度、入力 u は電圧）", "start", 11.5, INK, True))
    yc = y0 + 50
    x = 40
    s1, w1, _ = _f17_mat(x, yc - 22, [["di/dt"], ["dω_m/dt"]], sz)
    o.append(s1); x += w1 + 6
    o.append(T(x, yc + 4, "=", "start", 12, INK)); x += 16
    PM = {}
    s2, w2, _ = _f17_mat(x, yc - 22, [[("−R_a/L_a", TEA), ("−K_t/L_a", ALI)], [("K_t/J", ALI), ("0", MUT)]], sz, gap=18, pos=PM)
    o.append(s2); xm0 = x; x += w2 + 4
    s3, w3, _ = _f17_mat(x, yc - 22, [["i"], ["ω_m"]], sz)
    o.append(s3); x += w3 + 6
    o.append(T(x, yc + 4, "+", "start", 12, INK)); x += 16
    PB = {}
    s4, w4, _ = _f17_mat(x, yc - 22, [[("1/L_a", GLD)], ["0"]], sz, pos=PB)
    o.append(s4); x += w4 + 4
    o.append(TX(x, yc + 4, "u", "start", 12, GLD)); x += 24
    o.append(TX(x, yc + 4, "ω_m = [0  1] x", "start", 11.5, INK))
    # 輪の 2 つの要素を丸で囲む
    for key in ((0, 1), (1, 0)):
        cx, cy = PM[key]
        o.append(RECT(cx - 26, cy - 11, 52, 20, 9, "none", ALI, 1.1, dash="3 2"))
    yb = yc + 66
    note(PM[(0, 0)][0], PM[(0, 0)][1] - 12, PM[(0, 0)][0] - 6, yc - 34, "抵抗の電圧 ÷ L_a", TEA)
    note(PM[(0, 1)][0] + 26, PM[(0, 1)][1] - 6, PM[(0, 1)][0] + 96, yc - 34, "逆起電力が電流を減らす（÷ L_a）", ALI, "start")
    note(PM[(1, 0)][0], PM[(1, 0)][1] + 10, PM[(1, 0)][0] - 10, yb, "トルクが角速度を増やす（÷ J）", ALI)
    note(PM[(1, 1)][0], PM[(1, 1)][1] + 10, PM[(1, 1)][0] + 70, yb + 16, "摩擦は無視", MUT)
    note(PB[(0, 0)][0], PB[(0, 0)][1] + 30, PB[(0, 0)][0] + 30, yb, "加えた電圧 ÷ L_a", GLD)
    o.append(T(500, yb - 24, "例の値", "start", 10, MUT, True))
    sA, wA, _ = _f17_mat(526, yb - 16, [["−2000", "−20"], ["2000", "0"]], 10.5)
    o.append(TX(520, yb + 6, "A =", "end", 10.5, INK)); o.append(sA)
    o.append(TX(526 + wA + 26, yb + 6, "B =", "end", 10.5, INK))
    sB, wB, _ = _f17_mat(526 + wA + 30, yb - 16, [["1000"], ["0"]], 10.5)
    o.append(sB)
    return SVG(700, yb + 34, o,
               "状態方程式の行列の要素と、物理の対応。A の i 行 j 列の要素は、j 番目の状態変数が i 番目の状態変数の変わる速さにどれだけ効くかを表す。(a) 台車では、1 行目は速度の定義、2 行目は力の釣り合いを質量で割ったもの。(b) モータでは、赤の破線で囲んだ 2 つの要素が、逆起電力とトルクで電流と角速度を結ぶ輪（2 章 3 節）である。")


F["e17_mat"] = _f17_mat_fig()


# =====================================================================
# 2 節: 倒立振子の向きの約束と力
# =====================================================================
def _f17_cart(x, y, w, h, c=SIG, fill=SSOFT):
    """台車（左上 x, y）。"""
    return (RECT(x, y, w, h, 4, fill, c, 1.5) + CIRC(x + w * 0.22, y + h + 6, 6, c=c, lw=1.4, fill=SCR)
            + CIRC(x + w * 0.78, y + h + 6, 6, c=c, lw=1.4, fill=SCR))


def _f17_pendfbd_fig():
    o = []
    ph = math.radians(22)
    # (a) 向きの約束
    o.append(T(14, 18, "(a) 向きの約束（どれも右が正）", "start", 11.5, INK, True))
    gy = 210
    o.append(W(16, gy, 222, gy, c=MUT, lw=1.6))
    for k in range(12):
        o.append(W(20 + k * 17, gy, 12 + k * 17, gy + 8, c=FNT, lw=1))
    cx, cw, ch = 120, 70, 28
    o.append(_f17_cart(cx - cw / 2, gy - ch - 12, cw, ch))
    o.append(T(cx, gy - 21, "M", "middle", 12, SIG, True))
    pvx, pvy, L = cx, gy - ch - 12, 112
    bx, by = pvx + L * math.sin(ph), pvy - L * math.cos(ph)
    o.append(W(pvx, pvy, pvx, pvy - L - 10, c=FNT, lw=1, dash="4 3"))
    o.append(W(pvx, pvy, bx, by, c=INK, lw=2.4))
    o.append(CIRC(bx, by, 9, c=SIG, lw=1.6, fill=SSOFT))
    o.append(D(pvx, pvy, INK, 3.4))
    r = 50
    o.append(PATH("M%g,%g A%g,%g 0 0 1 %g,%g" % (pvx, pvy - r, r, r, pvx + r * math.sin(ph), pvy - r * math.cos(ph)), c=ALI, lw=1.5))
    o.append(_head(pvx + r * math.sin(ph * 0.7), pvy - r * math.cos(ph * 0.7), pvx + r * math.sin(ph), pvy - r * math.cos(ph), ALI, 6))
    o.append(TX(pvx + 6, pvy - r - 6, "φ", "start", 12, ALI, True))
    o.append(TX(bx + 13, by + 4, "m", "start", 12, SIG, True))
    o.append(TX((pvx + bx) / 2 + 8, (pvy + by) / 2 + 8, "l", "start", 12, INK, True))
    o.append(ARR(cx - cw / 2 - 52, gy - 26, cx - cw / 2 - 2, gy - 26, c=GLD, lw=2.4))
    o.append(TX(cx - cw / 2 - 30, gy - 32, "u", "middle", 12, GLD, True))
    o.append(W(26, gy - 4, 26, gy + 26, c=MUT, lw=1, dash="3 3"))
    o.append(ARR(26, gy + 22, cx, gy + 22, c=SIG, lw=1.4, head=6))
    o.append(TX((26 + cx) / 2, gy + 18, "p", "middle", 12, SIG, True))
    o.append(ARR(206, 40, 206, 74, c=MUT, lw=1.4, head=6))
    o.append(TX(212, 62, "g", "start", 12, MUT, True))
    # (b) 台車とともに動きながら見た振子
    xb = 250
    o.append(T(xb, 18, "(b) 台車とともに動きながら見る", "start", 11.5, INK, True))
    pvx, pvy = xb + 70, 200
    bx, by = pvx + L * math.sin(ph), pvy - L * math.cos(ph)
    o.append(PL([(pvx - 12, pvy + 12), (pvx, pvy), (pvx + 12, pvy + 12)], c=MUT, lw=1.4, fill=MSOFT))
    o.append(W(pvx, pvy, pvx, pvy - L - 10, c=FNT, lw=1, dash="4 3"))
    o.append(W(pvx, pvy, bx, by, c=INK, lw=2.4))
    o.append(D(pvx, pvy, INK, 3.4))
    o.append(CIRC(bx, by, 9, c=SIG, lw=1.6, fill=SSOFT))
    o.append(ARR(bx, by + 10, bx, by + 58, c=PUR, lw=2.2))
    o.append(TX(bx + 6, by + 52, "重力 mg", "start", 10.5, PUR, True))
    o.append(ARR(bx - 10, by, bx - 62, by, c=TEA, lw=2.2))
    o.append(T(bx - 64, by - 8, "慣性力 m", "end", 10.5, TEA, True))
    o.append(TX(bx - 63, by - 8, "\\ddot{p}", "start", 10.5, TEA, True))
    o.append(DIM(pvx, pvy + 22, bx, pvy + 22, None, c=PUR))
    o.append(T((pvx + bx) / 2, pvy + 38, "l sin φ", "middle", 10, PUR, True))
    o.append(DIM(bx + 52, by, bx + 52, pvy, None, c=TEA))
    o.append(T(bx + 58, (by + pvy) / 2 + 4, "l cos φ", "start", 10, TEA, True))
    o.append(T(xb, 248, "φ を増やすトルク:", "start", 10, INK, True))
    xj = xb + TXW("重力 mgl sin φ、慣性力 −m", 10) - 6
    o.append(T(xj, 264, "重力 mgl sin φ、慣性力 −m", "end", 10, INK))
    o.append(TX(xj + 0.5, 264, "\\ddot{p} l cos φ", "start", 10, INK))
    o.append(T(xb, 280, "→ 式 (1)", "start", 10, INK))
    # (c) 全体
    xc = 498
    o.append(T(xc, 18, "(c) 台車とおもりを合わせた全体", "start", 11.5, INK, True))
    gy2 = 210
    o.append(W(xc, gy2, 690, gy2, c=MUT, lw=1.6))
    for k in range(11):
        o.append(W(xc + 4 + k * 17, gy2, xc - 4 + k * 17, gy2 + 8, c=FNT, lw=1))
    cx2 = xc + 104
    o.append(_f17_cart(cx2 - cw / 2, gy2 - ch - 12, cw, ch))
    pvx, pvy = cx2, gy2 - ch - 12
    bx, by = pvx + L * math.sin(ph), pvy - L * math.cos(ph)
    o.append(W(pvx, pvy, bx, by, c=INK, lw=2.4))
    o.append(CIRC(bx, by, 9, c=SIG, lw=1.6, fill=SSOFT))
    o.append(D(pvx, pvy, INK, 3.4))
    o.append(RECT(cx2 - cw / 2 - 12, by - 20, cw + 24 + (bx - pvx), gy2 - by + 22, 8, "none", ALI, 1.2, dash="5 3"))
    o.append(ARR(xc + 2, gy2 - 26, cx2 - cw / 2 - 14, gy2 - 26, c=GLD, lw=2.4))
    o.append(TX(xc + 18, gy2 - 32, "u", "middle", 12, GLD, True))
    o.append(T(xc, 248, "外から水平に加わる力は u だけ", "start", 10, INK, True))
    o.append(T(xc, 264, "（床の力は垂直、摩擦は無視）", "start", 10, MUT))
    o.append(T(xc, 280, "→ 式 (2)", "start", 10, INK))
    return SVG(700, 292, o,
               "倒立振子の向きの約束と、式を立てるときの力。(a) 台車の位置 p、押す力 u、振子の角度 φ（真上から測り、先が右へ傾く向き）は、どれも右を正とする。(b) 台車とともに動きながら見ると、軸は止まり、おもりには重力と、台車の加速度と逆向きの慣性力が働く。軸のまわりのトルクから式 (1) が出る。(c) 台車とおもりを合わせた全体には、外から水平に u だけが働く。台車とおもりの「質量 × 水平の加速度」の和が u に等しいことから式 (2) が出る。")


F["e17_pendfbd"] = _f17_pendfbd_fig()


# =====================================================================
# 2 節: 倒立振子の A・B と、状態どうしのつながり
# =====================================================================
def _f17_pendmat_fig():
    o = []
    o.append(T(14, 18, "(a) 線形化した A と B（例の値）", "start", 11.5, INK, True))
    sz = 11
    x0, y0 = 70, 48
    PA = {}
    rows = [[("0", FNT), ("1", MUT), ("0", FNT), ("0", FNT)],
            [("0", FNT), ("0", FNT), ("−3.924", PUR), ("0", FNT)],
            [("0", FNT), ("0", FNT), ("0", FNT), ("1", MUT)],
            [("0", FNT), ("0", FNT), ("45.78", ALI), ("0", FNT)]]
    sA, wA, hA = _f17_mat(x0, y0, rows, sz, gap=16, lh=21, pos=PA)
    o.append(sA)
    for j, lab in enumerate(["p", "ṗ", "φ", "\\dot{φ}"]):
        o.append(TX(PA[(0, j)][0] - 3, y0 - 7, lab, "start", 10.5, SIG, True))
    for i, lab in enumerate(["ṗ", "\\ddot{p}", "\\dot{φ}", "\\ddot{φ}"]):
        o.append(TX(x0 - 22, PA[(i, 0)][1] + 4, lab, "start", 10.5, INK, True))
    PB = {}
    sB, wB, _ = _f17_mat(x0 + wA + 22, y0, [["0"], [("2", GLD)], ["0"], [("−6.667", GLD)]], sz, lh=21, pos=PB)
    o.append(sB)
    o.append(TX(PB[(0, 0)][0], y0 - 7, "u", "middle", 10.5, GLD, True))
    o.append(T(x0 + wA / 2, y0 + hA + 16, "A: 列は状態変数、行はその変わる速さ", "middle", 9.5, MUT))
    o.append(T(PB[(0, 0)][0], y0 + hA + 16, "B", "middle", 9.5, MUT))
    xa, xb2 = PA[(2, 0)][0] - 12, PA[(3, 1)][0] + 12
    ya, yb2 = PA[(2, 0)][1] - 11, PA[(3, 1)][1] + 10
    o.append(RECT(xa, ya, xb2 - xa, yb2 - ya, 5, "none", GRN, 1.2, dash="4 3"))
    o.append(W(xa + 18, yb2, xa + 18, y0 + hA + 30, c=GRN, lw=0.9))
    o.append(T(xa + 10, y0 + hA + 44, "0 のかたまり: p・ṗ は φ の動きに入らない", "start", 9.5, GRN, True))
    o.append(T(xa + 10, y0 + hA + 62, "45.78 > 0: 傾くほど速く倒れる", "start", 9.5, ALI, True))
    # (b) つながりのブロック線図
    xL = 330
    o.append(T(xL, 18, "(b) 状態どうしのつながり（積分の出力が状態変数）", "start", 11.5, INK, True))
    yt, ybm = 74, 182
    xs = xL + 22                      # 分かれる点
    ym = (yt + ybm) / 2
    o.append(ARR(xL - 2, ym, xs, ym, c=GLD, lw=1.6))
    o.append(TX(xL + 2, ym - 6, "u", "start", 11, GLD, True))
    o.append(D(xs, ym, GLD, 3.4))
    o.append(W(xs, ym, xs, yt, c=GLD, lw=1.6)); o.append(W(xs, ym, xs, ybm, c=GLD, lw=1.6))

    def chain(yc, gain, top):
        return CHAIN(xs, yc, [("a", 16, None, GLD), ("b", gain, "g"), ("a", 12, None, INK),
                              ("s", {"l": "+", "b": "+"}, "s"), ("a", 16, None, INK),
                              ("b", ("1", "s"), "I1", SIG, SSOFT), ("a", 32, None, SIG), ("t", "v", SIG),
                              ("b", ("1", "s"), "I2", SIG, SSOFT), ("a", 30, None, SIG), ("t", "x", SIG), ("a", 18, None, SIG)])
    s1, P1, e1 = chain(yt, "2", True)
    s2, P2, e2 = chain(ybm, "−6.667", False)
    o.append(s1); o.append(s2)
    o.append(TX((P1["I1"][1] + P1["v"]) / 2 - 4, yt - 8, "ṗ", "start", 11, SIG, True))
    o.append(TX(P1["x"] + 4, yt - 8, "p", "start", 11, SIG, True))
    o.append(TX((P2["I1"][1] + P2["v"]) / 2 - 4, ybm - 8, "\\dot{φ}", "start", 11, SIG, True))
    o.append(TX(P2["x"] + 4, ybm - 8, "φ", "start", 11, SIG, True))
    # φ → 45.78 → 下の加え合わせ点（下から）: 正の帰還
    o.append(FBPATH(P2["x"], P2["s"], ybm, 40, c=ALI, box="45.78", bc=ALI))
    o.append(T((P2["x"] + P2["s"]) / 2, ybm + 70, "傾きが、傾く速さをさらに増やす（正の帰還）", "middle", 9.5, ALI, True))
    # φ → −3.924 → 上の加え合わせ点（下から）
    xk = P2["x"] + 10
    o.append(W(P2["x"], ybm, xk, ybm, c=PUR, lw=1.4))
    o.append(W(xk, ybm, xk, ym, c=PUR, lw=1.5))
    w = TFBW("−3.924")
    xm = (xk + P1["s"]) / 2 + 20
    o.append(ARR(xk, ym, xm + w / 2, ym, c=PUR, lw=1.5, head=6))
    o.append(TFBOX(xm - w / 2, ym, "−3.924", w, PUR, h=26)[0])
    o.append(W(xm - w / 2, ym, P1["s"], ym, c=PUR, lw=1.5))
    o.append(ARR(P1["s"], ym, P1["s"], yt + 15, c=PUR, lw=1.5, head=6))
    o.append(T(xm, ym + 26, "傾くと台車は逆向きに加速", "middle", 9.5, PUR, True, halo=True))
    o.append(T(xL, ybm + 92, "台車の位置 p と速度 ṗ から、振子の段へ戻る線は無い", "start", 10, GRN, True))
    return SVG(700, ybm + 102, o,
               "倒立振子の線形化した状態方程式（状態の並び p・ṗ・φ・φ̇）。(a) A の 0 でない要素は 4 つで、1 は「位置・角度の変わる速さは速度・角速度」という定義。緑の破線の 0 のかたまりのとおり、台車の位置と速度は振子の角度の動きに入らない。(b) 同じ式をブロック線図にすると、振子の段には、傾きが傾く速さを増やす正の帰還（45.78）があり、ここから倒れる。傾きは −3.924 を通して台車を逆向きに加速する。力 u は、台車を右へ（2）、振子を左へ傾ける向きに（−6.667）加わる。")


F["e17_pendmat"] = _f17_pendmat_fig()


# =====================================================================
# 3 節: 伝達関数を求める計算（台車）
# =====================================================================
def _f17_tfcalc_fig():
    o = []
    sz = 11.5
    rows_y = [44, 104, 164, 230, 296]
    nums = ["①", "②", "③", "④", "⑤"]
    for k, y in enumerate(rows_y):
        o.append(CIRC(26, y, 10, c=SIG, lw=1.3, fill=SSOFT))
        o.append(T(26, y + 4, str(k + 1), "middle", 11, SIG, True))
    x0 = 48
    s1, _ = _f17_row(x0, rows_y[0], [("t", "sI − A ="), ("m", [["s", "−1"], ["25", "s + 2"]]),
                                     ("g", 12), ("t", "（s を対角に並べた sI から、A を引く）", MUT)], sz)
    o.append(s1)
    s2, _ = _f17_row(x0, rows_y[1], [("t", "det(sI − A) = s · (s + 2) − (−1) · 25 ="),
                                     ("t", "s^2 + 2s + 25", SIG), ("g", 12), ("t", "（ad − bc）", MUT)], sz)
    o.append(s2)
    s3, xe = _f17_row(x0, rows_y[2], [("t", "(sI − A)^{−1} ="), ("f", "1", "s^2 + 2s + 25", SIG), ("m", [["s + 2", "1"], ["−25", "s"]])], sz)
    o.append(s3)
    o.append(T(xe + 12, rows_y[2] - 4, "対角を入れ替え、対角の外の符号を変えて、", "start", 10, MUT))
    o.append(T(xe + 12, rows_y[2] + 12, "行列式で割る（2 行 2 列の逆行列）", "start", 10, MUT))
    s4, xe = _f17_row(x0, rows_y[3], [("t", "X(s) = (sI − A)^{−1}BU(s) ="), ("f", "1", "s^2 + 2s + 25", SIG), ("m", [["1"], ["s"]]), ("t", "U(s)")], sz)
    o.append(s4)
    o.append(T(xe + 12, rows_y[3] - 4, "B = [0  1]ᵀ を掛けると 2 列目が残る。", "start", 10, MUT))
    o.append(T(xe + 12, rows_y[3] + 12, "速度の変換は位置の変換の s 倍（微分）", "start", 10, MUT))
    s5, xe = _f17_row(x0, rows_y[4], [("t", "P(s) = C(sI − A)^{−1}B + D = [1  0]"), ("f", "1", "s^2 + 2s + 25"), ("m", [["1"], ["s"]]), ("t", "+ 0 ="),
                                     ("f", "1", "s^2 + 2s + 25", SIG)], sz)
    o.append(s5)
    o.append(T(xe + 12, rows_y[4] + 4, "（6 章 1 節の表と同じ）", "start", 10, MUT))
    return SVG(700, 330, o,
               "状態空間モデルから伝達関数を求める計算（台車とばね・ダンパ、A = [0 1; −25 −2]、B = [0 1]ᵀ、C = [1 0]、D = 0）。① sI − A を作り、② その行列式を求め、③ 逆行列を作り、④ B を掛けて状態の変換を求め、⑤ C を掛ける。分母の s² + 2s + 25 は、sI − A の行列式である。")


F["e17_tfcalc"] = _f17_tfcalc_fig()


# =====================================================================
# 3 節: 同じ伝達関数をもつ 3 つの実現（モータの電圧 → 角速度）
# =====================================================================
def _f17_realiz_fig():
    o = []
    sz = 10.5
    sets = [("(a) 電流と角速度", "x = [i, ω_m]ᵀ", [["−2000", "−20"], ["2000", "0"]], [["1000"], ["0"]], [["0", "1"]], SIG),
            ("(b) 抵抗の電圧と逆起電力（V）", "x = [R_{a}i, K_{t}ω_m]ᵀ", [["−2000", "−2000"], ["20", "0"]], [["2000"], ["0"]], [["0", "50"]], TEA),
            ("(c) (a) に回転角を加えた", "x = [i, ω_m, θ_m]ᵀ", [["−2000", "−20", "0"], ["2000", "0", "0"], ["0", "1", "0"]], [["1000"], ["0"], ["0"]], [["0", "1", "0"]], PUR)]
    y = 14
    for title, xs, A, B, C, cc in sets:
        o.append(T(14, y + 4, title, "start", 11, cc, True))
        o.append(TX(230, y + 4, xs, "start", 10, MUT))
        nr = len(A)
        h = sz * 1.5 * nr + 4
        yy = y + 14
        o.append(TX(28, yy + h / 2 + 4, "A =", "start", sz, INK))
        sA, wA, _ = _f17_mat(54, yy, A, sz, gap=10)
        o.append(sA)
        xb = 54 + wA + 34
        o.append(TX(xb - 28, yy + h / 2 + 4, "B =", "start", sz, INK))
        sB, wB, _ = _f17_mat(xb, yy, B, sz)
        o.append(sB)
        xc = xb + wB + 34
        o.append(TX(xc - 28, yy + h / 2 + 4, "C =", "start", sz, INK))
        sC, wC, _ = _f17_mat(xc, yy + h / 2 - 10, C, sz, gap=10)
        o.append(sC)
        y = yy + h + 18
    o.append(TX(14, y + 2, "どれも P(s) = 2 × 10^6/(s^2 + 2000s + 40000)", "start", 10.5, INK, True))
    # (d) 角速度のステップ応答
    Aa = _F17_AMOT; Ba = _F17_BMOT
    Ab = _f17_np.array([[-2000.0, -2000.0], [20.0, 0.0]]); Bb = _f17_np.array([2000.0, 0.0])
    Ac = _f17_np.array([[-2000.0, -20.0, 0.0], [2000.0, 0.0, 0.0], [0.0, 1.0, 0.0]]); Bc = _f17_np.array([1000.0, 0.0, 0.0])
    one = lambda t: 1.0
    ta, xa = _f17_sim(Aa, Ba, [0, 0], one, 0, 0.25, 2500)
    tb, xb_ = _f17_sim(Ab, Bb, [0, 0], one, 0, 0.25, 2500)
    tc, xc_ = _f17_sim(Ac, Bc, [0, 0, 0], one, 0, 0.25, 2500)
    xp = 444
    o.append(T(xp - 40, 18, "(d) 1 V のステップを加えたときの角速度", "start", 11, INK, True))
    p = Plot(xp, 30, 236, 104, (0, 0.25), (0, 60))
    o.append(p.axes(xl=None, yl="ω_m [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yt=[0, 20, 40, 60], xfmt=lambda v: "%g" % v))
    o.append(p.line(list(zip(ta, xa[:, 1])), c=SIG, lw=4.0))
    o.append(p.line(list(zip(tb, xb_[:, 1] * 50)), c=TEA, lw=2.2, dash="7 4"))
    o.append(p.line(list(zip(tc, xc_[:, 1])), c=PUR, lw=1.6, dash="2 3"))
    o.append(T(p.X(0.245), p.Y(50) + 16, "3 つとも同じ曲線", "end", 9.5, INK, True, halo=True))
    # (e) 中の状態変数
    o.append(T(xp - 40, 182, "(e) 中の状態変数は違う", "start", 11, INK, True))
    q = Plot(xp, 194, 236, 92, (0, 0.25), (0, 1.1))
    o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yt=[0, 0.5, 1], xfmt=lambda v: "%g" % v))
    o.append(q.line(list(zip(ta, xa[:, 0])), c=SIG, lw=2.0))
    o.append(q.line(list(zip(tb, xb_[:, 0])), c=TEA, lw=2.0, dash="7 4"))
    o.append(TX(q.X(0.03), q.Y(0.86), "(b) R_{a}i [V]", "start", 9.5, TEA, True, halo=True))
    o.append(TX(q.X(0.04), q.Y(0.5) - 2, "(a) i [A]", "start", 9.5, SIG, True, halo=True))
    th = xc_[:, 2]
    o.append(q.line([(t_, v / 12.0) for t_, v in zip(tc, th)], c=PUR, lw=1.8, dash="2 3"))
    o.append(TX(q.X(0.245), q.Y(th[-1] / 12.0) + 16, "(c) θ_m [rad] ÷ 12", "end", 9.5, PUR, True, halo=True))
    return SVG(700, 330, o,
               "モータの電圧 u から角速度 ωm までの、3 つの実現。(a) は 2 節のもの、(b) は状態変数を電圧の単位（巻線の抵抗の電圧と逆起電力）にしたもの、(c) は回転角を状態変数に加えたもの。(d) 伝達関数はどれも同じなので、角速度のステップ応答は 3 本が重なる。(e) 中の状態変数は実現ごとに違い、(b) の状態は (a) の 2 倍の値、(c) の回転角は出力に現れずに増え続ける（1/12 に縮めて描いた。0.25 s で 10.0 rad）。")


F["e17_realiz"] = _f17_realiz_fig()


# =====================================================================
# 4 節: 状態の変わる速さ Ax の向きと、固有ベクトルの直線
# =====================================================================
def _f17_eig2(A):
    """2 行 2 列の実の固有値（大きい順）と、1 番目の成分を 1 にした固有ベクトル。"""
    ev, V = _f17_la.eig(A)
    idx = _f17_np.argsort(-ev.real)
    ev = ev[idx].real
    V = V[:, idx].real
    V = V / V[0]
    return ev, V


def _f17_eigvec_fig():
    o = []
    panels = [("(a) 過減衰の台車（c = 20 N·s/m）", _f17_amsd(c=20.0), (-4, 4), (-40, 40), "位置 p [cm]", "速度 ṗ [cm/s]",
               [-4, -2, 0, 2, 4], [-40, -20, 0, 20, 40]),
              ("(b) 振子の角度と角速度", _F17_APEND, (-3, 3), (-30, 30), "角度 φ [°]", "角速度 \\dot{φ} [°/s]",
               [-3, -2, -1, 0, 1, 2, 3], [-30, -15, 0, 15, 30])]
    for k, (title, A, xr, yr, xl, yl, xt, yt) in enumerate(panels):
        x0 = 66 + k * 350
        o.append(T(x0 - 50, 18, title, "start", 11.5, INK, True))
        P = Plot(x0, 32, 262, 200, xr, yr)
        o.append(_f17_box(P))
        o.append(P.axes(xl=xl, yl=None, xt=xt, yt=yt))
        o.append(TX(P.x - 36, P.y + P.h / 2, yl, "middle", 10, MUT, rot=-90))
        o.append(_f17_axes0(P))
        o.append(_f17_field(P, A, 13, 11, c=FNT, L=9))
        ev, V = _f17_eig2(A)
        for i in range(2):
            lam = ev[i]
            cc = GRN if lam < 0 else ALI
            o.append(_f17_line(P, V[:, i], cc, lw=2.0))
            # 直線の上の点での Ax（直線に沿う向き）
            for sgn in (1, -1):
                a = sgn * (0.55 * xr[1] if i == 0 else 0.3 * xr[1])
                pt = V[:, i] * a
                if not (yr[0] < pt[1] < yr[1]):
                    a = sgn * 0.8 * yr[1] / abs(V[1, i])
                    pt = V[:, i] * a
                d = A @ pt
                L_ = 34.0
                sx = P.X(pt[0] + d[0] * 1e-3) - P.X(pt[0]); sy = P.Y(pt[1] + d[1] * 1e-3) - P.Y(pt[1])
                n_ = math.hypot(sx, sy)
                X, Y = P.X(pt[0]), P.Y(pt[1])
                o.append(D(X, Y, cc, 3.2))
                o.append(ARR(X, Y, X + sx / n_ * L_, Y + sy / n_ * L_, c=cc, lw=2.2, head=7))
        # 固有値の名札
        if k == 0:
            o.append(TX(P.X(1.6), P.Y(-1.34 * 1.6) - 18, "λ_1 = −1.34", "start", 10, GRN, True, halo=True))
            o.append(TX(P.X(1.75), P.Y(-30) + 4, "λ_2 = −18.66", "start", 10, GRN, True, halo=True))
            o.append(T(P.x + 6, P.y + 14, "どちらの直線の上でも原点へ向かう", "start", 9.5, GRN, True, halo=True))
        else:
            o.append(TX(P.X(1.0), P.Y(6.77 * 3.6) + 4, "λ = +6.77（離れる）", "start", 10, ALI, True, halo=True))
            o.append(TX(P.X(0.75), P.Y(-6.77 * 3.6) + 4, "λ = −6.77（近づく）", "start", 10, GRN, True, halo=True))
    o.append(T(14, 286, "灰色の矢印: 各点の状態の変わる速さ Ax の向き。色の線: 固有ベクトルの向きの直線（その上では Ax = λx なので、矢印が直線に沿う）", "start", 9.5, MUT))
    return SVG(700, 296, o,
               "位相平面の各点に、状態の変わる速さ ẋ = Ax の向きを描いた。たいていの点では、矢印は原点の向きからずれていて、状態の軌跡は曲がる。固有ベクトルの向きの直線の上では Ax = λx なので、矢印は直線に沿い、状態はその直線から出ない。(a) 過減衰の台車の 2 つの固有値はどちらも負で、どちらの直線の上でも原点へ向かう。(b) 振子の角度の固有値は ±6.77 で、+6.77 の直線の上では原点から離れ、−6.77 の直線の上では原点へ近づく。")


F["e17_eigvec"] = _f17_eigvec_fig()


# =====================================================================
# 4 節: 例の対象の固有値と伝達関数の極
# =====================================================================
def _f17_xbreak(P, segs):
    """横軸を途中で省略した s 平面の座標。segs = [(値の始め, 値の終わり, 画面の始め, 画面の終わり), ...]。"""
    def X(v):
        for a, b, xa, xb in segs:
            if a - 1e-9 <= v <= b + 1e-9:
                return xa + (v - a) / (b - a) * (xb - xa)
        return None
    return X


def _f17_eigmap_fig():
    o = []
    cells = [(14, 14), (364, 14), (14, 182), (364, 182)]

    def cross(X, Y, c, r=5.5, lw=2.2):
        if c == MUT:      # 固有値は □
            return RECT(X - 9, Y - 9, 18, 18, 2, "none", MUT, 1.8)
        return W(X - r, Y - r, X + r, Y + r, c=c, lw=lw) + W(X - r, Y + r, X + r, Y - r, c=c, lw=lw)

    def splane_box(x, y, w, h, xs, yr, labels):
        """横の座標 xs（関数）、縦の範囲 yr の s 平面の地。labels = [(値, 文字)]。"""
        Y = lambda v: y + h - (v - yr[0]) / (yr[1] - yr[0]) * h
        s = [RECT(x, y, w, h, 0, SCR, LIN, 0.8)]
        x0 = xs(0.0)
        if x0 is not None and x0 < x + w:
            s.append(RECT(x0, y, x + w - x0, h, 0, soft(ALI), "none", 0))
            s.append(W(x0, y, x0, y + h, c=MUT, lw=1.3))
        s.append(W(x, Y(0), x + w, Y(0), c=MUT, lw=1))
        for v, t in labels:
            s.append(W(xs(v), y + h, xs(v), y + h + 4, c=MUT, lw=1))
            s.append(T(xs(v), y + h + 15, t, "middle", 9, MUT))
        return "".join(s), Y

    # (a) 台車
    x, y = cells[0]
    o.append(T(x, y + 4, "(a) 台車とばね・ダンパ", "start", 11, INK, True))
    px, pw, py, ph = x + 16, 130, y + 16, 110
    Xa = lambda v: px + (v + 3) / 4 * pw
    s_, Ya = splane_box(px, py, pw, ph, Xa, (-6.5, 6.5), [(-2, "−2"), (0, "0")])
    o.append(s_)
    for im in (4.899, -4.899):
        o.append(cross(Xa(-1), Ya(im), MUT, 8, 4.5)); o.append(cross(Xa(-1), Ya(im), SIG))
    o.append(T(px + pw + 14, py + 24, "固有値 −1 ± j4.90", "start", 10, MUT, True))
    o.append(T(px + pw + 14, py + 42, "極 −1 ± j4.90", "start", 10, SIG, True))
    o.append(T(px + pw + 14, py + 62, "→ すべて一致", "start", 10, INK))
    # (b)(c) モータ
    for k, (title, extra) in enumerate([("(b) モータ（電流と角速度）", False), ("(c) モータ（回転角を加えた。出力は角速度）", True)]):
        x, y = cells[1 + k]
        o.append(T(x, y + 4, title, "start", 11, INK, True))
        px, pw, py, ph = x + 16, 170, y + 16, 110
        Xm = _f17_xbreak(None, [(-2050, -1910, px, px + 52), (-35, 8, px + 72, px + pw)])
        s_, Ym = splane_box(px, py, pw, ph, Xm, (-1, 1), [(-2000, "−2000"), (-20, "−20"), (0, "0")])
        o.append(s_)
        for xx_ in (px + 58, px + 64):
            o.append(W(xx_ - 3, py + ph - 6, xx_ + 3, py + ph + 6, c=MUT, lw=1.2))
        o.append(RECT(px + 54, py, 14, ph, 0, SCR, "none", 0))
        o.append(T(px + 61, py + ph / 2 + 4, "…", "middle", 10, MUT))
        for v in (-1979.8, -20.2):
            o.append(cross(Xm(v), Ym(0), MUT, 8, 4.5)); o.append(cross(Xm(v), Ym(0), SIG))
        if extra:
            o.append(cross(Xm(0), Ym(0), MUT, 8, 4.5))
            o.append(T(Xm(0) - 4, Ym(0) - 14, "0", "middle", 9.5, MUT, True, halo=True))
        o.append(T(px + pw + 12, py + 24, "固有値 −20.2・−1980" + ("・0" if extra else ""), "start", 10, MUT, True))
        o.append(T(px + pw + 12, py + 42, "極 −20.2・−1980", "start", 10, SIG, True))
        o.append(T(px + pw + 12, py + 62, "→ 0 は回転角のもので、" if extra else "→ すべて一致", "start", 10, INK))
        if extra:
            o.append(T(px + pw + 12, py + 78, "角速度には現れない", "start", 10, INK))
    # (d) 倒立振子
    x, y = cells[3]
    o.append(T(x, y + 4, "(d) 倒立振子", "start", 11, INK, True))
    px, pw, py, ph = x + 16, 150, y + 16, 110
    Xp = lambda v: px + (v + 9) / 18 * pw
    s_, Yp = splane_box(px, py, pw, ph, Xp, (-3, 3), [(-6.77, "−6.77"), (0, "0"), (6.77, "6.77")])
    o.append(s_)
    for v in (-6.766, 6.766):
        o.append(cross(Xp(v), Yp(0), MUT, 8, 4.5)); o.append(cross(Xp(v), Yp(0), SIG))
    o.append(cross(Xp(0), Yp(0), MUT, 8, 4.5)); o.append(RECT(Xp(0) - 12, Yp(0) - 12, 24, 24, 3, "none", MUT, 1.8))
    o.append(T(Xp(0), Yp(0) - 18, "0 が 2 つ", "middle", 9, MUT, True, halo=True))
    o.append(T(px + pw + 12, py + 24, "固有値 0・0・±6.77", "start", 10, MUT, True))
    o.append(TX(px + pw + 12, py + 42, "G_{φu} の極 ±6.77", "start", 10, SIG, True))
    o.append(TX(px + pw + 12, py + 60, "G_{pu} の極 0・0・±6.77", "start", 10, INK, True))
    o.append(TX(px + pw + 12, py + 76, "（G_{pu} の零点は ±5.72）", "start", 9.5, MUT))
    o.append(T(px + pw + 12, py + 96, "→ 角度には 0 の 2 つが", "start", 10, INK))
    o.append(T(px + pw + 12, py + 112, "現れない", "start", 10, INK))
    o.append(RECT(20, 338, 12, 12, 2, "none", MUT, 1.8))
    o.append(T(38, 348, "A の固有値", "start", 9.5, MUT))
    o.append(W(124, 338, 136, 350, c=SIG, lw=2.2)); o.append(W(124, 350, 136, 338, c=SIG, lw=2.2))
    o.append(T(142, 348, "伝達関数の極（固有値と同じ所にあれば、□ の中に × が入る）", "start", 9.5, MUT))
    return SVG(700, 352, o,
               "例の対象の、A の固有値（□）と、伝達関数の極（×）。極は、いつも固有値のどれかと一致する。(a)(b) では、すべての固有値が極として現れる。(c) 回転角を状態に加えたモータの固有値 0 は、角速度の伝達関数では約分されて、極に現れない。(d) 倒立振子の固有値 0 の 2 つは、台車の位置と速度のもので、振子の角度への伝達関数には現れない。モータの横軸は、−1900〜−40 の間を省いた。")


F["e17_eigmap"] = _f17_eigmap_fig()



# =====================================================================
# 4 節: 初めの状態をモードに分ける
# =====================================================================
def _f17_modes_fig():
    o = []
    # (a) 過減衰の台車
    A = _f17_amsd(c=20.0)
    ev, V = _f17_eig2(A)          # ev = [-1.34, -18.66]
    x0 = _f17_np.array([4.0, 0.0])
    al = _f17_la.solve(V, x0)
    o.append(T(14, 18, "(a) 過減衰の台車を 4 cm 引いて静かに放す", "start", 11.5, INK, True))
    P = Plot(70, 32, 230, 170, (-1, 5), (-8, 8))
    o.append(_f17_box(P))
    o.append(P.axes(xl="位置 p [cm]", yl=None, xt=[0, 2, 4], yt=[-8, -4, 0, 4, 8]))
    o.append(TX(P.x - 34, P.y + P.h / 2, "速度 ṗ [cm/s]", "middle", 10, MUT, rot=-90))
    o.append(_f17_axes0(P))
    o.append(_f17_line(P, V[:, 0], GRN, 1.2, "5 3")); o.append(_f17_line(P, V[:, 1], TEA, 1.2, "5 3"))
    m1, m2 = al[0] * V[:, 0], al[1] * V[:, 1]
    o.append(PL([(P.X(m1[0]), P.Y(m1[1])), (P.X(x0[0]), P.Y(x0[1])), (P.X(m2[0]), P.Y(m2[1]))], c=MUT, lw=1, dash="3 3"))
    o.append(ARR(P.X(0), P.Y(0), P.X(m1[0]), P.Y(m1[1]), c=GRN, lw=2.2))
    o.append(ARR(P.X(0), P.Y(0), P.X(m2[0]), P.Y(m2[1]), c=TEA, lw=2.2))
    t, xs = _f17_free(A, x0, 4.0, 800)
    o.append(P.clip(list(zip(xs[:, 0], xs[:, 1])), c=SIG, lw=2.0))
    o.append(D(P.X(4), P.Y(0), ALI, 3.8))
    o.append(T(P.X(4) + 4, P.Y(0) - 7, "初め (4, 0)", "start", 9.5, ALI, True, halo=True))
    o.append(TX(P.X(m1[0]) - 2, P.Y(m1[1]) + 15, "α_1v_1", "end", 10, GRN, True, halo=True))
    o.append(TX(P.X(m2[0]) + 6, P.Y(m2[1]) - 2, "α_2v_2", "start", 10, TEA, True, halo=True))
    # 時間の波形
    q = Plot(380, 32, 300, 170, (0, 3), (-0.5, 4.5))
    o.append(q.axes(xl="時間 t [s]", yl="位置 p [cm]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[0, 1, 2, 3, 4]))
    tt = _f17_np.linspace(0, 3, 601)
    o.append(q.line([(a, al[0] * math.exp(ev[0] * a)) for a in tt], c=GRN, lw=1.8, dash="6 3"))
    o.append(q.line([(a, al[1] * math.exp(ev[1] * a)) for a in tt], c=TEA, lw=1.8, dash="6 3"))
    o.append(q.line([(a, al[0] * math.exp(ev[0] * a) + al[1] * math.exp(ev[1] * a)) for a in tt], c=SIG, lw=2.4))
    o.append(TX(q.X(1.0), q.Y(1.35) - 6, "遅いモード 4.31e^{−1.34t}", "start", 10, GRN, True, halo=True))
    o.append(TX(q.X(0.3), q.Y(-0.31) + 15, "速いモード −0.31e^{−18.66t}", "start", 10, TEA, True, halo=True))
    o.append(T(q.X(0.5), q.Y(3.4), "和（位置）", "start", 10, SIG, True, halo=True))
    # (b) 振子の角度
    yb = 254
    A2 = _F17_APEND
    ev2, V2 = _f17_eig2(A2)        # [+6.77, -6.77]
    o.append(T(14, yb, "(b) 振子を 1° 傾けて放す（2 つのモード）と、縮むモードの向きに放す", "start", 11.5, INK, True))
    P2 = Plot(70, yb + 14, 230, 170, (-0.5, 3), (-12, 12))
    o.append(_f17_box(P2))
    o.append(P2.axes(xl="角度 φ [°]", yl=None, xt=[0, 1, 2, 3], yt=[-12, -6, 0, 6, 12]))
    o.append(TX(P2.x - 34, P2.y + P2.h / 2, "角速度 \\dot{φ} [°/s]", "middle", 10, MUT, rot=-90))
    o.append(_f17_axes0(P2))
    o.append(_f17_line(P2, V2[:, 0], ALI, 1.2, "5 3")); o.append(_f17_line(P2, V2[:, 1], GRN, 1.2, "5 3"))
    xa = _f17_np.array([1.0, 0.0])
    ala = _f17_la.solve(V2, xa)
    n1, n2 = ala[0] * V2[:, 0], ala[1] * V2[:, 1]
    o.append(PL([(P2.X(n1[0]), P2.Y(n1[1])), (P2.X(1), P2.Y(0)), (P2.X(n2[0]), P2.Y(n2[1]))], c=MUT, lw=1, dash="3 3"))
    o.append(ARR(P2.X(0), P2.Y(0), P2.X(n1[0]), P2.Y(n1[1]), c=ALI, lw=2.2))
    o.append(ARR(P2.X(0), P2.Y(0), P2.X(n2[0]), P2.Y(n2[1]), c=GRN, lw=2.2))
    t, xs = _f17_free(A2, xa, 0.5, 500)
    o.append(P2.clip(list(zip(xs[:, 0], xs[:, 1])), c=SIG, lw=2.0))
    o.append(D(P2.X(1), P2.Y(0), ALI, 3.8))
    xb_ = _f17_np.array([1.0, -_F17_W0])
    t, xs2 = _f17_free(A2, xb_, 1.0, 500)
    o.append(P2.clip(list(zip(xs2[:, 0], xs2[:, 1])), c=GRN, lw=2.0))
    o.append(D(P2.X(1), P2.Y(-_F17_W0), GRN, 3.8))
    o.append(T(P2.X(1) + 6, P2.Y(0) + 13, "(1°, 0)", "start", 9.5, ALI, True, halo=True))
    o.append(T(P2.X(1) + 6, P2.Y(-_F17_W0) + 4, "(1°, −6.77 °/s)", "start", 9.5, GRN, True, halo=True))
    o.append(TX(P2.X(n1[0]) + 4, P2.Y(n1[1]) - 4, "+6.77 の向き", "start", 9.5, ALI, True, halo=True))
    q2 = Plot(380, yb + 14, 300, 170, (0, 0.45), (0, 10))
    o.append(q2.axes(xl="時間 t [s]", yl="角度 φ [°]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 2, 4, 6, 8, 10], xfmt=lambda v: "%g" % v))
    tt = _f17_np.linspace(0, 0.45, 451)
    o.append(q2.clip([(a, 0.5 * math.exp(_F17_W0 * a)) for a in tt], c=ALI, lw=1.8, dash="6 3"))
    o.append(q2.clip([(a, 0.5 * math.exp(-_F17_W0 * a)) for a in tt], c=GRN, lw=1.8, dash="6 3"))
    o.append(q2.clip([(a, math.cosh(_F17_W0 * a)) for a in tt], c=SIG, lw=2.4))
    o.append(q2.clip([(a, math.exp(-_F17_W0 * a)) for a in tt], c=GRN, lw=2.4))
    o.append(TX(q2.X(0.2), q2.Y(8.5), "和 = cosh(6.77t)（倒れる）", "start", 10, SIG, True, halo=True))
    o.append(TX(q2.X(0.34), q2.Y(3.6), "0.5e^{6.77t}", "start", 10, ALI, True, halo=True))
    o.append(TX(q2.X(0.12), q2.Y(1.6), "e^{−6.77t}（縮むモードだけ。真上へ戻る）", "start", 10, GRN, True, halo=True))
    return SVG(700, yb + 14 + 170 + 44, o,
               "初めの状態を、固有ベクトルの向きの 2 つの成分（α₁v₁ と α₂v₂。破線は平行四辺形）に分けると、それぞれが e^{λt} 倍で伸び縮みする。(a) 過減衰の台車では、速いモードは 0.25 s で 1 % に縮み、その後は遅いモードの直線に沿って原点に入る。(b) 振子を 1° 傾けて放すと、2 つのモードに 0.5° ずつ分かれ、増えるモードが支配して倒れる。縮むモードの固有ベクトルの上（1° に −6.77 °/s）から放すと、真上へ戻っていく。")


F["e17_modes"] = _f17_modes_fig()


# =====================================================================
# 4 節: 極零相殺で伝達関数に現れない固有値
# =====================================================================
def _f17_hidden_fig():
    o = []
    A = _f17_np.array([[0.0, 1.0], [2.0, -1.0]]); B = _f17_np.array([0.0, 1.0]); C = _f17_np.array([-1.0, 1.0])
    t, xs = _f17_sim(A, B, [0, 0], lambda t: 1.0, 0, 4, 4000)
    y = xs @ C
    o.append(T(14, 18, "(a) 出力 y（1 のステップを加える）", "start", 11.5, INK, True))
    p = Plot(62, 32, 250, 150, (0, 4), (0, 0.6))
    o.append(p.axes(xl="時間 t [s]", yl="出力 y", xt=[0, 1, 2, 3, 4], yt=[0, 0.2, 0.4, 0.6]))
    o.append(p.line([(0, 0.5), (4, 0.5)], c=MUT, lw=1, dash="4 3"))
    o.append(p.line(list(zip(t, y)), c=SIG, lw=2.4))
    o.append(T(p.X(3.9), p.Y(0.5) + 16, "0.5 に静かに近づく", "end", 10, SIG, True, halo=True))
    o.append(T(350, 18, "(b) 中の状態変数", "start", 11.5, INK, True))
    q = Plot(390, 32, 290, 150, (0, 4), (0, 20))
    o.append(q.axes(xl="時間 t [s]", yl="状態変数", xt=[0, 1, 2, 3, 4], yt=[0, 5, 10, 15, 20]))
    o.append(q.line(list(zip(t, xs[:, 0])), c=ALI, lw=2.2))
    o.append(q.line(list(zip(t, xs[:, 1])), c=ALI, lw=1.8, dash="6 3"))
    o.append(q.line(list(zip(t, y)), c=SIG, lw=1.6))
    o.append(TX(q.X(2.55), q.Y(6.8), "x_1・x_2: e^t の形で増え続ける", "end", 10, ALI, True, halo=True))
    o.append(TX(q.X(3.0), q.Y(0.5) - 6, "y", "start", 10, SIG, True, halo=True))
    o.append(T(q.X(4) - 4, q.Y(17.7) + 16, "4 s で約 18", "end", 9.5, ALI, True, halo=True))
    o.append(TX(14, 232, "A = [0 1; 2 −1]、B = [0 1]ᵀ、C = [−1 1]: 固有値は +1 と −2、伝達関数は (s − 1)/{(s − 1)(s + 2)} = 1/(s + 2)", "start", 10, INK))
    o.append(TX(14, 250, "+1 の固有ベクトル [1 1]ᵀ に C を掛けると −1 + 1 = 0: このモードは出力に現れない", "start", 10, ALI, True))
    return SVG(700, 262, o,
               "極零相殺で伝達関数から消えた固有値。伝達関数 1/(s + 2) は安定で、出力は 0.5 に静かに近づくが、A は右半平面の固有値 +1 をもち、2 つの状態変数は e^t の形で増え続ける。+1 のモードは出力に現れないので、出力だけを見ていると気づけない。")


F["e17_hidden"] = _f17_hidden_fig()
