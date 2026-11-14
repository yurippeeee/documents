# -*- coding: utf-8 -*-
# 02 章 衛星の信号 — 搬送波・拡散符号・航法メッセージ の図
import numpy as _f02_np

_F02_C = 299792458.0            # 光の速さ [m/s]
_F02_F0 = 10.23e6               # 基準の周波数 [Hz]
_F02_RC = 1.023e6               # C/A 符号のチップレート [チップ/s]
_F02_TC = 1.0 / _F02_RC         # 1 チップの時間 [s]
# PRN 番号ごとの G2 の 2 つのタップ（IS-GPS-200 の表）
_F02_TAPS = {1: (2, 6), 2: (3, 7), 3: (4, 8), 4: (5, 9), 5: (1, 9), 6: (2, 10), 7: (1, 8), 8: (2, 9), 9: (3, 10), 10: (2, 3),
             11: (3, 4), 12: (5, 6), 13: (6, 7), 14: (7, 8), 15: (8, 9), 16: (9, 10), 17: (1, 4), 18: (2, 5), 19: (3, 6), 20: (4, 7),
             21: (5, 8), 22: (6, 9), 23: (1, 3), 24: (4, 6), 25: (5, 7), 26: (6, 8), 27: (7, 9), 28: (8, 10), 29: (1, 6), 30: (2, 7),
             31: (3, 8), 32: (4, 9)}
_F02_DELAY = {1: 5, 2: 6, 3: 7, 4: 8, 5: 17}   # G2 の遅れ [チップ]（規格の表。本文と図に使う分）
_F02_OCT = {1: "1440", 2: "1620", 3: "1710", 4: "1744", 5: "1133"}   # 最初の 10 チップの 8 進（規格の表。図に使う分）


def _f02_ca(prn, n=1023, states=False):
    """C/A 符号（0/1 の列）。G1・G2 は全部 1 から始め、出力 = G1[10] xor G2[a] xor G2[b]。states=True で各クロックの状態も返す。"""
    g1 = [1] * 10
    g2 = [1] * 10
    a, b = _F02_TAPS[prn]
    out, st = [], []
    for _ in range(n):
        if states:
            st.append((g1[:], g2[:]))
        out.append(g1[9] ^ g2[a - 1] ^ g2[b - 1])
        f1 = g1[2] ^ g1[9]
        f2 = g2[1] ^ g2[2] ^ g2[5] ^ g2[7] ^ g2[8] ^ g2[9]
        g1 = [f1] + g1[:9]
        g2 = [f2] + g2[:9]
    return (out, st) if states else out


_F02_CODES = {p: _f02_ca(p) for p in range(1, 33)}


def _f02_pm(prn):
    """0 → +1、1 → −1 に直した列（numpy）。"""
    return 1 - 2 * _f02_np.array(_F02_CODES[prn], dtype=int)


def _f02_circ(a, b):
    """周期的な相関 R(k) = Σ a[n] b[n − k]（k = 0 … N − 1）。"""
    A = _f02_np.fft.fft(a)
    B = _f02_np.fft.fft(b)
    return _f02_np.rint(_f02_np.real(_f02_np.fft.ifft(A * _f02_np.conj(B)))).astype(int)


def _f02_oct10(bits):
    return "%o" % int("".join(str(x) for x in bits[:10]), 2)


def _f02_fmt(v):
    if abs(v) < 1e-12:
        return "0"
    return ("%g" % v).replace("-", "−")


def _f02_g(v, d=0):
    """3 桁ごとに空白を入れた数。"""
    s = ("%." + str(d) + "f") % abs(v)
    ip, _, fp = s.partition(".")
    ip = "{:,}".format(int(ip)).replace(",", " ")
    return ("−" if v < 0 else "") + ip + ("." + fp if fp else "")


def _f02_sinc(x):
    return _f02_np.sinc(x)


def _f02_steps(p, vals, x0, w, c=SIG, lw=1.8):
    """±1 の値の列を、Plot p の上の階段の波形にする（1 つの値の幅 w、始まり x0。x は値の単位）。"""
    pts = []
    for i, v in enumerate(vals):
        xa, xb = x0 + i * w, x0 + (i + 1) * w
        if pts and pts[-1][1] != v:
            pts.append((xa, v))
        if not pts:
            pts.append((xa, v))
        pts.append((xb, v))
    return p.line(pts, c=c, lw=lw)


def _f02_wave(x0, ymid, amp, vals, cw, c=SIG, lw=1.8):
    """画面の座標で ±1 の階段の波形（x0 から 1 つの値を cw ずつ）。+1 が上。"""
    pts = []
    prev = None
    for i, v in enumerate(vals):
        y = ymid - amp * v
        xa = x0 + i * cw
        if prev is not None and prev != v:
            pts.append((xa, ymid - amp * prev))
        pts.append((xa, y))
        prev = v
    pts.append((x0 + len(vals) * cw, ymid - amp * prev))
    return PL(pts, c=c, lw=lw)


def _f02_xor(x, y, r=8, c=INK):
    """排他的論理和の記号（丸に十字）。"""
    return CIRC(x, y, r, c=c, lw=1.4, fill=SCR) + W(x - r, y, x + r, y, c=c, lw=1.2) + W(x, y - r, x, y + r, c=c, lw=1.2)


# =====================================================================
# 1 節: 1 つの 10.23 MHz から、周波数と速さを作る
# =====================================================================
def _f02_clocktree_fig():
    o = []
    o.append(T(14, 18, "衛星の中で、原子時計を基準にした 10.23 MHz から、周波数と速さを作る", "start", 11.5, INK, True))
    o.append(BOX(14, 112, 104, 50, "原子時計", "周波数の基準", SIG, SSOFT, sz=11, ssz=9.5))
    o.append(ARR(118, 137, 150, 137, c=SIG, lw=1.8))
    o.append(BOX(150, 114, 92, 46, "10.23 MHz", "基準の周波数", GLD, GOSOFT, sz=11, ssz=9.5))
    xb = 262
    rows = [
        (40, "× 154", "1575.42 MHz", "L1 の搬送波（1 周期 0.635 ns）", SIG),
        (70, "× 120", "1227.60 MHz", "L2 の搬送波", SIG),
        (100, "× 115", "1176.45 MHz", "L5 の搬送波", SIG),
        (142, "× 1", "10.23 M チップ/s", "L5 の符号のチップレート", TEA),
        (172, "÷ 10", "1.023 M チップ/s", "C/A 符号のチップレート（1 チップ 977.5 ns）", TEA),
        (214, "÷ 10 230", "1 kHz", "C/A 符号の周期（1 ms ごとに繰り返す）", PUR),
        (244, "÷ 204 600", "50 Hz", "航法メッセージのビット（1 bit 20 ms）", PUR),
    ]
    o.append(W(242, 137, xb, 137, c=GLD, lw=1.6))
    o.append(W(xb, rows[0][0], xb, rows[-1][0], c=GLD, lw=1.6))
    for y, op, val, desc, c in rows:
        o.append(ARR(xb, y, 350, y, c=c, lw=1.5, head=6))
        o.append(T(306, y - 5, op, "middle", 10, c, True, halo=True))
        o.append(T(358, y + 4, val, "start", 10.5, c, True))
        o.append(T(482, y + 4, desc, "start", 9.5, INK))
    o.append(T(358, 29, "搬送波", "start", 9.5, SIG, True))
    o.append(T(358, 129, "符号のチップレート", "start", 9.5, TEA, True))
    o.append(T(358, 201, "符号とデータの区切り", "start", 9.5, PUR, True))
    o.append(T(14, 196, "1 チップの間に L1 の搬送波は", "start", 9.5, MUT))
    o.append(T(14, 211, "1540 周期（154 × 10）、1 bit の", "start", 9.5, MUT))
    o.append(T(14, 226, "間に C/A 符号は 20 周期入る", "start", 9.5, MUT))
    return SVG(700, 258, o, "GPS の衛星が、10.23 MHz から作る周波数と速さ（規格の値）。")
F["e02_clocktree"] = _f02_clocktree_fig()


# =====================================================================
# 1 節: GPS の 3 つの搬送波（10.23 MHz の整数倍。周波数・波長・1 周期の時間）
# =====================================================================
def _f02_carriers_fig():
    o = []
    o.append(T(14, 18, "GPS の 3 つの搬送波: 10.23 MHz の整数倍", "start", 11.5, INK, True))
    rows = [(54, "L1", 154), (110, "L2", 120), (166, "L5", 115)]
    o.append(BOX(14, 85, 104, 50, "10.23 MHz", "基準の周波数", GLD, GOSOFT, sz=11, ssz=9.5))
    xb = 138
    o.append(W(118, 110, xb, 110, c=GLD, lw=1.6))
    o.append(W(xb, rows[0][0], xb, rows[-1][0], c=GLD, lw=1.6))
    k, xw = 10.0, 372      # 1 cm を 10 目盛の長さに描く
    for y, nm, mult in rows:
        f = mult * _F02_F0
        lam = _F02_C / f * 100.0        # 波長 [cm]
        per = 1e9 / f                   # 1 周期の時間 [ns]
        o.append(ARR(xb, y, 212, y, c=SIG, lw=1.5, head=6))
        o.append(T(174, y - 5, "× %d" % mult, "middle", 10, SIG, True, halo=True))
        o.append(T(220, y + 4, nm, "start", 12, SIG, True))
        o.append(T(244, y + 4, "%.2f MHz" % (f / 1e6), "start", 10.5, INK, True))
        o.append(T(244, y + 18, "1 周期 %.3f ns" % per, "start", 9.5, MUT))
        L = lam * k
        n = 96
        o.append(W(xw, y, xw + 1.2 * L, y, c=GRD, lw=1))
        o.append(PL([(xw + 1.2 * L * j / n, y - 11 * math.sin(2 * math.pi * 1.2 * j / n)) for j in range(n + 1)], c=SIG, lw=1.8))
        for xx in (xw, xw + L):
            o.append(W(xx, y - 14, xx, y + 20, c=FNT, lw=1, dash="3 3"))
        o.append(DIM(xw, y + 18, xw + L, y + 18, None, c=GLD))
        o.append(T(xw + L / 2, y + 31, "波長 %.2f cm" % lam, "middle", 9.5, GLD, True, halo=True))
    return SVG(700, 204, o, "GPS の 3 つの搬送波の周波数・1 周期の時間・波長（規格の周波数から計算。波は、波長の比を実際のとおりに描いた）。")
F["e02_carriers"] = _f02_carriers_fig()


# =====================================================================
# 1 節: 各衛星系の搬送波（周波数の軸に並べる）
# =====================================================================
_F02_SYSC = {"GPS": SIG, "Galileo": GRN, "BeiDou": GLD, "GLONASS": PUR, "QZSS": TEA}


def _f02_bands_fig():
    o = []
    # 途中を省いた周波数の軸（左 1160〜1290 MHz、右 1550〜1615 MHz、同じ目盛の幅）
    k = 2.95
    xl0, xr0 = 96.0, 96.0 + 130 * k + 22
    def X(f):
        return xl0 + (f - 1160) * k if f <= 1295 else xr0 + (f - 1550) * k
    o.append(T(14, 18, "各衛星系の主な搬送波（点線は、4 つの衛星系が共通に使う 2 つの周波数）", "start", 11.5, INK, True))
    ytop, ybot = 40, 304
    # 割り当てられた範囲
    for f0, f1 in ((1164, 1290), (1559, 1610)):
        o.append(RECT(X(f0), ytop, X(f1) - X(f0), ybot - ytop, 0, MSOFT, "none", 0, op=0.55))
    o.append(T(X(1164) + 3, ytop + 12, "1164〜1300 MHz（図は 1290 まで）", "start", 9.5, MUT, halo=True))
    o.append(T(X(1559) + 3, ytop + 12, "1559〜1610 MHz", "start", 9.5, MUT, halo=True))
    # 共通の周波数の縦線
    for f in (1176.45, 1575.42):
        o.append(W(X(f), ytop + 18, X(f), ybot, c=FNT, lw=1, dash="3 3"))
    rows = [
        ("GPS", [("L5", 1176.45, 20.46, "1176.45", 0), ("L2", 1227.60, 2.046, "1227.60", 0), ("L1", 1575.42, 2.046, "1575.42", 0)]),
        ("Galileo", [("E5a", 1176.45, 20.46, "1176.45", 0), ("E5b", 1207.14, 20.46, "1207.14", 0), ("E6", 1278.75, 10.23, "1278.75", 0), ("E1", 1575.42, 4.092, "1575.42", 0)]),
        ("BeiDou", [("B2a", 1176.45, 20.46, "1176.45", 0), ("B2b", 1207.14, 20.46, "1207.14", 0), ("B3I", 1268.52, 20.46, "1268.52", 0), ("B1I", 1561.098, 4.092, "1561.098", 1), ("B1C", 1575.42, 4.092, "1575.42", 0)]),
        ("GLONASS", []),
        ("QZSS", [("L5", 1176.45, 20.46, "1176.45", 0), ("L2", 1227.60, 2.046, "1227.60", 0), ("L6", 1278.75, 5.115, "1278.75", 0), ("L1", 1575.42, 2.046, "1575.42", 0)]),
    ]
    names = {"GPS": "GPS", "Galileo": "Galileo", "BeiDou": "BeiDou", "GLONASS": "GLONASS", "QZSS": "みちびき"}
    y = 84
    for sysn, sigs in rows:
        c = _F02_SYSC[sysn]
        o.append(T(14, y + 4, names[sysn], "start", 10.5, c, True))
        o.append(W(xl0, y, X(1290), y, c=LIN, lw=0.8))
        o.append(W(xr0, y, X(1615), y, c=LIN, lw=0.8))
        for nm, fc, bw, fl, below in sigs:
            x0, x1 = X(fc - bw / 2), X(fc + bw / 2)
            o.append(RECT(x0, y - 7, max(x1 - x0, 1.6), 14, 1.5, soft(c), c, 1.2))
            ly = y + 21 if below else y - 11
            o.append(T((x0 + x1) / 2, ly, nm + " " + fl, "middle", 9.5, c, True, halo=True))
        if sysn == "GLONASS":
            for f0, df, lab, lx in ((1246.0, 0.4375, "G2 1246 + 0.4375 k", 1246.0), (1602.0, 0.5625, "G1 1602 + 0.5625 k", 1594.0)):
                for ch in range(-7, 7):
                    fc = f0 + df * ch
                    x0, x1 = X(fc - 0.511), X(fc + 0.511)
                    o.append(RECT(x0, y - 7, x1 - x0, 14, 0.5, soft(c), c, 0.7))
                o.append(T(X(lx), y - 11, lab, "middle", 9.5, c, True, halo=True))
            o.append(T(X(1246.0), y + 21, "衛星ごとに違う整数 k（−7〜+6）", "middle", 9.5, c, False, halo=True))
        y += 50
    # 軸
    ya = ybot
    o.append(W(xl0, ya, X(1290), ya, c=MUT, lw=1.2))
    o.append(W(xr0, ya, X(1615), ya, c=MUT, lw=1.2))
    for f in (1170, 1200, 1230, 1260, 1290):
        o.append(W(X(f), ya, X(f), ya + 4, c=MUT, lw=1))
        o.append(T(X(f), ya + 15, "%d" % f, "middle", 9.5, MUT))
    for f in (1560, 1580, 1600):
        o.append(W(X(f), ya, X(f), ya + 4, c=MUT, lw=1))
        o.append(T(X(f), ya + 15, "%d" % f, "middle", 9.5, MUT))
    xm = (X(1290) + xr0) / 2
    for dx in (-4, 4):
        o.append(W(xm + dx - 4, ya + 5, xm + dx + 4, ya - 5, c=MUT, lw=1.2))
    o.append(T(X(1290) + 11, ya - 8, "省略", "middle", 9, MUT))
    o.append(TX(390, ya + 33, "周波数 f [MHz]（1290〜1550 MHz を省いた）", "middle", 10, MUT))
    return SVG(700, ya + 42, o, "各衛星系の主な搬送波（各規格の値、書いた時点）。棒の幅は、電力の大部分が入る幅の目安で、4 節で求める。灰色は、衛星による測位に割り当てられた範囲。")
F["e02_bands"] = _f02_bands_fig()


# =====================================================================
# 1 節: FDMA と CDMA
# =====================================================================
def _f02_fdma_fig():
    o = []
    # (a) FDMA: GLONASS G1
    o.append(T(14, 18, "(a) FDMA（GLONASS の G1）: 周波数で分ける", "start", 11.5, INK, True))
    p = Plot(56, 40, 286, 120, (1597.0, 1607.0), (0, 1.15))
    o.append(p.axes(xl="周波数 f [MHz]", yl=None, xt=[1598, 1600, 1602, 1604, 1606], yt=[0, 0.5, 1.0], xfmt=lambda v: "%d" % v, yfmt=_f02_fmt))
    o.append(T(p.x - 34, p.y + p.h / 2, "電力（相対）", "middle", 9.5, MUT, rot=-90))
    fs = _f02_np.linspace(1597.0, 1607.0, 1201)
    cols = [SIG, PUR, TEA]
    for ch in range(-7, 7):
        fc = 1602.0 + 0.5625 * ch
        m = _f02_np.abs(fs - fc) <= 0.511
        pts = [(f, float(_f02_sinc((f - fc) / 0.511)) ** 2) for f in fs[m]]
        hl = ch == 0
        o.append(p.line(pts, c=SIG if hl else cols[(ch + 7) % 2 + 1], lw=2.6 if hl else 1.1))
    o.append(T(p.X(1602.0), p.Y(1.0) - 6, "0", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1602 - 7 * 0.5625), p.Y(1.0) - 6, "−7", "middle", 9.5, MUT, True, halo=True))
    o.append(T(p.X(1602 + 6 * 0.5625), p.Y(1.0) - 6, "+6", "middle", 9.5, MUT, True, halo=True))
    o.append(T(14, 222, "衛星ごとに 0.5625 MHz ずつ周波数をずらす。", "start", 10, INK))
    o.append(T(14, 238, "どの衛星も同じ符号を使い、", "start", 10, INK))
    o.append(T(14, 254, "受信機は周波数で 1 つを選ぶ（青はずらす数 0 の衛星）。", "start", 10, INK))
    o.append(T(14, 270, "隣どうしの山は裾が重なるが、周波数が違うので分けられる。", "start", 9.5, MUT))
    # (b) CDMA: GPS L1
    xb = 380
    o.append(T(xb, 18, "(b) CDMA（GPS の L1）: 符号で分ける", "start", 11.5, INK, True))
    q = Plot(xb + 42, 40, 262, 120, (-3, 3), (0, 1.15))
    o.append(q.axes(xl="周波数 f − 1575.42 [MHz]", yl=None, xt=[-3, -2, -1, 0, 1, 2, 3], yt=[0, 0.5, 1.0], xfmt=_f02_fmt, yfmt=_f02_fmt))
    fs2 = _f02_np.linspace(-3, 3, 601)
    env = [(f, float(_f02_sinc(f / 1.023)) ** 2) for f in fs2]
    for k, (c, dash) in enumerate(((SIG, None), (GRN, "6 4"), (GLD, "2 4"))):
        o.append(q.line(env, c=c, lw=2.0, dash=dash))
    o.append(T(q.X(1.25), q.Y(0.72), "3 機とも同じ形で", "start", 9.5, INK, True, halo=True))
    o.append(T(q.X(1.25), q.Y(0.72) + 13, "完全に重なる", "start", 9.5, INK, True, halo=True))
    # 符号の帯
    yc = 210
    for k, (prn, c) in enumerate(((1, SIG), (2, GRN), (3, GLD))):
        yy = yc + k * 26
        o.append(T(xb + 36, yy + 4, "衛星 %d" % (k + 1), "end", 9.5, c, True))
        vals = list(_f02_pm(prn)[:24])
        o.append(_f02_wave(xb + 44, yy, 7, vals, 10.5, c=c, lw=1.5))
    o.append(T(xb + 44, yc + 74, "符号の始めの部分。衛星ごとに 0 と 1 の並びが違い、", "start", 9.5, MUT))
    o.append(T(xb + 44, yc + 88, "受信機は符号で 1 つを選ぶ（2・3 節）", "start", 9.5, MUT))
    return SVG(700, 304, o, "同じ周波数の範囲を多くの衛星で分け合う 2 つの方法（山の形は、符号を載せた電波の電力の形で、4 節で求める）。")
F["e02_fdma"] = _f02_fdma_fig()


# =====================================================================
# 2 節: チップ・チップレート・符号の周期（C/A 符号の値）
# =====================================================================
def _f02_chipdef_fig():
    o = []
    tc_ns = _F02_TC * 1e9                       # 1 チップの時間 [ns]
    chip_m = _F02_C * _F02_TC                   # 1 チップの間に電波が進む距離 [m]
    per_ms = 1023 * _F02_TC * 1e3               # 符号の周期 [ms]
    per_km = _F02_C * 1023 * _F02_TC / 1e3      # 符号の周期の間に電波が進む距離 [km]
    o.append(T(14, 18, "C/A 符号の時間の区切り（1023 チップの並びを、1 ms ごとに繰り返す）", "start", 11.5, INK, True))
    X0, X1 = 176, 686
    bw = (X1 - X0) / 3
    y1 = 38
    o.append(T(14, y1 + 10, "符号の周期", "start", 10, SIG, True))
    o.append(TX(14, y1 + 24, "N_c T_c = %g ms" % round(per_ms, 6), "start", 9.5, MUT))
    for k in range(3):
        on = k == 1
        o.append(RECT(X0 + k * bw, y1, bw - 2, 22, 3, SSOFT if on else PAN, SIG if on else LIN, 1.3 if on else 1.0))
        o.append(TX(X0 + k * bw + (bw - 2) / 2, y1 + 15, "N_c = 1023 チップ", "middle", 9.5, SIG if on else MUT, on))
    o.append(DIM(X0 + 2 * bw, y1 + 32, X1 - 2, y1 + 32, None, c=SIG))
    o.append(T(X0 + 2.5 * bw, y1 + 46, "%g ms（電波が %.2f km 進む時間）" % (round(per_ms, 6), per_km), "middle", 9.5, SIG, True))
    o.append(T(X0, y1 + 46, "時間 →", "start", 9, MUT))
    # 周期の区切りの前後 6 チップずつを拡大
    y2 = 112
    idx = [1017, 1018, 1019, 1020, 1021, 1022, 0, 1, 2, 3, 4, 5]
    cw = (X1 - X0) / len(idx)
    xz = X0 + bw - 1
    o.append(W(xz - 5, y1 + 22, X0, y2 - 4, c=FNT, lw=1, dash="3 3"))
    o.append(W(xz + 5, y1 + 22, X1, y2 - 4, c=FNT, lw=1, dash="3 3"))
    o.append(RECT(xz - 5, y1 - 2, 10, 26, 2, "none", GLD, 1.6))
    bits = [_F02_CODES[1][i] for i in idx]
    o.append(T(14, y2 + 18, "チップ", "start", 10, SIG, True))
    o.append(T(14, y2 + 32, "0 → +1、1 → −1", "start", 9.5, MUT))
    ym = y2 + 24
    for j, i in enumerate(idx):
        o.append(T(X0 + j * cw + cw / 2, y2 + 6, "%d" % i, "middle", 9, MUT))
    o.append(W(X0, ym, X1, ym, c=GRD, lw=1))
    o.append(_f02_wave(X0, ym, 10, [1 - 2 * b for b in bits], cw, c=SIG, lw=1.9))
    xm = X0 + 6 * cw
    o.append(W(xm, y2 - 2, xm, ym + 30, c=PUR, lw=1.3, dash="5 3"))
    o.append(T(xm - 6, ym + 30, "周期の区切り（ここから同じ並びを繰り返す）", "end", 9.5, PUR, True, halo=True))
    o.append(DIM(X0 + 8 * cw, ym + 19, X0 + 9 * cw, ym + 19, None, c=GLD))
    o.append(TX(X0 + 9 * cw + 6, ym + 22.5, "1 チップ T_c", "start", 9.5, GLD, True, halo=True))
    yn = ym + 52
    o.append(TX(X0, yn, "チップレート R_c = %.3f M チップ/s（10.23 MHz の 1/10）" % (_F02_RC / 1e6), "start", 10, INK))
    o.append(TX(X0, yn + 16, "1 チップの時間 T_c = 1/R_c = %.1f ns（電波が %.0f m 進む時間）" % (tc_ns, chip_m), "start", 10, INK, True))
    return SVG(700, yn + 26, o, "C/A 符号のチップと周期（規格の値。下の段は、PRN 1 の周期の区切りをはさむ 12 チップ）。")
F["e02_chipdef"] = _f02_chipdef_fig()


# =====================================================================
# 2 節: G1・G2 のシフトレジスタ（PRN 1）と、最初の 10 クロック
# =====================================================================
def _f02_reg(o, x0, y0, vals, cw=30, chh=24, hl=(), c=SIG):
    """10 段のレジスタ（段の番号を上に書く）。hl の段（1 から数える）を強調する。"""
    for j in range(10):
        on = (j + 1) in hl
        o.append(RECT(x0 + j * cw, y0, cw, chh, 2, soft(c) if on else PAN, c if on else LIN, 1.6 if on else 1.1))
        o.append(T(x0 + j * cw + cw / 2, y0 + chh / 2 + 4.5, str(vals[j]), "middle", 12, INK, True, True))
        o.append(T(x0 + j * cw + cw / 2, y0 - 4, str(j + 1), "middle", 9, MUT))


def _f02_lfsr_fig():
    o = []
    o.append(T(14, 18, "C/A 符号を作る 2 つのシフトレジスタ（PRN 1。図は始める前の、全部 1 の状態）", "start", 11.5, INK, True))
    x0, cw = 160, 30
    cx = lambda j: x0 + (j - 0.5) * cw          # j 段目の中心
    # ---- G1 ----
    y1 = 46
    _f02_reg(o, x0, y1, [1] * 10, hl=(3, 10), c=SIG)
    o.append(T(60, y1 + 17, "G1", "start", 12, SIG, True))
    yb = y1 + 40
    for j in (3, 10):
        o.append(W(cx(j), y1 + 24, cx(j), yb, c=SIG, lw=1.4))
        o.append(D(cx(j), yb, SIG, 2.6))
    o.append(W(cx(10), yb, 146, yb, c=SIG, lw=1.4))
    o.append(_f02_xor(138, yb, c=SIG))
    o.append(W(138, yb - 8, 138, y1 + 12, c=SIG, lw=1.4))
    o.append(ARR(138, y1 + 12, x0, y1 + 12, c=SIG, lw=1.4, head=6))
    o.append(T(cx(6), yb + 13, "帰還のタップ: 3・10 段目", "middle", 9.5, SIG, False, halo=True))
    o.append(TX(470, yb + 13, "多項式 1 + D^3 + D^{10}", "start", 9.5, SIG))
    o.append(T(x0 + 10 * cw, y1 - 16, "1 クロックごとに 1 段ずつ右へ送る →", "end", 9, MUT))
    # ---- G2 ----
    y2 = 156
    _f02_reg(o, x0, y2, [1] * 10, hl=(2, 3, 6, 8, 9, 10), c=GRN)
    o.append(T(60, y2 + 17, "G2", "start", 12, GRN, True))
    yb2 = y2 + 40
    for j in (2, 3, 6, 8, 9, 10):
        o.append(W(cx(j), y2 + 24, cx(j), yb2, c=GRN, lw=1.4))
        o.append(D(cx(j), yb2, GRN, 2.6))
    o.append(W(cx(10), yb2, 146, yb2, c=GRN, lw=1.4))
    o.append(_f02_xor(138, yb2, c=GRN))
    o.append(W(138, yb2 - 8, 138, y2 + 12, c=GRN, lw=1.4))
    o.append(ARR(138, y2 + 12, x0, y2 + 12, c=GRN, lw=1.4, head=6))
    o.append(T(cx(7) + 8, yb2 + 13, "帰還のタップ: 2・3・6・8・9・10 段目", "middle", 9.5, GRN, False, halo=True))
    o.append(TX(470, yb2 + 13, "1 + D^2 + D^3 + D^6 + D^8 + D^9 + D^{10}", "start", 9.5, GRN))
    # ---- PRN 1 の 2 つの段（2・6）----
    ys = y2 - 22
    for j in (2, 6):
        o.append(W(cx(j), y2, cx(j), ys, c=GLD, lw=1.6))
        o.append(D(cx(j), ys, GLD, 2.8))
        o.append(RECT(x0 + (j - 1) * cw, y2, cw, 24, 2, "none", GLD, 2.2))
    xs = 520
    o.append(W(cx(2), ys, xs - 8, ys, c=GLD, lw=1.6))
    o.append(_f02_xor(xs, ys, c=GLD))
    o.append(T(cx(4), ys - 6, "PRN 1 の 2 つの段: 2・6 段目", "middle", 9.5, GLD, True, halo=True))
    # ---- 出力 ----
    xf, yf = 580, 112
    o.append(W(x0 + 10 * cw, y1 + 12, xf, y1 + 12, c=SIG, lw=1.6))
    o.append(ARR(xf, y1 + 12, xf, yf - 8, c=SIG, lw=1.6, head=6))
    o.append(T(xf + 6, y1 + 34, "G1 の 10 段目", "start", 9.5, SIG, True))
    o.append(W(xs + 8, ys, xf, ys, c=GLD, lw=1.6))
    o.append(ARR(xf, ys, xf, yf + 8, c=GLD, lw=1.6, head=6))
    o.append(_f02_xor(xf, yf, c=INK))
    o.append(ARR(xf + 8, yf, 640, yf, c=INK, lw=1.8))
    o.append(T(644, yf - 3, "C/A 符号", "start", 10, INK, True))
    o.append(T(644, yf + 11, "（PRN 1）", "start", 9.5, INK))
    o.append(T(xs + 30, ys + 16, "⊕ は排他的論理和", "start", 9, MUT))
    # ---- 最初の 10 クロックの表 ----
    out, st = _f02_ca(1, 10, states=True)
    yp = 232
    o.append(W(14, yp - 14, 686, yp - 14, c=LIN, lw=0.8))
    o.append(T(14, yp, "1 クロックの手順（全部の段を 1 にしてから始める）", "start", 10, INK, True))
    steps = ["① 出力のチップを決める: G1 の 10 段目 ⊕（G2 の 2 つの段の ⊕）。2 つの段の組は、PRN 番号ごとに違う",
             "② 帰還の値を計算する: G1 は 3・10 段目の ⊕、G2 は 2・3・6・8・9・10 段目の ⊕",
             "③ 全体を 1 段ずつ右へ送り、② の値を 1 段目に入れる"]
    for k, st_ in enumerate(steps):
        o.append(T(14, yp + 16 + k * 15, st_, "start", 9.5, INK))
    yt = yp + 16 + 3 * 15 + 18
    o.append(W(14, yt - 16, 686, yt - 16, c=LIN, lw=0.8))
    hdr = [(40, "番号", "end"), (62, "G1（1〜10 段）", "start"), (172, "G2（1〜10 段）", "start"), (300, "G1 の 10 段目", "start"),
           (396, "G2 の 2 段目 ⊕ 6 段目", "start"), (548, "出力", "start")]
    for x, s, a in hdr:
        o.append(T(x, yt, s, a, 9.5, MUT, True))
    for n in range(10):
        g1, g2 = st[n]
        yy = yt + 17 + n * 14.5
        o.append(T(40, yy, str(n), "end", 10, MUT, False, True))
        for j in range(10):
            o.append(T(62 + j * 6.4 + 3, yy, str(g1[j]), "middle", 10, SIG if j == 9 else INK, j == 9, True))
            o.append(T(172 + j * 6.4 + 3, yy, str(g2[j]), "middle", 10, GLD if j in (1, 5) else INK, j in (1, 5), True))
        o.append(T(330, yy, str(g1[9]), "middle", 10, SIG, True, True))
        o.append(T(396, yy, "%d ⊕ %d = %d" % (g2[1], g2[5], g2[1] ^ g2[5]), "start", 10, GLD, False, True))
        o.append(T(556, yy, str(out[n]), "middle", 10.5, INK, True, True))
    yz = yt + 17 + 10 * 14.5 + 6
    b10 = "".join(str(x) for x in out)
    o.append(T(14, yz, "出力の最初の 10 チップ %s を、左から 1 桁と 3 桁ずつに区切ると %s｜%s｜%s｜%s で、8 進数で %s（規格の表と同じ）"
               % (b10, b10[0], b10[1:4], b10[4:7], b10[7:10], _f02_oct10(out)), "start", 10, INK, True))
    return SVG(700, yz + 10, o, "IS-GPS-200 の C/A 符号の作り方（PRN 1 の例）。表は最初の 10 クロックの各段の値で、左端の番号は、そのクロックで出すチップの番号である。")
F["e02_lfsr"] = _f02_lfsr_fig()


# =====================================================================
# 2 節: ゴールド符号 — 2 つの M 系列の一方をずらして排他的論理和をとる
# =====================================================================
def _f02_bitrow(o, x0, y, bits, cw, c, dashed=(), bold=(), ch=16):
    """0/1 の列を、チップごとの箱で描く（1 の箱に色を付ける）。"""
    for j, b in enumerate(bits):
        o.append(RECT(x0 + j * cw, y, cw - 2, ch, 2, soft(c) if b else PAN, c if b else LIN, 1.0, dash="3 2" if j in dashed else None))
        if j in bold:
            o.append(RECT(x0 + j * cw - 1, y - 1, cw, ch + 2, 2, "none", INK, 1.8))
        o.append(T(x0 + j * cw + (cw - 2) / 2, y + ch / 2 + 4, str(b), "middle", 10, c if b else INK, True, True))


def _f02_gold_fig():
    o = []
    nshow, x0, cw = 20, 226, 23
    _, st = _f02_ca(1, 1023, states=True)
    g1s = [a[9] for a, _ in st]                 # G1 の 10 段目の列（M 系列）
    g2s = [b[9] for _, b in st]                 # G2 の 10 段目の列（M 系列）
    o.append(T(14, 18, "C/A 符号 = G1 の列 ⊕（G2 の列を、PRN 番号ごとに決まった数だけ遅らせた列）", "start", 11.5, INK, True))
    for j in range(nshow):
        o.append(T(x0 + j * cw + (cw - 2) / 2, 36, str(j), "middle", 8.5, MUT))
    o.append(T(x0 - 8, 36, "チップの番号", "end", 9, MUT))
    o.append(T(x0 - 8, 54, "G1 の 10 段目の列", "end", 10, SIG, True))
    _f02_bitrow(o, x0, 42, g1s[:nshow], cw, SIG)
    o.append(T(x0 - 8, 78, "G2 の 10 段目の列", "end", 10, GRN, True))
    _f02_bitrow(o, x0, 66, g2s[:nshow], cw, GRN, bold=(0,))
    y = 108
    for prn in (1, 2):
        d = _F02_DELAY[prn]
        a, b = _F02_TAPS[prn]
        dl = [g2s[(n - d) % 1023] for n in range(1023)]
        assert dl == [q[a - 1] ^ q[b - 1] for _, q in st]              # 遅らせた列は、2 つの段の排他的論理和に等しい
        assert [g1s[n] ^ dl[n] for n in range(1023)] == _F02_CODES[prn]  # G1 の列との排他的論理和が C/A 符号
        o.append(ARR(x0, y - 7, x0 + d * cw - 2, y - 7, c=GLD, lw=1.4, head=6))
        o.append(T(x0 + d * cw + 4, y - 4, "%d チップ遅らせる（太枠が、G2 の列の 0 番のチップ）" % d, "start", 9, GLD, True))
        o.append(T(x0 - 8, y + 8, "G2 を %d チップ遅らせた列" % d, "end", 10, GLD, True))
        o.append(T(x0 - 8, y + 20, "＝ G2 の %d 段目 ⊕ %d 段目" % (a, b), "end", 9, MUT))
        _f02_bitrow(o, x0, y, dl[:nshow], cw, GLD, dashed=tuple(range(d)), bold=(d,))
        o.append(T(x0 - 8, y + 38, "G1 の列との ⊕ ＝ PRN %d" % prn, "end", 10, INK, True))
        _f02_bitrow(o, x0, y + 26, _F02_CODES[prn][:nshow], cw, INK)
        y += 68
    o.append(T(686, y - 14, "破線の箱は、前の周期の終わりのチップ", "end", 9, MUT))
    return SVG(700, y - 6, o, "C/A 符号の最初の 20 チップを、2 つの列の排他的論理和として書いたもの（IS-GPS-200 の作り方で計算。遅らせるチップの数は規格の表の値）。")
F["e02_gold"] = _f02_gold_fig()


# =====================================================================
# 2 節: C/A 符号の並び — 雑音のように見える
# =====================================================================
def _f02_runs(c):
    c = list(c)
    i0 = 0
    while c[i0] == c[-1]:
        i0 += 1
    c = c[i0:] + c[:i0]
    r, L = [], 1
    for k in range(1, len(c)):
        if c[k] == c[k - 1]:
            L += 1
        else:
            r.append(L)
            L = 1
    r.append(L)
    return r


def _f02_chips_fig():
    o = []
    # (a) 最初の 18 チップ
    o.append(T(14, 18, "(a) 最初の 18 チップ（0 → +1、1 → −1）", "start", 11.5, INK, True))
    x0, cw, nch = 66, 22, 18
    for k, (prn, c, yd) in enumerate(((1, SIG, 44), (2, GRN, 104))):
        bits = _F02_CODES[prn][:nch]
        o.append(T(14, yd + 22, "PRN %d" % prn, "start", 10, c, True))
        for j, b in enumerate(bits):
            o.append(T(x0 + j * cw + cw / 2, yd, str(b), "middle", 10, c if j < 10 else MUT, j < 10, True))
        yw = yd + 22
        o.append(W(x0, yw, x0 + nch * cw, yw, c=GRD, lw=1))
        o.append(_f02_wave(x0, yw, 9, [1 - 2 * b for b in bits], cw, c=c, lw=1.8))
        o.append(T(x0 - 4, yw - 6, "+1", "end", 8.5, MUT))
        o.append(T(x0 - 4, yw + 13, "−1", "end", 8.5, MUT))
    o.append(DIM(x0, 152, x0 + cw, 152, None, c=MUT))
    o.append(TX(x0 + cw + 6, 155, "1 チップ T_c = 977.5 ns（293 m）", "start", 9.5, MUT))
    o.append(T(x0 + 10 * cw - 2, 155, "太字が最初の 10 チップ", "start", 9.5, MUT))
    # (b) 規格の表との照合
    xb = 488
    o.append(T(xb, 18, "(b) 最初の 10 チップ（8 進）", "start", 11.5, INK, True))
    o.append(T(xb + 18, 40, "PRN", "middle", 9.5, MUT, True))
    o.append(T(xb + 58, 40, "G2 の段", "middle", 9.5, MUT, True))
    o.append(T(xb + 126, 40, "10 チップ", "middle", 9.5, MUT, True))
    o.append(T(xb + 186, 40, "8 進", "middle", 9.5, MUT, True))
    o.append(W(xb, 45, xb + 200, 45, c=LIN, lw=0.8))
    for k, prn in enumerate((1, 2, 3, 4, 5)):
        yy = 60 + k * 17
        a, b = _F02_TAPS[prn]
        o.append(T(xb + 18, yy, str(prn), "middle", 10, INK))
        o.append(T(xb + 58, yy, "%d・%d" % (a, b), "middle", 10, GLD))
        o.append(T(xb + 126, yy, "".join(str(x) for x in _F02_CODES[prn][:10]), "middle", 10, INK, False, True))
        o.append(T(xb + 186, yy, _f02_oct10(_F02_CODES[prn]), "middle", 10, SIG, True, True))
    assert all(_f02_oct10(_F02_CODES[q]) == _F02_OCT[q] for q in _F02_OCT)
    o.append(T(xb, 60 + 5 * 17 + 2, "5 つとも規格の表の値と一致", "start", 9.5, GRN, True))
    # (c) 1023 チップの全体
    yc = 186
    o.append(T(14, yc, "(c) PRN 1 の 1023 チップの全体（341 チップずつ 3 段。左上から右下へ）", "start", 11.5, INK, True))
    v = list(_f02_pm(1))
    cw2 = 1.8
    for r in range(3):
        yy = yc + 22 + r * 22
        o.append(_f02_wave(70, yy, 6, v[r * 341:(r + 1) * 341], cw2, c=SIG, lw=0.9))
        o.append(T(64, yy + 4, "%d〜" % (r * 341), "end", 9, MUT))
    # (d) 連の長さ
    yd = 286
    o.append(T(14, yd, "(d) 同じ値が続く区間（連）の数（PRN 1）", "start", 11.5, INK, True))
    rr = _f02_runs(_F02_CODES[1])
    cnt = [rr.count(L) for L in range(1, 12)]
    p = Plot(70, yd + 18, 300, 100, (0.5, 11.5), (0.4, 400), ylog=True)
    o.append(p.axes(xl="連の長さ [チップ]", yl=None, xt=list(range(1, 12)), yt=[1, 10, 100], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v, grid=False))
    o.append(T(p.x - 36, p.y + p.h / 2, "数（対数の目盛）", "middle", 9.5, MUT, rot=-90))
    for L in range(1, 12):
        n = cnt[L - 1]
        if n > 0:
            o.append(RECT(p.X(L) - 9, p.Y(n), 18, p.Y(0.4) - p.Y(n), 2, SSOFT, SIG, 1.1))
            o.append(T(p.X(L), p.Y(n) - 4, str(n), "middle", 9, SIG, True, halo=True))
        if 256 / 2 ** (L - 1) >= 0.4:
            o.append(D(p.X(L), p.Y(256 / 2 ** (L - 1)), GLD, 3.0))
    o.append(T(p.x + p.w - 2, p.y + 10, "● 半分ずつ減る数（256, 128, 64, …）", "end", 9, GLD, True, halo=True))
    # 1 と 0 の数
    xr = 430
    o.append(T(xr, yd + 32, "1 と 0 の数（PRN 1）", "start", 10, INK, True))
    n1 = sum(_F02_CODES[1])
    same = all(sum(_F02_CODES[q]) == n1 for q in range(1, 33))
    for k, (lab, n, c) in enumerate((("0（+1）", 1023 - n1, SIG), ("1（−1）", n1, GRN))):
        yy = yd + 46 + k * 26
        o.append(T(xr + 50, yy + 12, lab, "end", 10, c, True))
        o.append(RECT(xr + 58, yy, 180 * n / 512, 16, 2, soft(c), c, 1.1))
        o.append(T(xr + 58 + 180 * n / 512 + 6, yy + 12, str(n), "start", 10, c, True))
    o.append(T(xr, yd + 112, ("PRN 1〜32 のすべてで %d と %d。" if same else "PRN 1 では %d と %d。") % (1023 - n1, n1), "start", 9.5, MUT))
    o.append(T(xr, yd + 126, "コインを投げた列のように、ほぼ半々", "start", 9.5, MUT))
    return SVG(700, yd + 160, o, "C/A 符号の並び（IS-GPS-200 の作り方で計算。波形は、0 を +1、1 を −1 として描いた）。")
F["e02_chips"] = _f02_chips_fig()


# =====================================================================
# 3 節: チップごとに掛けて足す（ずれ 0 とずれ 3）
# =====================================================================
def _f02_cellrow(o, x0, y, vals, cw=26, ch=18, kind="code", dashed=()):
    for j, v in enumerate(vals):
        if kind == "code":
            fill, c, s, tc = (SSOFT, SIG, "+", SIG) if v > 0 else (PAN, LIN, "−", INK)
        else:
            fill, c, s, tc = (GSOFT, GRN, "+1", GRN) if v > 0 else (ASOFT, ALI, "−1", ALI)
        o.append(RECT(x0 + j * cw, y, cw - 2, ch, 2, fill, c, 1.0, dash="3 2" if j in dashed else None))
        o.append(T(x0 + j * cw + (cw - 2) / 2, y + ch / 2 + 4.2, s, "middle", 10.5 if kind == "code" else 9.5, tc, True))


def _f02_corrcalc_fig():
    o = []
    a = _f02_pm(1)
    nshow, x0, cw = 20, 176, 25.6
    for panel, (k, y0) in enumerate(((0, 0), (3, 150))):
        loc = [int(a[(n - k) % 1023]) for n in range(nshow)]
        prod = [int(a[n]) * loc[n] for n in range(nshow)]
        tot = int(sum(int(a[n]) * int(a[(n - k) % 1023]) for n in range(1023)))
        agree = (1023 + tot) // 2
        ttl = "(a) ずれ k = 0: 手元の符号を遅らせない" if k == 0 else "(b) ずれ k = 3: 手元の符号を 3 チップ遅らせる"
        o.append(T(14, y0 + 18, ttl, "start", 11.5, INK, True))
        for j in range(nshow):
            o.append(T(x0 + j * cw + (cw - 2) / 2, y0 + 34, str(j), "middle", 8.5, MUT))
        o.append(TX(x0 - 8, y0 + 34, "n", "end", 9.5, MUT))
        o.append(TX(x0 - 8, y0 + 52, "受けた符号 a_1[n]", "end", 10, SIG, True))
        _f02_cellrow(o, x0, y0 + 39, [int(v) for v in a[:nshow]], cw)
        o.append(TX(x0 - 8, y0 + 74, "手元の符号 a_1[n − %d]" % k, "end", 10, SIG, True))
        _f02_cellrow(o, x0, y0 + 61, loc, cw, dashed=(0, 1, 2) if k else ())
        o.append(T(x0 - 8, y0 + 96, "積", "end", 10, INK, True))
        _f02_cellrow(o, x0, y0 + 83, prod, cw, kind="prod")
        o.append(T(x0 - 8, y0 + 117, "積の和（n = 0 から）", "end", 9.5, MUT))
        acc = 0
        for j in range(nshow):
            acc += prod[j]
            o.append(T(x0 + j * cw + (cw - 2) / 2, y0 + 117, ("%d" % acc).replace("-", "−"), "middle", 9, GLD, True))
        if k == 0:
            msg = "1023 チップの全部で一致するので、和は R_{11}(0) = 1023"
        else:
            msg = "1023 チップの全部では、一致 %d・不一致 %d で、和は R_{11}(3) = %s" % (agree, 1023 - agree, ("%d" % tot).replace("-", "−"))
        o.append(TX(x0, y0 + 138, msg, "start", 10, INK, True))
    o.append(T(686, 150 + 18, "破線の 3 チップは、周期の終わりの 1020〜1022 番", "end", 9.5, MUT))
    return SVG(700, 150 + 148, o, "相関の計算（PRN 1。図は最初の 20 チップで、和は 1023 チップの全部を足した値）。")
F["e02_corrcalc"] = _f02_corrcalc_fig()


# =====================================================================
# 3 節: 自己相関・相互相関がとる値（全部のずれ）
# =====================================================================
def _f02_ticks(p, vals, c, x0=1, h=3.0, lw=1.0):
    """値の列を、ずれ k ごとの短い縦線として描く（同じ値は横に並んで線のように見える）。"""
    d = []
    for i, v in enumerate(vals):
        x = p.X(x0 + i)
        y = p.Y(max(min(v, p.yr[1]), p.yr[0]))
        d.append("M%.1f,%.1fv%.1f" % (x, y - h / 2, h))
    return PATH("".join(d), c=c, lw=lw)


def _f02_acf_fig():
    o = []
    a1, a2 = _f02_pm(1), _f02_pm(2)
    r11 = _f02_circ(a1, a1)
    r12 = _f02_circ(a1, a2)
    rg = _f02_np.random.default_rng(3)
    xr = rg.choice([-1, 1], 1023)
    rrr = _f02_circ(xr, xr)
    # (a) 2 周期分
    o.append(T(14, 18, "(a) PRN 1 の自己相関（ずれ 0〜2046 チップ）", "start", 11.5, INK, True))
    p = Plot(70, 40, 260, 112, (-30, 2076), (-150, 1150))
    o.append(p.axes(xl="ずれ k [チップ]", yl="相関", xt=[0, 1023, 2046], yt=[0, 500, 1000], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    pts = [(k, int(r11[k % 1023])) for k in range(0, 2047)]
    o.append(p.line(pts, c=SIG, lw=1.0))
    o.append(T(p.X(0) + 6, p.Y(1023) + 4, "1023（ずれ 0）", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1023) + 6, p.Y(1023) + 4, "1023 チップごとに", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1023) + 6, p.Y(1023) + 17, "同じ山", "start", 9.5, SIG, True, halo=True))
    def zoom(px, py, vals, c, ttl, labels, rnd=False):
        q = Plot(px, py, 250, 112, (0, 1023), (-110, 110))
        o.append(T(px - 56, py - 22, ttl, "start", 11.5, INK, True))
        o.append(q.axes(xl="ずれ k [チップ]", yl="相関", xt=[0, 256, 512, 768, 1023], yt=[-100, -65, 0, 63, 100], xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%d" % v).replace("-", "−")))
        if rnd:
            o.append(RECT(q.x, q.Y(32), q.w, q.Y(-32) - q.Y(32), 0, TSOFT, "none", 0, op=0.7))
        o.append(_f02_ticks(q, vals, c, x0=1 if len(vals) == 1022 else 0))
        for yv, s in labels:
            o.append(T(q.x + q.w + 4, q.Y(yv) + 3.5, s, "start", 9, c, True))
        return q
    def cnts(vals):
        vv = [int(v) for v in vals]
        assert set(vv) <= {-1, 63, -65}
        return "−1: %d 通り、63: %d 通り、−65: %d 通り" % (vv.count(-1), vv.count(63), vv.count(-65))
    zoom(416, 40, r11[1:], SIG, "(b) (a) の山以外（ずれ 1〜1022）", [(63, "63"), (-1, "−1"), (-65, "−65")])
    o.append(T(416, 200, cnts(r11[1:]), "start", 9.5, SIG, True))
    zoom(70, 248, r12, GRN, "(c) PRN 1 と PRN 2 の相互相関", [(63, "63"), (-1, "−1"), (-65, "−65")])
    o.append(T(70, 408, cnts(r12), "start", 9.5, GRN, True))
    o.append(T(70, 422, "大きさは、(a) の山の %d/1023 = %.1f %% 以下" % (max(abs(int(v)) for v in r12), 100.0 * max(abs(int(v)) for v in r12) / 1023), "start", 9.5, GRN))
    zoom(416, 248, rrr[1:], ALI, "(d) でたらめな ±1 の列の自己相関", [], rnd=True)
    off = rrr[1:]
    o.append(T(416, 408, "山以外の値は ±100 近くまでばらつく", "start", 9.5, ALI, True))
    o.append(T(416, 422, "（帯は標準偏差 ±32。この列では %s〜%s）" % (("%d" % off.min()).replace("-", "−"), "%d" % off.max()), "start", 9.5, MUT))
    return SVG(700, 432, o, "C/A 符号の相関を、1023 通りの全部のずれで計算した値。(d) は、比べるために、+1 と −1 を乱数で選んだ長さ 1023 の列で計算した。")
F["e02_acf"] = _f02_acf_fig()


# =====================================================================
# 3 節: 相関の山は幅 ±1 チップの三角形・頂点を 2 点から読む・3 機の衛星
# =====================================================================
def _f02_rcont(R, tau):
    """整数のずれの値 R[k]（周期 1023）を直線で結んだ、連続のずれの相関。"""
    k = math.floor(tau)
    f = tau - k
    return (1 - f) * R[k % 1023] + f * R[(k + 1) % 1023]


def _f02_tri_fig():
    o = []
    a = {p: _f02_pm(p) for p in (1, 2, 3)}
    r11 = _f02_circ(a[1], a[1])
    cm = _F02_C * _F02_TC
    # (a) 三角形
    o.append(T(14, 18, "(a) PRN 1 の自己相関（ずれをチップの端数まで）", "start", 11.5, INK, True))
    p = Plot(70, 56, 270, 130, (-3, 3), (-120, 1120))
    o.append(p.axes(xl="ずれ τ [チップ]", yl="相関", xt=[-3, -2, -1, 0, 1, 2, 3], yt=[0, 500, 1000], xfmt=_f02_fmt, yfmt=lambda v: "%d" % v))
    for t in (-2, -1, 0, 1, 2):
        o.append(T(p.X(t), p.y - 6, ("%d" % round(t * cm)).replace("-", "−"), "middle", 9, MUT))
    o.append(T(p.x + p.w, p.y - 18, "距離にして [m]", "end", 9, MUT))
    taus = _f02_np.linspace(-3, 3, 601)
    o.append(p.line([(t, _f02_rcont(r11, t)) for t in taus], c=SIG, lw=2.2))
    o.append(DIM(p.X(-1), p.Y(-60), p.X(1), p.Y(-60), None, c=GLD))
    o.append(T(p.X(1) + 6, p.Y(-60) + 3.5, "±1 チップ（±%.1f ns）" % (_F02_TC * 1e9), "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.12), p.Y(1023) + 3, "1023", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.15), p.Y(470), "辺は直線", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.15), p.Y(470) + 13, "（傾き 1024/チップ）", "start", 9, SIG, False, halo=True))
    # (b) 頂点を 2 点から読む
    xb = 410
    o.append(T(xb, 18, "(b) 頂点の位置を 2 点の値から求める", "start", 11.5, INK, True))
    q = Plot(xb + 50, 56, 230, 130, (-1.2, 1.8), (-120, 1120))
    o.append(q.axes(xl="ずれ τ [チップ]", yl="相関", xt=[-1, -0.5, 0, 0.5, 1, 1.5], yt=[0, 500, 1000], xfmt=_f02_fmt, yfmt=lambda v: "%d" % v))
    t0 = 0.3
    tri = lambda t: max(1023 - 1024 * abs(t - t0), -1)
    o.append(q.line([(t, tri(t)) for t in _f02_np.linspace(-1.2, 1.8, 301)], c=SIG, lw=2.0))
    r1, r2 = tri(-0.5), tri(0.5)
    o.append(W(q.X(-0.5), q.Y(r1), q.X(t0), q.Y(1023), c=GLD, lw=1.3, dash="5 3"))
    o.append(W(q.X(0.5), q.Y(r2), q.X(t0), q.Y(1023), c=GLD, lw=1.3, dash="5 3"))
    for t, r in ((-0.5, r1), (0.5, r2)):
        o.append(W(q.X(t), q.Y(r), q.X(t), q.Y(-120), c=GLD, lw=1, dash="2 3"))
        o.append(D(q.X(t), q.Y(r), GLD, 4.4))
    o.append(TX(q.X(-0.5) - 4, q.Y(r1) - 8, "R(τ_1) = %.1f" % r1, "end", 9.5, GLD, True, halo=True))
    o.append(TX(q.X(0.5) + 6, q.Y(r2) + 12, "R(τ_2) = %.1f" % r2, "start", 9.5, GLD, True, halo=True))
    o.append(D(q.X(t0), q.Y(1023), GRN, 4.6))
    te = (-0.5 + 0.5) / 2 - (r1 - r2) / (2 * 1024)        # 頂点の式で求めた位置 [チップ]
    assert abs(te - t0) < 1e-9
    o.append(TX(q.x + q.w, q.Y(1023) - 9, "τ_0 = %.3f チップ（%.1f m）" % (te, te * cm), "end", 9.5, GRN, True, halo=True))
    o.append(TX(q.X(-0.5), q.y + q.h + 46, "τ_1 = −0.5、τ_2 = +0.5 チップ: τ_0 = 0 − (%.1f − %.1f) ÷ 2048 = %.3f" % (r1, r2, te), "middle", 9.5, INK))
    # (c) 3 機の衛星
    yc = 262
    o.append(T(14, yc, "(c) PRN 1・2・3 の電波が重なって届いたとき（遅れ 120.25・487.60・801.90 チップ）の、手元の符号ごとの相関", "start", 11.5, INK, True))
    dly = {1: 120.25, 2: 487.60, 3: 801.90}
    R = {(s, p_): _f02_circ(a[s], a[p_]) for s in (1, 2, 3) for p_ in (1, 2, 3)}
    for row, (pl, c) in enumerate(((1, SIG), (2, GRN), (3, GLD))):
        P = Plot(110, yc + 18 + row * 56, 560, 40, (0, 1023), (-200, 1150))
        ts = sorted(set([float(k) for k in range(0, 1024)] + [dly[s] + d for s in (1, 2, 3) for d in (-1, 0, 1)]))
        vals = [(t, sum(_f02_rcont(R[(s, pl)], t - dly[s]) for s in (1, 2, 3))) for t in ts if 0 <= t <= 1023]
        o.append(W(P.x, P.Y(0), P.x + P.w, P.Y(0), c=GRD, lw=1))
        o.append(P.line(vals, c=c, lw=1.1))
        o.append(T(P.x - 8, P.y + 26, "PRN %d" % pl, "end", 10, c, True))
        o.append(T(P.X(dly[pl]) + 6, P.y + 10, "%.2f" % dly[pl], "start", 9.5, c, True, halo=True))
        if row == 2:
            for t in (0, 256, 512, 768, 1023):
                o.append(W(P.X(t), P.y + P.h, P.X(t), P.y + P.h + 4, c=MUT, lw=1))
                o.append(T(P.X(t), P.y + P.h + 15, "%d" % t, "middle", 9, MUT))
            o.append(T(P.x + P.w / 2, P.y + P.h + 30, "手元の符号のずれ τ [チップ]", "middle", 10, MUT))
    o.append(T(102, yc + 17, "手元の符号", "end", 9.5, MUT))
    return SVG(700, yc + 18 + 3 * 56 + 30, o, "相関の山の形（PRN 1。(b) は本当の遅れが 0.3 チップの例、(c) は 3 機の電波が同じ強さで重なって届いた例）。")
F["e02_tri"] = _f02_tri_fig()


# =====================================================================
# 4 節: BPSK — 符号とデータの積で搬送波の位相を反転させる
# =====================================================================
def _f02_bpsk_fig():
    o = []
    bits = _F02_CODES[1]
    idx = [1019, 1020, 1021, 1022, 0, 1, 2, 3]
    chips = [1 - 2 * bits[i] for i in idx]
    data = [1, 1, 1, 1, -1, -1, -1, -1]
    prod = [c * d for c, d in zip(chips, data)]
    x0, cw, ncy = 172, 63.5, 3
    xe = x0 + 8 * cw
    o.append(T(14, 18, "BPSK（ビットの区切りの前後 4 チップずつ。1 チップに搬送波 3 周期で描いた）", "start", 11.5, INK, True))
    xm = x0 + 4 * cw
    o.append(W(xm, 30, xm, 286, c=PUR, lw=1.3, dash="5 3"))
    o.append(T(xm + 5, 40, "符号の周期の区切り = ビットの区切り", "start", 9.5, PUR, True, halo=True))
    for j, i in enumerate(idx):
        o.append(T(x0 + j * cw + cw / 2, 56, "チップ %d" % i, "middle", 9, MUT))
    rows = [(78, "符号のチップ", "a(t)", chips, SIG), (126, "データのビット", "d(t)", data, GLD), (174, "積", "d(t) a(t)", prod, GRN)]
    for y, nm, sym, vals, c in rows:
        o.append(T(14, y - 2, nm, "start", 10, c, True))
        o.append(TX(14, y + 12, sym, "start", 10, c))
        o.append(W(x0, y, xe, y, c=GRD, lw=1))
        o.append(_f02_wave(x0, y, 13, vals, cw, c=c, lw=2.0))
        o.append(T(x0 - 6, y - 9, "+1", "end", 8.5, MUT))
        o.append(T(x0 - 6, y + 17, "−1", "end", 8.5, MUT))
    o.append(T(x0 + 2 * cw, 126 - 18, "ビット 0（+1）", "middle", 9.5, GLD, True, halo=True))
    o.append(T(x0 + 6 * cw, 126 - 18, "ビット 1（−1）", "middle", 9.5, GLD, True, halo=True))
    # 搬送波と送る信号
    yc, yv = 222, 268
    o.append(T(14, yc - 2, "搬送波", "start", 10, MUT, True))
    o.append(TX(14, yc + 12, "cos(2π f_{L1} t)", "start", 9.5, MUT))
    o.append(T(14, yv - 2, "送る信号", "start", 10, SIG, True))
    o.append(TX(14, yv + 12, "v(t) = A d a cos", "start", 9.5, SIG))
    n = 8 * ncy * 24
    cpts, vpts = [], []
    for k in range(n + 1):
        u = k / (ncy * 24)              # チップの単位の時間
        x = x0 + u * cw
        cv = math.cos(2 * math.pi * ncy * u)
        j = min(int(u), 7)
        cpts.append((x, yc - 13 * cv))
        vpts.append((x, yv - 15 * prod[j] * cv))
    o.append(PL(cpts, c=MUT, lw=1.3))
    o.append(PL(vpts, c=SIG, lw=1.6))
    first = True
    for j in range(1, 8):
        if prod[j] != prod[j - 1]:
            xx = x0 + j * cw
            o.append(W(xx, yv - 22, xx, yv + 22, c=ALI, lw=1.1, dash="2 2"))
            o.append(D(xx, yv - 24, ALI, 3.2))
            if first:
                o.append(T(xx + 4, yv - 26, "位相が 180° 変わる", "start", 9.5, ALI, True, halo=True))
                first = False
    o.append(T(14, 304, "積が −1 の間は、搬送波の山と谷が入れ替わる（位相が 180° ずれる）。", "start", 9.5, MUT))
    o.append(T(14, 318, "実際は、1 チップに搬送波 1540 周期、1 bit に 20 460 チップが入る。", "start", 9.5, MUT))
    return SVG(700, 328, o, "BPSK の波形（PRN 1。ビットの区切りをはさむ 8 チップ。1 チップに搬送波 3 周期として描いた）。")
F["e02_bpsk"] = _f02_bpsk_fig()


# =====================================================================
# 4 節: スペクトラム — 主ローブ・L5 との比較・拡散・線の並び
# =====================================================================
def _f02_psd_fig():
    o = []
    # (a) C/A と L5
    o.append(T(14, 18, "(a) C/A 符号と L5 の信号（電力の合計は同じ）", "start", 11.5, INK, True))
    p = Plot(70, 40, 280, 140, (-3, 3), (0, 1.12))
    m = RECT(p.X(-1.023), p.y, p.X(1.023) - p.X(-1.023), p.h, 0, SSOFT, "none", 0, op=0.6)
    o.append(m)
    o.append(p.axes(xl="周波数 f − 1575.42 [MHz]", yl=None, xt=[-3, -2, -1, 0, 1, 2, 3], yt=[0, 0.5, 1], xfmt=_f02_fmt, yfmt=_f02_fmt))
    o.append(T(p.x - 34, p.y + p.h / 2, "C/A の中心を 1 とした比", "middle", 9, MUT, rot=-90))
    fs = _f02_np.linspace(-3, 3, 601)
    o.append(p.line([(f, float(_f02_sinc(f / 1.023)) ** 2) for f in fs], c=SIG, lw=2.2))
    o.append(p.line([(f, 0.1 * float(_f02_sinc(f / 10.23)) ** 2) for f in fs], c=TEA, lw=2.2))
    o.append(T(p.X(-1.12), p.Y(0.78), "主ローブ（青い範囲）", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-1.12), p.Y(0.78) + 13, "幅 2.046 MHz", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-1.12), p.Y(0.78) + 26, "（電力の 90.3 %）", "end", 9, SIG, False, halo=True))
    cm = _F02_C * _F02_TC
    o.append(T(p.X(1.15), p.Y(0.62) - 8, "C/A（1.023 M チップ/s）", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.15), p.Y(0.62) + 5, "相関の山の幅 ±%.0f m" % cm, "start", 9, SIG, False, halo=True))
    o.append(T(p.X(1.15), p.Y(0.1) - 37, "L5（10.23 M チップ/s）:", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(1.15), p.Y(0.1) - 24, "高さ 1/10、幅 %.2f MHz" % (2 * 10.23), "start", 9, TEA, False, halo=True))
    o.append(T(p.X(1.15), p.Y(0.1) - 11, "相関の山の幅 ±%.1f m" % (cm / 10), "start", 9, TEA, False, halo=True))
    # (b) 拡散: データだけ と 符号を掛けたもの
    xb = 418
    o.append(T(xb, 18, "(b) 符号を掛けると広がる（拡散）", "start", 11.5, INK, True))
    q1 = Plot(xb + 30, 52, 100, 100, (-150, 150), (0, 1.12))
    o.append(q1.axes(xl="f − 1575.42 [Hz]", yl=None, xt=[-100, 0, 100], yt=[0], xfmt=lambda v: ("%d" % v).replace("-", "−"), yfmt=lambda v: "0"))
    o.append(q1.line([(f, float(_f02_sinc(f * 0.02)) ** 2) for f in _f02_np.linspace(-150, 150, 301)], c=GLD, lw=2.0))
    o.append(T(q1.x + q1.w / 2, q1.y - 8, "データだけ（50 bit/s）", "middle", 9.5, GLD, True))
    q2 = Plot(xb + 182, 52, 100, 100, (-3, 3), (0, 1.12))
    o.append(q2.axes(xl="f − 1575.42 [MHz]", yl=None, xt=[-2, 0, 2], yt=[0], xfmt=_f02_fmt, yfmt=lambda v: "0"))
    o.append(q2.line([(f, float(_f02_sinc(f / 1.023)) ** 2) for f in _f02_np.linspace(-3, 3, 301)], c=SIG, lw=2.0))
    o.append(T(q2.x + q2.w / 2, q2.y - 8, "データ × 符号", "middle", 9.5, SIG, True))
    o.append(ARR(q1.x + q1.w + 8, q1.y + 50, q2.x - 16, q2.y + 50, c=INK, lw=1.6, head=7))
    o.append(T((q1.x + q1.w + q2.x) / 2 - 4, q1.y + 40, "符号を", "middle", 9.5, INK, True))
    o.append(T((q1.x + q1.w + q2.x) / 2 - 4, q1.y + 70, "掛ける", "middle", 9.5, INK, True))
    o.append(T(xb, 216, "縦は 1 Hz あたりの電力（全体の電力を 1 とした割合）", "start", 9, MUT))
    o.append(T(xb, 230, "主ローブの幅 100 Hz → 2.046 MHz（約 2 万倍）", "start", 9.5, INK, True))
    o.append(T(xb, 244, "中心の高さ 0.02 → 9.8 × 10⁻⁷（約 2 万分の 1）", "start", 9.5, INK, True))
    # (c) C/A 符号の線スペクトラム
    yc = 278
    o.append(T(14, yc, "(c) PRN 1 の実際のスペクトラム: 1 kHz おきの線（0〜1.2 MHz）", "start", 11.5, INK, True))
    P = Plot(70, yc + 16, 600, 110, (0, 1.2), (1e-4, 10), ylog=True)
    o.append(P.axes(xl="周波数 f − 1575.42 [MHz]", yl=None, xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], yt=[1e-4, 1e-3, 1e-2, 0.1, 1, 10],
                    xfmt=_f02_fmt, yfmt=lambda v: {1e-4: "10⁻⁴", 1e-3: "10⁻³", 1e-2: "0.01", 0.1: "0.1", 1: "1", 10: "10"}[v]))
    o.append(T(P.x - 44, P.y + P.h / 2, "線の電力（比）", "middle", 9, MUT, rot=-90))
    A = _f02_np.abs(_f02_np.fft.fft(_f02_pm(1))) ** 2 / 1023.0
    d = []
    for k in range(1, 1201):
        f = k * 1e-3
        v = float(_f02_sinc(f / 1.023)) ** 2 * A[k % 1023]
        v = max(v, 1.1e-4)
        d.append("M%.1f,%.1fv2.2" % (P.X(f), P.Y(v) - 1.1))
    o.append(PATH("".join(d), c=SIG, lw=1.4))
    o.append(P.line([(f, max(float(_f02_sinc(f / 1.023)) ** 2, 1e-4)) for f in _f02_np.linspace(0.0005, 1.2, 600)], c=GLD, lw=1.8, dash="6 3"))
    o.append(T(P.X(0.62), P.Y(3.5), "線の高さは、包絡（導出した形。黄の破線）のまわりにばらつく", "start", 9.5, INK, True, halo=True))
    o.append(T(P.X(1.023) - 4, P.Y(2e-4), "1.023 MHz で 0", "end", 9.5, GLD, True, halo=True))
    return SVG(700, yc + 16 + 110 + 42, o, "スペクトラム（(a)・(b) は導出した式で計算。(c) の縦は、各線の電力を、中心の包絡の値を 1 とした比で、対数の目盛）。")
F["e02_psd"] = _f02_psd_fig()


# =====================================================================
# 4 節: BOC(1,1) と BPSK の比較
# =====================================================================
def _f02_boc_fig():
    o = []
    vals = [1, -1, -1, 1, -1, 1]
    x0, cw = 172, 84
    o.append(T(14, 18, "(a) BOC(1,1): チップに、1 チップで 1 周期の方形波（副搬送波）を掛ける", "start", 11.5, INK, True))
    rows = [(52, "C/A（BPSK）", vals, SIG, 1), (100, "副搬送波", [1, -1] * 6, MUT, 2), (148, "BOC(1,1)", [v * s for v in vals for s in (1, -1)], GRN, 2)]
    for y, nm, vv, c, per in rows:
        o.append(T(14, y + 4, nm, "start", 10, c, True))
        o.append(W(x0, y, x0 + 6 * cw, y, c=GRD, lw=1))
        o.append(_f02_wave(x0, y, 12, vv, cw / per, c=c, lw=2.0))
    for j in range(7):
        o.append(W(x0 + j * cw, 34, x0 + j * cw, 164, c=LIN, lw=0.8, dash="2 3"))
    o.append(T(x0 + 0.5 * cw, 32, "1 チップ", "middle", 9, MUT))
    o.append(T(14, 100 + 16, "（1.023 MHz）", "start", 9, MUT))
    # (b) スペクトラム
    yb = 196
    o.append(T(14, yb, "(b) スペクトラム（電力の合計は同じ）", "start", 11.5, INK, True))
    p = Plot(70, yb + 18, 270, 130, (-4, 4), (0, 1.12))
    o.append(RECT(p.X(-0.5), p.y, p.X(0.5) - p.X(-0.5), p.h, 0, MSOFT, "none", 0, op=0.8))
    o.append(p.axes(xl="周波数 f − 1575.42 [MHz]", yl=None, xt=[-4, -2, 0, 2, 4], yt=[0, 0.5, 1], xfmt=_f02_fmt, yfmt=_f02_fmt))
    o.append(T(p.x - 34, p.y + p.h / 2, "C/A の中心を 1 とした比", "middle", 9, MUT, rot=-90))
    fs = _f02_np.linspace(-4, 4, 801)
    x = fs / 1.023
    o.append(p.line([(f, float(_f02_sinc(v)) ** 2) for f, v in zip(fs, x)], c=SIG, lw=2.0))
    o.append(p.line([(f, float(_f02_sinc(v / 2)) ** 2 * math.sin(math.pi * v / 2) ** 2) for f, v in zip(fs, x)], c=GRN, lw=2.2))
    o.append(T(p.X(-3.9), p.Y(1.02), "±0.5 MHz（灰色）に入る電力", "start", 9, INK, True, halo=True))
    o.append(T(p.X(-3.9), p.Y(1.02) + 13, "C/A 76 %、BOC(1,1) 15 %", "start", 9, INK, True, halo=True))
    o.append(T(p.X(0.85), p.Y(0.6), "BOC(1,1)", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(0.85), p.Y(0.6) + 12, "山は ±0.76 MHz", "start", 9, GRN, False, halo=True))
    o.append(T(p.X(0.3), p.Y(1.0) + 4, "C/A", "start", 9.5, SIG, True, halo=True))
    # (c) 相関
    xc = 410
    o.append(T(xc, yb, "(c) 相関の山の形（1 を山の高さとした比）", "start", 11.5, INK, True))
    q = Plot(xc + 50, yb + 18, 230, 130, (-1.5, 1.5), (-0.65, 1.1))
    o.append(q.axes(xl="ずれ τ [チップ]", yl=None, xt=[-1.5, -1, -0.5, 0, 0.5, 1, 1.5], yt=[-0.5, 0, 0.5, 1], xfmt=_f02_fmt, yfmt=_f02_fmt))
    o.append(T(q.x - 36, q.y + q.h / 2, "相関", "middle", 9.5, MUT, rot=-90))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(q.line([(-1.5, 0), (-1, 0), (0, 1), (1, 0), (1.5, 0)], c=SIG, lw=2.0))
    o.append(q.line([(-1.5, 0), (-1, 0), (-0.5, -0.5), (-1 / 3, 0), (0, 1), (1 / 3, 0), (0.5, -0.5), (1, 0), (1.5, 0)], c=GRN, lw=2.2))
    o.append(D(q.X(1 / 3), q.Y(0), GRN, 3.6))
    o.append(T(q.X(1 / 3) + 5, q.Y(0) - 6, "±1/3 で 0", "start", 9.5, GRN, True, halo=True))
    o.append(T(q.X(0.5), q.Y(-0.5) + 14, "横の山 −0.5", "middle", 9.5, GRN, True, halo=True))
    o.append(T(q.X(-0.62), q.Y(0.62), "C/A", "end", 9.5, SIG, True, halo=True))
    return SVG(700, yb + 18 + 130 + 42, o, "BOC(1,1) と、C/A 符号の信号（BPSK）の比較（スペクトラムは導出した式で計算）。")
F["e02_boc"] = _f02_boc_fig()


# =====================================================================
# 5 節: 航法メッセージの中身と、受信機の使い道
# =====================================================================
def _f02_txseq(x, y, segs, sz=11, b=True):
    """色の違う部分を含む式を、1 つの text 要素で書く（TX と同じ添字・上付きの書き方）。segs = [(文字, 色), ...]。返り値 (svg, 見積もった幅)。"""
    toks = [(k, t, c) for txt, c in segs for k, t in _tx_tokens(txt)]
    w = sum(tw(t, sz * _TX_SMALL[k]) if k in _TX_SMALL else tw(t, sz) for k, t, c in toks)
    if _CHECK:
        _BOXES.append((x, y - sz * 0.82, x + w, y + sz * 0.22 + 2, "".join(t for _, t, _ in toks)))
    o = ['<text x="%g" y="%g" font-size="%g" font-family="var(--sans)" font-weight="%s">' % (round(x, 2), round(y, 2), sz, "700" if b else "400")]
    cur = 0.0
    for kind, t, c in toks:
        want = 3.0 if kind == "sub" else (-sz * 0.38 if kind == "sup" else (-sz * 0.18 if kind == "supsub" else 0.0))
        dy = want - cur
        cur = want
        fs = ' font-size="%g"' % round(sz * _TX_SMALL[kind], 2) if kind in _TX_SMALL else ""
        o.append('<tspan fill="%s"%s%s>%s</tspan>' % (c, (' dy="%g"' % round(dy, 2)) if abs(dy) > 1e-9 else "", fs, E(t)))
    o.append("</text>")
    return "".join(o), w


def _f02_navuse_fig():
    o = []
    o.append(T(14, 18, "航法メッセージの主な中身（左）と、受信機がそれで知ること（右）", "start", 11.5, INK, True))
    items = [
        ("衛星の時計のずれを計算する値", "名前: 時計の補正の値", PUR, "衛星の時計のずれ δt_i^s → 擬似距離を直す"),
        ("その衛星の精密な軌道", "名前: エフェメリス", SIG, "電波を送った時刻の衛星の位置 (x_i, y_i, z_i)（6 章）"),
        ("全部の衛星の大まかな軌道", "名前: アルマナック", GRN, "見えていそうな衛星と、探す範囲の予想（5 章）"),
        ("電離層のモデルの 8 つの係数", None, TEA, "電離層の遅れの見積もり（7 章）"),
        ("週番号（10 bit）・GPS 時刻と UTC の差", None, GLD, "日付と UTC の時刻。週番号は 1024 週で 0 に戻る（14 章）"),
        ("衛星の健康状態", None, MUT, "その衛星の電波を測位に使ってよいか"),
    ]
    for k, (lab, nm, c, use) in enumerate(items):
        y = 32 + k * 42
        o.append(RECT(14, y, 250, 34, 6, soft(c), c, 1.3))
        if nm:
            o.append(T(24, y + 14.5, lab, "start", 10.5, c, True))
            o.append(T(24, y + 28, nm, "start", 9.5, INK))
        else:
            o.append(T(24, y + 21.5, lab, "start", 10.5, c, True))
        o.append(ARR(268, y + 17, 314, y + 17, c=c, lw=1.5, head=6))
        o.append(RECT(318, y, 368, 34, 6, PAN, c, 1.1))
        o.append(TX(328, y + 21.5, use, "start", 10, INK))
    return SVG(700, 32 + 6 * 42, o, "航法メッセージ（L1 の C/A 符号の信号に載る LNAV）の主な中身と、受信機がそれで知ること。名前は、この節で定義する。")
F["e02_navuse"] = _f02_navuse_fig()


# =====================================================================
# 5 節: サブフレーム・フレーム・ページ
# =====================================================================
_F02_CONT = [("衛星の時計のずれの値・週番号・健康状態など", PUR), ("その衛星の精密な軌道", SIG), ("全部の衛星の大まかな軌道", GRN),
             ("電離層の係数・UTC との差", TEA), ("全部の衛星の健康状態", GLD), ("そのほか（予備など）", MUT)]


def _f02_page_cont(sf, pg):
    """サブフレーム sf・ページ pg の主な内容の番号（_F02_CONT の添字）。"""
    if sf == 1:
        return 0
    if sf in (2, 3):
        return 1
    if sf == 5:
        return 2 if pg <= 24 else 4
    if pg in (2, 3, 4, 5, 7, 8, 9, 10):
        return 2
    if pg == 18:
        return 3
    if pg == 25:
        return 4
    return 5


def _f02_subframes_fig():
    o = []
    o.append(T(14, 18, "(a) 1 フレーム（30 s）= 5 つのサブフレーム（6 s、300 bit）", "start", 11.5, INK, True))
    x0, wsf, y0 = 80, 122, 56
    for xa, xb_, lab, c in ((x0, x0 + 3 * wsf - 2, "サブフレーム 1〜3（900 bit・18 s）: どのフレームでも同じ内容", PUR),
                            (x0 + 3 * wsf, x0 + 5 * wsf - 2, "4・5: フレームごとに違うページ", MUT)):
        o.append(W(xa, y0 - 4, xa, y0 - 10, xb_, y0 - 10, xb_, y0 - 4, c=c, lw=1.2))
        o.append(T((xa + xb_) / 2, y0 - 15, lab, "middle", 9.5, c if c != MUT else INK, True))
    sub = ["時計のずれの値など", "精密な軌道（前半）", "精密な軌道（後半）", "ページごとに変わる", "ページごとに変わる"]
    cc = [PUR, SIG, SIG, MUT, MUT]
    for k in range(5):
        o.append(RECT(x0 + k * wsf, y0, wsf - 2, 36, 4, soft(cc[k]), cc[k], 1.3))
        o.append(T(x0 + k * wsf + (wsf - 2) / 2, y0 + 15, "サブフレーム %d" % (k + 1), "middle", 10, cc[k], True))
        o.append(T(x0 + k * wsf + (wsf - 2) / 2, y0 + 29, sub[k], "middle", 9, INK))
    for k in range(6):
        o.append(T(x0 + k * wsf - (1 if k == 5 else 0), y0 + 50, "%d s" % (6 * k), "middle", 9, MUT))
    o.append(T(14, y0 + 23, "時間 →", "start", 9.5, MUT))
    # ワードへの拡大
    yw = y0 + 80
    o.append(W(x0, y0 + 55, x0, yw, c=FNT, lw=1, dash="3 3"))
    o.append(W(x0 + wsf - 2, y0 + 55, x0 + 5 * wsf - 2, yw, c=FNT, lw=1, dash="3 3"))
    ww = (5 * wsf - 2) / 10
    for k in range(10):
        lab = str(k + 1)
        c = GLD if k < 2 else PUR
        o.append(RECT(x0 + k * ww, yw, ww - 2, 22, 3, soft(c), c, 1.1))
        o.append(T(x0 + k * ww + (ww - 2) / 2, yw + 15, lab, "middle", 9.5, c, True))
    o.append(T(14, yw + 15, "10 ワード", "start", 9.5, MUT))
    o.append(T(x0, yw + 38, "1 ワード = 30 bit = 0.6 s（最後の 6 bit はパリティ）。初めの 2 ワードは 6 節で見る", "start", 9.5, MUT))
    # (b) 25 ページ
    yb = y0 + 154
    o.append(T(14, yb, "(b) 25 フレーム（12.5 分）の並び: サブフレーム 4・5 は、フレームごとに違うページを送る", "start", 11.5, INK, True))
    gx, gy, cw, ch = 96, yb + 30, 23.6, 18
    for pg in range(1, 26):
        if pg in (1, 5, 10, 15, 20, 25):
            o.append(T(gx + (pg - 0.5) * cw, gy - 5, str(pg), "middle", 9, MUT))
    o.append(T(gx - 8, gy - 5, "ページ", "end", 9, MUT))
    for sf in range(1, 6):
        yy = gy + (sf - 1) * (ch + 2)
        o.append(T(gx - 8, yy + 13, "サブフレーム %d" % sf, "end", 9, MUT))
        for pg in range(1, 26):
            ci = _f02_page_cont(sf, pg)
            c = _F02_CONT[ci][1]
            o.append(RECT(gx + (pg - 1) * cw, yy, cw - 1.6, ch, 1.5, soft(c), c, 0.9))
    ya = gy + 5 * (ch + 2) + 4
    for pg, lab in ((0, "0"), (10, "5 分"), (20, "10 分"), (25, "12.5 分")):
        o.append(W(gx + pg * cw, ya - 4, gx + pg * cw, ya + 2, c=MUT, lw=1))
        o.append(T(gx + pg * cw + (2 if pg == 25 else 0), ya + 13, lab, "end" if pg == 25 else "middle", 9, MUT))
    ly = ya + 34
    xs = [14, 248, 458]
    for k, (lab, c) in enumerate(_F02_CONT):
        xx = xs[k % 3]
        yy = ly + (k // 3) * 18
        o.append(RECT(xx, yy - 10, 12, 12, 2, soft(c), c, 1.1))
        o.append(T(xx + 17, yy, lab, "start", 9.5, INK))
    o.append(T(14, ly + 40, "大まかな軌道は、サブフレーム 5 の 1〜24 ページに衛星 1〜24 の分、サブフレーム 4 の 2〜5・7〜10 ページに衛星 25〜32 の分", "start", 9.5, MUT))
    return SVG(700, ly + 50, o, "LNAV の航法メッセージの並び（IS-GPS-200 による）。")
F["e02_subframes"] = _f02_subframes_fig()


# =====================================================================
# 5 節: 衛星の時計のずれと補正
# =====================================================================
def _f02_satclock_fig():
    o = []
    o.append(T(14, 18, "3 つの時計の読み（横の位置は読みの値。ずれは大きく描いた）", "start", 11.5, INK, True))
    ax0, ax1 = 60, 650
    axs = [(56, "GPS 時刻（正しい時刻）", GRN), (110, "衛星 i の時計", SIG), (164, "受信機の時計", ALI)]
    for y, lab, c in axs:
        o.append(ARR(ax0, y, ax1, y, c=c, lw=1.2, head=6))
        o.append(T(ax1, y - 7, lab, "end", 9.5, c, True))
    xt, xr, ds, dr = 150, 480, 62, 40
    o.append(W(xt, 48, xt, 64, c=INK, lw=1.6))
    o.append(TX(xt, 80, "送った t_{tx,i}", "middle", 9.5, INK, True, halo=True))
    o.append(W(xr, 48, xr, 64, c=INK, lw=1.6))
    o.append(TX(xr, 80, "届いた t_{rx}", "middle", 9.5, INK, True, halo=True))
    o.append(DIM(xt, 40, xr, 40, None, c=GRN))
    o.append(TX((xt + xr) / 2, 36, "電波が届くまでの時間 r_i / c", "middle", 9.5, GRN, True, halo=True))
    o.append(W(xt, 64, xt, 118, c=FNT, lw=1, dash="3 3"))
    o.append(W(xt + ds, 102, xt + ds, 118, c=SIG, lw=1.8))
    o.append(DIM(xt, 96, xt + ds, 96, None, c=SIG))
    o.append(TX(xt + ds / 2, 92, "δt_i^s", "middle", 9.5, SIG, True, halo=True))
    o.append(TX(xt + ds - 6, 134, "読み t_{tx,i} + δt_i^s（衛星が電波に載せる、送った時刻の目印）", "start", 9.5, SIG, True, halo=True))
    o.append(W(xr, 64, xr, 172, c=FNT, lw=1, dash="3 3"))
    o.append(W(xr + dr, 156, xr + dr, 172, c=ALI, lw=1.8))
    o.append(DIM(xr, 150, xr + dr, 150, None, c=ALI))
    o.append(TX(xr + dr / 2, 146, "δt_r", "middle", 9.5, ALI, True, halo=True))
    o.append(TX(xr + dr, 188, "読み t_{rx} + δt_r", "middle", 9.5, ALI, True, halo=True))
    o.append(W(xt + ds, 118, xt + ds, 212, c=FNT, lw=1, dash="3 3"))
    o.append(W(xr + dr, 172, xr + dr, 212, c=FNT, lw=1, dash="3 3"))
    o.append(DIM(xt + ds, 206, xr + dr, 206, None, c=GLD))
    o.append(TX((xt + ds + xr + dr) / 2, 222, "受信機が測る、2 つの読みの差 = ρ_i / c", "middle", 9.5, GLD, True, halo=True))
    return SVG(700, 232, o, "擬似距離の導出に使う 3 つの時計の読み（衛星の時計も受信機の時計も、進んでいる場合を描いた）。")
F["e02_satclock"] = _f02_satclock_fig()


# =====================================================================
# 5 節: 時計の補正の値で計算した衛星の時計のずれと、擬似距離の直し方
# =====================================================================
def _f02_clockcorr_fig():
    o = []
    af0, af1, af2 = 1.0e-4, 1.0e-11, 0.0
    dts = lambda h: af0 + af1 * (h * 3600.0) + af2 * (h * 3600.0) ** 2      # t − t_oc が h 時間のときのずれ [s]
    o.append(TX(14, 18, "(a) 時計の補正の値で計算した δt_i^s（例の値）", "start", 11.5, INK, True))
    p = Plot(74, 44, 230, 140, (-2, 2), (99.9, 100.1))
    o.append(p.axes(xl="t − t_{oc} [時間]", yl=None, xt=[-2, -1, 0, 1, 2], yt=[99.9, 99.95, 100, 100.05, 100.1], xfmt=_f02_fmt, yfmt=lambda v: "%.2f" % v))
    o.append(TX(p.x - 48, p.y + p.h / 2, "δt_i^s [μs]", "middle", 9.5, MUT, rot=-90))
    o.append(p.line([(h, dts(h) * 1e6) for h in (-2, 2)], c=PUR, lw=2.2))
    o.append(D(p.X(0), p.Y(dts(0) * 1e6), PUR, 4))
    o.append(W(p.x + p.w, p.y, p.x + p.w, p.y + p.h, c=MUT, lw=1))
    for km in (29.96, 29.97, 29.98, 29.99, 30.0):
        us = km * 1e3 / _F02_C * 1e6
        yy = p.Y(us)
        o.append(W(p.x + p.w, yy, p.x + p.w + 4, yy, c=MUT, lw=1))
        o.append(T(p.x + p.w + 7, yy + 3.3, "%.2f" % km, "start", 9, MUT))
    o.append(TX(p.x + p.w + 50, p.y + p.h / 2, "c δt_i^s [km]", "middle", 9.5, MUT, rot=90))
    # 例の値と、計算した値
    xr = 400
    o.append(T(xr, 52, "例の値", "start", 10, PUR, True))
    o.append(TX(xr, 69, "a_{f0} = 1.0 × 10^{−4} s（100 μs）", "start", 10, INK))
    o.append(TX(xr, 85, "a_{f1} = 1.0 × 10^{−11} s/s、a_{f2} = 0", "start", 10, INK))
    o.append(T(xr, 114, "計算した値", "start", 10, PUR, True))
    o.append(TX(xr, 131, "t = t_{oc}: δt_i^s = %.0f μs、c δt_i^s = %.2f km" % (dts(0) * 1e6, _F02_C * dts(0) / 1e3), "start", 10, INK))
    for k, h in enumerate((1, 2)):
        d = dts(h) - dts(0)
        o.append(T(xr, 148 + k * 17, "%d 時間後: さらに %.0f ns（%.1f m）" % (h, d * 1e9, _F02_C * d), "start", 10, INK))
    # (b) 擬似距離の直し方
    yc = 238
    o.append(T(14, yc, "(b) 擬似距離の直し方", "start", 11.5, INK, True))
    xa, xb2 = 150, 560
    o.append(W(60, yc + 34, 660, yc + 34, c=LIN, lw=1.2))
    o.append(W(xa, yc + 26, xa, yc + 42, c=ALI, lw=2))
    o.append(TX(xa, yc + 58, "測った ρ_i = r_i + b − c δt_i^s", "middle", 10, ALI, True, halo=True))
    o.append(W(xb2, yc + 26, xb2, yc + 42, c=GRN, lw=2))
    o.append(TX(xb2, yc + 58, "直した値 ρ_i + c δt_i^s = r_i + b", "middle", 10, GRN, True, halo=True))
    o.append(CARR(xa + 6, yc + 24, xb2 - 6, yc + 24, bend=-0.08, c=PUR, lw=1.6))
    o.append(TX((xa + xb2) / 2, yc + 6, "+ c δt_i^s（例の値で %.2f km）" % (_F02_C * dts(0) / 1e3), "middle", 10, PUR, True, halo=True))
    o.append(T(660, yc + 50, "距離 →", "end", 9, MUT))
    return SVG(700, yc + 70, o, "衛星の時計のずれの補正（例の値。(a) の右の目盛は、ずれに光の速さを掛けた距離）。")
F["e02_clockcorr"] = _f02_clockcorr_fig()


# =====================================================================
# 6 節: 時間の入れ子（12.5 分から搬送波の 1 周期まで）
# =====================================================================
def _f02_nest_fig():
    o = []
    o.append(T(14, 18, "L1 の C/A 符号の信号の時間の区切り（上の段の色の付いた 1 つを、下の段で拡大する）", "start", 11.5, INK, True))
    X0, X1 = 196, 690
    levels = [
        ("全部のページ 12.5 分", "25 フレーム。光で 2.2 億 km", 25, 6, MUT, None),
        ("フレーム 30 s", "5 サブフレーム。光で 900 万 km", 5, 0, PUR, ["サブフレーム %d" % (k + 1) for k in range(5)]),
        ("サブフレーム 6 s", "10 ワード。光で 180 万 km", 10, 3, PUR, [str(k) for k in range(1, 11)]),
        ("ワード 0.6 s", "30 bit。光で 18 万 km", 30, 17, GLD, None),
        ("ビット 20 ms", "符号 20 周期。光で 6000 km", 20, 6, GLD, None),
        ("符号の周期 1 ms", "1023 チップ。光で 300 km", 1023, 412, SIG, None),
        ("チップ 977.5 ns", "搬送波 1540 周期。光で 293 m", 1540, 0, SIG, None),
        ("搬送波の 1 周期 0.635 ns", "光で 19.0 cm", 1, 0, MUT, None),
    ]
    y = 40
    bh, gap = 18, 34
    for li, (nm, sub, n, hl, c, labs) in enumerate(levels):
        o.append(T(14, y + 8, nm, "start", 10, c if c != MUT else INK, True))
        o.append(T(14, y + 21, sub, "start", 9, MUT))
        w = (X1 - X0) / n
        if li <= 4:
            for k in range(n):
                on = k == hl
                par = li == 3 and k >= 24
                fc = soft(c) if on else (TSOFT if par else PAN)
                o.append(RECT(X0 + k * w, y, w - (1.2 if n < 40 else 0.6), bh, 1.5, fc, c if on else (TEA if par else LIN), 1.6 if on else 0.8))
                if labs:
                    o.append(T(X0 + k * w + w / 2, y + 13, labs[k], "middle", 9 if n == 5 else 8.5, c if on else MUT, on))
            if li == 3:
                o.append(T(X0 + 27 * w, y + bh + 11, "パリティ", "middle", 8.5, TEA, False, halo=True))
            hx0, hx1 = X0 + hl * w, X0 + (hl + 1) * w
        elif li == 5:
            v = list(_f02_pm(1))
            o.append(RECT(X0, y, X1 - X0, bh, 1.5, PAN, LIN, 0.8))
            o.append(_f02_wave(X0, y + bh / 2, 6.5, v, w, c=SIG, lw=0.7))
            hx0, hx1 = X0 + hl * w - 1.5, X0 + (hl + 1) * w + 1.5
            o.append(RECT(hx0, y - 2, hx1 - hx0, bh + 4, 1, SSOFT, SIG, 1.6))
            o.append(T(hx1 + 3, y - 4, "チップ %d" % hl, "start", 8.5, SIG))
        elif li == 6:
            ncy = 40
            pts = [(X0 + (X1 - X0) * k / (ncy * 16), y + bh / 2 - 7 * math.sin(2 * math.pi * k / 16)) for k in range(ncy * 16 + 1)]
            o.append(RECT(X0, y, X1 - X0, bh, 1.5, SSOFT, SIG, 1.0))
            o.append(PL(pts, c=MUT, lw=0.9))
            hx0, hx1 = X0, X0 + (X1 - X0) / ncy
            o.append(RECT(hx0, y - 2, hx1 - hx0, bh + 4, 1, "none", INK, 1.6))
            o.append(T(X1, y + bh + 11, "図は 40 周期に間引いた（実際は 1540 周期）", "end", 8.5, MUT, False, halo=True))
        else:
            pts = [(X0 + (X1 - X0) * k / 200, y + bh / 2 - 9 * math.sin(2 * math.pi * k / 200)) for k in range(201)]
            o.append(W(X0, y + bh / 2, X1, y + bh / 2, c=GRD, lw=1))
            o.append(PL(pts, c=INK, lw=1.8))
        if li < len(levels) - 1:
            o.append(W(hx0, y + bh, X0, y + bh + gap, c=FNT, lw=1, dash="3 3"))
            o.append(W(hx1, y + bh, X1, y + bh + gap, c=FNT, lw=1, dash="3 3"))
        y += bh + gap
    return SVG(700, y - gap + 12, o, "L1 の C/A 符号の信号の時間の区切り（規格の値。「光で」は、その時間に光が進む距離。符号の周期の段は、PRN 1 の実際の並び）。")
F["e02_nest"] = _f02_nest_fig()


# =====================================================================
# 6 節: TLM と HOW のビットの並び
# =====================================================================
_F02_PRE = "10001011"       # プリアンブル（IS-GPS-200）
_F02_HOW = 57601            # 6 節の例の HOW の値（次のサブフレームが始まる時刻を 6 s 単位で数えた値）


def _f02_tlmhow_fig():
    o = []
    o.append(T(14, 18, "各サブフレームの最初の 2 ワード（1 ワード = 30 bit。左のビットから先に送る）", "start", 11.5, INK, True))
    X0, bwd = 84, 20
    def field(y, b0, b1, c, lab, bits=None, sz=9.5):
        """b0〜b1 ビット目（1 から数える）の欄。bits があれば 1 ビットずつ値を書く。"""
        x = X0 + (b0 - 1) * bwd
        w = (b1 - b0 + 1) * bwd
        o.append(RECT(x, y, w - 2, 24, 3, soft(c), c, 1.2))
        if bits:
            for j, ch in enumerate(bits):
                o.append(T(x + j * bwd + (bwd - 2) / 2, y + 16.5, ch, "middle", 11, c, True, True))
                if j:
                    o.append(W(x + j * bwd - 1, y + 3, x + j * bwd - 1, y + 21, c=c, lw=0.6))
        elif lab:
            o.append(T(x + (w - 2) / 2, y + 16, lab, "middle", sz, c if c != MUT else INK, c != MUT))
    def nums(y, lst):
        for b in lst:
            o.append(T(X0 + (b - 0.5) * bwd - 1, y - 4, str(b), "middle", 8.5, MUT))
    inv = "".join("1" if ch == "0" else "0" for ch in _F02_PRE)
    # TLM
    y1 = 48
    o.append(T(14, y1 + 12, "TLM", "start", 12, GLD, True))
    o.append(T(14, y1 + 26, "1 ワード目", "start", 9.5, MUT))
    nums(y1, [1, 8, 9, 24, 25, 30])
    field(y1, 1, 8, GLD, None, bits=_F02_PRE)
    field(y1, 9, 24, MUT, "そのほかの 16 bit")
    field(y1, 25, 30, TEA, "パリティ 6 bit")
    o.append(T(X0, y1 + 40, "プリアンブル（8 bit）: いつも %s" % _F02_PRE, "start", 10, GLD, True))
    o.append(T(X0, y1 + 55, "搬送波の位相を 180° 取り違えると、全部のビットが反転して %s に見える" % inv, "start", 9.5, ALI))
    # HOW
    y2 = 142
    o.append(T(14, y2 + 12, "HOW", "start", 12, PUR, True))
    o.append(T(14, y2 + 26, "2 ワード目", "start", 9.5, MUT))
    nums(y2, [1, 17, 18, 20, 22, 25, 30])
    field(y2, 1, 17, PUR, "次のサブフレームが始まる時刻（17 bit）")
    field(y2, 18, 19, MUT, None)
    field(y2, 20, 22, SIG, "番号")
    field(y2, 23, 24, MUT, None)
    field(y2, 25, 30, TEA, "パリティ 6 bit")
    o.append(T(X0, y2 + 40, "GPS 時刻の週の始まりから、6 s 単位で数えた値。例: %s → %s × 6 s = %s s"
               % (_f02_g(_F02_HOW), _f02_g(_F02_HOW), _f02_g(_F02_HOW * 6)), "start", 10, PUR, True))
    o.append(T(X0, y2 + 55, "18・19 bit 目: 2 つのフラグ、20〜22 bit 目: サブフレームの番号（1〜5）、23・24 bit 目: パリティの計算の調整", "start", 9.5, MUT))
    return SVG(700, y2 + 66, o, "TLM と HOW のビットの並び（IS-GPS-200 による。HOW の値は、この節の例の値）。")
F["e02_tlmhow"] = _f02_tlmhow_fig()


# =====================================================================
# 6 節: 送った時刻を数える（筆算）と、1 ms ごとの候補
# =====================================================================
def _f02_txtime_fig():
    from fractions import Fraction as Fr
    o = []
    o.append(T(14, 18, "(a) いま届いているチップを送った時刻を、区切りを数えて足し合わせる", "start", 11.5, INK, True))
    xn = 470
    def sec(v, d=8):
        """秒の値を、小数 d 桁で、3 桁ごとに空白を入れて書く。"""
        q = Fr(v).limit_denominator(10 ** 15)
        n = int(round(q * 10 ** d))
        ip, fp = divmod(abs(n), 10 ** d)
        fs = ("%0" + str(d) + "d") % fp
        return ("−" if n < 0 else "") + _f02_g(ip) + "." + " ".join(fs[i:i + 3] for i in range(0, d, 3)) + " s"
    nw, nb, nc, nchip = 3, 17, 6, Fr("412.30")
    t_sf = Fr(_F02_HOW * 6 - 6)                    # いまのサブフレームの始まり [s]
    parts = [t_sf, Fr(6, 10) * nw, Fr(2, 100) * nb, Fr(1, 1000) * nc, nchip / Fr(1023000)]
    t_tx = sum(parts)
    t_rx = Fr("345602.21875")                      # 受信機の時計で読んだ、届いた時刻 [s]（例の値）
    dt = t_rx - t_tx
    rho_km = float(dt) * _F02_C / 1e3
    rows = [
        ("", "サブフレームの始まり（HOW の %s × 6 s − 6 s）" % _f02_g(_F02_HOW), sec(parts[0]), PUR, "HOW から"),
        ("＋", "0.6 s × %d ワード" % nw, sec(parts[1]), PUR, "ワードを数える"),
        ("＋", "20 ms × %d bit" % nb, sec(parts[2]), GLD, "ビットを数える"),
        ("＋", "1 ms × %d 周期" % nc, sec(parts[3]), SIG, "符号の周期を数える"),
        ("＋", "%.3f ns × %.2f チップ" % (_F02_TC * 1e9, float(nchip)), sec(parts[4]), SIG, "チップと端数（3 節）"),
    ]
    y = 44
    for sg, lab, val, c, how in rows:
        o.append(T(30, y, sg, "middle", 11, INK, True))
        o.append(T(44, y, lab, "start", 10, c, True))
        o.append(T(xn, y, val, "end", 10.5, INK, False, True))
        o.append(CHIP(xn + 16, y, how, c, 9)[0])
        y += 21
    o.append(W(40, y - 12, xn + 4, y - 12, c=INK, lw=1.2))
    o.append(T(30, y + 4, "＝", "middle", 11, INK, True))
    o.append(T(44, y + 4, "送った時刻", "start", 10.5, INK, True))
    o.append(T(xn, y + 4, sec(t_tx), "end", 10.5, GRN, True, True))
    y += 26
    o.append(T(44, y, "受信機の時計で、このチップが届いた時刻", "start", 10, ALI, True))
    o.append(T(xn, y, sec(t_rx), "end", 10.5, ALI, False, True))
    y += 21
    o.append(T(44, y, "差（届いた時間 ＋ 受信機の時計のずれ）", "start", 10, INK))
    o.append(T(xn, y, sec(dt), "end", 10.5, INK, False, True))
    y += 21
    o.append(T(44, y, "× 光の速さ ＝ 擬似距離", "start", 10, GLD, True))
    o.append(T(xn, y, _f02_g(rho_km, 2) + " km", "end", 10.5, GLD, True, True))
    # (b) 1 ms ごとの候補
    yb = y + 40
    o.append(T(14, yb, "(b) 符号のずれだけでは、1 ms の何周期目かが分からない", "start", 11.5, INK, True))
    p = Plot(70, yb + 30, 600, 10, (66, 87), (0, 1))
    ya = yb + 50
    o.append(W(p.x, ya, p.x + p.w, ya, c=MUT, lw=1.2))
    for t in range(66, 88, 2):
        o.append(W(p.X(t), ya, p.X(t), ya + 4, c=MUT, lw=1))
        o.append(T(p.X(t), ya + 15, "%d" % t, "middle", 9, MUT))
    o.append(T(p.x + p.w / 2, ya + 31, "電波が届くまでの時間 [ms]（受信機の時計のずれを含む）", "middle", 10, MUT))
    ms = float(dt) * 1e3
    frac, kk = ms - math.floor(ms), int(math.floor(ms))
    cand = [k for k in range(60, 95) if 67 <= k + frac <= 86]     # 67〜86 ms の中の候補
    for k in cand:
        t = k + frac
        hl = k == kk
        o.append(W(p.X(t), ya - (34 if hl else 14), p.X(t), ya, c=GLD if hl else FNT, lw=2.4 if hl else 1.4))
    o.append(T(p.X(kk + frac) + 6, ya - 25, "区切りを数えると %.3f ms に決まる" % ms, "start", 9.5, GLD, True, halo=True))
    o.append(T(p.x, ya + 48, "灰色の線: 符号のずれだけで分かる候補（%.3f ms ＋ 整数 ms。67〜86 ms の中に %d 通り、1 ms は光の速さで 300 km）" % (frac, len(cand)), "start", 9.5, MUT))
    return SVG(700, ya + 58, o, "送った時刻の数え方（例の値。時刻は、GPS 時刻の週の始まりから数えた秒）。")
F["e02_txtime"] = _f02_txtime_fig()
