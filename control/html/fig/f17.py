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


def _f17_mat(x, y, rows, sz=11, c=INK, gap=12, lh=None, pad=6):
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
            o.append(TX(x, yc + sz * 0.36, it[1], "start", sz, cc))
            x += TXW(it[1], sz) + 3
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
    o.append(T(p.X(0.72), p.Y(-1.05) + 14, "速度 0: −1.05 cm", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.2), p.Y(-2.8) + 4, "左へ 20 cm/s: −2.80 cm", "end", 9.5, PUR, True, halo=True))
    o.append(T(q.X(2) + 4, q.y + 11, "p = 2 cm", "start", 9, MUT, halo=True))
    # (b) 違う過去から同じ状態へ
    yb = 214
    o.append(T(14, yb, "(b) 違う過去から、時刻 0 に同じ位置と速度へ来た 2 つの台車（時刻 0 からは力を加えない）", "start", 11.5, INK, True))
    tA, xA = _f17_sim(A, B, [0.0, 0.0], lambda t: 1.0 if t < 0 else 0.0, -1.0, 3.0, 4000)
    xB0 = _f17_la.expm(-A) @ xA[1000]
    tB, xB = _f17_sim(A, B, xB0, None, -1.0, 3.0, 4000)
    p2 = Plot(62, yb + 14, 372, 132, (-1, 3), (-9, 7))
    o.append(p2.axes(xl=None, yl="位置 p [cm]", xt=[-1, 0, 1, 2, 3], yt=[-8, -4, 0, 4]))
    o.append(T(p2.x + p2.w / 2, p2.y + p2.h + 46, "時間 t [s]", "middle", 10, MUT))
    o.append(W(p2.X(0), p2.y, p2.X(0), p2.y + p2.h, c=ALI, lw=1, dash="3 3"))
    o.append(p2.clip(list(zip(tA, xA[:, 0] * 100)), c=SIG, lw=2.4))
    o.append(p2.clip(list(zip(tB, xB[:, 0] * 100)), c=TEA, lw=1.8, dash="6 4"))
    o.append(D(p2.X(0), p2.Y(xA[1000, 0] * 100), ALI, 3.6))
    o.append(T(p2.X(0) + 6, p2.Y(4.02) - 8, "時刻 0: 4.02 cm・−7.38 cm/s", "start", 9.5, ALI, True, halo=True))
    o.append(T(p2.X(-0.98), p2.Y(5.6), "1 s の間 1 N で押した", "start", 9.5, SIG, True, halo=True))
    o.append(T(p2.X(-0.55), p2.Y(-7.6), "押さずに弾いた", "start", 9.5, TEA, True, halo=True))
    o.append(T(p2.X(2.95), p2.Y(-6.2), "時刻 0 からは 2 本が重なる", "end", 9.5, MUT, halo=True))
    o.append(_f17_strip(p2.x, p2.y + p2.h + 6, p2.w, -1, 3, [(-1, 0)], GLD, 9, "力"))
    q2 = Plot(508, yb + 14, 172, 132, (-9, 7), (-60, 40))
    o.append(_f17_box(q2))
    o.append(q2.axes(xl="位置 p [cm]", yl=None, xt=[-8, -4, 0, 4], yt=[-60, -40, -20, 0, 20, 40]))
    o.append(TX(q2.x - 30, q2.y + q2.h / 2, "速度 \\dot{p} [cm/s]", "middle", 10, MUT, rot=-90))
    o.append(_f17_axes0(q2))
    o.append(q2.clip([(a * 100, b * 100) for a, b in xA], c=SIG, lw=2.2))
    o.append(q2.clip([(a * 100, b * 100) for a, b in xB], c=TEA, lw=1.6, dash="6 4"))
    o.append(D(q2.X(xA[1000, 0] * 100), q2.Y(xA[1000, 1] * 100), ALI, 3.8))
    o.append(D(q2.X(xB0[0] * 100), q2.Y(xB0[1] * 100), TEA, 3.0))
    o.append(T(q2.X(xB0[0] * 100) + 5, q2.Y(xB0[1] * 100) + 3, "1 s 前", "start", 9, TEA, halo=True))
    return SVG(700, yb + 14 + 132 + 54, o,
               "台車とばね・ダンパ（1 kg、2 N·s/m、25 N/m）。(a) 同じ位置から放しても、速度が違えば、その後の動きは違う。右は位置と速度の平面（位相平面）で、3 つの点は同じ縦の線（位置 2 cm）の上にある。(b) 1 s の間押されていた台車と、押されずに弾かれた台車は、過去が違うが、時刻 0 に同じ位置と速度になり、その後はまったく同じに動く。位相平面では、2 本の軌跡が時刻 0 の点で合わさり、そこから 1 本になる。")


F["e17_future"] = _f17_future_fig()


# =====================================================================
# 1 節: エネルギーをためる所と状態変数
# =====================================================================
def _f17_storage_fig():
    o = []
    o.append(T(14, 18, "(a) エネルギーをためる所と、ためる量（状態変数になる）", "start", 11.5, INK, True))
    items = [("質量", "運動のエネルギー", "m\\dot{p}^2/2", "速度 \\dot{p}", "mass"),
             ("ばね", "伸びのエネルギー", "kp^2/2", "伸び（位置）p", "spring"),
             ("コイル", "磁気のエネルギー", "L_ai^2/2", "電流 i", "coil"),
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
        o.append(TX(x + bw / 2, y0 + 108, f, "middle", 10, MUT))
        o.append(TX(x + bw / 2, y0 + 136, st, "middle", 11, SIG, True))
    o.append(T(14, y0 + 172, "ためる量は急に跳べない（有限の電力でしか増減しない）ので、今の値が次の瞬間の値を決める", "start", 10, INK))
    # (b) 例の対象の状態変数
    yb = y0 + 202
    o.append(T(14, yb, "(b) 例の対象の状態変数", "start", 11.5, INK, True))
    rows = [("一次遅れ（ばねの無い台車の速度・温度の板）", "\\dot{p} または θ", "1"),
            ("台車とばね・ダンパ", "p, \\dot{p}", "2"),
            ("DC モータ（L_a を含む）", "i, ω_m（回転角も見るなら θ_m を加える）", "2（3）"),
            ("台車に立てた振子（倒立振子）", "p, \\dot{p}, φ, \\dot{φ}", "4")]
    o.append(T(330, yb + 22, "状態変数", "start", 10, MUT, True))
    o.append(T(672, yb + 22, "数 n", "end", 10, MUT, True))
    for i, (a, b, n) in enumerate(rows):
        y = yb + 42 + i * 22
        o.append(TX(20, y, a, "start", 10.5, INK))
        o.append(TX(330, y, b, "start", 10.5, SIG, True))
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
    o.append(T(14, 18, "(a) 状態方程式と出力方程式（太い線は n 個の信号を並べたベクトル）", "start", 11.5, INK, True))
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
    o.append(T(pos["s"] + 22, yc2 + 50, "ダンパの力", "start", 9.5, MUT, halo=True))
    o.append(T(pos["s"] + 22, yc2 - 54, "ばねの力", "start", 9.5, MUT, halo=True))
    return SVG(700, yc2 + 70, o,
               "状態空間モデルのブロック線図。(a) 状態の変わる速さ ẋ を積分して状態 x を作る。A は状態を状態の変わる速さへ戻し、B は入力をそこへ加える。C は状態から出力を取り出し、D は入力を直接出力へ通す。(b) 台車とばね・ダンパでは、力を質量で割った加速度を 2 回積分する。2 つの積分の出力（速度と位置）が状態変数で、ばねとダンパの力が状態から戻る。")


F["e17_ssbd"] = _f17_ssbd_fig()
