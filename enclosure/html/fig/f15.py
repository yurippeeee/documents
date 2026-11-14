# -*- coding: utf-8 -*-
# 15. 安全と規格 の図（figures.py から exec される）

# ---- 1. 3 ブロックモデル ----
def _f15_model():
    o = []
    o.append(T(20, 24, "安全防護が無いと: 痛み・傷害が起こる", "start", 11.5, ALI, True))
    s, _ = flowright(20, 70, [("エネルギー源", "電気・電力・機械・熱…", ALI, ASOFT),
                             ("エネルギーの伝達", "触れる・燃え移る・挟む"),
                             ("体の部位", "痛み・傷害", ALI, ASOFT)], w=240, bh=54, gap=50)
    o.append(s)
    o.append(T(20, 134, "安全防護を間に入れると: 伝達が止まる", "start", 11.5, SIG, True))
    o.append(BOX(20, 152, 220, 54, "エネルギー源", "クラス 1〜3 に分類", ALI, ASOFT))
    o.append(ARR(240, 179, 300, 179, MUT, 1.6))
    o.append(BOX(300, 146, 240, 66, "安全防護", "絶縁・筐体・距離・ガードなど", SIG, SSOFT, sz=13))
    o.append(ARR(540, 179, 600, 179, LIN, 1.6))
    o.append(W(560, 167, 580, 191, c=ALI, lw=2.2))
    o.append(W(560, 191, 580, 167, c=ALI, lw=2.2))
    o.append(BOX(600, 152, 240, 54, "体の部位", "傷害が起こらない", SIG, PAN))
    return SVG(860, 224, o, "ハザードベースの考え方（3 ブロックモデル）。エネルギー源と体の間に安全防護を置き、エネルギーの伝達を止める。")
F["e15_model"] = _f15_model()


# ---- 2. クラスと必要な安全防護 ----
def _f15_classes():
    o = []
    cols = [("クラス 1", "痛みを感じない程度", "安全防護は不要", SIG, SSOFT),
            ("クラス 2", "痛みはあるが傷害にならない", "基礎安全防護 1 つ", GRN, PAN),
            ("クラス 3", "傷害になりうる", "基礎＋付加、または強化安全防護", ALI, ASOFT)]
    o.append(T(20, 22, "エネルギー源の種類（記号の後ろにクラスの数字を付ける。例: ES3, PS2）", "start", 11, INK, True))
    kinds = [("ES", "電気（感電）"), ("PS", "電力（火災）"), ("MS", "機械（けが）"), ("TS", "熱（やけど）"), ("RS", "放射（光・音など）")]
    for i, (a, b) in enumerate(kinds):
        o.append(BOX(20 + i * 166, 34, 154, 44, a, b, LIN, PAN, sz=13, ssz=10))
    for i, (t, s, g, c, fl) in enumerate(cols):
        x0 = 20 + i * 280
        o.append(BOX(x0, 104, 260, 54, t, s, c, fl, sz=13, ssz=10.5))
        o.append(ARR(x0 + 130, 158, x0 + 130, 178, MUT, 1.4, 6))
        o.append(BOX(x0, 180, 260, 44, g, None, c, PAN, sz=11.5))
    o.append(T(430, 246, "上は一般の人（特別な訓練を受けていない人）に対する考え方の概略。クラスの境界の具体的な値は規格の表で確認する", "middle", 10, FNT))
    return SVG(860, 258, o, "エネルギー源のクラスと、一般の人に対して必要な安全防護の数。クラスが上がるほど防護を重ねる。")
F["e15_classes"] = _f15_classes()


# ---- 3. 筐体の安全上の役割 ----
def _f15_enc():
    o = []
    x0, y0, w, h = 150, 30, 460, 200
    o.append(RECT(x0, y0, w, h, 8, SCR, INK, 3))
    # 一次側（ES3/PS3）
    o.append(RECT(x0 + 20, y0 + 110, 180, 60, 4, ASOFT, ALI, 1.4))
    o.append(T(x0 + 110, y0 + 136, "電源の一次側", "middle", 10.5, ALI, True))
    o.append(T(x0 + 110, y0 + 152, "ES3・PS3", "middle", 10, ALI))
    o.append(RECT(x0 + 240, y0 + 130, 200, 8, 1, GRN, GRN, 1))
    o.append(T(x0 + 340, y0 + 160, "二次側の回路（ES1）", "middle", 10, MUT))
    # 底のバッフル
    o.append(W(x0 + 30, y0 + h - 6, x0 + 60, y0 + h - 6, c=SCR, lw=6))
    o.append(W(x0 + 90, y0 + h - 6, x0 + 120, y0 + h - 6, c=SCR, lw=6))
    o.append(T(x0 + 76, y0 + h + 18, "底の開口は形と位置を制限", "middle", 9.5, ALI))
    # ファン
    o.append(CIRC(x0 + 380, y0 + 60, 26, MUT, 1.4))
    for a in range(0, 360, 60):
        r = math.radians(a)
        o.append(W(x0 + 380, y0 + 60, x0 + 380 + 22 * math.cos(r), y0 + 60 + 22 * math.sin(r), c=MUT, lw=1.6))
    o.append(T(x0 + 330, y0 + 64, "ファン（MS）", "end", 10, MUT))
    # 左右の注記
    notes_l = [("電気的な囲い", "ES3 に触れさせない", y0 + 40), ("防火用筐体", "中の火を外へ出さない", y0 + 120)]
    for t, s, yy in notes_l:
        o.append(BOX(4, yy - 22, 130, 44, t, s, ALI, PAN, sz=11, ssz=9))
        o.append(ARR(134, yy, x0 - 2, yy, ALI, 1.3, 6))
    notes_r = [("機械的な囲い", "可動部・鋭いエッジを覆う", y0 + 60), ("強度", "押す・ぶつける・落とす・熱で変形しない", y0 + 150)]
    for t, s, yy in notes_r:
        o.append(BOX(626, yy - 24, 230, 48, t, s, SIG, PAN, sz=11, ssz=9))
        o.append(ARR(626, yy, x0 + w + 2, yy, SIG, 1.3, 6))
    return SVG(860, 258, o, "筐体が担う安全防護。1 つの筐体が、感電・火災・機械的なけがに対する防護を兼ねることが多い。")
F["e15_enc"] = _f15_enc()


# ---- 4. UL94 ----
def _f15_ul94():
    o = []
    # 水平試験
    o.append(T(130, 22, "水平燃焼試験（HB）", "middle", 11.5, INK, True))
    o.append(RECT(40, 70, 190, 12, 1, PAN, INK, 1.3))
    o.append(W(40, 76, 20, 76, c=MUT, lw=3))
    o.append(T(30, 100, "片端を固定", "start", 9.5, MUT))
    o.append(PL([(230, 120), (226, 104), (232, 88), (228, 80)], ALI, 2))
    o.append(RECT(222, 120, 16, 30, 2, LIN, MUT, 1.2))
    o.append(T(244, 140, "バーナー", "start", 9.5, MUT))
    o.append(ARR(200, 60, 80, 60, ALI, 1.4, 6))
    o.append(T(140, 52, "燃え広がる速さを測る", "middle", 9.5, ALI))
    # 垂直試験
    o.append(T(430, 22, "垂直燃焼試験（V-0/V-1/V-2）", "middle", 11.5, INK, True))
    o.append(W(400, 34, 460, 34, c=MUT, lw=3))
    o.append(RECT(424, 36, 12, 110, 1, PAN, INK, 1.3))
    o.append(PL([(430, 150), (426, 162), (432, 172), (428, 178)], ALI, 2))
    o.append(RECT(422, 176, 16, 26, 2, LIN, MUT, 1.2))
    o.append(T(446, 196, "下から炎を当てて離す（2 回）", "start", 9.5, MUT))
    o.append(RECT(360, 220, 140, 10, 3, SCR, MUT, 1, "2,2"))
    o.append(T(430, 244, "下に綿: 燃える滴で着火するか", "middle", 9.5, MUT))
    o.append(T(446, 90, "炎が消えるまでの時間", "start", 9.5, ALI))
    o.append(T(446, 104, "燃える滴が落ちるか", "start", 9.5, ALI))
    # 等級のはしご
    lad = [("HB", "水平でゆっくり燃える", LIN), ("V-2", "垂直で消える。燃える滴あり", LIN), ("V-1", "垂直で消える。燃える滴なし", LIN),
           ("V-0", "V-1 より速く消える", SIG), ("5VB / 5VA", "大きな炎を 5 回。5VA は穴があかない", SIG)]
    for i, (a, b, c) in enumerate(lad):
        yy = 220 - i * 44
        o.append(BOX(620, yy - 18, 220, 38, a, b, c, SSOFT if c == SIG else PAN, sz=12, ssz=9))
    o.append(ARR(604, 222, 604, 40, SIG, 1.8))
    o.append(T(596, 130, "難燃性が高い", "end", 10, SIG, True))
    return SVG(860, 258, o, "UL94 の燃焼試験と等級の概略。等級は試験した厚さと色に対して付く。試験条件と判定基準の詳細は規格原文で確認する。")
F["e15_ul94"] = _f15_ul94()


# ---- 5. 空間距離と沿面距離の定義 ----
def _f15_creep():
    o = []
    def base(x0, title, c):
        o.append(T(x0 + 190, 22, title, "middle", 11.5, c, True))
    # 左: リブ
    x0 = 20; base(x0, "リブがあるとき", INK)
    o.append(RECT(x0, 120, 380, 50, 0, PAN, INK, 1.3))
    o.append(RECT(x0 + 180, 60, 20, 60, 0, PAN, INK, 1.3))
    o.append(W(x0 + 181, 120, x0 + 199, 120, c=PAN, lw=2))
    o.append(RECT(x0 + 30, 110, 90, 10, 1, ALI, ALI, 1))
    o.append(RECT(x0 + 260, 110, 90, 10, 1, ALI, ALI, 1))
    o.append(T(x0 + 75, 104, "導体 A", "middle", 10, ALI, True))
    o.append(T(x0 + 305, 104, "導体 B", "middle", 10, ALI, True))
    o.append(PL([(x0 + 120, 120), (x0 + 180, 120), (x0 + 180, 60), (x0 + 200, 60), (x0 + 200, 120), (x0 + 260, 120)], SIG, 3))
    o.append(PL([(x0 + 120, 110), (x0 + 180, 56), (x0 + 200, 56), (x0 + 260, 110)], GRN, 1.8, "5,4"))
    o.append(T(x0 + 120, 64, "空間距離（空気中の最短）", "end", 10, GRN, True))
    o.append(T(x0 + 190, 190, "沿面距離（表面に沿った最短）", "middle", 10, SIG, True))
    # 右: 溝
    x0 = 450; base(x0, "溝があるとき", INK)
    o.append(PL([(x0, 120), (x0 + 170, 120), (x0 + 170, 160), (x0 + 210, 160), (x0 + 210, 120), (x0 + 380, 120)], INK, 1.3))
    o.append(RECT(x0 + 30, 110, 90, 10, 1, ALI, ALI, 1))
    o.append(RECT(x0 + 260, 110, 90, 10, 1, ALI, ALI, 1))
    o.append(T(x0 + 75, 104, "導体 A", "middle", 10, ALI, True))
    o.append(T(x0 + 305, 104, "導体 B", "middle", 10, ALI, True))
    o.append(PL([(x0 + 120, 116), (x0 + 260, 116)], GRN, 1.8, "5,4"))
    o.append(T(x0 + 190, 100, "空間距離は溝で増えない", "middle", 10, GRN, True))
    o.append(PL([(x0 + 120, 124), (x0 + 166, 124), (x0 + 166, 164), (x0 + 214, 164), (x0 + 214, 124), (x0 + 260, 124)], SIG, 3))
    o.append(T(x0 + 190, 190, "幅が X 以上: 溝の輪郭に沿って測る", "middle", 10, SIG, True))
    o.append(T(x0 + 190, 208, "幅が X 未満: 溝は橋渡しされ、まっすぐ測る", "middle", 10, ALI, True))
    o.append(T(x0 + 190, 226, "X は汚損度などで規格が決める", "middle", 9.5, FNT))
    return SVG(860, 240, o, "空間距離（空気中を通る最短距離）と沿面距離（絶縁物の表面に沿った最短距離）。リブは両方を延ばし、溝は幅が十分なときだけ沿面距離を延ばす。")
F["e15_creep"] = _f15_creep()


# ---- 6. 試験指 ----
def _f15_finger():
    o = []
    def finger(x, y, ang=0):
        # 先端 (x,y) へ左から入る関節つきの指
        return (PL([(x - 150, y - 30), (x - 80, y - 14), (x - 40, y - 4), (x - 6, y)], MUT, 14) +
                D(x - 80, y - 14, INK, 3) + D(x - 40, y - 4, INK, 3))
    for k, (title, c) in enumerate([("悪い: 開口から危険な部分に届く", ALI), ("良い: 奥行き・仕切りで届かない", SIG)]):
        x0 = 20 + k * 430
        o.append(T(x0 + 200, 22, title, "middle", 11.5, c, True))
        o.append(RECT(x0 + 200, 40, 10, 50, 0, LIN, INK, 1.3))
        o.append(RECT(x0 + 200, 130, 10, 60, 0, LIN, INK, 1.3))
        o.append(T(x0 + 205, 206, "筐体の壁と開口", "middle", 9.5, MUT))
        if k == 0:
            o.append(RECT(x0 + 260, 100, 60, 26, 3, ASOFT, ALI, 1.5))
            o.append(T(x0 + 290, 117, "ES3", "middle", 11, ALI, True))
            o.append(finger(x0 + 258, 112))
            o.append(T(x0 + 290, 150, "試験指が触れる", "middle", 10, ALI))
        else:
            o.append(RECT(x0 + 236, 70, 8, 100, 0, PAN, SIG, 1.5))
            o.append(T(x0 + 252, 64, "仕切り", "start", 9.5, SIG))
            o.append(RECT(x0 + 320, 100, 60, 26, 3, ASOFT, ALI, 1.5))
            o.append(T(x0 + 350, 117, "ES3", "middle", 11, ALI, True))
            o.append(finger(x0 + 234, 112))
            o.append(T(x0 + 330, 150, "届かない", "middle", 10, SIG))
    return SVG(860, 216, o, "試験指（指を模した関節つきの検査具）で開口を探る。指が入っても危険な部分に触れなければよい。寸法と押す力は規格で決まっている。")
F["e15_finger"] = _f15_finger()


# ---- 7. 規格適合の進め方 ----
def _f15_flow():
    items = [("規格を特定", "製品分野・販売国"), ("試験所と相談", "構想設計の段階で"),
             ("設計", "防護の割り当て・距離・材料"), ("部品の選定", "認証済みの部品・材料"),
             ("試作で予備評価", "温度・距離・強度"), ("認証試験", "量産と同じ仕様で")]
    s, _ = flowright(10, 60, items, w=122, bh=64, gap=20, c=SIG, fill=PAN)
    o = [s]
    o.append(T(430, 128, "量産後も、材料・部品・構造を変えるときは、規格適合への影響を確認する（変更管理）", "middle", 10.5, ALI))
    return SVG(860, 144, o, "規格適合の進め方。試験所との相談は、金型を作る前の早い段階で行う。")
F["e15_flow"] = _f15_flow()
