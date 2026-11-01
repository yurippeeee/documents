# -*- coding: utf-8 -*-
# 12 章 出力をスイッチする の図

# ---- 共通の部品（回路記号と添字付きの文字） ----
def _f12_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。添字の次の文字は dy で元の高さに戻す。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    pend = 0
    for s, sub, it in parts:
        o.append('<tspan font-style="%s"%s>%s</tspan>' % ("italic" if it else "normal", (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan>' % (sz * 0.72, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)

def _f12_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f12_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f12_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return (W(x, y, x, y + 6, c=c, lw=1.4) + W(x - 8, y + 6, x + 8, y + 6, c=c, lw=1.6)
            + W(x - 5, y + 10, x + 5, y + 10, c=c, lw=1.4) + W(x - 2, y + 14, x + 2, y + 14, c=c, lw=1.2))

def _f12_capv(x, y1, y2, c=INK, w=12):
    """縦向きのコンデンサ。y1 から y2 までの線の中ほどに 2 枚の板。"""
    ym = (y1 + y2) / 2
    return (W(x, y1, x, ym - 3, c=c, lw=1.5) + W(x - w, ym - 3, x + w, ym - 3, c=c, lw=2.2)
            + W(x - w, ym + 3, x + w, ym + 3, c=c, lw=2.2) + W(x, ym + 3, x, y2, c=c, lw=1.5))

def _f12_dv(x, y, up=True, c=INK, s=7, fill=None):
    """縦向きのダイオード。(x, y) は三角の中心。up=True なら下から上へ流す（カソードが上）。"""
    k = -1 if up else 1
    tip = y + k * s * 0.8
    base = y - k * s * 0.8
    return (PL([(x - s, base), (x + s, base), (x, tip)], c=c, lw=1.4, fill=fill or soft(c))
            + W(x - s, tip, x + s, tip, c=c, lw=1.8))

def _f12_dh(x, y, right=True, c=INK, s=7, fill=None):
    """横向きのダイオード。(x, y) は三角の中心。right=True なら左から右へ流す。"""
    k = 1 if right else -1
    tip = x + k * s * 0.8
    base = x - k * s * 0.8
    return (PL([(base, y - s), (base, y + s), (tip, y)], c=c, lw=1.4, fill=fill or soft(c))
            + W(tip, y - s, tip, y + s, c=c, lw=1.8))

def _f12_zv(x, y, up=True, c=INK, s=7):
    """縦向きのツェナーダイオード（カソードの線の両端を折る）。up=True ならカソードが上。"""
    k = -1 if up else 1
    tip = y + k * s * 0.8
    base = y - k * s * 0.8
    return (PL([(x - s, base), (x + s, base), (x, tip)], c=c, lw=1.4, fill=soft(c))
            + W(x - s - 3, tip - k * 3, x - s, tip, x + s, tip, x + s + 3, tip + k * 3, c=c, lw=1.8))

def _f12_tvsv(x, y, c=INK, s=7):
    """縦向きの TVS ダイオード（向かい合わせの 2 つの三角。両向き）。"""
    return (PL([(x - s, y - 2 * s * 0.8), (x + s, y - 2 * s * 0.8), (x, y)], c=c, lw=1.3, fill=soft(c))
            + PL([(x - s, y + 2 * s * 0.8), (x + s, y + 2 * s * 0.8), (x, y)], c=c, lw=1.3, fill=soft(c))
            + W(x - s - 3, y - 3, x - s, y, x + s, y, x + s + 3, y + 3, c=c, lw=1.8))

def _f12_led(x, y, right=True, c=INK, s=7):
    """横向きの LED（ダイオードと、外向きの 2 本の矢印）。"""
    o = _f12_dh(x, y, right, c, s)
    for dx in (-3, 4):
        o += ARR(x + dx, y - s - 2, x + dx + 7, y - s - 11, c=GLD, lw=1.2, head=4)
    return o

def _f12_coilv(x, y1, y2, c=INK, n=4, r=6):
    """縦向きのコイル（半円の連なり）。"""
    h = (y2 - y1) / n
    d = "M%g,%g" % (x, y1)
    for i in range(n):
        d += " A%g,%g 0 0 1 %g,%g" % (r, h / 2, x, y1 + (i + 1) * h)
    return PATH(d, c=c, lw=1.6)

def _f12_fet(x, yc, kind="N", c=SIG, lab=True, src_top=False, sz=9):
    """MOSFET の記号（縦向き）。x はドレイン・ソースの線、yc は中心。ゲートは左の (x-24, yc)。
    N チャネルはドレインが上・ソースが下。P チャネルは既定でソースが上（src_top を無視）。返り値は svg。"""
    top_is_src = (kind == "P") or src_top
    o = []
    o.append(W(x - 24, yc, x - 13, yc, c=c, lw=1.5))
    o.append(W(x - 13, yc - 12, x - 13, yc + 12, c=c, lw=2.2))
    for y0 in (yc - 13, yc - 3, yc + 7):
        o.append(W(x - 7, y0, x - 7, y0 + 6, c=c, lw=2.2))
    o.append(W(x - 7, yc - 10, x, yc - 10, x, yc - 22, c=c, lw=1.5))
    o.append(W(x - 7, yc + 10, x, yc + 10, x, yc + 22, c=c, lw=1.5))
    # 基板（ボディ）の線はソースにつなぐ
    ys = yc - 10 if top_is_src else yc + 10
    o.append(W(x - 7, yc, x, yc, x, ys, c=c, lw=1.5))
    if kind == "N":
        o.append(_head(x, yc, x - 7, yc, c, 5))
    else:
        o.append(_head(x - 7, yc, x, yc, c, 5))
    if lab:
        o.append(T(x - 22, yc - 5, "G", "middle", sz, c, True))
        o.append(T(x + 5, yc - 16 if not top_is_src else yc + 20, "D", "start", sz, c, True))
        o.append(T(x + 5, yc + 20 if not top_is_src else yc - 16, "S", "start", sz, c, True))
    return "".join(o)

def _f12_swv(x, y1, y2, closed, c=INK):
    """縦向きのスイッチ（上下の端子と、倒れる板）。"""
    o = [D(x, y1, c, 2.4), D(x, y2, c, 2.4)]
    if closed:
        o.append(W(x, y1, x, y2, c=c, lw=1.8))
    else:
        o.append(W(x, y2, x - 9, y1 + 3, c=c, lw=1.8))
    return "".join(o)

def _f12_pin(x, y, c=SIG):
    """マイコンのピン（小さな四角）。"""
    return RECT(x - 4, y - 4, 8, 8, 1, soft(c), c, 1.3)

# ---- 1 節: GPIO の出力 ----
def _f12_gpio():
    o = []
    # (a) 出力の中
    o.append(T(14, 20, "(a) 出力の中（プッシュプル）", "start", 11, INK, True))
    o.append(RECT(16, 32, 186, 214, 10, SSOFT, SIG, 1.4))
    o.append(T(28, 50, "マイコン", "start", 10, SIG, True))
    xb = 110
    o.append(W(xb - 34, 62, xb + 34, 62, c=GLD, lw=2))
    o.append(_f12_m(xb + 40, 66, [("V", "DD", True)], "start", 10.5, GLD, True))
    o.append(_f12_swv(xb, 70, 96, False, SIG))
    o.append(W(xb, 62, xb, 70, c=SIG, lw=1.5))
    o.append(_f12_resv(xb, 96, 126, c=SIG))
    o.append(T(xb - 14, 86, "H で入る", "end", 9.5, SIG))
    o.append(_f12_m(xb - 12, 116, [("R", "o", True)], "end", 10, SIG))
    o.append(W(xb, 126, xb, 166, c=SIG, lw=1.5) + D(xb, 146, SIG, 2.6))
    o.append(W(xb, 146, 202, 146, c=SIG, lw=1.6))
    o.append(_f12_pin(202, 146))
    o.append(T(196, 136, "ピン", "end", 9.5, SIG, True))
    o.append(_f12_resv(xb, 166, 196, c=SIG))
    o.append(_f12_m(xb - 12, 186, [("R", "o", True)], "end", 10, SIG))
    o.append(_f12_swv(xb, 196, 222, True, SIG))
    o.append(T(xb - 14, 214, "L で入る", "end", 9.5, SIG))
    o.append(W(xb, 222, xb, 228, c=SIG, lw=1.5) + _f12_gnd(xb, 228, MUT))
    o.append(T(xb + 12, 186, "（例 40 Ω）", "start", 9, MUT))
    o.append(T(xb + 12, 116, "（例 40 Ω）", "start", 9, MUT))
    # (b) つなぎ方
    x0 = 232
    o.append(T(x0, 20, "(b) 負荷のつなぎ方", "start", 11, INK, True))
    # ソース
    y = 76
    o.append(_f12_pin(x0 + 8, y) + W(x0 + 12, y, x0 + 40, y, c=INK, lw=1.5) + _f12_resh(x0 + 40, x0 + 86, y))
    o.append(W(x0 + 86, y, x0 + 110, y, c=INK, lw=1.5) + _f12_led(x0 + 118, y, True, PUR) + W(x0 + 124, y, x0 + 150, y, x0 + 150, y + 10, c=INK, lw=1.5))
    o.append(_f12_gnd(x0 + 150, y + 10))
    o.append(ARR(x0 + 14, y + 12, x0 + 40, y + 12, c=ALI, lw=1.5, head=6))
    o.append(T(x0, y - 30, "ソース（吐き出し）: H を出すと点く", "start", 10, INK, True))
    o.append(T(x0 + 44, y + 25, "電流はピンから出る", "start", 9.5, ALI))
    # シンク
    y = 176
    o.append(_f12_pin(x0 + 8, y) + W(x0 + 12, y, x0 + 40, y, c=INK, lw=1.5) + _f12_resh(x0 + 40, x0 + 86, y))
    o.append(W(x0 + 86, y, x0 + 110, y, c=INK, lw=1.5) + _f12_led(x0 + 118, y, False, PUR) + W(x0 + 124, y, x0 + 150, y, x0 + 150, y - 12, c=INK, lw=1.5))
    o.append(W(x0 + 140, y - 12, x0 + 160, y - 12, c=GLD, lw=2))
    o.append(_f12_m(x0 + 150, y - 18, [("V", "DD", True)], "middle", 10, GLD, True))
    o.append(ARR(x0 + 40, y + 12, x0 + 14, y + 12, c=ALI, lw=1.5, head=6))
    o.append(T(x0, y - 36, "シンク（吸い込み）: L を出すと点く", "start", 10, INK, True))
    o.append(T(x0 + 44, y + 25, "電流はピンへ入る", "start", 9.5, ALI))
    # (c) 電流と H・L の電圧
    p = Plot(470, 36, 210, 160, (0, 20), (0, 3.5))
    o.append(T(436, 20, "(c) 電流と H・L の電圧", "start", 11, INK, True))
    o.append(p.axes(xl="ピンの電流 [mA]", yl="電圧 [V]", xt=[0, 5, 10, 15, 20], yt=[0, 1, 2, 3], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 3.3), (20, 2.5)], c=SIG, lw=2.2))
    o.append(p.line([(0, 0), (20, 0.8)], c=SIG, lw=2.2, dash="6 4"))
    o.append(D(p.X(10), p.Y(2.9), SIG, 3.6) + D(p.X(10), p.Y(0.4), SIG, 3.6))
    o.append(_f12_m(p.X(10), p.Y(2.9) - 9, [("V", "OH", True), (" = 2.9 V", None, False)], "middle", 9.5, SIG, True))
    o.append(_f12_m(p.X(10), p.Y(0.4) - 9, [("V", "OL", True), (" = 0.4 V", None, False)], "middle", 9.5, SIG, True))
    o.append(T(p.X(20), p.Y(2.5) + 15, "H（ソース）", "end", 9, SIG))
    o.append(T(p.X(20), p.Y(0.8) - 8, "L（シンク）", "end", 9, SIG))
    o.append(_f12_m(14, 268, [("H の電圧 ", None, False), ("V", "OH", True), (" = ", None, False), ("V", "DD", True), (" − ", None, False), ("I", None, True), ("R", "o", True),
                              ("、L の電圧 ", None, False), ("V", "OL", True), (" = ", None, False), ("I", None, True), ("R", "o", True), ("（3.3 V・40 Ω の例）", None, False)], "start", 10, MUT))
    return SVG(700, 280, o, "GPIO の出力。(a) 中の 2 つのトランジスタの一方がピンを電源か GND につなぎ、入っている方は数十 Ω の抵抗としてふるまう。(b) ピンから外へ電流を出すつなぎ方がソース、外からピンへ電流を受け入れるつなぎ方がシンク。(c) 電流を流すほど、H は下がり L は上がる。")
F["e12_gpio"] = _f12_gpio()

# ---- 1 節: 負荷の電流と GPIO ----
def _f12_loads():
    o = []
    lo, hi = 1e-7, 10.0
    x0, w = 210, 440
    X = lambda v: x0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * w
    rows = [("ほかの IC の入力", 1e-7, 1e-6, GRN, "漏れ電流だけ", ""),
            ("MOSFET のゲート", 1e-7, 1e-6, GRN, "入れ切りの瞬間だけ流れる", ""),
            ("圧電ブザー", 5e-4, 5e-3, GRN, "", ""),
            ("表示の LED", 5e-4, 1e-2, GRN, "", ""),
            ("フォトカプラの LED", 3e-3, 2e-2, GRN, "", ""),
            ("リレーのコイル", 2e-2, 1.2e-1, ALI, "", "コイル"),
            ("小さな DC モータ", 5e-2, 3.0, ALI, "", "コイル・起動で数倍"),
            ("ソレノイド", 1e-1, 2.0, ALI, "", "コイル"),
            ("ヒータ・ランプ", 2e-1, 8.0, ALI, "", "")]
    y0, rh = 46, 25
    ytop, ybot = y0 - 8, y0 + len(rows) * rh
    # GPIO の範囲
    o.append(RECT(X(lo), ytop, X(2e-2) - X(lo), ybot - ytop, 0, GSOFT, "none", 0, op=0.55))
    o.append(RECT(X(2e-3), ytop, X(2e-2) - X(2e-3), ybot - ytop, 0, GOSOFT, "none", 0))
    o.append(W(X(2e-2), ytop - 14, X(2e-2), ybot, c=GLD, lw=1.6, dash="5 3"))
    o.append(T(X(2e-2) - 4, ytop - 18, "ピン 1 本の上限（数 mA〜20 mA）", "end", 9.5, GLD, True))
    o.append(W(X(1e-1), ytop - 4, X(1e-1), ybot, c=MUT, lw=1.2, dash="2 3"))
    o.append(T(X(1e-1) + 4, ytop + 6, "全体の上限の例 100 mA", "start", 9, MUT))
    for v, lab in ((1e-7, "0.1 µA"), (1e-6, "1 µA"), (1e-5, "10 µA"), (1e-4, "100 µA"), (1e-3, "1 mA"), (1e-2, "10 mA"), (1e-1, "100 mA"), (1.0, "1 A"), (10.0, "10 A")):
        o.append(W(X(v), ybot, X(v), ybot + 4, c=MUT, lw=1))
        o.append(T(X(v), ybot + 16, lab, "middle", 9, MUT))
    o.append(T(x0 + w / 2, ybot + 32, "負荷が使う電流（代表値の範囲。対数目盛）", "middle", 10, MUT))
    for i, (nm, a, b, c, note, kind) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(x0 - 76, y + 12, nm, "end", 10, INK, True))
        o.append(T(x0 - 68, y + 12, "○ 直接" if c == GRN else "× スイッチで", "start", 9.5, c, True))
        o.append(RECT(X(a), y + 2, max(X(b) - X(a), 4), rh - 9, 3, soft(c), c, 1.2))
        if note:
            o.append(T(X(b) + 6, y + 12, note, "start", 9, MUT))
        if kind:
            o.append(T(X(a) - 5, y + 12, kind, "end", 9, ALI, halo=True))
    return SVG(700, ybot + 44, o, "負荷が使う電流の桁と、GPIO で直接駆動できる範囲（どちらも代表値）。直接駆動できるのは数 mA までのもの。リレー・モータ・ソレノイドはコイルを持ち、電流が大きく、切った瞬間に大きな電圧が生じるので、MOSFET などのスイッチで入れ切りする。")
F["e12_loads"] = _f12_loads()

# ---- 2 節: 電流制限抵抗 ----
def _f12_led_fig():
    o = []
    o.append(T(14, 20, "(a) 回路と電圧の配分（5 mA のとき）", "start", 11, INK, True))
    # 回路: マイコン（R_o）→ R → LED → GND
    y = 92
    o.append(RECT(16, 50, 112, 86, 8, SSOFT, SIG, 1.3))
    o.append(T(26, 128, "マイコン", "start", 9.5, SIG, True))
    o.append(W(40, 76, 40, y, 60, y, c=SIG, lw=1.5) + _f12_resh(60, 104, y, c=SIG) + W(104, y, 128, y, c=SIG, lw=1.5))
    o.append(T(40, 72, "3.3 V", "middle", 9, GLD, True))
    o.append(_f12_m(82, y + 20, [("R", "o", True), (" 40 Ω", None, False)], "middle", 9.5, SIG))
    o.append(_f12_pin(128, y))
    o.append(W(132, y, 156, y, c=INK, lw=1.5) + _f12_resh(156, 206, y) + W(206, y, 232, y, c=INK, lw=1.5))
    o.append(_f12_m(181, y + 20, [("R", None, True), (" 220 Ω", None, False)], "middle", 9.5, INK))
    o.append(_f12_led(240, y, True, PUR) + W(246, y, 270, y, 270, y + 22, c=INK, lw=1.5) + _f12_gnd(270, y + 22))
    o.append(_f12_m(240, y + 26, [("V", "F", True), (" 2.0 V", None, False)], "middle", 9.5, PUR))
    o.append(ARR(140, y - 14, 172, y - 14, c=ALI, lw=1.5, head=6))
    o.append(_f12_m(176, y - 10, [("I", None, True), (" = 5 mA", None, False)], "start", 9.5, ALI, True))
    # 電圧の配分の帯
    xb, yb, wb = 40, 168, 250
    segs = [(0.2, SIG, "0.2 V"), (1.1, INK, "1.1 V"), (2.0, PUR, "2.0 V")]
    xx = xb
    for v, c, lab in segs:
        ww = wb * v / 3.3
        o.append(RECT(xx, yb, ww, 22, 2, soft(c) if c != INK else MSOFT, c, 1.2))
        xx += ww
    o.append(W(xb + 3, yb + 24, xb + 3, yb + 42, c=SIG, lw=1))
    o.append(_f12_m(xb, yb + 54, [("I", None, True), ("R", "o", True), (" 0.2 V", None, False)], "start", 9.5, SIG, True))
    o.append(_f12_m(xb + wb * 0.75 / 3.3, yb + 38, [("I", None, True), ("R", None, True), (" 1.1 V", None, False)], "middle", 9.5, INK, True))
    o.append(_f12_m(xb + wb * 2.3 / 3.3, yb + 38, [("V", "F", True), (" 2.0 V", None, False)], "middle", 9.5, PUR, True))
    o.append(DIM(xb, yb - 8, xb + wb, yb - 8, None, c=GLD))
    o.append(_f12_m(xb + wb / 2, yb - 13, [("V", "DD", True), (" = 3.3 V を 3 つに配る", None, False)], "middle", 9.5, GLD, True))
    # (b) 筆算
    x0 = 340
    o.append(T(x0, 20, "(b) 抵抗を求める手順", "start", 11, INK, True))
    o.append(RECT(x0, 34, 346, 188, 8, PAN, LIN, 1.2))
    rows = [("①", [("V", "DD", True), (" − ", None, False), ("V", "F", True)], "3.3 V − 2.0 V", "= 1.3 V", "抵抗 2 つにかかる電圧"),
            ("②", [("÷ ", None, False), ("I", None, True)], "1.3 V ÷ 5 mA", "= 260 Ω", "抵抗 2 つの和"),
            ("③", [("− ", None, False), ("R", "o", True)], "260 Ω − 40 Ω", "= 220 Ω", "電流制限抵抗 R")]
    for i, (no, sym, calc, res, note) in enumerate(rows):
        y = 64 + i * 48
        o.append(T(x0 + 14, y, no, "start", 11, SIG, True))
        o.append(_f12_m(x0 + 36, y, sym, "start", 11, INK))
        o.append(T(x0 + 128, y, calc, "start", 11, INK, mono=True))
        o.append(T(x0 + 334, y, res, "end", 11, INK, True, mono=True))
        o.append(T(x0 + 128, y + 18, note, "start", 9.5, MUT))
        if i < 2:
            o.append(W(x0 + 120, y + 26, x0 + 336, y + 26, c=LIN, lw=1))
    o.append(T(x0 + 14, 206, "白（2.9 V）なら ① が 0.4 V しかなく、ばらつきが効く", "start", 9.5, ALI))
    return SVG(700, 234, o, "電流制限抵抗の決め方（3.3 V、赤の LED、5 mA の例）。電源の電圧を、出力の抵抗・電流制限抵抗・LED の 3 つに配る。LED の電圧を引いた残りを電流で割り、出力の抵抗を引く。")
F["e12_led"] = _f12_led_fig()

# ---- 2 節: 電池の電圧と LED の電流 ----
def _f12_ledvdd():
    o = []
    VF, Rt = 2.0, 340.0
    pa = Plot(84, 34, 250, 170, (2.0, 3.4), (0, 4.0))
    o.append(T(14, 20, "(a) LED の電流（抵抗 300 Ω、出力の抵抗 40 Ω）", "start", 11, INK, True))
    o.append(RECT(pa.X(2.2), pa.y, pa.X(3.0) - pa.X(2.2), pa.h, 0, GOSOFT, "none", 0, op=0.6))
    o.append(T(pa.X(2.6), pa.y + 12, "CR2032 で使う範囲", "middle", 9, GLD))
    o.append(pa.axes(xl="電池の電圧 [V]", yl="点いている間の電流 [mA]", xt=[2.0, 2.2, 2.6, 3.0, 3.4], yt=[0, 1, 2, 3, 4], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(pa.line([(2.0, 0), (3.4, (3.4 - VF) / Rt * 1e3)], c=PUR, lw=2.2))
    for v in (3.0, 2.6, 2.2):
        i = (v - VF) / Rt * 1e3
        o.append(D(pa.X(v), pa.Y(i), PUR, 3.6))
        o.append(T(pa.X(v) - 6, pa.Y(i) - 7, "%.2f mA" % i, "end", 9, PUR, True, halo=True))
    # 白（抵抗なし・出力の抵抗だけ）
    o.append(pa.line([(2.9, 0), (3.06, 4.0)], c=ALI, lw=1.8, dash="5 3"))
    # (b) 平均 1 mA にするデューティ
    pb = Plot(438, 34, 250, 170, (2.0, 3.4), (0, 100))
    o.append(T(380, 20, "(b) 平均 1 mA を保つデューティ", "start", 11, INK, True))
    o.append(pb.axes(xl="電池の電圧 [V]", yl="デューティ [%]", xt=[2.0, 2.34, 2.6, 3.0, 3.4], yt=[0, 25, 50, 75, 100], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    pts = []
    for k in range(0, 141):
        v = 2.34 + (3.4 - 2.34) * k / 140
        pts.append((v, min(100.0, 1.0 / ((v - VF) / Rt * 1e3) * 100)))
    o.append(pb.line(pts, c=SIG, lw=2.2))
    o.append(pb.line([(2.34, 0), (2.34, 100)], c=ALI, lw=1.4, dash="5 3"))
    o.append(pb.line([(2.0, 100), (2.34, 100)], c=ALI, lw=2.2))
    o.append(T(pb.X(2.34) - 4, pb.Y(60), "補正できない", "end", 9, ALI, True, halo=True))
    for v in (3.0, 2.6, 2.4):
        d = 1.0 / ((v - VF) / Rt * 1e3) * 100
        o.append(D(pb.X(v), pb.Y(d), SIG, 3.6))
        o.append(T(pb.X(v) + 6, pb.Y(d) - 6, "%.0f %%" % d, "start", 9, SIG, True, halo=True))
    o.append(LEGEND(84, 262, [(PUR, "赤の LED（2.0 V）。電池が 3.0 V から 2.2 V へ下がると 1/5 に"), (ALI, "白の LED（2.9 V）: 抵抗 0 でもこの急な傾き")], sz=9.5, gap=14))
    return SVG(700, 272, o, "電池で直接動くマイコンで LED を点けるとき（CR2032、3.0 V で 3 mA に決めた例）。(a) 電池の電圧が 3.0 V から 2.2 V へ下がると、抵抗にかかる電圧が 1.0 V から 0.2 V になり、電流は 1/5 になる。白の LED は抵抗で電流を決められない。(b) PWM のデューティで補正すれば、2.34 V までは平均の電流を保てる。")
F["e12_ledvdd"] = _f12_ledvdd()

# ---- 2 節: PWM の波形 ----
def _f12_pwm():
    o = []
    x0, wd = 120, 520
    per = wd / 3.0
    Ion = 3.0
    for k, D in enumerate((0.25, 0.5, 0.75)):
        y0 = 30 + k * 78
        h = 46
        Y = lambda i: y0 + h - i / Ion * h
        o.append(T(14, y0 + 20, "D = %d %%" % (D * 100), "start", 11, INK, True))
        o.append(_f12_m(14, y0 + 37, [("平均 ", None, False), ("D", None, True), ("I", "on", True), (" = %.3g mA" % (D * Ion), None, False)], "start", 9.5, SIG))
        o.append(W(x0, Y(0), x0 + wd + 10, Y(0), c=MUT, lw=1))
        pts = [(x0, Y(0))]
        for n in range(3):
            xa = x0 + n * per
            pts += [(xa, Y(0)), (xa, Y(Ion)), (xa + D * per, Y(Ion)), (xa + D * per, Y(0))]
            o.append(RECT(xa, Y(Ion), D * per, Y(0) - Y(Ion), 0, PSOFT, "none", 0))
        pts.append((x0 + wd, Y(0)))
        o.append(PL(pts, c=PUR, lw=2))
        o.append(W(x0, Y(D * Ion), x0 + wd, Y(D * Ion), c=SIG, lw=1.6, dash="6 4"))
        if k == 0:
            o.append(DIM(x0, y0 - 6, x0 + per, y0 - 6, None, c=MUT))
            o.append(_f12_m(x0 + per / 2, y0 - 11, [("周期 ", None, False), ("T", None, True)], "middle", 9.5, MUT))
            o.append(DIM(x0 + per, Y(Ion) + 10, x0 + per + D * per, Y(Ion) + 10, None, c=PUR))
            o.append(_f12_m(x0 + per + D * per + 6, Y(Ion) + 14, [("t", "on", True), (" = ", None, False), ("DT", None, True)], "start", 9.5, PUR))
            o.append(_f12_m(x0 + wd + 12, Y(Ion) + 4, [("I", "on", True)], "start", 10, PUR, True))
            o.append(T(x0 + wd + 12, Y(0) + 4, "0", "start", 9.5, MUT))
    ya = 30 + 3 * 78 - 10
    o.append(W(x0, ya, x0 + wd, ya, c=MUT, lw=1))
    for n in range(4):
        o.append(W(x0 + n * per, ya, x0 + n * per, ya + 4, c=MUT, lw=1))
        o.append(T(x0 + n * per, ya + 16, ("%dT" % n) if n > 1 else ("T" if n == 1 else "0"), "middle", 9.5, MUT))
    o.append(T(x0 + wd, ya + 30, "時間", "end", 9.5, MUT))
    o.append(T(14, ya + 30, "紫: LED の電流（点いている間 3 mA の例）　破線: 平均の電流", "start", 9.5, MUT))
    return SVG(700, ya + 40, o, "PWM の波形と平均の電流。周期 T ごとに、デューティ比 D の割合だけ点ける。点いている間の電流は変わらず、平均の電流がその D 倍になる。周波数が十分高ければ、目は平均の光の量を明るさとして感じる。")
F["e12_pwm"] = _f12_pwm()

# ---- 2 節: ちらつきと PWM の周波数 ----
def _f12_flicker():
    o = []
    lo, hi = 10.0, 1e5
    x0, w = 60, 600
    X = lambda f: x0 + (math.log10(f) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * w
    yb, hb = 40, 46
    # 帯（境はぼかす: 目安）
    o.append(RECT(X(10), yb, X(60) - X(10), hb, 0, ASOFT, "none", 0))
    for k in range(8):
        f1 = 60 * (2.0 ** (k / 8.0 * 1.0))
        o.append(RECT(X(60 * 1.09 ** k), yb, X(60 * 1.09 ** (k + 1)) - X(60 * 1.09 ** k) + 0.5, hb, 0, ASOFT, "none", 0, op=1 - (k + 1) / 9.0))
    o.append(RECT(X(110), yb, X(1500) - X(110), hb, 0, GOSOFT, "none", 0))
    for k in range(8):
        a, b = 1500 * 1.12 ** k, 1500 * 1.12 ** (k + 1)
        o.append(RECT(X(a), yb, X(b) - X(a) + 0.5, hb, 0, GOSOFT, "none", 0, op=1 - (k + 1) / 9.0))
    o.append(RECT(X(3500), yb, X(1e5) - X(3500), hb, 0, GSOFT, "none", 0))
    o.append(T(X(24), yb + 19, "止まって見ていても", "middle", 9.5, ALI, True))
    o.append(T(X(24), yb + 33, "点滅が分かる", "middle", 9.5, ALI, True))
    o.append(T(X(400), yb + 19, "目を動かす・光が動くと", "middle", 9.5, GLD, True))
    o.append(T(X(400), yb + 33, "点の列に見えることがある", "middle", 9.5, GLD, True))
    o.append(T(X(19000), yb + 19, "見えにくい（カメラでは", "middle", 9.5, GRN, True))
    o.append(T(X(19000), yb + 33, "縞が写ることがある）", "middle", 9.5, GRN, True))
    o.append(T(x0, yb - 10, "ちらつきの見え方（代表的な目安。人・明るさ・見方で変わる。境ははっきりしない）", "start", 10, INK, True))
    # 軸
    ya = yb + hb + 8
    o.append(W(x0, ya, x0 + w, ya, c=MUT, lw=1.2))
    for f, lab in ((10, "10 Hz"), (100, "100 Hz"), (1000, "1 kHz"), (1e4, "10 kHz"), (1e5, "100 kHz")):
        o.append(W(X(f), ya, X(f), ya + 4, c=MUT, lw=1))
        o.append(T(X(f), ya + 16, lab, "middle", 9.5, MUT))
    o.append(T(x0, ya + 32, "PWM の周波数（対数目盛）", "start", 9.5, MUT))
    # タイマの設定
    marks = [(32768 / 256, "32.768 kHz ÷ 256 段", "= 128 Hz", 0), (32768 / 32, "32.768 kHz ÷ 32 段", "= 1024 Hz", 1),
             (16e6 / 1000, "16 MHz ÷ 1000 段", "= 16 kHz", 0), (16e6 / 256, "16 MHz ÷ 256 段", "= 62.5 kHz", 1)]
    for f, l1, l2, row in marks:
        yy = ya + 50 + row * 36
        o.append(W(X(f), ya - 2, X(f), yy - 12, c=SIG, lw=1, dash="2 2"))
        o.append(D(X(f), ya, SIG, 3.6))
        o.append(T(X(f), yy, l1, "middle", 9.5, SIG, True))
        o.append(T(X(f), yy + 13, l2, "middle", 9.5, SIG))
    o.append(_f12_m(x0, ya + 128, [("タイマの PWM の周波数 ", None, False), ("f", None, True), (" = ", None, False), ("f", "clk", True), (" ÷ ", None, False), ("N", None, True),
                                   ("（", None, False), ("N", None, True), (" は 1 周期の段の数）。眠る間も動く 32.768 kHz では、段を細かくすると周波数が下がる", None, False)], "start", 9.5, MUT))
    return SVG(700, ya + 140, o, "PWM の周波数と、ちらつきの見え方の目安。タイマのクロックを、明るさの段の数で割った値が PWM の周波数になる。眠る間も動く遅いクロックで細かい段を使うと、周波数が低くなり、目を動かしたときに点の列に見えることがある。")
F["e12_flicker"] = _f12_flicker()

# ---- 3 節: ローサイドとハイサイド ----
def _f12_lowhigh():
    o = []
    # (a) ローサイド
    o.append(T(14, 20, "(a) ローサイドスイッチ（N チャネル）", "start", 11, INK, True))
    xl = 190
    o.append(W(xl - 40, 44, xl + 40, 44, c=GLD, lw=2.2) + T(xl + 46, 48, "+12 V", "start", 10, GLD, True))
    o.append(W(xl, 44, xl, 60, c=INK, lw=1.5))
    o.append(BOX(xl - 52, 58, 104, 46, "負荷", "切っても端子は 12 V", PUR, PSOFT, PUR, sz=11, ssz=9, sc=ALI))
    o.append(W(xl, 104, xl, 138, c=INK, lw=1.5))
    o.append(D(xl, 120, INK, 2.6))
    o.append(_f12_fet(xl, 160, "N", SIG))
    o.append(W(xl, 182, xl, 196, c=INK, lw=1.5) + _f12_gnd(xl, 196))
    # ゲート: GPIO → R_g → G、R_pd
    xg = xl - 24
    o.append(_f12_pin(40, 160) + W(44, 160, 70, 160, c=SIG, lw=1.5) + _f12_resh(70, 110, 160, c=SIG) + W(110, 160, xg, 160, c=SIG, lw=1.5))
    o.append(T(40, 148, "GPIO", "middle", 9.5, SIG, True))
    o.append(_f12_m(90, 178, [("R", "g", True)], "middle", 9.5, SIG))
    o.append(D(140, 160, SIG, 2.6) + W(140, 160, 140, 170, c=SIG, lw=1.4) + _f12_resv(140, 170, 200, c=SIG) + W(140, 200, 140, 206, c=SIG, lw=1.4) + _f12_gnd(140, 206))
    o.append(_f12_m(128, 192, [("R", "pd", True)], "end", 9.5, SIG))
    # 故障: 負荷の下の線が GND に触れる
    o.append(W(xl, 120, xl + 60, 120, xl + 60, 168, c=ALI, lw=1.6, dash="5 3") + _f12_gnd(xl + 60, 168, ALI))
    o.append(T(xl + 68, 178, "線が GND に触れると", "start", 9.5, ALI, True))
    o.append(T(xl + 68, 192, "負荷が入り、切れない", "start", 9.5, ALI, True))
    # (b) ハイサイド
    x0 = 358
    o.append(T(x0, 20, "(b) ハイサイドスイッチ（P チャネル）", "start", 11, INK, True))
    xh = 520
    o.append(W(xh - 110, 44, xh + 40, 44, c=GLD, lw=2.2) + T(xh + 46, 48, "+12 V", "start", 10, GLD, True))
    o.append(W(xh, 44, xh, 54, c=INK, lw=1.5))
    o.append(_f12_fet(xh, 76, "P", SIG))
    o.append(W(xh, 98, xh, 128, c=INK, lw=1.5) + D(xh, 112, INK, 2.6))
    o.append(BOX(xh - 44, 128, 88, 46, "負荷", "切ると 0 V", PUR, PSOFT, PUR, sz=11, ssz=9, sc=GRN))
    o.append(W(xh, 174, xh, 196, c=INK, lw=1.5) + _f12_gnd(xh, 196))
    # ゲート: ソースへ引く抵抗、Q2 で GND へ引く
    xg2 = xh - 24
    o.append(W(xg2, 76, xg2 - 34, 76, c=SIG, lw=1.5) + D(xg2 - 34, 76, SIG, 2.6))
    o.append(W(xg2 - 34, 76, xg2 - 34, 70, c=SIG, lw=1.4) + _f12_resv(xg2 - 34, 46, 70, c=SIG, n=4) + D(xg2 - 34, 44, GLD, 2.6))
    o.append(T(xg2 - 42, 62, "ソースへ引く", "end", 9, SIG))
    o.append(W(xg2 - 34, 76, xg2 - 34, 96, c=SIG, lw=1.4) + _f12_resv(xg2 - 34, 96, 118, c=SIG, n=4) + W(xg2 - 34, 118, xg2 - 34, 132, c=SIG, lw=1.4))
    o.append(_f12_fet(xg2 - 34, 154, "N", SIG, lab=False))
    o.append(W(xg2 - 34, 176, xg2 - 34, 196, c=SIG, lw=1.4) + _f12_gnd(xg2 - 34, 196))
    o.append(_f12_pin(x0 + 22, 154) + W(x0 + 26, 154, xg2 - 58, 154, c=SIG, lw=1.5))
    o.append(D(x0 + 64, 154, SIG, 2.6) + W(x0 + 64, 154, x0 + 64, 162, c=SIG, lw=1.4) + _f12_resv(x0 + 64, 162, 186, c=SIG, n=4) + W(x0 + 64, 186, x0 + 64, 196, c=SIG, lw=1.4) + _f12_gnd(x0 + 64, 196))
    o.append(T(x0 + 22, 142, "GPIO", "middle", 9.5, SIG, True))
    o.append(T(xg2 - 34, 224, "小さな N チャネル", "middle", 9, SIG))
    o.append(W(xh, 112, xh + 60, 112, xh + 60, 168, c=ALI, lw=1.6, dash="5 3") + _f12_gnd(xh + 60, 168, ALI))
    o.append(T(xh + 68, 178, "触れても負荷は入らない", "start", 9.5, GRN, True))
    o.append(T(xh + 68, 192, "（電源の短絡で気づく）", "start", 9, MUT))
    o.append(T(14, 236, "(a) GPIO の H でゲートを直接動かせる。負荷は電源につながったままで、切ると負荷の GND の側が浮く。", "start", 9.5, MUT))
    o.append(T(14, 252, "(b) ソースを電源の側に。負荷の電源がマイコンの電源より高いと、小さな N チャネルでゲートを引き下げて入れる。", "start", 9.5, MUT))
    return SVG(700, 262, o, "ローサイドとハイサイドの入れ方（負荷の電源は 12 V の例）。破線は、負荷の線が GND に触れる故障。ローサイドでは負荷が入ったままになり、ハイサイドでは負荷は入らず、電源の短絡として気づける。ゲートと GND の間の抵抗（プルダウン）とゲート抵抗は、この節の後半で扱う。")
F["e12_lowhigh"] = _f12_lowhigh()

# ---- 3 節: ロジックレベル MOSFET ----
def _f12_logic():
    o = []
    x0, w = 190, 480
    X = lambda v: x0 + v / 10.0 * w
    yA, yB, rh = 52, 140, 50
    ytop, ybot = 34, yB + rh + 6
    # GPIO の H の範囲
    o.append(RECT(X(2.2), ytop, X(3.3) - X(2.2), ybot - ytop, 0, SSOFT, "none", 0))
    o.append(W(X(3.3), ytop - 4, X(3.3), ybot, c=SIG, lw=1.6))
    o.append(T(X(2.75), ytop - 8, "マイコンの H（2.2〜3.3 V）", "middle", 9.5, SIG, True))
    for row, (y, name, th, specs, verdict, vc) in enumerate((
            (yA, "標準の MOSFET", (2.0, 4.0), [(10.0, "20 mΩ"), (4.5, "30 mΩ")], "3.3 V では保証なし", ALI),
            (yB, "ロジックレベル", (0.5, 1.2), [(4.5, "25 mΩ"), (2.5, "35 mΩ"), (1.8, "55 mΩ")], "3.3 V で 35 mΩ 以下", GRN))):
        o.append(T(14, y + 20, name, "start", 11, INK, True))
        o.append(T(14, y + 36, "MOSFET（例）" if row else "（例）", "start", 9.5, MUT))
        vmin = min(v for v, _ in specs)
        # 保証の無い範囲
        o.append(RECT(X(0), y + 4, X(vmin) - X(0), rh - 16, 2, MSOFT, "none", 0))
        o.append(T(X(0) + 4, y + 32, "オン抵抗の保証なし", "start", 9, MUT, halo=True))
        # しきい値
        o.append(RECT(X(th[0]), y + 6, X(th[1]) - X(th[0]), 10, 2, GOSOFT, GLD, 1.2))
        o.append(T(X(th[1]) + 4, y + 15, "しきい値", "start", 9, GLD, True, halo=True))
        for v, lab in specs:
            o.append(D(X(v), y + 22, PUR, 4.2))
            an = "end" if v == 1.8 else ("start" if v == 2.5 else "middle")
            o.append(T(X(v) + (6 if an == "end" else (-6 if an == "start" else 0)), y + rh - 2, lab, an, 9.5, PUR, True, halo=True))
        o.append(T(14, y + 56, "→ " + verdict, "start", 9.5, vc, True))
    o.append(W(x0, ybot, x0 + w, ybot, c=MUT, lw=1.2))
    for v in range(0, 11, 1):
        o.append(W(X(v), ybot, X(v), ybot + 4, c=MUT, lw=1))
        if v in (0, 2, 4, 6, 8, 10) or v == 1:
            o.append(T(X(v), ybot + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(_f12_m(x0 + w, ybot + 32, [("ゲートとソースの間の電圧 ", None, False), ("V", "GS", True), (" [V]", None, False)], "end", 10, MUT))
    o.append(T(14, ybot + 52, "金: しきい値の範囲（ドレインに 0.25 mA などの小さな電流が流れ始める電圧）。紫の点: オン抵抗の上限が保証された電圧と値。", "start", 9.5, MUT))
    return SVG(700, ybot + 62, o, "MOSFET のデータシートで見る 2 つの値（例の値）。しきい値は、電流が流れ始める電圧で、入り切る電圧ではない。マイコンの H で入れるには、その電圧以下でオン抵抗が保証された MOSFET（ロジックレベル MOSFET）を選ぶ。")
F["e12_logic"] = _f12_logic()

# ---- 3 節: ゲートのプルダウン ----
def _f12_gate():
    o = []
    # 左: 回路
    for k, (title, pd) in enumerate((("(a) プルダウンなし", False), ("(b) プルダウンあり", True))):
        y0 = 30 + k * 116
        o.append(T(14, y0, title, "start", 11, ALI if not pd else GRN, True))
        xf = 170
        o.append(W(xf, y0 + 12, xf, y0 + 22, c=INK, lw=1.5) + T(xf + 8, y0 + 20, "負荷へ（12 V）", "start", 9, PUR))
        o.append(_f12_fet(xf, y0 + 44, "N", SIG, lab=False))
        o.append(W(xf, y0 + 66, xf, y0 + 74, c=INK, lw=1.5) + _f12_gnd(xf, y0 + 74))
        o.append(_f12_pin(26, y0 + 44) + W(30, y0 + 44, 50, y0 + 44, c=SIG, lw=1.5) + _f12_resh(50, 86, y0 + 44, c=SIG) + W(86, y0 + 44, xf - 24, y0 + 44, c=SIG, lw=1.5))
        o.append(T(26, y0 + 62, "入力（リセット中）", "start", 9, SIG))
        if pd:
            o.append(D(116, y0 + 44, SIG, 2.6) + W(116, y0 + 44, 116, y0 + 50, c=SIG, lw=1.4) + _f12_resv(116, y0 + 50, y0 + 74, c=SIG, n=4) + _f12_gnd(116, y0 + 74))
            o.append(_f12_m(108, y0 + 84, [("R", "pd", True), (" 100 kΩ", None, False)], "end", 9, SIG))
        else:
            o.append(T(118, y0 + 72, "ゲートは浮く", "middle", 9, ALI, True))
    # 右: ゲートの電圧の時間変化（模式図）
    p = Plot(300, 30, 380, 170, (0, 30), (0, 2.0))
    o.append(p.axes(xl="電源を入れてからの時間 [ms]", yl="ゲートの電圧 [V]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 0.5, 1.0, 1.5, 2.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(RECT(p.X(0), p.y, p.X(20) - p.X(0), 12, 0, MSOFT, "none", 0))
    o.append(T(p.X(10), p.y + 9, "リセット・起動の間（ピンは入力）", "middle", 9, MUT))
    o.append(T(p.X(20) + 4, p.y + 9, "L を出す", "start", 9, SIG, True))
    o.append(p.line([(0, 1.0), (30, 1.0)], c=GLD, lw=1.2, dash="5 3"))
    o.append(T(p.X(30) - 2, p.Y(1.0) + 13, "しきい値の例 1.0 V", "end", 9, GLD, halo=True))
    # 12 V が入った瞬間（1 ms）に、ドレインの変化が容量でゲートへ入る: 12 V × 0.1/(0.1+1) ≈ 1.09 V
    dv = 12 * 0.1 / 1.1
    o.append(p.line([(0, 0), (1, 0), (1, dv), (20, dv * 0.97), (20, 0), (30, 0)], c=ALI, lw=2.2))
    pts = [(0, 0), (1, 0), (1, dv)] + [(1 + 0.01 * k, dv * math.exp(-0.01 * k / 0.1)) for k in range(1, 60)] + [(30, 0)]
    o.append(p.line(pts, c=GRN, lw=2.2))
    o.append(T(p.X(4), p.Y(dv) - 8, "(a) 残ったまま。負荷が半ば入る", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(4), p.Y(0.12), "(b) 0.1 ms ほどで 0 V に戻る", "start", 9.5, GRN, True, halo=True))
    o.append(T(14, 266, "1 ms で負荷の電源（12 V）が入り、ドレインの電圧の変化が、ゲートとドレインの間の容量（例 0.1 nF）とゲートとソースの間の容量（例 1 nF）の", "start", 9.5, MUT))
    o.append(T(14, 281, "比で、ゲートに約 1.1 V を加える（模式図）。プルダウンが無いと、この電荷は抜けない。", "start", 9.5, MUT))
    return SVG(700, 292, o, "リセットと起動の間のゲートの電圧。プルダウン抵抗が無いと、浮いたゲートに入った電荷が抜けず、しきい値を超えたまま負荷が半ば入ることがある。プルダウン抵抗があれば、ゲートは 0 V に戻り、負荷は切れたままになる。")
F["e12_gate"] = _f12_gate()

# ---- 4 節: コイルの例（12 V・400 Ω・0.4 H） ----
_F12_VS, _F12_RC, _F12_LC = 12.0, 400.0, 0.4
_F12_I0 = _F12_VS / _F12_RC
_F12_TAU = _F12_LC / _F12_RC

def _f12_coilckt(o, xc, ytop, label_c=True, stray=False):
    """電源・コイル（R と L）・MOSFET・GND の小さな回路。返り値はドレインの y。"""
    o.append(W(xc - 30, ytop, xc + 44, ytop, c=GLD, lw=2.2))
    o.append(W(xc, ytop, xc, ytop + 6, c=INK, lw=1.5))
    o.append(RECT(xc - 16, ytop + 6, 32, 66, 4, PSOFT, PUR, 1.0, dash="3 2"))
    o.append(_f12_resv(xc, ytop + 10, ytop + 32, c=PUR, h=4, n=4) + _f12_coilv(xc, ytop + 36, ytop + 66, c=PUR, n=3, r=5))
    o.append(W(xc, ytop + 32, xc, ytop + 36, c=PUR, lw=1.5) + W(xc, ytop + 66, xc, ytop + 78, c=INK, lw=1.5))
    yd = ytop + 78
    o.append(D(xc, yd, INK, 2.6))
    o.append(_f12_fet(xc, yd + 22, "N", SIG, lab=False))
    o.append(W(xc, yd + 44, xc, yd + 50, c=INK, lw=1.5) + _f12_gnd(xc, yd + 50))
    if stray:
        o.append(W(xc, yd, xc + 30, yd, c=MUT, lw=1.2, dash="3 2") + _f12_capv(xc + 30, yd, yd + 50, c=MUT, w=8) + _f12_gnd(xc + 30, yd + 50))
    return yd

def _f12_coil():
    o = []
    o.append(T(14, 20, "回路", "start", 11, INK, True))
    yd = _f12_coilckt(o, 66, 40, stray=True)
    o.append(T(66 + 24, 34, "12 V", "start", 9.5, GLD, True))
    o.append(T(86, 66, "R", "start", 9.5, PUR, True) + T(86, 98, "L", "start", 9.5, PUR, True))
    o.append(T(46, 84, "コイル", "end", 9, PUR, True))
    o.append(T(104, yd + 82, "配線などの", "middle", 9, MUT) + T(104, yd + 94, "容量 C", "middle", 9, MUT))
    o.append(T(58, yd + 10, "ドレイン", "end", 9, INK))
    # (a) 入れたとき
    p = Plot(212, 36, 200, 150, (0, 6), (0, 35))
    o.append(T(176, 20, "(a) 入れたときの電流", "start", 11, INK, True))
    o.append(p.axes(xl="入れてからの時間 [ms]", yl="コイルの電流 [mA]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 10, 20, 30], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 30), (6, 30)], c=MUT, lw=1.1, dash="5 3"))
    o.append(T(p.X(6) - 2, p.Y(30) - 5, "12 V ÷ 400 Ω = 30 mA", "end", 9, MUT, halo=True))
    pts = [(k * 0.05, 30 * (1 - math.exp(-k * 0.05 / (_F12_TAU * 1e3)))) for k in range(121)]
    o.append(p.line(pts, c=PUR, lw=2.2))
    i1 = 30 * (1 - math.exp(-1))
    o.append(W(p.X(1), p.Y(0), p.X(1), p.Y(i1), c=FNT, lw=1, dash="3 3") + D(p.X(1), p.Y(i1), PUR, 3.6))
    o.append(T(p.X(1) + 6, p.Y(i1) + 14, "τ = L/R = 1 ms で 63 %", "start", 9, PUR, True, halo=True))
    o.append(D(p.X(4.6), p.Y(29.7), PUR, 3.6) + T(p.X(4.6), p.Y(29.7) + 16, "4.6 ms で 99 %", "middle", 9, PUR, halo=True))
    # (b) クランプが無いときに切る
    q = Plot(500, 36, 180, 150, (0, 20), (0, 2000))
    o.append(T(462, 20, "(b) クランプ無しで切ったとき", "start", 11, ALI, True))
    o.append(q.axes(xl="切ってからの時間 [µs]", yl="ドレインの電圧 [V]", xt=[0, 5, 10, 15, 20], yt=[0, 500, 1000, 1500, 2000], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    Z = math.sqrt(_F12_LC / 100e-12)
    w0 = 1 / math.sqrt(_F12_LC * 100e-12)
    pts = [(k * 0.1, _F12_VS - _F12_VS * math.cos(w0 * k * 0.1e-6) + _F12_I0 * Z * math.sin(w0 * k * 0.1e-6)) for k in range(201)]
    o.append(q.line(pts, c=ALI, lw=2.2))
    o.append(q.line([(0, 60), (20, 60)], c=SIG, lw=1.4, dash="5 3"))
    o.append(T(q.X(20), q.Y(60) - 5, "MOSFET の耐圧の例 60 V", "end", 9, SIG, True, halo=True))
    o.append(T(q.X(10), q.Y(1900) + 16, "約 1900 V", "middle", 9.5, ALI, True, halo=True))
    o.append(_f12_m(176, 236, [("(b) は、コイルのエネルギー ½", None, False), ("L", None, True), ("I", "0", True), ("² が容量 ", None, False), ("C", None, True), (" へ移るとして ", None, False),
                               ("v", None, True), (" = ", None, False), ("I", "0", True), ("√(", None, False), ("L", None, True), ("/", None, False), ("C", None, True),
                               (")（", None, False), ("C", None, True), (" = 100 pF の例）。", None, False)], "start", 9.5, MUT))
    o.append(T(176, 251, "実際には、MOSFET がこの手前で壊れるか、電流を流してエネルギーを熱にする。", "start", 9.5, MUT))
    return SVG(700, 262, o, "誘導性負荷（12 V のリレーのコイル、R = 400 Ω、L = 0.4 H の例）。(a) 入れたときは、電流が時定数 L/R で 30 mA へ近づくだけである。(b) クランプが無いまま切ると、コイルの電流が配線などのわずかな容量へ流れ込み、ドレインの電圧は電源の電圧をはるかに超えて跳ね上がる。")
F["e12_coil"] = _f12_coil()

# ---- 4 節: クランプの比較 ----
_F12_CL = [("b", "(b) ダイオード", 0.8, _F12_VS + 0.8, TEA), ("c", "(c) ダイオード + ツェナー 24 V", 24.8, _F12_VS + 24.8, PUR),
           ("d", "(d) TVS 30 V（ドレイン−GND）", 30.0 - _F12_VS, 30.0, GLD)]

def _f12_t0(Vc):
    return _F12_TAU * math.log(1 + _F12_RC * _F12_I0 / Vc)

def _f12_clamp():
    o = []
    titles = [("(a) なし", ALI), ("(b) ダイオード", TEA), ("(c) ダイオード + ツェナー", PUR), ("(d) TVS（ドレインと GND）", GLD)]
    for k, (tt, tc) in enumerate(titles):
        xc = 60 + k * 172
        o.append(T(xc - 46, 20, tt, "start", 10.5, tc, True))
        yd = _f12_coilckt(o, xc, 40)
        xk = xc + 34
        if k == 1:
            o.append(W(xc, 40, xk, 40, c=TEA, lw=1.5) + W(xk, 40, xk, 70, c=TEA, lw=1.5) + _f12_dv(xk, 78, True, TEA) + W(xk, 86, xk, yd, xc, yd, c=TEA, lw=1.5))
            o.append(ARR(xk + 10, yd - 8, xk + 10, 52, c=ALI, lw=1.4, head=6, dash="4 3"))
        elif k == 2:
            o.append(W(xk, 40, xk, 54, c=PUR, lw=1.5) + _f12_zv(xk, 62, False, PUR) + W(xk, 70, xk, 84, c=PUR, lw=1.5) + _f12_dv(xk, 92, True, PUR) + W(xk, 100, xk, yd, xc, yd, c=PUR, lw=1.5))
            o.append(ARR(xk + 12, yd - 8, xk + 12, 52, c=ALI, lw=1.4, head=6, dash="4 3"))
        elif k == 3:
            o.append(W(xc, yd, xk, yd, xk, yd + 12, c=GLD, lw=1.5) + _f12_tvsv(xk, yd + 26, GLD) + W(xk, yd + 40, xk, yd + 50, c=GLD, lw=1.5) + _f12_gnd(xk, yd + 50))
            o.append(ARR(xk + 12, yd + 4, xk + 12, yd + 46, c=ALI, lw=1.4, head=6, dash="4 3"))
        else:
            o.append(T(xc + 22, yd + 4, "行き場が無い", "start", 9, ALI, True))
        res = ["約 1900 V（壊れる）", "最高 12.8 V・2.77 ms", "最高 36.8 V・0.39 ms", "最高 30 V・0.51 ms"][k]
        o.append(T(xc - 46, yd + 82, res, "start", 9.5, tc, True))
    o.append(T(14, 214, "赤の破線: 切った後のコイルの電流の通り道。(d) の電流は TVS から GND・電源を通ってコイルへ戻る。", "start", 9.5, MUT))
    # 波形
    pv = Plot(84, 250, 250, 130, (-0.5, 3.5), (0, 40))
    pi = Plot(430, 250, 250, 130, (-0.5, 3.5), (0, 32))
    o.append(T(14, 238, "ドレインの電圧", "start", 10.5, INK, True))
    o.append(T(380, 238, "コイルの電流", "start", 10.5, INK, True))
    o.append(pv.axes(xl="切ってからの時間 [ms]", yl="電圧 [V]", xt=[0, 1, 2, 3], yt=[0, 12, 24, 36], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(pi.axes(xl="切ってからの時間 [ms]", yl="電流 [mA]", xt=[0, 1, 2, 3], yt=[0, 10, 20, 30], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(pi.line([(-0.5, 3), (3.5, 3)], c=FNT, lw=1, dash="3 3"))
    o.append(T(pi.X(3.5) - 2, pi.Y(3) - 4, "10 %", "end", 9, MUT))
    for key, nm, Vc, Vpk, c in _F12_CL:
        t0 = _f12_t0(Vc) * 1e3
        o.append(pv.line([(-0.5, 0), (0, 0), (0, Vpk), (t0, Vpk), (t0, _F12_VS), (3.5, _F12_VS)], c=c, lw=2))
        pts = [(-0.5, 30), (0, 30)]
        for j in range(1, 81):
            t = t0 * j / 80
            pts.append((t, max(0.0, ((_F12_I0 + Vc / _F12_RC) * math.exp(-t / (_F12_TAU * 1e3)) - Vc / _F12_RC) * 1e3)))
        pts.append((3.5, 0))
        o.append(pi.line(pts, c=c, lw=2))
    o.append(T(pv.X(0.5), pv.Y(36.8) + 13, "(c) 36.8 V", "start", 9, PUR, True, halo=True))
    o.append(T(pv.X(0.62), pv.Y(30) + 13, "(d) 30 V", "start", 9, GLD, True, halo=True))
    o.append(T(pv.X(2.9), pv.Y(12.8) - 6, "(b) 12.8 V", "end", 9, TEA, True, halo=True))
    o.append(T(pi.X(2.77) + 4, pi.Y(9), "(b) 2.77 ms", "start", 9, TEA, True, halo=True))
    o.append(T(pi.X(0.55) + 2, pi.Y(17), "(c)(d) 0.4〜0.5 ms", "start", 9, PUR, True, halo=True))
    return SVG(700, 420, o, "誘導性負荷を切るときのクランプの比較（12 V・400 Ω・0.4 H、切る前の電流 30 mA）。クランプの電圧が高いほど、コイルの電流は速く消えるが、MOSFET のドレインにかかる電圧は高くなる。(a) のクランプ無しは、電圧が図に収まらない。")
F["e12_clamp"] = _f12_clamp()

# ---- 5 節: リレーとソレノイド ----
def _f12_relaypanel(o, x0, on):
    """リレーの模式図。on=True でコイルに電流が流れ、鉄片が引き寄せられた状態。"""
    c = PUR
    # 鉄心とコイル
    o.append(RECT(x0 + 20, 108, 46, 58, 3, PSOFT, c, 1.3))
    for k in range(6):
        o.append(W(x0 + 20, 114 + k * 9, x0 + 66, 110 + k * 9, c=c, lw=1.0))
    o.append(RECT(x0 + 36, 96, 14, 12, 1, MSOFT, MUT, 1.2))
    o.append(T(x0 + 43, 182, "コイル", "middle", 9.5, c, True))
    # コイルの電流
    o.append(W(x0 + 20, 160, x0 + 8, 160, x0 + 8, 196, c=SIG if on else MUT, lw=1.4) + W(x0 + 66, 160, x0 + 78, 160, x0 + 78, 196, c=SIG if on else MUT, lw=1.4))
    o.append(T(x0 + 43, 206, "電流あり" if on else "電流なし", "middle", 9.5, SIG if on else MUT, True))
    # 鉄片（ちょうつがいは左）: off は右上がり、on は水平
    hx, hy = x0 + 14, 93
    ex = x0 + 150
    ye = 93 if on else 72
    ang_y = lambda x: hy + (ye - hy) * (x - hx) / (ex - hx)
    o.append(W(hx, hy, ex, ye, c=INK, lw=3))
    o.append(D(hx, hy, INK, 3.4))
    # ばね
    sx = x0 + 100
    sy = ang_y(sx)
    o.append(PL([(sx, sy - 2), (sx - 5, sy - 8), (sx + 5, sy - 14), (sx - 5, sy - 20), (sx + 5, sy - 26), (sx, sy - 32), (sx, 30)], c=MUT, lw=1.2))
    o.append(W(sx - 10, 30, sx + 10, 30, c=MUT, lw=2))
    o.append(T(sx + 10, 44, "ばね", "start", 9, MUT))
    # 接点
    o.append(RECT(ex - 2, 56, 34, 10, 1, GSOFT if not on else MSOFT, GRN if not on else MUT, 1.3))
    o.append(RECT(ex - 2, 100, 34, 10, 1, GSOFT if on else MSOFT, GRN if on else MUT, 1.3))
    o.append(T(ex + 36, 65, "NC", "start", 10, GRN if not on else MUT, True))
    o.append(T(ex + 36, 109, "NO", "start", 10, GRN if on else MUT, True))
    o.append(D(ex + 2, ye - 2 if not on else ye + 3, INK, 3.8))
    o.append(T(ex - 30, (ye + 20) if not on else (ye - 10), "共通", "middle", 9, INK))
    if on:
        o.append(ARR(x0 + 120, 60, x0 + 120, 76, c=SIG, lw=1.4, head=5))

def _f12_relay():
    o = []
    o.append(T(14, 18, "(a) 電流なし: 共通の接点が NC に触れる", "start", 10.5, INK, True))
    _f12_relaypanel(o, 10, False)
    o.append(T(250, 18, "(b) 電流あり: 引き寄せて NO に触れる", "start", 10.5, INK, True))
    _f12_relaypanel(o, 246, True)
    # (c) ソレノイド
    x0 = 494
    o.append(T(x0, 18, "(c) ソレノイド", "start", 10.5, INK, True))
    o.append(RECT(x0 + 20, 70, 90, 24, 2, PSOFT, PUR, 1.3) + RECT(x0 + 20, 116, 90, 24, 2, PSOFT, PUR, 1.3))
    for k in range(9):
        o.append(W(x0 + 26 + k * 10, 70, x0 + 22 + k * 10, 94, c=PUR, lw=1.0) + W(x0 + 26 + k * 10, 116, x0 + 22 + k * 10, 140, c=PUR, lw=1.0))
    o.append(RECT(x0 + 70, 98, 110, 14, 3, MSOFT, INK, 1.4))
    o.append(T(x0 + 150, 128, "プランジャ", "middle", 9, INK))
    o.append(ARR(x0 + 176, 88, x0 + 136, 88, c=SIG, lw=1.5, head=6))
    o.append(T(x0 + 160, 80, "引き込む", "middle", 9, SIG, True))
    o.append(T(x0 + 65, 160, "コイル", "middle", 9.5, PUR, True))
    o.append(T(x0, 186, "電気錠・電磁弁・機構の固定", "start", 9.5, MUT))
    # 選び方
    y = 232
    o.append(T(14, y, "安全な状態で選ぶ（電流が止まると、接点は (a) の側に戻る）", "start", 10.5, INK, True))
    rows = [("ファンヒータのヒータ", "NO で入れる → 止まると切れる", GRN),
            ("電気錠（閉じ込めない扉）", "電流が止まると開く形を選ぶ", GRN),
            ("ラッチングリレー", "止まっても保つ → 後始末と起動時に戻す", GLD)]
    for i, (a, b, c) in enumerate(rows):
        o.append(T(24, y + 22 + i * 18, a, "start", 9.5, INK, True))
        o.append(T(220, y + 22 + i * 18, b, "start", 9.5, c, True))
    return SVG(700, y + 70, o, "リレーとソレノイドの仕組み（模式図）。リレーは、コイルの磁力で鉄片を引き寄せて接点を動かす。コイルの側と接点の側は電気的に分かれている。電流が止まると、ばねで電流なしの側に戻るので、どちらの接点を使うかを安全な状態で決める。")
F["e12_relay"] = _f12_relay()

def _f12_pwmcoil(D, f, n_per=4, V=_F12_VS, R=_F12_RC, L=_F12_LC, VF=0.8):
    """PWM（還流ダイオード付き）でコイルを動かしたときの、落ち着いた後の電流（1 周期ずつ解析的に進める）。返り値は [(t [ms], i [mA]), ...]（n_per 周期分）。"""
    tau, T_ = L / R, 1.0 / f
    ton, toff = D * T_, (1 - D) * T_
    i = (D * V - (1 - D) * VF) / R
    for _ in range(4000):
        i1 = V / R + (i - V / R) * math.exp(-ton / tau)
        i2 = -VF / R + (i1 + VF / R) * math.exp(-toff / tau)
        i = max(i2, 0.0)
    pts = []
    for n in range(n_per):
        t0 = n * T_
        for k in range(11):
            t = ton * k / 10
            pts.append(((t0 + t) * 1e3, (V / R + (i - V / R) * math.exp(-t / tau)) * 1e3))
        i1 = pts[-1][1] / 1e3
        for k in range(1, 11):
            t = toff * k / 10
            pts.append(((t0 + ton + t) * 1e3, max(0.0, (-VF / R + (i1 + VF / R) * math.exp(-t / tau))) * 1e3))
    return pts

def _f12_hold():
    o = []
    Dh = 0.531
    p = Plot(70, 34, 380, 170, (0, 100), (0, 35))
    o.append(T(14, 20, "コイルの電流（12 V のリレー、20 kHz の PWM で保持）", "start", 11, INK, True))
    o.append(RECT(p.X(0), p.y, p.X(50) - p.X(0), p.h, 0, SSOFT, "none", 0, op=0.5))
    o.append(T(p.X(25), p.y + 13, "吸引: 100 %", "middle", 9.5, SIG, True))
    o.append(T(p.X(75), p.y + 13, "保持: PWM 53 %", "middle", 9.5, SIG, True))
    o.append(p.axes(xl="入れてからの時間 [ms]", yl="コイルの電流 [mA]", xt=[0, 20, 40, 50, 60, 80, 100], yt=[0, 10, 20, 30], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 22.5), (100, 22.5)], c=GLD, lw=1.2, dash="5 3"))
    o.append(T(p.X(48), p.Y(22.5) - 5, "吸引に要る電流の例（定格の 75 %）", "end", 9, GLD, halo=True))
    o.append(p.line([(0, 12), (100, 12)], c=ALI, lw=1.2, dash="5 3"))
    o.append(T(p.X(98), p.Y(12) + 13, "保持に要る電流の例（40 %）", "end", 9, ALI, halo=True))
    Ih = (Dh * _F12_VS - (1 - Dh) * 0.8) / _F12_RC * 1e3
    pts = [(k * 0.5, 30 * (1 - math.exp(-k * 0.5))) for k in range(101)]
    pts += [(50 + k * 0.25, Ih + (30 - Ih) * math.exp(-k * 0.25)) for k in range(1, 201)]
    o.append(RECT(p.X(52), p.Y(Ih + 0.25), p.X(100) - p.X(52), max(1.5, p.Y(Ih - 0.25) - p.Y(Ih + 0.25)), 0, PSOFT, "none", 0))
    o.append(p.line(pts, c=PUR, lw=2.2))
    o.append(T(p.X(76), p.Y(Ih) - 7, "平均 15 mA（揺れ 0.4 mA）", "middle", 9.5, PUR, True, halo=True))
    # 右: 電力と電流
    xb = 520
    o.append(T(xb - 30, 20, "入れ続けたときと保持", "start", 11, INK, True))
    bars = [("コイルの電力", 360.0, 90.0, "mW"), ("電源の電流", 30.0, 8.0, "mA")]
    for k, (nm, a, b, u) in enumerate(bars):
        y = 50 + k * 80
        o.append(T(xb - 30, y, nm, "start", 10, INK, True))
        for j, (v, lab, c) in enumerate(((a, "100 %", ALI), (b, "保持", GRN))):
            yy = y + 8 + j * 24
            ww = 120 * v / a
            o.append(RECT(xb, yy, ww, 16, 2, soft(c), c, 1.1))
            o.append(T(xb - 4, yy + 12, lab, "end", 9, MUT))
            o.append(T(xb + ww + 6, yy + 12, ("%.1f %s" % (v, u)) if v < 10 else ("%g %s" % (v, u)), "start", 9.5, c, True))
    # 下: 周波数と揺れ
    for k, (f, lab) in enumerate(((1e3, "1 kHz: 揺れ 7.8 mA"), (20e3, "20 kHz: 揺れ 0.4 mA"))):
        q = Plot(70 + k * 330, 268, 270, 70, (0, 2.0), (5, 25))
        o.append(T(q.x - 56, 252, "PWM " + lab, "start", 10, SIG if k else ALI, True))
        o.append(q.axes(xl="時間 [ms]（保持の途中の 2 ms）", yl="mA", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[5, 15, 25], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        pts = _f12_pwmcoil(Dh, f, n_per=int(round(2e-3 * f)))
        o.append(q.line(pts, c=PUR, lw=1.6))
    return SVG(700, 380, o, "リレーの吸引と保持（12 V・400 Ω・0.4 H の例）。初めの 50 ms は 100 % で入れて引き寄せ、その後はデューティ 53 % の PWM で平均 15 mA に下げる。コイルの電力は 1/4、電源の電流は約 1/4 になる。PWM の周期がコイルの時定数（1 ms）より十分短いと、電流の揺れは小さい。")
F["e12_hold"] = _f12_hold()

def _f12_contact():
    o = []
    # (a) 直流の誘導性負荷
    o.append(T(14, 20, "(a) 直流の誘導性負荷", "start", 10.5, INK, True))
    x = 40
    o.append(W(x, 44, x + 60, 44, c=GLD, lw=2.2) + T(x, 38, "+24 V", "start", 9.5, GLD, True))
    o.append(W(x + 30, 44, x + 30, 56, c=INK, lw=1.5) + _f12_swv(x + 30, 56, 80, False, INK) + W(x + 30, 80, x + 30, 92, c=INK, lw=1.5))
    o.append(T(x + 16, 72, "接点", "end", 9, INK))
    o.append(RECT(x + 18, 92, 24, 50, 3, PSOFT, PUR, 1.0, dash="3 2") + _f12_coilv(x + 30, 96, 138, c=PUR, n=3, r=5))
    o.append(T(x + 14, 122, "負荷", "end", 9, PUR))
    o.append(W(x + 30, 142, x + 30, 152, c=INK, lw=1.5) + _f12_gnd(x + 30, 152))
    o.append(W(x + 30, 92, x + 64, 92, x + 64, 108, c=TEA, lw=1.5) + _f12_dv(x + 64, 117, True, TEA) + W(x + 64, 126, x + 64, 142, x + 30, 142, c=TEA, lw=1.5))
    o.append(T(14, 206, "負荷に並列のダイオードで、", "start", 9.5, TEA, True))
    o.append(T(14, 220, "切る瞬間の電圧を抑える（4 節）", "start", 9.5, TEA, True))
    # (b) 交流の負荷
    x0 = 240
    o.append(T(x0, 20, "(b) 交流の負荷", "start", 10.5, INK, True))
    x = x0 + 30
    o.append(CIRC(x, 100, 14, GLD, 1.5, PAN) + PATH("M%g,%g q5,-10 10,0 q5,10 10,0" % (x - 10, 100), c=GLD, lw=1.4))
    o.append(W(x, 86, x, 44, x + 60, 44, c=INK, lw=1.5) + W(x, 114, x, 156, x + 120, 156, c=INK, lw=1.5))
    o.append(W(x + 60, 44, x + 60, 56, c=INK, lw=1.5) + _f12_swv(x + 60, 56, 80, False, INK) + W(x + 60, 80, x + 60, 100, x + 120, 100, c=INK, lw=1.5))
    o.append(T(x + 52, 70, "接点", "end", 9, INK))
    o.append(BOX(x + 104, 108, 32, 36, "負荷", None, PUR, PSOFT, PUR, sz=9))
    o.append(W(x + 120, 100, x + 120, 108, c=INK, lw=1.5) + W(x + 120, 144, x + 120, 156, c=INK, lw=1.5))
    # スナバ（接点に並列）
    o.append(W(x + 60, 50, x + 88, 50, c=TEA, lw=1.4) + _f12_resv(x + 88, 50, 66, c=TEA, h=4, n=3) + _f12_capv(x + 88, 66, 84, c=TEA, w=8) + W(x + 88, 84, x + 88, 92, x + 60, 92, c=TEA, lw=1.4))
    o.append(T(x + 96, 66, "スナバ", "start", 9, TEA, True))
    o.append(T(x0, 206, "接点にスナバ・バリスタ、", "start", 9.5, TEA, True))
    o.append(T(x0, 220, "ゼロクロスの近くで入れ切り（06 章）", "start", 9.5, TEA, True))
    # (c) ランプ・コンデンサの負荷: 閉じた瞬間の電流
    x0 = 470
    o.append(T(x0, 20, "(c) ランプ・コンデンサの負荷", "start", 10.5, INK, True))
    p = Plot(x0 + 34, 40, 180, 110, (0, 50), (0, 11))
    o.append(p.axes(xl="閉じてからの時間 [ms]", yl="定常に対する倍", xt=[0, 25, 50], yt=[0, 1, 5, 10], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    pts = [(0, 0), (0, 10)] + [(k * 0.5, 1 + 9 * math.exp(-k * 0.5 / 6.0)) for k in range(1, 101)]
    o.append(p.line(pts, c=ALI, lw=2))
    o.append(T(p.X(3), p.Y(10) + 3, "約 10 倍", "start", 9, ALI, True, halo=True))
    o.append(T(x0, 206, "閉じる瞬間の大きな電流で溶着しやすい。", "start", 9.5, ALI, True))
    o.append(T(x0, 220, "その負荷での定格を持つリレーを選ぶ", "start", 9.5, ALI, True))
    # 寿命
    y0 = 256
    o.append(T(14, y0, "電気的寿命 10 万回（定格の抵抗の負荷での代表値）を使い切るまでの年数", "start", 10.5, INK, True))
    lo, hi = 0.1, 30.0
    xb, wb = 230, 400
    Xl = lambda v: xb + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * wb
    rows = [("1 日 10 回", 1e5 / 10 / 365, GRN), ("1 日 200 回", 1e5 / 200 / 365, GLD), ("1 分ごと（1 日 1440 回）", 1e5 / 1440 / 365, ALI)]
    for i, (nm, yrs, c) in enumerate(rows):
        yy = y0 + 14 + i * 24
        o.append(T(xb - 8, yy + 12, nm, "end", 9.5, INK))
        o.append(RECT(xb, yy + 2, Xl(yrs) - xb, 15, 2, soft(c), c, 1.1))
        lab = ("%.0f 年" % yrs) if yrs >= 10 else (("%.1f 年" % yrs) if yrs >= 1 else ("%.0f 日" % (yrs * 365)))
        o.append(T(Xl(yrs) + 6, yy + 14, lab, "start", 9.5, c, True))
    ya = y0 + 14 + 3 * 24 + 4
    o.append(W(xb, ya, xb + wb, ya, c=MUT, lw=1))
    for v, lab in ((0.1, "0.1 年"), (1, "1 年"), (10, "10 年")):
        o.append(W(Xl(v), ya, Xl(v), ya + 4, c=MUT, lw=1) + T(Xl(v), ya + 16, lab, "middle", 9, MUT))
    return SVG(700, ya + 26, o, "接点を守る方法と、接点の寿命。誘導性負荷は切る瞬間に、ランプやコンデンサの負荷は閉じる瞬間に、接点を傷める。電気的寿命は回数で決まるので、入れ切りの回数が多い使い方では、年数がすぐに尽きる（横軸は対数目盛）。")
F["e12_contact"] = _f12_contact()

# ---- 6 節: ランプのソフトスタート（電池 3.0 V・0.5 Ω、470 µF、ランプ 2.8 V・0.5 A） ----
def _f12_lampsim(tramp, f=20e3, tend=0.1, dt=0.25e-6, rec=0.1e-3, E=3.0, Rin=0.5, Cb=470e-6, Rsw=0.05, Rh=5.6, Rcold=0.56, Prat=1.4, tauth=0.03):
    """ランプ（抵抗はフィラメントの温度 th で Rcold から Rh へ。th は一次遅れ）を PWM で入れる。返り値は区間ごとの (t, 電池の電流の平均, 電源の電圧の最低)。"""
    v, th, T_ = E, 0.0, 1.0 / f
    out, acc, n, vmn, nxt = [], 0.0, 0, E, rec
    N = int(tend / dt)
    for k in range(N):
        t = k * dt
        D = 1.0 if tramp <= 0 else min(1.0, t / tramp)
        on = True if D >= 1.0 else ((t % T_) < D * T_)
        R = Rcold + (Rh - Rcold) * th
        il = v / (R + Rsw) if on else 0.0
        ib = (E - v) / Rin
        v += (ib - il) * dt / Cb
        th += (il * il * R / Prat - th) * dt / tauth
        acc += ib; n += 1; vmn = min(vmn, v)
        if t + dt >= nxt:
            out.append((nxt, acc / n, vmn))
            acc, n, vmn, nxt = 0.0, 0, E, nxt + rec
    return out

def _f12_soft():
    o = []
    cases = [("(a) 一気に入れる", 0.0, ALI), ("(b) 50 ms かけて上げる（PWM 20 kHz）", 0.05, GRN)]
    for k, (title, tr, c) in enumerate(cases):
        x0 = 70 + k * 340
        res = _f12_lampsim(tr)
        o.append(T(x0 - 56, 20, title, "start", 11, c, True))
        pi = Plot(x0, 34, 250, 100, (0, 100), (0, 2.5))
        pv = Plot(x0, 176, 250, 100, (0, 100), (1.6, 3.2))
        o.append(pi.axes(yl="電池の電流 [A]", xt=[0, 25, 50, 75, 100], yt=[0, 0.5, 1.0, 1.5, 2.0, 2.5], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
        o.append(pv.axes(xl="入れてからの時間 [ms]", yl="電源の電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[1.6, 2.2, 2.6, 3.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(pi.line([(0, 0)] + [(t * 1e3, ib) for t, ib, _ in res], c=GLD, lw=2))
        o.append(pv.line([(0, 3.0)] + [(t * 1e3, vm) for t, _, vm in res], c=SIG, lw=2))
        o.append(pv.line([(0, 2.2), (100, 2.2)], c=ALI, lw=1.2, dash="5 3"))
        o.append(T(pv.X(100) - 2, pv.Y(2.2) + 13, "マイコンの最低 2.2 V", "end", 9, ALI, halo=True))
        ibm = max(ib for _, ib, _ in res); vmn = min(vm for _, _, vm in res)
        tpk = [t for t, ib, _ in res if ib == ibm][0] * 1e3
        tmn = [t for t, _, vm in res if vm == vmn][0] * 1e3
        o.append(D(pi.X(tpk), pi.Y(ibm), GLD, 3.6))
        o.append(T(pi.X(tpk) + 8, pi.Y(ibm) + 4, "最大 %.2f A" % ibm, "start", 9.5, GLD, True, halo=True))
        o.append(D(pv.X(tmn), pv.Y(vmn), c, 3.6))
        o.append(T(pv.X(tmn) + 8, pv.Y(vmn) + (14 if k == 0 else -8), "最低 %.2f V" % vmn + ("（リセット）" if vmn < 2.2 else ""), "start", 9.5, c, True, halo=True))
        if tr > 0:
            o.append(pi.line([(0, 0), (50, 2.5), (100, 2.5)], c=MUT, lw=1.1, dash="3 3"))
            o.append(T(pi.X(100) - 2, pi.Y(2.5) + 13, "破線: デューティ（50 ms で 100 %）", "end", 9, MUT, halo=True))
    o.append(T(14, 322, "電池: 起電力 3.0 V・内部抵抗 0.5 Ω。大容量コンデンサ 470 µF。ランプ: 2.8 V・0.5 A（冷えているとき 0.56 Ω）。", "start", 9.5, MUT))
    o.append(T(14, 337, "フィラメントの温度を一次遅れの簡単な模型で表し、例の値を細かい時間刻みで解いた。", "start", 9.5, MUT))
    return SVG(700, 348, o, "ランプを入れるときの電池の電流と電源の電圧。(a) 一気に入れると、冷えたフィラメントに大きな電流が流れ、電源の電圧が 2.2 V を下回ってマイコンがリセットされる。(b) PWM のデューティを 50 ms かけて上げると、フィラメントが温まる間に電流がならされ、電圧は 2.7 V より上にとどまる。")
F["e12_soft"] = _f12_soft()

def _f12_pulse3():
    o = []
    V, f, D = 3.0, 20e3, 0.1
    T_ = 1.0 / f
    ton = D * T_
    x0, wd = 172, 500
    tmax = 3 * T_ * 1e6
    rows = [("ランプ", "冷えた抵抗で決まる", "0.61 Ω で 4.9 A", 6.0, "A", PUR),
            ("コンデンサ", "配線とスイッチの抵抗だけ", "0.1 Ω・100 µF", 35.0, "A", ALI),
            ("コイル", "インダクタンスが抑える", "2 Ω・1 mH", 20.0, "mA", GRN)]
    for k, (nm, s1, s2, ymax, unit, c) in enumerate(rows):
        y0 = 30 + k * 92
        p = Plot(x0, y0, wd, 66, (0, tmax), (0, ymax))
        o.append(T(14, y0 + 18, nm, "start", 11, c, True))
        o.append(T(14, y0 + 34, s1, "start", 9.5, MUT))
        o.append(T(14, y0 + 48, s2, "start", 9.5, MUT))
        o.append(p.axes(xt=[0, 50, 100, 150], yt=[[0, 3, 6], [0, 15, 30], [0, 10, 20]][k], xfmt=(lambda v: "%g" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: "%g" % v, sz=9))
        o.append(T(x0 - 30, y0 - 4, unit, "middle", 9, MUT))
        pts = [(0, 0)]
        if k == 0:
            I = V / 0.61
            for n in range(3):
                a = n * T_ * 1e6
                pts += [(a, 0), (a, I), (a + ton * 1e6, I), (a + ton * 1e6, 0)]
            o.append(T(p.X(ton * 1e6) + 6, p.Y(I) + 4, "4.9 A", "start", 9.5, c, True))
        elif k == 1:
            vL, tau = 0.0, 0.1 * 100e-6
            for n in range(3):
                a = n * T_ * 1e6
                i0 = (V - vL) / 0.1
                pts += [(a, 0), (a, i0)]
                for j in range(1, 11):
                    t = ton * j / 10
                    pts.append((a + t * 1e6, i0 * math.exp(-t / tau)))
                pts.append((a + ton * 1e6, 0))
                o.append(T(p.X(a + ton * 1e6) + 5, p.Y(min(i0, ymax)) + 10, "%.0f A" % i0, "start", 9.5, c, True))
                vL = V - (V - vL) * math.exp(-ton / tau)
        else:
            R, L, VF = 2.0, 1e-3, 0.8
            i = 0.0
            for n in range(3):
                a = n * T_ * 1e6
                for j in range(0, 11):
                    t = ton * j / 10
                    pts.append((a + t * 1e6, (V / R + (i - V / R) * math.exp(-t * R / L)) * 1e3))
                i1 = pts[-1][1] / 1e3
                for j in range(1, 21):
                    t = (T_ - ton) * j / 20
                    ii = max(0.0, -VF / R + (i1 + VF / R) * math.exp(-t * R / L))
                    pts.append((a + ton * 1e6 + t * 1e6, ii * 1e3))
                i = pts[-1][1] / 1e3
            o.append(T(p.X(ton * 1e6) + 6, p.Y(15) + 4, "15 mA", "start", 9.5, c, True))
        pts.append((tmax, 0))
        o.append(p.line(pts, c=c, lw=1.8))
    o.append(T(x0 + wd / 2, 30 + 2 * 92 + 66 + 31, "時間 [µs]（PWM 20 kHz・デューティ 10 % の初めの 3 周期、電源 3.0 V）", "middle", 10, MUT))
    return SVG(700, 340, o, "PWM の 1 回のパルスの間に流れる電流（例の値）。ランプは冷えた抵抗で決まる長方形、コンデンサは配線とスイッチの抵抗だけで決まる鋭い山（パルスごとに充電されて小さくなる）、コイルはインダクタンスで増え方が抑えられた三角になる。縦軸の目盛は行ごとに違う。")
F["e12_pulse3"] = _f12_pulse3()
