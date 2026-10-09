# 10 章 BCH 符号 の図（figures.py の関数・定数をそのまま使う）
# 他の章のファイルと同じ名前空間で exec されるので、補助関数・定数は名前に 10 を付ける。

_B10 = "var(--blue)"
_BS10 = "color-mix(in srgb, var(--blue) 15%, transparent)"
_SUP10 = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def _gf10_tables():
    exp, log, v = [], {}, 1
    for i in range(15):
        exp.append(v)
        log[v] = i
        v <<= 1
        if v & 16:
            v ^= 0b10011
    return exp, log


_EXP10, _LOG10 = _gf10_tables()


def _a10(i):
    """α^i（GF(2^4)、x^4+x+1）の 4 ビット文字列"""
    return format(_EXP10[i % 15], "04b")


def _al10(i):
    """α^i の表記"""
    return "α" + str(i).translate(_SUP10)


def _ev10(bits, i):
    """GF(2) 係数の多項式（左端が最高次のビット列）に α^i を代入した値（整数）"""
    d = len(bits) - 1
    v = 0
    for k, b in enumerate(bits):
        if b == "1":
            v ^= _EXP10[(i * (d - k)) % 15]
    return v


_ST10 = {
    "n": (PAN, LIN, INK, False),
    "d": (SSOFT, SIG, INK, False),
    "c": (_BS10, _B10, INK, False),
    "e": (ASOFT, ALI, ALI, True),
    "z": (SCR, LIN, FNT, False),
    "h": (SSOFT, SIG, SIG, True),
    "b": (_BS10, _B10, _B10, True),
}


def _c10(x, y, ch, st="n", w=22, h=24, sz=12):
    fl, c, tc, b = _ST10[st]
    return (RECT(x, y, w - 3, h, 4, fl, c, 1.2)
            + T(x + (w - 3) / 2, y + h / 2 + sz * 0.36, ch, "middle", sz, tc, b, True))


def _r10(x, y, s, sts="n", w=22, h=24, sz=12):
    if len(sts) == 1:
        sts = sts * len(s)
    return "".join(_c10(x + i * w, y, ch, sts[i], w, h, sz) for i, ch in enumerate(s) if ch != " ")


def _xorsum10(x0, y0, rows, result_label, res_style, title=None, labw=110, cw=24, rh=28, note=None):
    """XOR の縦の筆算。rows = [(ラベル, 4 ビット文字列)]"""
    o = []
    if title:
        o.append(T(x0, y0 - 12, title, "start", 12.5, INK, True))
    acc = 0
    for k, (lab, bits) in enumerate(rows):
        y = y0 + k * rh
        o.append(T(x0 + labw - 10, y + 17, lab, "end", 12, INK, False, True))
        o.append(_r10(x0 + labw, y, bits, "n", cw, 24, 12))
        acc ^= int(bits, 2)
    y = y0 + len(rows) * rh
    o.append(T(x0 + labw - 18, y + 5, "⊕", "middle", 13, MUT))
    o.append(W(x0 + labw - 6, y + 1, x0 + labw + 4 * cw, y + 1, c=INK, lw=1.3))
    res = format(acc, "04b")
    o.append(_r10(x0 + labw, y + 7, res, res_style, cw, 24, 12))
    o.append(T(x0 + labw + 4 * cw + 12, y + 24, result_label, "start", 12, ALI if res_style == "e" else (SIG if res_style == "h" else INK), True))
    if note:
        o.append(T(x0 + labw + 4 * cw + 12, y + 42, note, "start", 11, MUT))
    return "".join(o), res


# ---------------------------------------------------------------- 1 節
# 1. GF(2^4) のべき表
def _f10_gf16():
    o = []
    cw = 21
    for i in range(15):
        r, c = divmod(i, 5)
        x, y = 30 + c * 146, 44 + r * 42
        o.append(T(x + 30, y + 17, _al10(i), "end", 13, _B10, True))
        o.append(_r10(x + 40, y, _a10(i), "n", cw, 24, 12))
        if r == 0:
            for k, lab in enumerate(["x³", "x²", "x", "1"]):
                o.append(T(x + 40 + k * cw + (cw - 3) / 2, y - 8, lab, "middle", 9.5, MUT, False, True))
    o.append(T(380, 182, "α¹⁵ = α⁰ = 1 で一周する。0 以外の 15 個の 4 ビット列が 1 回ずつ現れる。", "middle", 11.5, INK))
    return SVG(760, 196, o, "f(x) = x⁴+x+1 で作った GF(2⁴) の要素 αⁱ と、そのビット表現（左から x³、x²、x、1 の係数）。"
               "この章の計算はすべてこの表を使う。")
F["e10_gf16"] = _f10_gf16()


# 2. f(x) = x^4+x+1 に α と α^3 を代入する
def _f10_subst():
    o = []
    s1, r1 = _xorsum10(40, 60, [("α⁴", _a10(4)), ("α", _a10(1)), ("1", _a10(0))], "= 0", "h",
                       "f(α) = α⁴ + α + 1", note="α は f の根")
    o.append(s1)
    s2, r2 = _xorsum10(410, 60, [("(α³)⁴ = α¹²", _a10(12)), ("α³", _a10(3)), ("1", _a10(0))],
                       "= α⁵ ≠ 0", "e", "f(α³) = (α³)⁴ + α³ + 1", labw=130, note="α³ は f の根ではない")
    o.append(s2)
    assert r1 == "0000" and r2 == _a10(5)
    return SVG(760, 220, o, "GF(2) 係数の多項式 f(x) = x⁴+x+1 に GF(2⁴) の要素を代入する。各項の値を 1 節の表で引き、"
               "ビットごとに XOR する。(α³)⁴ は指数を掛けて α¹² になる。")
F["e10_subst"] = _f10_subst()


# 3. w = 2 のとき: 第 2 式 − X2 × 第 1 式 で y2 の列が消える
def _f10_vander():
    o = []
    X0 = 210
    cols = [X0, X0 + 210]
    o.append(T(cols[0] + 80, 22, "y₁ の項", "middle", 11.5, MUT, True))
    o.append(T(cols[1] + 80, 22, "y₂ の項", "middle", 11.5, MUT, True))

    def row(y, lab, a, b, sa="n", sb="n", rhs="= 0"):
        o.append(T(X0 - 16, y + 23, lab, "end", 12, INK, True))
        for x, t, st in [(cols[0], a, sa), (cols[1], b, sb)]:
            fl, c, tc, bb = _ST10[st]
            o.append(RECT(x, y, 160, 34, 6, fl, c, 1.3))
            o.append(T(x + 80, y + 22, t, "middle", 13, tc, bb, True))
        o.append(T(cols[0] + 185, y + 23, "+", "middle", 14, MUT, True))
        o.append(T(cols[1] + 176, y + 23, rhs, "start", 13, INK, False, True))

    row(34, "第 1 式（j = 1）", "y₁X₁", "y₂X₂")
    row(80, "第 2 式（j = 2）", "y₁X₁²", "y₂X₂²")
    o.append(W(X0 - 150, 130, cols[1] + 230, 130, c=INK, lw=1.3))
    row(140, "第 2 式 − X₂ × 第 1 式", "y₁X₁(X₁ − X₂)", "y₂X₂(X₂ − X₂) = 0", "h", "z")
    o.append(W(cols[1] + 8, 157, cols[1] + 152, 157, c=ALI, lw=1.6))
    o.append(T(40, 210, "X₁ ≠ 0 で、X₁ ≠ X₂ なので X₁ − X₂ ≠ 0。体には零因子が無いので、y₁X₁(X₁ − X₂) = 0 から y₁ = 0。",
               "start", 11.5, INK))
    o.append(T(40, 230, "同じく「第 2 式 − X₁ × 第 1 式」で y₂ = 0。y₁ = y₂ = 1（符号語の 1 の位置）とは両立しない。",
               "start", 11.5, ALI, True))
    return SVG(760, 246, o, "重み 2 の符号語（1 が 2 か所だけ）があると仮定した場合。X₁、X₂ は 2 つの位置 i₁、i₂ に対応する α のべきである。"
               "P(z) = z − X₂ の係数（−X₂ と 1）を第 1 式と第 2 式に掛けて足すと、y₂ の列が消える。")
F["e10_vander"] = _f10_vander()


# ---------------------------------------------------------------- 2 節
# 4. GF(2^4) の共役類
def _f10_cosets():
    o = []
    bw, bh = 66, 40

    def node(x, y, j):
        o.append(RECT(x - bw / 2, y - bh / 2, bw, bh, 6, PAN, _B10, 1.4))
        o.append(T(x, y - 3, _al10(j), "middle", 13, _B10, True))
        o.append(T(x, y + 13, _a10(j), "middle", 10.5, MUT, False, True))

    def arrow(p, q):
        (x1, y1), (x2, y2) = p, q
        if abs(y1 - y2) < 1:
            s = 1 if x2 > x1 else -1
            o.append(ARR(x1 + s * (bw / 2 + 3), y1, x2 - s * (bw / 2 + 4), y2, MUT, 1.4, 6))
        else:
            s = 1 if y2 > y1 else -1
            o.append(ARR(x1, y1 + s * (bh / 2 + 3), x2, y2 - s * (bh / 2 + 4), MUT, 1.4, 6))

    def square(x0, y0, js, title):
        o.append(T(x0 + 60, y0 - 14, title, "middle", 12, INK, True))
        pts = [(x0, y0 + bh / 2), (x0 + 120, y0 + bh / 2), (x0 + 120, y0 + bh / 2 + 76), (x0, y0 + bh / 2 + 76)]
        for k in range(4):
            arrow(pts[k], pts[(k + 1) % 4])
        for k, j in enumerate(js):
            node(pts[k][0], pts[k][1], j)

    square(70, 44, [1, 2, 4, 8], "α の類（4 個）")
    square(320, 44, [3, 6, 12, 9], "α³ の類（4 個）")
    square(570, 44, [7, 14, 13, 11], "α⁷ の類（4 個）")
    # α^5 の類（2 個）
    o.append(T(190, 196, "α⁵ の類（2 個）", "middle", 12, INK, True))
    p1, p2 = (130, 228), (250, 228)
    node(*p1, 5)
    node(*p2, 10)
    o.append(ARR(p1[0] + bw / 2 + 3, p1[1] - 7, p2[0] - bw / 2 - 4, p2[1] - 7, MUT, 1.4, 6))
    o.append(ARR(p2[0] - bw / 2 - 3, p2[1] + 7, p1[0] + bw / 2 + 4, p1[1] + 7, MUT, 1.4, 6))
    # α^0 の類（1 個）
    o.append(T(440, 196, "α⁰ = 1 の類（1 個）", "middle", 12, INK, True))
    node(440, 228, 0)
    o.append(T(600, 222, "矢印は 2 乗（指数を 2 倍して", "middle", 11, MUT))
    o.append(T(600, 240, "15 で割った余りを取る）", "middle", 11, MUT))
    return SVG(760, 262, o, "GF(2⁴) の 0 以外の要素を、2 乗で移り合うものごとにまとめた。どの類も、2 乗を繰り返すと元に戻る。"
               "類の要素数は m = 4 以下である。")
F["e10_cosets"] = _f10_cosets()


# ---------------------------------------------------------------- 3 節
# 5. M_{α^3}(α^3) = 0 を代入して確かめる
def _f10_m3():
    o = []
    rows = [("(α³)⁴ = α¹²", _a10(12)), ("(α³)³ = α⁹", _a10(9)), ("(α³)² = α⁶", _a10(6)),
            ("α³", _a10(3)), ("1", _a10(0))]
    s, r = _xorsum10(200, 40, rows, "= 0", "h", "x⁴+x³+x²+x+1 に α³ を代入: (α³)⁴ + (α³)³ + (α³)² + α³ + 1", labw=140,
                     note="α³ は x⁴+x³+x²+x+1 の根")
    assert r == "0000"
    o.append(s)
    return SVG(760, 236, o, "x⁴+x³+x²+x+1 に α³ を代入する。各項の値を 1 節の表で引いて XOR すると 0 になる。")
F["e10_m3"] = _f10_m3()


# 6. g = (x^4+x+1)(x^4+x^3+x^2+x+1) の掛け算の筆算
def _f10_gmul():
    o = []
    cw = 30
    x0 = 220
    n = 9
    for i in range(n):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 22, str(n - 1 - i), "middle", 10, MUT, False, True))
    o.append(T(x0 - 12, 22, "次数", "end", 10, MUT))
    rows = [("x⁴ + x + 1", "    10011", "z"), ("× x⁴+x³+x²+x+1", "    11111", "z")]
    y = 30
    for lab, bits, _ in rows:
        o.append(T(x0 - 14, y + 18, lab, "end", 12, INK, False, True))
        o.append(_r10(x0, y, bits, "n", cw, 26, 13))
        y += 34
    o.append(W(x0 - 4, y - 2, x0 + n * cw, y - 2, c=INK, lw=1.3))
    M3 = 0b11111
    parts = [("11111 × x⁴", M3 << 4), ("11111 × x", M3 << 1), ("11111 × 1", M3)]
    acc = 0
    y += 6
    for lab, v in parts:
        s = format(v, "09b")
        first = s.index("1")
        sts = "".join("z" if (k < first or c == "0") else "n" for k, c in enumerate(s))
        vis = "".join(" " if k < first else c for k, c in enumerate(s))
        o.append(T(x0 - 14, y + 18, lab, "end", 12, INK, False, True))
        o.append(_r10(x0, y, vis, sts, cw, 26, 13))
        acc ^= v
        y += 34
    o.append(W(x0 - 4, y - 2, x0 + n * cw, y - 2, c=INK, lw=1.3))
    o.append(T(x0 - 14, y + 3, "⊕", "middle", 13, MUT))
    g = format(acc, "09b")
    assert g == "111010001"
    o.append(T(x0 - 30, y + 24, "g(x)", "end", 13, INK, True, True))
    o.append(_r10(x0, y + 6, g, "".join("b" if c == "1" else "n" for c in g), cw, 26, 13))
    cnt = [sum(1 for _, v in parts if (v >> (n - 1 - i)) & 1) for i in range(n)]
    for i, c in enumerate(cnt):
        o.append(T(x0 + i * cw + (cw - 3) / 2, y + 54, str(c), "middle", 11, MUT, False, True))
    o.append(T(x0 - 14, y + 54, "各列の 1 の個数", "end", 10.5, MUT))
    o.append(T(x0 + n * cw + 16, y + 24, "= x⁸ + x⁷ + x⁶ + x⁴ + 1", "start", 12.5, _B10, True, True))
    o.append(T(x0 + n * cw + 16, y + 54, "奇数なら 1、偶数なら 0（1 + 1 = 0）", "start", 11, MUT))
    return SVG(760, y + 70, o, "x⁴+x+1 の 1 が立つ位置（x⁴、x、1）に、x⁴+x³+x²+x+1（11111）をずらして並べ、"
               "列ごとに XOR する。")
F["e10_gmul"] = _f10_gmul()


# 7. (15,7) 符号の重みの分布
def _f10_weights():
    W_ = {0: 1, 5: 18, 6: 30, 7: 15, 8: 15, 9: 30, 10: 18, 15: 1}
    o = []
    x0, y0, cw, sc = 70, 200, 40, 4.6
    o.append(W(x0 - 6, y0, x0 + 16 * cw, y0, c=INK, lw=1.2))
    for wgt in range(16):
        x = x0 + wgt * cw
        o.append(T(x + cw / 2 - 2, y0 + 16, str(wgt), "middle", 10.5, MUT, False, True))
        cnt = W_.get(wgt, 0)
        if cnt:
            hgt = cnt * sc
            col = ALI if wgt == 5 else (_B10 if wgt else FNT)
            fill = ASOFT if wgt == 5 else (_BS10 if wgt else SCR)
            o.append(RECT(x + 6, y0 - hgt, cw - 16, hgt, 2, fill, col, 1.3))
            o.append(T(x + cw / 2 - 2, y0 - hgt - 6, str(cnt), "middle", 11, col, wgt == 5, True))
    o.append(T(x0 + 8 * cw, y0 + 36, "重み（符号語の 1 の個数）", "middle", 11, MUT))
    o.append(W(x0 + 5 * cw - 2, 30, x0 + 5 * cw - 2, y0, c=ALI, lw=1.2, dash="4,3"))
    o.append(T(x0 + 5 * cw + 4, 40, "設計距離 2t + 1 = 5", "start", 11, ALI, True))
    o.append(T(x0 + 1.5 * cw, 120, "重み 1〜4 の", "middle", 11, MUT))
    o.append(T(x0 + 1.5 * cw, 138, "符号語は無い", "middle", 11, MUT))
    assert sum(W_.values()) == 128
    return SVG(760, 252, o, "(15,7) BCH 符号の 128 個の符号語を重みごとに数えた（棒の上が個数）。"
               "0 でない符号語の重みの最小は 5 で、BCH 限界の設計距離 5 と一致する。")
F["e10_weights"] = _f10_weights()


# ---------------------------------------------------------------- 4 節
# 8. 復号の流れ
def _f10_flow():
    o = []
    bw, bh = 214, 62
    xs = [20, 273, 526]

    def box(x, y, title, sub, st):
        fl, c, tc, b = _ST10[st]
        o.append(RECT(x, y, bw, bh, 8, fl, c, 1.4))
        o.append(T(x + bw / 2, y + 24, title, "middle", 12.5, INK, True))
        o.append(T(x + bw / 2, y + 45, sub, "middle", 10.5, MUT))

    y1, y2 = 24, 136
    box(xs[0], y1, "受信語 r(x)", "誤りを含むかもしれない", "n")
    box(xs[1], y1, "① シンドローム", "Sⱼ = r(αʲ)（j = 1, …, 2t）", "c")
    box(xs[2], y1, "② 誤り位置多項式 Λ(x)", "t = 2 なら S₁, S₃ から直接の式", "c")
    box(xs[0], y2, "③ チェン探索", "Λ(α⁻ⁱ) = 0 となる i が誤り位置", "c")
    box(xs[1], y2, "④ 誤り値", "2 元 BCH 符号では常に 1", "c")
    box(xs[2], y2, "訂正", "誤り位置のビットを反転する", "h")
    for a, b in [(0, 1), (1, 2)]:
        o.append(ARR(xs[a] + bw + 3, y1 + bh / 2, xs[b] - 4, y1 + bh / 2, MUT, 1.6))
        o.append(ARR(xs[a] + bw + 3, y2 + bh / 2, xs[b] - 4, y2 + bh / 2, MUT, 1.6))
    o.append(PL([(xs[2] + bw / 2, y1 + bh + 2), (xs[2] + bw / 2, y1 + bh + 22), (xs[0] + bw / 2, y1 + bh + 22),
                 (xs[0] + bw / 2, y2 - 6)], MUT, 1.6))
    o.append(ARR(xs[0] + bw / 2, y2 - 12, xs[0] + bw / 2, y2 - 3, MUT, 1.6))
    return SVG(760, 214, o, "BCH 符号の復号。① で誤りの有無が分かり、②③ で誤りの位置が分かる。"
               "④ の誤り値は、値が 0 と 1 以外も取るリード・ソロモン符号でだけ計算が要る。")
F["e10_flow"] = _f10_flow()


# 9. 復号例の送信語・誤り・受信語
def _f10_rx():
    o = []
    cw = 30
    x0 = 200
    c = format(0b111010001, "015b")
    e = format((1 << 10) | (1 << 3), "015b")
    r = format(int(c, 2) ^ int(e, 2), "015b")
    for i in range(15):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 22, str(14 - i), "middle", 10, MUT, False, True))
    o.append(T(x0 - 12, 22, "位置", "end", 10, MUT))
    rows = [(30, "送った符号語 c = g", c, "".join("c" if ch == "1" else "n" for ch in c)),
            (66, "誤りパターン e", e, "".join("e" if ch == "1" else "z" for ch in e)),
            (110, "受信語 r", r, "".join("e" if e[k] == "1" else ("c" if ch == "1" else "n") for k, ch in enumerate(r)))]
    for y, lab, bits, sts in rows:
        o.append(T(x0 - 14, y + 18, lab, "end", 12, INK, True))
        o.append(_r10(x0, y, bits, sts, cw, 26, 13))
    o.append(W(x0 - 4, 101, x0 + 15 * cw, 101, c=INK, lw=1.3))
    o.append(T(x0 - 16, 106, "+", "middle", 14, MUT, True))
    o.append(T(x0 + 7.5 * cw, 166, "r(x) = x¹⁰ + x⁸ + x⁷ + x⁶ + x⁴ + x³ + 1", "middle", 12.5, INK, False, True))
    return SVG(760, 180, o, "g(x) = x⁸+x⁷+x⁶+x⁴+1 を送り、位置 3 と位置 10 が反転した。受信者に分かるのは r だけである。")
F["e10_rx"] = _f10_rx()


# 10. シンドローム S1 = r(α), S3 = r(α^3)
def _f10_syn():
    o = []
    pos = [10, 8, 7, 6, 4, 3, 0]
    rows1 = [("位置 %d: %s" % (i, _al10(i)), _a10(i)) for i in pos]
    rows3 = [("位置 %d: %s" % (i, _al10(3 * i % 15)), _a10(3 * i)) for i in pos]
    s1, r1 = _xorsum10(20, 44, rows1, "= " + _al10(_LOG10[int("1111", 2)]), "b", "S₁ = r(α)：αⁱ を XOR", labw=124, rh=26)
    s3, r3 = _xorsum10(400, 44, rows3, "= " + _al10(7), "b", "S₃ = r(α³)：α³ⁱ を XOR", labw=124, rh=26)
    assert r1 == _a10(12) and r3 == _a10(7)
    o.append(s1)
    o.append(s3)
    o.append(T(400 + 4, 300, "（α³ⁱ の指数は 3i を 15 で割った余り。例: 位置 10 → α³⁰ = α⁰）", "start", 10.5, MUT))
    return SVG(760, 314, o, "受信語 r の 1 が立つ位置 i（10, 8, 7, 6, 4, 3, 0）について、1 節の表で値を引いて XOR する。")
F["e10_syn"] = _f10_syn()


# 11. チェン探索
def _f10_chien():
    o = []
    cw = 46
    x0 = 70
    S1, s2 = 12, 13

    def lam(i):
        x = (-i) % 15
        v = 1 ^ _EXP10[(S1 + x) % 15] ^ _EXP10[(s2 + 2 * x) % 15]
        return format(v, "04b")

    o.append(T(x0 - 10, 34, "i", "end", 12, MUT, True, True))
    o.append(T(x0 - 10, 64, "Λ(α⁻ⁱ)", "end", 11.5, MUT, True))
    zeros = []
    for i in range(15):
        x = x0 + i * cw
        v = lam(i)
        hit = v == "0000"
        if hit:
            zeros.append(i)
        o.append(T(x + (cw - 4) / 2, 34, str(i), "middle", 12, INK, hit, True))
        fl, c, tc, b = _ST10["h" if hit else "n"]
        o.append(RECT(x, 46, cw - 4, 28, 5, fl, c, 1.4 if hit else 1.0))
        o.append(T(x + (cw - 4) / 2, 65, v, "middle", 11.5, tc, hit, True))
        if hit:
            o.append(T(x + (cw - 4) / 2, 94, "誤り位置", "middle", 10.5, SIG, True))
    assert zeros == [3, 10]
    o.append(T(380, 124, "Λ(x) = 1 + α¹²x + α¹³x² に α⁻ⁱ（i = 0, …, 14）を順に代入した値。0000 になるのは i = 3 と i = 10 だけ。",
               "middle", 11.5, INK))
    return SVG(760, 140, o, "チェン探索。値が 0 になる i が誤りの位置である。")
F["e10_chien"] = _f10_chien()


# ---------------------------------------------------------------- 5 節
# 12. BCH 符号とリード・ソロモン符号
def _f10_bchrs():
    o = []
    X1, X2, wd = 190, 480, 270
    o.append(RECT(X1, 14, wd, 30, 6, SSOFT, SIG, 1.4))
    o.append(T(X1 + wd / 2, 34, "2 元 BCH 符号 (15,7)", "middle", 12.5, INK, True))
    o.append(RECT(X2, 14, wd, 30, 6, _BS10, _B10, 1.4))
    o.append(T(X2 + wd / 2, 34, "リード・ソロモン符号 RS(15,11)", "middle", 12.5, INK, True))
    rows = [
        ("1 桁（シンボル）", "1 ビット（0 か 1）", "4 ビット（GF(2⁴) の要素）"),
        ("指定する根", "α, α², α³, α⁴", "α, α², α³, α⁴"),
        ("生成多項式 g", "x⁴+x+1 と x⁴+x³+x²+x+1 の積", "(x−α)(x−α²)(x−α³)(x−α⁴)"),
        ("g の次数", "8（共役な根を足すので増える）", "4（指定した根だけ）"),
        ("情報", "7 ビット", "11 シンボル（44 ビット）"),
        ("訂正できる誤り", "2 ビット", "2 シンボル"),
    ]
    for k, (lab, a, b) in enumerate(rows):
        y = 70 + k * 30
        o.append(T(X1 - 14, y, lab, "end", 11.5, MUT, True))
        o.append(T(X1 + wd / 2, y, a, "middle", 11.5, INK))
        o.append(T(X2 + wd / 2, y, b, "middle", 11.5, INK))
        o.append(W(30, y + 10, X2 + wd, y + 10, c=LIN, lw=0.8))
    y = 70 + len(rows) * 30 + 14
    o.append(T(X1 - 14, y + 14, "符号語（15 桁）", "end", 11.5, MUT, True))
    for i in range(15):
        o.append(RECT(X1 + i * 18, y, 15, 20, 2, SSOFT, SIG, 1))
        o.append(RECT(X2 + i * 18, y, 15, 20, 2, _BS10, _B10, 1))
        for k in range(1, 4):
            o.append(W(X2 + i * 18, y + k * 5, X2 + i * 18 + 15, y + k * 5, c=_B10, lw=0.6))
    o.append(T(X1 + wd / 2, y + 40, "1 マス = 1 ビット", "middle", 10.5, MUT))
    o.append(T(X2 + wd / 2, y + 40, "1 マス = 4 ビット", "middle", 10.5, MUT))
    o.append(T(X2 + wd / 2, y + 56, "（マスの中で何ビット壊れても誤り 1 個）", "middle", 10.5, MUT))
    return SVG(760, y + 68, o, "同じ根 α〜α⁴ を指定した 2 つの符号。RS 符号の生成多項式は"
               " x⁴ + α¹³x³ + α⁶x² + α³x + α¹⁰ で、係数が GF(2⁴) の要素のまま使う。")
F["e10_bchrs"] = _f10_bchrs()
