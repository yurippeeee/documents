# -*- coding: utf-8 -*-
# 03. 材料の選び方 の図（figures.py から exec で読み込まれる）

# 名前, E [MPa], 密度 [g/cm3], 種別（0 樹脂, 1 強化樹脂, 2 金属）
_E03_MATS = [("ABS", 2300, 1.05, 0), ("PC", 2400, 1.20, 0), ("PC/ABS", 2300, 1.15, 0), ("PP", 1500, 0.91, 0),
             ("PA66", 3000, 1.14, 0), ("POM", 2800, 1.41, 0), ("PA66-GF30", 9000, 1.37, 1),
             ("A5052", 70000, 2.68, 2), ("ADC12", 71000, 2.70, 2), ("SPCC", 205000, 7.85, 2), ("SUS304", 193000, 7.93, 2)]

# ---------- ヤング率と密度の地図 ----------
def _e03_map():
    o = []
    X0, X1, Y0, Y1 = 90, 600, 330, 30
    lx0, lx1 = math.log10(0.8), math.log10(10)
    ly0, ly1 = math.log10(1), math.log10(300)
    X = lambda r: X0 + (math.log10(r) - lx0) / (lx1 - lx0) * (X1 - X0)
    Y = lambda e: Y0 - (math.log10(e) - ly0) / (ly1 - ly0) * (Y0 - Y1)
    o.append(RECT(X0, Y1, X1 - X0, Y0 - Y1, 0, "none", LIN, 1))
    for r in (1, 2, 5, 10):
        o.append(W(X(r), Y1, X(r), Y0, c=LIN, lw=0.8))
        o.append(T(X(r), Y0 + 16, "%g" % r, "middle", 10, MUT))
    for e in (1, 3, 10, 30, 100, 300):
        o.append(W(X0, Y(e), X1, Y(e), c=LIN, lw=0.8))
        o.append(T(X0 - 6, Y(e) + 4, "%g" % e, "end", 10, MUT))
    o.append(T((X0 + X1) / 2, Y0 + 34, "密度 ρ [g/cm³]（対数目盛）", "middle", 10.5, MUT, True))
    o.append(T(X0 - 6, Y1 - 10, "ヤング率 E [GPa]（対数目盛）", "start", 10.5, MUT, True))
    # 同じ剛性で同じ質量になる線: E^(1/3)/ρ 一定 → E ∝ ρ^3（ABS を通る）
    e0, r0 = 2.3, 1.05
    pts = []
    for i in range(60):
        r = 0.8 * (10 / 0.8) ** (i / 59)
        e = e0 * (r / r0) ** 3
        if 1 <= e <= 300:
            pts.append((X(r), Y(e)))
    o.append(PL(pts, MUT, 1.3, "6,4"))
    o.append(T(X(1.9), Y(e0 * (1.9 / r0) ** 3) - 8, "ABS と同じ質量の線", "end", 10, MUT))
    o.append(T(X(2.6), Y(e0 * (2.6 / r0) ** 3) + 4, "← 線より左上なら ABS より軽く同じ剛性", "start", 10, SIG))
    off = {"ABS": (8, 14, "start"), "PC": (8, -6, "start"), "PC/ABS": (-8, -8, "end"), "PP": (-8, 4, "end"),
           "PA66": (-8, -6, "end"), "POM": (8, 4, "start"), "PA66-GF30": (8, 4, "start"),
           "A5052": (-8, -8, "end"), "ADC12": (8, 4, "start"), "SPCC": (-8, -6, "end"), "SUS304": (8, 14, "start")}
    for n, e, r, kind in _E03_MATS:
        c = [SIG, GRN, INK][kind]
        x, y = X(r), Y(e / 1000)
        o.append(D(x, y, c, 4.5))
        dx, dy, an = off[n]
        o.append(T(x + dx, y + dy, n, an, 10.5, c, True))
    # 凡例
    lx = 640
    for i, (c, t) in enumerate([(SIG, "樹脂"), (GRN, "ガラス繊維強化樹脂"), (INK, "金属")]):
        o.append(D(lx, 60 + i * 24, c, 5))
        o.append(T(lx + 12, 64 + i * 24, t, "start", 11, INK))
    o.append(T(lx - 6, 160, "樹脂は左下に固まり、", "start", 10.5, MUT))
    o.append(T(lx - 6, 176, "金属とは E が 30〜90 倍違う。", "start", 10.5, MUT))
    o.append(T(lx - 6, 200, "点線は 3 節の質量比", "start", 10.5, MUT))
    o.append(T(lx - 6, 216, "ρE^(−1/3) が ABS と等しい線。", "start", 10.5, MUT))
    return SVG(860, 380, o, "筐体に使う材料のヤング率と密度（代表値、両軸とも対数目盛）。樹脂どうしの差は小さく、樹脂と金属の差は桁で違う。")
F["e03_map"] = _e03_map()

# ---------- アルミと ABS の性質の比 ----------
def _e03_ratio():
    o = []
    rows = [("ヤング率 E", 70000 / 2300, "約 30 倍（硬い）"), ("降伏応力（強さ）", 200 / 40, "約 5 倍"),
            ("密度 ρ", 2.68 / 1.05, "約 2.6 倍（重い）"), ("熱伝導率 λ", 138 / 0.17, "約 800 倍（熱を通す）"),
            ("線膨張係数 α", 24 / 80, "約 0.3 倍（伸び縮みが小さい）")]
    X0, X1 = 250, 690
    lx0, lx1 = -1, 3
    X = lambda v: X0 + (math.log10(v) - lx0) / (lx1 - lx0) * (X1 - X0)
    o.append(T(30, 26, "アルミ（A5052）÷ ABS の比（代表値、対数目盛）", "start", 12, INK, True))
    for v, s in ((0.1, "0.1"), (1, "1（同じ）"), (10, "10"), (100, "100"), (1000, "1000")):
        o.append(W(X(v), 46, X(v), 250, c=LIN if v != 1 else INK, lw=0.8 if v != 1 else 1.4))
        o.append(T(X(v), 266, s, "middle", 10, MUT))
    for i, (n, r, s) in enumerate(rows):
        y = 70 + i * 44
        o.append(T(X0 - 12, y + 5, n, "end", 11.5, INK, True))
        x1 = X(r)
        c = SIG if r >= 1 else GRN
        o.append(RECT(min(X(1), x1), y - 10, abs(x1 - X(1)), 20, 3, c, c, 0))
        if r >= 1:
            o.append(T(x1 + 8, y + 5, s, "start", 10.5, INK))
        else:
            o.append(T(X(1) + 8, y + 5, s, "start", 10.5, INK))
    o.append(T(X0 - 12, 300, "電気", "end", 11.5, INK, True))
    o.append(T(X(1) + 8, 300, "アルミは導体、ABS は絶縁体（比では表せないほど違う）", "start", 10.5, INK))
    return SVG(860, 316, o, "同じ大きさの部品をアルミと ABS で作ったときの性質の比。剛性と熱伝導で特に大きく違う。")
F["e03_ratio"] = _e03_ratio()

# ---------- クリープと応力緩和 ----------
def _e03_creep():
    o = []
    for k in range(2):
        x0 = 70 + k * 410
        o.append(AXES(x0, 230, 320, 190, "時間 →", None))
    # 左: 一定荷重でのひずみ
    x0 = 70
    o.append(T(x0 - 10, 26, "一定の荷重をかけ続けたときのひずみ", "start", 12, INK, True))
    o.append(T(x0 - 8, 52, "ひずみ", "end", 10.5, MUT, True))
    def curve(e0, e1, x0, c, lw=2.2, dash=None):
        pts = [(x0, 230), (x0, 230 - e0)]
        for i in range(1, 41):
            u = i / 40
            pts.append((x0 + u * 300, 230 - e0 - (e1 - e0) * (1 - math.exp(-3 * u)) * (0.75 + 0.25 * u)))
        return PL(pts, c, lw, dash)
    o.append(curve(110, 175, x0, ALI))
    o.append(curve(70, 100, x0, SIG))
    o.append(PL([(x0, 230), (x0, 222), (x0 + 300, 222)], GRN, 2.2))
    o.append(T(x0 + 302, 60, "樹脂・高温", "end", 10.5, ALI, True))
    o.append(T(x0 + 302, 118, "樹脂・室温", "end", 10.5, SIG, True))
    o.append(T(x0 + 302, 214, "金属（室温）: ほぼ増えない", "end", 10.5, GRN, True))
    o.append(T(x0 + 8, 168, "荷重をかけた瞬間の", "start", 9.5, MUT))
    o.append(T(x0 + 8, 181, "弾性変形 σ/E", "start", 9.5, MUT))
    # 右: 一定変形での力
    x0 = 480
    o.append(T(x0 - 10, 26, "一定の変形に保ったときの力（応力緩和）", "start", 12, INK, True))
    o.append(T(x0 - 8, 52, "力", "end", 10.5, MUT, True))
    pts = [(x0, 230), (x0, 60)]
    for i in range(1, 41):
        u = i / 40
        pts.append((x0 + u * 300, 60 + 70 * (1 - math.exp(-3.5 * u)) + 10 * u))
    o.append(PL(pts, ALI, 2.2))
    o.append(PL([(x0, 60), (x0 + 300, 64)], GRN, 2.2, "6,4"))
    o.append(T(x0 + 300, 52, "金属", "end", 10.5, GRN, True))
    o.append(T(x0 + 300, 160, "樹脂: 締め付けた力が抜けていく", "end", 10.5, ALI, True))
    o.append(T(x0 + 20, 200, "例: 樹脂のボスにねじで締めた部品、", "start", 9.5, MUT))
    o.append(T(x0 + 20, 214, "はめ込んだまま押さえ続けるつめ", "start", 9.5, MUT))
    return SVG(860, 250, o, "クリープ（左）と応力緩和（右）の模式図。樹脂は室温でも時間とともに変形が増え、高温ほど速い。変形を一定に保つと、押さえる力が時間とともに減る。")
F["e03_creep"] = _e03_creep()

# ---------- 同じ曲げ剛性の板厚と質量 ----------
def _e03_equal():
    o = []
    E0, r0, t0 = 2300, 1.05, 2.0
    rows = [("ABS", 2300, 1.05), ("PC", 2400, 1.20), ("PA66-GF30", 9000, 1.37),
            ("A5052", 70000, 2.68), ("SPCC", 205000, 7.85)]
    s = 22  # px/mm
    o.append(T(30, 24, "板の断面（厚さは実寸の比）", "start", 12, INK, True))
    o.append(T(520, 24, "質量（ABS = 1）", "start", 12, INK, True))
    for i, (n, e, r) in enumerate(rows):
        y = 64 + i * 56
        t = t0 * (E0 / e) ** (1 / 3)
        m = (r / r0) * (E0 / e) ** (1 / 3)
        c = SIG if m < 0.95 else (ALI if m > 1.05 else MUT)
        o.append(T(140, y + 4, n, "end", 11.5, INK, True))
        o.append(RECT(156, y - t * s / 2, 250, t * s, 1, PAN if i == 0 else SSOFT, INK if i == 0 else SIG, 1.3))
        o.append(T(416, y + 4, "%.2f mm" % t, "start", 11, INK, True))
        o.append(RECT(520, y - 9, m * 160, 18, 3, c, c, 0))
        o.append(T(520 + m * 160 + 8, y + 5, "%.2f 倍" % m, "start", 11, c, True))
    o.append(W(520 + 160, 44, 520 + 160, 64 + 4 * 56 + 16, c=INK, lw=1, dash="3,3"))
    return SVG(860, 320, o, "ABS 2 mm の板と同じ曲げ剛性にするための板厚と、そのときの質量（代表値で計算）。金属は薄くできるが、鋼は薄くしても密度が高いので重くなる。")
F["e03_equal"] = _e03_equal()

# ---------- 樹脂の選び方の流れ ----------
def _e03_resin():
    o = []
    qs = [("ABS の荷重たわみ温度では足りない、または高い剛性・強さが要る", "PA66-GF・PC-GF などの強化グレード、PC"),
          ("難燃（V-0 など）が要る", "難燃グレードの PC/ABS、PC"),
          ("透明にしたい、または割れにくさ（耐衝撃）が特に要る", "PC（透明は無強化の PC）"),
          ("一体ヒンジ・薬品への強さ・低コストが要る", "PP"),
          ("摺動（こすれ）・繰り返し曲がるばね", "POM"),]
    qx, qw, ax, aw, bh, gap = 30, 400, 560, 270, 46, 16
    y = 14
    for i, (q, a) in enumerate(qs):
        o.append(BOX(qx, y, qw, bh, q, None, LIN, PAN, INK, 8, 1.4, 11))
        o.append(ARR(qx + qw, y + bh / 2, ax - 3, y + bh / 2, SIG, 1.6))
        o.append(T((qx + qw + ax) / 2, y + bh / 2 - 6, "はい", "middle", 10, SIG, True))
        o.append(BOX(ax, y, aw, bh, a, None, SIG, SSOFT, INK, 8, 1.4, 11))
        o.append(ARR(qx + 40, y + bh, qx + 40, y + bh + gap - 2, MUT, 1.4, 6))
        o.append(T(qx + 48, y + bh + gap / 2 + 4, "いいえ", "start", 9.5, MUT))
        y += bh + gap
    o.append(BOX(qx, y, qw, bh, "ABS（成形しやすく、外観・塗装・めっきが良い）", None, SIG, SSOFT, INK, 8, 1.4, 11))
    o.append(T(qx + qw + 20, y + bh / 2 + 4, "条件が重なるときは、上の段の条件を優先して候補を絞り、", "start", 10, MUT))
    o.append(T(qx + qw + 20, y + bh / 2 + 20, "最後はデータシートで全部の要求を確かめる", "start", 10, MUT))
    return SVG(860, y + bh + 30, o, "樹脂の候補を絞る手順の一例。上から順に、満たせる材料が限られる条件を先に確認する。")
F["e03_resin"] = _e03_resin()

# ---------- ガラス繊維の配向と反り ----------
def _e03_gf():
    o = []
    x0, y0, w, h = 60, 60, 360, 170
    o.append(T(x0, 36, "成形品を上から見た図", "start", 12, INK, True))
    o.append(RECT(x0, y0, w, h, 4, PAN, INK, 1.4))
    o.append(TRI([(x0 - 26, y0 + h / 2 - 12), (x0 - 2, y0 + h / 2), (x0 - 26, y0 + h / 2 + 12)], ALI, 1.2, ALI))
    o.append(T(x0 - 30, y0 + h / 2 + 30, "ゲート", "middle", 10, ALI, True))
    # 繊維
    k = 0
    for j in range(7):
        for i in range(12):
            k += 1
            cx = x0 + 22 + i * 28 + 8 * math.sin(k * 1.7)
            cy = y0 + 16 + j * 23 + 5 * math.sin(k * 2.3)
            ang = 0.25 * math.sin(k * 3.1)
            if i < 2:
                ang += 0.9 * math.sin(k * 1.3)
            dx, dy = 9 * math.cos(ang), 9 * math.sin(ang)
            o.append(W(cx - dx, cy - dy, cx + dx, cy + dy, c=SIG, lw=1.6))
    o.append(ARR(x0 + 60, y0 + h + 22, x0 + w - 20, y0 + h + 22, MUT, 1.4))
    o.append(T(x0 + w / 2, y0 + h + 40, "樹脂が流れる向き＝繊維がそろう向き", "middle", 10.5, MUT))
    # 右: 性質と反り
    rx = 470
    o.append(T(rx, 36, "向きによる違い（無強化の樹脂に比べて）", "start", 12, INK, True))
    rows = [("流れ方向", "剛性・強さが大きく上がる。成形収縮は小さい", SIG),
            ("直角方向", "上がり方が小さい。成形収縮は大きい", ALI)]
    for i, (a, b, c) in enumerate(rows):
        o.append(BOX(rx, 52 + i * 56, 360, 46, a, b, c, PAN, INK, 8, 1.4, 11.5, 10))
    o.append(T(rx, 196, "収縮の差 → 反り（側面から見た図）", "start", 11, INK, True))
    pts = [(rx + 30 + i * 7.5, 232 - 26 * math.sin(math.pi * i / 40)) for i in range(41)]
    o.append(PL(pts, ALI, 5))
    o.append(W(rx + 30, 236, rx + 330, 236, c=MUT, lw=1, dash="4,3"))
    o.append(T(rx + 340, 238, "設計した形", "start", 9.5, MUT))
    return SVG(860, 290, o, "ガラス繊維強化樹脂の異方性。繊維は樹脂の流れに沿ってそろうので、向きによって剛性・強さ・収縮が違い、反りの原因になる。")
F["e03_gf"] = _e03_gf()
