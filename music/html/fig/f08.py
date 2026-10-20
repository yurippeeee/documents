# 08 章 三和音 の図（figures.py の関数・定数をそのまま使う）

# 根音から数えた半音の数 → 音程の種類の色（03 章と同じ: 完全 = green、長 = blue、短 = purple、増 = alias、減 = gold。根音は signal）
_f08_QC = {0: SIG, 3: PUR, 4: BLU, 5: GRN2, 6: GLD, 7: GRN2, 8: ALI, 9: BLU}
_f08_QN = {3: "短 3 度", 4: "長 3 度", 5: "完全 4 度", 6: "減 5 度", 7: "完全 5 度", 8: "増 5 度"}
# 三和音の種類: (名前, 根音から 3 度の音までの半音, 根音から 5 度の音までの半音, 色, 淡色)
_f08_TYPES = [("長三和音", 4, 7, BLU, BSOFT), ("短三和音", 3, 7, PUR, PSOFT),
              ("減三和音", 3, 6, GLD, GOSOFT), ("増三和音", 4, 8, ALI, ASOFT)]


def _f08_spell(root, t, f):
    """根音（例 'C4'）と、根音から 3 度の音・5 度の音までの半音の数から、1 つおきの文字で綴った 3 つの音名を返す"""
    p = parse(root)
    out = [root]
    for k, iv in ((2, t), (4, f)):
        dia = p["dia"] + k
        li, octv = dia % 7, dia // 7
        a = p["midi"] + iv - (12 * (octv + 1) + PC_OF_LETTER[li])
        out.append("%s%s%d" % (LETTERS[li], {0: "", 1: "#", -1: "b"}[a], octv))
    return out


def _f08_fills(notes, cols):
    return {nname(n): c for n, c in zip(notes, cols)}


def _f08_cols(notes):
    """根音は signal、3 度の音・5 度の音は根音からの音程の種類の色"""
    r = parse(notes[0])["midi"]
    return [SIG] + [_f08_QC[parse(n)["midi"] - r] for n in notes[1:]]


def _f08_names(notes):
    return "・".join(nname(n, False) for n in notes)


def _f08_stats(notes):
    co, cl, R = spec_analyze([freq(parse(n)["midi"]) for n in notes])
    return len(co), len(cl), int(math.floor(100 * R / ROUGH_REF + 0.5))


def _f08_arcs(o, info, ms, y, cols, sz=11.5):
    """鍵盤の下に、隣り合う 2 音の間の半音の数を V 字の線と数字で書く"""
    for k in range(len(ms) - 1):
        xa, xb = info[ms[k]][0], info[ms[k + 1]][0]
        o.append(PL([(xa, y), ((xa + xb) / 2, y + 11), (xb, y)], cols[k], 1.8))
        o.append(T((xa + xb) / 2, y + 26, "%d" % (ms[k + 1] - ms[k]), "middle", sz, cols[k], True))


def _f08_ny(n, ytop, s, clef="treble"):
    """五線の上での音の高さ（y）。clef='grand' なら C4 以上を上の段に置く"""
    p = parse(n)
    if clef == "grand":
        if p["midi"] >= 60:
            return ytop + 4 * s - (p["dia"] - 30) * s / 2
        return ytop + 12 * s - (p["dia"] - 18) * s / 2
    return ytop + 4 * s - (p["dia"] - (30 if clef == "treble" else 18)) * s / 2


# 1 節: 3 度の上に 3 度を重ねる
def _f08_stack():
    o = []
    s, yt, sx = 11, 52, 16
    steps = [["C4"], ["C4", "E4"], ["C4", "E4", "G4"]]
    xs = [76, 160, 244]
    cols = [SIG, BLU, GRN2]
    items = [dict(x=x, notes=ns, fills=_f08_fills(ns, cols)) for x, ns in zip(xs, steps)]
    o.append(STAFF(sx, yt, 300, s=s, clef="treble", items=items))
    for k in range(2):
        xa, xb = sx + xs[k] + 14, sx + xs[k + 1] - 14
        o.append(ARR(xa, yt - 14, xb, yt - 14, MUT, 1.4))
        o.append(T((xa + xb) / 2, yt - 22, "3 度上を重ねる", "middle", 10.5, MUT))
    for x, t in zip(xs, ["C", "C・E", "C・E・G"]):
        o.append(T(sx + x, yt + 4 * s + 40, t, "middle", 12.5, INK, True))
    # 呼び名（最後の和音から引き出し線）
    xn = sx + xs[2] + 11
    for n, lab, c, ly in [("G4", "5 度の音", GRN2, yt + 6), ("E4", "3 度の音", BLU, yt + 40), ("C4", "根音", SIG, yt + 74)]:
        y = _f08_ny(n, yt, s)
        o.append(W(xn, y, xn + 34, ly - 4, c=c, lw=1.2))
        o.append(T(xn + 38, ly, lab + " " + n[0], "start", 12.5, c, True))
    # 右: 文字を数える
    X0, dx = 412, 38
    rows = [(62, "CDE", "C から E: 3 度"), (120, "EFG", "E から G: 3 度"), (178, "CDEFG", "C から G: 3 + 3 − 1 = 5 度")]
    colof = {"C": (SIG, SSOFT), "E": (BLU, BSOFT), "G": (GRN2, GSOFT)}
    for y, letters, txt in rows:
        for L in letters:
            i = "CDEFG".index(L)
            c, fl = colof.get(L, (LIN, PAN))
            o.append(CIRC(X0 + i * dx, y - 5, 14, c, 1.5, fl))
            o.append(T(X0 + i * dx, y, L, "middle", 12.5, INK if L in colof else MUT, L in colof))
        o.append(T(X0 + 4 * dx + 26, y, txt, "start", 12, INK, True))
    o.append(T(X0 - 20, 30, "文字の名前を、両端を含めて数える（03 章 2 節）", "start", 10.5, MUT))
    return SVG(712, 206, o, "C の 3 度上に E、E の 3 度上に G を重ねると、C・E・G の三和音ができる。"
               "3 度の上に 3 度を重ねた音程は 3 + 3 − 1 = 5 度なので、G は C の 5 度上の音である。"
               "いちばん下の C が根音、E が 3 度の音、G が 5 度の音で、3 つの音は五線の線の上にそろう。")
F["e08_stack"] = _f08_stack()


# 1 節: 3 度の重ね方は 4 通り
def _f08_combos():
    o = []
    x0, y0, cw, ch = 168, 72, 256, 124
    o.append(T(x0 + cw, 22, "上の 3 度（3 度の音 → 5 度の音）", "middle", 12.5, INK, True))
    for j, (nm, c) in enumerate([("短 3 度（半音 3）", PUR), ("長 3 度（半音 4）", BLU)]):
        o.append(T(x0 + j * cw + cw / 2, 52, nm, "middle", 12, c, True))
    o.append(T(16, 34, "下の 3 度", "start", 12.5, INK, True))
    o.append(T(16, 52, "（根音 → 3 度の音）", "start", 10.5, MUT))
    for i, (nm, a, c) in enumerate([("長 3 度（半音 4）", 4, BLU), ("短 3 度（半音 3）", 3, PUR)]):
        y = y0 + i * ch
        o.append(T(16, y + ch / 2 + 4, nm, "start", 12, c, True))
        for j, b in enumerate((3, 4)):
            x = x0 + j * cw
            f = a + b
            col, fl = {7: (GRN2, GSOFT), 6: (GLD, GOSOFT), 8: (ALI, ASOFT)}[f]
            o.append(RECT(x + 4, y + 4, cw - 8, ch - 8, 10, fl, col, 1.4))
            notes = _f08_spell("C4", a, f)
            o.append(STAFF(x + 12, y + 38, 96, s=7, clef="treble", items=[dict(x=62, notes=notes, fills=_f08_fills(notes, _f08_cols(notes)))]))
            tx = x + 122
            o.append(T(tx, y + 32, "半音 %d + %d = %d" % (a, b, f), "start", 12, INK, True))
            o.append(T(tx, y + 52, "根音 → 5 度の音:", "start", 10.5, MUT))
            o.append(T(tx, y + 71, _f08_QN[f], "start", 13, col, True))
            o.append(T(tx, y + 92, "例 " + _f08_names(notes), "start", 11.5, INK))
            o.append(T(x + cw - 16, y + ch - 14, "→ %s 節" % ("2" if f == 7 else "3"), "end", 10.5, col, True))
    return SVG(696, y0 + 2 * ch + 6, o, "下の 3 度と上の 3 度は、それぞれ長 3 度か短 3 度なので、重ね方は 4 通りある。"
               "根音から 5 度の音までの半音の数は、下と上の 3 度の半音の数の和で、7 なら完全 5 度（緑）、6 なら減 5 度、8 なら増 5 度になる。"
               "例は C を根音にしたもの。")
F["e08_combos"] = _f08_combos()


# 2 節・3 節: 2 種類の三和音を並べる（鍵盤・五線・半音の数）
def _f08_pair(kinds, cap):
    o = []
    for k, (nm, t, f, col, fl) in enumerate(kinds):
        px = 12 + k * 348
        notes = _f08_spell("C4", t, f)
        ms = [parse(n)["midi"] for n in notes]
        cols = _f08_cols(notes)
        o.append(RECT(px, 6, 336, 262, 12, PAN, col, 1.4))
        o.append(T(px + 16, 32, nm, "start", 14, col, True))
        o.append(T(px + 104, 32, _f08_names(notes), "start", 13, INK, True))
        info = {}
        hl = {m: dict(c=c, label=nname(n, False), strong=True) for m, n, c in zip(ms, notes, cols)}
        o.append(KEYBOARD(px + 16, 48, 60, 72, ww=22, wh=84, hl=hl, names=None, info=info))
        _f08_arcs(o, info, ms, 48 + 84 + 6, [_f08_QC[t], _f08_QC[f - t]])
        xa, xb = info[ms[0]][0], info[ms[2]][0]
        o.append(DIM(xa, 186, xb, 186))
        o.append(T((xa + xb) / 2, 202, "%d（%s）" % (f, _f08_QN[f]), "middle", 11.5, _f08_QC[f], True))
        o.append(STAFF(px + 212, 56, 110, s=9, clef="treble", items=[dict(x=66, notes=notes, fills=_f08_fills(notes, cols))]))
        lines = [("根音 → 3 度の音", t), ("3 度の音 → 5 度の音", f - t), ("根音 → 5 度の音", f)]
        for i, (lab, sm) in enumerate(lines):
            y = 226 + i * 17
            o.append(T(px + 16, y, lab, "start", 11, MUT))
            nm2 = _f08_QN[sm] if sm != f - t or i != 1 else {3: "短 3 度", 4: "長 3 度"}[sm]
            o.append(T(px + 150, y, "%s（半音 %d）" % (nm2, sm), "start", 11.5, _f08_QC[sm], True))
    return SVG(708, 274, o, cap)


F["e08_majmin"] = _f08_pair(_f08_TYPES[:2], "C を根音にした長三和音（左）と短三和音（右）。鍵盤の下の数は、隣り合う構成音の間の半音の数。"
                            "違うのは 3 度の音だけ（E と E♭）で、どちらも根音から 5 度の音までは完全 5 度（半音 7）である。")
F["e08_dimaug"] = _f08_pair(_f08_TYPES[2:], "C を根音にした減三和音（左）と増三和音（右）。減三和音は短 3 度を 2 つ、増三和音は長 3 度を 2 つ重ねたもので、"
                            "根音から 5 度の音までは減 5 度（半音 6）と増 5 度（半音 8）になる。")


# 2 節・3 節: 3 つの音のスペクトル
def _f08_specs(sets, cap):
    o = []
    y = 38
    lane = 34
    for title, notes in sets:
        o.append(T(16, y - 12, title, "start", 12.5, INK, True))
        svg, st = SPECTRUM(16, y, 680, [dict(f=freq(parse(n)["midi"]), label=nname(n), c=c) for n, c in zip(notes, _f08_cols(notes))],
                           H=8, lane_h=lane, fmin=230, fmax=3900, axis=False)
        o.append(svg)
        y += 3 * lane + 46
    yb = y - 46 + 4
    X = lambda fq: 16 + 86 + (680 - 86) * math.log(fq / 230) / math.log(3900 / 230)
    o.append(W(16 + 86, yb, 696, yb, c=MUT, lw=1))
    for m, lab in [(60, "C4"), (72, "C5"), (84, "C6"), (96, "C7")]:
        xx = X(freq(m))
        o.append(W(xx, yb, xx, yb + 5, c=MUT, lw=1))
        o.append(T(xx, yb + 17, lab, "middle", 9.5, MUT))
    return SVG(712, yb + 26, o, cap)


F["e08_specmm"] = _f08_specs([("長三和音 C・E・G（平均律）", ["C4", "E4", "G4"]), ("短三和音 C・E♭・G（平均律）", ["C4", "Eb4", "G4"])],
                             "3 つの音の第 1〜第 8 倍音を、比の目盛に並べた。緑の線は一致する倍音、赤い波線はぶつかる倍音（04 章 4 節と同じ表示）。"
                             "長三和音と短三和音は、一致がどちらも 4 組で、ぶつかりと粗さもほとんど同じである。")
F["e08_specda"] = _f08_specs([("減三和音 C・E♭・G♭（平均律）", ["C4", "Eb4", "Gb4"]), ("増三和音 C・E・G♯（平均律）", ["C4", "E4", "G#4"])],
                             "減三和音と増三和音のスペクトル。どちらも、完全 5 度による一致（C の第 3・6 倍音と G の第 2・4 倍音）が無くなり、"
                             "長三和音・短三和音より一致が少なく、ぶつかりが多い。")


# 2 節: 4:5:6 と 10:12:15 を倍音列の中に置く
def _f08_ratio():
    o = []
    fmin, fmax = 20.0, 470.0
    x0, x1 = 186, 696
    X = lambda fq: x0 + (x1 - x0) * math.log(fq / fmin) / math.log(fmax / fmin)
    C2 = freq(36)
    B10 = freq(60) / 10
    xC4, xG4 = X(freq(60)), X(1.5 * freq(60))
    for xx in (xC4, xG4):
        o.append(W(xx, 30, xx, 222, c=LIN, lw=1, dash="3,3"))
    rows = [(92, "C2（65.4 Hz）の倍音列", C2, {4: "C4", 5: "E4", 6: "G4"}, "長三和音 = 第 4・5・6 倍音", BLU, "C2"),
            (178, "約 26.2 Hz の倍音列", B10, {10: "C4", 12: "E♭4", 15: "G4"}, "短三和音 = 第 10・12・15 倍音", PUR, "26.2 Hz")]
    for y, title, f0, hi, lab, col, base in rows:
        o.append(T(16, y - 8, title, "start", 12, INK, True))
        o.append(T(16, y + 10, lab, "start", 11.5, col, True))
        o.append(W(X(f0) - 8, y, x1, y, c=MUT, lw=1))
        n = 1
        while n * f0 <= fmax:
            xx = X(n * f0)
            if n in hi:
                o.append(W(xx, y, xx, y - 34, c=col, lw=3.4))
                o.append(T(xx, y - 40, str(n), "middle", 12, col, True))
                o.append(T(xx, y + 16, hi[n], "middle", 11, col, True))
            else:
                o.append(W(xx, y, xx, y - 16, c=MUT, lw=1.6))
                o.append(T(xx, y - 21, str(n), "middle", 9.5, MUT))
            n += 1
        o.append(T(X(f0), y + 16, base, "middle", 10, MUT))
    # 周波数の目盛（音名）
    yb = 222
    o.append(W(x0 - 20, yb, x1, yb, c=MUT, lw=1))
    for fq, lab in [(27.5, "A0"), (freq(24), "C1"), (freq(36), "C2"), (freq(48), "C3"), (freq(60), "C4")]:
        xx = X(fq)
        o.append(W(xx, yb, xx, yb + 5, c=MUT, lw=1))
        o.append(T(xx, yb + 18, lab, "middle", 10, MUT))
    o.append(T(X(27.5), yb + 33, "ピアノの最低音", "middle", 9.5, MUT))
    o.append(T(x0 - 26, yb + 18, "周波数（対数目盛）", "end", 9.5, MUT))
    return SVG(712, yb + 42, o, "純正な比の長三和音 4:5:6 は、C2 の倍音列の第 4・5・6 倍音（C4・E4・G4）と同じ並びである。"
               "短三和音 10:12:15 を 1 つの音の倍音として読むと、その音は C4 の 10 分の 1 の約 26.2 Hz で、第 11・13・14 倍音が間で抜けている。"
               "横軸は周波数の対数目盛で、縦の破線は C4 と G4 の位置。")
F["e08_ratio"] = _f08_ratio()


# 3 節: 4 種類の比較表
def _f08_four():
    o = []
    hx = [(24, "種類", "start"), (142, "3 度の重ね方", "start"), (252, "根音 → 5 度の音", "start"), (384, "C を根音にした例", "start"),
          (588, "一致", "middle"), (636, "ぶつかり", "middle"), (684, "粗さ", "middle")]
    for x, t, a in hx:
        o.append(T(x, 24, t, a, 10.5, MUT, True))
    rh, y0 = 62, 36
    for i, (nm, t, f, col, fl) in enumerate(_f08_TYPES):
        y = y0 + i * rh
        o.append(RECT(10, y, 692, rh - 6, 8, fl, col, 1.2))
        yc = y + (rh - 6) / 2 + 4
        o.append(T(24, yc, nm, "start", 13, col, True))
        o.append(T(142, yc, "半音 %d + %d" % (t, f - t), "start", 12, INK, True))
        o.append(T(252, yc, "%s（%d）" % (_f08_QN[f], f), "start", 12, _f08_QC[f], True))
        notes = _f08_spell("C4", t, f)
        o.append(STAFF(384, y + 10, 92, s=6, clef="treble", items=[dict(x=52, notes=notes, fills=_f08_fills(notes, _f08_cols(notes)))]))
        o.append(T(484, yc, _f08_names(notes), "start", 11.5, INK, True))
        co, cl, R = _f08_stats(notes)
        o.append(T(588, yc, str(co), "middle", 13, GRN2, True))
        o.append(T(636, yc, str(cl), "middle", 13, ALI, True))
        o.append(T(684, yc, str(R), "middle", 13, INK, True))
    return SVG(712, y0 + 4 * rh, o, "4 種類の三和音（根音は C、平均律）。一致・ぶつかり・粗さは 04 章 4 節と同じ数え方（第 8 倍音まで、粗さは短 2 度 C4–C♯4 を 100 とする）。"
               "5 度が完全 5 度の長三和音・短三和音は一致が多く、減三和音・増三和音は一致が減ってぶつかりが増える。")
F["e08_four"] = _f08_four()


# 4 節: コードネームから構成音を求める（4 つの例）
def _f08_spellfig():
    o = []
    ex = [("D", "D4", 0, "（記号なし）"), ("F♯m", "F#4", 1, "m"), ("Edim", "E4", 2, "dim"), ("E♭aug", "Eb4", 3, "aug")]
    for k, (sym, root, ti, mark) in enumerate(ex):
        nm, t, f, col, fl = _f08_TYPES[ti]
        cx = 12 + (k % 2) * 348
        cy = 8 + (k // 2) * 164
        o.append(RECT(cx, cy, 336, 152, 10, PAN, LIN, 1.2))
        o.append(T(cx + 14, cy + 28, sym, "start", 17, INK, True))
        rn = nname(root, False)
        o.append(T(cx + 86, cy + 21, "根音 %s ・ %s = %s" % (rn, mark, nm), "start", 11, col, True))
        o.append(T(cx + 86, cy + 37, "（3 度の音は半音 %d、5 度の音は半音 %d）" % (t, f), "start", 10.5, MUT))
        notes = _f08_spell(root, t, f)
        p = parse(root)
        nat = []
        for kk in (2, 4):
            dia = p["dia"] + kk
            nat.append("%s%d" % (LETTERS[dia % 7], dia // 7))
        o.append(T(cx + 14, cy + 62, "① 文字: %s・%s・%s" % (rn[0] if len(rn) == 1 else rn[0], nat[0][0], nat[1][0]), "start", 11.5, INK))
        for i, (nt, want, real) in enumerate(zip(nat, (t, f), notes[1:])):
            got = parse(nt)["midi"] - p["midi"]
            if got == want:
                how = "そのまま %s" % nt[0]
            else:
                how = "%d にするため %s" % (want, nname(real, False))
            o.append(T(cx + 14, cy + 84 + i * 20, "%s %s: %s から半音 %d → %s" % ("②" if i == 0 else "　", nt[0], rn, got, how),
                       "start", 11, INK if got == want else _f08_QC[want], got != want))
        o.append(T(cx + 14, cy + 136, "→ 構成音 " + _f08_names(notes), "start", 12.5, col, True))
        o.append(STAFF(cx + 236, cy + 64, 90, s=7, clef="treble", items=[dict(x=58, notes=notes, fills=_f08_fills(notes, _f08_cols(notes)))]))
    o[0:0] = []
    return SVG(708, 8 + 2 * 164, o, "コードネームから構成音を求める手順の例。①根音の文字から 1 つおきに 3 つの文字を取り、"
               "②根音からの半音の数が種類で決まる数になるように ♯・♭ を付ける。根音に ♭ が付いていても、ほかの音に付くとは限らない（右下）。")
F["e08_spell"] = _f08_spellfig()


# 4 節: 正しい綴りと誤った綴り
def _f08_spellcmp():
    o = []
    cases = [("E の長三和音（3 度の音は E から半音 4）", ["E4", "G#4", "B4"], ["E4", "Ab4", "B4"],
              ("文字 E・G・B（1 つおき）", "E–G♯: 長 3 度"), ("文字 E・A・B（1 つおきでない）", "E–A♭: 減 4 度（3 度でない）")),
             ("C の減三和音（5 度の音は C から半音 6）", ["C4", "Eb4", "Gb4"], ["C4", "Eb4", "F#4"],
              ("文字 C・E・G（1 つおき）", "C–G♭: 減 5 度"), ("文字 C・E・F（1 つおきでない）", "C–F♯: 増 4 度（5 度でない）"))]
    for k, (title, good, bad, gt, bt) in enumerate(cases):
        px = 12 + k * 348
        o.append(T(px + 4, 22, title, "start", 12, INK, True))
        for j, (ns, (l1, l2), ok) in enumerate([(good, gt, True), (bad, bt, False)]):
            y = 34 + j * 100
            col, fl = (GRN2, GSOFT) if ok else (ALI, ASOFT)
            o.append(RECT(px, y, 336, 90, 10, fl, col, 1.4))
            o.append(T(px + 14, y + 26, ("○ " if ok else "× ") + _f08_names(ns), "start", 13, col, True))
            o.append(T(px + 14, y + 52, l1, "start", 11, INK))
            o.append(T(px + 14, y + 72, l2, "start", 11, col, True))
            o.append(STAFF(px + 210, y + 22, 112, s=8, clef="treble", items=[dict(x=70, notes=ns, fill=INK)]))
        info = {}
        ms = [parse(n)["midi"] for n in good]
        hl = {m: dict(c=SIG, label="", strong=True) for m in ms}
        o.append(KEYBOARD(px + 14, 240, 60, 71, ww=16, wh=44, hl=hl, names=None, info=info))
        o.append(T(px + 14 + 7 * 16 + 14, 262, "鍵盤ではどちらも同じ 3 つの鍵", "start", 11, MUT))
        o.append(T(px + 14 + 7 * 16 + 14, 278, "（%s と %s は異名同音）" % (nname(good[1 if k == 0 else 2], False), nname(bad[1 if k == 0 else 2], False)), "start", 10.5, MUT))
    return SVG(708, 292, o, "鍵盤では同じ鍵でも、書き方は 1 つおきの文字に決まる。E の長三和音の 3 度の音を A♭ と書くと E–A♭ は 4 度になり、"
               "C の減三和音の 5 度の音を F♯ と書くと C–F♯ は 4 度になる。正しく書くと、3 つの音は五線の線の上（または間）にそろう。")
F["e08_spellcmp"] = _f08_spellcmp()


# 5 節: 基本形と転回形
def _f08_inv():
    o = []
    forms = [("基本形", ["C4", "E4", "G4"], "ベース = 根音 C", SIG),
             ("第 1 転回形", ["E4", "G4", "C5"], "ベース = 3 度の音 E", BLU),
             ("第 2 転回形", ["G4", "C5", "E5"], "ベース = 5 度の音 G", GRN2)]
    role = {"C": SIG, "E": BLU, "G": GRN2}
    for k, (title, ns, sub, bc) in enumerate(forms):
        px = 12 + k * 234
        o.append(RECT(px, 6, 220, 276, 12, PAN, LIN, 1.2))
        o.append(T(px + 110, 30, title, "middle", 14, INK, True))
        o.append(T(px + 110, 50, sub, "middle", 11.5, bc, True))
        cols = [role[n[0]] for n in ns]
        o.append(STAFF(px + 12, 76, 196, s=9, clef="treble", items=[dict(x=96, notes=ns, fills=_f08_fills(ns, cols))]))
        info = {}
        hl = {parse(n)["midi"]: dict(c=c, label=n[0], strong=True) for n, c in zip(ns, cols)}
        o.append(KEYBOARD(px + 20, 150, 60, 76, ww=18, wh=56, hl=hl, names=None, info=info))
        b = parse(ns[0])["midi"]
        o.append(T(px + 110, 232, "ベースから見た音程", "middle", 10.5, MUT))
        for i, n in enumerate(ns[1:]):
            sm = parse(n)["midi"] - b
            d = (parse(n)["dia"] - parse(ns[0])["dia"]) + 1
            q = {(3, 3): "短", (3, 4): "長", (4, 5): "完全", (5, 7): "完全", (6, 8): "短", (6, 9): "長"}[(d, sm)]
            o.append(T(px + 110, 252 + i * 18, "%s–%s: %s %d 度（%d）" % (ns[0][0], n[0], q, d, sm), "middle", 11.5,
                       {"短": PUR, "長": BLU, "完全": GRN2}[q], True))
    for k in range(2):
        xa, xb = 12 + k * 234 + 214, 12 + (k + 1) * 234 + 6
        o.append(ARR(xa - 4, 118, xb + 4, 118, MUT, 1.6))
    return SVG(708, 290, o, "C・E・G の基本形と転回形。いちばん下の音を 1 オクターブ上げるごとに、ベースが根音 → 3 度の音 → 5 度の音と替わる。"
               "構成音の音名と役割（色）は変わらず、ベースから見たほかの音の音程が 3 度・5 度 → 3 度・6 度 → 4 度・6 度と変わる。")
F["e08_inv"] = _f08_inv()


# 5 節: 根音の見つけ方（手順）
def _f08_findroot():
    o = []
    role = {"C": SIG, "E": BLU, "G": GRN2}
    bw = [150, 196, 162, 152]
    gap = 16
    xs = [8]
    for w_ in bw[:-1]:
        xs.append(xs[-1] + w_ + gap)
    titles = ["① 鳴っている音", "② 3 度ずつに並べ直す", "③ いちばん下が根音", "④ ベースの役割"]
    for k in range(4):
        o.append(RECT(xs[k], 8, bw[k], 196, 10, PAN, LIN, 1.2))
        o.append(T(xs[k] + 12, 30, titles[k], "start", 12, INK, True))
        if k < 3:
            o.append(ARR(xs[k] + bw[k] + 2, 106, xs[k + 1] - 2, 106, MUT, 1.6))
    # ①
    ns = ["E4", "C5", "G5"]
    o.append(STAFF(xs[0] + 8, 70, 134, s=8, clef="treble", items=[dict(x=80, notes=ns, fills=_f08_fills(ns, [role[n[0]] for n in ns]))]))
    o.append(T(xs[0] + 12, 160, "下から E4・C5・G5", "start", 11.5, INK, True))
    o.append(T(xs[0] + 12, 180, "ベースは E", "start", 11.5, BLU, True))
    # ②
    tries = [("E・G・C", "G–C が 4 度", False), ("G・C・E", "G–C が 4 度", False), ("C・E・G", "3 度・3 度", True)]
    for i, (a, b, ok) in enumerate(tries):
        y = 64 + i * 42
        c = GRN2 if ok else ALI
        o.append(T(xs[1] + 12, y, ("○ " if ok else "× ") + a + " から", "start", 12, c, True))
        o.append(T(xs[1] + 30, y + 18, b, "start", 11, c))
    o.append(T(xs[1] + 12, 192, "文字が 1 つおきになる並びを探す", "start", 10, MUT))
    # ③
    ns3 = ["C4", "E4", "G4"]
    o.append(STAFF(xs[2] + 8, 60, 100, s=8, clef="treble", items=[dict(x=66, notes=ns3, fills=_f08_fills(ns3, [SIG, BLU, GRN2]))]))
    o.append(T(xs[2] + 116, 82, "線・線", "start", 10, MUT))
    o.append(T(xs[2] + 116, 96, "・線", "start", 10, MUT))
    o.append(T(xs[2] + 12, 142, "根音 C", "start", 12, SIG, True))
    o.append(T(xs[2] + 12, 162, "半音 4 + 3 → 長三和音", "start", 11, BLU, True))
    o.append(T(xs[2] + 12, 182, "コードネーム C", "start", 11.5, INK, True))
    # ④
    o.append(T(xs[3] + 12, 64, "ベース E は", "start", 12, INK))
    o.append(T(xs[3] + 12, 84, "3 度の音", "start", 13, BLU, True))
    o.append(T(xs[3] + 12, 114, "→ 第 1 転回形", "start", 12.5, INK, True))
    o.append(T(xs[3] + 12, 150, "分数コードで", "start", 11, MUT))
    o.append(T(xs[3] + 12, 176, "C/E", "start", 17, INK, True))
    return SVG(712, 212, o, "音の順番がばらばらでも、文字が 1 つおきになるように並べ直すと、いちばん下が根音になる。"
               "E4・C5・G5 は C・E・G と並べ直せるので根音は C の長三和音で、ベースの E は 3 度の音だから第 1 転回形（C/E）である。")
F["e08_findroot"] = _f08_findroot()


# 5 節: 密集配置と開離配置、重複
def _f08_voicing():
    o = []
    role = {"C": SIG, "E": BLU, "G": GRN2}
    panels = [("密集配置", "3 つの音", ["C4", "E4", "G4"], [], "E4・G4 の間に入らない"),
              ("開離配置", "3 つの音", ["C3", "G3", "E4"], ["C4"], "G3・E4 の間に C4 が入る"),
              ("密集配置", "4 つの音（根音を重複）", ["C3", "G3", "C4", "E4"], [], "G3・C4・E4 の間に入らない"),
              ("開離配置", "4 つの音（根音を重複）", ["C3", "G3", "E4", "C5"], ["C4", "G4"], "間に C4 と G4 が入る")]
    s = 6.5
    for k, (t1, t2, ns, ghosts, note) in enumerate(panels):
        px = 8 + k * 176
        close = t1 == "密集配置"
        col, fl = (BLU, BSOFT) if close else (GLD, GOSOFT)
        o.append(RECT(px, 6, 168, 236, 10, PAN, col, 1.3))
        o.append(T(px + 84, 28, t1, "middle", 13, col, True))
        o.append(T(px + 84, 46, t2, "middle", 10.5, MUT))
        yt = 66
        o.append(STAFF(px + 10, yt, 148, s=s, clef="grand", items=[dict(x=96, notes=ns, fills=_f08_fills(ns, [role[n[0]] for n in ns]))]))
        for g in ghosts:
            y = _f08_ny(g, yt, s, "grand")
            o.append(CIRC(px + 10 + 96, y, 0.8 * s + 1.5, role[g[0]], 1.3, "none", dash="2,2"))
            o.append(T(px + 10 + 96 + 12, y + 4, g, "start", 9.5, role[g[0]], True))
        o.append(T(px + 84, 178, _f08_names(ns).replace("・", " "), "middle", 11, INK, True))
        o.append(T(px + 84, 198, "ベースより上の音:", "middle", 9.5, MUT))
        o.append(T(px + 84, 214, note, "middle", 10.5, col, True))
        if len(ns) == 4:
            o.append(T(px + 84, 232, "重複: %s と %s" % (ns[0], [n for n in ns[1:] if n[0] == ns[0][0]][0]), "middle", 10.5, SIG, True))
    return SVG(712, 248, o, "配置の 4 つの例（C・E・G）。ベースより上の音の、隣り合う 2 音の間に構成音が入らないのが密集配置、"
               "1 つずつ入る（点線の丸）のが開離配置である。下の 2 つは、ベースの C を 1 オクターブ上でも鳴らす重複の例。")
F["e08_voicing"] = _f08_voicing()


# 5 節: 低い音域での密集配置と開離配置
def _f08_lowopen():
    o = []
    sets = [("密集配置 C3・E3・G3", ["C3", "E3", "G3"], ALI, "低い音域に 3 度が 2 つ詰まる"),
            ("開離配置 C3・G3・E4", ["C3", "G3", "E4"], GRN2, "E を 1 オクターブ上に移す")]
    y = 40
    lane = 32
    for title, ns, col, tag in sets:
        o.append(T(16, y - 12, title, "start", 12.5, col, True))
        o.append(T(196, y - 12, tag, "start", 10.5, MUT))
        svg, st = SPECTRUM(16, y, 680, [dict(f=freq(parse(n)["midi"]), label=nname(n), c=c) for n, c in zip(ns, [SIG, BLU if ns[1][0] == "E" else GRN2, GRN2 if ns[2][0] == "G" else BLU])],
                           H=8, lane_h=lane, fmin=115, fmax=2800, axis=False)
        o.append(svg)
        y += 3 * lane + 46
    yb = y - 46 + 4
    X = lambda fq: 16 + 86 + (680 - 86) * math.log(fq / 115) / math.log(2800 / 115)
    o.append(W(16 + 86, yb, 696, yb, c=MUT, lw=1))
    for m, lab in [(48, "C3"), (60, "C4"), (72, "C5"), (84, "C6"), (96, "C7")]:
        xx = X(freq(m))
        if xx <= 696:
            o.append(W(xx, yb, xx, yb + 5, c=MUT, lw=1))
            o.append(T(xx, yb + 17, lab, "middle", 9.5, MUT))
    return SVG(712, yb + 26, o, "ベースを C3 にした密集配置（上）と開離配置（下）のスペクトル。E を 1 オクターブ上に移すだけで、"
               "低い音域で近づいていた倍音どうしが離れ、ぶつかりが 20 組から 14 組に、粗さが 220 から 114 に減る。")
F["e08_lowopen"] = _f08_lowopen()
