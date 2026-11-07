# -*- coding: utf-8 -*-
# 03 章 一次遅れの応答 の図
import numpy as _f03_np

# ---- 例の値（本文と同じ） ----
_F03_MOT = (50.0, 0.05, 12.0)          # モータ: K [(rad/s)/V]、T [s]、電圧 [V]
_F03_CART = (0.5, 0.5)                  # 台車の速度: K = 1/c、T = m/c
_F03_PLATE = (1.25, 500.0, 20.0, 40.0)  # 温度の板: K [K/W]、T [s]、L [s]、ヒータの電力のステップ [W]


def _f03_step(K, T, du, t, L=0.0):
    """一次遅れ（＋むだ時間）のステップ応答。"""
    t = _f03_np.asarray(t, float)
    return _f03_np.where(t >= L, K * du * (1 - _f03_np.exp(-_f03_np.maximum(t - L, 0.0) / T)), 0.0)


def _f03_pl(p, pts, c=SIG, lw=2.0, dash=None):
    """Plot p の範囲で切った折れ線（範囲の外に出る所で線を切る）。"""
    lo, hi = min(p.yr), max(p.yr)
    xl, xh = min(p.xr), max(p.xr)
    segs, cur, prev = [], [], None
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
        if inside:
            cur.append((a, b))
        prev = (a, b)
    if cur:
        segs.append(cur)
    return "".join(PL([(p.X(a), p.Y(b)) for a, b in s], c=c, lw=lw, dash=dash) for s in segs if len(s) >= 2)


def _f03_fmt(v):
    """目盛の数字（余分な 0 を付けない）。"""
    if abs(v) < 1e-12:
        return "0"
    return ("%.4g" % v)


# ---- 小さな絵（1 節の 5 つの対象） ----
def _f03_icon_cart(cx, cy):
    o = [W(cx - 46, cy + 14, cx + 46, cy + 14, c=MUT, lw=1.4),
         RECT(cx - 20, cy - 12, 40, 20, 4, SSOFT, SIG, 1.5),
         CIRC(cx - 11, cy + 10, 4, c=SIG, lw=1.3, fill=SCR), CIRC(cx + 11, cy + 10, 4, c=SIG, lw=1.3, fill=SCR),
         ARR(cx - 44, cy - 2, cx - 22, cy - 2, c=GLD, lw=1.8, head=6),
         ARR(cx + 24, cy - 16, cx + 44, cy - 16, c=SIG, lw=1.4, head=5)]
    return "".join(o)


def _f03_icon_rc(cx, cy):
    x0, x1, yt, yb = cx - 34, cx + 30, cy - 16, cy + 16
    pts = [(x0 + 12, yt)]
    for i in range(6):
        pts.append((x0 + 16 + i * 4, yt + (-4 if i % 2 == 0 else 4)))
    pts.append((x0 + 40, yt))
    o = [W(x0, cy - 8, x0, yt, x0 + 12, yt, c=INK, lw=1.3), PL(pts, c=INK, lw=1.3),
         W(x0 + 40, yt, x1, yt, x1, cy - 3, c=INK, lw=1.3),
         W(x1 - 8, cy - 3, x1 + 8, cy - 3, c=SIG, lw=2.2), W(x1 - 8, cy + 3, x1 + 8, cy + 3, c=SIG, lw=2.2),
         W(x1, cy + 3, x1, yb, x0, yb, x0, cy + 8, c=INK, lw=1.3),
         CIRC(x0, cy, 8, c=GLD, lw=1.5, fill=SCR)]
    return "".join(o)


def _f03_icon_motor(cx, cy):
    o = [W(cx - 46, cy - 8, cx - 32, cy - 8, c=GLD, lw=1.6), W(cx - 46, cy + 6, cx - 32, cy + 6, c=GLD, lw=1.6),
         RECT(cx - 32, cy - 15, 30, 28, 5, SSOFT, SIG, 1.4),
         W(cx - 2, cy - 1, cx + 14, cy - 1, c=INK, lw=2.2), CIRC(cx + 26, cy - 1, 13, c=MUT, lw=1.4, fill=MSOFT),
         W(cx + 26, cy - 1, cx + 26, cy - 13, c=SIG, lw=1.8)]
    return "".join(o)


def _f03_icon_plate(cx, cy):
    o = [RECT(cx - 40, cy, 80, 9, 2, MSOFT, MUT, 1.3), RECT(cx - 32, cy + 9, 64, 5, 1, GOSOFT, GLD, 1.1)]
    for xx in (cx - 22, cx, cx + 22):
        o.append(PATH("M%g,%g c-4,-5 4,-9 0,-13 c-4,-5 4,-9 0,-11" % (xx, cy - 3), c=MUT, lw=1.2))
    o.append(RECT(cx + 26, cy - 7, 11, 7, 2, TSOFT, TEA, 1.1))
    return "".join(o)


def _f03_icon_tank(cx, cy):
    x0, x1, yt, yb = cx - 22, cx + 20, cy - 18, cy + 16
    o = [RECT(x0, cy - 2, x1 - x0, yb - cy + 2, 0, SSOFT, "none", 0),
         W(x0, yt, x0, yb, x1, yb, x1, yt, c=INK, lw=1.5),
         W(cx - 42, yt - 4, cx - 12, yt - 4, cx - 12, yt + 4, c=GLD, lw=2),
         _head(cx - 12, yt - 2, cx - 12, yt + 8, GLD, 6),
         PATH("M%g,%g q9,0 13,12" % (x1, yb - 3), c=TEA, lw=1.5)]
    return "".join(o)


# =====================================================================
# 1 節: 5 つの対象の応答は、目盛を変えると同じ形
# =====================================================================
def _f03_family_fig():
    o = []
    items = [
        ("台車の速度", _f03_icon_cart, 0.5, 0.5, 2.0, "2 N", 0.0, "速度 [m/s]", [0, 1, 2], [0, 0.5, 1.0], "(m/s)/N"),
        ("RC 回路", _f03_icon_rc, 1.0, 0.1, 5.0, "5 V", 0.0, "電圧 [V]", [0, 0.2, 0.4], [0, 2.5, 5], ""),
        ("DC モータ", _f03_icon_motor, 50.0, 0.05, 12.0, "12 V", 0.0, "角速度 [rad/s]", [0, 0.1, 0.2], [0, 300, 600], "(rad/s)/V"),
        ("温度の板", _f03_icon_plate, 1.25, 500.0, 40.0, "40 W", 25.0, "温度 [°C]", [0, 1000, 2000], [25, 50, 75], "K/W"),
        ("水槽（線形化）", _f03_icon_tank, 2500.0, 50.0, 0.02e-3, "+0.02 L/s", 0.0, "水位のずれ [cm]", [0, 100, 200], [0, 2.5, 5], "s/m²"),
    ]
    cw = 137.0
    for i, (nm, icon, K, Tc, du, dus, off, yl, xt, yt, ku) in enumerate(items):
        x0 = 10 + i * cw
        cx = x0 + cw / 2
        o.append(icon(cx, 40))
        o.append(T(cx, 84, nm, "middle", 11, INK, True))
        o.append(T(cx, 100, "入力 " + dus + " を加える", "middle", 9.5, GLD))
        fin = K * du * (100.0 if nm.startswith("水槽") else 1.0) + off
        y0, y1 = (off, off + (fin - off) * 1.15)
        p = Plot(x0 + 40, 114, cw - 52, 84, (0, 5 * Tc), (y0, y1))
        o.append(p.axes(xl=None, yl=None, xt=xt, yt=yt, xfmt=_f03_fmt, yfmt=_f03_fmt))
        ts = _f03_np.linspace(0, 5 * Tc, 121)
        ys = off + (fin - off) * (1 - _f03_np.exp(-ts / Tc))
        o.append(p.line([(a, b) for a, b in zip(ts, ys)], c=SIG, lw=2.2))
        o.append(W(p.X(0), p.Y(fin), p.X(5 * Tc), p.Y(fin), c=MUT, lw=1, dash="4 3"))
        o.append(D(p.X(Tc), p.Y(off + (fin - off) * 0.632), SIG, 3.4))
        o.append(T(p.x + p.w / 2, p.y + p.h + 30, "時間 [s]", "middle", 9.5, MUT))
        o.append(T(cx, 248, yl, "middle", 9.5, SIG))
        o.append(TX(cx, 266, "T = %g s" % Tc, "middle", 10, INK, True))
        o.append(TX(cx, 282, ("K = %g " % K) + ku, "middle", 9.5, INK))
    o.append(W(10, 292, 690, 292, c=LIN, lw=0.8))
    o.append(T(350, 308, "点は時刻 T。どの対象でも、落ち着く値の 63.2 % の高さにある（2 節）", "middle", 10, SIG, True))
    return SVG(700, 316, o, "2 章の 5 つの対象に、入力を急に加えて一定に保ったときの出力（入力の大きさは例の値）。横軸と縦軸の目盛は対象ごとに違い、時定数は 0.05 s から 500 s まで 1 万倍違うが、曲線の形はまったく同じである。温度の板は周りの温度 25 °C から、水槽は動作点の水位からのずれを描いた。")
F["e03_family"] = _f03_family_fig()


# =====================================================================
# 1 節: どの時刻の接線も T 後に落ち着く値に届く・一次遅れのブロック線図
# =====================================================================
def _f03_rate_fig():
    o = []
    K, Tm, V = _F03_MOT
    fin = K * V
    o.append(T(14, 18, "(a) モータに 12 V を加えたときの角速度と接線", "start", 11.5, INK, True))
    p = Plot(66, 34, 330, 190, (0, 0.25), (0, 700))
    o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yt=[0, 200, 400, 600], xfmt=_f03_fmt))
    o.append(W(p.X(0), p.Y(fin), p.X(0.25), p.Y(fin), c=MUT, lw=1.2, dash="5 3"))
    o.append(T(p.X(0.248), p.Y(fin) - 6, "落ち着く値 Ku = 600", "end", 9.5, MUT, halo=True))
    ts = _f03_np.linspace(0, 0.25, 251)
    o.append(p.line(list(zip(ts, fin * (1 - _f03_np.exp(-ts / Tm)))), c=SIG, lw=2.4))
    t0s = [0.0, 0.025, 0.05, 0.1]
    for t0 in t0s:
        y0 = fin * (1 - math.exp(-t0 / Tm))
        o.append(W(p.X(t0), p.Y(y0), p.X(t0 + Tm), p.Y(fin), c=GLD, lw=1.4, dash="5 3"))
        o.append(D(p.X(t0), p.Y(y0), SIG, 3.6))
        o.append(D(p.X(t0 + Tm), p.Y(fin), GLD, 3.4))
    # 残りの棒（t = 0.05 s）
    y5 = fin * (1 - math.exp(-1))
    o.append(DIM(p.X(0.05) - 7, p.Y(y5), p.X(0.05) - 7, p.Y(fin), None, c=PUR))
    o.append(T(p.X(0.05) - 12, p.Y((y5 + fin) / 2) + 4, "残り 221", "end", 9.5, PUR, True, halo=True))
    o.append(T(p.X(0.004), p.Y(300), "接線", "start", 9.5, GLD, True, halo=True))
    # 表
    yt = 268
    hdr = [("接線を引く時刻", 66), ("残り [rad/s]", 176), ("変わる速さ [rad/s²]", 262), ("600 に届く時刻", 382)]
    for s, x in hdr:
        o.append(T(x, yt, s, "start", 9.5, MUT, True))
    o.append(W(66, yt + 5, 470, yt + 5, c=LIN, lw=0.8))
    for k, t0 in enumerate(t0s):
        y0 = fin * (1 - math.exp(-t0 / Tm)); rem = fin - y0
        yy = yt + 20 + k * 16
        o.append(T(66 + 50, yy, "%g s" % t0, "end", 10, INK))
        o.append(T(176 + 52, yy, "%.0f" % rem, "end", 10, PUR))
        o.append(T(262 + 76, yy, "%.0f" % (rem / Tm), "end", 10, GLD))
        o.append(T(382 + 56, yy, "%g s" % round(t0 + Tm, 4), "end", 10, SIG, True))
    o.append(T(480, yt + 52, "どれも +0.05 s", "start", 10, SIG, True))
    o.append(T(480, yt + 66, "（= T）", "start", 10, SIG, True))
    # (b) ブロック線図
    xb = 440
    o.append(T(xb, 18, "(b) 同じ式のブロック線図", "start", 11.5, INK, True))
    yy = 104
    o.append(ARR(xb, yy, xb + 20, yy, c=GLD, lw=1.8))
    o.append(TX(xb + 2, yy - 9, "u", "start", 10.5, GLD, True))
    o.append(BOX(xb + 20, yy - 16, 30, 32, "× K", None, LIN, PAN, sz=10.5))
    sx = xb + 90
    o.append(ARR(xb + 50, yy, sx - 15, yy, c=GLD, lw=1.8))
    o.append(TX(xb + 62, yy - 9, "Ku", "middle", 10, GLD, True))
    o.append(SUMJ(sx, yy, {"l": "+", "b": "−"}))
    o.append(ARR(sx + 15, yy, sx + 44, yy, c=PUR, lw=1.8))
    o.append(T(sx + 29, yy - 26, "残り", "middle", 10, PUR, True))
    o.append(TX(sx + 29, yy - 12, "Ku − y", "middle", 9.5, PUR))
    o.append(BOX(sx + 44, yy - 16, 42, 32, "× 1/T", None, LIN, PAN, sz=10))
    o.append(ARR(sx + 86, yy, sx + 104, yy, c=SIG, lw=1.8))
    o.append(T(sx + 95, yy - 9, "ẏ", "middle", 11, SIG, True))
    o.append(BOX(sx + 104, yy - 16, 38, 32, "積分", None, SIG, PAN, sz=10))
    bp = sx + 152
    o.append(ARR(sx + 142, yy, bp + 16, yy, c=SIG, lw=1.8))
    o.append(T(bp + 6, yy - 9, "y", "middle", 11, SIG, True))
    o.append(D(bp, yy, SIG, 3.8))
    o.append(W(bp, yy, bp, yy + 50, sx, yy + 50, c=SIG, lw=1.6))
    o.append(ARR(sx, yy + 50, sx, yy + 15, c=SIG, lw=1.6))
    o.append(T(xb, 186, "残りを T で割った速さで", "start", 10, INK))
    o.append(T(xb, 201, "出力を直す。「積分」の箱は、", "start", 10, INK))
    o.append(T(xb, 216, "変わる速さを時間で積み上げて", "start", 10, INK))
    o.append(T(xb, 231, "出力の値にする。", "start", 10, INK))
    return SVG(700, 346, o, "一次遅れの変わる速さ（T = 0.05 s、K = 50 (rad/s)/V、12 V）。(a) どの時刻でも、変わる速さは残り（落ち着く値までの差）÷ T なので、その時刻の接線は、ちょうど T 後に落ち着く値に届く。残りが減ると速さも同じ割合で減るので、出力は近づくほどゆっくりになる。(b) 同じ式を、残りを測ってその 1/T 倍の速さで直す仕組みとして描いたもの。")
F["e03_rate"] = _f03_rate_fig()


# =====================================================================
# 2 節: ステップ応答の読み方（63.2 % の点・接線・3T で 95 %）と、残りの対数の目盛
# =====================================================================
def _f03_step_fig():
    o = []
    K, Tm, V = _F03_MOT
    fin = K * V
    o.append(T(14, 18, "(a) モータのステップ応答（12 V、T = 0.05 s）", "start", 11.5, INK, True))
    p = Plot(66, 46, 380, 210, (0, 0.3), (0, 700))
    o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3], yt=[0, 100, 200, 300, 400, 500, 600, 700], xfmt=_f03_fmt))
    # 上の目盛（t/T）
    for k in range(7):
        o.append(T(p.X(k * Tm), p.y - 5, "%dT" % k if k else "0", "middle", 9.5, SIG))
    o.append(T(p.x - 10, p.y - 5, "t:", "end", 9.5, SIG))
    o.append(W(p.X(0), p.Y(fin), p.X(0.3), p.Y(fin), c=MUT, lw=1.2, dash="5 3"))
    ts = _f03_np.linspace(0, 0.3, 301)
    o.append(p.line(list(zip(ts, fin * (1 - _f03_np.exp(-ts / Tm)))), c=SIG, lw=2.6))
    # 接線
    o.append(W(p.X(0), p.Y(0), p.X(Tm), p.Y(fin), c=GLD, lw=1.5, dash="6 3"))
    o.append(T(p.X(0.004), p.Y(668), "t = 0 の接線（傾き 12000 rad/s²）は t = T で 600 に届く", "start", 9.5, GLD, True, halo=True))
    # 63.2 %
    y63 = fin * (1 - math.exp(-1))
    o.append(W(p.X(0), p.Y(y63), p.X(Tm), p.Y(y63), c=SIG, lw=1, dash="3 3"))
    o.append(W(p.X(Tm), p.Y(y63), p.X(Tm), p.Y(0), c=SIG, lw=1, dash="3 3"))
    o.append(D(p.X(Tm), p.Y(y63), SIG, 4.4))
    o.append(T(p.X(Tm) + 8, p.Y(y63) + 16, "63.2 %（379.3 rad/s）", "start", 10, SIG, True, halo=True))
    o.append(D(p.X(Tm), p.Y(fin), GLD, 4))
    # 3T で 95 %
    y95 = fin * (1 - math.exp(-3))
    o.append(D(p.X(3 * Tm), p.Y(y95), SIG, 4))
    o.append(W(p.X(3 * Tm), p.Y(y95), p.X(3 * Tm), p.Y(0), c=SIG, lw=1, dash="3 3"))
    o.append(T(p.X(3 * Tm) + 6, p.Y(y95) + 18, "3T で 95.0 %（570.1）", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(0.298), p.Y(fin) + 14, "落ち着く値 KΔu = 600", "end", 9.5, MUT, halo=True))
    # (b) 残り（片対数）
    xb = 500
    o.append(T(xb - 14, 18, "(b) 残り（落ち着く値との差）", "start", 11.5, INK, True))
    q = Plot(xb + 36, 46, 150, 210, (0, 5), (0.005, 1.0), ylog=True)
    yt = [1.0, 0.368, 0.135, 0.0498, 0.0183, 0.0067]
    for v in yt:
        o.append(W(q.x, q.Y(v), q.x + q.w, q.Y(v), c=GRD, lw=1))
    o.append(q.axes(xl="t/T", yl=None, xt=[0, 1, 2, 3, 4, 5], yt=[], grid=True))
    for v, s in zip(yt, ["100 %", "36.8 %", "13.5 %", "4.98 %", "1.83 %", "0.67 %"]):
        o.append(W(q.x - 4, q.Y(v), q.x, q.Y(v), c=MUT, lw=1))
        o.append(T(q.x - 7, q.Y(v) + 3.3, s, "end", 9.5, MUT))
    o.append(q.line([(0, 1.0), (5, math.exp(-5))], c=PUR, lw=2.4))
    for k in range(6):
        o.append(D(q.X(k), q.Y(math.exp(-k)), PUR, 3.4))
    o.append(T(q.x + q.w, q.y - 8, "対数の目盛", "end", 9.5, MUT))
    o.append(T(q.X(2.6), q.Y(0.3), "T ごとに", "start", 9.5, PUR, True, halo=True))
    o.append(T(q.X(2.6), q.Y(0.3) + 13, "0.368 倍", "start", 9.5, PUR, True, halo=True))
    return SVG(700, 300, o, "一次遅れのステップ応答の読み方。(a) 時刻 T に落ち着く値の 63.2 % に届き、t = 0 の接線は t = T で落ち着く値に届く。3T で 95.0 % に届き、ほぼ落ち着く。(b) 落ち着く値との差（残り）は T ごとに 0.368 倍になるので、対数の目盛で描くと直線になる。")
F["e03_step"] = _f03_step_fig()


# =====================================================================
# 2 節: T と KΔu の役割（慣性モーメントを変える・電圧を変える）
# =====================================================================
def _f03_vary_fig():
    o = []
    K, Tm, V = _F03_MOT
    ts = _f03_np.linspace(0, 0.4, 401)
    o.append(T(14, 18, "(a) 慣性モーメント J を変える（T だけが変わる）", "start", 11.5, INK, True))
    p = Plot(66, 34, 250, 190, (0, 0.4), (0, 1000))
    o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 200, 400, 600, 800, 1000], xfmt=_f03_fmt))
    o.append(W(p.X(0), p.Y(600), p.X(0.4), p.Y(600), c=MUT, lw=1, dash="5 3"))
    cases = [(0.5, 0.025, TEA, "J 半分: T = 0.025 s"), (1.0, 0.05, SIG, "例: T = 0.05 s"), (2.0, 0.1, PUR, "J 2 倍: T = 0.1 s")]
    for k, (jr, T_, c, lab) in enumerate(cases):
        o.append(p.line(list(zip(ts, K * V * (1 - _f03_np.exp(-ts / T_)))), c=c, lw=2.2))
        o.append(D(p.X(T_), p.Y(K * V * 0.632), c, 4))
        o.append(TX(p.X(0.398), p.Y(420) - 34 + k * 17 + 60, lab, "end", 9.5, c, True, halo=True))
    o.append(T(p.X(0.398), p.Y(600) - 6, "落ち着く値はどれも 600", "end", 9.5, MUT, halo=True))
    # (b) 電圧を変える
    xb = 390
    o.append(T(xb - 20, 18, "(b) 電圧 Δu を変える（KΔu だけが変わる）", "start", 11.5, INK, True))
    q = Plot(xb + 46, 34, 250, 190, (0, 0.4), (0, 1000))
    o.append(q.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 200, 400, 600, 800, 1000], xfmt=_f03_fmt))
    o.append(W(q.X(Tm), q.y, q.X(Tm), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    for k, (vv, c) in enumerate(((6.0, TEA), (12.0, SIG), (18.0, PUR))):
        fin = K * vv
        o.append(W(q.X(0), q.Y(fin), q.X(0.4), q.Y(fin), c=c, lw=1, dash="4 3"))
        o.append(q.line(list(zip(ts, fin * (1 - _f03_np.exp(-ts / Tm)))), c=c, lw=2.2))
        o.append(D(q.X(Tm), q.Y(fin * 0.632), c, 4))
        o.append(T(q.X(0.398), q.Y(fin) - 6, "%g V → %g rad/s" % (vv, fin), "end", 9.5, c, True, halo=True))
    o.append(T(q.X(Tm) + 4, q.y + q.h - 6, "どれも 0.05 s で 63.2 %", "start", 9.5, INK, True, halo=True))
    return SVG(700, 270, o, "時定数と定常ゲインの役割（モータ、点は 63.2 % の点）。(a) 回す物の慣性モーメント J を変えると時定数だけが変わり、同じ形の曲線が時間の向きに伸び縮みする。(b) 電圧を変えると落ち着く値だけが変わり、63.2 % に届く時刻は同じである。定常ゲイン K を変えたときも (b) と同じになる。")
F["e03_vary"] = _f03_vary_fig()


# =====================================================================
# 3 節: パルスは 2 つのステップの和（台車を 2 N で 1 s 押す）
# =====================================================================
def _f03_pulse_fig():
    o = []
    K, Tc = _F03_CART
    du, tw = 2.0, 1.0
    ts = _f03_np.linspace(0, 4, 401)
    s1 = _f03_step(K, Tc, du, ts)
    s2 = -_f03_step(K, Tc, du, ts, L=tw)
    o.append(T(14, 18, "(a) 入力: 押す力 [N]", "start", 11.5, INK, True))
    o.append(T(380, 18, "(b) 応答: 台車の速度 [m/s]", "start", 11.5, INK, True))
    rows = [
        ("パルス（2 N を 1 s）", [(0, 0), (0, du), (tw, du), (tw, 0), (4, 0)], GLD, s1 + s2, SIG, "応答 = 2 つの和"),
        ("時刻 0 の +2 N", [(0, 0), (0, du), (4, du)], GRN, s1, GRN, "KΔu (1 − exp(−t/T))"),
        ("時刻 1 s の −2 N", [(0, 0), (tw, 0), (tw, -du), (4, -du)], ALI, s2, ALI, "1 s 遅らせて符号を変えたもの"),
    ]
    ys = [40, 136, 232]
    for k, ((lab, inp, ci, resp, cr, rlab), y0) in enumerate(zip(rows, ys)):
        p = Plot(70, y0, 250, 64, (0, 4), (-2.6, 2.6))
        q = Plot(430, y0, 250, 64, (0, 4), (-1.15, 1.15))
        last = k == 2
        o.append(p.axes(xl="時間 t [s]" if last else None, yl=None, xt=[0, 1, 2, 3, 4], yt=[-2, 0, 2], xfmt=(_f03_fmt if last else (lambda v: ""))))
        o.append(q.axes(xl="時間 t [s]" if last else None, yl=None, xt=[0, 1, 2, 3, 4], yt=[-1, 0, 1], xfmt=(_f03_fmt if last else (lambda v: ""))))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
        o.append(p.line(inp, c=ci, lw=2.4))
        o.append(q.line(list(zip(ts, resp)), c=cr, lw=2.4))
        o.append(T(p.x + p.w - 4, p.Y(1.0) + 4 if k != 2 else p.Y(1.2), lab, "end", 10, ci, True, halo=True))
        o.append(T(q.x + q.w - 4, (q.y + 12, q.Y(-0.45), q.Y(0.55))[k], rlab, "end", 9.5, cr, True, halo=True))
    # 記号（= と +）
    for yy, sg in ((120, "="), (216, "+")):
        o.append(T(195, yy, sg, "middle", 16, INK, True))
        o.append(T(555, yy, sg, "middle", 16, INK, True))
    # 値
    q0 = Plot(430, 40, 250, 64, (0, 4), (-1.15, 1.15))
    o.append(D(q0.X(1.0), q0.Y(0.8647), SIG, 4))
    o.append(T(q0.X(1.1), q0.Y(0.8647) - 3, "1 s で 0.865 m/s", "start", 9.5, SIG, True, halo=True))
    return SVG(700, 334, o, "パルスの応答を重ね合わせで求める（台車、K = 0.5 (m/s)/N、T = 0.5 s）。(a) 2 N で 1 s 押すパルスは、時刻 0 の +2 N のステップと、時刻 1 s の −2 N のステップの和である。(b) 応答も、2 つのステップ応答の和になる。2 つ目は、1 つ目を 1 s 遅らせて符号を変えたもの（時不変）。1 s 以降は 2 つが打ち消し合い、速度は時定数 0.5 s で 0 に戻る。")
F["e03_pulse"] = _f03_pulse_fig()


# =====================================================================
# 3 節: インパルス応答（面積を保って幅を狭める）と、ステップ応答の傾き
# =====================================================================
def _f03_impulse_fig():
    o = []
    K, Tc = _F03_CART
    area = 0.2
    ts = _f03_np.linspace(0, 2.0, 801)
    o.append(T(14, 18, "(a) 面積 0.2 N·s のまま幅を狭める", "start", 11.5, INK, True))
    cases = [(0.4, TEA), (0.2, PUR), (0.1, GLD), (0.05, GRN)]
    p = Plot(66, 34, 280, 74, (0, 2.0), (0, 4.6))
    o.append(p.axes(xl=None, yl="力 [N]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 2, 4], xfmt=lambda v: ""))
    for tw, c in cases:
        h = area / tw
        o.append(p.line([(0, 0), (0, h), (tw, h), (tw, 0), (2.0, 0)], c=c, lw=1.8))
    o.append(T(p.X(0.42) + 4, p.Y(0.5) - 4, "0.4 s × 0.5 N", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(0.05) + 6, p.Y(4) + 4, "0.05 s × 4 N", "start", 9.5, GRN, True, halo=True))
    q = Plot(66, 130, 280, 150, (0, 2.0), (0, 0.22))
    o.append(q.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 0.05, 0.1, 0.15, 0.2], xfmt=_f03_fmt, yfmt=_f03_fmt))
    for tw, c in cases:
        h = area / tw
        ys = _f03_step(K, Tc, h, ts) - _f03_step(K, Tc, h, ts, L=tw)
        o.append(q.line(list(zip(ts, ys)), c=c, lw=1.8))
        pk = K * h * (1 - math.exp(-tw / Tc))
        o.append(D(q.X(tw), q.Y(pk), c, 3.4))
    o.append(q.line(list(zip(ts, K * area / Tc * _f03_np.exp(-ts / Tc))), c=SIG, lw=2.4, dash="6 4"))
    o.append(T(q.X(0.07), q.Y(0.2) - 6, "極限 0.2 exp(−t/T) m/s", "start", 9.5, SIG, True, halo=True))
    for k, (tw, c) in enumerate(cases):
        pk = K * (area / tw) * (1 - math.exp(-tw / Tc))
        o.append(T(q.X(2.0) - 4, q.Y(0.175) + k * 14, "幅 %g s: 最大 %.3f" % (tw, pk), "end", 9.5, c, True, halo=True))
    # (b) ステップ応答の傾き = インパルス応答
    xb = 420
    o.append(T(xb - 14, 18, "(b) 単位ステップ応答の傾き = インパルス応答", "start", 11.5, INK, True))
    a = Plot(xb + 46, 34, 220, 110, (0, 2.0), (0, 0.6))
    o.append(a.axes(xl=None, yl="速度 [m/s]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 0.25, 0.5], xfmt=lambda v: "", yfmt=_f03_fmt))
    o.append(a.line(list(zip(ts, K * (1 - _f03_np.exp(-ts / Tc)))), c=SIG, lw=2.2))
    o.append(T(a.X(1.95), a.Y(0.16), "単位ステップ（1 N）の応答", "end", 9.5, SIG, True, halo=True))
    b = Plot(xb + 46, 170, 220, 110, (0, 2.0), (0, 1.1))
    o.append(b.axes(xl="時間 t [s]", yl="g(t) [(m/s)/(N·s)]", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 0.5, 1.0], xfmt=_f03_fmt, yfmt=_f03_fmt))
    o.append(b.line(list(zip(ts, K / Tc * _f03_np.exp(-ts / Tc))), c=PUR, lw=2.2))
    for t0, c in ((0.0, GLD), (0.5, GLD), (1.0, GLD)):
        y0 = K * (1 - math.exp(-t0 / Tc)); sl = K / Tc * math.exp(-t0 / Tc)
        dt = 0.22
        o.append(W(a.X(t0 - (0 if t0 == 0 else dt)), a.Y(y0 - sl * (0 if t0 == 0 else dt)), a.X(t0 + dt), a.Y(y0 + sl * dt), c=c, lw=1.6, dash="4 2"))
        o.append(D(a.X(t0), a.Y(y0), c, 3.2))
        o.append(W(a.X(t0), a.Y(y0), a.X(t0), a.y + a.h, b.X(t0), b.y, b.X(t0), b.Y(sl), c=FNT, lw=1, dash="2 3"))
        o.append(D(b.X(t0), b.Y(sl), c, 3.6))
        o.append(T(b.X(t0) + 6, b.Y(sl) - 6, "傾き %.3g" % sl, "start", 9.5, GLD, True, halo=True))
    o.append(T(b.X(1.95), b.Y(1.0), "g(t) = (K/T) exp(−t/T)", "end", 9.5, PUR, True, halo=True))
    return SVG(700, 322, o, "インパルス応答（台車、K = 0.5 (m/s)/N、T = 0.5 s）。(a) 力 × 時間を 0.2 N·s に保ったまま、幅を狭めて高くすると、速度の応答は 1 本の曲線（破線）に近づく。台車をハンマーで叩いたときのように、速度は 0.2 m/s に跳んでから時定数 0.5 s で減る。(b) 単位ステップ応答の各時刻の傾き（接線）は、その時刻のインパルス応答の値に等しい。")
F["e03_impulse"] = _f03_impulse_fig()


# =====================================================================
# 3 節: ランプ応答（モータを 0.5 s かけて 12 V にする）と電流
# =====================================================================
def _f03_ramp_fig():
    o = []
    K, Tm, V = _F03_MOT
    a_, tr = 24.0, 0.5
    ts = _f03_np.linspace(0, 0.8, 801)
    v = a_ * _f03_np.minimum(ts, tr)
    w = _f03_np.where(ts <= tr, K * a_ * (ts - Tm + Tm * _f03_np.exp(-ts / Tm)),
                      K * a_ * (tr + Tm * _f03_np.exp(-ts / Tm) - Tm * _f03_np.exp(-(ts - tr) / Tm)))
    o.append(T(14, 18, "(a) 電圧を 0.5 s かけて 12 V にしたときの角速度", "start", 11.5, INK, True))
    p = Plot(66, 34, 360, 210, (0, 0.8), (0, 700))
    o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], yt=[0, 100, 200, 300, 400, 500, 600, 700], xfmt=_f03_fmt))
    # 右の目盛（電圧 = 角速度 / K）
    o.append(W(p.x + p.w, p.y, p.x + p.w, p.y + p.h, c=GLD, lw=1))
    for vv in (0, 4, 8, 12):
        yy = p.Y(K * vv)
        o.append(W(p.x + p.w, yy, p.x + p.w + 4, yy, c=GLD, lw=1))
        o.append(T(p.x + p.w + 7, yy + 3.5, "%d" % vv, "start", 9.5, GLD))
    o.append(T(p.x + p.w + 30, p.y + p.h / 2, "電圧 [V]", "middle", 10, GLD, rot=-90))
    o.append(p.line(list(zip(ts, K * v)), c=GLD, lw=1.8, dash="6 3"))
    o.append(p.line(list(zip(ts, w)), c=SIG, lw=2.6))
    o.append(T(p.X(0.26), p.Y(K * a_ * 0.26) - 8, "電圧 × K（= Kαt）", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.30), p.Y(K * a_ * (0.30 - Tm)) + 16, "角速度", "start", 9.5, SIG, True, halo=True))
    # 遅れ T（横）と KαT（縦）
    t1 = 0.4
    yv = K * a_ * (t1 - Tm)
    o.append(DIM(p.X(t1 - Tm), p.Y(yv), p.X(t1), p.Y(yv), None, c=ALI))
    o.append(T(p.X(t1 - Tm) - 4, p.Y(yv) + 4, "T = 0.05 s", "end", 9.5, ALI, True, halo=True))
    o.append(DIM(p.X(t1) + 6, p.Y(K * a_ * t1), p.X(t1) + 6, p.Y(yv), None, c=PUR))
    o.append(T(p.X(t1) + 12, p.Y(K * a_ * t1 - 30) + 4, "KαT = 60 rad/s", "start", 9.5, PUR, True, halo=True))
    o.append(D(p.X(tr), p.Y(540), SIG, 3.6))
    o.append(T(p.X(tr) + 6, p.Y(540) + 14, "0.5 s で 540", "start", 9.5, SIG, True, halo=True))
    # (b) 電流
    xb = 520
    o.append(T(xb - 30, 18, "(b) 電流", "start", 11.5, INK, True))
    q = Plot(xb, 34, 160, 210, (0, 0.8), (0, 7))
    o.append(q.axes(xl="時間 t [s]", yl="電流 [A]", xt=[0, 0.2, 0.4, 0.6, 0.8], yt=[0, 1, 2, 3, 4, 5, 6, 7], xfmt=_f03_fmt))
    i_step = 6.0 * _f03_np.exp(-ts / Tm)
    i_ramp = _f03_np.where(ts <= tr, 0.6 * (1 - _f03_np.exp(-ts / Tm)), 0.6 * (1 - math.exp(-tr / Tm)) * _f03_np.exp(-(ts - tr) / Tm))
    o.append(q.line(list(zip(ts, i_step)), c=ALI, lw=2, dash="5 3"))
    o.append(q.line(list(zip(ts, i_ramp)), c=SIG, lw=2.4))
    o.append(T(q.X(0.02) + 4, q.Y(6) + 4, "急に 12 V: 6 A", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0.1), q.Y(0.6) - 8, "0.5 s かけて: 0.6 A", "start", 9.5, SIG, True, halo=True))
    return SVG(700, 290, o, "ランプ応答（モータ、K = 50 (rad/s)/V、T = 0.05 s）。(a) 電圧を一定の速さ 24 V/s で上げると、角速度は、電圧に K を掛けた直線より、ちょうど T だけ遅れてついていく（値では KαT = 60 rad/s だけ下）。0.5 s で上げるのを止めると、時定数 0.05 s で 600 rad/s に近づく。(b) 電流は 0.6 A を超えず、急に 12 V を加えたときの 6 A の 1/10 である（一次の式で計算した値）。")
F["e03_ramp"] = _f03_ramp_fig()


# =====================================================================
# 3 節: 方形波（RC 回路、0 V と 1 V）
# =====================================================================
def _f03_square_fig():
    o = []
    Tc = 0.1
    rows = [(1.0, 4.0, [0, 1, 2, 3, 4], "t_w = 10T（周期 2 s）", "半周期ごとにほぼ落ち着く"),
            (0.1, 0.8, [0, 0.2, 0.4, 0.6, 0.8], "t_w = T（周期 0.2 s）", None),
            (0.01, 0.6, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], "t_w = 0.1T（周期 0.02 s）", None)]
    y0 = 30
    for k, (tw, tend, xt, lab, note) in enumerate(rows):
        p = Plot(70, y0, 470, 72, (0, tend), (-0.1, 1.15))
        o.append(p.axes(xl="時間 t [s]", yl=None, xt=xt, yt=[0, 0.5, 1], xfmt=_f03_fmt, yfmt=_f03_fmt))
        o.append(TX(14, y0 - 8, lab, "start", 10.5, INK, True))
        n = int(round(tend / tw)) + 1
        # 入力
        pts = [(0, 0)]
        for j in range(n):
            lv = 1.0 if j % 2 == 0 else 0.0
            a0, a1 = j * tw, min((j + 1) * tw, tend)
            if a0 >= tend:
                break
            pts += [(a0, lv), (a1, lv)]
        o.append(p.line(pts, c=GLD, lw=1.2 if tw < 0.05 else 1.6))
        # 出力（半周期ごとに厳密に進める）
        ts, ys, y = [0.0], [0.0], 0.0
        for j in range(n):
            lv = 1.0 if j % 2 == 0 else 0.0
            a0 = j * tw
            if a0 >= tend:
                break
            sub = _f03_np.linspace(0, min(tw, tend - a0), 40)
            for s_ in sub[1:]:
                ts.append(a0 + s_); ys.append(lv + (y - lv) * math.exp(-s_ / Tc))
            y = ys[-1]
        o.append(p.line(list(zip(ts, ys)), c=SIG, lw=2.4))
        if k == 0:
            for j in range(4):
                xe = p.X(j * tw)
                if j % 2 == 0:
                    o.append(ARR(xe + 5, p.Y(0.1), xe + 5, p.Y(0.95), c=GRN, lw=1.6, head=6))
                else:
                    o.append(ARR(xe + 5, p.Y(0.95), xe + 5, p.Y(0.1), c=ALI, lw=1.6, head=6))
        e = math.exp(-tw / Tc)
        ymax, ymin = 1 / (1 + e), e / (1 + e)
        if k > 0:
            o.append(W(p.X(0), p.Y(ymax), p.X(tend), p.Y(ymax), c=MUT, lw=1, dash="4 3"))
            o.append(W(p.X(0), p.Y(ymin), p.X(tend), p.Y(ymin), c=MUT, lw=1, dash="4 3"))
        xr = p.x + p.w + 14
        if note:
            o.append(T(xr, y0 + 22, note, "start", 9.5, SIG, True))
            o.append(T(xr, y0 + 38, "（ステップ応答が交互に並ぶ）", "start", 9.5, SIG))
            o.append(T(xr, y0 + 58, "緑: 増えるステップ", "start", 9.5, GRN, True))
            o.append(T(xr, y0 + 72, "赤: 減るステップ", "start", 9.5, ALI, True))
        else:
            o.append(T(xr, y0 + 22, "往復する範囲（式）:", "start", 9.5, SIG, True))
            o.append(T(xr, y0 + 38, "%.3f〜%.3f V" % (ymin, ymax), "start", 10, SIG, True))
            o.append(T(xr, y0 + 54, "幅 %.3f V" % (ymax - ymin), "start", 9.5, MUT))
        y0 += 124
    o.append(LEGL(70, y0 - 6, [(GLD, None, "入力 v（0 V と 1 V）"), (SIG, None, "コンデンサの電圧 v_c"), (MUT, "4 3", "式の y_max と y_min")]))
    return SVG(700, y0 + 2, o, "RC 回路（T = 0.1 s）に方形波を加えたときの電圧。方形波は、増えるステップと減るステップが交互に並んだもので、応答はステップ応答を重ねたものになる。半周期 t<sub>w</sub> が時定数より長いと出力は毎回ほぼ落ち着き、短いと平均 0.5 V のまわりで小さく往復するだけになる。破線は、往復が一定になったときの上端と下端の式の値。")
F["e03_square"] = _f03_square_fig()


# =====================================================================
# 4 節: むだ時間 — 運ばれる時間と、過去の値を貯める配列
# =====================================================================
def _f03_dead_pipe_fig():
    o = []
    o.append(T(14, 18, "(a) 配管を流れる湯: 混ぜ方を変えてから 1.2 s 後", "start", 11.5, INK, True))
    # 弁と配管
    o.append(BOX(14, 44, 70, 44, "混ぜる弁", None, GLD, GOSOFT, sz=10.5))
    x0, x1, yp, hp = 92, 572, 56, 20
    n = 20
    for i in range(n):
        xa = x0 + (x1 - x0) * i / n
        hot = i < 12
        o.append(RECT(xa, yp, (x1 - x0) / n, hp, 0, ASOFT if hot else SSOFT, ALI if hot else SIG, 0.6))
    o.append(W(x0, yp, x1, yp, c=INK, lw=1.6)); o.append(W(x0, yp + hp, x1, yp + hp, c=INK, lw=1.6))
    o.append(W(84, yp + hp / 2, x0, yp + hp / 2, c=INK, lw=1.6))
    o.append(ARR(x0 + 6, yp + hp + 12, x0 + 70, yp + hp + 12, c=MUT, lw=1.4, head=6))
    o.append(T(x0 + 76, yp + hp + 16, "流れの速さ 1 m/s", "start", 9.5, MUT))
    xf = x0 + (x1 - x0) * 12 / n
    o.append(W(xf, yp - 8, xf, yp + hp + 4, c=ALI, lw=1.6, dash="3 2"))
    o.append(T(xf, yp - 12, "熱い湯の先頭（1.2 m）", "middle", 9.5, ALI, True))
    o.append(T(x1 - 4, yp - 12, "まだぬるい湯", "end", 9.5, SIG, True))
    # シャワーの口
    o.append(RECT(x1, yp - 4, 30, hp + 8, 4, PAN, INK, 1.4))
    for k in range(4):
        o.append(W(x1 + 8 + k * 6, yp + hp + 6, x1 + 4 + k * 8, yp + hp + 30, c=SIG, lw=1.6, dash="3 4"))
    o.append(T(x1 + 36, yp + 14, "シャワーの口", "start", 9.5, INK))
    o.append(DIM(x0, 116, x1, 116, "長さ 2 m（L = 2 m ÷ 1 m/s = 2 s）", c=INK))
    # 下: 入口と出口の温度
    for k, (nm, Ls, c) in enumerate((("入口（弁）の温度", 0.0, GLD), ("出口（シャワーの口）の温度", 2.0, SIG))):
        px = 70 + k * 330
        p = Plot(px, 148, 250, 70, (-1, 5), (20, 45))
        o.append(p.axes(xl="弁を回してからの時間 [s]", yl=None, xt=[-1, 0, 1, 2, 3, 4, 5], yt=[25, 40], xfmt=_f03_fmt))
        o.append(T(px - 8, 140, nm, "start", 10, c, True))
        o.append(p.line([(-1, 25), (Ls, 25), (Ls, 40), (5, 40)], c=c, lw=2.4))
        o.append(W(p.X(1.2), p.y, p.X(1.2), p.y + p.h, c=ALI, lw=1, dash="3 3"))
        o.append(T(p.X(1.2) + 3, p.y + p.h - 5, "1.2 s", "start", 9, ALI, halo=True))
        o.append(T(p.x - 30, p.y + p.h / 2 + 4, "°C", "middle", 9, MUT))
    o.append(T(330, 186, "→", "middle", 18, INK, True))
    o.append(T(330, 204, "2 s 遅れる", "middle", 9.5, INK, True))
    # (b) 配列
    yb = 278
    o.append(T(14, yb, "(b) 計算では: 過去の値を配列に貯め、N 個前を取り出す（L = 0.1 s、刻み幅 0.01 s → N = 10）", "start", 11.5, INK, True))
    cx0, cw, cy0 = 120, 46, yb + 22
    vals = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
    for i, v in enumerate(vals):
        o.append(RECT(cx0 + i * cw, cy0, cw - 4, 30, 3, ASOFT if v else SSOFT, ALI if v else SIG, 1.1))
        o.append(T(cx0 + i * cw + (cw - 4) / 2, cy0 + 20, str(v), "middle", 11, INK, True))
        o.append(T(cx0 + i * cw + (cw - 4) / 2, cy0 + 46, ("%d 前" % (i + 1)) if i else "1 前", "middle", 9, MUT))
    o.append(ARR(30, cy0 + 15, cx0 - 6, cy0 + 15, c=GLD, lw=1.8))
    o.append(T(30, cy0 + 9, "今の入力を書く", "start", 9.5, GLD, True))
    xe = cx0 + 10 * cw
    o.append(ARR(xe, cy0 + 15, xe + 60, cy0 + 15, c=SIG, lw=1.8))
    o.append(T(xe + 64, cy0 + 12, "10 個前", "start", 9.5, SIG, True))
    o.append(T(xe + 64, cy0 + 25, "= 0.1 s 前", "start", 9.5, SIG, True))
    o.append(T(cx0, cy0 + 70, "1 刻みごとに全体を 1 つ右へ送る（実際には、書く位置を 1 つずつ進める輪の形の配列にして、送る手間を省く）。", "start", 9.5, MUT))
    o.append(T(cx0, cy0 + 86, "図は、0.04 s 前に入力が 0 から 1 に変わった所。出力（10 個前の値）が 1 になるのは、あと 0.06 s 後である。", "start", 9.5, MUT))
    return SVG(700, cy0 + 96, o, "むだ時間。(a) 弁で混ぜ方を変えても、配管の中の湯が押し出されるまで、出口の温度は変わらない。長さ ÷ 流れの速さの時間だけ、入口の温度の変化が形を変えずに遅れて出口に現れる（値は例の値）。(b) 数値計算やマイコンでは、刻みごとの値を配列に貯めておき、むだ時間 ÷ 刻み幅の個数だけ前の値を取り出す。")
F["e03_dead_pipe"] = _f03_dead_pipe_fig()


# =====================================================================
# 4 節: むだ時間と一次遅れの違い、温度の板の一次遅れ＋むだ時間
# =====================================================================
def _f03_dead_cmp_fig():
    o = []
    K, Tc = _F03_CART
    ts = _f03_np.linspace(0, 3, 601)
    pulse = lambda L: [(0, 0), (L, 0), (L, 2), (L + 1, 2), (L + 1, 0), (3, 0)]
    resp = lambda L: _f03_step(K, Tc, 2, ts, L) - _f03_step(K, Tc, 2, ts, L + 1)
    rows = [("(a) むだ時間 0.5 s だけ（届く力）", "力 [N]", (-0.3, 2.4), [0, 1, 2], "pure"),
            ("(b) 一次遅れだけ（遅れずに届いた力で走る台車の速度）", "速度 [m/s]", (-0.1, 1.15), [0, 0.5, 1], "fo"),
            ("(c) 一次遅れ＋むだ時間（0.5 s 遅れて届いた力で走る速度）", "速度 [m/s]", (-0.1, 1.15), [0, 0.5, 1], "fodt")]
    y0 = 40
    for k, (ttl, yl, yr, yt, kind) in enumerate(rows):
        o.append(T(14, y0 - 10, ttl, "start", 10.5, INK, True))
        p = Plot(70, y0, 300, 62, (0, 3), yr)
        o.append(p.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=yt, xfmt=(_f03_fmt if k == 2 else (lambda v: "")), yfmt=_f03_fmt))
        o.append(T(p.x - 34, p.y + p.h / 2, yl, "middle", 9.5, MUT, rot=-90))
        if kind == "pure":
            o.append(p.line(pulse(0.0), c=GLD, lw=1.4, dash="5 3"))
            o.append(p.line(pulse(0.5), c=SIG, lw=2.4))
            o.append(T(p.X(1.6), p.Y(1.6), "形はそのまま", "start", 9.5, SIG, True, halo=True))
        else:
            sc = K  # K × 力（1 m/s）
            o.append(p.line([(a, b * sc) for a, b in pulse(0.0)], c=GLD, lw=1.4, dash="5 3"))
            L = 0.5 if kind == "fodt" else 0.0
            o.append(p.line(list(zip(ts, resp(L))), c=SIG, lw=2.4))
            pk = K * 2 * (1 - math.exp(-1 / Tc))
            o.append(D(p.X(1 + L), p.Y(pk), SIG, 3.4))
            o.append(T(p.X(1 + L) + 6, p.Y(pk) - 2, "%.3f m/s" % pk, "start", 9.5, SIG, True, halo=True))
            if kind == "fodt":
                o.append(T(p.X(0.04), p.Y(0.55), "0.5 s 動かない", "start", 9.5, ALI, True, halo=True))
            else:
                o.append(T(p.X(1.6), p.Y(0.75), "すぐ動き出すが角が丸い", "start", 9.5, SIG, True, halo=True))
        y0 += 104
    o.append(LEGL(70, y0 + 10, [(GLD, "5 3", "指令の力（(b)(c) は K 倍して m/s で）"), (SIG, None, "出力")]))
    # (d) 温度の板
    Kp_, Tp, Lp, dq = _F03_PLATE
    xb = 452
    o.append(T(xb - 30, 30, "(d) 温度の板: 0 W → 40 W", "start", 10.5, INK, True))
    q = Plot(xb, 40, 230, 166, (0, 3000), (20, 80))
    o.append(q.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 1000, 2000, 3000], yt=[20, 30, 40, 50, 60, 70, 80], xfmt=_f03_fmt))
    tp = _f03_np.linspace(0, 3000, 601)
    o.append(W(q.X(0), q.Y(75), q.X(3000), q.Y(75), c=MUT, lw=1, dash="4 3"))
    o.append(q.line(list(zip(tp, 25 + _f03_step(Kp_, Tp, dq, tp, Lp))), c=SIG, lw=2.4))
    y63 = 25 + Kp_ * dq * (1 - math.exp(-1))
    o.append(D(q.X(Lp + Tp), q.Y(y63), SIG, 4))
    o.append(T(q.X(Lp + Tp) + 6, q.Y(y63) + 15, "520 s で 56.6 °C", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(2950), q.Y(75) - 5, "75 °C", "end", 9.5, MUT, halo=True))
    # 拡大
    z = Plot(xb + 110, 130 + 6, 110, 52, (0, 100), (24.5, 32))
    o.append(RECT(z.x - 4, z.y - 4, z.w + 8, z.h + 8, 3, SCR, LIN, 0.8))
    o.append(z.axes(xl=None, yl=None, xt=[0, 20, 100], yt=[25, 30], xfmt=_f03_fmt, yfmt=_f03_fmt, sz=8.5))
    tz = _f03_np.linspace(0, 100, 201)
    o.append(z.line(list(zip(tz, 25 + _f03_step(Kp_, Tp, dq, tz, Lp))), c=SIG, lw=2))
    o.append(T(z.x + z.w / 2, z.y - 8, "始めの 100 s", "middle", 9, INK, True))
    o.append(T(z.X(21), z.Y(25) - 5, "20 s 動かない", "start", 8.5, ALI, True, halo=True))
    o.append(T(q.x, q.y + q.h + 46, "読み: 20 s 動かず、その後 0.1 K/s で上がり始める", "start", 9.5, INK))
    return SVG(700, 374, o, "むだ時間と一次遅れの違い（(a)〜(c) は 2 N を 1 s 押す指令。台車は K = 0.5 (m/s)/N、T = 0.5 s。無線の遅れ 0.5 s は例の値）。(a) むだ時間は形を変えずにずらすだけ。(b) 一次遅れはすぐ動き始めるが、角が丸まる。(c) 両方が重なると、0.5 s の間は何も起きず、その後は (b) と同じ形で動く。(d) 温度の板（K = 1.25 K/W、T = 500 s、L = 20 s）のステップ応答。")
F["e03_dead_cmp"] = _f03_dead_cmp_fig()


# =====================================================================
# 5 節: 同定 — 読み取りの手順
# =====================================================================
def _f03_num(x, y, k, c=INK):
    """番号の丸。"""
    return CIRC(x, y, 8, c=c, lw=1.4, fill=SCR) + T(x, y + 3.6, str(k), "middle", 10, c, True)


def _f03_ident_read_fig():
    o = []
    K, Tp, L, dq = _F03_PLATE
    p = Plot(66, 30, 430, 220, (-300, 4000), (20, 80))
    o.append(p.axes(xl="ヒータの電力を変えてからの時間 t [s]", yl="温度 [°C]", xt=[0, 1000, 2000, 3000, 4000], yt=[20, 30, 40, 50, 60, 70, 80], xfmt=_f03_fmt))
    tp = _f03_np.linspace(-300, 4000, 1721)
    yy = 25 + _f03_step(K, Tp, dq, tp, L)
    o.append(p.line(list(zip(tp, yy)), c=SIG, lw=2.4))
    # ① 始めの値・③ 落ち着いた値
    o.append(W(p.X(-300), p.Y(25), p.X(4000), p.Y(25), c=MUT, lw=1, dash="4 3"))
    o.append(W(p.X(-300), p.Y(75), p.X(4000), p.Y(75), c=MUT, lw=1, dash="4 3"))
    o.append(_f03_num(p.X(-150), p.Y(25) + 10, 1))
    o.append(T(p.X(-150) + 12, p.Y(25) + 14, "25.0 °C", "start", 9.5, INK, True, halo=True))
    o.append(_f03_num(p.X(3600), p.Y(75) + 16, 3))
    o.append(T(p.X(3600) - 12, p.Y(75) + 20, "75.0 °C", "end", 9.5, INK, True, halo=True))
    o.append(DIM(p.X(3920), p.Y(25), p.X(3920), p.Y(75), None, c=PUR))
    o.append(T(p.X(3870), p.Y(50), "50 K", "end", 10, PUR, True, halo=True))
    # ④ 接線
    o.append(W(p.X(L), p.Y(25), p.X(L + Tp), p.Y(75), c=GLD, lw=1.6, dash="6 3"))
    o.append(_f03_num(p.X(260), p.Y(25 + 0.1 * 240) - 4, 4, GLD))
    o.append(D(p.X(L + Tp), p.Y(75), GLD, 3.8))
    # ⑤ 63.2 %
    y63 = 25 + K * dq * (1 - math.exp(-1))
    o.append(W(p.X(-300), p.Y(y63), p.X(L + Tp), p.Y(y63), c=SIG, lw=1, dash="3 3"))
    o.append(W(p.X(L + Tp), p.Y(y63), p.X(L + Tp), p.Y(20), c=SIG, lw=1, dash="3 3"))
    o.append(D(p.X(L + Tp), p.Y(y63), SIG, 4.2))
    o.append(_f03_num(p.X(L + Tp) + 16, p.Y(y63) + 14, 5, SIG))
    # ② 入力の帯
    yb = p.y + p.h + 44
    o.append(T(p.x - 8, yb + 10, "ヒータ", "end", 9.5, GLD, True))
    o.append(RECT(p.x, yb, p.w, 14, 2, SCR, LIN, 0.8))
    o.append(RECT(p.X(0), yb, p.X(4000) - p.X(0), 14, 0, GOSOFT, GLD, 1))
    o.append(T(p.X(2000), yb + 11, "40 W", "middle", 9.5, GLD, True))
    o.append(T(p.X(-150), yb + 11, "0 W", "middle", 9.5, MUT))
    o.append(_f03_num(p.X(0) + 14, yb - 12, 2, GLD))
    # 拡大（始めの 100 s）
    z = Plot(p.X(1900), p.Y(48), 150, 70, (0, 100), (24.5, 32))
    o.append(RECT(z.x - 30, z.y - 22, z.w + 40, z.h + 56, 4, SCR, LIN, 0.9))
    o.append(z.axes(xl=None, yl=None, xt=[0, 20, 50, 100], yt=[25, 30], xfmt=_f03_fmt, yfmt=_f03_fmt, sz=8.5))
    tz = _f03_np.linspace(0, 100, 201)
    o.append(z.line(list(zip(tz, 25 + _f03_step(K, Tp, dq, tz, L))), c=SIG, lw=2))
    o.append(z.line([(L, 25), (100, 25 + 0.1 * (100 - L))], c=GLD, lw=1.4, dash="5 3"))
    o.append(D(z.X(L), z.Y(25), ALI, 3.6))
    o.append(T(z.x + z.w / 2, z.y - 8, "④ 始めの 100 s を拡大", "middle", 9, INK, True))
    o.append(T(z.x - 22, z.y + z.h + 28, "接線が 25.0 °C と交わる: 20 s", "start", 8.5, ALI, True))
    # 右: 筆算
    xr = 520
    o.append(T(xr, 40, "読んだ値から計算する", "start", 10.5, INK, True))
    lines = [(3, INK, "定常ゲイン"), (None, INK, "K = (75.0 − 25.0) ÷ 40"), (None, SIG, "　= 1.25 K/W"),
             (4, GLD, "むだ時間"), (None, INK, "接線が 25.0 °C と交わる時刻"), (None, SIG, "L = 20 s"),
             (5, SIG, "時定数"), (None, INK, "63.2 % の温度"), (None, INK, "25.0 + 0.632 × 50 = 56.6 °C"), (None, INK, "それに届く時刻 520 s から"), (None, SIG, "T = 520 − 20 = 500 s"),
             (None, MUT, "（接線が 75.0 °C に届く"), (None, MUT, "　520 s から求めても同じ）")]
    yy0 = 62
    for k, (num, c, s) in enumerate(lines):
        if num:
            yy0 += 6
            o.append(_f03_num(xr + 8, yy0 - 4, num, c))
            o.append(T(xr + 22, yy0, s, "start", 10, c, True))
        else:
            o.append(T(xr + 4, yy0, s, "start", 9.5, c, c == SIG))
        yy0 += 17
    return SVG(700, yb + 24, o, "ステップ応答から一次遅れ＋むだ時間のモデルを求める手順（温度の板、ノイズの無い記録）。番号は本文の手順の番号。① 始めの値を記録し、② ヒータの電力を 40 W 上げ、③ 落ち着いた値から定常ゲインを、④ 最も急な所の接線からむだ時間を、⑤ 上がり幅の 63.2 % に届く時刻から時定数を読む。")
F["e03_ident_read"] = _f03_ident_read_fig()


# ---- 5 節: ノイズのある記録（固定の乱数の種）と、その読み取り ----
def _f03_noisy(seed=7, sig=0.3, dt=5.0, t0=-300.0, t1=4000.0, two=False):
    rg = _f03_np.random.default_rng(seed)
    t = _f03_np.arange(t0, t1 + 1e-9, dt)
    K, Tp, L, dq = _F03_PLATE
    if two:
        T1, T2 = 400.0, 100.0
        tt = _f03_np.maximum(t, 0.0)
        y = 25 + K * dq * (1 - (T1 * _f03_np.exp(-tt / T1) - T2 * _f03_np.exp(-tt / T2)) / (T1 - T2))
    else:
        y = 25 + _f03_step(K, Tp, dq, t, L)
    return t, y + sig * rg.standard_normal(len(t))


def _f03_read(t, y, dq=40.0, avg_from=None, win=100.0, smooth=9):
    """本文の手順 3〜5 で読む。返り値 dict: y0, yinf, K, L, T63, Ttan, t63, slope, icpt。"""
    t = _f03_np.asarray(t); y = _f03_np.asarray(y)
    y0 = float(_f03_np.mean(y[t < 0])) if _f03_np.any(t < 0) else float(y[0])
    tend = float(t[-1])
    af = (tend - 500.0) if avg_from is None else avg_from
    yinf = float(_f03_np.mean(y[t >= af]))
    K = (yinf - y0) / dq
    # ならした曲線（前後 smooth 点の平均）
    h = smooth // 2
    ys = _f03_np.array([_f03_np.mean(y[max(0, i - h):i + h + 1]) for i in range(len(y))])
    lev = y0 + 0.632121 * (yinf - y0)
    t63 = None
    for i in range(1, len(t)):
        if t[i] >= 0 and ys[i - 1] < lev <= ys[i]:
            t63 = float(t[i - 1] + (lev - ys[i - 1]) / (ys[i] - ys[i - 1]) * (t[i] - t[i - 1]))
            break
    # 最も急な区間（幅 win）に直線を当てはめる
    best = None
    n = int(round(win / (t[1] - t[0]))) + 1
    for i in range(len(t) - n):
        if t[i] < 0 or t[i] > 0.5 * tend:
            continue
        tt, yy = t[i:i + n], y[i:i + n]
        A = _f03_np.vstack([tt, _f03_np.ones_like(tt)]).T
        sl, ic = _f03_np.linalg.lstsq(A, yy, rcond=None)[0]
        if best is None or sl > best[0]:
            best = (float(sl), float(ic))
    sl, ic = best
    L = (y0 - ic) / sl
    ttan = (yinf - ic) / sl
    return {"y0": y0, "yinf": yinf, "K": K, "L": L, "T63": (t63 - L) if t63 is not None else float("nan"), "Ttan": ttan - L,
            "t63": t63, "slope": sl, "icpt": ic, "lev": lev, "ys": ys}


def _f03_ident_noise_fig():
    o = []
    K, Tp, L, dq = _F03_PLATE
    t, y = _f03_noisy()
    r = _f03_read(t, y)
    o.append(T(14, 18, "(a) 観測ノイズのある記録（標準偏差 0.3 K、5 s ごと）を読む", "start", 11.5, INK, True))
    p = Plot(66, 34, 470, 190, (-300, 4000), (20, 80))
    o.append(p.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 1000, 2000, 3000, 4000], yt=[20, 30, 40, 50, 60, 70, 80], xfmt=_f03_fmt))
    o.append(RECT(p.X(3500), p.y, p.X(4000) - p.X(3500), p.h, 0, GSOFT, "none", 0))
    o.append("".join(D(p.X(a), p.Y(b), TEA, 1.2) for a, b in zip(t, y)))
    o.append(W(p.X(-300), p.Y(r["y0"]), p.X(4000), p.Y(r["y0"]), c=MUT, lw=1, dash="4 3"))
    o.append(W(p.X(3500), p.Y(r["yinf"]), p.X(4000), p.Y(r["yinf"]), c=GRN, lw=2))
    o.append(T(p.X(3750), p.Y(r["yinf"]) - 8, "平均 %.2f °C" % r["yinf"], "middle", 9.5, GRN, True, halo=True))
    o.append(T(p.X(3750), p.y + p.h - 6, "最後の 500 s", "middle", 9.5, GRN, True, halo=True))
    o.append(p.line([(a, b) for a, b in zip(t, r["ys"]) if a >= 0], c=SIG, lw=1.4))
    o.append(W(p.X(-300), p.Y(r["lev"]), p.X(r["t63"]), p.Y(r["lev"]), c=SIG, lw=1, dash="3 3"))
    o.append(D(p.X(r["t63"]), p.Y(r["lev"]), SIG, 4))
    o.append(T(p.X(r["t63"]) + 8, p.Y(r["lev"]) + 16, "ならした曲線が 63.2 %% に届く: %.0f s" % r["t63"], "start", 9.5, SIG, True, halo=True))
    sl, ic = r["slope"], r["icpt"]
    o.append(W(p.X(r["L"]), p.Y(r["y0"]), p.X((r["yinf"] - ic) / sl), p.Y(r["yinf"]), c=GLD, lw=1.6, dash="6 3"))
    o.append(T(p.X(620), p.Y(78), "← 最も急な 100 s の点に直線を当てはめた接線", "start", 9.5, GLD, True, halo=True))
    xr = 552
    o.append(T(xr, 48, "読んだ値", "start", 10.5, INK, True))
    for k, (s, c) in enumerate((("K = %.3f K/W" % r["K"], SIG), ("L = %.0f s" % r["L"], GLD), ("T = %.0f s" % r["T63"], SIG),
                                 ("本当の値", MUT), ("1.25 K/W・20 s・500 s", MUT))):
        o.append(T(xr, 70 + k * 17 + (6 if k >= 3 else 0), s, "start", 10 if k < 3 else 9.5, c, k < 3))
    o.append(T(xr, 170, "1 点だけで読むと、", "start", 9.5, INK))
    o.append(T(xr, 184, "ノイズの分（±0.6 K", "start", 9.5, INK))
    o.append(T(xr, 198, "ほど）ずれる", "start", 9.5, INK))
    # (b) 記録が短い
    yb = 284
    o.append(T(14, yb, "(b) 記録を 1000 s で止める", "start", 11.5, INK, True))
    q = Plot(66, yb + 16, 250, 150, (0, 2000), (20, 80))
    o.append(q.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 500, 1000, 1500, 2000], yt=[20, 40, 60, 80], xfmt=_f03_fmt))
    tq = _f03_np.linspace(0, 2000, 401)
    yq = 25 + _f03_step(K, Tp, dq, tq, L)
    o.append(q.line([(a, b) for a, b in zip(tq, yq) if a >= 1000], c=FNT, lw=1.6, dash="4 3"))
    o.append(q.line([(a, b) for a, b in zip(tq, yq) if a <= 1000], c=SIG, lw=2.4))
    yend = 25 + K * dq * (1 - math.exp(-(1000 - L) / Tp))
    o.append(W(q.X(0), q.Y(yend), q.X(2000), q.Y(yend), c=ALI, lw=1.2, dash="5 3"))
    o.append(W(q.X(0), q.Y(75), q.X(2000), q.Y(75), c=MUT, lw=1, dash="4 3"))
    o.append(T(q.X(1980), q.Y(75) - 5, "本当は 75.0 °C", "end", 9.5, MUT, halo=True))
    o.append(T(q.X(1980), q.Y(yend) + 14, "落ち着いたと見誤る %.1f °C" % yend, "end", 9.5, ALI, True, halo=True))
    lev = 25 + 0.632121 * (yend - 25)
    t63 = L - Tp * math.log(1 - (lev - 25) / (K * dq))
    o.append(D(q.X(t63), q.Y(lev), ALI, 3.8))
    o.append(W(q.X(t63), q.Y(lev), q.X(t63), q.Y(20), c=ALI, lw=1, dash="3 3"))
    o.append(T(q.X(t63) + 6, q.Y(lev) + 26, "K = %.2f K/W" % ((yend - 25) / dq), "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(t63) + 6, q.Y(lev) + 40, "T = %.0f s と読み誤る" % (t63 - L), "start", 9.5, ALI, True, halo=True))
    # (c) 遅れが 2 つ
    xc = 380
    o.append(T(xc, yb, "(c) 遅れが 2 つ重なる（400 s と 100 s）", "start", 11.5, INK, True))
    c_ = Plot(xc + 52, yb + 16, 250, 150, (0, 2000), (20, 80))
    o.append(c_.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 500, 1000, 1500, 2000], yt=[20, 40, 60, 80], xfmt=_f03_fmt))
    T1, T2 = 400.0, 100.0
    tc = _f03_np.linspace(0, 2000, 801)
    yc = 25 + K * dq * (1 - (T1 * _f03_np.exp(-tc / T1) - T2 * _f03_np.exp(-tc / T2)) / (T1 - T2))
    o.append(c_.line(list(zip(tc, yc)), c=SIG, lw=2.4))
    ti = T1 * T2 / (T1 - T2) * math.log(T1 / T2)
    yi = 25 + K * dq * (1 - (T1 * math.exp(-ti / T1) - T2 * math.exp(-ti / T2)) / (T1 - T2))
    sl2 = K * dq * (math.exp(-ti / T1) - math.exp(-ti / T2)) / (T1 - T2)
    La = ti - (yi - 25) / sl2
    tb = ti + (75 - yi) / sl2
    o.append(W(c_.X(La), c_.Y(25), c_.X(tb), c_.Y(75), c=GLD, lw=1.6, dash="6 3"))
    o.append(W(c_.X(0), c_.Y(25), c_.X(2000), c_.Y(25), c=MUT, lw=1, dash="4 3"))
    o.append(W(c_.X(0), c_.Y(75), c_.X(2000), c_.Y(75), c=MUT, lw=1, dash="4 3"))
    o.append(D(c_.X(ti), c_.Y(yi), GLD, 3.6))
    o.append(D(c_.X(La), c_.Y(25), ALI, 3.8))
    o.append(T(c_.X(La) + 6, c_.Y(25) + 10, "見かけの L = %.0f s" % La, "start", 9.5, ALI, True, halo=True))
    lev2 = 25 + 0.632121 * 50
    i2 = int(_f03_np.argmax(yc >= lev2))
    t632 = float(tc[i2 - 1] + (lev2 - yc[i2 - 1]) / (yc[i2] - yc[i2 - 1]) * (tc[i2] - tc[i2 - 1]))
    o.append(D(c_.X(t632), c_.Y(lev2), SIG, 3.8))
    o.append(T(c_.X(1980), c_.Y(48), "接線から T = %.0f s" % (tb - La), "end", 9.5, GLD, True, halo=True))
    o.append(T(c_.X(1980), c_.Y(48) + 14, "63.2 %% から T = %.0f s" % (t632 - La), "end", 9.5, SIG, True, halo=True))
    o.append(T(c_.X(1980), c_.Y(48) + 28, "（食い違う）", "end", 9.5, MUT, halo=True))
    return SVG(700, yb + 16 + 150 + 42, o, "ノイズ・記録の長さ・遅れの重なり（温度の板、40 W のステップ）。(a) ノイズのある記録では、落ち着いた値を平均で、63.2 % の時刻をならした曲線で、接線を直線の当てはめで読む。(b) 落ち着く前に記録を止めると、定常ゲインと時定数を小さく読み誤る。(c) 一次遅れが 2 つ重なった対象は S 字形に上がり、むだ時間が無くても、接線で読むと見かけのむだ時間が現れる。")
F["e03_ident_noise"] = _f03_ident_noise_fig()


# =====================================================================
# 6 節: 比例制御（1 章と同じ計算: 刻み h の間は力を一定として、速度の式を厳密に解く）
# =====================================================================
def _f03_psim(Kp, L=0.0, m=1.0, c=2.0, r=1.0, tend=6.0, h=1e-3, slope_t=3.0, uff=True, rec=0.004):
    n = int(round(tend / h)); nd = int(round(L / h)); kr = max(1, int(round(rec / h)))
    a = math.exp(-c * h / m); u0 = c * r if uff else 0.0
    d3 = m * 9.81 * math.sin(math.radians(3))
    hist = [0.0] * (n + 1); y = 0.0; out = []
    for k in range(n + 1):
        t = k * h
        hist[k] = y
        ym = hist[k - nd] if k >= nd else 0.0
        u = u0 + Kp * (r - ym)
        d = d3 if (slope_t is not None and t >= slope_t - 1e-9) else 0.0
        if k % kr == 0:
            out.append((t, y, u))
        yi = (u - d) / c
        y = yi + (y - yi) * a
    return out


def _f03_pform(Kp, t, m=1.0, c=2.0, r=1.0, slope_t=3.0, uff=True):
    """6 節の式（一次遅れの閉ループ）。坂は重ね合わせで足す。"""
    K, Tc = 1.0 / c, m / c
    g = 1 + K * Kp
    Tcl = Tc / g
    fin = r if uff else K * Kp * r / g
    y = fin * (1 - math.exp(-t / Tcl))
    if slope_t is not None and t >= slope_t:
        d3 = m * 9.81 * math.sin(math.radians(3))
        y -= K * d3 / g * (1 - math.exp(-(t - slope_t) / Tcl))
    return y


def _f03_pbd_fig():
    o = []
    R = 15
    B = dict(r0=18, br=70, s1=108, kp=(176, 250), s2=300, sd=380, pl=(428, 548), bp=600, end=690)
    y = 112
    o.append(TX(14, 18, "(a) 一次遅れ（台車の速度）を比例制御する線図", "start", 11.5, INK, True))
    o.append(ARR(B["r0"], y, B["s1"] - R, y, c=MUT, lw=1.8))
    o.append(T(B["r0"] + 2, y - 9, "目標値 r", "start", 10, MUT, True))
    o.append(SUMJ(B["s1"], y, {"l": "+", "b": "−"}))
    o.append(ARR(B["s1"] + R, y, B["kp"][0], y, c=ALI, lw=1.8))
    o.append(T((B["s1"] + R + B["kp"][0]) / 2, y - 9, "偏差 e", "middle", 10, ALI, True))
    o.append(RECT(B["kp"][0], y - 20, B["kp"][1] - B["kp"][0], 40, 6, PAN, SIG, 1.4))
    o.append(TX((B["kp"][0] + B["kp"][1]) / 2, y + 5, "× K_P", "middle", 12, INK, True))
    o.append(ARR(B["kp"][1], y, B["s2"] - R, y, c=GLD, lw=1.8))
    o.append(TX((B["kp"][1] + B["s2"] - R) / 2, y - 9, "K_P e", "middle", 10, GLD, True))
    yu = y - 62
    o.append(D(B["br"], y, MUT, 3.6))
    o.append(W(B["br"], y, B["br"], yu, c=MUT, lw=1.6))
    o.append(ARR(B["br"], yu, B["kp"][0], yu, c=MUT, lw=1.6))
    o.append(RECT(B["kp"][0], yu - 19, B["kp"][1] - B["kp"][0], 38, 6, PAN, LIN, 1.4, dash="5 3"))
    o.append(T((B["kp"][0] + B["kp"][1]) / 2, yu - 3, "決めた力", "middle", 10.5, INK, True))
    o.append(TX((B["kp"][0] + B["kp"][1]) / 2, yu + 12, "u_0 = c r", "middle", 9.5, MUT))
    o.append(W(B["kp"][1], yu, B["s2"], yu, c=GLD, lw=1.8, dash="5 3"))
    o.append(ARR(B["s2"], yu, B["s2"], y - R, c=GLD, lw=1.8, dash="5 3"))
    o.append(SUMJ(B["s2"], y, {"l": "+", "t": "+"}))
    o.append(ARR(B["s2"] + R, y, B["sd"] - R, y, c=GLD, lw=1.8))
    o.append(T((B["s2"] + B["sd"]) / 2, y + 26, "操作量 u", "middle", 10, GLD, True))
    o.append(SUMJ(B["sd"], y, {"l": "+", "t": "−"}))
    o.append(ARR(B["sd"], y - 46, B["sd"], y - R, c=PUR, lw=1.8))
    o.append(T(B["sd"] + 8, y - 34, "坂の力 d", "start", 10, PUR, True))
    o.append(ARR(B["sd"] + R, y, B["pl"][0], y, c=INK, lw=1.8))
    o.append(RECT(B["pl"][0], y - 24, B["pl"][1] - B["pl"][0], 48, 6, PAN, SIG, 1.4))
    o.append(T((B["pl"][0] + B["pl"][1]) / 2, y - 7, "一次遅れ（台車）", "middle", 10.5, INK, True))
    o.append(TX((B["pl"][0] + B["pl"][1]) / 2, y + 9, "T ẏ + y = K (u − d)", "middle", 9.5, INK))
    o.append(ARR(B["pl"][1], y, B["end"], y, c=SIG, lw=1.8))
    o.append(T(B["end"] - 2, y - 9, "制御量 y", "end", 10, SIG, True))
    yf = y + 64
    o.append(D(B["bp"], y, SIG, 4))
    o.append(W(B["bp"], y, B["bp"], yf, B["s1"], yf, c=SIG, lw=1.8))
    o.append(ARR(B["s1"], yf, B["s1"], y + R, c=SIG, lw=1.8))
    o.append(T((B["s1"] + B["bp"]) / 2, yf - 7, "測った速度（遅れなし）", "middle", 10, SIG, True))
    o.append(TX((B["pl"][0] + B["pl"][1]) / 2, y + 40, "T = m/c = 0.5 s、K = 1/c = 0.5 (m/s)/N", "middle", 9.5, MUT))
    # (b) まとめると
    yb = yf + 40
    o.append(W(12, yb - 12, 688, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 6, "(b) 決めた力と坂の力が無いとき、まとめると 1 つの一次遅れになる", "start", 11.5, INK, True))
    yy = yb + 54
    o.append(ARR(18, yy, 160, yy, c=MUT, lw=1.8))
    o.append(T(20, yy - 9, "目標値 r", "start", 10, MUT, True))
    o.append(RECT(160, yy - 30, 300, 60, 6, SSOFT, SIG, 1.6))
    o.append(T(310, yy - 12, "一次遅れ（閉ループ）", "middle", 10.5, INK, True))
    o.append(TX(310, yy + 6, "時定数 T_cl = T ÷ (1 + K K_P)", "middle", 10, INK))
    o.append(TX(310, yy + 21, "定常ゲイン K_cl = K K_P ÷ (1 + K K_P)", "middle", 10, INK))
    o.append(ARR(460, yy, 560, yy, c=SIG, lw=1.8))
    o.append(T(552, yy - 9, "制御量 y", "end", 10, SIG, True))
    o.append(TX(574, yy - 16, "K_P = 8 N/(m/s) なら", "start", 9.5, SIG, True))
    o.append(TX(574, yy - 1, "K K_P = 4、", "start", 9.5, INK))
    o.append(TX(574, yy + 14, "T_cl = 0.1 s、K_cl = 0.8", "start", 9.5, INK))
    return SVG(700, yy + 40, o, "一次遅れの比例制御。(a) 1 章 4 節と同じ並びの線図（破線の決めた力は、1 章の形で足すもの）。速度を測って目標値から引き、その K<sub>P</sub> 倍を操作量にする。(b) 決めた力と坂の力が無いとき、目標値から速度までをまとめると、時定数 T/(1 + KK<sub>P</sub>)、定常ゲイン KK<sub>P</sub>/(1 + KK<sub>P</sub>) の一次遅れになる。")
F["e03_pbd"] = _f03_pbd_fig()


_F03_GAINS = [(0.0, MUT), (2.0, TEA), (8.0, SIG), (14.0, GLD), (20.0, ALI)]


def _f03_pctl_fig():
    o = []
    o.append(T(14, 18, "(a) 速度: シミュレーション（線）と 6 節の式（○ と □）", "start", 11.5, INK, True))
    p = Plot(62, 34, 340, 210, (0, 6), (0, 1.2))
    o.append(RECT(p.X(3), p.y, p.X(6) - p.X(3), p.h, 0, PSOFT, "none", 0))
    o.append(p.axes(xl="時間 t [s]", yl="速度 y [m/s]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 1.0), (6, 1.0)], c=MUT, lw=1.2, dash="5 3"))
    o.append(T(p.X(4.5), p.y + 13, "上り坂 3°", "middle", 9.5, PUR, True, halo=True))
    K, Tc = 0.5, 0.5
    d3 = 9.81 * math.sin(math.radians(3))
    for Kp, c in _F03_GAINS:
        r = _f03_psim(Kp, 0.0)
        o.append(p.line([(t, y) for t, y, u in r], c=c, lw=2.0))
        g = 1 + K * Kp
        Tcl = Tc / g
        o.append(CIRC(p.X(Tcl), p.Y(0.632), 4.2, c=c, lw=1.8, fill=SCR))
        fin = 1 - K * d3 / g
        o.append(RECT(p.X(5.8) - 4, p.Y(fin) - 4, 8, 8, 1, SCR, c, 1.8))
    o.append(TX(p.X(0.62), p.Y(0.45), "○: 時刻 T_cl に 63.2 %（式）", "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(5.6), p.Y(0.66), "□: 坂の上で", "end", 9.5, INK, True, halo=True))
    o.append(TX(p.X(5.6), p.Y(0.66) + 13, "落ち着く r − K d ÷ (1 + K K_P)", "end", 9.5, INK, True, halo=True))
    o.append(LEGL(62, 290, [(c, None, "K_P = %g" % Kp) for Kp, c in _F03_GAINS], sz=9.5, gap=12))
    # (b) 時定数と定常偏差
    xb = 470
    o.append(T(xb - 20, 18, "(b) 比例ゲインと時定数・定常偏差", "start", 11.5, INK, True))
    a = Plot(xb + 30, 46, 190, 84, (0, 30), (0, 0.55))
    o.append(a.axes(xl=None, yl=None, xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 0.25, 0.5], xfmt=lambda v: "", yfmt=_f03_fmt))
    o.append(TX(a.x - 34, a.y - 6, "時定数 T_cl [s]", "start", 9.5, SIG, True))
    ks = _f03_np.linspace(0, 30, 301)
    o.append(a.line([(k, Tc / (1 + K * k)) for k in ks], c=SIG, lw=2))
    b = Plot(xb + 30, 166, 190, 86, (0, 30), (0, 0.3))
    o.append(b.axes(xl=None, yl=None, xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 0.1, 0.2, 0.3], xfmt=_f03_fmt, yfmt=_f03_fmt))
    o.append(TX(b.x + b.w / 2, b.y + b.h + 31, "比例ゲイン K_P [N/(m/s)]", "middle", 10, MUT))
    o.append(TX(b.x - 34, b.y - 12, "坂の上の定常偏差 e_∞ [m/s]", "start", 9.5, PUR, True))
    o.append(b.line([(k, K * d3 / (1 + K * k)) for k in ks], c=PUR, lw=2))
    for Kp, c in _F03_GAINS:
        g = 1 + K * Kp
        o.append(D(a.X(Kp), a.Y(Tc / g), c, 4))
        o.append(D(b.X(Kp), b.Y(K * d3 / g), c, 4))
    o.append(T(a.X(8) + 6, a.Y(0.1) - 6, "8 で 0.1 s", "start", 9.5, SIG, True, halo=True))
    o.append(T(b.X(8) + 6, b.Y(K * d3 / 5) - 6, "8 で 0.051 m/s", "start", 9.5, PUR, True, halo=True))
    o.append(T(a.X(0) + 8, a.Y(0.5) + 4, "0（開ループ）で 0.5 s", "start", 9.5, MUT, True, halo=True))
    return SVG(700, 300, o, "1 章の台車（m = 1 kg、c = 2 N·s/m、決めた力あり、3 s から上り坂 3°）。(a) 線は 1 章と同じ数値計算、○ と □ は 6 節の式の値で、一致する。どの比例ゲインでも、速度は目標値を越えずに近づく。(b) 時定数と定常偏差は、どちらも 1/(1 + KK<sub>P</sub>) 倍になる。点は (a) の 5 つの比例ゲイン。")
F["e03_pctl"] = _f03_pctl_fig()


def _f03_stopline(p, pts, c, lw=2.0):
    """範囲の外に出たところで線を止める（大きくなり続ける応答の描き方。1 章と同じ）。"""
    lo, hi = min(p.yr), max(p.yr)
    q = []
    for a, b in pts:
        if b > hi or b < lo:
            q.append((p.X(a), p.Y(min(max(b, lo), hi))))
            break
        q.append((p.X(a), p.Y(b)))
    return PL(q, c=c, lw=lw)


def _f03_pdelay_fig():
    o = []
    o.append(T(14, 18, "測った速度が 0.1 s 遅れて届くとき（決めた力あり、3 s から上り坂 3°）", "start", 11.5, INK, True))
    p = Plot(62, 34, 470, 230, (0, 6), (0, 2.0))
    o.append(RECT(p.X(3), p.y, p.X(6) - p.X(3), p.h, 0, PSOFT, "none", 0))
    o.append(p.axes(xl="時間 t [s]", yl="速度 y [m/s]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.5, 1.0, 1.5, 2.0], yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 1.0), (6, 1.0)], c=MUT, lw=1.2, dash="5 3"))
    o.append(T(p.X(4.5), p.y + 13, "上り坂 3°", "middle", 9.5, PUR, True, halo=True))
    ts = _f03_np.linspace(0, 6, 1201)
    for Kp, c in ((8.0, SIG), (14.0, GLD), (20.0, ALI)):
        r = _f03_psim(Kp, 0.1)
        o.append(_f03_stopline(p, [(t, y) for t, y, u in r], c, 2.2))
        if Kp < 20:
            o.append(p.line([(t, _f03_pform(Kp, t)) for t in ts], c=c, lw=1.5, dash="5 3"))
            pk = max((y, t) for t, y, u in r if t < 3)
            o.append(D(p.X(pk[1]), p.Y(pk[0]), c, 3.6))
    o.append(TX(p.X(1.3), p.Y(1.9), "K_P = 8: 最大 1.30 m/s", "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(1.3), p.Y(1.9) + 15, "K_P = 14: 最大 1.82 m/s", "start", 9.5, GLD, True, halo=True))
    o.append(TX(p.X(1.3), p.Y(1.9) + 30, "K_P = 20: 振れが大きくなり続ける（枠を出た所で止めた）", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(3.15), p.Y(0.5), "破線: 6 節の式（遅れを含まない）は", "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(3.15), p.Y(0.5) + 14, "目標値を越えずに近づくと答える", "start", 9.5, INK, halo=True))
    o.append(TX(p.X(5.95), p.Y(0.949) - 26, "落ち着く値は式どおり", "end", 9.5, INK, True, halo=True))
    o.append(TX(p.X(5.95), p.Y(0.949) - 12, "（K_P = 8 で 0.949 m/s、14 で 0.968 m/s）", "end", 9.5, INK, halo=True))
    # 右: 説明
    xr = 552
    o.append(T(xr, 50, "制御器が使う値", "start", 10, INK, True))
    o.append(BOX(xr, 62, 130, 34, "むだ時間 0.1 s", None, TEA, TSOFT, sz=10))
    o.append(TX(xr, 118, "y(t − L) を使うので、", "start", 9.5, INK))
    o.append(TX(xr, 133, "式の y(t) と", "start", 9.5, INK))
    o.append(T(xr, 148, "まとめられない", "start", 9.5, INK))
    o.append(T(xr, 176, "落ち着いた後は", "start", 9.5, INK))
    o.append(TX(xr, 191, "y(t − L) = y(t) なので、", "start", 9.5, INK))
    o.append(T(xr, 206, "落ち着く値は式で求まる", "start", 9.5, INK))
    return SVG(700, 306, o, "むだ時間があるときの比例制御（1 章 5 節の (b) と同じ条件）。実線は数値計算、破線は 6 節の一次遅れの式。式は振動を表せず、行き過ぎの大きさも、振れが大きくなり続けることも分からない。一方、落ち着く場合の落ち着く値は、式と一致する。")
F["e03_pdelay"] = _f03_pdelay_fig()
