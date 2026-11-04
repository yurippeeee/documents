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
    o.append(BOX(bx, by, bw, bh, "モデル", "微分方程式", SIG, SSOFT, sz=12, ssz=10))
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
    return SVG(700, y0 + 108 + 4 * 17 - 4, o, "制御対象のモデル。どの対象も、入力（操作量）と外乱を受けて出力（制御量）を返す箱として表せ、箱の中身が微分方程式である。下は、この章で式を作る 5 つの対象と、それぞれ何の釣り合いから式を作るか。")
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
