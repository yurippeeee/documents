# -*- coding: utf-8 -*-
# 09 章 アナログ値を正しく測る の図

import random as _f09_random

# ---- 補助: 記号・回路の部品 ----
def _f09_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    pend = 0
    for s, sub, it in parts:
        o.append('<tspan font-style="%s"%s>%s</tspan>' % ("italic" if it else "normal", (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan>' % (sz * 0.72, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)

def _f09_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f09_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f09_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return (W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6)
            + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2))

def _f09_capv(x, y1, y2, c=INK, lw=1.5):
    """縦向きのコンデンサ（y1 から y2 へ）。"""
    ym = (y1 + y2) / 2
    return (W(x, y1, x, ym - 3, c=c, lw=lw) + W(x - 9, ym - 3, x + 9, ym - 3, c=c, lw=2)
            + W(x - 9, ym + 3, x + 9, ym + 3, c=c, lw=2) + W(x, ym + 3, x, y2, c=c, lw=lw))

def _f09_swh(x1, x2, y, closed, c=INK):
    """横向きのスイッチ（x1 から x2 へ）。"""
    xm1, xm2 = x1 + (x2 - x1) * 0.3, x1 + (x2 - x1) * 0.7
    o = W(x1, y, xm1, y, c=c, lw=1.5) + W(xm2, y, x2, y, c=c, lw=1.5) + D(xm1, y, c, 2.4) + D(xm2, y, c, 2.4)
    o += W(xm1, y, xm2, y if closed else y - 10, c=c, lw=1.8)
    return o

def _f09_swv(x, y1, y2, closed, c=INK):
    """縦向きのスイッチ（y1 から y2 へ）。"""
    ym1, ym2 = y1 + (y2 - y1) * 0.3, y1 + (y2 - y1) * 0.7
    o = W(x, y1, x, ym1, c=c, lw=1.5) + W(x, ym2, x, y2, c=c, lw=1.5) + D(x, ym1, c, 2.4) + D(x, ym2, c, 2.4)
    o += W(x, ym1, x + (0 if closed else 10), ym2, c=c, lw=1.8)
    return o

def _f09_diode_up(x, y, c=INK, s=6):
    """上向き（下から上へ電流を通す）のダイオード。(x, y) は三角の先（上）。"""
    return (PL([(x - s, y + 1.6 * s), (x + s, y + 1.6 * s), (x, y)], c=c, lw=1.3, fill=soft(c))
            + W(x - s, y, x + s, y, c=c, lw=1.8))

def _f09_g(v, d=3):
    """有効数字 d 桁で、末尾の 0 を落とした文字。"""
    if v == 0:
        return "0"
    s = "%.*g" % (d, v)
    if "e" in s:
        s = "%.*f" % (max(0, d - 1 - int(math.floor(math.log10(abs(v))))), v)
    return s

# ---- 例の値（本文と同じ） ----
_F09_R25, _F09_B, _F09_T25 = 10000.0, 3435.0, 298.15
def _f09_rntc(tc):
    return _F09_R25 * math.exp(_F09_B * (1.0 / (tc + 273.15) - 1.0 / _F09_T25))
def _f09_tntc(r):
    return 1.0 / (1.0 / _F09_T25 + math.log(r / _F09_R25) / _F09_B) - 273.15
def _f09_tsensor(vb, vnom=3.0, vin=0.75):
    """電源電圧 vb を基準に測り、vnom だと思って換算した温度 [°C]（出力 0.5 V + 10 mV/°C）。"""
    return (vin * vnom / vb - 0.5) / 0.01

# ---- 1 節: 標本化と量子化 ----
def _f09_adc():
    o = []
    L = 0.375
    def Nq(v):
        return min(7, int(math.floor(v / L + 0.5)))
    # (a) 階段
    pa = Plot(66, 40, 250, 160, (0, 3.0), (0, 8))
    o.append(T(14, 18, "(a) 3 ビットの ADC（基準電圧 3.0 V）", "start", 11.5, INK, True))
    o.append(pa.axes(xl="入力の電圧 [V]", yl="ADC の値", xt=[0, 0.75, 1.5, 2.25, 3.0], yt=list(range(0, 8)),
                     xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    o.append(pa.line([(0, 0), (3.0, 8)], c=FNT, lw=1.2, dash="4 4"))
    pts = [(0, 0)]
    for k in range(8):
        a = max(0, (k - 0.5) * L)
        b = 3.0 if k == 7 else (k + 0.5) * L
        pts += [(a, k), (b, k)]
    o.append(pa.line(pts, c=SIG, lw=2.2))
    o.append(DIM(pa.X(1.3125), pa.Y(5.15), pa.X(1.6875), pa.Y(5.15), None, c=GLD))
    o.append(T(pa.X(1.5) - 2, pa.Y(5.15) - 7, "1 LSB = 0.375 V", "end", 10, GLD, True, halo=True))
    o.append(T(pa.X(2.72), pa.Y(7.32), "上で止まる", "middle", 9.5, ALI, halo=True))
    # (b) 量子化の誤差
    pb = Plot(426, 40, 250, 160, (0, 3.0), (-0.4, 0.4))
    o.append(T(380, 18, "(b) 量子化の誤差（戻した電圧 − 入力）", "start", 11.5, INK, True))
    o.append(pb.axes(xl="入力の電圧 [V]", yl="誤差 [V]", xt=[0, 0.75, 1.5, 2.25, 3.0], yt=[-0.375, -0.1875, 0, 0.1875, 0.375],
                     xfmt=lambda v: "%g" % v, yfmt=lambda v: {-0.375: "−0.375", -0.1875: "−0.19", 0: "0", 0.1875: "0.19", 0.375: "0.375"}[v]))
    o.append(RECT(pb.X(2.625), pb.y, pb.X(3.0) - pb.X(2.625), pb.h, 0, ASOFT, "none", 0))
    for yy in (0.1875, -0.1875):
        o.append(pb.line([(0, yy), (3.0, yy)], c=GLD, lw=1.2, dash="5 3"))
    seg = []
    for k in range(8):
        a = max(0, (k - 0.5) * L)
        b = 3.0 if k == 7 else (k + 0.5) * L
        seg.append(pb.line([(a, k * L - a), (b, k * L - b)], c=SIG, lw=2))
    o += seg
    o.append(T(pb.X(0.05), pb.Y(0.1875) - 6, "+1/2 LSB", "start", 9.5, GLD, True, halo=True))
    o.append(T(pb.X(0.05), pb.Y(-0.1875) + 14, "−1/2 LSB", "start", 9.5, GLD, True, halo=True))
    o.append(T(pb.X(2.8125), pb.Y(0.33), "張り付く", "middle", 9.5, ALI, True, halo=True))
    # (c) 比を測る物差し
    y0 = 266
    o.append(T(14, y0, "(c) 同じ 0.75 V を 12 ビットで測る", "start", 11.5, INK, True))
    x0, wd = 100, 300
    for i, (vr, N, ticks) in enumerate(((3.0, 1024, [0, 0.75, 1.5, 2.25, 3.0]), (2.4, 1280, [0, 0.6, 1.2, 1.8, 2.4]))):
        yy = y0 + 30 + i * 56
        o.append(T(x0 - 10, yy + 12, "基準 %.1f V" % vr, "end", 10.5, SIG if i == 0 else ALI, True))
        o.append(RECT(x0, yy, wd, 18, 3, SSOFT if i == 0 else ASOFT, SIG if i == 0 else ALI, 1.2))
        for tv in ticks:
            xx = x0 + tv / vr * wd
            o.append(W(xx, yy + 18, xx, yy + 23, c=MUT, lw=1))
            o.append(T(xx, yy + 34, ("%g V" % tv) if tv else "0", "middle", 9, MUT))
        xm = x0 + 0.75 / vr * wd
        o.append(W(xm, yy - 4, xm, yy + 22, c=TEA, lw=2.4))
        o.append(T(xm + 6, yy + 13, "0.75 V → N = %d" % N, "start", 10, TEA, True, halo=True))
    o.append(T(x0, y0 + 152, "目盛（基準）が縮むと、同じ電圧が大きな値になる", "start", 10, MUT))
    # (d) 1 LSB の表
    xt0, yt0 = 470, y0 + 14
    o.append(T(xt0, y0, "(d) 1 LSB の大きさ", "start", 11.5, INK, True))
    cols = [("分解能", 72), ("基準 3.0 V", 78), ("基準 1.2 V", 78)]
    rows = [("10 ビット", "2.93 mV", "1.17 mV"), ("12 ビット", "0.732 mV", "0.293 mV"), ("16 ビット", "0.0458 mV", "0.0183 mV")]
    xx = xt0
    for j, (h, w) in enumerate(cols):
        o.append(RECT(xx, yt0, w, 24, 2, MSOFT, LIN, 1))
        o.append(T(xx + w / 2, yt0 + 16, h, "middle", 10, INK, True))
        for i, r in enumerate(rows):
            o.append(RECT(xx, yt0 + 24 + i * 24, w, 24, 2, PAN, LIN, 1))
            o.append(T(xx + w / 2, yt0 + 24 + i * 24 + 16, r[j], "middle", 10, INK if j else SIG, j == 0))
        xx += w
    return SVG(700, y0 + 162, o, "ADC の値の決まり方。(a) 0〜基準電圧を 2 の n 乗の段に分け、入力がどの段にあたるかを整数で出す（ここでは見やすいように 3 ビット）。(b) 値から戻した電圧は、入力と最大で ±1/2 LSB 違う。基準電圧を超えると最大の値に張り付く。(c) ADC が知るのは入力と基準電圧の比だけなので、基準電圧が変わると、同じ入力でも値が変わる。(d) 1 LSB の大きさの例。")
F["e09_adc"] = _f09_adc()

def _f09_range():
    o = []
    # 左: 電圧の帯
    x0, y0, w, h = 66, 40, 34, 200
    o.append(T(14, 20, "(a) ピンに加えてよい電圧", "start", 11.5, INK, True))
    zones = [(0.0, 0.55, GRN, GSOFT, "0〜基準電圧: 測れる"), (0.55, 0.78, GLD, GOSOFT, "基準電圧〜電源電圧: 最大の値に張り付く"),
             (0.78, 1.0, ALI, ASOFT, "電源電圧より上: 保護ダイオードに電流が流れる")]
    for a, b, c, f, lab in zones:
        ya, yb = y0 + h - a * h, y0 + h - b * h
        o.append(RECT(x0, yb, w, ya - yb, 0, f, c, 1.2))
        o.append(T(x0 + w + 10, (ya + yb) / 2 + 4, lab, "start", 10, c, True))
    o.append(T(x0 - 6, y0 + h + 4, "0 V", "end", 9.5, MUT))
    o.append(T(x0 - 6, y0 + h - 0.55 * h + 4, "基準電圧", "end", 9.5, MUT))
    o.append(T(x0 - 6, y0 + h - 0.78 * h + 4, "電源電圧", "end", 9.5, MUT))
    # 右: 分圧回路
    o.append(T(350, 20, "(b) 分圧回路で下げてから測る（車の電源の例）", "start", 11.5, INK, True))
    xc, yt = 420, 52
    o.append(T(xc, yt - 6, "車の電源 14 V", "middle", 10.5, GLD, True))
    o.append(W(xc, yt, xc, yt + 14, c=GLD, lw=1.6))
    o.append(_f09_resv(xc, yt + 14, yt + 74, c=GLD))
    o.append(_f09_m(xc + 14, yt + 40, [("R", "1", True), (" = 390 kΩ", None, False)], "start", 11, INK))
    yn = yt + 92
    o.append(W(xc, yt + 74, xc, yn, c=GLD, lw=1.6))
    o.append(D(xc, yn, TEA, 4))
    o.append(_f09_resv(xc, yn, yn + 60, c=GLD))
    o.append(_f09_m(xc + 14, yn + 34, [("R", "2", True), (" = 100 kΩ", None, False)], "start", 11, INK))
    o.append(W(xc, yn + 60, xc, yn + 70, c=GLD, lw=1.6))
    o.append(_f09_gnd(xc, yn + 70))
    o.append(W(xc, yn, xc + 120, yn, c=TEA, lw=1.8))
    o.append(BOX(xc + 120, yn - 22, 110, 44, "ADC のピン", "基準 3.3 V", SIG, SSOFT, INK, sz=11, ssz=10))
    o.append(T(xc + 60, yn - 8, "2.86 V", "middle", 10.5, TEA, True))
    o.append(ARR(xc - 20, yt + 20, xc - 20, yt + 66, c=GLD, lw=1.4, head=6))
    o.append(T(xc - 26, yt + 48, "28.6 µA", "end", 10, GLD, True))
    yl = yn + 98
    o.append(T(350, yl, "つなぎ目の電圧 = 14 V × 100 ÷ 490 = 2.86 V（比 0.204）", "start", 10.5, INK))
    o.append(T(350, yl + 18, "12 V → 2.45 V、16 V → 3.27 V。値を 4.9 倍して戻す", "start", 10.5, MUT))
    return SVG(700, yl + 30, o, "ADC で測れる電圧の範囲と、分圧回路。(a) 0〜基準電圧の間だけが測れる。電源電圧を超える電圧をピンに加えてはいけない。(b) 高い電圧は、2 つの抵抗で決まった比に下げてから測る。分圧回路には、いつも電圧 ÷ 抵抗の和の電流が流れる（4 節）。")
F["e09_range"] = _f09_range()

# ---- 2 節: 電源電圧を基準にしたときの読み ----
def _f09_vdderr():
    o = []
    xt = [3.2, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0]
    # (a) 温度センサの読み
    pa = Plot(66, 40, 300, 190, (3.2, 2.0), (10, 70))
    o.append(T(14, 18, "(a) 25 °C を測った読み（基準は電源電圧、3.0 V として換算）", "start", 11.5, INK, True))
    o.append(pa.axes(xl="電池の電圧（= 電源電圧）[V]", yl="求めた温度 [°C]", xt=xt, yt=[10, 20, 30, 40, 50, 60, 70],
                     xfmt=lambda v: "%.1f" % v, yfmt=lambda v: "%d" % v))
    o.append(pa.line([(3.2, 25), (2.0, 25)], c=GRN, lw=1.6, dash="6 4"))
    o.append(T(pa.X(2.02), pa.Y(25) + 15, "本当の温度 25 °C", "end", 10, GRN, True, halo=True))
    pts = [(3.2 - 1.2 * k / 60, _f09_tsensor(3.2 - 1.2 * k / 60)) for k in range(61)]
    o.append(pa.line(pts, c=ALI, lw=2.4))
    o.append(RECT(pa.X(3.0), pa.y, pa.X(2.2) - pa.X(3.0), pa.h, 0, GOSOFT, "none", 0, op=0.55))
    o.append(T(pa.X(2.98), pa.Y(66), "CR2032 の範囲", "start", 9.5, GLD, True, halo=True))
    for vb, dx, dy, an in ((3.2, 8, 17, "start"), (2.6, -8, -10, "end"), (2.2, -8, -10, "end"), (2.0, -7, -9, "end")):
        t = _f09_tsensor(vb)
        o.append(D(pa.X(vb), pa.Y(t), ALI, 3.8))
        o.append(T(pa.X(vb) + dx, pa.Y(t) + dy, "%.1f °C" % t, an, 10, ALI, True, halo=True))
    # (b) 電池の電圧そのものを測る
    pb = Plot(470, 40, 210, 190, (3.2, 2.0), (0, 4096))
    o.append(T(420, 18, "(b) 電池の電圧を分圧して測った ADC の値", "start", 11.5, INK, True))
    o.append(pb.axes(xl="電池の電圧 [V]", yl="ADC の値", xt=[3.2, 2.8, 2.4, 2.0], yt=[0, 1024, 2048, 3072, 4096],
                     xfmt=lambda v: "%.1f" % v, yfmt=lambda v: "%d" % v))
    o.append(pb.line([(3.2, 2048), (2.0, 2048)], c=ALI, lw=2.4))
    o.append(T(pb.X(3.17), pb.Y(2048) + 16, "基準が電源電圧:", "start", 9.5, ALI, True, halo=True))
    o.append(T(pb.X(3.17), pb.Y(2048) + 29, "いつも 2048", "start", 9.5, ALI, True, halo=True))
    o.append(pb.line([(3.2, 3.2 / 4 / 1.2 * 4096), (2.0, 2.0 / 4 / 1.2 * 4096)], c=GRN, lw=2.4))
    o.append(T(pb.X(2.62), pb.Y(1150), "基準が内部の 1.2 V:", "middle", 9.5, GRN, True, halo=True))
    o.append(T(pb.X(2.62), pb.Y(1150) + 13, "電圧に比例する", "middle", 9.5, GRN, True, halo=True))
    o.append(T(420, 284, "分圧の比: 電源電圧の基準で 1/2、", "start", 9.5, MUT))
    o.append(T(420, 298, "内部の 1.2 V の基準で 1/4（12 ビット）", "start", 9.5, MUT))
    return SVG(700, 306, o, "基準電圧に電源電圧をそのまま使い、電池でマイコンを直接動かす場合。(a) アナログ出力の温度センサ（0.5 V + 10 mV/°C）の読みは、電池が減るにつれて高くずれ、CR2032 が 2.2 V に下がると 27 °C も高く読む。(b) 電池の電圧を、電池の電圧を基準にして測ると、値は電池の電圧によらず一定で、電池が減ったことが分からない。")
F["e09_vdderr"] = _f09_vdderr()

def _f09_bgcalc():
    o = []
    o.append(T(14, 18, "(a) 内部の基準電圧も測り、電源電圧を求める（例: 電池が 2.4 V のとき）", "start", 11.5, INK, True))
    # 電池と電源の線
    o.append(BOX(14, 44, 100, 40, "電池", "電源電圧 2.4 V", GLD, GOSOFT, INK, sz=11, ssz=9.5))
    o.append(W(114, 64, 150, 64, 150, 40, 470, 40, 470, 72, c=GLD, lw=1.8))
    o.append(T(300, 34, "基準電圧 = 電源電圧", "middle", 10, GLD, True))
    # マイコン
    o.append(RECT(150, 56, 380, 150, 10, "none", SIG, 1.6))
    o.append(T(160, 200, "マイコン", "start", 10.5, SIG, True))
    o.append(BOX(170, 120, 130, 36, "内部の基準電圧", "1.2 V（一定）", GRN, GSOFT, INK, sz=10.5, ssz=9.5))
    o.append(BOX(14, 150, 110, 44, "温度センサ", "0.75 V（25 °C）", TEA, TSOFT, INK, sz=10.5, ssz=9.5))
    o.append(W(124, 172, 330, 172, c=TEA, lw=1.6))
    o.append(W(300, 138, 330, 138, c=GRN, lw=1.6))
    # 切り替え
    o.append(PL([(330, 118), (330, 190), (360, 176), (360, 132)], c=MUT, lw=1.4, fill=MSOFT))
    o.append(T(345, 112, "チャネル", "middle", 9.5, MUT))
    o.append(W(360, 154, 410, 154, c=INK, lw=1.6))
    o.append(BOX(410, 72, 110, 112, "ADC", "12 ビット", SIG, SSOFT, INK, sz=11.5, ssz=9.5))
    o.append(ARR(520, 110, 562, 110, c=SIG, lw=1.5, head=6))
    o.append(ARR(520, 150, 562, 150, c=SIG, lw=1.5, head=6))
    o.append(_f09_m(566, 114, [("N", "bg", True), (" = 2048", None, False)], "start", 11, GRN, True))
    o.append(_f09_m(566, 154, [("N", None, True), (" = 1280", None, False)], "start", 11, TEA, True))
    o.append(T(566, 182, "（同じ電源電圧で続けて測る）", "start", 9.5, MUT))
    yc = 236
    o.append(_f09_m(30, yc, [("V", "DD", True), (" = 1.2 V × 4096 ÷ ", None, False), ("N", "bg", True), (" = 2.40 V", None, False)], "start", 11.5, INK))
    o.append(_f09_m(370, yc, [("V", "in", True), (" = 1.2 V × ", None, False), ("N", None, True), (" ÷ ", None, False), ("N", "bg", True), (" = 0.750 V", None, False)], "start", 11.5, INK))
    # (b) 電源電圧と 2 つの値
    y1 = 270
    o.append(T(14, y1, "(b) 電池の電圧と、2 つのチャネルの ADC の値", "start", 11.5, INK, True))
    pb = Plot(80, y1 + 20, 330, 180, (3.2, 2.0), (500, 2700))
    o.append(pb.axes(xl="電池の電圧（= 電源電圧）[V]", yl="ADC の値", xt=[3.2, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0], yt=[500, 1000, 1500, 2000, 2500],
                     xfmt=lambda v: "%.1f" % v, yfmt=lambda v: "%d" % v))
    vs = [3.2 - 1.2 * k / 60 for k in range(61)]
    o.append(pb.line([(v, 1.2 / v * 4096) for v in vs], c=GRN, lw=2.4))
    o.append(pb.line([(v, 0.75 / v * 4096) for v in vs], c=TEA, lw=2.4))
    for v in (3.2, 2.4, 2.0):
        nb, ns = round(1.2 / v * 4096), round(0.75 / v * 4096)
        o.append(D(pb.X(v), pb.Y(nb), GRN, 3.6))
        o.append(D(pb.X(v), pb.Y(ns), TEA, 3.6))
        o.append(T(pb.X(v) + (8 if v > 3 else -6), pb.Y(nb) - 8, "%d" % nb, "start" if v > 3 else "end", 9.5, GRN, True, halo=True))
        o.append(T(pb.X(v) + (8 if v > 3 else -6), pb.Y(ns) + 15, "%d" % ns, "start" if v > 3 else "end", 9.5, TEA, True, halo=True))
    o.append(_f09_m(pb.X(2.95), pb.Y(1250), [("N", "bg", True), ("（内部の基準電圧）", None, False)], "start", 10, GRN, True))
    o.append(_f09_m(pb.X(2.95), pb.Y(560), [("N", None, True), ("（温度センサ）", None, False)], "start", 10, TEA, True))
    xn = 450
    o.append(T(xn, y1 + 46, "電池が下がると、2 つの値は", "start", 10.5, INK))
    o.append(T(xn, y1 + 64, "同じ割合で大きくなる。", "start", 10.5, INK))
    o.append(_f09_m(xn, y1 + 94, [("比 ", None, False), ("N", None, True), (" ÷ ", None, False), ("N", "bg", True), (" = 0.625", None, False)], "start", 11, SIG, True))
    o.append(T(xn, y1 + 112, "は電池の電圧によらない", "start", 10.5, SIG, True))
    o.append(T(xn, y1 + 142, "残る誤差は、1.2 V の値そのもの", "start", 10.5, INK))
    o.append(T(xn, y1 + 160, "（ばらつき ±1〜3 %。工場で測った", "start", 10, MUT))
    o.append(T(xn, y1 + 176, "値を使えば、主に温度の分。代表値）", "start", 10, MUT))
    return SVG(700, y1 + 240, o, "基準電圧は電源電圧のまま、内部の基準電圧（1.2 V 前後）も同じ ADC で測る方法。(a) 内部の基準電圧の値から電源電圧が求まり、ほかのチャネルの電圧は 1.2 V ×（そのチャネルの値）÷（内部の基準電圧の値）で、電源電圧によらずに求まる。(b) 電池の電圧が下がると、どちらの値も大きくなるが、その比は変わらない。")
F["e09_bgcalc"] = _f09_bgcalc()

# ---- 3 節: 比率測定 ----
def _f09_ntcsym(x, y1, y2, c=TEA):
    """サーミスタの記号（縦の抵抗に斜めの線）。"""
    ym = (y1 + y2) / 2
    return _f09_resv(x, y1, y2, c=c) + W(x - 14, ym + 14, x + 12, ym - 12, x + 20, ym - 12, c=c, lw=1.3)

def _f09_ratio():
    o = []
    o.append(T(14, 18, "(a) 分圧の上の端と基準電圧を、同じ点からとる", "start", 11.5, INK, True))
    xb, yv = 70, 50
    o.append(BOX(14, yv - 16, 92, 32, "電池", None, GLD, GOSOFT, INK, sz=11))
    o.append(W(106, yv, 300, yv, c=GLD, lw=2))
    o.append(D(150, yv, GLD, 4))
    o.append(_f09_m(190, yv - 8, [("V", "DD", True), ("（2.0〜3.2 V）", None, False)], "start", 10.5, GLD, True))
    xr = 150
    o.append(W(xr, yv, xr, yv + 14, c=GLD, lw=1.6))
    o.append(_f09_resv(xr, yv + 14, yv + 70, c=INK))
    o.append(_f09_m(xr - 14, yv + 46, [("R", "f", True), (" 10 kΩ", None, False)], "end", 10.5, INK))
    yn = yv + 84
    o.append(W(xr, yv + 70, xr, yn, c=INK, lw=1.5))
    o.append(D(xr, yn, TEA, 4))
    o.append(_f09_ntcsym(xr, yn, yn + 60))
    o.append(T(xr - 18, yn + 36, "サーミスタ", "end", 10.5, TEA, True))
    o.append(W(xr, yn + 60, xr, yn + 70, c=INK, lw=1.5))
    o.append(_f09_gnd(xr, yn + 70))
    o.append(W(xr, yn, 236, yn, c=TEA, lw=1.8))
    o.append(BOX(236, yn - 24, 84, 48, "ADC", "入力", SIG, SSOFT, INK, sz=11.5, ssz=9.5))
    o.append(W(300, yv, 300, yn - 24, c=SIG, lw=2))
    o.append(T(306, yv + 40, "基準電圧", "start", 10, SIG, True))
    o.append(_f09_m(14, yn + 104, [("N", None, True), (" = 2ⁿ × (", None, False), ("V", "DD", True), (" ÷ ", None, False), ("V", "DD", True),
                                   (") × ", None, False), ("R", "th", True), (" ÷ (", None, False), ("R", "f", True), (" + ", None, False), ("R", "th", True), (")", None, False)], "start", 10.5, INK))
    o.append(T(14, yn + 122, "→ 電源の電圧が消え、抵抗の比だけが残る", "start", 10.5, GRN, True))
    # (b) 誤差の比較
    pb = Plot(450, 40, 230, 190, (3.2, 2.0), (-10, 40))
    o.append(T(386, 18, "(b) 25 °C を測った読みの誤差", "start", 11.5, INK, True))
    o.append(pb.axes(xl="電池の電圧（= 電源電圧）[V]", yl="温度の誤差 [°C]", xt=[3.2, 2.8, 2.4, 2.0], yt=[-10, 0, 10, 20, 30, 40],
                     xfmt=lambda v: "%.1f" % v, yfmt=lambda v: "%d" % v))
    vs = [3.2 - 1.2 * k / 60 for k in range(61)]
    o.append(pb.line([(v, _f09_tsensor(v) - 25) for v in vs], c=ALI, lw=2.4))
    o.append(pb.line([(3.2, 0), (2.0, 0)], c=GRN, lw=2.6))
    o.append(T(pb.X(3.15), pb.Y(0) + 16, "サーミスタの比率測定: 0", "start", 10, GRN, True, halo=True))
    o.append(T(pb.X(3.15), pb.Y(33), "決まった電圧のセンサを", "start", 10, ALI, True, halo=True))
    o.append(T(pb.X(3.15), pb.Y(33) + 13, "電源電圧の基準で（2 節）", "start", 10, ALI, True, halo=True))
    return SVG(700, yn + 134, o, "比率測定。(a) サーミスタの分圧回路の上の端と、ADC の基準電圧を、同じ電源の同じ点につなぐ。ADC の値は抵抗の比だけで決まり、電源の電圧は打ち消される。(b) 電池が 3.2 V から 2.0 V に下がっても、比率測定の読みは変わらない。2 節の決まった電圧を出すセンサを電源電圧の基準で測ると、読みは大きくずれる。")
F["e09_ratio"] = _f09_ratio()

def _f09_ntc():
    o = []
    o.append(T(14, 18, "(a) NTC サーミスタの抵抗（25 °C で 10 kΩ、B = 3435 K）", "start", 11.5, INK, True))
    pa = Plot(76, 40, 250, 190, (-40, 100), (500, 400000), ylog=True)
    o.append(pa.axes(xl="温度 [°C]", yl="抵抗", xt=[-40, -20, 0, 25, 50, 75, 100], yt=[1000, 10000, 100000],
                     xfmt=lambda v: "%d" % v, yfmt=lambda v: {1000: "1 kΩ", 10000: "10 kΩ", 100000: "100 kΩ"}[v]))
    o.append(pa.line([(t, _f09_rntc(t)) for t in range(-40, 101, 2)], c=TEA, lw=2.4))
    for tc, lab, dx, dy in ((0, "28.7 kΩ（0 °C）", 8, -6), (25, "10.0 kΩ（25 °C）", 8, -6), (50, "4.10 kΩ（50 °C）", 8, -6)):
        o.append(D(pa.X(tc), pa.Y(_f09_rntc(tc)), TEA, 3.8))
        o.append(T(pa.X(tc) + dx, pa.Y(_f09_rntc(tc)) + dy, lab, "start", 9.5, TEA, True, halo=True))
    o.append(T(386, 18, "(b) 固定抵抗の大きさと ADC の値（12 ビット）", "start", 11.5, INK, True))
    pb = Plot(440, 40, 240, 190, (-40, 100), (0, 4096))
    o.append(pb.axes(xl="温度 [°C]", yl="ADC の値", xt=[-40, -20, 0, 25, 50, 75, 100], yt=[0, 1024, 2048, 3072, 4096],
                     xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    for rf, c, lab, tl in ((3300.0, GLD, "3.3 kΩ", 75), (10000.0, SIG, "10 kΩ", 75), (33000.0, PUR, "33 kΩ", 75)):
        pts = [(t, 4096 * _f09_rntc(t) / (rf + _f09_rntc(t))) for t in range(-40, 101, 2)]
        o.append(pb.line(pts, c=c, lw=2.4 if rf == 10000.0 else 1.8))
    # 傾きの印（10 kΩ・25 °C）
    s = 4096 * _F09_B / (4 * _F09_T25 ** 2)
    o.append(pb.line([(10, 2048 + 15 * s), (40, 2048 - 15 * s)], c=ALI, lw=1.4, dash="4 3"))
    o.append(D(pb.X(25), pb.Y(2048), SIG, 4))
    o.append(T(pb.X(28), pb.Y(2048) - 8, "25 °C で 39.6 LSB/°C", "start", 9.5, ALI, True, halo=True))
    o.append(LEGEND(440, 288, [(GLD, "固定抵抗 3.3 kΩ"), (SIG, "10 kΩ"), (PUR, "33 kΩ")]))
    return SVG(700, 300, o, "NTC サーミスタの抵抗と、分圧回路の ADC の値（比率測定）。(a) 抵抗は温度で指数関数的に変わる（縦軸は対数目盛）。(b) 固定抵抗を、測りたい範囲の真ん中でのサーミスタの抵抗に合わせると、その温度で傾き（感度）が最大になる。10 kΩ なら 25 °C の付近が最も細かく測れる。")
F["e09_ntc"] = _f09_ntc()

# ---- 4 節: 分圧の電流と漏れ電流の誤差 ----
def _f09_divcur():
    o = []
    k1 = 390.0 / 490.0                     # R1 = R_tot × 390/490（比 100/490 のまま大きさを変える）
    xr = (1e4, 1e7)
    xt = [1e4, 1e5, 1e6, 1e7]
    xf = lambda v: {1e4: "10 kΩ", 1e5: "100 kΩ", 1e6: "1 MΩ", 1e7: "10 MΩ"}[v]
    o.append(T(14, 18, "(a) 14 V で分圧に流れ続ける電流", "start", 11.5, INK, True))
    pa = Plot(80, 40, 240, 180, xr, (1e-6, 2e-3), xlog=True, ylog=True)
    o.append(pa.axes(xl="分圧の抵抗の和", yl="電流", xt=xt, yt=[1e-6, 1e-5, 1e-4, 1e-3], xfmt=xf,
                     yfmt=lambda v: {1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA"}[v]))
    o.append(pa.line([(10 ** (4 + i / 20.0), 14.0 / 10 ** (4 + i / 20.0)) for i in range(61)], c=GLD, lw=2.4))
    o.append(D(pa.X(4.9e5), pa.Y(14 / 4.9e5), GLD, 4))
    o.append(T(pa.X(4.9e5) + 8, pa.Y(14 / 4.9e5) - 8, "490 kΩ で 28.6 µA", "start", 10, GLD, True, halo=True))
    o.append(T(pa.X(1.3e4), pa.Y(1.6e-6), "抵抗を大きくすると減る", "start", 9.5, GLD, halo=True))
    o.append(T(386, 18, "(b) 漏れ電流による誤差（14 V に戻した値）", "start", 11.5, INK, True))
    pb = Plot(452, 40, 228, 180, xr, (1e-4, 10), xlog=True, ylog=True)
    o.append(pb.axes(xl="分圧の抵抗の和", yl="誤差", xt=xt, yt=[1e-4, 1e-3, 1e-2, 1e-1, 1, 10], xfmt=xf,
                     yfmt=lambda v: {1e-4: "0.1 mV", 1e-3: "1 mV", 1e-2: "10 mV", 1e-1: "0.1 V", 1: "1 V", 10: "10 V"}[v]))
    for ilk, c, lab in ((1e-6, ALI, "漏れ電流 1 µA（最大値の例）"), (50e-9, GLD, "50 nA（室温の例）")):
        o.append(pb.line([(10 ** (4 + i / 20.0), ilk * k1 * 10 ** (4 + i / 20.0)) for i in range(61)], c=c, lw=2.2))
        e = ilk * 390e3
        o.append(D(pb.X(4.9e5), pb.Y(e), c, 4))
    o.append(T(pb.X(4.9e5) - 8, pb.Y(0.39) - 8, "0.39 V", "end", 10, ALI, True, halo=True))
    o.append(T(pb.X(4.9e5) + 8, pb.Y(0.0195) + 15, "20 mV", "start", 10, GLD, True, halo=True))
    o.append(LEGEND(386, 270, [(ALI, "漏れ電流 1 µA（最大値の例）"), (GLD, "50 nA（室温の例）")]))
    o.append(_f09_m(386, 290, [("誤差 = 漏れ電流 × 信号源抵抗 ÷ 分圧の比 = 漏れ電流 × ", None, False), ("R", "1", True)], "start", 10, MUT))
    return SVG(700, 300, o, "車の電源の分圧（比 100/490 のまま、抵抗の大きさを変えた場合）。(a) 抵抗を大きくすると、流れ続ける電流は減る。(b) その代わり、ピンの漏れ電流が信号源抵抗を流れて作る誤差が、抵抗に比例して増える。漏れ電流は温度が高いほど大きいので、最大値で考える。")
F["e09_divcur"] = _f09_divcur()

def _f09_switch():
    o = []
    # (a) サーミスタを GPIO から
    o.append(T(14, 18, "(a) 低い電圧: GPIO から動かす", "start", 11.5, INK, True))
    xa = 80
    o.append(BOX(20, 34, 120, 34, "GPIO", "測るときだけ H", SIG, SSOFT, INK, sz=11, ssz=9.5))
    o.append(W(xa, 68, xa, 80, c=SIG, lw=1.6))
    o.append(_f09_resv(xa, 80, 128, c=INK))
    o.append(_f09_m(xa + 12, 108, [("R", "f", True), (" 10 kΩ", None, False)], "start", 10, INK))
    yn = 142
    o.append(W(xa, 128, xa, yn, c=INK, lw=1.5))
    o.append(D(xa, yn, TEA, 4))
    o.append(_f09_ntcsym(xa, yn, yn + 50))
    o.append(W(xa, yn + 50, xa, yn + 58, c=INK, lw=1.5))
    o.append(_f09_gnd(xa, yn + 58))
    o.append(W(xa, yn, 196, yn, c=TEA, lw=1.6))
    o.append(D(150, yn, TEA, 3))
    o.append(_f09_capv(150, yn, yn + 46, c=INK))
    o.append(_f09_gnd(150, yn + 46))
    o.append(T(162, yn + 30, "10 nF", "start", 9.5, MUT))
    o.append(ARR(196, yn, 222, yn, c=TEA, lw=1.5, head=6))
    o.append(T(214, yn - 8, "ADC", "end", 10, SIG, True))
    o.append(T(20, 250, "切る間は L にする（浮かせない）", "start", 10, GRN, True))
    o.append(T(20, 266, "H の電圧は、電流 × 出力の抵抗だけ低い", "start", 9.5, MUT))
    # (b) ハイサイドで切る
    o.append(T(250, 18, "(b) 高い電圧: 上の側で切る", "start", 11.5, INK, True))
    xb = 310
    o.append(T(xb, 44, "車の電源 14 V", "middle", 10, GLD, True))
    o.append(W(xb, 50, xb, 58, c=GLD, lw=1.6))
    o.append(_f09_swv(xb, 58, 96, False, c=GLD))
    o.append(T(xb - 14, 72, "P チャネル", "end", 9.5, GLD, True))
    o.append(T(xb - 14, 85, "MOSFET（切）", "end", 9.5, GLD, True))
    o.append(_f09_resv(xb, 96, 136, c=INK))
    o.append(_f09_m(xb - 10, 120, [("R", "1", True)], "end", 10.5, INK))
    yb = 150
    o.append(W(xb, 136, xb, yb, c=INK, lw=1.5))
    o.append(D(xb, yb, TEA, 4))
    o.append(_f09_resv(xb, yb, yb + 40, c=INK))
    o.append(_f09_m(xb - 10, yb + 26, [("R", "2", True)], "end", 10.5, INK))
    o.append(W(xb, yb + 40, xb, yb + 48, c=INK, lw=1.5))
    o.append(_f09_gnd(xb, yb + 48))
    o.append(ARR(xb, yb, xb + 110, yb, c=TEA, lw=1.5, head=6))
    o.append(T(xb + 104, yb - 8, "ADC", "end", 10, SIG, True))
    o.append(BOX(368, 96, 92, 34, "N チャネル", "GPIO で入れる", SIG, SSOFT, INK, sz=10, ssz=9))
    o.append(W(368, 113, 340, 113, 340, 77, 322, 77, c=SIG, lw=1.3, dash="4 3"))
    o.append(T(250, 250, "切る間、つなぎ目は R2 で 0 V", "start", 10, GRN, True))
    o.append(T(250, 266, "GPIO は 14 V のゲートを直接動かせない", "start", 9.5, MUT))
    # (c) 下の側で切る（誤り）
    o.append(T(480, 18, "(c) 誤り: 下の側で切る", "start", 11.5, ALI, True))
    xc = 530
    o.append(T(xc, 44, "車の電源 14 V", "middle", 10, GLD, True))
    o.append(W(xc, 50, xc, 62, c=GLD, lw=1.6))
    o.append(_f09_resv(xc, 62, 106, c=INK))
    o.append(_f09_m(xc - 10, 88, [("R", "1", True)], "end", 10.5, INK))
    yc = 120
    o.append(W(xc, 106, xc, yc, c=INK, lw=1.5))
    o.append(D(xc, yc, ALI, 4))
    o.append(_f09_resv(xc, yc, yc + 40, c=INK))
    o.append(_f09_m(xc - 10, yc + 26, [("R", "2", True)], "end", 10.5, INK))
    o.append(_f09_swv(xc, yc + 40, yc + 76, False, c=INK))
    o.append(T(xc - 12, yc + 62, "N チャネル（切）", "end", 9.5, INK))
    o.append(_f09_gnd(xc, yc + 76))
    xp = 640
    o.append(W(xc, yc, xp, yc, c=ALI, lw=1.6))
    o.append(T(xc + 10, yc - 7, "14 V に引かれる", "start", 9.5, ALI, True))
    o.append(W(xp, yc, xp, 92, c=ALI, lw=1.4))
    o.append(_f09_diode_up(xp, 80, c=ALI))
    o.append(W(xp, 80, xp, 60, 690, 60, c=SIG, lw=1.6))
    o.append(T(688, 54, "マイコンの電源 3.3 V", "end", 9.5, SIG, True))
    o.append(T(xp + 10, 104, "保護", "start", 9, ALI))
    o.append(T(xp + 10, 116, "ダイオード", "start", 9, ALI))
    o.append(ARR(xp - 12, 100, xp - 12, 66, c=ALI, lw=1.4, head=6))
    o.append(T(480, 250, "切っても 26 µA が流れ込む", "start", 10, ALI, True))
    o.append(T(480, 266, "(14 − 3.3 − 0.5) V ÷ 390 kΩ", "start", 9.5, MUT))
    return SVG(700, 278, o, "分圧回路を測るときだけ動かす回路。(a) 電源電圧より低い分圧は、上の端を GPIO の出力にして、測るときだけ H にする。(b) 電源電圧より高い分圧は、上の側に P チャネルの MOSFET を入れて切る。(c) 下の側で切ると、つなぎ目が高い電圧に引かれ、ピンの保護ダイオードを通ってマイコンの電源の線へ電流が流れ込む。")
F["e09_switch"] = _f09_switch()

def _f09_settle():
    o = []
    R1, R2, C, V = 390e3, 100e3, 100e-9, 14.0
    Rs, Vk = R1 * R2 / (R1 + R2), V * R2 / (R1 + R2)
    tau, toff = Rs * C, R2 * C
    t_on, t_s = 5e-3, 5e-3 + tau * math.log(2 ** 13)
    t_end = t_s + 3e-3
    def v_of(t):
        if t < t_on:
            return 0.0
        if t < t_end:
            return Vk * (1 - math.exp(-(t - t_on) / tau))
        v1 = Vk * (1 - math.exp(-(t_end - t_on) / tau))
        return v1 * math.exp(-(t - t_end) / toff)
    o.append(T(14, 18, "(a) 分圧を入れてから切るまで（車の電源の分圧、100 nF）", "start", 11.5, INK, True))
    x0, w = 90, 330
    X = lambda t: x0 + t / 0.12 * w
    # 入れ切りの信号
    yS = 40
    o.append(T(x0 - 8, yS + 14, "スイッチ", "end", 10, SIG, True))
    o.append(PL([(X(0), yS + 18), (X(t_on), yS + 18), (X(t_on), yS + 2), (X(t_end), yS + 2), (X(t_end), yS + 18), (X(0.12), yS + 18)], c=SIG, lw=2))
    # 電圧
    pv = Plot(x0, 78, w, 90, (0, 0.12), (0, 3.3))
    o.append(pv.axes(yl=None, xt=[], yt=[0, 1, 2, 3], yfmt=lambda v: "%d V" % v))
    o.append(T(x0 - 44, 78 + 45, "電圧", "middle", 10, TEA, True, rot=-90))
    o.append(pv.line([(i * 0.12 / 300, v_of(i * 0.12 / 300)) for i in range(301)], c=TEA, lw=2.2))
    o.append(pv.line([(0, Vk), (0.12, Vk)], c=FNT, lw=1, dash="3 3"))
    o.append(T(X(0.118), pv.Y(Vk) - 5, "2.86 V", "end", 9.5, TEA, True, halo=True))
    o.append(W(X(t_s), pv.y - 2, X(t_s), pv.y + pv.h, c=GLD, lw=1.3, dash="4 3"))
    o.append(T(X(t_s) - 4, pv.Y(1.2), "ここで測る", "end", 9.5, GLD, True, halo=True))
    o.append(DIM(X(t_on), pv.Y(0.45), X(t_s), pv.Y(0.45), None, c=GLD))
    o.append(T((X(t_on) + X(t_s)) / 2, pv.Y(0.45) - 5, "9τ ≈ 72 ms", "middle", 9.5, GLD, True, halo=True))
    # 電流
    pi_ = Plot(x0, 186, w, 64, (0, 0.12), (0, 40e-6))
    o.append(pi_.axes(xl="時間 [ms]", xt=[0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12], yt=[0, 20e-6, 40e-6],
                      xfmt=lambda v: "%d" % round(v * 1000), yfmt=lambda v: "%d µA" % round(v * 1e6)))
    o.append(T(x0 - 52, 186 + 32, "電流", "middle", 10, GLD, True, rot=-90))
    ip = []
    for i in range(301):
        t = i * 0.12 / 300
        ip.append((t, (V - v_of(t)) / R1 if t_on <= t < t_end else 0.0))
    o.append(pi_.line(ip, c=GLD, lw=2))
    o.append(T(X(0.04), pi_.Y(28.6e-6) - 6, "28.6 µA", "middle", 9.5, GLD, True, halo=True))
    # (b) 残りの差（対数）
    o.append(T(470, 18, "(b) 残りの差（対数目盛）", "start", 11.5, INK, True))
    pb = Plot(510, 40, 170, 210, (0, 0.09), (1e-4, 10), ylog=True)
    o.append(pb.axes(xl="入れてからの時間 [ms]", yl=None, xt=[0, 0.03, 0.06, 0.09], yt=[1e-4, 1e-3, 1e-2, 1e-1, 1, 10],
                     xfmt=lambda v: "%d" % round(v * 1000), yfmt=lambda v: {1e-4: "0.1 mV", 1e-3: "1 mV", 1e-2: "10 mV", 1e-1: "0.1 V", 1: "1 V", 10: "10 V"}[v]))
    o.append(pb.line([(i * 0.09 / 90, Vk * math.exp(-(i * 0.09 / 90) / tau)) for i in range(91)], c=TEA, lw=2.2))
    for bits, c in ((10, GLD), (12, ALI)):
        th = 3.3 / 2 ** (bits + 1)
        tc = tau * math.log(Vk / th)
        o.append(pb.line([(0, th), (0.09, th)], c=c, lw=1.2, dash="5 3"))
        o.append(D(pb.X(tc), pb.Y(th), c, 3.6))
        o.append(T(pb.X(0.002), pb.Y(th) + (13 if bits == 12 else -5), "%d ビットの 1/2 LSB" % bits, "start", 9.5, c, True, halo=True))
        if bits == 12:
            o.append(T(pb.X(tc) + 4, pb.Y(th) + 15, "%.0f ms" % (tc * 1000), "start", 9.5, c, True, halo=True))
        else:
            o.append(T(pb.X(tc) + 5, pb.Y(th) - 6, "%.0f ms" % (tc * 1000), "start", 9.5, c, True, halo=True))
    o.append(T(pb.X(0.03), pb.Y(1.5), "τ = 7.96 ms で", "start", 9.5, TEA, halo=True))
    o.append(T(pb.X(0.03), pb.Y(1.5) + 13, "1/e ずつ減る", "start", 9.5, TEA, halo=True))
    return SVG(700, 296, o, "分圧回路の電源を入れてから測るまで（390 kΩ と 100 kΩ、つなぎ目に 100 nF。信号源抵抗 79.6 kΩ で τ = 7.96 ms）。(a) つなぎ目の電圧は τ で 2.86 V に近づく。12 ビットでは、どの電圧でも 1/2 LSB 以内に入る 9τ ≈ 72 ms 待って測り、すぐに切る。切った後は R2 を通して放電する。(b) 残りの差は、時間とともに一定の割合で減り、対数目盛では直線になる（2.86 V では 12 ビットの 1/2 LSB を約 71 ms で切る）。")
F["e09_settle"] = _f09_settle()

# ---- 5 節: サンプル・ホールド ----
def _f09_sh():
    o = []
    o.append(T(14, 18, "(a) ADC の入力の等価回路", "start", 11.5, INK, True))
    yw = 70
    o.append(BOX(14, yw - 22, 84, 44, "信号源", None, TEA, TSOFT, INK, sz=11))
    o.append(_f09_m(56, yw + 38, [("V", "in", True)], "middle", 11, TEA, True))
    o.append(W(98, yw, 110, yw, c=INK, lw=1.5))
    o.append(_f09_resh(110, 170, yw, c=INK))
    o.append(_f09_m(140, yw - 12, [("R", "s", True)], "middle", 11, INK))
    o.append(T(140, yw + 22, "信号源抵抗", "middle", 9.5, MUT))
    o.append(W(170, yw, 236, yw, c=INK, lw=1.5))
    o.append(CIRC(236, yw, 5, c=SIG, lw=1.6, fill=PAN))
    o.append(T(236, yw - 12, "ピン", "middle", 10, SIG, True))
    o.append(D(205, yw, INK, 3))
    o.append(_f09_capv(205, yw, yw + 46, c=MUT))
    o.append(_f09_gnd(205, yw + 46))
    o.append(_f09_m(193, yw + 30, [("C", "ext", True)], "end", 10.5, MUT))
    o.append(T(193, yw + 44, "（付けるとき）", "end", 9, MUT))
    # マイコンの中
    o.append(RECT(250, 34, 440, 132, 10, "none", SIG, 1.4, dash="5 4"))
    o.append(T(682, 52, "マイコンの中の ADC", "end", 10, SIG, True))
    o.append(W(241, yw, 280, yw, c=INK, lw=1.5))
    o.append(_f09_swh(280, 330, yw, True, c=INK))
    o.append(T(305, yw - 14, "チャネルの", "middle", 9.5, MUT))
    o.append(T(305, yw + 22, "切り替え", "middle", 9.5, MUT))
    o.append(_f09_swh(330, 390, yw, True, c=TEA))
    o.append(T(360, yw - 14, "標本化の", "middle", 9.5, TEA, True))
    o.append(T(360, yw - 2 + 24, "スイッチ", "middle", 9.5, TEA, True))
    o.append(_f09_resh(390, 440, yw, c=INK))
    o.append(_f09_m(415, yw - 12, [("R", "sw", True)], "middle", 11, INK))
    o.append(W(440, yw, 500, yw, c=INK, lw=1.5))
    o.append(D(480, yw, INK, 3))
    o.append(_f09_capv(480, yw, yw + 46, c=SIG))
    o.append(_f09_gnd(480, yw + 46))
    o.append(_f09_m(494, yw + 30, [("C", "sh", True), ("（数 pF〜数十 pF）", None, False)], "start", 10.5, SIG))
    o.append(ARR(500, yw, 560, yw, c=SIG, lw=1.5, head=6))
    o.append(T(566, yw + 4, "量子化（1 節）", "start", 10, SIG, True))
    # (b) 時間の流れ
    o.append(T(14, 200, "(b) 1 回の変換の時間の流れ", "start", 11.5, INK, True))
    x0, w = 90, 560
    X = lambda t: x0 + t * w
    yv = 226
    pts = []
    for i in range(101):
        t = i / 100.0
        if t < 0.1:
            v = 0.2
        elif t < 0.4:
            v = 1.0 - 0.8 * math.exp(-(t - 0.1) / 0.06)
        else:
            v = 1.0 - 0.8 * math.exp(-0.3 / 0.06)
        pts.append((X(t), yv + 50 - v * 44))
    o.append(PL(pts, c=SIG, lw=2))
    o.append(_f09_m(x0 - 8, yv + 44, [("V", "0", True)], "end", 10.5, MUT))
    o.append(_f09_m(x0 - 8, yv + 12, [("V", "in", True)], "end", 10.5, TEA))
    o.append(W(x0, yv + 6, X(1.0), yv + 6, c=TEA, lw=1, dash="3 3"))
    o.append(_f09_m(X(0.7), yv + 26, [("C", "sh", True), (" の電圧（保ったまま変換する）", None, False)], "middle", 9.5, SIG))
    s, hh = TIMEBAR(x0, yv + 60, w, 0, 1, [(0.0, 0.1, "前の変換", MUT), (0.1, 0.4, "標本化時間（スイッチが入る）", TEA),
                                           (0.4, 0.95, "変換（スイッチは切れている）", SIG)], h=26, axis=False)
    o.append(s)
    o.append(_f09_m(x0, yv + 104, [("前のチャネルの電圧 ", None, False), ("V", "0", True), (" から入力の電圧 ", None, False), ("V", "in", True),
                                   (" に向かって、時定数 (", None, False), ("R", "s", True), (" + ", None, False), ("R", "sw", True), (") ", None, False), ("C", "sh", True), (" で充電される", None, False)], "start", 9.5, MUT))
    return SVG(700, yv + 114, o, "ADC の入力のサンプル・ホールド。(a) チャネルを切り替える回路と標本化のスイッチを通して、小さなコンデンサを入力の電圧まで充電する。信号源抵抗とスイッチの抵抗が直列に入る。(b) 標本化時間の間に充電し、スイッチを切って、保った電圧を量子化する。標本化の初めには、前のチャネルの電圧が残っている。")
F["e09_sh"] = _f09_sh()

def _f09_shcharge():
    o = []
    Csh, Rsw = 8e-12, 1e3
    V0, Vin = 1.2, 14 * 100 / 490.0
    cases = [(5e3, GRN, "5 kΩ（サーミスタ）"), (390e3 * 100e3 / 490e3, GLD, "79.6 kΩ（車の分圧）"), (500e3, ALI, "500 kΩ（1 MΩ・1 MΩ）")]
    o.append(T(14, 18, "(a) 1.2 V の後に 2.86 V を測る", "start", 11.5, INK, True))
    pa = Plot(70, 40, 270, 180, (0, 10e-6), (1.0, 3.0))
    o.append(pa.axes(xl="標本化を始めてからの時間 [µs]", yl="コンデンサの電圧 [V]", xt=[0, 2e-6, 4e-6, 6e-6, 8e-6, 10e-6], yt=[1.0, 1.5, 2.0, 2.5, 3.0],
                     xfmt=lambda v: "%d" % round(v * 1e6), yfmt=lambda v: "%.1f" % v))
    for Rs, c, lab in cases:
        tau = (Rs + Rsw) * Csh
        o.append(pa.line([(i * 1e-7, Vin - (Vin - V0) * math.exp(-i * 1e-7 / tau)) for i in range(101)], c=c, lw=2.2))
    o.append(W(pa.X(1.5e-6), pa.y, pa.X(1.5e-6), pa.y + pa.h, c=MUT, lw=1.2, dash="4 3"))
    o.append(T(pa.X(1.5e-6) + 4, pa.Y(1.12), "1.5 µs", "start", 9.5, MUT, True, halo=True))
    tau = (cases[1][0] + Rsw) * Csh
    v = Vin - (Vin - V0) * math.exp(-1.5e-6 / tau)
    o.append(D(pa.X(1.5e-6), pa.Y(v), GLD, 3.8))
    o.append(T(pa.X(1.5e-6) + 6, pa.Y(v) + 15, "2.70 V（−0.16 V）", "start", 9.5, GLD, True, halo=True))
    tau = (cases[2][0] + Rsw) * Csh
    v = Vin - (Vin - V0) * math.exp(-1.5e-6 / tau)
    o.append(D(pa.X(1.5e-6), pa.Y(v), ALI, 3.8))
    o.append(T(pa.X(1.5e-6) + 6, pa.Y(v) + 4, "1.72 V", "start", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(9.8e-6), pa.Y(Vin) - 6, "2.86 V", "end", 9.5, TEA, True, halo=True))
    # (b) 残りの差（最悪の場合）
    o.append(T(386, 18, "(b) 差が基準電圧いっぱい（3.3 V）のとき", "start", 11.5, INK, True))
    pb = Plot(450, 40, 230, 180, (0, 40e-6), (1e-4, 10), ylog=True)
    o.append(pb.axes(xl="時間 [µs]", yl=None, xt=[0, 10e-6, 20e-6, 30e-6, 40e-6], yt=[1e-4, 1e-3, 1e-2, 1e-1, 1, 10],
                     xfmt=lambda v: "%d" % round(v * 1e6), yfmt=lambda v: {1e-4: "0.1 mV", 1e-3: "1 mV", 1e-2: "10 mV", 1e-1: "0.1 V", 1: "1 V", 10: "10 V"}[v]))
    th = 3.3 / 8192
    o.append(pb.line([(0, th), (40e-6, th)], c=SIG, lw=1.2, dash="5 3"))
    o.append(T(pb.X(39e-6), pb.Y(th) + 14, "12 ビットの 1/2 LSB", "end", 9.5, SIG, True, halo=True))
    for k, (Rs, c, lab) in enumerate(cases):
        tau = (Rs + Rsw) * Csh
        o.append(pb.line([(i * 4e-7, max(1e-4, 3.3 * math.exp(-i * 4e-7 / tau))) for i in range(101)], c=c, lw=2.2))
        tc = tau * math.log(2 ** 13)
        o.append(D(pb.X(tc), pb.Y(th), c, 3.6))
        o.append(T(pb.X(tc) + 5, pb.Y(th) + (15 if k == 0 else -7), _f09_g(tc * 1e6, 2) + " µs", "start", 9.5, c, True, halo=True))
    o.append(LEGEND(70, 270, [(c, "信号源抵抗 " + lab) for Rs, c, lab in cases], gap=14))
    # (c) ピンのコンデンサ
    y3 = 300
    o.append(T(14, y3, "(c) ピンのコンデンサがあるとき（1.2 V の後に 2.86 V、12 ビット、3.3 V）", "start", 11.5, INK, True))
    lsb, dv = 3.3 / 4096, Vin - V0
    tau79 = (390e3 * 100e3 / 490e3 + Rsw) * Csh
    rows = [("なし（標本化時間 1.5 µs）", dv * math.exp(-1.5e-6 / tau79) / lsb, ALI)] + \
           [(lab, dv * Csh / (cx + Csh) / lsb, c) for lab, cx, c in (("1 nF", 1e-9, GLD), ("10 nF", 10e-9, GLD), ("100 nF", 100e-9, GRN))]
    x0, w = 210, 400
    XL = lambda v: x0 + (math.log10(v) + 1) / 4.0 * w
    for t_ in (0.1, 1, 10, 100, 1000):
        o.append(W(XL(t_), y3 + 12, XL(t_), y3 + 12 + 4 * 22, c=GRD, lw=1))
        o.append(T(XL(t_), y3 + 12 + 4 * 22 + 13, "%g LSB" % t_, "middle", 9, MUT))
    for i, (lab, v, c) in enumerate(rows):
        yy = y3 + 14 + i * 22
        o.append(T(x0 - 8, yy + 13, lab, "end", 10, INK))
        o.append(RECT(x0, yy + 2, XL(v) - x0, 15, 2, soft(c), c, 1.1))
        o.append(T(XL(v) + 6, yy + 14, _f09_g(v, 3) + " LSB", "start", 9.5, c, True))
    return SVG(700, y3 + 122, o, "標本化の時間とコンデンサの電圧（サンプル・ホールドの容量 8 pF、スイッチの抵抗 1 kΩ。例の値）。(a) 信号源抵抗が大きいと、標本化時間の間に充電しきれず、前のチャネルの電圧に引きずられる。(b) 対数目盛では残りの差は直線で減り、12 ビットの 1/2 LSB を切る時間が、要る標本化時間（表の値）になる。(c) ピンに大きなコンデンサを付けると、信号源抵抗によらず誤差が小さくなる（横軸は対数目盛）。")
F["e09_shcharge"] = _f09_shcharge()

# ---- 6 節: 平均化 ----
def _f09_avg():
    o = []
    rnd = _f09_random.Random(9)
    sig, mu = 3.0, 2048.0
    xs = [round(mu + rnd.gauss(0, sig)) for _ in range(64)]
    o.append(T(14, 18, "(a) σ = 3 LSB のノイズがある 64 回の値と、16 回ずつの平均", "start", 11.5, INK, True))
    pa = Plot(70, 36, 610, 130, (0, 64), (2036, 2060))
    o.append(pa.axes(xl="測った順番", yl="ADC の値", xt=[0, 16, 32, 48, 64], yt=[2036, 2042, 2048, 2054, 2060], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(pa.line([(0, mu), (64, mu)], c=GRN, lw=1.4, dash="6 4"))
    o.append(PL([(pa.X(i + 0.5), pa.Y(v)) for i, v in enumerate(xs)], c=TEA, lw=0.8))
    for i, v in enumerate(xs):
        o.append(D(pa.X(i + 0.5), pa.Y(v), TEA, 2.6))
    for b in range(4):
        m = sum(xs[b * 16:(b + 1) * 16]) / 16.0
        o.append(pa.line([(b * 16 + 0.3, m), (b * 16 + 15.7, m)], c=SIG, lw=3))
        o.append(T(pa.X(b * 16 + 8), pa.Y(m) - 8 if m >= mu else pa.Y(m) + 16, "%.2f" % m, "middle", 10, SIG, True, halo=True))
    o.append(T(pa.X(63.6), pa.Y(2058.5), "本当の値 2048", "end", 9.5, GRN, True, halo=True))
    # (b) ヒストグラム
    y2 = 232
    o.append(T(14, y2, "(b) 1 回の値と、16 回の平均の分布（4000 回ずつ）", "start", 11.5, INK, True))
    rnd = _f09_random.Random(5)
    single = [round(mu + rnd.gauss(0, sig)) - mu for _ in range(4000)]
    avg16 = []
    for _ in range(4000):
        avg16.append(sum(round(mu + rnd.gauss(0, sig)) for _ in range(16)) / 16.0 - mu)
    pb = Plot(70, y2 + 18, 290, 140, (-10, 10), (0, 0.6))
    o.append(pb.axes(xl="本当の値からのずれ [LSB]", yl="割合（1 LSB あたり）", xt=[-10, -5, 0, 5, 10], yt=[0, 0.2, 0.4, 0.6], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    def hist(vals, w):
        bins = {}
        for v in vals:
            k = math.floor(v / w + 0.5)
            bins[k] = bins.get(k, 0) + 1
        return [(k * w, n / len(vals) / w) for k, n in sorted(bins.items())]
    for vals, w, c in ((single, 1.0, TEA), (avg16, 0.25, SIG)):
        for x, h in hist(vals, w):
            if -10 <= x - w / 2 and x + w / 2 <= 10:
                o.append(RECT(pb.X(x - w / 2), pb.Y(min(h, 0.6)), pb.X(x + w / 2) - pb.X(x - w / 2), pb.Y(0) - pb.Y(min(h, 0.6)), 0, soft(c), c, 0.8))
    o.append(T(pb.X(-9.6), pb.Y(0.52), "1 回: σ = 3 LSB", "start", 9.5, TEA, True, halo=True))
    o.append(T(pb.X(-9.6), pb.Y(0.44), "16 回の平均: 0.75 LSB", "start", 9.5, SIG, True, halo=True))
    # (c) σ と回数
    o.append(T(410, y2, "(c) 平均の回数とばらつき", "start", 11.5, INK, True))
    pc = Plot(470, y2 + 18, 210, 140, (1, 256), (0.1, 5), xlog=True, ylog=True)
    o.append(pc.axes(xl="平均の回数 N", yl="平均の σ [LSB]", xt=[1, 4, 16, 64, 256], yt=[0.1, 1], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    o.append(pc.line([(n, sig / math.sqrt(n)) for n in (1, 256)], c=GLD, lw=1.6, dash="5 3"))
    rnd = _f09_random.Random(7)
    for n in (1, 4, 16, 64, 256):
        ms = []
        for _ in range(1500):
            ms.append(sum(rnd.gauss(0, sig) for _ in range(n)) / n)
        m0 = sum(ms) / len(ms)
        sd = math.sqrt(sum((v - m0) ** 2 for v in ms) / len(ms))
        o.append(D(pc.X(n), pc.Y(sd), SIG, 4))
    o.append(T(pc.X(1.5), pc.Y(0.16), "点: 乱数で試した値", "start", 9.5, SIG, True, halo=True))
    o.append(T(pc.X(20), pc.Y(1.6), "線: 3 ÷ √N", "start", 9.5, GLD, True, halo=True))
    return SVG(700, y2 + 200, o, "平均化でランダムなノイズが減る様子（ノイズの標準偏差 σ = 3 LSB、乱数で作った例）。(a) 1 回ずつの値は ±数 LSB ばらつくが、16 回の平均は本当の値に近い。(b) 平均の分布の幅は、1 回の値の 1/4 になる。(c) 平均の標準偏差は σ ÷ √N で、回数を 4 倍にすると半分になる。")
F["e09_avg"] = _f09_avg()

def _f09_periodic():
    o = []
    o.append(T(14, 18, "(a) 1 回ごとに位相が θ ずつ進むノイズ", "start", 11.5, INK, True))
    for k, (cx, title, sub, ang, c) in enumerate(((90, "時間が周期の整数倍", "点が円を等しく分ける → 和は 0", [i * 72 for i in range(5)], GRN),
                                                 (250, "間隔が周期の整数倍", "毎回同じ位相 → 減らない", [40] * 5, ALI))):
        cy, r = 120, 52
        o.append(CIRC(cx, cy, r, c=LIN, lw=1.2))
        o.append(W(cx - r - 8, cy, cx + r + 8, cy, c=FNT, lw=1))
        o.append(W(cx, cy - r - 8, cx, cy + r + 8, c=FNT, lw=1))
        for i, a in enumerate(ang):
            ax, ay = cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a))
            o.append(ARR(cx, cy, ax, ay, c=c, lw=1.3, head=5))
            o.append(D(ax, ay, c, 3.6))
        o.append(T(cx, 50, title, "middle", 10.5, c, True))
        o.append(T(cx, 196, sub, "middle", 9.5, c, True))
    o.append(T(170, 220, "縦の位置が、その回に測るノイズ", "middle", 9.5, MUT))
    # (b) 残る割合
    o.append(T(380, 18, "(b) 1 ms ごとに測って平均したときに残る割合", "start", 11.5, INK, True))
    pb = Plot(430, 40, 250, 170, (0, 0.12), (0, 1.0))
    o.append(pb.axes(xl="平均をとる時間 [ms]", yl="残る割合", xt=[0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12], yt=[0, 0.25, 0.5, 0.75, 1.0],
                     xfmt=lambda v: "%d" % round(v * 1000), yfmt=lambda v: "%g" % v))
    d = 1e-3
    for f, c in ((50.0, SIG), (60.0, PUR)):
        pts = []
        for n in range(1, 121):
            W_ = n * d
            pts.append((W_, abs(math.sin(math.pi * f * W_) / (n * math.sin(math.pi * f * d)))))
        o.append(pb.line(pts, c=c, lw=2))
    o.append(W(pb.X(0.1), pb.y, pb.X(0.1), pb.y + pb.h, c=GRN, lw=1.4, dash="4 3"))
    o.append(T(pb.X(0.1) - 4, pb.Y(0.9), "100 ms で", "end", 9.5, GRN, True, halo=True))
    o.append(T(pb.X(0.1) - 4, pb.Y(0.9) + 13, "両方 0", "end", 9.5, GRN, True, halo=True))
    r16 = abs(math.sin(math.pi * 50 * 0.016) / (16 * math.sin(math.pi * 50 * d)))
    o.append(D(pb.X(0.016), pb.Y(r16), SIG, 4))
    o.append(T(pb.X(0.016) + 6, pb.Y(r16) - 6, "16 ms: 23 %", "start", 9.5, SIG, True, halo=True))
    o.append(LEGEND(430, 262, [(SIG, "50 Hz"), (PUR, "60 Hz")]))
    o.append(T(430, 280, "0 になるのは、50 Hz で 20 ms ごと、60 Hz で 16.7 ms ごと", "start", 9.5, MUT))
    return SVG(700, 290, o, "周期的なノイズの平均。(a) 測るたびにノイズの位相が θ ずつ進むとみると、平均をとる時間が周期の整数倍なら、点は円を等しく分け、和は 0 になる。測る間隔が周期の整数倍なら、毎回同じ位相を測るので、平均しても減らない。(b) 50 Hz と 60 Hz のノイズを 1 ms ごとに測って平均したとき、平均に残る大きさの上限。100 ms なら両方とも 0 になる。")
F["e09_periodic"] = _f09_periodic()

def _f09_dither():
    o = []
    def expect(x, s):
        if s == 0:
            return math.floor(x + 0.5)
        tot = 0.0
        for k in range(int(math.floor(x)) - 8, int(math.floor(x)) + 10):
            a = (k - 0.5 - x) / (s * math.sqrt(2))
            b = (k + 0.5 - x) / (s * math.sqrt(2))
            tot += k * 0.5 * (math.erf(b) - math.erf(a))
        return tot
    o.append(T(14, 18, "何回も平均したときの値と、本当の入力（ノイズの大きさ別）", "start", 11.5, INK, True))
    p = Plot(80, 40, 380, 200, (1000, 1002), (999.8, 1002.2))
    o.append(p.axes(xl="本当の入力 [LSB]", yl="平均した値 [LSB]", xt=[1000, 1000.5, 1001, 1001.5, 1002], yt=[1000, 1000.5, 1001, 1001.5, 1002],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(1000, 1000), (1002, 1002)], c=FNT, lw=1.2, dash="4 4"))
    xs = [1000 + i / 200.0 for i in range(401)]
    for s, c, lw in ((0.0, ALI, 2.2), (0.2, GLD, 1.8), (0.5, GRN, 2.4)):
        o.append(p.line([(x, expect(x, s)) for x in xs], c=c, lw=lw))
    o.append(D(p.X(1000.3), p.Y(1000), ALI, 4))
    o.append(T(p.X(1000.3) + 6, p.Y(1000) + 15, "1000.3 → 1000（ノイズ 0）", "start", 9.5, ALI, True, halo=True))
    x0 = 500
    o.append(LEGEND(x0, 66, [(ALI, "ノイズ 0")]))
    o.append(T(x0 + 16, 84, "毎回同じ値。平均しても", "start", 9.5, MUT))
    o.append(T(x0 + 16, 98, "±1/2 LSB の誤差が残る", "start", 9.5, MUT))
    o.append(LEGEND(x0, 126, [(GLD, "σ = 0.2 LSB")]))
    o.append(T(x0 + 16, 144, "段の近くだけ滑らか。", "start", 9.5, MUT))
    o.append(T(x0 + 16, 158, "最大 0.15 LSB ほどずれる", "start", 9.5, MUT))
    o.append(LEGEND(x0, 186, [(GRN, "σ = 0.5 LSB")]))
    o.append(T(x0 + 16, 204, "本当の入力にほぼ重なる。", "start", 9.5, MUT))
    o.append(T(x0 + 16, 218, "回数を増やせば細かく分かる", "start", 9.5, MUT))
    return SVG(700, 286, o, "オーバーサンプリングにノイズが要る理由。十分な回数を平均したときの値（期待値）を、本当の入力に対して描いた。ノイズが無いと、平均は ADC の値の段のまま変わらない。標準偏差が 1/2 LSB 程度のノイズがあると、平均は本当の入力に沿って動き、1 LSB より細かい値が分かる。")
F["e09_dither"] = _f09_dither()
