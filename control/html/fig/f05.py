# -*- coding: utf-8 -*-
# 05 章 ラプラス変換 の図
import numpy as _f05_np


# =====================================================================
# 補助
# =====================================================================
def _f05_fmt(v):
    """目盛の数字（余分な 0 を付けない）。"""
    if abs(v) < 1e-12:
        return "0"
    return ("%.4g" % v).replace("-", "−")


def _f05_parse(s):
    """'e^{−20t}' や 'A_1'、'e^{λ_i t}' を [(文字, 種類)] に分ける。種類は 0 = 普通、-1 = 添字、1 = 上付き、2 = 上付きの中の添字。"""
    out, buf, i = [], "", 0
    while i < len(s):
        ch = s[i]
        if ch in "_^" and i + 1 < len(s):
            if buf:
                out.append((buf, 0)); buf = ""
            kind = -1 if ch == "_" else 1
            if s[i + 1] == "{":
                j = s.index("}", i + 2)
                grp = s[i + 2:j]; i = j + 1
            else:
                grp = s[i + 1]; i += 2
            if kind == 1 and "_" in grp:
                k = 0; b2 = ""
                while k < len(grp):
                    if grp[k] == "_" and k + 1 < len(grp):
                        if b2:
                            out.append((b2, 1)); b2 = ""
                        out.append((grp[k + 1], 2)); k += 2
                    else:
                        b2 += grp[k]; k += 1
                if b2:
                    out.append((b2, 1))
            else:
                out.append((grp, kind))
            continue
        buf += ch; i += 1
    if buf:
        out.append((buf, 0))
    return out


def _f05_tw(s, sz=10.5):
    """_f05_tx で書く文字の幅。"""
    return sum(tw(t, sz * {0: 1.0, -1: 0.72, 1: 0.72, 2: 0.58}[k]) for t, k in _f05_parse(s))


def _f05_tx(x, y, s, a="start", sz=10.5, c=INK, b=False, halo=False):
    """添字（_x、_{xy}）と上付き（^x、^{xy}）を書ける文字。例 'e^{−20t}'、'A_1 = 600'、'Y(s)'。"""
    segs = _f05_parse(s)
    ssz = round(sz * 0.72, 2)
    fsz = {0: sz, -1: ssz, 1: ssz, 2: round(sz * 0.58, 2)}
    w = sum(tw(t, fsz[k]) for t, k in segs)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    up = sz * 0.3 if any(k == 1 for _, k in segs) else 0
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82 - up, x0 + w, y + sz * 0.22 + (2 if any(k == -1 for _, k in segs) else 0), s))
    hs = (' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR) if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hs)]
    cur = 0.0
    for t, k in segs:
        off = {0: 0.0, -1: sz * 0.28, 1: -sz * 0.42, 2: -sz * 0.28}[k]
        dy = off - cur
        o.append('<tspan%s%s>%s</tspan>' % ((' dy="%g"' % round(dy, 2)) if abs(dy) > 1e-9 else "",
                                            (' font-size="%g"' % fsz[k]) if k else "", E(t)))
        cur = off
    o.append("</text>")
    return "".join(o)


def _f05_pl(p, pts, c=SIG, lw=2.0, dash=None):
    """Plot p の範囲で切った折れ線（範囲の外に出る所で線を切り、戻ればまた描く）。"""
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
    return "".join(PL([(p.X(a), p.Y(b)) for a, b in s_], c=c, lw=lw, dash=dash) for s_ in segs if len(s_) >= 2)


def _f05_fill(p, pts, c=SIG, op=None, base=0.0):
    """曲線と y = base の間を薄く塗る（範囲で切る）。"""
    lo, hi = min(p.yr), max(p.yr)
    q = [(p.X(pts[0][0]), p.Y(base))]
    for a, b in pts:
        q.append((p.X(a), p.Y(min(max(b, lo), hi))))
    q.append((p.X(pts[-1][0]), p.Y(base)))
    return PL(q, c="none", lw=0, fill=soft(c), op=op)


def _f05_x(x, y, c, r=5.0, lw=2.2):
    """根の印（×）。"""
    return W(x - r, y - r, x + r, y + r, c=c, lw=lw) + W(x - r, y + r, x + r, y - r, c=c, lw=lw)


def _f05_mini(x, y, w, h, xr, yr, roots, rhp=True, axes_lab=False, sz=9, frame=True):
    """小さな s 平面。roots = [(複素数, 色, 重なりの数), ...]。範囲の外の根は、縁に矢印と値で示す。返り値 (svg, Plot)。"""
    p = Plot(x, y, w, h, xr, yr)
    o = []
    if frame:
        o.append(RECT(x, y, w, h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(p, rhp=rhp))
    for r, c, m in roots:
        re, im = r.real, r.imag
        if xr[0] <= re <= xr[1] and yr[0] <= im <= yr[1]:
            o.append(_f05_x(p.X(re), p.Y(im), c))
            if m > 1:
                o.append(T(p.X(re) - 6, p.Y(im) + 14, "×%d" % m, "end", 8.5, c, True, halo=True))
        else:
            xx = min(max(re, xr[0]), xr[1]); yy = min(max(im, yr[0]), yr[1])
            X, Y = p.X(xx), p.Y(yy)
            if re < xr[0]:
                o.append(ARR(X + 14, Y, X + 2, Y, c=c, lw=1.6, head=5))
                o.append(T(X + 16, Y + 3.5, _f05_fmt(re), "start", 8.5, c, True, halo=True))
    if axes_lab:
        o.append(T(x + w - 2, p.Y(0) - 3, "σ", "end", sz, MUT))
        o.append(T(p.X(0) + 3, y + sz, "jω", "start", sz, MUT))
    return "".join(o), p


def _f05_legl(x, y, items, sz=10, gap=18):
    """線の見本つきの凡例。文字は _f05_tx で書く（上付きを書ける）。items = [(色, 破線 or None, 文字), ...]"""
    o, xx = [], x
    for c, dash, t in items:
        o.append(W(xx, y - 4, xx + 24, y - 4, c=c, lw=2.2, dash=dash))
        o.append(_f05_tx(xx + 30, y, t, "start", sz, MUT))
        xx += 30 + _f05_tw(t, sz) + gap
    return "".join(o)


# ---- 例の値（本文と同じ） ----
_F05_K, _F05_T = 50.0, 0.05          # モータ: K [(rad/s)/V]、T [s]
_F05_WD = math.sqrt(24.0)           # 台車の減衰固有角周波数 4.899 rad/s


def _f05_cart_step(t):
    """台車（m 1、c 2、k 25）を 1 N で押したときの位置 [m]。"""
    t = _f05_np.asarray(t, float)
    return 0.04 * (1 - _f05_np.exp(-t) * (_f05_np.cos(_F05_WD * t) + _f05_np.sin(_F05_WD * t) / _F05_WD))


def _f05_cart_free(t):
    """台車を 4 cm 引いて静かに離したときの位置 [m]。"""
    t = _f05_np.asarray(t, float)
    return 0.04 * _f05_np.exp(-t) * (_f05_np.cos(_F05_WD * t) + _f05_np.sin(_F05_WD * t) / _F05_WD)


def _f05_rk4(f, x0, t0, t1, n):
    """4 次のルンゲ・クッタ法（本文の数値の確かめに使う）。返り値 [(t, x), ...]。"""
    h = (t1 - t0) / n
    x = list(x0); t = t0; out = [(t, list(x))]
    for _ in range(n):
        k1 = f(t, x)
        k2 = f(t + h / 2, [a + h / 2 * b for a, b in zip(x, k1)])
        k3 = f(t + h / 2, [a + h / 2 * b for a, b in zip(x, k2)])
        k4 = f(t + h, [a + h * b for a, b in zip(x, k3)])
        x = [a + h / 6 * (p1 + 2 * p2 + 2 * p3 + p4) for a, p1, p2, p3, p4 in zip(x, k1, k2, k3, k4)]
        t += h
        out.append((t, list(x)))
    return out


# =====================================================================
# 1 節: 3・4 章の解き方は入力ごとに違う
# =====================================================================
def _f05_methods_fig():
    o = []
    o.append(T(14, 18, "3・4 章で、入力と式ごとに使った工夫", "start", 11.5, INK, True))
    cards = [
        ("ステップ（3 章 2 節）", "step", ["落ち着く値からのずれ δy に", "注目し、e^{t/T} を掛けて積分", "する"]),
        ("ランプ（3 章 3 節）", "ramp", ["直線の解 Kα(t − T) を探し、", "残りのずれを e^{−t/T} で", "初期値に合わせる"]),
        ("パルス（3 章 3 節）", "pulse", ["時刻 0 のステップと、遅らせ", "た負のステップの和に分け、", "応答を足す"]),
        ("二次遅れ（4 章 2・3 節）", "second", ["e^{λt} を仮定して特性根を", "求め、2 つの係数を初期値", "に合わせる"]),
    ]
    cw, gap, x0, y0 = 160.0, 12.0, 14.0, 32.0
    for k, (ttl, kind, lines) in enumerate(cards):
        x = x0 + k * (cw + gap)
        o.append(RECT(x, y0, cw, 176, 7, PAN, LIN, 1.2))
        o.append(T(x + cw / 2, y0 + 19, ttl, "middle", 10.5, INK, True))
        p = Plot(x + 14, y0 + 30, cw - 28, 64, (-0.4, 6.0), (-0.15, 1.25))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        o.append(ARR(p.x + p.w - 6, p.Y(0), p.x + p.w + 4, p.Y(0), c=MUT, lw=1, head=5))
        o.append(T(p.x + p.w + 2, p.Y(0) + 12, "t", "end", 9.5, MUT))
        ts = _f05_np.linspace(0, 6, 241)
        if kind == "step":
            uu = [(-0.4, 0), (0, 0), (0, 1), (6, 1)]
            yy = [(t, 1 - math.exp(-t)) for t in ts]
        elif kind == "ramp":
            uu = [(-0.4, 0), (0, 0)] + [(t, t / 5) for t in ts]
            yy = [(t, (t - 1 + math.exp(-t)) / 5) for t in ts]
        elif kind == "pulse":
            uu = [(-0.4, 0), (0, 0), (0, 1), (1.6, 1), (1.6, 0), (6, 0)]
            yy = [(t, (1 - math.exp(-t)) if t < 1.6 else (math.exp(1.6) - 1) * math.exp(-t)) for t in ts]
        else:
            uu = [(-0.4, 0), (0, 0), (0, 0.6), (6, 0.6)]
            z, wn = 0.2, 2.6
            wd = wn * math.sqrt(1 - z * z)
            yy = [(t, 0.6 * (1 - math.exp(-z * wn * t) * (math.cos(wd * t) + z / math.sqrt(1 - z * z) * math.sin(wd * t)))) for t in ts]
        o.append(_f05_pl(p, uu, GLD, 1.6, "5 3"))
        o.append(_f05_pl(p, yy, SIG, 2.2))
        for i, ln in enumerate(lines):
            o.append(_f05_tx(x + 10, y0 + 122 + i * 15, ln, "start", 9.5, INK))
    o.append(LEGL(14, 230, [(GLD, "5 3", "入力"), (SIG, None, "出力（応答）")]))
    o.append(T(686, 230, "どれも、答えの形に見当をつけてから確かめる方法である", "end", 10, ALI, True))
    return SVG(700, 240, o, "3・4 章で微分方程式を解いたときの工夫。入力の形（ステップ・ランプ・パルス）や式の階数が変わるたびに、別の工夫で解いた。この章では、どの場合にも同じ手順で使える方法を作る。")
F["e05_methods"] = _f05_methods_fig()


# =====================================================================
# 1 節: 指数関数の微分は s 倍 / 指数関数の入力
# =====================================================================
def _f05_expo_fig():
    o = []
    o.append(_f05_tx(14, 18, "(a) e^{st} の傾き（微分）は、値の s 倍", "start", 11.5, INK, True))
    p = Plot(56, 36, 250, 200, (0, 2.0), (0, 3.0))
    o.append(p.axes(xl="時間 t [s]", yl="値", xt=[0, 0.5, 1.0, 1.5, 2.0], yt=[0, 1, 2, 3], xfmt=_f05_fmt))
    ts = _f05_np.linspace(0, 2, 201)
    o.append(p.line([(t, math.exp(-2 * t)) for t in ts], c=SIG, lw=2.4))
    o.append(p.line([(t, math.exp(0.5 * t)) for t in ts], c=TEA, lw=2.4))
    for t0 in (0.0, 0.5, 1.0):
        v = math.exp(-2 * t0); sl = -2 * v; d = 0.22
        o.append(W(p.X(max(0, t0 - d)), p.Y(v - sl * (t0 - max(0, t0 - d))), p.X(t0 + d), p.Y(v + sl * d), c=GLD, lw=1.6, dash="4 2"))
        o.append(D(p.X(t0), p.Y(v), SIG, 3.4))
    for t0 in (1.0, 1.6):
        v = math.exp(0.5 * t0); sl = 0.5 * v; d = 0.3
        o.append(W(p.X(t0 - d), p.Y(v - sl * d), p.X(t0 + d), p.Y(v + sl * d), c=GLD, lw=1.6, dash="4 2"))
        o.append(D(p.X(t0), p.Y(v), TEA, 3.4))
    o.append(_f05_tx(p.X(0.08), p.Y(2.72), "e^{0.5t}（s = 0.5）", "start", 10, TEA, True, halo=True))
    o.append(_f05_tx(p.X(1.97), p.Y(1.38), "傾き 0.5 × 1.65 = 0.82", "end", 9.5, TEA, halo=True))
    o.append(_f05_tx(p.X(0.42), p.Y(1.02), "e^{−2t}（s = −2）", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(0.95), p.Y(0.80), "接線の傾き = −2 × 値", "start", 9.5, SIG, True, halo=True))
    for i, (tt, sv) in enumerate((("0", "−2 × 1 = −2"), ("0.5", "−2 × 0.368 = −0.74"), ("1", "−2 × 0.135 = −0.27"))):
        o.append(T(p.X(0.95), p.Y(0.80) + 13 * (i + 1), "t = %s: %s" % (tt, sv), "start", 9, SIG, halo=True))
    # (b) モータに 12 e^{-10t} V
    xb = 380
    o.append(_f05_tx(xb - 30, 18, "(b) モータに u = 12e^{−10t} V を加える（止まった状態から）", "start", 11.5, INK, True))
    q = Plot(xb + 30, 36, 280, 200, (0, 0.4), (-1300, 1300))
    o.append(q.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[-1200, -600, 0, 600, 1200], xfmt=_f05_fmt))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    tq = _f05_np.linspace(0, 0.4, 401)
    o.append(q.line([(t, 1200 * math.exp(-10 * t)) for t in tq], c=GLD, lw=1.8, dash="6 3"))
    o.append(q.line([(t, -1200 * math.exp(-20 * t)) for t in tq], c=PUR, lw=1.8, dash="6 3"))
    o.append(q.line([(t, 1200 * (math.exp(-10 * t) - math.exp(-20 * t))) for t in tq], c=SIG, lw=2.6))
    num = _f05_rk4(lambda t, x: [(_F05_K * 12 * math.exp(-10 * t) - x[0]) / _F05_T], [0.0], 0.0, 0.4, 400)
    for i in range(20, 401, 40):
        o.append(CIRC(q.X(num[i][0]), q.Y(num[i][1][0]), 3.2, c=INK, lw=1.2, fill=SCR))
    o.append(_f05_tx(q.X(0.06), q.Y(1150), "入力に比例する部分 100 × u = 1200e^{−10t}", "start", 9.5, GLD, True, halo=True))
    o.append(_f05_tx(q.X(0.07), q.Y(-1000), "自由な動き −1200e^{−20t}（初期値 0 に合わせる）", "start", 9.5, PUR, True, halo=True))
    o.append(_f05_tx(q.X(0.12), q.Y(390), "和 y(t)（最大 300 rad/s）", "start", 10, SIG, True, halo=True))
    o.append(T(q.X(0.39), q.Y(-300), "○: 数値で解いた値", "end", 9.5, INK, halo=True))
    return SVG(700, 288, o, "指数関数と微分。(a) e<sup>st</sup> の各時刻の傾き（金の接線）は、その時刻の値の s 倍である。e<sup>st</sup> の形の関数では、微分は s を掛けることと同じになる。(b) モータ（T = 0.05 s、K = 50 (rad/s)/V）に 12e<sup>−10t</sup> V を加えると、入力に比例する部分は代数（A = K/(Ts + 1) = 100）で求まるが、止まった状態から始めるには、自由な動き e<sup>−t/T</sup> を足して初期値 0 に合わせる必要がある。○ は微分方程式を 4 次のルンゲ・クッタ法で解いた値。")
F["e05_expo"] = _f05_expo_fig()


# =====================================================================
# 1 節: この章の手順（変換 → 代数 → 戻す）と、対数の計算
# =====================================================================
def _f05_flow_fig():
    o = []
    # 2 つの世界の帯
    o.append(RECT(10, 30, 440, 76, 6, GSOFT, "none", 0, op=0.5))
    o.append(RECT(10, 128, 440, 92, 6, SSOFT, "none", 0, op=0.5))
    o.append(T(18, 46, "時間の世界", "start", 10, GRN, True))
    o.append(T(18, 144, "s の世界", "start", 10, SIG, True))
    o.append(T(14, 18, "(a) この章の手順", "start", 11.5, INK, True))
    # 箱
    def box(x, y, w, h, l1, l2, c):
        s_ = [RECT(x, y, w, h, 7, PAN, c, 1.4)]
        s_.append(_f05_tx(x + w / 2, y + h / 2 - 3, l1, "middle", 10, INK, True))
        if l2:
            s_.append(_f05_tx(x + w / 2, y + h / 2 + 13, l2, "middle", 9.5, MUT))
        return "".join(s_)
    o.append(box(20, 52, 132, 44, "微分方程式", "T ẏ + y = Ku、y(0)", GRN))
    o.append(box(306, 52, 136, 44, "時間の関数 y(t)", "Σ A_i e^{λ_i t}", GRN))
    o.append(box(20, 156, 132, 50, "代数の式", "(Ts + 1)Y = KU + Ty(0)", SIG))
    o.append(box(166, 156, 126, 50, "Y(s) を解く", "分数の式", SIG))
    o.append(box(306, 156, 136, 50, "簡単な分数の和", "Σ A_i/(s − λ_i)", SIG))
    o.append(ARR(86, 96, 86, 154, c=INK, lw=1.8))
    o.append(T(92, 118, "変換（2・3 節）", "start", 9.5, INK, True))
    o.append(T(92, 131, "微分 → s を掛ける", "start", 9, MUT))
    o.append(ARR(152, 181, 164, 181, c=INK, lw=1.8, head=6))
    o.append(ARR(292, 181, 304, 181, c=INK, lw=1.8, head=6))
    o.append(T(229, 224, "簡単な分数に分ける（4 節）", "middle", 9.5, INK, True))
    o.append(ARR(374, 154, 374, 98, c=INK, lw=1.8))
    o.append(T(368, 118, "表を逆に引く", "end", 9.5, INK, True))
    o.append(T(368, 131, "（4 節）", "end", 9, MUT))
    o.append(ARR(154, 74, 302, 74, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(228, 68, "直接解く（3・4 章）", "middle", 9.5, ALI, True))
    # (b) 対数
    xb = 474
    o.append(T(xb, 18, "(b) 同じ考え方: 対数で掛け算を足し算に", "start", 11.5, INK, True))
    o.append(RECT(xb, 30, 216, 76, 6, GSOFT, "none", 0, op=0.5))
    o.append(RECT(xb, 128, 216, 92, 6, SSOFT, "none", 0, op=0.5))
    o.append(T(xb + 8, 46, "数の世界", "start", 10, GRN, True))
    o.append(T(xb + 8, 144, "対数の世界", "start", 10, SIG, True))
    o.append(RECT(xb + 8, 56, 86, 36, 7, PAN, GRN, 1.4)); o.append(T(xb + 51, 79, "2.34 × 5.67", "middle", 10.5, INK, True))
    o.append(RECT(xb + 128, 56, 80, 36, 7, PAN, GRN, 1.4)); o.append(T(xb + 168, 79, "13.27", "middle", 10.5, INK, True))
    o.append(RECT(xb + 8, 158, 200, 46, 7, PAN, SIG, 1.4))
    o.append(T(xb + 108, 176, "0.3692 + 0.7536", "middle", 10.5, INK, True))
    o.append(T(xb + 108, 194, "= 1.1228（足し算だけ）", "middle", 9.5, MUT))
    o.append(ARR(xb + 51, 92, xb + 51, 156, c=INK, lw=1.8))
    o.append(_f05_tx(xb + 57, 124, "log_{10}", "start", 9.5, INK, True))
    o.append(ARR(xb + 168, 156, xb + 168, 94, c=INK, lw=1.8))
    o.append(_f05_tx(xb + 162, 124, "10^{x}", "end", 9.5, INK, True))
    o.append(ARR(xb + 96, 74, xb + 126, 74, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(xb + 111, 104, "筆算", "middle", 9.5, ALI, True))
    return SVG(700, 234, o, "(a) この章の手順。微分方程式を直接解く代わりに（赤の破線）、変換して s の世界に移り、代数の式として解いてから、簡単な分数の和に分けて時間の世界に戻る。初期値は変換した式の中に入る。(b) 掛け算を、対数を取って足し算に変え、計算してから元に戻すのと同じ考え方である（log<sub>10</sub> 2.34 = 0.3692、log<sub>10</sub> 5.67 = 0.7536、10<sup>1.1228</sup> = 13.27）。")
F["e05_flow"] = _f05_flow_fig()


# =====================================================================
# 2 節: 定義は「重みを付けた面積」
# =====================================================================
def _f05_area_fig():
    o = []
    cs = [(0.5, TEA), (1.0, SIG), (2.0, PUR)]
    o.append(_f05_tx(14, 18, "(a) 単位ステップ × 重み e^{−st}", "start", 11.5, INK, True))
    p = Plot(50, 36, 220, 180, (0, 6), (0, 1.15))
    o.append(p.axes(xl="時間 t [s]", yl="f(t) e^{−st}", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.5, 1.0], xfmt=_f05_fmt, yfmt=_f05_fmt))
    ts = _f05_np.linspace(0, 6, 241)
    for s_, c in cs[::-1]:
        pts = [(t, math.exp(-s_ * t)) for t in ts]
        o.append(_f05_fill(p, pts, c, op=0.55))
    for s_, c in cs:
        o.append(p.line([(t, math.exp(-s_ * t)) for t in ts], c=c, lw=2.0))
    o.append(p.line([(0, 1), (6, 1)], c=MUT, lw=1.2, dash="5 3"))
    o.append(_f05_tx(p.X(5.9), p.Y(1.0) - 6, "f(t) = 1", "end", 9.5, MUT, halo=True))
    for k, (s_, c) in enumerate(cs):
        o.append(_f05_tx(p.X(5.9), p.Y(0.72) + k * 15, "s = %g: 面積 %g" % (s_, 1 / s_), "end", 9.5, c, True, halo=True))
    # (b) F(s) = 1/s
    o.append(_f05_tx(306, 18, "(b) 面積を s ごとに並べる", "start", 11.5, INK, True))
    q = Plot(336, 36, 150, 180, (0, 3), (0, 4))
    o.append(q.axes(xl="s [1/s]", yl="F(s) [s]", xt=[0, 1, 2, 3], yt=[0, 1, 2, 3, 4], xfmt=_f05_fmt))
    ss = _f05_np.linspace(0.25, 3, 200)
    o.append(q.line([(v, 1 / v) for v in ss], c=INK, lw=2.0))
    for s_, c in cs:
        o.append(D(q.X(s_), q.Y(1 / s_), c, 4.6))
    o.append(_f05_tx(q.X(1.15), q.Y(1.9), "F(s) = 1/s", "start", 10.5, INK, True, halo=True))
    # (c) 増える関数
    o.append(_f05_tx(518, 18, "(c) f(t) = e^{0.5t} のとき", "start", 11.5, INK, True))
    r = Plot(540, 36, 146, 180, (0, 6), (0, 2.2))
    o.append(r.axes(xl="時間 t [s]", yl=None, xt=[0, 2, 4, 6], yt=[0, 1, 2], xfmt=_f05_fmt))
    o.append(_f05_pl(r, [(t, math.exp(0.5 * t)) for t in ts], GLD, 1.6, "5 3"))
    o.append(_f05_fill(r, [(t, math.exp(-0.5 * t)) for t in ts], GRN, op=0.6))
    o.append(r.line([(t, math.exp(-0.5 * t)) for t in ts], c=GRN, lw=2.0))
    o.append(_f05_pl(r, [(t, math.exp(0.1 * t)) for t in ts], ALI, 2.0))
    o.append(_f05_tx(r.X(0.1), r.Y(2.05), "f(t)", "start", 9.5, GLD, True, halo=True))
    o.append(T(r.X(5.95), r.Y(2.1), "s = 0.4: 増え続け、", "end", 9.5, ALI, True, halo=True))
    o.append(T(r.X(5.95), r.Y(2.1) + 13, "面積は無限", "end", 9.5, ALI, True, halo=True))
    o.append(T(r.X(5.9), r.Y(0.34), "s = 1: 面積 2", "end", 9.5, GRN, True, halo=True))
    return SVG(700, 262, o, "ラプラス変換の定義を、s が実数のときの面積で見る。(a) 単位ステップに重み e<sup>−st</sup> を掛けた曲線の下の面積が F(s) である。s が大きいほど重みは速く減り、面積は小さくなる。(b) 面積を s ごとに並べた関数 F(s) = 1/s。(c) 増え続ける e<sup>0.5t</sup> でも、s > 0.5 なら重みの減り方が勝ち、面積は有限（1/(s − 0.5)）になる。s < 0.5 では面積は限りなく大きくなる。")
F["e05_area"] = _f05_area_fig()


# =====================================================================
# 2 節: s 平面の点ごとの e^{st} の実部
# =====================================================================
def _f05_splane_grid_fig():
    o = []
    sig = [-1.5, -0.5, 0.0, 0.3]
    om = [8.0, 3.0, 0.0]
    x0, y0, cw, ch = 74, 30, 150, 94
    W_ = cw * len(sig); H_ = ch * len(om)
    # 右半分（σ > 0）の列を薄い赤、虚軸の列に縦線
    o.append(RECT(x0 + 3 * cw, y0, cw, H_, 0, ASOFT, "none", 0))
    o.append(RECT(x0, y0, W_, H_, 0, "none", LIN, 1.0))
    for i in range(1, len(sig)):
        o.append(W(x0 + i * cw, y0, x0 + i * cw, y0 + H_, c=GRD, lw=1))
    for j in range(1, len(om)):
        o.append(W(x0, y0 + j * ch, x0 + W_, y0 + j * ch, c=GRD, lw=1))
    # 軸の名前と値
    for i, sv in enumerate(sig):
        o.append(T(x0 + i * cw + cw / 2, y0 + H_ + 15, "σ = %s" % _f05_fmt(sv), "middle", 10, INK, True))
    for j, wv in enumerate(om):
        o.append(T(x0 - 8, y0 + j * ch + ch / 2 + 4, "ω = %s" % _f05_fmt(wv), "end", 10, INK, True))
    o.append(ARR(x0, y0 + H_ + 30, x0 + W_ + 12, y0 + H_ + 30, c=MUT, lw=1.4))
    o.append(T(x0 + W_ + 10, y0 + H_ + 44, "実部 σ [1/s]（右へ行くほど増える側）", "end", 9.5, MUT))
    o.append(T(x0 + 2 * cw + cw / 2, y0 + H_ + 44, "虚軸（σ = 0）", "middle", 9.5, MUT))
    o.append(T(18, y0 + H_ / 2, "虚部 ω [rad/s]", "middle", 9.5, MUT, rot=-90))
    ts = _f05_np.linspace(0, 4, 321)
    for j, wv in enumerate(om):
        for i, sv in enumerate(sig):
            cx, cy = x0 + i * cw, y0 + j * ch
            p = Plot(cx + 12, cy + 22, cw - 24, ch - 34, (0, 4), (-1.6, 1.6))
            o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=FNT, lw=0.8))
            if wv > 0:
                o.append(_f05_pl(p, [(t, math.exp(sv * t)) for t in ts], FNT, 1.0, "3 3"))
                o.append(_f05_pl(p, [(t, -math.exp(sv * t)) for t in ts], FNT, 1.0, "3 3"))
            c = ALI if sv > 0 else (GLD if sv == 0 else SIG)
            o.append(_f05_pl(p, [(t, math.exp(sv * t) * math.cos(wv * t)) for t in ts], c, 1.8))
            o.append(D(cx + 8, cy + 9, c, 2.6))
            lab = ("s = %s" % _f05_fmt(sv)) if wv == 0 else ("s = %s + j%s" % (_f05_fmt(sv), _f05_fmt(wv)) if sv != 0 else "s = j%s" % _f05_fmt(wv))
            o.append(T(cx + 14, cy + 13, lab, "start", 9, MUT))
    return SVG(700, y0 + H_ + 52, o, "s 平面の点 s ごとに、e<sup>st</sup> の実部 e<sup>σt</sup> cos ωt を描いた（各枠の横軸は時間 0〜4 s、縦軸は −1.6〜1.6。点の間隔は等しく描いた）。虚軸より左（σ < 0）では減り、右（σ > 0、薄い赤）では増え続け、虚軸の上では同じ振れ幅で続く。実軸から離れるほど速く揺れる。破線は包絡線 ±e<sup>σt</sup>。ω の符号を変えた点（下半分）の実部は、同じ波形になる。")
F["e05_splane_grid"] = _f05_splane_grid_fig()


# =====================================================================
# 2 節: 基本の変換の表（波形と、分母を 0 にする s の位置）
# =====================================================================
def _f05_table_fig():
    o = []
    rows = [
        ("δ(t)", "imp", "1", [], "なし"),
        ("1（単位ステップ）", "step", "1/s", [(0j, GLD, 1)], "0"),
        ("e^{−2t}", lambda t: math.exp(-2 * t), "1/(s + 2)", [(-2 + 0j, SIG, 1)], "−2"),
        ("e^{0.5t}", lambda t: math.exp(0.5 * t) / 4.5, "1/(s − 0.5)", [(0.5 + 0j, ALI, 1)], "+0.5（虚軸より右）"),
        ("t", lambda t: t / 3.0, "1/s^2", [(0j, GLD, 2)], "0 が 2 つ重なる"),
        ("t e^{−2t}", lambda t: t * math.exp(-2 * t) * 5.4, "1/(s + 2)^2", [(-2 + 0j, SIG, 2)], "−2 が 2 つ重なる"),
        ("sin 5t", lambda t: math.sin(5 * t), "5/(s^2 + 25)", [(5j, GLD, 1), (-5j, GLD, 1)], "±j5（虚軸の上）"),
        ("e^{−t} sin 4.9t", lambda t: math.exp(-t) * math.sin(4.9 * t), "4.9/((s + 1)^2 + 4.9^2)", [(-1 + 4.9j, SIG, 1), (-1 - 4.9j, SIG, 1)], "−1 ± j4.9"),
    ]
    xf, xw, xF, xs = 14, 146, 304, 474
    y0, rh = 46, 46
    o.append(T(xf, 22, "f(t)（t ≥ 0）", "start", 10.5, INK, True))
    o.append(T(xw + 70, 22, "波形（t = 0〜3 s）", "middle", 10.5, INK, True))
    o.append(T(xF, 22, "F(s)", "start", 10.5, INK, True))
    o.append(T(xs, 22, "分母を 0 にする s（s 平面の ×）", "start", 10.5, INK, True))
    o.append(W(10, 30, 690, 30, c=LIN, lw=1))
    ts = _f05_np.linspace(0, 3, 241)
    for k, (fl, fn, Fl, rts, desc) in enumerate(rows):
        y = y0 + k * rh
        if k:
            o.append(W(10, y - 6, 690, y - 6, c=GRD, lw=1))
        o.append(_f05_tx(xf, y + 22, fl, "start", 10.5, INK, True))
        p = Plot(xw, y, 140, 34, (0, 3), (-1.15, 1.15))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=FNT, lw=0.8))
        c = ALI if any(r.real > 0 for r, _, _ in rts) else SIG
        if fn == "imp":
            o.append(ARR(p.X(0) + 1, p.Y(0), p.X(0) + 1, p.Y(1.12), c=SIG, lw=2.2, head=6))
            o.append(T(p.X(0) + 8, p.Y(0.45), "面積 1 で幅 0", "start", 9, MUT))
        elif fn == "step":
            o.append(p.line([(0, 0), (0, 0.8), (3, 0.8)], c=SIG, lw=2.0))
        else:
            o.append(_f05_pl(p, [(t, fn(t)) for t in ts], c, 2.0))
        o.append(_f05_tx(xF, y + 22, Fl, "start", 10.5, INK, True))
        m, pm = _f05_mini(xs, y - 2, 96, 38, (-3, 1.2), (-6.5, 6.5), rts)
        o.append(m)
        o.append(T(xs + 104, y + 22, desc, "start", 9.5, ALI if c == ALI else MUT))
    return SVG(700, y0 + len(rows) * rh + 2, o, "基本の変換。右の小さな s 平面（横 −3〜1.2、縦 −6.5〜6.5）の × は、変換の分母を 0 にする s（分母の根）。実軸の上の根は揺れない指数関数、共役な組の根は揺れる関数を表し、根が虚軸より左なら減り、右なら増え続け（赤）、虚軸の上なら同じ振れ幅で続く。同じ所に根が 2 つ重なると t が掛かる。波形の縦の大きさは見やすくそろえた。")
F["e05_table"] = _f05_table_fig()


# =====================================================================
# 3 節: 微分の公式を面積で確かめる（200 rad/s で回るモータに 12 V）
# =====================================================================
def _f05_deriv_fig():
    o = []
    s_ = 20.0
    ts = _f05_np.linspace(0, 0.3, 301)
    y = lambda t: 600 - 400 * math.exp(-20 * t)
    yd = lambda t: 8000 * math.exp(-20 * t)
    o.append(_f05_tx(14, 18, "(a) y(t) と、重み e^{−st} を掛けた y(t)e^{−st}", "start", 11, INK, True))
    p = Plot(62, 36, 220, 180, (0, 0.3), (0, 650))
    o.append(p.axes(xl="時間 t [s]", yl="[rad/s]", xt=[0, 0.1, 0.2, 0.3], yt=[0, 200, 400, 600], xfmt=_f05_fmt))
    o.append(_f05_fill(p, [(t, y(t) * math.exp(-s_ * t)) for t in ts], SIG, op=0.7))
    o.append(p.line([(t, y(t)) for t in ts], c=SIG, lw=1.6, dash="5 3"))
    o.append(p.line([(t, y(t) * math.exp(-s_ * t)) for t in ts], c=SIG, lw=2.4))
    o.append(_f05_tx(p.X(0.29), p.Y(600) - 6, "y(t) = 600 − 400e^{−20t}", "end", 9.5, SIG, halo=True))
    o.append(T(p.X(0.012), p.Y(200) - 8, "y(0) = 200", "start", 9.5, SIG, True, halo=True))
    o.append(_f05_tx(p.X(0.09), p.Y(95), "面積 Y(20) = 20 rad", "start", 10, SIG, True, halo=True))
    xb = 316
    o.append(_f05_tx(xb, 18, "(b) ẏ(t) と ẏ(t)e^{−st}", "start", 11, INK, True))
    q = Plot(xb + 48, 36, 170, 180, (0, 0.3), (0, 8600))
    o.append(q.axes(xl="時間 t [s]", yl="[rad/s²]", xt=[0, 0.1, 0.2, 0.3], yt=[0, 2000, 4000, 6000, 8000], xfmt=_f05_fmt))
    o.append(_f05_fill(q, [(t, yd(t) * math.exp(-s_ * t)) for t in ts], PUR, op=0.7))
    o.append(q.line([(t, yd(t)) for t in ts], c=PUR, lw=1.6, dash="5 3"))
    o.append(q.line([(t, yd(t) * math.exp(-s_ * t)) for t in ts], c=PUR, lw=2.4))
    o.append(_f05_tx(q.X(0.035), q.Y(5600), "ẏ = 8000e^{−20t}", "start", 9.5, PUR, halo=True))
    o.append(_f05_tx(q.X(0.05), q.Y(1600), "面積 200 rad/s", "start", 10, PUR, True, halo=True))
    # 筆算
    xc = 556
    o.append(T(xc, 40, "s = 20 /s で確かめる", "start", 10.5, INK, True))
    lines = [("Y(20) = (a) の面積 = 20", SIG, False), ("sY(20) = 20 × 20 = 400", INK, False),
             ("sY(20) − y(0)", INK, False), ("= 400 − 200 = 200", INK, True),
             ("(b) の面積 = 200", PUR, False), ("→ 一致する", GRN, True)]
    yy = 64
    for txt, c, bb in lines:
        o.append(_f05_tx(xc, yy, txt, "start", 10, c, bb))
        yy += 21 if txt.startswith("sY(20) −") is False else 17
    o.append(T(xc, 230, "破線は重みを掛ける前", "start", 9, MUT))
    return SVG(700, 262, o, "微分の公式 L[ẏ] = sY(s) − y(0) を、s = 20 /s での面積で確かめる（200 rad/s で回っているモータに、時刻 0 に 12 V を加えたときの角速度）。(a) 重み e<sup>−20t</sup> を掛けた y の面積が Y(20)、(b) 重みを掛けた ẏ の面積が ẏ の変換である。(b) の面積は、(a) の面積の s 倍から初期値 y(0) を引いた値に等しい。")
F["e05_deriv"] = _f05_deriv_fig()


# =====================================================================
# 3 節: 積分の箱は 1/s。線図をそのまま代数で解く
# =====================================================================
def _f05_bd_fig():
    o = []
    R = 15
    def blk(x, y, w, h, s, c=LIN, fill=PAN, sz=11):
        return RECT(x, y - h / 2, w, h, 6, fill, c, 1.4) + _f05_tx(x + w / 2, y + 4, s, "middle", sz, INK, True)
    # (a) 一次遅れ
    o.append(T(14, 18, "(a) 3 章 1 節の一次遅れの線図（初期値 0）", "start", 11.5, INK, True))
    y = 66
    o.append(ARR(16, y, 62, y, c=GLD, lw=1.8)); o.append(_f05_tx(18, y - 9, "U(s)", "start", 10, GLD, True))
    o.append(blk(62, y, 40, 34, "K"))
    o.append(ARR(102, y, 158 - R, y, c=GLD, lw=1.8)); o.append(_f05_tx(122, y - 9, "KU", "middle", 10, GLD, True))
    o.append(SUMJ(158, y, {"l": "+", "b": "−"}))
    o.append(ARR(158 + R, y, 226, y, c=PUR, lw=1.8)); o.append(_f05_tx(200, y - 9, "KU − Y", "middle", 10, PUR, True))
    o.append(blk(226, y, 44, 34, "1/T"))
    o.append(ARR(270, y, 330, y, c=SIG, lw=1.8)); o.append(_f05_tx(300, y - 9, "sY(s)", "middle", 10, SIG, True))
    o.append(blk(330, y, 44, 34, "1/s", SIG, SSOFT))
    o.append(ARR(374, y, 460, y, c=SIG, lw=1.8)); o.append(_f05_tx(452, y - 9, "Y(s)", "end", 10, SIG, True))
    o.append(D(408, y, SIG, 3.8))
    o.append(W(408, y, 408, y + 44, 158, y + 44, c=SIG, lw=1.6)); o.append(ARR(158, y + 44, 158, y + R, c=SIG, lw=1.6))
    o.append(T(352, y - 26, "積分の箱", "middle", 9.5, SIG, True))
    o.append(_f05_tx(300, y + 22, "（ẏ の変換）", "middle", 9, MUT))
    xr = 488
    for i, (txt, c, bb) in enumerate((("一周する式: sY = (KU − Y)/T", INK, False), ("両辺に T を掛けて移す:", MUT, False),
                                       ("TsY + Y = KU", INK, False), ("(Ts + 1)Y(s) = KU(s)", SIG, True),
                                       ("微分方程式を変換した式と同じ", GRN, True))):
        o.append(_f05_tx(xr, 44 + i * 17, txt, "start", 10, c, bb))
    o.append(W(10, 136, 690, 136, c=LIN, lw=0.8))
    # (b) モータの位置の比例制御
    o.append(_f05_tx(14, 158, "(b) 4 章 6 節のモータの位置の比例制御（初期値 0）", "start", 11.5, INK, True))
    y = 206
    o.append(ARR(16, y, 70 - R, y, c=MUT, lw=1.8)); o.append(_f05_tx(18, y - 9, "R(s)", "start", 10, MUT, True))
    o.append(SUMJ(70, y, {"l": "+", "b": "−"}))
    o.append(ARR(70 + R, y, 116, y, c=ALI, lw=1.8))
    o.append(blk(116, y, 42, 34, "K_P"))
    o.append(ARR(158, y, 206, y, c=GLD, lw=1.8)); o.append(_f05_tx(182, y - 9, "V(s)", "middle", 10, GLD, True))
    o.append(blk(206, y, 92, 34, "K/(Ts + 1)", sz=10.5))
    o.append(ARR(298, y, 346, y, c=INK, lw=1.8)); o.append(_f05_tx(322, y - 9, "Ω_m(s)", "middle", 10, INK, True))
    o.append(blk(346, y, 40, 34, "1/s", SIG, SSOFT))
    o.append(ARR(386, y, 460, y, c=SIG, lw=1.8)); o.append(_f05_tx(452, y - 9, "Y(s)", "end", 10, SIG, True))
    o.append(D(420, y, SIG, 3.8))
    o.append(W(420, y, 420, y + 40, 70, y + 40, c=SIG, lw=1.6)); o.append(ARR(70, y + 40, 70, y + R, c=SIG, lw=1.6))
    o.append(_f05_tx(240, y + 34, "角度 y = θ_m（角速度を積分したもの）", "middle", 9.5, SIG))
    o.append(T(250, y - 24, "(a) をまとめたモータ", "middle", 9, MUT))
    for i, (txt, c, bb) in enumerate((("Y = (1/s) · K/(Ts + 1) · K_P(R − Y)", INK, False), ("分母を払って Y の項を集める:", MUT, False),
                                       ("(Ts^2 + s + KK_P)Y(s) = KK_P R(s)", SIG, True), ("左辺の多項式は 4 章 6 節の", GRN, True),
                                       ("特性方程式の左辺と同じ", GRN, True))):
        o.append(_f05_tx(xr, 184 + i * 17, txt, "start", 10, c, bb))
    return SVG(700, 270, o, "積分の箱は、変換すると 1/s を掛ける箱になる。(a) 3 章 1 節の一次遅れの線図。積分の箱の入力 ẏ の変換は sY(s) で、ループを一周する式を Y(s) について解くと、微分方程式を変換した式と同じ (Ts + 1)Y = KU になる。(b) 角速度を角度にする積分の箱がもう 1 つ加わると、2 次の多項式になる。")
F["e05_bd"] = _f05_bd_fig()


# =====================================================================
# 3 節: 時間のずれ（むだ時間）は e^{−Ls} を掛ける（温度の板、40 W）
# =====================================================================
def _f05_shift_fig():
    o = []
    L, s_ = 20.0, 0.05
    y = lambda t: 50 * (1 - math.exp(-t / 500.0)) if t >= 0 else 0.0
    ts = _f05_np.linspace(0, 150, 601)
    o.append(T(14, 18, "(a) 板の温度の上がり幅と、20 s 遅れた読み", "start", 11.5, INK, True))
    p = Plot(56, 34, 250, 190, (0, 150), (0, 14))
    o.append(p.axes(xl="時間 t [s]", yl="上がり幅 [K]", xt=[0, 50, 100, 150], yt=[0, 4, 8, 12], xfmt=_f05_fmt))
    o.append(p.line([(t, y(t)) for t in ts], c=SIG, lw=2.4))
    o.append(p.line([(t, y(t - L)) for t in ts], c=TEA, lw=2.4, dash="6 3"))
    o.append(DIM(p.X(100), p.Y(y(100)), p.X(120), p.Y(y(100)), None, c=ALI))
    o.append(T(p.X(110), p.Y(y(100)) - 7, "L = 20 s", "middle", 9.5, ALI, True, halo=True))
    o.append(_f05_tx(p.X(4), p.Y(12.6), "y(t) = 50(1 − e^{−t/500})", "start", 9.5, SIG, True, halo=True))
    o.append(_f05_tx(p.X(62), p.Y(3.0), "y(t − L)（t < L では 0）", "start", 9.5, TEA, True, halo=True))
    # (b) 重みを掛けた曲線
    xb = 360
    o.append(_f05_tx(xb, 18, "(b) 重み e^{−st} を掛けた曲線（s = 0.05 /s）", "start", 11.5, INK, True))
    q = Plot(xb + 40, 34, 280, 190, (0, 150), (0, 0.8))
    o.append(q.axes(xl="時間 t [s]", yl="[K]", xt=[0, 50, 100, 150], yt=[0, 0.2, 0.4, 0.6, 0.8], xfmt=_f05_fmt))
    a1 = [(t, y(t) * math.exp(-s_ * t)) for t in ts]
    a2 = [(t, y(t - L) * math.exp(-s_ * t)) for t in ts]
    a3 = [(t, y(t - L) * math.exp(-s_ * (t - L))) for t in ts]
    o.append(_f05_fill(q, a1, SIG, op=0.5)); o.append(_f05_fill(q, a2, TEA, op=0.8))
    o.append(q.line(a1, c=SIG, lw=2.2))
    o.append(q.line(a3, c=FNT, lw=1.4, dash="4 3"))
    o.append(q.line(a2, c=TEA, lw=2.2))
    F1 = 50 / (s_ * (500 * s_ + 1))
    o.append(_f05_tx(q.X(148), q.Y(0.74), "面積 Y(s) = 50/(s(500s + 1)) = %.1f" % F1, "end", 9.5, SIG, True, halo=True))
    o.append(_f05_tx(q.X(148), q.Y(0.60), "左の曲線を 20 s ずらしたもの（破線）", "end", 9, MUT, halo=True))
    o.append(_f05_tx(q.X(148), q.Y(0.44), "その e^{−sL} = %.3f 倍（青緑）" % math.exp(-s_ * L), "end", 9.5, TEA, True, halo=True))
    o.append(_f05_tx(q.X(148), q.Y(0.44) + 15, "面積 e^{−sL} Y(s) = %.1f" % (F1 * math.exp(-s_ * L)), "end", 9.5, TEA, True, halo=True))
    return SVG(700, 270, o, "時間のずれの公式（温度の板にヒータの電力 40 W を加えたときの上がり幅、むだ時間 L = 20 s）。(a) 読みは、上がり幅の曲線を L だけ右へずらしたもの。(b) 重み e<sup>−st</sup> を掛けると、ずらした曲線（青緑）は、元の曲線（青）を L だけずらし（破線）、高さを e<sup>−sL</sup> 倍したものになる。面積も e<sup>−sL</sup> 倍になるので、変換は e<sup>−Ls</sup> を掛けたものになる。")
F["e05_shift"] = _f05_shift_fig()


# =====================================================================
# 4 節: 部分分数分解の手順（モータのステップ応答）
# =====================================================================
def _f05_hide(x, y, pre, mid, post, sz=10.5, c=INK):
    """式 pre+mid+post を書き、mid の上に灰色の札を重ねる（隠す方法の図）。"""
    w0 = _f05_tw(pre, sz); w1 = _f05_tw(mid, sz)
    o = [_f05_tx(x, y, pre + mid + post, "start", sz, c, True)]
    o.append(RECT(x + w0 - 1.5, y - sz * 0.9, w1 + 3, sz * 1.25, 3, MUT, "none", 0, op=0.55))
    return "".join(o), x + _f05_tw(pre + mid + post, sz)


def _f05_pf_steps_fig():
    o = []
    bx, bw = 12, 408
    steps = [
        ("① 変換する（3 節の式、y(0) = 0）", ["T{sY(s) − y(0)} + Y(s) = K × 12/s"], 46),
        ("② Y(s) について解く", ["Y(s) = 600/(s(0.05s + 1)) = 12000/(s(s + 20))"], 46),
        ("③ 部分分数に分ける", ["12000/(s(s + 20)) = A_1/s + A_2/(s + 20)"], 96),
        ("④ 表を逆に引く", ["1/s → 1、1/(s + 20) → e^{−20t}"], 64),
    ]
    y = 12
    for k, (ttl, lines, h) in enumerate(steps):
        o.append(RECT(bx, y, bw, h, 6, PAN, SIG if k == 2 else LIN, 1.3))
        o.append(T(bx + 10, y + 17, ttl, "start", 10.5, INK, True))
        for i, ln in enumerate(lines):
            o.append(_f05_tx(bx + 22, y + 36 + i * 18, ln, "start", 10.5, INK))
        if k == 2:
            s1, xe = _f05_hide(bx + 22, y + 58, "A_1 = 12000/(", "s", "(s + 20))", 10)
            o.append(s1)
            o.append(_f05_tx(xe + 6, y + 58, "で s = 0 → 12000/20 = 600", "start", 10, GLD, True))
            s2, xe = _f05_hide(bx + 22, y + 80, "A_2 = 12000/(s", "(s + 20)", ")", 10)
            o.append(s2)
            o.append(_f05_tx(xe + 6, y + 80, "で s = −20 → 12000/(−20) = −600", "start", 10, PUR, True))
        if k == 3:
            o.append(_f05_tx(bx + 22, y + 54, "y(t) = 600 − 600e^{−20t} = 600(1 − e^{−t/0.05}) rad/s", "start", 10.5, SIG, True))
        if k < 3:
            o.append(ARR(bx + bw / 2, y + h, bx + bw / 2, y + h + 12, c=INK, lw=1.4, head=6))
        y += h + 12
    ytot = y
    o.append(T(bx + 8, ytot + 6, "灰色の札: 掛けた因数（その根の因数）を隠し、残りに根を入れる", "start", 9.5, MUT))
    # 右: 項と和
    p = Plot(478, 26, 204, 230, (0, 0.25), (-650, 650))
    o.append(T(p.x - 40, 16, "④ の各項と和", "start", 10.5, INK, True))
    o.append(p.axes(xl="時間 t [s]", yl="角速度 [rad/s]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25], yt=[-600, -300, 0, 300, 600], xfmt=_f05_fmt))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    ts = _f05_np.linspace(0, 0.25, 251)
    o.append(p.line([(0, 600), (0.25, 600)], c=GLD, lw=1.8, dash="6 3"))
    o.append(p.line([(t, -600 * math.exp(-20 * t)) for t in ts], c=PUR, lw=1.8, dash="6 3"))
    o.append(p.line([(t, 600 * (1 - math.exp(-20 * t))) for t in ts], c=SIG, lw=2.6))
    for t0, v in ((0.05, 379.3), (0.1, 518.8), (0.15, 570.1)):
        o.append(CIRC(p.X(t0), p.Y(v), 4, c=INK, lw=1.4, fill=SCR))
    o.append(_f05_tx(p.X(0.245), p.Y(600) - 6, "600（根 0 の項）", "end", 9.5, GLD, True, halo=True))
    o.append(_f05_tx(p.X(0.245), p.Y(-250), "−600e^{−20t}（根 −20 の項）", "end", 9.5, PUR, True, halo=True))
    o.append(_f05_tx(p.X(0.245), p.Y(300), "和 y(t)", "end", 10, SIG, True, halo=True))
    o.append(T(p.X(0.245), p.Y(150), "○: 3 章 2 節の表の値", "end", 9.5, INK, halo=True))
    return SVG(700, max(ytot + 14, 300), o, "部分分数分解で微分方程式を解く手順（止まっているモータ、T = 0.05 s、K = 50 (rad/s)/V に 12 V を加える）。① 微分方程式を変換し、② Y(s) について代数で解き、③ 簡単な分数の和に分け、④ 表を逆に引く。③ の係数（留数）は、その根の因数を隠し、残りの式に根を入れて求める。右は ④ の 2 つの項と、その和。○ は 3 章 2 節で微分方程式を直接解いて求めた値。")
F["e05_pf_steps"] = _f05_pf_steps_fig()


# =====================================================================
# 4 節: 重根・共役な根・初期値の 3 つの例
# =====================================================================
def _f05_pf_cases_fig():
    o = []
    cols = [
        dict(t="(a) ランプ応答（重根）", Y="Y(s) = 24000/(s^2(s + 20))", xr=(-24, 4), yr=(-8, 8),
             roots=[(0j, GLD, 2), (-20 + 0j, PUR, 1)], terms=["1200t − 60（根 0 から）", "60e^{−20t}（根 −20 から）"],
             tr=(0, 0.5), yr2=(-120, 650), yt=[0, 200, 400, 600], xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yl="[rad/s]"),
        dict(t="(b) 台車のステップ応答（共役な根）", Y="Y(s) = 1/(s(s^2 + 2s + 25)) [m]", xr=(-3, 1), yr=(-6.5, 6.5),
             roots=[(0j, GLD, 1), (-1 + 4.899j, PUR, 1), (-1 - 4.899j, PUR, 1)], terms=["0.04（根 0 から）", "−0.04e^{−t}(cos 4.9t + 0.204 sin 4.9t)"],
             tr=(0, 5), yr2=(-6, 8), yt=[-4, 0, 4, 8], xt=[0, 1, 2, 3, 4, 5], yl="[cm]"),
        dict(t="(c) 台車を 4 cm 引いて離す（初期値）", Y="Y(s) = 0.04(s + 2)/(s^2 + 2s + 25) [m]", xr=(-3, 1), yr=(-6.5, 6.5),
             roots=[(-1 + 4.899j, PUR, 1), (-1 - 4.899j, PUR, 1)], terms=["0.04e^{−t}(cos 4.9t + 0.204 sin 4.9t)", "（根 −1 ± j4.9 の組だけ）"],
             tr=(0, 5), yr2=(-3, 5), yt=[-2, 0, 2, 4], xt=[0, 1, 2, 3, 4, 5], yl="[cm]"),
    ]
    cw = 230
    for k, cd in enumerate(cols):
        x0 = 8 + k * cw
        o.append(T(x0 + 4, 18, cd["t"], "start", 10.5, INK, True))
        o.append(_f05_tx(x0 + 4, 38, cd["Y"], "start", 9.5, INK))
        m, pm = _f05_mini(x0 + 40, 50, 170, 74, cd["xr"], cd["yr"], cd["roots"], axes_lab=True)
        o.append(m)
        o.append(T(x0 + 34, 92, "s 平面", "end", 9, MUT))
        for i, tt in enumerate(cd["terms"]):
            o.append(_f05_tx(x0 + 4, 144 + i * 15, tt, "start", 9, (GLD if i == 0 and k < 2 else PUR) if k < 2 else (PUR if i == 0 else MUT), True))
        p = Plot(x0 + 46, 180, 172, 120, cd["tr"], cd["yr2"])
        o.append(p.axes(xl="時間 t [s]", yl=cd["yl"], xt=cd["xt"], yt=cd["yt"], xfmt=_f05_fmt))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        ts = _f05_np.linspace(cd["tr"][0], cd["tr"][1], 301)
        if k == 0:
            o.append(_f05_pl(p, [(t, 1200 * t) for t in ts], GLD, 1.6, "6 3"))
            o.append(_f05_pl(p, [(t, -60.0) for t in ts], GLD, 1.4, "2 3"))
            o.append(_f05_pl(p, [(t, 60 * math.exp(-20 * t)) for t in ts], PUR, 1.6, "6 3"))
            o.append(_f05_pl(p, [(t, 1200 * t - 60 + 60 * math.exp(-20 * t)) for t in ts], SIG, 2.4))
            o.append(CIRC(p.X(0.5), p.Y(540), 4, c=INK, lw=1.4, fill=SCR))
            o.append(T(p.X(0.02), p.Y(560), "○: 0.5 s で 540", "start", 9, INK, True, halo=True))
        elif k == 1:
            o.append(_f05_pl(p, [(t, 4.0) for t in ts], GLD, 1.6, "6 3"))
            o.append(_f05_pl(p, [(t, -4 * math.exp(-t) * (math.cos(_F05_WD * t) + math.sin(_F05_WD * t) / _F05_WD)) for t in ts], PUR, 1.6, "6 3"))
            o.append(_f05_pl(p, [(t, 100 * float(_f05_cart_step(t))) for t in ts], SIG, 2.4))
            o.append(CIRC(p.X(0.641), p.Y(6.106), 4, c=INK, lw=1.4, fill=SCR))
            o.append(T(p.X(0.75), p.Y(6.6), "○: 0.64 s で 6.11", "start", 9, INK, True, halo=True))
        else:
            o.append(_f05_pl(p, [(t, 100 * float(_f05_cart_free(t))) for t in ts], SIG, 2.4))
            o.append(CIRC(p.X(0.641), p.Y(-2.106), 4, c=INK, lw=1.4, fill=SCR))
            o.append(T(p.X(1.25), p.Y(-2.3), "○: 0.64 s で −2.11", "start", 9, INK, True, halo=True))
    o.append(LEGL(54, 352, [(GLD, "6 3", "入力から来た根の項"), (PUR, "6 3", "特性根の項（自由な動き）"), (SIG, None, "和 y(t)")]))
    o.append(T(690, 352, "○: 3・4 章の値", "end", 9.5, INK))
    return SVG(700, 362, o, "部分分数分解の 3 つの例。上の小さな s 平面の × は Y(s) の分母の根（色は下の項の色）。(a) モータのランプ応答では根 0 が 2 つ重なり、1200t と −60 の 2 つの項になる。(b) 台車のステップ応答では、共役な根の組が減衰振動の項になる。(c) 引いて離した台車は、入力が無いので根 0 が無く、初期値が分子に入って、(b) と同じ形の揺れが残る。(b)(c) の式は m 単位、グラフは cm で描いた。○ は 3 章 3 節・4 章 2・3 節で微分方程式を直接解いた値。")
F["e05_pf_cases"] = _f05_pf_cases_fig()


# =====================================================================
# 5 節: 最終値の定理が使える場合と使えない場合
# =====================================================================
def _f05_motorpos_La(Kp, tend, n=6000):
    """L_a を含むモータの位置の比例制御（目標値 1 rad のステップ）の角度。3 階の式を 4 次のルンゲ・クッタ法で解く。"""
    La, Ra, Kt, J = 1e-3, 2.0, 0.02, 1e-5
    a3, a2, a1, a0 = La * J, Ra * J, Kt * Kt, Kp * Kt
    def f(t, x):
        return [x[1], x[2], (Kp * Kt * 1.0 - a2 * x[2] - a1 * x[1] - a0 * x[0]) / a3]
    return [(t, x[0]) for t, x in _f05_rk4(f, [0.0, 0.0, 0.0], 0.0, tend, n)]


def _f05_fvt_cases_fig():
    o = []
    La, Ra, Kt, J, Kp = 1e-3, 2.0, 0.02, 1e-5, 50.0
    rts_d = _f05_np.roots([La * J, Ra * J, Kt * Kt, Kp * Kt])
    panels = [
        dict(t="(a) モータのステップ応答", f="sY(s) = 12000/(s + 20) → 600 rad/s", ok=True,
             xr=(-24, 4), yr=(-8, 8), roots=[-20 + 0j], tr=(0, 0.25), yr2=(0, 750), yt=[0, 300, 600], xt=[0, 0.1, 0.2],
             fv=600.0, yl="[rad/s]", fn=lambda t: 600 * (1 - math.exp(-20 * t)), res="落ち着く値と一致"),
        dict(t="(b) 台車のステップ応答", f="sY(s) = 1/(s^2 + 2s + 25) → 0.04 m（4 cm）", ok=True,
             xr=(-3, 1), yr=(-6.5, 6.5), roots=[-1 + 4.899j, -1 - 4.899j], tr=(0, 5), yr2=(0, 7.5), yt=[0, 2, 4, 6], xt=[0, 1, 2, 3, 4, 5],
             fv=4.0, yl="[cm]", fn=lambda t: 100 * float(_f05_cart_step(t)), res="落ち着く値と一致"),
        dict(t="(c) sin 5t", f="sY(s) = 5s/(s^2 + 25) → 0", ok=False,
             xr=(-3, 1), yr=(-6.5, 6.5), roots=[5j, -5j], tr=(0, 5), yr2=(-1.3, 1.3), yt=[-1, 0, 1], xt=[0, 1, 2, 3, 4, 5],
             fv=0.0, yl="", fn=lambda t: math.sin(5 * t), res="揺れ続け、落ち着かない"),
        dict(t="(d) モータの位置の比例制御（K_P = 50 V/rad）", f="sY(s) → 1 rad", ok=False,
             xr=(-30, 10), yr=(-280, 280), roots=list(rts_d), tr=(0, 0.5), yr2=(-2.5, 4.5), yt=[-2, 0, 2, 4], xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5],
             fv=1.0, yl="[rad]", fn=None, res="振れ幅が増え続ける（不安定）"),
    ]
    pos = [(8, 10), (354, 10), (8, 200), (354, 200)]
    for (x0, y0), pd in zip(pos, panels):
        o.append(_f05_tx(x0 + 2, y0 + 12, pd["t"], "start", 10.5, INK, True))
        o.append(_f05_tx(x0 + 2, y0 + 30, pd["f"], "start", 9.5, GRN if pd["ok"] else ALI, True))
        rr = [(r, GRN if r.real < -1e-9 else ALI, 1) for r in pd["roots"]]
        m, pm = _f05_mini(x0 + 6, y0 + 44, 92, 100, pd["xr"], pd["yr"], rr, axes_lab=True)
        o.append(m)
        o.append(T(x0 + 52, y0 + 160, "sY(s) の分母の根", "middle", 9, MUT))
        p = Plot(x0 + 138, y0 + 44, 190, 100, pd["tr"], pd["yr2"])
        o.append(p.axes(xl="時間 t [s]", yl=None, xt=pd["xt"], yt=pd["yt"], xfmt=_f05_fmt, sz=9))
        if pd["yl"]:
            o.append(T(p.x + 4, p.y + 10, pd["yl"], "start", 9, MUT, halo=True))
        ts = _f05_np.linspace(pd["tr"][0], pd["tr"][1], 801)
        if pd["fn"] is None:
            pts = _f05_motorpos_La(Kp, pd["tr"][1], 8000)
        else:
            pts = [(t, pd["fn"](t)) for t in ts]
        o.append(W(p.X(pd["tr"][0]), p.Y(pd["fv"]), p.X(pd["tr"][1]), p.Y(pd["fv"]), c=GRN if pd["ok"] else ALI, lw=1.6, dash="6 3"))
        o.append(_f05_pl(p, pts, SIG, 1.6 if pd["fn"] is None else 2.2))
        o.append(T(p.x + p.w, y0 + 30, ("✓ " if pd["ok"] else "✗ ") + pd["res"], "end", 9.5, GRN if pd["ok"] else ALI, True))
    o.append(LEGL(40, 398, [(SIG, None, "y(t)"), (GRN, "6 3", "定理の値（正しい）"), (ALI, "6 3", "定理の値（誤り）")]))
    o.append(T(690, 398, "× の色: 緑は実部が負、赤は実部が 0 以上", "end", 9.5, MUT))
    return SVG(700, 408, o, "最終値の定理が使える場合と使えない場合。(a)(b) sY(s) の分母の根の実部がすべて負なら、定理の値は応答の落ち着く値と一致する。(c) sin 5t は根 ±j5 の実部が 0 で、応答は揺れ続けるが、定理は 0 を返す。(d) L<sub>a</sub> を含むモータの位置の比例制御（目標値 1 rad、K<sub>P</sub> = 50 V/rad）は、根 2.46 ± j223 の実部が正で、振れ幅が増え続けるが、定理は 1 rad を返す（根 −2005 は左の枠の外）。")
F["e05_fvt_cases"] = _f05_fvt_cases_fig()


# =====================================================================
# 5 節: sY(s) は、時刻 1/s のあたりの y(t) の重み付きの平均
# =====================================================================
def _f05_svst_fig():
    o = []
    y = lambda t: 600 * (1 - math.exp(-20 * t))
    sv = [(100.0, TEA), (20.0, PUR), (5.0, GLD)]
    o.append(_f05_tx(14, 18, "(a) sY(s) = y(t) を重み se^{−st} で平均した値", "start", 11.5, INK, True))
    p = Plot(60, 34, 290, 150, (0, 0.4), (0, 700))
    o.append(p.axes(xl=None, yl="[rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 200, 400, 600], xfmt=lambda v: ""))
    ts = _f05_np.linspace(0, 0.4, 401)
    o.append(p.line([(t, y(t)) for t in ts], c=SIG, lw=2.4))
    o.append(_f05_tx(p.X(0.39), p.Y(650), "y(t) = 600(1 − e^{−20t})", "end", 9.5, SIG, True, halo=True))
    for s_, c in sv:
        v = 12000 / (s_ + 20); tm = 1 / s_
        o.append(W(p.X(max(0, tm - 0.5 / s_)), p.Y(v), p.X(tm + 0.8 / s_), p.Y(v), c=c, lw=2.2))
        o.append(D(p.X(tm), p.Y(v), c, 4))
        if s_ < 10:
            o.append(_f05_tx(p.X(tm + 0.15 / s_), p.Y(v) + 18, "s = %g: sY = %g" % (s_, round(v)), "middle", 9.5, c, True, halo=True))
        else:
            o.append(_f05_tx(p.X(tm + 0.8 / s_) + 5, p.Y(v) + 4, "s = %g: sY = %g" % (s_, round(v)), "start", 9.5, c, True, halo=True))
    q = Plot(60, 210, 290, 52, (0, 0.4), (0, 1.1))
    o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 1], xfmt=_f05_fmt))
    for s_, c in sv:
        o.append(_f05_fill(q, [(t, math.exp(-s_ * t)) for t in ts], c, op=0.4))
        o.append(q.line([(t, math.exp(-s_ * t)) for t in ts], c=c, lw=1.6))
    o.append(_f05_tx(q.x + q.w, q.y + 10, "重み se^{−st}（高さをそろえて描いた）", "end", 9, MUT, halo=True))
    # (b) 対数の時間軸で比べる
    xb = 430
    o.append(_f05_tx(xb - 30, 18, "(b) 横軸を対数にして、t と 1/s を重ねる", "start", 11.5, INK, True))
    r = Plot(xb, 34, 250, 224, (1e-3, 1.0), (0, 700), xlog=True)
    o.append(r.axes(xl="時間 t [s]（sY は s = 1/t の値）", yl=None, xt=[1e-3, 1e-2, 1e-1, 1.0], yt=[0, 200, 400, 600], xfmt=lambda v: {1e-3: "0.001", 1e-2: "0.01", 1e-1: "0.1", 1.0: "1"}.get(v, "")))
    lt = _f05_np.logspace(-3, 0, 301)
    o.append(r.line([(t, y(t)) for t in lt], c=SIG, lw=2.4))
    o.append(r.line([(t, 12000 / (1 / t + 20)) for t in lt], c=GLD, lw=2.0, dash="6 3"))
    o.append(_f05_tx(r.X(0.0012), r.Y(620), "右端: 600（最終値の定理）", "start", 9.5, INK, True, halo=True))
    o.append(T(r.X(0.0012), r.Y(620) + 14, "s → 0 は t → ∞ の側", "start", 9, MUT, halo=True))
    o.append(_f05_tx(r.X(0.0012), r.Y(420), "左端: 0 = y(0^+)（初期値の定理）", "start", 9.5, INK, True, halo=True))
    o.append(T(r.X(0.0012), r.Y(420) + 14, "s → ∞ は t → 0 の側", "start", 9, MUT, halo=True))
    o.append(LEGL(xb - 30, 300, [(SIG, None, "y(t)"), (GLD, "6 3", "sY(s)（s = 1/t）")]))
    return SVG(700, 310, o, "sY(s) の意味（モータのステップ応答、s は正の実数）。(a) 重み se<sup>−st</sup> の面積は 1 なので、sY(s) は y(t) を時刻 1/s のあたりで重みを付けて平均した値である（点は時刻 1/s）。s が小さいほど遠い未来まで平均する。(b) 両端は一致する: s → 0 では長い時間の平均、つまり落ち着く値 600 rad/s に、s → ∞ では時刻 0 の直後の値 0 に近づく。途中の形は少し違う。")
F["e05_svst"] = _f05_svst_fig()


# =====================================================================
# 6 節: 畳み込み（台車の速度、三角の力）
# =====================================================================
def _f05_tri(t):
    """0〜1 s で 0 → 2 N、1〜2 s で 2 → 0 N の力。"""
    if t < 0 or t >= 2:
        return 0.0
    return 2 * t if t < 1 else 2 * (2 - t)


def _f05_conv_exact(tend=4.0, n=4000):
    """台車の速度（T = 0.5 s、K = 0.5）を三角の力で押したときの速度。4 次のルンゲ・クッタ法。"""
    return [(t, x[0]) for t, x in _f05_rk4(lambda t, x: [(0.5 * _f05_tri(t) - x[0]) / 0.5], [0.0], 0.0, tend, n)]


def _f05_strips(w, t):
    """幅 w の帯（中ほどの時刻のインパルス）の応答の和。"""
    v = 0.0
    k = 0
    while k * w < 2 - 1e-12:
        m = k * w + w / 2
        if m <= t:
            v += _f05_tri(m) * w * math.exp(-2 * (t - m))
        k += 1
    return v


def _f05_conv_sum_fig():
    o = []
    w = 0.25
    cols = [TEA, PUR]
    ex = _f05_conv_exact()
    o.append(T(14, 18, "(a) 入力（押す力）を幅 0.25 s の帯に分ける", "start", 11, INK, True))
    p = Plot(60, 30, 440, 64, (0, 4), (0, 2.3))
    o.append(p.axes(xl=None, yl="力 [N]", xt=[0, 1, 2, 3, 4], yt=[0, 1, 2], xfmt=lambda v: ""))
    for k in range(8):
        m = k * w + w / 2
        o.append(RECT(p.X(k * w), p.Y(_f05_tri(m)), p.X(w) - p.X(0), p.Y(0) - p.Y(_f05_tri(m)), 0, soft(cols[k % 2]), cols[k % 2], 1.0))
    o.append(p.line([(t, _f05_tri(t)) for t in _f05_np.linspace(0, 4, 401)], c=GLD, lw=2.0))
    o.append(_f05_tx(p.X(2.1), p.Y(1.5), "帯 1 本 = 面積 u(τ_k)Δτ のパルス", "start", 9.5, INK, halo=True))
    o.append(T(14, 128, "(b) 帯ごとの応答（インパルス応答を面積の倍にして遅らせたもの）", "start", 11, INK, True))
    q = Plot(60, 140, 440, 70, (0, 4), (0, 0.5))
    o.append(q.axes(xl=None, yl="[m/s]", xt=[0, 1, 2, 3, 4], yt=[0, 0.2, 0.4], xfmt=lambda v: "", yfmt=_f05_fmt))
    ts = _f05_np.linspace(0, 4, 801)
    for k in range(8):
        m = k * w + w / 2; a = _f05_tri(m) * w
        o.append(q.line([(m, 0)] + [(t, a * math.exp(-2 * (t - m))) for t in ts if t >= m], c=cols[k % 2], lw=1.4))
    o.append(T(14, 244, "(c) 帯の応答の和と、微分方程式を数値で解いた応答", "start", 11, INK, True))
    r = Plot(60, 256, 440, 100, (0, 4), (0, 0.75))
    o.append(r.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 1, 2, 3, 4], yt=[0, 0.25, 0.5, 0.75], xfmt=_f05_fmt, yfmt=_f05_fmt))
    o.append(r.line([(t, _f05_strips(w, t)) for t in _f05_np.linspace(0, 4, 1601)], c=SIG, lw=2.0))
    o.append(r.line(ex[::10], c=INK, lw=1.4, dash="5 3"))
    o.append(W(r.X(1.5), r.y, r.X(1.5), r.y + r.h, c=ALI, lw=1, dash="3 3"))
    # 右: 1.5 s の値
    xr = 524
    o.append(T(xr, 270, "1.5 s の速度", "start", 10.5, INK, True))
    rows = [("帯の幅 0.5 s", _f05_strips(0.5, 1.5), MUT), ("帯の幅 0.25 s", _f05_strips(0.25, 1.5), SIG), ("帯の幅 0.1 s", _f05_strips(0.1, 1.5), MUT),
            ("数値で解いた値", dict(ex)[1.5] if 1.5 in dict(ex) else min(ex, key=lambda q_: abs(q_[0] - 1.5))[1], INK)]
    for i, (nm, v, c) in enumerate(rows):
        o.append(T(xr, 292 + i * 17, nm, "start", 9.5, c, i == 1))
        o.append(T(xr + 160, 292 + i * 17, "%.3f m/s" % v, "end", 9.5, c, True))
    o.append(T(xr, 366, "帯を細くすると近づく", "start", 9.5, GRN, True))
    o.append(_f05_tx(xr, 160, "g(t) = (K/T)e^{−t/T} = e^{−2t}", "start", 9.5, PUR, True))
    o.append(T(xr, 176, "（台車の速度のインパルス応答）", "start", 9, MUT))
    return SVG(700, 398, o, "入力を細い帯（パルス）に分けて応答を足し合わせる（ばねの無い台車の速度、T = 0.5 s、K = 0.5 (m/s)/N。1 s かけて 0 から 2 N に上げ、次の 1 s で 0 に戻す力）。(a) 帯 1 本は、面積 u(τ<sub>k</sub>)Δτ の短いパルスとみなせる（τ<sub>k</sub> は帯の中ほどの時刻）。(b) 各帯の応答は、インパルス応答を面積の倍にして τ<sub>k</sub> だけ遅らせたもの。(c) その和（青）は、帯を細くするほど、微分方程式を数値で解いた応答（破線）に近づく。")
F["e05_conv_sum"] = _f05_conv_sum_fig()


def _f05_conv_flip_fig():
    o = []
    ex = dict((round(t, 6), v) for t, v in _f05_conv_exact(4.0, 4000))
    yv = lambda t: ex[round(round(t / 0.001) * 0.001, 6)]
    tsel = [(0.6, TEA), (1.5, SIG), (2.4, PUR)]
    cw = 228
    for k, (t0, cc) in enumerate(tsel):
        x0 = 10 + k * cw
        o.append(_f05_tx(x0 + 4, 18, "t = %g s" % t0, "start", 11, INK, True))
        p = Plot(x0 + 30, 30, cw - 50, 110, (0, 3), (0, 2.2))
        o.append(p.axes(xl="τ [s]（何秒前か）", yl=None, xt=[0, 1, 2, 3], yt=[0, 1, 2], xfmt=_f05_fmt, sz=9))
        tau = _f05_np.linspace(0, 3, 601)
        prod = [(a, math.exp(-2 * a) * _f05_tri(t0 - a)) for a in tau if a <= t0]
        o.append(_f05_fill(p, prod + [(t0, 0)], SIG, op=0.9))
        o.append(p.line([(a, math.exp(-2 * a)) for a in tau], c=PUR, lw=1.8))
        o.append(_f05_pl(p, [(a, _f05_tri(t0 - a)) for a in tau], GLD, 1.8, "5 3"))
        o.append(p.line(prod, c=SIG, lw=2.0))
        o.append(T(p.x + p.w, p.y + 12, "面積 = %.3f m/s" % yv(t0), "end", 9.5, SIG, True, halo=True))
    o.append(_f05_legl(40, 190, [(PUR, None, "g(τ) = e^{−2τ}（覚えている重み）"), (GLD, "5 3", "u(t − τ)（τ 秒前の力）"), (SIG, None, "積（面積が y(t)）")]))
    q = Plot(70, 214, 440, 96, (0, 4), (0, 0.75))
    o.append(T(14, 206, "y(t)", "start", 10.5, INK, True))
    o.append(q.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 1, 2, 3, 4], yt=[0, 0.25, 0.5, 0.75], xfmt=_f05_fmt, yfmt=_f05_fmt))
    o.append(q.line([(t, v) for t, v in sorted(ex.items())][::10], c=SIG, lw=2.2))
    for t0, cc in tsel:
        o.append(D(q.X(t0), q.Y(yv(t0)), cc, 4.4))
        o.append(T(q.X(t0) + 6, q.Y(yv(t0)) - 6, "%.3f" % yv(t0), "start", 9.5, cc, True, halo=True))
    o.append(T(530, 240, "時刻 t が進むと、", "start", 9.5, INK))
    o.append(T(530, 256, "裏返した入力（金）が", "start", 9.5, INK))
    o.append(T(530, 272, "右へずれ、重なる所の", "start", 9.5, INK))
    o.append(T(530, 288, "積の面積が出力になる", "start", 9.5, INK))
    return SVG(700, 352, o, "畳み込みを「裏返してずらす」見方で計算する（前の図と同じ台車と力）。横軸 τ は「何秒前か」。τ 秒前の力 u(t − τ)（入力を裏返して t だけずらしたもの）に、重み g(τ) を掛けた積（青）の面積が、時刻 t の速度 y(t) である。台車の速度は、0.5 s 前の入力を 0.37 倍、1 s 前の入力を 0.14 倍の重みで覚えている。")
F["e05_conv_flip"] = _f05_conv_flip_fig()


def _f05_conv_region_fig():
    o = []
    o.append(T(14, 18, "(a) 積分する範囲（0 ≤ τ ≤ t）と、順序の入れ替え", "start", 11, INK, True))
    p = Plot(56, 34, 240, 220, (0, 3), (0, 3))
    o.append(p.axes(xl="τ", yl="t", xt=[0, 1, 2, 3], yt=[0, 1, 2, 3], xfmt=_f05_fmt))
    o.append(PL([(p.X(0), p.Y(0)), (p.X(3), p.Y(3)), (p.X(0), p.Y(3))], c="none", lw=0, fill=SSOFT, op=0.8))
    o.append(W(p.X(0), p.Y(0), p.X(3), p.Y(3), c=SIG, lw=1.6))
    o.append(T(p.X(2.25), p.Y(2.05), "t = τ", "start", 9.5, SIG, True, halo=True))
    o.append(RECT(p.X(0), p.Y(2.48), p.X(2.4) - p.X(0), p.Y(2.32) - p.Y(2.48), 0, GOSOFT, GLD, 1.2))
    o.append(ARR(p.X(0.05), p.Y(2.4), p.X(2.35), p.Y(2.4), c=GLD, lw=1.6, head=6))
    o.append(RECT(p.X(0.92), p.Y(3.0), p.X(1.08) - p.X(0.92), p.Y(1.0) - p.Y(3.0), 0, PSOFT, PUR, 1.2))
    o.append(ARR(p.X(1.0), p.Y(1.05), p.X(1.0), p.Y(2.95), c=PUR, lw=1.6, head=6))
    o.append(T(p.X(0.42), p.Y(1.6), "範囲（青）", "middle", 9.5, SIG, True, halo=True))
    for i, (txt, c, bb) in enumerate((("金の帯（元の順）", GLD, True), ("t を決め、τ を 0〜t で積分", GLD, False),
                                       ("紫の帯（入れ替えた順）", PUR, True), ("τ を決め、t を τ〜∞ で積分", PUR, False))):
        o.append(T(p.X(1.5), p.Y(1.0) + i * 15 + (6 if i >= 2 else 0), txt, "start", 9.5, c, bb, halo=True))
    o.append(T(p.X(2.95), p.Y(0.08), "範囲の外", "end", 9, MUT))
    # (b) 3 つの表し方
    xb = 340
    o.append(T(xb, 18, "(b) 同じ対象の 3 つの表し方（一次遅れ）", "start", 11, INK, True))
    def box(x, y, w, h, t1, t2, c):
        return RECT(x, y, w, h, 7, PAN, c, 1.4) + T(x + w / 2, y + 18, t1, "middle", 10, INK, True) + _f05_tx(x + w / 2, y + 36, t2, "middle", 10, c, True)
    o.append(box(xb + 92, 36, 170, 46, "微分方程式", "T ẏ + y = Ku", INK))
    o.append(box(xb + 4, 170, 160, 46, "インパルス応答", "g(t) = (K/T)e^{−t/T}", PUR))
    o.append(box(xb + 190, 170, 154, 46, "インパルス応答の変換", "G(s) = K/(Ts + 1)", SIG))
    o.append(ARR(xb + 130, 82, xb + 90, 168, c=INK, lw=1.5))
    o.append(T(xb + 104, 118, "u = δ(t) の", "end", 9.5, INK))
    o.append(T(xb + 104, 132, "応答（3 章）", "end", 9.5, INK))
    o.append(ARR(xb + 226, 82, xb + 262, 168, c=INK, lw=1.5))
    o.append(T(xb + 252, 112, "変換して U(s) に", "start", 9.5, INK))
    o.append(T(xb + 252, 126, "掛かる式（3 節）", "start", 9.5, INK))
    o.append(ARR(xb + 164, 193, xb + 188, 193, c=INK, lw=1.5, head=6))
    o.append(T(xb + 176, 232, "変換（6 節）", "middle", 9.5, INK))
    o.append(RECT(xb + 4, 248, 340, 38, 7, SSOFT, SIG, 1.2))
    o.append(_f05_tx(xb + 174, 272, "応答: y(t) = (g * u)(t)　⇔　Y(s) = G(s)U(s)", "middle", 10.5, INK, True))
    return SVG(700, 298, o, "(a) 畳み込みの変換は、0 ≤ τ ≤ t の範囲（青）の 2 重の積分である。元の順（金: t を決めて τ で積分）を、入れ替えた順（紫: τ を決めて t で積分）にすると、内側が時間のずれの公式の形になる。(b) 微分方程式、インパルス応答、その変換 G(s) は、同じ対象の 3 つの表し方である。初期値 0 の応答は、時間の世界では畳み込み、s の世界では掛け算で求まる。")
F["e05_conv_region"] = _f05_conv_region_fig()
