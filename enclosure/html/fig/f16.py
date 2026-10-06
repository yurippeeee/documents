# -*- coding: utf-8 -*-
# ===================== 16. 外観と操作部 =====================

def _poly(pts, c=INK, lw=1.4, fill=PAN):
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"/>' % (d, fill, c, lw)

def _path(d, c=INK, lw=1.4, fill="none", dash=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round" stroke-linecap="round"%s/>' % (d, fill, c, lw, da)

def _lead(x1, y1, x2, y2, s, a="start", c=MUT, sz=10.5, tc=None):
    """引き出し線つき注記。(x1,y1)=指す点、(x2,y2)=文字の位置"""
    return W(x1, y1, x2, y2 + (-4 if y2 < y1 else -4), c=c, lw=1) + D(x1, y1, c, 2.2) + \
        T(x2 + (4 if a == "start" else -4 if a == "end" else 0), y2, s, a, sz, tc or INK)

def _marks():
    o = []
    # --- 左: 断面 ---
    o.append(T(240, 22, "断面（ふた形の成形品）", "middle", 12, INK, True))
    top = [(60, 70), (160, 70), (175, 75), (190, 70), (420, 70), (420, 210), (408, 210), (408, 82),
           (344, 82), (344, 160), (320, 160), (320, 82),
           (186, 82), (186, 150), (164, 150), (164, 82),
           (72, 82), (72, 210), (60, 210)]
    o.append(_poly(top, INK, 1.4, PAN))
    o.append(RECT(328, 96, 8, 64, 0, SCR, LIN, 1))     # ボスの穴
    o.append(W(30, 210, 450, 210, c=ALI, lw=1.4, dash="6,4"))
    o.append(T(446, 226, "パーティングライン", "end", 10.5, ALI, True))
    o.append(T(60, 54, "固定側の型 → 外面（意匠面）", "start", 10.5, SIG, True))
    o.append(T(240, 200, "可動側の型 → 内面", "middle", 10.5, MUT))
    # ひけ
    o.append(_lead(175, 70, 215, 46, "ひけ（厚いリブの裏）", "start", ALI, 10.5, ALI))
    # エジェクタ
    for ex in (175, 332):
        y0 = 150 if ex == 175 else 160
        o.append(RECT(ex - 5, y0 + 2, 10, 20, 1, FNT, MUT, 1))
        o.append(ARR(ex, y0 + 40, ex, y0 + 26, MUT, 1.4, 6))
    o.append(T(250, 252, "エジェクタピン（リブ・ボスの端面を押す → 跡は内側）", "middle", 10.5, MUT))
    # ゲート
    o.append(_poly([(250, 82), (244, 92), (256, 92)], ALI, 1, ASOFT))
    o.append(_lead(250, 92, 262, 120, "ゲート跡（内面）", "start", MUT, 10.5))
    o.append(T(240, 280, "外面に跡が出ないように、跡は内側・稜線・隠れる位置へ集める", "middle", 10.5, FNT))
    # --- 右: 上から見た図 ---
    x0, y0, w, h = 500, 60, 320, 170
    o.append(T(660, 22, "上から見た図（流れとウェルド）", "middle", 12, INK, True))
    o.append(RECT(x0, y0, w, h, 10, PAN, INK, 1.4))
    o.append(CIRC(660, 145, 20, INK, 1.4, SCR))
    o.append(T(660, 181, "穴", "middle", 10, MUT))
    o.append(D(525, 145, ALI, 5))
    o.append(T(525, 172, "ゲート", "middle", 10, ALI))
    # 流れ
    o.append(_path("M535,140 C580,100 630,104 662,118", SIG, 1.6))
    o.append(_path("M535,150 C580,190 630,186 662,172", SIG, 1.6))
    o.append(ARR(640, 110, 660, 118, SIG, 1.6, 7))
    o.append(ARR(640, 180, 660, 172, SIG, 1.6, 7))
    o.append(T(580, 96, "樹脂の流れ", "middle", 10, SIG))
    o.append(W(682, 145, 810, 145, c=ALI, lw=2, dash="5,3"))
    o.append(T(745, 136, "ウェルドライン", "middle", 10.5, ALI, True))
    o.append(T(745, 166, "（穴の後ろで流れが合流）", "middle", 10, ALI))
    o.append(T(660, 252, "ゲートの位置と数を変えると、合流点を動かせる", "middle", 10.5, FNT))
    return SVG(860, 295, o, "成形品の外観に残る跡と、できる場所。意匠面（外面）を先に決め、跡はそれ以外の面に集める。")
F["e16_marks"] = _marks()


def _reveal():
    o = []
    panels = [("突き合わせ（段差の基準 0）", ALI, "butt"),
              ("段付き見切り", SIG, "step"),
              ("溝付き見切り", SIG, "groove")]
    for k, (title, col, kind) in enumerate(panels):
        px = 20 + k * 282
        o.append(RECT(px, 14, 266, 236, 10, "none", col, 1.4))
        o.append(T(px + 133, 36, title, "middle", 12, col, True))
        y = 110; th = 30; sx = px + 133
        if kind == "butt":
            for j, dy in enumerate((0, -5)):
                yy = y - 30 + j * 72
                o.append(RECT(px + 20, yy, sx - px - 20, th, 0, PAN, INK, 1.3))
                o.append(RECT(sx + 4, yy + dy, px + 246 - sx - 4, th, 0, SSOFT, INK, 1.3))
            o.append(T(px + 133, 70, "製品 A: 右が下がる", "middle", 9.5, MUT))
            o.append(T(px + 133, 142, "製品 B: 右が出っ張る", "middle", 9.5, MUT))
            o.append(DIM(sx, 66 + 72 + 22, sx + 4, 66 + 72 + 22, None))
            o.append(T(px + 133, 196, "段差 0 ± 0.2 mm、向きが入れ替わる", "middle", 10.5, ALI, True))
            o.append(T(px + 133, 214, "わずかな差でも光の反射で目立つ", "middle", 10, MUT))
            o.append(T(px + 133, 232, "（隙間 g・段差 s ともに 0 にはできない）", "middle", 9.5, FNT))
        elif kind == "step":
            yy = y - 20
            o.append(RECT(px + 20, yy, sx - px - 20, th, 0, PAN, INK, 1.3))
            o.append(RECT(sx + 4, yy + 10, px + 246 - sx - 4, th, 0, SSOFT, INK, 1.3))
            o.append(W(sx + 4, yy, sx + 60, yy, c=MUT, lw=1, dash="3,3"))
            o.append(DIM(sx + 50, yy, sx + 50, yy + 10, None))
            o.append(T(sx + 60, yy + 9, "段差 s", "start", 10, INK))
            o.append(DIM(sx, yy + th + 22, sx + 4, yy + th + 22, None))
            o.append(T(sx + 2, yy + th + 40, "隙間 g", "middle", 10, INK))
            o.append(T(px + 133, 196, "段差 0.5 ± 0.2 mm（0.3〜0.7）", "middle", 10.5, SIG, True))
            o.append(T(px + 133, 214, "向きが常に同じ → デザインの段に見える", "middle", 10, MUT))
        else:
            yy = y - 20; ch = 8
            o.append(_poly([(px + 20, yy), (sx - ch, yy), (sx, yy + ch), (sx, yy + th), (px + 20, yy + th)], INK, 1.3, PAN))
            o.append(_poly([(sx + 4 + ch, yy), (px + 246, yy), (px + 246, yy + th), (sx + 4, yy + th), (sx + 4, yy + ch)], INK, 1.3, SSOFT))
            o.append(_poly([(sx - ch, yy), (sx + 4 + ch, yy), (sx + 4, yy + ch), (sx, yy + ch)], "none", 0, LIN))
            o.append(_lead(sx + 2, yy + 2, sx + 30, yy - 18, "V 溝（影になる）", "start", MUT, 10))
            o.append(T(px + 133, 196, "溝の影に隙間のばらつきが隠れる", "middle", 10.5, SIG, True))
            o.append(T(px + 133, 214, "角の面取りで反射の乱れも減る", "middle", 10, MUT))
    return SVG(860, 262, o, "見切りの断面（2 つの部品の外面が左右に並ぶ。段差は誇張して描いている）。ばらつきを 0 にするのではなく、ばらついても気にならない形にする。")
F["e16_reveal"] = _reveal()


def _twoshot():
    o = []
    # 左: 二色成形
    o.append(T(215, 26, "二色成形（硬い樹脂 + エラストマー）", "middle", 12, INK, True))
    o.append(RECT(60, 120, 310, 40, 4, PAN, INK, 1.4))
    o.append(T(215, 145, "1 次成形: 硬い樹脂（PC など）", "middle", 10.5, INK))
    # 貫通穴に回る2次材
    o.append(_poly([(60, 120), (60, 92), (370, 92), (370, 120)], GRN, 1.4, "color-mix(in srgb,var(--blue) 22%,transparent)"))
    for hx in (130, 300):
        o.append(RECT(hx - 7, 120, 14, 40, 0, "color-mix(in srgb,var(--blue) 22%,transparent)", GRN, 1.2))
        o.append(RECT(hx - 12, 160, 24, 8, 2, "color-mix(in srgb,var(--blue) 22%,transparent)", GRN, 1.2))
    o.append(T(215, 82, "2 次成形: エラストマー（グリップ・シール）", "middle", 10.5, GRN, True))
    o.append(_lead(300, 166, 320, 196, "貫通穴に回して抜け止め", "start", MUT, 10))
    o.append(T(215, 225, "接着しない組み合わせは形で引っかける", "middle", 10, FNT))
    # 右: インサート成形
    o.append(T(645, 26, "インサート成形（金属ナットを埋める）", "middle", 12, INK, True))
    o.append(RECT(520, 170, 250, 16, 2, PAN, INK, 1.4))
    o.append(RECT(600, 70, 90, 100, 4, PAN, INK, 1.4))
    o.append(RECT(622, 70, 46, 70, 2, FNT, MUT, 1.4))
    for i in range(6):
        yy = 76 + i * 11
        o.append(W(622, yy, 616, yy + 5, 622, yy + 10, c=MUT, lw=1.2))
        o.append(W(668, yy, 674, yy + 5, 668, yy + 10, c=MUT, lw=1.2))
    o.append(RECT(636, 70, 18, 70, 0, SCR, MUT, 1))
    o.append(_lead(668, 100, 720, 92, "金属ナット（型に置く）", "start", MUT, 10.5))
    o.append(_lead(616, 110, 520, 120, "ローレット（ぎざぎざ）", "end", MUT, 10))
    o.append(T(520, 134, "が樹脂に食い込み回り止め", "end", 10, MUT))
    o.append(_lead(690, 160, 720, 150, "周りに樹脂を流す", "start", MUT, 10.5))
    o.append(T(645, 225, "後から圧入・熱圧入する方法もある（08 章）", "middle", 10, FNT))
    return SVG(860, 240, o, "2 つの材料を 1 つの部品にする成形法。組み立て工程とすき間は減るが、金型が複雑になる。")
F["e16_twoshot"] = _twoshot()


def _pcb(x, y, w):
    return RECT(x, y, w, 12, 1, "color-mix(in srgb,var(--signal) 30%,var(--panel))", SIG, 1.2) + \
        T(x + w - 4, y + 26, "基板", "end", 9.5, SIG)

def _keys():
    o = []
    titles = ["ラバーキー", "ヒンジ付き樹脂ボタン", "メタルドーム"]
    for k, t in enumerate(titles):
        px = 20 + k * 282
        o.append(RECT(px, 12, 266, 236, 10, "none", LIN, 1.2))
        o.append(T(px + 133, 34, t, "middle", 12, INK, True))
        o.append(_pcb(px + 16, 190, 234))
    # 1. ラバーキー
    px = 20; cx = px + 133
    o.append(RECT(px + 16, 70, 70, 12, 0, PAN, INK, 1.3))
    o.append(RECT(px + 180, 70, 70, 12, 0, PAN, INK, 1.3))
    o.append(T(px + 40, 64, "筐体", "middle", 9.5, MUT))
    rub = "color-mix(in srgb,var(--blue) 22%,transparent)"
    o.append(_poly([(cx - 34, 60), (cx + 34, 60), (cx + 34, 140), (cx + 60, 176), (cx + 90, 176), (cx + 90, 190),
                    (cx - 90, 190), (cx - 90, 176), (cx - 60, 176), (cx - 34, 140)], GRN, 1.3, rub))
    o.append(_poly([(cx - 28, 140), (cx + 28, 140), (cx + 54, 190), (cx - 54, 190)], "none", 0, PAN))
    o.append(RECT(cx - 20, 140, 40, 26, 2, rub, GRN, 1.2))
    o.append(RECT(cx - 14, 166, 28, 6, 1, INK, INK, 0))
    o.append(_lead(cx + 14, 169, cx + 50, 120, "導電接点", "start", MUT, 9.5))
    o.append(_lead(cx + 47, 158, cx + 70, 146, "薄いスカート", "start", MUT, 9.5))
    o.append(T(cx, 222, "接点が基板の櫛形パターンを直接つなぐ", "middle", 9.5, FNT))
    o.append(ARR(cx, 44, cx, 58, ALI, 1.6, 6))
    # 2. ヒンジ
    px = 302; cx = px + 133
    o.append(RECT(px + 16, 70, 60, 14, 0, PAN, INK, 1.3))
    o.append(RECT(px + 76, 70, 70, 5, 0, PAN, INK, 1.3))       # ヒンジ
    o.append(RECT(px + 146, 62, 70, 22, 3, SSOFT, SIG, 1.3))     # ボタン頭
    o.append(RECT(px + 176, 84, 10, 22, 0, SSOFT, SIG, 1.2))    # 押し棒
    o.append(RECT(px + 226, 70, 24, 14, 0, PAN, INK, 1.3))
    o.append(T(px + 46, 64, "筐体", "middle", 9.5, MUT))
    o.append(_lead(px + 110, 75, px + 92, 112, "ヒンジ（薄い腕）", "middle", MUT, 9.5))
    o.append(RECT(px + 166, 160, 30, 30, 2, FNT, MUT, 1.2))
    o.append(RECT(px + 174, 150, 14, 10, 1, MUT, MUT, 0))
    o.append(_lead(px + 166, 175, px + 130, 160, "タクトスイッチ", "end", MUT, 9.5))
    o.append(DIM(px + 200, 106, px + 200, 150, None))
    o.append(T(px + 206, 132, "すき間", "start", 9.5, MUT))
    o.append(T(cx, 222, "ヒンジのたわみ力 + スイッチの力を指が受ける", "middle", 9.5, FNT))
    o.append(ARR(px + 181, 44, px + 181, 60, ALI, 1.6, 6))
    # 3. メタルドーム
    px = 584; cx = px + 133
    o.append(_path("M%g,190 Q%g,130 %g,190" % (cx - 50, cx, cx + 50), INK, 2.2, "none"))
    o.append(RECT(cx - 70, 150, 140, 4, 0, "color-mix(in srgb,var(--ink) 18%,transparent)", MUT, 0.8))
    o.append(RECT(cx - 6, 186, 12, 4, 0, SIG, SIG, 0))
    o.append(RECT(cx - 58, 186, 10, 4, 0, SIG, SIG, 0))
    o.append(RECT(cx + 48, 186, 10, 4, 0, SIG, SIG, 0))
    o.append(_lead(cx + 30, 170, cx + 70, 128, "金属の皿ばね", "start", MUT, 9.5))
    o.append(_lead(cx - 60, 152, cx - 90, 120, "押さえシート", "start", MUT, 9.5))
    o.append(RECT(cx - 24, 80, 48, 26, 3, SSOFT, SIG, 1.3))
    o.append(T(cx + 30, 97, "キー", "start", 9.5, MUT))
    o.append(RECT(cx - 6, 106, 12, 40, 0, SSOFT, SIG, 1.2))
    o.append(T(cx, 222, "裏返って中央の接点に触れる", "middle", 9.5, FNT))
    o.append(ARR(cx, 52, cx, 76, ALI, 1.6, 6))
    return SVG(860, 260, o, "ボタンの 3 種類（断面、赤い矢印は指の力）。どれも、ばねの部分の形で押し心地が決まる。")
F["e16_keys"] = _keys()


def _fs():
    o = []
    ox, oy, gw, gh = 90, 230, 460, 190
    o.append(AXES(ox, oy, gw + 20, gh + 10, "ストローク [mm]", "力 [N]"))
    def P(s, f):  # s: 0..0.35mm, f: 0..3N
        return (ox + s / 0.35 * gw, oy - f / 3.0 * gh)
    pts = []
    import math as _m
    for i in range(101):
        s = 0.25 * i / 100
        if s <= 0.12:
            f = 2.0 * _m.sin(s / 0.12 * _m.pi / 2)
        else:
            u = (s - 0.12) / 0.13
            f = 2.0 - 0.9 * (1 - _m.cos(u * _m.pi)) / 2
        pts.append(P(s, f))
    for i in range(1, 31):
        s = 0.25 + 0.05 * i / 30
        f = 1.1 + (2.9 - 1.1) * (i / 30) ** 2
        pts.append(P(s, f))
    o.append(PL(pts, SIG, 2.4))
    x1, y1 = P(0.12, 2.0); x2, y2 = P(0.25, 1.1)
    o.append(D(x1, y1, ALI, 4)); o.append(D(x2, y2, ALI, 4))
    o.append(W(ox, y1, x1, y1, c=FNT, lw=1, dash="3,3"))
    o.append(W(ox, y2, x2, y2, c=FNT, lw=1, dash="3,3"))
    o.append(T(ox - 6, y1 + 4, "F₁ 2.0", "end", 10.5, INK, True))
    o.append(T(ox - 6, y2 + 4, "F₂ 1.1", "end", 10.5, INK, True))
    o.append(T(x1, y1 - 12, "作動荷重（山）", "middle", 10.5, ALI))
    o.append(T(x2, y2 + 22, "戻り荷重（谷）", "middle", 10.5, ALI))
    xb, yb = P(0.3, 2.9)
    o.append(T(xb - 8, yb + 4, "底に当たる（接点が閉じる）", "end", 10.5, MUT))
    o.append(DARR(x1 + 70, y1, x1 + 70, y2, ALI, 1.2, 5))
    o.append(T(x1 + 70, y2 + 42, "力が急に下がる", "middle", 10, ALI))
    o.append(T(x1 + 70, y2 + 58, "→ クリック感", "middle", 10, ALI))
    o.append(RECT(600, 70, 240, 110, 8, PAN, SIG, 1.4))
    o.append(T(720, 98, "クリック率", "middle", 12.5, INK, True))
    o.append(T(720, 124, "(F₁ − F₂) / F₁ × 100 %", "middle", 11, INK, False, True))
    o.append(T(720, 146, "= (2.0 − 1.1) / 2.0 × 100", "middle", 11, MUT, False, True))
    o.append(T(720, 166, "= 45 %", "middle", 11.5, SIG, True, True))
    o.append(T(720, 205, "値は説明用の例", "middle", 10, FNT))
    return SVG(860, 262, o, "メタルドームやラバーキーの荷重–ストローク曲線（形は模式図）。山から谷へ力が下がることでクリック感が生まれる。")
F["e16_fs"] = _fs()


def _hinge():
    o = []
    # 固定壁
    o.append(RECT(60, 60, 40, 140, 0, FNT, MUT, 1.2))
    for i in range(8):
        o.append(W(60, 70 + i * 17, 100, 60 + i * 17, c=PAN, lw=1))
    o.append(T(80, 220, "筐体に固定", "middle", 10, MUT))
    x0, y0, L, t = 100, 110, 340, 14
    o.append(RECT(x0, y0, L, t, 0, SSOFT, SIG, 1.5))
    # たわんだ形
    pts = []
    for i in range(41):
        u = i / 40
        pts.append((x0 + u * L, y0 + t / 2 + 46 * (u * u * (3 - u) / 2)))
    o.append(PL(pts, SIG, 1.4, "5,4"))
    o.append(RECT(x0 + L, y0 - 18, 70, 50, 4, PAN, INK, 1.3))
    o.append(T(x0 + L + 35, y0 + 10, "ボタン頭", "middle", 10, MUT))
    o.append(ARR(x0 + L + 4, y0 - 60, x0 + L + 4, y0 - 22, ALI, 2, 9))
    o.append(T(x0 + L + 12, y0 - 46, "P（押し荷重）", "start", 11.5, ALI, True))
    o.append(DIM(x0, y0 - 30, x0 + L, y0 - 30, "L（ヒンジの長さ）", tc=INK))
    o.append(DIM(x0 + L - 20, y0, x0 + L - 20, y0 + t, None))
    o.append(T(x0 + L - 28, y0 + 11, "t", "end", 11.5, INK, True))
    o.append(DIM(x0 + L + 80, y0 + 7, x0 + L + 80, y0 + 53, None))
    o.append(T(x0 + L + 88, y0 + 35, "δ（押し込み量）", "start", 11, INK, True))
    o.append(CIRC(x0 + 6, y0 + t, 10, ALI, 1.6))
    o.append(T(x0 + 20, y0 + 50, "根元: M = PL が最大、ひずみ ε = 3tδ / (2L²)", "start", 10.5, ALI))
    o.append(T(x0 + 20, y0 + 68, "根元に小さな R を付けて角への集中を避ける", "start", 10, MUT))
    # 断面
    o.append(T(690, 200, "ヒンジの断面", "middle", 10.5, INK, True))
    o.append(RECT(650, 160, 80, 20, 0, SSOFT, SIG, 1.5))
    o.append(DIM(650, 150, 730, 150, "b", tc=INK))
    o.append(DIM(740, 160, 740, 180, None))
    o.append(T(750, 174, "t", "start", 11.5, INK, True))
    o.append(T(690, 222, "I = bt³ / 12", "middle", 11, INK, True, True))
    o.append(T(430, 250, "P = 3EIδ / L³ = E b t³ δ / (4L³)", "middle", 12, SIG, True, True))
    return SVG(860, 266, o, "ヒンジ付きボタンを片持ちはりとみなすモデル（たわみは誇張）。押し荷重は t³ に比例し L³ に反比例する。")
F["e16_hinge"] = _hinge()


def _tir():
    o = []
    import math as _m
    # 左: 境界と 3 本の光
    o.append(T(215, 24, "樹脂から空気へ出る光（PMMA, n = 1.49）", "middle", 12, INK, True))
    by = 130
    o.append(RECT(30, by, 370, 110, 0, SSOFT, "none", 0))
    o.append(W(30, by, 400, by, c=INK, lw=1.4))
    o.append(T(392, by - 8, "空気 n = 1", "end", 10, MUT))
    o.append(T(38, by + 18, "樹脂 n", "start", 10, MUT))
    rays = [(25, SIG, "θ < θc: 外へ出る"), (42.2, GRN, "θ = θc: 境界に沿う"), (60, ALI, "θ > θc: 全反射")]
    for k, (deg, col, lab) in enumerate(rays):
        hx = 110 + k * 110
        a = _m.radians(deg)
        Lr = 85
        sx, sy = hx - Lr * _m.sin(a), by + Lr * _m.cos(a)
        o.append(ARR(sx, sy, hx, by, col, 1.8, 7))
        o.append(W(hx, by - 30, hx, by + 60, c=FNT, lw=1, dash="3,3"))
        if deg < 42:
            b = _m.asin(1.49 * _m.sin(a))
            o.append(ARR(hx, by, hx + 70 * _m.sin(b), by - 70 * _m.cos(b), col, 1.8, 7))
        elif deg < 43:
            o.append(ARR(hx, by, hx + 48, by - 1, col, 1.8, 7))
        else:
            o.append(ARR(hx, by, hx + Lr * _m.sin(a), by + Lr * _m.cos(a), col, 1.8, 7))
        o.append(T(hx, by + 104 if k != 1 else by + 104, lab, "middle", 9.5, col, True))
    o.append(T(215, 56, "sin θc = 1 / n → PMMA 42.2°、PC 39.1°", "middle", 11, INK, True))
    o.append(T(215, 76, "（θ は法線からの角度）", "middle", 9.5, FNT))
    # 右: 曲げた導光体
    o.append(T(645, 24, "曲げた導光体（中心 O から見る）", "middle", 12, INK, True))
    cx, cy = 520, 245
    Ri, Ro = 90, 150
    o.append(_path("M%g,%g A%g,%g 0 0 1 %g,%g L%g,%g A%g,%g 0 0 0 %g,%g Z" % (
        cx, cy - Ro, Ro, Ro, cx + Ro, cy, cx + Ri, cy, Ri, Ri, cx, cy - Ri), SIG, 1.4, SSOFT))
    o.append(RECT(cx - 70, cy - Ro, 70, Ro - Ri, 0, SSOFT, SIG, 1.4))
    o.append(W(cx, cy - Ro + 1, cx, cy - Ri - 1, c=SSOFT, lw=2))
    o.append(D(cx, cy, INK, 3)); o.append(T(cx - 8, cy + 4, "O", "end", 11, INK, True))
    # r = Ri の光
    hx = _m.sqrt(Ro * Ro - Ri * Ri)
    o.append(ARR(cx - 70, cy - Ri - 2, cx + hx - 2, cy - Ri - 2, ALI, 1.8, 7))
    o.append(W(cx, cy, cx + hx, cy - Ri, c=FNT, lw=1, dash="4,3"))
    o.append(T(cx + hx / 2 - 6, cy - Ri / 2 + 18, "R_o", "middle", 10.5, MUT))
    o.append(DIM(cx - 20, cy, cx - 20, cy - Ri, None))
    o.append(T(cx - 26, cy - 40, "R_i", "end", 10.5, INK, True))
    o.append(DIM(cx - 50, cy - Ri, cx - 50, cy - Ro, None))
    o.append(T(cx - 56, cy - 116, "w", "end", 10.5, INK, True))
    o.append(T(cx + hx + 6, cy - Ri - 10, "外壁に当たる", "start", 10, ALI))
    o.append(T(cx + hx + 6, cy - Ri + 6, "sin θ = R_i / R_o", "start", 10, ALI, False, True))
    o.append(T(770, 200, "全反射の条件", "middle", 11, INK, True))
    o.append(T(770, 220, "R_i ≥ w / (n − 1)", "middle", 11.5, SIG, True, True))
    o.append(T(770, 240, "PMMA 2.04w, PC 1.71w", "middle", 10, MUT))
    return SVG(860, 262, o, "左: 入射角が臨界角を超えると全反射する。右: 曲げの内側を通る光ほど外壁に浅く当たるので、内側の曲げ半径に下限がある。")
F["e16_tir"] = _tir()


def _leak():
    o = []
    for k, (title, col) in enumerate([("光漏れする構造", ALI), ("遮光した構造", SIG)]):
        px = 20 + k * 425
        o.append(RECT(px, 12, 405, 226, 10, "none", col, 1.4))
        o.append(T(px + 202, 34, title, "middle", 12, col, True))
        o.append(_pcb(px + 20, 196, 365))
        # 筐体（上面）
        th = 8 if k == 0 else 14
        o.append(RECT(px + 20, 60, 365, th, 0, PAN if k == 0 else FNT, INK, 1.3))
        for lx in (px + 130, px + 270):
            o.append(RECT(lx - 10, 184, 20, 12, 2, "color-mix(in srgb,var(--alias) 35%,var(--panel))", ALI, 1))
            o.append(RECT(lx - 8, 56, 16, 120, 1, "color-mix(in srgb,var(--blue) 18%,transparent)", GRN, 1.2))
        if k == 0:
            o.append(ARR(px + 130, 180, px + 258, 120, ALI, 1.4, 6))
            o.append(T(px + 195, 168, "隣の導光体へ", "middle", 10, ALI))
            o.append(ARR(px + 125, 180, px + 70, 70, ALI, 1.4, 6))
            o.append(T(px + 66, 100, "薄い白い壁が光る", "middle", 10, ALI))
            o.append(T(px + 202, 226, "消えている表示まで光る、輪郭がにじむ", "middle", 10, MUT))
        else:
            for wx in (px + 110, px + 150, px + 250, px + 290):
                o.append(RECT(wx - 3, 74, 6, 110, 0, INK, INK, 0))
            o.append(T(px + 202, 140, "遮光壁", "middle", 10, INK, True))
            o.append(T(px + 202, 54, "厚く・内面を黒く", "middle", 10, MUT))
            o.append(T(px + 202, 226, "LED ごとに囲み、出口以外へ光を出さない", "middle", 10, MUT))
    return SVG(860, 250, o, "光漏れの例と対策（断面、模式図）。量産と同じ色の樹脂で光らせて確かめる。")
F["e16_leak"] = _leak()
