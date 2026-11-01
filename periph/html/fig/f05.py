# -*- coding: utf-8 -*-
# 05 章 マイコンの電源まわり の図

# ---- 補助: 記号・回路の部品 ----
def _f05_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。例 [("V", "BOR", True)]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    for s, sub, it in parts:
        o.append('<tspan font-style="%s">%s</tspan>' % ("italic" if it else "normal", E(s)))
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan><tspan dy="-3"></tspan>' % (sz * 0.72, E(sub)))
    o.append("</text>")
    return "".join(o)

def _f05_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f05_capv(x, y1, y2, c=INK, w=16):
    """縦向きのコンデンサ（y1 から y2 へ。中ほどに 2 枚の板）。"""
    ym = (y1 + y2) / 2
    return (W(x, y1, x, ym - 3, c=c, lw=1.5) + W(x - w / 2, ym - 3, x + w / 2, ym - 3, c=c, lw=2.2)
            + W(x - w / 2, ym + 3, x + w / 2, ym + 3, c=c, lw=2.2) + W(x, ym + 3, x, y2, c=c, lw=1.5))

def _f05_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6) + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2)

def _f05_batv(x, y1, y2, c=GLD):
    """縦向きの電池の記号（上がプラス）。y1 から y2 へ線をつなぐ。"""
    ym = (y1 + y2) / 2
    return (W(x, y1, x, ym - 4, c=INK, lw=1.5) + W(x - 13, ym - 4, x + 13, ym - 4, c=c, lw=1.8)
            + W(x - 6, ym + 4, x + 6, ym + 4, c=c, lw=3.4) + W(x, ym + 4, x, y2, c=INK, lw=1.5))

def _f05_diode_up(x, y, c=INK, s=7):
    """上向き（下から上へ電流を通す）のダイオード。(x, y) は三角の先（上）。"""
    return (PL([(x - s, y + 1.6 * s), (x + s, y + 1.6 * s), (x, y)], c=c, lw=1.3, fill=soft(c))
            + W(x - s, y, x + s, y, c=c, lw=1.8))

def _f05_q(v):
    return ("%.3f" % v).rstrip("0").rstrip(".")

# ---- 共通の例の値（本文と同じ） ----
_F05_VIN, _F05_VOUT, _F05_ETA0, _F05_IQL, _F05_IQS = 3.6, 1.8, 0.90, 1e-6, 10e-6
_F05_P0PWM = 3e-3      # 一定の周波数で動かすときの、負荷によらない損失 [W]（例の値）
_F05_IS, _F05_IA, _F05_TA = 2e-6, 6e-3, 0.020

def _f05_eta(kind, i):
    if kind == "ldo":
        return _F05_VOUT * i / (_F05_VIN * (i + _F05_IQL))
    p0 = _F05_VIN * _F05_IQS + (_F05_P0PWM if kind == "pwm" else 0.0)
    return _F05_VOUT * i / (_F05_VOUT * i / _F05_ETA0 + p0)

# ---- 1 節: LDO とスイッチング電源 ----
def _f05_regs():
    o = []
    # 上: 2 つの方式の構成
    o.append(T(14, 20, "(a) LDO", "start", 11.5, SIG, True))
    o.append(T(370, 20, "(b) スイッチング電源（降圧の例）", "start", 11.5, GRN, True))
    y = 66
    # (a)
    o.append(T(14, y - 14, "入力", "start", 10, MUT) + CIRC(30, y, 4, c=INK, lw=1.4, fill=PAN))
    o.append(W(34, y, 110, y, c=GLD, lw=1.8))
    o.append(RECT(110, y - 24, 120, 48, 8, SSOFT, SIG, 1.4))
    o.append(_f05_resh(126, 214, y, c=SIG, lw=1.6))
    o.append(ARR(140, y + 16, 202, y - 16, c=SIG, lw=1.3, head=6))
    o.append(T(170, y + 38, "抵抗を加減する", "middle", 9.5, SIG))
    o.append(W(230, y, 310, y, c=GLD, lw=1.8) + CIRC(314, y, 4, c=INK, lw=1.4, fill=PAN))
    o.append(T(330, y - 14, "出力", "end", 10, MUT))
    for k in range(3):
        xx = 150 + k * 20
        o.append(PATH("M%g,%g q4,-5 0,-10 q-4,-5 0,-10" % (xx, y - 28), c=ALI, lw=1.4))
    o.append(T(214, y - 38, "差は熱になる", "start", 9.5, ALI, True))
    o.append(T(72, y + 18, "100 mA", "middle", 9.5, GLD))
    o.append(T(270, y + 18, "100 mA", "middle", 9.5, GLD))
    # (b)
    xs = 384
    o.append(T(xs - 14, y - 14, "入力", "start", 10, MUT) + CIRC(xs, y, 4, c=INK, lw=1.4, fill=PAN))
    o.append(W(xs + 4, y, 430, y, c=GLD, lw=1.8))
    o.append(D(430, y, INK, 2.6) + W(430, y, 452, y - 12, c=GRN, lw=2) + D(458, y, INK, 2.6))
    o.append(T(444, y - 20, "入れ切り", "middle", 9.5, GRN, True))
    o.append(W(458, y, 480, y, c=GLD, lw=1.8))
    d = "M480,%g" % y
    for k in range(4):
        d += " a7,7 0 0 1 14,0"
    o.append(PATH(d, c=GRN, lw=1.6))
    o.append(T(508, y - 14, "コイル", "middle", 9.5, GRN))
    o.append(W(536, y, 640, y, c=GLD, lw=1.8) + CIRC(644, y, 4, c=INK, lw=1.4, fill=PAN))
    o.append(T(660, y - 14, "出力", "end", 10, MUT))
    o.append(D(590, y, INK, 2.6) + _f05_capv(590, y, y + 34, c=GRN) + _f05_gnd(590, y + 34))
    o.append(T(606, y + 22, "コンデンサ", "start", 9.5, GRN))
    o.append(PL([(400, y + 30), (410, y + 30), (410, y + 18), (420, y + 18), (420, y + 30), (430, y + 30), (430, y + 18), (440, y + 18), (440, y + 30), (450, y + 30)], c=MUT, lw=1.2))
    o.append(T(425, y + 46, "数百 kHz〜数 MHz", "middle", 9.5, MUT))
    # 下: 電力の内訳
    rows = [("LDO", 5.0, 0.33, 0.17), ("スイッチング電源", 5.0, 0.33, 0.33 / 0.9 - 0.33),
            ("LDO", 12.0, 0.33, 0.87), ("スイッチング電源", 12.0, 0.33, 0.33 / 0.9 - 0.33)]
    y0, rh, xb, sc = 150, 30, 214, 300 / 1.2
    o.append(T(14, y0 - 8, "3.3 V・100 mA（0.33 W）を作るときの入力の電力の内訳", "start", 10.5, INK, True))
    for i, (nm, vin, pout, ploss) in enumerate(rows):
        yy = y0 + 6 + i * rh
        c = SIG if nm == "LDO" else GRN
        o.append(T(14, yy + 15, "%g V から" % vin, "start", 10, INK, True))
        o.append(T(xb - 8, yy + 15, nm, "end", 10, c, True))
        o.append(RECT(xb, yy + 2, pout * sc, 20, 2, GSOFT, GRN, 1.1))
        o.append(RECT(xb + pout * sc, yy + 2, max(ploss * sc, 1.5), 20, 2, ASOFT, ALI, 1.1))
        pin = pout + ploss
        o.append(T(xb + pin * sc + 6, yy + 16, "入力 %.2f W（効率 %.0f %%）・熱 %.2f W" % (pin, pout / pin * 100, ploss), "start", 9.5, c, True))
    ya = y0 + 6 + 4 * rh + 6
    o.append(W(xb, ya, xb + 1.2 * sc, ya, c=MUT, lw=1))
    for v in (0, 0.3, 0.6, 0.9, 1.2):
        o.append(W(xb + v * sc, ya, xb + v * sc, ya + 4, c=MUT, lw=1) + T(xb + v * sc, ya + 16, "%g W" % v, "middle", 9.5, MUT))
    o.append(LEGEND(14, ya + 36, [(GRN, "出力の電力（負荷に渡る）"), (ALI, "熱（レギュレータの中で失われる）")]))
    return SVG(700, ya + 46, o, "LDO とスイッチング電源で 3.3 V・100 mA を作る例。LDO は入力と出力の電圧の差を熱にするので、入力が 12 V なら入力の電力の 7 割以上が熱になる。スイッチング電源（効率 90 % とした例）は、入力の電圧によらず熱が小さい。")
F["e05_regs"] = _f05_regs()

def _f05_dropout():
    o = []
    p = Plot(78, 26, 330, 210, (2.8, 4.4), (2.4, 3.6))
    o.append(RECT(p.X(3.0), p.y, p.X(4.2) - p.X(3.0), p.h, 0, GOSOFT, "none", 0, op=0.55))
    o.append(T(p.X(3.6), p.y + 14, "リチウムイオン電池の範囲（4.2〜3.0 V）", "middle", 9.5, GLD, True, halo=True))
    o.append(p.axes(xl="入力の電圧（電池の電圧）[V]", yl="出力の電圧 [V]", xt=[2.8, 3.2, 3.6, 4.0, 4.4], yt=[2.4, 2.7, 3.0, 3.3, 3.6],
                    xfmt=lambda v: "%.1f" % v, yfmt=lambda v: "%.1f" % v))
    xs = [2.8 + 0.01 * k for k in range(161)]
    o.append(p.line([(v, v - 0.2) for v in xs if 2.6 <= v - 0.2 <= 3.6], c=FNT, lw=1.1, dash="3 3"))
    o.append(p.line([(v, 3.3) for v in xs], c=GRN, lw=2.2, dash="7 4"))
    o.append(p.line([(v, min(3.3, v - 0.2)) for v in xs], c=SIG, lw=2.4))
    o.append(p.line([(v, min(3.0, v - 0.2)) for v in xs], c=TEA, lw=2.4))
    o.append(T(p.X(4.38), p.Y(3.3) - 7, "昇降圧（3.3 V）", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(4.38), p.Y(3.3) + 15, "LDO 3.3 V", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(4.38), p.Y(3.0) + 15, "LDO 3.0 V", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(2.84), p.Y(2.66) - 4, "出力 = 入力 − 0.2 V", "start", 9, MUT, halo=True))
    for vx, vy, c in ((3.5, 3.3, SIG), (3.2, 3.0, TEA)):
        o.append(D(p.X(vx), p.Y(vy), c, 4))
        o.append(W(p.X(vx), p.Y(vy), p.X(vx), p.Y(2.4), c=c, lw=1, dash="3 3"))
    o.append(T(p.X(3.5) + 5, p.Y(2.95), "3.5 V より下で", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(3.5) + 5, p.Y(2.95) + 13, "出力が下がる", "start", 9.5, SIG, halo=True))
    # 右: 使える容量
    bx, by = 450, 50
    o.append(T(bx, by - 18, "使える容量（03 章の模型・小さな電流）", "start", 10.5, INK, True))
    rows = [("3.3 V が要る・LDO 3.3 V", "電池が 3.5 V まで", 0.88, SIG), ("3.0 V で動く・LDO 3.0 V", "電池が 3.2 V まで", 0.97, TEA),
            ("3.3 V が要る・昇降圧", "電池の終止電圧まで", 1.00, GRN)]
    for i, (a, b, f, c) in enumerate(rows):
        yy = by + i * 60
        o.append(T(bx, yy + 6, a, "start", 10, c, True))
        o.append(T(bx, yy + 21, b, "start", 9.5, MUT))
        o.append(RECT(bx, yy + 28, 180 * f, 14, 2, soft(c), c, 1.1))
        o.append(RECT(bx, yy + 28, 180, 14, 2, "none", LIN, 0.8))
        o.append(T(bx + 186, yy + 39, "%.0f %%" % (f * 100), "start", 10, c, True))
    return SVG(700, 276, o, "リチウムイオン電池から電圧を作るときの、入力と出力の電圧（ドロップアウト電圧 0.2 V とした例）。LDO は、入力が出力 + 0.2 V を下回ると、出力が入力に合わせて下がる。出力の電圧を下げるか、昇降圧のスイッチング電源にすると、電池の容量を多く使える。")
F["e05_dropout"] = _f05_dropout()

def _f05_eff():
    o = []
    p = Plot(80, 24, 460, 220, (1e-6, 0.1), (0, 100), xlog=True)
    xt = [1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 0.1]
    xf = {1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA", 1e-2: "10 mA", 0.1: "100 mA"}
    o.append(p.axes(xl="負荷（出力）の電流", yl="効率 [%]", xt=xt, yt=[0, 20, 40, 60, 80, 100], xfmt=lambda v: xf[v], yfmt=lambda v: "%d" % v))
    xs = [10 ** (-6 + k * 5 / 100.0) for k in range(101)]
    for kind, c, dash in (("pwm", PUR, "6 4"), ("pfm", GRN, None), ("ldo", SIG, None)):
        o.append(p.line([(x, _f05_eta(kind, x) * 100) for x in xs], c=c, lw=2.4, dash=dash))
    for x, lab in ((2e-6, "眠り 2 µA"), (6e-3, "起きている間 6 mA")):
        o.append(W(p.X(x), p.y, p.X(x), p.y + p.h, c=FNT, lw=1.1, dash="3 3"))
        o.append(T(p.X(x) + 4, p.y + 12, lab, "start", 9.5, MUT, halo=True))
    ist = (_F05_IQS - _F05_IQL) / (1 - _F05_VOUT / (_F05_ETA0 * _F05_VIN))
    o.append(D(p.X(ist), p.Y(_f05_eta("ldo", ist) * 100), ALI, 4.2))
    o.append(T(p.X(ist) + 7, p.Y(_f05_eta("ldo", ist) * 100) + 16, "交わる所 20.3 µA（2 節の I*）", "start", 9.5, ALI, True, halo=True))
    for x, kind, c, dy in ((2e-6, "ldo", SIG, -7), (2e-6, "pfm", GRN, -7), (6e-3, "pfm", GRN, -7), (6e-3, "pwm", PUR, 15), (6e-3, "ldo", SIG, 15)):
        v = _f05_eta(kind, x) * 100
        o.append(D(p.X(x), p.Y(v), c, 3.4))
        o.append(T(p.X(x) - 6, p.Y(v) + dy, "%.0f %%" % v, "end", 9.5, c, True, halo=True))
    # 凡例（右）
    lx = 560
    for i, (c, a, b) in enumerate(((SIG, "LDO", "静止電流 1 µA"), (GRN, "スイッチング電源", "軽い負荷の動作・静止電流 10 µA"),
                                   (PUR, "スイッチング電源", "一定の周波数の動作"))):
        yy = 46 + i * 50
        o.append(W(lx, yy - 4, lx + 22, yy - 4, c=c, lw=2.4, dash="6 4" if c == PUR else None))
        o.append(T(lx + 28, yy, a, "start", 10, c, True))
        for j, l in enumerate(wrap(b, 9)):
            o.append(T(lx + 28, yy + 15 + j * 13, l, "start", 9.5, MUT))
    return SVG(700, 286, o, "3.6 V から 1.8 V を作るときの、負荷の電流と効率（2 節の模型で描いた代表的な形。値は例）。LDO は 1.8 ÷ 3.6 = 50 % でほぼ一定。スイッチング電源は mA では 90 % 近いが、負荷によらない損失があるので、µA の負荷では大きく下がる。")
F["e05_eff"] = _f05_eff()

# ---- 2 節: 平均電流と周期 ----
def _f05_avg():
    o = []
    k = _F05_VOUT / (_F05_ETA0 * _F05_VIN)
    qa = (_F05_IA - _F05_IS) * _F05_TA
    iout = lambda T_: _F05_IS + qa / T_
    il = lambda T_: (iout(T_) + _F05_IQL) * 1e6
    isw = lambda T_: (k * iout(T_) + _F05_IQS) * 1e6
    p = Plot(78, 28, 330, 222, (0.1, 1000), (1, 2000), xlog=True, ylog=True)
    xf = {0.1: "0.1 s", 1: "1 s", 10: "10 s", 100: "100 s", 1000: "1000 s"}
    o.append(p.axes(xl="起きる周期 T", yl="入力の平均電流 [µA]", xt=[0.1, 1, 10, 100, 1000], yt=[1, 10, 100, 1000],
                    xfmt=lambda v: xf[v], yfmt=lambda v: "%g" % v))
    xs = [10 ** (-1 + j * 4 / 120.0) for j in range(121)]
    o.append(p.line([(0.1, 3.0), (1000, 3.0)], c=SIG, lw=1, dash="3 3"))
    o.append(p.line([(0.1, k * 2 + 10), (1000, k * 2 + 10)], c=GRN, lw=1, dash="3 3"))
    o.append(p.line([(x, isw(x)) for x in xs if isw(x) <= 2000], c=GRN, lw=2.4))
    o.append(p.line([(x, il(x)) for x in xs if il(x) <= 2000], c=SIG, lw=2.4))
    o.append(T(p.X(0.2) + 4, p.Y(il(0.2)) - 8, "LDO", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(0.13), p.Y(isw(0.13)) + 16, "スイッチング電源", "start", 10, GRN, True, halo=True))
    o.append(T(p.X(990), p.Y(3.0) + 13, "LDO の下限 3 µA（眠り 2 + 静止 1）", "end", 9, SIG, halo=True))
    o.append(T(p.X(990), p.Y(k * 2 + 10) - 6, "スイッチング電源の下限 11.1 µA", "end", 9, GRN, halo=True))
    ts = qa / ((_F05_IQS - _F05_IQL) / (1 - k) - _F05_IS)
    o.append(W(p.X(ts), p.Y(1), p.X(ts), p.Y(il(ts)), c=ALI, lw=1.1, dash="3 3"))
    o.append(D(p.X(ts), p.Y(il(ts)), ALI, 4.2))
    o.append(T(p.X(ts) + 6, p.Y(il(ts)) - 8, "T* = %.1f s" % ts, "start", 10, ALI, True, halo=True))
    o.append(T(p.X(ts) - 8, p.Y(1100), "← スイッチング電源が得", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(ts) + 8, p.Y(1100), "LDO が得 →", "start", 9.5, SIG, True, halo=True))
    # 右: 内訳
    bx = 452
    o.append(T(bx, 22, "入力の平均電流の内訳", "start", 10.5, INK, True))
    sc = 110 / 125.0
    yy = 40
    for T_ in (1.0, 60.0):
        o.append(T(bx, yy + 12, "T = %g s" % T_, "start", 10, INK, True))
        yy += 18
        for nm, c, load, q in (("LDO", SIG, iout(T_) * 1e6, 1.0), ("スイッチング", GRN, k * iout(T_) * 1e6, 10.0)):
            s2 = sc if T_ == 1.0 else sc * 10
            o.append(T(bx, yy + 13, nm, "start", 9.5, c, True))
            x0 = bx + 70
            o.append(RECT(x0, yy + 2, load * s2, 15, 2, soft(c), c, 1))
            o.append(RECT(x0 + load * s2, yy + 2, q * s2, 15, 2, GOSOFT, GLD, 1))
            o.append(T(x0 + (load + q) * s2 + 4, yy + 14, "%.1f µA" % (load + q), "start", 9.5, c, True))
            yy += 22
        o.append(T(bx, yy + 10, "（T = 60 s は横の縮尺を 10 倍）" if T_ == 60.0 else "", "start", 9, MUT))
        yy += 26
    o.append(LEGEND(bx, yy + 4, [(SIG, "負荷の分"), (GLD, "静止電流")], gap=10))
    o.append(T(bx, yy + 22, "スイッチングの負荷の分は", "start", 9, MUT))
    o.append(T(bx, yy + 35, "k = 0.556 倍になる", "start", 9, MUT))
    return SVG(700, 300, o, "3.6 V から 1.8 V を作る機器（眠り 2 µA、起きると 6 mA を 20 ms）の、起きる周期と入力の平均電流（両軸とも対数目盛）。周期が T* より短いと起きている間の電流が効き、スイッチング電源が得になる。長いと静止電流が効き、LDO が得になる。")
F["e05_avg"] = _f05_avg()

# ---- 3 節: 負荷スイッチと突入電流 ----
def _f05_loadsw():
    o = []
    yr, yg = 62, 196
    # 電池と内部抵抗
    o.append(_f05_batv(40, yr, yg, GLD))
    o.append(T(18, 134, "CR2032", "end", 9.5, GLD, True) if False else "")
    o.append(T(58, 120, "電池", "start", 10, GLD, True))
    o.append(_f05_m(58, 136, [("E", None, True), (" 3.0 V", None, False)], "start", 10, GLD))
    o.append(W(40, yr, 64, yr, c=INK, lw=1.5) + _f05_resh(64, 112, yr, c=INK) + W(112, yr, 150, yr, c=INK, lw=1.5))
    o.append(_f05_m(88, yr - 12, [("R", "in", True), (" 15 Ω", None, False)], "middle", 10, INK))
    # マイコンの側
    o.append(W(150, yr, 360, yr, c=SIG, lw=2))
    o.append(D(162, yr, INK, 2.6) + _f05_capv(162, yr, yg, c=SIG))
    o.append(_f05_m(174, 138, [("C", "A", True), (" 10 µF", None, False)], "start", 10, SIG))
    o.append(W(262, yr, 262, 96, c=SIG, lw=1.6))
    o.append(BOX(214, 96, 96, 50, "マイコン", "3 mA で動く", SIG, SSOFT, SIG, sz=11, ssz=9.5))
    o.append(_f05_m(214, yr - 12, [("V", "A", True), ("（マイコンの側）", None, False)], "start", 10, SIG, True))
    # 負荷スイッチ
    o.append(RECT(360, yr - 20, 92, 40, 7, PAN, PUR, 1.5))
    o.append(T(406, yr + 5, "負荷スイッチ", "middle", 10.5, PUR, True))
    o.append(W(310, 128, 406, 128, 406, yr + 20, c=SIG, lw=1.3, dash="5 3"))
    o.append(T(358, 122, "GPIO", "middle", 9.5, SIG))
    o.append(T(412, 108, "EN", "start", 9.5, PUR, True))
    # 周辺の側
    o.append(W(452, yr, 660, yr, c=PUR, lw=2))
    o.append(D(486, yr, INK, 2.6) + _f05_capv(486, yr, yg, c=PUR))
    o.append(_f05_m(498, 138, [("C", "L", True), (" 10 µF", None, False)], "start", 10, PUR))
    o.append(W(604, yr, 604, 96, c=PUR, lw=1.6))
    o.append(BOX(556, 96, 110, 50, "センサのモジュール", "使わない間は切る", PUR, PSOFT, PUR, sz=10.5, ssz=9.5))
    o.append(_f05_m(500, yr - 12, [("V", "B", True), ("（周辺の側）", None, False)], "start", 10, PUR, True))
    # GND
    o.append(W(40, yg, 660, yg, c=MUT, lw=1.4) + _f05_gnd(350, yg))
    # 突入電流の矢印
    o.append(ARR(460, yr + 14, 478, yr + 14, c=ALI, lw=1.6, head=6) + W(478, yr + 14, 478, yr + 40, c=ALI, lw=1.6))
    o.append(ARR(478, yr + 40, 478, 100, c=ALI, lw=1.6, head=6))
    o.append(T(470, 236 - 14, "入れた瞬間: 空の C_L を充電する突入電流が、電池と C_A から流れる", "start", 9.5, ALI, True) if False else "")
    o.append(T(14, 226, "切っている間: 周辺の電流は 0（周辺の眠りの電流も切れる）。", "start", 10, MUT))
    o.append(T(14, 243, "入れた瞬間: 空の C_L を充電する電流（突入電流）が、電池と C_A から流れ込む。", "start", 10, ALI, True))
    return SVG(700, 254, o, "負荷スイッチで周辺の電源を入れ切りする回路（値は 3 節の例）。マイコンは GPIO で負荷スイッチの EN を操作する。周辺の入口のコンデンサ C_L は、切っている間に空になり、入れた瞬間に大きな電流で充電される。")
F["e05_loadsw"] = _f05_loadsw()

def _f05_isim(E, Rin, CA, CL, Im, trise, Ron=0.1, tend=2e-3, step=4e-6):
    """突入電流の模型。trise=0 で一気に入れる（オン抵抗 Ron）。trise>0 では、負荷の側の電圧を傾き E/trise の直線に沿わせる。
    返り値は [(t, VA, VB, Isw, Ibat), ...]（step ごと）。"""
    out = []
    va, vb, t, nxt = E - Rin * Im, 0.0, 0.0, 0.0
    S = E / trise if trise > 0 else 0.0
    while t < tend:
        dt = 2e-9 if (trise == 0 and t < 1e-5) else 2e-7
        imax = max(0.0, (va - vb) / Ron)
        if trise == 0:
            isw = imax
        else:
            want = (CL * S if S * t < va else 0.0) + (min(S * t, 10.0) - vb) * CL / 2e-6
            isw = min(max(want, 0.0), imax)
        ibat = (E - va) / Rin
        if t >= nxt:
            out.append((t, va, vb, isw, ibat))
            nxt += step
        va += (ibat - Im - isw) * dt / CA
        vb += isw * dt / CL
        t += dt
    return out

def _f05_inrush():
    o = []
    cases = [("(a) 一気に入れる（GPIO で MOSFET を直接）", 0.0, 70), ("(b) 1 ms で立ち上げる", 1e-3, 420)]
    for title, tr, x0 in cases:
        r = _f05_isim(3.0, 15.0, 10e-6, 10e-6, 3e-3, tr)
        pv = Plot(x0, 40, 240, 120, (0, 2.0), (0, 3.2))
        pi = Plot(x0, 206, 240, 80, (0, 2.0), (0, 120))
        o.append(T(x0 - 56, 20, title, "start", 10.5, INK, True))
        o.append(pv.axes(yl="電圧 [V]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 1, 2, 3], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
        o.append(pi.axes(xl="時間 [ms]", yl="電流 [mA]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 40, 80, 120], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(pv.line([(0, 2.2), (2.0, 2.2)], c=ALI, lw=1.1, dash="5 3"))
        o.append(T(pv.X(2.0) - 2, pv.Y(2.2) + 12, "V_min 2.2 V", "end", 9, ALI, halo=True))
        o.append(pv.line([(q[0] * 1e3, q[2]) for q in r], c=PUR, lw=2))
        o.append(pv.line([(q[0] * 1e3, q[1]) for q in r], c=SIG, lw=2.2))
        o.append(pi.line([(q[0] * 1e3, min(q[3] * 1e3, 125)) for q in r], c=PUR, lw=1.8))
        o.append(pi.line([(q[0] * 1e3, q[4] * 1e3) for q in r], c=GLD, lw=2))
        vmin = min(q[1] for q in r)
        tmin = [q[0] for q in r if q[1] == vmin][0] * 1e3
        below = sum(1 for q in r if q[1] < 2.2) * 4e-3
        o.append(D(pv.X(tmin), pv.Y(vmin), ALI if vmin < 2.2 else GRN, 4))
        if tr == 0:
            o.append(T(pv.X(tmin) + 8, pv.Y(vmin) + 4, "最低 %.2f V（%.1f ms 下回る）→ リセット" % (vmin, below), "start", 9.5, ALI, True, halo=True))
            o.append(T(pi.X(0) + 8, pi.y + 12, "↑ スイッチの電流のピークは約 30 A（軸の外）", "start", 9, PUR, True, halo=True))
        else:
            o.append(T(pv.X(tmin) + 2, pv.Y(vmin) + 16, "最低 %.2f V（リセットしない）" % vmin, "middle", 9.5, GRN, True, halo=True))
            o.append(T(pi.X(0.5), pi.Y(30) - 6, "突入電流 30 mA", "middle", 9, PUR, True, halo=True))
    yl = 338
    o.append(LEGEND(14, yl, [(SIG, "マイコンの側の電圧 V_A"), (PUR, "周辺の側の電圧 V_B・スイッチの電流"), (GLD, "電池の電流")], gap=12))
    o.append(T(14, yl + 18, "新しい CR2032（3.0 V・15 Ω）、マイコン 3 mA、C_A = C_L = 10 µF（例の値）。小さな時間刻みで回路の式を解いた。", "start", 9.5, MUT))
    return SVG(700, yl + 28, o, "負荷スイッチを入れたときの電圧と電流。(a) 一気に入れると、C_A の電荷が C_L へ移って、マイコンの側の電圧が 1.48 V まで落ち、0.2 ms ほど V_min を下回る。(b) 1 ms で立ち上げると、突入電流は 30 mA で、電圧は 2.51 V までしか下がらない。")
F["e05_inrush"] = _f05_inrush()

# ---- 4 節: 電源の入っていない IC への信号 ----
def _f05_bfpanel(o, x0, bad):
    title = "(a) 電源を切ったまま H を出す" if bad else "(b) 切っている間は L か入力"
    o.append(T(x0, 20, title, "start", 10.5, ALI if bad else GRN, True))
    # 負荷スイッチ（切）
    o.append(RECT(x0 + 214, 34, 70, 26, 5, PAN, PUR, 1.2) + T(x0 + 249, 51, "切", "middle", 10, PUR, True))
    o.append(T(x0 + 208, 51, "負荷スイッチ", "end", 9, PUR))
    # マイコン
    o.append(RECT(x0, 86, 96, 92, 8, SSOFT, SIG, 1.4))
    o.append(T(x0 + 48, 108, "マイコン", "middle", 11, SIG, True))
    o.append(T(x0 + 48, 126, "電源あり", "middle", 9.5, SIG))
    o.append(T(x0 + 48, 140, "3.0 V", "middle", 9.5, SIG))
    pin_y = 158
    o.append(T(x0 + 92, pin_y - 6, "H（3.0 V）" if bad else "L か入力", "end", 9.5, ALI if bad else GRN, True))
    o.append(W(x0 + 96, pin_y, x0 + 160, pin_y, c=ALI if bad else MUT, lw=1.8))
    # センサ
    o.append(RECT(x0 + 160, 72, 160, 126, 8, PAN, PUR, 1.4))
    o.append(T(x0 + 312, 192, "センサ（電源なし）", "end", 10, PUR, True))
    yv = 92
    o.append(W(x0 + 249, 60, x0 + 249, yv, c=PUR, lw=1.6) + W(x0 + 196, yv, x0 + 300, yv, c=PUR, lw=1.6))
    o.append(T(x0 + 300, yv - 6, "電源の線", "end", 9, PUR))
    o.append(W(x0 + 160, pin_y, x0 + 210, pin_y, c=ALI if bad else MUT, lw=1.6))
    o.append(W(x0 + 210, pin_y, x0 + 210, 136, c=ALI if bad else MUT, lw=1.4) + _f05_diode_up(x0 + 210, 113, ALI if bad else MUT) + W(x0 + 210, 113, x0 + 210, yv, c=ALI if bad else MUT, lw=1.4))
    o.append(T(x0 + 216, 151, "保護ダイオード", "start", 9, MUT))
    o.append(BOX(x0 + 252, 110, 56, 32, "回路", None, PUR, PSOFT, PUR, sz=10))
    o.append(W(x0 + 280, yv, x0 + 280, 110, c=PUR, lw=1.4))
    if bad:
        o.append(ARR(x0 + 112, pin_y + 12, x0 + 196, pin_y + 12, c=ALI, lw=1.5, head=6))
        o.append(ARR(x0 + 222, yv + 6, x0 + 268, yv + 6, c=ALI, lw=1.5, head=6))
        o.append(T(x0 + 112, pin_y + 28, "電流が流れ込む", "start", 9.5, ALI, True))
        o.append(T(x0 + 160, 222, "センサの電源の線が約 2.4 V に上がり、", "start", 9.5, ALI, True))
        o.append(T(x0 + 160, 237, "中途半端に動き出す", "start", 9.5, ALI, True))
    else:
        o.append(T(x0 + 160, 222, "電流は流れない。電源の線は 0 V", "start", 9.5, GRN, True))
        o.append(T(x0 + 160, 237, "（入れるときは電源が先、信号が後）", "start", 9.5, GRN))

def _f05_backfeed():
    o = []
    _f05_bfpanel(o, 14, True)
    _f05_bfpanel(o, 362, False)
    return SVG(700, 248, o, "電源を切ったセンサへの信号。(a) マイコンが H を出したままだと、センサのピンの保護ダイオードを通って電流が流れ込み、センサの電源の線が、マイコンの 3.0 V からダイオードの電圧（0.6 V 程度）を引いた電圧まで上がる。(b) 電源を切っている間はピンを L か入力にしておく。")
F["e05_backfeed"] = _f05_backfeed()

# ---- 4 節: 電源シーケンスのタイミング ----
def _f05_seq():
    o = []
    x0, x1, t1 = 170, 680, 32.0
    X = lambda t: x0 + t / t1 * (x1 - x0)
    rows = [("マイコンの電源", SIG), ("センサの EN", PUR), ("センサの電源", PUR), ("センサへのピン", TEA),
            ("無線の EN", GLD), ("無線の電源", GLD), ("無線へのピン", TEA)]
    y0, rh, hh = 52, 34, 18
    Y = lambda i, lv: y0 + i * rh + (0 if lv else hh)
    for i, (nm, c) in enumerate(rows):
        o.append(T(14, y0 + i * rh + 14, nm, "start", 10, c, True))
        o.append(W(x0, y0 + i * rh + hh + 6, x1, y0 + i * rh + hh + 6, c=GRD, lw=1))
    def dig(i, segs, c):
        pts = []
        for (ta, tb, lv) in segs:
            pts += [(X(ta), Y(i, lv)), (X(tb), Y(i, lv))]
        o.append(PL(pts, c=c, lw=2))
    def rail(i, t_on, t_rise, t_off, t_fall, c):
        pts = [(X(0), Y(i, 0)), (X(t_on), Y(i, 0)), (X(t_on + t_rise), Y(i, 1)), (X(t_off), Y(i, 1))]
        for k in range(1, 21):
            tt = t_off + t_fall * k / 20.0
            pts.append((X(tt), Y(i, 0) - (Y(i, 0) - Y(i, 1)) * math.exp(-3.0 * k / 20.0)))
        pts.append((X(t1), Y(i, 0)))
        o.append(PL(pts, c=c, lw=2))
    def pin(i, ta, tb):
        o.append(RECT(X(0), y0 + i * rh + 2, X(ta) - X(0), hh - 4, 3, MSOFT, MUT, 0.8))
        o.append(T((X(0) + X(ta)) / 2, y0 + i * rh + 13, "L か入力", "middle", 9, MUT))
        o.append(RECT(X(ta), y0 + i * rh + 2, X(tb) - X(ta), hh - 4, 3, TSOFT, TEA, 1))
        o.append(T((X(ta) + X(tb)) / 2, y0 + i * rh + 13, "使う", "middle", 9.5, TEA, True))
        o.append(RECT(X(tb), y0 + i * rh + 2, X(t1) - X(tb), hh - 4, 3, MSOFT, MUT, 0.8))
    dig(0, [(0, t1, 1)], SIG)
    dig(1, [(0, 1, 0), (1, 26, 1), (26, t1, 0)], PUR)
    rail(2, 1, 2, 26, 4, PUR)
    pin(3, 5, 25)
    dig(4, [(0, 5, 0), (5, 21, 1), (21, t1, 0)], GLD)
    rail(5, 5, 4, 21, 4, GLD)
    pin(6, 14, 20)
    # 出来事の印
    ev = [(1, "①"), (3, "②"), (5, "③"), (9, "④"), (14, "⑤"), (20, "⑥"), (21, "⑦"), (25, "⑧"), (26, "⑨")]
    for t, s in ev:
        o.append(W(X(t), 34, X(t), y0 + len(rows) * rh - 6, c=FNT, lw=1, dash="2 3"))
        o.append(T(X(t), 30, s, "middle", 10, INK, True))
    ya = y0 + len(rows) * rh
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for t in range(0, 33, 4):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1) + T(X(t), ya + 15, "%d" % t, "middle", 9, MUT))
    o.append(T(x1, ya + 30, "時間 [ms]（例の値）", "end", 9.5, MUT))
    notes = ["① センサの電源を入れる　② 立ち上がりを確かめる　③ 2 ms 待ってピンを使う設定にし、無線の電源を入れる",
             "④ 無線の電源が立ち上がる　⑤ 5 ms 待ってピンを使う　⑥〜⑨ 切るときは逆の順で、信号を先に外し、電源を後で切る"]
    for k, l in enumerate(notes):
        o.append(T(14, ya + 50 + k * 16, l, "start", 9.5, INK))
    return SVG(700, ya + 74, o, "4 節のコードの電源シーケンス（例の値）。電源を入れ、立ち上がったのを確かめてから信号をつなぎ、次の電源を入れる。切るときは逆の順に、信号を先に外す。切った電源は、コンデンサが放電する間ゆっくり下がる。")
F["e05_seq"] = _f05_seq()

# ---- 5 節: POR と BOR ----
_F05_LV = [(1.5, "V_POR 1.5 V", MUT), (1.8, "V_min 1.8 V", PUR), (2.0, "V_BOR 2.0 V", ALI), (2.1, "V_BOR + V_hys 2.1 V", GLD)]

def _f05_rbar(o, p, segs, y, t1):
    """リセットの状態の帯。segs = [(開始, 終了, 状態)]。状態は "rst" か "run"。"""
    for a, b, st in segs:
        c = ALI if st == "rst" else GRN
        xa, xb = p.X(a), p.X(min(b, t1))
        o.append(RECT(xa, y, max(xb - xa, 0.8), 16, 2, soft(c), c, 1))
        if xb - xa > 40:
            o.append(T((xa + xb) / 2, y + 12, "リセット" if st == "rst" else "実行", "middle", 9, c, True))

def _f05_porbor():
    o = []
    panels = [("(a) 電源を入れる", 62, 150, 10.0), ("(b) 動いている間の落ち込み", 256, 180, 20.0), ("(c) 電源が途切れる", 482, 200, 60.0)]
    ps = []
    for title, x0, w, t1 in panels:
        p = Plot(x0, 40, w, 180, (0, t1), (1.2, 3.2))
        ps.append(p)
        o.append(T(x0, 24, title, "start", 10.5, INK, True))
        tks = [0, 2, 4, 6, 8, 10] if t1 == 10 else ([0, 5, 10, 15, 20] if t1 == 20 else [0, 20, 40, 60])
        o.append(p.axes(xl="時間 [ms]", yl="電源電圧 [V]" if x0 == 62 else None, xt=tks, yt=[1.5, 2.0, 2.5, 3.0],
                        xfmt=lambda v: "%g" % v, yfmt=(lambda v: "%.1f" % v) if x0 == 62 else (lambda v: "")))
        for v, lab, c in _F05_LV:
            o.append(p.line([(0, v), (t1, v)], c=c, lw=1.1, dash="5 3"))
    # (a) 0 V から上がる
    pa, pb, pc = ps
    tau = 1.5
    ta1 = -tau * math.log(1 - 1.5 / 3.0); ta2 = -tau * math.log(1 - 2.1 / 3.0); tr = ta2 + 2.0
    pts = [(t / 50.0 * 10, 3.0 * (1 - math.exp(-(t / 50.0 * 10) / tau))) for t in range(51)]
    o.append(pa.line([(t, max(v, 1.2)) for t, v in pts if v >= 1.2], c=SIG, lw=2.2))
    o.append(T(pa.X(ta1) + 4, pa.Y(1.25), "0 V から", "start", 9, SIG, halo=True))
    o.append(D(pa.X(ta2), pa.Y(2.1), GLD, 3.6))
    o.append(DIM(pa.X(ta2), pa.Y(2.62), pa.X(tr), pa.Y(2.62), None, c=GLD))
    o.append(_f05_m(pa.X(ta2) + 2, pa.Y(2.62) - 6, [("t", "POR", True)], "start", 9.5, GLD, True))
    o.append(W(pa.X(tr), pa.Y(1.2), pa.X(tr), pa.Y(3.2), c=GRN, lw=1, dash="2 3"))
    o.append(T(pa.X(tr) + 3, pa.Y(1.7), "実行を", "start", 9, GRN, True, halo=True))
    o.append(T(pa.X(tr) + 3, pa.Y(1.7) + 12, "始める", "start", 9, GRN, True, halo=True))
    # (b) 落ち込み 2 回
    pts = [(0, 3.0), (3, 3.0), (3.6, 2.05), (4.4, 2.05), (5, 3.0), (10, 3.0), (10.6, 1.9), (11.4, 1.9), (12, 3.0), (20, 3.0)]
    o.append(pb.line(pts, c=SIG, lw=2.2))
    o.append(T(pb.X(4), pb.Y(2.05) - 24, "割らない", "middle", 9, GRN, True, halo=True))
    o.append(T(pb.X(4), pb.Y(2.05) - 12, "→ 続ける", "middle", 9, GRN, True, halo=True))
    tb1 = 10 + 0.6 * 1.0 / 1.1; tb2 = 11.4 + 0.6 * 0.2 / 1.1
    o.append(T(pb.X(14.5), pb.Y(1.9) + 4, "割る → リセット", "start", 9, ALI, True, halo=True))
    # (c) 途切れる（BOR あり・なし）
    t0 = 5.0
    tc_bor = t0 + (3.0 - 2.0) / 0.030
    tc_min = t0 + (3.0 - 1.8) / 0.030
    tc_por = t0 + (3.0 - 1.5) / 0.030
    o.append(RECT(pc.X(tc_min), pc.Y(3.2), pc.X(tc_por) - pc.X(tc_min), pc.h, 0, ASOFT, "none", 0, op=0.8))
    o.append(pc.line([(0, 3.0), (t0, 3.0), (tc_por, 1.5), (tc_por + 0.5, 1.2)], c=ALI, lw=1.6, dash="5 3"))
    o.append(pc.line([(0, 3.0), (t0, 3.0), (tc_bor, 2.0), (60, 2.0 - 0.001 * (60 - tc_bor))], c=SIG, lw=2.2))
    o.append(T(pc.X(1), pc.Y(3.0) - 6, "接点が離れる", "start", 9, MUT, halo=True))
    o.append(T(pc.X(tc_min) - 3, pc.Y(2.85), "BOR が無いと、ここで", "end", 9, ALI, True, halo=True))
    o.append(T(pc.X(tc_min) - 3, pc.Y(2.85) + 12, "CPU が動き続ける", "end", 9, ALI, True, halo=True))
    # しきい値の名前（(c) の左下）
    for v, lab, c in _F05_LV:
        dy = -4 if v == 2.1 else 11
        o.append(_f05_m(pc.X(0.8), pc.Y(v) + dy, [(lab.split(" ")[0][0], lab.split(" ")[0][2:] if "_" in lab.split(" ")[0] else None, True),
                                                  (lab[len(lab.split(" ")[0]):], None, False)], "start", 9, c, True))
    # リセットの帯
    yb = 268
    _f05_rbar(o, pa, [(0, tr, "rst"), (tr, 10, "run")], yb, 10)
    _f05_rbar(o, pb, [(0, tb1, "run"), (tb1, tb2 + 2.0, "rst"), (tb2 + 2.0, 20, "run")], yb, 20)
    _f05_rbar(o, pc, [(0, tc_bor, "run"), (tc_bor, 60, "rst")], yb, 60)
    o.append(T(14, yb + 12, "BOR あり", "start", 9.5, INK, True))
    return SVG(700, yb + 26, o, "POR と BOR の働き（しきい値と時間は例の値。待ち時間の働き方の細部は製品による）。(a) 電源を入れると、しきい値を超えてから t_POR 待って実行を始める。(b) V_BOR を割らない落ち込みでは何も起きず、割るとリセットされ、V_BOR + V_hys を超えてから再び動く。(c) 電源が途切れると BOR でリセットされる。BOR が無いと、V_min を割ってから V_POR に届くまで CPU が動き続ける（赤い帯）。")
F["e05_porbor"] = _f05_porbor()

def _f05_borsim(E, Rin, C, Irun, Irst, Vbor, Vhys, tpor, tend, dt=1e-5, backoff=False, tboot=1e-3, Islp=2e-6, b0=0.05, every=10):
    """BOR とリセットの繰り返しの模型（デモ w05_bor と同じ状態の移り方）。返り値 (リセットの回数, 平均の電流, [(t, v, 状態)])。"""
    v, st, tt, streak, cause_bor, sleep = Vbor, "rst", 0.0, 0, True, 0.0
    resets, q, tr = 0, 0.0, []
    n = int(round(tend / dt))
    for k in range(n):
        I = Irst if st in ("rst", "por") else (Islp if st == "slp" else Irun)
        if st != "rst" and v < Vbor:
            st, resets, cause_bor, tt = "rst", resets + 1, True, 0.0
        elif st == "rst" and v > Vbor + Vhys:
            st, tt = "por", 0.0
        elif st == "por" and tt >= tpor:
            st, tt = "boot", 0.0
        elif st == "boot" and tt >= tboot:
            if backoff and cause_bor:
                streak = min(streak + 1, 9)
                sleep, st = b0 * 2 ** (streak - 1), "slp"
            else:
                streak, st = 0, "run"
            cause_bor, tt = False, 0.0
        elif st == "slp" and tt >= sleep:
            st, tt = "run", 0.0
        ib = (E - v) / Rin
        v += (ib - I) * dt / C
        q += ib * dt
        tt += dt
        if k % every == 0:
            tr.append((k * dt, v, st))
    return resets, q / tend, tr

def _f05_loop():
    o = []
    E, R, C, Irun, Irst, Vb, Vh, tp = 2.45, 100.0, 100e-6, 3e-3, 0.1e-3, 2.2, 0.1, 2e-3
    rows = [("(a) BOR から起動したら、すぐ動く", 0.1, False, 1e-5, 10, "ms", 1e3),
            ("(b) BOR から起動したら眠り、BOR が続くたびに眠る時間を 2 倍にする", 1.0, True, 2e-5, 25, "ms", 1e3)]
    y0 = 30
    for title, tend, bo, dt, ev, un, sc in rows:
        n, iav, tr = _f05_borsim(E, R, C, Irun, Irst, Vb, Vh, tp, tend, dt=dt, backoff=bo, every=ev)
        p = Plot(70, y0 + 10, 520, 110, (0, tend * sc), (2.1, 2.5))
        o.append(T(14, y0, title, "start", 10.5, INK, True))
        tks = [0, 20, 40, 60, 80, 100] if tend < 0.5 else [0, 200, 400, 600, 800, 1000]
        o.append(p.axes(xl="時間 [ms]", yl="電源電圧 [V]", xt=tks, yt=[2.1, 2.2, 2.3, 2.4, 2.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
        o.append(p.line([(0, Vb), (tend * sc, Vb)], c=ALI, lw=1.1, dash="5 3"))
        o.append(p.line([(0, Vb + Vh), (tend * sc, Vb + Vh)], c=GLD, lw=1.1, dash="5 3"))
        o.append(p.line([(t * sc, v) for t, v, s in tr], c=SIG, lw=1.6))
        # 状態の帯
        yb = p.y + p.h + 36
        prev, t0 = None, 0.0
        segs = []
        for t, v, s in tr + [(tend, 0, None)]:
            g = "rst" if s in ("rst", "por") else ("slp" if s == "slp" else "run")
            if s is None:
                g = None
            if g != prev:
                if prev is not None:
                    segs.append((t0, t, prev))
                prev, t0 = g, t
        for a, b, g in segs:
            c = {"rst": ALI, "run": SIG, "slp": GRN}[g]
            o.append(RECT(p.X(a * sc), yb, max(p.X(b * sc) - p.X(a * sc), 0.6), 12, 1, soft(c), c, 0.8))
        o.append(T(p.x - 8, yb + 10, "状態", "end", 9.5, MUT))
        o.append(T(p.x + p.w + 10, p.y + 30, "リセット %d 回" % n, "start", 10, ALI, True))
        o.append(T(p.x + p.w + 10, p.y + 48, "平均 %.2f mA" % (iav * 1e3) if iav > 1e-3 else "平均 %.2f mA" % (iav * 1e3), "start", 10, INK, True))
        o.append(T(p.x + p.w + 10, p.y + 66, "（%g 秒の平均）" % tend if tend >= 1 else "（0.1 秒の平均）", "start", 9, MUT))
        y0 = yb + 34
    o.append(T(p.X(0) + 2, 52, "V_BOR + V_hys", "start", 9, GLD, halo=True) if False else "")
    yl = y0 - 4
    o.append(LEGEND(14, yl, [(ALI, "リセット（V_BOR 2.2 V を割ってから、2.3 V を超えて 2 ms まで）"), (SIG, "動く（3 mA）"), (GRN, "眠る（2 µA）")], gap=12))
    o.append(T(14, yl + 18, "使い終わりに近い CR2032 を寒い所で（起電力 2.45 V・内部抵抗 100 Ω）、電源の線に 100 µF、リセット中 0.1 mA（例の値）。", "start", 9.5, MUT))
    return SVG(700, yl + 28, o, "内部抵抗の大きい電池でのリセットの繰り返し。(a) リセットが解けて動くと電圧が下がり、約 20 ms ごとに BOR を繰り返して、平均 1.9 mA を使う。(b) BOR から起動したら眠り、眠る時間を 50 ms・100 ms・200 ms・400 ms と延ばすと、電池は眠りの間に休み、平均の電流は小さくなる（横軸の縮尺は (a) の 10 倍）。")
F["e05_loop"] = _f05_loop()

def _f05_borsel():
    o = []
    alk = [(0, 1.58), (0.03, 1.48), (0.2, 1.36), (0.4, 1.27), (0.6, 1.19), (0.75, 1.12), (0.85, 1.06), (0.93, 1.00), (0.97, 0.95), (1.0, 0.90)]
    def inv(v):
        for (x0, y0), (x1, y1) in zip(alk, alk[1:]):
            if y1 <= v <= y0:
                return x0 + (y0 - v) / (y0 - y1) * (x1 - x0)
        return 1.0
    p = Plot(70, 30, 360, 220, (0, 100), (1.6, 3.3))
    o.append(p.axes(xl="使った電荷（公称容量に対する割合）[%]", yl="電池 2 本の電圧 [V]", xt=[0, 20, 40, 60, 80, 100], yt=[1.6, 2.0, 2.4, 2.8, 3.2],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%.1f" % v))
    o.append(RECT(p.X(0), p.Y(1.85), p.w, p.Y(1.75) - p.Y(1.85), 0, ASOFT, "none", 0, op=0.7))
    o.append(p.line([(x * 100, 2 * v) for x, v in alk], c=GLD, lw=2.4))
    o.append(T(p.X(4), p.Y(3.12) + 2, "アルカリ乾電池 2 本（03 章の模型）", "start", 9.5, GLD, True, halo=True))
    o.append(p.line([(0, 2.4), (100, 2.4)], c=TEA, lw=1.2, dash="6 3"))
    o.append(T(p.X(99), p.Y(2.4) - 5, "センサが動く最低 2.4 V", "end", 9, TEA, True, halo=True))
    for v, c in ((2.5, ALI), (2.2, GLD), (2.0, GRN), (1.8, MUT)):
        x = inv(v / 2) * 100
        o.append(p.line([(0, v), (x, v)], c=c, lw=1.6 if v != 1.8 else 1.2))
        o.append(W(p.X(x), p.Y(v), p.X(x), p.Y(1.6), c=c, lw=1, dash="3 3"))
        o.append(D(p.X(x), p.Y(v), c, 3.6))
        o.append(T(p.X(x) - 4, p.Y(v) - 5, "%.0f %%" % x, "end", 9.5, c, True, halo=True))
        o.append(T(p.X(1), p.Y(v) + (11 if v != 1.8 else -4), "%.1f V" % v, "start", 9, c, True, halo=True))
    o.append(T(p.X(40), p.Y(1.75) + 13, "V_min 1.8 V の前後 ±0.05 V", "middle", 9, ALI, halo=True))
    # 右: 判定
    bx = 470
    o.append(T(bx, 30, "BOR のしきい値（ずれ ±0.05 V）", "start", 10.5, INK, True))
    items = [(1.8, MUT, "×", "1.75 V まで下がることがあり、", "マイコンの V_min を割る"),
             (2.0, GRN, "○", "最も低くても 1.95 V。使える容量 93 %。", "センサは 6 節の監視で止める"),
             (2.2, GLD, "△", "余裕は大きいが、使える容量 78 %", ""),
             (2.5, ALI, "△", "センサも BOR で守れるが、", "使える容量 45 %")]
    for i, (v, c, mk, a, b) in enumerate(items):
        yy = 60 + i * 52
        o.append(T(bx, yy, "%.1f V" % v, "start", 11, c, True))
        o.append(T(bx + 44, yy, mk, "start", 12, c, True))
        o.append(T(bx, yy + 16, a, "start", 9.5, INK))
        if b:
            o.append(T(bx, yy + 30, b, "start", 9.5, INK))
    return SVG(700, 290, o, "単 3 形のアルカリ乾電池 2 本で直接動く機器の、BOR のしきい値と使える容量（小さな電流・25 °C、03 章の模型。しきい値とずれは例の値）。しきい値を上げると、電池の中に多くの電荷を残したまま機器が止まる。")
F["e05_borsel"] = _f05_borsel()

# ---- 6 節: 監視のしきい値と、電源が途切れたとき ----
def _f05_levels():
    o = []
    x0, x1, v0, v1 = 210, 670, 1.7, 3.3
    X = lambda v: x0 + (v - v0) / (v1 - v0) * (x1 - x0)
    rows = [("センサを使う", "2.4 V で動く + 余裕", 2.5, PUR), ("無線で送る", "送信の間の低下を見込む", 2.4, GLD), ("フラッシュメモリに書く", "警告より上で始める", 2.35, SIG)]
    y0, rh = 40, 46
    for i, (nm, sub, st, c) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(14, y + 12, nm, "start", 10.5, c, True))
        o.append(T(14, y + 27, sub, "start", 9, MUT))
        o.append(RECT(X(st + 0.1), y + 2, X(3.25) - X(st + 0.1), 22, 3, GSOFT, GRN, 1))
        o.append(RECT(X(st), y + 2, X(st + 0.1) - X(st), 22, 3, "none", GRN, 1.1, dash="3 2"))
        o.append(T(X(st + 0.1) + 6, y + 17, "始めてよい", "start", 9.5, GRN, True))
        o.append(T(X(st) - 4, y + 17, "%.2f V で止める" % st if st == 2.35 else "%.1f V で止める" % st, "end", 9.5, c, True))
        o.append(T(X(3.25) - 4, y + 17, "%.2f V で戻す" % (st + 0.1) if st == 2.35 else "%.1f V で戻す" % (st + 0.1), "end", 9, GRN))
    yw = y0 + 3 * rh
    o.append(T(14, yw + 12, "電圧検出器の警告", "start", 10.5, GLD, True))
    o.append(T(14, yw + 27, "割り込みで止め、負荷を切る", "start", 9, MUT))
    o.append(T(X(2.3) - 4, yw + 17, "2.3 V", "end", 9.5, GLD, True))
    yb = yw + rh
    o.append(T(14, yb + 12, "BOR（5 節）", "start", 10.5, ALI, True))
    o.append(T(14, yb + 27, "ここでリセット", "start", 9, MUT))
    o.append(T(X(2.0) - 4, yb + 17, "2.0 V", "end", 9.5, ALI, True))
    o.append(RECT(X(2.0), yb + 6, X(2.1) - X(2.0), 14, 2, "none", ALI, 1, dash="3 2"))
    o.append(T(X(2.1) + 4, yb + 17, "2.1 V を超えると解ける", "start", 9, ALI))
    ym = yb + rh
    o.append(T(14, ym + 12, "マイコンが正しく動く最低", "start", 10.5, PUR, True))
    o.append(T(X(1.8) - 4, ym + 17, "1.8 V", "end", 9.5, PUR, True))
    for v, c in ((2.3, GLD), (2.0, ALI), (1.8, PUR)):
        o.append(W(X(v), y0 - 4, X(v), ym + 26, c=c, lw=1.3, dash="5 3"))
    ya = ym + 40
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for k in range(9):
        v = 1.8 + 0.2 * k
        o.append(W(X(v), ya, X(v), ya + 4, c=MUT, lw=1) + T(X(v), ya + 15, "%.1f" % v, "middle", 9, MUT))
    o.append(T(x1, ya + 30, "電源電圧 [V]（左へ行くほど電池が減っている）", "end", 9.5, MUT))
    return SVG(700, ya + 40, o, "6 節の監視のしきい値（5 節の単 3 形 2 本の機器。値は例）。動作ごとに、始めてよい最低の電圧を決め、0.1 V のヒステリシスを付ける。どの下限も警告の 2.3 V より上にあり、警告は BOR の 2.0 V より上にある。電池が減ると、センサ、無線、書き込みの順に止まり、BOR の前に警告が来る。")
F["e05_levels"] = _f05_levels()

def _f05_gap():
    o = []
    p = Plot(78, 30, 470, 200, (-5, 50), (1.8, 3.0))
    o.append(RECT(p.X(0), p.y, p.X(30) - p.X(0), p.h, 0, GOSOFT, "none", 0, op=0.6))
    o.append(T(p.X(15), p.y + 14, "電池の接点が離れている 30 ms", "middle", 9.5, GLD, True, halo=True))
    o.append(p.axes(xl="時間 [ms]", yl="電源電圧 [V]", xt=[0, 10, 20, 30, 40, 50], yt=[1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(-5, 2.3), (50, 2.3)], c=GLD, lw=1.2, dash="5 3"))
    o.append(p.line([(-5, 2.0), (50, 2.0)], c=ALI, lw=1.2, dash="5 3"))
    o.append(T(p.X(49), p.Y(2.3) - 5, "警告 2.3 V", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(49), p.Y(2.0) + 13, "BOR 2.0 V", "end", 9.5, ALI, True, halo=True))
    ta = (2.8 - 2.0) / 0.030
    tw = (2.8 - 2.3) / 0.030
    va = [(-5, 2.8), (0, 2.8), (ta, 2.0), (30, 2.0 - 0.001 * (30 - ta)), (30.05, 2.8), (50, 2.8)]
    vb = [(-5, 2.8), (0, 2.8), (tw, 2.3), (30, 2.3 - 0.003 * (30 - tw)), (30.05, 2.8), (50, 2.8)]
    o.append(p.line(va, c=ALI, lw=2.2))
    o.append(p.line(vb, c=GRN, lw=2.2))
    o.append(D(p.X(ta), p.Y(2.0), ALI, 4) + D(p.X(tw), p.Y(2.3), GRN, 4))
    o.append(T(p.X(ta) - 4, p.Y(2.0) + 16, "(a) 26.7 ms で BOR", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(tw) - 6, p.Y(2.3) - 8, "(b) 16.7 ms で警告", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(31), p.Y(2.26) + 4, "(b) 2.26 V で戻る", "start", 9.5, GRN, True, halo=True))
    # 右: 説明
    bx = 572
    o.append(T(bx, 52, "(a) 監視しない", "start", 10.5, ALI, True))
    for k, l in enumerate(["3 mA のまま下がり、", "BOR でリセット。", "書きかけの記録は", "壊れうる"]):
        o.append(T(bx, 70 + k * 15, l, "start", 9.5, INK))
    o.append(T(bx, 150, "(b) 監視する", "start", 10.5, GRN, True))
    for k, l in enumerate(["警告で負荷を切り、", "0.3 mA にする。", "下がる速さが 1/10", "になり、間に合う"]):
        o.append(T(bx, 168 + k * 15, l, "start", 9.5, INK))
    return SVG(700, 276, o, "2.8 V で動いていた機器の電池の接点が 30 ms 離れた場合（電源の線に 100 µF、マイコンと周辺で 3 mA。値は例）。電圧は 3 mA ÷ 100 µF = 30 V/s で下がる。(a) では 26.7 ms で BOR にかかる。(b) では警告から BOR まで 10 ms あり、負荷を切って速さを 1/10 にしたので、接点が戻るまで BOR にかからない。")
F["e05_gap"] = _f05_gap()
