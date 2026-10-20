# 07 章 調と五度圏 の図（figures.py の関数・定数をそのまま使う）

_f07_JP = dict(C="ハ", D="ニ", E="ホ", F="ヘ", G="ト", A="イ", B="ロ")
_f07_MAJ = {-7: "Cb", -6: "Gb", -5: "Db", -4: "Ab", -3: "Eb", -2: "Bb", -1: "F", 0: "C",
            1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#"}
_f07_MIN = {-7: "Ab", -6: "Eb", -5: "Bb", -4: "F", -3: "C", -2: "G", -1: "D", 0: "A",
            1: "E", 2: "B", 3: "F#", 4: "C#", 5: "G#", 6: "D#", 7: "A#"}


def _f07_pt(t):
    """'F#' → 'F♯'、'Bb' → 'B♭'"""
    return t[0] + t[1:].replace("#", "♯").replace("b", "♭")


def _f07_jp(t, minor=False):
    return {"": "", "#": "嬰", "b": "変"}[t[1:]] + _f07_JP[t[0]] + ("短調" if minor else "長調")


def _f07_en(t, minor=False):
    return _f07_pt(t) + (" マイナー" if minor else " メジャー")


def _f07_sig(n):
    return "調号なし" if n == 0 else ("♯" if n > 0 else "♭") + " %d つ" % abs(n)


def _f07_ks(x, ytop, s, clef, n, fill=INK, hl=(), hlc=SIG):
    """調号（KEYSIG と同じ位置）。hl に含まれる番号（左から 0, 1, …）の記号だけ hlc で塗る"""
    if n == 0:
        return ""
    sg = 1 if n > 0 else -1
    o = []
    for i, pp in enumerate(_KS_POS[(clef, sg)][:abs(n)]):
        yn = ytop + 4 * s - pp * s / 2
        o.append(ACC(sg, x + 4.0 * s + i * 1.05 * s + 0.9 * s, yn, s, hlc if i in hl else fill))
    return "".join(o)


def _f07_ksx(x, s, i):
    """調号の左から i 番目の記号の中心の x"""
    return x + 4.0 * s + i * 1.05 * s + 0.45 * s


def _f07_ksy(ytop, s, clef, sg, i):
    return ytop + 4 * s - _KS_POS[(clef, sg)][i] * s / 2


def _f07_arcs(o, info, ms, y, labels, cols, h=11):
    """鍵盤の上で、隣り合う音のあいだに「全」「半」の弧を描く"""
    for k in range(len(ms) - 1):
        xa, xb = info[ms[k]][0], info[ms[k + 1]][0]
        c = cols[k]
        o.append(PL([(xa + 3, y), ((xa + xb) / 2, y - h), (xb - 3, y)], c, 1.6))
        o.append(T((xa + xb) / 2, y - h - 4, labels[k], "middle", 11, c, True))


def _f07_wedge(cx, cy, r1, r2, a1, a2, fill, c="none", lw=0):
    """中心 (cx, cy) の扇形の帯（半径 r1〜r2、角度 a1〜a2 度、時計回り）"""
    def P(r, a):
        t = math.radians(a)
        return cx + r * math.cos(t), cy + r * math.sin(t)
    x1, y1 = P(r2, a1); x2, y2 = P(r2, a2); x3, y3 = P(r1, a2); x4, y4 = P(r1, a1)
    lg = 1 if (a2 - a1) % 360 > 180 else 0
    d = "M%.1f,%.1f A%g,%g 0 %d 1 %.1f,%.1f L%.1f,%.1f A%g,%g 0 %d 0 %.1f,%.1f Z" % (
        x1, y1, r2, r2, lg, x2, y2, x3, y3, r1, r1, lg, x4, y4)
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%g"/>' % (d, fill, c, lw)


def _f07_arc(cx, cy, r, a1, a2, c, lw, dash=None):
    """円弧（角度 a1 から a2 へ時計回り）"""
    t1, t2 = math.radians(a1), math.radians(a2)
    x1, y1 = cx + r * math.cos(t1), cy + r * math.sin(t1)
    x2, y2 = cx + r * math.cos(t2), cy + r * math.sin(t2)
    lg = 1 if (a2 - a1) % 360 > 180 else 0
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<path d="M%.1f,%.1f A%g,%g 0 %d 1 %.1f,%.1f" fill="none" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round"%s/>' % (x1, y1, r, r, lg, x2, y2, c, lw, da))


def _f07_dsharp(x, yn, s, fill):
    """ダブルシャープ（𝄪）を、右端 x・高さ yn に描く"""
    a = 0.3 * s
    cx = x - a - 0.05 * s
    o = [W(cx - a, yn - a, cx + a, yn + a, c=fill, lw=0.22 * s), W(cx - a, yn + a, cx + a, yn - a, c=fill, lw=0.22 * s)]
    for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        px, py = cx + dx * a, yn + dy * a
        o.append('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (px - 0.14 * s, py - 0.14 * s, 0.28 * s, 0.28 * s, fill))
    return "".join(o)


# ---------- 1 節: 調 = 主音 + 音階の種類 ----------
def _f07_key():
    o = []
    rows = [("C", False), ("C", True), ("A", True), ("G", False)]
    y0, rh = 34, 60
    for x, t in ((52, "主音"), (140, "音階の種類"), (312, "使う 7 音（鍵盤）"), (487, "音名"), (618, "調")):
        o.append(T(x, 20, t, "middle", 11, MUT, True))
    for r, (t, minor) in enumerate(rows):
        y = y0 + r * rh
        col = PUR if minor else BLU
        soft = PSOFT if minor else BSOFT
        o.append(RECT(22, y + 6, 60, 36, 8, SSOFT, SIG, 1.4))
        o.append(T(52, y + 30, _f07_pt(t), "middle", 16, SIG, True))
        o.append(T(92, y + 29, "+", "middle", 15, MUT, True))
        o.append(RECT(102, y + 6, 76, 36, 8, soft, col, 1.4))
        o.append(T(140, y + 29, "短音階" if minor else "長音階", "middle", 12.5, col, True))
        o.append(ARR(184, y + 24, 208, y + 24, MUT, 1.4))
        sc = spell_scale(t + "4", NAT_MINOR if minor else MAJOR, 7)
        hl = {}
        for i, nm in enumerate(sc):
            hl[parse(nm)["midi"]] = dict(c=SIG if i == 0 else col, label="", strong=(i == 0))
        o.append(KEYBOARD(214, y + 3, 60, 83, ww=14, wh=42, hl=hl, names=None))
        for i, nm in enumerate(sc):
            o.append(T(424 + i * 21, y + 30, nname(nm, False), "middle", 12, SIG if i == 0 else INK, i == 0))
        o.append(T(618, y + 24, _f07_jp(t, minor), "middle", 14, col, True))
        o.append(T(618, y + 41, "（%s）" % _f07_en(t, minor), "middle", 10.5, MUT))
    return SVG(680, y0 + 4 * rh + 4, o,
               "調は、主音と音階の種類（長音階か短音階か）の組である。主音が同じでも音階の種類が違えば使う 7 音が違い（ハ長調とハ短調）、"
               "使う 7 音が同じでも主音が違えば別の調になる（ハ長調とイ短調）。主音を赤、そのほかの音を長調は青、短調は紫で示した。短調の 7 音は自然短音階で示している。")
F["e07_key"] = _f07_key()


# ---------- 2 節: 臨時記号だけで書く（悪い例）と、調号を使う（良い例） ----------
def _f07_sigvsacc():
    o = []
    s = 9
    mel = ["D4", "F#4", "A4", "D5", "F#5", "E5", "C#5", "A4", "F#4", "E4", "C#4", "D4"]
    x0, W_ = 20, 522

    def row(y, key, col, title):
        o.append(T(x0, y - 22, title, "start", 12.5, INK, True))
        st = staff_start(s, key) + 6
        items = []
        for i, n in enumerate(mel):
            items.append(dict(x=st + i * 37, notes=[n], dur="half" if i == len(mel) - 1 else "quarter",
                              fill=col if "#" in n else INK))
        o.append(STAFF(x0, y, W_, s, "treble", items, key=key))
        if key:
            o.append(_f07_ks(x0, y, s, "treble", key, col))

    row(46, 0, ALI, "① 臨時記号だけで書く")
    row(166, 2, GRN2, "② 調号を使って書く")
    ax = x0 + W_ + 22
    o.append(T(ax, 70, "✕ ♯ を 5 か所に書く", "start", 12, ALI, True))
    o.append(T(ax, 88, "（F と C の音符ごと）", "start", 10.5, MUT))
    o.append(T(ax, 190, "○ ♯ は最初に 2 つ", "start", 12, GRN2, True))
    o.append(T(ax, 208, "（F と C の位置に 1 回）", "start", 10.5, MUT))
    return SVG(712, 232, o,
               "同じニ長調の旋律を 2 通りに書いた。①は F と C の音符に、臨時記号の ♯ を付けている（赤）。"
               "②は最初に調号として ♯ を 2 つ（F と C の位置に）書いたので、音符には ♯ を付けなくてよい（緑）。鳴る音は同じである。")
F["e07_sigvsacc"] = _f07_sigvsacc()


# ---------- 2 節: 調号はどの高さの同じ文字にも効く ----------
def _f07_sigscope():
    o = []
    s = 9
    x0, yt = 24, 30
    st = staff_start(s, 1) + 10
    notes = [("F#2", "bass"), ("F#3", "bass"), ("F#4", "treble"), ("F#5", "treble")]
    items = []
    for i, (n, stf) in enumerate(notes):
        items.append(dict(x=st + i * 46, notes=[n], fill=SIG, staff=stf, label=nname(n), lcol=SIG))
    items.append(dict(x=st + 4 * 46 + 34, notes=["F4"], fill=BLU, staff="treble", label="F4", lcol=BLU))
    W_ = st + 4 * 46 + 74
    o.append(STAFF(x0, yt, W_, s, "grand", items, key=1))
    o.append(_f07_ks(x0, yt, s, "treble", 1, SIG))
    o.append(_f07_ks(x0, yt + 8 * s, s, "bass", 1, SIG))
    tx = x0 + W_ + 26
    lines = [("ト長調の調号: ♯ 1 つ（F）", INK, True, 12),
             ("ト音記号では第 5 線（F5 の位置）、", MUT, False, 11),
             ("ヘ音記号では第 4 線（F3 の位置）に書く", MUT, False, 11),
             ("→ どの高さの F も F♯ になる（赤）", SIG, True, 11.5),
             ("臨時記号の ♮ を付けた F4 だけは", BLU, True, 11.5),
             ("F に戻る（青）", BLU, True, 11.5)]
    for i, (t, c, b, z) in enumerate(lines):
        o.append(T(tx, yt + 10 + i * 21 + (8 if i >= 3 else 0) + (8 if i >= 4 else 0), t, "start", z, c, b))
    info = {}
    lo, hi, ww, wh = 41, 79, 16, 58
    kx = (700 - kb_width(lo, hi, ww)) / 2
    ky = yt + 12 * s + 58
    hl = {m: dict(c=SIG, label="", strong=True) for m in (42, 54, 66, 78)}
    hl[65] = dict(c=BLU, label="", strong=True)
    o.append(KEYBOARD(kx, ky, lo, hi, ww, wh, hl=hl, names="c", info=info))
    for m in (42, 54, 66, 78):
        o.append(T(info[m][0], ky + wh + 16, nname(m), "middle", 10.5, SIG, True))
    o.append(T(info[65][0], ky - 7, "F4", "middle", 10.5, BLU, True))
    return SVG(700, ky + wh + 26, o,
               "ト長調の調号（♯ 1 つ）は、ト音記号の五線では F5 の位置、ヘ音記号の五線では F3 の位置に書くが、"
               "どの高さ（オクターブ）の F にも効く。ある音符だけ元に戻すときは、その音符に臨時記号の ♮ を付ける。")
F["e07_sigscope"] = _f07_sigscope()


# ---------- 2 節: 短調の調号は自然短音階に合わせる ----------
def _f07_minorsig():
    o = []
    s = 10
    x0, yt = 20, 42
    st = staff_start(s, 0) + 12
    groups = [("自然短音階", ["E4", "F4", "G4", "A4"], set()),
              ("和声的短音階", ["E4", "F4", "G#4", "A4"], {"G#4"}),
              ("旋律的短音階（上行）", ["E4", "F#4", "G#4", "A4"], {"F#4", "G#4"})]
    items, cen = [], []
    x = st
    for title, ns, up in groups:
        xs = []
        for n in ns:
            items.append(dict(x=x, notes=[n], fill=SIG if n in up else INK))
            xs.append(x)
            x += 38
        cen.append(((xs[0] + xs[-1]) / 2, title, len(up)))
        x += 46
    W_ = x - 24
    o.append(STAFF(x0, yt, W_, s, "treble", items))
    o.append(T(x0, yt - 20, "イ短調（調号なし）の第 5 音〜第 8 音", "start", 12, INK, True))
    for cx, title, k in cen:
        o.append(T(x0 + cx, yt + 4 * s + 30, title, "middle", 11.5, INK, True))
        o.append(T(x0 + cx, yt + 4 * s + 48, "臨時記号なし" if k == 0 else "上げた音に臨時記号の ♯", "middle", 10.5, SIG if k else MUT))
    return SVG(x0 + W_ + 20, yt + 4 * s + 60, o,
               "イ短調の調号は、自然短音階（A B C D E F G）に合わせるので無い。和声的短音階・旋律的短音階で上げる第 6 音・第 7 音（F♯・G♯、赤）は、"
               "調号には入れず、そのつど臨時記号で書く。")
F["e07_minorsig"] = _f07_minorsig()


# ---------- 3 節: テトラコルドをずらすと F が F♯ になる ----------
def _f07_tetra():
    o = []
    lo, hi = 60, 79
    ww, wh = 44, 62
    x0 = 112
    y1, y2 = 66, 252
    i1, i2 = {}, {}
    low1, up1 = [60, 62, 64, 65], [67, 69, 71, 72]
    low2, up2 = [67, 69, 71, 72], [74, 76, 78, 79]
    hl1 = {m: dict(c=BLU, label=nname(m, False)) for m in low1}
    hl1.update({m: dict(c=GRN2, label=nname(m, False)) for m in up1})
    hl2 = {m: dict(c=GRN2, label=nname(m, False)) for m in low2}
    hl2.update({m: dict(c=GLD, label=nname(m, False)) for m in up2})
    hl2[78] = dict(c=SIG, label="F♯", strong=True)
    hl2[77] = dict(c=ALI, label="F")
    o.append(KEYBOARD(x0, y1, lo, hi, ww, wh, hl=hl1, names=None, info=i1))
    o.append(KEYBOARD(x0, y2, lo, hi, ww, wh, hl=hl2, names=None, info=i2))
    o.append(T(20, y1 + 30, "ハ長調", "start", 14, INK, True))
    o.append(T(20, y1 + 48, "（C メジャー）", "start", 10, MUT))
    o.append(T(20, y2 + 30, "ト長調", "start", 14, INK, True))
    o.append(T(20, y2 + 48, "（G メジャー）", "start", 10, MUT))
    # ハ長調の全・半
    _f07_arcs(o, i1, low1, y1 - 4, ["全", "全", "半"], [MUT, MUT, ALI])
    _f07_arcs(o, i1, up1, y1 - 4, ["全", "全", "半"], [MUT, MUT, ALI])
    _f07_arcs(o, i1, [65, 67], y1 - 4, ["全"], [MUT])
    for ms, lab, c in ((low1, "下のテトラコルド", BLU), (up1, "上のテトラコルド", GRN2)):
        xa, xb = i1[ms[0]][0] - 16, i1[ms[-1]][0] + 16
        o.append(T((xa + xb) / 2, y1 - 34, lab, "middle", 11.5, c, True))
    # 同じ 4 音を縦の破線で結ぶ
    for m in up1:
        o.append(W(i1[m][0], y1 + wh + 6, i1[m][0], y2 - 44, c=GRN2, lw=1.4, dash="4,4"))
    mx = (i1[67][0] + i1[72][0]) / 2
    o.append(RECT(mx - 36, y1 + wh + 26, 72, 20, 4, SCR, "none", 0))
    o.append(T(mx, y1 + wh + 40, "同じ 4 音", "middle", 11.5, GRN2, True))
    # ト長調の全・半
    _f07_arcs(o, i2, low2, y2 - 4, ["全", "全", "半"], [MUT, MUT, ALI])
    _f07_arcs(o, i2, [72, 74], y2 - 4, ["全"], [MUT])
    _f07_arcs(o, i2, up2, y2 - 4, ["全", "全", "半"], [MUT, SIG, SIG])
    xa, xb = i2[74][0] - 10, i2[79][0] + 10
    o.append(T(xb + 8, y2 - 34, "上のテトラコルド", "end", 11.5, GLD, True))
    # 説明
    o.append(T(i2[76][0] - 14, y2 + wh + 22, "E–F は半音しかないので、F を半音上げて F♯ にする", "middle", 11.5, SIG, True))
    return SVG(712, y2 + wh + 34, o,
               "ハ長調の上のテトラコルド（G A B C）を、下のテトラコルドとして使う長音階を作る。上のテトラコルドを D から全・全・半で作ると、"
               "E の全音上は F ではなく F♯ になる。こうしてできたト長調の音階は、ハ長調の音階と F → F♯ の 1 音だけが違う。")
F["e07_tetra"] = _f07_tetra()


# ---------- 3 節: 5 度上・5 度下へ続けて移る ----------
def _f07_chain(sign):
    o = []
    s = 7
    cw, ch = 172, 128
    keys = list(range(0, 8)) if sign > 0 else list(range(0, -8, -1))
    for i, n in enumerate(keys):
        c, r = i % 4, i // 4
        cx, cy = 8 + c * cw, 12 + r * ch
        t = _f07_MAJ[n]
        o.append(RECT(cx, cy, cw - 26, ch - 14, 8, PAN, SIG if n != 0 else LIN, 1.2))
        o.append(T(cx + 10, cy + 20, _f07_jp(t), "start", 13, INK, True))
        o.append(T(cx + cw - 34, cy + 20, ("n = %+d" % n) if n else "n = 0", "end", 10.5, MUT))
        ytop = cy + 36
        o.append(STAFF(cx + 8, ytop, cw - 44, s, "treble", [], key=n))
        if n:
            o.append(_f07_ks(cx + 8, ytop, s, "treble", n, INK, hl=(abs(n) - 1,)))
            L = (SHARP_ORDER if sign > 0 else FLAT_ORDER)[abs(n) - 1]
            a = "♯" if sign > 0 else "♭"
            deg = "第 7 音" if sign > 0 else "第 4 音"
            o.append(T(cx + 10, ytop + 4 * s + 26, "増えた %s: %s%s" % (a, L, a), "start", 11.5, SIG, True))
            o.append(T(cx + 10, ytop + 4 * s + 43, "（%sの%s）" % (_f07_jp(t), deg), "start", 10.5, MUT))
        else:
            o.append(T(cx + 10, ytop + 4 * s + 26, "調号なし", "start", 11.5, MUT, True))
        if c < 3 and i < 7:
            ax = cx + cw - 24
            o.append(ARR(ax, cy + ch / 2 - 8, ax + 20, cy + ch / 2 - 8, MUT, 1.5))
            o.append(T(ax + 10, cy + ch / 2 + 8, "5 度上" if sign > 0 else "5 度下", "middle", 9.5, MUT))
    yb = 12 + 2 * ch + 8
    order = SHARP_ORDER if sign > 0 else FLAT_ORDER
    a = "♯" if sign > 0 else "♭"
    o.append(T(14, yb, "増えた %s を順に並べると:" % a, "start", 12, INK, True))
    for k, L in enumerate(order):
        x = 196 + k * 50
        o.append(T(x, yb, L + a, "middle", 14, SIG, True))
        if k < 6:
            o.append(T(x + 25, yb - 1, "→", "middle", 11, MUT))
    o.append(T(196 + 7 * 50 - 6, yb, "（5 度ずつ%s）" % ("上がる" if sign > 0 else "下がる"), "start", 11, MUT))
    return o, yb + 14


def _f07_sharps():
    o, h = _f07_chain(1)
    return SVG(690, h, o, "ハ長調から 5 度上の調へ 7 回続けて移る。調号の数 n が 1 ずつ増え、増える ♯（赤）は毎回、新しい調の第 7 音（導音）である。"
               "増える ♯ は F C G D A E B の順に、5 度ずつ上がっていく。")
F["e07_sharps"] = _f07_sharps()


def _f07_flats():
    o, h = _f07_chain(-1)
    return SVG(690, h, o, "ハ長調から 5 度下の調へ 7 回続けて移る。調号の数 n が 1 ずつ減り、増える ♭（赤）は毎回、新しい調の第 4 音（下属音）である。"
               "増える ♭ は B E A D G C F の順に、5 度ずつ下がっていく。")
F["e07_flats"] = _f07_flats()


# ---------- 3 節: 調号を書く位置（ト音記号・ヘ音記号） ----------
def _f07_sigpos():
    o = []
    s = 12
    cells = [("ト音記号の ♯（7 つ）", "treble", 7, 20, 34), ("ヘ音記号の ♯（7 つ）", "bass", 7, 366, 34),
             ("ト音記号の ♭（7 つ）", "treble", -7, 20, 178), ("ヘ音記号の ♭（7 つ）", "bass", -7, 366, 178)]
    for title, clef, n, x, y in cells:
        o.append(T(x, y - 12, title, "start", 12, INK, True))
        ytop = y + 14
        o.append(STAFF(x, ytop, 168, s, clef, [], key=n))
        sg = 1 if n > 0 else -1
        order = SHARP_ORDER if n > 0 else FLAT_ORDER
        for i in range(7):
            cx = _f07_ksx(x, s, i)
            o.append(T(cx, ytop + 4 * s + 22, order[i], "middle", 12, BLU, True))
            o.append(T(cx, ytop - 12, str(i + 1), "middle", 9.5, MUT))
    o.append(T(20, 324, "調号が ♯ 3 つの調なら左の 3 つ（F C G）、♭ 2 つの調なら左の 2 つ（B E）だけを書く。", "start", 11, MUT))
    return SVG(560, 336, o,
               "調号の ♯ は ♯ の順（F C G D A E B）に、♭ は ♭ の順（B E A D G C F）に、左から書く。上の小さな数字は書く順、"
               "下の青い文字はその記号が効く音名である。ヘ音記号では、ト音記号と同じ形が、線と線の間隔 1 つ分だけ下にずれる。")
F["e07_sigpos"] = _f07_sigpos()


# ---------- 3 節: 調号から長調の主音を読む ----------
def _f07_readkey():
    o = []
    s = 9
    ex = [(3, "いちばん右の ♯ は G♯（第 7 音）", "その半音上の A が主音", "A", "イ長調（A メジャー）"),
          (-3, "いちばん右の ♭ は A♭（第 4 音）", "その 5 度上の E♭ が主音", "Eb", "変ホ長調（E♭ メジャー）"),
          (-1, "いちばん右の ♭ は B♭（第 4 音）", "その 5 度上の F が主音", "F", "ヘ長調（F メジャー）")]
    for k, (n, l1, l2, t, nm) in enumerate(ex):
        x = 12 + k * 232
        o.append(RECT(x, 10, 220, 200, 10, PAN, LIN, 1.2))
        o.append(T(x + 12, 32, ("♯ %d つ" if n > 0 else "♭ %d つ") % abs(n), "start", 12.5, INK, True))
        ytop = 56
        o.append(STAFF(x + 14, ytop, 120, s, "treble", [], key=n))
        sg = 1 if n > 0 else -1
        i = abs(n) - 1
        o.append(_f07_ks(x + 14, ytop, s, "treble", n, INK, hl=(i,)))
        ax, ay = _f07_ksx(x + 14, s, i), _f07_ksy(ytop, s, "treble", sg, i)
        o.append(CIRC(ax, ay, 0.95 * s, SIG, 1.4))
        o.append(T(x + 12, 128, "① " + l1, "start", 10.5, INK))
        o.append(T(x + 12, 150, "② " + l2, "start", 10.5, INK))
        o.append(T(x + 12, 182, "→ " + nm, "start", 12, SIG, True))
    return SVG(712, 218, o,
               "調号から長調の主音を読む手順。♯ の調号では、いちばん右の ♯ が第 7 音なので、その半音上が主音である。"
               "♭ の調号では、いちばん右の ♭ が第 4 音なので、その 5 度上（♭ が 2 つ以上なら右から 2 番目の ♭）が主音である。")
F["e07_readkey"] = _f07_readkey()


# ---------- 4 節: 5 度ずつ 12 回で元に戻る ----------
def _f07_twelve():
    o = []
    r = 100
    for side, (cx, cy) in enumerate(((176, 178), (528, 178))):
        fifths = side == 1
        pos = (lambda pc: (7 * pc) % 12) if fifths else (lambda pc: pc)
        pts = {}
        for pc in range(12):
            a = math.radians(-90 + 30 * pos(pc))
            pts[pc] = (cx + r * math.cos(a), cy + r * math.sin(a), a)
        o.append(CIRC(cx, cy, r, LIN, 1.2))
        path = [(7 * k) % 12 for k in range(13)]
        o.append(PL([pts[pc][:2] for pc in path], SIG, 1.8))
        for k in range(12):
            pc = (7 * k) % 12
            px, py, a = pts[pc]
            o.append(CIRC(px, py, 6, SIG, 1.4, SSOFT if k else SIG))
            o.append(T(cx + (r + 20) * math.cos(a), cy + (r + 20) * math.sin(a) + 4.5, NAMES_SHARP[pc], "middle", 12.5, INK, True))
            o.append(T(cx + (r - 20) * math.cos(a), cy + (r - 20) * math.sin(a) + 4, str(k), "middle", 10, BLU, True))
        o.append(T(cx, 26, "半音の順に並べた 12 の音名" if not fifths else "5 度の順に並べ直す（五度圏の並び）", "middle", 12.5, INK, True))
    o.append(ARR(318, 178, 384, 178, MUT, 1.8))
    o.append(T(351, 168, "並べ直す", "middle", 10.5, MUT))
    o.append(T(352, 330, "青い数字: C から 5 度ずつ上がった回数 k（12 回目に C に戻る）", "middle", 11, BLU))
    return SVG(704, 342, o,
               "C から 5 度ずつ上がって通る音を、赤い線で順に結んだ。半音の順に並べた円（左）では、線は円の中を行き来する星の形になり、"
               "12 の音名を 1 回ずつ通って C に戻る。通る順に並べ直すと（右）、線は円周を 1 周する。")
F["e07_twelve"] = _f07_twelve()


# ---------- 4 節: 五度圏 ----------
def _f07_circle():
    o = []
    W_, H_ = 600, 620
    cx, cy = 300, 322
    R4, R3, R2, R1 = 266, 210, 158, 96
    for k in (5, 6, 7):
        o.append(_f07_wedge(cx, cy, R1, R4, -90 + 30 * k - 15, -90 + 30 * k + 15, GOSOFT))
    for rr in (R4, R3, R2, R1):
        o.append(CIRC(cx, cy, rr, LIN, 1.2))
    for k in range(12):
        a = math.radians(-90 + 30 * k + 15)
        o.append(W(cx + R1 * math.cos(a), cy + R1 * math.sin(a), cx + R4 * math.cos(a), cy + R4 * math.sin(a), c=LIN, lw=1))
    for k in range(12):
        a = math.radians(-90 + 30 * k)
        ns = [n for n in range(-7, 8) if n % 12 == k]
        ns.sort(key=lambda n: -n)
        def put(rad, texts, sz, col, bold=True, gap=None):
            gap = gap or sz + 3
            px, py = cx + rad * math.cos(a), cy + rad * math.sin(a)
            y0 = py - (len(texts) - 1) * gap / 2 + sz * 0.36
            for j, tt in enumerate(texts):
                o.append(T(px, y0 + j * gap, tt, "middle", sz, col, bold))
        dbl = len(ns) > 1
        put((R4 + R3) / 2, [_f07_jp(_f07_MAJ[n]) for n in ns], 12 if dbl else 13.5, BLU)
        put((R3 + R2) / 2, ["n = %+d" % n if n else "n = 0" for n in ns], 10.5 if dbl else 11, MUT, False)
        put((R2 + R1) / 2, [_f07_jp(_f07_MIN[n], True) for n in ns], 11 if dbl else 12, PUR)
    o.append(T(cx, cy - 18, "外側: 長調", "middle", 11.5, BLU, True))
    o.append(T(cx, cy + 2, "中: 調号の数 n", "middle", 11, MUT))
    o.append(T(cx, cy + 22, "内側: 同じ調号の短調", "middle", 11.5, PUR, True))
    # 回る向き
    o.append(_f07_arc(cx, cy, R4 + 14, -78, -48, SIG, 2))
    a = math.radians(-48)
    o.append(ARR(cx + (R4 + 14) * math.cos(math.radians(-52)), cy + (R4 + 14) * math.sin(math.radians(-52)),
                 cx + (R4 + 14) * math.cos(a), cy + (R4 + 14) * math.sin(a), SIG, 2))
    o.append(T(W_ - 10, 22, "時計回り: 5 度上の調（n が 1 増える）", "end", 11, SIG, True))
    o.append(_f07_arc(cx, cy, R4 + 14, -132, -102, BLU, 2))
    a = math.radians(-132)
    o.append(ARR(cx + (R4 + 14) * math.cos(math.radians(-128)), cy + (R4 + 14) * math.sin(math.radians(-128)),
                 cx + (R4 + 14) * math.cos(a), cy + (R4 + 14) * math.sin(a), BLU, 2))
    o.append(T(10, 22, "反時計回り: 5 度下の調（n が 1 減る）", "start", 11, BLU, True))
    o.append(T(cx, H_ - 8, "黄色の 3 つの位置には、同じ高さで名前の違う調（異名同音調）が 2 つずつ入る", "middle", 11, GLD, True))
    return SVG(W_, H_, o,
               "五度圏。外側に 12 の長調を、主音が 5 度ずつ上がる順に時計回りに並べ、内側に同じ調号の短調を並べた。"
               "時計回りに 1 つ進むと調号の数 n が 1 増え、反時計回りに進むと 1 減る。いちばん下の 3 つの位置では、n が 12 違う 2 つの調が同じ位置に来る（異名同音調）。")
F["e07_circle"] = _f07_circle()


# ---------- 4 節: 異名同音調 ----------
def _f07_enharm():
    o = []
    s = 8

    def stf(x, y, title, sub, tcol, key, notes, acc_draw=None):
        o.append(T(x, y - 22, title, "start", 12.5, tcol, True))
        o.append(T(x, y - 8, sub, "start", 10.5, MUT))
        st = staff_start(s, key) + 4
        items = [dict(x=st + i * 21, notes=[n], acc=(acc_draw is None)) for i, n in enumerate(notes)]
        o.append(STAFF(x, y + 6, st + 8 * 21 + 4, s, "treble", items, key=key))
        return st

    # 上の段: 嬰ヘ長調と変ト長調
    stf(20, 44, "嬰ヘ長調（F♯ メジャー）", "調号 ♯ 6 つ（n = +6）", INK, 6, spell_scale("F#4", MAJOR, 8))
    stf(370, 44, "変ト長調（G♭ メジャー）", "調号 ♭ 6 つ（n = −6）", INK, -6, spell_scale("Gb4", MAJOR, 8))
    info = {}
    hl = {parse(n)["midi"]: dict(c=GRN2, label=nname(n, False)) for n in spell_scale("F#4", MAJOR, 8)}
    kx = (712 - kb_width(65, 79, 24)) / 2
    o.append(KEYBOARD(kx, 128, 65, 79, 24, 60, hl=hl, names=None, info=info))
    o.append(T(kx + kb_width(65, 79, 24) + 12, 164, "← どちらも同じ鍵", "start", 11.5, GRN2, True))
    # 下の段: 嬰ト長調（避ける）と変イ長調
    y = 262
    o.append(T(20, y - 22, "✕ 嬰ト長調（G♯ メジャー）", "start", 12.5, ALI, True))
    o.append(T(20, y - 8, "♯ が 8 つ要る（F には ♯ が 2 つ = 𝄪）", "start", 10.5, MUT))
    gs = spell_scale("G#4", MAJOR, 8)
    st = staff_start(s, 0) + 12
    items = []
    for i, n in enumerate(gs):
        p = parse(n)
        items.append(dict(x=st + i * 24, notes=[n], fill=ALI if p["acc"] == 2 else INK))
    o.append(STAFF(20, y + 6, st + 8 * 24, s, "treble", items))
    # 𝄪 を描く（F𝄪5 は第 5 線）
    i6 = 6
    hw = 0.78 * s
    o.append(_f07_dsharp(20 + st + i6 * 24 - hw - 0.35 * s, y + 6, s, ALI))
    stf(370, y, "○ 変イ長調（A♭ メジャー）", "調号 ♭ 4 つ（n = −4）で書ける", GRN2, -4, spell_scale("Ab4", MAJOR, 8))
    return SVG(712, y + 88, o,
               "上: 嬰ヘ長調と変ト長調は、鍵盤では同じ 7 つの鍵を押す（異名同音調）。下: 嬰ト長調は ♯ を 8 つ（F に 𝄪）必要とするので、"
               "ふつうは異名同音調の変イ長調（♭ 4 つ）で書く。")
F["e07_enharm"] = _f07_enharm()


# ---------- 5 節: 平行調と同主調 ----------
def _f07_relpar():
    o = []

    def keyrow(x, y, t, minor, n, diff=()):
        col = PUR if minor else BLU
        o.append(T(x, y + 24, _f07_jp(t, minor), "start", 13, col, True))
        o.append(T(x, y + 40, "（%s）" % _f07_sig(n), "start", 10, MUT))
        o.append(STAFF(x + 78, y + 8, 64, 6, "treble", [], key=n))
        sc = spell_scale(t + "4", NAT_MINOR if minor else MAJOR, 7)
        hl = {}
        for i, nm in enumerate(sc):
            m = 60 + parse(nm)["midi"] % 12
            if i == 0:
                hl[m] = dict(c=SIG, label=nname(nm, False), strong=True)
            elif nname(nm, False) in diff:
                hl[m] = dict(c=ALI, label=nname(nm, False), strong=True)
            else:
                hl[m] = dict(c=col, label=nname(nm, False))
        o.append(KEYBOARD(x + 150, y + 2, 60, 71, 22, 52, hl=hl, names=None))

    for k, (title, sub, rows) in enumerate((
            ("平行調", "同じ 7 音・同じ調号で、主音が違う", [("C", False, 0, ()), ("A", True, 0, ())]),
            ("同主調", "主音が同じで、第 3・6・7 音が違う", [("C", False, 0, ()), ("C", True, -3, ("E♭", "A♭", "B♭"))]))):
        x = 10 + k * 352
        o.append(RECT(x, 10, 342, 214, 10, PAN, LIN, 1.2))
        o.append(T(x + 14, 34, title, "start", 14, INK, True))
        o.append(T(x + 76, 34, sub, "start", 10.5, MUT))
        for j, (t, minor, n, diff) in enumerate(rows):
            keyrow(x + 14, 52 + j * 76, t, minor, n, diff)
    return SVG(706, 232, o,
               "左: ハ長調とイ短調は同じ 7 つの音（白鍵）を使い、調号も同じ（なし）で、主音（赤）だけが違う。これを平行調という。"
               "右: ハ長調とハ短調は主音が同じ C で、第 3・6・7 音（E♭ A♭ B♭、橙）が違う。これを同主調という。")
F["e07_relpar"] = _f07_relpar()


# ---------- 5 節: 同主調の調号の数は 3 小さい ----------
def _f07_parsig():
    o = []
    ex = [("C", 0, -3), ("D", 2, -1)]
    x0 = 16
    for k, (t, nmaj, nmin) in enumerate(ex):
        y = 22 + k * 142
        ma = spell_scale(t + "4", MAJOR, 7)
        mi = spell_scale(t + "4", NAT_MINOR, 7)
        for j, (sc, minor, nn) in enumerate(((ma, False, nmaj), (mi, True, nmin))):
            yy = y + j * 58
            col = PUR if minor else BLU
            o.append(T(x0, yy + 18, _f07_jp(t, minor), "start", 13, col, True))
            for i, nm in enumerate(sc):
                p = parse(nm)
                xx = x0 + 104 + i * 46
                ch = minor and (i in (2, 5, 6))
                o.append(T(xx, yy + 18, nname(nm, False), "middle", 13, ALI if ch else INK, True))
                v = p["acc"]
                o.append(T(xx, yy + 38, "%+d" % v if v else "0", "middle", 11, ALI if ch else MUT, ch))
            o.append(T(x0 + 104 + 7 * 46 - 6, yy + 38, "合計 = %+d" % nn if nn else "合計 = 0", "start", 11.5, col, True))
        o.append(T(x0 + 104 + 7 * 46 - 6, y + 58 + 58, "差 = −3", "start", 12, ALI, True))
        o.append(W(x0, y + 128, x0 + 470, y + 128, c=LIN, lw=1))
    o.append(T(x0, 316, "♯ を +1、♭ を −1 として、7 音を足した数が調号の数 n になる。第 3・6・7 音（橙）が 1 ずつ下がる。", "start", 10.5, MUT))
    # 右: 五度圏の上の位置
    cx, cy, r = 600, 160, 74
    o.append(CIRC(cx, cy, r, LIN, 1.2))
    o.append(CIRC(cx, cy, r - 30, LIN, 1))
    for k in range(12):
        a = math.radians(-90 + 30 * k)
        o.append(D(cx + r * math.cos(a), cy + r * math.sin(a), MUT, 2.4))
        o.append(D(cx + (r - 30) * math.cos(a), cy + (r - 30) * math.sin(a), MUT, 2.4))
    pC = (cx, cy - r)
    pAm = (cx, cy - (r - 30))
    a3 = math.radians(-90 - 90)
    pCm = (cx + (r - 30) * math.cos(a3), cy + (r - 30) * math.sin(a3))
    o.append(D(pC[0], pC[1], BLU, 6))
    o.append(D(pAm[0], pAm[1], PUR, 6))
    o.append(D(pCm[0], pCm[1], PUR, 6))
    o.append(T(pC[0], pC[1] - 12, "ハ長調", "middle", 11.5, BLU, True))
    o.append(T(pAm[0] + 9, pAm[1] + 16, "イ短調", "start", 11, PUR, True))
    o.append(T(pCm[0] + 10, pCm[1] + 4, "ハ短調", "start", 11, PUR, True))
    o.append(_f07_arc(cx, cy, r + 14, -170, -96, ALI, 1.6, dash="4,3"))
    a1, a2 = math.radians(-166), math.radians(-176)
    o.append(ARR(cx + (r + 14) * math.cos(a1), cy + (r + 14) * math.sin(a1), cx + (r + 14) * math.cos(a2), cy + (r + 14) * math.sin(a2), ALI, 1.6))
    o.append(T(cx - r - 22, cy - r + 2, "反時計回りに 3 つ", "middle", 10.5, ALI, True))
    o.append(T(cx, cy + r + 24, "平行調: 同じ位置の内側", "middle", 10.5, PUR, True))
    o.append(T(cx, cy + r + 42, "同主調: 3 つ反時計回りの内側", "middle", 10.5, ALI, True))
    return SVG(712, 330, o,
               "同主調の短調は、長調の第 3・6・7 音を半音下げた音を使うので、♯ を +1、♭ を −1 として足した調号の数 n が 3 小さくなる。"
               "五度圏では、平行調は同じ位置の内側に、同主調は反時計回りに 3 つ進んだ位置の内側にある。")
F["e07_parsig"] = _f07_parsig()


# ---------- 6 節: ハ長調と d 個離れた長調の共通音 ----------
def _f07_common():
    o = []
    y0, rh = 46, 52
    cmaj = set(parse(x)["midi"] % 12 for x in spell_scale("C4", MAJOR, 7))
    lg = [("共通音", GRN2), ("ハ長調だけの音", BLU), ("もう一方の調だけの音", PUR)]
    for i, (t, c) in enumerate(lg):
        o.append(RECT(178 + i * 150, 12, 14, 14, 3, c, c, 1))
        o.append(T(198 + i * 150, 24, t, "start", 11, c, True))
    for d in range(7):
        y = y0 + d * rh
        t = _f07_MAJ[d]
        sc = spell_scale(t + "4", MAJOR, 7)
        other = {parse(x)["midi"] % 12: nname(x, False) for x in sc}
        com = cmaj & set(other)
        hl = {}
        for pc in range(12):
            m = 60 + pc
            if pc in com:
                hl[m] = dict(c=GRN2, label=NAMES_SHARP[pc], strong=True)
            elif pc in cmaj:
                hl[m] = dict(c=BLU, label=NAMES_SHARP[pc])
            elif pc in other:
                hl[m] = dict(c=PUR, label=other[pc])
        o.append(T(14, y + 26, "d = %d" % d, "start", 13, INK, True))
        o.append(T(66, y + 26, _f07_jp(t), "start", 12.5, INK, True))
        o.append(KEYBOARD(150, y + 2, 60, 71, 24, 44, hl=hl, names=None))
        n = len(com)
        o.append(T(344, y + 27, "共通音 %d" % n, "start", 13, GRN2, True))
        if d <= 5:
            o.append(T(440, y + 27, "7 − %d = %d" % (d, 7 - d), "start", 11.5, MUT))
        else:
            o.append(T(440, y + 27, "7 − 6 = 1 ではなく 2", "start", 11.5, ALI, True))
    return SVG(640, y0 + 7 * rh + 4, o,
               "ハ長調と、五度圏で時計回りに d 個離れた長調の共通音（緑）。d が 1 増えるごとに共通音は 1 つ減るが、d = 6（嬰ヘ長調）では B と F（嬰ヘ長調では E♯）の 2 つになる。")
F["e07_common"] = _f07_common()


# ---------- 6 節: 連続した 7 つの位置の重なり ----------
def _f07_window():
    o = []
    r = 62
    names = ["F", "C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯"]   # 位置 0〜11（F が 0）
    def ang(p):
        return -90 + 30 * (p - 1)       # C（位置 1）を真上に置く
    for k, d in enumerate((1, 3, 5, 6)):
        cx, cy = 92 + k * 176, 128
        o.append(CIRC(cx, cy, r, LIN, 1.1))
        A = set(range(0, 7))
        B = set(p % 12 for p in range(d, d + 7))
        o.append(_f07_arc(cx, cy, r + 13, ang(0) - 12, ang(6) + 12, BLU, 4))
        o.append(_f07_arc(cx, cy, r + 23, ang(d) - 12, ang(d + 6) + 12, PUR, 4))
        for p in range(12):
            a = math.radians(ang(p))
            px, py = cx + r * math.cos(a), cy + r * math.sin(a)
            if p in A and p in B:
                o.append(D(px, py, GRN2, 6))
            elif p in A:
                o.append(D(px, py, BLU, 3.6))
            elif p in B:
                o.append(D(px, py, PUR, 3.6))
            else:
                o.append(D(px, py, MUT, 2.4))
            o.append(T(cx + (r - 15) * math.cos(a), cy + (r - 15) * math.sin(a) + 3.5, names[p], "middle", 9.5, INK if p in A or p in B else MUT, p in A and p in B))
        t = _f07_MAJ[d]
        o.append(T(cx, 24, "d = %d（%s）" % (d, _f07_jp(t)), "middle", 12, INK, True))
        n = len(A & B)
        o.append(T(cx, cy + r + 46, "重なり %d" % n, "middle", 13, GRN2, True))
        o.append(T(cx, cy + r + 64, ("7 − %d = %d" % (d, 7 - d)) if d <= 5 else "両端で 1 つずつ重なる", "middle", 10.5, MUT if d <= 5 else ALI, d > 5))
    o.append(T(14, 282, "内側の円弧（青）: ハ長調の 7 音（位置 0〜6）　外側の円弧（紫）: d 個離れた長調の 7 音（位置 d〜d + 6）", "start", 10.5, MUT))
    o.append(T(14, 302, "位置の番号: F = 0, C = 1, G = 2, D = 3, A = 4, E = 5, B = 6, F♯ = 7, C♯ = 8, G♯ = 9, D♯ = 10, A♯ = 11", "start", 10.5, MUT))
    return SVG(712, 314, o,
               "長調の 7 音は、五度圏の連続した 7 つの位置を占める（F の位置を 0 とした）。2 つの長調の共通音（緑）は、2 つの円弧の重なりである。"
               "d ≤ 5 では重なりは 7 − d 個だが、d = 6 では 2 つの円弧が円の両端（F と B の位置）で重なり、2 個になる。")
F["e07_window"] = _f07_window()


# ---------- 6 節: 近親調 ----------
def _f07_kin():
    o = []
    cols = [-3, -2, -1, 0, 1, 2]
    bw, bh, gx = 104, 74, 8
    x0, ym, yn = 14, 40, 132
    rel = {(0, False): ("もとの調", 7, SIG, False), (1, False): ("属調", 6, BLU, False), (-1, False): ("下属調", 6, BLU, False),
           (0, True): ("平行調", 7, PUR, False), (-3, True): ("同主調", 4, ALI, False),
           (1, True): ("属調の平行調", 6, MUT, True), (-1, True): ("下属調の平行調", 6, MUT, True)}
    for i, n in enumerate(cols):
        x = x0 + i * (bw + gx)
        for minor, y in ((False, ym), (True, yn)):
            t = (_f07_MIN if minor else _f07_MAJ)[n]
            r = rel.get((n, minor))
            if r:
                lab, cnt, c, dash = r
                o.append(RECT(x, y, bw, bh, 8, SSOFT if lab == "もとの調" else PAN, c, 2 if not dash else 1.4, "5,4" if dash else None))
                o.append(T(x + bw / 2, y + 20, _f07_jp(t, minor), "middle", 13, INK, True))
                o.append(T(x + bw / 2, y + 40, lab, "middle", 11 if len(lab) < 6 else 10, c, True))
                o.append(T(x + bw / 2, y + 60, "共通音 %d" % cnt if lab != "もとの調" else "", "middle", 11, GRN2, True))
            else:
                o.append(RECT(x, y, bw, bh, 8, "none", LIN, 1, "3,3"))
                o.append(T(x + bw / 2, y + 42, _f07_jp(t, minor), "middle", 12, MUT))
    o.append(T(x0, 24, "← 5 度下（反時計回り）", "start", 11, MUT, True))
    o.append(T(x0 + 6 * (bw + gx) - gx, 24, "5 度上（時計回り）→", "end", 11, MUT, True))
    o.append(T(x0, 228, "上の段: 長調　下の段: 同じ調号の短調（五度圏の一部を切り開いて並べた）", "start", 10.5, MUT))
    return SVG(690, 240, o,
               "ハ長調の近親調。属調（ト長調）・下属調（ヘ長調）・平行調（イ短調）・同主調（ハ短調）を実線で囲んだ。"
               "破線の 2 つ（属調・下属調の平行調）を近親調に含めることもある。数字はハ長調との共通音の数である。")
F["e07_kin"] = _f07_kin()
