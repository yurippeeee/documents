# -*- coding: utf-8 -*-
# 04. 射出成形 の図（figures.py から exec される）

def _p04(pts, c=MUT, fill=PAN, lw=1.4):
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"/>' % (d, fill, c, lw)

def _txt04(x, y, s, n, a="start", sz=10, c=MUT, lh=13, b=False):
    o = []
    for i, l in enumerate(_wrap(s, n)):
        o.append(T(x, y + i * lh, l, a, sz, c, b))
    return "".join(o)

# ---- 工程 ----
def _e04_cycle():
    o = []
    items = [("1 型締め", "閉じて強く押さえる"), ("2 射出", "溶けた樹脂を押し込む"),
             ("3 保圧", "縮む分を補う"), ("4 冷却", "固まるまで待つ"),
             ("5 型開き", "可動側が後退する"), ("6 突き出し", "ピンで押し出す")]
    s, _ = flowright(19, 52, items, w=122, bh=62, gap=18, c=SIG, fill=PAN)
    o.append(s)
    o.append(PL([(780, 84), (780, 104), (80, 104), (80, 88)], FNT, 1.3, "4 3"))
    o.append(ARR(80, 92, 80, 86, FNT, 1.3, 6))
    o.append(T(434, 120, "次のショットへ（1 回の成形を「ショット」と呼ぶ）", "middle", 10, FNT))
    # 時間配分の帯
    segs = [("型締め", 1.0), ("射出", 1.5), ("保圧", 4.0), ("冷却", 8.0), ("型開き・突き出し", 3.5)]
    tot = sum(v for _, v in segs)
    x0, x1, y = 40, 820, 168
    x = x0
    cols = [FNT, GRN, GRN, SIG, FNT]
    for (n, v), cc in zip(segs, cols):
        wd = (x1 - x0) * v / tot
        fl = SSOFT if cc == SIG else PAN
        o.append(RECT(x, y, wd, 30, 0, fl, cc, 1.4))
        if wd > 60:
            o.append(T(x + wd / 2, y + 19, "%s %g s" % (n, v), "middle", 10.5, INK, cc == SIG))
        else:
            o.append(T(x + wd / 2, y + 19, n, "middle", 9.5, INK))
        x += wd
    o.append(T(x0, y + 50, "1 ショットの時間配分の例（合計 %g s、ABS 2 mm の部品を想定した例。冷却以外は合計 10 s）。" % tot, "start", 10.5, MUT))
    o.append(T(x0, y + 66, "多くの部品で冷却が最も長く、冷却時間は肉厚で決まる（6 節）。", "start", 10.5, MUT))
    o.append(T(x0, y - 8, "時間 →", "start", 10, FNT))
    return SVG(860, 250, o, "射出成形の 1 サイクル。上は工程の順番、下は時間配分の例。冷却が最も長いことが多い。")
F["e04_cycle"] = _e04_cycle()

# ---- 金型の構造 ----
def _e04_mold():
    o = []
    X0, X1 = 110, 590
    PLY = 220
    # 固定側
    o.append(_p04([(X0, 70), (X1, 70), (X1, PLY), (500, PLY), (500, 130), (200, 130), (200, PLY), (X0, PLY)], MUT, PAN))
    # 可動側
    o.append(_p04([(X0, PLY), (214, PLY), (214, 144), (486, 144), (486, PLY), (X1, PLY), (X1, 330), (X0, 330)], MUT, PAN))
    # 成形品（∩ 形）
    o.append(_p04([(200, PLY), (200, 130), (500, 130), (500, PLY), (486, PLY), (486, 144), (214, 144), (214, PLY)], SIG, SSOFT, 1.6))
    # スプルー
    o.append(_p04([(341, 70), (359, 70), (354, 124), (346, 124)], SIG, SSOFT, 1.4))
    o.append(_p04([(346, 124), (354, 124), (352, 130), (348, 130)], ALI, ASOFT, 1.4))
    # ノズル
    o.append(_p04([(320, 22), (380, 22), (380, 46), (358, 64), (342, 64), (320, 46)], MUT, SCR, 1.4))
    o.append(T(398, 40, "射出機のノズル", "start", 10.5, MUT))
    o.append(ARR(350, 48, 350, 66, SIG, 1.5, 6))
    # エジェクタピンと突き出し板
    for px in (270, 430):
        o.append(RECT(px - 4, 144, 8, 206, 0, SCR, MUT, 1.2))
    o.append(RECT(200, 350, 300, 18, 2, SCR, MUT, 1.3))
    o.append(T(350, 386, "突き出し板", "middle", 10, FNT))
    o.append(ARR(180, 372, 180, 340, INK, 1.6, 7))
    o.append(T(172, 362, "突き出す", "end", 10, INK))
    # 冷却水路
    for cx, cy in ((150, 110), (550, 110), (150, 180), (550, 180), (250, 100), (462, 96), (300, 190), (400, 190), (150, 270), (550, 270), (350, 280)):
        o.append(CIRC(cx, cy, 7, GRN, 1.3, "none"))
    # PL
    o.append(W(60, PLY, 640, PLY, c=INK, lw=1.4, dash="7 4"))
    # 型開き方向
    o.append(ARR(80, 250, 80, 320, INK, 1.8, 8))
    o.append(T(72, 300, "型開き", "end", 10.5, INK, True))
    # ラベル（右側）
    LX = 660
    def lead(x, y, ty, s, c=MUT, b=False):
        return W(x, y, LX - 6, ty, c=FNT, lw=1) + T(LX, ty + 4, s, "start", 11, c, b)
    o.append(lead(590, 95, 92, "固定側（キャビティ側）", INK, True))
    o.append(T(LX, 110, "外側の形をつくる。ノズルが当たる側", "start", 9.5, FNT))
    o.append(lead(640, PLY, 152, "パーティングライン（PL）", INK, True))
    o.append(T(LX, 170, "金型の合わせ面。成形品に線が残る", "start", 9.5, FNT))
    o.append(lead(590, 300, 300, "可動側（コア側）", INK, True))
    o.append(T(LX, 318, "内側の形をつくる。成形品はこちらに残る", "start", 9.5, FNT))
    o.append(lead(434, 250, 238, "エジェクタピン", INK, True))
    o.append(T(LX, 256, "成形品の内側を押す。丸い跡が残る", "start", 9.5, FNT))
    o.append(lead(500, 175, 196, "成形品（樹脂）", SIG, True))
    # 左側ラベル
    o.append(T(362, 124, "← ゲート（細い入口）", "start", 10.5, ALI, True))
    o.append(W(343, 90, 250, 58, c=FNT, lw=1))
    o.append(T(246, 62, "スプルー（流路）", "end", 10.5, SIG))
    o.append(W(143, 110, 104, 132, c=FNT, lw=1))
    o.append(T(100, 146, "冷却水路", "end", 10, GRN))
    return SVG(860, 400, o, "2 枚板の金型の断面（模式図）。固定側と可動側の間にできた空間（キャビティ）に樹脂を流し込む。型が開くと成形品は可動側のコアに付いたまま後退し、エジェクタピンで押し出される。")
F["e04_mold"] = _e04_mold()

# ---- 抜き勾配 ----
def _e04_draft():
    o = []
    # 左: 勾配なし
    def panel(ox, good):
        col = SIG if good else ALI
        soft = SSOFT if good else ASOFT
        d = 16 if good else 0
        base = 300
        top = 110
        # コア
        o.append(_p04([(ox + 40, base), (ox + 40 + d, top), (ox + 260 - d, top), (ox + 260, base)], MUT, PAN))
        # 成形品（コアにかぶる ∩）
        w = 14
        yb = base - 40
        xl = ox + 40 + d * (base - yb) / 190.0
        xr = ox + 260 - d * (base - yb) / 190.0
        o.append(_p04([(xl - w, yb), (ox + 40 + d - w, top - w), (ox + 260 - d + w, top - w), (xr + w, yb),
                       (xr, yb), (ox + 260 - d, top), (ox + 40 + d, top), (xl, yb)], col, soft, 1.6))
        o.append(T(ox + 150, base + 22, "コア（可動側）", "middle", 10.5, MUT))
        # 収縮の矢印（内向き）
        for yy in (150, 200):
            xl = ox + 40 + d * (base - yy) / 190.0
            xr = ox + 260 - d * (base - yy) / 190.0
            o.append(ARR(xl - 30, yy, xl - 18, yy, ALI if not good else MUT, 1.5, 6))
            o.append(ARR(xr + 30, yy, xr + 18, yy, ALI if not good else MUT, 1.5, 6))
        o.append(ARR(ox + 150, top - 22, ox + 150, top - 62, INK, 1.8, 8))
        o.append(T(ox + 160, top - 46, "突き出す", "start", 10.5, INK))
        return col
    panel(30, False)
    o.append(T(180, 30, "勾配なし（悪い例）", "middle", 12.5, ALI, True))
    o.append(T(180, 334, "収縮で締め付けたまま、抜けきるまで", "middle", 10.5, ALI))
    o.append(T(180, 350, "全長でこすれる → 傷・白化・変形", "middle", 10.5, ALI))
    panel(460, True)
    o.append(T(610, 30, "抜き勾配あり（良い例）", "middle", 12.5, SIG, True))
    o.append(T(610, 334, "少し動いただけで壁とコアの間に", "middle", 10.5, SIG))
    o.append(T(610, 350, "すき間ができ、こすれない", "middle", 10.5, SIG))
    # 角度と寸法（右パネル右側面）
    xr_b, xr_t = 460 + 260, 460 + 260 - 16
    o.append(W(xr_b, 260, xr_b, 110, c=FNT, lw=1, dash="3 3"))
    o.append(T(xr_b + 6, 150, "θ", "start", 12, INK, True))
    o.append(DIM(xr_t, 96, xr_b, 96, None, MUT))
    o.append(T(xr_b + 30, 92, "H tanθ", "start", 10.5, INK))
    o.append(DIM(xr_b + 60, 110, xr_b + 60, 260, None, MUT))
    o.append(T(xr_b + 68, 190, "H", "start", 11, INK, True))
    o.append(T(30, 380, "矢印: 成形品が冷えて縮み、コアを締め付ける力。勾配の角度 θ は抜く方向（上下）から測る。", "start", 10.5, MUT))
    return SVG(860, 392, o, "抜き勾配。成形品はコアの上で縮むので、勾配が無いと抜けきるまでこすれる。勾配があれば、深さ H の位置で片側 H tanθ だけ壁が開いている。")
F["e04_draft"] = _e04_draft()

# ---- 肉厚の原則 ----
def _e04_wall():
    o = []
    # (a) 厚い塊 vs 肉抜き
    def label(x, y, s, good):
        o.append(T(x, y, s, "middle", 12, SIG if good else ALI, True))
    label(210, 24, "悪い: 厚い塊がある", False)
    label(640, 24, "良い: 肉抜きして厚さをそろえる", True)
    # bad
    o.append(_p04([(60, 60), (360, 60), (360, 80), (260, 80), (260, 150), (160, 150), (160, 80), (60, 80)], ALI, ASOFT, 1.6))
    o.append(W(196, 60, 210, 66, 224, 60, c=ALI, lw=1.8))
    o.append(CIRC(210, 112, 9, ALI, 1.4, "none", "2 2"))
    o.append(T(232, 52, "ひけ（へこみ）", "start", 10, ALI))
    o.append(T(268, 116, "← ボイド（内部の空洞）", "start", 10, ALI))
    # good
    o.append(_p04([(490, 60), (790, 60), (790, 80), (690, 80), (690, 150), (670, 150), (670, 80), (610, 80), (610, 150), (590, 150), (590, 80), (490, 80)], SIG, SSOFT, 1.6))
    o.append(T(640, 172, "中を抜き、壁の厚さを t にそろえる", "middle", 10, SIG))
    # (b) 角
    label(210, 206, "悪い: 角が直角のまま", False)
    label(640, 206, "良い: 内 R = r、外 R = r + t", True)
    # bad corner: 内外とも直角 → 角が厚い
    import math as _m
    o.append(_p04([(110, 230), (110, 360), (300, 360), (300, 340), (130, 340), (130, 230)], ALI, ASOFT, 1.6))
    o.append(W(110, 360, 130, 340, c=ALI, lw=1.2, dash="3 2"))
    o.append(T(140, 368, "√2 t", "start", 10, ALI))
    o.append(CIRC(130, 340, 4, ALI, 1.4))
    o.append(T(140, 330, "内側の角に応力が集中", "start", 10, ALI))
    o.append(T(60, 384, "角の厚さが √2 t ≈ 1.4 t になり、遅れて固まる", "start", 10, ALI))
    # good corner: concentric
    cx, cy, r, t = 590, 300, 20, 20
    outer = [(cx - (r + t) * _m.cos(a), cy + (r + t) * _m.sin(a)) for a in [i * _m.pi / 2 / 16 for i in range(17)]]
    inner = [(cx - r * _m.cos(a), cy + r * _m.sin(a)) for a in [i * _m.pi / 2 / 16 for i in range(17)]]
    poly = [(cx - r - t, 230)] + outer + [(760, cy + r + t), (760, cy + r)] + inner[::-1] + [(cx - r, 230)]
    o.append(_p04(poly, SIG, SSOFT, 1.6))
    o.append(D(cx, cy, FNT, 2.5))
    o.append(W(cx, cy, cx - r * 0.707, cy + r * 0.707, c=MUT, lw=1))
    o.append(T(cx + 8, cy - 4, "同じ中心", "start", 10, MUT))
    o.append(T(660, 384, "どこでも厚さ t のまま曲がる", "middle", 10, SIG))
    return SVG(860, 398, o, "均一肉厚の原則。厚い塊や角の肉だまりは、周りより遅れて固まり、ひけ・ボイド・反りの原因になる。")
F["e04_wall"] = _e04_wall()

# ---- 成形不良 ----
def _e04_defects():
    import math as _m
    o = []
    cells = [
        ("ひけ", "厚い部分の中心が後から縮み、表面が内側へ引き込まれてへこむ", "肉厚を均一にする。リブは薄く（05 章）。保圧を長く・高く。ゲートを厚い部分の近くへ"),
        ("ボイド", "表面が先に固まって動けないまま中心が縮み、内部に空洞ができる", "ひけと同じ。厚い部分を無くすのが根本対策"),
        ("反り", "場所によって収縮量が違い（肉厚差・冷え方の差・繊維の向き）、平らな面が曲がる", "肉厚の均一化。金型の両側を同じ温度に。リブで形を拘束。左右対称な形"),
        ("ウェルドライン", "流れが穴の周りで分かれて再び合わさる線。見た目に線が出て、そこが弱い", "ゲート位置で合流点を目立たない・力のかからない場所へ移す。樹脂温度・金型温度を上げる"),
        ("ショートショット", "樹脂が奥まで届く前に固まり、形が欠ける", "流動長に対して薄すぎない肉厚。ゲートを増やす・移す。ガス抜きを設ける"),
    ]
    pos = [(10, 10, 274), (293, 10, 274), (576, 10, 274), (10, 262, 415), (435, 262, 415)]
    for (name, cause, fix), (x, y, w) in zip(cells, pos):
        o.append(RECT(x, y, w, 240, 8, PAN, LIN, 1.2))
        o.append(T(x + 12, y + 22, name, "start", 13, ALI, True))
        dx, dy = x + w / 2, y + 70
        if name == "ひけ":
            o.append(_p04([(dx - 100, dy - 18), (dx + 100, dy - 18), (dx + 100, dy - 4), (dx + 18, dy - 4), (dx + 18, dy + 30),
                           (dx - 18, dy + 30), (dx - 18, dy - 4), (dx - 100, dy - 4)], MUT, PAN, 1.3))
            pts = [(dx - 100, dy - 18)] + [(dx + u, dy - 18 + 5 * _m.exp(-(u / 16.0) ** 2)) for u in range(-40, 41, 4)] + [(dx + 100, dy - 18)]
            o.append(PL(pts, ALI, 2.0))
            o.append(T(dx + 38, dy - 24, "へこみ", "start", 10, ALI))
        elif name == "ボイド":
            o.append(RECT(dx - 80, dy - 22, 160, 50, 3, PAN, MUT, 1.3))
            o.append('<ellipse cx="%g" cy="%g" rx="14" ry="8" fill="%s" stroke="%s" stroke-width="1.4"/>' % (dx, dy + 3, ASOFT, ALI))
            o.append(T(dx + 22, dy + 7, "空洞", "start", 10, ALI))
        elif name == "反り":
            o.append(W(dx - 100, dy + 10, dx + 100, dy + 10, c=FNT, lw=1.2, dash="4 3"))
            pts = [(dx + u, dy + 10 - 22 * (u / 100.0) ** 2) for u in range(-100, 101, 5)]
            o.append(PL(pts, ALI, 4.0))
            o.append(T(dx, dy + 30, "設計の形（点線）", "middle", 10, FNT))
        elif name == "ウェルドライン":
            o.append(RECT(dx - 150, dy - 32, 300, 64, 3, PAN, MUT, 1.3))
            o.append(CIRC(dx, dy, 13, MUT, 1.3, SCR))
            o.append(D(dx - 148, dy, ALI, 4))
            o.append(T(dx - 140, dy + 46, "↑ ゲート", "start", 10, ALI))
            o.append(ARR(dx - 120, dy - 4, dx - 60, dy - 18, SIG, 1.5, 6))
            o.append(ARR(dx - 120, dy + 4, dx - 60, dy + 18, SIG, 1.5, 6))
            o.append(ARR(dx - 30, dy - 22, dx + 4, dy - 20, SIG, 1.5, 6))
            o.append(ARR(dx - 30, dy + 22, dx + 4, dy + 20, SIG, 1.5, 6))
            o.append(W(dx + 13, dy, dx + 140, dy, c=ALI, lw=2.2))
            o.append(T(dx + 70, dy - 8, "合流した線", "middle", 10, ALI))
        else:
            o.append(RECT(dx - 150, dy - 20, 300, 40, 3, "none", MUT, 1.2, "4 3"))
            o.append(RECT(dx - 150, dy - 20, 200, 40, 3, PAN, MUT, 1.3))
            pts = [(dx + 50, dy - 20), (dx + 62, dy - 10), (dx + 58, dy), (dx + 66, dy + 10), (dx + 50, dy + 20)]
            o.append(PL(pts, ALI, 1.8))
            o.append(T(dx + 100, dy + 4, "未充填", "middle", 10.5, ALI))
            o.append(D(dx - 148, dy, ALI, 4))
        n = int((w - 24) / 10.5 * 2) - 2
        o.append(T(x + 12, y + 128, "原因", "start", 10.5, INK, True))
        o.append(_txt04(x + 46, y + 128, cause, int((w - 58) / 5.2), sz=10, c=MUT, lh=14))
        o.append(T(x + 12, y + 186, "対策", "start", 10.5, SIG, True))
        o.append(_txt04(x + 46, y + 186, fix, int((w - 58) / 5.2), sz=10, c=MUT, lh=14))
    return SVG(860, 512, o, "代表的な成形不良。ひけ・ボイド・反りの多くは肉厚の不均一から来る。")
F["e04_defects"] = _e04_defects()

# ---- アンダーカット ----
def _e04_undercut():
    o = []
    W4 = 212
    titles = ["アンダーカット", "スライド", "傾斜ピン", "形状の工夫（抜き穴）"]
    subs = ["横穴・内側の爪があると、型開き方向（上下）に抜けない",
            "横から型を引き抜く。型開きと連動して横へ動く",
            "突き出しと同時に斜めに動き、内側の爪から外れる",
            "爪の真下に穴を開け、下から型を通して上下だけで抜く"]
    for i in range(4):
        x0 = 6 + i * (W4 + 2)
        o.append(RECT(x0, 6, W4 - 4, 318, 8, PAN, LIN, 1.2))
        o.append(T(x0 + (W4 - 4) / 2, 28, titles[i], "middle", 12, ALI if i == 0 else SIG, True))
        o.append(_txt04(x0 + 10, 270, subs[i], 36, sz=10, c=MUT, lh=14))
    # パネル 1: 横穴のある壁
    x = 6
    o.append(_p04([(x + 40, 220), (x + 40, 80), (x + 160, 80), (x + 160, 220), (x + 146, 220), (x + 146, 94), (x + 54, 94), (x + 54, 220)], SIG, SSOFT, 1.6))
    o.append(RECT(x + 39, 142, 16, 16, 0, "var(--panel)", "none", 0))
    o.append(RECT(x + 22, 144, 40, 12, 0, SCR, ALI, 1.4))
    o.append(T(x + 66, 154, "← 横穴に入る型", "start", 9.5, ALI))
    o.append(ARR(x + 100, 76, x + 100, 46, INK, 1.6, 7))
    o.append(T(x + 108, 58, "型開き", "start", 10, INK))
    o.append(T(x + 64, 182, "穴の中の型が", "start", 9.5, ALI))
    o.append(T(x + 64, 196, "引っかかる", "start", 9.5, ALI))
    # パネル 2: スライド
    x = 6 + W4 + 2
    o.append(_p04([(x + 90, 220), (x + 90, 80), (x + 190, 80), (x + 190, 220), (x + 176, 220), (x + 176, 94), (x + 104, 94), (x + 104, 220)], SIG, SSOFT, 1.6))
    o.append(_p04([(x + 20, 128), (x + 72, 128), (x + 72, 143), (x + 104, 143), (x + 104, 157), (x + 72, 157), (x + 72, 172), (x + 20, 172)], MUT, SCR, 1.4))
    o.append(T(x + 46, 168, "スライド", "middle", 9.5, INK, True))
    o.append(W(x + 22, 88, x + 50, 146, c=INK, lw=3))
    o.append(T(x + 12, 76, "アンギュラピン", "start", 9.5, INK))
    o.append(ARR(x + 50, 196, x + 18, 196, SIG, 1.8, 7))
    o.append(T(x + 56, 200, "型開きで横へ動く", "start", 9.5, SIG))
    # パネル 3: 傾斜ピン（内側の爪）
    x = 6 + 2 * (W4 + 2)
    o.append(_p04([(x + 40, 200), (x + 40, 80), (x + 170, 80), (x + 170, 200), (x + 156, 200), (x + 156, 94), (x + 54, 94), (x + 54, 200)], SIG, SSOFT, 1.6))
    o.append(_p04([(x + 54, 140), (x + 70, 140), (x + 70, 150), (x + 54, 158)], SIG, SSOFT, 1.6))
    o.append(T(x + 76, 128, "内側の爪", "start", 9.5, SIG))
    o.append(_p04([(x + 70, 140), (x + 70, 160), (x + 100, 240), (x + 120, 240), (x + 92, 160), (x + 92, 140)], MUT, SCR, 1.4))
    o.append(T(x + 126, 236, "傾斜ピン", "start", 10, MUT, True))
    o.append(ARR(x + 128, 210, x + 108, 172, SIG, 1.8, 7))
    # パネル 4: 抜き穴
    x = 6 + 3 * (W4 + 2)
    o.append(_p04([(x + 40, 200), (x + 40, 186), (x + 100, 186), (x + 100, 90), (x + 114, 90), (x + 114, 110), (x + 126, 110), (x + 126, 122), (x + 114, 122), (x + 114, 186), (x + 170, 186), (x + 170, 200)], SIG, SSOFT, 1.6))
    o.append(RECT(x + 114, 186, 12, 14, 0, PAN, PAN, 0))
    o.append(W(x + 114, 186, x + 114, 200, c=SIG, lw=1.4))
    o.append(W(x + 126, 186, x + 126, 200, c=SIG, lw=1.4))
    o.append(W(x + 114, 186, x + 126, 186, c=PAN, lw=1.6))
    o.append(RECT(x + 114, 122, 12, 116, 0, SCR, MUT, 1.2))
    o.append(T(x + 132, 116, "爪", "start", 10, SIG))
    o.append(ARR(x + 120, 250, x + 120, 240, MUT, 1.2, 5))
    o.append(T(x + 134, 232, "下から入る型", "start", 9.5, MUT))
    o.append(T(x + 134, 212, "底に穴が残る", "start", 9.5, ALI))
    return SVG(860, 330, o, "アンダーカットと 3 つの解決法（断面の模式図）。スライドと傾斜ピンは金型を複雑にし、費用と保守の手間が増える。形状の工夫で無くせるなら、それが最も安い。")
F["e04_undercut"] = _e04_undercut()

# ---- 冷却 ----
def _e04_cool():
    import math as _m
    o = []
    # 左: 厚さ方向の温度分布
    ox, oy, w, h = 60, 250, 300, 190
    o.append(AXES(ox, oy, w + 20, h + 20, None, None))
    o.append(T(ox + w / 2, oy + 34, "厚さ方向の位置 x（0 〜 s）", "middle", 10.5, MUT))
    o.append(T(ox - 6, oy - h - 6, "温度", "end", 10.5, MUT, True))
    Tm, Tw, Te = 230, 60, 90
    def Y(Tv): return oy - (Tv - 40) / (240 - 40) * h
    o.append(W(ox, Y(Tm), ox + w, Y(Tm), c=FNT, lw=1, dash="4 3"))
    o.append(T(ox + w + 4, Y(Tm) + 4, "T_m 230", "start", 9.5, FNT))
    o.append(W(ox, Y(Te), ox + w, Y(Te), c=ALI, lw=1, dash="4 3"))
    o.append(T(ox + w + 4, Y(Te) + 4, "T_e 90", "start", 9.5, ALI))
    o.append(T(ox + w + 4, Y(Tw) + 4, "T_w 60", "start", 9.5, MUT))
    o.append(W(ox, Y(Tw), ox + w, Y(Tw), c=MUT, lw=1))
    s, a = 2.0, 0.10
    tc = s * s / (_m.pi ** 2 * a) * _m.log(4 / _m.pi * (Tm - Tw) / (Te - Tw))
    for tt, col in ((0.6, GRN), (3.0, GRN), (tc, SIG)):
        pts = []
        for i in range(61):
            u = i / 60.0
            th = 0
            for n in (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21):
                th += 4 / (n * _m.pi) * _m.sin(n * _m.pi * u) * _m.exp(-n * n * _m.pi ** 2 * a * tt / s ** 2)
            pts.append((ox + u * w, Y(Tw + (Tm - Tw) * th)))
        o.append(PL(pts, col, 2.0 if col == SIG else 1.5))
    o.append(T(ox + w / 2, Y(205) , "0.6 s", "middle", 10, GRN))
    o.append(T(ox + w / 2, Y(150) - 4, "3 s", "middle", 10, GRN))
    o.append(T(ox + w / 2, Y(Te) - 8, "%.1f s：中心が T_e" % tc, "middle", 10, SIG, True))
    o.append(T(ox, oy + 16, "0", "middle", 9.5, FNT))
    o.append(T(ox + w, oy + 16, "s", "middle", 9.5, FNT))
    o.append(T(ox + w / 2, 24, "ABS、肉厚 s = 2 mm の温度分布（両面を T_w で冷やす）", "middle", 11, INK, True))
    # 右: 冷却時間 vs 肉厚
    ox2, w2 = 500, 320
    o.append(AXES(ox2, oy, w2 + 16, h + 20, None, None))
    o.append(T(ox2 + w2 / 2, oy + 34, "肉厚 s [mm]", "middle", 10.5, MUT))
    o.append(T(ox2 - 6, oy - h - 6, "t_c [s]", "end", 10.5, MUT, True))
    def X2(v): return ox2 + v / 4.0 * w2
    def Y2(v): return oy - v / 40.0 * h
    for k in range(5):
        o.append(T(X2(k), oy + 16, str(k), "middle", 9.5, FNT))
    for k in (10, 20, 30, 40):
        o.append(T(ox2 - 6, Y2(k) + 4, str(k), "end", 9.5, FNT))
        o.append(W(ox2, Y2(k), ox2 + w2, Y2(k), c=LIN, lw=0.8))
    L = _m.log(4 / _m.pi * (Tm - Tw) / (Te - Tw))
    pts = [(X2(v), Y2(v * v / (_m.pi ** 2 * a) * L)) for v in [i * 0.05 for i in range(81)]]
    o.append(PL(pts, SIG, 2.2))
    for v in (1, 2, 3, 4):
        tv = v * v / (_m.pi ** 2 * a) * L
        o.append(D(X2(v), Y2(tv), SIG, 3.6))
        o.append(T(X2(v) - 6, Y2(tv) - 8, "%.0f s" % tv, "end", 10, INK))
    o.append(T(ox2 + w2 / 2, 24, "ABS の冷却時間と肉厚（2 乗で増える）", "middle", 11, INK, True))
    return SVG(860, 300, o, "冷却の様子（左）と冷却時間（右）。左の曲線は時間とともに形を保ったまま低くなる。中心が取り出し温度 T_e まで下がる時間が t_c で、肉厚の 2 乗に比例する。物性は代表値。")
F["e04_cool"] = _e04_cool()
