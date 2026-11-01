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
            o.append(T(X(b) + 6, y + 12, kind, "start", 9, ALI))
    return SVG(700, ybot + 44, o, "負荷が使う電流の桁と、GPIO で直接駆動できる範囲（どちらも代表値）。直接駆動できるのは数 mA までのもの。リレー・モータ・ソレノイドはコイルを持ち、電流が大きく、切った瞬間に大きな電圧が生じるので、MOSFET などのスイッチで入れ切りする。")
F["e12_loads"] = _f12_loads()
