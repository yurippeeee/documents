# 08 章 ハミング符号 の図（figures.py の関数・定数をそのまま使う）
import math as _m8

_BL8 = "var(--blue)"
_BS8 = "rgba(47,111,158,.14)"

_ST8 = {
    "n": (PAN, LIN, INK, False),       # ふつう
    "i": (SSOFT, SIG, INK, False),     # 情報ビット
    "p": (_BS8, _BL8, INK, False),     # 検査ビット
    "e": (ASOFT, ALI, ALI, True),      # 誤り・注意（赤）
    "h": (SSOFT, SIG, SIG, True),      # 強調（緑）
    "b": (_BS8, _BL8, _BL8, True),     # 強調（青）
    "f": (SCR, LIN, FNT, False),       # 薄く
}

_H8 = ["0001111", "0110011", "1010101"]     # 第 i 列 = i の 2 進表現（上から 4 の位、2 の位、1 の位）
_CHK8 = {1, 2, 4}                            # 検査ビットの位置


def _xor8(a, b):
    return "".join("1" if x != y else "0" for x, y in zip(a, b))


def _w8(a):
    return a.count("1")


def _syn8(r):
    return "".join(str(sum(int(x) & int(y) for x, y in zip(r, h)) % 2) for h in _H8)


def _flip8(s, i):
    """位置 i（1 始まり）のビットを反転"""
    return s[:i - 1] + ("1" if s[i - 1] == "0" else "0") + s[i:]


def _sty8(i):
    return "p" if i in _CHK8 else "i"


def _bx8(x, y, s, cw=24, ch=24, sty=None, sz=12.5):
    o = []
    for i, b in enumerate(s):
        k = "n"
        if isinstance(sty, str):
            k = sty[i] if i < len(sty) and sty[i] != " " else "n"
        elif isinstance(sty, dict):
            k = sty.get(i, "n")
        fl, c, tc, bd = _ST8[k]
        o.append(RECT(x + i * cw, y, cw - 3, ch, 4, fl, c, 1.3))
        o.append(T(x + i * cw + (cw - 3) / 2, y + ch / 2 + sz * 0.36, b, "middle", sz, tc, bd, True))
    return "".join(o)


def _mx8(x, y, rows, cw=24, rh=24, sz=13, cell=None):
    m, n = len(rows), len(rows[0])
    o = []
    for r, row in enumerate(rows):
        for j, b in enumerate(row):
            k = cell(r, j) if cell else None
            if k:
                fl, c, tc, bd = _ST8[k]
                o.append(RECT(x + j * cw + 1.5, y + r * rh + 1.5, cw - 3, rh - 3, 3, fl, c, 1.1))
            else:
                tc, bd = INK, False
            o.append(T(x + j * cw + cw / 2, y + r * rh + rh / 2 + sz * 0.36, b, "middle", sz, tc, bd, True))
    h = m * rh
    o.append(PL([(x + 3, y - 3), (x - 3, y - 3), (x - 3, y + h + 3), (x + 3, y + h + 3)], INK, 1.5))
    xr = x + n * cw
    o.append(PL([(xr - 3, y - 3), (xr + 3, y - 3), (xr + 3, y + h + 3), (xr - 3, y + h + 3)], INK, 1.5))
    return "".join(o)


# ---- ベン図: 3 つの円 = 3 本の検査式。7 つの領域 = 7 つの位置 ----
def _venn_geo8(cx, cy, R):
    d = 0.58 * R
    cen = {1: (cx - 0.866 * d, cy - 0.5 * d), 2: (cx + 0.866 * d, cy - 0.5 * d), 4: (cx, cy + d)}
    # 領域（位置 i）の中心: i のビット = どの円に入るか
    ang = {1: 150, 2: 30, 4: 270, 3: 90, 5: 210, 6: 330}
    pos = {7: (cx, cy)}
    for i, a in ang.items():
        t = 1.08 * R if i in (1, 2, 4) else 0.74 * R
        pos[i] = (cx + t * _m8.cos(_m8.radians(a)), cy - t * _m8.sin(_m8.radians(a)))
    return cen, pos


def _venn8(cx, cy, R, word=None, circ=None, mark=None, lab=True):
    """word: 7 ビット（位置 1..7）。circ: {1/2/4: 'ok'|'ng'|None}。mark: 赤で強調する位置の集合"""
    cen, pos = _venn_geo8(cx, cy, R)
    o = []
    names = {1: "1 の位", 2: "2 の位", 4: "4 の位"}
    for k in (1, 2, 4):
        x, y = cen[k]
        st = (circ or {}).get(k)
        if st == "ng":
            o.append(CIRC(x, y, R, ALI, 2.4, ASOFT))
        elif st == "ok":
            o.append(CIRC(x, y, R, SIG, 2.0, "none"))
        else:
            o.append(CIRC(x, y, R, MUT, 1.6, "none"))
    for k in (1, 2, 4):
        x, y = cen[k]
        st = (circ or {}).get(k)
        c = ALI if st == "ng" else (SIG if st == "ok" else MUT)
        if lab:
            if k == 1:
                o.append(T(x - R * 0.78, y - R * 0.82, names[k], "end", 12, c, True))
            elif k == 2:
                o.append(T(x + R * 0.78, y - R * 0.82, names[k], "start", 12, c, True))
            else:
                o.append(T(x + R * 0.92, y + R * 0.78, names[k], "start", 12, c, True))
    for i in range(1, 8):
        x, y = pos[i]
        k = "e" if mark and i in mark else _sty8(i)
        fl, c, tc, bd = _ST8[k]
        if word is None:
            o.append(RECT(x - 17, y - 13, 34, 26, 6, fl, c, 1.4))
            o.append(T(x, y + 5, "c%s" % "₁₂₃₄₅₆₇"[i - 1], "middle", 13, tc, True, True))
        else:
            o.append(RECT(x - 15, y - 16, 30, 30, 6, fl, c, 1.5 if k != "e" else 2.2))
            o.append(T(x, y + 5, word[i - 1], "middle", 15, tc if k == "e" else INK, True, True))
            o.append(T(x + 19, y - 9, str(i), "start", 9.5, MUT))
    return "".join(o)


# 1 節: 3 ビットの列 8 通りから 0 以外の 7 本を並べる
def _f08_columns():
    o = []
    o.append(T(20, 24, "3 ビットの列は 8 通り。0 の列を除く 7 本を使う", "start", 12.5, INK, True))
    x0, y0, cw, ch = 24, 54, 30, 22
    for v in range(8):
        b = format(v, "03b")
        x = x0 + v * 34
        for r in range(3):
            o.append(RECT(x, y0 + r * ch, cw - 4, ch - 3, 3, SCR if v == 0 else PAN, LIN, 1.2))
            o.append(T(x + (cw - 4) / 2, y0 + r * ch + 14, b[r], "middle", 12, FNT if v == 0 else INK, False, True))
        o.append(T(x + (cw - 4) / 2, y0 + 3 * ch + 18, str(v), "middle", 12, FNT if v == 0 else SIG, True))
    o.append(W(x0 - 4, y0 - 4, x0 + cw, y0 + 3 * ch, c=ALI, lw=2.2))
    o.append(W(x0 + cw, y0 - 4, x0 - 4, y0 + 3 * ch, c=ALI, lw=2.2))
    o.append(T(x0 + 13, y0 + 3 * ch + 38, "0 の列は", "middle", 10.5, ALI))
    o.append(T(x0 + 13, y0 + 3 * ch + 52, "使えない", "middle", 10.5, ALI))
    o.append(T(x0 + 4.5 * 34 + 10, y0 + 3 * ch + 42, "下の数 = 列を 2 進数として読んだ値", "middle", 10.5, MUT))
    o.append(ARR(300, y0 + 33, 352, y0 + 33, MUT, 1.6))
    hx = 450
    o.append(T(hx + 3.5 * 30, 24, "H（第 i 列 = i の 2 進表現）", "middle", 12.5, INK, True))
    for j in range(7):
        o.append(T(hx + j * 30 + 15, y0 - 8, str(j + 1), "middle", 11.5, SIG, True))
    for r, nm in enumerate(["4 の位", "2 の位", "1 の位"]):
        o.append(T(hx - 12, y0 + r * 26 + 18, nm, "end", 11, MUT))
    o.append(_mx8(hx, y0, _H8, 30, 26, 13.5))
    o.append(T(20, 206, "どの列も 0 でなく、互いに異なる。3 行で作れる 0 でない列はこの 7 本しかないので、"
               "符号長 n = 7 が最大である。", "start", 11.5, INK))
    return SVG(720, 220, o, "検査ビットが m = 3 個のとき。H の列には、0 でない 3 ビットの列を 1 本ずつ、"
               "2 進数として読んだ値の順に並べる。")
F["e08_columns"] = _f08_columns()


# 1 節: 07 章の H = [P^T | I_3] と、この章の H は列の並べ方だけが違う
def _f08_perm():
    o = []
    H07 = ["1101100", "1011010", "0111001"]
    cols07 = ["".join(h[j] for h in H07) for j in range(7)]
    val = [int(c, 2) for c in cols07]
    cw = 40
    xa, ya = 200, 50
    xb, yb = 200, 196
    o.append(T(20, ya + 40, "07 章の H", "start", 12.5, INK, True))
    o.append(T(20, ya + 58, "[Pᵀ | I₃]", "start", 11.5, MUT, False, True))
    o.append(T(20, yb + 40, "この章の H", "start", 12.5, INK, True))
    o.append(T(20, yb + 58, "第 i 列 = i", "start", 11.5, MUT))
    for j in range(7):
        o.append(T(xa + j * cw + cw / 2, ya - 10, "位置 %d" % (j + 1), "middle", 10, MUT))
        o.append(T(xb + j * cw + cw / 2, yb + 3 * 22 + 20, "位置 %d" % (j + 1), "middle", 10, MUT))
    hl = 0   # 強調する対応（07 章の位置 1 → この章の位置 6）
    for j in range(7):
        x1, y1 = xa + j * cw + cw / 2, ya + 3 * 22 + 18
        x2, y2 = xb + (val[j] - 1) * cw + cw / 2, yb - 6
        o.append(W(x1, y1 + 4, x2, y2, c=ALI if j == hl else FNT, lw=2 if j == hl else 1.2))
        o.append(T(x1, y1 + 2, "= %d" % val[j], "middle", 11, ALI if j == hl else SIG, True))
    o.append(_mx8(xa, ya, H07, cw, 22, 13, lambda r, j: "e" if j == hl else None))
    o.append(_mx8(xb, yb, _H8, cw, 22, 13, lambda r, j: "e" if j == val[hl] - 1 else None))
    o.append(T(xa + 7 * cw + 24, ya + 30, "列を 2 進数として", "start", 11, MUT))
    o.append(T(xa + 7 * cw + 24, ya + 46, "読んだ値（緑）", "start", 11, MUT))
    o.append(T(20, 300, "同じ 7 本の列を、値の小さい順に並べ替えただけである。たとえば 07 章の位置 1 の列 110 は、"
               "この章では位置 6 に来る。", "start", 11.5, INK))
    return SVG(720, 316, o, "列の並べ替えは、符号語のビットの位置の入れ替えに当たる。距離は「違う位置の個数」なので、"
               "位置を入れ替えても最小距離などの性質は変わらない。")
F["e08_perm"] = _f08_perm()


# 1 節: ベン図 — 3 本の検査式がどの位置を受け持つか
def _f08_venn():
    o = []
    o.append(_venn8(200, 166, 92))
    x0 = 420
    o.append(T(x0, 60, "各円が H の 1 行（検査式 1 本）に当たる", "start", 12, INK, True))
    eqs = [("1 の位:", "c₁ ⊕ c₃ ⊕ c₅ ⊕ c₇ = 0"),
           ("2 の位:", "c₂ ⊕ c₃ ⊕ c₆ ⊕ c₇ = 0"),
           ("4 の位:", "c₄ ⊕ c₅ ⊕ c₆ ⊕ c₇ = 0")]
    for k, (a, b) in enumerate(eqs):
        o.append(T(x0, 94 + k * 26, a, "start", 12, MUT, True))
        o.append(T(x0 + 56, 94 + k * 26, b, "start", 12.5, INK, False, True))
    o.append(T(x0, 186, "位置 i が入る円 = i の 2 進表現の 1 の桁", "start", 11.5, INK))
    o.append(T(x0, 206, "（例: 5 = 101₂ は 4 の位と 1 の位の円）", "start", 11.5, MUT))
    o.append(T(x0, 236, "どの円の中でも 1 の個数が偶数 ⇔ 符号語", "start", 11.5, SIG, True))
    o.append(RECT(x0, 260, 26, 20, 5, _BS8, _BL8, 1.4))
    o.append(T(x0 + 34, 275, "検査ビット c₁, c₂, c₄（円 1 つだけに入る）", "start", 11, INK))
    o.append(RECT(x0, 288, 26, 20, 5, SSOFT, SIG, 1.4))
    o.append(T(x0 + 34, 303, "情報ビット c₃, c₅, c₆, c₇", "start", 11, INK))
    return SVG(740, 322, o, "(7, 4) ハミング符号の 3 本の検査式を、3 つの円で表した。"
               "7 つの領域が 7 つの位置に当たり、各位置は 2 進表現で 1 が立つ桁の円に入る。")
F["e08_venn"] = _f08_venn()


# 1 節: 符号化の例 — 情報ビット 1010 から検査ビットを決める
def _f08_encode():
    o = []
    c = "1011010"
    o.append(_venn8(190, 154, 88, c))
    x0 = 400
    o.append(T(x0, 44, "① 情報ビットを位置 3, 5, 6, 7 に置く", "start", 12, INK, True))
    o.append(T(x0 + 18, 66, "(c₃, c₅, c₆, c₇) = (1, 0, 1, 0)", "start", 12, SIG, False, True))
    o.append(T(x0, 102, "② 各円の 1 の個数が偶数になるよう", "start", 12, INK, True))
    o.append(T(x0 + 18, 120, "検査ビットを決める", "start", 12, INK, True))
    steps = [("c₁ = c₃ ⊕ c₅ ⊕ c₇ = 1 ⊕ 0 ⊕ 0 = 1", "1 の位"),
             ("c₂ = c₃ ⊕ c₆ ⊕ c₇ = 1 ⊕ 1 ⊕ 0 = 0", "2 の位"),
             ("c₄ = c₅ ⊕ c₆ ⊕ c₇ = 0 ⊕ 1 ⊕ 0 = 1", "4 の位")]
    for k, (t, nm) in enumerate(steps):
        o.append(T(x0 + 18, 146 + k * 24, t, "start", 12, _BL8, False, True))
    o.append(T(x0, 236, "③ 符号語", "start", 12, INK, True))
    o.append(_bx8(x0 + 70, 220, c, 26, 26, "".join(_sty8(i) for i in range(1, 8)), 13.5))
    for i in range(7):
        o.append(T(x0 + 70 + i * 26 + 11.5, 262, str(i + 1), "middle", 10, MUT))
    o.append(T(x0, 292, "どの円の中も 1 が偶数個（2 個）になっている", "start", 11.5, SIG, True))
    return SVG(740, 310, o, "情報ビット (c₃, c₅, c₆, c₇) = (1, 0, 1, 0) の符号化。各領域の右上の小さい数字が位置。"
               "検査ビット（青）は 1 つの円にしか入らないので、その円の偶奇だけで決まる。")
F["e08_encode"] = _f08_encode()


# 2 節: 1 ビット誤りのシンドロームは位置の 2 進表現
def _f08_syn7():
    o = []
    o.append(T(20, 24, "誤りが 1 か所のとき、s = eHᵀ は H のその位置の列", "start", 12.5, INK, True))
    heads = [(20, "誤りの位置"), (130, "誤りパターン e"), (348, "s = eHᵀ"), (446, "2 進数として読む")]
    for x, t in heads:
        o.append(T(x, 52, t, "start", 11.5, MUT, True))
    for i in range(0, 8):
        y = 62 + i * 28
        e = "".join("1" if j == i else "0" for j in range(1, 8))
        s = _syn8(e)
        o.append(T(54, y + 16, "なし" if i == 0 else str(i), "middle", 12.5, INK, True))
        o.append(_bx8(130, y, e, 26, 22, "".join("e" if b == "1" else "f" for b in e), 12))
        o.append(T(320, y + 16, "→", "middle", 13, MUT))
        o.append(_bx8(348, y, s, 26, 22, "hhh" if i else "fff", 12))
        o.append(T(446, y + 16, "%s₂ = %d" % (s, int(s, 2)), "start", 12.5, SIG if i else MUT, bool(i), True))
    o.append(T(560, 130, "読んだ値が", "start", 12, INK))
    o.append(T(560, 150, "そのまま", "start", 12, INK))
    o.append(T(560, 170, "誤りの位置", "start", 12, SIG, True))
    return SVG(700, 292, o, "(7, 4) ハミング符号のシンドローム表。1 ビット誤り 7 通りと誤りなしで、"
               "3 ビットのシンドローム 8 通りをちょうど使い切る。")
F["e08_syn7"] = _f08_syn7()


# 2 節: 復号例 — 外れた円から誤りの位置を特定する
def _f08_locate():
    o = []
    r = "1011110"
    circ = {1: "ng", 2: "ok", 4: "ng"}
    o.append(_venn8(190, 154, 88, r, circ, {5}))
    x0 = 400
    o.append(T(x0, 40, "受信語 r = 1011110（位置 5 が反転）", "start", 12, INK, True))
    rows = [("4 の位:", "r₄ ⊕ r₅ ⊕ r₆ ⊕ r₇ = 1 ⊕ 1 ⊕ 1 ⊕ 0 = 1", True),
            ("2 の位:", "r₂ ⊕ r₃ ⊕ r₆ ⊕ r₇ = 0 ⊕ 1 ⊕ 1 ⊕ 0 = 0", False),
            ("1 の位:", "r₁ ⊕ r₃ ⊕ r₅ ⊕ r₇ = 1 ⊕ 1 ⊕ 1 ⊕ 0 = 1", True)]
    for k, (a, b, ng) in enumerate(rows):
        y = 70 + k * 40
        o.append(T(x0, y, a, "start", 12, ALI if ng else SIG, True))
        o.append(T(x0 + 54, y, b, "start", 11.5, INK, False, True))
        o.append(T(x0 + 54, y + 17, "奇数 → 円が外れる" if ng else "偶数 → 円は合っている", "start", 10.5,
                   ALI if ng else SIG))
    o.append(T(x0, 206, "s = (4 の位, 2 の位, 1 の位) = 101₂ = 5", "start", 12.5, INK, True, True))
    o.append(T(x0, 232, "外れた円（1 の位・4 の位）の中にあり、", "start", 11.5, INK))
    o.append(T(x0, 250, "合っている円（2 の位）の外にある領域は位置 5 だけ", "start", 11.5, INK))
    o.append(T(x0, 278, "→ 位置 5 を反転して 1011010 に戻す", "start", 12, SIG, True))
    return SVG(740, 300, o, "シンドロームの各ビットは、各円の中の 1 の個数の偶奇である。外れた円の組み合わせが、"
               "誤った位置の 2 進表現になっている。")
F["e08_locate"] = _f08_locate()


# 2 節: 1 ビット誤りなら直り、2 ビット誤りでは別の符号語に「訂正」してしまう
def _f08_miscorrect():
    o = []
    c = "1011010"

    def col(x0, title, tc, errs, verdict, vc):
        o.append(T(x0, 24, title, "start", 12.5, tc, True))
        e = "".join("1" if i in errs else "0" for i in range(1, 8))
        r = _xor8(c, e)
        s = _syn8(r)
        p = int(s, 2)
        out = _flip8(r, p) if p else r
        lines = [("送った c", c, None), ("受信語 r", r, {i - 1: "e" for i in errs}),
                 ("s = %s₂ = %d → 位置 %d を反転" % (s, p, p), None, None),
                 ("復号の結果", out, {i: ("e" if out[i] != c[i] else "b") for i in range(7) if out[i] != c[i] or i == p - 1})]
        y = 44
        for lab, bits, st in lines:
            if bits is None:
                o.append(T(x0, y + 16, lab, "start", 12, INK, True, True))
                y += 30
                continue
            o.append(T(x0, y + 16, lab, "start", 11.5, MUT, True))
            o.append(_bx8(x0 + 84, y, bits, 26, 24, st, 13))
            y += 34
        o.append(T(x0, y + 14, verdict, "start", 12, vc, True))
        return out

    col(20, "1 ビット誤り（位置 5）", SIG, {5}, "c に戻る → 訂正できた", SIG)
    out = col(390, "2 ビット誤り（位置 1, 2）", ALI, {1, 2}, "c と 3 か所違う別の符号語になる", ALI)
    o.append(T(390, 212, "誤りが 2 個から 3 個に増えた（誤訂正）", "start", 11.5, ALI))
    return SVG(740, 226, o, "c = 1011010 を送った場合。2 ビット誤りのシンドロームは 2 本の列の XOR "
               "001 ⊕ 010 = 011 で、1 ビット誤りの位置 3 と区別できない。")
F["e08_miscorrect"] = _f08_miscorrect()


# 3 節: 128 語を 16 個の球に分ける（標準配列の一部）
def _f08_array():
    o = []
    allw = [format(v, "07b") for v in range(128)]
    C = [w for w in allw if _syn8(w) == "000"]
    show = [C[0], C[1], C[2], C[3], None, C[15]]
    cw, bw = 80, 9.4
    x0, y0 = 104, 62
    o.append(T(20, 22, "各行 = 1 つの符号語を中心とする半径 1 の球（8 語）。各列 = 誤りの位置 = シンドローム", "start", 12, INK, True))
    o.append(T(x0 + 34, 46, "誤りなし", "middle", 10.5, _BL8, True))
    for j in range(1, 8):
        o.append(T(x0 + j * cw + 34, 40, "位置 %d" % j, "middle", 10.5, MUT, True))
        o.append(T(x0 + j * cw + 34, 53, "s = %s" % format(j, "03b"), "middle", 9.5, MUT, False, True))
    o.append(T(20, 46, "符号語", "start", 10.5, _BL8, True))
    for r, cwd in enumerate(show):
        y = y0 + r * 26
        if cwd is None:
            for j in range(8):
                o.append(T(x0 + j * cw + 34, y + 12, "⋮", "middle", 13, MUT, True))
            continue
        o.append(T(20, y + 15, "#%d" % (C.index(cwd) + 1), "start", 11, MUT))
        for j in range(8):
            wd = cwd if j == 0 else _flip8(cwd, j)
            bx = x0 + j * cw
            o.append(RECT(bx - 3, y, 74, 21, 4, _BS8 if j == 0 else PAN, _BL8 if j == 0 else LIN, 1.1))
            for i, b in enumerate(wd):
                on = j > 0 and i == j - 1
                o.append(T(bx + 3 + i * bw + 4, y + 15, b, "middle", 11.5, ALI if on else INK, on, True))
    o.append(T(20, y0 + 6 * 26 + 18, "16 行 × 8 列 = 128 = 2⁷ 語。どの 7 ビットの語も、表のちょうど 1 か所に現れる。",
               "start", 11.5, INK))
    o.append(T(20, y0 + 6 * 26 + 38, "受信語の列（= シンドローム）が分かれば、その行の先頭の符号語に訂正すればよい。",
               "start", 11.5, SIG, True))
    return SVG(760, y0 + 6 * 26 + 52, o, "(7, 4) ハミング符号の 128 語の並べ方（16 行のうち 5 行を示す）。"
               "行の先頭が符号語、その右は 1 ビットずつ反転した語（赤が反転した位置）。")
F["e08_array"] = _f08_array()


# 4 節: 全体パリティを付けると重みがすべて偶数になる
def _f08_extw():
    o = []
    o.append(T(20, 24, "(7, 4) の符号語の重み", "start", 12.5, INK, True))
    o.append(T(430, 24, "全体パリティを付けた (8, 4) の重み", "start", 12.5, INK, True))
    rows = [(0, 1, 0, "0000000", "00000000"), (3, 7, 4, "1110000", "11100001"),
            (4, 7, 4, "1011010", "10110100"), (7, 1, 8, "1111111", "11111111")]
    for k, (w0, n, w1, ex0, ex1) in enumerate(rows):
        y = 44 + k * 42
        o.append(RECT(20, y, 200, 32, 8, PAN, LIN, 1.2))
        o.append(T(32, y + 21, "重み %d（%d 個）" % (w0, n), "start", 12, INK, True))
        o.append(T(160, y + 21, ex0, "middle", 11, MUT, False, True))
        o.append(ARR(226, y + 16, 424, y + 16, ALI if w0 % 2 else MUT, 1.6))
        o.append(T(325, y + 9, ("奇数 → 1 を付ける" if w0 % 2 else "偶数 → 0 を付ける"), "middle", 10.5,
                   ALI if w0 % 2 else MUT, w0 % 2 == 1))
        o.append(RECT(430, y, 220, 32, 8, _BS8 if w1 == 4 else PAN, _BL8 if w1 == 4 else LIN, 1.3))
        o.append(T(442, y + 21, "重み %d" % w1, "start", 12, INK, True))
        o.append(T(590, y + 21, ex1, "middle", 11, MUT, False, True))
    o.append(T(20, 228, "0 でない符号語の重みは 3 → 4、4 → 4、7 → 8 となり、最小は 4。拡張した符号も線形なので d_min = 4 である。",
               "start", 11.5, INK))
    return SVG(720, 244, o, "右の例は各重みの符号語の 1 つ。末尾の 1 ビットが追加した全体パリティで、"
               "符号語全体の 1 の個数を偶数にする。")
F["e08_extw"] = _f08_extw()


# 4 節: SECDED の判定（シンドロームと全体の偶奇の 2 × 2）
def _f08_secded():
    o = []
    x0, y0, cw, ch = 170, 56, 260, 76
    o.append(T(x0 + cw / 2, 40, "ハミング部のシンドローム s = 0", "middle", 12, INK, True))
    o.append(T(x0 + cw * 1.5, 40, "s ≠ 0", "middle", 12, INK, True))
    o.append(T(x0 - 12, y0 + ch / 2 - 2, "全体の 1 の個数", "end", 11.5, MUT))
    o.append(T(x0 - 12, y0 + ch / 2 + 16, "偶数", "end", 12.5, INK, True))
    o.append(T(x0 - 12, y0 + ch * 1.5 - 2, "全体の 1 の個数", "end", 11.5, MUT))
    o.append(T(x0 - 12, y0 + ch * 1.5 + 16, "奇数", "end", 12.5, INK, True))
    cells = [(0, 0, "誤り無し", "そのまま受け取る", SIG, SSOFT),
             (1, 0, "2 ビット誤り", "訂正せず、誤りを報告する", ALI, ASOFT),
             (0, 1, "追加したパリティビットの誤り", "位置 8 を反転（データは無傷）", _BL8, _BS8),
             (1, 1, "ハミング部の 1 ビット誤り", "シンドロームの位置を反転", _BL8, _BS8)]
    for cx, cy, t1, t2, c, fl in cells:
        x, y = x0 + cx * cw, y0 + cy * ch
        o.append(RECT(x + 4, y + 4, cw - 8, ch - 8, 10, fl, c, 1.6))
        o.append(T(x + cw / 2, y + ch / 2 - 4, t1, "middle", 13, c, True))
        o.append(T(x + cw / 2, y + ch / 2 + 16, t2, "middle", 11.5, INK))
    o.append(T(20, y0 + 2 * ch + 26, "1 ビット反転すると全体の 1 の個数の偶奇が変わり、2 ビット反転すると元に戻る。",
               "start", 11.5, INK))
    o.append(T(20, y0 + 2 * ch + 46, "「s ≠ 0 なのに偶数」は 1 ビット誤りでは起きないので、2 ビット誤りと判断できる。",
               "start", 11.5, INK))
    return SVG(720, y0 + 2 * ch + 60, o, "拡張ハミング符号 (8, 4) の受信語の判定。誤りが 2 個以下なら、"
               "4 つの欄のどれに入るかで状況が 1 つに決まる。")
F["e08_secded"] = _f08_secded()


# 4 節: ECC メモリの (72, 64) — 拡張ハミング符号 (128, 120) を短縮する
def _f08_ecc():
    o = []
    x0, y0, W_ = 20, 54, 680
    u = W_ / 128.0
    segs = [(56, "常に 0 とみなして送らない 56 ビット", SCR, LIN, FNT),
            (64, "データ 64 ビット", SSOFT, SIG, INK),
            (8, "検査 8", _BS8, _BL8, INK)]
    o.append(T(20, 30, "拡張ハミング符号 (128, 120): 情報ビット 120 + 検査ビット 8（m = 7 の 7 ビットと全体パリティ 1 ビット）",
               "start", 12, INK, True))
    x = x0
    for n, t, fl, c, tc in segs:
        o.append(RECT(x, y0, n * u - 2, 40, 6, fl, c, 1.4, "4,3" if fl == SCR else None))
        o.append(T(x + (n * u - 2) / 2, y0 + 25, t, "middle", 11.5, tc, fl != SCR))
        x += n * u
    o.append(DIM(x0 + 56 * u, y0 + 58, x0 + W_ - 2, y0 + 58, None, SIG))
    o.append(T(x0 + (56 + 36) * u, y0 + 78, "送るのは 72 ビット → (72, 64) 符号", "middle", 12, SIG, True))
    o.append(T(20, y0 + 110, "送らない位置はいつも 0 なので、短縮した符号の符号語は、元の符号語から 0 の位置を取り除いたものである。",
               "start", 11.5, INK))
    o.append(T(20, y0 + 130, "0 を取り除いても重みは変わらないので、最小距離は 4 のまま → 1 ビット訂正・2 ビット検出がそのまま使える。",
               "start", 11.5, INK))
    return SVG(720, y0 + 144, o, "サーバのメモリで典型的な (72, 64) SECDED 符号の作り方の一例。"
               "64 ビットのデータに 8 ビットの検査ビットを付ける。")
F["e08_ecc"] = _f08_ecc()
