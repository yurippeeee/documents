# 05 章 拡大体 GF(2^m) の図（figures.py の関数・定数をそのまま使う）
import math as _m5

_B5 = "var(--blue)"
_B5S = "var(--blue-soft)"
_SUP5 = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def _sp5(n):
    return str(n).translate(_SUP5)


# ---------- GF(2)[x] の計算（図の値はすべてここで計算する） ----------
def _deg5(a):
    return a.bit_length() - 1


def _mod5(a, f):
    while a and _deg5(a) >= _deg5(f):
        a ^= f << (_deg5(a) - _deg5(f))
    return a


def _clmul5(a, b):
    r = 0
    while b:
        if b & 1:
            r ^= a
        a <<= 1
        b >>= 1
    return r


def _mul5(a, b, f):
    return _mod5(_clmul5(a, b), f)


def _pow5(a, e, f):
    r = 1
    for _ in range(e):
        r = _mul5(r, a, f)
    return r


def _poly5(v, var="x"):
    if v == 0:
        return "0"
    t = []
    for e in range(_deg5(v), -1, -1):
        if (v >> e) & 1:
            t.append("1" if e == 0 else var if e == 1 else var + _sp5(e))
    return " + ".join(t)


def _bin5(v, n):
    return format(v, "0%db" % n)


def _hex5(v):
    return "0x%02X" % v


def _cells5(x, y, s, cw=26, ch=26, hl=None, hlc=ALI, hlf=ASOFT, c=LIN, fill=PAN, tc=INK, sz=13, bold=False):
    """ビット列を 1 文字 1 マスで描く。hl は強調する位置（0 始まり）の集合"""
    o = []
    for i, b in enumerate(s):
        on = hl is not None and i in hl
        o.append(RECT(x + i * cw, y, cw - 3, ch, 4, hlf if on else fill, hlc if on else c, 1.3))
        o.append(T(x + i * cw + (cw - 3) / 2, y + ch / 2 + sz * 0.36, b, "middle", sz,
                   hlc if on else tc, on or bold, True))
    return "".join(o)


def _arc5(cx, cy, r, a0, a1, c, lw=2.0, n=40, head=8):
    """中心 (cx, cy)、半径 r の円弧を角度 a0→a1 に描き、終点に矢印を付ける（角度はラジアン）"""
    pts = [(cx + r * _m5.cos(a0 + (a1 - a0) * k / n), cy + r * _m5.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]
    o = [PL(pts[:-2], c, lw)]
    (x1, y1), (x2, y2) = pts[-3], pts[-1]
    o.append(ARR(x1, y1, x2, y2, c, lw, head))
    return "".join(o)


# ======================================================================
# 冒頭: 整数から GF(p) を作るのと同じ方法で、多項式から GF(2^m) を作る
# ======================================================================
def _f05_overview():
    o = []
    rows = [(62, "整数 ℤ", "…, −1, 0, 1, 2, …", "素数 p で割った余り", "GF(p)", "{0, 1, …, p − 1}  の p 個", "03 章"),
            (170, "多項式 GF(2)[x]", "0, 1, x, x + 1, x² + 1, …", "次数 m の既約多項式 f で割った余り", "GF(2ᵐ)",
             "次数 m 未満の多項式  2ᵐ 個", "この章")]
    for y, a1, a2, mid, c1, c2, ch in rows:
        o.append(RECT(20, y - 38, 200, 76, 10, PAN, LIN, 1.4))
        o.append(T(120, y - 8, a1, "middle", 15, INK, True))
        o.append(T(120, y + 18, a2, "middle", 11.5, MUT, False, True))
        o.append(ARR(232, y, 500, y, INK, 1.8))
        o.append(T(366, y - 12, mid, "middle", 12.5, ALI, True))
        o.append(T(366, y + 22, "（%s）" % ch, "middle", 11, MUT))
        o.append(RECT(512, y - 38, 228, 76, 10, SSOFT, SIG, 1.6))
        o.append(T(626, y - 8, c1, "middle", 17, SIG, True))
        o.append(T(626, y + 18, c2, "middle", 11.5, INK))
    o.append(T(120, 228, "材料", "middle", 11, MUT, True))
    o.append(T(366, 228, "「素数」で割った余りだけを考える", "middle", 11, MUT, True))
    o.append(T(626, 228, "できる体", "middle", 11, MUT, True))
    return SVG(760, 240, o, "03 章で整数に対して行ったことを、04 章の多項式に対してもう一度行う。"
               "整数の素数にあたるのが、多項式では既約多項式である。")
F["e05_overview"] = _f05_overview()


# ======================================================================
# 1 節 定義: どんな多項式も f で割った余りに直すと 8 個のどれかになる
# ======================================================================
def _f05_remainders():
    f = 0b1011
    src = [0b1000, 0b10010, 0b1000001, 0b100000, 0b1100]   # x^3, x^4+x, x^6+1, x^5, x^3+x^2（行き先の順）
    o = []
    o.append(T(110, 24, "多項式（次数はいくつでもよい）", "middle", 12, INK, True))
    o.append(T(605, 24, "GF(2³) の要素（次数 2 以下）", "middle", 12, INK, True))
    o.append(T(345, 24, "f = x³ + x + 1 で割った余り", "middle", 12, ALI, True))
    cy = {v: 50 + v * 31 for v in range(8)}          # 右の列: 要素 v の行の y（上端）
    hit = {_mod5(p, f) for p in src}
    for v in range(8):
        y = cy[v]
        on = v in hit
        o.append(RECT(520, y, 170, 26, 6, SSOFT if on else PAN, SIG if on else LIN, 1.5 if on else 1.2))
        o.append(T(540, y + 18, _poly5(v), "start", 12.5, INK, on))
        o.append(T(672, y + 18, _bin5(v, 3), "end", 12, SIG if on else MUT, on, True))
    for k, p in enumerate(src):
        y = 58 + k * 46
        o.append(RECT(30, y, 160, 30, 6, PAN, LIN, 1.2))
        o.append(T(110, y + 20, _poly5(p), "middle", 13, INK))
        r = _mod5(p, f)
        ty = cy[r] + 13
        o.append(ARR(196, y + 15, 512, ty, ALI, 1.4, 7))
    o.append(T(110, 300, "どれも右の 8 個のどれかになる", "middle", 11.5, MUT))
    o.append(T(605, 318, "係数を並べると 3 ビット", "middle", 11.5, MUT))
    return SVG(720, 330, o, "m = 3、f = x³ + x + 1 の場合。たとえば x³ = 1 · f + (x + 1) なので、x³ の余りは x + 1 である。"
               "左の 5 個の多項式は、余りに直すと右の 8 個のうち色の付いた 3 個に移る。")
F["e05_remainders"] = _f05_remainders()


# ======================================================================
# 1 節 演算: 足し算は XOR、掛け算は繰り上がりの無い掛け算をしてから f で割る
# ======================================================================
def _f05_arith():
    a, b = 0b111, 0b101
    o = []
    # 左: 足し算
    o.append(T(30, 26, "足し算 = 係数ごとの XOR", "start", 13, SIG, True))
    o.append(T(30, 46, "次数は上がらないので、f で割らなくてよい", "start", 11, MUT))
    X0, cw = 120, 30
    for j, lab in enumerate(["x²", "x", "1"]):
        o.append(T(X0 + j * cw + 13.5, 76, lab, "middle", 11, MUT))
    rows = [("a", a, "x² + x + 1"), ("b", b, "x² + 1")]
    for k, (nm, v, ps) in enumerate(rows):
        y = 86 + k * 36
        o.append(T(X0 - 14, y + 18, nm, "end", 13, INK, True, True))
        o.append(_cells5(X0, y, _bin5(v, 3), cw, 27))
        o.append(T(X0 + 3 * cw + 12, y + 18, ps, "start", 12, MUT))
    o.append(W(X0 - 30, 160, X0 + 3 * cw, 160, c=INK, lw=1.4))
    o.append(T(X0 - 14, 186, "a + b", "end", 13, SIG, True, True))
    o.append(_cells5(X0, 168, _bin5(a ^ b, 3), cw, 27, c=SIG, fill=SSOFT, tc=SIG, bold=True))
    o.append(T(X0 + 3 * cw + 12, 186, _poly5(a ^ b), "start", 12, SIG, True))
    o.append(T(30, 230, "1 + 1 = 0 なので、x² と 1 は消える", "start", 11.5, INK))
    # 右: 掛け算（繰り上がりの無い掛け算の筆算）
    o.append(T(400, 26, "掛け算 = 繰り上がりの無い掛け算（04 章 1 節）", "start", 13, SIG, True))
    o.append(T(400, 46, "b の係数が 1 の項ごとに a をずらして XOR する", "start", 11, MUT))
    R0, cw2 = 470, 26          # 右端（x⁰ の列）の x は R0 + 4*cw2
    def row(y, v, shift, n, col=INK, fill=PAN, bold=False, c=LIN):
        s = _bin5(v, n)
        x = R0 + (5 - n - shift) * cw2
        return _cells5(x, y, s, cw2, 24, c=c, fill=fill, tc=col, sz=12, bold=bold)
    for j, lab in enumerate(["x⁴", "x³", "x²", "x", "1"]):
        o.append(T(R0 + j * cw2 + 11.5, 76, lab, "middle", 10.5, MUT))
    o.append(T(R0 - 10, 102, "a", "end", 12, INK, True, True)); o.append(row(86, a, 0, 3))
    o.append(T(R0 - 10, 130, "× b", "end", 12, INK, True, True)); o.append(row(114, b, 0, 3))
    o.append(W(R0 - 40, 144, R0 + 5 * cw2, 144, c=INK, lw=1.2))
    parts = [(a, 0, "a × 1"), (0, 1, "0（b に x の項は無い）"), (a, 2, "a × x²")]
    for k, (v, sh, note) in enumerate(parts):
        y = 150 + k * 28
        o.append(row(y, v, sh, 3, col=MUT if v == 0 else INK))
        o.append(T(R0 + 5 * cw2 + 10, y + 17, note, "start", 11, MUT))
    o.append(W(R0 - 40, 236, R0 + 5 * cw2, 236, c=INK, lw=1.2))
    p = _clmul5(a, b)
    o.append(row(242, p, 0, 5, col=ALI, fill=ASOFT, bold=True, c=ALI))
    o.append(T(R0 + 5 * cw2 + 10, 259, "= %s" % _poly5(p), "start", 12, ALI, True))
    o.append(T(400, 296, "次数 4 で m = 3 以上なので、次に f で割った余りに直す", "start", 11.5, INK))
    return SVG(800, 310, o, "m = 3、f = x³ + x + 1 で、a = x² + x + 1（ビット 111）と b = x² + 1（ビット 101）を計算する。"
               "足し算はそのまま要素になるが、掛け算の結果は次数が 3 以上になるので、f で割った余りに直す必要がある。")
F["e05_arith"] = _f05_arith()


# ======================================================================
# 1 節 逆元: 整数と多項式で同じ 3 段の流れ
# ======================================================================
def _f05_inverse_flow():
    o = []
    rows = [(70, "整数（01 章、02 章 3 節）", [("p が素数", "0 < a < p なら", "gcd(a, p) = 1"),
                                          ("拡張ユークリッド", "a·u + p·v = 1", "となる u, v がある"),
                                          ("p で割った余りを取る", "p·v が消えて", "a·u ≡ 1 (mod p)")]),
            (196, "多項式（この章）", [("f が既約", "a ≠ 0, deg a < m なら", "gcd(a, f) = 1"),
                                   ("拡張ユークリッド", "a·u + f·v = 1", "となる u, v がある"),
                                   ("f で割った余りを取る", "f·v が消えて", "a·u ≡ 1 (mod f)")])]
    for y, head, boxes in rows:
        o.append(T(24, y - 46, head, "start", 12.5, INK, True))
        for i, (t1, t2, t3) in enumerate(boxes):
            x = 24 + i * 252
            last = i == 2
            o.append(RECT(x, y - 34, 218, 86, 9, SSOFT if last else PAN, SIG if last else (_B5 if i == 0 else LIN), 1.5))
            o.append(T(x + 109, y - 10, t1, "middle", 13, SIG if last else INK, True))
            o.append(T(x + 109, y + 14, t2, "middle", 12, INK, False, True))
            o.append(T(x + 109, y + 36, t3, "middle", 12, SIG if last else INK, last, True))
            if i < 2:
                o.append(ARR(x + 221, y + 9, x + 249, y + 9, INK, 1.8))
    o.append(T(24 + 109, 266, "既約性を使うのはここだけ", "middle", 11, _B5, True))
    o.append(T(24 + 2 * 252 + 109, 266, "u（の余り）が a の逆元", "middle", 11, SIG, True))
    return SVG(790, 280, o, "上の段が整数で逆元を作った流れ、下の段がこの章の流れである。違うのは 1 段目だけで、"
               "「p が素数」が「f が既約」に置き換わる。")
F["e05_inverse_flow"] = _f05_inverse_flow()


# ======================================================================
# 1 節 可約だと体にならない: 既約 x²+x+1 と可約 x² の乗算表を比べる
# ======================================================================
def _f05_reducible():
    o = []
    els = [1, 2, 3]
    names = {1: "1", 2: "x", 3: "x + 1"}
    def table(x0, f, title, tc, note1, note2):
        o.append(T(x0, 24, title, "start", 13, tc, True))
        cw, ch = 74, 36
        y0 = 40
        o.append(T(x0 + cw / 2, y0 + 23, "×", "middle", 14, MUT, True))
        for j, b in enumerate(els):
            o.append(RECT(x0 + (j + 1) * cw, y0, cw - 4, ch - 4, 5, SCR, LIN, 1))
            xc = x0 + (j + 1) * cw + (cw - 4) / 2
            o.append(T(xc - 3, y0 + 21, names[b], "end", 12, INK, True))
            o.append(T(xc + 5, y0 + 21, _bin5(b, 2), "start", 11, MUT, False, True))
        for i, a in enumerate(els):
            y = y0 + (i + 1) * ch
            o.append(RECT(x0, y, cw - 4, ch - 4, 5, SCR, LIN, 1))
            xc = x0 + (cw - 4) / 2
            o.append(T(xc - 3, y + 21, names[a], "end", 12, INK, True))
            o.append(T(xc + 5, y + 21, _bin5(a, 2), "start", 11, MUT, False, True))
            has1 = False
            for j, b in enumerate(els):
                v = _mul5(a, b, f)
                if v == 1:
                    fl, c, tcc = SSOFT, SIG, SIG
                    has1 = True
                elif v == 0:
                    fl, c, tcc = ASOFT, ALI, ALI
                else:
                    fl, c, tcc = PAN, LIN, INK
                xx = x0 + (j + 1) * cw
                o.append(RECT(xx, y, cw - 4, ch - 4, 5, fl, c, 1.3))
                o.append(T(xx + (cw - 4) / 2, y + 21, _bin5(v, 2), "middle", 13, tcc, v in (0, 1), True))
            o.append(T(x0 + 4 * cw + 2, y + 21, "1 あり" if has1 else "1 なし", "start", 11, SIG if has1 else ALI, True))
        o.append(T(x0, y0 + 4 * ch + 22, note1, "start", 11.5, INK))
        o.append(T(x0, y0 + 4 * ch + 42, note2, "start", 11.5, tc, True))
    table(20, 0b111, "f = x² + x + 1（既約）", SIG,
          "どの行にも 01（= 1）がある。", "→ 0 以外のすべての要素が逆元を持つ: 体になる")
    table(410, 0b100, "f = x² = x · x（可約）", ALI,
          "x · x = 00（= 0）なのに x ≠ 0: x は零因子。", "→ x の行に 01 が無く、x は逆元を持たない")
    return SVG(800, 240, o, "2 ビットの要素 1, x, x + 1 どうしの掛け算を、f で割った余りで書いた表。"
               "既約な f では各行に 1 が現れるが、可約な f = x² では 0 が現れ、1 が現れない行がある。")
F["e05_reducible"] = _f05_reducible()


# ======================================================================
# 1 節 原始多項式である必要はない: x の位数 5 と x + 1 の位数 15
# ======================================================================
def _f05_twocycles():
    f = 0b11111
    o = []
    def ring(cx, cy, R, g, n, nr, hlset, col, fill, title, sub):
        o.append(T(cx, 24, title, "middle", 13, col, True))
        o.append(T(cx, 44, sub, "middle", 11, MUT))
        pts = []
        for k in range(n):
            ang = -_m5.pi / 2 + 2 * _m5.pi * k / n
            pts.append((cx + R * _m5.cos(ang), cy + R * _m5.sin(ang)))
        for k in range(n):
            (x1, y1), (x2, y2) = pts[k], pts[(k + 1) % n]
            dx, dy = x2 - x1, y2 - y1
            L = _m5.hypot(dx, dy)
            o.append(ARR(x1 + dx / L * (nr + 2), y1 + dy / L * (nr + 2), x2 - dx / L * (nr + 3), y2 - dy / L * (nr + 3), col, 1.3, 6))
        for k in range(n):
            x, y = pts[k]
            v = _pow5(g, k, f)
            on = v in hlset
            o.append(CIRC(x, y, nr, _B5 if on else col, 1.5, _B5S if on else fill))
            o.append(T(x, y + 3.5, _bin5(v, 4), "middle", 10, INK, on, True))
        return pts
    xcyc = {_pow5(2, k, f) for k in range(5)}
    ring(150, 222, 86, 2, 5, 21, xcyc, _B5, _B5S, "要素 x のべき乗", "5 回で 1 に戻る（位数 5）")
    ring(545, 222, 140, 3, 15, 21, xcyc, SIG, SSOFT, "要素 x + 1 のべき乗", "0 以外の 15 個を全部通る（位数 15）")
    o.append(T(150, 344, "0 以外の 15 個のうち", "middle", 11.5, MUT))
    o.append(T(150, 362, "5 個しか通らない", "middle", 11.5, MUT))
    o.append(T(545, 404, "青の 5 個は左の円と同じ要素（x + 1 のべきの 3 つおき）", "middle", 11, MUT))
    return SVG(760, 418, o, "f = x⁴ + x³ + x² + x + 1（既約だが原始でない）で割った余りの体。要素は 4 ビット。"
               "1 から始めて、矢印 1 本ごとに同じ要素（左は x、右は x + 1）を掛ける。円の一番上が 1 = 0001 である。")
F["e05_twocycles"] = _f05_twocycles()


# ======================================================================
# 2 節 加算: バイトのビットと多項式の係数の対応、XOR による足し算
# ======================================================================
def _f05_bytepoly():
    a, b = 0x57, 0x83
    o = []
    X0, cw = 130, 34
    for j in range(8):
        e = 7 - j
        o.append(T(X0 + j * cw + 15.5, 30, "x" + _sp5(e) if e > 1 else ("x" if e == 1 else "1"), "middle", 12, MUT, True))
        o.append(T(X0 + j * cw + 15.5, 46, "bit %d" % e, "middle", 9.5, FNT))
    both = {j for j in range(8) if (a >> (7 - j)) & 1 and (b >> (7 - j)) & 1}
    rows = [("0x57", a, _poly5(a)), ("0x83", b, _poly5(b))]
    for k, (nm, v, ps) in enumerate(rows):
        y = 58 + k * 40
        o.append(T(X0 - 16, y + 20, nm, "end", 13, INK, True, True))
        o.append(_cells5(X0, y, _bin5(v, 8), cw, 30, hl=both))
        o.append(T(X0 + 8 * cw + 16, y + 20, ps, "start", 12.5, INK))
    o.append(W(X0 - 70, 142, X0 + 8 * cw, 142, c=INK, lw=1.4))
    s = a ^ b
    o.append(T(X0 - 16, 170, "和", "end", 13, SIG, True))
    o.append(_cells5(X0, 150, _bin5(s, 8), cw, 30, c=SIG, fill=SSOFT, tc=SIG, bold=True))
    o.append(T(X0 + 8 * cw + 16, 170, "%s = %s" % (_hex5(s), _poly5(s)), "start", 12.5, SIG, True))
    o.append(T(X0 + 6.5 * cw, 206, "赤の 2 列（x と 1）は両方 1 なので 1 + 1 = 0 で消える", "middle", 11.5, ALI))
    return SVG(800, 222, o, "バイトの第 i ビット（最下位が bit 0）を、多項式の xⁱ の係数と見る。"
               "足し算は同じ次数の係数どうしの XOR で、繰り上がりは無い。")
F["e05_bytepoly"] = _f05_bytepoly()


# ======================================================================
# 2 節 乗算: xtime（x 倍）の 2 つの場合
# ======================================================================
def _xtpanel5(x0, a, const, cname, title, tc, cnote="x⁸ の余り"):
    o = [T(x0, 24, title, "start", 13, tc, True)]
    cw = 27
    B0 = x0 + 100                 # 8 ビットの左端
    msb = (a >> 7) & 1
    o.append(T(B0 - 12, 62, _hex5(a), "end", 12.5, INK, True, True))
    o.append(_cells5(B0, 44, _bin5(a, 8), cw, 27, hl={0}, hlc=ALI if msb else _B5, hlf=ASOFT if msb else _B5S))
    o.append(T(B0 + 8 * cw + 6, 62, "最上位 = %d" % msb, "start", 11, ALI if msb else _B5, True))
    sh = (a << 1) & 0x1FF
    o.append(T(B0 - cw - 8, 104, "左へ 1 ビット", "end", 11, INK))
    o.append(_cells5(B0 - cw, 86, _bin5(sh, 9), cw, 27, hl={0}, hlc=ALI if msb else MUT, hlf=ASOFT if msb else SCR))
    o.append(T(B0 - cw + 12, 128, "x⁸ の桁", "middle", 10, ALI if msb else MUT, True))
    low = sh & 0xFF
    if msb:
        o.append(T(B0 - 12, 160, "下位 8 ビット", "end", 11, INK))
        o.append(_cells5(B0, 142, _bin5(low, 8), cw, 27))
        o.append(T(B0 + 8 * cw + 6, 160, _hex5(low), "start", 11.5, MUT, False, True))
        o.append(T(B0 - 12, 196, "⊕ " + cname, "end", 12, ALI, True, True))
        o.append(_cells5(B0, 178, _bin5(const, 8), cw, 27, c=ALI, tc=ALI))
        o.append(T(B0 + 8 * cw + 6, 196, cnote, "start", 10.5, ALI, True))
        res = low ^ const
    else:
        o.append(T(B0 + 4 * cw, 166, "x⁸ の桁は 0: あふれない", "middle", 11.5, _B5))
        o.append(T(B0 + 4 * cw, 186, "→ 何も足さない", "middle", 11.5, _B5))
        res = low
    o.append(W(B0 - 64, 214, B0 + 8 * cw, 214, c=INK, lw=1.3))
    o.append(T(B0 - 12, 240, "= " + _hex5(res), "end", 12.5, SIG, True, True))
    o.append(_cells5(B0, 222, _bin5(res, 8), cw, 27, c=SIG, fill=SSOFT, tc=SIG, bold=True))
    return o


def _f05_xtime():
    o = []
    o += _xtpanel5(14, 0x57, 0x1B, "0x1B", "例 1: 0x57 × 0x02（最上位ビットが 0）", _B5)
    o += _xtpanel5(410, 0xAE, 0x1B, "0x1B", "例 2: 0xAE × 0x02（最上位ビットが 1）", ALI)
    return SVG(800, 264, o, "x を掛ける（xtime）は 1 ビットの左シフトである。最上位ビットが 1 だとシフトで x⁸ の桁があふれるので、"
               "x⁸ を f で割った余り x⁴ + x³ + x + 1（0x1B）を代わりに XOR する。")
F["e05_xtime"] = _f05_xtime()


# ======================================================================
# 2 節 乗算: 0x57 × 0x13 を xtime の列と XOR で計算する
# ======================================================================
def _f05_mul13():
    a, b, f = 0x57, 0x13, 0x11B
    o = []
    o.append(T(20, 24, "b = 0x13 = 0001 0011₂ = x⁴ + x + 1  →  b₀ = b₁ = b₄ = 1", "start", 12.5, INK, True))
    X_I, X_B, B0, cw = 40, 92, 236, 27
    o.append(T(X_I, 56, "i", "middle", 11, MUT, True))
    o.append(T(X_B, 56, "bᵢ", "middle", 11, MUT, True))
    o.append(T(B0 + 4 * cw - 1.5, 56, "0x57 · xⁱ", "middle", 11, MUT, True))
    o.append(T(B0 + 8 * cw + 34, 56, "16 進", "middle", 11, MUT, True))
    o.append(T(B0 + 8 * cw + 82, 56, "前の行からの xtime", "start", 11, MUT, True))
    v = a
    acc = 0
    for i in range(5):
        y = 66 + i * 38
        ov = False
        if i > 0:
            ov = bool(v & 0x80)
            v = ((v << 1) & 0xFF) ^ (0x1B if ov else 0)
        on = (b >> i) & 1
        if on:
            acc ^= v
            o.append(RECT(18, y - 3, B0 + 8 * cw + 60, 32, 7, SSOFT, SIG, 1.2))
        o.append(T(X_I, y + 18, str(i), "middle", 12.5, INK, False, True))
        o.append(T(X_B, y + 18, str(on), "middle", 13, SIG if on else MUT, bool(on), True))
        o.append(T(X_B + 30, y + 18, "足す" if on else "足さない", "start", 11, SIG if on else MUT, bool(on)))
        o.append(_cells5(B0, y, _bin5(v, 8), cw, 26, tc=INK if on else MUT))
        o.append(T(B0 + 8 * cw + 34, y + 18, _hex5(v), "middle", 12, INK if on else MUT, bool(on), True))
        if i > 0:
            o.append(T(B0 + 8 * cw + 82, y + 18, "あふれ → ⊕ 0x1B" if ov else "シフトのみ", "start", 11, ALI if ov else MUT, ov))
            o.append(ARR(B0 - 18, y - 14, B0 - 18, y + 4, MUT, 1.2, 5))
    yl = 66 + 5 * 38 + 2
    o.append(W(B0 - 70, yl, B0 + 8 * cw, yl, c=INK, lw=1.4))
    o.append(T(B0 - 12, yl + 26, "色の行の XOR", "end", 11.5, SIG, True))
    o.append(_cells5(B0, yl + 8, _bin5(acc, 8), cw, 27, c=SIG, fill=SSOFT, tc=SIG, bold=True))
    o.append(T(B0 + 8 * cw + 34, yl + 26, _hex5(acc), "middle", 13, SIG, True, True))
    o.append(T(B0 + 8 * cw + 82, yl + 26, "= 0x57 ⊕ 0xAE ⊕ 0x07", "start", 11.5, SIG, True, True))
    return SVG(800, 316, o, "上から順に xtime を繰り返して 0x57 · xⁱ を作り、b のビット bᵢ が 1 の行（色の付いた行）だけを XOR する。"
               "分配法則により、これが 0x57 × (x⁴ + x + 1) である。")
F["e05_mul13"] = _f05_mul13()


# ======================================================================
# 2 節 割り算: b^254 を 2 乗 7 回と掛け算 6 回で計算する
# ======================================================================
def _f05_inv254():
    b, f = 0x53, 0x11B
    o = []
    o.append(T(20, 24, "254 = 1111 1110₂ = 2 + 4 + 8 + 16 + 32 + 64 + 128（b¹ の桁は 0 なので使わない）", "start", 12.5, INK, True))
    X0, dx, bw, bh = 20, 98, 80, 46
    sq = [b]
    for k in range(7):
        sq.append(_mul5(sq[-1], sq[-1], f))
    o.append(T(X0, 54, "① 2 乗を 7 回繰り返す", "start", 12, _B5, True))
    for k in range(8):
        x = X0 + k * dx
        used = k >= 1
        o.append(RECT(x, 64, bw, bh, 8, _B5S if used else SCR, _B5 if used else LIN, 1.4))
        o.append(T(x + bw / 2, 82, "b" + (_sp5(2 ** k) if k else ""), "middle", 12, INK if used else MUT, True))
        o.append(T(x + bw / 2, 101, _hex5(sq[k]), "middle", 12.5, INK if used else MUT, used, True))
        if k < 7:
            o.append(ARR(x + bw + 1, 87, x + dx - 2, 87, _B5, 1.3, 5))
    o.append(T(X0, 146, "② 2 乗した 7 個を左から順に掛けていく", "start", 12, SIG, True))
    prod = sq[1]
    e = 2
    for k in range(1, 8):
        x = X0 + k * dx
        if k > 1:
            prod = _mul5(prod, sq[k], f)
            e += 2 ** k
        last = k == 7
        o.append(RECT(x, 158, bw, bh, 8, SSOFT if last else PAN, SIG, 1.6 if last else 1.2))
        o.append(T(x + bw / 2, 176, "b" + _sp5(e), "middle", 12, SIG if last else INK, True))
        o.append(T(x + bw / 2, 195, _hex5(prod), "middle", 12.5, SIG if last else INK, True, True))
        o.append(ARR(x + bw / 2, 64 + bh + 1, x + bw / 2, 156, SIG if k > 1 else MUT, 1.2, 5))
        if k > 1:
            o.append(ARR(x - dx + bw + 1, 181, x - 2, 181, SIG, 1.3, 5))
            o.append(T(x - (dx - bw) / 2, 172, "×", "middle", 11, SIG, True))
    o.append(T(X0 + 7 * dx + bw, 232, "b²⁵⁴ = 0xCA = b⁻¹（0x53 × 0xCA = 0x01）", "end", 12.5, SIG, True))
    o.append(T(X0, 232, "2 乗 7 回 + 掛け算 6 回。b の値によらず同じ回数", "start", 11.5, MUT))
    return SVG(800, 246, o, "b = 0x53（AES の f = 0x11B）の場合。上の段で b², b⁴, …, b¹²⁸ を作り、下の段でそれを順に掛ける。"
               "下の段の指数は 2, 2 + 4 = 6, 6 + 8 = 14, … と増え、最後に 254 になる。")
F["e05_inv254"] = _f05_inv254()


# ======================================================================
# 3 節 生成元 α: 複素数の i と GF(2³) の α を並べて比べる
# ======================================================================
def _f05_complex():
    o = []
    LX, LW, RX, RW = 120, 318, 452, 330
    o.append(T(LX + LW / 2, 24, "実数 ℝ → 複素数 ℂ", "middle", 13.5, _B5, True))
    o.append(T(RX + RW / 2, 24, "GF(2) → GF(2³)（f = x³ + x + 1）", "middle", 13.5, SIG, True))
    rows = [("方程式", ("x² + 1 = 0 を満たす実数は無い", "どの実数も 2 乗すると 0 以上"),
             ("x³ + x + 1 = 0 を満たす数は GF(2) に無い", "f(0) = 1、f(1) = 1 + 1 + 1 = 1")),
            ("新しい要素", ("i² = −1 となる数 i を加える", ""),
             ("f で割った余りの世界の要素 x を α と呼ぶ", "α³ = α + 1（010 を 3 回掛けると 011）")),
            ("要素の形", ("a + bi（a, b は実数）", ""),
             ("a₂α² + a₁α + a₀（aᵢ は 0 か 1）", "全部で 2³ = 8 個")),
            ("根", ("i は x² + 1 の根", "i² + 1 = −1 + 1 = 0"),
             ("α は f の根", "f(α) = α³ + α + 1 = (α + 1) + α + 1 = 0"))]
    for k, (lab, (l1, l2), (r1, r2)) in enumerate(rows):
        y = 40 + k * 64
        o.append(T(LX - 14, y + 31, lab, "end", 12, MUT, True))
        o.append(RECT(LX, y, LW, 54, 8, _B5S, _B5, 1.2))
        o.append(T(LX + 14, y + (22 if l2 else 32), l1, "start", 12.5, INK, True))
        if l2:
            o.append(T(LX + 14, y + 42, l2, "start", 11, MUT))
        o.append(RECT(RX, y, RW, 54, 8, SSOFT, SIG, 1.2))
        o.append(T(RX + 14, y + (22 if r2 else 32), r1, "start", 12.5, INK, True))
        if r2:
            o.append(T(RX + 14, y + 42, r2, "start", 11, MUT))
        if k < 3:
            o.append(ARR(LX + LW / 2, y + 55, LX + LW / 2, y + 63, _B5, 1.2, 5))
            o.append(ARR(RX + RW / 2, y + 55, RX + RW / 2, y + 63, SIG, 1.2, 5))
    return SVG(800, 302, o, "左は実数に i を加えて複素数を作る手順、右はこの節で GF(2) から GF(2³) を作った手順である。"
               "どちらも、元の世界に根の無い方程式について「根になる要素」を持つ世界を作っている。")
F["e05_complex"] = _f05_complex()


# ======================================================================
# 3 節: GF(2³) の 0 以外の 7 個を円に並べる（α を掛けると 1 つ進む）
# ======================================================================
def _ring75(cx, cy, R, nr, hl=None):
    """GF(2³)（f = x³ + x + 1）の α⁰〜α⁶ を円に並べる。hl は {k: (線の色, 塗り)}"""
    f = 0b1011
    o = []
    pts = []
    for k in range(7):
        ang = -_m5.pi / 2 + 2 * _m5.pi * k / 7
        pts.append((cx + R * _m5.cos(ang), cy + R * _m5.sin(ang)))
    for k in range(7):
        (x1, y1), (x2, y2) = pts[k], pts[(k + 1) % 7]
        dx, dy = x2 - x1, y2 - y1
        L = _m5.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        o.append(ARR(x1 + ux * (nr + 3), y1 + uy * (nr + 3), x2 - ux * (nr + 4), y2 - uy * (nr + 4), MUT, 1.4, 6))
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ox, oy = mx - cx, my - cy
        Lo = _m5.hypot(ox, oy)
        o.append(T(mx + ox / Lo * 15, my + oy / Lo * 15 + 4, "×α", "middle", 10.5, MUT))
    for k in range(7):
        x, y = pts[k]
        v = _pow5(2, k, f)
        c, fl = (hl or {}).get(k, (SIG, SSOFT))
        o.append(CIRC(x, y, nr, c, 1.7, fl))
        o.append(T(x, y - nr * 0.32, "α" + _sp5(k), "middle", 15, c if hl and k in hl else INK, True))
        o.append(T(x, y + nr * 0.18, _poly5(v, "α"), "middle", 10.5 if v != 7 else 9.5, INK))
        o.append(T(x, y + nr * 0.6, _bin5(v, 3), "middle", 11, MUT, False, True))
    return o, pts


def _f05_cycle():
    o, pts = _ring75(220, 214, 146, 39)
    o.append(T(220, 208, "α⁷ = α⁰ = 1", "middle", 13, MUT, True))
    o.append(T(220, 228, "で一周", "middle", 12, MUT))
    o.append(CIRC(470, 330, 30, LIN, 1.4, SCR))
    o.append(T(470, 326, "0", "middle", 15, INK, True))
    o.append(T(470, 344, "000", "middle", 11, MUT, False, True))
    o.append(T(512, 326, "0 は α のべき乗に", "start", 11.5, MUT))
    o.append(T(512, 344, "ならないので円の外", "start", 11.5, MUT))
    notes = ["α を掛ける = 時計回りに 1 つ進む", "7 回進むと 1 に戻る（α⁷ = 1）", "0 以外の 7 個を 1 回ずつ通る",
             "→ α は原始元（位数 7）"]
    for i, s in enumerate(notes):
        o.append(T(440, 92 + i * 28, s, "start", 12.5, SIG if i == 3 else INK, i == 3))
    return SVG(720, 400, o, "べき表を円に並べたもの。各円の上段が αᵏ、中段が多項式表現、下段がビット列である。")
F["e05_cycle"] = _f05_cycle()


def _f05_cyclemul():
    hl = {3: (_B5, _B5S), 1: (SIG, SSOFT), 4: (ALI, ASOFT)}
    cx, cy, R, nr = 236, 226, 126, 36
    o, pts = _ring75(cx, cy, R, nr, hl)
    ang = lambda k: -_m5.pi / 2 + 2 * _m5.pi * k / 7
    Ro = R + nr + 16
    o.append(_arc5(cx, cy, Ro, ang(3) + 0.16, ang(8) - 0.16, SIG, 2.2))
    o.append(_arc5(cx, cy, R - nr - 24, ang(3) + 0.25, ang(7) - 0.25, ALI, 2.0))
    o.append(T(cx + (Ro + 10) * _m5.cos(ang(5.5)), cy + (Ro + 10) * _m5.sin(ang(5.5)) - 6, "5 つ進む", "end", 11.5, SIG, True))
    o.append(T(cx, cy + 6, "残り 4 つ", "middle", 11.5, ALI, True))
    notes = [("掛け算: α³ · α⁵ = α⁸ = α¹", SIG, True), ("α³ から 5 つ進むと α¹", INK, False),
             ("（3 + 5 = 8、8 − 7 = 1）", MUT, False), ("", INK, False),
             ("逆元: α³ · α⁴ = α⁷ = 1", ALI, True), ("α³ から 1（= α⁰）まで残り 4 つ", INK, False),
             ("（7 − 3 = 4）", MUT, False)]
    for i, (s_, c, b) in enumerate(notes):
        if s_:
            o.append(T(486, 130 + i * 25, s_, "start", 12.5, c, b))
    return SVG(780, 420, o, "αⁱ は円の上の位置 i なので、αⁱ を掛けることは i 歩進むことである。"
               "外側の矢印が α³ · α⁵（5 歩）、内側の矢印が α³ の逆元を求める歩数（4 歩）である。")
F["e05_cyclemul"] = _f05_cyclemul()


# ======================================================================
# 3 節 対数表: 110 × 111 を表 2 枚で計算する
# ======================================================================
def _f05_loglookup():
    f = 0b1011
    LOG = {}
    v = 1
    for i in range(7):
        LOG[v] = i
        v = _mul5(v, 2, f)
    o = []
    X0, cw = 250, 66
    o.append(T(20, 30, "① 対数表を引く", "start", 12.5, _B5, True))
    o.append(T(20, 48, "110 → 4、111 → 5", "start", 11.5, INK, False, True))
    o.append(T(X0 - 10, 46, "ビット列", "end", 11, MUT, True))
    o.append(T(X0 - 10, 76, "指数 i", "end", 11, MUT, True))
    for j, bv in enumerate(range(1, 8)):
        x = X0 + j * cw
        on = bv in (6, 7)
        o.append(RECT(x, 28, cw - 6, 26, 5, _B5S if on else SCR, _B5 if on else LIN, 1.3))
        o.append(T(x + (cw - 6) / 2, 46, _bin5(bv, 3), "middle", 12.5, _B5 if on else INK, on, True))
        o.append(RECT(x, 58, cw - 6, 26, 5, _B5S if on else PAN, _B5 if on else LIN, 1.3))
        o.append(T(x + (cw - 6) / 2, 76, str(LOG[bv]), "middle", 13, _B5 if on else INK, on, True))
    bx, by, bw, bh = 390, 122, 290, 44
    o.append(T(20, 140, "② 指数を足して 7 で割った余り", "start", 12.5, SIG, True))
    o.append(T(20, 158, "4 + 5 = 9、9 − 7 = 2", "start", 11.5, INK, False, True))
    o.append(RECT(bx, by, bw, bh, 8, SSOFT, SIG, 1.5))
    o.append(T(bx + bw / 2, by + 28, "4 + 5 = 9  →  9 − 7 = 2", "middle", 14, SIG, True, True))
    for bv in (6, 7):
        j = bv - 1
        x = X0 + j * cw + (cw - 6) / 2
        o.append(ARR(x, 86, bx + bw / 2 + (bv - 6.5) * 60, by - 2, _B5, 1.4, 6))
    E0 = 250
    o.append(T(20, 210, "③ 逆対数表を引く", "start", 12.5, SIG, True))
    o.append(T(20, 228, "2 → 100", "start", 11.5, INK, False, True))
    o.append(T(E0 - 10, 218, "指数 i", "end", 11, MUT, True))
    o.append(T(E0 - 10, 248, "ビット列", "end", 11, MUT, True))
    for i in range(7):
        x = E0 + i * cw
        on = i == 2
        o.append(RECT(x, 200, cw - 6, 26, 5, SSOFT if on else SCR, SIG if on else LIN, 1.3))
        o.append(T(x + (cw - 6) / 2, 218, str(i), "middle", 13, SIG if on else INK, on, True))
        o.append(RECT(x, 230, cw - 6, 26, 5, SSOFT if on else PAN, SIG if on else LIN, 1.3))
        o.append(T(x + (cw - 6) / 2, 248, _bin5(_pow5(2, i, f), 3), "middle", 12.5, SIG if on else INK, on, True))
    o.append(ARR(bx + bw / 2, by + bh + 1, E0 + 2 * cw + (cw - 6) / 2 + 4, 198, SIG, 1.4, 6))
    return SVG(720, 268, o, "GF(2³)（f = x³ + x + 1）で 110 × 111 を計算する。表を 2 回引き、指数を足し、もう 1 回表を引く。"
               "多項式の展開も f での割り算もしない。")
F["e05_loglookup"] = _f05_loglookup()


# ======================================================================
# 3 節 GF(4): 03 章の 0, 1, α, β と、x² + x + 1 で割った余りの対応
# ======================================================================
def _f05_gf4():
    o = []
    P = [(190, 74), (318, 236), (62, 236)]
    info = [("α⁰", "1", "01", "03 章の 1"), ("α¹", "α", "10", "03 章の α"), ("α²", "α + 1", "11", "03 章の β")]
    for k in range(3):
        (x1, y1), (x2, y2) = P[k], P[(k + 1) % 3]
        dx, dy = x2 - x1, y2 - y1
        L = _m5.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        o.append(ARR(x1 + ux * 46, y1 + uy * 46, x2 - ux * 47, y2 - uy * 47, MUT, 1.5, 7))
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ox, oy = mx - 190, my - 182
        Lo = _m5.hypot(ox, oy)
        o.append(T(mx + ox / Lo * 18, my + oy / Lo * 18 + 4, "×α", "middle", 11, MUT))
    for k, (x, y) in enumerate(P):
        nm, ps, bt, old = info[k]
        o.append(CIRC(x, y, 42, SIG, 1.7, SSOFT))
        o.append(T(x, y - 12, nm, "middle", 15, INK, True))
        o.append(T(x, y + 7, ps, "middle", 11.5, INK))
        o.append(T(x, y + 25, bt, "middle", 11.5, MUT, False, True))
        o.append(T(x, y + (-54 if k == 0 else 62), old, "middle", 12, ALI, True))
    o.append(T(190, 182, "α³ = 1 で一周", "middle", 11.5, MUT))
    o.append(CIRC(430, 270, 24, LIN, 1.4, SCR))
    o.append(T(430, 266, "0", "middle", 14, INK, True))
    o.append(T(430, 282, "00", "middle", 10.5, MUT, False, True))
    o.append(T(462, 274, "03 章の 0（円の外）", "start", 11.5, ALI, True))
    notes = ["f = x² + x + 1、要素 x を α と呼ぶ", "x² を f で割った余りは x + 1", "→ α² = α + 1（03 章の β）",
             "α³ = α(α + 1) = α² + α = 1", "→ 0 以外の 3 個を巡る（α は原始元）"]
    for i, s in enumerate(notes):
        o.append(T(410, 60 + i * 26, s, "start", 12, SIG if s.startswith("→") else INK, s.startswith("→")))
    return SVG(720, 312, o, "03 章で演算表だけを与えた GF(4) の 4 個の要素は、x² + x + 1 で割った余りの 4 個（2 ビット）である。"
               "赤字が 03 章での名前である。")
F["e05_gf4"] = _f05_gf4()


# ======================================================================
# 3 節 リード・ソロモン: α = 0x02 を掛け続けて逆対数表を作る（f = 0x11D）
# ======================================================================
def _f05_rsalpha():
    f = 0x11D
    o = []
    X0, cw, rh = 96, 24, 21
    for j in range(8):
        e = 7 - j
        o.append(T(X0 + j * cw + 10.5, 28, "x" + _sp5(e) if e > 1 else ("x" if e == 1 else "1"), "middle", 10.5, MUT, True))
    o.append(T(X0 + 8 * cw + 34, 28, "16 進", "middle", 10.5, MUT, True))
    v = 1
    for i in range(13):
        y = 38 + i * rh
        ov = False
        if i > 0:
            ov = bool(v & 0x80)
            v = ((v << 1) & 0xFF) ^ (0x1D if ov else 0)
        s = _bin5(v, 8)
        ones = {j for j in range(8) if s[j] == "1"}
        o.append(T(X0 - 12, y + 14, "α" + _sp5(i), "end", 12, ALI if ov else INK, ov))
        o.append(_cells5(X0, y, s, cw, rh - 3, hl=ones, hlc=ALI if ov else _B5, hlf=ASOFT if ov else _B5S, sz=10.5))
        o.append(T(X0 + 8 * cw + 34, y + 14, "%02X" % v, "middle", 12, ALI if ov else INK, ov, True))
        if ov:
            o.append(T(X0 + 8 * cw + 66, y + 14, "前の行の最上位が 1 → 左シフトして ⊕ 0x1D", "start", 11, ALI, True))
    o.append(T(X0 + 8 * cw + 66, 38 + 3 * rh + 14, "α⁰〜α⁷: 1 が左へ動くだけ", "start", 11, _B5, True))
    o.append(T(X0 + 8 * cw + 66, 38 + 10 * rh + 14, "α⁹〜α¹¹: 最上位が 0 なのでシフトのみ", "start", 11, MUT))
    return SVG(720, 320, o, "QR コードの f = x⁸ + x⁴ + x³ + x² + 1（0x11D）で、1 から始めて α = x（0x02）を掛け続けた。"
               "x⁸ ≡ x⁴ + x³ + x² + 1（0x1D）なので、あふれた行では 0x1D を XOR する。")
F["e05_rsalpha"] = _f05_rsalpha()


# ======================================================================
# 3 節 暗号: AES の体（0x11B）で 0x02 と 0x03 のべき乗が通る要素
# ======================================================================
def _bytegrid5(x0, y0, cells, title, tc, gen, pitch=14, top=34):
    """16×16 のバイト表。cells は {値: (塗り, 線)}"""
    o = [T(x0 + 8 * pitch, y0 - top, title, "middle", 12.5, tc, True)]
    for j in range(16):
        o.append(T(x0 + j * pitch + (pitch - 2) / 2, y0 - 6, "%X" % j, "middle", 8.5, MUT, False, True))
        o.append(T(x0 - 6, y0 + j * pitch + pitch / 2 + 2.5, "%X" % j, "end", 8.5, MUT, False, True))
    for v in range(256):
        r, c = divmod(v, 16)
        fl, ln = cells.get(v, (PAN, LIN))
        o.append(RECT(x0 + c * pitch, y0 + r * pitch, pitch - 2, pitch - 2, 2, fl, ln, 0.8))
    if gen is not None:
        r, c = divmod(gen, 16)
        o.append(RECT(x0 + c * pitch - 2, y0 + r * pitch - 2, pitch + 2, pitch + 2, 3, "none", ALI, 2))
    return o


def _f05_aesbase():
    f = 0x11B
    o = []
    for x0, g, tc, fl, title, sub in [(54, 2, _B5, _B5S, "0x02（= x）のべき乗", "51 個で 1 に戻る（位数 51）"),
                                       (434, 3, SIG, SSOFT, "0x03（= x + 1）のべき乗", "0 以外の 255 個を全部通る（位数 255）")]:
        reach = set()
        v = 1
        while True:
            reach.add(v)
            v = _mul5(v, g, f)
            if v == 1:
                break
        cells = {u: (fl, tc) for u in reach}
        cells[0] = (LIN, MUT)
        o += _bytegrid5(x0, 80, cells, title, tc, g, top=42)
        o.append(T(x0 + 112, 54, sub, "middle", 11.5, INK))
        o.append(T(x0 + 112, 80 + 16 * 14 + 22, "通った要素: %d 個" % len(reach), "middle", 12, tc, True))
    o.append(T(370, 346, "行が上位 4 ビット、列が下位 4 ビット。赤枠が掛け続ける要素、左上の濃い灰色が 0x00", "middle", 11, MUT))
    return SVG(740, 360, o, "AES の体（f = 0x11B）で、1 から始めて同じ要素を掛け続けたときに現れる値を色で示した。"
               "0x02 は 51 個しか通らないので対数表の底にできないが、0x03 は 0 以外の全要素を通る原始元である。")
F["e05_aesbase"] = _f05_aesbase()


# ======================================================================
# 3 節 暗号: 表を引く時間が秘密の値で変わる / 変わらない書き方との比較
# ======================================================================
def _f05_cache():
    o = []
    TX, NL, lw = 200, 16, 22             # 表（256 項 = 16 行のキャッシュライン）
    TB = 590                             # 時間の棒の左端
    o.append(T(TB, 24, "かかる時間", "start", 11.5, MUT, True))
    def table(y, cached, read, rc):
        for j in range(NL):
            fl = SSOFT if j in cached else PAN
            c = SIG if j in cached else LIN
            o.append(RECT(TX + j * lw, y, lw - 2, 22, 3, fl, c, 1.1))
            if j in read:
                o.append(RECT(TX + j * lw - 1, y - 1, lw, 24, 3, "none", rc, 2.2))
    # A: 1 項だけ引く
    o.append(T(20, 46, "表を 1 項だけ引く", "start", 13, ALI, True))
    o.append(T(20, 64, "読む番地 = 表の先頭 + 値", "start", 11, MUT))
    cached = {0, 1, 2, 5, 6, 9}
    table(80, cached, {1}, SIG)
    table(150, cached, {12}, ALI)
    o.append(T(TX - 10, 96, "値 0x12", "end", 11.5, INK, True, True))
    o.append(T(TX - 10, 166, "値 0xC7", "end", 11.5, INK, True, True))
    o.append(T(TX + 1.5 * lw, 120, "↑ キャッシュにある行", "start", 10.5, SIG))
    o.append(T(TX + 12.5 * lw, 190, "↑ キャッシュに無い行", "middle", 10.5, ALI))
    o.append(RECT(TB, 82, 50, 18, 3, SSOFT, SIG, 1.2))
    o.append(T(TB + 58, 96, "速い", "start", 11.5, SIG, True))
    o.append(RECT(TB, 152, 150, 18, 3, ASOFT, ALI, 1.2))
    o.append(T(TB + 158, 166, "遅い", "start", 11.5, ALI, True))
    o.append(T(TB, 128, "→ 時間から値の手がかりが漏れる", "start", 11, ALI, True))
    # B: 全部読む
    o.append(T(20, 226, "256 項を全部読み、", "start", 13, _B5, True))
    o.append(T(20, 244, "マスクで 1 項だけ残す", "start", 13, _B5, True))
    table(220, cached, set(range(NL)), _B5)
    o.append(T(TX, 262, "掛け算 1 回で表を 3 回 × 256 項 = 約 768 回読む", "start", 11, MUT))
    o.append(RECT(TB, 222, 170, 18, 3, _B5S, _B5, 1.2))
    o.append(T(TB, 262, "どの値でも同じ。ただし遅い", "start", 11, _B5, True))
    # C: シフトと XOR
    o.append(T(20, 304, "シフトと XOR", "start", 13, SIG, True))
    o.append(T(20, 322, "（表を使わない）", "start", 11, MUT))
    for i in range(8):
        x = TX + i * 44
        o.append(RECT(x, 296, 18, 18, 3, _B5, _B5, 1.1))
        o.append(RECT(x + 20, 296, 18, 18, 3, SIG, SIG, 1.1))
    o.append(T(TX, 336, "青が xtime、緑が XOR。8 回ずつで、メモリの表は読まない", "start", 11, MUT))
    o.append(RECT(TB, 296, 40, 18, 3, SSOFT, SIG, 1.2))
    o.append(T(TB, 336, "どの値でも同じで、速い", "start", 11, SIG, True))
    return SVG(800, 350, o, "1 マスが表の 1 行分（16 項）。キャッシュにある行（色付き）は速く読め、無い行は遅い。"
               "時間の棒は大小関係を示す模式図で、実際の値ではない。")
F["e05_cache"] = _f05_cache()


# ======================================================================
# 3 節 定数時間: 素直な実装と定数時間の実装で、実行する操作の列を比べる
# ======================================================================
def _trace5(a, b, ct):
    """各周回の操作 [(XOR を実行したか・足す値が a か, xtime を実行したか, 0x1B の XOR を実行したか・本物か)]"""
    out = []
    for i in range(8):
        if not ct and (b >> i) == 0:
            break
        bit = (b >> i) & 1
        ov = bool(a & 0x80)
        out.append((bit, ov))
        a = ((a << 1) & 0xFF) ^ (0x1B if ov else 0)
    return out


def _f05_cttrace():
    a = 0x57
    o = []
    SX, SW, sq = 168, 54, 14
    def row(y, b, ct, lab):
        tr = _trace5(a, b, ct)
        o.append(T(SX - 12, y + 11, lab, "end", 12, INK, True, True))
        nx = n1 = 0
        for i in range(8):
            x = SX + i * SW
            if i >= len(tr):
                o.append(T(x + 22, y + 11, "—", "middle", 11, FNT))
                continue
            bit, ov = tr[i]
            # ⊕（r に足す）
            if ct or bit:
                real = bool(bit)
                o.append(RECT(x, y, sq, sq, 2, SIG if real else SSOFT, SIG, 1.1))
                nx += 1
            else:
                o.append(RECT(x, y, sq, sq, 2, "none", LIN, 1.1, "2,2"))
            # x（シフト）
            o.append(RECT(x + 16, y, sq, sq, 2, _B5, _B5, 1.1))
            # 0x1B の XOR
            if ct or ov:
                o.append(RECT(x + 32, y, sq, sq, 2, ALI if ov else ASOFT, ALI, 1.1))
                n1 += 1
            else:
                o.append(RECT(x + 32, y, sq, sq, 2, "none", LIN, 1.1, "2,2"))
        o.append(T(SX + 8 * SW + 6, y + 11, "%d 周: ⊕ %d 回、0x1B %d 回" % (len(tr), nx, n1), "start", 11.5, INK))
    o.append(T(20, 26, "素直な実装 gf_mul（b の 1 のビットだけ足し、b が 0 になったら終わる）", "start", 12.5, ALI, True))
    for i in range(8):
        o.append(T(SX + i * SW + 22, 46, "i = %d" % i, "middle", 9.5, MUT))
    row(56, 0x13, False, "b = 0x13")
    row(84, 0x01, False, "b = 0x01")
    o.append(T(20, 140, "定数時間の実装 gf_mul_ct（毎回 8 周、足すかどうかはマスクで選ぶ）", "start", 12.5, SIG, True))
    for i in range(8):
        o.append(T(SX + i * SW + 22, 160, "i = %d" % i, "middle", 9.5, MUT))
    row(170, 0x13, True, "b = 0x13")
    row(198, 0x01, True, "b = 0x01")
    # 凡例
    ly = 244
    items = [(SIG, SIG, None, "r に a を XOR"), (SSOFT, SIG, None, "r に 0 を XOR（ct）"), (_B5, _B5, None, "左シフト"),
             (ALI, ALI, None, "0x1B を XOR"), (ASOFT, ALI, None, "0 を XOR（ct）"), ("none", LIN, "2,2", "実行しない")]
    x = 20
    for fl, c, da, s in items:
        o.append(RECT(x, ly - 11, 12, 12, 2, fl, c, 1.1, da))
        o.append(T(x + 17, ly, s, "start", 10.5, MUT))
        x += 17 + sum(10.5 if ord(ch) > 0x2000 else 6 for ch in s) + 22
    return SVG(800, 258, o, "a = 0x57 に b = 0x13 と b = 0x01 を掛けるとき、各周回で実行する操作を並べた。"
               "素直な実装では周回の数と操作の並びが b で変わるが、定数時間の実装ではどちらも同じ並びになる。")
F["e05_cttrace"] = _f05_cttrace()


# ======================================================================
# 4 節 定理 1: x³ + x + 1 と x³ + x² + 1 で作った GF(2³) の同型
# ======================================================================
def _f05_iso():
    f1, f2 = 0b1011, 0b1101
    g2 = 0b011                         # x³ + x² + 1 の体で、x³ + x + 1 の根になる要素（x + 1 の余り）
    o = []
    LX, RX = 120, 470
    o.append(T(LX + 75, 24, "x³ + x + 1 で作った GF(2³)", "middle", 13, _B5, True))
    o.append(T(LX + 75, 42, "α = 010（x の余り）", "middle", 11, MUT))
    o.append(T(RX + 75, 24, "x³ + x² + 1 で作った GF(2³)", "middle", 13, SIG, True))
    o.append(T(RX + 75, 42, "γ = 011（x + 1 の余り）", "middle", 11, MUT))
    for k in range(8):
        y = 56 + k * 30
        if k < 7:
            l, r = _pow5(2, k, f1), _pow5(g2, k, f2)
            ln, rn = "α" + _sp5(k), "γ" + _sp5(k)
        else:
            l, r, ln, rn = 0, 0, "0", "0"
        o.append(RECT(LX, y, 150, 24, 5, _B5S, _B5, 1.1))
        o.append(T(LX + 14, y + 17, ln, "start", 12.5, INK, True))
        o.append(T(LX + 136, y + 17, _bin5(l, 3), "end", 12.5, INK, False, True))
        o.append(RECT(RX, y, 150, 24, 5, SSOFT, SIG, 1.1))
        o.append(T(RX + 14, y + 17, rn, "start", 12.5, INK, True))
        o.append(T(RX + 136, y + 17, _bin5(r, 3), "end", 12.5, INK, False, True))
        o.append(DARR(LX + 154, y + 12, RX - 4, y + 12, MUT, 1.1, 5))
    o.append(T(LX + 75, 312, "α³ = α + 1: 011 = 010 ⊕ 001", "middle", 11.5, _B5, True, True))
    o.append(T(RX + 75, 312, "γ³ = γ + 1: 010 = 011 ⊕ 001", "middle", 11.5, SIG, True, True))
    o.append(T(370, 338, "同じ行どうしを対応させると、足し算・掛け算の結果も対応する（ビット列の値は違う）", "middle", 11.5, INK))
    return SVG(740, 352, o, "右の体のビット 011 の要素 γ は γ³ + γ + 1 = 010 ⊕ 011 ⊕ 001 = 000 を満たし、"
               "左の α と同じ関係式に従う。そこで αᵏ に γᵏ を対応させる。")
F["e05_iso"] = _f05_iso()


# ======================================================================
# 4 節 定理 3: AES の体（0x11B）の中の部分体
# ======================================================================
def _f05_subfield():
    f = 0x11B
    g16 = {0} | {_pow5(3, 17 * k, f) for k in range(15)}
    g4 = {0} | {_pow5(3, 85 * k, f) for k in range(3)}
    g2 = {0, 1}
    cells = {}
    for v in g16:
        cells[v] = (_B5S, _B5)
    for v in g4:
        cells[v] = (SSOFT, SIG)
    for v in g2:
        cells[v] = (SIG, SIG)
    o = _bytegrid5(48, 70, cells, "AES の体 GF(2⁸)（256 マス）", INK, None, top=40)
    o.append(T(48 + 112, 48, "行が上位 4 ビット、列が下位 4 ビット", "middle", 10.5, MUT))
    # 右: 入れ子
    X, Y = 330, 40
    o.append(RECT(X, Y, 400, 236, 12, PAN, LIN, 1.4))
    o.append(T(X + 14, Y + 22, "GF(2⁸): 256 個", "start", 12.5, INK, True))
    o.append(RECT(X + 16, Y + 34, 368, 146, 10, _B5S, _B5, 1.3))
    o.append(T(X + 30, Y + 56, "GF(2⁴): 16 個（青と緑のマス）", "start", 12, _B5, True))
    o.append(T(X + 30, Y + 74, "00 01 0C 0D 50 51 5C 5D B0 B1 BC BD E0 E1 EC ED", "start", 10.5, INK, False, True))
    o.append(RECT(X + 30, Y + 86, 340, 82, 9, SSOFT, SIG, 1.3))
    o.append(T(X + 44, Y + 108, "GF(2²): 4 個 = {00, 01, BC, BD}", "start", 12, SIG, True, False))
    o.append(T(X + 44, Y + 126, "BC + BD = 01、BC · BC = BD", "start", 10.5, INK, False, True))
    o.append(RECT(X + 44, Y + 136, 150, 24, 7, SIG, SIG, 1.2))
    o.append(T(X + 119, Y + 153, "GF(2) = {00, 01}", "middle", 11, PAN, True))
    o.append(T(X + 14, Y + 204, "GF(2³) の 8 個は入っていない", "start", 12, ALI, True))
    o.append(T(X + 14, Y + 222, "（3 は 8 を割り切らない）", "start", 11, ALI))
    o.append(T(390, 312, "部分体の要素数 2ⁿ は、n が 8 の約数 1, 2, 4, 8 のときだけ現れる", "middle", 11.5, INK))
    return SVG(760, 326, o, "AES の体の 256 個のバイトのうち、それだけで体になっている部分集合を色で示した。"
               "濃い緑が GF(2)、緑までが GF(4)、青まで含めると GF(16) である。")
F["e05_subfield"] = _f05_subfield()


# ======================================================================
# 4 節 定理 4: 二項係数の表（n が素数の行は両端以外が n の倍数）
# ======================================================================
def _f05_pascal():
    from math import comb as _comb
    o = []
    CX, PX, PY, bw, bh = 272, 46, 32, 40, 24
    prime = {2, 3, 5, 7}
    for n in range(8):
        y = 30 + n * PY
        o.append(T(20, y + 17, "n = %d" % n, "start", 11.5, MUT, True))
        bad = []
        for k in range(n + 1):
            v = _comb(n, k)
            x = CX + (k - n / 2) * PX - bw / 2
            inner = 0 < k < n
            if inner and n >= 2:
                if v % n == 0:
                    fl, c, tc = SSOFT, SIG, SIG
                else:
                    fl, c, tc = ASOFT, ALI, ALI
                    bad.append(str(v))
            else:
                fl, c, tc = PAN, LIN, INK
            o.append(RECT(x, y, bw, bh, 5, fl, c, 1.2))
            o.append(T(x + bw / 2, y + 17, str(v), "middle", 12, tc, inner and n >= 2, True))
        if n >= 2:
            if n in prime:
                s, col = "素数: 両端以外はすべて %d の倍数" % n, SIG
            else:
                s, col = "素数でない: %s は %d の倍数でない" % ("、".join(sorted(set(bad), key=int)), n), ALI
            o.append(T(486, y + 17, s, "start", 11.5, col, True))
    o.append(T(486, 30 + 17, "(a + b)ⁿ を展開した係数", "start", 11.5, MUT))
    o.append(T(486, 30 + PY + 17, "（左から aⁿ⁻ᵏbᵏ の係数）", "start", 11.5, MUT))
    return SVG(800, 296, o, "n 行目は (a + b)ⁿ を展開した係数（二項係数）である。n が素数 p の行では両端以外がすべて p の倍数なので、"
               "標数 p の体ではその項が消えて (a + b)ᵖ = aᵖ + bᵖ が残る。")
F["e05_pascal"] = _f05_pascal()


# ======================================================================
# 5 節: 第 I 部の道具と、この先の使い道
# ======================================================================
def _f05_tools():
    o = []
    def box(x, y, w, h, t1, t2, c, fl, tc=INK):
        o.append(RECT(x, y, w, h, 9, fl, c, 1.4))
        o.append(T(x + w / 2, y + h / 2 - (3 if t2 else -4), t1, "middle", 12.5, tc, True))
        if t2:
            o.append(T(x + w / 2, y + h / 2 + 15, t2, "middle", 10.5, MUT))
    # 1 段目: 整数
    box(20, 30, 170, 50, "整数 ℤ と合同算術", "01 章", LIN, PAN)
    o.append(ARR(194, 55, 296, 55, INK, 1.6))
    o.append(T(245, 47, "素数 p で割る", "middle", 10.5, ALI, True))
    box(300, 30, 150, 50, "GF(p)", "03 章", SIG, SSOFT, SIG)
    o.append(ARR(454, 55, 556, 55, INK, 1.6))
    box(560, 30, 220, 50, "RSA（16 章）", "DH・楕円曲線（17 章）", _B5, _B5S)
    # 2 段目: 多項式
    box(20, 120, 170, 50, "GF(2) 係数の多項式", "02・04 章", LIN, PAN)
    o.append(ARR(194, 145, 296, 145, INK, 1.6))
    o.append(T(245, 137, "既約多項式で割る", "middle", 10.5, ALI, True))
    box(300, 120, 150, 50, "GF(2ᵐ)", "05 章（この章）", SIG, SSOFT, SIG)
    o.append(ARR(454, 145, 556, 145, INK, 1.6))
    box(560, 120, 220, 50, "AES（14 章）", "RS（11 章）・BCH（10 章）", _B5, _B5S)
    # 多項式から直接使うもの
    box(300, 192, 150, 38, "CRC（09 章）", "", _B5, _B5S)
    box(560, 192, 220, 38, "LFSR（13 章）", "", _B5, _B5S)
    o.append(W(80, 172, 80, 211, 296, 211, c=INK, lw=1.4))
    o.append(ARR(286, 211, 297, 211, INK, 1.4))
    o.append(T(190, 204, "割り算の余り", "middle", 10.5, MUT))
    o.append(W(130, 172, 130, 246, 670, 246, 670, 236, c=INK, lw=1.4))
    o.append(ARR(670, 240, 670, 233, INK, 1.4))
    o.append(T(505, 240, "原始多項式", "middle", 10.5, MUT))
    # 共通の道具
    o.append(RECT(20, 266, 760, 46, 9, SCR, LIN, 1.2, "5,3"))
    o.append(T(400, 285, "どの体でも使う道具", "middle", 11.5, MUT, True))
    o.append(T(400, 303, "拡張ユークリッド（逆元、01・04 章） ／ 繰り返し二乗法（べき乗、01 章） ／ 群・環・体（構造の言葉、02 章）",
               "middle", 11.5, INK))
    return SVG(800, 324, o, "第 I 部（01〜05 章）で作った道具が、どの章で使われるか。整数と多項式の 2 つの系統があり、"
               "どちらも「素数にあたるもので割った余り」で体を作る。")
F["e05_tools"] = _f05_tools()
