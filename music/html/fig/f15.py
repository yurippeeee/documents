# 15 章 モード の図（figures.py の関数・定数をそのまま使う）
# 色: 主音・注目する 1 音 = signal、半音の間隔 = gold、主和音の種類 = 長三和音 blue / 短三和音 purple / 減三和音 gold

_f15_MAJ = [2, 2, 1, 2, 2, 2, 1]
_f15_NM = ["イオニアン", "ドリアン", "フリジアン", "リディアン", "ミクソリディアン", "エオリアン", "ロクリアン"]
_f15_ORD = [3, 0, 4, 1, 5, 2, 6]      # 明るさの順（リディアン → ロクリアン）。数は白鍵の C から数えた番号
_f15_DEG = ["1", "♭2", "2", "♭3", "3", "4", "♯4/♭5", "5", "♭6", "6", "♭7", "7"]
_f15_REF = [0, 2, 4, 5, 7, 9, 11]      # 長音階（主音からの半音の数）


def _f15_rot(r):
    return _f15_MAJ[r:] + _f15_MAJ[:r]


def _f15_cum(r):
    c = [0]
    for s_ in _f15_rot(r)[:-1]:
        c.append(c[-1] + s_)
    return c


def _f15_col(r):
    """主和音の種類の色（長三和音 = 青、短三和音 = 紫、減三和音 = 金）"""
    c = _f15_cum(r)
    return BLU if c[2] == 4 else (GLD if c[4] == 6 else PUR)


def _f15_soft(col):
    return {BLU: BSOFT, PUR: PSOFT, GLD: GOSOFT, SIG: SSOFT, GRN2: GSOFT, ALI: ASOFT}.get(col, PAN)


def _f15_names(tonic, r, n=8):
    return [nname(x, False) for x in spell_scale(tonic, _f15_rot(r), n)]


def _f15_alts(r):
    """C 長音階と比べて違う音（♭3 など）の文字列"""
    out = []
    for i, c in enumerate(_f15_cum(r)):
        d = c - _f15_REF[i]
        if d:
            out.append(("♯" if d > 0 else "♭") + str(i + 1))
    return " ".join(out)


def _f15_arcs(o, info, ms, steps, y, lab_dy=26):
    """となりどうしの鍵の間に弧を描き、全・半を書く"""
    for i in range(len(ms) - 1):
        xa, xb = info[ms[i]][0], info[ms[i + 1]][0]
        half = steps[i] == 1
        col = GLD if half else MUT
        o.append(PL([(xa + 2, y), ((xa + xb) / 2, y + 11), (xb - 2, y)], col, 2.2 if half else 1.4))
        o.append(T((xa + xb) / 2, y + lab_dy, "半" if half else "全", "middle", 12, col, half))


def _f15_boxes(o, x, y, steps, bw=34, bh=26, nums=True):
    """全・半の並びを箱で描く（半は金色）"""
    for j, s_ in enumerate(steps):
        half = s_ == 1
        o.append(RECT(x + j * bw + 2, y, bw - 4, bh, 5, GOSOFT if half else PAN, GLD if half else LIN, 1.5 if half else 1.1))
        o.append(T(x + j * bw + bw / 2, y + bh / 2 + 4.5, "半" if half else "全", "middle", 12, GLD if half else INK, half))
        if nums:
            o.append(T(x + j * bw + bw / 2, y - 6, str(j + 1), "middle", 10, MUT))


# 1. 同じ白鍵を C から並べた場合と D から並べた場合
def _f15_shift():
    o = []
    ww, wh = 36, 84
    lo, hi = 60, 74            # C4..D5
    X0 = 16
    tops = [42, 222]
    xef, xbc = X0 + 3 * ww, X0 + 7 * ww      # E と F の境目、B と C の境目
    for xx, lab in ((xef, "半音（E–F）"), (xbc, "半音（B–C）")):
        o.append(W(xx, 30, xx, tops[1] + wh + 4, c=GLD, lw=1.2, dash="4,4"))
        o.append(T(xx, 22, lab, "middle", 10.5, GLD, True))
    for (L, t0, r), yt in zip((("C", 60, 0), ("D", 62, 1)), tops):
        notes = spell_scale(L + "4", _f15_rot(r), 8)
        ms = [parse(n)["midi"] for n in notes]
        hl = {m: dict(c=BLU, label=nname(n, False)) for m, n in zip(ms, notes)}
        hl[ms[0]] = dict(c=SIG, label=L, strong=True)
        hl[ms[-1]] = dict(c=SIG, label=L, strong=True)
        info = {}
        o.append(KEYBOARD(X0, yt, lo, hi, ww=ww, wh=wh, hl=hl, names=None, info=info))
        _f15_arcs(o, info, ms, _f15_rot(r), yt + wh + 7)
        px = 380
        o.append(T(px, yt + 6, "%s から %s まで（主音 %s）" % (L, L, L), "start", 12.5, INK, True))
        o.append(T(px, yt + 28, "主音から数えた間隔", "start", 10.5, MUT))
        _f15_boxes(o, px, yt + 50, _f15_rot(r), bw=40)
        hs = [str(j + 1) for j, s_ in enumerate(_f15_rot(r)) if s_ == 1]
        o.append(T(px, yt + 104, "半音は %s 番目と %s 番目の間隔" % tuple(hs), "start", 11.5, GLD, True))
    return SVG(680, tops[1] + wh + 46, o,
               "同じ 7 つの白鍵を、C から C まで並べた場合（上）と、D から D まで並べた場合（下）。半音の間隔（金色）は、どちらも E–F と B–C の 2 か所で、"
               "鍵盤の上の位置は同じである。数え始める音（主音）が 1 つずれるので、主音から数えて何番目の間隔が半音かが変わる。")
F["e15_shift"] = _f15_shift()


# 2. ドローン: 旋律の下で主音を鳴らし続ける（横軸が時間、縦軸が高さ）
def _f15_drone():
    o = []
    x0, bw = 92, 34
    mel = [("D4", 1), ("E4", 1), ("F4", 1), ("G4", 1), ("A4", 1), ("B4", 1), ("C5", 1), ("D5", 1),
           ("C5", 1), ("B4", 1), ("A4", 1), ("G4", 1), ("F4", 1), ("E4", 1), ("D4", 2)]
    Y = lambda m: 202 - (m - 50) * 5.4
    for nm, m in (("D3", 50), ("D4", 62), ("D5", 74)):
        o.append(W(x0 - 4, Y(m), x0 + 16 * bw, Y(m), c=LIN, lw=1, dash="3,4"))
        o.append(T(x0 - 10, Y(m) + 4, nm, "end", 11, MUT, True))
    o.append(RECT(x0, Y(50) - 6, 16 * bw, 12, 4, SIG, SIG, 1))
    o.append(T(x0 + 16 * bw, Y(50) + 22, "ドローン: D3 を同じ高さのまま鳴らし続ける", "end", 11.5, SIG, True))
    b = 0
    for nm, d in mel:
        m = parse(nm)["midi"]
        isd = nm[0] == "D"
        col = SIG if isd else BLU
        o.append(RECT(x0 + b * bw + 2, Y(m) - 4, d * bw - 4, 8, 2.5, col, col, 1))
        o.append(T(x0 + b * bw + 2 + (d * bw - 4) / 2, Y(m) - 9, nname(nm, False), "middle", 10, col, isd))
        if isd:
            xm = x0 + b * bw + d * bw / 2
            o.append(W(xm, Y(m) + 5, xm, Y(50) - 7, c=SIG, lw=1.1, dash="2,3"))
        b += d
    o.append(T(x0 + 8 * bw, 24, "旋律: 白鍵を D から D まで上がって下がる", "middle", 11.5, BLU, True))
    o.append(ARR(x0, 238, x0 + 16 * bw, 238, MUT, 1.3))
    o.append(T(x0 + 16 * bw, 254, "時間", "end", 10.5, MUT))
    o.append(T(x0 - 10, 30, "高さ ↑", "end", 10.5, MUT))
    return SVG(680, 262, o,
               "ドローンの上で旋律を鳴らすようす（横が時間、縦が高さ）。D3 のドローンが鳴り続ける間、旋律のどの音も D からの音程として聞こえる。"
               "旋律の D4・D5（赤）はドローンと 1 オクターブ・2 オクターブの関係で重なる（点線）。")
F["e15_drone"] = _f15_drone()


# 3. 白鍵の 7 つの開始位置と、全・半の並び
def _f15_seven():
    o = []
    y0, rh = 62, 34
    bx, bw = 184, 38
    o.append(T(36, y0 - 26, "主音", "middle", 10.5, MUT, True))
    o.append(T(62, y0 - 26, "モードの名前", "start", 10.5, MUT, True))
    o.append(T(bx + 3.5 * bw, y0 - 30, "主音から数えた間隔", "middle", 10.5, MUT, True))
    o.append(T(462, y0 - 26, "主音から並べた 8 つの音", "start", 10.5, MUT, True))
    for r in range(7):
        y = y0 + r * rh
        L = "CDEFGAB"[r]
        o.append(CIRC(36, y + 13, 12, SIG, 1.4, SSOFT))
        o.append(T(36, y + 17.5, L, "middle", 12, INK, True))
        o.append(T(62, y + 18, _f15_NM[r], "start", 12, INK, True))
        _f15_boxes(o, bx, y, _f15_rot(r), bw=bw, bh=26, nums=(r == 0))
        o.append(T(462, y + 18, " ".join(_f15_names(L + "4", r)), "start", 12, INK, False, True))
        tag = {0: "= 長音階", 5: "= 自然短音階"}.get(r)
        if tag:
            o.append(T(700, y + 18, tag, "end", 11.5, GRN2, True))
    return SVG(712, y0 + 7 * rh + 6, o,
               "白鍵の 7 つの音を、それぞれ主音にして並べた 7 つのモード。どれも同じ「全・全・半・全・全・全・半」の輪を、違う位置から読んだものなので、"
               "1 段下がるごとに並びの先頭の 1 つが最後へ回り、「半」（金色）は斜めに並ぶ。イオニアンは長音階、エオリアンは自然短音階と同じ並びである。")
F["e15_seven"] = _f15_seven()


# 4. D ドリアン（白鍵）と E ドリアン（F♯・C♯ が必要）
def _f15_edorian():
    o = []
    ww, wh = 32, 80
    lo, hi = 62, 77            # D4..F5
    X0 = 16
    tops = [34, 200]
    for (L, sub), yt in zip((("D", "白鍵だけ"), ("E", "F♯ と C♯ を使う")), tops):
        notes = spell_scale(L + "4", _f15_rot(1), 8)
        ms = [parse(n)["midi"] for n in notes]
        hl = {}
        for m, n in zip(ms, notes):
            if parse(n)["acc"]:
                hl[m] = dict(c=GRN2, label=nname(n, False), strong=True)
            else:
                hl[m] = dict(c=BLU, label=nname(n, False))
        hl[ms[0]] = dict(c=SIG, label=L, strong=True)
        hl[ms[-1]] = dict(c=SIG, label=L, strong=True)
        info = {}
        o.append(KEYBOARD(X0, yt, lo, hi, ww=ww, wh=wh, hl=hl, names=None, info=info))
        _f15_arcs(o, info, ms, _f15_rot(1), yt + wh + 7)
        px = 388
        o.append(T(px, yt + 6, "%s ドリアン（%s）" % (L, sub), "start", 12.5, INK, True))
        _f15_boxes(o, px, yt + 34, _f15_rot(1), bw=40)
        x = px
        for n in notes:
            nm = nname(n, False)
            acc = parse(n)["acc"] != 0
            col = SIG if nm[0] == L else (GRN2 if acc else INK)
            o.append(T(x + 14, yt + 98, nm, "middle", 12.5, col, True))
            x += 38
    return SVG(712, tops[1] + wh + 46, o,
               "ドリアンの並び（全・半・全・全・全・半・全）を、D から作ると白鍵だけになり（上）、E から作ると F♯ と C♯（緑）が必要になる（下）。"
               "並びが同じなので、どちらも同じドリアンである。綴りは 7 つの文字を 1 回ずつ使う。")
F["e15_edorian"] = _f15_edorian()


# 5. C の上に作った 7 つのモード（白鍵の順。C 長音階と違う音を赤で示す）
def _f15_onc():
    o = []
    s = 7
    st0 = staff_start(s)
    dx = 30
    sw = st0 + 7 * dx + 16
    ref = spell_scale("C4", _f15_MAJ, 8)
    for r in range(7):
        col_i, row_i = (0, r) if r < 4 else (1, r - 4)
        px = 14 + col_i * 352
        py = 20 + row_i * 76
        notes = spell_scale("C4", _f15_rot(r), 8)
        items = [dict(x=st0 + j * dx, notes=[n], fill=(SIG if n != ref[j] else INK)) for j, n in enumerate(notes)]
        o.append(T(px, py + 6, "C " + _f15_NM[r], "start", 12, INK, True))
        al = _f15_alts(r)
        o.append(T(px + 330, py + 6, al if al else "C 長音階そのもの", "end", 11.5, SIG if al else MUT, True))
        o.append(STAFF(px, py + 20, sw, s=s, clef="treble", items=items))
    return SVG(712, 20 + 4 * 76 - 8, o,
               "7 つのモードを、すべて C を主音にして作ったもの（2 節の白鍵の順。左の列が C・D・E・F から作った並び、右の列が G・A・B から作った並び）。"
               "C 長音階と違う音を赤で示し、右上にその音を ♭3 のような書き方で並べた。")
F["e15_onc"] = _f15_onc()


# 6. 明るさの順のはしご（主音 C。1 段下がるごとに 1 音が半音下がる）
def _f15_ladder():
    o = []
    x0, cw = 150, 36
    y0, rh = 96, 34
    rr = 12
    o.append(T(x0 - 12, 46, "C からの半音の数", "end", 10, MUT))
    o.append(T(x0 - 12, 66, "長音階を基準にした書き方", "end", 10, MUT))
    for k in range(12):
        cx = x0 + k * cw + cw / 2
        o.append(T(cx, 46, str(k), "middle", 10, MUT))
        o.append(T(cx, 66, _f15_DEG[k], "middle", 10 if k == 6 else 11, INK, True))
        o.append(W(cx, 74, cx, y0 + 6 * rh + 14, c=LIN, lw=0.8, dash="2,4"))
    o.append(T(x0 + 12 * cw + 12, 66, "長音階と違う音", "start", 10.5, MUT, True))
    prev = None
    for i, r in enumerate(_f15_ORD):
        y = y0 + i * rh
        col = _f15_col(r)
        cum = _f15_cum(r)
        names = _f15_names("C4", r, 7)
        o.append(T(x0 - 12, y + 4.5, _f15_NM[r], "end", 12, col, True))
        moved = None
        if prev is not None:
            moved = [c for c in cum if c not in prev][0]
            ghost = [c for c in prev if c not in cum][0]
            gx = x0 + ghost * cw + cw / 2
            o.append(CIRC(gx, y, rr, MUT, 1.1, "none", dash="3,3"))
            o.append(ARR(gx - rr - 1, y, x0 + moved * cw + cw / 2 + rr + 2, y, SIG, 1.4, 5))
        for c, nm in zip(cum, names):
            cx = x0 + c * cw + cw / 2
            mv = c == moved
            o.append(CIRC(cx, y, rr, SIG if mv else col, 2.0 if mv else 1.3, SSOFT if mv else _f15_soft(col)))
            o.append(T(cx, y + 4, nm, "middle", 10.5, SIG if mv else INK, True))
        al = _f15_alts(r)
        o.append(T(x0 + 12 * cw + 12, y + 4.5, al if al else "なし", "start", 11, SIG if al else MUT, True))
        prev = cum
    ys = y0 + 2.5 * rh
    o.append(W(x0 - 130, ys, x0 + 12 * cw, ys, c=MUT, lw=1, dash="6,4"))
    ly = y0 + 6 * rh + 40
    leg = [(BLU, "主和音が長三和音（主音の上が長 3 度）"), (PUR, "主和音が短三和音"), (GLD, "主和音が減三和音"),
           (SIG, "1 つ上の段から半音下がった音")]
    x = 20
    for c, t in leg:
        o.append(CIRC(x + 6, ly - 4, 6, c, 1.3, _f15_soft(c)))
        o.append(T(x + 16, ly, t, "start", 10.5, c, True))
        x += 16 + len(t) * 10.5 + 18
    return SVG(712, ly + 12, o,
               "主音 C の 7 つのモードを、C 長音階と違う音の数の順（♯ 1 つ → なし → ♭ 1〜5 つ）に並べた。点は音の位置（C から半音いくつ上か）。"
               "1 段下がるごとに、ちょうど 1 つの音（赤）だけが半音下がり、ほかの 6 つは動かない。破線より上の 3 つは主音の上の 3 度が長 3 度、下の 4 つは短 3 度である。")
F["e15_ladder"] = _f15_ladder()


# 7. 5 度の列の上の 7 つのモード（主音 C を固定）
def _f15_chain():
    o = []
    chain = ["G♭", "D♭", "A♭", "E♭", "B♭", "F", "C", "G", "D", "A", "E", "B", "F♯"]
    x0, dx = 176, 38
    xc = x0 + 6 * dx
    o.append(T(x0 - 26, 28, "C から完全 5 度で何回上か", "end", 10, MUT))
    o.append(T(x0 - 26, 52, "5 度の列", "end", 11.5, INK, True))
    for i, nm in enumerate(chain):
        x = x0 + i * dx
        o.append(T(x, 28, ("+%d" % (i - 6)) if i > 6 else ("%d" % (i - 6)).replace("-", "−"), "middle", 10, MUT))
        o.append(T(x, 52, nm, "middle", 12.5, SIG if nm == "C" else INK, True))
    o.append(T(x0 - 14, 68, "← 完全 5 度下", "start", 10, MUT))
    o.append(T(x0 + 12 * dx + 14, 68, "完全 5 度上 →", "end", 10, MUT))
    yr0, rh = 96, 32
    o.append(W(xc, 74, xc, yr0 + 6 * rh + 14, c=SIG, lw=1.1, dash="3,3"))
    for k, r in enumerate(_f15_ORD):
        y = yr0 + k * rh
        a, b = 6 - k, 12 - k
        col = _f15_col(r)
        o.append(T(14, y + 4.5, _f15_NM[r], "start", 12, col, True))
        o.append(RECT(x0 + a * dx - 17, y - 12, (b - a) * dx + 34, 24, 12, _f15_soft(col), col, 1.3))
        for j in range(a, b + 1):
            new = (j == a and k > 0)
            o.append(T(x0 + j * dx, y + 4.5, chain[j], "middle", 12, SIG if (new or chain[j] == "C") else INK, True))
        if k > 0:
            gx = x0 + (b + 1) * dx
            o.append(T(gx, y + 4.5, chain[b + 1], "middle", 12, MUT))
            o.append(W(gx - 9, y, gx + 9, y, c=MUT, lw=1.2))
            o.append(T(706, y + 4.5, "%s → %s" % (chain[b + 1], chain[a]), "end", 12, SIG, True))
    return SVG(712, yr0 + 6 * rh + 24, o,
               "完全 5 度ずつ並べた音の列（5 度の列）の上に、主音 C の 7 つのモードの音を置いた。どのモードも、となり合う 7 つの音を使う。"
               "C（赤の破線）は、リディアンでは左から 1 番目、イオニアンでは 2 番目、…、ロクリアンでは 7 番目にある。1 段下がるごとに、使う 7 つが 1 つ左へずれ、"
               "右端の音が抜けて（灰色の線で消した音）、左端に 7 つ離れた同じ文字の音（赤）が入る。右の列は、前の段から入れ替わった音（抜けた音 → 入った音）。")
F["e15_chain"] = _f15_chain()


# 8. 特性音: 主音の上の 3 度が同じ長音階・自然短音階と比べる
def _f15_char():
    o = []
    x0, cw = 170, 36
    rr = 12
    rows = [(0, None), (3, 0), (4, 0), ("sep", None), (5, None), (1, 5), (2, 5), (6, 5)]
    o.append(T(x0 - 12, 42, "長音階を基準にした書き方", "end", 10, MUT))
    for k in range(12):
        cx = x0 + k * cw + cw / 2
        o.append(T(cx, 42, _f15_DEG[k], "middle", 10 if k == 6 else 11, INK, True))
    y = 72
    for r, ref in rows:
        if r == "sep":
            o.append(W(16, y - 8, x0 + 12 * cw + 90, y - 8, c=MUT, lw=1, dash="6,4"))
            y += 8
            continue
        cum = _f15_cum(r)
        col = _f15_col(r)
        if ref is None:
            o.append(T(x0 - 12, y - 1, _f15_NM[r], "end", 12, MUT, True))
            o.append(T(x0 - 12, y + 12, "（比べる音階）", "end", 10, MUT))
            for c, nm in zip(cum, _f15_names("C4", r, 7)):
                cx = x0 + c * cw + cw / 2
                o.append(CIRC(cx, y, rr, MUT, 1.1, PAN))
                o.append(T(cx, y + 4, nm, "middle", 10.5, MUT))
            o.append(T(x0 + 12 * cw + 10, y + 4.5, "長音階" if r == 0 else "自然短音階", "start", 11, MUT, True))
        else:
            rc = _f15_cum(ref)
            names = _f15_names("C4", r, 7)
            o.append(T(x0 - 12, y + 4.5, _f15_NM[r], "end", 12, col, True))
            ch = []
            for c, nm in zip(cum, names):
                cx = x0 + c * cw + cw / 2
                isch = c not in rc
                if isch:
                    g = [q for q in rc if q not in cum and abs(q - c) == 1][0]
                    gx = x0 + g * cw + cw / 2
                    o.append(CIRC(gx, y, rr, MUT, 1.1, "none", dash="3,3"))
                    if g > c:
                        o.append(ARR(gx - rr - 1, y, cx + rr + 2, y, SIG, 1.4, 5))
                    else:
                        o.append(ARR(gx + rr + 1, y, cx - rr - 2, y, SIG, 1.4, 5))
                    ch.append(nm)
                o.append(CIRC(cx, y, rr, SIG if isch else col, 2.0 if isch else 1.3, SSOFT if isch else _f15_soft(col)))
                o.append(T(cx, y + 4, nm, "middle", 10.5, SIG if isch else INK, True))
            o.append(T(x0 + 12 * cw + 10, y + 4.5, "特性音 " + "・".join(ch), "start", 11.5, SIG, True))
        y += 34
    return SVG(712, y - 8, o,
               "特性音（赤）。上の組は主音の上の 3 度が長 3 度のモードで長音階と、下の組は短 3 度のモードで自然短音階と比べた（主音 C）。"
               "破線の円は比べる音階の音の位置で、矢印はそこから半音動いたことを表す。ロクリアンは 2 つの音が違う。")
F["e15_char"] = _f15_char()


# 9. 特性音を含む和音（主音 C の代表的な進行）
def _f15_progs():
    o = []
    s = 9
    st0 = staff_start(s)
    panels = [
        ("リディアン: I → II", [("C", "I", ["C4", "E4", "G4"]), ("D", "II", ["D4", "F#4", "A4"])], "F♯4", "F♯（♯4）"),
        ("ミクソリディアン: I → ♭VII", [("C", "I", ["C4", "E4", "G4"]), ("B♭", "♭VII", ["Bb3", "D4", "F4"])], "B♭3", "B♭（♭7）"),
        ("ドリアン: Im7 → IV7", [("Cm7", "Im7", ["C4", "Eb4", "G4", "Bb4"]), ("F7", "IV7", ["F4", "A4", "C5", "Eb5"])], "A4", "A（6）"),
        ("フリジアン: Im → ♭II", [("Cm", "Im", ["C4", "Eb4", "G4"]), ("D♭", "♭II", ["Db4", "F4", "Ab4"])], "D♭4", "D♭（♭2）"),
    ]
    for i, (title, chords, cn, cl) in enumerate(panels):
        px = 10 + (i % 2) * 352
        py = 8 + (i // 2) * 168
        o.append(RECT(px, py, 340, 156, 10, PAN, LIN, 1))
        o.append(T(px + 12, py + 22, title, "start", 12.5, INK, True))
        items = []
        for j, (sym, rom, ns) in enumerate(chords):
            fills = {nname(n): SIG for n in ns if nname(n) == cn}
            items.append(dict(x=st0 + 22 + j * 74, notes=ns, sym=sym, symcol=INK, label=rom, lcol=MUT, label_dy=3.9 * s, fills=fills))
        o.append(STAFF(px + 10, py + 58, st0 + 22 + 74 + 40, s=s, clef="treble", items=items))
        o.append(T(px + 232, py + 78, "特性音", "start", 11, MUT, True))
        o.append(T(px + 232, py + 98, cl, "start", 13, SIG, True))
    return SVG(712, 8 + 2 * 168, o,
               "主和音と、特性音（赤）を含む和音を交互にくり返す、代表的な進行（主音 C）。上がコードネーム、下がディグリーネーム。"
               "どの例も、2 つ目の和音に特性音が入っている。")
F["e15_progs"] = _f15_progs()


# 10. 特性音だけを替えて比べる（ドリアン ↔ 自然短音階、リディアン ↔ 長音階）
def _f15_compare():
    o = []
    s = 9
    st0 = staff_start(s)
    rows = [
        (("C ドリアン", [("Cm7", "Im7", ["C4", "Eb4", "G4", "Bb4"]), ("F7", "IV7", ["F4", "A4", "C5", "Eb5"])], "A4", SIG, "特性音 A"),
         ("C エオリアン（C 自然短音階）", [("Cm7", "Im7", ["C4", "Eb4", "G4", "Bb4"]), ("Fm7", "IVm7", ["F4", "Ab4", "C5", "Eb5"])], "A♭4", PUR, "A♭（自然短音階の音）")),
        (("C リディアン", [("C", "I", ["C4", "E4", "G4"]), ("D", "II", ["D4", "F#4", "A4"])], "F♯4", SIG, "特性音 F♯"),
         ("C イオニアン（C 長音階）", [("C", "I", ["C4", "E4", "G4"]), ("Dm", "IIm", ["D4", "F4", "A4"])], "F4", BLU, "F（長音階の音）")),
    ]
    for i, pair in enumerate(rows):
        py = 8 + i * 178
        for j, (title, chords, cn, cc, note) in enumerate(pair):
            px = 10 + j * 362
            o.append(RECT(px, py, 330, 166, 10, PAN, cc if j == 0 else LIN, 1.4 if j == 0 else 1))
            o.append(T(px + 12, py + 22, title, "start", 12.5, INK, True))
            items = []
            for k, (sym, rom, ns) in enumerate(chords):
                fills = {nname(n): cc for n in ns if nname(n) == cn}
                items.append(dict(x=st0 + 22 + k * 74, notes=ns, sym=sym, symcol=INK, label=rom, lcol=MUT, label_dy=3.9 * s, fills=fills))
            o.append(STAFF(px + 10, py + 60, st0 + 22 + 74 + 40, s=s, clef="treble", items=items))
            o.append(T(px + 226, py + 96, note.split("（")[0], "start", 13, cc, True))
            if "（" in note:
                o.append(T(px + 226, py + 116, "（" + note.split("（")[1], "start", 10.5, MUT))
        o.append(ARR(10 + 330 + 4, py + 92, 10 + 362 - 4, py + 92, MUT, 1.4, 6))
    return SVG(712, 8 + 2 * 178, o,
               "特性音だけを、比べる音階の音に替えた例。上: ドリアンの IV7 の A を A♭ に替えると IVm7 になり、自然短音階の和音になる。"
               "下: リディアンの II の F♯ を F に替えると IIm になり、長音階の和音になる。左右で違うのは 1 つの音だけである。")
F["e15_compare"] = _f15_compare()


# 11. 7 つのモードの主和音と第 7 音（主音 C）
def _f15_tonic():
    o = []
    y0, rh = 62, 32
    cols = [16, 168, 344, 446, 610]
    heads = ["モード", "主和音（主音 C）", "主音の上の 5 度", "第 7 音", "V7 → I"]
    for x, h in zip(cols, heads):
        o.append(T(x, y0 - 30, h, "start", 10.5, MUT, True))
    for i, r in enumerate(_f15_ORD):
        y = y0 + i * rh
        cum = _f15_cum(r)
        col = _f15_col(r)
        names = _f15_names("C4", r, 7)
        tri = {BLU: ("", "長三和音"), PUR: ("m", "短三和音"), GLD: ("dim", "減三和音")}[col]
        o.append(T(cols[0], y + 4.5, _f15_NM[r], "start", 12, col, True))
        o.append(T(cols[1], y + 4.5, "C" + tri[0], "start", 12.5, INK, True))
        for j, idx in enumerate((0, 2, 4)):
            cx = cols[1] + 62 + j * 30
            bad = idx == 4 and cum[4] == 6
            o.append(CIRC(cx, y, 12, SIG if bad else col, 1.4 if not bad else 2, SSOFT if bad else _f15_soft(col)))
            o.append(T(cx, y + 4, names[idx], "middle", 10.5, SIG if bad else INK, True))
        o.append(T(cols[2], y + 4.5, "完全 5 度" if cum[4] == 7 else "減 5 度", "start", 11.5, INK if cum[4] == 7 else SIG, True))
        lead = cum[6] == 11
        o.append(CIRC(cols[3] + 12, y, 12, GRN2 if lead else MUT, 1.4, GSOFT if lead else PAN))
        o.append(T(cols[3] + 12, y + 4, names[6], "middle", 10.5, INK, True))
        o.append(T(cols[3] + 32, y + 4.5, "主音の半音下（導音）" if lead else "主音の全音下", "start", 11, GRN2 if lead else MUT, lead))
        o.append(T(cols[4], y + 4.5, "作れる" if r == 0 else "作れない", "start", 11.5, GRN2 if r == 0 else MUT, r == 0))
    return SVG(712, y0 + 6 * rh + 22, o,
               "7 つのモードの主和音と第 7 音（主音 C、明るさの順）。導音を持つのはイオニアンとリディアンだけで、V7（G・B・D・F）の音がそろうのはイオニアンだけである。"
               "ロクリアンは主音の上の 5 度が減 5 度（赤）なので、主和音が減三和音になる。")
F["e15_tonic"] = _f15_tonic()


# 12. ジャズ: ハ長調のダイアトニックセブンスコードと、根音から並べたモード
def _f15_jazz():
    o = []
    s = 9
    st0 = staff_start(s)
    chords = [("CM7", "IM7", ["C4", "E4", "G4", "B4"], 0), ("Dm7", "IIm7", ["D4", "F4", "A4", "C5"], 1),
              ("Em7", "IIIm7", ["E4", "G4", "B4", "D5"], 2), ("FM7", "IVM7", ["F4", "A4", "C5", "E5"], 3),
              ("G7", "V7", ["G4", "B4", "D5", "F5"], 4), ("Am7", "VIm7", ["A4", "C5", "E5", "G5"], 5),
              ("Bm7(♭5)", "VIIm7(♭5)", ["B4", "D5", "F5", "A5"], 6)]
    dx = 90
    items = []
    for j, (sym, rom, ns, r) in enumerate(chords):
        items.append(dict(x=st0 + 30 + j * dx, notes=ns, sym=sym, symcol=INK, label=rom, lcol=MUT, label_dy=2.9 * s, lsz=11))
    sx, sy = 16, 50
    o.append(STAFF(sx, sy, st0 + 30 + 6 * dx + 50, s=s, clef="treble", items=items))
    for j, (sym, rom, ns, r) in enumerate(chords):
        x = sx + st0 + 30 + j * dx
        o.append(T(x, sy + 4 * s + 46, ns[0][0], "middle", 12, SIG, True))
        o.append(T(x, sy + 4 * s + 62, _f15_NM[r], "middle", 10.5, _f15_col(r), True))
    o.append(T(sx, sy + 4 * s + 86, "下の 2 行: 和音の根音（赤）を主音にして白鍵を並べたモード", "start", 10.5, MUT))
    return SVG(712, sy + 4 * s + 96, o,
               "ハ長調のダイアトニックセブンスコード（上がコードネーム、下がディグリーネーム）と、それぞれの和音の上で基本にするモード。"
               "どの和音でも白鍵の 7 つを使い、和音の根音を主音とみなして呼ぶ。")
F["e15_jazz"] = _f15_jazz()
