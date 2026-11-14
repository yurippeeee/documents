# 09 章 ダイアトニックコード の図（figures.py の関数・定数をそのまま使う）

_f09_TC = {"長": BLU, "短": PUR, "減": GLD, "増": ALI}          # 和音の種類の色
_f09_TS = {"長": BSOFT, "短": PSOFT, "減": GOSOFT, "増": ASOFT}
_f09_TN = {"長": "長三和音", "短": "短三和音", "減": "減三和音", "増": "増三和音"}
_f09_SUF = {"長": "", "短": "m", "減": "dim", "増": "aug"}
_f09_QC = {4: BLU, 3: PUR}                                      # 3 度の大きさの色（長 3 度 = 青、短 3 度 = 紫）
_f09_QN = {4: "長 3 度", 3: "短 3 度"}


def _f09_tri(tonic, steps=MAJOR):
    """音階の第 1〜第 7 音の上の三和音。各要素: notes（音名 3 つ）, ms（MIDI）, lo/hi（下・上の 3 度の半音）, t（種類）, sym（ASCII のコードネーム）, name（表示用）"""
    sc = spell_scale(tonic, steps, 15)
    out = []
    for k in range(7):
        ns = [sc[k], sc[k + 2], sc[k + 4]]
        ms = [parse(n)["midi"] for n in ns]
        lo, hi = ms[1] - ms[0], ms[2] - ms[1]
        t = {(4, 3): "長", (3, 4): "短", (3, 3): "減", (4, 4): "増"}[(lo, hi)]
        p = parse(ns[0])
        sym = p["letter"] + {0: "", 1: "#", -1: "b"}[p["acc"]] + _f09_SUF[t]
        out.append(dict(notes=ns, ms=ms, lo=lo, hi=hi, t=t, sym=sym, name=nname(ns[0], False) + _f09_SUF[t]))
    return out


def _f09_arc(xa, xb, y, h, c=MUT, lw=1.3):
    return '<path d="M%g,%g Q%g,%g %g,%g" fill="none" stroke="%s" stroke-width="%g"/>' % (xa, y, (xa + xb) / 2, y - h, xb, y, c, lw)


def _f09_bracket(xa, xb, y, c, lw=2.0, d=7):
    """下向きに開いた括弧（xa から xb まで、高さ y）"""
    return W(xa, y - d, xa, y, xb, y, xb, y - d, c=c, lw=lw)


# 1. 音階の上で 1 つおきに 3 つ取る（7 つの三和音）
def _f09_build():
    o = []
    sc = spell_scale("C4", MAJOR, 11)              # C4 … F5
    X0, DX, Y0, DY = 112, 37, 66, 36
    o.append(T(14, 24, "音階の音", "start", 11.5, MUT, True))
    for i, n in enumerate(sc):
        o.append(T(X0 + i * DX, 24, nname(n, False), "middle", 13, INK, True))
        o.append(T(X0 + i * DX, 40, "%d" % (i % 7 + 1), "middle", 10, MUT))
    o.append(T(14, 40, "第何音か", "start", 10, MUT))
    xb = X0 + 6.5 * DX
    o.append(W(xb, 12, xb, Y0 + 6 * DY + 16, c=LIN, lw=1, dash="3,3"))
    for k in range(7):
        y = Y0 + k * DY
        o.append(T(14, y + 4.5, "第 %d 音の上" % (k + 1), "start", 12, INK, True))
        o.append(W(X0 - 10, y, X0 + 10 * DX + 10, y, c=LIN, lw=1))
        for i in range(11):
            o.append(D(X0 + i * DX, y, MUT, 2.4))
        idx = [k, k + 2, k + 4]
        for a, b in [(k, k + 2), (k + 2, k + 4)]:
            o.append(_f09_arc(X0 + a * DX + 4, X0 + b * DX - 4, y - 11, 9, MUT, 1.2))
        for j, i in enumerate(idx):
            x = X0 + i * DX
            if j == 0:
                o.append(CIRC(x, y, 11, SIG, 1.6, SIG))
                o.append(T(x, y + 4.2, nname(sc[i], False), "middle", 11.5, PAN, True))
            else:
                o.append(CIRC(x, y, 11, INK, 1.6, PAN))
                o.append(T(x, y + 4.2, nname(sc[i], False), "middle", 11.5, INK, True))
        o.append(T(X0 + 10 * DX + 24, y + 4.5, "・".join(nname(sc[i], False) for i in idx), "start", 12.5, INK, True))
    yl = Y0 + 6 * DY + 34
    o.append(CIRC(20, yl - 4, 7, SIG, 1.4, SIG))
    o.append(T(32, yl, "根音", "start", 11, INK))
    o.append(CIRC(84, yl - 4, 7, INK, 1.4, PAN))
    o.append(T(96, yl, "3 度の音・5 度の音", "start", 11, INK))
    o.append(T(xb + 6, yl, "点線より右は 1 オクターブ上の音", "start", 10.5, MUT))
    return SVG(572, yl + 12, o, "ハ長調の音階の各音を根音にして、音階の上を 1 つおきに 2 つの音を取る。"
               "どの段も、根音・3 度の音・5 度の音の 3 つが、音階の音だけでそろう。7 つの段で、7 つの三和音ができる。")
F["e09_build"] = _f09_build()


# 2. 音階の音だけでできた和音と、音階の外の音を含む和音
def _f09_inout():
    o = []
    def panel(x, title, notes, out, ok):
        o.append(T(x + 112, 24, title, "middle", 13, INK, True))
        info = {}
        hl = {}
        for n in notes:
            m = parse(n)["midi"]
            hl[m] = dict(c=ALI if n == out else GRN2, label=nname(n, False), strong=True)
        o.append(KEYBOARD(x, 36, 60, 72, ww=28, wh=96, hl=hl, names=None, info=info))
        for m in range(60, 73):
            if not IS_BLACK[m % 12]:
                o.append(D(info[m][0], 146, MUT, 3))
        if out:
            mo = parse(out)["midi"]
            o.append(T(info[mo][0], 166, "↑ 音階の外", "middle", 11, ALI, True))
        lines = (["3 音ともハ長調の音階の音", "→ ダイアトニックコード"] if ok else
                 ["F♯ はハ長調の音階に無い", "→ ダイアトニックコードではない"])
        col = GRN2 if ok else ALI
        o.append(T(x + 112, 190, lines[0], "middle", 12, INK))
        o.append(T(x + 112, 208, lines[1], "middle", 12.5, col, True))
    panel(20, "D・F・A", ["D4", "F4", "A4"], None, True)
    panel(296, "D・F♯・A", ["D4", "F#4", "A4"], "F#4", False)
    o.append(D(24, 228, MUT, 3))
    o.append(T(32, 232, "＝ ハ長調の音階の音（白鍵の 7 つ）", "start", 10.5, MUT))
    return SVG(540, 242, o, "根音が同じ D でも、D・F・A は 3 つともハ長調の音階の音なのでハ長調のダイアトニックコードだが、"
               "D・F♯・A は F♯ が音階の外の音なので、ハ長調のダイアトニックコードではない。")
F["e09_inout"] = _f09_inout()


# 3. ハ長調の 7 つの和音の半音を数える
def _f09_count():
    o = []
    tri = _f09_tri("C4")
    PW, PH = 138, 152
    for k, c in enumerate(tri):
        col, row = (k, 0) if k < 4 else (k - 4, 1)
        x = 16 + col * PW + (PW / 2 if row == 1 else 0)
        y = 12 + row * PH
        ms = c["ms"]
        hi = ms[2] + 1
        if IS_BLACK[hi % 12]:
            hi += 1
        ww = 18
        kx = x + (PW - kb_width(ms[0], hi, ww)) / 2
        tc = _f09_TC[c["t"]]
        o.append(T(x + PW / 2, y + 14, "第 %d 音の上: %s" % (k + 1, "・".join(nname(n, False) for n in c["notes"])), "middle", 11.5, INK, True))
        info = {}
        hl = {m: dict(c=tc, label=nname(n, False), strong=True) for m, n in zip(ms, c["notes"])}
        o.append(KEYBOARD(kx, y + 22, ms[0], hi, ww=ww, wh=58, hl=hl, names=None, info=info))
        yb = y + 22 + 58 + 12
        for a, b, s in [(ms[0], ms[1], c["lo"]), (ms[1], ms[2], c["hi"])]:
            xa, xb = info[a][0], info[b][0]
            o.append(_f09_bracket(xa + 1.5, xb - 1.5, yb, _f09_QC[s], 2.0, 6))
            o.append(T((xa + xb) / 2, yb + 15, "%d" % s, "middle", 12.5, _f09_QC[s], True))
        o.append(T(x + PW / 2, yb + 38, "%d + %d → %s" % (c["lo"], c["hi"], _f09_TN[c["t"]]), "middle", 11.5, tc, True))
        o.append(T(x + PW / 2, yb + 54, c["name"], "middle", 13, tc, True))
    ly = 12 + 2 * PH + 10
    o.append(W(20, ly - 4, 44, ly - 4, c=BLU, lw=2.4))
    o.append(T(50, ly, "長 3 度（半音 4）", "start", 11, BLU, True))
    o.append(W(170, ly - 4, 194, ly - 4, c=PUR, lw=2.4))
    o.append(T(200, ly, "短 3 度（半音 3）", "start", 11, PUR, True))
    o.append(T(326, ly, "左: 下の 3 度　右: 上の 3 度", "start", 11, MUT))
    return SVG(584, ly + 12, o, "ハ長調の 7 つの和音の、下の 3 度（根音から 3 度の音まで）と上の 3 度（3 度の音から 5 度の音まで）の半音の数。"
               "第 1 音の上から順に、長・短・短・長・長・短・減 の三和音になる。")
F["e09_count"] = _f09_count()


# 4. 長音階の各音の上の 3 度（全・半の位置から）
def _f09_thirds():
    o = []
    sc = spell_scale("C4", MAJOR, 11)
    X0, DX, Y = 86, 48, 62
    o.append(T(14, Y + 5, "第何音か", "start", 11, INK, True))
    o.append(T(14, Y + 33, "ハ長調では", "start", 10.5, MUT))
    o.append(W(X0, Y, X0 + 10 * DX, Y, c=LIN, lw=1.4))
    for i in range(10):
        xm = X0 + (i + 0.5) * DX
        half = MAJOR[i % 7] == 1
        if half:
            o.append(RECT(xm - 13, Y - 41, 26, 21, 5, SSOFT, SIG, 1.2))
        o.append(T(xm, Y - 25, "半" if half else "全", "middle", 13, SIG if half else MUT, half))
    for i in range(11):
        x = X0 + i * DX
        o.append(CIRC(x, Y, 14, INK if i < 7 else MUT, 1.4, PAN))
        o.append(T(x, Y + 5, "%d" % (i % 7 + 1), "middle", 13, INK if i < 7 else MUT, True))
        o.append(T(x, Y + 33, nname(sc[i], False), "middle", 11, MUT))
    for k in range(7):
        yb = Y + 58 + (k % 2) * 56
        xa, xb = X0 + k * DX, X0 + (k + 2) * DX
        s = MAJOR[k % 7] + MAJOR[(k + 1) % 7]
        c = _f09_QC[s]
        o.append(_f09_bracket(xa + 3, xb - 3, yb, c, 2.2, 8))
        stp = "＋".join("全" if MAJOR[(k + j) % 7] == 2 else "半" for j in range(2))
        o.append(T((xa + xb) / 2, yb + 16, stp, "middle", 11, MUT))
        o.append(T((xa + xb) / 2, yb + 32, "%d（%s）" % (s, _f09_QN[s]), "middle", 11.5, c, True))
    o.append(T(14, Y + 58 + 4, "第 1・3・5・7", "start", 10, MUT))
    o.append(T(14, Y + 74, "音の上の 3 度", "start", 10, MUT))
    o.append(T(14, Y + 114 + 4, "第 2・4・6", "start", 10, MUT))
    o.append(T(14, Y + 130, "音の上の 3 度", "start", 10, MUT))
    return SVG(590, Y + 160, o, "長音階の隣どうしの間隔（上）と、各音から 1 つおきの音までの 3 度（下の括弧）。"
               "括弧の中に半が入る 3 度（第 2・3・6・7 音の上）は半音 3 の短 3 度、入らない 3 度（第 1・4・5 音の上）は半音 4 の長 3 度になる。")
F["e09_thirds"] = _f09_thirds()


# 5. ディグリーネームの読み方（VIm を例に）
def _f09_roman():
    o = []
    o.append(T(96, 72, "VI", "end", 44, SIG, True))
    o.append(T(100, 72, "m", "start", 44, PUR, True))
    o.append(ARR(70, 84, 70, 112, SIG, 1.6))
    o.append(ARR(126, 84, 162, 112, PUR, 1.6))
    o.append(RECT(14, 116, 128, 50, 8, SSOFT, SIG, 1.2))
    o.append(T(78, 136, "根音が主音から", "middle", 11.5, INK, True))
    o.append(T(78, 154, "6 度の音（第 6 音）", "middle", 11.5, INK, True))
    o.append(RECT(150, 116, 108, 50, 8, PSOFT, PUR, 1.2))
    o.append(T(204, 136, "種類は", "middle", 11.5, INK, True))
    o.append(T(204, 154, "短三和音", "middle", 11.5, PUR, True))
    X = 296
    o.append(T(X, 30, "VIm を 3 つの長調で", "start", 12, INK, True))
    rows = [("ハ長調（主音 C）", "C4"), ("ト長調（主音 G）", "G4"), ("ヘ長調（主音 F）", "F4")]
    for i, (lab, ton) in enumerate(rows):
        y = 64 + i * 36
        sc = spell_scale(ton, MAJOR, 8)
        o.append(T(X, y, lab, "start", 11.5, INK))
        o.append(T(X + 132, y, "第 6 音 %s" % nname(sc[5], False), "start", 11.5, SIG, True))
        o.append(T(X + 212, y, "→", "start", 11.5, MUT))
        o.append(T(X + 232, y, nname(sc[5], False) + "m", "start", 13, PUR, True))
    o.append(T(14, 196, "長三和音は種類の部分を書かない（例: IV）。減三和音は dim（例: VIIdim）。", "start", 11, MUT))
    return SVG(560, 208, o, "ディグリーネーム VIm の読み方。VI は根音が主音から 6 度の音（第 6 音）であること、"
               "m は短三和音であることを表す。主音が違えば、同じ VIm でもコードネームは変わる。")
F["e09_roman"] = _f09_roman()


# 6. 3 つの長調のダイアトニックコード（五線）とディグリーネーム
def _f09_keys():
    o = []
    s = 9
    LX = 74
    x0 = staff_start(s, 1) + 12
    DXc = 60
    keys = [("ハ長調", "C", "C4"), ("ト長調", "G", "G4"), ("ヘ長調", "F", "F4")]
    ytop = 48
    for name, key, ton in keys:
        tri = _f09_tri(ton)
        items = []
        for k, c in enumerate(tri):
            col = _f09_TC[c["t"]]
            items.append(dict(x=x0 + k * DXc, notes=c["notes"], fill=col))
            o.append(T(LX + x0 + k * DXc, ytop - 3.6 * s, c["name"], "middle", 12.5, col, True))
        o.append(STAFF(LX, ytop, x0 + 6 * DXc + 28, s=s, clef="treble", items=items, key=key))
        o.append(T(LX - 10, ytop + 2 * s + 5, name, "end", 12.5, INK, True))
        ytop += 100
    yr = ytop - 26
    o.append(W(LX, yr - 22, LX + x0 + 6 * DXc + 28, yr - 22, c=LIN, lw=1))
    o.append(T(LX - 10, yr, "共通の", "end", 11, MUT, True))
    o.append(T(LX - 10, yr + 15, "ディグリー", "end", 11, MUT, True))
    o.append(T(LX - 10, yr + 30, "ネーム", "end", 11, MUT, True))
    for k, c in enumerate(_f09_tri("C4")):
        col = _f09_TC[c["t"]]
        r = ["I", "II", "III", "IV", "V", "VI", "VII"][k] + _f09_SUF[c["t"]]
        o.append(T(LX + x0 + k * DXc, yr + 4, r, "middle", 13.5, col, True))
        o.append(T(LX + x0 + k * DXc, yr + 22, _f09_TN[c["t"]], "middle", 10, col))
    return SVG(LX + int(x0) + 6 * DXc + 40, yr + 36, o, "ハ長調・ト長調・ヘ長調のダイアトニックコード（色は和音の種類: 青 = 長三和音、紫 = 短三和音、金 = 減三和音）。"
               "コードネームは調ごとに違うが、第何音の上にどの種類の和音ができるかは同じで、ディグリーネームは 3 つの調で共通になる。")
F["e09_keys"] = _f09_keys()


# 7. 主和音・下属和音・属和音で 7 つの音がそろう
def _f09_primary():
    o = []
    sc = ["C", "D", "E", "F", "G", "A", "B"]
    X0, DX = 196, 46
    rows = [("I", "主和音", [0, 2, 4]), ("IV", "下属和音", [3, 5, 0]), ("V", "属和音", [4, 6, 1])]
    for i, n in enumerate(sc):
        x = X0 + i * DX
        o.append(T(x, 22, "第 %d 音" % (i + 1), "middle", 9.5, MUT))
        o.append(T(x, 40, n, "middle", 13, INK, True))
    for r, (rn, jn, degs) in enumerate(rows):
        y = 72 + r * 44
        o.append(T(14, y + 1, rn, "start", 15, BLU, True))
        o.append(T(46, y + 1, jn, "start", 12, INK, True))
        o.append(T(14, y + 17, "第 %s 音" % "・".join(str(d + 1) for d in degs), "start", 10, MUT))
        o.append(W(X0 - 14, y - 4, X0 + 6 * DX + 14, y - 4, c=LIN, lw=1))
        for d in degs:
            x = X0 + d * DX
            o.append(CIRC(x, y - 4, 12, BLU, 1.4, BLU))
            o.append(T(x, y + 0.5, sc[d], "middle", 12, PAN, True))
    y = 72 + 3 * 44 + 6
    o.append(W(X0 - 14, y - 26, X0 + 6 * DX + 14, y - 26, c=MUT, lw=1.2))
    o.append(T(14, y + 1, "3 つを合わせた音", "start", 12, INK, True))
    for i, n in enumerate(sc):
        x = X0 + i * DX
        o.append(CIRC(x, y - 4, 12, GRN2, 1.4, GSOFT))
        o.append(T(x, y + 0.5, n, "middle", 12, GRN2, True))
    o.append(T(X0 + 3 * DX, y + 30, "音階の 7 つの音がすべてそろう", "middle", 12, GRN2, True))
    return SVG(X0 + 6 * DX + 30, y + 42, o, "ハ長調の I（C・E・G）、IV（F・A・C）、V（G・B・D）に含まれる音。"
               "3 つの和音を合わせると、音階の 7 つの音がすべて現れる。番号で書けば、どの長調でも同じである。")
F["e09_primary"] = _f09_primary()


# 8. イ短調の 7 つの和音は、ハ長調の 7 つと同じ（始まりが違う）
def _f09_relative():
    o = []
    tri = _f09_tri("C4")
    seq = [tri[i % 7] for i in range(12)]
    X0, BW, G = 16, 44, 4
    y = 58
    for i, c in enumerate(seq):
        x = X0 + i * (BW + G)
        o.append(RECT(x, y, BW, 42, 6, _f09_TS[c["t"]], _f09_TC[c["t"]], 1.3))
        o.append(T(x + BW / 2, y + 19, c["name"], "middle", 12, _f09_TC[c["t"]], True))
        o.append(T(x + BW / 2, y + 35, c["t"], "middle", 10.5, _f09_TC[c["t"]]))
    xa, xb = X0, X0 + 7 * (BW + G) - G
    o.append(W(xa, y - 8, xa, y - 16, xb, y - 16, xb, y - 8, c=INK, lw=1.6))
    o.append(T((xa + xb) / 2, y - 24, "ハ長調の 7 つ（第 1 音 C の上から）", "middle", 12, INK, True))
    xa, xb = X0 + 5 * (BW + G), X0 + 12 * (BW + G) - G
    o.append(W(xa, y + 50, xa, y + 58, xb, y + 58, xb, y + 50, c=SIG, lw=1.8))
    o.append(T((xa + xb) / 2, y + 76, "イ短調の 7 つ（第 1 音 A の上から）", "middle", 12, SIG, True))
    return SVG(X0 * 2 + 12 * (BW + G) - G, y + 88, o, "イ短調（自然短音階）の音階はハ長調の音階と同じ 7 つの音なので、7 つの和音も同じものになる。"
               "ハ長調では C から、イ短調では Am から数え始める。種類は、イ短調では 短・減・長・短・短・長・長 と並ぶ。")
F["e09_relative"] = _f09_relative()


# 9. 短調のディグリーネームの ♭（主音の長音階と比べる）
def _f09_flat():
    o = []
    maj = spell_scale("A3", MAJOR, 7)
    nat = spell_scale("A3", NAT_MINOR, 7)
    tri = _f09_tri("A3", NAT_MINOR)
    X0, DX = 178, 56
    for k in range(7):
        x = X0 + k * DX
        o.append(T(x, 20, "第 %d 音" % (k + 1), "middle", 10, MUT))
    rows_y = [48, 104, 150, 186]
    labs = [("主音 A の長音階", "（イ長調の音階）"), ("イ短調の自然短音階", None), ("その上の和音", None), ("ディグリーネーム", None)]
    for (a, b), y in zip(labs, rows_y):
        o.append(T(14, y + (0 if b else 4), a, "start", 11.5, INK, True))
        if b:
            o.append(T(14, y + 15, b, "start", 10, MUT))
    for k in range(7):
        x = X0 + k * DX
        diff = parse(nat[k])["midi"] != parse(maj[k])["midi"]
        o.append(T(x, rows_y[0] + 5, nname(maj[k], False), "middle", 13, INK, True))
        if diff:
            o.append(RECT(x - 21, rows_y[1] - 14, 42, 26, 6, SSOFT, SIG, 1.2))
            o.append(ARR(x, rows_y[0] + 12, x, rows_y[1] - 17, SIG, 1.4))
            o.append(T(x - 5, rows_y[0] + 30, "半音低い", "end", 9.5, SIG))
        o.append(T(x, rows_y[1] + 5, nname(nat[k], False), "middle", 13, SIG if diff else INK, True))
        c = tri[k]
        o.append(T(x, rows_y[2] + 4, c["name"], "middle", 12.5, _f09_TC[c["t"]], True))
        r = roman(c["sym"], "Am")
        o.append(T(x, rows_y[3] + 4, r, "middle", 13, SIG if r.startswith("♭") else _f09_TC[c["t"]], True))
    o.append(W(14, rows_y[1] + 24, X0 + 6 * DX + 28, rows_y[1] + 24, c=LIN, lw=1))
    return SVG(X0 + 6 * DX + 40, rows_y[3] + 18, o, "主音 A の長音階（イ長調の音階）と、イ短調の自然短音階を比べると、第 3・6・7 音が半音低い。"
               "根音がその 3 つ（C・F・G）の和音には、ディグリーネームで ♭ が付く。")
F["e09_flat"] = _f09_flat()


# 10. 和声的短音階で変わる和音（イ短調）
def _f09_harm():
    o = []
    s = 9
    LX = 112
    x0 = staff_start(s, 0) + 14
    DXc = 60
    rows = [("自然短音階", NAT_MINOR), ("和声的短音階", HARM_MINOR)]
    nat = _f09_tri("A3", NAT_MINOR)
    ytop = 40
    for r, (lab, steps) in enumerate(rows):
        tri = _f09_tri("A3", steps)
        items = []
        for k, c in enumerate(tri):
            ch = c["notes"] != nat[k]["notes"]
            x = LX + x0 + k * DXc
            if ch and r == 1:
                o.append(RECT(x - 26, ytop - 30, 52, 4 * s + 80, 8, SSOFT, SIG, 1.2))
            col = _f09_TC[c["t"]]
            fills = {nname(n): (SIG if (r == 1 and n.startswith("G#")) else col) for n in c["notes"]}
            items.append(dict(x=x0 + k * DXc, notes=c["notes"], fill=col, fills=fills))
            o.append(T(x, ytop - 14, c["name"], "middle", 12.5, col, True))
            rr = roman(c["sym"], "Am")
            o.append(T(x, ytop + 4 * s + 40, rr, "middle", 12, col, True))
        o.append(STAFF(LX, ytop, x0 + 6 * DXc + 30, s=s, clef="treble", items=items, key=0))
        o.append(T(LX - 10, ytop + 2 * s + 5, lab, "end", 12, INK, True))
        if r == 0:
            o.append(T(LX - 10, ytop + 2 * s + 21, "（G）", "end", 10.5, MUT))
        else:
            o.append(T(LX - 10, ytop + 2 * s + 21, "（G → G♯）", "end", 10.5, SIG, True))
        ytop += 4 * s + 86
    return SVG(LX + int(x0) + 6 * DXc + 44, ytop - 30, o, "イ短調の自然短音階と和声的短音階の上の 7 つの和音。第 7 音 G を G♯ にすると、"
               "G を含む第 3・5・7 音の上の和音（枠）だけが変わる。Vm は V に、♭VII は VIIdim に、♭III は ♭IIIaug になる。")
F["e09_harm"] = _f09_harm()


# 11. 共通音の数の比較（I と VIm、I と V、I と IIm）
def _f09_share():
    o = []
    tri = _f09_tri("C4")
    pairs = [(0, 5), (0, 4), (0, 1)]
    CW = 186
    for p, (a, b) in enumerate(pairs):
        x = 18 + p * CW
        A, B = tri[a], tri[b]
        ra = ["I", "II", "III", "IV", "V", "VI", "VII"][a] + _f09_SUF[A["t"]]
        rb = ["I", "II", "III", "IV", "V", "VI", "VII"][b] + _f09_SUF[B["t"]]
        pa = set(m % 12 for m in A["ms"])
        pb = set(m % 12 for m in B["ms"])
        com = pa & pb
        o.append(T(x + 94, 22, "%s と %s" % (ra, rb), "middle", 13, INK, True))
        o.append(T(x + 94, 39, "（%s と %s）" % (A["name"], B["name"]), "middle", 11, MUT))
        infos = []
        for r, (C_, lab) in enumerate([(A, ra), (B, rb)]):
            y = 52 + r * 92
            info = {}
            hl = {}
            for m, n in zip(C_["ms"], C_["notes"]):
                mm = 60 + m % 12
                hl[mm] = dict(c=GRN2 if (m % 12) in com else _f09_TC[C_["t"]], label=nname(n, False), strong=True)
            o.append(KEYBOARD(x + 32, y, 60, 71, ww=22, wh=62, hl=hl, names=None, info=info))
            o.append(T(x + 26, y + 36, lab, "end", 12, _f09_TC[C_["t"]], True))
            infos.append(info)
        for pc in sorted(com):
            m = 60 + pc
            o.append(W(infos[0][m][0], 52 + 62 + 2, infos[1][m][0], 52 + 92 - 2, c=GRN2, lw=1.8, dash="4,3"))
        names = [nname(n, False) for m, n in zip(A["ms"], A["notes"]) if m % 12 in com]
        if com:
            o.append(T(x + 94, 228, "共通音 %d つ（%s）" % (len(com), "・".join(names)), "middle", 12.5, GRN2, True))
        else:
            o.append(T(x + 94, 228, "共通音なし", "middle", 12.5, MUT, True))
    return SVG(18 * 2 + 3 * CW - 8, 240, o, "ハ長調の I（C・E・G）と、VIm・V・IIm の共通音（緑）。I と VIm は 2 つ、I と V は 1 つの音を共有し、"
               "I と IIm には共通音が無い。")
F["e09_share"] = _f09_share()


# 12. 3 度の連なりと、続いた 3 つの音としての和音
def _f09_chain():
    o = []
    sc = spell_scale("C4", MAJOR, 8)
    chain_deg = [0, 2, 4, 6, 1, 3, 5, 0, 2, 4]
    X0, DX, Y = 112, 46, 50
    o.append(T(14, Y + 1, "3 度の連なり", "start", 12, INK, True))
    o.append(T(14, Y + 16, "（隣は 3 度）", "start", 10, MUT))
    o.append(T(14, Y - 26, "第何音か", "start", 10, MUT))
    o.append(W(X0, Y, X0 + 9 * DX, Y, c=LIN, lw=1.4))
    for i, d in enumerate(chain_deg):
        x = X0 + i * DX
        o.append(CIRC(x, Y, 15, INK if i < 7 else MUT, 1.4, PAN))
        o.append(T(x, Y + 5, nname(sc[d], False), "middle", 13, INK if i < 7 else MUT, True))
        o.append(T(x, Y - 26, "%d" % (d + 1), "middle", 10, MUT))
    tri = _f09_tri("C4")
    ROM = ["I", "II", "III", "IV", "V", "VI", "VII"]
    for r in range(8):
        d = chain_deg[r]
        c = tri[d]
        y = Y + 40 + r * 25
        xa, xb = X0 + r * DX - 16, X0 + (r + 2) * DX + 16
        o.append(RECT(xa, y - 9, xb - xa, 18, 9, _f09_TS[c["t"]], _f09_TC[c["t"]], 1.4, "5,3" if r == 7 else None))
        for j in range(3):
            o.append(D(X0 + (r + j) * DX, y, _f09_TC[c["t"]], 3.2))
        o.append(T(xa - 8, y + 4.5, ROM[d] + _f09_SUF[c["t"]], "end", 12, _f09_TC[c["t"]], True))
        o.append(T(xb + 8, y + 4.5, "・".join(nname(n, False) for n in c["notes"]), "start", 10.5, MUT))
    yb = Y + 40 + 7 * 25
    o.append(T(14, yb + 30, "続いた 3 つが 1 つの和音。根音が連なりの上で 1 つ進むと、和音も 1 つずれる。", "start", 10.5, MUT))
    o.append(T(14, yb + 46, "最後の段（破線）は、7 つ進んで I に戻ったもの。", "start", 10.5, MUT))
    return SVG(X0 + 9 * DX + 90, yb + 58, o, "ハ長調の音階の音を 3 度ずつ並べた「3 度の連なり」と、その上の 7 つの和音。"
               "隣の段どうし（ずれ 1）は 2 つ、2 段離れた段どうし（ずれ 2）は 1 つの音が重なり、3 段離れると重ならない。")
F["e09_chain"] = _f09_chain()


# 13. 7 つの和音を 3 度の連なりの順に円に並べる（隣どうしは 2 音を共有）
def _f09_ring():
    o = []
    tri = _f09_tri("C4")
    ROM = ["I", "II", "III", "IV", "V", "VI", "VII"]
    order = [0, 2, 4, 6, 1, 3, 5]
    cx, cy, R, r = 230, 214, 138, 31
    pos = []
    for j, d in enumerate(order):
        a = math.radians(-90 + j * 360 / 7)
        pos.append((cx + R * math.cos(a), cy + R * math.sin(a), a))
    for j in range(7):
        (x1, y1, a1), (x2, y2, a2) = pos[j], pos[(j + 1) % 7]
        L = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        o.append(W(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, c=GRN2, lw=2.4))
        A, B = tri[order[j]], tri[order[(j + 1) % 7]]
        com = [nname(n, False) for n in A["notes"] if any(parse(n)["midi"] % 12 == m % 12 for m in B["ms"])]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        nx, ny = mx - cx, my - cy
        nl = math.hypot(nx, ny)
        lx, ly = mx + nx / nl * 20, my + ny / nl * 20
        o.append(T(lx, ly + 4.5, "・".join(com), "middle", 12, GRN2, True))
    names = {0: "主和音", 3: "下属和音", 4: "属和音"}
    for j, d in enumerate(order):
        x, y, a = pos[j]
        c = tri[d]
        main = d in names
        o.append(CIRC(x, y, r, _f09_TC[c["t"]], 2.8 if main else 1.5, _f09_TS[c["t"]]))
        o.append(T(x, y - 1, ROM[d] + _f09_SUF[c["t"]], "middle", 13.5 if len(ROM[d] + _f09_SUF[c["t"]]) < 5 else 11.5, _f09_TC[c["t"]], True))
        o.append(T(x, y + 15, c["name"], "middle", 11, INK))
        if main:
            lx, ly = cx + (R + r + 24) * math.cos(a), cy + (R + r + 24) * math.sin(a)
            o.append(T(lx, ly + 4, names[d], "middle", 11.5, INK, True))
    o.append(T(cx, cy - 4, "時計回りに", "middle", 10.5, MUT))
    o.append(T(cx, cy + 12, "3 度の連なりの順", "middle", 10.5, MUT))
    return SVG(460, 420, o, "ハ長調の 7 つの和音を 3 度の連なりの順に円に並べた。隣どうしの和音は、線の横に書いた 2 つの音を共有する（緑）。"
               "I・IV・V は、それぞれ両隣の 2 つの和音と 2 音ずつを共有している。")
F["e09_ring"] = _f09_ring()
