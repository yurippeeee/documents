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
        (142, "× 1", "10.23 M チップ/s", "L5 の符号のチップレート（2 節）", TEA),
        (172, "÷ 10", "1.023 M チップ/s", "C/A 符号のチップレート（1 チップ 977.5 ns）", TEA),
        (214, "÷ 10 230", "1 kHz", "C/A 符号の周期（1 ms ごとに繰り返す。2 節）", PUR),
        (244, "÷ 204 600", "50 Hz", "航法メッセージのデータ（50 bit/s。5 節）", PUR),
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
    o.append(T(358, 201, "符号とデータの区切り（6 節）", "start", 9.5, PUR, True))
    o.append(T(14, 196, "1 チップの間に L1 の搬送波は", "start", 9.5, MUT))
    o.append(T(14, 211, "1540 周期（154 × 10）、1 bit の", "start", 9.5, MUT))
    o.append(T(14, 226, "間に C/A 符号は 20 周期入る", "start", 9.5, MUT))
    return SVG(700, 258, o, "GPS の衛星は、原子時計を基準にして作る 10.23 MHz を、整数倍にしたり整数で割ったりして、搬送波の周波数・符号のチップレート・データの速さを作る（規格の値）。どれも同じ基準から作るので、搬送波の周期・チップ・符号の周期・データのビットの区切りは、互いにずれずに入れ子になる。")
F["e02_clocktree"] = _f02_clocktree_fig()


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
    o.append(T(14, 18, "各衛星系の主な搬送波（棒の幅は、電力の大部分が入る幅の目安。4 節）", "start", 11.5, INK, True))
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
            for f0, df, lab, lx in ((1246.0, 0.4375, "G2 1243〜1249", 1246.0), (1602.0, 0.5625, "G1 1598〜1605", 1602.0)):
                for ch in range(-7, 7):
                    fc = f0 + df * ch
                    x0, x1 = X(fc - 0.511), X(fc + 0.511)
                    o.append(RECT(x0, y - 7, x1 - x0, 14, 0.5, soft(c), c, 0.7))
                o.append(T(X(lx), y - 11, lab, "middle", 9.5, c, True, halo=True))
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
    return SVG(700, ya + 42, o, "各衛星系の主な搬送波の周波数（各規格の値、書いた時点）。点線は、GPS・Galileo・BeiDou・みちびきが共通に使う 1176.45 MHz と 1575.42 MHz。GLONASS の G1・G2 は、衛星ごとに 0.5625 MHz（G2 は 0.4375 MHz）ずつずらした 14 の周波数を使う。灰色の範囲は、衛星による測位のために割り当てられた周波数の範囲。棒の幅は、各信号の電力の大部分が入る幅（4 節の主ローブ）の目安で、チップレートが高い信号ほど広い。")
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
    o.append(T(14, 238, "どの衛星も同じ 511 チップの符号を使い、", "start", 10, INK))
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
        o.append(T(xb + 36, yy + 4, "PRN %d" % prn, "end", 9.5, c, True))
        vals = list(_f02_pm(prn)[:24])
        o.append(_f02_wave(xb + 44, yy, 7, vals, 10.5, c=c, lw=1.5))
    o.append(T(xb + 44, yc + 74, "最初の 24 チップ。衛星ごとに並びが違い、受信機は", "start", 9.5, MUT))
    o.append(T(xb + 44, yc + 88, "符号の相関（3 節）で 1 つを選ぶ", "start", 9.5, MUT))
    return SVG(700, 304, o, "同じ周波数の範囲を多くの衛星で分け合う 2 つの方法。(a) FDMA: GLONASS の G1 は、衛星ごとに 1602 MHz から 0.5625 MHz ずつずらした周波数で送る（山の形は、チップレート 0.511 M チップ/s の符号の電力の形。4 節）。(b) CDMA: GPS の衛星は、全部が同じ 1575.42 MHz で、同じ形の電力の山が完全に重なる。衛星ごとに違う符号を載せてあるので、受信機は符号で分ける。")
F["e02_fdma"] = _f02_fdma_fig()


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
    o.append(T(60, y1 + 13, "G1", "start", 12, SIG, True))
    o.append(TX(60, y1 + 28, "1 + x^3 + x^{10}", "start", 9.5, SIG))
    yb = y1 + 40
    for j in (3, 10):
        o.append(W(cx(j), y1 + 24, cx(j), yb, c=SIG, lw=1.4))
        o.append(D(cx(j), yb, SIG, 2.6))
    o.append(W(cx(10), yb, 146, yb, c=SIG, lw=1.4))
    o.append(_f02_xor(138, yb, c=SIG))
    o.append(W(138, yb - 8, 138, y1 + 12, c=SIG, lw=1.4))
    o.append(ARR(138, y1 + 12, x0, y1 + 12, c=SIG, lw=1.4, head=6))
    o.append(T(cx(6), yb + 13, "帰還のタップ: 3・10 段目", "middle", 9.5, SIG, False, halo=True))
    o.append(T(x0 + 10 * cw, y1 - 16, "1 クロックごとに 1 段ずつ右へ送る →", "end", 9, MUT))
    # ---- G2 ----
    y2 = 156
    _f02_reg(o, x0, y2, [1] * 10, hl=(2, 3, 6, 8, 9, 10), c=GRN)
    o.append(T(60, y2 + 13, "G2", "start", 12, GRN, True))
    o.append(TX(18, y2 + 50, "1 + x^2 + x^3 + x^6 + x^8 + x^9 + x^{10}", "start", 9.5, GRN))
    yb2 = y2 + 40
    for j in (2, 3, 6, 8, 9, 10):
        o.append(W(cx(j), y2 + 24, cx(j), yb2, c=GRN, lw=1.4))
        o.append(D(cx(j), yb2, GRN, 2.6))
    o.append(W(cx(10), yb2, 146, yb2, c=GRN, lw=1.4))
    o.append(_f02_xor(138, yb2, c=GRN))
    o.append(W(138, yb2 - 8, 138, y2 + 12, c=GRN, lw=1.4))
    o.append(ARR(138, y2 + 12, x0, y2 + 12, c=GRN, lw=1.4, head=6))
    o.append(T(cx(7) + 8, yb2 + 13, "帰還のタップ: 2・3・6・8・9・10 段目", "middle", 9.5, GRN, False, halo=True))
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
    yt = 236
    o.append(W(14, yt - 16, 686, yt - 16, c=LIN, lw=0.8))
    hdr = [(40, "n", "end"), (62, "G1（1〜10 段）", "start"), (172, "G2（1〜10 段）", "start"), (300, "G1 の 10 段目", "start"),
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
    o.append(T(14, yz, "出力の最初の 10 チップ 1100100000 を、左から 1 桁と 3 桁ずつに区切ると 1｜100｜100｜000 で、8 進数で 1440（規格の表と同じ）", "start", 10, INK, True))
    return SVG(700, yz + 10, o, "IS-GPS-200 の C/A 符号の作り方（PRN 1）。G1・G2 は 10 段のシフトレジスタで、全部の段を 1 にしてから始める。1 クロックごとに、出力のチップ（G1 の 10 段目、G2 の 2 段目と 6 段目の排他的論理和）を決め、帰還のタップの排他的論理和を計算し、全体を 1 段ずつ右へ送って、計算した値を 1 段目に入れる。表は最初の 10 クロックの各段の値（太字の段から出力を作る）。")
F["e02_lfsr"] = _f02_lfsr_fig()


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
    o.append(T(xb, 60 + 5 * 17 + 2, "PRN 1〜32 の全部が規格の表と一致", "start", 9.5, GRN, True))
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
        o.append(D(p.X(L), p.Y(256 / 2 ** (L - 1)), GLD, 3.0))
    o.append(T(p.x + p.w - 2, p.y + 10, "● 半分ずつ減る数（256, 128, 64, …）", "end", 9, GLD, True, halo=True))
    # 1 と 0 の数
    xr = 430
    o.append(T(xr, yd + 32, "1 と 0 の数（PRN 1）", "start", 10, INK, True))
    for k, (lab, n, c) in enumerate((("0（+1）", 511, SIG), ("1（−1）", 512, GRN))):
        yy = yd + 46 + k * 26
        o.append(T(xr + 50, yy + 12, lab, "end", 10, c, True))
        o.append(RECT(xr + 58, yy, 180 * n / 512, 16, 2, soft(c), c, 1.1))
        o.append(T(xr + 58 + 180 * n / 512 + 6, yy + 12, str(n), "start", 10, c, True))
    o.append(T(xr, yd + 112, "PRN 1〜32 のすべてで 511 と 512。", "start", 9.5, MUT))
    o.append(T(xr, yd + 126, "コインを投げた列のように、ほぼ半々", "start", 9.5, MUT))
    return SVG(700, yd + 160, o, "C/A 符号（IS-GPS-200 の作り方で計算）。(a) PRN 1 と PRN 2 の最初の 18 チップ。0 を +1、1 を −1 として描いた。(b) 最初の 10 チップを 8 進数で書いた値は、規格の表の値と一致する。(c) 1 周期の 1023 チップには、目で分かる規則が見えない。(d) 同じ値が続く区間（連）の数は、長さが 1 増えるごとにほぼ半分になる。表と裏が等しく出るコインを投げた列と同じ傾向である。")
F["e02_chips"] = _f02_chips_fig()
