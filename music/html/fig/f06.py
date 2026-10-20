# 06 章 短音階 の図（figures.py の関数・定数をそのまま使う）
# トップレベルの名前は _f06_ で始める（他の章の図と衝突させないため）

_F06_QCOL = {"完全": GRN2, "長": BLU, "短": PUR, "増": ALI, "減": GLD}


def _f06_iname(lo, hi):
    """2 つの音名から（度数, 半音の数, 種類）を返す。lo が下の音。"""
    a, b = parse(lo), parse(hi)
    d = b["dia"] - a["dia"] + 1
    s = b["midi"] - a["midi"]
    d0 = (d - 1) % 7 + 1
    s0 = s - 12 * ((d - 1) // 7)
    if d0 in (1, 4, 5):
        q = {0: "完全", 1: "増", -1: "減"}[s0 - {1: 0, 4: 5, 5: 7}[d0]]
    else:
        q = {0: "長", -1: "短", 1: "増", -2: "減"}[s0 - {2: 2, 3: 4, 6: 9, 7: 11}[d0]]
    return d, s, q


def _f06_step(n):
    """隣り合う 2 音の間（半音の数）→（文字, 色）。全 = 2、半 = 1、増 2 度 = 3"""
    return {1: ("半", SIG), 2: ("全", INK), 3: ("増 2 度", ALI)}[n]


def _f06_arc(xa, xb, y, c=MUT, lw=1.6, depth=8):
    """xa から xb へ、下にふくらむ弧（2 次ベジェ。中央で depth だけ下がる）"""
    xm = (xa + xb) / 2.0
    return ('<path d="M%g,%g Q%g,%g %g,%g" fill="none" stroke="%s" stroke-width="%g" stroke-linecap="round"/>'
            % (xa, y, xm, y + 2 * depth, xb, y, c, lw))


def _f06_arcs(info, ms, y, depth=8, sz=11.5):
    """鍵盤の上の音の列 ms（MIDI）の隣どうしを弧で結び、全・半・増 2 度を書く"""
    o = []
    for a, b in zip(ms, ms[1:]):
        n = abs(b - a)
        t, c = _f06_step(n)
        xa, xb = info[a][0], info[b][0]
        if xa > xb:
            xa, xb = xb, xa
        o.append(_f06_arc(xa + 2, xb - 2, y, MUT if n == 2 else c, 1.4 if n == 2 else 2.0, depth))
        o.append(T((xa + xb) / 2, y + depth + 15, t, "middle", sz, c, n != 2))
    return "".join(o)


# 1 節: 同じ 7 つの音（白鍵）を、C から読む・A から読む
def _f06_rotate():
    o = []
    info = {}
    hl = {60: dict(c=BLU, label="C"), 72: dict(c=BLU, label="C"), 69: dict(c=PUR, label="A"), 81: dict(c=PUR, label="A")}
    o.append(KEYBOARD(56, 14, 60, 84, ww=40, wh=96, hl=hl, names="white", info=info))
    whites = [m for m in range(60, 85) if not IS_BLACK[m % 12]]
    o.append(_f06_arcs(info, whites, 116))

    def bracket(m1, m2, yy, col, title, pat, sub, left):
        xa, xb = info[m1][0], info[m2][0]
        o.append(W(xa, yy - 7, xa, yy, xb, yy, xb, yy - 7, c=col, lw=1.8))
        whs = [m for m in whites if m1 <= m < m2]
        for k, m in enumerate(whs):
            n = whites[whites.index(m) + 1] - m
            cx = (info[m][0] + info[whites[whites.index(m) + 1]][0]) / 2
            half = n == 1
            o.append(RECT(cx - 15, yy + 6, 30, 22, 5, SSOFT if half else PAN, SIG if half else LIN, 1.2))
            o.append(T(cx, yy + 21, str(k + 1), "middle", 11.5, SIG if half else MUT, half))
        xt, an = (xa - 14, "end") if left else (xb + 14, "start")
        o.append(T(xt, yy + 4, title, an, 12, col, True))
        o.append(T(xt, yy + 21, pat, an, 11.5, INK))
        o.append(T(xt, yy + 37, sub, an, 10.5, MUT))
    bracket(60, 72, 170, BLU, "C から C まで", "全・全・半・全・全・全・半", "（半は 3・7 番目）", False)
    bracket(69, 81, 226, PUR, "A から A まで", "全・半・全・全・半・全・全", "（半は 2・5 番目）", True)
    return SVG(712, 272, o, "C から上の白鍵を順に並べ、隣どうしの間に全（全音）・半（半音）を書いた。半音は E–F と B–C の 2 か所だけである。"
               "同じ並びを C から 7 つ読むと全・全・半・全・全・全・半、A から 7 つ読むと全・半・全・全・半・全・全になる。"
               "半音の場所は同じで、読み始める位置だけが違う。")
F["e06_rotate"] = _f06_rotate()


# 2 節: C 長音階と C 自然短音階（主音から見た音程）
def _f06_compare():
    o = []
    s = 10
    st0 = staff_start(s)
    maj = spell_scale("C4", MAJOR, 8)
    nat = spell_scale("C4", NAT_MINOR, 8)
    for r, (title, sc, col) in enumerate([("C 長音階", maj, BLU), ("C 自然短音階", nat, PUR)]):
        y = 8 + r * 122
        o.append(T(16, y + 16, title, "start", 12.5, col, True))
        items = []
        for i, n in enumerate(sc):
            d, semis, q = _f06_iname(sc[0], n)
            low = parse(n)["midi"] != parse(maj[i])["midi"]
            lab = "主音" if i == 0 else "%s %d 度" % (q, d)
            items.append(dict(x=st0 + 8 + i * 56, notes=[n], fill=PUR if low else INK, label=lab,
                              lcol=MUT if i == 0 else _F06_QCOL[q], lsz=10.5))
        o.append(STAFF(12, y + 30, st0 + 8 + 7 * 56 + 28, s=s, clef="treble", items=items))
        info = {}
        hl = {}
        for i, n in enumerate(sc[:7]):
            m = parse(n)["midi"]
            low = m != parse(maj[i])["midi"]
            hl[m] = dict(c=PUR if low else col, label=nname(n, False), strong=low)
        o.append(KEYBOARD(516, y + 24, 60, 72, ww=24, wh=76, hl=hl, names=None, info=info))
    return SVG(712, 250, o, "主音を C にそろえて、長音階（上）と自然短音階（下）を比べた。音符の下は、主音からその音までの音程である。"
               "自然短音階では、第 3 音・第 6 音・第 7 音（紫）が半音低く、主音から見た 3 度・6 度・7 度が長から短に変わる。")
F["e06_compare"] = _f06_compare()


# 2 節: 主音からの半音の数を、全・半を足して求める（筆算）
def _f06_sums():
    o = []
    cols = ["第 1 音", "第 2 音", "第 3 音", "第 4 音", "第 5 音", "第 6 音", "第 7 音", "上の主音"]
    X = lambda j: 172 + j * 72
    for j, c in enumerate(cols):
        o.append(T(X(j), 18, c, "middle", 11, MUT, True))
    maj = spell_scale("C4", MAJOR, 8)
    nat = spell_scale("C4", NAT_MINOR, 8)
    cm, cn = [0], [0]
    for a, b in zip(MAJOR, NAT_MINOR):
        cm.append(cm[-1] + a)
        cn.append(cn[-1] + b)

    def block(y, title, sc, steps, cum, col, mark):
        o.append(T(16, y, title, "start", 12, col, True))
        for j, n in enumerate(sc):
            o.append(T(X(j), y, nname(n, False), "middle", 12.5, INK, True))
        for j, st in enumerate(steps):
            t, c = _f06_step(st)
            o.append(T((X(j) + X(j + 1)) / 2, y + 22, "%s +%d" % (t, st), "middle", 10.5, c, st == 1))
        o.append(T(16, y + 49, "主音からの半音", "start", 10.5, MUT))
        for j in range(8):
            hi = mark and cm[j] != cn[j]
            o.append(RECT(X(j) - 17, y + 31, 34, 25, 5, PSOFT if hi else PAN, PUR if hi else LIN, 1.4 if hi else 1.1))
            o.append(T(X(j), y + 49, str(cum[j]), "middle", 12.5, PUR if hi else INK, True))
    block(46, "C 長音階", maj, MAJOR, cm, BLU, False)
    block(132, "C 自然短音階", nat, NAT_MINOR, cn, PUR, True)
    y = 222
    o.append(T(16, y, "差", "start", 12, INK, True))
    for j in range(8):
        d = cm[j] - cn[j]
        o.append(T(X(j), y, str(d), "middle", 12.5, PUR if d else MUT, bool(d)))
    y = 250
    o.append(T(16, y, "主音から見た音程", "start", 11, INK, True))
    for j in range(1, 8):
        d = cm[j] - cn[j]
        if d:
            o.append(T(X(j), y, "長 → 短", "middle", 11, PUR, True))
        else:
            o.append(T(X(j), y, "同じ", "middle", 11, MUT))
    return SVG(712, 262, o, "主音から第 n 音までの半音の数は、全（+2）と半（+1）を順に足して求まる。"
               "自然短音階は半（+1）を長音階より先に通るので、第 3 音と、第 6 音・第 7 音のところで和が 1 小さくなり（紫）、長音階が半を通るところで再び等しくなる。")
F["e06_sums"] = _f06_sums()


# 2 節: 第 3 音だけ・第 6・7 音だけを変えた並び（2 × 2）
def _f06_isolate():
    o = []
    s = 8
    st0 = staff_start(s)
    lx, cw, ch = 112, 296, 104
    heads = ["第 6・7 音は A・B（長 6 度・長 7 度）", "第 6・7 音は A♭・B♭（短 6 度・短 7 度）"]
    rowl = [("第 3 音は E", "（長 3 度）", BLU), ("第 3 音は E♭", "（短 3 度）", PUR)]
    names = {(0, 0): "長音階", (0, 1): "第 6・7 音だけを下げた並び", (1, 0): "第 3 音だけを下げた並び", (1, 1): "自然短音階"}
    for c in range(2):
        o.append(T(lx + c * cw + cw / 2, 18, heads[c], "middle", 11, INK, True))
    for r in range(2):
        y = 30 + r * ch
        t1, t2, rc = rowl[r]
        o.append(T(lx - 12, y + 52, t1, "end", 11.5, rc, True))
        o.append(T(lx - 12, y + 69, t2, "end", 11, rc))
        for c in range(2):
            x = lx + c * cw
            o.append(RECT(x + 4, y + 2, cw - 8, ch - 8, 8, PAN, rc, 1.3))
            o.append(T(x + 16, y + 21, names[(r, c)], "start", 11.5, INK, True))
            notes = ["C4", "D4", "Eb4" if r else "E4", "F4", "G4", "Ab4" if c else "A4", "Bb4" if c else "B4", "C5"]
            items = []
            for i, n in enumerate(notes):
                low = (i == 2 and r == 1) or (i in (5, 6) and c == 1)
                items.append(dict(x=st0 + 4 + i * 27, notes=[n], fill=PUR if low else INK))
            o.append(STAFF(x + 14, y + 32, st0 + 4 + 7 * 27 + 18, s=s, clef="treble", items=items))
    return SVG(712, 30 + 2 * ch, o, "C 長音階の第 3 音だけ、または第 6 音・第 7 音だけを半音下げた並び（紫が下げた音）。"
               "枠の色は第 3 音で分けた（青: 主音から長 3 度、紫: 短 3 度）。")
F["e06_isolate"] = _f06_isolate()


# 3 節: 第 7 音と主音の間（導音があるか）
def _f06_leading():
    o = []
    panels = [("長音階（C 長音階）", "第 7 音 B → 主音 C", 67, 72, 71, "B", 72, "C", BLU, True),
              ("自然短音階（A 自然短音階）", "第 7 音 G → 主音 A", 64, 69, 67, "G", 69, "A", PUR, False),
              ("和声的短音階（A 和声的短音階）", "第 7 音 G♯ → 主音 A", 64, 69, 68, "G♯", 69, "A", PUR, True)]
    pw = 234
    for k, (title, sub, lo, hi, m7, l7, m1, l1, col, lead) in enumerate(panels):
        x = 4 + k * (pw + 3)
        cx = x + pw / 2
        o.append(RECT(x, 4, pw, 214, 10, PAN, SIG if lead else LIN, 1.3))
        o.append(T(cx, 27, title, "middle", 11.5, col, True))
        info = {}
        hl = {m7: dict(c=SIG if lead else MUT, label=l7, strong=True), m1: dict(c=col, label=l1, strong=True)}
        kx = cx - kb_width(lo, hi, 38) / 2
        o.append(KEYBOARD(kx, 42, lo, hi, ww=38, wh=86, hl=hl, names=None, info=info))
        n = m1 - m7
        xa, xb = info[m7][0], info[m1][0]
        o.append(_f06_arc(xa + 2, xb - 2, 136, SIG if lead else MUT, 2.2, 9))
        o.append(T((xa + xb) / 2, 168, "半音" if n == 1 else "全音", "middle", 12, SIG if lead else INK, True))
        o.append(T(cx, 190, sub, "middle", 11, INK))
        o.append(T(cx, 208, "→ 導音" if lead else "→ 導音ではない", "middle", 11.5, SIG if lead else MUT, True))
    return SVG(712, 222, o, "第 7 音から主音への間。長音階と和声的短音階では半音で、第 7 音は導音である。"
               "自然短音階では全音なので、第 7 音は導音ではない。")
F["e06_leading"] = _f06_leading()


# 3 節: A 和声的短音階（鍵盤の間と五線）
def _f06_harmonic():
    o = []
    sc = spell_scale("A3", HARM_MINOR, 8)
    ms = [parse(n)["midi"] for n in sc]
    info = {}
    hl = {}
    for i, (n, m) in enumerate(zip(sc, ms)):
        hl[m] = dict(c=SIG if i == 6 else PUR, label=nname(n, False), strong=(i == 6))
    o.append(KEYBOARD(16, 14, 57, 69, ww=40, wh=100, hl=hl, names=None, info=info))
    o.append(_f06_arcs(info, ms, 120))
    s = 9
    st0 = staff_start(s)
    items = []
    for i, n in enumerate(sc):
        items.append(dict(x=st0 + 6 + i * 32, notes=[n], fill=SIG if i == 6 else INK,
                          label=str(i + 1) if i < 7 else "", lcol=MUT, lsz=10.5, lbold=False, label_dy=4.6 * s))
    o.append(STAFF(372, 30, st0 + 6 + 7 * 32 + 22, s=s, clef="treble", items=items))
    o.append(T(380, 166, "第 6 音 F → 第 7 音 G♯: 増 2 度（半音 3 つ）", "start", 11, ALI, True))
    o.append(T(380, 186, "第 7 音 G♯ → 主音 A: 半音（G♯ は導音）", "start", 11, SIG, True))
    return SVG(712, 198, o, "A 和声的短音階。A 自然短音階の第 7 音 G を半音上げて G♯ にした。"
               "隣どうしの間は全・半・全・全・半・増 2 度・半で、第 6 音と第 7 音の間だけが半音 3 つに広がる。五線の下の数字は第 n 音の番号。")
F["e06_harmonic"] = _f06_harmonic()


# 3 節: 綴り方の良い例と悪い例（G♯ と A♭）
def _f06_spell():
    o = []
    s = 8
    st0 = staff_start(s)
    cases = [("良い例: 第 7 音を G♯ と書く", ["A3", "B3", "C4", "D4", "E4", "F4", "G#4", "A4"], GRN2),
             ("悪い例: 第 7 音を A♭ と書く", ["A3", "B3", "C4", "D4", "E4", "F4", "Ab4", "A4"], ALI)]
    pw = 349
    for k, (title, notes, col) in enumerate(cases):
        x = 4 + k * (pw + 6)
        o.append(RECT(x, 4, pw, 226, 10, PAN, col, 1.5))
        o.append(T(x + 16, 28, title, "start", 12, col, True))
        items = [dict(x=st0 + 8 + i * 34, notes=[n], fill=col if i == 6 else INK) for i, n in enumerate(notes)]
        o.append(STAFF(x + 14, 50, st0 + 8 + 7 * 34 + 20, s=s, clef="treble", items=items))
        cnt = {L: 0 for L in LETTERS}
        for n in notes[:7]:
            cnt[parse(n)["letter"]] += 1
        o.append(T(x + 16, 150, "第 1〜第 7 音で使った文字", "start", 10.5, MUT))
        for j, L in enumerate("ABCDEFG"):
            cx = x + 37 + j * 46
            ok = cnt[L] == 1
            o.append(RECT(cx - 18, 160, 36, 46, 6, GSOFT if ok else ASOFT, GRN2 if ok else ALI, 1.3))
            o.append(T(cx, 180, L, "middle", 13.5, INK, True))
            o.append(T(cx, 198, "%d 回" % cnt[L], "middle", 10.5, GRN2 if ok else ALI, not ok))
    return SVG(712, 234, o, "A 和声的短音階の第 7 音は、G を半音上げた G♯ と書く（左）。同じ高さの A♭ と書くと（右）、"
               "A の文字が 2 回使われて G が抜け、五線では A♭ と上の A が同じ位置に並ぶ。7 つの文字を 1 回ずつ使うきまり（05 章 3 節）に合うのは G♯ である。")
F["e06_spell"] = _f06_spell()


# 4 節: 第 5 音から上の主音まで（完全 4 度 = 半音 5）を 3 つの間に分ける
def _f06_upper():
    o = []
    rows = [("自然短音階", ["E4", "F4", "G4", "A4"]),
            ("和声的短音階", ["E4", "F4", "G#4", "A4"]),
            ("第 6・7 音を上げた形", ["E4", "F#4", "G#4", "A4"])]
    o.append(T(270, 18, "第 5 音から上の主音まで", "middle", 11, MUT, True))
    o.append(T(430, 18, "間の半音の数", "middle", 11, MUT, True))
    o.append(T(430, 33, "a + b + c", "middle", 11, MUT, False, True))
    o.append(T(552, 18, "導音", "middle", 11, MUT, True))
    o.append(T(552, 33, "（c = 1）", "middle", 10.5, MUT))
    o.append(T(652, 18, "全音より広い間", "middle", 11, MUT, True))
    for r, (title, notes) in enumerate(rows):
        y = 46 + r * 96
        ms = [parse(n)["midi"] for n in notes]
        gaps = [b - a for a, b in zip(ms, ms[1:])]
        lead, wide = gaps[2] == 1, max(gaps) > 2
        o.append(T(16, y + 30, title, "start", 12, PUR, True))
        o.append(T(16, y + 50, "  ".join(nname(n, False) for n in notes), "start", 11.5, INK))
        info = {}
        hl = {}
        for i, m in enumerate(ms):
            hl[m] = dict(c=SIG if (i == 2 and lead) else PUR, label=nname(notes[i], False), strong=(i == 2 and lead))
        o.append(KEYBOARD(190, y, 64, 69, ww=40, wh=54, hl=hl, names=None, info=info))
        o.append(_f06_arcs(info, ms, y + 58, depth=6, sz=10.5))
        o.append(T(430, y + 34, "%d + %d + %d = 5" % tuple(gaps), "middle", 13, INK, True, True))
        o.append(T(552, y + 34, "あり" if lead else "なし", "middle", 12.5, GRN2 if lead else ALI, True))
        o.append(T(652, y + 34, "あり（増 2 度）" if wide else "なし", "middle", 12.5, ALI if wide else GRN2, True))
    return SVG(712, 46 + 3 * 96 - 4, o, "A を主音とする 3 種類の短音階の、第 5 音 E から上の主音 A までの部分。全体は完全 4 度（半音 5 つ）で、"
               "間に第 6 音と第 7 音が入る。導音を残し（最後の間 c が半音）、全音より広い間を作らない分け方は、3 段目の 2 + 2 + 1 だけである。")
F["e06_upper"] = _f06_upper()


# 4 節: A 旋律的短音階の上行と下行
def _f06_melodic():
    o = []
    s = 9
    st0 = staff_start(s)
    up = spell_scale("A3", MEL_MINOR, 8)
    down = list(reversed(spell_scale("A3", NAT_MINOR, 8)))

    def one(x, title, notes, hi, hcol):
        o.append(T(x, 20, title, "start", 12, INK, True))
        items = [dict(x=st0 + 6 + i * 34, notes=[n], fill=hcol if i in hi else INK) for i, n in enumerate(notes)]
        o.append(STAFF(x, 46, st0 + 6 + 7 * 34 + 20, s=s, clef="treble", items=items))
        ms = [parse(n)["midi"] for n in notes]
        for i in range(7):
            st = abs(ms[i + 1] - ms[i])
            t, c = _f06_step(st)
            o.append(T(x + st0 + 6 + i * 34 + 17, 136, t, "middle", 11.5, c, st == 1))
    one(12, "上行: 第 6 音・第 7 音を上げる（F♯・G♯）", up, (5, 6), SIG)
    one(372, "下行: 自然短音階に戻す（G・F）", down, (1, 2), PUR)
    return SVG(712, 148, o, "A 旋律的短音階。上行（左）では第 6 音・第 7 音を F♯・G♯ に上げ、隣どうしの間は全・半・全・全・全・全・半になる。"
               "下行（右）では自然短音階の G・F に戻す。五線の下は隣どうしの間。")
F["e06_melodic"] = _f06_melodic()


# 4 節: 4 つの音階を、主音からの半音の数の目盛に並べる
def _f06_three():
    o = []
    X = lambda sm: 200 + sm * 38
    rows = [("C 長音階", MAJOR), ("C 自然短音階", NAT_MINOR), ("C 和声的短音階", HARM_MINOR), ("C 旋律的短音階（上行）", MEL_MINOR)]
    cmaj = [0, 2, 4, 5, 7, 9, 11, 12]
    o.append(T(X(0) - 16, 20, "主音からの半音の数", "end", 10.5, MUT))
    for sm in range(13):
        o.append(T(X(sm), 20, str(sm), "middle", 10.5, MUT))
        o.append(W(X(sm), 28, X(sm), 268, c=LIN, lw=0.9, dash="2,4"))
    for r, (title, steps) in enumerate(rows):
        y = 60 + r * 60
        sc = spell_scale("C4", steps, 8)
        cum = [0]
        for st in steps:
            cum.append(cum[-1] + st)
        o.append(T(16, y + 5, title, "start", 12, BLU if r == 0 else PUR, True))
        for i in range(7):
            t, c = _f06_step(steps[i])
            o.append(W(X(cum[i]) + 7, y, X(cum[i + 1]) - 7, y, c=MUT if steps[i] == 2 else c, lw=1.5 if steps[i] == 2 else 2.6))
            o.append(T((X(cum[i]) + X(cum[i + 1])) / 2, y - 8, t, "middle", 10.5, c, steps[i] != 2))
        for i in range(8):
            low = cum[i] != cmaj[i]
            o.append(CIRC(X(cum[i]), y, 6, PUR if low else INK, 1.5, PUR if low else PAN))
            o.append(T(X(cum[i]), y + 23, nname(sc[i], False), "middle", 11.5, PUR if low else INK, low))
    return SVG(712, 276, o, "C を主音とする 4 つの音階を、主音からの半音の数の目盛に並べた（紫は、同じ主音の長音階より半音低い音）。"
               "3 種類の短音階は第 1 音〜第 5 音（C D E♭ F G）が同じで、違いは第 6 音・第 7 音だけである。旋律的短音階の下行は、自然短音階と同じ音を使う。")
F["e06_three"] = _f06_three()


# 5 節: 同じ 7 音を使う組と、同じ主音の組
def _f06_pairs():
    o = []
    rows = [("A 自然短音階", "A B C D E F G", [9, 11, 0, 2, 4, 5, 7], ["A", "B", "C", "D", "E", "F", "G"], 9, PUR, ()),
            ("C 長音階", "C D E F G A B", [0, 2, 4, 5, 7, 9, 11], ["C", "D", "E", "F", "G", "A", "B"], 0, BLU, ()),
            ("C 自然短音階", "C D E♭ F G A♭ B♭", [0, 2, 3, 5, 7, 8, 10], ["C", "D", "E♭", "F", "G", "A♭", "B♭"], 0, PUR, (3, 8, 10))]
    yc = []
    for r, (title, seq, pcs, labs, tonic, col, diff) in enumerate(rows):
        y = 10 + r * 102
        o.append(T(16, y + 30, title, "start", 12.5, col, True))
        o.append(T(16, y + 50, seq, "start", 11.5, INK))
        info = {}
        hl = {}
        for pc, lab in zip(pcs, labs):
            if pc == tonic:
                hl[60 + pc] = dict(c=col, label=lab, strong=True)
            elif pc in diff:
                hl[60 + pc] = dict(c=SIG, label=lab, strong=True)
            else:
                hl[60 + pc] = dict(c=col, label=lab, strong=False)
        o.append(KEYBOARD(176, y, 60, 71, ww=36, wh=72, hl=hl, names=None, info=info))
        o.append(T(info[60 + tonic][0], y + 88, "主音", "middle", 10.5, col, True))
        yc.append(y + 36)
    x = 448
    o.append(W(x, yc[0], x + 8, yc[0], x + 8, yc[1] - 5, x, yc[1] - 5, c=GRN2, lw=1.8))
    o.append(T(x + 22, (yc[0] + yc[1]) / 2 - 6, "同じ 7 つの音を使う", "start", 12, GRN2, True))
    o.append(T(x + 22, (yc[0] + yc[1]) / 2 + 12, "主音が違う（A と C）", "start", 11, INK))
    o.append(W(x, yc[1] + 5, x + 8, yc[1] + 5, x + 8, yc[2], x, yc[2], c=SIG, lw=1.8))
    o.append(T(x + 22, (yc[1] + yc[2]) / 2 - 6, "主音が同じ（C）", "start", 12, SIG, True))
    o.append(T(x + 22, (yc[1] + yc[2]) / 2 + 12, "3 つの音が違う（E♭・A♭・B♭）", "start", 11, INK))
    return SVG(712, 10 + 3 * 102 - 6, o, "1 オクターブ分の鍵盤に、3 つの音階が使う音を示した（濃い色の鍵が主音）。"
               "A 自然短音階と C 長音階は同じ 7 つの音（白鍵）を使い、主音だけが違う。C 長音階と C 自然短音階は主音が同じで、"
               "第 3 音・第 6 音・第 7 音の 3 つ（E♭・A♭・B♭。色を変えた鍵）が違う。")
F["e06_pairs"] = _f06_pairs()
