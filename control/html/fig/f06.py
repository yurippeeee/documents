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


def _f06_m(x, y, parts, a="start", sz=12, c=INK, b=False, halo=True, nat=False):
    """式の文字。parts = [(文字, 添字, 斜体か, 色, 上付き, 上の点の数), ...]（後ろは省略してよい）。
    nat=True なら、そろえ（a）を SVG の text-anchor にそのまま任せる（幅の見積もりの誤差が出ない。上の点は使えない）。"""
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
    o = ['<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x if nat else x0, 2), round(y, 2), a if nat else "start", sz, c, "700" if b else "400", hl)]
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
    ns, nw = 30, 36                 # 刻み 0.2: 極 −3・−1 ± j2 と零点 −2 が格子の点に乗る
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
    o.append(W(pp[0], pp[1] - 4, pp[0] + 40, pp[1] - 22, c=SIG, lw=1))
    o.append(_f06_m(pp[0] + 42, pp[1] - 24, [_f06_t("極 −1 + "), _f06_v("j"), _f06_t("2（柱）")], "start", 10, SIG, True))
    pq = P(-3.0, 0.0, hmax)
    o.append(W(pq[0], pq[1] - 4, pq[0] - 22, pq[1] - 30, c=SIG, lw=1))
    o.append(T(pq[0] - 24, pq[1] - 34, "極 −3（柱）", "end", 10, SIG, True, halo=True))
    pr = P(-1.0, -2.0, hmax)
    o.append(W(pr[0] + 2, pr[1] - 2, pr[0] + 40, pr[1] + 14, c=SIG, lw=1))
    o.append(_f06_m(pr[0] + 42, pr[1] + 20, [_f06_t("極 −1 − "), _f06_v("j"), _f06_t("2")], "start", 10, SIG, True))
    pz = P(-2.0, -0.2, H(-2.0, -0.2))
    o.append(D(pz[0], pz[1], TEA, 3.2))
    o.append(W(pz[0], pz[1] + 4, pz[0] - 30, pz[1] + 54, c=TEA, lw=1))
    o.append(T(pz[0] - 30, pz[1] + 66, "零点 −2（細く深いくぼみ）", "middle", 10, TEA, True, halo=True))
    # 軸の向き（左上に小さく）
    ox, oy = 46, 70
    for (d0, d1), lab in (((1.0, 0.0), "+σ"), ((0.0, 1.0), "+ω")):
        pa_ = P(sc, 0.0, 0.0); pb_ = P(sc + d0 * 0.8, d1 * 0.8 * kx / ky * 0.75, 0.0)
        dx, dy = pb_[0] - pa_[0], pb_[1] - pa_[1]
        o.append(ARR(ox, oy, ox + dx, oy + dy, c=MUT, lw=1.3, head=6))
        o.append(T(ox + dx * 1.25, oy + dy * 1.25 + 4, ("実部 σ" if lab == "+σ" else "虚部 ω"), "middle", 9.5, MUT, halo=True))
    # (b) 配置図
    o.append(T(486, 18, "(b) 極と零点の配置図", "start", 11.5, INK, True))
    q = Plot(516, 36, 164, 170, (-4.6, 1.4), (-3.6, 3.6))
    o.append(_f06_sp(q, [-4, -3, -2, -1, 0, 1], [-3, -2, -1, 0, 1, 2, 3], xl=None))
    o.append(PZ(q, [complex(-3, 0), complex(-1, 2), complex(-1, -2)], [complex(-2, 0)], SIG))
    o.append(_f06_m(q.X(-0.85), q.Y(2) - 8, [_f06_t("−1 + "), _f06_v("j"), _f06_t("2")], "start", 9.5, SIG, True))
    o.append(T(q.X(-3), q.Y(0) - 11, "−3", "middle", 9.5, SIG, True, halo=True))
    o.append(T(q.X(-2), q.Y(0) + 19, "−2", "middle", 9.5, SIG, True, halo=True))
    o.append(T(q.X(1.3), q.Y(-3.0), "× 極　○ 零点", "end", 9.5, MUT, halo=True))
    # (c) 実軸の上の断面
    o.append(_f06_m(486, 246, [_f06_t("(c) 実軸の上の |"), _f06_v("G"), _f06_t("("), _f06_g("σ"), _f06_t(")|")], "start", 11.5, INK, True, False))
    r = Plot(516, 256, 164, 70, (-4.6, 1.4), (0.03, 30), ylog=True)
    o.append(r.axes(xl="実部 σ [1/s]", yl=None, xt=[-4, -3, -2, -1, 0, 1], yt=[0.1, 1, 10], xfmt=lambda v: ("%g" % v).replace("-", "−"), yfmt=lambda v: "%g" % v))
    xs_ = _f06_np.linspace(-4.6, 1.4, 1201)
    pts_ = [(a, max(0.03, min(30, abs(_f06_G2(complex(a, 0)))))) for a in xs_ if abs(a + 3) > 1e-9 and abs(a + 2) > 1e-9]
    o.append(r.clip(pts_, c=SIG, lw=1.8))
    o.append(W(r.X(-3), r.y, r.X(-3), r.y + r.h, c=SIG, lw=0.8, dash="2 3"))
    o.append(W(r.X(-2), r.y, r.X(-2), r.y + r.h, c=TEA, lw=0.8, dash="2 3"))
    o.append(T(r.X(-3) - 4, r.y + 10, "極", "end", 9.5, SIG, True, halo=True))
    o.append(T(r.X(-2) + 4, r.y + r.h - 4, "零点", "start", 9.5, TEA, True, halo=True))
    return SVG(700, 372, o, "極と零点の意味（G(s) = 7.5(s + 2)/((s + 3)(s<sup>2</sup> + 2s + 5))）。(a) s 平面の各点で |G(s)| を求め、その対数を高さにした面。極では分母が 0 になって限りなく高くなり（青の線は、図の上限で切った柱の頭）、零点では 0 に落ちて細いくぼみになる（青緑の点）。左上の矢印は、実部と虚部が増える向き。(b) 同じ極と零点を、上から見て × と ○ で描いた配置図。共役な極の組は、実軸について上下対称に並ぶ。(c) 実軸の上（s が実数）での |G| を、(b) と同じ横軸で描いたもの。極 −3 で限りなく大きく、零点 −2 で 0 になる。")
F["e06_pz_surface"] = _f06_surface_fig()


def _f06_proper_fig():
    o = []
    cols = [
        ("(a) 厳密にプロパー", [_f06_t("1")], [_f06_t("0.5"), _f06_v("s"), _f06_t(" + 1")], "分子 0 次 < 分母 1 次", "0 から連続に動き始める", SIG, 0.0),
        ("(b) プロパー（厳密でない）", [_f06_t("0.1"), _f06_v("s"), _f06_t(" + 1")], [_f06_t("0.5"), _f06_v("s"), _f06_t(" + 1")], "分子 1 次 = 分母 1 次", "時刻 0 に 0.2 へ跳ぶ", GLD, 0.2),
        ("(c) プロパーでない", [_f06_t("0.1"), _f06_v("s"), _f06_t(" + 1")], [_f06_t("1")], "分子 1 次 > 分母 0 次", "時刻 0 にインパルスを含む", ALI, None),
    ]
    t = _f06_np.linspace(0, 2, 801)
    for k, (title, num, den, deg, note, c, jump) in enumerate(cols):
        x0 = 14 + k * 230
        o.append(T(x0, 18, title, "start", 11.5, INK, True))
        s_, w_ = _f06_frac(x0 + 104, 50, num, den, 12.5, c, True)
        o.append(_f06_m(x0 + 104 - w_ / 2 - 6, 54, [_f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(") =")], "end", 12, INK, False, False))
        o.append(s_)
        o.append(T(x0 + 104, 94, deg, "middle", 10, MUT))
        p = Plot(x0 + 40, 114, 170, 110, (-0.2, 2), (-0.1, 1.5))
        o.append(p.axes(xl="時間 t [s]", yl="出力" if k == 0 else None, xt=[0, 1, 2], yt=[0, 0.5, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(p.line([(-0.2, 0), (0, 0), (0, 1), (2, 1)], c=MUT, lw=1.1, dash="4 3"))
        if jump is None:
            o.append(p.line([(-0.2, 0), (0, 0)], c=c, lw=2.2))
            o.append(p.line([(0.0, 1.0), (2, 1.0)], c=c, lw=2.2))
            o.append(ARR(p.X(0), p.Y(0), p.X(0), p.y - 2, c=c, lw=2.2, head=8))
            o.append(T(p.X(0) + 8, p.y + 12, "高さが限りなく大きい", "start", 9.5, c, True, halo=True))
        else:
            y = jump + (1 - jump) * (1 - _f06_np.exp(-2 * t))
            o.append(p.line([(-0.2, 0), (0, 0)], c=c, lw=2.2))
            if jump > 0:
                o.append(W(p.X(0), p.Y(0), p.X(0), p.Y(jump), c=c, lw=1.2, dash="2 2"))
            o.append(p.line(list(zip(t, y)), c=c, lw=2.2))
        o.append(T(x0 + 125, 276, note, "middle", 10, c, True))
    o.append(T(350, 300, "破線は入力（単位ステップ）。(a)・(b) の極は −2（分母 0.5s + 1）。どれも定常ゲインは 1", "middle", 9.5, MUT))
    return SVG(700, 310, o, "分子と分母の次数の差で、入力を急に変えた瞬間の出力が変わる（単位ステップ応答）。(a) 厳密にプロパーな伝達関数の出力は、0 から連続に動き始める。(b) 分子と分母の次数が等しいと、入力の一部（ここでは 0.2 倍）がそのまま出力に現れ、時刻 0 に跳ぶ。(c) 分子の次数が高いと、入力の変わる速さが出力に現れ、ステップ入力に対して時刻 0 にインパルスが出る。")
F["e06_proper"] = _f06_proper_fig()


def _f06_pzmap_fig():
    o = []
    items = [
        ("台車とばね・ダンパ", "1/(s² + 2s + 25)", (-6, 2), (-6, 6), [-1 + 4.899j, -1 - 4.899j], [], [-4, 0], [-5, 0, 5], "−1 ± j4.90"),
        ("モータの角速度（La 無視）", "50/(0.05s + 1)", (-26, 6), (-6, 6), [-20 + 0j], [], [-20, 0], [-5, 0, 5], "−20"),
        ("モータの角速度（La を含む）", "2×10⁶/(s² + 2000s + 40000)", (-2200, 300), (-600, 600), [-20.2 + 0j, -1979.8 + 0j], [], [-2000, -1000, 0], [-500, 0, 500], "−20.2 と −1980"),
        ("モータの角度", "1000/(s(s + 20))", (-26, 6), (-6, 6), [0j, -20 + 0j], [], [-20, 0], [-5, 0, 5], "0 と −20"),
        ("温度の板（むだ時間 20 s）", "1.25e^{−20s}/(500s + 1)", (-0.003, 0.001), (-0.002, 0.002), [-0.002 + 0j], [], [-0.002, 0], [-0.002, 0, 0.002], "−0.002"),
        ("倒立振子（力 → 角度）", "−6.667/(s² − 45.78)", (-9, 9), (-6, 6), [-6.766 + 0j, 6.766 + 0j], [], [-6, 0, 6], [-5, 0, 5], "±6.77"),
        ("倒立振子（力 → 台車の位置）", "(2s² − 65.40)/(s²(s² − 45.78))", (-9, 9), (-6, 6), [0j, 0j, -6.766 + 0j, 6.766 + 0j], [-5.718 + 0j, 5.718 + 0j], [-6, 0, 6], [-5, 0, 5], "極 0（2 つ）・±6.77、零点 ±5.72"),
        ("モータの位置の比例制御", "210/(s² + 20s + 210)", (-26, 6), (-15, 15), [-10 + 10.49j, -10 - 10.49j], [], [-20, -10, 0], [-10, 0, 10], "−10 ± j10.5"),
    ]
    for k, (name, gtxt, xr, yr, poles, zeros, xt, yt, ptxt) in enumerate(items):
        col, row = k % 4, k // 4
        x0, y0 = 14 + col * 172, 14 + row * 196
        o.append(TX(x0, y0 + 10, name.replace("La", "L_a"), "start", 10, INK, True))
        p = Plot(x0 + 30, y0 + 22, 128, 96, xr, yr)
        def ff(v):
            if v == 0:
                return "0"
            a = abs(v)
            s = ("%g" % v) if a >= 0.01 else ("%.3f" % v).rstrip("0")
            return s.replace("-", "−")
        o.append(_f06_sp(p, xt, yt, xl=None, yl=None, sz=8.5, fmt=ff))
        o.append(PZ(p, poles, zeros, SIG, r=4.5))
        if k == 6:
            o.append(T(p.X(0), p.Y(0) - 9, "2 つ", "middle", 8.5, SIG, True, halo=True))
        o.append(TX(x0 + 94, y0 + 150, gtxt, "middle", 9, MUT))
        o.append(TX(x0 + 94, y0 + 166, ptxt.replace("j", "j"), "middle", 9, SIG, True))
    o.append(T(350, 404, "横軸は実部 σ [1/s]、縦軸は虚部 ω [rad/s]。目盛は図ごとに違う。右半平面（実部が正）を薄い赤で塗った。", "middle", 9.5, MUT))
    return SVG(700, 414, o, "例の対象の伝達関数の極（×）と零点（○）（値はどれも例の値）。多くの極は実部が負の側にある。L<sub>a</sub> を含むモータの 2 つの極は 100 倍近く離れている。積分を含むモータの角度と倒立振子の台車の位置は原点に極をもち、倒立振子は実部が正の極をもつ。むだ時間 e<sup>−20s</sup> は多項式の根ではないので、配置図には現れない。")
F["e06_pz_map"] = _f06_pzmap_fig()


# =====================================================================
# 3 節: 極の位置と応答の形
# =====================================================================
def _f06_terms_fig():
    o = []
    num2 = [7.5, 15.0]
    den2 = list(_f06_np.polymul([1, 3], [1, 2, 5]))
    r_, p_, _k = _f06_sig.residue(num2, den2)
    A3 = [ri for ri, pi in zip(r_, p_) if abs(pi + 3) < 1e-6][0].real
    Ap = [ri for ri, pi in zip(r_, p_) if abs(pi - (-1 + 2j)) < 1e-6][0]
    o.append(T(14, 18, "(a) 極と零点", "start", 11.5, INK, True))
    q = Plot(56, 36, 160, 172, (-4, 1), (-3, 3))
    o.append(_f06_sp(q, [-4, -3, -2, -1, 0, 1], [-3, -2, -1, 0, 1, 2, 3]))
    o.append(PZ(q, [], [complex(-2, 0)], MUT))
    o.append(PZ(q, [complex(-3, 0)], [], TEA))
    o.append(PZ(q, [complex(-1, 2), complex(-1, -2)], [], PUR))
    o.append(T(q.X(-3), q.Y(0) - 11, "−3", "middle", 9.5, TEA, True, halo=True))
    o.append(T(q.X(-2), q.Y(0) + 19, "零点 −2", "middle", 9.5, MUT, True, halo=True))
    o.append(_f06_m(q.X(-0.8), q.Y(2) - 9, [_f06_t("−1 ± "), _f06_v("j"), _f06_t("2")], "start", 9.5, PUR, True))
    t = _f06_np.linspace(0, 5, 2001)
    e1 = A3 * _f06_np.exp(-3 * t)
    e2 = (2 * Ap * _f06_np.exp((-1 + 2j) * t)).real
    env = 2 * abs(Ap) * _f06_np.exp(-t)
    o.append(T(270, 18, "(b) 極ごとの項", "start", 11.5, INK, True))
    p = Plot(316, 30, 364, 108, (0, 5), (-1.2, 3.1))
    o.append(p.axes(xl=None, yl="項", xt=[0, 1, 2, 3, 4, 5], yt=[-1, 0, 1, 2, 3], xfmt=lambda v: "", yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(p.line(list(zip(t, env)), c=PUR, lw=1, dash="4 3"))
    o.append(p.line(list(zip(t, -env)), c=PUR, lw=1, dash="4 3"))
    o.append(p.line(list(zip(t, e1)), c=TEA, lw=2.0))
    o.append(p.line(list(zip(t, e2)), c=PUR, lw=2.0))
    o.append(_f06_m(p.X(0.25), p.Y(-0.92), [_f06_t("−0.9375 "), _f06_e("−3t")], "start", 10, TEA, True))
    o.append(_f06_m(p.X(1.5), p.Y(1.6), [_f06_t("2.965 "), _f06_e("−t"), _f06_t(" cos(2"), _f06_v("t"), _f06_t(" − 71.6°)")], "start", 10, PUR, True))
    o.append(_f06_m(p.X(3.2), p.Y(0.55), [_f06_t("包絡線 ±2.965 "), _f06_e("−t")], "start", 9.5, PUR))
    o.append(T(270, 166, "(c) 和がインパルス応答", "start", 11.5, INK, True))
    r = Plot(316, 178, 364, 96, (0, 5), (-0.6, 1.8))
    o.append(r.axes(xl="時間 t [s]", yl="g(t)", xt=[0, 1, 2, 3, 4, 5], yt=[0, 0.5, 1, 1.5], yfmt=lambda v: "%g" % v))
    o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=1))
    o.append(r.line(list(zip(t, e1)), c=TEA, lw=1.0, dash="3 3"))
    o.append(r.line(list(zip(t, e2)), c=PUR, lw=1.0, dash="3 3"))
    o.append(r.line(list(zip(t, e1 + e2)), c=SIG, lw=2.4))
    i = int(_f06_np.argmax(e1 + e2))
    o.append(D(r.X(t[i]), r.Y((e1 + e2)[i]), SIG, 3.2))
    o.append(T(r.X(t[i]) + 8, r.Y((e1 + e2)[i]) - 2, "1.54（%.2f s）" % t[i], "start", 9.5, SIG, True, halo=True))
    o.append(T(r.X(1.6), r.Y(1.2), "0.5 s を過ぎると、ほぼ極の組の項だけになる", "start", 9.5, SIG, halo=True))
    o.append(_f06_m(14, 280, [_f06_v("G"), _f06_t("("), _f06_v("s"), _f06_t(") = 7.5("), _f06_v("s"), _f06_t(" + 2) / {("), _f06_v("s"), _f06_t(" + 3)("), _f06_v("s", None, None, "2"), _f06_t(" + 2"), _f06_v("s"), _f06_t(" + 5)}")], "start", 9.5, INK, False, False))
    o.append(T(14, 298, "留数: −0.9375（極 −3）、0.469 ∓ j1.406（極 −1 ± j2）", "start", 9.5, MUT))
    return SVG(700, 310, o, "インパルス応答を極ごとの項に分ける（2 節の例）。(a) 極 −3 と、共役な極の組 −1 ± j2、零点 −2。(b) 極 −3 は揺れずに速く消える項を、極の組は周期 3.14 s で揺れながら包絡線 e<sup>−t</sup> で縮む項を作る。項の形は極の位置だけで決まり、大きさ（留数）は零点を含めたほかの極と零点の位置で決まる。(c) 2 つの項の和がインパルス応答で、速い項が消えた後は、極の組の項だけが残る。")
F["e06_terms"] = _f06_terms_fig()


def _f06_pair_step(sg, w, t):
    """極の組 sg ± jw（w > 0）をもつ最終値 1 の二次遅れ、または実の極 sg（w = 0、定常ゲイン 1）のステップ応答。"""
    if w > 0:
        return 1 - _f06_np.exp(sg * t) * (_f06_np.cos(w * t) - (sg / w) * _f06_np.sin(w * t))
    if sg == 0:
        return t.copy()
    return 1 - _f06_np.exp(sg * t)


def _f06_lines_fig():
    o = []
    rows = [
        ("(a) 実部が同じ（−1）: 包絡線が同じ", [(-1, 2), (-1, 4.899), (-1, 10)], (-4, 1.5), (-11, 11), [-4, -2, 0], [-10, 0, 10], 6,
         "vert", ["20.8 %", "52.7 %", "73.0 %"], "2 % 整定時間はどれも 3.7〜3.9 s。上ほど速く揺れ、行き過ぎる"),
        ("(b) 虚部が同じ（5 rad/s）: 周期が同じ", [(-0.5, 5), (-1, 5), (-2.5, 5)], (-4, 1.5), (-7, 7), [-4, -2, 0], [-5, 0, 5], 8,
         "horz", ["73.0 %", "53.3 %", "20.8 %"], "周期 1.26 s・ピーク時間 0.628 s は同じ。左ほど速く落ち着く"),
        ("(c) 負の実軸となす角が同じ（ζ = 0.5）: 形が同じ", [(-1, 1.732), (-2.5, 4.330), (-5, 8.660)], (-7, 1.5), (-10, 10), [-6, -4, -2, 0], [-10, 0, 10], 5,
         "ray", ["16.3 %", "16.3 %", "16.3 %"], "行き過ぎ量はどれも 16.3 %。原点から遠いほど速い"),
    ]
    cols = [TEA, SIG, PUR]
    y0 = 12
    for title, poles, xr, yr, xt, yt, tend, kind, mps, note in rows:
        o.append(TX(14, y0 + 12, title, "start", 11, INK, True))
        q = Plot(56, y0 + 24, 150, 112, xr, yr)
        o.append(_f06_sp(q, xt, yt, xl=None, yl=None, sz=9))
        if kind == "vert":
            o.append(W(q.X(-1), q.y, q.X(-1), q.y + q.h, c=GLD, lw=1.4, dash="5 3"))
        elif kind == "horz":
            o.append(W(q.x, q.Y(5), q.x + q.w, q.Y(5), c=GLD, lw=1.4, dash="5 3"))
            o.append(W(q.x, q.Y(-5), q.x + q.w, q.Y(-5), c=GLD, lw=1.4, dash="5 3"))
        else:
            o.append(W(q.X(0), q.Y(0), q.X(-5.8), q.Y(10), c=GLD, lw=1.4, dash="5 3"))
            o.append(W(q.X(0), q.Y(0), q.X(-5.8), q.Y(-10), c=GLD, lw=1.4, dash="5 3"))
        for (sg, w), c in zip(poles, cols):
            o.append(PZ(q, [complex(sg, w), complex(sg, -w)], [], c, r=4.5))
        p = Plot(290, y0 + 24, 390, 112, (0, tend), (0, 1.8))
        o.append(p.axes(xl="時間 t [s]", yl="出力", xt=list(range(0, tend + 1)), yt=[0, 0.5, 1, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
        o.append(p.line([(0, 1), (tend, 1)], c=MUT, lw=1, dash="4 3"))
        t = _f06_np.linspace(0, tend, 2401)
        for (sg, w), c, mp in zip(poles, cols, mps):
            y = _f06_pair_step(sg, w, t)
            o.append(p.line(list(zip(t, y)), c=c, lw=1.9))
        # 行き過ぎ量の札（右上に並べる）
        for k, ((sg, w), c, mp) in enumerate(zip(poles, cols, mps)):
            o.append(_f06_m(p.x + p.w - 4, p.y + 12 + k * 13, [_f06_t("%s ± " % _f06_fmt(sg, 3)), _f06_v("j"), _f06_t("%s: 行き過ぎ量 %s" % (_f06_fmt(w, 3), mp))], "end", 9, c, True))
        o.append(T(290, y0 + 190, note, "start", 9.5, INK))
        y0 += 198
    return SVG(700, y0 + 4, o, "s 平面の 3 種類の線の上に極の組を並べたときのステップ応答（最終値 1 の二次遅れ）。(a) 縦の線の上（実部が同じ）では包絡線が同じなので、落ち着く時刻はほぼ同じで、上ほど速く揺れて行き過ぎが増える。(b) 横の線の上（虚部が同じ）では揺れの周期が同じで、左ほど速く縮み、行き過ぎが減る。(c) 原点からの直線の上（減衰比が同じ）では応答の形が同じで、原点から遠いほど時間が縮む。")
F["e06_lines"] = _f06_lines_fig()


def _f06_grid_fig():
    o = []
    sgs = [-3.0, -1.5, -0.5, 0.0, 0.3]
    ws = [8.0, 4.0, 1.5, 0.0]
    cw, ch, gx, gy = 112, 76, 92, 30
    tend, ylo, yhi = 6.0, -0.4, 2.2
    o.append(T(14, 18, "極の組 σ₀ ± jω₀ の位置と、最終値 1 のステップ応答（横軸は 0〜6 s、縦軸は −0.4〜2.2）", "start", 11, INK, True))
    # 右半平面の列と虚軸の列
    xr0 = gx + 4 * cw
    o.append(RECT(xr0, gy, cw, ch * 4, 0, soft(ALI), "none", 0))
    t = _f06_np.linspace(0, tend, 1201)
    for i, w in enumerate(ws):
        for j, sg in enumerate(sgs):
            x0, y0 = gx + j * cw, gy + i * ch
            p = Plot(x0 + 8, y0 + 8, cw - 16, ch - 16, (0, tend), (ylo, yhi))
            o.append(RECT(x0 + 4, y0 + 4, cw - 8, ch - 8, 4, SCR, LIN, 0.8))
            o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=FNT, lw=0.8, dash="3 2"))
            o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=LIN, lw=0.8))
            y = _f06_pair_step(sg, w, t)
            c = SIG if sg < 0 else (GLD if sg == 0 else ALI)
            o.append(p.clip(list(zip(t, y)), c=c, lw=1.7))
            if sg < 0 and w > 0:
                mp = math.exp(math.pi * sg / w) * 100
                o.append(T(x0 + cw - 9, y0 + 18, "%.3g %%" % mp if mp >= 1 else "%.2f %%" % mp, "end", 8.5, MUT, halo=True))
    # 軸
    for j, sg in enumerate(sgs):
        o.append(T(gx + j * cw + cw / 2, gy + 4 * ch + 14, ("%g" % sg).replace("-", "−"), "middle", 10, INK, True))
    for i, w in enumerate(ws):
        o.append(T(gx - 8, gy + i * ch + ch / 2 + 4, "%g" % w, "end", 10, INK, True))
    o.append(T(gx + 2.5 * cw, gy + 4 * ch + 32, "実部 σ₀ [1/s]（格子の間隔は等しくない）", "middle", 10, MUT))
    o.append(T(gx - 40, gy + 2 * ch, "虚部 ω₀ [rad/s]", "middle", 10, MUT, rot=-90))
    o.append(T(gx + 3.5 * cw, gy + 4 * ch + 46, "↑ 虚軸の上", "middle", 9.5, GLD, True))
    o.append(T(gx + 4.5 * cw, gy + 4 * ch + 46, "↑ 右半平面", "middle", 9.5, ALI, True))
    o.append(T(gx + 0.5 * cw, gy + 4 * ch + 46, "左ほど速く落ち着く", "start", 9.5, SIG, True))
    return SVG(700, gy + 4 * ch + 56, o, "極の位置ごとのステップ応答の一覧（極の組 σ₀ ± jω₀ をもつ、最終値 1 の二次遅れ。いちばん下の段は、実軸の上の極 1 つの一次遅れで、原点では積分）。数字は行き過ぎ量。左ほど速く落ち着き、上ほど速く揺れる。同じ列（実部が同じ）では包絡線が同じで、行き過ぎ量は上ほど大きい。虚軸の上の極は揺れ続け（原点では増え続け）、右半平面の極の応答は最終値から離れていく。")
F["e06_grid"] = _f06_grid_fig()


# =====================================================================
# 4 節: 安定性
# =====================================================================
def _f06_bibo_fig():
    o = []
    hx = [(14, "極"), (214, "インパルス応答 g(t)"), (466, "有界な入力への応答")]
    for x, h in hx:
        o.append(T(x, 16, h, "start", 11, INK, True))
    rows = [("安定", GRN, "台車とばね・ダンパ", [complex(-1, 4.899), complex(-1, -4.899)], (-6, 2), (-7, 7)),
            ("安定限界", GLD, "ダンパを外した台車", [complex(0, 5), complex(0, -5)], (-6, 2), (-7, 7)),
            ("不安定", ALI, "倒立振子（力 → 角度）", [complex(-6.766, 0), complex(6.766, 0)], (-9, 9), (-7, 7))]
    y0 = 30
    for k, (name, c, obj, poles, xr, yr) in enumerate(rows):
        o.append(T(14, y0 + 14, name, "start", 11.5, c, True))
        o.append(T(14, y0 + 30, obj, "start", 9.5, MUT))
        q = Plot(76, y0 + 40, 104, 70, xr, yr)
        o.append(_f06_sp(q, [xr[0] + (1 if k < 2 else 3), 0], [-5, 0, 5], xl=None, yl=None, sz=8.5))
        o.append(PZ(q, poles, [], c, r=4.5))
        lab = {0: "−1 ± j4.90", 1: "±j5", 2: "±6.77"}[k]
        o.append(T(q.x + q.w / 2, q.y + q.h + 28, lab, "middle", 9.5, c, True))
        # インパルス応答
        if k < 2:
            t = _f06_np.linspace(0, 10, 4001)
            g = _f06_np.exp(-t) * _f06_np.sin(4.899 * t) / 4.899 if k == 0 else _f06_np.sin(5 * t) / 5
            p = Plot(250, y0 + 26, 190, 84, (0, 10), (-0.25, 0.25))
            o.append(p.axes(xl="時間 t [s]" if k == 1 else None, yl=None, xt=[0, 5, 10], yt=[-0.2, 0, 0.2], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−"), sz=9))
            if k == 0:
                o.append(PL([(p.X(a), p.Y(0)) for a in (0,)] + [(p.X(a), p.Y(b)) for a, b in zip(t, g)] + [(p.X(10), p.Y(0))], c="none", lw=0, fill=soft(c)))
            o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.9))
            o.append(p.line(list(zip(t, g)), c=c, lw=1.6))
            o.append(T(p.x + p.w - 2, p.y + 11, "∫|g| dt = 0.129 m/N（有限）" if k == 0 else "減らずに揺れ続ける", "end", 9.5, c, True, halo=True))
            o.append(T(p.x - 6, p.y - 6, "[m/(N·s)]", "start", 8.5, MUT))
            # 正弦波の力
            u = _f06_np.sin(5 * t)
            y = 100 * _f06_lsim([1.0], [1, 2, 25] if k == 0 else [1, 0, 25], u, t)
            r = Plot(500, y0 + 26, 190, 84, (0, 10), (-110, 110))
            o.append(r.axes(xl="時間 t [s]" if k == 1 else None, yl=None, xt=[0, 5, 10], yt=[-100, 0, 100], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−"), sz=9))
            o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=0.9))
            o.append(r.line(list(zip(t, y)), c=c, lw=1.4))
            o.append(T(r.x - 6, r.y - 6, "位置 [cm]　力 sin 5t [N]（振幅 1 N）", "start", 8.5, MUT))
            o.append(T(r.x + r.w - 2, r.y + r.h - 6, "10 cm の揺れに落ち着く" if k == 0 else "10 s で約 1 m。増え続ける", "end", 9.5, c, True, halo=True))
        else:
            t = _f06_np.linspace(0, 1, 2001)
            g = -6.667 * _f06_np.sinh(6.766 * t) / 6.766
            p = Plot(250, y0 + 26, 190, 84, (0, 1), (-60, 5))
            o.append(p.axes(xl="時間 t [s]", yl=None, xt=[0, 0.5, 1], yt=[-50, -25, 0], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−"), sz=9))
            o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.9))
            o.append(p.clip(list(zip(t, g)), c=c, lw=1.6))
            o.append(T(p.x - 6, p.y - 6, "[rad/(N·s)]", "start", 8.5, MUT))
            o.append(_f06_m(p.x + p.w - 2, p.y + p.h - 8, [_f06_e("6.77t"), _f06_t(" で増える")], "end", 9.5, c, True))
            t2 = _f06_np.linspace(0, 1.5, 3001)
            ang = -6.667 * 0.01 * (_f06_np.cosh(6.766 * t2) - 1) / 45.78 * 180 / math.pi
            r = Plot(500, y0 + 26, 190, 84, (0, 1.5), (-90, 10))
            o.append(r.axes(xl="時間 t [s]", yl=None, xt=[0, 0.5, 1, 1.5], yt=[-90, -60, -30, 0], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−"), sz=9))
            o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=0.9))
            o.append(W(r.x, r.Y(-57.3), r.x + r.w, r.Y(-57.3), c=MUT, lw=0.9, dash="3 3"))
            o.append(r.clip(list(zip(t2, ang)), c=c, lw=1.6))
            o.append(T(r.x - 6, r.y - 6, "角度 [°]　一定の力 0.01 N", "start", 8.5, MUT))
            o.append(T(r.x + 4, r.Y(-57.3) + 13, "1.07 s で 1 rad（57°）", "start", 9.5, c, True, halo=True))
        if k < 2:
            o.append(W(14, y0 + 138, 690, y0 + 138, c=LIN, lw=0.8))
        y0 += 146
    return SVG(700, y0 + 6, o, "安定・安定限界・不安定の比較。安定な台車では、インパルス応答が減り、その絶対値の面積（薄く塗った部分）が有限なので、振幅 1 N の正弦波の力を加え続けても、位置の揺れは 10 cm に落ち着く。ダンパを外すと（安定限界）、インパルス応答は減らず、極と同じ角周波数 5 rad/s の力で揺れが時間に比例して大きくなる。倒立振子（不安定）では、インパルス応答が e<sup>6.77t</sup> で増え、小さな一定の力でも角度が大きくなり続ける（線形化した式で計算）。")
F["e06_bibo"] = _f06_bibo_fig()


def _f06_stab_motor_fig():
    o = []
    o.append(_f06_m(14, 18, [_f06_t("(a) "), _f06_v("K", "P"), _f06_t(" を上げたときの極の組（"), _f06_v("L", "a"), _f06_t(" を含む 3 次）")], "start", 11.5, INK, True, False))
    q = Plot(70, 40, 220, 250, (-14, 8), (-280, 280))
    o.append(_f06_sp(q, [-10, -5, 0, 5], [-200, -100, 0, 100, 200]))
    kps = _f06_np.logspace(math.log10(0.21), math.log10(60), 400)
    up = []
    for kp in kps:
        rr = _f06_np.roots([1, 2000, 40000, 2e6 * kp])
        pr = [z for z in rr if z.imag > 1e-9]
        if pr:
            up.append(pr[0])
    o.append(PL([(q.X(z.real), q.Y(z.imag)) for z in up], c=GLD, lw=2.2))
    o.append(PL([(q.X(z.real), q.Y(-z.imag)) for z in up], c=GLD, lw=2.2))
    marks = [(0.21, GRN, "0.21"), (10, SIG, "10"), (40, GLD, "40"), (50, ALI, "50")]
    for kp, c, lab in marks:
        rr = _f06_np.roots([1, 2000, 40000, 2e6 * kp])
        pr = [z for z in rr if abs(z.imag) > 1e-9]
        o.append(PZ(q, pr, [], c, r=5))
        zt = [z for z in pr if z.imag > 0][0]
        o.append(T(q.X(zt.real) + (8 if kp >= 40 else -8), q.Y(zt.imag) + 4, lab, "start" if kp >= 40 else "end", 9.5, c, True, halo=True))
    o.append(_head(q.X(-6.6), q.Y(150), q.X(-5.0), q.Y(140), GLD, 8))
    o.append(TX(q.x + 4, q.y + q.h - 8, "数字は K_P [V/rad]", "start", 9, MUT, halo=True))
    o.append(T(q.x + 4, q.y + 14, "← 3 つ目の極 −1980〜−2005（図の外）", "start", 9, MUT, halo=True))
    # (b) 角度のステップ応答
    o.append(T(330, 18, "(b) 目標を 1 rad 変えたときの角度", "start", 11.5, INK, True))
    t = _f06_np.linspace(0, 0.4, 8001)
    ys = [(10, SIG, "10 V/rad: 極 −7.54 ± j100。揺れながら落ち着く"), (40, GLD, "40 V/rad: 極 ±j200。周期 31.4 ms で揺れ続ける（安定限界）"), (50, ALI, "50 V/rad: 極 2.46 ± j223。揺れが大きくなり続ける")]
    for k, (kp, c, lab) in enumerate(ys):
        y = _f06_step([2e6 * kp], [1, 2000, 40000, 2e6 * kp], t)
        p = Plot(372, 34 + k * 92, 308, 62, (0, 0.4), (-1.0, 3.0))
        o.append(p.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 1, 2], xfmt=(lambda v: "%g" % v) if k == 2 else (lambda v: ""), yfmt=lambda v: "%g" % v, sz=9))
        o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=0.9, dash="4 3"))
        o.append(p.clip(list(zip(t, y)), c=c, lw=1.4))
        o.append(T(p.x, p.y - 5, lab, "start", 9.5, c, True))
    o.append(T(336, 34 + 92 + 31, "角度 [rad]", "middle", 9.5, MUT, rot=-90))
    return SVG(700, 334, o, "モータの位置の比例制御（L<sub>a</sub> を含む 3 次の式）で比例ゲイン K<sub>P</sub> を上げる。(a) 極の組は、0.21 V/rad の −10.05 ± j10.54 から、虚軸へ近づきながら上へ動き（金の線）、40 V/rad でちょうど ±j200 で虚軸を横切って右半平面へ出る。縦と横の目盛の大きさは違う。(b) 10 V/rad では揺れながら落ち着き、40 V/rad では同じ振幅で揺れ続け、50 V/rad では揺れが大きくなり続ける。")
F["e06_stab_motor"] = _f06_stab_motor_fig()


# =====================================================================
# 5 節: 零点の影響
# =====================================================================
_F06_WN2, _F06_SG, _F06_WD = 210.0, 10.0, math.sqrt(110.0)   # モータの位置の比例制御（K_P = 0.21 V/rad）


def _f06_y0(t):
    """零点の無いステップ応答 y0 と、その微分。"""
    e = _f06_np.exp(-_F06_SG * t)
    y0 = 1 - e * (_f06_np.cos(_F06_WD * t) + (_F06_SG / _F06_WD) * _f06_np.sin(_F06_WD * t))
    yd = (_F06_WN2 / _F06_WD) * e * _f06_np.sin(_F06_WD * t)
    return y0, yd


def _f06_zero_split_fig():
    o = []
    t = _f06_np.linspace(0, 0.6, 3001)
    y0, yd = _f06_y0(t)
    for k, z1 in enumerate((-10.0, 10.0)):
        x0 = 14 + k * 346
        title = "(a) 零点 −10（左半平面）" if z1 < 0 else "(b) 零点 +10（右半平面）"
        o.append(T(x0, 18, title, "start", 11.5, INK, True))
        p = Plot(x0 + 46, 34, 280, 170, (0, 0.6), (-0.6, 1.4))
        o.append(p.axes(xl="時間 t [s]", yl="角度 [rad]" if k == 0 else None, xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[-0.5, 0, 0.5, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.9))
        term = -yd / z1
        y = y0 + term
        o.append(p.line(list(zip(t, y0)), c=MUT, lw=1.6, dash="5 3"))
        o.append(p.line(list(zip(t, term)), c=GLD, lw=1.8))
        o.append(p.line(list(zip(t, y)), c=SIG, lw=2.4))
        if z1 < 0:
            i = int(_f06_np.argmax(y))
            o.append(D(p.X(t[i]), p.Y(y[i]), SIG, 3.2))
            o.append(T(p.X(t[i]) + 8, p.Y(y[i]) - 4, "1.235（行き過ぎ量 23.5 %）", "start", 9.5, SIG, True, halo=True))
            o.append(_f06_m(p.X(0.33), p.Y(0.3), [_f06_t("+"), _f06_v("y", "0", None, None, 1), _f06_t("/10（足す山）")], "start", 10, GLD, True))
        else:
            i = int(_f06_np.argmin(y))
            o.append(D(p.X(t[i]), p.Y(y[i]), SIG, 3.2))
            o.append(T(p.X(t[i]) + 8, p.Y(y[i]) + 12, "−0.425（初めに 42.5 % 逆へ）", "start", 9.5, SIG, True, halo=True))
            o.append(_f06_m(p.X(0.33), p.Y(-0.3), [_f06_t("−"), _f06_v("y", "0", None, None, 1), _f06_t("/10（引く山）")], "start", 10, GLD, True))
        o.append(_f06_m(p.X(0.37), p.Y(0.82), [_f06_v("y", "0"), _f06_t("（零点なし）")], "start", 10, MUT))
        yl_ = p.Y(1.25) if z1 > 0 else p.Y(-0.38)
        o.append(_f06_m(p.X(0.37) + 58, yl_, [_f06_v("y"), _f06_t(" = "), _f06_v("y", "0"), _f06_t(" −")], "end", 10.5, SIG, True, nat=True))
        o.append(_f06_m(p.X(0.37) + 62, yl_, [_f06_v("y", "0", None, None, 1), _f06_t("/"), _f06_v("z", "1")], "start", 10.5, SIG, True))
    o.append(T(350, 262, "零点の無いステップ応答 y₀ に、その微分の −1/z₁ 倍を足したものが、零点のあるステップ応答になる", "middle", 10, INK))
    return SVG(700, 272, o, "零点を 1 つ加えたステップ応答の分解（4 章 6 節のモータの位置の比例制御、K<sub>P</sub> = 0.21 V/rad、極 −10 ± j10.49、目標 1 rad）。(a) 零点が左半平面にあると、上がっていく間に微分の山が足され、速く上がって大きく行き過ぎる。(b) 右半平面にあると、山が引かれ、動き始めに目標と逆の向きへ動く（逆応答）。")
F["e06_zero_split"] = _f06_zero_split_fig()


def _f06_zero_sweep_fig():
    o = []
    t = _f06_np.linspace(0, 0.6, 3001)
    y0, yd = _f06_y0(t)
    sets = [("(a) 左半平面の零点", [(-5, ALI), (-10, PUR), (-20, GLD), (-50, TEA)], (-0.2, 1.9), [0, 0.5, 1, 1.5]),
            ("(b) 右半平面の零点", [(5, ALI), (10, PUR), (20, GLD), (50, TEA)], (-1.15, 1.3), [-1, -0.5, 0, 0.5, 1])]
    for k, (title, zs, yr, yt) in enumerate(sets):
        x0 = 14 + k * 346
        o.append(T(x0, 18, title, "start", 11.5, INK, True))
        p = Plot(x0 + 46, 34, 280, 180, (0, 0.6), yr)
        o.append(p.axes(xl="時間 t [s]", yl="角度 [rad]" if k == 0 else None, xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=yt, xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.9))
        o.append(p.line(list(zip(t, y0)), c=MUT, lw=1.6, dash="5 3"))
        for z1, c in zs:
            y = y0 - yd / z1
            o.append(p.line(list(zip(t, y)), c=c, lw=1.8))
        items = [(c, None, "z_1 = %s" % ("%+g" % z1).replace("-", "−")) for z1, c in zs] + [(MUT, "5 3", "なし")]
        o.append(LEGL(x0 + 6, 262, items[:3], sz=9.5, gap=12))
        o.append(LEGL(x0 + 6, 280, items[3:], sz=9.5, gap=12))
    o.append(TX(350, 304, "零点が原点に近い（|z_1| が小さい）ほど効き目が大きい。極の原点からの距離 ω_n = 14.5 rad/s の数倍より遠いと、ほとんど効かない", "middle", 9.5, MUT))
    return SVG(700, 314, o, "零点の位置を変えたステップ応答（極 −10 ± j10.49、最終値 1 rad）。(a) 左半平面の零点は、原点に近いほど行き過ぎを大きくする（−5 で 79.4 %、−50 で 5.3 %）。(b) 右半平面の零点は、原点に近いほど、動き始めに大きく逆へ動かす（+5 で 104.6 %、+50 で 3.3 %）。破線は零点の無い応答（行き過ぎ量 5.0 %）。")
F["e06_zero_sweep"] = _f06_zero_sweep_fig()


def _f06_zero_example_fig():
    o = []
    # (a) 付け根を動かす台車
    o.append(T(14, 18, "(a) 付け根を動かす（左半平面の零点 −12.5）", "start", 11.5, INK, True))
    gy = 92
    o.append(_f06_ground(14, 330, gy + 12))
    bx = 40
    o.append(RECT(bx - 8, gy - 52, 12, 64, 2, MSOFT, MUT, 1.2))
    o.append(CIRC(bx - 2, gy + 6, 4, c=MUT, lw=1.2, fill=SCR))
    o.append(ARR(bx - 2, gy - 60, bx + 26, gy - 60, c=GLD, lw=2, head=6))
    o.append(TX(bx + 30, gy - 56, "付け根の位置 u", "start", 9.5, GLD, True))
    cx = bx + 150
    o.append(_f06_spring(bx + 4, cx, gy - 34, 6, 5, TEA, 1.4))
    o.append(_f06_damper(bx + 4, cx, gy - 14, PUR, 1.4))
    o.append(_f06_cart(cx, gy - 46, 56, 38, SIG))
    o.append(_f06_m(cx + 28, gy - 22, [_f06_v("m")], "middle", 11, SIG, True, False))
    o.append(ARR(cx + 62, gy - 30, cx + 92, gy - 30, c=SIG, lw=1.6, head=6))
    o.append(TX(cx + 96, gy - 26, "位置 y", "start", 9.5, SIG, True))
    t = _f06_np.linspace(0, 4, 4001)
    yb = _f06_step([2, 25], [1, 2, 25], t)
    yf = _f06_step([25], [1, 2, 25], t)
    p = Plot(56, 130, 270, 140, (0, 4), (0, 1.7))
    o.append(p.axes(xl="時間 t [s]", yl="位置（最終値 1）", xt=[0, 1, 2, 3, 4], yt=[0, 0.5, 1, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 1), (4, 1)], c=FNT, lw=0.9, dash="3 3"))
    o.append(p.line(list(zip(t, yf)), c=MUT, lw=1.6, dash="5 3"))
    o.append(p.line(list(zip(t, yb)), c=SIG, lw=2.2))
    o.append(T(p.X(0.62), p.Y(1.572) - 6, "57.2 %", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.72), p.Y(1.527) + 14, "52.7 %", "start", 9.5, MUT, True, halo=True))
    o.append(LEGL(56, 324, [(SIG, None, "付け根を動かす"), (MUT, "5 3", "力で押す（零点なし）")], sz=9.5, gap=12))
    # (b) ボイラのドラムの水位
    xb = 360
    o.append(T(xb, 18, "(b) ボイラのドラムの水位（右半平面の零点）", "start", 11.5, INK, True))
    dx, dy, dw, dh = xb + 30, 40, 150, 66
    o.append(RECT(dx, dy, dw, dh, 30, PAN, MUT, 1.6))
    o.append(RECT(dx + 2, dy + 30, dw - 4, dh - 32, 26, TSOFT, "none", 0))
    o.append(W(dx + 10, dy + 30, dx + dw - 10, dy + 30, c=TEA, lw=1.6))
    for bxx, byy, rr in ((dx + 30, dy + 46, 3), (dx + 52, dy + 54, 2.5), (dx + 74, dy + 44, 3.2), (dx + 98, dy + 52, 2.5), (dx + 118, dy + 45, 3)):
        o.append(CIRC(bxx, byy, rr, c=TEA, lw=1.1, fill=SCR))
    o.append(ARR(dx - 26, dy + 50, dx + 2, dy + 50, c=GLD, lw=2, head=6))
    o.append(T(dx - 28, dy + 44, "給水", "end", 9.5, GLD, True))
    o.append(ARR(dx + dw - 30, dy + 10, dx + dw - 6, dy - 6, c=MUT, lw=1.6, head=6))
    o.append(T(dx + dw - 2, dy - 4, "蒸気", "start", 9.5, MUT))
    o.append(T(dx + dw + 8, dy + 34, "水位", "start", 9.5, TEA, True))
    o.append(T(dx + dw + 8, dy + 50, "泡がつぶれて", "start", 9, MUT))
    o.append(T(dx + dw + 8, dy + 63, "いったん下がる", "start", 9, MUT))
    t2 = _f06_np.linspace(0, 80, 4001)
    fast = -20.0 * (1 - _f06_np.exp(-t2 / 10.0))
    slow = 0.5 * t2
    q = Plot(xb + 46, 130, 280, 140, (0, 80), (-25, 25))
    o.append(q.axes(xl="時間 t [s]", yl="水位の変化 [mm]", xt=[0, 20, 40, 60, 80], yt=[-20, -10, 0, 10, 20], xfmt=lambda v: "%g" % v, yfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=0.9))
    o.append(q.line(list(zip(t2, fast)), c=ALI, lw=1.4, dash="5 3"))
    o.append(q.clip(list(zip(t2, slow)), c=GRN, lw=1.4, dash="5 3"))
    o.append(q.line(list(zip(t2, fast + slow)), c=SIG, lw=2.3))
    i = int(_f06_np.argmin(fast + slow))
    o.append(D(q.X(t2[i]), q.Y((fast + slow)[i]), SIG, 3.2))
    o.append(T(q.X(t2[i]) + 6, q.Y((fast + slow)[i]) + 14, "13.9 s に −8.1 mm", "start", 9.5, SIG, True, halo=True))
    o.append(D(q.X(39.2), q.Y(0), SIG, 3.0))
    o.append(T(q.X(39.2) + 4, q.Y(0) - 6, "39 s に元の高さ", "start", 9.5, SIG, True, halo=True))
    o.append(LEGL(xb + 6, 324, [(ALI, "5 3", "速く逆へ: −20(1 − e^{−t/10})"), (GRN, "5 3", "遅く正しく: 0.5t")], sz=9.5, gap=10))
    return SVG(700, 334, o, "零点が応答を変える身近な例（値は例の値）。(a) 台車とばね・ダンパの付け根（壁）を急に 1 だけ動かすと、ダンパが付け根の動きの速さも台車に伝えるので、伝達関数に零点 −k/c = −12.5 が現れ、力で押すときより大きく行き過ぎる。(b) ボイラのドラムに給水を 1 kg/s 増やすと、泡がつぶれて速く下がる経路と、水がたまって遅く上がる経路の和になり、水位はいったん下がってから上がる（逆応答。零点 +0.033 /s）。")
F["e06_zero_example"] = _f06_zero_example_fig()


# =====================================================================
# 6 節: 支配極と近似
# =====================================================================
def _f06_dominant_fig():
    o = []
    o.append(T(14, 18, "(a) 極の位置", "start", 11.5, INK, True))
    q = Plot(56, 36, 190, 150, (-55, 5), (-8, 8))
    o.append(_f06_sp(q, [-50, -40, -30, -20, -10, 0], [-5, 0, 5]))
    o.append(PZ(q, [complex(-1, 4.899), complex(-1, -4.899)], [], SIG, r=5))
    cases = [(3, ALI), (10, GLD), (50, GRN)]
    for a, c in cases:
        o.append(PZ(q, [complex(-a, 0)], [], c, r=5))
        o.append(T(q.X(-a), q.Y(0) + 18, "−%g" % a, "middle", 9.5, c, True, halo=True))
    o.append(_f06_m(q.X(-0.2), q.Y(4.9) - 8, [_f06_t("−1 ± "), _f06_v("j"), _f06_t("4.90")], "end", 9.5, SIG, True))
    t = _f06_np.linspace(0, 4, 8001)
    y2 = 100 * _f06_step([1.0], [1, 2, 25], t)
    o.append(T(290, 18, "(b) 位置のステップ応答（力 1 N）", "start", 11.5, INK, True))
    p = Plot(330, 36, 350, 150, (0, 4), (0, 7))
    o.append(p.axes(xl="時間 t [s]", yl="位置 y [cm]", xt=[0, 1, 2, 3, 4], yt=[0, 2, 4, 6], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line(list(zip(t, y2)), c=MUT, lw=1.8, dash="5 3"))
    ys = {}
    for a, c in cases:
        y3 = 100 * _f06_step([a], list(_f06_np.polymul([1, a], [1, 2, 25])), t)
        ys[a] = y3
        o.append(p.line(list(zip(t, y3)), c=c, lw=1.8))
    o.append(LEGL(334, 238, [(MUT, "5 3", "台車だけ（支配極だけの近似）"), (ALI, None, "a = 3")], sz=9.5, gap=10))
    o.append(LEGL(334, 256, [(GLD, None, "a = 10"), (GRN, None, "a = 50 rad/s")], sz=9.5, gap=10))
    # (c) 動き始めの拡大
    o.append(T(14, 284, "(c) 動き始めの拡大: 遠い極は、およそ 1/a の遅れになる", "start", 11.5, INK, True))
    r = Plot(56, 300, 624, 96, (0, 0.6), (0, 6.5))
    o.append(r.axes(xl="時間 t [s]", yl="[cm]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 2, 4, 6], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(r.line([(a_, b_) for a_, b_ in zip(t, y2) if a_ <= 0.6], c=MUT, lw=1.8, dash="5 3"))
    for a, c in cases:
        o.append(r.line([(a_, b_) for a_, b_ in zip(t, ys[a]) if a_ <= 0.6], c=c, lw=1.8))
    # 同じ高さに届く時刻の差（細かい刻みの計算で求めた値）
    for lev, ta, tb, c, lab in ((3.0, 0.2934, 0.3878, GLD, "0.094 s（1/a = 0.1 s）"), (4.5, 0.3992, 0.4198, GRN, "0.021 s（1/a = 0.02 s）")):
        o.append(DIM(r.X(ta), r.Y(lev), r.X(tb), r.Y(lev), None, c=c))
        o.append(T(r.X(ta) - 6, r.Y(lev) + 4, lab, "end", 9.5, c, True, halo=True))
    return SVG(700, 440, o, "台車とばね・ダンパに、時定数 1/a の力の遅れ a/(s + a) を足した 3 次の伝達関数（最終値はどれも 4 cm）。(a) 極の組 −1 ± j4.90 は動かず、遠い極 −a だけが加わる。(b) a が極の組の原点からの距離 5 rad/s より大きいほど、台車だけの応答（破線）に近づく。a = 3 では行き過ぎが大きく減り、近似は成り立たない。(c) 同じ高さに届く時刻の差は、a = 10 で 0.094 s、a = 50 で 0.021 s で、どちらも 1/a に近い。a = 50 では、差は主にこの遅れである。")
F["e06_dominant"] = _f06_dominant_fig()


def _f06_motor_dom_fig():
    o = []
    cols = [(0.21, 0.6, (-14, 2), (-16, 16), [-10, 0], [-10, 0, 10], "行き過ぎ量 5.01 %（二次遅れ 5.00 %）"),
            (10, 0.5, (-14, 2), (-120, 120), [-10, 0], [-100, 0, 100], "78.8 %（二次遅れ 72.9 %）"),
            (40, 0.25, (-14, 2), (-240, 240), [-10, 0], [-200, 0, 200], "揺れ続ける（二次遅れは落ち着く）")]
    for k, (kp, tend, xr, yr, xt, yt, note) in enumerate(cols):
        x0 = 14 + k * 230
        o.append(TX(x0, 18, "K_P = %g V/rad" % kp, "start", 11.5, INK, True))
        q = Plot(x0 + 44, 32, 92, 110, xr, yr)
        o.append(_f06_sp(q, xt, yt, xl=None, yl=None, sz=8.5))
        r3 = [z for z in _f06_np.roots([1, 2000, 40000, 2e6 * kp]) if abs(z.imag) > 1e-9]
        r2 = list(_f06_np.roots([0.05, 1, 50 * kp]))
        o.append(PZ(q, r2, [], MUT, r=4.5))
        o.append(PZ(q, r3, [], SIG, r=4.5))
        z3 = [z for z in r3 if z.imag > 0][0]
        z2 = [z for z in r2 if z.imag > 0][0]
        o.append(T(x0 + 144, 52, "3 次:", "start", 9, SIG, True))
        o.append(T(x0 + 144, 66, ("±j%s" % _f06_fmt(z3.imag, 4)) if abs(z3.real) < 1e-6 else "%s ± j%s" % (_f06_fmt(z3.real, 3), _f06_fmt(z3.imag, 4)), "start", 9, SIG, True))
        o.append(T(x0 + 144, 86, "二次遅れ:", "start", 9, MUT, True))
        o.append(T(x0 + 144, 100, "%s ± j%s" % (_f06_fmt(z2.real, 3), _f06_fmt(z2.imag, 4)), "start", 9, MUT, True))
        o.append(T(x0 + 144, 122, "遠い極 %s" % _f06_fmt(min(_f06_np.roots([1, 2000, 40000, 2e6 * kp]).real), 4), "start", 9, MUT))
        t = _f06_np.linspace(0, tend, 6001)
        y3 = _f06_step([2e6 * kp], [1, 2000, 40000, 2e6 * kp], t)
        y2 = _f06_step([1000 * kp], [1, 20, 1000 * kp], t)
        p = Plot(x0 + 36, 176, 176, 100, (0, tend), (0, 2.1))
        xt_ = [0, 0.1, 0.2] if tend < 0.3 else [0, tend / 2, tend]
        o.append(p.axes(xl="時間 t [s]", yl="角度 [rad]" if k == 0 else None, xt=xt_, yt=[0, 1, 2], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9))
        o.append(p.line([(0, 1), (tend, 1)], c=FNT, lw=0.9, dash="3 3"))
        o.append(p.line(list(zip(t, y2)), c=MUT, lw=1.6, dash="5 3"))
        o.append(p.line(list(zip(t, y3)), c=SIG, lw=1.6))
        o.append(T(x0 + 128, 318, note, "middle", 9.5, SIG if k < 2 else ALI, True))
    o.append(LEGL(170, 342, [(SIG, None, "L_a を含む 3 次の式"), (MUT, "5 3", "L_a を無視した二次遅れ（支配極だけの近似）")], sz=9.5, gap=14))
    return SVG(700, 352, o, "モータの位置の比例制御で、巻線のインダクタンス L<sub>a</sub> を捨てた二次遅れの近似を、3 次の式と比べる。0.21 V/rad では支配極も応答もほとんど同じだが、比例ゲインを上げると、ループの中の遅れのために 3 次の式の支配極が虚軸へ寄り、行き過ぎが大きくなる。40 V/rad では 3 次の式は安定限界で揺れ続けるのに、二次遅れの近似は落ち着くと答える。")
F["e06_motor_dom"] = _f06_motor_dom_fig()


def _f06_cancel_fig():
    o = []
    o.append(T(14, 18, "(a) 遅い極 −1 の近くの零点", "start", 11.5, INK, True))
    q = Plot(56, 34, 120, 100, (-12, 1), (-3, 3))
    o.append(_f06_sp(q, [-10, -5, 0], [-2, 0, 2], xl=None, yl=None, sz=8.5))
    o.append(PZ(q, [complex(-1, 0), complex(-10, 0)], [], SIG, r=4.5))
    zc = [(1.0, SIG), (1.1, GLD), (1.3, PUR), (2.0, TEA)]
    for k, (z, c) in enumerate(zc):
        o.append(CIRC(q.X(-z), q.Y(0) - (k * 0.0), 3.0, c=c, lw=1.4, fill=SCR))
    o.append(T(q.X(-10), q.Y(0) - 10, "−10", "middle", 9, SIG, True, halo=True))
    o.append(T(q.X(-1) + 2, q.Y(0) + 22, "−1 と零点", "middle", 9, SIG, True, halo=True))
    t = _f06_np.linspace(0, 4, 4001)
    p = Plot(56, 170, 270, 130, (0, 4), (0, 1.15))
    o.append(p.axes(xl="時間 t [s]", yl="出力", xt=[0, 1, 2, 3, 4], yt=[0, 0.5, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(RECT(p.x, p.Y(1.02), p.w, p.Y(0.98) - p.Y(1.02), 0, GSOFT, "none", 0))
    for z, c in zc:
        y = _f06_step([10.0 / z, 10.0], list(_f06_np.polymul([1, 1], [1, 10])), t)
        o.append(p.line(list(zip(t, y)), c=c, lw=1.8))
    o.append(LEGL(186, 52, [(SIG, None, "z = 1（相殺）: 0.39 s")], sz=9.5))
    o.append(LEGL(186, 70, [(GLD, None, "z = 1.1: 1.62 s")], sz=9.5))
    o.append(LEGL(186, 88, [(PUR, None, "z = 1.3: 2.55 s")], sz=9.5))
    o.append(LEGL(186, 106, [(TEA, None, "z = 2: 3.32 s")], sz=9.5))
    o.append(T(186, 128, "（2 % 整定時間）", "start", 9, MUT))
    # (b) 右半平面の極を打ち消し損なう
    o.append(T(370, 18, "(b) 右半平面の極 +1 を零点で消そうとする", "start", 11.5, INK, True))
    t2 = _f06_np.linspace(0, 8, 8001)
    r = Plot(410, 34, 270, 266, (0, 8), (-0.5, 4.0))
    o.append(r.axes(xl="時間 t [s]", yl="出力", xt=[0, 2, 4, 6, 8], yt=[0, 1, 2, 3, 4], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=0.9))
    for z, c, lab in ((1.0, SIG, "零点 1.00（ぴったり）"), (0.99, ALI, "零点 0.99（1 % ずれ）"), (0.9, PUR, "零点 0.90")):
        y = _f06_step([1.0, -z], list(_f06_np.polymul([1, -1], [1, 2])), t2)
        o.append(r.clip(list(zip(t2, y)), c=c, lw=1.9))
    term = (1 - 0.99) / 3 * _f06_np.exp(t2)
    o.append(r.clip(list(zip(t2, term)), c=ALI, lw=1.1, dash="3 3"))
    o.append(T(r.X(7.9), r.Y(0.5) - 6, "零点 1.00: 0.5 に落ち着く", "end", 9.5, SIG, True, halo=True))
    o.append(T(r.X(5.75) - 4, r.Y(3.6), "零点 0.99", "end", 9.5, ALI, True, halo=True))
    o.append(T(r.X(3.4) - 4, r.Y(3.6), "零点 0.90", "end", 9.5, PUR, True, halo=True))
    o.append(_f06_m(r.X(5.0), r.Y(1.6), [_f06_t("0.0033 "), _f06_e("t"), _f06_t(" の項（破線）")], "end", 9.5, ALI, True))
    return SVG(700, 344, o, "極零相殺。(a) 遅い極 −1 と速い極 −10 をもつ 10(s + z)/(z(s + 1)(s + 10)) で、零点 −z を −1 に近づけると、−1 の極の項が小さくなる。ぴったり一致すると約分されて速い一次遅れになるが、少しでもずれると、小さな項が時定数 1 s でゆっくり残り、2 % 整定時間（緑の帯）を大きく延ばす。(b) (s − z)/((s − 1)(s + 2)) で、零点 z を右半平面の極 +1 に合わせようとして 1 % ずれると、e<sup>t</sup> の項の大きさは 0.0033 しかないが、時間とともに大きくなり、5.7 s で 1 を越える。")
F["e06_cancel"] = _f06_cancel_fig()
