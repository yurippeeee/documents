# -*- coding: utf-8 -*-
# 05. リブとボス の図（figures.py から exec される）
import math as _m5

def _p05(pts, c=MUT, fill=PAN, lw=1.4, dash=None):
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"%s/>' % (d, fill, c, lw, da)

# ---- 同じ質量で比べる ----
def _e05_mass():
    o = []
    S = 7.0  # px/mm
    B = 20.0
    base = 112
    cases = [("2 mm の板", [(0, 0, B, 2.0)], "断面積 40 mm²（1.00）", "I = 13.3 mm⁴（1.0 倍）", MUT, PAN),
             ("同じ質量の平板 2.36 mm", [(0, 0, B, 2.36)], "断面積 47.2 mm²（1.18）", "I = 21.9 mm⁴（1.6 倍）", MUT, PAN),
             ("リブ 1 本（w 1.2, h 6）", [(0, 0, B, 2.0), (B / 2 - 0.6, 2.0, 1.2, 6.0)], "断面積 47.2 mm²（1.18）", "I = 132.6 mm⁴（9.9 倍）", SIG, SSOFT),
             ("同じ I の平板 4.30 mm", [(0, 0, B, 4.30)], "断面積 86.0 mm²（2.15）", "I = 132.6 mm⁴（9.9 倍）", ALI, ASOFT)]
    for i, (name, rects, a, ii, col, fl) in enumerate(cases):
        x0 = 30 + i * 210
        o.append(T(x0 + B * S / 2, 34, name, "middle", 11.5, col if col != MUT else INK, True))
        for (rx, ry, rw, rh) in rects:
            o.append(RECT(x0 + rx * S, base - (ry + rh) * S, rw * S, rh * S, 0, fl, col, 1.4))
        o.append(T(x0 + B * S / 2, base + 26, a, "middle", 10.5, MUT))
        o.append(T(x0 + B * S / 2, base + 44, ii, "middle", 10.5, col if col != MUT else INK, col != MUT))
    o.append(DIM(30, base + 74, 30 + B * S, base + 74, "幅 20 mm", MUT))
    o.append(T(430, base + 104, "かっこ内は 2 mm の板に対する比。リブは質量 1.18 倍で剛性 9.9 倍、平板で同じ剛性にすると質量 2.15 倍。", "middle", 10.5, MUT))
    return SVG(860, 232, o, "同じ材料・同じ幅で断面だけを変えた比較。剛性は断面二次モーメント I に比例する。リブは少ない材料で I を大きくする。")
F["e05_mass"] = _e05_mass()

# ---- T 形断面 ----
def _e05_tsection():
    o = []
    S = 34.0
    x0, yb = 120, 330
    B, t, w, h = 20.0, 2.0, 1.2, 6.0
    sc = 14.0  # 幅方向は縮める
    def X(mm): return x0 + mm * sc
    def Y(mm): return yb - mm * S
    o.append(RECT(X(0), Y(t), B * sc, t * S, 0, PAN, MUT, 1.4))
    o.append(RECT(X(B / 2 - w / 2), Y(t + h), w * sc, h * S, 0, SSOFT, SIG, 1.4))
    yb_ = (40 * 1 + 7.2 * 5) / 47.2
    # 中立軸
    o.append(W(X(-2), Y(yb_), X(B + 2), Y(yb_), c=ALI, lw=1.6, dash="8 4"))
    o.append(T(X(B + 2) + 6, Y(yb_) + 4, "中立軸（図心）", "start", 11, ALI, True))
    o.append(T(X(B + 2) + 6, Y(yb_) + 20, "Ȳ = 1.610 mm", "start", 10.5, ALI))
    # 各部の図心
    o.append(D(X(5), Y(1), INK, 3.5))
    o.append(T(X(5) + 10, Y(1) + 14, "板の図心 Y₁ = 1", "start", 10.5, INK))
    o.append(D(X(B / 2), Y(5), SIG, 3.5))
    o.append(T(X(B / 2) + 14, Y(5) + 4, "リブの図心 Y₂ = 5", "start", 10.5, SIG, True))
    # 距離 d1, d2
    o.append(DIM(X(5), Y(1), X(5), Y(yb_), None, INK))
    o.append(T(X(5) + 10, Y(1.3) + 2, "d₁ = 0.610", "start", 10, INK))
    o.append(DIM(X(B / 2 + 3), Y(yb_), X(B / 2 + 3), Y(5), None, SIG))
    o.append(T(X(B / 2 + 3) + 8, Y(3.3), "d₂ = 3.390", "start", 10.5, SIG))
    # 寸法
    o.append(DIM(X(0), yb + 22, X(B), yb + 22, "b = 20", MUT))
    o.append(W(X(0), yb, X(0), yb + 28, c=FNT, lw=0.8)); o.append(W(X(B), yb, X(B), yb + 28, c=FNT, lw=0.8))
    o.append(DIM(X(-1.5), Y(0), X(-1.5), Y(t), None, MUT))
    o.append(T(X(-1.5) - 8, Y(1) + 4, "t = 2", "end", 10.5, MUT))
    o.append(DIM(X(B / 2 - 2.6), Y(t), X(B / 2 - 2.6), Y(t + h), None, MUT))
    o.append(T(X(B / 2 - 2.6) - 6, Y(t + 4.8), "h = 6", "end", 10.5, MUT))
    o.append(DIM(X(B / 2 - w / 2), Y(t + h) - 14, X(B / 2 + w / 2), Y(t + h) - 14, None, MUT))
    o.append(T(X(B / 2) + 26, Y(t + h) - 10, "w = 1.2", "start", 10.5, MUT))
    o.append(T(X(0), yb + 48, "高さ Y は板の下面（外観面）から測る。寸法の単位は mm。", "start", 10, FNT))
    # 右の計算表
    rx = 620
    rows = [("", "板", "リブ"), ("A [mm²]", "40", "7.2"), ("Y [mm]", "1", "5"), ("I_c [mm⁴]", "13.33", "21.60"),
            ("d [mm]", "0.610", "3.390"), ("A d² [mm⁴]", "14.89", "82.73")]
    for i, (a, b, c) in enumerate(rows):
        yy = 80 + i * 26
        o.append(T(rx, yy, a, "start", 10.5, MUT, i == 0))
        o.append(T(rx + 128, yy, b, "end", 10.5, INK, i == 0))
        o.append(T(rx + 200, yy, c, "end", 10.5, SIG, True))
    o.append(W(rx, 86, rx + 210, 86, c=LIN, lw=1))
    o.append(W(rx, 80 + 5 * 26 + 10, rx + 210, 80 + 5 * 26 + 10, c=LIN, lw=1))
    o.append(T(rx, 80 + 6 * 26 + 6, "I = Σ(I_c + A d²)", "start", 11, INK, True))
    o.append(T(rx, 80 + 7 * 26 + 6, "= 132.6 mm⁴", "start", 11, INK, True))
    return SVG(860, 400, o, "T 形断面。中立軸は全体の図心を通る。板とリブのそれぞれについて、自身の図心まわりの I_c に、中立軸までの距離 d による A d² を足す（平行軸の定理）。幅方向は縮めて描いた。")
F["e05_tsection"] = _e05_tsection()

# ---- リブの寸法 ----
def _e05_rules():
    o = []
    S = 30.0
    x0, yb = 120, 290
    t = 2.0
    def X(mm): return x0 + mm * S
    def Y(mm): return yb - mm * S
    # 板
    o.append(RECT(X(0), Y(t), 18 * S, t * S, 0, PAN, MUT, 1.4))
    # 2 本のリブ（勾配付き台形 + 根元の R は省略記号）
    def rib(cx):
        wb, wt, h = 1.2, 1.0, 6.0
        o.append(_p05([(X(cx - wb / 2), Y(t)), (X(cx - wt / 2), Y(t + h)), (X(cx + wt / 2), Y(t + h)), (X(cx + wb / 2), Y(t))], SIG, SSOFT, 1.4))
        # 根元の R（小さな円弧）
        for sgn in (-1, 1):
            r = 0.5
            cxr = cx + sgn * (wb / 2 + r)
            pts = [(X(cxr - sgn * r * _m5.cos(a)), Y(t + r - r * _m5.sin(a))) for a in [k * _m5.pi / 2 / 8 for k in range(9)]]
            o.append(PL(pts, SIG, 1.4))
    rib(5.0); rib(10.0)
    # 寸法
    o.append(DIM(X(-1.0), Y(0), X(-1.0), Y(t), None, MUT))
    o.append(T(X(-1.0) - 6, Y(1) + 4, "肉厚 t", "end", 11, INK, True))
    o.append(DIM(X(3.0), Y(t), X(3.0), Y(t + 6), None, MUT))
    o.append(T(X(3.0) - 6, Y(t + 3) + 4, "高さ h ≤ 3t", "end", 11, INK, True))
    o.append(DIM(X(5 - 0.6), Y(t) + 0, X(5 + 0.6), Y(t), None, SIG))
    o.append(W(X(4.4), Y(t) + 2, X(4.4), Y(t) + 0, c=SIG, lw=1))
    o.append(T(X(5), Y(t) + 40, "厚さ w = 0.5〜0.6 t", "middle", 11, SIG, True))
    o.append(ARR(X(5), Y(t) + 28, X(5), Y(t) + 6, SIG, 1.2, 5))
    o.append(DIM(X(5.6), Y(t + 1.6), X(9.4), Y(t + 1.6), None, MUT))
    o.append(T(X(7.5), Y(t + 1.6) - 8, "間隔 ≥ 2t", "middle", 11, INK, True))
    o.append(T(X(10.6) + 4, Y(t + 0.4) - 2, "← 根元の R 0.25〜0.5 t", "start", 10.5, INK))
    o.append(T(X(10.6), Y(t + 6) - 8, "先端は勾配で細くなる（片側 0.5° 程度）", "start", 10.5, INK))
    o.append(W(X(10.5), Y(t + 6), X(10.5), Y(t + 3), c=FNT, lw=1, dash="3 3"))
    o.append(T(X(9), Y(0) + 22, "外観面（板の下面）", "middle", 10.5, FNT))
    return SVG(860, 330, o, "リブの寸法の目安（代表値）。厚さは肉厚の 0.5〜0.6 倍、高さは 3t 以下、間隔は 2t 以上。")
F["e05_rules"] = _e05_rules()

# ---- 内接円 ----
def _e05_circle():
    o = []
    S = 34.0
    t = 2.0
    panels = [("平らな板", None, "D = t"), ("w = 0.6 t", 0.6, "D = 1.09 t"), ("w = t", 1.0, "D = 1.25 t")]
    for i, (name, wr, lab) in enumerate(panels):
        x0 = 30 + i * 280
        cx = x0 + 120
        yb = 230
        def Y(mm): return yb - mm * S
        good = (wr is None) or wr <= 0.6
        col = SIG if good else ALI
        soft = SSOFT if good else ASOFT
        if wr is None:
            o.append(RECT(cx - 110, Y(t), 220, t * S, 0, PAN, MUT, 1.4))
            r = t / 2
        else:
            w = wr * t
            o.append(_p05([(cx - 110, Y(0)), (cx + 110, Y(0)), (cx + 110, Y(t)), (cx + w / 2 * S, Y(t)), (cx + w / 2 * S, Y(t + 3.6)),
                           (cx - w / 2 * S, Y(t + 3.6)), (cx - w / 2 * S, Y(t)), (cx - 110, Y(t))], MUT, PAN, 1.4))
            r = (t * t + w * w / 4) / (2 * t)
        o.append(CIRC(cx, Y(r), r * S, col, 1.8, soft))
        o.append(D(cx, Y(r), col, 2.5))
        o.append(T(cx, 30, name, "middle", 12, INK, True))
        o.append(T(cx, yb + 28, lab, "middle", 12, col, True))
        if wr is not None and wr > 0.9:
            o.append(T(cx, yb + 46, "交差部が厚く、ひけやすい", "middle", 10.5, ALI))
        elif wr is not None:
            o.append(T(cx, yb + 46, "ほぼ板と同じ厚さ", "middle", 10.5, SIG))
        else:
            o.append(T(cx, yb + 46, "基準", "middle", 10.5, MUT))
    # 作図の説明（中央パネルに三角形）
    x0 = 30 + 280; cx = x0 + 120; yb = 230
    w = 0.6 * t; r = (t * t + w * w / 4) / (2 * t)
    def Y(mm): return yb - mm * S
    o.append(PL([(cx, Y(r)), (cx + w / 2 * S, Y(t)), (cx + w / 2 * S, Y(r)), (cx, Y(r))], INK, 1.1))
    o.append(T(cx + w / 2 * S + 6, Y((r + t) / 2) + 4, "t − r", "start", 10, INK))
    o.append(T(cx + w / 4 * S, Y(r) + 14, "w/2", "middle", 10, INK))
    o.append(T(cx - 14, Y(r) - 14, "r", "middle", 10.5, INK, True))
    o.append(W(cx, Y(r), cx - 0.0, Y(0), c=INK, lw=1, dash="2 2"))
    return SVG(860, 300, o, "リブの根元に入る最大の円（内接円）。円は外観面に接し、リブの根元の角を通る。中央の直角三角形に三平方の定理を使うと D = t + w²/(4t) が得られる。")
F["e05_circle"] = _e05_circle()

# ---- ボス ----
def _e05_boss():
    o = []
    S = 16.0
    def boss(cx, yb, good):
        col = SIG if good else ALI
        soft = SSOFT if good else ASOFT
        t = 2.0
        def Y(mm): return yb - mm * S
        def X(mm): return cx + mm * S
        if good:
            # 板 + ボス（外径 6, 下穴 2.5、根元近くまで）+ 側壁とつなぎリブ
            o.append(_p05([(X(-9), Y(0)), (X(11), Y(0)), (X(11), Y(14)), (X(9), Y(14)), (X(9), Y(t)), (X(3), Y(t)), (X(3), Y(10)),
                           (X(1.25), Y(10)), (X(1.25), Y(t * 0.5)), (X(-1.25), Y(t * 0.5)), (X(-1.25), Y(10)), (X(-3), Y(10)), (X(-3), Y(t)), (X(-9), Y(t))], col, soft, 1.5))
            # つなぎリブ（壁まで、奥側にあるので点線輪郭）
            o.append(_p05([(X(3), Y(t)), (X(3), Y(8)), (X(9), Y(8)), (X(9), Y(t))], col, "none", 1.2, "4 3"))
            o.append(T(X(6), Y(5) + 4, "リブ", "middle", 10, col))
            o.append(T(X(0), Y(10) - 8, "面取り", "middle", 9.5, MUT))
            o.append(W(X(-1.25), Y(10), X(-1.7), Y(10.5), c=MUT, lw=1))
            o.append(T(X(10), Y(14) - 8, "側壁", "middle", 10, MUT))
            o.append(DIM(X(-3), Y(12), X(3), Y(12), None, MUT))
            o.append(T(X(-3.4), Y(12) + 4, "外径 2〜2.5 d", "end", 10, INK))
            o.append(T(X(-3.4), Y(6), "下穴を →", "end", 9.5, INK))
            o.append(T(X(-3.4), Y(6) + 13, "根元近くまで", "end", 9.5, INK))
            o.append(T(X(0), Y(0) + 22, "外観面にひけが出にくい", "middle", 10.5, SIG))
        else:
            # 板 + 太く浅い下穴のボス、側壁に直接くっつく
            o.append(_p05([(X(-9), Y(0)), (X(11), Y(0)), (X(11), Y(14)), (X(9), Y(14)), (X(9), Y(10)), (X(1.25), Y(10)), (X(1.25), Y(5)),
                           (X(-1.25), Y(5)), (X(-1.25), Y(10)), (X(-4), Y(10)), (X(-4), Y(t)), (X(-9), Y(t))], col, soft, 1.5))
            pts = [(X(u / 10.0), Y(0) - 3.5 * _m5.exp(-((u - 30) / 35.0) ** 2)) for u in range(-60, 111, 5)]
            o.append(PL(pts, ALI, 2.0))
            o.append(T(X(10), Y(14) - 8, "側壁", "middle", 10, MUT))
            o.append(T(X(4.5), Y(7), "壁と一体で", "middle", 9.5, ALI))
            o.append(T(X(4.5), Y(7) + 13, "厚い塊", "middle", 9.5, ALI))
            o.append(T(X(-4.4), Y(4), "浅い下穴 →", "end", 9.5, ALI))
            o.append(T(X(2), Y(0) + 22, "外観面に大きなひけ・ボイド", "middle", 10.5, ALI))
    o.append(T(215, 26, "悪い: 壁にくっついた太いボス", "middle", 12, ALI, True))
    boss(200, 280, False)
    o.append(T(645, 26, "良い: 壁から離し、リブでつなぐ", "middle", 12, SIG, True))
    boss(630, 280, True)
    return SVG(860, 330, o, "ボスの断面。ボスを側壁に直接くっつけると厚い塊になる。壁から離して立て、薄いリブでつなぎ、下穴を根元近くまで掘る。d はねじの呼び径。")
F["e05_boss"] = _e05_boss()

# ---- ガセット ----
def _e05_gusset():
    o = []
    # 左: 側面図
    S = 14.0
    cx, yb = 200, 250
    def X(mm): return cx + mm * S
    def Y(mm): return yb - mm * S
    o.append(RECT(X(-11), Y(2), 22 * S, 2 * S, 0, PAN, MUT, 1.4))
    o.append(_p05([(X(-3), Y(2)), (X(-3), Y(13)), (X(3), Y(13)), (X(3), Y(2))], SIG, SSOFT, 1.5))
    o.append(RECT(X(-1.25), Y(13), 2.5 * S, 10 * S, 0, "var(--panel)", SIG, 1.0, "3 2"))
    for sgn in (-1, 1):
        o.append(_p05([(X(sgn * 3), Y(2)), (X(sgn * 3), Y(10.5)), (X(sgn * 9), Y(2))], SIG, SSOFT, 1.3))
    o.append(T(X(7.5), Y(8), "ガセット", "start", 11, SIG, True))
    o.append(W(X(5.2), Y(5.5), X(7.4), Y(7.6), c=FNT, lw=1))
    o.append(DIM(X(11.5), Y(2), X(11.5), Y(10.5), None, MUT))
    o.append(T(X(11.5) + 8, Y(6.5), "ボスより低く", "start", 10, INK))
    o.append(ARR(X(-9), Y(15), X(-4), Y(15), ALI, 1.8, 7))
    o.append(T(X(-9.5), Y(15) + 4, "横荷重", "end", 10.5, ALI))
    o.append(T(cx, yb + 28, "側面図", "middle", 11, INK, True))
    # 右: 上面図
    cx2, cy2 = 620, 140
    R = 3 * S
    o.append(RECT(cx2 - 170, cy2 - 110, 340, 220, 4, PAN, MUT, 1.2))
    for k in range(4):
        a = k * _m5.pi / 2 + _m5.pi / 4
        ux, uy = _m5.cos(a), _m5.sin(a)
        px, py = -uy, ux
        th = 0.6 * S
        p1 = (cx2 + ux * R + px * th, cy2 + uy * R + py * th)
        p2 = (cx2 + ux * (R + 6 * S) + px * th, cy2 + uy * (R + 6 * S) + py * th)
        p3 = (cx2 + ux * (R + 6 * S) - px * th, cy2 + uy * (R + 6 * S) - py * th)
        p4 = (cx2 + ux * R - px * th, cy2 + uy * R - py * th)
        o.append(_p05([p1, p2, p3, p4], SIG, SSOFT, 1.3))
    o.append(CIRC(cx2, cy2, R, SIG, 1.5, SSOFT))
    o.append(CIRC(cx2, cy2, 1.25 * S, SIG, 1.3, "var(--panel)"))
    o.append(T(cx2, cy2 + 130, "上面図（ガセット 4 枚）", "middle", 11, INK, True))
    o.append(T(cx2 + 52, cy2 + 4, "← 厚さ 0.5〜0.6 t", "start", 10, SIG))
    return SVG(860, 300, o, "ガセットはボスや立ち壁の根元を支える三角形のリブ。横荷重による根元の曲げを底板へ広く逃がす。")
F["e05_gusset"] = _e05_gusset()
