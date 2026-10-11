# 18 章 ハッシュ関数・MAC・デジタル署名 の図（figures.py の関数・定数をそのまま使う）
# 他章の図ファイルと同じ名前空間で実行されるので、補助関数と定数は _q で始まる名前にする。
import hashlib as _qhl
import math as _qm

_QB = "var(--blue)"
_QBS = "var(--blue-soft)"


def _qsha(s):
    return _qhl.sha256(s.encode("utf-8")).hexdigest()


def _qsup(n):
    return str(n).translate(str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹"))


def _qrich(x, y, segs, a="start", sz=12, c=INK, b=False, mono=False):
    """上付き・下付きを含む 1 行の文字。segs は (文字列, 種類) の列で、種類は '' / '^' / '_'"""
    fam = MONO if mono else "var(--sans)"
    out = ['<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="%s" font-weight="%s">'
           % (x, y, a, sz, c, fam, "700" if b else "400")]
    cur = 0.0
    for t, k in segs:
        tgt = -sz * 0.42 if k == "^" else (sz * 0.25 if k == "_" else 0.0)
        fs = sz * 0.72 if k in ("^", "_") else sz
        out.append('<tspan dy="%g" font-size="%g">%s</tspan>' % (tgt - cur, fs, E(t)))
        cur = tgt
    out.append("</text>")
    return "".join(out)


def _qbox(x, y, w, h, lines, c=LIN, fill=PAN, tc=INK, sz=12, mono=False, r=8, lw=1.4, dash=None, lh=None):
    """複数行の文字を中央にそろえて入れた箱。1 行目を太字にする。
    lines の要素は文字列か (文字列, 色, 太字, 大きさ, 等幅) のタプル"""
    o = [RECT(x, y, w, h, r, fill, c, lw, dash)]
    if isinstance(lines, str):
        lines = [lines]
    lh = lh or sz * 1.4
    y0 = y + h / 2 - (len(lines) - 1) * lh / 2 + sz * 0.36
    for i, l in enumerate(lines):
        t, col, bb, s2, mm = (tuple(l) + (None,) * 5)[:5] if isinstance(l, tuple) else (l, None, None, None, None)
        o.append(T(x + w / 2, y0 + i * lh, t, "middle", s2 or sz, col or tc,
                   (i == 0) if bb is None else bb, mono if mm is None else mm))
    return "".join(o)


def _qcells(x, y, s, cw=24, ch=24, hl=None, hlc=ALI, hlf=ASOFT, c=LIN, fill=PAN, tc=INK, sz=12):
    """文字列を 1 文字 1 マスで描く"""
    o = []
    for i, b in enumerate(s):
        on = hl is not None and i in hl
        o.append(RECT(x + i * cw, y, cw - 3, ch, 4, hlf if on else fill, hlc if on else c, 1.2))
        o.append(T(x + i * cw + (cw - 3) / 2, y + ch / 2 + sz * 0.36, b, "middle", sz, hlc if on else tc, on, True))
    return "".join(o)


def _qgrid(x, y, bits, on_c, on_f=None, cell=10):
    """256 ビットを 16 × 16 のマスに並べる。1 のマスだけ塗る"""
    o = [RECT(x, y, 16 * cell, 16 * cell, 2, PAN, LIN, 1)]
    for k in range(1, 16):
        o.append(W(x + k * cell, y, x + k * cell, y + 16 * cell, c=LIN, lw=0.6))
        o.append(W(x, y + k * cell, x + 16 * cell, y + k * cell, c=LIN, lw=0.6))
    for i, b in enumerate(bits):
        if b == "1":
            r, c = divmod(i, 16)
            o.append(RECT(x + c * cell + 1, y + r * cell + 1, cell - 2, cell - 2, 1, on_f or on_c, on_c, 0.6))
    return "".join(o)


# ---------------------------------------------------------------- 1 節
# 1. 入力の長さによらず 256 ビット。1 文字違うと約半分のビットが変わる
def _f18_digest():
    o = []
    ins = [("abc", "3 バイト"), ("abd", "3 バイト"), ("暗号の役割は秘密を守ることだけではない。", "60 バイト")]
    hx = []
    for k, (s, nb) in enumerate(ins):
        y = 16 + k * 44
        a = s.isascii()
        o.append(RECT(14, y, 300, 36, 7, PAN, LIN, 1.3))
        o.append(T(26, y + 23, '"%s"' % s if a else s, "start", 13 if a else 11, INK, a, a))
        o.append(T(304, y + 23, nb, "end", 10.5, MUT))
        o.append(ARR(316, y + 18, 342, y + 18, MUT, 1.5))
        h = _qsha(s)
        hx.append(h)
        o.append(ARR(418, y + 18, 444, y + 18, MUT, 1.5))
        o.append(RECT(446, y, 250, 36, 7, PAN, LIN, 1.3))
        o.append(T(458, y + 15, h[:32], "start", 11.5, INK, False, True))
        o.append(T(458, y + 30, h[32:], "start", 11.5, INK, False, True))
    o.append(RECT(344, 16, 72, 124, 9, SSOFT, SIG, 1.6))
    o.append(T(380, 82, "SHA-256", "middle", 12.5, SIG, True))
    o.append(W(706, 18, 712, 18, 712, 138, 706, 138, c=MUT, lw=1.3))
    o.append(T(722, 62, "長さによらず", "start", 11.5, INK))
    o.append(T(722, 80, "16 進数 64 桁", "start", 11.5, INK, True))
    o.append(T(722, 98, "= 256 ビット", "start", 11.5, INK, True))
    # ビットの比較
    ba = bin(int(hx[0], 16))[2:].zfill(256)
    bb = bin(int(hx[1], 16))[2:].zfill(256)
    bx = "".join("1" if p != q else "0" for p, q in zip(ba, bb))
    nd = bx.count("1")
    gy = 190
    for gx, title, bits, col, fl in [(30, 'H("abc") の 256 ビット', ba, SIG, SIG),
                                     (240, 'H("abd") の 256 ビット', bb, _QB, _QB),
                                     (450, "値が違うビット（%d 個）" % nd, bx, ALI, ALI)]:
        o.append(T(gx, gy - 10, title, "start", 11.5, col, True))
        o.append(_qgrid(gx, gy, bits, col, fl))
    o.append(T(640, gy + 50, "1 文字違うだけで", "start", 12, INK))
    o.append(T(640, gy + 72, "256 ビット中 %d ビット" % nd, "start", 12, ALI, True))
    o.append(T(640, gy + 94, "（約 %d%%）が変わる" % round(nd * 100 / 256), "start", 12, INK))
    o.append(T(640, gy + 124, "塗ったマスが 1、", "start", 11, MUT))
    o.append(T(640, gy + 142, "塗っていないマスが 0", "start", 11, MUT))
    return SVG(840, 362, o, "SHA-256 に 3 つの入力を入れた結果。上段の出力は 16 進数で、1 桁が 4 ビットに当たる。"
               "下段は出力の 256 ビットを左上から 1 行 16 ビットずつ並べたもので、右端の図は 2 つの出力で値が違うビットだけを塗った。")
F["e18_digest"] = _f18_digest()


# 2. 3 つの性質: 何が与えられ、何を探すか
def _f18_props():
    o = []
    giv = dict(c=_QB, fill=_QBS)
    srch = dict(c=ALI, fill=ASOFT, dash="5,3")

    def msg(x, y, t, st):
        return _qbox(x, y, 84, 30, [t], st["c"], st["fill"], INK, 12.5, dash=st.get("dash"))

    def hb(x, y):
        return _qbox(x, y, 30, 30, ["H"], MUT, PAN, INK, 13)

    specs = [
        ("原像計算困難性（一方向性）", "与えられた h になる m を探す", "目標の値 h は固定", "攻撃者が選べるもの: m", 1),
        ("第 2 原像計算困難性", "与えられた m₁ と同じ値になる m₂ を探す", "m₁ とその値は固定", "攻撃者が選べるもの: m₂", 2),
        ("衝突困難性（衝突耐性）", "同じ値になる 2 つを探す", "固定されるものは無い", "攻撃者が選べるもの: m₁ と m₂", 3),
    ]
    for k, (title, sub, fix, free, kind) in enumerate(specs):
        px = 14 + k * 276
        o.append(RECT(px, 10, 262, 216, 12, PAN, LIN, 1.2))
        o.append(T(px + 131, 36, title, "middle", 13, INK, True))
        o.append(T(px + 131, 56, sub, "middle", 10.5, MUT))
        if kind == 1:
            o.append(msg(px + 14, 104, "m = ?", srch))
            o.append(ARR(px + 98, 119, px + 114, 119, MUT, 1.4))
            o.append(hb(px + 116, 104))
            o.append(ARR(px + 146, 119, px + 172, 119, MUT, 1.4))
            o.append(_qbox(px + 174, 104, 74, 30, ["h"], _QB, _QBS, INK, 13))
        else:
            m1 = ("m₁", giv) if kind == 2 else ("m₁ = ?", srch)
            m2 = ("m₂ = ?", srch)
            for (t, st), y in [(m1, 76), (m2, 132)]:
                o.append(msg(px + 14, y, t, st))
                o.append(ARR(px + 98, y + 15, px + 114, y + 15, MUT, 1.4))
                o.append(hb(px + 116, y))
            o.append(ARR(px + 146, 91, px + 172, 113, MUT, 1.4))
            o.append(ARR(px + 146, 147, px + 172, 125, MUT, 1.4))
            if kind == 2:
                o.append(_qbox(px + 174, 104, 74, 30, ["H(m₁)"], _QB, _QBS, INK, 12))
            else:
                o.append(_qbox(px + 174, 104, 74, 30, ["同じ値"], ALI, ASOFT, INK, 12, dash="5,3"))
        o.append(T(px + 131, 190, fix, "middle", 11, INK))
        o.append(T(px + 131, 208, free, "middle", 11, ALI, True))
    o.append(ARR(60, 246, 790, 246, MUT, 1.6))
    o.append(T(425, 268, "攻撃者が自由に選べるものが多いほど見つけやすい → 衝突困難性が最も強い要求", "middle", 11.5, INK, True))
    o.append(RECT(250, 282, 26, 16, 3, _QBS, _QB, 1.2))
    o.append(T(282, 295, "与えられる（固定）", "start", 11, MUT))
    o.append(RECT(430, 282, 26, 16, 3, ASOFT, ALI, 1.2, "5,3"))
    o.append(T(462, 295, "攻撃者が探す", "start", 11, MUT))
    return SVG(840, 306, o, "3 つの性質の違いは、攻撃者に何が与えられ、何を自由に選べるかにある。"
               "どれも「探しても見つからない」ことを求める。")
F["e18_props"] = _f18_props()


# 3. 鳩の巣原理: 入力は無限、出力は 2^n 通り
def _f18_pigeon():
    o = []
    ins = ["m₁", "m₂", "m₃", "m₄", "m₅", "m₆", "m₇", "m₈", "m₉"]
    outs = ["000", "001", "010", "011", "100", "101", "110", "111"]
    mp = [2, 6, 0, 5, 7, 3, 1, 4, 6]
    xi = lambda i: 26 + i * 74
    xo = lambda j: 46 + j * 78
    o.append(T(26, 24, "入力（いくらでもある。ここでは 9 個）", "start", 12, INK, True))
    for i, j in enumerate(mp):
        hit = j == 6
        o.append(W(xi(i) + 28, 68, xo(j) + 30, 150, c=ALI if hit else MUT, lw=2.2 if hit else 1.1))
    for i, s in enumerate(ins):
        hit = mp[i] == 6
        o.append(_qbox(xi(i), 38, 56, 30, [s], ALI if hit else _QB, ASOFT if hit else _QBS, INK, 13))
    for j, s in enumerate(outs):
        hit = j == 6
        o.append(_qbox(xo(j), 150, 60, 30, [s], ALI if hit else LIN, ASOFT if hit else PAN,
                       ALI if hit else INK, 13, mono=True))
    o.append(T(26, 206, "出力（n = 3 ビットなら 8 通り）", "start", 12, INK, True))
    o.append(T(26, 232, "9 個を 8 通りの出力に割り当てると、どれか 1 つに 2 個以上が入る → 衝突（赤）", "start", 11.5, ALI))
    return SVG(700, 246, o, "出力が n = 3 ビットの場合の例（どの入力がどの出力になるかは一例）。"
               "出力が 2ⁿ 通りしかない以上、2ⁿ + 1 個の入力の中には必ず衝突がある。")
F["e18_pigeon"] = _f18_pigeon()


# ---------------------------------------------------------------- 2 節
# 4. 誕生日: 自分との組 22 と、すべての組 253
def _f18_pairs():
    o = []
    n, R = 23, 112

    def pts(cx, cy):
        return [(cx + R * _qm.cos(-_qm.pi / 2 + 2 * _qm.pi * i / n),
                 cy + R * _qm.sin(-_qm.pi / 2 + 2 * _qm.pi * i / n)) for i in range(n)]
    A, B = pts(200, 178), pts(600, 178)
    for i in range(1, n):
        o.append(W(A[0][0], A[0][1], A[i][0], A[i][1], c=_QB, lw=1.1))
    for i in range(n):
        for j in range(i + 1, n):
            o.append(W(B[i][0], B[i][1], B[j][0], B[j][1], c=SIG, lw=0.55))
    for x, y in A[1:] + B:
        o.append(CIRC(x, y, 4.5, MUT, 1.2, PAN))
    o.append(CIRC(A[0][0], A[0][1], 7.5, _QB, 1.5, _QB))
    o.append(T(A[0][0] + 14, A[0][1] - 4, "自分", "start", 11.5, _QB, True))
    o.append(T(200, 30, "自分と同じ誕生日の人がいるか", "middle", 13, INK, True))
    o.append(T(600, 30, "誰か 2 人の誕生日が同じか", "middle", 13, INK, True))
    o.append(T(200, 322, "比べる組: 22 組 → 確率 約 5.9%", "middle", 12, _QB, True))
    o.append(T(600, 322, "比べる組: 253 組 → 確率 50.7%", "middle", 12, SIG, True))
    o.append(T(200, 342, "第 2 原像を探すことに当たる", "middle", 11, MUT))
    o.append(T(600, 342, "衝突を探すことに当たる", "middle", 11, MUT))
    return SVG(800, 354, o, "23 人を円周上の点で表し、誕生日を比べる 2 人の組を線で結んだ。"
               "左は自分と他の 22 人の組だけ、右は 23 人から 2 人を選ぶすべての組（253 組）である。")
F["e18_pairs"] = _f18_pairs()


# 5. SHA-256 を 16 ビットに切り詰めた実験
def _f18_trunc():
    o = []
    rows = [0, 1, 2, 3, 4, None, 157, None, 251]
    xn, xi, xh = 64, 88, 168
    o.append(T(xn, 26, "番号", "end", 11, MUT, True))
    o.append(T(xi, 26, "入力", "start", 11, MUT, True))
    o.append(T(xh, 26, "SHA-256 のハッシュ値（先頭の 16 進 4 桁 = 16 ビットだけを使う）", "start", 11, MUT, True))
    y = 36
    for r in rows:
        if r is None:
            o.append(T(xn - 8, y + 17, "⋮", "middle", 14, MUT))
            o.append(T(xh + 16, y + 17, "⋮", "middle", 14, MUT))
            y += 26
            continue
        h = _qsha(str(r))
        hit = r in (157, 251)
        if hit:
            o.append(RECT(16, y, 348, 26, 5, ASOFT, ALI, 1.2))
        o.append(T(xn, y + 18, str(r + 1), "end", 12, INK, hit, True))
        o.append(T(xi, y + 18, '"%d"' % r, "start", 12, INK, hit, True))
        o.append(T(xh, y + 18, h[:4], "start", 13, ALI if hit else INK, True, True))
        o.append(T(xh + 40, y + 18, h[4:20] + "…", "start", 12, FNT, False, True))
        y += 30
    o.append(T(376, 248, "← 158 番目の \"157\" と同じ c75d", "start", 11.5, ALI, True))
    o.append(T(376, 266, "　 ここで初めて衝突した", "start", 11.5, ALI, True))
    o.append(T(16, 316, "取りうる値は N = 2¹⁶ = 65536 通り。式の見込みは 1.18 × 2⁸ ≈ 301 個で、実験では 252 個目で衝突した。",
               "start", 11.5, INK))
    o.append(T(16, 338, "決まった値を狙う原像探しなら、約 0.69 × 2¹⁶ ≈ 45000 個が必要である。", "start", 11.5, MUT))
    return SVG(760, 352, o, "文字列 \"0\", \"1\", \"2\", … の SHA-256 を順に計算し、先頭 16 ビットだけを比べた。"
               "それまでの値と初めて一致したのは 252 個目である。")
F["e18_trunc"] = _f18_trunc()


# 6. 原像と衝突の計算量（2 の何乗か）
def _f18_cost():
    o = []
    X = lambda v: 160 + v / 256 * 560
    o.append(W(X(128), 44, X(128), 222, c=INK, lw=1.3, dash="5,4"))
    o.append(T(X(128), 34, "128 ビットの安全性", "middle", 11.5, INK, True))
    for name, n, y in [("MD5", 128, 70), ("SHA-1", 160, 132), ("SHA-256", 256, 194)]:
        o.append(T(20, y, name, "start", 13, INK, True))
        o.append(T(20, y + 17, "n = %d" % n, "start", 11, MUT))
        c = n // 2
        col, fl = (ALI, ASOFT) if c < 128 else (SIG, SSOFT)
        o.append(RECT(X(0), y - 17, X(c) - X(0), 14, 3, fl, col, 1.3))
        o.append(_qrich(X(c) + 6, y - 6, [("2", ""), (str(c), "^"), ("（衝突）", "")], "start", 11.5, col, True))
        o.append(RECT(X(0), y + 1, X(n) - X(0), 14, 3, _QBS, _QB, 1.3))
        o.append(_qrich(X(n) - 6, y + 12, [("2", ""), (str(n), "^"), ("（原像）", "")], "end", 11.5, _QB, True))
    o.append(W(X(0), 226, X(256), 226, c=MUT, lw=1.2))
    for v in (0, 64, 128, 192, 256):
        o.append(W(X(v), 226, X(v), 231, c=MUT, lw=1.2))
        o.append(_qrich(X(v), 246, [("2", ""), (str(v), "^")], "middle", 11.5, MUT))
    o.append(T(X(128), 270, "弱点が無い場合に、総当たりで必要な計算回数", "middle", 11.5, MUT))
    o.append(RECT(160, 284, 22, 12, 3, ASOFT, ALI, 1.2))
    o.append(T(188, 295, "衝突を探す（誕生日攻撃）", "start", 11, MUT))
    o.append(RECT(400, 284, 22, 12, 3, _QBS, _QB, 1.2))
    o.append(T(428, 295, "原像・第 2 原像を探す", "start", 11, MUT))
    return SVG(760, 306, o, "横軸は計算回数を 2 の何乗かで表した。衝突は出力の長さ n の半分の指数で見つかるので、"
               "128 ビットの安全性（破線）に届くのは n = 256 の SHA-256 だけである。")
F["e18_cost"] = _f18_cost()


# ---------------------------------------------------------------- 3 節
# 7. "abc" のパディング
def _f18_pad():
    o = []
    data = [0x61, 0x62, 0x63, 0x80] + [0] * 52 + [0, 0, 0, 0, 0, 0, 0, 0x18]
    cw, ch, st, x0 = 20, 26, 22, 40

    def cell(i):
        r, c = divmod(i, 32)
        return x0 + c * st, (76 if r == 0 else 140)
    for i, v in enumerate(data):
        x, y = cell(i)
        if i < 3:
            fl, sc, tc = _QBS, _QB, INK
        elif i == 3:
            fl, sc, tc = SSOFT, SIG, SIG
        elif i >= 56:
            fl, sc, tc = ASOFT, ALI, ALI if v else INK
        else:
            fl, sc, tc = PAN, LIN, FNT
        o.append(RECT(x, y, cw, ch, 3, fl, sc, 1.1))
        o.append(T(x + cw / 2, y + 17, "%02x" % v, "middle", 10, tc, i in (0, 1, 2, 3, 63), True))
    xa, xb = cell(0)[0], cell(2)[0] + cw
    o.append(W(xa, 70, xa, 64, xb, 64, xb, 70, c=_QB, lw=1.3))
    o.append(T((xa + xb) / 2, 57, 'm = "abc"', "middle", 11.5, _QB, True))
    x3 = cell(3)[0] + cw / 2
    o.append(W(x3, 74, x3, 34, c=SIG, lw=1.2))
    o.append(T(x3 + 6, 30, "0x80 = 1000 0000（ビット 1 と、それに続く 0）", "start", 11.5, SIG, True))
    xz0, xz1 = cell(4)[0], cell(31)[0] + cw
    o.append(W(xz0, 70, xz0, 64, xz1, 64, xz1, 70, c=MUT, lw=1.2))
    o.append(T((xz0 + xz1) / 2 + 40, 57, "0 を並べる（全体を 512 ビットの倍数にする）", "middle", 11.5, MUT, True))
    xl0, xl1 = cell(56)[0], cell(63)[0] + cw
    o.append(W(xl0, 170, xl0, 176, xl1, 176, xl1, 170, c=ALI, lw=1.3))
    o.append(T(xl1, 194, "長さ |m| = 24 ビット（0x18）を 64 ビットで書く", "end", 11.5, ALI, True))
    o.append(T(x0, 226, "m（3 バイト）＋ pad(m)（61 バイト）＝ 64 バイト ＝ 512 ビット（ちょうど 1 ブロック）",
               "start", 11.5, INK))
    return SVG(780, 240, o, "メッセージ \"abc\" をパディングした 64 バイト。1 マスが 1 バイト（16 進数 2 桁）で、"
               "上の行が 0〜31 バイト目、下の行が 32〜63 バイト目である。")
F["e18_pad"] = _f18_pad()


# 8. Merkle–Damgård 構造: 圧縮関数を繰り返す
def _f18_md():
    o = []
    cy = 122
    fx = [180, 395, 610]
    sx = [52, 287, 502, 728]
    o.append(T(395, 20, "m ‖ pad(m) を 512 ビットずつのブロックに切る", "middle", 11.5, MUT))
    for k, x in enumerate(fx):
        o.append(_qbox(x - 38, 32, 76, 30, ["B" + "₁₂₃"[k]], _QB, _QBS, INK, 13))
        o.append(ARR(x, 62, x, 96, _QB, 1.5))
        o.append(_qbox(x - 40, 98, 80, 48, ["f", ("圧縮関数", MUT, False, 10)], SIG, SSOFT, SIG, 15))
    names = ["h₀", "h₁", "h₂", "h₃"]
    for k, x in enumerate(sx):
        last = k == 3
        o.append(_qbox(x - 32, cy - 16, 64, 32, [names[k]], SIG if last else LIN, SSOFT if last else PAN, INK, 14))
    for k in range(3):
        o.append(ARR(sx[k] + 32, cy, fx[k] - 42, cy, INK, 1.6))
        o.append(ARR(fx[k] + 40, cy, sx[k + 1] - 34, cy, INK, 1.6))
    o.append(T(sx[0], 164, "初期値", "middle", 11, MUT))
    o.append(T(sx[0], 180, "（決まった値）", "middle", 11, MUT))
    o.append(T(sx[1], 164, "内部状態", "middle", 11, MUT))
    o.append(T(sx[2], 164, "内部状態", "middle", 11, MUT))
    o.append(T(sx[3], 164, "出力 H(m)", "middle", 11.5, SIG, True))
    o.append(T(sx[3], 180, "= 最後の内部状態", "middle", 11, SIG))
    return SVG(800, 194, o, "ブロックが 3 個（ℓ = 3）の場合。各段の f は、1 つ前の内部状態とブロック 1 個を受け取り、"
               "次の内部状態を返す。最後の内部状態がそのまま出力になる。")
F["e18_md"] = _f18_md()


# 9. 長さを入れる理由: H の衝突を後ろからたどると f の衝突が見つかる
def _f18_mdproof():
    o = []
    fx = [160, 330, 500, 670]
    sx = [64, 245, 415, 585, 770]
    yt, yb = 84, 214
    topb = ["B₁", "B₂", "B₃", "B₄"]
    botb = ["B'₁ = B₁", "B'₂ ≠ B₂", "B'₃ = B₃", "B'₄ = B₄"]
    hot = 1
    for k, x in enumerate(fx):
        h = k == hot
        o.append(_qbox(x - 32, 22, 64, 28, [topb[k]], ALI if h else _QB, ASOFT if h else _QBS, INK, 12.5))
        o.append(ARR(x, 50, x, yt - 20, MUT, 1.3))
        o.append(_qbox(x - 26, yt - 18, 52, 36, ["f"], ALI if h else SIG, ASOFT if h else SSOFT, ALI if h else SIG, 14))
        o.append(_qbox(x - 26, yb - 18, 52, 36, ["f"], ALI if h else SIG, ASOFT if h else SSOFT, ALI if h else SIG, 14))
        o.append(ARR(x, yb + 52, x, yb + 20, MUT, 1.3))
        o.append(_qbox(x - 42, yb + 52, 84, 28, [botb[k]], ALI if h else _QB, ASOFT if h else _QBS, INK, 12))
    tn = ["h₀", "h₁", "h₂", "h₃", "H(m)"]
    bn = ["h₀", "h'₁", "h'₂", "h'₃", "H(m')"]
    for k, x in enumerate(sx):
        w = 58 if k == 4 else 44
        for y, nm in [(yt, tn[k]), (yb, bn[k])]:
            o.append(_qbox(x - w / 2, y - 14, w, 28, [nm], LIN, PAN, INK, 12.5))
    for k in range(4):
        for y in (yt, yb):
            o.append(ARR(sx[k] + (22 if k < 4 else 29), y, fx[k] - 28, y, INK, 1.4))
            o.append(ARR(fx[k] + 26, y, sx[k + 1] - (29 if k == 3 else 22) - 2, y, INK, 1.4))
    o.append(T(770, 146, "H(m) = H(m')", "middle", 12, SIG, True))
    o.append(T(770, 164, "（仮定）", "middle", 11, MUT))
    for k in (2, 3):
        o.append(T(fx[k], 140, "入力が同じ", "middle", 11.5, MUT, True))
        o.append(T(fx[k], 158, "→ 1 つ前へ", "middle", 11, MUT))
    o.append(T(fx[1], 132, "入力が違う（B₂ ≠ B'₂）のに", "middle", 11.5, ALI, True))
    o.append(T(fx[1], 150, "出力は同じ（h₂ = h'₂）", "middle", 11.5, ALI, True))
    o.append(T(fx[1], 168, "→ f の衝突", "middle", 12, ALI, True))
    o.append(ARR(720, 306, 260, 306, MUT, 1.5))
    o.append(T(490, 324, "後ろから順に判定する", "middle", 11.5, MUT, True))
    return SVG(840, 336, o, "2 つのメッセージ m, m' のハッシュ値が同じだったとする。長さが同じなのでブロック数も同じで、"
               "後ろの計算から順に入力を比べると、どこかで「入力が違うのに出力が同じ」計算が見つかる。図は 2 番目で見つかる例。")
F["e18_mdproof"] = _f18_mdproof()


# 10. 長さ拡張攻撃: H(m) から計算を続ける
def _f18_lenext():
    o = []
    cy = 128
    o.append(RECT(12, 16, 432, 208, 12, "none", MUT, 1.2, "6,4"))
    o.append(T(24, 38, "m ‖ pad(m) の部分: 中身は知らない（長さ |m| だけ知っている）", "start", 11, MUT, True))
    o.append(RECT(456, 16, 372, 208, 12, SSOFT, SIG, 1.2))
    o.append(T(468, 38, "ここから先は計算できる", "start", 11.5, SIG, True))
    o.append(_qbox(22, cy - 16, 48, 32, ["h₀"], LIN, PAN, INK, 13))
    fs = [(98, "?"), (176, "?"), (280, "? ‖ pad(m)")]
    for k, (x, lab) in enumerate(fs):
        w = 100 if k == 2 else 52
        o.append(_qbox(x + 26 - w / 2, 58, w, 28, [lab], MUT, PAN, MUT, 12, dash="4,3"))
        o.append(ARR(x + 26, 86, x + 26, cy - 20, MUT, 1.3))
        o.append(_qbox(x, cy - 18, 52, 36, ["f"], MUT, PAN, MUT, 14))
    o.append(ARR(70, cy, 96, cy, MUT, 1.4))
    o.append(ARR(150, cy, 174, cy, MUT, 1.4))
    o.append(W(228, cy, 240, cy, c=MUT, lw=1.4))
    o.append(T(254, cy + 5, "…", "middle", 14, MUT, True))
    o.append(ARR(266, cy, 278, cy, MUT, 1.4))
    o.append(ARR(332, cy, 470, cy, INK, 1.8))
    o.append(_qbox(472, cy - 20, 104, 40, ["H(m) = h_ℓ"], SIG, PAN, INK, 12.5))
    o.append(T(524, cy + 40, "知っている値", "middle", 11, SIG, True))
    o.append(ARR(576, cy, 600, cy, INK, 1.6))
    o.append(_qbox(574, 58, 104, 28, ["x ‖ パディング"], _QB, _QBS, INK, 12))
    o.append(ARR(626, 86, 626, cy - 20, _QB, 1.4))
    o.append(_qbox(602, cy - 18, 52, 36, ["f"], SIG, SSOFT, SIG, 14))
    o.append(ARR(654, cy, 678, cy, INK, 1.6))
    o.append(_qbox(680, cy - 20, 140, 40, ["H(m ‖ pad(m) ‖ x)"], SIG, PAN, SIG, 11.5))
    o.append(T(750, cy + 40, "延長したデータのハッシュ値", "middle", 11, SIG, True))
    o.append(T(24, 196, "h₀ から h_ℓ までは m を知らないと計算できないが、", "start", 11, MUT))
    o.append(T(24, 212, "その結果 h_ℓ = H(m) はすでに知っている", "start", 11, MUT))
    o.append(T(468, 196, "x の後ろのパディングは、全体の長さ", "start", 11, INK))
    o.append(T(468, 212, "|m| + |pad(m)| + |x| だけで決まる", "start", 11, INK))
    return SVG(840, 234, o, "左の破線の中は、m を知らなければ計算できない部分である。しかしその計算の結果は"
               "出力 H(m) としてすでに見えているので、そこから f の計算を続けられる。")
F["e18_lenext"] = _f18_lenext()


# 11. スポンジ構造: 出力は内部状態の一部だけ
def _f18_sponge():
    o = []
    s, x0 = 0.375, 30
    o.append(T(x0, 28, "Merkle–Damgård 構造（SHA-256）", "start", 12.5, INK, True))
    o.append(RECT(x0, 40, 256 * s, 30, 4, ASOFT, ALI, 1.4))
    o.append(T(x0 + 128 * s, 60, "256", "middle", 11.5, ALI, True, True))
    o.append(T(x0 + 256 * s + 14, 52, "内部状態 256 ビット ＝ 出力 256 ビット", "start", 11.5, INK))
    o.append(T(x0 + 256 * s + 14, 70, "→ 出力から内部状態が全部分かり、続きを計算できる", "start", 11.5, ALI, True))
    o.append(T(x0, 114, "スポンジ構造（SHA3-256）", "start", 12.5, INK, True))
    o.append(RECT(x0, 126, 1600 * s, 30, 4, PAN, LIN, 1.3))
    o.append(RECT(x0, 126, 256 * s, 30, 4, SSOFT, SIG, 1.4))
    o.append(T(x0 + 128 * s, 146, "出力 256", "middle", 11, SIG, True))
    o.append(T(x0 + (256 + 672) * s, 146, "出力されない 1344 ビット", "middle", 11.5, MUT, True))
    o.append(T(x0, 184, "内部状態 1600 ビットのうち、出力するのは 256 ビットだけ", "start", 11.5, INK))
    o.append(T(x0, 204, "→ 残りの 1344 ビットが分からないので、続きを計算できない", "start", 11.5, SIG, True))
    return SVG(680, 218, o, "2 つの構造の内部状態を同じ縮尺で描いた。帯の長さがビット数に比例する。")
F["e18_sponge"] = _f18_sponge()


# ---------------------------------------------------------------- 4 節
# 12. ハッシュ値を一緒に送っても防げない／別の経路なら防げる
def _f18_hashonly():
    o = []
    o.append(T(20, 24, "① ハッシュ値を一緒に送る → 改ざんに気づけない", "start", 12.5, ALI, True))
    o.append(_qbox(20, 38, 170, 66, ["送信者", "m と H(m) を送る"], LIN, PAN, INK, 12))
    o.append(_qbox(300, 38, 240, 66, ["攻撃者", "m を m* に書き換え、", "H(m*) を計算して付け替える"],
                   ALI, ASOFT, INK, 12))
    o.append(_qbox(650, 38, 170, 66, ["受信者", "H(m*) を計算 → 一致", ("改ざんに気づけない", ALI, True)],
                   LIN, PAN, INK, 12))
    o.append(ARR(190, 71, 298, 71, INK, 1.6))
    o.append(T(244, 63, "m, H(m)", "middle", 11, INK, True))
    o.append(ARR(540, 71, 648, 71, INK, 1.6))
    o.append(T(594, 63, "m*, H(m*)", "middle", 11, INK, True))
    o.append(T(20, 152, "② ハッシュ値を別の安全な経路で伝える → 改ざんに気づける", "start", 12.5, SIG, True))
    o.append(_qbox(20, 166, 170, 46, ["公式サイト", "H(m) を載せる"], SIG, SSOFT, INK, 12))
    o.append(_qbox(20, 228, 170, 46, ["ミラーサイト", "m を置く"], LIN, PAN, INK, 12))
    o.append(_qbox(300, 228, 240, 46, ["攻撃者", "m を m* に書き換える"], ALI, ASOFT, INK, 12))
    o.append(_qbox(650, 182, 170, 76, ["受信者", "H(m*) ≠ 公式の H(m)", ("改ざんに気づける", SIG, True)],
                   LIN, PAN, INK, 12))
    o.append(ARR(190, 189, 648, 205, SIG, 1.8))
    o.append(T(420, 186, "攻撃者が書き換えられない経路", "middle", 11, SIG, True))
    o.append(ARR(190, 251, 298, 251, INK, 1.6))
    o.append(ARR(540, 251, 648, 238, INK, 1.6))
    o.append(T(594, 262, "m*", "middle", 11, INK, True))
    return SVG(840, 286, o, "上段: ハッシュ関数は誰でも計算できるので、攻撃者はデータとハッシュ値の両方を作り直せる。"
               "下段: ハッシュ値だけを書き換えられない経路で受け取れば、作り直したデータとの不一致から改ざんが分かる。")
F["e18_hashonly"] = _f18_hashonly()


# 13. MAC の流れ
def _f18_mac():
    o = []
    o.append(_qbox(20, 30, 190, 84, ["Alice（鍵 K を持つ）", "t = MAC_K(m) を計算", "m と t を送る"], _QB, _QBS, INK, 12))
    o.append(_qbox(320, 30, 200, 84, ["攻撃者（K を知らない）", "m を m* に書き換える", "m* に合うタグは作れない"],
                   ALI, ASOFT, INK, 12))
    o.append(_qbox(630, 30, 190, 84, ["Bob（鍵 K を持つ）", "MAC_K(m*) を計算", ("届いた t と一致しない → 検出", SIG, True)],
                   SIG, SSOFT, INK, 12))
    o.append(ARR(210, 72, 318, 72, INK, 1.6))
    o.append(T(264, 64, "m, t", "middle", 11.5, INK, True))
    o.append(ARR(520, 72, 628, 72, INK, 1.6))
    o.append(T(574, 64, "m*, t", "middle", 11.5, INK, True))
    o.append(T(420, 146, "改ざんが無ければ、Bob が計算した MAC_K(m) は届いた t と一致する", "middle", 11.5, MUT))
    return SVG(840, 160, o, "Alice と Bob は同じ鍵 K を前もって共有している。タグ t は鍵が無いと計算できないので、"
               "攻撃者はメッセージを書き換えても、それに合うタグを付けられない。")
F["e18_mac"] = _f18_mac()


# 14. HMAC の構造
def _f18_hmac():
    o = []
    o.append(_qbox(14, 112, 56, 36, ["K"], INK, PAN, INK, 14))
    o.append(ARR(70, 130, 98, 130, MUT, 1.5))
    o.append(_qbox(100, 104, 132, 52, ["K₀", ("0 を足して 64 バイト", MUT, False, 10)], INK, PAN, INK, 14))
    o.append(ARR(232, 118, 284, 68, _QB, 1.5))
    o.append(ARR(232, 142, 284, 192, SIG, 1.5))
    yi, yo = 46, 172
    o.append(_qbox(286, yi, 150, 40, ["K₀ ⊕ ipad", ("64 バイト", MUT, False, 10)], _QB, _QBS, INK, 12.5))
    o.append(T(445, yi + 25, "‖", "middle", 14, MUT, True))
    o.append(_qbox(454, yi, 62, 40, ["m"], INK, PAN, INK, 13))
    o.append(ARR(516, yi + 20, 544, yi + 20, MUT, 1.5))
    o.append(_qbox(546, yi, 44, 40, ["H"], _QB, PAN, _QB, 14))
    o.append(ARR(590, yi + 20, 618, yi + 20, MUT, 1.5))
    o.append(_qbox(620, yi, 140, 40, ["内側の出力", ("32 バイト", MUT, False, 10)], _QB, _QBS, INK, 12))
    o.append(T(690, yi + 56, "外には出さない", "middle", 10.5, MUT))
    o.append(_qbox(286, yo, 150, 40, ["K₀ ⊕ opad", ("64 バイト", MUT, False, 10)], SIG, SSOFT, INK, 12.5))
    o.append(T(445, yo + 25, "‖", "middle", 14, MUT, True))
    o.append(_qbox(454, yo, 112, 40, ["内側の出力"], _QB, _QBS, INK, 12))
    o.append(ARR(566, yo + 20, 594, yo + 20, MUT, 1.5))
    o.append(_qbox(596, yo, 44, 40, ["H"], SIG, PAN, SIG, 14))
    o.append(ARR(640, yo + 20, 668, yo + 20, MUT, 1.5))
    o.append(_qbox(670, yo, 150, 40, ["HMAC_K(m)"], SIG, SSOFT, SIG, 13))
    o.append(W(760, yi + 20, 790, yi + 20, 790, 130, 510, 130, 510, 150, c=_QB, lw=1.5))
    o.append(ARR(510, 150, 510, yo - 2, _QB, 1.5))
    o.append(T(300, yi - 12, "内側", "start", 11, _QB, True))
    o.append(T(300, yo - 12, "外側", "start", 11, SIG, True))
    # ipad と opad の 1 バイト
    o.append(T(14, 254, "ipad と opad の 1 バイト（2 進数）", "start", 11.5, INK, True))
    diff = {i for i in range(8) if ((0x36 >> (7 - i)) & 1) != ((0x5C >> (7 - i)) & 1)}
    o.append(T(14, 282, "0x36", "start", 12, _QB, True, True))
    o.append(_qcells(64, 266, format(0x36, "08b"), 24, 24, hl=diff))
    o.append(T(14, 312, "0x5C", "start", 12, SIG, True, True))
    o.append(_qcells(64, 296, format(0x5C, "08b"), 24, 24, hl=diff))
    o.append(T(270, 282, "赤の 4 か所で値が違う（8 ビット中 4 ビット）", "start", 11.5, ALI, True))
    o.append(T(270, 300, "→ K₀ ⊕ ipad と K₀ ⊕ opad は大きく違うビット列になり、", "start", 11.5, INK))
    o.append(T(270, 318, "　 内側と外側で別の鍵を使ったのと同じ効果を持つ", "start", 11.5, INK))
    return SVG(840, 330, o, "HMAC は SHA-256 を 2 回使う。内側の出力は外側のハッシュの入力になるだけで、外には出ない。"
               "外に出るのは外側の出力だけである。")
F["e18_hmac"] = _f18_hmac()


# ---------------------------------------------------------------- 5 節
# 15. 署名の流れ
def _f18_sigflow():
    o = []
    o.append(RECT(10, 10, 820, 104, 12, _QBS, _QB, 1.2))
    o.append(T(24, 32, "署名者 Alice（秘密鍵を持つ）", "start", 12.5, _QB, True))
    y1 = 48
    o.append(_qbox(24, y1, 70, 40, ["m"], INK, PAN, INK, 14))
    o.append(ARR(94, y1 + 20, 122, y1 + 20, MUT, 1.5))
    o.append(_qbox(124, y1, 44, 40, ["H"], INK, PAN, INK, 14))
    o.append(ARR(168, y1 + 20, 196, y1 + 20, MUT, 1.5))
    o.append(_qbox(198, y1, 84, 40, ["H(m)"], INK, PAN, INK, 13))
    o.append(ARR(282, y1 + 20, 316, y1 + 20, MUT, 1.5))
    o.append(_qbox(318, y1, 170, 40, ["署名を作る", ("秘密鍵を使う", MUT, False, 10)], _QB, PAN, _QB, 12.5))
    o.append(ARR(488, y1 + 20, 518, y1 + 20, MUT, 1.5))
    o.append(_qbox(520, y1, 70, 40, ["σ"], _QB, PAN, _QB, 15))
    o.append(RECT(10, 150, 820, 150, 12, SSOFT, SIG, 1.2))
    o.append(T(24, 172, "検証者（公開鍵を持つ。誰でもよい）", "start", 12.5, SIG, True))
    o.append(ARR(59, y1 + 40, 59, 184, INK, 1.6))
    o.append(T(70, 134, "m を送る", "start", 11, INK, True))
    o.append(ARR(555, y1 + 40, 555, 184, INK, 1.6))
    o.append(T(566, 134, "σ を送る", "start", 11, INK, True))
    y2 = 186
    o.append(_qbox(24, y2, 70, 40, ["m"], INK, PAN, INK, 14))
    o.append(ARR(94, y2 + 20, 122, y2 + 20, MUT, 1.5))
    o.append(_qbox(124, y2, 44, 40, ["H"], INK, PAN, INK, 14))
    o.append(ARR(168, y2 + 20, 196, y2 + 20, MUT, 1.5))
    o.append(_qbox(198, y2, 84, 40, ["H(m)"], INK, PAN, INK, 13))
    o.append(ARR(282, y2 + 20, 316, y2 + 20, MUT, 1.5))
    o.append(_qbox(318, y2, 170, 40, ["一致するか比べる"], SIG, PAN, SIG, 12.5))
    o.append(_qbox(520, y2, 170, 40, ["検証の計算", ("公開鍵を使う", MUT, False, 10)], SIG, PAN, SIG, 12.5))
    o.append(ARR(520, y2 + 20, 490, y2 + 20, MUT, 1.5))
    o.append(T(403, 250, "一致する → 正しい署名", "middle", 12, SIG, True))
    o.append(T(403, 272, "m が途中で m* に書き換えられていれば H(m*) と一致しない → 改ざんを検出", "middle", 11.5, ALI))
    return SVG(840, 310, o, "署名を作れるのは秘密鍵を持つ Alice だけで、検証は公開鍵があれば誰でもできる。"
               "「署名を作る」「検証の計算」の中身は方式ごとに違う（RSA なら下の式）。")
F["e18_sigflow"] = _f18_sigflow()


# 16. 否認防止: MAC と署名
def _f18_nonrep():
    o = []
    for px, title, tc in [(10, "MAC（共通の鍵）", ALI), (426, "署名（秘密鍵と公開鍵）", SIG)]:
        o.append(RECT(px, 10, 404, 230, 12, PAN, LIN, 1.2))
        o.append(T(px + 202, 34, title, "middle", 13, INK, True))
    o.append(_qbox(30, 52, 164, 56, ["Alice", "鍵 K → t を作れる"], ALI, ASOFT, INK, 12))
    o.append(_qbox(230, 52, 164, 56, ["Bob", "鍵 K → t を作れる"], ALI, ASOFT, INK, 12))
    o.append(_qbox(122, 148, 180, 50, ["第三者", "(m, t) を見せられる"], LIN, PAN, INK, 12))
    o.append(ARR(112, 108, 170, 146, MUT, 1.3))
    o.append(ARR(312, 108, 254, 146, MUT, 1.3))
    o.append(T(212, 222, "どちらが作ったか決められない", "middle", 12, ALI, True))
    o.append(_qbox(446, 52, 164, 56, ["Alice", "秘密鍵 → σ を作れる"], _QB, _QBS, INK, 12))
    o.append(_qbox(646, 52, 164, 56, ["Bob", "公開鍵 → 検証だけ"], LIN, PAN, INK, 12))
    o.append(_qbox(538, 148, 180, 50, ["第三者", "公開鍵で検証できる"], LIN, PAN, INK, 12))
    o.append(ARR(528, 108, 586, 146, MUT, 1.3))
    o.append(T(628, 222, "作れるのは Alice だけ → Alice が作ったと示せる", "middle", 12, SIG, True))
    return SVG(840, 250, o, "左: MAC の鍵は Alice と Bob の両方が持つので、タグはどちらにも作れる。"
               "右: 署名を作れるのは秘密鍵を持つ Alice だけである。")
F["e18_nonrep"] = _f18_nonrep()


# 17. ハッシュを挟む理由: 乗法準同型性による偽造
def _f18_forgery():
    o = []
    o.append(RECT(10, 10, 404, 280, 12, PAN, LIN, 1.2))
    o.append(RECT(426, 10, 404, 280, 12, PAN, LIN, 1.2))
    o.append(T(212, 34, "ハッシュなし: m に直接署名", "middle", 13, ALI, True))
    o.append(T(628, 34, "ハッシュあり: H(m) に署名", "middle", 13, SIG, True))
    # 左
    o.append(RECT(30, 50, 364, 64, 8, PAN, LIN, 1.2))
    o.append(T(212, 68, "Alice が 2 と 3 に署名した（本物）", "middle", 12, INK, True))
    o.append(_qrich(212, 87, [("σ₁ = 2", ""), ("2753", "^"), (" mod 3233 = 1027", "")], "middle", 12, INK, False, True))
    o.append(_qrich(212, 105, [("σ₂ = 3", ""), ("2753", "^"), (" mod 3233 = 1857", "")], "middle", 12, INK, False, True))
    o.append(ARR(212, 114, 212, 136, MUT, 1.4))
    o.append(RECT(30, 138, 364, 48, 8, ASOFT, ALI, 1.2))
    o.append(T(212, 156, "攻撃者が 2 つの署名を掛ける", "middle", 12, INK, True))
    o.append(T(212, 176, "1027 × 1857 mod 3233 = 2902", "middle", 12, INK, False, True))
    o.append(ARR(212, 186, 212, 208, MUT, 1.4))
    o.append(RECT(30, 210, 364, 48, 8, ASOFT, ALI, 1.2))
    o.append(_qrich(212, 228, [("検証: 2902", ""), ("17", "^"), (" mod 3233 = 6", "")], "middle", 12, INK, False, True))
    o.append(T(212, 248, "→ m = 6 の署名として検証に通る", "middle", 12, ALI, True))
    o.append(T(212, 278, "Alice は 6 に署名していない（偽造）", "middle", 11.5, ALI))
    # 右
    o.append(RECT(446, 50, 364, 64, 8, PAN, LIN, 1.2))
    o.append(T(628, 68, "Alice が m₁ と m₂ に署名した（本物）", "middle", 12, INK, True))
    o.append(_qrich(628, 87, [("σ₁ = H(m₁)", ""), ("d", "^"), (" mod n", "")], "middle", 12, INK))
    o.append(_qrich(628, 105, [("σ₂ = H(m₂)", ""), ("d", "^"), (" mod n", "")], "middle", 12, INK))
    o.append(ARR(628, 114, 628, 136, MUT, 1.4))
    o.append(RECT(446, 138, 364, 48, 8, PAN, LIN, 1.2))
    o.append(_qrich(628, 156, [("σ₁σ₂ = (H(m₁)H(m₂))", ""), ("d", "^"), (" mod n", "")], "middle", 12, INK))
    o.append(T(628, 176, "これは数 H(m₁)H(m₂) に対する署名", "middle", 11.5, INK))
    o.append(ARR(628, 186, 628, 208, MUT, 1.4))
    o.append(RECT(446, 210, 364, 48, 8, SSOFT, SIG, 1.2))
    o.append(T(628, 228, "使うには H(m₃) ≡ H(m₁)H(m₂) となる m₃ が要る", "middle", 11.5, INK))
    o.append(T(628, 248, "→ ハッシュの原像を探すことになる", "middle", 12, SIG, True))
    o.append(T(628, 278, "原像は見つけられないので、偽造に使えない", "middle", 11.5, SIG))
    return SVG(840, 300, o, "左は 16 章の鍵（n = 3233、e = 17、d = 2753）で、メッセージの数にそのまま署名した場合。"
               "右はハッシュ値に署名した場合で、同じ掛け算をしても役に立たない。")
F["e18_forgery"] = _f18_forgery()


# ---------------------------------------------------------------- 6 節
# 18. パスワードの保管方法の比較（値は記号で示す）
def _f18_pw():
    o = []
    cols = [(10, "① そのまま保存", ALI), (290, "② 単純なハッシュ", ALI), (570, "③ ソルト ＋ KDF", SIG)]
    for px, title, tc in cols:
        o.append(RECT(px, 10, 260, 196, 12, PAN, LIN, 1.2))
        o.append(T(px + 130, 34, title, "middle", 13, tc, True))
    users = [("alice", "s₁"), ("carol", "s₂")]
    for px, k in [(10, 1), (290, 2), (570, 3)]:
        o.append(T(px + 18, 62, "ユーザー", "start", 10.5, MUT, True))
        if k == 3:
            o.append(T(px + 90, 62, "ソルト", "start", 10.5, MUT, True))
            o.append(T(px + 150, 62, "保存する値", "start", 10.5, MUT, True))
        else:
            o.append(T(px + 110, 62, "保存する値", "start", 10.5, MUT, True))
        if k == 2:
            o.append(RECT(px + 102, 70, 80, 52, 6, ASOFT, ALI, 1.2))
        for j, (u, sl) in enumerate(users):
            y = 88 + j * 28
            o.append(T(px + 18, y, u, "start", 12, INK, False, True))
            if k == 1:
                o.append(T(px + 110, y, "P", "start", 12.5, ALI, True, True))
            elif k == 2:
                o.append(T(px + 110, y, "H(P)", "start", 12.5, ALI, True, True))
            else:
                o.append(T(px + 90, y, sl, "start", 12.5, MUT, False, True))
                o.append(T(px + 150, y, "KDF(%s, P)" % sl, "start", 12.5, SIG, True, True))
    o.append(T(140, 168, "漏れたら、そのまま読まれる", "middle", 11.5, ALI, True))
    o.append(T(420, 160, "同じパスワードは同じ値になる", "middle", 11.5, ALI, True))
    o.append(T(420, 180, "事前に計算した表が使える", "middle", 11.5, ALI))
    o.append(T(700, 160, "ソルトが違うので値も違う", "middle", 11.5, SIG, True))
    o.append(T(700, 180, "1 回の計算がわざと重い", "middle", 11.5, SIG))
    return SVG(840, 216, o, "alice と carol が同じパスワード P を使っている場合に、サーバに保存される値。"
               "s₁, s₂ はユーザーごとに選ぶソルトで、秘密にせず、値と一緒に保存する。")
F["e18_pw"] = _f18_pw()


# 19. ハッシュの鎖
def _f18_chain():
    o = []
    hs = lambda s: _qsha(s)[:4]
    datas = ["A→B 5", "B→C 2", "C→D 7", "D→A 1"]
    prev, good = "0000", []
    for d in datas:
        h = hs(prev + "|" + d)
        good.append((prev, d, h))
        prev = h
    bad_d = "B→C 9"
    bad_h = hs(good[1][0] + "|" + bad_d)

    def row(y, title, tc, broken):
        o.append(T(20, y - 12, title, "start", 12.5, tc, True))
        for i, (pv, d, h) in enumerate(good):
            x = 20 + i * 206
            dd = bad_d if (broken and i == 1) else d
            hh = bad_h if (broken and i == 1) else h
            pb = broken and i == 2
            db = broken and i == 1
            o.append(RECT(x, y, 160, 84, 8, PAN, ALI if (pb or db) else LIN, 1.4 if (pb or db) else 1.2))
            o.append(T(x + 12, y + 18, "ブロック %d　前のハッシュ値" % (i + 1), "start", 10, MUT))
            o.append(T(x + 12, y + 38, pv, "start", 13, ALI if pb else INK, True, True))
            o.append(T(x + 12, y + 58, "内容", "start", 10, MUT))
            o.append(T(x + 12, y + 76, dd, "start", 12.5, ALI if db else INK, db))
            if i < 3:
                o.append(ARR(x + 160, y + 33, x + 204, y + 33, ALI if (broken and i == 1) else SIG, 1.6))
                o.append(T(x + 182, y + 25, hh, "middle", 11, ALI if (broken and i == 1) else SIG, True, True))
                if broken and i == 1:
                    o.append(T(x + 182, y + 54, "≠", "middle", 18, ALI, True))
    row(40, "改ざん前: どのブロックでも、記録された値と前のブロックのハッシュ値が一致する", SIG, False)
    row(176, "ブロック 2 の内容を書き換えた後", ALI, True)
    o.append(T(20, 290, "ブロック 2 のハッシュ値が %s に変わり、ブロック 3 に記録された %s と合わなくなる" % (bad_h, good[1][2]),
               "start", 11.5, ALI))
    return SVG(820, 302, o, "矢印の上の値が、そのブロックのハッシュ値（前のハッシュ値と内容を | でつないだものの SHA-256 の先頭 4 桁）。"
               "次のブロックは、この値を「前のハッシュ値」として記録している。")
F["e18_chain"] = _f18_chain()


# 20. マークル木と、1 件が含まれることの証明
def _f18_merkle():
    o = []
    H = lambda b: _qhl.sha256(b).digest()
    lv = [[H(("tx%d" % i).encode()) for i in range(1, 9)]]
    while len(lv[-1]) > 1:
        p = lv[-1]
        lv.append([H(p[i] + p[i + 1]) for i in range(0, len(p), 2)])
    ys = [228, 160, 94, 28]
    xs = [[62 + i * 102 for i in range(8)]]
    for k in range(1, 4):
        q = xs[-1]
        xs.append([(q[i] + q[i + 1]) / 2 for i in range(0, len(q), 2)])
    path = {(0, 2), (1, 1), (2, 0), (3, 0)}
    sib = {(0, 3), (1, 0), (2, 1)}
    for k in range(3):
        for i, x in enumerate(xs[k]):
            on = (k, i) in path and (k + 1, i // 2) in path
            o.append(W(x, ys[k], xs[k + 1][i // 2], ys[k + 1] + 28, c=SIG if on else FNT, lw=2 if on else 1.1))
    for i, x in enumerate(xs[0]):
        tgt = i == 2
        o.append(W(x, ys[0] + 28, x, 266, c=_QB if tgt else FNT, lw=2 if tgt else 1.1))
        o.append(_qbox(x - 30, 266, 60, 26, ["tx%d" % (i + 1)], _QB if tgt else LIN, _QBS if tgt else PAN, INK, 12,
                       mono=True))
    for k in range(4):
        for i, x in enumerate(xs[k]):
            key = (k, i)
            if key == (0, 2):
                c, f = _QB, _QBS
            elif key in path:
                c, f = SIG, SSOFT
            elif key in sib:
                c, f = ALI, ASOFT
            else:
                c, f = LIN, PAN
            o.append(_qbox(x - 34, ys[k], 68, 28, [lv[k][i].hex()[:4]], c, f, INK, 12.5, mono=True))
    o.append(T(xs[3][0] - 46, ys[3] + 19, "ルート", "end", 12, SIG, True))
    o.append(T(14, 312, "データ", "start", 11, MUT))
    lg = [(_QB, _QBS, "含まれることを示したいデータ（tx3）"), (ALI, ASOFT, "渡す値（3 個 = log₂ 8）"),
          (SIG, SSOFT, "受け取った人が計算してルートと比べる値")]
    x = 70
    for c, f, t in lg:
        o.append(RECT(x, 324, 22, 14, 3, f, c, 1.2))
        o.append(T(x + 28, 336, t, "start", 11, MUT))
        x += 28 + len(t) * 10.5 + 24
    return SVG(840, 348, o, "8 件のデータのマークル木。各節点の値は SHA-256 の先頭 4 桁で、親は 2 つの子のハッシュ値を連結してハッシュしたもの。"
               "tx3 が含まれることは、赤の 3 個を渡せば、受け取った人がルートまで計算し直して確かめられる。")
F["e18_merkle"] = _f18_merkle()


# 21. 証明書チェーンと検証の順番
def _f18_pki():
    o = []
    o.append(T(190, 22, "証明書の連鎖", "middle", 12.5, INK, True))
    o.append(T(645, 22, "ブラウザが下から順に検証する", "middle", 12.5, INK, True))
    left = [(["ルート CA の証明書", ("OS・ブラウザに組み込み済み", MUT, False, 11)], SIG, SSOFT),
            (["中間 CA の証明書", ("中間 CA の公開鍵を含む", MUT, False, 11)], LIN, PAN),
            (["サーバ証明書", ("example.com の公開鍵を含む", MUT, False, 11)], _QB, _QBS),
            (["ハンドシェイクの内容", ("ECDHE でサーバが送る値を含む", MUT, False, 11)], LIN, PAN)]
    signs = ["ルート CA の秘密鍵で署名", "中間 CA の秘密鍵で署名", "サーバの秘密鍵で署名"]
    right = ["ルート CA は組み込み済みなので信頼する",
             ("中間 CA の証明書の署名を、", "ルート CA の公開鍵で検証"),
             ("サーバ証明書の署名を、", "中間 CA の公開鍵で検証"),
             ("ハンドシェイクの署名を、サーバ証明書の公開鍵で検証", "→ 中間者のすり替えを見抜ける")]
    for k, (lines, c, f) in enumerate(left):
        y = 36 + k * 92
        o.append(_qbox(30, y, 320, 54, lines, c, f, INK, 12.5))
        if k < 3:
            o.append(ARR(190, y + 54, 190, y + 90, MUT, 1.5))
            o.append(T(200, y + 76, signs[k], "start", 10.5, MUT))
        rl = right[k]
        rl = [rl] if isinstance(rl, str) else list(rl)
        last = k == 3
        o.append(_qbox(470, y, 350, 54, [(t, SIG if (last and i == 1) else INK, i == 0 and k == 0) for i, t in enumerate(rl)],
                       SIG, SSOFT if k == 0 else PAN, INK, 11.5))
        o.append(W(350, y + 27, 466, y + 27, c=FNT, lw=1.1, dash="3,3"))
        if k > 0:
            o.append(ARR(645, y, 645, y - 36, SIG, 1.5))
    return SVG(840, 374, o, "左の矢印は、上の証明書の持ち主が下の内容に署名したことを表す。ブラウザは右の順に、"
               "1 段上の公開鍵で署名を検証していき、組み込み済みのルート CA まで届けば信頼する。")
F["e18_pki"] = _f18_pki()


# ---------------------------------------------------------------- 8 節
# 22. 同じ数学が誤り訂正と暗号の両方を支える
def _f18_map():
    o = []
    L = [("06", "誤り訂正の基礎"), ("07", "線形符号"), ("08", "ハミング符号"), ("09", "CRC"), ("10", "BCH 符号"),
         ("11", "リード・ソロモン符号")]
    R = [("12", "古典暗号"), ("13", "LFSR"), ("14", "AES"), ("15", "数論の道具"), ("16", "RSA"), ("17", "楕円曲線暗号"),
         ("18", "ハッシュ・署名")]
    M = [("合同算術", "01"), ("群の位数", "02"), ("多項式の除算", "04"), ("原始多項式", "04"), ("GF(2", "05"), ("MDS", "06"),
         ("バーレカンプ・マッシー法", "11"), ("線形性", "07・09")]
    edges = {0: (["09"], ["16", "17"]), 1: ([], ["15", "16"]), 2: (["09"], []), 3: (["11"], ["13"]),
             4: (["10", "11"], ["14"]), 5: (["11"], ["14"]), 6: (["11"], ["13"]), 7: (["07", "09"], ["13!", "18!"])}
    ly = {c: 76 + i * 60 for i, (c, _) in enumerate(L)}
    ry = {c: 66 + i * 52 for i, (c, _) in enumerate(R)}
    my = [62 + k * 46 for k in range(len(M))]
    for k, (ls, rs) in edges.items():
        for c in ls:
            o.append(W(330, my[k] + 16, 222, ly[c] + 17, c=_QB, lw=1.4))
        for c in rs:
            bad = c.endswith("!")
            c = c.rstrip("!")
            o.append(W(530, my[k] + 16, 638, ry[c] + 17, c=ALI if bad else SIG, lw=1.6 if bad else 1.4,
                       dash="5,4" if bad else None))
    for c, t in L:
        o.append(_qbox(20, ly[c], 200, 34, [c + "  " + t], _QB, _QBS, INK, 12))
    for c, t in R:
        o.append(_qbox(640, ry[c], 200, 34, [c + "  " + t], SIG, SSOFT, INK, 12))
    for k, (t, c) in enumerate(M):
        o.append(RECT(330, my[k], 200, 32, 8, PAN, INK, 1.3))
        if t == "GF(2":
            o.append(_qrich(430, my[k] + 21, [("GF(2", ""), ("m", "^"), (")（%s）" % c, "")], "middle", 12, INK, True))
        else:
            o.append(T(430, my[k] + 21, "%s（%s）" % (t, c), "middle", 12, INK, True))
    o.append(T(120, 40, "誤り訂正（第 II 部）", "middle", 13, _QB, True))
    o.append(T(430, 40, "共通の数学（定義した章）", "middle", 13, INK, True))
    o.append(T(740, 40, "暗号（第 III 部）", "middle", 13, SIG, True))
    o.append(W(170, 448, 196, 448, c=_QB, lw=1.6))
    o.append(W(202, 448, 228, 448, c=SIG, lw=1.6))
    o.append(T(236, 452, "その数学を使う", "start", 11, MUT))
    o.append(W(420, 448, 460, 448, c=ALI, lw=1.6, dash="5,4"))
    o.append(T(468, 452, "弱点になるので避ける（破られる原因）", "start", 11, MUT))
    return SVG(860, 466, o, "中央の数学から、それを使う章へ線を引いた。左右の両方に線が出ている数学が、"
               "誤り訂正と暗号の共通の土台である。線形性だけは、暗号の側では避けるべき性質になる。")
F["e18_map"] = _f18_map()


# 23. 同じ構造、逆の目的
def _f18_dual():
    o = []
    o.append(T(20, 76, "誤り訂正", "start", 13, _QB, True))
    o.append(_qbox(110, 56, 90, 36, ["情報語"], _QB, _QBS, INK, 12.5))
    o.append(_qbox(330, 56, 90, 36, ["符号語"], _QB, _QBS, INK, 12.5))
    o.append(_qbox(530, 56, 90, 36, ["受信語"], ALI, ASOFT, INK, 12.5))
    o.append(_qbox(730, 56, 90, 36, ["情報語"], _QB, _QBS, INK, 12.5))
    o.append(ARR(200, 74, 328, 74, INK, 1.6))
    o.append(T(264, 50, "符号化", "middle", 11.5, INK, True))
    o.append(T(264, 108, "冗長を足す", "middle", 10.5, MUT))
    o.append(ARR(420, 74, 528, 74, ALI, 1.6))
    o.append(T(474, 50, "通信路", "middle", 11.5, ALI, True))
    o.append(T(474, 108, "誤りが起きる", "middle", 10.5, ALI))
    o.append(ARR(620, 74, 728, 74, _QB, 1.8))
    o.append(T(674, 50, "復号", "middle", 11.5, _QB, True))
    o.append(T(674, 108, "構造を使って戻す", "middle", 10.5, _QB))
    o.append(T(674, 124, "（誰でもできる）", "middle", 10.5, _QB))
    o.append(T(20, 196, "暗号", "start", 13, SIG, True))
    o.append(_qbox(110, 176, 90, 36, ["平文"], SIG, SSOFT, INK, 12.5))
    o.append(_qbox(330, 176, 90, 36, ["暗号文"], SIG, SSOFT, INK, 12.5))
    o.append(_qbox(730, 152, 90, 36, ["平文"], SIG, SSOFT, INK, 12.5))
    o.append(_qbox(730, 212, 90, 36, ["戻せない"], ALI, ASOFT, ALI, 12.5, dash="5,3"))
    o.append(ARR(200, 194, 328, 194, INK, 1.6))
    o.append(T(264, 170, "暗号化", "middle", 11.5, INK, True))
    o.append(T(264, 228, "鍵を使って混ぜる", "middle", 10.5, MUT))
    o.append(ARR(420, 188, 728, 170, SIG, 1.8))
    o.append(T(560, 166, "鍵がある → 復号できる", "middle", 11.5, SIG, True))
    o.append(ARR(420, 200, 728, 228, ALI, 1.6))
    o.append(T(560, 238, "鍵が無い → 戻せない", "middle", 11.5, ALI, True))
    o.append(T(420, 282, "どちらも有限体・多項式・線形代数の上に作られている。誤り訂正は構造を使って「戻しやすく」し、",
               "middle", 11.5, INK))
    o.append(T(420, 300, "暗号は同じ構造を使って「鍵が無ければ戻しにくく」する。", "middle", 11.5, INK))
    return SVG(840, 314, o, "上段は誤り訂正、下段は暗号のデータの流れ。どちらも元のデータを変換して送り、受け手が元に戻す。"
               "違うのは、元に戻すことを誰にでもやりやすくするか、鍵を持つ人にだけ許すかである。")
F["e18_dual"] = _f18_dual()
