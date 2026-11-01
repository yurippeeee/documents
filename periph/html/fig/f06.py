# -*- coding: utf-8 -*-
# 06 章 AC 電源で動かす の図

# ---- 補助: 添字付きの記号・回路の部品 ----
def _f06_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s">' % (round(x0, 2), y, sz, c, "700" if b else "400")]
    for s, sub, it in parts:
        o.append('<tspan font-style="%s">%s</tspan>' % ("italic" if it else "normal", E(s)))
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan><tspan dy="-3"></tspan>' % (sz * 0.72, E(sub)))
    o.append("</text>")
    return "".join(o)

def _f06_resh(x1, x2, y, c=INK, lw=1.4, h=5, n=6):
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)] + [(x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)) for i in range(n)] + [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f06_gnd(x, y, c=MUT):
    """大地の記号。y は線の上端。"""
    return (W(x, y, x, y + 7, c=c, lw=1.4) + W(x - 9, y + 7, x + 9, y + 7, c=c, lw=1.6)
            + W(x - 6, y + 11, x + 6, y + 11, c=c, lw=1.4) + W(x - 3, y + 15, x + 3, y + 15, c=c, lw=1.2))

def _f06_coil(x, y, n=4, r=6, c=GLD, side=1):
    d = "M%g,%g" % (x, y)
    for i in range(n):
        d += " a%g,%g 0 0 %d 0,%g" % (r, r, 1 if side > 0 else 0, 2 * r)
    return PATH(d, c=c, lw=1.5)

def _f06_person(x, y, c=INK):
    """人の形。(x, y) は頭の中心。足は y + 46。"""
    return (CIRC(x, y, 6, c=c, lw=1.5, fill=PAN) + W(x, y + 6, x, y + 28, c=c, lw=1.6)
            + W(x - 12, y + 16, x, y + 12, x + 12, y + 16, c=c, lw=1.5)
            + W(x - 9, y + 46, x, y + 28, x + 9, y + 46, c=c, lw=1.6))

def _f06_src(x, y, r=13, c=GLD):
    """交流の電圧の源（丸に波）。"""
    return CIRC(x, y, r, c=c, lw=1.6, fill=PAN) + PATH("M%g,%g q%g,%g %g,0 t%g,0" % (x - r * 0.6, y, r * 0.3, -r * 0.7, r * 0.6, r * 0.6), c=c, lw=1.4)

# ---- 共通: 整流と平滑の模型（1・3 節の例の値）。numpy を使わずに細かい時間刻みで解く ----
_F06_C, _F06_RS, _F06_VD, _F06_V2 = 22e-6, 5.0, 1.8, 70.0

def _f06_sim(Vrms=100.0, f=50.0, P=5.0, Pcut=None, t_out=None, dur=10.0, Von=20.0, Tdet=3e-3, t_end=0.2, dt=5e-6, C=_F06_C, every=10):
    """全波整流 + 平滑コンデンサ + 一定の電力の負荷。t_out から dur の間、商用電源が途切れる。
    交流の検出の信号が Tdet 続けて H なら検出し、Pcut があれば電力をそれに減らす。
    戻り値: 標本の列 (t, v, i, vac, high) と、検出の時刻・保てなくなった時刻。"""
    Vp = math.sqrt(2) * Vrms
    v = Vp - _F06_VD
    Pn = P; hi_since = None; det = None; col = None
    out = []
    n = int(t_end / dt)
    for k in range(n):
        t = k * dt
        on = not (t_out is not None and t_out <= t < t_out + dur)
        vac = Vp * math.sin(2 * math.pi * f * t) if on else 0.0
        high = abs(vac) < Von
        if high and hi_since is None:
            hi_since = t
        if not high:
            hi_since = None
        if det is None and t_out is not None and t >= t_out and hi_since is not None and t - hi_since > Tdet:
            det = t
            if Pcut is not None:
                Pn = Pcut
        ich = abs(vac) - _F06_VD - v
        ich = ich / _F06_RS if ich > 0 else 0.0
        il = Pn / v if v > _F06_V2 else 0.0
        if v <= _F06_V2 and col is None and t_out is not None and t > t_out:
            col = t
        v += (ich - il) / C * dt
        if k % every == 0:
            out.append((t, v, ich, vac, high))
    return out, det, col

# ---- 1 節: 整流と平滑 ----
def _f06_rect():
    o = []
    s, _, _ = _f06_sim(t_end=0.142, dt=4e-6, every=5)
    s = [(t - 0.1, v, i, vac) for t, v, i, vac, _ in s if t >= 0.1]
    pv = Plot(80, 26, 540, 150, (0, 40), (0, 160))
    o.append(pv.axes(yl="電圧 [V]", xt=[0, 10, 20, 30, 40], yt=[0, 40, 80, 120, 160], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
    o.append(pv.line([(t * 1e3, abs(vac)) for t, v, i, vac in s], c=MUT, lw=1.2, dash="4 3"))
    o.append(pv.line([(t * 1e3, v) for t, v, i, vac in s], c=GLD, lw=2.4))
    vmax = max(v for t, v, i, vac in s); vmin = min(v for t, v, i, vac in s)
    o.append(T(pv.X(40) + 8, pv.Y(vmax) + 4, "山 %.0f V" % vmax, "start", 9.5, GLD, True))
    o.append(T(pv.X(40) + 8, pv.Y(vmin) + 10, "谷 %.0f V" % vmin, "start", 9.5, GLD, True))
    o.append(T(pv.X(20.6), pv.Y(70), "整流した電圧（破線）", "start", 9.5, MUT, halo=True))
    o.append(T(pv.X(22.5), pv.Y(146), "平滑コンデンサの電圧", "start", 9.5, GLD, True, halo=True))
    pi_ = Plot(80, 196, 540, 70, (0, 40), (0, 0.5))
    o.append(pi_.axes(xl="時間 [ms]（100 V・50 Hz）", yl="電流 [A]", xt=[0, 10, 20, 30, 40], yt=[0, 0.2, 0.4], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(pi_.line([(t * 1e3, i) for t, v, i, vac in s], c=PUR, lw=1.8))
    imax = max(i for t, v, i, vac in s)
    on = [t for t, v, i, vac in s if i > 0 and t < 0.01]
    o.append(T(pi_.X(on[-1] * 1e3) + 8, pi_.Y(0.47), "商用電源から流れる電流（山 %.2f A、幅 %.1f ms）" % (imax, (on[-1] - on[0]) * 1e3), "start", 9.5, PUR, True, halo=True))
    return SVG(700, 300, o, "整流と平滑（5 W を一定に使う負荷、平滑コンデンサ 22 µF、100 V・50 Hz の例の値を数値で解いた）。平滑コンデンサは山の近くで充電され、山と山の間はためた電荷で負荷に電流を送る。商用電源から電流が流れるのは、山の近くの短い間だけである。")
F["e06_rect"] = _f06_rect()

# ---- 1 節: 3 つの構成 ----
def _f06_chain(o, y, items, x0=150, gap=14, h=40):
    """箱を左から並べ、矢印でつなぐ。items = [(幅, 名前, 説明, 色), ...]。返り値: 各箱の (x, w)。"""
    xs = []
    x = x0
    for k, (w, nm, sub, c) in enumerate(items):
        o.append(BOX(x, y, w, h, nm, sub, c, PAN, INK, r=6, sz=10, ssz=9))
        xs.append((x, w))
        if k + 1 < len(items):
            o.append(ARR(x + w + 1, y + h / 2, x + w + gap - 1, y + h / 2, c=GLD, lw=1.4, head=5))
        x += w + gap
    return xs

def _f06_three():
    o = []
    rows = [(16, "(a) AC アダプタ", "機器の外で絶縁"), (122, "(b) 絶縁電源", "機器の中で絶縁"), (228, "(c) 非絶縁電源", "変圧器が無い")]
    for y, t1, t2 in rows:
        o.append(T(12, y + 22, t1, "start", 11, INK, True))
        o.append(T(12, y + 38, t2, "start", 9, MUT))
        o.append(_f06_src(128, y + 30, 11, GLD))
    # (a)
    y = 16
    o.append(RECT(146, y + 2, 254, 56, 8, ASOFT, ALI, 1.2))
    o.append(T(152, y + 72, "AC アダプタ（中に危険な電圧）", "start", 9, ALI, True))
    xs = _f06_chain(o, y + 10, [(52, "整流", "平滑", MUT), (66, "スイッチ", "数十 kHz〜", MUT), (52, "変圧器", None, GLD), (52, "整流", "平滑", MUT)], x0=152, gap=6)
    xb = xs[2][0] + 26
    o.append(W(xb, y - 2, xb, y + 64, c=GRN, lw=1.6, dash="5 3"))
    o.append(W(400, y + 30, 462, y + 30, c=GLD, lw=2.2) + T(431, y + 24, "ケーブル", "middle", 9, MUT, halo=True))
    o.append(RECT(462, y + 2, 226, 56, 8, SSOFT, SIG, 1.2))
    o.append(T(468, y + 72, "機器（低い直流だけ）", "start", 9, SIG, True))
    _f06_chain(o, y + 10, [(100, "レギュレータ", "3.3 V", MUT), (80, "マイコン", None, SIG)], x0=476, gap=16)
    # (b)
    y = 122
    k0 = len(o)
    xs = _f06_chain(o, y + 10, [(44, "整流", None, MUT), (62, "平滑", "約 140 V", GLD), (58, "スイッチ", None, MUT), (48, "変圧器", None, GLD),
                                 (72, "整流・平滑", "12 V", MUT), (82, "レギュレータ", "3.3 V", MUT), (58, "マイコン", None, SIG)], x0=152, gap=8)
    xb = xs[3][0] + 24
    o.insert(k0, RECT(146, y + 2, xb - 146, 56, 8, ASOFT, ALI, 1.2) + RECT(xb, y + 2, 688 - xb, 56, 8, SSOFT, SIG, 1.2))
    o.append(T(152, y + 72, "一次側（危険な電圧）", "start", 9, ALI, True))
    o.append(T(684, y + 72, "二次側", "end", 9, SIG, True))
    o.append(W(xb, y - 6, xb, y + 92, c=GRN, lw=1.6, dash="5 3"))
    o.append(T(xb + 4, y - 6, "絶縁の境界", "start", 9, GRN, True, halo=True))
    # フォトカプラの帰り道
    xa, xc = xs[4][0] + 33, xs[2][0] + 30
    o.append(W(xa, y + 50, xa, y + 64) + W(xa, y + 64, xc, y + 64, c=TEA, lw=1.3, dash="3 2") + ARR(xc, y + 64, xc, y + 52, c=TEA, lw=1.3, head=5))
    o.append(T((xa + xc) / 2 - 30, y + 84, "フォトカプラ（出力の電圧を伝える）", "middle", 9, TEA, halo=True))
    # (c)
    y = 228
    o.append(RECT(146, y + 2, 542, 56, 8, ASOFT, ALI, 1.2))
    o.append(T(152, y + 72, "全体が危険な電圧（マイコンの GND も商用電源とつながる）", "start", 9, ALI, True))
    _f06_chain(o, y + 10, [(140, "コンデンサドロップ", "またはスイッチング電源", MUT), (112, "電圧を決める", "ツェナー・レギュレータ", MUT), (80, "マイコン", None, SIG)], x0=152, gap=14)
    o.append(T(560, y + 34, "変圧器が無い", "start", 9.5, ALI, True))
    return SVG(700, 316, o, "商用電源から機器の直流をつくる 3 つの構成。赤い枠の中は商用電源と導体でつながる危険な部分、緑の破線は絶縁の境界である。(a) と (b) では、マイコンは境界の安全な側にある。(c) では、マイコンを含む回路の全体が危険な電圧にある。")
F["e06_three"] = _f06_three()

# ---- 2 節: 絶縁の境界 ----
def _f06_barrier():
    o = []
    # 左: 基板を上から見た図
    bx, by, bw, bh = 14, 34, 430, 236
    xm = bx + 200
    o.append(T(bx + 100, 22, "一次側（商用電源とつながる）", "middle", 10, ALI, True))
    o.append(T(xm + 115, 22, "二次側（人が触れる側）", "middle", 10, GRN, True))
    o.append(RECT(bx, by, xm - bx, bh, 8, ASOFT, ALI, 1.2))
    o.append(RECT(xm, by, bx + bw - xm, bh, 8, GSOFT, GRN, 1.2))
    o.append(RECT(xm - 4, by + 14, 8, bh - 28, 2, SCR, MUT, 1.0))
    o.append(T(xm, by + bh + 14, "溝（スリット）", "middle", 9, MUT))
    o.append(BOX(bx + 10, by + 14, 74, 40, "入口", "ヒューズなど", ALI, PAN, INK, r=5, sz=10, ssz=9))
    o.append(BOX(bx + 10, by + 70, 74, 40, "整流", "平滑", ALI, PAN, INK, r=5, sz=10, ssz=9))
    o.append(BOX(bx + 10, by + 126, 74, 40, "スイッチ", "制御", ALI, PAN, INK, r=5, sz=10, ssz=9))
    o.append(BOX(bx + 10, by + 182, 74, 40, "交流の", "検出の抵抗", ALI, PAN, INK, r=5, sz=10, ssz=9))
    # 境界をまたぐ部品
    parts = [(by + 18, "変圧器", GLD, 40), (by + 84, "フォトカプラ（出力の制御）", TEA, 24), (by + 130, "フォトカプラ（交流の検出）", TEA, 24), (by + 176, "Y コンデンサ", PUR, 24)]
    for yy, nm, c, h in parts:
        o.append(RECT(xm - 46, yy, 92, h, 4, soft(c), c, 1.4))
        o.append(T(xm, yy + h + 13, nm, "middle", 9, c, True, halo=True))
    o.append(T(xm, by + 42, "巻線の間の絶縁", "middle", 9, INK, halo=True))
    o.append(BOX(bx + bw - 98, by + 14, 88, 40, "整流・平滑", "12 V・3.3 V", SIG, PAN, INK, r=5, sz=10, ssz=9))
    o.append(BOX(bx + bw - 98, by + 82, 88, 40, "マイコン", None, SIG, SSOFT, SIG, r=5, sz=10.5))
    o.append(BOX(bx + bw - 98, by + 150, 88, 66, "人が触れる所", "ボタン・表示・端子", GRN, PAN, INK, r=5, sz=10, ssz=9))
    # 右: 断面（空間距離と沿面距離）
    x0, y0 = 470, 120
    o.append(T(580, 52, "基板の断面", "middle", 10.5, INK, True))
    o.append(RECT(x0, y0, 220, 26, 2, PAN, MUT, 1.2))
    o.append(RECT(x0 + 98, y0 - 1, 24, 28, 0, SCR, "none", 0))
    o.append(W(x0 + 98, y0, x0 + 98, y0 + 26, c=MUT, lw=1.2) + W(x0 + 122, y0, x0 + 122, y0 + 26, c=MUT, lw=1.2))
    o.append(RECT(x0 + 40, y0 - 7, 44, 7, 1, ALI, "none", 0) + RECT(x0 + 136, y0 - 7, 44, 7, 1, GRN, "none", 0))
    o.append(T(x0 + 62, y0 - 12, "一次側の導体", "middle", 9, ALI, True))
    o.append(T(x0 + 158, y0 - 12, "二次側の導体", "middle", 9, GRN, True))
    o.append(W(x0 + 84, y0 - 4, x0 + 136, y0 - 4, c=SIG, lw=2.0))
    o.append(T(x0 + 110, y0 - 44, "空間距離", "middle", 10, SIG, True))
    o.append(T(x0 + 110, y0 - 31, "（空気の中）", "middle", 9, SIG))
    o.append(W(x0 + 110, y0 - 27, x0 + 110, y0 - 7, c=SIG, lw=1.0))
    o.append(W(x0 + 84, y0 + 3, x0 + 96, y0 + 3, x0 + 96, y0 + 30, x0 + 124, y0 + 30, x0 + 124, y0 + 3, x0 + 136, y0 + 3, c=GLD, lw=2.0, dash="4 2"))
    o.append(T(x0 + 110, y0 + 48, "沿面距離（表面に沿って。", "middle", 10, GLD, True))
    o.append(T(x0 + 110, y0 + 62, "溝で延びる）", "middle", 10, GLD, True))
    o.append(T(580, 222, "必要な距離は、電圧・汚れやすさ・", "middle", 9.5, MUT))
    o.append(T(580, 237, "材料・標高・絶縁の種類から、", "middle", 9.5, MUT))
    o.append(T(580, 252, "規格の表で決まる", "middle", 9.5, MUT))
    return SVG(700, 290, o, "一次側と二次側の境界（基板を上から見た模式図と、断面）。境界をまたぐのは、変圧器・フォトカプラ・Y コンデンサと、基板の表面と空気である。人が触れる所は二次側に置く。必要な距離と絶縁の種類は規格で決まり、この章では数値を挙げない。")
F["e06_barrier"] = _f06_barrier()

# ---- 2 節: 絶縁トランスが切る道と切らない道 ----
def _f06_isopanel(o, x, y, title, iso, touch, earth_dev, verdict, good):
    """1 枚の小さな図。touch は触れる点の数（1 か 2）、earth_dev は大地につながった機器を A につなぐか。"""
    o.append(RECT(x, y, 336, 176, 8, PAN, LIN, 1.0))
    o.append(T(x + 10, y + 18, title, "start", 10.5, INK, True))
    yt, yb = y + 50, y + 112                 # 電圧側・接地側（または絶縁トランスの出力）の線
    o.append(_f06_src(x + 30, (yt + yb) / 2, 12, GLD))
    o.append(W(x + 30, yt, x + 30, (yt + yb) / 2 - 12, c=GLD, lw=1.4) + W(x + 30, (yt + yb) / 2 + 12, x + 30, yb, c=GLD, lw=1.4))
    o.append(W(x + 30, yb, x + 30, y + 140, c=MUT, lw=1.2, dash="3 2") + _f06_gnd(x + 30, y + 140))
    xs = x + 30
    if iso:
        o.append(W(xs, yt, x + 64, yt, c=GLD, lw=1.4) + W(xs, yb, x + 64, yb, c=GLD, lw=1.4))
        o.append(_f06_coil(x + 64, yt + 7, 4, 6, GLD, 1) + _f06_coil(x + 88, yt + 7, 4, 6, GRN, -1))
        o.append(W(x + 74, yt, x + 74, yb, c=MUT, lw=1.4) + W(x + 78, yt, x + 78, yb, c=MUT, lw=1.4))
        o.append(W(x + 64, yt, x + 64, yt + 7, c=GLD, lw=1.4) + W(x + 64, yb - 7, x + 64, yb, c=GLD, lw=1.4))
        o.append(W(x + 88, yt, x + 88, yt + 7, c=GRN, lw=1.4) + W(x + 88, yb - 7, x + 88, yb, c=GRN, lw=1.4))
        o.append(T(x + 76, yt - 8, "絶縁トランス", "middle", 9, GRN, True))
        xs = x + 88
    o.append(W(xs, yt, x + 200, yt, c=ALI, lw=1.6) + W(xs, yb, x + 200, yb, c=MUT, lw=1.6))
    o.append(RECT(x + 150, yt - 10, 60, yb - yt + 20, 6, ASOFT, ALI, 1.2))
    o.append(T(x + 180, (yt + yb) / 2 + 4, "回路", "middle", 10, ALI, True))
    o.append(D(x + 210, yt, ALI, 3.4) + T(x + 214, yt - 6, "A", "start", 9.5, ALI, True))
    o.append(D(x + 210, yb, MUT, 3.4) + T(x + 214, yb + 14, "B", "start", 9.5, MUT, True))
    px = x + 268
    o.append(_f06_person(px, y + 72, INK))
    o.append(W(px - 30, y + 164, px + 40, y + 164, c=MUT, lw=1.2) + T(px + 40, y + 160, "大地", "end", 8.5, MUT))
    c = GRN if good else ALI
    o.append(W(x + 210, yt, px - 12, y + 88, c=c, lw=1.6))
    if touch == 2:
        o.append(W(x + 210, yb, px - 12, y + 88, c=c, lw=1.6))
    if earth_dev:
        o.append(RECT(x + 110, y + 128, 44, 22, 4, MSOFT, MUT, 1.1) + T(x + 132, y + 143, "PC", "middle", 9, INK, True))
        o.append(W(x + 132, y + 128, x + 132, yb, c=ALI, lw=1.4) + D(x + 132, yb, ALI, 3))
        o.append(W(x + 110, y + 139, x + 98, y + 139, c=MUT, lw=1.2) + _f06_gnd(x + 98, y + 139 + 0))
    o.append(T(x + 10, y + 170, verdict, "start", 9.5, c, True))

def _f06_isotrans():
    o = []
    _f06_isopanel(o, 8, 8, "(a) 直接つないだ非絶縁の回路", False, 1, False, "1 点に触れる → 体 → 大地 → 接地側: 感電", False)
    _f06_isopanel(o, 356, 8, "(b) 絶縁トランスを通す・1 点", True, 1, False, "大地を通る導体の道は無い", True)
    _f06_isopanel(o, 8, 196, "(c) 絶縁トランスを通す・2 点", True, 2, False, "2 点に触れる → 体に 141 V（山）: 感電", False)
    _f06_isopanel(o, 356, 196, "(d) 絶縁トランス・PC を B につなぐ", True, 1, True, "B が大地と同じ電位 → (a) と同じ道", False)
    return SVG(700, 380, o, "絶縁トランスが切る道と切らない道（模式図）。絶縁トランスは、回路と大地の間の導体の道を 1 つ切るだけで、2 点に触れたときや、大地につながった機器を回路につないだときの感電は防がない。通電している回路に触れてよくする道具ではない。")
F["e06_isotrans"] = _f06_isotrans()

# ---- 3 節: 一定の電力で下がる電圧と、エネルギーの内訳 ----
def _f06_holdup():
    o = []
    C, V1, V2, P = _F06_C, 125.0, 70.0, 5.0
    th = C * (V1 ** 2 - V2 ** 2) / (2 * P)
    I0 = P / V1
    tci = C * (V1 - V2) / I0
    o.append(T(14, 18, "(a) 停電の後の平滑コンデンサの電圧と電流", "start", 10.5, INK, True))
    pv = Plot(70, 34, 380, 140, (0, 35), (60, 130))
    o.append(pv.axes(yl="電圧 [V]", xt=[0, 5, 10, 15, 20, 25, 30, 35], yt=[60, 70, 80, 100, 125], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
    o.append(pv.line([(t, V1 - I0 * t * 1e-3 / C) for t in (0, tci * 1e3)], c=MUT, lw=1.6, dash="6 4"))
    pts = [(k * th * 1e3 / 100, math.sqrt(max(V1 ** 2 - 2 * P * (k * th / 100) / C, 0))) for k in range(101)]
    o.append(pv.line(pts, c=GLD, lw=2.4))
    o.append(pv.line([(0, V2), (35, V2)], c=ALI, lw=1.2, dash="4 3"))
    o.append(T(pv.X(0.4), pv.Y(V2) - 5, "絶縁電源が保てる最低の電圧 70 V", "start", 9, ALI, halo=True))
    o.append(D(pv.X(th * 1e3), pv.Y(V2), GLD, 4) + T(pv.X(th * 1e3) - 4, pv.Y(V2) + 15, "一定の電力: %.1f ms" % (th * 1e3), "end", 9.5, GLD, True, halo=True))
    o.append(D(pv.X(tci * 1e3), pv.Y(V2), MUT, 4) + T(pv.X(tci * 1e3) + 2, pv.Y(V2) + 15, "電流が一定なら %.1f ms" % (tci * 1e3), "start", 9.5, MUT, True, halo=True))
    pi_ = Plot(70, 196, 380, 70, (0, 35), (0, 0.09))
    o.append(pi_.axes(xl="停電からの時間 [ms]（谷 125 V から、5 W）", yl="電流 [A]", xt=[0, 5, 10, 15, 20, 25, 30, 35], yt=[0, 0.04, 0.08], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(pi_.line([(t, P / v) for t, v in pts], c=GLD, lw=2.2))
    o.append(pi_.line([(0, I0), (tci * 1e3, I0)], c=MUT, lw=1.5, dash="6 4"))
    o.append(T(pi_.X(th * 1e3) - 4, pi_.Y(P / V2) - 6, "%.0f mA" % (P / V2 * 1e3), "end", 9.5, GLD, True, halo=True))
    o.append(T(pi_.X(1), pi_.Y(I0) - 6, "%.0f mA" % (I0 * 1e3), "start", 9.5, GLD, True, halo=True))
    # (b) エネルギー
    o.append(T(490, 18, "(b) エネルギーの内訳", "start", 10.5, INK, True))
    Et, Eu = 0.5 * C * V1 ** 2, 0.5 * C * V2 ** 2
    x, y, w, h = 500, 40, 60, 220
    hu = h * Eu / Et
    o.append(RECT(x, y, w, h - hu, 3, GOSOFT, GLD, 1.3))
    o.append(RECT(x, y + h - hu, w, hu, 3, ASOFT, ALI, 1.3))
    o.append(T(x + w + 10, y + 16, "使える %.0f mJ" % ((Et - Eu) * 1e3), "start", 10, GLD, True))
    o.append(T(x + w + 10, y + 31, "½C(V₁² − V₂²)", "start", 9.5, GLD))
    o.append(T(x + w + 10, y + 46, "（%.0f %%）" % ((Et - Eu) / Et * 100), "start", 9.5, GLD))
    o.append(T(x + w + 10, y + h - hu + 16, "使えない %.0f mJ" % (Eu * 1e3), "start", 10, ALI, True))
    o.append(T(x + w + 10, y + h - hu + 31, "½CV₂²（%.0f %%）" % (Eu / Et * 100), "start", 9.5, ALI))
    o.append(T(x + w + 10, y + h - hu + 46, "止まった後も残る", "start", 9.5, ALI))
    o.append(T(x + w / 2, y + h + 16, "合計 %.0f mJ" % (Et * 1e3), "middle", 9.5, INK, True))
    return SVG(700, 300, o, "一定の電力で平滑コンデンサのエネルギーを使うとき（22 µF、5 W、125 V から 70 V まで。例の値）。電圧が下がるほど電流が増えるので、電圧は終わりに近いほど速く下がり、電流が一定の場合より早く 70 V に届く。70 V より下のエネルギーは使えず、コンデンサに残る。")
F["e06_holdup"] = _f06_holdup()

# ---- 3 節: 停電の検出（AC 側と DC 側） ----
def _f06_detect():
    o = []
    o.append(T(14, 16, "(a) 2 つの検出の回路（模式図）", "start", 10.5, INK, True))
    xb = 404
    o.append(RECT(10, 26, xb - 10, 128, 6, ASOFT, "none", 0) + RECT(xb, 26, 690 - xb, 128, 6, GSOFT, "none", 0))
    o.append(W(xb, 22, xb, 158, c=GRN, lw=1.6, dash="5 3") + T(xb + 4, 150, "絶縁の境界", "start", 9, GRN, True))
    o.append(T(16, 40, "一次側", "start", 9, ALI, True) + T(682, 40, "二次側", "end", 9, GRN, True))
    y1, y2, h = 50, 104, 36
    o.append(BOX(20, y1, 84, h, "商用電源", None, GLD, PAN, INK, r=5, sz=10))
    o.append(BOX(130, y1, 84, h, "抵抗", None, MUT, PAN, INK, r=5, sz=10))
    o.append(BOX(240, y2, 88, h, "電圧検出器", None, MUT, PAN, INK, r=5, sz=10))
    o.append(BOX(20, y2, 84, h, "平滑", "コンデンサ", GLD, PAN, INK, r=5, sz=10, ssz=9))
    o.append(BOX(130, y2, 84, h, "分圧の抵抗", None, MUT, PAN, INK, r=5, sz=10))
    for yy, nm in ((y1, "フォトカプラ（LED 2 つ）"), (y2, "フォトカプラ")):
        o.append(RECT(xb - 60, yy, 120, h, 5, TSOFT, TEA, 1.4))
        o.append(T(xb, yy + 23, nm, "middle", 9.5, TEA, True, halo=True))
    o.append(ARR(104, y1 + h / 2, 128, y1 + h / 2, c=GLD, lw=1.4, head=5) + ARR(214, y1 + h / 2, xb - 62, y1 + h / 2, c=GLD, lw=1.4, head=5))
    o.append(ARR(104, y2 + h / 2, 128, y2 + h / 2, c=GLD, lw=1.4, head=5) + ARR(214, y2 + h / 2, 238, y2 + h / 2, c=GLD, lw=1.4, head=5) + ARR(328, y2 + h / 2, xb - 62, y2 + h / 2, c=GLD, lw=1.4, head=5))
    o.append(BOX(560, y1, 120, h * 2 + 18, "マイコン", None, SIG, SSOFT, SIG, r=6, sz=11))
    o.append(ARR(xb + 60, y1 + h / 2, 558, y1 + h / 2, c=TEA, lw=1.4, head=5) + T(510, y1 + h / 2 - 5, "交流の検出の信号", "middle", 9, TEA, True, halo=True))
    o.append(ARR(xb + 60, y2 + h / 2, 558, y2 + h / 2, c=TEA, lw=1.4, head=5) + T(510, y2 + h / 2 - 5, "DC 側の検出", "middle", 9, TEA, True, halo=True))
    # (b) 波形
    o.append(T(14, 182, "(b) 交流の検出の信号（100 V・50 Hz、V_on = 20 V）", "start", 10.5, INK, True))
    p = Plot(80, 196, 560, 110, (0, 50), (-150, 150))
    o.append(p.axes(yl="電圧 [V]", xt=[0, 10, 20, 30, 40, 50], yt=[-141, 0, 141], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
    o.append(RECT(p.X(0), p.Y(20), p.w, p.Y(-20) - p.Y(20), 0, MSOFT, "none", 0))
    tout = 27.0
    pts = [(k * 0.05, 141.4 * math.sin(2 * math.pi * 50 * k * 0.05e-3) if k * 0.05 < tout else 0.0) for k in range(0, 1001)]
    o.append(p.line(pts, c=GLD, lw=1.8))
    o.append(W(p.X(tout), p.y, p.X(tout), p.y + p.h + 60, c=ALI, lw=1.3, dash="4 3") + T(p.X(tout) + 4, p.y + 12, "停電", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(50) + 4, p.Y(20) + 3, "± V_on", "start", 9, MUT))
    yd = p.y + p.h + 26
    lv = []
    k = 0
    xs = []
    for t in [i * 0.05 for i in range(0, 1001)]:
        v = 141.4 * math.sin(2 * math.pi * 50 * t * 1e-3) if t < tout else 0.0
        lv.append(1 if abs(v) < 20 else 0)
    pts = []
    for i, b in enumerate(lv):
        x = p.X(i * 0.05); y = yd + (0 if b else 18)
        if pts and pts[-1][1] != y:
            pts.append((x, pts[-1][1]))
        pts.append((x, y))
    o.append(PL(pts, c=TEA, lw=1.8))
    o.append(T(p.x - 8, yd + 6, "H", "end", 9, TEA, True) + T(p.x - 8, yd + 22, "L", "end", 9, TEA, True))
    o.append(DIM(p.X(tout), yd - 8, p.X(tout + 3), yd - 8, None, c=ALI))
    o.append(T(p.X(tout + 3) + 6, yd - 4, "H が 3 ms 続く → 停電とみなす", "start", 9.5, ALI, True))
    for t in (0, 10, 20, 30, 40, 50):
        o.append(T(p.X(t), yd + 34, "%d" % t, "middle", 9, MUT))
    o.append(T(p.X(4.5), yd + 50, "ゼロクロスの前後の約 0.9 ms だけ H", "start", 9, TEA))
    o.append(T(p.X(50), yd + 50, "時間 [ms]", "end", 9, MUT))
    return SVG(700, yd + 58, o, "停電の検出。AC 側: 商用電源から抵抗を通してフォトカプラの LED に電流を流す。電圧の大きさが V_on より小さい間だけ、マイコンのピンは H になる。停電すると H のまま変わらないので、H が決めた時間より長く続いたら停電とみなす。DC 側: 平滑コンデンサの電圧を電圧検出器で見る。どちらも、フォトカプラで絶縁の境界をまたぐ。")
F["e06_detect"] = _f06_detect()

# ---- 3 節: 停電から電源が保てなくなるまで ----
def _f06_valley(Vrms, f):
    s, _, _ = _f06_sim(Vrms=Vrms, f=f, t_end=0.13, dt=5e-6, every=1)
    seg = [(t, v) for t, v, i, vac, h in s if 0.12 <= t < 0.12 + 1.0 / (2 * f)]
    return min(seg, key=lambda a: a[1])[0]

def _f06_outage():
    o = []
    tv = _f06_valley(90, 50)
    sc, detc, colc = _f06_sim(Vrms=90, f=50, P=5, Pcut=1.0, t_out=tv, t_end=tv + 0.088, dt=5e-6, every=20)
    sn, detn, coln = _f06_sim(Vrms=90, f=50, P=5, Pcut=None, t_out=tv, t_end=tv + 0.03, dt=5e-6, every=20)
    p = Plot(80, 30, 560, 170, (-25, 85), (60, 135))
    o.append(p.axes(yl="平滑コンデンサの電圧 [V]", xt=[-20, 0, 20, 40, 60, 80], yt=[70, 100, 109, 127], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 100), (85, 100)], c=TEA, lw=1.1, dash="4 3") + T(p.X(85) + 4, p.Y(100) + 4, "V_det", "start", 9, TEA, True))
    o.append(p.line([(-25, 70), (85, 70)], c=ALI, lw=1.1, dash="4 3") + T(p.X(85) + 4, p.Y(70) + 4, "V₂", "start", 9, ALI, True))
    o.append(p.line([((t - tv) * 1e3, v) for t, v, i, vac, h in sn if t >= tv - 0.025], c=ALI, lw=1.6, dash="6 3"))
    o.append(p.line([((t - tv) * 1e3, v) for t, v, i, vac, h in sc if t >= tv - 0.025], c=GLD, lw=2.4))
    o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=ALI, lw=1.2, dash="3 3"))
    o.append(T(p.X(0) + 4, p.y + 12, "停電", "start", 9.5, ALI, True, halo=True))
    td = (detc - tv) * 1e3
    o.append(W(p.X(td), p.y + 20, p.X(td), p.y + p.h, c=TEA, lw=1.2, dash="3 3"))
    o.append(T(p.X(td) + 4, p.y + 32, "AC 側で気づく（%.0f ms）: ファンと表示を切る" % td, "start", 9.5, TEA, True, halo=True))
    tn, tc = (coln - tv) * 1e3, (colc - tv) * 1e3
    o.append(D(p.X(tn), p.Y(70), ALI, 4) + T(p.X(tn) + 6, p.Y(70) + 16, "5 W のまま: %.0f ms で保てなくなる" % tn, "start", 9.5, ALI, True, halo=True))
    o.append(D(p.X(tc), p.Y(70), GLD, 4) + T(p.X(85), p.Y(70) + 16, "1 W に減らす: %.0f ms" % tc, "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(-24), p.Y(88), "ふだんは谷 109 V〜山 125 V", "start", 9, GLD, halo=True))
    o.append(T(p.X(-24), p.Y(88) + 13, "（90 V・50 Hz）", "start", 9, GLD, halo=True))
    # 下の帯: 商用電源とマイコンの状態
    yb = p.y + p.h + 14
    X = p.X
    def bar(y, segs, lab):
        o.append(T(p.x - 8, y + 12, lab, "end", 9, INK, True))
        for a, b, t, c in segs:
            o.append(RECT(X(a), y, X(b) - X(a), 16, 2, soft(c), c, 1.0))
            if t and X(b) - X(a) > tw(t, 9) + 6:
                o.append(T((X(a) + X(b)) / 2, y + 12, t, "middle", 9, c, True))
    bar(yb, [(-25, 0, "商用電源あり", GLD), (0, 85, "停電", ALI)], "商用電源")
    wr = td + 0.2 + 0.48
    bar(yb + 22, [(-25, td, "運転", SIG), (td, wr, "", ALI), (wr, tc, "待つ（電源が戻るか、無くなるか）", MUT), (tc, 85, "リセット", MUT)], "マイコン")
    o.append(T(X(td) + 2, yb + 52, "後始末 0.7 ms", "start", 9, ALI, True))
    for t in (-20, 0, 20, 40, 60, 80):
        o.append(T(X(t), yb + 66, "%d" % t, "middle", 9, MUT))
    o.append(T(X(85), yb + 80, "停電からの時間 [ms]", "end", 9.5, MUT))
    return SVG(700, yb + 88, o, "停電から電源が保てなくなるまで（90 V・50 Hz、平滑コンデンサが谷にあるときに停電。例の値を数値で解いた）。AC 側の検出は 3 ms で気づく。そのまま 5 W を使うと 16 ms で 70 V に届くが、気づいた時点で 1 W に減らすと、残りの時間は約 5 倍に延びる。後始末（8 語の書き込み）は 1 ms もかからない。")
F["e06_outage"] = _f06_outage()

# ---- 4 節: 停電の長さと起きること ----
def _f06_dips():
    o = []
    def row(y, title, t1, segs_list, ticks, tfmt):
        o.append(T(14, y + 2, title, "start", 10.5, INK, True))
        x0, w = 120, 560
        X = lambda t: x0 + t / t1 * w
        labs = ["商用電源", "マイコン", "ヒータ", "ファン"]
        for k, segs in enumerate(segs_list):
            yy = y + 10 + k * 20
            o.append(T(x0 - 8, yy + 12, labs[k], "end", 9, INK))
            o.append(RECT(x0, yy, w, 16, 2, SCR, LIN, 0.8))
            for a, b, t, c in segs:
                o.append(RECT(X(a), yy, max(X(b) - X(a), 1.2), 16, 2, soft(c), c, 1.0))
                if t and X(b) - X(a) > tw(t, 9) + 6:
                    o.append(T((X(a) + X(b)) / 2, yy + 12, t, "middle", 9, c, True))
        ya = y + 10 + len(segs_list) * 20
        for t in ticks:
            o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1) + T(X(t), ya + 15, tfmt(t), "middle", 9, MUT))
        return ya + 22
    ms = lambda t: "%g ms" % t
    y = 16
    y = row(y, "(a) 1 ms の停電", 40, [
        [(0, 10, "あり", GLD), (10, 11, "", ALI), (11, 40, "あり", GLD)],
        [(0, 40, "運転（気づかない）", SIG)],
        [(0, 10, "入", PUR), (11, 40, "入", PUR)],
        [(0, 40, "回る", TEA)]], [0, 10, 20, 30, 40], ms) + 8
    y = row(y, "(b) 40 ms の停電（リセットされない）", 200, [
        [(0, 10, "", GLD), (10, 50, "停電", ALI), (50, 200, "あり", GLD)],
        [(0, 13, "", SIG), (13, 14, "", ALI), (14, 50, "待つ", MUT), (50, 150, "落ち着くのを確かめる", TEA), (150, 200, "運転", SIG)],
        [(0, 10, "入", PUR), (150, 200, "戻す", PUR)],
        [(0, 13, "", TEA), (150, 200, "回る", TEA)]], [0, 50, 100, 150, 200], ms) + 8
    y = row(y, "(c) 2 s の停電（リセットされる）", 2500, [
        [(0, 10, "", GLD), (10, 2010, "停電", ALI), (2010, 2500, "あり", GLD)],
        [(0, 13, "", SIG), (13, 80, "", MUT), (80, 2010, "リセット（電源なし）", MUT), (2010, 2120, "", TEA), (2120, 2500, "利用者を待つ", GRN)],
        [(0, 10, "", PUR)],
        [(0, 13, "", TEA), (2120, 2420, "余熱を逃がす", TEA)]], [0, 500, 1000, 1500, 2000, 2500], lambda t: "%g s" % (t / 1000.0))
    return SVG(700, y + 4, o, "停電の長さで変わること（3 節の例の機器、90 V・50 Hz、気づいたら 1 W に減らす。例の決め方）。(a) 気づくより短ければ何も起きない。(b) 電源が保てているうちに戻れば、マイコンはリセットされず、落ち着くのを確かめてから戻す。(c) 長ければリセットされ、ヒータは利用者の操作を待つ。")
F["e06_dips"] = _f06_dips()

# ---- 4 節: 停電と復電の状態の移り方 ----
def _f06_restore():
    o = []
    w, h = 110, 44
    P = {"run": (70, 52), "save": (256, 52), "wait": (442, 52), "off": (628, 52),
         "user": (70, 196), "dec": (256, 196), "chk": (442, 196), "boot": (628, 196)}
    o.append(STATE(*P["run"], w, h, "運転", SIG))
    o.append(STATE(*P["save"], w, h, "後始末", ALI, "安全な状態・書く"))
    o.append(STATE(*P["wait"], w, h, "待つ", MUT, "小さな電流で"))
    o.append(STATE(*P["off"], 110, h, "電源なし", MUT, "リセットの中"))
    o.append(STATE(*P["user"], w, h, "利用者を待つ", GRN, "危険な負荷は切"))
    o.append(STATE(*P["dec"], w, h, "決める", PUR, "表で戻すものを"))
    o.append(STATE(*P["chk"], w, h, "確かめる", TEA, "交流と電圧"))
    o.append(STATE(*P["boot"], 110, h, "起動", SIG, "原因と記録を読む"))
    def e(a, b, lab, bend=0.0, loff=(0, 0), dx1=0, dy1=0, dx2=0, dy2=0, c=MUT):
        x1, y1 = P[a]; x2, y2 = P[b]
        o.append(EDGE(x1 + dx1, y1 + dy1, x2 + dx2, y2 + dy2, lab, bend, c=c, loff=loff))
    e("run", "save", "停電の検出", dx1=w / 2 + 2, dx2=-w / 2 - 4, loff=(0, -4), c=ALI)
    e("save", "wait", "書き終えた", dx1=w / 2 + 2, dx2=-w / 2 - 4, loff=(0, -4))
    e("wait", "off", "保てない", dx1=w / 2 + 2, dx2=-w / 2 - 4, loff=(0, -4))
    e("off", "boot", "復電（POR）", dy1=h / 2 + 2, dy2=-h / 2 - 4, loff=(40, 4))
    e("boot", "chk", "", dx1=-w / 2 - 2, dx2=w / 2 + 4)
    e("wait", "chk", "交流が戻った", dx1=-20, dy1=h / 2 + 2, dx2=-20, dy2=-h / 2 - 4, loff=(-46, 4))
    e("chk", "wait", "また途切れた", dx1=20, dy1=-h / 2 - 2, dx2=20, dy2=h / 2 + 4, loff=(52, 0))
    e("chk", "dec", "落ち着いた", dx1=-w / 2 - 2, dx2=w / 2 + 4, loff=(0, -4))
    e("dec", "user", "長い停電", dx1=-w / 2 - 2, dx2=w / 2 + 4, loff=(0, -4))
    e("dec", "run", "短い停電で\n戻してよい", dx1=-30, dy1=-h / 2 - 2, dx2=30, dy2=h / 2 + 4, loff=(-10, -6), c=SIG)
    e("user", "run", "運転のボタン", dy1=-h / 2 - 2, dy2=h / 2 + 4, loff=(-40, 0), c=GRN)
    return SVG(700, 236, o, "停電と復電の状態の移り方（例）。電源が保てているうちに戻れば「待つ」から「確かめる」へ、保てなければリセットされて「起動」から「確かめる」へ進む。どちらも、落ち着いたのを確かめてから、何を戻すかを決める。")
F["e06_restore"] = _f06_restore()

# ---- 5 節: 機器の入口 ----
def _f06_inlet():
    o = []
    yL, yN = 60, 150
    o.append(_f06_src(36, (yL + yN) / 2, 14, GLD))
    o.append(W(36, yL, 36, (yL + yN) / 2 - 14, c=GLD, lw=1.6) + W(36, (yL + yN) / 2 + 14, 36, yN, c=GLD, lw=1.6))
    o.append(T(36, yL - 10, "商用電源", "middle", 9.5, GLD, True))
    o.append(W(36, yL, 96, yL, c=INK, lw=1.6) + W(36, yN, 400, yN, c=INK, lw=1.6))
    # ヒューズ
    o.append(RECT(96, yL - 8, 48, 16, 3, PAN, INK, 1.4) + W(96, yL, 144, yL, c=INK, lw=1.0))
    o.append(W(144, yL, 400, yL, c=INK, lw=1.6))
    o.append(T(120, yL - 14, "ヒューズ", "middle", 10, INK, True))
    # バリスタ
    xv = 200
    o.append(W(xv, yL, xv, yL + 22, c=INK, lw=1.4) + RECT(xv - 9, yL + 22, 18, 46, 3, PAN, INK, 1.4) + W(xv - 12, yL + 62, xv + 12, yL + 28, c=INK, lw=1.2) + W(xv, yL + 68, xv, yN, c=INK, lw=1.4))
    o.append(T(xv + 16, yL + 46, "バリスタ", "start", 10, INK, True))
    # フィルタ・整流・電源
    o.append(BOX(286, yL - 18, 96, yN - yL + 36, "ラインフィルタ", "コンデンサとチョーク", MUT, PAN, INK, r=6, sz=10, ssz=9))
    o.append(W(382, yL, 420, yL, c=INK, lw=1.6) + W(382, yN, 420, yN, c=INK, lw=1.6))
    o.append(BOX(420, yL - 18, 96, yN - yL + 36, "整流・平滑", None, GLD, PAN, INK, r=6, sz=10))
    o.append(BOX(536, yL - 18, 150, yN - yL + 36, "絶縁電源", "スイッチングでノイズを出す", GLD, PAN, INK, r=6, sz=10.5, ssz=9))
    o.append(W(516, (yL + yN) / 2, 536, (yL + yN) / 2, c=INK, lw=1.6))
    # サージの道
    o.append(ARR(52, yL + 10, 94, yL + 10, c=ALI, lw=1.8, head=6) + ARR(150, yL + 10, xv - 6, yL + 10, c=ALI, lw=1.8, head=6))
    o.append(ARR(xv - 18, yL + 30, xv - 18, yN - 12, c=ALI, lw=1.8, head=6))
    o.append(ARR(xv - 22, yN - 8, 52, yN - 8, c=ALI, lw=1.8, head=6))
    o.append(T(120, yN - 14, "サージの電流は、バリスタを通って戻る", "middle", 9.5, ALI, True, halo=True))
    # ノイズの道
    o.append(ARR(534, yN + 26, 392, yN + 26, c=TEA, lw=1.6, head=6, dash="5 3") + W(380, yN + 20, 392, yN + 32, c=TEA, lw=2) + W(380, yN + 32, 392, yN + 20, c=TEA, lw=2))
    o.append(T(462, yN + 44, "絶縁電源のノイズは、フィルタで止める", "middle", 9.5, TEA, True))
    o.append(T(14, yN + 70, "ヒューズ: 故障で流れ続ける大きな電流を切る。バリスタ: ある電圧を超えると電流を流して電圧を抑える。", "start", 9.5, MUT))
    o.append(T(14, yN + 86, "バリスタが壊れて短絡したときも、ヒューズが切れるよう、ヒューズを商用電源の側に置く。", "start", 9.5, MUT))
    return SVG(700, yN + 96, o, "機器の入口の部品の並び（模式図）。商用電源の側から、ヒューズ・バリスタ・ラインフィルタの順に置くことが多い。サージの電流はバリスタを通って商用電源へ戻り、絶縁電源が出すノイズはフィルタで外へ出にくくする。")
F["e06_inlet"] = _f06_inlet()

# ---- 5 節: サージとバリスタ ----
_F06_V1MA, _F06_ALPHA, _F06_RSRC, _F06_VOC = 240.0, 30.0, 2.0, 2000.0

def _f06_vsurge(t):
    t1, t2 = 0.4074e-6, 68.22e-6
    return _F06_VOC * 1.037 * (math.exp(-t / t2) - math.exp(-t / t1))

def _f06_clamp(vs):
    """起電力 vs・内部抵抗 RSRC の源にバリスタをつないだときの電圧（二分法）。"""
    if vs <= 0:
        return vs
    lo, hi = 0.0, vs
    for _ in range(60):
        m = (lo + hi) / 2
        if m + _F06_RSRC * 1e-3 * (m / _F06_V1MA) ** _F06_ALPHA > vs:
            hi = m
        else:
            lo = m
    return lo

def _f06_surge():
    o = []
    o.append(T(14, 18, "(a) バリスタの電圧と電流（例）", "start", 10.5, INK, True))
    p = Plot(70, 34, 250, 190, (1e-9, 1e3), (0, 450), xlog=True)
    o.append(p.axes(xl="電流 [A]（対数目盛）", yl="電圧 [V]", xt=[1e-9, 1e-6, 1e-3, 1, 1e3], yt=[0, 141, 240, 378],
                    xfmt=lambda v: {1e-9: "1 n", 1e-6: "1 µ", 1e-3: "1 m", 1: "1", 1e3: "1 k"}[v], yfmt=lambda v: "%g" % v))
    pts = [(10 ** (k / 10.0), _F06_V1MA * (10 ** (k / 10.0) / 1e-3) ** (1 / _F06_ALPHA)) for k in range(-90, 31)]
    o.append(p.line([q for q in pts if q[1] <= 450], c=PUR, lw=2.2))
    Iop = 1e-3 * (141.4 / _F06_V1MA) ** _F06_ALPHA
    o.append(D(p.X(1e-3), p.Y(240), PUR, 3.6) + T(p.X(1e-3) + 6, p.Y(240) + 14, "1 mA で 240 V", "start", 9, PUR, True, halo=True))
    o.append(D(p.X(811), p.Y(378), ALI, 3.6) + T(p.X(811) - 6, p.Y(378) - 8, "811 A で 378 V", "end", 9, ALI, True, halo=True))
    o.append(T(p.X(1e-9) + 4, p.Y(141) + 14, "ふだんの山 141 V ではほとんど流れない", "start", 9, MUT, halo=True))
    o.append(T(370, 18, "(b) 入口の電圧（2 kV・2 Ω の源から）", "start", 10.5, INK, True))
    q = Plot(430, 34, 250, 190, (0, 100), (0, 2200))
    o.append(q.axes(xl="時間 [µs]", yl="電圧 [V]", xt=[0, 25, 50, 75, 100], yt=[0, 141, 378, 1000, 2000], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    ts = [k * 0.25 for k in range(0, 401)]
    o.append(q.line([(t, _f06_vsurge(t * 1e-6)) for t in ts], c=ALI, lw=1.8, dash="6 3"))
    o.append(q.line([(t, _f06_clamp(_f06_vsurge(t * 1e-6))) for t in ts], c=GLD, lw=2.4))
    o.append(q.line([(0, 141), (100, 141)], c=MUT, lw=1.0, dash="3 3"))
    o.append(T(q.X(14), q.Y(1700), "バリスタが無い（2 kV）", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(30), q.Y(560), "バリスタがある（約 380 V）", "start", 9.5, GLD, True, halo=True))
    return SVG(700, 262, o, "サージとバリスタ（模型の例の値。1.2/50 µs の形の 2 kV、内部抵抗 2 Ω、1 mA で 240 V のバリスタ）。バリスタは、ふだんの電圧ではほとんど電流を流さず、サージのときは数百 A を流して、入口の電圧をふだんの山の約 2.7 倍に抑える。")
F["e06_surge"] = _f06_surge()

# ---- 6 節: 交流の検出の信号の幅と中央 ----
def _f06_zcpulse():
    o = []
    p = Plot(90, 20, 520, 150, (-2.5, 2.5), (-120, 120))
    o.append(p.axes(yl="電圧 [V]", xt=[-2, -1, 0, 1, 2], yt=[-100, -26, 0, 26, 100], xfmt=lambda v: "", yfmt=lambda v: "%g" % v))
    for von, c in ((26, TEA), (14, PUR)):
        o.append(RECT(p.X(-2.5), p.Y(von), p.w, p.Y(-von) - p.Y(von), 0, soft(c), "none", 0, op=0.7))
    o.append(p.line([(k * 0.025 - 2.5, 141.4 * math.sin(2 * math.pi * 50 * (k * 0.025 - 2.5) * 1e-3)) for k in range(201)], c=GLD, lw=2.2))
    o.append(T(p.X(2.5) + 6, p.Y(26) + 4, "± 26 V", "start", 9, TEA, True))
    o.append(T(p.X(2.5) + 6, p.Y(14) + 8, "± 14 V", "start", 9, PUR, True))
    o.append(T(p.X(-2.4), p.Y(100), "100 V・50 Hz の電圧（ゼロクロスの前後）", "start", 9.5, GLD, True, halo=True))
    yd = p.y + p.h + 18
    for k, (von, c) in enumerate(((14, PUR), (26, TEA))):
        te = math.asin(von / 141.4) / (2 * math.pi * 50) * 1e3
        yy = yd + k * 34
        o.append(T(p.x - 8, yy + 13, "V_on = %d V" % von, "end", 9.5, c, True))
        o.append(PL([(p.X(-2.5), yy + 18), (p.X(-te), yy + 18), (p.X(-te), yy), (p.X(te), yy), (p.X(te), yy + 18), (p.X(2.5), yy + 18)], c=c, lw=1.8))
        o.append(T(p.X(-te) - 4, yy + 14, "始まり −%.2f ms" % te, "end", 9, c, halo=True))
        o.append(T(p.X(te) + 4, yy + 14, "幅 %.2f ms" % (2 * te), "start", 9, c, halo=True))
    o.append(W(p.X(0), p.y, p.X(0), yd + 56, c=GRN, lw=1.4, dash="3 3"))
    o.append(T(p.X(0), yd + 70, "中央 = ゼロクロス（V_on によらない）", "middle", 9.5, GRN, True))
    for t in (-2, -1, 0, 1, 2):
        o.append(T(p.X(t), yd + 86, "%g" % t, "middle", 9, MUT))
    o.append(T(p.X(2.5), yd + 100, "ゼロクロスからの時間 [ms]", "end", 9.5, MUT))
    return SVG(700, yd + 108, o, "交流の検出の信号の幅と中央。H になるのは、電圧の大きさが V_on より小さい間である。V_on が変わると、H の始まりと幅は動くが、中央はいつもゼロクロスにある。")
F["e06_zcpulse"] = _f06_zcpulse()

# ---- 6 節: 入れる瞬間と電流 ----
def _f06_capin(t_sw, f=50.0, Vrms=100.0, C=47e-6, R=5.0, Vd=1.8, t_end=0.025, dt=2e-6, every=10):
    Vp = math.sqrt(2) * Vrms
    v = 0.0
    out = []
    for k in range(int(t_end / dt)):
        t = k * dt
        vac = Vp * math.sin(2 * math.pi * f * t)
        i = 0.0
        if t >= t_sw:
            i = abs(vac) - Vd - v
            i = i / R if i > 0 else 0.0
            v += i / C * dt
        if k % every == 0:
            out.append((t * 1e3, i if vac >= 0 else -i, vac))
    return out

def _f06_zcswitch():
    o = []
    cells = [("抵抗の負荷（ヒータ 10 Ω）", 0), ("整流して平滑する負荷（47 µF・5 Ω）", 1)]
    cols = [("ゼロクロスで入れる", 10.0), ("電圧の山で入れる", 5.0)]
    for r, (rt, kind) in enumerate(cells):
        for cc, (ct, tsw) in enumerate(cols):
            x0 = 70 + cc * 340
            y0 = 40 + r * 150
            ymax = 16 if kind == 0 else 30
            p = Plot(x0, y0, 270, 100, (0, 25), (-ymax, ymax))
            o.append(p.axes(xt=[0, 5, 10, 15, 20, 25], yt=[-ymax, 0, ymax], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9))
            if r == 0:
                o.append(T(x0 + 135, 20, ct, "middle", 10.5, INK, True))
            if cc == 0:
                o.append(T(14, y0 - 6, rt, "start", 10, PUR, True))
                o.append(T(x0 - 34, y0 + 50, "電流 [A]", "middle", 9, MUT, rot=-90))
            pts_v = [(k * 0.05, ymax * 0.9 * math.sin(2 * math.pi * 50 * k * 0.05e-3)) for k in range(501)]
            o.append(p.line(pts_v, c=MUT, lw=1.0, dash="3 3"))
            if kind == 0:
                pts = [(k * 0.02, (141.4 * math.sin(2 * math.pi * 50 * k * 0.02e-3) / 10.0) if k * 0.02 >= tsw else 0.0) for k in range(1251)]
                pk = 14.1
            else:
                s = _f06_capin(tsw * 1e-3)
                pts = [(t, i) for t, i, vac in s]
                pk = max(abs(i) for t, i, vac in s)
            o.append(p.line(pts, c=PUR, lw=2.0))
            o.append(W(p.X(tsw), p.y, p.X(tsw), p.y + p.h, c=ALI if tsw == 5.0 else GRN, lw=1.2, dash="4 3"))
            good = (kind == 0 and tsw == 10.0) or (kind == 1 and tsw == 10.0)
            msg = ("なめらかに増える" if tsw == 10.0 else "0 → 14.1 A に跳ぶ") if kind == 0 else ("山 %.1f A" % pk)
            o.append(T(p.X(tsw) + 4, p.y + 12, msg, "start", 9.5, GRN if good else ALI, True, halo=True))
    o.append(T(70, 330, "破線は電圧の形（大きさは目盛と無関係）。縦の破線が入れた瞬間。時間 [ms]。", "start", 9.5, MUT))
    return SVG(700, 340, o, "入れる瞬間と電流（100 V・50 Hz、例の値を数値で解いた）。抵抗の負荷は、山で入れると電流が一瞬で跳び、ノイズと接点の火花のもとになる。整流して平滑する負荷は、山で入れると空のコンデンサに大きな電流が流れ込む。ゼロクロスで入れると、どちらも電流は 0 からなめらかに増える。")
F["e06_zcswitch"] = _f06_zcswitch()

# ---- 6 節: 位相制御 ----
def _f06_phase():
    o = []
    o.append(T(14, 18, "(a) 負荷に加わる電圧（50 Hz の 1 周期）", "start", 10.5, INK, True))
    for k, a in enumerate((45, 90, 135)):
        x0 = 30 + k * 150
        p = Plot(x0, 40, 130, 90, (0, 20), (-150, 150))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1.0))
        o.append(p.line([(j * 0.1, 141.4 * math.sin(2 * math.pi * 50 * j * 0.1e-3)) for j in range(201)], c=MUT, lw=1.0, dash="3 3"))
        ta = a / 180.0 * 10
        for st in (ta, 10 + ta):
            seg = [(st, 0.0)] + [(st + (j / 40.0) * (10 - ta), 141.4 * math.sin(2 * math.pi * 50 * (st + (j / 40.0) * (10 - ta)) * 1e-3)) for j in range(41)] + [(st + 10 - ta, 0.0)]
            o.append(PL([(p.X(u), p.Y(v)) for u, v in seg], c=PUR, lw=1.6, fill=PSOFT))
            o.append(W(p.X(st), p.y + p.h + 2, p.X(st), p.y + p.h + 10, c=TEA, lw=2))
        o.append(T(x0 + 65, 152, "α = %d°（%.1f ms）" % (a, ta), "middle", 9.5, PUR, True))
        o.append(T(x0 + 65, 166, "電力 %.0f %%" % (100 * (1 - math.radians(a) / math.pi + math.sin(2 * math.radians(a)) / (2 * math.pi))), "middle", 9.5, INK))
    o.append(T(14, 186, "縦の短い線: トライアックを入れる時刻（ゼロクロスから遅らせる）", "start", 9, TEA))
    o.append(T(480, 18, "(b) 電力の割合", "start", 10.5, INK, True))
    q = Plot(500, 40, 180, 120, (0, 180), (0, 1))
    o.append(q.axes(xl="α [°]", xt=[0, 45, 90, 135, 180], yt=[0, 0.5, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g %%" % (v * 100), sz=9))
    o.append(q.line([(d, 1 - math.radians(d) / math.pi + math.sin(2 * math.radians(d)) / (2 * math.pi)) for d in range(0, 181, 3)], c=PUR, lw=2.2))
    for d in (45, 90, 135):
        r = 1 - math.radians(d) / math.pi + math.sin(2 * math.radians(d)) / (2 * math.pi)
        o.append(D(q.X(d), q.Y(r), PUR, 3.4))
    return SVG(700, 200, o, "位相制御。各半周期で、ゼロクロスから α だけ遅らせてトライアックを入れると、半周期の残り（塗った部分）だけ負荷に電圧が加わる。抵抗の負荷の電力は 1 − α/π + sin 2α/(2π) の割合になり、α = 90° で半分になる。")
F["e06_phase"] = _f06_phase()

# ---- 7 節: 待機電力の内訳 ----
_F06_SB_ITEMS = [("電源自身の損失", GLD), ("交流の検出", TEA), ("表示", PUR), ("マイコン", SIG), ("通信", GRN)]
_F06_SB = [("対策の前", [60, 106, 300, 47, 80]), ("対策の後", [30, 53, 0, 0.1, 15])]

def _f06_standby():
    o = []
    x0, wmax, vmax = 110, 470, 600.0
    for k, (nm, vals) in enumerate(_F06_SB):
        y = 26 + k * 56
        o.append(T(x0 - 10, y + 17, nm, "end", 10.5, INK, True))
        x = x0
        for (lab, c), v in zip(_F06_SB_ITEMS, vals):
            w = wmax * v / vmax
            if w > 0.3:
                o.append(RECT(x, y, w, 24, 2, soft(c), c, 1.1))
                if w > tw("%g" % v, 9) + 8:
                    o.append(T(x + w / 2, y + 16, "%g" % v, "middle", 9, c, True))
            x += w
        tot = sum(vals)
        o.append(T(x + 8, y + 12, "%.0f mW" % tot, "start", 10, INK, True))
        o.append(T(x + 8, y + 26, "1 年に %.2f kWh" % (tot * 8.76e-3), "start", 9.5, MUT))
    o.append(LEGEND(x0, 150, [(c, lab) for lab, c in _F06_SB_ITEMS], sz=9.5, gap=14))
    o.append(T(x0, 172, "数字は mW（例の値）。対策: 表示を消す、マイコンを眠らせる、通信を間欠に、交流の検出の抵抗を 2 倍、", "start", 9.5, MUT))
    o.append(T(x0, 188, "電源を待機の機能を持つものにする。", "start", 9.5, MUT))
    return SVG(700, 198, o, "例の機器の待機電力の内訳（例の値）。対策の後に残るのは、ほとんどが電源自身の損失と交流の検出の回路で、マイコンの眠りの電流（0.1 mW）は 1 % にも満たない。")
F["e06_standby"] = _f06_standby()
