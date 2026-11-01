# -*- coding: utf-8 -*-
# 02 章 電源の種類と性質 の図

# ---- 補助: 記号・回路の部品 ----
def _f02_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。例 [("R", "in", True)]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s">' % (round(x0, 2), y, sz, c, "700" if b else "400")]
    for s, sub, it in parts:
        o.append('<tspan font-style="%s">%s</tspan>' % ("italic" if it else "normal", E(s)))
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan><tspan dy="-3"></tspan>' % (sz * 0.72, E(sub)))
    o.append("</text>")
    return "".join(o)

def _f02_resh(x1, x2, y, c=INK, lw=1.5, h=6, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f02_resv(x, y1, y2, c=INK, lw=1.5, h=6, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f02_src(x, y, r=16, c=GLD, var=False):
    """電圧の源（丸に + と −）。var=True で、値が変わることを斜めの矢印で示す。"""
    o = [CIRC(x, y, r, c=c, lw=1.6, fill=PAN), T(x, y - r * 0.18, "+", "middle", 11, c, True), T(x, y + r * 0.72, "−", "middle", 11, c, True)]
    if var:
        o.append(ARR(x - r - 5, y + r + 5, x + r + 6, y - r - 6, c=c, lw=1.2, head=6))
    return "".join(o)

def _f02_gnd(x, y, c=MUT):
    """大地（車体）の記号。y は線の上端。"""
    return (W(x, y, x, y + 7, c=c, lw=1.4) + W(x - 9, y + 7, x + 9, y + 7, c=c, lw=1.6)
            + W(x - 6, y + 11, x + 6, y + 11, c=c, lw=1.4) + W(x - 3, y + 15, x + 3, y + 15, c=c, lw=1.2))

def _f02_diode(x, y, c=INK, s=9):
    """右向き（左から右へ電流を通す）のダイオード。(x, y) は三角の先。"""
    return (PL([(x - 1.6 * s, y - s), (x - 1.6 * s, y + s), (x, y)], c=c, lw=1.4, fill=soft(c))
            + W(x, y - s, x, y + s, c=c, lw=1.8))

def _f02_coil(x, y, n=4, r=7, c=GLD, side=1):
    """縦向きのコイル（上から下へ）。side=1 で右へふくらむ。"""
    d = "M%g,%g" % (x, y)
    for i in range(n):
        d += " a%g,%g 0 0 %d 0,%g" % (r, r, 1 if side > 0 else 0, 2 * r)
    return PATH(d, c=c, lw=1.5)

def _f02_cellv(x, y, c=GLD):
    """縦向きの電池の記号（上がプラス）。(x, y) は中心。"""
    return W(x - 14, y - 4, x + 14, y - 4, c=c, lw=1.8) + W(x - 7, y + 4, x + 7, y + 4, c=c, lw=3.2)

# ---- 1 節: 物差し ----
def _f02_model():
    o = []
    o.append(RECT(16, 52, 446, 208, 10, "none", GLD, 1.3, dash="5 4"))
    o.append(T(28, 72, "電源（機器から見た模型）", "start", 11, GLD, True))
    yt, yb, xs = 120, 214, 72
    o.append(W(xs, yt, xs, 149, c=INK, lw=1.5) + W(xs, 185, xs, yb, c=INK, lw=1.5))
    o.append(_f02_src(xs, 167, 18, GLD, var=True))
    o.append(_f02_m(104, 172, [("E", None, True)], "start", 13, GLD, True))
    o.append(W(xs, yt, 120, yt, c=INK, lw=1.5))
    o.append(CIRC(130, yt, 10, c=TEA, lw=1.5, fill=PAN) + T(130, yt + 4.5, "~", "middle", 13, TEA, True))
    o.append(W(140, yt, 168, yt, c=INK, lw=1.5))
    o.append(_f02_resh(168, 228, yt, c=INK))
    o.append(_f02_m(198, yt + 26, [("R", "in", True)], "middle", 12, INK))
    o.append(W(228, yt, 252, yt, c=INK, lw=1.5))
    o.append(RECT(252, yt - 12, 50, 24, 4, GOSOFT, GLD, 1.3) + T(277, yt + 4, "上限", "middle", 10, GLD, True))
    o.append(W(302, yt, 326, yt, c=INK, lw=1.5))
    o.append(D(326, yt, INK, 2.8) + W(326, yt, 354, yt - 15, c=INK, lw=1.8) + D(362, yt, INK, 2.8))
    o.append(W(362, yt, 440, yt, c=INK, lw=1.5) + W(xs, yb, 440, yb, c=INK, lw=1.5))
    o.append(CIRC(444, yt, 4, c=INK, lw=1.4, fill=PAN) + CIRC(444, yb, 4, c=INK, lw=1.4, fill=PAN))
    # 絶縁: 大地や商用電源とつながっているか
    o.append(W(210, yb, 210, 280, c=MUT, lw=1.2, dash="4 3") + _f02_gnd(210, 280))
    o.append(T(224, 290, "⑤ 大地・商用電源とつながっているか", "start", 10, MUT))
    # 番号
    for x, y, s in ((38, 172, "①"), (130, 98, "⑥"), (198, 98, "②"), (277, 98, "③"), (344, 96, "④")):
        o.append(T(x, y, s, "middle", 12, INK, True))
    # 機器
    o.append(W(448, yt, 520, yt, c=GLD, lw=1.8) + W(448, yb, 520, yb, c=GLD, lw=1.8))
    o.append(RECT(520, 92, 164, 150, 10, PAN, LIN, 1.3) + T(602, 112, "機器", "middle", 11.5, INK, True))
    o.append(BOX(536, 122, 132, 40, "マイコン", None, SIG, SSOFT, SIG, sz=11))
    o.append(BOX(536, 178, 132, 40, "負荷", None, PUR, PSOFT, PUR, sz=11))
    o.append(ARR(456, 106, 508, 106, c=GLD, lw=1.6))
    o.append(_f02_m(482, 98, [("I", None, True)], "middle", 12, GLD, True))
    o.append(_f02_m(482, 166, [("V", None, True)], "middle", 13, INK, True))
    o.append(T(482, 183, "端子電圧", "middle", 9.5, MUT))
    # 説明
    L = [("① 電圧の範囲: E が残量・温度・使われ方で変わる幅", "④ 途切れ方: 抜き差し・停電などで電圧が消える"),
         (None, "⑤ 絶縁: 商用電源や大地と導体でつながるか"),
         ("③ 取り出せる電流: 超えると保護が働く・規則に反する", "⑥ ノイズ: 電圧に乗る速い変動")]
    for i, (a, b) in enumerate(L):
        if a:
            o.append(T(20, 322 + i * 18, a, "start", 10, INK))
        else:
            o.append(_f02_m(20, 322 + i * 18, [("② 内部抵抗: 電流 ", None, False), ("I", None, True), (" で端子電圧 ", None, False), ("V", None, True),
                                               (" が ", None, False), ("I", None, True), (" × ", None, False), ("R", "in", True), (" 下がる", None, False)], "start", 10, INK))
        o.append(T(372, 322 + i * 18, b, "start", 10, INK))
    return SVG(700, 370, o, "電源を、機器から見た模型で表す。電圧の源（起電力 E）に、ノイズの源・内部抵抗・電流の上限・途切れるスイッチが直列に並ぶ。これに、大地や商用電源と導体でつながっているかどうか（絶縁）を加えると、6 つの物差しがそろう。")
F["e02_model"] = _f02_model()

def _f02_rin():
    o = []
    xs, yt, yb = 50, 80, 200
    o.append(W(xs, yt, xs, 133, c=INK, lw=1.5) + W(xs, 167, xs, yb, c=INK, lw=1.5))
    o.append(_f02_src(xs, 150, 17, GLD))
    o.append(_f02_m(24, 155, [("E", None, True)], "middle", 13, GLD, True))
    o.append(W(xs, yt, 84, yt, c=INK, lw=1.5) + _f02_resh(84, 144, yt, c=INK) + W(144, yt, 190, yt, c=INK, lw=1.5))
    o.append(_f02_m(114, yt + 26, [("R", "in", True)], "middle", 12, INK))
    o.append(_f02_m(114, yt - 30, [("I", None, True), (" × ", None, False), ("R", "in", True), (" だけ下がる", None, False)], "middle", 9.5, ALI))
    o.append(RECT(8, 60, 190, 160, 8, "none", GLD, 1.1, dash="4 3"))
    o.append(T(14, 236, "電源（模型）", "start", 9.5, GLD))
    o.append(CIRC(194, yt, 4, c=INK, lw=1.4, fill=PAN) + CIRC(194, yb, 4, c=INK, lw=1.4, fill=PAN))
    o.append(W(198, yt, 262, yt, c=INK, lw=1.5) + _f02_resv(262, yt, yb, c=PUR) + W(262, yb, 198, yb, c=INK, lw=1.5))
    o.append(W(190, yb, xs, yb, c=INK, lw=1.5))
    o.append(T(276, 145, "負荷", "start", 10, PUR, True))
    o.append(ARR(210, yt - 12, 250, yt - 12, c=GLD, lw=1.5) + _f02_m(230, yt - 18, [("I", None, True)], "middle", 12, GLD, True))
    o.append(_f02_m(222, 142, [("V", None, True)], "middle", 13, INK, True))
    o.append(T(222, 158, "端子電圧", "middle", 9, MUT))
    # 右: V-I の直線
    p = Plot(380, 24, 290, 190, (0, 200), (0, 3.5))
    o.append(p.axes(xl="電流 I [mA]", yl="端子電圧 V [V]", xt=[0, 50, 100, 150, 200], yt=[0, 1, 2, 3], yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 1.8), (200, 1.8)], c=ALI, lw=1.2, dash="5 4"))
    o.append(T(p.X(200) - 2, p.Y(1.8) - 6, "マイコンが動く最低の電圧（例 1.8 V）", "end", 9.5, ALI))
    o.append(p.line([(0, 3.1), (200, 3.1 - 0.2 * 0.3)], c=GRN, lw=2.2))
    o.append(p.line([(0, 3.0), (150, 0)], c=GLD, lw=2.2))
    o.append(T(p.X(200), p.Y(3.04) - 8, "内部抵抗 0.3 Ω（単 3 形 2 本の例）", "end", 9.5, GRN, True))
    o.append(T(p.X(62) + 8, 86, "内部抵抗 20 Ω（コイン形の例）", "start", 9.5, GLD, True))
    o.append(D(p.X(100), p.Y(3.07), GRN, 3.6) + T(p.X(100), p.Y(3.07) + 16, "100 mA で 3.07 V", "middle", 9.5, GRN))
    o.append(D(p.X(100), p.Y(1.0), GLD, 3.6) + T(p.X(100) + 8, p.Y(1.0) + 4, "100 mA で 1.0 V", "start", 9.5, GLD))
    o.append(D(p.X(60), p.Y(1.8), ALI, 3.6) + T(p.X(60) - 6, p.Y(1.8) + 16, "60 mA で 1.8 V", "end", 9.5, ALI))
    return SVG(700, 256, o, "左: 内部抵抗の模型。電流が流れると、内部抵抗の両端に（電流 × 内部抵抗）の電圧が現れ、端子電圧は起電力からその分だけ下がる。右: 内部抵抗の違う 2 つの電源の端子電圧（値は例）。直線の傾きが内部抵抗の大きさで、内部抵抗 20 Ω の電源は 60 mA で 1.8 V を割る。")
F["e02_rin"] = _f02_rin()

def _f02_iso():
    o = []
    # (a) 絶縁
    o.append(T(175, 18, "(a) 絶縁", "middle", 11.5, GRN, True))
    o.append(BOX(20, 56, 92, 100, "入力の側", "コンセントなど", GLD, GOSOFT, GLD, sz=11, ssz=9.5))
    o.append(BOX(230, 56, 100, 100, "出力の側", "機器の回路", SIG, SSOFT, SIG, sz=11, ssz=9.5))
    o.append(W(112, 76, 144, 76, c=GLD, lw=1.5) + W(112, 136, 144, 136, c=GLD, lw=1.5))
    o.append(_f02_coil(144, 78, 4, 7, GLD, 1))
    o.append(W(158, 70, 158, 142, c=MUT, lw=1.6) + W(164, 70, 164, 142, c=MUT, lw=1.6))
    o.append(_f02_coil(178, 78, 4, 7, SIG, -1))
    o.append(W(178, 76, 230, 76, c=SIG, lw=1.5) + W(178, 136, 230, 136, c=SIG, lw=1.5))
    o.append(W(144, 76, 144, 78, c=GLD, lw=1.5) + W(144, 134, 144, 136, c=GLD, lw=1.5))
    o.append(W(178, 76, 178, 78, c=SIG, lw=1.5) + W(178, 134, 178, 136, c=SIG, lw=1.5))
    o.append(W(161, 44, 161, 168, c=GRN, lw=1.4, dash="5 4"))
    o.append(T(161, 38, "絶縁の境界", "middle", 9.5, GRN, True))
    o.append(T(175, 188, "導体の道が無い。エネルギーは磁界で運ぶ", "middle", 10, GRN))
    # (b) 非絶縁
    o.append(T(530, 18, "(b) 非絶縁", "middle", 11.5, GLD, True))
    o.append(BOX(370, 56, 92, 100, "入力の側", None, GLD, GOSOFT, GLD, sz=11))
    o.append(BOX(500, 64, 70, 48, "電圧を", "変える回路", MUT, PAN, INK, sz=10, ssz=9.5))
    o.append(BOX(600, 56, 92, 100, "出力の側", "機器の回路", SIG, SSOFT, SIG, sz=11, ssz=9.5))
    o.append(W(462, 88, 500, 88, c=GLD, lw=1.5) + W(570, 88, 600, 88, c=SIG, lw=1.5))
    o.append(W(462, 136, 600, 136, c=ALI, lw=2.4))
    o.append(T(531, 130, "共通の線", "middle", 9.5, ALI, True))
    o.append(T(531, 188, "入力の側の電位が、出力の側に現れる", "middle", 10, ALI))
    return SVG(700, 204, o, "絶縁と非絶縁。(a) 絶縁した電源は、変圧器の磁界を通してエネルギーだけを運び、入力の側と出力の側の間に導体の道が無い。(b) 非絶縁の電源は、入力の側と出力の側が共通の線でつながるので、入力の側の電位が出力の側の回路に現れる。")
F["e02_iso"] = _f02_iso()

# ---- 2 節: 電池 ----
def _f02_batrange():
    o = []
    x0, x1, y0, rh = 200, 540, 54, 30
    X = lambda v: x0 + v / 5.0 * (x1 - x0)
    rows = [("コイン形リチウム 1 個", 2.0, 3.2, True), ("単 3 形アルカリ 2 本", 1.8, 3.2, True),
            ("単 3 形アルカリ 3 本", 2.7, 4.8, False), ("ニッケル水素 3 本", 3.0, 4.2, False),
            ("リチウムイオン 1 セル", 3.0, 4.2, False)]
    yb = y0 + len(rows) * rh
    o.append(RECT(X(1.8), y0 - 10, X(3.6) - X(1.8), yb - y0 + 12, 0, SSOFT, "none", 0))
    o.append(T((X(1.8) + X(3.6)) / 2, y0 - 16, "マイコンの動作の範囲（例 1.8〜3.6 V）", "middle", 9.5, SIG, True))
    for v in range(6):
        o.append(W(X(v), y0 - 6, X(v), yb + 2, c=GRD, lw=1))
        o.append(T(X(v), yb + 17, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, yb + 33, "電池の電圧 [V]（棒の左端が使い終わり、右端が新しいとき・満充電。代表値）", "middle", 9.5, MUT))
    o.append(W(X(3.4), y0 - 6, X(3.4), yb + 2, c=PUR, lw=1.3, dash="4 3"))
    o.append(T(x0, yb + 51, "紫の破線: 降圧のレギュレータで 3.3 V を保てる入力の下限（例 3.4 V）", "start", 9.5, PUR))
    for i, (nm, lo, hi, ok) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(x0 - 10, y + 15, nm, "end", 10, INK, True))
        o.append(RECT(X(lo), y + 3, X(hi) - X(lo), 16, 3, GOSOFT, GLD, 1.3))
        o.append(T(X(lo) + 4, y + 15, "%.1f" % lo, "start", 9, GLD, True))
        o.append(T(X(hi) - 4, y + 15, "%.1f" % hi, "end", 9, GLD, True))
        o.append(T(584, y + 15, "直接つなげる" if ok else "レギュレータが要る", "start", 10, GRN if ok else GLD, True))
    return SVG(700, yb + 62, o, "電池の電圧の範囲（代表値）と、例のマイコンが動く範囲（1.8〜3.6 V）。範囲の全体がマイコンの範囲に入る組み合わせは、マイコンを直接つないでも動く。新しいときにマイコンの上限を超える組み合わせはレギュレータが要り、電圧を下げる方式なら、電池が 3.4 V 程度より下がると 3.3 V を保てない。")
F["e02_batrange"] = _f02_batrange()

def _f02_series():
    o = []
    y = 70
    cells = [("1.50 V", "0.15 Ω", "1.50 − 0.3 × 0.15", "= 1.455 V", GRN),
             ("1.50 V", "0.15 Ω", "1.50 − 0.3 × 0.15", "= 1.455 V", GRN),
             ("0.20 V", "1.5 Ω", "0.20 − 0.3 × 1.5", "= −0.25 V（逆向き）", ALI)]
    o.append(T(20, y + 4, "−", "middle", 14, INK, True))
    o.append(W(30, y, 60, y, c=INK, lw=1.5))
    for k, (e, r, f1, f2, c) in enumerate(cells):
        x = 60 + k * 200
        o.append(W(x, y, x + 24, y, c=INK, lw=1.5))
        o.append(W(x + 24, y - 6, x + 24, y + 6, c=c, lw=3.2) + W(x + 32, y - 13, x + 32, y + 13, c=c, lw=1.8))
        o.append(W(x + 32, y, x + 60, y, c=INK, lw=1.5) + RECT(x + 60, y - 10, 70, 20, 3, soft(c), c, 1.3) + W(x + 130, y, x + 200, y, c=INK, lw=1.5))
        o.append(T(x + 28, y - 22, "E = " + e, "middle", 10, c, True))
        o.append(T(x + 95, y + 4, r, "middle", 9.5, c, True))
        o.append(RECT(x + 2, y + 34, 168, 46, 6, soft(c), c, 1.0))
        o.append(T(x + 12, y + 53, f1, "start", 10, INK))
        o.append(T(x + 12, y + 71, f2, "start", 10, c, True))
        o.append(T(x + 95, y - 22, "電池 %d" % (k + 1) if k < 2 else "弱った電池 3", "middle", 10, INK if k < 2 else ALI, True))
    o.append(T(670, y + 4, "+", "middle", 14, INK, True))
    o.append(ARR(600, y - 18, 662, y - 18, c=GLD, lw=1.5) + T(631, y - 24, "電流 0.3 A", "middle", 10, GLD, True))
    o.append(T(20, 182, "合計の端子電圧: 1.455 + 1.455 − 0.25 = 2.66 V（3 本とも新しければ 4.50 − 0.3 × 0.45 = 4.365 V）", "start", 10, INK))
    o.append(T(20, 200, "電池 3 の端子電圧は、E が小さく内部抵抗が大きいので、ほかの電池が流す電流で 0 V を下回る（値は例）。", "start", 10, MUT))
    return SVG(700, 214, o, "電池 3 本の直列で、1 本だけ弱った場合（各電池の端子電圧 = E − 電流 × 内部抵抗）。弱った電池には、ほかの 2 本が流す電流で逆向きの電圧がかかる。")
F["e02_series"] = _f02_series()

# ---- 3 節: USB と AC アダプタ ----
def _f02_usbseq():
    o = []
    x0, x1, y0 = 80, 680, 214
    Y = lambda ma: y0 - ma / 600.0 * 150
    ev = [(120, "つなぐ"), (270, "設定を受け入れられる"), (455, "サスペンド"), (535, "再開"), (625, "抜く")]
    for x, nm in ev:
        o.append(W(x, 40, x, y0, c=FNT, lw=1, dash="3 3"))
    for (x, nm), dy in zip(ev, (0, 0, 0, 14, 0)):
        o.append(T(x, 34 + dy, nm, "middle", 9.5, INK, True, halo=True))
    o.append(W(x0, Y(0), x1, Y(0), c=MUT, lw=1.2) + W(x0, Y(0), x0, 40, c=MUT, lw=1.2))
    for ma in (100, 500):
        o.append(W(x0 - 4, Y(ma), x0, Y(ma), c=MUT, lw=1) + T(x0 - 7, Y(ma) + 3.5, "%d mA" % ma, "end", 9.5, MUT))
    o.append(T(x0 - 7, Y(0) + 3.5, "0", "end", 9.5, MUT))
    o.append(T(x1, Y(0) + 32, "時間（縮尺は一定でない）", "end", 9.5, MUT))
    allow = [(x0, 0), (120, 0), (120, 100), (270, 100), (270, 500), (455, 500), (455, 2), (535, 2), (535, 500), (625, 500), (625, 0), (x1, 0)]
    o.append(PL([(x, Y(v)) for x, v in allow], c=GLD, lw=2, dash="6 4"))
    dev = [(x0, 0), (120, 0), (120, 560), (124, 60), (290, 60), (290, 450), (455, 450), (455, 1), (535, 1), (535, 450), (625, 450), (625, 0), (x1, 0)]
    o.append(PL([(x, Y(v)) for x, v in dev], c=SIG, lw=2))
    o.append(PL([(120, Y(100)), (120, Y(560)), (124, Y(60))], c=ALI, lw=2))
    o.append(T(130, Y(560) + 4, "突入電流（05 章 3 節）", "start", 9.5, ALI))
    notes = [(195, "100 mA 以下で待つ"), (372, "充電を始める（予算 − 機器の電流）"), (580, "充電に戻る")]
    for x, s in notes:
        o.append(T(x, Y(0) + 15, s, "middle", 9.5, SIG))
    o.append(T(495, Y(0) - 22, "小さな電流で", "middle", 9.5, SIG))
    o.append(T(495, Y(0) - 10, "眠る", "middle", 9.5, SIG))
    o.append(T(372, Y(500) - 6, "使ってよい電流 500 mA", "middle", 9.5, GLD, True))
    o.append(T(195, Y(100) - 6, "100 mA", "middle", 9.5, GLD, True))
    o.append(T(619, Y(0) - 10, "VBUS が消える", "end", 9.5, ALI))
    o.append(LEGEND(x0, 270, [(GLD, "使ってよい電流（電流の予算）"), (SIG, "機器が流す電流（例）")]))
    return SVG(700, 282, o, "USB 2.0 のポートにつないだ機器の、使ってよい電流と、実際に流す電流（例）。つないだ直後は 100 mA までで、ホストが設定を受け入れると、申告した電流（例 500 mA）まで使える。サスペンドの間は、さらに小さな電流にする。プラグを抜かれると、VBUS は予告なく消える。")
F["e02_usbseq"] = _f02_usbseq()

def _f02_cable():
    o = []
    p = Plot(70, 34, 250, 170, (0, 3), (3.6, 5.1))
    o.append(T(p.x + p.w / 2, 20, "機器の端子の電圧（ホストの端子で 5.0 V）", "middle", 10.5, INK, True))
    o.append(p.axes(xl="電流 [A]", yl="電圧 [V]", xt=[0, 1, 2, 3], yt=[3.6, 4.0, 4.4, 4.8, 5.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 5.0), (3, 5.0 - 3 * 0.2)], c=GRN, lw=2.2))
    o.append(p.line([(0, 5.0), (3, 5.0 - 3 * 0.4)], c=GLD, lw=2.2))
    o.append(T(p.X(2.2), p.Y(5.0 - 2.2 * 0.2) - 8, "往復 0.2 Ω", "middle", 9.5, GRN, True))
    o.append(T(p.X(1.5) - 6, p.Y(4.4) + 10, "往復 0.4 Ω", "end", 9.5, GLD, True))
    for I in (0.5, 2.0):
        v = 5.0 - I * 0.4
        o.append(D(p.X(I), p.Y(v), GLD, 3.4) + T(p.X(I) + 6, p.Y(v) + 15, "%.1f A で %.1f V" % (I, v), "start", 9.5, GLD, halo=True))
    # 右: 同じ 15 W を送るときの損失
    o.append(T(512, 20, "15 W を往復 0.2 Ω のケーブルで送るときの損失", "middle", 10.5, INK, True))
    xb, sc = 430, 80.0
    for k, V in enumerate((5, 9, 15, 20)):
        I = 15.0 / V
        loss = I * I * 0.2
        y = 44 + k * 38
        c = ALI if V == 5 else (GLD if V == 9 else GRN)
        o.append(T(xb - 8, y + 12, "%d V・%.2f A" % (V, I), "end", 10, INK, True))
        o.append(RECT(xb, y, max(loss * sc, 1), 18, 2, soft(c), c, 1.2))
        o.append(T(xb + loss * sc + 6, y + 13, "%.2f W（%.1f %%）" % (loss, loss / 15 * 100), "start", 9.5, c, True))
        o.append(T(xb + loss * sc + 6, y + 26, "電圧の低下 %.2f V" % (I * 0.2), "start", 9, MUT))
    o.append(T(512, 214, "損失 = (P ÷ V)² × Rc。電圧を 3 倍にすると 1/9", "middle", 9.5, MUT))
    return SVG(700, 250, o, "左: ケーブルとコネクタの往復の抵抗で、機器の端子の電圧が下がる（値は例）。右: 同じ電力を送るとき、電圧を上げると電流が減り、ケーブルで失われる電力は電圧の 2 乗に反比例して減る。")
F["e02_cable"] = _f02_cable()

def _f02_adapter():
    o = []
    p = Plot(80, 26, 400, 200, (0, 1.4), (0, 13))
    o.append(p.axes(xl="出力の電流 [A]", yl="出力の電圧 [V]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4], yt=[0, 3, 5, 9, 12], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 5.0), (1.15, 5.0 - 1.15 * 0.05)], c=GRN, lw=2.4))
    o.append(p.line([(1.15, 5.0 - 1.15 * 0.05), (1.22, 0.4)], c=GRN, lw=1.6, dash="4 3"))
    o.append(p.line([(0, 12.0), (1.4, 12.0 - 6.0 * 1.4)], c=GLD, lw=2.4))
    o.append(D(p.X(1.0), p.Y(4.95), GRN, 3.8) + T(p.X(1.0) - 6, p.Y(4.95) - 8, "定格 1 A", "end", 9.5, GRN, True))
    o.append(D(p.X(0.5), p.Y(9.0), GLD, 3.8) + T(p.X(0.5) + 8, p.Y(9.0) + 4, "定格 0.5 A で 9 V", "start", 9.5, GLD, True))
    o.append(D(p.X(0), p.Y(12.0), GLD, 3.8) + T(p.X(0.04), p.Y(12.0) - 8, "電流が小さいと 12 V（定格より高い）", "start", 9.5, GLD))
    o.append(T(p.X(1.22) + 6, p.Y(2.0), "保護が働く", "start", 9.5, GRN))
    # 右の説明
    x = 500
    o.append(T(x, 44, "安定化した 5 V・1 A（例）", "start", 10.5, GRN, True))
    for i, s in enumerate(("定格までは電圧がほぼ一定", "内部抵抗は小さい", "定格を大きく超えると、電圧を", "下げるか、止めて試し直す")):
        o.append(T(x, 62 + i * 16, s, "start", 9.5, INK))
    o.append(T(x, 140, "安定化していない 9 V・0.5 A（例）", "start", 10.5, GLD, True))
    for i, s in enumerate(("内部抵抗が大きい（例 6 Ω）", "電流が小さいと定格より高い", "直流に直した後のさざ波も大きい")):
        o.append(T(x, 158 + i * 16, s, "start", 9.5, INK))
    return SVG(700, 262, o, "AC アダプタの出力の電圧と電流（2 つの例）。安定化したものは定格まで電圧がほぼ一定で、定格を大きく超えると保護が働く。安定化していないものは内部抵抗が大きく、電流が小さいときに定格より高い電圧が出る。")
F["e02_adapter"] = _f02_adapter()

# ---- 4 節: 商用電源 ----
def _f02_mains():
    o = []
    p = Plot(80, 30, 500, 190, (0, 40), (-170, 170))
    o.append(p.axes(xl="時間 [ms]", yl="電圧 [V]", xt=[0, 10, 20, 30, 40], yt=[-141, -100, 0, 100, 141], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    vp = 100 * math.sqrt(2)
    for f, c, dash in ((50, GLD, None), (60, PUR, "6 4")):
        pts = [(t / 10.0, vp * math.sin(2 * math.pi * f * t / 10000.0)) for t in range(0, 401)]
        o.append(p.line(pts, c=c, lw=2.0, dash=dash))
    o.append(p.line([(0, vp), (40, vp)], c=ALI, lw=1.1, dash="3 3") + p.line([(0, -vp), (40, -vp)], c=ALI, lw=1.1, dash="3 3"))
    o.append(p.line([(0, 100), (40, 100)], c=MUT, lw=1.1, dash="6 4"))
    o.append(T(p.X(40) + 4, p.Y(vp) + 4, "山 141 V", "start", 9.5, ALI, True))
    o.append(T(p.X(40) + 4, p.Y(vp) + 18, "= √2 × 100 V", "start", 9.5, ALI))
    o.append(T(p.X(40) + 4, p.Y(100) + 14, "実効値 100 V", "start", 9.5, MUT))
    o.append(DIM(p.X(0), p.Y(-158), p.X(20), p.Y(-158), None, c=GLD))
    o.append(T(p.X(20) + 6, p.Y(-158) + 4, "1 周期 20 ms（50 Hz）", "start", 9.5, GLD, True))
    o.append(DIM(p.X(0), p.Y(158), p.X(1000 / 60.0), p.Y(158), None, c=PUR))
    o.append(T(p.X(1000 / 60.0) + 6, p.Y(158) + 4, "16.7 ms（60 Hz）", "start", 9.5, PUR, True))
    o.append(DIM(p.X(37), p.Y(vp), p.X(37), p.Y(-vp), None, c=ALI))
    o.append(T(p.X(37) - 6, p.Y(-40), "283 V", "end", 9.5, ALI, True, halo=True))
    return SVG(700, 266, o, "日本の商用電源（100 V）の電圧。実線は 50 Hz（東日本）、破線は 60 Hz（西日本）。100 V は実効値で、山の値は √2 倍の 141 V、プラスの山とマイナスの山の差は 283 V である。")
F["e02_mains"] = _f02_mains()

def _f02_nonisopanel(o, p0, iso):
    c_t = GRN if iso else ALI
    o.append(T(p0 + 165, 20, "(b) 絶縁した電源" if iso else "(a) 非絶縁の電源", "middle", 11.5, c_t, True))
    o.append(T(p0 + 60, 48, "コンセント", "middle", 10, INK, True))
    o.append(W(p0 + 10, 72, p0 + 128, 72, c=ALI, lw=2.0) + T(p0 + 12, 66, "電圧側（山 141 V）", "start", 9, ALI))
    o.append(W(p0 + 10, 108, p0 + 128, 108, c=MUT, lw=1.6) + T(p0 + 12, 102, "接地側", "start", 9, MUT))
    o.append(W(p0 + 30, 108, p0 + 30, 196, c=MUT, lw=1.2, dash="3 3") + _f02_gnd(p0 + 30, 196))
    o.append(RECT(p0 + 128, 52, 114, 130, 8, PAN, LIN, 1.2) + T(p0 + 185, 196, "機器", "middle", 9.5, INK, True))
    o.append(BOX(p0 + 136, 60, 98, 48, "絶縁した電源" if iso else "非絶縁の電源", "変圧器あり" if iso else "変圧器なし", GLD, GOSOFT, GLD, sz=10, ssz=9))
    o.append(BOX(p0 + 136, 130, 98, 40, "マイコン", None, SIG, SSOFT, SIG, sz=10.5))
    if iso:
        o.append(W(p0 + 128, 118, p0 + 242, 118, c=GRN, lw=1.4, dash="5 4"))
        o.append(T(p0 + 246, 121, "絶縁の境界", "start", 9, GRN, True))
    else:
        o.append(W(p0 + 150, 108, p0 + 150, 130, c=ALI, lw=2.4))
        o.append(T(p0 + 160, 124, "GND", "start", 9, ALI, True))
    o.append(BOX(p0 + 272, 132, 56, 34, "PC", None, MUT, PAN, INK, sz=10.5))
    o.append(W(p0 + 234, 150, p0 + 272, 150, c=SIG if iso else ALI, lw=1.8))
    o.append(T(p0 + 254, 144, "USB", "middle", 9, MUT))
    o.append(W(p0 + 300, 166, p0 + 300, 196, c=MUT, lw=1.2) + _f02_gnd(p0 + 300, 196))
    o.append(T(p0 + 314, 206, "大地", "start", 9, MUT))
    if iso:
        o.append(T(p0 + 165, 232, "商用電源から PC の GND への導体の道が無い", "middle", 10, GRN, True))
        o.append(T(p0 + 165, 248, "（絶縁が規格どおりに作られている場合）", "middle", 9.5, MUT))
    else:
        o.append(ARR(p0 + 236, 156, p0 + 268, 156, c=ALI, lw=1.4, head=6))
        o.append(T(p0 + 165, 232, "電圧側 → 機器の GND → USB → PC → 大地 に", "middle", 10, ALI, True))
        o.append(T(p0 + 165, 248, "大きな電流。回路のどこに触れても感電する", "middle", 10, ALI, True))

def _f02_noniso():
    o = []
    _f02_nonisopanel(o, 10, False)
    _f02_nonisopanel(o, 362, True)
    return SVG(700, 262, o, "非絶縁の電源の危険。(a) 非絶縁の電源では、差す向きや回路によって、機器の GND が商用電源の電圧側とつながる。大地につながった PC やデバッガを USB でつなぐと、商用電源から PC の GND を通って大きな電流が流れる。(b) 絶縁した電源なら、この道が無い。")
F["e02_noniso"] = _f02_noniso()

def _f02_isodecide():
    o = []
    o.append(BOX(10, 96, 118, 60, "商用電源から", "機器の中で直流を作る", GLD, GOSOFT, GLD, sz=10.5, ssz=9.5))
    o.append(BOX(160, 86, 170, 80, "問い 1: 触れるか", "使う人が、回路につながる部分（端子・金属・電極・センサの線）に触れるか", INK, PAN, INK, sz=10.5, ssz=9.5))
    o.append(BOX(362, 86, 170, 80, "問い 2: つなぐか", "回路を、ほかの機器（PC・ネットワーク・長い配線のセンサ）とつなぐか", INK, PAN, INK, sz=10.5, ssz=9.5))
    o.append(BOX(562, 14, 128, 82, "絶縁する", "絶縁した電源・認証を受けた部品・AC アダプタを使う", GRN, GSOFT, GRN, sz=11, ssz=9.5))
    o.append(BOX(562, 140, 128, 92, "非絶縁も使われる", "回路の全体を、触れられない筐体に閉じ込めるとき（規格で確かめる）", GLD, GOSOFT, GLD, sz=10.5, ssz=9.5))
    o.append(ARR(128, 126, 158, 126, c=MUT, lw=1.5))
    o.append(ARR(330, 126, 360, 126, c=MUT, lw=1.5) + T(345, 120, "いいえ", "middle", 9.5, MUT, halo=True))
    o.append(W(245, 86, 245, 55, c=GRN, lw=1.5) + ARR(245, 55, 560, 55, c=GRN, lw=1.5))
    o.append(T(254, 72, "はい", "start", 9.5, GRN, True))
    o.append(W(447, 86, 447, 55, c=GRN, lw=1.5))
    o.append(T(456, 72, "はい", "start", 9.5, GRN, True))
    o.append(W(532, 126, 546, 126, c=GLD, lw=1.5) + W(546, 126, 546, 186, c=GLD, lw=1.5) + ARR(546, 186, 560, 186, c=GLD, lw=1.5))
    o.append(T(548, 116, "いいえ", "middle", 9.5, GLD, True, halo=True))
    o.append(T(10, 256, "どちらの場合も、必要な絶縁の種類と、部品や導体の間に空ける距離は規格で決まる（06 章 2 節）。", "start", 10, MUT))
    return SVG(700, 268, o, "商用電源から直接つくるときに、絶縁が要るかどうかを決める 2 つの問い。どちらかに「はい」なら絶縁する。")
F["e02_isodecide"] = _f02_isodecide()

# ---- 5 節: 車の電源 ----
def _f02_carnet():
    o = []
    yb, yg = 60, 236
    o.append(W(60, yb, 520, yb, c=GLD, lw=2.2))
    o.append(T(300, yb - 8, "＋ 12 V の線", "middle", 9.5, GLD, True))
    # バッテリ
    o.append(W(60, yb, 60, 112, c=GLD, lw=1.8) + _f02_cellv(60, 120, GLD) + W(60, 124, 60, yg, c=MUT, lw=1.4))
    o.append(T(82, 118, "バッテリ", "start", 10, GLD, True))
    o.append(T(82, 133, "（鉛蓄電池）", "start", 9, MUT))
    # オルタネータ
    o.append(W(190, yb, 190, 106, c=GLD, lw=1.6) + CIRC(190, 124, 18, c=GLD, lw=1.6, fill=PAN) + T(190, 128.5, "G", "middle", 12, GLD, True) + W(190, 142, 190, yg, c=MUT, lw=1.4))
    o.append(T(198, 166, "オルタネータ", "start", 9.5, GLD, True))
    o.append(T(198, 180, "（エンジンが回す）", "start", 9, MUT))
    # キー
    o.append(W(330, yb, 330, 92, c=GLD, lw=1.6) + RECT(296, 92, 68, 34, 6, PAN, MUT, 1.3) + T(330, 113, "キーの接点", "middle", 9.5, INK, True))
    o.append(W(316, 126, 316, 150, c=PUR, lw=1.6) + CIRC(316, 168, 18, c=PUR, lw=1.6, fill=PAN) + T(316, 172.5, "M", "middle", 12, PUR, True) + W(316, 186, 316, yg, c=MUT, lw=1.4))
    o.append(T(292, 146, "ST", "end", 9, PUR, True))
    o.append(T(324, 206, "スタータ", "start", 9.5, PUR, True))
    o.append(W(350, 126, 350, 160, c=SIG, lw=1.6) + W(350, 160, 560, 160, c=SIG, lw=1.6))
    o.append(T(358, 146, "ACC", "start", 9, SIG, True))
    # 機器
    o.append(W(520, yb, 520, 82, c=GLD, lw=1.6) + W(520, 82, 560, 82, c=GLD, lw=1.6))
    o.append(BOX(560, 64, 128, 40, "常時電源の機器", None, SIG, SSOFT, SIG, sz=10))
    o.append(BOX(560, 142, 128, 40, "ACC 電源の機器", None, SIG, SSOFT, SIG, sz=10))
    o.append(W(624, 104, 624, 116, c=MUT, lw=1.2) + W(624, 182, 624, yg, c=MUT, lw=1.4))
    o.append(T(560, 124, "暗電流: 止めている間も流れる", "start", 9.5, ALI, True))
    o.append(W(40, yg, 680, yg, c=MUT, lw=2.4))
    o.append(T(470, yg - 6, "車体（マイナスの線を兼ねる）", "middle", 9.5, MUT, True))
    return SVG(700, 252, o, "車の電源のつながり（模式図）。バッテリとオルタネータが ＋ 12 V の線を作り、車体がマイナスの線を兼ねる。キーの接点で、スタータ（ST）と ACC 電源が入り切りされる。常時電源につなぐ機器は、車を止めている間も電流（暗電流）を取る。ヒューズなどは省いた。")
F["e02_carnet"] = _f02_carnet()

def _f02_carv():
    o = []
    x0, x1 = 70, 680
    Y = lambda v: 236 - v * 11.0
    o.append(W(x0, Y(0), x1, Y(0), c=MUT, lw=1.2) + W(x0, Y(0), x0, 30, c=MUT, lw=1.2))
    o.append(T(x1, Y(0) + 15, "時間（縮尺は一定でない）", "end", 9.5, MUT))
    o.append(T(x0 - 44, 140, "電源の電圧", "middle", 10, MUT, rot=-90))
    for v, s in ((12.6, "12.6 V"), (14.0, "14 V"), (7.6, "7.6 V")):
        o.append(W(x0 - 4, Y(v), x0, Y(v), c=MUT, lw=1) + T(x0 - 7, Y(v) + 3.5, s, "end", 9, MUT))
    pts = [(x0, Y(12.6)), (150, Y(12.6)), (154, Y(7.6)), (162, Y(9.6)), (176, Y(10.2)), (196, Y(10.4)), (206, Y(13.0)), (216, Y(14.0))]
    import random as _r
    _rg = _r.Random(2)
    xx = 216
    while xx < 420:
        pts.append((xx, Y(14.0 + _rg.uniform(-0.3, 0.3))))
        xx += 6
    pts += [(420, Y(14.0)), (426, 40), (440, 58), (460, Y(16.6)), (480, Y(14.5)), (500, Y(14.0)), (580, Y(14.0)), (590, Y(12.6)), (x1, Y(12.6))]
    o.append(PL(pts, c=GLD, lw=2.0))
    o.append(W(x0, Y(12.6), x1, Y(12.6), c=FNT, lw=1, dash="2 4"))
    for x, s in ((110, "止めている"), (182, "クランキング"), (318, "走っている（充電）"), (450, "ロードダンプ"), (632, "止める")):
        o.append(T(x, 24, s, "middle", 9.5, INK, True))
    o.append(T(166, Y(7.6) + 18, "例: 12.6 − 504 A × 10 mΩ ≈ 7.6 V", "start", 9.5, GLD))
    o.append(T(166, Y(7.6) + 32, "寒いと（20 mΩ）5.4 V まで下がる", "start", 9.5, GLD))
    o.append(T(470, 46, "公称を大きく超える", "start", 9.5, ALI, True))
    o.append(T(470, 60, "値と長さは規格で確かめる", "start", 9.5, ALI))
    o.append(T(318, Y(14.0) - 12, "点火・モータのノイズ", "middle", 9, MUT))
    # ACC 電源
    ya = 286
    o.append(T(x0 - 7, ya - 4, "ACC", "end", 9, SIG, True))
    o.append(PL([(x0, ya), (120, ya), (120, ya - 14), (150, ya - 14)], c=SIG, lw=1.8))
    o.append(PL([(150, ya - 14), (150, ya), (206, ya), (206, ya - 14), (590, ya - 14), (590, ya), (x1, ya)], c=SIG, lw=1.8, dash="5 3"))
    o.append(T(120, ya - 20, "ACC を入れる", "middle", 9, SIG))
    o.append(T(178, ya + 14, "車種によっては切れる", "middle", 9, SIG))
    o.append(T(590, ya + 14, "ACC を切る", "middle", 9, SIG))
    return SVG(700, 308, o, "車の電源の電圧の変化（模式図。12 V の車）。始動の間（クランキング）は大きく下がり、走っている間はオルタネータの充電で 14 V 前後になる。バッテリとのつながりが切れると（ロードダンプ）大きく上がる。下がる・上がる値と長さは、規格と車両のメーカの要求で確かめる。下の線は ACC 電源。")
F["e02_carv"] = _f02_carv()

# ---- 6 節: 環境発電 ----
def _f02_pvcell(V, Iph, I0=1e-9, n=1.5, Ns=4):
    Vt = 0.025693
    return Iph - I0 * (math.exp(V / (n * Vt * Ns)) - 1)

def _f02_pv():
    o = []
    curves = []
    for Iph, dash in ((1e-3, None), (0.2e-3, "6 4")):
        Vs = [k / 500.0 * 2.3 for k in range(501)]
        iv = [(v, _f02_pvcell(v, Iph) * 1e3) for v in Vs if _f02_pvcell(v, Iph) >= 0]
        curves.append((iv, dash))
    # 左: 電流
    p = Plot(70, 34, 260, 180, (0, 2.3), (0, 1.1))
    o.append(T(p.x + p.w / 2, 20, "電流（光の強さにほぼ比例）", "middle", 10.5, GLD, True))
    o.append(p.axes(xl="太陽電池の電圧 [V]", yl="電流 [mA]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    for iv, dash in curves:
        o.append(p.line(iv, c=GLD, lw=2.2, dash=dash))
    o.append(T(p.X(0.9), p.Y(1.0) + 16, "明るい", "middle", 9.5, GLD, True))
    o.append(T(p.X(0.9), p.Y(0.2) - 8, "暗い（光が 1/5）", "middle", 9.5, GLD, True))
    o.append(T(p.X(1.95) - 4, p.Y(0.55), "急に減る", "end", 9.5, GLD))
    # 右: 電力
    q = Plot(420, 34, 260, 180, (0, 2.3), (0, 1.8))
    o.append(T(q.x + q.w / 2, 20, "電力 = 電圧 × 電流", "middle", 10.5, SIG, True))
    o.append(q.axes(xl="太陽電池の電圧 [V]", yl="電力 [mW]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 0.5, 1.0, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    best = []
    for iv, dash in curves:
        pv = [(v, i * v) for v, i in iv]
        o.append(q.line(pv, c=SIG, lw=2.2, dash=dash))
        best.append(max(pv, key=lambda t: t[1]))
    (vb, pb), (vd, pd_) = best
    o.append(D(q.X(vb), q.Y(pb), SIG, 4) + T(q.X(vb) - 8, q.Y(pb) - 6, "最大電力点 %.2f mW（%.2f V）" % (pb, vb), "end", 9.5, SIG, True))
    o.append(D(q.X(vd), q.Y(pd_), SIG, 4) + W(q.X(vd), q.Y(pd_) - 4, 590, 146, c=SIG, lw=1))
    o.append(T(590, 140, "%.2f mW（%.2f V）" % (pd_, vd), "middle", 9.5, SIG, True))
    pw05 = 0.5 * _f02_pvcell(0.5, 1e-3) * 1e3
    o.append(W(q.X(0.5), q.y + q.h, q.X(0.5), q.Y(pw05), c=ALI, lw=1.2, dash="3 3") + D(q.X(0.5), q.Y(pw05), ALI, 4))
    o.append(W(q.X(0.5), q.Y(pw05) - 4, q.X(0.3), q.Y(1.08), c=ALI, lw=1))
    o.append(T(q.X(0.12), q.Y(1.25), "0.5 V では %.2f mW" % pw05, "start", 9.5, ALI, True))
    o.append(T(q.X(0.12), q.Y(1.25) + 14, "（最大の %.0f %%）" % (pw05 / pb * 100), "start", 9.5, ALI, True))
    o.append(T(14, 270, "実線: 明るい、破線: 暗い（光が 1/5）。0.5 V は、空のコンデンサにつないだ直後の例。", "start", 10, MUT))
    return SVG(700, 282, o, "小さな太陽電池の電流と電力（数個のセルを直列にした模型による例）。電流は光の強さにほぼ比例し、電圧を上げていくと急に減る。電力はその間で最大になる（最大電力点）。電圧が低いままでは、取り出せる電力は最大の一部にとどまる。")
F["e02_pv"] = _f02_pv()

def _f02_hsim(C=0.47, A=10.0, pd=10e-6, eta=0.8, Pload=30e-6, Poff=1e-6, Vmax=5.0, Voff=2.2, Von=3.0, V0=5.0, days=7, dt=60.0):
    """室内の照明（平日 8〜18 時）の環境発電。本文 6 節と同じ模型（デモ w02_harvest と同じ式）。"""
    E = 0.5 * C * V0 ** 2
    run = V0 >= Von
    out = []
    for k in range(int(days * 86400 / dt)):
        t = k * dt
        day, h = int(t // 86400), (t % 86400) / 3600
        Ph = A * pd if (8 <= h < 18 and day % 7 < 5) else 0.0
        E = min(E + eta * Ph * dt, 0.5 * C * Vmax ** 2)
        if run:
            E -= Pload * dt
            if E < 0.5 * C * Voff ** 2:
                run = False
        else:
            E -= Poff * dt
            if math.sqrt(2 * max(E, 0) / C) >= Von:
                run = True
        E = max(E, 0.0)
        out.append((t / 86400.0, math.sqrt(2 * E / C), run))
    return out

def _f02_balance():
    o = []
    sim = _f02_hsim()
    p = Plot(70, 36, 600, 190, (0, 7), (0, 5.5))
    for d in range(5):
        o.append(RECT(p.X(d + 8 / 24.0), p.y, p.X(d + 18 / 24.0) - p.X(d + 8 / 24.0), p.h, 0, GOSOFT, "none", 0))
    o.append(p.axes(yl="蓄えの電圧 [V]", xt=list(range(8)), yt=[0, 1, 2.2, 3, 4, 5], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
    for d, nm in enumerate("月火水木金土日"):
        o.append(T(p.X(d + 0.5), p.y + p.h + 15, nm, "middle", 10, INK, True))
    o.append(p.line([(0, 2.2), (7, 2.2)], c=ALI, lw=1.2, dash="5 4") + p.line([(0, 3.0), (7, 3.0)], c=MUT, lw=1.1, dash="3 3"))
    t_stop = next(t for t, v, r in sim if not r)
    o.append(RECT(p.X(t_stop), p.y, p.X(7) - p.X(t_stop), p.h, 0, ASOFT, "none", 0))
    o.append(p.line([(t, v) for t, v, r in sim[::5]], c=SIG, lw=2.0))
    o.append(T(p.X(0.1), p.Y(2.2) + 14, "止める電圧 2.2 V", "start", 9.5, ALI))
    o.append(T(p.X(0.1), p.Y(3.0) - 6, "動かす電圧 3.0 V", "start", 9.5, MUT))
    hh = int(round((t_stop % 1) * 24 * 60))
    o.append(T(p.X(t_stop) - 4, p.Y(4.6), "日曜 %d:%02d に止まる" % (hh // 60, hh % 60), "end", 9.5, ALI, True, halo=True))
    o.append(T(70, 24, "平日の 1 日: 入る 2.88 J（照明 8〜18 時）、出る 2.59 J", "start", 9.5, GLD, True))
    o.append(T(p.X(5.6), p.Y(1.2), "週末の 62 時間で 6.70 J を使う", "middle", 9.5, INK, halo=True))
    o.append(LEGEND(70, 262, [(GLD, "照明が点いている時間"), (SIG, "蓄え（0.47 F）の電圧"), (ALI, "機器が止まっている時間")]))
    return SVG(700, 276, o, "室内の照明で動く機器の 1 週間（例の値: 太陽電池 10 cm²・平日の 8〜18 時に 100 µW、蓄えへ移すときに 2 割を失う、機器は平均 30 µW、蓄え 0.47 F）。平日は少しずつ増えるが、照明の消える週末の 62 時間を越せずに止まる。")
F["e02_balance"] = _f02_balance()

def _f02_coldstart():
    o = []
    C, Ph, Pl, Eb = 0.047, 20e-6 * 0.8, 100e-6, 1e-3
    def sim(von, voff, T=6 * 3600, dt=1.0):
        E = 0.5 * C * 2.0 ** 2
        run = False
        out, boots = [], []
        for k in range(int(T / dt)):
            t = k * dt
            E += Ph * dt
            if run:
                E -= Pl * dt
                if E < 0.5 * C * voff ** 2:
                    run = False
            elif math.sqrt(2 * E / C) >= von:
                run = True
                E -= Eb
                boots.append(t)
                if E < 0.5 * C * voff ** 2:
                    run = False
            if k % 30 == 0:
                out.append((t / 3600.0, math.sqrt(2 * E / C), run))
        return out, boots
    for k, (von, ttl, c) in enumerate(((2.2, "(a) 動かす電圧と止める電圧が同じ（2.2 V）", ALI), (3.3, "(b) 3.3 V で動かし、2.2 V で止める", GRN))):
        y0 = 30 + k * 150
        p = Plot(80, y0, 590, 100, (0, 6), (1.8, 3.6))
        out, boots = sim(von, 2.2)
        o.append(T(14, y0 - 10, ttl, "start", 10.5, c, True))
        if k == 1:
            t0 = None
            for t, v, r in out + [(6.0, 0, False)]:
                if r and t0 is None:
                    t0 = t
                if not r and t0 is not None:
                    o.append(RECT(p.X(t0), p.y, p.X(t) - p.X(t0), p.h, 0, GSOFT, "none", 0))
                    t0 = None
        o.append(p.axes(yl="電圧 [V]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[2.2, 3.3], xfmt=lambda v: "%g h" % v, yfmt=lambda v: "%g" % v))
        o.append(p.line([(t, v) for t, v, r in out], c=SIG, lw=2.0))
        if k == 0:
            for t in boots[::6]:
                o.append(W(p.X(t / 3600.0), p.Y(2.08), p.X(t / 3600.0), p.Y(2.0), c=ALI, lw=1))
            o.append(T(p.X(3.0), p.Y(2.62), "約 %d 秒ごとに起動して、すぐ止まる（6 時間で %d 回）。仕事は終わらない" % (round((boots[-1] - boots[0]) / (len(boots) - 1)), len(boots)), "middle", 9.5, ALI, True))
        else:
            o.append(T(p.X(1.4), p.Y(3.0), "3.3 V までためる", "middle", 9.5, SIG, True))
            o.append(T(p.X(3.05), p.Y(3.45), "動いている間（28 分）", "middle", 9.5, GRN, True, halo=True))
    o.append(T(14, 318, "例の値: 蓄え 47 mF、取り込む電力 16 µW（暗い室内）、動いている間の電力 100 µW、起動に 1 mJ。", "start", 9.5, MUT))
    return SVG(700, 328, o, "空の蓄えからの起動。(a) 1 つの電圧で動かし・止めると、起動のたびに電圧が下がってすぐ止まり、これを繰り返す。(b) 動かす電圧を高くすると、3.3 V から 2.2 V までのエネルギーをまとめて使え、毎回 28 分ほど動ける。")
F["e02_coldstart"] = _f02_coldstart()

# ---- 7 節: 組み合わせる ----
def _f02_compare():
    o = []
    cols = ["電圧の範囲", "内部抵抗", "取り出せる電流", "途切れ方", "絶縁", "ノイズ"]
    G, Y, R = GRN, GLD, ALI
    rows = [("電池", [("広い", "使うと下がる", Y), ("種類で桁違い", "コイン形は大", Y), ("内部抵抗と", "容量で限られる", Y),
                      ("尽きる・交換", "接点が離れる", Y), ("どこにも", "つながらない", G), ("小さい", "", G)]),
            ("USB", [("5 V", "PD で上げる", G), ("ケーブルの分", "", Y), ("手順で決まる", "100 mA から", Y),
                     ("いつでも", "抜き差し", R), ("ホストと", "GND を共有", Y), ("ホストの電源", "のノイズ", Y)]),
            ("AC アダプタ", [("安定化なら", "ほぼ一定", G), ("安定化なら", "小さい", G), ("定格まで", "", Y),
                           ("抜く・停電で", "予告なし", R), ("コンセントと", "絶縁", G), ("さざ波・大地", "との電圧", Y)]),
            ("商用電源から", [("100 V", "山で 141 V", R), ("小さい", "", G), ("大きい", "故障で火災", Y),
                           ("停電", "ごく短い停電", Y), ("非絶縁なら", "危険な電位", R), ("雷・ほかの", "機器の入り切り", R)]),
            ("車の電源", [("12 V で", "大きく上下", R), ("小さい", "始動で下がる", Y), ("大きい", "ヒューズまで", G),
                        ("始動・ACC", "の切断", Y), ("車体が", "共通の線", Y), ("大きい", "点火・モータ", R)]),
            ("環境発電", [("蓄えの電圧", "0 から上下", Y), ("電流の源に", "近い", Y), ("µW〜mW", "と小さい", R),
                        ("夜・日陰", "機械の停止", R), ("どこにも", "つながらない", G), ("小さい", "", G)])]
    xh, cw, y0, rh = 104, 96, 30, 44
    for j, c in enumerate(cols):
        o.append(T(xh + j * cw + cw / 2, y0 - 10, c, "middle", 10, INK, True))
    for i, (nm, cells) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(xh - 8, y + rh / 2 + 4, nm, "end", 10.5, INK, True))
        for j, (a, b, c) in enumerate(cells):
            x = xh + j * cw
            o.append(RECT(x + 2, y + 2, cw - 4, rh - 4, 4, soft(c), c, 1.0))
            if b:
                o.append(T(x + cw / 2, y + 19, a, "middle", 9.5, INK, c == R))
                o.append(T(x + cw / 2, y + 33, b, "middle", 9.5, INK, c == R))
            else:
                o.append(T(x + cw / 2, y + 26, a, "middle", 9.5, INK, c == R))
    o.append(LEGEND(104, y0 + 6 * rh + 22, [(G, "問題になりにくい"), (Y, "設計で気をつける"), (R, "設計の中心になる")]))
    return SVG(700, y0 + 6 * rh + 34, o, "6 種の電源を 6 つの物差しで比べる（2〜6 節のまとめ）。色は、その物差しが設計でどれだけ問題になりやすいかの目安である。")
F["e02_compare"] = _f02_compare()

def _f02_directpanel(o, x0, kind):
    titles = {"direct": ("(a) 直接つなぐ（悪い例）", ALI), "diode": ("(b) ダイオード OR", SIG), "ideal": ("(c) 理想ダイオード", GRN)}
    t, tc = titles[kind]
    o.append(T(x0 + 110, 20, t, "middle", 11, tc, True))
    ya, yb, xn = 70, 150, x0 + 150
    o.append(BOX(x0 + 2, ya - 20, 66, 40, "A: USB", "5.0 V", GLD, GOSOFT, GLD, sz=10, ssz=9.5))
    o.append(BOX(x0 + 2, yb - 20, 66, 40, "B: 電池", "3.1 V", GLD, GOSOFT, GLD, sz=10, ssz=9.5))
    for y in (ya, yb):
        if kind == "direct":
            o.append(W(x0 + 68, y, xn, y, c=INK, lw=1.5))
        elif kind == "diode":
            o.append(W(x0 + 68, y, x0 + 100, y, c=INK, lw=1.5) + _f02_diode(x0 + 116, y, INK, 8) + W(x0 + 116, y, xn, y, c=INK, lw=1.5))
        else:
            o.append(W(x0 + 68, y, x0 + 88, y, c=INK, lw=1.5) + RECT(x0 + 88, y - 12, 46, 24, 4, GSOFT, GRN, 1.2)
                     + T(x0 + 111, y + 4, "MOSFET", "middle", 8.5, GRN, True) + W(x0 + 134, y, xn, y, c=INK, lw=1.5))
    o.append(W(xn, ya, xn, yb, c=INK, lw=1.5) + D(xn, (ya + yb) / 2, INK, 3.2))
    o.append(W(xn, (ya + yb) / 2, xn + 22, (ya + yb) / 2, c=INK, lw=1.5) + BOX(xn + 22, (ya + yb) / 2 - 18, 42, 36, "負荷", None, PUR, PSOFT, PUR, sz=10))
    if kind == "direct":
        o.append(ARR(xn - 8, yb + 12, x0 + 74, yb + 12, c=ALI, lw=2.2))
        o.append(T(x0 + 110, yb + 30, "約 2.7 A が電池に流れ込む", "middle", 10, ALI, True))
        lines = [("(5.0 − 3.1) ÷ (0.4 + 0.3)", INK), ("≈ 2.7 A（負荷が無くても）", ALI), ("制限するのは内部抵抗だけ", ALI)]
    elif kind == "diode":
        o.append(T(xn - 6, (ya + yb) / 2 + 18, "4.51 V", "end", 9.5, SIG, True))
        o.append(T(x0 + 110, yb + 30, "B は逆向き: 数 µA（代表値）", "middle", 9.5, MUT))
        lines = [("低下 0.37 V・熱 0.11 W", INK), ("A が無いとき 2.64 V", SIG), ("（ショットキーの例）", MUT)]
    else:
        o.append(T(xn - 6, (ya + yb) / 2 + 18, "4.87 V", "end", 9.5, GRN, True))
        o.append(T(x0 + 110, yb + 30, "逆向きの電圧で MOSFET を切る", "middle", 9.5, MUT))
        lines = [("低下 0.015 V・熱 4.5 mW", INK), ("A が無いとき 3.00 V", GRN), ("（抵抗 50 mΩ の例）", MUT)]
    for i, (s, c) in enumerate(lines):
        o.append(T(x0 + 110, yb + 54 + i * 16, s, "middle", 9.5, c, True))

def _f02_direct():
    o = []
    for x0, kind in ((6, "direct"), (238, "diode"), (470, "ideal")):
        _f02_directpanel(o, x0, kind)
    return SVG(700, 262, o, "2 つの電源のつなぎ方（例: A は USB 5.0 V でケーブルを含めて 0.4 Ω、B は単 3 形 2 本で 3.1 V・0.3 Ω、負荷 0.3 A）。直接つなぐと電池に大きな電流が流れ込む。ダイオード OR は電流の向きを決めるが、電圧が下がり熱が出る。理想ダイオードは低下が小さい。")
F["e02_direct"] = _f02_direct()

def _f02_share():
    o = []
    Vt = 0.025693
    p = Plot(90, 30, 480, 200, (-0.1, 0.4), (0.01, 100), ylog=True)
    o.append(p.axes(xl="電圧の差 ΔV（A の電圧 − B の電圧）[V]", yl="B が流す割合 [%]", xt=[-0.1, 0, 0.1, 0.2, 0.3, 0.4], yt=[0.01, 0.1, 1, 10, 100], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(-0.1, 1), (0.4, 1)], c=MUT, lw=1.1, dash="4 3"))
    for n, c, nm in ((1.05, SIG, "ショットキー（n = 1.05）"), (1.8, GLD, "シリコン（n = 1.8）")):
        pts = []
        for k in range(0, 201):
            dv = -0.1 + 0.5 * k / 200
            s = 100.0 / (1 + math.exp(dv / (n * Vt)))
            if s >= 0.01:
                pts.append((dv, s))
        o.append(p.line(pts, c=c, lw=2.2))
        d1 = n * Vt * math.log(99)
        o.append(D(p.X(d1), p.Y(1), c, 4) + W(p.X(d1), p.Y(1), p.X(d1), p.Y(0.01), c=c, lw=1, dash="3 3"))
        if n < 1.5:
            o.append(T(p.X(d1) - 6, p.Y(1) + 16, "%.3f V で 1 %%" % d1, "end", 9.5, c, True))
        else:
            o.append(T(p.X(d1) + 6, p.Y(1) + 16, "%.3f V で 1 %%" % d1, "start", 9.5, c, True, halo=True))
    o.append(T(p.X(0.40), p.Y(40), "ショットキー（n = 1.05）", "end", 9.5, SIG, True))
    o.append(T(p.X(0.40), p.Y(18), "シリコン（n = 1.8）", "end", 9.5, GLD, True))
    o.append(D(p.X(0), p.Y(50), INK, 3.6) + T(p.X(0) + 6, p.Y(50) - 6, "差 0 で半分ずつ", "start", 9.5, INK))
    s01 = 100.0 / (1 + math.exp(0.1 / (1.05 * Vt)))
    o.append(D(p.X(0.1), p.Y(s01), ALI, 3.6) + W(p.X(0.1), p.Y(s01), p.X(0.06), p.Y(0.3), c=ALI, lw=1))
    o.append(T(p.X(0.06) - 4, p.Y(0.3) + 4, "差 0.1 V で %.1f %%" % s01, "end", 9.5, ALI, True))
    o.append(T(p.X(0.06) - 4, p.Y(0.3) + 18, "（3.3 V とコイン電池 3.2 V）", "end", 9.5, ALI))
    return SVG(700, 270, o, "ダイオード OR で、電圧の低い電源 B が負荷の電流のうち流す割合（同じ種類のダイオード、電源の内部抵抗を無視した式による。縦軸は対数目盛）。差が 0 なら半分ずつ流し、1 % 以下にするには、ショットキーで 0.124 V、シリコンで 0.213 V の差が要る。")
F["e02_share"] = _f02_share()

def _f02_modes():
    o = []
    o.append(STATE(150, 80, 190, 52, "主な電源で動く", GRN, "すべての動作・充電", start=True))
    o.append(STATE(470, 80, 220, 52, "予備の電池で動く", GLD, "重い負荷を止める・間隔を延ばす"))
    o.append(STATE(470, 196, 190, 46, "記録して止まる", ALI, end=True))
    o.append(EDGE(245, 64, 360, 64, "主な電源が消えた（GPIO・ADC で知る）", bend=0.25, c=GLD, lc=GLD, loff=(0, -8)))
    o.append(EDGE(360, 98, 245, 98, "主な電源が戻った（電池を確かめてから戻す）", bend=0.25, c=GRN, lc=GRN, loff=(0, 18)))
    o.append(EDGE(470, 106, 470, 172, None, c=ALI))
    o.append(T(480, 144, "電池の電圧が下がった（04 章 3 節）", "start", 9.5, ALI))
    return SVG(700, 236, o, "主な電源と予備の電池を組み合わせた機器で、マイコンが受け持つ動き方の切り替え。予備の電池で動く間は電流を小さくし、電池が尽きる前に記録して止まる。")
F["e02_modes"] = _f02_modes()
