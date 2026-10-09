# 15 章 数論の道具 の図（figures.py の関数・定数をそのまま使う）
# 図の数値は、ここで Python で計算したものをそのまま描く。
from math import gcd as _g15

_B15 = "var(--blue)"
_BS15 = "var(--blue-soft)"


def _c15(x, y, w, h, s, fill=PAN, c=LIN, tc=INK, sz=12, b=False, mono=True, r=5, lw=1.2):
    """文字入りのマス"""
    return RECT(x, y, w, h, r, fill, c, lw) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, mono)


def _ts15(x, y, parts, a="start", sz=12, c=INK, b=False, mono=False):
    """添字・指数つきの文字列。parts は文字列か (文字列, "sub" / "sup") の並び"""
    fam = MONO if mono else "var(--sans)"
    out = ['<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="%s" font-weight="%s">'
           % (x, y, a, sz, c, fam, "700" if b else "400")]
    cur = 0.0
    for q in parts:
        if isinstance(q, tuple):
            t, kind = q
            tgt = sz * 0.3 if kind == "sub" else -sz * 0.42
            fs = sz * 0.74
        else:
            t, tgt, fs = q, 0.0, sz
        out.append('<tspan dy="%g" font-size="%g">%s</tspan>' % (round(tgt - cur, 2), round(fs, 2), E(t)))
        cur = tgt
    out.append("</text>")
    return "".join(out)


def _strike15(x, y, w, h, c=ALI):
    return W(x + 4, y + h - 4, x + w - 4, y + 4, c=c, lw=1.3)


# ======================================================================
# 1 節
# ======================================================================

# φ(10): 10 と互いに素な数を残す
def _f15_coprime():
    o = []
    n = 10
    x0, cw = 40, 50
    o.append(T(20, 24, "1 から 10 のうち、10 と共通の約数（1 以外）を持つものを除く", "start", 12, INK, True))
    for v in range(1, n + 1):
        x = x0 + (v - 1) * cw
        g = _g15(v, n)
        if g == 1:
            o.append(_c15(x, 40, cw - 8, 36, str(v), SSOFT, SIG, INK, 14, True))
        else:
            o.append(_c15(x, 40, cw - 8, 36, str(v), SCR, LIN, FNT, 14))
            o.append(_strike15(x, 40, cw - 8, 36))
            fac = [str(p) for p in (2, 5) if v % p == 0]
            o.append(T(x + (cw - 8) / 2, 94, "・".join(fac), "middle", 11, ALI, True))
    o.append(T(20, 94, "共通", "start", 10.5, ALI))
    o.append(T(x0 + 10 * cw + 4, 64, "残り 4 個", "start", 12, SIG, True))
    o.append(_ts15(x0 + 10 * cw + 4, 84, ["φ(10) = 4"], "start", 13, SIG, True))
    o.append(T(20, 124, "除くのは 2 の倍数（2, 4, 6, 8, 10）と 5 の倍数（5, 10）。残る 1, 3, 7, 9 が 10 と互いに素", "start", 11.5, MUT))
    return SVG(660, 138, o, "φ(10) の数え方。赤い数字は、その数と 10 が共通に持つ素数。")
F["e15_coprime"] = _f15_coprime()


# φ(p^k): p の倍数だけを除く
def _f15_ppower():
    o = []
    rows = [(9, 3, "n = 9 = 3²", "9 − 3 = 6"), (8, 2, "n = 8 = 2³", "8 − 4 = 4")]
    for r, (n, p, lab, res) in enumerate(rows):
        y = 26 + r * 66
        o.append(T(20, y + 22, lab, "start", 12.5, INK, True))
        for v in range(1, n + 1):
            x = 120 + (v - 1) * 46
            if v % p:
                o.append(_c15(x, y, 38, 34, str(v), SSOFT, SIG, INK, 13, True))
            else:
                o.append(_c15(x, y, 38, 34, str(v), SCR, LIN, FNT, 13))
                o.append(_strike15(x, y, 38, 34))
        o.append(_ts15(120 + n * 46 + 6, y + 22, ["φ = " + res], "start", 12.5, SIG, True))
        o.append(T(120, y + 50, "除くのは %d の倍数 %d 個（%s）" % (p, n // p, ", ".join(str(v) for v in range(p, n + 1, p))),
                   "start", 10.5, ALI))
    return SVG(640, 160, o, "素数 p のべき p<sup>k</sup> の素因数は p だけなので、互いに素でないのは p の倍数 p, 2p, …, p<sup>k−1</sup>·p の p<sup>k−1</sup> 個だけである。")
F["e15_ppower"] = _f15_ppower()


# 乗法性: 1〜mn を m 列の表に並べる（m = 3, n = 5）
def _f15_table():
    o = []
    m, n = 3, 5
    x0, y0, cw, ch = 120, 64, 92, 38
    o.append(T(x0 - 12, 30, "3 で割った余り", "end", 10.5, MUT))
    for c in range(m):
        r = (c + 1) % m
        good = _g15(r, m) == 1
        o.append(T(x0 + c * cw + 40, 30, str(r), "middle", 12, SIG if good else ALI, True, True))
        o.append(T(x0 + c * cw + 40, 48, "互いに素" if good else "3 の倍数", "middle", 10.5, SIG if good else ALI))
    for i in range(n):
        o.append(T(x0 - 12, y0 + i * (ch + 6) + 24, "%d 行目" % (i + 1), "end", 10.5, MUT))
        for c in range(m):
            v = i * m + c + 1
            x, y = x0 + c * cw, y0 + i * (ch + 6)
            col_ok = _g15(v, m) == 1
            if _g15(v, m * n) == 1:
                fl, cl, tc, b = SSOFT, SIG, INK, True
            elif col_ok:
                fl, cl, tc, b = ASOFT, ALI, ALI, False
            else:
                fl, cl, tc, b = SCR, LIN, FNT, False
            o.append(RECT(x, y, 80, ch, 5, fl, cl, 1.2))
            o.append(T(x + 24, y + 25, str(v), "middle", 14, tc, b, True))
            o.append(T(x + 58, y + 24, "%d" % (v % n), "middle", 11, MUT if col_ok else FNT, False, True))
            if not col_ok:
                o.append(_strike15(x, y, 80, ch, LIN))
    yb = y0 + n * (ch + 6)
    o.append(T(x0 + 50, yb + 12, "↑ 5 で割った余り", "start", 10, MUT))
    for c in range(2):
        rs = [((i * m + c + 1) % n) for i in range(n)]
        o.append(T(x0 + c * cw + 40, yb + 34, ",".join(str(v) for v in rs), "middle", 11, SIG, True, True))
    o.append(T(x0 - 12, yb + 34, "余りの並び", "end", 10.5, MUT))
    rx = 420
    o.append(T(rx, 80, "① 3 と互いに素な列は", "start", 11.5, INK))
    o.append(T(rx + 14, 100, "φ(3) = 2 本（1 列目と 2 列目）", "start", 11.5, INK, True))
    o.append(T(rx, 132, "② 1 本の列の 5 個は、5 で割った", "start", 11.5, INK))
    o.append(T(rx + 14, 152, "余りが 0〜4 を 1 回ずつ取る", "start", 11.5, INK, True))
    o.append(T(rx, 184, "③ そのうち 5 と互いに素なのは", "start", 11.5, INK))
    o.append(T(rx + 14, 204, "φ(5) = 4 個（赤は 5 の倍数）", "start", 11.5, INK, True))
    o.append(T(rx, 240, "φ(15) = 2 × 4 = 8", "start", 13, SIG, True))
    return SVG(680, yb + 48, o, "1〜15 を 3 列の表に並べた。同じ列の数は 3 で割った余りが同じ。各マスの右下の小さな数字は 5 で割った余り。"
               "3 と 5 が互いに素なので、1 本の列の中では 5 で割った余りが全部違う。")
F["e15_table"] = _f15_table()


# φ(n) と素因数分解
def _f15_asym():
    o = []
    bh = 34

    def box(x, y, w, s, fill=PAN, c=MUT, tc=INK, b=True):
        return _c15(x, y, w, bh, s, fill, c, tc, 11.5, b, False, 6, 1.3)

    o.append(T(20, 24, "鍵を作る人（p, q を自分で選んだ）", "start", 12, SIG, True))
    o.append(box(20, 34, 130, "p = 11, q = 13", SSOFT, SIG))
    o.append(ARR(152, 51, 188, 51, INK, 1.4))
    o.append(box(190, 34, 230, "φ(n) = 10 × 12 = 120", SSOFT, SIG))
    o.append(T(430, 56, "掛け算 1 回で求まる", "start", 11, SIG))
    o.append(T(20, 104, "攻撃者（n = 143 だけを知っている）", "start", 12, ALI, True))
    o.append(box(20, 114, 130, "n = 143"))
    o.append(ARR(152, 131, 188, 131, ALI, 1.4))
    o.append(box(190, 114, 140, "素因数分解", ASOFT, ALI, ALI))
    o.append(ARR(332, 131, 368, 131, ALI, 1.4))
    o.append(box(370, 114, 120, "p, q → φ(n)"))
    o.append(T(500, 136, "n が大きいと現実的でない", "start", 11, ALI))
    o.append(T(20, 184, "逆向き: φ(n) が分かれば p, q が求まる", "start", 12, INK, True))
    o.append(box(20, 194, 130, "φ(n) = 120"))
    o.append(ARR(152, 211, 176, 211, INK, 1.4))
    o.append(box(178, 194, 212, "p + q = 143 − 120 + 1 = 24"))
    o.append(ARR(392, 211, 414, 211, INK, 1.4))
    o.append(_c15(416, 194, 150, bh, "", PAN, MUT, INK, 11.5, True, False, 6, 1.3))
    o.append(_ts15(491, 216, ["t", ("2", "sup"), " − 24t + 143 = 0"], "middle", 11.5, INK, True))
    o.append(ARR(568, 211, 590, 211, INK, 1.4))
    o.append(box(592, 194, 110, "t = 11, 13", SSOFT, SIG))
    return SVG(720, 240, o, "n = pq = 143 の例。φ(n) を求めることと n を素因数分解することは、一方ができれば他方もできる。")
F["e15_asym"] = _f15_asym()


# ======================================================================
# 2 節
# ======================================================================

def _cycle15(cx, cy, R, seq, a, n, col, title, note, ty=None, ny=None):
    """seq の要素を円周に並べ、×a の矢印でつなぐ。ty, ny は見出しと注記の y（省略時は円の上下）"""
    import math
    o = []
    if title:
        o.append(T(cx, cy - R - 30 if ty is None else ty, title, "middle", 12, col, True))
    k = len(seq)
    pts = []
    for i, v in enumerate(seq):
        if k == 1:
            px, py = cx, cy
        else:
            ang = -math.pi / 2 + 2 * math.pi * i / k
            px, py = cx + R * math.cos(ang), cy + R * math.sin(ang)
        pts.append((px, py))
    if k == 1:
        # 自分自身へ戻る小さな輪
        o.append(CIRC(cx, cy - 24, 10, col, 1.3))
        o.append(ARR(cx + 9, cy - 19, cx + 6, cy - 14, col, 1.3, 5))
    for i in range(k if k > 1 else 0):
        (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % k]
        dx, dy = x2 - x1, y2 - y1
        L = (dx * dx + dy * dy) ** .5
        if k == 2:
            # 2 個のときは 2 本の弧の代わりに、ずらした直線を 2 本
            ox, oy = -dy / L * 7, dx / L * 7
            o.append(ARR(x1 + dx / L * 17 + ox, y1 + dy / L * 17 + oy, x2 - dx / L * 19 + ox, y2 - dy / L * 19 + oy, col, 1.4, 6))
        else:
            o.append(ARR(x1 + dx / L * 17, y1 + dy / L * 17, x2 - dx / L * 19, y2 - dy / L * 19, col, 1.4, 6))
    for i, (px, py) in enumerate(pts):
        v = seq[i]
        o.append(CIRC(px, py, 15, col if v == 1 else col, 1.5, SSOFT if v == 1 else PAN))
        o.append(T(px, py + 5, str(v), "middle", 13, INK, v == 1, True))
    if note:
        o.append(T(cx, cy + R + 34 if ny is None else ny, note, "middle", 11, INK, True))
    return "".join(o)


def _f15_euler():
    o = []
    n = 10
    for i, (a, col) in enumerate([(3, SIG), (7, _B15), (9, ALI), (1, MUT)]):
        seq = []
        v = a
        while True:
            seq.append(v)
            if v == 1:
                break
            v = v * a % n
        d = len(seq)
        cx = 92 + i * 170
        R = 44 if d > 2 else (30 if d == 2 else 0)
        o.append(_cycle15(cx, 104, R, seq, a, n, col, "%d を掛け続ける" % a, "%d の位数 %d" % (a, d), ty=28, ny=184))
    o.append(T(20, 214, "どの要素の位数も 4 = φ(10) の約数なので、どの要素も 4 乗すると 1 に戻る（3⁴ = 81 ≡ 1、9⁴ = 6561 ≡ 1）", "start", 11.5, INK))
    return SVG(700, 228, o, "Z<sub>10</sub><sup>∗</sup> = {1, 3, 7, 9} の各要素について、自分自身を掛け続けたときに現れる値。矢印 1 本が 1 回の掛け算で、1 に戻ると 1 周する。")
F["e15_euler"] = _f15_euler()


# ======================================================================
# 3 節
# ======================================================================

def _f15_crtgrid():
    o = []
    m1, m2 = 3, 5
    x0, y0, cs = 150, 56, 58
    o.append(T(x0 + m2 * cs / 2, 22, "列: x を 5 で割った余り", "middle", 11.5, INK, True))
    for c in range(m2):
        o.append(T(x0 + c * cs + cs / 2 - 2, 46, str(c), "middle", 11, MUT, False, True))
    o.append(T(x0 - 54, y0 + m1 * cs / 2 - 8, "行: x を 3 で", "middle", 11.5, INK, True))
    o.append(T(x0 - 54, y0 + m1 * cs / 2 + 10, "割った余り", "middle", 11.5, INK, True))
    for r in range(m1):
        o.append(T(x0 - 12, y0 + r * cs + cs / 2 + 4, str(r), "middle", 11, MUT, False, True))
    pos = {}
    for x in range(m1 * m2):
        r, c = x % m1, x % m2
        pos[x] = (x0 + c * cs + cs / 2 - 2, y0 + r * cs + cs / 2 - 2)
    for x in range(m1 * m2):
        r, c = x % m1, x % m2
        on = x == 8
        o.append(RECT(x0 + c * cs, y0 + r * cs, cs - 4, cs - 4, 6, ASOFT if on else SSOFT, ALI if on else SIG, 1.8 if on else 1.2))
        o.append(T(pos[x][0], pos[x][1] + 6, str(x), "middle", 16, ALI if on else INK, True, True))
    for x in range(4):
        (x1, y1), (x2, y2) = pos[x], pos[x + 1]
        dx, dy = x2 - x1, y2 - y1
        L = (dx * dx + dy * dy) ** .5
        o.append(ARR(x1 + dx / L * 15, y1 + dy / L * 15, x2 - dx / L * 15, y2 - dy / L * 15, _B15, 1.5, 6))
    rx = x0 + m2 * cs + 20
    o.append(T(rx, 84, "x を 1 増やすと、行も列も", "start", 11.5, INK))
    o.append(T(rx, 102, "1 つずつ進む（青の矢印）", "start", 11.5, INK))
    o.append(T(rx, 136, "15 個のマスが 1 回ずつ埋まる", "start", 11.5, SIG, True))
    o.append(T(rx, 170, "例: 余りの組 (2, 3) のマスは 8", "start", 11.5, ALI, True))
    o.append(T(rx, 188, "8 = 3·2 + 2 = 5·1 + 3", "start", 11.5, ALI, False, True))
    return SVG(680, y0 + m1 * cs + 16, o, "0〜14 の各数 x を、3 で割った余り（行）と 5 で割った余り（列）のマスに書き込んだ。どのマスにもちょうど 1 つの数が入る。")
F["e15_crtgrid"] = _f15_crtgrid()


def _f15_crtbasis():
    o = []
    ms = [3, 5, 7]
    rows = [("e₁ = M₁N₁ = 35·2", 70), ("e₂ = M₂N₂ = 21·1", 21), ("e₃ = M₃N₃ = 15·1", 15)]
    x0 = 250
    cw = 90
    for k, m in enumerate(ms):
        o.append(T(x0 + k * cw + 40, 26, "mod %d" % m, "middle", 12, INK, True, True))
    for r, (lab, v) in enumerate(rows):
        y = 40 + r * 40
        o.append(T(x0 - 16, y + 22, lab + " = %d" % v, "end", 12, INK, False, True))
        for k, m in enumerate(ms):
            res = v % m
            on = res == 1
            o.append(_c15(x0 + k * cw + 10, y, 60, 30, str(res), SSOFT if on else PAN, SIG if on else LIN,
                          INK if on else FNT, 13, on))
    y = 40 + 3 * 40 + 6
    o.append(W(20, y, x0 + 3 * cw, y, c=INK, lw=1.2))
    y += 12
    o.append(T(x0 - 16, y + 22, "2e₁ + 3e₂ + 2e₃ = 233", "end", 12, _B15, True, True))
    for k, m in enumerate(ms):
        o.append(_c15(x0 + k * cw + 10, y, 60, 30, str(233 % m), _BS15, _B15, INK, 13, True))
    y += 40
    o.append(T(x0 - 16, y + 22, "233 mod 105 = 23", "end", 12, SIG, True, True))
    for k, m in enumerate(ms):
        o.append(_c15(x0 + k * cw + 10, y, 60, 30, str(23 % m), SSOFT, SIG, INK, 13, True))
    o.append(T(x0 + 3 * cw + 6, y - 18, "← 欲しい余り (2, 3, 2)", "start", 11.5, _B15, True))
    return SVG(720, y + 44, o, "「ある 1 つの法では余り 1、ほかの法では余り 0」の数 e<sub>i</sub> を作っておくと、e<sub>i</sub> を a<sub>i</sub> 倍して足すだけで、"
               "どの法でも欲しい余りになる。105 を引いても 3 つの法での余りは変わらない（105 は 3・5・7 の倍数）。")
F["e15_crtbasis"] = _f15_crtbasis()


def _f15_rsacrt():
    o = []
    p, q, d, c = 61, 53, 2753, 2790
    dp, dq = d % (p - 1), d % (q - 1)
    mp, mq = pow(c, dp, p), pow(c, dq, q)
    o.append(_c15(20, 92, 110, 40, "c = 2790", PAN, MUT, INK, 12.5, True))
    o.append(ARR(132, 104, 178, 66, INK, 1.4))
    o.append(ARR(132, 120, 178, 158, INK, 1.4))
    o.append(RECT(180, 36, 300, 58, 8, SSOFT, SIG, 1.4))
    o.append(T(330, 58, "法 p = 61、指数 d mod 60 = %d" % dp, "middle", 11.5, INK, True))
    o.append(_ts15(330, 82, ["m", ("p", "sub"), " = 2790", ("53", "sup"), " mod 61 = %d" % mp], "middle", 12, SIG, True))
    o.append(RECT(180, 128, 300, 58, 8, _BS15, _B15, 1.4))
    o.append(T(330, 150, "法 q = 53、指数 d mod 52 = %d" % dq, "middle", 11.5, INK, True))
    o.append(_ts15(330, 174, ["m", ("q", "sub"), " = 2790", ("49", "sup"), " mod 53 = %d" % mq], "middle", 12, _B15, True))
    o.append(ARR(482, 66, 528, 104, INK, 1.4))
    o.append(ARR(482, 158, 528, 120, INK, 1.4))
    o.append(_c15(530, 92, 70, 40, "CRT", SCR, INK, INK, 12.5, True, False))
    o.append(ARR(602, 112, 622, 112, INK, 1.4))
    o.append(_c15(624, 92, 80, 40, "m = 65", SSOFT, SIG, INK, 12.5, True))
    # 手間の比較
    y = 222
    o.append(T(20, y, "掛け算の手間（n を 2k ビットとする）", "start", 12, INK, True))
    o.append(T(20, y + 28, "そのまま", "start", 11.5, MUT))
    o.append(RECT(120, y + 14, 480, 18, 3, ASOFT, ALI, 1.2))
    o.append(T(610, y + 28, "1", "start", 12, ALI, True))
    o.append(T(20, y + 56, "CRT を使う", "start", 11.5, MUT))
    o.append(RECT(120, y + 42, 60, 18, 3, SSOFT, SIG, 1.2))
    o.append(RECT(182, y + 42, 60, 18, 3, _BS15, _B15, 1.2))
    o.append(T(250, y + 56, "1/8 + 1/8 = 1/4", "start", 12, SIG, True))
    o.append(T(20, y + 84, "1 本あたり: 法が k ビット → 1 回の掛け算が約 1/4、指数が k ビット → 掛け算の回数が約 1/2", "start", 11, MUT))
    return SVG(720, y + 98, o, "RSA の復号を CRT で分ける（16 章 3 節の例: p = 61、q = 53、d = 2753）。p と q の 2 本の計算は、法も指数も半分の長さで済む。")
F["e15_rsacrt"] = _f15_rsacrt()


def _f15_fault():
    o = []
    p, q, n = 61, 53, 3233
    m = 65
    mq = 12
    mf = (5 * q * pow(q, -1, p) + mq * p * pow(p, -1, q)) % n
    rows = [(["正しい計算"], "4", "12", str(m), SIG, SSOFT, False),
            (["m", ("p", "sub"), " だけ誤った計算"], "5", "12", str(mf), ALI, ASOFT, True)]
    for r, (title, a, b, res, col, fl, bad) in enumerate(rows):
        y = 30 + r * 64
        o.append(_ts15(20, y + 22, title, "start", 12, col, True))
        o.append(_c15(170, y, 110, 34, "", ASOFT if bad else PAN, ALI if bad else MUT, INK, 12, True))
        o.append(_ts15(225, y + 22, ["m", ("p", "sub"), " = " + a], "middle", 12.5, ALI if bad else INK, True, True))
        o.append(_c15(300, y, 110, 34, "", PAN, MUT, INK, 12, True))
        o.append(_ts15(355, y + 22, ["m", ("q", "sub"), " = " + b], "middle", 12.5, INK, True, True))
        o.append(ARR(412, y + 17, 446, y + 17, INK, 1.4))
        o.append(T(429, y + 10, "CRT", "middle", 10, MUT))
        o.append(_c15(448, y, 120, 34, ("m′ = " if bad else "m = ") + res, fl, col, INK, 12.5, True))
    y = 170
    o.append(T(20, y, "m′ − m = 2079 − 65 = 2014 = 2 × 19 × 53", "start", 12.5, INK, True, True))
    o.append(_ts15(20, y + 24, ["法 53 では一致（m", ("q", "sub"), " は正しい）→ 53 で割り切れる。法 61 では不一致 → 61 では割り切れない"], "start", 11.5, MUT))
    o.append(T(20, y + 52, "gcd(2014, 3233) = 53 = q → 秘密の素数が分かる", "start", 13, ALI, True))
    return SVG(680, y + 66, o, "Bellcore 攻撃（数値は 16 章 3 節の例）。CRT の片側だけを誤らせると、誤った結果と正しい結果の差が q の倍数になる。")
F["e15_fault"] = _f15_fault()


# ======================================================================
# 4 節
# ======================================================================

def _f15_orders():
    import math
    o = []
    # n = 7: 3 のべき
    o.append(T(170, 24, "n = 7: 原始根がある", "middle", 12.5, SIG, True))
    seq = []
    v = 3
    while True:
        seq.append(v)
        if v == 1:
            break
        v = v * 3 % 7
    o.append(_cycle15(170, 128, 66, seq, 3, 7, SIG, "", ""))
    o.append(T(170, 232, "3 を掛け続けると 6 個すべてを巡る", "middle", 11.5, INK))
    o.append(T(170, 250, "3 の位数 6 = φ(7) → 3 は原始根", "middle", 11.5, SIG, True))
    # n = 8
    o.append(T(520, 24, "n = 8: 原始根が無い", "middle", 12.5, ALI, True))
    for i, a in enumerate([3, 5, 7]):
        cx = 420 + i * 100
        o.append(_cycle15(cx, 120, 30, [a, 1], a, 8, ALI, "", ""))
        o.append(T(cx, 186, "%d² = %d ≡ 1" % (a, a * a), "middle", 11, INK, False, True))
    o.append(T(520, 232, "どの要素も 2 回掛けると 1 に戻る", "middle", 11.5, INK))
    o.append(T(520, 250, "位数は最大 2 < φ(8) = 4", "middle", 11.5, ALI, True))
    return SVG(700, 264, o, "Z<sub>7</sub><sup>∗</sup> と Z<sub>8</sub><sup>∗</sup> の比較。矢印 1 本が、その要素を 1 回掛けることを表す。")
F["e15_orders"] = _f15_orders()


# ======================================================================
# 5 節
# ======================================================================

def _f15_dlscatter():
    o = []
    p, g = 101, 2
    X0, Y0, Wd, Hh = 60, 250, 560, 220
    o.append(AXES(X0, Y0, Wd + 20, Hh + 20, "x"))
    o.append(_ts15(X0 + 8, Y0 - Hh - 10, ["y = 2", ("x", "sup"), " mod 101"], "start", 11, MUT, True))
    for t in (0, 25, 50, 75, 99):
        xx = X0 + Wd * t / 99
        o.append(W(xx, Y0, xx, Y0 + 4, c=MUT, lw=1))
        o.append(T(xx, Y0 + 17, str(t), "middle", 10, MUT, False, True))
    for t in (1, 25, 50, 75, 100):
        yy = Y0 - Hh * (t - 1) / 99
        o.append(W(X0 - 4, yy, X0, yy, c=MUT, lw=1))
        o.append(T(X0 - 8, yy + 4, str(t), "end", 10, MUT, False, True))
    pts = []
    for x in range(p - 1):
        y = pow(g, x, p)
        pts.append((X0 + Wd * x / 99, Y0 - Hh * (y - 1) / 99))
    o.append(PL(pts[:12], _B15, 1.0, "3,3"))
    for k, (px, py) in enumerate(pts):
        o.append(D(px, py, SIG if k >= 12 else _B15, 3.2))
    return SVG(660, 280, o, "p = 101、g = 2（原始根）のとき、x = 0, 1, …, 99 に対する 2<sup>x</sup> mod 101 の値。"
               "青い点（x = 0〜11）は順に点線でつないだ。前の値を 2 倍して 101 で割った余りを取るだけなのに、値は 1〜100 を不規則に飛び回り、y から x を読み取る手がかりにならない。")
F["e15_dlscatter"] = _f15_dlscatter()


def _f15_bsgs():
    o = []
    p, g, y, m = 23, 5, 8, 5
    baby = [pow(g, i, p) for i in range(m)]
    ginv = pow(pow(g, m, p), -1, p)
    o.append(T(40, 24, "① baby step: gⁱ の表（i = 0〜4）", "start", 12, SIG, True))
    for i, v in enumerate(baby):
        yy = 38 + i * 34
        o.append(T(60, yy + 20, "i = %d" % i, "start", 11.5, MUT, False, True))
        on = v == 5
        o.append(_c15(120, yy, 70, 28, str(v), SSOFT if on else PAN, SIG if on else LIN, INK, 13, on))
    o.append(T(330, 24, "② giant step: y · (g⁻⁵)ʲ を表と照合", "start", 12, _B15, True))
    giants = []
    cur = y
    for j in range(2):
        giants.append(cur)
        cur = cur * ginv % p
    for j, v in enumerate(giants):
        yy = 38 + j * 50
        hit = v in baby
        o.append(_c15(350, yy, 70, 28, str(v), _BS15 if hit else PAN, _B15 if hit else LIN, INK, 13, hit))
        o.append(T(432, yy + 19, ("j = %d: " % j) + ("表にある（i = 1）" if hit else "表に無い"), "start", 11.5, SIG if hit else MUT, hit))
    o.append(T(350, 152, "j = 1 の値: 8 × 15 = 120 ≡ 5（mod 23）", "start", 11, MUT, False, True))
    o.append(ARR(348, 102, 194, 86, SIG, 1.4))
    o.append(T(330, 196, "g⁻⁵ = 20⁻¹ = 15（20 × 15 = 300 = 13 × 23 + 1）", "start", 11, MUT))
    o.append(T(330, 222, "x = j·m + i = 1 × 5 + 1 = 6", "start", 13, ALI, True))
    o.append(T(40, 222, "掛け算は baby 5 回 + giant 2 回", "start", 11.5, INK))
    return SVG(680, 238, o, "Baby-step Giant-step で 5<sup>x</sup> ≡ 8 (mod 23) を解く（m = 5）。表を引くことで、総当たりの代わりに約 2√p 回の掛け算で済む。")
F["e15_bsgs"] = _f15_bsgs()


def _f15_ph():
    o = []
    o.append(_c15(250, 20, 200, 34, "", PAN, INK, INK, 12, True, False))
    o.append(_ts15(350, 42, ["5", ("x", "sup"), " ≡ 8 (mod 23)"], "middle", 12.5, INK, True))
    o.append(T(470, 42, "p − 1 = 22 = 2 × 11", "start", 11.5, MUT))
    o.append(ARR(300, 56, 180, 88, INK, 1.4))
    o.append(ARR(400, 56, 520, 88, INK, 1.4))
    # 左: mod 2
    o.append(RECT(20, 90, 320, 112, 8, SSOFT, SIG, 1.3))
    o.append(T(180, 110, "x mod 2 を求める: 両辺を 11 乗", "middle", 11.5, SIG, True))
    o.append(_ts15(180, 136, ["(5", ("11", "sup"), ")", ("x", "sup"), " ≡ 8", ("11", "sup"), "　→　(−1)", ("x", "sup"), " ≡ 1"], "middle", 12, INK, False))
    o.append(T(180, 160, "5¹¹ ≡ 22 ≡ −1、8¹¹ ≡ 1（位数 2 の要素）", "middle", 10.5, MUT))
    o.append(T(180, 188, "x ≡ 0 (mod 2)（候補 2 通り）", "middle", 12, SIG, True))
    # 右: mod 11
    o.append(RECT(360, 90, 320, 112, 8, _BS15, _B15, 1.3))
    o.append(T(520, 110, "x mod 11 を求める: 両辺を 2 乗", "middle", 11.5, _B15, True))
    o.append(_ts15(520, 136, ["(5", ("2", "sup"), ")", ("x", "sup"), " ≡ 8", ("2", "sup"), "　→　2", ("x", "sup"), " ≡ 18"], "middle", 12, INK, False))
    o.append(T(520, 160, "2 の位数は 11。2¹, 2², … と調べて 2⁶ ≡ 18", "middle", 10.5, MUT))
    o.append(T(520, 188, "x ≡ 6 (mod 11)（候補 11 通り）", "middle", 12, _B15, True))
    o.append(ARR(180, 204, 300, 234, INK, 1.4))
    o.append(ARR(520, 204, 400, 234, INK, 1.4))
    o.append(_c15(270, 236, 160, 34, "CRT → x = 6", SCR, ALI, ALI, 12.5, True, False))
    return SVG(700, 280, o, "ポーリッヒ・ヘルマン法。要素数 22 の問題を、要素数 2 と 11 の小さな問題に分けて解き、中国剰余定理で組み立てる。")
F["e15_ph"] = _f15_ph()


def _f15_keylen():
    o = []
    rows = [(112, 2048, 224), (128, 3072, 256), (192, 7680, 384), (256, 15360, 512)]
    X0, Wd = 150, 470
    o.append(T(20, 22, "同じ安全性に必要な鍵長（ビット）", "start", 12, INK, True))
    o.append(RECT(430, 10, 12, 12, 2, ASOFT, ALI, 1))
    o.append(T(446, 20, "RSA / DH", "start", 11, INK))
    o.append(RECT(530, 10, 12, 12, 2, SSOFT, SIG, 1))
    o.append(T(546, 20, "楕円曲線", "start", 11, INK))
    for r, (s, a, e) in enumerate(rows):
        y = 40 + r * 50
        o.append(T(X0 - 12, y + 22, "%d ビット安全" % s, "end", 11.5, INK, True))
        wa = Wd * a / 15360
        we = Wd * e / 15360
        o.append(RECT(X0, y + 2, wa, 16, 2, ASOFT, ALI, 1))
        o.append(T(X0 + wa + 6, y + 14, str(a), "start", 11, ALI, True, True))
        o.append(RECT(X0, y + 21, max(we, 2), 14, 2, SSOFT, SIG, 1))
        o.append(T(X0 + we + 6, y + 32, str(e), "start", 11, SIG, True, True))
    return SVG(680, 40 + 4 * 50 + 8, o, "米国 NIST の推奨値。楕円曲線の鍵長は安全性の 2 倍（O(√n) の攻撃しか知られていないため）、"
               "RSA と DH の鍵長は準指数時間の攻撃があるため、それよりずっと長くなる。")
F["e15_keylen"] = _f15_keylen()


# ======================================================================
# 6 節
# ======================================================================

def _f15_mr():
    o = []

    def seq(y, n, a, title, col, note):
        d, s = n - 1, 0
        while d % 2 == 0:
            d //= 2
            s += 1
        xs = [pow(a, d, n)]
        for _ in range(s):
            xs.append(xs[-1] * xs[-1] % n)
        r = [T(20, y, title, "start", 12, col, True)]
        r.append(_ts15(20, y + 22, ["n − 1 = %d = 2" % (n - 1), (str(s), "sup"), " × %d、a = %d" % (d, a)], "start", 11.5, MUT))
        x = 20
        for k, v in enumerate(xs):
            lab = str(v) + ("（= −1）" if v == n - 1 else "")
            w = 62 if v != n - 1 else 108
            bad = v not in (1, n - 1) and k + 1 < len(xs) and xs[k + 1] == 1
            fl, c = (ASOFT, ALI) if bad else ((SSOFT, SIG) if v in (1, n - 1) else (PAN, MUT))
            r.append(_ts15(x + w / 2, y + 48, ["x", (str(k), "sub")], "middle", 11, MUT))
            r.append(_c15(x, y + 56, w, 30, lab, fl, c, INK, 12.5, bad or v in (1, n - 1)))
            if k + 1 < len(xs):
                r.append(ARR(x + w + 2, y + 71, x + w + 30, y + 71, MUT, 1.3))
                r.append(T(x + w + 16, y + 64, "²", "middle", 11, MUT))
            x += w + 32
        r.append(T(x + 6, y + 76, note, "start", 12, col, True))
        return "".join(r)

    o.append(seq(24, 13, 2, "素数 n = 13", SIG, "−1 の後に 1 → たぶん素数"))
    o.append(seq(140, 561, 2, "カーマイケル数 n = 561 = 3 × 11 × 17", ALI, ""))
    o.append(T(20, 262, "67 は ±1（1 と 560）でないのに 67² ≡ 1 → 合成数と確定。", "start", 12, ALI, True))
    o.append(T(20, 284, "(67 − 1)(67 + 1) ≡ 0 で、gcd(66, 561) = 33、gcd(68, 561) = 17 は 561 の約数になっている", "start", 11.5, MUT))
    return SVG(700, 298, o, "ミラー・ラビン・テストの列 x<sub>0</sub>, x<sub>1</sub>, … （各項は前の項の 2 乗）。素数なら、1 の直前は必ず 1 か −1 になる。")
F["e15_mr"] = _f15_mr()
