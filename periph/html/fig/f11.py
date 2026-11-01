# -*- coding: utf-8 -*-
# 11 章 スイッチと外部入力 の図

import random as _f11_random

# ---- 補助: 記号・回路の部品 ----
def _f11_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]（09 章の図と同じ書き方）。"""
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

def _f11_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f11_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f11_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return (W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6)
            + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2))

def _f11_vdd(x, y, label="V_DD", c=GLD, sz=10.5):
    """電源の記号（短い横棒と文字）。y は横棒の位置。"""
    o = W(x - 10, y, x + 10, y, c=c, lw=2)
    if label == "V_DD":
        o += _f11_m(x, y - 6, [("V", "DD", True)], "middle", sz, c)
    elif label:
        o += T(x, y - 6, label, "middle", sz, c, True)
    return o

def _f11_capv(x, y1, y2, c=INK, lw=1.5):
    """縦向きのコンデンサ（y1 から y2 へ）。"""
    ym = (y1 + y2) / 2
    return (W(x, y1, x, ym - 3, c=c, lw=lw) + W(x - 9, ym - 3, x + 9, ym - 3, c=c, lw=2)
            + W(x - 9, ym + 3, x + 9, ym + 3, c=c, lw=2) + W(x, ym + 3, x, y2, c=c, lw=lw))

def _f11_swv(x, y1, y2, closed=False, c=INK):
    """縦向きのスイッチ（y1 から y2 へ）。"""
    ym1, ym2 = y1 + (y2 - y1) * 0.3, y1 + (y2 - y1) * 0.7
    o = W(x, y1, x, ym1, c=c, lw=1.5) + W(x, ym2, x, y2, c=c, lw=1.5) + D(x, ym1, c, 2.4) + D(x, ym2, c, 2.4)
    o += W(x, ym1, x + (0 if closed else 11), ym2, c=c, lw=1.8)
    return o

def _f11_diode(x, y1, y2, c=INK, s=6, tvs=False):
    """縦向きのダイオード。y1（上）が陰極、y2（下）が陽極（下から上へ電流を通す）。tvs=True で陰極の棒に鉤を付ける。"""
    ym = (y1 + y2) / 2
    o = W(x, y1, x, ym - s * 0.8, c=c, lw=1.5) + W(x, ym + s * 0.8, x, y2, c=c, lw=1.5)
    o += PL([(x - s, ym + s * 0.8), (x + s, ym + s * 0.8), (x, ym - s * 0.8)], c=c, lw=1.3, fill=soft(c))
    o += W(x - s, ym - s * 0.8, x + s, ym - s * 0.8, c=c, lw=1.8)
    if tvs:
        o += W(x - s, ym - s * 0.8, x - s - 3, ym - s * 0.8 + 4, c=c, lw=1.5) + W(x + s, ym - s * 0.8, x + s + 3, ym - s * 0.8 - 4, c=c, lw=1.5)
    return o

def _f11_schmitt(x, y, c=SIG, h=30):
    """シュミットトリガの入力（右向きの三角と、ヒステリシスの印）。(x, y) は入力の端。返り値は (svg, 出力の x)。"""
    w = h * 1.15
    o = PL([(x, y - h / 2), (x, y + h / 2), (x + w, y)], c=c, lw=1.5, fill=soft(c))
    cx, cy = x + w * 0.36, y
    o += W(cx - 6, cy + 4, cx + 1.5, cy + 4, cx + 1.5, cy - 4, cx + 6, cy - 4, c=c, lw=1.1)
    o += W(cx - 6, cy + 4, cx - 1.5, cy + 4, cx - 1.5, cy - 4, cx + 6, cy - 4, c=c, lw=1.1)
    return o, x + w

def _f11_dwave(pts, X, yH, yL, c=TEA, lw=1.8):
    """H・L の波形。pts = [(時刻, 1 か 0), ...]（その時刻から、その値）、X は時刻 → x の関数。"""
    q = []
    for i, (t, v) in enumerate(pts):
        y = yH if v else yL
        if q:
            q.append((X(t), q[-1][1]))
        q.append((X(t), y))
    return PL(q, c=c, lw=lw)

# ================= 1 節 =================
def _f11_read():
    o = []
    for k, (x0, title) in enumerate(((20, "(a) プルアップ: 押すと L"), (372, "(b) プルダウン: 押すと H"))):
        o.append(T(x0, 20, title, "start", 11.5, INK, True))
        xs = x0 + 80
        o.append(_f11_vdd(xs, 50))
        if k == 0:
            o.append(_f11_resv(xs, 50, 96, c=GLD))
            o.append(_f11_m(xs + 12, 78, [("R", None, True)], "start", 11, INK))
            o.append(W(xs, 96, xs, 112, c=TEA, lw=1.5))
            o.append(D(xs, 112, TEA, 3.5))
            o.append(W(xs, 112, xs, 124, c=TEA, lw=1.5))
            o.append(_f11_swv(xs, 124, 166, False, c=TEA))
            o.append(W(xs, 166, xs, 172, c=TEA, lw=1.5))
            o.append(_f11_gnd(xs, 172))
            o.append(RECT(xs - 30, 120, 66, 50, 6, "none", MUT, 1, dash="4 3"))
        else:
            o.append(W(xs, 50, xs, 62, c=TEA, lw=1.5))
            o.append(_f11_swv(xs, 62, 104, False, c=TEA))
            o.append(W(xs, 104, xs, 112, c=TEA, lw=1.5))
            o.append(D(xs, 112, TEA, 3.5))
            o.append(W(xs, 112, xs, 124, c=GLD, lw=1.5))
            o.append(_f11_resv(xs, 124, 166, c=GLD))
            o.append(_f11_m(xs + 12, 150, [("R", None, True)], "start", 11, INK))
            o.append(W(xs, 166, xs, 172, c=GLD, lw=1.5))
            o.append(_f11_gnd(xs, 172))
            o.append(RECT(xs - 30, 58, 66, 50, 6, "none", MUT, 1, dash="4 3"))
        o.append(T(xs - 36, 150 if k == 0 else 88, "ボタン", "end", 10, MUT))
        o.append(W(xs, 112, x0 + 200, 112, c=TEA, lw=1.5))
        o.append(BOX(x0 + 200, 96, 104, 32, "GPIO の入力", None, SIG, SSOFT, INK, sz=10.5))
        o.append(T(x0 + 150, 106, "ピン", "middle", 9.5, MUT))
    # 状態の説明
    def line(x, y, parts, c=INK):
        return _f11_m(x, y, parts, "start", 10.5, c)
    o.append(line(20, 206, [("開いている: H。電流は流れない", None, False)]))
    o.append(line(20, 224, [("閉じている: L。", None, False), ("R", None, True), (" に ", None, False), ("V", "DD", True), (" ÷ ", None, False), ("R", None, True), (" が流れ続ける", None, False)]))
    o.append(T(20, 244, "線が筐体（GND）に触れても、押したと読むだけで済む", "start", 10.5, GRN, True))
    o.append(line(372, 206, [("開いている: L。電流は流れない", None, False)]))
    o.append(line(372, 224, [("閉じている: H。", None, False), ("R", None, True), (" に ", None, False), ("V", "DD", True), (" ÷ ", None, False), ("R", None, True), (" が流れ続ける", None, False)]))
    o.append(T(372, 244, "線が筐体に触れると、電源と GND が短絡する", "start", 10.5, ALI, True))
    return SVG(700, 256, o, "スイッチの 2 つの読み方。(a) はピンをプルアップ抵抗で H にしておき、押すとスイッチが GND につなぐ。(b) はプルダウン抵抗で L にしておき、押すと電源につなぐ。どちらも、閉じている間は抵抗に電流が流れ続ける。(a) では、スイッチへの線が GND に触れても電源は短絡しないので、こちらが多く使われる。")
F["e11_read"] = _f11_read()

_F11_BP = [(0, 3.3), (0.6, 3.3), (0.6, 0), (0.8, 0), (0.8, 3.3), (0.95, 3.3), (0.95, 0), (1.30, 0), (1.30, 3.3), (1.40, 3.3), (1.40, 0),
           (1.90, 0), (1.90, 2.6), (2.0, 2.6), (2.0, 0), (2.55, 0), (2.6, 0.7), (2.7, 0.7), (2.75, 0), (3.2, 0)]
_F11_BR = [(0, 0), (0.5, 0), (0.5, 3.3), (0.65, 3.3), (0.65, 0), (0.8, 0), (0.8, 3.3), (1.1, 3.3), (1.1, 0.4), (1.18, 0.4), (1.18, 3.3),
           (1.6, 3.3), (1.6, 2.9), (1.7, 2.9), (1.7, 3.3), (3.2, 3.3)]

def _f11_read_levels(pts, vih, vil, start):
    """電圧の折れ線から、しきい値（ヒステリシスなし）で読む値の変わり目を求める。返り値は [(時刻, 値)]。"""
    out = [(pts[0][0], start)]
    cur = start
    for t, v in pts:
        nv = 1 if v >= vih else (0 if v <= vil else cur)
        if nv != cur:
            out.append((t, nv)); cur = nv
    return out

def _f11_bounce():
    o = []
    VD, vih, vil = 3.3, 0.7 * 3.3, 0.3 * 3.3
    y0, h = 40, 104
    Y = lambda v: y0 + h - (v + 0.2) / 3.8 * h
    wins = ((80, 360, _F11_BP, "押したとき", 1), (400, 680, _F11_BR, "離したとき", 0))
    n_edge = 0
    for xa, xb, pts, title, start in wins:
        X = lambda t, xa=xa, xb=xb: xa + t / 3.2 * (xb - xa)
        o.append(T((xa + xb) / 2, 24, title, "middle", 11.5, INK, True))
        o.append(W(xa, y0 + h, xb, y0 + h, c=MUT, lw=1.1))
        for tt in (0, 1, 2, 3):
            o.append(W(X(tt), y0 + h, X(tt), y0 + h + 4, c=MUT, lw=1))
            o.append(T(X(tt), y0 + h + 15, "%d ms" % tt if tt == 3 else "%d" % tt, "middle", 9.5, MUT))
        for v, nm, c in ((vih, "IH", GRN), (vil, "IL", GLD)):
            o.append(W(xa, Y(v), xb, Y(v), c=c, lw=1, dash="5 3"))
        o.append(PL([(X(t), Y(v)) for t, v in pts], c=TEA, lw=1.8))
        lv = _f11_read_levels(pts, vih, vil, start)
        lv.append((3.2, lv[-1][1]))
        yH, yL = 182, 202
        o.append(_f11_dwave(lv, X, yH, yL, c=SIG, lw=2))
        prev = start
        for t, v in lv[1:-1]:
            if prev == 1 and v == 0:
                n_edge += 1
                o.append(PL([(X(t) - 5, 216), (X(t) + 5, 216), (X(t), 210)], c=ALI, lw=1, fill=ALI))
                o.append(T(X(t), 230, str(n_edge), "middle", 10, ALI, True))
            prev = v
    o.append(_f11_m(684, Y(vih) - 4, [("V", "IH", True)], "start", 10, GRN))
    o.append(_f11_m(684, Y(vil) + 12, [("V", "IL", True)], "start", 10, GLD))
    o.append(T(380, y0 + h / 2 + 4, "…", "middle", 14, MUT))
    o.append(T(74, Y(3.3) + 4, "3.3 V", "end", 9.5, MUT))
    o.append(T(74, Y(0) + 4, "0 V", "end", 9.5, MUT))
    o.append(T(74, 30, "ピンの電圧", "end", 10, TEA, True))
    o.append(T(74, 188, "読む値 H", "end", 10, SIG, True))
    o.append(T(74, 206, "L", "end", 10, SIG, True))
    o.append(T(74, 230, "H→L", "end", 10, ALI, True))
    o.append(T(20, 258, "H から L への変化を押した回数として数えると、1 回押して離すだけで 6 回押したことになる", "start", 10.5, ALI, True))
    return SVG(700, 268, o, "1 回押して離したときのピンの電圧（はね返りの例）と、GPIO が読む値。接点がつながったり離れたりを繰り返し、読む値は押したときに 4 回、離したときに 2 回、H から L に変わる。中ほどの電圧（2.6 V・0.7 V など）は、しきい値を越えなければ読む値を変えない。")
F["e11_bounce"] = _f11_bounce()

# ================= 2 節 =================
def _f11_rc_trace():
    """押してからの C の電圧（はね返りとノイズ入り）。返り値は [(t ms, v)] と、2 つの読み方の変わり目。"""
    rng = _f11_random.Random(11)
    VD, R1, R2, C = 3.3, 10.0, 15.0, 1.0      # kΩ・µF → ms
    edges = [1.0, 1.4, 1.9, 2.5, 3.1, 3.4, 4.2, 4.6, 5.5]   # 閉じる・開くの切り替え（最後は閉じる）
    dt = 0.02
    v, t, closed, k = VD, 0.0, False, 0
    pts, noisy = [], []
    while t <= 30.0 + 1e-9:
        while k < len(edges) and edges[k] <= t:
            closed = not closed; k += 1
        tau = R2 * C if closed else (R1 + R2) * C
        target = 0.0 if closed else VD
        v += (target - v) * dt / tau
        pts.append((t, v))
        t += dt
    # ノイズ（誇張）: 0.1 ms ごとに変わる一様な乱数
    nz = {}
    out = []
    for i, (t, v) in enumerate(pts):
        key = int(t / 0.1)
        if key not in nz:
            nz[key] = rng.uniform(-0.17, 0.17)
        out.append((t, v + nz[key]))
    # しきい値 1 つ（0.5 V_DD）
    th = 0.5 * VD
    one = [(0.0, 1)]; cur = 1
    for t, v in out:
        nv = 1 if v > th else 0
        if nv != cur:
            one.append((t, nv)); cur = nv
    # シュミット（0.6・0.4 V_DD）
    sch = [(0.0, 1)]; cur = 1
    for t, v in out:
        if cur == 1 and v < 0.4 * VD:
            sch.append((t, 0)); cur = 0
        elif cur == 0 and v > 0.6 * VD:
            sch.append((t, 1)); cur = 1
    return out, one, sch

def _f11_rc():
    o = []
    o.append(T(14, 20, "(a) RC とシュミットトリガ", "start", 11.5, INK, True))
    x1 = 64
    o.append(_f11_vdd(x1, 50))
    o.append(_f11_resv(x1, 50, 94, c=GLD))
    o.append(_f11_m(x1 + 12, 76, [("R", "1", True)], "start", 11, INK))
    o.append(W(x1, 94, x1, 110, c=TEA, lw=1.5))
    o.append(D(x1, 110, TEA, 3.2))
    o.append(W(x1, 110, x1, 122, c=TEA, lw=1.5))
    o.append(_f11_swv(x1, 122, 164, False, c=TEA))
    o.append(W(x1, 164, x1, 170, c=TEA, lw=1.5))
    o.append(_f11_gnd(x1, 170))
    o.append(T(x1 - 16, 148, "ボタン", "end", 9.5, MUT))
    o.append(W(x1, 110, 84, 110, c=TEA, lw=1.5))
    o.append(_f11_resh(84, 134, 110, c=INK))
    o.append(_f11_m(109, 96, [("R", "2", True)], "middle", 11, INK))
    xp = 160
    o.append(W(134, 110, xp, 110, c=TEA, lw=1.5))
    o.append(D(xp, 110, TEA, 3.2))
    o.append(W(xp, 110, xp, 122, c=TEA, lw=1.5))
    o.append(_f11_capv(xp, 122, 158, c=INK))
    o.append(W(xp, 158, xp, 170, c=INK, lw=1.5))
    o.append(_f11_gnd(xp, 170))
    o.append(_f11_m(xp + 14, 146, [("C", None, True)], "start", 11, INK))
    o.append(W(xp, 110, 186, 110, c=TEA, lw=1.5))
    s, xo = _f11_schmitt(186, 110, SIG, 30)
    o.append(s)
    o.append(W(xo, 110, xo + 14, 110, c=SIG, lw=1.5))
    o.append(T(xo + 18, 114, "読む値", "start", 10, SIG, True))
    o.append(T(xp, 96, "ピン", "middle", 9.5, MUT))
    o.append(_f11_m(14, 206, [("押す: ", None, False), ("C", None, True), (" は ", None, False), ("R", "2", True), (" を通して放電", None, False)], "start", 10.5, INK))
    o.append(_f11_m(14, 224, [("離す: ", None, False), ("C", None, True), (" は ", None, False), ("R", "1", True), (" + ", None, False), ("R", "2", True), (" を通して充電", None, False)], "start", 10.5, INK))
    o.append(_f11_m(14, 248, [("例: ", None, False), ("R", "1", True), (" 10 kΩ・", None, False), ("R", "2", True), (" 15 kΩ・", None, False), ("C", None, True), (" 1 µF", None, False)], "start", 10, MUT))
    # 右: 波形
    tr, one, sch = _f11_rc_trace()
    p = Plot(366, 34, 320, 112, (0, 30), (0, 3.3))
    o.append(T(366, 22, "ピン（C）の電圧（押してから）", "start", 10.5, TEA, True))
    for v in (0, 1.65, 3.3):
        o.append(T(p.x - 6, p.Y(v) + 4, "%g V" % v if v != 1.65 else "", "end", 9.5, MUT))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.1))
    for v, c, dash in ((0.6 * 3.3, PUR, "5 3"), (0.5 * 3.3, MUT, "2 3"), (0.4 * 3.3, PUR, "5 3")):
        o.append(W(p.X(0), p.Y(v), p.X(30), p.Y(v), c=c, lw=1, dash=dash))
    o.append(p.line(tr, c=TEA, lw=1.4))
    o.append(_f11_m(p.X(30) + 3, p.Y(0.6 * 3.3) + 3, [("V", "T+", True)], "start", 9.5, PUR))
    o.append(T(p.X(30) + 3, p.Y(0.5 * 3.3) + 4, "1 つ", "start", 9, MUT))
    o.append(_f11_m(p.X(30) + 3, p.Y(0.4 * 3.3) + 6, [("V", "T−", True)], "start", 9.5, PUR))
    o.append(W(p.X(1), p.y + p.h + 5, p.X(5.5), p.y + p.h + 5, c=GLD, lw=2))
    o.append(T(p.X(3.2), p.y + p.h + 18, "はね返り", "middle", 9.5, GLD, True))
    X = p.X
    yb, yc = 184, 226
    o.append(T(366, yb - 14, "(b) しきい値 1 つ（0.5 V_DD）: 何度も入れ替わる", "start", 10, ALI, True))
    o.append(_f11_dwave(one + [(30, one[-1][1])], X, yb - 4, yb + 10, c=ALI, lw=1.6))
    o.append(T(366, yc - 14, "(c) シュミットトリガ: 1 回だけ変わる", "start", 10, GRN, True))
    o.append(_f11_dwave(sch + [(30, sch[-1][1])], X, yc - 4, yc + 10, c=GRN, lw=1.8))
    for tt in (0, 10, 20, 30):
        o.append(W(X(tt), yc + 14, X(tt), yc + 18, c=MUT, lw=1))
        o.append(T(X(tt), yc + 30, "%d ms" % tt if tt == 30 else "%d" % tt, "middle", 9.5, MUT))
    o.append(W(X(0), yc + 14, X(30), yc + 14, c=MUT, lw=1))
    return SVG(700, yc + 40, o, "(a) RC とシュミットトリガでチャタリングを取り除く回路。はね返りの短い間に接点が開いても閉じても、C の電圧は少ししか動かない。(b) ゆっくり下がる電圧を、しきい値が 1 つの入力で読むと、しきい値の近くでノイズのたびに入れ替わる（ノイズは誇張して描いた）。(c) しきい値が 2 つあるシュミットトリガなら、1 回だけ変わる。")
F["e11_rc"] = _f11_rc()

def _f11_fsm():
    o = []
    w, h = 132, 46
    S0, S1, S2, S3 = (104, 70), (350, 70), (596, 70), (350, 196)
    o.append(STATE(S0[0], S0[1], w, h, "離れている", GRN, None, start=True))
    o.append(STATE(S1[0], S1[1], w, h, "押されたかも", GLD, "数 = 1〜N − 1"))
    o.append(STATE(S2[0], S2[1], w, h, "押されている", SIG))
    o.append(STATE(S3[0], S3[1], w, h, "離されたかも", GLD, "数 = 1〜N − 1"))
    # S0 ⇄ S1
    o.append(ARR(S0[0] + w / 2 + 2, 62, S1[0] - w / 2 - 2, 62, c=TEA, lw=1.5, head=7))
    o.append(T((S0[0] + S1[0]) / 2, 55, "L を読む: 数 = 1", "middle", 9.5, TEA))
    o.append(ARR(S1[0] - w / 2 - 2, 80, S0[0] + w / 2 + 2, 80, c=MUT, lw=1.4, head=7))
    o.append(T((S0[0] + S1[0]) / 2, 95, "H を読む: 数 = 0", "middle", 9.5, MUT))
    # S1 → S2
    o.append(ARR(S1[0] + w / 2 + 2, 70, S2[0] - w / 2 - 2, 70, c=SIG, lw=1.7, head=7))
    o.append(T((S1[0] + S2[0]) / 2, 61, "L で数 = N", "middle", 9.5, SIG, True))
    o.append(T((S1[0] + S2[0]) / 2, 85, "PRESS を出す", "middle", 9.5, SIG, True))
    o.append(SELF(S1[0], S1[1] - h / 2, "L を読む: 数 + 1", c=TEA))
    # S2 ⇄ S3
    o.append(ARR(S2[0] - 30, S2[1] + h / 2 + 2, S3[0] + w / 2 + 4, S3[1] - 10, c=TEA, lw=1.5, head=7))
    o.append(T(S2[0] + 2, 136, "H を読む: 数 = 1", "middle", 9.5, TEA))
    o.append(ARR(S3[0] + w / 2 + 4, S3[1] + 8, S2[0] + 4, S2[1] + h / 2 + 2, c=MUT, lw=1.4, head=7))
    o.append(T(S2[0] + 24, 196, "L を読む: 数 = 0", "middle", 9.5, MUT))
    # S3 → S0
    o.append(ARR(S3[0] - w / 2 - 4, S3[1], S0[0] + 10, S0[1] + h / 2 + 2, c=GRN, lw=1.7, head=7))
    o.append(T(S0[0] + 24, 160, "H で数 = N", "middle", 9.5, GRN, True))
    o.append(T(S0[0] + 24, 175, "RELEASE を出す", "middle", 9.5, GRN, True))
    o.append(SELF(S3[0], S3[1] + h / 2, "H を読む: 数 + 1", c=TEA, side="bottom"))
    o.append(T(14, 268, "「離れている」で H、「押されている」で L を読んだときは、そのままとどまる（図では省いた）。", "start", 9.5, MUT))
    return SVG(700, 278, o, "続けて同じ値を N 回読んだら状態を変える状態機械。T_p ごとに 1 回ピンを読み、状態と違う値を読むたびに数を 1 増やし、状態と同じ値を読んだら数を 0 に戻す。数が N に届いたときだけ、押されている・離れているを入れ替え、PRESS・RELEASE を出す。")
F["e11_fsm"] = _f11_fsm()

def _f11_soft():
    o = []
    x0, x1 = 120, 684
    X = lambda t: x0 + t / 125.0 * (x1 - x0)
    seq = [(0, 1), (6, 0), (13, 1), (50, 0), (50.6, 1), (51.1, 0), (51.9, 1), (52.3, 0), (53.5, 1), (53.8, 0),
           (95, 1), (95.7, 0), (96.4, 1), (97.1, 0), (97.4, 1), (125, 1)]
    def lev(t):
        v = 1
        for tt, vv in seq:
            if tt <= t: v = vv
        return v
    # 1 段目: ピンの値
    yH, yL = 40, 60
    o.append(T(x0 - 8, 54, "ピンの値", "end", 10, TEA, True))
    o.append(_f11_dwave(seq, X, yH, yL, c=TEA, lw=1.8))
    o.append(T(X(9.5), 30, "ノイズ（7 ms）", "middle", 9.5, ALI, True))
    o.append(T(X(52), 30, "押す（はね返り 4 ms）", "middle", 9.5, INK))
    o.append(T(X(96), 30, "離す（はね返り 2.4 ms）", "middle", 9.5, INK))
    # 2 段目: 5 ms ごとに読む
    ys = 88
    o.append(T(x0 - 8, ys + 4, "5 ms ごとに読む", "end", 10, SIG, True))
    o.append(W(x0, ys, x1, ys, c=GRD, lw=1))
    state, cnt, press_t, rel_t = 0, 0, None, None
    t = 2.5
    while t < 125:
        v = lev(t)
        o.append(D(X(t), ys, TEA if v == 0 else MUT, 3.4 if v == 0 else 2.6))
        nowp = 1 if v == 0 else 0
        if nowp != state:
            cnt += 1
            o.append(T(X(t), ys + 15, str(cnt), "middle", 9, GLD, True))
            if cnt >= 3:
                state, cnt = nowp, 0
                if nowp: press_t = t
                else: rel_t = t
        else:
            cnt = 0
        t += 5
    # 3 段目: 続けて 3 回
    y3 = 128
    o.append(T(x0 - 8, y3 + 14, "(a) 続けて 3 回", "end", 10, GRN, True))
    o.append(RECT(X(press_t), y3, X(rel_t) - X(press_t), 20, 3, GSOFT, GRN, 1.3))
    o.append(T((X(press_t) + X(rel_t)) / 2, y3 + 14, "押されている", "middle", 10, GRN, True))
    o.append(DIM(X(53.8), y3 + 30, X(press_t), y3 + 30, None, c=GRN))
    o.append(T(X(press_t) + 4, y3 + 44, "落ち着いてから %.1f ms" % (press_t - 53.8), "start", 9.5, GRN))
    o.append(T(X(9.5), y3 + 14, "数 2 で止まる", "middle", 9.5, GRN, True))
    # 4 段目: 一定時間待つ
    y4 = 196
    o.append(T(x0 - 8, y4 + 14, "(b) 一定時間待つ", "end", 10, ALI, True))
    o.append(T(x0 - 8, y4 + 28, "（20 ms）", "end", 9.5, ALI))
    o.append(RECT(X(6), y4, X(26) - X(6), 20, 3, ASOFT, ALI, 1.3))
    o.append(T((X(6) + X(26)) / 2, y4 + 14, "ノイズを押したと読む", "middle", 9.5, ALI, True))
    o.append(RECT(X(50), y4, X(95) - X(50), 20, 3, GSOFT, GRN, 1.3))
    o.append(T((X(50) + X(95)) / 2, y4 + 14, "押されている（遅れ 0）", "middle", 10, GRN, True))
    for tt in (6, 50, 95):
        o.append(W(X(tt), y4 + 22, X(tt), y4 + 30, c=ALI if tt == 6 else GRN, lw=1.2))
    o.append(DIM(X(50), y4 + 34, X(70), y4 + 34, None, c=MUT))
    o.append(T(X(71), y4 + 38, "20 ms は変化を無視", "start", 9.5, MUT))
    # 時間軸
    ya = 258
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for tt in (0, 25, 50, 75, 100, 125):
        o.append(W(X(tt), ya, X(tt), ya + 4, c=MUT, lw=1))
        o.append(T(X(tt), ya + 16, "%d ms" % tt if tt == 125 else "%d" % tt, "middle", 9.5, MUT))
    return SVG(700, ya + 24, o, "デバウンスの 2 つのプログラムの方法を、同じ入力で比べる（T_p = 5 ms）。(a) 違う値を続けて 3 回読んだら変える方法は、7 ms のノイズを 2 回まで読んでも状態を変えず、はね返りが落ち着いてから 5〜15 ms 後に押したと決める。(b) 最初の変化ですぐに押したとし、20 ms は変化を無視する方法は、遅れは無いが、ノイズも押したと読む。")
F["e11_soft"] = _f11_soft()
