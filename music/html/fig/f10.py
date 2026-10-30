# 10 章 和音の機能 の図（figures.py の関数・定数をそのまま使う）

_f10_FC = {"T": BLU, "SD": GRN2, "D": SIG}
_f10_FS = {"T": BSOFT, "SD": GSOFT, "D": SSOFT}
# ハ長調のダイアトニックコード（ディグリーネーム → コードネーム, 機能）
_f10_C = {"I": ("C", "T"), "IIm": ("Dm", "SD"), "IIIm": ("Em", "T"), "IV": ("F", "SD"), "V": ("G", "D"),
          "V7": ("G7", "D"), "VIm": ("Am", "T"), "VIIdim": ("Bdim", "D")}


def _f10_chip(x, y, w, h, top, bottom=None, fn=None, hl=False, dash=None, sz=14, bsz=10.5):
    """和音の箱。top = 上の大きな文字、bottom = 下の小さな文字。fn を渡すと機能の色で塗る。hl は赤い太枠。"""
    c = _f10_FC[fn] if fn else LIN
    fill = _f10_FS[fn] if fn else PAN
    o = [RECT(x, y, w, h, 8, fill, c, 1.4, dash)]
    if hl:
        o.append(RECT(x - 3, y - 3, w + 6, h + 6, 10, "none", SIG, 2.4))
    if bottom:
        o.append(T(x + w / 2, y + h / 2 - 1, top, "middle", sz, INK, True))
        o.append(T(x + w / 2, y + h / 2 + bsz + 3, bottom, "middle", bsz, _f10_FC[fn] if fn else MUT, bool(fn)))
    else:
        o.append(T(x + w / 2, y + h / 2 + sz * 0.36, top, "middle", sz, INK, True))
    return "".join(o)


def _f10_gs(x, ytop, w, s, chords, key=0, info=None):
    """大譜表に和音を並べる。chords の各要素: dict(x, up=[上の段の音], bass=[下の段の音], fill, fills={音名: 色},
    sym=上の文字, symcol, label=下の文字, lcol, k=位置を info に入れるときの名前)"""
    items = []
    for c in chords:
        if c.get("up"):
            items.append(dict(x=c["x"], notes=c["up"], staff="treble", fill=c.get("fill", INK), fills=c.get("fills"),
                              key=c.get("k", "") + "u", sym=c.get("sym"), symcol=c.get("symcol", INK), symsz=c.get("symsz", 12)))
        if c.get("bass"):
            items.append(dict(x=c["x"], notes=c["bass"], staff="bass", fill=c.get("bfill", c.get("fill", INK)), fills=c.get("fills"),
                              key=c.get("k", "") + "b", label=c.get("label"), lcol=c.get("lcol", INK), lsz=c.get("lsz", 11.5)))
    return STAFF(x, ytop, w, s=s, clef="grand", items=items, key=key, info=info)


def _f10_move(p, q, c, lab=None, lc=None, dy=-5, sz=10.5, gap=9):
    """音符 p=(x,y) から音符 q へ向かう矢印と、その上（dy）に書く文字"""
    (x1, y1), (x2, y2) = p, q
    o = [ARR(x1 + gap, y1, x2 - gap, y2, c, 1.5, 6)]
    if lab:
        o.append(T((x1 + x2) / 2, (y1 + y2) / 2 + dy, lab, "middle", sz, lc or c, True))
    return "".join(o)


def _f10_dl(m1, m2):
    d = m2 - m1
    return "0" if d == 0 else ("+%d" % d if d > 0 else "−%d" % -d)


def _f10_arrows(pa, pb, cols, mids_a=None, mids_b=None, labs=None):
    """pa, pb: 音符の位置 [(x,y)…]（低い音から順）。各声部の矢印を引き、行き先の音の右に半音の変化を書く。"""
    o = []
    for i, (p, q) in enumerate(zip(pa, pb)):
        c = cols[i]
        lab = labs[i] if labs else _f10_dl(mids_a[i], mids_b[i])
        if lab == "0":
            o.append(W(p[0] + 11, p[1], q[0] - 11, q[1], c=MUT, lw=1.4, dash="3,3"))
        else:
            o.append(ARR(p[0] + 11, p[1], q[0] - 12, q[1], c, 1.6, 6))
        o.append(T(q[0] + 14, q[1] + 4, lab, "start", 11, INK if c == MUT else c, True))
    return "".join(o)


def _f10_mids(ns):
    return sorted(parse(n)["midi"] for n in ns)


# 1 節. 同じ 3 つの和音を、順番だけ変えて並べる
def _f10_ends():
    o = []
    RN = {"C": "I", "F": "IV", "G": "V"}
    rows = [("(a)", "CFGC", "止まると、終わったように落ち着く"),
            ("(b)", "CFCG", "終わらず、次の C を強く待つ"),
            ("(c)", "CGCF", "終わらないが、(b) ほど強くは待たない")]
    o.append(T(20, 24, "ハ長調の C（I）・F（IV）・G（V）の 3 つを、並べる順番だけ変える", "start", 12, INK, True))
    y = 44
    for lab, chs, msg in rows:
        o.append(T(22, y + 29, lab, "start", 13, INK, True))
        for i, c in enumerate(chs):
            x = 60 + i * 90
            o.append(_f10_chip(x, y, 70, 44, c, RN[c], hl=(i == 3)))
            if i < 3:
                o.append(ARR(x + 72, y + 22, x + 88, y + 22, MUT, 1.4, 5))
        o.append(T(60 + 3 * 90 + 70 + 18, y + 27, msg, "start", 11.5, INK, True))
        y += 62
    o.append(T(60 + 3 * 90 + 35, y + 6, "↑ 止まる和音", "middle", 10.5, SIG, True))
    return SVG(680, y + 16, o, "同じ 3 つの和音を、順番だけ変えて並べた 3 つの進行。違いは、最後に止まる和音（赤い枠）だけである。"
               "どの和音で止まるかによって、落ち着き方が違って聞こえる。")
F["e10_ends"] = _f10_ends()


# 2 節. I・IV・V の 3 つで、音階の 7 つの音がすべてそろう
def _f10_primary():
    o = []
    notes = list("CDEFGAB")
    names = ["主音", "上主音", "中音", "下属音", "属音", "下中音", "導音"]
    rows = [("I（C）", "T の代表", "T", "CEG", "C"), ("IV（F）", "SD の代表", "SD", "FAC", "F"), ("V（G）", "D の代表", "D", "GBD", "G")]
    x0, cw, y0, rh = 190, 66, 70, 50
    o.append(T(x0 - 16, 30, "音階の音 →", "end", 10.5, MUT))
    for j, n in enumerate(notes):
        cx = x0 + j * cw + cw / 2
        o.append(T(cx, 28, n, "middle", 14, INK, True))
        o.append(T(cx, 46, "第 %d 音" % (j + 1), "middle", 10, MUT))
        o.append(T(cx, 60, names[j], "middle", 10, INK if j in (0, 3, 4) else MUT, j in (0, 3, 4)))
    for i, (lab, sub, fn, ns, root) in enumerate(rows):
        y = y0 + 8 + i * rh
        o.append(T(x0 - 16, y + 21, lab, "end", 13, _f10_FC[fn], True))
        o.append(T(x0 - 16, y + 37, sub, "end", 10.5, MUT))
        for j, n in enumerate(notes):
            cx = x0 + j * cw + cw / 2
            if n in ns:
                o.append(RECT(x0 + j * cw + 7, y + 4, cw - 14, rh - 8, 7, _f10_FS[fn], _f10_FC[fn], 2.2 if n == root else 1.3))
                o.append(T(cx, y + 24, n, "middle", 13, INK, True))
                if n == root:
                    o.append(T(cx, y + 38, "根音", "middle", 9.5, _f10_FC[fn], True))
            else:
                o.append(D(cx, y + rh / 2, LIN, 2.2))
    y = y0 + 8 + 3 * rh + 6
    o.append(W(x0, y, x0 + 7 * cw, y, c=LIN, lw=1.2))
    o.append(T(x0 - 16, y + 20, "含む代表の数", "end", 10.5, MUT))
    for j, n in enumerate(notes):
        cnt = sum(n in r[3] for r in rows)
        o.append(T(x0 + j * cw + cw / 2, y + 20, "%d" % cnt, "middle", 12.5, INK, True))
    return SVG(680, y + 34, o, "主和音 I・下属和音 IV・属和音 V の 3 つの構成音を、音階の 7 つの音の上に並べた（太い枠が根音）。"
               "どの音も少なくとも 1 つの和音に含まれ、C と G だけが 2 つの和音に含まれる。3 つの機能の名前は、代表の和音の根音（主音・下属音・属音）から来ている。")
F["e10_primary"] = _f10_primary()


# 2 節. 根音が 3 度ずつ並ぶ順に 7 つの和音を並べる（隣どうしは 2 つの音を共有する）
def _f10_chain():
    o = []
    notes = ["D", "F", "A", "C", "E", "G", "B", "D", "F"]
    chords = [("IIm", "Dm", "SD", "SD"), ("IV", "F", "SD", "SD の代表"), ("VIm", "Am", "T", "T（SD との境目）"), ("I", "C", "T", "T の代表"),
              ("IIIm", "Em", "T", "T（D との境目）"), ("V", "G", "D", "D の代表"), ("VIIdim", "Bdim", "D", "D")]
    x0, dx = 150, 52
    X = lambda i: x0 + i * dx
    ytop, rh = 44, 30
    ybot = ytop + 26 + 7 * rh
    # I の音の列を薄く塗る
    for i in (3, 4, 5):
        o.append(RECT(X(i) - 19, ytop - 18, 38, ybot - ytop + 18, 6, BSOFT, "none", 0))
    o.append(T(X(4), ytop - 24, "I の音", "middle", 10.5, BLU, True))
    for i in range(9):
        o.append(W(X(i), ytop + 16, X(i), ybot, c=LIN, lw=0.9, dash="2,4"))
    o.append(T(X(0) - 30, ytop + 5, "3 度ずつ並べた音", "end", 10.5, MUT))
    for i, n in enumerate(notes):
        wrap = i >= 7
        o.append(CIRC(X(i), ytop, 14, MUT if wrap else INK, 1.3, PAN, "3,2" if wrap else None))
        o.append(T(X(i), ytop + 5, n, "middle", 13, MUT if wrap else INK, True))
    for r, (rn, cn, fn, note) in enumerate(chords):
        y = ytop + 26 + r * rh
        xa, xb = X(r) - 20, X(r + 2) + 20
        rep = rn in ("I", "IV", "V")
        o.append(RECT(xa, y, xb - xa, 22, 11, _f10_FS[fn], _f10_FC[fn], 2.4 if rep else 1.3))
        for k in range(3):
            o.append(D(X(r + k), y + 11, _f10_FC[fn], 4.2))
        o.append(T(xa - 8, y + 16, "%s（%s）" % (rn, cn), "end", 11.5, _f10_FC[fn], True))
        o.append(T(X(8) + 32, y + 16, note, "start", 11, _f10_FC[fn], rep))
    o.append(T(20, ybot + 22, "隣り合う 2 つの和音は、帯が重なる 2 つの音を共有する。点線の円の D・F は左端の D・F と同じ音で、VIIdim と IIm も 2 つの音を共有する。", "start", 10.5, MUT))
    return SVG(712, ybot + 34, o, "ハ長調の 7 つの和音を、根音が 3 度ずつ上がる順（Dm → F → Am → C → Em → G → Bdim）に並べた。"
               "左に SD、中央に T、右に D が集まり、VIm は SD との、IIIm は D との境目にある。太い枠は代表の和音 I・IV・V。")
F["e10_chain"] = _f10_chain()


# 3 節. 属七の和音: V の上に 3 度をもう 1 つ重ねる
def _f10_v7():
    o = []
    s = 15
    yt = 44
    items = [dict(x=78, notes=["G4", "B4", "D5"], fill=INK, label="V（G）", lcol=INK, lsz=12),
             dict(x=188, notes=["G4", "B4", "D5", "F5"], fill=INK, fills={"B4": SIG, "F5": SIG}, label="V7（G7）", lcol=SIG, lsz=12)]
    o.append(STAFF(16, yt, 300, s=s, clef="treble", items=items))
    Y = lambda pp: yt + 4 * s - pp * s / 2
    xb = 16 + 188 + 18
    for p1, p2, lab in [(2, 4, "長 3 度（半音 4）"), (4, 6, "短 3 度（半音 3）"), (6, 8, "短 3 度（半音 3）")]:
        o.append(W(xb, Y(p1) - 1.5, xb + 5, Y(p1) - 1.5, xb + 5, Y(p2) + 1.5, xb, Y(p2) + 1.5, c=MUT, lw=1.2))
        o.append(T(xb + 10, (Y(p1) + Y(p2)) / 2 + 4, lab, "start", 10.5, INK))
    o.append(T(176, yt + 4 * s + 66, "3 度の音 B と 7 度の音 F の間は 減 5 度（半音 6）= 三全音", "middle", 11, SIG, True))
    o.append(T(176, yt + 4 * s + 84, "根音 G から 7 度の音 F までは 短 7 度（半音 10）", "middle", 11, INK))
    info = {}
    hl = {67: dict(c=MUT, label="G"), 71: dict(c=SIG, label="B", strong=True), 74: dict(c=MUT, label="D"), 77: dict(c=SIG, label="F", strong=True)}
    kx, ky = 456, 40
    o.append(KEYBOARD(kx, ky, 67, 79, ww=26, wh=100, hl=hl, names=None, info=info))
    yb = ky + 100 + 12
    for a, b, n in [(67, 71, 4), (71, 74, 3), (74, 77, 3)]:
        xa, xb2 = info[a][0], info[b][0]
        o.append(PL([(xa, yb - 4), ((xa + xb2) / 2, yb + 8), (xb2, yb - 4)], MUT, 1.4))
        o.append(T((xa + xb2) / 2, yb + 22, "%d" % n, "middle", 11, INK, True))
    o.append(T(info[71][0], yb + 42, "導音", "middle", 10.5, SIG, True))
    o.append(T(info[77][0], yb + 42, "7 度の音", "middle", 10.5, SIG, True))
    o.append(T(kx + kb_width(67, 79, 26) / 2, 26, "G7 = G・B・D・F", "middle", 12, INK, True))
    return SVG(712, yt + 4 * s + 98, o, "V（G・B・D）の上に、音階の音で 3 度をもう 1 つ重ねると F が加わり、属七の和音 V7（ハ長調では G7）になる。"
               "3 度の音 B は導音で、7 度の音 F との間は三全音である。")
F["e10_v7"] = _f10_v7()


# 3 節. 三全音の 2 つの音が半音ずつ動くと、3 度・6 度になる（2 通りの上下）
def _f10_tritone():
    o = []
    cases = [("B が下・F が上", ["B3", "F4"], ["C4", "E4"], "減 5 度（半音 6）", "長 3 度（半音 4）", GLD, BLU,
              "半音 6 − 1 − 1 = 4、度数 5 − 1 − 1 = 3", 57, 67),
             ("F が下・B が上", ["F4", "B4"], ["E4", "C5"], "増 4 度（半音 6）", "短 6 度（半音 8）", ALI, PUR,
              "半音 6 + 1 + 1 = 8、度数 4 + 1 + 1 = 6", 64, 74)]
    s = 12
    for k, (title, a, b, la, lb, ca, cb, form, klo, khi) in enumerate(cases):
        px = 14 + k * 350
        o.append(RECT(px, 8, 332, 320, 10, "none", LIN, 1.2))
        o.append(T(px + 166, 30, title, "middle", 12.5, INK, True))
        info = {}
        items = [dict(x=92, notes=a, fill=SIG, key="a", label=la, lcol=ca, lsz=11.5, label_dy=4.6 * s),
                 dict(x=222, notes=b, fill=BLU, key="b", label=lb, lcol=cb, lsz=11.5, label_dy=4.6 * s)]
        o.append(STAFF(px + 14, 54, 290, s=s, clef="treble", items=items, info=info))
        o.append(_f10_arrows(info["a"], info["b"], [SIG, SIG], _f10_mids(a), _f10_mids(b)))
        kinfo = {}
        hl = {parse(a[0])["midi"]: dict(c=SIG, label=nname(a[0], False), strong=True), parse(a[1])["midi"]: dict(c=SIG, label=nname(a[1], False), strong=True),
              parse(b[0])["midi"]: dict(c=BLU, label=nname(b[0], False)), parse(b[1])["midi"]: dict(c=BLU, label=nname(b[1], False))}
        kw = kb_width(klo, khi, 26)
        kx = px + 166 - kw / 2
        o.append(KEYBOARD(kx, 174, klo, khi, ww=26, wh=86, hl=hl, names=None, info=kinfo))
        for m1, m2 in zip(_f10_mids(a), _f10_mids(b)):
            x1, x2 = kinfo[m1][0], kinfo[m2][0]
            o.append(ARR(x1, 272, x2 + (4 if x2 < x1 else -4), 272, SIG, 1.6, 6))
            o.append(T((x1 + x2) / 2, 290, _f10_dl(m1, m2), "middle", 11, SIG, True))
        o.append(T(px + 166, 316, form, "middle", 11.5, INK, True))
    return SVG(712, 336, o, "V7 の三全音 B・F が、それぞれ半音ずつ動いて I の C・E になるとき。B が下なら減 5 度が長 3 度に縮み、"
               "F が下なら増 4 度が短 6 度に広がる。どちらも、不協和の三全音が不完全協和の音程に変わる。")
F["e10_tritone"] = _f10_tritone()


# 3 節. 三全音と、解決したあとの音程のスペクトル
def _f10_spec():
    o = []
    rows = [(("B3", "F4"), ("C4", "E4"), "減 5 度", "長 3 度"), (("F4", "B4"), ("E4", "C5"), "増 4 度", "短 6 度")]
    y = 46
    Wp = 320
    for a, b, na, nb in rows:
        for k, (pair, nm) in enumerate([(a, na), (b, nb)]):
            x = 12 + k * 372
            o.append(T(x, y - 28, "%s・%s（%s）%s" % (nname(pair[0]), nname(pair[1]), nm, "— 解決の前" if k == 0 else "— 解決のあと"),
                       "start", 11.5, INK, True))
            svg, st = SPECTRUM(x, y, Wp, [dict(f=freq(parse(pair[0])["midi"]), label=nname(pair[0]), c=SIG),
                                         dict(f=freq(parse(pair[1])["midi"]), label=nname(pair[1]), c=BLU)],
                               H=8, lane_h=32, fmin=230, fmax=4400, label_w=40)
            o.append(svg)
        o.append(ARR(12 + Wp + 10, y + 32, 12 + 372 - 10, y + 32, MUT, 1.8, 7))
        y += 2 * 32 + 70
    return SVG(712, y - 40, o, "三全音（左）と、半音ずつ動いて解決したあと（右）の、2 つの音の第 1〜第 8 倍音。緑の線は一致する倍音、赤い波線はぶつかる倍音。"
               "どちらの上下でも、一致は 0 組から 1 組になり、ぶつかりは減る。粗さの合計は、上の段では少し増え、下の段では少し減る。")
F["e10_spec"] = _f10_spec()


# 3 節. G7 → C の 4 つの声部の動き
def _f10_resolve():
    o = []
    s = 12
    info = {}
    up1, up2 = ["D4", "F4", "B4"], ["C4", "E4", "C5"]
    chords = [dict(x=92, up=up1, bass=["G2"], k="a", fill=INK, fills={"F4": SIG, "B4": SIG}, sym="G7（V7）"),
              dict(x=242, up=up2, bass=["C3"], k="b", fill=BLU, sym="C（I）", symcol=BLU)]
    o.append(_f10_gs(16, 52, 310, s, chords, info=info))
    o.append(_f10_arrows(info["au"], info["bu"], [MUT, SIG, SIG], _f10_mids(up1), _f10_mids(up2)))
    o.append(_f10_arrows(info["ab"], info["bb"], [MUT], [43], [48]))
    rows = [("B → C", "+1", "導音 → 主音（半音上）", SIG), ("F → E", "−1", "7 度の音 → 音階の第 3 音（半音下）", SIG),
            ("D → C", "−2", "5 度の音 → 主音（全音下）", INK), ("G → C", "+5", "ベース: 根音 → 根音", INK)]
    for i, (mv, d, txt, c) in enumerate(rows):
        y = 78 + i * 36
        o.append(T(384, y, mv, "start", 12.5, c, True))
        o.append(T(446, y, d, "start", 12.5, c, True))
        o.append(T(480, y, txt, "start", 11, c if c == SIG else MUT, c == SIG))
    return SVG(712, 226, o, "G7 → C で、4 つの音がそれぞれどこへ動くか（数は半音の数の変化）。三全音の 2 つの音（赤）は、"
               "どちらも半音 1 つだけ動いて I の音になる。この形では I の 5 度の音 G は鳴らないが、C と E で C の和音として聞こえる。")
F["e10_resolve"] = _f10_resolve()


# 3 節. 短調のドミナント: 自然短音階の Vm と、和声的短音階の V7
def _f10_minor():
    o = []
    s = 12
    panels = [("自然短音階の V: Em → Am（Vm → Im）", ["E4", "G4", "B4"], ["E4", "A4", "C5"], [MUT, ALI, MUT], {"G4": ALI}, "Em",
               "G は主音 A の全音下（導音ではない）。三全音も無い", ALI),
              ("和声的短音階の V7: E7 → Am（V7 → Im）", ["D4", "G#4", "B4"], ["C4", "A4", "C5"], [SIG, SIG, MUT], {"D4": SIG, "G♯4": SIG}, "E7",
               "G♯ は主音 A の半音下の導音。D–G♯ は三全音", SIG)]
    for k, (title, up1, up2, cols, fills, sym, note, nc) in enumerate(panels):
        px = 12 + k * 352
        o.append(RECT(px, 8, 336, 286, 10, "none", LIN, 1.2))
        o.append(T(px + 168, 30, title, "middle", 12, INK, True))
        info = {}
        chords = [dict(x=88, up=up1, bass=["E2"], k="a", fill=INK, fills=fills, sym=sym),
                  dict(x=220, up=up2, bass=["A2"], k="b", fill=BLU, sym="Am", symcol=BLU)]
        o.append(_f10_gs(px + 12, 70, 290, s, chords, info=info))
        o.append(_f10_arrows(info["au"], info["bu"], cols, _f10_mids(up1), _f10_mids(up2)))
        o.append(_f10_arrows(info["ab"], info["bb"], [MUT], [40], [45]))
        o.append(T(px + 168, 280, note, "middle", 11, nc, True))
    return SVG(712, 302, o, "イ短調で、V の和音から Im（Am）へ進むとき（数は半音の数の変化）。自然短音階の Em では第 7 音 G が主音 A の全音下にあり、"
               "半音 1 つで主音へ進む音が無い。和声的短音階の第 7 音 G♯ を使った E7 では、導音 G♯ が半音上の A へ、7 度の音 D が全音下の C へ進み、"
               "三全音 D–G♯（増 4 度）が長 6 度 C–A になる。")
F["e10_minor"] = _f10_minor()


# 4 節. 4 つの終止
def _f10_cadences():
    o = []
    s = 8
    P = [("全終止", "V7 → I", ("D", "T"), ("G7", ["G2"], ["B3", "D4", "F4", "G4"]), ("C", ["C3"], ["C4", "E4", "G4"])),
         ("偽終止", "V7 → VIm", ("D", "T"), ("G7", ["G2"], ["B3", "D4", "F4", "G4"]), ("Am", ["A2"], ["C4", "E4", "A4"])),
         ("変終止", "IV → I", ("SD", "T"), ("F", ["F2"], ["C4", "F4", "A4"]), ("C", ["C3"], ["C4", "E4", "G4"])),
         ("半終止", "IV → V（… → V）", ("SD", "D"), ("F", ["F2"], ["C4", "F4", "A4"]), ("G", ["G2"], ["B3", "D4", "G4"]))]
    for k, (name, deg, fns, c1, c2) in enumerate(P):
        px = 12 + (k % 2) * 352
        py = 8 + (k // 2) * 236
        o.append(RECT(px, py, 336, 224, 10, "none", LIN, 1.2))
        o.append(T(px + 16, py + 26, name, "start", 14, INK, True))
        o.append(T(px + 84, py + 26, deg, "start", 12, MUT, True))
        for j, fn in enumerate(fns):
            cx = px + 236 + j * 50
            o.append(RECT(cx, py + 11, 34, 22, 6, _f10_FS[fn], _f10_FC[fn], 1.4))
            o.append(T(cx + 17, py + 27, fn, "middle", 11.5, _f10_FC[fn], True))
            if j == 0:
                o.append(ARR(cx + 36, py + 22, cx + 48, py + 22, MUT, 1.3, 5))
        chords = []
        for j, (sym, bass, up) in enumerate((c1, c2)):
            fn = fns[j]
            chords.append(dict(x=110 + j * 100, up=up, bass=bass, fill=_f10_FC[fn], sym=sym, symcol=_f10_FC[fn]))
        o.append(_f10_gs(px + 30, py + 62, 260, s, chords))
    return SVG(712, 8 + 2 * 236, o, "4 つの終止の、最後の 2 つの和音（再生カードと同じ配置）。上の 2 つは V7 からの終止で、"
               "最後が I なら全終止、VIm なら偽終止。下の 2 つは IV からの終止で、最後が I なら変終止、V なら半終止。")
F["e10_cadences"] = _f10_cadences()


# 4 節. 偽終止: 上の 3 つの声部は全終止と同じで、ベースだけが違う
def _f10_deceptive():
    o = []
    s = 12
    panels = [("全終止 G7 → C（V7 → I）", "C", "C3", "C・E（I）"),
              ("偽終止 G7 → Am（V7 → VIm）", "Am", "A2", "A・C・E（VIm）")]
    up1, up2 = ["D4", "F4", "B4"], ["C4", "E4", "C5"]
    for k, (title, sym, bass2, res) in enumerate(panels):
        px = 12 + k * 352
        o.append(RECT(px, 8, 336, 276, 10, "none", LIN, 1.2))
        o.append(T(px + 168, 30, title, "middle", 12.5, INK, True))
        info = {}
        chords = [dict(x=92, up=up1, bass=["G2"], k="a", fill=INK, fills={"F4": SIG, "B4": SIG}, sym="G7"),
                  dict(x=226, up=up2, bass=[bass2], k="b", fill=BLU, bfill=ALI, sym=sym, symcol=BLU)]
        o.append(_f10_gs(px + 12, 70, 290, s, chords, info=info))
        o.append(_f10_arrows(info["au"], info["bu"], [MUT, SIG, SIG], _f10_mids(up1), _f10_mids(up2)))
        o.append(_f10_arrows(info["ab"], info["bb"], [ALI], [43], [parse(bass2)["midi"]]))
        o.append(T(px + 168, 268, "ベース G → %s、和音の音は %s" % (nname(bass2, False), res), "middle", 11.5, ALI, True))
    return SVG(712, 292, o, "全終止と偽終止で、G7 から先の動きを比べる（数は半音の数の変化）。上の 3 つの声部の動き（B → C、F → E、D → C）はまったく同じで、"
               "違うのはベースが C へ進むか A へ進むかだけである。VIm（A・C・E）は、三全音の解決先の C と E を両方含んでいる。")
F["e10_deceptive"] = _f10_deceptive()


# 4 節. 2 つのフレーズ: 半終止で区切り、全終止で終わる
def _f10_phrase():
    o = []
    seq = [("C", "I", "T"), ("Am", "VIm", "T"), ("Dm", "IIm", "SD"), ("G", "V", "D"),
           ("C", "I", "T"), ("F", "IV", "SD"), ("G7", "V7", "D"), ("C", "I", "T")]
    x0, w, g = 24, 70, 12
    y = 62
    for i, (c, r, fn) in enumerate(seq):
        x = x0 + i * (w + g) + (14 if i >= 4 else 0)
        o.append(_f10_chip(x, y, w, 46, c, r, fn=fn))
    for k, (a, b, title, mark, col) in enumerate([(0, 3, "フレーズ 1 — 半終止（V で止まる）", "、", SIG), (4, 7, "フレーズ 2 — 全終止（V7 → I で終わる）", "。", BLU)]):
        xa = x0 + a * (w + g) + (14 if a >= 4 else 0)
        xb = x0 + b * (w + g) + (14 if b >= 4 else 0) + w
        o.append(W(xa, 46, xa, 40, xb, 40, xb, 46, c=col, lw=1.6))
        o.append(T((xa + xb) / 2, 32, title, "middle", 11.5, col, True))
        o.append(T((xa + xb) / 2, y + 70, "区切り（文章の「%s」のよう）" % mark if k == 0 else "終わり（文章の「%s」のよう）" % mark, "middle", 11, col, True))
    return SVG(712, y + 86, o, "2 つのフレーズを続けた進行。1 つ目は V で止まる半終止で区切られ、続きを求める（文章の「、」のような区切り）。"
               "2 つ目は全終止で、はっきり終わる（「。」）。")
F["e10_phrase"] = _f10_phrase()


# 5 節. 機能の流れ
def _f10_flow():
    o = []
    pos = {"T": (100, 130), "SD": (356, 130), "D": (612, 130)}
    r = 52
    def node(fn, sub):
        x, y = pos[fn]
        o.append(CIRC(x, y, r, _f10_FC[fn], 2.2, _f10_FS[fn]))
        o.append(T(x, y + 1, fn, "middle", 18, _f10_FC[fn], True))
        o.append(T(x, y + 20, sub, "middle", 9.5, INK))
    # T → SD、SD → D（上の線）
    o.append(ARR(pos["T"][0] + r, 118, pos["SD"][0] - r - 2, 118, INK, 2.4, 9))
    o.append(ARR(pos["SD"][0] + r, 118, pos["D"][0] - r - 2, 118, INK, 2.4, 9))
    o.append(T(228, 108, "T → SD", "middle", 11.5, INK, True))
    o.append(T(484, 108, "SD → D", "middle", 11.5, INK, True))
    # SD → T（変終止）、D → SD（下の線）
    o.append(ARR(pos["SD"][0] - r, 142, pos["T"][0] + r + 2, 142, GRN2, 1.6, 7))
    o.append(T(228, 160, "SD → T（変終止）", "middle", 10.5, GRN2, True))
    o.append(W(pos["D"][0] - r, 142, pos["SD"][0] + r + 8, 142, c=ALI, lw=1.5, dash="5,4"))
    o.append(ARR(pos["SD"][0] + r + 10, 142, pos["SD"][0] + r + 2, 142, ALI, 1.5, 7))
    o.append(T(484, 160, "D → SD", "middle", 10.5, ALI, True))
    o.append(T(484, 174, "（クラシックでは避ける）", "middle", 10, ALI))
    # D → T（解決）: 下の大きな弧
    pts = []
    for i in range(41):
        t = i / 40.0
        x = pos["D"][0] - 14 + (pos["T"][0] + 14 - (pos["D"][0] - 14)) * t
        y = 172 + 72 * math.sin(math.pi * t)
        pts.append((x, y))
    o.append(PL(pts[:-2], SIG, 2.4))
    o.append(ARR(pts[-3][0], pts[-3][1], pts[-1][0], pts[-1][1] - 2, SIG, 2.4, 9))
    o.append(T(356, 262, "D → T（解決。全終止・偽終止）", "middle", 11.5, SIG, True))
    # T → D: 上の大きな弧
    pts = []
    for i in range(41):
        t = i / 40.0
        x = pos["T"][0] + 14 + (pos["D"][0] - 14 - (pos["T"][0] + 14)) * t
        y = 86 - 58 * math.sin(math.pi * t)
        pts.append((x, y))
    o.append(PL(pts[:-2], BLU, 1.6))
    o.append(ARR(pts[-3][0], pts[-3][1], pts[-1][0], pts[-1][1] + 2, BLU, 1.6, 8))
    o.append(T(356, 20, "T → D（SD を通らずに）", "middle", 10.5, BLU, True))
    node("T", "I・VIm・IIIm")
    node("SD", "IV・IIm")
    node("D", "V・V7・VIIdim")
    return SVG(712, 276, o, "機能の進み方。太い矢印の T → SD → D → T が基本の流れで、T からはどの機能へも進め、SD からは D か T へ、D からは T へ進む。"
               "D → SD（破線）は、クラシックの和声では避けるのが基本とされるが、ポピュラー音楽ではよく使われる。同じ機能どうし（T → T など）の進行もある。")
F["e10_flow"] = _f10_flow()


# 5 節. 代理: 同じ機能の和音に置き換える
def _f10_subst():
    o = []
    rows = [("もとの進行", ["I", "IV", "V7", "I"], None),
            ("SD を代理", ["I", "IIm", "V7", "I"], 1),
            ("最初の T を代理", ["VIm", "IIm", "V7", "I"], 0),
            ("D を代理", ["I", "IV", "VIIdim", "I"], 2),
            ("最後の T を代理", ["I", "IV", "V7", "VIm"], 3)]
    x0, w, g = 190, 82, 22
    o.append(T(x0 - 16, 30, "機能の並び →", "end", 10.5, MUT))
    for i, fn in enumerate(["T", "SD", "D", "T"]):
        x = x0 + i * (w + g)
        o.append(T(x + w / 2, 30, fn, "middle", 13, _f10_FC[fn], True))
    y = 44
    for lab, degs, hi in rows:
        o.append(T(x0 - 16, y + 27, lab, "end", 11.5, INK, True))
        for i, d in enumerate(degs):
            x = x0 + i * (w + g)
            cn, fn = _f10_C[d]
            o.append(_f10_chip(x, y, w, 42, cn, d, fn=fn, hl=(i == hi), sz=13.5))
            if i < 3:
                o.append(ARR(x + w + 3, y + 21, x + w + g - 3, y + 21, MUT, 1.3, 5))
        if hi == 3:
            o.append(T(x0 + 4 * (w + g) - 8, y + 26, "→ 偽終止", "start", 11, SIG, True))
        y += 56
    return SVG(712, y + 4, o, "もとの進行 I → IV → V7 → I の和音を、1 つずつ同じ機能の和音に置き換えた（赤い枠が置き換えた和音）。"
               "機能の並び T → SD → D → T は変わらない。最後の I を VIm に置き換えると、4 節の偽終止になる。")
F["e10_subst"] = _f10_subst()


# 5 節. 進行を機能で読む
def _f10_read():
    o = []
    rows = [("例 1", ["I", "VIm", "IIm", "V7", "I"], "T → T → SD → D → T"),
            ("例 2", ["I", "IIIm", "IV", "V", "I"], "T → T → SD → D → T"),
            ("例 3", ["I", "V", "VIm", "IV", "I"], "T → D → T → SD → T"),
            ("例 4", ["I", "V", "IV", "I"], "T → D → SD → T（D → SD を含む）")]
    x0, w, g = 70, 72, 16
    y = 14
    for lab, degs, fl in rows:
        o.append(T(20, y + 26, lab, "start", 12, INK, True))
        for i, d in enumerate(degs):
            x = x0 + i * (w + g)
            cn, fn = _f10_C[d]
            o.append(_f10_chip(x, y, w, 42, cn, d + "　" + fn, fn=fn, sz=13.5, bsz=10))
            if i < len(degs) - 1:
                bad = _f10_C[degs[i]][1] == "D" and _f10_C[degs[i + 1]][1] == "SD"
                o.append(ARR(x + w + 2, y + 21, x + w + g - 2, y + 21, ALI if bad else MUT, 1.8 if bad else 1.3, 5))
        o.append(T(x0 + 5 * (w + g) + 4, y + 26, fl, "start", 11, ALI if "D → SD" in fl else INK, True))
        y += 58
    return SVG(712, y, o, "いくつかの進行を、和音ごとの機能（色）で読む。例 1・2 は基本の流れ T → SD → D → T の途中に T をもう 1 つ入れたもの。"
               "例 3 は D → T の T に VIm を置いたもの。例 4 は D → SD（赤い矢印）を含む。")
F["e10_read"] = _f10_read()
