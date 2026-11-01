# -*- coding: utf-8 -*-
# 08 章 センサをつなぐ の図

# ---- 補助: 記号・回路の部品 ----
def _f08_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。"""
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

def _f08_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f08_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f08_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return (W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6)
            + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2))

def _f08_diode_up(x, y, c=INK, s=5):
    """上向き（下から上へ電流を通す）のダイオード。(x, y) は三角の先（上）。"""
    return (PL([(x - s, y + 1.6 * s), (x + s, y + 1.6 * s), (x, y)], c=c, lw=1.3, fill=soft(c))
            + W(x - s, y, x + s, y, c=c, lw=1.8))

def _f08_steps(pts, X, Y):
    """変わり目の列 [(t, 値), ...] を、段の形の点の列にする（t の終わりは pts の最後）。"""
    q = []
    for i, (t, v) in enumerate(pts):
        if i > 0:
            q.append((X(t), Y(pts[i - 1][1])))
        q.append((X(t), Y(v)))
    return q

def _f08_cur(uA):
    if uA >= 1000:
        return ("%.3g mA" % (uA / 1000.0))
    return ("%.3g µA" % uA)

# ---- 1 節: 出力の 3 つの形 ----
def _f08_forms():
    o = []
    cols = [("(a) アナログ出力", "センサ", "ADC", ["電圧を測って量に直す", "線の雑音が値の誤差になる"]),
            ("(b) デジタル出力", "センサ（中に ADC と校正）", "I2C・SPI・UART の回路", ["数値をそのまま読む", "通信の手順と、起動・設定が要る"]),
            ("(c) パルス出力", "センサ", "タイマ（測る・数える）", ["幅・周期・数を測る", "長い線と雑音に強い"])]
    for k, (tt, sname, mname, notes) in enumerate(cols):
        x = 12 + k * 232
        cx = x + 106
        o.append(T(cx, 18, tt, "middle", 12, INK, True))
        o.append(BOX(x + 26, 28, 160, 32, sname, None, TEA, TSOFT, INK, sz=10.5))
        o.append(ARR(cx, 61, cx, 78, c=TEA, lw=1.5, head=6))
        o.append(RECT(x + 6, 80, 200, 70, 6, PAN, LIN, 1.0))
        if k == 0:
            o.append(W(x + 26, 88, x + 26, 136, x + 196, 136, c=MUT, lw=1.1))
            o.append(W(x + 30, 130, x + 188, 94, c=TEA, lw=2.2))
            o.append(T(x + 17, 113, "電圧", "middle", 9, MUT, rot=-90))
            o.append(T(x + 196, 147, "温度 →", "end", 9, MUT))
            o.append(T(x + 34, 100, "1 °C で 10 mV（例）", "start", 9, TEA, True))
        elif k == 1:
            o.append(DWAVE(x + 20, 94, [0, 1, 1, 0, 1, 0, 0, 1, 1, 0], bit_w=17, h=22, c=TEA, lw=1.8))
            o.append(T(cx, 140, "0 と 1 の列（数値）", "middle", 9.5, TEA, True))
        else:
            pts, xx = [], x + 18
            for p in (36, 30, 26, 22, 19, 17, 15):
                pts += [(xx, 118), (xx, 96), (xx + p / 2.0, 96), (xx + p / 2.0, 118), (xx + p, 118)]
                xx += p
            o.append(PL(pts, c=TEA, lw=1.8))
            o.append(T(cx, 140, "周期（周波数）が量を表す例", "middle", 9.5, TEA, True))
        o.append(ARR(cx, 151, cx, 168, c=TEA, lw=1.5, head=6))
        o.append(BOX(x + 26, 170, 160, 32, mname, None, SIG, SSOFT, INK, sz=10.5))
        o.append(T(cx, 222, notes[0], "middle", 10, INK))
        o.append(T(cx, 238, notes[1], "middle", 9.5, MUT))
    return SVG(700, 248, o, "センサの出力の 3 つの形。(a) 量を電圧の大きさで表し、マイコンは ADC で読む。(b) センサの中で数値にして送り、マイコンは通信の回路で読む。(c) 量をパルスの幅・周期・数で表し、マイコンはタイマで測る。")
F["e08_forms"] = _f08_forms()

# ---- 1 節: 同じ雑音が乗ったとき ----
def _f08_noise():
    o = []
    nz = lambda t: 0.55 * math.sin(7.3 * t + 0.4) + 0.3 * math.sin(17.1 * t + 1.3) + 0.15 * math.sin(41.7 * t + 2.1)
    ns = [nz(i * 0.05) for i in range(201)]
    m = max(ns)
    ns = [v / m for v in ns]                     # いちばん大きい所がちょうど +20 mV になるように
    # (a) アナログ出力
    x0, y0, w, h = 62, 36, 260, 104
    o.append(T(14, 20, "(a) アナログ出力: 雑音がそのまま値になる", "start", 11, ALI, True))
    Y = lambda mv: y0 + h - (mv - 210) / 80.0 * h
    o.append(W(x0, y0, x0, y0 + h, x0 + w, y0 + h, c=MUT, lw=1.1))
    for mv in (230, 250, 270):
        o.append(W(x0 - 4, Y(mv), x0, Y(mv), c=MUT, lw=1))
        o.append(T(x0 - 7, Y(mv) + 3.5, "%d mV" % mv, "end", 9, MUT))
    o.append(W(x0, Y(250), x0 + w, Y(250), c=MUT, lw=1.2, dash="5 4"))
    pts = [(x0 + i * w / 200.0, Y(250 + 20 * ns[i])) for i in range(201)]
    o.append(PL(pts, c=TEA, lw=1.6))
    k = ns.index(max(ns))
    o.append(D(pts[k][0], pts[k][1], ALI, 4))
    o.append(T(pts[k][0] + 8, pts[k][1] - 4, "ここで読むと 270 mV", "start", 9.5, ALI, True))
    o.append(T(x0 + w, Y(250) + 13, "本当の値 250 mV（25 °C）", "end", 9, MUT))
    o.append(T(x0 + w, y0 + h + 14, "時間", "end", 9, MUT))
    o.append(T(14, 172, "20 mV の雑音 ÷ 10 mV/°C = 2 °C の誤差（27 °C と読む）", "start", 10, ALI, True))
    # (b) パルス出力
    x1 = 380
    o.append(T(366, 20, "(b) パルス出力: 数は変わらない", "start", 11, GRN, True))
    Yb = lambda v: y0 + h - v / 3.4 * h
    o.append(W(x1, y0, x1, y0 + h, x1 + 300, y0 + h, c=MUT, lw=1.1))
    for v in (0, 3):
        o.append(W(x1 - 4, Yb(v), x1, Yb(v), c=MUT, lw=1))
        o.append(T(x1 - 7, Yb(v) + 3.5, "%d V" % v, "end", 9, MUT))
    o.append(W(x1, Yb(1.5), x1 + 300, Yb(1.5), c=MUT, lw=1.1, dash="4 3"))
    o.append(T(x1 + 300, Yb(1.5) - 4, "しきい値", "end", 9, MUT))
    per, edge = 58.0, 5.0
    pts, marks = [], []
    for i in range(301):
        t = float(i)
        ph = (t - 6) % per
        if t < 6:
            v = 0.0
        elif ph < edge:
            v = 3.0 * ph / edge
        elif ph < per / 2:
            v = 3.0
        elif ph < per / 2 + edge:
            v = 3.0 * (1 - (ph - per / 2) / edge)
        else:
            v = 0.0
        v += 0.35 * nz(t * 0.21)
        pts.append((x1 + t, Yb(v)))
    o.append(PL(pts, c=TEA, lw=1.6))
    n = 0
    for i in range(1, len(pts)):
        if Yb(1.5) < pts[i - 1][1] and Yb(1.5) >= pts[i][1]:
            n += 1
            o.append(W(pts[i][0], y0 + h + 3, pts[i][0], y0 + h + 9, c=GRN, lw=2))
    o.append(T(x1 + 300, y0 + h + 22, "立ち上がりを数える: %d 個" % n, "end", 9.5, GRN, True))
    o.append(T(366, 172, "変わり目の時刻が少しずれるだけで、数えた数は同じ", "start", 10, GRN, True))
    o.append(T(14, 192, "デジタル出力も、H と L のしきい値をまたぐほどの雑音でなければ、値は変わらない。", "start", 9.5, MUT))
    return SVG(700, 202, o, "配線に同じ大きさの雑音が乗ったとき（値は例）。(a) アナログ出力では、雑音がそのまま値の誤差になる。(b) パルス出力では、しきい値をまたぐ時刻が少しずれるだけで、数えたパルスの数は変わらない。")
F["e08_noise"] = _f08_noise()

# ---- 1 節: パルスの 2 つの測り方 ----
def _f08_pulse():
    o = []
    # (a) 数える
    o.append(T(14, 18, "(a) 決めた時間の間に来たパルスを数える", "start", 11, GLD, True))
    xa, per = 28, 26.0
    pts = []
    xx = xa
    while xx < 340:
        pts += [(xx, 70), (xx, 50), (xx + per / 2, 50), (xx + per / 2, 70)]
        xx += per
    o.append(PL(pts + [(340, 70)], c=TEA, lw=1.7))
    g0, g1 = 44, 300
    o.append(RECT(g0, 44, g1 - g0, 32, 2, GOSOFT, "none", 0, op=0.55))
    o.append(DARR(g0, 36, g1, 36, c=GLD, lw=1.2, head=5))
    o.append(_f08_m((g0 + g1) / 2, 31, [("T", "g", True)], "middle", 11, GLD, True))
    k, xx = 0, xa
    while xx < 340:
        if g0 <= xx <= g1:
            k += 1
            o.append(T(xx, 88, str(k), "middle", 8.5, GLD, True))
        xx += per
    o.append(_f08_m(14, 108, [("数 N = f T", "g", False), ("。数え始めと終わりで ±1 ずれる → 相対誤差 1/(f T", "g", False), (")", "", False)], "start", 9.5, INK))
    # (b) 周期を測る
    o.append(T(14, 136, "(b) 1 つの周期の長さを、クロックの刻みで数える", "start", 11, SIG, True))
    p0, p1 = 44, 300
    o.append(PL([(28, 186), (p0, 186), (p0, 160), ((p0 + p1) / 2, 160), ((p0 + p1) / 2, 186), (p1, 186), (p1, 160), (340, 160)], c=TEA, lw=1.7))
    for i in range(27):
        xt = p0 + i * (p1 - p0) / 26.0
        o.append(W(xt, 192, xt, 199, c=SIG, lw=1.2))
    o.append(DARR(p0, 152, p1, 152, c=SIG, lw=1.2, head=5))
    o.append(T((p0 + p1) / 2, 147, "1 周期 = 1/f", "middle", 9.5, SIG, True))
    o.append(_f08_m((p0 + p1) / 2, 214, [("刻み（周波数 f", "clk", False), ("）を M 個数える", "", False)], "middle", 9.5, SIG))
    o.append(_f08_m(14, 234, [("M = f", "clk", False), ("/f。±1 ずれる → 相対誤差 1/M = f/f", "clk", False)], "start", 9.5, INK))
    # 右: 誤差のグラフ
    p = Plot(440, 22, 240, 196, (10, 1e5), (1e-5, 1), xlog=True, ylog=True)
    xf = {10: "10 Hz", 100: "100 Hz", 1000: "1 kHz", 1e4: "10 kHz", 1e5: "100 kHz"}
    yf = {1e-5: "0.001 %", 1e-4: "0.01 %", 1e-3: "0.1 %", 1e-2: "1 %", 1e-1: "10 %", 1: "100 %"}
    o.append(p.axes(xl="パルスの周波数 f", yl="相対誤差", xt=[10, 100, 1000, 1e4, 1e5], yt=[1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1],
                    xfmt=lambda v: xf[v], yfmt=lambda v: yf[v]))
    fs = [10 ** (1 + i * 0.05) for i in range(81)]
    o.append(p.line([(f, 1 / (f * 0.1)) for f in fs if 1 / (f * 0.1) <= 1], c=GLD, lw=2.2))
    o.append(p.line([(f, f / 1e6) for f in fs], c=SIG, lw=2.2))
    fc = math.sqrt(1e6 / 0.1)
    o.append(D(p.X(fc), p.Y(fc / 1e6), ALI, 4))
    o.append(T(p.X(fc) + 7, p.Y(fc / 1e6) + 14, "3.2 kHz で等しい", "start", 9, ALI, True, halo=True))
    o.append(T(p.X(14), p.Y(0.45), "(a) 0.1 s 数える", "start", 9, GLD, True, halo=True))
    o.append(T(p.X(14), p.Y(3e-5), "(b) 1 MHz で 1 周期", "start", 9, SIG, True, halo=True))
    for v, c in ((1e-2, GLD), (1e-3, SIG)):
        o.append(D(p.X(1000), p.Y(v), c, 3.4))
    o.append(T(p.X(1000) - 6, p.Y(1e-2) - 6, "1 kHz: 1 %", "end", 9, GLD, halo=True))
    o.append(T(p.X(1000) - 6, p.Y(1e-3) + 13, "0.1 %", "end", 9, SIG, halo=True))
    return SVG(700, 272, o, "パルスの周波数の 2 つの測り方。(a) 時間 T_g の間に来たパルスを数える。(b) 1 周期の長さを、マイコンのクロックの刻みで数える。どちらも数に ±1 の誤差があり、低い周波数では (b) が、高い周波数では (a) が細かい（右のグラフは T_g = 0.1 s、刻み 1 MHz の例）。")
F["e08_pulse"] = _f08_pulse()

# ---- 2 節: I2C の線の動き ----
def _f08_i2c_build(items):
    """items: ("idle", 長さ) / ("S",) / ("Sr",) / ("P",) / ("bits", [(値, 動かす側), ...], 文字)。
    返り値: (長さ, SCL の変わり目, SDA の変わり目, 動かす側の区間, 文字の位置)。動かす側は "m"（マスタ）か "s"（スレーブ）。"""
    t = 0.0
    scl, sda, drv, labs = [(0.0, 1)], [(0.0, 1)], [], []
    for it in items:
        k = it[0]
        if k == "idle":
            t += it[1]
        elif k == "S":
            t += 0.6; sda.append((t, 0)); labs.append((t, "S", "c"))
            drv.append((t, t + 0.9, "m")); t += 0.9; scl.append((t, 0))
        elif k == "Sr":
            sda.append((t + 0.25, 1)); drv.append((t, t + 2.5, "m")); t += 1.0; scl.append((t, 1))
            t += 0.6; sda.append((t, 0)); labs.append((t, "Sr", "c")); t += 0.9; scl.append((t, 0))
        elif k == "P":
            sda.append((t + 0.25, 0)); drv.append((t, t + 1.6, "m")); t += 1.0; scl.append((t, 1))
            t += 0.6; sda.append((t, 1)); labs.append((t, "P", "c")); t += 1.0
        elif k == "bits":
            t0 = t
            for v, d in it[1]:
                sda.append((t + 0.25, v)); drv.append((t, t + 2.0, d))
                t += 1.0; scl.append((t, 1)); t += 1.0; scl.append((t, 0))
            labs.append(((t0 + t) / 2.0, it[2], "b" if len(it[1]) > 1 else "a"))
    scl.append((t, scl[-1][1])); sda.append((t, sda[-1][1]))
    return t, scl, sda, drv, labs

def _f08_bits(v, n=8):
    return [((v >> (n - 1 - i)) & 1) for i in range(n)]

def _f08_i2cwave():
    o = []
    items = [("idle", 1.0), ("S",),
             ("bits", [(b, "m") for b in _f08_bits(0x48, 7)] + [(0, "m")], "アドレス 0x48 + W"), ("bits", [(0, "s")], "A"),
             ("bits", [(b, "m") for b in _f08_bits(0x05)], "番地 0x05"), ("bits", [(0, "s")], "A"),
             ("Sr",),
             ("bits", [(b, "m") for b in _f08_bits(0x48, 7)] + [(1, "m")], "アドレス 0x48 + R"), ("bits", [(0, "s")], "A"),
             ("bits", [(b, "s") for b in _f08_bits(0x1A)], "値 0x1A"), ("bits", [(1, "m")], "N"),
             ("P",), ("idle", 1.0)]
    tt, scl, sda, drv, labs = _f08_i2c_build(items)
    x0, u = 62, (690 - 62) / tt
    X = lambda t: x0 + t * u
    ys, yd, hh = 30, 84, 20
    o.append(T(14, ys + 15, "SCL", "start", 11, INK, True))
    o.append(T(14, yd + 15, "SDA", "start", 11, INK, True))
    for a, b, d in drv:
        o.append(RECT(X(a), yd - 5, X(b) - X(a), hh + 10, 0, SSOFT if d == "m" else PSOFT, "none", 0))
    o.append(PL(_f08_steps(scl, X, lambda v: ys + (0 if v else hh)), c=INK, lw=1.7))
    o.append(PL(_f08_steps(sda, X, lambda v: yd + (0 if v else hh)), c=INK, lw=1.7))
    for t, s, kind in labs:
        if kind == "b":
            o.append(T(X(t), yd + hh + 22, s, "middle", 9.5, INK, True))
        else:
            o.append(T(X(t), yd + hh + 22, s, "middle", 9.5, ALI if s in ("S", "Sr", "P") else INK, True))
    yl = yd + hh + 48
    o.append(LEGEND(14, yl, [(SIG, "マスタ（マイコン）が SDA を動かす"), (PUR, "スレーブ（センサ）が SDA を動かす")]))
    o.append(T(14, yl + 18, "S: 開始条件　Sr: もう一度の開始条件　P: 停止条件　A: ACK（受け手が L に引く）　N: NACK（L に引かない）", "start", 9.5, MUT))
    return SVG(700, yl + 28, o, "I2C でセンサのレジスタ（番地 0x05）から 1 バイトを読むときの線の動き（アドレス 0x48 の例）。データのビットは SCL が L の間に変わり、SCL が H の間の SDA の変化は開始と停止の印になる。紫の区間はスレーブが SDA を動かしている。")
F["e08_i2cwave"] = _f08_i2cwave()

# ---- 2 節: 3 つのつなぎ方 ----
def _f08_ifaces():
    o = []
    def mcu(x):
        o.append(RECT(x + 6, 56, 60, 82, 6, SSOFT, SIG, 1.3))
        o.append(T(x + 36, 101, "マイコン", "middle", 10, SIG, True))
    def sensor(x, y, w, l1, l2=None, mono=False):
        o.append(RECT(x, y, w, 36, 5, TSOFT, TEA, 1.2))
        if l2:
            o.append(T(x + w / 2, y + 15, l1, "middle", 9, TEA, True))
            o.append(T(x + w / 2, y + 29, l2, "middle", 9, INK, False, mono))
        else:
            o.append(T(x + w / 2, y + 22, l1, "middle", 9, TEA, True))
    # (a) I2C
    x = 8
    o.append(T(x + 113, 18, "(a) I2C", "middle", 12, INK, True))
    mcu(x)
    for yy, nm in ((80, "SDA"), (110, "SCL")):
        o.append(W(x + 66, yy, x + 220, yy, c=INK, lw=1.5))
        o.append(T(x + 72, yy - 4, nm, "start", 9, INK, True))
    o.append(W(x + 98, 40, x + 132, 40, c=GLD, lw=1.8))
    o.append(T(x + 115, 34, "電源", "middle", 9, GLD, True))
    o.append(_f08_resv(x + 104, 40, 80, c=GLD, n=4) + D(x + 104, 80, INK, 2.6))
    o.append(_f08_resv(x + 126, 40, 110, c=GLD, n=5) + D(x + 126, 110, INK, 2.6))
    o.append(T(x + 140, 58, "プルアップ抵抗", "start", 9, GLD))
    for i, a in enumerate(("0x44", "0x76", "0x1D")):
        sx = x + 92 + i * 44
        o.append(W(sx + 12, 80, sx + 12, 142, c=INK, lw=1.2) + D(sx + 12, 80, INK, 2.4))
        o.append(W(sx + 28, 110, sx + 28, 142, c=INK, lw=1.2) + D(sx + 28, 110, INK, 2.4))
        sensor(sx, 142, 40, "センサ", a, True)
    o.append(T(x + 113, 200, "線 2 本・アドレスで選ぶ", "middle", 10, INK, True))
    o.append(T(x + 113, 216, "プルアップ抵抗が要る", "middle", 9.5, MUT))
    # (b) SPI
    x = 240
    o.append(T(x + 113, 18, "(b) SPI", "middle", 12, INK, True))
    mcu(x)
    for yy, nm in ((66, "SCLK"), (84, "MOSI"), (102, "MISO")):
        o.append(W(x + 66, yy, x + 220, yy, c=INK, lw=1.5))
        o.append(T(x + 70, yy - 3, nm, "start", 8.5, INK, True))
    for i, (sx, ycs, nm) in enumerate(((x + 110, 120, "CS1"), (x + 170, 130, "CS2"))):
        o.append(W(x + 66, ycs, sx + 34, ycs, sx + 34, 146, c=GLD, lw=1.5))
        o.append(T(x + 70, ycs - 2 + (0 if i == 0 else 9), nm, "start", 8.5, GLD, True) if i == 0 else T(x + 70, ycs + 9, nm, "start", 8.5, GLD, True))
        for k, yy in enumerate((66, 84, 102)):
            xd = sx + 6 + k * 9
            o.append(W(xd, yy, xd, 146, c=INK, lw=1.1) + D(xd, yy, INK, 2.2))
        sensor(sx - 4, 146, 48, "センサ %d" % (i + 1))
    o.append(T(x + 113, 200, "線 3 本 + センサごとに CS", "middle", 10, INK, True))
    o.append(T(x + 113, 216, "速い（数 MHz〜数十 MHz）", "middle", 9.5, MUT))
    # (c) UART
    x = 472
    o.append(T(x + 113, 18, "(c) UART", "middle", 12, INK, True))
    mcu(x)
    o.append(RECT(x + 156, 56, 62, 82, 6, TSOFT, TEA, 1.3))
    o.append(T(x + 187, 96, "センサの", "middle", 9, TEA, True))
    o.append(T(x + 187, 109, "モジュール", "middle", 9, TEA, True))
    o.append(ARR(x + 66, 76, x + 156, 112, c=INK, lw=1.4, head=6))
    o.append(ARR(x + 156, 76, x + 66, 112, c=INK, lw=1.4, head=6))
    o.append(T(x + 70, 72, "TX", "start", 8.5, INK, True))
    o.append(T(x + 152, 72, "TX", "end", 8.5, INK, True))
    o.append(T(x + 70, 124, "RX", "start", 8.5, INK, True))
    o.append(T(x + 152, 124, "RX", "end", 8.5, INK, True))
    o.append(W(x + 66, 132, x + 156, 132, c=MUT, lw=1.3))
    o.append(T(x + 111, 146, "GND", "middle", 8.5, MUT, True))
    o.append(T(x + 113, 200, "線 2 本・1 対 1", "middle", 10, INK, True))
    o.append(T(x + 113, 216, "決めた速さで送る（交差させる）", "middle", 9.5, MUT))
    return SVG(700, 226, o, "3 つのつなぎ方。(a) I2C は 2 本の線を何台ものセンサで共有し、アドレスで相手を選ぶ。線はプルアップ抵抗で H にする。(b) SPI は 3 本の線を共有し、センサごとの CS の線で相手を選ぶ。(c) UART は TX と RX を交差させて 1 対 1 でつなぐ。どれも GND を共通にする。")
F["e08_ifaces"] = _f08_ifaces()

# ---- 2 節: 1 回の読み出しの時間と電荷 ----
def _f08_readcost():
    o = []
    rows = [("I2C 100 kHz", "プルアップ 4.7 kΩ", 840e-6, 3.06, "うちプルアップ 0.54"),
            ("I2C 400 kHz", "プルアップ 2.2 kΩ", 210e-6, 0.92, "うちプルアップ 0.29"),
            ("SPI 4 MHz", "", 15e-6, 0.045, ""),
            ("UART 9600 bps", "32 バイトを受ける", 33.3e-3, 100.0, "")]
    xt0, xt1, xc0, xc1 = 172, 400, 452, 640
    Xt = lambda s: xt0 + (math.log10(s) + 5) / 4.0 * (xt1 - xt0)       # 10 µs〜100 ms
    Xc = lambda q: xc0 + (math.log10(q) + 2) / 5.0 * (xc1 - xc0)        # 0.01〜1000 µC
    y0, rh = 44, 34
    o.append(T((xt0 + xt1) / 2, 20, "1 回にかかる時間", "middle", 11, INK, True))
    o.append(T((xc0 + xc1) / 2, 20, "1 回の電荷", "middle", 11, INK, True))
    for v, lab in ((1e-5, "10 µs"), (1e-4, "100 µs"), (1e-3, "1 ms"), (1e-2, "10 ms"), (1e-1, "100 ms")):
        o.append(W(Xt(v), y0 - 6, Xt(v), y0 + 4 * rh, c=GRD, lw=1))
        o.append(T(Xt(v), y0 + 4 * rh + 14, lab, "middle", 9, MUT))
    for v, lab in ((0.01, "0.01"), (0.1, "0.1"), (1, "1"), (10, "10"), (100, "100"), (1000, "1000 µC")):
        o.append(W(Xc(v), y0 - 6, Xc(v), y0 + 4 * rh, c=GRD, lw=1))
        o.append(T(Xc(v), y0 + 4 * rh + 14, lab, "middle", 9, MUT))
    for i, (nm, sub, t, q, note) in enumerate(rows):
        y = y0 + i * rh
        c = ALI if i == 3 else (SIG if i == 2 else GLD)
        o.append(T(14, y + 12, nm, "start", 10, INK, True))
        if sub:
            o.append(T(14, y + 25, sub, "start", 8.5, MUT))
        o.append(RECT(xt0, y + 3, Xt(t) - xt0, 18, 2, soft(c), c, 1.1))
        ts = ("%.0f µs" % (t * 1e6)) if t < 1e-3 else ("%.0f ms" % (t * 1e3))
        o.append(T(Xt(t) + 5, y + 16, ts, "start", 9.5, c, True))
        o.append(RECT(xc0, y + 3, Xc(q) - xc0, 18, 2, soft(c), c, 1.1))
        qs = ("%.2g µC" % q) if q < 1 else ("%.3g µC" % q)
        o.append(T(Xc(q) + 5, y + 16, qs, "start", 9.5, c, True))
        if note:
            o.append(T(Xc(q) + 5, y + 29, note, "start", 8.5, MUT))
    o.append(T(14, y0 + 4 * rh + 36, "6 バイトの値を読む例。読む間マイコンは 3 mA（例の値）。I2C は SDA と SCL がそれぞれ半分の時間 L として、プルアップ抵抗の電荷を足した。", "start", 9, MUT))
    return SVG(700, y0 + 4 * rh + 46, o, "1 回の読み出しにかかる時間と電荷（どちらも対数目盛。値は例）。I2C は 400 kHz にすると時間が 1/4 になり、電荷も約 3/10 になる。UART は、センサが送り終えるまでマイコンが起きて受けると、ほかより桁で大きい。")
F["e08_readcost"] = _f08_readcost()

# ---- 3 節: 入れたままと、切る場合の電流 ----
def _f08_gatewave():
    o = []
    x0, x1 = 120, 690
    rows = [("(a) 入れたまま待機させる", 34), ("(b) 測るときだけ電源を入れる", 168)]
    hb = 96
    for k, (tt, yt) in enumerate(rows):
        yb = yt + hb
        o.append(T(14, yt + 4, tt, "start", 11, PUR if k == 0 else SIG, True))
        o.append(W(x0, yt + 12, x0, yb, x1, yb, c=MUT, lw=1.1))
        o.append(T(x0 - 8, yt + 50, "電流", "end", 9.5, MUT))
    # (a)
    yb = 34 + hb
    ysb = yb - 12
    ym = 34 + 26
    pts = [(x0, ysb), (330, ysb), (330, ym), (370, ym), (370, ysb), (x1, ysb)]
    o.append(PL(pts, c=PUR, lw=2, fill=PSOFT, op=0.6))
    o.append(_f08_m(470, ysb - 8, [("待機 I", "sb", False), (" が周期の間ずっと流れる", "", False)], "middle", 9.5, PUR, True))
    o.append(_f08_m(378, ym + 10, [("測る I", "m", False), (" t", "m", False), (" = 6 µC", "", False)], "start", 9.5, PUR, True))
    # (b)
    yb = 168 + hb
    yoff = yb - 2
    yin, ysu, ycf, ymm = 168 + 18, yb - 30, yb - 44, 168 + 40
    xs = 240
    pts = [(x0, yoff), (xs, yoff), (xs, yin), (xs + 6, ysu), (xs + 50, ysu), (xs + 50, ycf), (xs + 62, ycf),
           (xs + 62, ymm), (xs + 102, ymm), (xs + 102, yoff), (x1, yoff)]
    o.append(PL(pts, c=SIG, lw=2, fill=SSOFT, op=0.6))
    o.append(_f08_m(xs - 6, yin + 4, [("突入 C", "L", False), ("V = 3.0 µC", "", False)], "end", 9.5, SIG, True))
    o.append(_f08_m(xs + 6, ysu - 6, [("起動 I", "su", False), (" t", "su", False)], "start", 9, SIG, True))
    o.append(T(xs + 28, yb + 14, "0.6 µC", "middle", 9, SIG))
    o.append(T(xs + 56, yb + 14, "設定 0.4", "start", 9, SIG))
    o.append(_f08_m(xs + 110, ymm + 10, [("測る I", "m", False), (" t", "m", False), (" = 6 µC", "", False)], "start", 9.5, SIG, True))
    o.append(T(560, yoff - 8, "切っている間は漏れ電流だけ", "middle", 9.5, SIG, True))
    o.append(DARR(xs, yb + 30, xs + 50, yb + 30, c=MUT, lw=1.1, head=5))
    o.append(_f08_m(xs + 25, yb + 46, [("t", "su", True)], "middle", 10, MUT))
    o.append(T(x0, yb + 70, "電源を入れるたびに、起動の電荷 Q_on = 3.0 + 0.6 + 0.4 = 4.0 µC（例の値）がかかる。高さと幅は縮尺どおりではない。", "start", 9.5, MUT))
    o.append(T(x1, yb + 16, "時間（1 周期）", "end", 9, MUT))
    return SVG(700, yb + 80, o, "1 周期のセンサの電流（模式図）。(a) 入れたままなら、待機の電流が周期の間ずっと流れる。(b) 測るときだけ入れるなら、切っている間は負荷スイッチの漏れ電流だけになるが、入れるたびに突入・起動・設定の書き直しの電荷がかかる。")
F["e08_gatewave"] = _f08_gatewave()

# ---- 3 節: 周期と平均電流 ----
def _f08_gatecurve():
    o = []
    p = Plot(90, 24, 440, 236, (1, 1000), (0.03, 30), xlog=True, ylog=True)
    o.append(p.axes(xl="測る周期 T", yl="センサの平均電流 [µA]", xt=[1, 10, 100, 1000], yt=[0.1, 1, 10],
                    xfmt=lambda v: "%g s" % v, yfmt=lambda v: "%g" % v))
    Ts = [10 ** (i * 0.03) for i in range(101)]
    IA = lambda T, Isb: Isb + (600 - Isb) * 0.01 / T
    IB = lambda T, Qon: 0.05 + (Qon + 6.0) / T
    o.append(p.line([(T, IA(T, 2.0)) for T in Ts], c=PUR, lw=2.2))
    o.append(p.line([(T, IA(T, 0.2)) for T in Ts], c=TEA, lw=2.2))
    o.append(p.line([(T, IB(T, 4.0)) for T in Ts if IB(T, 4.0) <= 30], c=SIG, lw=2.4))
    o.append(p.line([(T, IB(T, 10.0)) for T in Ts if IB(T, 10.0) <= 30], c=SIG, lw=1.4, dash="5 4"))
    for Isb, c, Qon in ((2.0, PUR, 4.0), (0.2, TEA, 4.0)):
        Tb = (Qon + Isb * 0.01) / (Isb - 0.05)
        I = IA(Tb, Isb)
        o.append(W(p.X(Tb), p.Y(0.03), p.X(Tb), p.Y(I), c=c, lw=1, dash="3 3"))
        o.append(D(p.X(Tb), p.Y(I), ALI, 4))
    o.append(T(p.X(2.06) + 6, p.Y(0.03) - 6, "2.1 s", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(26.7) + 6, p.Y(0.03) - 6, "27 s", "start", 9.5, TEA, True, halo=True))
    xr = p.x + p.w + 8
    o.append(T(xr, p.Y(2.006) + 4, "A: 待機 2 µA", "start", 9.5, PUR, True))
    o.append(T(xr, p.Y(0.21) + 4, "A: 待機 0.2 µA", "start", 9.5, TEA, True))
    o.append(T(xr, p.Y(0.066) + 4, "B: 切る", "start", 9.5, SIG, True))
    o.append(T(p.X(1.25), p.Y(22), "B（起動をマイコンが起きて待つ）", "start", 9, SIG, halo=True))
    o.append(T(p.X(60) + 6, p.Y(0.95), "周期 60 s: A 2.10 µA・0.30 µA、B 0.22 µA", "start", 9, INK, halo=True))
    o.append(W(p.X(60), p.Y(0.03), p.X(60), p.Y(30), c=FNT, lw=1, dash="2 3"))
    return SVG(700, 304, o, "測る周期と、センサの平均電流（両軸とも対数目盛。3 節の例の値）。A は入れたまま待機させる場合、B は測るときだけ入れる場合。赤い点が損益分岐の周期 T_be で、これより長い周期では B が得になる。起動の間マイコンが起きて待つと（破線）、B の電流は大きくなる。")
F["e08_gatecurve"] = _f08_gatecurve()

# ---- 4 節: 逆流の 3 つの道 ----
def _f08_bfsensor(o, sx, sy, ypin, label="センサ（電源は切った）", c=TEA, powered=False):
    """電源を切ったセンサ: ピン → 保護ダイオード → 電源の線 → 中の回路。"""
    o.append(RECT(sx, sy, 92, 112, 6, soft(c), c, 1.2))
    o.append(T(sx + 46, sy + 106, label, "middle", 8.5, c, True))
    o.append(RECT(sx - 4, ypin - 4, 8, 8, 1, PAN, INK, 1.0))
    if not powered:
        o.append(W(sx + 4, ypin, sx + 20, ypin, c=ALI, lw=1.4))
        o.append(W(sx + 20, ypin, sx + 20, ypin - 12, c=ALI, lw=1.4))
        o.append(_f08_diode_up(sx + 20, ypin - 28, c=ALI))
        o.append(W(sx + 20, ypin - 28, sx + 20, sy + 16, sx + 70, sy + 16, sx + 70, sy + 26, c=ALI, lw=1.4))
        o.append(T(sx + 44, sy + 12, "電源の線", "middle", 8, ALI))
        o.append(RECT(sx + 56, sy + 26, 28, 26, 3, PAN, MUT, 1.0))
        o.append(T(sx + 70, sy + 43, "回路", "middle", 8.5, MUT))
        o.append(W(sx + 70, sy + 52, sx + 70, sy + 64, c=MUT, lw=1.2))
        o.append(_f08_gnd(sx + 70, sy + 64))

def _f08_backflow():
    o = []
    titles = ["(a) マイコンのピンが H のまま", "(b) プルアップがいつも入っている電源に", "(c) 同じバスに電源を入れたままのセンサ"]
    for k in range(3):
        x = 6 + k * 232
        o.append(RECT(x, 6, 224, 206, 8, PAN, LIN, 1.0))
        o.append(T(x + 10, 24, titles[k], "start", 10, INK, True))
        mx, my = x + 8, 52
        o.append(RECT(mx, my, 58, 84, 6, SSOFT, SIG, 1.2))
        o.append(T(mx + 29, my + 14, "マイコン", "middle", 9, SIG, True))
        ypin = my + 58
        sx = x + 124
        if k == 0:
            o.append(T(mx + 29, my + 46, "出力 H", "middle", 9.5, INK, True))
            o.append(W(mx + 58, ypin, sx - 4, ypin, c=INK, lw=1.4))
            o.append(ARR(mx + 66, ypin - 7, sx - 8, ypin - 7, c=ALI, lw=1.8, head=5))
            _f08_bfsensor(o, sx, 44, ypin)
            o.append(T(x + 10, 178, "UART の TX、SPI の CS など", "start", 9.5, INK))
            o.append(T(x + 10, 196, "H の出力から数百 µA〜数 mA", "start", 9.5, ALI, True))
        elif k == 1:
            o.append(T(mx + 29, my + 46, "入力", "middle", 9.5, INK, True))
            o.append(W(mx + 29, my, mx + 29, 40, x + 96, 40, c=GLD, lw=1.5))
            o.append(T(mx + 29, 37, "いつも入っている電源", "start", 8.5, GLD, True))
            o.append(_f08_resv(x + 96, 40, ypin, c=GLD, n=5) + D(x + 96, ypin, INK, 2.6))
            o.append(W(mx + 58, ypin, sx - 4, ypin, c=INK, lw=1.4))
            o.append(ARR(x + 100, ypin - 7, sx - 8, ypin - 7, c=ALI, lw=1.8, head=5))
            _f08_bfsensor(o, sx, 44, ypin)
            o.append(T(x + 10, 178, "ピンを入力にしても流れ込む", "start", 9.5, INK))
            o.append(T(x + 10, 196, "4.7 kΩ × 2 本から数十〜数百 µA", "start", 9.5, ALI, True))
        else:
            o.append(T(mx + 29, my + 46, "マスタ", "middle", 9.5, INK, True))
            o.append(W(mx + 58, ypin, sx - 4, ypin, c=INK, lw=1.4))
            o.append(W(mx + 29, my, mx + 29, 40, x + 88, 40, c=GLD, lw=1.5))
            o.append(_f08_resv(x + 88, 40, ypin, c=GLD, n=5) + D(x + 88, ypin, INK, 2.6))
            o.append(W(x + 106, ypin, x + 106, 148, c=INK, lw=1.2) + D(x + 106, ypin, INK, 2.4))
            o.append(RECT(x + 82, 148, 50, 24, 4, GSOFT, GRN, 1.1))
            o.append(T(x + 107, 164, "入れたまま", "middle", 8.5, GRN, True))
            _f08_bfsensor(o, sx, 44, ypin)
            o.append(T(x + 10, 188, "線が 1.25 V までしか上がらない", "start", 9.5, ALI, True))
            o.append(T(x + 10, 204, "→ 入れたままのセンサとも通信できない", "start", 9.5, ALI))
    return SVG(700, 218, o, "電源を切ったセンサへの逆流の道。電流は、センサのピンの保護ダイオードを通ってセンサの電源の線へ流れ込み、中の回路を半端に動かす（赤の線と矢印）。(c) では、引き下げられた線を、電源を入れたままのセンサも使えなくなる（値は 4 節の例）。")
F["e08_backflow"] = _f08_backflow()

# ---- 4 節: 流れ込む電流と線の電圧 ----
def _f08_bfcalc():
    o = []
    VDD, VF, Rs_pu, Rs_pp = 3.0, 0.5, 2350.0, 40.0
    Rx = [10 ** (2 + i * 0.04) for i in range(101)]
    I = lambda Rs, R: (VDD - VF) / (Rs + R) * 1e6
    Vb = lambda Rs, R: (VDD - VF) * R / (Rs + R) + VF
    p = Plot(78, 26, 250, 196, (100, 1e6), (10, 3e4), xlog=True, ylog=True)
    xf = {100: "100 Ω", 1e3: "1 kΩ", 1e4: "10 kΩ", 1e5: "100 kΩ", 1e6: "1 MΩ"}
    o.append(T(p.x + p.w / 2, 16, "流れ込む電流", "middle", 11, INK, True))
    o.append(p.axes(xl="センサの電源の線（R_x）", yl="電流 [µA]", xt=[100, 1e3, 1e4, 1e5, 1e6], yt=[10, 100, 1000, 1e4],
                    xfmt=lambda v: xf[v], yfmt=lambda v: "%g" % v))
    o.append(p.line([(R, I(Rs_pp, R)) for R in Rx], c=SIG, lw=2.2))
    o.append(p.line([(R, I(Rs_pu, R)) for R in Rx], c=GLD, lw=2.2))
    for R in (1e3, 1e4, 1e5):
        o.append(D(p.X(R), p.Y(I(Rs_pp, R)), SIG, 3.2) + D(p.X(R), p.Y(I(Rs_pu, R)), GLD, 3.2))
    o.append(T(p.X(1.3e3) + 4, p.Y(I(Rs_pp, 1e3)) - 4, "(a) H の出力 2.4 mA", "start", 9, SIG, True, halo=True))
    o.append(T(p.X(1.05e3) - 4, p.Y(I(Rs_pu, 1e3)) + 16, "(b) プルアップ 746 µA", "start", 9, GLD, True, halo=True))
    o.append(T(p.X(1e4) + 5, p.Y(I(Rs_pu, 1e4)) + 14, "202 µA", "start", 9, GLD, halo=True))
    o.append(T(p.X(1e5) + 5, p.Y(I(Rs_pu, 1e5)) + 14, "24 µA", "start", 9, GLD, halo=True))
    q = Plot(430, 26, 250, 196, (100, 1e6), (0, 3.0), xlog=True)
    o.append(T(q.x + q.w / 2, 16, "(b) の信号の線の電圧", "middle", 11, INK, True))
    Rt = (2.1 - VF) * Rs_pu / (VDD - 2.1)
    o.append(RECT(q.X(100), q.Y(2.1), q.X(Rt) - q.X(100), q.Y(0) - q.Y(2.1), 0, ASOFT, "none", 0, op=0.8))
    o.append(q.axes(xl="センサの電源の線（R_x）", yl="電圧 [V]", xt=[100, 1e3, 1e4, 1e5, 1e6], yt=[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
                    xfmt=lambda v: xf[v], yfmt=lambda v: "%g" % v))
    o.append(q.line([(100, 2.1), (1e6, 2.1)], c=ALI, lw=1.3, dash="5 4"))
    o.append(T(q.X(1.2e5), q.Y(2.1) + 13, "H と読める下限 2.1 V", "start", 9, ALI, halo=True))
    o.append(q.line([(R, Vb(Rs_pu, R)) for R in Rx], c=GLD, lw=2.2))
    o.append(W(q.X(Rt), q.Y(0), q.X(Rt), q.Y(2.1), c=ALI, lw=1.2, dash="3 3"))
    o.append(D(q.X(Rt), q.Y(2.1), ALI, 4))
    o.append(T(q.X(Rt) + 6, q.Y(2.1) - 8, "4.2 kΩ", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(130), q.Y(0.35), "バスが止まる", "start", 9.5, ALI, True, halo=True))
    o.append(D(q.X(1e3), q.Y(Vb(Rs_pu, 1e3)), GLD, 3.4))
    o.append(T(q.X(1e3) + 6, q.Y(Vb(Rs_pu, 1e3)) + 4, "1.25 V", "start", 9, GLD, True, halo=True))
    return SVG(700, 270, o, "電源を切ったセンサへ流れ込む電流と、信号の線の電圧（V_DD = 3.0 V、V_F = 0.5 V、プルアップ 4.7 kΩ × 2 本、出力の抵抗 40 Ω の例）。横軸は、センサの電源の線につながった回路を抵抗とみなした値で、小さいほど逆流で多く使う。R_x が 4.2 kΩ より小さいと、線が H と読める電圧まで上がらない。")
F["e08_bfcalc"] = _f08_bfcalc()

# ---- 4 節: 悪い例と良い例 ----
def _f08_bfgood():
    o = []
    for k in range(2):
        x = 6 + k * 348
        good = k == 1
        c = GRN if good else ALI
        o.append(RECT(x, 6, 340, 236, 8, PAN, LIN, 1.0))
        o.append(T(x + 10, 24, "(b) 良い例" if good else "(a) 悪い例", "start", 11, c, True))
        # いつも入っている電源と負荷スイッチ
        o.append(W(x + 14, 46, x + 150, 46, c=GLD, lw=1.8))
        o.append(T(x + 14, 40, "いつも入っている電源", "start", 8.5, GLD, True))
        o.append(RECT(x + 150, 36, 66, 20, 4, GOSOFT, GLD, 1.1))
        o.append(T(x + 183, 50, "負荷スイッチ", "middle", 8.5, GLD, True))
        o.append(W(x + 216, 46, x + 300, 46, x + 300, 70, c=GLD, lw=1.8, dash="5 3"))
        o.append(T(x + 258, 40, "切る側（切った）", "middle", 8.5, GLD))
        # マイコン
        o.append(RECT(x + 14, 86, 70, 96, 6, SSOFT, SIG, 1.2))
        o.append(T(x + 49, 100, "マイコン", "middle", 9, SIG, True))
        o.append(W(x + 49, 86, x + 49, 46, c=GLD, lw=1.4) + D(x + 49, 46, GLD, 2.6))
        # センサ
        o.append(RECT(x + 254, 70, 80, 112, 6, TSOFT, TEA, 1.2))
        o.append(T(x + 294, 176, "センサ（切った）", "middle", 8.5, TEA, True))
        ys = (124, 152)
        for i, (yy, nm) in enumerate(zip(ys, ("SDA", "SCL"))):
            o.append(W(x + 84, yy, x + 254, yy, c=INK, lw=1.4))
            o.append(T(x + 90, yy - 4, nm, "start", 8.5, INK, True))
            rx = x + 120 + i * 24
            if good:
                o.append(W(rx, 60, rx, 66, c=GLD, lw=1.4))
            o.append(_f08_resv(rx, 66, yy, c=GLD, n=4) + D(rx, yy, INK, 2.4))
        if good:
            o.append(W(x + 120, 60, x + 144, 60, c=GLD, lw=1.4))
            o.append(W(x + 144, 60, x + 232, 60, x + 232, 46, c=GLD, lw=1.4, dash="5 3") + D(x + 232, 46, GLD, 2.6))
            o.append(T(x + 196, 74, "プルアップも切る側に", "middle", 8.5, GRN, True))
            o.append(T(x + 49, 132, "出力 L", "middle", 9.5, GRN, True))
            o.append(T(x + 49, 160, "出力 L", "middle", 9.5, GRN, True))
            o.append(T(x + 170, 116, "0 V（流れない）", "middle", 8.5, GRN, True))
        else:
            o.append(W(x + 120, 60, x + 144, 60, c=GLD, lw=1.4))
            o.append(W(x + 132, 60, x + 132, 46, c=GLD, lw=1.4) + D(x + 132, 46, GLD, 2.6))
            o.append(T(x + 49, 132, "出力 H", "middle", 9.5, ALI, True))
            o.append(T(x + 49, 160, "入力", "middle", 9.5, INK, True))
            o.append(ARR(x + 150, 118, x + 248, 118, c=ALI, lw=1.8, head=5))
            o.append(ARR(x + 150, 146, x + 248, 146, c=ALI, lw=1.8, head=5))
        o.append(T(x + 10, 206, "プルアップとピンも一緒に止まり、電流は流れない" if good else "切っても、H の出力とプルアップから流れ込む", "start", 9.5, c, True))
        o.append(T(x + 10, 224, "切るセンサは、入れたままのセンサと別のバスに" if good else "入れたままのセンサがいれば、バスも止まる", "start", 9.5, INK))
    return SVG(700, 248, o, "逆流の防ぎ方。(a) プルアップ抵抗がいつも入っている電源にあり、ピンが H のままだと、センサの電源を切っても電流が流れ込む。(b) プルアップ抵抗をセンサと同じ切る側の電源につなぎ、切る前にピンを L にすれば、線は 0 V になり、電流は流れない。")
F["e08_bfgood"] = _f08_bfgood()

# ---- 5 節: RC の立ち上がり ----
def _f08_rise():
    o = []
    Cb, VDD = 100e-12, 3.0
    p = Plot(80, 24, 470, 214, (0, 1400), (0, 3.2))
    o.append(p.axes(xl="線を離してからの時間 [ns]（バス容量 100 pF）", yl="線の電圧 [V]", xt=[0, 200, 400, 600, 800, 1000, 1200, 1400],
                    yt=[0, 0.9, 2.1, 3.0], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    for v, lab in ((0.9, "0.3 V_DD（L の上限）"), (2.1, "0.7 V_DD（H の下限）")):
        o.append(p.line([(0, v), (1400, v)], c=MUT, lw=1.1, dash="5 4"))
    k = math.log(7.0 / 3.0)
    rows = [(2200, GRN), (4700, GLD), (10000, ALI)]
    for i, (R, c) in enumerate(rows):
        tau = R * Cb * 1e9
        ts = [i2 * 7.0 for i2 in range(201)]
        o.append(p.line([(t, VDD * (1 - math.exp(-t / tau))) for t in ts], c=c, lw=2.2))
        t30, t70 = tau * math.log(1 / 0.7), tau * math.log(1 / 0.3)
        o.append(p.line([(t30, 0.9), (t70, 2.1)], c=c, lw=0.1))
        o.append(D(p.X(t30), p.Y(0.9), c, 3.2) + D(p.X(t70), p.Y(2.1), c, 3.2))
        yy = 262 + i * 0
    xl = p.x + p.w + 14
    for i, (R, c) in enumerate(rows):
        tau = R * Cb * 1e9
        o.append(T(xl, 52 + i * 34, "%.1f kΩ" % (R / 1000.0) if R < 10000 else "10 kΩ", "start", 10, c, True))
        o.append(_f08_m(xl, 66 + i * 34, [("t", "r", True), (" = %.0f ns" % (k * tau), "", False)], "start", 9.5, c))
    o.append(T(xl, 170, "Fast-mode（400 kHz）の", "start", 9, INK))
    o.append(T(xl, 183, "上限 300 ns を満たすのは", "start", 9, INK))
    o.append(T(xl, 196, "2.2 kΩ だけ", "start", 9, INK, True))
    o.append(T(p.X(5), p.Y(0.9) - 5, "0.3 V_DD = 0.9 V", "start", 9, MUT, halo=True))
    o.append(T(p.X(1395), p.Y(2.1) - 5, "0.7 V_DD = 2.1 V", "end", 9, MUT, halo=True))
    return SVG(700, 286, o, "プルアップ抵抗がバス容量を充電して線が上がる様子（V_DD = 3.0 V、バス容量 100 pF の例）。点は 30 % と 70 % を通る時刻で、その間が立ち上がり時間 t_r = R C ln(7/3) ≈ 0.8473 R C である。")
F["e08_rise"] = _f08_rise()

# ---- 5 節: 使える抵抗の範囲 ----
def _f08_window():
    o = []
    k = math.log(7.0 / 3.0)
    p = Plot(86, 20, 460, 250, (10, 1000), (100, 1e5), xlog=True, ylog=True)
    Rmax = lambda tr, C: tr / (k * C * 1e-12)
    # Fast-mode の範囲を塗る
    Cs = [10 * 10 ** (i * 0.02) for i in range(81) if 10 * 10 ** (i * 0.02) <= 400]
    poly = [(p.X(10), p.Y(867))] + [(p.X(400), p.Y(867))] + [(p.X(C), p.Y(Rmax(300e-9, C))) for C in reversed(Cs + [400])]
    o.append(PL(poly, c="none", lw=0, fill=SSOFT, op=0.7))
    o.append(p.axes(xl="バス容量 [pF]", yl="プルアップ抵抗", xt=[10, 100, 1000], yt=[100, 1000, 1e4, 1e5],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: {100: "100 Ω", 1000: "1 kΩ", 1e4: "10 kΩ", 1e5: "100 kΩ"}[v]))
    lines = [(1000e-9, GRN, "100 kHz の上限（t_r 1000 ns）"), (300e-9, SIG, "400 kHz の上限（300 ns）"), (120e-9, PUR, "1 MHz の上限（120 ns）")]
    Cl = [10 * 10 ** (i * 0.02) for i in range(101)]
    for tr, c, lab in lines:
        o.append(p.line([(C, Rmax(tr, C)) for C in Cl if 100 <= Rmax(tr, C) <= 1e5], c=c, lw=2.2))
    o.append(T(p.X(11), p.Y(Rmax(1000e-9, 11)) + 16, lines[0][2], "start", 9, GRN, True, halo=True))
    o.append(T(p.X(11), p.Y(Rmax(300e-9, 11)) + 16, lines[1][2], "start", 9, SIG, True, halo=True))
    o.append(T(p.X(11), p.Y(Rmax(120e-9, 11)) + 16, lines[2][2], "start", 9, PUR, True, halo=True))
    o.append(p.line([(10, 867), (1000, 867)], c=INK, lw=1.4, dash="6 4"))
    o.append(T(p.X(560), p.Y(867) - 6, "下限 867 Ω", "end", 9, INK, True, halo=True))
    o.append(p.line([(10, 130), (1000, 130)], c=PUR, lw=1.2, dash="6 4"))
    o.append(T(p.X(560), p.Y(130) - 6, "1 MHz の下限 130 Ω", "end", 9, PUR, halo=True))
    o.append(p.line([(400, 100), (400, 1e5)], c=MUT, lw=1.1, dash="3 3"))
    o.append(T(p.X(400) + 4, p.Y(6e4), "400 pF", "start", 9, MUT, halo=True))
    pts = [(2200, GRN, "2.2 kΩ: 400 kHz で使える"), (4700, GLD, "4.7 kΩ: 100 kHz なら使える"), (40000, ALI, "内蔵 40 kΩ: どれも満たさない")]
    xr = p.x + p.w + 12
    for i, (R, c, lab) in enumerate(pts):
        o.append(D(p.X(100), p.Y(R), c, 4.4))
        o.append(T(xr, 70 + i * 22, lab, "start", 9, c, True))
    o.append(T(xr, 150, "点は 100 pF の例", "start", 9, MUT))
    o.append(T(xr, 168, "青い区間: 400 kHz で", "start", 9, SIG))
    o.append(T(xr, 181, "使える範囲", "start", 9, SIG))
    return SVG(700, 316, o, "プルアップ抵抗の使える範囲（V_DD = 3.0 V。両軸とも対数目盛）。上限は立ち上がり時間で、下限は L に引く装置が流せる電流（3 mA。1 MHz の区分は 20 mA）で決まる。バス容量が大きいほど上限が下がり、範囲は狭くなる。")
F["e08_window"] = _f08_window()

# ---- 6 節: 固まったバスと復旧 ----
def _f08_hang():
    o = []
    # 読み出しの途中（値 0x00 の 7〜4 番を送った後、3 番を出している所でリセット）
    t = 0.0
    scl, sda, drv = [(0.0, 0)], [(0.0, 0)], []
    clk_marks, events = [], []
    for b in range(4):              # 7〜4 番のビット（すべて 0）
        drv.append((t, t + 2, "s")); t += 1; scl.append((t, 1)); t += 1; scl.append((t, 0))
    drv.append((t, t + 1, "s")); t += 1          # 3 番のビットを出したところ（SCL は L）
    t_reset = t
    scl.append((t, 1))                            # リセットでピンが離れ、SCL は H に
    gap = 9.0
    drv.append((t, t + gap, "s")); t += gap
    t_rec = t
    for n in range(4):              # 復旧のクロック 1〜4
        t += 0.4
        scl.append((t, 0))
        if n < 3:
            drv.append((t - 0.4, t + 2.0, "s"))
        else:
            sda.append((t + 0.25, 1))
        clk_marks.append((t + 0.5, n + 1))
        t += 1.0; scl.append((t, 1)); t += 0.6
    t += 0.4; sda.append((t, 0)); drv.append((t, t + 0.8, "m")); t_s = t
    t += 0.8; sda.append((t, 1)); t_p = t
    t += 3.0
    scl.append((t, 1)); sda.append((t, 1))
    x0, x1 = 62, 690
    u = (x1 - x0) / t
    X = lambda tt: x0 + tt * u
    ys, yd, hh = 44, 104, 20
    o.append(T(14, ys + 15, "SCL", "start", 11, INK, True))
    o.append(T(14, yd + 15, "SDA", "start", 11, INK, True))
    for a, b, d in drv:
        o.append(RECT(X(a), yd - 5, X(b) - X(a), hh + 10, 0, PSOFT if d == "s" else SSOFT, "none", 0))
    o.append(PL(_f08_steps(scl, X, lambda v: ys + (0 if v else hh)), c=INK, lw=1.7))
    o.append(PL(_f08_steps(sda, X, lambda v: yd + (0 if v else hh)), c=INK, lw=1.7))
    o.append(W(X(t_reset), 22, X(t_reset), yd + hh + 8, c=ALI, lw=1.6, dash="4 3"))
    o.append(T(X(t_reset) - 4, 18, "マイコンがリセット", "end", 9.5, ALI, True))
    o.append(T((X(0) + X(t_reset)) / 2, yd + hh + 22, "読み出しの途中（値 0x00）", "middle", 9.5, PUR, True))
    o.append(T((X(t_reset) + X(t_rec)) / 2, yd + hh + 22, "SDA が L のまま。開始条件を出せない", "middle", 9.5, ALI, True))
    o.append(T((X(t_reset) + X(t_rec)) / 2, ys - 8, "SCL は H（クロックが来ない）", "middle", 9, MUT))
    for tm, n in clk_marks:
        o.append(T(X(tm), ys - 8, str(n), "middle", 9.5, GLD, True))
    o.append(T(X(t_rec) + 2, 18, "復旧のクロック", "start", 9.5, GLD, True))
    o.append(T((X(t_rec) + X(t_s)) / 2 + 4, yd + hh + 22, "残りのビット → ACK の位置で離す", "middle", 9.5, GLD, True))
    o.append(T((X(t_s) + X(t_p)) / 2, yd - 10, "開始・停止", "middle", 9, SIG, True))
    o.append(T(X(t_p) + 6, yd + hh + 22, "使える", "start", 9.5, GRN, True))
    yl = yd + hh + 46
    o.append(LEGEND(14, yl, [(PUR, "スレーブが SDA を L に引いている"), (SIG, "マスタが開始条件・停止条件を出す")]))
    return SVG(700, yl + 12, o, "読み出しの途中でマイコンがリセットされ、バスが固まる様子と、その復旧。スレーブは送りかけのバイトの残りを出すクロックを待ち、0 のビットで SDA を L に引き続ける。マスタがクロックを送ると、スレーブは残りのビットを出し終え、ACK の位置で SDA を離す。そこで開始条件と停止条件を出せば、スレーブは待つ状態に戻る。")
F["e08_hang"] = _f08_hang()

# ---- 6 節: 復旧の手順 ----
def _f08_dia(o, cx, cy, w, h, l1, l2=None, c=GLD):
    o.append(PL([(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)], c=c, lw=1.4, fill=soft(c)))
    if l2:
        o.append(T(cx, cy - 2, l1, "middle", 9.5, INK, True))
        o.append(T(cx, cy + 12, l2, "middle", 8.5, MUT))
    else:
        o.append(T(cx, cy + 4, l1, "middle", 9.5, INK, True))

def _f08_recflow():
    o = []
    o.append(BOX(14, 20, 150, 44, "① 起動の直後・時間切れ", None, SIG, SSOFT, INK, sz=10))
    o.append(ARR(166, 42, 196, 42, c=INK, lw=1.4, head=6))
    o.append(BOX(198, 20, 170, 44, "② ピンを GPIO にし、", "SDA と SCL を離す", SIG, SSOFT, INK, sz=10, ssz=9))
    o.append(ARR(370, 42, 412, 42, c=INK, lw=1.4, head=6))
    _f08_dia(o, 520, 42, 212, 58, "③ SCL が H になるか", "（最大 1 ms 待つ）")
    o.append(ARR(520, 72, 520, 102, c=GRN, lw=1.5, head=6))
    o.append(T(526, 92, "なる", "start", 9, GRN, True))
    o.append(BOX(420, 104, 200, 44, "④ SDA が H になるまで", "クロックを送る（最大 9 回）", GLD, GOSOFT, INK, sz=10, ssz=9))
    o.append(ARR(418, 126, 372, 126, c=INK, lw=1.4, head=6))
    _f08_dia(o, 276, 126, 188, 54, "⑤ SDA が H か")
    o.append(ARR(182, 126, 166, 126, c=GRN, lw=1.5, head=6))
    o.append(T(174, 118, "H", "middle", 9, GRN, True))
    o.append(BOX(14, 104, 150, 44, "⑥ 開始条件と停止条件", "BUS_OK・BUS_CLOCKED", GRN, GSOFT, INK, sz=10, ssz=8.5))
    # 戻らないとき
    o.append(W(626, 42, 676, 42, 676, 198, 470, 198, c=ALI, lw=1.5))
    o.append(_head(676, 198, 468, 198, ALI, 6))
    o.append(T(682, 120, "ならない", "start", 9, ALI, True, rot=90))
    o.append(ARR(276, 153, 276, 176, c=ALI, lw=1.5, head=6))
    o.append(T(282, 168, "L のまま", "start", 9, ALI, True))
    o.append(BOX(226, 178, 242, 44, "⑦ センサとプルアップの電源を切って", "入れ直し、③〜⑤ をもう一度", ALI, ASOFT, INK, sz=9.5, ssz=9))
    o.append(ARR(226, 200, 166, 200, c=INK, lw=1.4, head=6))
    o.append(BOX(14, 172, 150, 56, "⑧ 戻れば BUS_REPOWERED", "戻らなければ BUS_DEAD（そのセンサを使わずに続ける）", GLD, GOSOFT, INK, sz=9, ssz=8.5))
    o.append(T(14, 252, "戻ったら: センサの設定を最初から書き直し（電源を入れ直したなら起動時間を待つ）、復旧の回数と原因を記録する。", "start", 9.5, INK))
    return SVG(700, 262, o, "バスの復旧の手順（6 節のコードと同じ）。SCL が H になれば、SDA が H になるまでクロックを送り、開始条件と停止条件で終える。SCL が L のまま、または 9 回でも SDA が戻らなければ、センサの電源を入れ直す。")
F["e08_recflow"] = _f08_recflow()
