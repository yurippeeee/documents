# 06 章 誤り訂正の基礎 の図（figures.py の関数・定数をそのまま使う）
from itertools import product as _product

BLU = "var(--blue)"
BSOFT = "rgba(47,111,158,.14)"

def _bits(x, y, s, cw=26, ch=26, hl=None, hlc=ALI, hlf=ASOFT, c=LIN, fill=PAN, tc=INK, sz=13):
    """ビット列を 1 文字 1 マスで描く。hl は強調する位置（0 始まり）の集合"""
    o = []
    for i, b in enumerate(s):
        on = hl is not None and i in hl
        o.append(RECT(x + i * cw, y, cw - 3, ch, 4, hlf if on else fill, hlc if on else c, 1.3))
        o.append(T(x + i * cw + (cw - 3) / 2, y + ch / 2 + 4.5, b, "middle", sz, hlc if on else tc, on, True))
    return "".join(o)

def _ham(a, b):
    return sum(p != q for p, q in zip(a, b))


# 1. 送信から受信までの流れ
def _f06_flow():
    o = []
    items = [(20, "情報語", "k ビット", "1", SIG, SSOFT, "送りたいデータ"),
             (245, "符号語", "n ビット", "111", BLU, BSOFT, "通信路に出すもの"),
             (470, "受信語", "n ビット", "101", ALI, ASOFT, "受信者が受け取るもの"),
             (695, "情報語", "k ビット", "1", SIG, SSOFT, "推定した元のデータ")]
    for x, name, size, ex, c, fl, note in items:
        o.append(RECT(x, 30, 165, 112, 10, fl, c, 1.6))
        o.append(T(x + 82, 54, name, "middle", 15, c, True))
        o.append(T(x + 82, 72, size, "middle", 11, MUT))
        o.append(T(x + 82, 112, ex, "middle", 22, INK, True, True))
        o.append(T(x + 82, 162, note, "middle", 11.5, MUT))
    for x1, x2, lab in [(185, 245, "符号化"), (410, 470, "通信路"), (635, 695, "復号")]:
        o.append(ARR(x1 + 3, 92, x2 - 3, 92, INK, 1.8))
        o.append(T((x1 + x2) / 2, 82, lab, "middle", 11.5, INK, True))
    o.append(T(440, 118, "誤りで", "middle", 10.5, ALI))
    o.append(T(440, 132, "反転しうる", "middle", 10.5, ALI))
    return SVG(880, 178, o, "3 回繰り返し符号（1 節の例）での流れ。送るのは符号語 111 だけで、情報語は符号語の中に含まれている。"
               "受信語 101 から、元の情報語 1 を推定する。")
F["e06_flow"] = _f06_flow()


# 2. 立方体で符号語の配置を比べる
def _cube(ox, oy, code, dec=None, err=None):
    S, DX, DY = 120, 58, -46
    def pos(v):
        b2, b1, b0 = int(v[0]), int(v[1]), int(v[2])
        return ox + S * b0 + DX * b2, oy - S * b1 + DY * b2
    vs = [format(i, "03b") for i in range(8)]
    o = []
    for v in vs:
        for k in range(3):
            u = v[:k] + ("1" if v[k] == "0" else "0") + v[k + 1:]
            if v < u:
                (x1, y1), (x2, y2) = pos(v), pos(u)
                o.append(W(x1, y1, x2, y2, c=LIN, lw=2))
    if err:
        (x1, y1), (x2, y2) = pos(err[0]), pos(err[1])
        dx, dy = x2 - x1, y2 - y1; L = (dx * dx + dy * dy) ** .5
        o.append(ARR(x1 + dx / L * 22, y1 + dy / L * 22, x2 - dx / L * 24, y2 - dy / L * 24, ALI, 2.4, 9))
    for v in vs:
        x, y = pos(v)
        if v in code:
            o.append(CIRC(x, y, 20, BLU, 2, BLU))
            o.append(T(x, y + 4.5, v, "middle", 12, PAN, True, True))
        else:
            c, fl = LIN, PAN
            if dec and v in dec:
                c, fl = dec[v]
            o.append(CIRC(x, y, 18, c, 1.5, fl))
            o.append(T(x, y + 4.5, v, "middle", 11, INK, False, True))
    return o

def _f06_cube():
    o = []
    o.append(T(160, 26, "近い配置（悪い例）", "middle", 14, ALI, True))
    o.append(T(160, 46, "符号語 000 と 001 は 1 ビットしか違わない", "middle", 11, MUT))
    o += _cube(90, 290, ["000", "001"], err=("000", "001"))
    o.append(T(160, 330, "000 の 1 ビットが反転すると 001 になる。", "middle", 11.5, ALI))
    o.append(T(160, 348, "001 も符号語なので、誤りに気づけない", "middle", 11.5, ALI))
    dec = {v: (BLU, BSOFT) for v in ["001", "010", "100"]}
    dec.update({v: (ALI, ASOFT) for v in ["110", "101", "011"]})
    o.append(T(600, 26, "遠い配置（良い例）", "middle", 14, SIG, True))
    o.append(T(600, 46, "符号語 000 と 111 は 3 ビットすべて違う", "middle", 11, MUT))
    o += _cube(530, 290, ["000", "111"], dec=dec, err=("111", "101"))
    o.append(T(600, 330, "1 ビットの誤りでは符号語にならない。", "middle", 11.5, INK))
    o.append(T(600, 348, "青は 000、赤は 111 の隣なので、隣の符号語に直せる", "middle", 11.5, INK))
    return SVG(800, 364, o, "3 ビットのビット列 8 個を立方体の頂点に置き、1 ビットだけ違うものを辺で結んだ。"
               "1 ビットの誤りは、辺を 1 本たどって隣の頂点へ移ることに当たる。塗りつぶした頂点が符号語。")
F["e06_cube"] = _f06_cube()


# 3. XOR で違う位置が分かる
def _f06_xor():
    x, y = "10110", "11010"
    z = "".join("1" if a != b else "0" for a, b in zip(x, y))
    diff = {i for i in range(5) if x[i] != y[i]}
    o = []
    X0 = 150
    for k, (lab, s) in enumerate([("x", x), ("y", y), ("x ⊕ y", z)]):
        yy = 22 + k * 40
        o.append(T(X0 - 14, yy + 18, lab, "end", 13, INK, True, True))
        o.append(_bits(X0, yy, s, 34, 28, hl=diff))
    o.append(W(X0 - 4, 98, X0 + 170, 98, c=INK, lw=1.4))
    for i in diff:
        o.append(T(X0 + i * 34 + 15, 152, "↑", "middle", 13, ALI, True))
    o.append(T(X0 + 85, 172, "違う位置にだけ 1 が立つ", "middle", 11.5, ALI))
    o.append(T(470, 60, "d(x, y) = 値が違う位置の個数 = 2", "start", 13, INK, True))
    o.append(T(470, 86, "w(x ⊕ y) = 1 の個数 = 2", "start", 13, INK, True))
    o.append(T(470, 112, "したがって d(x, y) = w(x ⊕ y)", "start", 13, SIG, True))
    return SVG(800, 186, o, "XOR は各位置で「違えば 1、同じなら 0」なので、x ⊕ y の 1 の個数が x と y の距離になる。")
F["e06_xor"] = _f06_xor()


# 4. 検出: 符号語から別の符号語へは d ビット反転しないと届かない
def _f06_detect():
    chain = ["000", "100", "110", "111"]
    o = []
    x0, dx, y = 70, 200, 70
    for i, v in enumerate(chain):
        cx = x0 + i * dx
        cw = v in ("000", "111")
        o.append(RECT(cx - 46, y - 22, 92, 44, 10, BSOFT if cw else PAN, BLU if cw else LIN, 1.8 if cw else 1.3))
        o.append(T(cx, y + 6, v, "middle", 17, BLU if cw else INK, True, True))
        o.append(T(cx, y + 42, "符号語" if cw else "符号語ではない", "middle", 11, BLU if cw else MUT, cw))
        if i:
            o.append(ARR(cx - dx + 50, y, cx - 50, y, ALI, 1.8))
            o.append(T(cx - dx / 2, y - 10, "%d ビット目を反転" % i, "middle", 10.5, ALI))
    o.append(T(x0, 140, "c₁ を送った", "middle", 11.5, INK, True))
    o.append(T(x0 + 3 * dx, 140, "c₂ に化ける", "middle", 11.5, INK, True))
    o.append(T(x0 + 1.5 * dx, 172, "反転が 1〜2 ビットなら途中の語（符号語ではない）で止まるので、誤りに気づける。"
               , "middle", 11.5, INK))
    o.append(T(x0 + 1.5 * dx, 192, "別の符号語に化けるには d_min = 3 ビットすべての反転が要る。", "middle", 11.5, INK))
    return SVG(740, 206, o, "3 回繰り返し符号（d_min = 3）で、000 から 111 まで 1 ビットずつ反転させた。"
               "検出できないのは、ちょうど別の符号語に着いたときだけである。")
F["e06_detect"] = _f06_detect()


# 5. 訂正: 球が重ならない（d=3, t=1）か、真ん中で引き分ける（d=2, t=1）か
def _ballrow(y, chain, codes, t, title, tc, note1, note2):
    o = [T(20, y - 44, title, "start", 13, tc, True)]
    x0, dx = 90, 150
    xs = [x0 + i * dx for i in range(len(chain))]
    for i in range(len(chain) - 1):
        o.append(W(xs[i] + 34, y, xs[i + 1] - 34, y, c=LIN, lw=2))
    # 半径 t の球（1 ビット隣までを囲む）
    for ci, col, fl in [(0, BLU, BSOFT), (len(chain) - 1, ALI, ASOFT)]:
        lo, hi = max(0, ci - t), min(len(chain) - 1, ci + t)
        o.append(RECT(xs[lo] - 42, y - 30, xs[hi] - xs[lo] + 84, 60, 30, fl, col, 1.5, "5,3"))
    for i, v in enumerate(chain):
        cw = v in codes
        o.append(RECT(xs[i] - 32, y - 16, 64, 32, 8, PAN, BLU if i == 0 and cw else (ALI if cw else LIN), 1.8 if cw else 1.2))
        o.append(T(xs[i], y + 5, v, "middle", 14, INK, cw, True))
    o.append(T(20, y + 52, note1, "start", 11.5, INK))
    o.append(T(20, y + 70, note2, "start", 11.5, tc, True))
    return o

def _f06_balls():
    o = []
    o += _ballrow(80, ["000", "100", "110", "111"], {"000", "111"}, 1,
                  "d_min = 3、t = 1（2t + 1 = 3 ≤ d_min）", SIG,
                  "000 の球 {000, 100} と 111 の球 {110, 111} は重ならない。",
                  "1 ビットの誤りなら、受信語が入った球の中心が送った符号語 → 訂正できる")
    o += _ballrow(250, ["000", "100", "110"], {"000", "110"}, 1,
                  "d_min = 2、t = 1（2t + 1 = 3 > d_min）", ALI,
                  "100 は 000 からも 110 からも 1 ビットで、2 つの球が重なる。",
                  "100 を受信しても、000 と 110 のどちらを送ったか決められない → 訂正できない")
    return SVG(740, 340, o, "各符号語から距離 t 以内のビット列を囲んだ「半径 t の球」。d_min ≥ 2t + 1 なら球は重ならない。"
               "図は 2 つの符号語をつなぐ最短の道だけを横に並べたもの。")
F["e06_balls"] = _f06_balls()


# 6. 訂正と検出の組み合わせ（数直線）
def _f06_te():
    d, t, e = 4, 1, 2
    o = []
    x0, dx, y = 90, 140, 90
    xs = [x0 + i * dx for i in range(d + 1)]
    o.append(W(xs[0], y, xs[-1], y, c=LIN, lw=2))
    for i, x in enumerate(xs):
        cw = i in (0, d)
        o.append(CIRC(x, y, 9 if cw else 5, BLU if i == 0 else (ALI if cw else MUT), 1.5,
                      (BLU if i == 0 else ALI) if cw else PAN))
        o.append(T(x, y + 40, "距離 %d" % i, "middle", 10.5, MUT))
    o.append(T(xs[0], y - 40, "c₁（送った）", "middle", 12, BLU, True))
    o.append(T(xs[-1], y - 40, "c₂（別の符号語）", "middle", 12, ALI, True))
    o.insert(0, RECT(xs[-1] - t * dx - 22, y - 26, t * dx + 44, 52, 20, ASOFT, ALI, 1.4, "5,3"))
    o.append(T(xs[-1] - t * dx / 2, y + 56, "c₂ の訂正範囲（t = 1）", "middle", 11, ALI, True))
    o.append(ARR(xs[0], y + 80, xs[e], y + 80, BLU, 2))
    o.append(T((xs[0] + xs[e]) / 2, y + 98, "e = 2 ビットまでの誤りで届く範囲", "middle", 11, BLU))
    o.append(T(20, 224, "e + t = 3 ≤ d_min − 1 = 3 なので、c₁ から e ビット以内の受信語は c₂ の訂正範囲に入らない。", "start", 11.5, INK))
    o.append(T(20, 244, "→ 誤って c₂ に「訂正」することはなく、訂正範囲の外にある受信語は「訂正できない誤り」として検出される。", "start", 11.5, SIG, True))
    return SVG(740, 258, o, "d_min = 4 の符号で、1 ビットまで訂正し 2 ビットまで検出する運用（t = 1、e = 2）。"
               "青い矢印の届く範囲と、赤い訂正範囲が重ならなければよい。")
F["e06_te"] = _f06_te()


# 7. ハミング限界: 球で全体を埋める
def _f06_packing():
    o = []
    def grid(x0, y0, groups, gsize, total, cols, title, note, tc):
        o.append(T(x0, y0 - 14, title, "start", 13, tc, True))
        cs = 12
        k = 0
        cols_per_group = gsize
        for g in range(total):
            row, col = divmod(g, cols)
            gi = g // gsize
            used = gi < groups
            fl = [SSOFT, BSOFT][gi % 2] if used else PAN
            c = [SIG, BLU][gi % 2] if used else LIN
            o.append(RECT(x0 + col * (cs + 2), y0 + row * (cs + 2), cs, cs, 2, fl, c, 1))
        o.append(T(x0, y0 + (total // cols) * (cs + 2) + 18, note, "start", 11.5, INK))
    grid(20, 46, 16, 8, 128, 32, "(7,4) ハミング符号: 16 個の球 × 8 個 = 128 = 2⁷", "全体を隙間なく埋め尽くす（完全符号）", SIG)
    grid(510, 46, 8, 7, 64, 16, "(6,3) 符号（t = 1）: 8 × 7 = 56 ≤ 64", "灰色の 8 個はどの球にも入らない", BLU)
    return SVG(800, 170, o, "1 マスが 1 つのビット列。同じ色の連続した塊が 1 つの符号語の球（半径 1）で、"
               "符号語自身と、そこから 1 ビット反転した n 個を含む。球は重ならないので、合計は全体の個数を超えない。")
F["e06_packing"] = _f06_packing()


# 8. シングルトン限界: 先頭 d-1 個を削っても区別できる
def _f06_singleton():
    C = ["00000", "01011", "10101", "11110"]
    o = []
    x0, y0, cw = 120, 40, 34
    o.append(T(x0 + 17, 26, "削る（d_min − 1 = 2 個）", "start", 11, ALI, True))
    for r, c in enumerate(C):
        y = y0 + r * 38
        o.append(T(x0 - 16, y + 19, "c%d" % (r + 1), "end", 12, INK, True, True))
        o.append(_bits(x0, y, c, cw, 30, hl={0, 1}, hlc=FNT, hlf=SCR))
        o.append(W(x0 - 2, y + 15, x0 + 2 * cw - 4, y + 15, c=ALI, lw=2))
        o.append(ARR(x0 + 5 * cw + 10, y + 15, x0 + 5 * cw + 60, y + 15, MUT, 1.4))
        o.append(_bits(x0 + 5 * cw + 72, y, c[2:], cw, 30, c=BLU, fill=BSOFT))
    o.append(T(500, 70, "残った 3 ビット 000, 011, 101, 110 は", "start", 12, INK))
    o.append(T(500, 92, "すべて異なる → 4 = 2ᵏ 個を区別できる", "start", 12, INK))
    o.append(T(500, 122, "残りの長さ n − d_min + 1 = 3 ビットで", "start", 12, INK))
    o.append(T(500, 144, "2³ = 8 ≥ 2ᵏ = 4 が必要 → d_min ≤ n − k + 1", "start", 12, SIG, True))
    return SVG(820, 200, o, "(5, 2) 符号 {00000, 01011, 10101, 11110}（d_min = 3）の例。"
               "どの 2 つの符号語も 3 か所以上で違うので、2 か所を削っても少なくとも 1 か所の違いが残る。")
F["e06_singleton"] = _f06_singleton()


# 9. ギルバート・ヴァルシャモフ: 選ぶたびに近くを禁止する
def _f06_gv():
    V = ["".join(p) for p in _product("01", repeat=4)]
    first, second = "0000", "0111"
    f1 = {v for v in V if _ham(v, first) <= 2}
    f2 = {v for v in V if _ham(v, second) <= 2} - f1
    o = []
    def panel(x0, title, chosen, forb1, forb2):
        o.append(T(x0, 24, title, "start", 12.5, INK, True))
        for i, v in enumerate(V):
            r, c = divmod(i, 4)
            x, y = x0 + c * 78, 40 + r * 40
            if v in chosen:
                fl, col, tc = BLU, BLU, PAN
            elif v in forb1:
                fl, col, tc = BSOFT, BLU, INK
            elif v in forb2:
                fl, col, tc = ASOFT, ALI, INK
            else:
                fl, col, tc = PAN, LIN, INK
            o.append(RECT(x, y, 70, 30, 6, fl, col, 1.3))
            o.append(T(x + 35, y + 20, v, "middle", 12, tc, v in chosen, True))
    panel(20, "① 0000 を選び、距離 2 以内の 11 個を禁止", {first}, f1 - {first}, set())
    panel(380, "② 残り 5 個から 0111 を選び、その近くも禁止", {first, second}, f1 - {first}, f2 - {second})
    o.append(T(20, 218, "1 個選ぶごとに禁止されるのは多くとも V(4, 2) = 1 + 4 + 6 = 11 個。", "start", 11.5, INK))
    o.append(T(20, 238, "禁止の合計が 2⁴ = 16 個に届かない限り、次の符号語を選べる。", "start", 11.5, INK))
    return SVG(720, 252, o, "n = 4、d = 3 で符号語を 1 つずつ選ぶ様子。選んだ符号語どうしは必ず距離 3 以上離れる。")
F["e06_gv"] = _f06_gv()


# 10. 2 元対称通信路
def _f06_bsc():
    o = []
    lx, rx, y0, y1 = 120, 460, 50, 170
    for y, b in [(y0, "0"), (y1, "1")]:
        o.append(CIRC(lx, y, 20, BLU, 1.8, BSOFT)); o.append(T(lx, y + 6, b, "middle", 16, BLU, True, True))
        o.append(CIRC(rx, y, 20, SIG, 1.8, SSOFT)); o.append(T(rx, y + 6, b, "middle", 16, SIG, True, True))
    o.append(ARR(lx + 22, y0, rx - 24, y0, INK, 1.8)); o.append(T((lx + rx) / 2, y0 - 10, "1 − p（正しく届く）", "middle", 11.5, INK))
    o.append(ARR(lx + 22, y1, rx - 24, y1, INK, 1.8)); o.append(T((lx + rx) / 2, y1 + 22, "1 − p（正しく届く）", "middle", 11.5, INK))
    o.append(ARR(lx + 18, y0 + 10, rx - 20, y1 - 12, ALI, 1.6))
    o.append(ARR(lx + 18, y1 - 10, rx - 20, y0 + 12, ALI, 1.6))
    o.append(T((lx + rx) / 2 - 64, (y0 + y1) / 2 - 4, "p（反転）", "middle", 11.5, ALI, True))
    o.append(T(lx, 218, "送ったビット", "middle", 11.5, MUT)); o.append(T(rx, 218, "受け取ったビット", "middle", 11.5, MUT))
    o.append(T(560, 90, "各ビットが独立に", "start", 12, INK))
    o.append(T(560, 112, "確率 p で反転する", "start", 12, INK))
    o.append(T(560, 140, "例: p = 0.1 なら", "start", 12, INK))
    o.append(T(560, 162, "10 ビットに 1 ビット程度", "start", 12, INK))
    return SVG(740, 232, o, "2 元対称通信路。0 と 1 のどちらを送っても、同じ確率 p で反転する。")
F["e06_bsc"] = _f06_bsc()


# 11. 誤りのモデル
def _f06_models():
    o = []
    n = 20
    rows = [("ランダム誤り", {2, 7, 13, 17}, "×", ALI, ASOFT, "各ビットが独立に反転する"),
            ("バースト誤り", {8, 9, 10, 11, 12}, "×", ALI, ASOFT, "連続した区間がまとめて壊れる"),
            ("消失", {4, 11, 15}, "?", BLU, BSOFT, "壊れた位置は分かるが、値が分からない")]
    for r, (name, pos, mk, c, fl, note) in enumerate(rows):
        y = 20 + r * 58
        o.append(T(20, y + 20, name, "start", 12.5, INK, True))
        for i in range(n):
            on = i in pos
            o.append(RECT(130 + i * 24, y + 4, 21, 24, 3, fl if on else PAN, c if on else LIN, 1.2))
            o.append(T(130 + i * 24 + 10.5, y + 21, mk if on else "", "middle", 12, c, True, True))
        o.append(T(130, y + 44, note, "start", 11, MUT))
    return SVG(640, 196, o, "1 マスが 1 ビット。印の付いたマスが壊れたビット。")
F["e06_models"] = _f06_models()


# 12. インターリーブ
def _f06_interleave():
    o = []
    names = ["A", "B", "C"]
    cols = [BLU, SIG, ALI]
    fills = [BSOFT, SSOFT, ASOFT]
    L = 6
    o.append(T(20, 22, "① 符号語 3 個（各 6 ビット）", "start", 12.5, INK, True))
    for r in range(3):
        for i in range(L):
            o.append(RECT(40 + i * 28, 34 + r * 30, 25, 25, 3, fills[r], cols[r], 1.2))
            o.append(T(40 + i * 28 + 12.5, 34 + r * 30 + 17, "%s%d" % (names[r], i + 1), "middle", 9.5, INK, False, True))
    o.append(T(250, 22, "② 列ごとに A, B, C, A, B, C, … の順で送る", "start", 12.5, INK, True))
    burst = {6, 7, 8}
    for j in range(3 * L):
        r, i = j % 3, j // 3
        hit = j in burst
        o.append(RECT(250 + j * 26, 60, 23, 25, 3, ASOFT if hit else fills[r], ALI if hit else cols[r], 2 if hit else 1.2))
        o.append(T(250 + j * 26 + 11.5, 77, "%s%d" % (names[r], i + 1), "middle", 9, INK, hit, True))
    o.append(W(250 + 6 * 26 - 2, 96, 250 + 9 * 26 - 4, 96, c=ALI, lw=3))
    o.append(T(250 + 7.5 * 26, 114, "長さ 3 のバースト", "middle", 11, ALI, True))
    o.append(T(250, 150, "③ 並べ直すと、壊れたのは A3、B3、C3 の 1 ビットずつ", "start", 12.5, INK, True))
    o.append(T(250, 172, "→ 1 ビット訂正できる符号でも、3 個とも直せる", "start", 12, SIG, True))
    return SVG(740, 190, o, "インターリーブ。連続した誤りを、複数の符号語に 1 ビットずつ分散させる。")
F["e06_interleave"] = _f06_interleave()
