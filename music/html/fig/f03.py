# 03 章 音程 の図（figures.py の関数・定数をそのまま使う）

_QCOL = {"完全": GRN2, "長": BLU, "短": PUR, "増": ALI, "減": GLD}

def _iname(lo, hi):
    """2 つの音名から（度数, 半音の数, 種類）を返す。lo が下の音。"""
    a, b = parse(lo), parse(hi)
    d = b["dia"] - a["dia"] + 1
    s = b["midi"] - a["midi"]
    d0 = (d - 1) % 7 + 1
    k = (d - 1) // 7
    s0 = s - 12 * k
    if d0 in (1, 4, 5):
        ref = {1: 0, 4: 5, 5: 7}[d0]
        q = {0: "完全", 1: "増", -1: "減"}[s0 - ref]
    else:
        ref = {2: 2, 3: 4, 6: 9, 7: 11}[d0]
        q = {0: "長", -1: "短", 1: "増", -2: "減"}[s0 - ref]
    return d, s, q


# 1. 半音の数を数える（C4 → E4）
def _f03_semis():
    o = []
    info = {}
    hl = {60: dict(c=SIG, label="C"), 64: dict(c=SIG, label="E")}
    for m in (61, 62, 63):
        hl[m] = dict(c=BLU, label="")
    o.append(KEYBOARD(40, 30, 60, 71, ww=48, wh=150, hl=hl, names=None, info=info))
    for k, m in enumerate(range(60, 64)):
        xa, xb = info[m][0], info[m + 1][0]
        y = 200 + (k % 2) * 4
        o.append(PL([(xa, y - 6), ((xa + xb) / 2, y + 8), (xb, y - 6)], ALI, 1.8))
        o.append(T((xa + xb) / 2, y + 24, "%d" % (k + 1), "middle", 12, ALI, True))
    o.append(T(420, 70, "C4 から E4 まで", "start", 12, INK, True))
    o.append(T(420, 92, "鍵を 1 つずつ進むと 4 つ", "start", 11.5, INK))
    o.append(T(420, 114, "= 半音 4 つ分の距離", "start", 11.5, SIG, True))
    o.append(T(420, 146, "黒鍵も 1 つと数える", "start", 10.5, MUT))
    return SVG(640, 240, o, "2 つの音の距離は、鍵盤の上で何回となりの鍵へ進むか（半音の数）で数えられる。C4 から E4 までは半音 4 つ分である。")
F["e03_semis"] = _f03_semis()


# 2. 度数: 文字の名前を両端を含めて数える
def _f03_degree():
    o = []
    s = 10
    uppers = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
    items = []
    for i, n in enumerate(uppers):
        items.append(dict(x=86 + i * 64, notes=["C4", n] if n != "C4" else ["C4"], fill=SIG if n == "E4" else INK,
                          label="%d 度" % (i + 1), lcol=SIG if n == "E4" else INK))
    o.append(STAFF(20, 36, 86 + 7 * 64 + 40, s=s, clef="treble", items=items))
    # C→E の数え方
    X = 20
    y = 150
    o.append(T(X, y, "C から E まで、文字の名前を両端を含めて数える:", "start", 11.5, INK, True))
    for i, (L, on) in enumerate([("C", True), ("D", True), ("E", True), ("F", False), ("G", False)]):
        cx = X + 330 + i * 46
        o.append(CIRC(cx, y - 4, 15, SIG if on else LIN, 1.5, SSOFT if on else PAN))
        o.append(T(cx, y + 1, L, "middle", 12, INK if on else MUT, on))
        if on:
            o.append(T(cx, y + 28, "%d" % (i + 1), "middle", 11, SIG, True))
    o.append(T(X + 330 + 5 * 46 - 10, y + 2, "→ 3 度", "start", 12, SIG, True))
    return SVG(640, 196, o, "度数は、下の音から上の音まで、文字の名前（C D E F G A B）を両端を含めて数えた数である。"
               "同じ文字どうしが 1 度、1 オクターブ上の同じ文字が 8 度になる。五線では、線と間を両端を含めて数えればよい。")
F["e03_degree"] = _f03_degree()


# 3. 白鍵の 3 度は 2 種類（五線では同じに見える）
def _f03_thirds():
    o = []
    s = 10
    pairs = [("C4", "E4"), ("D4", "F4"), ("E4", "G4"), ("F4", "A4"), ("G4", "B4"), ("A4", "C5"), ("B4", "D5")]
    items = []
    for i, (a, b) in enumerate(pairs):
        d, semis, q = _iname(a, b)
        col = BLU if q == "長" else PUR
        items.append(dict(x=80 + i * 72, notes=[a, b], fill=col, label="%s3 度" % q, lcol=col))
    o.append(STAFF(20, 34, 80 + 6 * 72 + 50, s=s, clef="treble", items=items))
    for i, (a, b) in enumerate(pairs):
        d, semis, q = _iname(a, b)
        col = BLU if q == "長" else PUR
        x = 20 + 80 + i * 72
        o.append(T(x, 150, "%s–%s" % (nname(a, False), nname(b, False)), "middle", 11, INK, True))
        o.append(T(x, 166, "半音 %d" % semis, "middle", 10.5, col, True))
    o.append(T(20, 192, "五線の上ではどれも「線と線」か「間と間」で同じ形に見えるが、半音の数は 4 と 3 の 2 種類ある。", "start", 11, MUT))
    return SVG(640, 206, o, "白鍵だけで作った 3 度。半音 4 つ（青）と半音 3 つ（紫）の 2 種類がある。大きいほうを長 3 度、小さいほうを短 3 度という。")
F["e03_thirds"] = _f03_thirds()


# 4. 白鍵どうしの音程の大きさ（度数ごとに何種類あるか）
def _f03_whitetable():
    o = []
    roots = list("CDEFGAB")
    x0, y0, cw, ch = 112, 50, 66, 30
    o.append(T(x0 - 14, y0 - 14, "下の音 →", "end", 10.5, MUT))
    for j, L in enumerate(roots):
        o.append(T(x0 + j * cw + cw / 2, y0 - 14, L, "middle", 12, INK, True))
    for i, d in enumerate(range(2, 8)):
        y = y0 + i * ch
        o.append(T(x0 - 14, y + ch / 2 + 4, "%d 度" % d, "end", 12, INK, True))
        for j, L in enumerate(roots):
            a = L + "4"
            li = "CDEFGAB".index(L) + d - 1
            b = "CDEFGAB"[li % 7] + str(4 + li // 7)
            dd, semis, q = _iname(a, b)
            col = _QCOL[q]
            fl = {"長": BSOFT, "短": PSOFT, "完全": GSOFT, "増": ASOFT, "減": GOSOFT}[q]
            o.append(RECT(x0 + j * cw + 3, y + 3, cw - 6, ch - 6, 5, fl, col, 1.2))
            o.append(T(x0 + j * cw + cw / 2, y + ch / 2 + 4, "%d" % semis, "middle", 11.5, col, True))
        kinds = {}
        for j, L in enumerate(roots):
            li = "CDEFGAB".index(L) + d - 1
            b = "CDEFGAB"[li % 7] + str(4 + li // 7)
            kinds.setdefault(_iname(L + "4", b)[2], 0)
            kinds[_iname(L + "4", b)[2]] += 1
        txt = "・".join("%s %d" % (k, v) for k, v in sorted(kinds.items(), key=lambda kv: -kv[1]))
        o.append(T(x0 + 7 * cw + 14, y + ch / 2 + 4, txt, "start", 10.5, MUT))
    leg = [("長", BSOFT, BLU), ("短", PSOFT, PUR), ("完全", GSOFT, GRN2), ("増", ASOFT, ALI), ("減", GOSOFT, GLD)]
    for k, (nm, fl, c) in enumerate(leg):
        x = x0 + k * 90
        o.append(RECT(x, y0 + 6 * ch + 16, 14, 14, 3, fl, c, 1.2))
        o.append(T(x + 20, y0 + 6 * ch + 28, nm, "start", 11, c, True))
    return SVG(712, 262, o, "白鍵どうしの音程の、半音の数。2・3・6・7 度は 2 種類の大きさがあり（長と短）、4・5 度はほとんどが 1 種類（完全）で、"
               "F–B の 4 度と B–F の 5 度だけが半音 6 つになる。")
F["e03_whitetable"] = _f03_whitetable()


# 5. 種類の並び: 減 ← 短 ← 長 → 増、減 ← 完全 → 増
def _f03_qualities():
    o = []
    def line(y, title, cells, color):
        o.append(T(20, y - 30, title, "start", 12, INK, True))
        x0, dx = 60, 130
        o.append(W(x0 - 20, y, x0 + (len(cells) - 1) * dx + 20, y, c=LIN, lw=1.4))
        for i, (q, semis, ex) in enumerate(cells):
            x = x0 + i * dx
            col = _QCOL[q]
            o.append(CIRC(x, y, 22, col, 1.6, {"長": BSOFT, "短": PSOFT, "完全": GSOFT, "増": ASOFT, "減": GOSOFT}[q]))
            o.append(T(x, y + 5, q, "middle", 13, col, True))
            o.append(T(x, y + 42, "半音 %d" % semis, "middle", 11, INK, True))
            o.append(T(x, y + 58, ex, "middle", 10.5, MUT))
            if i:
                o.append(T(x - dx / 2, y - 8, "+1", "middle", 10.5, MUT))
    line(70, "2・3・6・7 度（例: 3 度）", [("減", 2, "C–E♭♭"), ("短", 3, "C–E♭"), ("長", 4, "C–E"), ("増", 5, "C–E♯")], BLU)
    line(196, "1・4・5・8 度（例: 5 度）", [("減", 6, "C–G♭"), ("完全", 7, "C–G"), ("増", 8, "C–G♯")], GRN2)
    o.append(T(600, 150, "度数（文字の数）が同じなら、", "end", 10.5, MUT))
    o.append(T(600, 166, "半音が 1 つ増えるごとに右へ進む", "end", 10.5, MUT))
    return SVG(640, 278, o, "同じ度数の中で、半音の数が 1 つ違うごとに種類の名前が変わる。2・3・6・7 度は「減・短・長・増」、"
               "1・4・5・8 度は「減・完全・増」と並ぶ。")
F["e03_qualities"] = _f03_qualities()


# 6. 音程の名前を求める手順（4 つの例）
def _f03_steps():
    o = []
    ex = [("E4", "G#4"), ("D4", "F4"), ("F#4", "C5"), ("Bb3", "E4")]
    for k, (a, b) in enumerate(ex):
        cx = 16 + (k % 2) * 344
        cy = 16 + (k // 2) * 150
        d, semis, q = _iname(a, b)
        o.append(RECT(cx, cy, 320, 136, 10, PAN, LIN, 1.2))
        o.append(T(cx + 14, cy + 24, "%s → %s" % (nname(a, False), nname(b, False)), "start", 14, INK, True))
        pa, pb = parse(a), parse(b)
        letters = [ "CDEFGAB"[(pa["li"] + i) % 7] for i in range(d)]
        o.append(T(cx + 14, cy + 52, "① 文字: %s → %d 度" % (" ".join(letters), d), "start", 11.5, INK))
        o.append(T(cx + 14, cy + 76, "② 半音: %d 個" % semis, "start", 11.5, INK))
        o.append(T(cx + 14, cy + 100, "③ %d 度で半音 %d → %s %d 度" % (d, semis, q, d), "start", 11.5, _QCOL[q], True))
        info = {}
        lo = (pa["midi"] // 12) * 12
        hl = {pa["midi"]: dict(c=SIG, label=""), pb["midi"]: dict(c=SIG, label="")}
        o.append(KEYBOARD(cx + 210, cy + 40, lo, lo + 23 if pb["midi"] > lo + 11 else lo + 11, ww=7.4 if pb["midi"] > lo + 11 else 13, wh=56, hl=hl, names=None, info=info))
    return SVG(696, 318, o, "音程の名前は、①文字を数えて度数を決め、②半音を数え、③その度数の表（長・短・完全・増・減）と比べて決める。")
F["e03_steps"] = _f03_steps()


# 7. 転回
def _f03_inversion():
    o = []
    s = 11
    o.append(STAFF(20, 40, 300, s=s, clef="treble", items=[dict(x=90, notes=["C4", "E4"], fill=BLU, label="C–E: 長 3 度", lcol=BLU),
                                                         dict(x=220, notes=["E4", "C5"], fill=PUR, label="E–C: 短 6 度", lcol=PUR)]))
    o.append(ARR(130, 26, 220, 26, MUT, 1.4))
    o.append(T(175, 18, "下の C を 1 オクターブ上へ", "middle", 10, MUT))
    info = {}
    hl = {60: dict(c=BLU, label="C"), 64: dict(c=SIG, label="E"), 72: dict(c=PUR, label="C")}
    o.append(KEYBOARD(350, 40, 60, 72, ww=24, wh=80, hl=hl, names=None, info=info))
    y = 140
    o.append(DARR(info[60][0], y, info[64][0], y, BLU, 1.4))
    o.append(T((info[60][0] + info[64][0]) / 2, y + 16, "4", "middle", 11, BLU, True))
    o.append(DARR(info[64][0], y, info[72][0], y, PUR, 1.4))
    o.append(T((info[64][0] + info[72][0]) / 2, y + 16, "8", "middle", 11, PUR, True))
    o.append(T(350, 186, "半音: 4 + 8 = 12（1 オクターブ）", "start", 11.5, INK, True))
    o.append(T(350, 204, "度数: 3 + 6 = 9", "start", 11.5, INK, True))
    return SVG(680, 216, o, "下の C を 1 オクターブ上げると、C–E（長 3 度）は E–C（短 6 度）になる。半音の数は合わせて 12、度数は合わせて 9 になる。")
F["e03_inversion"] = _f03_inversion()


# 8. オクターブを超える音程
def _f03_compound():
    o = []
    s = 9
    items = [dict(x=80, notes=["C4", "D5"], fill=BLU, label="長 9 度"),
             dict(x=190, notes=["C4", "F5"], fill=GRN2, label="完全 11 度"),
             dict(x=300, notes=["C4", "A5"], fill=BLU, label="長 13 度")]
    o.append(STAFF(20, 46, 360, s=s, clef="treble", items=items))
    rows = [("長 9 度", "= 長 2 度 + 1 オクターブ", "半音 2 + 12 = 14"),
            ("完全 11 度", "= 完全 4 度 + 1 オクターブ", "半音 5 + 12 = 17"),
            ("長 13 度", "= 長 6 度 + 1 オクターブ", "半音 9 + 12 = 21")]
    for i, (a, b, c) in enumerate(rows):
        y = 50 + i * 44
        o.append(T(410, y, a, "start", 12, INK, True))
        o.append(T(500, y, b, "start", 11, MUT))
        o.append(T(500, y + 16, c, "start", 10.5, MUT))
    return SVG(712, 186, o, "1 オクターブを超える音程は、オクターブより下の音程に 1 オクターブを足したものとして読む。度数は 7 を足す（8 ではない）。")
F["e03_compound"] = _f03_compound()


# 9. C4 から 1 オクターブ内のすべての音程
def _f03_all():
    o = []
    s = 9
    ups = [("C4", "完全 1 度"), ("Db4", "短 2 度"), ("D4", "長 2 度"), ("Eb4", "短 3 度"), ("E4", "長 3 度"), ("F4", "完全 4 度"),
           ("F#4", "増 4 度"), ("G4", "完全 5 度"), ("Ab4", "短 6 度"), ("A4", "長 6 度"), ("Bb4", "短 7 度"), ("B4", "長 7 度"), ("C5", "完全 8 度")]
    items = []
    for i, (n, lab) in enumerate(ups):
        q = lab.split()[0]
        items.append(dict(x=70 + i * 47, notes=["C4", n] if n != "C4" else ["C4"], fill=_QCOL[q]))
    o.append(STAFF(16, 34, 70 + 12 * 47 + 34, s=s, clef="treble", items=items))
    for i, (n, lab) in enumerate(ups):
        q, d, _ = lab.split()
        x = 16 + 70 + i * 47
        o.append(T(x, 128, q, "middle", 10.5, _QCOL[q], True))
        o.append(T(x, 142, d + "度", "middle", 10.5, _QCOL[q], True))
        o.append(T(x, 160, "%d" % i, "middle", 10.5, INK, True))
    o.append(T(16, 160, "半音", "start", 9.5, MUT))
    return SVG(712, 172, o, "C4 から 1 オクターブ内のすべての音程（半音 0〜12）。半音 6 は増 4 度（C–F♯）とも減 5 度（C–G♭）とも書ける。")
F["e03_all"] = _f03_all()
