# -*- coding: utf-8 -*-
# 06. 板金 の図（figures.py から exec される）
import math as _m6

def _p06(pts, c=MUT, fill=PAN, lw=1.4, dash=None):
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"%s/>' % (d, fill, c, lw, da)

def _bent06(Px, Py, A, B, t, R, th, sc, flip=False):
    """仮想シャープ P（画面座標）から、左へ外寸 A の辺、曲げて外寸 B の辺。
    外側の面は下（第 1 辺）と右（第 2 辺）。曲げ角度 th [rad]。返り値: 多角形の点, 中心 O, OSSB"""
    os_ = (R + t) * _m6.tan(th / 2)
    # 局所座標（mm, y 上向き）
    O = (-os_, R + t)
    def arc(r, n=16):
        return [(O[0] + r * _m6.sin(a), O[1] - r * _m6.cos(a)) for a in [th * k / n for k in range(n + 1)]]
    u = (_m6.cos(th), _m6.sin(th)); nrm = (-_m6.sin(th), _m6.cos(th))
    Eo = (B * u[0], B * u[1]); Ei = (Eo[0] + t * nrm[0], Eo[1] + t * nrm[1])
    outer = [(-A, 0)] + arc(R + t) + [Eo]
    inner = [Ei] + arc(R)[::-1] + [(-A, t)]
    pts = outer + inner
    def S(p): return (Px + p[0] * sc, Py - p[1] * sc)
    return [S(p) for p in pts], S(O), os_, S

# ---- 工程 ----
def _e06_process():
    o = []
    items = [("定尺板", "材料の板"), ("切断", "シャー・レーザー・NCT"), ("曲げ", "プレスブレーキ"),
             ("二次加工", "タップ・圧入・溶接"), ("表面処理", "めっき・塗装など")]
    s, _ = flowright(17, 50, items, w=146, bh=62, gap=24, c=SIG, fill=PAN)
    o.append(s)
    # プレスブレーキの模式図
    cx, cy = 230, 220
    o.append(T(cx, 120, "プレスブレーキによる曲げ（空曲げ）", "middle", 11.5, INK, True))
    # ダイ（V 溝）
    o.append(_p06([(cx - 90, cy + 10), (cx - 30, cy + 10), (cx, cy + 50), (cx + 30, cy + 10), (cx + 90, cy + 10), (cx + 90, cy + 80), (cx - 90, cy + 80)], MUT, SCR))
    o.append(T(cx + 100, cy + 60, "ダイ（V 型）", "start", 10.5, MUT))
    # 板（曲がり途中）
    a = _m6.radians(28)
    L = 110
    o.append(PL([(cx - L * _m6.cos(a), cy + 10 - L * _m6.sin(a) + 0), (cx, cy + 34), (cx + L * _m6.cos(a), cy + 10 - L * _m6.sin(a))], SIG, 5))
    # パンチ
    o.append(_p06([(cx - 16, cy - 70), (cx + 16, cy - 70), (cx + 16, cy - 10), (cx, cy + 26), (cx - 16, cy - 10)], MUT, PAN))
    o.append(T(cx + 24, cy - 50, "パンチ", "start", 10.5, MUT))
    o.append(ARR(cx - 40, cy - 70, cx - 40, cy - 30, INK, 1.6, 7))
    o.append(DIM(cx - 30, cy + 94, cx + 30, cy + 94, "V 溝の幅", MUT))
    o.append(T(cx - 120, cy - 30, "板", "end", 10.5, SIG, True))
    # 右: 注記
    x = 470
    notes = [("切断", "レーザーは工具なしで任意の輪郭。タレットパンチは標準の型で穴を打ち抜き、成形（ルーバー・バーリング）もできる"),
             ("曲げ", "パンチで板を V 溝へ押し込む。内 R は V 溝の幅で決まる（4 節）。曲げ順によっては型に当たる"),
             ("費用", "部品専用の金型が要らず、初期費用 F が小さい。数万個以上ならプレス金型に切り替える")]
    y = 140
    for h, s2 in notes:
        o.append(T(x, y, h, "start", 11, SIG, True))
        for i, l in enumerate(_wrap(s2, 60)):
            o.append(T(x + 40, y + i * 15, l, "start", 10, MUT))
        y += 15 * len(_wrap(s2, 60)) + 18
    return SVG(860, 340, o, "板金の工程（上）と、プレスブレーキでの曲げ（左下）。切断と曲げの工具は汎用なので、部品専用の金型が要らない。")
F["e06_process"] = _e06_process()

# ---- 中立面 ----
def _e06_neutral():
    o = []
    t, R, K = 1.0, 1.0, 0.4
    sc = 62.0
    Px, Py = 470, 300
    pts, Oc, os_, S = _bent06(Px, Py, 4.0, 3.6, t, R, _m6.pi / 2, sc)
    o.append(_p06(pts, SIG, SSOFT, 1.6))
    th = _m6.pi / 2
    O = (-os_, R + t)
    rn = R + K * t
    off = R + t - rn  # 外側の面から中立面まで = (1-K)t
    npts = [(-4.0, off)] + [(O[0] + rn * _m6.sin(a), O[1] - rn * _m6.cos(a)) for a in [th * k / 24 for k in range(25)]] + [(-off, 3.6)]
    o.append(PL([S(p) for p in npts], ALI, 1.8, "7 4"))
    o.append(T(S((-4.0, 0))[0] - 8, S((0, off))[1] + 4, "中立面", "end", 11, ALI, True))
    o.append(T(S((-4.0, 0))[0] - 8, S((0, off))[1] + 20, "（長さが変わらない）", "end", 10, ALI))
    # 中心と半径
    o.append(D(Oc[0], Oc[1], INK, 3))
    o.append(T(Oc[0] - 8, Oc[1] - 6, "O", "end", 11, INK, True))
    a1 = _m6.radians(20)
    o.append(ARR(Oc[0], Oc[1], Oc[0] + R * sc * _m6.sin(a1), Oc[1] + R * sc * _m6.cos(a1), INK, 1.3, 6))
    o.append(T(Oc[0] + R * sc * _m6.sin(a1) * 0.5 - 6, Oc[1] + R * sc * _m6.cos(a1) * 0.5 + 4, "R", "end", 11, INK, True))
    a2 = _m6.radians(62)
    o.append(ARR(Oc[0], Oc[1], Oc[0] + (R + t) * sc * _m6.sin(a2), Oc[1] + (R + t) * sc * _m6.cos(a2), MUT, 1.1, 6))
    o.append(T(Oc[0] + (R + t) * sc * _m6.sin(a2) + 6, Oc[1] + (R + t) * sc * _m6.cos(a2) + 16, "R + t", "start", 10.5, MUT))
    # Kt と t の寸法（第 1 辺）
    xk = S((-3.3, 0))[0]
    o.append(DIM(xk, S((0, t))[1], xk, S((0, t - K * t))[1], None, INK))
    o.append(T(xk + 7, S((0, t - K * t / 2))[1] - 10, "Kt", "start", 10.5, INK, True))
    xt = S((-2.5, 0))[0]
    o.append(DIM(xt, S((0, 0))[1], xt, S((0, t))[1], None, MUT))
    o.append(T(xt + 7, S((0, t / 2))[1] + 4, "t", "start", 11, MUT, True))
    # 伸び・縮み
    po = S((O[0] + (R + t) * _m6.sin(_m6.pi / 4), O[1] - (R + t) * _m6.cos(_m6.pi / 4)))
    pi_ = S((O[0] + R * _m6.sin(_m6.pi / 3), O[1] - R * _m6.cos(_m6.pi / 3)))
    o.append(T(po[0] + 14, po[1] + 26, "外側の面: 伸びる", "start", 11, ALI, True))
    o.append(DARR(po[0] + 4, po[1] + 12, po[0] + 26, po[1] - 10, ALI, 1.4, 5))
    lx, ly = S((-t, 0))[0] - 14, S((0, 3.0))[1]
    tgt = S((O[0] + R * _m6.sin(_m6.radians(80)), O[1] - R * _m6.cos(_m6.radians(80))))
    o.append(T(lx, ly, "内側の面: 縮む", "end", 11, GRN, True))
    o.append(W(lx + 2, ly + 4, tgt[0] - 3, tgt[1] - 2, c=GRN, lw=1.1))
    o.append(T(60, 40, "t = 1, R = 1, K = 0.4 の 90° 曲げ（縮尺どおり）", "start", 11, INK, True))
    o.append(T(60, 58, "円弧の長さ: 内側 1.571 mm、中立面 2.199 mm、外側 3.142 mm", "start", 10.5, MUT))
    return SVG(860, 340, o, "曲げの断面。内側の面は縮み、外側の面は伸びる。その間の伸び縮みしない面が中立面で、内側から Kt の位置にある。")
F["e06_neutral"] = _e06_neutral()

# ---- 曲げ代と OSSB ----
def _e06_ba():
    o = []
    t, R, K = 1.0, 1.4, 0.4
    th = _m6.radians(70)
    sc = 52.0
    Px, Py = 360, 290
    pts, Oc, os_, S = _bent06(Px, Py, 5.0, 4.6, t, R, th, sc)
    o.append(_p06(pts, SIG, SSOFT, 1.6))
    O = (-os_, R + t)
    # 外側の面の延長（仮想シャープ）
    u = (_m6.cos(th), _m6.sin(th))
    o.append(W(S((-os_, 0))[0], Py, Px + 30, Py, c=FNT, lw=1.1, dash="4 3"))
    T1 = (O[0] + (R + t) * _m6.sin(th), O[1] - (R + t) * _m6.cos(th))
    o.append(W(S(T1)[0], S(T1)[1], Px, Py, c=FNT, lw=1.1, dash="4 3"))
    o.append(D(Px, Py, INK, 3.5))
    o.append(T(Px + 8, Py + 16, "P（仮想シャープ）", "start", 11, INK, True))
    # 中心 O と垂線
    o.append(D(Oc[0], Oc[1], INK, 3.2))
    o.append(T(Oc[0] - 8, Oc[1] - 4, "O", "end", 11, INK, True))
    o.append(W(Oc[0], Oc[1], S((-os_, 0))[0], Py, c=MUT, lw=1.1))
    o.append(W(Oc[0], Oc[1], S(T1)[0], S(T1)[1], c=MUT, lw=1.1))
    o.append(W(Oc[0], Oc[1], Px, Py, c=MUT, lw=1.1, dash="2 3"))
    o.append(T(Oc[0] + 4, Oc[1] + 40, "θ/2", "start", 10.5, INK, True))
    o.append(T((Oc[0] + S((-os_, 0))[0]) / 2 - 6, (Oc[1] + Py) / 2 + 20, "R + t", "end", 10.5, MUT))
    # OSSB 寸法（第 1 辺の下）
    o.append(DIM(S((-os_, 0))[0], Py + 34, Px, Py + 34, None, SIG))
    o.append(T((S((-os_, 0))[0] + Px) / 2, Py + 52, "OSSB = (R + t) tan(θ/2)", "middle", 11, SIG, True))
    o.append(W(S((-os_, 0))[0], Py + 4, S((-os_, 0))[0], Py + 40, c=FNT, lw=0.8))
    o.append(W(Px, Py + 4, Px, Py + 40, c=FNT, lw=0.8))
    # 外寸 A
    o.append(DIM(S((-5.0, 0))[0], Py + 80, Px, Py + 80, "外寸 A（P から測る）", MUT))
    o.append(W(S((-5.0, 0))[0], Py + 4, S((-5.0, 0))[0], Py + 86, c=FNT, lw=0.8))
    o.append(W(Px, Py + 42, Px, Py + 86, c=FNT, lw=0.8))
    # 中立面の円弧（BA）
    rn = R + K * t
    npts = [S((O[0] + rn * _m6.sin(a), O[1] - rn * _m6.cos(a))) for a in [th * k / 20 for k in range(21)]]
    o.append(PL(npts, ALI, 2.6))
    mid = S((O[0] + rn * _m6.sin(th / 2), O[1] - rn * _m6.cos(th / 2)))
    o.append(T(mid[0] - 70, mid[1] - 54, "BA = θ(R + Kt)", "end", 11.5, ALI, True))
    o.append(W(mid[0] - 2, mid[1] - 2, mid[0] - 66, mid[1] - 50, c=ALI, lw=1))
    # 曲げ角度 θ
    Eo = S((4.6 * u[0], 4.6 * u[1]))
    o.append(T(Px + 70, Py - 30, "θ（曲げ角度）", "start", 11, INK, True))
    arcp = [(Px + 46 * _m6.cos(-a), Py + 46 * _m6.sin(-a)) for a in [th * k / 12 for k in range(13)]]
    o.append(PL(arcp, INK, 1.2))
    # 右の説明
    x = 590
    lines = [("展開長", INK, True), ("L = (A − OSSB) + BA + (B − OSSB)", INK, False), ("  = A + B − BD", INK, False),
             ("BD = 2·OSSB − BA（曲げ控除）", SIG, False), ("", INK, False),
             ("θ = 90° なら tan45° = 1 で", MUT, False), ("OSSB = R + t", MUT, False)]
    for i, (s, c, b) in enumerate(lines):
        o.append(T(x, 120 + i * 20, s, "start", 11, c, b))
    return SVG(860, 400, o, "曲げ代 BA と外側セットバック OSSB（θ = 70° の例）。外寸は外側の面を延長した交点 P から測る。O から両側の面への垂線の間の角は θ で、OP がそれを 2 等分する。")
F["e06_ba"] = _e06_ba()

# ---- 展開図の例 ----
def _e06_flat():
    o = []
    sc = 8.0
    # 上段: L 曲げ
    o.append(T(20, 26, "L 曲げ（t = 1, R = 1, K = 0.4, 外寸 20 × 30）", "start", 11.5, INK, True))
    Px, Py = 200, 190
    pts, Oc, os_, S = _bent06(Px, Py, 20, 30, 1.0, 1.0, _m6.pi / 2, sc * 0.5)
    o.append(_p06(pts, SIG, SSOFT, 1.4))
    o.append(T(Px - 40, Py + 22, "20", "middle", 11, INK))
    o.append(T(Px + 14, Py - 60, "30", "start", 11, INK))
    # 展開
    x0, y0 = 300, 120
    segs = [("18", 18.0, PAN, MUT), ("BA 2.199", 2.199, ASOFT, ALI), ("28", 28.0, PAN, MUT)]
    x = x0
    for lab, ln, fl, c in segs:
        o.append(RECT(x, y0, ln * sc, 16, 0, fl, c, 1.3))
        o.append(T(x + ln * sc / 2, y0 + 36, lab, "middle", 10.5, ALI if c == ALI else INK, c == ALI))
        x += ln * sc
    o.append(DIM(x0, y0 - 14, x, y0 - 14, "展開長 L = 48.199 ≈ 48.20 mm", INK))
    o.append(T(x0, y0 + 60, "= 20 + 30 − BD（1.801）", "start", 10.5, MUT))
    # 下段: コ曲げ
    o.append(T(20, 250, "コ曲げ（同じ条件、外寸 20 × 40 × 20）", "start", 11.5, INK, True))
    # コの字（簡易描画: 外側寸法で）
    bx, by = 60, 390
    W_, H_ = 40 * sc * 0.5, 20 * sc * 0.5
    o.append(PL([(bx, by - H_), (bx, by), (bx + W_, by), (bx + W_, by - H_)], SIG, 5))
    o.append(T(bx + W_ / 2, by + 20, "40", "middle", 11, INK))
    o.append(T(bx - 10, by - H_ / 2, "20", "end", 11, INK))
    o.append(T(bx + W_ + 10, by - H_ / 2, "20", "start", 11, INK))
    x0, y0 = 300, 340
    segs = [("18", 18.0, PAN, MUT), ("BA", 2.199, ASOFT, ALI), ("36", 36.0, PAN, MUT), ("BA", 2.199, ASOFT, ALI), ("18", 18.0, PAN, MUT)]
    x = x0
    for lab, ln, fl, c in segs:
        o.append(RECT(x, y0, ln * sc * 0.85, 16, 0, fl, c, 1.3))
        o.append(T(x + ln * sc * 0.85 / 2, y0 + 36, lab, "middle", 10.5, ALI if c == ALI else INK, c == ALI))
        x += ln * sc * 0.85
    o.append(DIM(x0, y0 - 14, x, y0 - 14, "展開長 L = 76.398 ≈ 76.40 mm", INK))
    o.append(T(x0, y0 + 60, "= 20 + 40 + 20 − 2 × BD（1.801）", "start", 10.5, MUT))
    return SVG(860, 420, o, "展開図の例。平らな部分は外寸から OSSB（= R + t = 2 mm）を曲げ 1 か所ごとに引いた長さで、曲がる部分は BA = 2.199 mm。赤が曲げ代。")
F["e06_flat"] = _e06_flat()

# ---- 穴と曲げ・逃げ ----
def _e06_holes():
    o = []
    # 上段: 穴と曲げ線（展開図の上から見た図）
    def plate(x0, good):
        col = SIG if good else ALI
        o.append(RECT(x0, 50, 300, 130, 0, PAN, MUT, 1.3))
        o.append(RECT(x0, 50, 300, 34, 0, SSOFT if good else ASOFT, "none", 0))
        o.append(W(x0, 67, x0 + 300, 67, c=INK, lw=1.2, dash="8 4"))
        o.append(T(x0 + 304, 71, "曲げ線", "start", 10, INK))
        o.append(T(x0 + 304, 87, "（色の帯が変形域）", "start", 9.5, FNT))
        if good:
            for cx in (80, 220):
                o.append(CIRC(x0 + cx, 130, 13, SIG, 1.5, "none"))
            o.append(DIM(x0 + 150, 84, x0 + 150, 117, None, SIG))
            o.append(T(x0 + 158, 106, "2t 程度以上", "start", 10.5, SIG, True))
        else:
            for cx in (80, 220):
                o.append('<ellipse cx="%g" cy="%g" rx="16" ry="10" fill="none" stroke="%s" stroke-width="1.5"/>' % (x0 + cx, 88, ALI))
                o.append(CIRC(x0 + cx, 88, 12, FNT, 1, "none", "2 2"))
            o.append(T(x0 + 150, 128, "穴が変形域にかかり楕円になる", "middle", 10.5, ALI))
    o.append(T(170, 32, "悪い: 曲げ線に近い穴", "middle", 12, ALI, True))
    plate(20, False)
    o.append(T(600, 32, "良い: 変形域から離した穴", "middle", 12, SIG, True))
    plate(450, True)
    # 下段: 逃げ
    o.append(T(170, 232, "悪い: 逃げなし", "middle", 12, ALI, True))
    o.append(T(600, 232, "良い: 逃げ（リリーフ）あり", "middle", 12, SIG, True))
    for x0, good in ((20, False), (450, True)):
        col = SIG if good else ALI
        o.append(RECT(x0, 250, 300, 130, 0, PAN, MUT, 1.3))
        o.append(W(x0 + 140, 300, x0 + 300, 300, c=INK, lw=1.2, dash="8 4"))
        o.append(W(x0 + 140, 250, x0 + 140, 300, c=MUT, lw=1.4))
        o.append(T(x0 + 220, 272, "曲げるフランジ", "middle", 10, MUT))
        o.append(T(x0 + 220, 340, "曲げない部分", "middle", 10, MUT))
        if good:
            o.append(RECT(x0 + 134, 250, 12, 66, 0, "var(--panel)", SIG, 1.4))
            o.append(DIM(x0 + 110, 300, x0 + 110, 316, None, SIG))
            o.append(T(x0 + 104, 320, "R + t より深く", "end", 10, SIG))
            o.append(T(x0 + 128, 262, "幅 ≥ t", "end", 10, SIG))
        else:
            o.append(PL([(x0 + 140, 300), (x0 + 146, 306), (x0 + 138, 312), (x0 + 145, 318)], ALI, 2))
            o.append(T(x0 + 130, 326, "角が裂ける", "end", 10.5, ALI, True))
    return SVG(860, 392, o, "上: 曲げ線の近くの穴は変形する（展開した板を上から見た図）。下: 曲げ線の端が板の内側で終わるときは、端に逃げを入れて裂けを防ぐ。寸法は代表値。")
F["e06_holes"] = _e06_holes()

# ---- ヘミング・バーリング・圧入ナット ----
def _e06_fasten():
    o = []
    t = 10
    # ヘミング（つぶし / すき間あり）
    o.append(T(130, 28, "ヘミング（断面）", "middle", 12, INK, True))
    x0, y0 = 30, 90
    o.append(RECT(x0, y0, 160, t, 0, SSOFT, SIG, 1.3))
    o.append(RECT(x0 + 80, y0 - t, 80, t, 0, SSOFT, SIG, 1.3))
    o.append(PL([(x0 + 160, y0 - t), (x0 + 170, y0 - t), (x0 + 170, y0 + t), (x0 + 160, y0 + t)], SIG, 1.3))
    o.append(T(x0 + 80, y0 + 32, "つぶし（密着）", "middle", 10.5, INK))
    x0, y0 = 30, 180
    o.append(RECT(x0, y0, 140, t, 0, SSOFT, SIG, 1.3))
    o.append(RECT(x0 + 70, y0 - 2 * t - 6, 70, t, 0, SSOFT, SIG, 1.3))
    cx, cy = x0 + 140, y0 - t / 2 - 3
    rr_o, rr_i = 16 + 3, 6 + 3
    arc_o = [(cx + rr_o * _m6.sin(a), cy + rr_o * _m6.cos(a)) for a in [k * _m6.pi / 16 for k in range(17)]]
    o.append(PL(arc_o, SIG, 1.3))
    o.append(T(x0 + 80, y0 + 32, "すき間あり（ティアドロップ）", "middle", 10.5, INK))
    o.append(T(130, 250, "縁を丸めて手を切らない。縁の剛性も上がる", "middle", 10, MUT))
    # バーリング
    o.append(T(430, 28, "バーリングタップ（断面）", "middle", 12, INK, True))
    cx, y0 = 430, 180
    o.append(RECT(cx - 130, y0, 100, t, 0, SSOFT, SIG, 1.3))
    o.append(RECT(cx + 30, y0, 100, t, 0, SSOFT, SIG, 1.3))
    for sg in (-1, 1):
        xo = cx + sg * 30
        xi = cx + sg * 20
        o.append(_p06([(xo, y0), (xo, y0 + t), (xo, y0 + 50), (xi, y0 + 50), (xi, y0 + t), (xi, y0)], SIG, SSOFT, 1.3))
        for k in range(6):
            yy = y0 + 3 + k * 8
            o.append(W(xi, yy, xi - sg * 4, yy + 4, xi, yy + 8, c=INK, lw=1))
    o.append(DIM(cx + 150, y0, cx + 150, y0 + 50, None, MUT))
    o.append(T(cx + 158, y0 + 30, "高さ ≈ 2t", "start", 10, INK))
    o.append(DIM(cx - 150, y0, cx - 150, y0 + t, None, MUT))
    o.append(T(cx - 156, y0 + 8, "t", "end", 10, INK))
    o.append(T(cx, y0 - 30, "下穴の縁を筒状に押し出し、", "middle", 10, MUT))
    o.append(T(cx, y0 - 16, "内側にねじを立てる", "middle", 10, MUT))
    o.append(T(cx, 250, "かかるねじ山: 平板 t/p → 筒の高さ/p", "middle", 10, MUT))
    # 圧入ナット
    o.append(T(730, 28, "圧入ナット（断面）", "middle", 12, INK, True))
    cx, y0 = 730, 150
    o.append(RECT(cx - 110, y0, 80, t, 0, SSOFT, SIG, 1.3))
    o.append(RECT(cx + 30, y0, 80, t, 0, SSOFT, SIG, 1.3))
    # ナット本体（つば付き）
    o.append(_p06([(cx - 38, y0 - 34), (cx + 38, y0 - 34), (cx + 38, y0), (cx + 30, y0), (cx + 30, y0 + 3), (cx + 26, y0 + 6), (cx + 30, y0 + t),
                   (cx - 30, y0 + t), (cx - 26, y0 + 6), (cx - 30, y0 + 3), (cx - 30, y0), (cx - 38, y0)], MUT, SCR, 1.3))
    o.append(RECT(cx - 12, y0 - 34, 24, 34 + t, 0, "var(--panel)", MUT, 1.1))
    for k in range(5):
        yy = y0 - 31 + k * 8
        o.append(W(cx - 12, yy, cx - 8, yy + 4, cx - 12, yy + 8, c=INK, lw=1))
        o.append(W(cx + 12, yy, cx + 8, yy + 4, cx + 12, yy + 8, c=INK, lw=1))
    o.append(W(cx + 28, y0 + 5, cx + 70, y0 + 40, c=FNT, lw=1))
    o.append(T(cx + 72, y0 + 52, "板の材料が溝へ流れ込む", "middle", 10, SIG))
    o.append(T(cx + 72, y0 + 66, "（抜け止め）", "middle", 10, SIG))
    o.append(T(cx - 50, y0 - 44, "ぎざぎざで回り止め", "middle", 10, MUT))
    o.append(T(cx, 250, "板はナットより柔らかいこと", "middle", 10, MUT))
    return SVG(860, 270, o, "縁と締結の加工。ヘミングは縁の折り返し、バーリングタップは薄い板でねじ山を増やす加工、圧入ナットは板にナットを押し込んで固定する部品。")
F["e06_fasten"] = _e06_fasten()

# ---- 溶接 ----
def _e06_weld():
    o = []
    # 左: スポット溶接
    cx, cy = 220, 160
    o.append(T(cx, 28, "スポット溶接", "middle", 12, INK, True))
    o.append(RECT(cx - 150, cy - 12, 200, 12, 0, SSOFT, SIG, 1.3))
    o.append(RECT(cx - 50, cy, 200, 12, 0, SSOFT, SIG, 1.3))
    o.append(_p06([(cx - 14, cy - 80), (cx + 14, cy - 80), (cx + 14, cy - 26), (cx + 6, cy - 12), (cx - 6, cy - 12), (cx - 14, cy - 26)], MUT, SCR, 1.3))
    o.append(_p06([(cx - 14, cy + 92), (cx + 14, cy + 92), (cx + 14, cy + 38), (cx + 6, cy + 12), (cx - 6, cy + 12), (cx - 14, cy + 38)], MUT, SCR, 1.3))
    o.append('<ellipse cx="%g" cy="%g" rx="12" ry="7" fill="%s" stroke="%s" stroke-width="1.4"/>' % (cx, cy, ASOFT, ALI))
    o.append(T(cx + 20, cy - 40, "電極", "start", 10.5, MUT))
    o.append(ARR(cx - 40, cy - 70, cx - 40, cy - 40, INK, 1.5, 6))
    o.append(ARR(cx - 40, cy + 82, cx - 40, cy + 52, INK, 1.5, 6))
    o.append(T(cx - 48, cy - 56, "加圧", "end", 10, INK))
    o.append(W(cx + 10, cy + 3, cx + 60, cy + 40, c=FNT, lw=1))
    o.append(T(cx + 62, cy + 52, "ナゲット（溶けて固まった点）", "start", 10, ALI))
    o.append(DIM(cx - 50, cy + 26, cx + 50, cy + 26, None, MUT))
    o.append(T(cx - 56, cy + 30, "重ねしろ", "end", 10, MUT))
    o.append(T(cx, 280, "重ねた 2 枚を挟み、大電流で点状に溶かす。ゆがみが小さい", "middle", 10, MUT))
    # 右: アーク溶接の角
    cx, cy = 640, 170
    o.append(T(cx, 28, "アーク溶接（箱の角）", "middle", 12, INK, True))
    o.append(RECT(cx - 120, cy, 120, 12, 0, SSOFT, SIG, 1.3))
    o.append(RECT(cx, cy - 108, 12, 120, 0, SSOFT, SIG, 1.3))
    o.append(_p06([(cx, cy), (cx - 22, cy), (cx, cy - 22)], ALI, ASOFT, 1.4))
    o.append(T(cx - 30, cy - 26, "溶接ビード", "end", 10.5, ALI))
    o.append(PL([(cx - 120, cy + 30), (cx - 60, cy + 22), (cx, cy + 32)], ALI, 1.2, "4 3"))
    o.append(T(cx - 60, cy + 52, "熱でゆがむ（溶接ひずみ）", "middle", 10, ALI))
    o.append(T(cx, 280, "連続した継ぎ目ができる。見える面は研磨で仕上げる", "middle", 10, MUT))
    return SVG(860, 300, o, "溶接の 2 つの方法。スポット溶接は重ねしろと両側からの電極の通り道が要る。アーク溶接は継ぎ目をふさげるがゆがみやすい。")
F["e06_weld"] = _e06_weld()
