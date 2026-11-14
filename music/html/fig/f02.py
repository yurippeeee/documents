# 02 章 音名と鍵盤と五線 の図（figures.py の関数・定数をそのまま使う）

# 1. 1 オクターブを 12 の等しい比に分ける（440 Hz → 880 Hz）
def _f02_ladder():
    o = []
    x0, w = 60, 600
    yl = 92
    o.append(T(20, 28, "比の目盛（対数）で 440 Hz から 880 Hz までを 12 等分する", "start", 12, INK, True))
    o.append(W(x0, yl, x0 + w, yl, c=MUT, lw=1.4))
    for k in range(13):
        xx = x0 + w * k / 12
        fq = 440 * 2 ** (k / 12)
        top = k in (0, 12)
        o.append(W(xx, yl - (22 if top else 14), xx, yl + (22 if top else 14), c=SIG if top else BLU, lw=2.2 if top else 1.6))
        o.append(T(xx, yl + 34 + (k % 2) * 13, "%.1f" % fq if not float(fq).is_integer() else "%d" % fq, "middle", 9.5, MUT))
        if k < 12:
            o.append(T(xx + w / 24, yl - 8, "×r", "middle", 9, BLU))
    o.append(T(x0, yl - 30, "440 Hz", "middle", 11, SIG, True))
    o.append(T(x0 + w, yl - 30, "880 Hz（2 倍）", "middle", 11, SIG, True))
    o.append(T(x0 + w / 2, 168, "1 段ごとに同じ比 r を掛ける。12 段で 2 倍になるので r¹² = 2、r = 2^(1/12) ≈ 1.0595", "middle", 11.5, INK, True))
    return SVG(720, 184, o, "1 オクターブ（周波数 2 倍）を、比が等しい 12 段に分ける。1 段が半音で、どの段も周波数が約 5.9% 上がる。"
               "下の数字は各段の周波数（Hz）。")
F["e02_ladder"] = _f02_ladder()


# 1b. 倍音列の位置と 12 等分の目盛の重なり
def _f02_grid():
    o = []
    x0, w = 60, 600
    L = lambda c: x0 + w * c / 3600    # 3 オクターブ = 3600 セント
    yl = 110
    o.append(T(20, 28, "基音から 3 オクターブの範囲（比の目盛）", "start", 12, INK, True))
    for s_ in range(37):
        xx = L(s_ * 100)
        o.append(W(xx, yl - 40, xx, yl + 6, c=LIN if s_ % 12 else MUT, lw=1 if s_ % 12 else 1.6))
    o.append(T(x0 + w, yl - 46, "細い縦線: 12 等分の目盛（半音ごと）", "end", 9.5, MUT))
    for h in range(1, 9):
        c = 1200 * math.log2(h)
        xx = L(c)
        dev = c - 100 * round(c / 100)
        col = SIG if abs(dev) < 5 else (GLD if abs(dev) < 20 else ALI)
        o.append(W(xx, yl - 2, xx, yl + 40, c=col, lw=3))
        o.append(T(xx, yl + 54, "第 %d" % h, "middle", 10, col, True))
        if h > 1:
            o.append(T(xx, yl + 68, ("%+.0f" % dev) if abs(dev) >= 0.5 else "0", "middle", 9.5, col))
    o.append(T(x0 + w, yl + 92, "数字は、いちばん近い目盛からのずれ（セント。半音 = 100 セント）", "end", 10, MUT))
    o.append(RECT(60, 226, 10, 10, 2, SIG, SIG, 1)); o.append(T(74, 235, "ほぼ一致（5 セント未満）", "start", 10, INK))
    o.append(RECT(240, 226, 10, 10, 2, GLD, GLD, 1)); o.append(T(254, 235, "少しずれる（14 セント）", "start", 10, INK))
    o.append(RECT(420, 226, 10, 10, 2, ALI, ALI, 1)); o.append(T(434, 235, "大きくずれる（31 セント）", "start", 10, INK))
    return SVG(720, 248, o, "倍音列（第 1〜第 8 倍音）を 12 等分の目盛に重ねた。第 2・3・4・6・8 倍音はほぼ目盛に乗り、"
               "第 5 倍音は少し、第 7 倍音は大きく外れる。12 等分は、倍音列の単純な比をよく近似する区切り方である。")
F["e02_grid"] = _f02_grid()


# 2. 7 つの音名と 12 の段（半音・全音）
def _f02_letters():
    o = []
    x0, dx = 54, 50
    yl = 86
    letters = {0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B", 12: "C"}
    sharp = {1: ("C♯", "D♭"), 3: ("D♯", "E♭"), 6: ("F♯", "G♭"), 8: ("G♯", "A♭"), 10: ("A♯", "B♭")}
    o.append(W(x0, yl, x0 + 12 * dx, yl, c=MUT, lw=1.2))
    for k in range(13):
        xx = x0 + k * dx
        if k in letters:
            o.append(CIRC(xx, yl, 15, SIG, 1.6, SSOFT))
            o.append(T(xx, yl + 5, letters[k], "middle", 13, INK, True))
            o.append(T(xx, yl + 34, DOREMI[letters[k]], "middle", 10.5, MUT))
        else:
            o.append(CIRC(xx, yl, 10, MUT, 1.2, PAN))
            o.append(T(xx, yl - 34, sharp[k][0], "middle", 10.5, BLU, True))
            o.append(T(xx, yl - 20, sharp[k][1], "middle", 10.5, PUR, True))
    # 文字どうしの間隔
    ks = sorted(letters)
    for a, b in zip(ks, ks[1:]):
        xa, xb = x0 + a * dx, x0 + b * dx
        semi = b - a == 1
        y = yl + 58
        o.append(W(xa + 4, y, xb - 4, y, c=ALI if semi else GRN2, lw=2))
        o.append(T((xa + xb) / 2, y + 16, "半音" if semi else "全音", "middle", 10.5, ALI if semi else GRN2, True))
    return SVG(720, 176, o, "1 オクターブの 12 段のうち 7 段に C〜B の文字の名前が付く。文字どうしの間は、E–F と B–C だけが半音（1 段）で、"
               "ほかは全音（2 段）。名前の無い 5 段は、隣の文字に ♯（半音上げる）か ♭（半音下げる）を付けて呼ぶ。")
F["e02_letters"] = _f02_letters()


# 3. 鍵盤 1 オクターブ: 白鍵と黒鍵の名前、半音・全音
def _f02_keyboard():
    o = []
    ww, x0, y0 = 58, 70, 64
    hl = {}
    info = {}
    o.append(KEYBOARD(x0, y0, 60, 72, ww=ww, wh=170, hl=hl, names=None, info=info))
    for m in range(60, 73):
        cx, yb = info[m]
        pc = m % 12
        if IS_BLACK[pc]:
            o.append(T(cx, y0 - 26, NAMES_SHARP[pc], "middle", 11, BLU, True))
            o.append(T(cx, y0 - 12, NAMES_FLAT[pc], "middle", 11, PUR, True))
        else:
            o.append(T(cx, yb - 26, NAMES_SHARP[pc], "middle", 15, KI, True))
            o.append(T(cx, yb - 10, DOREMI[NAMES_SHARP[pc]], "middle", 10.5, KI))
    # 白鍵どうしの間隔
    wl = [m for m in range(60, 73) if not IS_BLACK[m % 12]]
    for a, b in zip(wl, wl[1:]):
        xa, xb = info[a][0], info[b][0]
        semi = b - a == 1
        y = y0 + 196
        o.append(PL([(xa + 6, y - 8), ((xa + xb) / 2, y + 2), (xb - 6, y - 8)], ALI if semi else GRN2, 1.8))
        o.append(T((xa + xb) / 2, y + 18, "半音" if semi else "全音", "middle", 10.5, ALI if semi else GRN2, True))
    o.append(T(x0 + 8 * ww + 18, y0 + 40, "黒鍵は", "start", 11, MUT))
    o.append(T(x0 + 8 * ww + 18, y0 + 56, "2 本と 3 本の", "start", 11, MUT))
    o.append(T(x0 + 8 * ww + 18, y0 + 72, "組で並ぶ", "start", 11, MUT))
    return SVG(720, 296, o, "鍵盤の 1 オクターブ。隣り合う鍵（黒鍵を含む）は、どれも半音ずつ違う。白鍵が C〜B の 7 つの名前、"
               "黒鍵が ♯・♭ の付いた 5 つの名前に当たる。E–F と B–C の間には黒鍵が無く、半音で隣り合う。")
F["e02_keyboard"] = _f02_keyboard()


# 4. 88 鍵のピアノとオクターブ番号
def _f02_88():
    o = []
    ww = 12.4
    x0, y0 = 26, 40
    info = {}
    hl = {60: dict(c=SIG, label=""), 69: dict(c=BLU, label="")}
    o.append(KEYBOARD(x0, y0, 21, 108, ww=ww, wh=70, hl=hl, names=None, info=info))
    for m in range(24, 109, 12):
        cx, yb = info[m]
        o.append(T(cx, yb + 16, "C%d" % (m // 12 - 1), "middle", 10, INK, True))
    o.append(T(info[21][0], y0 + 86, "A0", "middle", 10, MUT, True))
    cx = info[60][0]
    o.append(ARR(cx, y0 + 128, cx, y0 + 96, SIG, 1.6))
    o.append(T(cx, y0 + 142, "C4（中央の C、MIDI 60、261.63 Hz）", "middle", 11, SIG, True))
    cx = info[69][0]
    o.append(ARR(cx + 60, y0 - 16, cx, y0 - 2, BLU, 1.4))
    o.append(T(cx + 64, y0 - 16, "A4（440 Hz、MIDI 69）", "start", 11, BLU, True))
    o.append(T(info[21][0] - 4, y0 + 162, "最低音 A0 = 27.5 Hz（MIDI 21）", "start", 10.5, MUT))
    o.append(T(info[108][0] + 4, y0 + 162, "最高音 C8 = 4186 Hz（MIDI 108）", "end", 10.5, MUT))
    return SVG(700, 214, o, "88 鍵のピアノ。オクターブ番号は C ごとに 1 つ増える（国際式）。中央付近の C が C4、調律の基準の A が A4 である。")
F["e02_88"] = _f02_88()


# 5. 五線の位置と白鍵の対応（ト音記号）
def _f02_staffmap():
    o = []
    s = 12
    xs, yt = 30, 40
    names = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"]
    items = [dict(x=88 + i * 46, notes=[n], fill=(SIG if n in ("E4", "G4", "B4", "D5", "F5") else BLU)) for i, n in enumerate(names)]
    o.append(STAFF(xs, yt, 88 + 11 * 46 + 40, s=s, clef="treble", items=items))
    for i, n in enumerate(names):
        p = parse(n)
        pos_ = staff_pos(n, "treble")
        o.append(T(xs + 88 + i * 46, yt + 4 * s + 40, nname(n), "middle", 11, INK, True))
        o.append(T(xs + 88 + i * 46, yt + 4 * s + 54, "線" if pos_ % 2 == 0 else "間", "middle", 9.5, SIG if pos_ % 2 == 0 else BLU))
    # 下に鍵盤
    info = {}
    ky = yt + 4 * s + 70
    hl = {parse(n)["midi"]: dict(c=BLU if staff_pos(n, "treble") % 2 else SIG, label=nname(n, False)) for n in names}
    kx = xs + 88 - 23
    o.append(KEYBOARD(kx, ky, 60, 79, ww=46, wh=96, hl=hl, names=None, info=info))
    return SVG(700, 300, o, "ト音記号の五線で、下から順に「線・間・線・間…」と 1 つ上がるごとに、白鍵 1 つ分（次の文字の音名）上がる。"
               "五線の 1 段は半音ではなく、文字の名前 1 つ分である。")
F["e02_staffmap"] = _f02_staffmap()


# 6. ト音記号・ヘ音記号と大譜表
def _f02_clefs():
    o = []
    s = 11
    # ト音記号
    o.append(STAFF(20, 46, 200, s=s, clef="treble", items=[dict(x=120, notes=["G4"], fill=SIG, label="G4")]))
    o.append(W(20, 46 + 3 * s, 220, 46 + 3 * s, c=SIG, lw=2))
    o.append(T(120, 24, "ト音記号: うず巻きの中心の線が G4", "middle", 11, SIG, True))
    # ヘ音記号
    o.append(STAFF(260, 46, 200, s=s, clef="bass", items=[dict(x=120, notes=["F3"], fill=BLU, label="F3")]))
    o.append(W(260, 46 + s, 460, 46 + s, c=BLU, lw=2))
    o.append(T(360, 24, "ヘ音記号: 2 つの点にはさまれた線が F3", "middle", 11, BLU, True))
    # 大譜表
    o.append(STAFF(500, 46, 190, s=9, clef="grand", items=[dict(x=110, notes=["C4"], fill=ALI, staff="treble", label="C4"),
                                                         dict(x=160, notes=["C4"], fill=ALI, staff="bass")]))
    o.append(T(595, 24, "大譜表: 中央の C は加線 1 本", "middle", 11, ALI, True))
    return SVG(712, 210, o, "左: ト音記号は第 2 線を G4 と決める。中: ヘ音記号は第 4 線を F3 と決める。"
               "右: ピアノでは 2 つを上下に並べた大譜表を使う。中央の C（C4）は、上の五線の下に加線 1 本、下の五線の上に加線 1 本の位置で、どちらに書いても同じ音である。")
F["e02_clefs"] = _f02_clefs()


# 7. 臨時記号（♯・♭・♮）
def _f02_acc():
    o = []
    s = 12
    items = [dict(x=90, notes=["F4"], fill=INK, label="F4"),
             dict(x=170, notes=["F#4"], fill=BLU, label="F♯4"),
             dict(x=250, notes=["Bb4"], fill=PUR, label="B♭4"),
             dict(x=330, notes=["B4"], fill=INK, label="B4")]
    o.append(STAFF(20, 40, 380, s=s, clef="treble", items=items))
    info = {}
    hl = {65: dict(c=MUT, label="F"), 66: dict(c=BLU, label="F♯"), 70: dict(c=PUR, label="B♭"), 71: dict(c=MUT, label="B")}
    o.append(KEYBOARD(440, 46, 64, 72, ww=30, wh=110, hl=hl, names=None, info=info))
    o.append(T(440, 182, "♯: 半音上げる　♭: 半音下げる", "start", 11, INK, True))
    o.append(T(440, 198, "♮（ナチュラル）: ♯・♭ を取り消す", "start", 11, INK))
    return SVG(712, 212, o, "臨時記号は音符の左に書く。五線の位置が文字の名前を決め、♯ と ♭ がそれを半音ずらす。"
               "F♯4 は F4 と同じ位置に書き、鍵盤では F4 のすぐ右の黒鍵になる。")
F["e02_acc"] = _f02_acc()


# 8. 倍音列を音名で書く（基音 C2）
def _f02_hseries():
    o = []
    s = 8.5
    names = ["C2", "C3", "G3", "C4", "E4", "G4", "Bb4", "C5"]
    devs = [0, 0, 2, 0, -14, 2, -31, 0]
    items = []
    for i, n in enumerate(names):
        col = SIG if abs(devs[i]) < 5 else (GLD if abs(devs[i]) < 20 else ALI)
        items.append(dict(x=70 + i * 52, notes=[n], fill=col, staff=("treble" if parse(n)["midi"] >= 60 else "bass")))
    o.append(STAFF(20, 30, 70 + 7 * 52 + 40, s=s, clef="grand", items=items))
    yb = 30 + 12 * s + 50
    for i, n in enumerate(names):
        x = 20 + 70 + i * 52
        col = SIG if abs(devs[i]) < 5 else (GLD if abs(devs[i]) < 20 else ALI)
        o.append(T(x, yb, "第 %d" % (i + 1), "middle", 10, col, True))
        o.append(T(x, yb + 14, nname(n), "middle", 10, INK, True))
        o.append(T(x, yb + 28, ("%+d" % devs[i]) if devs[i] else "0", "middle", 9.5, col))
    X = 520
    o.append(T(X, 50, "C2 = 65.41 Hz の倍音", "start", 11.5, INK, True))
    o.append(T(X, 70, "第 n 倍音 = n × 65.41 Hz", "start", 10.5, MUT))
    o.append(T(X, 98, "下の数字: 平均律の音からの", "start", 10.5, MUT))
    o.append(T(X, 112, "ずれ（セント）", "start", 10.5, MUT))
    o.append(T(X, 140, "第 7 倍音は B♭4 より", "start", 10.5, ALI, True))
    o.append(T(X, 154, "31 セント低い", "start", 10.5, ALI, True))
    return SVG(712, 264, o, "基音を C2 とした倍音列を、いちばん近い平均律の音名で書いた。第 2・4・8 倍音は C のオクターブ上、第 3・6 倍音は G、第 5 倍音は E に当たる。")
F["e02_hseries"] = _f02_hseries()
