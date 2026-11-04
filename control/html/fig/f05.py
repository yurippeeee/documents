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
    """'e^{−20t}' や 'A_1' を [(文字, 種類)] に分ける。種類は 0 = 普通、-1 = 添字、1 = 上付き。"""
    out, buf, i = [], "", 0
    while i < len(s):
        ch = s[i]
        if ch in "_^" and i + 1 < len(s):
            if buf:
                out.append((buf, 0)); buf = ""
            kind = -1 if ch == "_" else 1
            if s[i + 1] == "{":
                j = s.index("}", i + 2)
                out.append((s[i + 2:j], kind)); i = j + 1
            else:
                out.append((s[i + 1], kind)); i += 2
            continue
        buf += ch; i += 1
    if buf:
        out.append((buf, 0))
    return out


def _f05_tw(s, sz=10.5):
    """_f05_tx で書く文字の幅。"""
    return sum(tw(t, sz if k == 0 else sz * 0.72) for t, k in _f05_parse(s))


def _f05_tx(x, y, s, a="start", sz=10.5, c=INK, b=False, halo=False):
    """添字（_x、_{xy}）と上付き（^x、^{xy}）を書ける文字。例 'e^{−20t}'、'A_1 = 600'、'Y(s)'。"""
    segs = _f05_parse(s)
    ssz = round(sz * 0.72, 2)
    w = sum(tw(t, sz if k == 0 else ssz) for t, k in segs)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    up = sz * 0.3 if any(k == 1 for _, k in segs) else 0
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82 - up, x0 + w, y + sz * 0.22 + (2 if any(k == -1 for _, k in segs) else 0), s))
    hs = (' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR) if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hs)]
    cur = 0.0
    for t, k in segs:
        off = {0: 0.0, -1: sz * 0.28, 1: -sz * 0.42}[k]
        dy = off - cur
        o.append('<tspan%s%s>%s</tspan>' % ((' dy="%g"' % round(dy, 2)) if abs(dy) > 1e-9 else "",
                                            (' font-size="%g"' % ssz) if k else "", E(t)))
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
                o.append(T(p.X(re) + 7, p.Y(im) - 5, "×%d" % m, "start", 8.5, c, True, halo=True))
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
    o.append(T(p.X(0.12), p.Y(0.24), "傾き −2 × 1 = −2", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(0.6), p.Y(0.55), "−2 × 0.368 = −0.736", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(1.05), p.Y(0.30), "−2 × 0.135 = −0.271", "start", 9.5, SIG, halo=True))
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
    o.append(T(229, 224, "部分分数分解（4 節）", "middle", 9.5, INK, True))
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
