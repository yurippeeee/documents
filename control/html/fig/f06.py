# -*- coding: utf-8 -*-
# 06 章 伝達関数と極・零点 の図
import numpy as _f06_np
from scipy import signal as _f06_sig


# =====================================================================
# 補助
# =====================================================================
def _f06_tw(s, sz):
    """文字の幅（結合文字は 0、ギリシャ文字・記号は半角程度）。"""
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
        elif o in (0x2212, 0xB1, 0xD7, 0xF7, 0x221A, 0x2248, 0x2264, 0x2265, 0xB7, 0xB0, 0x2032, 0x221E, 0x2220):
            w += sz * 0.62
        else:
            w += sz * 1.0
    return w


def _f06_m(x, y, parts, a="start", sz=12, c=INK, b=False, halo=True):
    """式の文字。parts = [(文字, 添字, 斜体か, 色, 上付き, 上の点の数), ...]（後ろは省略してよい）。"""
    w = 0.0
    for p in parts:
        w += _f06_tw(p[0], sz)
        if len(p) > 1 and p[1]:
            w += _f06_tw(p[1], sz * 0.72)
        if len(p) > 4 and p[4]:
            w += _f06_tw(p[4], sz * 0.72)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + ((p[1] or "") if len(p) > 1 else "") for p in parts)))
    hl = (' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' % SCR) if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hl)]
    cur = 0
    ssz = round(sz * 0.72, 2)
    xx = x0
    dots = []
    for p in parts:
        s_ = p[0]
        sub = p[1] if len(p) > 1 else None
        it = p[2] if len(p) > 2 else False
        col = (' fill="%s"' % p[3]) if len(p) > 3 and p[3] else ""
        sup = p[4] if len(p) > 4 else None
        nd = p[5] if len(p) > 5 else 0
        o.append('<tspan font-style="%s"%s%s>%s</tspan>' % ("italic" if it else "normal", col, (' dy="%g"' % (-cur)) if cur else "", E(s_)))
        wb = _f06_tw(s_, sz)
        if nd:
            xc = xx + wb / 2 + (sz * 0.08 if it else 0)
            for k in range(nd):
                dots.append((xc + (k - (nd - 1) / 2) * sz * 0.26, y - sz * 0.86, (p[3] if len(p) > 3 and p[3] else c)))
        xx += wb
        cur = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g"%s>%s</tspan>' % (ssz, col, E(sub)))
            cur = 3
            xx += _f06_tw(sub, sz * 0.72)
        if sup:
            o.append('<tspan dy="%g" font-size="%g"%s>%s</tspan>' % (-5 - cur, ssz, col, E(sup)))
            cur = -5
            xx += _f06_tw(sup, sz * 0.72)
    o.append("</text>")
    for dx, dy, dc in dots:
        o.append('<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (round(dx, 2), round(dy, 2), round(max(1.0, sz * 0.085), 2), dc))
    return "".join(o)


def _f06_mw(parts, sz):
    """_f06_m の文字列の幅。"""
    w = 0.0
    for p in parts:
        w += _f06_tw(p[0], sz)
        if len(p) > 1 and p[1]:
            w += _f06_tw(p[1], sz * 0.72)
        if len(p) > 4 and p[4]:
            w += _f06_tw(p[4], sz * 0.72)
    return w


def _f06_v(s, sub=None, c=None, sup=None, dots=0):
    """斜体の記号。"""
    return (s, sub, True, c, sup, dots)


def _f06_g(s, sub=None, c=None, sup=None, dots=0):
    """立体の記号（ギリシャ文字など）。"""
    return (s, sub, False, c, sup, dots)


def _f06_t(s, c=None):
    """立体の文字。"""
    return (s, None, False, c)


def _f06_e(sup, c=None):
    """e の右肩に sup を書く。"""
    return ("e", None, True, c, sup)


def _f06_frac(x, y, num, den, sz=12, c=INK, b=False, lc=None):
    """分数（x は中心、y は横線の高さ）。num・den は _f06_m の parts。返り値 (svg, 幅)。"""
    wn, wd = _f06_mw(num, sz), _f06_mw(den, sz)
    w = max(wn, wd) + 6
    o = [_f06_m(x, y - 5, num, "middle", sz, c, b, False),
         W(x - w / 2, y, x + w / 2, y, c=lc or c, lw=1.1),
         _f06_m(x, y + sz + 2, den, "middle", sz, c, b, False)]
    return "".join(o), w


def _f06_step(num, den, t):
    _, y = _f06_sig.step((num, den), T=t)
    return y


def _f06_imp(num, den, t):
    _, y = _f06_sig.impulse((num, den), T=t)
    return y


def _f06_lsim(num, den, u, t):
    _, y, _ = _f06_sig.lsim((num, den), u, t)
    return y


def _f06_sp(p, xt, yt, xl="実部 σ [1/s]", yl="虚部 ω [rad/s]", sz=9.5, rhp=True, frame=True, fmt=None):
    """s 平面の地（枠・目盛・右半平面の薄い赤・軸）。"""
    o = []
    if frame:
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(SPLANE(p, rhp=rhp))
    f = fmt or (lambda v: ("%g" % v).replace("-", "−"))
    o.append(p.axes(xl=xl, yl=yl, xt=xt, yt=yt, xfmt=f, yfmt=f, sz=sz))
    o.append(SPLANE(p, rhp=False))
    return "".join(o)


def _f06_fmt(v, d=3):
    s = ("%." + str(d) + "g") % v
    return s.replace("-", "−")


def _f06_cart(x, y, w, h, c=SIG):
    """台車（車輪付きの箱）。(x, y) は左上。"""
    return (RECT(x, y, w, h, 4, soft(c), c, 1.5) + CIRC(x + w * 0.25, y + h + 4, 4, c=c, lw=1.4, fill=SCR)
            + CIRC(x + w * 0.75, y + h + 4, 4, c=c, lw=1.4, fill=SCR))


def _f06_spring(x1, x2, y, n=7, amp=6, c=TEA, lw=1.5):
    lead = min(10, (x2 - x1) * 0.15)
    xs, xe = x1 + lead, x2 - lead
    pts = [(x1, y), (xs, y)]
    for i in range(2 * n):
        pts.append((xs + (xe - xs) * (i + 0.5) / (2 * n), y + (amp if i % 2 == 0 else -amp)))
    pts += [(xe, y), (x2, y)]
    return PL(pts, c=c, lw=lw)


def _f06_damper(x1, x2, y, c=PUR, lw=1.5):
    cy0 = x1 + 10
    cyl = max(26, min(40, (x2 - x1) * 0.5))
    px = max(cy0 + 6, min(cy0 + cyl - 4, x2 - 12))
    return (W(x1, y, cy0, y, c=c, lw=lw) + W(cy0, y - 7, cy0 + cyl, y - 7, c=c, lw=lw) + W(cy0, y + 7, cy0 + cyl, y + 7, c=c, lw=lw)
            + W(cy0, y - 7, cy0, y + 7, c=c, lw=lw) + W(px, y - 5, px, y + 5, c=c, lw=lw + 0.8) + W(px, y, x2, y, c=c, lw=lw))


def _f06_wall(x, y0, y1, c=MUT):
    o = [W(x, y0, x, y1, c=c, lw=1.8)]
    yy = y0 + 4
    while yy < y1:
        o.append(W(x, yy, x - 7, yy + 7, c=c, lw=1))
        yy += 9
    return "".join(o)


def _f06_ground(x0, x1, y, c=MUT):
    o = [W(x0, y, x1, y, c=c, lw=1.6)]
    xx = x0 + 4
    while xx < x1:
        o.append(W(xx, y, xx - 7, y + 7, c=c, lw=1))
        xx += 10
    return "".join(o)


# 例の値
_F06_T = _f06_np.linspace(0, 1, 2)


# =====================================================================
# 1 節: 伝達関数
# =====================================================================
def _f06_tf_def_fig():
    o = []
    o.append(_f06_m(14, 18, [_f06_t("(a) 微分方程式の微分を "), _f06_v("s"), _f06_t(" に置き換える（"), _f06_v("L", "a"), _f06_t(" を含む DC モータ。初期値は 0）")], "start", 11.5, INK, True, False))
    c2, c1, c0, cr = PUR, TEA, GLD, SIG
    sz = 14
    xA, xB, xC, xF, xE, xR = 150, 262, 362, 440, 500, 568
    y1, y2 = 56, 126
    # 微分方程式（列にそろえる）
    o.append(_f06_m(xA, y1, [_f06_v("L", "a", c2), _f06_v("J", None, c2), _f06_g("ω", "m", c2, None, 2)], "middle", sz, INK, False, False))
    o.append(T((xA + xB) / 2, y1, "+", "middle", sz, INK))
    o.append(_f06_m(xB, y1, [_f06_v("R", "a", c1), _f06_v("J", None, c1), _f06_g("ω", "m", c1, None, 1)], "middle", sz, INK, False, False))
    o.append(T((xB + xC) / 2, y1, "+", "middle", sz, INK))
    o.append(_f06_m(xC, y1, [_f06_v("K", "t", c0, "2"), _f06_g("ω", "m", c0)], "middle", sz, INK, False, False))
    o.append(T(xE, y1, "=", "middle", sz, INK))
    o.append(_f06_m(xR, y1, [_f06_v("K", "t", cr), _f06_v("v", None, cr)], "middle", sz, INK, False, False))
    # 置き換えた式
    o.append(T(xA - 38, y2, "(", "middle", sz + 2, INK))
    o.append(_f06_m(xA, y2, [_f06_v("L", "a", c2), _f06_v("J", None, c2), _f06_v("s", None, c2, "2")], "middle", sz, INK, False, False))
    o.append(T((xA + xB) / 2, y2, "+", "middle", sz, INK))
    o.append(_f06_m(xB, y2, [_f06_v("R", "a", c1), _f06_v("J", None, c1), _f06_v("s", None, c1)], "middle", sz, INK, False, False))
    o.append(T((xB + xC) / 2, y2, "+", "middle", sz, INK))
    o.append(_f06_m(xC, y2, [_f06_v("K", "t", c0, "2")], "middle", sz, INK, False, False))
    o.append(T(xC + 24, y2, ")", "middle", sz + 2, INK))
    o.append(_f06_m(xF, y2, [_f06_g("Ω", "m"), _f06_t("("), _f06_v("s"), _f06_t(")")], "middle", sz, INK, False, False))
    o.append(T(xE, y2, "=", "middle", sz, INK))
    o.append(_f06_m(xR, y2, [_f06_v("K", "t", cr), _f06_t(" "), _f06_v("V", None, cr), _f06_t("(", cr), _f06_v("s", None, cr), _f06_t(")", cr)], "middle", sz, INK, False, False))
    # 対応の矢印（まっすぐ下へ）
    for x, cc, lab in ((xA, c2, "2 回の微分 → s²"), (xB, c1, "1 回の微分 → s"), (xC, c0, "微分なし → 1"), (xR, cr, "入力も同じ")):
        o.append(ARR(x, y1 + 9, x, y2 - 19, c=cc, lw=1.5, head=6))
        o.append(T(x + 7, (y1 + y2) / 2 + 2, lab, "start", 9.5, cc, True, halo=True))
    # 伝達関数
    y3 = 184
    o.append(_f06_m(232, y3 + 5, [_f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(") = "), _f06_g("Ω", "m"), _f06_t("("), _f06_v("s"), _f06_t(") / "), _f06_v("V"), _f06_t("("), _f06_v("s"), _f06_t(")  =")], "end", 13, INK, False, False))
    s1, w1 = _f06_frac(316, y3, [_f06_v("K", "t", cr)], [_f06_v("L", "a", c2), _f06_v("J", None, c2), _f06_v("s", None, c2, "2"), _f06_t(" + "), _f06_v("R", "a", c1), _f06_v("J", None, c1), _f06_v("s", None, c1), _f06_t(" + "), _f06_v("K", "t", c0, "2")], 13)
    o.append(s1)
    o.append(T(316 + w1 / 2 + 12, y3 + 5, "=", "middle", 13, INK))
    s2, w2 = _f06_frac(316 + w1 / 2 + 92, y3, [_f06_t("2 × 10"), ("", None, False, None, "6")], [_f06_v("s", None, None, "2"), _f06_t(" + 2000"), _f06_v("s"), _f06_t(" + 40000")], 13)
    o.append(s2)
    o.append(T(316 + w1 / 2 + 92 + w2 / 2 + 8, y3 + 5, "（例の値）", "start", 10, MUT))
    o.append(T(14, y3 + 46, "分母は微分方程式の左辺から、分子は右辺から作る。どちらも係数だけで決まり、入力によらない。", "start", 10, MUT))
    # (b) ブロック線図
    yb = 264
    o.append(T(14, yb, "(b) ブロック線図の箱に伝達関数を書く", "start", 11.5, INK, True))
    bx, by, bw, bh = 96, yb + 18, 150, 50
    o.append(ARR(22, by + bh / 2, bx, by + bh / 2, c=GLD, lw=1.8))
    o.append(_f06_m(56, by + bh / 2 - 8, [_f06_v("V"), _f06_t("("), _f06_v("s"), _f06_t(")")], "middle", 11, GLD, True, True))
    o.append(RECT(bx, by, bw, bh, 6, PAN, SIG, 1.5))
    s3, _ = _f06_frac(bx + bw / 2, by + bh / 2 - 1, [_f06_t("2 × 10"), ("", None, False, None, "6")], [_f06_v("s", None, None, "2"), _f06_t(" + 2000"), _f06_v("s"), _f06_t(" + 40000")], 10.5)
    o.append(s3)
    o.append(ARR(bx + bw, by + bh / 2, bx + bw + 74, by + bh / 2, c=SIG, lw=1.8))
    o.append(_f06_m(bx + bw + 40, by + bh / 2 - 8, [_f06_g("Ω", "m"), _f06_t("("), _f06_v("s"), _f06_t(")")], "middle", 11, SIG, True, True))
    o.append(_f06_m(bx + bw / 2 + 30, by + bh + 26, [_f06_g("Ω", "m"), _f06_t("("), _f06_v("s"), _f06_t(") = "), _f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(")"), _f06_v("V"), _f06_t("("), _f06_v("s"), _f06_t(")")], "middle", 11, INK, False, False))
    # (c) 同じ G(s) に違う入力
    xc = 360
    o.append(_f06_m(xc, yb, [_f06_t("(c) 同じ "), _f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(") に違う入力を加える")], "start", 11.5, INK, True, False))
    t = _f06_np.linspace(0, 0.3, 1501)
    num, den = [2e6], [1, 2000, 40000]
    g = _f06_imp(num, den, t)
    ys = _f06_step(num, den, t)
    pa = Plot(xc + 40, yb + 34, 116, 70, (0, 0.3), (0, 1100))
    o.append(pa.axes(xl="時間 t [s]", yl=None, xt=[0, 0.1, 0.2, 0.3], yt=[0, 500, 1000], sz=9))
    o.append(T(pa.x - 34, pa.y + pa.h / 2, "角速度", "middle", 9, MUT, rot=-90))
    o.append(pa.line(list(zip(t, g)), c=SIG, lw=1.8))
    o.append(_f06_m(pa.x - 30, pa.y - 8, [_f06_t("インパルス "), _f06_v("V"), _f06_t(" = 1 → "), _f06_g("Ω", "m"), _f06_t(" = "), _f06_v("G")], "start", 9.5, INK, False, True))
    pb = Plot(xc + 200, yb + 34, 116, 70, (0, 0.3), (0, 60))
    o.append(pb.axes(xl="時間 t [s]", yl=None, xt=[0, 0.1, 0.2, 0.3], yt=[0, 25, 50], sz=9))
    o.append(pb.line([(0, 50), (0.3, 50)], c=MUT, lw=1, dash="4 3"))
    o.append(pb.line(list(zip(t, ys)), c=SIG, lw=1.8))
    o.append(_f06_m(pb.x - 22, pb.y - 8, [_f06_t("ステップ "), _f06_v("V"), _f06_t(" = 1/"), _f06_v("s"), _f06_t(" → "), _f06_g("Ω", "m"), _f06_t(" = "), _f06_v("G"), _f06_t("/"), _f06_v("s")], "start", 9.5, INK, False, True))
    o.append(T(xc, pa.y + pa.h + 50, "1 V·s のインパルスと 1 V のステップ（縦軸は rad/s）", "start", 9, MUT))
    return SVG(700, yb + 160, o, "伝達関数の作り方と使い方（L<sub>a</sub> を含む DC モータの電圧 v から角速度 ω<sub>m</sub> まで）。(a) 初期値を 0 としてラプラス変換すると、i 回の微分は s<sup>i</sup> を掛けることになり、微分方程式の左辺は分母の多項式に、右辺は分子の多項式になる。(b) ブロック線図の箱には伝達関数を書き、出る信号の変換は、入る信号の変換に伝達関数を掛けたものである。(c) 同じ伝達関数に、単位インパルスを入れるとインパルス応答が、単位ステップを入れるとステップ応答が出る（最終値 50 rad/s）。")
F["e06_tf_def"] = _f06_tf_def_fig()


def _f06_ic_fig():
    o = []
    # 台車の絵
    gx, gy = 30, 106
    o.append(T(14, 18, "台車を 2 cm 引いて静かに離すと同時に、一定の力で押し始める", "start", 11.5, INK, True))
    o.append(_f06_ground(gx - 6, gx + 270, gy))
    o.append(_f06_wall(gx, gy - 58, gy))
    x0 = gx + 110
    cx = x0 + 2 * 14
    o.append(W(x0, gy - 64, x0, gy + 12, c=MUT, lw=1, dash="3 3"))
    o.append(T(x0, gy + 24, "y = 0", "middle", 9.5, MUT))
    o.append(_f06_spring(gx, cx, gy - 38, 7, 5, TEA, 1.5))
    o.append(_f06_damper(gx, cx, gy - 18, PUR, 1.5))
    o.append(_f06_cart(cx, gy - 50, 60, 38, SIG))
    o.append(_f06_m(cx + 30, gy - 26, [_f06_v("m")], "middle", 11, SIG, True, False))
    o.append(ARR(cx + 60, gy - 31, cx + 102, gy - 31, c=GLD, lw=2.2, head=7))
    o.append(T(cx + 106, gy - 27, "1 N か 2 N", "start", 10, GLD, True))
    o.append(DIM(x0, gy - 62, cx, gy - 62, None, c=SIG))
    o.append(T((x0 + cx) / 2, gy - 68, "2 cm", "middle", 9.5, SIG, True))
    # 説明
    lx = 420
    o.append(LEGL(lx, 52, [(SIG, None, "実際の位置（合計）")]))
    o.append(LEGL(lx, 72, [(TEA, "6 4", "入力による部分（初期値 0）")]))
    o.append(LEGL(lx, 92, [(PUR, "2 3", "初期値による部分（入力 0）")]))
    # 応答
    t = _f06_np.linspace(0, 4, 4001)
    wd = math.sqrt(24)
    zs1 = 100 * _f06_step([1.0], [1, 2, 25], t)          # cm
    zi = 2.0 * _f06_np.exp(-t) * (_f06_np.cos(wd * t) + _f06_np.sin(wd * t) / wd)
    for k, (F_, lab) in enumerate(((1.0, "(a) 力 1 N"), (2.0, "(b) 力 2 N"))):
        px = 62 + k * 330
        p = Plot(px, 152, 270, 150, (0, 4), (-2, 13))
        o.append(T(px - 48, 140, lab, "start", 11.5, INK, True))
        o.append(p.axes(xl="時間 t [s]", yl="位置 y [cm]" if k == 0 else None, xt=[0, 1, 2, 3, 4], yt=[0, 4, 8, 12]))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        zs = F_ * zs1
        o.append(p.line(list(zip(t, zs)), c=TEA, lw=1.7, dash="6 4"))
        o.append(p.line(list(zip(t, zi)), c=PUR, lw=1.7, dash="2 3"))
        o.append(p.line(list(zip(t, zs + zi)), c=SIG, lw=2.3))
        i = int(_f06_np.argmax(zs))
        o.append(D(p.X(t[i]), p.Y(zs[i]), TEA, 3.2))
        o.append(T(p.X(t[i]) + 7, p.Y(zs[i]) - 3, "%.3g cm" % zs[i] if zs[i] < 10 else "%.1f cm" % zs[i], "start", 9.5, TEA, True, halo=True))
        j = int(_f06_np.argmax(zs + zi))
        o.append(D(p.X(t[j]), p.Y(zs[j] + zi[j]), SIG, 3.2))
        o.append(T(p.X(t[j]) + 4, p.Y(zs[j] + zi[j]) + 15, ("%.3g cm" % (zs[j] + zi[j])) if zs[j] + zi[j] < 10 else ("%.1f cm" % (zs[j] + zi[j])), "start", 9.5, SIG, True, halo=True))
        m = int(_f06_np.argmin(zi[:1500]))
        o.append(D(p.X(t[m]), p.Y(zi[m]), PUR, 3.0))
        o.append(T(p.X(t[m]) + 6, p.Y(zi[m]) + 12, "−1.05 cm", "start", 9.5, PUR, True, halo=True))
    o.append(T(350, 352, "入力による部分は力に比例して 2 倍になり、初期値による部分は変わらない。合計は 2 倍にならない。", "middle", 10, INK))
    return SVG(700, 362, o, "初期値が 0 でない台車の応答を、入力による部分（初期値 0 の応答で、伝達関数で決まる）と、初期値による部分（入力 0 の自由な動き）に分けたもの（m = 1 kg、c = 2 N·s/m、k = 25 N/m）。力を 2 倍にすると、入力による部分だけが 2 倍になる。出力と入力の比が入力によらないのは、初期値 0 の部分だけである。")
F["e06_ic"] = _f06_ic_fig()


# =====================================================================
# 2 節: 極と零点
# =====================================================================
def _f06_G2(s):
    """2 節の例 G(s) = 7.5(s + 2)/((s + 3)(s^2 + 2s + 5))。"""
    return 7.5 * (s + 2) / ((s + 3) * (s * s + 2 * s + 5))


def _f06_surface_fig():
    o = []
    o.append(_f06_m(14, 18, [_f06_t("(a) |"), _f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(")| を s 平面の上の高さとして描く（対数の目盛）")], "start", 11.5, INK, True, False))
    sr, wr = (-4.6, 1.4), (-3.6, 3.6)
    ns, nw = 34, 34
    hmin, hmax = -1.2, 1.3
    az, el = math.radians(24), math.radians(42)
    kx, ky, kz = 48.0, 36.0, 80.0
    cx, cy = 226, 196
    sc, wc = (sr[0] + sr[1]) / 2, 0.0
    ca, sa, ce, se = math.cos(az), math.sin(az), math.cos(el), math.sin(el)

    def H(s_, w_):
        v = abs(_f06_G2(complex(s_, w_)))
        return max(hmin, min(hmax, math.log10(v) if v > 0 else hmin))

    def P(s_, w_, h):
        X, Y, Z = (s_ - sc) * kx, (w_ - wc) * ky, h * kz
        X1, Y1 = X * ca - Y * sa, X * sa + Y * ca
        return cx + X1, cy - (Z * ce + Y1 * se), Y1 * ce - Z * se

    ss = _f06_np.linspace(sr[0], sr[1], ns + 1)
    ws = _f06_np.linspace(wr[0], wr[1], nw + 1)
    hh = [[H(a, b) for b in ws] for a in ss]
    # 床（h = hmin）の枠
    fl = [P(sr[0], wr[0], hmin), P(sr[1], wr[0], hmin), P(sr[1], wr[1], hmin), P(sr[0], wr[1], hmin)]
    o.append(PL([(a, b) for a, b, _ in fl] + [(fl[0][0], fl[0][1])], c=FNT, lw=1, dash="3 3"))
    quads = []
    for i in range(ns):
        for j in range(nw):
            cs = [(ss[i], ws[j], hh[i][j]), (ss[i + 1], ws[j], hh[i + 1][j]), (ss[i + 1], ws[j + 1], hh[i + 1][j + 1]), (ss[i], ws[j + 1], hh[i][j + 1])]
            pts = [P(*c_) for c_ in cs]
            d = sum(p_[2] for p_ in pts) / 4
            hm = sum(c_[2] for c_ in cs) / 4
            quads.append((d, pts, hm))
    quads.sort(key=lambda q: -q[0])
    body = []
    for d, pts, hm in quads:
        st = SIG if hm > hmax - 0.02 else (TEA if hm < hmin + 0.02 else MUT)
        lw = 0.9 if st != MUT else 0.45
        body.append('<polygon points="%s" stroke="%s" stroke-width="%g"/>' % (" ".join("%.1f,%.1f" % (a, b) for a, b, _ in pts), st, lw))
    o.append('<g fill="%s" stroke-linejoin="round">%s</g>' % (PAN, "".join(body)))
    # 説明
    pp = P(-1.0, 2.0, hmax)
    o.append(W(pp[0], pp[1] - 4, pp[0] + 40, pp[1] - 30, c=SIG, lw=1))
    o.append(_f06_m(pp[0] + 42, pp[1] - 32, [_f06_t("極 −1 + "), _f06_v("j"), _f06_t("2（柱）")], "start", 10, SIG, True))
    pq = P(-3.0, 0.0, hmax)
    o.append(W(pq[0], pq[1] - 4, pq[0] - 26, pq[1] - 40, c=SIG, lw=1))
    o.append(T(pq[0] - 28, pq[1] - 44, "極 −3（柱）", "end", 10, SIG, True, halo=True))
    pz = P(-2.0, 0.0, hmin)
    o.append(W(pz[0], pz[1] + 4, pz[0] + 30, pz[1] + 56, c=TEA, lw=1))
    o.append(T(pz[0] + 32, pz[1] + 66, "零点 −2（くぼみ）", "start", 10, TEA, True, halo=True))
    pr = P(-1.0, -2.0, hmax)
    o.append(W(pr[0], pr[1] - 2, pr[0] + 34, pr[1] + 30, c=SIG, lw=1))
    o.append(_f06_m(pr[0] + 36, pr[1] + 40, [_f06_t("極 −1 − "), _f06_v("j"), _f06_t("2")], "start", 10, SIG, True))
    # 軸の向き（床の手前の辺に沿って）
    a0 = P(sr[0], wr[0], hmin); a1 = P(sr[1], wr[0], hmin); b1 = P(sr[0], wr[1], hmin)
    o.append(ARR(a0[0] + 8, a0[1] - 2, a0[0] + 8 + (a1[0] - a0[0]) * 0.3, a0[1] - 2 + (a1[1] - a0[1]) * 0.3, c=MUT, lw=1.2, head=6))
    o.append(T(a0[0] + 12 + (a1[0] - a0[0]) * 0.3, a0[1] + 12 + (a1[1] - a0[1]) * 0.3, "実部 σ", "start", 9.5, MUT, halo=True))
    o.append(ARR(a0[0] - 6, a0[1] - 8, a0[0] - 6 + (b1[0] - a0[0]) * 0.3, a0[1] - 8 + (b1[1] - a0[1]) * 0.3, c=MUT, lw=1.2, head=6))
    o.append(T(a0[0] - 10 + (b1[0] - a0[0]) * 0.3, a0[1] - 8 + (b1[1] - a0[1]) * 0.3, "虚部 ω", "end", 9.5, MUT, halo=True))
    # (b) 配置図
    o.append(T(486, 18, "(b) 極と零点の配置図", "start", 11.5, INK, True))
    q = Plot(510, 40, 170, 200, (-4.6, 1.4), (-3.6, 3.6))
    o.append(_f06_sp(q, [-4, -3, -2, -1, 0, 1], [-3, -2, -1, 0, 1, 2, 3]))
    o.append(PZ(q, [complex(-3, 0), complex(-1, 2), complex(-1, -2)], [complex(-2, 0)], SIG))
    o.append(_f06_m(q.X(-0.85), q.Y(2) - 8, [_f06_t("−1 + "), _f06_v("j"), _f06_t("2")], "start", 9.5, SIG, True))
    o.append(T(q.X(-3), q.Y(0) - 11, "−3", "middle", 9.5, SIG, True, halo=True))
    o.append(T(q.X(-2), q.Y(0) + 19, "−2", "middle", 9.5, SIG, True, halo=True))
    o.append(T(q.X(1.3), q.Y(-3.0), "× 極　○ 零点", "end", 9.5, MUT, halo=True))
    s1, _ = _f06_frac(595, 312, [_f06_t("7.5("), _f06_v("s"), _f06_t(" + 2)")], [_f06_t("("), _f06_v("s"), _f06_t(" + 3)("), _f06_v("s", None, None, "2"), _f06_t(" + 2"), _f06_v("s"), _f06_t(" + 5)")], 11)
    o.append(_f06_m(522, 316, [_f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(") =")], "end", 11, INK, False, False))
    o.append(s1)
    return SVG(700, 344, o, "極と零点の意味（G(s) = 7.5(s + 2)/((s + 3)(s<sup>2</sup> + 2s + 5))）。(a) s 平面の各点で |G(s)| を求め、その対数を高さにした面。極では分母が 0 になって限りなく高くなり（青の線は、図の上限で切った柱の頭）、零点では 0 に落ちる（青緑の線は、図の下限で切ったくぼみの底）。(b) 同じ極と零点を、上から見て × と ○ で描いた配置図。共役な極の組は、実軸について上下対称に並ぶ。")
F["e06_pz_surface"] = _f06_surface_fig()
