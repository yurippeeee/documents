# 14 章 転調 の図（figures.py の関数・定数をそのまま使う）

_F14_MSOFT = "var(--muted-soft)"


def _f14_cn(s):
    """コードネームの # b を ♯ ♭ にする（このファイルで使う和音だけを想定）"""
    return s.replace("#", "♯").replace("b", "♭")


def _f14_notes(sym):
    """和音の構成音を、文字を正しく選んで綴る（例 'D7' → ['D', 'F#', 'A', 'C']）"""
    c = chord_parse(sym)
    r = c["root"].replace("♯", "#").replace("♭", "b")
    rl = LETTERS.index(r[0])
    rm = parse(r + "4")["midi"]
    out = [r]
    for v in c["ivs"][1:]:
        dl = {3: 2, 4: 2, 6: 4, 7: 4, 8: 4, 9: 6, 10: 6, 11: 6}[v]
        L = LETTERS[(rl + dl) % 7]
        a = ((rm + v) - parse(L + "4")["midi"] + 6) % 12 - 6
        out.append(L + {0: "", 1: "#", -1: "b"}[a])
    return out


def _f14_scale(key):
    """長調の音階の音名（綴り）の集合"""
    return set(n[:-1] for n in spell_scale(key + "4", MAJOR, 7))


def _f14_rich(x, y, parts, a="middle", sz=11.5):
    """色の違う文字を 1 行に並べる。parts = [(文字, 色, 太字)]"""
    sp = "".join('<tspan fill="%s" font-weight="%s">%s</tspan>' % (c, "700" if b else "400", E(t)) for t, c, b in parts)
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" font-family="var(--sans)">%s</text>' % (x, y, a, sz, sp))


def _f14_boxes(o, x0, y, prog, bw, h=28, stroke=None, fill=None):
    """和音の箱を拍数に比例した幅で並べる。返り値: 各和音の (左端, 右端, 中心)"""
    xs = []
    x = x0
    for i, (sym, b) in enumerate(prog):
        w = b * bw
        c = (stroke or {}).get(i, LIN)
        o.append(RECT(x + 1.5, y, w - 3, h, 6, (fill or {}).get(i, PAN), c, 1.3 if c == LIN else 2.0))
        o.append(T(x + w / 2, y + h / 2 + 5, _f14_cn(sym), "middle", 13, INK, True))
        xs.append((x, x + w, x + w / 2))
        x += w
    return xs


def _f14_bracket(o, xa, xb, y, col, label, dash=None, lx=None):
    """調の範囲を示すかぎ形の線（ラベルは線の上。lx を省くと左端に寄せる）"""
    o.append(W(xa + 2, y + 6, xa + 2, y, xb - 2, y, xb - 2, y + 6, c=col, lw=1.8, dash=dash))
    o.append(T(lx if lx is not None else xa + 5, y - 5, label, "start", 11.5, col, True))


_F14_A = [("C", 2), ("F", 2), ("G7", 2), ("C", 2), ("Am", 2), ("D7", 2), ("G", 2), ("G7", 2), ("C", 4)]
_F14_B = [("C", 2), ("F", 2), ("G7", 2), ("C", 2), ("Am", 2), ("D7", 2), ("G", 2), ("Em", 2), ("Am", 2), ("D7", 2), ("G", 4)]


# 1. 一時的なドミナント (a) と転調 (b) の比較
def _f14_define():
    o = []
    bw, x0 = 18, 64
    def band(y, title, prog, brackets, final):
        o.append(T(10, y, title, "start", 12.5, INK, True))
        yb = y + 50
        xs = _f14_boxes(o, x0, yb, prog, bw, stroke={len(prog) - 1: final})
        ends = {}
        for (i0, i1, lev, col, lab, dash) in brackets:
            lx = ends[0] + 8 if lev == 1 and 0 in ends and xs[i0][0] < ends[0] < xs[i1][1] else None
            _f14_bracket(o, xs[i0][0], xs[i1][1], y + 24 + lev * 17, col, lab, dash, lx)
            ends[lev] = xs[i1][1]
        o.append(T(x0 - 8, y + 33, "調", "end", 11, MUT, True))
        o.append(T(x0 - 8, yb + 19, "和音", "end", 11, MUT, True))
        yl = yb + 50
        o.append(T(x0 - 8, yl, "F の音", "end", 11, MUT, True))
        for i, (sym, b) in enumerate(prog):
            ns = _f14_notes(sym)
            if "F" in ns:
                o.append(T(xs[i][2], yl, "F", "middle", 12.5, MUT, True))
            if "F#" in ns:
                o.append(T(xs[i][2], yl, "F♯", "middle", 12.5, SIG, True))
        return xs
    band(20, "(a) D7 → G のあと、ハ長調に戻る", _F14_A,
         [(0, 8, 0, MUT, "ハ長調（最後まで）", None), (5, 6, 1, SIG, "一時的に G へ", "4,3")], MUT)
    band(150, "(b) D7 → G のあと、ト長調にとどまる", _F14_B,
         [(0, 4, 0, MUT, "元の調: ハ長調", None), (4, 10, 1, SIG, "転調先の調: ト長調", None)], SIG)
    return SVG(520, 262, o, "同じ D7 → G を含む 2 つの進行。(a) では F♯ が 1 回だけ現れ、すぐ G7 の F に戻ってハ長調で終わる（セカンダリードミナント）。"
               "(b) では F♯ がくり返し現れて F に戻らず、G への終止で終わる（転調）。Am の所は、2 節で見るように両方の調に属する。")
F["e14_define"] = _f14_define()


# 2. ハ長調とト長調のダイアトニックコードと共通和音
def _f14_common():
    o = []
    L0, L1, R0, R1, top, bot = 10, 350, 170, 510, 40, 238
    o.append(RECT(R0, top, L1 - R0, bot - top, 14, GSOFT, "none", 0))
    o.append(RECT(L0, top, L1 - L0, bot - top, 14, "none", MUT, 1.5))
    o.append(RECT(R0, top, R1 - R0, bot - top, 14, "none", SIG, 1.5))
    o.append(T(L0 + 4, top - 12, "ハ長調のダイアトニックコード", "start", 12, MUT, True))
    o.append(T(R1 - 4, top - 12, "ト長調のダイアトニックコード", "end", 12, SIG, True))
    o.append(T((L0 + R0) / 2, top + 22, "F を含む", "middle", 11.5, ALI, True))
    o.append(T((R0 + L1) / 2, top + 22, "共通和音", "middle", 12, GRN2, True))
    o.append(T((R0 + L1) / 2, top + 37, "（ハ長調 / ト長調）", "middle", 10.5, GRN2))
    o.append(T((L1 + R1) / 2, top + 22, "F♯ を含む", "middle", 11.5, ALI, True))
    def notes_parts(sym, mark):
        ns = _f14_notes(sym)
        parts = []
        for k, n in enumerate(ns):
            if k:
                parts.append(("・", MUT, False))
            parts.append((_f14_cn(n), ALI if n == mark else MUT, n == mark))
        return parts
    def side(cx, chords, key, mark):
        for k, sym in enumerate(chords):
            y = top + 70 + k * 52
            o.append(T(cx - 6, y, _f14_cn(sym), "end", 15, INK, True))
            o.append(T(cx + 2, y, roman(sym, key), "start", 11.5, MUT, True))
            o.append(_f14_rich(cx, y + 19, notes_parts(sym, mark), "middle", 11.5))
    side((L0 + R0) / 2, ["Dm", "F", "Bdim"], "C", "F")
    side((L1 + R1) / 2, ["Bm", "D", "F#dim"], "G", "F#")
    for k, sym in enumerate(["C", "Em", "G", "Am"]):
        y = top + 66 + k * 40
        o.append(T(R0 + 18, y, sym, "start", 15, INK, True))
        o.append(T(L1 - 16, y, "%s / %s" % (roman(sym, "C"), roman(sym, "G")), "end", 12, GRN2, True))
    return SVG(520, 250, o, "ハ長調とト長調のダイアトニックコードを、どちらの調に含まれるかで分けた。ハ長調で F を含む 3 つと、ト長調で F♯ を含む 3 つは相手の調に無く、"
               "残りの 4 つ（C・Em・G・Am）が両方の調の和音、つまり共通和音になる。コードネームの右と中央の列の小さな文字は、それぞれの調でのディグリーネーム。")
F["e14_common"] = _f14_common()


# 3. 五度圏での距離と、共通音・共通和音の数
def _f14_distance():
    o = []
    cx, cy, r = 132, 148, 92
    names = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"]
    keys = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]
    pcs = lambda k: set(parse(n)["midi"] % 12 for n in spell_scale(k + "4", MAJOR, 7))
    def triads(k):
        sc = [n[:-1] for n in spell_scale(k + "4", MAJOR, 7)]
        return [frozenset(parse(sc[(j + d) % 7] + "4")["midi"] % 12 for d in (0, 2, 4)) for j in range(7)]
    tC = set(triads("C"))
    com = [len(tC & set(triads(k))) for k in keys]
    cnote = [len(pcs("C") & pcs(k)) for k in keys]
    o.append(CIRC(cx, cy, r, LIN, 1.2))
    o.append(T(cx, cy - 4, "五度圏", "middle", 12, MUT, True))
    o.append(T(cx, cy + 13, "（長調）", "middle", 10.5, MUT))
    for k in range(12):
        a = math.radians(-90 + 30 * k)
        px, py = cx + r * math.cos(a), cy + r * math.sin(a)
        n = com[k]
        if k == 0:
            st, fl, tc, da = SIG, SSOFT, SIG, None
        elif n == 4:
            st, fl, tc, da = GRN2, GSOFT, GRN2, None
        elif n == 2:
            st, fl, tc, da = GRN2, PAN, GRN2, "3,2"
        else:
            st, fl, tc, da = MUT, PAN, MUT, None
        o.append(CIRC(px, py, 17, st, 1.6, fl, da))
        o.append(T(px, py + 4.5, names[k], "middle", 12.5, INK if (n or k == 0) else MUT, True))
        lx, ly = cx + (r + 31) * math.cos(a), cy + (r + 31) * math.sin(a)
        o.append(T(lx, ly + 4.5, str(n), "middle", 12.5, tc, True))
    # 表
    tx0 = 292
    o.append(T(tx0, 34, "d", "middle", 11.5, MUT, True))
    o.append(T(tx0 + 16, 34, "長調", "start", 11.5, MUT, True))
    o.append(T(tx0 + 150, 34, "共通音", "middle", 11.5, MUT, True))
    o.append(T(tx0 + 202, 34, "共通和音", "middle", 11.5, MUT, True))
    o.append(W(tx0 - 10, 42, tx0 + 230, 42, c=LIN, lw=1))
    rows = [(0, "ハ長調", 0), (1, "ト・ヘ長調", 1), (2, "ニ・変ロ長調", 2), (3, "イ・変ホ長調", 3), (4, "ホ・変イ長調", 4), (5, "ロ・変ニ長調", 5), (6, "嬰ヘ長調", 6)]
    for i, (d, nm, k) in enumerate(rows):
        y = 64 + i * 27
        n = com[k]
        col = SIG if d == 0 else GRN2 if n else MUT
        o.append(T(tx0, y, str(d), "middle", 12.5, INK, True))
        o.append(T(tx0 + 16, y, nm, "start", 12, INK))
        o.append(T(tx0 + 150, y, str(cnote[k]), "middle", 12.5, INK, True))
        o.append(T(tx0 + 202, y, str(n), "middle", 12.5, col, True))
    o.append(T(tx0 - 10, 64 + 7 * 27 - 2, "d: 五度圏で何個離れているか", "start", 10.5, MUT))
    o.append(T(10, 290, "円の文字は長調の主音（C = ハ長調）。外側の数字は、ハ長調との共通和音の数。", "start", 10.5, MUT))
    return SVG(530, 300, o, "ハ長調と、五度圏で d 個離れた長調の、共通音と共通和音の数（12 の長調すべてを Python で数えた）。"
               "共通音は d が 5 までは 1 つずつ減る（d = 6 では 2 のまま）。共通和音は 7 → 4 → 2 → 0 と速く減り、3 つ以上離れると無くなる。")
F["e14_distance"] = _f14_distance()


# 4. ピボットコードの 2 つの読み方と機能
def _f14_pivotfunc():
    o = []
    bw, x0 = 18, 64
    xs = _f14_boxes(o, x0, 26, _F14_B, bw)
    o.append(T(x0 - 8, 45, "和音", "end", 11, MUT, True))
    FC = {"T": BLU, "SD": GRN2, "D": SIG}
    FS = {"T": BSOFT, "SD": GSOFT, "D": SSOFT}
    rows = [("ハ長調", 0, 5, "C"), ("ト長調", 4, 11, "G")]
    fn = {"I": "T", "IIIm": "T", "VIm": "T", "IV": "SD", "IIm": "SD", "V": "D", "V7": "D"}
    for k, (nm, a, b, key) in enumerate(rows):
        y = 66 + k * 48
        o.append(T(x0 - 8, y + 24, nm, "end", 12, INK, True))
        for i in range(a, b):
            xl, xr, xc = xs[i]
            deg = roman(_F14_B[i][0], key)
            f = fn[deg]
            o.append(RECT(xl + 3, y, xr - xl - 6, 40, 6, FS[f], FC[f], 1.2))
            o.append(T(xc, y + 17, deg, "middle", 12, FC[f], True))
            o.append(T(xc, y + 33, f, "middle", 11, FC[f], True))
    xl, xr, xc = xs[4]
    o.append(RECT(xl - 1, 20, xr - xl + 2, 66 + 48 + 40 + 6 - 20, 8, "none", INK, 1.4, dash="4,3"))
    o.append(T(xc, 176, "ピボットコード", "middle", 11.5, INK, True))
    for j, (f, nm) in enumerate([("T", "T（トニック）"), ("SD", "SD（サブドミナント）"), ("D", "D（ドミナント）")]):
        x = 64 + j * 150
        o.append(RECT(x, 194, 13, 13, 3, FS[f], FC[f], 1.2))
        o.append(T(x + 19, 205, nm, "start", 11, FC[f], True))
    return SVG(520, 216, o, "(b) の和音を、ハ長調の和音として読んだ段と、ト長調の和音として読んだ段。ピボットコードの Am は、ハ長調では VIm（T）、ト長調では IIm（SD）で、"
               "そこから SD → D → T（Am → D7 → G）の流れで新しい主和音へ進む。")
F["e14_pivotfunc"] = _f14_pivotfunc()


# 5. 各和音を含む長調（新しい調の V7 の有無）
def _f14_narrow():
    o = []
    keys = [("変ロ長調", "Bb"), ("ヘ長調", "F"), ("ハ長調", "C"), ("ト長調", "G"), ("ニ長調", "D")]
    progs = [("新しい調の V7 を置かない（… Am → G）", ["C", "F", "G7", "C", "Am", "G"], None),
             ("新しい調の V7 を置く（… Am → D7 → G）", ["C", "F", "G7", "C", "Am", "D7", "G"], 5)]
    cw, ch, x0 = 52, 22, 74
    y = 20
    for title, chords, hot in progs:
        o.append(T(10, y, title, "start", 12.5, INK, True))
        yh = y + 12
        for j, sym in enumerate(chords):
            o.append(RECT(x0 + j * cw + 2, yh, cw - 4, 25, 5, PAN, LIN, 1.2))
            o.append(T(x0 + j * cw + cw / 2, yh + 17.5, _f14_cn(sym), "middle", 12.5, INK, True))
        y0 = yh + 31
        for r, (kn, kk) in enumerate(keys):
            yr = y0 + r * ch
            o.append(T(x0 - 8, yr + 15, kn, "end", 11.5, INK, kk == "C" or kk == "G"))
            sc = _f14_scale(kk)
            for j, sym in enumerate(chords):
                xc = x0 + j * cw + cw / 2
                if set(_f14_notes(sym)) <= sc:
                    o.append(RECT(x0 + j * cw + 4, yr + 2, cw - 8, ch - 3, 4, GSOFT, GRN2, 1))
                    o.append(T(xc, yr + 15, roman(sym, kk), "middle", 11, GRN2, True))
                else:
                    o.append(D(xc, yr + 10.5, FNT, 1.8))
        yend = y0 + 5 * ch
        if hot is None:
            o.append(RECT(x0 + 1, y0 + 2 * ch, len(chords) * cw - 2, ch, 5, "none", GRN2, 2.2))
            o.append(T(x0, yend + 16, "ハ長調の行がすべて埋まる → ハ長調の中だけで進んでいる", "start", 11, GRN2, True))
        else:
            o.append(RECT(x0 + hot * cw + 1, yh - 3, cw - 2, yend - yh + 5, 6, "none", SIG, 2.2))
            o.append(RECT(x0 + 2 * cw + 1, yh - 3, cw - 2, yend - yh + 5, 6, "none", MUT, 1.6, "4,3"))
            o.append(T(x0 + 2 * cw + cw / 2, yend + 16, "G7 → ハ長調だけ", "middle", 11, MUT, True))
            o.append(T(x0 + hot * cw + cw / 2, yend + 16, "D7 → ト長調だけ", "middle", 11, SIG, True))
        y = yend + 44
    return SVG(450, y - 14, o, "それぞれの和音が、どの長調のダイアトニックコードかを示した表（ます目の文字は、その調でのディグリーネーム）。"
               "新しい調の V7 を置かない進行は、すべてハ長調の和音である。D7 を含む長調はト長調だけで、ピボットコードの Am はヘ長調・ハ長調・ト長調の 3 つに含まれる。")
F["e14_narrow"] = _f14_narrow()


# 6. 完全 5 度の連なりと、7 つ続きの範囲（長調）
def _f14_chain():
    o = []
    def name(p):
        li = (p + 1) % 7
        acc = (p + 1) // 7
        return "FCGDAEB"[li] + {0: "", 1: "♯", -1: "♭"}[acc]
    def num(p):
        return ("−%d" % -p) if p < 0 else "%d" % p
    pos = list(range(-3, 8))
    cw, x0 = 42, 14
    X = lambda p: x0 + (p + 3) * cw + cw / 2
    windows = [(-3, "変ロ長調"), (-2, "ヘ長調"), (-1, "ハ長調"), (0, "ト長調"), (1, "ニ長調")]
    panels = [("Am（A・C・E）", [3, 0, 4], PUR, PSOFT), ("D7（D・F♯・A・C）", [2, 6, 3, 0], SIG, SSOFT)]
    y = 18
    for title, tones, col, soft in panels:
        o.append(T(10, y, title, "start", 13, INK, True))
        a, b = min(tones), max(tones)
        yd = y + 20
        o.append(DARR(X(a), yd, X(b), yd, col, 1.4))
        o.append(T((X(a) + X(b)) / 2, yd - 5, "幅 %d" % (b - a), "middle", 11.5, col, True))
        yc = yd + 24
        for p in pos:
            on = p in tones
            o.append(CIRC(X(p), yc, 15, col if on else LIN, 2.0 if on else 1.2, soft if on else PAN))
            o.append(T(X(p), yc + 4.5, name(p), "middle", 12.5, col if on else INK, True))
            o.append(T(X(p), yc + 29, num(p), "middle", 10, MUT))
        yw = yc + 38
        for k, (w, kn) in enumerate(windows):
            yy = yw + k * 18
            ok = (w <= a and w + 6 >= b)
            xa, xb = X(w) - 17, X(w + 6) + 17
            o.append(RECT(xa, yy, xb - xa, 15, 7, GSOFT if ok else "none", GRN2 if ok else MUT, 1.4 if ok else 1.0, None if ok else "3,3"))
            o.append(T((xa + xb) / 2, yy + 11.5, kn + ("（含む）" if ok else "（含まない）"), "middle", 10.5, GRN2 if ok else MUT, ok))
        y = yw + 5 * 18 + 30
    o.append(T(10, y - 10, "数字は C を 0 とした位置。1 つ右が完全 5 度上の音。", "start", 10.5, MUT))
    return SVG(500, y, o, "完全 5 度の連なりの上では、長調の 7 音は 7 つ続きの範囲になる（下の横長の枠）。Am の 3 音は幅 4 に収まり、それを含む範囲は 3 つ（ヘ・ハ・ト長調）。"
               "D7 の 4 音は幅 6 に広がり、それを含む範囲はト長調の 1 つだけである。")
F["e14_chain"] = _f14_chain()


# 7. V7 → I の動き（元の調と転調先の調）
def _f14_resolve():
    o = []
    s = 12
    panels = [("ハ長調の V7 → I", ("G7", ["G4", "B4", "D5", "F5"]), ("C", ["G4", "C5", "E5"]),
               [("B4", "C5", "導音 B → 主音 C（半音上）"), ("F5", "E5", "7 度の音 F → E（半音下）")], None),
              ("ト長調の V7 → I", ("D7", ["D4", "F#4", "A4", "C5"]), ("G", ["D4", "G4", "B4"]),
               [("F#4", "G4", "導音 F♯ → 主音 G（半音上）"), ("C5", "B4", "7 度の音 C → B（半音下）")], "F#4")]
    for k, (title, (s1, n1), (s2, n2), arrows, hot) in enumerate(panels):
        x = 10 + k * 262
        o.append(T(x, 18, title, "start", 12.5, INK, True))
        info = {}
        st = staff_start(s, 0)
        fills = {nname(hot): SIG} if hot else {}
        items = [dict(x=st + 28, notes=n1, key="a", sym=_f14_cn(s1), fills=fills),
                 dict(x=st + 136, notes=n2, key="b", sym=_f14_cn(s2))]
        o.append(STAFF(x, 60, 236, s=s, clef="treble", items=items, info=info))
        pa = dict(zip(sorted(n1, key=lambda n: parse(n)["midi"]), info["a"]))
        pb = dict(zip(sorted(n2, key=lambda n: parse(n)["midi"]), info["b"]))
        for j, (f, t, lab) in enumerate(arrows):
            (x1, y1), (x2, y2) = pa[f], pb[t]
            col = SIG if j == 0 else INK
            o.append(ARR(x1 + 13, y1, x2 - 13, y2, col, 1.7))
            o.append(T(x, 144 + j * 19, lab, "start", 11.5, col, True))
    o.append(T(272, 188, "色を付けた F♯ は、ハ長調に無い音", "start", 10.5, SIG))
    return SVG(530, 198, o, "V7 → I では、3 度の音（導音）が半音上の主音へ、7 度の音が半音下へ進む。ハ長調の V7（G7）では導音が B だが、"
               "ト長調の V7（D7）では導音が F♯ になり、ハ長調に無い音として現れる。")
F["e14_resolve"] = _f14_resolve()


_F14_G = [("C", 2), ("F", 2), ("G7", 2), ("C", 2), ("Em", 2), ("A7", 2), ("D", 2), ("G", 2), ("A7", 2), ("D", 4)]
_F14_H = [("C", 2), ("F", 2), ("G7", 2), ("C", 2), ("D", 2), ("G", 2), ("A7", 2), ("D", 4)]
_F14_I = [("C", 2), ("F", 2), ("G7", 2), ("C", 2), ("Db", 2), ("Gb", 2), ("Ab7", 2), ("Db", 4)]
_F14_J = [("C", 2), ("F", 2), ("G7", 2), ("C", 2), ("Ab7", 2), ("Db", 2), ("Gb", 2), ("Ab7", 2), ("Db", 4)]


# 8. ピボットコードを通る転調と、直接転調
def _f14_direct():
    o = []
    bw, x0 = 18, 12
    bands = [("全音上へ — ピボットコード Em を通る", _F14_G, "ニ長調", 4, True),
             ("全音上へ — 直接転調", _F14_H, "ニ長調", 4, False),
             ("半音上へ — 直接転調", _F14_I, "変ニ長調", 4, False),
             ("半音上へ — 新しい調の V7 を先に置く", _F14_J, "変ニ長調", 4, False)]
    y = 18
    for title, prog, kn, i0, pivot in bands:
        o.append(T(10, y, title, "start", 12.5, INK, True))
        yb = y + 50
        xs = _f14_boxes(o, x0, yb, prog, bw, stroke={i0: INK} if pivot else None)
        if pivot:
            _f14_bracket(o, xs[0][0], xs[i0][1], y + 24, MUT, "ハ長調")
            _f14_bracket(o, xs[i0][0], xs[-1][1], y + 41, SIG, kn, xs[i0][1] + 8)
        else:
            _f14_bracket(o, xs[0][0], xs[i0 - 1][1], y + 24, MUT, "ハ長調")
            _f14_bracket(o, xs[i0][0], xs[-1][1], y + 41, SIG, kn)
            xd = xs[i0][0]
            o.append(W(xd, y + 22, xd, yb + 34, c=ALI, lw=1.6, dash="4,3"))
        y = yb + 62
    o.append(T(10, y - 18, "黒い枠: ピボットコード　赤い破線: 共通和音を通らない継ぎ目（フレーズの区切り）", "start", 10.5, MUT))
    return SVG(430, y - 8, o, "ピボットコードを通る転調では、継ぎ目の和音が両方の調に属する。直接転調では、ハ長調の終止のすぐ後から、転調先の調の和音だけで進む。"
               "共通和音の無い半音上の調へは、直接転調で移る。")
F["e14_direct"] = _f14_direct()


# 9. 楽譜での書き方: 臨時記号・調号の変化・平行調
def _f14_keysig():
    o = []
    s = 9
    V = {"C": ["E4", "G4", "C5"], "Am": ["E4", "A4", "C5"], "D7": ["D4", "F#4", "A4", "C5"], "G": ["D4", "G4", "B4"],
         "Em": ["E4", "G4", "B4"], "Dm": ["F4", "A4", "D5"], "E7": ["E4", "G#4", "B4", "D5"]}
    rows = [("(i) ト長調への転調を、臨時記号で書く", ["C", "Am", "D7", "G", "Em", "Am", "D7", "G"], False),
            ("(ii) 同じ転調を、調号を変えて書く", ["C", "Am", "D7", "G", "Em", "Am", "D7", "G"], True),
            ("(iii) 平行調（イ短調）への転調: 調号は変わらない", ["C", "Dm", "E7", "Am", "Dm", "E7", "Am"], False)]
    st = staff_start(s, 0)
    y = 18
    for title, chords, change in rows:
        o.append(T(10, y, title, "start", 12.5, INK, True))
        ytop = y + 40
        items = []
        x = st + 8
        xdb = None
        for j, sym in enumerate(chords):
            ns = V[sym]
            fl = {nname(n): SIG for n in ns if "#" in n}
            it = dict(x=x, notes=ns, sym=_f14_cn(sym), fills=fl)
            if change and j >= 1:
                it["acc"] = False
            items.append(it)
            x += 46
            if change and j == 0:
                xdb = x - 14
                items.append(dict(x=xdb, bar="double"))
                x += 26
        w = x - 10
        o.append(STAFF(10, ytop, w, s=s, clef="treble", items=items))
        if change:
            o.append(KEYSIG(10 + xdb + 13 - 4.9 * s, ytop, s, "treble", 1))
            o.append(T(10 + xdb + 2, ytop + 4 * s + 24, "↑ 新しい調号（♯ 1 つ）", "start", 10.5, SIG, True))
        y = ytop + 4 * s + 54
    return SVG(470, y - 12, o, "(i) と (ii) は同じ音を鳴らす。(i) では F♯ のたびに ♯ を付け、(ii) では複縦線のあとにト長調の調号を書くので ♯ が要らない。"
               "(iii) のハ長調とイ短調は調号が同じなので、調号は変わらず、イ短調の導音 G♯ に毎回 ♯ が付く。")
F["e14_keysig"] = _f14_keysig()
