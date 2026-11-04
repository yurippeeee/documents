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
    o.append(ARR(xb, yy, xb + 24, yy, c=GLD, lw=1.8))
    o.append(TX(xb + 2, yy - 9, "u", "start", 10.5, GLD, True))
    o.append(BOX(xb + 24, yy - 16, 32, 32, "× K", None, LIN, PAN, sz=10.5))
    sx = xb + 84
    o.append(ARR(xb + 56, yy, sx - 15, yy, c=GLD, lw=1.8))
    o.append(TX(xb + 58, yy - 9, "Ku", "start", 10, GLD, True))
    o.append(SUMJ(sx, yy, {"l": "+", "b": "−"}))
    o.append(ARR(sx + 15, yy, sx + 46, yy, c=PUR, lw=1.8))
    o.append(T(sx + 31, yy - 26, "残り", "middle", 10, PUR, True))
    o.append(TX(sx + 31, yy - 12, "Ku − y", "middle", 9.5, PUR))
    o.append(BOX(sx + 46, yy - 16, 32, 32, "÷ T", None, LIN, PAN, sz=10.5))
    o.append(ARR(sx + 78, yy, sx + 100, yy, c=SIG, lw=1.8))
    o.append(T(sx + 89, yy - 9, "ẏ", "middle", 11, SIG, True))
    o.append(BOX(sx + 100, yy - 16, 38, 32, "積分", None, SIG, PAN, sz=10))
    bp = sx + 152
    o.append(ARR(sx + 138, yy, bp + 22, yy, c=SIG, lw=1.8))
    o.append(T(bp + 9, yy - 9, "y", "middle", 11, SIG, True))
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
    o.append(T(p.x + p.w + 30, p.y + p.h / 2, "電圧 [V]", "middle", 10, GLD, rot=90))
    o.append(p.line(list(zip(ts, K * v)), c=GLD, lw=1.8, dash="6 3"))
    o.append(p.line(list(zip(ts, w)), c=SIG, lw=2.6))
    o.append(T(p.X(0.26), p.Y(K * a_ * 0.26) - 8, "電圧 × K（= Kat）", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.30), p.Y(K * a_ * (0.30 - Tm)) + 16, "角速度", "start", 9.5, SIG, True, halo=True))
    # 遅れ T（横）と KaT（縦）
    t1 = 0.4
    yv = K * a_ * (t1 - Tm)
    o.append(DIM(p.X(t1 - Tm), p.Y(yv), p.X(t1), p.Y(yv), None, c=ALI))
    o.append(T(p.X(t1 - Tm) - 4, p.Y(yv) + 4, "T = 0.05 s", "end", 9.5, ALI, True, halo=True))
    o.append(DIM(p.X(t1) + 6, p.Y(K * a_ * t1), p.X(t1) + 6, p.Y(yv), None, c=PUR))
    o.append(T(p.X(t1) + 12, p.Y(K * a_ * t1 - 30) + 4, "KaT = 60 rad/s", "start", 9.5, PUR, True, halo=True))
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
    return SVG(700, 290, o, "ランプ応答（モータ、K = 50 (rad/s)/V、T = 0.05 s）。(a) 電圧を一定の速さ 24 V/s で上げると、角速度は、電圧に K を掛けた直線より、ちょうど T だけ遅れてついていく（値では KaT = 60 rad/s だけ下）。0.5 s で上げるのを止めると、時定数 0.05 s で 600 rad/s に近づく。(b) 電流は 0.6 A を超えず、急に 12 V を加えたときの 6 A の 1/10 である（一次の式で計算した値）。")
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
    return SVG(700, y0 + 2, o, "RC 回路（T = 0.1 s）に方形波を加えたときの電圧。方形波は、増えるステップと減るステップが交互に並んだもので、応答はステップ応答を重ねたものになる。半周期 t_w が時定数より長いと出力は毎回ほぼ落ち着き、短いと平均 0.5 V のまわりで小さく往復するだけになる。破線は、往復が一定になったときの上端と下端の式の値。")
F["e03_square"] = _f03_square_fig()
