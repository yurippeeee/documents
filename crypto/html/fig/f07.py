# 07 章 線形符号 の図（figures.py の関数・定数をそのまま使う）
from itertools import product as _product7

_BL7 = "var(--blue)"
_BS7 = "var(--blue-soft)"

# ビットのマスの見た目: (塗り, 枠, 文字色, 太字)
_ST7 = {
    "n": (PAN, LIN, INK, False),       # ふつう
    "i": (SSOFT, SIG, INK, False),     # 情報ビット
    "p": (_BS7, _BL7, INK, False),     # 検査ビット
    "e": (ASOFT, ALI, ALI, True),      # 誤り・注意（赤）
    "h": (SSOFT, SIG, SIG, True),      # 強調（緑）
    "b": (_BS7, _BL7, _BL7, True),     # 強調（青）
    "f": (SCR, LIN, FNT, False),       # 薄く
}


def _xor7(a, b):
    return "".join("1" if x != y else "0" for x, y in zip(a, b))


def _w7(a):
    return a.count("1")


def _dot7(a, b):
    return sum(int(x) & int(y) for x, y in zip(a, b)) % 2


def _syn7(r, H):
    return "".join(str(_dot7(r, h)) for h in H)


def _bx7(x, y, s, cw=24, ch=24, sty=None, sz=12.5):
    """ビット列を 1 文字 1 マスで描く。sty は位置ごとの見た目の記号列（_ST7 のキー）か {位置: キー}"""
    o = []
    for i, b in enumerate(s):
        k = "n"
        if isinstance(sty, str):
            k = sty[i] if i < len(sty) and sty[i] != " " else "n"
        elif isinstance(sty, dict):
            k = sty.get(i, "n")
        fl, c, tc, bd = _ST7[k]
        o.append(RECT(x + i * cw, y, cw - 3, ch, 4, fl, c, 1.3))
        o.append(T(x + i * cw + (cw - 3) / 2, y + ch / 2 + sz * 0.36, b, "middle", sz, tc, bd, True))
    return "".join(o)


def _mx7(x, y, rows, cw=24, rh=24, sz=13, cell=None, div=None):
    """行列を括弧付きで描く。cell(r, j) は強調するマスの見た目のキーを返す（None ならふつう）。div は縦の区切り線を入れる列の位置"""
    m, n = len(rows), len(rows[0])
    o = []
    for r, row in enumerate(rows):
        for j, b in enumerate(row):
            k = cell(r, j) if cell else None
            if k:
                fl, c, tc, bd = _ST7[k]
                o.append(RECT(x + j * cw + 1.5, y + r * rh + 1.5, cw - 3, rh - 3, 3, fl, c, 1.1))
            else:
                tc, bd = INK, False
            o.append(T(x + j * cw + cw / 2, y + r * rh + rh / 2 + sz * 0.36, b, "middle", sz, tc, bd, True))
    h = m * rh
    if div is not None:
        xx = x + div * cw
        o.append(W(xx, y - 1, xx, y + h + 1, c=MUT, lw=1.2, dash="3,3"))
    o.append(PL([(x + 3, y - 3), (x - 3, y - 3), (x - 3, y + h + 3), (x + 3, y + h + 3)], INK, 1.5))
    xr = x + n * cw
    o.append(PL([(xr - 3, y - 3), (xr + 3, y - 3), (xr + 3, y + h + 3), (xr - 3, y + h + 3)], INK, 1.5))
    return "".join(o)


_C7 = ["00000", "01011", "10101", "11110"]          # 06 章 2 節の (5, 2, 3) 符号
_H7 = ["10100", "01010", "11001"]                    # その検査行列 [P^T | I_3]


# 1 節: XOR で閉じているか（線形な符号と、そうでない符号）
def _f07_closed():
    o = []

    def table(x0, y0, code, title, tc, note):
        o.append(T(x0, y0 - 22, title, "start", 13, tc, True))
        cw, rh = 62, 28
        o.append(T(x0 + cw / 2, y0 + rh / 2 + 5, "⊕", "middle", 15, MUT, True))
        for j, c in enumerate(code):
            o.append(T(x0 + (j + 1) * cw + cw / 2, y0 + rh / 2 + 4.5, c, "middle", 11.5, MUT, True, True))
            o.append(T(x0 + cw / 2, y0 + (j + 1) * rh + rh / 2 + 4.5, c, "middle", 11.5, MUT, True, True))
        for i, a in enumerate(code):
            for j, b in enumerate(code):
                v = _xor7(a, b)
                ok = v in code
                o.append(RECT(x0 + (j + 1) * cw + 3, y0 + (i + 1) * rh + 3, cw - 6, rh - 6, 4,
                              _BS7 if ok else ASOFT, _BL7 if ok else ALI, 1.1))
                o.append(T(x0 + (j + 1) * cw + cw / 2, y0 + (i + 1) * rh + rh / 2 + 4.5, v, "middle", 11.5,
                           INK if ok else ALI, not ok, True))
        o.append(W(x0 + cw, y0 + 3, x0 + cw, y0 + 5 * rh, c=LIN, lw=1.2))
        o.append(W(x0 + 4, y0 + rh, x0 + 5 * cw, y0 + rh, c=LIN, lw=1.2))
        o.append(T(x0, y0 + 5 * rh + 24, note, "start", 11.5, tc, True))

    table(20, 46, _C7, "06 章の (5, 2, 3) 符号", SIG, "16 欄すべてが符号語 → 線形符号")
    table(390, 46, ["00000", "01011", "10101", "11111"], "最後の 1 語を 11111 に変えた符号", ALI,
          "赤の 6 欄は符号語でない → 線形符号でない")
    return SVG(720, 222, o, "各欄は、その行の語と列の語の XOR。左の符号はどの組の XOR も符号語になる。"
               "右の符号では 01011 ⊕ 10101 = 11110 などが、符号語の中に無い。")
F["e07_closed"] = _f07_closed()


# 1 節: 距離は XOR の重み。XOR が符号語なので、距離の値は符号語の重みの値
def _f07_distw():
    o = []
    pairs = [(a, b) for i, a in enumerate(_C7) for b in _C7[i + 1:]]
    o.append(T(20, 26, "異なる 2 つの符号語（6 組）", "start", 12, INK, True))
    o.append(T(268, 26, "XOR（符号語になる）", "start", 12, INK, True))
    o.append(T(414, 26, "距離 = 重み", "start", 12, INK, True))
    for k, (a, b) in enumerate(pairs):
        y = 40 + k * 30
        o.append(_bx7(20, y, a, 18, 20, None, 11))
        o.append(T(117, y + 15, "と", "middle", 11, MUT))
        o.append(_bx7(130, y, b, 18, 20, None, 11))
        o.append(ARR(226, y + 10, 262, y + 10, MUT, 1.3, 6))
        v = _xor7(a, b)
        o.append(_bx7(270, y, v, 18, 20, "bbbbb", 11))
        o.append(T(414, y + 15, "d = w = %d" % _w7(v), "start", 12, INK, False, True))
    o.append(RECT(500, 36, 210, 150, 10, SCR, LIN, 1.2))
    o.append(T(605, 58, "0 でない符号語の重み", "middle", 12, INK, True))
    for k, c in enumerate(_C7[1:]):
        y = 74 + k * 32
        o.append(_bx7(520, y, c, 18, 20, "bbbbb", 11))
        o.append(T(620, y + 15, "w = %d" % _w7(c), "start", 12, INK, False, True))
    o.append(T(20, 238, "距離として現れる値は {3, 4}、0 でない符号語の重みとして現れる値も {3, 4} で、同じ集合である。",
               "start", 11.5, INK))
    o.append(T(20, 258, "したがって最小値も等しい: d_min = 3 = 0 でない符号語の最小の重み", "start", 11.5, SIG, True))
    return SVG(720, 272, o, "(5, 2, 3) 符号で、6 組の距離を XOR の重みとして求めた。XOR の結果（青）は"
               "どれも 0 でない符号語 3 個のどれかになっている。")
F["e07_distw"] = _f07_distw()


# 2 節: 基底 — 1 本選ぶごとに作れる語が 2 倍になる
def _f07_span():
    o = []
    cw, ch = 20, 24

    def word(x, y, s, sty):
        return _bx7(x, y, s, cw, ch, sty * 5, 12)

    o.append(T(70, 28, "S₀", "middle", 14, INK, True))
    o.append(word(20, 62, "00000", "n"))
    o.append(T(70, 150, "1 個", "middle", 12, MUT, True))
    o.append(ARR(130, 74, 222, 74, MUT, 1.6))
    o.append(T(176, 56, "g₁ = 10101", "middle", 11.5, INK, True, True))
    o.append(T(176, 96, "を選ぶ", "middle", 11, MUT))
    o.append(T(285, 28, "S₁", "middle", 14, INK, True))
    o.append(word(235, 62, "00000", "n"))
    o.append(word(235, 100, "10101", "n"))
    o.append(T(285, 150, "2 個", "middle", 12, MUT, True))
    o.append(ARR(345, 74, 437, 74, MUT, 1.6))
    o.append(T(391, 56, "g₂ = 01011", "middle", 11.5, INK, True, True))
    o.append(T(391, 96, "を選ぶ", "middle", 11, MUT))
    o.append(T(391, 112, "（S₁ に無い語）", "middle", 10.5, MUT))
    o.append(T(578, 28, "S₂ = C", "middle", 14, INK, True))
    o.append(RECT(444, 40, 110, 92, 10, "none", _BL7, 1.3, "5,3"))
    o.append(T(499, 52 + 0, "", "middle", 1, MUT))
    o.append(word(450, 62, "00000", "b"))
    o.append(word(450, 100, "10101", "b"))
    o.append(RECT(600, 40, 110, 92, 10, "none", SIG, 1.3, "5,3"))
    o.append(word(606, 62, "01011", "h"))
    o.append(word(606, 100, "11110", "h"))
    for y in (74, 112):
        o.append(ARR(552, y, 602, y, MUT, 1.3, 6))
    o.append(T(577, 92, "⊕ g₂", "middle", 10.5, MUT, True))
    o.append(T(499, 150, "S₁", "middle", 11.5, _BL7, True))
    o.append(T(655, 150, "g₂ ⊕ S₁", "middle", 11.5, SIG, True))
    o.append(T(578, 172, "4 個 = 2 × 2 個", "middle", 12, MUT, True))
    o.append(T(20, 202, "S₁ の各語に g₂ を XOR した語（右の緑）は、S₁（左の青）と重ならない。重なると g₂ が S₁ に入ってしまうからである。",
               "start", 11.5, INK))
    o.append(T(20, 222, "そのため 1 本選ぶごとに個数がちょうど 2 倍になり、C の 4 個に達したところで止まる。",
               "start", 11.5, INK))
    return SVG(730, 236, o, "(5, 2, 3) 符号で基底を作る様子。S₀, S₁, S₂ は、それまでに選んだ符号語の線形結合"
               "（いくつかを選んで XOR したもの）全体。")
F["e07_span"] = _f07_span()


# 2 節: 組織符号形式 — 行の XOR で左側を単位行列にする
def _f07_systematic():
    o = []
    o.append(T(20, 24, "① 基底 11110, 01011 を並べた G", "start", 12, INK, True))
    o.append(_mx7(40, 50, ["11110", "01011"], 26, 28, 13, lambda r, j: "e" if r == 0 and j < 2 else None))
    o.append(T(40 + 65, 122, "左 2 列が単位行列でない", "middle", 11, ALI))
    o.append(ARR(190, 78, 262, 78, ALI, 1.6))
    o.append(T(226, 64, "第 1 行に", "middle", 11, ALI, True))
    o.append(T(226, 100, "第 2 行を XOR", "middle", 11, ALI, True))
    o.append(T(270, 24, "② 組織符号形式 [ I₂ | P ]", "start", 12, INK, True))
    o.append(_mx7(280, 50, ["10101", "01011"], 26, 28, 13,
                  lambda r, j: "h" if j < 2 and r == j else ("p" if j >= 2 else None), div=2))
    o.append(T(280 + 26, 122, "I₂", "middle", 12, SIG, True))
    o.append(T(280 + 26 * 3.5, 122, "P", "middle", 12, _BL7, True))
    o.append(T(480, 24, "③ 符号語 c = mG = [ m | mP ]", "start", 12, INK, True))
    o.append(T(500, 46, "m", "middle", 11, MUT, True))
    o.append(T(590, 46, "c", "middle", 11, MUT, True))
    for k, m in enumerate(["00", "10", "01", "11"]):
        y = 56 + k * 30
        o.append(_bx7(486, y, m, 18, 22, "ii", 11.5))
        o.append(ARR(526, y + 11, 552, y + 11, MUT, 1.2, 5))
        c = m + {"00": "000", "10": "101", "01": "011", "11": "110"}[m]
        o.append(_bx7(558, y, c, 22, 22, "iippp", 11.5))
    o.append(T(20, 190, "行を入れ替えても、ある行に別の行を XOR しても、行の線形結合全体（符号 C）は変わらない。",
               "start", 11.5, INK))
    o.append(T(20, 210, "元の第 1 行 11110 も、新しい行から 10101 ⊕ 01011 として作れるからである。", "start", 11.5, INK))
    o.append(T(20, 230, "左 2 列が単位行列なら、符号語の前半 2 ビット（緑）は情報語 m、後半 3 ビット（青）は検査ビット mP になる。",
               "start", 11.5, INK))
    return SVG(740, 244, o, "(5, 2, 3) 符号の生成行列を組織符号形式に直す。どの基底から始めても、"
               "行の操作だけで同じ符号の生成行列が得られる。")
F["e07_systematic"] = _f07_systematic()


# 2 節: (7,4) の生成行列で符号化する（m の 1 が立つ行を XOR）
def _f07_encode():
    G = ["1000110", "0100101", "0010011", "0001111"]
    m = "1011"
    o = []
    o.append(T(20, 24, "情報語 m = 1011 の 1 が立つ行（第 1, 3, 4 行）を選ぶ", "start", 12, INK, True))
    x0, y0, cw, rh = 120, 58, 26, 30
    o.append(T(x0 + 2 * cw, 50, "I₄", "middle", 12, SIG, True))
    o.append(T(x0 + 5.5 * cw, 50, "P", "middle", 12, _BL7, True))
    for i, (mi, g) in enumerate(zip(m, G)):
        y = y0 + 4 + i * rh
        on = mi == "1"
        o.append(T(30, y + 17, "m%s = %s" % ("₁₂₃₄"[i], mi), "start", 12.5, SIG if on else FNT, on, True))
        if on:
            o.append(RECT(x0 - 4, y - 1, 7 * cw + 8, rh - 4, 6, SSOFT, SIG, 1.2))
    o.append(_mx7(x0, y0 + 4, G, cw, rh, 13.5,
                  lambda r, j: "f" if m[r] == "0" else None, div=4))
    o.append(T(x0 + 3.5 * cw, y0 + 4 * rh + 26, "G（第 2 行は m₂ = 0 なので使わない）", "middle", 11, MUT))
    # 右: XOR の筆算
    xs, ys = 450, 62
    rows = [("", G[0], "第 1 行"), ("⊕", G[2], "第 3 行"), ("⊕", G[3], "第 4 行")]
    o.append(T(xs + 92, 50, "選んだ行を XOR する", "middle", 12, INK, True))
    for k, (op, g, lab) in enumerate(rows):
        y = ys + k * 30
        o.append(T(xs - 10, y + 17, op, "middle", 15, INK, True))
        o.append(_bx7(xs, y, g, 26, 24, None, 13))
        o.append(T(xs + 7 * 26 + 8, y + 17, lab, "start", 11, MUT))
    o.append(W(xs - 18, ys + 3 * 30 + 2, xs + 7 * 26, ys + 3 * 30 + 2, c=INK, lw=1.6))
    c = _xor7(_xor7(G[0], G[2]), G[3])
    o.append(_bx7(xs, ys + 3 * 30 + 10, c, 26, 26, "iiiippp", 13.5))
    o.append(T(xs + 7 * 26 + 8, ys + 3 * 30 + 28, "= c", "start", 12.5, INK, True))
    o.append(T(xs + 2 * 26 - 1, ys + 3 * 30 + 54, "情報語 1011", "middle", 11, SIG, True))
    o.append(T(xs + 5.5 * 26 - 1, ys + 3 * 30 + 54, "検査ビット", "middle", 11, _BL7, True))
    return SVG(740, 228, o, "(7, 4) ハミング符号の生成行列による符号化。各位置ごとに、選んだ行の"
               "ビットの XOR を取る。左 4 列が単位行列なので、符号語の前半 4 ビットに情報語がそのまま現れる。")
F["e07_encode"] = _f07_encode()


# 3 節: 検査ビットの決め方を「= 0」の式にして、係数を並べると H
def _f07_checks():
    o = []
    o.append(T(20, 24, "(5, 2, 3) 符号: c = [ m | mP ] より c₁ = m₁、c₂ = m₂、検査ビットは c₃ = c₁、c₄ = c₂、c₅ = c₁ ⊕ c₂",
               "start", 12, INK, True))
    x0, y0, cw, rh = 384, 72, 32, 34
    for j in range(5):
        o.append(T(x0 + j * cw + cw / 2, y0 - 10, str(j + 1), "middle", 11, MUT, True))
    o.append(T(x0 - 12, y0 - 10, "位置", "end", 11, MUT))
    eqs = [("c₃ = c₁", "c₁ ⊕ c₃ = 0"), ("c₄ = c₂", "c₂ ⊕ c₄ = 0"), ("c₅ = c₁ ⊕ c₂", "c₁ ⊕ c₂ ⊕ c₅ = 0")]
    for r, ((a, b), h) in enumerate(zip(eqs, _H7)):
        y = y0 + r * rh
        o.append(T(30, y + 21, a, "start", 13, INK, False, True))
        o.append(ARR(142, y + 16, 172, y + 16, MUT, 1.3, 6))
        o.append(T(182, y + 21, b, "start", 13, INK, True, True))
        o.append(ARR(332, y + 16, 370, y + 16, MUT, 1.3, 6))
        sty = "".join(("i" if j < 2 else "p") if h[j] == "1" else "f" for j in range(5))
        o.append(_bx7(x0, y + 3, h, cw, 26, sty, 13))
        o.append(T(x0 + 5 * cw + 14, y + 21, "H の第 %d 行" % (r + 1), "start", 11.5, INK, True))
    yb = y0 + 3 * rh + 8
    o.append(PL([(x0 - 2, yb - 4), (x0 - 2, yb + 2), (x0 + 2 * cw - 5, yb + 2), (x0 + 2 * cw - 5, yb - 4)], SIG, 1.4))
    o.append(PL([(x0 + 2 * cw - 1, yb - 4), (x0 + 2 * cw - 1, yb + 2), (x0 + 5 * cw - 5, yb + 2), (x0 + 5 * cw - 5, yb - 4)], _BL7, 1.4))
    o.append(T(x0 + cw - 3, yb + 18, "Pᵀ", "middle", 12, SIG, True))
    o.append(T(x0 + 3.5 * cw - 3, yb + 18, "I₃", "middle", 12, _BL7, True))
    o.append(T(30, yb + 18, "検査ビットの決め方", "start", 11, MUT))
    o.append(T(182, yb + 18, "両辺に右辺を XOR", "start", 11, MUT))
    o.append(T(20, yb + 50, "1 が立つ位置は、その式に入っているビットの位置。受信語がどれかの式を満たさなければ、符号語ではない。",
               "start", 11.5, INK))
    return SVG(740, yb + 64, o, "(5, 2, 3) 符号の検査式と検査行列 H。左の 2 列は P を転置したもの、"
               "右の 3 列は単位行列になる（各式に検査ビットが 1 つずつ入る）。")
F["e07_checks"] = _f07_checks()


# 4 節: シンドロームは誤った位置の H の列の XOR（送った符号語によらない）
def _f07_syncol():
    o = []
    x0, y0, cw, rh = 40, 66, 34, 28
    colsty = {3: "e", 0: "b", 1: "b"}
    o.append(T(x0 + 2.5 * cw, 26, "検査行列 H の列", "middle", 12, INK, True))
    for j in range(5):
        o.append(T(x0 + j * cw + cw / 2, y0 - 10, str(j + 1),
                   "middle", 11.5, ALI if j == 3 else (_BL7 if j < 2 else MUT), j in colsty))
    o.append(T(x0 - 12, y0 - 10, "列", "end", 11, MUT))
    o.append(_mx7(x0, y0, _H7, cw, rh, 14, lambda r, j: colsty.get(j)))
    o.append(T(x0 + 2.5 * cw, y0 + 3 * rh + 28, "赤: 誤りが位置 4 のとき", "middle", 11, ALI, True))
    o.append(T(x0 + 2.5 * cw, y0 + 3 * rh + 46, "青: 誤りが位置 1, 2 のとき", "middle", 11, _BL7, True))
    xc, xe, xr, xs = 262, 362, 462, 562
    heads = [(xc, "送った c"), (xe, "誤り e"), (xr, "受信語 r"), (xs, "s = rHᵀ")]
    for x, t in heads:
        o.append(T(x, 40, t, "start", 11.5, INK, True))
    cases = [("(a)", "01011", "00010", "e", "第 4 列"), ("(b)", "10101", "00010", "e", "第 4 列"),
             ("(c)", "01011", "11000", "b", "第 1 列 ⊕ 第 2 列")]
    for k, (lab, c, e, col, note) in enumerate(cases):
        y = 54 + k * 40
        r = _xor7(c, e)
        s = _syn7(r, _H7)
        o.append(T(244, y + 15, lab, "middle", 11.5, MUT, True))
        o.append(_bx7(xc, y, c, 18, 22, "bbbbb" if False else None, 11.5))
        o.append(_bx7(xe, y, e, 18, 22, "".join(col if b == "1" else "f" for b in e), 11.5))
        o.append(_bx7(xr, y, r, 18, 22, "".join(col if b == "1" else " " for b in e), 11.5))
        o.append(_bx7(xs, y, s, 18, 22, col * 3, 11.5))
        o.append(T(xs + 62, y + 15, "= " + note, "start", 11, ALI if col == "e" else _BL7, True))
    o.append(T(244, 196, "(a) と (b) は送った符号語が違うが、誤りの位置が同じなので s も同じになる。",
               "start", 11.5, INK))
    o.append(T(244, 216, "(c) のように 2 か所が誤ると、s はその 2 本の列の XOR になる。", "start", 11.5, INK))
    return SVG(760, 232, o, "(5, 2, 3) 符号の検査行列 H = [Pᵀ | I₃] で、シンドロームを計算した。"
               "s は、誤りパターン e の 1 が立つ位置の H の列を XOR したものになる。")
F["e07_syncol"] = _f07_syncol()


# 4 節: 同じシンドロームを出す誤りパターンは 2^k 個。重みが最小のものを選ぶ
def _f07_coset():
    o = []
    r = "01001"
    o.append(T(20, 24, "受信語 r = 01001、シンドローム s = 010 のとき、e = r ⊕ c（c は符号語）の 4 通りが考えられる",
               "start", 12, INK, True))
    heads = [(20, "符号語 c"), (128, "e = r ⊕ c"), (240, "重み w(e)"), (320, "e が起きる確率（p = 0.1）")]
    for x, t in heads:
        o.append(T(x, 52, t, "start", 11.5, MUT, True))
    rows = sorted(((_w7(_xor7(r, c)), c) for c in _C7))
    p = 0.1
    for k, (w, c) in enumerate(rows):
        y = 64 + k * 34
        e = _xor7(r, c)
        pr = p ** w * (1 - p) ** (5 - w)
        if k == 0:
            o.append(RECT(12, y - 6, 700, 34, 8, SSOFT, SIG, 1.3))
        o.append(_bx7(20, y, c, 18, 22, "bbbbb", 11.5))
        o.append(_bx7(128, y, e, 18, 22, "".join("e" if b == "1" else "f" for b in e), 11.5))
        o.append(T(262, y + 16, str(w), "middle", 13, INK, True, True))
        o.append(T(320, y + 16, "%.5f" % pr, "start", 12, INK, k == 0, True))
        bw = 220 * pr / 0.06561
        o.append(RECT(390, y + 4, max(bw, 1.5), 14, 2, SIG if k == 0 else MUT, SIG if k == 0 else MUT, 0.5))
        if k == 0:
            o.append(T(620, y + 16, "← これを選ぶ", "start", 11.5, SIG, True))
    o.append(T(20, 214, "重みが 1 増えるごとに確率は p/(1 − p) = 1/9 倍になる。重み最小の e = 00010 が最も起こりやすい。",
               "start", 11.5, INK))
    o.append(T(20, 234, "w(e) = w(r ⊕ c) = d(r, c) なので、これは r にいちばん近い符号語 c = 01011 を選ぶことと同じである。",
               "start", 11.5, SIG, True))
    return SVG(720, 248, o, "(5, 2, 3) 符号で、同じシンドロームを出す誤りパターンを並べた。"
               "確率は、各ビットが独立に確率 p で反転する 2 元対称通信路での値。")
F["e07_coset"] = _f07_coset()


# 4 節: シンドローム復号の流れ（例: m = 01）
def _f07_pipeline():
    o = []

    def box(x, y, name, bits, c, fl, sty):
        o.append(RECT(x, y, 128, 60, 10, fl, c, 1.6))
        o.append(T(x + 64, y + 20, name, "middle", 12, c, True))
        cw = 18
        o.append(_bx7(x + 64 - len(bits) * cw / 2 + 1.5, y + 28, bits, cw, 22, sty, 11.5))

    y1, y2 = 40, 186
    box(20, y1, "情報語 m", "01", SIG, SSOFT, "ii")
    box(296, y1, "符号語 c", "01011", _BL7, _BS7, "iippp")
    box(572, y1, "受信語 r", "01001", ALI, ASOFT, {3: "e"})
    o.append(ARR(150, y1 + 30, 292, y1 + 30, INK, 1.8))
    o.append(T(221, y1 + 22, "c = mG", "middle", 12, INK, True))
    o.append(ARR(426, y1 + 30, 568, y1 + 30, INK, 1.8))
    o.append(T(497, y1 + 22, "通信路", "middle", 12, INK, True))
    o.append(T(497, y1 + 48, "e = 00010 が XOR される", "middle", 10.5, ALI))
    o.append(T(20, y1 - 14, "送信側", "start", 11.5, MUT, True))
    o.append(T(20, y2 - 14, "受信側", "start", 11.5, MUT, True))
    o.append(ARR(636, y1 + 62, 636, y2 - 4, INK, 1.8))
    o.append(T(646, y1 + 104, "s = rHᵀ", "start", 12, INK, True))
    box(572, y2, "シンドローム s", "010", INK, PAN, "nen")
    box(388, y2, "推定した誤り ê", "00010", ALI, ASOFT, {3: "e"})
    box(204, y2, "訂正した符号語 ĉ", "01011", _BL7, _BS7, "iippp")
    box(20, y2, "推定した情報語", "01", SIG, SSOFT, "ii")
    o.append(ARR(570, y2 + 30, 518, y2 + 30, INK, 1.8))
    o.append(T(544, y2 - 6, "表を引く", "middle", 11.5, INK, True))
    o.append(ARR(386, y2 + 30, 334, y2 + 30, INK, 1.8))
    o.append(T(360, y2 - 6, "r ⊕ ê", "middle", 11.5, INK, True))
    o.append(ARR(202, y2 + 30, 150, y2 + 30, INK, 1.8))
    o.append(T(176, y2 - 6, "前半 2 ビット", "middle", 11.5, INK, True))
    return SVG(720, 262, o, "(5, 2, 3) 符号で情報語 01 を送り、位置 4 が反転した場合のシンドローム復号。"
               "受信側は e を知らないが、s から重み最小の ê を表で引いて元に戻す。")
F["e07_pipeline"] = _f07_pipeline()


# 5 節: XOR が 0 になる列の組 ↔ 符号語（良い H と、同じ列を持つ H）
def _f07_dminh():
    o = []

    def panel(x0, H, pick, kind, title, tc, lines):
        o.append(T(x0, 24, title, "start", 12.5, tc, True))
        cw, rh, hx, hy = 34, 26, x0 + 40, 62
        for j in range(5):
            o.append(T(hx + j * cw + cw / 2, hy - 10, str(j + 1), "middle", 11, kind if j in pick else MUT, j in pick))
        o.append(T(hx - 14, hy - 10, "列", "end", 11, MUT))
        o.append(_mx7(hx, hy, H, cw, rh, 14, lambda r, j: ("h" if kind == SIG else "e") if j in pick else None))
        cols = ["".join(h[j] for h in H) for j in range(5)]
        acc = "000"
        for j in pick:
            acc = _xor7(acc, cols[j])
        expr = " ⊕ ".join(cols[j] for j in pick) + " = " + acc
        o.append(T(x0, hy + 3 * rh + 30, "第 " + ", ".join(str(j + 1) for j in pick) + " 列の XOR:", "start", 11.5, INK))
        o.append(T(x0, hy + 3 * rh + 50, expr, "start", 12.5, tc, True, True))
        for k, (t, c, b) in enumerate(lines):
            o.append(T(x0, hy + 3 * rh + 78 + k * 20, t, "start", 11.5, c, b))

    panel(20, _H7, [0, 2, 4], SIG, "(5, 2, 3) 符号の H（列がすべて異なり、0 でない）", SIG,
          [("→ 位置 1, 3, 5 が 1 の 10101 は符号語（重み 3）", INK, False),
           ("1 本や 2 本では XOR が 0 にならない", INK, False),
           ("→ d_min = 3", SIG, True)])
    panel(390, ["00100", "11010", "11001"], [0, 1], ALI, "P の 2 行を同じ 011 にした H（同じ列がある）", ALI,
          [("→ 位置 1, 2 が 1 の 11000 は符号語（重み 2）", INK, False),
           ("位置 1 と位置 2 の誤りはシンドロームが同じ", INK, False),
           ("→ d_min = 2", ALI, True)])
    return SVG(760, 260, o, "XOR すると 0 になる H の列の組は、そのまま重みの等しい符号語に対応する。"
               "その最小の本数が最小距離である。")
F["e07_dminh"] = _f07_dminh()


# 6 節: 単一パリティ検査符号は H の列がすべて同じ
def _f07_parity():
    o = []

    def panel(x0, H, title, tc, note1, note2):
        o.append(T(x0, 24, title, "start", 12.5, tc, True))
        cw, rh = 34, 24
        hx, hy = x0 + 70, 48
        o.append(T(x0, hy + 16 + (len(H) - 1) * rh / 2, "H =", "start", 13, INK, True, True))
        o.append(_mx7(hx, hy, H, cw, rh, 13.5))
        y0 = hy + 3 * rh + 26
        cols = ["".join(h[j] for h in H) for j in range(5)]
        for j in range(5):
            y = y0 + j * 26
            e = "".join("1" if i == j else "0" for i in range(5))
            o.append(T(x0, y + 15, "位置 %d が反転" % (j + 1), "start", 11.5, INK))
            o.append(_bx7(x0 + 100, y, e, 16, 20, "".join("e" if b == "1" else "f" for b in e), 10.5))
            o.append(T(x0 + 192, y + 15, "→ s =", "start", 11.5, INK))
            o.append(_bx7(x0 + 236, y, cols[j], 18, 20, "e" * len(cols[j]) if tc == ALI else "h" * len(cols[j]), 11))
        o.append(T(x0, y0 + 5 * 26 + 18, note1, "start", 11.5, tc, True))
        o.append(T(x0, y0 + 5 * 26 + 38, note2, "start", 11.5, INK))

    panel(20, ["11111"], "単一パリティ検査符号 (5, 4)", ALI,
          "5 か所どれでも s = 1 → 位置が分からない", "2 か所が反転すると s = 0 になり、見逃す")
    panel(400, _H7, "(5, 2, 3) 符号", SIG,
          "位置ごとに s が違う → 位置が分かる", "1 ビットの誤りなら訂正できる")
    return SVG(760, 330, o, "どちらも 1 ビットの誤りのシンドロームは H の列になる。H の列がすべて同じだと、"
               "どこが反転しても同じシンドロームしか出ない。")
F["e07_parity"] = _f07_parity()


# 7 節: 双対符号 — 生成行列と検査行列の役割を入れ替える
def _f07_dual():
    o = []

    def side(x0, title, tc, top, bot, words):
        o.append(RECT(x0, 36, 250, 190, 12, SCR, tc, 1.5))
        o.append(T(x0 + 125, 26, title, "middle", 12.5, tc, True))
        for (nm, M), yc in ((top, 76), (bot, 142)):
            o.append(T(x0 + 18, yc + 4, nm + " =", "start", 12.5, INK, True, True))
            o.append(_mx7(x0 + 64, yc - 12 * len(M), M, 24, 24, 13))
        o.append(T(x0 + 18, 196, "符号語", "start", 11.5, MUT, True))
        o.append(T(x0 + 18, 214, ", ".join(words), "start", 12.5, INK, True, True))

    side(20, "C: 単一パリティ検査符号 (3, 2)", SIG, ("G", ["101", "011"]), ("H", ["111"]), ["000", "011", "101", "110"])
    side(470, "C⊥: 3 回繰り返し符号 (3, 1)", _BL7, ("H", ["101", "011"]), ("G", ["111"]), ["000", "111"])
    o.append(DARR(170, 76, 462, 76, MUT, 1.5))
    o.append(DARR(170, 142, 462, 142, MUT, 1.5))
    o.append(T(370, 66, "C の G = C⊥ の H", "middle", 11.5, INK, True))
    o.append(T(370, 132, "C の H = C⊥ の G", "middle", 11.5, INK, True))
    # 内積の表
    o.append(T(20, 262, "C の符号語と C⊥ の符号語の内積（両方 1 の位置の個数の偶奇）", "start", 12, INK, True))
    A, B = ["000", "011", "101", "110"], ["000", "111"]
    gx, gy = 470, 248
    for j, b in enumerate(B):
        o.append(T(gx + 60 + j * 60, gy, b, "middle", 11.5, _BL7, True, True))
    for i, a in enumerate(A):
        o.append(T(gx, gy + 22 + i * 22, a, "start", 11.5, SIG, True, True))
        for j, b in enumerate(B):
            o.append(T(gx + 60 + j * 60, gy + 22 + i * 22, str(_dot7(a, b)), "middle", 12.5, INK, False, True))
    o.append(T(20, 290, "8 組すべてで 0、つまりどの組も直交する。", "start", 11.5, INK))
    o.append(T(20, 310, "例: 011 と 111 は位置 2, 3 の 2 か所で両方 1 → 偶数なので 0", "start", 11.5, MUT))
    return SVG(740, 344, o, "n = 3 の単一パリティ検査符号 C と、その双対符号 C⊥（3 回繰り返し符号）。"
               "片方の生成行列が、もう片方の検査行列になっている。")
F["e07_dual"] = _f07_dual()
