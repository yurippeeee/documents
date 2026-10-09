# 01 章 合同算術とユークリッドの互除法 の図（figures.py の関数・定数をそのまま使う）
import math as _m01

_B01 = "var(--blue)"
_BS01 = "color-mix(in srgb, var(--blue) 14%, transparent)"


def _n01(v):
    """負の数の符号を U+2212 にする"""
    return str(v).replace("-", "−")


def _cell01(x, y, w, h, s, c=LIN, f=PAN, tc=INK, sz=13, b=False, mono=True, r=5, lw=1.3, dash=None):
    """文字入りの 1 マス"""
    return RECT(x, y, w, h, r, f, c, lw, dash) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, mono)


def _curve01(x1, y1, x2, y2, bend, c=MUT, lw=1.6, head=7, n=24):
    """(x1,y1)→(x2,y2) を弧でつなぎ、終点に矢じりを付ける。bend は弧のふくらみ（正で上）"""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - bend
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append(((1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2,
                    (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t * t * y2))
    return PL(pts[:-2], c, lw) + ARR(pts[-3][0], pts[-3][1], pts[-1][0], pts[-1][1], c, lw, head)


# 1. 時計の文字盤
def _f01_clock():
    o = []
    cx, cy, R = 165, 162, 108

    def pos(k, rr):
        a = _m01.radians(-90 + 30 * k)
        return cx + rr * _m01.cos(a), cy + rr * _m01.sin(a)

    o.append(CIRC(cx, cy, R, LIN, 2, PAN))
    for k in range(12):
        x, y = pos(k, R)
        o.append(W(*pos(k, R - 7), *pos(k, R), c=MUT, lw=1.6))
    # 10 から 5 目盛り時計回りに進む弧
    pts = []
    for i in range(61):
        t = 10 + 5 * i / 60
        pts.append(pos(t, R + 20))
    o.append(PL(pts[:-4], SIG, 2.6))
    o.append(ARR(pts[-5][0], pts[-5][1], pts[-1][0], pts[-1][1], SIG, 2.6, 10))
    lx, ly = pos(12.5, R + 40)
    o.append(T(lx + 6, ly + 4, "+5", "start", 14, SIG, True, True))
    for k in range(12):
        x, y = pos(k, R - 28)
        if k == 10:
            o.append(CIRC(x, y, 17, _B01, 2, _BS01))
            o.append(T(x, y + 5, "10", "middle", 14, _B01, True, True))
        elif k == 3:
            o.append(CIRC(x, y, 17, SIG, 2.2, SSOFT))
            o.append(T(x, y + 5, "3", "middle", 15, SIG, True, True))
        else:
            o.append(T(x, y + 5, str(k), "middle", 13.5, INK, False, True))
    o.append(D(cx, cy, MUT, 3.5))
    # 右: 同じ位置に来る整数
    X0 = 340
    o.append(T(X0, 54, "10 時の 5 時間後", "start", 14, INK, True))
    o.append(T(X0, 80, "10 + 5 = 15。文字盤は 12 で一周するので", "start", 12.5, INK))
    o.append(T(X0, 100, "15 時は 3 時と同じ位置になる", "start", 12.5, INK))
    o.append(T(X0, 140, "文字盤の 3 の位置に来る整数", "start", 12.5, SIG, True))
    xs = [X0 + i * 92 for i in range(4)]
    for x, v in zip(xs, [-9, 3, 15, 27]):
        o.append(_cell01(x, 186, 58, 38, _n01(v), SIG, SSOFT, INK, 15, True))
    for i in range(3):
        o.append(_curve01(xs[i] + 40, 184, xs[i + 1] + 18, 184, 14, MUT, 1.4, 6))
        o.append(T((xs[i] + xs[i + 1]) / 2 + 29, 168, "+12", "middle", 11.5, MUT, False, True))
    o.append(T(X0, 252, "隣どうしの差は 12。どの 2 つの差も 12 の倍数である。", "start", 12, INK))
    o.append(T(X0, 274, "12 時間前（−9 時）も 3 時と同じ位置である。", "start", 12, MUT))
    return SVG(720, 300, o, "時計の文字盤。真上の 0 は 12 時を表す。10 から 5 目盛り進むと 3 に着く。"
               "12 ずつずれた整数は文字盤の同じ位置を指す。")
F["e01_clock"] = _f01_clock()


# 2. 除法の原理: 数直線を m ごとの区間に区切る
def _f01_divmod():
    o = []
    m, lo, hi = 12, -24, 48
    x0, s, y = 40, 9.0, 112
    X = lambda v: x0 + (v - lo) * s
    for q in range(-2, 4):
        a, b = q * m, (q + 1) * m
        o.append(RECT(X(a), y - 15, (b - a) * s, 30, 0, SCR if q % 2 else PAN, LIN, 0.8))
        o.append(T((X(a) + X(b)) / 2, y + 52, "q = %s" % _n01(q), "middle", 11.5, MUT, False, True))
    for v in range(lo, hi + 1):
        big = v % m == 0
        o.append(W(X(v), y - (15 if big else 4), X(v), y + (15 if big else 4), c=INK if big else LIN, lw=1.8 if big else 1))
        if big:
            o.append(T(X(v), y + 33, _n01(v), "middle", 12.5, INK, True, True))
    # 例 1: a = 38 = 3×12 + 2
    for a, q, r, col, ty in [(38, 3, 2, _B01, y - 70), (-9, -1, 3, SIG, y - 70)]:
        base = q * m
        o.append(W(X(base), y - 22, X(base), y - 30, X(a), y - 30, X(a), y - 22, c=col, lw=2))
        o.append(T((X(base) + X(a)) / 2, y - 38, "r = %d" % r, "middle", 12, col, True, True))
        o.append(CIRC(X(a), y, 6, col, 2, col))
        o.append(T(X(a), ty + 2, "a = %s = (%s) × 12 + %d" % (_n01(a), _n01(q), r) if q < 0 else
                   "a = %d = %d × 12 + %d" % (a, q, r), "middle", 12.5, col, True, True))
    o.append(T(20, y + 86, "数直線を 12 の倍数で区切ると、長さ 12 の区間が隙間も重なりもなく並ぶ。", "start", 12, INK))
    o.append(T(20, y + 106, "整数 a はちょうど 1 つの区間に入る。その区間の番号が商 q、左端 12q から a までの距離が余り r である。", "start", 12, INK))
    return SVG(720, y + 122, o, "m = 12 のときの除法の原理。a = 38 も a = −9 も、入る区間がただ 1 つなので q と r がただ 1 組に決まる。"
               "負の a でも余り r は 0 以上 12 未満にとる。")
F["e01_divmod"] = _f01_divmod()


# 3. 剰余類: 12 個ずつ折り返して並べる
def _f01_classes():
    o = []
    m = 12
    x0, y0, cw, ch, gap = 96, 52, 49, 32, 6
    rows = [-1, 0, 1, 2]
    o.append(RECT(x0 + 3 * cw - 2, y0 - 30, cw, 30 + len(rows) * (ch + gap) + 2, 8, SSOFT, SIG, 1.4))
    o.append(T(x0 + 6 * cw, 18, "余り r", "middle", 12, MUT, True))
    for r in range(m):
        o.append(T(x0 + r * cw + cw / 2 - 2, y0 - 10, str(r), "middle", 12.5, SIG if r == 3 else MUT, r == 3, True))
    for i, q in enumerate(rows):
        y = y0 + i * (ch + gap)
        o.append(T(x0 - 14, y + ch / 2 + 4.5, "q = %s" % _n01(q), "end", 12, MUT, False, True))
        for r in range(m):
            v = q * m + r
            if q == 0:
                o.append(_cell01(x0 + r * cw, y, cw - 4, ch, _n01(v), _B01, _BS01, INK, 13, r == 3))
            else:
                o.append(_cell01(x0 + r * cw, y, cw - 4, ch, _n01(v), LIN, "none" if r == 3 else PAN, INK, 13, r == 3))
    yb = y0 + len(rows) * (ch + gap) + 22
    o.append(T(20, yb, "縦の列が 1 つの剰余類。色を付けた列は余り 3 の剰余類 {…, −9, 3, 15, 27, …} で、", "start", 12, INK))
    o.append(T(20, yb + 20, "どの 2 つも差が 12 の倍数なので法 12 で合同である。", "start", 12, INK))
    o.append(T(20, yb + 44, "青枠の q = 0 の行（0〜11）を各列の代表に選んだものが Z₁₂ である。", "start", 12, _B01, True))
    return SVG(720, yb + 60, o, "整数を 12 個ずつ折り返して並べた表。行は商 q、列は余り r を表す。"
               "どの整数も、余りで決まるただ 1 つの列に入る。")
F["e01_classes"] = _f01_classes()


# 4. 途中で余りを取ってよい（2 つの道が同じ結果に着く）
def _f01_shortcut():
    o = []
    bw, bh = 196, 58
    TL, TR, BL, BR = (40, 44), (484, 44), (40, 214), (484, 214)
    o.append(_cell01(*TL, bw, bh, "123 と 456", LIN, PAN, INK, 16, True, False, 10))
    o.append(_cell01(*TR, bw, bh, "56088", LIN, PAN, INK, 17, True, True, 10))
    o.append(_cell01(*BL, bw, bh, "4 と 1", _B01, _BS01, INK, 16, True, False, 10))
    o.append(_cell01(*BR, bw, bh, "4", SIG, SSOFT, SIG, 20, True, True, 10, 2.2))
    # 上: 掛ける
    o.append(ARR(TL[0] + bw + 6, 73, TR[0] - 6, 73, INK, 1.8))
    o.append(T(360, 62, "掛ける", "middle", 12.5, INK, True))
    o.append(T(360, 92, "123 × 456 = 56088（5 桁）", "middle", 11.5, MUT))
    # 下: 掛ける
    o.append(ARR(BL[0] + bw + 6, 243, BR[0] - 6, 243, _B01, 1.8))
    o.append(T(360, 232, "掛ける", "middle", 12.5, _B01, True))
    o.append(T(360, 262, "4 × 1 = 4（7 未満の数どうし）", "middle", 11.5, MUT))
    # 左: 余りを取る
    o.append(ARR(138, TL[1] + bh + 6, 138, BL[1] - 6, _B01, 1.8))
    o.append(T(150, 136, "7 で割った余り", "start", 12, _B01, True))
    o.append(T(150, 156, "123 = 17 × 7 + 4", "start", 11.5, MUT, False, True))
    o.append(T(150, 174, "456 = 65 × 7 + 1", "start", 11.5, MUT, False, True))
    # 右: 余りを取る
    o.append(ARR(582, TR[1] + bh + 6, 582, BR[1] - 6, INK, 1.8))
    o.append(T(594, 146, "7 で割った余り", "start", 12, INK, True))
    o.append(T(594, 166, "56088 =", "start", 11.5, MUT, False, True))
    o.append(T(594, 184, "8012 × 7 + 4", "start", 11.5, MUT, False, True))
    return SVG(720, 290, o, "123 × 456 を 7 で割った余りを 2 通りに求める。右上を通る道は 5 桁の数を作るが、"
               "左下を通る道は 7 未満の数しか使わない。どちらも同じ 4 に着く。")
F["e01_shortcut"] = _f01_shortcut()


# 5. 2 を掛けても 1 にならない（法 12）
def _f01_rows12():
    o = []
    x0, cw, ch = 132, 34, 30
    o.append(T(x0 - 12, 34, "x", "end", 12.5, MUT, True, True))
    for x in range(12):
        o.append(T(x0 + x * cw + (cw - 4) / 2, 34, str(x), "middle", 12, MUT, False, True))
    rows = [(2, "偶数だけ → 1 にならない", ALI), (3, "3 の倍数だけ → 1 にならない", ALI),
            (5, "x = 5 のとき 1 になる", SIG)]
    for i, (a, note, col) in enumerate(rows):
        y = 48 + i * 50
        o.append(T(x0 - 12, y + 20, "%d × x mod 12" % a, "end", 12, INK, True, True))
        for x in range(12):
            v = a * x % 12
            hit = v == 1
            o.append(_cell01(x0 + x * cw, y, cw - 4, ch, str(v), SIG if hit else LIN, SSOFT if hit else PAN,
                             SIG if hit else INK, 13, hit))
        o.append(T(x0 + 12 * cw + 12, y + 20, note, "start", 12, col, True))
    return SVG(760, 210, o, "法 12 で、2・3・5 に x = 0〜11 を掛けた結果を 12 で割った余り。"
               "2 と 3 の行には 1 が現れないので、2 や 3 に掛けて 1 になる数は無い。")
F["e01_rows12"] = _f01_rows12()


# 6. 逆元の表（法 12 と法 7）
def _f01_invtable():
    o = []
    x0, cw, ch = 116, 50, 32

    def panel(y, m, title, note, ncol):
        o.append(T(20, y + 4, title, "start", 13.5, INK, True))
        o.append(T(x0 - 12, y + 40, "a", "end", 12.5, MUT, True, True))
        o.append(T(x0 - 12, y + 80, "逆元", "end", 12.5, MUT, True))
        for a in range(1, m):
            x = x0 + (a - 1) * cw
            inv = next((t for t in range(1, m) if a * t % m == 1), None)
            o.append(_cell01(x, y + 18, cw - 6, ch, str(a), LIN, PAN, INK, 13.5, True))
            if inv is None:
                o.append(_cell01(x, y + 58, cw - 6, ch, "なし", ALI, ASOFT, ALI, 11.5, False, False))
            else:
                o.append(_cell01(x, y + 58, cw - 6, ch, str(inv), SIG, SSOFT, SIG, 13.5, True))
        o.append(T(20, y + 116, note, "start", 12, ncol))

    panel(18, 12, "法 12", "逆元を持つのは 1, 5, 7, 11。どれも 12 と 1 以外の共通の約数を持たない", INK)
    panel(166, 7, "法 7", "1〜6 のすべてが逆元を持つ。例: 2 × 4 = 8 ≡ 1、3 × 5 = 15 ≡ 1", INK)
    return SVG(690, 300, o, "a に掛けると 1 になる数（逆元）を、法 12 と法 7 で探した表。"
               "法 12 で「なし」の 2, 3, 4, 6, 8, 9, 10 は、12 と共通の約数 2 または 3 を持つ。")
F["e01_invtable"] = _f01_invtable()


# 7. 最大公約数と互いに素
def _f01_divisors():
    o = []

    def panel(x0, a, b, res, rcol):
        da = [d for d in range(1, a + 1) if a % d == 0]
        db = [d for d in range(1, b + 1) if b % d == 0]
        com = set(da) & set(db)
        o.append(T(x0, 28, "%d と %d" % (a, b), "start", 13.5, INK, True))
        for k, (n, ds) in enumerate([(a, da), (b, db)]):
            y = 44 + k * 46
            o.append(T(x0 + 70, y + 20, "%d の約数" % n, "end", 12, MUT))
            for i, d in enumerate(ds):
                c = d in com
                o.append(_cell01(x0 + 80 + i * 40, y, 34, 30, str(d), SIG if c else LIN, SSOFT if c else PAN,
                                 SIG if c else INK, 13, c))
        o.append(T(x0, 160, "公約数（色付き）: " + ", ".join(str(d) for d in sorted(com)), "start", 12, INK))
        o.append(T(x0, 182, res, "start", 12.5, rcol, True))

    panel(20, 12, 8, "最大公約数 gcd(12, 8) = 4", INK)
    panel(390, 12, 5, "gcd(12, 5) = 1 → 12 と 5 は互いに素", SIG)
    return SVG(740, 200, o, "両方を割り切る数（公約数）のうち最大のものが最大公約数。"
               "最大公約数が 1、つまり共通の約数が 1 しか無い 2 数を互いに素という。")
F["e01_divisors"] = _f01_divisors()


# 8. 互除法の割り算の連鎖
def _f01_euclid_chain():
    o = []
    steps = [(1071, 2, 462, 147), (462, 3, 147, 21), (147, 7, 21, 0)]
    cx = {"a": 34, "q": 150, "b": 208, "r": 318}
    wd = {"a": 78, "q": 34, "b": 78, "r": 78}
    bh = 38
    o.append(T(cx["a"] + 39, 30, "割られる数", "middle", 11.5, MUT))
    o.append(T(cx["q"] + 17, 30, "商", "middle", 11.5, MUT))
    o.append(T(cx["b"] + 39, 30, "割る数", "middle", 11.5, MUT))
    o.append(T(cx["r"] + 39, 30, "余り", "middle", 11.5, MUT))
    ys = [42 + i * 74 for i in range(3)]
    for i, (a, q, b, r) in enumerate(steps):
        y = ys[i]
        last = i == 2
        o.append(_cell01(cx["a"], y, wd["a"], bh, str(a), LIN, PAN, INK, 15, True))
        o.append(T(cx["a"] + wd["a"] + 15, y + 25, "=", "middle", 15, INK))
        o.append(_cell01(cx["q"], y, wd["q"], bh, str(q), LIN, SCR, MUT, 14))
        o.append(T(cx["q"] + wd["q"] + 12, y + 25, "×", "middle", 15, INK))
        o.append(_cell01(cx["b"], y, wd["b"], bh, str(b), SIG if last else _B01, SSOFT if last else _BS01,
                         SIG if last else INK, 15, True, True, 5, 2.4 if last else 1.3))
        o.append(T(cx["b"] + wd["b"] + 15, y + 25, "+", "middle", 15, INK))
        o.append(_cell01(cx["r"], y, wd["r"], bh, str(r), ALI if last else SIG, ASOFT if last else SSOFT,
                         ALI if last else INK, 15, True))
        if i < 2:
            y2 = ys[i + 1]
            o.append(ARR(cx["b"] + 30, y + bh + 2, cx["a"] + 50, y2 - 2, _B01, 1.8))
            o.append(ARR(cx["r"] + 30, y + bh + 2, cx["b"] + 50, y2 - 2, SIG, 1.8))
    yl = ys[2] + 100
    o.append(W(cx["a"], yl - 4, cx["a"] + 26, yl - 4, c=_B01, lw=2))
    o.append(T(cx["a"] + 34, yl, "割る数が、次の段の割られる数になる", "start", 11.5, _B01))
    o.append(W(370, yl - 4, 396, yl - 4, c=SIG, lw=2))
    o.append(T(404, yl, "余りが、次の段の割る数になる", "start", 11.5, SIG))
    # 右: gcd の列
    gx = 470
    lines = ["gcd(1071, 462)", "= gcd(462, 147)", "= gcd(147, 21)", "= gcd(21, 0) = 21"]
    for i, s in enumerate(lines):
        y = (ys[i] + 25) if i < 3 else ys[2] + 70
        o.append(T(gx, y, s, "start", 14, SIG if i == 3 else INK, i == 3, True))
    o.append(T(cx["a"], ys[2] + 70, "余りが 0 になった段の割る数 21 が答え", "start", 12.5, SIG, True))
    return SVG(740, ys[2] + 114, o, "gcd(1071, 462) を求める互除法。各段で「割る数」と「余り」が 1 段ずつ左へずれ、"
               "次の段の「割られる数」と「割る数」になる。右の列は、各段で最大公約数が変わらないことを表す。")
F["e01_euclid_chain"] = _f01_euclid_chain()


# 9. 2 段で半分以下になる（場合分け）
def _f01_halving():
    o = []
    x0, s = 150, 3.6

    def bar(y, a, b, lab, col, fl, tx=None):
        o.append(RECT(x0 + a * s, y, (b - a) * s, 22, 3, fl, col, 1.4))
        o.append(T(x0 + (a + b) / 2 * s if tx is None else tx, y + 15.5, lab, "middle", 12, INK, True, True))

    def panel(y, title, r, rp, note1, note2):
        o.append(T(20, y, title, "start", 13.5, INK, True))
        o.append(T(x0 - 12, y + 31, "割る数", "end", 11.5, MUT))
        bar(y + 16, 0, 100, "b = 100", LIN, SCR, x0 + 24 * s)
        o.append(T(x0 - 12, y + 61, "余り", "end", 11.5, MUT))
        bar(y + 46, 0, r, "r = %d" % r, _B01, _BS01)
        o.append(T(x0 - 12, y + 91, "次の余り", "end", 11.5, MUT))
        if r > 50:
            bar(y + 76, r, 100, "r′ = %d" % rp, SIG, SSOFT)
            o.append(W(x0, y + 87, x0 + r * s, y + 87, c=_B01, lw=1.4, dash="4,3"))
        else:
            bar(y + 76, 0, rp, "r′ = %d" % rp, SIG, SSOFT, x0 + rp * s + 34)
        o.append(W(x0 + 50 * s, y + 8, x0 + 50 * s, y + 106, c=ALI, lw=1.6, dash="5,4"))
        o.append(T(x0 + 50 * s, y + 4, "b/2", "middle", 11.5, ALI, True, True))
        o.append(T(x0 + 100 * s + 18, y + 52, note1, "start", 12, INK))
        o.append(T(x0 + 100 * s + 18, y + 72, note2, "start", 12, SIG, True))

    panel(30, "場合 1: r ≤ b/2（例: r = 30）", 30, 10, "100 = 3 × 30 + 10", "r′ < r ≤ b/2")
    panel(170, "場合 2: r > b/2（例: r = 70）", 70, 30, "100 = 1 × 70 + 30", "r′ = b − r < b/2")
    return SVG(720, 292, o, "互除法の 1 段目の割る数を b、余りを r、2 段目（b を r で割る）の余りを r′ とする。"
               "r が b/2 以下でも、b/2 より大きくても、r′ は b/2 より小さい。")
F["e01_halving"] = _f01_halving()


# 10. 拡張ユークリッドの表（行の計算）
def _f01_recurrence():
    o = []
    rows = [(0, 1071, None, 1, 0, None), (1, 462, 2, 0, 1, None),
            (2, 147, 3, 1, -2, ("1071 − 2·462", "1 − 2·0", "0 − 2·1", "行 0 − 2 × 行 1")),
            (3, 21, 7, -3, 7, ("462 − 3·147", "0 − 3·1", "1 − 3·(−2)", "行 1 − 3 × 行 2")),
            (4, 0, None, 22, -51, ("147 − 7·21", "1 − 7·(−3)", "−2 − 7·7", "行 2 − 7 × 行 3"))]
    cols = {"i": (20, 40), "r": (70, 130), "q": (210, 60), "x": (280, 110), "y": (400, 110)}
    heads = {"i": "行", "r": "余り r", "q": "商 q", "x": "x", "y": "y"}
    for k, (x, w) in cols.items():
        o.append(T(x + w / 2, 30, heads[k], "middle", 12, MUT, True))
    o.append(T(530, 30, "計算のしかた", "start", 12, MUT, True))
    y = 40
    for (i, r, q, xx, yy, f) in rows:
        h = 52 if f else 38
        gc = i == 3
        o.append(RECT(14, y, 690, h, 6, SSOFT if gc else PAN, SIG if gc else LIN, 1.6 if gc else 1))
        tc = ALI if i == 4 else INK
        cy = y + (20 if f else 24)
        o.append(T(cols["i"][0] + 20, cy + 2, str(i), "middle", 13, MUT, False, True))
        o.append(T(cols["r"][0] + 65, cy + 2, str(r), "middle", 15, tc, True, True))
        o.append(T(cols["q"][0] + 30, cy + 2, "—" if q is None else str(q), "middle", 14, SIG if q else FNT, True, True))
        o.append(T(cols["x"][0] + 55, cy + 2, _n01(xx), "middle", 15, tc, True, True))
        o.append(T(cols["y"][0] + 55, cy + 2, _n01(yy), "middle", 15, tc, True, True))
        if f:
            o.append(T(cols["r"][0] + 65, y + 42, f[0], "middle", 10.5, MUT, False, True))
            o.append(T(cols["x"][0] + 55, y + 42, f[1], "middle", 10.5, MUT, False, True))
            o.append(T(cols["y"][0] + 55, y + 42, f[2], "middle", 10.5, MUT, False, True))
            o.append(T(530, cy + 2, f[3], "start", 12.5, INK, True))
        elif i == 0:
            o.append(T(530, cy + 2, "初期値: r = a", "start", 12, MUT))
        elif i == 1:
            o.append(T(530, cy + 2, "初期値: r = b", "start", 12, MUT))
        y += h + 6
    o.append(T(20, y + 18, "行 3: 21 = 1071 × (−3) + 462 × 7（gcd とベズーの等式の係数）", "start", 12.5, SIG, True))
    o.append(T(20, y + 40, "行 4: 余りが 0 になったので終了。1 つ上の行 3 が答え", "start", 12, ALI))
    return SVG(720, y + 56, o, "a = 1071、b = 462 の拡張ユークリッドの互除法。新しい行は「2 つ上の行 − q × 1 つ上の行」で、"
               "余り r と係数 x, y の 3 列に同じ計算をする。灰色の小さな式が各列の計算。")
F["e01_recurrence"] = _f01_recurrence()


# 11. 逆元の存在条件の証明の流れ
def _f01_invproof():
    o = []

    def lane(y, title, tcol, items, notes):
        o.append(T(14, y, title, "start", 13, tcol, True))
        bw, gap, x = 146, 44, 14
        for k, (t, sub, c, fl) in enumerate(items):
            o.append(BOX(x, y + 22, bw, 50, t, sub, c, fl, INK, 8, 1.5, 12.5, 10.5))
            if k < len(items) - 1:
                o.append(ARR(x + bw + 3, y + 47, x + bw + gap - 3, y + 47, MUT, 1.6))
                if notes[k]:
                    o.append(T(x + bw + gap / 2, y + 92, notes[k], "middle", 11, MUT))
            x += bw + gap

    lane(24, "（⇐）gcd(a, m) = 1 なら、逆元がある", SIG,
         [("gcd(a, m) = 1", None, SIG, SSOFT), ("ax + my = 1", "x, y は整数", LIN, PAN),
          ("ax ≡ 1 (mod m)", None, LIN, PAN), ("x が a の逆元", None, SIG, SSOFT)],
         ["ベズーの等式", "my ≡ 0 を落とす", "逆元の定義"])
    lane(148, "（⇒）逆元 x があれば、gcd(a, m) = 1", _B01,
         [("ax ≡ 1 (mod m)", None, _B01, _BS01), ("ax − mk = 1", "k は整数", LIN, PAN),
          ("d が 1 を割り切る", "d = gcd(a, m)", LIN, PAN), ("d = 1", None, _B01, _BS01)],
         ["合同の定義", "左辺は d の倍数", ""])
    return SVG(740, 262, o, "5 節の定理の 2 方向の証明。上は 4 節のベズーの等式から逆元を作る道、"
               "下は逆元があれば最大公約数が 1 しかありえないことを示す道。矢印の下は各段の根拠。")
F["e01_invproof"] = _f01_invproof()


# 12. 指数を 2 進数に分解する（e = 13）
def _f01_bits():
    o = []
    bits = [(3, 1), (2, 1), (1, 0), (0, 1)]
    xs = [150 + k * 100 for k in range(4)]
    w = 74
    sup = {0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 8: "⁸"}
    o.append(T(130, 40, "桁の重み", "end", 12, MUT))
    o.append(T(130, 80, "e = 13 のビット", "end", 12, MUT))
    o.append(T(130, 160, "使う値", "end", 12, MUT))
    for x, (i, b) in zip(xs, bits):
        on = b == 1
        o.append(T(x + w / 2, 40, "2%s = %d" % (sup[i], 2 ** i), "middle", 12.5, INK, False, True))
        o.append(_cell01(x, 60, w, 34, str(b), SIG if on else LIN, SSOFT if on else PAN, SIG if on else FNT, 16, True))
        o.append(ARR(x + w / 2, 96, x + w / 2, 138, SIG if on else FNT, 1.5))
        o.append(_cell01(x, 140, w, 34, "a" + sup[2 ** i], SIG if on else LIN, SSOFT if on else "none",
                         INK if on else FNT, 16, on, True, 5, 1.6 if on else 1.1, None if on else "4,3"))
        if not on:
            o.append(T(x + w / 2, 194, "使わない", "middle", 11, FNT))
    # 積
    px, pw = 150, 374
    o.append(_cell01(px, 232, pw, 40, "a¹³ = a⁸ × a⁴ × a¹", SIG, SSOFT, INK, 16, True))
    for x, (i, b) in zip(xs, bits):
        if b:
            o.append(ARR(x + w / 2, 176, px + pw / 2 + (x + w / 2 - (px + pw / 2)) * 0.55, 230, SIG, 1.4))
    o.append(T(560, 74, "13 = 8 + 4 + 1", "start", 13.5, INK, True, True))
    o.append(T(560, 96, "= 1101₂", "start", 13.5, INK, True, True))
    o.append(T(560, 150, "a⁸, a⁴, a² は a を", "start", 12, MUT))
    o.append(T(560, 170, "2 乗していけば作れる", "start", 12, MUT))
    return SVG(720, 290, o, "指数 e = 13 を 2 進数 1101₂ に分解する。1 が立っている桁の a⁸, a⁴, a¹ を掛けると a¹³ になる。")
F["e01_bits"] = _f01_bits()


# 13. 指数が「足し算で伸びる」か「2 倍で伸びる」か
def _f01_doubling():
    o = []
    X = lambda k: 66 + 40 * k

    def axis(y):
        o.append(W(X(0), y, X(16), y, c=LIN, lw=1.4))
        for k in range(0, 17):
            o.append(W(X(k), y - 4, X(k), y + 4, c=LIN, lw=1))
            o.append(T(X(k), y + 20, str(k), "middle", 11, MUT, False, True))

    y1, y2 = 96, 236
    o.append(T(20, 28, "素直に掛ける: a を 1 回掛けるたびに指数が 1 増える", "start", 13, INK, True))
    axis(y1)
    for k in range(1, 13):
        o.append(_curve01(X(k) + 2, y1 - 6, X(k + 1) - 2, y1 - 6, 16, MUT, 1.3, 5, 14))
    for k in range(1, 14):
        o.append(D(X(k), y1, INK if k in (1, 13) else MUT, 4.2))
    o.append(T(X(13) + 14, y1 - 26, "a¹³", "start", 13, INK, True, True))
    o.append(T(X(16), y1 + 44, "掛け算 12 回", "end", 12.5, INK, True))
    o.append(T(20, 168, "繰り返し二乗法: 2 乗するたびに指数が 2 倍になる", "start", 13, INK, True))
    axis(y2)
    for a, b, lab, col in [(1, 2, "2 乗", _B01), (2, 4, "2 乗", _B01), (4, 8, "2 乗", _B01),
                           (8, 12, "× a⁴", SIG), (12, 13, "× a¹", SIG)]:
        h = 10 + 7 * (b - a)
        o.append(_curve01(X(a) + 3, y2 - 6, X(b) - 3, y2 - 6, h, col, 1.8, 7, 20))
        o.append(T((X(a) + X(b)) / 2, y2 - 12 - h / 2 - 6, lab, "middle", 11.5, col, True))
    for k in (1, 2, 4, 8, 12, 13):
        o.append(D(X(k), y2, SIG if k == 13 else (_B01 if k in (1, 2, 4, 8) else MUT), 4.6))
    o.append(T(X(16), y2 + 44, "2 乗 3 回 + 掛け算 2 回 = 5 回", "end", 12.5, SIG, True))
    return SVG(740, 290, o, "a¹³ に着くまでの掛け算の回数。横軸は作った a のべきの指数。"
               "上は指数が 1 ずつ増えるので 12 回、下は 2 乗で 1 → 2 → 4 → 8 と倍々に増え、残りを a⁴ と a¹ を掛けて埋めるので 5 回で済む。")
F["e01_doubling"] = _f01_doubling()


# 14. 3^13 mod 17 の計算
def _f01_pow3_13():
    o = []
    rows = [(0, 1, "3", "3", True), (1, 0, "3² = 9", "9", False),
            (2, 1, "9² = 81 = 4 × 17 + 13", "13", True), (3, 1, "13² = 169 = 9 × 17 + 16", "16", True)]
    o.append(T(46, 30, "i", "middle", 12, MUT, True, True))
    o.append(T(104, 30, "ビット", "middle", 12, MUT, True))
    o.append(T(160, 30, "3 の 2ⁱ 乗を 17 で割った余り", "start", 12, MUT, True))
    o.append(T(480, 30, "値", "middle", 12, MUT, True))
    o.append(T(610, 30, "掛け合わせるか", "middle", 12, MUT, True))
    for k, (i, b, calc, val, use) in enumerate(rows):
        y = 42 + k * 56
        o.append(T(46, y + 23, str(i), "middle", 13, MUT, False, True))
        o.append(_cell01(86, y, 36, 34, str(b), SIG if b else LIN, SSOFT if b else PAN, SIG if b else FNT, 15, True))
        o.append(T(160, y + 22, calc, "start", 13.5, INK, False, True))
        o.append(_cell01(450, y, 60, 34, val, SIG if use else LIN, SSOFT if use else PAN, INK if use else FNT, 15, True))
        o.append(T(610, y + 22, "使う" if use else "使わない", "middle", 12.5, SIG if use else FNT, use))
        if k < 3:
            o.append(ARR(480, y + 36, 480, y + 54, _B01, 1.4, 6))
            o.append(T(490, y + 50, "2 乗", "start", 10.5, _B01))
    yb = 42 + 4 * 56 + 8
    o.append(RECT(14, yb - 6, 690, 82, 8, SCR, LIN, 1))
    o.append(T(28, yb + 18, "上から順に掛ける:", "start", 12.5, INK, True))
    o.append(T(170, yb + 18, "3 × 13 = 39 = 2 × 17 + 5 → 5", "start", 13.5, INK, False, True))
    o.append(T(170, yb + 44, "5 × 16 = 80 = 4 × 17 + 12 → 12", "start", 13.5, INK, False, True))
    o.append(T(470, yb + 44, "よって 3¹³ mod 17 = 12", "start", 13.5, SIG, True))
    o.append(T(28, yb + 66, "掛け算は 2 乗 3 回 + 掛け算 2 回 = 5 回。途中の数は 16² = 256 を超えない", "start", 12, MUT))
    return SVG(720, yb + 88, o, "13 = 1101₂ なので、ビット i が 1 の行の値（3, 13, 16）を掛け合わせる。"
               "各行の値は 1 つ上の行の値を 2 乗して 17 で割った余りである。")
F["e01_pow3_13"] = _f01_pow3_13()
