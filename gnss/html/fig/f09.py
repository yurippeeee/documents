# -*- coding: utf-8 -*-
# 09 章 LNA とフィルタ の図。figures.py の部品をそのまま使う（exec で読み込まれる）。
import math as _f09_m

_F09_K = 1.380649e-23
_F09_T0 = 290.0


def _f09_u(d):
    return 10 ** (d / 10.0)


def _f09_db(x):
    return 10 * _f09_m.log10(x)


# 例の段（4 章 1 節と同じ）: (名前, 利得 dB, 雑音指数 dB)
_F09_ST = [("LNA", 18.0, 1.0), ("フィルタ", -1.5, 1.5), ("チップの増幅 1", 20.0, 3.0), ("チップの増幅 2", 68.5, 3.0)]


def _f09_chain(st, tant=100.0, c=-128.5):
    """各段の (名前, その段の Te, 前の利得の積, 寄与, 積み上げた Tsys, C/N0) を返す。"""
    g = 1.0; tot = 0.0; rows = []
    for n, G, NF in st:
        te = (_f09_u(NF) - 1) * _F09_T0
        ci = te / g; tot += ci
        tsys = tant + tot
        rows.append((n, te, g, ci, tsys, c - (_f09_db(_F09_K * tsys) + 30)))
        g *= _f09_u(G)
    return rows


# =====================================================================
# 1 節: 2 段の雑音の流れ（入力に換算する考え方）
# =====================================================================
def _f09_twostage_fig():
    o = []
    y = 40; h = 58
    o.append(TX(14, 20, "2 段をつないだときの雑音の密度（÷ k_B で温度にして書く）", "start", 11, INK, True))
    # 入力
    o.append(TX(20, y + 26, "入力 T_{in}", "start", 10.5, TEA, True))
    o.append(ARR(92, y + 22, 150, y + 22, c=TEA, lw=1.6))
    o.append(BOX(150, y, 130, h, "1 段目", None, c=SIG))
    o.append(TX(215, y + 44, "G_1, T_{e1}", "middle", 10.5, SIG))
    o.append(ARR(280, y + 22, 380, y + 22, c=TEA, lw=1.6))
    o.append(BOX(380, y, 130, h, "2 段目", None, c=SIG))
    o.append(TX(445, y + 44, "G_2, T_{e2}", "middle", 10.5, SIG))
    o.append(ARR(510, y + 22, 600, y + 22, c=TEA, lw=1.6))
    o.append(T(604, y + 26, "出力", "start", 10.5, TEA, True))
    # 途中の値
    o.append(TX(330, y + 12, "G_1(T_{in} + T_{e1})", "middle", 10, TEA, halo=True))
    o.append(TX(560, y + 12, "G_{1}G_{2}(…)", "middle", 10, TEA, halo=True))
    # 下段: 入力に換算した温度の積み上げ
    yb = 150
    o.append(T(14, yb - 12, "入力に換算すると（どれも 1 段目の入力での温度）", "start", 10.5, INK, True))
    x0 = 150; sc = 2.0
    segs = [(TEA, 100, "T_{in}"), (SIG, 75, "T_{e1}"), (GLD, 30, "T_{e2}/G_1")]
    xx = x0
    for c, v, lab in segs:
        o.append(RECT(xx, yb, v * sc, 30, 3, soft(c), c, 1.3))
        o.append(TX(xx + v * sc / 2, yb + 20, lab, "middle", 10.5, c, True, halo=True))
        xx += v * sc
    o.append(TX(xx + 10, yb + 20, "= T_{in} + T_e", "start", 10.5, INK, True))
    o.append(TX(x0, yb + 50, "2 段目の雑音 T_{e2} は、1 段目の利得 G_1 で割った大きさで効く", "start", 10, MUT))
    return SVG(700, 216, o, "2 段の増幅器をつないだときの雑音の流れ。2 段目の雑音は、1 段目で G₁ 倍になった信号と出会うので、1 段目の入力に換算すると Tₑ₂/G₁ の大きさになる。2 段をまとめた雑音温度は Tₑ₁ + Tₑ₂/G₁ である。")


F["e09_twostage"] = _f09_twostage_fig()


# =====================================================================
# 1 節: 4 章 1 節の例の段ごとの寄与（積み上げ）と C/N0 の推移
# =====================================================================
def _f09_cascade_fig():
    o = []
    rows = _f09_chain(_F09_ST)
    o.append(TX(14, 20, "(a) システム雑音温度 T_{sys} の内訳（入力に換算）", "start", 11, INK, True))
    p = Plot(70, 40, 560, 34, (0, 200), (0, 1))
    o.append(p.axes(xl="雑音温度 [K]", yl=None, xt=[0, 50, 100, 150, 200], yt=[], grid=False))
    cols = [TEA, SIG, GLD, ALI, PUR]
    vals = [("アンテナ", 100.0)] + [(r[0], r[3]) for r in rows]
    xx = 0.0
    for i, (n, v) in enumerate(vals):
        o.append(RECT(p.X(xx), p.y + 4, max(p.X(xx + v) - p.X(xx), 0.8), 26, 2, soft(cols[i]), cols[i], 1.2))
        xx += v
    # ラベル（太い帯は中に、細い帯は下に引き出す）
    for s, xv, c in [("アンテナ 100 K", 50, TEA), ("LNA 75.1 K", 137.5, SIG)]:
        o.append(T(p.X(xv), p.y + 21, s, "middle", 10, c, True, halo=True))
    o.append(W(p.X(176.0), p.y + 30, p.X(176.0), p.y + 66, c=GLD, lw=1))
    o.append(T(p.X(176.0) - 4, p.y + 64, "フィルタ: 1.9 K", "end", 9.5, GLD, True, halo=True))
    o.append(W(p.X(180.2), p.y + 30, p.X(180.2), p.y + 82, c=ALI, lw=1))
    o.append(T(p.X(180.2) - 4, p.y + 80, "チップの増幅 1: 6.5 K", "end", 9.5, ALI, True, halo=True))
    o.append(W(p.X(183.5), p.y + 30, p.X(183.5), p.y + 98, c=PUR, lw=1))
    o.append(T(p.X(183.5) - 4, p.y + 96, "チップの増幅 2: 0.06 K（細すぎて見えない）", "end", 9.5, PUR, True, halo=True))
    o.append(TX(p.X(183.5) + 6, p.y - 4, "T_{sys} = 183.5 K", "start", 10, INK, True, halo=True))
    # (b) C/N0 の推移
    yb = 190
    o.append(TX(14, yb, "(b) 各段を通った後の C/N_0（その段までの雑音で計算）", "start", 11, INK, True))
    q = Plot(110, yb + 18, 520, 150, (-0.5, 4.5), (46.5, 50.5))
    names = ["アンテナ", "LNA", "フィルタ", "増幅 1", "増幅 2"]
    o.append(q.axes(xl=None, yl="C/N_0 [dB-Hz]", xt=[], yt=[47, 48, 49, 50], yfmt=lambda v: "%d" % v))
    cn = [-128.5 - (_f09_db(_F09_K * 100.0) + 30)] + [r[5] for r in rows]
    o.append(q.line([(i, v) for i, v in enumerate(cn)], c=SIG, lw=2.2))
    for i, v in enumerate(cn):
        o.append(D(q.X(i), q.Y(v), SIG, 4))
        o.append(T(q.X(i), q.Y(v) - 9, "%.1f" % v, "middle", 10, SIG, True, halo=True))
        o.append(T(q.X(i), q.y + q.h + 16, names[i], "middle", 10, MUT))
    o.append(T(q.X(2.6), q.Y(49.6), "LNA の後は、ほとんど下がらない", "middle", 10, GRN, True, halo=True))
    return SVG(700, 392, o, "4 章 1 節の例の段（LNA 1 dB・18 dB、フィルタ 1.5 dB、チップの中の増幅 20 dB と 68.5 dB（雑音指数 3 dB、例の値））をフリスの式で計算した結果。(a) システム雑音温度の内訳。ほとんどがアンテナと LNA で、フィルタとチップの増幅器は LNA の利得で割られて細い帯になる。(b) 各段を通った後の C/N0。LNA で 2.4 dB 下がり、その後は合わせて 0.2 dB しか下がらない。")


F["e09_cascade"] = _f09_cascade_fig()


# =====================================================================
# 2 節: LNA の利得と雑音指数を変えたときの全体の C/N0
# =====================================================================
def _f09_lna_nfg_fig():
    o = []
    p = Plot(90, 30, 470, 230, (0, 30), (43, 49))
    o.append(p.axes(xl="LNA の利得 G_1 [dB]", yl="全部の段の後の C/N_0 [dB-Hz]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[43, 44, 45, 46, 47, 48, 49], yfmt=lambda v: "%d" % v))
    cols = [(0.5, GRN), (1.0, SIG), (2.0, GLD), (3.0, ALI)]
    for nf, c in cols:
        pts = []
        for i in range(0, 61):
            g = i * 0.5
            r = _f09_chain([("LNA", g, nf)] + _F09_ST[1:])
            pts.append((g, r[-1][5]))
        o.append(p.clip(pts, c=c, lw=2.2))
        o.append(TX(p.X(30) + 6, p.Y(pts[-1][1]) + 4, "NF %.1f dB" % nf, "start", 10, c, True))
    r = _f09_chain(_F09_ST)
    o.append(D(p.X(18), p.Y(r[-1][5]), SIG, 4.5))
    o.append(T(p.X(18), p.Y(r[-1][5]) + 18, "例: 18 dB・1 dB で 47.5", "middle", 10, SIG, True, halo=True))
    o.append(W(p.X(15), p.y, p.X(15), p.y + p.h, c=MUT, lw=1, dash="4 3"))
    o.append(T(p.X(15) - 4, p.y + 14, "15 dB を超えると平ら", "end", 9.5, MUT, False, halo=True))
    return SVG(700, 300, o, "LNA の利得（横軸）と雑音指数（線の色）を変えたときの、全部の段の後の C/N0（ほかの段は 1 節の例の値）。利得が小さいと後の段の雑音が効いて下がる。利得 15 dB を超えると平らになり、その高さは LNA の雑音指数で決まる。")


F["e09_lna_nfg"] = _f09_lna_nfg_fig()


# =====================================================================
# 2 節: 入力と出力の電力の関係と 1 dB 圧縮点（例: 利得 18 dB、入力 P1dB −10 dBm）
# =====================================================================
def _f09_rapp(pin_dbm, g_db=18.0, psat_dbm=9.165, s=2.0):
    """Rapp のモデル（滑らかに飽和する増幅器）の出力電力 [dBm]。"""
    vin = 10 ** (pin_dbm / 20.0); vs = 10 ** (psat_dbm / 20.0); g = 10 ** (g_db / 20.0)
    v = g * vin / (1 + (g * vin / vs) ** (2 * s)) ** (1 / (2 * s))
    return 20 * _f09_m.log10(v)


def _f09_find_p1db(g_db=18.0, psat=9.165):
    lo, hi = -60.0, 20.0
    for _ in range(80):
        m = (lo + hi) / 2
        if _f09_rapp(m, g_db, psat) - m > g_db - 1.0:
            lo = m
        else:
            hi = m
    return lo


def _f09_p1db_fig():
    o = []
    p = Plot(90, 28, 470, 240, (-40, 10), (-20, 20))
    o.append(p.axes(xl="入力の電力 [dBm]", yl="出力の電力 [dBm]", xt=[-40, -30, -20, -10, 0, 10], yt=[-20, -10, 0, 10, 20]))
    o.append(p.clip([(x, x + 18) for x in range(-40, 3)], c=MUT, lw=1.4))
    o.append(p.clip([(x, x + 17) for x in range(-40, 4)], c=MUT, lw=1.0))
    pts = [(-40 + i * 0.25, _f09_rapp(-40 + i * 0.25)) for i in range(0, 201)]
    o.append(p.clip(pts, c=SIG, lw=2.4))
    pi = _f09_find_p1db()
    po = _f09_rapp(pi)
    o.append(D(p.X(pi), p.Y(po), ALI, 4.5))
    o.append(W(p.X(pi), p.Y(po), p.X(pi), p.y + p.h, c=ALI, lw=1, dash="4 3"))
    o.append(W(p.x, p.Y(po), p.X(pi), p.Y(po), c=ALI, lw=1, dash="4 3"))
    o.append(T(p.X(pi) + 8, p.Y(po) + 16, "1 dB 圧縮点", "start", 10, ALI, True, halo=True))
    o.append(T(p.X(pi) + 8, p.Y(po) + 30, "入力 P1dB = %.0f dBm" % pi, "start", 10, ALI, False, halo=True))
    o.append(T(p.X(-36), p.Y(-6), "傾き 1（利得 18 dB）", "start", 10, MUT, False, halo=True))
    o.append(T(p.X(-6), p.Y(16.5), "利得が 1 dB 下がった線", "end", 9.5, MUT, False, halo=True))
    o.append(T(p.X(5), p.Y(4), "出力が頭打ち", "middle", 10, SIG, True, halo=True))
    return SVG(700, 306, o, "増幅器の入力と出力の電力の関係（例: 利得 18 dB、入力 P1dB −10 dBm の、滑らかに飽和するモデル）。入力が小さい間は傾き 1 の直線（利得一定）で、強くなると出力が頭打ちになり利得が下がる（利得の圧縮）。利得が 1 dB 下がる点が P1dB である。衛星の信号は −128.5 dBm で、この図の左の外のずっと遠くにある。")


F["e09_p1db"] = _f09_p1db_fig()


# =====================================================================
# 3 節: SAW フィルタの仕組み（左）と通過特性の形（右、例の値）
# =====================================================================
def _f09_comb(o, x, y, n, c, flip=False):
    """くし形の電極（上下 2 本の母線と、交互に伸びる歯）。"""
    o.append(RECT(x, y, n * 12 + 6, 6, 1, soft(c), c, 1.1))
    o.append(RECT(x, y + 60, n * 12 + 6, 6, 1, soft(c), c, 1.1))
    for i in range(n):
        xx = x + 4 + i * 12
        if i % 2 == 0:
            o.append(RECT(xx, y + 6, 4, 46, 1, soft(c), c, 1.0))
        else:
            o.append(RECT(xx, y + 14, 4, 46, 1, soft(c), c, 1.0))


def _f09_saw_fig():
    o = []
    o.append(T(14, 20, "(a) 仕組み（上から見た図）", "start", 11, INK, True))
    o.append(RECT(20, 36, 300, 120, 6, PAN, LIN, 1.3))
    o.append(T(170, 172, "圧電体の基板", "middle", 10, MUT))
    _f09_comb(o, 34, 62, 7, SIG)
    _f09_comb(o, 226, 62, 7, SIG)
    for k in range(4):
        xx = 130 + k * 22
        o.append(PATH("M %d 82 q 5 -8 10 0 q 5 8 10 0" % xx, c=GLD, lw=1.6))
    o.append(ARR(130, 104, 216, 104, c=GLD, lw=1.5))
    o.append(T(173, 120, "表面を伝わる音の波", "middle", 10, GLD, True, halo=True))
    o.append(T(76, 54, "入力の電極", "middle", 10, SIG, True, halo=True))
    o.append(T(268, 54, "出力の電極", "middle", 10, SIG, True, halo=True))
    o.append(T(76, 146, "電気 → 音", "middle", 9.5, MUT, False, halo=True))
    o.append(T(268, 146, "音 → 電気", "middle", 9.5, MUT, False, halo=True))
    # (b) 通過特性
    o.append(T(356, 20, "(b) 通過特性の形（例の値）", "start", 11, INK, True))
    p = Plot(406, 36, 270, 140, (1475, 1675), (-55, 0))
    o.append(p.axes(xl="周波数 f [MHz]", yl="通過 [dB]", xt=[1475, 1525, 1575, 1625, 1675], yt=[-50, -40, -30, -20, -10, 0]))
    pts = []
    for i in range(0, 201):
        f = 1475 + i
        a = -1.5 - 45.0 * (1 - _f09_m.exp(-((f - 1575.42) / 28.0) ** 4))
        pts.append((f, a))
    o.append(p.clip(pts, c=SIG, lw=2.2))
    o.append(W(p.X(1575.42), p.y, p.X(1575.42), p.y + p.h, c=GRN, lw=1, dash="4 3"))
    o.append(T(p.X(1575.42) - 4, p.Y(-20), "L1", "end", 10, GRN, True, halo=True))
    o.append(T(p.X(1606), p.Y(-6), "挿入損失 1.5 dB", "start", 9.5, SIG, False, halo=True))
    o.append(T(p.X(1500), p.Y(-40), "−46.5 dB", "middle", 9.5, SIG, False, halo=True))
    return SVG(700, 226, o, "SAW フィルタ。(a) 入力のくし形の電極が電気の信号を基板の表面を伝わる音の波に変え、出力の電極が電気に戻す。歯の間隔と音の波の波長が合う周波数だけが強く伝わる。(b) 通過特性の形の例（挿入損失 1.5 dB、L1 から 100 MHz 離れた所で 45 dB 弱める、とした例の値）。")


F["e09_saw"] = _f09_saw_fig()


# =====================================================================
# 3 節: フィルタの置き場所の 3 通りの比較
# =====================================================================
def _f09_filter_pos_fig():
    o = []
    cfgs = [
        ("(a) LNA の後", [("LNA", SIG), ("SAW", GLD), ("チップ", MUT)], [("LNA", 18, 1.0), ("SAW", -1.5, 1.5)] + _F09_ST[2:], "弱められずに入る", ALI),
        ("(b) LNA の前", [("SAW", GLD), ("LNA", SIG), ("チップ", MUT)], [("SAW", -1.5, 1.5), ("LNA", 18, 1.0)] + _F09_ST[2:], "30〜50 dB 弱められる", GRN),
        ("(c) 前に広いフィルタ", [("広い", TEA), ("LNA", SIG), ("SAW", GLD), ("チップ", MUT)], [("pre", -0.5, 0.5), ("LNA", 18, 1.0), ("SAW", -1.5, 1.5)] + _F09_ST[2:], "とても強い電波だけ弱める", GLD),
    ]
    o.append(TX(470, 18, "C/N_0", "middle", 10.5, INK, True))
    o.append(T(610, 18, "LNA に入る帯域外の電波", "middle", 10.5, INK, True))
    for k, (title, boxes, st, note, nc) in enumerate(cfgs):
        y = 30 + k * 70
        o.append(T(14, y + 26, title, "start", 10.5, INK, True))
        x = 140
        o.append(T(x - 4, y + 48, "アンテナ", "middle", 9.5, MUT))
        o.append(CIRC(x - 4, y + 24, 8, c=MUT, lw=1.3))
        x += 10
        for nm, c in boxes:
            o.append(ARR(x, y + 24, x + 14, y + 24, c=MUT, lw=1.3))
            o.append(BOX(x + 14, y + 8, 50, 32, nm, None, c=c, sz=10))
            x += 64
        r = _f09_chain(st)
        cn = r[-1][5]
        o.append(T(470, y + 22, "%.1f dB-Hz" % cn, "middle", 11, SIG if k == 0 else (ALI if k == 1 else GLD), True))
        nf = _f09_db(1 + (r[-1][4] - 100.0) / _F09_T0)
        o.append(T(470, y + 38, "全体の NF %.2f dB" % nf, "middle", 9.5, MUT))
        o.append(T(610, y + 28, note, "middle", 10, nc, True))
    return SVG(700, 240, o, "フィルタの置き場所の 3 通り（値は 1 節の例）。(a) LNA の後に置くと C/N0 は最も良いが、帯域の外の強い電波が LNA に入る。(b) 前に置くと LNA は守られるが、SAW の損失 1.5 dB が雑音指数に加わり、C/N0 は 2.6 dB 下がる。(c) 損失の小さい帯域の広いフィルタを前に、鋭い SAW を後に置く兼ね合いの構成。")


F["e09_filter_pos"] = _f09_filter_pos_fig()


# =====================================================================
# 3 節: LNA の前の損失と C/N0 の減り（アンテナの雑音温度で違う）
# =====================================================================
def _f09_mismatch_fig():
    o = []
    p = Plot(90, 28, 470, 230, (0, 3), (0, 5))
    o.append(p.axes(xl="LNA の前の損失 [dB]", yl="C/N_0 の減り [dB]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[0, 1, 2, 3, 4, 5]))
    base = {}
    for tant, c, lab in [(100.0, SIG, "T_{ant} = 100 K（例）"), (290.0, GLD, "T_{ant} = 290 K")]:
        b = _f09_chain(_F09_ST, tant)[-1][5]
        pts = []
        for i in range(0, 61):
            L = i * 0.05
            r = _f09_chain([("loss", -L, L)] + _F09_ST, tant)
            pts.append((L, b - r[-1][5]))
        base[tant] = pts
        o.append(p.clip(pts, c=c, lw=2.2))
        o.append(TX(p.X(3) + 6, p.Y(pts[-1][1]) + 4, lab, "start", 10, c, True))
    o.append(p.clip([(0, 0), (3, 3)], c=MUT, lw=1.0, dash="4 3"))
    o.append(T(p.X(2.2), p.Y(2.2) + 16, "損失の dB と同じ", "middle", 9.5, MUT, False, halo=True))
    # 不整合損失 0.46 dB
    L = 0.4576
    r = _f09_chain([("loss", -L, L)] + _F09_ST, 100.0)
    d = _f09_chain(_F09_ST, 100.0)[-1][5] - r[-1][5]
    o.append(D(p.X(L), p.Y(d), ALI, 4.5))
    o.append(T(p.X(L) + 8, p.Y(d) - 8, "不整合損失 0.46 dB → %.1f dB" % d, "start", 10, ALI, True, halo=True))
    o.append(D(p.X(1.5), p.Y(base[100.0][30][1]), GLD, 4.5))
    o.append(T(p.X(1.5) + 8, p.Y(base[100.0][30][1]) - 8, "SAW を前に → %.1f dB" % base[100.0][30][1], "start", 10, GLD, True, halo=True))
    return SVG(700, 300, o, "LNA の前の損失（横軸）と、C/N0 の減り（縦軸）。後には 1 節の例の段が続くとした。アンテナの雑音温度が 290 K なら減りは損失の dB にほぼ等しいが、冷たい空を見る 100 K のアンテナでは、損失の dB より多く下がる。赤の点は 8 章 6 節の不整合損失 0.46 dB を熱に変わる損失とみなした目安。")


F["e09_mismatch"] = _f09_mismatch_fig()


# =====================================================================
# 4 節: 2 つの強い電波と、相互変調の積のスペクトラム（例の周波数）
# =====================================================================
def _f09_imd_spec_fig():
    o = []
    f1, f2 = 1712.71, 1850.00
    p = Plot(80, 34, 580, 210, (1500, 2050), (-160, -20))
    o.append(p.axes(xl="周波数 f [MHz]", yl="入力に換算した電力 [dBm]", xt=[1500, 1600, 1700, 1800, 1900, 2000], yt=[-160, -140, -120, -100, -80, -60, -40, -20]))
    # L1 の帯域
    o.append(RECT(p.X(1574.4), p.y, max(p.X(1576.44) - p.X(1574.4), 3), p.h, 0, soft(GRN), GRN, 0.8))
    o.append(T(p.X(1575.42), p.y - 6, "L1", "middle", 10, GRN, True))
    # SAW の通過特性（点線、右の目盛ではなく形だけ）
    pin = -40.0
    for f, c, lab in [(f1, ALI, "f_1"), (f2, ALI, "f_2")]:
        o.append(W(p.X(f), p.Y(-160), p.X(f), p.Y(pin), c=c, lw=2.6))
        o.append(TX(p.X(f), p.Y(pin) - 8, lab + " −40 dBm", "middle", 10, c, True, halo=True))
    im = 3 * pin - 0
    for f, lab, c in [(2 * f1 - f2, "2f_1 − f_2", ALI), (2 * f2 - f1, "2f_2 − f_1", GLD)]:
        o.append(W(p.X(f), p.Y(-160), p.X(f), p.Y(im), c=c, lw=2.2))
        o.append(TX(p.X(f) + (6 if f > 1600 else 6), p.Y(im) - 6, lab, "start", 10, c, True, halo=True))
    o.append(T(p.X(1575.42) + 8, p.Y(im) + 16, "= 1575.42 MHz（L1 に落ちる）", "start", 10, ALI, True, halo=True))
    o.append(T(p.X(1987.29) - 4, p.Y(im) + 16, "1987.29 MHz", "end", 9.5, GLD, False, halo=True))
    o.append(T(p.X(1781), p.Y(-70), "間隔 137.29 MHz", "middle", 9.5, MUT, False, halo=True))
    o.append(DARR(p.X(f1), p.Y(-78), p.X(f2), p.Y(-78), c=MUT, lw=1.1))
    o.append(T(p.X(1505), p.Y(-150), "IIP3 = 0 dBm（例）の LNA の入力に換算", "start", 9.5, MUT, False, halo=True))
    return SVG(700, 290, o, "2 つの強い電波（1712.71 MHz と 1850.00 MHz、−40 dBm ずつ。周波数と電力は例の値）が IIP3 0 dBm の LNA に入ったときの、3 次の相互変調の積（入力に換算した電力）。2f₁ − f₂ はちょうど L1 の 1575.42 MHz に落ち、−120 dBm になる。元の 2 つの電波は後の SAW フィルタで取り除けるが、L1 に落ちた積は取り除けない。")


F["e09_imd_spec"] = _f09_imd_spec_fig()


# =====================================================================
# 4 節: IIP3（傾き 1 と傾き 3 の直線の交点）と P1dB
# =====================================================================
def _f09_iip3_fig():
    o = []
    G = 18.0; iip3 = 0.0
    p = Plot(90, 28, 470, 250, (-60, 10), (-140, 30))
    o.append(p.axes(xl="電波 1 つあたりの入力の電力 P_{in} [dBm]", yl="出力の電力 [dBm]", xt=[-60, -50, -40, -30, -20, -10, 0, 10], yt=[-140, -120, -100, -80, -60, -40, -20, 0, 20]))
    o.append(p.clip([(-60, -60 + G), (10, 10 + G)], c=SIG, lw=1.4, dash="5 4"))
    o.append(p.clip([(-60, 3 * -60 - 2 * iip3 + G), (10, 30 - 2 * iip3 + G)], c=ALI, lw=1.4, dash="5 4"))
    # 測れる範囲（圧縮の手前まで）は実線、延ばした直線は点線
    pts1 = []; pts3 = []
    for i in range(0, 141):
        pin = -60 + i * 0.5
        pts1.append((pin, pin + G))
        pts3.append((pin, 3 * pin - 2 * iip3 + G))
    o.append(p.clip([(x, y) for x, y in pts1 if x <= -12], c=SIG, lw=2.4))
    o.append(p.clip([(x, y) for x, y in pts3 if x <= -12], c=ALI, lw=2.4))
    o.append(D(p.X(iip3), p.Y(iip3 + G), INK, 4.5))
    o.append(T(p.X(iip3) - 8, p.Y(iip3 + G) - 10, "交点: IIP3 = 0 dBm", "end", 10, INK, True, halo=True))
    o.append(W(p.X(iip3), p.Y(iip3 + G), p.X(iip3), p.y + p.h, c=MUT, lw=1, dash="3 3"))
    o.append(T(p.X(-57), p.Y(-56), "元の周波数（傾き 1）", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(-36), p.Y(-118), "3 次の相互変調の積（傾き 3）", "start", 10, ALI, True, halo=True))
    o.append(W(p.X(-40), p.Y(-40 + G), p.X(-40), p.Y(-120 + G), c=GLD, lw=1.2))
    o.append(T(p.X(-40) + 6, p.Y(-80 + G), "80 dB の差", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(-9.6) + 4, p.Y(-60), "P1dB ≈ IIP3 − 9.6 dB", "start", 9.5, MUT, False, halo=True))
    o.append(W(p.X(-9.6), p.Y(-55), p.X(-9.6), p.y + p.h, c=MUT, lw=1, dash="3 3"))
    return SVG(700, 320, o, "IIP3 の求め方（例: 利得 18 dB、IIP3 0 dBm）。元の周波数の出力は傾き 1、3 次の相互変調の積は傾き 3 で増える。2 本の直線を延ばした交点の入力の電力が IIP3 である。入力 −40 dBm では、相互変調の積は元の周波数より 80 dB 小さく、入力に換算して −120 dBm になる。実線は実際に測れる範囲、点線は延ばした直線。")


F["e09_iip3"] = _f09_iip3_fig()


# =====================================================================
# 5 節: アクティブアンテナの構成（断面）と受信機までのつながり
# =====================================================================
def _f09_active_fig():
    o = []
    o.append(T(14, 18, "(a) パッシブアンテナ", "start", 11, INK, True))
    y = 34
    o.append(RECT(20, y + 10, 70, 8, 2, soft(GLD), GLD, 1.2))
    o.append(RECT(14, y + 18, 82, 5, 1, soft(MUT), MUT, 1.0))
    o.append(T(55, y + 4, "パッチ", "middle", 9.5, GLD, True))
    o.append(W(96, y + 20, 300, y + 20, c=TEA, lw=3))
    o.append(TX(198, y + 12, "ケーブル（損失 L_c）", "middle", 10, TEA, True, halo=True))
    o.append(BOX(300, y + 2, 110, 36, "受信機", None, c=SIG, sz=10.5))
    o.append(T(355, y + 52, "LNA は受信機の中", "middle", 9.5, MUT))
    o.append(T(440, y + 18, "ケーブルの損失が LNA の前", "start", 10, ALI, True))
    o.append(T(440, y + 32, "→ 雑音指数にそのまま加わる", "start", 10, ALI, False))
    o.append(T(14, 118, "(b) アクティブアンテナ", "start", 11, INK, True))
    y = 134
    o.append(RECT(14, y - 14, 150, 96, 10, "none", MUT, 1.2, dash="5 4"))
    o.append(T(89, y + 96, "1 つの覆いの中", "middle", 9.5, MUT))
    o.append(RECT(30, y + 6, 70, 8, 2, soft(GLD), GLD, 1.2))
    o.append(RECT(24, y + 14, 82, 5, 1, soft(MUT), MUT, 1.0))
    o.append(T(65, y + 2, "パッチ", "middle", 9.5, GLD, True))
    o.append(BOX(24, y + 26, 40, 24, "LNA", None, c=SIG, sz=9.5))
    o.append(BOX(68, y + 26, 40, 24, "SAW", None, c=GLD, sz=9.5))
    o.append(BOX(112, y + 26, 44, 24, "増幅", None, c=SIG, sz=9.5))
    o.append(T(89, y + 66, "28 dB（例）", "middle", 10, SIG, True))
    o.append(W(156, y + 38, 300, y + 38, c=TEA, lw=3))
    o.append(TX(228, y + 30, "ケーブル（損失 L_c）", "middle", 10, TEA, True, halo=True))
    o.append(T(230, y + 56, "直流も同じ芯線で送る", "middle", 9.5, PUR, True, halo=True))
    o.append(BOX(300, y + 20, 110, 36, "受信機", None, c=SIG, sz=10.5))
    o.append(T(440, y + 32, "ケーブルの損失は LNA の後", "start", 10, GRN, True))
    o.append(T(440, y + 46, "→ 28 dB で割られて小さく効く", "start", 10, GRN, False))
    return SVG(700, 244, o, "パッシブアンテナとアクティブアンテナ。(a) パッシブアンテナでは、ケーブルの損失が受信機の LNA の前にあり、雑音指数にそのまま加わる。(b) アクティブアンテナは、パッチアンテナの地板の裏に LNA・SAW フィルタ・2 段目の増幅器を載せて 1 つの覆いに収めたもの（構成は例）。ケーブルの損失は増幅の後になる。LNA の電源は、同じケーブルの芯線で受信機の側から送る（バイアス T）。")


F["e09_active"] = _f09_active_fig()


# =====================================================================
# 5 節: ケーブルの長さと C/N0（パッシブとアクティブ）
# =====================================================================
_F09_ACT = [("LNA", 18.0, 1.0), ("SAW", -1.5, 1.5), ("増幅", 11.5, 2.0)]


def _f09_cable_fig():
    o = []
    p = Plot(90, 28, 470, 240, (0, 30), (28, 50))
    o.append(p.axes(xl="ケーブルの長さ [m]（1 m あたり 0.5 dB、例の値）", yl="C/N_0 [dB-Hz]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[30, 35, 40, 45, 50], yfmt=lambda v: "%d" % v))
    pp = []; pa = []
    for i in range(0, 61):
        m = i * 0.5; Lc = 0.5 * m
        rp = _f09_chain([("cable", -Lc, Lc)] + _F09_ST)
        ra = _f09_chain(_F09_ACT + [("cable", -Lc, Lc)] + _F09_ST[2:])
        pp.append((m, rp[-1][5])); pa.append((m, ra[-1][5]))
    o.append(p.clip(pa, c=GRN, lw=2.4))
    o.append(p.clip(pp, c=ALI, lw=2.4))
    o.append(T(p.X(30) - 4, p.Y(pa[-1][1]) - 10, "アクティブ（28 dB）", "end", 10, GRN, True, halo=True))
    o.append(T(p.X(17), p.Y(36.5), "パッシブ", "start", 10, ALI, True, halo=True))
    for m in (3, 10):
        Lc = 0.5 * m
        v = _f09_chain([("cable", -Lc, Lc)] + _F09_ST)[-1][5]
        o.append(D(p.X(m), p.Y(v), ALI, 4))
        o.append(T(p.X(m) - 6, p.Y(v) + 16, "%d m: %.1f" % (m, v), "end" if m == 3 else "start", 9.5, ALI, True, halo=True))
    v = _f09_chain(_F09_ACT + [("cable", -1.5, 1.5)] + _F09_ST[2:])[-1][5]
    o.append(D(p.X(3), p.Y(v), GRN, 4))
    o.append(T(p.X(3) + 6, p.Y(v) - 8, "3 m: %.1f" % v, "start", 9.5, GRN, True, halo=True))
    return SVG(700, 306, o, "ケーブルの長さ（横軸）と、受信機の後の C/N0（縦軸）。パッシブアンテナでは、ケーブルの損失が LNA の前にあるので、3 m で 2.6 dB、10 m で 7.3 dB 下がる。アクティブアンテナ（利得 28 dB、例の値）では、ケーブルの雑音がアンテナの中の利得で割られ、30 m でも下がりは 0.6 dB である。")


F["e09_cable"] = _f09_cable_fig()


# =====================================================================
# 5 節: バイアス T（受信機の側とアンテナの側）
# =====================================================================
def _f09_ind(o, x, y1, y2, c=INK):
    """縦向きのコイル（半円の連なり）。"""
    n = 4; h = (y2 - y1) / n
    d = "M %g %g" % (x, y1)
    for i in range(n):
        d += " a %g %g 0 0 1 0 %g" % (h / 2, h / 2, h)
    o.append(PATH(d, c=c, lw=1.6))


def _f09_cap_h(o, x, y, c=INK):
    """横向きの線の途中のコンデンサ（縦の 2 本の板）。"""
    o.append(W(x - 3, y - 10, x - 3, y + 10, c=c, lw=2))
    o.append(W(x + 3, y - 10, x + 3, y + 10, c=c, lw=2))


def _f09_biast_fig():
    o = []
    yc = 120
    # 中央の同軸
    o.append(RECT(250, yc - 9, 200, 18, 9, soft(TEA), TEA, 1.3))
    o.append(W(250, yc, 450, yc, c=INK, lw=1.4))
    o.append(T(350, yc + 30, "同軸ケーブル（芯線に RF と直流が重なる）", "middle", 10, TEA, True))
    # 受信機の側（左）
    o.append(T(130, 18, "受信機の側", "middle", 11, INK, True))
    o.append(W(250, yc, 196, yc, c=INK, lw=1.4))
    _f09_cap_h(o, 190, yc)
    o.append(W(184, yc, 60, yc, c=INK, lw=1.4))
    o.append(BOX(14, yc - 18, 46, 36, "受信", None, c=SIG, sz=10))
    o.append(T(190, yc + 26, "C（直流を止める）", "middle", 9.5, SIG, True, halo=True))
    o.append(D(220, yc, INK, 3))
    o.append(W(220, yc, 220, 96, c=INK, lw=1.4))
    _f09_ind(o, 220, 56, 96)
    o.append(W(220, 56, 220, 44, c=INK, lw=1.4))
    o.append(T(232, 80, "L（RF を止める）", "start", 9.5, PUR, True, halo=True))
    o.append(BOX(170, 20, 100, 24, "電源 3.3 V", None, c=PUR, sz=10))
    # アンテナの側（右）
    o.append(T(570, 18, "アンテナの側", "middle", 11, INK, True))
    o.append(W(450, yc, 504, yc, c=INK, lw=1.4))
    _f09_cap_h(o, 510, yc)
    o.append(W(516, yc, 560, yc, c=INK, lw=1.4))
    o.append(BOX(560, yc - 18, 60, 36, "LNA", "出力", c=SIG, sz=10))
    o.append(T(510, yc + 26, "C", "middle", 9.5, SIG, True, halo=True))
    o.append(D(480, yc, INK, 3))
    o.append(W(480, yc, 480, 96, c=INK, lw=1.4))
    _f09_ind(o, 480, 56, 96)
    o.append(W(480, 56, 480, 44, c=INK, lw=1.4))
    o.append(W(480, 44, 590, 44, 590, yc - 18, c=PUR, lw=1.4))
    o.append(T(536, 38, "LNA の電源", "middle", 9.5, PUR, True, halo=True))
    o.append(T(470, 80, "L", "end", 9.5, PUR, True, halo=True))
    # 流れ
    o.append(ARR(300, 170, 400, 170, c=PUR, lw=1.6))
    o.append(T(350, 186, "直流: 受信機 → アンテナ", "middle", 10, PUR, True))
    o.append(ARR(400, 206, 300, 206, c=SIG, lw=1.6))
    o.append(T(350, 222, "RF: アンテナ → 受信機", "middle", 10, SIG, True))
    return SVG(700, 236, o, "バイアス T。コイル L は直流を通して L1 の RF を止め、コンデンサ C は RF を通して直流を止める。受信機の側では、電源を L を通して芯線に重ね、受信機の入力は C でつなぐ。アンテナの側では、芯線の直流を L で取り出して LNA の電源にし、LNA の出力は C を通して芯線に出す。")


F["e09_biast"] = _f09_biast_fig()


# =====================================================================
# 6 節: アンテナの監視の回路（例）
# =====================================================================
def _f09_res_h(o, x1, x2, y, c=INK):
    """横向きの抵抗（ジグザグ）。"""
    n = 6; w = (x2 - x1) / n
    pts = [(x1, y)]
    for i in range(n):
        pts.append((x1 + w * (i + 0.5), y + (-6 if i % 2 == 0 else 6)))
    pts.append((x2, y))
    o.append(PL(pts, c=c, lw=1.6))


def _f09_comp(o, x, y, lab, c=SIG):
    """比較器の三角形（左に 2 入力、右に出力）。"""
    o.append(PATH("M %g %g L %g %g L %g %g Z" % (x, y - 20, x, y + 20, x + 36, y), c=c, lw=1.5, fill=PAN))
    o.append(T(x + 6, y - 6, "+", "start", 10, c, True))
    o.append(T(x + 6, y + 14, "−", "start", 10, c, True))
    o.append(T(x + 40, y + 4, lab, "start", 10, c, True))


def _f09_monitor_fig():
    o = []
    y = 60
    o.append(BOX(14, y - 18, 70, 36, "電源", "3.3 V", c=PUR, sz=10))
    o.append(W(84, y, 110, y, c=INK, lw=1.4))
    o.append(RECT(110, y - 12, 40, 24, 4, soft(GLD), GLD, 1.2))
    o.append(T(130, y + 4, "SW", "middle", 9.5, GLD, True))
    o.append(T(130, y - 18, "給電のスイッチ", "middle", 9.5, GLD, False, halo=True))
    o.append(W(150, y, 200, y, c=INK, lw=1.4))
    _f09_res_h(o, 200, 260, y)
    o.append(TX(230, y - 14, "R_s = 22 Ω", "middle", 10, INK, True, halo=True))
    o.append(W(260, y, 380, y, c=INK, lw=1.4))
    o.append(D(200, y, INK, 3)); o.append(D(260, y, INK, 3))
    o.append(BOX(380, y - 18, 110, 36, "バイアス T の L", None, c=PUR, sz=10))
    o.append(W(490, y, 540, y, c=TEA, lw=3))
    o.append(T(515, y - 8, "ケーブル", "middle", 9.5, TEA, True, halo=True))
    o.append(BOX(540, y - 18, 140, 36, "アクティブアンテナ", "15 mA（例）", c=SIG, sz=10))
    # 差の電圧 → 比較器（短絡: + に V_Rs、− に 1.1 V。開放: − に V_Rs、+ に 66 mV）
    o.append(W(200, y, 200, 104, c=INK, lw=1.2))
    o.append(W(260, y, 260, 104, c=INK, lw=1.2))
    o.append(BOX(180, 104, 100, 34, "差を測る", None, c=MUT, sz=10))
    o.append(W(230, 138, 230, 238, c=INK, lw=1.2))
    o.append(TX(222, 200, "V_{Rs} = I·R_s", "end", 9.5, MUT, False, halo=True))
    o.append(W(230, 142, 330, 142, c=INK, lw=1.2))
    o.append(D(230, 142, INK, 3))
    o.append(W(290, 158, 330, 158, c=ALI, lw=1.2))
    o.append(T(286, 162, "1.1 V", "end", 9.5, ALI, False, halo=True))
    o.append(W(230, 238, 330, 238, c=INK, lw=1.2))
    o.append(W(290, 222, 330, 222, c=GLD, lw=1.2))
    o.append(T(286, 226, "66 mV", "end", 9.5, GLD, False, halo=True))
    _f09_comp(o, 330, 150, "短絡（> 1.1 V）", ALI)
    _f09_comp(o, 330, 230, "開放（< 66 mV）", GLD)
    o.append(W(480, 150, 560, 150, c=ALI, lw=1.2))
    o.append(W(480, 230, 560, 230, c=GLD, lw=1.2))
    o.append(BOX(560, 130, 120, 120, "判定", "マイコンが読む。短絡なら SW を切る", c=MUT, sz=10.5, ssz=9.5))
    o.append(PATH("M 620 130 L 620 104 L 130 104 L 130 74", c=ALI, lw=1.1, dash="4 3"))
    o.append(T(420, 98, "短絡で切る", "middle", 9.5, ALI, False, halo=True))
    return SVG(700, 270, o, "アンテナの監視の回路（例）。給電の経路に入れた抵抗 Rₛ の両端の電圧（I·Rₛ）で電流を測り、2 つの比較器で、電流が大きすぎる（短絡）か小さすぎる（開放）かを判定する。Rₛ は短絡したときの電流も制限する。短絡と判定したら、給電のスイッチを切る。しきい値は例の値。")


F["e09_monitor"] = _f09_monitor_fig()


# =====================================================================
# 6 節: 電流と判定の範囲、R_s の選び方
# =====================================================================
def _f09_monitor_v_fig():
    o = []
    o.append(TX(14, 18, "(a) 給電の電流と判定（R_s = 22 Ω）", "start", 11, INK, True))
    p = Plot(70, 52, 600, 40, (0, 160), (0, 1))
    o.append(p.axes(xl="給電の電流 I [mA]", yl=None, xt=[0, 20, 40, 60, 80, 100, 120, 140, 160], yt=[], grid=False))
    o.append(RECT(p.X(0), p.y + 4, p.X(3) - p.X(0), 32, 0, soft(GLD), GLD, 1))
    o.append(RECT(p.X(3), p.y + 4, p.X(50) - p.X(3), 32, 0, soft(GRN), GRN, 1))
    o.append(RECT(p.X(50), p.y + 4, p.X(160) - p.X(50), 32, 0, soft(ALI), ALI, 1))
    o.append(T(p.X(34), p.y + 24, "正常（3〜50 mA）", "middle", 10, GRN, True, halo=True))
    o.append(T(p.X(105), p.y + 24, "短絡（50 mA を超える）", "middle", 10, ALI, True, halo=True))
    o.append(W(p.X(1.5), p.y + 4, p.X(1.5), p.y - 20, c=GLD, lw=1))
    o.append(T(p.X(1.5) - 4, p.y - 24, "開放（3 mA 未満）", "start", 9.5, GLD, True, halo=True))
    for v, c, lab in [(15, SIG, "正常 15"), (147, ALI, "短絡 147")]:
        o.append(D(p.X(v), p.y + 20, c, 4.5))
        o.append(T(p.X(v), p.y - 6, lab, "middle", 9.5, c, True, halo=True))
    # (b) R_s とアンテナの電圧・短絡の電流
    yb = 158
    o.append(TX(14, yb, "(b) R_s の選び方（3.3 V、15 mA、ケーブル 0.5 Ω、最低 2.7 V。例の値）", "start", 11, INK, True))
    q = Plot(70, yb + 16, 260, 150, (0, 60), (2.2, 3.4))
    o.append(q.axes(xl="R_s [Ω]", yl="アンテナの電圧 [V]", xt=[0, 20, 40, 60], yt=[2.2, 2.6, 3.0, 3.4], yfmt=lambda v: "%.1f" % v))
    o.append(q.clip([(r, 3.3 - 0.015 * (r + 0.5)) for r in range(0, 61)], c=SIG, lw=2.2))
    o.append(W(q.x, q.Y(2.7), q.x + q.w, q.Y(2.7), c=ALI, lw=1, dash="4 3"))
    o.append(T(q.x + q.w - 4, q.Y(2.7) + 14, "最低 2.7 V", "end", 9.5, ALI, False, halo=True))
    o.append(W(q.X(39.5), q.y, q.X(39.5), q.y + q.h, c=MUT, lw=1, dash="3 3"))
    o.append(T(q.X(39.5) + 4, q.y + 12, "上限 39.5 Ω", "start", 9.5, MUT, False, halo=True))
    o.append(D(q.X(22), q.Y(2.9625), GRN, 4.5))
    o.append(T(q.X(22) + 6, q.Y(2.9625) - 8, "22 Ω: 2.96 V", "start", 9.5, GRN, True, halo=True))
    r = Plot(430, yb + 16, 240, 150, (0, 60), (0, 400))
    o.append(r.axes(xl="R_s [Ω]", yl="短絡の電流 [mA]", xt=[0, 20, 40, 60], yt=[0, 100, 200, 300, 400]))
    o.append(r.clip([(x, 3300.0 / (x + 0.5)) for x in [0.5 + i * 0.5 for i in range(0, 120)]], c=ALI, lw=2.2))
    o.append(D(r.X(22), r.Y(146.7), GRN, 4.5))
    o.append(T(r.X(22) + 6, r.Y(146.7) - 8, "22 Ω: 147 mA", "start", 9.5, GRN, True, halo=True))
    return SVG(700, 378, o, "(a) 給電の電流と判定の範囲（しきい値は例の値）。正常の 15 mA と短絡の 147 mA は大きく離れ、開放はほぼ 0 mA である。(b) Rₛ を大きくするとアンテナに届く電圧が下がり（左）、短絡の電流は小さくなる（右）。アンテナの最低の電圧から Rₛ の上限 39.5 Ω が決まり、余裕を見て 22 Ω を選んだ。")


F["e09_monitor_v"] = _f09_monitor_v_fig()
