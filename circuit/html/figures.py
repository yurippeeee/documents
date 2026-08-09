# -*- coding: utf-8 -*-
"""circuit シリーズの図版（インライン SVG）。

配色はページの CSS 変数を参照するので、ダーク/ライト両対応になる。
座標系は viewBox で、幅は 720 を基準にする。
"""

F = {}

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"
ALI = "var(--alias)"
BLU = "var(--blue)"
FNT = "var(--faint)"
LIN = "var(--line)"
PAN = "var(--panel)"
SCR = "var(--screen)"
MONO = "var(--mono)"

def E(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def SVG(w, h, body, cap=None):
    s = ('<figure class="dia"><svg viewBox="0 0 %d %d" width="%d" role="img" '
         'preserveAspectRatio="xMidYMid meet">%s</svg>' % (w, h, w, "".join(body)))
    if cap:
        s += '<figcaption>%s</figcaption>' % cap
    return s + '</figure>'

# ---------- 基本要素 ----------
def T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=True):
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s"'
            ' font-family="%s" font-weight="%s">%s</text>'
            % (x, y, a, sz, c, MONO if mono else "var(--sans)", "700" if b else "400", E(s)))

def W(*p, **k):
    c = k.get("c", MUT); lw = k.get("lw", 1.6); dash = k.get("dash")
    d = " ".join("%g,%g" % (p[i], p[i+1]) for i in range(0, len(p), 2))
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round" stroke-linejoin="round"%s/>' % (d, c, lw, da))

def D(x, y, c=MUT, r=3.4):
    return '<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (x, y, r, c)

def O(x, y, r=4.2, c=MUT):
    return ('<circle cx="%g" cy="%g" r="%g" fill="%s" stroke="%s" stroke-width="1.6"/>'
            % (x, y, r, PAN, c))

def RECT(x, y, w, h, r=5, fill=PAN, c=LIN, lw=1.4):
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" stroke="%s"'
            ' stroke-width="%g"/>' % (x, y, w, h, r, fill, c, lw))

def ARR(x1, y1, x2, y2, c=MUT, lw=1.6, head=6):
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - head * math.cos(a), y2 - head * math.sin(a)
    p = "%g,%g %g,%g %g,%g" % (
        x2, y2,
        hx - head * 0.45 * math.sin(a), hy + head * 0.45 * math.cos(a),
        hx + head * 0.45 * math.sin(a), hy - head * 0.45 * math.cos(a))
    return (W(x1, y1, hx, hy, c=c, lw=lw)
            + '<polygon points="%s" fill="%s"/>' % (p, c))

# ---------- 受動素子 ----------
def RES(x, y, lab=None, horiz=True, c=INK, sub=None):
    """抵抗（中心 x,y／リード長は呼び出し側で引く）"""
    o = []
    if horiz:
        o.append(RECT(x - 19, y - 8, 38, 16, 3, PAN, c, 1.6))
        if lab: o.append(T(x, y - 14, lab, "middle", 11, MUT))
        if sub: o.append(T(x, y + 22, sub, "middle", 10, FNT))
    else:
        o.append(RECT(x - 8, y - 19, 16, 38, 3, PAN, c, 1.6))
        if lab: o.append(T(x + 14, y - 2, lab, "start", 11, MUT))
        if sub: o.append(T(x + 14, y + 12, sub, "start", 10, FNT))
    return "".join(o)

def CAP(x, y, lab=None, horiz=False, c=INK, pol=False, sub=None):
    o = []
    if horiz:
        o += [W(x - 4, y - 12, x - 4, y + 12, c=c, lw=2),
              W(x + 4, y - 12, x + 4, y + 12, c=c, lw=2)]
        if lab: o.append(T(x, y - 18, lab, "middle", 11, MUT))
    else:
        o += [W(x - 13, y - 4, x + 13, y - 4, c=c, lw=2),
              W(x - 13, y + 4, x + 13, y + 4, c=c, lw=2)]
        if lab: o.append(T(x + 19, y + 1, lab, "start", 11, MUT))
        if sub: o.append(T(x + 19, y + 14, sub, "start", 10, FNT))
    if pol:
        o.append(T(x - 19, y - 8, "+", "middle", 12, MUT))
    return "".join(o)

def IND(x, y, lab=None, horiz=True, c=INK, sub=None):
    o = []
    if horiz:
        d = "M %g %g " % (x - 21, y) + " ".join(
            "a 7 7 0 0 1 14 0" for _ in range(3))
        o.append('<path d="%s" fill="none" stroke="%s" stroke-width="1.8"/>' % (d, c))
        if lab: o.append(T(x, y - 14, lab, "middle", 11, MUT))
        if sub: o.append(T(x, y + 20, sub, "middle", 10, FNT))
    else:
        d = "M %g %g " % (x, y - 21) + " ".join(
            "a 7 7 0 0 1 0 14" for _ in range(3))
        o.append('<path d="%s" fill="none" stroke="%s" stroke-width="1.8"/>' % (d, c))
        if lab: o.append(T(x + 14, y - 2, lab, "start", 11, MUT))
    return "".join(o)

def FB(x, y, lab=None, horiz=True, c=INK):
    """フェライトビーズ"""
    o = [RECT(x - 17, y - 9, 34, 18, 9, PAN, c, 1.6)]
    if lab: o.append(T(x, y - 15, lab, "middle", 11, MUT))
    return "".join(o)

# ---------- 電源・GND ----------
def GND(x, y, lab=None, c=FNT):
    o = [W(x, y, x, y + 7, c=c),
         W(x - 11, y + 7, x + 11, y + 7, c=c, lw=2),
         W(x - 7, y + 11, x + 7, y + 11, c=c, lw=2),
         W(x - 3, y + 15, x + 3, y + 15, c=c, lw=2)]
    if lab: o.append(T(x, y + 29, lab, "middle", 10.5, FNT))
    return "".join(o)

def RAIL(x, y, lab, c=MUT, w=26):
    return (W(x - w / 2, y, x + w / 2, y, c=c, lw=2.2)
            + T(x, y - 8, lab, "middle", 11, MUT, True))

# ---------- 能動素子 ----------
def NMOS(x, y, lab=None, mir=False, c=INK, body=False, sub=None):
    """N チャネル MOSFET。x,y はチャネル中心。左からゲート。mir=True で左右反転。"""
    s = -1 if mir else 1
    o = [W(x - s * 22, y, x - s * 13, y, c=c),                       # ゲートリード
         W(x - s * 13, y - 12, x - s * 13, y + 12, c=c, lw=2),       # ゲート板
         W(x - s * 6, y - 12, x - s * 6, y - 5, c=c, lw=2),          # チャネル 3 分割
         W(x - s * 6, y - 3, x - s * 6, y + 3, c=c, lw=2),
         W(x - s * 6, y + 5, x - s * 6, y + 12, c=c, lw=2),
         W(x - s * 6, y - 9, x + s * 12, y - 9, c=c),                # ドレイン
         W(x + s * 12, y - 9, x + s * 12, y - 22, c=c),
         W(x - s * 6, y + 9, x + s * 12, y + 9, c=c),                # ソース
         W(x + s * 12, y + 9, x + s * 12, y + 22, c=c),
         W(x - s * 6, y, x + s * 12, y, c=c),                        # バルク
         W(x + s * 12, y, x + s * 12, y + 9, c=c)]
    o.append(ARR(x + s * 4, y, x - s * 2, y, c))                     # バルク矢印（内向き）
    if lab: o.append(T(x + s * 20, y - 2, lab, "start" if not mir else "end", 11, MUT))
    if sub: o.append(T(x + s * 20, y + 12, sub, "start" if not mir else "end", 10, FNT))
    if body:
        o.append(DIO(x + s * 30, y, "up", None, c=FNT))
        o.append(W(x + s * 12, y - 14, x + s * 30, y - 14, x + s * 30, y - 9, c=FNT, lw=1.2))
        o.append(W(x + s * 12, y + 14, x + s * 30, y + 14, x + s * 30, y + 9, c=FNT, lw=1.2))
    return "".join(o)

def PMOS(x, y, lab=None, mir=False, c=INK, sub=None):
    s = -1 if mir else 1
    o = [W(x - s * 22, y, x - s * 13, y, c=c),
         W(x - s * 13, y - 12, x - s * 13, y + 12, c=c, lw=2),
         W(x - s * 6, y - 12, x - s * 6, y - 5, c=c, lw=2),
         W(x - s * 6, y - 3, x - s * 6, y + 3, c=c, lw=2),
         W(x - s * 6, y + 5, x - s * 6, y + 12, c=c, lw=2),
         W(x - s * 6, y - 9, x + s * 12, y - 9, c=c),
         W(x + s * 12, y - 9, x + s * 12, y - 22, c=c),
         W(x - s * 6, y + 9, x + s * 12, y + 9, c=c),
         W(x + s * 12, y + 9, x + s * 12, y + 22, c=c),
         W(x - s * 6, y, x + s * 12, y, c=c),
         W(x + s * 12, y, x + s * 12, y - 9, c=c)]
    o.append(ARR(x - s * 2, y, x + s * 4, y, c))                     # バルク矢印（外向き）
    o.append(O(x - s * 17.5, y, 3.6, c))                             # ゲートの丸（PMOS 印）
    if lab: o.append(T(x + s * 20, y - 2, lab, "start" if not mir else "end", 11, MUT))
    if sub: o.append(T(x + s * 20, y + 12, sub, "start" if not mir else "end", 10, FNT))
    return "".join(o)

def BJT(x, y, lab=None, pnp=False, mir=False, c=INK, sub=None):
    s = -1 if mir else 1
    o = [W(x - s * 22, y, x - s * 9, y, c=c),
         W(x - s * 9, y - 13, x - s * 9, y + 13, c=c, lw=2.2),
         W(x - s * 9, y - 6, x + s * 12, y - 17, c=c),
         W(x + s * 12, y - 17, x + s * 12, y - 26, c=c),
         W(x - s * 9, y + 6, x + s * 12, y + 17, c=c),
         W(x + s * 12, y + 17, x + s * 12, y + 26, c=c)]
    if pnp:
        o.append(ARR(x + s * 4.5, y + 12.6, x - s * 6, y + 7, c))
    else:
        o.append(ARR(x - s * 1, y + 10, x + s * 10.5, y + 15.8, c))
    if lab: o.append(T(x + s * 20, y - 2, lab, "start" if not mir else "end", 11, MUT))
    if sub: o.append(T(x + s * 20, y + 12, sub, "start" if not mir else "end", 10, FNT))
    return "".join(o)

def DIO(x, y, dirn="right", lab=None, c=INK, kind="d"):
    """ダイオード。dirn は電流が流れる向き。"""
    o = []
    if dirn in ("right", "left"):
        s = 1 if dirn == "right" else -1
        o.append('<polygon points="%g,%g %g,%g %g,%g" fill="%s" stroke="%s" stroke-width="1.4"/>'
                 % (x - s * 8, y - 9, x - s * 8, y + 9, x + s * 8, y, PAN if kind == "led" else c, c))
        bar = [x + s * 8, y - 10, x + s * 8, y + 10]
        if kind == "z":
            bar = [x + s * 8 - s * 4, y - 10, x + s * 8, y - 10, x + s * 8, y + 10, x + s * 8 + s * 4, y + 10]
        if kind == "sch":
            bar = [x + s * 8 - s * 5, y - 5, x + s * 8 - s * 5, y - 10, x + s * 8, y - 10,
                   x + s * 8, y + 10, x + s * 8 + s * 5, y + 10, x + s * 8 + s * 5, y + 5]
        o.append(W(*bar, c=c, lw=2))
        if lab: o.append(T(x, y - 17, lab, "middle", 11, MUT))
    else:
        s = 1 if dirn == "down" else -1
        o.append('<polygon points="%g,%g %g,%g %g,%g" fill="%s" stroke="%s" stroke-width="1.4"/>'
                 % (x - 9, y - s * 8, x + 9, y - s * 8, x, y + s * 8, PAN if kind == "led" else c, c))
        o.append(W(x - 10, y + s * 8, x + 10, y + s * 8, c=c, lw=2))
        if lab: o.append(T(x + 16, y + 2, lab, "start", 11, MUT))
    if kind == "led":
        o.append(ARR(x + 6, y - 14, x + 14, y - 22, SIG, 1.3, 5))
        o.append(ARR(x + 1, y - 16, x + 9, y - 24, SIG, 1.3, 5))
    return "".join(o)

def OPA(x, y, lab=None, inv_top=True, w=54, h=52, c=INK, sub=None):
    """演算増幅器。x,y は三角形の中心。入力は左、出力は右。"""
    o = ['<polygon points="%g,%g %g,%g %g,%g" fill="%s" stroke="%s" stroke-width="1.6"/>'
         % (x - w / 2, y - h / 2, x - w / 2, y + h / 2, x + w / 2 + 6, y, PAN, c)]
    yt, yb = y - h / 4, y + h / 4
    o.append(T(x - w / 2 + 11, yt + 4, "−" if inv_top else "+", "middle", 13, MUT))
    o.append(T(x - w / 2 + 11, yb + 4, "+" if inv_top else "−", "middle", 13, MUT))
    if lab: o.append(T(x - 2, y + 4, lab, "middle", 10.5, MUT))
    if sub: o.append(T(x, y + h / 2 + 15, sub, "middle", 10, FNT))
    return "".join(o)

def BOX(x, y, w, h, lab=None, sub=None, c=LIN, fill=PAN, lw=1.5, tc=INK, r=6):
    o = [RECT(x, y, w, h, r, fill, c, lw)]
    if lab and sub:
        o.append(T(x + w / 2, y + h / 2 - 3, lab, "middle", 11.5, tc, True))
        o.append(T(x + w / 2, y + h / 2 + 12, sub, "middle", 10, MUT))
    elif lab:
        o.append(T(x + w / 2, y + h / 2 + 4, lab, "middle", 11.5, tc, True))
    return "".join(o)

def SWI(x, y, lab=None, closed=False, c=INK, horiz=False):
    """スイッチ"""
    o = [O(x, y - 12 if not horiz else 0, 3.2, c)] if False else []
    if horiz:
        o = [O(x - 13, y, 3.2, c), O(x + 13, y, 3.2, c),
             W(x - 10, y, x + 11, y - (0 if closed else 11), c=c)]
    else:
        o = [O(x, y - 13, 3.2, c), O(x, y + 13, 3.2, c),
             W(x, y - 10, x + (0 if closed else 11), y + 11, c=c)]
    if lab: o.append(T(x + 18, y + 3, lab, "start", 11, MUT))
    return "".join(o)

def XTAL(x, y, lab=None, c=INK):
    return (W(x - 9, y - 13, x - 9, y + 13, c=c, lw=2)
            + RECT(x - 5, y - 10, 10, 20, 1, PAN, c, 1.6)
            + W(x + 9, y - 13, x + 9, y + 13, c=c, lw=2)
            + (T(x, y - 20, lab, "middle", 11, MUT) if lab else ""))

# ---------- 波形・グラフ ----------
def AX(x0, y0, x1, y1, xl=None, yl=None, c=LIN):
    """左下原点の軸"""
    o = [W(x0, y0, x0, y1, c=c, lw=1.4), W(x0, y0, x1, y0, c=c, lw=1.4)]
    o.append(ARR(x1 - 8, y0, x1, y0, c, 1.2, 5))
    o.append(ARR(x0, y1 + 8, x0, y1, c, 1.2, 5))
    if xl: o.append(T(x1, y0 + 18, xl, "end", 10.5, FNT))
    if yl: o.append(T(x0 - 4, y1 - 6, yl, "end", 10.5, FNT))
    return "".join(o)

def CURVE(pts, c=SIG, lw=2.2, dash=None):
    d = " ".join("%g,%g" % (p[0], p[1]) for p in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round" stroke-linejoin="round"%s/>' % (d, c, lw, da))

def DIG(x0, y, segs, unit=1.0, hi=0, lo=26, c=SIG, lw=2.2):
    """デジタル波形。segs = [(長さ, 0/1), ...]。y は Low の基準線。"""
    pts = []
    x = x0
    prev = None
    for ln, lv in segs:
        yy = y - (lo - hi) if lv else y
        if prev is not None and prev != lv:
            pts.append((x, y - (lo - hi) if prev else y))
        pts.append((x, yy))
        x += ln * unit
        pts.append((x, yy))
        prev = lv
    return CURVE(pts, c, lw), x

def LANE(x0, x1, y, lab, c=LIN):
    return (W(x0, y, x1, y, c=c, lw=1, dash="3 4")
            + T(x0 - 8, y + 4, lab, "end", 10.5, MUT))
# ===================== 01. 電圧・電流・抵抗 =====================

F["c01_2point"] = SVG(560, 250, [
    RAIL(200, 34, "VCC = 3.3 V"),
    W(200, 34, 200, 62), D(200, 62), T(216, 66, "A 点", "start", 11.5, INK, True),
    W(200, 62, 200, 81), RES(200, 100, "R", False), W(200, 119, 200, 138),
    D(200, 138), T(216, 142, "B 点", "start", 11.5, INK, True),
    W(200, 138, 200, 157), RES(200, 176, "R", False), W(200, 195, 200, 205),
    GND(200, 205, "GND = 0 V"),
    # 測り方の矢印
    ARR(300, 66, 300, 138, SIG, 1.6), ARR(300, 138, 300, 66, SIG, 1.6),
    T(312, 96, "A–B 間 = 1.65 V", "start", 11.5, SIG, True),
    T(312, 112, "「電圧」はこの 2 点の差", "start", 10.5, MUT),
    ARR(430, 66, 430, 205, BLU, 1.6), ARR(430, 205, 430, 66, BLU, 1.6),
    T(442, 130, "A–GND 間 = 3.3 V", "start", 11.5, BLU, True),
    T(442, 146, "基準を書かない電圧に", "start", 10.5, MUT),
    T(442, 160, "意味はない", "start", 10.5, MUT),
], "電圧は必ず 2 点の間で定義される。「B 点の電圧」と言えるのは GND を基準に決めているから")

F["c01_loop"] = SVG(600, 190, [
    RECT(60, 40, 480, 110, 10, "none", LIN, 1.4),
    BOX(70, 24, 110, 32, "電源", None, LIN, PAN),
    BOX(420, 24, 110, 32, "負荷", None, LIN, PAN),
    W(180, 40, 420, 40),
    ARR(270, 40, 320, 40, SIG, 2), T(300, 30, "電流 I", "middle", 11.5, SIG, True),
    W(530, 56, 530, 150), W(70, 56, 70, 150), W(70, 150, 530, 150),
    ARR(330, 150, 270, 150, SIG, 2),
    T(300, 168, "同じ電流が必ず帰ってくる", "middle", 11.5, SIG, True),
    T(300, 100, "この閉じた輪が「回路」", "middle", 12, MUT, True),
    T(300, 118, "どこか 1 か所でも切れれば電流は流れない", "middle", 10.5, FNT),
], "電流は必ずループを作る。行きだけを考えて帰り道を忘れるのが、あらゆる設計事故の出発点になる")

F["c01_divider"] = SVG(560, 250, [
    RAIL(180, 32, "Vin"),
    W(180, 32, 180, 58), RES(180, 77, "R1", False), W(180, 96, 180, 120),
    D(180, 120), W(180, 120, 300, 120),
    T(310, 124, "Vout", "start", 12, SIG, True),
    W(180, 120, 180, 144), RES(180, 163, "R2", False), W(180, 182, 180, 200),
    GND(180, 200),
    # 出力インピーダンス
    T(180, 232, "Vout = Vin · R2/(R1+R2)", "middle", 11.5, MUT, True),
    W(370, 96, 400, 96, dash="4 4"), W(370, 144, 400, 144, dash="4 4"),
    T(452, 84, "外から見た出力抵抗", "middle", 10.5, FNT),
    RECT(400, 100, 104, 44, 5, SCR, LIN, 1.3),
    T(452, 128, "R1∥R2", "middle", 12, MUT, True),
    T(452, 162, "ここに負荷が付くと崩れる", "middle", 10, FNT),
], "分圧比は抵抗比だけで決まるが、外から見た出力抵抗は R1∥R2 になる。ここに負荷がぶら下がると分圧は崩れる")

F["c01_kcl"] = SVG(520, 190, [
    W(90, 95, 240, 95), ARR(150, 95, 200, 95, SIG, 2),
    T(150, 82, "I1", "middle", 12, SIG, True),
    D(240, 95, INK, 4.5),
    W(240, 95, 400, 95), ARR(300, 95, 350, 95, BLU, 2),
    T(330, 82, "I2", "middle", 12, BLU, True),
    W(240, 95, 240, 165), ARR(240, 115, 240, 155, ALI, 2),
    T(256, 140, "I3", "start", 12, ALI, True),
    RECT(300, 130, 190, 40, 6, SCR, LIN, 1.3),
    T(395, 155, "I1 = I2 + I3", "middle", 13, INK, True),
    T(240, 46, "節点", "middle", 11, MUT, True),
    T(240, 62, "入る電流の和 = 出る電流の和", "middle", 10.5, FNT),
], "キルヒホッフの電流則。節点に電荷は溜まらないので、入った分だけ必ず出ていく")

F["c01_kvl"] = SVG(540, 220, [
    RECT(90, 55, 340, 110, 8, "none", LIN, 1.3),
    O(90, 110, 16, INK), T(90, 115, "V", "middle", 12, MUT, True),
    W(90, 94, 90, 55), W(90, 55, 170, 55),
    RES(200, 55, "R1"), W(230, 55, 310, 55),
    RES(340, 55, "R2"), W(370, 55, 430, 55),
    W(430, 55, 430, 165), W(90, 126, 90, 165), W(90, 165, 430, 165),
    ARR(150, 55, 190, 55, SIG, 1.8), ARR(290, 55, 330, 55, SIG, 1.8),
    ARR(300, 165, 240, 165, SIG, 1.8),
    T(260, 100, "一周すると必ず元の電位に戻る", "middle", 11.5, MUT, True),
    RECT(160, 178, 200, 32, 6, SCR, LIN, 1.3),
    T(260, 199, "V − I·R1 − I·R2 = 0", "middle", 12.5, INK, True),
], "キルヒホッフの電圧則。閉ループを一周したときの電位の変化の合計はゼロになる")

# ===================== 02. 受動素子 =====================

F["c02_cesr"] = SVG(600, 190, [
    T(300, 26, "コンデンサの等価回路", "middle", 12, INK, True),
    O(90, 100, 5, INK), W(95, 100, 150, 100),
    RES(180, 100, "ESR", True, INK, "等価直列抵抗"),
    W(210, 100, 250, 100),
    IND(280, 100, "ESL", True, INK, "等価直列インダクタンス"),
    W(310, 100, 355, 100),
    CAP(380, 100, None, True), T(380, 82, "C", "middle", 11, MUT),
    W(405, 100, 460, 100), O(465, 100, 5, INK),
    W(95, 100, 95, 150), W(95, 150, 220, 150),
    RES(260, 150, "Rleak", True), W(300, 150, 465, 150), W(465, 150, 465, 100),
    T(300, 172, "並列の漏れ抵抗（普通は無視できる）", "middle", 10, FNT),
], "理想のコンデンサは存在しない。実際は ESR と ESL が直列に入っていて、これが高周波での性能を決める")

F["c02_zcurve"] = SVG(560, 250, [
    AX(90, 200, 500, 45, "周波数 f", "|Z|"),
    CURVE([(110, 60), (150, 92), (200, 128), (245, 155), (275, 168)], SIG),
    CURVE([(275, 168), (305, 155), (350, 128), (420, 90), (480, 62)], SIG),
    W(275, 168, 500, 168, c=ALI, lw=1.2, dash="4 3"),
    T(496, 162, "ESR", "end", 10.5, ALI, True),
    W(275, 168, 275, 200, c=ALI, lw=1.3),
    T(275, 218, "f_SRF", "middle", 11, ALI, True),
    T(155, 62, "容量性 1/(2πfC)", "middle", 10.5, MUT),
    T(420, 62, "誘導性 2πfL（ESL）", "middle", 10.5, MUT),
    T(275, 236, "これより上ではコンデンサはインダクタとして振る舞う", "middle", 10.5, FNT),
], "自己共振周波数 SRF より上では、容量を増やしても高周波インピーダンスは下がらない")

F["c02_dcbias"] = SVG(560, 240, [
    AX(100, 190, 500, 45, "印加する DC 電圧", "実効容量"),
    W(100, 60, 495, 60, c=LIN, lw=1, dash="3 4"),
    T(96, 64, "100 %", "end", 10, FNT),
    W(100, 118, 495, 118, c=LIN, lw=1, dash="3 4"), T(96, 122, "50 %", "end", 10, FNT),
    W(100, 162, 495, 162, c=LIN, lw=1, dash="3 4"), T(96, 166, "20 %", "end", 10, FNT),
    CURVE([(100, 60), (150, 66), (210, 86), (280, 116), (360, 145), (440, 166), (480, 174)], SIG),
    CURVE([(100, 60), (480, 60)], BLU, 2, "5 4"),
    T(300, 52, "C0G / NP0（変化しない）", "middle", 10.5, BLU),
    T(330, 100, "X5R / X7R", "middle", 11.5, SIG, True),
    W(290, 190, 290, 116, c=ALI, lw=1.2, dash="4 3"),
    T(290, 208, "定格の 50 %", "middle", 10.5, ALI),
    T(480, 208, "定格電圧", "middle", 10.5, FNT),
    T(105, 208, "0 V", "middle", 10.5, FNT),
], "Class 2（X5R/X7R）の MLCC は、電圧をかけただけで容量が落ちる。「10 µF」は無印加時の値でしかない")

F["c02_lesr"] = SVG(600, 175, [
    T(300, 26, "インダクタの等価回路", "middle", 12, INK, True),
    O(110, 95, 5, INK), W(115, 95, 175, 95),
    RES(205, 95, "DCR", True, INK, "巻線の直流抵抗"),
    W(235, 95, 290, 95), IND(320, 95, "L", True), W(350, 95, 425, 95),
    O(430, 95, 5, INK),
    W(115, 95, 115, 145), W(115, 145, 245, 145),
    CAP(270, 145, None, True), T(270, 128, "Cp", "middle", 11, MUT),
    W(295, 145, 430, 145), W(430, 145, 430, 95),
    T(300, 166, "巻線間の浮遊容量（これが自己共振を作る）", "middle", 10, FNT),
], "インダクタにも直流抵抗（DCR）と巻線間容量がある。DCR は損失に、Cp は自己共振に効く")

F["c02_sat"] = SVG(560, 230, [
    AX(100, 180, 500, 45, "電流 I", "インダクタンス L"),
    CURVE([(100, 62), (200, 63), (270, 68), (320, 82), (360, 110), (400, 142), (450, 163), (490, 170)], SIG),
    W(320, 180, 320, 82, c=ALI, lw=1.3, dash="4 3"),
    T(320, 198, "I_sat", "middle", 11.5, ALI, True),
    T(320, 214, "（L が 20〜30 % 落ちる点）", "middle", 10, FNT),
    T(190, 52, "定格内：ほぼ一定", "middle", 10.5, MUT),
    T(430, 105, "磁気飽和", "middle", 11.5, ALI, True),
    T(430, 121, "L が急減", "middle", 10.5, MUT),
    ARR(360, 128, 400, 152, ALI, 1.4),
], "飽和すると L が急に減り、di/dt = V/L が跳ね上がって電流が暴走する。だから平均ではなくピーク電流で選ぶ")

F["c02_beadz"] = SVG(560, 254, [
    AX(100, 185, 500, 45, None, "インピーダンス"),
    CURVE([(100, 183), (160, 176), (220, 150), (280, 104), (330, 76), (380, 72), (430, 82), (480, 96)], ALI),
    CURVE([(100, 183), (170, 168), (230, 132), (280, 104), (320, 96), (380, 112), (440, 140), (480, 156)], BLU, 2, "5 4"),
    T(410, 58, "R 成分（損失＝熱に変える）", "middle", 10.5, ALI, True),
    T(180, 74, "X 成分（インダクタ性）", "middle", 10.5, BLU),
    T(150, 204, "低周波：ほぼ 0 Ω", "middle", 10.5, FNT),
    T(470, 204, "数百 MHz でピーク", "end", 10.5, FNT),
    T(300, 222, "周波数 f →", "middle", 10, FNT),
    T(300, 242, "「抵抗になる帯域」で使うのが正しい使い方", "middle", 10.5, MUT, True),
], "フェライトビーズはインダクタではなく、特定の帯域で抵抗になる部品。低周波ではただのインダクタである点が落とし穴")

F["c02_beadfilter"] = SVG(520, 190, [
    T(90, 76, "電源", "middle", 11.5, MUT, True), W(120, 76, 160, 76),
    FB(190, 76, "ビーズ"), W(220, 76, 280, 76), D(280, 76),
    W(280, 76, 380, 76), T(400, 80, "IC", "start", 12, INK, True),
    W(280, 76, 280, 108), CAP(280, 118, "C"), W(280, 128, 280, 145),
    GND(280, 145),
    RECT(70, 148, 190, 34, 6, SCR, ALI, 1.3),
    T(165, 163, "低周波ではビーズ = L", "middle", 10.5, ALI, True),
    T(165, 177, "C と共振してピークが立つ", "middle", 10, MUT),
], "ビーズと後段のコンデンサは LC 共振を作る。「ビーズを入れたらノイズが増えた」はこれが原因")

F["c02_partno"] = SVG(880, 250, [
    T(300, 26, "MLCC の型番の読み方（例）", "middle", 12, INK, True),
] + [
    T(x, 62, s, "middle", 15, INK, True) for x, s in
    [(80, "GRM"), (140, "188"), (185, "R"), (232, "71C"), (290, "105"), (338, "K"), (390, "A88"), (444, "D")]
] + [
    W(x, 72, x, 72 + 14 * (i + 1), 480, 72 + 14 * (i + 1), c=LIN, lw=1.2) +
    T(490, 76 + 14 * (i + 1), s, "start", 10.5, MUT)
    for i, (x, s) in enumerate([
        (444, "厚み"),
        (390, "電極・パッケージ"),
        (338, "容量許容差 K = ±10 %"),
        (290, "容量 105 = 10 × 10⁵ pF = 1 µF"),
        (232, "温度特性 + 定格電圧（71C = X7R / 16 V）"),
        (185, "誘電体材料"),
        (140, "サイズ 188 = 1608（1.6 × 0.8 mm）"),
        (80, "シリーズ"),
    ])
], "容量値と許容差だけ見て選ぶと事故る。温度特性（X7R か C0G か）と定格電圧が実効容量を決める")

# ===================== 03. 過渡応答とフィルタ =====================

def _rcnet(top_lab, series, shunt, out_lab, cap_title):
    return SVG(500, 190, [
        T(70, 80, top_lab, "middle", 11.5, MUT, True), W(100, 80, 140, 80),
    ] + series + [
        D(300, 80), W(300, 80, 380, 80),
        T(392, 84, out_lab, "start", 12, SIG, True),
        W(300, 80, 300, 106),
    ] + shunt + [
        GND(300, 152),
    ], cap_title)

F["c03_rclp"] = _rcnet("Vin", [RES(200, 80, "R"), W(160, 80, 181, 80), W(219, 80, 300, 80)],
                       [CAP(300, 120, "C"), W(300, 130, 300, 152)],
                       "Vout", "ローパス。高周波ほどコンデンサのインピーダンスが下がり、出力が GND に落とされる")

F["c03_crhp"] = SVG(500, 190, [
    T(70, 80, "Vin", "middle", 11.5, MUT, True), W(100, 80, 176, 80),
    CAP(186, 80, "C", True), W(196, 80, 300, 80),
    D(300, 80), W(300, 80, 380, 80), T(392, 84, "Vout", "start", 12, SIG, True),
    W(300, 80, 300, 101), RES(300, 120, "R", False), W(300, 139, 300, 152),
    GND(300, 152),
], "ハイパス（AC 結合）。直流はコンデンサで切られ、交流だけが通る")

F["c03_rlc"] = SVG(560, 190, [
    T(70, 80, "Vin", "middle", 11.5, MUT, True), W(100, 80, 141, 80),
    RES(160, 80, "R"), W(179, 80, 231, 80),
    IND(260, 80, "L"), W(289, 80, 350, 80),
    D(350, 80), W(350, 80, 430, 80), T(442, 84, "Vout", "start", 12, SIG, True),
    W(350, 80, 350, 106), CAP(350, 120, "C"), W(350, 130, 350, 152),
    GND(350, 152),
    T(280, 168, "R が小さいほど Q が高く、よく振動する（リンギング）", "middle", 10.5, FNT),
], "2 次系。L と C がエネルギーをやりとりし、R がそれを減衰させる")

F["c03_debounce"] = SVG(560, 230, [
    RAIL(150, 40, "VCC"),
    W(150, 40, 150, 64), RES(150, 83, "R 10k", False), W(150, 102, 150, 126),
    D(150, 126), W(150, 126, 300, 126),
    BOX(300, 104, 130, 44, "シュミット入力", None, LIN, PAN),
    W(150, 126, 150, 152), SWI(150, 172, "スイッチ"), W(150, 185, 150, 198),
    GND(150, 198),
    W(240, 126, 240, 152), D(240, 126), CAP(240, 162, "C 100nF"), W(240, 172, 240, 198),
    GND(240, 198),
    T(280, 214, "τ = R·C ≈ 1 ms でエッジを鈍らせ、シュミットで整形する", "middle", 10.5, FNT),
], "RC とシュミットトリガの組合せ。ただし機械接点の跳ね返り自体は消せないので、最終的にはソフトで確定させる")

# ===================== 04. ダイオード =====================

F["c04_sym"] = SVG(520, 175, [
    T(120, 84, "アノード", "middle", 11.5, MUT, True), T(120, 100, "(A)", "middle", 10, FNT),
    W(160, 80, 232, 80), DIO(250, 80, "right"), W(268, 80, 340, 80),
    T(380, 84, "カソード", "middle", 11.5, MUT, True), T(380, 100, "(K)", "middle", 10, FNT),
    ARR(300, 55, 300, 68, SIG, 1.6),
    T(300, 46, "電流はこの向きにだけ流れる", "middle", 10.5, SIG, True),
    RECT(180, 122, 200, 40, 6, SCR, LIN, 1.3),
    W(280, 130, 280, 154, c=INK, lw=3),
    T(295, 140, "実物では帯のある側", "start", 10, MUT),
    T(295, 154, "がカソード", "start", 10, MUT),
    T(225, 147, "実装の向き", "middle", 10.5, MUT, True),
], "記号の三角形が指す向きが電流の向き。実物は帯（カソードマーク）で向きを見る")

F["c04_trr"] = SVG(560, 210, [
    AX(90, 130, 500, 40, "時間 t", "電流"),
    W(90, 130, 500, 130, c=LIN, lw=1),
    CURVE([(100, 70), (230, 70)], SIG, 2.4),
    CURVE([(230, 70), (250, 130), (262, 176), (280, 186), (300, 160), (330, 136), (370, 130), (470, 130)], SIG, 2.4),
    W(250, 130, 250, 196, c=ALI, lw=1.2, dash="3 3"),
    W(330, 130, 330, 196, c=ALI, lw=1.2, dash="3 3"),
    ARR(250, 200, 330, 200, ALI, 1.4), ARR(330, 200, 250, 200, ALI, 1.4),
    T(290, 194, "t_rr", "middle", 11, ALI, True),
    T(160, 60, "順方向に導通", "middle", 10.5, MUT),
    T(400, 168, "逆方向に電流が流れてしまう期間", "middle", 10.5, ALI, True),
], "逆回復。オフにした瞬間、蓄積された電荷が抜けるまで逆向きに電流が流れる。これがスイッチング損失とノイズになる")

F["c04_zeneriv"] = SVG(540, 250, [
    W(90, 130, 480, 130, c=LIN, lw=1.4), W(300, 40, 300, 220, c=LIN, lw=1.4),
    T(474, 148, "V", "end", 11, FNT), T(288, 48, "I", "end", 11, FNT),
    CURVE([(300, 130), (350, 128), (380, 120), (398, 92), (410, 50)], SIG, 2.4),
    CURVE([(300, 130), (250, 131), (200, 132), (172, 133)], SIG, 2.4),
    CURVE([(172, 133), (166, 150), (162, 185), (160, 218)], SIG, 2.4),
    W(172, 130, 172, 210, c=ALI, lw=1.2, dash="3 3"),
    T(172, 228, "V_Z（降伏電圧）", "middle", 11, ALI, True),
    T(400, 68, "順方向", "middle", 10.5, MUT),
    T(240, 118, "逆方向：ほぼ流れない", "middle", 10.5, FNT),
    T(120, 175, "降伏後は電圧が", "middle", 10.5, MUT),
    T(120, 190, "ほぼ一定になる", "middle", 10.5, MUT, True),
], "ツェナーダイオードは、この降伏領域の「電圧がほぼ動かない」性質を基準電圧やクランプに使う")

F["c04_rect"] = SVG(540, 200, [
    T(80, 80, "交流入力", "middle", 11.5, MUT, True), W(125, 80, 202, 80),
    DIO(220, 80, "right"), W(238, 80, 320, 80), D(320, 80),
    W(320, 80, 410, 80), T(424, 84, "直流出力", "start", 12, SIG, True),
    W(320, 80, 320, 106), CAP(320, 120, "C"), T(345, 134, "平滑コンデンサ", "start", 10, FNT),
    W(320, 130, 320, 152), GND(320, 152),
    T(270, 186, "ダイオードで片側だけ通し、コンデンサで谷を埋める", "middle", 10.5, FNT),
], "半波整流 + 平滑。リプルは負荷電流と容量で決まる")

F["c04_flyback"] = SVG(540, 250, [
    RAIL(200, 34, "VCC"), W(200, 34, 200, 58),
    RECT(170, 58, 60, 46, 5, PAN, INK, 1.6),
    T(200, 78, "リレー", "middle", 10.5, MUT), T(200, 92, "コイル", "middle", 10.5, MUT),
    W(200, 104, 200, 130), D(200, 130),
    W(200, 130, 330, 130), W(330, 130, 330, 76), DIO(330, 58, "up"), W(330, 40, 330, 34),
    W(330, 34, 200, 34),
    T(348, 62, "フライバックダイオード", "start", 11, SIG, True),
    T(348, 78, "（逆向きに入れる）", "start", 10, FNT),
    W(200, 130, 200, 156), NMOS(200, 178, "MOSFET"), W(200, 200, 200, 214),
    GND(200, 214),
    RECT(60, 174, 118, 44, 6, SCR, ALI, 1.3),
    T(119, 191, "無いと数百 V の", "middle", 10.5, ALI, True),
    T(119, 206, "逆起電力で破壊", "middle", 10.5, ALI, True),
], "誘導性負荷を切ると v = L·di/dt で高電圧が出る。還流路を用意して、その電流を安全に回す")

F["c04_oring"] = SVG(500, 180, [
    T(80, 66, "電源 A", "middle", 11.5, MUT, True), W(125, 62, 192, 62),
    DIO(210, 62, "right"), W(228, 62, 320, 62),
    T(80, 130, "電源 B", "middle", 11.5, MUT, True), W(125, 126, 192, 126),
    DIO(210, 126, "right"), W(228, 126, 320, 126),
    W(320, 62, 320, 126), D(320, 94), W(320, 94, 400, 94),
    T(412, 98, "負荷", "start", 12, SIG, True),
    T(250, 160, "電圧の高いほうだけが給電し、逆流はダイオードが止める", "middle", 10.5, FNT),
], "OR ing。ダイオードの順方向電圧ぶん損失が出るので、大電流では理想ダイオード IC を使う")

F["c04_clamp"] = SVG(500, 250, [
    RAIL(300, 34, "VDD"), W(300, 34, 300, 62),
    DIO(300, 80, "up"), W(300, 98, 300, 124),
    T(320, 76, "上側 ESD ダイオード", "start", 10.5, MUT),
    D(300, 124), W(120, 124, 300, 124),
    T(80, 128, "入力", "middle", 11.5, MUT, True),
    W(300, 124, 400, 124), T(412, 128, "IC の入力", "start", 11.5, INK, True),
    W(300, 124, 300, 152), DIO(300, 170, "up"), W(300, 188, 300, 206),
    T(320, 166, "下側 ESD ダイオード", "start", 10.5, MUT),
    GND(300, 206),
    RECT(60, 158, 170, 48, 6, SCR, ALI, 1.3),
    T(145, 176, "VDD+0.7 V を超えると", "middle", 10.5, ALI, True),
    T(145, 192, "ここが導通して壊れる", "middle", 10.5, ALI, True),
], "IC の入力ピンには必ずこの 2 個が入っている。絶対最大定格 −0.3 V〜VDD+0.3 V の正体")

F["c04_5vin"] = SVG(560, 150, [
    T(85, 74, "信号 5 V", "middle", 11.5, MUT, True), W(140, 70, 216, 70),
    RES(245, 70, "R"), W(274, 70, 360, 70),
    T(400, 66, "MCU の GPIO", "start", 11.5, INK, True),
    T(400, 82, "（VDD = 3.3 V）", "start", 10, FNT),
    T(245, 112, "ESD ダイオードに流れる電流を制限する", "middle", 10.5, SIG, True),
    T(245, 128, "1〜10 kΩ。ただし帯域は落ちる", "middle", 10, FNT),
], "5 V を 3.3 V の入力に入れるときの最低限の保護。5V トレラントかどうかはピンごとに違う")

# ===================== 05. MOSFET =====================

F["c05_struct"] = SVG(560, 265, [
    T(280, 22, "N チャネル MOSFET の断面", "middle", 12, INK, True),
    RECT(120, 108, 320, 96, 4, SCR, LIN, 1.4),
    T(280, 196, "p 基板", "middle", 12, MUT, True),
    RECT(132, 108, 62, 30, 3, PAN, INK, 1.5), T(163, 128, "n+", "middle", 11, MUT, True),
    RECT(366, 108, 62, 30, 3, PAN, INK, 1.5), T(397, 128, "n+", "middle", 11, MUT, True),
    RECT(194, 92, 172, 16, 2, "var(--signal-soft)", SIG, 1.4),
    T(280, 104, "酸化膜（絶縁体 SiO₂）", "middle", 9.5, SIG),
    RECT(210, 74, 140, 18, 2, PAN, INK, 1.5),
    W(280, 74, 280, 52), T(280, 46, "ゲート (G)", "middle", 11.5, INK, True),
    W(163, 108, 163, 62), T(163, 56, "ソース (S)", "middle", 11.5, INK, True),
    W(397, 108, 397, 62), T(397, 56, "ドレイン (D)", "middle", 11.5, INK, True),
    W(196, 122, 364, 122, c=SIG, lw=2.6, dash="7 4"),
    ARR(300, 158, 300, 130, SIG, 1.5),
    T(300, 174, "V_GS > V_th でここにチャネルができる", "middle", 10.5, SIG, True),
    W(280, 204, 280, 224), T(280, 240, "ボディ (B) — 通常はソースに短絡する", "middle", 10.5, FNT),
], "ゲートは酸化膜で完全に絶縁されている。だから定常状態でゲート電流は流れず、電圧だけで制御できる")

F["c05_bodydio"] = SVG(500, 230, [
    NMOS(210, 115, None),
    T(222, 82, "D", "start", 12, INK, True), T(222, 158, "S・B", "start", 12, INK, True),
    T(176, 111, "G", "end", 12, INK, True),
    W(222, 93, 330, 93), W(330, 93, 330, 100),
    DIO(330, 115, "up"), W(330, 130, 330, 137), W(330, 137, 222, 137),
    T(348, 112, "ボディダイオード", "start", 11.5, ALI, True),
    T(348, 128, "S → D の向きに常時存在する", "start", 10, FNT),
    RECT(70, 178, 360, 40, 6, SCR, LIN, 1.3),
    T(250, 195, "これがあるので、N チャネル MOSFET は「逆向きの電圧」を", "middle", 10.5, MUT),
    T(250, 210, "阻止できない。双方向スイッチには 2 個を背中合わせにする", "middle", 10.5, MUT),
], "構造上、ソースとドレインの間には必ず PN 接合ができる。同期整流ではこれが還流路になる")

F["c05_plateau"] = SVG(560, 240, [
    AX(95, 190, 500, 45, "ゲート電荷 Q_g", "V_GS"),
    CURVE([(100, 188), (140, 150), (170, 128)], SIG, 2.6),
    CURVE([(170, 128), (320, 122)], SIG, 2.6),
    CURVE([(320, 122), (360, 92), (420, 66), (480, 58)], SIG, 2.6),
    RECT(170, 60, 150, 130, 0, "var(--alias-soft)", "none", 0),
    W(170, 128, 170, 190, c=ALI, lw=1.2, dash="3 3"),
    W(320, 122, 320, 190, c=ALI, lw=1.2, dash="3 3"),
    T(245, 108, "ミラープラトー", "middle", 11.5, ALI, True),
    T(245, 208, "この間 V_DS が遷移している", "middle", 10.5, ALI),
    T(245, 224, "＝ 電圧と電流が重なる ＝ 損失が出る", "middle", 10.5, MUT, True),
    T(130, 172, "V_th", "middle", 10.5, FNT),
    T(455, 48, "完全オン", "middle", 10.5, MUT),
], "ゲート電圧が階段状に止まる区間。ここを短くすることがスイッチング損失を減らすということ")

F["c05_gatedrv"] = SVG(520, 220, [
    T(80, 84, "MCU", "middle", 11.5, MUT, True), W(118, 80, 176, 80),
    RES(205, 80, "R_g"), W(234, 80, 300, 80), D(300, 80),
    W(300, 80, 372, 80), T(384, 84, "G", "start", 12, INK, True),
    W(300, 80, 300, 106), RES(300, 125, "R_gs", False, INK), W(300, 144, 300, 166),
    GND(300, 166),
    T(322, 122, "10k〜100k", "start", 10, FNT),
    RECT(60, 168, 200, 42, 6, SCR, LIN, 1.3),
    T(160, 185, "MCU がリセット中でゲートが", "middle", 10.5, MUT),
    T(160, 200, "浮くとき、確実に OFF にする", "middle", 10.5, MUT, True),
], "ゲート抵抗でスイッチング速度を決め、プルダウンで「駆動されていないとき OFF」を保証する")

F["c05_pmoshs"] = SVG(440, 250, [
    RAIL(200, 34, "VCC"), W(200, 34, 200, 58),
    PMOS(200, 82, "PMOS"), W(200, 104, 200, 128),
    RECT(168, 128, 64, 44, 5, PAN, INK, 1.6), T(200, 155, "負荷", "middle", 11.5, MUT, True),
    W(200, 172, 200, 194), GND(200, 194),
    W(178, 82, 110, 82), T(100, 86, "G", "end", 12, INK, True),
    RECT(240, 60, 180, 44, 6, SCR, LIN, 1.3),
    T(330, 78, "V_GS = V_G − VCC", "middle", 10.5, MUT, True),
    T(330, 93, "オンにするには V_G を下げる", "middle", 10.5, MUT),
], "ハイサイドを PMOS でやる場合。ゲートを電源より下げればよいので駆動が簡単")

F["c05_nmoshs"] = SVG(470, 250, [
    RAIL(200, 34, "VCC"), W(200, 34, 200, 58),
    NMOS(200, 82, "NMOS"), W(200, 104, 200, 128), D(200, 128),
    RECT(168, 128, 64, 44, 5, PAN, INK, 1.6), T(200, 155, "負荷", "middle", 11.5, MUT, True),
    W(200, 172, 200, 194), GND(200, 194),
    W(178, 82, 110, 82), T(100, 86, "G", "end", 12, INK, True),
    W(200, 128, 268, 128), T(280, 132, "ソース（動く）", "start", 10.5, ALI),
    RECT(250, 52, 205, 48, 6, SCR, ALI, 1.3),
    T(352, 70, "ソースが負荷側にあるので", "middle", 10.5, MUT),
    T(352, 86, "V_G > VCC + V_th が必要", "middle", 10.5, ALI, True),
], "ハイサイドを NMOS でやると、電源より高いゲート電圧が要る。だからチャージポンプかブートストラップを使う")

# ===================== 06. バイポーラ =====================

F["c06_struct"] = SVG(540, 260, [
    T(270, 26, "NPN トランジスタの構造", "middle", 12, INK, True),
    RECT(190, 52, 160, 46, 4, PAN, INK, 1.5), T(270, 80, "n（コレクタ）", "middle", 11.5, MUT),
    RECT(190, 98, 160, 22, 0, "var(--signal-soft)", SIG, 1.5), T(270, 113, "p（ベース）", "middle", 11, SIG, True),
    RECT(190, 120, 160, 46, 4, PAN, INK, 1.5), T(270, 148, "n（エミッタ）", "middle", 11.5, MUT),
    W(270, 52, 270, 30), T(270, 24, "コレクタ (C)", "middle", 11.5, INK, True),
    W(190, 109, 120, 109), T(110, 113, "ベース (B)", "end", 11.5, INK, True),
    W(270, 166, 270, 190), T(270, 206, "エミッタ (E)", "middle", 11.5, INK, True),
    ARR(400, 109, 360, 109, ALI, 1.5),
    T(410, 100, "ベースは極めて薄い", "start", 10.5, ALI, True),
    T(410, 116, "（1 µm 未満）", "start", 10, FNT),
    RECT(90, 218, 360, 34, 6, SCR, LIN, 1.3),
    T(270, 240, "薄いからこそ、注入された電子の大半がコレクタまで走り抜ける", "middle", 10.5, MUT),
], "ベースが薄いことが増幅の本質。ここが厚いと電子はベースで再結合してしまい、電流増幅率 β が出ない")

F["c06_ce"] = SVG(500, 300, [
    RAIL(230, 34, "VCC"), W(230, 34, 230, 58),
    RES(230, 77, "Rc", False), W(230, 96, 230, 120), D(230, 120),
    W(230, 120, 340, 120), T(352, 124, "Vout", "start", 12, SIG, True),
    W(230, 120, 230, 140),
    BJT(230, 166, "NPN"), W(208, 166, 140, 166), D(140, 166),
    W(140, 166, 90, 166), T(80, 170, "Vin", "end", 12, MUT, True),
    W(140, 166, 140, 206), RES(140, 225, "Rb", False), W(140, 244, 140, 260),
    GND(140, 260),
    W(242, 192, 242, 212), RES(242, 231, "Re", False), W(242, 250, 242, 266),
    GND(242, 266),
    T(300, 231, "エミッタ抵抗（負帰還）", "start", 10.5, MUT),
    T(300, 247, "利得を Rc/Re に固定し、β の", "start", 10, FNT),
    T(300, 261, "ばらつきと温度依存を消す", "start", 10, FNT),
], "エミッタ接地増幅。Re を入れると利得は下がるが、β に依存しない安定な回路になる")

F["c06_ef"] = SVG(470, 270, [
    RAIL(210, 34, "VCC"), W(210, 34, 210, 140),
    BJT(210, 166, "NPN"), W(188, 166, 120, 166), T(110, 170, "Vin", "end", 12, MUT, True),
    W(222, 140, 222, 96), W(222, 96, 210, 96),
    W(222, 192, 222, 208), D(222, 208), W(222, 208, 330, 208),
    T(342, 212, "Vout", "start", 12, SIG, True),
    W(222, 208, 222, 224), RES(222, 243, "Re", False), W(222, 262, 222, 268),
    GND(222, 268),
    RECT(280, 96, 175, 62, 6, SCR, LIN, 1.3),
    T(367, 116, "電圧利得 ≈ 1", "middle", 11, MUT, True),
    T(367, 132, "入力インピーダンス高", "middle", 10.5, MUT),
    T(367, 148, "出力インピーダンス低", "middle", 10.5, MUT),
], "エミッタフォロワ（コレクタ接地）。電圧は増えないが、電流を増やしてインピーダンスを下げる")

F["c06_mirror"] = SVG(520, 290, [
    RAIL(150, 34, "VCC"), W(150, 34, 150, 58),
    O(150, 78, 18, INK), ARR(150, 88, 150, 70, MUT, 1.4),
    T(178, 82, "I_ref", "start", 11.5, MUT, True),
    W(150, 96, 150, 130), D(150, 130), W(150, 130, 330, 130),
    W(150, 130, 150, 152),
    BJT(150, 178, "Q1"), W(128, 178, 128, 130), D(128, 130),
    W(162, 204, 162, 232), GND(162, 232),
    W(330, 130, 330, 152),
    BJT(330, 178, "Q2", False, True), W(352, 178, 352, 130),
    W(318, 204, 318, 232), GND(318, 232),
    W(318, 152, 318, 130),
    ARR(400, 150, 400, 108, SIG, 1.8),
    T(412, 128, "I_out = I_ref", "start", 11.5, SIG, True),
    RECT(60, 244, 400, 36, 6, SCR, LIN, 1.3),
    T(260, 266, "同じ V_BE を与えれば同じ I_C が流れる — IC 内では極めて精度が高い", "middle", 10.5, MUT),
], "カレントミラー。IC の中でこれが使えるのは、隣り合ったトランジスタの特性が揃っているから")

F["c06_diffpair"] = SVG(560, 306, [
    RAIL(280, 30, "VCC"), W(280, 30, 280, 50), W(180, 50, 380, 50),
    W(180, 50, 180, 62), RES(180, 81, "Rc", False), W(180, 100, 180, 124),
    W(380, 50, 380, 62), RES(380, 81, "Rc", False), W(380, 100, 380, 124),
    D(180, 124), W(180, 124, 120, 124), T(110, 128, "Vo1", "end", 11.5, SIG, True),
    D(380, 124), W(380, 124, 440, 124), T(450, 128, "Vo2", "start", 11.5, SIG, True),
    W(180, 124, 192, 124), W(192, 124, 192, 144),
    W(380, 124, 368, 124), W(368, 124, 368, 144),
    BJT(215, 170, "Q1", False, True), W(237, 170, 160, 170), T(150, 174, "Vi1", "end", 11.5, MUT, True),
    BJT(345, 170, "Q2"), W(323, 170, 400, 170), T(410, 174, "Vi2", "start", 11.5, MUT, True),
    W(203, 196, 203, 216), W(357, 196, 357, 216), W(203, 216, 357, 216),
    W(280, 216, 280, 230), D(280, 216),
    O(280, 248, 18, INK), ARR(280, 258, 280, 240, MUT, 1.4),
    T(306, 252, "定電流源", "start", 11, MUT, True),
    W(280, 266, 280, 278), GND(280, 278),
    T(280, 292, "差の分だけ電流が左右に振り分けられる", "middle", 10.5, FNT),
], "差動対。同相の入力は定電流源が吸収し、差だけが出力に現れる。これが CMRR の源")
# ===================== 07. オペアンプの内部 =====================

F["c07_3stage"] = SVG(720, 200, [
    T(52, 74, "V+", "middle", 12, MUT, True), ARR(72, 74, 122, 74, MUT, 1.6),
    T(52, 110, "V−", "middle", 12, MUT, True), ARR(72, 110, 122, 110, MUT, 1.6),
    BOX(124, 52, 138, 80, "① 差動入力段", None, LIN, PAN),
    ARR(262, 92, 302, 92, MUT, 1.6),
    BOX(304, 52, 138, 80, "② 利得段", None, LIN, PAN),
    ARR(442, 92, 482, 92, MUT, 1.6),
    BOX(484, 52, 138, 80, "③ 出力段", None, LIN, PAN),
    ARR(622, 92, 668, 92, SIG, 1.8), T(676, 96, "Vout", "start", 12, SIG, True),
    T(193, 152, "差 → 電流に変換", "middle", 10.5, MUT),
    T(193, 168, "オフセット・I_B・ノイズ・CMRR", "middle", 9.5, FNT),
    T(373, 152, "利得の大半（60〜100 dB）", "middle", 10.5, MUT),
    T(373, 168, "A_OL・GBW・スルーレート", "middle", 9.5, FNT),
    T(553, 152, "低インピーダンスで電流を出す", "middle", 10.5, MUT),
    T(553, 168, "出力振幅・出力電流・容量負荷", "middle", 9.5, FNT),
], "データシートの数値は、この 3 段のどこから来ているかで分類できる")

F["c07_diffin"] = SVG(540, 326, [
    RAIL(270, 30, "VCC"), W(270, 30, 270, 48), W(180, 48, 360, 48),
    W(180, 48, 180, 62), W(360, 48, 360, 62),
    BOX(140, 62, 260, 40, "能動負荷（カレントミラー）", None, LIN, PAN),
    W(180, 102, 180, 132), W(360, 102, 360, 132), D(360, 132),
    W(360, 132, 448, 132), ARR(448, 132, 486, 132, SIG, 1.6),
    T(494, 136, "次段へ", "start", 11.5, SIG, True),
    BJT(215, 172, "Q1", False, True), W(237, 172, 155, 172),
    T(145, 176, "V+", "end", 12, INK, True),
    BJT(325, 172, "Q2"), W(303, 172, 385, 172),
    T(395, 176, "V−", "start", 12, INK, True),
    W(203, 146, 203, 132), W(337, 146, 337, 132),
    W(203, 198, 203, 224), W(337, 198, 337, 224), W(203, 224, 337, 224),
    W(270, 224, 270, 240), D(270, 224),
    O(270, 258, 18, INK), ARR(270, 268, 270, 250, MUT, 1.4),
    T(296, 262, "I_tail（テール電流源）", "start", 11, MUT, True),
    W(270, 276, 270, 288), GND(270, 288),
    T(270, 312, "左右の V_BE のわずかな差が、そのまま出力のオフセットになる", "middle", 10, FNT),
], "差動入力段。Q1/Q2 のミスマッチが入力オフセット電圧、テール電流源の出力抵抗が CMRR を決める")

F["c07_ibias"] = SVG(540, 175, [
    T(80, 74, "信号源", "middle", 11.5, MUT, True), W(122, 70, 176, 70),
    RES(210, 70, "Rs = 1 MΩ"), W(244, 70, 330, 70), D(330, 70),
    W(330, 70, 410, 70), T(422, 74, "V+", "start", 12, INK, True),
    ARR(330, 96, 330, 130, ALI, 1.8),
    T(344, 118, "I_B（入力バイアス電流）", "start", 11, ALI, True),
    T(344, 134, "20 nA × 1 MΩ = 20 mV の誤差", "start", 10, MUT),
], "高インピーダンス源では、わずかなバイアス電流が大きな電圧誤差に化ける。FET 入力を選ぶ理由")

F["c07_cmrange"] = SVG(540, 250, [
    W(120, 42, 440, 42, c=MUT, lw=2.2), T(110, 46, "VCC", "end", 11.5, MUT, True),
    W(120, 208, 440, 208, c=MUT, lw=2.2), T(110, 212, "GND", "end", 11.5, MUT, True),
    RECT(120, 78, 320, 92, 4, "var(--signal-soft)", SIG, 1.4),
    T(280, 130, "同相入力範囲（使える範囲）", "middle", 11.5, SIG, True),
    ARR(280, 72, 280, 48, ALI, 1.5), ARR(280, 48, 280, 72, ALI, 1.5),
    T(292, 64, "上側の制限：能動負荷が飽和する", "start", 10.5, ALI),
    ARR(280, 176, 280, 202, ALI, 1.5), ARR(280, 202, 280, 176, ALI, 1.5),
    T(292, 194, "下側の制限：テール電流源が飽和する", "start", 10.5, ALI),
    T(280, 232, "レール・ツー・レール入力品は、2 組の差動対を切り替えて全域をカバーする", "middle", 10, FNT),
], "入力電圧がこの範囲を外れると、オペアンプは正しく動かない（出力が反転することさえある）")

F["c07_gainstage"] = SVG(540, 300, [
    RAIL(210, 30, "VCC"), W(210, 30, 210, 52),
    BOX(120, 52, 180, 38, "能動負荷", None, LIN, PAN),
    W(210, 90, 210, 122), D(210, 122),
    W(210, 122, 320, 122), ARR(320, 122, 366, 122, SIG, 1.6),
    T(374, 126, "出力段へ", "start", 11.5, SIG, True),
    W(210, 122, 210, 150),
    BJT(210, 176, "Q3"), W(188, 176, 130, 176), T(120, 180, "前段から", "end", 11, MUT),
    W(222, 202, 222, 234), GND(222, 234),
    # 補償容量
    W(188, 176, 188, 262), D(188, 176), W(188, 262, 300, 262),
    CAP(322, 262, None, True), T(322, 244, "C_c", "middle", 11.5, SIG, True),
    W(344, 262, 400, 262), W(400, 262, 400, 122), D(400, 122),
    T(360, 288, "位相補償容量（ミラー効果で実効容量が A 倍になる）", "middle", 10, FNT),
], "利得段。C_c が支配極を作り、GBW = g_m1/(2π·C_c)、スルーレート = I_tail/C_c を同時に決める")

F["c07_bode"] = SVG(580, 250, [
    AX(100, 200, 520, 40, "周波数（対数）", "開ループ利得"),
    CURVE([(105, 58), (185, 58)], SIG, 2.6),
    CURVE([(185, 58), (450, 178)], SIG, 2.6),
    CURVE([(450, 178), (500, 200)], SIG, 2.6, "5 4"),
    W(100, 178, 500, 178, c=LIN, lw=1, dash="3 4"), T(96, 182, "0 dB", "end", 10.5, FNT),
    T(96, 62, "120 dB", "end", 10.5, FNT),
    W(185, 58, 185, 200, c=ALI, lw=1.2, dash="3 3"), T(185, 218, "f_p1（支配極）", "middle", 10.5, ALI, True),
    W(450, 178, 450, 200, c=ALI, lw=1.2, dash="3 3"), T(450, 218, "GBW", "middle", 10.5, ALI, True),
    T(340, 100, "−20 dB/decade", "middle", 11.5, MUT, True),
    T(340, 118, "（極が 1 つだけに見えるようにしてある）", "middle", 10, FNT),
    T(300, 240, "この傾きの間は位相遅れが 90° に留まるので、90° の余裕が残る", "middle", 10, FNT),
], "位相補償の目的は「1 極だけに見せる」こと。だから −20 dB/decade が延々と続く")

F["c07_output"] = SVG(500, 290, [
    RAIL(230, 30, "VCC"), W(230, 30, 230, 78),
    BJT(230, 104, "NPN"), W(208, 104, 150, 104), T(140, 108, "前段", "end", 11, MUT),
    W(242, 78, 242, 30),
    W(242, 130, 242, 148), D(242, 148), W(242, 148, 360, 148),
    T(372, 152, "Vout", "start", 12, SIG, True),
    W(242, 148, 242, 166),
    BJT(230, 192, "PNP", True), W(208, 192, 150, 192),
    W(242, 166, 242, 178),
    W(242, 218, 242, 250), GND(242, 250),
    T(300, 104, "ソース（電流を出す）", "start", 10.5, MUT),
    T(300, 192, "シンク（電流を吸う）", "start", 10.5, MUT),
    RECT(60, 258, 380, 26, 6, SCR, LIN, 1.3),
    T(250, 276, "エミッタフォロワ構成では、レールまで V_BE + 余裕ぶん届かない", "middle", 10.5, MUT),
], "クラス AB 出力段。RRO（レール・ツー・レール出力）品は、ここを MOSFET のコモンソースにしている")

# ===================== 08. オペアンプの応用 =====================

F["c08_feedback"] = SVG(600, 210, [
    T(70, 84, "Vin", "middle", 12, MUT, True), ARR(100, 80, 148, 80, MUT, 1.6),
    O(162, 80, 14, INK), T(162, 85, "+", "middle", 13, MUT, True),
    T(150, 62, "＋", "middle", 10, FNT), T(150, 104, "−", "middle", 11, ALI, True),
    ARR(176, 80, 224, 80, MUT, 1.6),
    BOX(226, 58, 96, 44, "A", "オペアンプ", LIN, PAN),
    W(322, 80, 400, 80), D(400, 80),
    ARR(400, 80, 500, 80, SIG, 1.8), T(512, 84, "Vout", "start", 12, SIG, True),
    W(400, 80, 400, 148), W(400, 148, 322, 148),
    BOX(226, 126, 96, 44, "β", "帰還回路", LIN, PAN),
    W(226, 148, 162, 148), W(162, 148, 162, 94), ARR(162, 120, 162, 96, ALI, 1.6),
    RECT(60, 172, 480, 30, 6, SCR, LIN, 1.3),
    T(300, 192, "A_CL = A/(1 + Aβ) ≈ 1/β（Aβ ≫ 1 のとき）", "middle", 12, INK, True),
], "ループ利得 Aβ が大きいほど、閉ループ利得は素子のばらつきではなく帰還回路（抵抗比）だけで決まる")

F["c08_noninv"] = SVG(540, 250, [
    OPA(280, 100, None), T(226, 82, "+", "middle", 0, MUT),
    W(253, 87, 180, 87), T(170, 91, "Vin", "end", 12, MUT, True),
    W(253, 113, 210, 113), W(210, 113, 210, 170), D(210, 170),
    W(340, 100, 420, 100), D(420, 100), W(420, 100, 470, 100),
    T(482, 104, "Vout", "start", 12, SIG, True),
    W(420, 100, 420, 170), W(420, 170, 279, 170),
    RES(250, 170, "Rf"), W(221, 170, 210, 170),
    W(210, 170, 210, 202), RES(210, 221, "Rg", False), W(210, 240, 210, 244),
    GND(210, 244),
    RECT(330, 190, 200, 30, 6, SCR, LIN, 1.3),
    T(430, 210, "利得 = 1 + Rf/Rg", "middle", 12, INK, True),
], "非反転増幅。入力インピーダンスが高く、利得は必ず 1 以上になる")

F["c08_inv"] = SVG(540, 250, [
    OPA(300, 110, None),
    W(273, 97, 240, 97), D(240, 97),
    RES(200, 97, "Rin"), W(171, 97, 120, 97), T(110, 101, "Vin", "end", 12, MUT, True),
    W(273, 123, 240, 123), W(240, 123, 240, 160),
    W(240, 160, 240, 172), GND(240, 172),
    W(360, 110, 440, 110), D(440, 110), W(440, 110, 490, 110),
    T(502, 114, "Vout", "start", 12, SIG, True),
    W(440, 110, 440, 52), W(440, 52, 269, 52), RES(240, 52, "Rf"), W(211, 52, 240, 52),
    W(240, 52, 240, 97),
    D(240, 97),
    T(240, 143, "仮想接地", "middle", 10.5, SIG, True),
    RECT(330, 190, 200, 30, 6, SCR, LIN, 1.3),
    T(430, 210, "利得 = −Rf/Rin", "middle", 12, INK, True),
], "反転増幅。−入力は仮想的に GND 電位に固定されるので、入力インピーダンスは Rin そのものになる")

F["c08_follower"] = SVG(500, 200, [
    OPA(260, 95, None),
    W(233, 82, 160, 82), T(150, 86, "Vin", "end", 12, MUT, True),
    W(320, 95, 400, 95), D(400, 95), W(400, 95, 450, 95),
    T(462, 99, "Vout", "start", 12, SIG, True),
    W(400, 95, 400, 155), W(400, 155, 220, 155), W(220, 155, 220, 108), W(220, 108, 233, 108),
    RECT(90, 148, 110, 34, 6, SCR, LIN, 1.3),
    T(145, 170, "利得 = 1", "middle", 12, INK, True),
], "ボルテージフォロワ。電圧は変えず、インピーダンスだけを下げる。ADC の前段で最も使う形")

F["c08_diffamp"] = SVG(560, 276, [
    OPA(330, 120, None),
    W(303, 107, 262, 107), W(262, 107, 262, 96), D(262, 96), RES(224, 96, "R1"),
    W(195, 96, 140, 96), T(130, 100, "V1", "end", 12, MUT, True),
    W(262, 96, 262, 52), W(262, 52, 419, 52), RES(390, 52, "R2"),
    W(419, 52, 448, 52), W(448, 52, 448, 120),
    W(303, 133, 250, 133), W(250, 133, 250, 152), D(250, 152), RES(212, 152, "R1"),
    W(183, 152, 140, 152), T(130, 156, "V2", "end", 12, MUT, True),
    W(250, 152, 250, 180), RES(250, 199, "R2", False), W(250, 218, 250, 230), GND(250, 230),
    W(390, 120, 448, 120), D(448, 120), W(448, 120, 500, 120),
    T(512, 124, "Vout", "start", 12, SIG, True),
    RECT(330, 216, 210, 48, 6, SCR, LIN, 1.3),
    T(435, 236, "Vout = (V2 − V1)·R2/R1", "middle", 11.5, INK, True),
    T(435, 254, "CMRR は抵抗のマッチング次第", "middle", 10, MUT),
], "差動増幅。±1 % の抵抗では CMRR は 34 dB 程度しか出ない。精度が要るなら計装アンプを使う")

F["c08_inamp"] = SVG(680, 300, [
    T(340, 26, "計装アンプ（3 オペアンプ構成）", "middle", 12, INK, True),
    T(60, 88, "V1", "middle", 12, MUT, True), W(88, 84, 132, 84),
    OPA(168, 84, "A1", True, 50, 48), W(199, 84, 250, 84), D(250, 84),
    T(60, 226, "V2", "middle", 12, MUT, True), W(88, 222, 132, 222),
    OPA(168, 222, "A2", False, 50, 48), W(199, 222, 250, 222), D(250, 222),
    W(250, 84, 250, 128), W(250, 128, 218, 128), W(218, 128, 218, 96),
    W(143, 96, 218, 96),
    W(250, 222, 250, 178), W(250, 178, 218, 178), W(218, 178, 218, 210),
    W(143, 210, 218, 210),
    W(218, 128, 268, 128), D(218, 128), RES(300, 128, "Rg"), W(332, 128, 380, 128),
    W(380, 128, 380, 178), W(380, 178, 332, 178), RES(300, 178, None), W(268, 178, 218, 178),
    D(218, 178),
    T(300, 155, "Rg 1 本で利得が決まる", "middle", 9.5, FNT),
    W(250, 84, 430, 84), W(430, 84, 430, 140),
    W(250, 222, 430, 222), W(430, 222, 430, 166),
    OPA(486, 153, "A3", True, 56, 58), W(458, 140, 430, 140), W(458, 166, 430, 166),
    W(520, 153, 590, 153), T(602, 157, "Vout", "start", 12, SIG, True),
    T(340, 272, "入力バッファで高インピーダンス化し、差動段のマッチングは IC 内部で作り込まれている",
      "middle", 10.5, MUT),
    T(340, 290, "ブリッジ・シャント・熱電対のような微小な差動信号に使う", "middle", 10, FNT),
], "計装アンプ。抵抗の外付けマッチングに頼らないので、差動増幅より遥かに高い CMRR が得られる")
F["c08_capload"] = SVG(500, 200, [
    T(110, 84, "オペアンプ", "middle", 11.5, MUT, True), W(170, 80, 280, 80), D(280, 80),
    W(280, 80, 380, 80), T(392, 84, "Vout", "start", 12, SIG, True),
    W(280, 80, 280, 106), CAP(280, 120, "C_L"), W(280, 130, 280, 152), GND(280, 152),
    RECT(60, 140, 190, 44, 6, SCR, ALI, 1.3),
    T(155, 158, "出力抵抗 R_o と組んで", "middle", 10.5, MUT),
    T(155, 174, "第 2 の極を作る → 発振", "middle", 10.5, ALI, True),
], "容量負荷は最も多い発振原因。ケーブル 1 m でも 100 pF 程度ある")

F["c08_riso"] = SVG(600, 230, [
    T(85, 96, "オペアンプ", "middle", 11.5, MUT, True), W(145, 92, 200, 92), D(200, 92),
    RES(240, 92, "R_iso"), W(269, 92, 380, 92), D(380, 92),
    W(380, 92, 470, 92), T(482, 96, "負荷", "start", 12, SIG, True),
    W(380, 92, 380, 122), CAP(380, 136, "C_L"), W(380, 146, 380, 168), GND(380, 168),
    W(200, 92, 200, 46), W(200, 46, 291, 46), CAP(320, 46, None, True),
    T(320, 30, "C_f", "middle", 11, MUT), W(340, 46, 380, 46), W(380, 46, 380, 92),
    T(300, 200, "R_iso で C_L を切り離し、C_f で高周波だけ内側から帰還を取る", "middle", 10.5, FNT),
], "絶縁抵抗 + 外側帰還。直流精度を保ったまま、位相余裕を回復する定石")

F["c08_cin"] = SVG(520, 250, [
    OPA(300, 110, None),
    W(273, 97, 220, 97), D(220, 97), W(220, 97, 150, 97),
    T(140, 101, "入力", "end", 11.5, MUT, True),
    W(220, 97, 220, 140), CAP(220, 154, "C_in"), W(220, 164, 220, 186), GND(220, 186),
    T(246, 158, "入力容量（IC + 配線 + ソケット）", "start", 10, FNT),
    W(273, 123, 250, 123), W(250, 123, 250, 210), GND(250, 210),
    W(360, 110, 420, 110), D(420, 110), W(420, 110, 470, 110),
    T(482, 114, "Vout", "start", 12, SIG, True),
    W(420, 110, 420, 48), W(420, 48, 249, 48), RES(220, 48, "R_f"), W(191, 48, 220, 48),
    W(220, 48, 220, 97),
    RECT(60, 196, 130, 40, 6, SCR, ALI, 1.3),
    T(125, 212, "R_f × C_in で極ができ", "middle", 10, ALI, True),
    T(125, 227, "位相余裕を食う", "middle", 10, ALI, True),
], "帰還抵抗と入力容量が作る極。TIA や高抵抗の反転増幅で必ず問題になる。C_f を並列に足して打ち消す")

F["c08_halfrail"] = SVG(500, 250, [
    RAIL(210, 34, "VCC"), W(210, 34, 210, 58),
    RES(210, 77, "R", False), W(210, 96, 210, 120), D(210, 120),
    W(210, 120, 300, 120), T(312, 124, "V_ref = VCC/2", "start", 12, SIG, True),
    T(312, 140, "（仮想的な「GND」）", "start", 10, FNT),
    W(210, 120, 210, 144), RES(210, 163, "R", False), W(210, 182, 210, 200), GND(210, 200),
    W(280, 120, 280, 150), D(280, 120), CAP(280, 164, "C"), W(280, 174, 280, 200), GND(280, 200),
    T(250, 226, "必ずバッファするか、十分な容量でインピーダンスを下げること", "middle", 10.5, FNT),
], "単電源で交流信号を扱うときの基準電位。分圧だけだとインピーダンスが高く、信号で揺れてしまう")

F["c08_unused"] = SVG(500, 190, [
    OPA(270, 95, None),
    W(243, 82, 180, 82), T(170, 86, "V_ref", "end", 11.5, MUT, True),
    W(330, 95, 400, 95), D(400, 95),
    W(400, 95, 400, 150), W(400, 150, 220, 150), W(220, 150, 220, 108), W(220, 108, 243, 108),
    T(300, 172, "未使用のオペアンプは、必ずボルテージフォロワにして入力を固定する", "middle", 10.5, FNT),
], "未使用セクションを開放すると、出力がレールに張り付いて発振し、消費電流と熱が増える")

# ===================== 09. コンパレータと発振 =====================

F["c09_comp"] = SVG(540, 210, [
    OPA(250, 90, None),
    W(223, 77, 150, 77), T(140, 81, "V+", "end", 12, INK, True),
    W(223, 103, 150, 103), T(140, 107, "V−", "end", 12, INK, True),
    W(310, 90, 390, 90), T(402, 94, "Vout（H / L）", "start", 12, SIG, True),
    RECT(140, 140, 300, 54, 6, SCR, LIN, 1.3),
    T(290, 160, "V+ > V−  →  Vout = H", "middle", 11.5, INK, True),
    T(290, 180, "V+ < V−  →  Vout = L", "middle", 11.5, INK, True),
], "コンパレータは「大小を判定して 2 値を出す」部品。オペアンプとは内部設計が別物で、相互に代用できない")

F["c09_chatter"] = SVG(600, 260, [
    T(60, 60, "入力", "end", 11, MUT, True),
    W(70, 88, 560, 88, c=ALI, lw=1.2, dash="4 3"), T(566, 92, "閾値", "start", 10.5, ALI),
    CURVE([(80, 130), (110, 118), (130, 92), (150, 82), (168, 96), (185, 78),
           (205, 92), (225, 70), (250, 86), (275, 66), (300, 84), (330, 74),
           (360, 96), (390, 84), (420, 104), (450, 92), (480, 116), (520, 122), (550, 132)], MUT, 1.8),
    T(60, 196, "出力", "end", 11, ALI, True),
] + [DIG(80, 232, [(0.55, 0), (0.25, 1), (0.12, 0), (0.2, 1), (0.1, 0), (0.25, 1),
                   (0.1, 0), (0.3, 1), (0.15, 0), (0.35, 1), (0.6, 0), (0.2, 1), (0.9, 0)],
         100, 0, 34, ALI)[0]] + [
    T(300, 250, "しきい値付近でノイズが乗ると、出力が何度も切り替わる", "middle", 10.5, FNT),
], "ヒステリシスがないコンパレータの典型的な失敗。閾値を跨ぐたびに出力が暴れる")

F["c09_hyst"] = SVG(560, 250, [
    OPA(300, 100, None),
    W(273, 87, 240, 87), D(240, 87), RES(200, 87, "R1"), W(171, 87, 120, 87),
    T(110, 91, "Vin", "end", 12, MUT, True),
    W(273, 113, 230, 113), D(230, 113), W(230, 113, 150, 113),
    T(140, 117, "V_ref", "end", 12, MUT, True),
    W(230, 113, 230, 178), W(230, 178, 331, 178), RES(360, 178, "R2"), W(389, 178, 430, 178),
    W(430, 178, 430, 100), D(430, 100),
    W(360, 100, 430, 100), W(430, 100, 500, 100), T(512, 104, "Vout", "start", 12, SIG, True),
    T(330, 206, "出力を + 入力に戻す＝正帰還。閾値そのものが動く", "middle", 10.5, SIG, True),
    T(330, 224, "幅はノイズのピーク・ツー・ピークより広く（実務では 50〜200 mV）", "middle", 10, FNT),
], "ヒステリシス。出力が H になると閾値が上がり、L になると下がるので、1 回のエッジで 1 回しか切り替わらない")

F["c09_barkhausen"] = SVG(600, 210, [
    O(150, 80, 14, INK), T(150, 85, "+", "middle", 13, MUT, True),
    ARR(96, 80, 136, 80, MUT, 1.6), T(70, 84, "雑音", "middle", 11, FNT),
    ARR(164, 80, 214, 80, MUT, 1.6),
    BOX(216, 58, 110, 44, "増幅器 A", None, LIN, PAN),
    W(326, 80, 400, 80), D(400, 80), ARR(400, 80, 490, 80, SIG, 1.8),
    T(502, 84, "出力", "start", 12, SIG, True),
    W(400, 80, 400, 148), W(400, 148, 326, 148),
    BOX(216, 126, 110, 44, "帰還 β", None, LIN, PAN),
    W(216, 148, 150, 148), ARR(150, 130, 150, 96, ALI, 1.6),
    RECT(60, 178, 480, 26, 6, SCR, LIN, 1.3),
    T(300, 196, "|Aβ| = 1 かつ 位相が 360°（= 0°）で発振が持続する", "middle", 11.5, INK, True),
], "バルクハウゼンの条件。発振器はこれを満たすように作り、増幅器はこれを避けるように作る——回路は同じもの")

F["c09_pierce"] = SVG(560, 306, [
    BOX(230, 62, 110, 42, "インバータ", None, LIN, PAN),
    W(180, 83, 230, 83), D(180, 83), W(340, 83, 400, 83), D(400, 83),
    W(180, 83, 180, 40), W(180, 40, 400, 40), RES(290, 40, "R_f"), W(400, 40, 400, 83),
    T(180, 118, "XIN", "middle", 11.5, INK, True), T(400, 118, "XOUT", "middle", 11.5, INK, True),
    W(180, 83, 180, 160), W(400, 83, 400, 160),
    W(180, 160, 251, 160), XTAL(290, 160, "水晶"), W(329, 160, 400, 160),
    D(180, 160), D(400, 160),
    W(180, 160, 180, 200), CAP(180, 214, "C1"), W(180, 224, 180, 244), GND(180, 244),
    W(400, 160, 400, 200), CAP(400, 214, "C2"), W(400, 224, 400, 244), GND(400, 244),
    T(290, 292, "C_L = C1·C2/(C1+C2) + C_stray が水晶の指定値に一致していること", "middle", 10.5, FNT),
], "ピアース発振回路。C1・C2 は「発振させるため」ではなく「指定の周波数で発振させるため」にある")

F["c09_rcosc"] = SVG(560, 262, [
    BOX(230, 62, 150, 42, "シュミットインバータ", None, LIN, PAN),
    W(170, 83, 230, 83), D(170, 83), W(380, 83, 450, 83), D(450, 83),
    W(450, 83, 500, 83), T(512, 87, "出力", "start", 12, SIG, True),
    W(170, 83, 170, 36), W(170, 36, 450, 36), RES(310, 36, "R"), W(450, 36, 450, 83),
    W(170, 83, 170, 140), CAP(170, 154, "C"), W(170, 164, 170, 188), GND(170, 188),
    T(300, 226, "C が 2 つの閾値の間を往復する。周期はおよそ R·C で決まる", "middle", 10.5, FNT),
    T(300, 246, "精度は悪い（±10 % 以上）。クロック用途には使えない", "middle", 10.5, MUT, True),
], "シュミットトリガと RC だけの緩和発振。安価だが周波数精度は期待できない")

F["c09_pll"] = SVG(700, 210, [
    T(60, 84, "f_ref", "middle", 12, MUT, True), ARR(90, 80, 130, 80, MUT, 1.6),
    BOX(132, 58, 108, 44, "位相比較器", None, LIN, PAN), ARR(240, 80, 276, 80, MUT, 1.6),
    BOX(278, 58, 108, 44, "ループフィルタ", None, LIN, PAN), ARR(386, 80, 422, 80, MUT, 1.6),
    BOX(424, 58, 78, 44, "VCO", None, LIN, PAN),
    W(502, 80, 570, 80), D(570, 80), ARR(570, 80, 640, 80, SIG, 1.8),
    T(650, 84, "f_out", "start", 12, SIG, True),
    W(570, 80, 570, 150), W(570, 150, 402, 150),
    BOX(294, 128, 108, 44, "分周器 ÷N", None, LIN, PAN),
    W(294, 150, 186, 150), W(186, 150, 186, 102), ARR(186, 126, 186, 104, ALI, 1.6),
    RECT(160, 176, 380, 26, 6, SCR, LIN, 1.3),
    T(350, 194, "定常状態では f_out = N · f_ref になる", "middle", 11.5, INK, True),
], "PLL。位相が揃うまで VCO を動かし続ける負帰還ループ。位相雑音は 20·log(N) だけ増える")

F["c09_clocktree"] = SVG(560, 300, [
    BOX(190, 26, 180, 34, "外部水晶 8 MHz", None, LIN, PAN),
    ARR(280, 60, 280, 84, MUT, 1.5), T(292, 78, "÷M（プリスケーラ）", "start", 10, FNT),
    BOX(190, 86, 180, 34, "1 MHz（PLL 入力）", None, LIN, PAN),
    ARR(280, 120, 280, 144, MUT, 1.5), T(292, 138, "×N（逓倍）", "start", 10, FNT),
    BOX(190, 146, 180, 34, "336 MHz（VCO）", None, SIG, "var(--signal-soft)"),
    ARR(230, 180, 180, 210, MUT, 1.5), T(150, 204, "÷P", "middle", 10, FNT),
    ARR(330, 180, 390, 210, MUT, 1.5), T(410, 204, "÷Q", "middle", 10, FNT),
    BOX(64, 212, 190, 34, "168 MHz（システム）", None, LIN, PAN),
    BOX(306, 212, 190, 34, "48 MHz（USB）", None, LIN, PAN),
    T(280, 276, "PLL の設定は「入力周波数 → VCO 範囲 → 各分周」の順に決める。順番を間違えると", "middle", 10, FNT),
    T(280, 292, "VCO が規定範囲を外れてロックしない", "middle", 10, FNT),
], "MCU のクロックツリー。VCO には動作範囲があるので、逓倍と分周は「VCO を範囲に収める」ように選ぶ")

# ===================== 10. リファレンス =====================

F["c10_brokaw"] = SVG(560, 330, [
    RAIL(280, 30, "VCC"), W(280, 30, 280, 48), W(190, 48, 370, 48),
    W(190, 48, 190, 66), O(190, 84, 18, INK), ARR(190, 94, 190, 76, MUT, 1.3),
    W(190, 102, 190, 132),
    W(370, 48, 370, 66), O(370, 84, 18, INK), ARR(370, 94, 370, 76, MUT, 1.3),
    W(370, 102, 370, 132),
    T(280, 76, "等しい電流（カレントミラー）", "middle", 10, FNT),
    D(190, 132), D(370, 132),
    W(190, 132, 150, 132), W(150, 132, 150, 170), W(370, 132, 410, 132), W(410, 132, 410, 170),
    W(150, 170, 130, 170), W(410, 170, 430, 170),
    T(120, 174, "誤差アンプへ", "end", 10, FNT), T(440, 174, "（2 点を同電位に保つ）", "start", 10, FNT),
    W(190, 132, 190, 152), BJT(190, 178, "Q1", False, True), W(212, 178, 250, 178),
    W(370, 132, 370, 152), BJT(370, 178, "Q2"), W(348, 178, 310, 178),
    W(250, 178, 310, 178),
    T(280, 168, "面積比 1 : N", "middle", 10.5, SIG, True),
    W(178, 204, 178, 240), W(382, 204, 382, 218),
    RES(382, 237, "R2", False), W(382, 256, 382, 268),
    T(404, 236, "ここに ΔV_BE がかかる", "start", 10, SIG),
    W(178, 240, 178, 268), W(178, 268, 382, 268), D(280, 268),
    W(280, 268, 280, 282), RES(280, 301, "R1", False), W(280, 320, 280, 322),
    GND(280, 322),
], "ブロカウ・セル。ΔV_BE = V_T·ln N という PTAT 電圧を R2 に落とし、それを R1 で増幅して V_BE の負の傾きと打ち消す")

F["c10_curvature"] = SVG(540, 220, [
    AX(100, 170, 480, 45, "温度 T", "V_ref"),
    CURVE([(110, 130), (170, 100), (240, 80), (310, 78), (380, 94), (450, 126)], ALI, 2.2, "6 4"),
    CURVE([(110, 100), (200, 98), (290, 97), (380, 98), (455, 100)], SIG, 2.6),
    T(300, 62, "補正なし（2 次の曲がりが残る）", "middle", 10.5, ALI, True),
    T(300, 122, "曲率補正あり", "middle", 10.5, SIG, True),
    T(290, 200, "高精度品（5 ppm/℃ 級）は、この 2 次項を打ち消す回路を持っている", "middle", 10.5, FNT),
], "1 次の温度係数を打ち消しても、放物線状のずれが残る。これを潰すのが曲率補正")

F["c10_seriesshunt"] = SVG(660, 230, [
    T(170, 30, "【シリーズ型】", "middle", 12, INK, True),
    T(90, 88, "Vin", "middle", 11.5, MUT, True), W(120, 84, 150, 84),
    BOX(152, 66, 74, 36, "REF", None, LIN, PAN), W(226, 84, 280, 84), D(280, 84),
    W(280, 84, 330, 84), T(340, 88, "V_ref", "start", 11.5, SIG, True),
    W(280, 84, 280, 112), CAP(280, 126, "C"), W(280, 136, 280, 158), GND(280, 158),
    T(170, 190, "必要な電流だけ流れる", "middle", 10.5, MUT),
    T(170, 206, "低消費・低ドロップアウト", "middle", 10, FNT),
    W(360, 26, 360, 214, c=LIN, lw=1, dash="4 4"),
    T(510, 30, "【シャント型】", "middle", 12, INK, True),
    T(410, 88, "Vin", "middle", 11.5, MUT, True), W(440, 84, 466, 84),
    RES(500, 84, "R"), W(534, 84, 590, 84), D(590, 84),
    W(590, 84, 630, 84), T(640, 88, "V_ref", "start", 11.5, SIG, True),
    W(590, 84, 590, 106), DIO(590, 124, "up", None, INK, "z"), W(590, 142, 590, 158),
    GND(590, 158),
    T(510, 190, "常に電流が流れ続ける", "middle", 10.5, MUT),
    T(510, 206, "抵抗 1 本で済み、極性も自由", "middle", 10, FNT),
], "シリーズ型は 3 端子レギュレータのような使い方、シャント型はツェナーの高精度版という使い方になる")

F["c10_refcap"] = SVG(540, 200, [
    BOX(120, 62, 90, 40, "REF", None, LIN, PAN),
    W(210, 82, 300, 82), D(300, 82), W(300, 82, 400, 82),
    T(412, 86, "ADC の VREF ピン", "start", 11.5, INK, True),
    W(300, 82, 300, 110), CAP(300, 124, "C"), W(300, 134, 300, 156), GND(300, 156),
    T(326, 122, "10 µF + 100 nF など", "start", 10, FNT),
    RECT(60, 156, 220, 38, 6, SCR, ALI, 1.3),
    T(170, 172, "SAR は変換のたびに", "middle", 10.5, ALI, True),
    T(170, 187, "パルス状に電荷を引く", "middle", 10.5, ALI, True),
], "REF ピンのコンデンサは省略できない。無いと変換のたびに基準が沈み、下位ビットが暴れる")

F["c10_ntc"] = SVG(480, 250, [
    RAIL(200, 34, "VDD"), W(200, 34, 200, 58),
    RES(200, 77, "R_pull", False), W(200, 96, 200, 120), D(200, 120),
    W(200, 120, 300, 120), T(312, 124, "ADC へ", "start", 11.5, SIG, True),
    W(200, 120, 200, 144), RES(200, 163, "NTC", False),
    W(196, 146, 216, 182, c=INK, lw=1.3),
    W(200, 182, 200, 200), GND(200, 200),
    RECT(50, 206, 380, 36, 6, SCR, LIN, 1.3),
    T(240, 228, "R_pull = R25 にすると、25 ℃ 付近で感度が最大になる", "middle", 10.5, MUT),
], "NTC は分圧で読む。電源とADC基準に同じ電圧を使えば比率測定になり、電源精度が効かなくなる")

# ===================== 11. CMOS ロジック =====================

F["c11_inv"] = SVG(480, 280, [
    RAIL(230, 34, "VDD"), W(230, 34, 230, 58),
    PMOS(230, 82, "PMOS", False, INK, "入力 L でオン"),
    W(230, 104, 230, 140), D(230, 140), W(230, 140, 330, 140),
    T(342, 144, "出力", "start", 12, SIG, True),
    W(230, 140, 230, 176), NMOS(230, 200, "NMOS", False, INK, "入力 H でオン"),
    W(230, 222, 230, 244), GND(230, 244),
    W(208, 82, 150, 82), W(208, 200, 150, 200), W(150, 82, 150, 200), D(150, 141),
    W(150, 141, 90, 141), T(80, 145, "入力", "end", 12, INK, True),
], "CMOS インバータ。定常状態では必ずどちらか一方だけがオンなので、電流が流れない")

F["c11_vtc"] = SVG(560, 260, [
    AX(110, 200, 490, 42, "V_in", "V_out"),
    CURVE([(115, 55), (200, 56), (240, 60), (262, 78)], SIG, 2.6),
    CURVE([(262, 78), (275, 128), (288, 178)], SIG, 2.6),
    CURVE([(288, 178), (310, 194), (350, 198), (470, 199)], SIG, 2.6),
    W(110, 55, 470, 55, c=LIN, lw=1, dash="3 4"), T(106, 59, "VDD", "end", 10.5, FNT),
    W(275, 200, 275, 128, c=ALI, lw=1.2, dash="3 3"),
    T(275, 218, "V_M（スイッチング閾値）", "middle", 10.5, ALI, True),
    RECT(255, 42, 42, 158, 0, "var(--alias-soft)", "none", 0),
    T(390, 100, "遷移領域", "middle", 11.5, ALI, True),
    T(390, 118, "利得が大きく、", "middle", 10, MUT),
    T(390, 132, "貫通電流が流れる", "middle", 10, MUT, True),
    ARR(345, 110, 300, 118, ALI, 1.4),
    T(280, 244, "入力を中間電位で放置してはいけないのは、ここに居座るから", "middle", 10.5, FNT),
], "入出力特性（VTC）。傾きが急なほど利得が高くノイズに強いが、遷移中は必ず貫通電流が流れる")

F["c11_nand"] = SVG(500, 300, [
    RAIL(230, 30, "VDD"), W(230, 30, 230, 48), W(150, 48, 310, 48),
    W(150, 48, 150, 60), PMOS(150, 84, "P(A)"), W(150, 106, 150, 140),
    W(310, 48, 310, 60), PMOS(310, 84, "P(B)"), W(310, 106, 310, 140),
    W(150, 140, 310, 140), D(230, 140),
    T(230, 128, "並列", "middle", 10.5, SIG, True),
    W(230, 140, 230, 152), D(230, 152), W(230, 152, 380, 152),
    T(392, 156, "Y", "start", 12, SIG, True),
    W(230, 152, 230, 176), NMOS(230, 200, "N(A)"), W(230, 222, 230, 232),
    NMOS(230, 256, "N(B)"), W(230, 278, 230, 286), GND(230, 286),
    T(292, 232, "直列", "middle", 10.5, SIG, True),
    W(128, 84, 90, 84), T(80, 88, "A", "end", 12, INK, True),
    W(288, 84, 380, 84), T(392, 88, "B", "start", 12, INK, True),
    W(208, 200, 90, 200), W(208, 256, 60, 256),
    W(90, 84, 90, 200), W(60, 256, 60, 60), W(60, 60, 380, 60), W(380, 60, 380, 84),
    D(90, 200), D(60, 256),
], "NAND。NMOS が直列、PMOS が並列。両方 H のときだけプルダウン網が導通して出力が L になる")

F["c11_nor"] = SVG(520, 320, [
    T(260, 24, "NOR2：Y = NOT(A + B)", "middle", 12, INK, True),
    RAIL(250, 58, "VDD"), W(250, 58, 250, 70),
    PMOS(250, 94, "P(A)"), W(250, 116, 250, 126),
    PMOS(250, 150, "P(B)"), W(250, 172, 250, 196),
    T(322, 130, "直列", "middle", 10.5, SIG, True),
    D(250, 196), W(250, 196, 400, 196), T(412, 200, "Y", "start", 12, SIG, True),
    W(250, 196, 250, 214), W(170, 214, 330, 214),
    W(170, 214, 170, 226), NMOS(170, 250, "N(A)"), W(170, 272, 170, 296),
    W(330, 214, 330, 226), NMOS(330, 250, "N(B)"), W(330, 272, 330, 296),
    W(170, 296, 330, 296), D(250, 296), W(250, 296, 250, 302), GND(250, 302),
    T(250, 226, "並列", "middle", 10.5, SIG, True),
    # A の配線（左）
    W(228, 94, 100, 94), W(100, 94, 100, 250), W(100, 250, 148, 250), D(100, 250),
    T(90, 98, "A", "end", 12, INK, True),
    # B の配線（右）
    W(272, 150, 452, 150), W(452, 150, 452, 250), W(452, 250, 352, 250), D(452, 250),
    T(462, 154, "B", "start", 12, INK, True),
], "NOR。PMOS が直列になるので遅い。だから合成ツールは NAND を好む")
F["c11_aoi"] = SVG(600, 380, [
    T(300, 24, "AOI21：Y = NOT(A·B + C)", "middle", 12.5, INK, True),
    RAIL(300, 62, "VDD"), W(300, 62, 300, 80), W(200, 80, 400, 80),
    W(200, 80, 200, 92), PMOS(200, 116, "P(A)"), W(200, 138, 200, 172),
    W(400, 80, 400, 92), PMOS(400, 116, "P(B)"), W(400, 138, 400, 172),
    W(200, 172, 400, 172), D(300, 172), T(300, 160, "A ∥ B", "middle", 10, SIG, True),
    W(300, 172, 300, 184), PMOS(300, 208, "P(C)"), W(300, 230, 300, 250),
    T(372, 208, "と直列", "start", 10, SIG),
    D(300, 250), W(300, 250, 500, 250), T(512, 254, "Y", "start", 12, SIG, True),
    W(300, 250, 300, 266), W(210, 266, 390, 266),
    # PDN 左枝：N(A) と N(B) を直列
    W(210, 266, 210, 278), NMOS(210, 302, "N(A)"), W(210, 324, 210, 330),
    NMOS(210, 354, "N(B)"), W(210, 376, 210, 378),
    # PDN 右枝：N(C)
    W(390, 266, 390, 278), NMOS(390, 302, "N(C)"), W(390, 324, 390, 366),
    W(210, 378, 390, 378), W(390, 366, 390, 378),
    T(300, 278, "(A 直列 B) ∥ C", "middle", 10, SIG, True),
], "AOI（AND-OR-Invert）。プルダウン網に論理式をそのまま組み、プルアップ網はその双対（直列↔並列）にする")
F["c11_bufchain"] = SVG(620, 160, [
] + sum([[BOX(70 + i * 108, 58, 26 + i * 12, 44, None, None, LIN, PAN),
          T(83 + i * 108 + i * 6, 86, ["小", "中", "大", "特大"][i], "middle", 12, MUT, True)]
         for i in range(4)], []) + [
    ARR(96 + 0 * 108, 80, 178, 80, MUT, 1.5),
    ARR(190 + 12, 80, 286, 80, MUT, 1.5),
    ARR(310 + 24, 80, 394, 80, MUT, 1.5),
    ARR(430 + 36, 80, 510, 80, MUT, 1.5),
    T(20, 84, "信号", "start", 11.5, MUT, True),
    RECT(512, 58, 90, 44, 6, "var(--signal-soft)", SIG, 1.4),
    T(557, 86, "重い負荷", "middle", 11.5, SIG, True),
    T(310, 132, "1 段あたり 3〜4 倍ずつ大きくするのが、遅延が最小になる比率", "middle", 10.5, FNT),
], "バッファチェーン。いきなり大きなドライバで受けると入力容量が重くなるので、段階的に拡大する")

F["c11_unusedin"] = SVG(600, 230, [
    T(150, 32, "【悪い】開放", "middle", 12, ALI, True),
    BOX(100, 56, 104, 96, None, None, ALI, PAN),
    W(60, 84, 100, 84), W(60, 116, 100, 116),
    T(72, 78, "×", "middle", 15, ALI, True),
    W(204, 100, 250, 100), T(262, 104, "出力", "start", 11, MUT),
    T(152, 106, "?", "middle", 20, ALI, True),
    T(150, 176, "入力が中間電位に漂い", "middle", 10.5, MUT),
    T(150, 192, "貫通電流が流れ続ける", "middle", 10.5, ALI, True),
    T(150, 208, "外来ノイズでも誤動作", "middle", 10.5, MUT),
    W(310, 26, 310, 218, c=LIN, lw=1, dash="4 4"),
    T(440, 32, "【良い】固定", "middle", 12, SIG, True),
    BOX(390, 56, 104, 96, None, None, SIG, PAN),
    W(350, 84, 390, 84), W(350, 116, 390, 116),
    W(350, 84, 350, 116), W(350, 100, 320, 100), GND(320, 100),
    W(494, 100, 540, 100), T(552, 104, "出力", "start", 11, MUT),
    T(442, 106, "L", "middle", 16, SIG, True),
    T(440, 176, "GND か VDD に固定する", "middle", 10.5, MUT),
    T(440, 192, "（未使用 GPIO はアナログ入力が最良）", "middle", 10, FNT),
], "未使用の CMOS 入力を開放にしてはいけない。消費電流が跳ね上がり、誤動作の温床になる")

F["c11_latchup"] = SVG(620, 260, [
    T(310, 28, "寄生サイリスタ（ラッチアップ）", "middle", 12, INK, True),
    RECT(90, 54, 440, 76, 4, SCR, LIN, 1.4),
    RECT(104, 60, 84, 30, 3, PAN, INK, 1.4), T(146, 80, "p+", "middle", 11, MUT, True),
    T(146, 44, "PMOS", "middle", 10, FNT),
    RECT(196, 54, 150, 76, 0, "var(--blue-soft, rgba(61,111,146,.12))", BLU, 1.4),
    T(271, 122, "n ウェル", "middle", 11, BLU, True),
    T(430, 122, "p 基板", "middle", 11, MUT, True),
    RECT(430, 60, 84, 30, 3, PAN, INK, 1.4), T(472, 80, "n+", "middle", 11, MUT, True),
    T(472, 44, "NMOS", "middle", 10, FNT),
    BJT(230, 176, "寄生 PNP", True, True), BJT(400, 176, "寄生 NPN"),
    W(146, 90, 146, 150), W(146, 150, 252, 150),
    W(472, 90, 472, 150), W(472, 150, 388, 150),
    ARR(300, 176, 350, 176, ALI, 1.8), ARR(350, 200, 300, 200, ALI, 1.8),
    T(325, 226, "互いに正帰還を作る", "middle", 11, ALI, True),
    T(325, 242, "一度点火すると電源を切るまで止まらない", "middle", 10, FNT),
], "CMOS の構造には必ず寄生 PNP と NPN が含まれる。ピンから基板に電流が注入されると点火し、大電流が流れて焼損する")

# ===================== 12. タイミング =====================

F["c12_dff"] = SVG(460, 200, [
    BOX(180, 50, 110, 100, None, None, LIN, PAN),
    T(196, 84, "D", "start", 12, MUT, True), T(274, 84, "Q", "end", 12, MUT, True),
    W(120, 78, 180, 78), T(110, 82, "D", "end", 12, INK, True),
    W(290, 78, 350, 78), T(362, 82, "Q", "start", 12, SIG, True),
    W(120, 122, 180, 122), T(110, 126, "CLK", "end", 12, INK, True),
    W(180, 114, 194, 122, 180, 130, c=MUT, lw=1.6),
    T(235, 168, "クロックの立ち上がりで D の値を取り込み、Q に出す", "middle", 10.5, FNT),
], "D フリップフロップ。「エッジの瞬間の値」を捕まえるので、その前後で D が安定している必要がある")

def _fig_setuphold():
    o = []
    x0, x1 = 120, 560
    edge = 380
    su, ho = 46, 34
    # D
    o += [T(110, 66, "D", "end", 12, INK, True)]
    o += [RECT(edge - su, 44, su + ho, 34, 3, "var(--signal-soft)", SIG, 1.3)]
    o += [CURVE([(x0, 74), (170, 74), (182, 44), (edge + ho + 60, 44)], MUT, 2.2)]
    o += [W(edge - su, 30, edge - su, 96, c=SIG, lw=1.2, dash="3 3"),
          W(edge + ho, 30, edge + ho, 96, c=SIG, lw=1.2, dash="3 3")]
    o += [T(edge - su / 2, 24, "セットアップ", "middle", 10, SIG, True),
          T(edge + ho / 2 + 4, 24, "ホールド", "middle", 10, SIG, True)]
    o += [T(edge, 92, "この間 D は動いてはいけない", "middle", 10, FNT)]
    # CLK
    o += [T(110, 146, "CLK", "end", 12, INK, True)]
    o += [CURVE([(x0, 154), (edge, 154), (edge, 118), (x1, 118)], BLU, 2.2)]
    o += [W(edge, 30, edge, 190, c=ALI, lw=1.4)]
    o += [T(edge + 8, 176, "取り込みエッジ", "start", 10.5, ALI, True)]
    # Q
    o += [T(110, 226, "Q", "end", 12, INK, True)]
    o += [CURVE([(x0, 234), (edge, 234), (edge + 46, 234), (edge + 58, 200), (x1, 200)], SIG, 2.2)]
    o += [W(edge, 246, edge + 52, 246, c=MUT, lw=1.2)]
    o += [ARR(edge, 246, edge + 52, 246, MUT, 1.2, 5)]
    o += [T(edge + 60, 250, "t_cq（クロック・ツー・Q 遅延）", "start", 10.5, MUT)]
    return SVG(620, 270, o,
               "3 つの制約。エッジの前後に D が安定している窓が要り、Q が出るまでには遅延がある")

F["c12_setuphold"] = _fig_setuphold()

F["c12_path"] = SVG(620, 190, [
    BOX(90, 62, 88, 62, "FF1", None, LIN, PAN),
    ARR(178, 92, 236, 92, MUT, 1.6),
    BOX(238, 62, 148, 62, "組合せ論理", None, LIN, PAN),
    ARR(386, 92, 444, 92, MUT, 1.6),
    BOX(446, 62, 88, 62, "FF2", None, LIN, PAN),
    W(134, 124, 134, 156), W(490, 124, 490, 156), W(134, 156, 490, 156),
    D(312, 156), W(312, 156, 312, 172), T(312, 186, "CLK", "middle", 11.5, BLU, True),
    T(312, 46, "t_cq + t_logic + t_su < T + skew を満たすこと", "middle", 10.5, FNT),
], "1 つのパス。ここが破れるとセットアップ違反になり、クロックを下げれば直る")

F["c12_skewjitter"] = SVG(640, 240, [
    T(160, 30, "【スキュー】空間的なずれ", "middle", 12, INK, True),
] + [DIG(70, 100, [(0.4, 0), (0.6, 1), (0.6, 0), (0.6, 1), (0.4, 0)], 70, 0, 30, BLU)[0]]
  + [T(60, 96, "FF1", "end", 10.5, MUT)]
  + [DIG(94, 160, [(0.4, 0), (0.6, 1), (0.6, 0), (0.6, 1), (0.4, 0)], 70, 0, 30, ALI)[0]]
  + [T(60, 156, "FF2", "end", 10.5, MUT),
     W(98, 70, 98, 176, c=LIN, lw=1, dash="3 3"), W(122, 70, 122, 176, c=LIN, lw=1, dash="3 3"),
     ARR(98, 196, 122, 196, ALI, 1.3, 5), ARR(122, 196, 98, 196, ALI, 1.3, 5),
     T(110, 214, "ずれ", "middle", 10.5, ALI, True),
     T(160, 232, "配線長の差が原因。等長配線で減らす", "middle", 10, FNT),
     W(340, 24, 340, 232, c=LIN, lw=1, dash="4 4"),
     T(490, 30, "【ジッタ】時間的な揺らぎ", "middle", 12, INK, True)]
  + [DIG(380, 130, [(0.34, 0), (0.32, 1), (0.42, 0), (0.5, 1), (0.28, 0), (0.3, 1),
                    (0.52, 0), (0.58, 1), (0.3, 0)], 62, 0, 42, SIG)[0]]
  + [T(370, 126, "CLK", "end", 10.5, MUT),
     T(490, 176, "周期が T ± Δ で揺れる", "middle", 10.5, MUT, True),
     T(490, 200, "位相雑音・電源変動・PLL が原因", "middle", 10, FNT),
     T(490, 218, "セットアップ余裕を直接削る", "middle", 10, FNT)],
    "スキューは配線で決まる固定のずれ、ジッタは毎周期変わる揺らぎ。対策がまったく違う")

F["c12_meta"] = SVG(560, 250, [
    AX(110, 190, 490, 40, "時間 t", "Q"),
    W(110, 56, 480, 56, c=LIN, lw=1, dash="3 4"), T(106, 60, "VDD", "end", 10.5, FNT),
    W(110, 120, 260, 120, c=ALI, lw=2.4),
    CURVE([(260, 120), (300, 116), (340, 96), (380, 68), (420, 58), (470, 56)], SIG, 2.4),
    CURVE([(260, 120), (300, 124), (340, 146), (380, 176), (420, 187), (470, 189)], SIG, 2.4),
    T(190, 108, "準安定状態", "middle", 11.5, ALI, True),
    T(190, 138, "（中間電位で止まる）", "middle", 10, FNT),
    T(478, 48, "H に確定", "end", 10.5, MUT),
    T(478, 206, "L に確定", "end", 10.5, MUT),
    ARR(115, 210, 260, 210, ALI, 1.4, 5),
    T(190, 228, "この長さが確率的に決まる", "middle", 10.5, MUT, True),
], "メタステーブルは「起きるか」ではなく「どれだけ続くか」の問題。待ち時間が指数の肩にいる")

F["c12_sync2"] = SVG(620, 200, [
    T(60, 84, "非同期入力", "middle", 11, MUT, True), ARR(112, 80, 158, 80, MUT, 1.6),
    BOX(160, 50, 90, 62, "FF1", None, ALI, PAN),
    ARR(250, 80, 296, 80, MUT, 1.6),
    BOX(298, 50, 90, 62, "FF2", None, SIG, PAN),
    ARR(388, 80, 440, 80, SIG, 1.8), T(452, 84, "同期化された信号", "start", 11.5, SIG, True),
    W(205, 112, 205, 148), W(343, 112, 343, 148), W(205, 148, 343, 148),
    D(274, 148), W(274, 148, 274, 164), T(274, 178, "CLK", "middle", 11.5, BLU, True),
    T(205, 40, "ここは準安定になりうる", "middle", 10, ALI),
    T(343, 40, "1 クロック分の整定時間を稼ぐ", "middle", 10, SIG),
], "2 段シンクロナイザ。1 段目が準安定でも、次のエッジまでに整定する確率が桁違いに高くなる")

F["c12_multibit"] = SVG(620, 220, [
    T(310, 28, "【危険】各ビットを独立に同期化する", "middle", 12, ALI, True),
    T(70, 100, "非同期", "middle", 11, MUT, True), T(70, 116, "バス[7:0]", "middle", 11, MUT, True),
] + [W(120, 62 + i * 12, 200, 62 + i * 12, c=MUT, lw=1.2) for i in range(8)] + [
    BOX(200, 52, 150, 108, "8 個のシンクロナイザ", None, ALI, PAN),
] + [W(350, 62 + i * 12, 430, 62 + i * 12, c=MUT, lw=1.2) for i in range(8)] + [
    T(480, 100, "同期バス[7:0]", "middle", 11, MUT, True),
    T(480, 118, "（値が壊れる）", "middle", 10, ALI, True),
    RECT(110, 176, 400, 34, 6, SCR, ALI, 1.3),
    T(310, 197, "ビットごとに整定タイミングが違うので、一瞬ありえない値が出る", "middle", 10.5, ALI, True),
], "複数ビットを独立に同期化してはいけない。グレイコードにするか、ハンドシェイクで受け渡す")

F["c12_spi"] = SVG(600, 200, [
    BOX(80, 58, 110, 88, "MCU", None, LIN, PAN),
    BOX(410, 58, 110, 88, "周辺 IC", None, LIN, PAN),
    ARR(190, 82, 410, 82, MUT, 1.6), T(300, 74, "SCLK", "middle", 11, MUT, True),
    ARR(190, 108, 410, 108, MUT, 1.6), T(300, 100, "MOSI", "middle", 11, MUT, True),
    ARR(410, 134, 190, 134, BLU, 1.6), T(300, 126, "MISO", "middle", 11, BLU, True),
    ARR(190, 170, 410, 170, ALI, 1.4, 5), ARR(410, 170, 190, 170, ALI, 1.4, 5),
    T(300, 190, "SCLK が届き、MISO が返ってくるまでが 1 往復＝速度の上限を決める", "middle", 10.5, FNT),
], "SPI の速度は往復遅延で決まる。T/2 > 2·t_prop + t_co + t_su。配線を伸ばすと直接効く")
# ===================== 13. メモリ =====================

F["c13_sram6t"] = SVG(680, 350, [
    T(340, 24, "SRAM 6T セル — インバータ 2 個のたすき掛け", "middle", 12.5, INK, True),
    RAIL(240, 62, "VDD"), W(240, 62, 240, 82),
    PMOS(240, 106, "M2"), W(240, 128, 240, 158), D(240, 158),
    W(240, 158, 240, 188), NMOS(240, 212, "M1"), W(240, 234, 240, 258), GND(240, 258),
    RAIL(440, 62, "VDD"), W(440, 62, 440, 82),
    PMOS(440, 106, "M4"), W(440, 128, 440, 158), D(440, 158),
    W(440, 158, 440, 188), NMOS(440, 212, "M3"), W(440, 234, 440, 258), GND(440, 258),
    T(240, 150, "Q", "middle", 13, SIG, True), T(440, 150, "QB", "middle", 13, SIG, True),
    # たすき掛け
    W(218, 106, 196, 106), W(196, 106, 196, 212), W(196, 212, 218, 212),
    W(196, 159, 176, 159), D(196, 159),
    W(418, 106, 396, 106), W(396, 106, 396, 212), W(396, 212, 418, 212),
    W(396, 159, 376, 159), D(396, 159),
    W(176, 159, 176, 290), W(176, 290, 486, 290), W(486, 290, 486, 158), W(486, 158, 440, 158),
    W(376, 159, 376, 276), W(376, 276, 292, 276), W(292, 276, 292, 158), W(292, 158, 240, 158),
    # アクセストランジスタ M5 / M6
    W(240, 158, 156, 158), NMOS(134, 158, None, True), W(112, 158, 60, 158),
    T(52, 162, "BL", "end", 11.5, MUT, True), T(134, 128, "M5", "middle", 10.5, MUT, True),
    W(440, 158, 524, 158), NMOS(546, 158, None), W(568, 158, 620, 158),
    T(628, 162, "BLB", "start", 11.5, MUT, True), T(546, 128, "M6", "middle", 10.5, MUT, True),
    W(134, 136, 134, 106), W(134, 106, 100, 106),
    W(546, 136, 546, 106), W(546, 106, 580, 106),
    T(90, 110, "WL", "end", 11.5, INK, True), T(590, 110, "WL", "start", 11.5, INK, True),
    T(340, 320, "Q が H なら QB が L、その QB が Q を H に保つ", "middle", 11, SIG, True),
    T(340, 340, "——どちらの状態も自分で維持する（正帰還ループ）", "middle", 10.5, MUT),
], "6 個のトランジスタで 1 ビット。速いが面積が大きく、電源が入っている限り内容を保つ")

F["c13_dram"] = SVG(520, 260, [
    T(260, 26, "DRAM 1T1C セル", "middle", 12.5, INK, True),
    T(230, 62, "WL", "middle", 11.5, INK, True), W(230, 70, 230, 96),
    NMOS(252, 120, "M", True),
    W(252, 98, 252, 70), W(230, 70, 252, 70),
    W(230, 120, 130, 120), T(118, 124, "BL", "end", 12, MUT, True),
    W(274, 142, 274, 166), CAP(274, 180, "C_s ≈ 25 fF"),
    W(274, 190, 274, 212), GND(274, 212),
    RECT(60, 218, 400, 34, 6, SCR, LIN, 1.3),
    T(260, 240, "トランジスタ 1 個とキャパシタ 1 個。SRAM の 1/20 の面積で済む", "middle", 10.5, MUT),
], "1T1C。ただし電荷は漏れるのでリフレッシュが要り、読み出すと電荷が分配されるので必ず書き戻す")

F["c13_fg"] = SVG(600, 300, [
    T(300, 26, "フローティングゲート（Flash / EEPROM のセル）", "middle", 12.5, INK, True),
    RECT(140, 200, 320, 62, 4, SCR, LIN, 1.4), T(300, 240, "p 基板", "middle", 11.5, MUT, True),
    RECT(150, 200, 70, 28, 3, PAN, INK, 1.4), T(185, 219, "n+", "middle", 11, MUT, True),
    T(185, 280, "ソース", "middle", 10.5, FNT),
    RECT(380, 200, 70, 28, 3, PAN, INK, 1.4), T(415, 219, "n+", "middle", 11, MUT, True),
    T(415, 280, "ドレイン", "middle", 10.5, FNT),
    RECT(220, 176, 160, 24, 2, "var(--alias-soft)", ALI, 1.4),
    T(300, 192, "トンネル酸化膜 8〜10 nm", "middle", 9.5, ALI),
    RECT(214, 140, 172, 30, 3, "var(--signal-soft)", SIG, 1.6),
    T(300, 160, "フローティングゲート", "middle", 11, SIG, True),
    RECT(220, 110, 160, 22, 2, "var(--alias-soft)", ALI, 1.4),
    T(300, 126, "ONO 絶縁膜", "middle", 9.5, ALI),
    RECT(214, 76, 172, 28, 3, PAN, INK, 1.5),
    T(300, 95, "コントロールゲート", "middle", 11, MUT, True),
    W(300, 76, 300, 56), T(300, 50, "CG", "middle", 11.5, INK, True),
    ARR(500, 155, 400, 155, SIG, 1.6),
    T(510, 150, "ここに電子を", "start", 10.5, SIG, True),
    T(510, 166, "閉じ込める", "start", 10.5, SIG, True),
    T(300, 288, "電子が入る → V_th が上がる → 読み出し電圧でオンしない → \"0\"", "middle", 10, FNT),
], "情報は「そのトランジスタの閾値電圧」として保存される。絶縁膜に囲まれているので電源を切っても残る")

F["c13_levels"] = SVG(640, 200, [
    T(320, 26, "1 セルに何段の電圧を詰め込むか", "middle", 12, INK, True),
    T(60, 74, "SLC", "end", 12, INK, True),
    W(80, 70, 600, 70, c=LIN, lw=1),
] + [RECT(80 + i * 300, 56, 200, 28, 4, "var(--signal-soft)", SIG, 1.4) for i in range(2)]
  + [T(180 + i * 300, 76, ["0", "1"][i], "middle", 12, SIG, True) for i in range(2)]
  + [T(320, 104, "余裕が大きい（10⁴〜10⁵ 回）", "middle", 10, FNT),
     T(60, 152, "TLC", "end", 12, INK, True),
     W(80, 148, 600, 148, c=LIN, lw=1)]
  + [RECT(80 + i * 65, 134, 54, 28, 3, "var(--alias-soft)", ALI, 1.3) for i in range(8)]
  + [T(107 + i * 65, 154, str(i), "middle", 11, ALI, True) for i in range(8)]
  + [T(320, 182, "同じずれで隣と重なる（10³ 回）", "middle", 10, FNT)],
    "多値化するほど 1 段あたりの余裕が減る。だから TLC・QLC は書き換え耐性が桁で落ちる")

F["c13_norand"] = SVG(680, 320, [
    T(170, 28, "NOR：各セルが直接ビット線につながる", "middle", 11.5, INK, True),
    W(170, 44, 170, 70), T(170, 60, "", "middle", 10, FNT),
    T(170, 60, "BL", "middle", 11, MUT, True),
    W(170, 66, 170, 262),
] + sum([[NMOS(170, 96 + i * 56, None, True),
          W(148, 96 + i * 56, 90, 96 + i * 56),
          T(80, 100 + i * 56, "WL%d" % i, "end", 10.5, MUT),
          W(182, 118 + i * 56, 182, 134 + i * 56),
          W(182, 74 + i * 56, 182, 66 + i * 56)] for i in range(3)], []) + [
    W(182, 262, 182, 274), GND(182, 274),
    T(170, 306, "1 セルだけ読める＝ランダム読み出し・XIP 可", "middle", 10, SIG, True),
    W(360, 20, 360, 312, c=LIN, lw=1, dash="4 4"),
    T(520, 28, "NAND：セルが直列につながる", "middle", 11.5, INK, True),
    T(520, 60, "BL", "middle", 11, MUT, True), W(520, 66, 520, 82),
    NMOS(520, 100, None, True, INK), W(520, 118, 520, 122),
] + sum([[NMOS(520, 142 + i * 42, None, True),
          W(498, 142 + i * 42, 440, 142 + i * 42),
          T(430, 146 + i * 42, "WL%d" % i, "end", 10.5, MUT),
          W(532, 164 + i * 42, 532, 168 + i * 42)] for i in range(3)], []) + [
    T(520, 254, "⋮", "middle", 14, MUT),
    NMOS(520, 274, None, True, INK), W(532, 292, 532, 300), GND(532, 300),
    T(520, 306, "1 個読むには他を全部オンにする＝ページ単位", "middle", 10, ALI, True),
], "並べ方の違いがすべてを決める。NOR は直接実行でき、NAND は密度で圧勝する代わりにページ単位でしか扱えない")

# ===================== 14. LDO =====================

F["c14_block"] = SVG(640, 250, [
    T(70, 74, "VIN", "middle", 12, MUT, True), W(104, 70, 170, 70),
    BOX(172, 48, 120, 44, "パストランジスタ", None, LIN, PAN),
    W(292, 70, 400, 70), D(400, 70), W(400, 70, 500, 70),
    T(512, 74, "VOUT", "start", 12, SIG, True),
    W(400, 70, 400, 102), RES(400, 121, "R1", False), W(400, 140, 400, 156),
    D(400, 156), W(400, 156, 400, 172), RES(400, 191, "R2", False),
    W(400, 210, 400, 226), GND(400, 226),
    OPA(250, 156, None, True, 54, 52),
    W(232, 70, 232, 48), ARR(232, 130, 232, 96, SIG, 1.6),
    W(232, 130, 232, 156), W(232, 156, 223, 156),
    W(400, 156, 290, 156), W(290, 156, 290, 169), W(290, 169, 223, 169),
    W(223, 143, 180, 143), T(170, 147, "V_REF", "end", 11.5, MUT, True),
    T(250, 200, "誤差アンプ", "middle", 10.5, MUT),
    RECT(60, 190, 150, 30, 6, SCR, LIN, 1.3),
    T(135, 210, "= 非反転増幅", "middle", 11, INK, True),
], "LDO は「基準電圧を増幅する非反転アンプで、出力段が巨大なもの」。V_OUT = V_REF(1 + R1/R2)")

def _pass(kind, title, cap):
    o = [T(80, 84, "VIN", "middle", 12, MUT, True), W(114, 80, 176, 80)]
    if kind == "npn":
        o += [BJT(230, 80, "NPN", False, False), W(242, 54, 242, 42), W(242, 42, 176, 42),
              W(176, 42, 176, 80),
              BJT(340, 80, "NPN"), W(352, 54, 352, 42), W(352, 42, 176, 42),
              W(252, 106, 318, 106), W(252, 106, 252, 92), W(318, 106, 318, 68),
              W(352, 106, 430, 106), W(430, 106, 430, 80)]
        o += [T(285, 150, "V_DO ≈ 2·V_BE + V_CE(sat) ≈ 1.7 V", "middle", 11.5, ALI, True)]
    elif kind == "pnp":
        o += [BJT(280, 80, "PNP", True), W(292, 54, 292, 42), W(292, 42, 176, 42), W(176, 42, 176, 80),
              W(292, 106, 430, 106), W(430, 106, 430, 80)]
        o += [W(258, 80, 200, 80), T(190, 84, "制御", "end", 10.5, MUT)]
        o += [T(285, 150, "V_DO = V_CE(sat) ≈ 0.2〜0.5 V", "middle", 11.5, SIG, True),
              T(285, 168, "ただしベース電流 I_C/β を捨てる", "middle", 10, FNT)]
    else:
        o += [PMOS(300, 80, "PMOS"), W(312, 58, 312, 42), W(312, 42, 176, 42), W(176, 42, 176, 80),
              W(312, 102, 430, 102), W(430, 102, 430, 80)]
        o += [W(278, 80, 210, 80), T(200, 84, "制御", "end", 10.5, MUT)]
        o += [T(300, 150, "V_DO = I_OUT × R_DS(on)（電流に比例）", "middle", 11.5, SIG, True),
              T(300, 168, "ゲート電流がほぼゼロなので I_Q も小さい", "middle", 10, FNT)]
    o += [W(430, 80, 500, 80), T(512, 84, "VOUT", "start", 12, SIG, True),
          T(300, 26, title, "middle", 12, INK, True)]
    return SVG(600, 190, o, cap)

F["c14_npn"] = _pass("npn", "NPN ダーリントン（78xx など）",
                     "出力より 2·V_BE 高いベース電圧が要るので、ドロップアウトが大きい。これは LDO ではない")
F["c14_pnp"] = _pass("pnp", "PNP パストランジスタ（初期の LDO）",
                     "飽和させればよいのでドロップアウトは小さいが、ベース電流がグラウンドに捨てられる")
F["c14_pmos"] = _pass("pmos", "PMOS パストランジスタ（現代の主流）",
                      "ドロップアウトはオン抵抗による電圧降下そのもの。電流が小さければ数十 mV まで下がる")

F["c14_loop"] = SVG(660, 150, [
    BOX(60, 52, 116, 46, "誤差アンプ", None, LIN, PAN), ARR(176, 75, 214, 75, MUT, 1.6),
    BOX(216, 52, 140, 46, "パストランジスタ", None, LIN, PAN), ARR(356, 75, 394, 75, MUT, 1.6),
    BOX(396, 52, 100, 46, "出力", None, LIN, PAN), ARR(496, 75, 534, 75, MUT, 1.6),
    BOX(536, 52, 84, 46, "分圧", None, LIN, PAN),
    W(620, 98, 620, 126), W(620, 126, 118, 126), ARR(118, 126, 118, 100, ALI, 1.6),
    T(360, 142, "この一周がループ。極が 2 つあれば位相が 180° 遅れて発振する", "middle", 10.5, FNT),
], "LDO は負帰還ループそのもの。安定性の議論はオペアンプとまったく同じ枠組みで考える")

F["c14_transient"] = SVG(600, 250, [
    T(70, 66, "負荷電流", "end", 11, MUT, True),
] + [DIG(100, 90, [(1.0, 0), (2.2, 1), (0.9, 0)], 110, 0, 42, BLU)[0]] + [
    T(70, 176, "出力電圧", "end", 11, MUT, True),
    CURVE([(100, 160), (208, 160), (222, 208), (240, 214), (270, 198),
           (310, 178), (360, 166), (430, 161), (462, 160)], SIG, 2.4),
    W(100, 160, 480, 160, c=LIN, lw=1, dash="3 4"),
    W(208, 150, 208, 224, c=ALI, lw=1.2, dash="3 3"),
    ARR(196, 160, 196, 214, ALI, 1.4, 5), ARR(196, 214, 196, 160, ALI, 1.4, 5),
    T(186, 192, "ΔV", "end", 11, ALI, True),
    T(330, 232, "ΔV ≈ I·Δt/C_OUT + I·ESR", "middle", 11.5, INK, True),
    T(330, 40, "負荷が急に増えた瞬間、LDO はまだ気づいていない", "middle", 10.5, FNT),
], "この降下がブラウンアウト閾値に触れると MCU がリセットする。「Wi-Fi 送信の瞬間だけ落ちる」の正体")

# ===================== 15. スイッチング電源 =====================

F["c15_buck"] = SVG(640, 260, [
    T(320, 26, "Buck（降圧）コンバータ", "middle", 12.5, INK, True),
    T(80, 88, "VIN", "middle", 12, MUT, True), W(112, 84, 160, 84), D(160, 84),
    RECT(160, 66, 60, 36, 4, PAN, INK, 1.6), T(190, 89, "SW1", "middle", 11, MUT, True),
    W(220, 84, 280, 84), D(280, 84),
    W(280, 84, 310, 84), IND(340, 84, "L"), W(370, 84, 430, 84), D(430, 84),
    W(430, 84, 510, 84), T(522, 88, "VOUT", "start", 12, SIG, True),
    W(280, 84, 280, 118), RECT(250, 118, 60, 36, 4, PAN, INK, 1.6),
    T(280, 141, "SW2", "middle", 11, MUT, True), W(280, 154, 280, 196),
    W(430, 84, 430, 130), CAP(430, 144, "C_OUT"), W(430, 154, 430, 196),
    W(160, 84, 160, 130), CAP(160, 144, "C_IN"), W(160, 154, 160, 196),
    W(160, 196, 490, 196), GND(320, 196),
    T(280, 66, "SW ノード", "middle", 10, SIG, True),
    RECT(80, 212, 480, 34, 6, SCR, LIN, 1.3),
    T(320, 234, "SW1 と SW2 が交互にオン。ボルト秒平衡から V_OUT = D · V_IN", "middle", 11, INK, True),
], "スイッチは損失ゼロ。インダクタに貯めて配るので、差分を熱で捨てる必要がない")

F["c15_boost"] = SVG(640, 260, [
    T(320, 26, "Boost（昇圧）コンバータ", "middle", 12.5, INK, True),
    T(80, 88, "VIN", "middle", 12, MUT, True), W(112, 84, 145, 84), D(145, 84),
    IND(180, 84, "L"), W(210, 84, 280, 84), D(280, 84),
    W(280, 84, 322, 84), DIO(345, 84, "right", None), W(368, 84, 430, 84), D(430, 84),
    W(430, 84, 510, 84), T(522, 88, "VOUT", "start", 12, SIG, True),
    W(280, 84, 280, 118), RECT(250, 118, 60, 36, 4, PAN, INK, 1.6),
    T(280, 141, "SW", "middle", 11, MUT, True), W(280, 154, 280, 196),
    W(430, 84, 430, 130), CAP(430, 144, "C_OUT"), W(430, 154, 430, 196),
    W(145, 84, 145, 130), CAP(145, 144, "C_IN"), W(145, 154, 145, 196),
    W(145, 196, 490, 196), GND(320, 196),
    RECT(60, 212, 520, 34, 6, SCR, ALI, 1.3),
    T(320, 234, "V_OUT = V_IN/(1−D)。SW を切っても L とダイオードで出力に直結している", "middle", 11, ALI, True),
], "昇圧。入力電流が I_OUT/(1−D) まで増え、シャットダウンしても出力が消えない点に注意")

F["c15_hotloop"] = SVG(660, 280, [
    T(330, 26, "ホットループ（ns で数 A が流れ変わる経路）", "middle", 12, INK, True),
    RECT(150, 52, 340, 150, 8, "var(--alias-soft)", ALI, 2),
    W(200, 84, 200, 130), CAP(200, 96, None), T(200, 74, "C_IN", "middle", 11, MUT, True),
    W(200, 84, 200, 92), W(200, 100, 200, 130),
    W(200, 84, 320, 84), D(320, 84),
    RECT(290, 66, 60, 34, 4, PAN, INK, 1.6), T(320, 88, "ハイ", "middle", 10.5, MUT, True),
    W(320, 100, 320, 128), D(320, 128),
    RECT(290, 128, 60, 34, 4, PAN, INK, 1.6), T(320, 150, "ロー", "middle", 10.5, MUT, True),
    W(320, 162, 320, 186), W(200, 186, 320, 186), W(200, 130, 200, 186),
    W(320, 128, 420, 128), IND(450, 128, "L"), W(480, 128, 540, 128),
    T(552, 132, "出力へ", "start", 11, MUT),
    T(330, 220, "この輪の面積が EMI をほぼ決める", "middle", 11.5, ALI, True),
    RECT(110, 234, 440, 34, 6, SCR, LIN, 1.3),
    T(330, 256, "v = L_loop · di/dt。5 nH × 2 A/ns = 10 V のスパイクが出る", "middle", 11, INK, True),
], "入力コンデンサを VIN ピンと GND ピンの間に最短で置く。他のどの部品よりも優先する")

F["c15_effcurve"] = SVG(560, 250, [
    AX(100, 190, 500, 42, "負荷電流（対数）", "効率"),
    W(100, 62, 490, 62, c=LIN, lw=1, dash="3 4"), T(96, 66, "95 %", "end", 10, FNT),
    W(100, 128, 490, 128, c=LIN, lw=1, dash="3 4"), T(96, 132, "70 %", "end", 10, FNT),
    CURVE([(110, 180), (150, 150), (200, 108), (260, 76), (330, 66), (400, 68), (460, 80)], SIG, 2.6),
    T(165, 82, "軽負荷", "middle", 11, ALI, True),
    T(165, 98, "I_Q とスイッチング損失", "middle", 10, MUT),
    T(430, 118, "重負荷", "middle", 11, ALI, True),
    T(430, 134, "I²R が効く", "middle", 10, MUT),
    T(300, 216, "1 mA        10 mA        100 mA        1 A        3 A", "middle", 10, FNT),
], "効率カーブは山形になる。自分が使う負荷点で読むこと。カタログの最大値は意味を持たない")

F["c15_chain"] = SVG(680, 210, [
    T(60, 88, "12 V", "middle", 12, MUT, True), ARR(92, 84, 132, 84, MUT, 1.6),
    BOX(134, 62, 104, 44, "DC-DC", None, LIN, PAN),
    W(238, 84, 290, 84), D(290, 84),
    T(290, 66, "3.6 V", "middle", 11, MUT, True),
    ARR(290, 84, 340, 84, MUT, 1.6),
    BOX(342, 62, 96, 44, "LDO", None, SIG, PAN),
    ARR(438, 84, 496, 84, SIG, 1.8),
    T(508, 88, "3.3 V（アナログ）", "start", 11.5, SIG, True),
    W(290, 84, 290, 152), ARR(290, 152, 496, 152, BLU, 1.6),
    T(508, 156, "3.3 V（デジタル）", "start", 11.5, BLU, True),
    T(300, 186, "大電力の変換は DC-DC で、アナログ部だけ LDO で仕上げる", "middle", 10.5, FNT),
], "ADC のための定石。LDO にドロップアウトの余裕（0.3 V 以上）を残さないと PSRR が出ない")

# ===================== 16. 電源設計 =====================

F["c16_decap"] = SVG(660, 250, [
    T(165, 30, "【良い】", "middle", 12, SIG, True),
    BOX(80, 52, 70, 44, "IC", None, LIN, PAN),
    W(150, 74, 190, 74), D(190, 74), CAP(190, 92, None, True),
    T(214, 78, "C", "start", 11, MUT, True),
    W(190, 74, 190, 82), W(190, 102, 190, 126), W(190, 126, 240, 126),
    O(240, 126, 5, MUT), T(258, 130, "ビア", "start", 10, FNT),
    W(240, 126, 240, 156), W(80, 156, 300, 156, c=INK, lw=3),
    T(190, 178, "GND プレーン", "middle", 10, FNT),
    T(165, 208, "配線が短い＝インダクタンスが小さい", "middle", 10.5, MUT),
    T(165, 224, "→ 高周波でも効く", "middle", 10.5, SIG, True),
    W(340, 22, 340, 236, c=LIN, lw=1, dash="4 4"),
    T(500, 30, "【悪い】", "middle", 12, ALI, True),
    BOX(390, 52, 70, 44, "IC", None, LIN, PAN),
    W(460, 74, 600, 74), D(600, 74), CAP(600, 92, None, True),
    T(624, 78, "C", "start", 11, MUT, True),
    W(600, 74, 600, 82), W(600, 102, 600, 126), W(600, 126, 620, 126),
    W(620, 126, 620, 156), W(390, 156, 640, 156, c=INK, lw=3),
    T(530, 60, "長い配線 ≈ 数 nH", "middle", 10, ALI, True),
    T(500, 208, "コンデンサ自体の ESL より", "middle", 10.5, MUT),
    T(500, 224, "配線のほうが大きくなる", "middle", 10.5, ALI, True),
], "値より配置。0.1 µF の ESL は 0.5 nH 程度だが、5 mm の配線だけで 5 nH ある")

F["c16_seq"] = SVG(620, 230, [
    BOX(120, 52, 180, 46, "コア電源 1.2 V", None, SIG, PAN),
    BOX(120, 122, 180, 46, "I/O 電源 3.3 V", None, LIN, PAN),
    W(300, 75, 340, 75), W(300, 145, 340, 145), W(340, 75, 340, 145),
    ARR(340, 110, 400, 110, MUT, 1.6),
    BOX(402, 88, 130, 46, "MCU / SoC", None, LIN, PAN),
    ARR(210, 98, 210, 118, SIG, 1.8),
    T(226, 114, "コアが先（または同時）", "start", 10.5, SIG, True),
    RECT(80, 182, 460, 40, 6, SCR, ALI, 1.3),
    T(310, 199, "順番を守らないと、I/O ピンから内部の ESD ダイオードを通って", "middle", 10.5, MUT),
    T(310, 215, "コア電源に電流が流れ込み、ラッチアップの引き金になる", "middle", 10.5, ALI, True),
], "電源シーケンス。投入順より遮断順のほうが難しい——放電の速さで決まってしまうから")

F["c16_super"] = SVG(600, 200, [
    T(70, 84, "電源", "middle", 12, MUT, True), W(108, 80, 160, 80), D(160, 80),
    ARR(160, 80, 300, 80, MUT, 1.6), T(312, 84, "MCU の VDD", "start", 11.5, INK, True),
    W(160, 80, 160, 130), ARR(160, 130, 220, 130, MUT, 1.6),
    BOX(222, 108, 150, 44, "電圧監視 IC", None, LIN, PAN),
    ARR(372, 130, 430, 130, ALI, 1.6), T(442, 134, "MCU の NRST", "start", 11.5, ALI, True),
    RECT(80, 164, 440, 30, 6, SCR, LIN, 1.3),
    T(300, 184, "「中途半端な電圧で MCU が動いている」状態が最も危険", "middle", 10.5, MUT),
], "内蔵 BOR で足りないとき（精度・複数レール・落ち方が速い）は外部スーパーバイザを足す")

F["c16_revprot"] = SVG(560, 210, [
    T(280, 26, "PMOS による逆接続保護", "middle", 12, INK, True),
    T(90, 88, "＋入力", "middle", 11.5, MUT, True), W(134, 84, 200, 84),
    PMOS(250, 84, None), W(262, 62, 262, 50), W(262, 50, 200, 50), W(200, 50, 200, 84),
    W(262, 106, 400, 106), W(400, 106, 400, 84), W(400, 84, 470, 84),
    T(482, 88, "負荷へ", "start", 11.5, SIG, True),
    W(228, 84, 190, 84), W(190, 84, 190, 150), W(190, 150, 300, 150), GND(300, 150),
    T(310, 146, "ゲートは GND（必要ならツェナーで制限）", "start", 10, FNT),
    T(250, 62, "ソースを入力側に", "middle", 10, SIG, True),
    T(280, 190, "損失は I²·R_DS(on) だけ。ダイオードの V_F·I よりずっと小さい", "middle", 10.5, MUT),
], "正しく繋げば V_GS < 0 でオン、逆接ならボディダイオードも逆向きになって電流が流れない")

# ===================== 17. ADC =====================

F["c17_cdac"] = SVG(680, 280, [
    T(340, 26, "電荷再分配型 SAR の内部（容量 DAC）", "middle", 12, INK, True),
    OPA(560, 120, None, True, 50, 54), T(600, 124, "", "middle", 10, MUT),
    W(534, 107, 470, 107), D(470, 107),
    W(534, 133, 500, 133), W(500, 133, 500, 190), GND(500, 190),
    W(620, 120, 660, 120),
    T(596, 96, "コンパレータ", "middle", 10, FNT),
    W(470, 107, 470, 60), W(120, 60, 470, 60),
] + sum([[W(120 + i * 78, 60, 120 + i * 78, 96),
          CAP(120 + i * 78, 106, None, True),
          T(120 + i * 78, 90, ["C", "C/2", "C/4", "C/8", "…"][i], "middle", 10.5, MUT),
          W(120 + i * 78, 116, 120 + i * 78, 150),
          SWI(120 + i * 78, 168, None, i % 2 == 0),
          W(120 + i * 78, 181, 120 + i * 78, 210)] for i in range(5)], []) + [
    W(110, 210, 440, 210), T(70, 214, "VREF / GND", "end", 11, MUT, True),
    W(110, 214, 110, 210),
    T(340, 244, "各容量の下端を VREF か GND に切り替えて、コンパレータ入力がゼロになる組合せを探す",
      "middle", 10.5, FNT),
    T(340, 262, "＝ 天秤に分銅を重い順に載せていくのと同じ", "middle", 10.5, MUT, True),
], "IC 内の容量比は極めて正確に作れる。だから SAR の精度は容量マッチングの限界（16〜18 bit）で決まる")

F["c17_sampin"] = SVG(660, 220, [
    T(70, 84, "信号源", "middle", 11.5, MUT, True), W(114, 80, 154, 80),
    RES(190, 80, "R_source"), W(226, 80, 280, 80),
    RECT(280, 62, 66, 36, 4, PAN, INK, 1.6), T(313, 85, "R_sw", "middle", 10.5, MUT, True),
    T(313, 52, "サンプルスイッチ", "middle", 9.5, FNT),
    W(346, 80, 420, 80), D(420, 80),
    W(420, 80, 500, 80), T(512, 84, "変換部へ", "start", 11, MUT),
    W(420, 80, 420, 112), CAP(420, 126, "C_sample"), W(420, 136, 420, 162), GND(420, 162),
    RECT(90, 170, 480, 42, 6, SCR, LIN, 1.3),
    T(330, 188, "τ = (R_source + R_sw) · C_sample、N bit には t > τ·ln(2^(N+1)) が要る", "middle", 11, INK, True),
    T(330, 204, "12 bit なら約 9τ", "middle", 10, MUT),
], "ADC の入力は抵抗ではなくコンデンサ。サンプル時に電荷を吸い込むので、信号源が強くないと間に合わない")

F["c17_dsm"] = SVG(660, 240, [
    T(60, 96, "V_IN", "middle", 12, MUT, True), ARR(92, 92, 138, 92, MUT, 1.6),
    O(152, 92, 14, INK), T(152, 97, "+", "middle", 13, MUT, True),
    T(140, 74, "＋", "middle", 10, FNT), T(140, 116, "−", "middle", 11, ALI, True),
    ARR(166, 92, 210, 92, MUT, 1.6),
    BOX(212, 70, 110, 44, "積分器 ∫", None, LIN, PAN), ARR(322, 92, 366, 92, MUT, 1.6),
    BOX(368, 70, 130, 44, "1 bit 量子化器", None, LIN, PAN),
    W(498, 92, 550, 92), D(550, 92), ARR(550, 92, 610, 92, SIG, 1.8),
    T(556, 74, "ビットストリーム", "middle", 10, SIG, True),
    W(550, 92, 550, 168), W(550, 168, 434, 168),
    BOX(324, 146, 110, 44, "1 bit DAC", None, LIN, PAN),
    W(324, 168, 152, 168), ARR(152, 150, 152, 108, ALI, 1.6),
    RECT(90, 200, 480, 32, 6, SCR, LIN, 1.3),
    T(330, 221, "信号はそのまま通り、量子化雑音だけが高周波に追いやられる", "middle", 11, INK, True),
], "ノイズシェーピング。振幅の分解能を時間の分解能と交換している。あとは高周波をディジタルで捨てるだけ")

F["c17_pipeline"] = SVG(700, 200, [
    T(56, 88, "V_IN", "middle", 12, MUT, True), ARR(86, 84, 118, 84, MUT, 1.6),
] + sum([[BOX(120 + i * 190, 62, 96, 44, "3 bit 変換", None, LIN, PAN),
          ARR(216 + i * 190, 84, 248 + i * 190, 84, MUT, 1.5),
          BOX(250 + i * 190, 62, 60, 44, "×4", None, LIN, PAN),
          W(168 + i * 190, 106, 168 + i * 190, 138),
          ARR(168 + i * 190, 138, 168 + i * 190, 156, SIG, 1.5),
          T(168 + i * 190, 172, "上位ビット" if i == 0 else "次のビット", "middle", 10, SIG)]
        for i in range(3)], []) + [
    ARR(310, 84, 310 + 0, 84, MUT, 1.2),
    T(660, 88, "…", "middle", 14, MUT),
    T(350, 40, "各段で少しずつ確定し、残差を増幅して次段へ渡す", "middle", 10.5, FNT),
], "パイプライン ADC。レイテンシは段数ぶんあるが、スループットは 1 クロックに 1 サンプル出る")

F["c17_chain"] = SVG(720, 190, [
    BOX(40, 62, 96, 46, "センサ", None, LIN, PAN), ARR(136, 85, 172, 85, MUT, 1.5),
    BOX(174, 62, 96, 46, "増幅", None, LIN, PAN), ARR(270, 85, 306, 85, MUT, 1.5),
    BOX(308, 62, 130, 46, "アンチエイリアス", None, LIN, PAN), ARR(438, 85, 474, 85, MUT, 1.5),
    BOX(476, 62, 96, 46, "バッファ", None, LIN, PAN), ARR(572, 85, 608, 85, MUT, 1.5),
    BOX(610, 62, 80, 46, "ADC", None, SIG, PAN),
    BOX(560, 132, 130, 40, "リファレンス", None, LIN, PAN),
    ARR(650, 132, 650, 110, ALI, 1.5),
    T(360, 156, "折り返したらディジタル処理では二度と分離できない。だからアナログで落とす",
      "middle", 10.5, FNT),
], "ADC は単体では使えない。前段の 4 つと基準電圧まで含めて初めて「測定系」になる")

F["c17_prot"] = SVG(560, 190, [
    T(80, 84, "入力", "middle", 11.5, MUT, True), W(120, 80, 176, 80),
    RES(210, 80, "R = 1k"), W(244, 80, 320, 80), D(320, 80),
    W(320, 80, 410, 80), T(422, 84, "ADC ピン", "start", 11.5, INK, True),
    W(320, 80, 320, 108), CAP(320, 122, "1 nF"), W(320, 132, 320, 154), GND(320, 154),
    T(230, 140, "R が ESD ダイオードの電流を制限し、", "end", 10.5, MUT),
    T(230, 156, "C がサンプル時の電荷を供給する", "end", 10.5, MUT),
], "ADC 入力の最小限の保護。ただし RC が帯域を決めるので、信号帯域と両立させること")

# ===================== 18. DAC =====================

F["c18_rstring"] = SVG(680, 230, [
    T(340, 26, "抵抗ストリング型 DAC", "middle", 12, INK, True),
    T(70, 74, "VREF", "middle", 11.5, MUT, True), W(108, 70, 130, 70),
] + sum([[RES(160 + i * 90, 70, None), W(189 + i * 90, 70, 221 + i * 90, 70),
          D(131 + i * 90, 70),
          W(131 + i * 90, 70, 131 + i * 90, 108),
          SWI(131 + i * 90, 126, None, i == 2),
          W(131 + i * 90, 139, 131 + i * 90, 170)] for i in range(5)], []) + [
    W(590, 70, 620, 70), GND(620, 70),
    W(121, 170, 590, 170), W(590, 170, 590, 170),
    W(400, 170, 400, 196), ARR(400, 196, 470, 196, SIG, 1.8),
    T(482, 200, "VOUT", "start", 12, SIG, True),
    T(340, 214, "デコーダが 1 つだけ閉じる", "middle", 10, FNT),
], "直列抵抗のタップを選ぶだけなので、単調性が構造的に保証される。ただし出力インピーダンスが高い")

F["c18_r2r"] = SVG(680, 250, [
    T(340, 26, "R-2R ラダー", "middle", 12, INK, True),
] + sum([[RES(150 + i * 120, 154, "2R", False),
          W(150 + i * 120, 135, 150 + i * 120, 100),
          D(150 + i * 120, 100),
          W(150 + i * 120, 173, 150 + i * 120, 200),
          SWI(150 + i * 120, 216, None, i % 2 == 0),
          T(150 + i * 120, 246, "b%d" % (3 - i), "middle", 11, INK, True)] for i in range(4)], [])
  + sum([[RES(210 + i * 120, 100, "R"),
          W(239 + i * 120, 100, 270 + i * 120, 100)] for i in range(3)], []) + [
    W(510, 100, 570, 100), ARR(570, 100, 630, 100, SIG, 1.8),
    T(90, 104, "出力へ", "end", 11, SIG, True), ARR(148, 100, 100, 100, SIG, 1.6),
    T(340, 68, "どの節点から右を見ても抵抗が R になるよう作られている", "middle", 10.5, FNT),
], "抵抗 2 種類だけで 2 進の重みが作れる。面積は N に比例するが、単調性は保証されない")

F["c18_glitch"] = SVG(560, 210, [
    T(280, 26, "メジャーコードグリッチ", "middle", 12, INK, True),
    AX(100, 170, 490, 50, "時間", "V_OUT"),
    CURVE([(110, 130), (240, 130)], SIG, 2.4),
    CURVE([(240, 130), (248, 62), (258, 62), (266, 108), (280, 106), (300, 106), (470, 106)], SIG, 2.4),
    W(240, 170, 240, 62, c=ALI, lw=1.2, dash="3 3"),
    T(253, 50, "ヒゲ", "start", 11.5, ALI, True),
    T(300, 194, "0111 1111 → 1000 0000 で全ビットが同時に変わる", "middle", 10.5, FNT),
], "各スイッチの切り替わりが少しずれるだけで、一瞬まったく違う値が出力される")

F["c18_isrc"] = SVG(680, 230, [
    T(340, 26, "電流セル型（セグメント化）", "middle", 12, INK, True),
] + sum([[O(120 + i * 88, 84, 20, INK), ARR(120 + i * 88, 96, 120 + i * 88, 76, MUT, 1.3),
          T(120 + i * 88, 56, "I", "middle", 11, MUT, True),
          W(120 + i * 88, 104, 120 + i * 88, 128),
          SWI(120 + i * 88, 146, None, i < 3),
          W(120 + i * 88, 159, 120 + i * 88, 182)] for i in range(6)], []) + [
    W(110, 182, 560, 182), W(340, 182, 340, 200), ARR(340, 200, 420, 200, SIG, 1.8),
    T(432, 204, "出力（電流を合計）", "start", 11.5, SIG, True),
    T(340, 42, "全部同じ大きさの電流源。オンにした数だけ足される", "middle", 10, FNT),
], "温度計コードなら単調性もグリッチも構造的に解決する。上位を温度計、下位をバイナリにするのがセグメント化")

F["c18_dsdac"] = SVG(700, 200, [
    T(56, 88, "24 bit", "middle", 11.5, MUT, True), ARR(96, 84, 128, 84, MUT, 1.5),
    BOX(130, 62, 110, 44, "補間フィルタ", None, LIN, PAN), ARR(240, 84, 272, 84, MUT, 1.5),
    BOX(274, 62, 110, 44, "ΔΣ 変調", None, LIN, PAN), ARR(384, 84, 416, 84, MUT, 1.5),
    BOX(418, 62, 110, 44, "1 bit DAC", None, SIG, PAN),
    W(528, 84, 560, 84), W(560, 84, 560, 128), ARR(560, 128, 560, 128, MUT, 1.5),
    BOX(500, 130, 130, 44, "アナログ LPF", None, LIN, PAN),
    ARR(560, 106, 560, 128, MUT, 1.5),
    W(630, 152, 670, 152), T(682, 156, "出力", "start", 11.5, SIG, True),
    T(350, 40, "1 bit なら出力が 2 点しかない＝原理的に完全に線形", "middle", 10.5, FNT),
], "オーディオ DAC の構成。素子のマッチングに頼らずに 24 bit の線形性を得る")

F["c18_pwmrc"] = SVG(560, 200, [
    T(85, 84, "PWM 出力", "middle", 11.5, MUT, True), W(140, 80, 186, 80),
    RES(220, 80, "R"), W(254, 80, 320, 80), D(320, 80),
    W(320, 80, 410, 80), T(422, 84, "アナログ電圧", "start", 12, SIG, True),
    W(320, 80, 320, 108), CAP(320, 122, "C"), W(320, 132, 320, 154), GND(320, 154),
    RECT(80, 158, 400, 34, 6, SCR, LIN, 1.3),
    T(280, 180, "V_OUT = D × V_DD。リプルと整定時間は同じ RC が支配するので両立しない",
      "middle", 10.5, INK, True),
], "組み込みで最もよく使われる「DAC」。実力は 8〜10 bit 程度で、電源精度がそのまま誤差になる")
# ===================== 19. GPIO =====================

F["c19_gpio"] = SVG(660, 400, [
    T(330, 26, "GPIO ピンの内部", "middle", 12.5, INK, True),
    RECT(150, 44, 300, 320, 10, "none", LIN, 1.3),
    T(300, 62, "MCU の内部", "middle", 10, FNT),
    RAIL(250, 88, "VDD"),
    W(250, 88, 250, 108), PMOS(250, 132, "PMOS"), W(250, 154, 250, 186), D(250, 186),
    W(250, 186, 250, 218), NMOS(250, 242, "NMOS"), W(250, 264, 250, 292), GND(250, 292),
    W(228, 132, 190, 132), W(228, 242, 190, 242), W(190, 132, 190, 242), D(190, 187),
    W(190, 187, 165, 187), T(158, 191, "出力", "end", 10.5, MUT, True),
    # ピン
    W(250, 186, 500, 186), D(500, 186), O(524, 186, 7, INK),
    T(524, 168, "ピン", "middle", 11.5, INK, True),
    # ESD ダイオード
    W(430, 186, 430, 150), DIO(430, 132, "up", None, ALI), W(430, 114, 430, 96),
    RAIL(430, 96, "VDD", ALI, 22),
    T(452, 130, "D1", "start", 10.5, ALI, True),
    W(430, 186, 430, 222), DIO(430, 240, "up", None, ALI), W(430, 258, 430, 286),
    GND(430, 286, None, ALI), T(452, 238, "D2", "start", 10.5, ALI, True),
    D(430, 186),
    # プルアップ／ダウン
    W(350, 186, 350, 152), D(350, 186), RES(350, 133, "R_pu", False), W(350, 114, 350, 96),
    RAIL(350, 96, "VDD", FNT, 22),
    W(350, 186, 350, 222), RES(350, 241, "R_pd", False), W(350, 260, 350, 286), GND(350, 286),
    # 入力バッファ
    W(300, 186, 300, 330), D(300, 186),
    BOX(216, 330, 168, 40, "シュミット入力バッファ", None, LIN, PAN),
    ARR(216, 350, 176, 350, MUT, 1.5), T(168, 354, "入力レジスタへ", "end", 10.5, MUT),
    RECT(540, 200, 110, 96, 6, SCR, ALI, 1.3),
    T(595, 222, "D1 / D2 が", "middle", 10.5, ALI, True),
    T(595, 238, "「壊れた」の", "middle", 10.5, ALI, True),
    T(595, 254, "原因のほぼ全部", "middle", 10.5, ALI, True),
    T(595, 276, "定格 −0.3 V 〜", "middle", 10, MUT),
    T(595, 290, "VDD+0.3 V", "middle", 10, MUT),
], "この 1 枚で GPIO の疑問はほぼ全部説明できる。出力ドライバ・プル抵抗・シュミット入力・ESD ダイオード")

F["c19_prot"] = SVG(560, 175, [
    T(80, 84, "外部信号", "middle", 11.5, MUT, True), W(136, 80, 186, 80),
    RES(220, 80, "R = 1k〜10k"), W(254, 80, 330, 80), D(330, 80),
    W(330, 80, 420, 80), T(432, 84, "MCU ピン", "start", 11.5, INK, True),
    W(330, 80, 330, 108), RECT(310, 108, 40, 30, 4, PAN, ALI, 1.5),
    T(330, 128, "TVS", "middle", 10, ALI, True), W(330, 138, 330, 152), GND(330, 152),
    T(240, 128, "（必要なら）", "end", 10, FNT),
], "直列抵抗が ESD ダイオードに流れる電流を制限する。ただし入力容量と組んで帯域が落ちる")

F["c19_led"] = SVG(640, 200, [
    T(160, 30, "ソース接続（H で点灯）", "middle", 11.5, INK, True),
    T(60, 88, "ピン", "middle", 11, MUT, True), W(90, 84, 116, 84),
    RES(150, 84, "R"), W(184, 84, 216, 84),
    DIO(240, 84, "right", None, INK, "led"), W(258, 84, 290, 84), GND(290, 84),
    T(160, 148, "PMOS が駆動する", "middle", 10.5, MUT),
    T(160, 164, "→ 電流はやや小さめ", "middle", 10.5, MUT),
    W(330, 22, 330, 180, c=LIN, lw=1, dash="4 4"),
    T(490, 30, "シンク接続（L で点灯）", "middle", 11.5, SIG, True),
    RAIL(390, 84, "VDD", MUT, 22), W(390, 84, 416, 84),
    DIO(440, 84, "right", None, INK, "led"), W(458, 84, 486, 84),
    RES(520, 84, "R"), W(554, 84, 590, 84),
    T(614, 88, "ピン", "start", 11, MUT, True),
    T(490, 148, "NMOS が駆動する", "middle", 10.5, MUT),
    T(490, 164, "→ 大きな電流を扱える", "middle", 10.5, SIG, True),
], "多くの MCU はシンク側のほうが強い。大電流が要るならシンク接続にする（ただし論理は反転する）")

F["c19_lvlshift"] = SVG(600, 260, [
    T(300, 26, "MOSFET 1 個による双方向レベルシフタ", "middle", 12, INK, True),
    RAIL(160, 60, "1.8 V"), W(160, 60, 160, 84),
    RES(160, 103, "R", False), W(160, 122, 160, 156), D(160, 156),
    W(160, 156, 100, 156), T(88, 160, "1.8 V 側", "end", 11.5, MUT, True),
    RAIL(440, 60, "3.3 V"), W(440, 60, 440, 84),
    RES(440, 103, "R", False), W(440, 122, 440, 156), D(440, 156),
    W(440, 156, 510, 156), T(522, 160, "3.3 V 側", "start", 11.5, MUT, True),
    W(160, 156, 278, 156), NMOS(300, 156, None, True), W(322, 156, 440, 156),
    W(278, 156, 278, 156),
    W(300, 134, 300, 100), T(300, 92, "ゲートは低いほうの電源（1.8 V）へ", "middle", 10, SIG, True),
    W(300, 100, 200, 100), W(200, 100, 200, 72), D(200, 72), W(200, 72, 160, 72),
    RECT(90, 196, 420, 50, 6, SCR, LIN, 1.3),
    T(300, 216, "低圧側が L → V_GS = 1.8 V でオン。高圧側が L → ボディダイオードで下がって", "middle", 10.5, MUT),
    T(300, 232, "さらにオン。どちらも駆動しなければ両側のプルアップで H", "middle", 10.5, MUT),
], "V_th の低い NMOS（BSS138 など）を使う。ただし立ち上がりは RC なので、高速な I2C では専用 IC を")

# ===================== 20. シリアル物理層 =====================

F["c20_sediff"] = SVG(660, 280, [
    T(165, 30, "シングルエンド", "middle", 12, INK, True),
    W(60, 80, 270, 80, c=SIG, lw=2.2), T(50, 84, "信号", "end", 11, MUT, True),
    W(60, 130, 270, 130, c=MUT, lw=2.2), T(50, 134, "GND", "end", 11, MUT, True),
    ARR(165, 66, 200, 58, ALI, 1.5), T(212, 54, "ノイズ", "start", 10.5, ALI, True),
    ARR(165, 144, 200, 152, ALI, 1.5),
    RECT(60, 178, 220, 74, 6, SCR, ALI, 1.3),
    T(170, 198, "受信 = V_signal − V_GND", "middle", 10.5, MUT, True),
    T(170, 216, "ノイズも GND の電位差も", "middle", 10.5, MUT),
    T(170, 232, "そのまま信号に化ける", "middle", 10.5, ALI, True),
    W(330, 22, 330, 262, c=LIN, lw=1, dash="4 4"),
    T(500, 30, "差動", "middle", 12, SIG, True),
    W(390, 76, 600, 76, c=SIG, lw=2.2), T(380, 80, "＋", "end", 11, MUT, True),
    W(390, 116, 600, 116, c=BLU, lw=2.2), T(380, 120, "−", "end", 11, MUT, True),
    ARR(495, 62, 530, 54, ALI, 1.5), T(542, 50, "ノイズ", "start", 10.5, ALI, True),
    ARR(495, 102, 530, 94, ALI, 1.5),
    T(495, 142, "両方に同じだけ乗る", "middle", 10, FNT),
    RECT(390, 178, 220, 74, 6, SCR, SIG, 1.3),
    T(500, 198, "受信 = V₊ − V₋", "middle", 10.5, MUT, True),
    T(500, 216, "同相成分は差を取れば消える", "middle", 10.5, SIG, True),
    T(500, 232, "＋ 放射も互いに打ち消し合う", "middle", 10.5, MUT),
], "差動の性能は「2 本がどれだけ揃っているか」で決まる。だから等長・等間隔・撚り線が要る")

def _fig_uart():
    o = [T(330, 26, "UART のフレーム", "middle", 12, INK, True)]
    segs = [(0.7, 1), (0.7, 0)] + [(0.5, b) for b in [1, 0, 1, 1, 0, 0, 1, 0]] + [(1.0, 1)]
    d, xend = DIG(90, 130, segs, 62, 0, 46, SIG)
    o.append(d)
    o += [W(90, 130, 600, 130, c=LIN, lw=1, dash="3 4")]
    x = 90
    labels = [("アイドル", 0.7), ("スタート", 0.7)] + [("D%d" % i, 0.5) for i in range(8)] + [("ストップ", 1.0)]
    for name, ln in labels:
        w = ln * 62
        o.append(T(x + w / 2, 156, name, "middle", 9.5, FNT))
        o.append(W(x, 76, x, 142, c=LIN, lw=1, dash="2 3"))
        x += w
    o.append(W(x, 76, x, 142, c=LIN, lw=1, dash="2 3"))
    o += [ARR(133, 178, 176, 178, ALI, 1.4, 5),
          T(180, 182, "この立ち下がりで受信側が同期し、以降は自前のクロックで各ビットの中央をサンプルする",
            "start", 10, FNT)]
    return SVG(660, 200, o,
               "クロック線がないので、10 ビット目までにずれが半ビット未満であること＝送受合わせて 5 % 未満が要求される")

F["c20_uart"] = _fig_uart()

F["c20_uartwire"] = SVG(560, 210, [
    BOX(80, 52, 120, 110, "MCU A", None, LIN, PAN),
    BOX(360, 52, 120, 110, "MCU B", None, LIN, PAN),
    W(200, 80, 360, 80), T(280, 72, "TX → RX", "middle", 10.5, MUT, True),
    W(200, 116, 360, 116), T(280, 108, "RX ← TX", "middle", 10.5, BLU, True),
    W(200, 148, 360, 148, c=ALI, lw=2.2), T(280, 140, "GND", "middle", 10.5, ALI, True),
    RECT(140, 176, 280, 26, 6, SCR, ALI, 1.3),
    T(280, 194, "GND を繋ぎ忘れると動いたり動かなかったりする", "middle", 10.5, ALI, True),
], "TX と RX は交差させる。そして GND は「信号線」である——リターン経路がなければ通信は成立しない")

def _fig_spi():
    o = [T(320, 26, "SPI モード 0（CPOL=0 / CPHA=0）", "middle", 12, INK, True)]
    u = 34
    clk, _ = DIG(120, 96, sum([[(1, 0), (1, 1)] for _ in range(8)], []) + [(1, 0)], u, 0, 34, BLU)
    o += [T(110, 92, "SCLK", "end", 11, MUT, True), clk]
    bits = [1, 0, 1, 1, 0, 0, 1, 0]
    mosi, _ = DIG(120, 164, sum([[(2, b)] for b in bits], []) + [(1, 0)], u, 0, 34, SIG)
    o += [T(110, 160, "MOSI", "end", 11, MUT, True), mosi]
    for i, b in enumerate(bits):
        o.append(T(120 + (2 * i + 1) * u, 148, "D%d" % (7 - i), "middle", 9.5, FNT))
        o.append(W(120 + 2 * i * u, 62, 120 + 2 * i * u, 176, c=LIN, lw=1, dash="2 3"))
        o.append(ARR(120 + 2 * i * u, 200, 120 + 2 * i * u, 184, ALI, 1.2, 4))
    o.append(T(320, 220, "立ち上がりでサンプルする", "middle", 10.5, ALI, True))
    return SVG(660, 240, o, "モード 0 と 3 が圧倒的に多い。相手のデータシートで CPOL/CPHA を必ず確認する")

F["c20_spi"] = _fig_spi()

F["c20_damp"] = SVG(560, 160, [
    T(80, 84, "MCU", "middle", 11.5, MUT, True), W(122, 80, 176, 80),
    RES(215, 80, "22〜33 Ω"), W(254, 80, 400, 80),
    T(430, 84, "スレーブ", "start", 11.5, MUT, True),
    T(215, 122, "送信 IC のピンの直近（10 mm 以内）に置く", "middle", 10.5, SIG, True),
    T(280, 140, "R_DS(on) と足して配線の特性インピーダンスに近づけ、反射を吸収する", "middle", 10, FNT),
], "SPI で最もよく効く対策。SCLK のリンギングによる二重クロックを防ぐ")

F["c20_can"] = SVG(620, 260, [
    T(310, 26, "CAN の差動レベル", "middle", 12, INK, True),
    AX(110, 190, 540, 46, "時間", "電圧"),
    W(110, 118, 530, 118, c=LIN, lw=1, dash="3 4"), T(106, 122, "2.5 V", "end", 10, FNT),
    W(110, 76, 530, 76, c=LIN, lw=1, dash="3 4"), T(106, 80, "3.5 V", "end", 10, FNT),
    W(110, 160, 530, 160, c=LIN, lw=1, dash="3 4"), T(106, 164, "1.5 V", "end", 10, FNT),
    CURVE([(120, 118), (220, 118), (220, 76), (360, 76), (360, 118), (520, 118)], SIG, 2.4),
    CURVE([(120, 118), (220, 118), (220, 160), (360, 160), (360, 118), (520, 118)], BLU, 2.4),
    T(540, 80, "CANH", "start", 10.5, SIG, True), T(540, 164, "CANL", "start", 10.5, BLU, True),
    RECT(130, 202, 160, 46, 5, SCR, LIN, 1.3),
    T(210, 220, "劣勢（Recessive）", "middle", 10, MUT, True), T(210, 236, "差 0 V ＝ 論理 1", "middle", 10, MUT),
    RECT(300, 202, 160, 46, 5, "var(--signal-soft)", SIG, 1.3),
    T(380, 220, "優勢（Dominant）", "middle", 10, SIG, True), T(380, 236, "差 2 V ＝ 論理 0", "middle", 10, MUT),
], "優勢が劣勢に勝つ。だから複数ノードが同時に送っても、ID の小さいノードが自然に勝ち残る")

# ===================== 21. アイソレータ =====================

F["c21_gndloop"] = SVG(620, 230, [
    BOX(70, 60, 140, 70, "機器 A", None, LIN, PAN),
    BOX(410, 60, 140, 70, "機器 B", None, LIN, PAN),
    W(210, 95, 410, 95, c=ALI, lw=2.4),
    T(310, 84, "GND を繋ぐ", "middle", 10.5, ALI, True),
    W(140, 130, 140, 172), GND(140, 172), T(140, 206, "大地に対して 0 V", "middle", 10, FNT),
    W(480, 130, 480, 172), GND(480, 172), T(480, 206, "大地に対して 5 V", "middle", 10, FNT),
    ARR(280, 118, 340, 118, ALI, 2), T(310, 140, "大電流が流れる", "middle", 11, ALI, True),
    T(310, 40, "電位差 5 V ÷ 配線抵抗 0.1 Ω = 50 A", "middle", 10.5, FNT),
], "グラウンドループ。別々の機器を繋ぐと GND 電位の差がそのまま短絡電流になる。絶縁すれば経路が物理的に切れる")

F["c21_photo"] = SVG(620, 230, [
    T(310, 26, "フォトカプラ", "middle", 12, INK, True),
    RECT(120, 52, 380, 130, 8, "none", LIN, 1.4),
    W(310, 44, 310, 190, c=ALI, lw=2, dash="6 4"),
    T(310, 206, "絶縁バリア", "middle", 10.5, ALI, True),
    T(70, 100, "入力", "middle", 11.5, MUT, True), W(100, 96, 146, 96),
    RES(180, 96, "R"), W(214, 96, 236, 96),
    DIO(258, 96, "right", None, INK, "led"), W(276, 96, 290, 96),
    W(290, 96, 290, 152), W(290, 152, 160, 152), GND(160, 152, "GND1"),
    ARR(330, 96, 358, 96, SIG, 1.5), ARR(330, 112, 358, 112, SIG, 1.5),
    T(344, 78, "光", "middle", 10.5, SIG, True),
    BJT(400, 110, "フォト Tr"), W(412, 84, 412, 68), W(412, 68, 470, 68),
    T(482, 72, "出力", "start", 11.5, SIG, True),
    W(412, 136, 412, 160), GND(412, 160, "GND2"),
    RECT(60, 196, 200, 26, 5, SCR, ALI, 1.3),
    T(160, 214, "CTR は 10 年で半減する", "middle", 10, ALI, True),
], "古典的だが、CTR のばらつきと経年劣化、そして速度（数 µs）が弱点。現代はデジタルアイソレータが主流")

F["c21_diso"] = SVG(660, 200, [
    T(330, 26, "デジタルアイソレータ", "middle", 12, INK, True),
    T(70, 100, "入力", "middle", 11.5, MUT, True), ARR(102, 96, 140, 96, MUT, 1.6),
    BOX(142, 74, 96, 44, "変調", None, LIN, PAN),
    W(238, 96, 280, 96),
    W(300, 60, 300, 150, c=ALI, lw=2.4), W(324, 60, 324, 150, c=ALI, lw=2.4),
    T(312, 168, "絶縁バリア", "middle", 10.5, ALI, True),
    T(312, 46, "トランス or コンデンサ", "middle", 10, FNT),
    W(344, 96, 386, 96),
    BOX(388, 74, 96, 44, "復調", None, LIN, PAN),
    ARR(484, 96, 522, 96, SIG, 1.8), T(534, 100, "出力", "start", 11.5, SIG, True),
    T(330, 190, "数 ns の遅延・µA の消費・劣化なし。CMTI は 50〜150 kV/µs", "middle", 10.5, MUT),
], "基板の層そのものでバリアを作る。モータ周辺では CMTI（コモンモード過渡耐性）が選定の決め手になる")

F["c21_hs"] = SVG(520, 300, [
    RAIL(240, 34, "V_BUS（300 V）"), W(240, 34, 240, 62),
    NMOS(240, 86, "Q1（ハイサイド）"), W(240, 108, 240, 142), D(240, 142),
    W(240, 142, 380, 142), T(392, 146, "SW ノード", "start", 11.5, SIG, True),
    T(392, 162, "0 V ↔ 300 V を往復する", "start", 10, FNT),
    W(240, 142, 240, 176), NMOS(240, 200, "Q2（ローサイド）"), W(240, 222, 240, 250),
    GND(240, 250),
    W(218, 86, 130, 86), T(120, 90, "G1", "end", 12, INK, True),
    W(218, 200, 130, 200), T(120, 204, "G2", "end", 12, INK, True),
    RECT(60, 262, 400, 32, 6, SCR, ALI, 1.3),
    T(260, 282, "Q1 をオンにするには、SW ノードより 10 V 高いゲート電圧が要る", "middle", 10.5, ALI, True),
], "ハイサイド駆動の難しさ。ソースが動くので、電源電圧より高い電圧を作らないとオンにできない")

F["c21_boot"] = SVG(560, 280, [
    T(280, 26, "ブートストラップ", "middle", 12, INK, True),
    RAIL(120, 60, "VDD"), W(120, 60, 120, 86), W(120, 86, 156, 86),
    DIO(180, 86, "right", None, INK), W(204, 86, 260, 86), D(260, 86),
    T(180, 66, "D_boot", "middle", 10.5, MUT, True),
    W(260, 86, 330, 86), T(342, 90, "VB（ハイサイド電源）", "start", 11.5, SIG, True),
    W(260, 86, 260, 116), CAP(260, 130, "C_boot"), W(260, 140, 260, 176), D(260, 176),
    W(260, 176, 200, 176), T(190, 180, "SW", "end", 11.5, MUT, True),
    W(200, 176, 200, 210), D(200, 176),
    RECT(60, 214, 440, 58, 6, SCR, LIN, 1.3),
    T(280, 234, "ローサイドがオンのとき SW = 0 V になり、C_boot が VDD まで充電される。", "middle", 10.5, MUT),
    T(280, 252, "ハイサイドがオンになると SW が上がり、C_boot の上端も一緒に持ち上がる", "middle", 10.5, MUT),
    T(280, 200, "0 V ↔ 300 V", "middle", 10, FNT),
], "安価だが、ローサイドを定期的にオンにしないと充電できない。だから 100 % デューティでは使えない")

F["c21_rg"] = SVG(520, 160, [
    T(85, 84, "ドライバ", "middle", 11.5, MUT, True), W(140, 80, 190, 80),
    RES(225, 80, "R_g"), W(260, 80, 340, 80),
    T(352, 84, "ゲート", "start", 11.5, INK, True),
    T(250, 122, "小さい：速い＝低損失、しかし dV/dt と EMI が増える", "middle", 10.5, MUT),
    T(250, 140, "大きい：EMI とサージが減るが、損失が増える", "middle", 10.5, MUT),
], "ゲート抵抗はスイッチング速度そのもの。効率と EMI のトレードオフを直接握っている")

F["c21_rgsplit"] = SVG(560, 220, [
    T(280, 26, "ON と OFF で別々の抵抗にする", "middle", 12, INK, True),
    T(85, 100, "ドライバ", "middle", 11.5, MUT, True), W(140, 96, 180, 96), D(180, 96),
    W(180, 96, 180, 62), W(180, 62, 216, 62), RES(250, 62, "R_g(on)"),
    W(284, 62, 340, 62), W(340, 62, 340, 96),
    W(180, 96, 180, 136), W(180, 136, 210, 136),
    DIO(232, 136, "left", None, INK), W(254, 136, 282, 136),
    RES(316, 136, "R_g(off)"), W(350, 136, 340, 136), W(340, 136, 340, 96),
    D(340, 96), W(340, 96, 420, 96), T(432, 100, "ゲート", "start", 11.5, INK, True),
    RECT(80, 172, 400, 34, 6, SCR, LIN, 1.3),
    T(280, 194, "OFF を速く（誤 ON を防ぐ）、ON は少し遅く（サージを抑える）", "middle", 10.5, INK, True),
], "ダイオードで経路を分けて、ターンオンとターンオフの速度を独立に決める定石")

# ===================== 22. モータドライバ =====================

F["c22_lossx"] = SVG(560, 250, [
    AX(100, 190, 500, 42, "電流", "損失"),
    CURVE([(105, 186), (200, 152), (300, 118), (400, 84), (480, 57)], BLU, 2.4),
    CURVE([(105, 189), (180, 184), (250, 172), (320, 148), (390, 110), (450, 68), (478, 44)], SIG, 2.4),
    T(430, 96, "IGBT：V_CE × I（電流に比例）", "end", 10.5, BLU, True),
    T(300, 200, "MOSFET：I² × R_DS(on)", "middle", 10.5, SIG, True),
    O(352, 128, 5.5, ALI), T(352, 112, "交点", "middle", 10.5, ALI, True),
    T(200, 224, "小電流：MOSFET が有利", "middle", 10.5, MUT),
    T(430, 224, "大電流：IGBT が有利", "middle", 10.5, MUT),
], "MOSFET は 2 乗、IGBT はほぼ比例。だから電流の大きさで有利不利が入れ替わる")

F["c22_hbridge"] = SVG(560, 320, [
    RAIL(280, 34, "V_M"), W(280, 34, 280, 58), W(150, 58, 410, 58),
    W(150, 58, 150, 78), NMOS(150, 102, "Q1"), W(150, 124, 150, 160),
    W(410, 58, 410, 78), NMOS(410, 102, "Q3"), W(410, 124, 410, 160),
    D(150, 160), D(410, 160),
    W(150, 160, 216, 160), O(240, 160, 22, INK), T(240, 165, "M", "middle", 14, MUT, True),
    W(264, 160, 410, 160),
    W(150, 160, 150, 196), NMOS(150, 220, "Q2"), W(150, 242, 150, 272),
    W(410, 160, 410, 196), NMOS(410, 220, "Q4"), W(410, 242, 410, 272),
    W(150, 272, 410, 272), GND(280, 272),
    W(128, 102, 90, 102), W(128, 220, 90, 220), W(388, 102, 470, 102), W(388, 220, 470, 220),
    RECT(60, 288, 440, 26, 6, SCR, ALI, 1.3),
    T(280, 306, "Q1 と Q2 を同時にオンにすると電源が短絡する（貫通）", "middle", 10.5, ALI, True),
], "正転は Q1+Q4、逆転は Q3+Q2、ブレーキは Q2+Q4。縦方向を同時にオンにしてはいけない")

F["c22_3phase"] = SVG(600, 300, [
    RAIL(300, 34, "V_M"), W(300, 34, 300, 58), W(140, 58, 460, 58),
] + sum([[W(140 + i * 160, 58, 140 + i * 160, 78),
          NMOS(140 + i * 160, 102, ["U+", "V+", "W+"][i]),
          W(140 + i * 160, 124, 140 + i * 160, 158), D(140 + i * 160, 158),
          W(140 + i * 160, 158, 140 + i * 160, 192),
          NMOS(140 + i * 160, 216, ["U−", "V−", "W−"][i]),
          W(140 + i * 160, 238, 140 + i * 160, 268),
          W(140 + i * 160, 158, 140 + i * 160 - 46, 158),
          T(140 + i * 160 - 58, 162, ["U", "V", "W"][i], "end", 12, SIG, True)]
        for i in range(3)], []) + [
    W(140, 268, 460, 268), GND(300, 268),
    T(300, 292, "3 相インバータ ＝ ハーフブリッジ 3 個", "middle", 11, MUT, True),
], "ブラシレスモータは、この 3 個のハーフブリッジで電子的に転流させる")

F["c22_kelvin"] = SVG(560, 200, [
    T(280, 30, "ケルビン接続（4 端子）", "middle", 12, INK, True),
    W(80, 96, 190, 96, c=INK, lw=5), W(370, 96, 480, 96, c=INK, lw=5),
    RECT(190, 78, 180, 36, 3, PAN, INK, 1.8), T(280, 102, "シャント抵抗", "middle", 11, MUT, True),
    ARR(100, 78, 160, 78, ALI, 1.8), T(130, 68, "大電流", "middle", 10, ALI, True),
    W(214, 78, 214, 44), W(346, 78, 346, 44),
    T(214, 34, "検出 +", "middle", 10.5, SIG, True), T(346, 34, "検出 −", "middle", 10.5, SIG, True),
    T(280, 146, "検出線は抵抗体の直上から取る", "middle", 10.5, SIG, True),
    T(280, 166, "はんだやパターンの 1 mΩ が乗ると、5 mΩ のシャントでは 20 % の誤差になる",
      "middle", 10, FNT),
], "電流経路と検出経路を分ける。これをやらないとシャント抵抗の精度は意味を持たない")

def _fig_sample():
    o = [T(320, 26, "電流を「いつ」測るか", "middle", 12, INK, True)]
    d, _ = DIG(110, 100, [(1, 1), (1.4, 0), (1, 1), (1.4, 0), (1, 1)], 78, 0, 40, BLU)
    o += [T(100, 96, "PWM", "end", 11, MUT, True), d]
    o += [T(100, 190, "電流", "end", 11, MUT, True)]
    pts = [(110, 190)]
    x = 110
    lvl = 190
    for ln, up in [(1, 1), (1.4, 0), (1, 1), (1.4, 0), (1, 1)]:
        nx = x + ln * 78
        ny = lvl - 34 if up else lvl + 34
        ny = max(150, min(200, ny))
        pts.append((nx, ny)); lvl = ny; x = nx
    o.append(CURVE(pts, SIG, 2.4))
    for cx in (149, 327, 505):
        o.append(W(cx, 60, cx, 214, c=ALI, lw=1.3, dash="4 3"))
        o.append(ARR(cx, 232, cx, 216, ALI, 1.4, 5))
    o.append(T(327, 250, "PWM の中央でトリガすると平均値が取れる", "middle", 10.5, ALI, True))
    o.append(T(327, 268, "スイッチング直後はリンギングが乗るので、ブランキング時間を置く", "middle", 10, FNT))
    return SVG(660, 280, o, "「電流検出の値が暴れる」の最頻出原因はサンプルタイミング。PWM 同期の ADC トリガを使う")

F["c22_sample"] = _fig_sample()

F["c22_regen"] = SVG(560, 200, [
    O(120, 96, 26, INK), T(120, 102, "M", "middle", 15, MUT, True),
    T(120, 146, "減速中", "middle", 10.5, MUT),
    ARR(160, 96, 250, 96, ALI, 2), T(205, 78, "発電した電流", "middle", 10.5, ALI, True),
    W(250, 96, 320, 96), D(320, 96), CAP(320, 116, None),
    T(346, 108, "C_BUS", "start", 11, MUT, True),
    W(320, 96, 320, 106), W(320, 126, 320, 156), GND(320, 156),
    ARR(320, 70, 320, 44, ALI, 2), T(334, 54, "V_M が上昇する", "start", 11, ALI, True),
    RECT(400, 130, 150, 50, 6, SCR, ALI, 1.3),
    T(475, 150, "耐圧を超えると", "middle", 10.5, MUT),
    T(475, 166, "コンデンサが破裂する", "middle", 10.5, ALI, True),
], "減速時、モータは発電機になる。電源が電流を吸えないと、その分だけ母線電圧が上がる")

# ===================== 23. 基板設計 =====================

F["c23_stackup"] = SVG(620, 260, [
    T(310, 28, "4 層基板の典型的な層構成", "middle", 12, INK, True),
    RECT(120, 48, 380, 26, 3, PAN, INK, 1.5), T(310, 66, "L1：信号（部品面）", "middle", 11, MUT, True),
    T(112, 88, "0.2 mm", "end", 9.5, FNT),
    RECT(120, 78, 380, 8, 0, SCR, LIN, 1),
    RECT(120, 86, 380, 22, 3, "var(--signal-soft)", SIG, 1.5),
    T(310, 101, "L2：GND プレーン", "middle", 11, SIG, True),
    T(112, 130, "1.2 mm", "end", 9.5, FNT),
    RECT(120, 108, 380, 44, 0, SCR, LIN, 1),
    RECT(120, 152, 380, 22, 3, "var(--alias-soft)", ALI, 1.5),
    T(310, 167, "L3：電源プレーン", "middle", 11, ALI, True),
    RECT(120, 174, 380, 8, 0, SCR, LIN, 1),
    RECT(120, 182, 380, 26, 3, PAN, INK, 1.5), T(310, 200, "L4：信号（はんだ面）", "middle", 11, MUT, True),
    ARR(520, 62, 520, 96, SIG, 1.5), T(532, 76, "L1 のリターンは L2", "start", 10, SIG),
    ARR(520, 196, 520, 168, ALI, 1.5), T(532, 186, "L4 のリターンは L3", "start", 10, ALI),
    RECT(90, 222, 440, 30, 6, SCR, LIN, 1.3),
    T(310, 242, "L2-L3 を両方 GND にして電源はベタで引くほうが、多くの場合は安全", "middle", 10.5, MUT),
], "L1-L2 が近いほど良い伝送線路になり、クロストークも減る。層構成を先に決め、線幅は後から合わせる")

F["c23_ringing"] = SVG(560, 230, [
    AX(100, 170, 500, 40, "時間", "受信端の電圧"),
    W(100, 100, 490, 100, c=LIN, lw=1, dash="3 4"), T(96, 104, "VDD", "end", 10, FNT),
    W(100, 62, 490, 62, c=ALI, lw=1.2, dash="4 3"),
    T(496, 66, "VDD+0.7", "end", 10, ALI, True),
    CURVE([(110, 166), (160, 166), (168, 52), (200, 50), (212, 124), (240, 126),
           (252, 82), (280, 84), (292, 110), (320, 110), (330, 96), (360, 98),
           (370, 102), (470, 100)], SIG, 2.4),
    W(100, 128, 490, 128, c=LIN, lw=1, dash="2 4"), T(96, 132, "V_IH", "end", 10, FNT),
    T(300, 196, "しきい値を何度も跨ぐ＝クロックなら余分にカウントされる", "middle", 10.5, ALI, True),
    T(300, 214, "オーバーシュートが定格を超えれば ESD ダイオードが導通する", "middle", 10, FNT),
], "受信端は開放（全反射）、送信端は Z0 より低い。この繰り返しが減衰しながら振動する")

F["c23_branch"] = SVG(660, 250, [
    T(160, 30, "【悪い】1 本の終端で分岐", "middle", 11.5, ALI, True),
    T(50, 86, "送信", "middle", 11, MUT, True), W(78, 82, 106, 82),
    RES(135, 82, "R"), W(164, 82, 220, 82), D(220, 82),
    W(220, 82, 290, 60), T(302, 64, "受信 A", "start", 10.5, MUT),
    W(220, 82, 290, 104), T(302, 108, "受信 B", "start", 10.5, MUT),
    T(220, 132, "分岐点でインピーダンスが半分になる", "middle", 10, ALI, True),
    T(220, 148, "→ そこで反射する", "middle", 10, ALI, True),
    W(360, 22, 360, 236, c=LIN, lw=1, dash="4 4"),
    T(510, 30, "【良い】それぞれに終端", "middle", 11.5, SIG, True),
    T(400, 86, "送信", "middle", 11, MUT, True), W(428, 82, 452, 82), D(452, 82),
    W(452, 82, 470, 60), RES(500, 60, "R"), W(529, 60, 580, 60),
    T(592, 64, "受信 A", "start", 10.5, MUT),
    W(452, 82, 470, 104), RES(500, 104, "R"), W(529, 104, 580, 104),
    T(592, 108, "受信 B", "start", 10.5, MUT),
    T(510, 148, "最良はクロックバッファを使うこと", "middle", 10, SIG, True),
    RECT(120, 196, 420, 34, 6, SCR, LIN, 1.3),
    T(330, 218, "直列終端は 1 対 1 専用。分岐するなら経路ごとに終端する", "middle", 10.5, INK, True),
], "ダンピング抵抗は「送信端で反射を吸収する」もの。分岐すると吸収しきれなくなる")

F["c23_slit"] = SVG(660, 260, [
    T(330, 28, "プレーンの切れ目を跨ぐと何が起きるか", "middle", 12, INK, True),
    W(100, 76, 560, 76, c=SIG, lw=2.6),
    T(330, 62, "信号", "middle", 10.5, SIG, True),
    RECT(100, 130, 200, 56, 0, SCR, LIN, 1.4),
    RECT(360, 130, 200, 56, 0, SCR, LIN, 1.4),
    T(330, 158, "隙間", "middle", 10.5, ALI, True),
    W(330, 122, 330, 194, c=ALI, lw=1.4, dash="5 4"),
    T(200, 174, "GND プレーン", "middle", 10, FNT),
    CURVE([(560, 140), (368, 140), (368, 178), (292, 178), (292, 140), (100, 140)], BLU, 2.4),
    ARR(140, 140, 110, 140, BLU, 1.6, 6),
    T(330, 208, "リターン電流は隙間を大回りする", "middle", 11, BLU, True),
    RECT(90, 222, 480, 30, 6, SCR, ALI, 1.3),
    T(330, 242, "ループ面積が激増 → インダクタンス増・反射・放射・他の信号との干渉", "middle", 10.5, ALI, True),
], "だから GND プレーンは分割しない。「銅を切る」のではなく「配置で領域を分ける」のが正しい")

F["c23_xtalk"] = SVG(620, 230, [
    W(100, 80, 520, 80, c=ALI, lw=2.6),
    T(90, 84, "加害者", "end", 11, ALI, True),
    W(100, 130, 520, 130, c=SIG, lw=2.6),
    T(90, 134, "被害者", "end", 11, SIG, True),
] + [W(160 + i * 60, 88, 160 + i * 60, 122, c=MUT, lw=1.1, dash="3 3") for i in range(7)]
  + [T(310, 108, "容量結合・誘導結合", "middle", 10, FNT),
     RECT(100, 156, 200, 56, 6, SCR, LIN, 1.3),
     T(200, 176, "間隔を空ける（3W）", "middle", 10.5, MUT),
     T(200, 196, "並走区間を短く", "middle", 10.5, MUT),
     RECT(320, 156, 200, 56, 6, "var(--signal-soft)", SIG, 1.3),
     T(420, 176, "プレーンを近づける", "middle", 10.5, SIG, True),
     T(420, 196, "（これが最も効く）", "middle", 10, MUT)],
    "3W ルールより、プレーンまでの距離を詰めるほうが効く。電界が下に集中して横に漏れなくなる")

# ===================== 24. EMC =====================

F["c24_dmloop"] = SVG(560, 200, [
    W(120, 70, 440, 70, c=SIG, lw=2.4), ARR(250, 70, 310, 70, SIG, 2),
    T(280, 56, "信号電流", "middle", 10.5, SIG, True),
    W(120, 130, 440, 130, c=BLU, lw=2.4), ARR(310, 130, 250, 130, BLU, 2),
    T(280, 152, "リターン電流", "middle", 10.5, BLU, True),
    W(120, 70, 120, 130), W(440, 70, 440, 130),
    RECT(122, 72, 316, 56, 0, "var(--alias-soft)", "none", 0),
    T(280, 104, "この面積 A が放射源", "middle", 11.5, ALI, True),
    T(280, 184, "E ∝ I · A · f²  ——面積を半分にすれば 6 dB 下がる", "middle", 11, INK, True),
], "ディファレンシャルモード放射。ループ面積を減らすことが、あらゆる EMC 対策の第一手")

F["c24_cmchain"] = SVG(560, 280, [
    BOX(180, 44, 200, 40, "基板の GND が揺れる", None, ALI, PAN),
    ARR(280, 84, 280, 108, MUT, 1.5),
    BOX(180, 110, 200, 40, "ケーブルの GND に伝わる", None, LIN, PAN),
    ARR(280, 150, 280, 174, MUT, 1.5),
    BOX(150, 176, 260, 40, "ケーブル全体が同相で振動する", None, LIN, PAN),
    ARR(280, 216, 280, 240, MUT, 1.5),
    BOX(150, 242, 260, 34, "ケーブルがアンテナになる", None, ALI, "var(--alias-soft)"),
    T(470, 130, "元凶は", "middle", 11, MUT, True),
    T(470, 148, "GND の電位", "middle", 11, ALI, True),
    T(470, 166, "が揺れること", "middle", 11, ALI, True),
], "コモンモード電流はわずか µA で限度値を超える。放射エミッションで落ちる原因の大半がこれ")

F["c24_spectrum"] = SVG(580, 230, [
    AX(100, 180, 520, 42, "周波数（対数）", "振幅"),
    CURVE([(105, 58), (200, 58)], SIG, 2.6),
    CURVE([(200, 58), (340, 108)], SIG, 2.6),
    CURVE([(340, 108), (490, 178)], SIG, 2.6),
    W(200, 58, 200, 180, c=LIN, lw=1.2, dash="3 3"),
    W(340, 108, 340, 180, c=ALI, lw=1.3, dash="3 3"),
    T(200, 198, "1/(πT)", "middle", 10.5, FNT),
    T(340, 198, "1/(π·t_r)", "middle", 10.5, ALI, True),
    T(268, 74, "−20 dB/dec", "middle", 10.5, MUT),
    T(430, 124, "−40 dB/dec", "middle", 10.5, MUT),
    T(300, 220, "t_r を 1 ns → 10 ns にすると折れ点が 318 MHz → 32 MHz に下がる", "middle", 10.5, INK, True),
], "矩形波のスペクトル。立ち上がり時間を遅くすると、高調波が部品代ゼロで 20 dB 以上落ちる")

F["c24_cmc"] = SVG(560, 240, [
    T(280, 28, "コモンモードチョーク", "middle", 12, INK, True),
    W(100, 90, 190, 90), IND(220, 90, None), W(250, 90, 460, 90),
    W(100, 150, 190, 150), IND(220, 150, None), W(250, 150, 460, 150),
    RECT(196, 106, 48, 28, 3, SCR, INK, 1.5), T(220, 125, "コア", "middle", 10, MUT, True),
    T(80, 94, "信号 +", "end", 11, SIG, True), T(80, 154, "信号 −", "end", 11, BLU, True),
    T(220, 68, "同じコアに同じ向きに巻く", "middle", 10, FNT),
    RECT(90, 176, 190, 52, 6, "var(--signal-soft)", SIG, 1.3),
    T(185, 196, "差動電流（逆向き）", "middle", 10.5, SIG, True),
    T(185, 214, "磁束が打ち消し合う → 素通し", "middle", 10, MUT),
    RECT(300, 176, 190, 52, 6, "var(--alias-soft)", ALI, 1.3),
    T(395, 196, "コモンモード（同方向）", "middle", 10.5, ALI, True),
    T(395, 214, "磁束が加算 → 大きな L で阻止", "middle", 10, MUT),
], "差動信号の品質を落とさずにコモンモードだけを止められる。差動ケーブルには必ず検討する価値がある")

# ===================== 25. 測定とデバッグ =====================

F["c25_probe"] = SVG(620, 200, [
    T(70, 84, "回路", "middle", 11.5, MUT, True), W(104, 80, 140, 80), D(140, 80),
    RES(180, 80, "9 MΩ"), W(214, 80, 300, 80), D(300, 80),
    W(300, 80, 400, 80),
    RECT(400, 56, 150, 48, 6, PAN, LIN, 1.5),
    T(475, 78, "オシロ", "middle", 11, MUT, True), T(475, 94, "1 MΩ ∥ 15 pF", "middle", 9.5, FNT),
    W(140, 80, 140, 116), CAP(140, 130, "≈10 pF"), W(140, 140, 140, 162), GND(140, 162),
    W(300, 80, 300, 116), CAP(300, 130, "補正 C"), W(300, 140, 300, 162), GND(300, 162),
    RECT(60, 168, 300, 26, 6, SCR, ALI, 1.3),
    T(210, 186, "この 10 pF が回路に並列に入る", "middle", 10.5, ALI, True),
], "10:1 プローブの等価回路。高インピーダンス回路と水晶では、この容量が波形そのものを変えてしまう")

F["c25_gndlead"] = SVG(620, 250, [
    T(160, 30, "【悪い】ワニ口リード", "middle", 11.5, ALI, True),
    W(60, 80, 150, 80), O(150, 80, 6, INK), T(150, 62, "先端", "middle", 10, MUT),
    CURVE([(150, 92), (120, 130), (170, 158), (110, 186), (150, 200)], ALI, 2.2),
    GND(150, 200, None, ALI),
    T(240, 140, "15 cm ≈ 150 nH", "start", 11, ALI, True),
    T(240, 158, "プローブ容量と共振し、", "start", 10, MUT),
    T(240, 172, "100 MHz 付近で盛大に鳴く", "start", 10, MUT),
    W(330, 22, 330, 234, c=LIN, lw=1, dash="4 4"),
    T(490, 30, "【良い】バネ型グラウンド", "middle", 11.5, SIG, True),
    W(400, 80, 490, 80), O(490, 80, 6, INK), T(490, 62, "先端", "middle", 10, MUT),
    CURVE([(490, 92), (480, 100), (500, 108), (480, 116), (500, 124), (490, 132)], SIG, 2.2),
    GND(490, 132, None, SIG),
    T(490, 176, "数 mm ≈ 数 nH", "middle", 11, SIG, True),
    T(490, 196, "共振周波数が測定帯域の", "middle", 10, MUT),
    T(490, 210, "遥か上に飛ぶ", "middle", 10, MUT),
], "リンギングを測るならグラウンドリードは絶対に使わない。「回路にないリンギング」が画面に見える")

F["c25_comp"] = SVG(640, 210, [
    T(320, 28, "プローブ補正（1 kHz 方形波で合わせる）", "middle", 12, INK, True),
    T(115, 60, "補正不足", "middle", 11, ALI, True),
    CURVE([(60, 150), (95, 150), (100, 92), (125, 82), (170, 78)], ALI, 2.4),
    T(115, 178, "高域が落ちている", "middle", 10, FNT),
    T(320, 60, "適正", "middle", 11, SIG, True),
    CURVE([(265, 150), (300, 150), (302, 78), (375, 78)], SIG, 2.6),
    T(320, 178, "角が直角になる", "middle", 10, SIG, True),
    T(525, 60, "過補正", "middle", 11, ALI, True),
    CURVE([(470, 150), (505, 150), (507, 62), (515, 62), (520, 80), (580, 80)], ALI, 2.4),
    T(525, 178, "高域が持ち上がっている", "middle", 10, FNT),
], "プローブとオシロの組合せごとに変わる。使う前に毎回合わせること")

F["c25_debugorder"] = SVG(720, 150, [
] + sum([[BOX(30 + i * 116, 56, 100, 46, s, None, LIN if i else SIG, PAN),
          (ARR(130 + i * 116, 79, 146 + i * 116, 79, MUT, 1.5) if i < 5 else "")]
        for i, s in enumerate(["電源", "クロック", "リセット", "MCU 起動", "周辺", "通信"])], []) + [
    ARR(80, 120, 80, 106, SIG, 1.6),
    T(80, 138, "ここから順に", "middle", 10.5, SIG, True),
    T(500, 138, "どこまでは正しいかを二分探索する", "middle", 10.5, FNT),
], "デバッグの順序。上流が確定していないのに下流を疑っても時間を溶かすだけ")

# ===================== ウィジェット用の追加図 =====================

F["c11_xor"] = SVG(560, 240, [
    T(280, 26, "XOR（伝送ゲート方式）", "middle", 12, INK, True),
    T(70, 100, "A", "middle", 12, INK, True), W(96, 96, 160, 96), D(160, 96),
    W(160, 96, 210, 96),
    RECT(210, 78, 70, 36, 5, PAN, INK, 1.6), T(245, 101, "TG(B)", "middle", 10.5, MUT, True),
    W(280, 96, 360, 96), D(360, 96), W(360, 96, 430, 96),
    T(444, 100, "Y", "start", 12, SIG, True),
    W(160, 96, 160, 160), W(160, 160, 210, 160),
    RECT(210, 142, 70, 36, 5, PAN, INK, 1.6), T(245, 165, "TG(B̄)", "middle", 10.5, MUT, True),
    W(280, 160, 360, 160), W(360, 160, 360, 96),
    T(160, 196, "上は A、下は Ā を通す", "middle", 10.5, FNT),
    T(280, 220, "伝送ゲートは信号が減衰し、駆動能力も持たない", "middle", 10.5, MUT, True),
], "XOR は CMOS にとって高価なゲート。加算器が大きく遅いのはこれが理由")

F["c13_eeprom"] = SVG(520, 230, [
    T(260, 26, "EEPROM の 2T セル", "middle", 12, INK, True),
    NMOS(180, 110, "選択 Tr"), W(158, 110, 100, 110), T(90, 114, "WL", "end", 11.5, INK, True),
    W(192, 88, 192, 70), W(192, 70, 300, 70), W(300, 70, 300, 88),
    NMOS(288, 110, "セル Tr（FG）", True),
    W(300, 132, 300, 160), GND(300, 160),
    W(192, 132, 192, 160), GND(192, 160),
    RECT(60, 176, 400, 44, 6, SCR, LIN, 1.3),
    T(260, 194, "バイトごとに選択トランジスタを持つので、バイト単位で消去できる", "middle", 10.5, MUT),
    T(260, 210, "その代わり面積は Flash の 2〜3 倍", "middle", 10.5, MUT, True),
], "原理は Flash と同じフローティングゲート。違いは「バイトごとに選択できるか」だけ")

F["c13_fram"] = SVG(500, 250, [
    T(250, 26, "FRAM（強誘電体メモリ）のセル", "middle", 12, INK, True),
    T(250, 60, "プレート線", "middle", 11.5, INK, True), W(250, 68, 250, 92),
    CAP(250, 106, None), W(250, 96, 250, 100), W(250, 112, 250, 136),
    RECT(226, 98, 48, 12, 2, "var(--signal-soft)", SIG, 1.2),
    T(300, 108, "強誘電体", "start", 10.5, SIG, True),
    T(300, 124, "（分極の向きで記憶）", "start", 10, FNT),
    W(250, 136, 250, 152), NMOS(272, 176, "M", True),
    W(272, 154, 272, 136), W(250, 136, 272, 136),
    W(250, 176, 150, 176), T(138, 180, "BL", "end", 12, MUT, True),
    W(272, 198, 272, 214), T(272, 230, "WL", "middle", 11.5, INK, True),
], "書き換え 10¹²〜10¹⁴ 回・RAM 並の書き込み速度。ログ用途で Flash の寿命問題が消える")

# ---------- SVG 本体だけを取り出したもの（ウィジェットから使う） ----------
import re as _re
SVGONLY = {}
for _k, _v in F.items():
    _m = _re.search(r"(<svg\b.*?</svg>)", _v, _re.S)
    SVGONLY[_k] = _m.group(1) if _m else ""
