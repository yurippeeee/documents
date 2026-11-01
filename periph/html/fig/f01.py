# -*- coding: utf-8 -*-
# 01 章 電源と周辺制御の全体像 の図

def _f01_heat(x, y, h, c=ALI, lw=1.6, horiz=False):
    """熱を表す波打つ矢印。(x, y) から上へ h（horiz=True なら右へ h）。"""
    n = max(2, int(h / 9))
    seg = (h - 7) / n
    d = "M%g,%g" % (x, y)
    for i in range(n):
        s = 1 if i % 2 == 0 else -1
        if horiz:
            d += " q%g,%g %g,0" % (seg / 2, 4 * s, seg)
        else:
            d += " q%g,%g 0,%g" % (4 * s, -seg / 2, -seg)
    if horiz:
        xe = x + n * seg
        return PATH(d, c=c, lw=lw, dash="3 2") + _head(xe - 4, y, xe + 7, y, c, 6)
    ye = y - n * seg
    return PATH(d, c=c, lw=lw, dash="3 2") + _head(x, ye + 4, x, ye - 7, c, 6)

# ---- 1 節: 電力・信号・熱 ----
def _f01_block():
    o = []
    y1, h1 = 78, 58                    # 上の段（信号の流れ）
    y2, h2 = 206, 56                   # 下の段（電源）
    S_ = (40, 150); M_ = (210, 330); W_ = (400, 500); A_ = (556, 684)
    o.append(BOX(S_[0], y1, S_[1] - S_[0], h1, "センサ", "外の量を電気の値に", TEA, TSOFT, INK, sz=12, ssz=9.5))
    o.append(BOX(M_[0], y1, M_[1] - M_[0], h1, "マイコン", "規則に従って決める", SIG, SSOFT, INK, sz=12, ssz=9.5))
    o.append(BOX(W_[0], y1, W_[1] - W_[0], h1, "スイッチ", "MOSFET・リレー", PUR, PSOFT, INK, sz=12, ssz=9.5))
    o.append(BOX(A_[0], y1, A_[1] - A_[0], h1, "アクチュエータ", "モータ・ヒータ・LED", PUR, PSOFT, INK, sz=12, ssz=9.5))
    ym = y1 + h1 / 2
    # 測る対象 → センサ
    xs = (S_[0] + S_[1]) / 2
    o.append(T(xs, 34, "測る対象（温度・扉の開閉など）", "middle", 10, TEA))
    o.append(ARR(xs, 40, xs, y1 - 3, c=TEA, lw=1.4, dash="4 3"))
    # 信号
    o.append(ARR(S_[1] + 2, ym, M_[0] - 3, ym, c=TEA, lw=1.8))
    o.append(T((S_[1] + M_[0]) / 2, ym - 8, "測った値", "middle", 9.5, TEA, True))
    o.append(ARR(M_[1] + 2, ym, W_[0] - 3, ym, c=SIG, lw=1.8))
    o.append(T((M_[1] + W_[0]) / 2, ym - 8, "入れる・切る", "middle", 9.5, SIG, True))
    o.append(ARR(W_[1] + 2, ym, A_[0] - 3, ym, c=GLD, lw=3))
    o.append(T((W_[1] + A_[0]) / 2, ym - 9, "大きな電流", "middle", 9.5, GLD, True))
    o.append(T(A_[1], y1 + h1 + 16, "外の世界に働きかける", "end", 10, PUR))
    o.append(T(A_[1], y1 + h1 + 30, "（動かす・温める・光らせる）", "end", 9.5, PUR))
    # 電源とレギュレータ
    P_ = (16, 136); R_ = (186, 314)
    o.append(BOX(P_[0], y2, P_[1] - P_[0], h2, "電源", "電池・USB・AC・車", GLD, GOSOFT, INK, sz=12, ssz=9.5))
    o.append(BOX(R_[0], y2, R_[1] - R_[0], h2, "レギュレータ", "電圧を一定にする（05 章）", GLD, GOSOFT, INK, sz=12, ssz=9.5))
    o.append(ARR(P_[1] + 2, y2 + h2 / 2, R_[0] - 3, y2 + h2 / 2, c=GLD, lw=2.4))
    xr = (R_[0] + R_[1]) / 2
    xm = (M_[0] + M_[1]) / 2
    yb = 172
    o.append(W(xr, y2, xr, yb, c=GLD, lw=2.4))
    o.append(W(xs, yb, xm, yb, c=GLD, lw=2.4))
    o.append(ARR(xs, yb, xs, y1 + h1 + 3, c=GLD, lw=2.4))
    o.append(ARR(xm, yb, xm, y1 + h1 + 3, c=GLD, lw=2.4))
    # 電源から直接スイッチへ
    xw = (W_[0] + W_[1]) / 2
    ybus = y2 + h2 + 22
    o.append(W((P_[0] + P_[1]) / 2, y2 + h2, (P_[0] + P_[1]) / 2, ybus, xw, ybus, xw, y1 + h1 + 10, c=GLD, lw=3))
    o.append(ARR(xw, y1 + h1 + 12, xw, y1 + h1 + 3, c=GLD, lw=3))
    o.append(T(xw + 8, ybus - 8, "アクチュエータの電力は電源から直接", "start", 9.5, GLD))
    # 熱
    o.append(_f01_heat(xm + 30, y1 - 4, 26, lw=1.3))
    o.append(_f01_heat(xw + 26, y1 - 4, 26, lw=1.3))
    o.append(_f01_heat(A_[0] + 40, y1 - 4, 40, lw=2.2))
    o.append(_f01_heat(A_[0] + 70, y1 - 4, 40, lw=2.2))
    o.append(_f01_heat(R_[1] + 4, y2 + 18, 34, lw=1.3, horiz=True))
    o.append(T(xm + 40, y1 - 18, "熱", "start", 10, ALI, True))
    o.append(T(xw + 36, y1 - 18, "熱", "start", 10, ALI, True))
    o.append(T(A_[0] + 84, y1 - 30, "熱（多い）", "start", 10, ALI, True))
    o.append(T(R_[1] + 44, y2 + 22, "熱", "start", 10, ALI, True))
    yl = ybus + 30
    o.append(LEGEND(16, yl, [(GLD, "電力の流れ"), (TEA, "センサからの信号"), (SIG, "マイコンからの指示"), (ALI, "熱（波打つ矢印）")]))
    return SVG(700, yl + 12, o, "機器の中を流れる電力・信号・熱。電力は電源からレギュレータを通ってマイコンとセンサへ、アクチュエータへは電源から直接スイッチを通って流れる。信号はセンサからマイコンへ、マイコンからスイッチへ流れる。部品が使った電力の多くは熱になり、周りへ逃げる。")
F["e01_block"] = _f01_block()

def _f01_mcu():
    o = []
    o.append(T(14, 18, "(a) マイコンの周辺回路と、外の部品", "start", 11.5, INK, True))
    X0, X1, Y0, Y1 = 214, 486, 32, 216
    o.append(RECT(X0, Y0, X1 - X0, Y1 - Y0, 10, SSOFT, SIG, 1.6))
    o.append(T(X0 + 12, Y0 + 18, "マイコン", "start", 11.5, SIG, True))
    bw, bh = 92, 30
    cpu = (300, 58, 100, 30)
    gin = (X0 + 12, 118); itr = (X0 + 109, 118); gout = (X1 - 12 - bw, 118)
    adc = (X0 + 12, 168); tim = (X1 - 12 - bw, 168)
    o.append(BOX(cpu[0], cpu[1], cpu[2], cpu[3], "CPU・メモリ", None, SIG, PAN, INK, sz=10.5))
    o.append(BOX(gin[0], gin[1], bw, bh, "GPIO（入力）", None, TEA, PAN, INK, sz=10))
    o.append(BOX(itr[0], itr[1], 64, bh, "割り込み", None, SIG, PAN, INK, sz=10))
    o.append(BOX(gout[0], gout[1], bw, bh, "GPIO（出力）", None, PUR, PAN, INK, sz=10))
    o.append(BOX(adc[0], adc[1], bw, bh, "ADC", None, TEA, PAN, INK, sz=10))
    o.append(BOX(tim[0], tim[1], bw, bh, "タイマ", None, PUR, PAN, INK, sz=10))
    # 内部の矢印
    o.append(ARR(gin[0] + bw, gin[1] + bh / 2, itr[0] - 2, itr[1] + bh / 2, c=SIG, lw=1.3, head=6))
    o.append(ARR(tim[0], tim[1] + 6, itr[0] + 50, itr[1] + bh + 2, c=SIG, lw=1.3, head=6))
    o.append(ARR(itr[0] + 32, itr[1], itr[0] + 32, cpu[1] + cpu[3] + 2, c=SIG, lw=1.3, head=6))
    o.append(T(itr[0] + 38, itr[1] - 9, "中断して知らせる", "start", 9, SIG))
    # 外の部品（左: 入力、右: 出力）
    o.append(BOX(16, gin[1] - 4, 150, 38, "扉のスイッチ", None, TEA, TSOFT, INK, sz=10.5))
    o.append(ARR(168, gin[1] + bh / 2, gin[0] - 2, gin[1] + bh / 2, c=TEA, lw=1.6))
    o.append(BOX(16, adc[1] - 4, 150, 38, "温度センサ", "電圧を出す", TEA, TSOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(168, adc[1] + bh / 2, adc[0] - 2, adc[1] + bh / 2, c=TEA, lw=1.6))
    o.append(T(16, Y1 + 22, "デジタルの値を出すセンサとは、I2C・SPI などの通信の回路でやり取りする（08 章）。", "start", 9.5, MUT))
    o.append(BOX(534, gout[1] - 4, 150, 38, "LED・リレー", "スイッチを通して", PUR, PSOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(gout[0] + bw + 2, gout[1] + bh / 2, 532, gout[1] + bh / 2, c=PUR, lw=1.6))
    o.append(BOX(534, tim[1] - 4, 150, 38, "モータ・ヒータ", "入れる時間の割合（PWM）", PUR, PSOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(tim[0] + bw + 2, tim[1] + bh / 2, 532, tim[1] + bh / 2, c=PUR, lw=1.6))
    o.append(T(509, tim[1] + bh / 2 - 6, "パルス", "middle", 9, PUR))
    # (b) 割り込みの時間の流れ
    yb = 280
    o.append(T(14, yb - 14, "(b) 割り込みの時間の流れ（眠っているマイコンが、出来事が起きたときだけ起きて処理する）", "start", 11.5, INK, True))
    x0, x1 = 110, 684
    ty = yb + 34
    o.append(T(x0 - 8, ty + 14, "プログラム", "end", 10, INK, True))
    segs = [(0, 0.14, "元の処理", SSOFT, SIG), (0.14, 0.27, "ハンドラ", TSOFT, TEA), (0.27, 0.36, "元の処理", SSOFT, SIG),
            (0.36, 0.66, "眠る（小さな電流で待つ）", MSOFT, MUT), (0.66, 0.79, "ハンドラ", TSOFT, TEA), (0.79, 1.0, "眠る", MSOFT, MUT)]
    X = lambda f: x0 + f * (x1 - x0)
    for a, b, lab, fill, c in segs:
        o.append(RECT(X(a), ty, X(b) - X(a), 22, 3, fill, c, 1.1))
        o.append(T((X(a) + X(b)) / 2, ty + 15, lab, "middle", 9.5, c, True))
    for f, lab, c in ((0.14, "扉が開く（ピンが変わる）", TEA), (0.66, "タイマが 1 分を数え終える", PUR)):
        o.append(ARR(X(f), ty - 26, X(f), ty - 2, c=c, lw=1.6, head=6))
        o.append(T(X(f) + 4, ty - 16, lab, "start", 9.5, c, True))
    o.append(W(x0, ty + 32, x1, ty + 32, c=MUT, lw=1))
    o.append(T(x1, ty + 46, "時間 →", "end", 9.5, MUT))
    return SVG(700, ty + 54, o, "(a) マイコンの中の周辺回路（GPIO・ADC・タイマ・割り込み）と、それにつながる外の部品の例。(b) 割り込みの時間の流れ。出来事が起きると、実行中の処理を中断して割り込みハンドラを実行し、終わったら元に戻る。眠っているマイコンも、割り込みで起きる。")
F["e01_mcu"] = _f01_mcu()

# ---- 2 節: 使用条件の 4 つの軸 ----
def _f01_axes():
    o = []
    boxes = [
        (14, 14, GLD, GOSOFT, "電源 — 何から電力を得るか",
         ["種類（電池・USB・AC アダプタ・商用電源・車・太陽電池）", "電圧の範囲（例: CR2032 は 3.0 V から下がっていく）", "取り出せる電流の上限と、途切れることがあるか"]),
        (354, 14, PUR, PSOFT, "負荷 — 何を、どれだけの電流で動かすか",
         ["動かすもの（センサ・無線・LED・モータ・ヒータ）", "平均の電流と、瞬間の最大の電流（4 節）", "切った瞬間に電圧が跳ね上がるか（リレーなど。12 章）"]),
        (14, 132, TEA, TSOFT, "環境 — どこに置かれるか",
         ["温度と湿度の範囲（例: 屋外は −20〜50 °C）", "屋内か屋外か。結露・ほこり・振動", "配線の長さ。雷や電気のノイズ"]),
        (354, 132, SIG, SSOFT, "使われ方 — どう使われるか",
         ["いつも動くか、ときどき起きて仕事をするか", "何年使うか。電池を交換できるか", "人がそばにいるか。止まったら何が起きるか"]),
    ]
    for x, y, c, fill, title, lines in boxes:
        o.append(RECT(x, y, 332, 106, 8, fill, c, 1.4))
        o.append(T(x + 12, y + 22, title, "start", 12, c, True))
        for i, l in enumerate(lines):
            o.append(T(x + 14, y + 46 + i * 21, "・" + l, "start", 10.5, INK))
    return SVG(700, 252, o, "使用条件の 4 つの軸と、それぞれで書き出すこと（括弧の中は例）。設計を始める前に、この 4 つを書き出す。")
F["e01_axes"] = _f01_axes()

def _f01_concerns():
    o = []
    cols = [("平均電流と", "電池寿命", "4 節・04・07 章"), ("ピーク電流と", "電圧の低下", "4 節・03・04 章"),
            ("電源の途切れ", "と変動", "02・05・06 章"), ("感電と", "絶縁", "02・06 章"), ("温度", "", "03・14 章"),
            ("過熱と", "安全な状態", "5 節・14・15 章"), ("ノイズ・", "サージ・雷", "06・11 章")]
    # 1: 主に気をつける（●）、2: 気をつける（○）
    rows = [("ドアの開閉センサ", [(1, "何年もつか"), (1, "送信の瞬間"), (2, "電池の電圧が|下がっていく"), None, (2, "低温で弱る"), None, None]),
            ("電気ファンヒータ", [None, (2, "ファンの|回り始め"), (1, "停電と|電源の戻り"), (1, "AC 100 V"), None, (1, "1 kW の|ヒータ"), (1, "雷のサージ")]),
            ("USB の測定器", [None, (1, "取り出せる|電流の上限"), (1, "いつ抜かれる|か分からない"), None, None, None, (2, "静電気")]),
            ("屋外の気象計", [(1, "夜は電池で|動く"), (2, "無線の送信"), (1, "夜と曇り"), None, (1, "−20〜50 °C"), None, (1, "雷・長い|配線")]),
            ("車の記録計", [(2, "駐車中も|電池を使う"), None, (1, "エンジンの|始動で下がる"), None, (1, "夏の車内"), None, (1, "車の電気の|ノイズ")])]
    x0, cw, y0, rh = 150, 77, 66, 46
    for j, (a, b, ch) in enumerate(cols):
        xc = x0 + j * cw + cw / 2
        o.append(T(xc, 18, a, "middle", 10, INK, True))
        if b:
            o.append(T(xc, 31, b, "middle", 10, INK, True))
        o.append(T(xc, 46, ch, "middle", 8.5, MUT))
    for i, (name, cells) in enumerate(rows):
        y = y0 + i * rh
        o.append(W(14, y - 4, x0 + 7 * cw, y - 4, c=LIN, lw=1))
        o.append(T(14, y + rh / 2 + 1, name, "start", 10.5, INK, True))
        for j, cell in enumerate(cells):
            if not cell:
                continue
            kind, txt = cell
            xc = x0 + j * cw + cw / 2
            lines = txt.split("|")
            if kind == 1:
                o.append(RECT(x0 + j * cw + 3, y, cw - 6, rh - 8, 5, SSOFT, SIG, 1.1))
                c, mk = SIG, "●"
            else:
                c, mk = MUT, "○"
            o.append(T(xc, y + 13, mk, "middle", 9.5, c, True))
            for k, l in enumerate(lines):
                o.append(T(xc, y + 25 + k * 11, l, "middle", 8.8, c, kind == 1))
    yl = y0 + 5 * rh + 6
    o.append(W(14, yl - 10, x0 + 7 * cw, yl - 10, c=LIN, lw=1))
    o.append(T(14, yl + 6, "● 主に気をつけること　○ 気をつけること　（2 節の表の例による。製品と使い方で変わる）", "start", 9.5, MUT))
    return SVG(700, yl + 16, o, "2 節の 5 つの機器で、特に気をつけること。条件が違うと、気をつけることの組み合わせがまったく違う。列の下の数字は、詳しく扱う節と章。")
F["e01_concerns"] = _f01_concerns()

# ---- 3 節: マイコンが決める 4 つのこと ----
def _f01_decide():
    o = []
    # (a) いつ
    ax, ay = 14, 10
    o.append(T(ax, ay + 14, "(a) いつ — ドアの開閉センサ", "start", 11.5, INK, True))
    px0, px1, base, top = ax + 40, ax + 318, ay + 132, ay + 62
    X = lambda t: px0 + t / 180.0 * (px1 - px0)
    o.append(W(px0, ay + 40, px0, base + 6, c=MUT, lw=1.1))
    o.append(T(px0 - 10, (ay + 40 + base) / 2, "電流", "middle", 9.5, MUT, rot=-90))
    o.append(W(px0, base, px1, base, c=GLD, lw=1.6))
    for t in (0, 60, 120, 180):
        o.append(RECT(X(t) - 2, top, 4, base - top, 1, GLD, GLD, 0.8))
        o.append(T(X(t), top - 5, "タイマ", "middle", 9, GLD))
    o.append(RECT(X(90) - 2, top, 4, base - top, 1, TEA, TEA, 0.8))
    o.append(T(X(90), top - 5, "扉が動いた", "middle", 9, TEA, True))
    for t in (0, 60, 120, 180):
        o.append(T(X(t), base + 14, "%d" % t, "middle", 9, MUT))
    o.append(T(px1, base + 27, "時間 [s]", "end", 9, MUT))
    o.append(T(X(30), base - 6, "眠る", "middle", 9, MUT, halo=True))
    o.append(T(X(150), base - 6, "眠る", "middle", 9, MUT, halo=True))
    o.append(T(ax, ay + 168, "1 分ごとにタイマで、扉が動けば割り込みで起きる", "start", 9.5, INK))
    # (b) どれだけ
    bx, by = 362, 10
    o.append(T(bx, by + 14, "(b) どれだけ — ファンヒータ", "start", 11.5, INK, True))
    tx0, sc = bx + 62, 8.6
    for k, (lab, on, avg) in enumerate((("差 3 °C", 3, "300 W"), ("差 7 °C", 7, "700 W"))):
        yy = by + 40 + k * 56
        o.append(T(bx, yy + 13, lab, "start", 10, INK, True))
        o.append(RECT(tx0, yy, 30 * sc, 18, 2, SCR, LIN, 1))
        for w in range(3):
            o.append(RECT(tx0 + (w * 10) * sc, yy, on * sc, 18, 2, PSOFT, PUR, 1.1))
        o.append(T(tx0, yy + 32, "10 秒のうち %d 秒入れる → 平均 %s（1 kW × %d/10）" % (on, avg, on), "start", 9.5, PUR))
    ya = by + 150
    for t in (0, 10, 20, 30):
        o.append(T(tx0 + t * sc, ya, "%d" % t, "middle", 9, MUT))
    o.append(T(tx0 + 30 * sc, ya + 13, "時間 [s]", "end", 9, MUT))
    o.append(T(bx, by + 168, "入れる時間の割合で、平均の電力を決める", "start", 9.5, INK))
    # (c) どの順で
    cx, cy = 14, 202
    o.append(T(cx, cy + 14, "(c) どの順で — ファンヒータ", "start", 11.5, INK, True))
    tx0, sc = cx + 56, 4.6
    rows = (("ファン", [(0, 55)], SIG), ("ヒータ", [(4, 9), (14, 19), (24, 25)], PUR))
    for k, (lab, segs, c) in enumerate(rows):
        yy = cy + 42 + k * 40
        o.append(T(cx, yy + 13, lab, "start", 10, INK, True))
        o.append(RECT(tx0, yy, 60 * sc, 18, 2, SCR, LIN, 1))
        for a, b in segs:
            o.append(RECT(tx0 + a * sc, yy, (b - a) * sc, 18, 2, soft(c), c, 1.1))
    o.append(W(tx0 + 25 * sc, cy + 30, tx0 + 25 * sc, cy + 128, c=ALI, lw=1.2, dash="4 3"))
    o.append(T(tx0 + 25 * sc + 4, cy + 32, "運転を切る", "start", 9, ALI, True))
    o.append(DIM(tx0, cy + 66, tx0 + 3 * sc, cy + 66, None, c=SIG))
    o.append(T(tx0 + 4 * sc, cy + 76, "← ファンが先（3 秒）", "start", 9, SIG, True, halo=True))
    o.append(DIM(tx0 + 25 * sc, cy + 106, tx0 + 55 * sc, cy + 106, None, c=SIG))
    o.append(T(tx0 + 40 * sc, cy + 118, "ヒータを先に切り、30 秒回す", "middle", 9, SIG, True))
    ya = cy + 140
    for t in (0, 20, 40, 60):
        o.append(T(tx0 + t * sc, ya, "%d" % t, "middle", 9, MUT))
    o.append(T(tx0 + 60 * sc, ya + 13, "時間 [s]", "end", 9, MUT))
    o.append(T(cx, cy + 168, "ファンが回っていない間は、ヒータを入れない", "start", 9.5, INK))
    # (d) 失敗したら
    dx, dy = 362, 202
    o.append(T(dx, dy + 14, "(d) 失敗したら — ファンヒータ", "start", 11.5, INK, True))
    steps = [("温度を読む", SIG, SSOFT), ("読めない、または −20 °C 以下・100 °C 以上が 3 回続く", ALI, ASOFT),
             ("ヒータを切る（安全な状態。5 節）", GRN, GSOFT), ("ファンで冷まし、運転を切り直すまで再開しない", GRN, GSOFT)]
    for k, (lab, c, fill) in enumerate(steps):
        yy = dy + 28 + k * 36
        o.append(RECT(dx + 4, yy, 322, 24, 5, fill, c, 1.2))
        o.append(T(dx + 165, yy + 16, lab, "middle", 9.5, c if c != SIG else INK, True))
        if k < 3:
            o.append(ARR(dx + 165, yy + 25, dx + 165, yy + 35, c=MUT, lw=1.3, head=5))
    return SVG(700, 380, o, "マイコンが決める 4 つのこと（2 節の例の機器による）。(a) いつ起きて仕事をするか。(b) どれだけの電力を加えるか。(c) どの順に入れ、切るか。(d) 失敗したらどうするか。(b)〜(d) は、3 節のコードがしていることでもある。")
F["e01_decide"] = _f01_decide()

# ---- 4 節: 平均電流とピーク電流 ----
def _f01_wave():
    o = []
    # (a) 2 周期分（対数目盛）
    o.append(T(14, 18, "(a) 2 周期分の電流（縦軸は対数目盛。起きている山の幅は誇張して描いた）", "start", 11.5, INK, True))
    p = Plot(86, 34, 560, 120, (0, 130), (3e-7, 3e-2), ylog=True)
    yt = [1e-6, 1e-5, 1e-4, 1e-3, 1e-2]
    yf = {1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA", 1e-2: "10 mA"}
    o.append(p.axes(xl=None, yl=None, xt=[0, 30, 60, 90, 120], yt=yt, xfmt=lambda v: "%d" % v, yfmt=lambda v: yf[v]))
    o.append(T(p.x + p.w, p.y + p.h + 28, "時間 [s]", "end", 9.5, MUT))
    o.append(T(p.x - 54, p.y + p.h / 2, "電流", "middle", 10, MUT, rot=-90))
    pts = [(0, 2e-6)]
    for t0 in (0, 60, 120):
        xa = p.X(t0)
        pts += [(t0, 2e-6), (t0, 1e-2), (t0 + 1.2, 1e-2), (t0 + 1.2, 2e-6)]
    pts.append((130, 2e-6))
    o.append(p.line(pts, c=GLD, lw=1.8))
    o.append(p.line([(0, 2.70e-6), (130, 2.70e-6)], c=INK, lw=1.4, dash="6 4"))
    o.append(T(p.X(30), p.Y(2.70e-6) - 7, "平均電流 2.70 µA", "middle", 10, INK, True, halo=True))
    o.append(T(p.X(90), p.Y(2e-6) + 14, "眠り 2 µA", "middle", 9.5, GLD, True, halo=True))
    o.append(D(p.X(60.6), p.Y(1e-2), ALI, 4))
    o.append(T(p.X(62.5), p.Y(1e-2) + 4, "ピーク電流 10 mA（送信）", "start", 10, ALI, True, halo=True))
    # (b) 起きている 7 ms の拡大
    yb = 216
    o.append(T(14, yb - 14, "(b) 起きている 7 ms の拡大", "start", 11.5, INK, True))
    q = Plot(86, yb, 250, 110, (0, 10), (0, 12))
    o.append(q.axes(xt=[0, 2, 4, 6, 8, 10], yt=[0, 5, 10], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(T(q.x + q.w, q.y + q.h + 28, "時間 [ms]", "end", 9.5, MUT))
    o.append(T(q.x - 40, q.y + q.h / 2, "電流 [mA]", "middle", 10, MUT, rot=-90))
    o.append(RECT(q.X(0), q.Y(3), q.X(4) - q.X(0), q.Y(0) - q.Y(3), 0, SSOFT, "none", 0))
    o.append(RECT(q.X(4), q.Y(10), q.X(7) - q.X(4), q.Y(0) - q.Y(10), 0, GOSOFT, "none", 0))
    o.append(q.line([(0, 0.002), (0, 3), (4, 3), (4, 10), (7, 10), (7, 0.002), (10, 0.002)], c=GLD, lw=1.8))
    o.append(T(q.X(2), q.Y(3) - 18, "処理", "middle", 9.5, SIG, True))
    o.append(T(q.X(2), q.Y(3) - 6, "3 mA × 4 ms", "middle", 9, SIG))
    o.append(T(q.X(2), q.Y(1.2), "12 µC", "middle", 9.5, SIG, True))
    o.append(T(q.X(5.5), q.Y(10) - 6, "送信 10 mA × 3 ms", "middle", 9, GLD, True))
    o.append(T(q.X(5.5), q.Y(5), "30 µC", "middle", 9.5, GLD, True))
    # (c) 電荷の内訳
    xc0, wc = 400, 284
    o.append(T(xc0 - 14, yb - 14, "(c) 1 周期（60 s）の電荷の内訳", "start", 11.5, INK, True))
    parts = [("眠り", 119.986, MUT), ("送信", 30.0, GLD), ("処理", 12.0, SIG)]
    tot = sum(v for _, v, _ in parts)
    xx = xc0
    for nm, v, c in parts:
        w = wc * v / tot
        o.append(RECT(xx, yb + 10, w, 30, 2, soft(c), c, 1.2))
        xx += w
    o.append(T(xc0, yb + 58, "合計 162 µC ÷ 60 s = 平均電流 2.70 µA", "start", 10, INK, True))
    for k, (nm, v, c) in enumerate(parts):
        yy = yb + 80 + k * 17
        o.append(RECT(xc0, yy - 9, 10, 10, 2, soft(c), c, 1.1))
        o.append(T(xc0 + 16, yy, "%s %.0f µC（%.0f %%）" % (nm, v, v / tot * 100), "start", 10, c if c != MUT else INK))
    o.append(T(xc0 + 160, yb + 80, "眠りの電流は小さいが、", "start", 9.5, MUT))
    o.append(T(xc0 + 160, yb + 97, "時間が長いので電荷の", "start", 9.5, MUT))
    o.append(T(xc0 + 160, yb + 114, "4 分の 3 を占める", "start", 9.5, MUT))
    return SVG(700, yb + 150, o, "ドアの開閉センサの電流（例の値）。(a) 1 分ごとに 7 ms だけ起きる。(b) 起きている間の電流。グラフの下の面積が電荷になる。(c) 1 周期の電荷の内訳。平均電流は、1 周期の電荷を周期で割った値で、ピーク電流（10 mA）とは 3700 倍ほど違う。")
F["e01_wave"] = _f01_wave()

def _f01_overlap():
    o = []
    cases = [("(a) LED と送信を同時に始める", 14, [(0, 20, 5, PUR, "LED"), (0, 3, 10, GLD, "送信")], True),
             ("(b) LED を消してから送る", 364, [(0, 20, 5, PUR, "LED"), (20, 23, 10, GLD, "送信")], False)]
    for title, x0, segs, stacked in cases:
        o.append(T(x0, 18, title, "start", 11.5, INK, True))
        p = Plot(x0 + 52, 40, 272, 100, (0, 30), (0, 18))
        o.append(p.axes(xt=[0, 10, 20, 30], yt=[0, 5, 10, 15], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
        o.append(T(p.x - 34, p.y + p.h / 2, "電流 [mA]", "middle", 9.5, MUT, rot=-90))
        # 電流の帯（LED を下、送信を上に積む）
        a, b, i1, c1, n1 = segs[0]
        o.append(RECT(p.X(a), p.Y(i1), p.X(b) - p.X(a), p.Y(0) - p.Y(i1), 0, soft(c1), c1, 1.0))
        a2, b2, i2, c2, n2 = segs[1]
        base = i1 if stacked else 0
        o.append(RECT(p.X(a2), p.Y(base + i2), p.X(b2) - p.X(a2), p.Y(base) - p.Y(base + i2), 0, soft(c2), c2, 1.0))
        o.append(T(p.X(11.5), p.Y(2.5) + 4, "LED 5 mA", "middle", 9.5, PUR, True))
        if stacked:
            o.append(T(p.X(3.6), p.Y(12), "送信 10 mA", "start", 9.5, GLD, True))
            o.append(T(p.X(3.6), p.Y(15) - 4, "ピーク 15 mA", "start", 10, ALI, True))
            Iv = [(0, 15), (3, 5), (20, 0)]
        else:
            o.append(T(p.X(23.6), p.Y(10) + 10, "送信", "start", 9.5, GLD, True))
            o.append(T(p.X(23.6), p.Y(10) - 4, "ピーク 10 mA", "start", 10, SIG, True))
            Iv = [(0, 5), (20, 10), (23, 0)]
        o.append(T(p.X(15), p.Y(15) - 4, "電荷 130 µC", "middle", 9.5, MUT))
        # 電池の電圧 V = 3.0 V − I × 60 Ω
        v = Plot(x0 + 52, 196, 272, 100, (0, 30), (1.8, 3.2))
        o.append(T(x0, 186, "電池の電圧（内部抵抗 60 Ω の例）", "start", 10, INK, True))
        o.append(v.axes(xt=[0, 10, 20, 30], yt=[2.0, 2.4, 2.8, 3.2], xfmt=lambda u: "%d" % u, yfmt=lambda u: "%.1f" % u))
        o.append(T(v.x - 34, v.y + v.h / 2, "電圧 [V]", "middle", 9.5, MUT, rot=-90))
        o.append(T(v.x + v.w, v.y + v.h + 28, "時間 [ms]", "end", 9.5, MUT))
        pts = []
        for k, (t, I) in enumerate(Iv):
            tn = Iv[k + 1][0] if k + 1 < len(Iv) else 30
            V = 3.0 - I * 0.06
            pts += [(t, V), (tn, V)]
        o.append(v.line(pts, c=GLD, lw=2))
        o.append(v.line([(0, 2.2), (30, 2.2)], c=ALI, lw=1.2, dash="5 3"))
        o.append(T(v.X(29.5), v.Y(2.2) + 12, "最低の電圧 2.2 V（例）", "end", 9, ALI, halo=True))
        vmin = min(V for _, V in pts)
        tmin = [t for t, V in pts if V == vmin][0]
        if vmin < 2.2:
            o.append(D(v.X(tmin + 1.5), v.Y(vmin), ALI, 4))
            o.append(T(v.X(tmin + 3.6), v.Y(vmin) + 4, "2.1 V: 下回ってリセット", "start", 9.5, ALI, True, halo=True))
        else:
            o.append(D(v.X(tmin + 1.5), v.Y(vmin), GRN, 4))
            o.append(T(v.X(tmin) - 6, v.Y(vmin) + 4, "2.4 V: 下回らない", "end", 9.5, GRN, True, halo=True))
    return SVG(700, 340, o, "同じ 2 つの動作を、同時に始める場合と順に動かす場合（例の値）。電流の帯の面積（電荷 130 µC）はどちらも同じなので、平均電流は変わらない。ピーク電流は 15 mA と 10 mA で、内部抵抗 60 Ω の電池の電圧は 2.1 V と 2.4 V まで下がる。")
F["e01_overlap"] = _f01_overlap()

# ---- 5 節: 安全な状態 ----
def _f01_safe():
    o = []
    cols = [(14, "アクチュエータ"), (196, "安全な状態"), (304, "ならないと何が起きるか"), (470, "保証する方法の例")]
    for x, t in cols:
        o.append(T(x, 20, t, "start", 10.5, MUT, True))
    rows = [("ヒータ", None, "切る", GRN, "過熱・火災", "既定で切れる回路、温度で切る部品（14 章）"),
            ("モータ", None, "止める", GRN, "挟み込み・けが・焼損", "既定で止まる回路。惰性の回転に注意（13 章）"),
            ("弁", "（水やガスを送る）", "閉じる", GRN, "漏れ・あふれ", "電気が切れると、ばねで閉じる弁を選ぶ"),
            ("弁", "（圧力を逃がす）", "開く", GRN, "圧力が上がり続ける", "電気が切れると開く弁を選ぶ"),
            ("電気錠", "（閉じ込めを避けたい扉）", "開く", GRN, "人が閉じ込められる", "電気が切れると外れる錠を選ぶ"),
            ("電気錠", "（盗難を防ぎたい扉）", "閉じる", GRN, "盗まれる", "電気が切れても閉じたままの錠を選ぶ"),
            ("表示の LED", None, "どちらでもよい", MUT, "危険は無い", "—")]
    y0, rh = 30, 38
    for i, (nm, sub, st, c, why, how) in enumerate(rows):
        y = y0 + i * rh
        o.append(W(14, y, 690, y, c=LIN, lw=1))
        if sub:
            o.append(T(14, y + 16, nm, "start", 10.5, PUR, True))
            o.append(T(14, y + 30, sub, "start", 9.5, PUR))
        else:
            o.append(T(14, y + 23, nm, "start", 10.5, PUR, True))
        s, w = CHIP(196, y + 24, st, c, sz=10)
        o.append(s)
        o.append(T(304, y + 23, why, "start", 10, ALI if c != MUT else MUT))
        o.append(T(470, y + 23, how, "start", 9.5, INK))
    o.append(W(14, y0 + len(rows) * rh, 690, y0 + len(rows) * rh, c=LIN, lw=1))
    return SVG(700, y0 + len(rows) * rh + 10, o, "アクチュエータの安全な状態の例。ヒータとモータは止めるが、弁と電気錠は、使い方によって開く側も閉じる側も安全な状態になりうる。マイコンが動いていない間もその状態になるように、回路と部品で保証する。")
F["e01_safe"] = _f01_safe()

def _f01_reset():
    o = []
    x0, x1 = 150, 684
    X = lambda t: x0 + t / 10.0 * (x1 - x0)
    ev = [(3, "プログラムが止まる", ALI), (5, "ウォッチドッグがリセット", GLD), (6, "起動し直す", SIG)]
    rows_y = [72, 118, 170, 228]
    for k, (t, lab, c) in enumerate(ev):
        yt = 16 + k * 16
        o.append(W(X(t), yt - 10, X(t), rows_y[-1] + 34, c=c, lw=1.1, dash="4 3"))
        if k == 0:
            o.append(T(X(t) - 5, yt, lab, "end", 9.5, c, True))
        else:
            o.append(T(X(t) + 5, yt, lab + ("（最初にヒータを切る）" if k == 2 else ""), "start", 9.5, c, True))
    # プログラム
    y = rows_y[0]
    o.append(T(x0 - 10, y + 15, "プログラム", "end", 10, INK, True))
    for a, b, lab, fill, c in ((0, 3, "動いている", SSOFT, SIG), (3, 5, "止まっている", ASOFT, ALI),
                               (5, 6, "リセット中", MSOFT, MUT), (6, 10, "動いている", SSOFT, SIG)):
        o.append(RECT(X(a), y, X(b) - X(a), 22, 2, fill, c, 1.1))
        o.append(T((X(a) + X(b)) / 2, y + 15, lab, "middle", 9.5, c, True))
    # GPIO の出力（H/L）
    def dig(y, segs, c=SIG):
        """segs: [(a, b, レベル)]。レベルは 1, 0, None（入力: 出さない）。"""
        hi, lo = y, y + 20
        pts = []
        for a, b, lv in segs:
            if lv is None:
                o.append(W(X(a), y + 10, X(b), y + 10, c=MUT, lw=1.6, dash="2 3"))
                pts = []
                continue
            yy = hi if lv else lo
            if pts:
                pts.append((X(a), yy))
            pts += [(X(a), yy), (X(b), yy)]
            o.append(PL(pts, c=c, lw=1.8))
            pts = [(X(b), yy)]
    y = rows_y[1]
    o.append(T(x0 - 10, y + 8, "GPIO の出力", "end", 10, INK, True))
    o.append(T(x0 - 10, y + 22, "（H でヒータが入る）", "end", 9, MUT))
    out = [(0, 1, 1), (1, 1.6, 0), (1.6, 3, 1), (3, 5, 1), (5, 6, None), (6, 7.2, 0), (7.2, 8.4, 1), (8.4, 9, 0), (9, 10, 1)]
    dig(y, out)
    o.append(T((X(5) + X(6)) / 2, y - 4, "入力（出さない）", "middle", 9, MUT, halo=True))
    o.append(T((X(3) + X(5)) / 2, y - 4, "H のまま", "middle", 9, ALI, True, halo=True))
    # (a) と (b) のヒータ
    for k, (lab1, lab2, unk) in enumerate((("(a) 抵抗なし", "ヒータ", True), ("(b) 抵抗で L に引く", "ヒータ", False))):
        y = rows_y[2 + k]
        o.append(T(x0 - 10, y + 8, lab1, "end", 10, INK, True))
        o.append(T(x0 - 10, y + 22, lab2, "end", 9.5, PUR))
        o.append(RECT(X(0), y, X(10) - X(0), 22, 2, SCR, LIN, 1))
        for a, b, lv in out:
            if lv:
                c = ALI if 3 <= a < 5 else PUR
                o.append(RECT(X(a), y, X(b) - X(a), 22, 2, soft(c), c, 1.0))
        o.append(T((X(3) + X(5)) / 2, y + 15, "入ったまま", "middle", 9.5, ALI, True))
        if unk:
            for i in range(9):
                xx = X(5) + 4 + i * (X(6) - X(5) - 6) / 9.0
                o.append(W(xx, y + 21, xx + 8, y + 1, c=ALI, lw=1.1))
            o.append(T((X(5) + X(6)) / 2, y + 36, "不定（入ることがある）", "middle", 9.5, ALI, True))
        else:
            o.append(RECT(X(5), y, X(6) - X(5), 22, 2, GSOFT, GRN, 1.2))
            o.append(T((X(5) + X(6)) / 2, y + 15, "切", "middle", 10, GRN, True))
            o.append(T((X(5) + X(6)) / 2, y + 36, "抵抗が切に決める", "middle", 9.5, GRN, True))
    yd = rows_y[-1] + 50
    o.append(DIM(X(3), yd, X(5), yd, None, c=MUT))
    o.append(T((X(3) + X(5)) / 2, yd + 14, "ウォッチドッグの時間", "middle", 9.5, MUT))
    o.append(T(14, yd + 34, "ウォッチドッグが無ければ、プログラムが止まった後もヒータは入り続ける（残る守りはマイコンに頼らない保護だけ）。", "start", 9.5, ALI))
    return SVG(700, yd + 44, o, "ヒータを入れている途中でプログラムが止まった場合（時間は模式的）。止まっている間は、GPIO が最後の H を出し続ける。ウォッチドッグのリセットの間、GPIO は入力になる（多くのマイコン）。(a) 抵抗が無いとヒータの状態は定まらず、(b) 抵抗でスイッチの入力を L に引いておくと切になる。")
F["e01_reset"] = _f01_reset()

# ---- 6 節: シリーズの地図 ----
_F01_PC = {"I": GLD, "II": TEA, "III": PUR, "IV": GRN}
def _f01_part(n):
    n = int(n)
    return "I" if n <= 7 else ("II" if n <= 11 else ("III" if n <= 14 else "IV"))

def _f01_chips(x, y, nums):
    o = []
    for n in nums:
        s, w = CHIP(x, y, n, _F01_PC[_f01_part(n)], sz=10)
        o.append(s)
        x += w + 4
    return "".join(o)

def _f01_parts():
    o = []
    o.append(RECT(8, 30, 684, 288, 12, "none", GRN, 1.4, dash="6 4"))
    o.append(T(20, 22, "機器全体を守る:", "start", 10.5, GRN, True))
    o.append(_f01_chips(116, 22, ["15", "16"]))
    o.append(T(188, 22, "異常に備える（15 章）・条件別の設計ガイド（16 章）", "start", 10, GRN))
    def box(x, y, w, h, title, c, nums, sub=None):
        o.append(RECT(x, y, w, h, 8, soft(c), c, 1.4))
        o.append(T(x + 10, y + 18, title, "start", 11, INK, True))
        if sub:
            o.append(T(x + 10, y + 32, sub, "start", 9, MUT))
        o.append(_f01_chips(x + 10, y + h - 9, nums))
    box(22, 50, 150, 62, "センサ", TEA, ["08", "09", "10"], "つなぐ・測る・測り方")
    box(22, 128, 150, 62, "スイッチ・外部入力", TEA, ["11"], "チャタリング・長い配線")
    box(256, 84, 136, 74, "マイコン", SIG, ["07", "15"], "眠らせ方・ウォッチドッグ")
    box(450, 96, 104, 56, "出力の", PUR, ["12"], "スイッチ・LED")
    box(588, 50, 96, 52, "モータ", PUR, ["13"])
    box(588, 146, 96, 52, "ヒータ・熱", PUR, ["14"])
    box(22, 236, 200, 66, "電源", GLD, ["02", "03", "04", "06"], "種類・電池・AC")
    box(256, 236, 136, 66, "電源まわり", GLD, ["05"], "レギュレータ・リセット")
    # 流れ
    o.append(ARR(174, 81, 254, 110, c=TEA, lw=1.5))
    o.append(ARR(174, 159, 254, 134, c=TEA, lw=1.5))
    o.append(ARR(394, 122, 448, 122, c=SIG, lw=1.5))
    o.append(ARR(556, 112, 586, 82, c=PUR, lw=1.8))
    o.append(ARR(556, 136, 586, 168, c=PUR, lw=1.8))
    o.append(ARR(224, 269, 254, 269, c=GLD, lw=2.2))
    o.append(ARR(324, 234, 324, 160, c=GLD, lw=2.2))
    o.append(W(122, 302, 122, 312, 502, 312, 502, 154, c=GLD, lw=2.2))
    o.append(ARR(502, 160, 502, 154, c=GLD, lw=2.2))
    o.append(T(410, 306, "大きな電流", "middle", 9, GLD, halo=True))
    yl = 340
    items = [("I", "第 I 部 電源（01〜07）"), ("II", "第 II 部 センサと入力（08〜11）"), ("III", "第 III 部 アクチュエータ（12〜14）"), ("IV", "第 IV 部 全体を守る（15・16）")]
    o.append(LEGEND(14, yl, [(_F01_PC[k], t) for k, t in items[:2]], gap=16))
    o.append(LEGEND(14, yl + 18, [(_F01_PC[k], t) for k, t in items[2:]], gap=16))
    return SVG(700, yl + 28, o, "シリーズの章と、1 節の図の部品との対応。札の数字は章の番号で、色は部を表す。01 章（この章）は全体の入口、16 章は使用条件ごとのまとめである。")
F["e01_parts"] = _f01_parts()

def _f01_map():
    o = []
    groups = [("電源", [("電池（交換する・充電する）", ["02", "03", "04", "05", "07"]),
                       ("USB・AC アダプタ", ["02", "05"]),
                       ("商用電源に直結する", ["02", "06", "14", "15"]),
                       ("車の電源", ["02", "05"]),
                       ("太陽電池などの環境発電", ["02", "03", "04", "07"])]),
              ("負荷", [("センサを読む", ["08", "09", "10"]),
                       ("スイッチ・長い配線の入力", ["11"]),
                       ("LED・リレー・ソレノイド", ["12"]),
                       ("モータ", ["12", "13", "15"]),
                       ("ヒータ", ["06", "14", "15"])]),
              ("環境", [("寒い・暑い", ["03", "14"]),
                       ("屋外・長い配線・雷", ["06", "11"])]),
              ("使われ方", [("ほとんど眠って長く動く", ["04", "05", "07", "10"]),
                         ("止まると危険・人のそば", ["14", "15"])])]
    xc0, cw = 214, 29.5
    Xc = lambda n: xc0 + (int(n) - 1) * cw + cw / 2
    spans = [("I", 1, 7, "I 電源"), ("II", 8, 11, "II センサと入力"), ("III", 12, 14, "III アクチュエータ"), ("IV", 15, 16, "IV 全体")]
    for k, a, b, lab in spans:
        c = _F01_PC[k]
        o.append(RECT(Xc(a) - cw / 2 + 1, 10, (b - a + 1) * cw - 2, 20, 4, soft(c), c, 1.1))
        o.append(T((Xc(a) + Xc(b)) / 2, 24, lab, "middle", 9.5, c, True))
    for n in range(1, 17):
        o.append(T(Xc(n), 46, "%02d" % n, "middle", 9.5, _F01_PC[_f01_part(n)], True, mono=True))
    y = 56
    rh = 19
    for g, rows in groups:
        y0 = y
        for lab, chs in rows:
            o.append(W(xc0, y, xc0 + 16 * cw, y, c=GRD, lw=1))
            o.append(T(xc0 - 8, y + 13.5, lab, "end", 10, INK))
            for n in chs + ["16"]:
                o.append(D(Xc(n), y + 9.5, _F01_PC[_f01_part(n)], 5))
            y += rh
        o.append(RECT(14, y0 + 1, 40, y - y0 - 2, 4, MSOFT, MUT, 1))
        o.append(T(34, (y0 + y) / 2 + 4, g, "middle", 10, INK, True))
        y += 8
    for n in range(1, 18):
        xx = xc0 + (n - 1) * cw
        o.append(W(xx, 52, xx, y - 8, c=GRD, lw=1))
    o.append(T(14, y + 10, "● その条件のときに読む章（16 章は、すべての条件のまとめ）。どの機器にも関わる 05 章（電源まわり）と 15 章（異常に備える）も読むとよい。", "start", 9.5, MUT))
    return SVG(700, y + 18, o, "使用条件ごとに読む章。行が条件、列が章で、点の色は部を表す。電源・負荷・環境・使われ方の 4 つの軸のうち、当てはまる行を選び、点のある章を読む。")
F["e01_map"] = _f01_map()
