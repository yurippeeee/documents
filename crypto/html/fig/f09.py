# 09 章 巡回符号と CRC の図（figures.py の関数・定数をそのまま使う）
# 他の章のファイルと同じ名前空間で exec されるので、補助関数・定数は名前に 9 を付ける。

_B9 = "var(--blue)"
_BS9 = "var(--blue-soft)"
_SUP9 = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")

# マスの見た目: (塗り, 枠, 文字色, 太字)
_ST9 = {
    "n": (PAN, LIN, INK, False),        # ふつう
    "d": (SSOFT, SIG, INK, False),      # データ（情報ビット）
    "c": (_BS9, _B9, INK, False),       # 検査ビット・余り
    "e": (ASOFT, ALI, ALI, True),       # 誤り
    "z": (SCR, LIN, FNT, False),        # 付け足した 0・送らないビット
    "h": (SSOFT, SIG, SIG, True),       # 強調（緑）
    "b": (_BS9, _B9, _B9, True),        # 強調（青）
    "q": (PAN, MUT, MUT, False),        # 「?」のマス
}


def _pm9(a, b):
    """GF(2) 係数の多項式の積（整数のビットが係数）"""
    r = 0
    while b:
        if b & 1:
            r ^= a
        a <<= 1
        b >>= 1
    return r


def _dm9(a, b):
    """GF(2) 係数の多項式の割り算 (商, 余り)"""
    q, db = 0, b.bit_length() - 1
    while a and a.bit_length() - 1 >= db:
        s = a.bit_length() - 1 - db
        q |= 1 << s
        a ^= b << s
    return q, a


def _bs9(v, n):
    return format(v, "0%db" % n)


def _ps9(v):
    """多項式を x³+x+1 の形の文字列にする"""
    if v == 0:
        return "0"
    t = []
    for e in range(v.bit_length() - 1, -1, -1):
        if (v >> e) & 1:
            t.append("1" if e == 0 else "x" if e == 1 else "x" + str(e).translate(_SUP9))
    return "+".join(t)


def _c9(x, y, ch, st="n", w=24, h=26, sz=13, dash=None):
    """1 マス（幅 w のうち w-3 を使う）"""
    fl, c, tc, b = _ST9[st]
    o = RECT(x, y, w - 3, h, 4, fl, c, 1.3, dash if dash else ("4,3" if st == "q" else None))
    return o + T(x + (w - 3) / 2, y + h / 2 + sz * 0.36, ch, "middle", sz, tc, b, True)


def _r9(x, y, s, sts=None, w=24, h=26, sz=13):
    """文字列 s を 1 文字 1 マスで描く。sts はスタイル文字（1 文字なら全部同じ）。空白の文字はマスを描かない"""
    if sts is None:
        sts = "n"
    if len(sts) == 1:
        sts = sts * len(s)
    o = []
    for i, ch in enumerate(s):
        if ch == " ":
            continue
        o.append(_c9(x + i * w, y, ch, sts[i], w, h, sz))
    return "".join(o)


def _xor9(cx, cy, r=10, c=INK):
    """XOR の記号（丸に十字）"""
    return (CIRC(cx, cy, r, c, 1.5, PAN) + W(cx - r + 3, cy, cx + r - 3, cy, c=c, lw=1.5)
            + W(cx, cy - r + 3, cx, cy + r - 3, c=c, lw=1.5))


# ---------------------------------------------------------------- 1 節
# 1. 巡回シフト
def _f09_rotate():
    o = []
    cw, ch = 34, 30
    yA, yB = 56, 136

    def panel(x0, top, bot, tst, bst, title, note):
        o.append(T(x0 + 3.5 * cw - 1.5, 20, title, "middle", 13, INK, True))
        for i in range(7):
            o.append(T(x0 + i * cw + (cw - 3) / 2, 46, str(6 - i), "middle", 10, MUT, False, True))
        o.append(T(x0 - 14, 46, "位置", "end", 10, MUT))
        o.append(_r9(x0, yA, top, tst, w=cw, h=ch))
        o.append(_r9(x0, yB, bot, bst, w=cw, h=ch))
        for i in range(1, 7):
            xa = x0 + i * cw + (cw - 3) / 2
            xb = x0 + (i - 1) * cw + (cw - 3) / 2
            o.append(ARR(xa - 2, yA + ch + 4, xb + 3, yB - 5, MUT, 1.2, 5))
        # 左端のビットは左から下を回って右端へ
        xl, xr = x0 - 16, x0 + 7 * cw + 10
        yb = yB + ch + 14
        o.append(PL([(x0 - 4, yA + ch / 2), (xl, yA + ch / 2), (xl, yb), (xr, yb), (xr, yB + ch / 2)], SIG, 1.8))
        o.append(ARR(xr, yB + ch / 2, x0 + 7 * cw, yB + ch / 2, SIG, 1.8, 7))
        o.append(T(x0 + 3.5 * cw, yb + 22, note, "middle", 11.5, INK))

    sym = ["c₆", "c₅", "c₄", "c₃", "c₂", "c₁", "c₀"]
    # 記号のマスは 2 文字なので、_r9 ではなく個別に描く
    x0 = 70
    o.append(T(x0 + 3.5 * cw - 1.5, 20, "記号で書くと", "middle", 13, INK, True))
    for i in range(7):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 46, str(6 - i), "middle", 10, MUT, False, True))
    o.append(T(x0 - 14, 46, "位置", "end", 10, MUT))
    top = sym
    bot = sym[1:] + sym[:1]
    for i in range(7):
        o.append(_c9(x0 + i * cw, yA, top[i], "h" if i == 0 else "n", cw, ch, 13))
        o.append(_c9(x0 + i * cw, yB, bot[i], "h" if i == 6 else "n", cw, ch, 13))
    for i in range(1, 7):
        xa = x0 + i * cw + (cw - 3) / 2
        xb = x0 + (i - 1) * cw + (cw - 3) / 2
        o.append(ARR(xa - 2, yA + ch + 4, xb + 3, yB - 5, MUT, 1.2, 5))
    xl, xr = x0 - 16, x0 + 7 * cw + 10
    yb = yB + ch + 14
    o.append(PL([(x0 - 4, yA + ch / 2), (xl, yA + ch / 2), (xl, yb), (xr, yb), (xr, yB + ch / 2)], SIG, 1.8))
    o.append(ARR(xr, yB + ch / 2, x0 + 7 * cw, yB + ch / 2, SIG, 1.8, 7))
    o.append(T(x0 + 3.5 * cw, yb + 22, "左端の c₆ が右端へ回り、残りは 1 つ左へずれる", "middle", 11.5, INK))

    panel(450, "1011000", "0110001", "hnnnnnn", "nnnnnnh", "例: 1011000 を巡回シフトする",
          "1011000 → 0110001")
    return SVG(760, 226, o, "巡回シフト。左端のビットを右端へ回し、残りを 1 つずつ左へずらす。"
               "7 回繰り返すと元に戻る。")
F["e09_rotate"] = _f09_rotate()


# 2. 巡回シフト = x を掛けて x^7+1 で割った余り
def _f09_xshift():
    o = []
    cw, ch = 34, 28
    x0 = 190
    heads = ["x⁷", "x⁶", "x⁵", "x⁴", "x³", "x²", "x¹", "x⁰"]
    for i, hd in enumerate(heads):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 26, hd, "middle", 11, MUT, False, True))
    rows = [
        (40, "c(x)", " 1011000", " nnnnnnn", "1011000 = x⁶ + x⁴ + x³"),
        (80, "x·c(x)", "10110000", "hnnnnnnz", "1 ビット左へずれ、x⁷ の項がはみ出す"),
        (120, "+ (x⁷ + 1)", "10000001", "bzzzzzzb", "x⁷ ≡ 1 なので、x⁷ + 1 を足して（XOR）x⁷ を消す"),
        (170, "x·c(x) mod (x⁷ + 1)", " 0110001", " nnnnnnh", "はみ出した 1 が右端に移った = 巡回シフト"),
    ]
    for y, lab, bits, sts, note in rows:
        o.append(T(x0 - 14, y + ch / 2 + 4.5, lab, "end", 12.5, INK, True, True))
        o.append(_r9(x0, y, bits, sts, w=cw, h=ch))
        o.append(T(x0 + 8 * cw + 16, y + ch / 2 + 4.5, note, "start", 11.5, INK))
    o.append(W(x0 - 4, 159, x0 + 8 * cw, 159, c=INK, lw=1.4))
    return SVG(760, 212, o, "1 節の図の例 1011000 を多項式で計算したもの。足し算は係数ごとの XOR である。")
F["e09_xshift"] = _f09_xshift()


# 3. (7,4) 巡回符号の 16 個の符号語を、巡回シフトで移り合う組に分ける
def _f09_orbits():
    import math
    g, n = 0b1011, 7

    def rot(c):
        c <<= 1
        if c >> n:
            c ^= (1 << n) | 1
        return c

    def orbit(c):
        out = []
        while c not in out:
            out.append(c)
            c = rot(c)
        return out

    o = []
    bw, bh = 66, 38
    R = 110

    def circle(cx, cy, start, title, center):
        ws = orbit(start)
        pts = []
        for k, w in enumerate(ws):
            a = -math.pi / 2 + 2 * math.pi * k / 7
            pts.append((cx + R * math.cos(a), cy + R * math.sin(a)))
        for k in range(7):
            (x1, y1), (x2, y2) = pts[k], pts[(k + 1) % 7]
            dx, dy = x2 - x1, y2 - y1
            L = math.hypot(dx, dy)
            ux, uy = dx / L, dy / L

            def ex(ux, uy):
                return min((bw / 2) / abs(ux) if abs(ux) > 1e-6 else 1e9, (bh / 2) / abs(uy) if abs(uy) > 1e-6 else 1e9)
            s, e = ex(ux, uy) + 3, ex(ux, uy) + 4
            o.append(ARR(x1 + ux * s, y1 + uy * s, x2 - ux * e, y2 - uy * e, MUT, 1.3, 6))
        for k, w in enumerate(ws):
            x, y = pts[k]
            u = _dm9(w, g)[0]
            o.append(RECT(x - bw / 2, y - bh / 2, bw, bh, 6, PAN, _B9 if w == g else LIN, 1.8 if w == g else 1.2))
            o.append(T(x, y - 2, _bs9(w, 7), "middle", 12.5, INK, w == g, True))
            o.append(T(x, y + 13, _ps9(u), "middle", 9.5, MUT))
        o.append(T(cx, 20, title, "middle", 12, INK, True))
        o.append(T(cx, cy - 4, center[0], "middle", 11.5, MUT))
        o.append(T(cx, cy + 14, center[1], "middle", 11.5, MUT))

    circle(160, 168, g, "g = 0001011 を巡回シフトした 7 個", ("7 個とも", "重み 3"))
    circle(462, 168, _pm9(0b11, g), "(x+1)g = 0011101 を巡回シフトした 7 個", ("7 個とも", "重み 4"))
    # 1 個で閉じる組
    for y, w, lab in [(110, 0, "重み 0"), (226, 0b1111111, "重み 7")]:
        x = 690
        u = _dm9(w, g)[0]
        o.append(RECT(x - 36, y - bh / 2, 72, bh, 6, PAN, LIN, 1.2))
        o.append(T(x, y - 2, _bs9(w, 7), "middle", 12.5, INK, False, True))
        o.append(T(x, y + 13, _ps9(u), "middle", 9.5, MUT))
        o.append(T(x, y + 36, "シフトしても同じ", "middle", 10.5, MUT))
        o.append(T(x, y + 52, lab, "middle", 10.5, MUT))
    o.append(T(690, 64, "1 個で閉じる組", "middle", 12, INK, True))
    return SVG(760, 300, o, "g = x³+x+1 が生成する (7,4) 巡回符号の 16 個の符号語。矢印は巡回シフト（左へ 1 つ）で、"
               "各ビット列の下の小さな式は、その符号語を u(x)·g(x) と書いたときの情報多項式 u(x)。"
               "0 でない符号語の重みの最小は 3 である。")
F["e09_orbits"] = _f09_orbits()


# 4. x^i mod g を列に並べると、ハミング符号の検査行列になる
def _f09_hamH():
    g = 0b1011
    cols = [(i, _dm9(1 << i, g)[1]) for i in range(6, -1, -1)]
    o = []
    cw, ch = 40, 26
    ys = [52, 82, 112]

    def matrix(x0, cs, top_lab, bot_fn, title, rowlab):
        o.append(T(x0 + 3.5 * cw - 1.5, 18, title, "middle", 12.5, INK, True))
        o.append(T(x0 - 10, 42, top_lab, "end", 10, MUT))
        for j, (i, v) in enumerate(cs):
            o.append(T(x0 + j * cw + (cw - 3) / 2, 42, str(i), "middle", 10.5, MUT, False, True))
            bits = _bs9(v, 3)
            for r in range(3):
                o.append(_c9(x0 + j * cw, ys[r], bits[r], "b" if bits[r] == "1" else "n", cw, ch, 13))
            o.append(T(x0 + j * cw + (cw - 3) / 2, 158, bot_fn(i, v), "middle", 9.5, MUT))
        if rowlab:
            for r, lab in enumerate(["x²", "x", "1"]):
                o.append(T(x0 - 10, ys[r] + ch / 2 + 4.5, lab, "end", 11, MUT, False, True))

    matrix(78, cols, "位置 i", lambda i, v: _ps9(v), "xⁱ mod g（i = 6, …, 0）", True)
    srt = sorted(cols, key=lambda p: p[1])
    matrix(452, srt, "位置 i", lambda i, v: str(v), "値の小さい順に列を並べ替えた", True)
    o.append(T(78 - 10, 158, "xⁱ mod g", "end", 9.5, MUT))
    o.append(T(452 - 10, 158, "2 進の値", "end", 9.5, MUT))
    o.append(ARR(372, 92, 410, 92, INK, 1.8))
    o.append(T(391, 80, "並べ替え", "middle", 10.5, INK))
    o.append(T(380, 190, "右の表は 08 章の検査行列 H（第 j 列 = j の 2 進表現）と同じ。"
               "7 本の列は 0 でない 3 ビットのベクトルをちょうど 1 回ずつ含む。", "middle", 11.5, INK))
    return SVG(760, 204, o, "g = x³+x+1 で xⁱ を割った余りを、上から x²、x、1 の係数の順に縦に並べた。"
               "長さ 7 のビット列 y を g で割った余りは、y の 1 が立つ位置の列の XOR である。")
F["e09_hamH"] = _f09_hamH()


# ---------------------------------------------------------------- 2 節
# 5. 符号化の 4 段階（3 節の例）
def _f09_frame():
    o = []
    cw, ch = 32, 26
    x0 = 236
    for i in range(7):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 26, str(6 - i), "middle", 10, MUT, False, True))
    o.append(T(x0 - 12, 26, "位置", "end", 10, MUT))
    rows = [
        (36, "① データ m(x)", "1101   ", "dddd   ", "k = 4 ビット"),
        (78, "② x³·m(x)", "1101000", "ddddzzz", "x³ を掛ける = 後ろに 0 を 3 個並べる"),
        (120, "③ 余り R(x)", "    001", "    ccc", "② を g = 1011 で割った余り（3 節の筆算）"),
        (168, "④ 符号語 T(x)", "1101001", "ddddccc", "データの後ろに R を付けたもの（n = 7）"),
    ]
    for y, lab, bits, sts, note in rows:
        o.append(T(x0 - 14, y + ch / 2 + 4.5, lab, "end", 12.5, INK, True))
        o.append(_r9(x0, y, bits, sts, w=cw, h=ch))
        o.append(T(x0 + 7 * cw + 14, y + ch / 2 + 4.5, note, "start", 11.5, INK))
    o.append(W(x0 - 4, 157, x0 + 7 * cw, 157, c=INK, lw=1.4))
    o.append(T(x0 - 14, 157 + 4, "+", "end", 13, MUT, True))
    o.append(T(380, 222, "④ = ② + ③。データ（緑）はそのまま前半に残り、後ろの 3 ビット（青）が検査ビットになる。",
               "middle", 11.5, INK))
    return SVG(760, 236, o, "CRC の符号化。データ 1101、生成多項式 g = x³+x+1（1011）の場合。")
F["e09_frame"] = _f09_frame()


# 6. 短縮巡回符号: 長さ 7 の符号語の先頭の 0 を送らない
def _f09_shorten():
    o = []
    cw, ch = 32, 28
    x0 = 300
    for i in range(7):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 26, str(6 - i), "middle", 10, MUT, False, True))
    o.append(T(x0 - 12, 26, "位置", "end", 10, MUT))
    o.append(T(x0 - 14, 36 + ch / 2 + 4.5, "長さ 7 の巡回符号の符号語", "end", 12, INK, True))
    o.append(_r9(x0, 36, "0011101", "zzddccc", w=cw, h=ch))
    o.append(T(x0 + 2 * cw / 2 - 1.5, 84, "補った 0", "middle", 10.5, MUT))
    o.append(T(x0 + 2 * cw / 2 - 1.5, 98, "（送らない）", "middle", 10.5, MUT))
    o.append(T(x0 - 14, 116 + ch / 2 + 4.5, "実際に送る符号語（n = 5）", "end", 12, INK, True))
    o.append(_r9(x0 + 2 * cw, 116, "11101", "ddccc", w=cw, h=ch))
    for i in range(2, 7):
        xx = x0 + i * cw + (cw - 3) / 2
        o.append(ARR(xx, 36 + ch + 4, xx, 116 - 4, MUT, 1.2, 5))
    o.append(T(x0 + 7 * cw + 16, 36 + ch / 2 + 4.5, "(7,4) 巡回符号の符号語（1 節の図）", "start", 11.5, INK))
    o.append(T(x0 + 7 * cw + 16, 116 + ch / 2 + 4.5, "データ 11 + 検査ビット 101", "start", 11.5, INK))
    o.append(T(380, 176, "データ 11（k = 2）を g = 1011 で符号化すると、R = x³(x + 1) mod g = x² + 1 = 101。",
               "middle", 11.5, INK))
    o.append(T(380, 196, "前に 0 を補った 0011101 は、長さ 7 の巡回符号の符号語になっている。", "middle", 11.5, INK))
    return SVG(760, 212, o, "CRC は短縮巡回符号である。長さ L の巡回符号の符号語のうち、先頭の情報ビットを常に 0 とし、"
               "その 0 を送らない。")
F["e09_shorten"] = _f09_shorten()


# 7. 受信側: 余りは誤りパターンだけで決まる
def _f09_check():
    g = 0b1011
    o = []
    cw, ch = 30, 26
    x0 = 250
    for i in range(7):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 26, str(6 - i), "middle", 10, MUT, False, True))
    o.append(T(x0 - 12, 26, "位置", "end", 10, MUT))
    o.append(T(560, 26, "g = 1011 で割った余り", "middle", 11, MUT, True))
    T_, E_ = 0b1101001, 0b0010000
    rows = [
        (36, "送った符号語 T", _bs9(T_, 7), "ddddccc", T_),
        (76, "誤りパターン E", _bs9(E_, 7), "zzezzzz", E_),
        (126, "受信語 T′ = T + E", _bs9(T_ ^ E_, 7), "nnennnn", T_ ^ E_),
    ]
    for y, lab, bits, sts, v in rows:
        o.append(T(x0 - 14, y + ch / 2 + 4.5, lab, "end", 12, INK, True))
        o.append(_r9(x0, y, bits, sts, w=cw, h=ch))
        rem = _bs9(_dm9(v, g)[1], 3)
        o.append(_r9(518, y, rem, "c" if v == T_ else "e", w=30, h=ch))
        o.append(T(518 + 98, y + ch / 2 + 4.5, "← 0（T は g の倍数）" if v == T_ else "", "start", 11, MUT))
    o.append(W(x0 - 4, 115, x0 + 7 * cw, 115, c=INK, lw=1.4))
    o.append(W(514, 115, 610, 115, c=INK, lw=1.4))
    o.append(T(380, 186, "T′ の余り = T の余り（000）+ E の余り（110）。送ったデータによらず、E だけで決まる。",
               "middle", 11.5, INK))
    return SVG(760, 200, o, "受信側の検査（3 節の例）。余りが 0 でなければ誤りがあったと分かる。")
F["e09_check"] = _f09_check()


# ---------------------------------------------------------------- 4 節
# 8. 誤りパターンの種類
def _f09_errpat():
    o = []
    cw, ch = 26, 24
    x0 = 300
    N = 16
    for i in range(N):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 22, str(N - 1 - i), "middle", 9, MUT, False, True))
    o.append(T(x0 - 10, 22, "位置", "end", 9.5, MUT))

    def row(y, name, form, red, q=()):
        o.append(T(20, y + 9, name, "start", 12.5, INK, True))
        o.append(T(20, y + 27, form, "start", 11.5, MUT, False, True))
        for i in range(N):
            p = N - 1 - i
            if p in red:
                o.append(_c9(x0 + i * cw, y, "1", "e", cw, ch, 12))
            elif p in q:
                o.append(_c9(x0 + i * cw, y, "?", "q", cw, ch, 12))
            else:
                o.append(_c9(x0 + i * cw, y, "0", "z", cw, ch, 12))

    row(36, "1 ビット誤り", "E = xⁱ", {9})
    row(96, "2 ビット誤り", "E = xⁱ + xʲ", {12, 4})
    xa, xb = x0 + (N - 1 - 12) * cw + (cw - 3) / 2, x0 + (N - 1 - 4) * cw + (cw - 3) / 2
    o.append(DARR(xa, 96 + ch + 8, xb, 96 + ch + 8, MUT, 1.1, 5))
    o.append(T((xa + xb) / 2, 96 + ch + 22, "j − i = 8", "middle", 10.5, MUT))
    row(170, "奇数個の誤り（例: 3 個）", "係数 1 の項が奇数個", {13, 7, 2})
    row(230, "バースト誤り（長さ b）", "連続した区間の中の誤り", {11, 6}, q={10, 9, 8, 7})
    xa, xb = x0 + (N - 1 - 11) * cw - 2, x0 + (N - 1 - 6) * cw + cw - 1
    o.append(W(xa, 230 + ch + 6, xa, 230 + ch + 12, xb, 230 + ch + 12, xb, 230 + ch + 6, c=ALI, lw=1.3))
    o.append(T((xa + xb) / 2, 230 + ch + 27, "長さ b = 6（両端は必ず誤り、? は誤っていてもいなくてもよい）",
               "middle", 10.5, ALI))
    return SVG(760, 300, o, "誤りパターン E のいろいろ（長さ 16 の例）。赤の 1 が反転したビット。")
F["e09_errpat"] = _f09_errpat()


# 9. 周期: x^i mod g は 7 個で一周する。n > 7 なら x^7+1 を見逃す
def _f09_period():
    import math
    g = 0b1011
    o = []
    cx, cy, R = 172, 152, 114
    bw, bh = 63, 26
    pts = []
    for k in range(7):
        a = -math.pi / 2 + 2 * math.pi * k / 7
        pts.append((cx + R * math.cos(a), cy + R * math.sin(a), a))
    for k in range(7):
        x1, y1, _ = pts[k]
        x2, y2, _ = pts[(k + 1) % 7]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        d = min((bw / 2) / max(abs(ux), 1e-6), (bh / 2) / max(abs(uy), 1e-6)) + 4
        o.append(ARR(x1 + ux * d, y1 + uy * d, x2 - ux * d, y2 - uy * d, MUT, 1.3, 6))
    for k in range(7):
        x, y, a = pts[k]
        v = _dm9(1 << k, g)[1]
        st = "b" if k == 0 else "n"
        o.append(_r9(x - 31.5, y - bh / 2, _bs9(v, 3), st, w=21, h=bh, sz=12))
        lab = "x⁰ = x⁷" if k == 0 else "x" + str(k).translate(_SUP9)
        lx, ly = x + 58 * math.cos(a), y + 32 * math.sin(a) + 4
        if k == 0:
            lx, ly = x + 70, y + 4
        o.append(T(lx, ly, lab, "middle", 11, _B9 if k == 0 else MUT, k == 0))
    o.append(T(cx, cy - 4, "x を掛けて", "middle", 11, MUT))
    o.append(T(cx, cy + 14, "g で割った余り", "middle", 11, MUT))
    X = 352
    o.append(T(X, 44, "x⁷ ≡ 1 (mod g) なので、g = x³+x+1 の周期は L = 7", "start", 12.5, INK, True))
    o.append(T(X, 80, "長さ n = 8 の符号語で、位置 7 と位置 0 が反転すると", "start", 11.5, INK))
    for i in range(8):
        o.append(T(X + i * 26 + 11.5, 100, str(7 - i), "middle", 9, MUT, False, True))
    o.append(_r9(X, 106, "10000001", "ezzzzzze", w=26, h=24, sz=12))
    o.append(T(X, 160, "E = x⁷ + 1 = (x³+x+1)(x⁴+x²+x+1)", "start", 12, INK, False, True))
    o.append(T(X, 184, "→ g の倍数なので余りは 0。この誤りを見逃す", "start", 11.5, ALI, True))
    o.append(T(X, 222, "n ≤ 7 なら、2 つの位置の差 j − i は 6 以下で xʲ⁻ⁱ ≢ 1。", "start", 11.5, INK))
    o.append(T(X, 242, "→ どの 2 ビット誤りも g の倍数にならず、必ず検出される", "start", 11.5, SIG, True))
    return SVG(760, 300, o, "左: xⁱ を g = x³+x+1 で割った余り（3 ビット）。x を掛けるたびに矢印の向きに進み、"
               "7 回で 1（001）に戻る。右: 符号語が周期より長いと見逃す 2 ビット誤りがある。")
F["e09_period"] = _f09_period()


# 10. バースト誤り E = x^i B(x)
def _f09_burst():
    o = []
    cw, ch = 26, 24
    x0 = 120
    N = 16
    for i in range(N):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 24, str(N - 1 - i), "middle", 9, MUT, False, True))
    o.append(T(x0 - 10, 24, "位置", "end", 9.5, MUT))
    o.append(T(x0 - 12, 34 + ch / 2 + 4.5, "E", "end", 13, INK, True, True))
    for i in range(N):
        p = N - 1 - i
        if p in (10, 5):
            o.append(_c9(x0 + i * cw, 34, "1", "e", cw, ch, 12))
        elif 5 < p < 10:
            o.append(_c9(x0 + i * cw, 34, "?", "q", cw, ch, 12))
        else:
            o.append(_c9(x0 + i * cw, 34, "0", "z", cw, ch, 12))
    xa, xb = x0 + (N - 1 - 10) * cw - 2, x0 + (N - 1 - 5) * cw + cw - 1
    o.append(W(xa, 34 + ch + 6, xa, 34 + ch + 12, xb, 34 + ch + 12, xb, 34 + ch + 6, c=ALI, lw=1.3))
    o.append(T((xa + xb) / 2, 34 + ch + 27, "長さ b = 6", "middle", 10.5, ALI, True))
    xr = x0 + (N - 1 - 5) * cw + (cw - 3) / 2
    o.append(T(xr + 64, 34 + ch + 27, "右端の位置 i = 5", "start", 10.5, MUT))
    # 取り出した B
    y2 = 128
    o.append(T(x0 - 12, y2 + ch / 2 + 4.5, "B", "end", 13, INK, True, True))
    o.append(_r9(x0 + 5 * cw, y2, "1????1", "eqqqqe", w=cw, h=ch, sz=12))
    for i in range(6):
        xx = x0 + (5 + i) * cw + (cw - 3) / 2
        o.append(ARR(xx, 34 + ch + 34, xx, y2 - 4, FNT, 1.0, 5))
    o.append(T(x0 + 11 * cw + 14, y2 + ch / 2 + 4.5, "B(x) = x⁵ + (中間の項) + 1、E(x) = x⁵·B(x)",
               "start", 11.5, INK, False, True))
    o.append(T(20, 192, "b ≤ r のとき: deg B = b − 1 < r = deg g。0 でない g の倍数は次数が r 以上なので、",
               "start", 11.5, INK))
    o.append(T(20, 212, "B は g の倍数になれず、補題より E も g の倍数にならない → 必ず検出される。",
               "start", 11.5, SIG, True))
    return SVG(760, 226, o, "長さ b のバースト誤り。両端の誤りの間の区間だけを取り出したものが B(x) で、"
               "xⁱ を掛けると元の位置に戻る。")
F["e09_burst"] = _f09_burst()


# 11. 長いバーストを見逃す割合（r = 3、g = 1011）
def _f09_burstcount():
    g = 0b1011
    o = []

    def pats(b):
        if b == 1:
            return [1]
        return [(1 << (b - 1)) | (m << 1) | 1 for m in range(1 << (b - 2))]

    def col(x, b, title, ratio, sub=1, notew=60):
        ps = pats(b)
        miss = [p for p in ps if _dm9(p, g)[1] == 0]
        o.append(T(x, 22, title, "start", 12.5, INK, True))
        o.append(T(x, 42, "見逃し %d / %d = %s" % (len(miss), len(ps), ratio), "start", 11.5, ALI, True))
        per = (len(ps) + sub - 1) // sub
        for idx, p in enumerate(ps):
            cx = x + (idx // per) * (b * 9 + 28 + notew)
            y = 56 + (idx % per) * 26
            hit = p in miss
            w = b * 9 + 14
            o.append(RECT(cx, y, w, 21, 4, ASOFT if hit else PAN, ALI if hit else LIN, 1.4 if hit else 1.0))
            o.append(T(cx + w / 2, y + 15, _bs9(p, b), "middle", 12, ALI if hit else INK, hit, True))
            if hit:
                q = _dm9(p, g)[0]
                o.append(T(cx + w + 6, y + 15, "= g" if q == 1 else "= g·(" + _ps9(q) + ")", "start", 10.5, ALI))

    col(24, 4, "b = 4（= r + 1）", "2⁻²", 1, 30)
    col(178, 5, "b = 5", "2⁻³", 1, 70)
    col(380, 6, "b = 6", "2⁻³", 2, 96)
    return SVG(760, 272, o, "g = x³+x+1（r = 3）で、長さ b のバーストの B(x) をすべて並べた（両端は 1、中間はすべての組み合わせ）。"
               "赤が g の倍数で、見逃すもの。b = r + 1 では g そのものだけ、b ≥ r + 2 では割合が 2⁻ʳ になる。")
F["e09_burstcount"] = _f09_burstcount()


# ---------------------------------------------------------------- 5 節
# 12. レジスタで筆算をする（0 を付け足す方法）
def _f09_regsteps():
    g, r = 0b1011, 3
    inp = [1, 1, 0, 1, 0, 0, 0]
    Q = 0
    rows = [("0", "", "", "", "000", "最初は 0")]
    note = {4: "1 段目の XOR の後の余り", 5: "2 段目の XOR の後の余り", 6: "3 段目の XOR の後の余り",
            7: "4 段目の XOR の後の余り = R"}
    for t, b in enumerate(inp, 1):
        out = (Q >> (r - 1)) & 1
        Q = ((Q << 1) & 7) | b
        if out:
            Q ^= g & 7
        rows.append((str(t), str(b), str(out), "011" if out else "—", _bs9(Q, 3), note.get(t, "")))
    o = []
    o.append(T(20, 22, "入力（データの後ろに 0 を 3 個）", "start", 11.5, MUT))
    o.append(_r9(238, 8, "1101000", "ddddzzz", w=26, h=22, sz=12))
    xs = [50, 122, 210, 300]
    heads = ["クロック t", "入るビット", "はみ出したビット", "XOR する値"]
    for x, h in zip(xs, heads):
        o.append(T(x, 58, h, "middle", 11, MUT, True))
    o.append(T(410, 58, "レジスタ", "middle", 11, MUT, True))
    o.append(T(480, 58, "3 節の筆算との対応", "start", 11, MUT, True))
    o.append(W(16, 66, 744, 66, c=LIN, lw=1))
    for k, (t, b, out, xv, reg, nt) in enumerate(rows):
        y = 74 + k * 27
        hit = out == "1"
        if hit:
            o.append(RECT(16, y - 2, 728, 25, 4, _BS9, "none", 0))
        o.append(T(xs[0], y + 15, t, "middle", 12, INK, False, True))
        o.append(T(xs[1], y + 15, b, "middle", 12, INK, False, True))
        o.append(T(xs[2], y + 15, out, "middle", 12, ALI if hit else INK, hit, True))
        o.append(T(xs[3], y + 15, xv, "middle", 12, _B9 if hit else FNT, hit, True))
        o.append(_r9(368, y, reg, "c" if t == "7" else "n", w=28, h=21, sz=12))
        o.append(T(480, y + 15, nt, "start", 11, _B9 if t == "7" else INK, t == "7"))
    return SVG(760, 300, o, "g = x³+x+1、データ 1101 で、レジスタ（3 ビット）を 1 クロックずつ動かした。"
               "はみ出したビットが 1 のクロック（青の行）で g の下位 3 ビット 011 を XOR する。"
               "t = 4〜7 のレジスタの値は、3 節の筆算で各段の XOR をした後の余り 3 ビットと一致する。")
F["e09_regsteps"] = _f09_regsteps()


# 13. 0 を付け足さない回路（g = x^3+x+1）とその動き
def _f09_circuit():
    o = []
    y = 92
    # レジスタ
    for x, lab, sub in [(150, "Q₂", "x² の位置"), (250, "Q₁", "x¹ の位置"), (390, "Q₀", "x⁰ の位置")]:
        o.append(RECT(x, y - 20, 60, 40, 6, _BS9, _B9, 1.6))
        o.append(T(x + 30, y + 6, lab, "middle", 15, INK, True))
        o.append(T(x + 30, y - 28, sub, "middle", 10, MUT))
    o.append(_xor9(90, y))
    o.append(_xor9(350, y))
    # データの流れ（左へ）
    o.append(ARR(390, y, 362, y, INK, 1.5, 6))
    o.append(ARR(338, y, 312, y, INK, 1.5, 6))
    o.append(ARR(250, y, 212, y, INK, 1.5, 6))
    o.append(ARR(150, y, 102, y, INK, 1.5, 6))
    # 入力
    o.append(T(90, 22, "データ b", "middle", 11.5, SIG, True))
    o.append(T(90, 37, "（1 ビットずつ）", "middle", 10, MUT))
    o.append(ARR(90, 44, 90, y - 12, SIG, 1.6, 6))
    # 帰還
    yb = 156
    o.append(PL([(90, y + 10), (90, yb), (476, yb), (476, y)], ALI, 1.8))
    o.append(ARR(476, y, 452, y, ALI, 1.8, 7))
    o.append(D(350, yb, ALI, 3.6))
    o.append(ARR(350, yb, 350, y + 12, ALI, 1.8, 7))
    o.append(T(200, yb + 18, "帰還ビット f = Q₂ + b", "middle", 11.5, ALI, True))
    o.append(T(20, 200, "g = x³ + x + 1 の下位 3 ビットは 011（x² は 0、x¹ と x⁰ は 1）。", "start", 11, INK))
    o.append(T(20, 218, "1 の位置（Q₁ と Q₀ の入口）に f を XOR する。x² の位置には XOR しない。", "start", 11, INK))
    # 動きの表
    X = 530
    o.append(T(X + 100, 22, "データ 1101 を入れたときの動き", "middle", 11.5, INK, True))
    hx = [X + 16, X + 58, X + 104, X + 170]
    for x, h in zip(hx, ["t", "b", "f", "Q₂Q₁Q₀"]):
        o.append(T(x, 46, h, "middle", 11, MUT, True))
    o.append(W(X, 54, X + 216, 54, c=LIN, lw=1))
    Q = 0
    data = [1, 1, 0, 1]
    rows = [("0", "", "", "000")]
    for t, b in enumerate(data, 1):
        f = ((Q >> 2) & 1) ^ b
        Q = (Q << 1) & 7
        if f:
            Q ^= 0b011
        rows.append((str(t), str(b), str(f), _bs9(Q, 3)))
    for k, (t, b, f, q) in enumerate(rows):
        yy = 62 + k * 28
        o.append(T(hx[0], yy + 15, t, "middle", 12, INK, False, True))
        o.append(T(hx[1], yy + 15, b, "middle", 12, SIG, False, True))
        o.append(T(hx[2], yy + 15, f, "middle", 12, ALI, False, True))
        o.append(_r9(hx[3] - 40, yy, q, "c" if k == 4 else "n", w=27, h=21, sz=12))
    o.append(T(X + 108, 218, "4 クロックで余り R = 001", "middle", 11.5, _B9, True))
    return SVG(760, 232, o, "0 を付け足さない形のシフトレジスタ（左）と、データ 1101 を入れたときのレジスタの値（右）。"
               "各クロックで、f を計算してからレジスタ全体を左へずらし、f を XOR する位置に XOR する。")
F["e09_circuit"] = _f09_circuit()


# 14. テーブル駆動: 左端 8 ビットだけで 8 クロック分が決まる
def _f09_table():
    o = []
    X0, Wd = 140, 360
    q = Wd / 4

    def reg(y, parts, title, tsz=11.5):
        if title:
            o.append(T(X0 - 14, y + 22, title, "end", 11.5, INK, True, True))
        x = X0
        for lab, w, st in parts:
            fl, c, tc, b = _ST9[st]
            o.append(RECT(x, y, w - 3, 34, 5, fl, c, 1.4))
            o.append(T(x + (w - 3) / 2, y + 22, lab, "middle", tsz, tc, b))
            x += w

    reg(28, [("左端 8 ビット", q, "h"), ("右側 24 ビット", 3 * q, "n")], "crc")
    o.append(RECT(560, 28, 140, 34, 5, SSOFT, SIG, 1.4))
    o.append(T(630, 50, "data[i]（8 ビット）", "middle", 11.5, INK, True))
    # 添字 = 左端 8 ビット XOR data[i]
    xc, yc = X0 + q / 2, 96
    o.append(_xor9(xc, yc, 11, SIG))
    o.append(ARR(xc, 62, xc, yc - 12, SIG, 1.5, 6))
    o.append(PL([(630, 62), (630, yc), (xc + 12, yc)], SIG, 1.5))
    o.append(T(xc - 18, yc + 4, "添字", "end", 11, SIG, True))
    o.append(ARR(xc, yc + 11, xc, 132, SIG, 1.5, 6))
    reg(136, [("table[添字]（前もって計算した 32 ビット）", Wd, "b")], "表引き")
    reg(182, [("右側 24 ビット", 3 * q, "n"), ("00000000", q, "z")], "⊕ crc << 8")
    o.append(T(X0 + Wd + 14, 158, "← 左端 8 ビットの値だけで決まる", "start", 11, _B9))
    o.append(T(X0 + Wd + 14, 204, "← 8 ビット左へずれるだけ", "start", 11, MUT))
    o.append(T(X0 + Wd + 14, 222, "（8 クロックの判定に関わらない）", "start", 11, MUT))
    o.append(W(X0 - 30, 228, X0 + Wd, 228, c=INK, lw=1.4))
    reg(236, [("新しい crc（8 クロック後の値）", Wd, "n")], "")
    return SVG(760, 284, o, "テーブル駆動の 1 回分。crc = (crc << 8) ^ table[(crc >> 24) ^ data[i]] は、"
               "「表から引いた 32 ビット」と「右側 24 ビットを 8 ビット左へずらしたもの」の XOR である。")
F["e09_table"] = _f09_table()


# ---------------------------------------------------------------- 6 節
# 15. init: 先頭に 0 が増えたときに気づけるか
def _f09_init():
    g = 0b1011

    def trace(data, init):
        Q = init
        out = [Q]
        for b in data:
            f = ((Q >> 2) & 1) ^ b
            Q = (Q << 1) & 7
            if f:
                Q ^= g & 7
            out.append(Q)
        return out

    o = []
    cols = [(178, 0, "init = 000（素の CRC）"), (474, 0b111, "init = 111")]
    rows = [(58, [1, 1, 0, 1], "データ 1101"), (142, [0, 1, 1, 0, 1], "データ 01101")]
    o.append(T(20, 58 + 26, rows[0][2], "start", 12, INK, True))
    o.append(T(20, 142 + 26, rows[1][2], "start", 12, INK, True))
    o.append(T(20, 142 + 44, "（先頭に 0 が 1 個）", "start", 10.5, MUT))
    finals = {}
    for cx, init, title in cols:
        o.append(T(cx + 130, 24, title, "middle", 12.5, INK, True))
        for y, data, _ in rows:
            tr = trace(data, init)
            finals[(init, len(data))] = tr[-1]
            step = 47
            for k, v in enumerate(tr):
                x = cx + k * step
                last = k == len(tr) - 1
                o.append(RECT(x, y + 10, 36, 24, 4, _BS9 if last else PAN, _B9 if last else LIN, 1.6 if last else 1.1))
                o.append(T(x + 18, y + 27, _bs9(v, 3), "middle", 12, INK, last, True))
                if k < len(tr) - 1:
                    o.append(ARR(x + 37, y + 22, x + step - 1, y + 22, MUT, 1.1, 4))
                    o.append(T(x + 41.5, y + 6, str(data[k]), "middle", 10.5, SIG, True, True))
    o.append(T(178 + 130, 228, "R が同じ（001 と 001）→ 先頭の 0 に気づけない", "middle", 11.5, ALI, True))
    o.append(T(474 + 130, 228, "R が違う（101 と 010）→ 気づける", "middle", 11.5, SIG, True))
    assert finals[(0, 4)] == finals[(0, 5)] and finals[(7, 4)] != finals[(7, 5)]
    return SVG(760, 244, o, "g = x³+x+1 の 0 を付け足さない回路で、レジスタの初期値（init）を変えて比べた。"
               "箱はレジスタの値、矢印の上の緑の数字はそのクロックで入れたデータのビット。最後の箱（青）が CRC の値。")
F["e09_init"] = _f09_init()


# 16. refin / refout: ビットの順番を反転する
def _f09_reflect():
    o = []
    cw = 34
    x0 = 230
    v = 0x31
    a = format(v, "08b")
    b = a[::-1]
    o.append(T(x0 - 14, 46, "ふつうの順（最上位から）", "end", 11.5, INK, True))
    o.append(T(x0 - 14, 136, "送る順（最下位から）", "end", 11.5, INK, True))
    for i in range(8):
        o.append(T(x0 + i * cw + (cw - 3) / 2, 22, "b" + str(7 - i).translate(str.maketrans("01234567", "₀₁₂₃₄₅₆₇")), "middle", 10, MUT))
        o.append(T(x0 + i * cw + (cw - 3) / 2, 168, "b" + str(i).translate(str.maketrans("01234567", "₀₁₂₃₄₅₆₇")), "middle", 10, MUT))
    o.append(_r9(x0, 28, a, "n", w=cw, h=28))
    o.append(_r9(x0, 118, b, "n", w=cw, h=28))
    for i in range(8):
        xa = x0 + i * cw + (cw - 3) / 2
        xb = x0 + (7 - i) * cw + (cw - 3) / 2
        o.append(W(xa, 60, xb, 114, c=FNT, lw=1.0))
    o.append(T(x0 + 8 * cw + 16, 46, "0x31（文字 '1'）= 00110001", "start", 11.5, INK, False, True))
    o.append(T(x0 + 8 * cw + 16, 136, "反転すると 10001100", "start", 11.5, INK, False, True))
    # 多項式の反転
    def bits32(val, y, title, st):
        s = format(val, "032b")
        o.append(T(20, y - 8, title, "start", 11.5, INK, True))
        for i, c in enumerate(s):
            sty = st if c == "1" else "z"
            o.append(_c9(20 + i * 22.5, y, c, sty, 22.5, 20, 10))
    bits32(0x04C11DB7, 214, "g の下位 32 ビット 0x04C11DB7（左が x³¹、右が x⁰）", "b")
    bits32(0xEDB88320, 270, "ビット順を反転した 0xEDB88320（右シフトで計算するときに使う）", "b")
    return SVG(760, 302, o, "上: 1 バイトを最下位ビットから送る通信に合わせて、ビット順を反転する（refin）。"
               "下: レジスタの向きを逆にして計算すると、生成多項式もビット順を反転した形で使う。")
F["e09_reflect"] = _f09_reflect()


# 17. xorout: 末尾に増えた 0 に気づけるか
def _f09_xorout():
    g = 0b1011
    o = []
    cw, ch = 24, 24

    def panel(x0, title, sent, sts, tc):
        o.append(T(x0, 22, title, "start", 12.5, INK, True))
        v = int(sent, 2)
        r1 = _bs9(_dm9(v, g)[1], 3)
        r2 = _bs9(_dm9(v << 1, g)[1], 3)
        o.append(T(x0, 50, "送ったビット列", "start", 11, MUT))
        o.append(_r9(x0, 58, sent, sts, w=cw, h=ch, sz=12))
        o.append(T(x0 + 8 * cw + 12, 76, "全体の余り", "start", 11, MUT))
        o.append(_r9(x0 + 8 * cw + 76, 58, r1, "c", w=24, h=ch, sz=12))
        o.append(T(x0, 116, "後ろに 0 が 1 個増えた", "start", 11, MUT))
        o.append(_r9(x0, 124, sent + "0", sts + "e", w=cw, h=ch, sz=12))
        o.append(T(x0 + 8 * cw + 12, 142, "全体の余り", "start", 11, MUT))
        o.append(_r9(x0 + 8 * cw + 76, 124, r2, "c" if r2 == r1 else "e", w=24, h=ch, sz=12))
        return r1, r2

    a1, a2 = panel(20, "xorout なし（T をそのまま送る）", "1101001", "ddddccc", INK)
    b1, b2 = panel(400, "xorout = 111（検査ビットに 111 を XOR）", "1101110", "ddddccc", INK)
    assert a1 == a2 == "000" and b1 != b2
    o.append(T(20, 184, "余りは 000 のまま → 増えた 0 に気づけない", "start", 11.5, ALI, True))
    o.append(T(400, 184, "余り 111（決まった値）が 101 に変わる → 気づける", "start", 11.5, SIG, True))
    return SVG(760, 200, o, "g = x³+x+1、データ 1101 の場合。受信者がビット列全体を g で割って検査するとき、"
               "xorout が無いと、正しい符号語の後ろに 0 が増えても余りは 0 のままである。")
F["e09_xorout"] = _f09_xorout()


# ---------------------------------------------------------------- 7 節
# 18. 改ざんして CRC を合わせる
def _f09_forge():
    import zlib
    m, mp = b"PAY 100", b"PAY 900"
    D = bytes(a ^ b for a, b in zip(m, mp))
    c = zlib.crc32(m)
    P = zlib.crc32(D) ^ zlib.crc32(bytes(len(m)))
    assert c ^ P == zlib.crc32(mp)
    o = []
    bw = 46
    X = 200

    def frame(y, data, crcv, title, sts, cst):
        o.append(T(X - 14, y + 22, title, "end", 12, INK, True))
        for i, ch in enumerate(data):
            fl, cc, tc, b = _ST9[sts[i]]
            o.append(RECT(X + i * bw, y, bw - 3, 34, 4, fl, cc, 1.3))
            o.append(T(X + i * bw + (bw - 3) / 2, y + 22, ch, "middle", 12.5, tc, b, True))
        fl, cc, tc, b = _ST9[cst]
        o.append(RECT(X + 7 * bw + 10, y, 116, 34, 4, fl, cc, 1.5))
        o.append(T(X + 7 * bw + 68, y + 22, crcv, "middle", 12.5, tc, True, True))

    o.append(T(X + 3.5 * bw, 20, "データ（7 バイト）", "middle", 11, MUT))
    o.append(T(X + 7 * bw + 68, 20, "CRC-32 の値", "middle", 11, MUT))
    frame(30, ["P", "A", "Y", "␣", "1", "0", "0"], "%08X" % c, "元のフレーム", "ddddddd", "c")
    frame(92, ["00", "00", "00", "00", "08", "00", "00"], "%08X" % P, "攻撃者が XOR する値", "zzzzezz", "e")
    o.append(W(X - 4, 138, X + 7 * bw + 126, 138, c=INK, lw=1.4))
    frame(146, ["P", "A", "Y", "␣", "9", "0", "0"], "%08X" % (c ^ P), "書き換えたフレーム", "ddddedd", "c")
    o.append(T(X + 4 * bw + (bw - 3) / 2, 88, "Δ", "middle", 11, ALI, True))
    o.append(T(X + 7 * bw + 68, 88, "P = CRC(Δ) ⊕ CRC(0⋯0)", "middle", 10.5, ALI, True))
    o.append(T(20, 214, "P = %08X ⊕ %08X = %08X は、Δ と長さ（7 バイト）だけから計算でき、元のデータは使わない。"
               % (zlib.crc32(D), zlib.crc32(bytes(len(m))), P), "start", 11.5, INK))
    o.append(T(20, 236, "受信者が計算する CRC(\"PAY 900\") = %08X は付いている値と一致し、改ざんに気づけない。"
               % zlib.crc32(mp), "start", 11.5, ALI, True))
    return SVG(760, 250, o, "CRC-32（Ethernet・ZIP と同じパラメータ）での例。'1'（0x31）を '9'（0x39）に変えるので、"
               "Δ はその位置だけ 0x08 である。␣ は空白文字。")
F["e09_forge"] = _f09_forge()


# 19. WEP: 暗号化しても CRC が合わせられる
def _f09_wep():
    o = []
    X = 196
    wd, wc = 250, 250

    def box(x, y, w, t, st):
        fl, cc, tc, bb = _ST9[st]
        o.append(RECT(x, y, w, 34, 5, fl, cc, 1.4))
        o.append(T(x + w / 2, y + 22, t, "middle", 12, tc, bb, True))

    def row(y, lab, a, b, sa, sb):
        o.append(T(X - 14, y + 22, lab, "end", 12, INK, True))
        if b is None:
            box(X, y, wd + 6 + wc, a, sa)
        else:
            box(X, y, wd, a, sa)
            box(X + wd + 6, y, wc, b, sb)

    o.append(T(X + wd / 2, 14, "データ", "middle", 10.5, MUT))
    o.append(T(X + wd + 6 + wc / 2, 14, "CRC-32 の値", "middle", 10.5, MUT))
    row(22, "平文", "m", "CRC(m)", "d", "c")
    row(66, "⊕ 鍵ストリーム", "Z（鍵から RC4 で作ったビット列）", None, "z", "z")
    o.append(W(X - 4, 108, X + wd + wc + 10, 108, c=INK, lw=1.3))
    row(116, "暗号文（送られる）", "m ⊕ Z", "CRC(m) ⊕ Z", "n", "n")
    row(160, "⊕ 攻撃者が XOR", "Δ", "P = CRC(Δ) ⊕ CRC(0⋯0)", "e", "e")
    o.append(W(X - 4, 202, X + wd + wc + 10, 202, c=INK, lw=1.3))
    row(210, "受信者が復号（⊕ Z）", "m ⊕ Δ", "CRC(m) ⊕ P = CRC(m ⊕ Δ)", "d", "c")
    o.append(T(20, 270, "攻撃者は鍵も Z も m も知らないが、XOR は順番を入れ替えられるので、暗号文に Δ と P を XOR すると、",
               "start", 11.5, INK))
    o.append(T(20, 290, "復号された平文は m ⊕ Δ になり、その CRC も合った状態で届く → 受信者の検査を通る。", "start", 11.5, ALI, True))
    return SVG(760, 306, o, "WEP の構成。データと CRC-32 の値を、鍵から作ったビット列 Z との XOR で暗号化していた。")
F["e09_wep"] = _f09_wep()
