# -*- coding: utf-8 -*-
# 03 章 雑音より弱い電波を受ける — 信号の強さと C/N0 の図
import numpy as _f03_np

_F03_C = 299792458.0
_F03_FL1 = 1575.42e6
_F03_LAM = _F03_C / _F03_FL1          # L1 の波長 [m]（19.03 cm）
_F03_RC = 1.023e6                     # C/A 符号のチップレート [チップ/s]
_F03_TC = 1.0 / _F03_RC               # 1 チップの時間 [s]
_F03_KB = 1.380649e-23                # ボルツマン定数 [J/K]
_F03_T0 = 290.0                       # 基準の温度 [K]
_F03_RE = 6371e3                      # 地球の半径 [m]（1 章と同じ）
_F03_A = 26560e3                      # GPS の軌道の半径 [m]（1 章と同じ）
_F03_CMIN = -128.5                    # 地上での L1 C/A の受信電力の最小値 [dBm]（規格の −158.5 dBW）
_F03_LATM = 0.5                       # 大気による損失 [dB]（例の値）


def _f03_dB(x):
    return 10.0 * math.log10(x)


def _f03_range(el):
    """仰角 el [°] の衛星までの距離 [m]（地球と軌道を円とした）。"""
    th = math.radians(el)
    return math.sqrt(_F03_A ** 2 - (_F03_RE * math.cos(th)) ** 2) - _F03_RE * math.sin(th)


def _f03_lfs(r):
    """自由空間損失 [dB]。"""
    return 20.0 * math.log10(4 * math.pi * r / _F03_LAM)


_F03_EIRP = _F03_CMIN - 30 + _f03_lfs(_f03_range(5.0)) + _F03_LATM   # 逆算した EIRP [dBW]（26.4 dBW）
_F03_N0 = _f03_dB(_F03_KB * _F03_T0) + 30                             # 290 K の熱雑音の密度 [dBm/Hz]（−174.0）
_F03_CN0 = _F03_CMIN - _F03_N0                                        # 45.5 dB-Hz


def _f03_ga(el):
    """例のアンテナの利得 [dBi]（真上で +3、30° で約 −1、5° で −5。例の値）。"""
    return 3.0 - 8.0 * ((90.0 - el) / 85.0) ** 2


def _f03_f(v, d=1):
    """小数 d 桁の数（負の符号は −）。"""
    s = ("%." + str(d) + "f") % v
    return s.replace("-", "−")


def _f03_g(v, d=0):
    """3 桁ごとに空白を入れた数。"""
    s = ("%." + str(d) + "f") % abs(v)
    ip, _, fp = s.partition(".")
    ip = "{:,}".format(int(ip)).replace(",", " ")
    return ("−" if v < 0 else "") + ip + ("." + fp if fp else "")


def _f03_m(v):
    """目盛の数（負の符号は −、余分な 0 を付けない）。"""
    if abs(v) < 1e-12:
        return "0"
    return ("%g" % v).replace("-", "−")


def _f03_sat(x, y, c=SIG, s=1.0):
    """衛星の印（1 章と同じ形）。"""
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f03_rx(x, y, c=GRN):
    """受信機の印（地面に置いたアンテナ。1 章と同じ形）。"""
    return W(x - 6, y + 6, x + 6, y + 6, c=c, lw=1.6) + W(x, y + 6, x, y, c=c, lw=1.4) + D(x, y - 1, c, 3.4)


_F03_PM = _f03_np.array(ca_pm(1), dtype=float)     # PRN 1 の C/A 符号（+1/−1）


def _f03_logticks(lo, hi):
    """1, 10, 100, … の目盛（lo〜hi）。"""
    out, k = [], math.floor(math.log10(lo))
    while 10 ** k <= hi * 1.0001:
        if 10 ** k >= lo * 0.9999:
            out.append(10 ** k)
        k += 1
    return out


def _f03_hz(v):
    """周波数の目盛の文字（1 Hz・1 k・1 M）。"""
    if v >= 1e6:
        return "%g M" % (v / 1e6)
    if v >= 1e3:
        return "%g k" % (v / 1e3)
    return "%g" % v


# =====================================================================
# 1 節: デシベル — 倍率と dB、dBm と W の目盛
# =====================================================================
def _f03_db_fig():
    o = []
    # (a) 倍率と dB
    o.append(T(14, 18, "(a) 倍率と dB", "start", 11.5, INK, True))
    x0, x1, d0, d1 = 34.0, 300.0, -10.0, 33.0
    X = lambda d: x0 + (x1 - x0) * (d - d0) / (d1 - d0)
    yr = 74
    o.append(T(x0 - 4, yr - 24, "倍率", "start", 9.5, SIG, True))
    o.append(T(x0 - 4, yr + 33, "dB", "start", 9.5, INK, True))
    o.append(W(X(d0), yr, X(d1), yr, c=MUT, lw=1.4))
    for r in (0.1, 0.5, 1, 2, 10, 100, 1000):
        d = _f03_dB(r)
        o.append(W(X(d), yr - 5, X(d), yr + 5, c=MUT, lw=1.2))
        o.append(T(X(d), yr - 10, "%g" % r, "middle", 9.5, SIG, True))
        o.append(T(X(d), yr + 18, _f03_m(d) if abs(d - round(d)) < 1e-9 else _f03_f(d), "middle", 9.5, INK))
    # 掛け算が足し算になる例
    ya = 150
    o.append(T(14, ya - 18, "例: 1000 倍の 2 倍は、30 dB + 3 dB", "start", 10, INK, True))
    o.append(ARR(X(0), ya, X(30), ya, c=GLD, lw=2.0, head=7))
    o.append(T((X(0) + X(30)) / 2, ya + 15, "× 1000（+30 dB）", "middle", 9.5, GLD, True))
    o.append(ARR(X(30), ya + 24, X(33), ya + 24, c=PUR, lw=2.0, head=6))
    o.append(T(X(33) - 4, ya + 40, "× 2（+3 dB）", "end", 9.5, PUR, True))
    o.append(W(X(0), ya - 6, X(0), ya + 30, c=FNT, lw=1, dash="2 2"))
    o.append(W(X(33), ya + 30, X(33), ya + 52, c=FNT, lw=1, dash="2 2"))
    o.append(DIM(X(0), ya + 56, X(33), ya + 56, None, c=INK))
    o.append(T((X(0) + X(33)) / 2, ya + 72, "合わせて × 2000 = %s dB" % _f03_m(round(_f03_dB(2000))), "middle", 10, INK, True))
    # (b) dBm・dBW・W の目盛
    xb = 340
    o.append(T(xb, 18, "(b) 電力の目盛（dBm・dBW・W）", "start", 11.5, INK, True))
    xa = 496
    Y = lambda v: 46 + (60 - v) * 1.28
    o.append(W(xa, Y(62), xa, Y(-136), c=MUT, lw=1.4))
    for v, s in ((60, "1 kW"), (30, "1 W"), (0, "1 mW"), (-30, "1 μW"), (-60, "1 nW"), (-90, "1 pW"), (-120, "1 fW")):
        o.append(W(xa - 4, Y(v), xa + 4, Y(v), c=MUT, lw=1.2))
        o.append(T(xa - 8, Y(v) + 3.5, "%s dBm = %s dBW（%s）" % (_f03_m(v), _f03_m(v - 30), s), "end", 9.5, MUT))
    eirp_dbm = _F03_EIRP + 30
    o.append(D(xa, Y(eirp_dbm), SIG, 4.6))
    o.append(T(xa + 10, Y(eirp_dbm) - 6, "衛星の送信の強さ（例）", "start", 9.5, SIG, True, halo=True))
    o.append(T(xa + 10, Y(eirp_dbm) + 8, "%s dBm = %s dBW" % (_f03_f(eirp_dbm), _f03_f(_F03_EIRP)), "start", 9.5, SIG, True, halo=True))
    o.append(T(xa + 10, Y(eirp_dbm) + 22, "（%d W）" % round(10 ** (_F03_EIRP / 10), -1), "start", 9.5, SIG, False, halo=True))
    o.append(D(xa, Y(_F03_CMIN), SIG, 4.6))
    cw = 10 ** ((_F03_CMIN - 30) / 10)
    ce = math.floor(math.log10(cw))
    o.append(T(xa + 10, Y(_F03_CMIN) - 20, "地上で受ける L1 C/A", "start", 9.5, SIG, True, halo=True))
    o.append(T(xa + 10, Y(_F03_CMIN) - 6, "%s dBm = %s dBW" % (_f03_f(_F03_CMIN), _f03_f(_F03_CMIN - 30)), "start", 9.5, SIG, True, halo=True))
    o.append(TX(xa + 10, Y(_F03_CMIN) + 8, "（%.2f × 10^{−%d} W）" % (cw / 10 ** ce, -ce), "start", 9.5, SIG, False, True))
    xr = 684
    o.append(ARR(xr, Y(eirp_dbm) + 8, xr, Y(_F03_CMIN) - 8, c=ALI, lw=1.8, head=7))
    o.append(T(xr - 6, Y(-30) - 4, "%s dB" % _f03_f(eirp_dbm - _F03_CMIN), "end", 10, ALI, True, halo=True))
    o.append(T(xr - 6, Y(-30) + 10, "小さくなる", "end", 9.5, ALI, True, halo=True))
    o.append(TX(xr - 6, Y(-30) + 24, "（約 %.0f × 10^{18} 分の 1）" % (10 ** ((eirp_dbm - _F03_CMIN) / 10) / 1e18), "end", 9.5, ALI, False, True))
    return SVG(700, 316, o, "デシベル（(b) の 2 つの点は、1 節の後半で求める衛星の送信の強さの例の値と、規格が定める受信電力の最小値）。")
F["e03_db"] = _f03_db_fig()


# =====================================================================
# 1 節: 広がって薄まる — 衛星と受信機の配置、仰角と自由空間損失
# =====================================================================
def _f03_sci(v, d=1):
    """1.4 × 10^{−16} の形（TX 用）。"""
    e = math.floor(math.log10(abs(v)))
    m = v / 10 ** e
    if float(("%." + str(d) + "f") % m) >= 10:
        m /= 10
        e += 1
    return ("%." + str(d) + "f × 10^{%s}") % (m, _f03_m(e))


def _f03_spread_fig():
    o = []
    o.append(T(14, 18, "(a) 距離 r の球の面に広がる", "start", 11.5, INK, True))
    sc = 128.0 / _F03_A
    ox, oy = 168.0, 214.0
    o.append(CIRC(ox, oy, _F03_A * sc, c=SIG, lw=1.1, dash="5 4"))
    o.append(CIRC(ox, oy, _F03_RE * sc, c=GRN, lw=1.4, fill=GSOFT))
    o.append(T(ox, oy + 5, "地球", "middle", 9.5, GRN, True))
    rxx, rxy = ox, oy - _F03_RE * sc
    # 真上の衛星
    sz = (ox, oy - _F03_A * sc)
    # 仰角 5° の衛星（右の向き）
    r5 = _f03_range(5.0)
    s5 = (rxx + r5 * sc * math.cos(math.radians(5)), rxy - r5 * sc * math.sin(math.radians(5)))
    # 真上の衛星を中心に広がる球の面（下半分の弧）
    r90 = _f03_range(90.0)
    for frac in (0.35, 0.68, 1.0):
        rr = r90 * sc * frac
        pts = [(sz[0] + rr * math.sin(a), sz[1] + rr * math.cos(a)) for a in _f03_np.linspace(-0.9, 0.9, 60)]
        o.append(PL(pts, c=SIG, lw=1.0 if frac < 1 else 1.4, dash="3 3" if frac < 1 else None))
    o.append(W(sz[0], sz[1], rxx, rxy, c=GLD, lw=1.6))
    o.append(W(s5[0], s5[1], rxx, rxy, c=GLD, lw=1.6))
    o.append(_f03_sat(sz[0], sz[1], SIG, 1.0))
    o.append(_f03_sat(s5[0], s5[1], SIG, 1.0))
    o.append(_f03_rx(rxx, rxy - 6, GRN))
    o.append(T(sz[0] + 18, sz[1] + 4, "真上の衛星", "start", 9.5, SIG, True, halo=True))
    o.append(T((sz[0] + rxx) / 2 - 6, (sz[1] + rxy) / 2 + 22, "r = %s km" % _f03_g(r90 / 1e3), "end", 9.5, GLD, True, halo=True))
    o.append(T(s5[0] + 2, s5[1] - 12, "仰角 5° の衛星", "middle", 9.5, SIG, True, halo=True))
    o.append(T((s5[0] + rxx) / 2 + 14, (s5[1] + rxy) / 2 + 18, "r = %s km" % _f03_g(r5 / 1e3), "start", 9.5, GLD, True, halo=True))
    o.append(T(rxx - 10, rxy - 2, "受信機", "end", 9.5, GRN, True, halo=True))
    o.append(TX(ox + 24, sz[1] + 62, "面積 4πr^2", "start", 9.5, SIG, True, True))
    # (b) 仰角と自由空間損失
    xb = 392
    o.append(T(xb, 18, "(b) 衛星の仰角と自由空間損失", "start", 11.5, INK, True))
    p = Plot(xb + 50, 44, 240, 170, (0, 90), (182, 185))
    o.append(p.axes(xl="仰角 θ [°]", yl="自由空間損失 L_{fs} [dB]", xt=[0, 15, 30, 45, 60, 75, 90], yt=[182, 183, 184, 185], xfmt=_f03_m, yfmt=_f03_m))
    els = _f03_np.linspace(0, 90, 181)
    o.append(p.line([(e, _f03_lfs(_f03_range(e))) for e in els], c=ALI, lw=2.2))
    for e, dx, dy, a in ((90, -6, -10, "end"), (30, 6, -8, "start"), (5, 8, 18, "start"), (0, 8, -8, "start")):
        L = _f03_lfs(_f03_range(e))
        o.append(D(p.X(e), p.Y(L), ALI, 3.8))
        o.append(T(p.X(e) + dx, p.Y(L) + dy, "%s km・%s dB" % (_f03_g(_f03_range(e) / 1e3), _f03_f(L)), a, 9, ALI, True, halo=True))
    ae = _F03_LAM ** 2 / (4 * math.pi)
    o.append(T(xb + 8, 272, "0 dBi のアンテナが受け止める面積", "start", 9.5, INK, True))
    o.append(TX(xb + 8, 288, "λ^2/(4π) = %s cm²（%s cm 角）" % (_f03_f(ae * 1e4), _f03_f(math.sqrt(ae) * 100)), "start", 9.5, INK))
    o.append(RECT(xb + 232, 260, 30, 30, 1, GOSOFT, GLD, 1.2))
    o.append(T(xb + 247, 304, "%s cm" % _f03_f(math.sqrt(ae) * 100), "middle", 9, GLD))
    # (c) 受信電力の計算（仰角 5°）
    yc = 376
    o.append(T(14, yc - 14, "(c) 受信電力の計算（仰角 5° の衛星、0 dBi のアンテナ）", "start", 11.5, INK, True))
    ew = 10 ** (_F03_EIRP / 10)
    area = 4 * math.pi * r5 ** 2
    dens = ew / area
    cw = dens * ae
    bx = [(14, 150, SIG, "衛星の EIRP", "%d W（%s dBW）" % (round(ew, -1), _f03_f(_F03_EIRP))),
          (274, 170, GLD, "受信機の所の密度", "%s W/m²" % _f03_sci(dens)),
          (530, 156, SIG, "受信電力 C", "%s W（%s dBm）" % (_f03_sci(cw), _f03_f(_f03_dB(cw) + 30)))]
    for x, w, c, t1, t2 in bx:
        o.append(RECT(x, yc, w, 44, 7, soft(c), c, 1.3))
        o.append(T(x + w / 2, yc + 18, t1, "middle", 10, INK, True))
        o.append(TX(x + w / 2, yc + 34, t2, "middle", 9.5, INK))
    o.append(ARR(164, yc + 22, 272, yc + 22, c=MUT, lw=1.6))
    o.append(TX(218, yc + 14, "÷ 4πr^2", "middle", 9.5, INK, True))
    o.append(TX(218, yc + 38, "%s m²" % _f03_sci(area), "middle", 9, MUT))
    o.append(ARR(444, yc + 22, 528, yc + 22, c=MUT, lw=1.6))
    o.append(TX(486, yc + 14, "× λ^2/(4π)", "middle", 9.5, INK, True))
    o.append(T(486, yc + 38, "%s cm²" % _f03_f(ae * 1e4), "middle", 9, MUT))
    return SVG(700, yc + 54, o, "衛星から受信機まで（地球の半径 6 371 km、軌道の半径 26 560 km の円で計算。(a) は地球と軌道の大きさの比を実際のとおりに描いた。(c) は、1 節の後半で求める EIRP の例の値で、大気による損失を引く前の値）。")
F["e03_spread"] = _f03_spread_fig()


# =====================================================================
# 1 節: 回線計算 — EIRP から受信電力まで
# =====================================================================
def _f03_budget_fig():
    o = []
    o.append(T(14, 18, "(a) 回線計算（仰角 5°）: 各項目の後の電力", "start", 11.5, INK, True))
    p = Plot(76, 40, 300, 230, (0, 4), (-140, 70))
    o.append(p.axes(xl=None, yl="電力 [dBm]", xt=[], yt=[-140, -120, -100, -80, -60, -40, -20, 0, 20, 40, 60], xfmt=_f03_m, yfmt=_f03_m))
    e = _F03_EIRP + 30
    l5 = _f03_lfs(_f03_range(5))
    lv = [e, e - l5, e - l5 - _F03_LATM, e - l5 - _F03_LATM]
    names = [("衛星の EIRP", "+%s dBm" % _f03_f(e)), ("自由空間損失", "−%s dB" % _f03_f(l5)), ("大気", "−%s dB" % _f03_f(_F03_LATM)), ("受信アンテナ", "0 dBi")]
    for i in range(4):
        xa, xb_ = p.X(i + 0.18), p.X(i + 0.82)
        if i == 0:
            o.append(RECT(xa, p.Y(e), xb_ - xa, p.Y(-140) - p.Y(e), 2, SSOFT, SIG, 1.2))
        else:
            top, bot = lv[i - 1], lv[i]
            o.append(RECT(xa, p.Y(top), xb_ - xa, max(p.Y(bot) - p.Y(top), 1.2), 2, MSOFT, MUT, 1.2))
        if i < 3:
            o.append(W(xb_, p.Y(lv[i]), p.X(i + 1.18), p.Y(lv[i]), c=FNT, lw=1, dash="3 3"))
        o.append(T(p.X(i + 0.5), p.Y(-140) + 15, names[i][0], "middle", 9.5, INK, True))
        o.append(T(p.X(i + 0.5), p.Y(-140) + 29, names[i][1], "middle", 9.5, SIG if i == 0 else MUT, True))
    o.append(T(p.X(1.86), p.Y(-40), "−%s dB" % _f03_f(l5), "start", 10, MUT, True, halo=True))
    o.append(TX(p.X(1.86), p.Y(-40) + 14, "（10^{18} 分の 1 あまり）", "start", 9, MUT, False, True))
    o.append(W(p.X(3.82), p.Y(lv[3]), p.X(4), p.Y(lv[3]), c=SIG, lw=2.2))
    o.append(T(p.X(3.6), p.Y(lv[3]) - 8, "C = %s dBm（規格の最小値）" % _f03_f(lv[3]), "end", 10, SIG, True, halo=True))
    # 逆算の向き
    o.append(W(p.X(3.5), p.Y(lv[3]) - 22, p.X(3.5), p.Y(64), c=GLD, lw=1.6, dash="5 3"))
    o.append(ARR(p.X(3.5), p.Y(64), p.X(0.86), p.Y(64), c=GLD, lw=1.6, head=7, dash="5 3"))
    o.append(T(p.X(3.44), p.Y(36), "逆算して EIRP を決める", "end", 9.5, GLD, True, halo=True))
    # (b) 拡大: −124〜−131 dBm
    xb = 448
    o.append(T(xb - 20, 18, "(b) 受信電力の所を拡大", "start", 11.5, INK, True))
    q = Plot(xb + 40, 40, 200, 230, (0, 2), (-131, -124))
    o.append(RECT(q.x, q.Y(-125), q.w, q.Y(-130) - q.Y(-125), 0, GSOFT, "none", 0, op=0.8))
    o.append(q.axes(xl=None, yl="電力 [dBm]", xt=[], yt=[-131, -130, -129, -128, -127, -126, -125, -124], xfmt=_f03_m, yfmt=_f03_m))
    o.append(T(q.x + q.w - 4, q.Y(-125) + 12, "実際の受信電力の代表値", "end", 9, GRN, True, halo=True))
    o.append(T(q.x + q.w - 4, q.Y(-125) + 24, "（−125〜−130 dBm）", "end", 9, GRN, False, halo=True))
    for k, (el, lab) in enumerate(((5, "仰角 5°"), (90, "真上"))):
        L = _f03_lfs(_f03_range(el))
        a1 = e - L
        a2 = a1 - _F03_LATM
        xm = q.X(0.5 + k)
        o.append(W(xm - 34, q.Y(a1), xm + 34, q.Y(a1), c=MUT, lw=1.3, dash="4 3"))
        o.append(W(xm - 34, q.Y(a2), xm + 34, q.Y(a2), c=SIG, lw=2.4))
        o.append(T(xm, q.Y(a2) + 15, "%s dBm" % _f03_f(a2), "middle", 9.5, SIG, True, halo=True))
        o.append(T(xm, q.Y(-131) + 15, lab, "middle", 9.5, INK, True))
        o.append(T(q.x - 54, q.Y(-131) + 34 + 15 * k, "%s: %s − %s − %s + 0 = %s dBm" % (lab, _f03_f(e), _f03_f(L), _f03_f(_F03_LATM), _f03_f(a2)), "start", 9.5, INK))
    o.append(T(q.X(0.5) + 36, q.Y(e - l5) - 3, "大気の前", "start", 9, MUT, False, halo=True))
    return SVG(700, 330, o, "回線計算（受信アンテナは 0 dBi、大気による損失は 0.5 dB、衛星はどの向きにも同じ EIRP で出すとした。どれも計算のための仮定）。")
F["e03_budget"] = _f03_budget_fig()


# =====================================================================
# 2 節: 熱雑音の電力と帯域の幅
# =====================================================================
def _f03_ktb_fig():
    o = []
    # (a) 雑音の帯域幅: 実際のフィルタと、同じ電力を通す理想のフィルタ
    o.append(T(14, 18, "(a) 雑音の帯域幅", "start", 11.5, INK, True))
    a = Plot(46, 44, 200, 150, (-3, 3), (0, 1.25))
    o.append(a.axes(xl="周波数", yl="電力を通す割合", xt=[], yt=[0, 0.5, 1], xfmt=_f03_m, yfmt=_f03_m))
    bn = math.pi / math.sqrt(2)          # |H|² = 1/(1 + x⁴) の面積（= 同じ電力を通す長方形の幅）
    xs = _f03_np.linspace(-3, 3, 241)
    area = a.line([(x, 1 / (1 + x ** 4)) for x in xs], c=TEA, lw=2.2)
    o.append(PL([(a.X(-3), a.Y(0))] + [(a.X(x), a.Y(1 / (1 + x ** 4))) for x in xs] + [(a.X(3), a.Y(0))], c="none", lw=0, fill=TSOFT, op=0.8))
    o.append(RECT(a.X(-bn / 2), a.Y(1), a.X(bn / 2) - a.X(-bn / 2), a.Y(0) - a.Y(1), 0, "none", GLD, 2.0, dash="6 3"))
    o.append(area)
    o.append(DIM(a.X(-bn / 2), a.Y(1.12), a.X(bn / 2), a.Y(1.12), None, c=GLD))
    o.append(TX(a.X(0), a.Y(1.12) - 5, "B_n", "middle", 10, GLD, True, True))
    o.append(LEGL(14, 232, [(TEA, None, "実際のフィルタ")], 9.5, 10))
    o.append(LEGL(14, 250, [(GLD, "6 3", "理想のフィルタ（面積が同じ）")], 9.5, 10))
    # (b) 熱雑音の電力と帯域の幅
    xb = 290
    o.append(T(xb, 18, "(b) 熱雑音の電力（290 K）と信号の電力", "start", 11.5, INK, True))
    p = Plot(xb + 56, 44, 330, 210, (1, 1e8), (-180, -90), xlog=True)
    xt = _f03_logticks(1, 1e8)
    bc = 10 ** ((_F03_CMIN - _F03_N0) / 10)
    o.append(RECT(p.X(bc), p.y, p.x + p.w - p.X(bc), p.h, 0, TSOFT, "none", 0, op=0.55))
    o.append(p.axes(xl="雑音の帯域幅 B_n [Hz]", yl="電力 [dBm]", xt=xt, yt=[-180, -170, -160, -150, -140, -130, -120, -110, -100, -90],
                    xfmt=lambda v: {1: "1", 10: "10", 100: "100", 1e3: "1 k", 1e4: "10 k", 1e5: "100 k", 1e6: "1 M", 1e7: "10 M", 1e8: "100 M"}[v], yfmt=_f03_m))
    bs = _f03_np.logspace(0, 8, 200)
    o.append(p.line([(b, _F03_N0 + 10 * math.log10(b)) for b in bs], c=TEA, lw=2.4))
    o.append(p.line([(1, _F03_CMIN), (1e8, _F03_CMIN)], c=SIG, lw=2.2))
    o.append(T(p.X(1.5), p.Y(_F03_CMIN) - 6, "信号 C = %s dBm" % _f03_f(_F03_CMIN), "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(30), p.Y(_F03_N0 + 10 * math.log10(30)) + 22, "熱雑音 N = k_B T_0 B_n", "start", 9.5, TEA, True, True))
    for b, lab, dx, dy, an in ((1, "1 Hz: %s", 10, 6, "start"), (1e3, "1 kHz: %s", 8, 12, "start"), (2e6, "2 MHz: %s", -8, -7, "end"), (2e7, "20 MHz: %s", -8, -7, "end")):
        v = _F03_N0 + 10 * math.log10(b)
        o.append(D(p.X(b), p.Y(v), TEA, 4))
        o.append(T(p.X(b) + dx, p.Y(v) + dy, lab % _f03_f(v), an, 9.5, TEA, True, halo=True))
    o.append(D(p.X(bc), p.Y(_F03_CMIN), INK, 4))
    o.append(T(p.X(bc) - 6, p.Y(_F03_CMIN) + 16, "%d kHz で等しい" % round(bc / 1e3), "end", 9.5, INK, True, halo=True))
    o.append(T(p.x + p.w - 4, p.y + p.h - 8, "雑音のほうが大きい範囲", "end", 9.5, TEA, True, halo=True))
    n2 = _F03_N0 + 10 * math.log10(2e6)
    o.append(DIM(p.X(2e6) + 10, p.Y(n2), p.X(2e6) + 10, p.Y(_F03_CMIN), None, c=ALI))
    o.append(T(p.X(2e6) + 16, p.Y((n2 + _F03_CMIN) / 2) + 2, "%s dB" % _f03_f(n2 - _F03_CMIN), "start", 10, ALI, True, halo=True))
    o.append(T(p.X(2e6) + 16, p.Y((n2 + _F03_CMIN) / 2) + 15, "（約 %d 倍）" % round(10 ** ((n2 - _F03_CMIN) / 10)), "start", 9, ALI, False, halo=True))
    return SVG(700, 300, o, "雑音の帯域幅と、熱雑音の電力（(b) の信号は 1 節の受信電力で、全体の電力を描いた。2 MHz の帯域に入るのは、その 90 % で、0.4 dB 少ない）。")
F["e03_ktb"] = _f03_ktb_fig()


# =====================================================================
# 2 節: 雑音の床と、その下に埋もれた信号
# =====================================================================
def _f03_bandwave(n=8192, K=64, bw=2e6, fif_chips=4, seed=5):
    """中間周波数に下げた L1 C/A の信号と熱雑音を、幅 bw の帯域に通した波形（雑音の標準偏差を 1 にする）。"""
    fs = K * _F03_RC
    t = _f03_np.arange(n) / fs
    code = _F03_PM[(_f03_np.floor(t * _F03_RC).astype(int)) % 1023]
    fif = fif_chips * _F03_RC
    s = math.sqrt(2.0) * code * _f03_np.cos(2 * math.pi * fif * t)       # 電力 1 の信号
    w = _f03_np.random.default_rng(seed).standard_normal(n)
    f = _f03_np.fft.rfftfreq(n, 1.0 / fs)
    m = _f03_np.abs(f - fif) < bw / 2
    sb = _f03_np.fft.irfft(_f03_np.fft.rfft(s) * m, n)
    wb = _f03_np.fft.irfft(_f03_np.fft.rfft(w) * m, n)
    wb = wb / wb.std()
    cn = 10 ** ((_F03_CMIN - (_F03_N0 + 10 * math.log10(bw))) / 10)       # 帯域の中の C/N（全体の電力で）
    return t * _F03_RC, sb * math.sqrt(cn), wb, s * math.sqrt(cn)


def _f03_floor_fig():
    o = []
    o.append(T(14, 18, "(a) 電力スペクトル密度（L1 のまわり）", "start", 11.5, INK, True))
    p = Plot(78, 40, 270, 200, (-4, 4), (-200, -165))
    o.append(RECT(p.X(-1), p.y, p.X(1) - p.X(-1), p.h, 0, MSOFT, "none", 0, op=0.7))
    o.append(RECT(p.x, p.Y(_F03_N0), p.w, p.Y(-200) - p.Y(_F03_N0), 0, TSOFT, "none", 0, op=0.8))
    o.append(p.axes(xl="周波数 f − f_{L1} [MHz]", yl="電力スペクトル密度 [dBm/Hz]", xt=[-4, -2, 0, 2, 4], yt=[-200, -195, -190, -185, -180, -175, -170, -165], xfmt=_f03_m, yfmt=_f03_m))
    o.append(p.line([(-4, _F03_N0), (4, _F03_N0)], c=TEA, lw=2.4))
    fs = _f03_np.linspace(-4, 4, 1601)
    vals = []
    for f in fs:
        sv = float(_f03_np.sinc(f / 1.023)) ** 2
        vals.append((f, _F03_CMIN + 10 * math.log10(_F03_TC) + 10 * math.log10(max(sv, 1e-12))))
    o.append(p.clip(vals, c=SIG, lw=2.0))
    pk = _F03_CMIN + 10 * math.log10(_F03_TC)
    o.append(TX(p.X(4) - 4, p.Y(_F03_N0) - 6, "雑音の床 N_0 = %s" % _f03_f(_F03_N0), "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(0.25), p.Y(pk) - 8, "信号の山 %s" % _f03_f(pk), "start", 9.5, SIG, True, halo=True))
    o.append(DIM(p.X(-0.35), p.Y(_F03_N0), p.X(-0.35), p.Y(pk), None, c=ALI))
    o.append(T(p.X(-0.45), p.Y((pk + _F03_N0) / 2) + 4, "%s dB" % _f03_f(_F03_N0 - pk), "end", 9.5, ALI, True, halo=True))
    o.append(TX(14, 296, "信号の山 C T_c: %s + (%s) = %s dBm/Hz" % (_f03_f(_F03_CMIN), _f03_f(_f03_dB(_F03_TC)), _f03_f(pk)), "start", 9.5, SIG))
    o.append(T(p.X(0), p.y + 12, "受ける帯域 2 MHz", "middle", 9, MUT, True, halo=True))
    # (b) 波形
    xb = 410
    o.append(T(xb - 6, 18, "(b) 2 MHz の帯域を通した波形", "start", 11.5, INK, True))
    x, sb, wb, s0 = _f03_bandwave()
    i0, i1 = 64 * 60, 64 * 66
    q = Plot(xb + 36, 40, 236, 150, (60, 66), (-4, 4))
    o.append(q.axes(xl=None, yl="値（雑音の標準偏差 = 1）", xt=[60, 61, 62, 63, 64, 65, 66], yt=[-4, -2, 0, 2, 4], xfmt=lambda v: "", yfmt=_f03_m))
    o.append(q.line([(x[i], wb[i] + sb[i]) for i in range(i0, i1 + 1)], c=TEA, lw=1.0))
    o.append(q.line([(x[i], sb[i]) for i in range(i0, i1 + 1)], c=SIG, lw=2.0))
    o.append(T(q.x + q.w, q.y - 6, "青: 信号だけ　青緑: 信号 + 雑音", "end", 9, MUT))
    # 信号を 10 倍に拡大
    r = Plot(xb + 36, 214, 236, 46, (60, 66), (-3.2, 3.2))
    o.append(RECT(r.x, r.y, r.w, r.h, 2, SCR, LIN, 0.8))
    o.append(r.line([(x[i], 10 * sb[i]) for i in range(i0, i1 + 1)], c=SIG, lw=1.4))
    amp = math.sqrt(2 * 10 ** ((_F03_CMIN - _F03_N0 - 10 * math.log10(2e6)) / 10))
    o.append(T(r.x, r.y - 5, "信号を 10 倍に拡大（振幅は雑音の標準偏差の %s 倍）" % _f03_f(amp, 2), "start", 9, SIG, True))
    for k in range(60, 67):
        o.append(T(r.X(k), r.y + r.h + 14, "%d" % k, "middle", 9, MUT))
    o.append(T(r.x + r.w / 2, r.y + r.h + 30, "時間 [チップ]（表示のため搬送波を 4.092 MHz に下げた）", "middle", 9.5, MUT))
    return SVG(700, 310, o, "雑音の床と、その下の信号（受信電力 −128.5 dBm、290 K の熱雑音。(b) は 1 チップに 64 標本の計算で、縦は雑音の標準偏差を 1 とした値）。")
F["e03_floor"] = _f03_floor_fig()


# =====================================================================
# 3 節: 帯域の中の SN 比と C/N0
# =====================================================================
def _f03_cn0bw_fig():
    o = []
    p = Plot(86, 24, 540, 230, (1, 1e8), (-40, 50), xlog=True)
    xt = _f03_logticks(1, 1e8)
    o.append(p.axes(xl="帯域幅 B_n [Hz]", yl="帯域の中の SN 比 C/N [dB]", xt=xt, yt=[-40, -30, -20, -10, 0, 10, 20, 30, 40, 50],
                    xfmt=lambda v: {1: "1", 10: "10", 100: "100", 1e3: "1 k", 1e4: "10 k", 1e5: "100 k", 1e6: "1 M", 1e7: "10 M", 1e8: "100 M"}[v], yfmt=_f03_m))
    o.append(p.line([(1, 0), (1e8, 0)], c=INK, lw=1.2))
    o.append(T(p.X(1e8) - 4, p.Y(0) - 6, "0 dB（信号と雑音が同じ電力）", "end", 9.5, INK, False, halo=True))
    bs = _f03_np.logspace(0, 8, 100)
    o.append(p.line([(b, _F03_CN0 - 10 - 10 * math.log10(b)) for b in bs], c=MUT, lw=1.6, dash="6 4"))
    o.append(p.line([(b, _F03_CN0 - 10 * math.log10(b)) for b in bs], c=SIG, lw=2.4))
    for b, lab, dx, dy, a in ((1, "1 Hz: 45.5 dB（= C/N0）", 8, 4, "start"), (1e3, "1 kHz: +15.5 dB", 8, -6, "start"),
                              (2e6, "2 MHz: −17.5 dB", 8, -8, "start"), (2e7, "20 MHz: −27.5 dB", 8, -8, "start")):
        v = _F03_CN0 - 10 * math.log10(b)
        o.append(D(p.X(b), p.Y(v), SIG, 4.2))
        o.append(T(p.X(b) + dx, p.Y(v) + dy, lab, a, 9.5, SIG, True, halo=True))
    o.append(LEGL(p.X(3e3), p.y + 18, [(SIG, None, "C/N0 = 45.5 dB-Hz"), (MUT, "6 4", "35.5 dB-Hz（10 dB 弱い信号）")], 9.5, 14))
    o.append(T(p.X(2e4), p.Y(_F03_CN0 - 10 * math.log10(2e4)) - 30, "幅が 10 倍になるごとに −10 dB", "start", 9.5, INK, False, halo=True))
    return SVG(700, 300, o, "帯域の中の SN 比と C/N0（実線は 1・2 節の値の信号。帯域が信号の電力を全部含むとして描いた）。")
F["e03_cn0bw"] = _f03_cn0bw_fig()


# =====================================================================
# 3 節: 仰角と C/N0、周りの様子
# =====================================================================
def _f03_cn0env_fig():
    o = []
    o.append(T(14, 18, "(a) 例のアンテナの利得", "start", 11.5, INK, True))
    els = _f03_np.linspace(0, 90, 181)
    p = Plot(70, 38, 260, 74, (0, 90), (-6, 4))
    o.append(p.axes(xl=None, yl=None, xt=[0, 30, 60, 90], yt=[-6, -3, 0, 3], xfmt=lambda v: "", yfmt=_f03_m))
    o.append(T(p.x - 34, p.y + p.h / 2 + 4, "[dBi]", "middle", 9.5, MUT))
    o.append(p.line([(e, _f03_ga(e)) for e in els], c=PUR, lw=2.2))
    o.append(T(p.X(88), p.Y(3) + 14, "真上 +3", "end", 9.5, PUR, True, halo=True))
    o.append(T(p.X(6), p.Y(-5) - 6, "5° で −5", "start", 9.5, PUR, True, halo=True))
    for e in (5, 30, 90):
        o.append(D(p.X(e), p.Y(_f03_ga(e)), PUR, 3.4))
    o.append(T(p.X(33), p.Y(_f03_ga(30)) + 13, "30° で %s" % _f03_m(round(_f03_ga(30))), "start", 9.5, PUR, True, halo=True))
    o.append(T(14, 142, "(b) C/N0（290 K の熱雑音だけ）", "start", 11.5, INK, True))
    q = Plot(70, 160, 260, 150, (0, 90), (36, 54))
    o.append(RECT(q.x, q.Y(50), q.w, q.Y(40) - q.Y(50), 0, GSOFT, "none", 0, op=0.8))
    o.append(q.axes(xl="仰角 θ [°]", yl="C/N0 [dB-Hz]", xt=[0, 15, 30, 45, 60, 75, 90], yt=[36, 40, 44, 48, 52], xfmt=_f03_m, yfmt=_f03_m))
    def cn0(e, g):
        return _F03_EIRP + 30 - _f03_lfs(_f03_range(e)) - _F03_LATM + g - _F03_N0
    o.append(q.line([(e, cn0(e, 0.0)) for e in els], c=MUT, lw=1.6, dash="6 4"))
    o.append(q.line([(e, cn0(e, _f03_ga(e))) for e in els], c=SIG, lw=2.4))
    for e in (5, 90):
        v = cn0(e, _f03_ga(e))
        o.append(D(q.X(e), q.Y(v), SIG, 4.2))
    o.append(T(q.X(88), q.Y(cn0(90, 3.0)) + 15, _f03_f(cn0(90, _f03_ga(90))), "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(7), q.Y(cn0(5, -5.0)) + 4, _f03_f(cn0(5, _f03_ga(5))), "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(2), q.Y(53), "破線: 0 dBi のアンテナ（距離の違いだけ）", "start", 9, MUT, False, halo=True))
    o.append(T(q.X(88), q.Y(40) - 6, "開けた空の代表値 40〜50 dB-Hz", "end", 9, GRN, True, halo=True))
    # (c) 周りの様子
    xc = 400
    o.append(T(xc, 18, "(c) 周りの様子による C/N0 の範囲（代表値）", "start", 11.5, INK, True))
    r = Plot(xc + 10, 60, 270, 190, (0, 55), (0, 3))
    o.append(r.axes(xl="C/N0 [dB-Hz]", yl=None, xt=[0, 10, 20, 30, 40, 50], yt=[], xfmt=_f03_m, yfmt=_f03_m))
    rows = [("開けた空", "弱まり 0 dB", 40, 50, GRN), ("木の葉の下", "葉で 3〜10 dB 弱まる", 30, 47, GLD), ("建物の中", "屋根・壁で 10〜30 dB 弱まる", 10, 40, ALI)]
    for k, (nm, sub, a, b, c) in enumerate(rows):
        y0 = r.Y(2.75 - k)
        o.append(RECT(r.X(a), y0, r.X(b) - r.X(a), 22, 4, soft(c), c, 1.4))
        o.append(T(r.X(a) - 6, y0 + 15, nm, "end", 10, c, True))
        o.append(T(r.x + 4, y0 + 38, "%s（%d〜%d dB-Hz）" % (sub, a, b), "start", 9, MUT))
    return SVG(700, 356, o, "仰角・周りの様子と C/N0（(a) のアンテナの利得は例の値。(b) は 1 節の EIRP を一定とし、雑音を 290 K の熱雑音だけとした計算。(c) の範囲は代表値）。")
F["e03_cn0env"] = _f03_cn0env_fig()


# =====================================================================
# 4 節: 逆拡散の前と後の電力スペクトル密度
# =====================================================================
def _f03_despread_fig():
    o = []
    o.append(T(14, 18, "(a) 逆拡散の前", "start", 11.5, INK, True))
    p = Plot(78, 40, 250, 200, (-3, 3), (-200, -140))
    o.append(RECT(p.x, p.Y(_F03_N0), p.w, p.Y(-200) - p.Y(_F03_N0), 0, TSOFT, "none", 0, op=0.8))
    o.append(p.axes(xl="周波数 f − f_{L1} [MHz]", yl="電力スペクトル密度 [dBm/Hz]", xt=[-3, -2, -1, 0, 1, 2, 3], yt=[-200, -190, -180, -170, -160, -150, -140], xfmt=_f03_m, yfmt=_f03_m))
    o.append(p.line([(-3, _F03_N0), (3, _F03_N0)], c=TEA, lw=2.4))
    fs = _f03_np.linspace(-3, 3, 1201)
    o.append(p.clip([(f, _F03_CMIN + 10 * math.log10(_F03_TC * max(float(_f03_np.sinc(f / 1.023)) ** 2, 1e-12))) for f in fs], c=SIG, lw=2.0))
    o.append(T(p.X(3) - 4, p.Y(_F03_N0) - 6, "雑音の床 −174.0", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(0), p.Y(-188.6) + 20, "信号 −188.6", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0), p.Y(-188.6) + 33, "（床の 14.6 dB 下）", "middle", 9, SIG, False, halo=True))
    o.append(T(p.X(0), p.y + 14, "電力 −128.5 dBm が約 2 MHz に広がる", "middle", 9, SIG, True, halo=True))
    # (b) 逆拡散の後
    xb = 384
    o.append(ARR(338, 140, 364, 140, c=INK, lw=1.8, head=7))
    o.append(T(351, 128, "同じ", "middle", 9, INK, True))
    o.append(T(351, 160, "符号", "middle", 9, INK, True))
    o.append(T(351, 172, "を掛ける", "middle", 9, INK, True))
    o.append(T(xb + 30, 18, "(b) 逆拡散の後（中心のまわりを拡大）", "start", 11.5, INK, True))
    q = Plot(xb + 44, 40, 250, 200, (-600, 600), (-200, -140))
    o.append(RECT(q.X(-500), q.y, q.X(500) - q.X(-500), q.h, 0, GOSOFT, "none", 0, op=0.7))
    o.append(RECT(q.x, q.Y(_F03_N0), q.w, q.Y(-200) - q.Y(_F03_N0), 0, TSOFT, "none", 0, op=0.8))
    o.append(q.axes(xl="周波数 f − f_{L1} [Hz]", yl=None, xt=[-600, -300, 0, 300, 600], yt=[-200, -190, -180, -170, -160, -150, -140], xfmt=_f03_m, yfmt=_f03_m))
    o.append(q.line([(-600, _F03_N0), (600, _F03_N0)], c=TEA, lw=2.4))
    fq = _f03_np.linspace(-600, 600, 2401)
    Tb = 0.02
    o.append(q.clip([(f, _F03_CMIN + 10 * math.log10(Tb * max(float(_f03_np.sinc(f * Tb)) ** 2, 1e-14))) for f in fq], c=SIG, lw=1.4))
    pk = _F03_CMIN + 10 * math.log10(Tb)
    o.append(T(q.X(70), q.Y(pk) + 4, "信号の山 −145.5", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(70), q.Y(pk) + 18, "（床の 28.5 dB 上）", "start", 9, SIG, False, halo=True))
    o.append(T(q.X(600) - 4, q.Y(_F03_N0) - 6, "雑音の床は同じ", "end", 9.5, TEA, True, halo=True))
    o.append(T(q.X(0), q.Y(-195), "例: 幅 1 kHz だけ取り出す", "middle", 9, GLD, True, halo=True))
    o.append(T(14, q.y + q.h + 52, "山の高さ: 前は C × 1 チップの時間（977.5 ns）、後は C × 1 bit の時間（20 ms）。比は %s 倍（%s dB）" % (_f03_g(Tb / _F03_TC), _f03_f(_f03_dB(Tb / _F03_TC))), "start", 9.5, INK))
    o.append(T(14, q.y + q.h + 68, "幅 1 kHz の中（金の範囲）: 雑音 %s + 30.0 = %s dBm、信号 %s dBm（SN 比 +%s dB）" % (_f03_f(_F03_N0), _f03_f(_F03_N0 + 30), _f03_f(_F03_CMIN), _f03_f(_F03_CMIN - _F03_N0 - 30)), "start", 9.5, INK))
    return SVG(700, 320, o, "逆拡散の前と後の電力スペクトル密度（C/N0 = 45.5 dB-Hz、受信電力 −128.5 dBm、290 K の熱雑音。データのビットは 20 ms ごとにでたらめに変わるとした）。")
F["e03_despread"] = _f03_despread_fig()


# =====================================================================
# 4 節: 足すと、信号は回数に比例し、雑音は平方根で増える
# =====================================================================
def _f03_sumwalk_fig():
    o = []
    q = 10 ** (_F03_CN0 / 10)
    sw = math.sqrt(_F03_RC / (2 * q))            # 1 チップの雑音の標準偏差（信号の部分 A = 1）
    rg = _f03_np.random.default_rng(12)
    a = _F03_PM
    W_ = sw * rg.standard_normal((6, 1023))
    dsp = (a[None, :] + W_) * a[None, :]          # 逆拡散した 1 チップの値（受けた値 × 手元の符号）
    o.append(T(14, 18, "(a) 逆拡散した 1 チップの値（最初の 40 チップ）", "start", 11.5, INK, True))
    p = Plot(62, 40, 262, 190, (0, 40), (-12, 12))
    o.append(RECT(p.x, p.Y(1 + sw), p.w, p.Y(1 - sw) - p.Y(1 + sw), 0, TSOFT, "none", 0, op=0.7))
    o.append(p.axes(xl="チップの番号 n", yl="値（信号の部分 A = 1）", xt=[0, 10, 20, 30, 40], yt=[-12, -8, -4, 0, 4, 8, 12], xfmt=_f03_m, yfmt=_f03_m))
    o.append(p.line([(0, 1), (40, 1)], c=SIG, lw=2.2))
    for n in range(40):
        o.append(D(p.X(n + 0.5), p.Y(dsp[0, n]), TEA, 2.6))
    o.append(T(p.X(40) - 4, p.Y(1) - 6, "信号の部分 A", "end", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(40) - 4, p.Y(1 + sw) - 5, "雑音の標準偏差 σ_w = %sA" % _f03_f(sw), "end", 9, TEA, True, True))
    # (b) 和
    xb = 392
    o.append(T(xb, 18, "(b) n チップの和（1 ms = 1023 チップまで）", "start", 11.5, INK, True))
    r = Plot(xb + 50, 40, 236, 190, (0, 1023), (-450, 1150))
    o.append(r.axes(xl="足したチップの数 n", yl="和", xt=[0, 256, 512, 768, 1023], yt=[-400, 0, 400, 800], xfmt=_f03_m, yfmt=_f03_m))
    ns = _f03_np.arange(1, 1024)
    env = sw * _f03_np.sqrt(ns)
    o.append(r.line([(n, e) for n, e in zip(ns, env)], c=TEA, lw=1.2, dash="4 3"))
    o.append(r.line([(n, -e) for n, e in zip(ns, env)], c=TEA, lw=1.2, dash="4 3"))
    for k in range(1, 6):
        cw = _f03_np.cumsum(W_[k] * a)
        o.append(r.line([(n, cw[n - 1]) for n in range(1, 1024, 4)], c=TEA, lw=0.8))
    o.append(r.line([(0, 0), (1023, 1023)], c=SIG, lw=2.4))
    tot = _f03_np.cumsum(dsp[0])
    o.append(r.line([(n, tot[n - 1]) for n in range(1, 1024, 3)], c=INK, lw=1.2))
    o.append(T(r.X(1023) - 4, r.Y(1023) - 8, "信号の和 nA → 1023A", "end", 9.5, SIG, True, halo=True))
    o.append(TX(r.X(12), r.Y(905), "破線: 雑音の和の ±1σ（±√n σ_w）", "start", 9, TEA, True, halo=True))
    o.append(T(r.X(12), r.Y(905) + 12, "1023 チップで ±%dA（信号はその %s 倍）" % (round(sw * math.sqrt(1023)), _f03_f(1023 / (sw * math.sqrt(1023)))), "start", 9, TEA, False, halo=True))
    o.append(T(r.X(330), r.Y(-330), "雑音だけの和（5 回の例）", "start", 9, TEA, False, halo=True))
    o.append(T(r.X(520), r.Y(430) - 10, "信号 + 雑音の和", "end", 9, INK, True, halo=True))
    return SVG(700, 280, o, "逆拡散した値を足した和（PRN 1 の 1023 チップ。搬送波の位相がそろった 1 つの成分。雑音の標準偏差は、C/N0 = 45.5 dB-Hz にあたる値）。")
F["e03_sumwalk"] = _f03_sumwalk_fig()


# =====================================================================
# 4 節: Y_I・Y_Q の計算の流れ
# =====================================================================
def _f03_mult(x, y, c=INK):
    """掛け算の印（4 章の相関器の図と同じ形）。"""
    return CIRC(x, y, 13, c=c, lw=1.5, fill=SCR) + W(x - 6, y - 6, x + 6, y + 6, c=c, lw=1.6) + W(x - 6, y + 6, x + 6, y - 6, c=c, lw=1.6)


def _f03_iq_fig():
    o = []
    ym, yI, yQ = 112, 62, 162
    o.append(RECT(14, ym - 24, 104, 48, 7, SSOFT, SIG, 1.4))
    o.append(T(66, ym - 4, "受けた標本", "middle", 10.5, INK, True))
    o.append(TX(66, ym + 13, "y[k]", "middle", 10.5, INK))
    xa, xs, xc, xk = 196, 262, 372, 470
    o.append(ARR(118, ym, xa - 13, ym, c=SIG, lw=1.6))
    o.append(_f03_mult(xa, ym))
    o.append(ARR(xa, ym + 52, xa, ym + 14, c=GLD, lw=1.5))
    o.append(T(xa, ym + 66, "手元の符号", "middle", 9.5, GLD, True))
    o.append(TX(xa, ym + 81, "a[k]（逆拡散）", "middle", 9.5, GLD))
    o.append(W(xa + 13, ym, xs, ym, c=SIG, lw=1.6))
    o.append(W(xs, yI, xs, yQ, c=SIG, lw=1.6))
    o.append(D(xs, ym, SIG, 3.2))
    for yy, tr, nm, up in ((yI, "2cos（手元の搬送波）", "Y_I", True), (yQ, "2sin（手元の搬送波）", "Y_Q", False)):
        o.append(ARR(xs, yy, xc - 13, yy, c=SIG, lw=1.6))
        o.append(_f03_mult(xc, yy))
        if up:
            o.append(ARR(xc, yy - 34, xc, yy - 14, c=GLD, lw=1.5))
            o.append(TX(xc, yy - 40, tr, "middle", 9.5, GLD, True))
        else:
            o.append(ARR(xc, yy + 34, xc, yy + 14, c=GLD, lw=1.5))
            o.append(TX(xc, yy + 48, tr, "middle", 9.5, GLD, True))
        o.append(ARR(xc + 13, yy, xk, yy, c=SIG, lw=1.6))
        o.append(RECT(xk, yy - 22, 112, 44, 7, PAN, PUR, 1.3))
        o.append(T(xk + 56, yy - 3, "J 個を足して", "middle", 9.5, INK, True))
        o.append(T(xk + 56, yy + 12, "J で割る", "middle", 9.5, INK, True))
        o.append(ARR(xk + 112, yy, 634, yy, c=SIG, lw=1.6))
        o.append(TX(642, yy + 4, nm, "start", 11.5, SIG, True))
    o.append(T(xc, ym - 5, "sin は、cos を", "middle", 9, GLD, False, halo=True))
    o.append(T(xc, ym + 9, "90° ずらしたもの", "middle", 9, GLD, False, halo=True))
    o.append(TX(xk + 56, ym + 4, "積分の時間 T_{coh}", "middle", 9.5, PUR, True, True))
    return SVG(700, 222, o, "Y<sub>I</sub> と Y<sub>Q</sub> の計算の流れ（k は標本の番号、J は積分の時間の中の標本の数。式は、この後の導出に書く）。")
F["e03_iq"] = _f03_iq_fig()


# =====================================================================
# 4 節: 相関の後の SN 比 — Y_I・Y_Q の散らばりと、式とシミュレーション
# =====================================================================
# 中間周波数の実数の標本（1 チップ 8 標本）に雑音を足したシミュレーションの結果（sim_snr2.py）。
# (C/N0 [dB-Hz], T_coh [ms], 測った SNR [dB], 測った SNR_I [dB])
_F03_SNRPTS = [(45.0, 1.0, 15.02, 18.06), (45.0, 2.0, 18.08, 21.04), (45.0, 5.0, 21.88, 24.93), (45.0, 10.0, 25.12, 28.17), (45.0, 20.0, 28.05, 31.16),
               (35.0, 1.0, 5.11, 8.09), (35.0, 2.0, 8.07, 11.09), (35.0, 5.0, 11.91, 14.97), (35.0, 10.0, 14.97, 17.82), (35.0, 20.0, 17.91, 20.86)]


def _f03_snr_fig():
    o = []
    o.append(TX(14, 18, "(a) Y_I と Y_Q（C/N0 = 35 dB-Hz、位相の差 30°）", "start", 11.5, INK, True))
    p = Plot(64, 42, 232, 232, (-1.6, 1.6), (-1.6, 1.6))
    o.append(p.axes(xl="Y_I（信号の振幅 √(2C) = 1）", yl="Y_Q", xt=[-1.5, -1, -0.5, 0, 0.5, 1, 1.5], yt=[-1.5, -1, -0.5, 0, 0.5, 1, 1.5], xfmt=_f03_m, yfmt=_f03_m))
    o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(p.line([(math.cos(t), math.sin(t)) for t in _f03_np.linspace(0, 2 * math.pi, 181)], c=FNT, lw=1.2, dash="4 3"))
    q = 10 ** (35.0 / 10)
    sw = math.sqrt(_F03_RC / (2 * q))
    rg = _f03_np.random.default_rng(21)
    ph = math.radians(30)
    sx, sy = math.cos(ph), -math.sin(ph)
    for M, c, n in ((1, TEA, 160), (4, PUR, 160), (20, SIG, 160)):
        Nc = 1023 * M
        # 1 チップごとの 2 つの成分の雑音を足して平均する（信号の部分は振幅 1）
        wi = sw * rg.standard_normal((n, Nc)).mean(axis=1)
        wq = sw * rg.standard_normal((n, Nc)).mean(axis=1)
        for i in range(n):
            o.append(D(p.X(sx + wi[i]), p.Y(sy + wq[i]), c, 1.7))
    o.append(D(p.X(sx), p.Y(sy), INK, 4.2))
    o.append(W(p.X(0), p.Y(0), p.X(sx), p.Y(sy), c=INK, lw=1.6))
    o.append(T(p.X(-1.5), p.Y(1.42), "半径 √(2C) の円", "start", 9, MUT, False, halo=True))
    o.append(TX(p.X(-1.5), p.Y(-1.45), "散らばりは 1/√T_{coh} に比例", "start", 9, MUT, False, True))
    o.append(LEGL(p.x, p.y + p.h + 48, [(TEA, None, "1 ms"), (PUR, None, "4 ms"), (SIG, None, "20 ms")], 9.5, 14))
    # (b) SNR と T_coh
    xb = 390
    o.append(T(xb, 18, "(b) 相関の後の SN 比と積分の時間", "start", 11.5, INK, True))
    r = Plot(xb + 46, 42, 240, 232, (1, 20), (0, 36), xlog=True)
    o.append(r.axes(xl="積分の時間 T_{coh} [ms]", yl="SN 比 [dB]", xt=[1, 2, 5, 10, 20], yt=[0, 5, 10, 15, 20, 25, 30, 35], xfmt=_f03_m, yfmt=_f03_m))
    ts = _f03_np.logspace(0, math.log10(20), 50)
    for cn0, c in ((45.0, SIG), (35.0, GRN)):
        o.append(r.line([(t, cn0 + 10 * math.log10(t * 1e-3)) for t in ts], c=c, lw=2.2))
        o.append(r.line([(t, cn0 + 10 * math.log10(2 * t * 1e-3)) for t in ts], c=c, lw=1.4, dash="5 3"))
    for cn0, T_, a_, b_ in _F03_SNRPTS:
        c = SIG if cn0 == 45.0 else GRN
        o.append(CIRC(r.X(T_), r.Y(a_), 3.6, c=c, lw=1.6, fill=SCR))
        o.append(RECT(r.X(T_) - 3.2, r.Y(b_) - 3.2, 6.4, 6.4, 0.5, SCR, c, 1.4))
    o.append(T(r.X(1.08), r.Y(16.6), "45 dB-Hz", "start", 9.5, SIG, True, halo=True))
    o.append(T(r.X(1.08), r.Y(6.6), "35 dB-Hz", "start", 9.5, GRN, True, halo=True))
    o.append(LEGL(r.x - 30, r.y + r.h + 48, [(INK, None, "SNR = (C/N_0) T_{coh}"), (INK, "5 3", "SNR_I（2 倍）")], 9.5, 12))
    o.append(TX(r.x + r.w, r.y + r.h + 64, "○・□: シミュレーション（SNR・SNR_I）", "end", 9, MUT))
    return SVG(700, 358, o, "相関の後の SN 比（(a) は、Y<sub>I</sub>・Y<sub>Q</sub> の計算を 160 回ずつ繰り返した点。線の先の点は、雑音が無いときの値。(b) のシミュレーションは、搬送波を 2.046 MHz に下げた実数の標本を 1 チップに 8 つとり、片側の密度 N<sub>0</sub> の白色雑音を足して、2500〜4000 回計算した）。")
F["e03_snr"] = _f03_snr_fig()


# =====================================================================
# 4 節: 処理利得 — SN 比が段階ごとにどう変わるか
# =====================================================================
def _f03_gain_fig():
    o = []
    X0, X1, v0, v1 = 262.0, 676.0, -20.0, 32.0
    X = lambda v: X0 + (X1 - X0) * (v - v0) / (v1 - v0)
    top, dy = 46, 34
    cn = _F03_CN0
    s_bw = cn - _f03_dB(2e6)
    s_c = cn + _f03_dB(_F03_TC)
    s_1 = cn + _f03_dB(1e-3)
    s_20 = cn + _f03_dB(20e-3)
    for v in range(-20, 31, 10):
        o.append(W(X(v), top - 12, X(v), top + 4 * dy - 8, c=GRD, lw=1))
        o.append(T(X(v), top + 4 * dy + 6, _f03_m(v), "middle", 9.5, MUT))
    o.append(W(X(0), top - 12, X(0), top + 4 * dy - 8, c=INK, lw=1.2))
    o.append(T(X(0), top - 18, "0 dB（信号と雑音が同じ電力）", "middle", 9.5, INK, False))
    o.append(T((X0 + X1) / 2, top + 4 * dy + 22, "SN 比 [dB]", "middle", 10, MUT))
    rows = [("2 MHz の帯域の SN 比（2 節）", s_bw, MUT, None),
            ("1 チップだけ足した SNR", s_c, TEA, None),
            ("1 ms 足した SNR（窓の幅 1 kHz）", s_1, SIG, "処理利得 +%s dB（%s 倍）" % (_f03_f(s_1 - s_c), _f03_g(1e-3 / _F03_TC))),
            ("20 ms 足した SNR（窓の幅 50 Hz）", s_20, SIG, "処理利得 +%s dB（%s 倍）" % (_f03_f(s_20 - s_c), _f03_g(20e-3 / _F03_TC)))]
    for k, (nm, v, c, lab) in enumerate(rows):
        y = top + k * dy
        o.append(T(X0 - 10, y + 4, nm, "end", 9.5, INK, True))
        if lab:
            o.append(ARR(X(s_c), y, X(v) - 7, y, c=GLD, lw=1.8, head=7))
            o.append(D(X(s_c), y, TEA, 2.6))
            o.append(T((X(s_c) + X(v)) / 2, y - 7, lab, "middle", 9.5, GLD, True, halo=True))
        o.append(D(X(v), y, c, 4.6))
        o.append(T(X(v) + (9 if k != 3 else -9), y + (15 if lab else 4), ("+" if v > 0 else "") + _f03_f(v), "start" if k != 3 else "end", 9.5, c, True, halo=True))
    o.append(W(X(s_c), top + dy, X(s_c), top + 3 * dy, c=TEA, lw=1, dash="3 3"))
    yb = top + 4 * dy + 42
    o.append(TX(14, yb, "1 チップの SNR は、信号の密度の山 C T_c と雑音の床 N_0 の比（2 節の %s dB）" % _f03_f(_F03_N0 - (_F03_CMIN + _f03_dB(_F03_TC))), "start", 9.5, TEA))
    o.append(T(14, yb + 16, "2 MHz の帯域の SN 比から 1 ms の SNR までは +%s dB（帯域の比 2 MHz ÷ 1 kHz = 2000 倍）" % _f03_f(s_1 - s_bw), "start", 9.5, MUT))
    return SVG(700, yb + 26, o, "逆拡散と積分による SN 比の変化（C/N0 = 45.5 dB-Hz。SNR は 2 つの成分で数えた値）。")
F["e03_gain"] = _f03_gain_fig()


# =====================================================================
# 4 節: コヒーレント積分を続けられる長さ — 1 ms ごとの値を足していく様子
# =====================================================================
def _f03_cohlimit_fig():
    o = []
    L = 6.5
    cases = [("(a) 位相がそろっている", [0.0] * 20, "和の大きさ 1.00（0 dB）", GRN),
             ("(b) 10 ms でビットが反転", [0.0] * 10 + [180.0] * 10, "和の大きさ 0", ALI),
             ("(c) 周波数のずれ 50 Hz", [18.0 * k for k in range(20)], "1 回転して、和はほぼ 0", ALI),
             ("(d) 周波数のずれ 25 Hz", [9.0 * k for k in range(20)], "半回転で %s 倍（%s dB）" % (_f03_f(2 / math.pi, 2), _f03_f(20 * math.log10(2 / math.pi))), GLD)]
    for i, (ttl, ph, res, c) in enumerate(cases):
        x0 = 8 + i * 173
        o.append(T(x0 + 4, 18, ttl, "start", 10.5, INK, True))
        ox, oy = x0 + 20, 104
        if i == 2:
            ox, oy = x0 + 64, 118
        if i == 3:
            ox, oy = x0 + 40, 128
        o.append(W(ox - 8, oy, ox + 150, oy, c=GRD, lw=1))
        x, y = ox, oy
        for k, a in enumerate(ph):
            dx, dy = L * math.cos(math.radians(a)), -L * math.sin(math.radians(a))
            yo = 6 if (i == 1 and k >= 10) else 0
            o.append(ARR(x, y + yo, x + dx, y + dy + yo, c=TEA, lw=1.2, head=4))
            x, y = x + dx, y + dy
        if abs(x - ox) + abs(y - oy) > 1:
            o.append(ARR(ox, oy, x, y, c=c, lw=2.4, head=8))
        o.append(D(ox, oy, INK, 3))
        o.append(T(x0 + 82, 172, res, "middle", 9.5, c, True))
        # 下: 足す値の位相と時間
        p = Plot(x0 + 30, 194, 128, 46, (0, 20), (0, 360))
        o.append(p.axes(xl=None, yl=None, xt=[0, 10, 20], yt=[0, 180, 360], xfmt=_f03_m, yfmt=lambda v: "%d°" % v, sz=9))
        o.append(p.steps([(k, ph[k]) for k in range(20)] + [(20, ph[-1])], c=TEA, lw=1.8))
    o.append(T(14, 266, "上の段: 1 ms ごとの値（青緑の矢印）を順に足した和（太い矢印）。下の段: 足す値の位相と時間 [ms]", "start", 9.5, MUT))
    return SVG(700, 278, o, "コヒーレント積分を続けられる長さ（積分の時間 20 ms を、1 ms ずつ足していく様子。雑音は省いた。和の大きさは、(a) を 1 とした値）。")
F["e03_cohlimit"] = _f03_cohlimit_fig()


# =====================================================================
# 5 節: 雑音指数の定義 — 増幅器の入力と出力の信号と雑音
# =====================================================================
def _f03_fdef_fig():
    o = []
    Y = lambda v: 196 - v * 1.7
    xl0, xl1, xr0, xr1 = 196, 262, 438, 504
    sin_, nin, g, add = 30.0, 0.0, 38.0, 7.0
    # 増幅器
    o.append(BOX(300, 20, 100, 44, "増幅器", "利得 G₁", SIG, PAN, sz=11, ssz=9.5))
    o.append(T((xl0 + xl1) / 2, 46, "入力", "middle", 10.5, INK, True))
    o.append(T((xr0 + xr1) / 2, 46, "出力", "middle", 10.5, INK, True))
    o.append(ARR(xl1 + 6, 42, 298, 42, c=MUT, lw=1.5))
    o.append(ARR(402, 42, xr0 - 6, 42, c=MUT, lw=1.5))
    # 信号
    o.append(W(xl0, Y(sin_), xl1, Y(sin_), c=SIG, lw=2.6))
    o.append(W(xr0, Y(sin_ + g), xr1, Y(sin_ + g), c=SIG, lw=2.6))
    o.append(W(xl1, Y(sin_), xr0, Y(sin_ + g), c=SIG, lw=1.1, dash="4 3"))
    o.append(TX(xl0 - 8, Y(sin_) + 4, "信号 C", "end", 10, SIG, True))
    o.append(TX(xr1 + 8, Y(sin_ + g) + 4, "信号 G_1 C", "start", 10, SIG, True))
    # 雑音
    o.append(W(xl0, Y(nin), xl1, Y(nin), c=TEA, lw=2.6))
    o.append(W(xr0, Y(nin + g), xr1, Y(nin + g), c=TEA, lw=1.6, dash="5 3"))
    o.append(W(xl1, Y(nin), xr0, Y(nin + g), c=TEA, lw=1.1, dash="4 3"))
    o.append(RECT(xr0, Y(nin + g + add), xr1 - xr0, Y(nin + g) - Y(nin + g + add), 0, ASOFT, "none", 0))
    o.append(W(xr0, Y(nin + g + add), xr1, Y(nin + g + add), c=ALI, lw=2.6))
    o.append(TX(xl0 - 8, Y(nin) + 4, "雑音 k_B T_0 B_n", "end", 10, TEA, True))
    o.append(TX(xr1 + 8, Y(nin + g + add) - 1, "雑音 G_1 k_B T_0 B_n + N_{add}", "start", 10, ALI, True))
    o.append(TX(xr1 + 8, Y(nin + g) + 12, "増幅された入力の雑音 G_1 k_B T_0 B_n", "start", 9, TEA))
    o.append(T((xl1 + xr0) / 2, Y((sin_ + nin + g) / 2) + 2, "どちらも G₁ 倍", "middle", 9.5, MUT, False, halo=True))
    # SN 比
    o.append(DIM(xl0 + 20, Y(sin_) + 3, xl0 + 20, Y(nin) - 3, None, c=INK))
    o.append(T(xl0 + 28, Y((sin_ + nin) / 2) + 4, "入力の SN 比", "start", 9.5, INK, True, halo=True))
    o.append(DIM(xr0 + 20, Y(sin_ + g) + 3, xr0 + 20, Y(nin + g + add) - 3, None, c=INK))
    o.append(T(xr0 + 28, Y((sin_ + nin + add) / 2 + g) + 4, "出力の SN 比", "start", 9.5, INK, True, halo=True))
    o.append(T(350, 222, "雑音指数 F = 入力の SN 比 ÷ 出力の SN 比", "middle", 10, INK, True))
    return SVG(700, 232, o, "増幅器の入力と出力の、信号と雑音の電力（縦は電力を対数の目盛で描いた模式図。入力の雑音は 290 K の熱雑音）。")
F["e03_fdef"] = _f03_fdef_fig()


# =====================================================================
# 5 節: 雑音指数と雑音温度 — システム雑音温度と C/N0
# =====================================================================
def _f03_nf_fig():
    o = []
    o.append(T(14, 18, "(a) アンテナ 100 K と LNA のシステム雑音温度", "start", 11.5, INK, True))
    X = lambda k: 104 + k * 0.40
    yt0 = 40
    for k in (0, 100, 200, 300, 400):
        o.append(W(X(k), yt0 - 4, X(k), yt0 + 5 * 34 + 2, c=GRD, lw=1))
        o.append(T(X(k), yt0 + 5 * 34 + 16, "%d" % k, "middle", 9.5, MUT))
    o.append(T(X(200), yt0 + 5 * 34 + 32, "雑音温度 [K]", "middle", 10, MUT))
    for j, nf in enumerate((0.0, 0.5, 1.0, 2.0, 3.0)):
        y = yt0 + j * 34
        F_ = 10 ** (nf / 10)
        te = (F_ - 1) * _F03_T0
        ts = 100 + te
        cn0 = _F03_CMIN - (_f03_dB(_F03_KB * ts) + 30)
        o.append(T(X(0) - 8, y + 11, "NF %s dB" % _f03_m(nf), "end", 10, INK, True))
        o.append(T(X(0) - 8, y + 24, "F = %s" % _f03_f(F_, 3), "end", 9, MUT))
        o.append(RECT(X(0), y + 4, X(100) - X(0), 18, 2, TSOFT, TEA, 1.1))
        if te > 0:
            o.append(RECT(X(100), y + 4, X(ts) - X(100), 18, 2, ASOFT, ALI, 1.1))
        hl = nf == 1.0
        o.append(T(X(ts) + 6, y + 17, "100 + %s = %s K → %s dB-Hz" % (_f03_f(te), _f03_f(ts), _f03_f(cn0)), "start", 9.5, SIG if hl else INK, hl))
    ly = yt0 + 5 * 34 + 52
    o.append(RECT(X(0), ly - 9, 10, 10, 2, TSOFT, TEA, 1.1))
    o.append(TX(X(0) + 15, ly, "アンテナ T_ant", "start", 9.5, MUT))
    o.append(RECT(X(0) + 100, ly - 9, 10, 10, 2, ASOFT, ALI, 1.1))
    o.append(TX(X(0) + 115, ly, "LNA の T_e = (F − 1)T_0　→ の右は C/N0", "start", 9.5, MUT))
    # (b) C/N0 の下がり方
    xb = 490
    o.append(T(xb - 20, 18, "(b) LNA で C/N0 が下がる量", "start", 11.5, INK, True))
    p = Plot(xb + 26, 44, 164, 190, (0, 4), (0, 7))
    o.append(p.axes(xl="雑音指数 NF [dB]", yl="C/N0 が下がる量 [dB]", xt=[0, 1, 2, 3, 4], yt=[0, 1, 2, 3, 4, 5, 6, 7], xfmt=_f03_m, yfmt=_f03_m))
    nfs = _f03_np.linspace(0, 4, 81)
    drop = lambda v, ta: _f03_dB((ta + (10 ** (v / 10) - 1) * _F03_T0) / ta)
    o.append(p.line([(v, drop(v, _F03_T0)) for v in nfs], c=MUT, lw=1.8, dash="6 4"))
    o.append(p.line([(v, drop(v, 100.0)) for v in nfs], c=SIG, lw=2.4))
    o.append(D(p.X(1), p.Y(drop(1, _F03_T0)), MUT, 4))
    o.append(D(p.X(1), p.Y(drop(1, 100.0)), SIG, 4.4))
    o.append(T(p.X(1) + 7, p.Y(drop(1, 100.0)) + 2, "%s dB" % _f03_f(drop(1, 100.0)), "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1) + 7, p.Y(1) + 12, "%s dB" % _f03_f(drop(1, _F03_T0)), "start", 9.5, MUT, True, halo=True))
    o.append(TX(p.X(3.95), p.Y(6.4), "T_ant = 100 K", "end", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(3.95), p.Y(3.3) + 16, "T_ant = 290 K", "end", 9.5, MUT, True, halo=True))
    o.append(T(p.X(3.95), p.Y(3.3) + 29, "（= NF）", "end", 9, MUT, False, halo=True))
    # (c) NF 1 dB の計算の手順
    yc = 304
    o.append(T(14, yc - 12, "(c) NF 1 dB の LNA の計算（アンテナ 100 K、受信電力 −128.5 dBm）", "start", 11.5, INK, True))
    te = (10 ** 0.1 - 1) * _F03_T0
    ts = 100 + te
    n0 = _f03_dB(_F03_KB * ts) + 30
    steps = [("LNA の雑音温度 T_e", "(10^{0.1} − 1) × 290 = %s K" % _f03_f(te), ALI),
             ("システム雑音温度 T_{sys}", "100 + %s = %s K" % (_f03_f(te), _f03_f(ts)), INK),
             ("雑音の密度 N_0 = k_B T_{sys}", "%s dBm/Hz" % _f03_f(n0), TEA),
             ("C/N0 = C − N_0", "%s + %s = %s dB-Hz" % (_f03_f(_F03_CMIN), _f03_f(-n0), _f03_f(_F03_CMIN - n0)), SIG)]
    bw, gp = 160, 14
    for k, (t1, t2, c) in enumerate(steps):
        x = 9 + k * (bw + gp)
        o.append(RECT(x, yc, bw, 42, 6, soft(c), c, 1.2))
        o.append(TX(x + bw / 2, yc + 17, t1, "middle", 9.5, INK, True))
        o.append(TX(x + bw / 2, yc + 33, t2, "middle", 9.5, INK))
        if k < 3:
            o.append(ARR(x + bw + 1, yc + 21, x + bw + gp - 1, yc + 21, c=MUT, lw=1.5, head=5))
    return SVG(700, yc + 52, o, "雑音指数とシステム雑音温度、C/N0（アンテナの雑音温度 100 K は代表値。LNA の後の段の雑音は含めていない）。")
F["e03_nf"] = _f03_nf_fig()


# =====================================================================
# 5 節: アンテナと LNA の前後の信号と雑音の大きさ（レベル）
# =====================================================================
def _f03_level_fig():
    o = []
    yb = 30
    o.append(RECT(40, yb, 120, 44, 8, PAN, TEA, 1.4))
    o.append(T(100, yb + 19, "アンテナ", "middle", 11, INK, True))
    o.append(TX(100, yb + 35, "T_ant = 100 K", "middle", 9.5, MUT))
    o.append(ARR(160, yb + 22, 286, yb + 22, c=SIG, lw=1.8))
    o.append(BOX(286, yb, 140, 44, "LNA", "NF 1 dB・利得 18 dB", SIG, PAN, sz=11, ssz=9.5))
    o.append(ARR(426, yb + 22, 540, yb + 22, c=SIG, lw=1.8))
    o.append(BOX(540, yb, 130, 44, "後の段", "フリスの式は 9 章", MUT, PAN, sz=11, ssz=9.5, dash="5 3"))
    xa, xl = 224, 484
    for x, s in ((xa, "アンテナの出口"), (xl, "LNA の出口")):
        o.append(W(x, yb + 22, x, 352, c=FNT, lw=1, dash="3 3"))
        o.append(D(x, yb + 22, INK, 3.4))
        o.append(T(x, yb + 62, s, "middle", 9.5, INK, True, halo=True))
    def strip(y0, h, lo, hi, ttl, unit):
        Y = lambda v: y0 + h - (v - lo) / (hi - lo) * h
        o.append(TX(14, y0 - 8, ttl, "start", 10, INK, True))
        o.append(W(100, y0, 100, y0 + h, c=MUT, lw=1.2))
        v = math.ceil(lo / 5) * 5
        while v <= hi + 1e-9:
            o.append(W(96, Y(v), 100, Y(v), c=MUT, lw=1))
            o.append(W(100, Y(v), 680, Y(v), c=GRD, lw=1))
            o.append(T(92, Y(v) + 3.5, _f03_m(v), "end", 9, MUT))
            v += 5
        o.append(T(14, y0 + 14, unit, "start", 9, MUT))
        return Y
    Y1 = strip(128, 80, -130, -105, "信号の電力 C", "[dBm]")
    o.append(D(xa, Y1(-128.5), SIG, 4.6))
    o.append(D(xl, Y1(-110.5), SIG, 4.6))
    o.append(ARR(xa + 8, Y1(-128.5), xl - 8, Y1(-110.5), c=SIG, lw=1.6))
    o.append(T(xa - 8, Y1(-128.5) + 4, "−128.5", "end", 9.5, SIG, True, halo=True))
    o.append(T(xl + 8, Y1(-110.5) + 4, "−110.5（+18 dB）", "start", 9.5, SIG, True, halo=True))
    Y2 = strip(240, 100, -180, -155, "雑音の電力スペクトル密度 N_0", "[dBm/Hz]")
    na = _f03_dB(_F03_KB * 100) + 30
    nl = _f03_dB(_F03_KB * 75.1) + 30 + 18
    nt = _f03_dB(_F03_KB * 175.1) + 30 + 18
    o.append(D(xa, Y2(na), TEA, 4.6))
    o.append(T(xa - 8, Y2(na) + 4, "アンテナの雑音 %s" % _f03_f(na), "end", 9.5, TEA, True, halo=True))
    o.append(ARR(xa + 8, Y2(na), xl - 8, Y2(na + 18), c=TEA, lw=1.3, dash="4 3"))
    o.append(D(xl, Y2(na + 18), TEA, 4.2))
    o.append(T(xl - 8, Y2(na + 18) + 14, "アンテナの雑音 × 利得 %s" % _f03_f(na + 18), "end", 9, TEA, True, halo=True))
    o.append(D(xl + 10, Y2(nl), ALI, 4.2))
    o.append(T(xl + 18, Y2(nl) + 12, "LNA が足す雑音 %s" % _f03_f(nl), "start", 9, ALI, True, halo=True))
    o.append(D(xl, Y2(nt), INK, 4.6))
    o.append(T(xl + 8, Y2(nt) - 4, "合計 %s" % _f03_f(nt), "start", 9.5, INK, True, halo=True))
    o.append(T(xa, 370, "C/N0 = −128.5 − (%s) = %s dB-Hz" % (_f03_f(na), _f03_f(-128.5 - na)), "middle", 9.5, INK, True))
    o.append(T(xl, 370, "C/N0 = −110.5 − (%s) = %s dB-Hz" % (_f03_f(nt), _f03_f(-110.5 - nt)), "middle", 9.5, SIG, True))
    return SVG(700, 380, o, "アンテナと LNA の前後の、信号と雑音の大きさ（受信電力 −128.5 dBm、アンテナの雑音温度 100 K、LNA は雑音指数 1 dB・利得 18 dB。例の値）。")
F["e03_level"] = _f03_level_fig()


# =====================================================================
# 6 節: 捕捉 — 相関の電力と、最大の所が本当のずれに来る割合
# =====================================================================
# 1023 通りのずれ（1 チップごと）で、最大が本当のずれに来る割合（SNR の関数）。sim_points.py の結果（各 3000 回）
_F03_ACQ = [(4.0, 0.086), (4.5, 0.105), (5.0, 0.14), (5.5, 0.169), (6.0, 0.19), (6.5, 0.236), (7.0, 0.302), (7.5, 0.369), (8.0, 0.422),
            (8.5, 0.51), (9.0, 0.585), (9.5, 0.681), (10.0, 0.783), (10.5, 0.823), (11.0, 0.888), (11.5, 0.938), (12.0, 0.96), (12.5, 0.979),
            (13.0, 0.992), (13.5, 0.998), (14.0, 1.0), (14.5, 0.999), (15.0, 1.0), (15.5, 1.0), (16.0, 1.0)]


def _f03_corrpow(cn0, M, seed, d0=300):
    """チップ単位の 2 つの成分の受信信号（振幅 1）を M 周期足して相関をとり、電力 ÷ 雑音の平均の電力を返す。"""
    q = 10 ** (cn0 / 10)
    sw = math.sqrt(_F03_RC / (2 * q)) / math.sqrt(M)
    rg = _f03_np.random.default_rng(seed)
    x = _f03_np.roll(_F03_PM, d0) * _f03_np.exp(1j * 0.9) + sw * (rg.standard_normal(1023) + 1j * rg.standard_normal(1023))
    R = _f03_np.fft.ifft(_f03_np.fft.fft(x) * _f03_np.conj(_f03_np.fft.fft(_F03_PM))) / 1023.0
    P = _f03_np.abs(R) ** 2
    pn = 2 * sw ** 2 / 1023.0
    return P / pn


def _f03_acq_fig():
    o = []
    o.append(T(14, 18, "(a) 1 ms の積分の相関の電力（1 回の例。本当のずれは 300 チップ）", "start", 11.5, INK, True))
    rows = [(45.5, 1), (40.0, 1), (36.0, 1)]
    for k, (cn0, seed) in enumerate(rows):
        P = _f03_corrpow(cn0, 1, seed)
        y0 = 40 + k * 86
        top = max(40.0, float(P.max()) * 1.12)
        p = Plot(70, y0, 300, 56, (0, 1023), (0, top))
        o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 0.8))
        d = []
        for n in range(1023):
            d.append("M%.1f,%.1fV%.1f" % (p.X(n), p.Y(0), p.Y(P[n])))
        o.append(PATH("".join(d), c=TEA, lw=0.8))
        o.append(W(p.X(300), p.y, p.X(300), p.y + p.h, c=SIG, lw=1, dash="3 3"))
        im = int(P.argmax())
        ok = im == 300
        o.append(D(p.X(im), p.Y(P[im]), GRN if ok else ALI, 4.2))
        snr = cn0 - 30.0
        o.append(T(p.x - 6, p.y + 14, "%s" % _f03_f(cn0), "end", 10, INK, True))
        o.append(T(p.x - 6, p.y + 27, "dB-Hz", "end", 9, MUT))
        o.append(T(p.x - 6, p.y + 41, "SNR %s" % _f03_f(snr), "end", 9, MUT))
        lab = "最大 = 本当のずれ（見つかる）" if ok else "最大が別のずれ（%d チップ）で見誤る" % im
        o.append(T(p.x + p.w, p.y - 4, lab, "end", 9.5, GRN if ok else ALI, True))
        o.append(T(p.x + p.w + 6, p.Y(top * 0.75) + 4, "最大 %s" % _f03_f(float(P.max()), 0), "start", 9, MUT))
    o.append(T(70 + 150, 40 + 2 * 86 + 74, "ずれ [チップ]（縦は、相関の電力 ÷ 雑音の平均の電力）", "middle", 9.5, MUT))
    # (b) 見つかる割合
    xb = 430
    o.append(T(xb, 18, "(b) 最大の所が本当のずれに来る割合", "start", 11.5, INK, True))
    q = Plot(xb + 40, 44, 214, 196, (20, 50), (0, 1))
    o.append(q.axes(xl="C/N0 [dB-Hz]", yl="割合", xt=[20, 25, 30, 35, 40, 45, 50], yt=[0, 0.25, 0.5, 0.75, 0.9, 1.0], xfmt=_f03_m, yfmt=_f03_m))
    o.append(W(q.x, q.Y(0.9), q.x + q.w, q.Y(0.9), c=MUT, lw=1, dash="4 3"))
    for M, c, lab in ((1, TEA, "1 ms"), (10, PUR, "10 ms"), (20, SIG, "20 ms")):
        sh = 10 * math.log10(M * 1e-3)
        pts = [(s - sh, pp) for s, pp in _F03_ACQ if 20 <= s - sh <= 50]
        o.append(q.line(pts, c=c, lw=2.2))
        x90 = _f03_np.interp(0.9, [b for a, b in _F03_ACQ], [a for a, b in _F03_ACQ]) - sh
        o.append(D(q.X(x90), q.Y(0.9), c, 4))
        o.append(T(q.X(x90), q.Y(0.9) - 8, "%s" % _f03_f(x90, 0), "middle", 9.5, c, True, halo=True))
        if M == 20:
            xl_ = _f03_np.interp(0.3, [b for a, b in _F03_ACQ], [a for a, b in _F03_ACQ]) - sh
            o.append(T(q.X(xl_) - 6, q.Y(0.3) + 4, lab, "end", 9.5, c, True, halo=True))
        else:
            xl_ = _f03_np.interp(0.6 if M == 10 else 0.3, [b for a, b in _F03_ACQ], [a for a, b in _F03_ACQ]) - sh
            o.append(T(q.X(xl_) + 6, q.Y(0.6 if M == 10 else 0.3) + 4, lab, "start", 9.5, c, True, halo=True))
    xs_ = [b for a, b in _F03_ACQ]
    ys_ = [a for a, b in _F03_ACQ]
    o.append(T(q.x + q.w, q.y + q.h + 46, "SNR %s dB で 50 %%、%s dB で 90 %%" % (_f03_f(_f03_np.interp(0.5, xs_, ys_)), _f03_f(_f03_np.interp(0.9, xs_, ys_))), "end", 9.5, INK, True))
    return SVG(700, 318, o, "捕捉のシミュレーション（PRN 1、1 チップごとの 1023 通りのずれ、周波数のずれ 0。(a) の破線は本当のずれ。(b) は SNR を 0.5 dB 刻みにして、それぞれ 3000 回）。")
F["e03_acq"] = _f03_acq_fig()


# =====================================================================
# 6 節: データ — ビット誤り率とサブフレームを正しく読む確率
# =====================================================================
# 1 bit = 20 460 チップの和の符号で読むシミュレーション（sim_points.py）: (C/N0, 誤りの割合, ビットの数)
_F03_BERSIM = [(18.0, 0.05665, 20000), (20.0, 0.02255, 20000), (22.0, 0.006167, 30000), (24.0, 0.0006167, 60000)]


def _f03_Q(x):
    return 0.5 * math.erfc(x / math.sqrt(2))


def _f03_pb(cn0):
    return _f03_Q(math.sqrt(2 * 10 ** (cn0 / 10) * 0.02))


def _f03_ber_fig():
    o = []
    # (a) 1 bit の Y_I の分布（20 dB-Hz の例）
    cex = 20.0
    sd = 1 / math.sqrt(2 * 10 ** (cex / 10) * 0.02)
    o.append(TX(14, 18, "(a) 1 bit の Y_I の分布（C/N0 = %d dB-Hz の例）" % cex, "start", 11.5, INK, True))
    g = Plot(78, 36, 560, 96, (-2.6, 2.6), (0, 0.95))
    pdf = lambda x, m: math.exp(-0.5 * ((x - m) / sd) ** 2) / (sd * math.sqrt(2 * math.pi))
    o.append(W(g.x, g.Y(0), g.x + g.w, g.Y(0), c=MUT, lw=1.2))
    xs = _f03_np.linspace(-2.6, 2.6, 261)
    for m, c in ((-1, PUR), (1, SIG)):
        tail = [x for x in xs if (x <= 0 if m > 0 else x >= 0)]
        o.append(PL([(g.X(tail[0]), g.Y(0))] + [(g.X(x), g.Y(pdf(x, m))) for x in tail] + [(g.X(tail[-1]), g.Y(0))], c="none", lw=0, fill=ALI, op=0.55))
        o.append(g.line([(x, pdf(x, m)) for x in xs], c=c, lw=2.0))
        o.append(W(g.X(m), g.Y(0), g.X(m), g.Y(pdf(m, m)), c=c, lw=1, dash="3 3"))
        o.append(TX(g.X(m), g.Y(0) + 14, "−√(2C)" if m < 0 else "+√(2C)", "middle", 9.5, c, True))
        o.append(T(g.X(m * 2.0), g.Y(0.66), "ビットが %s のとき" % ("−1" if m < 0 else "+1"), "middle", 9.5, c, True))
    o.append(W(g.X(0), g.y, g.X(0), g.Y(0) + 4, c=INK, lw=1.2))
    o.append(T(g.X(0), g.Y(0) + 14, "0", "middle", 9.5, INK, True))
    o.append(T(g.X(0), g.y - 4, "正か負かで読む", "middle", 9, INK))
    o.append(DIM(g.X(1), g.Y(pdf(1 + sd, 1)), g.X(1 + sd), g.Y(pdf(1 + sd, 1)), None, c=SIG))
    o.append(TX(g.X(1 + sd) + 6, g.Y(pdf(1 + sd, 1)) + 4, "標準偏差 √(N_0/T_b)", "start", 9, SIG))
    o.append(TX(g.X(-2.55), g.Y(0) + 30, "赤い部分: 雑音で正負が逆になり、読み誤る。片方の面積が P_b = %s" % _f03_sci(_f03_pb(cex)), "start", 9.5, ALI, True))
    y0 = 186
    o.append(T(14, y0 + 2, "(b) ビット誤り率", "start", 11.5, INK, True))
    p = Plot(78, y0 + 24, 270, 190, (14, 34), (1e-10, 1), ylog=True)
    yt = [1, 1e-2, 1e-4, 1e-6, 1e-8, 1e-10]
    o.append(p.axes(xl=None, yl="ビット誤り率 P_b", xt=[14, 18, 22, 26, 30, 34], yt=yt, xfmt=_f03_m,
                    yfmt=lambda v: {1: "1", 1e-2: "10⁻²", 1e-4: "10⁻⁴", 1e-6: "10⁻⁶", 1e-8: "10⁻⁸", 1e-10: "10⁻¹⁰"}[v]))
    cs = _f03_np.linspace(14, 34, 201)
    o.append(p.clip([(c, max(_f03_pb(c), 1e-12)) for c in cs], c=SIG, lw=2.4))
    for c, pb, nb in _F03_BERSIM:
        o.append(CIRC(p.X(c), p.Y(pb), 3.8, c=ALI, lw=1.6, fill=SCR))
    lo, hi = 20.0, 30.0
    for _ in range(50):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if _f03_pb(mid) > 1e-5 else (lo, mid)
    c5 = lo
    o.append(W(p.X(c5), p.Y(1e-5), p.X(c5), p.Y(1e-10), c=MUT, lw=1, dash="3 3"))
    o.append(W(p.x, p.Y(1e-5), p.X(c5), p.Y(1e-5), c=MUT, lw=1, dash="3 3"))
    o.append(D(p.X(c5), p.Y(1e-5), SIG, 4.4))
    o.append(T(p.X(c5) + 6, p.Y(1e-5) - 4, "%s dB-Hz で 10⁻⁵" % _f03_f(c5), "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(c5) + 6, p.Y(1e-5) + 10, "（E_b/N_0 = %s dB）" % _f03_f(c5 + _f03_dB(0.02)), "start", 9, SIG, False, True))
    o.append(TX(p.X(15), p.Y(1e-8), "P_b = Q(√(2E_b/N_0))", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(15), p.Y(1e-8) + 14, "○: シミュレーション", "start", 9, ALI, False, halo=True))
    for c in (14, 18, 22, 26, 30, 34):
        o.append(T(p.X(c), p.y + p.h + 28, _f03_m(c - 17), "middle", 9, GLD))
    o.append(T(p.x - 8, p.y + p.h + 15, "C/N0", "end", 9, MUT))
    o.append(TX(p.x - 8, p.y + p.h + 28, "E_b/N_0", "end", 9, GLD))
    o.append(TX(p.x + p.w / 2, p.y + p.h + 44, "C/N0 [dB-Hz]、E_b/N_0 [dB] = C/N0 − 17.0", "middle", 9.5, MUT))
    # (c) サブフレーム
    xb = 430
    o.append(T(xb, y0 + 2, "(c) 300 bit を全部正しく読む確率", "start", 11.5, INK, True))
    q = Plot(xb + 40, y0 + 24, 214, 190, (16, 32), (0, 1))
    o.append(q.axes(xl="C/N0 [dB-Hz]", yl="確率", xt=[16, 20, 24, 28, 32], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], xfmt=_f03_m, yfmt=_f03_m))
    cs2 = _f03_np.linspace(16, 32, 161)
    o.append(q.line([(c, (1 - _f03_pb(c)) ** 300) for c in cs2], c=SIG, lw=2.4))
    for c, dx, dy, a in ((22, 8, 4, "start"), (25, 8, 14, "start"), (27, -8, -6, "end")):
        v = (1 - _f03_pb(c)) ** 300
        o.append(D(q.X(c), q.Y(v), SIG, 4.2))
        o.append(T(q.X(c) + dx, q.Y(v) + dy, "%d dB-Hz: %s" % (c, _f03_f(v, 3)), a, 9.5, SIG, True, halo=True))
    c_, pb_, nb_ = _F03_BERSIM[1]
    return SVG(700, y0 + 266, o, "データのビットを読み誤る割合（搬送波の位相が合い、1 bit = 20 ms とした。(a) の横軸は 1 bit の Y<sub>I</sub>。(b) の○は、1 bit を 20 460 チップの和として読んだシミュレーションで、%d dB-Hz では %s bit 中 %d bit を誤った）。" % (c_, _f03_g(nb_), round(pb_ * nb_)))
F["e03_ber"] = _f03_ber_fig()


# =====================================================================
# 6 節: 距離の雑音 — 頂点の位置のばらつきと C/N0
# =====================================================================
# 1 チップ 8 標本の符号に雑音を足し、2 点の相関から頂点を求めたシミュレーション（sim_sec6.py）: (C/N0, T [ms], ばらつき [チップ])
_F03_RNSIM = [(45.0, 1.0, 0.0892), (35.0, 1.0, 0.2803), (35.0, 20.0, 0.0639), (25.0, 20.0, 0.1926)]


def _f03_vertex_est(cn0, n, seed):
    """1 チップ 2 標本・1 ms で、τ ∓ 0.5 チップの 2 点の相関から頂点を求めた値（本当の頂点 0）を n 回。"""
    q = 10 ** (cn0 / 10)
    sw = math.sqrt(_F03_RC / (2 * q))
    rg = _f03_np.random.default_rng(seed)
    k = _f03_np.arange(2046)
    a = _F03_PM[k // 2]
    aE = _F03_PM[((k + 1) // 2) % 1023]
    aL = _F03_PM[((k - 1) // 2) % 1023]
    out = []
    for _ in range(n):
        r = a + math.sqrt(2) * sw * rg.standard_normal(2046)
        E = float(r @ aE) / 2046
        Lv = float(r @ aL) / 2046
        out.append(-(E - Lv) / 2.0)
    return out


def _f03_rangenoise_fig():
    o = []
    o.append(T(14, 18, "(a) 2 点の相関から頂点を求める（1 ms の 1 回の測定）", "start", 11.5, INK, True))
    p = Plot(64, 40, 280, 150, (-1.5, 1.5), (-0.25, 1.3))
    o.append(p.axes(xl=None, yl="相関（山 = 1）", xt=[-1.5, -1, -0.5, 0, 0.5, 1, 1.5], yt=[0, 0.5, 1], xfmt=lambda v: "", yfmt=_f03_m))
    ts = _f03_np.linspace(-1.5, 1.5, 301)
    o.append(p.line([(t, max(1 - abs(t), 0.0)) for t in ts], c=SIG, lw=2.2))
    sw35 = 1 / math.sqrt(2 * 10 ** 3.5 * 1e-3)
    for t in (-0.5, 0.5):
        o.append(W(p.X(t), p.Y(0.5 - sw35), p.X(t), p.Y(0.5 + sw35), c=GLD, lw=2.0))
        o.append(W(p.X(t) - 5, p.Y(0.5 - sw35), p.X(t) + 5, p.Y(0.5 - sw35), c=GLD, lw=1.6))
        o.append(W(p.X(t) - 5, p.Y(0.5 + sw35), p.X(t) + 5, p.Y(0.5 + sw35), c=GLD, lw=1.6))
        o.append(D(p.X(t), p.Y(0.5), GLD, 4))
    o.append(T(p.X(-0.5) - 8, p.Y(0.5 + sw35) + 2, "早い所", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.5) + 8, p.Y(0.5 + sw35) + 2, "遅い所", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.5) + 8, p.Y(0.72), "±1σ（35 dB-Hz）", "start", 9, GLD, False, halo=True))
    o.append(T(p.X(0), p.Y(1) - 6, "頂点", "middle", 9.5, SIG, True, halo=True))
    for k, (cn0, seed, c) in enumerate(((45.0, 2, SIG), (35.0, 5, GRN))):
        y = 212 + k * 22
        o.append(W(p.x, y, p.x + p.w, y, c=GRD, lw=1))
        for v in _f03_vertex_est(cn0, 40, seed):
            if -1.5 <= v <= 1.5:
                o.append(D(p.X(v), y, c, 2.6))
        sd = 1 / (2 * math.sqrt(10 ** (cn0 / 10) * 1e-3))
        o.append(T(p.x - 6, y + 4, "%d dB-Hz" % cn0, "end", 9.5, c, True))
        o.append(T(p.x + p.w + 6, y + 4, "σ = %s" % _f03_f(sd, 3), "start", 9, c, True))
    for t in (-1.5, -1, -0.5, 0, 0.5, 1, 1.5):
        o.append(T(p.X(t), 270, _f03_m(t), "middle", 9, MUT))
    o.append(T(p.X(0), 286, "求めた頂点の位置 [チップ]（40 回の測定）", "middle", 9.5, MUT))
    # (b) σ_ρ と C/N0
    xb = 420
    o.append(T(xb, 18, "(b) 擬似距離の雑音の標準偏差", "start", 11.5, INK, True))
    q = Plot(xb + 46, 40, 200, 200, (20, 50), (0.3, 300), ylog=True)
    o.append(q.axes(xl="C/N0 [dB-Hz]", yl="σ_ρ [m]", xt=[20, 25, 30, 35, 40, 45, 50], yt=[1, 10, 100], xfmt=_f03_m, yfmt=_f03_m))
    cm = _F03_C * _F03_TC
    cs = _f03_np.linspace(20, 50, 61)
    for Ta, c, lab, xl_, dy_ in ((1e-3, TEA, "1 ms", 22, 16), (20e-3, GLD, "20 ms", 28.5, -7), (1.0, SIG, "平均 1 s", 22, 16)):
        o.append(q.clip([(cv, cm / (2 * math.sqrt(10 ** (cv / 10) * Ta))) for cv in cs], c=c, lw=2.2))
        yv = cm / (2 * math.sqrt(10 ** (xl_ / 10) * Ta))
        o.append(T(q.X(xl_) + 2, q.Y(yv) + dy_, lab, "start", 9.5, c, True, halo=True))
    for cv, Tm, sdc in _F03_RNSIM:
        c = TEA if Tm == 1.0 else GLD
        o.append(CIRC(q.X(cv), q.Y(sdc * cm), 3.8, c=ALI, lw=1.6, fill=SCR))
    v1 = cm / (2 * math.sqrt(10 ** 4.5 * 1e-3))
    o.append(D(q.X(45), q.Y(v1), TEA, 4.2))
    o.append(T(q.X(45) + 5, q.Y(v1) - 7, "%s m" % _f03_f(v1), "middle", 9.5, TEA, True, halo=True))
    for cv in (45, 35):
        v = cm / (2 * math.sqrt(10 ** (cv / 10)))
        o.append(D(q.X(cv), q.Y(v), SIG, 4.2))
        o.append(T(q.X(cv) - 6, q.Y(v) + 13, "%s m" % _f03_f(v, 2), "end", 9.5, SIG, True, halo=True))
        o.append(W(q.X(cv), q.Y(v), q.X(48), q.Y(v), c=FNT, lw=1, dash="2 2"))
    v45, v35 = cm / (2 * math.sqrt(10 ** 4.5)), cm / (2 * math.sqrt(10 ** 3.5))
    o.append(DIM(q.X(48), q.Y(v45), q.X(48), q.Y(v35), None, c=INK))
    o.append(T(q.X(48) + 5, q.Y(math.sqrt(v45 * v35)) - 2, "× 3.16", "start", 9.5, INK, True, halo=True))
    o.append(T(q.X(48) + 5, q.Y(math.sqrt(v45 * v35)) + 11, "（10 dB）", "start", 9, INK, False, halo=True))
    o.append(TX(q.x + q.w, q.y + q.h + 46, "線: 式 cT_c/(2√((C/N0)T_{coh}))　○: シミュレーション", "end", 9, MUT))
    return SVG(700, 298, o, "距離の雑音（(a) は 1 ms の 1 回の測定を 40 回繰り返した例で、σ は式の値 [チップ]。(b) の○は、1 チップに 8 標本の PRN 1 の符号に雑音を足したシミュレーション。「平均 1 s」は、T<sub>coh</sub> を平均した時間 1 s に置き換えた値）。")
F["e03_rangenoise"] = _f03_rangenoise_fig()


# =====================================================================
# 6 節: C/N0 のしきい値の目安
# =====================================================================
def _f03_thresholds_fig():
    o = []
    X0, X1, c0, c1 = 236.0, 676.0, 5.0, 55.0
    X = lambda v: X0 + (X1 - X0) * (v - c0) / (c1 - c0)
    top = 44
    rows = [("env", "開けた空", 40, 50, GRN, "代表値"), ("env", "木の葉の下", 30, 47, GLD, "代表値"), ("env", "建物の中", 10, 40, ALI, "代表値"),
            ("sep",),
            ("calc", "擬似距離の雑音 1 m 以下（1 s の平均）", 43.3, None, SIG, "43.3"),
            ("calc", "捕捉（1 ms の積分、90 %）", 41.1, None, SIG, "41.1"),
            ("rep", "捕捉（ふつうの受信機）", 30, 35, PUR, "30〜35"),
            ("calc", "捕捉（20 ms の積分、90 %）", 28.1, None, SIG, "28.1"),
            ("calc", "データを読む（P_b = 10⁻⁵）", 26.6, None, SIG, "26.6"),
            ("rep", "搬送波の位相の追尾", 24, 26, PUR, "25 前後"),
            ("rep", "符号の遅れの追尾", 15, 20, PUR, "15〜20")]
    y = top
    o.append(T(14, 18, "C/N0 の範囲と、できることのしきい値（目安）", "start", 11.5, INK, True))
    for v in range(10, 56, 5):
        o.append(W(X(v), top - 6, X(v), top + 11 * 22 + 2, c=GRD, lw=1))
        o.append(T(X(v), top + 11 * 22 + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(T((X0 + X1) / 2, top + 11 * 22 + 32, "C/N0 [dB-Hz]", "middle", 10, MUT))
    for r in rows:
        if r[0] == "sep":
            o.append(W(14, y + 6, X1, y + 6, c=LIN, lw=1))
            o.append(T(14, y + 4, "周りの様子（代表値）", "start", 9, MUT))
            o.append(T(14, y + 20, "できること", "start", 9, MUT))
            y += 22
            continue
        kind, nm, a, b, c = r[0], r[1], r[2], r[3], r[4]
        o.append(TX(X0 - 8, y + 13, nm, "end", 9.5, c if kind != "calc" else INK, True))
        if kind == "env":
            o.append(RECT(X(a), y + 2, X(b) - X(a), 15, 3, soft(c), c, 1.2))
            o.append(T(X(b) + 5, y + 13, "%d〜%d" % (a, b), "start", 9, c))
        elif kind == "calc":
            o.append(RECT(X(a), y + 2, X1 - X(a), 15, 3, SSOFT, SIG, 1.2))
            o.append(W(X(a), y, X(a), y + 19, c=SIG, lw=2.4))
            o.append(T(X(a) + 5, y + 13, "%s（計算）" % r[5], "start", 9, SIG, True))
        else:
            o.append(RECT(X(a), y + 2, X(b) - X(a), 15, 0, PSOFT, "none", 0, op=0.6))
            o.append(RECT(X(b), y + 2, X1 - X(b), 15, 3, PSOFT, PUR, 1.2))
            o.append(T(X(b) + 5, y + 13, "%s（代表値）" % r[5], "start", 9, PUR, True))
        y += 22
    return SVG(700, top + 11 * 22 + 42, o, "C/N0 の範囲と、できることのしきい値の目安（青はこの章の計算、紫は代表値で、しきい値より右の側でできる。どの値も、積分の時間・追尾の仕組みの帯域・補助の情報の有無で変わる）。")
F["e03_thresholds"] = _f03_thresholds_fig()
