# -*- coding: utf-8 -*-
# ===================== 12. 防水と防塵 =====================

def _e12_case(x, y, w, h):
    return ('<rect x="%g" y="%g" width="%g" height="%g" fill="var(--muted)" fill-opacity="0.22"'
            ' stroke="var(--muted)" stroke-width="1.2"/>' % (x, y, w, h))

def _e12_seal(x, y, w, h, r=3):
    """ゴム・シール材（緑の半透明）"""
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="var(--signal)" fill-opacity="0.35"'
            ' stroke="var(--signal)" stroke-width="1.3"/>' % (x, y, w, h, r))

def _e12_water(x, y, w, h):
    return ('<rect x="%g" y="%g" width="%g" height="%g" fill="var(--blue)" fill-opacity="0.30"'
            ' stroke="none"/>' % (x, y, w, h))

def _e12_drop(x, y, s=1.0):
    return ('<path d="M %g %g Q %g %g %g %g A %g %g 0 1 1 %g %g Q %g %g %g %g Z" fill="var(--blue)" fill-opacity="0.75"/>'
            % (x, y, x + 4 * s, y + 6 * s, x + 4 * s, y + 9 * s, 4 * s, 4 * s, x - 4 * s, y + 9 * s,
               x - 4 * s, y + 6 * s, x, y))


def _e12_ipcode():
    o = []
    o.append(T(330, 92, "IP", "middle", 46, INK, True, True))
    o.append(RECT(386, 44, 62, 64, 8, SSOFT, SIG, 2))
    o.append(T(417, 92, "6", "middle", 46, SIG, True, True))
    o.append(RECT(458, 44, 62, 64, 8, "var(--blue)", GRN, 2))
    o.append('<rect x="458" y="44" width="62" height="64" rx="8" fill="var(--panel)" fill-opacity="0.75"/>')
    o.append(T(489, 92, "7", "middle", 46, GRN, True, True))
    o.append(W(417, 108, 417, 140, c=SIG, lw=1.6))
    o.append(W(417, 140, 250, 140, c=SIG, lw=1.6))
    o.append(BOX(70, 120, 180, 70, "第 1 数字（0〜6）", "固形物（指・工具・ほこり）に対する保護", SIG, SSOFT))
    o.append(W(489, 108, 489, 140, c=GRN, lw=1.6))
    o.append(W(489, 140, 610, 140, c=GRN, lw=1.6))
    o.append(BOX(610, 120, 190, 70, "第 2 数字（0〜9）", "水に対する保護", GRN, PAN))
    o.append(T(430, 24, "IP コード（IEC 60529 / JIS C 0920）", "middle", 12, MUT, True))
    o.append(T(430, 214, "規定しない数字は X と書く（例: IPX7 は水のみ、IP5X はほこりのみ）", "middle", 11, INK))
    return SVG(860, 232, o, "IP コードの読み方。数字が大きいほど厳しい条件に耐えるが、第 2 数字の 7・8（水没）は 5・6（噴流）を含まない。")
F["e12_ipcode"] = _e12_ipcode()


def _e12_paths():
    o = []
    titles = [("隙間", "水が直接流れ込む"), ("毛細管", "細い隙間を水が上る"),
              ("圧力差", "中が負圧になり吸い込む"), ("結露", "中の湿気が冷えて水になる")]
    for i, (t, s) in enumerate(titles):
        x0 = 12 + i * 212
        o.append(RECT(x0, 8, 200, 250, 10, "none", LIN, 1.2))
        o.append(T(x0 + 100, 30, t, "middle", 13, INK, True))
        o.append(T(x0 + 100, 48, s, "middle", 10.5, MUT))
        if i == 0:
            o.append(_e12_case(x0 + 30, 120, 70, 14))
            o.append(_e12_case(x0 + 112, 120, 60, 14))
            for k in range(3):
                o.append(_e12_drop(x0 + 92 + k * 12, 72 + k * 10, 1.1))
            o.append(ARR(x0 + 106, 112, x0 + 106, 168, GRN, 2, 8))
            o.append(T(x0 + 100, 192, "合わせ目・穴の隙間", "middle", 10.5, ALI, True))
            o.append(T(x0 + 100, 70, "外", "start", 10, MUT))
            o.append(T(x0 + 40, 160, "内", "middle", 10, MUT))
        elif i == 1:
            o.append(_e12_case(x0 + 40, 70, 56, 130))
            o.append(_e12_case(x0 + 100, 70, 56, 130))
            o.append(_e12_water(x0 + 20, 186, 160, 30))
            o.append(_e12_water(x0 + 96, 110, 4, 76))
            o.append(ARR(x0 + 120, 176, x0 + 120, 120, GRN, 1.6))
            o.append(T(x0 + 128, 140, "上る", "start", 10, GRN, True))
            o.append(T(x0 + 100, 236, "隙間が細いほど高く上る", "middle", 10.5, ALI, True))
        elif i == 2:
            o.append(RECT(x0 + 40, 80, 120, 100, 8, PAN, INK, 1.6))
            o.append(T(x0 + 100, 126, "内圧が下がる", "middle", 10.5, INK, True))
            o.append(T(x0 + 100, 144, "（冷える）", "middle", 10, MUT))
            o.append(_e12_water(x0 + 20, 180, 160, 26))
            for (xx, yy) in ((x0 + 40, 196), (x0 + 160, 196)):
                pass
            o.append(ARR(x0 + 30, 160, x0 + 50, 160, GRN, 1.6))
            o.append(ARR(x0 + 170, 160, x0 + 150, 160, GRN, 1.6))
            o.append(T(x0 + 100, 228, "シールの弱い所から吸う", "middle", 10.5, ALI, True))
        else:
            o.append(RECT(x0 + 40, 84, 120, 106, 8, PAN, INK, 1.6))
            o.append(T(x0 + 100, 120, "湿った空気", "middle", 10.5, INK, True))
            o.append(T(x0 + 100, 74, "冷たい外気・雨", "middle", 10, GRN))
            for k in range(5):
                o.append(_e12_drop(x0 + 56 + k * 22, 172, 0.8))
            o.append(T(x0 + 100, 214, "冷えた壁の内側に水滴", "middle", 10.5, ALI, True))
    return SVG(860, 266, o, "水が入る 4 つの道筋。シールで塞げるのは左の 3 つで、結露は中の空気の湿気そのものが原因になる。")
F["e12_paths"] = _e12_paths()


def _e12_gasket():
    o = []
    titles = [("平ガスケット", "板状のゴムを挟む"), ("発泡ガスケット", "柔らかく小さい力でつぶれる"),
              ("成形ガスケット", "溝に入れる・ケースに一体成形"), ("O リング", "溝に入れた丸断面のゴム")]
    for i, (t, s) in enumerate(titles):
        x0 = 12 + i * 212
        o.append(RECT(x0, 8, 200, 236, 10, "none", LIN, 1.2))
        o.append(T(x0 + 100, 30, t, "middle", 12.5, INK, True))
        o.append(T(x0 + 100, 48, s, "middle", 10, MUT))
        cx = x0 + 100
        if i == 0:
            o.append(_e12_case(x0 + 30, 90, 140, 30))
            o.append(_e12_seal(x0 + 30, 120, 140, 10, 0))
            o.append(_e12_case(x0 + 30, 130, 140, 30))
            o.append(T(cx, 190, "フランジの全面で受ける", "middle", 10.5, MUT))
            o.append(T(cx, 210, "面圧が要る・はみ出しに注意", "middle", 10.5, MUT))
        elif i == 1:
            o.append(_e12_case(x0 + 30, 90, 140, 30))
            o.append('<rect x="%g" y="120" width="60" height="16" rx="3" fill="var(--signal)" fill-opacity="0.25" stroke="var(--signal)" stroke-width="1.2" stroke-dasharray="3,2"/>' % (x0 + 50))
            o.append(_e12_case(x0 + 30, 136, 140, 30))
            o.append(T(cx, 190, "独立気泡のものを使う", "middle", 10.5, MUT))
            o.append(T(cx, 210, "へたり（永久ひずみ）に注意", "middle", 10.5, MUT))
        elif i == 2:
            # 溝付きの下ケースと凸の上ケース（舌と溝）
            o.append(_e12_case(x0 + 30, 130, 140, 34))
            o.append('<rect x="%g" y="130" width="34" height="18" fill="var(--paper)" stroke="none"/>' % (cx - 17))
            o.append(W(cx - 17, 130, cx - 17, 148, c=MUT, lw=1.2)); o.append(W(cx + 17, 130, cx + 17, 148, c=MUT, lw=1.2))
            o.append(W(cx - 17, 148, cx + 17, 148, c=MUT, lw=1.2))
            o.append('<rect x="%g" y="136" width="30" height="12" rx="5" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)" stroke-width="1.3"/>' % (cx - 15))
            o.append(_e12_case(x0 + 30, 92, 140, 30))
            o.append(_e12_case(cx - 8, 122, 16, 14))
            o.append(T(cx, 190, "舌（凸）で溝の中を押す", "middle", 10.5, MUT))
            o.append(T(cx, 210, "位置がずれにくい", "middle", 10.5, MUT))
        else:
            o.append(_e12_case(x0 + 30, 130, 140, 34))
            o.append('<rect x="%g" y="130" width="34" height="18" fill="var(--paper)" stroke="none"/>' % (cx - 17))
            o.append(W(cx - 17, 130, cx - 17, 148, c=MUT, lw=1.2)); o.append(W(cx + 17, 130, cx + 17, 148, c=MUT, lw=1.2))
            o.append(W(cx - 17, 148, cx + 17, 148, c=MUT, lw=1.2))
            o.append('<ellipse cx="%g" cy="139" rx="12" ry="9" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)" stroke-width="1.3"/>' % cx)
            o.append(_e12_case(x0 + 30, 100, 140, 30))
            o.append(T(cx, 190, "溝の寸法で", "middle", 10.5, MUT))
            o.append(T(cx, 210, "つぶし量が決まる", "middle", 10.5, MUT))
    return SVG(860, 252, o, "シール材の種類（断面）。灰色＝ケース、緑＝シール材。溝に入れる方式は、つぶす量を溝の寸法で決められる。")
F["e12_gasket"] = _e12_gasket()


def _e12_oring():
    o = []
    sc = 34.0     # 1 mm = 34 px
    d, h, b = 2.4, 1.8, 3.4
    def groove(x0, ytop, show_lid):
        # 溝: 底が ytop + h*sc
        gw, gh = b * sc, h * sc
        o.append(_e12_case(x0 - 60, ytop, 60, gh + 30))
        o.append(_e12_case(x0 + gw, ytop, 60, gh + 30))
        o.append(_e12_case(x0, ytop + gh, gw, 30))
        if show_lid:
            o.append(_e12_case(x0 - 60, ytop - 30, gw + 120, 30))
        return gw, gh
    # 左: つぶす前
    x0, yt = 90, 96
    gw, gh = groove(x0, yt, False)
    r = d / 2 * sc
    o.append(CIRC(x0 + r + 6, yt + gh - r, r, SIG, 1.6, "var(--signal-soft)"))
    o.append(T(x0 + gw / 2, 30, "つぶす前", "middle", 12.5, INK, True))
    o.append(DIM(x0 + r + 6 + r + 14, yt + gh - 2 * r, x0 + r + 6 + r + 14, yt + gh, None, SIG))
    o.append(T(x0 + 2 * r + 30, yt + gh - r + 4, "d", "start", 12, SIG, True))
    o.append(DIM(x0 - 30, yt, x0 - 30, yt + gh, None, MUT))
    o.append(T(x0 - 40, yt + gh / 2 + 4, "h", "end", 12, MUT, True))
    o.append(DIM(x0, yt + gh + 48, x0 + gw, yt + gh + 48, None, MUT))
    o.append(T(x0 + gw / 2, yt + gh + 66, "b（溝幅）", "middle", 11, MUT, True))
    o.append(W(x0 - 60, yt, x0 + gw + 60, yt, c=MUT, lw=1, dash="4,3"))
    o.append(T(x0 + gw + 64, yt + 4, "相手の面", "start", 10, MUT))
    # 右: つぶした後
    x1 = 470
    gw, gh = groove(x1, yt, True)
    # 変形後（概略）: 高さ h、面積一定の長円
    A = math.pi * d * d / 4
    Wd = h + (A - math.pi * h * h / 4) / h
    o.append(RECT(x1 + (b - Wd) / 2 * sc, yt, Wd * sc, gh, gh / 2, "var(--signal-soft)", SIG, 1.6))
    o.append(T(x1 + gw / 2, 30, "つぶした後（形は概略）", "middle", 12.5, INK, True))
    o.append(T(x1 + gw / 2, yt - 40, "ふた（相手の面）", "middle", 10, MUT))
    o.append(T(x1 + gw + 70, yt + 16, "高さ d → h に", "start", 10.5, SIG, True))
    o.append(T(x1 + gw + 70, yt + 34, "つぶれ、横に広がる", "start", 10.5, SIG, True))
    o.append(T(x1 + gw + 70, yt + 60, "溝の中に広がる", "start", 10.5, MUT))
    o.append(T(x1 + gw + 70, yt + 78, "余地を残す", "start", 10.5, MUT))
    # 式
    o.append(T(430, 252, "つぶし率 = (d − h) / d　　充填率 = (πd²/4) / (b·h)", "middle", 12, INK, True, True))
    o.append(T(430, 274, "例: d = 2.4 mm、h = 1.8 mm、b = 3.4 mm → つぶし率 25 %、充填率 74 %", "middle", 11, MUT))
    return SVG(860, 290, o, "O リングと溝（断面）。溝の深さ h が O リングの線径 d より浅いので、ふたを閉じると O リングがつぶれて面を押す。")
F["e12_oring"] = _e12_oring()


def _e12_flange():
    o = []
    # 上段: ねじの間でふたが浮く（側面）
    o.append(T(20, 24, "× ねじの間隔が広い・フランジが薄い", "start", 12, ALI, True))
    o.append(_e12_case(40, 100, 380, 16))
    o.append(_e12_seal(40, 92, 380, 8, 0))
    o.append('<path d="M 60 92 Q 230 56 400 92" fill="none" stroke="var(--alias)" stroke-width="1.6"/>')
    o.append('<path d="M 60 84 Q 230 48 400 84" fill="none" stroke="var(--alias)" stroke-width="1.6"/>')
    for x in (60, 400):
        o.append(RECT(x - 10, 70, 20, 14, 2, INK, INK, 1))
        o.append(W(x, 84, x, 112, c=INK, lw=2))
    o.append(T(230, 50, "ふたがたわむ", "middle", 10.5, ALI))
    o.append(DIM(230, 76, 230, 92, None, ALI))
    o.append(T(240, 84, "シールが離れる", "start", 10.5, ALI, True))
    o.append(DIM(60, 136, 400, 136, None, MUT))
    o.append(T(230, 154, "ねじの間隔 p", "middle", 10.5, MUT))
    # 下段: 間隔を半分に
    o.append(T(20, 190, "○ 間隔を狭く・フランジを厚く・リブで補強", "start", 12, SIG, True))
    o.append(_e12_case(40, 262, 380, 16))
    o.append(_e12_seal(40, 254, 380, 8, 0))
    o.append(_e12_case(40, 230, 380, 24))
    for x in (60, 230, 400):
        o.append(RECT(x - 10, 216, 20, 14, 2, INK, INK, 1))
        o.append(W(x, 230, x, 274, c=INK, lw=2))
    o.append(T(230, 300, "たわみ ∝ p⁴ / t³（p を半分 → 1/16）", "middle", 10.5, SIG, True))
    # 右: 上から見たねじ配置
    o.append(T(660, 24, "上から見たふた", "middle", 11, MUT, True))
    o.append(RECT(520, 40, 280, 200, 16, PAN, INK, 1.6))
    o.append(RECT(536, 56, 248, 168, 10, "none", SIG, 6))
    o.append('<rect x="536" y="56" width="248" height="168" rx="10" fill="none" stroke="var(--panel)" stroke-width="3"/>')
    for (x, y) in [(528, 48), (660, 48), (792, 48), (528, 232), (660, 232), (792, 232), (528, 140), (792, 140)]:
        o.append(CIRC(x, y, 6, INK, 1.4, fill="var(--panel)"))
    o.append(T(660, 140, "シール線（緑）", "middle", 10.5, SIG, True))
    o.append(T(660, 160, "の外側にねじを並べる", "middle", 10.5, SIG, True))
    o.append(T(660, 262, "角と各辺の中央にねじ", "middle", 10.5, MUT))
    return SVG(860, 312, o, "締付とフランジのたわみ。シールを押す力はねじの位置で最大、ねじとねじの中間で最小になる。")
F["e12_flange"] = _e12_flange()


def _e12_vent():
    o = []
    # 左: 密閉した箱が冷える
    o.append(T(150, 24, "密閉した箱が冷えると", "middle", 12, INK, True))
    o.append(RECT(50, 50, 200, 130, 10, PAN, INK, 1.8))
    o.append(T(150, 100, "25 °C → −10 °C", "middle", 12, INK, True, True))
    o.append(T(150, 122, "内圧 101.3 → 89.4 kPa", "middle", 11, ALI, True))
    o.append(T(150, 142, "（約 12 kPa の負圧）", "middle", 10.5, ALI))
    for (x1, y1, x2, y2) in ((150, 30 + 4, 150, 46), (30, 115, 46, 115), (270, 115, 254, 115), (150, 200, 150, 184)):
        pass
    o.append(ARR(20, 115, 46, 115, GRN, 1.8)); o.append(ARR(280, 115, 254, 115, GRN, 1.8))
    o.append(ARR(150, 210, 150, 184, GRN, 1.8))
    o.append(T(150, 230, "外の空気・水が押し込まれる", "middle", 10.5, GRN, True))
    o.append(T(150, 248, "水深 1.2 m 相当の差圧", "middle", 10.5, MUT))
    # 中: 通気膜
    o.append(T(470, 24, "防水通気膜", "middle", 12, SIG, True))
    o.append(_e12_case(330, 110, 110, 20))
    o.append(_e12_case(500, 110, 110, 20))
    o.append('<rect x="440" y="104" width="60" height="6" fill="var(--signal)" fill-opacity="0.6" stroke="var(--signal)" stroke-width="1"/>')
    o.append(T(470, 98, "膜（細かい孔）", "middle", 10, SIG, True))
    for k in range(4):
        o.append(ARR(450 + k * 14, 150, 450 + k * 14, 116, MUT, 1.2, 5))
    o.append(T(470, 170, "空気は通る（圧力がそろう）", "middle", 10.5, MUT))
    for k in range(3):
        o.append(_e12_drop(452 + k * 18, 60, 1.0))
    o.append(T(530, 66, "水滴は通らない", "start", 10.5, GRN, True))
    o.append(T(470, 66 + 0, "", "middle", 10))
    o.append(T(470, 214, "内", "middle", 10, MUT))
    o.append(T(470, 56 - 18, "外", "middle", 10, MUT))
    # 右: ケーブルグランド
    o.append(T(740, 24, "ケーブルグランド", "middle", 12, INK, True))
    o.append(_e12_case(650, 60, 18, 64))
    o.append(_e12_case(650, 150, 18, 64))
    o.append(RECT(668, 112, 120, 50, 6, PAN, INK, 1.6))
    o.append(_e12_seal(700, 124, 60, 9, 2))
    o.append(_e12_seal(700, 141, 60, 9, 2))
    o.append(RECT(600, 133, 250, 8, 4, "var(--blue)", GRN, 1))
    o.append(T(846, 156, "ケーブル", "end", 10, GRN, True))
    o.append(T(728, 106, "本体・ナット", "middle", 10, MUT))
    o.append(T(740, 196, "ナットを締めると", "middle", 10.5, MUT))
    o.append(T(740, 214, "シールがケーブルを締める", "middle", 10.5, SIG, True))
    o.append(T(659, 240, "壁", "middle", 10, MUT))
    return SVG(860, 262, o, "温度変化による内外の圧力差（左）、圧力をそろえる防水通気膜（中）、ケーブルの引き込み（右）。")
F["e12_vent"] = _e12_vent()
