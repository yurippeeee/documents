# 11 章 リード・ソロモン符号 の図（figures.py の関数・定数をそのまま使う）
# 他の章のファイルと同じ名前空間で実行されるので、この章の名前はすべて _r11 で始める。
# 数値はすべてここで GF の計算をして求める（本文の値と同じになることを確かめてある）。

_R11B = "var(--blue)"
_R11BS = "var(--blue-soft)"
_R11SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")
_R11SUB = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")


class _R11GF:
    """GF(2^m)（原始多項式 poly、α = x）。多項式は昇冪のリスト。"""

    def __init__(self, m, poly):
        self.m, self.n = m, (1 << m) - 1
        self.exp, self.log = [], {}
        x = 1
        for i in range(self.n):
            self.exp.append(x)
            self.log[x] = i
            x <<= 1
            if x >> m:
                x ^= poly

    def mul(self, a, b):
        return 0 if a == 0 or b == 0 else self.exp[(self.log[a] + self.log[b]) % self.n]

    def div(self, a, b):
        return 0 if a == 0 else self.exp[(self.log[a] - self.log[b]) % self.n]

    def a(self, k):
        return self.exp[k % self.n]

    def pmul(self, A, B):
        R = [0] * (len(A) + len(B) - 1)
        for i, x in enumerate(A):
            for j, y in enumerate(B):
                R[i + j] ^= self.mul(x, y)
        return R

    def peval(self, P, v):
        s = 0
        for c in reversed(P):
            s = self.mul(s, v) ^ c
        return s

    def name(self, v):
        if v == 0:
            return "0"
        k = self.log[v]
        return "1" if k == 0 else ("α" if k == 1 else "α" + str(k).translate(_R11SUP))

    def bits(self, v):
        return format(v, "0%db" % self.m)

    def pstr(self, P, var="x"):
        """降冪の文字列（x⁴ + α³x³ + …）"""
        ts = []
        for i in range(len(P) - 1, -1, -1):
            c = P[i]
            if not c:
                continue
            cs = self.name(c)
            if i == 0:
                ts.append(cs)
            else:
                xs = var if i == 1 else var + str(i).translate(_R11SUP)
                ts.append(xs if cs == "1" else cs + xs)
        return " + ".join(ts) if ts else "0"

    def pasc(self, P, var="x"):
        """昇冪の文字列（1 + α⁶x + α⁶x² …）。Λ・Ω など定数項から書く多項式に使う"""
        ts = []
        for i in range(len(P)):
            c = P[i]
            if not c:
                continue
            cs = self.name(c)
            if i == 0:
                ts.append(cs)
            else:
                xs = var if i == 1 else var + str(i).translate(_R11SUP)
                ts.append(xs if cs == "1" else cs + xs)
        return " + ".join(ts) if ts else "0"


_R11F = _R11GF(3, 0b1011)   # GF(2^3)、α^3 = α + 1


def _r11_gen(F, nk, b=1):
    g = [1]
    for j in range(b, b + nk):
        g = F.pmul(g, [F.a(j), 1])
    return g


def _r11_mod(F, A, g):
    A = list(A)
    dg = len(g) - 1
    for i in range(len(A) - 1, dg - 1, -1):
        c = A[i]
        if c:
            for j in range(dg + 1):
                A[i - dg + j] ^= F.mul(c, g[j])
    return A[:dg]


def _r11_berlekamp(F, S):
    """本文の手順どおりのバーレカンプ・マッシー法。各回の記録も返す。"""
    Lam, B, L, dB, jB = [1], [1], 0, 1, 0
    rows = []
    for j in range(1, len(S) + 1):
        d = S[j - 1]
        for i in range(1, L + 1):
            if i < len(Lam) and j - 1 - i >= 0:
                d ^= F.mul(Lam[i], S[j - 1 - i])
        rec = dict(j=j, d=d, Lold=L, Bused=list(B), dBused=dB, jBused=jB, grow=False)
        if d:
            coef = F.div(d, dB)
            sh = [0] * (j - jB) + [F.mul(coef, x) for x in B]
            new = [(Lam[i] if i < len(Lam) else 0) ^ (sh[i] if i < len(sh) else 0)
                   for i in range(max(len(Lam), len(sh)))]
            if 2 * L <= j - 1:
                B, dB, jB, L = list(Lam), d, j, j - L
                rec["grow"] = True
            Lam = new
            rec["coef"] = coef
            rec["shift"] = j - rec["jBused"]
        while len(Lam) > 1 and Lam[-1] == 0:
            Lam.pop()
        rec.update(Lam=list(Lam), L=L, B=list(B), dB=dB, jB=jB)
        rows.append(rec)
    return Lam, L, rows


# ---- 例の値（本文と同じ） ----
_R11G = _r11_gen(_R11F, 4)                                   # x^4 + α^3 x^3 + x^2 + α x + α^3
_R11U = [_R11F.a(2), _R11F.a(5), _R11F.a(1)]                 # u0, u1, u2 = α², α⁵, α
_R11T = [0, 0, 0, 0] + _R11U
_R11R = _r11_mod(_R11F, _R11T, _R11G)
for _i in range(4):
    _R11T[_i] = _R11R[_i]                                    # T = α,α⁵,α²,1,1,α,α²（降冪）
_R11E = [0] * 7
_R11E[1], _R11E[5] = _R11F.a(5), _R11F.a(4)
_R11RCV = [x ^ y for x, y in zip(_R11T, _R11E)]
_R11S = [_R11F.peval(_R11RCV, _R11F.a(j)) for j in range(1, 5)]
_R11LAM, _R11L, _R11BMROWS = _r11_berlekamp(_R11F, _R11S)
assert _R11F.pstr(_R11G) == "x⁴ + α³x³ + x² + αx + α³"
assert [_R11F.name(s) for s in _R11S] == ["1", "0", "α⁶", "α⁵"]
assert _R11F.pstr(_R11LAM) == "α⁶x² + α⁶x + 1"


# ---- 描画の部品 ----
def _r11_sym(x, y, w, h, v, F=_R11F, c=LIN, fill=PAN, tc=INK, sz=14, bits=True, b=True,
             dash=None, sub=None):
    """シンボル 1 個のマス。v は要素（int）か文字列。下に小さくビットを書く。"""
    o = [RECT(x, y, w, h, 5, fill, c, 1.4, dash)]
    main = F.name(v) if isinstance(v, int) else v
    if bits and isinstance(v, int):
        o.append(T(x + w / 2, y + h / 2 - 1, main, "middle", sz, tc, b))
        o.append(T(x + w / 2, y + h / 2 + 13, F.bits(v), "middle", 9.5, MUT, False, True))
    else:
        o.append(T(x + w / 2, y + h / 2 + sz * 0.36, main, "middle", sz, tc, b))
    if sub:
        o.append(T(x + w / 2, y + h + 13, sub, "middle", 10, MUT))
    return "".join(o)


def _r11_strip(x0, y0, vals, F=_R11F, cw=60, ch=46, gap=4, styles=None, pos=True, bits=True,
               sz=14, posy=None):
    """符号語を左が最高次で並べる。vals は降冪のリスト。styles[k] = (線, 塗り, 文字)。"""
    n = len(vals)
    o = []
    for k, v in enumerate(vals):
        x = x0 + k * (cw + gap)
        c, fl, tc = styles[k] if styles and styles[k] else (LIN, PAN, INK)
        dash = "4,3" if (isinstance(v, str) and v in ("?", "")) else None
        o.append(_r11_sym(x, y0, cw, ch, v, F, c, fl, tc, sz, bits, True, dash))
        if pos:
            o.append(T(x + cw / 2, (posy if posy is not None else y0 - 7), str(n - 1 - k), "middle", 10.5, MUT))
    return "".join(o)


def _r11_lbl(x, y, s, c=INK, sz=12, b=True, a="end"):
    return T(x, y, s, a, sz, c, b)


# ===================== 1 節 =====================

def _r11_positions():
    F = _R11F
    o = []
    x0, cw, gap = 150, 70, 6
    rows = [("位置 i", 34), ("要素 αⁱ", 66), ("ビット", 114)]
    o.append(_r11_lbl(136, 49, "位置 i", INK, 12))
    o.append(_r11_lbl(136, 90, "要素 αⁱ", INK, 12))
    o.append(_r11_lbl(136, 128, "ビット", INK, 12))
    for k in range(7):
        i = 6 - k
        x = x0 + k * (cw + gap)
        o.append(RECT(x, 30, cw, 28, 5, SCR, LIN, 1.2))
        o.append(T(x + cw / 2, 49, str(i), "middle", 13, MUT, True))
        o.append(RECT(x, 66, cw, 40, 6, _R11BS, _R11B, 1.4))
        o.append(T(x + cw / 2, 92, F.name(F.a(i)), "middle", 16, INK, True))
        o.append(T(x + cw / 2, 128, F.bits(F.a(i)), "middle", 12, INK, False, True))
        o.append(W(x + cw / 2, 58, x + cw / 2, 66, c=MUT, lw=1.2))
    xz = x0 + 7 * (cw + gap) + 22
    o.append(RECT(xz, 66, cw, 40, 6, PAN, FNT, 1.3, "4,3"))
    o.append(T(xz + cw / 2, 92, "0", "middle", 16, MUT, True))
    o.append(T(xz + cw / 2, 128, "000", "middle", 12, MUT, False, True))
    o.append(T(xz + cw / 2, 49, "位置なし", "middle", 11, MUT))
    o.append(T(x0, 160, "α を掛けるたびに 1 つ左の位置へ進み、7 回で 1 に戻る（α⁷ = 1）。", "start", 11.5, MUT))
    return SVG(800, 172, o, "GF(2³)（α³ = α + 1）の場合。位置 i に要素 αⁱ を対応させると、0 以外の 7 個の要素がちょうど 1 回ずつ現れ、"
               "符号長は n = 2³ − 1 = 7 になる。0 はどの位置にも対応しない。図は多項式の書き方に合わせて最高次の位置 6 を左に置いた。")
F["e11_positions"] = _r11_positions()


def _r11_genpoly():
    F = _R11F
    A = [F.a(3), F.a(4), 1]          # x² + α⁴x + α³（昇冪）
    Bp = [1, F.a(6), 1]              # x² + α⁶x + 1
    o = []
    x0, cw, gap = 230, 84, 6
    cols = ["x⁴", "x³", "x²", "x", "1"]
    o.append(T(20, 26, "(x² + α⁴x + α³) × (x² + α⁶x + 1)", "start", 14, INK, True))
    for k, s in enumerate(cols):
        o.append(T(x0 + k * (cw + gap) + cw / 2, 56, s, "middle", 12, MUT, True))
    labels = ["x² × (x² + α⁶x + 1)", "α⁴x × (x² + α⁶x + 1)", "α³ × (x² + α⁶x + 1)"]
    y = 66
    for r, (deg, lab) in enumerate(zip([2, 1, 0], labels)):
        o.append(T(x0 - 14, y + 26, lab, "end", 12, INK))
        for d in range(3):
            v = F.mul(A[deg], Bp[d])
            e = deg + d                    # 次数
            k = 4 - e
            o.append(_r11_sym(x0 + k * (cw + gap), y, cw, 42, v, F, LIN, PAN, INK, 14))
        y += 50
    o.append(W(x0 - 6, y + 2, x0 + 5 * (cw + gap) - gap + 6, y + 2, c=INK, lw=1.4))
    o.append(T(x0 - 14, y + 34, "列ごとに足す（XOR）", "end", 12, SIG, True))
    P = F.pmul(A, Bp)
    for e in range(4, -1, -1):
        k = 4 - e
        o.append(_r11_sym(x0 + k * (cw + gap), y + 10, cw, 42, P[e], F, SIG, SSOFT, INK, 14))
    o.append(T(20, y + 82, "例: x³ の列は α⁶ + α⁴ = 101 ⊕ 110 = 011 = α³。x² の列は 1 + α³ + α³ = 1（同じものが 2 回で消える）。",
               "start", 11.5, MUT))
    o.append(T(20, y + 102, "掛け算は指数の足し算で、α⁷ = 1 なので指数は 7 で割った余り（例: α⁴ · α⁶ = α¹⁰ = α³）。", "start", 11.5, MUT))
    return SVG(720, y + 116, o, "生成多項式の 2 つの因子の積。左の因子の各項を右の因子に掛け、同じ次数の列にそろえて縦に足す。"
               "結果は g(x) = x⁴ + α³x³ + x² + αx + α³。各マスの下の数字は要素のビット表現。")
F["e11_genpoly"] = _r11_genpoly()


# ===================== 2 節 =====================

def _r11_encdiv():
    F = _R11F
    g = _R11G
    o = []
    x0, cw, gap = 200, 66, 5
    cols = ["x⁶", "x⁵", "x⁴", "x³", "x²", "x", "1"]
    o.append(T(20, 24, "x⁴u(x) を g(x) で割る（g の係数: 1, α³, 1, α, α³）", "start", 13.5, INK, True))
    for k, s in enumerate(cols):
        o.append(T(x0 + k * (cw + gap) + cw / 2, 50, s, "middle", 12, MUT, True))
    A = [0, 0, 0, 0] + list(_R11U)   # 昇冪
    y = 58
    rh = 40

    def row(vals_by_deg, y, style, lab, labc=INK, fade_zero_lead=None):
        out = [T(x0 - 14, y + 25, lab, "end", 12, labc, True)]
        for e in range(6, -1, -1):
            if e not in vals_by_deg:
                continue
            v = vals_by_deg[e]
            k = 6 - e
            c, fl, tc = style
            if fade_zero_lead is not None and e >= fade_zero_lead:
                out.append(_r11_sym(x0 + k * (cw + gap), y, cw, rh - 6, v, F, FNT, PAN, MUT, 13, True, False))
            else:
                out.append(_r11_sym(x0 + k * (cw + gap), y, cw, rh - 6, v, F, c, fl, tc, 13))
        return "".join(out)

    o.append(row({e: A[e] for e in range(7)}, y, (LIN, PAN, INK), "x⁴u(x)"))
    o.append(RECT(x0 - 4, y - 3, 3 * (cw + gap) + 3, rh, 7, "none", _R11B, 1.6, "5,3"))
    cur = list(A)
    qs = []
    for step, top in enumerate([6, 5, 4]):
        q = cur[top]
        qs.append(q)
        sub = {}
        for jj in range(5):
            sub[top - 4 + jj] = F.mul(q, g[jj])
        y += rh
        o.append(row(sub, y, (ALI, ASOFT, INK), "− %s × g" % F.name(q), ALI))
        y += rh
        o.append(W(x0 + (6 - top) * (cw + gap) - 3, y - 4, x0 + 7 * (cw + gap) - gap + 3, y - 4, c=INK, lw=1.3))
        for e, v in sub.items():
            cur[e] ^= v
        shown = {e: cur[e] for e in range(0, top + 1)}
        last = step == 2
        o.append(row(shown, y, (SIG, SSOFT, INK) if last else (LIN, PAN, INK),
                     "余り R(x)" if last else "", SIG if last else INK, fade_zero_lead=top))
    # 商
    y += rh + 12
    o.append(T(20, y, "商 q(x) = %s（各段で g に掛けた倍数 %s を並べたもの。符号化では使わない）"
               % (F.pstr(list(reversed(qs))), "、".join(F.name(q) for q in qs)), "start", 11.5, MUT))
    # 符号語
    y += 30
    o.append(T(20, y + 28, "送る符号語 T(x)", "start", 13, INK, True))
    st = [(_R11B, _R11BS, INK)] * 3 + [(SIG, SSOFT, INK)] * 4
    o.append(_r11_strip(x0, y + 4, list(reversed(_R11T)), F, cw, rh, gap, st, True, True, 14, y - 2))
    o.append(T(x0 + 1.5 * (cw + gap) - gap / 2, y + rh + 24, "情報シンボル u₂ u₁ u₀", "middle", 11.5, _R11B, True))
    o.append(T(x0 + 5 * (cw + gap) - gap / 2, y + rh + 24, "検査シンボル = 余り R", "middle", 11.5, SIG, True))
    return SVG(800, y + rh + 36, o, "GF(2³) 係数の筆算。各段で、いまの最高次の係数を倍数にして g を引く（引き算はビットの XOR）。"
               "灰色の 0 は消えた最高次の項。3 段で余り R(x) = x³ + x² + αx + α² が残り、情報シンボルの後ろに付けて符号語 T(x) にする。"
               "上の小さい数字は位置（x の指数）。")
F["e11_encdiv"] = _r11_encdiv()


# ===================== 3 節 =====================

def _r11_eval():
    F = _R11F
    a = [F.a(5), F.a(4), F.a(6)]   # a0, a1, a2
    o = []
    x0, cw, gap = 190, 74, 6
    o.append(T(20, 24, "a(x) = α⁶x² + α⁴x + α⁵ に x = αⁱ を代入する", "start", 13.5, INK, True))
    labs = [("位置 i", 56), ("x = αⁱ", 86), ("a₀ = α⁵", 118), ("a₁x = α⁴ · αⁱ", 146), ("a₂x² = α⁶ · α²ⁱ", 174),
            ("a(αⁱ)（XOR）", 214), ("2 節の Tᵢ", 262)]
    for s, yy in labs:
        o.append(T(x0 - 14, yy, s, "end", 12, INK if "Tᵢ" not in s else _R11B, True))
    for k in range(7):
        i = 6 - k
        x = x0 + k * (cw + gap)
        xi = F.a(i)
        t0, t1, t2 = a[0], F.mul(a[1], xi), F.mul(a[2], F.mul(xi, xi))
        v = t0 ^ t1 ^ t2
        o.append(T(x + cw / 2, 56, str(i), "middle", 12, MUT, True))
        o.append(T(x + cw / 2, 86, F.name(xi), "middle", 13, INK, True))
        for yy, tv in [(118, t0), (146, t1), (174, t2)]:
            o.append(T(x + cw / 2, yy, F.bits(tv), "middle", 12, INK, False, True))
        o.append(W(x + 8, 184, x + cw - 8, 184, c=INK, lw=1.2))
        o.append(_r11_sym(x, 192, cw, 38, v, F, SIG, SSOFT, INK, 14))
        o.append(_r11_sym(x, 240, cw, 38, _R11T[i], F, _R11B, _R11BS, INK, 14))
        ok = v == _R11T[i]
        o.append(T(x + cw / 2, 296, "一致" if ok else "×", "middle", 11, SIG if ok else ALI, True))
    return SVG(780, 308, o, "評価で作った語（緑）と、2 節で割り算から作った符号語 T（青）を位置ごとに比べる。"
               "各列で 3 つの項のビットを XOR すると a(αⁱ) になる。a は位置 0〜2 の値から連立方程式で求めたが、残りの位置 3〜6 でも一致する。")
F["e11_eval"] = _r11_eval()


def _r11_minweight():
    F = _R11F
    o = []
    x0, cw, gap = 230, 62, 5
    # 上段: T
    o.append(T(20, 40, "a = α⁶x² + α⁴x + α⁵", "start", 12.5, INK, True))
    o.append(T(20, 58, "（2 節の T）", "start", 11, MUT))
    st = [(_R11B, _R11BS, INK)] * 7
    o.append(_r11_strip(x0, 26, list(reversed(_R11T)), F, cw, 44, gap, st, True, True, 14, 18))
    o.append(T(x0 + 7 * (cw + gap) + 10, 54, "重み 7", "start", 13, _R11B, True))
    # 下段: (x − α²)(x − α⁵)
    a = F.pmul([F.a(2), 1], [F.a(5), 1])
    c = [F.peval(a, F.a(i)) for i in range(7)]
    st2 = []
    for i in range(6, -1, -1):
        st2.append((ALI, ASOFT, ALI) if c[i] == 0 else (_R11B, _R11BS, INK))
    o.append(T(20, 140, "a = (x − α²)(x − α⁵)", "start", 12.5, INK, True))
    o.append(T(20, 158, "= x² + α³x + 1", "start", 12.5, INK, True))
    o.append(_r11_strip(x0, 126, [c[i] for i in range(6, -1, -1)], F, cw, 44, gap, st2, True, True, 14, 118))
    o.append(T(x0 + 7 * (cw + gap) + 10, 146, "重み 5", "start", 13, ALI, True))
    o.append(T(x0 + 7 * (cw + gap) + 10, 164, "= n − k + 1", "start", 11.5, ALI))
    for i in (5, 2):
        k = 6 - i
        xx = x0 + k * (cw + gap) + cw / 2
        o.append(T(xx, 190, "a(α%s) = 0" % str(i).translate(_R11SUP), "middle", 10.5, ALI, True))
    o.append(T(20, 222, "0 になるのは a の根に当たる位置だけで、次数 2 の a の根は 2 個以下（補題 2）。したがって重みは 7 − 2 = 5 以上。",
               "start", 11.5, INK))
    return SVG(800, 236, o, "RS(7,3) の 2 つの符号語。上は a が位置の要素を根に持たないので 0 が無い。下は a の根を α² と α⁵ に置いたので、"
               "位置 2 と 5 だけが 0 になり、重みが最小値 d_min = 5 になる。")
F["e11_minweight"] = _r11_minweight()


def _r11_capacity():
    o = []
    x0, bw, bh, gap = 200, 58, 30, 4
    o.append(T(20, 24, "RS(7,3): シンドロームの式は 2t = 4 本", "start", 13.5, INK, True))
    rows = [("誤り 2 個", ["位置", "値", "位置", "値"], True),
            ("消失 4 個", ["値", "値", "値", "値"], True),
            ("誤り 1 個 + 消失 2 個", ["位置", "値", "値", "値"], True),
            ("誤り 3 個", ["位置", "値", "位置", "値", "位置", "値"], False)]
    y = 48
    for name, blocks, ok in rows:
        o.append(T(x0 - 14, y + 20, name, "end", 12.5, INK, True))
        for k, bl in enumerate(blocks):
            x = x0 + k * (bw + gap)
            isp = bl == "位置"
            c, fl = (ALI, ASOFT) if isp else (_R11B, _R11BS)
            o.append(RECT(x, y, bw, bh, 5, fl, c, 1.4))
            o.append(T(x + bw / 2, y + 20, bl, "middle", 11.5, c, True))
        xr = x0 + 6 * (bw + gap) + 16
        o.append(T(xr, y + 20, ("未知数 %d ≤ 4 → 解ける" if ok else "未知数 %d > 4 → 解けない") % len(blocks),
                   "start", 12, SIG if ok else ALI, True))
        y += bh + 14
    xl = x0 + 4 * (bw + gap) - gap / 2
    o.append(W(xl, 38, xl, y - 4, c=INK, lw=1.6, dash="5,4"))
    o.append(T(xl, y + 12, "式の本数 = 4", "middle", 11.5, INK, True))
    o.append(T(20, y + 40, "誤りは位置と値の 2 つが未知、消失は値だけが未知。条件 2ν + ρ ≤ n − k は「未知数 ≤ 式の本数」と同じ形。",
               "start", 11.5, MUT))
    return SVG(800, y + 54, o, "誤り（位置が分からない）と消失（位置が分かる）で、未知数の数え方が違う。"
               "赤が位置、青が値の未知数。点線までに収まれば、シンドロームから解ける。")
F["e11_capacity"] = _r11_capacity()


def _r11_shorten():
    o = []
    y1, h = 58, 40
    o.append(T(20, 26, "RS(255,251) の符号語（255 シンボル）", "start", 13, INK, True))
    # 0 の部分（省略して描く）
    xz, wz = 20, 380
    o.append(RECT(xz, y1, wz, h, 6, SCR, FNT, 1.3, "5,3"))
    o.append(T(xz + wz / 2, y1 + 25, "0 0 0 … 0 （223 個。常に 0）", "middle", 12.5, MUT, True))
    o.append(T(xz, y1 - 8, "位置 254", "start", 10.5, MUT))
    xi, wi = xz + wz + 6, 230
    o.append(RECT(xi, y1, wi, h, 6, _R11BS, _R11B, 1.5))
    o.append(T(xi + wi / 2, y1 + 25, "情報 28 個", "middle", 12.5, _R11B, True))
    o.append(T(xi, y1 - 8, "31", "start", 10.5, MUT))
    xc, wc = xi + wi + 6, 110
    o.append(RECT(xc, y1, wc, h, 6, SSOFT, SIG, 1.5))
    o.append(T(xc + wc / 2, y1 + 25, "検査 4 個", "middle", 12.5, SIG, True))
    o.append(T(xc, y1 - 8, "3", "start", 10.5, MUT))
    o.append(T(xc + wc, y1 - 8, "0", "end", 10.5, MUT))
    # 送るもの
    y2 = 158
    o.append(T(20, y2 - 18, "実際に送る RS(32,28) の符号語（32 シンボル）", "start", 13, INK, True))
    o.append(ARR(xi + wi / 2, y1 + h + 4, xi + wi / 2, y2 - 4, MUT, 1.4))
    o.append(ARR(xc + wc / 2, y1 + h + 4, xc + wc / 2, y2 - 4, MUT, 1.4))
    o.append(RECT(xi, y2, wi, h, 6, _R11BS, _R11B, 1.5))
    o.append(T(xi + wi / 2, y2 + 25, "情報 28 個", "middle", 12.5, _R11B, True))
    o.append(RECT(xc, y2, wc, h, 6, SSOFT, SIG, 1.5))
    o.append(T(xc + wc / 2, y2 + 25, "検査 4 個", "middle", 12.5, SIG, True))
    o.append(T(xz + wz / 2, y2 + 18, "送らない", "middle", 12, MUT, True))
    o.append(T(xz + wz / 2, y2 + 36, "（受信側が 0 を補って復号する）", "middle", 11, MUT))
    o.append(T(20, y2 + h + 34, "検査シンボルは 4 個のままなので、最小距離 5・訂正能力 t = 2 も変わらない。", "start", 11.5, INK))
    return SVG(800, y2 + h + 48, o, "短縮符号。CD の C1 符号 RS(32,28) は、RS(255,251) の符号語のうち上位 223 個の情報シンボルを "
               "0 に固定したものである。")
F["e11_shorten"] = _r11_shorten()


# ===================== 4 節 =====================

def _r11_decflow():
    o = []
    steps = [("① シンドローム", "Sⱼ = r(αʲ)", "j = 1, …, 2t", "2t 個の値"),
             ("② 誤り位置多項式", "Λ(x) の係数", "連立方程式 / BM 法", "個数 ν と Λ(x)"),
             ("③ チェン探索", "Λ(α⁻ⁱ) = 0", "となる位置 i", "誤り位置 iₗ"),
             ("④ フォニー", "Yₗ = −Ω/Λ′", "（X = αⁱ で評価）", "誤り値 Yₗ"),
             ("⑤ 訂正", "c = r − e", "（XOR）", "送った符号語")]
    x, y, w, h, gap = 64, 40, 132, 92, 22
    o.append(T(22, y + h / 2 + 5, "r(x)", "middle", 13, ALI, True))
    o.append(ARR(38, y + h / 2, x - 3, y + h / 2, MUT, 1.5))
    for k, (t1, t2, t3, out) in enumerate(steps):
        xx = x + k * (w + gap)
        o.append(RECT(xx, y, w, h, 9, SSOFT if k != 4 else _R11BS, SIG if k != 4 else _R11B, 1.5))
        o.append(T(xx + w / 2, y + 22, t1, "middle", 12.5, INK, True))
        o.append(T(xx + w / 2, y + 48, t2, "middle", 12.5, INK, True))
        o.append(T(xx + w / 2, y + 70, t3, "middle", 10.5, MUT))
        o.append(T(xx + w / 2, y + h + 22, "→ " + out, "middle", 11.5, SIG if k != 4 else _R11B, True))
        if k < 4:
            o.append(ARR(xx + w + 2, y + h / 2, xx + w + gap - 3, y + h / 2, MUT, 1.5))
    o.append(T(x, y + h + 52, "①〜④で誤りパターン e(x) の位置と値を求め、⑤で受信語から取り除く。② と ③ が位置、④ が値を受け持つ。",
               "start", 11.5, MUT))
    return SVG(860, y + h + 66, o, "リード・ソロモン符号の復号の 5 段。受信者が知っているのは受信語 r(x) だけである。")
F["e11_decflow"] = _r11_decflow()


def _r11_received():
    F = _R11F
    o = []
    x0, cw, gap = 150, 64, 5
    T_ = list(reversed(_R11T))
    E_ = list(reversed(_R11E))
    R_ = list(reversed(_R11RCV))
    o.append(T(x0 - 14, 52, "送った c = T", "end", 12.5, _R11B, True))
    o.append(_r11_strip(x0, 30, T_, F, cw, 42, gap, [(_R11B, _R11BS, INK)] * 7, True, True, 14, 22))
    o.append(T(x0 - 14, 112, "誤り e", "end", 12.5, ALI, True))
    st = [((ALI, ASOFT, ALI) if v else (FNT, PAN, MUT)) for v in E_]
    o.append(_r11_strip(x0, 90, E_, F, cw, 42, gap, st, False, True, 14))
    o.append(T(24, 112, "+", "middle", 16, MUT, True))
    o.append(W(x0 - 4, 140, x0 + 7 * (cw + gap) - gap + 4, 140, c=INK, lw=1.3))
    o.append(T(x0 - 14, 170, "受信 r", "end", 12.5, INK, True))
    st = [((ALI, ASOFT, INK) if e else (LIN, PAN, INK)) for e in E_]
    o.append(_r11_strip(x0, 148, R_, F, cw, 42, gap, st, False, True, 14))
    return SVG(660, 202, o, "例の誤り。位置 5 に α⁴、位置 1 に α⁵ が足される（位置ごとにビットの XOR）。"
               "受信者が見るのは一番下の r だけで、どこが変わったかは分からない。")
F["e11_received"] = _r11_received()


def _r11_horner():
    F = _R11F
    o = []
    x0, cw, gap = 150, 66, 6
    R_ = list(reversed(_R11RCV))
    o.append(T(x0 - 14, 46, "rᵢ", "end", 13, INK, True))
    for k, v in enumerate(R_):
        x = x0 + k * (cw + gap)
        o.append(T(x + cw / 2, 18, "r" + str(6 - k).translate(_R11SUB), "middle", 11, MUT))
        o.append(_r11_sym(x, 26, cw, 36, v, F, LIN, SCR, INK, 13))
    y = 82
    for j in range(1, 5):
        aj = F.a(j)
        o.append(T(x0 - 14, y + 22, "j = %d（×%s）" % (j, F.name(aj)), "end", 12, INK, True))
        s = 0
        for k, v in enumerate(R_):
            s = F.mul(s, aj) ^ v
            x = x0 + k * (cw + gap)
            last = k == 6
            o.append(_r11_sym(x, y, cw, 36, s, F, SIG if last else LIN, SSOFT if last else PAN, INK, 13))
            if k < 6:
                o.append(ARR(x + cw + 0.5, y + 18, x + cw + gap - 0.5, y + 18, MUT, 1.1, 4))
        o.append(T(x0 + 7 * (cw + gap) + 4, y + 23, "= S%s" % str(j).translate(_R11SUB), "start", 13, SIG, True))
        y += 48
    o.append(T(20, y + 12, "例（j = 1 の 2 マス目）: α × α = α²、これに r₅ = 1 を足して α² + 1 = 100 ⊕ 001 = 101 = α⁶。",
               "start", 11.5, MUT))
    return SVG(720, y + 26, o, "ホーナー法によるシンドロームの計算。各マスは「左のマスの値 × αʲ」に上の rᵢ を足したもので、"
               "左端は r₆ そのもの。右端が Sⱼ = r(αʲ) になる。")
F["e11_horner"] = _r11_horner()


def _r11_lambda():
    F = _R11F
    o = []
    x0, cw, gap = 30, 46, 4
    E_ = list(reversed(_R11E))
    st = [((ALI, ASOFT, ALI) if v else (FNT, PAN, MUT)) for v in E_]
    o.append(T(x0, 22, "誤りの位置（受信者はまだ知らない）", "start", 12, MUT, True))
    o.append(_r11_strip(x0, 42, ["" if not v else "誤り" for v in E_], F, cw, 34, gap, st, True, False, 11.5, 36))
    # 位置元
    xs = {5: x0 + 1 * (cw + gap) + cw / 2, 1: x0 + 5 * (cw + gap) + cw / 2}
    o.append(ARR(xs[5], 80, xs[5], 104, ALI, 1.4))
    o.append(ARR(xs[1], 80, xs[1], 104, ALI, 1.4))
    o.append(T(xs[5], 122, "X₂ = α⁵", "middle", 12.5, ALI, True))
    o.append(T(xs[1], 122, "X₁ = α", "middle", 12.5, ALI, True))
    # Λ
    xr = 420
    o.append(T(xr, 40, "Λ(x) = (1 − αx)(1 − α⁵x)", "start", 13.5, INK, True))
    o.append(T(xr, 64, "Λ₁ = α + α⁵ = 010 ⊕ 111 = 101 = α⁶", "start", 12, INK))
    o.append(T(xr, 86, "Λ₂ = α · α⁵ = α⁶", "start", 12, INK))
    o.append(T(xr, 112, "Λ(x) = 1 + α⁶x + α⁶x²", "start", 13.5, SIG, True))
    o.append(T(xr, 142, "根: x = X₁⁻¹ = α⁻¹ = α⁶、 x = X₂⁻¹ = α⁻⁵ = α²", "start", 12, INK))
    o.append(T(xr, 162, "（因子 1 − Xₗx が 0 になる x）", "start", 11, MUT))
    return SVG(800, 176, o, "例の誤り位置から誤り位置多項式を作ると、係数は位置元の和と積になる。"
               "根は位置元の逆数なので、根が分かれば誤り位置が分かる。受信者は逆に、シンドロームから係数を求める。")
F["e11_lambda"] = _r11_lambda()


def _r11_lfsr():
    F = _R11F
    o = []
    # レジスタ
    cx, cy = 110, 70
    o.append(T(cx + 70, 28, "Λ₁ = α⁶、Λ₂ = α⁶ の LFSR", "middle", 13, INK, True))
    o.append(RECT(cx, cy, 70, 40, 6, SSOFT, SIG, 1.5))
    o.append(T(cx + 35, cy + 25, "Sⱼ₊₁", "middle", 13, INK, True))
    o.append(RECT(cx + 90, cy, 70, 40, 6, SSOFT, SIG, 1.5))
    o.append(T(cx + 125, cy + 25, "Sⱼ", "middle", 13, INK, True))
    o.append(ARR(cx + 70, cy + 20, cx + 88, cy + 20, MUT, 1.4))
    o.append(T(cx + 80, cy - 8, "1 つ右へ", "middle", 10, MUT))
    # 係数
    for k, (xx, lab) in enumerate([(cx + 35, "× Λ₁ = α⁶"), (cx + 125, "× Λ₂ = α⁶")]):
        o.append(W(xx, cy + 40, xx, cy + 70, c=MUT, lw=1.4))
        o.append(RECT(xx - 40, cy + 70, 80, 26, 5, PAN, _R11B, 1.3))
        o.append(T(xx, cy + 88, lab, "middle", 11.5, _R11B, True))
        o.append(ARR(xx, cy + 96, xx + (45 if k == 0 else -45), cy + 128, MUT, 1.3))
    o.append(CIRC(cx + 80, cy + 140, 14, INK, 1.5, PAN))
    o.append(T(cx + 80, cy + 145, "+", "middle", 15, INK, True))
    o.append(W(cx + 66, cy + 140, cx - 40, cy + 140, cx - 40, cy + 20, c=MUT, lw=1.4))
    o.append(ARR(cx - 40, cy + 20, cx - 2, cy + 20, MUT, 1.4))
    o.append(T(cx - 46, cy + 86, "Sⱼ₊₂", "end", 12.5, SIG, True))
    o.append(ARR(cx + 160, cy + 20, cx + 196, cy + 20, MUT, 1.4))
    o.append(T(cx + 200, cy + 25, "出力", "start", 11, MUT))
    # 数列
    xr = 470
    o.append(T(xr, 40, "作られる数列（S₁, S₂ が初期値）", "start", 12.5, INK, True))
    rows = [("S₁", "1", "初期値"), ("S₂", "0", "初期値"),
            ("S₃", "α⁶·S₂ + α⁶·S₁ = 0 + α⁶ = α⁶", ""), ("S₄", "α⁶·S₃ + α⁶·S₂ = α¹² + 0 = α⁵", "")]
    for k, (a, b, c) in enumerate(rows):
        yy = 72 + k * 30
        o.append(T(xr, yy, a, "start", 12.5, SIG, True))
        o.append(T(xr + 34, yy, b, "start", 12.5, INK))
        if c:
            o.append(T(xr + 34 + 26, yy, c, "start", 11, MUT))
    o.append(T(xr, 72 + 4 * 30 + 6, "→ ステップ 1 のシンドロームと一致する", "start", 12, SIG, True))
    return SVG(800, 236, o, "関係式 Sⱼ₊₂ = Λ₁Sⱼ₊₁ + Λ₂Sⱼ（標数 2 なので符号は不要）を装置にしたもの。"
               "直前の 2 個の値に係数を掛けて足し、次の値を作る。正しい Λ なら、S₁, S₂ から S₃, S₄ を作り出せる。")
F["e11_lfsr"] = _r11_lfsr()


def _r11_bm():
    F = _R11F
    S = _R11S
    o = []
    cols = [("j", 26), ("Sⱼ", 40), ("ずれ Δ", 240), ("長さを増やすか", 140), ("補正", 150), ("後の Λ(x)", 136), ("L", 28)]
    x = 14
    xs = []
    for name, w in cols:
        xs.append((x, w))
        x += w
    W_ = x + 14
    y0 = 20
    o.append(RECT(14, y0, W_ - 28, 30, 6, SCR, LIN, 1.2))
    for (cx, w), (name, _) in zip(xs, cols):
        o.append(T(cx + w / 2, y0 + 20, name, "middle", 11.5, MUT, True))
    dtxt = ["S₁ = 1", "S₂ + Λ₁S₁ = 0 + 1 = 1", "S₃ + Λ₁S₂ = α⁶ + 0 = α⁶", "S₄ + Λ₁S₃ + Λ₂S₂ = α⁵ + 0 + 0 = α⁵"]
    y = y0 + 36
    for r in _R11BMROWS:
        j = r["j"]
        grow = r["grow"]
        rh = 44
        o.append(RECT(14, y, W_ - 28, rh, 6, SSOFT if grow else PAN, SIG if grow else LIN, 1.2))
        vals = [str(j), F.name(S[j - 1]), dtxt[j - 1],
                ("2L = %d ≤ %d → 増やす" if grow else "2L = %d > %d → そのまま") % (2 * r["Lold"], j - 1),
                "− (%s/%s)·x%s·B" % (F.name(r["d"]), F.name(r["dBused"]), str(r["shift"]).translate(_R11SUP) if r["shift"] > 1 else ""),
                F.pasc(r["Lam"]),
                str(r["L"])]
        for (cx, w), v, k in zip(xs, vals, range(7)):
            col = INK
            if k == 3:
                col = SIG if grow else MUT
            if k == 5:
                col = INK
            o.append(T(cx + w / 2, y + 18, v, "middle", 11.5 if k not in (0, 6) else 12.5, col, k in (0, 5, 6)))
        sub = ""
        if grow:
            sub = "B ← 補正前の Λ = %s、Δ_B ← %s、j_B ← %d" % (F.pasc(r["B"]), F.name(r["dB"]), r["jB"])
        else:
            sub = "B = %s、Δ_B = %s、j_B = %d のまま" % (F.pasc(r["B"]), F.name(r["dB"]), r["jB"])
        o.append(T(xs[2][0] + 6, y + 36, sub, "start", 10, MUT))
        y += rh + 6
    o.append(T(14, y + 14, "補正の列は Λ ← Λ − (Δ/Δ_B)·xˢ·B（s = j − j_B）。Δ の式の Λ₁, Λ₂ は直前の行の Λ の係数（j = 2 では Λ = 1 + x なので Λ₁ = 1）。",
               "start", 11, MUT))
    return SVG(W_, y + 28, o, "S₁〜S₄ = 1, 0, α⁶, α⁵ に対するバーレカンプ・マッシー法の 4 回。緑の行で LFSR の長さ L が増える。"
               "最後の Λ(x) = 1 + α⁶x + α⁶x² は連立方程式の解と一致し、L = 2 が誤りの個数である。")
F["e11_bm"] = _r11_bm()


def _r11_chien():
    F = _R11F
    o = []
    x0, cw, gap = 200, 70, 6
    R_ = list(reversed(_R11RCV))
    o.append(T(x0 - 14, 44, "受信 r", "end", 12.5, INK, True))
    o.append(_r11_strip(x0, 22, R_, F, cw, 40, gap, None, True, True, 13, 14))
    labs = [("x = α⁻ⁱ", 92), ("1", 120), ("α⁶ · x", 144), ("α⁶ · x²", 168), ("Λ(x)", 210)]
    for s, yy in labs:
        o.append(T(x0 - 14, yy, s, "end", 12, INK, True))
    for k in range(7):
        i = 6 - k
        x = x0 + k * (cw + gap)
        xv = F.a(-i)
        t1, t2 = F.mul(_R11LAM[1], xv), F.mul(_R11LAM[2], F.mul(xv, xv))
        v = 1 ^ t1 ^ t2
        o.append(T(x + cw / 2, 92, F.name(xv), "middle", 13, INK, True))
        o.append(T(x + cw / 2, 120, F.bits(1), "middle", 12, INK, False, True))
        o.append(T(x + cw / 2, 144, F.bits(t1), "middle", 12, INK, False, True))
        o.append(T(x + cw / 2, 168, F.bits(t2), "middle", 12, INK, False, True))
        o.append(W(x + 8, 178, x + cw - 8, 178, c=INK, lw=1.2))
        z = v == 0
        o.append(_r11_sym(x, 186, cw, 38, v, F, ALI if z else LIN, ASOFT if z else PAN, ALI if z else INK, 14))
        if z:
            o.append(T(x + cw / 2, 244, "誤り", "middle", 12, ALI, True))
    return SVG(760, 256, o, "チェン探索。位置 i ごとに x = α⁻ⁱ を Λ(x) = 1 + α⁶x + α⁶x² に代入し、3 つの項のビットを XOR する。"
               "0 になった位置 5 と 1 が誤り位置で、根の個数 2 は L = 2 と一致する。")
F["e11_chien"] = _r11_chien()


def _r11_forney():
    F = _R11F
    o = []
    # 左: 積の各次数
    o.append(T(20, 24, "① Ω(x) = S(x)Λ(x) mod x⁴", "start", 13, INK, True))
    o.append(T(20, 46, "S(x) = 1 + 0·x + α⁶x² + α⁵x³、 Λ(x) = 1 + α⁶x + α⁶x²", "start", 11.5, MUT))
    rows = [("x⁰", "S₁·1", "1", "1"),
            ("x¹", "S₁·α⁶ + S₂·1", "α⁶ + 0", "α⁶"),
            ("x²", "S₁·α⁶ + S₂·α⁶ + S₃·1", "α⁶ + 0 + α⁶", "0"),
            ("x³", "S₂·α⁶ + S₃·α⁶ + S₄·1", "0 + α¹² + α⁵ = α⁵ + α⁵", "0")]
    y = 74
    for deg, f1, f2, res in rows:
        o.append(T(30, y, deg, "start", 12.5, MUT, True))
        o.append(T(64, y, f1, "start", 12, INK))
        o.append(T(230, y, "= " + f2, "start", 12, INK))
        o.append(T(445, y, "= " + res, "start", 12.5, SIG, True))
        y += 24
    o.append(T(30, y, "x⁴, x⁵ の項は mod x⁴ で捨てる", "start", 11.5, MUT))
    y += 26
    o.append(T(30, y, "Ω(x) = 1 + α⁶x", "start", 13.5, SIG, True))
    # 右: 形式的微分
    xr = 530
    o.append(T(xr, 24, "② Λ′(x)（形式的微分）", "start", 13, INK, True))
    o.append(T(xr, 56, "Λ = 1 + α⁶x + α⁶x²", "start", 12, INK))
    o.append(T(xr, 82, "α⁶x → 1·α⁶ = α⁶", "start", 12, INK))
    o.append(T(xr, 106, "α⁶x² → 2·α⁶x = 0", "start", 12, MUT))
    o.append(T(xr, 126, "（2 = 1 + 1 = 0）", "start", 11, MUT))
    o.append(T(xr, 154, "Λ′(x) = α⁶", "start", 13.5, SIG, True))
    # 下: 値
    y += 34
    o.append(T(20, y, "③ 誤り位置ごとに Y = Ω(X⁻¹) / Λ′(X⁻¹)", "start", 13, INK, True))
    y += 12
    cards = [("位置 1（X⁻¹ = α⁶）", "Ω(α⁶) = 1 + α⁶·α⁶ = 1 + α⁵", "= 001 ⊕ 111 = 110 = α⁴", "Y = α⁴ / α⁶ = α⁻² = α⁵"),
             ("位置 5（X⁻¹ = α²）", "Ω(α²) = 1 + α⁶·α² = 1 + α", "= 001 ⊕ 010 = 011 = α³", "Y = α³ / α⁶ = α⁻³ = α⁴")]
    for k, (h1, l1, l2, l3) in enumerate(cards):
        xx = 20 + k * 390
        o.append(RECT(xx, y, 370, 110, 8, PAN, LIN, 1.3))
        o.append(T(xx + 14, y + 24, h1, "start", 12.5, ALI, True))
        o.append(T(xx + 14, y + 50, l1, "start", 12, INK))
        o.append(T(xx + 14, y + 72, l2, "start", 12, INK))
        o.append(T(xx + 14, y + 98, l3, "start", 13, SIG, True))
    return SVG(800, y + 124, o, "フォニー・アルゴリズムの計算。① シンドローム多項式と Λ の積の x⁴ 未満の項を集めて Ω を作り、"
               "② Λ を形式的微分し（偶数次の項は消える）、③ 誤り位置の X⁻¹ を代入して割る。求めた誤り値は、加えた α⁵ と α⁴ に一致する。")
F["e11_forney"] = _r11_forney()


def _r11_correct():
    F = _R11F
    o = []
    x0, cw, gap = 150, 64, 5
    R_ = list(reversed(_R11RCV))
    E_ = list(reversed(_R11E))
    T_ = list(reversed(_R11T))
    o.append(T(x0 - 14, 52, "受信 r", "end", 12.5, INK, True))
    st = [((ALI, ASOFT, INK) if e else (LIN, PAN, INK)) for e in E_]
    o.append(_r11_strip(x0, 30, R_, F, cw, 42, gap, st, True, True, 14, 22))
    o.append(T(x0 - 14, 112, "求めた誤り", "end", 12.5, ALI, True))
    st = [((ALI, ASOFT, ALI) if v else (FNT, PAN, MUT)) for v in E_]
    o.append(_r11_strip(x0, 90, E_, F, cw, 42, gap, st, False, True, 14))
    o.append(T(24, 112, "−", "middle", 16, MUT, True))
    o.append(W(x0 - 4, 140, x0 + 7 * (cw + gap) - gap + 4, 140, c=INK, lw=1.3))
    o.append(T(x0 - 14, 170, "訂正後 c", "end", 12.5, _R11B, True))
    o.append(_r11_strip(x0, 148, T_, F, cw, 42, gap, [(_R11B, _R11BS, INK)] * 7, False, True, 14))
    o.append(T(x0 + 7 * (cw + gap) + 6, 175, "= T", "start", 13, SIG, True))
    return SVG(700, 202, o, "ステップ 5。求めた誤り値を誤り位置から引く（XOR）。位置 1 は α⁶ + α⁵ = α、位置 5 は 1 + α⁴ = α⁵ となり、"
               "送った符号語 T に戻る。")
F["e11_correct"] = _r11_correct()


def _r11_decode_info(e):
    """誤りパターン e（昇冪）を T に加えたときの復号の結果"""
    F = _R11F
    r = [x ^ y for x, y in zip(_R11T, e)]
    S = [F.peval(r, F.a(j)) for j in range(1, 5)]
    Lam, L, _ = _r11_berlekamp(F, S)
    roots = [i for i in range(7) if F.peval(Lam, F.a(-i)) == 0]
    out = None
    if L <= 2 and len(roots) == L:
        Om = F.pmul(S, Lam)[:4]
        dL = [Lam[i] if i % 2 == 1 else 0 for i in range(1, len(Lam))]
        out = list(r)
        for i in roots:
            xi = F.a(-i)
            out[i] ^= F.div(F.peval(Om, xi), F.peval(dL, xi))
    return S, Lam, L, roots, out


def _r11_overcap():
    F = _R11F
    o = []
    x0, cw, gap = 170, 46, 4
    cases = []
    e2 = list(_R11E)
    eB = list(_R11E); eB[3] = F.a(2)
    eC = list(_R11E); eC[6] = F.a(5)
    cases = [("誤り 2 個（例）", e2), ("誤り 3 個（位置 3 に α² を追加）", eB), ("誤り 3 個（位置 6 に α⁵ を追加）", eC)]
    y = 22
    for k, (title, e) in enumerate(cases):
        S, Lam, L, roots, out = _r11_decode_info(e)
        E_ = list(reversed(e))
        if out is not None and out == _R11T:
            verdict, vc = "訂正成功（送った T に戻る）", SIG
        elif out is None:
            verdict, vc = "根 %d 個 ≠ L = %d → 失敗を検出" % (len(roots), L), _R11B
        else:
            diff = sum(1 for a_, b_ in zip(out, _R11T) if a_ != b_)
            verdict, vc = "誤訂正: 別の符号語を出力（T と %d か所違う）" % diff, ALI
        o.append(RECT(14, y, 772, 112, 8, PAN, LIN, 1.2))
        o.append(T(28, y + 20, title, "start", 12.5, INK, True))
        st = [((ALI, ASOFT, ALI) if v else (FNT, PAN, MUT)) for v in E_]
        o.append(T(28, y + 62, "誤り e", "start", 11.5, MUT))
        o.append(_r11_strip(x0 - 90, y + 44, E_, F, cw, 34, gap, st, True, False, 12, y + 39))
        xr = x0 - 90 + 7 * (cw + gap) + 16
        o.append(T(xr, y + 46, "S = " + ", ".join(F.name(s) for s in S), "start", 11.5, INK))
        lam = F.pasc(Lam)
        o.append(T(xr, y + 66, "Λ = %s（L = %d）" % (lam, L), "start", 11.5, INK))
        o.append(T(xr, y + 86, "チェン探索の根: " + ("位置 " + "、".join(str(i) for i in sorted(roots, reverse=True)) if roots else "なし"),
                   "start", 11.5, INK))
        o.append(T(28, y + 100, "→ " + verdict, "start", 12.5, vc, True))
        y += 122
    return SVG(800, y + 4, o, "訂正能力 t = 2 を超えると。上: 2 個なら正しく訂正される。中: 3 個目を加えると、見つかる根の個数が L と合わず、"
               "失敗が分かる（35 通り中 32 通り）。下: 別の符号語の近くに入ると、矛盾なく誤った訂正をする（35 通り中 3 通り）。")
F["e11_overcap"] = _r11_overcap()


# ===================== 5 節 =====================

def _r11_erasure():
    F = _R11F
    o = []
    pos = [3, 4, 5, 6]
    r = list(_R11T)
    for p in pos:
        r[p] = 0
    S = [F.peval(r, F.a(j)) for j in range(1, 5)]
    Lam = [1]
    for p in pos:
        Lam = F.pmul(Lam, [1, F.a(p)])
    Om = F.pmul(S, Lam)[:4]
    dL = [Lam[i] if i % 2 == 1 else 0 for i in range(1, len(Lam))]
    x0, cw, gap = 160, 60, 5
    R_ = ["?" if (6 - k) in pos else r[6 - k] for k in range(7)]
    st = [((FNT, SCR, MUT) if (6 - k) in pos else (LIN, PAN, INK)) for k in range(7)]
    o.append(T(x0 - 14, 46, "受信", "end", 12.5, INK, True))
    o.append(_r11_strip(x0, 24, R_, F, cw, 40, gap, st, True, True, 14, 16))
    o.append(T(x0 + 7 * (cw + gap) + 6, 42, "? は 0 として計算する", "start", 11, MUT))
    xL = 20
    y = 100
    lines = [("① シンドローム", "S₁, …, S₄ = " + ", ".join(F.name(s) for s in S)),
             ("② 位置から直接", "Λ(x) = (1 − α³x)(1 − α⁴x)(1 − α⁵x)(1 − α⁶x) = " + F.pasc(Lam)),
             ("③ フォニー", "Ω(x) = S(x)Λ(x) mod x⁴ = %s、 Λ′(x) = %s" % (F.pasc(Om), F.pasc(dL)))]
    for h, s in lines:
        o.append(T(xL, y, h, "start", 12, SIG, True))
        o.append(T(xL + 112, y, s, "start", 12, INK))
        y += 26
    y += 6
    cw2 = 182
    for k, p in enumerate(sorted(pos, reverse=True)):
        xx = 20 + k * (cw2 + 8)
        xi = F.a(-p)
        om, dl = F.peval(Om, xi), F.peval(dL, xi)
        Y = F.div(om, dl)
        o.append(RECT(xx, y, cw2, 92, 8, PAN, LIN, 1.2))
        o.append(T(xx + 10, y + 20, "位置 %d（X⁻¹ = %s）" % (p, F.name(xi)), "start", 11.5, INK, True))
        o.append(T(xx + 10, y + 42, "Ω = %s、Λ′ = %s" % (F.name(om), F.name(dl)), "start", 11.5, INK))
        o.append(T(xx + 10, y + 64, "Y = %s / %s = %s" % (F.name(om), F.name(dl), F.name(Y)), "start", 12, SIG, True))
        ok = Y == _R11T[p]
        o.append(T(xx + 10, y + 84, ("元の T%s = %s と一致" % (str(p).translate(_R11SUB), F.name(_R11T[p]))) if ok else "×",
                   "start", 10.5, MUT))
    y += 108
    o.append(T(x0 - 14, y + 22, "復元", "end", 12.5, _R11B, True))
    st2 = [((_R11B, _R11BS, INK) if (6 - k) in pos else (LIN, PAN, INK)) for k in range(7)]
    o.append(_r11_strip(x0, y, list(reversed(_R11T)), F, cw, 40, gap, st2, False, True, 14))
    o.append(T(x0 + 7 * (cw + gap) + 6, y + 26, "= T", "start", 13, SIG, True))
    return SVG(800, y + 54, o, "消失 4 個の復元。位置が分かっているので Λ を位置から直接作り、ステップ 1 とステップ 4 だけで値が求まる。"
               "情報シンボルが 1 つも残っていなくても、元の符号語 T に戻る。")
F["e11_erasure"] = _r11_erasure()


# ===================== 6 節 =====================

def _r11_burstbytes():
    o = []
    bw, x0 = 19, 30

    def bytes_row(y, start, b, title):
        out = [T(20, y - 12, title, "start", 12.5, INK, True)]
        nbytes = 4
        hit = set(range(start, start + b))
        touched = set()
        for B in range(nbytes):
            for bit in range(8):
                idx = B * 8 + bit
                x = x0 + idx * bw + B * 8
                on = idx in hit
                if on:
                    touched.add(B)
                out.append(RECT(x, y, bw - 2, 24, 3, ASOFT if on else PAN, ALI if on else LIN, 1.2))
            xb = x0 + B * (8 * bw + 8)
            out.append(T(xb + 4 * bw - 1, y + 42, "バイト %d" % (B + 1), "middle", 11, ALI if B in touched else MUT, B in touched))
        for B in range(nbytes):
            if B in touched:
                xb = x0 + B * (8 * bw + 8)
                out.append(RECT(xb - 3, y - 4, 8 * bw + 4, 32, 5, "none", ALI, 1.6, "5,3"))
        out.append(T(x0 + 4 * (8 * bw + 8) + 6, y + 18, "→ %d バイト" % len(touched), "start", 13, ALI, True))
        return "".join(out)

    o.append(bytes_row(40, 0, 10, "バイトの先頭から始まる場合（10 ビット）"))
    o.append(bytes_row(126, 7, 10, "バイトの最後のビットから始まる場合（同じ 10 ビット、最悪）"))
    o.append(T(20, 206, "最悪の場合 = 最初のバイトの 1 ビット + 残り b − 1 ビットが覆う ⌈(b − 1)/8⌉ バイト = ⌈(b − 1)/8⌉ + 1 バイト",
               "start", 11.5, INK))
    o.append(T(20, 228, "RS(255,223)（t = 16）: ⌈(b − 1)/8⌉ + 1 ≤ 16 ⇔ b ≤ 121。先頭がそろっていれば ⌈b/8⌉ ≤ 16 ⇔ b ≤ 128。",
               "start", 11.5, SIG, True))
    return SVG(800, 242, o, "1 マスが 1 ビット、8 マスが 1 バイト（1 シンボル）。同じ長さのバーストでも、始まる位置によって壊れるシンボルの数が変わる。")
F["e11_burstbytes"] = _r11_burstbytes()


def _r11_rsbch():
    o = []
    x0, W0 = 210, 560
    scale = W0 / 2047.0
    rows = [("RS(255,223)", 1784, 256, "t = 16 シンボル"), ("2 元 BCH(2047,892)", 892, 1155, "t = 121 ビット")]
    y = 40
    o.append(T(20, 22, "長さ約 2040 ビットで、121 ビットのバーストを必ず訂正できる 2 つの符号", "start", 13, INK, True))
    for name, d, c, note in rows:
        o.append(T(x0 - 12, y + 22, name, "end", 12.5, INK, True))
        o.append(T(x0 - 12, y + 40, note, "end", 10.5, MUT))
        wd, wc = d * scale, c * scale
        o.append(RECT(x0, y, wd, 30, 4, _R11BS, _R11B, 1.4))
        o.append(T(x0 + wd / 2, y + 20, "情報 %d ビット" % d, "middle", 11.5, _R11B, True))
        o.append(RECT(x0 + wd, y, wc, 30, 4, SSOFT, SIG, 1.4))
        o.append(T(x0 + wd + wc / 2, y + 20, "検査 %d" % c, "middle", 11.5, SIG, True))
        y += 58
    o.append(T(20, y + 6, "検査ビット: 1155 ÷ 256 ≈ 4.5 倍。BCH はばらばらの 121 ビットも直せるが、バーストだけなら RS の方がずっと少ない検査で済む。",
               "start", 11.5, MUT))
    return SVG(800, y + 20, o, "検査ビット（緑）の量の比較。BCH 符号の値は、長さ 2047 で訂正能力 121 ビットにしたときの生成多項式の次数から求めた。")
F["e11_rsbch"] = _r11_rsbch()


def _r11_interleave():
    o = []
    names = ["A", "B", "C", "D"]
    cols = [_R11B, SIG, ALI, MUT]
    fills = [_R11BS, SSOFT, ASOFT, SCR]
    L = 6
    o.append(T(20, 22, "① RS 符号語 4 個", "start", 12.5, INK, True))
    for r in range(4):
        for i in range(L):
            o.append(RECT(40 + i * 30, 34 + r * 30, 27, 25, 3, fills[r], cols[r], 1.2))
            o.append(T(40 + i * 30 + 13.5, 34 + r * 30 + 17, "%s%d" % (names[r], i + 1), "middle", 10, INK, False, True))
    o.append(T(40, 34 + 4 * 30 + 12, "1 マス = 1 シンボル（1 バイト）。", "start", 10.5, MUT))
    o.append(T(40, 34 + 4 * 30 + 28, "実際は各 255 シンボル。", "start", 10.5, MUT))
    x1 = 300
    o.append(T(x1, 22, "② 列ごとに A, B, C, D, A, B, … の順で送る（深さ D = 4）", "start", 12.5, INK, True))
    burst = set(range(5, 13))
    for j in range(4 * L):
        r, i = j % 4, j // 4
        hit = j in burst
        o.append(RECT(x1 + j * 20, 60, 18, 25, 3, ASOFT if hit else fills[r], ALI if hit else cols[r], 2 if hit else 1.1))
        o.append(T(x1 + j * 20 + 9, 77, "%s%d" % (names[r], i + 1), "middle", 8, INK, hit, True))
    o.append(W(x1 + 5 * 20, 96, x1 + 13 * 20 - 2, 96, c=ALI, lw=3))
    o.append(T(x1 + 9 * 20, 114, "長さ 8 シンボルのバースト", "middle", 11, ALI, True))
    o.append(T(x1, 150, "③ 並べ直すと、各符号語に届くのは 2 シンボルずつ（⌈8/4⌉ = 2）", "start", 12.5, INK, True))
    o.append(T(x1, 172, "→ t = 2 の符号でも、4 個とも訂正できる", "start", 12, SIG, True))
    return SVG(800, 190, o, "シンボル単位のインターリーブ。連続したバーストを、複数の RS 符号語に少しずつ分散させる。")
F["e11_interleave"] = _r11_interleave()


def _r11_circ():
    o = []
    bw, bh, gap = 132, 58, 24
    top = [("音声データ", "24 バイト", LIN, PAN), ("C2 で符号化", "RS(28,24)：+4", SIG, SSOFT),
           ("インターリーブ", "バイトごとに遅延を変えて散らす", _R11B, _R11BS), ("C1 で符号化", "RS(32,28)：+4", SIG, SSOFT),
           ("ディスク", "傷・汚れ", ALI, ASOFT)]
    o.append(T(20, 22, "書き込み", "start", 12.5, INK, True))
    x = 20
    for k, (t1, t2, c, fl) in enumerate(top):
        o.append(BOX(x, 34, bw, bh, t1, t2, c, fl, INK, 8, 1.4, 12, 10))
        if k < 4:
            o.append(ARR(x + bw + 2, 34 + bh / 2, x + bw + gap - 3, 34 + bh / 2, MUT, 1.5))
        x += bw + gap
    o.append(T(20, 132, "読み出し", "start", 12.5, INK, True))
    bot = [("ディスク", "読み出し", ALI, ASOFT), ("C1 で復号", "直せない符号語は消失の印", SIG, SSOFT),
           ("デインターリーブ", "遅延を戻して並べ直す", _R11B, _R11BS), ("C2 で復号", "消失 4 個まで復元", SIG, SSOFT),
           ("音声データ", "24 バイト", LIN, PAN)]
    x = 20
    for k, (t1, t2, c, fl) in enumerate(bot):
        o.append(BOX(x, 144, bw, bh, t1, t2, c, fl, INK, 8, 1.4, 12, 10))
        if k < 4:
            o.append(ARR(x + bw + 2, 144 + bh / 2, x + bw + gap - 3, 144 + bh / 2, MUT, 1.5))
        x += bw + gap
    o.append(T(20, 236, "長い傷で C1 の符号語がまとめて読めなくても、並べ直すと C2 の各符号語には消失が少しずつしか届かない。",
               "start", 11.5, INK))
    return SVG(800, 250, o, "CD の CIRC の流れ（概略）。内側の C1 が誤りを見つけて消失の印を付け、外側の C2 が消失訂正で復元する。"
               "C1・C2 とも RS(255,251) の短縮符号である。")
F["e11_circ"] = _r11_circ()


# ===================== 7 節 =====================

_R11Q = _R11GF(8, 0x11D)
_R11QR_DATA = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17]


def _r11_qr_ec(data, nk):
    F = _R11Q
    g = _r11_gen(F, nk, 0)
    A = [0] * nk + list(reversed(data))
    rem = _r11_mod(F, A, g)
    return list(reversed(rem)), g


_R11QR_EC, _R11QR_G = _r11_qr_ec(_R11QR_DATA, 10)
assert _R11QR_EC == [196, 35, 39, 119, 235, 215, 231, 226, 93, 23]
assert [_R11Q.log[c] for c in reversed(_R11QR_G)] == [0, 251, 67, 46, 61, 118, 70, 64, 94, 32, 45]


def _r11_qrcw():
    o = []
    # ビット列の内訳
    fields = [("モード", "0010", MUT), ("文字数 11", "000001011", MUT), ("HE", "01100001011", _R11B),
              ("LL", "01111000110", SIG), ("O␣", "10001011100", _R11B), ("WO", "10110111000", SIG),
              ("RL", "10011010100", _R11B), ("D", "001101", SIG), ("終端", "0000", MUT)]
    o.append(T(20, 22, "英数字モードのビット列（2 文字を 45 × 1 文字目 + 2 文字目 の 11 ビットにする）", "start", 12.5, INK, True))
    x = 20
    cwid = 6.9
    for name, bits_, col in fields:
        w = len(bits_) * cwid + 8
        o.append(RECT(x, 34, w, 24, 4, PAN, col, 1.2))
        o.append(T(x + w / 2, 50, bits_, "middle", 10.5, INK, False, True))
        o.append(T(x + w / 2, 72, name, "middle", 10.5, col, True))
        x += w + 3
    o.append(T(20, 100, "8 ビットずつ区切り、残りを 236, 17 の繰り返しで埋めると 16 バイトになる。", "start", 11.5, MUT))
    # シンボル
    cw, ch, gap = 44, 36, 4

    def cells(y, vals, col, fill, prefix):
        out = []
        for k, v in enumerate(vals):
            xx = 20 + k * (cw + gap)
            out.append(RECT(xx, y, cw, ch, 5, fill, col, 1.3))
            out.append(T(xx + cw / 2, y + 16, str(v), "middle", 12.5, INK, True))
            out.append(T(xx + cw / 2, y + 30, "%02X" % v, "middle", 9.5, MUT, False, True))
            out.append(T(xx + cw / 2, y - 5, "%s%d" % (prefix, k + 1), "middle", 9.5, MUT))
        return "".join(out)

    o.append(T(20, 128, "情報シンボル 16 個 = u(x) の係数（D1 が最高次）", "start", 12.5, _R11B, True))
    o.append(cells(150, _R11QR_DATA, _R11B, _R11BS, "D"))
    o.append(T(20, 214, "検査シンボル 10 個 = x¹⁰u(x) mod g(x)（g の根は α⁰, …, α⁹）", "start", 12.5, SIG, True))
    o.append(cells(236, _R11QR_EC, SIG, SSOFT, "E"))
    return SVG(800, 284, o, "バージョン 1-M の \"HELLO WORLD\"。上は情報シンボルのもとになるビット列。"
               "下の 26 シンボル（各 1 バイト、上段の数は 10 進、下段は 16 進）が RS(26,16) の符号語で、送る順に D1, …, D16, E1, …, E10 と並ぶ。")
F["e11_qrcw"] = _r11_qrcw()


def _r11_qr_layout():
    """バージョン 1 の 21×21 で、各モジュールが属するシンボルの番号（-1 は機能パターン）と種類を返す"""
    N = 21
    func = [[None] * N for _ in range(N)]

    def setf(x, y, kind):
        if 0 <= x < N and 0 <= y < N:
            func[y][x] = kind
    for i in range(N):
        setf(6, i, "timing")
        setf(i, 6, "timing")
    for cx, cy in [(3, 3), (N - 4, 3), (3, N - 4)]:
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                setf(cx + dx, cy + dy, "finder" if max(abs(dx), abs(dy)) <= 3 else "sep")
    for i in range(6):
        setf(8, i, "format")
    setf(8, 7, "format"); setf(8, 8, "format"); setf(7, 8, "format")
    for i in range(9, 15):
        setf(14 - i, 8, "format")
    for i in range(8):
        setf(N - 1 - i, 8, "format")
    for i in range(8, 15):
        setf(8, N - 15 + i, "format")
    setf(8, N - 8, "dark")
    cw = [[-1] * N for _ in range(N)]
    i = 0
    right = N - 1
    while right >= 1:
        if right == 6:
            right = 5
        for vert in range(N):
            for j in range(2):
                x = right - j
                upward = ((right + 1) & 2) == 0
                y = N - 1 - vert if upward else vert
                if func[y][x] is None and i < 26 * 8:
                    cw[y][x] = i >> 3
                    i += 1
        right -= 2
    return func, cw


_R11QFUNC, _R11QCW = _r11_qr_layout()


def _r11_qrmap():
    N, s = 21, 15
    ox, oy = 24, 24
    o = []
    func, cw = _R11QFUNC, _R11QCW
    # 機能パターン
    for y in range(N):
        for x in range(N):
            k = func[y][x]
            X, Y = ox + x * s, oy + y * s
            if k == "finder":
                d = max(abs(x - (3 if x < 10 else N - 4)), abs(y - (3 if y < 10 else N - 4)))
                dark = d in (0, 1, 3)
                o.append(RECT(X, Y, s, s, 0, INK if dark else PAN, LIN, 0.4))
            elif k == "sep":
                o.append(RECT(X, Y, s, s, 0, PAN, LIN, 0.4))
            elif k == "timing":
                o.append(RECT(X, Y, s, s, 0, INK if (x + y) % 2 == 0 else PAN, LIN, 0.4))
            elif k in ("format", "dark"):
                o.append(RECT(X, Y, s, s, 0, FNT, LIN, 0.4))
            else:
                v = cw[y][x]
                isd = v < 16
                o.append(RECT(X, Y, s, s, 0, _R11BS if isd else SSOFT, LIN, 0.4))
    # シンボルの境界（隣と番号が違う辺に線を引く）
    for y in range(N):
        for x in range(N):
            v = cw[y][x]
            if v < 0:
                continue
            col = _R11B if v < 16 else SIG
            X, Y = ox + x * s, oy + y * s
            if y == 0 or cw[y - 1][x] != v:
                o.append(W(X, Y, X + s, Y, c=col, lw=1.6))
            if y == N - 1 or cw[y + 1][x] != v:
                o.append(W(X, Y + s, X + s, Y + s, c=col, lw=1.6))
            if x == 0 or cw[y][x - 1] != v:
                o.append(W(X, Y, X, Y + s, c=col, lw=1.6))
            if x == N - 1 or cw[y][x + 1] != v:
                o.append(W(X + s, Y, X + s, Y + s, c=col, lw=1.6))
    # 番号（各シンボルの最も大きい塊の中心付近）
    import collections
    cells = collections.defaultdict(list)
    for y in range(N):
        for x in range(N):
            if cw[y][x] >= 0:
                cells[cw[y][x]].append((x, y))
    for v, pts in cells.items():
        ys = sorted(set(p[1] for p in pts))
        # タイミングの行で分かれる場合は、モジュールの多い側を使う
        groups = [[p for p in pts if p[1] < 6], [p for p in pts if p[1] > 6]]
        grp = max(groups, key=len)
        cx = sum(p[0] for p in grp) / len(grp)
        cy = sum(p[1] for p in grp) / len(grp)
        lab = ("D%d" if v < 16 else "E%d") % ((v + 1) if v < 16 else (v - 15))
        o.append(T(ox + cx * s + s / 2, oy + cy * s + s / 2 + 3.5, lab, "middle", 8.5, INK, True))
    # 凡例
    lx = ox + N * s + 30
    items = [(_R11BS, _R11B, "情報シンボル D1〜D16"), (SSOFT, SIG, "検査シンボル E1〜E10"),
             (INK, LIN, "位置検出・タイミング"), (FNT, LIN, "形式情報（BCH 符号）")]
    for k, (fl, c, lab) in enumerate(items):
        yy = oy + 10 + k * 28
        o.append(RECT(lx, yy, 18, 18, 3, fl, c, 1.4))
        o.append(T(lx + 28, yy + 14, lab, "start", 12, INK))
    notes = ["1 シンボル = 8 モジュール。", "右下の D1 から 2 列ずつ、", "上下に折り返しながら置く。",
             "D1 → D2 → … → D16 → E1 → … → E10"]
    for k, t in enumerate(notes):
        o.append(T(lx, oy + 150 + k * 20, t, "start", 11.5, MUT))
    return SVG(640, oy * 2 + N * s, o, "バージョン 1（21 × 21 モジュール）で、各シンボルの 8 モジュールが置かれる場所。"
               "枠で囲んだ 8 マスが 1 シンボル。位置検出パターン・タイミングパターン・形式情報の場所は避ける。")
F["e11_qrmap"] = _r11_qrmap()


# ===================== 8 節 =====================

def _r11_apps():
    o = []
    pw, ph = 370, 140
    panels = [
        (20, 20, "単独で使う", "QR コード", [("データ", LIN, PAN), ("RS 符号", SIG, SSOFT), ("配置", _R11B, _R11BS)],
         "符号語を 1 つ（または数個を交互に）配置する"),
        (410, 20, "2 段 + インターリーブ + 消失", "CD（CIRC）", [("C2", SIG, SSOFT), ("交互に配置", _R11B, _R11BS), ("C1", SIG, SSOFT)],
         "C1 が付けた消失の印を C2 が使う"),
        (20, 180, "連接符号", "ボイジャー・地上デジタル放送", [("RS|外側", SIG, SSOFT), ("畳み込み|内側", _R11B, _R11BS), ("通信路", ALI, ASOFT)],
         "内側の復号が出すかたまった誤りを RS が直す"),
        (410, 180, "消失訂正", "RAID-6・分散ストレージ", [("データ|k 個", LIN, PAN), ("RS", SIG, SSOFT), ("パリティ|r 個", _R11B, _R11BS)],
         "どの k 個が残っても元に戻る（位置は分かる）"),
    ]
    for x, y, title, ex, boxes, note in panels:
        o.append(RECT(x, y, pw, ph, 10, PAN, LIN, 1.3))
        o.append(T(x + 14, y + 24, title, "start", 13, INK, True))
        o.append(T(x + pw - 14, y + 24, ex, "end", 11, MUT))
        bx = x + 14
        bwid = (pw - 28 - 2 * 18) / 3
        for k, (lab, c, fl) in enumerate(boxes):
            t1, _, t2 = lab.partition("|")
            o.append(BOX(bx, y + 44, bwid, 44, t1, t2 or None, c, fl, INK, 7, 1.4, 11.5, 10))
            if k < 2:
                o.append(ARR(bx + bwid + 2, y + 66, bx + bwid + 16, y + 66, MUT, 1.4))
            bx += bwid + 18
        o.append(T(x + 14, y + 116, note, "start", 11.5, INK))
    return SVG(800, 340, o, "RS 符号の使われ方の 4 つの型。どれも、シンボル単位で数えることと、消失を誤りの 2 倍直せることを使っている。")
F["e11_apps"] = _r11_apps()
