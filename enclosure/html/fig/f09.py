# -*- coding: utf-8 -*-
# 09. スナップフィット の図

def _f09_poly(pts, c=INK, fill=PAN, lw=1.6):
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"/>' % (d, fill, c, lw)


def _f09_types():
    o = []
    # 片持ち
    x = 30
    o.append(T(x + 120, 26, "片持ちスナップ", "middle", 12.5, INK, True))
    o.append(T(x + 120, 44, "はりの曲げでたわむ。最も多い", "middle", 10, MUT))
    o.append(RECT(x + 20, 180, 200, 24, 0, SCR, MUT, 1.2))
    o.append(_f09_poly([(x + 60, 180), (x + 60, 80), (x + 76, 80), (x + 76, 180)], SIG, SSOFT))
    o.append(_f09_poly([(x + 76, 80), (x + 96, 100), (x + 96, 118), (x + 76, 118)], SIG, SSOFT))
    o.append(RECT(x + 110, 112, 100, 14, 0, PAN, INK, 1.4))
    o.append(T(x + 160, 146, "相手の縁", "middle", 10, MUT))
    o.append(ARR(x + 104, 66, x + 70, 66, ALI, 1.6, 6))
    o.append(T(x + 108, 70, "押されてたわむ", "start", 10, ALI))
    o.append(T(x + 20, 230, "根元で固定されたはり", "start", 10, MUT))
    # トーション
    x = 310
    o.append(T(x + 120, 26, "トーションスナップ", "middle", 12.5, INK, True))
    o.append(T(x + 120, 44, "軸のねじりでたわむ。押すと外れる", "middle", 10, MUT))
    o.append(RECT(x + 30, 120, 180, 14, 3, SSOFT, SIG, 1.6))
    o.append(RECT(x + 110, 134, 20, 60, 0, PAN, INK, 1.4))
    o.append(T(x + 120, 214, "ねじり軸", "middle", 10, MUT))
    o.append(_f09_poly([(x + 30, 120), (x + 18, 106), (x + 30, 106)], SIG, SSOFT))
    o.append(ARR(x + 190, 90, x + 190, 116, ALI, 1.8, 7))
    o.append(T(x + 190, 84, "押す", "middle", 10, ALI))
    o.append(ARR(x + 50, 116, x + 50, 92, SIG, 1.8, 7))
    o.append(T(x + 54, 84, "つめが上がる", "start", 10, SIG))
    # 環状
    x = 590
    o.append(T(x + 120, 26, "環状スナップ", "middle", 12.5, INK, True))
    o.append(T(x + 120, 44, "円周全体が広がる。キャップなど", "middle", 10, MUT))
    o.append(RECT(x + 80, 110, 80, 110, 0, SCR, MUT, 1.2))
    o.append(_f09_poly([(x + 80, 120), (x + 70, 128), (x + 80, 136)], MUT, SCR, 1.2))
    o.append(_f09_poly([(x + 160, 120), (x + 170, 128), (x + 160, 136)], MUT, SCR, 1.2))
    o.append(PL([(x + 60, 70), (x + 60, 150), (x + 76, 150)], SIG, 2.2))
    o.append(PL([(x + 180, 70), (x + 180, 150), (x + 164, 150)], SIG, 2.2))
    o.append(W(x + 60, 70, x + 180, 70, c=SIG, lw=2.2))
    o.append(T(x + 120, 92, "キャップ", "middle", 10, SIG))
    o.append(T(x + 120, 236, "軸の出っ張りを乗り越える", "middle", 10, MUT))
    return SVG(860, 250, o, "スナップフィットの 3 つの型。どれも部品の一部を弾性的にたわませて引っかける。")
F["e09_types"] = _f09_types()


def _f09_beam():
    o = []
    x0, y0, L, hh = 120, 150, 420, 30
    o.append(RECT(x0 - 70, y0 - 60, 70, 150, 0, SCR, MUT, 1.2))
    o.append(T(x0 - 35, y0 + 108, "根元（固定）", "middle", 10, MUT))
    # 元の形（破線）
    o.append(RECT(x0, y0, L, hh, 0, "none", FNT, 1.2, "5,4"))
    # たわんだ形
    def yy(u):
        return 60 * (3 * u * u - u ** 3) / 2.0
    top, bot = [], []
    for i in range(61):
        u = i / 60
        top.append((x0 + L * u, y0 + yy(u)))
        bot.append((x0 + L * u, y0 + hh + yy(u)))
    o.append(_f09_poly(top + list(reversed(bot)), SIG, SSOFT, 1.8))
    # y
    o.append(DIM(x0 + L + 20, y0 + hh / 2, x0 + L + 20, y0 + hh / 2 + 60, None, ALI))
    o.append(T(x0 + L + 30, y0 + hh / 2 + 34, "y（先端のたわみ）", "start", 11, ALI, True))
    o.append(ARR(x0 + L - 10, y0 + 10, x0 + L - 10, y0 + 56, INK, 2.0, 8))
    o.append(T(x0 + L - 18, y0 + 14, "P", "end", 13, INK, True, True))
    o.append(DIM(x0, y0 - 24, x0 + L, y0 - 24, "L（長さ）", MUT, 11))
    o.append(DIM(x0 + 40, y0, x0 + 40, y0 + hh, None, MUT))
    o.append(T(x0 + 48, y0 + hh / 2 + 4, "h", "start", 12, INK, True, True))
    o.append(T(x0 + 8, y0 - 6, "引張りが最大", "start", 10, ALI, True))
    o.append(T(x0 + 8, y0 + hh + 18, "圧縮が最大", "start", 10, GRN, True))
    # 断面
    sx, sy = 760, 90
    o.append(T(sx, 50, "断面（根元）", "middle", 11, INK, True))
    o.append(RECT(sx - 40, sy, 80, 30, 0, SSOFT, SIG, 1.6))
    o.append(DIM(sx - 40, sy + 46, sx + 40, sy + 46, "b（幅）", MUT, 10.5))
    o.append(T(sx + 50, sy + 20, "h", "start", 12, INK, True, True))
    o.append(W(sx - 50, sy + 15, sx + 50, sy + 15, c=FNT, lw=1, dash="4,3"))
    o.append(T(sx, sy + 82, "中立面から表面まで", "middle", 10, MUT))
    o.append(T(sx, sy + 96, "c = h/2", "middle", 10.5, MUT, mono=True))
    return SVG(860, 268, o, "片持ちスナップは片持ちはりである。先端を y だけたわませると、根元の表面に最大のひずみが生じる。")
F["e09_beam"] = _f09_beam()


def _f09_force():
    o = []
    al = math.radians(30)
    # はりと爪（右へ挿入）
    bx0, by = 40, 200
    o.append(RECT(bx0, by, 330, 26, 0, SSOFT, SIG, 1.6))
    o.append(T(bx0 + 100, by + 18, "はり", "middle", 11, SIG, True))
    H = 70
    xf = 370                     # 斜面の下端（前）
    xb = xf - H / math.tan(al)   # 斜面の上端（後ろ）
    o.append(_f09_poly([(xb - 30, by), (xb - 30, by - H), (xb, by - H), (xf, by)], SIG, SSOFT, 1.8))
    # 相手部品の角（固定）
    t = 0.55
    cxp = xf + (xb - xf) * t
    cyp = by - H * t
    o.append(_f09_poly([(cxp, cyp), (cxp + 150, cyp), (cxp + 150, cyp - 70), (cxp, cyp - 70)], INK, SCR, 1.6))
    o.append(T(cxp + 75, cyp - 40, "相手部品（固定）", "middle", 10.5, INK))
    o.append(D(cxp, cyp, INK, 3.6))
    # 角度 α
    r = 54
    arc = []
    for i in range(21):
        a = math.pi - al * i / 20
        arc.append((xf + r * math.cos(a), by - r * math.sin(a)))
    o.append(PL(arc, ALI, 1.4))
    o.append(T(xf - r - 12, by - 12, "α", "middle", 13, ALI, True))
    o.append(W(xf, by, xf - 90, by, c=FNT, lw=1, dash="3,3"))
    # 力（爪が受ける力）
    nx, ny = -math.sin(al), math.cos(al)   # 斜面に垂直、爪に押し込む向き（画面座標で下向き +）
    tx, ty = -math.cos(al), -math.sin(al)  # 斜面に沿って上（後ろ）向き
    Ln = 80
    o.append(ARR(cxp, cyp, cxp + Ln * nx, cyp + Ln * ny, INK, 2.2, 9))
    o.append(T(cxp + Ln * nx - 10, cyp + Ln * ny + 16, "N（斜面に垂直）", "end", 11, INK, True))
    Lf = 55
    o.append(ARR(cxp, cyp, cxp + Lf * tx, cyp + Lf * ty, GRN, 2.2, 9))
    o.append(T(cxp + Lf * tx - 6, cyp + Lf * ty - 8, "μN（摩擦）", "end", 11, GRN, True))
    # 成分の説明（右側）
    X = 560
    o.append(T(X, 120, "爪が相手から受ける力の成分", "start", 11.5, INK, True))
    o.append(T(X, 142, "挿入と逆向き:  N sin α + μN cos α", "start", 11, MUT, mono=True))
    o.append(T(X, 160, "→ 押し込む力 W がこれとつり合う", "start", 10.5, MUT))
    o.append(T(X, 186, "はりを曲げる向き: N cos α − μN sin α", "start", 11, MUT, mono=True))
    o.append(T(X, 204, "→ はりのたわみの反力 P とつり合う", "start", 10.5, MUT))
    o.append(ARR(bx0 + 10, by + 74, bx0 + 110, by + 74, SIG, 2.2, 9))
    o.append(T(bx0 + 120, by + 78, "W（押し込む向き）", "start", 11, SIG, True))
    o.append(ARR(xf + 6, by + 30, xf + 6, by + 70, ALI, 2.0, 8))
    o.append(T(xf + 14, by + 60, "P（はりを曲げる向き）", "start", 11, ALI, True))
    return SVG(860, 300, o, "組み付けのときの力のつり合い。爪の斜面（傾き α）を相手部品の角が押す。垂直な力 N と摩擦 μN の成分から W と P の関係が決まる。")
F["e09_force"] = _f09_force()


def _f09_angles():
    o = []
    def hook(x, ret, c, title, sub):
        o.append(T(x + 190, 26, title, "middle", 12.5, c, True))
        o.append(RECT(x + 20, 170, 340, 20, 0, SSOFT, SIG, 1.4))
        H = 60
        xf = x + 300
        xb = xf - H / math.tan(math.radians(30))
        back = xb - (H / math.tan(math.radians(ret)) if ret < 89 else 0)
        o.append(_f09_poly([(back, 170), (xb, 170 - H), (xf, 170)], SIG, SSOFT, 1.6))
        o.append(T((xb + xf) / 2 + 22, 128, "挿入側 α", "start", 10.5, MUT))
        o.append(T(back - 6, 128, "戻り側 α′ = %d°" % ret, "end", 10.5, c, True))
        o.append(T(x + 190, 216, sub, "middle", 10.5, c))
        o.append(ARR(x + 120, 236, x + 40, 236, MUT, 1.4, 6))
        o.append(T(x + 126, 240, "外す向き", "start", 10, MUT))
    hook(30, 45, SIG, "戻り角 45°: 引けば外れる", "外す力は W′ = P(μ + tan α′)/(1 − μ tan α′)")
    hook(450, 90, ALI, "戻り角 90°: 引いても外れない", "爪を手でたわませないと外れない")
    return SVG(860, 256, o, "戻り側の斜面の角度 α′ で、外れやすさが決まる。μ tan α′ ≥ 1 になると、引く力をいくら大きくしても外れない。")
F["e09_angles"] = _f09_angles()


def _f09_root():
    o = []
    def part(x, good):
        c = SIG if good else ALI
        o.append(T(x + 190, 26, "根元に R（良い例）" if good else "根元が直角（悪い例）", "middle", 12.5, c, True))
        o.append(RECT(x + 30, 60, 60, 160, 0, SCR, MUT, 1.2))
        if good:
            a1 = [(x + 110 - 20 * math.cos((math.pi / 2) * k / 12), 100 + 20 * math.sin((math.pi / 2) * k / 12)) for k in range(13)]
            a2 = [(x + 110 - 20 * math.cos((math.pi / 2) * k / 12), 160 - 20 * math.sin((math.pi / 2) * k / 12)) for k in range(13)]
            o.append(PL([(x + 90, 60)] + a1 + [(x + 330, 120)], c, 1.8))
            o.append(PL([(x + 90, 220)] + a2 + [(x + 330, 140)], c, 1.8))
            o.append(W(x + 330, 120, x + 330, 140, c=c, lw=1.8))
            o.append(T(x + 150, 108, "R ≈ 0.5h 以上", "start", 10.5, c, True))
            o.append(T(x + 190, 190, "応力が R に沿って分散する", "middle", 10.5, MUT))
        else:
            o.append(PL([(x + 90, 60), (x + 90, 120), (x + 330, 120)], c, 1.8))
            o.append(PL([(x + 90, 220), (x + 90, 140), (x + 330, 140)], c, 1.8))
            o.append(W(x + 330, 120, x + 330, 140, c=c, lw=1.8))
            o.append(W(x + 90, 120, x + 104, 110, c=ALI, lw=2.4))
            o.append(W(x + 104, 110, x + 98, 102, c=ALI, lw=2.4))
            o.append(T(x + 112, 100, "角に応力が集中して割れる", "start", 10.5, c, True))
            o.append(T(x + 190, 190, "最大応力が計算値の数倍になる", "middle", 10.5, MUT))
        o.append(ARR(x + 320, 80, x + 320, 114, INK, 1.8, 7))
        o.append(T(x + 314, 84, "P", "end", 12, INK, True, True))
    part(30, False)
    part(450, True)
    return SVG(860, 236, o, "根元の形。角が直角だと応力集中で最大応力が大きくなる。R の大きさは設計資料の代表値で、R を大きくしすぎると根元が厚肉になり、ひけの原因になる。")
F["e09_root"] = _f09_root()


def _f09_taper():
    o = []
    # 左: はりの形
    o.append(T(200, 26, "はりの形（側面）", "middle", 12, INK, True))
    o.append(RECT(30, 50, 30, 160, 0, SCR, MUT, 1.2))
    o.append(_f09_poly([(60, 60), (360, 60), (360, 90), (60, 90)], ALI, ASOFT, 1.6))
    o.append(T(370, 80, "一定厚さ h", "start", 10.5, ALI, True))
    o.append(_f09_poly([(60, 140), (360, 147.5), (360, 162.5), (60, 170)], SIG, SSOFT, 1.6))
    o.append(T(370, 152, "先端で h/2", "start", 10.5, SIG, True))
    o.append(T(370, 168, "（テーパー）", "start", 10.5, SIG))
    # 右: 表面ひずみの分布
    x0, y0, w, h = 500, 200, 300, 140
    o.append(AXES(x0, y0, w + 20, h + 16, "根元からの位置", "表面のひずみ"))
    def eps(u, hr):
        hx = 1 - (1 - hr) * u
        return (1 - u) / hx ** 2
    for hr, c in ((1.0, ALI), (0.5, SIG)):
        pts = [(x0 + w * i / 50, y0 - h * eps(i / 50, hr)) for i in range(51)]
        o.append(PL(pts, c, 2.2))
    o.append(T(x0, y0 + 16, "根元", "middle", 10, MUT))
    o.append(T(x0 + 190, y0 - 142, "テーパー: 長い範囲で", "start", 10.5, SIG, True))
    o.append(T(x0 + 190, y0 - 127, "ひずみがほぼ最大値", "start", 10.5, SIG, True))
    o.append(T(x0 + 12, y0 - 14, "一定厚さ: 根元だけが最大", "start", 10.5, ALI, True))
    o.append(T(430, 238, "根元のひずみが同じなら、先端で h/2 のテーパーは約 1.64 倍たわませられる（数値計算）", "middle", 11, INK))
    return SVG(860, 256, o, "厚さを先端に向けて薄くすると、はり全体が均等に曲がり、同じ許容ひずみで大きくたわませられる。")
F["e09_taper"] = _f09_taper()


def _f09_mold():
    o = []
    def panel(x, title, sub, kind, c):
        o.append(T(x + 190, 26, title, "middle", 12.5, c, True))
        # 壁と腕
        o.append(RECT(x + 40, 190, 300, 18, 0, SCR, MUT, 1.2))
        o.append(_f09_poly([(x + 180, 190), (x + 180, 70), (x + 196, 70), (x + 196, 190)], SIG, SSOFT))
        o.append(_f09_poly([(x + 196, 80), (x + 222, 104), (x + 222, 118), (x + 196, 118)], SIG, SSOFT))
        o.append(T(x + 172, 124, "爪の下面", "end", 10, SIG))
        o.append(T(x + 172, 138, "= アンダーカット", "end", 10, SIG))
        if kind == "win":
            o.append(RECT(x + 196, 190, 34, 18, 0, PAN, ALI, 1.6, "4,3"))
            o.append(RECT(x + 199, 120, 28, 70, 0, ASOFT, ALI, 1.4, "4,3"))
            o.append(ARR(x + 213, 160, x + 213, 236, ALI, 2.0, 8))
            o.append(T(x + 236, 228, "下から入る型が", "start", 10, ALI))
            o.append(T(x + 236, 242, "窓を通って抜ける", "start", 10, ALI))
        else:
            o.append(RECT(x + 199, 120, 60, 40, 0, ASOFT, ALI, 1.4, "4,3"))
            o.append(ARR(x + 262, 140, x + 330, 140, ALI, 2.0, 8))
            o.append(T(x + 300, 160, "横に抜く", "middle", 10, ALI))
            o.append(T(x + 300, 174, "スライド", "middle", 10, ALI))
        o.append(T(x + 190, 270, sub, "middle", 10.5, MUT))
    panel(20, "底に窓を開ける", "型の構造が単純で安い。窓から光や水が入らないか確認する", "win", SIG)
    panel(450, "スライドで抜く", "外観に窓が出ないが、型が高くなる（04 章）", "slide", GRN)
    return SVG(860, 286, o, "爪の下面はアンダーカットになる。真下に窓を開けて型を通すか、スライドで横に抜く。")
F["e09_mold"] = _f09_mold()
