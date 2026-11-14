# -*- coding: utf-8 -*-
# 08. ねじ締結 の図

def _f08_thread():
    o = []
    x0, x1 = 120, 560
    cy = 150
    P = 44          # 1 ピッチの幅 [px]
    ro, ri = 80, 52  # 外径・谷の径の半径 [px]
    r2 = (ro + ri) / 2
    def edge(sgn):
        pts = []
        x = x0
        while x < x1 - 1:
            pts += [(x, cy - sgn * ri), (x + P / 2, cy - sgn * ro)]
            x += P
        pts.append((x, cy - sgn * ri))
        return pts
    top, bot = edge(1), edge(-1)
    poly = top + list(reversed(bot))
    d = " ".join("%g,%g" % p for p in poly)
    o.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' % (d, PAN, INK))
    xe = top[-1][0]
    o.append(W(x0 - 20, cy, xe + 20, cy, c=FNT, lw=1, dash="8,3,2,3"))
    # 径
    o.append(W(x0 - 6, cy - ri, xe + 6, cy - ri, c=GRN, lw=1, dash="4,3"))
    o.append(W(x0 - 6, cy + ri, xe + 6, cy + ri, c=GRN, lw=1, dash="4,3"))
    o.append(DIM(xe + 40, cy - ro, xe + 40, cy + ro, None, INK))
    o.append(T(xe + 50, cy - 36, "d", "start", 12, INK, True, True))
    o.append(T(xe + 50, cy - 21, "呼び径（外径）", "start", 10, MUT))
    o.append(W(x0 - 6, cy - r2, xe + 6, cy - r2, c=SIG, lw=1.2, dash="4,3"))
    o.append(W(x0 - 6, cy + r2, xe + 6, cy + r2, c=SIG, lw=1.2, dash="4,3"))
    o.append(DIM(xe + 150, cy - r2, xe + 150, cy + r2, None, SIG))
    o.append(T(xe + 160, cy + 4, "d₂ 有効径", "start", 11, SIG, True))
    o.append(T(xe + 160, cy + 19, "山の幅 = 溝の幅", "start", 10, MUT))
    o.append(T(xe + 160, cy + 33, "になる径", "start", 10, MUT))
    o.append(DIM(x0 - 40, cy - ri, x0 - 40, cy + ri, None, GRN))
    o.append(T(x0 - 50, cy + 4, "d₁", "end", 12, GRN, True, True))
    o.append(T(x0 - 50, cy + 19, "谷の径", "end", 10, MUT))
    # ピッチ
    px = x0 + P / 2 + 2 * P
    o.append(W(px, cy - ro, px, cy - ro - 26, c=MUT, lw=0.8))
    o.append(W(px + P, cy - ro, px + P, cy - ro - 26, c=MUT, lw=0.8))
    o.append(DIM(px, cy - ro - 20, px + P, cy - ro - 20, None, INK))
    o.append(T(px + P / 2, cy - ro - 30, "P（ピッチ）", "middle", 11, INK, True))
    # 山の角度
    ax = x0 + P / 2 + 5 * P
    o.append(T(ax, cy - ro - 8, "山の角度 60°", "middle", 10.5, ALI, True))
    o.append(T(330, 290, "M3 × 0.5 なら d = 3 mm、P = 0.5 mm（メートル並目）。1 回転でねじは P だけ進む", "middle", 11, INK))
    return SVG(860, 305, o, "おねじの各部の名前（模式図。実際の山の先と谷は平らに切られている）。")
F["e08_thread"] = _f08_thread()


def _f08_clamp():
    o = []
    # 部材 2 枚
    o.append(RECT(60, 110, 300, 40, 0, PAN, INK, 1.4))
    o.append(RECT(60, 150, 300, 70, 0, SCR, INK, 1.4))
    o.append(T(80, 135, "部材 1（通し穴）", "start", 10.5, MUT))
    o.append(T(80, 205, "部材 2（めねじ）", "start", 10.5, MUT))
    # ねじ
    cx = 210
    o.append(RECT(cx - 14, 112, 28, 98, 0, SSOFT, SIG, 1.4))
    o.append(RECT(cx - 34, 86, 68, 24, 4, SSOFT, SIG, 1.6))
    for k in range(7):
        yy = 156 + k * 8
        o.append(W(cx - 14, yy, cx - 18, yy + 4, c=SIG, lw=1))
        o.append(W(cx + 14, yy, cx + 18, yy + 4, c=SIG, lw=1))
    o.append(ARR(cx, 160, cx, 60, SIG, 2.2, 9))
    o.append(T(cx + 8, 62, "軸力 F（ねじは引っ張られて伸びる）", "start", 11, SIG, True))
    for xx in (110, 310):
        o.append(ARR(xx, 80, xx, 106, ALI, 2.0, 8))
        o.append(ARR(xx, 250, xx, 224, ALI, 2.0, 8))
    o.append(T(210, 274, "部材は上下から同じ大きさ F で押し縮められる", "middle", 10.5, ALI, True))
    # ばねのたとえ
    bx = 520
    o.append(T(bx + 140, 40, "ばねで描くと", "middle", 12, INK, True))
    def spring(x, y0, y1, c, n=7, w=16):
        pts = [(x, y0)]
        for k in range(1, 2 * n):
            pts.append((x + (w if k % 2 else -w), y0 + (y1 - y0) * k / (2 * n)))
        pts.append((x, y1))
        return PL(pts, c, 1.8)
    o.append(spring(bx + 60, 70, 240, SIG, 9, 14))
    o.append(T(bx + 60, 258, "ねじ = 伸びたばね", "middle", 10.5, SIG, True))
    o.append(T(bx + 60, 272, "k = EA / L", "middle", 10.5, SIG, mono=True))
    o.append(spring(bx + 220, 110, 200, ALI, 4, 22))
    o.append(T(bx + 220, 258, "部材 = 縮んだばね", "middle", 10.5, ALI, True))
    o.append(W(bx + 170, 104, bx + 270, 104, c=INK, lw=2))
    o.append(W(bx + 170, 206, bx + 270, 206, c=INK, lw=2))
    o.append(T(bx + 140, 296, "ねじは伸び、部材は縮み、両者が同じ力 F で押し合って止まっている", "middle", 10.5, MUT))
    return SVG(860, 312, o, "締結のしくみ。ねじを回すとねじが伸び、その戻ろうとする力（軸力）で部材を押し付ける。")
F["e08_clamp"] = _f08_clamp()


def _f08_torque():
    o = []
    parts = [("ねじを進める（軸力を生む）", 0.123, SIG, SSOFT), ("ねじ山の摩擦", 0.359, ALI, ASOFT),
             ("座面の摩擦", 0.517, ALI, ASOFT)]
    x, w, y = 60, 740, 70
    for t, r, c, fl in parts:
        ww = w * r
        o.append(RECT(x, y, ww, 50, 0, fl, c, 1.6))
        o.append(T(x + ww / 2, y + 30, "%d%%" % round(r * 100), "middle", 14, c, True))
        o.append(T(x + ww / 2, y + 74, t, "middle", 11, c, True))
        x += ww
    o.append(T(430, 40, "M3、摩擦係数 0.15 のときの締付トルクの内訳（K = 0.215）", "middle", 12, INK, True))
    o.append(T(430, 178, "回した力の約 9 割は摩擦に使われる。摩擦が変わると、同じトルクでも軸力が大きく変わる", "middle", 11, MUT))
    return SVG(860, 196, o, "締付トルクの内訳。軸力を生むのは 1 割強で、残りはねじ山と座面の摩擦で消える。")
F["e08_torque"] = _f08_torque()


def _f08_methods():
    o = []
    titles = [("金属のめねじ", "タップ立て。何度でも締め直せる"),
              ("樹脂ボス＋タッピンねじ", "ねじが溝を作りながら入る"),
              ("インサートナット", "金属のめねじを樹脂に埋める"),
              ("圧入ナット（板金）", "板に押し込んで固定")]
    for i, (t, s) in enumerate(titles):
        x = 15 + i * 212
        cx = x + 100
        o.append(T(cx, 26, t, "middle", 12, INK, True))
        o.append(T(cx, 44, s, "middle", 10, MUT))
        if i == 0:
            o.append(RECT(x + 20, 120, 160, 100, 0, SCR, MUT, 1.4))
            o.append(T(x + 30, 212, "金属", "start", 10, MUT))
        elif i == 1:
            o.append(RECT(cx - 32, 120, 64, 100, 3, SCR, GRN, 1.6))
            o.append(W(x + 20, 220, x + 180, 220, c=GRN, lw=1.6))
            o.append(T(x + 22, 212, "樹脂", "start", 10, GRN))
        elif i == 2:
            o.append(RECT(cx - 32, 120, 64, 100, 3, SCR, GRN, 1.6))
            o.append(W(x + 20, 220, x + 180, 220, c=GRN, lw=1.6))
            o.append(RECT(cx - 18, 120, 36, 50, 0, PAN, INK, 1.6))
            for k in range(5):
                o.append(W(cx - 18, 126 + k * 9, cx - 23, 130 + k * 9, c=INK, lw=1.2))
                o.append(W(cx + 18, 126 + k * 9, cx + 23, 130 + k * 9, c=INK, lw=1.2))
            o.append(T(cx + 36, 160, "金属", "start", 10, INK))
            o.append(T(x + 22, 212, "樹脂", "start", 10, GRN))
        else:
            o.append(RECT(x + 20, 120, 160, 10, 0, SCR, MUT, 1.4))
            o.append(RECT(cx - 20, 118, 40, 60, 0, PAN, INK, 1.6))
            o.append(T(cx + 26, 160, "ナット", "start", 10, INK))
            o.append(T(x + 22, 145, "板 t = 1", "start", 10, MUT))
        # 上の部材とねじ
        o.append(RECT(x + 20, 100, 160, 18, 0, PAN, LIN, 1.2))
        bl = 70 if i != 3 else 50
        o.append(RECT(cx - 9, 100, 18, bl, 0, SSOFT, SIG, 1.4))
        o.append(RECT(cx - 22, 84, 44, 16, 3, SSOFT, SIG, 1.4))
    o.append(T(430, 250, "上の部材を下の部材に締める 4 つの方法（断面）", "middle", 11, MUT))
    return SVG(860, 262, o, "代表的な締結方式。下側にめねじをどう作るかが違う。")
F["e08_methods"] = _f08_methods()


def _f08_boss():
    o = []
    def boss(x, good):
        c = SIG if good else ALI
        cx = x + 170
        o.append(T(cx, 26, "良い例" if good else "悪い例", "middle", 13, c, True))
        # 底板
        o.append(RECT(x + 20, 250, 300, 20, 0, SCR, MUT, 1.2))
        if good:
            ro, ri, top = 38, 12, 80
            o.append(PL([(cx - ro, 250), (cx - ro, top), (cx + ro, top), (cx + ro, 250)], c, 1.8))
            o.append(RECT(cx - ri, top, 2 * ri, 150, 0, PAN, MUT, 1.2))
            o.append(PL([(cx - ri - 6, top), (cx - ri, top + 6)], c, 1.4))
            o.append(PL([(cx + ri + 6, top), (cx + ri, top + 6)], c, 1.4))
            # ガセット
            o.append(PL([(cx - ro, 160), (cx - ro - 70, 250)], c, 1.4))
            o.append(PL([(cx + ro, 160), (cx + ro + 70, 250)], c, 1.4))
            o.append(DIM(cx - ro, 62, cx + ro, 62, "外径 ≈ 2〜2.5d", c, 10))
            o.append(W(cx - ri + 3, top + 46, cx - ro - 4, top + 46, c=MUT, lw=1))
            o.append(T(cx - ro - 8, top + 50, "下穴 ≈ 0.8d", "end", 10, MUT))
            o.append(DIM(cx + ro + 18, top + 6, cx + ro + 18, top + 106, None, c))
            o.append(T(cx + ro + 26, top + 50, "かみ合い", "start", 10, c))
            o.append(T(cx + ro + 26, top + 64, "≥ 2d", "start", 10, c))
            o.append(T(cx - ro - 8, top + 4, "入口の面取り", "end", 10, c))
            o.append(T(cx - ro - 58, 215, "ガセット", "end", 10, c))
            o.append(T(cx - 70, 296, "穴の底は板より上で止め、ひけを防ぐ", "middle", 10, MUT))
        else:
            ro, ri, top = 22, 12, 70
            o.append(PL([(cx - ro, 250), (cx - ro, top), (cx + ro, top), (cx + ro, 250)], c, 1.8))
            o.append(RECT(cx - ri, top, 2 * ri, 180, 0, PAN, MUT, 1.2))
            o.append(W(cx + ri, 120, cx + ro, 112, c=ALI, lw=2.2))
            o.append(W(cx + ri, 150, cx + ro, 158, c=ALI, lw=2.2))
            o.append(T(cx + ro + 10, 118, "肉が薄く割れる", "start", 10, c))
            o.append(T(cx + ro + 10, 132, "（ウェルドラインから）", "start", 10, c))
            o.append(T(cx + ro + 10, 196, "長く細いボスは", "start", 10, c))
            o.append(T(cx + ro + 10, 210, "倒れやすい", "start", 10, c))
            o.append(T(cx - ro - 10, 82, "面取りなし", "end", 10, c))
            o.append(T(cx - ro - 10, 96, "入口が欠ける", "end", 10, c))
            o.append(T(cx - ro - 10, 246, "根元に R なし", "end", 10, c))
            o.append(T(cx, 296, "穴が底板まで貫き、表にひけが出る", "middle", 10, MUT))
    boss(40, True)
    boss(470, False)
    return SVG(860, 312, o, "樹脂ボスにタッピンねじを入れるときの形。寸法の比率は代表値で、ねじメーカーの推奨で確認する（d はねじの呼び径）。")
F["e08_boss"] = _f08_boss()


def _f08_grip():
    o = []
    x0, y0, w, h = 90, 250, 560, 200
    o.append(AXES(x0, y0, w + 30, h + 20, "伸び δ [µm]", "軸力 F [N]"))
    X = lambda d: x0 + d / 25.0 * w      # 0〜25 µm
    Y = lambda f: y0 - f / 1100.0 * h
    k1, k2 = 207.3, 51.8                # N/µm
    d1, d2 = 1000 / k1, 1000 / k2
    o.append(W(X(0), Y(0), X(d1), Y(1000), c=ALI, lw=2.2))
    o.append(W(X(0), Y(0), X(d2), Y(1000), c=SIG, lw=2.2))
    o.append(W(x0, Y(1000), X(d2) + 20, Y(1000), c=FNT, lw=1, dash="4,3"))
    o.append(T(x0 - 6, Y(1000) + 4, "1000", "end", 10, MUT, mono=True))
    for v in (0, 5, 10, 15, 20):
        o.append(T(X(v), y0 + 16, str(v), "middle", 10, MUT, mono=True))
    # へたり 2 µm
    o.append(W(X(d1 - 2), Y(1000 - 414.5), X(d1), Y(1000 - 414.5), c=ALI, lw=1.4))
    o.append(D(X(d1 - 2), Y(1000 - 414.5), ALI))
    o.append(T(X(d1) + 8, Y(600), "短いねじ（L = 5 mm）", "start", 11, ALI, True))
    o.append(T(X(d1) + 8, Y(600) + 15, "2 µm へたると 1000 → 585 N", "start", 10.5, ALI))
    o.append(D(X(d2 - 2), Y(1000 - 103.6), SIG))
    o.append(T(X(d2) - 4, Y(1000) - 10, "長いねじ（L = 20 mm）", "end", 11, SIG, True))
    o.append(T(X(d2) + 10, Y(870), "2 µm へたると 1000 → 896 N", "start", 10.5, SIG))
    return SVG(860, 280, o, "M3 鋼ねじ（有効断面積 5.03 mm²）のばねとしての特性。同じ 2 µm のへたりでも、締め付ける長さが長いほど軸力の減りが小さい。")
F["e08_grip"] = _f08_grip()


def _f08_spacing():
    o = []
    def lid(x, n, c, title, sub):
        o.append(T(x + 180, 24, title, "middle", 12.5, c, True))
        o.append(RECT(x, 120, 360, 40, 0, SCR, MUT, 1.2))
        xs = [x + 20 + 320 * k / (n - 1) for k in range(n)]
        span = xs[1] - xs[0]
        amp = 2.0 + 30 * (span / 320) ** 3
        pts = []
        for i in range(181):
            u = i / 180
            xx = x + 360 * u
            # 隣のねじの間でふくらむ
            k = min(int((xx - xs[0]) / span), n - 2) if xx > xs[0] else 0
            v = (xx - xs[k]) / span
            v = min(max(v, 0), 1)
            pts.append((xx, 112 - amp * (math.sin(math.pi * v)) ** 2))
        o.append(PL([(x, 112)] + pts[1:], c, 2.0))
        for s in xs:
            o.append(RECT(s - 6, 92, 12, 8, 2, SSOFT, SIG, 1.2))
            o.append(W(s, 100, s, 140, c=SIG, lw=2))
        o.append(T(x + 180, 186, sub, "middle", 10.5, c))
    lid(40, 3, ALI, "ねじの間隔が広い", "ねじの間で蓋が浮き、隙間ができる")
    lid(470, 5, SIG, "間隔を半分に", "浮きは間隔の 3 乗に比例して小さくなる")
    return SVG(860, 206, o, "ねじとねじの間の蓋は、はりのようにたわむ（誇張して描いている）。間隔を半分にすると、同じ荷重形式なら浮きはおよそ 1/8 になる。")
F["e08_spacing"] = _f08_spacing()
