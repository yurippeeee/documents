# -*- coding: utf-8 -*-
# 13. 熱設計 の図（figures.py から exec される）

def _f13_res(x1, x2, y, c=INK, lab=None, sub=None, lw=1.5):
    """水平の抵抗記号（ジグザグ）＋リード線。lab は上、sub は下に置く。"""
    m = (x1 + x2) / 2; zw = 44; n = 6
    pts = [(x1, y), (m - zw / 2, y)]
    for i in range(n):
        pts.append((m - zw / 2 + zw * (i + 0.5) / n, y + (-7 if i % 2 == 0 else 7)))
    pts += [(m + zw / 2, y), (x2, y)]
    o = [PL(pts, c, lw)]
    if lab:
        o.append(T(m, y - 13, lab, "middle", 10.5, INK, True))
    if sub:
        o.append(T(m, y + 22, sub, "middle", 9.5, MUT))
    return "".join(o)

def _f13_par(x1, x2, y, labs, gap=30, e=32):
    """2 本並列の抵抗"""
    ya, yb = y - gap, y + gap
    o = [W(x1, y, x1 + e, y), W(x1 + e, ya, x1 + e, yb), W(x2 - e, ya, x2 - e, yb), W(x2 - e, y, x2, y)]
    o.append(_f13_res(x1 + e, x2 - e, ya, INK, labs[0]))
    o.append(_f13_res(x1 + e, x2 - e, yb, INK, None, labs[1]))
    return "".join(o)

def _f13_node(x, y, lab, c=INK):
    return D(x, y, c, 4) + T(x, y - 14, lab, "middle", 10.5, c, True)


# ---- 1. 熱の流れ ----
def _f13_path():
    o = []
    # 筐体の断面
    x0, y0, w, h, t = 170, 26, 520, 190, 10
    o.append(RECT(x0, y0, w, h, 10, LIN, INK, 1.4))
    o.append(RECT(x0 + t, y0 + t, w - 2 * t, h - 2 * t, 5, SCR, LIN, 1))
    # 基板とボス
    o.append(RECT(250, 160, 360, 8, 1, GRN, GRN, 1))
    for bx in (268, 580):
        o.append(RECT(bx, 168, 12, y0 + h - t - 168, 0, PAN, MUT, 1.1))
    # 部品
    o.append(RECT(395, 134, 70, 26, 3, ASOFT, ALI, 1.6))
    o.append(T(430, 151, "部品 P", "middle", 10.5, ALI, True))
    # 部品→基板（伝導）
    o.append(ARR(470, 164, 560, 164, ALI, 1.6))
    o.append(T(470, 186, "基板の銅箔で広がる（伝導）", "start", 9.5, MUT))
    # 対流（内部）
    for xx in (405, 455):
        o.append(PL([(xx, 128), (xx - 5, 115), (xx + 5, 100), (xx, 86)], SIG, 1.5))
        o.append(ARR(xx, 92, xx, 80, SIG, 1.5, 6))
    o.append(T(330, 92, "内部の空気へ（対流）", "middle", 9.5, SIG))
    # 放射
    o.append(ARR(465, 132, 560, 40, GRN, 1.4))
    o.append(T(570, 66, "壁へ（放射）", "start", 9.5, GRN))
    # ボス経由
    o.append(ARR(274, 175, 274, 202, MUT, 1.4, 6))
    o.append(T(290, 200, "ボスを通る伝導", "start", 9.5, MUT))
    # 壁を通る
    o.append(ARR(430, 30, 430, 6, INK, 1.6, 6))
    o.append(T(440, 14, "壁を通り（伝導）外面から外気へ（対流＋放射）", "start", 9.5, INK))
    # 外気
    for yy in (60, 120, 180):
        o.append(ARR(700, yy, 740, yy, MUT, 1.4, 6))
        o.append(ARR(160, yy, 120, yy, MUT, 1.4, 6))
    o.append(T(750, 124, "外気 Ta", "start", 11, MUT, True))
    o.append(T(110, 124, "外気 Ta", "end", 11, MUT, True))
    # 下段: 流れの鎖
    items = [("部品", "発熱 P [W]", ALI, ASOFT), ("基板", "銅箔・ビア"), ("内部の空気", "温まって滞留"),
             ("筐体の壁", "内面 → 外面"), ("外気", "周囲温度 Ta", SIG, SSOFT)]
    s, _ = flowright(24, 285, items, w=136, bh=50, gap=38, c=LIN, fill=PAN,
                     note=["伝導", "対流", "対流・放射", "対流・放射"])
    o.append(s)
    o.append(T(430, 336, "温度は熱の流れに沿って下がる。途中のどこかが細い（熱抵抗が大きい）と、そこより上流がすべて熱くなる", "middle", 10, FNT))
    return SVG(860, 348, o, "密閉筐体の熱の流れ。部品の熱は基板・内部の空気・壁を順に通り、最後は筐体の外面から外気へ出ていく。")
F["e13_path"] = _f13_path()


# ---- 2. 電気回路とのアナロジー ----
def _f13_analogy():
    o = []
    pairs = [("温度差 ΔT [K]", "↔ 電圧 V [V]"), ("熱流 P [W]", "↔ 電流 I [A]"),
             ("熱抵抗 R [K/W]", "↔ 抵抗 R [Ω]"), ("ΔT = P·R", "↔ V = I·R")]
    for i, (a, b) in enumerate(pairs):
        o.append(BOX(20 + i * 208, 14, 196, 50, a, b, SIG, SSOFT, sz=12.5, ssz=10.5))
    y = 196
    # 熱源（電流源）
    o.append(CIRC(40, y, 13, ALI, 1.6, ASOFT))
    o.append(ARR(40, y + 8, 40, y - 8, ALI, 1.5, 5))
    o.append(T(40, y + 32, "熱源 P", "middle", 10, ALI, True))
    o.append(W(53, y, 80, y))
    xs = [80, 200, 380, 520, 720, 830]
    o.append(_f13_node(80, y, "部品 Tj", ALI))
    o.append(_f13_res(80, 200, y, INK, "R₁", "部品→基板"))
    o.append(_f13_node(200, y, "基板"))
    o.append(_f13_par(200, 380, y, ("R₂ 内部の対流", "R₃ 内部の放射")))
    o.append(_f13_node(380, y, "壁の内面"))
    o.append(_f13_res(380, 520, y, INK, "R₄", "壁の伝導"))
    o.append(_f13_node(520, y, "壁の外面"))
    o.append(_f13_par(520, 720, y, ("R₅ 外の対流", "R₆ 外の放射")))
    o.append(W(720, y, 800, y))
    o.append(_f13_node(800, y, "外気 Ta", SIG))
    # 接地記号（基準温度）
    o.append(W(800, y, 800, y + 22, c=SIG))
    for k, ww in enumerate((22, 14, 6)):
        o.append(W(800 - ww / 2, y + 22 + k * 5, 800 + ww / 2, y + 22 + k * 5, c=SIG))
    o.append(T(430, 290, "直列: R = R₁ + R₂ + …　　並列: 1/R = 1/R₂ + 1/R₃（どちらの道も熱が通れる）", "middle", 11, INK))
    o.append(T(430, 310, "外気 Ta を電気回路の接地（0 V）にあたる基準とみなす", "middle", 10, FNT))
    return SVG(860, 322, o, "熱の流れを電気回路に置き換える。温度差が電圧、熱流が電流、熱抵抗が抵抗にあたる。")
F["e13_analogy"] = _f13_analogy()


# ---- 3. 伝導 ----
def _f13_cond():
    o = []
    # 斜投影の板
    x0, y0, L, H, dx, dy = 210, 70, 150, 110, 60, -40
    face = [(x0, y0), (x0 + dx, y0 + dy), (x0 + dx, y0 + dy + H), (x0, y0 + H)]
    o.append(TRI(face, ALI, 1.4, ASOFT))
    o.append(TRI([(x0, y0), (x0 + L, y0), (x0 + L + dx, y0 + dy), (x0 + dx, y0 + dy)], LIN, 1.2, PAN))
    o.append(TRI([(x0, y0), (x0 + L, y0), (x0 + L, y0 + H), (x0, y0 + H)], LIN, 1.2, PAN))
    o.append(TRI([(x0 + L, y0), (x0 + L + dx, y0 + dy), (x0 + L + dx, y0 + dy + H), (x0 + L, y0 + H)], SIG, 1.4, SSOFT))
    o.append(T(x0 - 45, y0 + 18, "高温面 T₁", "middle", 11, ALI, True))
    o.append(T(x0 + L + dx + 55, y0 - 2, "低温面 T₂", "middle", 11, SIG, True))
    o.append(T(x0 + L / 2, y0 + H / 2 + 4, "熱伝導率 λ", "middle", 11, INK, True))
    for k in range(3):
        yy = y0 + 25 + k * 30
        o.append(ARR(x0 - 70, yy + 10, x0 - 20, yy + 10, ALI, 1.6))
        o.append(ARR(x0 + L + dx + 30, yy - 10, x0 + L + dx + 80, yy - 10, SIG, 1.6))
    o.append(T(x0 - 45, y0 + 128, "P [W]", "middle", 10.5, ALI, True))
    o.append(DIM(x0, y0 + H + 18, x0 + L, y0 + H + 18, None))
    o.append(T(x0 + L / 2, y0 + H + 36, "厚さ L（熱の流れる向きの長さ）", "middle", 10, INK))
    o.append(T(x0 + dx / 2 - 30, y0 + dy - 2, "面積 A", "middle", 10.5, INK, True))
    # 右: 要点
    bx = 520
    o.append(BOX(bx, 30, 320, 46, "R = L / (λA)", "厚いほど・λ が小さいほど・狭いほど通りにくい", SIG, PAN, sz=13, ssz=10))
    o.append(BOX(bx, 90, 320, 46, "L を 2 倍 → R も 2 倍", "厚さ方向に重ねる = 直列", LIN, PAN, sz=12, ssz=10))
    o.append(BOX(bx, 150, 320, 46, "A を 2 倍 → R は半分", "面積を広げる = 並列", LIN, PAN, sz=12, ssz=10))
    return SVG(860, 230, o, "板を厚さ方向に通る熱。熱抵抗は厚さに比例し、熱伝導率と面積に反比例する。")
F["e13_cond"] = _f13_cond()


# ---- 4. 放射の線形化 ----
def _f13_rad():
    o = []
    sg = 5.67e-8; Ta = 298.15; eps = 0.9; hc = 5.0
    ox, oy, gw, gh = 80, 250, 520, 220
    xm, ym = 60.0, 600.0
    X = lambda d: ox + d / xm * gw
    Y = lambda q: oy - q / ym * gh
    for q in range(0, 601, 100):
        o.append(W(ox, Y(q), ox + gw, Y(q), c=LIN, lw=0.6))
        o.append(T(ox - 6, Y(q) + 4, str(q), "end", 9.5, FNT))
    for d in range(0, 61, 10):
        o.append(T(X(d), oy + 16, str(d), "middle", 9.5, FNT))
    o.append(AXES(ox, oy, gw + 20, gh + 16))
    o.append(T(ox + gw + 10, oy + 34, "表面と外気の温度差 ΔT [K]", "end", 10.5, MUT, True))
    o.append(T(ox + 4, oy - gh - 8, "放熱量 q [W/m²]（外気 25 °C）", "start", 10.5, MUT, True))
    ex = [(d, eps * sg * ((Ta + d) ** 4 - Ta ** 4)) for d in [i * 0.5 for i in range(121)]]
    l1 = [(d, eps * 4 * sg * Ta ** 3 * d) for d in (0, 60)]
    l2 = [(d, eps * 4 * sg * (Ta + d / 2) ** 3 * d) for d in [i * 0.5 for i in range(121)]]
    cv = [(d, hc * d) for d in (0, 60)]
    o.append(PL([(X(a), Y(b)) for a, b in ex], ALI, 2.4))
    o.append(PL([(X(a), Y(b)) for a, b in l1], INK, 1.4, "5,4"))
    o.append(PL([(X(a), Y(b)) for a, b in l2], GRN, 1.6, "2,3"))
    o.append(PL([(X(a), Y(b)) for a, b in cv], SIG, 2.0))
    # 凡例
    lx = 630
    leg = [(ALI, None, "放射（正確な式, ε = 0.9）"), (GRN, "2,3", "線形化 4σTm³（平均温度）"),
           (INK, "5,4", "線形化 4σTa³（外気温度）"), (SIG, None, "比較: 自然対流 h = 5")]
    for i, (c, da, s) in enumerate(leg):
        yy = 50 + i * 26
        o.append(PL([(lx, yy), (lx + 26, yy)], c, 2.2, da))
        o.append(T(lx + 32, yy + 4, s, "start", 10, INK))
    o.append(T(lx, 170, "ΔT = 10 K のとき", "start", 10.5, INK, True))
    o.append(T(lx, 188, "放射 ≈ 57 W/m²", "start", 10, ALI))
    o.append(T(lx, 206, "対流 = 50 W/m²", "start", 10, SIG))
    o.append(T(lx, 224, "→ 同じくらい効く", "start", 10, INK))
    return SVG(860, 290, o, "放射の放熱量（赤）と、それを直線で近似したもの。平均温度で線形化すると、実用範囲でほぼ重なる。自然対流と同程度の大きさがある。")
F["e13_rad"] = _f13_rad()


# ---- 5. 樹脂と金属: 熱の広がり ----
def _f13_spread():
    o = []
    import math as _m
    for k, (name, lc, c, fl, note) in enumerate([
            ("樹脂（ABS, λ ≈ 0.2）", 6.3, ALI, ASOFT, "広がり ≈ 6 mm: 部品の真上だけが熱い"),
            ("アルミ（A5052, λ ≈ 138）", 166, SIG, SSOFT, "広がり ≈ 170 mm: 壁全体が温まる")]):
        x0 = 30 + k * 420; y0 = 40; wl = 380; scale = wl / 150.0   # 150 mm の壁
        cx = x0 + wl / 2
        o.append(T(cx, y0 - 14, name, "middle", 12, c, True))
        # 温度上昇の概形
        pts = []
        for i in range(201):
            xm = -75 + 150 * i / 200
            th = _m.exp(-abs(xm) / lc)
            pts.append((cx + xm * scale, y0 + 110 - 90 * th * (0.35 if lc > 50 else 1.0)))
        o.append(W(x0, y0 + 110, x0 + wl, y0 + 110, c=LIN, lw=0.8))
        o.append(PL(pts, c, 2.2))
        o.append(T(x0 - 2, y0 + 14, "温度上昇", "start", 9.5, FNT))
        # 壁
        o.append(RECT(x0, y0 + 124, wl, 12, 2, fl, c, 1.4))
        # 熱源
        o.append(RECT(cx - 16, y0 + 140, 32, 16, 2, ASOFT, ALI, 1.4))
        o.append(T(cx, y0 + 172, "接触した発熱部品", "middle", 9.5, ALI))
        o.append(T(cx, y0 + 196, note, "middle", 10.5, INK))
        o.append(DIM(x0, y0 + 210, x0 + wl, y0 + 210, None))
        o.append(T(cx, y0 + 226, "壁の長さ 150 mm", "middle", 9.5, FNT))
    o.append(T(430, 290, "同じ熱量でも、金属は温度が低く広く、樹脂は高く狭い（金属の曲線は縦方向を縮めて描いている）", "middle", 10, FNT))
    return SVG(860, 300, o, "板厚 2 mm、h = 10 W/(m²·K) の壁に部品が当たっている場合の温度上昇の概形。広がる長さの目安 √(λt/h) は本文で求める。")
F["e13_spread"] = _f13_spread()


# ---- 6. 通風（煙突効果） ----
def _f13_vent():
    o = []
    def box(x0, title, c):
        o.append(T(x0 + 120, 22, title, "middle", 12, c, True))
        o.append(RECT(x0 + 40, 40, 160, 190, 6, SCR, INK, 2.2))
    # 良い例
    x0 = 10; box(x0, "良い: 下から入れて上から出す", SIG)
    o.append(RECT(x0 + 38, 196, 6, 26, 0, SCR, SCR, 0))
    o.append(RECT(x0 + 196, 48, 6, 26, 0, SCR, SCR, 0))
    o.append(RECT(x0 + 100, 170, 50, 16, 2, ASOFT, ALI, 1.3))
    o.append(ARR(x0 + 4, 210, x0 + 60, 210, GRN, 1.8))
    o.append(PL([(x0 + 60, 210), (x0 + 120, 190), (x0 + 125, 130), (x0 + 180, 70), (x0 + 196, 62)], ALI, 1.8))
    o.append(ARR(x0 + 196, 62, x0 + 236, 62, ALI, 1.8))
    o.append(T(x0 + 4, 202, "冷気", "start", 9.5, GRN))
    o.append(T(x0 + 240, 36, "温まった空気", "end", 9.5, ALI))
    o.append(DIM(x0 + 220, 66, x0 + 220, 206, None))
    o.append(T(x0 + 120, 262, "入口と出口の高さの差 H を大きく", "middle", 10, INK))
    # 悪い例
    x0 = 300; box(x0, "悪い: 同じ高さ・上面だけ", ALI)
    o.append(RECT(x0 + 38, 120, 6, 26, 0, SCR, SCR, 0))
    o.append(RECT(x0 + 196, 120, 6, 26, 0, SCR, SCR, 0))
    for xx in (x0 + 90, x0 + 120, x0 + 150):
        o.append(RECT(xx - 8, 38, 16, 6, 0, SCR, SCR, 0))
    o.append(RECT(x0 + 100, 170, 50, 16, 2, ASOFT, ALI, 1.3))
    o.append(PL([(x0 + 110, 166), (x0 + 95, 110), (x0 + 120, 80), (x0 + 145, 110), (x0 + 130, 166)], ALI, 1.4, "4,3"))
    o.append(ARR(x0 + 120, 30, x0 + 120, 46, GRN, 1.6))
    o.append(T(x0 + 120, 262, "流れが生まれず熱がこもる。上面の穴から水が入る", "middle", 10, INK))
    # 防水と両立
    x0 = 590; box(x0, "防水が要るとき: 密閉", GRN)
    o.append(RECT(x0 + 100, 170, 50, 16, 2, ASOFT, ALI, 1.3))
    o.append(RECT(x0 + 110, 186, 30, 36, 0, GRN, GRN, 1))
    o.append(T(x0 + 106, 206, "熱伝導シート", "end", 9, GRN))
    o.append(RECT(x0 + 40, 222, 160, 8, 0, LIN, INK, 1.2))
    o.append(T(x0 + 130, 248, "金属の底板", "start", 9, MUT))
    for yy in (90, 140, 190):
        o.append(ARR(x0 + 204, yy, x0 + 236, yy, MUT, 1.4, 6))
    o.append(ARR(x0 + 120, 234, x0 + 120, 254, MUT, 1.4, 6))
    o.append(T(x0 + 120, 120, "密閉したまま", "middle", 10, INK))
    o.append(T(x0 + 120, 136, "壁から逃がす", "middle", 10, INK))
    o.append(T(x0 + 120, 274, "金属の壁へ伝導・通気膜（12 章）", "middle", 10, INK))
    return SVG(860, 290, o, "自然通風（煙突効果）。温まって軽くなった空気が上の出口から出て、下の入口から冷たい空気が入る。防水が要るなら密閉して壁から逃がす。")
F["e13_vent"] = _f13_vent()


# ---- 7. 熱を筐体へ逃がす ----
def _f13_tim():
    o = []
    for k, (title, c, gapfill, rtxt, sub) in enumerate([
            ("悪い: 空気のすき間 1 mm", ALI, None, "R ≈ 96 K/W", "空気 λ ≈ 0.026 W/(m·K)"),
            ("良い: 熱伝導シートで埋める", SIG, GRN, "R ≈ 0.83 K/W", "シート λ ≈ 3 W/(m·K)")]):
        x0 = 30 + k * 420
        o.append(T(x0 + 180, 22, title, "middle", 12, c, True))
        o.append(RECT(x0, 40, 360, 18, 0, LIN, INK, 1.4))
        o.append(T(x0 + 352, 53, "金属の筐体（壁）", "end", 10, INK))
        if gapfill:
            o.append(RECT(x0 + 140, 58, 80, 22, 1, SSOFT, SIG, 1.4))
            o.append(T(x0 + 230, 73, "熱伝導シート", "start", 9.5, SIG))
            for xx in (x0 + 160, x0 + 180, x0 + 200):
                o.append(ARR(xx, 92, xx, 46, ALI, 1.6, 6))
        else:
            o.append(DIM(x0 + 236, 58, x0 + 236, 80, None))
            o.append(T(x0 + 246, 73, "空気 1 mm", "start", 9.5, ALI))
            o.append(PL([(x0 + 170, 78), (x0 + 166, 70), (x0 + 174, 64)], ALI, 1.2, "2,2"))
        o.append(RECT(x0 + 140, 80, 80, 22, 2, ASOFT, ALI, 1.4))
        o.append(T(x0 + 180, 95, "部品 20×20", "middle", 9.5, ALI, True))
        o.append(RECT(x0 + 20, 102, 320, 8, 0, GRN, GRN, 1))
        o.append(T(x0 + 330, 126, "基板", "end", 9.5, MUT))
        o.append(T(x0 + 180, 152, rtxt, "middle", 14, c, True))
        o.append(T(x0 + 180, 172, sub + "、面積 20×20 mm", "middle", 10, MUT))
        o.append(T(x0 + 180, 192, ("5 W 流すと 480 K の差（流れない）" if k == 0 else "5 W 流しても 4.2 K の差"), "middle", 10.5, INK))
    return SVG(860, 210, o, "部品と金属の壁の間を空気のままにすると、ほとんど熱は渡らない。熱伝導シートで埋めると熱抵抗は 100 分の 1 以下になる（値は代表値）。")
F["e13_tim"] = _f13_tim()
