# 03 章 有限体 GF(p) の図（figures.py の関数・定数をそのまま使う）
# 他章の fNN.py と同じ名前空間で実行されるので、補助関数・定数には _f03 / _F03 を付ける。

_F03B = "var(--blue)"
_F03BS = "rgba(47,111,158,.14)"


def _f03_node(x, y, s, r=16, c=INK, fill=PAN, tc=INK, b=True, sz=13, lw=1.5, dash=None):
    return CIRC(x, y, r, c, lw, fill, dash) + T(x, y + sz * 0.36, s, "middle", sz, tc, b, True)


def _f03_cell(x, y, w, h, s, c=LIN, fill=PAN, tc=INK, sz=12.5, b=False, lw=1.3, dash=None):
    return RECT(x, y, w, h, 5, fill, c, lw, dash) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, True)


def _f03_link(x1, y1, x2, y2, r1, r2, c=MUT, lw=1.6, head=7):
    """中心 (x1,y1) 半径 r1 の円から、中心 (x2,y2) 半径 r2 の円へ矢印"""
    dx, dy = x2 - x1, y2 - y1
    L = (dx * dx + dy * dy) ** .5
    return ARR(x1 + dx / L * r1, y1 + dy / L * r1, x2 - dx / L * r2, y2 - dy / L * r2, c, lw, head)


def _f03_ring(cx, cy, R, n, start=-90.0):
    return [(cx + R * math.cos(math.radians(start + 360.0 * i / n)),
             cy + R * math.sin(math.radians(start + 360.0 * i / n))) for i in range(n)]


# 1 節: 乗法表の行が並べ替えになるか（GF(5) と Z_6 の比較）
def _f03_rows():
    o = []

    def panel(x0, n, a, title, tc, notes):
        o.append(T(x0, 24, title, "start", 13, tc, True))
        bw, step = 38, 52
        top, bot = 58, 162
        o.append(T(x0, top + 20, "x", "start", 12, MUT, True, True))
        o.append(T(x0, bot + 20, "%dx" % a, "start", 12, MUT, True, True))
        xs = [x0 + 40 + v * step for v in range(n)]
        hits = {}
        for x in range(1, n):
            hits.setdefault(a * x % n, []).append(x)
        for x in range(1, n):
            y = a * x % n
            bad = y == 0 or len(hits[y]) > 1
            o.append(ARR(xs[x] + bw / 2, top + 30, xs[y] + bw / 2 + (x - 2.5) * 1.2, bot - 3,
                         ALI if bad else SIG, 1.5, 6))
        for x in range(1, n):
            o.append(_f03_cell(xs[x], top, bw, 30, str(x), INK, PAN, INK, 13, True))
        for v in range(n):
            k = len(hits.get(v, []))
            if v == 0 and k:
                c, fl, tc = ALI, ASOFT, ALI
            elif k == 1:
                c, fl, tc = SIG, SSOFT, INK
            elif k > 1:
                c, fl, tc = ALI, ASOFT, ALI
            else:
                c, fl, tc = LIN, PAN, MUT
            o.append(_f03_cell(xs[v], bot, bw, 30, str(v), c if k else FNT, fl, tc, 13, k > 0, 1.6 if k else 1.1,
                               None if k else "4,3"))
        for i, (s, c, b) in enumerate(notes):
            o.append(T(x0, 222 + i * 19, s, "start", 11.5, c, b))

    panel(24, 5, 2, "GF(5) の 2 の行（並べ替えになる）", SIG,
          [("1〜4 に 1 本ずつ当たる。0 には当たらない。", INK, False),
           ("1 に当たる x = 3 が 2 の逆元", SIG, True)])
    panel(420, 6, 2, "ℤ₆ の 2 の行（並べ替えにならない）", ALI,
          [("2 と 4 に 2 本ずつ当たり、0 にも当たる。", INK, False),
           ("1 には当たらない → 2 は逆元を持たない", ALI, True)])
    return SVG(800, 268, o, "上の段の x に 2 を掛けた値（法で割った余り）へ矢印を引いた。法が素数 5 なら、"
               "出力は 1〜4 にちょうど 1 回ずつ現れる。法が合成数 6 だと出力が重なり、0 も現れ、1 が現れない。")
F["e03_rows"] = _f03_rows()


# 2 節: 逆元を求める 2 つの方法（GF(7) で 3 の逆元）
def _f03_inv():
    o = []

    def panel(x0, w, title, lines, note):
        o.append(RECT(x0, 14, w, 196, 10, PAN, LIN, 1.3))
        o.append(T(x0 + 16, 40, title, "start", 13, INK, True))
        for i, (s, c, b) in enumerate(lines):
            o.append(T(x0 + 22, 72 + i * 25, s, "start", 13, c, b, True))
        o.append(T(x0 + 16, 198, note, "start", 11.5, MUT))

    panel(16, 372, "方法 1: 拡張ユークリッドの互除法",
          [("7 = 2 × 3 + 1", INK, False),
           ("1 = 7 − 2 × 3", INK, False),
           ("1 ≡ 3 × (−2)   (mod 7)", INK, False),
           ("3⁻¹ ≡ −2 ≡ 5", SIG, True)],
          "割り算を何回するかは、逆元を求める数で変わる")
    panel(404, 380, "方法 2: 3⁷⁻² = 3⁵ を繰り返し二乗法で",
          [("3¹ = 3", INK, False),
           ("3² = 9 ≡ 2", INK, False),
           ("3⁴ = (3²)² ≡ 2² = 4", INK, False),
           ("3⁵ = 3⁴ × 3¹ ≡ 4 × 3 = 12 ≡ 5", SIG, True)],
          "2 乗と掛け算の並びは、指数 5 = 101₂ だけで決まる")
    o.append(T(400, 240, "どちらも 3⁻¹ = 5。検算: 3 × 5 = 15 ≡ 1 (mod 7)", "middle", 13, SIG, True))
    return SVG(800, 256, o, "GF(7) で 3 の逆元を求める。方法 1 は 7 と 3 の互除法を逆にたどり、"
               "方法 2 はフェルマーの小定理から得た公式 a⁻¹ = aᵖ⁻² を計算する。≡ はすべて法 7 での合同。")
F["e03_inv"] = _f03_inv()


# 3 節: GF(7) で 3 と 2 を掛けていく（要素を 3 のべき乗の順に円に並べる）
def _f03_cycles():
    order = [1, 3, 2, 6, 4, 5]          # 3^0, 3^1, ..., 3^5
    o = []

    def panel(cx, g, title, tc, note1, note2):
        pts = _f03_ring(cx, 128, 76, 6)
        path = [1]
        while True:
            nx = path[-1] * g % 7
            if nx == 1:
                break
            path.append(nx)
        o.append(T(cx, 26, title, "middle", 13, tc, True))
        pos = {v: pts[i] for i, v in enumerate(order)}
        for i, v in enumerate(path):
            w = path[(i + 1) % len(path)]
            (x1, y1), (x2, y2) = pos[v], pos[w]
            o.append(_f03_link(x1, y1, x2, y2, 20, 21, tc, 1.8, 8))
        for v in order:
            x, y = pos[v]
            if v in path:
                o.append(_f03_node(x, y, str(v), 17, tc, SSOFT if tc == SIG else _F03BS, INK, True, 14, 1.8))
            else:
                o.append(_f03_node(x, y, str(v), 17, FNT, PAN, MUT, False, 14, 1.1, "4,3"))
        o.append(T(cx, 128 + 5, "× %d" % g, "middle", 15, tc, True, True))
        o.append(T(cx, 236, note1, "middle", 11.5, INK))
        o.append(T(cx, 255, note2, "middle", 11.5, tc, True))

    panel(200, 3, "3 を掛けていく", SIG, "1 → 3 → 2 → 6 → 4 → 5 → 1", "6 個すべてを通る（原始元）")
    panel(580, 2, "2 を掛けていく", _F03B, "1 → 2 → 4 → 1", "3 個で 1 に戻る（位数 3）。3, 6, 5 は現れない")
    return SVG(780, 272, o, "GF(7) の 0 以外の 6 個の要素を、3 のべき乗 3⁰, 3¹, …, 3⁵ の順に円に並べた。"
               "3 を掛けると円を 1 つずつ進み、2 = 3² を掛けると 2 つずつ進む。")
F["e03_cycles"] = _f03_cycles()


# 3 節: 離散対数（べき乗の表と、その逆引き）
def _f03_dlog():
    o = []
    cw, ch = 50, 30

    def table(x0, title, h1, r1, h2, r2, hl, note, tc):
        o.append(T(x0, 26, title, "start", 13, tc, True))
        o.append(T(x0, 62, h1, "start", 12, MUT, True, True))
        o.append(T(x0, 102, h2, "start", 12, MUT, True, True))
        for i in range(6):
            x = x0 + 64 + i * (cw + 4)
            o.append(_f03_cell(x, 41, cw, ch, str(r1[i]), LIN, PAN, INK, 13))
            o.append(_f03_cell(x, 81, cw, ch, str(r2[i]), tc, SSOFT if tc == SIG else ASOFT, INK, 13, True))
            if i == hl:
                o.append(RECT(x - 3, 38, cw + 6, 76, 7, "none", tc, 2))
        o.append(T(x0, 140, note, "start", 11.5, INK))

    xs = list(range(6))
    ys = [pow(3, x, 7) for x in xs]
    table(16, "べき乗の表（x から 3ˣ）", "x", xs, "3ˣ", ys, 4,
          "x = 4 なら 3⁴ = 81 ≡ 4。繰り返し二乗法で速く計算できる", SIG)
    yy = list(range(1, 7))
    ll = [ys.index(v) for v in yy]
    table(408, "離散対数の表（y から log₃ y）", "y", yy, "log₃ y", ll, 3,
          "y = 4 なら log₃ 4 = 4。表が無ければ x を順に試すしかない", ALI)
    o.append(T(400, 172, "右の表は左の表を y の順に並べ替えたもの。p が 2048 ビット程度だと要素が多すぎて表を作れない",
               "middle", 11.5, MUT))
    return SVG(800, 186, o, "GF(7)、底 g = 3 の場合。x から 3ˣ を求める向きは計算が速いが、"
               "y から x（離散対数）を求める向きには、効率のよい方法が知られていない。")
F["e03_dlog"] = _f03_dlog()


# 3 節: g^k の位数 — 指数の円を k ずつ進む（p − 1 = 6）
def _f03_gk():
    o = []
    from math import gcd as _g
    for k in range(1, 6):
        cx = 82 + (k - 1) * 154
        cy = 104
        prim = _g(k, 6) == 1
        tc = SIG if prim else _F03B
        pts = _f03_ring(cx, cy, 46, 6)
        seen = [0]
        while True:
            nx = (seen[-1] + k) % 6
            if nx == 0:
                break
            seen.append(nx)
        o.append(T(cx, 24, "k = %d（3ᵏ = %d）" % (k, pow(3, k, 7)), "middle", 12.5, tc, True))
        for i, e in enumerate(seen):
            f = seen[(i + 1) % len(seen)]
            (x1, y1), (x2, y2) = pts[e], pts[f]
            if len(seen) == 2:      # 往復は 2 本を少しずらす
                nx_, ny_ = -(y2 - y1), (x2 - x1)
                L = (nx_ * nx_ + ny_ * ny_) ** .5
                x1, y1, x2, y2 = x1 + nx_ / L * 5, y1 + ny_ / L * 5, x2 + nx_ / L * 5, y2 + ny_ / L * 5
            o.append(_f03_link(x1, y1, x2, y2, 12, 13, tc, 1.5, 6))
        for e in range(6):
            x, y = pts[e]
            if e in seen:
                o.append(_f03_node(x, y, str(e), 11, tc, SSOFT if prim else _F03BS, INK, True, 11, 1.5))
            else:
                o.append(_f03_node(x, y, str(e), 11, FNT, PAN, MUT, False, 11, 1.0, "3,3"))
        o.append(T(cx, 178, "gcd(%d, 6) = %d" % (k, _g(k, 6)), "middle", 11.5, INK, False, True))
        o.append(T(cx, 197, "位数 6 / %d = %d" % (_g(k, 6), 6 // _g(k, 6)), "middle", 11.5, tc, True))
        o.append(T(cx, 216, "原始元" if prim else "原始元でない", "middle", 11.5, tc, prim))
    return SVG(780, 232, o, "円の位置 e は要素 3ᵉ を表す（e は 0 から 5 まで）。gᵏ = 3ᵏ を 1 回掛けるごとに位置が k 進むので、"
               "0 に戻るまでの歩数が 3ᵏ の位数になる。k と 6 が互いに素なときだけ 6 個すべてを通る。")
F["e03_gk"] = _f03_gk()


# 4 節: 掃き出し法の各段（GF(5)）
def _f03_elim():
    rows = [
        ("始め", "", "2x + 3y = 4", "x + y = 3", None),
        ("① 1 本目に 2⁻¹ = 3 を掛ける", "（実数なら x + 1.5y = 2 と分数になる）",
         "6x + 9y = 12 → x + 4y = 2", "x + y = 3", 0),
        ("② 2 本目から 1 本目を引く", "", "x + 4y = 2", "−3y = 1 → 2y = 1", 1),
        ("③ 2 本目に 2⁻¹ = 3 を掛ける", "", "x + 4y = 2", "6y = 3 → y = 3", 1),
        ("④ 1 本目から 2 本目の 4 倍を引く", "", "x = 2 − 12 = −10 → x = 0", "y = 3", 0),
    ]
    o = []
    X1, X2, W = 300, 552, 236
    o.append(T(20, 24, "操作", "start", 12, MUT, True))
    o.append(T(X1 + W / 2, 24, "1 本目", "middle", 12, MUT, True))
    o.append(T(X2 + W / 2, 24, "2 本目", "middle", 12, MUT, True))
    for i, (op, sub, e1, e2, hl) in enumerate(rows):
        y = 38 + i * 52
        o.append(T(20, y + (16 if sub else 22), op, "start", 12.5, INK, i > 0))
        if sub:
            o.append(T(20, y + 34, sub, "start", 10.5, ALI))
        for j, (x, e) in enumerate([(X1, e1), (X2, e2)]):
            on = hl == j
            o.append(RECT(x, y, W, 34, 7, SSOFT if on else PAN, SIG if on else LIN, 1.6 if on else 1.2))
            o.append(T(x + W / 2, y + 22, e, "middle", 12.5, INK, on, True))
        if i:
            o.append(ARR(X1 - 14, y - 16, X1 - 14, y - 2, MUT, 1.3, 5))
    return SVG(800, 302, o, "GF(5) で 2x + 3y = 4、x + y = 3 を解く。色付きの欄がその段で変わった式で、"
               "→ の右は係数と右辺を 5 で割った余りに直したもの（−3 ≡ 2、−10 ≡ 0 など）。")
F["e03_elim"] = _f03_elim()


# 5 節: 1 バイト = 256 通りの値と体
def _f03_byte():
    o = []
    o.append(RECT(14, 14, 372, 214, 10, PAN, LIN, 1.3))
    o.append(T(30, 40, "ℤ₂₅₆（整数を 256 で割った余り）", "start", 13, ALI, True))
    lines = [("2 × 128 = 256 ≡ 0", ALI, True, True),
             ("0 でない 2 数の積が 0（零因子）", INK, False, False),
             ("2 × x はいつも偶数", ALI, True, True),
             ("→ 2 × x = 1 となる x が無い", INK, False, False),
             ("2 は逆元を持たないので、体ではない", ALI, True, False)]
    for i, (s, c, b, mono) in enumerate(lines):
        o.append(T(36, 78 + i * 28, s, "start", 13 if mono else 12, c, b, mono))
    o.append(RECT(404, 14, 382, 214, 10, PAN, LIN, 1.3))
    o.append(T(420, 40, "GF(251)（素数 251 で割った余り）", "start", 13, SIG, True))
    cs, g = 9, 1.5
    gx, gy = 420, 56
    for v in range(256):
        r, c = divmod(v, 16)
        bad = v >= 251
        o.append(RECT(gx + c * (cs + g), gy + r * (cs + g), cs, cs, 1.5,
                      ASOFT if bad else SSOFT, ALI if bad else SIG, 0.8 if not bad else 1.2))
    o.append(T(600, 80, "1 マス = 1 バイトの値", "start", 11.5, MUT))
    o.append(T(600, 100, "左上が 0、右下が 255", "start", 11.5, MUT))
    o.append(T(600, 140, "体として使えるのは", "start", 12, INK))
    o.append(T(600, 160, "0〜250 の 251 個", "start", 12, SIG, True))
    o.append(T(600, 192, "251〜255 の 5 個は", "start", 12, INK))
    o.append(T(600, 212, "使えない（右下の赤）", "start", 12, ALI, True))
    return SVG(800, 242, o, "1 バイトの 256 通りの値で体を作ろうとすると、整数の剰余では、"
               "256 で割ると体にならず、素数 251 で割ると 5 つの値が余る。")
F["e03_byte"] = _f03_byte()


# 5 節: 体が存在する要素数（素数のべき乗）
def _f03_sizes():
    def fac(n):
        f, d = [], 2
        while d * d <= n:
            while n % d == 0:
                f.append(d)
                n //= d
            d += 1
        if n > 1:
            f.append(n)
        return f
    sup = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
    o = []
    cw, gap = 40, 6
    for idx, n in enumerate(range(2, 33)):
        r, c = divmod(idx, 16)
        x = 18 + c * (cw + gap)
        y = 22 + r * 78
        f = fac(n)
        pp = len(set(f)) == 1
        if pp:
            o.append(_f03_cell(x, y, cw, 34, str(n), SIG, SSOFT, INK, 13.5, True, 1.6))
            lab = str(f[0]) if len(f) == 1 else str(f[0]) + str(len(f)).translate(sup)
            o.append(T(x + cw / 2, y + 52, lab, "middle", 11.5, SIG, True, True))
        else:
            o.append(_f03_cell(x, y, cw, 34, str(n), FNT, PAN, MUT, 13.5, False, 1.0, "4,3"))
            ps = sorted(set(f))
            lab = "·".join(str(q) + (str(f.count(q)).translate(sup) if f.count(q) > 1 else "") for q in ps)
            o.append(T(x + cw / 2, y + 52, lab, "middle", 10.5, MUT, False, True))
    o.append(RECT(18, 180, 14, 14, 3, SSOFT, SIG, 1.4))
    o.append(T(40, 192, "体が存在する（素数のべき乗 pᵐ）", "start", 11.5, INK))
    o.append(RECT(300, 180, 14, 14, 3, PAN, FNT, 1.0, "4,3"))
    o.append(T(322, 192, "体が存在しない（異なる素数を 2 つ以上含む）", "start", 11.5, INK))
    return SVG(760, 206, o, "要素数 2〜32 のうち、有限体が存在するもの。マスの下はその数の素因数分解で、"
               "6 = 2·3 や 12 = 2²·3 のように異なる素数を含む数の体は存在しない。")
F["e03_sizes"] = _f03_sizes()


# 5 節: 0 から 1 を足し続ける列（GF(5) と GF(4) の比較）
def _f03_chain():
    o = []
    # GF(5)
    cx, cy = 190, 126
    o.append(T(cx, 26, "GF(5): 標数 5、要素数 5", "middle", 13, SIG, True))
    pts = _f03_ring(cx, cy, 72, 5)
    for i in range(5):
        (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % 5]
        o.append(_f03_link(x1, y1, x2, y2, 19, 20, ALI if i == 4 else SIG, 1.7, 7))
    for i in range(5):
        x, y = pts[i]
        o.append(_f03_node(x, y, str(i), 17, SIG, SSOFT, INK, True, 14, 1.7))
    o.append(T(cx, cy + 5, "+1", "middle", 14, SIG, True, True))
    o.append(T(cx, 236, "0 → 1 → 2 → 3 → 4 → 0", "middle", 12, INK, False, True))
    o.append(T(cx, 256, "1 を足す列が 5 個すべてを通る", "middle", 11.5, SIG, True))
    # GF(4)
    x0, x1_, yy = 470, 600, 92
    o.append(T(560, 26, "GF(4): 標数 2、要素数 4", "middle", 13, _F03B, True))
    o.append(_f03_node(x0, yy, "0", 18, _F03B, _F03BS, INK, True, 14, 1.7))
    o.append(_f03_node(x1_, yy, "1", 18, _F03B, _F03BS, INK, True, 14, 1.7))
    o.append(ARR(x0 + 20, yy - 8, x1_ - 21, yy - 8, _F03B, 1.7, 7))
    o.append(ARR(x1_ - 20, yy + 8, x0 + 21, yy + 8, ALI, 1.7, 7))
    o.append(T((x0 + x1_) / 2, yy - 16, "+1", "middle", 12, _F03B, True, True))
    o.append(T((x0 + x1_) / 2, yy + 26, "1 + 1 = 0", "middle", 12, ALI, True, True))
    ya = 178
    o.append(_f03_node(x0, ya, "α", 18, FNT, PAN, INK, True, 15, 1.1, "4,3"))
    o.append(_f03_node(x1_, ya, "β", 18, FNT, PAN, INK, True, 15, 1.1, "4,3"))
    o.append(ARR(x0 + 20, ya - 8, x1_ - 21, ya - 8, MUT, 1.3, 6))
    o.append(ARR(x1_ - 20, ya + 8, x0 + 21, ya + 8, MUT, 1.3, 6))
    o.append(T((x0 + x1_) / 2, ya - 16, "+1", "middle", 12, MUT, False, True))
    o.append(T((x0 + x1_) / 2, ya + 26, "α + 1 = β, β + 1 = α", "middle", 11, MUT, False, True))
    o.append(T(560, 236, "0 から 1 を足す列は 0 → 1 → 0 の 2 個で戻る", "middle", 11.5, INK))
    o.append(T(560, 256, "α, β はこの列に現れない", "middle", 11.5, _F03B, True))
    return SVG(780, 272, o, "標数は、0 から 1 を足し続けて 0 に戻るまでの個数である。"
               "GF(5) ではその列が全要素を通るので標数と要素数が一致するが、GF(4) では列に入らない要素 α, β がある。")
F["e03_chain"] = _f03_chain()


# 5 節: 係数を 1 つ増やすごとに要素数が p 倍（GF(4) と GF(256)）
def _f03_span():
    o = []
    o.append(T(20, 26, "GF(4)（p = 2）", "start", 13, SIG, True))
    # S1
    o.append(T(20, 62, "S₁ = { c₁·1 }", "start", 12.5, INK, True, True))
    for i, (s) in enumerate(["0", "1"]):
        o.append(_f03_cell(32 + i * 52, 76, 44, 34, s, SIG, SSOFT, INK, 14, True))
    o.append(T(76, 130, "2 個", "middle", 11.5, MUT))
    o.append(ARR(150, 93, 206, 93, MUT, 1.6))
    o.append(T(178, 82, "b₂ = α", "middle", 11, MUT, False, True))
    # S2 grid
    o.append(T(222, 62, "S₂ = { c₁·1 + c₂·α }", "start", 12.5, INK, True, True))
    gx, gy = 272, 92
    o.append(T(gx + 22, gy - 8, "c₁=0", "middle", 10.5, MUT, False, True))
    o.append(T(gx + 74, gy - 8, "c₁=1", "middle", 10.5, MUT, False, True))
    o.append(T(gx - 8, gy + 22, "c₂=0", "end", 10.5, MUT, False, True))
    o.append(T(gx - 8, gy + 62, "c₂=1", "end", 10.5, MUT, False, True))
    vals = [["0", "1"], ["α", "β"]]
    for r in range(2):
        for c in range(2):
            new = r == 1
            o.append(_f03_cell(gx + c * 52, gy + r * 40, 44, 34, vals[r][c], _F03B if new else SIG,
                               _F03BS if new else SSOFT, INK, 14, True))
    o.append(T(gx + 48, gy + 98, "4 個 = 2 × 2", "middle", 11.5, MUT))
    o.append(T(20, 222, "b を 1 つ加えるごとに、係数の選び方が p 倍になる", "start", 11.5, INK))
    # GF(256)
    x0 = 460
    o.append(T(x0, 26, "GF(256)（p = 2、m = 8）", "start", 13, SIG, True))
    o.append(T(x0, 62, "c₁b₁ + c₂b₂ + … + c₈b₈", "start", 12.5, INK, True, True))
    bits = "01010111"
    for i, b in enumerate(bits):
        o.append(T(x0 + 16 + i * 38, 92, "c%s" % "₁₂₃₄₅₆₇₈"[i], "middle", 11, MUT, False, True))
        o.append(_f03_cell(x0 + i * 38, 100, 32, 34, b, SIG if b == "1" else LIN,
                           SSOFT if b == "1" else PAN, INK, 14, b == "1"))
    o.append(T(x0, 160, "係数の並び (c₁, …, c₈) = 8 ビット = 1 バイト", "start", 12, INK))
    o.append(T(x0, 182, "2⁸ = 256 通りで F 全体を尽くす", "start", 12, SIG, True))
    o.append(T(x0, 222, "b₁, …, b₈ は固定した F の要素", "start", 11.5, MUT))
    return SVG(790, 238, o, "要素数 pᵐ の証明で作る集合 S₁ ⊂ S₂ ⊂ …。係数 c₁, c₂, … は P = {0, 1} 上を動く変数で、"
               "異なる係数の組は異なる要素を与える。")
F["e03_span"] = _f03_span()
