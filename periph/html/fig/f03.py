# -*- coding: utf-8 -*-
# 03 章 電池を知る の図

# ---- 電池の模型（代表的な形と例の値。w03.js と同じ値） ----
# 1 セルあたり: 公称容量 [mAh]、休んでいるときの電圧 E(x) の点（x は公称容量に対する放電の割合）、
# 25 °C の内部抵抗 R0 + R1 の点 [Ω]、10 °C 下がるごとの倍率、時定数 [s]、1 年に減る割合（20 °C）、メーカの終止電圧
_F03_B = {
    "alk": dict(Qn=2000.0, c=GLD,
                E=[(0, 1.58), (0.03, 1.48), (0.2, 1.36), (0.4, 1.27), (0.6, 1.19), (0.75, 1.12), (0.85, 1.06), (0.93, 1.00), (0.97, 0.95), (1.0, 0.90)],
                R=[(0, 0.15), (0.3, 0.19), (0.5, 0.26), (0.7, 0.37), (0.85, 0.48), (1.0, 0.60)], k10=1.5, tau=0.010, sd=0.02, vend=0.9),
    "cr": dict(Qn=220.0, c=SIG,
               E=[(0, 3.20), (0.02, 3.05), (0.1, 3.00), (0.3, 2.96), (0.5, 2.92), (0.7, 2.87), (0.8, 2.82), (0.88, 2.74), (0.93, 2.60), (0.97, 2.40), (1.0, 2.00)],
               R=[(0, 15.0), (0.5, 17.0), (0.7, 20.0), (0.8, 25.0), (0.9, 40.0), (0.95, 60.0), (1.0, 120.0)], k10=1.4, tau=0.005, sd=0.01, vend=2.0),
    "soc": dict(Qn=2400.0, c=PUR,
                E=[(0, 3.66), (0.02, 3.62), (0.3, 3.60), (0.6, 3.58), (0.85, 3.54), (0.92, 3.48), (0.96, 3.35), (0.985, 3.00), (1.0, 2.00)],
                R=[(0, 4.0), (0.5, 4.5), (0.8, 6.0), (0.9, 9.0), (0.96, 15.0), (1.0, 40.0)], k10=1.3, tau=0.010, sd=0.01, vend=2.0),
    "nimh": dict(Qn=2000.0, c=TEA,
                 E=[(0, 1.40), (0.03, 1.30), (0.15, 1.26), (0.5, 1.22), (0.75, 1.19), (0.88, 1.15), (0.95, 1.10), (0.98, 1.05), (1.0, 1.00)],
                 R=[(0, 0.04), (0.5, 0.045), (0.8, 0.055), (0.9, 0.07), (1.0, 0.12)], k10=1.4, tau=0.010, sd=0.20, vend=1.0),
    "li": dict(Qn=1000.0, c=GRN,
               E=[(0, 4.18), (0.05, 4.08), (0.15, 3.98), (0.3, 3.87), (0.5, 3.76), (0.65, 3.70), (0.8, 3.60), (0.88, 3.50), (0.93, 3.38), (0.97, 3.20), (1.0, 3.00)],
               R=[(0, 0.12), (0.5, 0.12), (0.8, 0.14), (0.9, 0.17), (1.0, 0.25)], k10=1.4, tau=0.010, sd=0.24, vend=3.0),
}
_F03_R0F = 0.55           # 内部抵抗のうち、すぐ現れる部分 R0 の割合

def _f03_ip(pts, x):
    if x <= pts[0][0]:
        return pts[0][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return pts[-1][1]

def _f03_E(t, x):
    return _f03_ip(_F03_B[t]["E"], x)

def _f03_R(t, x, T=25.0):
    """R0 + R1（流し続けたときの内部抵抗）[Ω]。"""
    return _f03_ip(_F03_B[t]["R"], x) * _F03_B[t]["k10"] ** ((25.0 - T) / 10.0)

def _f03_reff(t, x, T, tp):
    """長さ tp [s] のパルスに対する実効の内部抵抗 [Ω]。"""
    r = _f03_R(t, x, T)
    return r * (_F03_R0F + (1 - _F03_R0F) * (1 - math.exp(-tp / _F03_B[t]["tau"])))

def _f03_cross(f, lo=0.0, hi=1.0):
    """f(x)（x とともに減る）が 0 になる x。f(0) <= 0 なら 0、f(1) > 0 なら 1。"""
    if f(lo) <= 0:
        return lo
    if f(hi) > 0:
        return hi
    for _ in range(60):
        m = (lo + hi) / 2
        if f(m) > 0:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2

def _f03_use(t, vend, I=0.0, T=25.0):
    """電流 I [A] を流し続けて、1 本の電圧が vend に下がるまでに取り出せる割合。"""
    return _f03_cross(lambda x: _f03_E(t, x) - I * _f03_R(t, x, T) - vend)

def _f03_usep(t, floor, Ipk, tp, T=25.0):
    """電流 Ipk [A]・長さ tp [s] のパルスの底が floor を割らない範囲の割合。"""
    return _f03_cross(lambda x: _f03_E(t, x) - Ipk * _f03_reff(t, x, T, tp) - floor)

def _f03_sub(x, y, base, sub, a="start", sz=12, c=INK, b=False):
    """添字付きの記号（例 R と 0 で R_0）。"""
    w = tw(base, sz) + tw(sub, sz * 0.72)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    return ('<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-style="italic" font-weight="%s">%s'
            '<tspan dy="3" font-size="%g" font-style="normal">%s</tspan></text>' % (x0, y, sz, c, "700" if b else "400", E(base), sz * 0.72, E(sub)))

def _f03_pct(v):
    return ("%.1f" % (v * 100)).rstrip("0").rstrip(".") + " %"

# ---- 回路の記号 ----
def _f03_resh(x1, x2, y, c=INK, lw=1.5, h=6, n=6):
    """横向きの抵抗（ジグザグ）。両端は線でつなぐ。"""
    seg = (x2 - x1) * 0.6
    a = x1 + (x2 - x1 - seg) / 2
    pts = [(x1, y), (a, y)]
    for i in range(n):
        pts.append((a + seg * (i + 0.5) / n, y + (h if i % 2 == 0 else -h)))
    pts += [(a + seg, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f03_capv(x, y1, y2, c=INK, lw=1.5, w=20):
    """縦向きのコンデンサ（y1 から y2 の間に 2 枚の極板）。"""
    m = (y1 + y2) / 2
    return (W(x, y1, x, m - 4, c=c, lw=lw) + W(x - w / 2, m - 4, x + w / 2, m - 4, c=c, lw=2.2)
            + W(x - w / 2, m + 4, x + w / 2, m + 4, c=c, lw=2.2) + W(x, m + 4, x, y2, c=c, lw=lw))

def _f03_src(x, y, r=17, c=GLD):
    """電圧の源（丸に + と −。上が +）。"""
    return (CIRC(x, y, r, c=c, lw=1.6, fill=PAN) + T(x, y - 4, "+", "middle", 11, c, True) + T(x, y + 13, "−", "middle", 12, c, True))

# ---- 1 節: 電池の中 ----
def _f03_cellpanel(o, x0, charge):
    y0 = 40
    o.append(T(x0 + 160, 18, "(b) 充電（二次電池だけ）" if charge else "(a) 放電（一次電池・二次電池）", "middle", 11.5, INK, True))
    # 外の部品
    bx = x0 + 110
    if charge:
        o.append(BOX(bx, y0, 100, 34, "充電器", None, GLD, GOSOFT, GLD, sz=11.5))
    else:
        o.append(BOX(bx, y0, 100, 34, "負荷", None, PUR, PSOFT, PUR, sz=11.5))
    # セル
    cy, ch = 116, 112
    xl, xr = x0 + 30, x0 + 290
    o.append(RECT(xl - 8, cy, xr - xl + 16, ch, 8, TSOFT, GLD, 1.8))
    o.append(RECT(xl, cy + 8, 46, ch - 16, 4, MSOFT, MUT, 1.2))
    o.append(RECT(xr - 46, cy + 8, 46, ch - 16, 4, MSOFT, MUT, 1.2))
    o.append(T(xl + 23, cy + ch / 2 + 4, "負極", "middle", 11, INK, True))
    o.append(T(xr - 23, cy + ch / 2 + 4, "正極", "middle", 11, INK, True))
    xm = (xl + xr) / 2
    o.append(W(xm, cy + 4, xm, cy + ch - 4, c=MUT, lw=1.4, dash="4 3"))
    o.append(T(xm, cy + ch + 15, "セパレータ（イオンだけ通す）", "middle", 9.5, MUT))
    o.append(T(xl + 54, cy + 21, "電解質", "start", 10, TEA, True))
    # 端子と線
    o.append(RECT(xl + 15, cy - 10, 16, 10, 2, GLD, "none", 0) + RECT(xr - 31, cy - 10, 16, 10, 2, GLD, "none", 0))
    o.append(T(xl + 23, cy - 14, "−", "middle", 13, GLD, True))
    o.append(T(xr - 23, cy - 14, "+", "middle", 13, GLD, True))
    yw = y0 + 17
    o.append(W(xl + 23, cy - 20, xl + 23, yw, bx, yw, c=GLD, lw=1.6))
    o.append(W(xr - 23, cy - 20, xr - 23, yw, bx + 100, yw, c=GLD, lw=1.6))
    # 電子の流れ（外）。放電は右向き（負極 → 負荷 → 正極）、充電は左向き
    la, lb = (xl + 36, bx - 10), (bx + 110, xr - 34)
    for a, b in (la, lb):
        if charge:
            o.append(ARR(b, yw, a, yw, c=GLD, lw=2.4, head=8))
        else:
            o.append(ARR(a, yw, b, yw, c=GLD, lw=2.4, head=8))
        o.append(T((a + b) / 2, yw - 7, "電子", "middle", 10, GLD, True))
    # イオン（中）
    ya, yb = cy + 46, cy + 78
    if charge:
        o.append(ARR(xr - 52, ya, xl + 52, ya, c=TEA, lw=1.8))
        o.append(ARR(xl + 52, yb, xr - 52, yb, c=TEA, lw=1.8))
        o.append(T(xm, ya - 6, "正のイオン（負極へ）", "middle", 9.5, TEA, True, halo=True))
        o.append(T(xm, yb - 6, "負のイオン（正極へ）", "middle", 9.5, TEA, True, halo=True))
    else:
        o.append(ARR(xl + 52, ya, xr - 52, ya, c=TEA, lw=1.8))
        o.append(ARR(xr - 52, yb, xl + 52, yb, c=TEA, lw=1.8))
        o.append(T(xm, ya - 6, "正のイオン（正極へ）", "middle", 9.5, TEA, True, halo=True))
        o.append(T(xm, yb - 6, "負のイオン（負極へ）", "middle", 9.5, TEA, True, halo=True))
    yt = cy + ch + 36
    if charge:
        o.append(T(x0 + 160, yt, "外から電子を負極へ押し込み、反応を逆に進める", "middle", 10, INK))
        o.append(T(x0 + 160, yt + 16, "一次電池にこれをすると、ガス・発熱・液漏れ・破裂", "middle", 10, ALI, True))
    else:
        o.append(T(x0 + 160, yt, "負極の材料が電子を放し、正極の材料が受け取る", "middle", 10, INK))
        o.append(T(x0 + 160, yt + 16, "電流の向きは電子の逆（正極 → 負荷 → 負極）", "middle", 10, MUT))

def _f03_cell():
    o = []
    _f03_cellpanel(o, 10, False)
    _f03_cellpanel(o, 360, True)
    o.append(W(350, 30, 350, 300, c=LIN, lw=1))
    return SVG(700, 312, o, "電池（セル）の中。(a) 放電では、負極で放された電子が外の負荷を通って正極へ流れ、中では電解質の中をイオンが動いて電荷のつり合いを保つ。(b) 二次電池は、外から逆向きに電流を流し込むと反応が逆に進み、材料が元に戻る。どのイオンが動くかは、電池の種類で違う。")
F["e03_cell"] = _f03_cell()

# ---- 1 節: 種類の比較 ----
_F03_TYPES = [
    # 名前, 2 行目, 一次/二次, 色, 内部抵抗 (lo, hi, 文字), 温度 放電 (lo, hi) と充電, 1 年に減る割合 [%] (lo, hi, 文字)
    ("アルカリ乾電池", "単 3 形", "一次", GLD, (0.1, 0.3, "0.1〜0.3 Ω"), (-20, 50), None, (2, 3, "2〜3 %")),
    ("コイン形リチウム電池", "CR2032", "一次", SIG, (10, 40, "10〜数十 Ω"), (-20, 60), None, (0.8, 1.2, "1 % 程度")),
    ("塩化チオニルリチウム電池", "単 3 形の大きさ", "一次", PUR, (2, 20, "数 Ω〜（構造による）"), (-55, 85), None, (0.5, 1, "1 % 以下")),
    ("ニッケル水素電池", "単 3 形", "二次", TEA, (0.02, 0.05, "数十 mΩ"), (-20, 50), (0, 40), (15, 30, "15〜30 %")),
    ("リチウムイオン電池", "1 セル", "二次", GRN, (0.03, 0.15, "数十〜百数十 mΩ"), (-20, 60), (0, 45), (24, 36, "24〜36 %")),
]

def _f03_types():
    o = []
    y0, rh = 62, 48
    n = len(_F03_TYPES)
    pa = Plot(222, y0, 150, n * rh, (0.01, 100), (0, n), xlog=True)
    pb = Plot(392, y0, 150, n * rh, (-60, 90), (0, n))
    pc = Plot(560, y0, 130, n * rh, (0.3, 100), (0, n), xlog=True)
    heads = [(pa, "内部抵抗（新しいとき・室温）"), (pb, "使える温度の範囲"), (pc, "1 年に減る割合（5 節）")]
    for p, h in heads:
        o.append(T(p.x + p.w / 2, 22, h, "middle", 10.5, INK, True))
    o.append(T(pc.x + pc.w / 2, 38, "置いておくだけで", "middle", 9.5, MUT))
    o.append(T(pa.x + pa.w / 2, 38, "対数目盛", "middle", 9.5, MUT))
    o.append(T(pb.x + pb.w / 2, 38, "濃い帯: 放電、細い帯: 充電", "middle", 9.5, MUT))
    yb = y0 + n * rh
    for p, ticks, f in ((pa, [0.01, 0.1, 1, 10, 100], lambda v: ("%g" % v)), (pb, [-50, 0, 50], lambda v: "%d" % v),
                        (pc, [1, 10, 100], lambda v: "%g" % v)):
        for v in ticks:
            xx = p.X(v)
            o.append(W(xx, y0 - 6, xx, yb, c=GRD, lw=1))
            o.append(T(xx, yb + 14, f(v), "middle", 9.5, MUT))
        o.append(W(p.x, yb, p.x + p.w, yb, c=MUT, lw=1.1))
    o.append(T(pa.x + pa.w / 2, yb + 29, "Ω", "middle", 9.5, MUT))
    o.append(T(pb.x + pb.w / 2, yb + 29, "°C", "middle", 9.5, MUT))
    o.append(T(pc.x + pc.w / 2, yb + 29, "%", "middle", 9.5, MUT))
    for i, (nm, sub, kind, c, rr, td, tc, sd) in enumerate(_F03_TYPES):
        y = y0 + i * rh
        o.append(T(12, y + 18, nm, "start", 11, INK, True))
        o.append(T(12, y + 34, sub, "start", 9.5, MUT))
        s, w = CHIP(196, y + 18, kind, c=GLD if kind == "一次" else GRN, sz=9.5, a="end")
        o.append(s)
        # 内部抵抗
        o.append(RECT(pa.X(rr[0]), y + 8, max(pa.X(rr[1]) - pa.X(rr[0]), 4), 13, 3, soft(c), c, 1.3))
        o.append(T(pa.X(rr[1]) + 5 if pa.X(rr[1]) < pa.x + 75 else pa.X(rr[0]) - 5, y + 18, rr[2],
                   "start" if pa.X(rr[1]) < pa.x + 75 else "end", 9, c, True, halo=True))
        # 温度
        o.append(RECT(pb.X(td[0]), y + 8, pb.X(td[1]) - pb.X(td[0]), 13, 3, soft(c), c, 1.3))
        o.append(T((pb.X(td[0]) + pb.X(td[1])) / 2, y + 18, "%d〜%d" % td, "middle", 9, c, True, halo=True))
        if tc:
            o.append(RECT(pb.X(tc[0]), y + 26, pb.X(tc[1]) - pb.X(tc[0]), 5, 2, c, "none", 0))
            o.append(T(pb.X(tc[1]) + 4, y + 33, "充電 %d〜%d" % tc, "start", 9, c, False, halo=True))
        # 自己放電
        o.append(RECT(pc.X(sd[0]), y + 8, max(pc.X(sd[1]) - pc.X(sd[0]), 4), 13, 3, soft(c), c, 1.3))
        big = sd[0] > 10
        o.append(T(pc.X(sd[0]) - 4 if big else pc.X(sd[1]) + 5, y + 18, sd[2], "end" if big else "start", 9, c, True, halo=True))
    o.append(T(12, yb + 50, "値は代表値（製品・大きさ・温度で違う。仕様書で確かめる）。ニッケル水素電池の自己放電は減りにくくした製品の値で、", "start", 9.5, MUT))
    o.append(T(12, yb + 65, "標準の製品はこれよりずっと大きい。リチウムイオン電池は 1 か月に 2〜3 % を 1 年に直した。", "start", 9.5, MUT))
    return SVG(700, yb + 75, o, "5 種類の電池の内部抵抗・使える温度の範囲・置いておくだけで 1 年に減る割合（代表値）。内部抵抗は 3 桁、自己放電は 2 桁違う。二次電池は、充電してよい温度の範囲が放電より狭い。")
F["e03_types"] = _f03_types()

# ---- 2 節: 放電曲線 ----
def _f03_curves():
    o = []
    pa = Plot(64, 34, 250, 200, (0, 100), (0.8, 1.7))
    pb = Plot(424, 34, 250, 200, (0, 100), (1.8, 4.4))
    o.append(T(pa.x + pa.w / 2, 20, "(a) 1 本 1.2〜1.5 V の電池", "middle", 11, INK, True))
    o.append(T(pb.x + pb.w / 2, 20, "(b) 1 本 3〜4 V の電池", "middle", 11, INK, True))
    xf = lambda v: "%d" % v
    o.append(pa.axes(xl="取り出した電荷（公称容量の %）", yl="1 本の端子電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[0.8, 1.0, 1.2, 1.4, 1.6], xfmt=xf, yfmt=lambda v: "%.1f" % v))
    o.append(pb.axes(xl="取り出した電荷（公称容量の %）", yl="1 本の端子電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[2.0, 2.5, 3.0, 3.5, 4.0], xfmt=xf, yfmt=lambda v: "%.1f" % v))
    def curve(p, t):
        pts = [(x * 100, _f03_E(t, x)) for x in [k / 400.0 for k in range(401)]]
        return p.line(pts, c=_F03_B[t]["c"], lw=2.4)
    o.append(curve(pa, "alk"))
    o.append(curve(pa, "nimh"))
    o.append(T(pa.X(40), pa.Y(1.33), "アルカリ乾電池（傾く）", "start", 10, GLD, True, halo=True))
    o.append(T(pa.X(8), pa.Y(1.17), "ニッケル水素電池（平ら）", "start", 10, TEA, True, halo=True))
    for t in ("cr", "soc", "li"):
        o.append(curve(pb, t))
    o.append(T(pb.X(30), pb.Y(4.0), "リチウムイオン電池（なだらかに傾く）", "start", 10, GRN, True, halo=True))
    o.append(T(pb.X(4), pb.Y(3.42), "塩化チオニルリチウム電池（平ら）", "start", 10, PUR, True, halo=True))
    o.append(T(pb.X(4), pb.Y(2.80), "コイン形 CR2032（平ら）", "start", 10, SIG, True, halo=True))
    o.append(T(12, 290, "小さな電流・25 °C の代表的な形（模式図）。終わりの電圧は、メーカの決めた放電をやめる電圧（2 節）に合わせた。", "start", 9.5, MUT))
    return SVG(700, 300, o, "5 種類の電池の放電曲線（代表的な形）。コイン形・塩化チオニルリチウム電池・ニッケル水素電池は、容量の大部分の間ほぼ一定の電圧で、終わり近くで急に下がる。アルカリ乾電池は下がり続け、リチウムイオン電池もなだらかに下がる。")
F["e03_curves"] = _f03_curves()

# ---- 2 節: 終止電圧と使える電荷 ----
def _f03_chain(o, x, y, cells, ldo, need, c):
    """電池 → (LDO) → 部品 の小さな図。"""
    o.append(BOX(x, y, 86, 24, cells, None, GLD, GOSOFT, GLD, sz=10))
    xx = x + 86
    if ldo:
        o.append(ARR(xx + 2, y + 12, xx + 18, y + 12, c=MUT, lw=1.3, head=5))
        o.append(BOX(xx + 20, y, 96, 24, "LDO（0.2 V 下がる）", None, MUT, PAN, INK, sz=9))
        xx += 116
    o.append(ARR(xx + 2, y + 12, xx + 18, y + 12, c=MUT, lw=1.3, head=5))
    o.append(BOX(xx + 20, y, 110, 24, need, None, SIG, SSOFT, SIG, sz=9.5))
    return xx + 130

def _f03_endv():
    o = []
    cases = [("2 本", False, "マイコン（1.8 V〜）", 0.9, "終止 1.8 V（1 本 0.90 V）", SIG),
             ("2 本", False, "マイコン（2.2 V〜）", 1.1, "終止 2.2 V（1 本 1.10 V）", PUR),
             ("3 本", True, "3.3 V で動く部品", 3.5 / 3, "終止 3.5 V（1 本 1.17 V）", ALI)]
    o.append(T(12, 18, "アルカリ乾電池のつなぎ方と終止電圧", "start", 10.5, INK, True))
    for i, (cells, ldo, need, v, lab, c) in enumerate(cases):
        y = 28 + i * 30
        xe = _f03_chain(o, 12, y, "アルカリ " + cells, ldo, need, c)
        o.append(T(470, y + 16, "⇒ " + lab, "start", 10, c, True))
    pa = Plot(66, 150, 270, 170, (0, 100), (0.8, 1.6))
    pb = Plot(420, 150, 270, 170, (0, 100), (1.9, 3.3))
    o.append(T(pa.x + pa.w / 2, 136, "(a) 傾いた曲線（アルカリ乾電池 1 本）", "middle", 11, INK, True))
    o.append(T(pb.x + pb.w / 2, 136, "(b) 平らな曲線（CR2032）", "middle", 11, INK, True))
    xf = lambda v: "%d" % v
    o.append(pa.axes(xl="取り出した電荷（公称容量の %）", yl="1 本の端子電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[0.8, 1.0, 1.2, 1.4, 1.6], xfmt=xf, yfmt=lambda v: "%.1f" % v))
    o.append(pb.axes(xl="取り出した電荷（公称容量の %）", yl="端子電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[2.0, 2.5, 3.0], xfmt=xf, yfmt=lambda v: "%.1f" % v))
    def panel(p, t, ends, vfmt):
        o.append(p.line([(x * 100, _f03_E(t, x)) for x in [k / 400.0 for k in range(401)]], c=_F03_B[t]["c"], lw=2.4))
        res = []
        for v, c in ends:
            u = _f03_use(t, v)
            o.append(p.line([(0, v), (100, v)], c=c, lw=1.2, dash="5 3"))
            o.append(W(p.X(u * 100), p.Y(v), p.X(u * 100), p.y + p.h, c=c, lw=1.1, dash="2 3"))
            o.append(D(p.X(u * 100), p.Y(v), c, 3.8))
            res.append((v, u, c))
        yb = p.y + p.h + 44
        for k, (v, u, c) in enumerate(res):
            yy = yb + k * 19
            o.append(RECT(p.x, yy, p.X(u * 100) - p.x, 12, 2, soft(c), c, 1.1))
            o.append(T(p.x - 6, yy + 10, vfmt(v), "end", 9.5, c, True))
            o.append(T(p.X(u * 100) + 5 if u < 0.8 else p.X(u * 100) - 5, yy + 10, "使える " + _f03_pct(u),
                       "start" if u < 0.8 else "end", 9.5, c, True, halo=True))
        return yb
    yb = panel(pa, "alk", [(0.9, SIG), (1.1, PUR), (3.5 / 3, ALI)], lambda v: "%.2f V" % v)
    panel(pb, "cr", [(2.0, SIG), (2.2, PUR), (2.5, ALI)], lambda v: "%.1f V" % v)
    o.append(T(12, yb + 72, "破線: 終止電圧。棒: 終止電圧までに取り出せる電荷（小さな電流・25 °C。代表的な形の曲線による）。", "start", 9.5, MUT))
    return SVG(700, yb + 82, o, "終止電圧と、それまでに使える電荷。(a) 傾いた曲線では、1 本あたりの終止電圧が 0.90 V から 1.17 V に上がると、使える電荷は 100 % から 65 % に減る。(b) 平らな曲線では、終止電圧を 2.0 V から 2.5 V に上げても 95 % を使える。")
F["e03_endv"] = _f03_endv()

# ---- 3 節: 電流と実効容量 ----
_F03_IS = [(0.02, "20 mA（0.01C）", SIG), (0.2, "200 mA（0.1C）", PUR), (1.0, "1 A（0.5C）", ALI)]

def _f03_rate():
    o = []
    Qn = _F03_B["alk"]["Qn"]
    p = Plot(70, 40, 360, 220, (0, 2000), (0.6, 1.6))
    o.append(T(p.x + p.w / 2, 22, "(a) 端子電圧（単 3 形のアルカリ乾電池 1 本、25 °C）", "middle", 11, INK, True))
    o.append(p.axes(xl="取り出した電荷 [mAh]", yl="端子電圧 [V]", xt=[0, 500, 1000, 1500, 2000], yt=[0.6, 0.8, 1.0, 1.2, 1.4, 1.6], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(x * Qn, _f03_E("alk", x)) for x in [k / 400.0 for k in range(401)]], c=MUT, lw=1.2, dash="3 3"))
    o.append(p.line([(0, 0.9), (2000, 0.9)], c=INK, lw=1.2, dash="6 4"))
    o.append(T(p.X(1990), p.Y(0.9) + 13, "終止電圧 0.9 V", "end", 9.5, INK, False, halo=True))
    us = []
    for I, lab, c in _F03_IS:
        u = _f03_use("alk", 0.9, I)
        pts = [(x * Qn, _f03_E("alk", x) - I * _f03_R("alk", x)) for x in [k / 400.0 for k in range(401)] if x <= u + 1e-9]
        pts.append((u * Qn, 0.9))
        o.append(p.line(pts, c=c, lw=2.2))
        o.append(D(p.X(u * Qn), p.Y(0.9), c, 4))
        us.append((I, lab, c, u))
    o.append(T(p.X(60), p.Y(1.55), "電流 0 の放電曲線 E(q)（点線）", "start", 9.5, MUT, False, halo=True))
    # ずれの寸法線（1 A）
    q = 900.0
    e = _f03_E("alk", q / Qn)
    v = e - 1.0 * _f03_R("alk", q / Qn)
    o.append(DARR(p.X(q), p.Y(e) + 2, p.X(q), p.Y(v) - 2, c=ALI, lw=1.2, head=5))
    o.append(T(p.X(q) + 6, (p.Y(e) + p.Y(v)) / 2 + 4, "1 A × R_in(q)", "start", 9.5, ALI, True, halo=True))
    # (b) 実効容量の棒
    x0b, bw = 490, 190
    o.append(T(x0b + 100, 22, "(b) 実効容量", "middle", 11, INK, True))
    for k, (I, lab, c, u) in enumerate(us):
        y = 56 + k * 62
        o.append(T(x0b, y, lab, "start", 10, c, True))
        o.append(RECT(x0b, y + 8, bw * u, 18, 3, soft(c), c, 1.2))
        o.append(RECT(x0b + bw * u, y + 8, bw * (1 - u), 18, 3, "none", MUT, 1.0, dash="3 3"))
        o.append(T(x0b, y + 42, "%.0f mAh（%s）" % (u * Qn, _f03_pct(round(u, 2))), "start", 10, c, True))
    o.append(T(x0b, 56 + 3 * 62 + 4, "破線の枠: 取り出せずに", "start", 9.5, MUT))
    o.append(T(x0b, 56 + 3 * 62 + 19, "電池に残る電荷（公称 2000 mAh）", "start", 9.5, MUT))
    o.append(T(12, 316, "内部抵抗は 0.15 Ω（新しいとき）から 0.6 Ω（終わり）まで大きくなるとした（例の値）。", "start", 9.5, MUT))
    return SVG(700, 326, o, "電流による実効容量の違い（例の値）。電流 I を流すと、端子電圧は電流が小さいときの放電曲線より I R_in(q) だけ下がる。内部抵抗は終わりに近いほど大きいので、大きな電流ほど早く終止電圧に届く。")
F["e03_rate"] = _f03_rate()

# ---- 3 節: 温度と実効容量 ----
_F03_TS = [(25, "25 °C", SIG), (0, "0 °C", PUR), (-20, "−20 °C", ALI)]

def _f03_temp():
    o = []
    Qn = _F03_B["alk"]["Qn"]
    p = Plot(70, 40, 300, 210, (0, 2000), (0.6, 1.6))
    o.append(T(p.x + p.w / 2, 22, "(a) 200 mA（0.1C）で流したときの端子電圧", "middle", 11, INK, True))
    o.append(p.axes(xl="取り出した電荷 [mAh]", yl="端子電圧 [V]", xt=[0, 500, 1000, 1500, 2000], yt=[0.6, 0.8, 1.0, 1.2, 1.4, 1.6], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 0.9), (2000, 0.9)], c=INK, lw=1.2, dash="6 4"))
    o.append(T(p.X(1990), p.Y(0.9) + 13, "終止 0.9 V", "end", 9.5, INK, False, halo=True))
    for Tc, lab, c in _F03_TS:
        u = _f03_use("alk", 0.9, 0.2, Tc)
        pts = [(x * Qn, _f03_E("alk", x) - 0.2 * _f03_R("alk", x, Tc)) for x in [k / 400.0 for k in range(401)] if x <= u + 1e-9]
        pts.append((u * Qn, 0.9))
        o.append(p.line(pts, c=c, lw=2.2))
        o.append(D(p.X(u * Qn), p.Y(0.9), c, 4))
        o.append(T(p.X(u * Qn), p.Y(0.9) - 9, "%.0f" % (u * Qn), "middle", 9.5, c, True, halo=True))
    o.append(T(p.X(80), p.Y(1.52), "25 °C", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(80), p.Y(1.33) + 2, "0 °C", "start", 10, PUR, True, halo=True))
    o.append(T(p.X(80), p.Y(1.16) + 4, "−20 °C", "start", 10, ALI, True, halo=True))
    # (b) 温度と実効容量
    q = Plot(450, 40, 230, 210, (-20, 40), (0, 100))
    o.append(T(q.x + q.w / 2, 22, "(b) 実効容量（公称容量の %）", "middle", 11, INK, True))
    o.append(q.axes(xl="温度 [°C]", yl="%", xt=[-20, 0, 20, 40], yt=[0, 25, 50, 75, 100], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    for I, lab, c in _F03_IS:
        pts = [(Tc, 100 * _f03_use("alk", 0.9, I, Tc)) for Tc in range(-20, 41, 2)]
        o.append(q.line(pts, c=c, lw=2.2))
    o.append(T(q.X(-18), q.Y(100) + 14, "20 mA", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(14), q.Y(78), "200 mA", "start", 9.5, PUR, True, halo=True))
    o.append(T(q.X(16), q.Y(36), "1 A", "start", 9.5, ALI, True, halo=True))
    o.append(T(12, 306, "単 3 形のアルカリ乾電池（2000 mAh）、終止電圧 0.9 V。内部抵抗は 10 °C 下がるごとに 1.5 倍とした（例の値）。", "start", 9.5, MUT))
    return SVG(700, 316, o, "温度による実効容量の違い（内部抵抗の増加だけを入れた模型。例の値）。低温では内部抵抗が大きくなり、同じ電流でも早く終止電圧に届く。影響は電流が大きいほど強い。実際の電池の低温の実効容量は、この模型より小さいことがある。")
F["e03_temp"] = _f03_temp()

# ---- 4 節: 等価回路とパルスの応答 ----
def _f03_model():
    o = []
    # 回路
    o.append(T(150, 20, "(a) 内部抵抗を 2 つに分けた模型", "middle", 11, INK, True))
    yt, ybm = 78, 222
    xs = 40
    o.append(_f03_src(xs, 150))
    o.append(T(xs + 24, 155, "E", "start", 12, GLD, True))
    o.append(W(xs, 133, xs, yt, 80, yt, c=INK, lw=1.5))
    o.append(_f03_resh(80, 130, yt))
    o.append(_f03_sub(105, yt - 12, "R", "0", "middle", 12, INK, True))
    # 並列の R1 と C1
    xa, xb = 130, 230
    o.append(W(xa, yt, xa + 10, yt, c=INK, lw=1.5))
    o.append(W(xa + 10, yt - 24, xa + 10, yt + 24, c=INK, lw=1.5))
    o.append(W(xb - 10, yt - 24, xb - 10, yt + 24, c=INK, lw=1.5))
    o.append(W(xa + 10, yt - 24, xa + 25, yt - 24, c=INK, lw=1.5) + _f03_resh(xa + 25, xb - 25, yt - 24) + W(xb - 25, yt - 24, xb - 10, yt - 24, c=INK, lw=1.5))
    o.append(W(xa + 10, yt + 24, xa + 42, yt + 24, c=INK, lw=1.5))
    o.append(W(xb - 42, yt + 24, xb - 10, yt + 24, c=INK, lw=1.5))
    o.append(W(xa + 42, yt + 24 - 10, xa + 42, yt + 24 + 10, c=INK, lw=2.2) + W(xa + 50, yt + 24 - 10, xa + 50, yt + 24 + 10, c=INK, lw=2.2))
    o.append(W(xa + 50, yt + 24, xb - 42, yt + 24, c=INK, lw=1.5))
    o.append(_f03_sub((xa + xb) / 2, yt - 36, "R", "1", "middle", 12, INK, True))
    o.append(_f03_sub(xa + 46, yt + 50, "C", "1", "middle", 12, INK, True))
    o.append(T((xa + xb) / 2, yt + 70, "τ = R₁C₁", "middle", 10.5, MUT))
    o.append(W(xb, yt, xb - 10, yt, c=INK, lw=1.5) + W(xb, yt, 268, yt, c=INK, lw=1.5))
    o.append(W(xs, 167, xs, ybm, 268, ybm, c=INK, lw=1.5))
    o.append(RECT(14, 34, 234, 202, 10, "none", GLD, 1.4, dash="5 4"))
    o.append(T(130, 252, "電池の中", "middle", 10, GLD, True))
    o.append(CIRC(268, yt, 4, c=INK, lw=1.5, fill=PAN) + CIRC(268, ybm, 4, c=INK, lw=1.5, fill=PAN))
    o.append(T(282, yt + 4, "+", "start", 12, INK, True))
    o.append(T(282, ybm + 4, "−", "start", 12, INK, True))
    o.append(ARR(276, yt + 22, 276, ybm - 22, c=GLD, lw=1.4, head=6))
    o.append(T(284, 154, "V", "start", 12, INK, True))
    o.append(T(150, 276, "すぐ現れる部分 R₀ と、時間とともに大きくなる部分（R₁ と C₁）", "middle", 9.5, MUT))
    # 波形（CR2032、新しい、25 °C、15 mA を 10 ms）
    E0, R0, R1, tau, I, tp = 3.20, 8.25, 6.75, 5.0, 15.0, 10.0
    def V(t):
        if t < 0:
            return E0
        if t <= tp:
            return E0 - I * 1e-3 * (R0 + R1 * (1 - math.exp(-t / tau)))
        v1 = I * 1e-3 * R1 * (1 - math.exp(-tp / tau))
        return E0 - v1 * math.exp(-(t - tp) / tau)
    pi = Plot(388, 40, 290, 60, (-5, 40), (0, 20))
    pv = Plot(388, 128, 290, 132, (-5, 40), (2.95, 3.22))
    o.append(T(530, 20, "(b) 15 mA を 10 ms 流したとき（CR2032 の例）", "middle", 11, INK, True))
    o.append(pi.axes(yl="mA", xt=[0, 10, 20, 30, 40], yt=[0, 15], xfmt=lambda v: "", yfmt=lambda v: "%d" % v))
    o.append(pi.line([(-5, 0), (0, 0), (0, 15), (10, 15), (10, 0), (40, 0)], c=GLD, lw=2))
    o.append(pv.axes(xl="時間 [ms]", yl="端子電圧 [V]", xt=[0, 10, 20, 30, 40], yt=[3.0, 3.1, 3.2], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    pts = [(-5, E0), (0, E0), (0, E0 - I * 1e-3 * R0)] + [(t / 10.0, V(t / 10.0)) for t in range(1, 101)] + [(10, V(10.0) + I * 1e-3 * R0)] + [(10 + t / 5.0, V(10 + t / 5.0)) for t in range(1, 151)]
    o.append(pv.line(pts, c=SIG, lw=2))
    # 注記
    o.append(W(pv.X(0) - 14, pv.Y(E0), pv.X(0) - 4, pv.Y(E0), c=MUT, lw=1))
    o.append(DARR(pv.X(0) - 9, pv.Y(E0) + 1, pv.X(0) - 9, pv.Y(E0 - I * 1e-3 * R0) - 1, c=ALI, lw=1.1, head=4))
    o.append(T(pv.X(0.8), pv.Y(E0 - I * 1e-3 * R0 / 2) + 4, "I R₀ = 124 mV（すぐ）", "start", 9.5, ALI, True, halo=True))
    v3 = V(3.0)
    o.append(D(pv.X(3), pv.Y(v3), PUR, 3.5))
    o.append(T(pv.X(3) + 5, pv.Y(v3) + 15, "3 ms: 169 mV", "start", 9.5, PUR, True, halo=True))
    o.append(T(pv.X(9.6), pv.Y(V(10.0)) + 15, "10 ms: 211 mV", "end", 9.5, PUR, True, halo=True))
    o.append(T(pv.X(16), pv.Y(3.06), "止めると I R₀ の分がすぐ戻り、", "start", 9.5, MUT, False, halo=True))
    o.append(T(pv.X(16), pv.Y(3.06) + 14, "残りは τ = 5 ms で戻る", "start", 9.5, MUT, False, halo=True))
    return SVG(700, 300, o, "(a) 内部抵抗を、すぐ現れる部分 R₀ と、時間とともに大きくなる部分（R₁ と C₁ の並列）に分けた模型。(b) この模型で、新しい CR2032 の例（E = 3.20 V、R₀ = 8.25 Ω、R₁ = 6.75 Ω、τ = 5 ms。例の値）に 15 mA を 10 ms 流したときの端子電圧。")
F["e03_model"] = _f03_model()

# ---- 4 節: 内部抵抗と放電の進み具合・温度 ----
def _f03_rin():
    o = []
    p = Plot(80, 30, 430, 230, (0, 100), (10, 1000), ylog=True)
    o.append(p.axes(xl="放電の進み具合（公称容量の %）", yl="内部抵抗 R₀ + R₁ [Ω]", xt=[0, 25, 50, 75, 100], yt=[10, 100, 1000], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    for Tc, lab, c in _F03_TS:
        pts = [(x * 100, _f03_R("cr", x, Tc)) for x in [k / 400.0 for k in range(401)]]
        o.append(p.line(pts, c=c, lw=2.2))
    o.append(T(p.X(4), p.Y(_f03_R("cr", 0, 25)) - 7, "25 °C", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(4), p.Y(_f03_R("cr", 0, 0)) - 7, "0 °C（× 2.3）", "start", 10, PUR, True, halo=True))
    o.append(T(p.X(4), p.Y(_f03_R("cr", 0, -20)) - 7, "−20 °C（× 4.5）", "start", 10, ALI, True, halo=True))
    for x, lab in ((0.0, "15 Ω"), (0.9, "40 Ω"), (1.0, "120 Ω")):
        o.append(D(p.X(x * 100), p.Y(_f03_R("cr", x, 25)), SIG, 3.6))
        o.append(T(p.X(x * 100) + (6 if x < 0.95 else -6), p.Y(_f03_R("cr", x, 25)) + 15, lab, "start" if x < 0.95 else "end", 9.5, SIG, True, halo=True))
    xt = 540
    o.append(T(xt, 46, "CR2032 の例（代表的な形）", "start", 10.5, INK, True))
    for k, s in enumerate(["放電の終わり近くで", "急に大きくなる。", "", "温度が 10 °C 下がるごとに", "1.4 倍とした（例の値）:", "0 °C で 1.4^2.5 ≈ 2.3 倍", "−20 °C で 1.4^4.5 ≈ 4.5 倍"]):
        if s:
            o.append(T(xt, 68 + k * 16, s, "start", 9.5, MUT))
    return SVG(700, 300, o, "CR2032 の内部抵抗（R₀ + R₁）が、放電の進み具合と温度でどう変わるか（代表的な形と例の値。縦軸は対数目盛）。終わり近くと低温で、何倍にもなる。")
F["e03_rin"] = _f03_rin()

# ---- 4 節: パルスの底 ----
def _f03_pulse():
    o = []
    p = Plot(70, 30, 440, 250, (0, 100), (1.5, 3.3))
    o.append(p.axes(xl="放電の進み具合（公称容量の %）", yl="端子電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[1.5, 2.0, 2.5, 3.0], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    xs = [k / 400.0 for k in range(401)]
    o.append(p.line([(x * 100, _f03_E("cr", x)) for x in xs], c=INK, lw=1.8))
    o.append(T(p.X(30), p.Y(_f03_E("cr", 0.3)) - 7, "休んでいるときの電圧 E(q)", "start", 9.5, INK, True, halo=True))
    o.append(p.line([(0, 2.2), (100, 2.2)], c=MUT, lw=1.3, dash="6 4"))
    o.append(T(p.X(1), p.Y(2.2) + 13, "BOR 2.2 V", "start", 9.5, MUT, True, halo=True))
    res = []
    for Tc, lab, c in _F03_TS:
        for I, dash in ((0.015, None), (0.010, "4 3")):
            pts = [(x * 100, _f03_E("cr", x) - I * _f03_reff("cr", x, Tc, 0.003)) for x in xs]
            pts = [(a, b) for a, b in pts if b >= 1.5]
            o.append(p.line(pts, c=c, lw=2.0 if dash is None else 1.4, dash=dash))
            u = _f03_usep("cr", 2.2, I, 0.003, Tc)
            if dash is None:
                o.append(D(p.X(u * 100), p.Y(2.2), c, 4.2))
            else:
                o.append(CIRC(p.X(u * 100), p.Y(2.2), 3.6, c=c, lw=1.4, fill=PAN))
            res.append((Tc, lab, c, I, u))
    labs = {25: (8, 2.86), 0: (8, 2.62), -20: (8, 2.26)}
    for Tc, lab, c in _F03_TS:
        xx, yy = labs[Tc]
        o.append(T(p.X(xx), p.Y(yy), lab, "start", 10, c, True, halo=True))
    # 右の表
    xt = 540
    o.append(T(xt, 40, "パルスの底が 2.2 V に", "start", 10.5, INK, True))
    o.append(T(xt, 56, "届くまでに使える割合", "start", 10.5, INK, True))
    o.append(T(xt + 64, 80, "15 mA", "middle", 10, INK, True))
    o.append(T(xt + 120, 80, "10 mA", "middle", 10, INK, True))
    for k, (Tc, lab, c) in enumerate(_F03_TS):
        y = 102 + k * 22
        o.append(T(xt, y, lab, "start", 10, c, True))
        u15 = [r[4] for r in res if r[0] == Tc and r[3] == 0.015][0]
        u10 = [r[4] for r in res if r[0] == Tc and r[3] == 0.010][0]
        o.append(T(xt + 64, y, "%d %%" % round(u15 * 100), "middle", 10, c, True))
        o.append(T(xt + 120, y, "%d %%" % round(u10 * 100), "middle", 10, c, True))
    o.append(T(xt, 184, "休んでいるときの", "start", 9.5, MUT))
    o.append(T(xt, 199, "電圧だけなら 98.5 %", "start", 9.5, MUT))
    o.append(T(xt, 228, "実線: 15 mA・3 ms", "start", 9.5, MUT))
    o.append(T(xt, 243, "破線: 10 mA・3 ms", "start", 9.5, MUT))
    o.append(T(xt, 258, "（例の値の模型）", "start", 9.5, MUT))
    return SVG(700, 330, o, "CR2032 にパルスを流す機器の、パルスの底（パルスの終わりの端子電圧）。放電が進むと、休んでいるときの電圧がほとんど下がらないうちに、内部抵抗が大きくなってパルスの底が BOR に届く。低温ではもっと早く届く。")
F["e03_pulse"] = _f03_pulse()

# ---- 5 節: 自己放電を電流に直す・温度 ----
def _f03_selfdis():
    o = []
    rows = [("cr", "CR2032（220 mAh、1 年 1 %）"), ("soc", "塩化チオニルリチウム（2400 mAh、1 %）"), ("alk", "アルカリ単 3 形（2000 mAh、2 %）"),
            ("li", "リチウムイオン（1000 mAh、月 2 %）"), ("nimh", "ニッケル水素（2000 mAh、20 %）")]
    p = Plot(250, 44, 160, 5 * 30, (0.1, 100), (0, 5), xlog=True)
    o.append(T(14, 20, "(a) 自己放電を電流に直す（20 °C、例の値）", "start", 11, INK, True))
    for v in (0.1, 1, 10, 100):
        o.append(W(p.X(v), p.y - 4, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 14, "%g" % v, "middle", 9.5, MUT))
    o.append(W(p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.1))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "I_sd [µA]（対数目盛）", "middle", 9.5, MUT))
    for k, (t, nm) in enumerate(rows):
        y = p.y + k * 30
        b = _F03_B[t]
        I = b["sd"] * b["Qn"] / 8760.0 * 1000.0
        o.append(T(p.x - 8, y + 17, nm, "end", 9.5, INK))
        o.append(RECT(p.x, y + 6, p.X(I) - p.x, 15, 2, soft(b["c"]), b["c"], 1.2))
        o.append(T(p.X(I) + 5, y + 17, "%.2f µA" % I if I < 10 else "%.1f µA" % I, "start", 9.5, b["c"], True, halo=True))
    xr = p.X(2.70)
    o.append(W(xr, p.y - 8, xr, p.y + p.h, c=ALI, lw=1.4, dash="4 3"))
    o.append(T(xr + 4, p.y - 10, "01 章のドアの開閉センサ 2.70 µA", "start", 9.5, ALI, True, halo=True))
    # (b) 温度の倍率
    q = Plot(500, 44, 180, 150, (-10, 50), (0, 8))
    o.append(T(470, 20, "(b) 温度の倍率 2^((T − 20)/10)", "start", 11, INK, True))
    o.append(q.axes(xl="温度 T [°C]", yl="20 °C に対する倍率", xt=[-10, 0, 20, 40, 50], yt=[0, 2, 4, 6, 8], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(q.line([(Tc / 2.0, 2 ** ((Tc / 2.0 - 20) / 10.0)) for Tc in range(-20, 101)], c=GLD, lw=2.2))
    o.append(q.line([(0, 0.25), (40, 4.0)], c=ALI, lw=1.3, dash="4 3"))
    o.append(D(q.X(0), q.Y(0.25), GLD, 3.6) + D(q.X(40), q.Y(4.0), GLD, 3.6))
    o.append(D(q.X(20), q.Y(2.125), ALI, 4.2) + D(q.X(20), q.Y(1.0), SIG, 4.2))
    o.append(T(q.X(20) - 6, q.Y(2.125) - 6, "平均 2.125", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(20) + 6, q.Y(1.0) + 14, "20 °C で 1", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(40) - 6, q.Y(4.0) - 6, "40 °C で 4", "end", 9.5, GLD, True, halo=True))
    o.append(T(470, 252, "0 °C と 40 °C で半分ずつ過ごすと、", "start", 9.5, MUT))
    o.append(T(470, 267, "平均の温度は 20 °C でも、自己放電は", "start", 9.5, MUT))
    o.append(T(470, 282, "20 °C のときの 2.125 倍になる。", "start", 9.5, MUT))
    return SVG(700, 294, o, "(a) 自己放電を、電池の中を流れる一定の電流 I_sd = r Q_n / 8760 h に直したもの（20 °C、例の値）。大きな電池では、機器の平均電流と同じくらいになる。(b) 温度が 10 °C 上がるごとに 2 倍とする目安では、温度が変わる場所の平均の倍率は、平均の温度での倍率より大きい。")
F["e03_selfdis"] = _f03_selfdis()

# ---- 5 節: 電圧遅延 ----
def _f03_delay():
    o = []
    p = Plot(80, 40, 420, 170, (-0.2, 2.0), (2.0, 3.8))
    o.append(T(p.x + p.w / 2, 22, "塩化チオニルリチウム電池に 50 mA を流し始めたときの端子電圧（模式図）", "middle", 11, INK, True))
    o.append(p.axes(xl="時間 [s]（流し始めを 0 とした。値は例）", yl="端子電圧 [V]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[2.0, 2.5, 3.0, 3.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    def vnew(t):
        return 3.62 if t < 0 else 3.42
    def vold(t):
        if t < 0:
            return 3.62
        return 3.42 - 0.95 * math.exp(-t / 0.25) * (1 - math.exp(-t / 0.01))
    o.append(p.line([(t / 200.0 - 0.2, vnew(t / 200.0 - 0.2)) for t in range(0, 441)], c=SIG, lw=2))
    o.append(p.line([(t / 200.0 - 0.2, vold(t / 200.0 - 0.2)) for t in range(0, 441)], c=ALI, lw=2.2))
    o.append(p.line([(-0.2, 2.8), (2.0, 2.8)], c=MUT, lw=1.3, dash="6 4"))
    o.append(T(p.X(1.98), p.Y(2.8) + 13, "BOR の例 2.8 V", "end", 9.5, MUT, True, halo=True))
    o.append(T(p.X(0.9), p.Y(3.42) - 8, "新しい電池・短い保管: すぐに一定", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.12), p.Y(2.48) + 4, "長く置いた後: 落ち込んでから戻る（電圧遅延）", "start", 9.5, ALI, True, halo=True))
    # 右の説明
    xt = 530
    for k, s in enumerate(["大きく出る条件:", "・保管が長い", "・保管の温度が高い", "・流す電流が大きい", "・使うときの温度が低い", "", "深さと戻る時間は", "条件と構造で大きく違う"]):
        if s:
            o.append(T(xt, 52 + k * 17, s, "start", 10 if k == 0 else 9.5, INK if k == 0 else MUT, k == 0))
    # 手順
    y0 = 262
    o.append(T(14, y0 - 6, "マイコンの手順（起動の後、最初の大きなパルスの前）", "start", 10.5, INK, True))
    steps = [("1. 試しの負荷", "小さめの電流を流す", GLD), ("2. 電圧を測る", "ADC で繰り返し", SIG), ("3. 戻った?", "しきい値を超えたか", PUR), ("4. パルスを許す", "コンデンサからも流す", GRN)]
    for k, (a, b, c) in enumerate(steps):
        x = 14 + k * 172
        o.append(BOX(x, y0 + 4, 140, 44, a, b, c, soft(c), c, sz=10.5, ssz=9.5))
        if k < 3:
            o.append(ARR(x + 142, y0 + 26, x + 170, y0 + 26, c=MUT, lw=1.4, head=6))
    o.append(CARR(14 + 2 * 172 + 60, y0 + 50, 14 + 172 + 80, y0 + 50, bend=0.25, c=MUT, lw=1.2, head=6))
    o.append(T(14 + 172 + 140, y0 + 90, "まだ（決めた時間までは繰り返す）", "middle", 9.5, MUT))
    o.append(ARR(14 + 2 * 172 + 120, y0 + 50, 14 + 2 * 172 + 150, y0 + 78, c=ALI, lw=1.2, head=6))
    o.append(T(14 + 2 * 172 + 156, y0 + 90, "時間切れ: パルスを小さくする・知らせる", "start", 9.5, ALI, True))
    return SVG(700, y0 + 102, o, "電圧遅延の模式図と、マイコンの備え方。長く置いた塩化チオニルリチウム電池は、流し始めに端子電圧が落ち込み、電流を流し続けるうちに戻る。大きなパルスの前に、試しの負荷で電圧が戻るのを確かめる。")
F["e03_delay"] = _f03_delay()

# ---- 5 節: 容量の内訳 ----
def _f03_budget():
    o = []
    Qn = 220.0
    u10 = _f03_usep("cr", 2.2, 0.010, 0.003, 0)
    u15 = _f03_usep("cr", 2.2, 0.015, 0.003, 0)
    st = Qn * 0.01 * 0.5
    Iavg, Isd = 2.70, Qn * 0.01 / 8760.0 * 1000.0
    def life(u):
        return (u * Qn - st) / (Iavg + Isd) * 1000.0 / 8760.0
    q1 = u10 * Qn
    q2 = q1 - st
    dev = q2 * Iavg / (Iavg + Isd)
    sdu = q2 - dev
    o.append(T(14, 20, "(a) CR2032 の容量の内訳（ドアの開閉センサ、最も寒いとき 0 °C、送信 10 mA・3 ms、BOR 2.2 V）", "start", 10.5, INK, True))
    x0, sc = 200, 1.75
    rows = [("公称容量", 0, Qn, GLD, "%.0f mAh" % Qn, "in"),
            ("パルスの底で使えない分", q1, Qn, ALI, "− %.1f mAh（0 °C で使えるのは %d %%）" % (Qn - q1, round(u10 * 100)), "left"),
            ("出荷までの保管（6 か月）", q2, q1, ALI, "− %.1f mAh（自己放電）" % st, "left"),
            ("使い始めに残る電荷", 0, q2, SIG, "%.1f mAh" % q2, "in")]
    for k, (nm, a, b, c, lab, where) in enumerate(rows):
        y = 34 + k * 30
        o.append(T(x0 - 8, y + 15, nm, "end", 10, INK))
        o.append(RECT(x0 + a * sc, y + 4, max((b - a) * sc, 1.5), 16, 2, soft(c), c, 1.2))
        if where == "in":
            o.append(T(x0 + 8, y + 16, lab, "start", 9.5, c, True, halo=True))
        else:
            o.append(T(x0 + a * sc - 6, y + 16, lab, "end", 9.5, c, True, halo=True))
    y = 34 + 4 * 30
    o.append(T(x0 - 8, y + 15, "使う間の内訳", "end", 10, INK))
    o.append(RECT(x0, y + 4, dev * sc, 16, 2, SSOFT, SIG, 1.2))
    o.append(RECT(x0 + dev * sc, y + 4, sdu * sc, 16, 2, GOSOFT, GLD, 1.2))
    o.append(T(x0 + 8, y + 16, "機器（2.70 µA）%.1f mAh" % dev, "start", 9.5, SIG, True, halo=True))
    o.append(T(x0 + q2 * sc + 6, y + 16, "自己放電（0.25 µA）%.1f mAh" % sdu, "start", 9.5, GLD, True))
    # (b) 寿命
    yb = y + 52
    o.append(T(14, yb, "(b) 電池寿命の見積もり", "start", 10.5, INK, True))
    lifes = [("01 章（公称容量 ÷ 平均電流）", 220.0 / Iavg * 1000.0 / 8760.0, MUT),
             ("この章（送信 10 mA）", life(u10), SIG),
             ("LED と送信を重ねる（15 mA）", life(u15), ALI)]
    for k, (nm, L, c) in enumerate(lifes):
        yy = yb + 12 + k * 26
        o.append(T(x0 - 8, yy + 13, nm, "end", 10, INK))
        o.append(RECT(x0, yy + 2, L * 40, 16, 2, soft(c), c, 1.2))
        o.append(T(x0 + L * 40 + 6, yy + 14, "%.1f 年" % L, "start", 10, c, True))
    return SVG(700, yb + 12 + 3 * 26 + 10, o, "01 章 4 節のドアの開閉センサの電池寿命を、この章の道具で見積もり直した例（例の値の模型）。最も寒いときのパルスの底で使える電荷が決まり、保管と使う間の自己放電がそこから引かれる。")
F["e03_budget"] = _f03_budget()
