# 13 章 ノンダイアトニックコード の図（figures.py の関数・定数をそのまま使う）

_f13_IN = {0, 2, 4, 5, 7, 9, 11}      # ハ長調の音（C から数えた半音の数）


def _f13_chk(sym, notes, part=False):
    """音名の列 notes が、コードネーム sym の構成音と一致するか（part=True なら一部か）を確かめる（書き間違いの検出）"""
    c = chord_parse(sym)
    want = sorted(set((c["root_pc"] + v) % 12 for v in c["ivs"]))
    got = sorted(set(parse(n)["midi"] % 12 for n in notes))
    assert (set(got) <= set(want) and c["root_pc"] in got) if part else want == got, (sym, notes, want, got)
    return notes


def _f13_out(n):
    """音名 n がハ長調の外の音か"""
    return parse(n)["midi"] % 12 not in _f13_IN


def _f13_heads(info, key):
    """STAFF の info から、ある和音の符頭の位置を {音名: (x, y)} で返す（低い音から順に入っている）"""
    return info[key]


def _f13_label_notes(x, y, notes, col_of, sz=11, step=None, anchor="middle"):
    """音名を 1 つずつ並べて書く（音ごとに色を変えるため）。x は中央（anchor=middle）か左端"""
    o = []
    names = [nname(n, False) for n in notes]
    step = step or (sz * 1.75)
    x0 = x - step * (len(names) - 1) / 2 if anchor == "middle" else x
    for i, (n, nm) in enumerate(zip(notes, names)):
        c = col_of(n)
        o.append(T(x0 + i * step, y, nm, "middle", sz, c, c != INK and c != MUT))
    return "".join(o)


def _f13_voice_rows(X, y0, rows, numx=160, dy=17):
    """各声部の音の動きを、音名の列と半音の数で書く。rows = [(見出し, [音名...])]"""
    o = []
    for i, (lab, ns) in enumerate(rows):
        y = y0 + i * dy
        o.append(T(X, y, lab, "start", 11, MUT))
        o.append(T(X + 56, y, " → ".join(nname(n, False) for n in ns), "start", 11, INK, True))
        for k in range(len(ns) - 1):
            d = parse(ns[k + 1])["midi"] - parse(ns[k])["midi"]
            c = SIG if abs(d) == 1 else (MUT if d == 0 else INK)
            t = ("+%d" % d) if d > 0 else (("−%d" % -d) if d < 0 else "0")
            o.append(T(X + numx + k * 36, y, t, "middle", 11, c, abs(d) == 1))
    return "".join(o)


# 1. ハ長調の 7 音と、調の外の 5 音
def _f13_keys():
    o = []
    info = {}
    hl = {m: dict(c=SIG, label="", strong=True) for m in range(60, 72) if IS_BLACK[m % 12]}
    x0, y0, ww, wh = 24, 52, 44, 124
    o.append(KEYBOARD(x0, y0, 60, 71, ww=ww, wh=wh, hl=hl, names="white", info=info))
    for m in range(60, 72):
        if IS_BLACK[m % 12]:
            cx = info[m][0]
            o.append(T(cx, y0 - 24, NAMES_SHARP[m % 12], "middle", 11.5, SIG, True))
            o.append(T(cx, y0 - 9, NAMES_FLAT[m % 12], "middle", 11.5, SIG, True))
    X = x0 + 7 * ww + 30
    o.append(RECT(X, 58, 22, 22, 3, KW, KL, 1.2))
    o.append(T(X + 32, 68, "白鍵 7 つ（C D E F G A B）", "start", 12, INK, True))
    o.append(T(X + 32, 85, "ハ長調の音（C 長音階）", "start", 11, MUT))
    o.append(RECT(X, 104, 22, 22, 3, SIG, SIG, 1.2))
    o.append(T(X + 32, 114, "黒鍵 5 つ", "start", 12, SIG, True))
    o.append(T(X + 32, 131, "ハ長調の外の音", "start", 11, MUT))
    o.append(W(X, 150, X + 270, 150, c=LIN, lw=1))
    o.append(T(X, 170, "白鍵だけの和音 → ダイアトニックコード", "start", 11, INK))
    o.append(T(X, 190, "黒鍵を 1 つ以上含む和音", "start", 11, SIG, True))
    o.append(T(X + 12, 207, "→ ノンダイアトニックコード", "start", 11, SIG, True))
    return SVG(660, 222, o, "ハ長調の音は C 長音階の 7 音（白鍵）で、残りの 5 音（黒鍵）がハ長調の外の音である。"
               "黒鍵の音は、♯ を付けた名前と ♭ を付けた名前のどちらでも呼べる（異名同音）。")
F["e13_keys"] = _f13_keys()


# 2. 同じ根音の和音で、1 つの音が変わるとノンダイアトニックコードになる
def _f13_pairs():
    o = []
    panels = [(0, "Dm と D7（根音 D）", ("Dm", ["D4", "F4", "A4"]), ("D7", ["D4", "F#4", "A4", "C5"]),
               "F を半音上げて F♯ にし、C を足す"),
              (356, "F と Fm（根音 F）", ("F", ["F4", "A4", "C5"]), ("Fm", ["F4", "Ab4", "C5"]),
               "A を半音下げて A♭ にする")]
    s = 9
    for px, title, a, b, note in panels:
        X = px + 14
        o.append(T(X, 22, title, "start", 12.5, INK, True))
        items = []
        for k, (sym, ns) in enumerate((a, b)):
            _f13_chk(sym, ns)
            fills = {nname(n): SIG for n in ns if _f13_out(n)}
            items.append(dict(x=96 + k * 140, notes=ns, fill=INK, fills=fills,
                              label="%s（%s）" % (sym, roman(sym, "C")), lcol=SIG if fills else INK))
        o.append(STAFF(X, 44, 320, s=s, clef="treble", items=items))
        o.append(ARR(X + 140, 32, X + 196, 32, MUT, 1.4))
        for k, (sym, ns) in enumerate((a, b)):
            kx = X + 8 + k * 166
            hl = {parse(n)["midi"]: dict(c=SIG if _f13_out(n) else BLU, label="", strong=_f13_out(n)) for n in ns}
            o.append(KEYBOARD(kx, 128, 60, 72, ww=18, wh=54, hl=hl, names=None))
            o.append(_f13_label_notes(kx + 72, 202, ns, lambda n: SIG if _f13_out(n) else INK, sz=11.5))
            o.append(T(kx + 72, 222, "ダイアトニックコード" if k == 0 else "ノンダイアトニックコード", "middle", 11,
                       INK if k == 0 else SIG, k == 1))
        o.append(T(X + 160, 246, note, "middle", 11, MUT))
    return SVG(712, 258, o, "同じ根音でも、構成音が 1 つ調の外の音に変わるとノンダイアトニックコードになる。"
               "鍵盤では、ハ長調の音を薄い青、調の外の音を赤で塗った。D7 は F♯、Fm は A♭ を含み、五線では臨時記号の付いた音として現れる。")
F["e13_pairs"] = _f13_pairs()


# 3. 別の調の五線に書くと、臨時記号が要らない
def _f13_otherkey():
    o = []
    s = 9
    rows = [("D7", ["D4", "F#4", "A4", "C5"], 1, "ト長調の五線（調号 ♯ 1 つ）", "ト長調の V7"),
            ("Fm", ["F4", "Ab4", "C5"], -3, "ハ短調の五線（調号 ♭ 3 つ）", "ハ短調の IVm")]
    for i, (sym, ns, key, head, lab) in enumerate(rows):
        _f13_chk(sym, ns)
        y = 52 + i * 112
        o.append(T(24, y + 22, sym, "start", 15, INK, True))
        fills = {nname(n): SIG for n in ns if _f13_out(n)}
        o.append(STAFF(128, y, 230, s=s, clef="treble",
                       items=[dict(x=staff_start(s, 0) + 70, notes=ns, fill=INK, fills=fills,
                                   label="調の外の音に臨時記号", lcol=SIG, lsz=10.5)]))
        o.append(T(128 + 115, y - 16, "ハ長調の五線（調号なし）", "middle", 11.5, INK, True))
        o.append(T(408 + 115, y - 16, head, "middle", 11.5, INK, True))
        o.append(STAFF(408, y, 230, s=s, clef="treble", key=key,
                       items=[dict(x=staff_start(s, key) + 60, notes=ns, fill=INK,
                                   label=lab + "（臨時記号なし）", lcol=GRN2, lsz=10.5)]))
        o.append(ARR(372, y + 18, 396, y + 18, MUT, 1.4))
    return SVG(660, 240, o, "ハ長調では臨時記号が要る D7 と Fm も、ト長調・ハ短調の五線（調号）で書くと臨時記号が要らない。"
               "D7 はト長調の V7、Fm はハ短調の IVm で、どちらもその調のダイアトニックコードである。")
F["e13_otherkey"] = _f13_otherkey()


# 4. V7 → I と、同じ形を完全 5 度上にずらした D7 → G
def _f13_v7shift():
    o = []
    s = 10
    panels = [(0, "ハ長調の V7 → I（G7 → C）", ("G7", ["G4", "B4", "D5", "F5"]), ("C", ["G4", "C5", "E5"]),
               [("B4", "C5", "B → C（半音上）: 導音が主音へ"), ("F5", "E5", "F → E（半音下）")]),
              (356, "G を主和音とみなした V7 → I（D7 → G）", ("D7", ["D4", "F#4", "A4", "C5"]), ("G", ["D4", "G4", "B4"]),
               [("F#4", "G4", "F♯ → G（半音上）: ト長調の導音が G へ"), ("C5", "B4", "C → B（半音下）")])]
    for px, title, a, b, moves in panels:
        X = px + 12
        o.append(T(X, 22, title, "start", 12.5, INK, True))
        info = {}
        items = []
        for k, (sym, ns) in enumerate((a, b)):
            _f13_chk(sym, ns)
            fills = {nname(n): SIG for n in ns if _f13_out(n)}
            items.append(dict(key=k, x=100 + k * 120, notes=ns, fill=INK, fills=fills, label=sym, lcol=INK, lsz=12))
        o.append(STAFF(X, 56, 300, s=s, clef="treble", items=items, info=info))
        for j, (n1, n2, txt) in enumerate(moves):
            i1 = sorted(a[1], key=lambda n: parse(n)["midi"]).index(n1)
            i2 = sorted(b[1], key=lambda n: parse(n)["midi"]).index(n2)
            (x1, y1), (x2, y2) = info[0][i1], info[1][i2]
            col = SIG if j == 0 else BLU
            o.append(ARR(x1 + 11, y1, x2 - 11, y2, col, 1.8))
            o.append(T(X, 158 + j * 20, txt, "start", 11, col, True))
    return SVG(712, 204, o, "左: ハ長調の V7 → I では、導音 B が半音上の C へ、7 度の音 F が半音下の E へ進む。"
               "右: G を主和音とみなすと、その V7 は D7 で、F♯ が G へ、C が B へ、まったく同じ形で進む。F♯ はハ長調の外の音である。")
F["e13_v7shift"] = _f13_v7shift()


# 5. V7/X の 4 つの音を、X の根音 r からの半音の数で表す
def _f13_secderive():
    o = []
    x0, dx = 96, 32
    X = lambda u: x0 + u * dx
    yr = 104
    o.append(W(X(-0.5), yr, X(17.5), yr, c=MUT, lw=1.2))
    for u in range(0, 18):
        o.append(W(X(u), yr - 4, X(u), yr + 4, c=MUT, lw=1))
    # V7/X の 4 つの音（上）
    tones = [(7, "根音"), (11, "3 度の音"), (14, "5 度の音"), (17, "7 度の音")]
    for u, nm in tones:
        o.append(CIRC(X(u), yr - 22, 8 if u == 11 else 6, SIG, 1.6, SIG if u == 11 else SSOFT))
        o.append(T(X(u), yr - 38, nm, "middle", 10.5, SIG, u == 11))
    for (ua, _), (ub, _), lab in zip(tones[:-1], tones[1:], ["+4", "+3", "+3"]):
        o.append(T((X(ua) + X(ub)) / 2, yr - 26, lab, "middle", 10.5, MUT, True))
    o.append(T(X(12), yr - 62, "V7/X の音: r+7, r+11, r+14, r+17", "middle", 11.5, SIG, True))
    # X の根音（下）
    for u in (0, 12):
        o.append(CIRC(X(u), yr + 22, 7, GRN2, 1.6, GSOFT))
    o.append(T(X(0), yr + 46, "X の根音 r", "middle", 11, GRN2, True))
    o.append(T(X(12), yr + 46, "r+12（1 オクターブ上の r）", "middle", 11, GRN2, True))
    o.append(ARR(X(11) + 3, yr - 14, X(12) - 4, yr + 15, SIG, 1.8))
    o.append(T(X(12) + 12, yr + 27, "半音上", "start", 10.5, SIG, True))
    # 数字と例
    for u in (0, 7, 11, 12, 14, 17):
        o.append(T(X(u), yr + 66, "r" if u == 0 else "r+%d" % u, "middle", 10.5, INK, True))
    ex = {0: "G", 7: "D", 11: "F♯", 12: "G", 14: "A", 17: "C"}
    o.append(T(8, yr + 88, "例 X = G", "start", 10.5, MUT, True))
    for u, nm in ex.items():
        o.append(T(X(u), yr + 88, nm, "middle", 11.5, SIG if u == 11 else INK, u == 11))
    return SVG(680, 202, o, "X の根音を r とし、ほかの音を r から何半音上かで表す。V7/X の 3 度の音 r+11 は、1 オクターブ上の X の根音 r+12 の"
               "ちょうど半音下にあり、X を主和音とする調の導音になる。下の段は X = G（V7/X = D7）の例。")
F["e13_secderive"] = _f13_secderive()


# 6. ハ長調の 5 つのセカンダリードミナント
def _f13_secmap():
    o = []
    s = 7
    rows = [("A7", ["A4", "C#5", "E5", "G5"], "Dm", ["A4", "D5", "F5"], "V7/IIm", "VI7", "C♯", "D",
             [("C♯（導音）", SIG)], "Am の C を C♯ に上げ、G を足した形"),
            ("B7", ["B3", "D#4", "F#4", "A4"], "Em", ["B3", "E4", "G4"], "V7/IIIm", "VII7", "D♯", "E",
             [("D♯（導音）", SIG), ("F♯（5 度の音）", SIG)], "Bdim の D・F を上げ、A を足した形"),
            ("C7", ["C4", "E4", "G4", "Bb4"], "F", ["C4", "F4", "A4"], "V7/IV", "I7", "E", "F",
             [("B♭（7 度の音）", SIG)], "導音 E はもともとハ長調の音"),
            ("D7", ["D4", "F#4", "A4", "C5"], "G", ["D4", "G4", "B4"], "V7/V", "II7", "F♯", "G",
             [("F♯（導音）", SIG)], "Dm の F を F♯ に上げ、C を足した形"),
            ("E7", ["E4", "G#4", "B4", "D5"], "Am", ["E4", "A4", "C5"], "V7/VIm", "III7", "G♯", "A",
             [("G♯（導音）", SIG)], "Em の G を G♯ に上げ、D を足した形")]
    o.append(T(20, 20, "V7/X → X", "start", 11, MUT, True))
    o.append(T(196 + 110, 20, "五線（色付きの音がハ長調の外の音）", "middle", 11, MUT, True))
    o.append(T(470, 20, "ハ長調の外の音", "start", 11, MUT, True))
    for i, (v, vn, x, xn, fn, dg, lt, rt, outs, note) in enumerate(rows):
        _f13_chk(v, vn); _f13_chk(x, xn)
        y0 = 34 + i * 72
        o.append(RECT(10, y0, 692, 64, 8, PAN, LIN, 1))
        o.append(T(22, y0 + 24, "%s → %s" % (v, x), "start", 14, INK, True))
        o.append(T(22, y0 + 44, "%s → %s" % (fn, roman(x, "C")), "start", 11, MUT))
        o.append(T(22, y0 + 59, "ディグリーネーム %s" % dg, "start", 10, MUT))
        info = {}
        fills = {nname(n): SIG for n in vn if _f13_out(n)}
        items = [dict(key=0, x=70, notes=vn, fill=INK, fills=fills), dict(key=1, x=176, notes=xn, fill=INK)]
        st_y = y0 + 16
        o.append(STAFF(196, st_y, 230, s=s, clef="treble", items=items, info=info))
        # 導音 → X の根音（細い線）
        lo = [n for n in sorted(vn, key=lambda n: parse(n)["midi"])]
        li = [nname(n, False) for n in lo].index(lt)
        ro = [nname(n, False) for n in sorted(xn, key=lambda n: parse(n)["midi"])].index(rt)
        (x1, y1), (x2, y2) = info[0][li], info[1][ro]
        o.append(W(x1 + 8, y1, x2 - 8, y2, c=SIG if lt != "E" else BLU, lw=1.3, dash="3,3"))
        for k, (t, c) in enumerate(outs):
            o.append(T(470 + k * 108, y0 + 26, t, "start", 12, c, True))
        o.append(T(470, y0 + 48, note, "start", 10.5, MUT))
    return SVG(712, 34 + 5 * 72 + 4, o, "ハ長調のダイアトニックコードのうち、長三和音・短三和音の 5 つへのセカンダリードミナント。"
               "破線は、V7/X の 3 度の音（X の導音）から X の根音への半音の動き。5 つのうち 4 つでは導音そのものが調の外の音になる。"
               "V7/IV（C7）だけは導音 E がハ長調の音で、7 度の音 B♭ が調の外の音である。")
F["e13_secmap"] = _f13_secmap()


# 7. ハ長調とハ短調のダイアトニックコード
def _f13_parallel():
    o = []
    MAJ = [("C", "CM7"), ("Dm", "Dm7"), ("Em", "Em7"), ("F", "FM7"), ("G", "G7"), ("Am", "Am7"), ("Bdim", "Bm7(b5)")]
    MIN = [("Cm", "Cm7"), ("Ddim", "Dm7(b5)"), ("Eb", "EbM7"), ("Fm", "Fm7"), ("Gm", "Gm7"), ("Ab", "AbM7"), ("Bb", "Bb7")]
    sc_maj = spell_scale("C4", MAJOR, 14)
    sc_min = spell_scale("C4", NAT_MINOR, 14)
    x0, cw = 100, 86
    for j in range(7):
        o.append(T(x0 + j * cw + cw / 2, 22, ["I", "II", "III", "IV", "V", "VI", "VII"][j], "middle", 11, MUT, True))
    def disp(sym):
        return sym.replace("b5", "♭5").replace("Eb", "E♭").replace("Ab", "A♭").replace("Bb", "B♭")
    for band, (title, chords, sc) in enumerate([("ハ長調", MAJ, sc_maj), ("ハ短調", MIN, sc_min)]):
        yb = 32 + band * 128
        o.append(RECT(8, yb, 696, 120, 10, PAN, LIN, 1.1))
        o.append(T(20, yb + 66, title, "start", 13.5, INK, True))
        for j, (tri, sev) in enumerate(chords):
            cx = x0 + j * cw + cw / 2
            for r, (sym, n) in enumerate(((tri, 3), (sev, 4))):
                ns = [sc[j + 2 * k] for k in range(n)]
                _f13_chk(sym, ns)
                y = yb + 20 + r * 54
                o.append(T(cx, y, disp(sym), "middle", 13, INK, True))
                o.append(T(cx, y + 15, roman(sym, "C"), "middle", 11, MUT))
                o.append(_f13_label_notes(cx, y + 32, ns, lambda q: SIG if _f13_out(q) else INK, sz=11.5,
                                          step=20 if n == 4 else 22))
    return SVG(712, 32 + 2 * 128, o, "ハ長調とハ短調（自然短音階）のダイアトニックコード（上の行が三和音、下の行がセブンスコード）。"
               "同じ番号の和音は同じ文字を使い、E・A・B が E♭・A♭・B♭ に変わる（色付きの音）。ハ短調の 7 つの和音は、"
               "どれもハ長調の外の音を含む。ディグリーネームは C 長音階を基準に ♭ を付けて書く。")
F["e13_parallel"] = _f13_parallel()


# 8. IV → I と IV → IVm → I の声部の動き
def _f13_ivm():
    o = []
    s = 10
    panels = [(0, 300, "IV → I（F → C）", [("F", ["F4", "A4", "C5"]), ("C", ["E4", "G4", "C5"])],
               "半音で動く声部: 1 つ（F → E）"),
              (318, 394, "IV → IVm → I（F → Fm → C）", [("F", ["F4", "A4", "C5"]), ("Fm", ["F4", "Ab4", "C5"]), ("C", ["E4", "G4", "C5"])],
               "IVm → I で半音で動く声部: 2 つ（F → E、A♭ → G）")]
    for px, pw, title, chords, summary in panels:
        X = px + 12
        o.append(T(X, 22, title, "start", 12.5, INK, True))
        info = {}
        items = []
        gap = 140 if len(chords) == 2 else 120
        for k, (sym, ns) in enumerate(chords):
            _f13_chk(sym, ns)
            fills = {nname(n): PUR for n in ns if _f13_out(n)}
            items.append(dict(key=k, x=86 + k * gap, notes=ns, fill=INK, fills=fills,
                              label="%s（%s）" % (sym, roman(sym, "C")), lcol=PUR if fills else INK, lsz=11.5))
        o.append(STAFF(X, 50, pw - 24, s=s, clef="treble", items=items, info=info))
        srt = [sorted(ns, key=lambda n: parse(n)["midi"]) for _, ns in chords]
        for k in range(len(chords) - 1):
            for v in range(3):
                (x1, y1), (x2, y2) = info[k][v], info[k + 1][v]
                d = parse(srt[k + 1][v])["midi"] - parse(srt[k][v])["midi"]
                col = SIG if abs(d) == 1 else (MUT if d == 0 else INK)
                o.append(W(x1 + 10, y1, x2 - 10, y2, c=col, lw=1.8 if d else 1.0, dash=None if d else "3,3"))
        rows = [(nm, [srt[k][v] for k in range(len(chords))]) for v, nm in ((2, "上の声部"), (1, "中の声部"), (0, "下の声部"))]
        o.append(_f13_voice_rows(X, 146, rows, numx=196 if len(chords) == 3 else 156))
        o.append(T(X, 206, summary, "start", 11.5, INK, True))
    o.append(T(12, 230, "数字は各声部が動く半音の数（− は下へ、0 は動かない）。色の線と赤い数字は半音の動き。", "start", 10.5, MUT))
    return SVG(712, 240, o, "左: IV → I では F → E が半音、A → G が全音で動く。右: IV と I の間に IVm をはさむと、A → A♭ → G と 1 つの声部が"
               "半音ずつ下がり、IVm → I では F → E と A♭ → G の 2 つの声部が半音で動く。C はどちらでも動かない。")
F["e13_ivm"] = _f13_ivm()


# 9. サブドミナントマイナーの和音は A♭ を含む
def _f13_sdm():
    o = []
    s = 8
    chords = [("Dm7(b5)", "IIm7(♭5)", ["D4", "F4", "Ab4", "C5"], "Ab4", "G4"),
              ("Fm", "IVm", ["F4", "Ab4", "C5"], "Ab4", "G4"),
              ("AbM7", "♭VIM7", ["Ab4", "C5", "Eb5", "G5"], "Ab4", "G4"),
              ("Bb7", "♭VII7", ["Bb4", "D5", "F5", "Ab5"], "Ab5", "G5")]
    for k, (sym, dg, ns, ab, g) in enumerate(chords):
        _f13_chk(sym, ns)
        px = 6 + k * 176
        o.append(RECT(px, 8, 168, 186, 10, PAN, LIN, 1))
        disp = sym.replace("b5", "♭5").replace("Ab", "A♭").replace("Bb", "B♭")
        o.append(T(px + 84, 30, "%s（%s）" % (disp, dg), "middle", 12, INK, True))
        info = {}
        items = [dict(key=0, x=staff_start(s) + 18, notes=ns, fill=INK, fills={nname(ab): PUR}),
                 dict(key=1, x=staff_start(s) + 74, notes=[g], fill=MUT)]
        o.append(STAFF(px + 8, 64, 152, s=s, clef="treble", items=items, info=info))
        i_ab = sorted(ns, key=lambda n: parse(n)["midi"]).index(ab)
        (x1, y1), (x2, y2) = info[0][i_ab], info[1][0]
        o.append(ARR(x1 + 9, y1, x2 - 9, y2, PUR, 1.6))
        o.append(T(px + 84, 150, "A♭ → G（半音下）", "middle", 11, PUR, True))
        o.append(_f13_label_notes(px + 84, 176, ns, lambda q: PUR if parse(q)["midi"] % 12 == 8 else INK, sz=11))
    return SVG(712, 200, o, "サブドミナントマイナーとして使われる 4 つの和音。どれもハ短調から借りた A♭ を含み、"
               "A♭ が半音下の G（I の 5 度の音であり、V の根音でもある）へ進める。灰色の音符は進む先の G。")
F["e13_sdm"] = _f13_sdm()


# 10. G7 と D♭7 は三全音 B–F を共有する
def _f13_tritone():
    o = []
    cx, cy, r = 150, 146, 96
    names = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
    P = lambda k: (cx + r * math.cos(math.radians(-90 + 30 * k)), cy + r * math.sin(math.radians(-90 + 30 * k)))
    o.append(CIRC(cx, cy, r, LIN, 1.2))
    g7, db7 = [7, 11, 2, 5], [1, 5, 8, 11]
    o.append(TRI([P(k) for k in g7], BLU, 1.8, BSOFT))
    o.append(TRI([P(k) for k in db7], GLD, 1.8, GOSOFT))
    o.append(W(P(11)[0], P(11)[1], P(5)[0], P(5)[1], c=SIG, lw=3.6))
    o.append(W(P(7)[0], P(7)[1], P(1)[0], P(1)[1], c=MUT, lw=1.2, dash="4,4"))
    for k in range(12):
        x, y = P(k)
        if k in (11, 5):
            c, rr = SIG, 8
        elif k in (7, 2):
            c, rr = BLU, 7
        elif k in (1, 8):
            c, rr = GLD, 7
        else:
            c, rr = MUT, 3.2
        o.append(CIRC(x, y, rr, c, 1.4, c if rr > 4 else PAN))
        lx, ly = cx + (r + 19) * math.cos(math.radians(-90 + 30 * k)), cy + (r + 19) * math.sin(math.radians(-90 + 30 * k)) + 4
        lab = "B（C♭）" if k == 11 else names[k]
        o.append(T(lx + (12 if k == 11 else 0), ly, lab, "middle", 11.5, INK if rr > 4 else MUT, rr > 4))
    # 鍵盤
    X = 316
    for i, (sym, ns, own, title) in enumerate([("G7", ["F4", "G4", "B4", "D5"], BLU, "G7（G B D F）"),
                                               ("Db7", ["Db4", "F4", "Ab4", "Cb5"], GLD, "D♭7（D♭ F A♭ C♭）")]):
        _f13_chk(sym, ns)
        y = 30 + i * 118
        o.append(T(X, y, title, "start", 12.5, own, True))
        hl = {}
        for n in ns:
            m = parse(n)["midi"]
            shared = m % 12 in (5, 11)
            hl[m] = dict(c=SIG if shared else own, label=nname(n, False), strong=True)
        o.append(KEYBOARD(X, y + 12, 60, 76, ww=26, wh=74, hl=hl, names=None))
    o.append(T(X, 264, "共有する三全音: B と F（半音 6 つ）", "start", 11.5, SIG, True))
    o.append(T(X, 282, "根音 G と D♭ も半音 6 つ離れている（円の反対側）", "start", 11, MUT))
    return SVG(660, 294, o, "左: 12 の音を円に半音ずつ並べた図。G7（青）と D♭7（金）は、円の中心をはさんだ三全音 B–F（太線）を共有する。"
               "D♭7 の四角形は、G7 の四角形を円の中心のまわりに半周回したものである。右: 鍵盤では、F と B（D♭7 では C♭）が同じ鍵になる。")
F["e13_tritone"] = _f13_tritone()


# 11. IIm7 → V7 → I と IIm7 → ♭II7 → I
def _f13_ura():
    o = []
    s = 8
    panels = [(0, "IIm7 → V7 → I", [("Dm7", "D3", ["F4", "A4", "C5"]), ("G7", "G2", ["F4", "G4", "B4"]), ("C", "C3", ["E4", "G4", "C5"])]),
              (356, "IIm7 → ♭II7 → I（裏コード）", [("Dm7", "D3", ["F4", "A4", "C5"]), ("Db7", "Db3", ["F4", "Ab4", "Cb5"]), ("C", "C3", ["E4", "G4", "C5"])])]
    for px, title, chords in panels:
        X = px + 12
        o.append(T(X, 22, title, "start", 12.5, INK, True))
        info = {}
        items = []
        for k, (sym, b, up) in enumerate(chords):
            _f13_chk(sym, [b] + up, part=(sym == "G7"))
            fills = {nname(n): SIG for n in [b] + up if _f13_out(n)}
            items.append(dict(key=k, x=78 + k * 110, notes=[b] + up, fill=INK, fills=fills, sym=sym.replace("Db", "D♭"),
                              symcol=SIG if fills else INK))
        o.append(STAFF(X, 52, 320, s=s, clef="grand", items=items, info=info))
        srt = [sorted([b] + up, key=lambda n: parse(n)["midi"]) for _, b, up in chords]
        for k in range(2):
            for v in range(4):
                (x1, y1), (x2, y2) = info[k][v], info[k + 1][v]
                d = parse(srt[k + 1][v])["midi"] - parse(srt[k][v])["midi"]
                col = SIG if abs(d) == 1 else (MUT if d == 0 else INK)
                o.append(W(x1 + 9, y1, x2 - 9, y2, c=col, lw=1.6 if d else 1.0, dash=None if d else "3,3"))
        rows = [(nm, [srt[k][v] for k in range(3)]) for v, nm in ((3, "上の声部"), (2, "中の声部"), (1, "下の声部"), (0, "ベース"))]
        o.append(_f13_voice_rows(X, 182, rows, numx=196))
    o.append(T(12, 262, "数字は各声部が動く半音の数（− は下へ、0 は動かない）。色の線と赤い数字は半音の動き。", "start", 10.5, MUT))
    return SVG(712, 272, o, "上の 3 つの声部（F・A・C → F・G・B / F・A♭・C♭ → E・G・C）は、V7 でも裏コードでも、F → E（半音下）と B（C♭）→ C（半音上）"
               "の三全音の解決が共通である。違いはベースで、裏コードではベースが D → D♭ → C と半音ずつ下がり、D♭7 → C ではすべての声部が半音で動く。")
F["e13_ura"] = _f13_ura()


# 12. 経過的なディミニッシュ: ベースの線
def _f13_passing():
    o = []
    pitches = ["C", "C♯", "D", "D♯", "E"]
    yb, dy = 176, 30
    Y = lambda k: yb - k * dy
    panels = [(0, 260, "I → IIm7 → IIIm7", [("C", "I", 0), ("Dm7", "IIm7", 2), ("Em7", "IIIm7", 4)]),
              (300, 360, "経過的なディミニッシュを入れる",
               [("C", "I", 0), ("C♯dim7", "♯Idim7", 1), ("Dm7", "IIm7", 2), ("D♯dim7", "♯IIdim7", 3), ("Em7", "IIIm7", 4)])]
    for px, pw, title, pts in panels:
        X0 = px + 46
        o.append(T(px + 12, 22, title, "start", 12.5, INK, True))
        for k, nm in enumerate(pitches):
            o.append(W(X0 - 6, Y(k), px + pw - 6, Y(k), c=LIN, lw=1))
            o.append(T(X0 - 12, Y(k) + 4, nm, "end", 11, INK if "♯" not in nm else MUT, "♯" not in nm))
        step = (pw - 70) / (len(pts) - 1) if len(pts) > 1 else 0
        xy = [(X0 + 12 + i * step, Y(k)) for i, (_, _, k) in enumerate(pts)]
        o.append(PL(xy, INK, 1.8))
        for i, ((sym, dg, k), (x, y)) in enumerate(zip(pts, xy)):
            dim = "dim" in sym
            o.append(CIRC(x, y, 6.5, GLD if dim else BLU, 1.4, GLD if dim else BLU))
            o.append(T(x, yb + 26, sym, "middle", 11, GLD if dim else INK, True))
            o.append(T(x, yb + 42, dg, "middle", 10, MUT))
            if i:
                (xa, ya) = xy[i - 1]
                d = k - pts[i - 1][2]
                o.append(T((xa + x) / 2, (ya + y) / 2 - 8, "+%d" % d, "middle", 10.5, SIG if d == 1 else MUT, True))
    o.append(T(14, 252, "縦軸はベース（和音の根音）の高さ。+1 は半音、+2 は全音。", "start", 10.5, MUT))
    return SVG(680, 262, o, "左: ダイアトニックコードだけでは、ベースは C → D → E と全音ずつ上がる。右: 間に dim7（金）を 1 つずつはさむと、"
               "ベースが C → C♯ → D → D♯ → E と半音ずつ上がる。")
F["e13_passing"] = _f13_passing()


# 13. C♯dim7 は A7(♭9) から根音を省いた形
def _f13_dimrel():
    o = []
    cols = ["根音", "3 度の音", "5 度の音", "7 度の音", "♭9 の音"]
    x0, cw = 170, 72
    for j, c in enumerate(cols):
        o.append(T(x0 + j * cw + cw / 2, 22, c, "middle", 10.5, MUT, True))
    rows = [("A7（V7/IIm）", ["A", "C♯", "E", "G", None], None),
            ("A7(♭9)", ["A", "C♯", "E", "G", "B♭"], "+ ♭9 の音 B♭ を足す"),
            ("C♯dim7", ["A", "C♯", "E", "G", "B♭"], "− 根音 A を省く")]
    for i, (nm, ns, op) in enumerate(rows):
        y = 34 + i * 46
        o.append(T(20, y + 22, nm, "start", 12.5, GLD if "dim" in nm else INK, True))
        for j, n in enumerate(ns):
            if n is None:
                continue
            x = x0 + j * cw + 6
            removed = (i == 2 and j == 0)
            added = (i == 1 and j == 4)
            fill = PAN if removed else (SSOFT if n == "C♯" else (GOSOFT if added else PAN))
            c = MUT if removed else (SIG if n == "C♯" else (GLD if added else LIN))
            o.append(RECT(x, y + 4, cw - 12, 28, 6, fill, c, 1.3, dash="4,3" if removed else None))
            o.append(T(x + (cw - 12) / 2, y + 23, n, "middle", 12.5, MUT if removed else (SIG if n == "C♯" else INK), not removed))
            if removed:
                o.append(W(x + 6, y + 8, x + cw - 18, y + 28, c=MUT, lw=1.3))
        if op:
            o.append(T(x0 + 5 * cw + 8, y + 22, op, "start", 10.5, MUT))
    # 三全音 C♯–G（C♯dim7 の行の下）
    yb = 34 + 2 * 46 + 40
    xa, xb = x0 + 1 * cw + cw / 2, x0 + 3 * cw + cw / 2
    o.append(PL([(xa, yb - 4), (xa, yb + 4), (xb, yb + 4), (xb, yb - 4)], SIG, 1.4))
    o.append(T((xa + xb) / 2, yb + 20, "三全音 C♯–G（A7 の 3 度の音と 7 度の音）", "middle", 11, SIG, True))
    o.append(T(20, yb + 20, "C♯ は D の導音", "start", 11, SIG, True))
    return SVG(680, yb + 32, o, "A7 に ♭9 の音 B♭ を足して A7(♭9) にし、根音 A を省くと、C♯dim7（C♯ E G B♭）になる。"
               "C♯dim7 は、A7 と同じ導音 C♯ と三全音 C♯–G を含むので、A7 と同じく Dm へ進む。")
F["e13_dimrel"] = _f13_dimrel()
