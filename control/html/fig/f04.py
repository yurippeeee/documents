# -*- coding: utf-8 -*-
# 04 章 二次遅れの応答 の図
import numpy as _f04_np


# ---- 補助: 文字の幅（結合文字の点は幅 0、ギリシャ文字・記号は半角程度） ----
def _f04_tw(s, sz):
    w = 0.0
    for ch in str(s):
        o = ord(ch)
        if 0x300 <= o <= 0x36F:
            continue
        if o < 128:
            w += sz * 0.56
        elif 0x370 <= o <= 0x3FF:
            w += sz * 0.6
        elif o in (0xB2, 0xB3, 0xB9) or 0x2070 <= o <= 0x209F:
            w += sz * 0.4
        elif o in (0x2212, 0xB1, 0xD7, 0xF7, 0x221A, 0x2248, 0x2264, 0x2265, 0xB7, 0xB0, 0x2032):
            w += sz * 0.62
        elif 0x1E00 <= o <= 0x1EFF:
            w += sz * 0.56
        else:
            w += sz * 1.0
    return w


# ---- 補助: 式の文字（部分ごとに色・斜体・添字）。parts = [(文字, 添字, 斜体か[, 色]), ...] ----
def _f04_m(x, y, parts, a="start", sz=12, c=INK, b=False, halo=True):
    w = 0.0
    for p in parts:
        w += _f04_tw(p[0], sz) + (_f04_tw(p[1], sz * 0.72) if p[1] else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    hl = (' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' % SCR) if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hl)]
    pend = 0
    for p in parts:
        s, sub, it = p[0], p[1], p[2]
        col = (' fill="%s"' % p[3]) if len(p) > 3 and p[3] else ""
        o.append('<tspan font-style="%s"%s%s>%s</tspan>' % ("italic" if it else "normal", col, (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g"%s>%s</tspan>' % (round(sz * 0.72, 2), col, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)


def _f04_v(s, sub=None, c=None):
    """斜体の記号（_f04_m の部品）。"""
    return (s, sub, True, c)


def _f04_g(s, sub=None, c=None):
    """立体の記号（ギリシャ文字など。_f04_m の部品）。"""
    return (s, sub, False, c)


def _f04_t(s, c=None):
    """立体の文字（_f04_m の部品）。"""
    return (s, None, False, c)


def _f04_P(text):
    """よく使う式の部品を、簡単な書き方から作る。"wn" → ω_n、"wd" → ω_d、"z" → ζ、"t2" → t_2%、"tr"・"tp"・"Mp"。"""
    tab = {"wn": ("ω", "n", False), "wd": ("ω", "d", False), "z": ("ζ", None, False), "tr": ("t", "r", True),
           "tp": ("t", "p", True), "Mp": ("M", "p", True), "t2": ("t", "2%", True), "KP": ("K", "P", True),
           "thm": ("θ", "m", False), "wm": ("ω", "m", False), "psi": ("ψ", None, False), "lam": ("λ", None, False)}
    return tab[text]


# ---- 補助: 範囲で切った折れ線（範囲の外に出る所で線を切る） ----
def _f04_pl(p, pts, c=SIG, lw=2.0, dash=None):
    lo, hi = min(p.yr), max(p.yr)
    xl, xh = min(p.xr), max(p.xr)
    segs, cur, prev = [], [], None
    for a, b in pts:
        if a < xl - 1e-12 or a > xh + 1e-12 or not math.isfinite(b):
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
                cur = [(pa + (a - pa) * (lim - pb) / (b - pb), lim)]
            elif pin and not inside:
                lim = hi if b > hi else lo
                cur.append((pa + (a - pa) * (lim - pb) / (b - pb), lim))
                segs.append(cur); cur = []
        if inside:
            cur.append((a, b))
        prev = (a, b)
    if cur:
        segs.append(cur)
    return "".join(PL([(p.X(a), p.Y(b)) for a, b in s], c=c, lw=lw, dash=dash) for s in segs if len(s) >= 2)


def _f04_ppl(p, xs, ys, c=SIG, lw=2.0, dash=None):
    """位相平面など、x と y の両方を範囲で切る折れ線（範囲の外の点で線を切る）。"""
    segs, cur = [], []
    for a, b in zip(xs, ys):
        if min(p.xr) <= a <= max(p.xr) and min(p.yr) <= b <= max(p.yr):
            cur.append((p.X(a), p.Y(b)))
        elif cur:
            segs.append(cur); cur = []
    if cur:
        segs.append(cur)
    return "".join(PL(s, c=c, lw=lw, dash=dash) for s in segs if len(s) >= 2)


# ---- 二次遅れの解（閉じた式。2・3 節の式そのもの） ----
def _f04_free(z, wn, t, y0, v0):
    """入力の無い標準形の解 y(t) と速度 ẏ(t)（初期値 y0・v0）。t は numpy の配列。"""
    t = _f04_np.asarray(t, dtype=float)
    if z < 1 - 1e-12:
        s = z * wn; wd = wn * math.sqrt(1 - z * z)
        C = (v0 + s * y0) / wd
        e = _f04_np.exp(-s * t); cs, sn = _f04_np.cos(wd * t), _f04_np.sin(wd * t)
        y = e * (y0 * cs + C * sn)
        v = e * ((-s * y0 + wd * C) * cs + (-s * C - wd * y0) * sn)
        return y, v
    if abs(z - 1) <= 1e-12:
        B = v0 + wn * y0; e = _f04_np.exp(-wn * t)
        return (y0 + B * t) * e, (B - wn * (y0 + B * t)) * e
    r = math.sqrt(z * z - 1); l1 = -wn * (z - r); l2 = -wn * (z + r)
    A = (v0 - l2 * y0) / (l1 - l2); B = (l1 * y0 - v0) / (l1 - l2)
    return A * _f04_np.exp(l1 * t) + B * _f04_np.exp(l2 * t), A * l1 * _f04_np.exp(l1 * t) + B * l2 * _f04_np.exp(l2 * t)


def _f04_step(z, wn, t, K=1.0):
    """単位ステップ応答（最終値 K）と速度。最終値からのずれが自由な動きになることを使う。"""
    y, v = _f04_free(z, wn, t, -K, 0.0)
    return K + y, v


def _f04_bisect(f, a, b, n=80):
    fa = f(a)
    for _ in range(n):
        m = 0.5 * (a + b); fm = f(m)
        if (fa < 0) == (fm < 0):
            a, fa = m, fm
        else:
            b = m
    return 0.5 * (a + b)


def _f04_index(z):
    """正規化した（ω_n = 1、最終値 1 の）ステップ応答の指標 (ω_n t_r, ω_n t_p, M_p [割合], ω_n t_2%)。"""
    yv = lambda t: float(_f04_step(z, 1.0, [t])[0][0])
    if z < 1:
        wd = math.sqrt(1 - z * z); tp = math.pi / wd; Mp = math.exp(-math.pi * z / wd)
        t10 = _f04_bisect(lambda t: yv(t) - 0.1, 0.0, tp); t90 = _f04_bisect(lambda t: yv(t) - 0.9, 0.0, tp)
        if Mp > 0.02:
            nst = int(math.ceil(math.log(0.02) / math.log(Mp))) - 1     # ずれが 2 % を超える最後の山（谷）
            ta = nst * math.pi / wd
            sg = 1.0 if nst % 2 == 1 else -1.0                           # 奇数番目は山（最終値より上）
            # その山（谷）から、次に最終値を横切るまでの間で、ずれが 2 % に下がる時刻
            tz = _f04_bisect(lambda t: yv(t) - 1, ta, ta + math.pi / wd)
            t2 = _f04_bisect(lambda t: sg * (yv(t) - 1) - 0.02, ta, tz)
        else:
            t2 = _f04_bisect(lambda t: yv(t) - 0.98, 0.0, tp)
        return t90 - t10, tp, Mp, t2
    hi = 60.0 * z
    t10 = _f04_bisect(lambda t: yv(t) - 0.1, 0.0, hi); t90 = _f04_bisect(lambda t: yv(t) - 0.9, 0.0, hi)
    t2 = _f04_bisect(lambda t: yv(t) - 0.98, 0.0, hi)
    return t90 - t10, None, 0.0, t2


def _f04_num(v, d=2):
    """小数を d 桁で、負号は −。"""
    s = ("%." + str(d) + "f") % v
    return s.replace("-", "−")


# ---- 補助: 部品の絵（2 章と同じ見た目） ----
def _f04_spring(x1, x2, y, n=7, amp=7, c=TEA, lw=1.5):
    lead = min(10, (x2 - x1) * 0.15)
    xs, xe = x1 + lead, x2 - lead
    pts = [(x1, y), (xs, y)]
    for i in range(2 * n):
        pts.append((xs + (xe - xs) * (i + 0.5) / (2 * n), y + (amp if i % 2 == 0 else -amp)))
    pts += [(xe, y), (x2, y)]
    return PL(pts, c=c, lw=lw)


def _f04_damper(x1, x2, y, c=PUR, lw=1.5):
    xm = (x1 + x2) / 2
    return "".join([W(x1, y, xm - 6, y, c=c, lw=lw),
                    W(xm - 14, y - 8, xm + 14, y - 8, c=c, lw=lw), W(xm - 14, y + 8, xm + 14, y + 8, c=c, lw=lw),
                    W(xm + 14, y - 8, xm + 14, y + 8, c=c, lw=lw),
                    W(xm - 6, y - 6, xm - 6, y + 6, c=c, lw=lw + 0.6), W(xm - 6, y, x2, y, c=c, lw=lw)])


def _f04_wall(x, y0, y1, c=MUT):
    o = [W(x, y0, x, y1, c=c, lw=1.8)]
    yy = y0 + 4
    while yy < y1:
        o.append(W(x, yy, x - 7, yy + 7, c=c, lw=1))
        yy += 9
    return "".join(o)


def _f04_cart(x, y, w, h, c=SIG):
    o = [RECT(x, y, w, h, 4, soft(c), c, 1.5)]
    for xx in (x + w * 0.25, x + w * 0.75):
        o.append(CIRC(xx, y + h + 4, 4, c=c, lw=1.4, fill=SCR))
    return "".join(o)


def _f04_num_dot(x, y, k, c=SIG, r=7.5):
    """番号の付いた小さな丸（波形と軌跡の対応）。"""
    return CIRC(x, y, r, c=c, lw=1.4, fill=SCR) + T(x, y + 3.6, str(k), "middle", 10, c, True)


# =====================================================================
# 1 節: 標準形と、例の対象の係数
# =====================================================================
def _f04_form_fig():
    o = []
    o.append(T(14, 18, "(a) 台車の式を、m で割って標準形にそろえる", "start", 11.5, INK, True))
    y1, y2, y3 = 54, 104, 150
    # 台車の式
    o.append(T(14, y1, "台車の式", "start", 10.5, MUT))
    o.append(_f04_m(120, y1, [("m", None, True, SIG), ("p̈", None, True, SIG), _f04_t(" + "), ("c", None, True, PUR), ("ṗ", None, True, PUR),
                              _f04_t(" + "), ("k", None, True, TEA), ("p", None, True, TEA), _f04_t(" = "), ("u", None, True, GLD)], "start", 14, INK))
    o.append(T(14, y2, "m で割る", "start", 10.5, MUT))
    # m で割った式（係数の位置を下の標準形とそろえる）
    xs = [120, 190, 296, 404]
    o.append(_f04_m(xs[0], y2, [("p̈", None, True, SIG), _f04_t(" + ")], "start", 14, INK))
    o.append(_f04_m(xs[1], y2, [_f04_t("("), ("c", None, True, PUR), _f04_t("/"), ("m", None, True), _f04_t(")"), ("ṗ", None, True), _f04_t(" + ")], "start", 14, INK))
    o.append(_f04_m(xs[2], y2, [_f04_t("("), ("k", None, True, TEA), _f04_t("/"), ("m", None, True), _f04_t(")"), ("p", None, True), _f04_t(" = ")], "start", 14, INK))
    o.append(_f04_m(xs[3], y2, [_f04_t("(1/"), ("m", None, True), _f04_t(")"), ("u", None, True, GLD)], "start", 14, INK))
    o.append(T(14, y3, "標準形", "start", 10.5, MUT))
    o.append(_f04_m(xs[0], y3, [("ÿ", None, True, SIG), _f04_t(" + ")], "start", 14, INK, True))
    o.append(_f04_m(xs[1], y3, [_f04_t("2"), _f04_g("ζ", None, PUR), _f04_g("ω", "n", PUR), ("ẏ", None, True), _f04_t(" + ")], "start", 14, INK, True))
    o.append(_f04_m(xs[2], y3, [_f04_g("ω", None, TEA), _f04_t("n²", TEA), ("y", None, True), _f04_t(" = ")], "start", 14, INK, True))
    o.append(_f04_m(xs[3], y3, [_f04_g("ω", None, GLD), _f04_t("n²", GLD), ("K", None, True, GLD), ("u", None, True)], "start", 14, INK, True))
    for x in xs[1:]:
        o.append(W(x + 26, y2 + 7, x + 26, y3 - 16, c=FNT, lw=1, dash="3 3"))
    # 係数を比べた結果
    xr = 488
    o.append(T(xr, y1 - 6, "係数を比べると", "start", 10.5, MUT))
    o.append(_f04_m(xr, y1 + 18, [_f04_g("ω", "n"), _f04_t(" = √("), ("k", None, True), _f04_t("/"), ("m", None, True), _f04_t(") = 5 rad/s")], "start", 12, TEA, True))
    o.append(_f04_m(xr, y1 + 44, [_f04_g("ζ"), _f04_t(" = "), ("c", None, True), _f04_t(" / (2√("), ("mk", None, True), _f04_t(")) = 0.2")], "start", 12, PUR, True))
    o.append(_f04_m(xr, y1 + 70, [("K", None, True), _f04_t(" = 1/"), ("k", None, True), _f04_t(" = 4 cm/N")], "start", 12, GLD, True))
    o.append(T(xr, y1 + 92, "（例の値 m 1 kg・c 2 N·s/m・k 25 N/m）", "start", 9.5, MUT))
    # (b) 例の表
    yb = 196
    o.append(W(12, yb - 16, 688, yb - 16, c=LIN, lw=0.8))
    o.append(T(14, yb + 4, "(b) 二次遅れになる対象の例（値は例の値）", "start", 11.5, INK, True))
    hy = yb + 30
    cols = [14, 222, 412, 490, 556, 638]
    heads = ["対象（出力 ← 入力）", "式の係数 a₂ / a₁ / a₀ / b₀", "ω_n", "ζ", "K", "揺れるか"]
    for x, h in zip(cols, heads):
        if h == "ω_n":
            o.append(_f04_m(x, hy, [_f04_g("ω", "n")], "start", 10.5, INK, True))
        elif h == "ζ":
            o.append(_f04_m(x, hy, [_f04_g("ζ")], "start", 10.5, INK, True))
        elif h == "K":
            o.append(_f04_m(x, hy, [("K", None, True)], "start", 10.5, INK, True))
        else:
            o.append(T(x, hy, h, "start", 10.5, INK, True))
    o.append(W(14, hy + 7, 688, hy + 7, c=LIN, lw=1))
    rows = [("台車（位置 ← 力）", "m / c / k / 1", "5 rad/s", "0.2", "4 cm/N", "揺れる", ALI),
            ("台車のダンパを強く（c 10 N·s/m）", "m / c / k / 1", "5 rad/s", "1", "4 cm/N", "揺れない", GRN),
            ("モータ（角速度 ← 電圧、La 1 mH）", "LaJ / RaJ / Kt² / Kt", "200 rad/s", "5", "50 (rad/s)/V", "揺れない", GRN),
            ("モータ（La を 50 倍の 50 mH）", "LaJ / RaJ / Kt² / Kt", "28.3 rad/s", "0.71", "50 (rad/s)/V", "揺れる", ALI)]
    for i, (a_, b_, c_, d_, e_, f_, cc) in enumerate(rows):
        y = hy + 26 + i * 22
        if "La" in a_:
            pre, post = a_.split("La")
            o.append(_f04_m(cols[0], y, [_f04_t(pre), ("L", "a", True), _f04_t(post)], "start", 10, INK, False, False))
        else:
            o.append(T(cols[0], y, a_, "start", 10, INK))
        if "La" in b_:
            o.append(_f04_m(cols[1], y, [("L", "a", True), ("J", None, True), _f04_t(" / "), ("R", "a", True), ("J", None, True), _f04_t(" / "),
                                         ("K", "t", True), _f04_t("² / "), ("K", "t", True)], "start", 10, MUT, False, False))
        else:
            o.append(_f04_m(cols[1], y, [("m", None, True), _f04_t(" / "), ("c", None, True), _f04_t(" / "), ("k", None, True), _f04_t(" / 1")], "start", 10, MUT, False, False))
        o.append(T(cols[2], y, c_, "start", 10, TEA, True))
        o.append(T(cols[3], y, d_, "start", 10, PUR, True))
        o.append(T(cols[4], y, e_, "start", 10, GLD, True))
        o.append(T(cols[5], y, f_, "start", 10, cc, True))
    return SVG(700, hy + 26 + 3 * 22 + 12, o, "二次遅れの標準形。(a) 台車の式を質量 m で割り、各項の係数を標準形と比べると、固有角周波数 ω<sub>n</sub>・減衰比 ζ・定常ゲイン K が m・c・k から決まる。式の色は、比べる係数どうしで同じにした。(b) 台車と、巻線のインダクタンス L<sub>a</sub> を含めた DC モータの例。どの対象でも、2 階の式の 4 つの係数から ω<sub>n</sub> = √(a<sub>0</sub>/a<sub>2</sub>)、ζ = a<sub>1</sub>/(2√(a<sub>0</sub>a<sub>2</sub>))、K = b<sub>0</sub>/a<sub>0</sub> が決まる。")
F["e04_form"] = _f04_form_fig()


def _f04_scale_fig():
    o = []
    cases = [(2.5, TEA, "6 3"), (5.0, SIG, None), (10.0, GLD, "2 3")]
    o.append(T(14, 18, "(a) 横軸は時間 t（ζ = 0.2、ω_n を 3 通り）", "start", 11.5, INK, True))
    p = Plot(62, 34, 270, 180, (0, 6), (0, 1.7))
    o.append(p.axes(xl="時間 t [s]", yl="y ÷ 最終値", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.5, 1.0, 1.5], yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 1), (6, 1)], c=MUT, lw=1.1, dash="4 3"))
    t = _f04_np.linspace(0, 6, 1201)
    for wn, c, dash in cases:
        y, v = _f04_step(0.2, wn, t)
        o.append(_f04_pl(p, list(zip(t, y)), c=c, lw=2.2, dash=dash))
        tp = math.pi / (wn * math.sqrt(0.96))
        o.append(D(p.X(tp), p.Y(1.5266), c, 3.4))
    o.append(_f04_m(p.X(0.35), p.Y(1.62), [_f04_g("ω", "n"), _f04_t(" = 10")], "start", 9.5, GLD, True))
    o.append(_f04_m(p.X(1.1), p.Y(1.62), [_f04_t("5")], "start", 9.5, SIG, True))
    o.append(_f04_m(p.X(1.38), p.Y(1.47), [_f04_t("2.5 rad/s")], "start", 9.5, TEA, True))
    o.append(T(p.X(5.9), p.Y(0.3), "山の時刻 0.32・0.64・1.28 s", "end", 9.5, MUT, halo=True))
    o.append(T(370, 18, "(b) 横軸を ω_n t にとる", "start", 11.5, INK, True))
    q = Plot(410, 34, 270, 180, (0, 20), (0, 1.7))
    o.append(q.axes(xl="ω_n t（時間 × 固有角周波数）", yl=None, xt=[0, 5, 10, 15, 20], yt=[0, 0.5, 1.0, 1.5], yfmt=lambda v: "%g" % v))
    o.append(q.line([(0, 1), (20, 1)], c=MUT, lw=1.1, dash="4 3"))
    tt = _f04_np.linspace(0, 20, 1201)
    for wn, c, dash in cases:
        y, v = _f04_step(0.2, wn, tt / wn)
        o.append(_f04_pl(q, list(zip(tt, y)), c=c, lw={2.5: 4.2, 5.0: 2.4, 10.0: 1.4}[wn], dash=dash))
    o.append(T(q.X(3.4), q.Y(1.62), "3 本が重なる（山は ω_n t = 3.21）", "start", 9.5, INK, True, halo=True))
    o.append(LEGL(62, 266, [(TEA, "6 3", "ω_n = 2.5 rad/s"), (SIG, None, "ω_n = 5 rad/s（例の台車）"), (GLD, "2 3", "ω_n = 10 rad/s")]))
    return SVG(700, 276, o, "固有角周波数は時間の目盛を決める。(a) 減衰比を 0.2 のまま、固有角周波数を 2.5・5・10 rad/s にしたステップ応答（縦軸は最終値で割った値）。ω<sub>n</sub> を 2 倍にすると、同じ形の応答が半分の時間で起きる。(b) 横軸を ω<sub>n</sub> t にとると 3 本は重なり、形は減衰比だけで決まる。")
F["e04_scale"] = _f04_scale_fig()


# =====================================================================
# 2 節: 複素数の根の指数関数・根の平面・4 つの場合
# =====================================================================
def _f04_expo_fig():
    o = []
    wd, s = 5 * math.sqrt(0.96), 1.0
    Tp = 2 * math.pi / wd
    o.append(T(14, 18, "(a) 複素平面の上の e^λt（λ = −1 + j4.90）", "start", 11.5, INK, True))
    p = Plot(70, 40, 240, 240, (-1.1, 1.1), (-1.1, 1.1))
    o.append(p.axes(xl="実部", yl="虚部", xt=[-1, -0.5, 0, 0.5, 1], yt=[-1, -0.5, 0, 0.5, 1], grid=True))
    o.append(W(p.X(-1.1), p.Y(0), p.X(1.1), p.Y(0), c=MUT, lw=1))
    o.append(W(p.X(0), p.Y(-1.1), p.X(0), p.Y(1.1), c=MUT, lw=1))
    t = _f04_np.linspace(0, 3.0, 1501)
    zr = _f04_np.exp(-s * t) * _f04_np.cos(wd * t); zi = _f04_np.exp(-s * t) * _f04_np.sin(wd * t)
    o.append(PL([(p.X(a), p.Y(-b)) for a, b in zip(zr, zi)], c=MUT, lw=1.3, dash="4 3"))
    o.append(PL([(p.X(a), p.Y(b)) for a, b in zip(zr, zi)], c=SIG, lw=2.2))
    o.append(CIRC(p.X(0), p.Y(0), (p.X(1) - p.X(0)), c=FNT, lw=1, dash="2 3"))
    marks = [0, Tp / 4, Tp / 2, 3 * Tp / 4, Tp]
    for k, tm in enumerate(marks):
        a, b = math.exp(-tm) * math.cos(wd * tm), math.exp(-tm) * math.sin(wd * tm)
        o.append(W(p.X(a), p.Y(b), p.X(a), p.Y(0), c=SIG, lw=1, dash="2 2"))
        o.append(_f04_num_dot(p.X(a) + (9 if k in (0, 4) else 0), p.Y(b) + (-10 if k in (1,) else (10 if k == 3 else 0)), k + 1))
    o.append(T(p.X(0.12), p.Y(0.9), "回る速さ ω_d = 4.90 rad/s", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-1.05), p.Y(-0.9), "半径 e^−t で縮む", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.35), p.Y(-0.55), "共役の根 −1 − j4.90", "start", 9.5, MUT, halo=True))
    o.append(T(p.X(0.35), p.Y(-0.68), "（逆向きに回る）", "start", 9.5, MUT, halo=True))
    # (b) 実部の時間波形
    o.append(T(360, 18, "(b) 実部 e^−t cos 4.90t の時間波形", "start", 11.5, INK, True))
    q = Plot(400, 40, 280, 240, (0, 3), (-1.1, 1.1))
    o.append(q.axes(xl="時間 t [s]", yl="実部", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[-1, -0.5, 0, 0.5, 1], grid=True))
    o.append(W(q.X(0), q.Y(0), q.X(3), q.Y(0), c=MUT, lw=1))
    o.append(q.line([(a, math.exp(-a)) for a in t], c=FNT, lw=1.3, dash="5 3"))
    o.append(q.line([(a, -math.exp(-a)) for a in t], c=FNT, lw=1.3, dash="5 3"))
    o.append(q.line(list(zip(t, zr)), c=SIG, lw=2.2))
    for k, tm in enumerate(marks):
        a = math.exp(-tm) * math.cos(wd * tm)
        o.append(_f04_num_dot(q.X(tm), q.Y(a) + (-11 if k % 2 == 0 else 11), k + 1))
    o.append(T(q.X(1.2), q.Y(0.52), "包絡線 ± e^−t", "start", 9.5, MUT, halo=True))
    o.append(DIM(q.X(0), q.Y(-0.98), q.X(Tp), q.Y(-0.98), None, c=GLD))
    o.append(T(q.X(Tp / 2), q.Y(-0.98) + 14, "周期 2π/ω_d = 1.28 s", "middle", 9.5, GLD, True, halo=True))
    return SVG(700, 330, o, "複素数の特性根の解 e<sup>λt</sup>（例の台車の根 λ = −1 + j4.90）。(a) 複素平面の上で、点は角速度 ω<sub>d</sub> で回りながら、半径 e<sup>−t</sup> で原点へ縮む（番号は 1/4 周期ごとの位置）。共役の根の解は逆向きに回る（破線）。2 つを足して 2 で割ると虚部が消え、実部だけが残る。(b) 実部は、包絡線 ±e<sup>−t</sup> の間で揺れる減衰振動になる。")
F["e04_expo"] = _f04_expo_fig()
