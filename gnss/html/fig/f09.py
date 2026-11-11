# -*- coding: utf-8 -*-
# 09 章 LNA とフィルタ の図。figures.py の部品をそのまま使う（exec で読み込まれる）。
# 数値は本文の検算（$SP/g09/check2.py）と同じ式で、この中で計算する。
import math as _f09_m

_F09_K = 1.380649e-23
_F09_T0 = 290.0
_F09_C = -128.5          # 受信電力 [dBm]（3 章の例）
_F09_TA = 100.0          # アンテナの雑音温度 [K]（3 章の例）
_F09_L1 = 1575.42


def _f09_u(d):
    return 10 ** (d / 10.0)


def _f09_db(x):
    return 10 * _f09_m.log10(x)


def _f09_cn0(tsys):
    return _F09_C - (_f09_db(_F09_K * tsys) + 30)


def _f09_f(v, d=1):
    """数の文字（負の符号は −）。"""
    return ("%.*f" % (d, v)).replace("-", "−")


# 例の段（4 章 1 節と同じ）: (名前, 利得 dB, 雑音指数 dB)
_F09_ST = [("LNA", 18.0, 1.0), ("フィルタ", -1.5, 1.5), ("チップの増幅 1", 20.0, 3.0), ("チップの増幅 2", 68.5, 3.0)]
# 5 節の例のアクティブアンテナの中の段（全体で 28 dB）
_F09_ACT = [("LNA", 18.0, 1.0), ("SAW", -1.5, 1.5), ("増幅", 11.5, 2.0)]


def _f09_chain(st, tant=_F09_TA):
    """各段の (名前, その段の Te, 前の利得の積, 寄与, 積み上げた Tsys, C/N0) を返す。"""
    g = 1.0; tot = 0.0; rows = []
    for n, G, NF in st:
        te = (_f09_u(NF) - 1) * _F09_T0
        ci = te / g; tot += ci
        tsys = tant + tot
        rows.append((n, te, g, ci, tsys, _f09_cn0(tsys)))
        g *= _f09_u(G)
    return rows


def _f09_last(st, tant=_F09_TA):
    return _f09_chain(st, tant)[-1][5]


# =====================================================================
# 1 節: 2 段の雑音の流れ（各点の雑音の密度と、入力に換算した積み上げ）
# =====================================================================
def _f09_stage(o, x, y, w, h, title, sub, c):
    o.append(RECT(x, y, w, h, 8, PAN, c, 1.4))
    o.append(T(x + w / 2, y + 20, title, "middle", 11.5, INK, True))
    o.append(TX(x + w / 2, y + 37, sub, "middle", 10, c))


def _f09_twostage_fig():
    o = []
    o.append(TX(14, 18, "2 段をつないだときの雑音の密度（k_B で割り、温度で書く）", "start", 11.5, INK, True))
    yc = 70
    o.append(T(14, yc + 4, "入力", "start", 10.5, TEA, True))
    o.append(ARR(44, yc, 138, yc, c=TEA, lw=1.6))
    _f09_stage(o, 140, yc - 24, 130, 48, "1 段目", "T_{e1} を足して G_1 倍", SIG)
    o.append(ARR(270, yc, 398, yc, c=TEA, lw=1.6))
    _f09_stage(o, 400, yc - 24, 130, 48, "2 段目", "T_{e2} を足して G_2 倍", SIG)
    o.append(ARR(530, yc, 636, yc, c=TEA, lw=1.6))
    o.append(T(640, yc + 4, "出力", "start", 10.5, TEA, True))
    # 各点の雑音の密度（÷ k_B）
    o.append(TX(92, yc - 10, "① T_{in}", "middle", 10.5, TEA, True, halo=True))
    o.append(TX(334, yc - 10, "② G_1(T_{in} + T_{e1})", "middle", 10.5, TEA, True, halo=True))
    o.append(T(583, yc - 10, "③", "middle", 10.5, TEA, True, halo=True))
    y3 = yc + 50
    o.append(TX(140, y3, "③ = G_2{G_1(T_{in} + T_{e1}) + T_{e2}} = G_{1}G_{2}(T_{in} + T_{e1} + T_{e2}/G_1)", "start", 10.5, TEA, True))
    # 入力に換算した積み上げ
    yb = y3 + 32
    o.append(TX(14, yb, "③ を全体の利得 G_{1}G_{2} で割って、1 段目の入力に換算すると", "start", 10.5, INK, True))
    x0, ybar, bh = 140, yb + 12, 28
    xx = x0
    for c, w, lab in [(TEA, 200, "T_{in}（入力）"), (SIG, 150, "T_{e1}（1 段目）"), (GLD, 70, "T_{e2}/G_1")]:
        o.append(RECT(xx, ybar, w, bh, 3, soft(c), c, 1.3))
        o.append(TX(xx + w / 2, ybar + 19, lab, "middle", 10.5, c, True, halo=True))
        xx += w
    o.append(TX(xx + 10, ybar + 19, "= T_{in} + T_e", "start", 10.5, INK, True))
    o.append(DIM(x0 + 200, ybar + bh + 10, xx, ybar + bh + 10, None, c=SIG))
    o.append(TX((x0 + 200 + xx) / 2, ybar + bh + 28, "T_e = T_{e1} + T_{e2}/G_1（2 段をまとめた雑音温度）", "middle", 10.5, SIG, True))
    return SVG(700, ybar + bh + 38, o,
               "2 段の増幅器をつないだときの雑音（雑音の密度をボルツマン定数で割り、温度で書いた。下の帯の長さは形を示すための例）。")


F["e09_twostage"] = _f09_twostage_fig()


# =====================================================================
# 1 節: 4 章 1 節の例の段ごとの計算（フリスの式の途中経過）・C/N0・Tsys の内訳
# =====================================================================
def _f09_kfmt(v):
    return ("%.2f K" % v) if v < 1 else ("%.1f K" % v)


def _f09_gfmt(g):
    if g < 10:
        return "%.0f" % g
    if g < 1000:
        return "%.1f" % g
    return "%.0f" % g


def _f09_cascade_fig():
    o = []
    rows = _f09_chain(_F09_ST)
    names = ["アンテナ", "LNA", "フィルタ", "増幅 1", "増幅 2"]
    cols = [TEA, SIG, GLD, ALI, PUR]
    x0, cw, bw = 126, 114, 100
    cx = [x0 + cw * (i + 0.5) for i in range(5)]
    o.append(T(14, 18, "(a) 段ごとの計算（雑音温度は、どれも 1 段目の入力に換算した値）", "start", 11.5, INK, True))
    yb = 28
    for i in range(5):
        o.append(RECT(cx[i] - bw / 2, yb, bw, 28, 7, soft(cols[i]), cols[i], 1.3))
        o.append(T(cx[i], yb + 18.5, names[i], "middle", 11, cols[i], True))
        if i:
            o.append(ARR(cx[i - 1] + bw / 2, yb + 14, cx[i] - bw / 2, yb + 14, c=MUT, lw=1.3, head=6))
    gains = ["—", "18 dB・1 dB", "−1.5 dB・1.5 dB", "20 dB・3 dB", "68.5 dB・3 dB"]
    tes = ["T_{ant} = 100 K"] + [_f09_kfmt(r[1]) for r in rows]
    gps = ["—"] + ["÷ %s（%s dB）" % (_f09_gfmt(r[2]), _f09_f(_f09_db(r[2]), 1 if abs(_f09_db(r[2]) - round(_f09_db(r[2]))) > 0.05 else 0)) for r in rows]
    cons = ["100 K"] + [_f09_kfmt(r[3]) for r in rows]
    tsy = ["100.0 K"] + ["%.1f K" % r[4] for r in rows]
    labs = ["利得・雑音指数", "その段の雑音温度", "÷ 前の段の利得の積", "= 入力に換算した寄与", "積み上げた T_{sys}"]
    data = [gains, tes, gps, cons, tsy]
    y0 = 78
    for k in range(5):
        y = y0 + 19 * k
        if k == 3:
            o.append(RECT(x0 - 2, y - 13, 5 * cw + 2, 18, 3, MSOFT, "none", 0))
        o.append(TX(14, y, labs[k], "start", 10, INK if k == 3 else MUT, k == 3))
        for i in range(5):
            o.append(TX(cx[i], y, data[k][i], "middle", 10, cols[i] if k == 3 else INK, k == 3))
        o.append(W(14, y + 6, 696, y + 6, c=GRD, lw=1))
    # (b) C/N0（列をそろえる）
    yb2 = y0 + 19 * 4 + 34
    o.append(TX(14, yb2, "(b) その段までの雑音で計算した C/N_0（受信電力 −128.5 dBm）", "start", 11.5, INK, True))
    q = Plot(x0, yb2 + 12, 5 * cw, 100, (-0.5, 4.5), (47.0, 50.5))
    o.append(q.axes(xl=None, yl="C/N_0 [dB-Hz]", xt=[], yt=[47, 48, 49, 50], yfmt=lambda v: "%d" % v))
    cn = [_f09_cn0(_F09_TA)] + [r[5] for r in rows]
    o.append(q.line([(i, v) for i, v in enumerate(cn)], c=SIG, lw=2.2))
    after = ["アンテナ", "LNA の後", "フィルタの後", "増幅 1 の後", "増幅 2 の後"]
    for i, v in enumerate(cn):
        o.append(D(q.X(i), q.Y(v), SIG, 4))
        o.append(T(q.X(i), q.Y(v) - 9, "%.1f" % v, "middle", 10, SIG, True, halo=True))
        o.append(T(q.X(i), q.y + q.h + 15, after[i], "middle", 9.5, MUT))
    o.append(T(q.X(1) + 12, q.Y(49.55), "LNA で %.1f dB 下がる" % (cn[0] - cn[1]), "start", 10, ALI, True, halo=True))
    o.append(T(q.X(2.5), q.Y(48.45), "後の 3 段では合わせて %.1f dB" % (cn[1] - cn[4]), "middle", 10, GRN, True, halo=True))
    # (c) Tsys の内訳
    yb3 = q.y + q.h + 46
    o.append(TX(14, yb3, "(c) システム雑音温度 T_{sys} = %.1f K の内訳" % rows[-1][4], "start", 11.5, INK, True))
    r = Plot(x0, yb3 + 12, 550, 26, (0, 200), (0, 1))
    o.append(r.axes(xt=[0, 50, 100, 150, 200], yt=[], grid=False, xfmt=lambda v: "%d K" % v))
    vals = [_F09_TA] + [rr[3] for rr in rows]
    acc = 0.0
    for i, v in enumerate(vals):
        o.append(RECT(r.X(acc), r.y, max(r.X(acc + v) - r.X(acc), 0.8), r.h, 2, soft(cols[i]), cols[i], 1.2))
        acc += v
    o.append(T(r.X(50), r.y + 17.5, "アンテナ 100 K", "middle", 10, TEA, True, halo=True))
    o.append(T(r.X(_F09_TA + rows[0][3] / 2), r.y + 17.5, "LNA %.1f K" % rows[0][3], "middle", 10, SIG, True, halo=True))
    rest = sum(rr[3] for rr in rows[1:])
    xm = r.X(_F09_TA + rows[0][3] + rest / 2)
    o.append(W(xm, r.y - 1, xm, yb3 + 4, c=MUT, lw=1))
    o.append(T(696, yb3, "後の 3 段は合わせて %.1f K" % rest, "end", 10, MUT, True))
    return SVG(700, r.y + r.h + 24, o,
               "4 章 1 節の例の段をフリスの式で計算した途中経過（アンテナの雑音温度 100 K。チップの中の増幅器の雑音指数は 3 dB と仮に置いた）。")


F["e09_cascade"] = _f09_cascade_fig()


# =====================================================================
# 2 節: LNA の利得と雑音指数を変えたときの全体の C/N0（(b) は後の段の寄与）
# =====================================================================
def _f09_lna_nfg_fig():
    o = []
    o.append(TX(14, 18, "(a) 全部の段の後の C/N_0", "start", 11.5, INK, True))
    p = Plot(64, 34, 372, 226, (0, 30), (43, 49))
    o.append(p.axes(xl="LNA の利得 [dB]", yl="C/N_0 [dB-Hz]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[43, 44, 45, 46, 47, 48, 49], yfmt=lambda v: "%d" % v))
    o.append(W(p.X(15), p.y, p.X(15), p.y + p.h, c=MUT, lw=1, dash="4 3"))
    o.append(T(p.X(15) + 4, p.y + p.h - 6, "15 dB", "start", 9.5, MUT, False, halo=True))
    curves = [(0.5, GRN), (1.0, SIG), (1.5, PUR), (2.0, GLD), (3.0, ALI)]
    v18 = {}
    for nf, c in curves:
        pts = [(i * 0.25, _f09_last([("LNA", i * 0.25, nf)] + _F09_ST[1:])) for i in range(121)]
        o.append(p.clip(pts, c=c, lw=2.6 if nf == 1.0 else 1.8))
        o.append(T(p.X(30) + 6, p.Y(pts[-1][1]) + 4, "NF %.1f dB" % nf, "start", 10, c, True))
        v18[nf] = _f09_last([("LNA", 18.0, nf)] + _F09_ST[1:])
    for nf, c in curves:
        o.append(D(p.X(18), p.Y(v18[nf]), c, 4))
        o.append(T(p.X(18) + 5, p.Y(v18[nf]) - 6, "%.1f" % v18[nf], "start", 9.5, c, True, halo=True))
    # NF 1 dB の線の上の代表の点
    for g, dx, dy, a in [(10, -6, 4, "end"), (15, -6, -4, "end"), (30, -4, -8, "end")]:
        v = _f09_last([("LNA", g, 1.0)] + _F09_ST[1:])
        o.append(D(p.X(g), p.Y(v), SIG, 3.6))
        o.append(T(p.X(g) + dx, p.Y(v) + dy, "%.1f" % v, a, 9.5, SIG, True, halo=True))
    # NF 1 dB → 2 dB の差
    xb = p.X(18) - 9
    o.append(DIM(xb, p.Y(v18[1.0]) + 3, xb, p.Y(v18[2.0]) - 3, None, c=INK))
    o.append(T(xb - 5, (p.Y(v18[1.0]) + p.Y(v18[2.0])) / 2 - 12, "%.1f dB" % (v18[1.0] - v18[2.0]), "end", 10, INK, True, halo=True))
    o.append(W(p.X(18), p.y, p.X(18), p.y + p.h, c=FNT, lw=1, dash="2 3"))
    o.append(T(p.X(18), p.y - 6, "例: 18 dB", "middle", 9.5, MUT))
    # (b) 後の段の寄与
    o.append(T(486, 18, "(b) 後の段の寄与（入力換算）", "start", 11.5, INK, True))
    q = Plot(556, 34, 132, 226, (0, 30), (0.3, 1000), ylog=True)
    o.append(q.axes(xl="LNA の利得 [dB]", yl="寄与 [K]", xt=[0, 10, 20, 30], yt=[1, 10, 100, 1000], yfmt=lambda v: "%g" % v))
    rest = sum(r[3] for r in _f09_chain([("LNA", 0.0, 1.0)] + _F09_ST[1:])[1:])   # 利得 0 dB のときの後の段の寄与
    o.append(q.line([(g, rest / _f09_u(g)) for g in (0, 30)], c=GLD, lw=2.2))
    o.append(W(q.x, q.Y(175.1), q.x + q.w, q.Y(175.1), c=SIG, lw=1.1, dash="4 3"))
    o.append(T(q.x + q.w, q.Y(175.1) - 5, "アンテナと LNA 175 K", "end", 9.5, SIG, True, halo=True))
    o.append(W(q.x, q.Y(17.51), q.x + q.w, q.Y(17.51), c=MUT, lw=1, dash="2 3"))
    o.append(T(q.x + 3, q.Y(17.51) + 13, "その 1 割", "start", 9.5, MUT, False, halo=True))
    for g, a, dx, dy in [(15, "start", 6, -4), (18, "start", 6, 12), (30, "end", -5, -6)]:
        v = rest / _f09_u(g)
        o.append(D(q.X(g), q.Y(v), GLD, 3.6))
        o.append(T(q.X(g) + dx, q.Y(v) + dy, _f09_kfmt(v), a, 9.5, GLD, True, halo=True))
    return SVG(700, 306, o, "LNA の利得と雑音指数（NF）を変えたときの C/N0 と、後の段の寄与（ほかの段は 1 節の例の値）。")


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
    o.append(T(p.X(pi) + 8, p.Y(po) + 30, "入力 P1dB = %s dBm" % _f09_f(pi, 0), "start", 10, ALI, False, halo=True))
    o.append(T(p.X(-36), p.Y(-6), "傾き 1（利得 18 dB）", "start", 10, MUT, False, halo=True))
    o.append(T(p.X(-6), p.Y(16.5), "利得が 1 dB 下がった線", "end", 9.5, MUT, False, halo=True))
    o.append(T(p.X(5), p.Y(4), "出力が頭打ち", "middle", 10, SIG, True, halo=True))
    o.append(T(p.X(8), p.Y(-16.5), "衛星の信号（−128.5 dBm）は、左端よりさらに 88.5 dB 左", "end", 9.5, SIG, False, halo=True))
    return SVG(700, 306, o, "増幅器の入力と出力の電力（例: 利得 18 dB、入力 P1dB −10 dBm の、滑らかに飽和するモデル）。")


F["e09_p1db"] = _f09_p1db_fig()


# =====================================================================
# 3 節: SAW フィルタの仕組み（左）と通過特性の形（右、例の値）
# =====================================================================
def _f09_saw_curve(f):
    """SAW フィルタの通過 [dB] の形の例（w09.js と同じ式）。"""
    return -1.5 - 45.0 * (1 - _f09_m.exp(-((f - _F09_L1) / 28.0) ** 4))


def _f09_comb(o, x, y, n, c):
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
    o.append(T(14, 18, "(a) 仕組み（上から見た図）", "start", 11.5, INK, True))
    o.append(RECT(20, 36, 300, 136, 6, PAN, LIN, 1.3))
    _f09_comb(o, 34, 62, 7, SIG)
    _f09_comb(o, 226, 62, 7, SIG)
    for k in range(4):
        xx = 130 + k * 22
        o.append(PATH("M %d 82 q 5 -8 10 0 q 5 8 10 0" % xx, c=GLD, lw=1.6))
    o.append(ARR(130, 104, 216, 104, c=GLD, lw=1.5))
    o.append(T(173, 120, "表面を伝わる音の波", "middle", 10, GLD, True, halo=True))
    o.append(T(80, 54, "入力の電極（電気 → 音）", "middle", 10, SIG, True, halo=True))
    o.append(T(266, 54, "出力の電極（音 → 電気）", "middle", 10, SIG, True, halo=True))
    o.append(DIM(40, 140, 64, 140, None, c=GLD))
    o.append(T(70, 144, "同じ向きの歯の間隔 = 音の波長", "start", 9.5, GLD, True, halo=True))
    o.append(T(170, 162, "この波長に合う周波数だけが強く伝わる", "middle", 9.5, MUT))
    o.append(T(170, 188, "圧電体の基板", "middle", 10, MUT))
    # (b) 通過特性
    o.append(T(356, 18, "(b) 通過特性の形（例の値）", "start", 11.5, INK, True))
    p = Plot(406, 36, 270, 140, (1475, 1675), (-55, 0))
    o.append(p.axes(xl="周波数 f [MHz]", yl="通過 [dB]", xt=[1475, 1525, 1575, 1625, 1675], yt=[-50, -40, -30, -20, -10, 0]))
    o.append(p.clip([(1475 + i, _f09_saw_curve(1475 + i)) for i in range(0, 201)], c=SIG, lw=2.2))
    o.append(W(p.X(_F09_L1), p.y, p.X(_F09_L1), p.y + p.h, c=GRN, lw=1, dash="4 3"))
    o.append(T(p.X(_F09_L1) - 4, p.Y(-20), "L1", "end", 10, GRN, True, halo=True))
    o.append(T(p.X(1606), p.Y(-6), "挿入損失 1.5 dB", "start", 9.5, SIG, False, halo=True))
    o.append(T(p.X(1478), p.Y(-34), "L1 から 100 MHz", "start", 9.5, SIG, False, halo=True))
    o.append(T(p.X(1478), p.Y(-34) + 13, "離れて %s dB" % _f09_f(_f09_saw_curve(_F09_L1 - 100)), "start", 9.5, SIG, False, halo=True))
    return SVG(700, 226, o, "SAW フィルタ（(b) は通過特性の形の例。挿入損失 1.5 dB、L1 から 100 MHz 離れた所で 45 dB 弱めるとした）。")


F["e09_saw"] = _f09_saw_fig()


# =====================================================================
# 3 節: フィルタの置き場所の 3 通りの比較（雑音温度の内訳・雑音指数・C/N0）
# =====================================================================
def _f09_filter_pos_fig():
    o = []
    A = [("LNA", 18, 1.0), ("SAW", -1.5, 1.5)] + _F09_ST[2:]
    B = [("SAW", -1.5, 1.5), ("LNA", 18, 1.0)] + _F09_ST[2:]
    Cc = [("広い", -0.5, 0.5), ("LNA", 18, 1.0), ("SAW", -1.5, 1.5)] + _F09_ST[2:]
    teA = _f09_chain(A)[-1][4] - _F09_TA
    teB = _f09_chain(B)[-1][4] - _F09_TA
    teC = _f09_chain(Cc)[-1][4] - _F09_TA
    after_saw = _f09_chain([("LNA", 18, 1.0)] + _F09_ST[2:])[-1][4] - _F09_TA   # (b) の SAW より後の段
    Ls, Lp = _f09_u(1.5), _f09_u(0.5)
    rA = _f09_chain(A)
    cnA, cnB, cnC = _f09_last(A), _f09_last(B), _f09_last(Cc)
    nfA, nfB, nfC = (_f09_db(1 + t / _F09_T0) for t in (teA, teB, teC))
    nfp = _f09_db(1 + after_saw / _F09_T0)
    cfgs = [
        ("(a) LNA の後", [("LNA", SIG), ("SAW", GLD), ("チップ", MUT)],
         "T_e = %.1f + %.1f + %.1f + %.2f = %.1f K（1 節）" % (rA[0][3], rA[1][3], rA[2][3], rA[3][3], teA),
         cnA, "NF %.2f dB" % nfA, None, SIG, ["弱められずに入る"], ALI),
        ("(b) LNA の前", [("SAW", GLD), ("LNA", SIG), ("チップ", MUT)],
         "T_e = %.1f K（SAW）+ %.2f × %.1f K（LNA から後）= %.1f K" % ((Ls - 1) * _F09_T0, Ls, after_saw, teB),
         cnB, "NF %.2f dB = 1.5 + %.2f" % (nfB, nfp), "(a) より %.1f dB 低い" % (cnA - cnB), ALI, ["SAW で", "30〜50 dB 弱まる"], GRN),
        ("(c) 前に広い", [("広い", TEA), ("LNA", SIG), ("SAW", GLD), ("チップ", MUT)],
         "T_e = %.1f K（広い）+ %.2f × %.1f K（(a) の段）= %.1f K" % ((Lp - 1) * _F09_T0, Lp, teA, teC),
         cnC, "NF %.2f dB" % nfC, "(a) より %.1f dB 低い" % (cnA - cnC), GLD, ["広いフィルタで", "遠い電波だけ弱まる"], GLD),
    ]
    o.append(TX(520, 18, "C/N_0・雑音指数", "middle", 10.5, INK, True))
    o.append(T(640, 18, "LNA に入る帯域外の電波", "middle", 10.5, INK, True))
    for k, (title, boxes, form, cn, nfs, diff, cc, note, nc) in enumerate(cfgs):
        y = 32 + k * 80
        if k:
            o.append(W(14, y - 8, 696, y - 8, c=GRD, lw=1))
        o.append(T(14, y + 22, title, "start", 10.5, INK, True))
        if k == 2:
            o.append(T(14, y + 36, "フィルタ", "start", 10.5, INK, True))
        x = 124
        o.append(CIRC(x, y + 18, 7, c=MUT, lw=1.3))
        o.append(T(x, y + 40, "アンテナ", "middle", 9.5, MUT))
        x += 9
        for nm, c in boxes:
            o.append(ARR(x, y + 18, x + 13, y + 18, c=MUT, lw=1.3, head=6))
            o.append(BOX(x + 13, y + 4, 52, 28, nm, None, c=c, sz=10))
            x += 65
        o.append(TX(124, y + 60, form, "start", 9.5, MUT))
        o.append(TX(520, y + 14, "%.1f dB-Hz" % cn, "middle", 11.5, cc, True))
        o.append(T(520, y + 30, nfs, "middle", 9.5, INK))
        if diff:
            o.append(T(520, y + 45, diff, "middle", 9.5, ALI if k == 1 else GLD, True))
        for j, s in enumerate(note):
            o.append(T(640, y + 20 + j * 14, s, "middle", 10, nc, True))
    o.append(T(14, 32 + 3 * 80 - 8 + 14, "広い: 帯域の広いフィルタ（挿入損失 0.5 dB、例の値）", "start", 9.5, TEA))
    return SVG(700, 32 + 3 * 80 + 14, o, "フィルタの置き場所の 3 通り（ほかの段の値は 1 節の例。アンテナの雑音温度 100 K）。")


F["e09_filter_pos"] = _f09_filter_pos_fig()


# =====================================================================
# 3 節: LNA の前の損失と C/N0 の減り（アンテナの雑音温度で違う）
# =====================================================================
def _f09_drop(Ld, tant=_F09_TA):
    return _f09_last(_F09_ST, tant) - _f09_last([("loss", -Ld, Ld)] + _F09_ST, tant)


def _f09_mismatch_fig():
    o = []
    p = Plot(90, 28, 440, 240, (0, 3), (0, 5))
    o.append(p.axes(xl="LNA の前の損失 [dB]", yl="C/N_0 の減り [dB]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[0, 1, 2, 3, 4, 5]))
    for tant, c, lab in [(290.0, GLD, "T_{ant} = 290 K"), (_F09_TA, SIG, "T_{ant} = 100 K（例）")]:
        pts = [(i * 0.05, _f09_drop(i * 0.05, tant)) for i in range(61)]
        o.append(p.clip(pts, c=c, lw=2.2))
        o.append(TX(p.X(3) + 6, p.Y(pts[-1][1]) + 4, lab, "start", 10, c, True))
    o.append(T(p.X(3) + 6, p.Y(3) + 18, "（減り = 損失の dB）", "start", 9.5, GLD, False))
    for Ld, c, txt in [(0.4576, ALI, "不整合損失 0.46 dB → %.1f dB"), (1.0, SIG, "1 dB → %.1f dB"), (1.5, SIG, "SAW を前に 1.5 dB → %.1f dB"),
                       (2.0, SIG, "2 dB → %.1f dB"), (3.0, SIG, "3 dB → %.1f dB")]:
        d = _f09_drop(Ld)
        o.append(D(p.X(Ld), p.Y(d), c, 4.2))
        if c == ALI:
            o.append(W(p.X(Ld), p.Y(d) - 5, p.X(0.3), p.Y(2.2) + 4, c=ALI, lw=1))
            o.append(T(p.X(0.05), p.Y(2.2), txt % d, "start", 10, c, True, halo=True))
        else:
            o.append(T(p.X(Ld) - 7, p.Y(d) - 7, txt % d, "end", 9.5, c, True, halo=True))
    return SVG(700, 306, o, "LNA の前の損失と C/N0 の減り（損失は 290 K で熱に変わるとした。後に 1 節の例の段が続く）。")


F["e09_mismatch"] = _f09_mismatch_fig()


# =====================================================================
# 4 節: IIP3（傾き 1 と傾き 3 の直線の交点）と P1dB（3 次の項までのモデル）
# =====================================================================
def _f09_iip3_fig():
    o = []
    G, ip = 18.0, 0.0
    p = Plot(90, 28, 470, 262, (-60, 10), (-140, 30))
    o.append(p.axes(xl="電波 1 つあたりの入力の電力 P_{in} [dBm]", yl="出力の電力 [dBm]", xt=[-60, -50, -40, -30, -20, -10, 0, 10], yt=[-140, -120, -100, -80, -60, -40, -20, 0, 20]))
    # 延ばした直線（破線）
    o.append(p.clip([(-60, -60 + G), (10, 10 + G)], c=SIG, lw=1.3, dash="5 4"))
    o.append(p.clip([(-60, -180 - 2 * ip + G), (10, 30 - 2 * ip + G)], c=ALI, lw=1.3, dash="5 4"))
    # 実際の出力（3 次の項まで）: 電波 1 つのときの元の周波数の出力は (1 − P/P_IIP3) 倍の振幅
    fund = []
    for i in range(0, 217):
        pin = -60 + i * 0.25
        fac = 1 - 10 ** ((pin - ip) / 10)
        fund.append((pin, pin + G + 20 * _f09_m.log10(fac)))
    o.append(p.clip(fund, c=SIG, lw=2.4))
    o.append(p.clip([(-60 + i * 0.5, 3 * (-60 + i * 0.5) - 2 * ip + G) for i in range(0, 91)], c=ALI, lw=2.4))
    # 交点
    o.append(D(p.X(ip), p.Y(ip + G), INK, 4.5))
    o.append(T(p.X(ip) + 8, p.Y(ip + G) - 8, "交点: IIP3 = 0 dBm", "start", 10, INK, True, halo=True))
    o.append(W(p.X(ip), p.Y(ip + G), p.X(ip), p.y + p.h, c=MUT, lw=1, dash="3 3"))
    # P1dB
    pd = 10 * _f09_m.log10(1 - 10 ** (-1 / 20.0)) + ip
    yd = pd + G - 1
    o.append(D(p.X(pd), p.Y(yd), GRN, 4.2))
    o.append(W(p.X(pd), p.Y(yd), p.X(pd), p.y + p.h, c=GRN, lw=1, dash="3 3"))
    o.append(T(p.X(pd) - 8, p.Y(yd) - 24, "P1dB = %s dBm" % _f09_f(pd), "end", 10, GRN, True, halo=True))
    o.append(T(p.X(pd) - 8, p.Y(yd) - 10, "（IIP3 より %.1f dB 小さい）" % (ip - pd), "end", 9.5, GRN, False, halo=True))
    # 入力 −40 dBm の例
    xa = -40
    o.append(DIM(p.X(xa), p.Y(xa + G) + 4, p.X(xa), p.Y(3 * xa + G) - 4, None, c=GLD))
    o.append(T(p.X(xa) + 6, p.Y(xa + G - 40), "80 dB の差", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(xa) + 6, p.Y(xa + G) + 14, "%s dBm" % _f09_f(xa + G, 0), "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(xa) + 6, p.Y(3 * xa + G) + 16, "%s dBm（入力換算 %s dBm）" % (_f09_f(3 * xa + G, 0), _f09_f(3 * xa, 0)), "start", 9.5, ALI, True, halo=True))
    # 傾き 3: 入力 10 dB で 30 dB
    x1, x2 = -30, -20
    o.append(W(p.X(x1), p.Y(3 * x1 + G), p.X(x2), p.Y(3 * x1 + G), p.X(x2), p.Y(3 * x2 + G), c=ALI, lw=1.1))
    o.append(T((p.X(x1) + p.X(x2)) / 2, p.Y(3 * x1 + G) + 13, "10 dB", "middle", 9.5, ALI, False, halo=True))
    o.append(T(p.X(x2) + 5, p.Y(3 * x1 + G + 15) + 4, "30 dB", "start", 9.5, ALI, False, halo=True))
    o.append(T(p.X(-58), p.Y(-14), "元の周波数（傾き 1）", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(-34), p.Y(-128), "3 次の相互変調の積（傾き 3）", "start", 10, ALI, True, halo=True))
    o.append(LEGL(90, 336, [(MUT, None, "実際の出力（3 次の項までの式）"), (MUT, "5 4", "延ばした直線")], 9.5, 22))
    return SVG(700, 346, o, "IIP3 の求め方（例: 利得 18 dB、IIP3 0 dBm の、3 次の項までの式 y = a₁x + a₃x³ で描いた）。")


F["e09_iip3"] = _f09_iip3_fig()


# =====================================================================
# 4 節: 2 つの強い電波と、3 次の相互変調の積（周波数と電力。例の値）
# =====================================================================
def _f09_imd_spec_fig():
    o = []
    f1, f2, pin, ip = 1712.71, 1850.00, -40.0, 0.0
    im = 3 * pin - 2 * ip
    p = Plot(80, 30, 600, 210, (1450, 2050), (-160, -20))
    o.append(p.axes(xl="周波数 f [MHz]", yl="LNA の入力に換算した電力 [dBm]", xt=[1500, 1600, 1700, 1800, 1900, 2000], yt=[-160, -140, -120, -100, -80, -60, -40, -20]))
    # SAW が通す範囲（3 節の例の形で、通過の減りが 3 dB 以内）と L1 の帯域
    o.append(RECT(p.X(_F09_L1 - 14.4), p.y, p.X(_F09_L1 + 14.4) - p.X(_F09_L1 - 14.4), p.h, 0, soft(GLD), "none", 0, op=0.7))
    o.append(RECT(p.X(_F09_L1 - 1.023), p.y, max(p.X(_F09_L1 + 1.023) - p.X(_F09_L1 - 1.023), 2.5), p.h, 0, soft(GRN), GRN, 0.8))
    o.append(T(p.X(_F09_L1), p.y - 6, "L1", "middle", 10, GRN, True))
    o.append(T(p.X(_F09_L1) + 18, p.y + 13, "SAW が通す範囲", "start", 9.5, GLD, True, halo=True))
    # 衛星の信号
    o.append(W(p.x, p.Y(_F09_C), p.x + p.w, p.Y(_F09_C), c=SIG, lw=1, dash="4 3"))
    o.append(T(p.x + 4, p.Y(_F09_C) + 13, "衛星の信号 −128.5 dBm", "start", 9.5, SIG, False, halo=True))
    # 2 つの強い電波
    for f, lab in [(f1, "f_1"), (f2, "f_2")]:
        o.append(W(p.X(f), p.Y(-160), p.X(f), p.Y(pin), c=ALI, lw=2.6))
        o.append(TX(p.X(f), p.Y(pin) - 8, lab + "（−40 dBm）", "middle", 10, ALI, True, halo=True))
    # 3 次の相互変調の積
    for f, lab, c in [(2 * f1 - f2, "2f_1 − f_2", ALI), (2 * f2 - f1, "2f_2 − f_1", GLD)]:
        o.append(W(p.X(f), p.Y(-160), p.X(f), p.Y(im), c=c, lw=2.2))
        o.append(D(p.X(f), p.Y(im), c, 3.4))
        o.append(TX(p.X(f) + 6, p.Y(im) - 6, lab + "（%d dBm）" % im, "start" if f < 1800 else "end", 10, c, True, halo=True))
    # 間隔
    ya = p.Y(-75)
    for a, b in [(2 * f1 - f2, f1), (f1, f2)]:
        o.append(DARR(p.X(a), ya, p.X(b), ya, c=MUT, lw=1.1))
        o.append(T((p.X(a) + p.X(b)) / 2, ya - 6, "%.2f MHz" % (b - a), "middle", 9.5, MUT, False, halo=True))
    # 周波数の計算
    y0 = p.y + p.h + 50
    lines = [
        ("2f_1 − f_2 = 2 × %.2f − %.2f = %.2f MHz → L1 に落ちる" % (f1, f2, 2 * f1 - f2), ALI, True),
        ("2f_2 − f_1 = 2 × %.2f − %.2f = %.2f MHz → L1 から %.2f MHz" % (f2, f1, 2 * f2 - f1, 2 * f2 - f1 - _F09_L1), GLD, True),
        ("f_1、f_2 は L1 から %.2f MHz と %.2f MHz（SAW で弱められる）" % (f1 - _F09_L1, f2 - _F09_L1), INK, False),
        ("2 次の積 f_2 − f_1 = %.2f MHz、f_1 + f_2 = %.2f MHz（図の外。L1 から遠い）" % (f2 - f1, f1 + f2), MUT, False),
    ]
    for k, (s, c, b) in enumerate(lines):
        o.append(TX(80, y0 + k * 16, s, "start", 10, c, b))
    return SVG(700, y0 + 3 * 16 + 12, o, "2 つの強い電波と 3 次の相互変調の積（周波数と電力は例の値。LNA の IIP3 は 0 dBm）。")


F["e09_imd_spec"] = _f09_imd_spec_fig()


# =====================================================================
# 5 節: アクティブアンテナの構成（断面）と受信機までのつながり
# =====================================================================
def _f09_active_fig():
    o = []
    o.append(T(14, 18, "(a) パッシブアンテナ", "start", 11.5, INK, True))
    y = 34
    o.append(RECT(20, y + 10, 70, 8, 2, soft(GLD), GLD, 1.2))
    o.append(RECT(14, y + 18, 82, 5, 1, soft(MUT), MUT, 1.0))
    o.append(T(55, y + 4, "パッチ", "middle", 9.5, GLD, True))
    o.append(W(96, y + 20, 300, y + 20, c=TEA, lw=3))
    o.append(TX(198, y + 12, "ケーブル（損失 L_c）", "middle", 10, TEA, True, halo=True))
    o.append(BOX(300, y + 2, 110, 36, "受信機", None, c=SIG, sz=10.5))
    o.append(T(355, y + 52, "LNA は受信機の中", "middle", 9.5, MUT))
    o.append(T(440, y + 18, "ケーブルの損失が LNA の前", "start", 10, ALI, True))
    o.append(T(440, y + 32, "→ 雑音指数にそのまま足される", "start", 10, ALI, False))
    o.append(T(14, 108, "(b) アクティブアンテナ", "start", 11.5, INK, True))
    y = 134
    o.append(RECT(14, y - 14, 150, 96, 10, "none", MUT, 1.2, dash="5 4"))
    o.append(T(89, y + 96, "1 つの覆いの中", "middle", 9.5, MUT))
    o.append(RECT(30, y + 6, 70, 8, 2, soft(GLD), GLD, 1.2))
    o.append(RECT(24, y + 14, 82, 5, 1, soft(MUT), MUT, 1.0))
    o.append(T(65, y + 2, "パッチ", "middle", 9.5, GLD, True))
    o.append(BOX(24, y + 26, 40, 24, "LNA", None, c=SIG, sz=9.5))
    o.append(BOX(68, y + 26, 40, 24, "SAW", None, c=GLD, sz=9.5))
    o.append(BOX(112, y + 26, 44, 24, "増幅", None, c=SIG, sz=9.5))
    o.append(T(89, y + 66, "18 − 1.5 + 11.5 = 28 dB", "middle", 9.5, SIG, True))
    o.append(W(156, y + 38, 300, y + 38, c=TEA, lw=3))
    o.append(TX(228, y + 30, "ケーブル（損失 L_c）", "middle", 10, TEA, True, halo=True))
    o.append(T(230, y + 56, "直流も同じ芯線で送る", "middle", 9.5, PUR, True, halo=True))
    o.append(BOX(300, y + 20, 110, 36, "受信機", None, c=SIG, sz=10.5))
    o.append(T(440, y + 32, "ケーブルの損失は増幅の後", "start", 10, GRN, True))
    o.append(T(440, y + 46, "→ 631 倍（28 dB）で割られて効く", "start", 10, GRN, False))
    return SVG(700, 244, o, "パッシブアンテナとアクティブアンテナ（構成と利得は例）。")


F["e09_active"] = _f09_active_fig()


# =====================================================================
# 5 節: ケーブルの長さと C/N0（パッシブとアクティブ）
# =====================================================================
def _f09_cable_cn(m, active):
    Lc = 0.5 * m
    if active:
        return _f09_last(_F09_ACT + [("cable", -Lc, Lc)] + _F09_ST[2:])
    return _f09_last([("cable", -Lc, Lc)] + _F09_ST)


def _f09_cable_fig():
    o = []
    p = Plot(90, 28, 470, 240, (0, 30), (28, 50))
    o.append(p.axes(xl="ケーブルの長さ [m]", yl="C/N_0 [dB-Hz]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[30, 35, 40, 45, 50], yfmt=lambda v: "%d" % v))
    pp = [(i * 0.5, _f09_cable_cn(i * 0.5, False)) for i in range(61)]
    pa = [(i * 0.5, _f09_cable_cn(i * 0.5, True)) for i in range(61)]
    o.append(p.clip(pa, c=GRN, lw=2.4))
    o.append(p.clip(pp, c=ALI, lw=2.4))
    base = _f09_cable_cn(0, False)      # ケーブルが無いとき（パッシブ = 1 節の例）
    base_a = _f09_cable_cn(0, True)     # ケーブルが無いとき（アクティブ）
    dfmt = lambda d: ("−%.2f" % d) if d < 0.095 else ("−%.1f" % d)
    # 右端（30 m）は線の名前と一緒に書く
    for v, b, c, nm in [(pa[-1][1], base_a, GRN, "アクティブ"), (pp[-1][1], base, ALI, "パッシブ")]:
        o.append(D(p.X(30), p.Y(v), c, 4))
        o.append(T(p.X(30) + 7, p.Y(v) - 2, nm, "start", 10, c, True))
        o.append(T(p.X(30) + 7, p.Y(v) + 12, "30 m: %.1f（%s）" % (v, dfmt(b - v)), "start", 9.5, c, True))
    for m in (3, 10):
        v = _f09_cable_cn(m, False)
        o.append(D(p.X(m), p.Y(v), ALI, 4))
        o.append(T(p.X(m) + 7, p.Y(v) - 6, "%d m: %.1f（%s）" % (m, v, dfmt(base - v)), "start", 9.5, ALI, True, halo=True))
    v = _f09_cable_cn(3, True)
    o.append(D(p.X(3), p.Y(v), GRN, 4))
    o.append(T(p.X(3) + 6, p.Y(v) - 8, "3 m: %.1f（%s）" % (v, dfmt(base_a - v)), "start", 9.5, GRN, True, halo=True))
    Lc = _f09_u(1.5)
    te = (Lc - 1) * _F09_T0
    o.append(T(p.X(0.6), p.Y(33.4), "3 m（1.5 dB）のケーブルの雑音温度 %.1f K は、" % te, "start", 9.5, INK))
    o.append(T(p.X(0.6), p.Y(33.4) + 15, "パッシブ: そのまま足される（LNA の前）", "start", 9.5, ALI))
    o.append(T(p.X(0.6), p.Y(33.4) + 30, "アクティブ: ÷ 631 で %.2f K" % (te / _f09_u(28.0)), "start", 9.5, GRN))
    return SVG(700, 306, o, "ケーブルの長さと C/N0（ケーブルの損失 0.5 dB/m、アクティブアンテナの利得 28 dB。どちらも例の値。かっこの中はケーブルが無いときからの減り [dB]）。")


F["e09_cable"] = _f09_cable_fig()


# =====================================================================
# 5 節: バイアス T（受信機の側とアンテナの側）と、部品のインピーダンス
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
    yc = 116
    # 中央の同軸
    o.append(RECT(250, yc - 9, 200, 18, 9, soft(TEA), TEA, 1.3))
    o.append(W(250, yc, 450, yc, c=INK, lw=1.4))
    o.append(T(350, yc + 30, "同軸ケーブル（芯線に RF と直流が重なる）", "middle", 10, TEA, True))
    # 受信機の側（左）
    o.append(T(120, 18, "受信機の側", "middle", 11.5, INK, True))
    o.append(W(250, yc, 196, yc, c=INK, lw=1.4))
    _f09_cap_h(o, 190, yc)
    o.append(W(184, yc, 60, yc, c=INK, lw=1.4))
    o.append(BOX(14, yc - 18, 46, 36, "受信", None, c=SIG, sz=10))
    o.append(T(190, yc + 28, "コンデンサ 33 pF", "middle", 9.5, SIG, True, halo=True))
    o.append(D(220, yc, INK, 3))
    o.append(W(220, yc, 220, 94, c=INK, lw=1.4))
    _f09_ind(o, 220, 54, 94)
    o.append(W(220, 54, 220, 44, c=INK, lw=1.4))
    o.append(T(232, 78, "コイル 100 nH", "start", 9.5, PUR, True, halo=True))
    o.append(BOX(170, 20, 100, 24, "電源 3.3 V", None, c=PUR, sz=10))
    # アンテナの側（右）
    o.append(T(580, 18, "アンテナの側", "middle", 11.5, INK, True))
    o.append(W(450, yc, 504, yc, c=INK, lw=1.4))
    _f09_cap_h(o, 510, yc)
    o.append(W(516, yc, 560, yc, c=INK, lw=1.4))
    o.append(BOX(560, yc - 18, 60, 36, "LNA", "出力", c=SIG, sz=10))
    o.append(T(510, yc + 28, "コンデンサ 33 pF", "middle", 9.5, SIG, True, halo=True))
    o.append(D(480, yc, INK, 3))
    o.append(W(480, yc, 480, 94, c=INK, lw=1.4))
    _f09_ind(o, 480, 54, 94)
    o.append(W(480, 54, 480, 44, c=INK, lw=1.4))
    o.append(W(480, 44, 590, 44, 590, yc - 18, c=PUR, lw=1.4))
    o.append(T(536, 38, "LNA の電源", "middle", 9.5, PUR, True, halo=True))
    o.append(T(470, 78, "コイル 100 nH", "end", 9.5, PUR, True, halo=True))
    # 流れ
    o.append(ARR(290, 164, 410, 164, c=PUR, lw=1.6))
    o.append(T(420, 168, "直流: 受信機 → アンテナ（コイルを通る）", "start", 10, PUR, True))
    o.append(ARR(410, 184, 290, 184, c=SIG, lw=1.6))
    o.append(T(280, 188, "RF: アンテナ → 受信機（コンデンサを通る）", "end", 10, SIG, True))
    # 部品のインピーダンス
    yt = 222
    o.append(W(14, yt - 18, 686, yt - 18, c=LIN, lw=0.8))
    o.append(T(14, yt, "部品のインピーダンス（値は例）", "start", 11.5, INK, True))
    hx = [(170, "直流（0 Hz）"), (290, "L1（1575.42 MHz）"), (400, "50 Ω の線と比べると")]
    for x, s in hx:
        o.append(T(x, yt + 22, s, "middle" if x < 400 else "start", 10, MUT, True))
    f = _F09_L1 * 1e6
    rows = [("コイル 100 nH", "0 Ω", 2 * _f09_m.pi * f * 100e-9, PUR, "%.0f 倍。RF はほとんど流れ込まない"),
            ("コイル 47 nH", "0 Ω", 2 * _f09_m.pi * f * 47e-9, PUR, "%.0f 倍"),
            ("コンデンサ 33 pF", "∞", 1 / (2 * _f09_m.pi * f * 33e-12), SIG, "1/%.0f。RF はほとんどそのまま通る"),
            ("コンデンサ 100 pF", "∞", 1 / (2 * _f09_m.pi * f * 100e-12), SIG, "1/%.0f")]
    for k, (nm, dc, z, c, cm) in enumerate(rows):
        y = yt + 42 + k * 18
        o.append(T(24, y, nm, "start", 10, c, True))
        o.append(T(170, y, dc, "middle", 10, INK))
        o.append(T(290, y, ("%.0f Ω" % z) if z >= 10 else ("%.1f Ω" % z), "middle", 10, c, True))
        ratio = z / 50.0 if z > 50 else 50.0 / z
        o.append(T(400, y, cm % ratio, "start", 10, INK))
        o.append(W(14, y + 6, 686, y + 6, c=GRD, lw=1))
    return SVG(700, yt + 42 + 3 * 18 + 14, o, "バイアス T（部品の値は例。インピーダンスは寄生の成分を除いた理想の部品で計算した）。")


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
    o.append(BOX(380, y - 18, 110, 36, "バイアス T のコイル", None, c=PUR, sz=10))
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
    return SVG(700, 270, o, "アンテナの監視の回路（例。しきい値の電圧は Rₛ = 22 Ω で、電流 50 mA と 3 mA にあたる値）。")


F["e09_monitor"] = _f09_monitor_fig()


# =====================================================================
# 6 節: 電流と判定の範囲、R_s の選び方
# =====================================================================
def _f09_monitor_v_fig():
    o = []
    Vs, Rs, Rc, Ia, Vmin = 3.3, 22.0, 0.5, 0.015, 2.7
    ish = Vs / (Rs + Rc)
    o.append(TX(14, 18, "(a) 給電の電流と判定（R_s = 22 Ω、しきい値は例）", "start", 11.5, INK, True))
    p = Plot(70, 60, 600, 32, (0, 160), (0, 1))
    o.append(p.axes(xl="給電の電流 I [mA]", yl=None, xt=[0, 20, 40, 60, 80, 100, 120, 140, 160], yt=[], grid=False))
    o.append(RECT(p.X(0), p.y, p.X(3) - p.X(0), p.h, 0, soft(GLD), GLD, 1))
    o.append(RECT(p.X(3), p.y, p.X(50) - p.X(3), p.h, 0, soft(GRN), GRN, 1))
    o.append(RECT(p.X(50), p.y, p.X(160) - p.X(50), p.h, 0, soft(ALI), ALI, 1))
    # しきい値
    o.append(W(p.X(3), p.y, p.X(3), p.y - 14, c=GLD, lw=1))
    o.append(TX(p.X(3) - 3, p.y - 18, "開放のしきい値 3 mA（V_{Rs} 66 mV）", "start", 9.5, GLD, True))
    o.append(W(p.X(50), p.y, p.X(50), p.y - 14, c=ALI, lw=1))
    o.append(TX(p.X(50) - 3, p.y - 18, "短絡のしきい値 50 mA（V_{Rs} 1.1 V）", "start", 9.5, ALI, True))
    # 3 つの状態
    o.append(D(p.X(15), p.y + p.h / 2, GRN, 4.5))
    o.append(TX(p.X(15) + 8, p.y + p.h / 2 + 4, "正常 15 mA（V_{Rs} = %.2f V）" % (Ia * Rs), "start", 9.5, GRN, True, halo=True))
    o.append(D(p.X(ish * 1000), p.y + p.h / 2, ALI, 4.5))
    o.append(TX(p.X(ish * 1000) - 8, p.y + p.h / 2 + 4, "短絡 %.0f mA（V_{Rs} = %.2f V）" % (ish * 1000, ish * Rs), "end", 9.5, ALI, True, halo=True))
    o.append(TX(14, p.y + p.h + 50, "開放（アンテナが外れた）: 電流 ≈ 0 mA、V_{Rs} ≈ 0 V（左端の金の範囲）", "start", 9.5, GLD))
    # (b) R_s とアンテナの電圧・短絡の電流
    yb = 178
    o.append(TX(14, yb, "(b) R_s の選び方（3.3 V、15 mA、ケーブル 0.5 Ω、最低 2.7 V。例の値）", "start", 11.5, INK, True))
    q = Plot(70, yb + 16, 260, 150, (0, 60), (2.2, 3.4))
    o.append(q.axes(xl="R_s [Ω]", yl="アンテナの電圧 [V]", xt=[0, 20, 40, 60], yt=[2.2, 2.6, 3.0, 3.4], yfmt=lambda v: "%.1f" % v))
    o.append(q.clip([(r, Vs - Ia * (r + Rc)) for r in range(0, 61)], c=SIG, lw=2.2))
    o.append(W(q.x, q.Y(Vmin), q.x + q.w, q.Y(Vmin), c=ALI, lw=1, dash="4 3"))
    o.append(T(q.x + q.w - 4, q.Y(Vmin) + 14, "最低 2.7 V", "end", 9.5, ALI, False, halo=True))
    rmax = (Vs - Vmin) / Ia - Rc
    o.append(W(q.X(rmax), q.y, q.X(rmax), q.y + q.h, c=MUT, lw=1, dash="3 3"))
    o.append(T(q.X(rmax) + 4, q.y + 12, "上限 %.1f Ω" % rmax, "start", 9.5, MUT, False, halo=True))
    va = Vs - Ia * (Rs + Rc)
    o.append(D(q.X(Rs), q.Y(va), GRN, 4.5))
    o.append(T(q.X(Rs) + 6, q.Y(va) - 8, "22 Ω: %.2f V（余裕 %.2f V）" % (va, va - Vmin), "start", 9.5, GRN, True, halo=True))
    r = Plot(430, yb + 16, 240, 150, (0, 60), (0, 400))
    o.append(r.axes(xl="R_s [Ω]", yl="短絡の電流 [mA]", xt=[0, 20, 40, 60], yt=[0, 100, 200, 300, 400]))
    o.append(r.clip([(x, Vs * 1000 / (x + Rc)) for x in [0.5 + i * 0.5 for i in range(0, 120)]], c=ALI, lw=2.2))
    o.append(D(r.X(Rs), r.Y(ish * 1000), GRN, 4.5))
    o.append(T(r.X(Rs) + 6, r.Y(ish * 1000) - 8, "22 Ω: %.0f mA" % (ish * 1000), "start", 9.5, GRN, True, halo=True))
    return SVG(700, 388, o, "給電の電流と判定、Rₛ の選び方（例の値）。")


F["e09_monitor_v"] = _f09_monitor_v_fig()
