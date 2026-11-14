# -*- coding: utf-8 -*-
# ===================== 11. 落下と衝撃 =====================

def _e11_case(x, y, w, h):
    return ('<rect x="%g" y="%g" width="%g" height="%g" fill="var(--muted)" fill-opacity="0.22"'
            ' stroke="var(--muted)" stroke-width="1.2"/>' % (x, y, w, h))

def _e11_dev(x, y, w=70, h=44, c=INK, fill=PAN, rot=0, r=6):
    """製品（箱）を中心 (x,y) で回転して描く"""
    return ('<g transform="translate(%g,%g) rotate(%g)"><rect x="%g" y="%g" width="%g" height="%g" rx="%g"'
            ' fill="%s" stroke="%s" stroke-width="1.6"/></g>' % (x, y, rot, -w / 2, -h / 2, w, h, r, fill, c))

def _e11_ground(x0, x1, y):
    o = [W(x0, y, x1, y, c=INK, lw=1.8)]
    for xx in range(int(x0) + 6, int(x1), 14):
        o.append(W(xx, y, xx - 8, y + 9, c=MUT, lw=1))
    return "".join(o)


def _e11_phases():
    o = []
    gy = 232
    o.append(_e11_ground(20, 840, gy))
    cols = [110, 310, 510, 710]
    # 1 落下開始
    o.append(_e11_dev(cols[0], 84))
    o.append(DIM(cols[0] + 56, 106, cols[0] + 56, gy, None, MUT))
    o.append(T(cols[0] + 64, 160, "h", "start", 13, INK, True))
    o.append(T(cols[0], 22, "① 落ち始め", "middle", 12, INK, True))
    o.append(T(cols[0], 38, "速さ 0", "middle", 10.5, MUT))
    # 2 接触直前
    o.append(_e11_dev(cols[1], gy - 24))
    o.append(ARR(cols[1], 110, cols[1], 176, ALI, 2.2, 9))
    o.append(T(cols[1], 22, "② 床に触れる瞬間", "middle", 12, INK, True))
    o.append(T(cols[1], 38, "速さ v = √(2gh)", "middle", 10.5, ALI, True))
    o.append(T(cols[1] + 10, 100, "位置エネルギー → 運動エネルギー", "middle", 10, MUT))
    # 3 止まる
    o.append('<g transform="translate(%g,%g)"><rect x="-35" y="-18" width="70" height="36" rx="6" fill="var(--alias-soft)"'
             ' stroke="var(--alias)" stroke-width="1.6"/></g>' % (cols[2], gy - 18))
    o.append(RECT(cols[2] - 35, gy - 44, 70, 44, 6, "none", MUT, 1.1, "4,3"))
    o.append(DIM(cols[2] + 50, gy - 44, cols[2] + 50, gy - 36, None, ALI))
    o.append(T(cols[2] + 58, gy - 34, "s（停止距離）", "start", 10.5, ALI, True))
    o.append(T(cols[2], 22, "③ つぶれながら止まる", "middle", 12, INK, True))
    o.append(T(cols[2], 38, "s の間に v → 0", "middle", 10.5, ALI, True))
    o.append(ARR(cols[2], 120, cols[2], 168, SIG, 2.0, 8))
    o.append(T(cols[2] + 10, 110, "床から上向きの大きな力", "middle", 10, SIG))
    # 4 跳ね返り
    o.append(_e11_dev(cols[3], 150, rot=-12))
    o.append(ARR(cols[3] - 10, 120, cols[3] - 22, 80, MUT, 1.6))
    o.append(T(cols[3], 22, "④ 跳ね返る・転がる", "middle", 12, INK, True))
    o.append(T(cols[3], 38, "2 回目の衝突もある", "middle", 10.5, MUT))
    for i in range(3):
        o.append(ARR(cols[i] + 70, 130, cols[i + 1] - 70, 130, LIN, 1.4))
    return SVG(860, 252, o, "落下の流れ。衝突の速さは高さ h だけで決まり、どれだけ大きな力になるかは止まるまでの距離 s で決まる。")
F["e11_phases"] = _e11_phases()


def _e11_pulse():
    o = []
    x0, y0, w, h = 70, 240, 440, 200
    o.append(AXES(x0, y0, w + 20, h + 10, "時間 t", "加速度 a"))
    tau = 360
    # 一定（平均）
    am = 100
    o.append(PL([(x0, y0), (x0, y0 - am), (x0 + tau, y0 - am), (x0 + tau, y0)], SIG, 2.2))
    # 半正弦
    pts = []
    for i in range(121):
        u = i / 120
        pts.append((x0 + u * tau, y0 - am * math.pi / 2 * math.sin(math.pi * u)))
    o.append(PL(pts, ALI, 2.4))
    o.append(W(x0, y0 - am * math.pi / 2, x0 + tau / 2, y0 - am * math.pi / 2, c=ALI, lw=1, dash="3,3"))
    o.append(T(x0 - 6, y0 - am * math.pi / 2 + 4, "π/2·ā", "end", 10.5, ALI, True))
    o.append(T(x0 - 6, y0 - am + 4, "ā", "end", 11, SIG, True))
    o.append(DIM(x0, y0 + 26, x0 + tau, y0 + 26, None, MUT))
    o.append(T(x0 + tau / 2, y0 + 44, "τ（衝撃の時間）", "middle", 10.5, MUT))
    o.append(T(x0 + tau + 8, y0 - am - 6, "一定の加速度（平均）", "start", 10.5, SIG, True))
    o.append(T(x0 + tau / 2 + 30, y0 - am * math.pi / 2 - 8, "半正弦波", "start", 10.5, ALI, True))
    # 右の説明
    o.append(BOX(610, 40, 236, 70, "面積は同じ", "a の面積＝速度の変化 v", MUT, PAN))
    o.append(BOX(610, 124, 236, 70, "ピークは平均の π/2 倍", "半正弦波なら約 1.57 倍", ALI, ASOFT))
    o.append(BOX(610, 208, 236, 60, "壊れるかはピークで決まる", None, ALI, ASOFT))
    return SVG(860, 296, o, "衝撃の加速度の波形。同じ速度変化でも、山形の波形ではピークが平均より大きくなる。")
F["e11_pulse"] = _e11_pulse()


def _e11_cushion():
    o = []
    # 左: グラフ G vs s（h=1 m）
    x0, y0, w, h = 70, 250, 380, 210
    o.append(AXES(x0, y0, w + 20, h + 10, "s [mm]", "G"))
    smax, gmax = 10.0, 1200.0
    X = lambda s: x0 + s / smax * w
    Y = lambda g: y0 - g / gmax * h
    pts = []
    s = 0.83
    while s <= smax + 1e-9:
        pts.append((X(s), Y(1000.0 / s))); s += 0.05
    o.append(PL(pts, ALI, 2.4))
    for sv in (2, 4, 6, 8):
        o.append(W(X(sv), y0, X(sv), y0 + 4, c=MUT, lw=1)); o.append(T(X(sv), y0 + 16, str(sv), "middle", 10, MUT))
    for gv in (200, 400, 600, 800, 1000):
        o.append(W(x0 - 4, Y(gv), x0, Y(gv), c=MUT, lw=1)); o.append(T(x0 - 8, Y(gv) + 4, str(gv), "end", 10, MUT))
    for sv, lab in ((1, "1 mm → 1000 G"), (2, "2 mm → 500 G"), (5, "5 mm → 200 G")):
        o.append(D(X(sv), Y(1000.0 / sv), ALI, 4))
        o.append(T(X(sv) + 10, Y(1000.0 / sv) + 4, lab, "start", 10.5, INK, True))
    o.append(T(x0 + w / 2 + 40, 34, "高さ 1 m、平均の G = h / s", "middle", 11, MUT, True))
    # 右: 硬い床と緩衝材の対比
    gy = 160
    o.append(_e11_ground(500, 650, gy))
    o.append(RECT(540, gy - 34, 70, 34, 5, ASOFT, ALI, 1.6))
    o.append(T(575, gy - 13, "硬い角", "middle", 10.5, INK, True))
    o.append(T(575, 40, "× 硬い", "middle", 12, ALI, True))
    o.append(T(575, 60, "s が小さい → G が大きい", "middle", 10, ALI))
    o.append(_e11_ground(690, 840, gy))
    o.append(RECT(730, gy - 50, 70, 34, 5, SSOFT, SIG, 1.6))
    o.append('<rect x="726" y="%g" width="78" height="16" rx="6" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)" stroke-width="1.2"/>' % (gy - 16))
    o.append(T(765, gy + 26, "エラストマー・緩衝材", "middle", 10, SIG, True))
    o.append(T(765, 40, "○ つぶれる層", "middle", 12, SIG, True))
    o.append(T(765, 60, "s が大きい → G が小さい", "middle", 10, SIG))
    o.append(T(670, 222, "同じ速さ v を、長い距離で止める", "middle", 11, INK, True))
    return SVG(860, 286, o, "停止距離 s と平均の加速度（G 単位）。高さ 1 m では平均の G は 1000/s[mm] になる。停止距離を伸ばすのが緩衝の役割である。")
F["e11_cushion"] = _e11_cushion()


def _e11_orient():
    o = []
    gy = 196
    titles = [("面落下", "広い面で当たる", "硬い当たり → 中身の G が大きい"),
              ("稜落下", "辺で当たる", "辺に沿って力が集中"),
              ("角落下", "角 1 点で当たる", "角に力が集中 → 割れやすい")]
    for i, (t, s, n) in enumerate(titles):
        cx = 145 + i * 285
        o.append(RECT(cx - 135, 8, 270, 270, 10, "none", LIN, 1.2))
        o.append(T(cx, 32, t, "middle", 13, INK, True))
        o.append(T(cx, 50, s, "middle", 10.5, MUT))
        o.append(_e11_ground(cx - 110, cx + 110, gy))
        if i == 0:
            o.append(RECT(cx - 60, gy - 50, 120, 50, 6, PAN, INK, 1.6))
            o.append(RECT(cx - 60, gy - 4, 120, 4, 0, ALI, ALI, 0))
            o.append(ARR(cx, 76, cx, 132, ALI, 2, 8))
        elif i == 1:
            # 等角風の箱を辺で立てる
            o.append('<g transform="translate(%g,%g) rotate(45)"><rect x="-38" y="-38" width="76" height="76" rx="4" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.6"/></g>' % (cx, gy - 54))
            o.append(W(cx - 20, gy, cx + 20, gy, c=ALI, lw=4))
            o.append(ARR(cx + 70, 90, cx + 30, 130, ALI, 2, 8))
        else:
            pts = [(cx, gy), (cx - 50, gy - 40), (cx - 20, gy - 100), (cx + 34, gy - 80), (cx + 50, gy - 30)]
            o.append(TRI(pts, INK, 1.6, PAN))
            o.append(W(cx, gy, cx - 20, gy - 100, c=MUT, lw=1, dash="3,3"))
            o.append(W(cx, gy, cx + 34, gy - 80, c=MUT, lw=1, dash="3,3"))
            o.append(D(cx, gy, ALI, 5))
            o.append(ARR(cx + 76, 80, cx + 40, 120, ALI, 2, 8))
        o.append(T(cx, 230, n, "middle", 10.5, ALI, True))
    return SVG(860, 286, o, "落ち方の 3 つの型。面落下は中身への衝撃、角落下は筐体の局所的な割れが問題になりやすい。")
F["e11_orient"] = _e11_orient()


def _e11_fail():
    o = []
    # 断面の製品
    X0, Y0, Wd, Hd = 40, 60, 470, 190
    o.append('<rect x="%g" y="%g" width="%g" height="%g" rx="18" fill="none" stroke="var(--muted)" stroke-width="10" stroke-opacity="0.35"/>' % (X0, Y0, Wd, Hd))
    o.append('<rect x="%g" y="%g" width="%g" height="%g" rx="18" fill="none" stroke="var(--muted)" stroke-width="1.2"/>' % (X0 - 5, Y0 - 5, Wd + 10, Hd + 10))
    # 基板（たわんでいる）
    o.append('<path d="M 90 170 Q 280 205 470 170" fill="none" stroke="var(--blue)" stroke-width="7" stroke-opacity="0.35"/>')
    o.append('<path d="M 90 170 Q 280 205 470 170" fill="none" stroke="var(--blue)" stroke-width="1.3"/>')
    for bx in (90, 470):
        o.append(_e11_case(bx - 10, 174, 20, 71))
    # 1 角の割れ
    o.append(PL([(46, 236), (60, 226), (54, 216), (68, 206)], ALI, 2.2))
    # 2 ボス折れ
    o.append(PL([(460, 214), (470, 220), (480, 212)], ALI, 2.2))
    # 3 基板たわみ・部品割れ
    o.append(RECT(268, 178, 24, 10, 2, PAN, INK, 1.2))
    # 4 重い部品（トランス）
    o.append(RECT(150, 118, 60, 52, 4, PAN, INK, 1.4))
    o.append(T(180, 148, "重い部品", "middle", 9.5, INK, True))
    o.append(ARR(180, 112, 180, 92, ALI, 1.8))
    # 5 電池
    o.append(RECT(340, 80, 110, 50, 6, ASOFT, ALI, 1.4))
    o.append(T(395, 110, "電池", "middle", 10.5, INK, True))
    o.append(ARR(452, 105, 482, 105, ALI, 1.8))
    # 6 はんだクラック
    o.append(RECT(220, 160, 30, 10, 1, PAN, INK, 1.2))
    for (num, x, y) in [("①", 32, 222), ("②", 488, 206), ("③", 280, 222), ("④", 196, 100), ("⑤", 470, 92), ("⑥", 236, 150)]:
        o.append(CIRC(x, y, 9, ALI, 1.3, fill="var(--panel)"))
        o.append(T(x, y + 4, num, "middle", 10.5, ALI, True))
    o.append(T(275, 36, "落下の瞬間の断面（変形は誇張）", "middle", 11, MUT, True))
    # 右: 一覧
    items = [("① 筐体の割れ", "角・薄い部分・ウェルドライン"), ("② ボスの根元の折れ", "基板・電池の慣性力が集中"),
             ("③ 基板のたわみ", "セラミックコンデンサの割れ"), ("④ 重い部品の脱落", "トランス・コイル・コネクタ"),
             ("⑤ 電池の移動", "接点が離れる・ケースを押す"), ("⑥ はんだのクラック", "繰り返しで広がる")]
    for k, (t, s) in enumerate(items):
        o.append(BOX(560, 14 + k * 46, 290, 40, t, s, ALI, PAN, INK, 6, 1.2, 11, 9.5))
    return SVG(860, 296, o, "落下で起きる壊れ方。中身は慣性で動き続けようとし、その力が固定点・はんだ付け部・筐体の角に集まる。")
F["e11_fail"] = _e11_fail()


def _e11_fix():
    o = []
    panels = ["角に R を付ける", "ボスをリブで支える", "浮かせて支える", "外側に緩衝材"]
    for i, t in enumerate(panels):
        x0 = 12 + i * 212
        o.append(RECT(x0, 8, 200, 250, 10, "none", LIN, 1.2))
        o.append(T(x0 + 100, 30, t, "middle", 12.5, SIG, True))
        cx = x0 + 100
        if i == 0:
            o.append('<path d="M %g 200 L %g 70 L %g 70" fill="none" stroke="var(--alias)" stroke-width="8" stroke-opacity="0.35"/>' % (x0 + 30, x0 + 30, x0 + 90))
            o.append(T(x0 + 50, 216, "× 角がとがる", "middle", 10.5, ALI, True))
            o.append('<path d="M %g 200 L %g 110 Q %g 70 %g 70 L %g 70" fill="none" stroke="var(--signal)" stroke-width="8" stroke-opacity="0.45"/>' % (x0 + 120, x0 + 120, x0 + 120, x0 + 160, x0 + 180))
            o.append(T(x0 + 150, 216, "○ R で応力を分散", "middle", 10.5, SIG, True))
            o.append(T(x0 + 100, 240, "肉厚を均一に保つ", "middle", 10, MUT))
        elif i == 1:
            o.append(_e11_case(x0 + 20, 190, 160, 12))
            o.append(_e11_case(cx - 12, 90, 24, 100))
            o.append(TRI([(cx - 12, 120), (cx - 12, 190), (cx - 52, 190)], SIG, 1.4, "var(--signal-soft)"))
            o.append(TRI([(cx + 12, 120), (cx + 12, 190), (cx + 52, 190)], SIG, 1.4, "var(--signal-soft)"))
            o.append(T(cx, 216, "ガセット（05 章）", "middle", 10.5, SIG, True))
            o.append(T(cx, 240, "根元に R、高すぎないボス", "middle", 10, MUT))
        elif i == 2:
            o.append(_e11_case(x0 + 20, 190, 160, 12))
            o.append(_e11_case(x0 + 20, 60, 160, 12))
            o.append(RECT(x0 + 50, 112, 100, 40, 5, ASOFT, ALI, 1.4))
            o.append(T(cx, 137, "電池・基板", "middle", 10, INK, True))
            for (yy, hh) in ((152, 38), (72, 40)):
                o.append('<rect x="%g" y="%g" width="24" height="%g" rx="4" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)" stroke-width="1.2"/>' % (x0 + 60, yy, hh))
                o.append('<rect x="%g" y="%g" width="24" height="%g" rx="4" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)" stroke-width="1.2"/>' % (x0 + 116, yy, hh))
            o.append(T(cx, 216, "エラストマーで挟む", "middle", 10.5, SIG, True))
            o.append(T(cx, 240, "停止距離 s を中身に与える", "middle", 10, MUT))
        else:
            o.append(RECT(x0 + 46, 90, 108, 80, 10, PAN, INK, 1.6))
            for (xx, yy) in ((x0 + 46, 90), (x0 + 154, 90), (x0 + 46, 170), (x0 + 154, 170)):
                o.append('<circle cx="%g" cy="%g" r="14" fill="var(--signal)" fill-opacity="0.35" stroke="var(--signal)" stroke-width="1.2"/>' % (xx, yy))
            o.append(T(cx, 135, "製品", "middle", 10.5, INK, True))
            o.append(T(cx, 216, "角にバンパー", "middle", 10.5, SIG, True))
            o.append(T(cx, 240, "最初に当たる所をつぶれる材料に", "middle", 10, MUT))
    return SVG(860, 266, o, "落下への対策。応力を分散させる形、根元の補強、中身と外側に停止距離を与える柔らかい層。")
F["e11_fix"] = _e11_fix()
