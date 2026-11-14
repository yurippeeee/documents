# -*- coding: utf-8 -*-
# 02 章 動きを式にする の図
import numpy as _f02_np
from scipy.integrate import solve_ivp as _f02_ivp


# ---- 補助: 数値で解く（細かい許容誤差の solve_ivp） ----
def _f02_sim(f, x0, tend, n=2001, max_step=None):
    t = _f02_np.linspace(0.0, tend, n)
    kw = {"max_step": max_step} if max_step else {}
    r = _f02_ivp(f, (0.0, tend), list(x0), t_eval=t, rtol=1e-10, atol=1e-12, method="DOP853", **kw)
    return r.t, r.y


# ---- 補助: 文字の幅（結合文字の点は幅 0、ギリシャ文字などは半角程度とみなす） ----
def _f02_tw(s, sz):
    w = 0.0
    for ch in str(s):
        o = ord(ch)
        if 0x300 <= o <= 0x36F:
            continue
        if o < 128:
            w += sz * 0.56
        elif 0x370 <= o <= 0x3FF or 0x1E00 <= o <= 0x1EFF or o in (0xB7, 0xB0):
            w += sz * 0.6
        elif o in (0xB2, 0xB3, 0xB9) or 0x2070 <= o <= 0x209F:
            w += sz * 0.4
        elif o in (0x2212,):
            w += sz * 0.6
        else:
            w += sz * 1.0
    return w


# ---- 補助: 式の文字（部分ごとに色・斜体・添字）。parts = [(文字, 添字, 斜体か[, 色]), ...] ----
def _f02_m(x, y, parts, a="start", sz=12, c=INK, b=False, halo=True):
    w = 0.0
    for p in parts:
        w += _f02_tw(p[0], sz) + (_f02_tw(p[1], sz * 0.72) if p[1] else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    hl = (' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' % SCR) if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), y, sz, c, "700" if b else "400", hl)]
    pend = 0
    for p in parts:
        s, sub, it = p[0], p[1], p[2]
        col = (' fill="%s"' % p[3]) if len(p) > 3 and p[3] else ""
        o.append('<tspan font-style="%s"%s%s>%s</tspan>' % ("italic" if it else "normal", col, (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g"%s>%s</tspan>' % (sz * 0.72, col, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)


def _f02_v(s, sub=None, c=None):
    """斜体の記号 1 つ（_f02_m の部品）。"""
    return (s, sub, True, c)


def _f02_t(s, c=None):
    """立体の文字（_f02_m の部品）。"""
    return (s, None, False, c)


# ---- 補助: 範囲で切った折れ線（範囲の外に出る所で線を切る） ----
def _f02_pl(p, pts, c=SIG, lw=2.0, dash=None):
    lo, hi = min(p.yr), max(p.yr)
    xl, xh = min(p.xr), max(p.xr)
    segs, cur = [], []
    prev = None
    for a, b in pts:
        if a < xl - 1e-12 or a > xh + 1e-12:
            prev = None
            if cur:
                segs.append(cur); cur = []
            continue
        inside = lo <= b <= hi
        if prev is not None:
            pa, pb = prev
            pin = lo <= pb <= hi
            if inside and not pin:
                lim = hi if pb > hi else lo
                fr = (lim - pb) / (b - pb)
                cur = [(pa + (a - pa) * fr, lim)]
            elif pin and not inside:
                lim = hi if b > hi else lo
                fr = (lim - pb) / (b - pb)
                cur.append((pa + (a - pa) * fr, lim))
                segs.append(cur); cur = []
        elif inside:
            cur = []
        if inside:
            cur.append((a, b))
        prev = (a, b)
    if cur:
        segs.append(cur)
    return "".join(PL([(p.X(a), p.Y(b)) for a, b in s], c=c, lw=lw, dash=dash) for s in segs if len(s) >= 2)


def _f02_seg(p, t, v, slope, L=12.0, c=FNT, lw=1.3):
    """点 (t, v) を中心に、傾き slope の短い線（画面で長さ L）。"""
    dx = p.X(t + 1.0) - p.X(t)
    dy = p.Y(v + slope) - p.Y(v)
    n = math.hypot(dx, dy) or 1.0
    ux, uy = dx / n * L / 2, dy / n * L / 2
    x, y = p.X(t), p.Y(v)
    return W(x - ux, y - uy, x + ux, y + uy, c=c, lw=lw)


# ---- 補助: 部品の絵 ----
def _f02_spring(x1, x2, y, n=7, amp=7, c=MUT, lw=1.5):
    """横向きのばね（ジグザグ）。両端に短い直線を付ける。"""
    lead = min(10, (x2 - x1) * 0.15)
    xs, xe = x1 + lead, x2 - lead
    pts = [(x1, y), (xs, y)]
    for i in range(2 * n):
        pts.append((xs + (xe - xs) * (i + 0.5) / (2 * n), y + (amp if i % 2 == 0 else -amp)))
    pts += [(xe, y), (x2, y)]
    return PL(pts, c=c, lw=lw)


def _f02_damper(x1, x2, y, c=MUT, lw=1.5):
    """横向きのダンパ（筒とピストン）。"""
    xm = (x1 + x2) / 2
    o = [W(x1, y, xm - 6, y, c=c, lw=lw),
         W(xm - 14, y - 8, xm + 14, y - 8, c=c, lw=lw), W(xm - 14, y + 8, xm + 14, y + 8, c=c, lw=lw),
         W(xm + 14, y - 8, xm + 14, y + 8, c=c, lw=lw),
         W(xm - 6, y - 6, xm - 6, y + 6, c=c, lw=lw + 0.6), W(xm - 6, y, x2, y, c=c, lw=lw)]
    return "".join(o)


def _f02_wall(x, y0, y1, c=MUT):
    o = [W(x, y0, x, y1, c=c, lw=1.8)]
    yy = y0 + 4
    while yy < y1:
        o.append(W(x, yy, x - 7, yy + 7, c=c, lw=1))
        yy += 9
    return "".join(o)


def _f02_ground(x0, x1, y, c=MUT):
    o = [W(x0, y, x1, y, c=c, lw=1.6)]
    xx = x0 + 4
    while xx < x1:
        o.append(W(xx, y, xx - 7, y + 7, c=c, lw=1))
        xx += 10
    return "".join(o)


def _f02_cart(x, y, w, h, c=SIG, fill=None, dash=None, label=None, sz=11):
    """台車（箱と 2 つの車輪）。(x, y) は箱の左上。車輪の下端は y + h + 8。"""
    o = [RECT(x, y, w, h, 4, fill or soft(c), c, 1.5, dash)]
    for xx in (x + w * 0.25, x + w * 0.75):
        o.append(CIRC(xx, y + h + 4, 4, c=c, lw=1.4, fill=SCR, dash=dash))
    if label:
        o.append(T(x + w / 2, y + h / 2 + sz * 0.38, label, "middle", sz, c, True))
    return "".join(o)


def _f02_resistor(x1, x2, y, c=INK, lw=1.4, n=6, amp=5):
    return _f02_spring(x1, x2, y, n=n, amp=amp, c=c, lw=lw)


def _f02_coil(x1, x2, y, c=INK, lw=1.4, n=4):
    lead = (x2 - x1) * 0.12
    xs, xe = x1 + lead, x2 - lead
    r = (xe - xs) / (2 * n)
    d = "M%g,%g L%g,%g" % (x1, y, xs, y)
    for i in range(n):
        d += " A%g,%g 0 0 1 %g,%g" % (r, r, xs + (2 * i + 2) * r, y)
    d += " L%g,%g" % (x2, y)
    return PATH(d, c=c, lw=lw)


def _f02_source(x, y, r, c=GLD, label=None, sz=11):
    """電圧源（丸の中に + と −。上が +）。"""
    o = [CIRC(x, y, r, c=c, lw=1.6, fill=SCR),
         T(x, y - r * 0.25, "+", "middle", 10, c, True), T(x, y + r * 0.7, "−", "middle", 10, c, True)]
    if label:
        o.append(T(x - r - 6, y + 4, label, "end", sz, c, True))
    return "".join(o)


# =====================================================================
# 1 節: 5 つの対象とモデル
# =====================================================================
def _f02_icon_cart(cx, cy):
    o = [_f02_wall(cx - 52, cy - 22, cy + 18), _f02_spring(cx - 52, cx - 14, cy - 6, n=5, amp=5, c=MUT, lw=1.3),
         _f02_cart(cx - 14, cy - 18, 34, 22, SIG), _f02_ground(cx - 56, cx + 54, cy + 14),
         ARR(cx + 22, cy - 7, cx + 46, cy - 7, c=GLD, lw=1.8, head=6)]
    return "".join(o)


def _f02_icon_rc(cx, cy):
    x0, x1, yt, yb = cx - 40, cx + 32, cy - 22, cy + 18
    o = [W(x0, cy - 9, x0, yt, x0 + 12, yt, c=INK, lw=1.3), _f02_resistor(x0 + 12, x0 + 44, yt, n=4, amp=4),
         W(x0 + 44, yt, x1, yt, x1, cy - 6, c=INK, lw=1.3),
         W(x1 - 9, cy - 6, x1 + 9, cy - 6, c=SIG, lw=2.2), W(x1 - 9, cy + 1, x1 + 9, cy + 1, c=SIG, lw=2.2),
         W(x1, cy + 1, x1, yb, x0, yb, x0, cy + 9, c=INK, lw=1.3), _f02_source(x0, cy, 9, GLD)]
    return "".join(o)


def _f02_icon_motor(cx, cy):
    o = [W(cx - 50, cy - 10, cx - 36, cy - 10, c=GLD, lw=1.6), W(cx - 50, cy + 6, cx - 36, cy + 6, c=GLD, lw=1.6),
         RECT(cx - 36, cy - 18, 34, 32, 5, soft(SIG), SIG, 1.4), T(cx - 19, cy + 3, "M", "middle", 11, SIG, True),
         W(cx - 2, cy - 2, cx + 18, cy - 2, c=INK, lw=2.2), RECT(cx + 18, cy - 20, 9, 36, 2, MSOFT, MUT, 1.3),
         PATH("M%g,%g A16,16 0 0 1 %g,%g" % (cx + 36, cy - 14, cx + 36, cy + 10), c=SIG, lw=1.5),
         _head(cx + 40, cy + 2, cx + 36, cy + 10, SIG, 5)]
    return "".join(o)


def _f02_icon_plate(cx, cy):
    o = [RECT(cx - 46, cy - 2, 92, 10, 2, MSOFT, MUT, 1.3), RECT(cx - 38, cy + 8, 76, 5, 1, soft(GLD), GLD, 1.1)]
    for xx in (cx - 26, cx, cx + 26):
        o.append(PATH("M%g,%g c-4,-5 4,-9 0,-14 c-4,-5 4,-9 0,-12" % (xx, cy - 5), c=MUT, lw=1.2))
    o.append(RECT(cx + 30, cy - 9, 12, 7, 2, soft(SIG), SIG, 1.1))
    return "".join(o)


def _f02_icon_tank(cx, cy):
    x0, x1, yt, yb = cx - 26, cx + 22, cy - 22, cy + 18
    o = [RECT(x0, cy - 4, x1 - x0, yb - cy + 4, 0, soft(SIG), "none", 0),
         W(x0, yt, x0, yb, x1, yb, x1, yt, c=INK, lw=1.5),
         W(cx - 46, yt - 4, cx - 14, yt - 4, cx - 14, yt + 4, c=GLD, lw=2),
         _head(cx - 14, yt - 2, cx - 14, yt + 8, GLD, 6),
         PATH("M%g,%g q10,0 14,14" % (x1, yb - 3), c=TEA, lw=1.6),
         W(x0 - 6, cy - 4, x0 - 6, yb, c=SIG, lw=1.2)]
    return "".join(o)


def _f02_model_fig():
    o = []
    # 上: 箱としてのモデル
    bx, by, bw, bh = 280, 44, 150, 54
    o.append(BOX(bx, by, bw, bh, "モデル", "出力を計算する式", SIG, SSOFT, sz=12, ssz=10))
    o.append(ARR(150, by + bh / 2, bx, by + bh / 2, c=GLD, lw=2))
    o.append(_f02_m(150, by + bh / 2 - 8, [_f02_t("入力 "), _f02_v("u"), _f02_t("（操作量）")], "start", 11, GLD, True))
    o.append(ARR(bx + bw / 2, 12, bx + bw / 2, by, c=PUR, lw=1.8))
    o.append(_f02_m(bx + bw / 2 + 8, 24, [_f02_t("外乱 "), _f02_v("d")], "start", 11, PUR, True))
    o.append(ARR(bx + bw, by + bh / 2, bx + bw + 130, by + bh / 2, c=SIG, lw=2))
    o.append(_f02_m(bx + bw + 8, by + bh / 2 - 8, [_f02_t("出力 "), _f02_v("y"), _f02_t("（制御量）")], "start", 11, SIG, True))
    o.append(T(bx + bw / 2, by + bh + 18, "今の出力と入力から、出力の変わる速さを決める式", "middle", 10, MUT))
    # 下: 5 つの対象
    cols = [
        ("台車（2 節）", _f02_icon_cart, [("入力", GLD, [_f02_t("押す力 "), _f02_v("u")]), ("外乱", PUR, [_f02_t("風・坂 "), _f02_v("d")]),
                                         ("出力", SIG, [_f02_t("位置 "), _f02_v("p")]), ("釣り合い", MUT, [_f02_t("力")])]),
        ("RC 回路（3 節）", _f02_icon_rc, [("入力", GLD, [_f02_t("電圧 "), _f02_v("v")]), ("外乱", PUR, [_f02_t("—")]),
                                         ("出力", SIG, [_f02_t("電圧 "), _f02_v("v", "c")]), ("釣り合い", MUT, [_f02_t("電圧")])]),
        ("DC モータ（3 節）", _f02_icon_motor, [("入力", GLD, [_f02_t("電圧 "), _f02_v("v")]), ("外乱", PUR, [_f02_t("負荷 "), ("τ", "L", True)]),
                                            ("出力", SIG, [_f02_t("角速度 "), ("ω", "m", True)]), ("釣り合い", MUT, [_f02_t("電圧・トルク")])]),
        ("温度の板（4 節）", _f02_icon_plate, [("入力", GLD, [_f02_t("ヒータ "), _f02_v("q")]), ("外乱", PUR, [_f02_t("周りの温度 "), ("θ", "a", True)]),
                                           ("出力", SIG, [_f02_t("温度 "), ("θ", None, True)]), ("釣り合い", MUT, [_f02_t("熱")])]),
        ("水槽（4 節）", _f02_icon_tank, [("入力", GLD, [_f02_t("流入 "), _f02_v("u")]), ("外乱", PUR, [_f02_t("—")]),
                                        ("出力", SIG, [_f02_t("水位 "), _f02_v("h")]), ("釣り合い", MUT, [_f02_t("水の量")])]),
    ]
    y0 = 136
    o.append(W(14, y0 - 8, 686, y0 - 8, c=LIN, lw=1))
    for i, (nm, icon, rows) in enumerate(cols):
        cx = 14 + 134.4 * i + 67.2
        o.append(icon(cx, y0 + 40))
        o.append(T(cx, y0 + 88, nm, "middle", 11, INK, True))
        for k, (lab, c, parts) in enumerate(rows):
            yy = y0 + 108 + k * 17
            o.append(T(cx - 56, yy, lab, "start", 9.5, c, True))
            o.append(_f02_m(cx - 56 + _f02_tw(lab, 9.5) + 6, yy, [(p[0], p[1], p[2], INK if c != MUT else MUT) for p in parts], "start", 10, INK))
    return SVG(700, y0 + 108 + 4 * 17 - 4, o, "制御対象のモデル。どの対象も、入力（操作量）と外乱を受けて出力（制御量）を返す箱として表せる。箱の中身は、今の出力と入力から、出力の変わる速さを決める式である。下は、この章で式を作る 5 つの対象と、それぞれ何の釣り合いから式を作るか。")
F["e02_model"] = _f02_model_fig()


# =====================================================================
# 1 節: 傾きの場（ばねの無い台車の速度）
# =====================================================================
def _f02_slope_fig():
    o = []
    m, c, u = 1.0, 2.0, 1.0
    p = Plot(62, 24, 400, 200, (0, 2.0), (0, 1.0))
    o.append(p.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 0.25, 0.5, 0.75, 1.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    for t in _f02_np.arange(0.1, 2.0, 0.15):
        for v in _f02_np.arange(0.05, 1.0, 0.1):
            o.append(_f02_seg(p, t, v, (u - c * v) / m, L=13, c=MUT, lw=1.1))
    o.append(p.line([(0, 0.5), (2.0, 0.5)], c=GRN, lw=1.3, dash="5 3"))
    for v0, lab in ((0.0, "初期値 0"), (0.25, "0.25 m/s"), (0.9, "0.9 m/s")):
        pts = [(t, u / c + (v0 - u / c) * math.exp(-c * t / m)) for t in _f02_np.linspace(0, 2.0, 201)]
        o.append(_f02_pl(p, pts, c=SIG, lw=2.2))
        o.append(D(p.X(0), p.Y(v0), SIG, 3.6))
    o.append(T(p.X(0.04), p.Y(0.9) - 8, "初期値 0.9 m/s", "start", 9.5, SIG, True, halo=True))
    o.append(_f02_m(p.X(1.98), p.Y(0.5) - 14, [_f02_t("0.5 m/s で傾き 0（"), _f02_v("u"), _f02_t(" = "), _f02_v("c"), ("ṗ", None, True), _f02_t("）")], "end", 9.5, GRN, True))
    o.append(T(p.X(1.98), p.Y(0.87), "速いと減る", "end", 9.5, MUT, halo=True))
    o.append(T(p.X(1.98), p.Y(0.13), "遅いと増える", "end", 9.5, MUT, halo=True))
    # 1 点の計算
    tq = -math.log(1 - 0.2 / 0.5) / 2.0
    o.append(_f02_seg(p, tq, 0.2, 0.6, L=64, c=GLD, lw=2))
    o.append(D(p.X(tq), p.Y(0.2), GLD, 4))
    o.append(T(p.X(tq) + 16, p.Y(0.2) + 16, "傾き 0.6 m/s²", "start", 9.5, GLD, True, halo=True))
    # 右: 計算の規則
    x0 = 490
    o.append(T(x0, 40, "各点の傾きは式が決める", "start", 11, INK, True))
    o.append(_f02_m(x0, 64, [_f02_t("速度の変わる速さ")], "start", 10, MUT))
    o.append(_f02_m(x0, 84, [("p̈", None, True), _f02_t(" = ("), _f02_v("u"), _f02_t(" − "), _f02_v("c"), ("ṗ", None, True), _f02_t(") ÷ "), _f02_v("m")], "start", 12, INK))
    o.append(_f02_m(x0, 112, [_f02_t("例: "), _f02_v("u"), _f02_t(" = 1 N、"), ("ṗ", None, True), _f02_t(" = 0.2 m/s のとき")], "start", 10, GLD))
    o.append(_f02_m(x0, 132, [("p̈", None, True), _f02_t(" = (1 − 2 × 0.2) ÷ 1")], "start", 11, INK))
    o.append(_f02_m(x0, 152, [_f02_t("　= 0.6 m/s²")], "start", 11, GLD, True))
    o.append(T(x0, 182, "解は傾きに沿ってたどった曲線。", "start", 10, MUT))
    o.append(T(x0, 198, "初期値を決めると 1 本に決まる。", "start", 10, MUT))
    o.append(T(x0, 214, "●: 初期値（0・0.25・0.9 m/s）", "start", 9.5, SIG))
    o.append(T(x0, 232, "（m = 1 kg、c = 2 N·s/m、u = 1 N）", "start", 9.5, MUT))
    return SVG(700, 270, o, "ばねの無い台車を 1 N で押したときの、速度の傾きの場。短い線は、その点（時刻と速度）で式が決める速度の傾き。解の曲線（青）は傾きに沿って進み、どの初期値からも、押す力と押し返す力が釣り合う 0.5 m/s に近づく。")
F["e02_slope"] = _f02_slope_fig()


# =====================================================================
# 1 節: 線形と時不変
# =====================================================================
def _f02_lti_fig():
    o = []
    m, c, c2 = 1.0, 2.0, 4.0
    tt = _f02_np.linspace(0, 3, 301)

    def lin(uf):
        t, y = _f02_sim(lambda t, x: [(uf(t) - c * x[0]) / m], [0.0], 3.0, n=301, max_step=0.01)
        return list(zip(t, y[0]))

    def drag(U):
        t, y = _f02_sim(lambda t, x: [(U - c2 * x[0] * abs(x[0])) / m], [0.0], 3.0, n=301, max_step=0.01)
        return list(zip(t, y[0]))

    def panel(x, y, title, us, curves, yr=(0, 1.2), ur=(0, 3), yt=(0, 0.5, 1.0)):
        o.append(T(x - 48, y + 12, title, "start", 11, INK, True))
        q = Plot(x, y + 22, 268, 30, (0, 3), ur)
        o.append(RECT(q.x, q.y, q.w, q.h, 2, SCR, LIN, 0.8))
        o.append(T(q.x - 6, q.y + q.h / 2 + 4, "u [N]", "end", 9.5, GLD))
        for pts, lw, dash in us:
            o.append(q.steps(pts, c=GLD, lw=lw) if dash is None else PL([(q.X(a), q.Y(b)) for a, b in pts], c=GLD, lw=lw, dash=dash))
        pp = Plot(x, y + 64, 268, 100, (0, 3), yr)
        o.append(pp.axes(xl=None, yl=None, xt=[0, 1, 2, 3], yt=list(yt), xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(T(pp.x - 30, pp.y + pp.h / 2 + 4, "m/s", "middle", 9.5, MUT))
        o.append(T(pp.x + pp.w, pp.y + pp.h + 28, "時間 t [s]", "end", 9.5, MUT))
        for pts, col, lw, dash in curves:
            o.append(_f02_pl(pp, pts, c=col, lw=lw, dash=dash))
        return q, pp

    step = lambda a, t0=0.0: (lambda t: a if t >= t0 else 0.0)
    # (a) 2 倍
    y1 = lin(step(1.0)); y2 = lin(step(2.0))
    q, pp = panel(62, 0, "(a) 入力を 2 倍にする", [([(0, 1), (3, 1)], 1.4, None), ([(0, 2), (3, 2)], 2.4, None)],
                  [(y1, SIG, 1.4, None), (y2, SIG, 2.6, None), ([(t, 2 * v) for t, v in y1], GRN, 2.0, "5 4")])
    o.append(T(pp.X(2.95), pp.Y(0.5) + 14, "1 N → 0.5 m/s", "end", 9.5, SIG, halo=True))
    o.append(T(pp.X(2.95), pp.Y(1.0) + 16, "2 N → 1.0 m/s（ちょうど 2 倍）", "end", 9.5, SIG, True, halo=True))
    o.append(T(pp.X(0.1), pp.Y(1.12), "緑の破線: 1 N の応答 × 2", "start", 9.5, GRN, halo=True))
    # (b) 足し合わせ
    u2 = lambda t: 2.0 if 1.0 <= t < 1.5 else 0.0
    ya = lin(step(1.0)); yb = lin(u2); yab = lin(lambda t: step(1.0)(t) + u2(t))
    q, pp = panel(412, 0, "(b) 入力を足し合わせる", [([(0, 1), (3, 1)], 1.4, None), ([(0, 0), (1, 0), (1, 2), (1.5, 2), (1.5, 0), (3, 0)], 1.4, "3 2"),
                                                 ([(0, 1), (1, 1), (1, 3), (1.5, 3), (1.5, 1), (3, 1)], 2.4, None)],
                  [(ya, MUT, 1.3, None), (yb, MUT, 1.3, "3 2"), (yab, SIG, 2.6, None), ([(t, a + b) for (t, a), (_, b) in zip(ya, yb)], GRN, 2.0, "5 4")],
                  ur=(0, 3.4))
    o.append(T(pp.X(2.95), pp.Y(0.92), "和の入力 → 応答の和", "end", 9.5, SIG, True, halo=True))
    o.append(T(pp.X(0.1), pp.Y(1.12), "緑の破線: 2 つの応答（灰）の和", "start", 9.5, GRN, halo=True))
    # (c) 遅らせる
    yc0 = lin(step(1.0)); yc1 = lin(step(1.0, 1.0))
    q, pp = panel(62, 214, "(c) 入力を 1 s 遅らせる", [([(0, 1), (3, 1)], 1.2, "3 2"), ([(0, 0), (1, 0), (1, 1), (3, 1)], 2.4, None)],
                  [(yc0, MUT, 1.3, "3 2"), (yc1, SIG, 2.6, None)], yr=(0, 0.6), yt=(0, 0.25, 0.5))
    o.append(DIM(pp.X(0.35), pp.Y(0.26), pp.X(1.35), pp.Y(0.26), None, c=ALI))
    o.append(T(pp.X(0.85), pp.Y(0.26) + 15, "同じ形で 1 s 遅れる", "middle", 9.5, ALI, True, halo=True))
    # (d) 線形でない
    d1 = drag(1.0); d2 = drag(2.0)
    q, pp = panel(412, 214, "(d) 線形でない例: 速度の 2 乗の抵抗", [([(0, 1), (3, 1)], 1.4, None), ([(0, 2), (3, 2)], 2.4, None)],
                  [(d1, SIG, 1.4, None), (d2, SIG, 2.6, None), ([(t, 2 * v) for t, v in d1], GRN, 2.0, "5 4")])
    o.append(T(pp.X(2.95), pp.Y(0.5) + 14, "1 N → 0.5 m/s", "end", 9.5, SIG, halo=True))
    o.append(T(pp.X(2.95), pp.Y(0.707) - 6, "2 N → 0.71 m/s", "end", 9.5, ALI, True, halo=True))
    o.append(T(pp.X(0.1), pp.Y(1.12), "緑の破線（1 N の応答 × 2）に届かない", "start", 9.5, ALI, True, halo=True))
    return SVG(700, 428, o, "線形と時不変（ばねの無い台車の速度、静止から）。上の金色の帯は押す力 u、下は速度。(a) 力を 2 倍にすると速度もちょうど 2 倍。(b) 2 つの力の和で押すと、速度はそれぞれの速度の和。(c) 押し始めを 1 s 遅らせると、速度も同じ形のまま 1 s 遅れる。(d) 速度の 2 乗に比例する抵抗だけが働く台車では、力を 2 倍にしても速度は √2 倍にしかならない。")
F["e02_lti"] = _f02_lti_fig()


# =====================================================================
# 2 節: 台車とばね・ダンパ — 自由体図
# =====================================================================
def _f02_fbd_fig():
    o = []
    o.append(T(14, 18, "(a) 台車とばね・ダンパ", "start", 11.5, INK, True))
    gy = 150
    o.append(_f02_wall(44, 52, gy))
    o.append(_f02_ground(38, 330, gy))
    cx, cy, cw, ch = 172, 78, 84, 64
    o.append(_f02_spring(44, cx, 96, n=7, amp=7, c=TEA, lw=1.6))
    o.append(_f02_damper(44, cx, 122, c=PUR, lw=1.6))
    o.append(_f02_cart(cx, cy, cw, ch, SIG))
    o.append(_f02_m(cx + cw / 2, cy + ch / 2 + 4, [_f02_t("質量 "), _f02_v("m")], "middle", 11, SIG, True))
    o.append(_f02_m(100, 82, [_f02_t("ばね "), _f02_v("k")], "middle", 10.5, TEA, True))
    o.append(_f02_m(100, 143, [_f02_t("ダンパ "), _f02_v("c")], "middle", 10.5, PUR, True))
    o.append(ARR(cx + cw, 110, cx + cw + 52, 110, c=GLD, lw=2.2))
    o.append(_f02_m(cx + cw + 30, 102, [_f02_v("u")], "middle", 12, GLD, True))
    o.append(ARR(cx + 22, 70, cx + 62, 70, c=SIG, lw=1.4, head=6))
    o.append(_f02_m(cx + 66, 74, [_f02_t("速度 "), ("ṗ", None, True)], "start", 10, SIG))
    # p の寸法（自然の長さの位置から）
    x0 = cx - 34
    o.append(W(x0, 52, x0, 182, c=MUT, lw=1, dash="3 3"))
    o.append(W(cx, gy + 8, cx, 182, c=MUT, lw=1, dash="3 3"))
    o.append(DIM(x0, 178, cx, 178, None, c=SIG))
    o.append(_f02_m((x0 + cx) / 2, 196, [_f02_v("p")], "middle", 12, SIG, True))
    o.append(T(x0 - 4, 196, "ばねが自然の長さの所が 0", "end", 9.5, MUT))
    # (b) 自由体図
    o.append(T(370, 18, "(b) 自由体図（台車だけを取り出す）", "start", 11.5, INK, True))
    bx, by, bw, bh = 478, 78, 84, 64
    o.append(_f02_cart(bx, by, bw, bh, SIG))
    o.append(_f02_m(bx + bw / 2, by + bh / 2 + 4, [_f02_v("m")], "middle", 12, SIG, True))
    o.append(ARR(bx + bw, 110, bx + bw + 62, 110, c=GLD, lw=2.4))
    o.append(_f02_m(bx + bw + 30, 102, [_f02_t("押す力 "), _f02_v("u")], "middle", 10.5, GLD, True))
    o.append(ARR(bx, 96, bx - 70, 96, c=TEA, lw=2.4))
    o.append(_f02_m(bx - 36, 88, [_f02_v("kp"), _f02_t("（ばね）")], "middle", 10.5, TEA, True))
    o.append(ARR(bx, 126, bx - 52, 126, c=PUR, lw=2.4))
    o.append(_f02_m(bx - 28, 144, [_f02_v("c"), ("ṗ", None, True), _f02_t("（ダンパ）")], "middle", 10.5, PUR, True))
    o.append(ARR(bx + 14, 62, bx + 70, 62, c=SIG, lw=2.4))
    o.append(_f02_m(bx + 76, 66, [_f02_t("力の和 ＝ "), _f02_v("m"), ("p̈", None, True)], "start", 10.5, SIG, True))
    o.append(T(bx + bw / 2, 172, "上下の力（重力と床が支える力）は釣り合うので省く", "middle", 9.5, MUT))
    # 式
    y1, y2 = 222, 246
    o.append(T(14, y1, "右向きを正として、力の和 ＝ 質量 × 加速度:", "start", 10.5, INK))
    o.append(_f02_m(330, y1, [(" m", None, True, SIG), ("p̈", None, True, SIG), _f02_t(" = "), ("u", None, True, GLD), _f02_t(" − "),
                              ("c", None, True, PUR), ("ṗ", None, True, PUR), _f02_t(" − "), ("kp", None, True, TEA)], "start", 13, INK))
    o.append(T(14, y2, "移項すると:", "start", 10.5, INK))
    o.append(_f02_m(330, y2, [(" m", None, True, SIG), ("p̈", None, True, SIG), _f02_t(" + "), ("c", None, True, PUR), ("ṗ", None, True, PUR),
                              _f02_t(" + "), ("kp", None, True, TEA), _f02_t(" = "), ("u", None, True, GLD)], "start", 13, INK, True))
    return SVG(700, 256, o, "台車とばね・ダンパ。(a) 台車は壁にばねとダンパでつながれ、力 u で押される。位置 p は、ばねが自然の長さの所から測る。(b) 台車だけを取り出して働く力を描くと、押す力 u（右向き）、ばねの力 kp と、ダンパの力 cṗ（どちらも左向き）である。その和が質量 × 加速度に等しい。式の色は、図の力の矢印の色と同じ。")
F["e02_fbd"] = _f02_fbd_fig()


# =====================================================================
# 2 節: 各項の役割（m・c・k を変えた位置の応答）
# =====================================================================
def _f02_msd_resp(m, c, k, u=1.0, tend=5.0, n=1001):
    t, y = _f02_sim(lambda t, x: [x[1], (u - c * x[1] - k * x[0]) / m], [0.0, 0.0], tend, n=n)
    return t, y[0], y[1]


def _f02_msd_fig():
    o = []
    cases = [("(a) 例の値（m 1 kg・c 2 N·s/m・k 25 N/m）", (1, 2, 25), 62, 34),
             ("(b) ダンパを外す（c = 0）", (1, 0, 25), 412, 34),
             ("(c) ダンパを強くする（c = 10 N·s/m）", (1, 10, 25), 62, 226),
             ("(d) ばねを外す（k = 0）", (1, 2, 0), 412, 226)]
    for title, (m, c, k), x, y in cases:
        o.append(T(x - 48, y - 14, title, "start", 11, INK, True))
        t, p, v = _f02_msd_resp(m, c, k)
        if k:
            pp = Plot(x, y, 262, 110, (0, 5), (0, 10))
            o.append(pp.axes(xl="時間 t [s]", yl="位置 p [cm]", xt=[0, 1, 2, 3, 4, 5], yt=[0, 2, 4, 6, 8, 10], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
            o.append(pp.line([(0, 4), (5, 4)], c=MUT, lw=1.1, dash="4 3"))
            o.append(_f02_pl(pp, list(zip(t, p * 100)), c=SIG, lw=2.2))
        else:
            pp = Plot(x, y, 262, 110, (0, 5), (0, 2.5))
            o.append(pp.axes(xl="時間 t [s]", yl="位置 p [m]", xt=[0, 1, 2, 3, 4, 5], yt=[0, 0.5, 1.0, 1.5, 2.0, 2.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
            o.append(pp.line([(0.5, 0), (5, 0.5 * 4.5)], c=MUT, lw=1.1, dash="4 3"))
            o.append(_f02_pl(pp, list(zip(t, p)), c=SIG, lw=2.2))
        if (m, c, k) == (1, 2, 25):
            i = int(_f02_np.argmax(p))
            o.append(D(pp.X(t[i]), pp.Y(p[i] * 100), ALI, 3.6))
            o.append(T(pp.X(t[i]) + 7, pp.Y(p[i] * 100) - 2, "6.11 cm（0.64 s）", "start", 9.5, ALI, True, halo=True))
            d = p * 100 - 4
            ups = [t[j + 1] for j in range(len(t) - 1) if d[j] < 0 <= d[j + 1]]
            o.append(DIM(pp.X(ups[1]), pp.Y(2.2), pp.X(ups[2]), pp.Y(2.2), None, c=GLD))
            o.append(T(pp.X((ups[1] + ups[2]) / 2), pp.Y(2.2) + 14, "周期 1.28 s", "middle", 9.5, GLD, True, halo=True))
            o.append(_f02_m(pp.X(4.95), pp.Y(4) - 5, [_f02_v("u"), _f02_t("/"), _f02_v("k"), _f02_t(" = 4 cm")], "end", 9.5, MUT))
        elif c == 0:
            o.append(T(pp.X(4.95), pp.Y(9.0), "揺れが減らない（周期 1.26 s）", "end", 9.5, ALI, True, halo=True))
        elif c == 10:
            o.append(T(pp.X(4.95), pp.Y(4) + 15, "行き過ぎずに 4 cm に近づく", "end", 9.5, GRN, True, halo=True))
        else:
            o.append(T(pp.X(0.15), pp.Y(2.25), "戻す力が無く、止まらない", "start", 9.5, ALI, True, halo=True))
            o.append(T(pp.X(4.9), pp.Y(0.5), "速度は 0.5 m/s に近づく（破線の傾き）", "end", 9.5, MUT, halo=True))
    return SVG(700, 384, o, "1 N で押し続けたときの台車の位置（静止から）。(a) 例の値では行き過ぎてから、揺れながら 4 cm（u/k）に近づく。(b) ダンパが無いと揺れが減らない。(c) ダンパを強くすると揺れなくなる。(d) ばねが無いと戻す力が無く、台車は速度 0.5 m/s（u/c）に近づきながら進み続ける（縦軸は m）。")
F["e02_msd"] = _f02_msd_fig()


# =====================================================================
# 3 節: RC 回路
# =====================================================================
def _f02_rc_fig():
    o = []
    o.append(T(14, 18, "(a) RC 回路", "start", 11.5, INK, True))
    sx, sy = 66, 116
    yt, yb, xr = 58, 182, 268
    o.append(W(sx, sy - 16, sx, yt, 104, yt, c=INK, lw=1.4))
    o.append(_f02_resistor(104, 184, yt, n=6, amp=6))
    o.append(W(184, yt, xr, yt, xr, 110, c=INK, lw=1.4))
    o.append(W(xr - 16, 110, xr + 16, 110, c=SIG, lw=2.6))
    o.append(W(xr - 16, 120, xr + 16, 120, c=SIG, lw=2.6))
    o.append(W(xr, 120, xr, yb, sx, yb, sx, sy + 16, c=INK, lw=1.4))
    o.append(_f02_source(sx, sy, 16, GLD))
    o.append(_f02_m(sx - 24, sy + 5, [_f02_v("v")], "end", 13, GLD, True))
    o.append(_f02_m(144, yt - 14, [_f02_v("R"), _f02_t("（電圧 "), _f02_v("Ri"), _f02_t("）")], "middle", 10.5, INK))
    o.append(ARR(200, yt - 10, 244, yt - 10, c=TEA, lw=1.5, head=6))
    o.append(_f02_m(222, yt - 16, [_f02_v("i")], "middle", 11, TEA, True))
    o.append(_f02_m(xr + 24, 108, [_f02_v("C")], "start", 11, INK))
    o.append(T(xr + 10, 104, "+", "middle", 10, SIG, True))
    o.append(T(xr + 10, 136, "−", "middle", 10, SIG, True))
    o.append(_f02_m(xr + 24, 132, [_f02_v("v", "c")], "start", 13, SIG, True))
    # (b) 式
    x0 = 360
    o.append(T(x0, 18, "(b) 式を作る", "start", 11.5, INK, True))
    o.append(_f02_m(x0, 46, [_f02_t("電圧の和: "), _f02_v("v"), _f02_t(" = "), _f02_v("Ri"), _f02_t(" + "), _f02_v("v", "c")], "start", 11.5, INK))
    o.append(_f02_m(x0, 70, [_f02_t("コンデンサの電流: "), _f02_v("i"), _f02_t(" = "), _f02_v("C"), ("v̇", "c", True)], "start", 11.5, INK))
    o.append(_f02_m(x0, 96, [_f02_t("→ "), _f02_v("RC"), ("v̇", "c", True, SIG), _f02_t(" + "), ("v", "c", True, SIG), _f02_t(" = "), ("v", None, True, GLD)], "start", 13, INK, True))
    # (c) 台車の速度と同じ形
    o.append(T(x0, 132, "(c) 台車の速度の式と同じ形", "start", 11.5, INK, True))
    cols = [x0 + 92, x0 + 168, x0 + 206, x0 + 250, x0 + 276, x0 + 318]
    rows = [(160, "台車の速度", [("(m/c)", MUT), ("p̈", SIG), ("+", INK), ("ṗ", SIG), ("=", INK), ("u/c", GLD)]),
            (190, "RC 回路", [("RC", MUT), ("v̇c", SIG), ("+", INK), ("vc", SIG), ("=", INK), ("v", GLD)])]
    for yy, nm, terms in rows:
        o.append(T(x0, yy, nm, "start", 10.5, INK))
        for xx, (s, c) in zip(cols, terms):
            if s in ("v̇c", "vc"):
                o.append(_f02_m(xx, yy, [(s[:-1], "c", True, c)], "middle", 13, c, True))
            elif s in ("+", "="):
                o.append(T(xx, yy, s, "middle", 13, INK))
            else:
                o.append(_f02_m(xx, yy, [(s, None, True, c)], "middle", 13, c, True))
    o.append(T(x0 + 92, 212, "0.5 s ↔ 0.1 s", "middle", 9.5, MUT))
    o.append(T(x0 + 230, 212, "速度 ↔ 電圧（出力）", "middle", 9.5, SIG))
    o.append(T(x0 + 318, 212, "入力", "middle", 9.5, GLD))
    return SVG(700, 222, o, "RC 回路。(a) 抵抗とコンデンサを直列にし、電圧 v を加える。(b) 回路を一周する電圧の和と、コンデンサの電流の式から、1 階の微分方程式ができる。(c) ばねの無い台車の速度の式を c で割ると、項ごとに同じ形になる（例の値で m/c = 0.5 s、RC = 0.1 s）。")
F["e02_rc"] = _f02_rc_fig()


# =====================================================================
# 3 節: DC モータの電気と機械
# =====================================================================
def _f02_motor_fig():
    o = []
    o.append(T(14, 18, "(a) 巻線（電気の式）と軸（機械の式）", "start", 11.5, INK, True))
    # 巻線の回路
    o.append(RECT(30, 34, 300, 132, 10, "none", LIN, 1.2, "5 4"))
    o.append(T(40, 160, "巻線（モータの中の電気回路）", "start", 9.5, MUT))
    sx, sy, yt, yb = 70, 96, 54, 140
    o.append(W(sx, sy - 16, sx, yt, 100, yt, c=INK, lw=1.4))
    o.append(_f02_resistor(100, 156, yt, n=5, amp=5))
    o.append(W(156, yt, 172, yt, c=INK, lw=1.4))
    o.append(_f02_coil(172, 230, yt))
    o.append(W(230, yt, 286, yt, 286, sy - 18, c=INK, lw=1.4))
    o.append(W(286, sy + 18, 286, yb, sx, yb, sx, sy + 16, c=INK, lw=1.4))
    o.append(_f02_source(sx, sy, 16, GLD))
    o.append(_f02_m(sx + 22, sy + 5, [_f02_v("v")], "start", 13, GLD, True))
    o.append(CIRC(286, sy, 18, c=SIG, lw=1.6, fill=SCR))
    o.append(T(286, sy - 4, "+", "middle", 10, SIG, True))
    o.append(T(286, sy + 13, "−", "middle", 10, SIG, True))
    o.append(_f02_m(128, yt + 22, [_f02_v("R", "a")], "middle", 11, INK))
    o.append(_f02_m(201, yt + 22, [_f02_v("L", "a")], "middle", 11, INK))
    o.append(ARR(240, yt - 9, 276, yt - 9, c=TEA, lw=1.5, head=6))
    o.append(_f02_m(234, yt - 9 + 4, [_f02_v("i")], "end", 11, TEA, True))
    o.append(_f02_m(262, sy + 4, [_f02_v("K", "t"), ("ω", "m", True)], "end", 10.5, SIG, True))
    o.append(T(262, sy + 20, "逆起電力", "end", 9.5, SIG))
    # 軸
    o.append(RECT(440, 34, 240, 132, 10, "none", LIN, 1.2, "5 4"))
    o.append(T(450, 160, "軸（回る部分）", "start", 9.5, MUT))
    o.append(RECT(462, 66, 70, 60, 8, soft(SIG), SIG, 1.5))
    o.append(T(497, 101, "M", "middle", 13, SIG, True))
    o.append(W(532, 96, 600, 96, c=INK, lw=3))
    o.append(RECT(600, 58, 14, 76, 3, MSOFT, MUT, 1.4))
    o.append(_f02_m(607, 150, [_f02_v("J"), _f02_t("（負荷を含む）")], "middle", 10, MUT))
    o.append(PATH("M565,72 A26,26 0 0 1 565,120", c=GLD, lw=2))
    o.append(_head(573, 112, 565, 120, GLD, 7))
    o.append(_f02_m(578, 76, [_f02_v("K", "t"), _f02_v("i")], "start", 10.5, GLD, True))
    o.append(PATH("M640,120 A24,24 0 0 0 640,72", c=PUR, lw=2))
    o.append(_head(633, 80, 640, 72, PUR, 7))
    o.append(_f02_m(650, 100, [("τ", "L", True)], "start", 12, PUR, True))
    o.append(_f02_m(476, 56, [_f02_t("角速度 "), ("ω", "m", True)], "start", 10.5, SIG, True))
    # 電気と機械のつながり
    o.append(ARR(332, 74, 438, 74, c=GLD, lw=1.6))
    o.append(_f02_m(385, 66, [_f02_t("トルク "), _f02_v("K", "t"), _f02_v("i")], "middle", 10, GLD))
    o.append(ARR(438, 122, 332, 122, c=SIG, lw=1.6))
    o.append(_f02_m(385, 116, [_f02_t("逆起電力 "), _f02_v("K", "t"), ("ω", "m", True)], "middle", 10, SIG))
    # (b) ブロック線図
    o.append(T(14, 196, "(b) ブロック線図: 逆起電力がモータの中のフィードバックになる", "start", 11.5, INK, True))
    ym = 246
    o.append(_f02_m(14, ym + 4, [_f02_v("v")], "start", 13, GLD, True))
    o.append(ARR(28, ym, 74, ym, c=GLD, lw=1.6))
    o.append(CIRC(84, ym, 10, c=INK, lw=1.4, fill=SCR))
    o.append(T(70, ym - 6, "+", "middle", 10, INK, True))
    o.append(T(92, ym + 22, "−", "middle", 11, INK, True))
    o.append(ARR(94, ym, 120, ym, c=INK, lw=1.4))
    o.append(BOX(120, ym - 22, 116, 44, "電気の式", "電流を決める", LIN, PAN, sz=10.5, ssz=9.5))
    o.append(ARR(236, ym, 268, ym, c=TEA, lw=1.6))
    o.append(_f02_m(252, ym - 6, [_f02_v("i")], "middle", 11, TEA, True))
    o.append(BOX(268, ym - 18, 52, 36, None, None, LIN, PAN))
    o.append(_f02_m(294, ym + 5, [_f02_t("× "), _f02_v("K", "t")], "middle", 11, INK))
    o.append(ARR(320, ym, 356, ym, c=GLD, lw=1.6))
    o.append(CIRC(366, ym, 10, c=INK, lw=1.4, fill=SCR))
    o.append(T(352, ym - 6, "+", "middle", 10, INK, True))
    o.append(T(376, ym - 14, "−", "middle", 11, INK, True))
    o.append(ARR(366, ym - 40, 366, ym - 10, c=PUR, lw=1.6))
    o.append(_f02_m(374, ym - 32, [("τ", "L", True), _f02_t("（負荷）")], "start", 10.5, PUR, True))
    o.append(ARR(376, ym, 404, ym, c=INK, lw=1.4))
    o.append(BOX(404, ym - 22, 126, 44, "機械の式", "角速度を決める", SIG, SSOFT, sz=10.5, ssz=9.5))
    o.append(ARR(530, ym, 640, ym, c=SIG, lw=1.8))
    o.append(_f02_m(648, ym + 5, [("ω", "m", True)], "start", 13, SIG, True))
    o.append(D(580, ym, SIG, 3.2))
    o.append(W(580, ym, 580, ym + 50, 330, ym + 50, c=SIG, lw=1.4))
    o.append(BOX(250, ym + 32, 80, 36, None, None, SIG, PAN))
    o.append(_f02_m(290, ym + 55, [_f02_t("× "), _f02_v("K", "t")], "middle", 11, INK))
    o.append(W(250, ym + 50, 84, ym + 50, c=SIG, lw=1.4))
    o.append(ARR(84, ym + 50, 84, ym + 10, c=SIG, lw=1.4))
    o.append(T(420, ym + 66, "逆起電力: 速いほど電流を減らす", "middle", 9.5, SIG, True))
    return SVG(700, ym + 76, o, "DC モータ。(a) 巻線は抵抗 Ra とインダクタンス La に、逆起電力の電圧源をつないだ回路として表せる。巻線の電流はトルクを生んで軸を回し、軸の回転は逆起電力を生んで巻線に返る。(b) 2 つの式をブロック線図で書くと、角速度から逆起電力を通って電流へ戻る流れが、フィードバックの形になっている。")
F["e02_motor"] = _f02_motor_fig()


# =====================================================================
# 3 節: モータの応答（La を含む式と、無視した一次の式）
# =====================================================================
_F02_RA, _F02_LA, _F02_KT, _F02_J = 2.0, 1e-3, 0.02, 1e-5


def _f02_motor_sims(tl_at=0.15, tl=0.01, tend=0.3):
    tauL = lambda t: tl if t >= tl_at else 0.0
    Ra, La, Kt, J = _F02_RA, _F02_LA, _F02_KT, _F02_J
    t, y = _f02_sim(lambda t, x: [(12.0 - Ra * x[0] - Kt * x[1]) / La, (Kt * x[0] - tauL(t)) / J], [0.0, 0.0], tend, n=6001, max_step=2e-5)
    T_ = J * Ra / Kt ** 2
    t2, y2 = _f02_sim(lambda t, x: [(50.0 * 12.0 - Ra / Kt ** 2 * tauL(t) - x[0]) / T_], [0.0], tend, n=6001, max_step=2e-4)
    ia = (12.0 - Kt * y2[0]) / Ra
    return t, y[0], y[1], y2[0], ia


def _f02_motor_resp_fig():
    o = []
    t, i, w, wa, ia = _f02_motor_sims()
    o.append(T(14, 16, "(a) 角速度", "start", 11.5, INK, True))
    p = Plot(62, 28, 610, 128, (0, 0.3), (0, 700))
    o.append(p.axes(xl=None, yl="角速度 [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3], yt=[0, 200, 400, 600], xfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 600), (0.3, 600)], c=FNT, lw=1, dash="3 3"))
    o.append(W(p.X(0.15), p.y, p.X(0.15), p.y + p.h, c=PUR, lw=1, dash="3 3"))
    o.append(_f02_pl(p, list(zip(t, w)), c=SIG, lw=2.4))
    o.append(_f02_pl(p, list(zip(t, wa)), c=MUT, lw=1.6, dash="6 4"))
    o.append(D(p.X(0.05), p.Y(379.3), SIG, 3.6))
    o.append(T(p.X(0.05) + 8, p.Y(379.3) + 14, "0.05 s で 379 rad/s", "start", 9.5, SIG, True, halo=True))
    o.append(_f02_m(p.X(0.148), p.Y(600) - 6, [_f02_v("K"), _f02_t(" × 12 V = 600 rad/s")], "end", 9.5, MUT, halo=True))
    o.append(_f02_m(p.X(0.153), p.Y(130), [_f02_t("0.15 s に負荷トルク "), ("τ", "L", True), _f02_t(" = 0.01 N·m")], "start", 9.5, PUR, True))
    o.append(T(p.X(0.295), p.Y(550) + 15, "550 rad/s に下がる", "end", 9.5, SIG, True, halo=True))
    # (b) 電流
    o.append(T(14, 196, "(b) 電流", "start", 11.5, INK, True))
    q = Plot(62, 208, 330, 110, (0, 0.3), (0, 7))
    o.append(q.axes(xl="時間 t [s]", yl="電流 [A]", xt=[0, 0.1, 0.2, 0.3], yt=[0, 2, 4, 6], xfmt=lambda v: "%g" % v))
    o.append(_f02_pl(q, list(zip(t, i)), c=TEA, lw=2.2))
    o.append(_f02_pl(q, list(zip(t, ia)), c=MUT, lw=1.6, dash="6 4"))
    o.append(T(q.X(0.295), q.Y(0.5) - 8, "負荷を支える 0.5 A", "end", 9.5, TEA, True, halo=True))
    # (c) 始めの 10 ms
    o.append(T(436, 196, "(c) 電流の始めの 10 ms", "start", 11.5, INK, True))
    z = Plot(470, 208, 202, 110, (0, 10), (0, 7))
    o.append(z.axes(xl="時間 t [ms]", yl=None, xt=[0, 2, 4, 6, 8, 10], yt=[0, 2, 4, 6], xfmt=lambda v: "%g" % v))
    sel = t <= 0.0101
    o.append(_f02_pl(z, list(zip(t[sel] * 1e3, i[sel])), c=TEA, lw=2.4))
    o.append(_f02_pl(z, [(0, 0), (0, 6.0)] + list(zip(t[sel] * 1e3, ia[sel])), c=MUT, lw=1.6, dash="6 4"))
    k = int(_f02_np.argmax(i))
    o.append(D(z.X(t[k] * 1e3), z.Y(i[k]), TEA, 3.6))
    o.append(T(z.X(t[k] * 1e3) + 6, z.Y(i[k]) + 16, "5.78 A（2.34 ms）", "start", 9.5, TEA, True, halo=True))
    o.append(T(z.X(0.3), z.Y(6.0) - 6, "一次の式は 0 s で 6 A", "start", 9.5, MUT, halo=True))
    o.append(LEGEND(62, 370, [(SIG, "La を含む式（角速度）"), (TEA, "La を含む式（電流）"), (MUT, "La を無視した一次の式（破線）")]))
    return SVG(700, 380, o, "止まっているモータに 12 V を加え、0.15 s に負荷トルク 0.01 N·m を加えたとき（Ra 2 Ω・La 1 mH・Kt 0.02 N·m/A・J 1 × 10⁻⁵ kg·m²）。(a) 角速度は 2 つの式でほとんど重なる。(b)(c) 電流は、La を含む式では 2.34 ms かけて最大の 5.78 A まで上がるが、一次の式では 0 s で 6 A に跳ぶ。数 ms より後は 2 つの式がよく合う。")
F["e02_motor_resp"] = _f02_motor_resp_fig()


# =====================================================================
# 4 節: 温度の板 — 熱の行き先
# =====================================================================
def _f02_heat_fig():
    o = []
    o.append(T(14, 18, "(a) 板の熱の出入り", "start", 11.5, INK, True))
    o.append(_f02_m(30, 44, [_f02_t("周りの空気（"), ("θ", "a", True), _f02_t(" = 25 °C）")], "start", 10, MUT))
    px, py, pw, ph = 50, 120, 210, 20
    for xx in (80, 125, 170, 215):
        o.append(PATH("M%g,%g c-6,-7 6,-13 0,-20 c-6,-7 6,-13 0,-20" % (xx, py - 4), c=MUT, lw=1.5))
        o.append(_head(xx, py - 40, xx, py - 50, MUT, 6))
    o.append(_f02_m(px + pw / 2, 64, [_f02_t("逃げる熱 ("), ("θ", None, True), _f02_t(" − "), ("θ", "a", True), _f02_t(") ÷ "), _f02_v("R", "th")], "middle", 10.5, MUT, True))
    o.append(RECT(px, py, pw, ph, 3, MSOFT, MUT, 1.4))
    o.append(_f02_m(px + pw / 2, py + 14, [_f02_t("板を温める "), _f02_v("C", "th"), _f02_t(" d"), ("θ", None, True), _f02_t("/d"), _f02_v("t")], "middle", 10.5, SIG, True))
    o.append(RECT(px + 18, py + ph, pw - 36, 7, 1, soft(GLD), GLD, 1.1))
    o.append(ARR(px + pw / 2, py + ph + 52, px + pw / 2, py + ph + 10, c=GLD, lw=2.2))
    o.append(_f02_m(px + pw / 2 + 10, py + ph + 40, [_f02_t("ヒータ "), _f02_v("q"), _f02_t("（入る熱）")], "start", 10.5, GLD, True))
    o.append(_f02_m(30, 236, [_f02_v("C", "th", SIG), (" d", None, False, SIG), ("θ", None, True, SIG), ("/d", None, False, SIG), ("t", None, True, SIG), _f02_t(" = "), ("q", None, True, GLD), _f02_t(" − ("), ("θ", None, True), _f02_t(" − "),
                              ("θ", "a", True), _f02_t(") ÷ "), _f02_v("R", "th")], "start", 12.5, INK, True))
    # (b) 80 W の行き先
    o.append(T(330, 18, "(b) 80 W の行き先（25 °C から入れ続ける）", "start", 11.5, INK, True))
    p = Plot(372, 34, 270, 170, (0, 2500), (0, 80))
    ts = _f02_np.linspace(0, 2500, 251)
    lost = 80 * (1 - _f02_np.exp(-ts / 500.0))
    o.append(PL([(p.X(0), p.Y(0))] + [(p.X(t), p.Y(v)) for t, v in zip(ts, lost)] + [(p.X(2500), p.Y(0))], c="none", lw=0, fill=MSOFT))
    o.append(PL([(p.X(t), p.Y(v)) for t, v in zip(ts, lost)] + [(p.X(2500), p.Y(80)), (p.X(0), p.Y(80))], c="none", lw=0, fill=SSOFT))
    o.append(p.axes(xl="時間 t [s]", yl="電力 [W]", xt=[0, 500, 1000, 1500, 2000, 2500], yt=[0, 20, 40, 60, 80], grid=False))
    o.append(_f02_pl(p, list(zip(ts, lost)), c=SIG, lw=2.4))
    for v in (0, 20, 40, 60, 80):
        yy = p.Y(v)
        o.append(W(p.x + p.w, yy, p.x + p.w + 4, yy, c=SIG, lw=1))
        o.append(T(p.x + p.w + 7, yy + 3.5, "%d" % (25 + 1.25 * v), "start", 9.5, SIG))
    o.append(W(p.x + p.w, p.y, p.x + p.w, p.y + p.h, c=SIG, lw=1))
    o.append(T(p.x + p.w + 44, p.y + p.h / 2, "板の温度 [°C]", "middle", 10, SIG, rot=90))
    o.append(T(p.X(80), p.Y(70), "板を温める分", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(2450), p.Y(20), "逃げる分", "end", 10, MUT, True, halo=True))
    o.append(W(p.X(500), p.y, p.X(500), p.y + p.h, c=GLD, lw=1, dash="3 3"))
    o.append(D(p.X(500), p.Y(50.57), SIG, 3.6))
    o.append(T(p.X(500) + 6, p.Y(50.57) + 15, "500 s: 逃げる 50.6 W", "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(500) + 6, p.Y(50.57) + 29, "（88.2 °C）", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(1490), p.Y(76.0) - 8, "1500 s: 76.0 W", "middle", 9.5, INK, True, halo=True))
    return SVG(700, 248, o, "温度の板（熱容量 400 J/K、熱抵抗 1.25 K/W）。(a) ヒータの熱の一部は板を温め、残りは周りへ逃げる。逃げる速さは周りとの温度の差に比例する。(b) 80 W を入れ続けたときの内訳。始めはすべて板を温めるが、温度が上がるにつれて逃げる分が増える。逃げる分は温度の差に比例するので、境の線はそのまま板の温度を表す（右の目盛）。")
F["e02_heat"] = _f02_heat_fig()


# =====================================================================
# 4 節: 水槽
# =====================================================================
def _f02_tank_fig():
    o = []
    o.append(T(14, 18, "(a) 水槽", "start", 11.5, INK, True))
    xl, xr, yt, yb, yw = 76, 196, 60, 214, 150
    o.append(RECT(xl, yw, xr - xl, yb - yw, 0, SSOFT, "none", 0))
    o.append(W(xl, yw, xr, yw, c=SIG, lw=1.4))
    o.append(W(xl, yt, xl, yb, xr, yb, xr, yt, c=INK, lw=2))
    o.append(W(24, 42, 110, 42, 110, 62, c=GLD, lw=3))
    o.append(_head(110, 52, 110, 74, GLD, 8))
    o.append(_f02_m(24, 34, [_f02_t("流入 "), _f02_v("u"), _f02_t("（ポンプ）")], "start", 10.5, GLD, True))
    o.append(PATH("M%g,%g q18,-2 26,26" % (xr, yb - 6), c=TEA, lw=2.4))
    o.append(_head(xr + 24, yb + 12, xr + 26, yb + 22, TEA, 7))
    o.append(_f02_m(xr + 10, yb - 18, [_f02_t("流出 "), _f02_v("a"), ("√", None, False), _f02_v("h")], "start", 10.5, TEA, True))
    o.append(DIM(xl - 14, yw, xl - 14, yb, None, c=SIG))
    o.append(_f02_m(xl - 22, (yw + yb) / 2 + 4, [_f02_v("h")], "end", 13, SIG, True))
    o.append(_f02_m((xl + xr) / 2, 186, [_f02_t("断面積 "), _f02_v("A", "t")], "middle", 10.5, INK))
    o.append(_f02_m(24, 254, [_f02_v("A", "t"), ("ḣ", None, True, SIG), _f02_t(" = "), ("u", None, True, GLD), _f02_t(" − "), ("a", None, True, TEA), ("√", None, False, TEA), ("h", None, True, TEA)], "start", 13, INK, True))
    # (b) 流れ出る量と落ち着く水位
    o.append(T(300, 18, "(b) 流れ出る量と、落ち着く水位", "start", 11.5, INK, True))
    p = Plot(352, 34, 300, 176, (0, 1.1), (0, 0.45))
    o.append(p.axes(xl="水位 h [m]", yl="流量 [L/s]", xt=[0, 0.25, 0.5, 0.75, 1.0], yt=[0, 0.1, 0.2, 0.3, 0.4], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    hs = _f02_np.linspace(0, 1.1, 221)
    o.append(_f02_pl(p, [(h, 0.4 * math.sqrt(h)) for h in hs], c=TEA, lw=2.4))
    o.append(_f02_m(p.X(0.98), p.Y(0.4 * math.sqrt(0.8)) + 4, [_f02_t("流れ出る量 "), _f02_v("a"), _f02_t("√"), _f02_v("h")], "end", 9.5, TEA, True))
    for u in (0.1, 0.2, 0.3, 0.4):
        he = (u / 0.4) ** 2
        o.append(W(p.X(0), p.Y(u), p.X(he), p.Y(u), c=GLD, lw=1.3, dash="5 3"))
        o.append(W(p.X(he), p.Y(u), p.X(he), p.Y(0), c=SIG, lw=1, dash="2 3"))
        o.append(D(p.X(he), p.Y(u), SIG, 3.8))
        o.append(T(p.X(he) + 6, p.Y(u) + 13, "%g cm" % (he * 100), "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.02), p.Y(0.4) - 6, "流入 0.4 L/s", "start", 9.5, GLD, halo=True))
    o.append(T(p.X(0.02), p.Y(0.2) - 6, "0.2 L/s", "start", 9.5, GLD, halo=True))
    o.append(T(p.X(0.5), p.Y(0.06), "流入を 2 倍（0.2 → 0.4 L/s）にすると", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.5), p.Y(0.06) + 14, "水位は 4 倍（25 → 100 cm）", "start", 9.5, ALI, True, halo=True))
    return SVG(700, 264, o, "水槽（断面積 0.02 m²、穴の係数 a = 4 × 10⁻⁴ m^(5/2)/s）。(a) ポンプで入れた水が、底の穴から水位の平方根に比例する量だけ流れ出る。(b) 流れ出る量（青緑）と流入（金色の破線）が等しい水位で、水位は落ち着く。流れ出る量が水位に比例しないので、流入を 2 倍にしても水位は 2 倍にならない。")
F["e02_tank"] = _f02_tank_fig()


# =====================================================================
# 5 節: 水槽の線形化
# =====================================================================
_F02_AT, _F02_A, _F02_H0, _F02_U0 = 0.02, 4e-4, 0.25, 0.2e-3


def _f02_tank_resp(du, tend=200.0, n=801):
    At, a, h0, u0 = _F02_AT, _F02_A, _F02_H0, _F02_U0
    u = u0 + du
    f = lambda t, x: [(u - a * math.sqrt(max(x[0], 0.0))) / At if (x[0] > 1e-12 or u > 0) else 0.0]
    t, y = _f02_sim(f, [h0], tend, n=n, max_step=0.05)
    hn = _f02_np.maximum(y[0], 0.0)
    Tl, Kl = 2 * At * math.sqrt(h0) / a, 2 * math.sqrt(h0) / a
    hl = h0 + Kl * du * (1 - _f02_np.exp(-t / Tl))
    return t, hn, hl


def _f02_tangent_fig():
    o = []
    o.append(T(14, 18, "(a) 流れ出る量を、動作点での接線で置き換える", "start", 11.5, INK, True))
    p = Plot(62, 34, 262, 186, (0, 0.6), (0, 0.32))
    o.append(RECT(p.X(0.15), p.y, p.X(0.35) - p.X(0.15), p.h, 0, GSOFT, "none", 0))
    o.append(p.axes(xl="水位 h [m]", yl="流量 [L/s]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 0.1, 0.2, 0.3], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    hs = _f02_np.linspace(0, 0.6, 241)
    o.append(_f02_pl(p, [(h, 0.4 * math.sqrt(h)) for h in hs], c=TEA, lw=2.4))
    o.append(_f02_pl(p, [(h, 0.2 + 0.4 * (h - 0.25)) for h in hs], c=MUT, lw=1.8, dash="6 4"))
    o.append(D(p.X(0.25), p.Y(0.2), INK, 4.2))
    o.append(T(p.X(0.25) + 8, p.Y(0.2) + 16, "動作点（25 cm、0.2 L/s）", "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(0.25), p.y + p.h - 6, "誤差 3 % 以下", "middle", 9.5, GRN, True, halo=True))
    o.append(_f02_m(p.X(0.59), p.Y(0.27), [_f02_t("元の "), _f02_v("a"), _f02_t("√"), _f02_v("h")], "end", 9.5, TEA, True))
    o.append(T(p.X(0.40), p.Y(0.272), "接線（線形化）", "end", 9.5, MUT, True, halo=True))
    o.append(DIM(p.X(0.012), p.Y(0.0), p.X(0.012), p.Y(0.1), None, c=ALI))
    o.append(T(p.X(0.03), p.Y(0.05) + 4, "h = 0 で 0.1 L/s ずれる", "start", 9.5, ALI, True, halo=True))
    # (b) 流入を変えたときの水位
    o.append(T(370, 18, "(b) 流入を変えたときの水位", "start", 11.5, INK, True))
    q = Plot(410, 34, 270, 186, (0, 200), (-30, 65))
    o.append(RECT(q.x, q.Y(0), q.w, q.Y(-30) - q.Y(0), 0, ASOFT, "none", 0))
    o.append(q.axes(xl="時間 t [s]", yl="水位 h [cm]", xt=[0, 50, 100, 150, 200], yt=[-25, 0, 25, 50], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(q.line([(0, 0), (200, 0)], c=MUT, lw=1.2))
    o.append(T(q.X(4), q.Y(-30) - 5, "水位が負（あり得ない）", "start", 9.5, ALI, True, halo=True))
    for frac, lab in ((0.5, "+50 %"), (0.1, "+10 %"), (-1.0, "ポンプを止める")):
        t, hn, hl = _f02_tank_resp(frac * _F02_U0)
        o.append(_f02_pl(q, list(zip(t, hn * 100)), c=SIG, lw=2.2))
        o.append(_f02_pl(q, list(zip(t, hl * 100)), c=MUT, lw=1.8, dash="6 4"))
    o.append(T(q.X(198), q.Y(56.25) - 5, "+50 %: 56.25 cm（線形化 50 cm）", "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(198), q.Y(30.25) - 5, "+10 %: 30.25 cm（30 cm）", "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(198), q.Y(0) - 6, "ポンプを止める: 0 cm（−25 cm）", "end", 9.5, SIG, True, halo=True))
    o.append(D(q.X(50), q.Y(0), SIG, 3.4))
    o.append(T(q.X(50) + 5, q.Y(0) + 13, "50 s で空", "start", 9.5, SIG, halo=True))
    o.append(LEGEND(62, 274, [(TEA, "元の式の流れ出る量"), (SIG, "元の式の水位"), (MUT, "線形化した式（破線）"), (GRN, "接線の誤差が 3 % 以下の範囲")]))
    return SVG(700, 284, o, "水槽の線形化（動作点 25 cm・0.2 L/s）。(a) 流れ出る量 a√h（青緑）を、動作点での接線（破線）で置き換える。動作点から離れるほど誤差が増える。(b) 動作点から流入を変えたときの水位。小さな変化では 2 つの式がよく合うが、大きな変化では合わなくなり、ポンプを止めると線形化した式は負の水位を答える。")
F["e02_tangent"] = _f02_tangent_fig()


# =====================================================================
# 5 節: 振子
# =====================================================================
def _f02_pend_draw(o, px, py, ang, L, up, col, arrow_c, label, sub):
    """ang は鉛直（up=True なら上、False なら下）からの傾き [度]。"""
    a = math.radians(ang)
    bx = px + L * math.sin(a)
    by = py - L * math.cos(a) if up else py + L * math.cos(a)
    o.append(W(px, py, px, py - L - 10 if up else py + L + 10, c=FNT, lw=1, dash="4 3"))
    o.append(W(px, py, bx, by, c=INK, lw=2))
    o.append(CIRC(bx, by, 9, c=col, lw=1.6, fill=soft(col)))
    o.append(D(px, py, INK, 3.4))
    # 重力のトルクの向き（曲がった矢印）
    if up:
        o.append(CARR(bx + 10, by + 6, bx + 30, by + 34, -0.3, c=arrow_c, lw=1.8, head=7))
    else:
        o.append(CARR(bx - 6, by + 12, px + 4, by + 22, -0.3, c=arrow_c, lw=1.8, head=7))
    o.append(T(px, py + (34 if up else -20) if not up else py + 26, label, "middle", 10.5, arrow_c, True))
    o.append(T(px, py + 40 if up else py - 6, sub, "middle", 9.5, MUT))


def _f02_pend_fig():
    o = []
    o.append(T(14, 18, "(a) 2 つの平衡点", "start", 11.5, INK, True))
    # 真下（ぶら下がり）
    px, py, L = 96, 52, 80
    a = math.radians(20)
    bx, by = px + L * math.sin(a), py + L * math.cos(a)
    o.append(W(px - 30, py, px + 30, py, c=MUT, lw=2))
    o.append(W(px, py, px, py + L + 12, c=FNT, lw=1, dash="4 3"))
    o.append(W(px, py, bx, by, c=INK, lw=2))
    o.append(CIRC(bx, by, 9, c=SIG, lw=1.6, fill=SSOFT))
    o.append(D(px, py, INK, 3.4))
    o.append(CARR(bx + 4, by + 14, px + 8, py + L + 16, -0.35, c=GRN, lw=2, head=7))
    o.append(T(px, py + L + 44, "真下（φ = π）", "middle", 10.5, INK, True))
    o.append(T(px, py + L + 60, "ずれると戻される → 往復", "middle", 10, GRN, True))
    # 真上
    qx, qy = 262, 150
    bx2, by2 = qx + L * math.sin(a), qy - L * math.cos(a)
    o.append(W(qx - 30, qy, qx + 30, qy, c=MUT, lw=2))
    o.append(W(qx, qy, qx, qy - L - 14, c=FNT, lw=1, dash="4 3"))
    o.append(W(qx, qy, bx2, by2, c=INK, lw=2))
    o.append(CIRC(bx2, by2, 9, c=SIG, lw=1.6, fill=SSOFT))
    o.append(D(qx, qy, INK, 3.4))
    o.append(PATH("M%g,%g A%g,%g 0 0 1 %g,%g" % (qx, qy - 40, 40, 40, qx + 40 * math.sin(a), qy - 40 * math.cos(a)), c=SIG, lw=1.3))
    o.append(_f02_m(qx + 10, qy - 46, [("φ", None, True)], "start", 11, SIG, True))
    o.append(CARR(bx2 + 12, by2 + 2, bx2 + 34, by2 + 30, -0.3, c=ALI, lw=2, head=7))
    o.append(T(qx, qy + 18, "真上（φ = 0）", "middle", 10.5, INK, True))
    o.append(T(qx, qy + 34, "ずれると離れていく → 倒れる", "middle", 10, ALI, True))
    o.append(T(qx + 4, 30, "角度 φ は真上から測る", "middle", 9.5, MUT))
    # (b) sin と接線
    o.append(T(380, 18, "(b) sin φ と、2 つの点での接線", "start", 11.5, INK, True))
    p = Plot(420, 34, 260, 150, (-30, 210), (-1.25, 1.25))
    o.append(p.axes(xl="角度 φ [°]", yl="sin φ", xt=[0, 90, 180], yt=[-1, 0, 1], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(-30, 0), (210, 0)], c=MUT, lw=1))
    ds = _f02_np.linspace(-30, 210, 241)
    o.append(_f02_pl(p, [(d, math.sin(math.radians(d))) for d in ds], c=SIG, lw=2.4))
    o.append(_f02_pl(p, [(d, math.radians(d)) for d in _f02_np.linspace(-30, 70, 51)], c=MUT, lw=1.8, dash="6 4"))
    o.append(_f02_pl(p, [(d, -math.radians(d - 180)) for d in _f02_np.linspace(110, 210, 51)], c=MUT, lw=1.8, dash="6 4"))
    o.append(D(p.X(0), p.Y(0), ALI, 4)); o.append(D(p.X(180), p.Y(0), GRN, 4))
    o.append(T(p.X(4), p.Y(-0.25) + 4, "真上: 傾き +1", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(176), p.Y(-0.25) + 4, "真下: 傾き −1", "end", 9.5, GRN, True, halo=True))
    o.append(_f02_m(p.X(66), p.Y(1.1), [_f02_t("接線 "), ("φ", None, True)], "start", 9.5, MUT, True))
    # (c) 振れ幅を変えた往復
    o.append(T(14, 232, "(c) 真下のまわりの往復（静かに放す）: 実線は元の式、破線は線形化した式", "start", 11.5, INK, True))
    g, l = 9.81, 0.3
    w0 = math.sqrt(g / l)
    rows = [(10, "1.101 s", "0.2 %"), (45, "1.143 s", "4.0 %"), (90, "1.297 s", "18 %")]
    for k, (amp, per, dif) in enumerate(rows):
        y0 = 246 + k * 76
        q = Plot(110, y0, 470, 56, (0, 4), (-amp * 1.15, amp * 1.15))
        o.append(q.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 1, 2, 3, 4], yt=[-amp, 0, amp], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d°" % v))
        t, y = _f02_sim(lambda t, x: [x[1], g / l * math.sin(x[0])], [math.pi + math.radians(amp), 0.0], 4.0, n=801)
        o.append(_f02_pl(q, [(a_, math.degrees(b_ - math.pi)) for a_, b_ in zip(t, y[0])], c=SIG, lw=2.2))
        o.append(_f02_pl(q, [(a_, amp * math.cos(w0 * a_)) for a_ in t], c=MUT, lw=1.6, dash="6 4"))
        o.append(T(14, y0 + 24, "振れ幅 %d°" % amp, "start", 10.5, INK, True))
        o.append(T(596, y0 + 22, "周期 %s" % per, "start", 10, SIG, True))
        o.append(T(596, y0 + 38, "線形化との差 %s" % dif, "start", 9.5, MUT))
    return SVG(700, 246 + 2 * 76 + 56 + 40, o, "振子（長さ 0.3 m、角度は真上から測る）。(a) 平衡点は真上と真下の 2 つ。真下では、ずれると重力が戻す向きに働き、真上では、ずれを広げる向きに働く。(b) 式の sin φ を、それぞれの点での接線（破線）で置き換えたのが線形化した式で、傾きの符号が逆になる。(c) 真下のまわりで振れ幅を変えた往復。振れ幅が大きいほど元の式の周期が長くなり、線形化した式（周期 1.099 s）とずれていく。")
F["e02_pend"] = _f02_pend_fig()


# =====================================================================
# 5 節: 台車に立てた振子
# =====================================================================
_F02_IPM, _F02_IPm, _F02_IPl, _F02_G = 0.5, 0.2, 0.3, 9.81


def _f02_ip_nl(t, x, u=0.0):
    M, m, l, g = _F02_IPM, _F02_IPm, _F02_IPl, _F02_G
    p, pd, ph, phd = x
    s, c = math.sin(ph), math.cos(ph)
    a11, a12, a21, a22 = M + m, m * l * c, c, l
    b1, b2 = u + m * l * s * phd * phd, g * s
    det = a11 * a22 - a12 * a21
    pdd = (b1 * a22 - a12 * b2) / det
    phdd = (a11 * b2 - a21 * b1) / det
    return [pd, pdd, phd, phdd]


def _f02_ip_lin(t, x, u=0.0):
    p, pd, ph, phd = x
    return [pd, 2.0 * u - 3.924 * ph, phd, 45.78 * ph - 6.667 * u]


def _f02_ipend_fig():
    o = []
    o.append(T(14, 18, "(a) 台車に立てた振子", "start", 11.5, INK, True))
    gy = 214
    o.append(_f02_ground(20, 300, gy))
    cx, cy, cw, ch = 96, 172, 104, 34
    o.append(_f02_cart(cx, cy, cw, ch, SIG))
    o.append(_f02_m(cx + cw / 2, cy + 22, [_f02_v("M"), _f02_t(" 0.5 kg")], "middle", 10.5, SIG, True))
    px, py, L = cx + cw / 2, cy, 112
    a = math.radians(20)
    bx, by = px + L * math.sin(a), py - L * math.cos(a)
    o.append(W(px, py, px, py - L - 16, c=FNT, lw=1, dash="4 3"))
    o.append(W(px, py, bx, by, c=INK, lw=2.4))
    o.append(CIRC(bx, by, 10, c=SIG, lw=1.6, fill=SSOFT))
    o.append(D(px, py, INK, 3.4))
    o.append(PATH("M%g,%g A%g,%g 0 0 1 %g,%g" % (px, py - 46, 46, 46, px + 46 * math.sin(a), py - 46 * math.cos(a)), c=SIG, lw=1.3))
    o.append(_f02_m(px + 9, py - 52, [("φ", None, True)], "start", 12, SIG, True))
    o.append(_f02_m(bx + 14, by + 4, [_f02_v("m"), _f02_t(" 0.2 kg")], "start", 10.5, SIG, True))
    o.append(_f02_m(px + 34, py - 70, [_f02_v("l"), _f02_t(" 0.3 m")], "start", 10.5, INK))
    o.append(ARR(cx - 54, cy + 17, cx - 2, cy + 17, c=GLD, lw=2.4))
    o.append(_f02_m(cx - 30, cy + 9, [_f02_v("u")], "middle", 12, GLD, True))
    o.append(W(30, 160, 30, 236, c=MUT, lw=1, dash="3 3"))
    o.append(DIM(30, 232, px, 232, None, c=SIG))
    o.append(_f02_m((30 + px) / 2, 248, [_f02_v("p")], "middle", 12, SIG, True))
    # (b) 傾きの増え方
    o.append(T(330, 18, "(b) 力を加えずに放したときの傾き", "start", 11.5, INK, True))
    q = Plot(380, 34, 296, 170, (0, 0.8), (0, 90))
    o.append(q.axes(xl="時間 t [s]", yl="傾き φ [°]", xt=[0, 0.2, 0.4, 0.6, 0.8], yt=[0, 30, 60, 90], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    for ph0, lab in ((1.0, "1° から"), (5.0, "5° から")):
        x0 = [0.0, 0.0, math.radians(ph0), 0.0]
        t, yn = _f02_sim(_f02_ip_nl, x0, 0.8, n=801)
        t, yl = _f02_sim(_f02_ip_lin, x0, 0.8, n=801)
        o.append(_f02_pl(q, [(a_, math.degrees(b_)) for a_, b_ in zip(t, yn[2])], c=SIG, lw=2.2))
        o.append(_f02_pl(q, [(a_, math.degrees(b_)) for a_, b_ in zip(t, yl[2])], c=MUT, lw=1.8, dash="6 4"))
        rel = _f02_np.abs(yn[2] - yl[2]) / _f02_np.maximum(_f02_np.abs(yl[2]), 1e-12)
        k = int(_f02_np.argmax(rel > 0.05))
        o.append(D(q.X(t[k]), q.Y(math.degrees(yn[2][k])), ALI, 3.6))
        kk = int(_f02_np.argmax(_f02_np.degrees(yn[2]) > 8))
        o.append(T(q.X(t[kk]) + 6, q.Y(8) + 4, lab, "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(0.02), q.Y(80), "赤い点: 2 つの式の差が 5 % を超える所", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0.02), q.Y(80) + 15, "（約 40°。それより前はよく合う）", "start", 9.5, ALI, halo=True))
    o.append(_f02_m(330, 258, [_f02_t("線形化した式: "), ("p̈", None, True), _f02_t(" = 2"), _f02_v("u"), _f02_t(" − 3.924"), ("φ", None, True), _f02_t("、d²"),
                               ("φ", None, True), _f02_t("/d"), _f02_v("t"), _f02_t("² = 45.78"), ("φ", None, True), _f02_t(" − 6.667"), _f02_v("u")], "start", 11, INK))
    return SVG(700, 270, o, "台車に立てた振子（例の値: 台車 0.5 kg、おもり 0.2 kg、長さ 0.3 m）。(a) 台車を押す力 u が入力、台車の位置 p と振子の傾き φ が出力。(b) 小さな傾きから力を加えずに放すと、傾きは増え続けて倒れる。実線は元の式、破線は真上で線形化した式。傾きが 40° 近くになるまでは、2 つの式はよく合う。")
F["e02_ipend"] = _f02_ipend_fig()


# =====================================================================
# 6 節: オイラー法とルンゲ・クッタ法
# =====================================================================
def _f02_euler_fig():
    o = []
    m, c, u = 1.0, 2.0, 1.0
    f = lambda v: (u - c * v) / m
    exact = lambda t: 0.5 * (1 - math.exp(-2 * t))
    o.append(T(14, 18, "(a) 刻みの始めの傾きのまま進む", "start", 11.5, INK, True))
    p = Plot(62, 34, 330, 190, (0, 1.5), (0, 0.6))
    o.append(p.axes(xl="時間 t [s]", yl="速度 y [m/s]", xt=[0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5], yt=[0, 0.2, 0.4, 0.6], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    for t in _f02_np.arange(0.125, 1.5, 0.25):
        for v in _f02_np.arange(0.05, 0.6, 0.1):
            o.append(_f02_seg(p, t, v, f(v), L=11, c=FNT, lw=1.0))
    o.append(_f02_pl(p, [(t, exact(t)) for t in _f02_np.linspace(0, 1.5, 151)], c=SIG, lw=2.4))
    for dt, col, r in ((0.25, ALI, 3.8), (0.05, GRN, 2.4)):
        pts = [(0.0, 0.0)]
        while pts[-1][0] < 1.5 - 1e-9:
            t, v = pts[-1]
            pts.append((t + dt, v + dt * f(v)))
        o.append(_f02_pl(p, pts, c=col, lw=1.6))
        for t, v in pts:
            o.append(D(p.X(t), p.Y(v), col, r))
    o.append(DIM(p.X(0.25) + 9, p.Y(exact(0.25)), p.X(0.25) + 9, p.Y(0.25), None, c=ALI))
    o.append(T(p.X(0.25) - 6, p.Y(0.25) - 14, "0.25 と計算", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.25) + 18, p.Y(exact(0.25)) + 14, "本当は 0.197", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.48), p.Y(0.12), "赤: Δt = 0.25 s　緑: Δt = 0.05 s", "end", 9.5, MUT, True, halo=True))
    o.append(T(p.X(1.48), p.Y(0.12) + 15, "青: 本当の解", "end", 9.5, SIG, True, halo=True))
    # (b) 計算の手順（筆算のように）
    x0 = 418
    o.append(T(x0, 18, "(b) Δt = 0.25 s の計算", "start", 11.5, INK, True))
    o.append(_f02_m(x0, 40, [_f02_t("変わる速さ: "), ("ẏ", None, True), _f02_t(" = ("), _f02_v("u"), _f02_t(" − "), _f02_v("c"), _f02_v("y"), _f02_t(") ÷ "), _f02_v("m"), _f02_t(" = 1 − 2"), _f02_v("y")], "start", 10.5, INK))
    cols = [x0 + 18, x0 + 74, x0 + 136, x0 + 210, x0 + 262]
    heads = ["時刻 t", "今の y", "ẏ", "次の y", "本当"]
    for xx, hh in zip(cols, heads):
        o.append(T(xx, 66, hh, "middle", 10, INK if hh != "本当" else SIG, True))
    o.append(W(x0, 72, x0 + 284, 72, c=LIN, lw=1))
    y, t = 0.0, 0.0
    for k in range(4):
        yd = f(y); yn = y + 0.25 * yd
        yy = 90 + k * 24
        o.append(T(cols[0], yy, "%g" % t, "middle", 10.5, MUT))
        o.append(T(cols[1], yy, "%g" % y, "middle", 10.5, INK))
        o.append(T(cols[2], yy, "%g" % yd, "middle", 10.5, GLD, True))
        o.append(T(cols[3], yy, "%g" % yn, "middle", 10.5, ALI, True))
        o.append(T(cols[4], yy, "%.3f" % exact(t + 0.25), "middle", 10.5, SIG))
        o.append(T((cols[2] + cols[3]) / 2, yy - 1, "→", "middle", 10, MUT))
        y, t = yn, t + 0.25
    o.append(W(x0, 186, x0 + 284, 186, c=LIN, lw=1))
    o.append(T(x0, 204, "次の y ＝ 今の y ＋ Δt × ẏ", "start", 10, INK, True))
    o.append(T(x0, 220, "（例: 0.25 + 0.25 × 0.5 = 0.375）", "start", 9.5, MUT))
    o.append(T(x0, 238, "本当: 次の時刻（t + Δt）の本当の値", "start", 9.5, SIG))
    o.append(T(x0, 255, "始めの傾きのまま進むので、大きめに外れる", "start", 9.5, MUT))
    return SVG(700, 268, o, "ばねの無い台車の速度 y（1 N で押す、初期値 0）をオイラー法で求める。(a) 各刻みは、刻みの始めの点の傾き（灰色の短い線）のまま Δt だけ直線で進む。刻みが粗い（赤）と大きめに外れ、細かい（緑）と本当の解（青）に近い。(b) Δt = 0.25 s の計算の手順。今の y から式で変わる速さを求め、Δt を掛けて足す。")
F["e02_euler"] = _f02_euler_fig()


def _f02_rk4_fig():
    o = []
    m, c, u = 1.0, 2.0, 1.0
    f = lambda v: (u - c * v) / m
    exact = lambda t: 0.5 * (1 - math.exp(-2 * t))
    o.append(T(14, 18, "(a) 1 刻み（Δt = 0.5 s）の中で傾きを 4 回求める", "start", 11.5, INK, True))
    q = Plot(70, 34, 300, 190, (0, 0.56), (-0.03, 0.55))
    o.append(q.axes(xl="時間 t [s]", yl="速度 y [m/s]", xt=[0, 0.25, 0.5], yt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(_f02_pl(q, [(t, exact(t)) for t in _f02_np.linspace(0, 0.5, 101)], c=SIG, lw=2.4))
    h = 0.5
    s1 = f(0.0); s2 = f(h / 2 * s1); s3 = f(h / 2 * s2); s4 = f(h * s3)
    pts = [(0.0, 0.0, s1, "①", (8, -2)), (h / 2, h / 2 * s1, s2, "②", (-12, -4)), (h / 2, h / 2 * s2, s3, "③", (-12, 10)), (h, h * s3, s4, "④", (-12, -4))]
    o.append(_f02_pl(q, [(0, 0), (h, h * s1)], c=ALI, lw=1.6, dash="4 3"))
    for t, v, sl, lab, (dx, dy) in pts:
        tt = 0.05
        o.append(_f02_pl(q, [(t, v), (t + tt, v + sl * tt)], c=GLD, lw=2.6))
        o.append(D(q.X(t), q.Y(v), GLD, 3.6))
        o.append(T(q.X(t) + dx, q.Y(v) + dy, lab, "middle", 11, GLD, True, halo=True))
    yr = h / 6 * (s1 + 2 * s2 + 2 * s3 + s4)
    o.append(D(q.X(h), q.Y(yr), GRN, 4.6))
    o.append(D(q.X(h), q.Y(h * s1), ALI, 4.6))
    o.append(T(q.X(h) - 8, q.Y(h * s1) + 4, "オイラー法 0.5", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(h) - 8, q.Y(yr) + 15, "0.3125", "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(h) - 8, q.Y(yr) + 29, "（本当は 0.316）", "end", 9.5, SIG, True, halo=True))
    # (b) 計算
    x0 = 400
    o.append(T(x0, 18, "(b) 計算（ẏ = 1 − 2y）", "start", 11.5, INK, True))
    lines = [("① 始めの点 (0, 0):", "ẏ₁ = 1 − 2 × 0 = 1", GLD),
             ("② ①の傾きで Δt/2 進んだ点 (0.25, 0.25):", "ẏ₂ = 1 − 2 × 0.25 = 0.5", GLD),
             ("③ ②の傾きで Δt/2 進んだ点 (0.25, 0.125):", "ẏ₃ = 1 − 2 × 0.125 = 0.75", GLD),
             ("④ ③の傾きで Δt 進んだ点 (0.5, 0.375):", "ẏ₄ = 1 − 2 × 0.375 = 0.25", GLD)]
    yy = 44
    for a_, b_, c_ in lines:
        o.append(T(x0, yy, a_, "start", 9.5, INK))
        o.append(T(x0 + 18, yy + 15, b_, "start", 10, c_, True))
        yy += 36
    o.append(W(x0, yy - 8, x0 + 290, yy - 8, c=LIN, lw=1))
    o.append(T(x0, yy + 8, "平均の傾き (1 + 2×0.5 + 2×0.75 + 0.25) ÷ 6 = 0.625", "start", 9.5, INK, True))
    o.append(T(x0, yy + 26, "y(0.5) ≈ 0 + 0.5 × 0.625 = 0.3125", "start", 10, GRN, True))
    o.append(T(x0, yy + 44, "オイラー法: 0 + 0.5 × 1 = 0.5（本当は 0.316）", "start", 9.5, ALI))
    return SVG(700, 262, o, "ルンゲ・クッタ法の 1 刻み（ばねの無い台車の速度、初期値 0、Δt = 0.5 s）。(a) 1 刻みの中の 4 か所で傾き（金色）を求める。(b) 4 つの傾きを 1:2:2:1 の重みで平均した傾きで進むと 0.3125 m/s で、本当の 0.316 m/s に近い。始めの傾きのまま進むオイラー法は 0.5 m/s と答える。")
F["e02_rk4"] = _f02_rk4_fig()


def _f02_euler_dt_fig():
    o = []
    T_, Kv = 0.05, 600.0
    exact = lambda t: Kv * (1 - math.exp(-t / T_))
    cases = [(0.010, "(a) Δt = 10 ms（0.2T）: 倍率 0.8", (0, 800), [0, 200, 400, 600], GRN, "単調に近づく"),
             (0.075, "(b) Δt = 75 ms（1.5T）: 倍率 −0.5", (0, 1000), [0, 300, 600, 900], GLD, "振動しながら近づく"),
             (0.100, "(c) Δt = 100 ms（2T）: 倍率 −1", (0, 1300), [0, 600, 1200], ALI, "同じ幅で振れ続ける"),
             (0.110, "(d) Δt = 110 ms（2.2T）: 倍率 −1.2", (-800, 1800), [-600, 0, 600, 1200, 1800], ALI, "発散する")]
    for k, (dt, title, yr, yt, col, note) in enumerate(cases):
        x = 62 if k % 2 == 0 else 412
        y = 34 if k < 2 else 210
        o.append(T(x - 48, y - 14, title, "start", 11, INK, True))
        p = Plot(x, y, 262, 120, (0, 0.5), yr)
        o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yt=yt, xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(p.line([(0, 600), (0.5, 600)], c=FNT, lw=1, dash="3 3"))
        o.append(_f02_pl(p, [(t, exact(t)) for t in _f02_np.linspace(0, 0.5, 201)], c=SIG, lw=2.2))
        pts = [(0.0, 0.0)]
        while pts[-1][0] + dt <= 0.5 + 1e-9:
            t, w = pts[-1]
            pts.append((t + dt, w + dt * (Kv - w) / T_))
        o.append(_f02_pl(p, pts, c=col, lw=1.5))
        for t, w in pts:
            if yr[0] <= w <= yr[1]:
                o.append(D(p.X(t), p.Y(w), col, 3.4))
        o.append(T(p.X(0.49), p.y + 13, note, "end", 9.5, col, True, halo=True))
    # (e) 刻み幅と誤差
    o.append(T(14, 386, "(e) t = T でのずれの誤差と刻み幅（T ẏ + y = Ku）", "start", 11, INK, True))
    e = Plot(110, 400, 300, 130, (0.01, 1.0), (1e-12, 1.0), xlog=True, ylog=True)
    _sup = str.maketrans("-0123456789", "⁻⁰¹²³⁴⁵⁶⁷⁸⁹")
    o.append(e.axes(xl="刻み幅 Δt / T", yl=None, xt=[0.01, 0.1, 1.0], yt=[1e-12, 1e-9, 1e-6, 1e-3, 1.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("10" + str(round(math.log10(v))).translate(_sup)) if v < 1 else "1"))
    o.append(T(e.x - 54, e.y + e.h / 2 + 4, "誤差", "middle", 9.5, MUT))
    rs = [1.0 / n for n in range(1, 101)]
    eu = [(r, abs((1 - r) ** round(1 / r) - math.exp(-1)) / math.exp(-1)) for r in rs if r < 1]
    rk = [(r, abs((1 - r + r * r / 2 - r ** 3 / 6 + r ** 4 / 24) ** round(1 / r) - math.exp(-1)) / math.exp(-1)) for r in rs]
    o.append(_f02_pl(e, sorted(eu), c=ALI, lw=2.2))
    o.append(_f02_pl(e, sorted(rk), c=GRN, lw=2.2))
    o.append(D(e.X(0.1), e.Y(0.0522), ALI, 3.8)); o.append(D(e.X(0.1), e.Y(9.06e-7), GRN, 3.8))
    o.append(T(e.X(0.1) - 8, e.Y(0.0522) - 6, "オイラー法 5.2 %", "end", 9.5, ALI, True, halo=True))
    o.append(T(e.X(0.1) + 8, e.Y(9.06e-7) + 14, "ルンゲ・クッタ法 0.0001 %", "start", 9.5, GRN, True, halo=True))
    xt = 450
    o.append(T(xt, 418, "刻み幅を 1/10 にすると、誤差は", "start", 10, INK))
    o.append(T(xt, 436, "オイラー法: 約 1/10（刻み幅に比例）", "start", 10, ALI, True))
    o.append(T(xt, 454, "ルンゲ・クッタ法: 約 1/10000", "start", 10, GRN, True))
    o.append(T(xt, 472, "（刻み幅の 4 乗に比例）", "start", 10, GRN))
    o.append(T(xt, 500, "どちらも、発散しない刻み幅に上限がある", "start", 10, INK))
    o.append(T(xt, 518, "（1 階の式で 2T と 2.79T）", "start", 10, MUT))
    return SVG(700, 572, o, "刻み幅を変えてオイラー法で解く（モータの一次の式、T = 0.05 s、12 V で 0 から 600 rad/s へ）。点は計算した値、青は本当の解。落ち着く値からのずれは、1 刻みごとに 1 − Δt/T 倍になる。(a) Δt < T では単調に近づき、(b) T < Δt < 2T では振動しながら近づき、(c) Δt = 2T では同じ幅で振れ続け、(d) Δt > 2T では発散する。(e) t = T での、落ち着く値からのずれの誤差（本当のずれに対する割合）。オイラー法は刻み幅に、ルンゲ・クッタ法は刻み幅の 4 乗にほぼ比例する。")
F["e02_euler_dt"] = _f02_euler_dt_fig()
