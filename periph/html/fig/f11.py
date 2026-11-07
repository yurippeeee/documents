# -*- coding: utf-8 -*-
# 11 章 スイッチと外部入力 の図

import random as _f11_random

# ---- 補助: 記号・回路の部品 ----
def _f11_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]（09 章の図と同じ書き方）。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub.lstrip("^"), sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82 - 2, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    pend = 0
    for s, sub, it in parts:
        o.append('<tspan font-style="%s"%s>%s</tspan>' % ("italic" if it else "normal", (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub and sub.startswith("^"):
            o.append('<tspan dy="-5" font-size="%g">%s</tspan>' % (sz * 0.72, E(sub[1:])))
            pend = 5
        elif sub:
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

def _f11_diode(x, y1, y2, c=INK, s=6, tvs=False, down=False):
    """縦向きのダイオード。既定は y1（上）が陰極、y2（下）が陽極で、下から上へ電流を通す。
    down=True なら上が陽極で、上から下へ通す。tvs=True で陰極の棒に鉤を付ける。"""
    ym = (y1 + y2) / 2
    k = s * 0.8
    o = W(x, y1, x, ym - k, c=c, lw=1.5) + W(x, ym + k, x, y2, c=c, lw=1.5)
    yb, yk = (ym - k, ym + k) if down else (ym + k, ym - k)     # 三角の底（陽極）と、陰極の棒
    o += PL([(x - s, yb), (x + s, yb), (x, yk)], c=c, lw=1.3, fill=soft(c))
    o += W(x - s, yk, x + s, yk, c=c, lw=1.8)
    if tvs:
        o += W(x - s, yk, x - s - 3, yk + 4, c=c, lw=1.5) + W(x + s, yk, x + s + 3, yk - 4, c=c, lw=1.5)
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
    p = Plot(352, 34, 300, 108, (0, 30), (0, 3.3))
    o.append(T(352, 22, "ピン（C）の電圧（押してから）", "start", 10.5, TEA, True))
    for v in (0, 3.3):
        o.append(T(p.x - 6, p.Y(v) + 4, "%g V" % v, "end", 9.5, MUT))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.1))
    for v, c, dash in ((0.6 * 3.3, PUR, "5 3"), (0.5 * 3.3, MUT, "2 3"), (0.4 * 3.3, PUR, "5 3")):
        o.append(W(p.X(0), p.Y(v), p.X(30), p.Y(v), c=c, lw=1, dash=dash))
    o.append(p.line(tr, c=TEA, lw=1.4))
    o.append(_f11_m(p.X(30) + 4, p.Y(0.6 * 3.3) - 1, [("V", "T+", True)], "start", 9.5, PUR))
    o.append(T(p.X(30) + 4, p.Y(0.5 * 3.3) + 4, "1 つ", "start", 9, MUT))
    o.append(_f11_m(p.X(30) + 4, p.Y(0.4 * 3.3) + 9, [("V", "T−", True)], "start", 9.5, PUR))
    X = p.X
    o.append(W(X(1), p.y + p.h + 6, X(5.5), p.y + p.h + 6, c=GLD, lw=2.2))
    o.append(T(X(5.5) + 6, p.y + p.h + 10, "はね返り", "start", 9.5, GLD, True))
    yb, yc = 184, 226
    o.append(_f11_m(352, yb - 14, [("(b) しきい値 1 つ（0.5 ", None, False), ("V", "DD", True), ("）: 何度も入れ替わる", None, False)], "start", 10, ALI, True))
    o.append(_f11_dwave(one + [(30, one[-1][1])], X, yb - 4, yb + 10, c=ALI, lw=1.6))
    o.append(T(352, yc - 14, "(c) シュミットトリガ: 1 回だけ変わる", "start", 10, GRN, True))
    o.append(_f11_dwave(sch + [(30, sch[-1][1])], X, yc - 4, yc + 10, c=GRN, lw=1.8))
    o.append(W(X(0), yc + 18, X(30), yc + 18, c=MUT, lw=1))
    for tt in (0, 10, 20, 30):
        o.append(W(X(tt), yc + 18, X(tt), yc + 22, c=MUT, lw=1))
        o.append(T(X(tt), yc + 34, "%d ms" % tt if tt == 30 else "%d" % tt, "middle", 9.5, MUT))
    return SVG(700, yc + 44, o, "(a) RC とシュミットトリガでチャタリングを取り除く回路。はね返りの短い間に接点が開いても閉じても、C の電圧は少ししか動かない。(b) ゆっくり下がる電圧を、しきい値が 1 つの入力で読むと、しきい値の近くでノイズのたびに入れ替わる（ノイズは誇張して描いた）。(c) しきい値が 2 つあるシュミットトリガなら、1 回だけ変わる。")
F["e11_rc"] = _f11_rc()

def _f11_fsm():
    o = []
    w, h = 132, 46
    S0, S1, S2, S3 = (104, 74), (350, 74), (596, 74), (596, 200)
    o.append(STATE(S0[0], S0[1], w, h, "離れている", GRN, None, start=True))
    o.append(STATE(S1[0], S1[1], w, h, "押されたかも", GLD, "数 = 1〜N − 1"))
    o.append(STATE(S2[0], S2[1], w, h, "押されている", SIG))
    o.append(STATE(S3[0], S3[1], w, h, "離されたかも", GLD, "数 = 1〜N − 1"))
    # S0 ⇄ S1
    o.append(ARR(S0[0] + w / 2 + 2, 66, S1[0] - w / 2 - 2, 66, c=TEA, lw=1.5, head=7))
    o.append(T((S0[0] + S1[0]) / 2, 59, "L を読む: 数 = 1", "middle", 9.5, TEA))
    o.append(ARR(S1[0] - w / 2 - 2, 84, S0[0] + w / 2 + 2, 84, c=MUT, lw=1.4, head=7))
    o.append(T((S0[0] + S1[0]) / 2, 99, "H を読む: 数 = 0", "middle", 9.5, MUT))
    # S1 → S2
    o.append(ARR(S1[0] + w / 2 + 2, 74, S2[0] - w / 2 - 2, 74, c=SIG, lw=1.7, head=7))
    o.append(T((S1[0] + S2[0]) / 2, 66, "L で数 = N", "middle", 9.5, SIG, True))
    o.append(T((S1[0] + S2[0]) / 2, 89, "PRESS を出す", "middle", 9.5, SIG, True))
    o.append(SELF(S1[0], S1[1] - h / 2, "L を読む: 数 + 1", c=TEA))
    # S2 ⇄ S3（縦に並べる）
    o.append(ARR(580, S2[1] + h / 2 + 2, 580, S3[1] - h / 2 - 2, c=TEA, lw=1.5, head=7))
    o.append(T(572, 133, "H を読む", "end", 9.5, TEA))
    o.append(T(572, 147, "数 = 1", "end", 9.5, TEA))
    o.append(ARR(612, S3[1] - h / 2 - 2, 612, S2[1] + h / 2 + 2, c=MUT, lw=1.4, head=7))
    o.append(T(620, 133, "L を読む", "start", 9.5, MUT))
    o.append(T(620, 147, "数 = 0", "start", 9.5, MUT))
    # S3 → S0（下を回る）
    o.append(W(S3[0] - w / 2 - 2, S3[1], S0[0], S3[1], S0[0], S0[1] + h / 2 + 8, c=GRN, lw=1.7))
    o.append(ARR(S0[0], S0[1] + h / 2 + 10, S0[0], S0[1] + h / 2 + 2, c=GRN, lw=1.7, head=7))
    o.append(T(300, S3[1] - 7, "H で数 = N: RELEASE を出す", "middle", 9.5, GRN, True))
    o.append(SELF(S3[0], S3[1] + h / 2, "H を読む: 数 + 1", c=TEA, side="bottom"))
    o.append(T(14, 282, "「離れている」で H、「押されている」で L を読んだときは、そのままとどまる（図では省いた）。", "start", 9.5, MUT))
    return SVG(700, 292, o, "続けて同じ値を N 回読んだら状態を変える状態機械。T_p ごとに 1 回ピンを読み、状態と違う値を読むたびに数を 1 増やし、状態と同じ値を読んだら数を 0 に戻す。数が N に届いたときだけ、押されている・離れているを入れ替え、PRESS・RELEASE を出す。")
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
    o.append(T((X(6) + X(26)) / 2, y4 + 14, "誤り", "middle", 9.5, ALI, True))
    o.append(T((X(6) + X(26)) / 2, y4 + 40, "ノイズを押したと読む", "middle", 9.5, ALI, True))
    o.append(RECT(X(50), y4, X(95) - X(50), 20, 3, GSOFT, GRN, 1.3))
    o.append(T((X(50) + X(95)) / 2, y4 + 14, "押されている（遅れ 0）", "middle", 10, GRN, True))
    for tt in (6, 50, 95):
        o.append(W(X(tt), y4 + 22, X(tt), y4 + 27, c=ALI if tt == 6 else GRN, lw=1.2))
    o.append(DIM(X(50), y4 + 34, X(70), y4 + 34, None, c=MUT))
    o.append(T(X(71), y4 + 38, "20 ms は変化を無視", "start", 9.5, MUT))
    # 時間軸
    ya = 258
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for tt in (0, 25, 50, 75, 100, 125):
        o.append(W(X(tt), ya, X(tt), ya + 4, c=MUT, lw=1))
        o.append(T(X(tt), ya + 16, "%d ms" % tt if tt == 125 else "%d" % tt, "middle", 9.5, MUT))
    return SVG(700, ya + 24, o, "デバウンスの 2 つのプログラムの方法を、同じ入力で比べる（T_p = 5 ms）。(a) 違う値を続けて 3 回読んだら変える方法は、7 ms のノイズを 2 回まで読んでも状態を変えず、はね返りが落ち着いてから 15 ms（N T_p）以内に押したと決める。(b) 最初の変化ですぐに押したとし、20 ms は変化を無視する方法は、遅れは無いが、ノイズも押したと読む。")
F["e11_soft"] = _f11_soft()

# ================= 3 節 =================
def _f11_wait():
    o = []
    x0, x1 = 150, 684
    X = lambda t: x0 + t / 60.0 * (x1 - x0)
    seq = [(0, 1), (10, 0), (11, 1), (12, 0), (13.2, 1), (14, 0), (60, 0)]
    def lev(t):
        v = 1
        for tt, vv in seq:
            if tt <= t: v = vv
        return v
    o.append(T(x0 - 10, 44, "ピンの値", "end", 10, TEA, True))
    o.append(_f11_dwave(seq, X, 34, 50, c=TEA, lw=1.8))
    o.append(T(X(12), 26, "押す（はね返り 4 ms）", "middle", 9.5, INK))
    rows = []
    # (a) 周期的に読む: 2.5 ms から 5 ms ごと
    wa = [2.5 + 5 * k for k in range(12)]
    st, cnt, pa = 0, 0, None
    for t in wa:
        v = lev(t)
        if (1 if v == 0 else 0) != st:
            cnt += 1
            if cnt >= 3:
                st, cnt, pa = 1, 0, t
        else:
            cnt = 0
    rows.append(("(a) 周期的に読む", "60 ms で 12 回起きる", wa, [], pa, SIG))
    # (b) 割り込みだけ: 変化のたびに
    wb = [t for t, _ in seq[1:-1]]
    rows.append(("(b) 割り込みだけ", "5 回起き、3 回押したと数える", wb, [t for t, v in seq[1:-1] if v == 0], None, ALI))
    # (c) 割り込みで起きて、しばらく読む
    wc = [10.0] + [15.0, 20.0, 25.0, 30.0, 35.0]
    rows.append(("(c) 割り込み＋周期", "6 回起きて、また眠る", wc, [], 25.0, GRN))
    for i, (nm, sub, wakes, counted, pt, c) in enumerate(rows):
        yb = 102 + i * 56
        o.append(T(x0 - 10, yb - 6, nm, "end", 10, c, True))
        o.append(T(x0 - 10, yb + 8, sub, "end", 9, MUT))
        o.append(W(x0, yb, x1, yb, c=FNT, lw=1))
        for t in wakes:
            isr = (c == ALI) or (c == GRN and t == 10.0)
            o.append(RECT(X(t) - 2.5, yb - 22, 5, 22, 1, soft(GLD) if isr else soft(c), GLD if isr else c, 1.1))
        for t in counted:
            o.append(T(X(t), yb + 13, "+1", "middle", 9, ALI, True))
        if pt is not None:
            o.append(ARR(X(pt), yb + 18, X(pt), yb + 4, c=c, lw=1.3, head=5))
            o.append(T(X(pt) + 6, yb + 18, "押したと決まる", "start", 9, c, True))
    o.append(T(X(36) + 6, 102 + 2 * 56 - 26, "落ち着いたので割り込みに戻す", "start", 9, GRN))
    o.append(RECT(x0, 278, 10, 10, 2, GOSOFT, GLD, 1.1))
    o.append(T(x0 + 16, 287, "ピンの変化の割り込みで起きる", "start", 9.5, MUT))
    o.append(RECT(x0 + 210, 278, 10, 10, 2, MSOFT, MUT, 1.1))
    o.append(T(x0 + 226, 287, "タイマで起きて読む（高さは 1 回の電荷の目安）", "start", 9.5, MUT))
    ya = 256
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for tt in (0, 10, 20, 30, 40, 50, 60):
        o.append(W(X(tt), ya, X(tt), ya + 4, c=MUT, lw=1))
        o.append(T(X(tt), ya + 15, "%d ms" % tt if tt == 60 else "%d" % tt, "middle", 9.5, MUT))
    return SVG(700, 296, o, "スイッチの変化を待つ 3 つのやり方で、マイコンが起きる時刻（T_p = 5 ms、N = 3）。(a) は何も起きていない間も 5 ms ごとに起きる。(b) ははね返りの変化のたびに起き、H から L への変化を数えると 3 回押したことになる。(c) は変化の割り込みで起きた後、その割り込みを止めて 5 ms ごとに読み、落ち着いたら割り込みで待つ形に戻して眠る。")
F["e11_wait"] = _f11_wait()

def _f11_iavg():
    o = []
    Is, Qp = 2.0, 0.09                   # µA, µC
    Ia = Is + Qp / 5e-3 * 1e-3 * 1e3     # µA: Qp [µC] / 5 ms
    Ia = Is + Qp / 0.005
    day = 20 * 12 * Qp / 86400.0
    Ib_noise = Is + 20000 * Qp
    Ic_noise = Is + 4 * Qp / 0.01505
    groups = [("ふだん（1 日に 20 回押す）", [("(a) 周期的に読む", Ia, SIG), ("(b) 割り込みだけ", Is + 20 * 6 * Qp / 86400.0, ALI), ("(c) 割り込み＋周期", Is + day, GRN)]),
              ("ノイズが 1 秒に 20,000 回入る", [("(a) 周期的に読む", Ia, SIG), ("(b) 割り込みだけ", Ib_noise, ALI), ("(c) 割り込み＋周期", Ic_noise, GRN)])]
    p = Plot(250, 0, 330, 1, (1, 3000), (0, 1), xlog=True)
    X = p.X
    y = 22
    for g, items in groups:
        o.append(T(14, y + 4, g, "start", 10.5, INK, True))
        y += 12
        for nm, v, c in items:
            o.append(T(X(1) - 8, y + 12, nm, "end", 10, c, True))
            o.append(RECT(X(1), y + 2, X(v) - X(1), 14, 2, soft(c), c, 1.1))
            life = 220.0 / (v * 1e-3) / 24.0
            lt = ("%.1f 年" % (life / 365)) if life >= 365 else ("%.0f 日" % life)
            o.append(T(X(v) + 6, y + 13, "%s µA（寿命 %s）" % (("%.3g" % v) if v < 1000 else "{:,}".format(int(round(v))), lt), "start", 9.5, c, True))
            y += 20
        y += 14
    yb = y + 2
    o.append(W(X(1), yb, X(3000), yb, c=MUT, lw=1))
    for v in (1, 10, 100, 1000):
        o.append(W(X(v), yb, X(v), yb + 4, c=MUT, lw=1))
        o.append(T(X(v), yb + 15, "%g µA" % v if v < 1000 else "1 mA", "middle", 9.5, MUT))
    o.append(T(14, yb + 36, "眠りの電流 2 µA、1 回起きる電荷 0.09 µC、T_p = 5 ms、CR2032（220 mAh）。横軸は対数目盛。", "start", 9.5, MUT))
    return SVG(700, yb + 46, o, "3 つのやり方の平均電流と電池寿命（例の値）。ふだんは、(b) と (c) はほぼ眠りの電流だけで、(a) は 10 倍になる。(b) は数え方を誤るうえ、ノイズが続くとノイズのたびに起きて電池が数日で尽きる。(c) は、ノイズが続く間も 5 ms ごとに読むだけなので、(a) と同じ程度にとどまる。")
F["e11_iavg"] = _f11_iavg()

# ================= 4 節 =================
_F11_QS = ["11", "01", "00", "10"]          # 右回りの順

def _f11_quad():
    o = []
    # 右へ 2 クリック、左へ 1 クリック
    states = [3, 1, 0, 2, 3, 1, 0, 2, 3, 2, 0, 1, 3]
    dirs = [+1] * 8 + [-1] * 4
    x0, dx = 76, 29
    yA, yB = (46, 66), (94, 114)
    o.append(T(x0 - 10, 60, "A", "end", 11, TEA, True))
    o.append(T(x0 - 10, 108, "B", "end", 11, TEA, True))
    xs = [x0 + i * dx for i in range(len(states) + 1)]
    for ch, (yh, yl) in ((1, yA), (0, yB)):
        pts = []
        for i, s in enumerate(states):
            v = (s >> ch) & 1
            yy = yh if v else yl
            if pts:
                pts.append((xs[i], pts[-1][1]))
            pts.append((xs[i], yy))
            pts.append((xs[i + 1], yy))
        o.append(PL(pts, c=TEA, lw=1.8))
    for i, s in enumerate(states):
        xm = (xs[i] + xs[i + 1]) / 2
        o.append(T(xm, 140, "%d%d" % ((s >> 1) & 1, s & 1), "middle", 10, INK, True, mono=True))
        if i > 0:
            d = dirs[i - 1]
            o.append(T(xs[i], 160, "+1" if d > 0 else "−1", "middle", 9.5, SIG if d > 0 else PUR, True))
        if s == 3:
            o.append(D(xm, 176, GLD, 3.4))
    o.append(T(x0 - 10, 144, "(A, B)", "end", 9.5, MUT))
    o.append(T(x0 - 10, 164, "向き", "end", 9.5, MUT))
    o.append(T(x0 - 10, 180, "クリック", "end", 9.5, GLD))
    o.append(DARR(xs[0] + 14, 196, xs[8] + 14, 196, c=SIG, lw=1.2))
    o.append(T((xs[0] + xs[8]) / 2 + 14, 212, "右へ 2 クリック（+1 が 8 回）", "middle", 9.5, SIG, True))
    o.append(DARR(xs[8] + 14, 196, xs[12] + 14, 196, c=PUR, lw=1.2))
    o.append(T((xs[8] + xs[12]) / 2 + 14, 212, "左へ 1 クリック", "middle", 9.5, PUR, True))
    o.append(T(14, 238, "1 回の変化では、A と B の片方だけが変わる。どちらが先に変わるかで向きが分かる。", "start", 9.5, MUT))
    # 右: 状態の輪
    cx, cy, r = 588, 116, 62
    pos = {3: (cx, cy - r), 1: (cx + r, cy), 0: (cx, cy + r), 2: (cx - r, cy)}
    for s, (px, py) in pos.items():
        o.append(CIRC(px, py, 17, c=INK, lw=1.4, fill=PAN))
        o.append(T(px, py + 4, "%d%d" % ((s >> 1) & 1, s & 1), "middle", 11, INK, True, mono=True))
    order = [3, 1, 0, 2, 3]
    for a, b in zip(order, order[1:]):
        (xa, ya), (xb, yb) = pos[a], pos[b]
        o.append(CARR(xa + (xb - xa) * 0.28, ya + (yb - ya) * 0.28, xa + (xb - xa) * 0.72, ya + (yb - ya) * 0.72, bend=-0.32, c=SIG, lw=1.5, head=6))
    o.append(W(pos[3][0], pos[3][1] + 19, pos[0][0], pos[0][1] - 19, c=ALI, lw=1.2, dash="4 3"))
    o.append(W(pos[2][0] + 19, pos[2][1], pos[1][0] - 19, pos[1][1], c=ALI, lw=1.2, dash="4 3"))
    o.append(T(cx + 6, cy - 6, "×", "start", 12, ALI, True))
    o.append(T(cx, 22, "右回り: 時計回りに +1", "middle", 9.5, SIG, True))
    o.append(T(cx, 216, "左回り: 逆にたどって −1", "middle", 9.5, PUR, True))
    o.append(T(cx, 232, "× 対角（2 本とも変わる）は読み落とし", "middle", 9.5, ALI))
    return SVG(700, 248, o, "ロータリーエンコーダの A と B（1 クリックで 4 回変わり、クリックの位置で 11 になる製品の例）。右に回すと (A, B) は 11 → 01 → 00 → 10 → 11 と変わり、左に回すと逆にたどる。右の輪の隣どうしの移り変わりで向きが決まり、対角への移り変わりは、間の変化を読み落としたことを表す。")
F["e11_quad"] = _f11_quad()

def _f11_qread():
    o = []
    rows = [
        ("(a) 変化の間に 1 回ずつ読む", [(0, 3), (1, 1), (2, 0), (3, 2), (4, 3), (5, 3)], [0.5, 1.5, 2.5, 3.5, 4.5], "+1 が 4 回 → 1 クリック", GRN),
        ("(b) A がはね返る", [(0, 3), (1.0, 1), (1.4, 3), (1.8, 1), (2.6, 0), (3.4, 2), (4.2, 3), (5, 3)], [0.5, 1.2, 1.6, 2.0, 3.0, 3.8, 4.6], "+1 −1 +1 が打ち消し合い、合計 +4 → 1 クリック", GRN),
        ("(c) 読む間隔が長すぎる", [(0, 3), (1, 1), (1.6, 0), (3.0, 2), (3.6, 3), (5, 3)], [0.6, 2.4, 4.4], "× が 2 回: 向きが分からず、1 クリックを数え落とす", ALI),
    ]
    x0, x1 = 210, 470
    X = lambda t: x0 + t / 5.0 * (x1 - x0)
    for i, (title, seq, samp, res, c) in enumerate(rows):
        yb = 22 + i * 94
        o.append(T(14, yb + 10, title, "start", 10.5, INK, True))
        for ch, yy, nm in ((1, yb + 24, "A"), (0, yb + 50, "B")):
            pts = [(t, (s >> ch) & 1) for t, s in seq]
            o.append(T(x0 - 8, yy + 12, nm, "end", 10, TEA, True))
            o.append(_f11_dwave(pts, X, yy, yy + 16, c=TEA, lw=1.6))
        prev = 3
        for t in samp:
            s = 3
            for tt, ss in seq:
                if tt <= t: s = ss
            o.append(W(X(t), yb + 20, X(t), yb + 70, c=SIG, lw=1, dash="2 2"))
            o.append(D(X(t), yb + 20, SIG, 3))
            d = {(3, 1): "+1", (1, 0): "+1", (0, 2): "+1", (2, 3): "+1", (1, 3): "−1", (0, 1): "−1", (2, 0): "−1", (3, 2): "−1"}.get((prev, s), "0" if s == prev else "×")
            cc = ALI if d == "×" else (PUR if d == "−1" else (SIG if d == "+1" else MUT))
            o.append(T(X(t), yb + 84, d, "middle", 10, cc, True))
            prev = s
        lines = wrap(res, 14)
        for k, l in enumerate(lines):
            o.append(T(x1 + 18, yb + 34 + k * 14, l, "start", 9.5, c, True))
    o.append(T(14, 306, "点線: 読んだ時刻。下の記号は、前に読んだ (A, B) と比べた表の値。", "start", 9.5, MUT))
    return SVG(700, 316, o, "表で読むときの 3 つの場合。(a) 変化の間に 1 回ずつ読めば、+1 が 4 回で 1 クリック。(b) A がはね返っても、行き来は +1 と −1 になって打ち消し合う。(c) A と B の両方が変わった後にしか読まないと、表の × になり、向きが分からない。")
F["e11_qread"] = _f11_qread()

# ================= 5 節 =================
def _f11_esd():
    o = []
    rows = [("(a) 何も付けない", False, False, "ピンの保護ダイオードへ 24 A", ALI, "壊れる・リセットする"),
            ("(b) TVS ダイオードだけ", True, False, "ピンへ 2.2 A（例の模型）", ALI, "TVS の電圧がピンより高い"),
            ("(c) TVS ＋ R_s ＋ C_f", True, True, "R_s に 12 mA、ピンは +0.02 V", GRN, "保護ダイオードに流れない")]
    for i, (title, tvs, rs, res, c, sub) in enumerate(rows):
        yb = 30 + i * 84
        yl = yb + 22
        o.append(T(14, yb, title, "start", 10.5, INK, True) if i != 2 else _f11_m(14, yb, [("(c) TVS ＋ ", None, False), ("R", "s", True), (" ＋ ", None, False), ("C", "f", True)], "start", 10.5, INK, True))
        # 放電の模型
        o.append(BOX(14, yl - 14, 118, 30, "ESD 8 kV", None, ALI, ASOFT, ALI, sz=10))
        o.append(T(73, yl + 30, "150 pF・330 Ω", "middle", 9, MUT))
        o.append(ARR(134, yl, 166, yl, c=ALI, lw=1.6, head=6))
        # コネクタ
        o.append(RECT(168, yl - 9, 10, 18, 2, PAN, INK, 1.2))
        xl = 178
        o.append(W(xl, yl, 470, yl, c=TEA, lw=1.5))
        if tvs:
            o.append(D(212, yl, TEA, 3))
            o.append(_f11_diode(212, yl, yl + 34, c=GLD, tvs=True))
            o.append(_f11_gnd(212, yl + 34))
            o.append(T(226, yl + 22, "TVS", "start", 9.5, GLD, True))
        if rs:
            o.append(RECT(262, yl - 7, 60, 14, 0, SCR, "none", 0))
            o.append(_f11_resh(262, 322, yl, c=INK))
            o.append(_f11_m(292, yl - 10, [("R", "s", True), (" 1 kΩ", None, False)], "middle", 9.5, INK))
            o.append(D(360, yl, TEA, 3))
            o.append(_f11_capv(360, yl, yl + 32, c=INK))
            o.append(_f11_gnd(360, yl + 32))
            o.append(_f11_m(372, yl + 22, [("C", "f", True), (" 100 nF", None, False)], "start", 9.5, INK))
        # マイコンとピンの保護ダイオード
        o.append(RECT(470, yl - 30, 72, 66, 6, SSOFT, SIG, 1.3))
        o.append(T(506, yl + 30, "マイコン", "middle", 9.5, SIG, True))
        o.append(_f11_diode(494, yl - 24, yl, c=SIG, s=4))
        o.append(T(504, yl - 16, "電源へ", "start", 8.5, SIG))
        o.append(_f11_diode(494, yl, yl + 22, c=SIG, s=4))
        o.append(T(556, yl - 4, res, "start", 9.5, c, True) if i != 2 else _f11_m(556, yl - 4, [("R", "s", True), (" に 12 mA", None, False)], "start", 9.5, c, True))
        if i == 2:
            o.append(T(556, yl + 10, "ピンは +0.02 V", "start", 9.5, c, True))
            o.append(T(556, yl + 24, sub, "start", 9, MUT))
        else:
            o.append(T(556, yl + 12, sub, "start", 9, MUT))
        # 電流の道
        if not tvs:
            o.append(ARR(400, yl - 8, 466, yl - 8, c=ALI, lw=2.2, head=7))
        elif not rs:
            o.append(ARR(196, yl - 8, 206, yl + 14, c=ALI, lw=1.6, head=6))
            o.append(ARR(400, yl - 8, 466, yl - 8, c=ALI, lw=1.4, head=6))
    return SVG(700, 280, o, "ESD の電流の行き先（8 kV・150 pF・330 Ω の模型と、24 A で 15.6 V に抑える TVS ダイオードの模型で数値計算した値）。(a) 何も無いと、電流はピンの保護ダイオードを通ってマイコンの電源の線へ流れる。(b) TVS ダイオードの電圧はピンの保護ダイオードの電圧より高いので、一部はピンへ流れる。(c) R_s が電流を抑え、C_f が受け止めるので、ピンの電圧はほとんど動かない。")
F["e11_esd"] = _f11_esd()

def _f11_couple():
    o = []
    VD, Cm, Cg, dV, tr = 3.3, 100e-12, 500e-12, 24.0, 0.5e-6
    S = dV / tr
    # 左: 模型
    o.append(T(14, 20, "開いた線の模型", "start", 10.5, INK, True))
    ya, yv = 46, 112
    o.append(W(24, ya, 214, ya, c=PUR, lw=2))
    o.append(T(24, ya - 8, "相手の線: 24 V → 0 V（0.5 µs）", "start", 9.5, PUR, True))
    o.append(_f11_capv(118, ya, yv, c=ALI))
    o.append(_f11_m(130, (ya + yv) / 2 + 4, [("C", "m", True), (" 100 pF", None, False)], "start", 9.5, ALI))
    o.append(W(30, yv, 290, yv, c=TEA, lw=1.6))
    o.append(T(30, yv + 52, "スイッチ", "middle", 9, MUT))
    o.append(_f11_swv(30, yv, yv + 30, False, c=TEA))
    o.append(_f11_gnd(30, yv + 30))
    o.append(D(118, yv, TEA, 3))
    o.append(D(184, yv, TEA, 3))
    o.append(_f11_capv(184, yv, yv + 30, c=INK))
    o.append(_f11_gnd(184, yv + 30))
    o.append(_f11_m(196, yv + 22, [("C", "g", True), (" 500 pF", None, False)], "start", 9.5, INK))
    o.append(_f11_vdd(246, 60))
    o.append(_f11_resv(246, 60, yv, c=GLD))
    o.append(_f11_m(234, 90, [("R", "p", True)], "end", 10.5, INK))
    o.append(D(246, yv, TEA, 3))
    o.append(T(296, yv + 4, "ピン", "start", 9.5, MUT))
    o.append(_f11_m(14, 196, [("速い変化の下がり幅 ≈ 24 V × ", None, False), ("C", "m", True), ("/(", None, False), ("C", "m", True), (" + ", None, False), ("C", "g", True), (") = 4 V", None, False)], "start", 10, INK))
    o.append(_f11_m(14, 214, [("戻る時定数 τ = ", None, False), ("R", "p", True), ("(", None, False), ("C", "m", True), (" + ", None, False), ("C", "g", True), (")", None, False)], "start", 10, INK))
    o.append(T(14, 232, "スイッチが閉じていれば、線は GND に", "start", 9.5, GRN))
    o.append(T(14, 246, "つながっていて、ほとんど動かない", "start", 9.5, GRN))
    # 右: 波形
    p = Plot(388, 26, 296, 196, (0, 60), (-1, 3.6))
    o.append(p.axes(xl="相手の線が下がり始めてからの時間 [µs]", yl="線の電圧 [V]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[0, 1, 2, 3],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    for v, nm, c in ((0.7 * VD, "IH", GRN), (0.3 * VD, "IL", GLD)):
        o.append(W(p.X(0), p.Y(v), p.X(60), p.Y(v), c=c, lw=1, dash="5 3"))
    o.append(_f11_m(p.X(52), p.Y(0.7 * VD) + 13, [("V", "IH", True)], "middle", 9.5, GRN))
    o.append(_f11_m(p.X(52), p.Y(0.3 * VD) - 5, [("V", "IL", True)], "middle", 9.5, GLD))
    labs = []
    for R, c, nm in ((47e3, ALI, "47 kΩ: 約 39 µs"), (4.7e3, GLD, "4.7 kΩ: 約 4 µs"), (1e3, GRN, "1 kΩ: 約 1 µs")):
        tau = R * (Cm + Cg)
        pts = []
        for k in range(0, 1201):
            t = k * 0.05e-6
            if t <= tr:
                u = R * Cm * S * (1 - math.exp(-t / tau))
            else:
                u0 = R * Cm * S * (1 - math.exp(-tr / tau))
                u = u0 * math.exp(-(t - tr) / tau)
            pts.append((t * 1e6, VD - u))
        o.append(p.line(pts, c=c, lw=2))
        labs.append((nm, c))
    o.append(_f11_m(p.X(60) - 4, p.Y(0.5), [("R", "p", True), (": H と読めない時間", None, False)], "end", 9, MUT))
    for k, (nm, c) in enumerate(labs):
        o.append(T(p.X(60) - 4, p.Y(0.5) + 15 * (k + 1), nm, "end", 9.5, c, True))
    return SVG(700, 268, o, "長い線の誘導ノイズ（C_m 100 pF、C_g 500 pF、24 V の線が 0.5 µs で下がる。例の値）。相手の線の変化が速いので、下がり幅は容量の分圧 4 V に近く、プルアップ抵抗ではあまり変わらない。元に戻る時定数はプルアップ抵抗に比例するので、抵抗を小さくするとノイズは短いパルスになる。")
F["e11_couple"] = _f11_couple()

def _f11_protect():
    o = []
    y = 96
    # 遠くのスイッチ
    o.append(T(14, 20, "(a) 長い線のスイッチの入力", "start", 11, INK, True))
    o.append(_f11_swv(40, y, y + 44, False, c=TEA))
    o.append(_f11_gnd(40, y + 44))
    o.append(T(40, y - 22, "スイッチ", "middle", 9.5, MUT))
    o.append(W(40, y, 64, y, c=TEA, lw=1.5))
    o.append(PATH("M64,%g C80,%g 92,%g 108,%g S136,%g 152,%g" % (y, y - 8, y + 8, y, y - 8, y), c=TEA, lw=1.5, dash="5 3"))
    o.append(T(108, y + 26, "数 m〜十数 m", "middle", 9.5, MUT))
    o.append(W(152, y, 168, y, c=TEA, lw=1.5))
    o.append(RECT(168, y - 10, 12, 20, 2, PAN, INK, 1.2))
    o.append(T(174, y - 16, "コネクタ", "middle", 9, MUT))
    xl = 180
    o.append(W(xl, y, 520, y, c=TEA, lw=1.5))
    # TVS
    o.append(D(204, y, TEA, 3))
    o.append(_f11_diode(204, y, y + 40, c=GLD, tvs=True))
    o.append(_f11_gnd(204, y + 40))
    # プルアップ（線の側）
    o.append(D(262, y, TEA, 3))
    o.append(_f11_resv(262, y - 50, y, c=GLD))
    o.append(_f11_vdd(262, y - 50))
    # R_s
    o.append(RECT(300, y - 7, 60, 14, 0, SCR, "none", 0))
    o.append(_f11_resh(300, 360, y, c=INK))
    # C_f
    o.append(D(400, y, TEA, 3))
    o.append(_f11_capv(400, y, y + 34, c=INK))
    o.append(_f11_gnd(400, y + 34))
    # シュミット
    sch, xo = _f11_schmitt(440, y, SIG, 30)
    o.append(sch)
    o.append(W(xo, y, xo + 12, y, c=SIG, lw=1.5))
    o.append(BOX(xo + 12, y - 16, 96, 32, "マイコン", None, SIG, SSOFT, INK, sz=10.5))
    # 番号と説明
    marks = [(204, y + 66, "1"), (262 + 16, y - 26, "2"), (330, y - 18, "3"), (400 + 16, y + 30, "4"), (456, y - 24, "5")]
    for xm, ym, n in marks:
        o.append(CIRC(xm, ym, 8, c=PUR, lw=1.2, fill=PSOFT))
        o.append(T(xm, ym + 4, n, "middle", 9.5, PUR, True))
    notes = [("1", [("TVS ダイオード: ESD とサージを GND へ。コネクタのそばに、GND への道を短く", None, False)]),
             ("2", [("プルアップ ", None, False), ("R", "p", True), (" 4.7 kΩ: 強めにして、誘導ノイズを短いパルスにする（線の側につなぐ）", None, False)]),
             ("3", [("R", "s", True), (" 1 kΩ: ピンへの電流を抑える", None, False)]),
             ("4", [("C", "f", True), (" 100 nF: 短いパルスを受け止める（", None, False), ("R", "s", True), ("C", "f", True), (" = 100 µs。はね返りより短い）", None, False)]),
             ("5", [("シュミットトリガの入力。はね返りは 2 節のプログラムで取り除く", None, False)])]
    for k, (n, parts) in enumerate(notes):
        yy = 186 + k * 18
        o.append(CIRC(22, yy - 4, 7, c=PUR, lw=1.1, fill=PSOFT))
        o.append(T(22, yy, n, "middle", 9, PUR, True))
        o.append(_f11_m(36, yy, parts, "start", 9.5, INK))
    # (b) 止めるための入力
    xb = 580
    o.append(T(xb - 18, 20, "(b) 止めるための入力", "start", 11, INK, True))
    o.append(_f11_vdd(xb + 40, 52))
    o.append(_f11_resv(xb + 40, 52, 82, c=GLD))
    o.append(W(xb + 40, 82, xb + 40, 92, c=TEA, lw=1.5))
    o.append(D(xb + 40, 92, TEA, 3))
    o.append(W(xb + 40, 92, xb + 70, 92, c=TEA, lw=1.5))
    o.append(T(xb + 74, 96, "ピン", "start", 9, MUT))
    o.append(W(xb + 40, 92, xb + 40, 100, c=TEA, lw=1.5))
    o.append(_f11_swv(xb + 40, 100, 132, True, c=TEA))
    o.append(_f11_gnd(xb + 40, 132))
    o.append(T(xb + 54, 116, "普段は", "start", 9, MUT))
    o.append(T(xb + 54, 128, "閉じている", "start", 9, MUT))
    o.append(T(xb - 18, 166, "開く・線が切れる → H", "start", 9.5, GRN, True))
    o.append(T(xb - 18, 180, "→ 止める", "start", 9.5, GRN, True))
    return SVG(700, 280, o, "(a) 長い線の先のスイッチを読む入力の例（値は例）。コネクタのそばの TVS ダイオード、強めのプルアップ、ピンの前の R_s と C_f、シュミットトリガの入力を組み合わせる。(b) 非常停止のような止めるための入力は、普段は閉じている接点にし、開くか線が切れて H になったら止める。")
F["e11_protect"] = _f11_protect()

# ================= 6 節 =================
def _f11_levels():
    o = []
    # (a) 分圧
    o.append(T(14, 20, "(a) 分圧回路", "start", 11, INK, True))
    o.append(T(30, 52, "5 V の信号", "start", 9.5, TEA, True))
    o.append(W(60, 60, 60, 70, c=TEA, lw=1.5))
    o.append(_f11_resv(60, 70, 108, c=INK))
    o.append(T(74, 92, "10 kΩ", "start", 9.5, INK))
    o.append(D(60, 116, TEA, 3))
    o.append(W(60, 108, 60, 124, c=TEA, lw=1.5))
    o.append(_f11_resv(60, 124, 162, c=INK))
    o.append(T(74, 146, "15 kΩ", "start", 9.5, INK))
    o.append(W(60, 162, 60, 168, c=INK, lw=1.5))
    o.append(_f11_gnd(60, 168))
    o.append(W(60, 116, 150, 116, c=TEA, lw=1.5))
    o.append(BOX(150, 100, 70, 32, "ピン", None, SIG, SSOFT, INK, sz=10))
    o.append(T(104, 110, "3.0 V", "middle", 9.5, GRN, True))
    o.append(T(14, 206, "ピンに入るのは 3.0 V", "start", 9.5, GRN, True))
    o.append(T(14, 222, "GND は共有する", "start", 9.5, MUT))
    # (b) 直列の抵抗
    xb = 240
    o.append(T(xb, 20, "(b) 直列の抵抗だけ", "start", 11, INK, True))
    o.append(T(xb + 6, 120, "5 V", "start", 9.5, TEA, True))
    o.append(W(xb + 34, 116, xb + 52, 116, c=TEA, lw=1.5))
    o.append(_f11_resh(xb + 52, xb + 102, 116, c=INK))
    o.append(T(xb + 77, 104, "10 kΩ", "middle", 9.5, INK))
    o.append(W(xb + 102, 116, xb + 132, 116, c=TEA, lw=1.5))
    o.append(RECT(xb + 132, 44, 86, 118, 6, SSOFT, SIG, 1.3))
    o.append(T(xb + 175, 154, "マイコン", "middle", 9.5, SIG, True))
    o.append(_f11_m(xb + 175, 66, [("V", "DD", True), (" 3.3 V", None, False)], "middle", 9.5, GLD))
    o.append(W(xb + 140, 78, xb + 210, 78, c=GLD, lw=1.6))
    o.append(_f11_diode(xb + 152, 78, 116, c=ALI, s=4))
    o.append(W(xb + 132, 116, xb + 152, 116, c=TEA, lw=1.5))
    o.append(ARR(xb + 168, 110, xb + 168, 84, c=ALI, lw=1.6, head=6))
    o.append(T(xb + 174, 102, "保護", "start", 8.5, ALI))
    o.append(T(xb + 174, 113, "ダイオード", "start", 8.5, ALI))
    o.append(T(xb, 190, "0.11 mA が電源の線へ流れ込む", "start", 9.5, ALI, True))
    o.append(T(xb, 206, "眠っていて 2 µA しか使わないと、", "start", 9.5, ALI))
    o.append(T(xb, 222, "電源の電圧が押し上げられる", "start", 9.5, ALI))
    # (c) GND が違う
    xc = 470
    o.append(T(xc, 20, "(c) GND の電位が違う", "start", 11, INK, True))
    o.append(BOX(xc, 50, 80, 50, "相手の機器", None, PUR, PSOFT, INK, sz=10))
    o.append(BOX(xc + 140, 50, 70, 50, "この機器", None, SIG, SSOFT, INK, sz=10))
    o.append(ARR(xc + 82, 66, xc + 138, 66, c=TEA, lw=1.5, head=6))
    o.append(T(xc + 110, 60, "信号", "middle", 9.5, TEA, True))
    o.append(W(xc + 40, 100, xc + 40, 140, c=MUT, lw=1.4))
    o.append(W(xc + 175, 100, xc + 175, 140, c=MUT, lw=1.4))
    o.append(W(xc + 40, 140, xc + 90, 140, c=MUT, lw=1.4))
    o.append(W(xc + 130, 140, xc + 175, 140, c=MUT, lw=1.4))
    o.append(CIRC(xc + 110, 140, 16, c=ALI, lw=1.4, fill=ASOFT))
    o.append(T(xc + 110, 144, "ΔV", "middle", 10, ALI, True))
    o.append(T(xc + 110, 172, "GND の間の電圧", "middle", 9.5, ALI, True))
    o.append(T(xc, 190, "（離れた場所・モータの電流）", "start", 9.5, MUT))
    o.append(T(xc, 206, "ΔV が信号に重なる", "start", 9.5, ALI, True))
    o.append(T(xc, 222, "→ 絶縁して受ける", "start", 9.5, GRN, True))
    return SVG(700, 234, o, "電圧の違う信号の受け方。(a) GND を共有できるなら、分圧回路で電源の電圧より低くする。(b) 直列の抵抗だけでは、超えた分がピンの保護ダイオードを通って電源の線へ流れ込み、眠っているマイコンの電源の電圧を押し上げる。(c) GND の電位が違う機器からの信号は、絶縁して受ける。")
F["e11_levels"] = _f11_levels()

def _f11_opto():
    o = []
    # 入力の側
    yt, yb = 64, 150
    o.append(T(14, 30, "入力（24 V 系、18〜30 V）", "start", 10.5, PUR, True))
    o.append(CIRC(20, yt, 4, c=PUR, lw=1.4, fill=PAN))
    o.append(T(10, yt + 4, "+", "end", 11, PUR, True))
    o.append(CIRC(20, yb, 4, c=PUR, lw=1.4, fill=PAN))
    o.append(T(20, yb + 18, "0 V", "middle", 9.5, PUR, True))
    o.append(W(24, yt, 34, yt, c=PUR, lw=1.5))
    o.append(_f11_resh(34, 84, yt, c=INK))
    o.append(_f11_m(59, yt - 10, [("R", "in", True), (" 4.7 kΩ", None, False)], "middle", 9.5, INK))
    o.append(W(84, yt, 196, yt, c=PUR, lw=1.5))
    o.append(W(24, yb, 196, yb, c=PUR, lw=1.5))
    # 逆向きのダイオード（LED と逆向き: 下から上へ通す）
    xd = 104
    o.append(_f11_diode(xd, yt, yb, c=INK, s=6))
    o.append(T(xd - 8, yt + 60, "逆向き", "end", 9, MUT))
    o.append(T(xd - 8, yt + 72, "の保護", "end", 9, MUT))
    # R_sh
    xr = 136
    o.append(_f11_resv(xr, yt + 10, yb - 10, c=INK))
    o.append(W(xr, yt, xr, yt + 10, c=INK, lw=1.4))
    o.append(W(xr, yb - 10, xr, yb, c=INK, lw=1.4))
    o.append(_f11_m(xr - 6, yb + 14, [("R", "sh", True), (" 1 kΩ", None, False)], "middle", 9, INK))
    # フォトカプラ
    o.append(RECT(158, 40, 150, 128, 8, "none", MUT, 1.2, dash="5 3"))
    o.append(T(233, 34, "フォトカプラ", "middle", 9.5, MUT, True))
    xL = 180
    o.append(_f11_diode(xL, yt + 18, yb - 18, c=GLD, s=7, down=True))
    o.append(W(xL, yt, xL, yt + 18, c=PUR, lw=1.4))
    o.append(W(xL, yb - 18, xL, yb, c=PUR, lw=1.4))
    o.append(T(xL + 8, yb - 22, "LED", "start", 9, GLD, True))
    o.append(ARR(xL + 12, 100, xL + 44, 100, c=GLD, lw=1.3, head=5))
    o.append(ARR(xL + 12, 112, xL + 44, 112, c=GLD, lw=1.3, head=5))
    o.append(W(233, 44, 233, 166, c=ALI, lw=1.2, dash="3 3"))
    o.append(T(233, 182, "絶縁", "middle", 9.5, ALI, True))
    # フォトトランジスタ
    xT = 270
    o.append(W(xT - 10, 92, xT - 10, 120, c=SIG, lw=2.2))
    o.append(W(xT - 10, 100, xT + 6, 86, c=SIG, lw=1.5))
    o.append(ARR(xT - 10, 112, xT + 6, 126, c=SIG, lw=1.5, head=5))
    o.append(W(xT + 6, 86, xT + 6, 70, c=SIG, lw=1.5))
    o.append(W(xT + 6, 126, xT + 6, 160, c=SIG, lw=1.5))
    o.append(_f11_gnd(xT + 6, 160))
    # 出力の側
    o.append(_f11_vdd(xT + 6, 30, "3.3 V", GLD, 9.5))
    o.append(_f11_resv(xT + 6, 30, 62, c=GLD))
    o.append(_f11_m(xT + 18, 50, [("R", "L", True), (" 10 kΩ", None, False)], "start", 9, INK))
    o.append(W(xT + 6, 62, xT + 6, 70, c=SIG, lw=1.5))
    o.append(D(xT + 6, 70, SIG, 3))
    o.append(W(xT + 6, 70, 352, 70, c=SIG, lw=1.5))
    o.append(BOX(352, 56, 64, 28, "ピン", None, SIG, SSOFT, INK, sz=10))
    o.append(T(316, 104, "入力が来ると L", "start", 9, SIG))
    o.append(T(14, 214, "LED の電流", "start", 9.5, INK, True))
    o.append(_f11_m(14, 232, [("I", "F", True), (" = (", None, False), ("V", "in", True), (" − ", None, False), ("V", "F", True), (")/", None, False), ("R", "in", True), (" − ", None, False), ("V", "F", True), ("/", None, False), ("R", "sh", True)], "start", 10, INK))
    o.append(_f11_m(14, 254, [("18 V で 2.37 mA、30 V で 4.93 mA（", None, False), ("V", "F", True), (" = 1.2 V）", None, False)], "start", 9.5, MUT))
    o.append(T(14, 270, "約 5.7 V より低い入力では LED が光らない（OFF）", "start", 9.5, GRN))
    # 右: 電流の比べ
    p = Plot(500, 0, 140, 1, (0, 2.5), (0, 1))
    X = p.X
    o.append(T(440, 30, "入力 18 V のとき", "start", 10.5, INK, True))
    bars = [("LED の電流", 2.37, TEA, "2.37 mA"), ("CTR 50 %", 1.185, GRN, "1.19 mA"), ("年月で 25 %", 0.593, GLD, "0.59 mA"),
            ("要る電流", 0.29, SIG, "0.29 mA")]
    for k, (nm, v, c, lab) in enumerate(bars):
        yy = 46 + k * 30
        o.append(T(X(0) - 8, yy + 13, nm, "end", 9.5, c, True))
        o.append(RECT(X(0), yy + 2, X(v) - X(0), 16, 2, soft(c), c, 1.1))
        o.append(T(X(v) + 6, yy + 14, lab, "start", 9.5, c, True))
    o.append(_f11_m(440, 184, [("要る電流 = (3.3 − 0.4) V ÷ ", None, False), ("R", "L", True), (" 10 kΩ", None, False)], "start", 9.5, SIG))
    o.append(T(440, 202, "流せる 0.59 mA は要る電流の 2 倍", "start", 9.5, GRN, True))
    o.append(_f11_m(440, 220, [("→ ", None, False), ("R", "L", True), (" ≥ 4.9 kΩ なら L にできる", None, False)], "start", 9.5, INK))
    o.append(_f11_m(440, 246, [("30 V のとき ", None, False), ("R", "in", True), (" の電力 0.18 W", None, False)], "start", 9.5, MUT))
    return SVG(700, 282, o, "24 V 系の信号をフォトカプラで受ける回路の例（値は例）。R_in で LED の電流を決め、R_sh で小さな入力では光らないようにし、逆向きのダイオードで逆接続から LED を守る。右は、入力が最も低いときの、LED の電流と、フォトトランジスタが流せる電流（CTR 50 % と、年月で半分になった 25 %）、ピンを L にするのに要る電流。")
F["e11_opto"] = _f11_opto()
