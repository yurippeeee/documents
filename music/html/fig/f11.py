# 11 章 セブンスコードとテンション の図（figures.py の関数・定数をそのまま使う）

_f11_TC = {"長": BLU, "短": PUR, "減": GLD, "増": ALI, "完全": GRN2}      # 三和音・音程の種類の色（03・08 章と同じ）
_f11_TS = {"長": BSOFT, "短": PSOFT, "減": GOSOFT, "増": ASOFT, "完全": GSOFT}
# (コードネームの後ろの部分, 呼び名, 三和音の種類, 7 度の種類, 根音からの半音数)
_f11_TYPES = [("M7", "メジャーセブンス", "長", "長", [0, 4, 7, 11]),
              ("7", "セブンス", "長", "短", [0, 4, 7, 10]),
              ("m7", "マイナーセブンス", "短", "短", [0, 3, 7, 10]),
              ("mM7", "マイナーメジャーセブンス", "短", "長", [0, 3, 7, 11]),
              ("m7(♭5)", "マイナーセブンスフラットファイブ", "減", "短", [0, 3, 6, 10]),
              ("dim7", "ディミニッシュセブンス", "減", "減", [0, 3, 6, 9])]
_f11_ACCS = {0: "", 1: "#", -1: "b", 2: "x", -2: "bb"}


def _f11_spell(root, degs):
    """root = 'C4'、degs = [(度数, 根音からの半音数), ...] → 音名の列（文字は度数どおりに選ぶ）"""
    p = parse(root)
    out = []
    for d, sm in degs:
        dia = p["dia"] + d - 1
        li, octv = dia % 7, dia // 7
        a = p["midi"] + sm - (12 * (octv + 1) + PC_OF_LETTER[li])
        out.append("%s%s%d" % (LETTERS[li], _f11_ACCS[a], octv))
    return out


def _f11_7(root, ivs):
    return _f11_spell(root, list(zip((1, 3, 5, 7), ivs)))


def _f11_kind(ivs):
    """根音からの半音数 [0, 3度, 5度, 7度] → (_f11_TYPES の要素) または None"""
    for t in _f11_TYPES:
        if list(ivs) == t[4]:
            return t
    return None


def _f11_accg(a, xr, yn, s, fill):
    """臨時記号（右端 xr）。♭♭ は ♭ を 2 つ並べて描く"""
    if a == -2:
        return ACC(-1, xr, yn, s, fill) + ACC(-1, xr - 0.84 * s, yn, s, fill)
    return ACC(a, xr, yn, s, fill)

_f11_AW = {1: 1.0, -1: 0.82, 0: 0.8, -2: 1.66}


def _f11_staff(x, ytop, w, s, clef, items, key=0):
    """STAFF と同じ。ただし和音の臨時記号は自分で並べる（重ならないよう列をずらし、♭♭ も描く）"""
    o = [STAFF(x, ytop, w, s=s, clef=clef, items=[dict(it, acc=False) for it in items], key=key)]
    ka = key_acc(key)
    for it in items:
        if it.get("bar") or it.get("rest") or not it.get("notes") or it.get("acc") is False:
            continue
        hw = 0.78 * s if it.get("dur", "whole") == "whole" else 0.64 * s
        cx = x + it["x"]
        need = []
        for n in it["notes"]:
            p = parse(n)
            if p["acc"] == ka[p["letter"]]:
                continue
            if clef == "grand":
                kind = it.get("staff") or ("treble" if p["midi"] >= 60 else "bass")
                yt = ytop if kind == "treble" else ytop + 8 * s
            else:
                kind, yt = clef, ytop
            pp = p["dia"] - (30 if kind == "treble" else 18)
            col = (it.get("fills") or {}).get(nname(n), it.get("fill", INK))
            need.append((yt + 4 * s - pp * s / 2, p["acc"], col))
        need.sort(key=lambda q: q[0])          # 高い音から
        cols, widths, place = [], [], []
        for yn, a, col in need:
            c = 0
            while c < len(cols) and any(abs(yn - y2) < 3 * s for y2 in cols[c]):
                c += 1
            if c == len(cols):
                cols.append([]); widths.append(0)
            cols[c].append(yn); widths[c] = max(widths[c], _f11_AW[a] * s)
            place.append((yn, a, col, c))
        rights, xr = [], cx - hw - 0.32 * s
        for c in range(len(cols)):
            rights.append(xr); xr -= widths[c] + 0.3 * s
        for yn, a, col, c in place:
            o.append(_f11_accg(a, rights[c], yn, s, col))
    return "".join(o)


# ---------------------------------------------------------------- 1 節
# 1. 三和音の上に 3 度をもう 1 つ重ねる
def _f11_stack():
    o = []
    s = 10
    X, Y = 16, 62
    items = [dict(x=74, notes=["C4", "E4", "G4"], fill=BLU, fills={"C4": INK}),
             dict(x=214, notes=["C4", "E4", "G4", "B4"], fill=BLU, fills={"C4": INK, "B4": SIG})]
    o.append(_f11_staff(X, Y, 270, s, "treble", items))
    o.append(T(X + 74, Y + 4 * s + 30, "三和音 C", "middle", 12, BLU, True))
    o.append(T(X + 214, Y + 4 * s + 30, "セブンスコード CM7", "middle", 12, SIG, True))
    o.append(ARR(X + 104, Y - 18, X + 186, Y - 18, MUT, 1.4))
    o.append(T(X + 145, Y - 26, "B を重ねる", "middle", 10.5, MUT))
    # 3 度の積み重ね（下から根音・3 度・5 度・7 度）
    bx, bw, bh, step = 352, 126, 30, 50
    rows = [("C", "根音", INK, PAN), ("E", "3 度の音", BLU, BSOFT), ("G", "5 度の音", BLU, BSOFT), ("B", "7 度の音", SIG, SSOFT)]
    ys = []
    for i, (L, nm, c, fl) in enumerate(rows):
        y = 186 - i * step
        ys.append(y + bh / 2)
        o.append(RECT(bx, y, bw, bh, 6, fl, c, 1.4))
        o.append(T(bx + 22, y + 20, L, "middle", 14, c, True))
        o.append(T(bx + 40, y + 20, nm, "start", 11.5, INK, i == 3))
    for i, (q, sm) in enumerate([("長 3 度", 4), ("短 3 度", 3), ("長 3 度", 4)]):
        y = 186 - i * step - (step - bh) / 2
        o.append(T(bx + bw + 10, y + 4, "%s（半音 %d）" % (q, sm), "start", 10.5, _f11_TC[q[0]], True))
    # 右の括弧: 5 度（三和音）と 7 度
    def brace(xb, y1, y2, txt, sub, c):
        o.append(PL([(xb, y1), (xb + 8, y1), (xb + 8, y2), (xb, y2)], c, 1.4))
        o.append(T(xb + 14, (y1 + y2) / 2 + 0, txt, "start", 11, c, True))
        o.append(T(xb + 14, (y1 + y2) / 2 + 15, sub, "start", 10, MUT))
    brace(bx + bw + 112, ys[0], ys[2], "5 度", "三和音", BLU)
    brace(bx + bw + 168, ys[0], ys[3], "7 度", "5 + 3 − 1", SIG)
    return SVG(712, 230, o, "三和音 C・E・G の 5 度の音 G の上に、もう 1 つ 3 度（長 3 度）を重ねると B になる。根音から B までは "
               "5 + 3 − 1 = 7 度（03 章 2 節の度数の足し算）なので、B を 7 度の音と呼ぶ。")
F["e11_stack"] = _f11_stack()


# 2. 三和音の種類 × 7 度の大きさ
def _f11_types():
    o = []
    x0, y0, cw, ch = 196, 62, 170, 64
    cols = [("長 7 度", 11), ("短 7 度", 10), ("減 7 度", 9)]
    rows = [("長三和音", "C・E・G", 7, "長"), ("短三和音", "C・E♭・G", 7, "短"), ("減三和音", "C・E♭・G♭", 6, "減"), ("増三和音", "C・E・G♯", 8, "増")]
    o.append(T(x0 - 14, y0 - 30, "三和音 ＼ 7 度の音", "end", 10.5, MUT))
    for j, (nm, sm) in enumerate(cols):
        c = _f11_TC[nm[0]]
        o.append(T(x0 + j * cw + cw / 2, y0 - 30, nm, "middle", 13, c, True))
        o.append(T(x0 + j * cw + cw / 2, y0 - 13, "根音から半音 %d" % sm, "middle", 10.5, MUT))
    for i, (tn, notes, fifth, tq) in enumerate(rows):
        y = y0 + i * ch
        c = _f11_TC[tq]
        o.append(T(x0 - 14, y + 26, tn, "end", 13, c, True))
        o.append(T(x0 - 14, y + 44, "%s（5 度まで %d）" % (notes, fifth), "end", 10.5, MUT))
        for j, (nm, sm) in enumerate(cols):
            x = x0 + j * cw
            gap = sm - fifth
            ok = gap in (3, 4)
            if ok:
                kind = _f11_kind([0, 4 if tq in ("長", "増") else 3, fifth, sm])
                if kind:
                    o.append(RECT(x + 4, y + 4, cw - 8, ch - 8, 7, _f11_TS[tq], c, 1.3))
                    nm7 = _f11_7("C4", kind[4])
                    o.append(T(x + cw / 2, y + 26, "C" + kind[0], "middle", 15, INK, True))
                    o.append(T(x + cw / 2, y + 45, "・".join(nname(n, False) for n in nm7), "middle", 11, MUT))
                else:   # 増三和音 + 長 7 度
                    o.append(RECT(x + 4, y + 4, cw - 8, ch - 8, 7, PAN, LIN, 1.2, dash="4,3"))
                    o.append(T(x + cw / 2, y + 26, "C・E・G♯・B", "middle", 12, MUT, True))
                    o.append(T(x + cw / 2, y + 45, "（このシリーズでは扱わない）", "middle", 10, MUT))
            else:
                o.append(RECT(x + 4, y + 4, cw - 8, ch - 8, 7, "none", LIN, 1.0, dash="2,3"))
                o.append(T(x + cw / 2, y + 26, "作れない", "middle", 11.5, MUT, True))
                o.append(T(x + cw / 2, y + 45, "5 度の音から半音 %d" % gap, "middle", 10.5, MUT))
    yb = y0 + 4 * ch + 22
    o.append(T(20, yb, "3 度の積み重ねになるのは、5 度の音から 7 度の音までが長 3 度（半音 4）か短 3 度（半音 3）のときだけ。", "start", 10.5, MUT))
    o.append(T(20, yb + 18, "増三和音に長 3 度を重ねた B♯ は半音 12 で、根音の 1 オクターブ上と同じ高さになり、新しい音にならない。", "start", 10.5, MUT))
    return SVG(712, yb + 30, o, "三和音の種類（行）と 7 度の大きさ（列）の組み合わせ。5 度の音の上に長 3 度か短 3 度を重ねて作れるのは "
               "7 通りで、そのうち 6 つに名前が付いている。")
F["e11_types"] = _f11_types()


# 3. C を根音とする 6 種類（五線）
def _f11_six():
    o = []
    s = 10
    X, Y = 16, 34
    dx = 108
    items = []
    for i, (suf, jp, tq, sq, ivs) in enumerate(_f11_TYPES):
        ns = _f11_7("C4", ivs)
        fills = {nname(n): (_f11_TC[tq] if k < 3 else _f11_TC[sq]) for k, n in enumerate(ns)}
        fills[nname(ns[0])] = INK
        items.append(dict(x=86 + i * dx, notes=ns, fills=fills, fill=INK))
    o.append(_f11_staff(X, Y, 86 + 5 * dx + 44, s, "treble", items))
    for i, (suf, jp, tq, sq, ivs) in enumerate(_f11_TYPES):
        cx = X + 86 + i * dx
        steps = "・".join(str(ivs[k + 1] - ivs[k]) for k in range(3))
        y = Y + 4 * s + 34
        o.append(T(cx, y, "C" + suf, "middle", 13.5, INK, True))
        o.append(T(cx, y + 18, "半音 " + steps, "middle", 10.5, MUT))
        o.append(T(cx, y + 36, tq + "三和音", "middle", 11, _f11_TC[tq], True))
        o.append(T(cx, y + 52, "+ %s 7 度" % sq, "middle", 11, _f11_TC[sq], True))
    return SVG(712, Y + 4 * s + 98, o, "C を根音とする 6 種類のセブンスコード。根音（黒）・3 度の音と 5 度の音（三和音の種類の色）・"
               "7 度の音（7 度の大きさの色）。Cdim7 の 7 度の音は B♭♭（B を半音 2 つ下げた音、鍵盤では A と同じ鍵）と書く。")
F["e11_six"] = _f11_six()


# ---------------------------------------------------------------- 2 節
def _f11_diat_row(o, X, Y, s, tonic, steps, key, dx=88, x1=72, hl=None, mark=None):
    """音階の各音の上の 4 音を五線に並べ、下にコードネームなどを書く。返り値: 各和音の (中心 x, 名前, ディグリー, kind)"""
    sc = spell_scale(tonic, steps, 15)
    items, info = [], []
    for i in range(7):
        ns = [sc[i], sc[i + 2], sc[i + 4], sc[i + 6]]
        ms = [parse(n)["midi"] for n in ns]
        kind = _f11_kind([m - ms[0] for m in ms])
        if kind:
            fills = {nname(n): (_f11_TC[kind[2]] if k < 3 else _f11_TC[kind[3]]) for k, n in enumerate(ns)}
            fills[nname(ns[0])] = INK
            nm = nname(ns[0], False) + kind[0]
            rn = roman(nm, key)
        else:
            fills = {nname(n): MUT for n in ns}
            nm, rn = None, None
        if hl:
            for n in ns:
                if nname(n, False) in hl:
                    fills[nname(n)] = SIG
        items.append(dict(x=x1 + i * dx, notes=ns, fills=fills, fill=INK))
        info.append((X + x1 + i * dx, nm, rn, kind, ns))
    o.append(_f11_staff(X, Y, x1 + 6 * dx + 40, s, "treble", items))
    return info


def _f11_diatonic():
    o = []
    s = 10
    X, Y = 16, 40
    info = _f11_diat_row(o, X, Y, s, "C4", MAJOR, "C", dx=86, x1=124)
    y = Y + 4 * s + 40
    o.append(T(X, y, "コードネーム", "start", 10.5, MUT))
    o.append(T(X, y + 20, "ディグリーネーム", "start", 10.5, MUT))
    o.append(T(X, y + 40, "三和音", "start", 10.5, MUT))
    o.append(T(X, y + 56, "7 度", "start", 10.5, MUT))
    for cx, nm, rn, kind, ns in info:
        o.append(T(cx, y, nm, "middle", 13, INK, True))
        o.append(T(cx, y + 20, rn, "middle", 12, MUT, True))
        o.append(T(cx, y + 40, kind[2] + "三和音", "middle", 10.5, _f11_TC[kind[2]], True))
        o.append(T(cx, y + 56, "+ %s 7 度" % kind[3], "middle", 10.5, _f11_TC[kind[3]], True))
    return SVG(712, y + 68, o, "ハ長調のダイアトニックセブンスコード。長音階の各音を根音にして、音階の音だけで 3 度を 3 回重ねた。"
               "種類の並びは M7・m7・m7・M7・7・m7・m7(♭5) になる。")
F["e11_diatonic"] = _f11_diatonic()


# 7 度の大きさの導き方（根音のすぐ下の音までの 2 度）
def _f11_7th():
    o = []
    L = ["C", "D", "E", "F", "G", "A", "B", "C"]
    x0, dx, y0 = 200, 66, 24
    for i, l in enumerate(L):
        o.append(RECT(x0 + i * dx - 16, y0, 32, 28, 6, PAN, LIN, 1.3))
        o.append(T(x0 + i * dx, y0 + 19, l, "middle", 13, INK, True))
    st = ["全", "全", "半", "全", "全", "全", "半"]
    for i, k in enumerate(st):
        xa, xb = x0 + i * dx + 16, x0 + (i + 1) * dx - 16
        c = ALI if k == "半" else MUT
        o.append(PL([(xa, y0 + 8), ((xa + xb) / 2, y0 - 6), (xb, y0 + 8)], c, 1.5))
        o.append(T((xa + xb) / 2, y0 - 9, k, "middle", 10.5, c, True))
    lx = x0 - 44
    o.append(T(lx, y0 + 19, "長音階", "end", 11, MUT, True))
    o.append(W(20, 74, 700, 74, c=LIN, lw=1))
    rows = [("根音", 96), ("7 度の音", 124), ("7 度の音 → 根音", 152), ("7 度の半音の数", 186), ("7 度の大きさ", 226)]
    for r, y in rows:
        o.append(T(lx, y, r, "end", 11, INK, True))
    for i in range(7):
        cx = x0 + i * dx
        below = L[i - 1] if i > 0 else "B"
        half = (L[i] in ("C", "F"))
        c = BLU if half else PUR
        o.append(T(cx, 96, L[i], "middle", 13, INK, True))
        o.append(T(cx, 124, below, "middle", 13, c, True))
        o.append(T(cx, 152, "半音" if half else "全音", "middle", 11, ALI if half else MUT, half))
        o.append(T(cx, 180, "12 − %d" % (1 if half else 2), "middle", 11, INK))
        o.append(T(cx, 195, "= %d" % (11 if half else 10), "middle", 11, INK, True))
        o.append(RECT(cx - 30, 210, 60, 22, 5, BSOFT if half else PSOFT, c, 1.2))
        o.append(T(cx, 226, "長 7 度" if half else "短 7 度", "middle", 11, c, True))
    return SVG(712, 242, o, "根音から 7 度上の音は、音階の上で根音のすぐ下の音である。7 度と、その転回の 2 度を合わせると半音 12 なので、"
               "すぐ下の音が半音下なら 7 度は半音 11（長 7 度）、全音下なら半音 10（短 7 度）になる。長音階ですぐ下の音が半音下にあるのは、根音が C と F のときだけである。")
F["e11_7th"] = _f11_7th()


# V7 だけが 3 度の音と 7 度の音に三全音をもつ
def _f11_tritone():
    o = []
    sc = spell_scale("C4", MAJOR, 15)
    x0, cw, y0, rh = 132, 82, 46, 32
    roles = [("7 度の音", 6), ("5 度の音", 4), ("3 度の音", 2), ("根音", 0)]
    for j in range(7):
        ns = [sc[j], sc[j + 2], sc[j + 4], sc[j + 6]]
        ms = [parse(n)["midi"] for n in ns]
        kind = _f11_kind([m - ms[0] for m in ms])
        nm = nname(ns[0], False) + kind[0]
        x = x0 + j * cw
        both = ("B" in [nname(n, False) for n in ns]) and ("F" in [nname(n, False) for n in ns])
        o.append(T(x + cw / 2, y0 - 14, nm, "middle", 12.5, INK, True))
        for i, (rn, k) in enumerate(roles):
            y = y0 + i * rh
            L = nname(sc[j + k], False)
            tt = L in ("B", "F")
            o.append(RECT(x + 6, y + 3, cw - 12, rh - 6, 5, ASOFT if tt else PAN, ALI if tt else LIN, 1.4 if tt else 1.0))
            o.append(T(x + cw / 2, y + rh / 2 + 5, L, "middle", 13, ALI if tt else MUT, tt))
        if both:
            g7 = kind[0] == "7"
            o.append(RECT(x + 1, y0 - 32, cw - 2, 4 * rh + 38, 9, "none", SIG if g7 else MUT, 2.0 if g7 else 1.3, None if g7 else "5,4"))
    for i, (rn, k) in enumerate(roles):
        o.append(T(x0 - 8, y0 + i * rh + rh / 2 + 5, rn, "end", 11, INK, True))
    yb = y0 + 4 * rh + 26
    o.append(T(x0 + 4 * cw + cw / 2, yb, "G7: 3 度の音 B と 7 度の音 F", "middle", 11, SIG, True))
    o.append(T(x0 + 6 * cw + cw / 2, yb + 18, "Bm7(♭5): 根音 B と 5 度の音 F", "end", 10.5, MUT))
    return SVG(712, yb + 28, o, "ハ長調の 7 つの音の中で三全音になるのは B と F だけである（03 章 3 節）。両方を含むのは G7 と Bm7(♭5) で、"
               "3 度の音と 7 度の音が三全音になるのは G7（V7）だけである。")
F["e11_tritone"] = _f11_tritone()


# 短調（イ短調）: 自然短音階と和声的短音階
def _f11_minor():
    o = []
    s = 9
    X = 16
    rows = [("自然短音階（A B C D E F G）", NAT_MINOR, 30), ("和声的短音階（G が G♯）", HARM_MINOR, 196)]
    for title, steps, Y in rows:
        o.append(T(X, Y - 8, title, "start", 12, INK, True))
        info = _f11_diat_row(o, X, Y + 18, s, "A3", steps, "Am", dx=90, x1=70, hl=("G♯",))
        y = Y + 18 + 4 * s + 46
        for cx, nm, rn, kind, ns in info:
            changed = any(nname(n, False) == "G♯" for n in ns)
            if nm:
                o.append(T(cx, y, nm, "middle", 12.5, SIG if changed else INK, True))
                o.append(T(cx, y + 18, rn, "middle", 11, SIG if changed else MUT, changed))
            else:
                o.append(T(cx, y, "C・E・G♯・B", "middle", 10.5, MUT, True))
                o.append(T(cx, y + 18, "（扱わない）", "middle", 10, MUT))
    return SVG(712, 372, o, "イ短調のセブンスコード。自然短音階ではハ長調と同じ 7 つの和音ができる（根音の順番が違う）。"
               "和声的短音階では G が G♯ になり、G を含む 4 つの和音が変わる。I にマイナーメジャーセブンス、VII にディミニッシュセブンスが現れる。")
F["e11_minor"] = _f11_minor()


# ---------------------------------------------------------------- 3 節
# 3 度を重ね続ける: 1・3・5・7・9・11・13・(15)
def _f11_stack13():
    o = []
    s = 10
    X, Y = 16, 60
    ns = ["C4", "E4", "G4", "B4", "D5", "F5", "A5", "C6"]
    degs = [1, 3, 5, 7, 9, 11, 13, 15]
    dx = 50
    items = []
    for i, n in enumerate(ns):
        c = INK if i < 4 else (SIG if i < 7 else MUT)
        items.append(dict(x=64 + i * dx, notes=[n], fill=c))
    o.append(_f11_staff(X, Y, 64 + 7 * dx + 34, s, "treble", items))
    for i, (n, d) in enumerate(zip(ns, degs)):
        cx = X + 64 + i * dx
        c = INK if i < 4 else (SIG if i < 7 else MUT)
        o.append(T(cx, Y + 4 * s + 34, "%d" % d, "middle", 14, c, True))
        o.append(T(cx, Y + 4 * s + 52, nname(n, False), "middle", 11, MUT))
    o.append(T(X + 30, Y + 4 * s + 34, "度数", "end", 10, MUT))
    # 上の括弧
    def over(i1, i2, txt, c):
        xa, xb = X + 64 + i1 * dx - 12, X + 64 + i2 * dx + 12
        yy = 22
        o.append(PL([(xa, yy + 8), (xa, yy), (xb, yy), (xb, yy + 8)], c, 1.4))
        o.append(T((xa + xb) / 2, yy - 6, txt, "middle", 11, c, True))
    over(0, 3, "セブンスコード（根音・3・5・7 度の音）", INK)
    over(4, 6, "テンション", SIG)
    o.append(T(X + 64 + 7 * dx, 18, "15 度 =", "middle", 10, MUT))
    o.append(T(X + 64 + 7 * dx, 32, "2 オクターブ", "middle", 10, MUT))
    # 右: 9・11・13 度を単音程に直す
    rx = 500
    for k, (d, sd, L) in enumerate([(9, 2, "D"), (11, 4, "F"), (13, 6, "A")]):
        y = 66 + k * 36
        o.append(T(rx, y, "%d 度 = %d 度 + 1 オクターブ" % (d, sd), "start", 11, SIG, True))
        o.append(T(rx + 12, y + 15, "（C の上の %s）" % L, "start", 10, MUT))
    return SVG(712, Y + 4 * s + 70, o, "C から 3 度を重ね続けると、度数は 2 ずつ増えて 7 度の上に 9・11・13 度が来る。15 度は 2 オクターブで、"
               "根音と同じ C に戻る。C・E・G・B・D・F・A で、7 つの文字がちょうど 1 回ずつ現れる。")
F["e11_stack13"] = _f11_stack13()


# テンションの名前（C7 の上）
def _f11_tnames():
    o = []
    info = {}
    X, Y = 76, 30
    ww = 40
    hl = {60: dict(c=SIG, label="C", strong=True), 64: dict(c=BLU, label="E", strong=True), 67: dict(c=BLU, label="G", strong=True),
          70: dict(c=PUR, label="", strong=True)}
    tens = {73: "♭9", 74: "9", 75: "♯9", 77: "11", 78: "♯11", 80: "♭13", 81: "13"}
    for m, t in tens.items():
        hl[m] = dict(c=GRN2, label="", strong=False)
    o.append(KEYBOARD(X, Y, 60, 83, ww=ww, wh=120, hl=hl, names=None, info=info))
    # 黒鍵のテンションは鍵の上に、白鍵は鍵の下のほうに名前を書く
    for m, t in tens.items():
        cx, yb = info[m]
        if IS_BLACK[m % 12]:
            o.append(T(cx, Y - 8, t, "middle", 12, GRN2, True))
        else:
            o.append(T(cx, yb - 10, t, "middle", 12.5, GRN2, True))
    o.append(T(info[70][0], Y - 8, "7", "middle", 12, PUR, True))
    for m, lab in ((76, "(3)"), (79, "(5)")):
        o.append(T(info[m][0], info[m][1] - 10, lab, "middle", 10.5, MUT))
    o.append(T(info[82][0], Y - 8, "(7)", "middle", 10.5, MUT))
    o.append(T(X - 10, Y + 60, "C7", "end", 13, INK, True))
    o.append(T((info[60][0] + info[71][0]) / 2, Y + 138, "C7 の構成音（根音・3・5・7 度の音）", "middle", 10.5, MUT))
    o.append(T((info[72][0] + info[83][0]) / 2, Y + 138, "1 オクターブ上（緑がテンション）", "middle", 10.5, MUT))
    # 下の表
    rows = [("♭9", "短 9 度", 13, "D♭"), ("9", "長 9 度", 14, "D"), ("♯9", "増 9 度", 15, "D♯"), ("11", "完全 11 度", 17, "F"),
            ("♯11", "増 11 度", 18, "F♯"), ("♭13", "短 13 度", 20, "A♭"), ("13", "長 13 度", 21, "A")]
    ty = Y + 168
    x1, cw = 150, 78
    for lab, yy in (("テンション", 0), ("音程", 20), ("半音の数", 40), ("C の上の音", 60)):
        o.append(T(x1 - 14, ty + yy, lab, "end", 10.5, MUT, True))
    for k, (t, iv, sm, L) in enumerate(rows):
        cx = x1 + k * cw + cw / 2
        alt = t[0] in "♭♯"
        o.append(T(cx, ty, t, "middle", 13, SIG if alt else INK, True))
        o.append(T(cx, ty + 20, iv, "middle", 10.5, INK))
        o.append(T(cx, ty + 40, str(sm), "middle", 11, INK))
        o.append(T(cx, ty + 60, L, "middle", 11, MUT))
    return SVG(712, ty + 74, o, "C7 の 1 オクターブ上で、構成音と重ならない鍵がテンションになる。何も付けない 9・11・13 は長 9 度・完全 11 度・長 13 度で、"
               "それより半音小さいものに ♭、大きいものに ♯ を付ける。E・G・B♭ の 1 オクターブ上は構成音と同じ音なので、テンションとは呼ばない。")
F["e11_tnames"] = _f11_tnames()


# ハ長調の各和音の上の 9・11・13 度（音階の音）
_f11_TN = {13: "♭9", 14: "9", 15: "♯9", 17: "11", 18: "♯11", 20: "♭13", 21: "13"}

def _f11_tension_cells():
    """ハ長調の 7 つの和音について、[(名前, 構成音, [(テンション音名, 名前, 半音, 相手の構成音, 相手との半音)] )]"""
    sc = spell_scale("C4", MAJOR, 22)
    out = []
    for i in range(7):
        ns = [sc[i], sc[i + 2], sc[i + 4], sc[i + 6]]
        ms = [parse(n)["midi"] for n in ns]
        kind = _f11_kind([m - ms[0] for m in ms])
        cells = []
        for k, pi in ((8, 0), (10, 1), (12, 2)):
            t = sc[i + k]
            sm = parse(t)["midi"] - ms[0]
            cells.append((t, _f11_TN[sm], sm, ns[pi], parse(t)["midi"] - ms[pi]))
        out.append((nname(ns[0], False) + kind[0], ns, cells))
    return out


def _f11_ttable():
    o = []
    x0, y0, cw, rh = 236, 52, 150, 32
    for j, h in enumerate(["9 度", "11 度", "13 度"]):
        o.append(T(x0 + j * cw + cw / 2, y0 - 14, h, "middle", 12, INK, True))
    o.append(T(x0 - 120, y0 - 14, "和音（構成音）", "middle", 10.5, MUT))
    for i, (nm, ns, cells) in enumerate(_f11_tension_cells()):
        y = y0 + i * rh
        o.append(T(x0 - 160, y + 21, nm, "start", 12.5, INK, True))
        o.append(T(x0 - 82, y + 21, " ".join(nname(n, False) for n in ns), "start", 10.5, MUT))
        for j, (t, tn, sm, p, ps) in enumerate(cells):
            x = x0 + j * cw
            alt = tn[0] in "♭♯"
            o.append(RECT(x + 6, y + 3, cw - 12, rh - 6, 5, SSOFT if alt else PAN, SIG if alt else LIN, 1.3 if alt else 1.0))
            o.append(T(x + cw / 2 - 8, y + 21, nname(t, False), "end", 13, INK, True))
            o.append(T(x + cw / 2 + 2, y + 21, "（%s）" % tn, "start", 11.5, SIG if alt else MUT, alt))
    return SVG(712, y0 + 7 * rh + 12, o, "ハ長調の音だけで重ねたときの、各和音の 9・11・13 度の音。和音によって大きさが違い、"
               "♭9・♯11・♭13 になるもの（色付き）もある。どれを重ねてよいかは 4 節で決める。")
F["e11_ttable"] = _f11_ttable()


# ---------------------------------------------------------------- 4 節
# テンションは構成音の 9 度上にある（CM7 の場合）
def _f11_partner():
    o = []
    s = 10
    X, Y = 16, 40
    pairs = [("C4", "D5", "9 度の音", "根音"), ("E4", "F5", "11 度の音", "3 度の音"), ("G4", "A5", "13 度の音", "5 度の音")]
    items = []
    for i, (a, b, tn, pn) in enumerate(pairs):
        sm = parse(b)["midi"] - parse(a)["midi"]
        c = ALI if sm == 13 else BLU
        items.append(dict(x=90 + i * 200, notes=[a, b], fill=c))
    o.append(_f11_staff(X, Y, 90 + 2 * 200 + 60, s, "treble", items))
    for i, (a, b, tn, pn) in enumerate(pairs):
        sm = parse(b)["midi"] - parse(a)["midi"]
        c = ALI if sm == 13 else BLU
        cx = X + 90 + i * 200
        ya = Y + 4 * s - (parse(a)["dia"] - 30) * s / 2
        yb = Y + 4 * s - (parse(b)["dia"] - 30) * s / 2
        o.append(PL([(cx + 14, yb), (cx + 22, yb), (cx + 22, ya), (cx + 14, ya)], c, 1.4))
        o.append(T(cx + 28, (ya + yb) / 2 - 4, "%s 9 度" % ("短" if sm == 13 else "長"), "start", 11.5, c, True))
        o.append(T(cx + 28, (ya + yb) / 2 + 12, "半音 %d" % sm, "start", 10.5, c))
        y = Y + 4 * s + 34
        o.append(T(cx, y, "%s %s" % (tn, nname(b, False)), "middle", 11.5, INK, True))
        o.append(T(cx, y + 17, "と %s %s" % (pn, nname(a, False)), "middle", 11.5, INK, True))
    return SVG(712, Y + 4 * s + 66, o, "CM7 の 3 つのテンションと、その 9 度下の構成音。9 度の音は根音の、11 度の音は 3 度の音の、"
               "13 度の音は 5 度の音のちょうど 9 度上にある。CM7 では 11 度の音 F だけが、3 度の音 E と短 9 度になる。")
F["e11_partner"] = _f11_partner()


# 短 9 度と長 9 度のスペクトル
def _f11_m9spec():
    o = []
    rows = [("短 9 度（E4–F5）", "E4", "F5", "F5"), ("長 9 度（E4–F♯5）", "E4", "F#5", "F♯5")]
    y = 34
    for title, a, b, lb in rows:
        o.append(T(16, y - 10, title, "start", 12.5, INK, True))
        svg, st = SPECTRUM(16, y, 680, [dict(f=freq(parse(a)["midi"]), label="E4", c=SIG), dict(f=freq(parse(b)["midi"]), label=lb, c=BLU)],
                           H=8, lane_h=40, fmin=290, fmax=5600, axis=False)
        o.append(svg)
        y += 2 * 40 + 40
    yb = y - 40 + 2
    Xf = lambda f: 16 + 86 + (680 - 86) * math.log(f / 290) / math.log(5600 / 290)
    o.append(W(16 + 86, yb, 696, yb, c=MUT, lw=1))
    for m, lab in [(72, "C5"), (84, "C6"), (96, "C7"), (108, "C8")]:
        xx = Xf(freq(m))
        o.append(W(xx, yb, xx, yb + 5, c=MUT, lw=1))
        o.append(T(xx, yb + 17, lab, "middle", 9.5, MUT))
    return SVG(712, yb + 26, o, "短 9 度では、上の音（F5）の第 1・2・3 倍音のちょうど半音下に、下の音（E4）の第 2・4・6 倍音があり、"
               "3 組ともぶつかる（赤い波線）。長 9 度では差が全音になり、ぶつかりは 2 組に減る。")
F["e11_m9spec"] = _f11_m9spec()


# 1 オクターブより広い音程の粗さ（下の音 E4）
def _f11_m9bars():
    o = []
    x0, y0, w, h = 70, 196, 610, 150
    names = ["完全 8 度", "短 9 度", "長 9 度", "短 10 度", "長 10 度", "完全 11 度", "増 11 度", "完全 12 度", "短 13 度", "長 13 度", "短 14 度", "長 14 度", "完全 15 度"]
    hot = {13: ALI, 14: BLU}
    vals = []
    for k, sm in enumerate(range(12, 25)):
        co, cl, R = spec_analyze([freq(64), freq(64 + sm)], 8)
        vals.append(100 * R / ROUGH_REF)
    vmax = 40.0
    o.append(AXES(x0, y0, w + 14, h + 14, None, "粗さ"))
    for v in (10, 20, 30, 40):
        yy = y0 - h * v / vmax
        o.append(W(x0, yy, x0 + w, yy, c=LIN, lw=0.8, dash="2,4"))
        o.append(T(x0 - 6, yy + 4, "%d" % v, "end", 9.5, MUT))
    bw = w / 13.0
    for k, (nm, v) in enumerate(zip(names, vals)):
        sm = 12 + k
        x = x0 + k * bw + 6
        c = hot.get(sm, MUT)
        hh = h * v / vmax
        o.append(RECT(x, y0 - hh, bw - 12, hh, 2, c, c, 1))
        o.append(T(x + (bw - 12) / 2, y0 - hh - 6, "%.0f" % v, "middle", 10.5, c, True))
        a, b = nm.split(" ", 1)
        o.append(T(x + (bw - 12) / 2, y0 + 16, a, "middle", 10.5, c if sm in hot else MUT, sm in hot))
        o.append(T(x + (bw - 12) / 2, y0 + 30, b, "middle", 10.5, c if sm in hot else MUT, sm in hot))
        o.append(T(x + (bw - 12) / 2, y0 + 46, "%d" % sm, "middle", 9.5, MUT))
    o.append(T(x0 - 8, y0 + 46, "半音", "end", 9.5, MUT))
    o.append(T(x0 + w, 22, "下の音 E4、上の音を E5 から E6 まで（倍音 8 つ、短 2 度 C4–C♯4 を 100）", "end", 10.5, INK, True))
    return SVG(712, y0 + 58, o, "1 オクターブより広い音程の、2 音の粗さ。短 9 度（半音 13）がいちばん粗く、"
               "長 9 度（半音 14）の約 1.7 倍になる。")
F["e11_m9bars"] = _f11_m9bars()


# アボイドノートの一覧（ハ長調）
def _f11_avoid():
    o = []
    x0, y0, cw, rh = 168, 54, 178, 40
    for j, h in enumerate(["9 度（相手: 根音）", "11 度（相手: 3 度の音）", "13 度（相手: 5 度の音）"]):
        o.append(T(x0 + j * cw + cw / 2, y0 - 14, h, "middle", 11.5, INK, True))
    for i, (nm, ns, cells) in enumerate(_f11_tension_cells()):
        y = y0 + i * rh
        o.append(T(20, y + 25, nm, "start", 13, INK, True))
        for j, (t, tn, sm, p, ps) in enumerate(cells):
            x = x0 + j * cw
            bad = ps == 13
            c = ALI if bad else GRN2
            o.append(RECT(x + 5, y + 3, cw - 10, rh - 6, 6, ASOFT if bad else GSOFT, c, 1.4))
            co, cl, R = spec_analyze([freq(parse(p)["midi"]), freq(parse(t)["midi"])], 8)
            o.append(T(x + 16, y + 18, "%s（%s）" % (nname(t, False), tn), "start", 12, c, True))
            o.append(T(x + 16, y + 32, "%s の%s 9 度上" % (nname(p, False), "短" if bad else "長"), "start", 10, INK))
            o.append(T(x + cw - 14, y + 25, "%.0f" % (100 * R / ROUGH_REF), "end", 12, c, True))
            if nm == "Dm7" and j == 2:
                o.append(T(x + cw - 40, y + 14, "※", "middle", 10, MUT))
    yb = y0 + 7 * rh + 18
    o.append(RECT(20, yb - 11, 14, 12, 3, GSOFT, GRN2, 1.2))
    o.append(T(40, yb, "使えるテンション（相手と長 9 度）", "start", 10.5, GRN2, True))
    o.append(RECT(250, yb - 11, 14, 12, 3, ASOFT, ALI, 1.2))
    o.append(T(270, yb, "アボイドノート（相手と短 9 度）", "start", 10.5, ALI, True))
    o.append(T(692, yb, "右の数: 相手との 2 音の粗さ", "end", 10.5, MUT))
    o.append(T(20, yb + 20, "※ 書物によっては、Dm7 の 13 度の音 B も避ける音に数える（本文）。", "start", 10, MUT))
    return SVG(712, yb + 30, o, "ハ長調の各和音のテンションの候補（音階の音）と、その 9 度下の構成音（相手）との関係。"
               "相手と短 9 度になる音がアボイドノートで、2 音の粗さは 28〜36。長 9 度になる音の粗さは 12〜25 にとどまる。")
F["e11_avoid"] = _f11_avoid()


# ---------------------------------------------------------------- 5 節
# 3 度の音と 7 度の音が種類を決める（5 度の音は 4 つとも同じ）
def _f11_guide():
    o = []
    x0, y0, cw, rh = 214, 58, 104, 36
    heads = [("根音", INK), ("3 度の音", SIG), ("5 度の音", MUT), ("7 度の音", SIG)]
    for j, (h, c) in enumerate(heads):
        o.append(T(x0 + j * cw + cw / 2, y0 - 12, h, "middle", 11.5, c, True))
    # ガイドトーンの括弧
    o.append(T(x0 + 1 * cw + cw / 2, y0 - 34, "ガイドトーン", "middle", 11, SIG, True))
    o.append(T(x0 + 3 * cw + cw / 2, y0 - 34, "ガイドトーン", "middle", 11, SIG, True))
    types = [_f11_TYPES[0], _f11_TYPES[1], _f11_TYPES[2], _f11_TYPES[3]]
    for i, (suf, jp, tq, sq, ivs) in enumerate(types):
        y = y0 + i * rh
        ns = _f11_7("C4", ivs)
        o.append(T(20, y + 23, "C" + suf, "start", 13, INK, True))
        o.append(T(80, y + 23, jp, "start", 10.5, MUT))
        for j, n in enumerate(ns):
            x = x0 + j * cw
            if j == 0:
                fl, c, tc = PAN, LIN, INK
                sub = ""
            elif j == 2:
                fl, c, tc = PAN, LIN, MUT
                sub = "完全 5 度"
            else:
                q = tq if j == 1 else sq
                fl, c, tc = _f11_TS[q], _f11_TC[q], _f11_TC[q]
                sub = "%s %d 度" % (q, 3 if j == 1 else 7)
            o.append(RECT(x + 6, y + 3, cw - 12, rh - 6, 5, fl, c, 1.2))
            o.append(T(x + 30, y + 23, nname(n, False), "middle", 13, tc, True))
            if sub:
                o.append(T(x + 52, y + 22, sub, "start", 9.5, tc))
    yb = y0 + 4 * rh + 20
    o.append(T(x0 + 2 * cw + cw / 2, yb, "4 つとも同じ G", "middle", 10.5, MUT, True))
    return SVG(712, yb + 12, o, "C を根音とする 4 種類のセブンスコード。5 度の音はどれも同じ G（完全 5 度）で、種類の違いは "
               "3 度の音と 7 度の音の組み合わせだけで決まる。この 2 音をガイドトーンという。")
F["e11_guide"] = _f11_guide()


# IIm7 → V7 → IM7 のガイドトーン
def _f11_guideline():
    o = []
    s = 9
    X, Y = 16, 40
    ch = [("Dm7", "IIm7", "D3", "F4", "C5"), ("G7", "V7", "G2", "B4", "F4"), ("CM7", "IM7", "C3", "E4", "B4")]   # (名前, ディグリー, 根音, 3 度の音, 7 度の音)
    items = []
    xs = [110, 300, 490]
    for (nm, rn, b, g3, g7), x in zip(ch, xs):
        items.append(dict(x=x, notes=[b, g3, g7], fills={nname(b): INK, nname(g3): BLU, nname(g7): PUR}, fill=INK, sym=nm, symcol=INK))
    o.append(_f11_staff(X, Y, 560, s, "grand", items))
    def ypos(n):
        p = parse(n)
        if p["midi"] >= 60:
            return Y + 4 * s - (p["dia"] - 30) * s / 2
        return Y + 8 * s + 4 * s - (p["dia"] - 18) * s / 2
    for k in range(2):
        a, b = ch[k], ch[k + 1]
        xa, xb = X + xs[k] + 12, X + xs[k + 1] - 12
        lines = []
        for na, nb in ((a[3], b[4]), (a[4], b[3])):
            ya, yb = ypos(na), ypos(nb)
            same = parse(na)["midi"] == parse(nb)["midi"]
            o.append(W(xa, ya, xb, yb, c=GRN2 if same else ALI, lw=1.6, dash=None if same else "5,3"))
            lines.append(((ya + yb) / 2, same))
        top = min(lines)[0]
        for ym, same in lines:
            o.append(T((xa + xb) / 2, ym - 7 if ym == top else ym + 15, "そのまま" if same else "半音下へ", "middle", 10, GRN2 if same else ALI, True))
    for (nm, rn, b, g3, g7), x in zip(ch, xs):
        o.append(T(X + x, Y + 12 * s + 26, rn, "middle", 11.5, MUT, True))
    o.append(T(600, Y + 2 * s, "3 度の音", "start", 11, BLU, True))
    o.append(T(600, Y + 2 * s + 16, "7 度の音", "start", 11, PUR, True))
    o.append(T(600, Y + 2 * s + 32, "根音（ヘ音記号）", "start", 10.5, INK))
    return SVG(712, Y + 12 * s + 36, o, "IIm7 → V7 → IM7（ハ長調）のガイドトーン。7 度の音が半音下がって次の和音の 3 度の音になり、"
               "3 度の音はそのまま次の和音の 7 度の音になる。上の 2 音だけを順に聞いても、和音の移り変わりが分かる。")
F["e11_guideline"] = _f11_guideline()


# 良い例と悪い例: 同じ 4 音（C・E・B・D）の並べ方
def _f11_voicing():
    o = []
    s = 8
    panels = [("悪い例: 低い音域に詰める", ["C2", "E2", "B2", "D3"], ALI, ASOFT, 16),
              ("良い例: 根音だけ低く、上を広げる", ["C2", "E3", "B3", "D4"], GRN2, GSOFT, 364)]
    for title, ns, c, fl, X in panels:
        o.append(RECT(X, 8, 332, 300, 12, fl, c, 1.4))
        o.append(T(X + 14, 30, title, "start", 12, c, True))
        Y = 62
        o.append(_f11_staff(X + 14, Y, 120, s, "grand", [dict(x=68, notes=ns, fill=INK)]))
        # 隣どうしの音程（半音の数）
        ms = [parse(n)["midi"] for n in ns]
        for k in range(len(ns) - 1, 0, -1):
            yy = 62 + (len(ns) - 1 - k) * 22 + 6
            o.append(T(X + 160, yy + 10, "%s–%s: 半音 %d" % (nname(ns[k - 1]), nname(ns[k]), ms[k] - ms[k - 1]), "start", 11, INK))
        R = spec_analyze([freq(m) for m in ms], 8)[2]
        o.append(T(X + 160, 62 + 3 * 22 + 30, "粗さ %d" % round(100 * R / ROUGH_REF), "start", 15, c, True))
        info = {}
        hl = {m: dict(c=c, label="", strong=True) for m in ms}
        o.append(KEYBOARD(X + 20, 230, 36, 71, ww=13.4, wh=60, hl=hl, names="c", info=info))
    return SVG(712, 316, o, "同じ C・E・B・D（CM7(9) から 5 度の音を省いたもの）でも、低い音域で間を詰めると粗さが倍以上になる。"
               "根音だけを低く置き、3 度の音・7 度の音・テンションを中ほどに広げると、粗さは半分以下になる。")
F["e11_voicing"] = _f11_voicing()
