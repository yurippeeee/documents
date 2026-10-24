# 05 章 長音階 の図（figures.py の関数・定数をそのまま使う）
# 色: 全音 = 青（長 2 度と同じ）、半音 = 紫（短 2 度と同じ）、♯・♭ を付けた音 = signal、悪い例 = alias、良い例 = green

_F05_MAJ = [2, 2, 1, 2, 2, 2, 1]


def _f05_lab(k):
    """隣どうしの間隔（半音の数）→（表示, 線の色, 塗りの色）"""
    if k == 2:
        return "全", BLU, BSOFT
    if k == 1:
        return "半", PUR, PSOFT
    return "半音 %d" % k, MUT, PAN


def _f05_arc(x1, x2, y, h, c, lw=1.6):
    """(x1,y) と (x2,y) を、高さ h の山なりの弧で結ぶ"""
    xm = (x1 + x2) / 2.0
    return ('<path d="M%g,%g Q%g,%g %g,%g" fill="none" stroke="%s" stroke-width="%g" stroke-linecap="round"/>'
            % (x1, y, xm, y - 2 * h, x2, y, c, lw))


def _f05_arcs(info, ms, y, h=12, sz=12):
    """鍵盤の上で、隣どうしの音を弧で結び「全」「半」を書く（info は KEYBOARD の info）"""
    o = []
    for a, b in zip(ms, ms[1:]):
        lab, c, _ = _f05_lab(b - a)
        x1, x2 = info[a][0], info[b][0]
        o.append(_f05_arc(x1 + 3, x2 - 3, y, h, c))
        o.append(T((x1 + x2) / 2.0, y - h - 6, lab, "middle", sz, c, True))
    return "".join(o)


def _f05_boxes(x, y, steps, bw=30, bh=22, gap=4, bad=(), sz=11.5):
    """間隔の並びを小さな箱で並べる。bad の位置（0 から）は赤い枠にする"""
    o = []
    for i, k in enumerate(steps):
        lab, c, fl = _f05_lab(k)
        bx = x + i * (bw + gap)
        if i in bad:
            o.append(RECT(bx, y, bw, bh, 5, ASOFT, ALI, 2))
            o.append(T(bx + bw / 2.0, y + bh / 2.0 + 4, lab, "middle", sz, ALI, True))
        else:
            o.append(RECT(bx, y, bw, bh, 5, fl, c, 1.2))
            o.append(T(bx + bw / 2.0, y + bh / 2.0 + 4, lab, "middle", sz, c, True))
    return "".join(o)


def _f05_white_from(tonic):
    """主音（白鍵、例 'G4'）から白鍵だけを 8 つ並べた音名"""
    p = parse(tonic)
    return ["%s%d" % (LETTERS[(p["li"] + i) % 7], p["oct"] + (p["li"] + i) // 7) for i in range(8)]


def _f05_semis(names):
    ms = [parse(n)["midi"] for n in names]
    return [b - a for a, b in zip(ms, ms[1:])]


# 1. 12 の音から選ぶ: 12 の音すべて／白鍵の 7 つ／黒鍵の 5 つ
def _f05_select():
    o = []
    KX, BX, BW = 172, 446, 252
    u = BW / 12.0
    rows = [("12 の音をすべて", "C4 から半音ずつ", list(range(60, 73)), 60, 72, {60: "C4", 72: "C5"}),
            ("白鍵の 7 つ", "C4 から", [60, 62, 64, 65, 67, 69, 71, 72], 60, 72,
             {60: "C", 62: "D", 64: "E", 65: "F", 67: "G", 69: "A", 71: "B", 72: "C"}),
            ("黒鍵の 5 つ", "F♯4 から", [66, 68, 70, 73, 75, 78], 65, 79,
             {66: "F♯", 68: "G♯", 70: "A♯", 73: "C♯", 75: "D♯", 78: "F♯"})]
    o.append(T(BX, 22, "隣どうしの間隔（長さ = 半音の数）", "start", 11, MUT, True))
    y = 40
    for title, sub, ms, lo, hi, labs in rows:
        o.append(T(16, y + 32, title, "start", 13, INK, True))
        o.append(T(16, y + 52, sub, "start", 11, MUT))
        hl = {m: dict(c=SIG, label=labs.get(m, ""), strong=False) for m in ms}
        o.append(KEYBOARD(KX, y, lo, hi, ww=26, wh=76, hl=hl, names=None))
        x = BX
        for a, b in zip(ms, ms[1:]):
            k = b - a
            lab, c, fl = _f05_lab(k)
            o.append(RECT(x + 1, y + 24, k * u - 2, 28, 4, fl, c, 1.2))
            o.append(T(x + k * u / 2.0, y + 43, lab, "middle", 11.5 if k != 1 or len(ms) < 13 else 11, INK if k > 2 else c, True))
            x += k * u
        o.append(T(BX + BW, y + 70, "合計 12（1 オクターブ）", "end", 10, MUT))
        y += 104
    o.append(T(16, y + 4, "全 = 全音（半音 2 つ）　半 = 半音", "start", 11, MUT))
    return SVG(712, y + 16, o, "12 の音から選んで高さの順に並べた 3 つの例。右の帯は、隣どうしの音の間隔を、半音の数に比例した長さで表したもの。"
               "12 の音をすべて並べると間隔はどこも半音だが、7 つや 5 つを選ぶと、大きさの違う間隔が混ざって並ぶ。")
F["e05_select"] = _f05_select()


# 2. 白鍵を C から並べる: 全・全・半・全・全・全・半
def _f05_cmajor():
    o = []
    notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
    ms = [parse(n)["midi"] for n in notes]
    kx, ky, ww, wh = 214, 66, 46, 104
    info = {}
    hl = {m: dict(c=SIG, label=nname(n, False), strong=False) for n, m in zip(notes, ms)}
    o.append(KEYBOARD(kx, ky, 60, 72, ww=ww, wh=wh, hl=hl, names=None, info=info))
    o.append(_f05_arcs(info, ms, ky - 5, h=13, sz=13))
    yb = ky + wh + 20
    for i, m in enumerate(ms):
        o.append(T(info[m][0], yb, "%d" % (i + 1), "middle", 12, MUT, True))
    o.append(T(kx - 12, yb, "C から数えて", "end", 10.5, MUT))
    o.append(T(16, 30, "全 = 全音（半音 2 つ）", "start", 11.5, BLU, True))
    o.append(T(16, 50, "半 = 半音", "start", 11.5, PUR, True))
    # 五線（鍵盤と同じ x に音符を置く）
    s = 10
    sy = yb + 28
    sx = kx - 92
    items = [dict(x=info[m][0] - sx, notes=[n]) for n, m in zip(notes, ms)]
    o.append(STAFF(sx, sy, info[72][0] - sx + 30, s=s, clef="treble", items=items))
    o.append(T(info[72][0] + 46, sy + 14, "五線では、全も半も", "start", 11, MUT))
    o.append(T(info[72][0] + 46, sy + 31, "線と間を 1 つ上がる", "start", 11, MUT))
    o.append(T(info[72][0] + 46, sy + 48, "だけに見える", "start", 11, MUT))
    return SVG(712, sy + 6 * s + 8, o, "白鍵の 7 つを C から 1 オクターブ上の C まで並べ、隣どうしの間隔を書き込んだもの。"
               "E–F と B–C だけが半音なので、間隔は「全・全・半・全・全・全・半」になる。五線の上では、どの間隔も同じ 1 段に見える。")
F["e05_cmajor"] = _f05_cmajor()


# 3. C・G・F から白鍵だけで並べたときの間隔と、長音階の並びとの比較
def _f05_gf():
    o = []
    rows = [("C から", "C4", None, "白鍵だけで長音階になる"),
            ("G から", "G4", ("F5", "F#5", "F を F♯ に（半音上げる）"), "6–7・7–8 番目が逆"),
            ("F から", "F4", ("B4", "Bb4", "B を B♭ に（半音下げる）"), "3–4・4–5 番目が逆")]
    KX, BX = 104, 428
    o.append(T(BX - 10, 22, "隣どうしの間隔", "end", 10.5, MUT, True))
    for i in range(7):
        o.append(T(BX + i * 34 + 15, 22, "%d–%d" % (i + 1, i + 2), "middle", 9.5, MUT))
    y = 34
    for title, tonic, fix, note in rows:
        white = _f05_white_from(tonic)
        sc = spell_scale(tonic, MAJOR, 8)
        ms = [parse(n)["midi"] for n in sc]
        wst = _f05_semis(white)
        bad = [i for i in range(7) if wst[i] != _F05_MAJ[i]]
        o.append(T(16, y + 34, title, "start", 13, INK, True))
        hl = {}
        for n in sc:
            pm = parse(n)
            hl[pm["midi"]] = dict(c=SIG, label=nname(n, False), strong=bool(pm["acc"]))
        lo = parse(tonic)["midi"]
        info = {}
        o.append(KEYBOARD(KX, y, lo, lo + 12, ww=26, wh=74, hl=hl, names=None, info=info))
        if fix:
            wm, bm, txt = parse(fix[0])["midi"], parse(fix[1])["midi"], fix[2]
            cx = info[wm][0]
            o.append(RECT(cx - 12, y + 2, 24, 72, 3, "none", ALI, 1.6, "4,3"))
            o.append(T(info[bm][0], y + 92, txt, "middle", 10.5, SIG, True))
        # 間隔の比較
        o.append(T(BX - 10, y + 22, "白鍵だけ", "end", 11, INK, True))
        o.append(_f05_boxes(BX, y + 7, wst, bad=bad))
        o.append(T(BX - 10, y + 52, "長音階", "end", 11, INK, True))
        o.append(_f05_boxes(BX, y + 37, _F05_MAJ))
        mark, mc = ("一致", GRN2) if not bad else (note, ALI)
        o.append(T(BX + 7 * 34 + 8, y + 22, "✓" if not bad else "✗", "start", 13, mc, True))
        o.append(T(BX, y + 78, mark if not bad else "白鍵だけでは " + note, "start", 10.5, mc, True))
        y += 112
    return SVG(712, y - 4, o, "C・G・F のそれぞれから、白鍵だけで 1 オクターブ上まで並べたときの間隔（上の段）と、長音階の並び（下の段）。"
               "G からでは 7 番目の F を半音上げて F♯ に、F からでは 4 番目の B を半音下げて B♭ にすると、長音階の並びになる（鍵盤は直した後の音。破線は使わなくなった白鍵）。")
F["e05_gf"] = _f05_gf()


# 4. 綴り方: 良い例（文字を 1 回ずつ）と悪い例（同じ文字が 2 回）
def _f05_spell():
    o = []
    s = 8
    cases = [("G4", "F#5", "Gb5", "F♯", "G♭", "G", "F"),
             ("F4", "Bb4", "A#4", "B♭", "A♯", "A", "B")]
    CW = 346
    y = 14
    for tonic, good, badn, gl, bl, dup, miss in cases:
        sc = spell_scale(tonic, MAJOR, 8)
        k = [n.replace("♯", "#").replace("♭", "b") for n in sc].index(good)
        for col in range(2):
            x0 = 16 + col * (CW + 4)
            ok = col == 0
            names = list(sc)
            if not ok:
                names[k] = badn
            c = GRN2 if ok else ALI
            o.append(RECT(x0, y, CW - 8, 168, 10, GSOFT if ok else ASOFT, c, 1.2))
            hdr = ("%s 長音階を、%s と書く（きまりどおり）" % (nname(tonic, False), gl)) if ok else ("%s と書いた場合" % bl)
            o.append(T(x0 + 12, y + 20, hdr, "start", 12, c, True))
            items = []
            for i, n in enumerate(names):
                it = dict(x=44 + i * 34, notes=[n], fill=INK)
                if i == k:
                    it["fill"] = c
                items.append(it)
            sx = x0 + 6
            sy = y + 46
            o.append(STAFF(sx, sy, 44 + 7 * 34 + 22, s=s, clef="treble", items=items))
            if not ok and parse(names[k + 1])["letter"] == parse(names[k])["letter"]:
                # 同じ文字の音がすぐ後に続くときは、その音に ♮ が要る
                pn = parse(names[k + 1])
                yn = sy + 4 * s - (pn["dia"] - 30) * s / 2.0
                xn = sx + 44 + (k + 1) * 34
                o.append(ACC(0, xn - 0.78 * s - 0.35 * s, yn, s, ALI))
            # 使った文字（悪い例では、2 回使われた文字を赤で）
            letters = [parse(n)["letter"] for n in names]
            ly = sy + 4 * s + 30
            o.append(T(x0 + 12, ly, "文字", "start", 10.5, MUT, True))
            for i, L in enumerate(letters):
                lc = ALI if (not ok and L == dup and i < 7) else INK
                o.append(T(sx + 44 + i * 34, ly, L, "middle", 12, lc, True))
            # 2 つの音程
            a, b, cc = names[k - 1], names[k], names[k + 1]
            def ivs(lo_, hi_):
                pa, pb = parse(lo_), parse(hi_)
                d = pb["dia"] - pa["dia"] + 1
                sm = pb["midi"] - pa["midi"]
                if d == 2:
                    q = {2: "長", 1: "短"}[sm]
                elif d == 3:
                    q = {2: "減", 3: "短", 4: "長"}[sm]
                else:
                    q = {0: "完全", 1: "増"}[sm]
                return "%s %d 度" % (q, d)
            t1 = "%s–%s %s" % (nname(a, False), nname(b, False), ivs(a, b))
            t2 = "%s–%s %s" % (nname(b, False), nname(cc, False), ivs(b, cc))
            o.append(T(x0 + 12, ly + 22, "%s ／ %s" % (t1, t2), "start", 11, INK if ok else ALI, True))
            if ok:
                o.append(T(x0 + 12, ly + 42, "7 つの文字を 1 回ずつ使い、隣どうしはどれも 2 度", "start", 10.5, GRN2, True))
            else:
                o.append(T(x0 + 12, ly + 42, "%s が 2 回、%s が無い。隣どうしが 2 度でなくなる" % (dup, miss), "start", 10.5, ALI, True))
        y += 180
    return SVG(712, y - 4, o, "同じ鍵を 2 通りの名前で書いた例。左（きまりどおり）は 7 つの文字を 1 回ずつ使い、五線の上を 1 段ずつ上がる。"
               "右は同じ文字が 2 回使われ、1 つの文字が抜けるので、同じ段に 2 つの音が並び、隣どうしの音程が 2 度でなくなる（減 3 度・増 1 度）。")
F["e05_spell"] = _f05_spell()


# 5. 手順（筆算）: D と B♭ から長音階を作る
def _f05_proc():
    o = []
    cases = [("D4", "D"), ("Bb4", "B♭")]
    LX, CX, CW = 16, 262, 60
    y = 16
    need = [sum(_F05_MAJ[:i]) for i in range(7)]
    for tonic, tn in cases:
        p = parse(tonic)
        sc = spell_scale(tonic, MAJOR, 8)
        o.append(RECT(LX - 6, y - 6, 700, 172, 10, PAN, LIN, 1.2))
        o.append(T(LX + 4, y + 16, "主音 %s" % tn, "start", 14, INK, True))
        o.append(T(LX + 92, y + 16, "（② ③ はどちらも、主音から何半音上かを数えた数）", "start", 10.5, MUT))
        labels = [("① 文字を順に", None), ("② 長音階での位置", "全・全・半・… を足す"), ("③ ♮ の音の位置", "鍵盤で数える"),
                  ("④ ② − ③", "+1 → ♯、−1 → ♭"), ("音名", None)]
        rys = [y + 44, y + 68, y + 92, y + 116, y + 146]
        for (lab, sub), ry in zip(labels, rys):
            o.append(T(LX + 4, ry, lab, "start", 11.5, INK, True))
            if sub:
                o.append(T(LX + 128, ry, sub, "start", 10, MUT))
        o.append(W(LX + 4, y + 128, CX + 7 * CW, y + 128, c=INK, lw=1.2))
        # 主音の列は網掛け
        o.append(RECT(CX, y + 28, CW, 128, 5, SSOFT, LIN, 0.8))
        for i in range(7):
            cx = CX + i * CW + CW / 2.0
            dia = p["dia"] + i
            li, octv = dia % 7, dia // 7
            nat = 12 * (octv + 1) + PC_OF_LETTER[li] - p["midi"]
            o.append(T(cx, rys[0], LETTERS[li], "middle", 13, INK, True))
            o.append(T(cx, rys[1], "%d" % need[i], "middle", 12.5, INK))
            if i == 0:
                o.append(T(cx, rys[2], "主音", "middle", 10.5, MUT))
                o.append(T(cx, rys[3], "—", "middle", 12, MUT))
            else:
                d = need[i] - nat
                o.append(T(cx, rys[2], "%d" % nat, "middle", 12.5, INK))
                o.append(T(cx, rys[3], "%+d" % d if d else "0", "middle", 12.5, SIG if d else MUT, bool(d)))
            pn = parse(sc[i])
            o.append(T(cx, rys[4], nname(sc[i], False), "middle", 14, SIG if pn["acc"] else INK, True))
        y += 182
    return SVG(712, y - 8, o, "D と B♭ を主音にして長音階を書く手順。①文字を順に書き、②長音階で主音から何半音上にあるべきかと、"
               "③その文字の ♮（♯・♭ を付けない音）が主音から何半音上にあるかを比べ、④差が +1 なら ♯、−1 なら ♭ を付ける。")
F["e05_proc"] = _f05_proc()


# 6. D・A・B♭・E♭ の長音階（五線）
def _f05_four():
    o = []
    s = 8
    cases = ["D4", "A4", "Bb4", "Eb4"]
    for k, tonic in enumerate(cases):
        sc = spell_scale(tonic, MAJOR, 8)
        x0 = 16 + (k % 2) * 350
        y0 = 14 + (k // 2) * 132
        accs = [nname(n, False) for n in sc[:7] if parse(n)["acc"]]
        o.append(T(x0 + 4, y0 + 14, "%s 長音階" % nname(tonic, False), "start", 12.5, INK, True))
        o.append(T(x0 + 92, y0 + 14, "♯・♭: " + "・".join(accs), "start", 11, SIG, True))
        items = []
        for i, n in enumerate(sc):
            pn = parse(n)
            col = SIG if pn["acc"] else INK
            items.append(dict(x=46 + i * 36, notes=[n], fill=col, label=nname(n, False), lcol=col, lsz=10.5))
        o.append(STAFF(x0, y0 + 40, 46 + 7 * 36 + 22, s=s, clef="treble", items=items))
    return SVG(712, 14 + 2 * 132 + 4, o, "D・A・B♭・E♭ を主音とする長音階。どれも 7 つの文字を 1 回ずつ使い、五線の上を 1 段ずつ上がる。"
               "♯・♭ の付いた音を色で示した。")
F["e05_four"] = _f05_four()


# 7. 音階の第 n 音と、主音からの音程（C 長音階と G 長音階）
def _f05_degrees():
    o = []
    s = 9
    NX0, DX = 176, 70           # 1 つ目の音符の x（図の左端から）と間隔
    QC = {"完全": GRN2, "長": BLU}
    rows_y = {"num": 128, "iv": 152, "semi": 172}
    def staff_row(tonic, ytop, title):
        sc = spell_scale(tonic, MAJOR, 8)
        items = []
        for i, n in enumerate(sc):
            col = SIG if parse(n)["acc"] else INK
            items.append(dict(x=NX0 - 100 + i * DX, notes=[n], fill=col, label=nname(n, False), lcol=col, lsz=11))
        o.append(T(16, ytop + 22, title, "start", 12.5, INK, True))
        o.append(STAFF(100, ytop, NX0 - 100 + 7 * DX + 28, s=s, clef="treble", items=items))
    staff_row("C4", 30, "C 長音階")
    staff_row("G4", 214, "G 長音階")
    # 間の行: 番号・主音からの音程・半音の数（どちらの長音階でも同じ）
    o.append(RECT(10, 108, 692, 76, 8, PAN, LIN, 1))
    o.append(T(16, rows_y["num"] + 4, "音階の", "start", 11, MUT, True))
    o.append(T(16, rows_y["iv"] + 4, "主音からの音程", "start", 11, MUT, True))
    o.append(T(16, rows_y["semi"] + 4, "（半音の数）", "start", 10.5, MUT))
    cum = [sum(_F05_MAJ[:i]) for i in range(8)]
    for i in range(8):
        x = NX0 + i * DX
        num = "第 %d 音" % (i + 1) if i < 7 else "（第 1 音）"
        o.append(T(x, rows_y["num"] + 4, num, "middle", 11.5, INK if i < 7 else MUT, True))
        d, sm = i + 1, cum[i]
        q = "完全" if d in (1, 4, 5, 8) else "長"
        o.append(T(x, rows_y["iv"] + 4, "%s %d 度" % (q, d), "middle", 11.5, QC[q], True))
        o.append(T(x, rows_y["semi"] + 4, "%d" % sm, "middle", 11, MUT))
    return SVG(712, 300, o, "主音を第 1 音として、高さの順に第 2 音〜第 7 音と数える。主音から第 n 音までの音程は n 度で、長音階では長（青）か完全（緑）になる。"
               "番号と音程は音階の中の位置で決まるので、C 長音階でも G 長音階でも同じである。")
F["e05_degrees"] = _f05_degrees()


# 8. 呼び名: 主音を中心に、上下に同じ距離
def _f05_names():
    o = []
    cx, u, ly = 356, 40, 132      # 主音の x、半音 1 つの幅、軸の y
    X = lambda k: cx + k * u
    o.append(W(X(-7.6), ly, X(7.6), ly, c=LIN, lw=1.4))
    for k in range(-7, 8):
        o.append(W(X(k), ly - 4, X(k), ly + 4, c=MUT, lw=1))
    pts = {0: ("主音", "C4", "第 1 音"), 2: ("上主音", "D4", "第 2 音"), 4: ("中音", "E4", "第 3 音"), 7: ("属音", "G4", "第 5 音"),
           -1: ("導音", "B3", "第 7 音"), -3: ("下中音", "A3", "→ 第 6 音"), -7: ("下属音", "F3", "→ 第 4 音")}
    # 主音からの距離を、上（高い側）と下（低い側）に同じ段で並べる
    dims = [(2, "2 度上", 1), (4, "3 度上", 2), (7, "完全 5 度上", 3), (-1, "半音下", 1), (-3, "3 度下", 2), (-7, "完全 5 度下", 3)]
    for k, lab, lv in dims:
        up = k > 0
        y = ly - 38 - (lv - 1) * 24 if up else ly + 52 + (lv - 1) * 24
        x1, x2 = sorted((X(0), X(k)))
        o.append(W(x1, y - 4, x1, y + 4, c=MUT, lw=1.2))
        o.append(W(x2, y - 4, x2, y + 4, c=MUT, lw=1.2))
        o.append(W(x1, y, x2, y, c=MUT, lw=1.2))
        o.append(T((x1 + x2) / 2.0, y - 5 if up else y + 15, lab, "middle", 10.5, INK, True))
    for k, (nm, note, num) in pts.items():
        c = SIG if k == 0 else INK
        o.append(CIRC(X(k), ly, 7 if k == 0 else 5.5, c, 1.6, c))
        o.append(T(X(k), ly - 12, nm, "middle", 12.5, c, True))
        o.append(T(X(k), ly + 20, nname(note, True), "middle", 10.5, MUT, True))
        o.append(T(X(k), ly + 34, num, "middle", 10, MUT))
    o.append(T(16, 22, "← 低い", "start", 10.5, MUT))
    o.append(T(696, 22, "高い →", "end", 10.5, MUT))
    o.append(T(16, 272, "目盛は半音。下属音 F3・下中音 A3 は、1 オクターブ上げると、第 4 音 F4・第 6 音 A4 になる。", "start", 11, INK))
    return SVG(712, 286, o, "C 長音階の各音の呼び名。主音の完全 5 度上が属音、完全 5 度下が下属音で、主音と属音の中ほど（3 度上）が中音、"
               "主音と下の下属音の中ほど（3 度下）が下中音である。主音のすぐ上（2 度上）が上主音、すぐ下（半音下）が導音である。")
F["e05_names"] = _f05_names()


# 9. 2 つのテトラコルド
def _f05_tetra():
    o = []
    notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
    ms = [parse(n)["midi"] for n in notes]
    kx, ky, ww, wh = 226, 112, 56, 96
    info = {}
    hl = {m: dict(c=SIG, label=nname(n, False), strong=False) for n, m in zip(notes, ms)}
    o.append(KEYBOARD(kx, ky, 60, 72, ww=ww, wh=wh, hl=hl, names=None, info=info))
    o.append(_f05_arcs(info, ms, ky - 5, h=11, sz=12))
    # テトラコルドの括弧
    def brace(xa, xb, y, lab, sub, c):
        o.append(W(xa, y + 8, xa, y, xb, y, xb, y + 8, c=c, lw=1.8))
        o.append(T((xa + xb) / 2.0, y - 22, lab, "middle", 12, c, True))
        o.append(T((xa + xb) / 2.0, y - 7, sub, "middle", 10.5, c))
    brace(info[60][0] - 8, info[65][0] + 8, 66, "下のテトラコルド", "全・全・半", SIG)
    brace(info[67][0] - 8, info[72][0] + 8, 66, "上のテトラコルド", "全・全・半", SIG)
    o.append(T((info[65][0] + info[67][0]) / 2.0, 52, "つなぎ", "middle", 10.5, BLU, True))
    # 下の寸法
    yb = ky + wh + 22
    for a, b, lab, c in [(60, 65, "完全 4 度（半音 5）", INK), (65, 67, "全音（2）", BLU), (67, 72, "完全 4 度（半音 5）", INK)]:
        xa, xb = info[a][0], info[b][0]
        o.append(DARR(xa + 2, yb, xb - 2, yb, c, 1.3))
        o.append(T((xa + xb) / 2.0, yb + 17, lab, "middle", 10.5, c, True))
    o.append(T((info[60][0] + info[72][0]) / 2.0, yb + 40, "5 + 2 + 5 = 12（1 オクターブ）", "middle", 12, INK, True))
    # 左: 一般のテトラコルド（全音 2 つ・半音 1 つの分け方）
    o.append(RECT(10, 16, 186, 196, 8, PAN, LIN, 1))
    o.append(T(20, 38, "テトラコルド", "start", 12, INK, True))
    o.append(T(20, 56, "両端が完全 4 度の 4 つの音", "start", 10.5, MUT))
    o.append(T(20, 76, "全音 2 つ・半音 1 つで分けると:", "start", 10.5, MUT))
    for i, st in enumerate([[2, 2, 1], [2, 1, 2], [1, 2, 2]]):
        yy = 90 + i * 36
        o.append(_f05_boxes(24, yy, st, bw=34, bh=24, gap=4, sz=12))
        if i == 0:
            o.append(T(146, yy + 17, "← 長音階", "start", 10.5, SIG, True))
    return SVG(712, yb + 54, o, "長音階は、「全・全・半」のテトラコルド（両端が完全 4 度の 4 つの音）を 2 つ、全音 1 つでつないだものである。"
               "半音で数えると 5 + 2 + 5 = 12 で、ちょうど 1 オクターブになる。左は、全音 2 つと半音 1 つでテトラコルドを分ける 3 通りの分け方。")
F["e05_tetra"] = _f05_tetra()


# 10. F から完全 5 度ずつ 6 回積み、1 オクターブに並べ直す
def _f05_chain():
    o = []
    chain = ["F2", "C3", "G3", "D4", "A4", "E5", "B5"]
    cm = [parse(n)["midi"] for n in chain]
    # 上: F2〜B5 の鍵盤
    kx, ky, ww, wh = 31, 86, 26, 62
    info = {}
    hl = {m: dict(c=SIG, label=nname(n, True), strong=True) for n, m in zip(chain, cm)}
    o.append(KEYBOARD(kx, ky, 41, 83, ww=ww, wh=wh, hl=hl, names=None, sz=9.5, info=info))
    o.append(T(16, 22, "① F から完全 5 度（半音 7 つ）ずつ、6 回上へ積む", "start", 12, INK, True))
    for i, m in enumerate(cm):
        x = info[m][0]
        o.append(CIRC(x, 50, 10, SIG, 1.4, SSOFT))
        o.append(T(x, 54.5, "%d" % (i + 1), "middle", 11.5, SIG, True))
        if i:
            xp = info[cm[i - 1]][0]
            o.append(ARR(xp + 12, 50, x - 12, 50, MUT, 1.2, 6))
            o.append(T((xp + x) / 2.0, 42, "完全 5 度", "middle", 9.5, MUT))
    shift = {41: ("2 オクターブ", "上げる"), 48: ("1 オクターブ", "上げる"), 55: ("1 オクターブ", "上げる"), 62: ("そのまま", ""),
             69: ("そのまま", ""), 76: ("1 オクターブ", "下げる"), 83: ("1 オクターブ", "下げる")}
    for m in cm:
        o.append(T(info[m][0], ky + wh + 16, shift[m][0], "middle", 9.5, MUT, True))
        o.append(T(info[m][0], ky + wh + 29, shift[m][1], "middle", 9.5, MUT, True))
    # 下: C4〜C5
    o.append(T(16, 210, "② オクターブの違いを無視して、C4〜C5 の 1 オクターブの中に並べ直す", "start", 12, INK, True))
    kx2, ky2, ww2, wh2 = 176, 262, 48, 92
    info2 = {}
    fold = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
    fm = [parse(n)["midi"] for n in fold]
    hl2 = {m: dict(c=SIG, label=nname(n, False), strong=False) for n, m in zip(fold, fm)}
    o.append(KEYBOARD(kx2, ky2, 60, 72, ww=ww2, wh=wh2, hl=hl2, names=None, info=info2))
    order = {"F": 1, "C": 2, "G": 3, "D": 4, "A": 5, "E": 6, "B": 7}
    for n, m in zip(fold, fm):
        x = info2[m][0]
        o.append(CIRC(x, 240, 10, SIG, 1.4, SSOFT))
        o.append(T(x, 244.5, "%d" % order[n[0]], "middle", 11.5, SIG, True))
    o.append(T(kx2 - 14, 244.5, "連なりの番号", "end", 10, SIG, True))
    yb = ky2 + wh2 + 18
    for a, b in zip(fold, fold[1:]):
        k = parse(b)["midi"] - parse(a)["midi"]
        lab, c, _ = _f05_lab(k)
        d = abs(order[b[0]] - order[a[0]])
        x = (info2[parse(a)["midi"]][0] + info2[parse(b)["midi"]][0]) / 2.0
        o.append(T(x, yb, lab, "middle", 13, c, True))
        o.append(T(x, yb + 17, "%d" % d, "middle", 11, c, True))
    o.append(T(kx2 - 14, yb, "隣どうしの間隔", "end", 10, MUT, True))
    o.append(T(kx2 - 14, yb + 17, "連なりの番号の差", "end", 10, MUT, True))
    return SVG(712, yb + 30, o, "F から完全 5 度ずつ 6 回積んだ 7 つの音（上）を、1 オクターブの中に並べ直すと C 長音階になる（下）。"
               "下の丸の数は、上の連なりで何番目の音かを表す。隣どうしが連なりで 2 つ離れていれば全音、5 つ離れていれば半音になる。")
F["e05_chain"] = _f05_chain()


# 11. 12 の音は 1 本の完全 5 度の連なり: 白鍵 7 つ + 黒鍵 5 つ
def _f05_chain12():
    o = []
    names = ["F", "C", "G", "D", "A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯"]
    bw, gap, x0, y0 = 46, 9, 26, 52
    o.append(ARR(x0, 28, x0 + 12 * (bw + gap) - gap, 28, MUT, 1.4))
    o.append(T(x0 + 6 * (bw + gap), 21, "完全 5 度ずつ上へ（平均律では半音 7 つずつ）", "middle", 11, MUT, True))
    for i, n in enumerate(names):
        x = x0 + i * (bw + gap)
        black = i >= 7
        o.append(RECT(x, y0, bw, 42, 6, KB if black else KW, KB if black else KL, 1.4))
        o.append(T(x + bw / 2.0, y0 + 27, n, "middle", 14, "#fff" if black else KI, True))
    # 括弧
    def brace(i0, i1, lab, sub, c):
        xa, xb = x0 + i0 * (bw + gap), x0 + i1 * (bw + gap) + bw
        yy = y0 + 54
        o.append(W(xa, yy - 6, xa, yy, xb, yy, xb, yy - 6, c=c, lw=1.6))
        o.append(T((xa + xb) / 2.0, yy + 20, lab, "middle", 12, c, True))
        o.append(T((xa + xb) / 2.0, yy + 37, sub, "middle", 10.5, MUT))
    brace(0, 6, "白鍵の 7 つ", "C から並べると C 長音階", SIG)
    brace(7, 11, "黒鍵の 5 つ", "1 節の 5 つの音の音階", INK)
    o.append(T(x0 + 12 * (bw + gap) - gap, y0 + 120, "A♯ の次は E♯（F と同じ鍵）で、12 回積むと最初の F の 7 オクターブ上に戻る", "end", 10.5, MUT))
    return SVG(712, y0 + 134, o, "12 の音を完全 5 度ずつの順に並べると、1 本の連なりになる。白鍵の 7 つと黒鍵の 5 つは、それぞれその連続した一部である。")
F["e05_chain12"] = _f05_chain12()
