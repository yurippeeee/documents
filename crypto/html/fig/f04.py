# 04 章 多項式と既約多項式 の図（figures.py の関数・定数をそのまま使う）
# 他章の fNN.py と同じ名前空間で実行されるので、補助関数・定数には _f04 / _F04 を付ける。

_F04B = "var(--blue)"
_F04BS = "var(--blue-soft)"
_F04SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def _f04_deg(a):
    return a.bit_length() - 1


def _f04_mod(a, b):
    db = _f04_deg(b)
    while a and _f04_deg(a) >= db:
        a ^= b << (_f04_deg(a) - db)
    return a


def _f04_poly(a, sp=" + "):
    """ビット列（整数）を x⁴ + x + 1 のような文字列にする"""
    if a == 0:
        return "0"
    t = []
    for e in range(_f04_deg(a), -1, -1):
        if a >> e & 1:
            t.append("1" if e == 0 else "x" if e == 1 else "x" + str(e).translate(_F04SUP))
    return sp.join(t)


def _f04_xp(e):
    return "x⁰" if e == 0 else "x" if e == 1 else "x" + str(e).translate(_F04SUP)


def _f04_cell(x, y, w, h, s, c=LIN, fill=PAN, tc=INK, sz=13, b=False, lw=1.3, dash=None, r=5):
    return RECT(x, y, w, h, r, fill, c, lw, dash) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, True)


def _f04_chip(x, y, w, h, s, c, fill, tc=INK, sz=12, b=False, mono=True, dash=None):
    return RECT(x, y, w, h, 7, fill, c, 1.4, dash) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, mono)


# 1 節: 多項式とビット列
def _f04_bits():
    o = []
    x0, cw, y = 150, 48, 74
    bits = "101011"
    o.append(T(20, 34, "多項式", "start", 12, MUT, True))
    o.append(T(x0, 34, "x⁵ + x³ + x + 1", "start", 15, INK, True, True))
    o.append(T(20, 64, "項", "start", 12, MUT, True))
    o.append(T(20, y + 26, "ビット列", "start", 12, MUT, True))
    for i, b in enumerate(bits):
        e = 5 - i
        on = b == "1"
        o.append(T(x0 + i * cw + (cw - 6) / 2, 64, _f04_xp(e), "middle", 12, SIG if on else FNT, on, True))
        o.append(_f04_cell(x0 + i * cw, y, cw - 6, 40, b, SIG if on else LIN, SSOFT if on else PAN, INK, 16, on, 1.6 if on else 1.2))
    o.append(ARR(x0 + 2 * cw, 138, x0, 138, MUT, 1.3, 6))
    o.append(T(x0, 156, "左端が最高次（x⁵）", "start", 11.5, MUT))
    o.append(ARR(x0 + 4 * cw - 6, 138, x0 + 6 * cw - 6, 138, MUT, 1.3, 6))
    o.append(T(x0 + 6 * cw - 6, 156, "右端が定数項", "end", 11.5, MUT))
    # 16 進
    hx = 500
    o.append(T(hx, 34, "8 ビットにそろえて 16 進で書く", "start", 12, MUT, True))
    for j, (nib, hc) in enumerate([("0010", "2"), ("1011", "B")]):
        xx = hx + j * 120
        o.append(_f04_cell(xx, y, 108, 40, " ".join(nib), _F04B, _F04BS, INK, 15, True, 1.5))
        o.append(ARR(xx + 54, y + 44, xx + 54, y + 70, _F04B, 1.4, 6))
        o.append(T(xx + 54, y + 92, hc, "middle", 17, _F04B, True, True))
    o.append(T(hx + 114, 186, "0x2B", "middle", 17, INK, True, True))
    o.append(T(hx - 14, y + 26, "→", "middle", 16, MUT))
    return SVG(760, 200, o, "係数を最高次から順に並べるとビット列になる。x⁴ と x² の項は無いので、その位置は 0 である。"
               "上位に 0 を足して 8 ビットにし、4 ビットずつ 16 進の 1 桁にすると 0x2B と書ける。")
F["e04_bits"] = _f04_bits()


# 1 節: 足し算は XOR（整数の 2 進加算との比較）
def _f04_add():
    o = []

    def grid(x0, heads, rows, hlcol, carry):
        cw = 40
        for j, h in enumerate(heads):
            o.append(T(x0 + j * cw + 18, 64, h, "middle", 11, MUT, False, True))
        if hlcol is not None:
            o.append(RECT(x0 + hlcol * cw - 2, 72, cw, 128, 8, ASOFT, ALI, 1.2, "4,3"))
        for i, (lab, op, s, tc, b) in enumerate(rows):
            y = 92 + i * 34 + (8 if i == 2 else 0)
            o.append(T(x0 - 32, y, op, "middle", 15, MUT, False, True))
            o.append(T(x0 - 50, y, lab, "end", 12, tc, b))
            for j, ch in enumerate(s):
                if ch != " ":
                    o.append(T(x0 + j * cw + 18, y, ch, "middle", 16, tc, b, True))
        o.append(W(x0 - 44, 152, x0 + len(heads) * cw, 152, c=INK, lw=1.4))
        if carry is not None:
            o.append(T(x0 + carry * cw + 18, 74, "1", "middle", 12, ALI, True, True))
            o.append(T(x0 + carry * cw - 4, 74, "繰り上がり", "end", 10.5, ALI))

    o.append(T(20, 28, "多項式の足し算（係数ごとに XOR）", "start", 13, SIG, True))
    grid(196, ["x³", "x²", "x¹", "x⁰"],
         [("x³ + x + 1", "", "1011", INK, False), ("x³ + x²", "⊕", "1100", INK, False),
          ("x² + x + 1", "", "0111", SIG, True)], 0, None)
    o.append(T(20, 222, "x³ の桁は 1 + 1 = 0。上の桁へは何も送らない", "start", 11.5, ALI, True))
    o.append(T(420, 28, "比較: 整数の 2 進加算", "start", 13, MUT, True))
    grid(616, ["16", "8", "4", "2", "1"],
         [("11", "", " 1011", INK, False), ("12", "+", " 1100", INK, False),
          ("23", "", "10111", MUT, True)], None, 0)
    o.append(T(420, 222, "8 の桁の 1 + 1 = 10 で、16 の桁へ 1 が繰り上がる", "start", 11.5, MUT))
    return SVG(800, 238, o, "同じビット列 1011 と 1100 を、左は多項式として、右は整数として足した。"
               "多項式の足し算は桁ごとに独立で、繰り上がりが無い。")
F["e04_add"] = _f04_add()


# 1 節: 繰り上がりの無い掛け算の筆算
def _f04_mul():
    o = []

    def panel(x0, title, a, b, res, cancel):
        cw = 36
        heads = ["x³", "x²", "x¹", "x⁰"]
        cx = lambda j: x0 + 130 + j * cw
        o.append(T(x0, 28, title, "start", 13, INK, True))
        for j, h in enumerate(heads):
            o.append(T(cx(j), 56, h, "middle", 11, MUT, False, True))
        for j in cancel:
            o.append(RECT(cx(j) - 16, 132, 32, 66, 7, ASOFT, ALI, 1.2, "4,3"))
        rows = [(1, a, 0, INK, _f04_poly(int(a, 2)), ""),
                (2, b, 0, INK, _f04_poly(int(b, 2)), "×"),
                (3, a, 0, MUT, "← 1 の項: ずらさない", ""),
                (4, a, 1, MUT, "← x の項: 1 桁左へ", ""),
                (5, res, 0, SIG, _f04_poly(int(res, 2)), "")]
        for k, s, sh, tc, note, op in rows:
            y = 50 + k * 30 + (12 if k >= 3 else 0) + (12 if k == 5 else 0)
            for i, ch in enumerate(reversed(s)):
                j = 3 - i - sh
                o.append(T(cx(j), y, ch, "middle", 16, INK if tc != SIG else SIG, tc == SIG, True))
            if op:
                o.append(T(cx(0) - 34, y, op, "middle", 15, MUT, False, True))
            o.append(T(cx(3) + 26, y, note, "start", 11.5, tc, tc == SIG))
        o.append(W(cx(0) - 44, 124, cx(3) + 16, 124, c=INK, lw=1.3))
        o.append(W(cx(0) - 44, 194, cx(3) + 16, 194, c=INK, lw=1.3))
        o.append(T(cx(0) - 34, 188, "⊕", "middle", 14, MUT, False, True))

    panel(16, "(x² + 1)(x + 1)", "101", "11", "1111", [])
    panel(412, "(x² + x + 1)(x + 1)", "111", "11", "1001", [1, 2])
    o.append(T(412, 246, "x² と x¹ の桁は 1 ⊕ 1 = 0 で消える", "start", 11.5, ALI, True))
    return SVG(800, 262, o, "掛ける側 x + 1（11）の各項について、掛けられる側をその次数だけ左へずらして並べ、"
               "最後に XOR でまとめる。整数の掛け算の筆算から繰り上がりを取り除いたものである。")
F["e04_mul"] = _f04_mul()


# 2 節: 除数がとる位置と、止まるところ
def _f04_stop():
    o = []
    x0, cw = 250, 42
    dv = "1101000"
    g = "1011"
    for j in range(7):
        o.append(T(x0 + j * cw + 18, 30, _f04_xp(6 - j), "middle", 11, MUT, False, True))
    o.append(T(20, 62, "被除数 x⁶ + x⁵ + x³", "start", 12, INK, True))
    for j, ch in enumerate(dv):
        o.append(_f04_cell(x0 + j * cw, 40, cw - 6, 34, ch, INK, PAN, INK, 15, True, 1.4))
    right = x0 + 7 * cw - 3
    o.append(W(right, 34, right, 262, c=ALI, lw=1.4, dash="5,4"))
    o.append(T(right + 8, 30, "被除数の右端", "start", 11, ALI, True))
    labs = ["x³·g", "x²·g", "x·g", "g"]
    for k in range(4):
        y = 92 + k * 40
        o.append(T(20, y + 21, "%s をずらして XOR" % labs[k], "start", 12, INK))
        for j, ch in enumerate(g):
            o.append(_f04_cell(x0 + (k + j) * cw, y, cw - 6, 30, ch, _F04B, _F04BS, INK, 14, False, 1.3))
        o.append(T(right + 10, y + (13 if k == 3 else 20), "商の %s の桁" % _f04_xp(3 - k), "start", 11, MUT))
        if k == 3:
            o.append(T(right + 10, y + 29, "右端がそろう → 最後の段", "start", 11, ALI, True))
    ry = 268
    o.append(T(20, ry + 21, "余り（除数の桁数 − 1 = 3 桁）", "start", 12, SIG, True))
    for j, ch in enumerate("001"):
        o.append(_f04_cell(x0 + (4 + j) * cw, ry, cw - 6, 30, ch, SIG, SSOFT, INK, 14, True, 1.6))
    return SVG(800, 312, o, "1101000 ÷ 1011 で、除数 g = x³ + x + 1 をずらして置ける位置は 4 通りで、商は 4 桁になる。"
               "g の右端が被除数の右端にそろった段が最後で、その下に残る右端の 3 桁が余りである。")
F["e04_stop"] = _f04_stop()


# 2 節: 合同式 — 余りで分ける／途中で余りに置き換える
def _f04_congr():
    o = []
    f = 0b111
    o.append(T(20, 26, "f = x² + x + 1 で割った余りで分ける", "start", 13, SIG, True))
    o.append(T(20, 44, "（次数 3 以下の 16 個）", "start", 11, MUT))
    cls = {r: [a for a in range(16) if _f04_mod(a, f) == r] for r in range(4)}
    names = {0: "0", 1: "1", 2: "x", 3: "x + 1"}
    for r in range(4):
        x = 20 + r * 88
        o.append(_f04_chip(x, 56, 80, 30, "余り %s" % names[r], SIG, SSOFT, INK, 11.5, True, False))
        for i, a in enumerate(cls[r]):
            o.append(_f04_cell(x + 8, 96 + i * 34, 64, 28, format(a, "04b"), LIN, PAN, INK, 13))
    o.append(T(20, 254, "同じ列の 2 つは ≡ (mod f)。例: %s ≡ %s（どちらも余り x）"
               % (format(cls[2][1], "04b"), format(cls[2][3], "04b")), "start", 11.5, INK))
    # 右: 途中で余りに置き換える
    x0 = 400
    o.append(T(x0, 26, "途中で余りに置き換えても結果は同じ", "start", 13, _F04B, True))
    o.append(T(x0, 44, "例: x² · x² を f で割った余り", "start", 11, MUT))
    o.append(_f04_chip(x0, 66, 170, 34, "x² · x² = x⁴", _F04B, _F04BS, INK, 13))
    o.append(ARR(x0 + 176, 83, x0 + 274, 83, MUT, 1.5))
    o.append(T(x0 + 225, 74, "f で割る", "middle", 11, MUT))
    o.append(_f04_chip(x0 + 280, 66, 100, 34, "x", SIG, SSOFT, INK, 14, True))
    o.append(T(x0, 132, "先に x² を余り x + 1 に置き換えると", "start", 11.5, INK))
    o.append(_f04_chip(x0, 146, 170, 34, "(x+1)(x+1) = x² + 1", _F04B, _F04BS, INK, 12))
    o.append(ARR(x0 + 176, 163, x0 + 274, 163, MUT, 1.5))
    o.append(T(x0 + 225, 154, "f で割る", "middle", 11, MUT))
    o.append(_f04_chip(x0 + 280, 146, 100, 34, "x", SIG, SSOFT, INK, 14, True))
    o.append(T(x0, 214, "x² を f で割った余りは x + 1 なので x² ≡ x + 1。", "start", 11.5, INK))
    o.append(T(x0, 234, "どちらの順に計算しても余りは x になる", "start", 11.5, SIG, True))
    return SVG(800, 268, o, "左: f で割った余りが同じ多項式どうしが合同である。右: 掛け算の途中で、"
               "因数を f で割った余りに置き換えてから計算しても、最後の余りは変わらない。")
F["e04_congr"] = _f04_congr()


# 3 節: 素数と既約多項式
def _f04_factor():
    o = []

    def tree(cx, top, kids, tc, lab1, lab2, wtop=110, wkid=100):
        o.append(_f04_chip(cx - wtop / 2, 54, wtop, 34, top, tc, SSOFT if tc == SIG else ASOFT, INK, 13, True))
        if kids:
            n = len(kids)
            for i, k in enumerate(kids):
                kx = cx + (i - (n - 1) / 2) * (wkid + 18)
                o.append(W(cx, 88, kx, 120, c=tc, lw=1.4))
                o.append(_f04_chip(kx - wkid / 2, 120, wkid, 32, k, LIN, PAN, INK, 12.5))
        o.append(T(cx, 186, lab1, "middle", 11.5, INK))
        o.append(T(cx, 205, lab2, "middle", 11.5, tc, True))

    o.append(T(20, 26, "整数", "start", 13, MUT, True))
    tree(108, "6", ["2", "3"], ALI, "6 = 2 × 3", "合成数", 70, 60)
    tree(282, "7", [], SIG, "1 × 7 としか書けない", "素数", 70, 60)
    o.append(W(386, 20, 386, 214, c=LIN, lw=1.2))
    o.append(T(404, 26, "多項式（係数は GF(2)）", "start", 13, MUT, True))
    tree(512, "x³ + 1", ["x + 1", "x² + x + 1"], ALI, "(x + 1)(x² + x + 1)", "可約", 110, 104)
    tree(706, "x³ + x + 1", [], SIG, "2 つの積に書けない", "既約", 120, 100)
    return SVG(800, 222, o, "既約多項式は素数に、可約な多項式は合成数に当たる。整数で 1 × 7 を分解と数えないのと同じく、"
               "多項式では次数 0 の因数（定数 1）との積は分解と数えない。")
F["e04_factor"] = _f04_factor()


# 3 節: 試す相手（整数の素数判定との対応）
def _f04_cands():
    o = []
    o.append(T(20, 26, "整数 91 は素数か", "start", 13, MUT, True))
    o.append(T(20, 50, "√91 ≈ 9.5 以下の素数で割る", "start", 11.5, INK))
    for i, (pz, res, hit) in enumerate([("2", "割り切れない", False), ("3", "割り切れない", False),
                                        ("5", "割り切れない", False), ("7", "91 = 7 × 13", True)]):
        y = 64 + i * 38
        o.append(_f04_chip(20, y, 44, 30, pz, ALI if hit else LIN, ASOFT if hit else PAN, INK, 13, hit))
        o.append(T(76, y + 20, res, "start", 11.5, ALI if hit else MUT, hit))
    o.append(T(20, 236, "4, 6, 8, 9 は試さない（素数で見つかる）", "start", 11, MUT))
    o.append(W(262, 16, 262, 244, c=LIN, lw=1.2))
    x0 = 284
    o.append(T(x0, 26, "次数 n の多項式 f は、次数 n/2 以下の既約多項式で割る", "start", 13, SIG, True))
    rows = [("次数 1", [("x", "10"), ("x + 1", "11")], [], "deg f ≥ 2 なら試す"),
            ("次数 2", [("x² + x + 1", "111")], ["x²", "x²+1", "x²+x"], "deg f ≥ 4 なら試す"),
            ("次数 3", [("x³ + x + 1", "1011"), ("x³ + x² + 1", "1101")], [], "deg f ≥ 6 なら試す")]
    for i, (lab, good, bad, when) in enumerate(rows):
        y = 50 + i * 58
        o.append(T(x0, y + 26, lab, "start", 12, MUT, True))
        xx = x0 + 60
        for name, b in good:
            w = 22 + 8.2 * len(name)
            o.append(_f04_chip(xx, y + 4, w, 34, name, SIG, SSOFT, INK, 12.5, True, False))
            o.append(T(xx + w / 2, y + 52, b, "middle", 10.5, MUT, False, True))
            xx += w + 10
        bx0 = xx
        for name in bad:
            w = 14 + 7.2 * len(name)
            o.append(_f04_chip(xx, y + 6, w, 28, name, FNT, PAN, MUT, 11, False, False, "4,3"))
            o.append(W(xx + 4, y + 31, xx + w - 4, y + 9, c=ALI, lw=1.2))
            xx += w + 6
        if bad:
            o.append(T(bx0, y + 50, "可約なので試さない", "start", 10.5, ALI))
        o.append(T(790, y + 26, when, "end", 11, _F04B, True))
    o.append(T(x0, 250, "deg f = 2, 3 なら次数 1 まで、4, 5 なら次数 2 まで、6, 7 なら次数 3 まで試せばよい",
               "start", 11, INK))
    return SVG(800, 264, o, "試す範囲を絞る 2 つの規則（次数は半分以下、既約なものだけ）は、整数の素数判定で "
               "√n 以下の素数だけで割るのと同じ考え方である。下の 2 進数は各多項式のビット列。")
F["e04_cands"] = _f04_cands()


# 3 節: 因数の次数の組み合わせ（1 次の因数を含まないもの）
def _f04_split():
    o = []
    parts = {2: ["1+1"], 3: ["1+2", "1+1+1"], 4: ["1+3", "1+1+2", "1+1+1+1", "2+2"],
             5: ["1+4", "1+1+3", "1+2+2", "1+1+1+2", "1+1+1+1+1", "2+3"]}
    o.append(T(20, 26, "可約な f を既約な因数の積に分けたときの、因数の次数の組み合わせ（n = f の次数）", "start", 13, INK, True))
    for i, n in enumerate([2, 3, 4, 5]):
        y = 44 + i * 44
        o.append(T(20, y + 21, "n = %d" % n, "start", 12.5, MUT, True, True))
        xx = 84
        for p in parts[n]:
            has1 = "1" in p.split("+")
            w = 24 + 8.4 * len(p)
            o.append(_f04_chip(xx, y, w, 30, p, _F04B if has1 else ALI, _F04BS if has1 else ASOFT, INK, 12.5, not has1))
            xx += w + 10
    o.append(RECT(20, 232, 14, 14, 3, _F04BS, _F04B, 1.4))
    o.append(T(42, 244, "1 次の因数を含む → 定数項と項の個数で見つかる", "start", 11.5, INK))
    o.append(RECT(420, 232, 14, 14, 3, ASOFT, ALI, 1.4))
    o.append(T(442, 244, "1 次の因数を含まない → 2 次の既約因数がある", "start", 11.5, INK))
    return SVG(800, 258, o, "たとえば 1+2 は「1 次の既約因数と 2 次の既約因数の積」を表す。n = 2, 3 ではどの組み合わせも 1 次の因数を含む。"
               "n = 4, 5 で 1 次の因数を含まないのは 2+2 と 2+3 だけで、どちらも 2 次の既約因数を含む。")
F["e04_split"] = _f04_split()


# 3 節: 次数 4 の 16 個をふるいにかける
def _f04_sieve4():
    o = []
    cnt = {"c0": 0, "even": 0, "q": 0, "irr": 0}
    for i, a in enumerate(range(16, 32)):
        r, c = divmod(i, 4)
        x, y = 20 + c * 192, 16 + r * 54
        if a % 2 == 0:
            k, col, fl, tag, dash = "c0", FNT, PAN, "定数項 0", "4,3"
        elif bin(a).count("1") % 2 == 0:
            k, col, fl, tag, dash = "even", _F04B, _F04BS, "項が偶数個", None
        elif _f04_mod(a, 7) == 0:
            k, col, fl, tag, dash = "q", ALI, ASOFT, "x²+x+1 で割り切れる", None
        else:
            k, col, fl, tag, dash = "irr", SIG, SSOFT, "既約", None
        cnt[k] += 1
        o.append(RECT(x, y, 180, 46, 8, fl, col, 1.6 if k == "irr" else 1.3, dash))
        o.append(T(x + 10, y + 20, _f04_poly(a, "+"), "start", 12.5, INK if k != "c0" else MUT, k == "irr", True))
        o.append(T(x + 10, y + 38, format(a, "05b"), "start", 11, MUT, False, True))
        o.append(T(x + 172, y + 38, tag, "end", 10.5, col if k != "c0" else MUT, k in ("irr", "q")))
    items = [("c0", FNT, PAN, "① 定数項 0（x で割り切れる）", "4,3"), ("even", _F04B, _F04BS, "② 項が偶数個（x + 1 で割り切れる）", None),
             ("q", ALI, ASOFT, "③ x² + x + 1 で割り切れる", None), ("irr", SIG, SSOFT, "どれでも割り切れない = 既約", None)]
    for i, (k, col, fl, s, dash) in enumerate(items):
        xx, ly = 20 + (i % 2) * 390, 240 + (i // 2) * 22
        o.append(RECT(xx, ly, 14, 14, 3, fl, col, 1.3, dash))
        o.append(T(xx + 20, ly + 12, "%s: %d 個" % (s, cnt[k]), "start", 11.5, INK, k == "irr"))
    return SVG(800, 288, o, "x⁴ の係数が 1 の 16 個に、定数項 → 項の個数 → x² + x + 1 での割り算の順に判定を当てはめた。"
               "最後まで残る x⁴+x+1、x⁴+x³+1、x⁴+x³+x²+x+1 の 3 個が次数 4 の既約多項式である。")
F["e04_sieve4"] = _f04_sieve4()


# 4 節: x を掛けて余りに直す（f = x⁴ + x + 1）
def _f04_shift4():
    o = []

    def panel(x0, title, rows, note1, note2, nc):
        cw = 34
        heads = ["x⁴", "x³", "x²", "x¹", "x⁰"]
        cx = lambda j: x0 + 150 + j * cw
        o.append(T(x0, 26, title, "start", 13, nc, True))
        for j, h in enumerate(heads):
            o.append(T(cx(j), 52, h, "middle", 11, MUT, False, True))
        o.append(RECT(cx(0) - 15, 60, 30, 30 * len(rows) + 8, 6, ASOFT if nc == ALI else "none",
                      ALI if nc == ALI else FNT, 1.1, "4,3"))
        for i, (lab, s, tc, b, line) in enumerate(rows):
            y = 82 + i * 30 + (8 if line else 0)
            if line:
                o.append(W(cx(0) - 18, y - 22, cx(4) + 18, y - 22, c=INK, lw=1.2))
            o.append(T(cx(0) - 26, y, lab, "end", 12, tc, b))
            for j, ch in enumerate(s):
                if ch != " ":
                    o.append(T(cx(j), y, ch, "middle", 15, tc, b, True))
        o.append(T(x0, 214, note1, "start", 11.5, INK))
        o.append(T(x0, 233, note2, "start", 11.5, nc, True))

    panel(16, "x⁴ の桁が 0 のとき（x⁴ → x⁵）",
          [("x⁴ ≡", " 0011", INK, False, False), ("× x（左へ 1 桁）", "00110", INK, False, False),
           ("x⁵ ≡", " 0110", SIG, True, True)],
          "x⁴ の桁が 0 なので、ずらしただけで余り", "x⁵ ≡ x² + x", SIG)
    panel(412, "x⁴ の桁が 1 のとき（x⁶ → x⁷）",
          [("x⁶ ≡", " 1100", INK, False, False), ("× x（左へ 1 桁）", "11000", INK, False, False),
           ("⊕ f", "10011", ALI, False, False), ("x⁷ ≡", "01011", SIG, True, True)],
          "x⁴ の桁を f = 10011 の XOR で消す", "x⁷ ≡ x³ + x + 1", ALI)
    return SVG(800, 250, o, "1 つ前の余りに x を掛けると 1 桁左にずれる。x⁴ の桁が 1 になったら f を XOR して消す。"
               "これは x⁴ を、x⁴ を f で割った余り x + 1 に置き換えることと同じである。")
F["e04_shift4"] = _f04_shift4()


# 4 節: 余りが巡る様子（既約だが原始でない場合と、原始多項式）
def _f04_cycles():
    o = []

    def ring(cx, cy, R, f, title, tc, n1, n2):
        seq, v = [], 1
        while True:
            seq.append(v)
            v = _f04_mod(v << 1, f)
            if v == 1:
                break
        n = len(seq)
        o.append(T(cx, 24, title, "middle", 13, tc, True))
        pts = [(cx + R * math.cos(math.radians(-90 + 360.0 * i / n)), cy + R * math.sin(math.radians(-90 + 360.0 * i / n)))
               for i in range(n)]
        for i in range(n):
            (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
            dx, dy = x2 - x1, y2 - y1
            L = (dx * dx + dy * dy) ** .5
            s1, s2 = (24, 26) if n > 6 else (34, 36)
            o.append(ARR(x1 + dx / L * s1, y1 + dy / L * s1, x2 - dx / L * s2, y2 - dy / L * s2, tc, 1.4, 6))
        for i, a in enumerate(seq):
            x, y = pts[i]
            o.append(_f04_chip(x - 22, y - 11, 44, 22, format(a, "04b"), tc, SSOFT if tc == SIG else _F04BS, INK, 11, False))
            lx = cx + (R + 33) * math.cos(math.radians(-90 + 360.0 * i / n))
            ly = cy + (R + 33) * math.sin(math.radians(-90 + 360.0 * i / n))
            o.append(T(lx, ly + 4, _f04_xp(i), "middle", 10.5, MUT, False, True))
        o.append(T(cx, 380, n1, "middle", 11.5, INK))
        o.append(T(cx, 400, n2, "middle", 11.5, tc, True))

    ring(190, 204, 82, 0b11111, "x⁴ + x³ + x² + x + 1", _F04B, "x⁵ ≡ 1: 5 個で 1 に戻る", "0 以外の 15 通りのうち 10 通りは現れない")
    ring(590, 204, 112, 0b10011, "x⁴ + x + 1", SIG, "x¹⁵ ≡ 1: 15 個すべてを通って 1 に戻る", "原始多項式")
    return SVG(800, 414, o, "x⁰ = 1 から始めて x を掛けるたびに矢印の向きに 1 つ進む（チップの中は余りのビット列）。"
               "どちらも次数 4 の既約多項式だが、x の位数は 5 と 15 で異なる。")
F["e04_cycles"] = _f04_cycles()


# 5 節: 互除法で組がどう移るか
def _f04_euclid():
    o = []
    pairs = [("11011", "1011", "(4, 3)"), ("1011", "110", "(3, 2)"), ("110", "1", "(2, 0)"), ("1", "0", "")]
    rems = ["余り 110", "余り 1", "余り 0"]
    o.append(T(20, 24, "（割られる側, 割る側）", "start", 12, MUT, True))
    for i, (a, b, d) in enumerate(pairs):
        x = 16 + i * 202
        last = i == 3
        o.append(RECT(x, 50, 138, 48, 9, SSOFT if last else PAN, SIG if last else INK, 1.6 if last else 1.3))
        o.append(T(x + 69, 80, "(%s, %s)" % (a, b), "middle", 13.5, INK, True, True))
        o.append(T(x + 69, 120, ("次数 " + d) if d else "割る側が 0 → 終了", "middle", 11.5, MUT if d else SIG, not d))
        if i < 3:
            o.append(ARR(x + 142, 74, x + 198, 74, MUT, 1.5, 6))
            o.append(T(x + 170, 64, rems[i], "middle", 10.5, _F04B, True))
    o.append(T(20, 156, "割る側が次の割られる側になり、余りが次の割る側になる。次数は 4 → 3 → 2 → 0 と下がる。", "start", 11.5, INK))
    o.append(T(20, 176, "最後の 0 でない余り 1 が gcd である", "start", 11.5, SIG, True))
    return SVG(800, 194, o, "上の 3 回の筆算で、割られる側と割る側の組が移っていく様子。")
F["e04_euclid"] = _f04_euclid()
