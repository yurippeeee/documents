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


# =====================================================================
# 3 節: 型と定常偏差
# =====================================================================
_F07_LOOPS = [
    # (型, 題, 一巡伝達関数の文字, 一巡の分子, 一巡の分母, 時間の範囲, ステップの縦の範囲, ランプの縦の範囲, ステップの偏差, ランプの偏差)
    (0, "台車の速度・比例（K_P = 8 N/(m/s)）", "P(s)C(s) = 4/(0.5s + 1)", [4.0], [0.5, 1.0], 1.0, 1.2, 1.0, "0.2", "増え続ける"),
    (1, "モータの位置・比例（K_P = 0.21 V/rad）", "P(s)C(s) = 10.5/{s(0.05s + 1)}", [10.5], [0.05, 1.0, 0.0], 1.0, 1.2, 1.0, "0", "0.0952"),
    (1, "台車の速度・比例 + 積分（K_P = 8、K_I = 25 N/m）", "P(s)C(s) = (4s + 12.5)/{s(0.5s + 1)}", [4.0, 12.5], [0.5, 1.0, 0.0], 1.5, 1.2, 1.5, "0", "0.08"),
    (2, "モータの位置・比例 + 積分（K_P = 0.21、K_I = 0.5 V/(rad·s)）", "P(s)C(s) = (10.5s + 25)/{s^2(0.05s + 1)}", [10.5, 25.0], [0.05, 1.0, 0.0, 0.0], 2.0, 1.4, 2.0, "0", "0"),
]


def _f07_type_grid_fig():
    o = []
    ax, aw = 46, 112
    bx, bw = 236, 210
    cx, cw = 486, 200
    ph = 66
    o.append(T(ax + aw / 2, 16, "(a) 極（灰: 一巡、青: 閉ループ）", "middle", 10, INK, True))
    o.append(T(bx + bw / 2, 16, "(b) 単位ステップ", "middle", 10.5, INK, True))
    o.append(T(cx + cw / 2, 16, "(c) 単位ランプ（r = t）", "middle", 10.5, INK, True))
    y = 30
    for N, title, ltx, ln, ld, tend, ys, yr, es, er in _F07_LOOPS:
        o.append(T(14, y + 12, "型 %d" % N, "start", 12, SIG, True))
        o.append(TX(56, y + 12, title, "start", 10.5, INK, True))
        o.append(TX(690, y + 12, ltx, "end", 9.5, MUT))
        yp = y + 24
        # (a) 極
        p = Plot(ax, yp, aw, ph, (-25, 5), (-15, 15))
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
        o.append(SPLANE(p))
        o.append(p.axes(xl=None, yl=None, xt=[-20, -10, 0], yt=[-10, 0, 10], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9, grid=False))
        ol = [complex(r) for r in _f07_np.roots(ld)]
        zl = [complex(r) for r in _f07_np.roots(ln)] if len(ln) > 1 else []
        den = _f07_np.polyadd(ld, ln)
        cl = [complex(r) for r in _f07_np.roots(den)]
        o.append(PZ(p, ol, zl, MUT, 4.5))
        o.append(PZ(p, cl, [], SIG, 4.5))
        o.append(T(p.X(0) + 5, p.y + 11, "原点に %d 個" % N, "start", 9, SIG, True, halo=True))
        # (b) ステップ
        t = _f07_np.linspace(0, tend, 801)
        yv = _f07_lsim(ln, den, _f07_np.ones_like(t), t)
        q = Plot(bx, yp, bw, ph, (0, tend), (0, ys))
        o.append(q.axes(xl=None, yl=None, xt=[0, tend / 2, tend], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
        o.append(q.line([(0, 1), (tend, 1)], c=MUT, lw=1.1, dash="4 3"))
        o.append(q.line(list(zip(t, yv)), c=SIG, lw=1.8))
        yf = yv[-1]
        if N == 0:
            o.append(DIM(q.X(tend * 0.9), q.Y(yf), q.X(tend * 0.9), q.Y(1), None, c=ALI))
            o.append(T(q.X(tend * 0.9) - 8, q.Y(0.9) + 4, "偏差 0.2", "end", 9, ALI, True, halo=True))
        else:
            o.append(T(q.X(tend * 0.98), q.Y(0.32), "偏差 → 0", "end", 9, GRN, True, halo=True))
        mp = (max(yv) - 1) * 100
        if mp > 0.5:
            i = int(_f07_np.argmax(yv))
            o.append(T(q.X(t[i]) + 6, q.Y(yv[i]) + 3, "行き過ぎ %.1f %%" % mp, "start", 9, MUT, False, halo=True))
        # (c) ランプ
        yv = _f07_lsim(ln, den, t, t)
        q = Plot(cx, yp, cw, ph, (0, tend), (0, yr))
        o.append(q.axes(xl=None, yl=None, xt=[0, tend / 2, tend], yt=[0, yr / 2, yr], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
        o.append(q.line([(0, 0), (tend, tend)], c=MUT, lw=1.1, dash="4 3"))
        o.append(q.line(list(zip(t, yv)), c=SIG, lw=1.8))
        e_end = tend - yv[-1]
        if N == 0:
            o.append(DIM(q.X(tend * 0.97), q.Y(yv[-1]), q.X(tend * 0.97), q.Y(tend), None, c=ALI))
            o.append(T(q.X(tend * 0.5), q.Y(yr * 0.82), "偏差は毎秒 0.2 ずつ増える", "middle", 9, ALI, True, halo=True))
        elif er != "0":
            o.append(DIM(q.X(tend * 0.97), q.Y(yv[-1]), q.X(tend * 0.97), q.Y(tend), None, c=ALI))
            o.append(T(q.X(tend * 0.5), q.Y(yr * 0.82), "偏差 → " + er, "middle", 9, ALI, True, halo=True))
        else:
            o.append(T(q.X(tend * 0.5), q.Y(yr * 0.82), "偏差 → 0", "middle", 9, GRN, True, halo=True))
        y += 108
    o.append(T(bx + bw / 2, y + 12, "時間 t [s]（破線は目標値）", "middle", 9.5, MUT))
    o.append(T(cx + cw / 2, y + 12, "時間 t [s]（破線は目標値 r = t）", "middle", 9.5, MUT))
    return SVG(700, y + 20, o, "型ごとの定常偏差（例の値）。(a) 一巡伝達関数の極（灰色の ×）と零点（灰色の ○）、閉ループの極（青の ×）。原点にある一巡伝達関数の極の数が型である。(b) 単位ステップの目標値には、型 0 では偏差 1/(1 + 4) = 0.2 が残り、型 1 以上では 0 になる。(c) 単位ランプの目標値には、型 0 では偏差が増え続け、型 1 では一定の偏差（0.0952 rad、0.08 m/s）が残り、型 2 では 0 になる。型を上げると、ステップへの行き過ぎは増える。")
F["e07_type_grid"] = _f07_type_grid_fig()


def _f07_type_why_fig():
    o = []
    R = _F07_SR

    def chip(x, y, t, c):
        o.append(CHIP(x, y, t, c, 9.5, 4, "middle")[0])

    # (a) 型 0
    o.append(TX(14, 18, "(a) 型 0（台車の速度、K_P = 8 N/(m/s)）。目標値 1 m/s で落ち着いたとき", "start", 11.5, INK, True))
    yc = 70
    s, P, xe = _f07_chain(18, yc, [("a", 70, "r", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 70, "e", ALI),
                                   ("b", "K_P = 8", "c", LIN, PAN), ("a", 84, "u", GLD), ("b", ("0.5", "0.5s + 1"), "p", SIG, SSOFT),
                                   ("a", 96, "y", SIG), ("t", "bp", SIG), ("a", 40, None, SIG)])
    o.append(s)
    o.append(_f07_fb(P["bp"], P["s1"], yc, 52, c=SIG))
    chip(53, yc + 26, "1.000 m/s", MUT)
    chip((P["s1"] + R + P["c"][0]) / 2, yc + 26, "0.200 m/s", ALI)
    chip((P["c"][1] + P["p"][0]) / 2, yc + 26, "1.60 N", GLD)
    chip((P["p"][1] + P["bp"]) / 2, yc + 26, "0.800 m/s", SIG)
    o.append(TX(18, yc + 74, "速度 0.800 m/s を保つ力は y/K = 0.800 ÷ 0.5 = 1.60 N。比例制御はこの力を偏差から作るので、偏差は 1.60 ÷ 8 = 0.200 m/s 残る。", "start", 9.5, INK))
    # (b) 型 1、ランプ
    y0 = 174
    o.append(W(12, y0 - 18, 688, y0 - 18, c=LIN, lw=0.8))
    o.append(TX(14, y0, "(b) 型 1（モータの位置、K_P = 0.21 V/rad）。目標値を 1 rad/s で回し続けたとき", "start", 11.5, INK, True))
    yc = y0 + 52
    s, P, xe = _f07_chain(18, yc, [("a", 52, "r = t", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 66, "e", ALI),
                                   ("b", "K_P = 0.21", "c", LIN, PAN), ("a", 66, "v", GLD), ("b", ("50", "0.05s + 1"), "p", LIN, PAN),
                                   ("a", 66, "ω_m", INK), ("b", ("1", "s"), "i", SIG, SSOFT), ("a", 70, "θ_m", SIG),
                                   ("t", "bp", SIG), ("a", 28, None, SIG)])
    o.append(s)
    o.append(_f07_fb(P["bp"], P["s1"], yc, 52, c=SIG))
    chip(44, yc + 30, "毎秒 1 rad", MUT)
    chip((P["s1"] + R + P["c"][0]) / 2, yc + 30, "0.0952 rad", ALI)
    chip((P["c"][1] + P["p"][0]) / 2, yc + 30, "0.0200 V", GLD)
    chip((P["p"][1] + P["i"][0]) / 2, yc + 30, "1.00 rad/s", INK)
    chip((P["i"][1] + P["bp"]) / 2 - 2, yc + 30, "t − 0.0952", SIG)
    o.append(T((P["i"][0] + P["i"][1]) / 2, yc - 30, "積分", "middle", 9.5, SIG, True))
    o.append(TX(18, yc + 74, "角速度 1 rad/s を保つ電圧 1/50 = 0.0200 V を偏差から作るので、偏差は 0.0200 ÷ 0.21 = 0.0952 rad 残る。", "start", 9.5, INK))
    o.append(TX(18, yc + 89, "積分の入力（角速度）が一定なら、出力の角度は一定の速さで増える。", "start", 9.5, INK))
    # (c) 型 1、ステップ
    y0 = y0 + 162
    o.append(W(12, y0 - 18, 688, y0 - 18, c=LIN, lw=0.8))
    o.append(TX(14, y0, "(c) 同じループで、目標値を 1 rad に変えて落ち着いたとき", "start", 11.5, INK, True))
    yc = y0 + 52
    s, P, xe = _f07_chain(18, yc, [("a", 52, "r", MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 66, "e", ALI),
                                   ("b", "K_P = 0.21", "c", LIN, PAN), ("a", 66, "v", GLD), ("b", ("50", "0.05s + 1"), "p", LIN, PAN),
                                   ("a", 66, "ω_m", INK), ("b", ("1", "s"), "i", SIG, SSOFT), ("a", 70, "θ_m", SIG),
                                   ("t", "bp", SIG), ("a", 28, None, SIG)])
    o.append(s)
    o.append(_f07_fb(P["bp"], P["s1"], yc, 52, c=SIG))
    chip(44, yc + 30, "1 rad", MUT)
    chip((P["s1"] + R + P["c"][0]) / 2, yc + 30, "0", ALI)
    chip((P["c"][1] + P["p"][0]) / 2, yc + 30, "0 V", GLD)
    chip((P["p"][1] + P["i"][0]) / 2, yc + 30, "0 rad/s", INK)
    chip((P["i"][1] + P["bp"]) / 2 - 2, yc + 30, "1 rad", SIG)
    o.append(TX(18, yc + 74, "止まった軸を保つのに電圧は要らない。積分は入力 0 のまま、ためた 1 rad を出し続けるので、偏差 0 で落ち着く。", "start", 9.5, INK))
    return SVG(700, yc + 84, o, "落ち着いたときの、ループの中の信号の値（札の数字）。(a) 型 0 では、制御量を保つのに要る操作量を、偏差に比例ゲインを掛けて作るので、その分の偏差が残る。(b) 型 1 のモータで目標値を一定の速さで回すと、角速度を保つ電圧を偏差から作るので、一定の偏差が残る。(c) 目標値が止まっていれば要る電圧は 0 で、積分が角度を保つので、偏差は 0 になる。")
F["e07_type_why"] = _f07_type_why_fig()


# =====================================================================
# 4 節: 外乱の入る場所
# =====================================================================
def _f07_dist_resp(case, place, integ, t):
    """外乱による制御量のずれ（ステップの外乱、時刻 0 から）。case: "cart" か "motor"、place: "u" か "y"。"""
    if case == "cart":
        Pn, Pd = [0.5], [0.5, 1.0]
        Cn, Cd = ([8.0, 25.0], [1.0, 0.0]) if integ else ([8.0], [1.0])
        d = -_F07_D3 if place == "u" else 0.2
    else:
        Pn, Pd = [1000.0], [1.0, 20.0, 0.0]
        Cn, Cd = ([0.21, 0.5], [1.0, 0.0]) if integ else ([0.21], [1.0])
        d = -1.0 if place == "u" else 0.5
    Gyr, Gyd, S = _f07_cl(Pn, Pd, Cn, Cd)
    G = Gyd if place == "u" else S
    return d * _f07_lsim(G[0], G[1], _f07_np.ones_like(t), t)


def _f07_dist_place_fig():
    o = []
    R = _F07_SR
    o.append(T(14, 18, "(a) 外乱が入る 2 つの場所と、外乱から制御量までの伝達関数", "start", 11.5, INK, True))
    yc = 118
    s, P, xe = _f07_chain(18, yc, [("a", 62, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 50, None, ALI),
                                   ("b", "C(s)", "c", SIG, SSOFT), ("a", 70, None, GLD), ("s", {"l": "+", "t": "+"}, "s2"),
                                   ("a", 44, None, INK), ("b", "P(s)", "p", SIG, SSOFT), ("a", 70, None, INK),
                                   ("s", {"l": "+", "t": "+"}, "s3"), ("a", 70, None, SIG), ("t", "bp", SIG), ("a", 56, None, SIG)])
    o.append(s)
    o.append(TX(20, yc - 9, "目標値 R", "start", 10, MUT, True))
    o.append(TX(xe - 4, yc - 9, "制御量 Y", "end", 10, SIG, True))
    o.append(TX((P["c"][1] + P["s2"] - R) / 2, yc + 20, "操作量 U", "middle", 10, GLD, True))
    o.append(_f07_top(P["s2"], yc, 50, "操作量に入る外乱", PUR))
    o.append(_f07_top(P["s3"], yc, 50, "制御量に入る外乱", PUR))
    o.append(_f07_fb(P["bp"], P["s1"], yc, 50, c=SIG))
    f, w = _f07_frac(P["s2"] - 70, yc - 46, "P", "1 + PC", 10.5, PUR, True)
    o.append(f)
    f, w = _f07_frac(P["s3"] + 120, yc - 46, "1", "1 + PC", 10.5, PUR, True)
    o.append(f)
    o.append(T(P["s2"] - 70, yc - 74, "例: 坂の力・負荷トルク", "middle", 9, MUT))
    o.append(T(P["s3"] + 120, yc - 74, "例: 動く歩道・継ぎ手の滑り", "middle", 9, MUT))
    # (b) 応答
    y0 = 214
    o.append(W(12, y0 - 18, 688, y0 - 18, c=LIN, lw=0.8))
    o.append(T(14, y0, "(b) ステップの外乱による制御量のずれ（時刻 0 に外乱が入る）", "start", 11.5, INK, True))
    o.append(T(220, y0 + 22, "操作量に入る外乱", "middle", 10.5, PUR, True))
    o.append(T(540, y0 + 22, "制御量に入る外乱", "middle", 10.5, PUR, True))
    specs = [("cart", "台車の速度（型 0）", 1.5, [(-0.07, 0.01), (-0.01, 0.22)], ["速度のずれ [m/s]"] * 2,
              ["坂の力 −0.513 N", "歩道の速さ +0.2 m/s"], [[-0.06, -0.04, -0.02, 0], [0, 0.1, 0.2]]),
             ("motor", "モータの位置（型 1、積分は対象の中）", 2.0, [(-5.5, 0.5), (-0.3, 0.55)], ["角度のずれ [rad]"] * 2,
              ["負荷トルク 0.01 N·m（−1 V）", "継ぎ手の滑り +0.5 rad"], [[-4, -2, 0], [0, 0.25, 0.5]])]
    yy = y0 + 34
    for case, name, tend, yrs, yls, labs, yts in specs:
        o.append(T(14, yy + 10, name, "start", 10.5, INK, True))
        t = _f07_np.linspace(0, tend, 1501)
        for j, place in enumerate(("u", "y")):
            x = 90 + j * 330
            p = Plot(x, yy + 34, 250, 84, (0, tend), yrs[j])
            o.append(p.axes(xl=None, yl=None, xt=[0, tend / 2, tend], yt=yts[j], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
            o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
            y1 = _f07_dist_resp(case, place, False, t)
            y2 = _f07_dist_resp(case, place, True, t)
            o.append(p.line(list(zip(t, y2)), c=GRN, lw=1.7, dash="5 3"))
            o.append(p.line(list(zip(t, y1)), c=ALI, lw=1.8))
            f1 = y1[-1]
            txt = "比例: %s 残る" % (_f07_g(f1, 3) if abs(f1) > 1e-6 else "0") if abs(f1) > 1e-4 else "比例: 0 に戻る"
            o.append(T(p.x + p.w, yy + 27, labs[j], "end", 9.5, PUR, True))
            ylab = f1 + (yrs[j][1] - yrs[j][0]) * (0.16 if f1 < (yrs[j][0] + yrs[j][1]) / 2 else -0.12)
            o.append(T(p.x + p.w - 2, p.Y(ylab) + 4, txt, "end", 9, ALI, True, halo=True))
            o.append(T(p.x - 34, p.y + p.h / 2, yls[j].split(" ")[0], "middle", 9, MUT, rot=-90))
        yy += 140
    o.append(T(90 + 125, yy + 2, "時間 t [s]", "middle", 9.5, MUT))
    o.append(T(420 + 125, yy + 2, "時間 t [s]", "middle", 9.5, MUT))
    o.append(LEGL(220, yy + 22, [(ALI, None, "比例だけ"), (GRN, "5 3", "制御器に積分を足す（K_I = 25 N/m・0.5 V/(rad·s)）")], 9.5))
    return SVG(700, yy + 30, o, "外乱の入る場所で、外乱から制御量までの伝達関数が変わる。(a) 操作量に入る外乱は P/(1 + PC)、制御量に入る外乱は 1/(1 + PC) を通って制御量に現れる。(b) 比例制御だけのとき（赤）、台車（型 0）ではどちらの外乱でもずれが残る。モータの位置（型 1）では、制御量に入る外乱は消えるが、操作量に入る負荷トルクのずれ 4.76 rad は残る。制御器に積分を足すと（緑の破線）、どれも 0 に戻る。")
F["e07_dist_place"] = _f07_dist_place_fig()


def _f07_dist_int_fig():
    o = []
    t = _f07_np.linspace(0, 2.5, 2501)
    t0 = 0.2
    u = _f07_np.where(t >= t0, 1.0, 0.0)
    Pn, Pd = [1000.0], [1.0, 20.0, 0.0]
    res = {}
    for integ in (False, True):
        Cn, Cd = ([0.21, 0.5], [1.0, 0.0]) if integ else ([0.21], [1.0])
        Gyr, Gyd, S = _f07_cl(Pn, Pd, Cn, Cd)
        th = -1.0 * _f07_lsim(Gyd[0], Gyd[1], u, t)
        e = -th
        ip = _f07_np.concatenate([[0.0], _f07_np.cumsum((e[1:] + e[:-1]) / 2 * _f07_np.diff(t))]) * (0.5 if integ else 0.0)
        res[integ] = (th, 0.21 * e, ip)
    o.append(T(14, 18, "(a) 角度（目標値 0 rad。0.2 s に負荷トルク 0.01 N·m がかかる）", "start", 11.5, INK, True))
    p = Plot(70, 32, 610, 120, (0, 2.5), (-5.5, 0.5))
    o.append(p.axes(xl=None, yl="角度 [rad]", xt=[0, 0.5, 1, 1.5, 2, 2.5], yt=[-5, -4, -3, -2, -1, 0], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(RECT(p.X(t0), p.y, p.X(2.5) - p.X(t0), p.h, 0, PSOFT, "none", 0))
    o.append(p.line(list(zip(t, res[False][0])), c=ALI, lw=1.9))
    o.append(p.line(list(zip(t, res[True][0])), c=GRN, lw=1.9))
    o.append(W(p.x, p.Y(-4.762), p.x + p.w, p.Y(-4.762), c=ALI, lw=1, dash="3 3"))
    o.append(T(p.X(2.45), p.Y(-4.762) + 14, "比例だけ: −1 V ÷ 0.21 V/rad = −4.76 rad で止まる", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1.3), p.Y(-1.0), "積分を足す: 0 に戻る", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(t0) + 6, p.y + 12, "0.2 s から負荷トルク", "start", 9.5, PUR, True, halo=True))
    o.append(T(14, 196, "(b) モータに加える電圧と、その内訳（積分を足したとき）", "start", 11.5, INK, True))
    q = Plot(70, 210, 610, 120, (0, 2.5), (-0.2, 1.2))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.5, 1, 1.5, 2, 2.5], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(RECT(q.X(t0), q.y, q.X(2.5) - q.X(t0), q.h, 0, PSOFT, "none", 0))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=PUR, lw=1, dash="3 3"))
    o.append(q.line(list(zip(t, res[False][1])), c=ALI, lw=1.4, dash="5 3"))
    o.append(q.line(list(zip(t, res[True][1])), c=GLD, lw=1.7))
    o.append(q.line(list(zip(t, res[True][2])), c=GRN, lw=1.9))
    o.append(q.line(list(zip(t, res[True][1] + res[True][2])), c=INK, lw=1.4))
    o.append(T(q.X(2.45), q.Y(1) - 6, "負荷を支える電圧 +1 V", "end", 9.5, PUR, True, halo=True))
    o.append(T(q.X(1.65), q.Y(0.86) + 4, "積分の分 → 1 V", "start", 9.5, GRN, True, halo=True))
    o.append(TX(q.X(1.65), q.Y(0.14) + 4, "比例の分 K_P e → 0", "start", 9.5, GLD, True, halo=True))
    o.append(LEGL(70, 380, [(INK, None, "電圧（積分あり）"), (GLD, None, "比例の分 K_P e"), (GRN, None, "積分の分"), (ALI, "5 3", "比例だけのときの電圧 = K_P e")], 9.5))
    return SVG(700, 390, o, "モータの位置で、負荷トルク（電圧に換算して −1 V の、操作量に入る外乱）を加えたとき（K_P = 0.21 V/rad、積分の係数 0.5 V/(rad·s)）。(a) 比例だけでは、負荷を支える +1 V を偏差から作るので、角度は 4.76 rad ずれたまま止まる。(b) 積分を足すと、偏差がある間に積分の分が増え、+1 V に届いたところで、偏差 0 のまま負荷を支える。".replace("K_P", "K<sub>P</sub>"))
F["e07_dist_int"] = _f07_dist_int_fig()


# =====================================================================
# 5 節: 感度関数 — ばらつく対象の応答の束
# =====================================================================
_F07_KS = [(0.25, TEA), (0.5, SIG), (0.75, GLD)]
_F07_TS = [(0.25, "2 3"), (0.5, None), (0.75, "7 3")]


def _f07_sens_bundle_fig():
    o = []
    t = _f07_np.linspace(0, 2.5, 501)
    for j, (title, KP) in enumerate((("(a) 開ループ（決めた力 u = cr = 2 N で押すだけ）", 0.0), ("(b) 閉ループ（決めた力 ＋ 比例制御 K_P = 8 N/(m/s)）", 8.0))):
        x = 62 + j * 340
        o.append(TX(x - 48, 18, title, "start", 11, INK, True))
        p = Plot(x, 32, 180, 170, (0, 2.5), (0, 1.6))
        o.append(p.axes(xl="時間 t [s]", yl="速度 y [m/s]" if j == 0 else None, xt=[0, 0.5, 1, 1.5, 2, 2.5], yt=[0, 0.5, 1, 1.5], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
        o.append(p.line([(0, 1), (2.5, 1)], c=MUT, lw=1.1, dash="4 3"))
        fins = []
        for K, c in _F07_KS:
            for T_, dash in _F07_TS:
                g = 1 + K * KP
                fin = K * (2 + KP) / g
                tc = T_ / g
                fins.append(fin)
                o.append(p.line([(a, fin * (1 - math.exp(-a / tc))) for a in t], c=c, lw=1.7 if (K, T_) != (0.5, 0.5) else 2.3, dash=dash))
        lo, hi = min(fins), max(fins)
        bx = p.x + p.w + 14
        o.append(RECT(bx, p.Y(hi), 10, p.Y(lo) - p.Y(hi), 2, soft(ALI if j == 0 else GRN), ALI if j == 0 else GRN, 1.2))
        cc = ALI if j == 0 else GRN
        o.append(T(bx + 14, p.Y(hi) + 4, _f07_n(hi, 3) + ("（+50 %）" if j == 0 else "（+7.1 %）"), "start", 9.5, cc, True))
        o.append(T(bx + 14, p.Y(lo) + 4, _f07_n(lo, 3) + ("（−50 %）" if j == 0 else "（−16.7 %）"), "start", 9.5, cc, True))
    o.append(LEGL(62, 252, [(TEA, None, "K = 0.25"), (SIG, None, "0.5（例の値）"), (GLD, None, "0.75 (m/s)/N")], 9.5, 12))
    o.append(LEGL(390, 252, [(MUT, "2 3", "T = 0.25"), (MUT, None, "0.5"), (MUT, "7 3", "0.75 s")], 9.5, 12))
    # (c) 動き始めの傾き
    y0 = 282
    o.append(W(12, y0 - 12, 688, y0 - 12, c=LIN, lw=0.8))
    o.append(T(14, y0 + 6, "(c) 動き始めの傾き（例の値の対象を 1 とした比）: 開ループも閉ループも同じく 1/3 倍〜3 倍に広がる", "start", 11, INK, True))
    p = Plot(70, y0 + 20, 560, 50, (0.3, 3.4), (0, 2), xlog=True)
    o.append(p.axes(xl=None, yl=None, xt=[0.3333, 0.5, 1, 2, 3], yt=[], xfmt=lambda v: {0.3333: "1/3"}.get(v, "%g" % v), sz=9))
    for row, (lab, yv) in enumerate((("開ループ", 1.45), ("閉ループ", 0.55))):
        o.append(T(p.x - 8, p.Y(yv) + 4, lab, "end", 9.5, ALI if row == 0 else GRN, True))
        for K, c in _F07_KS:
            for T_, dash in _F07_TS:
                r = (K / T_) / 1.0
                o.append(CIRC(p.X(r), p.Y(yv), 4.2, c=c, lw=1.6, fill=SCR))
    o.append(T(p.x + p.w, p.y + p.h + 30, "傾き ∝ K/T（動き始めは、測った結果が戻る前なので、フィードバックで縮まない）", "end", 9.5, MUT))
    return SVG(700, y0 + 110, o, "定常ゲイン K と時定数 T が例の値の 0.5〜1.5 倍にばらつく 9 通りの台車（目標値 1 m/s のステップ）。(a) 開ループでは、落ち着く速度が K に比例して ±50 % ばらつく。(b) 比例制御を足すと、落ち着く速度は 0.833〜1.071 m/s に収まる。(c) ただし、動き始めの傾きのばらつきは、開ループと同じ割合のまま縮まない。")
F["e07_sens_bundle"] = _f07_sens_bundle_fig()


def _f07_sens_curve_fig():
    o = []
    o.append(T(14, 18, "(a) 対象の定常ゲインの変化と、落ち着く速度の変化", "start", 11, INK, True))
    p = Plot(70, 34, 260, 200, (-50, 50), (-50, 50))
    o.append(p.axes(xl="定常ゲインの変化の割合 δ [%]", yl="落ち着く速度の変化 [%]", xt=[-50, -25, 0, 25, 50], yt=[-50, -25, 0, 25, 50], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
    curves = [(0.0, MUT, "開ループ"), (2.0, TEA, "K_P = 2"), (8.0, SIG, "8"), (20.0, GLD, "20")]
    ds = _f07_np.linspace(-0.5, 0.5, 101)
    t = _f07_np.linspace(0, 8, 2001)
    for KP, c, lab in curves:
        o.append(p.line([(d * 100, d / (1 + (1 + d) * 0.5 * KP) * 100) for d in ds], c=c, lw=1.9))
        for d in (-0.5, -0.25, 0.25, 0.5):
            K1 = 0.5 * (1 + d)
            yv = _f07_lsim([K1 * (2 + KP)], [0.5, 1 + K1 * KP], _f07_np.ones_like(t), t)
            ch = (yv[-1] - 1.0) * 100
            o.append(CIRC(p.X(d * 100), p.Y(ch), 3.2, c=c, lw=1.5, fill=SCR))
    o.append(T(p.X(-47), p.Y(46), "原点での傾き = S(0)", "start", 9.5, INK, True, halo=True))
    for i, (lab, c) in enumerate((("開ループ: 1", MUT), ("K_P = 2: 0.5", TEA), ("K_P = 8: 0.2", SIG), ("K_P = 20: 0.091", GLD))):
        yy = p.Y(46) + 16 + i * 15
        o.append(W(p.X(-47), yy - 4, p.X(-47) + 18, yy - 4, c=c, lw=2.2))
        o.append(TX(p.X(-47) + 24, yy, lab, "start", 9.5, c, True, halo=True))
    o.append(T(p.X(48), p.Y(-46), "線: δS'(0)、点: 数値計算", "end", 9, MUT, False, halo=True))
    # (b) 型 1 のモータの位置
    o.append(TX(380, 18, "(b) 型 1（モータの位置、K_P = 0.21 V/rad）", "start", 11, INK, True))
    q = Plot(420, 34, 260, 200, (0, 0.6), (0, 1.3))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(q.line([(0, 1), (0.6, 1)], c=MUT, lw=1.1, dash="4 3"))
    t = _f07_np.linspace(0, 0.6, 601)
    for K, c in ((25.0, TEA), (50.0, SIG), (75.0, GLD)):
        for T_, dash in ((0.025, "2 3"), (0.05, None), (0.075, "7 3")):
            yv = _f07_lsim([K * 0.21], [T_, 1.0, K * 0.21], _f07_np.ones_like(t), t)
            o.append(q.line(list(zip(t, yv)), c=c, lw=1.6 if (K, T_) != (50.0, 0.05) else 2.2, dash=dash))
    o.append(T(q.X(0.59), q.Y(0.36), "どれも 1 rad に落ち着く（S(0) = 0）", "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(0.59), q.Y(0.22), "行き過ぎ量は 0〜19.6 % に変わる", "end", 9.5, MUT, False, halo=True))
    o.append(T(380, 280, "(b) の線:", "start", 9.5, MUT))
    o.append(LEGL(430, 280, [(TEA, None, "K × 0.5"), (SIG, None, "× 1"), (GLD, None, "× 1.5")], 9.5, 10))
    o.append(LEGL(430, 296, [(MUT, "2 3", "T × 0.5"), (MUT, None, "× 1"), (MUT, "7 3", "× 1.5")], 9.5, 10))
    return SVG(700, 306, o, "対象の変化は、感度関数の倍率で閉ループに伝わる。(a) 台車の速度で、対象の定常ゲインを δ だけ変えたときの、落ち着く速度の変化。線は 5 節の式 δS'(0)、点は数値計算の値で、一致する。原点での傾きが S(0) = 1/(1 + KK<sub>P</sub>) で、比例ゲインを上げるほど寝る。(b) 型 1 では S(0) = 0 なので、定常ゲインと時定数が ±50 % 変わっても、落ち着く角度は変わらない（動き方は変わる）。")
F["e07_sens_curve"] = _f07_sens_curve_fig()


# =====================================================================
# 6 節: S + G_yr = 1
# =====================================================================
def _f07_comp_fig():
    o = []
    t = _f07_np.linspace(0, 0.6, 601)
    o.append(T(14, 18, "(a) 制御量に入る外乱（ステップ 1）と、観測ノイズ（ステップ 1）による制御量のずれ（台車の速度）", "start", 11, INK, True))
    p = Plot(70, 34, 380, 190, (0, 0.6), (0, 1.05))
    o.append(p.axes(xl="時間 t [s]", yl="制御量のずれの大きさ", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 0.25, 0.5, 0.75, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    for KP, c in ((2.0, TEA), (8.0, SIG), (30.0, GLD)):
        g = 1 + 0.5 * KP
        tc = 0.5 / g
        yd = [1 / g + (1 - 1 / g) * math.exp(-a / tc) for a in t]
        yn = [(1 - 1 / g) * (1 - math.exp(-a / tc)) for a in t]
        o.append(p.line(list(zip(t, yd)), c=c, lw=2))
        o.append(p.line(list(zip(t, yn)), c=c, lw=2, dash="6 3"))
    o.append(LEGL(70, 270, [(TEA, None, "K_P = 2 N/(m/s)"), (SIG, None, "8"), (GLD, None, "30")], 9.5, 12))
    o.append(LEGL(70, 288, [(INK, None, "外乱が残る分（S(s)/s の応答）"), (INK, "6 3", "ノイズが出る分（G_{yr}(s)/s の応答）")], 9.5, 14))
    # (b) 積み上げ
    o.append(TX(486, 52, "(b) K_P = 8 の 2 つの和は 1", "start", 11, INK, True))
    q = Plot(510, 66, 170, 158, (0, 0.6), (0, 1.05))
    o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 0.2, 0.4, 0.6], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    g = 5.0
    tc = 0.1
    yd = [(a, 1 / g + (1 - 1 / g) * math.exp(-a / tc)) for a in t]
    top = [(q.X(a), q.Y(1)) for a in t]
    mid = [(q.X(a), q.Y(v)) for a, v in yd]
    bot = [(q.X(a), q.Y(0)) for a in t]
    o.append(PL(bot + mid[::-1], c="none", lw=0, fill=PSOFT))
    o.append(PL(mid + top[::-1], c="none", lw=0, fill=TSOFT))
    o.append(PL(mid, c=SIG, lw=1.8))
    o.append(W(q.X(0), q.Y(1), q.X(0.6), q.Y(1), c=INK, lw=1.4))
    o.append(T(q.X(0.35), q.Y(0.1), "外乱が残る分 S", "middle", 9.5, PUR, True, halo=True))
    o.append(TX(q.X(0.35), q.Y(0.6), "ノイズが出る分 G_{yr}", "middle", 9.5, TEA, True, halo=True))
    return SVG(700, 298, o, "台車の速度の比例制御で、制御量に入るステップの外乱と、ステップの観測ノイズ（センサの読みが一定の値だけずれる）を、別々に加えたときの制御量のずれ。(a) 比例ゲインを上げるほど、外乱は速く小さく抑えられるが、同じ速さで、ノイズが制御量に現れる。(b) 外乱が残る分とノイズが出る分を積むと、どの時刻でも 1 になる（S + G<sub>yr</sub> = 1）。")
F["e07_comp"] = _f07_comp_fig()


def _f07_noise_sd(Kp, sig=0.02, m=1.0, h=1e-3, nh=10, c=2.0):
    """1 章 4 節の観測ノイズ（0.01 s ごとに変わる、標準偏差 0.02 m/s）による速度と力の揺れの標準偏差（1 章の図と同じ式）。"""
    lam = (c + Kp) / m
    a = math.exp(-lam * h)
    A = a ** nh
    g = Kp / (c + Kp)
    Vk = (1 - A) * g * g * sig * sig / (1 + A)
    M1 = sum(a ** j for j in range(nh)) / nh
    M2 = sum(a ** (2 * j) for j in range(nh)) / nh
    Vy = Vk * M2 + g * g * sig * sig * (1 - 2 * M1 + M2)
    Vu = Kp * Kp * (Vy + sig * sig - 2 * (1 - M1) * g * sig * sig)
    return math.sqrt(max(Vu, 0)), math.sqrt(max(Vy, 0))


def _f07_tradeoff_fig():
    o = []
    o.append(T(14, 18, "(a) 比例ゲインを変える（1 章 4 節の台車）", "start", 11, INK, True))
    ks = _f07_np.linspace(0, 50, 201)
    p = Plot(70, 34, 250, 90, (0, 50), (0, 0.3))
    o.append(p.axes(xl=None, yl=None, xt=[0, 10, 20, 30, 40, 50], yt=[0, 0.1, 0.2, 0.3], xfmt=lambda v: "", yfmt=_f07_fmt, sz=9))
    o.append(p.clip([(k, _F07_D3 / (2 + k)) for k in ks], c=PUR, lw=2))
    o.append(T(p.x + 60, p.y + 12, "坂 3° による速度のずれ [m/s]", "start", 9.5, PUR, True, halo=True))
    for k in (8, 30):
        v = _F07_D3 / (2 + k)
        o.append(D(p.X(k), p.Y(v), PUR, 3.4))
        o.append(T(p.X(k) + 5, p.Y(v) - 6, _f07_n(v, 3), "start", 9, PUR, True, halo=True))
    q = Plot(70, 140, 250, 90, (0, 50), (0, 0.01))
    o.append(q.axes(xl="比例ゲイン K_P [N/(m/s)]", yl=None, xt=[0, 10, 20, 30, 40, 50], yt=[0, 0.005, 0.01], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    o.append(q.line([(k, _f07_noise_sd(k)[1]) for k in ks], c=TEA, lw=2))
    o.append(T(q.x + 6, q.y + 12, "ノイズによる速度の揺れ [m/s]", "start", 9.5, TEA, True, halo=True))
    for k in (8, 30):
        v = _f07_noise_sd(k)[1]
        o.append(D(q.X(k), q.Y(v), TEA, 3.4))
        o.append(T(q.X(k) + 5, q.Y(v) + 14, _f07_n(v, 4), "start", 9, TEA, True, halo=True))
    o.append(T(q.x + q.w, q.y + q.h + 48, "揺れは標準偏差（1 章 4 節と同じ値）", "end", 9, MUT))
    # (b) 正弦波
    o.append(TX(366, 18, "(b) 正弦波を入れる（K_P = 8 N/(m/s)）", "start", 11, INK, True))
    o.append(T(366, 36, "入れた正弦波の振幅に対する、制御量の揺れの振幅の比", "start", 9.5, MUT))
    Pn, Pd = [0.5], [0.5, 1.0]
    Gyr, Gyd, S = _f07_cl(Pn, Pd, [8.0], [1.0])
    specs = [(1.0, "1 rad/s"), (50.0, "50 rad/s")]
    for i, (w, lab) in enumerate(specs):
        per = 2 * math.pi / w
        t = _f07_np.linspace(0, 12 * per, 6001)
        u = _f07_np.sin(w * t)
        yd = _f07_lsim(S[0], S[1], u, t)
        yn = -_f07_lsim(Gyr[0], Gyr[1], u, t)
        sel = t >= 10 * per
        ts = (t[sel] - 10 * per) / per
        for j, (yy, c, name) in enumerate(((yd, PUR, "外乱"), (yn, TEA, "ノイズ"))):
            x = 404 + j * 156
            pp = Plot(x, 66 + i * 98, 120, 56, (0, 2), (-1.15, 1.15))
            o.append(pp.axes(xl=None, yl=None, xt=[0, 1, 2], yt=[-1, 0, 1], xfmt=(lambda v: "%g" % v) if i == 1 else (lambda v: ""), yfmt=_f07_fmt, sz=9))
            o.append(pp.line(list(zip(ts, u[sel])), c=c, lw=1.1, dash="4 2"))
            o.append(pp.line(list(zip(ts, yy[sel])), c=SIG, lw=1.9))
            amp = (yy[sel].max() - yy[sel].min()) / 2
            o.append(T(x + 60, pp.y - 5, "%s %s: %.2f 倍" % (name, lab, amp), "middle", 9.5, c, True))
    o.append(T(554, 270, "横軸: 周期を単位にした時間（細い破線が入れた正弦波）", "middle", 9, MUT))
    return SVG(700, 280, o, "外乱を抑えることと、ノイズを通さないことの釣り合い。(a) 比例ゲインを上げると、坂による速度のずれは減るが、観測ノイズによる速度の揺れは増える（1 章 4 節の数値）。(b) 同じ角周波数の正弦波で比べると、遅い 1 rad/s では外乱は 0.22 倍に縮み、ノイズは 0.80 倍が制御量に出る。速い 50 rad/s では外乱はほとんど縮まないが、ノイズは 0.16 倍しか出ない。")
F["e07_tradeoff"] = _f07_tradeoff_fig()
