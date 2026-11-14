# 02 章 群・環・体 の図（figures.py の関数・定数をそのまま使う）
import math as _m02

_B02 = "var(--blue)"
_BS02 = "var(--blue-soft)"
_GS02 = "var(--muted-soft)"


def _cell02(x, y, w, h, s, c=LIN, f=PAN, tc=INK, sz=13, b=False, mono=True, r=5, lw=1.3, dash=None):
    return RECT(x, y, w, h, r, f, c, lw, dash) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, mono)


def _ring02(cx, cy, R, n, start=-90):
    """n 個の点を円周に等間隔に置いた座標（0 番が真上、時計回り）"""
    return [(cx + R * _m02.cos(_m02.radians(start + 360 * i / n)),
             cy + R * _m02.sin(_m02.radians(start + 360 * i / n))) for i in range(n)]


def _chord02(p, q, c, lw=1.8, head=8, shrink=17, bend=0.0):
    """点 p から q へ、端を縮めた矢印（bend で弧にする）"""
    (x1, y1), (x2, y2) = p, q
    dx, dy = x2 - x1, y2 - y1
    L = (dx * dx + dy * dy) ** 0.5
    ux, uy = dx / L, dy / L
    sx, sy = x1 + ux * shrink, y1 + uy * shrink
    ex, ey = x2 - ux * shrink, y2 - uy * shrink
    if not bend:
        return ARR(sx, sy, ex, ey, c, lw, head)
    mx, my = (sx + ex) / 2 - uy * bend, (sy + ey) / 2 + ux * bend
    pts = []
    for i in range(21):
        t = i / 20
        pts.append(((1 - t) ** 2 * sx + 2 * (1 - t) * t * mx + t * t * ex,
                    (1 - t) ** 2 * sy + 2 * (1 - t) * t * my + t * t * ey))
    return PL(pts[:-2], c, lw) + ARR(pts[-3][0], pts[-3][1], pts[-1][0], pts[-1][1], c, lw, head)


def _optable02(x0, y0, op, elems, cs, hl, out, title, tcol):
    """演算表。hl(v) が真のマスを強調、out(v) が真のマスを集合の外として赤くする"""
    o = [T(x0, y0 - 12, title, "start", 13, tcol, True)]
    o.append(_cell02(x0, y0, cs - 3, cs - 3, op, LIN, SCR, MUT, 14, True))
    for j, b in enumerate(elems):
        o.append(_cell02(x0 + (j + 1) * cs, y0, cs - 3, cs - 3, str(b), LIN, SCR, MUT, 13, True))
    for i, a in enumerate(elems):
        y = y0 + (i + 1) * cs
        o.append(_cell02(x0, y, cs - 3, cs - 3, str(a), LIN, SCR, MUT, 13, True))
        for j, b in enumerate(elems):
            v = out[0](a, b)
            if out[1](v):
                o.append(_cell02(x0 + (j + 1) * cs, y, cs - 3, cs - 3, str(v), ALI, ASOFT, ALI, 13, True))
            elif hl(v):
                o.append(_cell02(x0 + (j + 1) * cs, y, cs - 3, cs - 3, str(v), SIG, SSOFT, SIG, 13, True))
            else:
                o.append(_cell02(x0 + (j + 1) * cs, y, cs - 3, cs - 3, str(v), LIN, PAN, INK, 13))
    return o


# 1. 演算表で 4 条件を読む: Z5* と Z6 から 0 を除いたもの
def _f02_cayley():
    o = []
    cs = 38
    o += _optable02(30, 44, "×", [1, 2, 3, 4], cs, lambda v: v == 1,
                    (lambda a, b: a * b % 5, lambda v: False), "{1, 2, 3, 4}、× mod 5", SIG)
    notes1 = ["全マスが {1, 2, 3, 4} の中 → 閉性 ✓", "1 の行・列は見出しと同じ → 単位元 1 ✓",
              "各行に 1 が 1 回ずつ → 逆元 ✓", "対角線について対称 → 可換 ✓"]
    for k, t in enumerate(notes1):
        o.append(T(30, 252 + k * 20, t, "start", 12, INK))
    o += _optable02(392, 44, "×", [1, 2, 3, 4, 5], cs, lambda v: v == 1,
                    (lambda a, b: a * b % 6, lambda v: v == 0), "{1, 2, 3, 4, 5}、× mod 6", ALI)
    for r in (2, 3, 4):
        y = 44 + r * cs
        o.append(T(392 + 6 * cs + 4, y + 22, "← 1 が無い", "start", 11.5, ALI))
    notes2 = ["0 が出る（集合の外）→ 閉性 ✗", "2, 3, 4 の行に 1 が無い → 逆元 ✗"]
    for k, t in enumerate(notes2):
        o.append(T(392, 292 + k * 20, t, "start", 12, ALI))
    return SVG(740, 340, o, "演算表は、行の要素と列の要素の演算結果を交点に書いた表である。左は群、右は群でない例。"
               "緑のマスは単位元 1、赤のマスは集合の外に出た結果。")
F["e02_cayley"] = _f02_cayley()


# 2. Z8 の部分群（円の上で見る）
def _f02_subgroups():
    o = []

    def panel(cx, H, title, tcol, extra):
        pos = _ring02(cx, 150, 72, 8)
        o.append(T(cx, 32, title, "middle", 13, tcol, True))
        o.append(CIRC(cx, 150, 72, LIN, 1.2, "none", "3,4"))
        if len(H) > 2:
            o.append(PL([pos[h] for h in H] + [pos[H[0]]], SIG, 2, None, SSOFT))
        elif H == [0, 4]:
            o.append(W(*pos[0], *pos[4], c=SIG, lw=2.2))
        for i, (x, y) in enumerate(pos):
            on = i in H
            col = SIG if tcol == SIG else ALI
            o.append(CIRC(x, y, 15, "none", 0, PAN))
            o.append(CIRC(x, y, 15, col if on else LIN, 2 if on else 1.2, (SSOFT if tcol == SIG else ASOFT) if on else PAN))
            o.append(T(x, y + 5, str(i), "middle", 13.5, INK, on, True))
        extra(pos)

    def e1(pos):
        o.append(T(175 - 110, 262, "4 + 4 = 8 ≡ 0 で {0, 4} に戻る", "start", 12, SIG))

    def e2(pos):
        o.append(T(400, 262, "どの 2 つの和も {0, 2, 4, 6} の中", "middle", 12, SIG))

    def e3(pos):
        o.append(_chord02(pos[1], pos[2], ALI, 2.2, 9, 16, 16))
        o.append(T(pos[2][0] + 20, pos[2][1] - 20, "1 + 1 = 2", "start", 12, ALI, True, True))
        o.append(T(630, 262, "2 は {0, 1} の外 → 閉じていない", "middle", 12, ALI))

    panel(150, [0, 4], "{0, 4}: 部分群", SIG, e1)
    panel(400, [0, 2, 4, 6], "{0, 2, 4, 6}: 部分群", SIG, e2)
    panel(630, [0, 1], "{0, 1}: 部分群でない", ALI, e3)
    return SVG(760, 282, o, "足し算の群 Z₈ の 8 個の要素を円周に並べた。色を付けた要素が部分集合 H。"
               "部分群は、要素どうしを足しても H の外に出ない。")
F["e02_subgroups"] = _f02_subgroups()


# 3. 生成元: Z5* で 2 を掛け続ける / 4 を掛け続ける
def _f02_cycles():
    o = []
    order = [1, 2, 4, 3]  # 2 のべきの順に円周へ置く

    def panel(cx, g, title, tcol, note):
        pos = _ring02(cx, 150, 74, 4, -90)
        P = {v: pos[i] for i, v in enumerate(order)}
        o.append(T(cx, 32, title, "middle", 13, tcol, True))
        seq, v = [], g
        while True:
            seq.append(v)
            if v == 1:
                break
            v = v * g % 5
        visited = set(seq)
        for a in seq:
            b = a * g % 5
            o.append(_chord02(P[a], P[b], tcol, 2, 8, 20, 14))
        for v2 in order:
            on = v2 in visited
            x, y = P[v2]
            o.append(CIRC(x, y, 18, "none", 0, PAN))
            o.append(CIRC(x, y, 18, tcol if on else LIN, 2 if on else 1.2, (SSOFT if tcol == SIG else _BS02) if on else PAN))
            o.append(T(x, y + 5, str(v2), "middle", 15, INK if on else FNT, on, True))
        o.append(T(cx, 262, note, "middle", 12, tcol))

    panel(190, 2, "2 を掛け続ける（× 2 mod 5）", SIG, "2 → 4 → 3 → 1 と全要素を巡る → 2 は生成元")
    panel(520, 4, "4 を掛け続ける（× 4 mod 5）", _B02, "4 → 1 で戻る。2, 3 は現れない → 生成元でない")
    return SVG(720, 282, o, "掛け算の群 Z₅* = {1, 2, 3, 4}。矢印は「その要素に g を掛けた結果」への移動を表す。"
               "g のべき g, g², g³, … が全要素を尽くすなら g は生成元である。")
F["e02_cycles"] = _f02_cycles()


# 4. 要素の位数: Z8 で 2 と 3 を足し続ける
def _f02_orders():
    o = []

    def panel(cx, a, tcol, title, note):
        pos = _ring02(cx, 160, 82, 8)
        o.append(T(cx, 30, title, "middle", 13, tcol, True))
        o.append(CIRC(cx, 160, 82, LIN, 1.2, "none", "3,4"))
        v, k, seq = a, 1, [a]
        while v != 0:
            v = (v + a) % 8
            seq.append(v)
        prev = 0
        for k, v in enumerate(seq):
            o.append(_chord02(pos[prev], pos[v], tcol, 1.6, 7, 17, 0))
            mx, my = (pos[prev][0] + pos[v][0]) / 2, (pos[prev][1] + pos[v][1]) / 2
            prev = v
        for i, (x, y) in enumerate(pos):
            on = i in seq
            o.append(CIRC(x, y, 15, "none", 0, PAN))
            o.append(CIRC(x, y, 15, tcol if on else LIN, 2 if on else 1.2, (SSOFT if tcol == SIG else _BS02) if on else PAN))
            o.append(T(x, y + 5, str(i), "middle", 13.5, INK if on else FNT, on, True))
        # 何個目で着いたか
        for k, v in enumerate(seq):
            x, y = pos[v]
            dx, dy = x - cx, y - 160
            L = (dx * dx + dy * dy) ** 0.5
            o.append(T(x + dx / L * 30, y + dy / L * 30 + 4, "%d 個" % (k + 1), "middle", 10.5, tcol, True))
        o.append(T(cx, 304, note, "middle", 12.5, tcol, True))

    panel(190, 2, _B02, "2 を足し続ける", "2 を 4 個足すと初めて 0 → 位数 4")
    panel(530, 3, SIG, "3 を足し続ける", "3 を 8 個足すと初めて 0 → 位数 8")
    return SVG(720, 322, o, "足し算の群 Z₈。0 から出発して a を 1 個ずつ足していき、何個目で単位元 0 に戻るかを数える。"
               "円周の外の「k 個」は、a を k 個足した合計がその要素であることを表す。")
F["e02_orders"] = _f02_orders()


# 5. ラグランジュの定理: 塊に切り分けられるか
def _f02_cosets():
    o = []
    cols = [SIG, _B02, MUT, INK]
    fills = [SSOFT, _BS02, _GS02, PAN]

    def chips(x, y, vals, col, fl, bold=True):
        for k, v in enumerate(vals):
            o.append(_cell02(x + k * 34, y, 30, 26, str(v), col, fl, INK, 13, bold))

    # 左: H = {0, 4}
    o.append(T(30, 26, "H = {0, 4}（部分群）", "start", 13.5, SIG, True))
    seen = {}
    for g in range(8):
        blk = tuple(sorted({(g + h) % 8 for h in (0, 4)}))
        y = 42 + g * 32
        o.append(T(30, y + 18, "%d + H =" % g, "start", 12.5, INK, False, True))
        if blk not in seen:
            seen[blk] = (len(seen), g)
            idx = seen[blk][0]
            chips(120, y, [(g + h) % 8 for h in (0, 4)], cols[idx], fills[idx])
            o.append(T(198, y + 18, "新しい塊", "start", 11.5, cols[idx], True))
        else:
            idx, g0 = seen[blk]
            chips(120, y, [(g + h) % 8 for h in (0, 4)], cols[idx], fills[idx], False)
            o.append(T(198, y + 18, "= %d + H と同じ" % g0, "start", 11.5, MUT))
    o.append(T(30, 316, "4 つの塊 {0,4} {1,5} {2,6} {3,7}", "start", 12, INK))
    o.append(T(30, 336, "に重なりなく分かれる: 8 = 4 × 2", "start", 12, SIG, True))
    # 右: H = {0, 1}
    o.append(T(400, 26, "H = {0, 1}（部分群でない）", "start", 13.5, ALI, True))
    for g in range(8):
        y = 42 + g * 32
        o.append(T(400, y + 18, "%d + H =" % g, "start", 12.5, INK, False, True))
        chips(490, y, [g, (g + 1) % 8], ALI if g < 7 else ALI, ASOFT)
        if g < 7:
            o.append(T(568, y + 18, "%d を次の塊と共有" % ((g + 1) % 8), "start", 11.5, ALI))
        else:
            o.append(T(568, y + 18, "0 を 0 + H と共有", "start", 11.5, ALI))
    o.append(T(400, 316, "隣の塊と 1 個だけ重なり、一致もしない", "start", 12, INK))
    o.append(T(400, 336, "→ 同じ大きさの塊に切り分けられない", "start", 12, ALI, True))
    return SVG(740, 352, o, "Z₈ の各要素 g について、H の各要素に g を足した集合 g + H（塊）を作った。"
               "部分群 {0, 4} では塊が「完全に一致」か「共通要素なし」のどちらかになるが、{0, 1} では一部だけ重なる。")
F["e02_cosets"] = _f02_cosets()


# 6. 帰結: a を |G| 個並べると必ず単位元
def _f02_period():
    o = []

    def panel(x0, y0, title, rows, n, e, opname):
        o.append(T(x0, y0, title, "start", 13, INK, True))
        cw = 40 if n <= 4 else 36
        for k in range(1, n + 1):
            o.append(T(x0 + 70 + (k - 1) * cw + cw / 2 - 2, y0 + 24, "%d 個" % k, "middle", 11, MUT))
        last = x0 + 70 + (n - 1) * cw - 3
        o.append(RECT(last, y0 + 30, cw - 0, len(rows) * 34 + 4, 6, "none", SIG, 2))
        for r, a in enumerate(rows):
            y = y0 + 34 + r * 34
            o.append(T(x0 + 56, y + 19, "a = %d" % a, "end", 12, INK, True, True))
            vals, v = [], e
            for k in range(n):
                v = opname(v, a)
                vals.append(v)
            d = vals.index(e) + 1
            for k, v in enumerate(vals):
                blk = k // d
                x = x0 + 70 + k * cw
                hit = v == e
                fl = SSOFT if hit else (PAN if blk % 2 == 0 else _GS02)
                o.append(_cell02(x, y, cw - 5, 28, str(v), SIG if hit else LIN, fl, SIG if hit else INK, 13, hit))
            o.append(T(x0 + 70 + n * cw + 6, y + 19, "位数 %d" % d, "start", 11.5, MUT))

    panel(20, 26, "Z₅*（|G| = 4、掛け算）", [1, 2, 3, 4], 4, 1, lambda v, a: v * a % 5)
    panel(330, 26, "Z₈（|G| = 8、足し算）", [2, 3, 4, 6], 8, 0, lambda v, a: (v + a) % 8)
    o.append(T(20, 210, "緑のマスが単位元。各行は位数 d ごとに同じ並びを繰り返す（背景の濃淡が 1 周分）。", "start", 12, INK))
    o.append(T(20, 230, "d は |G| を割り切るので、ちょうど |G| 個目（太枠の列）は必ず単位元になる。", "start", 12, SIG, True))
    return SVG(740, 246, o, "a を 1 個、2 個、… と並べて演算した結果。掛け算の群では a の k 乗、足し算の群では a を k 個足した和である。")
F["e02_period"] = _f02_period()


# 7. 環の例: Z4 の演算表
def _f02_ringtables():
    o = []
    cs = 38
    o += _optable02(30, 44, "+", [0, 1, 2, 3], cs, lambda v: v == 0,
                    (lambda a, b: (a + b) % 4, lambda v: False), "足し算 mod 4", SIG)
    o.append(T(30, 252, "各行に 0 が 1 回 → 足し算の逆元がある", "start", 12, SIG))
    o.append(T(30, 272, "（足し算について群）", "start", 12, MUT))

    def hl(v):
        return v == 1
    o += _optable02(390, 44, "×", [0, 1, 2, 3], cs, hl,
                    (lambda a, b: a * b % 4, lambda v: False), "掛け算 mod 4", INK)
    # 2 × 2 = 0 のマスを赤枠で示す
    x = 390 + 3 * cs
    y = 44 + 3 * cs
    o.append(RECT(x - 2, y - 2, cs + 1, cs + 1, 6, "none", ALI, 2.4))
    o.append(RECT(390 + cs - 2, 44 + 3 * cs - 2, 4 * cs + 1, cs + 1, 7, "none", ALI, 1.4, "5,3"))
    o.append(T(390 + 5 * cs + 6, 44 + 3 * cs + 24, "← 1 が無い", "start", 11.5, ALI))
    o.append(T(390, 252, "2 の行に 1 が無い → 2 には掛け算の逆元が無い", "start", 12, ALI))
    o.append(T(390, 272, "0 でない 2 どうしの積 2 × 2 が 0（赤枠）", "start", 12, ALI))
    return SVG(740, 290, o, "Z₄ = {0, 1, 2, 3} の足し算と掛け算の表。足し算は群の条件を満たすが、"
               "掛け算には逆元を持たない要素 2 がある。このように、割り算ができない要素があってもよいのが環である。")
F["e02_ringtables"] = _f02_ringtables()


# 8. Z12 の 0 以外の要素: 逆元を持つか、零因子か
def _f02_zerodiv():
    from math import gcd as _g
    o = []
    x0, cw = 112, 56
    o.append(T(x0 - 12, 44, "a", "end", 12.5, MUT, True, True))
    o.append(T(x0 - 12, 84, "gcd(a, 12)", "end", 12, MUT, False, True))
    o.append(T(x0 - 12, 124, "相手", "end", 12, MUT))
    for a in range(1, 12):
        x = x0 + (a - 1) * cw
        g = _g(a, 12)
        inv = g == 1
        col, fl = (SIG, SSOFT) if inv else (ALI, ASOFT)
        o.append(_cell02(x, 22, cw - 6, 32, str(a), col, fl, INK, 14, True))
        o.append(_cell02(x, 62, cw - 6, 32, str(g), LIN, PAN, SIG if inv else ALI, 13, True))
        if inv:
            t = "×%d=1" % next(b for b in range(1, 12) if a * b % 12 == 1)
        else:
            t = "×%d=0" % (12 // g)
        o.append(_cell02(x, 102, cw - 6, 32, t, col, PAN, col, 11.5, True))
    o.append(RECT(x0 - 4, 150, 16, 12, 3, SSOFT, SIG, 1.2))
    o.append(T(x0 + 18, 160, "逆元を持つ（gcd = 1）: 1, 5, 7, 11。相手は逆元", "start", 12, SIG, True))
    o.append(RECT(x0 - 4, 174, 16, 12, 3, ASOFT, ALI, 1.2))
    o.append(T(x0 + 18, 184, "零因子（gcd = d > 1）: 2, 3, 4, 6, 8, 9, 10。相手は 12/d で、積が 0", "start", 12, ALI, True))
    return SVG(740, 204, o, "Z₁₂ の 0 以外の 11 個の要素を、最大公約数 gcd(a, 12) で 2 つに分けた。"
               "どの要素も「逆元を持つ」か「零因子」のどちらか一方に入る。")
F["e02_zerodiv"] = _f02_zerodiv()


# 9. 法 m を 2〜13 で変えたとき、0 以外のどの要素が逆元を持つか
def _f02_primestrip():
    from math import gcd as _g
    o = []
    x0, cw, rh = 150, 30, 24
    o.append(T(x0 + 6 * cw, 22, "a = 1, 2, …, m − 1", "middle", 12, MUT, True))
    for m in range(2, 14):
        y = 34 + (m - 2) * rh
        pr = all(m % d for d in range(2, m))
        o.append(T(x0 - 14, y + 16, "m = %d" % m, "end", 12.5, SIG if pr else INK, pr, True))
        for a in range(1, m):
            inv = _g(a, m) == 1
            o.append(_cell02(x0 + (a - 1) * cw, y, cw - 4, rh - 4, str(a), SIG if inv else ALI,
                             SSOFT if inv else ASOFT, INK, 10.5, False))
        if pr:
            o.append(T(x0 + 12 * cw + 12, y + 15, "素数: すべて逆元を持つ → 体", "start", 11.5, SIG, True))
    yb = 34 + 12 * rh + 16
    o.append(RECT(x0, yb - 10, 14, 12, 3, SSOFT, SIG, 1.2))
    o.append(T(x0 + 22, yb, "逆元を持つ", "start", 12, INK))
    o.append(RECT(x0 + 130, yb - 10, 14, 12, 3, ASOFT, ALI, 1.2))
    o.append(T(x0 + 152, yb, "逆元を持たない（零因子）", "start", 12, INK))
    return SVG(720, yb + 16, o, "Zₘ の 0 以外の要素のうち、逆元を持つものを緑、持たないものを赤で塗った。"
               "行全体が緑になるのは m が素数のときだけである。")
F["e02_primestrip"] = _f02_primestrip()


# 10. 標数: 1 を足し続ける
def _f02_char():
    o = []

    def chain(y, m, title, tcol):
        o.append(T(20, y, title, "start", 13, tcol, True))
        for k in range(1, m + 1):
            v = k % m
            x = 40 + (k - 1) * 92
            last = v == 0
            o.append(_cell02(x, y + 14, 56, 34, str(v), SIG if last else LIN, SSOFT if last else PAN,
                             SIG if last else INK, 15, True))
            o.append(T(x + 28, y + 66, "1 が %d 個" % k, "middle", 11, MUT))
            if k < m:
                o.append(ARR(x + 59, y + 31, x + 89, y + 31, MUT, 1.5, 6))
                o.append(T(x + 74, y + 24, "+1", "middle", 10.5, MUT, False, True))

    chain(28, 5, "Z₅（体）: 1 を 5 個足して初めて 0 → 標数 5（素数）", SIG)
    chain(132, 6, "Z₆（体ではない）: 1 を 6 個足して初めて 0 → 6 = 2 × 3", ALI)
    o.append(RECT(20, 226, 680, 46, 8, ASOFT, ALI, 1.2))
    o.append(T(36, 245, "（1 + 1）×（1 + 1 + 1）= 2 × 3 = 6 ≡ 0。0 でない 2 と 3 の積が 0 になる（零因子）。", "start", 12, INK))
    o.append(T(36, 264, "体には零因子が無いので、この状況は起きない。だから体の標数は合成数になれない。", "start", 12, ALI, True))
    return SVG(720, 288, o, "標数は、1 を何個足すと初めて 0 になるかを表す数である。"
               "下段のように 1 を足す個数が合成数 ab で 0 になると、a 個の和と b 個の和の積が 0 になる。")
F["e02_char"] = _f02_char()


# 11. GF(2) の表と XOR・AND
def _f02_gf2():
    o = []
    cs = 36
    o += _optable02(24, 44, "+", [0, 1], cs, lambda v: False, (lambda a, b: (a + b) % 2, lambda v: False), "GF(2) の足し算", INK)
    o += _optable02(168, 44, "×", [0, 1], cs, lambda v: False, (lambda a, b: a * b, lambda v: False), "GF(2) の掛け算", INK)
    o.append(T(24 + 54, 176, "= XOR", "middle", 13, SIG, True, True))
    o.append(T(168 + 54, 176, "= AND", "middle", 13, _B02, True, True))
    o.append(T(24, 204, "1 + 1 = 0（繰り上がりは無い）", "start", 12, INK))
    o.append(T(24, 224, "−1 = 1 なので引き算も XOR", "start", 12, INK))
    # 右: 1 バイトの XOR
    X0 = 340
    o.append(T(X0, 32, "8 ビットの XOR = GF(2) の足し算 8 個", "start", 13, INK, True))
    a, b = "10110010", "01100110"
    c = "".join("1" if p != q else "0" for p, q in zip(a, b))
    for r, (lab, s) in enumerate([("x", a), ("y", b), ("x ⊕ y", c)]):
        y = 52 + r * 44
        o.append(T(X0 + 46, y + 22, lab, "end", 13, INK, True, True))
        for i, ch in enumerate(s):
            on = r == 2
            o.append(_cell02(X0 + 56 + i * 38, y, 33, 32, ch, SIG if on else LIN, SSOFT if on else PAN,
                             SIG if on else INK, 14, on))
    o.append(W(X0 + 52, 138, X0 + 56 + 8 * 38, 138, c=INK, lw=1.4))
    o.append(T(X0, 204, "各桁を独立に GF(2) で足す。CPU は 8 桁（64 ビット CPU なら", "start", 12, INK))
    o.append(T(X0, 224, "64 桁）をまとめて 1 命令で XOR する", "start", 12, INK))
    return SVG(720, 240, o, "GF(2) = {0, 1} の足し算は XOR（2 つのビットが異なれば 1）、掛け算は AND（両方 1 のときだけ 1）"
               "と同じ表になる。右は 1 バイトどうしの XOR。")
F["e02_gf2"] = _f02_gf2()


# 12. 群・環・体の包含関係
def _w02(t, sz=12):
    return sum(sz * 1.02 if ord(ch) > 0x2000 else sz * 0.62 for ch in t) + 16


def _f02_hierarchy():
    o = []

    def chip(x, y, t, c):
        w = _w02(t)
        o.append(_cell02(x, y, w, 26, t, c, PAN, INK, 12, False, False, 6))
        return x + w + 8

    # 右: 環 ⊃ 可換環 ⊃ 体
    o.append(RECT(350, 16, 392, 318, 14, PAN, INK, 1.6))
    o.append(T(366, 40, "環: 足し算と掛け算、分配律", "start", 13, INK, True))
    chip(366, 52, "n × n 行列（AB ≠ BA）", INK)
    o.append(RECT(366, 96, 360, 222, 12, SCR, _B02, 1.6))
    o.append(T(380, 120, "可換環: 掛け算も交換できる", "start", 13, _B02, True))
    x = chip(380, 132, "Z", _B02)
    x = chip(x, 132, "Z₁₂", _B02)
    chip(x, 132, "多項式", _B02)
    o.append(RECT(380, 178, 330, 124, 10, SSOFT, SIG, 1.8))
    o.append(T(394, 202, "体: 0 以外は掛け算の逆元を持つ", "start", 13, SIG, True))
    x = chip(394, 214, "Q, R, C", SIG)
    x = chip(x, 214, "GF(p) = Zₚ", SIG)
    chip(x, 214, "GF(2^m)", SIG)
    o.append(T(394, 266, "要素が有限個の体（有限体）が", "start", 12, MUT))
    o.append(T(394, 286, "誤り訂正と暗号の舞台", "start", 12, MUT))
    # 左: 群
    o.append(RECT(16, 16, 214, 196, 14, PAN, MUT, 1.6))
    o.append(T(32, 40, "群: 演算が 1 つ", "start", 13, INK, True))
    o.append(T(32, 60, "その演算の逆元がいつもある", "start", 11.5, MUT))
    yy = 74
    for t in ["(Z, +)", "Z₈ と足し算", "Z₅* と掛け算", "楕円曲線上の点"]:
        o.append(_cell02(32, yy, 182, 26, t, MUT, PAN, INK, 12, False, False, 6))
        yy += 32
    # 矢印
    o.append(ARR(350, 76, 234, 76, INK, 1.7))
    o.append(T(292, 58, "足し算だけ", "middle", 11.5, INK))
    o.append(T(292, 96, "見ると可換群", "middle", 11.5, INK))
    o.append(ARR(380, 246, 140, 216, SIG, 1.7))
    o.append(T(20, 256, "体の 0 以外の要素を", "start", 12, SIG))
    o.append(T(20, 276, "掛け算だけで見ると可換群", "start", 12, SIG))
    return SVG(760, 350, o, "囲みが内側ほど条件が多い。体は可換環でもあり、可換環は環でもある。"
               "環と体から一部の演算だけを取り出すと群になる（矢印）。")
F["e02_hierarchy"] = _f02_hierarchy()
