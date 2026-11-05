# -*- coding: utf-8 -*-
# 07 章 フィードバック系の式 の図
import numpy as _f07_np
from scipy import signal as _f07_sig

# =====================================================================
# 補助
# =====================================================================
_F07_SR = 15          # 加え合わせ点の半径（01 章と同じ）


def _f07_n(v, d=3):
    """数値の文字（負の符号は −）。d は小数点以下の桁。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f07_g(v, d=3):
    """有効数字 d 桁の文字（負の符号は −）。"""
    return (("%." + str(d) + "g") % v).replace("-", "−")


def _f07_fmt(v):
    return ("%g" % v).replace("-", "−")


def _f07_txw(s, sz):
    """TX で書いた文字の幅。"""
    ssz = sz * 0.72
    return sum(tw(t, ssz) if k in ("sub", "sup") else tw(t, sz) for k, t in _tx_tokens(s))


def _f07_frac(xc, yc, num, den, sz=10.5, c=INK, b=False):
    """分数（xc は中心、yc は横線の高さ）。num・den は TX の書き方の文字。返り値 (svg, 幅)。"""
    w = max(_f07_txw(num, sz), _f07_txw(den, sz)) + 6
    s = (TX(xc, yc - 4, num, "middle", sz, c, b) + W(xc - w / 2, yc, xc + w / 2, yc, c=c, lw=1.0)
         + TX(xc, yc + sz + 1.5, den, "middle", sz, c, b))
    return s, w


def _f07_bw(s, sz=10.5):
    """箱の幅（中身に合わせる）。s が (分子, 分母) なら分数。"""
    if isinstance(s, tuple):
        return max(40, max(_f07_txw(s[0], sz), _f07_txw(s[1], sz)) + 18)
    return max(40, _f07_txw(s, sz + 1) + 18)


def _f07_box(x, yc, s, w=None, c=LIN, fill=PAN, sz=10.5, h=None):
    """ブロック線図の箱（左端 x、中心の高さ yc）。s が (分子, 分母) なら分数で書く。返り値 (svg, 幅)。"""
    w = w or _f07_bw(s, sz)
    if isinstance(s, tuple):
        h = h or 44
        f, _ = _f07_frac(x + w / 2, yc - 1, s[0], s[1], sz)
        return RECT(x, yc - h / 2, w, h, 6, fill, c, 1.4) + f, w
    h = h or 34
    return RECT(x, yc - h / 2, w, h, 6, fill, c, 1.4) + TX(x + w / 2, yc + (sz + 1) * 0.36, s, "middle", sz + 1, INK), w


def _f07_chain(x, yc, items, R=_F07_SR):
    """横一列のブロック線図。items は左から順に
       ("a", 長さ, 文字, 色)            矢印（文字は矢印の上）
       ("b", 中身, 名前, 枠の色, 塗り)   箱（中身が (分子, 分母) なら分数。幅は中身に合わせる）
       ("s", 符号の辞書, 名前)           加え合わせ点
       ("t", 名前, 色)                   引き出し点（幅 0）
       ("w", 長さ, 色)                   矢じりの無い線
    返り値 (svg, 位置の辞書, 右端の x)。箱の位置は (左, 右)、加え合わせ点と引き出し点は中心の x。"""
    o, pos = [], {}
    for it in items:
        k = it[0]
        if k == "a":
            L, lab, c = it[1], it[2], it[3]
            o.append(ARR(x, yc, x + L, yc, c=c, lw=1.6))
            if lab:
                o.append(TX(x + L / 2, yc - 8, lab, "middle", 10, c, True, halo=True))
            x += L
        elif k == "b":
            s = it[1]
            c = it[3] if len(it) > 3 else LIN
            fill = it[4] if len(it) > 4 else PAN
            svg, w = _f07_box(x, yc, s, None, c, fill)
            o.append(svg)
            if it[2]:
                pos[it[2]] = (x, x + w)
            x += w
        elif k == "s":
            o.append(SUMJ(x + R, yc, it[1]))
            pos[it[2]] = x + R
            x += 2 * R
        elif k == "t":
            o.append(D(x, yc, it[2] if len(it) > 2 else INK, 3.6))
            pos[it[1]] = x
        elif k == "w":
            o.append(W(x, yc, x + it[1], yc, c=it[2], lw=1.6))
            x += it[1]
    return "".join(o), pos, x


def _f07_fb(xf, xt, yc, depth, c=SIG, box=None, bc=LIN, bfill=PAN, R=_F07_SR, lab=None, lc=None, bh=None):
    """引き出し点 xf から depth だけ下がり、左へ戻って、加え合わせ点（中心 xt）の下から入る線。
    box が中身（文字か (分子, 分母)）なら、戻る線の真ん中に箱を置く。"""
    yb = yc + depth
    o = [W(xf, yc, xf, yb, c=c, lw=1.5)]
    if box is not None:
        w = _f07_bw(box)
        xm = (xf + xt) / 2
        o.append(ARR(xf, yb, xm + w / 2, yb, c=c, lw=1.5, head=6))
        o.append(_f07_box(xm - w / 2, yb, box, w, bc, bfill, h=bh)[0])
        o.append(W(xm - w / 2, yb, xt, yb, c=c, lw=1.5))
    else:
        o.append(W(xf, yb, xt, yb, c=c, lw=1.5))
    o.append(ARR(xt, yb, xt, yc + R, c=c, lw=1.5, head=6))
    if lab:
        o.append(TX((xf + xt) / 2 if box is None else xf - 8, yb - 6, lab, "middle" if box is None else "end", 9.5, lc or c, True, halo=True))
    return "".join(o)


def _f07_top(x, yc, h, lab, c=PUR, R=_F07_SR, a="start", dash=None):
    """上から加え合わせ点（中心 x）に入る矢印（外乱など）。"""
    o = [ARR(x, yc - h, x, yc - R, c=c, lw=1.6, dash=dash)]
    if lab:
        o.append(TX(x + (8 if a == "start" else -8), yc - h + 10, lab, a, 10, c, True, halo=True))
    return "".join(o)


def _f07_rk4(f, x0, t):
    """常微分方程式を 4 次のルンゲ・クッタ法で解く（t の点ごとに 1 刻み）。返り値は状態の並び。"""
    x = _f07_np.array(x0, dtype=float)
    out = [x.copy()]
    for i in range(len(t) - 1):
        h = t[i + 1] - t[i]
        ti = t[i]
        k1 = f(ti, x)
        k2 = f(ti + h / 2, x + h / 2 * k1)
        k3 = f(ti + h / 2, x + h / 2 * k2)
        k4 = f(ti + h, x + h * k3)
        x = x + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        out.append(x.copy())
    return _f07_np.array(out)


def _f07_lsim(num, den, u, t):
    """伝達関数 num/den の応答（u は t の点ごとの入力）。"""
    return _f07_sig.lsim((num, den), u, t)[1]


def _f07_cl(Pn, Pd, Cn, Cd):
    """閉ループ: 返り値 (Gyr, Gyd（操作量に入る外乱）, S) をそれぞれ (分子, 分母) で。"""
    pm, pa = _f07_np.polymul, _f07_np.polyadd
    den = pa(pm(Pd, Cd), pm(Pn, Cn))
    return (pm(Pn, Cn), den), (pm(Pn, Cd), den), (pm(Pd, Cd), den)


def _f07_sp(p, xt, yt, xl="実部", yl="虚部", sz=9, rhp=True):
    """s 平面の地（枠・目盛・右半平面の薄い赤・軸）。"""
    o = [RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8), SPLANE(p, rhp=rhp)]
    o.append(p.axes(xl=xl, yl=yl, xt=xt, yt=yt, xfmt=_f07_fmt, yfmt=_f07_fmt, sz=sz))
    o.append(SPLANE(p, rhp=False))
    return "".join(o)


# 例の値（本文と同じ）
_F07_K, _F07_T = 0.5, 0.5             # 台車の速度: K = 1/c、T = m/c
_F07_KM, _F07_TM = 50.0, 0.05         # モータの角速度: K = 1/K_t、T = J R_a/K_t^2
_F07_D3 = 9.81 * math.sin(math.radians(3))   # 坂 3° の力の大きさ 0.513 N


# =====================================================================
# 1 節: 3 つの結合
# =====================================================================
def _f07_three_fig():
    o = []
    R = _F07_SR
    px, pw, ph = 548, 136, 64

    def plot_frame(y, xr, yr, xt, yt, yl, last=False):
        p = Plot(px, y, pw, ph, xr, yr)
        o.append(p.axes(xl="時間 t [s]" if last else None, yl=yl, xt=xt, yt=yt, xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
        if not last:
            o.append(T(px + pw / 2, y + ph + 26, "時間 t [s]", "middle", 9, MUT))
        return p

    # ---- (a) 直列 ----
    y0 = 18
    o.append(T(14, y0, "(a) 直列結合（2 章 3 節のモータ。電圧から角度まで）", "start", 11.5, INK, True))
    yc = y0 + 46
    s, P1, xe = _f07_chain(16, yc, [("a", 34, "V(s)", GLD), ("b", ("50", "0.05s + 1"), "g1", SIG, SSOFT),
                                    ("a", 40, "Ω_m", INK), ("b", ("1", "s"), "g2", SIG, SSOFT), ("a", 38, "Θ_m", SIG)])
    o.append(s)
    o.append(T(xe + 16, yc + 5, "⇒", "middle", 15, INK, True))
    s, P2, xe2 = _f07_chain(xe + 32, yc, [("a", 26, None, GLD), ("b", ("1000", "s(s + 20)"), "g", SIG, SSOFT), ("a", 30, None, SIG)])
    o.append(s)
    o.append(TX(16, yc + 46, "Θ_m = (1/s) Ω_m、Ω_m = {50/(0.05s + 1)} V なので、掛けて 1 つの箱にする（G_{1}G_{2}）", "start", 9.5, MUT))
    t = _f07_np.linspace(0, 0.3, 301)
    y = _f07_lsim([1000], [1, 20, 0], _f07_np.ones_like(t), t)
    p = plot_frame(y0 - 4, (0, 0.3), (0, 15), [0, 0.1, 0.2, 0.3], [0, 5, 10, 15], "角度 [rad]")
    tt = _f07_np.linspace(0, 0.3, 11)
    xs = _f07_rk4(lambda tq, x: _f07_np.array([(50.0 * 1 - x[0]) / 0.05, x[0]]), [0, 0], _f07_np.linspace(0, 0.3, 601))
    o.append(p.line(list(zip(t, y)), c=SIG, lw=1.8))
    for k in range(0, 601, 60):
        o.append(CIRC(p.X(k * 0.0005), p.Y(xs[k][1]), 2.6, c=SIG, lw=1.3, fill=SCR))
    o.append(T(p.X(0.02), p.Y(12.5), "1 V のステップ", "start", 9, MUT, halo=True))

    # ---- (b) 並列 ----
    y0 = 140
    o.append(T(14, y0, "(b) 並列結合（6 章 5 節のボイラ。給水から水位まで）", "start", 11.5, INK, True))
    yc = y0 + 42
    o.append(ARR(16, yc, 52, yc, c=GLD, lw=1.6))
    o.append(TX(18, yc - 8, "Q(s)", "start", 10, GLD, True))
    o.append(D(52, yc, GLD, 3.6))
    o.append(ARR(52, yc, 84, yc, c=GLD, lw=1.6))
    b1, w1 = _f07_box(84, yc, ("0.5", "s"), 70, SIG, SSOFT)
    o.append(b1)
    yl2 = yc + 50
    o.append(W(52, yc, 52, yl2, c=GLD, lw=1.6))
    o.append(ARR(52, yl2, 84, yl2, c=GLD, lw=1.6))
    b2, w2 = _f07_box(84, yl2, ("20", "10s + 1"), 70, SIG, SSOFT)
    o.append(b2)
    xs_ = 200
    o.append(ARR(154, yc, xs_ - R, yc, c=INK, lw=1.6))
    o.append(W(154, yl2, xs_, yl2, c=INK, lw=1.6))
    o.append(ARR(xs_, yl2, xs_, yc + R, c=INK, lw=1.6))
    o.append(SUMJ(xs_, yc, {"l": "+", "b": "−"}))
    o.append(ARR(xs_ + R, yc, 262, yc, c=SIG, lw=1.6))
    o.append(T(240, yc - 8, "水位", "middle", 10, SIG, True))
    o.append(T(170, yc - 26, "水がたまる（遅く正しく効く）", "middle", 9, MUT))
    o.append(T(200, yl2 + 34, "泡がつぶれる（速く逆向きに効く）", "middle", 9, MUT))
    o.append(T(284, yc + 5, "⇒", "middle", 15, INK, True))
    s, P3, xe3 = _f07_chain(300, yc, [("a", 26, None, GLD), ("b", ("−15s + 0.5", "s(10s + 1)"), "g", SIG, SSOFT), ("a", 30, None, SIG)])
    o.append(s)
    o.append(TX(300, yc + 44, "0.5/s − 20/(10s + 1) を通分する（G_{1} − G_{2}）", "start", 9.5, MUT))
    t = _f07_np.linspace(0, 80, 801)
    y = _f07_lsim([-15, 0.5], [10, 1, 0], _f07_np.ones_like(t), t)
    p = plot_frame(y0 + 2, (0, 80), (-10, 20), [0, 20, 40, 60, 80], [-10, 0, 10, 20], "水位 [mm]")
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(p.line(list(zip(t, y)), c=SIG, lw=1.8))
    xs = _f07_rk4(lambda tq, x: _f07_np.array([0.5, (20.0 - x[1]) / 10.0]), [0, 0], t)
    for k in range(0, 801, 80):
        o.append(CIRC(p.X(t[k]), p.Y(xs[k][0] - xs[k][1]), 2.6, c=SIG, lw=1.3, fill=SCR))
    o.append(T(p.X(4), p.Y(16), "1 kg/s のステップ", "start", 9, MUT, halo=True))

    # ---- (c) フィードバック ----
    y0 = 290
    o.append(T(14, y0, "(c) フィードバック結合（積分 1/(0.5s) を H = 1 で戻すと一次遅れ）", "start", 11.5, INK, True))
    yc = y0 + 42
    s, P4, xe4 = _f07_chain(16, yc, [("a", 34, "U(s)", GLD), ("s", {"l": "+", "b": "∓"}, "s"), ("a", 26, None, INK),
                                     ("b", ("1", "0.5s"), "g", SIG, SSOFT), ("w", 30, SIG), ("t", "tp", SIG), ("a", 40, "Y(s)", SIG)])
    o.append(s)
    o.append(_f07_fb(P4["tp"], P4["s"], yc, 40, c=SIG, lab="H = 1", lc=SIG))
    o.append(T(xe4 + 16, yc + 5, "⇒", "middle", 15, INK, True))
    s, P5, xe5 = _f07_chain(xe4 + 32, yc, [("a", 22, None, GLD), ("b", ("1", "0.5s ± 1"), "g", SIG, SSOFT), ("a", 26, None, SIG)])
    o.append(s)
    o.append(TX(xe4 + 32, yc + 44, "負帰還 G/(1 + GH): 0.5s + 1", "start", 9.5, GRN, True))
    o.append(TX(xe4 + 32, yc + 58, "正帰還 G/(1 − GH): 0.5s − 1", "start", 9.5, ALI, True))
    t = _f07_np.linspace(0, 2.5, 251)
    p = plot_frame(y0 + 2, (0, 2.5), (0, 2), [0, 1, 2], [0, 1, 2], "出力 y", last=True)
    yn = 1 - _f07_np.exp(-2 * t)
    yp = _f07_np.exp(2 * t) - 1
    o.append(p.line([(a, b) for a, b in zip(t, yn)], c=GRN, lw=1.8))
    o.append(p.clip([(a, b) for a, b in zip(t, yp)], c=ALI, lw=1.8))
    xa = _f07_rk4(lambda tq, x: _f07_np.array([2.0 * (1 - x[0]), 2.0 * (1 + x[1])]), [0, 0], _f07_np.linspace(0, 2.5, 251))
    for k in range(0, 251, 25):
        o.append(CIRC(p.X(t[k]), p.Y(xa[k][0]), 2.6, c=GRN, lw=1.3, fill=SCR))
        if xa[k][1] <= 2:
            o.append(CIRC(p.X(t[k]), p.Y(xa[k][1]), 2.6, c=ALI, lw=1.3, fill=SCR))
    o.append(T(p.X(1.3), p.Y(0.72), "負帰還", "start", 9, GRN, True, halo=True))
    o.append(T(p.X(0.62), p.Y(1.75), "正帰還", "end", 9, ALI, True, halo=True))
    yb = y0 + 140
    o.append(LEGL(300, yb, [(SIG, None, "線: まとめた伝達関数の応答")], 9.5))
    o.append(CIRC(500, yb - 4, 2.8, c=SIG, lw=1.3, fill=SCR))
    o.append(T(508, yb, "点: 元の線図のまま数値計算", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "3 つの結合と、その伝達関数。(a) 直列結合は伝達関数の掛け算、(b) 並列結合は足し引き、(c) 負帰還は G/(1 + GH)、正帰還は G/(1 − GH) になる。右のグラフの点は、元の線図の箱ごとの微分方程式を数値計算した応答、線はまとめた伝達関数の応答で、重なる。積分を負帰還で戻すと一次遅れになり、正帰還で戻すと極が右半平面に出て、出力は増え続ける。")
F["e07_three"] = _f07_three_fig()


# =====================================================================
# 1 節: 等価変換
# =====================================================================
def _f07_equiv_fig():
    o = []
    R = _F07_SR
    cw = 346

    def cell(cx, cy, title, before, after, formula):
        o.append(T(cx + 4, cy, title, "start", 11, INK, True))
        o.append(before(cx + 6, cy + 54))
        o.append(T(cx + 168, cy + 59, "⇔", "middle", 15, INK, True))
        o.append(after(cx + 186, cy + 54))
        o.append(TX(cx + 6, cy + 122, formula, "start", 9.5, MUT))

    # ① 加え合わせ点を出力側へ
    def b1(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 28, "U_1", GLD), ("s", {"l": "+", "t": "+"}, "s"), ("a", 18, None, INK),
                                     ("b", "G", "g", SIG, SSOFT), ("a", 26, "Y", SIG)])
        return s + _f07_top(P["s"], y, 40, "U_2", GLD)

    def a1b(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 22, "U_1", GLD), ("b", "G", "g", SIG, SSOFT), ("a", 22, None, INK),
                                     ("s", {"l": "+", "t": "+"}, "s"), ("a", 24, "Y", SIG)])
        xs = P["s"]
        yt = y - 38
        o2 = [s, ARR(x, yt, x + 22, yt, c=GLD, lw=1.6), TX(x + 2, yt - 7, "U_2", "start", 10, GLD, True)]
        o2.append(_f07_box(x + 22, yt, "G", 40, SIG, SSOFT)[0])
        o2.append(W(x + 62, yt, xs, yt, c=INK, lw=1.6))
        o2.append(ARR(xs, yt, xs, y - R, c=INK, lw=1.6))
        return "".join(o2)
    cell(14, 18, "① 加え合わせ点を箱の出力側へ移す", b1, a1b, "Y = G(U_1 + U_2) = GU_1 + GU_2")

    # ② 加え合わせ点を入力側へ
    def b2(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 22, "U_1", GLD), ("b", "G", "g", SIG, SSOFT), ("a", 22, None, INK),
                                     ("s", {"l": "+", "t": "+"}, "s"), ("a", 24, "Y", SIG)])
        return s + _f07_top(P["s"], y, 40, "U_2", GLD)

    def a2(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 22, "U_1", GLD), ("s", {"l": "+", "t": "+"}, "s"), ("a", 16, None, INK),
                                     ("b", "G", "g", SIG, SSOFT), ("a", 24, "Y", SIG)])
        xs = P["s"]
        yt = y - 38
        o2 = [s]
        o2.append(TX(xs + 74, yt + 4, "U_2", "start", 10, GLD, True))
        o2.append(ARR(xs + 70, yt, xs + 50, yt, c=GLD, lw=1.6))
        o2.append(_f07_box(xs + 12, yt, ("1", "G"), 38, SIG, SSOFT)[0])
        o2.append(W(xs + 12, yt, xs, yt, c=INK, lw=1.6))
        o2.append(ARR(xs, yt, xs, y - R, c=INK, lw=1.6))
        return "".join(o2)
    cell(14 + cw, 18, "② 加え合わせ点を箱の入力側へ移す", b2, a2, "Y = GU_1 + U_2 = G(U_1 + U_2/G)")

    # ③ 引き出し点を出力側へ
    def b3(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 26, "U", GLD), ("t", "tp", GLD), ("a", 22, None, GLD),
                                     ("b", "G", "g", SIG, SSOFT), ("a", 30, "Y", SIG)])
        xt = P["tp"]
        return s + W(xt, y, xt, y + 36, c=GLD, lw=1.6) + ARR(xt, y + 36, xt + 52, y + 36, c=GLD, lw=1.6) + TX(xt + 58, y + 40, "X", "start", 10, GLD, True)

    def a3(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 22, "U", GLD), ("b", "G", "g", SIG, SSOFT), ("a", 22, None, SIG),
                                     ("t", "tp", SIG), ("a", 26, "Y", SIG)])
        xt = P["tp"]
        o2 = [s, W(xt, y, xt, y + 36, c=SIG, lw=1.6), ARR(xt, y + 36, xt + 14, y + 36, c=SIG, lw=1.6)]
        o2.append(_f07_box(xt + 14, y + 36, ("1", "G"), 38, SIG, SSOFT)[0])
        o2.append(ARR(xt + 52, y + 36, xt + 70, y + 36, c=GLD, lw=1.6))
        o2.append(TX(xt + 74, y + 40, "X", "start", 10, GLD, True))
        return "".join(o2)
    cell(14, 172, "③ 引き出し点を箱の出力側へ移す", b3, a3, "取り出したいのは X = U = Y/G")

    # ④ 引き出し点を入力側へ
    def b4(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 22, "U", GLD), ("b", "G", "g", SIG, SSOFT), ("a", 22, None, SIG),
                                     ("t", "tp", SIG), ("a", 26, "Y", SIG)])
        xt = P["tp"]
        return s + W(xt, y, xt, y + 36, c=SIG, lw=1.6) + ARR(xt, y + 36, xt + 30, y + 36, c=SIG, lw=1.6) + TX(xt + 36, y + 40, "X", "start", 10, SIG, True)

    def a4(x, y):
        s, P, xe = _f07_chain(x, y, [("a", 22, "U", GLD), ("t", "tp", GLD), ("a", 22, None, GLD),
                                     ("b", "G", "g", SIG, SSOFT), ("a", 26, "Y", SIG)])
        xt = P["tp"]
        o2 = [s, W(xt, y, xt, y + 36, c=GLD, lw=1.6), ARR(xt, y + 36, xt + 22, y + 36, c=GLD, lw=1.6)]
        o2.append(_f07_box(xt + 22, y + 36, "G", 40, SIG, SSOFT)[0])
        o2.append(ARR(xt + 62, y + 36, xt + 84, y + 36, c=SIG, lw=1.6))
        o2.append(TX(xt + 88, y + 40, "X", "start", 10, SIG, True))
        return "".join(o2)
    cell(14 + cw, 172, "④ 引き出し点を箱の入力側へ移す", b4, a4, "取り出したいのは X = Y = GU")
    o.append(W(12, 160, 688, 160, c=LIN, lw=0.8))
    o.append(W(354, 6, 354, 306, c=LIN, lw=0.8))
    return SVG(700, 312, o, "よく使う 4 つの等価変換（⇔ の左右は、入力から出力までの関係が同じ）。加え合わせ点や引き出し点を箱の向こう側へ動かすときは、動かした先の信号が元と同じ値になるように、G か 1/G の箱を足す。1/G の箱は計算のための書き換えで、実際に作るものではない。")
F["e07_equiv"] = _f07_equiv_fig()


# =====================================================================
# 1 節: 台車とばね・ダンパの線図をまとめる
# =====================================================================
def _f07_msd_reduce_fig():
    o = []
    x0 = 92
    hl, hf = SIG, SSOFT       # 次にまとめる部分
    xr = 596

    def head(yy, num, txt, sub=None):
        o.append(T(14, yy, num, "start", 13, INK, True))
        o.append(TX(36, yy, txt, "start", 10.5, INK, True))
        if sub:
            o.append(TX(36 + _f07_txw(txt, 10.5) + 14, yy, sub, "start", 9.5, MUT))

    def nxt(yy, a, b):
        o.append(T(xr, yy + 4, a, "start", 9.5, SIG, True))
        o.append(T(xr, yy + 18, b, "start", 9.5, SIG, True))

    # ① 元の線図
    y = 22
    head(y, "①", "元の線図", "m\\ddot{p} = u − c\\dot{p} − kp")
    yc = y + 38
    s, P, xe = _f07_chain(x0, yc, [("a", 34, "U(s)", GLD), ("s", {"l": "+", "b": "−"}, "sa"), ("a", 20, None, INK),
                                   ("s", {"l": "+", "b": "−"}, "sb"), ("a", 20, None, INK), ("b", ("1", "m"), "m", hl, hf),
                                   ("a", 40, "加速度", INK), ("b", ("1", "s"), "i1", hl, hf), ("a", 34, "速度", INK),
                                   ("t", "tv", INK), ("a", 26, None, INK), ("b", ("1", "s"), "i2"), ("a", 30, None, SIG),
                                   ("t", "tp", SIG), ("a", 56, "位置 Y(s)", SIG)])
    o.append(s)
    o.append(_f07_fb(P["tv"], P["sb"], yc, 44, c=hl, box="c", bc=hl, bfill=hf, bh=26))
    o.append(_f07_fb(P["tp"], P["sa"], yc, 78, c=SIG, box="k", bh=26))
    o.append(T(P["tv"] + 6, yc + 40, "ダンパの力", "start", 9, MUT))
    o.append(T(P["tp"] + 6, yc + 74, "ばねの力", "start", 9, MUT))
    nxt(yc - 10, "次: 1/m・1/s と", "内側の輪をまとめる")
    # ② 直列と内側の輪
    y = yc + 112
    head(y, "②", "(1/m)(1/s) = 1/(ms)、負帰還 (1/(ms)) ÷ (1 + c/(ms)) = 1/(ms + c)")
    yc = y + 36
    s, P, xe = _f07_chain(x0, yc, [("a", 34, "U(s)", GLD), ("s", {"l": "+", "b": "−"}, "sa"), ("a", 24, None, INK),
                                   ("b", ("1", "ms + c"), "m", hl, hf), ("a", 34, "速度", INK), ("b", ("1", "s"), "i2", hl, hf),
                                   ("a", 34, None, SIG), ("t", "tp", SIG), ("a", 56, "位置 Y(s)", SIG)])
    o.append(s)
    o.append(_f07_fb(P["tp"], P["sa"], yc, 58, c=SIG, box="k", bh=26))
    o.append(T(P["m"][0] + 2, yc + 37, "ばねの無い台車の速度の伝達関数", "start", 9, MUT))
    nxt(yc - 10, "次: 1/s と", "直列でまとめる")
    # ③ 直列
    y = yc + 94
    head(y, "③", "直列: (1/(ms + c))(1/s) = 1/{s(ms + c)}")
    yc = y + 36
    s, P, xe = _f07_chain(x0, yc, [("a", 34, "U(s)", GLD), ("s", {"l": "+", "b": "−"}, "sa"), ("a", 24, None, INK),
                                   ("b", ("1", "s(ms + c)"), "m", hl, hf), ("a", 34, None, SIG), ("t", "tp", SIG),
                                   ("a", 56, "位置 Y(s)", SIG)])
    o.append(s)
    o.append(_f07_fb(P["tp"], P["sa"], yc, 44, c=hl, box="k", bc=hl, bfill=hf, bh=26))
    nxt(yc - 10, "次: 外側の輪を", "負帰還でまとめる")
    # ④ 外側の輪
    y = yc + 80
    head(y, "④", "負帰還: [1/{s(ms + c)}] ÷ [1 + k/{s(ms + c)}] = 1/(ms^2 + cs + k)")
    yc = y + 36
    s, P, xe = _f07_chain(x0, yc, [("a", 34, "U(s)", GLD), ("b", ("1", "ms^2 + cs + k"), "m", SIG, SSOFT), ("a", 56, "位置 Y(s)", SIG)])
    o.append(s)
    o.append(T(xe + 14, yc - 2, "= 1/(s² + 2s + 25) m/N（例の値）", "start", 10, SIG, True))
    o.append(T(xe + 14, yc + 14, "6 章 1 節の伝達関数と同じ", "start", 9.5, GRN, True))
    return SVG(700, yc + 32, o, "台車とばね・ダンパの線図を、内側から 1 段ずつまとめる（位置 p の変換を Y(s) と書く）。青い部分を、次の段でまとめる。速度を戻す輪（ダンパの力 c ṗ）と位置を戻す輪（ばねの力 k p）を順に負帰還でまとめると、6 章 1 節の伝達関数 1/(ms² + cs + k) になる。")
F["e07_msd_reduce"] = _f07_msd_reduce_fig()


# =====================================================================
# 2 節: フィードバック系の基本の形と一巡伝達関数
# =====================================================================
def _f07_loop_fig():
    o = []
    R = _F07_SR
    o.append(T(14, 18, "(a) フィードバック系の基本の形（目標値が左、制御量が右、測った値は下を通って戻る）", "start", 11.5, INK, True))
    yc = 96
    s, P, xe = _f07_chain(18, yc, [("a", 72, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 60, None, ALI),
                                   ("b", "C(s)", "c", SIG, SSOFT), ("a", 70, None, GLD), ("s", {"l": "+", "t": "+"}, "s2"),
                                   ("a", 40, None, INK), ("b", "P(s)", "p", SIG, SSOFT), ("a", 80, None, SIG),
                                   ("t", "bp", SIG), ("a", 100, None, SIG)])
    o.append(s)
    o.append(TX(20, yc - 9, "目標値 R(s)", "start", 10, MUT, True))
    o.append(TX((P["s1"] + R + P["c"][0]) / 2, yc - 9, "偏差 E", "middle", 10, ALI, True))
    o.append(TX((P["c"][1] + P["s2"] - R) / 2, yc - 9, "操作量 U", "middle", 10, GLD, True))
    o.append(T((P["c"][0] + P["c"][1]) / 2, yc + 32, "制御器", "middle", 9.5, MUT))
    o.append(T((P["p"][0] + P["p"][1]) / 2, yc + 32, "制御対象", "middle", 9.5, MUT))
    o.append(TX(xe - 4, yc - 9, "制御量 Y(s)", "end", 10, SIG, True))
    o.append(_f07_top(P["s2"], yc, 48, "外乱 D(s)", PUR))
    # 戻る線（観測ノイズを足す加え合わせ点を通る）
    yf = yc + 70
    xs3 = P["s2"]
    o.append(W(P["bp"], yc, P["bp"], yf, c=SIG, lw=1.6))
    o.append(ARR(P["bp"], yf, xs3 + R, yf, c=SIG, lw=1.6))
    o.append(SUMJ(xs3, yf, {"r": "+", "b": "+"}))
    o.append(ARR(xs3, yf + 46, xs3, yf + R, c=TEA, lw=1.6, dash="4 3"))
    o.append(TX(xs3 + 8, yf + 42, "観測ノイズ N(s)", "start", 10, TEA, True))
    o.append(W(xs3 - R, yf, P["s1"], yf, c=TEA, lw=1.6))
    o.append(ARR(P["s1"], yf, P["s1"], yc + R, c=TEA, lw=1.6))
    o.append(TX((P["s1"] + xs3) / 2, yf - 8, "測った値 Y + N", "middle", 10, TEA, True))
    # 3 つの閉ループ伝達関数
    yt = yf + 84
    o.append(TX(14, yt - 22, "まとめると Y = G_{yr}R + G_{yd}D − G_{yr}N（2 節の導出）", "start", 10.5, INK, True))
    fw = _f07_txw("1 + P(s)C(s)", 11) + 6
    o.append(TX(20, yt + 8, "G_{yr}(s) =", "start", 11, MUT, True))
    o.append(_f07_frac(20 + _f07_txw("G_{yr}(s) =", 11) + 8 + fw / 2, yt + 4, "P(s)C(s)", "1 + P(s)C(s)", 11)[0])
    x2 = 252
    o.append(TX(x2, yt + 8, "G_{yd}(s) =", "start", 11, PUR, True))
    o.append(_f07_frac(x2 + _f07_txw("G_{yd}(s) =", 11) + 8 + fw / 2, yt + 4, "P(s)", "1 + P(s)C(s)", 11, PUR)[0])
    x3 = 484
    o.append(T(x3, yt + 8, "ノイズから: −", "start", 11, TEA, True))
    o.append(_f07_frac(x3 + tw("ノイズから: −", 11) + 8 + fw / 2, yt + 4, "P(s)C(s)", "1 + P(s)C(s)", 11, TEA)[0])
    o.append(TX(14, yt + 42, "分母はどれも 1 + P(s)C(s)。ノイズの伝達関数は G_{yr} と符号だけが違う。", "start", 10, MUT))
    # (b) 一巡伝達関数
    yb = yt + 76
    o.append(W(12, yb - 16, 688, yb - 16, c=LIN, lw=0.8))
    o.append(T(14, yb + 4, "(b) 輪を 1 か所で切り、信号を一周させる", "start", 11.5, INK, True))
    yc2 = yb + 56
    xcut = 150
    o.append(SUMJ(84, yc2, {"l": "+", "b": "−"}))
    o.append(ARR(20, yc2, 84 - R, yc2, c=MUT, lw=1.6))
    o.append(TX(22, yc2 - 9, "R = 0", "start", 10, MUT, True))
    o.append(ARR(84 + R, yc2, xcut - 8, yc2, c=ALI, lw=1.6))
    o.append(W(xcut - 6, yc2 - 10, xcut - 6, yc2 + 10, c=INK, lw=2))
    o.append(W(xcut + 6, yc2 - 10, xcut + 6, yc2 + 10, c=INK, lw=2))
    o.append(T(xcut, yc2 - 16, "切る", "middle", 9.5, INK, True))
    o.append(TX(xcut - 10, yc2 + 26, "戻る信号 B", "end", 10, ALI, True))
    o.append(ARR(xcut + 8, yc2, 214, yc2, c=ALI, lw=1.6))
    o.append(TX(xcut + 12, yc2 + 26, "入れる信号 A", "start", 10, ALI, True))
    b1, w1 = _f07_box(214, yc2, "C(s)", 62, SIG, SSOFT)
    o.append(b1)
    o.append(ARR(276, yc2, 320, yc2, c=GLD, lw=1.6))
    b2, w2 = _f07_box(320, yc2, "P(s)", 62, SIG, SSOFT)
    o.append(b2)
    o.append(W(382, yc2, 430, yc2, c=SIG, lw=1.6))
    o.append(W(430, yc2, 430, yc2 + 46, 84, yc2 + 46, c=SIG, lw=1.6))
    o.append(ARR(84, yc2 + 46, 84, yc2 + R, c=SIG, lw=1.6))
    o.append(TX(260, yc2 + 40, "P(s)C(s)A", "middle", 10, SIG, True))
    xr = 456
    lines = [("A → C → P と進んで P(s)C(s)A になり、", INK, False), ("加え合わせ点で引かれて B = −P(s)C(s)A", INK, False),
             ("− の符号を除いた P(s)C(s) が", SIG, True), ("一巡伝達関数", SIG, True)]
    for i, (tx_, c, bb) in enumerate(lines):
        o.append(TX(xr, yc2 - 22 + i * 17, tx_, "start", 10, c, bb))
    return SVG(700, yc2 + 66, o, "(a) フィードバック系の基本の形。制御器 C(s) が偏差から操作量を決め、操作量に外乱が加わって制御対象 P(s) に入る。制御量を測った値には観測ノイズが加わる。3 つの入力から制御量までの閉ループ伝達関数は、どれも分母が 1 + P(s)C(s) になる。(b) 輪を 1 か所で切って信号 A を入れると、一周して −P(s)C(s)A が戻ってくる。加え合わせ点の − を除いた P(s)C(s) を一巡伝達関数という。")
F["e07_loop"] = _f07_loop_fig()


# =====================================================================
# 2 節: 前の章の結果を、閉ループ伝達関数で計算し直す
# =====================================================================
def _f07_recalc_fig():
    o = []
    px, pw, ph = 538, 140, 54
    rows = []
    y = 14

    def row(y, tag, title, l1, l2, l3=None):
        o.append(CHIP(14, y + 13, tag, SIG, 9.5)[0])
        o.append(TX(80, y + 13, title, "start", 10.5, INK, True))
        o.append(TX(28, y + 33, l1, "start", 10, INK))
        o.append(TX(28, y + 50, l2, "start", 10, MUT))
        if l3:
            o.append(TX(28, y + 67, l3, "start", 10, GRN, True))

    # 1. 3 章 6 節
    row(y, "3 章 6 節", "台車の速度の比例制御（K_P = 8 N/(m/s)）",
        "P = 0.5/(0.5s + 1)、C = 8 → G_{yr} = 4/(0.5s + 5) = 0.8/(0.1s + 1)",
        "時定数 T/(1 + KK_P) = 0.1 s、定常ゲイン KK_P/(1 + KK_P) = 0.8",
        "閉ループの極 −10。95 % に届くのは 0.30 s（3 章 6 節の表と同じ）")
    t = _f07_np.linspace(0, 0.6, 301)
    p = Plot(px, y + 8, pw, ph, (0, 0.6), (0, 1))
    o.append(p.axes(xl=None, yl=None, xt=[0, 0.3, 0.6], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(p.line([(0, 1), (0.6, 1)], c=MUT, lw=1.1, dash="4 3"))
    o.append(p.line([(a, 0.8 * (1 - math.exp(-a / 0.1))) for a in t], c=SIG, lw=1.8))
    o.append(D(p.X(0.3), p.Y(0.76), SIG, 3.4))
    o.append(T(p.X(0.32), p.Y(0.76) + 13, "0.30 s で 95 %", "start", 9, SIG, True, halo=True))
    # 2. 1 章 4 節
    y += 92
    row(y, "1 章 4 節", "決めた力 u_0 = c r を足した比例制御（坂は 1 s から）",
        "Y = {(c + K_P)P R + P D} ÷ (1 + K_P P)",
        "s = 0 で Y = 1 × R + 0.1 × D（D = −0.513 N の坂）",
        "坂の上で 1 − 0.0513 = 0.949 m/s（1 章 4 節と同じ）。極は −10 のまま")
    t = _f07_np.linspace(0, 2, 401)
    yy = [(1 - math.exp(-a / 0.1)) - (0.0513416 * (1 - math.exp(-(a - 1) / 0.1)) if a >= 1 else 0) for a in t]
    p = Plot(px, y + 8, pw, ph, (0, 2), (0, 1.2))
    o.append(p.axes(xl=None, yl=None, xt=[0, 1, 2], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(RECT(p.X(1), p.y, p.X(2) - p.X(1), p.h, 0, PSOFT, "none", 0))
    o.append(p.line([(0, 1), (2, 1)], c=MUT, lw=1.1, dash="4 3"))
    o.append(p.line(list(zip(t, yy)), c=SIG, lw=1.8))
    o.append(T(p.X(1.95), p.Y(0.949) + 14, "0.949", "end", 9, SIG, True, halo=True))
    o.append(T(p.X(1.5), p.y + 11, "坂", "middle", 9, PUR, True, halo=True))
    # 3. 4 章 6 節
    y += 92
    row(y, "4 章 6 節", "モータの位置の比例制御（K_P = 0.21 V/rad）",
        "P = 50/{s(0.05s + 1)}、C = 0.21 → G_{yr} = 210/(s^2 + 20s + 210)",
        "1 + PC = 0 の分母を払うと 0.05s^2 + s + 10.5 = 0（4 章 6 節の特性方程式）",
        "閉ループの極 −10 ± j10.49、行き過ぎ量 5.0 %（4 章 6 節と同じ）")
    t = _f07_np.linspace(0, 0.6, 601)
    yv = _f07_lsim([210], [1, 20, 210], _f07_np.ones_like(t), t)
    p = Plot(px, y + 8, pw, ph, (0, 0.6), (0, 1.2))
    o.append(p.axes(xl=None, yl=None, xt=[0, 0.3, 0.6], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(p.line([(0, 1), (0.6, 1)], c=MUT, lw=1.1, dash="4 3"))
    o.append(p.line(list(zip(t, yv)), c=SIG, lw=1.8))
    i = int(_f07_np.argmax(yv))
    o.append(D(p.X(t[i]), p.Y(yv[i]), SIG, 3.4))
    o.append(T(p.X(t[i]) + 4, p.Y(yv[i]) + 13, "5.0 %", "start", 9, SIG, True, halo=True))
    # 4. 6 章 4 節
    y += 92
    row(y, "6 章 4 節", "同じ制御で L_a を含めたもの（K_P = 40 V/rad）",
        "P = 2×10^{6}/{s(s^2 + 2000s + 40000)}、C = K_P",
        "1 + PC = 0 → s^3 + 2000s^2 + 40000s + 2×10^{6} K_P = 0",
        "K_P = 40 V/rad で極 ±j200 と −2000（安定限界。6 章 4 節と同じ）")
    t = _f07_np.linspace(0, 0.1, 2001)
    yv = _f07_lsim([8e7], [1, 2000, 40000, 8e7], _f07_np.ones_like(t), t)
    p = Plot(px, y + 8, pw, ph, (0, 0.1), (0, 2.2))
    o.append(p.axes(xl=None, yl=None, xt=[0, 0.05, 0.1], yt=[0, 1, 2], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(p.line([(0, 1), (0.1, 1)], c=MUT, lw=1.1, dash="4 3"))
    o.append(p.line(list(zip(t, yv)), c=ALI, lw=1.4))
    o.append(T(px + pw / 2, y + ph + 42, "時間 t [s]（縦軸は単位ステップへの応答）", "middle", 9, MUT))
    for k in range(3):
        o.append(T(px + pw / 2, 14 + k * 92 + ph + 42, "時間 t [s]", "middle", 9, MUT))
    return SVG(700, y + ph + 50, o, "1・3・4・6 章で、それぞれ微分方程式を立てて求めた比例制御の結果を、閉ループ伝達関数で計算し直す。どれも同じ値になる。右のグラフは、目標値の単位ステップに対する制御量（2 段目は 1 s に坂に入る場合）。決めた力 u<sub>0</sub> の道は、目標値の係数を 1 にするが、分母 1 + K<sub>P</sub>P と閉ループの極は変えない。")
F["e07_recalc"] = _f07_recalc_fig()


# =====================================================================
# 2 節: 閉ループの極はゲインで動く
# =====================================================================
def _f07_clpoles_fig():
    o = []
    cols = [(TEA, None), (SIG, None), (GLD, None), (ALI, None)]
    # (a) 台車の速度
    o.append(TX(14, 18, "(a) 台車の速度の比例制御: 開ループの極 −2、閉ループの極 −(1 + KK_P)/T", "start", 11.5, INK, True))
    p = Plot(70, 40, 250, 110, (-25, 5), (-5, 5))
    o.append(_f07_sp(p, [-20, -10, 0], [-5, 0, 5], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    o.append(PZ(p, [complex(-2, 0)], [], MUT, 5.5))
    ks = [(2, TEA), (8, SIG), (20, GLD)]
    for KP, c in ks:
        pl = -(1 + 0.5 * KP) / 0.5
        o.append(PZ(p, [complex(pl, 0)], [], c, 5.5))
        o.append(TX(p.X(pl), p.Y(0) - 12, "%g" % KP, "middle", 9.5, c, True, halo=True))
    o.append(ARR(p.X(-2.5), p.Y(-2.8), p.X(-21), p.Y(-2.8), c=FNT, lw=1.2, head=6))
    o.append(TX(p.X(-11.5), p.Y(-2.8) + 14, "K_P を上げると左へ", "middle", 9, MUT, False, halo=True))
    o.append(TX(p.X(-1.5), p.Y(0) + 18, "開ループ", "start", 9, MUT, False, halo=True))
    q = Plot(410, 40, 270, 110, (0, 0.8), (0, 1.2))
    o.append(q.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.2, 0.4, 0.6, 0.8], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(q.line([(0, 1), (0.8, 1)], c=MUT, lw=1.1, dash="4 3"))
    t = _f07_np.linspace(0, 0.8, 401)
    for KP, c in ks:
        g = 1 + 0.5 * KP
        o.append(q.line([(a, 0.5 * KP / g * (1 - math.exp(-a * g / 0.5))) for a in t], c=c, lw=1.8))
    o.append(LEGL(410, 204, [(TEA, None, "K_P = 2 N/(m/s)"), (SIG, None, "8"), (GLD, None, "20")], 9.5, 12))
    # (b) モータの位置
    y0 = 238
    o.append(TX(14, y0, "(b) モータの位置の比例制御: 開ループの極 0 と −20、閉ループの極は 0.05s^2 + s + 50K_P = 0 の根", "start", 11.5, INK, True))
    p = Plot(70, y0 + 22, 250, 170, (-25, 5), (-35, 35))
    o.append(_f07_sp(p, [-20, -10, 0], [-30, -15, 0, 15, 30], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    o.append(W(p.X(0), p.Y(0), p.X(-20), p.Y(0), c=FNT, lw=3))
    o.append(W(p.X(-10), p.Y(-35), p.X(-10), p.Y(35), c=FNT, lw=1.2, dash="3 3"))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [], MUT, 5.5))
    km = [(0.05, TEA), (0.1, GRN), (0.21, SIG), (1.0, GLD)]
    for KP, c in km:
        rts = _f07_np.roots([0.05, 1, 50 * KP])
        o.append(PZ(p, [complex(r) for r in rts], [], c, 5))
    o.append(TX(p.X(-17.07), p.Y(0) + 18, "0.05", "middle", 9, TEA, True, halo=True))
    o.append(TX(p.X(-2.93), p.Y(0) + 18, "0.05", "middle", 9, TEA, True, halo=True))
    o.append(TX(p.X(-10) - 4, p.Y(0) - 10, "0.1", "end", 9, GRN, True, halo=True))
    o.append(TX(p.X(-10) + 8, p.Y(10.49) + 4, "0.21", "start", 9, SIG, True, halo=True))
    o.append(TX(p.X(-10) + 8, p.Y(30) + 4, "1", "start", 9, GLD, True, halo=True))
    o.append(TX(p.X(-24), p.Y(-28), "数字は K_P [V/rad]", "start", 9, MUT, False, halo=True))
    q = Plot(410, y0 + 22, 270, 170, (0, 0.8), (0, 1.8))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6, 0.8], yt=[0, 0.5, 1, 1.5], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(q.line([(0, 1), (0.8, 1)], c=MUT, lw=1.1, dash="4 3"))
    t = _f07_np.linspace(0, 0.8, 801)
    for KP, c in km:
        yv = _f07_lsim([1000 * KP], [1, 20, 1000 * KP], _f07_np.ones_like(t), t)
        o.append(q.line(list(zip(t, yv)), c=c, lw=1.8))
    o.append(LEGL(410, y0 + 236, [(TEA, None, "K_P = 0.05"), (GRN, None, "0.1"), (SIG, None, "0.21"), (GLD, None, "1")], 9.5, 12))
    return SVG(700, y0 + 246, o, "比例ゲイン K<sub>P</sub> を変えたときの閉ループの極（左）と、目標値の単位ステップに対する応答（右）。灰色の × は開ループの極（一巡伝達関数の極）で、K<sub>P</sub> によらない。(a) 台車の速度では、閉ループの極が実軸の上を左へ動き、応答が速くなる。(b) モータの位置では、2 つの閉ループの極が K<sub>P</sub> = 0.1 V/rad で −10 に重なり、その後は実部 −10 のまま上下に離れて、振動が速く大きくなる（灰色の太線と破線は、極が通る道筋）。")
F["e07_clpoles"] = _f07_clpoles_fig()
