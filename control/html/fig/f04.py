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


# ---- 補助: 式の文字（部分ごとに色・斜体・添字・上付き）。parts = [(文字, 添字, 斜体か[, 色[, 上付き]]), ...] ----
def _f04_m(x, y, parts, a="start", sz=12, c=INK, b=False, halo=True, rot=None):
    w = 0.0
    for p in parts:
        w += _f04_tw(p[0], sz)
        if len(p) > 1 and p[1]:
            w += _f04_tw(p[1], sz * 0.72)
        if len(p) > 4 and p[4]:
            w += _f04_tw(p[4], sz * 0.72)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK and rot is None:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + ((p[1] or "") if len(p) > 1 else "") for p in parts)))
    hl = (' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' % SCR) if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hl)]
    cur = 0
    ssz = round(sz * 0.72, 2)
    xx = x0; dots = []
    for p in parts:
        s_ = p[0]; sub = p[1] if len(p) > 1 else None; it = p[2] if len(p) > 2 else False
        col = (' fill="%s"' % p[3]) if len(p) > 3 and p[3] else ""
        sup = p[4] if len(p) > 4 else None
        nd = p[5] if len(p) > 5 else 0
        o.append('<tspan font-style="%s"%s%s>%s</tspan>' % ("italic" if it else "normal", col, (' dy="%g"' % (-cur)) if cur else "", E(s_)))
        wb = _f04_tw(s_, sz)
        if nd:
            xc = xx + wb / 2 + (sz * 0.08 if it else 0)
            for k in range(nd):
                dots.append((xc + (k - (nd - 1) / 2) * sz * 0.26, y - sz * 0.86, (p[3] if len(p) > 3 and p[3] else c)))
        xx += wb
        cur = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g"%s>%s</tspan>' % (ssz, col, E(sub)))
            cur = 3; xx += _f04_tw(sub, sz * 0.72)
        if sup:
            o.append('<tspan dy="%g" font-size="%g"%s>%s</tspan>' % (-5 - cur, ssz, col, E(sup)))
            cur = -5; xx += _f04_tw(sup, sz * 0.72)
    o.append("</text>")
    for dx, dy, dc in dots:
        o.append('<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (round(dx, 2), round(dy, 2), round(max(1.0, sz * 0.085), 2), dc))
    if rot is not None:
        return '<g transform="rotate(%g %g %g)">%s</g>' % (rot, round(x, 2), round(y, 2), "".join(o))
    return "".join(o)


def _f04_e(sup, c=None):
    """e の右肩に sup を書く部品（_f04_m の部品）。"""
    return ("e", None, True, c, sup)


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
    o.append(_f04_m(xs[2], y3, [("ω", "n", False, TEA), _f04_t("²", TEA), ("y", None, True), _f04_t(" = ")], "start", 14, INK, True))
    o.append(_f04_m(xs[3], y3, [("ω", "n", False, GLD), _f04_t("²", GLD), ("K", None, True, GLD), ("u", None, True)], "start", 14, INK, True))
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
    o.append(_f04_m(14, 18, [_f04_t("(a) 横軸は時間 "), _f04_v("t"), _f04_t("（"), _f04_g("ζ"), _f04_t(" = 0.2、"), _f04_g("ω", "n"), _f04_t(" を 3 通り）")], "start", 11.5, INK, True, False))
    p = Plot(62, 34, 270, 180, (0, 6), (0, 1.7))
    o.append(p.axes(xl="時間 t [s]", yl="y ÷ 最終値", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.5, 1.0, 1.5], yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 1), (6, 1)], c=MUT, lw=1.1, dash="4 3"))
    t = _f04_np.linspace(0, 6, 1201)
    for wn, c, dash in cases:
        y, v = _f04_step(0.2, wn, t)
        o.append(_f04_pl(p, list(zip(t, y)), c=c, lw=2.2, dash=dash))
        tp = math.pi / (wn * math.sqrt(0.96))
        o.append(D(p.X(tp), p.Y(1.5266), c, 3.4))
    o.append(T(p.X(5.9), p.Y(0.3), "山の時刻 0.32・0.64・1.28 s", "end", 9.5, MUT, halo=True))
    o.append(_f04_m(370, 18, [_f04_t("(b) 横軸を "), _f04_g("ω", "n"), _f04_v("t"), _f04_t(" にとる")], "start", 11.5, INK, True, False))
    q = Plot(410, 34, 270, 180, (0, 20), (0, 1.7))
    o.append(q.axes(xl=None, yl=None, xt=[0, 5, 10, 15, 20], yt=[0, 0.5, 1.0, 1.5], yfmt=lambda v: "%g" % v))
    o.append(_f04_m(q.x + q.w / 2, q.y + q.h + 31, [_f04_g("ω", "n"), _f04_v("t"), _f04_t("（時間 × 固有角周波数）")], "middle", 10, MUT, False, False))
    o.append(q.line([(0, 1), (20, 1)], c=MUT, lw=1.1, dash="4 3"))
    tt = _f04_np.linspace(0, 20, 1201)
    for wn, c, dash in cases:
        y, v = _f04_step(0.2, wn, tt / wn)
        o.append(_f04_pl(q, list(zip(tt, y)), c=c, lw={2.5: 4.2, 5.0: 2.4, 10.0: 1.4}[wn], dash=dash))
    o.append(_f04_m(q.X(3.4), q.Y(1.62), [_f04_t("3 本が重なる（山は "), _f04_g("ω", "n"), _f04_v("t"), _f04_t(" = 3.21）")], "start", 9.5, INK, True))
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
    o.append(_f04_m(14, 18, [_f04_t("(a) 複素平面の上の "), _f04_e("λt"), _f04_t("（"), _f04_g("λ"), _f04_t(" = −1 + "), _f04_v("j"), _f04_t("4.90）")], "start", 11.5, INK, True, False))
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
    o.append(_f04_m(p.X(0.12), p.Y(0.9), [_f04_t("回る速さ "), _f04_g("ω", "d"), _f04_t(" = 4.90 rad/s")], "start", 9.5, SIG, True))
    o.append(_f04_m(p.X(-1.05), p.Y(-0.9), [_f04_t("半径 "), _f04_e("−t"), _f04_t(" で縮む")], "start", 9.5, SIG, True))
    o.append(_f04_m(p.X(0.35), p.Y(-0.55), [_f04_t("共役の根 −1 − "), _f04_v("j"), _f04_t("4.90")], "start", 9.5, MUT))
    o.append(T(p.X(0.35), p.Y(-0.68), "（逆向きに回る）", "start", 9.5, MUT, halo=True))
    # (b) 実部の時間波形
    o.append(_f04_m(360, 18, [_f04_t("(b) 実部 "), _f04_e("−t"), _f04_t(" cos 4.90"), _f04_v("t"), _f04_t(" の時間波形")], "start", 11.5, INK, True, False))
    q = Plot(400, 40, 280, 240, (0, 3), (-1.1, 1.1))
    o.append(q.axes(xl="時間 t [s]", yl="実部", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3], yt=[-1, -0.5, 0, 0.5, 1], grid=True))
    o.append(W(q.X(0), q.Y(0), q.X(3), q.Y(0), c=MUT, lw=1))
    o.append(q.line([(a, math.exp(-a)) for a in t], c=FNT, lw=1.3, dash="5 3"))
    o.append(q.line([(a, -math.exp(-a)) for a in t], c=FNT, lw=1.3, dash="5 3"))
    o.append(q.line(list(zip(t, zr)), c=SIG, lw=2.2))
    for k, tm in enumerate(marks):
        a = math.exp(-tm) * math.cos(wd * tm)
        o.append(_f04_num_dot(q.X(tm), q.Y(a) + (-11 if k % 2 == 0 else 11), k + 1))
    o.append(_f04_m(q.X(1.2), q.Y(0.52), [_f04_t("包絡線 ±"), _f04_e("−t")], "start", 9.5, MUT))
    o.append(DIM(q.X(0), q.Y(-0.8), q.X(Tp), q.Y(-0.8), None, c=GLD))
    o.append(_f04_m(q.X(Tp / 2), q.Y(-0.8) + 15, [_f04_t("周期 2π/"), _f04_g("ω", "d"), _f04_t(" = 1.28 s")], "middle", 9.5, GLD, True))
    return SVG(700, 330, o, "複素数の特性根の解 e<sup>λt</sup>（例の台車の根 λ = −1 + j4.90）。(a) 複素平面の上で、点は角速度 ω<sub>d</sub> で回りながら、半径 e<sup>−t</sup> で原点へ縮む（番号は 1/4 周期ごとの位置）。共役の根の解は逆向きに回る（破線）。2 つを足して 2 で割ると虚部が消え、実部だけが残る。(b) 実部は、包絡線 ±e<sup>−t</sup> の間で揺れる減衰振動になる。")
F["e04_expo"] = _f04_expo_fig()


def _f04_roots_fig():
    o = []
    o.append(_f04_m(14, 18, [_f04_t("(a) "), _f04_g("ω", "n"), _f04_t(" = 5 rad/s のまま "), _f04_g("ζ"), _f04_t(" を 0 から 2 まで増やす")], "start", 11.5, INK, True, False))
    p = Plot(56, 40, 360, 192, (-20.5, 2), (-6, 6))
    o.append(SPLANE(p))
    o.append(p.axes(xl="実部", yl="虚部", xt=[-20, -15, -10, -5, 0], yt=[-5, 0, 5]))
    o.append(SPLANE(p))
    # ζ を 0 → 1 の円弧と、1 より大きいときの実軸の上の動き
    arc = [(-5 * z, 5 * math.sqrt(max(0.0, 1 - z * z))) for z in _f04_np.linspace(0, 1, 121)]
    for sg in (1, -1):
        o.append(PL([(p.X(a), p.Y(sg * b)) for a, b in arc], c=GLD, lw=2.4, op=None))
    o.append(W(p.X(-5), p.Y(0), p.X(-0.6), p.Y(0), c=GLD, lw=2.4))
    o.append(W(p.X(-5), p.Y(0), p.X(-20.3), p.Y(0), c=GLD, lw=2.4))
    o.append(_head(p.X(-3), p.Y(0), p.X(-0.5), p.Y(0), GLD, 8))
    o.append(_head(p.X(-15), p.Y(0), p.X(-20.4), p.Y(0), GLD, 8))
    for sg in (1, -1):
        a1 = math.radians(64); a2 = math.radians(54)
        o.append(_head(p.X(-5 * math.cos(a1)), p.Y(sg * 5 * math.sin(a1)), p.X(-5 * math.cos(a2)), p.Y(sg * 5 * math.sin(a2)), GLD, 8))
    pts = []
    labs = []
    for z in (0.0, 0.2, 0.5, 0.707):
        wd = 5 * math.sqrt(1 - z * z)
        pts += [complex(-5 * z, wd), complex(-5 * z, -wd)]
    pts += [complex(-5, 0), complex(-2.5, 0), complex(-10, 0), complex(-1.34, 0), complex(-18.66, 0)]
    o.append(PZ(p, pts, [], SIG))
    o.append(_f04_m(p.X(0.25), p.Y(5.25), [_f04_g("ζ"), _f04_t(" = 0")], "start", 9.5, SIG, True))
    o.append(T(p.X(-1.15), p.Y(5.6), "0.2", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-3.0), p.Y(5.15), "0.5", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-4.15), p.Y(4.35), "0.71", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-5), p.Y(-1.05), "1（重根）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-2.5), p.Y(0.75), "1.25", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-10), p.Y(0.75), "1.25", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-1.2), p.Y(-0.95), "2", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-18.66), p.Y(0.75), "2", "middle", 9.5, SIG, True, halo=True))
    o.append(_f04_m(p.X(-19.8), p.Y(4.6), [_f04_g("ζ"), _f04_t(" < 1: 半径 "), _f04_g("ω", "n"), _f04_t(" の円の上")], "start", 9.5, GLD, True))
    o.append(_f04_m(p.X(-19.8), p.Y(3.5), [_f04_g("ζ"), _f04_t(" > 1: 実軸の上で 2 つに分かれる")], "start", 9.5, GLD, True))
    o.append(T(p.X(-19.8), p.Y(-3.6), "実部が正の側（薄い赤）に根があると、", "start", 9.5, MUT, halo=True))
    o.append(T(p.X(-19.8), p.Y(-4.7), "揺れが大きくなり続ける", "start", 9.5, MUT, halo=True))
    # (b) 1 つの根の幾何
    o.append(_f04_m(450, 18, [_f04_t("(b) 根の位置の読み方（"), _f04_g("ζ"), _f04_t(" = 0.5 の例）")], "start", 11.5, INK, True, False))
    q = Plot(492, 40, 180, 190, (-6, 0.6), (-1.4, 5.6))
    o.append(SPLANE(q))
    o.append(q.axes(xl="実部", yl=None, xt=[-6, -4, -2, 0], yt=[0, 2, 4]))
    o.append(SPLANE(q))
    z = 0.5; re, im = -2.5, 5 * math.sqrt(0.75)
    o.append(PL([(q.X(-5 * math.cos(a)), q.Y(5 * math.sin(a))) for a in _f04_np.linspace(0, math.pi / 2, 60)], c=FNT, lw=1, dash="3 3"))
    o.append(W(q.X(0), q.Y(0), q.X(re), q.Y(im), c=SIG, lw=1.6))
    o.append(W(q.X(re), q.Y(im), q.X(re), q.Y(0), c=PUR, lw=1.4, dash="4 3"))
    o.append(DIM(q.X(re), q.Y(-0.45), q.X(0), q.Y(-0.45), None, c=TEA))
    # 角 ψ の弧
    ang = math.acos(z)
    o.append(PL([(q.X(-1.3 * math.cos(a)), q.Y(1.3 * math.sin(a))) for a in _f04_np.linspace(0, ang, 30)], c=GLD, lw=1.6))
    o.append(PZ(q, [complex(re, im)], [], SIG))
    o.append(_f04_m(q.X(re / 2) - 6, q.Y(im / 2) - 4, [_f04_t("距離 "), _f04_g("ω", "n")], "end", 9.5, SIG, True))
    o.append(_f04_m(q.X(re) + 5, q.Y(im / 2) + 18, [_f04_t("虚部 "), _f04_g("ω", "d")], "start", 9.5, PUR, True))
    o.append(_f04_m(q.X(re / 2), q.Y(-0.45) + 15, [_f04_t("実部 −"), _f04_g("ζ"), _f04_g("ω", "n")], "middle", 9.5, TEA, True))
    o.append(_f04_m(q.X(-1.55), q.Y(0.32), [_f04_g("ψ")], "end", 10, GLD, True))
    o.append(_f04_m(q.X(-5.9), q.Y(5.2), [_f04_t("cos "), _f04_g("ψ"), _f04_t(" = "), _f04_g("ζ")], "start", 10, GLD, True))
    o.append(_f04_m(q.X(re) + 8, q.Y(im) - 2, [_f04_t("−2.5 + "), _f04_v("j"), _f04_t("4.33")], "start", 9.5, SIG, True))
    o.append(_f04_m(450, 284, [_f04_t("例の台車（"), _f04_g("ζ"), _f04_t(" 0.2）の根: −1 ± "), _f04_v("j"), _f04_t("4.90")], "start", 10, INK, True, False))
    o.append(_f04_m(450, 302, [_f04_t("振幅は "), _f04_e("−t"), _f04_t(" で縮み、周期 1.28 s で揺れる")], "start", 10, MUT, False, False))
    return SVG(700, 312, o, "特性方程式の根の平面。(a) 固有角周波数を 5 rad/s のまま減衰比を増やすと、共役な 2 つの根は半径 ω<sub>n</sub> の円の上を虚軸から負の実軸へ動き（金の矢印）、ζ = 1 で −5 に重なり、その後は実軸の上で 2 つに分かれる。(b) 不足減衰の根は原点から ω<sub>n</sub> の距離にあり、実部 −ζω<sub>n</sub> が振幅の縮む速さ、虚部 ω<sub>d</sub> が揺れの角周波数で、負の実軸となす角 ψ は cos ψ = ζ を満たす。")
F["e04_roots"] = _f04_roots_fig()


def _f04_cases_fig():
    o = []
    o.append(_f04_m(176, 18, [_f04_t("根の平面（"), _f04_g("ω", "n"), _f04_t(" = 5 rad/s）")], "start", 10.5, INK, True, False))
    o.append(T(330, 18, "4 cm 引いて静かに離したときの位置 p [cm]", "start", 10.5, INK, True))
    rows = [(0.0, "c = 0", "ζ = 0（減衰なし）", "根 ±j5", "±4 cm を周期 1.26 s で往復し続ける", ALI),
            (0.2, "c = 2 N·s/m", "ζ = 0.2（不足減衰）", "根 −1 ± j4.90", "0.64 s に −2.11 cm まで行き過ぎる", SIG),
            (1.0, "c = 10 N·s/m", "ζ = 1（臨界減衰）", "根 −5（重根）", "0 を越えない。1 s で 0.16 cm", GRN),
            (2.0, "c = 20 N·s/m", "ζ = 2（過減衰）", "根 −1.34 と −18.66", "0 を越えないが遅い。1 s で 1.13 cm", GLD)]
    y0 = 34
    t = _f04_np.linspace(0, 4, 801)
    for i, (z, l1, l2, l3, note, c) in enumerate(rows):
        y = y0 + i * 96
        o.append(TX(14, y + 22, l1, "start", 10.5, INK, True))
        o.append(TX(14, y + 40, l2, "start", 10, c, True))
        o.append(TX(14, y + 58, l3, "start", 10, MUT))
        mp = Plot(176, y + 12, 110, 60, (-20, 2), (-6, 6))
        o.append(RECT(mp.x, mp.y, mp.w, mp.h, 0, SCR, LIN, 1))
        o.append(SPLANE(mp))
        if z < 1:
            wd = 5 * math.sqrt(1 - z * z); rts = [complex(-5 * z, wd), complex(-5 * z, -wd)]
        elif z == 1:
            rts = [complex(-5, 0)]
        else:
            r = math.sqrt(z * z - 1); rts = [complex(-5 * (z - r), 0), complex(-5 * (z + r), 0)]
        o.append(PZ(mp, rts, [], c, r=4.5))
        rp = Plot(330, y + 8, 350, 70, (0, 4), (-4.5, 4.5))
        last = (i == len(rows) - 1)
        o.append(rp.axes(xl="時間 t [s]" if last else None, yl=None, xt=[0, 1, 2, 3, 4], yt=[-4, 0, 4],
                         xfmt=(lambda v: "%g" % v) if last else (lambda v: "")))
        o.append(W(rp.x, rp.Y(0), rp.x + rp.w, rp.Y(0), c=MUT, lw=1))
        y_, v_ = _f04_free(z, 5.0, t, 4.0, 0.0)
        if 0 < z < 1:
            env = 4.0 / math.sqrt(1 - z * z) * _f04_np.exp(-z * 5 * t)
            o.append(_f04_pl(rp, list(zip(t, env)), c=FNT, lw=1.1, dash="4 3"))
            o.append(_f04_pl(rp, list(zip(t, -env)), c=FNT, lw=1.1, dash="4 3"))
        o.append(_f04_pl(rp, list(zip(t, y_)), c=c, lw=2.2))
        o.append(T(rp.X(4), rp.y - 4, note, "end", 9.5, c, True, halo=True))
    return SVG(700, y0 + 4 * 96 + 22, o, "減衰係数を変えた台車（m = 1 kg、k = 25 N/m）を 4 cm 引いて静かに離したときの動きと、特性根の位置。根が虚軸の上にあると揺れ続け、左へ離れるほど揺れが速く縮む（破線は包絡線）。根が実軸に乗ると揺れなくなる。過減衰では、0 に近い根の指数関数がゆっくり縮むので、臨界減衰より遅く戻る。")
F["e04_cases"] = _f04_cases_fig()


# =====================================================================
# 3 節: ステップ応答
# =====================================================================
def _f04_stepfig():
    o = []
    t = _f04_np.linspace(0, 5, 1001)
    y, v = _f04_step(0.2, 5.0, t, 4.0)
    env = 4.0 / math.sqrt(0.96) * _f04_np.exp(-t)
    o.append(T(14, 18, "(a) 例の台車を 1 N で押し続けたときの位置", "start", 11.5, INK, True))
    p = Plot(62, 30, 610, 170, (0, 5), (0, 7))
    o.append(p.axes(xl=None, yl="位置 p [cm]", xt=[0, 1, 2, 3, 4, 5], yt=[0, 2, 4, 6], xfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 4), (5, 4)], c=MUT, lw=1.1, dash="4 3"))
    o.append(_f04_pl(p, list(zip(t, 4 + env)), c=GLD, lw=1.3, dash="5 3"))
    o.append(_f04_pl(p, list(zip(t, 4 - env)), c=GLD, lw=1.3, dash="5 3"))
    o.append(p.line(list(zip(t, y)), c=SIG, lw=2.4))
    wd = 5 * math.sqrt(0.96)
    for n in (1, 2, 3):
        tn = n * math.pi / wd
        o.append(D(p.X(tn), p.Y(4 + 4 * (-1) ** (n + 1) * math.exp(-tn)), SIG, 3.4))
    o.append(DIM(p.X(math.pi / wd), p.Y(6.6), p.X(3 * math.pi / wd), p.Y(6.6), None, c=PUR))
    o.append(_f04_m(p.X(2 * math.pi / wd), p.Y(6.6) - 6, [_f04_t("周期 2π/"), _f04_g("ω", "d"), _f04_t(" = 1.28 s")], "middle", 9.5, PUR, True))
    o.append(_f04_m(p.X(1.55), p.Y(5.9), [_f04_t("包絡線 4 × (1 ± 1.02"), _f04_e("−t"), _f04_t(") cm")], "start", 9.5, GLD, True))
    o.append(_f04_m(p.X(2.6), p.Y(5.2), [_f04_e("−t"), _f04_t(" の時定数 1/("), _f04_g("ζ"), _f04_g("ω", "n"), _f04_t(") = 1 s")], "start", 9.5, GLD, False))
    o.append(T(p.X(4.95), p.Y(4) + 14, "最終値 Ku = 4 cm", "end", 9.5, MUT, halo=True))
    o.append(T(p.X(0.72), p.Y(6.15) + 4, "6.11 cm", "start", 9.5, SIG, True, halo=True))
    # (b) 自由な動きを裏返したもの
    o.append(T(14, 248, "(b) ステップ応答 ＝ 最終値 − （4 cm 引いて離した自由な動き）", "start", 11.5, INK, True))
    q = Plot(62, 262, 610, 130, (0, 5), (-2.5, 7))
    o.append(q.axes(xl="時間 t [s]", yl="位置 p [cm]", xt=[0, 1, 2, 3, 4, 5], yt=[-2, 0, 2, 4, 6], xfmt=lambda v: "%g" % v))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    yf, vf = _f04_free(0.2, 5.0, t, 4.0, 0.0)
    o.append(q.line([(0, 4), (5, 4)], c=MUT, lw=1.1, dash="4 3"))
    o.append(q.line(list(zip(t, yf)), c=TEA, lw=2.0, dash="6 3"))
    o.append(q.line(list(zip(t, 4 - yf)), c=SIG, lw=2.4))
    o.append(T(q.X(0.32), q.Y(-1.6), "自由な動き（2 節）", "start", 9.5, TEA, True, halo=True))
    o.append(T(q.X(0.9), q.Y(6.0), "4 cm − 自由な動き", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(4.95), q.Y(4) + 14, "最終値 4 cm", "end", 9.5, MUT, halo=True))
    return SVG(700, 430, o, "例の台車（ζ = 0.2、ω<sub>n</sub> = 5 rad/s）のステップ応答。(a) 位置は、最終値 4 cm を中心に、包絡線の間で周期 1.28 s で揺れる。包絡線と最終値の差は e<sup>−t</sup> で縮む。(b) 最終値からのずれは入力の無い式に従うので、ステップ応答は、最終値から、2 節の自由な動き（4 cm 引いて離した動き）を引いたものである。")
F["e04_step"] = _f04_stepfig()


def _f04_family_fig():
    o = []
    p = Plot(62, 30, 500, 230, (0, 20), (0, 2.05))
    o.append(p.axes(xl=None, yl="y ÷ 最終値", xt=[0, 5, 10, 15, 20], yt=[0, 0.5, 1.0, 1.5, 2.0], yfmt=lambda v: "%g" % v))
    o.append(_f04_m(p.x + p.w / 2, p.y + p.h + 31, [_f04_g("ω", "n"), _f04_v("t"), _f04_t("（時間 × 固有角周波数）")], "middle", 10, MUT, False, False))
    o.append(p.line([(0, 1), (20, 1)], c=MUT, lw=1.1, dash="4 3"))
    o.append(RECT(p.X(0), p.Y(1.02), p.w, p.Y(0.98) - p.Y(1.02), 0, GSOFT, "none", 0))
    fam = [(0.0, ALI, "2 3", 1.3), (0.1, ALI, None, 1.5), (0.2, SIG, None, 2.6), (0.4, PUR, None, 1.8),
           (0.7, GRN, None, 2.2), (1.0, GLD, None, 2.2), (2.0, TEA, None, 2.0), (4.0, MUT, "6 3", 1.8)]
    t = _f04_np.linspace(0, 20, 2001)
    for z, c, dash, lw in fam:
        y, v = _f04_step(z, 1.0, t)
        o.append(_f04_pl(p, list(zip(t, y)), c=c, lw=lw, dash=dash))
    for z, tt in ((1.0, 5.834), (2.0, 14.878)):
        o.append(D(p.X(tt), p.Y(0.98), GLD if z == 1 else TEA, 3.6))
    o.append(T(p.X(5.95), p.Y(0.84), "98 % に 5.83", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(14.9), p.Y(0.84), "14.9", "middle", 9.5, TEA, True, halo=True))
    # 右の凡例
    lx, ly = 582, 46
    o.append(_f04_m(lx, ly - 14, [_f04_t("減衰比 "), _f04_g("ζ")], "start", 10.5, INK, True, False))
    names = {0.0: "0（揺れ続ける）", 0.1: "0.1", 0.2: "0.2（例の台車）", 0.4: "0.4", 0.7: "0.7", 1.0: "1（臨界減衰）", 2.0: "2", 4.0: "4"}
    for i, (z, c, dash, lw) in enumerate(fam):
        yy = ly + 8 + i * 22
        o.append(W(lx, yy - 4, lx + 22, yy - 4, c=c, lw=max(lw, 1.8), dash=dash))
        o.append(T(lx + 28, yy, names[z], "start", 9.5, c, True))
    o.append(T(p.X(19.8), p.Y(1.02) - 4, "±2 % の幅", "end", 9.5, GRN, halo=True))
    return SVG(700, 300, o, "減衰比を変えた二次遅れのステップ応答（横軸は ω<sub>n</sub> t、縦軸は最終値で割った値）。ζ が小さいほど大きく行き過ぎて長く揺れ、ζ = 0 では揺れ続ける。ζ が 1 以上では行き過ぎず、そのうち ζ = 1 が最も速い。ζ が 0.7 前後では、わずかに行き過ぎて早く落ち着く。")
F["e04_family"] = _f04_family_fig()


def _f04_over_fig():
    o = []
    l1, l2 = -20.2041, -1979.7959
    A, B = -606.1862, 6.1862
    t = _f04_np.linspace(0, 0.25, 2501)
    w2 = 600 + A * _f04_np.exp(l1 * t) + B * _f04_np.exp(l2 * t)
    ws = 600 + A * _f04_np.exp(l1 * t)
    w1 = 600 * (1 - _f04_np.exp(-t / 0.05))
    o.append(_f04_m(14, 18, [_f04_t("(a) 12 V を加えたときの角速度（"), ("L", "a", True), _f04_t(" = 1 mH、"), _f04_g("ζ"), _f04_t(" = 5）")], "start", 11.5, INK, True, False))
    p = Plot(66, 34, 380, 190, (0, 0.25), (0, 650))
    o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yt=[0, 200, 400, 600], xfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 600), (0.25, 600)], c=MUT, lw=1.1, dash="4 3"))
    o.append(p.line(list(zip(t, w1)), c=MUT, lw=1.6, dash="2 3"))
    o.append(p.line(list(zip(t, w2)), c=SIG, lw=2.4))
    o.append(RECT(p.X(0), p.Y(60), p.X(0.005) - p.X(0), p.Y(0) - p.Y(60), 0, "none", PUR, 1.2))
    o.append(T(p.X(0.008), p.Y(40), "→ (b) で拡大", "start", 9.5, PUR, True, halo=True))
    o.append(_f04_m(p.X(0.07), p.Y(300), [_f04_t("2 階の式（"), ("L", "a", True), _f04_t(" を含む）")], "start", 9.5, SIG, True))
    o.append(T(p.X(0.07), p.Y(300) + 14, "と、一次の式（点線）はほぼ重なる", "start", 9.5, MUT, halo=True))
    o.append(T(p.X(0.245), p.Y(600) - 6, "600 rad/s", "end", 9.5, MUT, halo=True))
    # (b) 始めの 5 ms
    o.append(T(486, 18, "(b) 始めの 5 ms", "start", 11.5, INK, True))
    q = Plot(520, 34, 160, 190, (0, 5), (-10, 60))
    tz = _f04_np.linspace(0, 0.005, 1001)
    w2z = 600 + A * _f04_np.exp(l1 * tz) + B * _f04_np.exp(l2 * tz)
    wsz = 600 + A * _f04_np.exp(l1 * tz)
    fz = B * _f04_np.exp(l2 * tz)
    w1z = 600 * (1 - _f04_np.exp(-tz / 0.05))
    o.append(q.axes(xl="時間 t [ms]", yl=None, xt=[0, 1, 2, 3, 4, 5], yt=[0, 20, 40, 60], xfmt=lambda v: "%g" % v))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(q.line(list(zip(tz * 1e3, w1z)), c=MUT, lw=1.6, dash="2 3"))
    o.append(q.line(list(zip(tz * 1e3, wsz)), c=GLD, lw=1.8, dash="6 3"))
    o.append(q.line(list(zip(tz * 1e3, fz)), c=TEA, lw=1.8))
    o.append(q.line(list(zip(tz * 1e3, w2z)), c=SIG, lw=2.4))
    o.append(T(q.X(4.9), q.Y(56), "一次の式", "end", 9.5, MUT, True, halo=True))
    o.append(T(q.X(4.9), q.Y(38), "2 階の式", "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(0.9), q.Y(-6.5), "遅い項だけ", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(0.55), q.Y(8.5), "速い項", "start", 9.5, TEA, True, halo=True))
    # (c) 根の大きさ（対数）
    yb = 278
    o.append(T(14, yb, "(c) 2 つの特性根の大きさ（対数の目盛）", "start", 11.5, INK, True))
    r = Plot(150, yb + 40, 500, 10, (10, 3000), (0, 1), xlog=True)
    o.append(W(r.x, r.y + 5, r.x + r.w, r.y + 5, c=MUT, lw=1.2))
    for v in (10, 100, 1000):
        o.append(W(r.X(v), r.y + 1, r.X(v), r.y + 9, c=MUT, lw=1))
        o.append(T(r.X(v), r.y + 24, "%d" % v, "middle", 9.5, MUT))
    o.append(T(r.x + r.w, r.y + 24, "|λ| [1/s]", "end", 9.5, MUT))
    for v, c, lab, sub in ((20.2, GLD, "遅い根 −20.2", "時定数 49.5 ms"), (1980, TEA, "速い根 −1980", "時定数 0.505 ms")):
        x = r.X(v)
        o.append(W(x - 5, r.y, x + 5, r.y + 10, c=c, lw=2.2)); o.append(W(x - 5, r.y + 10, x + 5, r.y, c=c, lw=2.2))
        o.append(T(x, r.y - 16, lab, "middle", 9.5, c, True))
        o.append(T(x, r.y - 4, sub, "middle", 9, c))
    o.append(_f04_m(r.X(20.2), r.y + 42, [_f04_t("近似 "), _f04_g("ω", "n"), _f04_t("/(2"), _f04_g("ζ"), _f04_t(") = 20 → 時定数 0.05 s（2 章の一次の式）")], "start", 9.5, GLD, False, False))
    o.append(T(14, r.y + 8, "100 倍離れている", "start", 9.5, INK, True))
    return SVG(700, r.y + 54, o, "過減衰の二次遅れ（巻線のインダクタンスを含めたモータ。ω<sub>n</sub> = 200 rad/s、ζ = 5）。(a) 12 V を加えたときの角速度は、L<sub>a</sub> を無視した一次の式（時定数 0.05 s）とほとんど同じである。(b) 始めの数 ms では、速い根の項（青緑）が遅い根の項（金の破線）の始まりを打ち消し、角速度は傾き 0 から上がる。(c) 2 つの根は約 100 倍離れており、遅い根が応答のほとんどを決める。")
F["e04_over"] = _f04_over_fig()


# =====================================================================
# 4 節: 指標
# =====================================================================
def _f04_ind_panel(o, x, y, w, h, z, wn, K, title, zoom):
    """ステップ応答に指標を書き込む（左に全体、右に ±2 % の付近の拡大）。"""
    tr, tp, Mp, t2 = _f04_index(z)
    tr, t2 = tr / wn, t2 / wn
    tp = tp / wn if tp is not None else None
    yv = lambda t: float(_f04_step(z, wn, [t], K)[0][0])
    t10 = _f04_bisect(lambda t: yv(t) - 0.1 * K, 0.0, tp)
    t90 = _f04_bisect(lambda t: yv(t) - 0.9 * K, 0.0, tp)
    o.append(_f04_m(x - 48, y - 12, title, "start", 11, INK, True, False))
    p = Plot(x, y, w, h, (0, 5), (0, 7))
    o.append(p.axes(xl="時間 t [s]", yl="位置 p [cm]", xt=[0, 1, 2, 3, 4, 5], yt=[0, 2, 4, 6], xfmt=lambda v: "%g" % v))
    o.append(RECT(p.X(0), p.Y(K * 1.02), p.w, p.Y(K * 0.98) - p.Y(K * 1.02), 0, GSOFT, "none", 0))
    o.append(p.line([(0, K), (5, K)], c=MUT, lw=1.1, dash="4 3"))
    t = _f04_np.linspace(0, 5, 1001)
    yy, vv = _f04_step(z, wn, t, K)
    o.append(p.line(list(zip(t, yy)), c=SIG, lw=2.3))
    # 立ち上がり時間
    for lev, tt in ((0.1 * K, t10), (0.9 * K, t90)):
        o.append(W(p.X(0), p.Y(lev), p.X(tt), p.Y(lev), c=TEA, lw=1, dash="3 3"))
        o.append(D(p.X(tt), p.Y(lev), TEA, 3.2))
    o.append(W(p.X(t10), p.Y(0.1 * K), p.X(t10), p.Y(0) + 0, c=TEA, lw=1, dash="2 2"))
    o.append(W(p.X(t90), p.Y(0.9 * K), p.X(t90), p.Y(0), c=TEA, lw=1, dash="2 2"))
    o.append(DIM(p.X(t10), p.Y(0.5), p.X(t90), p.Y(0.5), None, c=TEA))
    o.append(_f04_m(p.X(t90) + 6, p.Y(0.5) + 4, [_f04_v("t", "r"), _f04_t(" = %.3f s" % tr)], "start", 9.5, TEA, True))
    o.append(T(p.X(0) + 4, p.Y(0.1 * K) - 3, "10 %", "start", 8.5, TEA, halo=True))
    o.append(T(p.X(0) + 4, p.Y(0.9 * K) - 3, "90 %", "start", 8.5, TEA, halo=True))
    # ピーク
    ymax = K * (1 + Mp)
    o.append(D(p.X(tp), p.Y(ymax), ALI, 3.6))
    o.append(W(p.X(tp), p.Y(ymax), p.X(tp), p.Y(0), c=ALI, lw=1, dash="2 2"))
    o.append(DARR(p.X(tp) + 16, p.Y(K), p.X(tp) + 16, p.Y(ymax), c=ALI, lw=1.2, head=5))
    ly = (K + ymax) / 2 if ymax - K > 1.0 else ymax + 1.3
    o.append(_f04_m(p.X(tp) + 22, p.Y(ly) + 4, [_f04_v("M", "p"), _f04_t(" = %.1f %%" % (Mp * 100))], "start", 9.5, ALI, True))
    if ymax - K <= 1.0:
        o.append(W(p.X(tp) + 20, p.Y(ly), p.X(tp) + 16, p.Y(ymax), c=ALI, lw=0.9))
    o.append(_f04_m(p.X(tp), p.Y(ymax) - 9, [_f04_v("t", "p"), _f04_t(" = %.3f s" % tp)], "middle", 9.5, ALI, True))
    # 整定時間
    o.append(W(p.X(t2), p.y, p.X(t2), p.Y(0), c=GRN, lw=1.4, dash="5 3"))
    o.append(_f04_m(p.X(t2) + 4, p.y + 12, [_f04_v("t", "2%"), _f04_t(" = %.2f s" % t2)], "start", 9.5, GRN, True))
    # 拡大
    zx = x + w + 50
    q = Plot(zx, y, 150, h, zoom, (K - 0.3, K + 0.3))
    o.append(q.axes(xl="時間 t [s]", yl=None, xt=None, yt=[K - 0.2, K, K + 0.2], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%.1f" % v))
    o.append(RECT(q.X(zoom[0]), q.Y(K * 1.02), q.w, q.Y(K * 0.98) - q.Y(K * 1.02), 0, GSOFT, GRN, 0.8))
    tz = _f04_np.linspace(zoom[0], zoom[1], 801)
    yz, vz = _f04_step(z, wn, tz, K)
    o.append(_f04_pl(q, list(zip(tz, yz)), c=SIG, lw=2.2))
    o.append(W(q.X(t2), q.y, q.X(t2), q.y + q.h, c=GRN, lw=1.4, dash="5 3"))
    o.append(T(q.x + q.w, q.y - 4, "±2 % の幅（拡大）", "end", 9.5, GRN, True))
    o.append(T(q.X(t2) + 3, q.y + q.h - 6, "以後は出ない", "start", 9, GRN, halo=True))
    return p, q


def _f04_indices_fig():
    o = []
    _f04_ind_panel(o, 62, 34, 400, 150, 0.2, 5.0, 4.0,
                   [_f04_t("(a) 例の台車（"), _f04_g("ζ"), _f04_t(" = 0.2、"), _f04_g("ω", "n"), _f04_t(" = 5 rad/s）")], (2.5, 5.0))
    _f04_ind_panel(o, 62, 268, 400, 150, 0.69, 5.0, 4.0,
                   [_f04_t("(b) 減衰比を 0.69 にした場合（"), _f04_g("ω", "n"), _f04_t(" = 5 rad/s のまま）")], (0.6, 2.0))
    return SVG(700, 470, o, "ステップ応答の指標（最終値 4 cm）。立ち上がり時間 t<sub>r</sub> は最終値の 10 % から 90 % までの時間、ピーク時間 t<sub>p</sub> は最初の山の時刻、行き過ぎ量 M<sub>p</sub> は最初の山が最終値を越えた割合、2 % 整定時間 t<sub>2%</sub> は最終値の ±2 % の幅（緑の帯）に入って出なくなる時刻である。右は、緑の帯の付近を縦に拡大した。(a) 例の台車は大きく行き過ぎ、落ち着くまで 3.92 s かかる。(b) 減衰比を 0.69 にすると、行き過ぎ量は 5 % になり、1.20 s で落ち着く。")
F["e04_indices"] = _f04_indices_fig()


def _f04_mp_fig():
    o = []
    o.append(_f04_m(14, 18, [_f04_t("(a) 行き過ぎ量と減衰比")], "start", 11.5, INK, True, False))
    p = Plot(62, 34, 260, 200, (0, 1), (0, 100))
    o.append(p.axes(xl=None, yl="行き過ぎ量 [%]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], yt=[0, 20, 40, 60, 80, 100], xfmt=lambda v: "%g" % v))
    o.append(_f04_m(p.x + p.w / 2, p.y + p.h + 31, [_f04_t("減衰比 "), _f04_g("ζ")], "middle", 10, MUT, False, False))
    zs = _f04_np.linspace(0.0005, 0.9995, 400)
    o.append(p.line([(z, 100 * math.exp(-math.pi * z / math.sqrt(1 - z * z))) for z in zs], c=SIG, lw=2.4))
    for z in (0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.69, 0.8):
        o.append(D(p.X(z), p.Y(100 * math.exp(-math.pi * z / math.sqrt(1 - z * z))), SIG, 3.2))
    for M, c in ((5, GRN), (52.66, ALI)):
        L = math.log(M / 100); z = -L / math.sqrt(math.pi ** 2 + L * L)
        o.append(W(p.X(0), p.Y(M), p.X(z), p.Y(M), p.X(z), p.Y(0), c=c, lw=1.1, dash="4 3"))
    o.append(T(p.X(0.72), p.Y(5) - 6, "5 % → ζ = 0.69", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(0.23), p.Y(52.66) - 6, "例の台車 52.7 %（ζ = 0.2）", "start", 9.5, ALI, True, halo=True))
    # (b) 整定時間
    o.append(_f04_m(380, 18, [_f04_t("(b) 2 % 整定時間 × "), _f04_g("ω", "n")], "start", 11.5, INK, True, False))
    q = Plot(420, 34, 260, 200, (0.1, 1.0), (0, 40))
    o.append(q.axes(xl=None, yl=None, xt=[0.2, 0.4, 0.6, 0.8, 1.0], yt=[0, 10, 20, 30, 40], xfmt=lambda v: "%g" % v))
    o.append(_f04_m(q.x + q.w / 2, q.y + q.h + 31, [_f04_t("減衰比 "), _f04_g("ζ")], "middle", 10, MUT, False, False))
    o.append(_f04_m(q.x - 32, q.y + q.h / 2, [_f04_g("ω", "n"), _f04_v("t", "2%")], "middle", 10, MUT, False, False, rot=-90))
    zs = _f04_np.linspace(0.1, 1.0, 451)
    ex = [(z, _f04_index(z)[3]) for z in zs]
    segs, cur = [], []
    for a, b in ex:
        if cur and abs(b - cur[-1][1]) > 0.6:
            segs.append(cur); cur = []
        cur.append((a, b))
    segs.append(cur)
    o.append(q.line([(z, 4 / z) for z in zs], c=GLD, lw=1.8, dash="6 3"))
    for sgm in segs:
        if len(sgm) >= 2:
            o.append(_f04_pl(q, sgm, c=SIG, lw=2.2))
    o.append(D(q.X(0.2), q.Y(19.6), ALI, 3.4))
    o.append(T(q.X(0.215), q.Y(19.6) - 6, "例の台車 19.6（3.92 s）", "start", 9.5, ALI, True, halo=True))
    o.append(_f04_m(q.X(0.3), q.Y(33), [_f04_t("目安 4/"), _f04_g("ζ")], "start", 9.5, GLD, True))
    o.append(T(q.X(0.5), q.Y(15), "実際の値（段になる）", "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(0.58), q.Y(10.5), "山が 1 つ幅に入るたびに縮む", "start", 9, MUT, halo=True))
    return SVG(700, 276, o, "減衰比と指標。(a) 行き過ぎ量は減衰比だけで決まる（点は 4 節の表の値）。行き過ぎ量 5 % 以下にするには ζ ≥ 0.69 が要る。(b) 2 % 整定時間に ω<sub>n</sub> を掛けた値。実際の値（青）は、ζ を増やして山や谷が 1 つ ±2 % の幅に入るたびに段になって縮み、包絡線から求めた目安 4/ζ（金の破線）のまわりにある。")
F["e04_mp"] = _f04_mp_fig()


def _f04_region_fig():
    o = []
    o.append(T(14, 18, "(a) 仕様を満たす根の領域", "start", 11.5, INK, True))
    p = Plot(56, 40, 210, 300, (-12, 2), (-10, 10))
    zmin = 0.6901; sl = math.sqrt(1 - zmin * zmin) / zmin
    o.append(SPLANE(p))
    reg = [(-4, -4 * sl), (-4, 4 * sl), (-10 / sl, 10), (-12, 10), (-12, -10), (-10 / sl, -10)]
    o.append(PL([(p.X(a), p.Y(b)) for a, b in reg], c="none", lw=0, fill=GSOFT))
    o.append(p.axes(xl="実部", yl="虚部", xt=[-12, -8, -4, 0], yt=[-10, -5, 0, 5, 10]))
    o.append(SPLANE(p))
    o.append(W(p.X(0), p.Y(0), p.X(-10 / sl), p.Y(10), c=GRN, lw=1.5, dash="5 3"))
    o.append(W(p.X(0), p.Y(0), p.X(-10 / sl), p.Y(-10), c=GRN, lw=1.5, dash="5 3"))
    o.append(W(p.X(-4), p.Y(-10), p.X(-4), p.Y(10), c=GRN, lw=1.5, dash="5 3"))
    o.append(_f04_m(p.X(-11.6), p.Y(-6.2), [_f04_t("満たす")], "start", 10, GRN, True))
    pts = [("A", 0.2, 5.0), ("B", 0.7, 5.0), ("C", 0.75, 8.0), ("D", 0.5, 10.0)]
    res = {}
    for nm, z, wn in pts:
        tr, tp, Mp, t2 = _f04_index(z)
        ok = (Mp <= 0.05) and (t2 / wn <= 1.0)
        res[nm] = (z, wn, Mp, t2 / wn, ok)
        c = GRN if ok else ALI
        re, im = -z * wn, wn * math.sqrt(1 - z * z)
        o.append(PZ(p, [complex(re, im), complex(re, -im)], [], c, r=5))
        o.append(T(p.X(re) + 8, p.Y(im) + 4, nm, "start", 11, c, True, halo=True))
    o.append(_f04_m(p.X(-11.6), p.Y(9.2), [_f04_g("ζ"), _f04_t(" ≥ 0.69")], "start", 9.5, GRN, True))
    o.append(_f04_m(p.X(-11.6), p.Y(8.1), [_f04_t("（"), _f04_v("M", "p"), _f04_t(" ≤ 5 %）")], "start", 9.5, GRN, False))
    o.append(_f04_m(p.X(-3.8), p.Y(-8.6), [_f04_t("実部 ≤ −4")], "start", 9.5, GRN, True))
    o.append(_f04_m(p.X(-3.8), p.Y(-9.6), [_f04_t("（"), _f04_v("t", "2%"), _f04_t(" ≲ 1 s）")], "start", 9.5, GRN, False))
    # (b) 4 つの応答
    o.append(T(300, 18, "(b) 各点のステップ応答（最終値で割った値）", "start", 11.5, INK, True))
    t = _f04_np.linspace(0, 3, 601)
    for k, nm in enumerate(("A", "B", "C", "D")):
        z, wn, Mp, t2, ok = res[nm]
        c = GRN if ok else ALI
        px = 330 + (k % 2) * 190; py = 54 + (k // 2) * 160
        q = Plot(px, py, 160, 90, (0, 3), (0, 1.6))
        o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 1, 2, 3], yt=[0, 0.5, 1, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(RECT(q.X(1), q.Y(1.02), q.X(3) - q.X(1), q.Y(0.98) - q.Y(1.02), 0, GSOFT, GRN, 0.8))
        o.append(W(q.X(1), q.y, q.X(1), q.y + q.h, c=GRN, lw=1, dash="3 3"))
        o.append(W(q.x, q.Y(1.05), q.x + q.w, q.Y(1.05), c=ALI, lw=0.9, dash="2 3"))
        yv, vv = _f04_step(z, wn, t)
        o.append(_f04_pl(q, list(zip(t, yv)), c=c, lw=2.0))
        o.append(_f04_m(px - 6, py - 22, [_f04_t(nm + "  "), _f04_g("ζ"), _f04_t(" %g・" % z), _f04_g("ω", "n"), _f04_t(" %g rad/s" % wn)], "start", 10, c, True, False))
        o.append(_f04_m(px - 6, py - 8, [_f04_v("M", "p"), _f04_t(" %.1f %%・" % (Mp * 100)), _f04_v("t", "2%"), _f04_t(" %.2f s" % t2)], "start", 9.5, c, False, False))
    return SVG(700, 384, o, "仕様「行き過ぎ量 5 % 以下、2 % 整定時間 1 s 以下」を根の平面に描く。(a) 行き過ぎ量の条件は原点から引いた 2 本の直線の間（ζ ≥ 0.69）、整定時間の条件は、目安の式で実部が −4 以下の範囲になる。両方を満たすのは緑に塗った領域である。(b) 各点のステップ応答。赤い点線は行き過ぎ量 5 % の線、緑の帯は 1 s 以後の ±2 % の幅である。領域の中の C だけが両方を満たす。")
F["e04_region"] = _f04_region_fig()


# =====================================================================
# 5 節: 位相平面
# =====================================================================
def _f04_phase_time_fig():
    o = []
    t = _f04_np.linspace(0, 3, 3001)
    y, v = _f04_step(0.2, 5.0, t, 4.0)            # cm と cm/s
    marks = [0.0, 0.2795, math.pi / (5 * math.sqrt(0.96)), 0.9208, 2 * math.pi / (5 * math.sqrt(0.96)), 3 * math.pi / (5 * math.sqrt(0.96))]
    mv = [_f04_step(0.2, 5.0, [tm], 4.0) for tm in marks]
    mv = [(float(a[0][0]), float(a[1][0])) for a in mv]
    o.append(T(14, 18, "(a) 時間の波形", "start", 11.5, INK, True))
    p = Plot(62, 34, 300, 110, (0, 3), (0, 7))
    o.append(p.axes(xl=None, yl="位置 p [cm]", xt=[0, 1, 2, 3], yt=[0, 2, 4, 6], xfmt=lambda v: ""))
    o.append(p.line([(0, 4), (3, 4)], c=MUT, lw=1.1, dash="4 3"))
    o.append(p.line(list(zip(t, y)), c=SIG, lw=2.2))
    q = Plot(62, 168, 300, 120, (0, 3), (-10, 17))
    o.append(q.axes(xl="時間 t [s]", yl="速度 ṗ [cm/s]", xt=[0, 1, 2, 3], yt=[-10, 0, 10], xfmt=lambda v: "%g" % v))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(q.line(list(zip(t, v)), c=PUR, lw=2.2))
    for k, (tm, (a, b)) in enumerate(zip(marks, mv)):
        o.append(W(p.X(tm), p.Y(a), p.X(tm), q.Y(b), c=FNT, lw=1, dash="2 3"))
    for k, (tm, (a, b)) in enumerate(zip(marks, mv)):
        o.append(_f04_num_dot(p.X(tm), p.Y(a), k + 1))
        o.append(_f04_num_dot(q.X(tm), q.Y(b), k + 1, PUR))
    # (b) 位相平面
    o.append(T(410, 18, "(b) 位相平面（横に位置、縦に速度）", "start", 11.5, INK, True))
    r = Plot(444, 50, 240, 160, (-0.5, 7.0), (-9, 16))
    o.append(r.axes(xl="位置 p [cm]", yl="速度 ṗ [cm/s]", xt=[0, 2, 4, 6], yt=[-5, 0, 5, 10, 15]))
    o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=1))
    o.append(W(r.X(0), r.y, r.X(0), r.y + r.h, c=MUT, lw=1))
    tt = _f04_np.linspace(0, 8, 8001)
    yy, vv = _f04_step(0.2, 5.0, tt, 4.0)
    o.append(PL([(r.X(a), r.Y(b)) for a, b in zip(yy, vv)], c=SIG, lw=2.2))
    # 向きの矢印
    i = 1100
    o.append(_head(r.X(yy[i - 40]), r.Y(vv[i - 40]), r.X(yy[i]), r.Y(vv[i]), SIG, 9))
    o.append(CIRC(r.X(4), r.Y(0), 5, c=GRN, lw=2, fill=SCR))
    o.append(T(r.X(4) + 2, r.Y(0) + 17, "平衡点（4 cm, 0）", "middle", 9.5, GRN, True, halo=True))
    for k, (a, b) in enumerate(mv):
        dx = {0: -10, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0}[k]; dy = {0: -10, 1: -11, 2: 0, 3: 11, 4: 0, 5: -11}[k]
        o.append(_f04_num_dot(r.X(a) + dx, r.Y(b) + dy, k + 1))
    o.append(T(r.X(6.9), r.Y(14.5), "時計回りに回りながら", "end", 9.5, SIG, True, halo=True))
    o.append(T(r.X(6.9), r.Y(12.3), "平衡点へ近づく", "end", 9.5, SIG, True, halo=True))
    o.append(T(410, 262, "1 出発（0 cm, 0）　2 速度が最大 15.1 cm/s", "start", 9.5, INK))
    o.append(T(410, 278, "3 最初の山 6.11 cm（ṗ = 0 を横切る）", "start", 9.5, INK))
    o.append(T(410, 294, "4 速度が最小 −7.96 cm/s　5 谷 2.89 cm　6 山 4.58 cm", "start", 9.5, INK))
    return SVG(700, 330, o, "例の台車のステップ応答（1 N で押し続ける）を、時間の波形と位相平面に並べた。番号は同じ時刻を示す。(a) 位置と速度は別々の波形になる。(b) 位相平面では、各時刻の位置と速度が 1 つの点になり、点は原点から出て、時計回りの渦巻きを描いて平衡点（4 cm、速度 0）へ近づく。軌跡が横軸を横切る所が、波形の山と谷である。")
F["e04_phase_time"] = _f04_phase_time_fig()


def _f04_field(o, p, z, wn, n=9):
    """位相平面の向きの場（各点で、位置と速度の変わる向きを短い線で）。速度の軸は ω_n 倍の目盛とする。"""
    xs = _f04_np.linspace(p.xr[0], p.xr[1], n + 2)[1:-1]
    ys = _f04_np.linspace(p.yr[0], p.yr[1], n + 2)[1:-1]
    for a in xs:
        for b in ys:
            da, db = b, -2 * z * wn * b - wn * wn * a
            dx = (p.X(a + da * 1e-3) - p.X(a)); dy = (p.Y(b + db * 1e-3) - p.Y(b))
            L = math.hypot(dx, dy)
            if L < 1e-12:
                continue
            ux, uy = dx / L * 5.5, dy / L * 5.5
            x0, y0 = p.X(a), p.Y(b)
            o.append(W(x0 - ux, y0 - uy, x0 + ux, y0 + uy, c=FNT, lw=1))
            o.append(_head(x0 - ux, y0 - uy, x0 + ux * 1.3, y0 + uy * 1.3, FNT, 4))


def _f04_phase_map_fig():
    o = []
    cases = [(0.0, "(a) ζ = 0（c = 0）: 楕円", ALI, [(4, 0), (2.5, 0), (1, 0)]),
             (0.2, "(b) ζ = 0.2（c = 2）: 渦巻き", SIG, [(4.5, 0), (-4.5, 0), (0, 22), (0, -22)]),
             (2.0, "(c) ζ = 2（c = 20）: 結節", GLD, [(4.5, 0), (-4.5, 0), (2, 24), (-2, -24), (4.5, -20), (-4.5, 20)])]
    for k, (z, title, c, inits) in enumerate(cases):
        x = 46 + k * 230
        o.append(TX(x - 34, 18, title, "start", 11, INK, True))
        p = Plot(x, 34, 180, 180, (-5, 5), (-25, 25))
        o.append(p.axes(xl="位置 p [cm]", yl="速度 ṗ [cm/s]" if k == 0 else None, xt=[-4, 0, 4], yt=[-20, 0, 20]))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
        _f04_field(o, p, z, 5.0)
        if z > 1:
            r_ = math.sqrt(z * z - 1); l1 = -5 * (z - r_); l2 = -5 * (z + r_)
            for lam, cc, lab, dyl in ((l1, GLD, "ṗ = −1.34 p（遅い根）", 0), (l2, PUR, "ṗ = −18.7 p（速い根）", 0)):
                xa = min(5, 25 / abs(lam))
                o.append(W(p.X(-xa), p.Y(-lam * xa), p.X(xa), p.Y(lam * xa), c=cc, lw=1.6, dash="6 3"))
        tt = _f04_np.linspace(0, 6, 3001)
        for (a, b) in inits:
            yy, vv = _f04_free(z, 5.0, tt, a, b)
            o.append(_f04_ppl(p, yy, vv, c=c, lw=1.8))
            o.append(D(p.X(a), p.Y(b), c, 3.2))
            j = 60
            if abs(yy[j] - a) + abs(vv[j] - b) / 5 > 0.05:
                o.append(_head(p.X(yy[j - 12]), p.Y(vv[j - 12]), p.X(yy[j]), p.Y(vv[j]), c, 7))
        if z > 1:
            o.append(T(p.X(4.9), p.Y(-11.5), "遅い根の直線", "end", 9, GLD, True, halo=True))
            o.append(T(p.X(-1.6), p.Y(23), "速い根の直線", "start", 9, PUR, True, halo=True))
    o.append(_f04_m(14, 276, [_f04_t("点は初めの位置と速度、灰色の短い矢印は各点で動く向き。速度の目盛は位置の目盛の "), _f04_g("ω", "n"), _f04_t(" = 5 倍にとった。")], "start", 9.5, MUT, False, False))
    return SVG(700, 286, o, "入力の無い台車（m = 1 kg、k = 25 N/m）の位相平面での軌跡。(a) 減衰が無いと、エネルギーが変わらないので、軌跡は閉じた楕円（この目盛では円）の上を回り続ける。(b) 不足減衰では、回りながら原点へ近づく渦巻きになる。(c) 過減衰では回らず、軌跡は遅い根の直線（金の破線）に沿って原点に入る。速い根の直線（紫の破線）の上から出発したときだけ、その直線に沿って入る。")
F["e04_phase_map"] = _f04_phase_map_fig()


# =====================================================================
# 6 節: モータの位置の P 制御
# =====================================================================
_F04_TM, _F04_KM = 0.05, 50.0          # モータの一次の式（2 章 3 節）: T = 0.05 s、K = 50 (rad/s)/V


def _f04_motor_bd_fig():
    o = []
    o.append(T(14, 18, "(a) モータの軸の角度を目標に合わせる", "start", 11.5, INK, True))
    # モータと円板
    o.append(RECT(30, 66, 70, 56, 8, SSOFT, SIG, 1.5))
    o.append(T(65, 99, "M", "middle", 13, SIG, True))
    o.append(W(100, 94, 154, 94, c=INK, lw=3))
    cx, cy, R = 196, 94, 42
    o.append(CIRC(cx, cy, R, c=MUT, lw=1.6, fill=PAN))
    th, rr = math.radians(40), math.radians(75)
    o.append(W(cx, cy, cx + R, cy, c=FNT, lw=1, dash="3 3"))
    o.append(W(cx, cy, cx + (R - 4) * math.cos(rr), cy - (R - 4) * math.sin(rr), c=MUT, lw=1.6, dash="4 3"))
    o.append(W(cx, cy, cx + (R - 4) * math.cos(th), cy - (R - 4) * math.sin(th), c=SIG, lw=3))
    o.append(D(cx, cy, INK, 3.4))
    o.append(PATH("M%g,%g A%g,%g 0 0 0 %g,%g" % (cx + 26, cy, 26, 26, cx + 26 * math.cos(th), cy - 26 * math.sin(th)), c=SIG, lw=1.4))
    o.append(_f04_m(cx + 52, cy - 34, [_f04_t("角度 "), _f04_g("θ", "m")], "start", 10.5, SIG, True))
    o.append(_f04_m(cx + 4, cy - R - 8, [_f04_t("目標 "), _f04_v("r")], "start", 10.5, MUT, True))
    o.append(_f04_m(30, 150, [_f04_t("電圧 "), _f04_v("v"), _f04_t("（操作量）")], "start", 10.5, GLD, True))
    o.append(ARR(46, 138, 46, 124, c=GLD, lw=1.6, head=6))
    # 式の流れ
    x0 = 300
    o.append(T(x0, 44, "2 章 3 節の一次の式と、角度の定義:", "start", 10, MUT))
    o.append(_f04_m(x0, 66, [_f04_v("T"), ("ω", "m", False, None, None, 1), _f04_t(" + "), _f04_g("ω", "m"), _f04_t(" = "), _f04_v("K"), _f04_v("v"), _f04_t("、 "),
                            ("θ", "m", False, None, None, 1), _f04_t(" = "), _f04_g("ω", "m")], "start", 12.5, INK))
    o.append(T(x0, 92, "比例制御:", "start", 10, MUT))
    o.append(_f04_m(x0 + 70, 92, [_f04_v("v"), _f04_t(" = "), _f04_v("K", "P"), _f04_t("("), _f04_v("r"), _f04_t(" − "), _f04_g("θ", "m"), _f04_t(")")], "start", 12.5, GLD))
    o.append(T(x0, 118, "→ 閉ループは 2 階の式（二次遅れ）:", "start", 10, MUT))
    o.append(_f04_m(x0, 142, [_f04_v("T"), ("θ", "m", False, None, None, 2), _f04_t(" + "), ("θ", "m", False, None, None, 1), _f04_t(" + "), _f04_v("K"), _f04_v("K", "P"), _f04_g("θ", "m"),
                            _f04_t(" = "), _f04_v("K"), _f04_v("K", "P"), _f04_v("r")], "start", 13, SIG, True))
    # (b) ブロック線図
    yb = 196
    o.append(W(12, yb - 20, 688, yb - 20, c=LIN, lw=0.8))
    o.append(T(14, yb, "(b) ブロック線図: ループの中に一次遅れと積分がある", "start", 11.5, INK, True))
    y = yb + 64
    R_ = 15
    xs1, xk0, xk1, xm0, xm1, xi0, xi1, xbp, xend = 110, 166, 236, 296, 444, 500, 580, 630, 690
    o.append(ARR(18, y, xs1 - R_, y, c=MUT, lw=1.8))
    o.append(_f04_m(20, y - 9, [_f04_t("目標値 "), _f04_v("r")], "start", 10, MUT, True))
    o.append(SUMJ(xs1, y, {"l": "+", "b": "−"}))
    o.append(ARR(xs1 + R_, y, xk0, y, c=ALI, lw=1.8))
    o.append(_f04_m((xs1 + R_ + xk0) / 2, y - 9, [_f04_t("偏差 "), _f04_v("e")], "middle", 10, ALI, True))
    o.append(RECT(xk0, y - 20, xk1 - xk0, 40, 6, PAN, SIG, 1.4))
    o.append(_f04_m((xk0 + xk1) / 2, y + 5, [_f04_t("× "), _f04_v("K", "P")], "middle", 12, INK, True, False))
    o.append(ARR(xk1, y, xm0, y, c=GLD, lw=1.8))
    o.append(_f04_m((xk1 + xm0) / 2, y - 9, [_f04_t("電圧 "), _f04_v("v")], "middle", 10, GLD, True))
    o.append(RECT(xm0, y - 24, xm1 - xm0, 48, 6, PAN, LIN, 1.4))
    o.append(T((xm0 + xm1) / 2, y - 6, "モータ（一次遅れ）", "middle", 10.5, INK, True))
    o.append(_f04_m((xm0 + xm1) / 2, y + 13, [_f04_v("T"), _f04_t(" = 0.05 s、"), _f04_v("K"), _f04_t(" = 50 (rad/s)/V")], "middle", 9.5, MUT, False, False))
    o.append(ARR(xm1, y, xi0, y, c=INK, lw=1.8))
    o.append(_f04_m((xm1 + xi0) / 2, y - 9, [_f04_g("ω", "m")], "middle", 10, INK, True))
    o.append(RECT(xi0, y - 24, xi1 - xi0, 48, 6, PAN, LIN, 1.4))
    o.append(T((xi0 + xi1) / 2, y - 6, "積分", "middle", 10.5, INK, True))
    o.append(_f04_m((xi0 + xi1) / 2, y + 13, [("θ", "m", False, None, None, 1), _f04_t(" = "), _f04_g("ω", "m")], "middle", 9.5, MUT, False, False))
    o.append(ARR(xi1, y, xend, y, c=SIG, lw=1.8))
    o.append(_f04_m(xend - 2, y - 9, [_f04_t("制御量 "), _f04_g("θ", "m")], "end", 10, SIG, True))
    o.append(D(xbp, y, SIG, 4))
    yf = y + 58
    o.append(W(xbp, y, xbp, yf, xs1, yf, c=SIG, lw=1.8))
    o.append(ARR(xs1, yf, xs1, y + R_, c=SIG, lw=1.8))
    o.append(T((xs1 + xbp) / 2, yf - 7, "測った角度（遅れもノイズも無いとする）", "middle", 9.5, SIG, True))
    o.append(T((xm0 + xi1) / 2, y - 34, "電圧 → 角速度 → 角度: 2 つの「ためる」働きで 2 階になる", "middle", 9.5, GLD, True))
    return SVG(700, yf + 14, o, "モータの位置（角度）の比例制御。(a) 目標の角度 r と測った角度 θ<sub>m</sub> の差に比例した電圧を加える。2 章 3 節の一次の式（L<sub>a</sub> を無視し、負荷トルクは 0）と θ̇<sub>m</sub> = ω<sub>m</sub> を合わせると、閉ループは θ<sub>m</sub> の 2 階の式になる。(b) ブロック線図では、ループの中に、電圧を角速度に変える一次遅れと、角速度を角度にためる積分の 2 つが入っている。")
F["e04_motor_bd"] = _f04_motor_bd_fig()


def _f04_motor_kp_fig():
    o = []
    T_, K_ = _F04_TM, _F04_KM
    o.append(_f04_m(14, 18, [_f04_t("(a) "), _f04_v("K", "P"), _f04_t(" を上げたときの特性根")], "start", 11.5, INK, True, False))
    p = Plot(50, 40, 168, 308, (-22, 2), (-22, 22))
    o.append(SPLANE(p))
    o.append(p.axes(xl="実部", yl="虚部", xt=[-20, -10, 0], yt=[-20, -10, 0, 10, 20]))
    o.append(SPLANE(p))
    zmin = 0.6901; sl = math.sqrt(1 - zmin * zmin) / zmin
    o.append(W(p.X(0), p.Y(0), p.X(-22), p.Y(22 * sl), c=GRN, lw=1.2, dash="5 3"))
    o.append(W(p.X(0), p.Y(0), p.X(-22), p.Y(-22 * sl), c=GRN, lw=1.2, dash="5 3"))
    o.append(W(p.X(-20), p.Y(0), p.X(0), p.Y(0), c=GLD, lw=3))
    o.append(W(p.X(-10), p.Y(-22), p.X(-10), p.Y(22), c=GLD, lw=3))
    o.append(_head(p.X(-10), p.Y(14), p.X(-10), p.Y(21.6), GLD, 8))
    o.append(_head(p.X(-10), p.Y(-14), p.X(-10), p.Y(-21.6), GLD, 8))
    o.append(_head(p.X(-3), p.Y(0), p.X(-6.5), p.Y(0), GLD, 8))
    o.append(_head(p.X(-17), p.Y(0), p.X(-13.5), p.Y(0), GLD, 8))
    kps = [(0.05, TEA), (0.1, GLD), (0.21, GRN), (0.5, PUR)]
    for kp, c in kps:
        rts = _f04_np.roots([T_, 1.0, K_ * kp])
        o.append(PZ(p, [complex(r) for r in rts], [], c, r=5))
    o.append(W(p.X(0) - 4, p.Y(0) - 4, p.X(0) + 4, p.Y(0) + 4, c=MUT, lw=2)); o.append(W(p.X(0) - 4, p.Y(0) + 4, p.X(0) + 4, p.Y(0) - 4, c=MUT, lw=2))
    o.append(W(p.X(-20) - 4, p.Y(0) - 4, p.X(-20) + 4, p.Y(0) + 4, c=MUT, lw=2)); o.append(W(p.X(-20) - 4, p.Y(0) + 4, p.X(-20) + 4, p.Y(0) - 4, c=MUT, lw=2))
    o.append(_f04_m(p.X(-21.5), p.Y(1.5), [_f04_v("K", "P"), _f04_t(" = 0")], "start", 9, MUT, True))
    o.append(T(p.X(-9.3), p.Y(10.5) + 4, "0.21", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(-9.3), p.Y(20) + 4, "0.5", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(-10), p.Y(-2.6), "0.1", "middle", 9.5, GLD, True, halo=True))
    o.append(T(p.X(-17), p.Y(-2.6), "0.05", "middle", 9.5, TEA, True, halo=True))
    o.append(T(p.X(-21.5), p.Y(-15.5), "実部は −10 のまま", "start", 9.5, GLD, True, halo=True))
    o.append(_f04_m(p.X(-21.5), p.Y(-18.5), [_f04_t("（−1/(2"), _f04_v("T"), _f04_t(")）")], "start", 9.5, GLD, False))
    o.append(_f04_m(p.X(-21.5), p.Y(18.5), [_f04_g("ζ"), _f04_t(" = 0.69")], "start", 9.5, GRN, True))
    # (b) ステップ応答
    o.append(_f04_m(266, 18, [_f04_t("(b) 目標を 1 rad 変えたときの角度 "), _f04_g("θ", "m")], "start", 11.5, INK, True, False))
    q = Plot(306, 34, 374, 250, (0, 1), (0, 1.6))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], yt=[0, 0.5, 1.0, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(q.line([(0, 1), (1, 1)], c=MUT, lw=1.1, dash="4 3"))
    o.append(q.line([(0, 1.05), (1, 1.05)], c=ALI, lw=0.9, dash="2 3"))
    t = _f04_np.linspace(0, 1, 1001)
    for kp, c in kps + [(1.0, ALI)]:
        wn = math.sqrt(K_ * kp / T_); z = 1 / (2 * math.sqrt(K_ * kp * T_))
        y, v = _f04_step(z, wn, t)
        o.append(_f04_pl(q, list(zip(t, y)), c=c, lw=2.6 if kp == 0.21 else 1.8))
    o.append(T(q.X(0.995), q.Y(1.05) - 4, "5 %", "end", 9, ALI, halo=True))
    o.append(LEGL(306, 340, [(TEA, None, "K_P 0.05"), (GLD, None, "0.1"), (GRN, None, "0.21"), (PUR, None, "0.5"), (ALI, None, "1 V/rad")], sz=9.5, gap=10))
    return SVG(700, 386, o, "モータの位置の比例制御で、比例ゲイン K<sub>P</sub> を変える（L<sub>a</sub> を無視した二次遅れの式）。(a) K<sub>P</sub> = 0 の根 0 と −20 は、K<sub>P</sub> を上げると実軸の上で近づき（金の矢印）、0.1 V/rad で −10 に重なった後、実部 −10 のまま上下に分かれる。緑の破線は ζ = 0.69（行き過ぎ量 5 %）の線。(b) 目標を 1 rad 変えたときの角度。K<sub>P</sub> を上げると速く動き始めるが、0.1 V/rad を超えると行き過ぎ、その量が増える。")
F["e04_motor_kp"] = _f04_motor_kp_fig()


def _f04_motor_design_fig():
    o = []
    T_, K_ = _F04_TM, _F04_KM
    kgrid = [10 ** e for e in _f04_np.linspace(math.log10(0.02), math.log10(20), 241)]
    mp, t2s = [], []
    for kp in kgrid:
        wn = math.sqrt(K_ * kp / T_); z = 1 / (2 * math.sqrt(K_ * kp * T_))
        tr, tp, Mp, t2 = _f04_index(z)
        mp.append((kp, Mp * 100)); t2s.append((kp, t2 / wn))
    o.append(_f04_m(14, 18, [_f04_t("(a) 行き過ぎ量 "), _f04_v("M", "p")], "start", 11.5, INK, True, False))
    c1 = Plot(62, 34, 270, 170, (0.02, 20), (0, 80), xlog=True)
    o.append(c1.axes(xl=None, yl="行き過ぎ量 [%]", xt=[0.1, 1, 10], yt=[0, 20, 40, 60, 80], xfmt=lambda v: "%g" % v))
    o.append(_f04_m(c1.x + c1.w / 2, c1.y + c1.h + 31, [_f04_t("比例ゲイン "), _f04_v("K", "P"), _f04_t(" [V/rad]（対数の目盛）")], "middle", 10, MUT, False, False))
    o.append(c1.line(mp, c=ALI, lw=2.4))
    o.append(W(c1.X(0.02), c1.Y(5), c1.X(0.21), c1.Y(5), c1.X(0.21), c1.Y(0), c=GRN, lw=1.2, dash="4 3"))
    o.append(D(c1.X(0.21), c1.Y(5), GRN, 3.8))
    o.append(T(c1.X(0.25), c1.Y(5) - 7, "0.21 V/rad で 5 %", "start", 9.5, GRN, True, halo=True))
    o.append(T(c1.X(0.05), c1.Y(30), "0.1 V/rad まで", "middle", 9.5, MUT, halo=True))
    o.append(T(c1.X(0.05), c1.Y(30) + 14, "行き過ぎない", "middle", 9.5, MUT, halo=True))
    o.append(T(c1.X(1.0) + 4, c1.Y(35.1) + 4, "1 V/rad で 35.1 %", "start", 9.5, ALI, True, halo=True))
    o.append(D(c1.X(1.0), c1.Y(35.1), ALI, 3.2))
    o.append(_f04_m(380, 18, [_f04_t("(b) 2 % 整定時間 "), _f04_v("t", "2%")], "start", 11.5, INK, True, False))
    c2 = Plot(420, 34, 260, 170, (0.02, 20), (0, 1.5), xlog=True)
    o.append(c2.axes(xl=None, yl="時間 [s]", xt=[0.1, 1, 10], yt=[0, 0.5, 1.0, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(_f04_m(c2.x + c2.w / 2, c2.y + c2.h + 31, [_f04_t("比例ゲイン "), _f04_v("K", "P"), _f04_t(" [V/rad]（対数の目盛）")], "middle", 10, MUT, False, False))
    segs, cur = [], []
    for a, b in t2s:
        if cur and abs(b - cur[-1][1]) > 0.03:
            segs.append(cur); cur = []
        cur.append((a, b))
    segs.append(cur)
    o.append(W(c2.X(0.02), c2.Y(0.4), c2.X(20), c2.Y(0.4), c=GLD, lw=1.2, dash="5 3"))
    for sgm in segs:
        o.append(_f04_pl(c2, sgm, c=SIG, lw=2.4))
    o.append(_f04_m(c2.X(19), c2.Y(0.4) + 15, [_f04_t("目安 4/("), _f04_g("ζ"), _f04_g("ω", "n"), _f04_t(") = 0.4 s")], "end", 9.5, GLD, True))
    o.append(D(c2.X(0.21), c2.Y(0.414), GRN, 3.8))
    o.append(T(c2.X(0.23), c2.Y(0.414) - 9, "0.21 V/rad で 0.414 s", "start", 9.5, GRN, True, halo=True))
    o.append(T(c2.X(0.105), c2.Y(1.3), "根が実軸の上（過減衰）", "start", 9.5, MUT, halo=True))
    o.append(T(c2.X(0.105), c2.Y(1.3) + 14, "では遅い", "start", 9.5, MUT, halo=True))
    return SVG(700, 250, o, "比例ゲインを変えたときの指標（モータの位置の比例制御、L<sub>a</sub> を無視した二次遅れの式）。(a) 行き過ぎ量は、根が重なる 0.1 V/rad を超えると増え、0.21 V/rad で 5 % になる。(b) 2 % 整定時間は、0.21 V/rad を超えても根の実部が −10 のままなので、0.35〜0.41 s から縮まない（段は、山や谷が ±2 % の幅に入るたびに起きる）。")
F["e04_motor_design"] = _f04_motor_design_fig()
