# -*- coding: utf-8 -*-
# ===================== 10. 内部の収め方 =====================

def _e10_case(x, y, w, h):
    """筐体の材料（断面）。灰色の半透明で塗る。"""
    return ('<rect x="%g" y="%g" width="%g" height="%g" fill="var(--muted)" fill-opacity="0.22"'
            ' stroke="var(--muted)" stroke-width="1.2"/>' % (x, y, w, h))

def _e10_pcb(x, y, w, h=8):
    """基板（断面）。青の半透明。"""
    return ('<rect x="%g" y="%g" width="%g" height="%g" fill="var(--blue)" fill-opacity="0.28"'
            ' stroke="var(--blue)" stroke-width="1.3"/>' % (x, y, w, h))

def _e10_pcbtop(x, y, w, h, label=None):
    o = ['<rect x="%g" y="%g" width="%g" height="%g" rx="4" fill="var(--blue)" fill-opacity="0.16"'
         ' stroke="var(--blue)" stroke-width="1.4"/>' % (x, y, w, h)]
    if label:
        o.append(T(x + 28, y + 20, label, "start", 11.5, GRN, True))
    return "".join(o)


def _e10_layout():
    o = []
    # 上から見た筐体
    o.append(RECT(24, 34, 486, 272, 24, PAN, INK, 1.8))
    o.append(T(30, 22, "上から見た配置（上ケースを外した状態）", "start", 11, MUT, True))
    # 電池
    o.append(RECT(46, 176, 168, 108, 6, ASOFT, ALI, 1.4))
    o.append(T(130, 222, "① 電池", "middle", 12.5, INK, True))
    o.append(T(130, 242, "大きく重い・形が決まっている", "middle", 9.5, MUT))
    # 基板
    o.append(_e10_pcbtop(234, 56, 256, 228, "② 基板"))
    # 固定点（ねじ）
    for (x, y) in [(252, 76), (472, 76), (252, 266), (472, 266)]:
        o.append(CIRC(x, y, 6, GRN, 1.4))
    # コネクタ（右の壁）
    o.append(RECT(454, 150, 62, 40, 3, PAN, INK, 1.5))
    o.append(T(485, 175, "③ USB", "middle", 10.5, INK, True))
    o.append(RECT(507, 144, 10, 52, 0, "var(--paper)", "none", 0))
    o.append(T(530, 172, "開口", "start", 10, MUT))
    # 表示器（上ケース側）
    o.append(RECT(274, 104, 150, 70, 4, "none", INK, 1.3, "5,4"))
    o.append(T(349, 136, "④ 表示器", "middle", 11.5, INK, True))
    o.append(T(349, 154, "（上ケース側）", "middle", 9.5, MUT))
    # ボタン
    for x in (300, 350, 400):
        o.append(CIRC(x, 222, 11, INK, 1.4))
    o.append(T(350, 252, "④ ボタン", "middle", 10.5, INK, True))
    # 配線
    o.append(PL([(214, 196), (226, 196), (226, 160), (262, 160)], SIG, 2.4))
    o.append(T(140, 170, "⑤ 配線（短く・挟まない）", "middle", 10, SIG, True))
    o.append(D(262, 160, SIG, 3.4))
    # 右: 決める順
    items = [("1. 動かせない部品を置く", "電池・表示器・コネクタ・ボタン"),
             ("2. 基板の外形と固定点", "コネクタに近い点を基準に"),
             ("3. 配線の経路", "合わせ面・ボスを避ける"),
             ("4. 組立順で確かめる", "一方向に積み上げられるか")]
    s, _ = flowdown(712, 30, items, w=280, bh=54, gap=18, c=SIG, fill=PAN)
    o.append(s)
    return SVG(860, 316, o, "内部の配置は、形と位置が先に決まる大きな部品から置き、基板の外形・固定点、配線経路、組立順の順に決める。")
F["e10_layout"] = _e10_layout()


def _e10_mount():
    o = []
    names = [("ねじ＋ボス", "強い・位置が正確", "ねじと工数が要る"),
             ("ガイド溝", "差し込むだけ・部品なし", "溝の隙間でがたつく"),
             ("リブで挟む", "部品なし・上下で固定", "ケースの公差が効く"),
             ("スナップ", "工具なしで付く", "外すと爪が傷む")]
    for i, (nm, good, bad) in enumerate(names):
        x0 = 12 + i * 212
        o.append(RECT(x0, 10, 200, 244, 10, "none", LIN, 1.2))
        o.append(T(x0 + 100, 32, "(%s) %s" % ("abcd"[i], nm), "middle", 12.5, INK, True))
        fy = 168                                   # 床の上面
        if i == 0:
            o.append(_e10_case(x0 + 16, fy, 168, 12))
            for bx in (x0 + 46, x0 + 154):
                o.append(_e10_case(bx - 11, fy - 44, 22, 44))
                o.append(W(bx - 4, fy - 52, bx - 4, fy - 20, c=INK, lw=1.2))
                o.append(W(bx + 4, fy - 52, bx + 4, fy - 20, c=INK, lw=1.2))
            o.append(_e10_pcb(x0 + 24, fy - 52, 152))
            for bx in (x0 + 46, x0 + 154):
                o.append(RECT(bx - 10, fy - 61, 20, 9, 2, INK, INK, 1))
            o.append(T(x0 + 100, fy - 74, "ねじ", "middle", 10, MUT))
            o.append(T(x0 + 100, fy - 18, "ボス", "middle", 10, MUT))
        elif i == 1:
            o.append(_e10_case(x0 + 16, fy, 168, 12))
            for wx in (x0 + 16, x0 + 166):
                o.append(_e10_case(wx, fy - 96, 18, 42))
                o.append(_e10_case(wx, fy - 44, 18, 44))
            o.append(_e10_pcb(x0 + 26, fy - 54, 148, 10))
            o.append(T(x0 + 100, fy - 66, "溝に差し込む", "middle", 10, MUT))
            o.append(T(x0 + 100, fy - 24, "（紙面の奥へ）", "middle", 10, MUT))
        elif i == 2:
            o.append(_e10_case(x0 + 16, fy, 168, 12))
            o.append(_e10_case(x0 + 16, 58, 168, 12))
            for rx in (x0 + 40, x0 + 150):
                o.append(_e10_case(rx, fy - 44, 10, 44))
                o.append(_e10_case(rx, 70, 10, 46))
            o.append(_e10_pcb(x0 + 26, fy - 52, 148))
            o.append(ARR(x0 + 100, 80, x0 + 100, 108, ALI, 1.4))
            o.append(T(x0 + 100, fy - 18, "下リブ", "middle", 10, MUT))
            o.append(T(x0 + 120, 96, "上リブ", "start", 10, MUT))
        else:
            o.append(_e10_case(x0 + 16, fy, 168, 12))
            for bx in (x0 + 52, x0 + 148):
                o.append(_e10_case(bx - 9, fy - 40, 18, 40))
            o.append(_e10_pcb(x0 + 36, fy - 48, 128))
            for sx, sgn in ((x0 + 26, 1), (x0 + 168, -1)):
                o.append(_e10_case(sx - 3, fy - 70, 8, 70))
                o.append(PL([(sx + (5 if sgn > 0 else -3), fy - 70), (sx + (5 if sgn > 0 else -3) + 12 * sgn, fy - 58),
                             (sx + (5 if sgn > 0 else -3), fy - 56)], INK, 1.3, fill="var(--muted)"))
            o.append(T(x0 + 100, fy - 18, "支柱", "middle", 10, MUT))
            o.append(T(x0 + 100, fy - 80, "爪で押さえる", "middle", 10, MUT))
        o.append(T(x0 + 100, 214, "○ " + good, "middle", 10.5, SIG, True))
        o.append(T(x0 + 100, 236, "× " + bad, "middle", 10.5, ALI, True))
    o.append(T(430, 276, "灰色＝ケース、青＝基板", "middle", 10.5, MUT))
    return SVG(860, 288, o, "基板の固定方法 4 種（断面）。量産品では (a) と (c) の組み合わせが多い。")
F["e10_mount"] = _e10_mount()


def _e10_clear():
    o = []
    x0, x1 = 40, 520
    o.append(_e10_case(x0, 262, x1 - x0, 14))       # 下ケース床
    o.append(_e10_case(x0, 24, x1 - x0, 14))        # 上ケース天井
    o.append(T(x0 + 8, 54, "上ケースの内面", "start", 10, MUT))
    o.append(T(x0 + 8, 292, "下ケースの内面", "start", 10, MUT))
    # ボス
    for bx in (80, 480):
        o.append(_e10_case(bx - 12, 186, 24, 76))
    # 基板（理想）と反り（破線）
    o.append(_e10_pcb(60, 178, 440))
    o.append('<path d="M 60 182 Q 280 160 500 182" fill="none" stroke="var(--alias)" stroke-width="1.6" stroke-dasharray="5,4"/>')
    o.append(T(430, 168, "反った基板", "middle", 10, ALI))
    # 部品（上面）
    o.append(RECT(140, 98, 50, 80, 4, PAN, INK, 1.4))
    o.append(T(165, 142, "電解", "middle", 10, INK, True))
    o.append(RECT(230, 150, 80, 28, 3, PAN, INK, 1.4))
    o.append(RECT(350, 160, 40, 18, 3, PAN, INK, 1.4))
    # はんだ面の突起
    for lx in (150, 160, 170, 180, 240, 260, 280, 300):
        o.append(W(lx, 186, lx, 200, c=INK, lw=1.4))
    o.append(T(225, 216, "リードとはんだの突起", "middle", 10, MUT))
    # 寸法
    o.append(DIM(165, 38, 165, 98, None, ALI))
    o.append(T(176, 72, "c₁ 部品上の隙間", "start", 10.5, ALI, True))
    o.append(DIM(320, 200, 320, 262, None, ALI))
    o.append(T(330, 236, "c₂ はんだ面の隙間", "start", 10.5, ALI, True))
    o.append(DIM(104, 186, 104, 262, None, MUT))
    o.append(T(110, 244, "ボス高さ", "start", 10, MUT))
    # 右の説明
    o.append(BOX(560, 30, 290, 120, "c₁ を食うもの", "最も高い部品の高さ、基板の反り（上へ）、上ケースの内面のリブ・ボス、公差の積み上げ", ALI, ASOFT))
    o.append(BOX(560, 166, 290, 120, "c₂ を食うもの", "リード・はんだの突き出し、基板の反り（下へ）、床のリブ、裏面に付けたラベルや部品", ALI, ASOFT))
    return SVG(860, 306, o, "基板と筐体のクリアランス（断面）。部品の公称高さだけでなく、反り・はんだの突起・公差を足して隙間を確保する。")
F["e10_clear"] = _e10_clear()


def _e10_cte():
    o = []
    # 上段: 悪い例（両端を丸穴で固定）
    o.append(T(20, 24, "× 2 か所を丸穴で固定", "start", 12.5, ALI, True))
    o.append(_e10_case(40, 108, 380, 12))
    o.append('<path d="M 70 92 Q 230 56 390 92" fill="none" stroke="var(--blue)" stroke-width="7" stroke-opacity="0.35"/>')
    o.append('<path d="M 70 92 Q 230 56 390 92" fill="none" stroke="var(--blue)" stroke-width="1.4"/>')
    for bx in (70, 390):
        o.append(_e10_case(bx - 10, 92, 20, 16))
        o.append(D(bx, 92, INK, 4))
    o.append(ARR(70, 132, 30, 132, ALI, 1.6))
    o.append(ARR(390, 132, 430, 132, ALI, 1.6))
    o.append(T(230, 140, "ケースのほうが大きく伸びる", "middle", 10.5, ALI))
    o.append(T(230, 46, "基板が反る・ボスが割れる", "middle", 10.5, ALI, True))
    # 下段: 良い例（1 か所固定＋長穴）
    o.append(T(20, 182, "○ 1 か所を丸穴で固定し、他は長穴", "start", 12.5, SIG, True))
    o.append(_e10_case(40, 262, 380, 12))
    o.append(_e10_pcb(60, 238, 340))
    for bx in (80, 380):
        o.append(_e10_case(bx - 10, 246, 20, 16))
    o.append(CIRC(80, 242, 5, SIG, 1.6))
    o.append(D(80, 242, SIG, 2.2))
    o.append(RECT(364, 237, 32, 10, 5, "none", SIG, 1.6))
    o.append(D(380, 242, SIG, 2.2))
    o.append(T(80, 226, "固定点（丸穴）", "middle", 10, SIG, True))
    o.append(T(380, 226, "長穴", "middle", 10, SIG, True))
    o.append(DARR(364, 290, 396, 290, SIG, 1.2, 5))
    o.append(T(380, 306, "伸び差の分だけ動ける", "middle", 10, SIG))
    # 右: 上から見た長穴の向き
    o.append(T(640, 24, "上から見た配置", "middle", 11, MUT, True))
    o.append(_e10_pcbtop(500, 40, 280, 200))
    o.append(CIRC(540, 200, 7, SIG, 1.8))
    o.append(T(552, 222, "固定点", "start", 10, SIG, True))
    for (x, y) in [(740, 200), (740, 80), (540, 80)]:
        a = math.atan2(y - 200, x - 540)
        dx, dy = 12 * math.cos(a), 12 * math.sin(a)
        o.append('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="var(--signal)" stroke-width="12"'
                 ' stroke-linecap="round" stroke-opacity="0.25"/>' % (x - dx, y - dy, x + dx, y + dy))
        o.append('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="var(--signal)" stroke-width="1.4"'
                 ' stroke-dasharray="3,3"/>' % (540, 200, x, y))
        o.append(D(x, y, SIG, 2.6))
    o.append(T(640, 268, "長穴は固定点へ向ける", "middle", 10.5, SIG, True))
    o.append(T(640, 288, "（伸びは固定点から放射状に起きる）", "middle", 10, MUT))
    return SVG(860, 316, o, "熱膨張差の逃がし方。固定点を 1 つに決め、他の穴は固定点の方向に伸ばした長穴にする。")
F["e10_cte"] = _e10_cte()


def _e10_conn():
    o = []
    # 側壁（開口あり）
    o.append(_e10_case(400, 30, 18, 110))
    o.append(_e10_case(400, 200, 18, 70))
    # 基板とコネクタ
    o.append(_e10_case(60, 258, 340, 12))
    o.append(_e10_case(140, 196, 20, 62))
    o.append(_e10_pcb(80, 188, 300))
    o.append(RECT(316, 152, 80, 36, 3, PAN, INK, 1.6))
    o.append(T(352, 175, "コネクタ", "middle", 10, INK, True))
    # 相手のプラグ（外側）
    o.append(RECT(404, 154, 150, 32, 6, SSOFT, SIG, 1.6))
    o.append(T(490, 175, "相手のプラグ", "middle", 10, SIG, True))
    # 隙間 g を赤で示す
    for (y0, y1) in ((140, 154), (186, 200)):
        o.append(RECT(400, y0, 18, y1 - y0, 0, ASOFT, ALI, 1.0))
    o.append(W(412, 140, 440, 112, c=ALI, lw=1))
    o.append(T(444, 112, "g（片側の隙間）", "start", 10.5, ALI, True))
    o.append(W(412, 200, 440, 228, c=ALI, lw=1))
    o.append(T(444, 234, "g", "start", 10.5, ALI, True))
    # 開口の高さ
    o.append(W(418, 140, 612, 140, c=LIN, lw=1)); o.append(W(418, 200, 612, 200, c=LIN, lw=1))
    o.append(DIM(604, 140, 604, 200, None, MUT))
    o.append(T(612, 166, "開口の", "start", 10, MUT)); o.append(T(612, 180, "高さ", "start", 10, MUT))
    o.append(T(150, 286, "ボス（基板の位置を決める）", "middle", 10, MUT))
    o.append(CIRC(150, 192, 5, SIG, 1.6))
    o.append(T(150, 175, "固定点", "middle", 10, SIG, True))
    o.append(T(409, 22, "ケースの壁", "middle", 10, MUT))
    # 右: 積み上がる誤差
    items = ["ボスの位置（ケース）", "基板の穴とねじの隙間", "基板上の部品の位置", "開口の位置（ケース）", "熱膨張差（固定点から）"]
    o.append(T(768, 34, "隙間 g を食う誤差", "middle", 11.5, INK, True))
    for k, s_ in enumerate(items):
        o.append(BOX(682, 46 + k * 46, 172, 38, s_, None, LIN, PAN, INK, 6, 1.2, 10.5))
    return SVG(860, 300, o, "コネクタ開口と基板の位置合わせ（断面）。開口の隙間 g は、基板の位置を決める誤差をすべて足し合わせたもの（07 章の積み上げ）より大きくする。")
F["e10_conn"] = _e10_conn()


def _e10_cable():
    o = []
    # 悪い例
    o.append(T(20, 24, "× 悪い例", "start", 12.5, ALI, True))
    o.append(RECT(20, 36, 400, 200, 14, PAN, INK, 1.5))
    o.append(W(20, 136, 420, 136, c=MUT, lw=1.2, dash="6,4"))
    o.append(T(410, 130, "合わせ面", "end", 10, MUT))
    o.append(_e10_pcbtop(220, 60, 180, 150))
    o.append(RECT(40, 150, 90, 66, 6, ASOFT, ALI, 1.3))
    o.append(T(85, 188, "電池", "middle", 11, INK, True))
    o.append(PL([(130, 170), (180, 136), (240, 136)], ALI, 2.4))
    o.append(CIRC(180, 136, 16, ALI, 1.4, dash="3,3"))
    o.append(T(140, 110, "合わせ面で挟まる", "middle", 10, ALI, True))
    o.append(CIRC(300, 160, 9, INK, 1.4))
    o.append(PL([(240, 136), (300, 150), (360, 150)], ALI, 2.4))
    o.append(T(330, 186, "ボスを横切る・張っている", "middle", 10, ALI, True))
    # 良い例
    o.append(T(450, 24, "○ 良い例", "start", 12.5, SIG, True))
    o.append(RECT(450, 36, 400, 200, 14, PAN, INK, 1.5))
    o.append(W(450, 136, 850, 136, c=MUT, lw=1.2, dash="6,4"))
    o.append(_e10_pcbtop(650, 60, 180, 150))
    o.append(RECT(470, 150, 90, 66, 6, ASOFT, ALI, 1.3))
    o.append(T(515, 188, "電池", "middle", 11, INK, True))
    # 押さえリブ
    for y in (162, 186):
        o.append(_e10_case(586, y, 26, 6))
    o.append(T(599, 230, "押さえリブ", "middle", 10, SIG, True))
    o.append(PL([(560, 176), (580, 176), (600, 176), (620, 176),
                 (628, 190), (640, 200), (652, 190), (660, 176), (690, 176)], SIG, 2.4))
    o.append(T(660, 226, "たるみ（余長）", "start", 10, SIG, True))
    o.append(CIRC(730, 160, 9, INK, 1.4))
    o.append(T(560, 110, "合わせ面より下を通す", "middle", 10, SIG, True))
    return SVG(870, 246, o, "ケーブルの取り回し（上から見た図）。合わせ面・ボス・ねじを避け、リブで押さえ、組立と保守に足りる余長を残す。")
F["e10_cable"] = _e10_cable()


def _e10_battery():
    o = []
    # 断面: 電池室
    o.append(_e10_case(40, 250, 360, 12))
    o.append(_e10_case(40, 40, 360, 12))
    o.append(_e10_case(40, 52, 12, 198))
    o.append(_e10_case(388, 52, 12, 198))
    o.append(RECT(80, 150, 280, 60, 10, ASOFT, ALI, 1.6))
    o.append(T(220, 186, "パウチ形リチウムイオン電池", "middle", 11, INK, True))
    o.append('<path d="M 80 150 Q 220 120 360 150" fill="none" stroke="var(--alias)" stroke-width="1.6" stroke-dasharray="5,4"/>')
    o.append(T(220, 118, "膨らんだときの外形", "middle", 10, ALI))
    o.append(_e10_case(60, 210, 320, 40))
    o.append(T(220, 236, "平らな受け面（両面テープ）", "middle", 10, MUT))
    o.append(DIM(330, 52, 330, 140, None, SIG))
    o.append(T(322, 90, "膨張の余裕", "end", 10.5, SIG, True))
    # 右: 注意点
    o.append(BOX(440, 40, 400, 64, "平らな面で受ける", "とがった角・細いリブを電池に当てない", SIG, SSOFT))
    o.append(BOX(440, 116, 400, 64, "厚さ方向に余裕を残す", "寿命末期・高温での厚さ増加はセルの資料で確認する", SIG, SSOFT))
    o.append(BOX(440, 192, 400, 64, "落下で動かない", "接点が離れない・配線が引っ張られない（11 章）", SIG, SSOFT))
    return SVG(860, 274, o, "電池の保持（断面）。平らに受け、膨らむ方向に空間を残し、落下で動かないようにする。")
F["e10_battery"] = _e10_battery()
