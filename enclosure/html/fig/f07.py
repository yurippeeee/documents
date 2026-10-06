# -*- coding: utf-8 -*-
# 07. 公差と寸法の積み上げ の図

def _f07_gauss(x0, xb, w, mu, sg, amp, lo, hi, c=SIG, lw=2.0, n=200, fill=None):
    """x 軸 [lo, hi] を画面幅 w に写した正規分布の曲線。xb は基線の y。"""
    pts = []
    for i in range(n + 1):
        v = lo + (hi - lo) * i / n
        yv = amp * math.exp(-0.5 * ((v - mu) / sg) ** 2)
        pts.append((x0 + w * i / n, xb - yv))
    s = PL(pts, c, lw)
    if fill:
        poly = [(x0, xb)] + pts + [(x0 + w, xb)]
        d = " ".join("%g,%g" % (round(a, 2), round(b, 2)) for a, b in poly)
        s = '<polygon points="%s" fill="%s" stroke="none"/>' % (d, fill) + s
    return s


def _f07_scatter():
    o = []
    x0, w, xb = 80, 700, 230
    lo, hi = 19.80, 20.20
    X = lambda v: x0 + w * (v - lo) / (hi - lo)
    mu, sg = 20.0, 0.10 / 3
    # 度数分布（棒）
    import random as _r
    rnd = _r.Random(7)
    bins = [0] * 24
    for _ in range(600):
        v = rnd.gauss(mu, sg)
        k = int((v - lo) / (hi - lo) * 24)
        if 0 <= k < 24:
            bins[k] += 1
    bw = w / 24
    mx = max(bins)
    for k, cnt in enumerate(bins):
        hgt = 150 * cnt / mx
        o.append(RECT(x0 + k * bw + 1, xb - hgt, bw - 2, hgt, 0, SSOFT, "none", 0))
    o.append(_f07_gauss(x0, xb, w, mu, sg, 150, lo, hi, SIG, 2.0))
    o.append(W(x0, xb, x0 + w, xb, c=MUT, lw=1.4))
    for v in (19.8, 19.9, 20.0, 20.1, 20.2):
        o.append(W(X(v), xb, X(v), xb + 5, c=MUT, lw=1))
        o.append(T(X(v), xb + 19, "%.2f" % v, "middle", 10.5, MUT, mono=True))
    o.append(T(x0 + w, xb + 38, "出来上がった寸法 [mm]", "end", 10.5, MUT, True))
    # 公差の上限・下限
    for v, s in ((19.9, "下の許容限界 19.90"), (20.1, "上の許容限界 20.10")):
        o.append(W(X(v), 48, X(v), xb, c=ALI, lw=1.6, dash="5,4"))
        o.append(T(X(v), 40, s, "middle", 11, ALI, True))
    o.append(W(X(20.0), 62, X(20.0), xb, c=INK, lw=1.2, dash="2,3"))
    o.append(T(X(20.0), 56, "基準寸法 20.00", "middle", 11, INK, True))
    o.append(DIM(X(20.0), 205, X(20.0 + 3 * sg), 205, "3σ", SIG, 10.5))
    o.append(DIM(X(20.0 - 3 * sg), 205, X(20.0), 205, "3σ", SIG, 10.5))
    o.append(T(X(19.84), 120, "同じ図面・同じ型でも", "middle", 11, MUT))
    o.append(T(X(19.84), 136, "1 個ずつ寸法が違う", "middle", 11, MUT))
    o.append(T(X(20.16), 120, "公差の範囲に入れば", "middle", 11, MUT))
    o.append(T(X(20.16), 136, "合格", "middle", 11, MUT))
    return SVG(860, 290, o, "20.00 mm を狙って 600 個作ったときの寸法のばらつき（模式図）。"
               "棒が度数、曲線が正規分布。公差は「この範囲なら合格」とする幅で、ここでは ±0.10 mm を ±3σ に合わせている。")
F["e07_scatter"] = _f07_scatter()


def _f07_notation():
    o = []
    # 左: 部品と寸法表記
    o.append(RECT(60, 90, 300, 80, 4, PAN, INK, 1.6))
    o.append(W(60, 170, 60, 210, c=MUT, lw=1))
    o.append(W(360, 170, 360, 210, c=MUT, lw=1))
    o.append(DARR(60, 200, 360, 200, MUT, 1.3, 6))
    o.append(T(196, 192, "20", "end", 18, INK, True, True))
    o.append(T(200, 180, "+0.1", "start", 12, SIG, True, True))
    o.append(T(200, 196, "−0.2", "start", 12, ALI, True, True))
    o.append(T(210, 60, "図面での書き方", "middle", 12, INK, True))
    o.append(T(210, 240, "基準寸法 20、上の許容差 +0.1、下の許容差 −0.2", "middle", 10.5, MUT))
    # 右: 数直線
    x0, x1, yy = 470, 830, 150
    lo, hi = 19.7, 20.2
    X = lambda v: x0 + (x1 - x0) * (v - lo) / (hi - lo)
    o.append(T(650, 60, "数直線で見ると", "middle", 12, INK, True))
    o.append(W(x0, yy, x1, yy, c=MUT, lw=1.4))
    o.append(RECT(X(19.8), yy - 14, X(20.1) - X(19.8), 28, 3, SSOFT, SIG, 1.4))
    for v, s, c in ((19.8, "最小許容寸法 19.8", ALI), (20.0, "基準寸法 20.0", INK), (20.1, "最大許容寸法 20.1", SIG)):
        o.append(W(X(v), yy - 22, X(v), yy + 22, c=c, lw=1.8))
    o.append(T(X(19.8), yy + 40, "最小許容寸法 19.8", "middle", 10.5, ALI, True))
    o.append(T(X(20.1), yy - 30, "最大許容寸法 20.1", "middle", 10.5, SIG, True))
    o.append(T(X(20.0), yy + 40, "基準 20.0", "start", 10.5, INK, True))
    o.append(DIM(X(19.8), yy + 62, X(20.1), yy + 62, None, MUT))
    o.append(T((X(19.8) + X(20.1)) / 2, yy + 82, "公差 = 0.1 − (−0.2) = 0.3", "middle", 10.5, MUT, True))
    return SVG(860, 260, o, "寸法公差の表記。基準寸法に上と下の許容差を添える。2 つの許容差の差が公差（許される幅）である。")
F["e07_notation"] = _f07_notation()


def _f07_loop():
    o = []
    # 筐体（U 字断面）
    L, R, top, bot = 100, 740, 40, 170
    o.append(PL([(L - 18, top), (L - 18, bot + 18), (R + 18, bot + 18), (R + 18, top)], INK, 1.6,
                fill=PAN))
    o.append(RECT(L, top, R - L, bot - top + 1, 0, SCR, "none", 0))
    parts = [("B", "スペーサ", 100, 260, 70), ("C", "基板ホルダ", 260, 460, 100), ("D", "電池", 460, 660, 85)]
    for nm, lab_, a, b, hh in parts:
        o.append(RECT(a, bot - hh, b - a, hh, 3, PAN, GRN, 1.5))
        o.append(T((a + b) / 2, bot - hh / 2 - 2, nm, "middle", 15, GRN, True))
        o.append(T((a + b) / 2, bot - hh / 2 + 16, lab_, "middle", 10.5, MUT))
    o.append(RECT(660, top + 10, 80, bot - top - 10, 0, ASOFT, "none", 0))
    o.append(T(700, 100, "G", "middle", 15, ALI, True))
    o.append(T(700, 118, "隙間", "middle", 10.5, ALI))
    o.append(T(R + 30, 60, "筐体の壁", "start", 10.5, MUT))
    # ループ図
    y1, y2 = 248, 290
    o.append(T(L, 220, "寸法ループ（G の左の面から出発して一周する）", "start", 11.5, INK, True))
    for nm, _l, a, b, _h in reversed(parts):
        o.append(ARR(b - 4, y1, a + 4, y1, GRN, 2.0, 8))
        o.append(T((a + b) / 2, y1 - 8, "−" + nm, "middle", 12, GRN, True, True))
    o.append(ARR(L + 2, y2, R - 2, y2, SIG, 2.0, 8))
    o.append(T((L + R) / 2, y2 + 18, "+A（筐体の内のり）", "middle", 12, SIG, True))
    o.append(W(L, y1 - 4, L, y2 + 4, c=MUT, lw=1, dash="3,3"))
    o.append(ARR(R, y2, R, y1 + 6, MUT, 1.2, 5))
    o.append(W(660, y1, R, y1, c=ALI, lw=2.4))
    o.append(T(700, y1 - 8, "G", "middle", 12, ALI, True, True))
    o.append(W(660, bot + 18, 660, y1, c=MUT, lw=1, dash="3,3"))
    o.append(T(430, 336, "G = A − B − C − D　（右向きを＋、左向きを−として矢印を足す）", "middle", 12, INK, True))
    return SVG(860, 352, o, "寸法ループ（寸法の鎖）。隙間 G の一方の面から出発し、部品の寸法を順にたどって G のもう一方の面に戻る。"
               "向きで符号を付けて足したものが G である。")
F["e07_loop"] = _f07_loop()


def _f07_wcrss():
    o = []
    x0, w, xb = 70, 720, 210
    lo, hi = -0.3, 2.3
    X = lambda v: x0 + w * (v - lo) / (hi - lo)
    sg = 0.5 / 3
    o.append(RECT(X(lo), 50, X(0) - X(lo), xb - 50, 0, ASOFT, "none", 0))
    o.append(T(X(-0.15), 70, "干渉", "middle", 11, ALI, True))
    o.append(_f07_gauss(X(lo), xb, w, 1.0, sg, 130, lo, hi, SIG, 2.0, 300, SSOFT))
    o.append(W(x0, xb, x0 + w, xb, c=MUT, lw=1.4))
    for v in (0, 0.5, 1.0, 1.5, 2.0):
        o.append(W(X(v), xb, X(v), xb + 5, c=MUT, lw=1))
        o.append(T(X(v), xb + 18, "%.1f" % v, "middle", 10.5, MUT, mono=True))
    o.append(T(x0 + w, xb + 18, "G [mm]", "end", 10.5, MUT, True))
    o.append(W(X(0), 50, X(0), xb, c=ALI, lw=1.4))
    # 範囲の帯
    yw, yr = 250, 280
    o.append(RECT(X(0), yw - 9, X(2.0) - X(0), 18, 3, "none", ALI, 1.8))
    o.append(T(X(2.0) + 10, yw + 4, "ワーストケース 0.0〜2.0", "start", 11, ALI, True))
    o.append(RECT(X(0.5), yr - 9, X(1.5) - X(0.5), 18, 3, SSOFT, SIG, 1.8))
    o.append(T(X(1.5) + 10, yr + 4, "RSS 0.5〜1.5（±3σ）", "start", 11, SIG, True))
    o.append(T(X(1.0), 64, "G の分布（σ ≈ 0.167 mm）", "middle", 11, SIG, True))
    o.append(T(X(1.85), 120, "4 個とも同じ側の端に", "middle", 10.5, MUT))
    o.append(T(X(1.85), 135, "そろうことはまれ", "middle", 10.5, MUT))
    return SVG(860, 300, o, "4 部品、各 ±0.25 mm、隙間の基準値 1.0 mm の例。ワーストケースは 0〜2.0 mm の全幅を保証し、"
               "RSS は ±3σ に入る 0.5〜1.5 mm を示す。分布の裾は 0 より左にほとんど出ない。")
F["e07_wcrss"] = _f07_wcrss()


def _f07_fits():
    o = []
    titles = [("すきまばめ", "必ず隙間がある", SIG), ("中間ばめ", "隙間にも締め代にもなる", GRN),
              ("しまりばめ", "必ず締め代がある", ALI)]
    for i, (t, s, c) in enumerate(titles):
        x = 30 + i * 280
        o.append(T(x + 120, 30, t, "middle", 13, c, True))
        o.append(T(x + 120, 48, s, "middle", 10.5, MUT))
        yb = 175
        o.append(W(x, yb, x + 250, yb, c=INK, lw=1.4, dash="5,3"))
        # 穴の公差域（基準線の上）
        o.append(RECT(x + 30, yb - 50, 70, 50, 2, "none", INK, 1.6))
        o.append(T(x + 65, yb - 20, "穴", "middle", 12, INK, True))
        sh = [(yb + 20, yb + 70), (yb - 30, yb + 25), (yb - 105, yb - 60)][i]
        o.append(RECT(x + 140, sh[0] - (0 if i else 0), 70, sh[1] - sh[0], 2, SSOFT if i == 0 else (ASOFT if i == 2 else PAN), c, 1.6))
        o.append(T(x + 175, (sh[0] + sh[1]) / 2 + 4, "軸", "middle", 12, c, True))
    o.append(T(20, 145, "", "start", 10))
    o.append(T(430, 276, "破線 = 基準寸法。四角 = 公差域（その部品が取りうる寸法の範囲）。上ほど大きい寸法。", "middle", 11, MUT))
    return SVG(860, 292, o, "はめあいの 3 種類。穴の公差域と軸の公差域の上下関係で決まる。")
F["e07_fits"] = _f07_fits()


def _f07_gdt():
    o = []
    # 左: 平面度
    o.append(T(200, 28, "平面度: 面が 2 枚の平行な平面の間に入る", "middle", 12, INK, True))
    o.append(RECT(40, 120, 320, 70, 0, PAN, INK, 1.4))
    pts = []
    for i in range(121):
        u = i / 120
        pts.append((40 + 320 * u, 98 + 9 * math.sin(2 * math.pi * 1.6 * u + 0.4) + 4 * math.sin(2 * math.pi * 4.3 * u)))
    o.append(PL([(40, 190), (40, pts[0][1])] + pts + [(360, 190)], INK, 1.6, fill=PAN))
    o.append(W(30, 84, 370, 84, c=SIG, lw=1.4, dash="5,3"))
    o.append(W(30, 112, 370, 112, c=SIG, lw=1.4, dash="5,3"))
    o.append(DIM(380, 84, 380, 112, "t = 0.1", SIG, 10.5))
    o.append(T(200, 215, "傾いていても、うねりの全幅が t 以下なら合格", "middle", 10.5, MUT))
    o.append(T(200, 232, "（± の寸法公差では「平らさ」を指定できない）", "middle", 10.5, MUT))
    # 右: 位置度
    cx, cy = 640, 130
    o.append(T(640, 28, "位置度: 穴の中心が真位置のまわりの円に入る", "middle", 12, INK, True))
    s = 50  # 0.1 mm = 50 px
    o.append(RECT(cx - s, cy - s, 2 * s, 2 * s, 0, ASOFT, ALI, 1.6))
    o.append(CIRC(cx, cy, s * math.sqrt(2), SIG, 1.8, SSOFT))
    o.append(RECT(cx - s, cy - s, 2 * s, 2 * s, 0, "none", ALI, 1.6))
    o.append(W(cx - 8, cy, cx + 8, cy, c=INK, lw=1.2))
    o.append(W(cx, cy - 8, cx, cy + 8, c=INK, lw=1.2))
    o.append(T(cx + 6, cy + 20, "真位置", "start", 10, INK))
    o.append(W(cx, cy, cx + s, cy - s, c=MUT, lw=1, dash="3,3"))
    o.append(T(cx - 150, 60, "±0.1 の正方形", "middle", 11, ALI, True))
    o.append(T(cx - 150, 76, "角は中心から 0.141", "middle", 10.5, ALI))
    o.append(W(cx - 150, 82, cx - s - 2, cy - s + 6, c=ALI, lw=1))
    o.append(T(cx + 150, 60, "直径 0.28 の円", "middle", 11, SIG, True))
    o.append(T(cx + 150, 76, "どの方向にも 0.141", "middle", 10.5, SIG))
    o.append(W(cx + 150, 82, cx + s * 1.1, cy - s * 0.95, c=SIG, lw=1))
    o.append(T(640, 232, "円の公差域は正方形より面積が約 1.57 倍広い", "middle", 10.5, MUT))
    return SVG(860, 250, o, "幾何公差の例。平面度は形のずれ、位置度は穴の中心の位置のずれを、公差域（入っていればよい領域）で指定する。")
F["e07_gdt"] = _f07_gdt()


def _f07_datum():
    o = []
    def plate(x, y, c, title, sub, chain):
        o.append(T(x + 180, y - 14, title, "middle", 12.5, c, True))
        o.append(RECT(x, y, 360, 90, 4, PAN, INK, 1.4))
        hx = [x + 60, x + 160, x + 260]
        for h in hx:
            o.append(CIRC(h, y + 45, 10, INK, 1.4))
        o.append(W(x, y + 90, x, y + 150, c=MUT, lw=1))
        for h in hx:
            o.append(W(h, y + 57, h, y + 150, c=MUT, lw=0.8, dash="2,3"))
        if chain:
            prev = x
            for k, h in enumerate(hx):
                o.append(DIM(prev, y + 125, h, y + 125, "±0.1", c, 10))
                prev = h
            o.append(T(x + 180, y + 172, sub, "middle", 10.5, c, True))
        else:
            for k, h in enumerate(hx):
                yy = y + 105 + 18 * k
                o.append(DIM(x, yy, h, yy, None, c))
                o.append(T(h + 6, yy + 4, "±0.1", "start", 10, c))
            o.append(T(x + 180, y + 172, sub, "middle", 10.5, c, True))
        o.append(T(x - 6, y + 160, "基準", "end", 10, MUT))
    plate(50, 50, ALI, "直列寸法（悪い例）", "3 番目の穴は基準から ±0.3（誤差が積み上がる）", True)
    plate(470, 50, SIG, "並列寸法（良い例）", "どの穴も基準から ±0.1", False)
    return SVG(860, 240, o, "寸法を同じ基準から入れると、ループに入る寸法の数が減り、積み上げが小さくなる。")
F["e07_datum"] = _f07_datum()

