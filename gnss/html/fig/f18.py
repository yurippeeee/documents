# -*- coding: utf-8 -*-
# 18 章 多周波と PPP の図
import numpy as _f18_np
from scipy.stats import norm as _f18_norm

# =====================================================================
# 例の値（本文・デモと同じ）
# =====================================================================
_F18_C = 299792458.0
_F18_D2R = math.pi / 180
_F18_F1, _F18_F2, _F18_F5 = 1575.42e6, 1227.60e6, 1176.45e6      # L1・L2・L5 [Hz]
_F18_F6, _F18_F7 = 1278.75e6, 1207.14e6                            # L6（E6）・E5b（B2b）
_F18_TOK = GNSS_TOKYO
_F18_B7 = [1.5, 3.5, 0.4, 1.0, 0.5]       # 7 章 6 節の予算（衛星の時計と軌道・電離層・対流圏・マルチパス・受信機の雑音）
_F18_SB = [0.5, 0.7, 0.4, 1.0, 0.5]       # 16 章 6 節の SBAS（代表値・例の値）
_F18_SRC = [("衛星の時計と軌道", PUR), ("電離層", GLD), ("対流圏", GRN), ("マルチパス", ALI), ("受信機の雑音", TEA)]
_F18_SX = math.hypot(1.0, 0.5)            # 1 つの周波数のマルチパスと雑音の和の標準偏差 1.118 m（7 章の予算）
_F18_SPH = 0.007                          # 1 つの周波数の搬送波位相のマルチパスと雑音（例の値）[m]
_F18_TEC = 25.0                           # 7 章 2 節の昼の例 [TECU]


def _f18_m(v, d=1):
    """負の数の − を全角の負号にした数。"""
    s = ("%%.%df" % d) % v
    if s.lstrip("-").strip("0.") == "":
        s = s.lstrip("-")
    return s.replace("-", "−")


def _f18_k(fa, fb):
    """電離層フリー結合の雑音の倍率 √(f₁⁴ + f₂⁴)/(f₁² − f₂²)。"""
    return math.sqrt(fa ** 4 + fb ** 4) / (fa ** 2 - fb ** 2)


def _f18_coef(fa, fb):
    """電離層フリー結合の 2 つの係数 f₁²/(f₁² − f₂²)、f₂²/(f₁² − f₂²)。"""
    d = fa ** 2 - fb ** 2
    return fa ** 2 / d, fb ** 2 / d


def _f18_iono(tec, f):
    """電離層遅延 40.3 TEC / f² [m]（TEC は TECU）。"""
    return 40.3 * tec * 1e16 / f ** 2


def _f18_uere(v):
    return math.sqrt(sum(x * x for x in v))


def _f18_Q(x):
    return float(_f18_norm.sf(x))


# =====================================================================
# 1 節: 2 つの周波数の遅れと、電離層フリー結合
# =====================================================================
def _f18_two_fig():
    o = []
    # (a) 周波数と遅れ
    o.append(T(14, 18, "(a) 電離層遅延と周波数（天頂、TEC 25 TECU）", "start", 11.5, INK, True))
    p = Plot(64, 34, 262, 196, (1150, 1620), (-9, 9))
    o.append(p.axes(xl="周波数 f [MHz]", yl="遅れ [m]", xt=[1200, 1300, 1400, 1500, 1600], yt=[-8, -4, 0, 4, 8],
                    yfmt=lambda v: _f18_m(v, 0)))
    o.append(W(p.X(1150), p.Y(0), p.X(1620), p.Y(0), c=MUT, lw=1.1))
    fs = _f18_np.linspace(1150, 1620, 120)
    o.append(p.line([(f, _f18_iono(_F18_TEC, f * 1e6)) for f in fs], c=GLD, lw=2.2))
    o.append(p.line([(f, -_f18_iono(_F18_TEC, f * 1e6)) for f in fs], c=GLD, lw=2.0, dash="6 4"))
    for nm, f, dx, dy, a in (("L5", _F18_F5, 4, -9, "start"), ("L2", _F18_F2, 6, 15, "start"), ("L1", _F18_F1, 0, -9, "middle")):
        v = _f18_iono(_F18_TEC, f)
        o.append(D(p.X(f / 1e6), p.Y(v), GLD, 3.8))
        o.append(D(p.X(f / 1e6), p.Y(-v), GLD, 3.2))
        o.append(T(p.X(f / 1e6) + dx, p.Y(v) + dy, "%s %s m" % (nm, _f18_m(v, 2)), a, 10, INK, True, halo=True))
    o.append(T(p.X(1330), p.Y(2.3), "擬似距離: 遅れる（+）", "start", 10, GLD, True, halo=True))
    o.append(T(p.X(1330), p.Y(-2.3) + 8, "搬送波位相: 進む（−）", "start", 10, GLD, True, halo=True))
    o.append(T(p.X(1610), p.Y(-7.6), "どちらも 1/f² に比例", "end", 9.5, MUT, halo=True))
    # (b) 1 つの衛星の 2 つの擬似距離と、係数を掛けた和
    x0 = 366
    o.append(T(x0, 18, "(b) 1 つの衛星の擬似距離（L1/L2、(a) の電離層）", "start", 11.5, INK, True))
    I1 = _f18_iono(_F18_TEC, _F18_F1)
    I2 = _f18_iono(_F18_TEC, _F18_F2)
    a1, a2 = _f18_coef(_F18_F1, _F18_F2)
    kk = _f18_k(_F18_F1, _F18_F2)
    sc = 15.0                                   # 1 m の長さ [px]
    xd = x0 + 44                                # 共通の項の箱の左端
    dw = 50                                     # 共通の項（縮めて描く）の幅
    xa = xd + dw                                # 電離層の項の始まり
    xn = 642                                    # マルチパスと雑音の ±1σ の列の中心
    sn = 9.0                                    # その列の 1 m の長さ [px]
    o.append(T(xn, 40, "雑音 ±1σ", "middle", 9.5, TEA, True))

    def row(y, lab, iono, sig, c_lab=INK):
        r = [TX(x0 + 36, y + 13, lab, "end", 11, c_lab, True)]
        r.append(RECT(xd, y, dw, 18, 2, soft(SIG), SIG, 1.1))
        r.append(W(xd + dw / 2 + 4, y - 2, xd + dw / 2 + 10, y + 20, c=SCR, lw=4))
        r.append(W(xd + dw / 2 + 4, y - 2, xd + dw / 2 + 10, y + 20, c=SIG, lw=1.0))
        r.append(T(xd + 13, y + 13, "D", "middle", 10.5, SIG, True))
        if iono > 0:
            r.append(RECT(xa, y, iono * sc, 18, 2, soft(GLD), GLD, 1.1))
            r.append(T(xa + iono * sc / 2, y + 13, _f18_m(iono, 2) + " m", "middle", 10, GLD, True))
        r.append(W(xn - sig * sn, y + 9, xn + sig * sn, y + 9, c=TEA, lw=2.0))
        r.append(W(xn - sig * sn, y + 4, xn - sig * sn, y + 14, c=TEA, lw=2.0))
        r.append(W(xn + sig * sn, y + 4, xn + sig * sn, y + 14, c=TEA, lw=2.0))
        r.append(T(xn, y + 30, "±%s m" % _f18_m(sig, 2), "middle", 9.5, TEA, True))
        return "".join(r)
    o.append(row(50, "ρ_{1,i}", I1, _F18_SX))
    o.append(row(92, "ρ_{2,i}", I2, _F18_SX))
    o.append(TX(xd, 136, "D = r_i + b + δr_i^s + T_i（共通。約 2 万 km を縮めて描いた）", "start", 9.5, SIG))
    # 係数を掛ける
    yb = 152
    o.append(T(x0 + 36, yb + 12, "× %.3f" % a1, "end", 10.5, INK, True))
    o.append(RECT(xa, yb, I1 * a1 * sc, 14, 2, soft(GLD), GLD, 1.0))
    o.append(T(xa + I1 * a1 * sc + 5, yb + 11, "+%s m" % _f18_m(I1 * a1, 2), "start", 9.5, GLD, True))
    o.append(T(x0 + 36, yb + 32, "× (−%.3f)" % a2, "end", 10.5, INK, True))
    o.append(RECT(xa, yb + 20, I2 * a2 * sc, 14, 2, "none", GLD, 1.0, dash="3 2"))
    o.append(T(xa + I2 * a2 * sc + 5, yb + 31, "−%s m" % _f18_m(I2 * a2, 2), "start", 9.5, GLD, True))
    o.append(W(x0, yb + 44, 694, yb + 44, c=LIN, lw=1))
    o.append(row(yb + 54, "ρ_{IF,i}", 0.0, kk * _F18_SX, c_lab=GRN))
    o.append(T(xa + 4, yb + 67, "電離層 %.2f − %.2f = 0" % (I1 * a1, I2 * a2), "start", 10, GRN, True))
    o.append(T(xd, yb + 98, "係数の和 %.3f − %.3f = 1 なので、D はそのまま残る" % (a1, a2), "start", 9.5, INK))
    return SVG(700, 272, o, "2 つの周波数の電離層遅延と、電離層フリー結合（電離層は 7 章 2 節の例。マルチパスと雑音は 7 章の予算の値）。")


F["e18_two"] = _f18_two_fig()


def _f18_noisefac():
    """10 万組の乱数で確かめた倍率（L1/L2・L1/L5）。本文の値と同じ。"""
    big = _f18_np.random.default_rng(18).standard_normal((2, 100000))
    out = []
    for f2 in (_F18_F2, _F18_F5):
        a1, a2 = _f18_coef(_F18_F1, f2)
        out.append(float(_f18_np.std(a1 * big[0] - a2 * big[1])))
    return out


_F18_NFAC = _f18_noisefac()


def _f18_noise_fig():
    o = []
    rng = _f18_np.random.default_rng(1818)
    n = 100000
    x1 = rng.standard_normal(n) * _F18_SX
    x2 = rng.standard_normal(n) * _F18_SX
    a1, a2 = _f18_coef(_F18_F1, _F18_F2)
    I1 = _f18_iono(_F18_TEC, _F18_F1)
    I2 = _f18_iono(_F18_TEC, _F18_F2)
    xif = a1 * (I1 + x1) - a2 * (I2 + x2)
    o.append(T(14, 18, "(a) D を引いた残り（L1/L2。点は 300 回分）", "start", 11.5, INK, True))
    p = Plot(92, 32, 300, 150, (-12, 16), (0, 3))
    o.append(p.axes(xl="値 [m]", yl=None, xt=[-12, -8, -4, 0, 4, 8, 12, 16], yt=[], xfmt=lambda v: _f18_m(v, 0)))
    jit = _f18_np.random.default_rng(3).uniform(-0.28, 0.28, (3, 300))
    rows = [("ρ_1 − D", I1 + x1, GLD), ("ρ_2 − D", I2 + x2, GLD), ("ρ_IF − D", xif, GRN)]
    for k, (lab, vals, c) in enumerate(rows):
        yc = 2.5 - k
        o.append(TX(p.x - 8, p.Y(yc) + 4, lab, "end", 10.5, INK, True))
        for v, j in zip(vals[:300], jit[k]):
            if p.xr[0] < v < p.xr[1]:
                o.append(D(p.X(v), p.Y(yc + j), c, 1.3))
        m, sd = float(_f18_np.mean(vals)), float(_f18_np.std(vals))
        o.append(W(p.X(m), p.Y(yc) - 13, p.X(m), p.Y(yc) + 13, c=INK, lw=2))
        o.append(T(p.X(min(m + sd, 14)) + 4, p.Y(yc) - 12, "平均 %s・σ %s m" % (_f18_m(m, 2), _f18_m(sd, 2)), "start", 9.5, INK, True, halo=True))
    o.append(T(p.x, p.y + p.h + 44, "10 万回の σ の比: L1/L2 %.3f（式 %.3f）・L1/L5 %.3f（式 %.3f）" % (
        _F18_NFAC[0], _f18_k(_F18_F1, _F18_F2), _F18_NFAC[1], _f18_k(_F18_F1, _F18_F5)), "start", 9.5, MUT))
    # (b) 2 つ目の周波数と倍率
    o.append(TX(430, 18, "(b) 雑音の倍率と 2 つ目の周波数（f_1 = L1）", "start", 11.5, INK, True))
    q = Plot(478, 32, 206, 150, (1150, 1310), (2.0, 4.0))
    o.append(q.axes(xl="f_2 [MHz]", yl="倍率", xt=[1150, 1200, 1250, 1300], yt=[2.0, 2.5, 3.0, 3.5, 4.0], yfmt=lambda v: "%.1f" % v))
    fs = _f18_np.linspace(1150, 1310, 100)
    o.append(q.line([(f, _f18_k(_F18_F1, f * 1e6)) for f in fs], c=TEA, lw=2.2))
    for nm, f, dx, dy, a in (("L5・E5a・B2a", _F18_F5, 6, 14, "start"), ("E5b・B2b", _F18_F7, 6, 13, "start"),
                             ("L2", _F18_F2, -6, -8, "end"), ("L6・E6", _F18_F6, -6, -8, "end")):
        v = _f18_k(_F18_F1, f)
        o.append(D(q.X(f / 1e6), q.Y(v), TEA, 3.8))
        o.append(T(q.X(f / 1e6) + dx, q.Y(v) + dy, "%s %.2f" % (nm, v), a, 9.5, INK, True, halo=True))
    o.append(T(q.x + q.w, q.y + q.h + 44, "L1 から遠いほど倍率が小さい", "end", 9.5, MUT))
    return SVG(700, 240, o, "電離層フリー結合で雑音とマルチパスが増える様子（1 つの周波数で σ 1.12 m、2 つの周波数で独立な正規分布の乱数）。")


F["e18_noise"] = _f18_noise_fig()


# =====================================================================
# 1 節: 誤差の予算（16 章 6 節と同じ形）
# =====================================================================
# 16 章 3 節の DGNSS のモデル（例の値。f16.py と同じ計算）
def _f18_res(sig, d, D_, tau, Tc):
    x = (d / D_) ** 2 + (tau / Tc) ** 2
    return sig * math.sqrt(2 * (1 - math.exp(-x)))


def _f18_dgnss(d, tau):
    s = math.sqrt((1.0 * d / 20200.0) ** 2 + _f18_res(1.5, 0, 1, tau, 7200.0) ** 2)
    return [s, _f18_res(3.5, d, 1000.0, tau, 1800.0), _f18_res(0.4, d, 100.0, tau, 3600.0), 1.0, 0.5, 0.3, 0.3]


def _f18_cases():
    """[(名前, 源ごとの 1σ（7 つ: 衛星・電離層・対流圏・移動局の M・ε・基準局の M・ε）)]"""
    k2, k5 = _f18_k(_F18_F1, _F18_F2), _f18_k(_F18_F1, _F18_F5)
    return [("単独 L1（7 章 6 節）", _F18_B7 + [0, 0]), ("SBAS（16 章）", _F18_SB + [0, 0]), ("DGNSS 10 km（16 章）", _f18_dgnss(10, 5)),
            ("2 周波 L1/L2", [1.5, 0.0, 0.4, k2 * 1.0, k2 * 0.5, 0, 0]), ("2 周波 L1/L5", [1.5, 0.0, 0.4, k5 * 1.0, k5 * 0.5, 0, 0])]


def _f18_budget_fig():
    o = []
    cs = _f18_cases()
    cols = [PUR, GLD, GRN, ALI, TEA, ALI, TEA]
    o.append(T(14, 18, "(a) 源ごとの分散の積み上げ [m²]", "start", 11.5, INK, True))
    pa = Plot(150, 30, 200, 5 * 30, (0, 18), (0, 1))
    o.append(pa.axes(xl=None, yl=None, xt=[0, 5, 10, 15], yt=[]))
    for k, (nm, v) in enumerate(cs):
        yy = pa.y + 6 + k * 30
        o.append(T(pa.x - 8, yy + 13, nm, "end", 10, INK, True))
        tot = sum(x * x for x in v)
        xa = pa.X(0)
        for j, x in enumerate(v):
            if x <= 0:
                continue
            wa = pa.X(x * x) - pa.X(0)
            o.append(RECT(xa, yy, max(wa, 0.4), 18, 0, soft(cols[j]), cols[j], 1, "3 2" if j >= 5 else None))
            xa += wa
        o.append(T(xa + 5, yy + 13, "UERE %.2f m" % math.sqrt(tot), "start", 9.5, INK, True, halo=True))
    yl = pa.y + pa.h + 26
    o.append(LEGEND(14, yl, [(PUR, "衛星の時計と軌道"), (GLD, "電離層"), (GRN, "対流圏"), (ALI, "マルチパス"), (TEA, "受信機の雑音")], 10))
    o.append(T(14, yl + 18, "2 周波は電離層を 0、マルチパスと雑音を 2.98 倍（L1/L2）・2.59 倍（L1/L5）とした。DGNSS の破線は基準局の分", "start", 9.5, MUT))
    # (b) UERE と電離層の誤差
    o.append(T(430, 18, "(b) UERE と、電離層の誤差の大きさ", "start", 11.5, INK, True))
    q = Plot(472, 30, 214, 150, (0, 8), (0, 9))
    o.append(q.axes(xl="電離層の誤差 σ_I [m]", yl="UERE [m]", xt=[0, 2, 4, 6, 8], yt=[0, 3, 6, 9]))
    rest = _F18_B7[0] ** 2 + _F18_B7[2] ** 2
    xs = _f18_np.linspace(0, 8, 81)
    o.append(q.line([(s, math.sqrt(rest + s * s + _F18_SX ** 2)) for s in xs], c=ALI, lw=2.2))
    for f2, dash in ((_F18_F2, None), (_F18_F5, "6 4")):
        kk = _f18_k(_F18_F1, f2)
        u = math.sqrt(rest + (kk * _F18_SX) ** 2)
        o.append(q.line([(0, u), (8, u)], c=GRN, lw=2.2, dash=dash))
        sI = math.sqrt(kk * kk - 1) * _F18_SX
        o.append(D(q.X(sI), q.Y(u), INK, 3.6))
    u2 = math.sqrt(rest + (_f18_k(_F18_F1, _F18_F2) * _F18_SX) ** 2)
    u5 = math.sqrt(rest + (_f18_k(_F18_F1, _F18_F5) * _F18_SX) ** 2)
    s2 = math.sqrt(_f18_k(_F18_F1, _F18_F2) ** 2 - 1) * _F18_SX
    s5 = math.sqrt(_f18_k(_F18_F1, _F18_F5) ** 2 - 1) * _F18_SX
    o.append(T(q.X(8) - 2, q.Y(u2) - 6, "L1/L2 %.2f m" % u2, "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(8) - 2, q.Y(u5) + 14, "L1/L5 %.2f m" % u5, "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(6.2), q.Y(7.6), "L1 だけ", "end", 9.5, ALI, True, halo=True))
    o.append(W(q.X(3.5), q.y, q.X(3.5), q.y + q.h, c=GLD, lw=1.3, dash="3 3"))
    o.append(T(q.X(3.5) + 3, q.y + 11, "7 章 3.5 m", "start", 9, GLD, True, halo=True))
    o.append(T(q.X(0.2), q.Y(1.2), "境目 %.2f m・%.2f m（黒の点）" % (s5, s2), "start", 9.5, INK, True, halo=True))
    return SVG(700, yl + 30, o, "単独・SBAS・DGNSS（16 章の例の値）と 2 周波の電離層フリー結合の誤差の予算（7 章 6 節の予算から計算）。")


F["e18_budget"] = _f18_budget_fig()


# =====================================================================
# 2 節: 多周波の受信機が受ける周波数と、L5 の特徴
# =====================================================================
def _f18_rx_fig():
    o = []
    o.append(T(14, 18, "(a) 各衛星系の周波数と、受信機の種類ごとに受ける帯域（代表的な例）", "start", 11.5, INK, True))
    xl0, xr0, kx = 172.0, 539.5, 2.75

    def X(f):
        return xl0 + (f - 1160) * kx if f < 1400 else xr0 + (f - 1555) * kx
    ytop, ybot = 32, 300
    # 帯域の地（航空の無線航法の帯域・レーダーなどと分け合う帯域）
    for a, b in ((1164, 1215), (1559, 1610)):
        o.append(RECT(X(a), ytop + 16, X(b) - X(a), 128, 0, soft(GRN), "none", 0))
    o.append(RECT(X(1215), ytop + 16, X(1290) - X(1215), 128, 0, MSOFT, "none", 0))
    o.append(T((X(1164) + X(1215)) / 2, ytop + 10, "航空の無線航法の帯域", "middle", 9.5, GRN, True))
    o.append(T((X(1215) + X(1290)) / 2, ytop + 10, "レーダーなどと分け合う", "middle", 9.5, MUT, True))
    o.append(T((X(1559) + X(1610)) / 2, ytop + 10, "航空の無線航法の帯域", "middle", 9.5, GRN, True))
    # 周波数の軸（途中を省いた）
    ya = ytop + 150
    o.append(W(X(1160), ya, X(1290), ya, c=MUT, lw=1.2))
    o.append(W(X(1555), ya, X(1610), ya, c=MUT, lw=1.2))
    o.append(W(X(1290) + 4, ya - 5, X(1290) + 10, ya + 5, c=MUT, lw=1.2))
    o.append(W(X(1555) - 10, ya - 5, X(1555) - 4, ya + 5, c=MUT, lw=1.2))
    for f in (1175, 1200, 1225, 1250, 1275, 1575, 1600):
        o.append(W(X(f), ya, X(f), ya + 4, c=MUT, lw=1))
        o.append(T(X(f), ya + 15, str(f), "middle", 9, MUT))
    o.append(T(X(1610), ya + 30, "周波数 [MHz]", "end", 9.5, MUT))
    sysrows = [("GPS", SIG, [("L5", 1176.45), ("L2", 1227.60), ("L1", 1575.42)]),
               ("Galileo", GRN, [("E5a", 1176.45), ("E5b", 1207.14), ("E6", 1278.75), ("E1", 1575.42)]),
               ("BeiDou", GLD, [("B2a", 1176.45), ("B2b", 1207.14), ("B1I", 1561.098), ("B1C", 1575.42)]),
               ("GLONASS", PUR, [("G2", (1242.94, 1248.63)), ("G1", (1598.06, 1605.38))]),
               ("みちびき", TEA, [("L5", 1176.45), ("L2", 1227.60), ("L6", 1278.75), ("L1", 1575.42)])]
    for k, (nm, c, sigs) in enumerate(sysrows):
        y = ytop + 34 + k * 23
        o.append(T(xl0 - 10, y + 4, nm, "end", 10.5, c, True))
        for lab, f in sigs:
            if isinstance(f, tuple):
                o.append(RECT(X(f[0]), y - 6, X(f[1]) - X(f[0]), 12, 2, soft(c), c, 1.2))
                if f[1] > 1590:
                    o.append(T(X(f[0]) - 4, y + 4, lab, "end", 9, c, True, halo=True))
                else:
                    o.append(T(X(f[1]) + 4, y + 4, lab, "start", 9, c, True, halo=True))
            else:
                o.append(RECT(X(f) - 2.5, y - 7, 5, 14, 1, c, c, 1))
                o.append(T(X(f) + 6, y + 4, lab, "start", 9, c, True, halo=True))
    # 受信機の種類
    bands = {"L1": (1559, 1606), "L5": (1164, 1189), "L2": (1215, 1240), "L6": (1260, 1300)}
    kinds = [("L1 だけ（多くのモジュール）", ["L1"], SIG), ("L1/L5 の 2 周波（増えている）", ["L1", "L5"], GRN),
             ("L1/L2/L5（測量用）", ["L1", "L2", "L5"], GLD), ("L6 も（CLAS・MADOCA）", ["L1", "L2", "L5", "L6"], PUR)]
    for k, (nm, bs, c) in enumerate(kinds):
        y = ya + 40 + k * 20
        o.append(T(xl0 - 10, y + 4, nm, "end", 10, INK, True))
        for b in bs:
            a_, z_ = bands[b]
            if z_ < 1400:
                z_ = min(z_, 1290)
            o.append(RECT(X(a_), y - 6, X(z_) - X(a_), 12, 3, soft(c), c, 1.2))
    yb = ya + 40 + 4 * 20 + 18
    # (b) L1 C/A と L5
    o.append(T(14, yb, "(b) L1 C/A と L5 の信号（GPS。規格の値）", "start", 11.5, INK, True))
    p = Plot(150, yb + 14, 160, 60, (-160, -153), (0, 2))
    o.append(p.axes(xl="受信電力の最小値 [dBW]", yl=None, xt=[-160, -158, -156, -154], yt=[], xfmt=lambda v: _f18_m(v, 0)))
    for k, (nm, v, c, sub) in enumerate((("L1 C/A", -158.5, SIG, "−158.5"), ("L5", -154.9, GRN, "−154.9（2 つの成分の和）"))):
        y = p.Y(1.5 - k) - 9
        o.append(T(p.x - 8, y + 13, nm, "end", 10.5, c, True))
        o.append(RECT(p.X(-160), y, p.X(v) - p.X(-160), 18, 2, soft(c), c, 1.1))
        o.append(T(p.X(v) + 5, y + 13, sub, "start", 9.5, c, True, halo=True))
    q = Plot(470, yb + 14, 210, 60, (-330, 330), (0, 1.1))
    o.append(q.axes(xl="符号のずれ [m]", yl=None, xt=[-300, -150, 0, 150, 300], yt=[], xfmt=lambda v: _f18_m(v, 0)))
    o.append(q.line([(-293.1, 0), (0, 1), (293.1, 0)], c=SIG, lw=2))
    o.append(q.line([(-29.3, 0), (0, 1), (29.3, 0)], c=GRN, lw=2.2))
    o.append(T(q.X(-150), q.Y(0.62), "L1 C/A ±293 m", "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(36), q.Y(0.85), "L5 ±29.3 m", "start", 9.5, GRN, True, halo=True))
    o.append(T(q.x - 6, q.y + 8, "相関の山", "end", 9.5, MUT, True))
    return SVG(700, yb + 112, o, "受信機の種類と受ける帯域、L1 C/A と L5 の受信電力の最小値と相関の山の幅（IS-GPS-200・IS-GPS-705 の値。L5 は衛星の世代で違う）。")


F["e18_rx"] = _f18_rx_fig()


# =====================================================================
# 2 節: ワイドレーン — 長い波長で整数を決める
# =====================================================================
_F18_LWL = _F18_C / (_F18_F1 - _F18_F2)       # 0.8619 m
_F18_LWL5 = _F18_C / (_F18_F1 - _F18_F5)      # 0.7514 m
_F18_WSIG = 0.15                              # 実数の解の誤差の例 [m]


def _f18_wl_fig():
    o = []
    o.append(T(14, 18, "(a) 波長（同じ縮尺）", "start", 11.5, INK, True))
    lams = [("L1", _F18_C / _F18_F1, SIG), ("L2", _F18_C / _F18_F2, SIG), ("L5", _F18_C / _F18_F5, SIG),
            ("ワイドレーン L1/L5", _F18_LWL5, GRN), ("ワイドレーン L1/L2", _F18_LWL, GRN)]
    sc = 3.6
    for k, (nm, lv, c) in enumerate(lams):
        y = 30 + k * 18
        o.append(T(176, y + 11, nm, "end", 10, c, True))
        o.append(RECT(184, y, lv * 100 * sc, 13, 2, soft(c), c, 1.1))
        o.append(T(184 + lv * 100 * sc + 6, y + 11, "%.1f cm" % (lv * 100), "start", 10, c, True))
    # (b) 格子と実数の解の散らばり
    yb = 136
    o.append(T(14, yb, "(b) 同じ散らばり（σ 15 cm）を、波長の格子で丸める", "start", 11.5, INK, True))
    rng = _f18_np.random.default_rng(1802)
    pts = rng.standard_normal((400, 2)) * _F18_WSIG
    big = _f18_np.random.default_rng(1803).standard_normal((100000, 2)) * _F18_WSIG
    lim = 0.48
    for j, (nm, lv) in enumerate((("L1（19.0 cm）", _F18_C / _F18_F1), ("ワイドレーン L1/L2（86.2 cm）", _F18_LWL))):
        x0 = 30 + j * 196
        p = Plot(x0, yb + 26, 168, 168, (-lim, lim), (-lim, lim))
        o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 1))
        kmax = int(lim / lv) + 1
        for kk in range(-kmax - 1, kmax + 2):
            b = (kk + 0.5) * lv
            if -lim < b < lim:
                o.append(W(p.X(b), p.y, p.X(b), p.y + p.h, c=GRD, lw=1.2))
                o.append(W(p.x, p.Y(b), p.x + p.w, p.Y(b), c=GRD, lw=1.2))
        for ia in range(-kmax, kmax + 1):
            for ib in range(-kmax, kmax + 1):
                if abs(ia * lv) < lim and abs(ib * lv) < lim:
                    o.append(CIRC(p.X(ia * lv), p.Y(ib * lv), 3.2, c=MUT, lw=1.0, fill=SCR))
        for a_, b_ in pts:
            good = abs(a_) < lv / 2 and abs(b_) < lv / 2
            if abs(a_) < lim and abs(b_) < lim:
                o.append(D(p.X(a_), p.Y(b_), GRN if good else ALI, 1.5))
        okf = float(_f18_np.mean(_f18_np.all(_f18_np.abs(big) < lv / 2, axis=1)))
        o.append(W(p.X(0) - 6, p.Y(0), p.X(0) + 6, p.Y(0), c=INK, lw=2)); o.append(W(p.X(0), p.Y(0) - 6, p.X(0), p.Y(0) + 6, c=INK, lw=2))
        pf = (1 - 2 * _f18_Q(lv / (2 * _F18_WSIG))) ** 2
        o.append(T(p.x + p.w / 2, p.y - 6, nm, "middle", 10, INK, True))
        o.append(T(p.x + p.w / 2, p.y + p.h + 16, "正しい整数 %.1f %%（式 %.1f %%）" % (100 * okf, 100 * pf), "middle", 9.5, GRN if pf > 0.9 else ALI, True))
    o.append(T(30, yb + 236, "点: 2 つの整数値バイアスの実数の解の誤差 400 回（割合は 10 万回で数えた）。緑は正しい整数（十字）に丸まった", "start", 9.5, MUT))
    # (c) 正しく丸まる確率と σ
    o.append(T(436, 18 + 118, "(c) 1 つの整数が正しく丸まる確率", "start", 11.5, INK, True))
    q = Plot(478, yb + 26, 200, 168, (0, 40), (0, 100))
    o.append(q.axes(xl="実数の解の誤差 σ [cm]", yl="確率 [%]", xt=[0, 10, 20, 30, 40], yt=[0, 25, 50, 75, 100]))
    ss = _f18_np.linspace(0.5, 40, 120)
    for nm, lv, c, dash in (("L1", _F18_C / _F18_F1, SIG, None), ("L5", _F18_C / _F18_F5, SIG, "5 3"),
                            ("WL L1/L5", _F18_LWL5, GRN, "5 3"), ("WL L1/L2", _F18_LWL, GRN, None)):
        o.append(q.line([(s_, 100 * (1 - 2 * _f18_Q(lv * 100 / (2 * s_)))) for s_ in ss], c=c, lw=2.0, dash=dash))
    o.append(W(q.X(15), q.y, q.X(15), q.y + q.h, c=MUT, lw=1, dash="3 3"))
    o.append(T(q.X(15) + 3, q.y + q.h - 6, "15 cm", "start", 9, MUT, halo=True))
    o.append(T(q.X(38), q.Y(92), "ワイドレーン", "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(38), q.Y(30), "L1・L5", "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(15) + 3, q.Y(1 - 2 * _f18_Q(_F18_C / _F18_F1 * 100 / 30)) * 0 + q.Y(47) + 4, "47 %", "start", 9, SIG, True, halo=True))
    return SVG(700, yb + 250, o, "ワイドレーンの波長と、整数値バイアスを丸めて正しい整数になる割合（実数の解の誤差は 2 つの向きに独立な正規分布とした）。")


F["e18_wl"] = _f18_wl_fig()


# =====================================================================
# 2 節: サイクルスリップを 2 周波で見つける
# =====================================================================
def _f18_slip_fig():
    o = []
    sat = [s for s in gnss_const() if s["nm"] == "G2"][0]
    ts = _f18_np.arange(0, 601, 1.0)
    rr = _f18_np.array([elaz(*_F18_TOK, sat_ecef(sat, t))[2] for t in ts])
    l1, l2 = _F18_C / _F18_F1, _F18_C / _F18_F2
    rng = _f18_np.random.default_rng(1806)
    n1 = rng.standard_normal(len(ts)) * _F18_SPH
    n2 = rng.standard_normal(len(ts)) * _F18_SPH
    tslip = 360
    step1 = _f18_np.where(ts >= tslip, 1.0, 0.0)
    # (a) L1 の位相の変化
    o.append(T(14, 18, "(a) L1 の位相の変化（G2、10 分）", "start", 11.5, INK, True))
    p = Plot(70, 32, 230, 150, (0, 10), (-320, 20))
    o.append(p.axes(xl="時間 [分]", yl="Φ_1 の変化 [km]", xt=[0, 2, 4, 6, 8, 10], yt=[-300, -200, -100, 0], yfmt=lambda v: _f18_m(v, 0)))
    ph1 = (rr - rr[0] + l1 * step1 + n1) / 1000.0
    o.append(p.line([(t / 60, v) for t, v in zip(ts[::5], ph1[::5])], c=SIG, lw=2))
    o.append(W(p.X(6), p.y, p.X(6), p.y + p.h, c=ALI, lw=1, dash="3 3"))
    o.append(TX(p.X(6) + 4, p.Y(-30), "6 分で N_1 が 1 跳んだ", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(6) + 4, p.Y(-60), "（19 cm。見えない）", "start", 9.5, ALI, halo=True))
    o.append(T(p.X(0.3), p.Y(-280), "1 秒に約 %d m 変わる" % round(abs(rr[-1] - rr[0]) / 600), "start", 9.5, SIG, True, halo=True))
    # (b) 幾何によらない結合
    o.append(TX(350, 18, "(b) 幾何によらない結合 Φ_1 − Φ_2 の変化", "start", 11.5, INK, True))
    q = Plot(400, 32, 280, 150, (0, 10), (-6, 36))
    o.append(q.axes(xl="時間 [分]", yl="変化 [cm]", xt=[0, 2, 4, 6, 8, 10], yt=[0, 10, 20, 30], yfmt=lambda v: _f18_m(v, 0)))
    g = (_F18_F1 / _F18_F2) ** 2 - 1
    dI1 = _f18_iono(0.1, _F18_F1) * ts / 60.0           # TEC が 1 分に 0.1 TECU 増える（例の値）
    base = g * dI1 + n1 - n2
    gf_a = base + l1 * step1
    gf_b = base + (9 * l1 - 7 * l2) * step1
    o.append(q.clip([(t / 60, 100 * v) for t, v in zip(ts[::2], gf_b[::2])], c=MUT, lw=1.3))
    o.append(q.clip([(t / 60, 100 * v) for t, v in zip(ts[::2], gf_a[::2])], c=ALI, lw=1.6))
    o.append(W(q.X(6), q.y, q.X(6), q.y + q.h, c=ALI, lw=1, dash="3 3"))
    o.append(TX(q.X(6) - 4, q.Y(28), "N_1 が 1 跳んだ: +%.1f cm" % (100 * l1), "end", 9.5, ALI, True, halo=True))
    o.append(TX(q.X(9.9), q.Y(-3.5), "N_1 が 9、N_2 が 7 跳んだ: +%.1f cm" % (100 * (9 * l1 - 7 * l2)), "end", 9.5, MUT, True, halo=True))
    o.append(T(q.X(0.2), q.Y(16), "電離層の変化（1 分に 0.1 TECU）", "start", 9.5, GLD, halo=True))
    o.append(q.line([(t / 60, 100 * g * v) for t, v in zip(ts[::30], dI1[::30])], c=GLD, lw=1.2, dash="4 3"))
    return SVG(700, 236, o, "1 つの周波数の位相と、幾何によらない結合に現れるサイクルスリップ（位相の雑音は 1 つの周波数で 7 mm、電離層の変化は例の値）。")


F["e18_slip"] = _f18_slip_fig()


# =====================================================================
# 3 節: 精密暦の種類（書いた時点の IGS の公表による代表値）
# =====================================================================
_F18_EPH = [("航法メッセージ（2 章 5 節）", "実時間", 100.0, 5.0, ALI),
            ("超速報（予測の部分）", "実時間（前もって）", 5.0, 3.0, GLD),
            ("実時間の補正（流し続ける）", "実時間", 5.0, 0.3, PUR),
            ("超速報（観測の部分）", "3〜9 時間後", 3.0, 0.15, SIG),
            ("速報", "17〜41 時間後", 2.5, 0.075, SIG),
            ("最終", "12〜18 日後", 2.5, 0.075, GRN)]


def _f18_eph_fig():
    o = []
    o.append(T(14, 18, "精密暦の種類と、使えるまでの時間・軌道と時計の誤差", "start", 11.5, INK, True))
    lx = math.log10
    pa = Plot(330, 46, 160, 6 * 28, (1, 200), (0, 1), xlog=True)
    pb = Plot(522, 46, 160, 6 * 28, (1, 200), (0, 1), xlog=True)
    o.append(T(250, 40, "使えるまで", "middle", 10, MUT, True))
    o.append(T(pa.x + pa.w / 2, 40, "軌道の誤差 [cm]", "middle", 10, MUT, True))
    o.append(T(pb.x + pb.w / 2, 40, "時計の誤差（距離） [cm]", "middle", 10, MUT, True))
    for p in (pa, pb):
        o.append(p.axes(xl=None, yl=None, xt=[1, 10, 100], yt=[], xfmt=lambda v: "%g" % v))
    for k, (nm, when, orb, clk_ns, c) in enumerate(_F18_EPH):
        yy = pa.y + 5 + k * 28
        o.append(T(196, yy + 13, nm, "end", 10, INK, True))
        cw, _ = CHIP(206, yy + 13, when, c=c, sz=9.5)
        o.append(cw)
        for p, v in ((pa, orb), (pb, clk_ns * 1e-9 * _F18_C * 100)):
            o.append(RECT(p.X(1), yy + 3, p.X(v) - p.X(1), 15, 2, soft(c), c, 1.1))
            lab = ("%d" % round(v)) if v >= 10 else ("%.1f" % v)
            if p is pb:
                lab += "（%s ns）" % ("%g" % clk_ns)
            if v > 30:
                o.append(T(p.X(v) - 4, yy + 15, lab, "end", 9, c, True, halo=True))
            else:
                o.append(T(p.X(v) + 4, yy + 15, lab, "start", 9, c, True, halo=True))
    o.append(T(14, pa.y + pa.h + 34, "時計は、ずれ [ns] に光の速さを掛けて距離に直した（1 ns が 30 cm）。値は IGS の公表による代表値（書いた時点）", "start", 9.5, MUT))
    return SVG(700, pa.y + pa.h + 46, o, "精密暦の種類と、使えるようになるまでの時間・軌道と時計の誤差（GPS。航法メッセージは 7 章 1 節の値）。")


F["e18_eph"] = _f18_eph_fig()


# =====================================================================
# 3 節: PPP の誤差の扱い（消す・直す・推定する）
# =====================================================================
def _f18_src_fig():
    o = []
    o.append(T(14, 18, "PPP の誤差の源ごとの扱い（大きさは 1 つの衛星の擬似距離・位相に入る分の代表値）", "start", 11.5, INK, True))
    p = Plot(214, 44, 260, 9 * 26, (0.001, 10), (0, 1), xlog=True)
    o.append(p.axes(xl="大きさ [m]（対数）", yl=None, xt=[0.001, 0.01, 0.1, 1, 10], yt=[], xfmt=lambda v: {0.001: "1 mm", 0.01: "1 cm", 0.1: "10 cm", 1: "1 m", 10: "10 m"}[v]))
    tags = {"補正": ("補正の情報（精密暦）で消す", PUR), "2周波": ("2 周波の結合で消す", SIG), "モデル": ("モデルで直す", GRN),
            "推定": ("推定する", GLD), "残る": ("残る（重みで扱う）", TEA)}
    rows = [("衛星の軌道と時計", 1.5, 0.03, "補正", "1.5 m → 3 cm"),
            ("電離層", 3.5, 0.01, "2周波", "3.5 m → cm 以下"),
            ("対流圏の乾燥の部分", 2.3, 0.01, "モデル", "天頂 2.3 m → cm 以下"),
            ("対流圏の湿潤の部分", 0.1, None, "推定", "天頂 0〜0.4 m → T_zw"),
            ("受信機の時計のずれ", None, None, "推定", "1 ms で 300 km → b"),
            ("整数値バイアス", None, None, "推定", "実数 β_i"),
            ("固体潮汐など小さな項", 0.3, 0.005, "モデル", "最大で数十 cm"),
            ("擬似距離のマルチパスと雑音", 1.12, 3.33, "残る", "1.12 m → 3.33 m"),
            ("位相のマルチパスと雑音", 0.007, 0.021, "残る", "7 mm → 2.1 cm")]
    for k, (nm, a, b, tg, note) in enumerate(rows):
        yy = p.y + 4 + k * 26
        o.append(T(p.x - 8, yy + 13, nm, "end", 10, INK, True))
        tl, c = tags[tg]
        if a is not None:
            o.append(RECT(p.X(0.001), yy + 2, p.X(a) - p.X(0.001), 8, 1, "none", MUT, 1, "3 2"))
        if b is not None:
            o.append(RECT(p.X(0.001), yy + 10, p.X(b) - p.X(0.001), 8, 1, soft(c), c, 1.1))
        if a is None and tg == "推定" and nm.startswith("受信機"):
            o.append(ARR(p.X(0.001), yy + 6, p.X(10) + 2, yy + 6, c=MUT, lw=1.2, head=6, dash="3 2"))
        cw, w_ = CHIP(484, yy + 13, tl, c=c, sz=9.5)
        o.append(cw)
        o.append(TX(484 + w_ + 6, yy + 13, note, "start", 9, MUT))
    yl = p.y + p.h + 54
    o.append(RECT(214, yl - 8, 18, 8, 1, "none", MUT, 1, "3 2"))
    o.append(T(238, yl, "直す前（L1 の 1 つの周波数）", "start", 9.5, MUT))
    o.append(RECT(430, yl - 8, 18, 8, 1, soft(TEA), TEA, 1.1))
    o.append(T(454, yl, "PPP で残る分", "start", 9.5, MUT))
    return SVG(700, yl + 12, o, "PPP で誤差の源をどう扱うか（直す前は 7 章 6 節の予算・7 章 2 節の値と代表値、残る分は代表値と例の値）。")


F["e18_src"] = _f18_src_fig()


# =====================================================================
# 3 節: RTK・DGNSS と PPP の情報の流れ
# =====================================================================
def _f18_flow_fig():
    o = []
    o.append(T(14, 18, "(a) DGNSS・RTK（16・17 章）: 近くの基準局の観測を使う", "start", 11.5, INK, True))
    o.append(BOX(14, 32, 150, 52, "基準局", "位置が分かった点。近く（数 km〜数十 km）", c=PUR, fill=soft(PUR), sz=11.5, ssz=9.5))
    o.append(ARR(166, 58, 262, 58, c=PUR, lw=1.8))
    o.append(T(214, 50, "観測・補正値", "middle", 9.5, PUR, True, halo=True))
    o.append(T(214, 72, "無線・インターネット", "middle", 9, MUT, halo=True))
    o.append(BOX(264, 32, 200, 52, "移動局", "差をとって共通の誤差を消す", c=SIG, fill=soft(SIG), sz=11.5, ssz=9.5))
    o.append(ARR(466, 58, 520, 58, c=GLD, lw=1.8))
    o.append(BOX(522, 36, 160, 44, "位置", "基準局から離れると落ちる", c=GLD, fill=soft(GLD), sz=11.5, ssz=9.5))
    y0 = 112
    o.append(T(14, y0, "(b) PPP: 世界の観測から計算した精密暦を使う", "start", 11.5, INK, True))
    o.append(BOX(14, y0 + 14, 150, 52, "世界の観測局", "数百の点。互いに数千 km", c=PUR, fill=soft(PUR), sz=11.5, ssz=9.5))
    o.append(ARR(90, y0 + 68, 90, y0 + 92, c=PUR, lw=1.8))
    o.append(BOX(14, y0 + 94, 150, 52, "解析の機関", "衛星の軌道と時計を計算", c=PUR, fill=soft(PUR), sz=11.5, ssz=9.5))
    o.append(ARR(166, y0 + 120, 262, y0 + 120, c=PUR, lw=1.8))
    o.append(T(214, y0 + 112, "精密暦", "middle", 9.5, PUR, True, halo=True))
    o.append(T(214, y0 + 134, "インターネット・衛星", "middle", 9, MUT, halo=True))
    # 受信機の中
    o.append(RECT(264, y0 + 14, 422, 206, 10, "none", SIG, 1.4, "5 3"))
    o.append(T(276, y0 + 32, "受信機（1 台）", "start", 10.5, SIG, True))
    o.append(BOX(276, y0 + 42, 190, 46, "2 周波の擬似距離と位相", "電離層フリー結合（1 節）", c=SIG, fill=soft(SIG), sz=10.5, ssz=9.5))
    o.append(BOX(276, y0 + 98, 190, 46, "精密暦で直す", "衛星の軌道と時計の誤差を数 cm に", c=PUR, fill=soft(PUR), sz=10.5, ssz=9.5))
    o.append(BOX(276, y0 + 154, 190, 46, "モデルで直す", "対流圏の乾燥の部分・固体潮汐など", c=GRN, fill=soft(GRN), sz=10.5, ssz=9.5))
    for yy in (y0 + 65, y0 + 121, y0 + 177):
        o.append(ARR(468, yy, 500, y0 + 121, c=MUT, lw=1.3))
    o.append(BOX(502, y0 + 58, 172, 124, None, None, c=GLD, fill=soft(GLD)))
    o.append(T(588, y0 + 78, "カルマンフィルタ", "middle", 11, GLD, True))
    o.append(T(588, y0 + 98, "予測: 前の推定を進める", "middle", 9.5, INK))
    o.append(T(588, y0 + 116, "更新: 観測で直す", "middle", 9.5, INK))
    o.append(CARR(632, y0 + 128, 544, y0 + 128, bend=0.3, c=GLD, lw=1.4))
    o.append(T(588, y0 + 172, "観測ごとに繰り返す", "middle", 9, GLD, halo=True))
    o.append(ARR(588, y0 + 184, 588, y0 + 202, c=GLD, lw=1.6))
    o.append(TX(588, y0 + 214, "位置・b・T_zw・β_i", "middle", 10, GLD, True, halo=True))
    return SVG(700, y0 + 226, o, "DGNSS・RTK と PPP で、補正の情報がどこから来るか（PPP の受信機の中の計算の流れも示した）。")


F["e18_flow"] = _f18_flow_fig()


# =====================================================================
# 4 節: 収束のモデル（w18_converge と同じ計算）
#   東京の止まった受信機。観測は dt ごと、仰角マスク以上の衛星の擬似距離と位相（どちらも電離層フリー結合）。
#   未知数: 東・北・上の位置、対流圏の天頂の遅れの湿潤の部分（tropo=True のとき）、衛星ごとの実数の β_i、
#   観測ごとの受信機の時計（観測ごとに消去する）。誤差は観測ごとに独立で、重みは 1/σ²。
#   推定の分散は、情報行列（正規方程式の行列）を足し上げて、それまでに見えた衛星の未知数だけで逆行列をとる。
# =====================================================================
_F18_SYSS = {"GPS": ("GPS",), "ALL": ("GPS", "Galileo", "BeiDou", "QZSS")}
_F18_SP, _F18_SL = 3.33, 0.021          # 本文の例: 擬似距離 3.33 m・位相 2.1 cm（1 つの周波数の 1.12 m・7 mm の 2.98 倍）


def _f18_mT(el):
    return 1.001 / math.sqrt(0.002001 + math.sin(el * _F18_D2R) ** 2)


def _f18_vis(t, systems, mask):
    out = []
    for s in gnss_const():
        if s["sys"] not in systems:
            continue
        el, az, d = elaz(*_F18_TOK, sat_ecef(s, t))
        if el >= mask:
            out.append((s["nm"], el, az))
    return out


def _f18_r95(C2):
    """2 次元の正規分布で 95 % が入る円の半径（7 章 5 節の方法。誤差の楕円の 2 つの半径から数値で求める）。"""
    a, b, c = C2[0][0], C2[0][1], C2[1][1]
    m = (a + c) / 2
    r = math.sqrt(((a - c) / 2) ** 2 + b * b)
    s1, s2 = math.sqrt(m + r), math.sqrt(max(m - r, 1e-30))
    ph = _f18_np.linspace(0, 2 * math.pi, 720, endpoint=False)
    q = _f18_np.cos(ph) ** 2 / s1 ** 2 + _f18_np.sin(ph) ** 2 / s2 ** 2
    lo, hi = 0.0, 10 * (s1 + s2)
    for _ in range(60):
        md = (lo + hi) / 2
        if float(_f18_np.mean((1 - _f18_np.exp(-md * md * q / 2)) / q) / (s1 * s2)) < 0.95:
            lo = md
        else:
            hi = md
    return (lo + hi) / 2


_F18_CONV_CACHE = {}


def _f18_conv(sysk="GPS", sP=_F18_SP, sL=_F18_SL, tropo=True, dt=30.0, T_=3600.0, mask=10.0):
    key = (sysk, sP, sL, tropo, dt, T_, mask)
    if key in _F18_CONV_CACHE:
        return _F18_CONV_CACHE[key]
    systems = _F18_SYSS[sysk]
    epochs = [k * dt for k in range(int(round(T_ / dt)) + 1)]
    vis = [_f18_vis(t, systems, mask) for t in epochs]
    names = []
    for v in vis:
        for q in v:
            if q[0] not in names:
                names.append(q[0])
    off = 4 if tropo else 3
    nx = off + len(names)
    J = _f18_np.zeros((nx, nx))
    seen, out = [], []
    for t, v in zip(epochs, vis):
        H, Wt = [], []
        for nm, el, az in v:
            j = off + names.index(nm)
            if j not in seen:
                seen.append(j)
            ce, se = math.cos(el * _F18_D2R), math.sin(el * _F18_D2R)
            h = _f18_np.zeros(nx)
            h[:3] = (-ce * math.sin(az * _F18_D2R), -ce * math.cos(az * _F18_D2R), -se)
            if tropo:
                h[3] = _f18_mT(el)
            g = h.copy()
            g[j] = 1.0
            H += [h, g]
            Wt += [1 / sP ** 2, 1 / sL ** 2]
        H = _f18_np.array(H)
        Wt = _f18_np.array(Wt)
        u = H.T @ Wt
        J += (H.T * Wt) @ H - _f18_np.outer(u, u) / Wt.sum()
        idx = list(range(off)) + sorted(seen)
        Cv = _f18_np.linalg.inv(J[_f18_np.ix_(idx, idx)])
        out.append(dict(t=t, n=len(v), r95=_f18_r95(Cv[:2, :2]), su=math.sqrt(Cv[2, 2])))
    _F18_CONV_CACHE[key] = out
    return out


def _f18_tconv(res, th=0.10):
    for i, r in enumerate(res):
        if all(q["r95"] < th for q in res[i:]):
            return r["t"]
    return None


# 比べるための代表値（モデルではない）: RTK は 17 章 6 節、PPP-RTK は 5 節の CLAS の基準
_F18_RTKREP = (10.0, 0.8, 0.02)          # 整数が決まる時刻 [s]・それまでの R95 [m]・決まった後の R95 [m]
_F18_CLASREP = (60.0, 1.5, 0.06)


# =====================================================================
# 4 節: 位置の手がかりは衛星の向きの変化（1 つの衛星・東の成分）
# =====================================================================
def _f18_why_data():
    sat = [s for s in gnss_const() if s["nm"] == "G6"][0]
    ts = _f18_np.arange(0, 3601, 30.0)
    le = []
    for t in ts:
        el, az, d = elaz(*_F18_TOK, sat_ecef(sat, t))
        le.append(math.cos(el * _F18_D2R) * math.sin(az * _F18_D2R))
    return ts, _f18_np.array(le)


def _f18_why_fig():
    o = []
    ts, le = _f18_why_data()
    sF = _F18_SL
    de_true, beta = 0.30, 0.03
    rng = _f18_np.random.default_rng(1810)
    noise = rng.standard_normal(len(ts)) * sF
    o.append(T(14, 18, "(a) 位相の残差を、視線の東の成分に対して並べる（G6、真の δe = 30 cm）", "start", 11.5, INK, True))
    for j, (mins, x0) in enumerate(((10, 70), (30, 270))):
        n = int(mins * 60 / 30) + 1
        l = le[:n] - le[0]
        y = -l * de_true + beta + noise[:n]
        p = Plot(x0, 40, 150, 140, (-0.01, 0.21), (-0.10, 0.08))
        o.append(p.axes(xl="l_k − l_0", yl="Φ̃_k [cm]" if j == 0 else None, xt=[0, 0.1, 0.2], yt=[-0.08, -0.04, 0, 0.04, 0.08],
                        xfmt=lambda v: "%g" % v, yfmt=lambda v: _f18_m(100 * v, 0)))
        lb = float(_f18_np.mean(l))
        sxx = float(_f18_np.sum((l - lb) ** 2))
        sl = float(_f18_np.sum((l - lb) * (y - y.mean())) / sxx)
        ic = float(y.mean() - sl * lb)
        ss = sF / math.sqrt(sxx)
        xs = _f18_np.linspace(-0.005, 0.205, 30)
        up = [(x_, ic + sl * x_ + ss * (x_ - lb)) for x_ in xs]
        dn = [(x_, ic + sl * x_ - ss * (x_ - lb)) for x_ in xs]
        o.append(p.clip(up, c=GLD, lw=1.2, dash="4 3"))
        o.append(p.clip(dn, c=GLD, lw=1.2, dash="4 3"))
        o.append(p.clip([(x_, beta - de_true * x_) for x_ in xs], c=GRN, lw=1.8))
        for a_, b_ in zip(l, y):
            o.append(D(p.X(a_), p.Y(b_), SIG, 2.2))
        o.append(p.clip([(x_, ic + sl * x_) for x_ in xs], c=GLD, lw=2))
        o.append(T(p.x + p.w / 2, p.y - 6, "%d 分（%d 回）" % (mins, n), "middle", 10, INK, True))
        o.append(TX(p.x + 6, p.y + p.h - 8, "δe の推定 %s ± %s cm" % (_f18_m(-100 * sl, 0), _f18_m(100 * ss, 0)), "start", 9.5, GLD, True, halo=True))
    o.append(LEGL(70, 236, [(GRN, None, "本当の直線（傾き −δe）"), (GLD, None, "当てはめた直線"), (GLD, "4 3", "傾きの ±1σ")], 9.5, 14))
    # (b) 推定の標準偏差と時間
    o.append(T(462, 18, "(b) δe の推定の標準偏差", "start", 11.5, INK, True))
    q = Plot(500, 40, 180, 160, (0, 60), (1, 1000), ylog=True)
    o.append(q.axes(xl="経った時間 [分]", yl="標準偏差 [cm]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[1, 10, 100, 1000], yfmt=lambda v: "%g" % v))
    two, reg = [], []
    for k in range(1, len(ts)):
        two.append((ts[k] / 60, 100 * math.sqrt(2) * sF / abs(le[k] - le[0])))
        l = le[:k + 1]
        reg.append((ts[k] / 60, 100 * sF / math.sqrt(float(_f18_np.sum((l - l.mean()) ** 2)))))
    o.append(q.clip(two, c=ALI, lw=2))
    o.append(q.clip(reg, c=GLD, lw=2))
    for mins in (10, 30):
        k = int(mins * 2)
        v = 100 * math.sqrt(2) * sF / abs(le[k] - le[0])
        o.append(D(q.X(mins), q.Y(v), ALI, 3.6))
        o.append(T(q.X(mins) + 5, q.Y(v) - 6, "%d cm" % round(v), "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(58), q.Y(300), "2 つの時刻", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(58), q.Y(1.6), "30 s ごとの全部", "end", 9.5, GLD, True, halo=True))
    return SVG(700, 250, o, "1 つの衛星の位相から、受信機の東の位置を求める簡単な場合（位相の雑音 2.1 cm、30 s ごと、β は実数の未知数）。")


F["e18_why"] = _f18_why_fig()


# =====================================================================
# 4 節: PPP の水平の誤差が縮む様子（モデル）と、RTK の代表値（PPP-RTK はこの図の後で定義するので、デモでだけ重ねる）
# =====================================================================
def _f18_conv_fig():
    o = []
    o.append(T(14, 18, "水平の誤差（R95）と、始めてからの時間", "start", 11.5, INK, True))
    p = Plot(70, 32, 430, 230, (0, 60), (0.01, 10), ylog=True)
    o.append(p.axes(xl="始めてからの時間 [分]", yl="水平の R95 [m]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[0.01, 0.1, 1, 10],
                    yfmt=lambda v: {0.01: "0.01", 0.1: "0.1", 1: "1", 10: "10"}[v]))
    o.append(W(p.x, p.Y(0.1), p.x + p.w, p.Y(0.1), c=ALI, lw=1.2, dash="5 3"))
    o.append(T(p.x + p.w - 4, p.Y(0.1) - 5, "10 cm", "end", 9.5, ALI, True, halo=True))
    curves = [("GPS", True, _F18_SP, GLD, None, "PPP（GPS）"), ("ALL", True, _F18_SP, GLD, "6 4", "PPP（4 つの衛星系）"),
              ("GPS", False, 1.12, TEA, "2 3", "電離層・対流圏を補正（GPS）")]
    info = []
    for sysk, tropo, sP, c, dash, lab in curves:
        res = _f18_conv(sysk, sP, _F18_SL, tropo)
        o.append(p.clip([(r["t"] / 60, r["r95"]) for r in res], c=c, lw=2.2, dash=dash))
        tc = _f18_tconv(res)
        info.append((lab, tc, c, dash))
        if tc is not None and dash != "2 3":
            o.append(W(p.X(tc / 60), p.Y(0.1), p.X(tc / 60), p.y + p.h, c=c, lw=1, dash="2 2"))
            o.append(T(p.X(tc / 60) + 3, p.y + p.h - 6, "%.1f 分" % (tc / 60), "start", 9.5, c, True, halo=True))
    # 代表値（モデルではない）
    tf, a, b = _F18_RTKREP
    o.append(p.clip([(0, a), (tf / 60, a), (tf / 60, b), (60, b)], c=GRN, lw=2.2, dash="7 3"))
    o.append(T(p.X(2.5), p.Y(0.02) - 5, "RTK 2 cm（10 s で決まる）", "start", 9.5, GRN, True, halo=True))
    o.append(W(p.x, p.Y(6.6), p.x + p.w, p.Y(6.6), c=MUT, lw=1.2, dash="2 3"))
    o.append(T(p.x + p.w - 4, p.Y(6.6) - 5, "単独（L1）6.6 m", "end", 9.5, MUT, True, halo=True))
    # 凡例と読み
    lx = 526
    o.append(T(lx, 44, "PPP のモデル", "start", 10.5, INK, True))
    for k, (lab, tc, c, dash) in enumerate(info):
        y = 64 + k * 34
        o.append(W(lx, y - 4, lx + 22, y - 4, c=c, lw=2.2, dash=dash))
        o.append(T(lx + 28, y, lab, "start", 9.5, INK, True))
        o.append(T(lx + 28, y + 14, "10 cm まで %.1f 分" % (tc / 60), "start", 9.5, c, True))
    y = 64 + 3 * 34 + 6
    o.append(T(lx, y, "代表値（モデルではない）", "start", 10.5, INK, True))
    o.append(W(lx, y + 16, lx + 22, y + 16, c=GRN, lw=2.2, dash="7 3"))
    o.append(T(lx + 28, y + 20, "RTK（17 章 6 節）", "start", 9.5, INK, True))
    return SVG(700, 300, o, "PPP の水平の誤差が縮む様子（東京で 30 s ごとのエポック、擬似距離 3.33 m・位相 2.1 cm、誤差はエポックごとに独立としたモデル）と、RTK の代表値。")


F["e18_conv"] = _f18_conv_fig()


# =====================================================================
# 4 節: RTK・PPP・PPP-RTK で、何を配り、何を推定するか
# =====================================================================
def _f18_ssr_fig():
    o = []
    o.append(T(14, 18, "(a) 配る情報と、受信機が推定するもの", "start", 11.5, INK, True))
    cols = [("基準局の", "観測"), ("衛星の軌道", "と時計"), ("衛星の", "バイアス"), ("電離層", ""), ("対流圏", "")]
    cx = [180 + i * 70 for i in range(5)]
    for x, c in zip(cx, cols):
        o.append(T(x, 34 if c[1] else 44, c[0], "middle", 9.5, MUT, True))
        if c[1]:
            o.append(T(x, 47, c[1], "middle", 9.5, MUT, True))
    o.append(T(590, 44, "受信機が推定するもの", "middle", 9.5, MUT, True))
    rows = [("RTK（17 章）", GRN, ["全部まとめて", None, None, None, None], "位置・時計・整数値バイアス（整数）", "数秒〜数十秒"),
            ("PPP", GLD, [None, "配る", "（製品による）", "2 周波で消す", "推定する"], "位置・時計・T_zw・β_i（実数）", "数十分"),
            ("PPP-RTK", PUR, [None, "配る", "配る", "地域で配る", "地域で配る"], "位置・時計・整数値バイアス（整数）", "1 分ほど")]
    for k, (nm, c, cells, est, tm) in enumerate(rows):
        y = 58 + k * 40
        o.append(RECT(14, y, 672, 32, 6, soft(c), "none", 0))
        o.append(T(24, y + 14, nm, "start", 11, c, True))
        o.append(T(24, y + 27, "初期化 " + tm, "start", 9, INK))
        for x, v in zip(cx, cells):
            if v is None:
                o.append(T(x, y + 21, "—", "middle", 10, MUT))
            else:
                cw, _ = CHIP(x, y + 20, v, c=c if not v.startswith("（") and v not in ("2 周波で消す", "推定する") else MUT, sz=9, a="middle")
                o.append(cw)
        o.append(TX(590, y + 21, est, "middle", 9.5, INK, True))
    # (b) 観測局の置き方と、使える範囲（模式）
    yb = 200
    o.append(T(14, yb, "(b) 補正を作る観測局の置き方と、使える範囲（模式）", "start", 11.5, INK, True))
    rng = _f18_np.random.default_rng(1804)
    for j, (ttl, c, sub) in enumerate((("RTK", GRN, "基準局の近く"), ("PPP", GLD, "どこでも（精密暦は全地球で同じ）"), ("PPP-RTK", PUR, "観測網のある地域"))):
        x0 = 14 + j * 228
        o.append(RECT(x0, yb + 12, 214, 132, 6, SCR, LIN, 1))
        o.append(T(x0 + 8, yb + 28, ttl, "start", 10.5, c, True))
        if j == 0:
            o.append(CIRC(x0 + 107, yb + 82, 42, c=c, lw=1.4, fill=soft(c)))
            o.append(D(x0 + 107, yb + 82, PUR, 4.5))
            o.append(T(x0 + 107, yb + 100, "基準局", "middle", 9, PUR, True, halo=True))
        elif j == 1:
            for xx, yy in ((40, 50), (110, 40), (180, 60), (60, 110), (150, 120), (200, 100)):
                o.append(D(x0 + xx * 0.95 + 4, yb + 12 + yy, PUR, 3.6))
            o.append(RECT(x0 + 4, yb + 36, 206, 100, 4, soft(c), "none", 0))
        else:
            o.append(RECT(x0 + 50, yb + 40, 120, 90, 8, soft(c), c, 1.2))
            for ix in range(6):
                for iy in range(5):
                    o.append(D(x0 + 60 + ix * 20, yb + 50 + iy * 18, PUR, 2.0))
        o.append(T(x0 + 107, yb + 160, sub, "middle", 9.5, INK, True))
    o.append(T(14, yb + 180, "紫の点: 補正を作る観測局（基準局）。色の付いた範囲で、補正を使える", "start", 9.5, MUT))
    return SVG(700, yb + 192, o, "RTK・PPP・PPP-RTK で、配る補正の情報と、受信機が推定するもの（初期化の時間は代表値）。")


F["e18_ssr"] = _f18_ssr_fig()


# =====================================================================
# 5 節: みちびきの補強（範囲の模式と、公式の基準。書いた時点）
# =====================================================================
def _f18_qzcover(step=5, mask=10.0):
    """1 章の配置のみちびき 4 機のうち、いつも 1 機以上が仰角 mask 以上に見える点（緯度・経度の格子）。"""
    qz = [s for s in gnss_const() if s["sys"] == "QZSS"]
    ts = _f18_np.arange(0, 86164, 1800)
    sp = [[sat_ecef(s, t) for t in ts] for s in qz]
    out = []
    for lat in range(-60, 61, step):
        for lon in range(60, 241, step):
            ok = True
            for k in range(len(ts)):
                if max(elaz(lat, lon, 0, sp[j][k])[0] for j in range(len(qz))) < mask:
                    ok = False
                    break
            out.append((lat, lon, ok))
    return out


def _f18_ll(p):
    x, y, z = p
    return math.degrees(math.atan2(z, math.hypot(x, y))), math.degrees(math.atan2(y, x)) % 360


def _f18_qzss_fig():
    o = []
    o.append(T(14, 18, "(a) みちびきの地上軌跡と、補正の範囲（模式）", "start", 11.5, INK, True))
    p = Plot(56, 30, 400, 270, (60, 240), (-60, 60))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 1))
    for (lat, lon, ok) in _f18_qzcover():
        if ok:
            a0, a1 = max(lon - 2.5, 60), min(lon + 2.5, 240)
            b0, b1 = max(lat - 2.5, -60), min(lat + 2.5, 60)
            o.append(RECT(p.X(a0), p.Y(b1), p.X(a1) - p.X(a0) + 0.3, p.Y(b0) - p.Y(b1) + 0.3, 0, soft(TEA), "none", 0))
    o.append(p.axes(xl="経度 [°]", yl="緯度 [°]", xt=[60, 90, 120, 150, 180, 210, 240], yt=[-60, -30, 0, 30, 60],
                    xfmt=lambda v: ("%d°E" % v) if v <= 180 else ("%d°W" % (360 - v)), yfmt=lambda v: ("%d°N" % v) if v > 0 else (("%d°S" % -v) if v < 0 else "0°")))
    qz = [s for s in gnss_const() if s["sys"] == "QZSS"]
    pts = [_f18_ll(sat_ecef(qz[0], t)) for t in range(0, 86165, 600)]
    o.append(PL([(p.X(b), p.Y(a)) for a, b in pts], c=TEA, lw=2))
    o.append(D(p.X(127), p.Y(0), TEA, 5))
    o.append(T(p.X(127) + 7, p.Y(0) + 4, "静止軌道 127°E", "start", 9, TEA, True, halo=True))
    o.append(T(p.X(120), p.Y(-36), "準天頂軌道の地上軌跡", "end", 9, TEA, True, halo=True))
    # 日本と沿岸（模式）
    o.append(RECT(p.X(122), p.Y(46), p.X(154) - p.X(122), p.Y(20) - p.Y(46), 8, soft(PUR), PUR, 1.6))
    o.append(T(p.X(156), p.Y(43), "日本と沿岸", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(156), p.Y(43) + 13, "CLAS・SLAS", "start", 9.5, PUR, True, halo=True))
    for nm, lat, lon, a in (("東京", 35.7, 139.8, "start"), ("シンガポール", 1.3, 103.8, "end"), ("シドニー", -33.9, 151.2, "start"), ("ニューデリー", 28.6, 77.2, "start")):
        o.append(D(p.X(lon), p.Y(lat), INK, 3))
        o.append(T(p.X(lon) + (5 if a == "start" else -5), p.Y(lat) + 4, nm, a, 9, INK, halo=True))
    o.append(T(p.x + 6, p.y + p.h - 8, "青緑の地: みちびきがいつも 1 機以上、仰角 10° 以上に見える範囲（1 章の配置で計算）", "start", 9, TEA, True, halo=True))
    # (b) 3 つのサービス
    x0 = 478
    o.append(T(x0, 18, "(b) 公式の性能の基準（書いた時点）", "start", 11.5, INK, True))
    svc = [("SLAS", SIG, ["L1S（L1 の周波数）", "日本と沿岸", "擬似距離の補正", "水平 1 m・垂直 2 m（95 %、静止）", "L1 の受信機（対応したもの）"]),
           ("CLAS", PUR, ["L6D（L6 の周波数）", "日本と沿岸", "PPP-RTK", "水平 6 cm・垂直 12 cm（95 %、静止）", "初期化 1 分以内（95 %）", "多周波と L6（対応したもの）"]),
           ("MADOCA-PPP", GLD, ["L6E（インターネットでも）", "アジア・オセアニア", "PPP", "30 分以内に水平 30 cm・", "垂直 50 cm（95 %）", "多周波と、L6 かインターネット"])]
    y = 34
    for nm, c, lines in svc:
        h = 22 + len(lines) * 13
        o.append(RECT(x0, y, 216, h, 6, soft(c), c, 1.2))
        o.append(T(x0 + 10, y + 16, nm, "start", 11, c, True))
        for k, l in enumerate(lines):
            o.append(T(x0 + 12, y + 31 + k * 13, l, "start", 9.5, INK))
        y += h + 8
    return SVG(700, 350, o, "みちびきの地上軌跡と補正の範囲（範囲の形は模式）、SLAS・CLAS・MADOCA-PPP の公式の性能の基準（内閣府の公表による。書いた時点）。")


F["e18_qzss"] = _f18_qzss_fig()


def _f18_qzflow_fig():
    o = []
    o.append(T(14, 18, "みちびきの補正の情報ができて届くまで", "start", 11.5, INK, True))
    lanes = [("CLAS", PUR, "全国の電子基準点", "（17 章 5 節）", "衛星の軌道・時計・バイアス", "地域ごとの電離層・対流圏", "みちびき L6D", "多周波・L6 の受信機", "PPP-RTK で整数を決める"),
             ("MADOCA-PPP", GLD, "世界の監視局", "", "衛星の軌道・時計・バイアス", "（電離層・対流圏は含まない）", "みちびき L6E・インターネット", "多周波の受信機", "PPP で収束を待つ"),
             ("SLAS", SIG, "国内の基準局", "", "擬似距離の補正", "", "みちびき L1S", "L1 の受信機", "SBAS と同じ使い方")]
    for k, (nm, c, src, srcs, a1, a2, via, rx, how) in enumerate(lanes):
        y = 34 + k * 74
        o.append(T(14, y + 34, nm, "start", 11, c, True))
        o.append(BOX(100, y + 8, 130, 50, src, srcs or None, c=c, fill=soft(c), sz=10.5, ssz=9))
        o.append(ARR(232, y + 33, 258, y + 33, c=c, lw=1.6))
        o.append(BOX(260, y + 8, 168, 50, None, None, c=c, fill=soft(c)))
        o.append(T(344, y + 30 if a2 else y + 37, a1, "middle", 9.5, INK, True))
        if a2:
            o.append(T(344, y + 46, a2, "middle", 9.5, INK, True))
        o.append(ARR(430, y + 33, 456, y + 33, c=c, lw=1.6))
        o.append(BOX(458, y + 12, 104, 42, None, None, c=c, fill=SCR))
        vl = via.split("・")
        for q_, l_ in enumerate(vl):
            o.append(T(510, y + 37 - 7 * (len(vl) - 1) + 14 * q_, l_, "middle", 9.5, c, True))
        o.append(ARR(564, y + 33, 586, y + 33, c=c, lw=1.6))
        o.append(BOX(588, y + 12, 104, 42, rx, None, c=SIG, fill=soft(SIG), sz=9.5))
        o.append(T(640, y + 68, how, "middle", 9, MUT))
    return SVG(700, 34 + 3 * 74 + 4, o, "CLAS・MADOCA-PPP・SLAS の補正の情報の流れ（内閣府の公表による。書いた時点）。")


F["e18_qzflow"] = _f18_qzflow_fig()


# =====================================================================
# 6 節: 方式の選び方（精度と初期化の時間。代表値）
# =====================================================================
#  名前, 初期化の時間 [s] の範囲, 水平の 95 % [m] の範囲, 色, 出典
_F18_METH = [("単独（L1）", (1, 35), (3.6, 8.2), SIG, "5・7 章"),
             ("SBAS", (40, 300), (1.5, 3.0), SIG, "16 章"),
             ("SLAS", (40, 300), (0.6, 1.0), SIG, "5 節"),
             ("DGNSS", (3, 30), (1.5, 3.0), SIG, "16 章"),
             ("RTK", (2, 60), (0.01, 0.04), GRN, "17 章"),
             ("CLAS", (20, 60), (0.04, 0.12), PUR, "5 節"),
             ("PPP", (600, 1800), (0.05, 0.3), GLD, "4・5 節")]


def _f18_choose_fig():
    o = []
    o.append(T(14, 18, "水平の精度（95 %）と、初期化の時間（代表値・公式の基準）", "start", 11.5, INK, True))
    p = Plot(78, 34, 460, 260, (1, 3600), (0.01, 20), xlog=True, ylog=True)
    o.append(p.axes(xl="初期化の時間 [s]（対数）", yl="水平の 95 % の値 [m]（対数）", xt=[1, 10, 60, 600, 3600], yt=[0.01, 0.1, 1, 10],
                    xfmt=lambda v: {1: "1 s", 10: "10 s", 60: "1 分", 600: "10 分", 3600: "1 時間"}[v], yfmt=lambda v: {0.01: "1 cm", 0.1: "10 cm", 1: "1 m", 10: "10 m"}[v]))
    pos = {"単独（L1）": ("start", 4, -4), "SBAS": ("start", 4, -4), "SLAS": ("start", 4, -4), "DGNSS": ("end", -4, 12),
           "RTK": ("start", 4, -4), "CLAS": ("start", 4, -4), "PPP": ("start", 4, -4)}
    for nm, (t0, t1), (a0, a1), c, src in _F18_METH:
        o.append(RECT(p.X(t0), p.Y(a1), p.X(t1) - p.X(t0), p.Y(a0) - p.Y(a1), 3, soft(c), c, 1.5))
        an, dx, dy = pos[nm]
        xx = p.X(t1) + dx if an == "start" else p.X(t0) + dx
        yy = p.Y(a1) + dy if dy < 0 else p.Y(a0) + dy
        o.append(T(xx, yy, nm, an, 10, c, True, halo=True))
    o.append(T(p.X(3000), p.Y(14), "擬似距離だけ: すぐ使えて m 級", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(3000), p.Y(0.035), "実数の整数値バイアス: 数十分", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(1.2), p.Y(0.2), "整数に決める: 1 分ほどで cm 級", "start", 9.5, GRN, True, halo=True))
    lx = 560
    o.append(T(lx, 44, "値のもと", "start", 10.5, INK, True))
    for k, (nm, tt, aa, c, src) in enumerate(_F18_METH):
        o.append(T(lx, 64 + k * 17, nm, "start", 9.5, c, True))
        o.append(T(lx + 64, 64 + k * 17, src, "start", 9.5, MUT))
    o.append(T(lx, 64 + 7 * 17 + 10, "初期化の時間は、電源を", "start", 9, MUT))
    o.append(T(lx, 64 + 7 * 17 + 23, "入れてから（単独は TTFF）", "start", 9, MUT))
    return SVG(700, 340, o, "方式ごとの水平の精度と初期化の時間（各章の代表値と公式の基準。場所・時刻・受信機で大きく変わる）。")


F["e18_choose"] = _f18_choose_fig()


# 方式ごとの要るもの（w18_choose と同じ表）
_F18_NEEDS = [("単独（L1）", ["L1 だけでよい", "要らない", "要らない", "どこでも"], [0, 0, 0, 0]),
              ("SBAS", ["L1 だけでよい", "要らない", "静止衛星（L1）", "SBAS の範囲（日本は MSAS）"], [0, 0, 0, 1]),
              ("SLAS", ["L1（対応したもの）", "要らない", "みちびき（L1S）", "日本と沿岸"], [0, 0, 0, 2]),
              ("DGNSS", ["L1 だけでよい", "要る（自分か配信）", "無線・インターネット", "基準局から数百 km まで"], [0, 2, 2, 1]),
              ("RTK", ["多周波が多い", "要る（自分か配信）", "無線・インターネット", "基準局の近く"], [1, 2, 2, 2]),
              ("PPP", ["多周波", "要らない", "インターネット・衛星", "補正が届けばどこでも"], [1, 0, 1, 0]),
              ("CLAS", ["多周波と L6（対応したもの）", "要らない", "みちびき（L6D）", "日本と沿岸"], [2, 0, 0, 2])]


def _f18_needs_fig():
    o = []
    o.append(T(14, 18, "方式ごとに要るもの（費用は、受信機の種類と、基準局・通信が要るかで比べる）", "start", 11.5, INK, True))
    heads = ["受信機", "基準局", "補正の届け方", "使える場所"]
    xs = [96, 254, 376, 516]
    ws = [150, 114, 132, 178]
    for x, w, h in zip(xs, ws, heads):
        o.append(T(x + w / 2, 44, h, "middle", 10, MUT, True))
    cmap = [GRN, GLD, ALI]
    for k, (nm, cells, lv) in enumerate(_F18_NEEDS):
        y = 54 + k * 30
        o.append(T(88, y + 17, nm, "end", 10.5, INK, True))
        for x, w, c, l in zip(xs, ws, cells, lv):
            col = cmap[l]
            o.append(RECT(x, y + 3, w - 6, 22, 5, soft(col), col, 1.0))
            o.append(T(x + (w - 6) / 2, y + 18, c, "middle", 9 if len(c) > 13 else 9.5, INK, True))
    yl = 54 + 7 * 30 + 18
    o.append(LEGEND(96, yl, [(GRN, "要らない・広い・L1 だけ"), (GLD, "少し要る・多周波"), (ALI, "要る・狭い・L6 も")], 9.5))
    return SVG(700, yl + 12, o, "方式ごとに要る受信機・基準局・通信と、使える場所（代表的な場合）。")


F["e18_needs"] = _f18_needs_fig()
