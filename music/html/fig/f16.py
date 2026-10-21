# 16 章 リズムと拍子 の図（figures.py の関数・定数をそのまま使う）

# ---------- この章で使う小さな部品 ----------
_f16_STR = {"強": SIG, "中強": BLU, "弱": MUT}      # 拍の強さの色
_f16_KIT = {"%hat": GLD, "%snare": SIG, "%kick": BLU}  # ドラムの 3 つの音の色
_f16_KITNAME = {"%hat": "ハイハット", "%snare": "スネア", "%kick": "バスドラム"}


def _f16_beatgrid(x0, ytop, ybot, nb, u, lab=True, ly=None, first=1, sz=10.5):
    """拍の区切りの縦の破線と、拍の番号。x0: 1 拍目の左端、u: 1 拍の幅"""
    o = []
    for k in range(nb + 1):
        o.append(W(x0 + k * u, ytop, x0 + k * u, ybot, c=LIN, lw=1, dash="3,3"))
    if lab:
        for k in range(nb):
            o.append(T(x0 + k * u + u / 2, ly if ly is not None else ybot + 14, str(k + first), "middle", sz, MUT))
    return o


def _f16_bar(x, y, w, h, c, fill, label=None, lc=None, sz=10.5):
    """長さを表す横棒"""
    o = [RECT(x, y, max(w, 2), h, 3, fill, c, 1.3)]
    if label:
        o.append(T(x + w / 2, y + h / 2 + 4, label, "middle", sz, lc or c, True))
    return o


def _f16_brack(x1, x2, y, label, c=INK, up=True, sz=10.5):
    """x1〜x2 の上（または下）の角かっこと文字"""
    d = -5 if up else 5
    o = [W(x1, y - d, x1, y, x2, y, x2, y - d, c=c, lw=1.2)]
    o.append(T((x1 + x2) / 2, y - 6 if up else y + 15, label, "middle", sz, c, True))
    return o


def _f16_tuplet(x1, x2, y, n="3", c=INK, sz=10):
    """3 連符の かっこ（上）。x1〜x2 は両端の符幹の x"""
    xm = (x1 + x2) / 2
    o = [W(x1, y + 5, x1, y, xm - 7, y, c=c, lw=1.1), W(xm + 7, y, x2, y, x2, y + 5, c=c, lw=1.1)]
    o.append(T(xm, y + 4, n, "middle", sz, c, True))
    return o


# ======================= 1. 拍とテンポ =======================

# 旋律の音（長さがまちまち）と、一定の間隔の拍
_f16_MEL = [("G4", 1), ("A4", 1), ("G4", 0.5), ("F4", 0.5), ("E4", 1), ("D4", 1.5), ("E4", 0.5), ("C4", 2)]

def _f16_pulse():
    o = []
    x0, u = 120, 64
    ytop, yb = 28, 150
    o += _f16_beatgrid(x0, ytop, yb, 8, u, lab=False)
    # 旋律の音（ピアノロール）。高さは縦の位置、長さは横の長さ
    lo, hi = 60, 69
    Y = lambda m: 112 - (m - lo) * 8.5
    t = 0.0
    for n, d in _f16_MEL:
        m = parse(n)["midi"]
        o += _f16_bar(x0 + t * u + 1.5, Y(m) - 7, d * u - 3, 14, SIG, SSOFT, nname(n), INK, 10)
        t += d
    o.append(T(x0 - 14, 74, "旋律の音", "end", 12, INK, True))
    o.append(T(x0 - 14, 90, "（高さ・長さ）", "end", 10, MUT))
    # 拍
    for k in range(8):
        o.append(CIRC(x0 + k * u, yb, 6, BLU, 1.4, BLU))
        o.append(T(x0 + k * u, yb + 22, str(k + 1), "middle", 10.5, BLU, True))
    o.append(W(x0 - 6, yb, x0 + 8 * u, yb, c=BLU, lw=1.2))
    o.append(T(x0 - 14, yb + 4, "拍", "end", 12, BLU, True))
    o.append(ARR(x0 + 8 * u - 40, yb + 40, x0 + 8 * u + 8, yb + 40, MUT, 1.2))
    o.append(T(x0 + 8 * u - 46, yb + 44, "時間", "end", 10.5, MUT))
    return SVG(680, 200, o, "旋律の音（上。横の長さが音の続く時間）は長さがまちまちだが、その下で、同じ間隔の拍（下の青い点）が続いていると感じられる。"
               "音の長さは、拍の何個分かで数えられる（いちばん右の C4 は拍 2 つ分、その前の E4 は半分）。")
F["e16_pulse"] = _f16_pulse()


# テンポ 60・90・120 の拍の間隔（同じ 4 秒の時間軸）
def _f16_tempo():
    o = []
    x0, sec = 150, 124
    rows = [(60, 62), (90, 114), (120, 166)]
    o.append(T(20, 20, "1 拍の長さ = 60 ÷ テンポ（秒）", "start", 12, INK, True))
    o.append(T(x0 + 4 * sec + 26, 34, "4 秒間に", "middle", 10, MUT))
    for M, y in rows:
        Tb = 60.0 / M
        o.append(T(x0 - 18, y + 4, "テンポ %d" % M, "end", 12, INK, True))
        o.append(W(x0, y, x0 + 4 * sec, y, c=LIN, lw=1.2))
        k = 0
        while k * Tb < 4 - 1e-9:
            o.append(CIRC(x0 + k * Tb * sec, y, 6, BLU, 1.4, BLU))
            k += 1
        o += _f16_brack(x0, x0 + Tb * sec, y - 13, "1 拍 = %s 秒" % ("%.2f" % Tb).rstrip("0").rstrip("."), SIG)
        o.append(T(x0 + 4 * sec + 26, y + 4, "%d 拍" % k, "middle", 11.5, BLU, True))
    yb = 194
    o.append(W(x0, yb, x0 + 4 * sec, yb, c=MUT, lw=1))
    for s_ in range(5):
        o.append(W(x0 + s_ * sec, yb, x0 + s_ * sec, yb + 5, c=MUT, lw=1))
        o.append(T(x0 + s_ * sec, yb + 18, "%d 秒" % s_, "middle", 10, MUT))
    return SVG(712, 222, o, "同じ 4 秒の間に、テンポ 60 では拍が 4 つ、テンポ 120 では 8 つ入る。テンポ 90 では 1 拍が 0.67 秒（2/3 秒）になり、4 秒間に 6 拍入る。")
F["e16_tempo"] = _f16_tempo()


# ======================= 2. 音符と休符の長さ =======================

# 音符の部分の名前
def _f16_parts():
    o = []
    s = 10
    its = [dict(x=70, notes=["A4"], dur="whole"),
           dict(x=150, notes=["A4"], dur="half"),
           dict(x=230, notes=["A4"], dur="quarter"),
           dict(x=310, notes=["A4"], dur="eighth"),
           dict(x=400, notes=["A4"], dur="eighth", beam=1),
           dict(x=440, notes=["A4"], dur="eighth", beam=1),
           dict(x=540, notes=["D5"], dur="quarter")]
    ytop = 60
    o.append(STAFF(16, ytop, 600, s=s, clef="treble", items=its))
    yA = ytop + 4 * s - 3 * s / 2          # A4 の高さ
    X = lambda v: 16 + v
    # 符頭（白・黒）
    o.append(W(X(70), yA + 8, X(70), 134, c=MUT, lw=1))
    o.append(T(X(70), 148, "符頭（白）", "middle", 11, INK, True))
    o.append(W(X(230) - 2, yA + 7, X(230) - 2, 134, c=MUT, lw=1))
    o.append(T(X(230), 148, "符頭（黒）", "middle", 11, INK, True))
    # 符幹
    o.append(W(X(150) + 7, yA - 20, X(150) + 30, 30, c=MUT, lw=1))
    o.append(T(X(150) + 32, 26, "符幹", "start", 11, INK, True))
    # 旗
    o.append(W(X(310) + 14, yA - 27, X(310) + 30, 30, c=MUT, lw=1))
    o.append(T(X(310) + 32, 26, "旗", "start", 11, INK, True))
    # 連桁
    o.append(W(X(420), yA - 32, X(420), 30, c=MUT, lw=1))
    o.append(T(X(420), 24, "連桁", "middle", 11, INK, True))
    o.append(T(X(420), 148, "（旗の代わりにつなぐ）", "middle", 10, MUT))
    # 符幹の向き
    o.append(T(X(540), 148, "下向きの符幹", "middle", 11, INK, True))
    o.append(T(X(540), 164, "（第 3 線より上の音）", "middle", 10, MUT))
    return SVG(660, 176, o, "音符の部分の名前。玉の部分を符頭、棒を符幹という。8 分音符・16 分音符には旗が付き、続くときは旗の代わりに連桁でつなぐ。"
               "五線の真ん中の線（第 3 線）より上の音は、符幹を左側に下向きに書く。向きは長さに関係しない。")
F["e16_parts"] = _f16_parts()


# 音符の長さの木: 全音符を 2 等分していく
_f16_NV = [("whole", "全音符", 4, "4 拍"), ("half", "2 分音符", 2, "2 拍"), ("quarter", "4 分音符", 1, "1 拍"),
           ("eighth", "8 分音符", 0.5, "1/2 拍"), ("16th", "16 分音符", 0.25, "1/4 拍")]

def _f16_tree():
    o = []
    s = 8
    x0, u = 168, 112            # 1 拍目の左端、1 拍の幅
    ytop0, dy = 40, 62
    o += _f16_beatgrid(x0, 22, ytop0 + 4 * dy + 4 * s + 6, 4, u, ly=16)
    o.append(T(x0 - 8, 16, "拍", "end", 10.5, MUT))
    for r, (dur, nm, b, lb) in enumerate(_f16_NV):
        yt = ytop0 + r * dy
        its = []
        n = int(round(4 / b))
        for k in range(n):
            it = dict(x=x0 - 100 + k * b * u + 14, notes=["A4"], dur=dur)
            if dur in ("eighth", "16th"):
                it["beam"] = int(k * b)
            its.append(it)
        o.append(STAFF(100, yt, 4 * u + 74, s=s, clef="treble", items=its))
        o.append(T(16, yt + 2 * s + 4, nm, "start", 12, INK, True))
        o.append(T(x0 + 4 * u + 14, yt + 2 * s - 3, lb, "start", 11.5, SIG, True))
        o.append(T(x0 + 4 * u + 14, yt + 2 * s + 12, "%d 個で 4 拍" % n, "start", 10, MUT))
        if r:
            o.append(T(16, yt - 14, "↓ 2 等分", "start", 10, MUT))
    return SVG(712, ytop0 + 4 * dy + 4 * s + 24, o, "全音符を 2 等分すると 2 分音符、さらに 2 等分すると 4 分音符になる。名前の数字は、全音符を何等分した長さかを表す。"
               "4 分音符を 1 拍とすると、全音符は 4 拍、8 分音符は 1/2 拍、16 分音符は 1/4 拍である。縦の破線は拍の区切り。")
F["e16_tree"] = _f16_tree()


# 音符と休符の対応
def _f16_rests():
    o = []
    s = 10
    its = []
    x = 90
    for k, (dur, nm, b, lb) in enumerate(_f16_NV):
        its.append(dict(x=x, notes=["A4"], dur=dur))
        its.append(dict(x=x + 46, rest=True, dur=dur))
        if k < 4:
            its.append(dict(x=x + 76, bar=True))
        x += 120
    ytop = 46
    o.append(STAFF(10, ytop, x - 30, s=s, clef="treble", items=its))
    x = 90
    for k, (dur, nm, b, lb) in enumerate(_f16_NV):
        cx = 10 + x
        o.append(T(cx, 26, "音符", "middle", 10, MUT))
        o.append(T(cx + 46, 26, "休符", "middle", 10, MUT))
        o.append(T(cx + 23, ytop + 4 * s + 32, nm.replace("音符", ""), "middle", 12, INK, True))
        o.append(T(cx + 23, ytop + 4 * s + 50, lb, "middle", 11.5, SIG, True))
        x += 120
    o.append(T(14, ytop + 4 * s + 32, "名前", "start", 10, MUT))
    o.append(T(14, ytop + 4 * s + 50, "長さ", "start", 10, MUT))
    return SVG(712, ytop + 4 * s + 62, o, "音符（左）と、同じ長さの休符（右）。全休符は第 4 線からぶら下がり、2 分休符は第 3 線の上に乗る。"
               "休符の名前は、音符の名前の「音符」を「休符」に替えたもの（4 分休符、8 分休符、…）。")
F["e16_rests"] = _f16_rests()


# 付点: もとの長さ + その半分
def _f16_dot():
    o = []
    s = 9
    rows = [("half", "付点 2 分音符", 2, "2 分音符", "2 + 1 = 3 拍"),
            ("quarter", "付点 4 分音符", 1, "4 分音符", "1 + 1/2 = 3/2 拍"),
            ("eighth", "付点 8 分音符", 0.5, "8 分音符", "1/2 + 1/4 = 3/4 拍")]
    x0, u = 274, 92
    y0, dy = 40, 74
    o.append(T(x0 - 8, 18, "拍", "end", 10, MUT))
    o += _f16_beatgrid(x0, 24, y0 + 3 * dy - 18, 3, u, ly=18)
    for r, (dur, nm, b, n1, eq) in enumerate(rows):
        yt = y0 + r * dy
        o.append(T(16, yt + 2 * s + 4, nm, "start", 12, INK, True))
        o.append(STAFF(116, yt, 140, s=s, clef="treble", items=[dict(x=84, notes=["A4"], dur=dur, dot=True)]))
        yb = yt + 6
        o += _f16_bar(x0 + 1, yb, b * u - 2, 18, BLU, BSOFT)
        o += _f16_bar(x0 + b * u + 1, yb, b * u / 2 - 2, 18, SIG, SSOFT)
        o.append(T(x0 + b * u / 2, yb + 34, n1, "middle", 10.5, BLU, True))
        o.append(T(x0 + b * u + b * u / 4, yb + 50, "+ その半分", "middle", 10.5, SIG, True))
        o.append(W(x0 + b * u + b * u / 4, yb + 20, x0 + b * u + b * u / 4, yb + 39, c=SIG, lw=1))
        o.append(T(x0 + 3 * u + 14, yb + 13, eq, "start", 11.5, INK, True))
    return SVG(712, y0 + 3 * dy - 2, o, "付点は、もとの音符の長さ（青）に、その半分（赤）を足す。どの付点音符も、もとの音符の 1.5 倍の長さになる。")
F["e16_dot"] = _f16_dot()


# タイ（同じ高さ）とスラー（違う高さ）
def _f16_tie():
    o = []
    s = 9
    u = 54
    panels = [("タイあり", ["A4", "A4"], True, False, "1 回だけ鳴り、2.5 拍続く", GRN2),
              ("タイなし", ["A4", "A4"], False, False, "2 回鳴る（2 拍 + 1/2 拍）", MUT),
              ("スラー（高さが違う）", ["A4", "F4"], False, True, "2 回鳴る。なめらかにつなぐ", BLU)]
    for k, (title, ns, tie, slur, txt, col) in enumerate(panels):
        px = 8 + k * 234
        o.append(RECT(px, 8, 224, 196, 10, PAN, LIN, 1.1))
        o.append(T(px + 112, 30, title, "middle", 12.5, col if col != MUT else INK, True))
        info = {}
        xs = 48
        its = [dict(x=xs, notes=[ns[0]], dur="half", tie=tie, key=0), dict(x=xs + 2 * u, notes=[ns[1]], dur="eighth", key=1)]
        o.append(STAFF(px + 6, 52, 210, s=s, clef="treble", items=its, info=info))
        if slur:
            (x1, y1), (x2, y2) = info[0][0], info[1][0]
            xa, xb = x1 + 2, x2 - 2
            ya, yb_ = y1 + 0.9 * s, y2 + 0.9 * s
            ym = max(ya, yb_) + 1.4 * s
            xm = (xa + xb) / 2
            o.append('<path d="M%g,%g Q%g,%g %g,%g Q%g,%g %g,%gZ" fill="%s"/>' % (xa, ya, xm, ym + 3, xb, yb_, xm, ym, xa, ya, INK))
        # 時間の棒
        X0 = px + 6 + xs - 6
        yb = 138
        if tie:
            o += _f16_bar(X0, yb, 2.5 * u, 16, GRN2, GSOFT)
            starts = [0]
        else:
            o += _f16_bar(X0, yb, 2 * u - 3, 16, col, PAN if col == MUT else BSOFT)
            o += _f16_bar(X0 + 2 * u, yb, 0.5 * u, 16, col, PAN if col == MUT else BSOFT)
            starts = [0, 2]
        for st in starts:
            o.append('<path d="M%g,%g l-5,-8 l10,0Z" fill="%s"/>' % (X0 + st * u, yb - 3, SIG))
        o.append(T(px + 112, 182, txt, "middle", 10.5, INK))
        o.append(T(X0 - 4, yb + 12, "音", "end", 9.5, MUT))
    o.append(T(16, 222, "▼ は音が鳴り始める所。棒は音が続く時間（長さは拍の数に比例）。", "start", 10, MUT))
    return SVG(712, 232, o, "左: 同じ高さの音符を弧（タイ）でつなぐと、2 つ目は弾き直さず、長さを足した 1 つの音になる。"
               "中: タイが無ければ 2 回鳴る。右: 高さの違う音符を結ぶ弧はスラーといい、タイとは別の記号である（2 つの音をなめらかにつないで演奏する）。")
F["e16_tie"] = _f16_tie()


# 3 連符: 1 拍を 3 等分する
def _f16_triplet():
    o = []
    s = 8
    x0, u = 196, 200
    rows = [("8 分音符", 2, "1 拍に 2 つ", "1/2 拍", INK),
            ("3 連符", 3, "1 拍に 3 つ", "1/3 拍", SIG),
            ("16 分音符", 4, "1 拍に 4 つ", "1/4 拍", INK)]
    y0, dy = 40, 92
    o += _f16_beatgrid(x0, 24, y0 + 3 * dy - 20, 2, u, ly=18)
    o.append(T(x0 - 8, 18, "拍", "end", 10, MUT))
    for r, (nm, n, sub, lb, col) in enumerate(rows):
        yt = y0 + r * dy
        dur = "16th" if n == 4 else "eighth"
        its = []
        for k in range(2 * n):
            its.append(dict(x=x0 - 130 + k * u / n + 8, notes=["A4"], dur=dur, beam=k // n, stem="up", fill=col))
        o.append(STAFF(130, yt + 10, 2 * u + 76, s=s, clef="treble", items=its))
        o.append(T(16, yt + 30, nm, "start", 12.5, col, True))
        o.append(T(16, yt + 47, sub, "start", 10.5, MUT))
        if n == 3:
            yA = yt + 10 + 4 * s - 3 * s / 2
            for k in range(2):
                xa = 130 + x0 - 130 + k * u + 8 + 0.64 * s - 0.06 * s
                xb = xa + 2 * u / 3
                o += _f16_tuplet(xa, xb, yA - 3.3 * s - 16, "3", SIG)
        # 鳴り始めの点
        yl = yt + 10 + 4 * s + 18
        o.append(W(x0, yl, x0 + 2 * u, yl, c=LIN, lw=1))
        for k in range(2 * n):
            o.append(CIRC(x0 + k * u / n, yl, 4, col, 1.2, col))
        o.append(T(x0 + 2 * u + 14, yt + 34, lb, "start", 12, col, True))
    return SVG(712, y0 + 3 * dy - 6, o, "1 拍を 2 等分すると 8 分音符、4 等分すると 16 分音符になる。3 等分した長さには決まった音符が無いので、"
               "8 分音符 3 つを「3」の印でまとめた 3 連符で書く。点は音の鳴り始め。")
F["e16_triplet"] = _f16_triplet()


# ======================= 3. 拍子 =======================

def _f16_dots(x0, y, u, kinds, lab=True, sz=10.5):
    """拍の強さの丸。kinds は "強" "中強" "弱" の列（1 拍ずつ u の間隔）"""
    o = []
    R = {"強": 11, "中強": 8.5, "弱": 5.5}
    for k, kd in enumerate(kinds):
        c = _f16_STR[kd]
        o.append(CIRC(x0 + k * u, y, R[kd], c, 1.4, c))
        if lab:
            o.append(T(x0 + k * u, y + 26, kd, "middle", sz, c, True))
    return o


# 同じ間隔の拍を、2 つずつ・3 つずつまとめて聞く
def _f16_group():
    o = []
    x0, u = 150, 44
    rows = [("強弱を付けない", ["弱"] * 12, None),
            ("2 つずつまとめる", ["強", "弱"] * 6, 2),
            ("3 つずつまとめる", ["強", "弱", "弱"] * 4, 3)]
    for r, (title, kinds, g) in enumerate(rows):
        y = 40 + r * 74
        o.append(T(x0 - 26, y + 5, title, "end", 12, INK, True))
        o += _f16_dots(x0, y, u, kinds, lab=bool(g))
        if g:
            for k in range(0, 12, g):
                o += _f16_brack(x0 + k * u - 12, x0 + (k + g - 1) * u + 12, y - 18, "", MUT)
    return SVG(712, 236, o, "同じ間隔の拍でも、ところどころを強めると、まとまりに区切って聞こえる。まとまりの最初の拍が強拍（赤い大きな丸）、残りが弱拍である。")
F["e16_group"] = _f16_group()


# 小節・小節線・拍子記号・終止線
def _f16_measure():
    o = []
    s = 10
    st = staff_start(s, 0, "4/4")
    u = 40
    G = 22
    mel = [("C5", 1), ("E5", 1), ("G5", 1), ("E5", 1), ("F5", 2), ("D5", 2), ("C5", 4)]
    its = []
    t = 0
    bars = []
    X = lambda b: st + 6 + b * u + (b // 4) * G
    for n, d in mel:
        dur = {1: "quarter", 2: "half", 4: "whole"}[d]
        its.append(dict(x=X(t), notes=[n], dur=dur))
        t += d
        if t % 4 == 0:
            bars.append(X(t) - G / 2 - 8)
    bars[-1] = X(12) - G - 2
    for k, bx in enumerate(bars):
        its.append(dict(x=bx, bar=True if k < 2 else "end"))
    xL, ytop = 30, 62
    o.append(STAFF(xL, ytop, bars[-1] + 4, s=s, clef="treble", items=its, time="4/4"))
    # 拍の番号
    t = 0
    for n, d in mel:
        for k in range(d):
            o.append(T(xL + X(t + k), ytop + 4 * s + 26, str((t + k) % 4 + 1), "middle", 10.5, MUT if k else INK, not k))
        t += d
    # 小節のかっこ
    lefts = [st - 4] + [bx + 6 for bx in bars[:-1]]
    for k in range(3):
        o += _f16_brack(xL + lefts[k], xL + bars[k] - (6 if k < 2 else 8), ytop - 30, "%d 小節目" % (k + 1), BLU)
    # 注記
    tx_ = xL + 4.0 * s + 1.3 * s
    o.append(W(tx_, ytop + 4 * s + 4, tx_, ytop + 4 * s + 50, c=SIG, lw=1))
    o.append(T(tx_ - 6, ytop + 4 * s + 64, "拍子記号", "start", 11.5, SIG, True))
    for k, nm in [(0, "小節線"), (2, "終止線")]:
        bx = xL + bars[k] - (3 if k == 2 else 0)
        o.append(W(bx, ytop + 4 * s + 34, bx, ytop + 4 * s + 50, c=SIG, lw=1))
        o.append(T(bx, ytop + 4 * s + 64, nm, "middle", 11.5, SIG, True))
    o.append(T(xL - 4, ytop + 4 * s + 26, "拍", "end", 10, MUT))
    return SVG(712, ytop + 4 * s + 76, o, "4 分の 4 拍子の楽譜。小節線で区切られた 1 つ 1 つが小節で、どの小節にも 4 分音符 4 つ分（4 拍）が入る。"
               "2 分音符や全音符の中でも拍は続いて数える（灰色の数字）。曲の終わりは終止線で閉じる。")
F["e16_bar"] = _f16_measure()


# 2 拍子・3 拍子・4 拍子の強弱
def _f16_meters():
    o = []
    s = 8
    rows = [("2/4", ["強", "弱"], "2 拍子（2/4）"),
            ("3/4", ["強", "弱", "弱"], "3 拍子（3/4）"),
            ("4/4", ["強", "弱", "中強", "弱"], "4 拍子（4/4）")]
    u, G = 50, 26
    y0, dy = 20, 100
    for r, (tm, kinds, title) in enumerate(rows):
        yt = y0 + r * dy + 14
        n = len(kinds)
        st = staff_start(s, 0, tm)
        its, cx = [], []
        for b in range(2):
            for k in range(n):
                x = st + 4 + (b * n + k) * u + b * G
                its.append(dict(x=x, notes=["A4"], dur="quarter"))
                cx.append(x)
            its.append(dict(x=st + 4 + (b + 1) * n * u + b * G - u / 2 + 4, bar=True if b == 0 else "end"))
        xL = 150
        o.append(STAFF(xL, yt, st + 2 * n * u + G + 4, s=s, clef="treble", items=its, time=tm))
        o.append(T(16, yt + 2 * s + 4, title, "start", 12, INK, True))
        for b in range(2):
            o += _f16_dots(xL + cx[b * n], yt + 4 * s + 26, u, kinds, lab=True, sz=10)
    return SVG(712, y0 + 3 * dy + 20, o, "2 拍子は「強・弱」、3 拍子は「強・弱・弱」、4 拍子は「強・弱・中強・弱」を 1 小節として繰り返す。"
               "4 拍子の 3 拍目（中強拍）は、1 拍目ほどではないが、弱拍よりは区切りに感じられる拍である。")
F["e16_meters"] = _f16_meters()


# 3/4 と 6/8: どちらも 1 小節に 8 分音符 6 つ。まとめ方が違う
def _f16_compound():
    o = []
    s = 8
    u = 34            # 8 分音符 1 つの幅
    rows = [("3/4", 2, ["強", "弱", "弱"], "3 拍子（3/4）", "1 拍 = 4 分音符（8 分音符 2 つ）", "1 小節 = 3 拍"),
            ("6/8", 3, ["強", "中強"], "6/8 拍子", "1 拍 = 付点 4 分音符（8 分音符 3 つ）", "1 小節 = 2 拍")]
    xL = 112
    for r, (tm, g, kinds, title, l1, l2) in enumerate(rows):
        yt = 28 + r * 150
        st = staff_start(s, 0, tm)
        its = []
        xs = []
        for b in range(2):
            for k in range(6):
                x = st + 6 + (b * 6 + k) * u + b * 20
                its.append(dict(x=x, notes=["A4"], dur="eighth", beam=b * 10 + k // g, stem="up"))
                xs.append(x)
            its.append(dict(x=st + 6 + (b + 1) * 6 * u + b * 20 - u / 2 + 3, bar=True if b == 0 else "end"))
        o.append(STAFF(xL, yt, st + 12 * u + 26, s=s, clef="treble", items=its, time=tm))
        o.append(T(16, yt + 2 * s + 4, title, "start", 12, INK, True))
        yc = yt + 4 * s + 22
        for b in range(2):
            for k in range(6):
                x = xL + xs[b * 6 + k]
                if k % g == 0:
                    kd = kinds[k // g]
                    rr = {"強": 11, "中強": 8.5, "弱": 5.5}[kd]
                    o.append(CIRC(x, yc, rr, _f16_STR[kd], 1.4, _f16_STR[kd]))
                    o.append(T(x, yc + 26, kd, "middle", 10, _f16_STR[kd], True))
                else:
                    o.append(CIRC(x, yc, 2.6, MUT, 1, MUT))
        o.append(T(16, yc + 4, "拍", "start", 10.5, MUT))
        o.append(T(xL + xs[0] - 8, yc + 50, l1, "start", 11, INK, True))
        o.append(T(xL + xs[0] + 300, yc + 50, l2, "start", 11, SIG, True))
    return SVG(712, 28 + 2 * 150 - 12, o, "3/4 と 6/8 は、どちらも 1 小節に 8 分音符が 6 つ入る（長さは同じ）。3/4 は 2 つずつ 3 組（3 拍）、"
               "6/8 は 3 つずつ 2 組（2 拍）にまとめる。連桁のつなぎ方も、このまとまりに合わせる。小さい点は、拍を分けた残りの 8 分音符。")
F["e16_compound"] = _f16_compound()


# 弱起: 弱拍から始まり、最後の小節で残りの拍を補う
_f16_ANA = [("G4", 1), ("C5", 2), ("E5", 1), ("D5", 1), ("C5", 1), ("B4", 1), ("A4", 1), ("G4", 1), ("C5", 3)]

def _f16_anacrusis():
    o = []
    s = 10
    st = staff_start(s, 0, "4/4")
    u, G = 42, 26
    starts = [3]                      # 4 拍目から始まる
    t = 3
    for n, d in _f16_ANA[1:]:
        starts.append(t + 1 if t == 3 else starts[-1] + _f16_ANA[len(starts) - 1][1])
    # 拍の位置（4 拍目 = 3 から数え、絶対の拍数）
    pos = []
    t = 3
    for n, d in _f16_ANA:
        pos.append(t); t += d
    end = t                            # 15
    X = lambda b: st + 8 + (b - 3) * u + ((b // 4)) * G
    its = []
    for (n, d), b in zip(_f16_ANA, pos):
        its.append(dict(x=X(b), notes=[n], dur={1: "quarter", 2: "half", 3: "half"}[d], dot=(d == 3)))
    barx = [X(4) - G / 2 - u / 2 + 6, X(8) - G / 2 - u / 2 + 6, X(12) - G / 2 - u / 2 + 6]
    for bx in barx:
        its.append(dict(x=bx, bar=True))
    xe = X(14) + u + 10
    its.append(dict(x=xe, bar="end"))
    xL, ytop = 24, 64
    o.append(STAFF(xL, ytop, xe + 4, s=s, clef="treble", items=its, time="4/4"))
    for (n, d), b in zip(_f16_ANA, pos):
        for k in range(d):
            o.append(T(xL + X(b) + k * u, ytop + 4 * s + 24, str((b + k) % 4 + 1), "middle", 10.5, MUT if k else INK, not k))
    o.append(T(xL + 4, ytop + 4 * s + 24, "拍", "start", 10, MUT))
    o += _f16_brack(xL + X(3) - 14, xL + barx[0] - 6, ytop - 22, "1 拍だけ", SIG)
    o += _f16_brack(xL + barx[2] + 6, xL + xe - 10, ytop - 22, "3 拍", SIG)
    o.append(T(xL + (X(3) + barx[0]) / 2 - 4, ytop + 4 * s + 50, "弱起（4 拍目から始まる）", "middle", 11, SIG, True))
    o.append(T(xL + (barx[2] + xe) / 2, ytop + 4 * s + 50, "最後の小節で残りを補う", "middle", 11, SIG, True))
    return SVG(712, ytop + 4 * s + 62, o, "弱起の例（4 分の 4 拍子）。最初の小節は 4 拍目の 1 拍だけで始まり、最後の小節は 3 拍で終わる。最初と最後を合わせると、ちょうど 1 小節分（4 拍）になる。")
F["e16_anacrusis"] = _f16_anacrusis()


# ---------- 音の列 → 五線（再生カードと同じ区切り方: 小節線で分け、書ける音価に分けてタイでつなぐ） ----------
_f16_VALS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25]
_f16_DD = {4: ("whole", False), 3: ("half", True), 2: ("half", False), 1.5: ("quarter", True), 1: ("quarter", False),
           0.75: ("eighth", True), 0.5: ("eighth", False), 0.375: ("16th", True), 0.25: ("16th", False)}

def _f16_pieces(b0, beats, barB):
    out, bq, end = [], b0, b0 + beats
    while bq < end - 1e-9:
        be = (math.floor(bq / barB + 1e-9) + 1) * barB
        ln = min(end, be) - bq
        while ln > 1e-9:
            v = next(x for x in _f16_VALS if x <= ln + 1e-9)
            out.append((bq, v)); bq += v; ln -= v
    return out

def _f16_seq(seq):
    """[("C5", 1), ("r", 0.5), …] → [(拍の位置, 音名 or None, 拍数)]"""
    t, out = 0.0, []
    for n, d in seq:
        out.append((t, None if n == "r" else n, d)); t += d
    return out

def _f16_seqstaff(xL, ytop, seq, time="4/4", s=9, u=32, G=20, fill=INK, fills=None, start=0.0, w=None, clef="treble"):
    """音の列を五線に書く。返り値 (svg, X(拍)→x, 全体の拍数)。fills: {音の番号: 色}"""
    a, b = time.split("/")
    barB = int(a) * 4.0 / int(b)
    grp = 1.5 if (b == "8" and int(a) % 3 == 0 and int(a) > 3) else 1.0
    st = staff_start(s, 0, time)
    X = lambda q: st + 6 + (q - start) * u + math.floor((q - start) / barB + 1e-9) * G
    its = []
    ev = _f16_seq(seq)
    total = sum(d for n, d in seq)
    for i, (t0, n, d) in enumerate(ev):
        col = (fills or {}).get(i, fill)
        ps = _f16_pieces(t0, d, barB)
        for j, (q, v) in enumerate(ps):
            dur, dot = _f16_DD[v]
            it = dict(x=X(q), dur=dur, dot=dot, fill=col)
            if n is None:
                it["rest"] = True
            else:
                it["notes"] = [n]
                if dur in ("eighth", "16th"):
                    it["beam"] = "%d" % math.floor(q / grp + 1e-9)
                if j < len(ps) - 1:
                    it["tie"] = True
            its.append(it)
    nb = int(math.ceil(total / barB - 1e-9))
    xend = X(nb * barB) - G + 4          # 最後の音の時間の終わり
    for k in range(1, nb + 1):
        its.append(dict(x=X(k * barB) - G / 2 - 4 if k < nb else xend, bar=True if k < nb else "end"))
    its.sort(key=lambda it: it["x"])
    width = w or (xend + 2)
    return STAFF(xL, ytop, width, s=s, clef=clef, items=its, time=time), (lambda q: xL + X(q)), total


# ======================= 4. シンコペーション =======================

# 表拍と裏拍
def _f16_offbeat():
    o = []
    s = 9
    seq = [("A4", 0.5)] * 8
    svg, X, tot = _f16_seqstaff(70, 34, seq, "4/4", s=s, u=62, fills={i: (SIG if i % 2 else INK) for i in range(8)})
    o.append(svg)
    yl = 34 + 4 * s + 30
    for i in range(8):
        x = X(i * 0.5)
        o.append(T(x, yl, str(i // 2 + 1) if i % 2 == 0 else "と", "middle", 12, SIG if i % 2 else INK, True))
        o.append(T(x, yl + 20, "裏拍" if i % 2 else "表拍", "middle", 10.5, SIG if i % 2 else MUT, i % 2 == 1))
    o.append(T(70, yl, "数え方", "end", 10, MUT))
    return SVG(660, yl + 34, o, "4 分の 4 拍子の 1 小節を 8 分音符 8 つに分けた。拍の頭の音（黒）が表拍、拍と拍のちょうど真ん中の音（赤）が裏拍である。"
               "数えるときは、裏拍を「と」と数えることが多い。")
F["e16_offbeat"] = _f16_offbeat()


_f16_SYNC = [
    ("シンコペーションなし", [("C5", 1), ("E5", 1), ("G5", 1), ("E5", 1), ("F5", 1), ("D5", 1), ("C5", 2)]),
    ("裏拍から次の拍へつなぐ", [("C5", 1), ("E5", 0.5), ("G5", 1.5), ("E5", 0.5), ("F5", 1.5), ("D5", 1), ("C5", 2)]),
    ("強拍を休む", [("C5", 1), ("E5", 1), ("r", 0.5), ("G5", 0.5), ("E5", 1), ("r", 0.5), ("F5", 0.5), ("D5", 1), ("C5", 2)]),
]

def _f16_onsets(X, y, seq, total, lab=True):
    """時間の格子: 8 分音符ごとの目盛、強拍・中強拍（1・3 拍目）の丸、音の鳴り始めの点"""
    o = []
    ons = set()
    t = 0.0
    for n, d in seq:
        if n != "r":
            ons.add(round(t * 2))
        t += d
    o.append(W(X(0) - 8, y, X(total - 0.5) + 16, y, c=LIN, lw=1.2))
    for k in range(int(total * 2)):
        q = k / 2.0
        x = X(q)
        if k % 2 == 0:
            o.append(W(x, y - 6, x, y + 6, c=MUT, lw=1))
        strong = (k % 8) in (0, 4)
        if strong:
            hit = k in ons
            o.append(CIRC(x, y, 9, INK, 1.6, "none"))
        if k in ons:
            off = k % 2 == 1
            o.append(CIRC(x, y, 4.5, SIG if off else INK, 1.2, SIG if off else INK))
    return o

def _f16_sync():
    o = []
    s = 8
    y0, dy = 14, 142
    for r, (title, seq) in enumerate(_f16_SYNC):
        yt = y0 + r * dy
        fills = {}
        t = 0.0
        for i, (n, d) in enumerate(seq):
            if n != "r" and abs(t * 2 - round(t * 2)) < 1e-9 and round(t * 2) % 2 == 1:
                fills[i] = SIG
            t += d
        svg, X, tot = _f16_seqstaff(110, yt + 32, seq, "4/4", s=s, u=56, fills=fills)
        o.append(svg)
        o.append(T(16, yt + 10, "(%s) %s" % ("abc"[r], title), "start", 12, INK, True))
        o += _f16_onsets(X, yt + 32 + 4 * s + 30, seq, tot)
        o.append(T(104, yt + 32 + 4 * s + 34, "時間", "end", 10, MUT))
    yl = y0 + 3 * dy - 4
    o.append(CIRC(30, yl, 9, INK, 1.6, "none"))
    o.append(T(46, yl + 4, "強拍・中強拍（1・3 拍目）", "start", 10.5, INK))
    o.append(CIRC(236, yl, 4.5, INK, 1.2, INK))
    o.append(T(248, yl + 4, "表拍で鳴り始める音", "start", 10.5, INK))
    o.append(CIRC(400, yl, 4.5, SIG, 1.2, SIG))
    o.append(T(412, yl + 4, "裏拍で鳴り始める音", "start", 10.5, SIG, True))
    return SVG(712, yl + 16, o, "(a) では、どの強拍でも新しい音が鳴り始める。(b) では、3 拍目と次の小節の 1 拍目の音を半拍早く裏拍から鳴らし、そのまま強拍の上へ伸ばす（小節線をまたぐ所はタイでつなぐ）。"
               "(c) では、強拍を 8 分休符で休み、半拍遅れて裏拍から鳴らす。(b)・(c) では、空の丸（新しい音が鳴り始めない強拍・中強拍）が現れる。")
F["e16_sync"] = _f16_sync()


# ======================= 5. リズムパターン =======================

# ドラムの 3 つの音の書き方
def _f16_drumkey():
    o = []
    s = 11
    its = [dict(x=96, notes=["%kick"], dur="quarter", stem="up"),
           dict(x=186, notes=["%snare"], dur="quarter", stem="up"),
           dict(x=276, notes=["%hat"], dur="quarter", stem="up")]
    ytop = 54
    o.append(STAFF(20, ytop, 320, s=s, clef="perc", items=its))
    rows = [("%hat", "ハイハット", "×の符頭。五線のすぐ上", "「チッ」と短く鳴る 2 枚の金属の板"),
            ("%snare", "スネア", "第 3 間", "「タン」と鋭く響く太鼓"),
            ("%kick", "バスドラム", "第 1 間", "足で踏んで鳴らす低い大きな太鼓")]
    for k, (pc, nm, pos, desc) in enumerate(rows):
        y = 40 + k * 44
        c = _f16_KIT[pc]
        o.append(T(380, y, nm, "start", 12.5, c, True))
        o.append(T(470, y, pos, "start", 10.5, MUT))
        o.append(T(380, y + 17, desc, "start", 10.5, INK))
    for k, (x, nm) in enumerate([(96, "バスドラム"), (186, "スネア"), (276, "ハイハット")]):
        o.append(T(20 + x, ytop + 4 * s + 34, nm, "middle", 11, _f16_KIT[["%kick", "%snare", "%hat"][k]], True))
    o.append(T(20 + 1.9 * s, ytop + 4 * s + 34, "", "middle", 10, MUT))
    return SVG(712, 164, o, "ドラムの楽譜では、五線の位置が高さではなく楽器を表す。左端の 2 本の太い縦線は、打楽器の楽譜であることを示す記号である。"
               "ここで使う 3 つの音の位置は一般的な書き方の 1 つで、楽譜によって違うこともある。")
F["e16_drumkey"] = _f16_drumkey()


def _f16_drumitems(pat, X0, cu, fills=None):
    """16 ステップのパターン {楽器: [ステップ…]} を、1 声部（符幹は上向き）の五線の要素にする"""
    its = []
    for k in range(4):
        on = [j for j in range(4) if any(4 * k + j in st_ for st_ in pat.values())]
        if not on:
            its.append(dict(x=X0 + 4 * k * cu, rest=True, dur="quarter"))
            continue
        if on[0] > 0:
            v = on[0] / 4.0
            dur, dot = _f16_DD[v]
            its.append(dict(x=X0 + 4 * k * cu, rest=True, dur=dur, dot=dot))
        for i, j in enumerate(on):
            nx = on[i + 1] if i + 1 < len(on) else 4
            dur, dot = _f16_DD[(nx - j) / 4.0]
            ns = [p for p in ("%kick", "%snare", "%hat") if 4 * k + j in pat.get(p, [])]
            it = dict(x=X0 + (4 * k + j) * cu, notes=ns, dur=dur, dot=dot, stem="up")
            if dur in ("eighth", "16th"):
                it["beam"] = k
            if fills:
                it["fills"] = {p: fills[p] for p in ns if p in fills}
            its.append(it)
    return its


def _f16_drumgrid(x, y, pat, cw=22, ch=22, hl=None):
    """16 ステップの格子。hl: {楽器: [強調するステップ]}"""
    o = []
    rows = ["%hat", "%snare", "%kick"]
    for j in range(16):
        lab = str(j // 4 + 1) if j % 4 == 0 else ("と" if j % 4 == 2 else "")
        o.append(T(x + j * cw + cw / 2, y - 7, lab, "middle", 10.5, INK if j % 4 == 0 else MUT, j % 4 == 0))
    for r, p in enumerate(rows):
        c = _f16_KIT[p]
        o.append(T(x - 8, y + r * ch + ch / 2 + 4, _f16_KITNAME[p], "end", 11, c, True))
        for j in range(16):
            on = j in pat.get(p, [])
            strong = hl and j in hl.get(p, [])
            o.append(RECT(x + j * cw + 2, y + r * ch + 2, cw - 4, ch - 4, 4, c if on else PAN, c if on else LIN, 2.4 if strong else 1))
    for k in range(5):
        xx = x + 4 * k * cw
        o.append(W(xx, y - 2, xx, y + 3 * ch + 2, c=MUT, lw=1.3))
    return o


_f16_P8 = {"%hat": list(range(0, 16, 2)), "%snare": [4, 12], "%kick": [0, 8, 10]}
_f16_P16 = {"%hat": list(range(16)), "%snare": [4, 12], "%kick": [0, 8, 10]}

def _f16_beatfig(pat, cap, hlsnare=True):
    o = []
    gx, gy = 110, 30
    o += _f16_drumgrid(gx, gy, pat, 22, 22, hl={"%snare": [4, 12]} if hlsnare else None)
    if hlsnare:
        for j in (4, 12):
            o.append(T(gx + j * 22 + 11, gy + 3 * 22 + 16, "↑", "middle", 11, SIG, True))
        o.append(T(gx + 16 * 22 + 12, gy + 3 * 22 + 16, "← 2・4 拍目のスネア（バックビート）", "start", 10.5, SIG, True))
    s = 8
    st = staff_start(s, 0, "4/4")
    cu = 22
    xL = gx + 11 - st - 4
    its = _f16_drumitems(pat, st + 4, cu, fills=None)
    its.append(dict(x=st + 4 + 16 * cu - 4, bar="end"))
    ytop = gy + 3 * 22 + 56
    for k in range(5):
        xx = gx + 4 * k * cu
        o.append(W(xx, gy + 3 * 22 + 4, xx, ytop + 4 * s + 6, c=LIN, lw=1, dash="3,3"))
    o.append(STAFF(xL, ytop, st + 16 * cu + 2, s=s, clef="perc", items=its, time="4/4"))
    return SVG(712, ytop + 4 * s + 26, o, cap)

F["e16_8beat"] = _f16_beatfig(_f16_P8, "8 ビートの例。上の格子は 1 小節を 16 分音符 16 個に区切ったもので、塗った所で音が鳴る。ハイハットが 8 分音符を 8 回刻み、"
                              "バスドラムが 1 拍目と 3 拍目（と 3 拍目の裏拍）、スネアが 2 拍目と 4 拍目を受け持つ。下は同じものを楽譜で書いたもの（音の長さは次の音までの長さで書く）。")
F["e16_16beat"] = _f16_beatfig(_f16_P16, "16 ビートの例。ハイハットが 16 分音符を 16 回刻む。スネアとバスドラムは 8 ビートの例と同じ。", hlsnare=False)


# シャッフル: 8 分音符を 2:1 で弾く
def _f16_shuffle():
    o = []
    x0, u = 300, 170
    rows = [("ストレート", "1:1", [0, 0.5], INK), ("シャッフル", "2:1", [0, 2 / 3.0], SIG)]
    y0, dy = 50, 110
    o += _f16_beatgrid(x0, 28, y0 + 2 * dy - 30, 2, u, ly=20)
    o.append(T(x0 - 8, 20, "拍", "end", 10, MUT))
    s = 8
    for r, (nm, ratio, pos, col) in enumerate(rows):
        y = y0 + r * dy
        o.append(T(16, y + 12, nm, "start", 13, col, True))
        o.append(T(16, y + 30, "長さの比 " + ratio, "start", 10.5, MUT))
        # 1 拍分の書き方
        if r == 0:
            its = [dict(x=52, notes=["A4"], dur="eighth", beam=0, stem="up", fill=col), dict(x=82, notes=["A4"], dur="eighth", beam=0, stem="up", fill=col)]
        else:
            its = [dict(x=52, notes=["A4"], dur="quarter", stem="up", fill=col), dict(x=88, notes=["A4"], dur="eighth", stem="up", fill=col)]
        yt = y - 6
        o.append(STAFF(156, yt, 118, s=s, clef="treble", items=its))
        if r == 1:
            xa = 156 + 52 + 0.58 * s
            o += _f16_tuplet(xa, 156 + 88 + 0.58 * s, yt + 4 * s - 1.5 * s - 3.4 * s - 14, "3", col)
            for k in range(2):
                for q in (1 / 3.0, 2 / 3.0):
                    o.append(W(x0 + (k + q) * u, y - 4, x0 + (k + q) * u, y + 30, c=SIG, lw=0.9, dash="2,3"))
                xs_ = x0 + (k + 0.5) * u
                o.append(W(xs_, y - 4, xs_, y + 44, c=MUT, lw=1, dash="1,3"))
                o.append(ARR(xs_, y + 40, x0 + (k + 2 / 3.0) * u - 1, y + 40, SIG, 1.3, 5))
            o.append(T(x0 + u / 3, y - 8, "1/3", "middle", 9.5, SIG))
            o.append(T(x0 + 2 * u / 3, y - 8, "2/3", "middle", 9.5, SIG))
            o.append(T(x0, y + 64, "点線（ストレートの裏拍の位置）から、1/2 → 2/3 拍へ 1/6 拍遅れる", "start", 10.5, SIG, True))
        for k in range(2):
            a = x0 + k * u
            L1 = pos[1] * u
            o += _f16_bar(a + 2, y + 8, L1 - 4, 16, col, SSOFT if r else PAN, "長" if r else "", col, 10)
            o += _f16_bar(a + L1 + 2, y + 8, u - L1 - 4, 16, col, SSOFT if r else PAN, "短" if r else "", col, 10)
            for q in pos:
                o.append('<path d="M%g,%g l-5,-8 l10,0Z" fill="%s"/>' % (a + q * u, y + 5, col))
    return SVG(712, y0 + dy + 76, o, "ストレート（上）は 1 拍を 2 等分する。シャッフル（下）は 1 拍を 3 等分した目盛（赤い破線）のうち 1 つ目と 3 つ目で鳴らすので、"
               "前の音が後ろの音の 2 倍の長さになる。楽譜では、3 連符の 4 分音符と 8 分音符で書ける（左）。▼ は音の鳴り始め。")
F["e16_shuffle"] = _f16_shuffle()
