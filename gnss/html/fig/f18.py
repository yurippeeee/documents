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
    o.append(T(xd, yb + 92, "係数の和 %.3f − %.3f = 1 なので D はそのまま残る" % (a1, a2), "start", 9.5, INK))
    return SVG(700, 266, o, "2 つの周波数の電離層遅延と、電離層フリー結合（電離層は 7 章 2 節の例。マルチパスと雑音は 7 章の予算の値）。")


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
    o.append(T(430, 18, "(b) 雑音の倍率と 2 つ目の周波数（f_1 = L1）", "start", 11.5, INK, True))
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
    o.append(TX(p.X(6) + 4, p.Y(-30), "6 分で N_1 が 1 ずれた", "start", 9.5, ALI, True, halo=True))
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
    o.append(TX(q.X(6) - 4, q.Y(28), "N_1 が 1 ずれた: +%.1f cm" % (100 * l1), "end", 9.5, ALI, True, halo=True))
    o.append(TX(q.X(9.9), q.Y(-3.5), "N_1 が 9、N_2 が 7 ずれた: +%.1f cm" % (100 * (9 * l1 - 7 * l2)), "end", 9.5, MUT, True, halo=True))
    o.append(T(q.X(0.2), q.Y(16), "電離層の変化（1 分に 0.1 TECU）", "start", 9.5, GLD, halo=True))
    o.append(q.line([(t / 60, 100 * g * v) for t, v in zip(ts[::30], dI1[::30])], c=GLD, lw=1.2, dash="4 3"))
    return SVG(700, 236, o, "1 つの周波数の位相と、幾何によらない結合に現れるサイクルスリップ（位相の雑音は 1 つの周波数で 7 mm、電離層の変化は例の値）。")


F["e18_slip"] = _f18_slip_fig()
