# -*- coding: utf-8 -*-
"""基板アートワーク編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
import math
import os as _os

F = {}
_CHECK = bool(_os.environ.get("FIGCHECK"))
_OVER = []

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"    # 基板のオリーブ
ALI = "var(--alias)"     # 警告の赤
GRN = "var(--blue)"      # 第3色（青）
FNT = "var(--faint)"
LIN = "var(--line)"
PAN = "var(--panel)"
SCR = "var(--screen)"
SSOFT = "var(--signal-soft)"
ASOFT = "var(--alias-soft)"
MONO = "var(--mono)"

def E(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def SVG(w, h, body, cap=None):
    s = ('<figure class="dia"><svg viewBox="0 0 %d %d" width="%d" role="img" '
         'preserveAspectRatio="xMidYMid meet">%s</svg>' % (w, h, w, "".join(body)))
    if cap:
        s += '<figcaption>%s</figcaption>' % cap
    return s + '</figure>'

def T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=False):
    if c == LIN:            # 罫線色は文字には薄すぎるので、読める色に寄せる
        c = MUT
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s"'
            ' font-family="%s" font-weight="%s">%s</text>'
            % (x, y, a, sz, c, MONO if mono else "var(--sans)", "700" if b else "400", E(s)))

def W(*p, **k):
    c = k.get("c", MUT); lw = k.get("lw", 1.5); dash = k.get("dash")
    d = " ".join("%g,%g" % (round(p[i],2), round(p[i+1],2)) for i in range(0, len(p), 2))
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round" stroke-linejoin="round"%s/>' % (d, c, lw, da))

def PL(pts, c=MUT, lw=1.6, dash=None, fill="none"):
    d = " ".join("%g,%g" % (round(x,2), round(y,2)) for x, y in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<polyline points="%s" fill="%s" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round" stroke-linejoin="round"%s/>' % (d, fill, c, lw, da))

def RECT(x, y, w, h, r=8, fill=PAN, c=LIN, lw=1.4, dash=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" stroke="%s"'
            ' stroke-width="%g"%s/>' % (x, y, w, h, r, fill, c, lw, da))

def D(x, y, c=MUT, r=3.4):
    return '<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (x, y, r, c)

def CIRC(x, y, r, c=LIN, lw=1.4, fill="none", dash=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return '<circle cx="%g" cy="%g" r="%g" fill="%s" stroke="%s" stroke-width="%g"%s/>' % (x, y, r, fill, c, lw, da)

def ARR(x1, y1, x2, y2, c=MUT, lw=1.6, head=7):
    a = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - head * math.cos(a), y2 - head * math.sin(a)
    p = "%g,%g %g,%g %g,%g" % (
        x2, y2,
        hx - head * 0.45 * math.sin(a), hy + head * 0.45 * math.cos(a),
        hx + head * 0.45 * math.sin(a), hy - head * 0.45 * math.cos(a))
    return W(x1, y1, hx, hy, c=c, lw=lw) + '<polygon points="%s" fill="%s"/>' % (p, c)

def DARR(x1, y1, x2, y2, c=MUT, lw=1.4, head=6):
    """両矢印"""
    return ARR(x1, y1, x2, y2, c, lw, head) + ARR(x2, y2, x1, y1, c, lw, head)

_NOLEAD = "。、，．・）」』】〉》”’!?！？,.:;：；"

def _wrap(s, n):
    out, cur, wdt = [], "", 0
    for ch in s:
        cw = 2 if ord(ch) > 0x2000 else 1
        if ch == "\n":
            out.append(cur); cur = ""; wdt = 0; continue
        if wdt + cw > n and cur and ch not in _NOLEAD:
            out.append(cur); cur = ""; wdt = 0
        cur += ch; wdt += cw
    if cur:
        out.append(cur)
    return out

def BOX(x, y, w, h, title=None, sub=None, c=LIN, fill=PAN, tc=INK, r=8,
        lw=1.4, sz=12, ssz=10, dash=None, mono=False):
    o = [RECT(x, y, w, h, r, fill, c, lw, dash)]
    lines = _wrap(title, int((w - 14) / (sz * 0.55))) if title else []
    subl = _wrap(sub, int((w - 14) / (ssz * 0.6))) if sub else []
    n = len(lines) + len(subl)
    need = len(lines) * sz * 0.78 + len(subl) * ssz * 0.9 + (n - 1) * 3 + 10
    if _CHECK and need > h:
        _OVER.append((title, w, h, round(need, 1)))
    y0 = y + h / 2 - (n - 1) * (sz * 0.78) / 2 + sz * 0.34
    for i, l in enumerate(lines):
        o.append(T(x + w / 2, y0 + i * sz * 0.78 + i * 3, l, "middle", sz, tc, True, mono))
    for j, l in enumerate(subl):
        o.append(T(x + w / 2, y0 + (len(lines) + j) * sz * 0.78 + (len(lines) + j) * 3 + 3,
                   l, "middle", ssz, MUT, False, mono))
    return "".join(o)

def flowright(x0, cy, items, w=140, bh=48, gap=34, c=LIN, fill=PAN, note=None):
    o = []
    x = x0
    for i, it in enumerate(items):
        if isinstance(it, tuple):
            t = it[0]; s = it[1] if len(it) > 1 else None
        else:
            t, s = it, None
        col, fl = c, fill
        if isinstance(it, tuple) and len(it) >= 3:
            col = it[2]; fl = it[3] if len(it) > 3 else fill
        o.append(BOX(x, cy - bh / 2, w, bh, t, s, col, fl))
        if i < len(items) - 1:
            o.append(ARR(x + w, cy, x + w + gap - 3, cy, MUT, 1.6))
            if note and i < len(note) and note[i]:
                o.append(T(x + w + gap / 2, cy - bh / 2 - 8, note[i], "middle", 9.5, FNT))
        x += w + gap
    return "".join(o), x - gap

def flowdown(cx, y0, items, w=300, bh=48, gap=30, c=LIN, fill=PAN, note=None):
    o = []
    y = y0
    for i, it in enumerate(items):
        if isinstance(it, tuple):
            t = it[0]; s = it[1] if len(it) > 1 else None
        else:
            t, s = it, None
        col, fl = c, fill
        if isinstance(it, tuple) and len(it) >= 3:
            col = it[2]; fl = it[3] if len(it) > 3 else fill
        o.append(BOX(cx - w / 2, y, w, bh, t, s, col, fl))
        if i < len(items) - 1:
            o.append(ARR(cx, y + bh, cx, y + bh + gap - 3, MUT, 1.6))
            if note and i < len(note) and note[i]:
                o.append(T(cx + 12, y + bh + gap / 2 + 4, note[i], "start", 10, FNT))
        y += bh + gap
    return "".join(o), y - gap

def stack(x, y, w, layers, lh=40, gap=4):
    o = []
    yy = y
    for l in layers:
        lab = l[0]; sub = l[1] if len(l) > 1 else None
        col = l[2] if len(l) > 2 else LIN
        fl = l[3] if len(l) > 3 else PAN
        o.append(BOX(x, yy, w, lh, lab, sub, col, fl, INK, 6, 1.4, 11.5, 9.5))
        yy += lh + gap
    return "".join(o), yy - gap

def AXES(x, y, w, h, xl=None, yl=None, c=MUT):
    """左下原点の座標軸。(x,y)=原点。上・右に矢印"""
    o = [ARR(x, y, x + w, y, c, 1.5), ARR(x, y, x, y - h, c, 1.5)]
    if xl:
        o.append(T(x + w - 4, y + 18, xl, "end", 10.5, MUT, True))
    if yl:
        o.append(T(x - 8, y - h + 4, yl, "end", 10.5, MUT, True))
    return "".join(o)

def sine(x0, y0, w, cycles, amp, c=SIG, lw=1.8, ph=0.0, n=160, env=None):
    pts = []
    for i in range(n + 1):
        u = i / n
        a = amp * (env(u) if env else 1.0)
        pts.append((x0 + u * w, y0 - a * math.sin(2 * math.pi * cycles * u + ph)))
    return PL(pts, c, lw)

def chirpw(x0, y0, w, c0, c1, amp, c=SIG, lw=1.8, n=300):
    """周波数が c0→c1 サイクルに増えるチャープ波形"""
    pts = []
    for i in range(n + 1):
        u = i / n
        phase = 2 * math.pi * (c0 * u + (c1 - c0) * u * u / 2)
        pts.append((x0 + u * w, y0 - amp * math.sin(phase)))
    return PL(pts, c, lw)

def gauss_pulse(x0, y0, w, center, width, amp, c=SIG, lw=1.8, n=120):
    pts = []
    for i in range(n + 1):
        u = i / n
        a = amp * math.exp(-((u - center) / width) ** 2)
        pts.append((x0 + u * w, y0 - a))
    return PL(pts, c, lw)


# ---------- 電磁界編の追加部品 ----------

def GRID(x, y, w, h, nx, ny, c=LIN, lw=0.7, fill=None):
    """直交格子"""
    o = []
    if fill:
        o.append(RECT(x, y, w, h, 0, fill, "none", 0))
    for i in range(nx + 1):
        xx = x + w * i / nx
        o.append(W(xx, y, xx, y + h, c=c, lw=lw))
    for j in range(ny + 1):
        yy = y + h * j / ny
        o.append(W(x, yy, x + w, yy, c=c, lw=lw))
    return "".join(o)

def WAVE(x0, y0, w, cycles, amp, c=SIG, lw=1.8, ph=0.0, n=200, decay=0.0):
    """減衰つき正弦波"""
    pts = []
    for i in range(n + 1):
        u = i / n
        a = amp * math.exp(-decay * u)
        pts.append((x0 + u * w, y0 - a * math.sin(2 * math.pi * cycles * u + ph)))
    return PL(pts, c, lw)

def FARR(x, y, dx, dy, c=SIG, lw=1.6):
    """場のベクトル矢印（短い）"""
    return ARR(x, y, x + dx, y + dy, c, lw, 5)

def CROSS(x, y, r=6, c=INK, lw=1.6):
    """×印（紙面奥向きベクトル）"""
    return (CIRC(x, y, r, c, lw) + W(x - r*0.6, y - r*0.6, x + r*0.6, y + r*0.6, c=c, lw=lw)
            + W(x - r*0.6, y + r*0.6, x + r*0.6, y - r*0.6, c=c, lw=lw))

def DOTIN(x, y, r=6, c=INK, lw=1.6):
    """・印（紙面手前向きベクトル）"""
    return CIRC(x, y, r, c, lw) + D(x, y, c, 2.2)

def SLAB(x, y, w, h, label=None, c=SIG, fill=SSOFT, sz=11):
    """材料スラブ"""
    o = [RECT(x, y, w, h, 3, fill, c, 1.4)]
    if label:
        o.append(T(x + w / 2, y + h / 2 + 4, label, "middle", sz, INK, True))
    return "".join(o)

def TRI(pts, c=LIN, lw=1.2, fill="none"):
    d = " ".join("%g,%g" % p for p in pts)
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g"/>' % (d, fill, c, lw)

def ANT(x, y, s=1.0, c=SIG):
    """パッチアンテナのアイコン（側面）"""
    o = [RECT(x - 30*s, y, 60*s, 6*s, 1, SSOFT, c, 1.4)]
    o.append(RECT(x - 40*s, y + 6*s, 80*s, 3*s, 0, MUT, MUT, 0.8))
    o.append(W(x, y + 9*s, x, y + 22*s, c=c, lw=1.8))
    return "".join(o)



# ===================== 基板向けヘルパ =====================

CU  = SIG          # 銅
DIE = PAN          # 誘電体
RES = GRN          # レジスト

def LAYER(x, y, w, h, label=None, fill=PAN, c=LIN, lw=1.1, sz=9.5, tc=MUT, right=None):
    """断面図の 1 層（帯）。label は帯の中、right は帯の右外に置く注記。"""
    o = [RECT(x, y, w, h, 0, fill, c, lw)]
    if label:
        o.append(T(x + 10, y + h / 2 + sz * 0.35, label, "start", sz, tc))
    if right:
        o.append(T(x + w + 8, y + h / 2 + sz * 0.35, right, "start", sz, FNT))
    return "".join(o)

def COPPER(x, y, w, h=6, c=SIG):
    """銅箔（べた）の帯。"""
    return RECT(x, y, w, h, 0, c, c, 0)

def TRAPZ(cx, ytop, wtop, wbot, h, c=SIG, fill=None, lw=1.2):
    """エッチング後の台形断面の配線。"""
    f = fill if fill else c
    pts = "%g,%g %g,%g %g,%g %g,%g" % (cx - wtop/2, ytop, cx + wtop/2, ytop,
                                       cx + wbot/2, ytop + h, cx - wbot/2, ytop + h)
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g"/>' % (pts, f, c, lw)

def PAD(x, y, w, h, c=SIG, fill=None, r=1):
    return RECT(x, y, w, h, r, fill if fill else c, c, 1.2)

def VIACUT(cx, ytop, ybot, d=14, wall=3, c=SIG):
    """断面から見たビア（内壁めっきの 2 本の柱）。"""
    o = [RECT(cx - d/2 - wall, ytop, wall, ybot - ytop, 0, c, c, 0),
         RECT(cx + d/2, ytop, wall, ybot - ytop, 0, c, c, 0)]
    return "".join(o)

def DIM(x1, y1, x2, y2, label=None, c=MUT, sz=9.5, off=0, tc=None):
    """寸法線（両矢印）＋ラベル。"""
    o = [DARR(x1, y1, x2, y2, c, 1.1, 5)]
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if abs(y2 - y1) < abs(x2 - x1):
            o.append(T(mx, my - 6 + off, label, "middle", sz, tc or c))
        else:
            o.append(T(mx + 8 + off, my + 3, label, "start", sz, tc or c))
    return "".join(o)

def LOOP(pts, c=ALI, lw=2.0, dash=None, arrow_at=None):
    """電流ループ（閉じた折れ線）。arrow_at で途中に進行方向の矢印を置く。"""
    d = " ".join("%g,%g" % (p[0], p[1]) for p in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ['<polygon points="%s" fill="none" stroke="%s" stroke-width="%g"%s/>' % (d, c, lw, da)]
    if arrow_at is not None:
        i = arrow_at % len(pts)
        j = (i + 1) % len(pts)
        mx = (pts[i][0] + pts[j][0]) / 2; my = (pts[i][1] + pts[j][1]) / 2
        dx = pts[j][0] - pts[i][0]; dy = pts[j][1] - pts[i][1]
        n = math.hypot(dx, dy) or 1
        o.append(ARR(mx - dx/n*9, my - dy/n*9, mx + dx/n*9, my + dy/n*9, c, lw, 7))
    return "".join(o)

def PART(x, y, w, h, label=None, c=INK, fill=PAN, sz=9.5):
    """部品の外形（上から見た四角）。"""
    o = [RECT(x, y, w, h, 2, fill, c, 1.3)]
    if label:
        o.append(T(x + w/2, y + h/2 + sz*0.35, label, "middle", sz, c, True))
    return "".join(o)

def TICKS(x0, y, x1, vals, fmt=None, c=FNT, sz=9):
    """横軸の目盛ラベル。vals は (相対位置 0..1, 文字) の列。"""
    o = []
    for u, s in vals:
        xx = x0 + (x1 - x0) * u
        o.append(W(xx, y, xx, y + 4, c=LIN, lw=1))
        o.append(T(xx, y + 15, s, "middle", sz, c))
    return "".join(o)

# ===================== 01. アートワークとは =====================

F["p01_netlist"] = SVG(860, 300, [
    T(430, 26, "回路図が持っている情報と、持っていない情報", "middle", 12.5, INK, True),
    RECT(30, 50, 380, 210, 10, SCR, LIN, 1.3),
    T(220, 74, "回路図 ＝ ネットリスト", "middle", 11.5, INK, True),
    T(220, 98, "U1.3 — R5.1 — C2.1  が同じネット", "middle", 10, MUT, True),
] + [
    T(60, 128 + i * 26, t, "start", 10, GRN) for i, t in enumerate([
        "◎ 何と何がつながるか",
        "◎ 部品の値（10 kΩ、100 nF）",
        "◎ 部品の種類・型番",
    ])
] + [
    T(60, 212, "× どこを通るか", "start", 10, ALI),
    T(60, 236, "× 導体どうしの距離、電流の帰り道", "start", 10, ALI),
    ARR(420, 155, 470, 155, MUT, 1.8),
    RECT(480, 50, 350, 210, 10, SSOFT, SIG, 1.4),
    T(655, 74, "アートワーク ＝ 形を与える", "middle", 11.5, INK, True),
] + [
    T(510, 104 + i * 26, t, "start", 10, MUT) for i, t in enumerate([
        "どの部品を、どこに置くか",
        "どの層の、どこを通すか",
        "どれだけの幅と間隔にするか",
        "電流はどこを帰るか",
        "作れるか・載せられるか・冷えるか",
    ])
] + [
    T(655, 244, "ここで寄生成分と性能が決まる", "middle", 10.5, SIG, True),
], "ネットリストには長さも距離も向きもない。それを全部決めるのがアートワークである")

F["p01_same"] = SVG(860, 330, [
    T(430, 26, "同じ回路図から、動く基板と動かない基板が生まれる", "middle", 12.5, INK, True),
    # 良い例
    RECT(30, 50, 390, 200, 10, SCR, GRN, 1.4),
    T(225, 74, "近くに置いた場合", "middle", 11, GRN, True),
    PART(70, 110, 90, 70, "IC", INK, PAN),
    PART(180, 130, 34, 30, "C", SIG, SSOFT),
    W(160, 138, 180, 138, c=SIG, lw=3),
    W(160, 152, 180, 152, c=MUT, lw=3),
    T(225, 208, "経路 2 mm → 約 2 nH", "middle", 10.5, INK, True),
    T(225, 230, "1 A/ns の変化で 2 V の落ち込み", "middle", 9.5, MUT),
    # 悪い例
    RECT(440, 50, 390, 200, 10, ASOFT, ALI, 1.4),
    T(635, 74, "遠くに置いた場合", "middle", 11, ALI, True),
    PART(470, 110, 90, 70, "IC", INK, PAN),
    PART(760, 130, 34, 30, "C", SIG, SSOFT),
    W(560, 138, 760, 138, c=SIG, lw=3),
    W(560, 152, 760, 152, c=MUT, lw=3),
    T(660, 196, "20 mm", "middle", 9.5, MUT),
    T(635, 208, "経路 20 mm → 約 20 nH", "middle", 10.5, ALI, True),
    T(635, 230, "同じ変化で 20 V 相当 —— 電源が崩れる", "middle", 9.5, ALI),
    RECT(30, 266, 800, 50, 8, SSOFT, SIG, 1.4),
    T(430, 288, "部品表も回路図も同じ。違うのは距離だけである", "middle", 11.5, INK, True),
    T(430, 306, "配線のインダクタンスは約 1 nH/mm。長さがそのまま性能になる", "middle", 10, MUT),
], "「つながっていれば同じ」が成り立つのは、直流に近い低い周波数だけである")

F["p01_flow"] = SVG(860, 300, [
    T(430, 26, "回路図から実装まで — 工程の地図", "middle", 12.5, INK, True),
    flowright(24, 78, [("要件の確認", "外形・層数・量", LIN, PAN),
                       ("部品とフットプリント", "06 章", LIN, PAN),
                       ("層構成", "05 章", SIG, SSOFT),
                       ("部品配置", "07 章・性能の 8 割", ALI, ASOFT),
                       ("配線", "09〜16 章", SIG, SSOFT)], 157, 62, 12)[0],
    flowright(24, 168, [("ベタ・スティッチング", "13 章", SIG, SSOFT),
                        ("検証（DRC/DFM）", "04・20 章", LIN, PAN),
                        ("出図", "22 章", LIN, PAN),
                        ("製造", "03 章", GRN, PAN),
                        ("実装", "21 章", GRN, PAN)], 157, 62, 12)[0],
    ARR(820, 110, 836, 110, MUT, 1.4),
    ARR(24, 140, 24, 160, MUT, 1.4),
    RECT(24, 226, 812, 58, 8, ASOFT, ALI, 1.4),
    T(430, 250, "後戻りが最も高くつくのは「部品配置」である", "middle", 11.5, INK, True),
    T(430, 272, "配置を変えると配線が全部やり直しになる。配置で悩む時間は、配線で取り返せる", "middle", 10, MUT),
], "実際には反復する。ただし戻る回数と深さを減らすのが設計の腕である")

F["p01_roles"] = SVG(860, 320, [
    T(430, 26, "アートワークは 1 人で完結しない", "middle", 12.5, INK, True),
    BOX(340, 128, 180, 64, "アートワーク", None, SIG, SSOFT, INK, 8, 1.6, 12),
] + sum([[
    BOX(x, y, 200, 58, name, note, c, fill, INK, 8, 1.3, 10.5, 9),
    ARR(ax, ay, bx, by, MUT, 1.4),
] for x, y, name, note, c, fill, ax, ay, bx, by in [
    (40, 56, "回路設計者", "速い/敏感/大電流はどれか", LIN, PAN, 244, 92, 336, 128),
    (620, 56, "機構設計者", "外形・穴・高さ・コネクタ位置", LIN, PAN, 616, 92, 524, 128),
    (40, 218, "基板メーカ", "最小線幅・層構成・納期", GRN, PAN, 244, 236, 336, 190),
    (620, 218, "実装業者", "部品間隔・基準マーク・テスト", GRN, PAN, 616, 236, 524, 190),
]], []) + [
    RECT(280, 258, 300, 46, 8, ASOFT, ALI, 1.3),
    T(430, 278, "制約は着手前に全部集める", "middle", 11, INK, True),
    T(430, 296, "紙 1 枚の確認で、数日の手戻りが防げる", "middle", 9.5, MUT),
], "品質・認証（沿面距離、規格適合）も忘れずに。あとから効いてくる")

# ===================== 02. 基板の物理構造 =====================

_L4 = [("シルク（インク・数 µm）", SCR, "電気的には無関係"),
       ("ソルダーレジスト（10〜25 µm）", PAN, "銅を覆う絶縁膜"),
       ("L1 銅箔 35 µm ＋ めっき", None, "外層。めっきで厚くなる"),
       ("プリプレグ 0.1〜0.2 mm", PAN, "溶けて接着する層"),
       ("L2 銅箔 18〜35 µm", None, "内層・基準面にする"),
       ("コア 1.2 mm（硬化済み）", SCR, "板厚の骨格"),
       ("L3 銅箔 18〜35 µm", None, "内層"),
       ("プリプレグ 0.1〜0.2 mm", PAN, None),
       ("L4 銅箔 35 µm ＋ めっき", None, "外層"),
       ("ソルダーレジスト／シルク", PAN, None)]

F["p02_cross"] = SVG(860, 372, [
    T(430, 26, "4 層基板の断面 — 上から順に", "middle", 12.5, INK, True),
] + sum([[
    LAYER(150, 46 + i * 30, 420, 26, name,
          (SIG if "銅箔" in name else (fill or SCR)),
          (GRN if "レジスト" in name else LIN),
          (1.6 if "レジスト" in name else 1.1), 9.5,
          (SCR if "銅箔" in name else (GRN if "レジスト" in name else MUT)),
          right)
] for i, (name, fill, right) in enumerate(_L4)], []) + [
    DIM(120, 46, 120, 346, None, MUT),
    T(112, 200, "1.6 mm", "end", 10, INK, True),
], "コアは硬化済みの板、プリプレグは半硬化のシート。プリプレグは積層時に溶けて隣の層を接着する")

F["p02_copper"] = SVG(860, 300, [
    T(430, 26, "銅箔厚 — oz は重さの単位である", "middle", 12.5, INK, True),
    T(430, 50, "1 oz/ft² ＝ 厚さ約 35 µm（1.37 mil）", "middle", 11, SIG, True),
] + sum([[
    T(150, 92 + i * 44, name, "end", 11, INK, True),
    RECT(170, 78 + i * 44, 360, 26, 0, SSOFT, SIG, 1.2),
    RECT(170, 78 + i * 44, 360 * th / 105.0, 26, 0, SIG, SIG, 0),
    T(546, 96 + i * 44, "%d µm" % th, "start", 10.5, SIG, True),
    T(620, 96 + i * 44, note, "start", 9.5, MUT),
] for i, (name, th, note) in enumerate([
    ("0.5 oz", 18, "内層・細かいパターン"),
    ("1 oz", 35, "最も標準。外層の既定値"),
    ("2 oz", 70, "電流を流す層"),
    ("3 oz", 105, "電源基板。細い線は引けない"),
])], []) + [
    RECT(30, 258, 800, 34, 8, ASOFT, ALI, 1.3),
    T(430, 280, "厚い銅は「太い線しか引けない銅」でもある —— 1 oz で 0.1 mm、3 oz で 0.3 mm が下限", "middle", 11, INK, True),
], "外層はスルーホールめっきでさらに厚くなる（完成 45〜60 µm）。発注時にどちらの値かを確認する")

F["p02_material"] = SVG(860, 300, [
    T(430, 26, "FR-4 の 4 つの性質", "middle", 12.5, INK, True),
] + sum([[
    BOX(24 + i * 208, 52, 196, 74, name, sub, c, fill, INK, 8, 1.3, 11, 9),
    T(122 + i * 208, 148, val, "middle", 11.5, SIG, True),
    T(122 + i * 208, 168, where, "middle", 9, MUT),
] for i, (name, sub, val, where, c, fill) in enumerate([
    ("比誘電率 εr（Dk）", "電界の通りにくさ", "4.2〜4.6", "Z₀ と伝搬速度（10 章）", SIG, SSOFT),
    ("誘電正接 tanδ（Df）", "誘電体での損失", "0.02", "数 GHz で効き始める", SIG, SSOFT),
    ("ガラス転移温度 Tg", "樹脂が軟化する温度", "130/150/170 ℃", "リフロー耐性", LIN, PAN),
    ("厚さ方向の熱膨張", "熱で縦に伸びる量", "40〜70 ppm/℃", "ビアの信頼性", LIN, PAN),
])], []) + [
    RECT(24, 190, 812, 92, 8, SSOFT, SIG, 1.4),
    T(430, 214, "εr は「一定値」ではない", "middle", 11.5, INK, True),
    T(430, 236, "周波数で下がる（1 MHz 4.6 → 1 GHz 4.3 → 10 GHz 4.1）", "middle", 10, MUT),
    T(430, 256, "ガラス布の織り目のどこを通るかでも数 % 変わる（11 章のスキュー）", "middle", 10, MUT),
    T(430, 276, "だから Z₀ の公差 ±10 % は、材料のばらつき込みでそこに収めるという意味である", "middle", 10, SIG),
], "低損失材（tanδ 0.003〜0.005）は 10 Gbps 級で必要になるが、価格が数倍になる")

F["p02_resist"] = SVG(860, 310, [
    T(430, 26, "レジスト開口の 2 方式 — NSMD と SMD", "middle", 12.5, INK, True),
    # NSMD: 開口がパッドより広い
    RECT(40, 52, 370, 190, 10, SCR, GRN, 1.4),
    T(225, 76, "NSMD（銅で外形が決まる）＝ 標準", "middle", 11, GRN, True),
    RECT(60, 150, 330, 26, 0, PAN, LIN, 1),
    RECT(160, 138, 130, 12, 0, SIG, SIG, 0),
    RECT(60, 120, 76, 30, 0, RES, RES, 0),
    RECT(314, 120, 76, 30, 0, RES, RES, 0),
    DIM(136, 110, 314, 110, "レジスト開口", RES, 9.5, 0, RES),
    DIM(160, 190, 290, 190, "パッド（銅）", SIG, 9.5, 0, SIG),
    T(225, 214, "開口がパッドより広い → 銅の端が露出する", "middle", 10, INK, True),
    T(225, 232, "寸法が銅で決まるので正確。側面にもはんだが回る", "middle", 9.5, MUT),
    # SMD: 開口がパッドより狭い
    RECT(450, 52, 370, 190, 10, SCR, LIN, 1.3),
    T(635, 76, "SMD（レジスト開口で外形が決まる）", "middle", 11, INK, True),
    RECT(470, 150, 330, 26, 0, PAN, LIN, 1),
    RECT(534, 138, 202, 12, 0, SIG, SIG, 0),
    RECT(470, 120, 96, 30, 0, RES, RES, 0),
    RECT(704, 120, 96, 30, 0, RES, RES, 0),
    DIM(566, 110, 704, 110, "レジスト開口", RES, 9.5, 0, RES),
    DIM(534, 190, 736, 190, "パッド（銅）", SIG, 9.5, 0, SIG),
    T(635, 214, "開口がパッドより狭い → レジストが銅の端に乗る", "middle", 10, INK, True),
    T(635, 232, "銅の面積が大きく剥がれにくい。BGA の一部で使う", "middle", 9.5, MUT),
    RECT(40, 256, 780, 40, 8, ASOFT, ALI, 1.3),
    T(430, 281, "シルクをパッドの上に印刷しない —— インクが乗るとはんだが濡れない", "middle", 11, INK, True),
], "青がレジスト、緑が銅（パッド）。レジストは銅パターンに対して ±0.05 mm ずれるので、NSMD では片側 0.05 mm 大きく開ける")

F["p02_finish"] = SVG(860, 300, [
    T(430, 26, "表面処理 — 銅は放っておくと酸化する", "middle", 12.5, INK, True),
    T(160, 58, "処理", "middle", 10.5, MUT, True),
    T(360, 58, "平坦性", "middle", 10.5, MUT, True),
    T(520, 58, "保存性", "middle", 10.5, MUT, True),
    T(650, 58, "コスト", "middle", 10.5, MUT, True),
    T(770, 58, "細ピッチ/BGA", "middle", 10.5, MUT, True),
    W(40, 68, 820, 68, c=LIN, lw=1),
] + sum([[
    RECT(40, 78 + i * 42, 780, 36, 6, fill, c, 1.2),
    T(160, 100 + i * 42, name, "middle", 11, INK, True),
    T(360, 100 + i * 42, flat, "middle", 10, MUT),
    T(520, 100 + i * 42, keep, "middle", 10, MUT),
    T(650, 100 + i * 42, cost, "middle", 10, MUT),
    T(770, 100 + i * 42, bga, "middle", 10, bc, True),
] for i, (name, flat, keep, cost, bga, c, fill, bc) in enumerate([
    ("HASL", "悪い（10〜30 µm の凹凸）", "良い", "安い", "不向き", ALI, ASOFT, ALI),
    ("OSP", "非常に良い", "短い（熱に弱い）", "安い", "可", LIN, PAN, MUT),
    ("ENIG", "非常に良い", "長い", "高い", "最適", GRN, PAN, GRN),
    ("銀（Immersion Ag）", "良い", "中（硫化に注意）", "中", "可", LIN, PAN, MUT),
])], []) + [
    RECT(40, 252, 780, 34, 8, SSOFT, SIG, 1.3),
    T(430, 274, "0.5 mm ピッチ以下の BGA を HASL で作ると、実装歩留まりが落ちる", "middle", 11, INK, True),
], "ENIG の金ははんだ付けのための保護膜であって導体ではない。厚くしすぎると接合が脆くなる")

# ===================== 03. 製造プロセス =====================

F["p03_flow"] = SVG(860, 330, [
    T(430, 26, "両面スルーホール基板の主要工程", "middle", 12.5, INK, True),
    flowright(24, 76, [("材料の裁断", None, LIN, PAN),
                       ("内層パターン形成", "エッチング", SIG, SSOFT),
                       ("黒化処理", "接着性を上げる", LIN, PAN),
                       ("積層プレス", "層ずれが生じる", ALI, ASOFT)], 196, 58, 12)[0],
    flowright(24, 158, [("ドリル", "位置 ±0.05〜0.075", ALI, ASOFT),
                        ("スルーホールめっき", "外層銅が厚くなる", SIG, SSOFT),
                        ("外層パターン形成", "エッチング", SIG, SSOFT),
                        ("ソルダーレジスト", "±0.05 mm ずれる", GRN, PAN)], 196, 58, 12)[0],
    flowright(24, 240, [("表面処理", "ENIG/OSP/HASL", GRN, PAN),
                        ("シルク印刷", None, LIN, PAN),
                        ("外形加工", "±0.1〜0.2 mm", ALI, ASOFT),
                        ("電気検査", "導通・絶縁の全数", GRN, PAN)], 196, 58, 12)[0],
    ARR(24, 134, 24, 156, MUT, 1.4), ARR(24, 216, 24, 238, MUT, 1.4),
], "多層では内層ぶんを先に作り、積層プレスで貼り合わせてから穴をあける")

F["p03_etch"] = SVG(860, 320, [
    T(430, 26, "エッチング — 銅は削って作るので、横にも溶ける", "middle", 12.5, INK, True),
    # 理想
    RECT(40, 52, 370, 190, 10, SCR, LIN, 1.3),
    T(225, 76, "設計データ（理想）", "middle", 11, MUT, True),
    RECT(120, 150, 180, 34, 0, PAN, LIN, 1),
    RECT(160, 116, 100, 34, 0, SIG, SIG, 0),
    RECT(160, 104, 100, 12, 0, RES, RES, 0),
    T(154, 112, "レジスト", "end", 9, GRN, True),
    T(154, 138, "銅", "end", 9, SIG, True),
    DIM(160, 200, 260, 200, "設計幅 w", MUT),
    T(225, 228, "断面は長方形のはず", "middle", 10, MUT),
    # 現実
    RECT(450, 52, 370, 190, 10, ASOFT, ALI, 1.3),
    T(635, 76, "実際にできるもの", "middle", 11, ALI, True),
    RECT(530, 150, 180, 34, 0, PAN, LIN, 1),
    TRAPZ(620, 116, 72, 100, 34, SIG, SIG, 0),
    RECT(570, 104, 100, 12, 0, RES, RES, 0),
    DIM(570, 200, 670, 200, "設計幅 w", MUT),
    ARR(548, 128, 582, 128, ALI, 1.4), ARR(692, 128, 658, 128, ALI, 1.4),
    T(635, 96, "アンダーカット（両側で銅厚ぶん）", "middle", 9.5, ALI, True),
    T(635, 228, "上面は設計値より細い台形になる", "middle", 10, ALI, True),
    RECT(40, 256, 780, 52, 8, SSOFT, SIG, 1.4),
    T(430, 278, "アンダーカットは銅厚と同程度まで進む", "middle", 11.5, INK, True),
    T(430, 298, "だから最小線幅は 1 oz で 0.1 mm、2 oz で 0.2 mm、3 oz で 0.3 mm と太くなる", "middle", 10, MUT),
], "内層は銅箔のまま（薄い）ので細く引ける。外層はめっきで厚くなるので太くなる")

F["p03_plating"] = SVG(860, 300, [
    T(430, 26, "ドリルとスルーホールめっき", "middle", 12.5, INK, True),
    flowright(60, 92, [("① ドリルで穴をあける", "内壁は絶縁材のまま", LIN, PAN),
                       ("② 無電解めっき", "薄い銅の種を付ける", SIG, SSOFT),
                       ("③ 電解めっき", "銅を 20〜25 µm に成長", SIG, SSOFT)], 236, 68, 16)[0],
    # 断面
    RECT(200, 170, 460, 62, 0, PAN, LIN, 1.2),
    COPPER(200, 164, 460, 7), COPPER(200, 232, 460, 7),
    RECT(400, 164, 60, 76, 0, SCR, SCR, 0),
    VIACUT(430, 164, 240, 60, 5, SIG),
    T(430, 262, "内壁のめっきが層をつなぐ", "middle", 10, SIG, True),
    T(196, 168, "L1", "end", 9.5, MUT), T(196, 240, "L2", "end", 9.5, MUT),
    T(672, 178, "めっきで外層の銅も厚くなる", "start", 9.5, MUT),
    T(672, 198, "（1 oz → 完成 45〜60 µm）", "start", 9.5, FNT),
    T(672, 224, "仕上がり径 ≈ ドリル径 − 0.05〜0.1", "start", 9.5, ALI, True),
    T(430, 284, "リード部品の穴は「リード径 + 0.2〜0.3 mm」。同じ径では入らない", "middle", 10.5, INK, True),
], "アスペクト比（板厚÷ドリル径）が 8:1 を超えると、めっき液が奥まで回らない")

F["p03_annular"] = SVG(860, 300, [
    T(430, 26, "アニュラリング — 穴の周りに残る銅の輪", "middle", 12.5, INK, True),
    # 正常
    RECT(40, 52, 250, 190, 10, SCR, GRN, 1.3),
    T(165, 76, "正常", "middle", 11, GRN, True),
    CIRC(165, 150, 56, SIG, 2, SSOFT),
    CIRC(165, 150, 28, LIN, 1.4, SCR),
    DIM(165, 150, 221, 150, None, MUT),
    T(200, 128, "アニュラリング", "middle", 9, INK, True),
    T(165, 228, "穴がパッドの中に収まっている", "middle", 9.5, MUT),
    # ずれ
    RECT(305, 52, 250, 190, 10, SCR, LIN, 1.3),
    T(430, 76, "位置がずれた", "middle", 11, MUT, True),
    CIRC(430, 150, 56, SIG, 2, SSOFT),
    CIRC(452, 150, 28, LIN, 1.4, SCR),
    T(430, 228, "細くなるが、まだつながっている", "middle", 9.5, MUT),
    # ブレイクアウト
    RECT(570, 52, 250, 190, 10, ASOFT, ALI, 1.3),
    T(695, 76, "ブレイクアウト", "middle", 11, ALI, True),
    CIRC(695, 150, 56, SIG, 2, SSOFT),
    CIRC(730, 150, 28, ALI, 1.6, SCR),
    T(695, 228, "穴がパッドを突き破った → 断線の危険", "middle", 9.5, ALI, True),
    RECT(40, 256, 780, 34, 8, SSOFT, SIG, 1.3),
    T(430, 278, "アニュラリング ＝ (パッド径 − 穴径) / 2。一般には片側 0.15 mm 以上を確保する", "middle", 11, INK, True),
], "ドリル位置 ±0.05〜0.075 mm に、多層では積層時の層ずれが上乗せされる")

F["p03_registration"] = SVG(860, 290, [
    T(430, 26, "レジストのずれと、パッド周りの寸法", "middle", 12.5, INK, True),
    RECT(60, 56, 380, 176, 10, SCR, LIN, 1.3),
    T(250, 80, "パッドとレジスト開口", "middle", 11, INK, True),
    RECT(140, 116, 90, 30, 1, SIG, SIG, 0),
    RECT(270, 116, 90, 30, 1, SIG, SIG, 0),
    RECT(128, 106, 114, 50, 2, "none", RES, 1.8, "4 3"),
    RECT(258, 106, 114, 50, 2, "none", RES, 1.8, "4 3"),
    T(250, 174, "破線 = レジスト開口（片側 0.05 mm 大きく）", "middle", 9.5, RES),
    RECT(242, 106, 16, 50, 0, RES, RES, 0),
    T(250, 200, "パッド間に残るレジストの土手", "middle", 9.5, MUT),
    T(250, 218, "0.1 mm を切ると印刷で消える", "middle", 9.5, ALI, True),
    RECT(470, 56, 350, 176, 10, SCR, LIN, 1.3),
    T(645, 80, "一般的な下限", "middle", 11, INK, True),
] + [
    T(496, 112 + i * 30, a, "start", 10, MUT) for i, a in enumerate([
        "レジスト開口とパッドの隙間（片側）",
        "パッド間に残す土手の幅",
        "レジスト開口と隣の銅の隙間",
    ])
] + [
    T(800, 112 + i * 30, b, "end", 10.5, SIG, True) for i, b in enumerate(["0.05 mm", "0.1 mm", "0.05 mm"])
] + [
    T(645, 208, "0.4 mm ピッチ BGA では土手が作れない", "middle", 9.5, ALI),
    T(430, 268, "レジストは銅パターンに対して ±0.05 mm ずれる。だから開口はパッドより大きく開ける", "middle", 11, INK, True),
], "土手が作れない場合は開口をつなげた「窓」にするか、SMD 方式にする（02 章）")

F["p03_outline"] = SVG(860, 300, [
    T(430, 26, "外形加工 — ルータと V カット", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 172, 10, fill, c, 1.3),
    T(155 + i * 278, 76, name, "middle", 11, tc, True),
    T(155 + i * 278, 100, mech, "middle", 9.5, MUT),
    T(155 + i * 278, 132, "公差 " + tol, "middle", 11.5, INK, True),
    T(155 + i * 278, 168, f1, "middle", 9.5, MUT),
    T(155 + i * 278, 188, f2, "middle", 9.5, MUT),
    T(155 + i * 278, 208, f3, "middle", 9.5, tc, True),
] for i, (name, mech, tol, f1, f2, f3, c, fill, tc) in enumerate([
    ("ルータ", "直径 2 mm 前後の刃で削る", "±0.1〜0.2 mm", "任意形状が作れる", "切断面はきれい", "内角に R 1 mm が残る", SIG, SSOFT, SIG),
    ("V カット", "表裏から V 溝を入れて折る", "±0.2 mm", "直線のみ・端から端まで", "安い・面付けに便利", "切断面が荒い", LIN, PAN, MUT),
    ("ミシン目タブ", "小穴を並べて残し、折る", "±0.2 mm", "任意形状の面付けに使える", "バリが残る", "研磨が要る場合がある", GRN, PAN, GRN),
])], []) + [
    RECT(24, 238, 812, 50, 8, ASOFT, ALI, 1.4),
    T(430, 260, "ルータは丸い刃なので、外形の内側の角には必ず半径が残る", "middle", 11.5, INK, True),
    T(430, 280, "筐体に「角までぴったり」で嵌める設計は入らない。逃がしを作る", "middle", 10, MUT),
], "銅から基板端までは 0.3 mm 以上（V カットなら 0.5 mm 以上）空ける")

# ===================== 04. 設計ルールと公差 =====================

F["p04_rules"] = SVG(860, 300, [
    T(430, 26, "DRC の検査項目は 3 系統に分かれる", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 168, 10, fill, c, 1.4),
    T(155 + i * 278, 78, name, "middle", 11.5, c, True),
] + [
    T(155 + i * 278, 108 + j * 22, it, "middle", 9.5, MUT) for j, it in enumerate(items)
] + [
    T(155 + i * 278, 202, bad, "middle", 10, ALI, True),
] for i, (name, items, bad, c, fill) in enumerate([
    ("製造できるか", ["最小線幅・最小間隔", "最小穴径", "アニュラリング", "基板端からの距離"],
     "作れない／歩留まり低下", SIG, SSOFT),
    ("実装できるか", ["パッド間隔", "レジスト土手", "部品どうしの隙間", "シルクとパッドの重なり"],
     "実装不良・修理不能", GRN, PAN),
    ("意図どおり動くか", ["差動ペアの間隔・等長", "インピーダンス制御", "沿面距離・空間距離", "禁止領域"],
     "動かない／認証で落ちる", ALI, ASOFT),
])], []) + [
    RECT(24, 236, 812, 52, 8, ASOFT, ALI, 1.4),
    T(430, 258, "DRC を通ったことは「正しい」ことを意味しない", "middle", 11.5, INK, True),
    T(430, 278, "ルールに入れ忘れた項目は検査されない。ルールの妥当性を決めるのは人間である", "middle", 10, MUT),
], "20 章の DFM は、この DRC が見ていない「作りやすさ」の観点を補うものである")

F["p04_class"] = SVG(860, 320, [
    T(430, 26, "製造クラス — 細かくすると価格も歩留まりも悪化する", "middle", 12.5, INK, True),
    T(160, 60, "クラス", "middle", 10.5, MUT, True),
    T(390, 60, "最小線幅 / 間隔", "middle", 10.5, MUT, True),
    T(570, 60, "最小仕上がり穴径", "middle", 10.5, MUT, True),
    T(710, 60, "価格の目安", "middle", 10.5, MUT, True),
    W(30, 70, 830, 70, c=LIN, lw=1),
] + sum([[
    RECT(30, 80 + i * 44, 800, 38, 6, fill, c, 1.2),
    T(160, 104 + i * 44, name, "middle", 11, INK, True),
    T(390, 104 + i * 44, ws, "middle", 10.5, c, True),
    T(570, 104 + i * 44, d, "middle", 10, MUT),
    T(710, 104 + i * 44, price, "middle", 10.5, pc, True),
] for i, (name, ws, d, price, c, fill, pc) in enumerate([
    ("標準", "0.15 / 0.15 mm（6 mil）", "0.3 mm", "基準", GRN, PAN, GRN),
    ("一般的な高密度", "0.127 / 0.127 mm（5 mil）", "0.25 mm", "+0〜10 %", SIG, SSOFT, MUT),
    ("高密度", "0.1 / 0.1 mm（4 mil）", "0.2 mm", "+20〜40 %", SIG, SSOFT, ALI),
    ("超高密度（HDI）", "0.075 / 0.075 mm（3 mil）", "0.15 mm（レーザ）", "+80 % 〜", ALI, ASOFT, ALI),
])], []) + [
    RECT(30, 262, 800, 50, 8, SSOFT, SIG, 1.4),
    T(430, 284, "正しい姿勢は「必要なところだけ細かくする」", "middle", 11.5, INK, True),
    T(430, 304, "BGA の下だけ 0.1 mm、それ以外は 0.2 mm —— 領域でルールを分けられる CAD がほとんどである", "middle", 10, MUT),
], "具体的な値と価格差はメーカによる。ここは相場感であり、必ず製造仕様書で確認すること")

F["p04_annular"] = SVG(860, 260, [
    T(430, 26, "アニュラリングの要求水準", "middle", 12.5, INK, True),
    CIRC(150, 130, 62, SIG, 2, SSOFT),
    CIRC(150, 130, 30, LIN, 1.5, SCR),
    DIM(150, 130, 212, 130, None, MUT),
    T(181, 108, "A", "middle", 11, INK, True),
    T(150, 216, "A = (パッド径 − 穴径) / 2", "middle", 10, MUT, True),
    RECT(280, 58, 550, 148, 10, SCR, LIN, 1.3),
    T(555, 82, "要求水準（IPC のクラス）", "middle", 11, INK, True),
] + sum([[
    T(310, 114 + i * 30, name, "start", 10.5, c, True),
    T(660, 114 + i * 30, val, "middle", 11, c, True),
    T(800, 114 + i * 30, note, "end", 9.5, MUT),
] for i, (name, val, note, c) in enumerate([
    ("クラス 1 相当（民生・短寿命）", "0.05 mm", "最低限", MUT),
    ("クラス 2 相当（産業機器）", "0.15 mm", "一般", SIG),
    ("クラス 3 相当（医療・車載・航空）", "0.2 mm 以上", "高信頼", ALI),
])], []) + [
    T(555, 190, "IPC ＝ 電子回路基板の業界団体。クラスは数字が大きいほど厳しい", "middle", 9.5, FNT),
    T(430, 244, "パッドを大きくするか、穴を小さくするか、公差の良いクラスを選ぶか —— ただでは安全にならない", "middle", 10.5, INK, True),
], "多層基板では積層時の層ずれも上乗せされるので、内層パッドは特に余裕が要る")

F["p04_stack"] = SVG(860, 340, [
    T(430, 26, "公差の積み上げ — アニュラリングの実例", "middle", 12.5, INK, True),
    T(430, 52, "仕上がり穴 φ0.3 mm、パッド φ0.6 mm → 設計上のアニュラリングは 0.15 mm", "middle", 10.5, MUT),
    RECT(30, 70, 800, 26, 4, SSOFT, SIG, 1.2),
    T(430, 88, "設計値 0.150 mm", "middle", 11, INK, True),
] + sum([[
    T(300, 128 + i * 26, name, "end", 10, MUT),
    RECT(316, 116 + i * 26, 430 * v / 0.10, 18, 3, ASOFT, ALI, 1.1),
    T(786, 130 + i * 26, "− %.3f" % v, "end", 10, ALI, True),
] for i, (name, v) in enumerate([
    ("ドリル位置公差", 0.075),
    ("層ずれ（内層パッド）", 0.075),
    ("穴径公差（半径換算）", 0.025),
    ("パッドのエッチング公差", 0.030),
])], []) + [
    W(30, 232, 830, 232, c=LIN, lw=1),
    RECT(30, 242, 390, 44, 8, ASOFT, ALI, 1.4),
    T(225, 262, "最悪ケース法（単純に足す）", "middle", 10.5, INK, True),
    T(225, 280, "0.150 − 0.205 = −0.055 mm → 成立しない", "middle", 10.5, ALI, True),
    RECT(440, 242, 390, 44, 8, SSOFT, SIG, 1.4),
    T(635, 262, "二乗和平方根（RSS）", "middle", 10.5, INK, True),
    T(635, 280, "√(0.075²+0.075²+0.025²+0.030²) = 0.113 → 0.037 mm 残る", "middle", 10, SIG, True),
    T(430, 314, "どちらで判断するかは要求信頼性で決める。大事なのは、どちらで判断したかを記録に残すことである", "middle", 10.5, INK, True),
], "対策はパッドを大きくする／穴を小さくする／公差の良いクラスを選ぶ。どれもコストか密度を払う")

# ===================== 05. 層構成 =====================

F["p05_what"] = SVG(860, 290, [
    T(430, 26, "スタックアップが決めているのは「層数」ではない", "middle", 12.5, INK, True),
] + sum([[
    BOX(24 + i * 278, 56, 262, 96, name, sub, c, fill, INK, 8, 1.4, 11.5, 9.5),
    T(155 + i * 278, 178, why, "middle", 10, MUT),
    T(155 + i * 278, 198, why2, "middle", 10, MUT),
] for i, (name, sub, why, why2, c, fill) in enumerate([
    ("リターン電流の道", "速い信号の隣に基準面はあるか", "ここが悪いと、配線で", "いくら頑張っても取り返せない", ALI, ASOFT),
    ("インピーダンスの素地", "配線と基準面の距離が Z₀ を決める", "距離が決まらないと", "線幅が決まらない（10 章）", SIG, SSOFT),
    ("価格・納期・板厚", "層数と材料と加工", "機構設計にも関わる", "メーカの標準構成が最も安い", GRN, PAN),
])], []) + [
    RECT(24, 222, 812, 52, 8, SSOFT, SIG, 1.4),
    T(430, 244, "だから、配線を始める前に決めなければならない", "middle", 11.5, INK, True),
    T(430, 264, "配置（07 章）と並んで、後から変えると全部やり直しになる工程である", "middle", 10, MUT),
], "層構成が決まらないうちに配線を始めるのは、寸法が決まらないうちに部品を切り出すようなものである")

F["p05_reference"] = SVG(860, 320, [
    T(430, 26, "配線とは、信号線と基準面の 2 本で 1 組である", "middle", 12.5, INK, True),
    # 良い
    RECT(30, 52, 390, 176, 10, SCR, GRN, 1.4),
    T(225, 76, "真下に連続した基準面がある", "middle", 11, GRN, True),
    RECT(70, 108, 300, 12, 1, SIG, SIG, 0),
    COPPER(70, 160, 300, 10, MUT),
    T(60, 118, "信号", "end", 9.5, SIG, True), T(60, 170, "GND", "end", 9.5, MUT, True),
    ARR(110, 102, 330, 102, SIG, 1.6),
    ARR(330, 178, 110, 178, GRN, 1.6),
    LOOP([(110, 108), (330, 108), (330, 166), (110, 166)], GRN, 1.4, "4 3"),
    T(225, 200, "ループが薄い → インダクタンス小・放射小", "middle", 10, GRN, True),
    # 悪い
    RECT(440, 52, 390, 176, 10, ASOFT, ALI, 1.4),
    T(635, 76, "真下に基準面がない", "middle", 11, ALI, True),
    RECT(480, 108, 300, 12, 1, SIG, SIG, 0),
    COPPER(480, 200, 130, 10, MUT), COPPER(680, 200, 100, 10, MUT),
    ARR(520, 102, 740, 102, SIG, 1.6),
    LOOP([(520, 108), (740, 108), (740, 208), (520, 208)], ALI, 1.6, "4 3"),
    T(635, 224, "帰り道が遠回り → 大きなループ", "middle", 10, ALI, True),
    RECT(30, 246, 800, 58, 8, SSOFT, SIG, 1.4),
    T(430, 270, "層構成の第一原則", "middle", 11.5, INK, True),
    T(430, 292, "速い信号を通す層の隣には、必ず連続した基準面を置く", "middle", 11.5, SIG, True),
], "基準面はグラウンド面であることが多いが、電源面でもよい（交流的には同じこと。08 章）")

F["p05_four"] = SVG(860, 330, [
    T(430, 26, "4 層基板 — 最も使われる構成と、厚みの配分", "middle", 12.5, INK, True),
] + sum([[
    RECT(160, 54 + i * 52, 420, 30, 0, fill, c, 1.3),
    T(180, 74 + i * 52, name, "start", 10.5, tc, True),
    T(560, 74 + i * 52, use, "end", 9.5, MUT),
] for i, (name, use, c, fill, tc) in enumerate([
    ("L1", "部品・主配線層", SIG, SSOFT, INK),
    ("L2  グラウンドベタ（分断しない）", "L1 の基準面", ALI, ASOFT, ALI),
    ("L3  電源ベタ（または配線）", "L4 の基準面・電源分配", GRN, PAN, INK),
    ("L4", "副配線層", SIG, SSOFT, INK),
])], []) + [
    DIM(140, 84, 140, 106, None, SIG), T(132, 100, "0.1〜0.2 mm", "end", 9.5, SIG, True),
    DIM(140, 136, 140, 158, None, MUT), T(132, 152, "1.2 mm（コア）", "end", 9.5, MUT),
    DIM(140, 188, 140, 210, None, SIG), T(132, 204, "0.1〜0.2 mm", "end", 9.5, SIG, True),
    T(600, 100, "← 薄くする", "start", 10, SIG, True),
    T(600, 152, "← 板厚の帳尻。機能はほぼない", "start", 10, MUT),
    T(600, 204, "← L1–L2 と対称に", "start", 10, SIG, True),
    RECT(30, 250, 800, 68, 8, SSOFT, SIG, 1.4),
    T(430, 272, "L1–L2 を薄くする 3 つの理由", "middle", 11.5, INK, True),
    T(430, 292, "① 50 Ω が現実的な線幅で取れる ② リターンのループ面積が小さい ③ クロストークが減る", "middle", 10, MUT),
    T(430, 310, "上下が非対称だと、プレス時の収縮差で基板が反る（20 章）", "middle", 10, ALI),
], "L2–L3 に電源–GND のペアを置けば面間容量が稼げるが、薄くないと高い周波数では効かない（14 章）")

F["p05_six"] = SVG(860, 372, [
    T(430, 26, "6 層基板 — 配線層を増やすか、基準面を増やすか", "middle", 12.5, INK, True),
    T(230, 56, "案 A（配線層 4 層）", "middle", 11, MUT, True),
    T(630, 56, "案 B（SI 重視）", "middle", 11, SIG, True),
] + sum([[
    RECT(80, 70 + i * 38, 300, 30, 0, fa, ca, 1.2),
    T(230, 90 + i * 38, "L%d  %s" % (i + 1, na), "middle", 10, INK, True),
    RECT(480, 70 + i * 38, 300, 30, 0, fb, cb, 1.2),
    T(630, 90 + i * 38, "L%d  %s" % (i + 1, nb), "middle", 10, INK, True),
] for i, (na, ca, fa, nb, cb, fb) in enumerate([
    ("配線", SIG, SSOFT, "配線（高速）", SIG, SSOFT),
    ("GND", ALI, ASOFT, "GND", ALI, ASOFT),
    ("配線", SIG, SSOFT, "配線（低速）", LIN, PAN),
    ("配線", SIG, SSOFT, "電源", GRN, PAN),
    ("電源", GRN, PAN, "GND", ALI, ASOFT),
    ("配線", SIG, SSOFT, "配線（高速）", SIG, SSOFT),
])], []) + [
    ARR(392, 165, 412, 165, ALI, 1.6),
    T(402, 148, "×", "middle", 14, ALI, True),
    T(230, 310, "L3 と L4 が向かい合い、隣接基準面がない → 低速専用", "middle", 9.5, ALI),
    T(630, 310, "L1・L6 が GND に隣接、L4–L5 で電源対 → 配線層は 3 層", "middle", 9.5, SIG),
    RECT(30, 324, 800, 42, 8, SSOFT, SIG, 1.4),
    T(430, 350, "層を増やす順番は「配線層」ではなく「基準面」である —— 4 層の次は、GND 面ごと増やす", "middle", 11, INK, True),
], "「配線が入らないから増やす」で基準面のない層を作ると、SI がかえって悪化することがある")

F["p05_flow"] = SVG(860, 300, [
    T(430, 26, "層構成を決める手順", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("高速・敏感なネットを数え、通す層を決める", None, LIN, PAN),
        ("それぞれに隣接基準面を割り当てる → 必要な GND 面の数", None, ALI, ASOFT),
        ("電源系統の数と電流を確認 → 面が要るか、太い線で足りるか", None, GRN, PAN),
        ("配線密度から配線層数を見積もる（BGA なら「ピン列数 − 1」）", None, LIN, PAN),
        ("総厚と対称性を整える", None, LIN, PAN),
        ("メーカの標準スタックアップに当てはめる", "追加費用なし・納期どおり・実績値つき", SIG, SSOFT),
    ], 620, 36, 6)[0],
], "この後に 10 章のインピーダンス計算で線幅を確定する。特別な理由がない限り標準構成から選ぶ")

# ===================== 06. フットプリント =====================

F["p06_terms"] = SVG(860, 344, [
    T(430, 26, "フットプリントは「銅の形」だけではない", "middle", 12.5, INK, True),
    # 図
    RECT(60, 54, 340, 190, 10, SCR, LIN, 1.3),
    RECT(160, 110, 40, 70, 1, SIG, SIG, 0),
    RECT(260, 110, 40, 70, 1, SIG, SIG, 0),
    RECT(150, 100, 60, 90, 2, "none", RES, 1.6, "4 3"),
    RECT(250, 100, 60, 90, 2, "none", RES, 1.6, "4 3"),
    RECT(120, 78, 220, 134, 2, "none", MUT, 1.2, "6 4"),
    T(230, 70, "禁止領域（keep-out）", "middle", 9, MUT),
    T(230, 232, "破線内 = レジスト開口 / 外周 = 禁止領域", "middle", 9, FNT),
    T(180, 152, "ランド", "middle", 9, SCR, True),
] + sum([[
    T(440, 72 + i * 26, name, "start", 10.5, c, True),
    T(640, 72 + i * 26, mean, "start", 9.5, MUT),
] for i, (name, mean, c) in enumerate([
    ("ランド（パッド）", "はんだ付けする銅の島", SIG),
    ("ランドパターン", "1 部品ぶんのランド配置全体", SIG),
    ("レジスト開口", "銅を露出させる範囲", RES),
    ("ペースト開口", "はんだを塗る穴（21 章）", GRN),
    ("シルク", "部品番号・極性・外形", MUT),
    ("禁止領域", "他の部品・配線を置かない範囲", MUT),
    ("3D 外形", "筐体との干渉確認用の高さ情報", MUT),
    ("原点", "実装機に渡す基準点", MUT),
])], []) + [
    RECT(60, 284, 780, 48, 8, ASOFT, ALI, 1.4),
    T(430, 306, "アートワークの不良の相当数は、配線ではなくフットプリントで生まれる", "middle", 11.5, INK, True),
    T(430, 324, "どれか 1 つ欠けても、実装で問題が出る", "middle", 10, MUT),
], "CAD が自動生成する部分と、自分で足す部分がある。生成されたものも必ず確認する")

F["p06_fillet"] = SVG(860, 310, [
    T(430, 26, "はんだフィレット — 強度と信頼性を決める形", "middle", 12.5, INK, True),
    RECT(200, 52, 460, 150, 10, SCR, LIN, 1.3),
    # 基板とランド
    COPPER(240, 158, 380, 10, SIG),
    RECT(330, 108, 200, 50, 2, PAN, INK, 1.4),
    T(430, 138, "部品（チップ）", "middle", 10, INK, True),
    # フィレット
    '<path d="M 260 158 L 330 158 L 330 118 Z" fill="%s" stroke="%s" stroke-width="1.2"/>' % (SSOFT, SIG),
    '<path d="M 600 158 L 530 158 L 530 118 Z" fill="%s" stroke="%s" stroke-width="1.2"/>' % (SSOFT, SIG),
    ARR(272, 190, 288, 168, ALI, 1.3), T(268, 200, "つま先 (toe)", "middle", 9, ALI),
    ARR(346, 96, 336, 112, GRN, 1.3), T(360, 90, "かかと (heel)", "middle", 9, GRN, True),
    T(430, 222, "側面 (side) は紙面の奥と手前に回る", "middle", 9, FNT),
    T(430, 246, "強度と信頼性に最も効くのは heel。内側を削ると、ここが痩せる", "middle", 11, GRN, True),
    RECT(30, 264, 800, 42, 8, ASOFT, ALI, 1.4),
    T(230, 288, "小さすぎる → 接合が弱い・検査困難", "middle", 10.5, ALI, True),
    T(630, 288, "大きすぎる → トゥームストーン・位置ずれ・ブリッジ", "middle", 10.5, ALI, True),
], "トゥームストーン＝片側だけ先に溶けて部品が立つ不良。左右のランドの熱容量差が主因（21 章）")

F["p06_density"] = SVG(860, 300, [
    T(430, 26, "IPC-7351 の 3 つの密度レベル", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 150, 10, fill, c, 1.4),
    T(155 + i * 278, 78, name, "middle", 12, c, True),
    T(155 + i * 278, 100, sub, "middle", 9.5, MUT),
    # 模式図
    RECT(70 + i * 278, 118, 30 + ext, 34, 1, SIG, SIG, 0),
    RECT(180 + i * 278 - ext, 118, 30 + ext, 34, 1, SIG, SIG, 0),
    RECT(112 + i * 278, 122, 56, 26, 1, PAN, INK, 1.2),
    T(155 + i * 278, 176, use, "middle", 9.5, MUT),
    T(155 + i * 278, 194, use2, "middle", 9.5, c, True),
] for i, (name, sub, use, use2, ext, c, fill) in enumerate([
    ("レベル A", "Most（フィレット最大）", "高信頼・手はんだ・修理性", "医療・車載", 22, GRN, PAN),
    ("レベル B", "Nominal（標準）", "既定値。迷ったらこれ", "一般的な製品", 12, SIG, SSOFT),
    ("レベル C", "Least（最小）", "高密度実装", "実装ラインの能力が前提", 2, ALI, ASOFT),
])], []) + [
    RECT(24, 216, 812, 70, 8, SSOFT, SIG, 1.4),
    T(430, 238, "式が積んでいるのは 3 つのばらつきである", "middle", 11.5, INK, True),
    T(430, 258, "部品寸法の公差 ＋ 基板の製造公差 ＋ 実装機の配置精度（二乗和で積む）", "middle", 10, MUT),
    T(430, 278, "→ 公差の大きい部品は大きめに、実装機の精度が低いならレベル A 寄りに", "middle", 10, SIG),
], "式を暗記する必要はない。何が積まれているかが分かっていれば、判断はできる")

F["p06_source"] = SVG(860, 316, [
    T(430, 26, "フットプリントをどこから持ってくるか", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("① 部品メーカの推奨ランドパターン（データシート）", "メーカが実際に評価している。最優先", GRN, PAN),
        ("② IPC-7351 の計算（CAD の自動生成）", "標準部品ならこれで十分", SIG, SSOFT),
        ("③ CAD 付属・配布ライブラリ", "必ず寸法を検証すること", ALI, ASOFT),
        ("④ 自作（図面から計算）", "上記がないとき", LIN, PAN),
    ], 600, 42, 8)[0],
    RECT(30, 258, 800, 48, 8, ASOFT, ALI, 1.4),
    T(430, 280, "ライブラリを信用してはいけない", "middle", 11.5, INK, True),
    T(430, 298, "ピン番号の入れ違い・寸法違い・1 番ピンの位置違いは実在する。データシートと 1 対 1 で照合する", "middle", 10, MUT),
], "特に危ないのはコネクタ（メーカごとにピンの数え方が違う）、電源 IC の放熱パッド、水晶とセンサ")

F["p06_qfn"] = SVG(860, 310, [
    T(430, 26, "QFN のサーマルパッド — 全面に塗ってはいけない", "middle", 12.5, INK, True),
    # 悪い
    RECT(40, 52, 370, 180, 10, ASOFT, ALI, 1.4),
    T(225, 76, "ペースト開口 = 全面", "middle", 11, ALI, True),
    RECT(155, 96, 140, 100, 2, SIG, SIG, 0),
    RECT(155, 96, 140, 100, 2, "none", ALI, 2, "5 3"),
    T(225, 214, "はんだが多すぎて部品が浮き、周囲の端子が接触しない", "middle", 9.5, ALI, True),
    # 良い
    RECT(450, 52, 370, 180, 10, SCR, GRN, 1.4),
    T(635, 76, "格子状に分割（開口率 50〜70 %）", "middle", 11, GRN, True),
    RECT(565, 96, 140, 100, 2, SSOFT, SIG, 1.2),
] + [
    RECT(572 + (i % 3) * 45, 102 + (i // 3) * 33, 32, 24, 1, SIG, SIG, 0) for i in range(9)
] + [
    T(635, 214, "はんだ量が適正になり、周囲の端子も確実に接触する", "middle", 9.5, GRN, True),
    RECT(40, 250, 780, 48, 8, SSOFT, SIG, 1.4),
    T(430, 272, "サーマルビアはパッド内に置くが、はんだが穴に吸われる", "middle", 11.5, INK, True),
    T(430, 292, "対策は「裏側からレジストで塞ぐ」または「樹脂で埋める」（12・18 章）", "middle", 10, MUT),
], "同じ問題は、ビアインパッドを穴埋めなしでやったときにも起きる（12 章）")

# ===================== 07. 部品配置 =====================

F["p07_why"] = SVG(860, 302, [
    T(430, 26, "配線でできるのは、配置で決まった距離を埋めることだけ", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 172, 10, SCR, GRN, 1.4),
    T(225, 76, "良い配置", "middle", 11, GRN, True),
    PART(80, 106, 70, 56, "A", INK, PAN), PART(280, 106, 70, 56, "B", INK, PAN),
    W(150, 134, 280, 134, c=SIG, lw=2.4),
    T(225, 200, "短い・まっすぐ・ビアなし", "middle", 10, GRN, True),
    RECT(450, 52, 370, 172, 10, ASOFT, ALI, 1.4),
    T(635, 76, "悪い配置", "middle", 11, ALI, True),
    PART(480, 100, 70, 52, "A", INK, PAN), PART(688, 140, 70, 40, "B", INK, PAN),
    PL([(550, 120), (596, 120), (596, 94), (776, 94), (776, 160), (758, 160)], SIG, 2.4),
    D(596, 120, ALI, 4), D(776, 94, ALI, 4),
    T(635, 200, "長い・遠回り・層をまたぐ（●はビア）", "middle", 10, ALI, True),
    RECT(40, 238, 780, 52, 8, SSOFT, SIG, 1.4),
    T(430, 260, "寄生成分は長さで決まる。配置は寄生成分の上限を先に決めてしまう", "middle", 11.5, INK, True),
    T(430, 280, "自動配線が汚いと感じたら、多くの場合それは配置の問題である", "middle", 10, MUT),
], "自動配線は「配置を所与として経路を探す」道具。悪い配置は忠実に反映される")

F["p07_order"] = SVG(860, 330, [
    T(430, 26, "配置は自由度の低い順に決める", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("① 機構で位置が決まるもの", "コネクタ・スイッチ・LED・取付穴 ← 筐体図面", ALI, ASOFT),
        ("② 大きい IC・BGA", "向きも含めて。配線の中心になる", SIG, SSOFT),
        ("③ その IC の周辺必須部品", "デカップリング・水晶・基準抵抗・終端", SIG, SSOFT),
        ("④ 電源回路", "入力から出力へ、電流の向きに素直に", GRN, PAN),
        ("⑤ アナログ・敏感な回路", "ノイズ源から離す（17 章）", GRN, PAN),
        ("⑥ 残り", "上の制約に沿って埋める", LIN, PAN),
    ], 620, 38, 4)[0],
    T(430, 320, "機構図面が確定していないなら、確定するまで配線を始めないのが正しい判断である", "middle", 10.5, ALI, True),
], "①〜③ を決めた段階で、その基板の性能はおおむね決まっている")

F["p07_rats"] = SVG(860, 300, [
    T(430, 26, "IC の向きを、ラッツネストで決める", "middle", 12.5, INK, True),
    T(430, 50, "ラッツネスト ＝ 未配線のネットを直線で表示したもの", "middle", 10, MUT),
    # 悪い向き
    RECT(40, 66, 370, 168, 10, ASOFT, ALI, 1.4),
    T(225, 90, "向きが悪い", "middle", 11, ALI, True),
    PART(180, 120, 90, 80, "IC", INK, PAN),
] + [
    W(180, 135 + i * 20, 90, 118 + i * 26, c=ALI, lw=1) for i in range(4)
] + [
    PART(70, 110, 34, 26, "M", MUT, SCR), PART(70, 160, 34, 26, "M", MUT, SCR),
    T(225, 220, "配線が交差する → ビアが増える", "middle", 9.5, ALI, True),
    # 良い向き
    RECT(450, 66, 370, 168, 10, SCR, GRN, 1.4),
    T(635, 90, "90° 回した", "middle", 11, GRN, True),
    PART(590, 120, 90, 80, "IC", INK, PAN),
] + [
    W(680, 135 + i * 20, 740, 132 + i * 20, c=GRN, lw=1) for i in range(4)
] + [
    PART(745, 126, 34, 26, "M", MUT, SCR), PART(745, 168, 34, 26, "M", MUT, SCR),
    T(635, 220, "交差なし・総距離が半分に", "middle", 9.5, GRN, True),
    RECT(40, 248, 780, 40, 8, SSOFT, SIG, 1.4),
    T(430, 272, "配置の初期に、上位の数ネットだけを直線で結んで、絡まりが最小になる向きを探す", "middle", 11, INK, True),
], "メモリインタフェースが出ている辺・電源ピンが集まる辺・アナログピンの辺を見て向きを決める")

F["p07_loop"] = SVG(860, 300, [
    T(430, 26, "小さくすべき 3 つの電流の環", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 154, 10, fill, c, 1.4),
    T(155 + i * 278, 76, name, "middle", 11, c, True),
    LOOP([(70 + i * 278, 100), (70 + i * 278 + wid, 100),
          (70 + i * 278 + wid, 100 + hei), (70 + i * 278, 100 + hei)], c, 2.0, None, 0),
    T(155 + i * 278, 182, why, "middle", 9.5, MUT),
] for i, (name, why, wid, hei, c, fill) in enumerate([
    ("スイッチング電源の入力", "最も激しい di/dt。EMC 最大の源（19 章）", 170, 46, ALI, ASOFT),
    ("IC の電源 → C → GND", "高い周波数の電流の環（14 章）", 130, 40, SIG, SSOFT),
    ("信号 → 受け側 → GND", "基準面が連続なら自動的に最小（08 章）", 150, 30, GRN, PAN),
])], []) + [
    RECT(24, 222, 812, 62, 8, SSOFT, SIG, 1.4),
    T(430, 246, "電流は必ず環を作って戻る。その環が囲む面積が、インダクタンスと放射を決める", "middle", 11.5, INK, True),
    T(430, 268, "配置で環を小さくしておけば、後の対策部品はほとんど要らなくなる", "middle", 10, MUT),
], "「あとでシールドを付ければいい」は最も高い対策。配置で 10 mm 離すのはタダである")

F["p07_dfa"] = SVG(860, 300, [
    T(430, 26, "実装できる配置にする", "middle", 12.5, INK, True),
    T(200, 58, "項目", "middle", 10.5, MUT, True),
    T(500, 58, "目安", "middle", 10.5, MUT, True),
    T(720, 58, "理由", "middle", 10.5, MUT, True),
    W(30, 68, 830, 68, c=LIN, lw=1),
] + sum([[
    RECT(30, 78 + i * 34, 800, 28, 5, fill, LIN, 1),
    T(200, 97 + i * 34, name, "middle", 10, INK, True),
    T(500, 97 + i * 34, val, "middle", 10, SIG, True),
    T(720, 97 + i * 34, why, "middle", 9.5, MUT),
] for i, (name, val, why, fill) in enumerate([
    ("部品どうしの隙間", "0.5 mm 以上（高い部品は 1 mm）", "ノズル・検査・修理", SCR),
    ("チップ部品の向き", "同じ向きに揃える", "速度・検査・トゥームストーン低減", PAN),
    ("基板端からの距離", "3〜5 mm は部品禁止", "実装機が掴む搬送レール", SCR),
    ("背の高い部品", "低い部品の影にしない", "光学検査（AOI）が見えない", PAN),
    ("コネクタの向き", "工具・指が入る向き", "組立作業性", SCR),
])], []) + [
    RECT(30, 256, 800, 34, 8, SSOFT, SIG, 1.3),
    T(430, 278, "向きを揃えると、リフロー炉での熱の当たり方が揃い、不良の条件を追い込める（21 章）", "middle", 11, INK, True),
], "これらは実装業者に確認できる。ラインの能力で数字は変わる")

# ===================== 08. グラウンド設計 =====================

F["p08_return"] = SVG(860, 280, [
    T(430, 26, "出ていった電流は、必ず同じ量だけ戻ってくる", "middle", 12.5, INK, True),
    RECT(120, 60, 620, 150, 10, SCR, LIN, 1.3),
    PART(160, 108, 70, 54, "TX", INK, PAN),
    PART(630, 108, 70, 54, "RX", INK, PAN),
    RECT(230, 112, 400, 10, 1, SIG, SIG, 0),
    ARR(280, 106, 580, 106, SIG, 1.8),
    T(430, 98, "信号電流 10 mA", "middle", 10, SIG, True),
    COPPER(160, 176, 540, 10, MUT),
    ARR(580, 170, 280, 170, GRN, 1.8),
    T(430, 200, "リターン電流 10 mA（逆向き）", "middle", 10, GRN, True),
    W(230, 122, 230, 176, c=MUT, lw=1.2), W(630, 122, 630, 176, c=MUT, lw=1.2),
    RECT(120, 226, 620, 42, 8, SSOFT, SIG, 1.4),
    T(430, 252, "どの経路を通るかは、設計者ではなく物理が決める", "middle", 11.5, INK, True),
], "設計者にできるのは、通ってほしい経路を最も低インピーダンスにしておくことだけである")

F["p08_freq"] = SVG(860, 320, [
    T(430, 26, "リターン電流の経路は、周波数で変わる", "middle", 12.5, INK, True),
    # 低周波
    RECT(40, 52, 370, 190, 10, SCR, LIN, 1.3),
    T(225, 76, "低い周波数（〜数百 kHz）", "middle", 11, MUT, True),
    T(225, 96, "Z ≈ R = ρℓ/A → 抵抗が最小の経路", "middle", 9.5, MUT),
    RECT(80, 120, 290, 12, 1, SIG, SIG, 0),
    COPPER(80, 190, 290, 44, PAN),
    RECT(80, 190, 290, 44, 0, "none", LIN, 1),
] + [
    ARR(340, 200 + i * 12, 110, 200 + i * 12, MUT, 1.2) for i in range(3)
] + [
    T(225, 258, "面全体に広がる → 最短距離", "middle", 10, MUT, True),
    # 高周波
    RECT(450, 52, 370, 190, 10, SSOFT, SIG, 1.4),
    T(635, 76, "高い周波数（数百 kHz 〜）", "middle", 11, SIG, True),
    T(635, 96, "Z ≈ 2πfL、L ∝ ループ面積", "middle", 9.5, MUT),
    RECT(490, 120, 290, 12, 1, SIG, SIG, 0),
    COPPER(490, 190, 290, 44, PAN),
    RECT(490, 190, 290, 44, 0, "none", LIN, 1),
    RECT(490, 190, 290, 12, 0, SIG, SIG, 0),
    ARR(750, 196, 520, 196, SIG, 2),
    T(635, 258, "信号線の真下に集中する", "middle", 10, SIG, True),
    RECT(40, 274, 780, 36, 8, ASOFT, ALI, 1.4),
    T(430, 297, "移行は f = R/(2πL) ≈ 数十〜数百 kHz。オーディオ帯より上は、すべて「真下を通る」側である", "middle", 11, INK, True),
], "エネルギーが最小になる分布に自然に落ち着くので、設計者が経路を指示することはできない")

F["p08_slit"] = SVG(860, 330, [
    T(430, 26, "スリットを横切ると、帰り道が大回りする", "middle", 12.5, INK, True),
    RECT(60, 52, 740, 204, 10, SCR, LIN, 1.3),
    # グラウンド面（上から見た図）とスリット
    RECT(100, 84, 660, 140, 0, PAN, LIN, 1.2),
    T(120, 100, "グラウンド面", "start", 9, MUT),
    RECT(400, 84, 40, 104, 0, SCR, SCR, 0),
    RECT(400, 84, 40, 104, 0, "none", ALI, 1.6, "5 4"),
    T(420, 78, "スリット", "middle", 9.5, ALI, True),
    T(620, 202, "スリットの外側ではつながっている", "start", 8.5, MUT),
    # 信号線
    RECT(150, 126, 560, 9, 1, SIG, SIG, 0),
    ARR(180, 118, 690, 118, SIG, 1.6),
    T(240, 112, "信号", "middle", 9.5, SIG, True),
    # 迂回するリターン
    PL([(690, 150), (452, 150), (452, 198), (388, 198), (388, 150), (180, 150)], ALI, 2.4),
    ARR(560, 150, 470, 150, ALI, 1.5),
    ARR(452, 172, 452, 194, ALI, 1.5),
    ARR(430, 198, 396, 198, ALI, 1.5),
    ARR(388, 176, 388, 154, ALI, 1.5),
    ARR(300, 150, 200, 150, ALI, 1.5),
    T(430, 236, "リターンはスリットの端まで迂回してから戻る", "middle", 10, ALI, True),
    RECT(60, 270, 740, 54, 8, ASOFT, ALI, 1.4),
    T(430, 292, "ループ面積が 100 倍のオーダーに膨れる", "middle", 11.5, INK, True),
    T(430, 314, "→ 波形が鈍る／放射が増える／クロストークが増える／両側に電位差が出てケーブルに乗る", "middle", 10, MUT),
], "幅 20 mm のスリットを横切ると、50 Ω の線路に数十 Ω が直列に割り込む計算になる")

F["p08_zone"] = SVG(860, 320, [
    T(430, 26, "正しい分離 — 銅を切らず、配置で分ける", "middle", 12.5, INK, True),
    # 悪い（分割）
    RECT(40, 52, 370, 186, 10, ASOFT, ALI, 1.4),
    T(225, 76, "×  グラウンドを分割する", "middle", 11, ALI, True),
    RECT(70, 96, 150, 110, 0, PAN, LIN, 1.2),
    RECT(232, 96, 150, 110, 0, PAN, LIN, 1.2),
    RECT(220, 96, 12, 110, 0, SCR, ALI, 1.4),
    RECT(90, 118, 100, 9, 1, SIG, SIG, 0),
    RECT(190, 118, 170, 9, 1, SIG, SIG, 0),
    T(226, 108, "!", "middle", 12, ALI, True),
    T(225, 224, "信号がスリットを横切ると破綻する", "middle", 9.5, ALI, True),
    # 良い（配置で分離）
    RECT(450, 52, 370, 186, 10, SCR, GRN, 1.4),
    T(635, 76, "○  1 枚のまま、配置で分ける", "middle", 11, GRN, True),
    RECT(480, 96, 310, 110, 0, PAN, LIN, 1.2),
    W(635, 96, 635, 206, c=MUT, lw=1.2, dash="4 4"),
    T(555, 112, "アナログ領域", "middle", 9, GRN, True),
    T(715, 112, "デジタル領域", "middle", 9, SIG, True),
    RECT(500, 140, 100, 9, 1, GRN, GRN, 0),
    RECT(670, 140, 100, 9, 1, SIG, SIG, 0),
    ARR(590, 168, 510, 168, GRN, 1.3), ARR(680, 168, 760, 168, SIG, 1.3),
    T(635, 224, "各リターンが自分の領域の真下を流れる", "middle", 9.5, GRN, True),
    RECT(40, 256, 780, 52, 8, SSOFT, SIG, 1.4),
    T(430, 278, "電流は自分が来た道の真下を帰る —— これが分離の実体である", "middle", 11.5, INK, True),
    T(430, 298, "銅を切る必要はどこにもない", "middle", 10.5, SIG, True),
], "「アナログとデジタルの GND を分ける」という作法は、リターンが面全体に広がっていた時代の話である")

F["p08_hole"] = SVG(860, 300, [
    T(430, 26, "分割しなくても、面に穴が空くことがある", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 156, 10, ASOFT, ALI, 1.3),
    T(155 + i * 278, 76, name, "middle", 10.5, ALI, True),
    RECT(50 + i * 278, 96, 210, 76, 0, PAN, LIN, 1.1),
] + holes + [
    T(155 + i * 278, 192, fix, "middle", 9.5, MUT),
] for i, (name, holes, fix) in enumerate([
    ("ビアの列が面を横断", [CIRC(64 + j * 22, 134, 7, SCR, 1.2, SCR) for j in range(10)],
     "ビアの配置をずらす"),
    ("コネクタの穴が並ぶ", [CIRC(342 + j * 21, 134, 8, SCR, 1.2, SCR) for j in range(10)],
     "クリアランスを最小に、面を回り込ませる"),
    ("面の層に配線を通した", [RECT(606, 118, 210, 8, 0, SCR, SCR, 0), RECT(606, 146, 210, 8, 0, SCR, SCR, 0)],
     "その配線を別の層に移す"),
])], []) + [
    RECT(24, 224, 812, 62, 8, SSOFT, SIG, 1.4),
    T(430, 246, "層を移る高速信号のそばには、必ずリターン用のビアを置く", "middle", 11.5, INK, True),
    T(430, 268, "信号ビアから 1〜2 mm 以内に GND ビアを 1 本。忘れると、そこが放射源になる（12・19 章）", "middle", 10, MUT),
], "基準面が GND と電源で変わる場合は、その 2 面をつなぐコンデンサが必要になる")

# ===================== 09. 配線の基本 =====================

F["p09_three"] = SVG(860, 290, [
    T(430, 26, "線幅は 3 つの条件のうち、最も厳しいもので決まる", "middle", 12.5, INK, True),
] + sum([[
    BOX(24 + i * 278, 54, 262, 92, name, sub, c, fill, INK, 8, 1.4, 11.5, 9.5),
    T(155 + i * 278, 170, where, "middle", 10, MUT),
] for i, (name, sub, where, c, fill) in enumerate([
    ("① 温度上昇（電流容量）", "発熱と放熱の釣り合い", "電源・モータ・大電流", ALI, ASOFT),
    ("② 電圧降下", "V = IR。許容できるずれ", "低電圧・大電流・センサ基準", SIG, SSOFT),
    ("③ 特性インピーダンス", "基準面との距離と εr（10 章）", "高速信号", GRN, PAN),
])], []) + [
    RECT(24, 190, 812, 30, 6, PAN, LIN, 1.2),
    T(430, 210, "＋ 製造の下限（03・04 章）が全体の底になる", "middle", 10.5, MUT, True),
    RECT(24, 234, 812, 44, 8, ASOFT, ALI, 1.4),
    T(430, 254, "低電圧の電源では、①より②のほうが先に効くことが多い", "middle", 11.5, INK, True),
    T(430, 272, "1.0 V 電源で 50 mV 落ちれば、それだけで 5 % の誤差である", "middle", 10, MUT),
], "多くの設計者が①だけを見て決めてしまう。②を確認する習慣をつけたい")

F["p09_current"] = SVG(860, 320, [
    T(430, 26, "電流容量 — 許容温度上昇を決めないと答えが出ない", "middle", 12.5, INK, True),
    BOX(190, 50, 480, 52, "I = k · ΔT^0.44 · A^0.725", "外層 k = 0.048、内層 k = 0.024（A は mil²）",
        SIG, SSOFT, INK, 8, 1.6, 14, 9.5, None, True),
    T(160, 128, "電流", "middle", 10.5, MUT, True),
    T(420, 128, "外層 1 oz（ΔT = 10 ℃）", "middle", 10.5, MUT, True),
    T(690, 128, "内層 1 oz", "middle", 10.5, MUT, True),
    W(40, 138, 820, 138, c=LIN, lw=1),
] + sum([[
    T(160, 162 + i * 26, cur, "middle", 10.5, INK, True),
    RECT(300, 150 + i * 26, 240 * ow / 5.2, 18, 3, SSOFT, SIG, 1.1),
    T(552, 164 + i * 26, "%.2f mm" % ow, "start", 10, SIG, True),
    RECT(640, 150 + i * 26, 130 * min(iw, 6.3) / 6.3, 18, 3, ASOFT, ALI, 1.1),
    T(782, 164 + i * 26, ("%.1f mm" % iw) if iw < 6 else "ベタで配る", "start", 10, ALI, True),
] for i, (cur, ow, iw) in enumerate([
    ("0.5 A", 0.25, 0.6), ("1 A", 0.6, 1.5), ("2 A", 1.5, 3.7),
    ("3 A", 2.6, 6.3), ("5 A", 5.2, 12.0),
])], []) + [
    RECT(40, 284, 780, 32, 8, SSOFT, SIG, 1.3),
    T(430, 304, "内層は放熱しにくいので係数が半分 —— 同じ電流に約 2 倍の幅が要る", "middle", 11, INK, True),
], "IPC-2221 は保守的。隣にベタ面があれば実際は 1.5〜2 倍流せる（IPC-2152）")

F["p09_drop"] = SVG(860, 300, [
    T(430, 26, "電圧降下 — 低電圧では電流容量より先に効く", "middle", 12.5, INK, True),
    T(430, 52, "シート抵抗: 1 oz なら約 0.5 mΩ/□。R = 0.5 mΩ × (長さ / 幅)", "middle", 10.5, SIG, True),
    RECT(60, 72, 740, 132, 10, SCR, LIN, 1.3),
    T(430, 96, "例: 1.0 V コア電源、3 A、幅 1 mm・長さ 30 mm・1 oz", "middle", 11, INK, True),
    T(200, 128, "正方形の数", "middle", 10, MUT), T(200, 148, "30 / 1 = 30 個", "middle", 11, INK, True),
    T(430, 128, "抵抗", "middle", 10, MUT), T(430, 148, "0.5 mΩ × 30 = 15 mΩ", "middle", 11, INK, True),
    T(670, 128, "電圧降下", "middle", 10, MUT), T(670, 148, "3 A × 15 mΩ = 45 mV", "middle", 11, ALI, True),
    T(430, 182, "1.0 V に対して 4.5 % —— 許容 ±5 % の大半を配線だけで使い切る", "middle", 10.5, ALI, True),
    RECT(60, 220, 740, 66, 8, ASOFT, ALI, 1.4),
    T(430, 242, "行きだけでなく、帰りの GND でも同じだけ落ちる", "middle", 11.5, INK, True),
    T(430, 262, "そして GND 側の降下は「基準電位そのものがずれる」ことを意味する", "middle", 10, MUT),
    T(430, 280, "ADC の基準がずれれば、測定値が丸ごとずれる（17 章）", "middle", 10, ALI),
], "対策は太くする／ベタで配る／短くする（＝配置で解決する）／リモートセンスを使う")

F["p09_angle"] = SVG(860, 290, [
    T(430, 26, "配線の角度 — なぜ 45° に分けるのか", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 148, 10, fill, c, 1.3),
    T(155 + i * 278, 76, name, "middle", 11, c, True),
    path,
    T(155 + i * 278, 176, note, "middle", 9.5, MUT),
] for i, (name, path, note, c, fill) in enumerate([
    ("90°（直角）",
     PL([(70, 100), (180, 100), (180, 160)], SIG, 6),
     "角にエッチング液が滞留しやすい", ALI, ASOFT),
    ("45° を 2 回",
     PL([(348, 100), (430, 100), (458, 128), (458, 160)], SIG, 6),
     "実質的な問題がない。CAD の既定", GRN, PAN),
    ("円弧",
     '<path d="M 626 100 L 700 100 A 34 34 0 0 1 734 134 L 734 160" fill="none" stroke="%s" stroke-width="6"/>' % SIG,
     "最も滑らか。高周波で使う", SIG, SSOFT),
])], []) + [
    RECT(24, 214, 812, 62, 8, SSOFT, SIG, 1.4),
    T(430, 236, "「直角は高周波でアンテナになる」はよく言われるが誇張である", "middle", 11.5, INK, True),
    T(430, 256, "実際の差は数 GHz でようやく測れる程度。本当の理由は製造とインピーダンスの一様性である", "middle", 10, MUT),
    T(430, 272, "45° にしておけば損はないので、慣習として定着している", "middle", 10, MUT),
], "他の作法: 幅を急に変えない、スタブを作らない、隣接層は配線方向を直交させる")

# ===================== 10. インピーダンス制御 =====================

F["p10_why"] = SVG(860, 310, [
    T(430, 26, "インピーダンスが変わるところで、信号は反射する", "middle", 12.5, INK, True),
    BOX(280, 48, 300, 46, "Γ = (Z_L − Z₀) / (Z_L + Z₀)", None, SIG, SSOFT, INK, 8, 1.6, 14, 10, None, True),
    # 整合
    RECT(40, 110, 370, 128, 10, SCR, GRN, 1.3),
    T(225, 134, "Z_L = Z₀ → Γ = 0", "middle", 11, GRN, True),
    RECT(70, 158, 300, 9, 1, SIG, SIG, 0),
    ARR(100, 152, 340, 152, GRN, 1.6),
    PL([(70, 200), (110, 200), (118, 186), (300, 186), (300, 200), (370, 200)], GRN, 2),
    T(225, 222, "きれいな段。反射なし", "middle", 9.5, GRN),
    # 不整合
    RECT(450, 110, 370, 128, 10, ASOFT, ALI, 1.3),
    T(635, 134, "Z_L ≠ Z₀ → 反射する", "middle", 11, ALI, True),
    RECT(480, 158, 300, 9, 1, SIG, SIG, 0),
    ARR(510, 152, 700, 152, ALI, 1.6), ARR(700, 172, 560, 172, ALI, 1.4),
    PL([(480, 200), (520, 200), (528, 182), (556, 182), (560, 196), (600, 196), (604, 184),
        (650, 184), (654, 192), (700, 192), (704, 187), (780, 187)], ALI, 2),
    T(635, 222, "リンギング（振動）が残る", "middle", 9.5, ALI),
    RECT(40, 254, 780, 46, 8, SSOFT, SIG, 1.4),
    T(430, 274, "判定はクロック周波数ではなく立ち上がり時間で行う: t_d > t_r / 6", "middle", 11.5, INK, True),
    T(430, 292, "外層で約 6 ps/mm。t_r = 200 ps なら 5.5 mm 以上の配線で制御が要る", "middle", 10, MUT),
], "反射した波は戻ってまた反射する。しきい値を何度も横切って誤動作したり、放射が増えたりする")

F["p10_struct"] = SVG(860, 320, [
    T(430, 26, "2 つの基本構造", "middle", 12.5, INK, True),
    # マイクロストリップ
    RECT(40, 52, 370, 196, 10, SCR, SIG, 1.4),
    T(225, 76, "マイクロストリップ（外層）", "middle", 11.5, SIG, True),
    T(225, 96, "電界の一部が空気を通る", "middle", 9.5, MUT),
    RECT(80, 150, 290, 46, 0, PAN, LIN, 1.2),
    TRAPZ(225, 138, 56, 66, 12, SIG, SIG, 0),
    COPPER(80, 196, 290, 10, MUT),
    T(225, 130, "w", "middle", 9.5, INK, True),
    DIM(400, 150, 400, 196, None, MUT), T(392, 176, "h", "end", 9.5, INK, True),
    T(225, 224, "ε_eff ≈ 3.0〜3.3 → 遅延 約 6 ps/mm", "middle", 10, SIG, True),
    T(225, 240, "速い・放射する・環境の影響を受ける", "middle", 9, MUT),
    # ストリップライン
    RECT(450, 52, 370, 196, 10, SCR, GRN, 1.4),
    T(635, 76, "ストリップライン（内層）", "middle", 11.5, GRN, True),
    T(635, 96, "上下とも誘電体で均一", "middle", 9.5, MUT),
    COPPER(490, 128, 290, 10, MUT),
    RECT(490, 138, 290, 68, 0, PAN, LIN, 1.2),
    RECT(607, 166, 56, 12, 0, SIG, SIG, 0),
    COPPER(490, 206, 290, 10, MUT),
    DIM(810, 138, 810, 206, None, MUT), T(802, 176, "b", "end", 9.5, INK, True),
    T(635, 224, "ε_eff ≈ 4.3 → 遅延 約 7 ps/mm", "middle", 10, GRN, True),
    T(635, 240, "遅い・放射しない・外乱に強い", "middle", 9, MUT),
    RECT(40, 266, 780, 42, 8, ASOFT, ALI, 1.4),
    T(430, 292, "同じ 50 mm でも、外層か内層かで遅延が 50 ps 違う → 等長は「電気長」で揃える（11 章）", "middle", 11, INK, True),
], "ε_eff が違うのは、マイクロストリップでは電界の一部が空気（εr = 1）を通るからである")

F["p10_formula"] = SVG(860, 290, [
    T(430, 26, "計算式と、その形が語っていること", "middle", 12.5, INK, True),
    BOX(30, 50, 390, 68, "Z₀ ≈ (87/√(εr+1.41)) · ln(5.98h / (0.8w+t))",
        "マイクロストリップ（0.1 < w/h < 3.0）", SIG, SSOFT, INK, 8, 1.5, 12, 9, None, True),
    BOX(440, 50, 390, 68, "Z₀ ≈ (60/√εr) · ln(1.9b / (0.8w+t))",
        "ストリップライン（対称）", GRN, PAN, INK, 8, 1.5, 12, 9, None, True),
    RECT(30, 134, 800, 144, 10, SCR, LIN, 1.3),
    T(430, 158, "どちらも ln(距離 / 線幅) の形をしている", "middle", 11.5, INK, True),
] + [
    T(240, 190 + i * 24, a, "start", 10.5, c, True) for i, (a, c) in enumerate([
        ("基準面を遠くする（h ↑）　→　Z₀ が上がる", SIG),
        ("線を太くする（w ↑）　　　→　Z₀ が下がる", SIG),
        ("εr が大きい　　　　　　　→　Z₀ が下がる", GRN),
    ])
] + [
    T(430, 264, "対数なので効きは鈍い。h/w を 2 倍にしても Z₀ は約 12 Ω しか動かない", "middle", 10, MUT),
], "多少のばらつきでは大きく外れない —— これが ±10 % 管理が実用になっている理由である")

F["p10_table"] = SVG(860, 290, [
    T(430, 26, "50 Ω マイクロストリップの現実的な寸法（FR-4・1 oz）", "middle", 12.5, INK, True),
    T(200, 62, "誘電体厚 h", "middle", 10.5, MUT, True),
    T(430, 62, "必要な線幅 w", "middle", 10.5, MUT, True),
    T(680, 62, "評価", "middle", 10.5, MUT, True),
    W(40, 72, 820, 72, c=LIN, lw=1),
] + sum([[
    RECT(40, 82 + i * 42, 780, 36, 6, fill, c, 1.2),
    T(200, 106 + i * 42, h, "middle", 11, INK, True),
    T(430, 106 + i * 42, w, "middle", 11.5, c, True),
    T(680, 106 + i * 42, note, "middle", 10, MUT),
] for i, (h, w, note, c, fill) in enumerate([
    ("0.1 mm", "約 0.18 mm", "4 層の L1–L2 標準。現実的", GRN, PAN),
    ("0.2 mm", "約 0.36 mm", "やや太いが使える", SIG, SSOFT),
    ("0.5 mm", "約 0.9 mm", "太すぎて配線が入らない", ALI, ASOFT),
    ("1.5 mm（2 層基板）", "約 2.8 mm", "非現実的", ALI, ASOFT),
])], []) + [
    RECT(40, 254, 780, 30, 8, SSOFT, SIG, 1.3),
    T(430, 274, "「50 Ω を 0.15〜0.2 mm で作りたい」→「誘電体厚は 0.1 mm 前後」（05 章の根拠）", "middle", 11, INK, True),
], "2 層基板でインピーダンス制御をしない、という判断はこの表から出てくる")

F["p10_tolerance"] = SVG(860, 300, [
    T(430, 26, "ばらつき — 実物はどれだけ動くか", "middle", 12.5, INK, True),
] + sum([[
    T(250, 70 + i * 30, name, "end", 10.5, MUT),
    RECT(266, 58 + i * 30, 300 * eff / 5.0, 20, 3, fill, c, 1.1),
    T(580, 73 + i * 30, "±%.0f %%" % eff, "start", 10.5, c, True),
    T(660, 73 + i * 30, cause, "start", 9.5, FNT),
] for i, (name, eff, cause, c, fill) in enumerate([
    ("誘電体厚 h（±10 %）", 5.0, "銅残り率で変わる（02 章）", ALI, ASOFT),
    ("線幅 w（±20 %）", 4.0, "エッチング（03 章）", SIG, SSOFT),
    ("εr（±5 %）", 2.5, "ロット・周波数・織り目", SIG, SSOFT),
    ("銅厚 t（±10〜20 %）", 1.5, "めっき", MUT, PAN),
])], []) + [
    W(40, 190, 820, 190, c=LIN, lw=1),
    T(250, 212, "RSS で合成", "end", 10.5, INK, True),
    RECT(266, 200, 300 * 7.5 / 5.0 * 0.5, 20, 3, SSOFT, SIG, 1.4),
    T(580, 215, "±7〜8 %", "start", 11, SIG, True),
    T(680, 215, "→ 公差 ±10 % が標準", "start", 9.5, MUT),
    RECT(40, 236, 780, 54, 8, ASOFT, ALI, 1.4),
    T(430, 258, "設計が壊せるものは、これより桁で大きい", "middle", 11.5, INK, True),
    T(430, 280, "基準面にスリットがあれば、その区間だけ Z₀ が 2 倍以上に跳ね上がる。まずそこを確認する", "middle", 10, MUT),
], "上の 4 つはメーカ側のばらつきで、設計でどうにかなるものではない")

F["p10_flow"] = SVG(860, 318, [
    T(430, 26, "実務の手順", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("① 制御が必要なネットを決める（t_d > t_r/6）。全部ではない", None, LIN, PAN),
        ("② 層構成を決める。メーカの標準構成から選ぶ（05 章）", None, SIG, SSOFT),
        ("③ メーカが公開している推奨線幅を見る ← 最も確実", None, GRN, PAN),
        ("④ CAD にネットクラスとして線幅を設定し、DRC で守らせる", None, LIN, PAN),
        ("⑤ 発注時に「インピーダンス制御」を指定 → メーカが線幅を最終決定", None, SIG, SSOFT),
        ("⑥ 受け入れ時にクーポンの実測値を確認する", None, GRN, PAN),
    ], 640, 34, 5)[0],
    T(430, 306, "自分で計算した線幅に固執しない。メーカは実際の材料厚と銅厚で計算し直す", "middle", 10.5, ALI, True),
], "線幅が変わると配線が入らなくなることがあるので、設計初期にメーカへ確認して引き始めるのが速い")

F["p10_term"] = SVG(860, 300, [
    T(430, 26, "終端 — 線路の端で反射を消す", "middle", 12.5, INK, True),
    T(160, 60, "方式", "middle", 10.5, MUT, True),
    T(360, 60, "置き場所", "middle", 10.5, MUT, True),
    T(640, 60, "特徴", "middle", 10.5, MUT, True),
    W(30, 70, 830, 70, c=LIN, lw=1),
] + sum([[
    RECT(30, 80 + i * 40, 800, 34, 6, fill, c, 1.2),
    T(160, 102 + i * 40, name, "middle", 10.5, INK, True),
    T(360, 102 + i * 40, place, "middle", 10, c, True),
    T(640, 102 + i * 40, note, "middle", 9.5, MUT),
] for i, (name, place, note, c, fill) in enumerate([
    ("直列終端（ソース終端）", "送信側のすぐ隣", "R = Z₀ − 出力インピーダンス。追加電流ゼロ。1 対 1 向き", SIG, SSOFT),
    ("並列終端", "受信側", "Z₀ を GND か電源へ。常時電流が流れる", MUT, PAN),
    ("テブナン終端", "受信側", "2 本の抵抗で電源と GND へ。バイアスも兼ねる", MUT, PAN),
    ("AC 終端", "受信側", "抵抗＋コンデンサ。直流電流を流さない", GRN, PAN),
])], []) + [
    RECT(30, 244, 800, 46, 8, ASOFT, ALI, 1.4),
    T(430, 266, "直列終端の抵抗は、必ず送信 IC のピンのすぐ隣に置く", "middle", 11.5, INK, True),
    T(430, 284, "目安は 5 mm 以内。間の配線が長いと、そこが未終端の線路になって意味がなくなる", "middle", 10, MUT),
], "これは配線ではなく配置の仕事である（07 章）")

# ===================== 11. 差動ペア =====================

F["p11_diff"] = SVG(860, 300, [
    T(430, 26, "差動信号 — 2 本の差で伝える", "middle", 12.5, INK, True),
    RECT(40, 50, 370, 168, 10, SCR, LIN, 1.3),
    T(225, 74, "シングルエンド", "middle", 11, MUT, True),
    RECT(80, 104, 290, 9, 1, SIG, SIG, 0),
    COPPER(80, 168, 290, 9, MUT),
    T(60, 112, "S", "end", 9.5, SIG, True), T(60, 176, "GND", "end", 9.5, MUT, True),
    ARR(120, 140, 330, 140, ALI, 1.4, 6),
    T(225, 132, "ノイズ", "middle", 9, ALI, True),
    T(225, 200, "GND 基準の電圧 → ノイズがそのまま乗る", "middle", 9.5, ALI),
    RECT(450, 50, 370, 168, 10, SSOFT, SIG, 1.4),
    T(635, 74, "差動", "middle", 11, SIG, True),
    RECT(490, 118, 290, 9, 1, SIG, SIG, 0),
    RECT(490, 146, 290, 9, 1, GRN, GRN, 0),
    T(470, 126, "+", "end", 11, SIG, True), T(470, 154, "−", "end", 11, GRN, True),
    ARR(530, 96, 740, 96, ALI, 1.4, 6),
    T(635, 88, "ノイズは 2 本に同じだけ乗る", "middle", 9, ALI),
    T(635, 184, "V = V₊ − V₋ → 同相のノイズは差で消える", "middle", 10, SIG, True),
    T(635, 202, "電流が逆向き → 遠くでは磁界が打ち消し合う", "middle", 9.5, MUT),
    RECT(40, 234, 780, 52, 8, SSOFT, SIG, 1.4),
    T(430, 256, "差動モード（DM）が信号、同相モード（CM）がノイズである", "middle", 11.5, INK, True),
    T(430, 276, "V_DM = V₊ − V₋、V_CM = (V₊ + V₋)/2。設計とは「DM を伝え、CM を生ませない」寸法決めである", "middle", 10, MUT),
], "GND の電位がずれても 2 本の差は保たれる。これが基準がいらないという意味である")

F["p11_modes"] = SVG(860, 290, [
    T(430, 26, "差動インピーダンスは、1 本の 2 倍ではない", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 158, 10, SCR, LIN, 1.3),
    T(225, 76, "2 本が近づくと結合する", "middle", 11, INK, True),
    RECT(130, 110, 80, 12, 0, SIG, SIG, 0),
    RECT(240, 110, 80, 12, 0, SIG, SIG, 0),
    COPPER(110, 172, 230, 9, MUT),
] + [
    '<path d="M %g 122 Q %g 146 %g 122" fill="none" stroke="%s" stroke-width="1.2" stroke-dasharray="3 3"/>'
    % (210, 225, 240, ALI)
] + [
    W(170, 122, 170, 172, c=LIN, lw=1, dash="3 3"), W(280, 122, 280, 172, c=LIN, lw=1, dash="3 3"),
    T(225, 196, "互いの結合が Z を変える", "middle", 9.5, ALI, True),
    RECT(450, 52, 370, 158, 10, SSOFT, SIG, 1.4),
] + [
    T(478, 84 + i * 30, sym, "start", 11, c, True) for i, (sym, c) in enumerate([
        ("Z₀", MUT), ("Z_odd", SIG), ("Z_even", MUT), ("Z_diff = 2 · Z_odd", SIG)])
] + [
    T(790, 84 + i * 30, mean, "end", 9.5, MUT) for i, mean in enumerate([
        "相手がいないときの 1 本の値",
        "差動駆動時の 1 本あたり",
        "同相駆動時の 1 本あたり",
        "2 本まとめて見た値",
    ])
] + [
    T(635, 194, "結合があるので Z_odd < Z₀ < Z_even", "middle", 10, SIG, True),
    RECT(40, 226, 780, 52, 8, ASOFT, ALI, 1.4),
    T(430, 248, "1 本を 50 Ω にしてから近づけてはいけない", "middle", 11.5, INK, True),
    T(430, 268, "近づけた時点で Z_odd が下がり、Z_diff は 100 Ω を割る。間隔を決めてから線幅を求める", "middle", 10, MUT),
], "100 Ω 差動の典型値: FR-4・h=0.1 mm・外層で 線幅 0.13 mm / 間隔 0.13 mm 程度")

F["p11_spacing"] = SVG(860, 310, [
    T(430, 26, "間隔の 2 つの流儀", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 196, 10, SSOFT, SIG, 1.4),
    T(225, 76, "タイトカップリング（s ≈ w）", "middle", 11.5, SIG, True),
    RECT(170, 100, 50, 12, 0, SIG, SIG, 0), RECT(232, 100, 50, 12, 0, SIG, SIG, 0),
    COPPER(140, 148, 172, 9, MUT),
    DIM(220, 128, 232, 128, None, ALI), T(226, 144, "s", "middle", 9, ALI, True),
] + [
    T(70, 178 + i * 20, t, "start", 9.5, c) for i, (t, c) in enumerate([
        ("◎ 放射が小さい（19 章）", GRN), ("◎ 外来ノイズに強い", GRN),
        ("× 間隔のばらつきが Z に直接効く", ALI), ("× 線が細く、損失が増える", ALI)])
] + [
    RECT(450, 52, 370, 196, 10, SCR, LIN, 1.3),
    T(635, 76, "ルースカップリング（s > 3w）", "middle", 11.5, MUT, True),
    RECT(540, 100, 50, 12, 0, SIG, SIG, 0), RECT(680, 100, 50, 12, 0, SIG, SIG, 0),
    COPPER(510, 148, 250, 9, MUT),
    DIM(590, 128, 680, 128, None, ALI), T(635, 144, "s", "middle", 9, ALI, True),
] + [
    T(480, 178 + i * 20, t, "start", 9.5, c) for i, (t, c) in enumerate([
        ("◎ インピーダンスが安定", GRN), ("◎ 線を太くでき、損失が減る", GRN),
        ("× 放射が増える", ALI), ("× 配線幅を取る", ALI)])
] + [
    RECT(40, 262, 780, 40, 8, SSOFT, SIG, 1.4),
    T(430, 286, "他の配線とは、ペア間隔の 4〜5 倍以上空ける —— 片方だけの結合は差動信号になってしまう", "middle", 11, INK, True),
], "どちらにせよ、ペアの間隔は途中で変えない。変えるとそこで反射する")

F["p11_skew"] = SVG(860, 320, [
    T(430, 26, "スキュー — 差動の最大の利点を壊すもの", "middle", 12.5, INK, True),
    RECT(40, 52, 780, 174, 10, SCR, LIN, 1.3),
    T(150, 78, "V₊", "middle", 10.5, SIG, True),
    PL([(190, 96), (300, 96), (320, 72), (760, 72)], SIG, 2.2),
    T(150, 128, "V₋", "middle", 10.5, GRN, True),
    PL([(190, 122), (360, 122), (380, 146), (760, 146)], GRN, 2.2),
    W(320, 62, 320, 160, c=ALI, lw=1.2, dash="4 3"),
    W(380, 62, 380, 160, c=ALI, lw=1.2, dash="4 3"),
    DIM(320, 166, 380, 166, "Δt", ALI, 9.5, 0, ALI),
    T(150, 196, "V₊ + V₋", "middle", 10.5, ALI, True),
    PL([(190, 200), (300, 200), (320, 178), (380, 178), (400, 200), (760, 200)], ALI, 2.2),
    T(560, 190, "ずれている間だけ、同相成分が立つ", "start", 9.5, ALI, True),
    RECT(40, 240, 380, 66, 8, ASOFT, ALI, 1.4),
    T(230, 262, "① アイの縮小", "middle", 10.5, INK, True),
    T(230, 282, "差の波形が鈍り、判定の余裕が減る", "middle", 9.5, MUT),
    RECT(440, 240, 380, 66, 8, ASOFT, ALI, 1.4),
    T(630, 262, "② 同相成分の発生 ← 本質的な害", "middle", 10.5, INK, True),
    T(630, 282, "CM ノイズ源になり、ケーブルから放射する（19 章）", "middle", 9.5, ALI),
], "許容は規格の指定か、なければ t_r/10。FR-4 で約 6.5 ps/mm なので長さに換算して判断する")

F["p11_serp"] = SVG(860, 300, [
    T(430, 26, "サーペンタイン（蛇行配線）の作法", "middle", 12.5, INK, True),
    # 悪い
    RECT(40, 52, 370, 158, 10, ASOFT, ALI, 1.3),
    T(225, 76, "蛇行の間隔が狭い", "middle", 11, ALI, True),
    PL([(70, 140), (110, 140), (110, 112), (128, 112), (128, 140), (146, 140), (146, 112),
        (164, 112), (164, 140), (182, 140), (182, 112), (200, 112), (200, 140), (370, 140)], SIG, 2.4),
    T(225, 180, "自分自身と結合して、狙った長さにならない", "middle", 9.5, ALI, True),
    # 良い
    RECT(450, 52, 370, 158, 10, SCR, GRN, 1.3),
    T(635, 76, "間隔 ≥ 線幅の 3 倍", "middle", 11, GRN, True),
    PL([(480, 140), (530, 140), (530, 108), (566, 108), (566, 140), (602, 140), (602, 108),
        (638, 108), (638, 140), (674, 140), (674, 108), (710, 108), (710, 140), (780, 140)], SIG, 2.4),
    DIM(530, 156, 566, 156, "≥ 3w", GRN, 9),
    T(635, 180, "結合せず、長さがそのまま遅延になる", "middle", 9.5, GRN, True),
    RECT(40, 226, 780, 62, 8, SSOFT, SIG, 1.4),
    T(430, 248, "補正は「ずれが生じた場所のすぐ近く」で行う", "middle", 11.5, INK, True),
    T(430, 270, "受信側の手前でまとめて補正すると、その間の区間ぜんぶが同相ノイズの発生源になる", "middle", 10, MUT),
], "蛇行の形は 45° か円弧。振幅は小さく、回数を多くして局所的な不連続を抑える")

F["p11_glass"] = SVG(860, 300, [
    T(430, 26, "ガラス織り効果 — 揃えたのに合わない", "middle", 12.5, INK, True),
    RECT(60, 52, 740, 154, 10, SCR, LIN, 1.3),
] + [
    RECT(90 + i * 58, 76, 34, 108, 0, PAN, LIN, 0.8) for i in range(12)
] + [
    T(430, 68, "ガラス繊維の束（εr ≈ 6）と、樹脂だけの領域（εr ≈ 3）が交互に並ぶ", "middle", 9.5, MUT),
    RECT(90, 106, 700, 10, 0, SIG, SIG, 0),
    RECT(90, 148, 700, 10, 0, GRN, GRN, 0),
    T(76, 116, "+", "end", 11, SIG, True), T(76, 158, "−", "end", 11, GRN, True),
    T(430, 196, "物理長は完全に同じでも、通る場所が違えば遅延が違う", "middle", 10.5, ALI, True),
] + sum([[
    RECT(24 + i * 278, 220, 262, 68, 8, fill, c, 1.3),
    T(155 + i * 278, 242, name, "middle", 10.5, c, True),
    T(155 + i * 278, 262, how, "middle", 9, MUT),
    T(155 + i * 278, 280, cost, "middle", 9, FNT),
] for i, (name, how, cost, c, fill) in enumerate([
    ("配線を斜めに引く", "織り目に対して 10〜20° 傾ける", "設計工数のみ。最も現実的", GRN, PAN),
    ("基板を斜めに面付け", "パネル上で数度回転させる", "面付け効率が落ちる（23 章）", SIG, SSOFT),
    ("均一な材料を使う", "スプレッドガラス・不織布系", "材料費が上がる", LIN, PAN),
])], []),
  "10 Gbps 未満では通常は問題にならない。「高速なら常に気にする」ものではない")

# ===================== 12. ビア =====================

F["p12_types"] = SVG(860, 320, [
    T(430, 26, "ビアの種類 — どの層からどの層まで貫くか", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 208, 52, 196, 176, 10, fill, c, 1.3),
    T(122 + i * 208, 76, name, "middle", 10.5, c, True),
    # 断面（4 層）
    RECT(50 + i * 208, 96, 144, 96, 0, PAN, LIN, 1.1),
] + [
    COPPER(50 + i * 208, 96 + j * 32, 144, 5, MUT) for j in range(4)
] + [
    RECT(112 + i * 208 - 3, 96 + y0 * 32, 6, (y1 - y0) * 32 + 5, 0, SIG, SIG, 0),
    RECT(126 + i * 208 - 3, 96 + y0 * 32, 6, (y1 - y0) * 32 + 5, 0, SIG, SIG, 0),
    T(122 + i * 208, 208, mech, "middle", 9, MUT),
    T(122 + i * 208, 224, cost, "middle", 9.5, cc, True),
] for i, (name, y0, y1, mech, cost, c, fill, cc) in enumerate([
    ("スルーホール（貫通）", 0, 3, "機械ドリル・1 回", "最も安い。既定", GRN, PAN, GRN),
    ("ブラインド", 0, 2, "レーザ or 段階積層", "高い", SIG, SSOFT, ALI),
    ("ベリード", 1, 2, "積層前に加工して埋める", "高い", SIG, SSOFT, ALI),
    ("マイクロビア", 0, 1, "レーザ・1 層ぶんだけ", "HDI 専用（23 章）", ALI, ASOFT, ALI),
])], []) + [
    RECT(24, 244, 812, 62, 8, SSOFT, SIG, 1.4),
    T(430, 266, "原則: 貫通ビアで済ませる", "middle", 11.5, INK, True),
    T(430, 288, "ブラインド／ベリードは価格 1.5〜3 倍・納期も伸びる。多くの場合、層を増やすか配置を見直すほうが安い", "middle", 10, MUT),
], "断面図の横線が銅箔層、縦の 2 本が内壁のめっき（ビアの筒）を表す")

F["p12_dims"] = SVG(860, 300, [
    T(430, 26, "ビアの寸法の呼び方", "middle", 12.5, INK, True),
    # 上から見た図
    RECT(40, 52, 300, 178, 10, SCR, LIN, 1.3),
    CIRC(190, 138, 70, MUT, 1.2, "none", "5 4"),
    CIRC(190, 138, 46, SIG, 2, SSOFT),
    CIRC(190, 138, 22, LIN, 1.4, SCR),
    T(190, 142, "穴", "middle", 9, MUT),
    T(190, 226, "上から見た図", "middle", 9, FNT),
    T(276, 106, "アンチパッド", "start", 9, MUT),
    W(240, 112, 272, 108, c=MUT, lw=1),
    RECT(370, 52, 460, 178, 10, SCR, LIN, 1.3),
] + sum([[
    T(400, 82 + i * 30, name, "start", 10.5, c, True),
    T(800, 82 + i * 30, mean, "end", 9.5, MUT),
] for i, (name, mean, c) in enumerate([
    ("ドリル径", "あける穴の直径", MUT),
    ("仕上がり径", "めっき後（ドリル径 − 0.05〜0.1 mm）", MUT),
    ("ランド径（パッド径）", "表面の銅の円の直径", SIG),
    ("アニュラリング", "(ランド径 − 穴径) / 2（03・04 章）", SIG),
    ("アンチパッド", "基準面側に開ける逃げ穴", ALI),
])], []) + [
    T(600, 216, "アスペクト比 = 板厚 / ドリル径 ≤ 8:1", "middle", 11, ALI, True),
    RECT(40, 248, 790, 40, 8, SSOFT, SIG, 1.3),
    T(430, 272, "標準は φ0.3 mm / ランド 0.6 mm。板厚 1.6 mm なら φ0.2 mm が下限（8:1）", "middle", 11, INK, True),
], "電流を流すビアは φ0.4〜0.6 mm、サーマルビアは φ0.3 mm を格子状に（18 章）")

F["p12_parasitic"] = SVG(860, 320, [
    T(430, 26, "ビアは 3 つの寄生成分を持つ", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 148, 10, fill, c, 1.4),
    T(155 + i * 278, 78, name, "middle", 11.5, c, True),
    T(155 + i * 278, 104, formula, "middle", 10, INK, True),
    T(155 + i * 278, 134, val, "middle", 13, c, True),
    T(155 + i * 278, 164, eff1, "middle", 9.5, MUT),
    T(155 + i * 278, 182, eff2, "middle", 9.5, MUT),
] for i, (name, formula, val, eff1, eff2, c, fill) in enumerate([
    ("① インダクタンス", "L ≈ 5.08h[ln(4h/d)+1] nH", "約 1 nH", "1.75 GHz で 14 Ω",
     "1 A/ns の変化で 1 V 発生", SIG, SSOFT),
    ("② 容量", "C ≈ 1.41 εr T D₁/(D₂−D₁)", "0.3〜0.8 pF", "Z_via = √(L/C) が下がる",
     "アンチパッドを広げると改善", GRN, PAN),
    ("③ スタブ", "f = c / (4ℓ√εr)", "最も凶悪", "未使用部分が 1/4 波長共振",
     "その周波数の成分が消える", ALI, ASOFT),
])], []) + [
    RECT(24, 216, 812, 40, 8, SSOFT, SIG, 1.4),
    T(430, 240, "覚えるべき数字は「ビア 1 個で約 1 nH」。これが 14 章のデカップリングで効いてくる", "middle", 11, INK, True),
    T(430, 282, "板厚 1.6 mm・φ0.3 mm を代入: L ≈ 5.08 × 0.063 × [ln(21.4) + 1] ≈ 1.3 nH", "middle", 10.5, MUT),
    T(430, 302, "（式は inch 単位。h は板厚、d はドリル径）", "middle", 9, FNT),
], "L と C があるので、ビアは局所的にインピーダンスが下がる区間として見える")

F["p12_stub"] = SVG(860, 330, [
    T(430, 26, "ビアスタブ — 貫通ビアの未使用部分が共振する", "middle", 12.5, INK, True),
    # 断面
    RECT(40, 52, 340, 210, 10, SCR, LIN, 1.3),
    RECT(80, 76, 260, 168, 0, PAN, LIN, 1.1),
] + [
    COPPER(80, 76 + j * 24, 260, 4, MUT) for j in range(8)
] + [
    RECT(200, 76, 6, 172, 0, SIG, SIG, 0), RECT(214, 76, 6, 172, 0, SIG, SIG, 0),
    RECT(200, 148, 20, 100, 0, ALI, ALI, 0),
    RECT(100, 96, 100, 6, 0, SIG, SIG, 0),
    RECT(220, 144, 100, 6, 0, SIG, SIG, 0),
    T(88, 92, "L1", "end", 9, MUT), T(88, 148, "L4", "end", 9, MUT),
    T(330, 200, "スタブ", "start", 10, ALI, True),
    W(226, 200, 322, 198, c=ALI, lw=1),
    T(210, 262, "L1→L4 に渡すと、L4 から最終層までが残る", "middle", 9.5, MUT),
    # 表
    RECT(410, 52, 420, 210, 10, SCR, LIN, 1.3),
    T(620, 78, "f = c / (4 ℓ √εr)", "middle", 12.5, SIG, True),
    T(500, 108, "スタブ長", "middle", 10, MUT, True),
    T(720, 108, "共振周波数（εr = 4.3）", "middle", 10, MUT, True),
    W(430, 118, 810, 118, c=LIN, lw=1),
] + sum([[
    T(500, 142 + i * 28, l, "middle", 10.5, INK, True),
    T(720, 142 + i * 28, f, "middle", 11, c, True),
] for i, (l, f, c) in enumerate([
    ("1.0 mm", "36 GHz", MUT), ("1.5 mm", "24 GHz", MUT),
    ("2.0 mm", "18 GHz", ALI), ("3.0 mm", "12 GHz", ALI),
])], []) + [
    RECT(40, 274, 790, 48, 8, ASOFT, ALI, 1.4),
    T(430, 296, "対策の優先順位: ① 層の割り当てで避ける（費用ゼロ） ② バックドリル ③ ブラインド／ベリード", "middle", 11, INK, True),
    T(430, 314, "10 Gbps 未満では通常は問題にならない。一般的な基板でビアを恐れる必要はない", "middle", 10, MUT),
], "行き止まりの枝は 1/4 波長で短絡に見えるので、その周波数の成分がごっそり消える（ノッチ）")

F["p12_return"] = SVG(860, 300, [
    T(430, 26, "信号が層を移れば、リターンも層を移る", "middle", 12.5, INK, True),
    RECT(40, 52, 780, 158, 10, SCR, LIN, 1.3),
    # 断面
    RECT(120, 78, 620, 108, 0, PAN, LIN, 1.1),
    COPPER(120, 76, 620, 6, SIG), COPPER(120, 108, 620, 6, MUT),
    COPPER(120, 152, 620, 6, MUT), COPPER(120, 182, 620, 6, SIG),
    T(112, 84, "L1", "end", 9, MUT), T(112, 116, "L2 GND", "end", 9, MUT),
    T(112, 160, "L3 GND", "end", 9, MUT), T(112, 190, "L4", "end", 9, MUT),
    RECT(392, 76, 6, 112, 0, SIG, SIG, 0), RECT(406, 76, 6, 112, 0, SIG, SIG, 0),
    T(400, 68, "信号ビア", "middle", 9, SIG, True),
    RECT(462, 108, 6, 50, 0, GRN, GRN, 0), RECT(476, 108, 6, 50, 0, GRN, GRN, 0),
    T(472, 100, "GND ビア", "middle", 9, GRN, True),
    ARR(200, 70, 380, 70, SIG, 1.6), ARR(420, 196, 600, 196, SIG, 1.6),
    ARR(380, 122, 456, 122, GRN, 1.5), ARR(488, 146, 380, 146, GRN, 1.5),
    DIM(412, 134, 462, 134, "1〜2 mm 以内", ALI, 9.5, 0, ALI),
    RECT(40, 232, 780, 58, 8, SSOFT, SIG, 1.4),
    T(430, 254, "GND 面 → GND 面ならスティッチングビアで移れる", "middle", 11.5, INK, True),
    T(430, 276, "GND 面 → 電源面の場合、つなげるのはコンデンサだけ（コンデンサ自身の L が乗る）", "middle", 10, MUT),
], "忘れると、リターン電流はビアの周りを探して広がり、そこが放射源になる（19 章）")

F["p12_escape"] = SVG(860, 310, [
    T(430, 26, "BGA からの脱出（エスケープ）", "middle", 12.5, INK, True),
    # ドッグボーン
    RECT(40, 52, 370, 180, 10, SCR, GRN, 1.4),
    T(225, 76, "ドッグボーン", "middle", 11.5, GRN, True),
] + sum([[
    CIRC(140 + (j % 3) * 60, 116 + (j // 3) * 56, 13, SIG, 1.4, SSOFT),
    W(153 + (j % 3) * 60, 116 + (j // 3) * 56, 173 + (j % 3) * 60, 138 + (j // 3) * 56, c=SIG, lw=2.4),
    CIRC(178 + (j % 3) * 60, 142 + (j // 3) * 56, 7, MUT, 1.2, SCR),
] for j in range(6)], []) + [
    T(225, 212, "パッドから短い配線を出し、隣にビア。0.8 mm ピッチ以上向き・追加費用なし", "middle", 9, MUT),
    # ビアインパッド
    RECT(450, 52, 370, 180, 10, SSOFT, SIG, 1.4),
    T(635, 76, "ビアインパッド", "middle", 11.5, SIG, True),
] + sum([[
    CIRC(550 + (j % 3) * 60, 116 + (j // 3) * 56, 13, SIG, 1.4, SSOFT),
    CIRC(550 + (j % 3) * 60, 116 + (j // 3) * 56, 6, MUT, 1.2, SCR),
] for j in range(6)], []) + [
    T(635, 212, "パッドの中に直接ビア。0.5 mm ピッチ以下で必要・穴埋め＋めっき蓋が必須", "middle", 9, MUT),
    RECT(40, 250, 780, 48, 8, ASOFT, ALI, 1.4),
    T(430, 272, "ビアインパッドを穴埋めなしでやってはいけない", "middle", 11.5, INK, True),
    T(430, 290, "リフローではんだが穴に吸い込まれ、接合部のはんだが不足する（06 章の QFN と同じ問題）", "middle", 10, MUT),
], "表層で脱出できる列数は、パッド間に通せる配線本数で決まる。それが必要な配線層数を決める（05 章）")

# ===================== 13. ベタとポリゴン =====================

F["p13_roles"] = SVG(860, 280, [
    T(430, 26, "ベタ（銅の面）の 4 つの役割", "middle", 12.5, INK, True),
] + sum([[
    BOX(24 + i * 208, 54, 196, 96, name, sub, c, fill, INK, 8, 1.4, 11, 9),
    T(122 + i * 208, 172, ch, "middle", 9.5, MUT),
] for i, (name, sub, ch, c, fill) in enumerate([
    ("① 基準面", "リターン電流の道。最重要", "08 章", ALI, ASOFT),
    ("② 電源分配", "大電流を面で配る", "09・14 章", SIG, SSOFT),
    ("③ 放熱", "熱を横に広げて空気へ", "18 章", GRN, PAN),
    ("④ シールド", "ノイズ源と敏感回路を遮る", "19 章", LIN, PAN),
])], []) + [
    RECT(24, 194, 812, 62, 8, ASOFT, ALI, 1.4),
    T(430, 216, "目的なしに置いたベタは、役に立たないどころか害になる", "middle", 11.5, INK, True),
    T(430, 238, "孤立して浮いた銅はアンテナになり、細長い形は共振する。どの役割で置いているかを常に意識する", "middle", 10, MUT),
], "現代の既定はソリッド（べた塗り）。ハッチング（網目）はフレキ基板で使う（23 章）")

F["p13_thermal"] = SVG(860, 320, [
    T(430, 26, "サーマルリリーフ — はんだ付けのための「わざとの細さ」", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 166, 10, fill, c, 1.3),
    T(155 + i * 278, 76, name, "middle", 11, c, True),
    RECT(70 + i * 278, 96, 170, 88, 0, SSOFT, SIG, 1),
] + ([] if nsp == 0 else
     [CIRC(155 + i * 278, 140, 34, SCR, 0, SCR)] +
     [RECT(147 + i * 278, 106, 16, 34, 0, SSOFT, SSOFT, 0),
      RECT(147 + i * 278, 140, 16, 34, 0, SSOFT, SSOFT, 0)] +
     ([RECT(121 + i * 278, 132, 34, 16, 0, SSOFT, SSOFT, 0),
       RECT(155 + i * 278, 132, 34, 16, 0, SSOFT, SSOFT, 0)] if nsp == 4 else [])
    ) + [
    CIRC(155 + i * 278, 140, 22, SIG, 0, SIG),
    CIRC(155 + i * 278, 140, 10, SCR, 0, SCR),
    T(155 + i * 278, 202, note, "middle", 9.5, MUT),
] for i, (name, nsp, note, c, fill) in enumerate([
    ("直結（ソリッド接続）", 0, "電気抵抗は最小。熱が逃げてはんだ付けしにくい", ALI, ASOFT),
    ("4 スポーク ← 既定", 4, "細い橋 4 本でつなぐ。手はんだ・スルーホールに必須", SIG, SSOFT),
    ("2 スポーク", 2, "さらに熱が逃げにくい。手はんだ主体の場合", GRN, PAN),
])], []) + [
    RECT(24, 234, 812, 72, 8, ASOFT, ALI, 1.4),
    T(430, 256, "サーマルリリーフは抵抗である。大電流には使わない", "middle", 11.5, INK, True),
    T(430, 276, "幅 0.4 mm × 4 本は実効 1.6 mm 相当。5 A を流すパッドに使うと、そこだけが発熱する", "middle", 10, MUT),
    T(430, 296, "逆に、手はんだ・修理を想定する部品は必ずサーマルリリーフに（直結だと永遠に溶けない）", "middle", 10, SIG),
], "チップ部品の両側の熱容量は揃える。片側だけベタ直結だとトゥームストーンの原因になる（21 章）")

F["p13_stitch"] = SVG(860, 310, [
    T(430, 26, "スティッチングビア — 面と面を縫い合わせる", "middle", 12.5, INK, True),
    RECT(40, 52, 400, 180, 10, SCR, LIN, 1.3),
    RECT(70, 78, 340, 128, 0, PAN, LIN, 1.1),
] + [
    CIRC(94 + (j % 8) * 46, 100 + (j // 8) * 40, 6, GRN, 1.2, PAN) for j in range(24)
] + [
    T(240, 224, "λ/20 間隔で全面に。基板端はビアフェンス", "middle", 9.5, MUT),
    RECT(460, 52, 370, 180, 10, SCR, LIN, 1.3),
    T(645, 78, "目的", "middle", 11, INK, True),
] + [
    T(486, 106 + i * 26, t, "start", 10, c) for i, (t, c) in enumerate([
        ("① リターン電流の乗り換え（08・12 章）", SIG),
        ("② 面どうしの電位を揃える", SIG),
        ("③ 平行平板の共振を抑える（14 章）", GRN),
    ])
] + [
    T(645, 194, "実務: 5〜10 mm 間隔で全面、高速ビアの近くと基板端は密に", "middle", 9.5, MUT),
    T(200, 268, "λ = c / (f √εr)", "middle", 11, SIG, True),
    T(500, 258, "1 GHz → λ/20 = 7 mm", "middle", 10, MUT),
    T(500, 278, "3 GHz → 2.4 mm　／　5 GHz → 1.5 mm", "middle", 10, MUT),
    T(430, 300, "表層ベタは、λ/20 でビアを打って初めて意味がある。打たないなら置かないほうがマシである", "middle", 11, ALI, True),
], "2 枚の面の間は端の開いた平行平板共振器。外周にビアを並べると電気的な壁ができて漏れが減る")

F["p13_pitfall"] = SVG(860, 300, [
    T(430, 26, "ベタの落とし穴", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 208, 52, 196, 150, 10, ASOFT, ALI, 1.3),
    T(122 + i * 208, 76, name, "middle", 10.5, ALI, True),
    RECT(44 + i * 208, 92, 156, 60, 0, PAN, LIN, 1),
] + art + [
    T(122 + i * 208, 172, why, "middle", 9, MUT),
    T(122 + i * 208, 190, fix, "middle", 9, GRN, True),
] for i, (name, art, why, fix) in enumerate([
    ("孤立した銅", [RECT(84, 106, 76, 32, 2, SIG, SIG, 0)],
     "浮いた電位でアンテナになる", "孤立領域を自動削除"),
    ("細い首（ネック）", [RECT(252, 96, 156, 22, 0, SIG, SIG, 0), RECT(252, 140, 156, 8, 0, SIG, SIG, 0)],
     "大電流とリターンが破綻する", "流したあと目で見る"),
    ("細長い形", [RECT(460, 118, 156, 10, 0, SIG, SIG, 0)],
     "λ/4・λ/2 で共振する", "途中にビアを打って区切る"),
    ("縫っていない表層ベタ", [RECT(668, 96, 156, 52, 0, SIG, SIG, 0)],
     "大きな浮いた金属板になる", "λ/20 でスティッチング"),
])], []) + [
    RECT(24, 218, 812, 66, 8, SSOFT, SIG, 1.4),
    T(430, 240, "ベタを流したあとに、必ず「流れた形」を目で見る", "middle", 11.5, INK, True),
    T(430, 262, "「ベタを流したから大丈夫」ではない。自動生成の結果を確認するのは設計者の仕事である", "middle", 10, MUT),
], "銅の残り率を均一にする目的だけで表層ベタを置くのは、それはそれで正当な理由になる（20 章）")

F["p13_power"] = SVG(860, 300, [
    T(430, 26, "電源面の分割は許される — ただし条件つき", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 168, 10, ASOFT, ALI, 1.4),
    T(225, 76, "×  分割線を信号が横切る", "middle", 11, ALI, True),
    RECT(70, 96, 150, 80, 0, SSOFT, SIG, 1.1), RECT(232, 96, 150, 80, 0, PAN, GRN, 1.1),
    T(145, 140, "3.3 V", "middle", 9.5, SIG), T(307, 140, "1.8 V", "middle", 9.5, GRN),
    RECT(100, 190, 250, 9, 1, SIG, SIG, 0),
    W(226, 96, 226, 200, c=ALI, lw=2),
    T(226, 214, "!", "middle", 12, ALI, True),
    T(225, 208, "この信号の基準面が電源面なら破綻する", "middle", 9, ALI, True),
    RECT(450, 52, 370, 168, 10, SCR, GRN, 1.4),
    T(635, 76, "○  信号の基準面が別の GND 面にある", "middle", 11, GRN, True),
    RECT(480, 96, 150, 46, 0, SSOFT, SIG, 1.1), RECT(642, 96, 150, 46, 0, PAN, GRN, 1.1),
    COPPER(480, 156, 312, 10, MUT),
    RECT(510, 186, 250, 9, 1, SIG, SIG, 0),
    T(636, 176, "連続した GND 面", "middle", 9, MUT),
    T(635, 210, "リターンは GND 面を通る → 電源の分割は無関係", "middle", 9, GRN, True),
    RECT(40, 240, 780, 50, 8, SSOFT, SIG, 1.4),
    T(430, 262, "一貫した原則は 1 つ: その信号のリターンが通る面を切らない", "middle", 11.5, INK, True),
    T(430, 282, "「電源は分けてよい／GND は分けてはいけない」ではなく、リターンの通る面かどうかで決まる", "middle", 10, MUT),
], "電源面も、デカップリングコンデンサで GND と交流的につながっているのでリターンパスになり得る")

# ===================== 14. 電源分配とデカップリング =====================

F["p14_why"] = SVG(860, 300, [
    T(430, 26, "なぜ IC のそばに電荷のタンクが要るのか", "middle", 12.5, INK, True),
    RECT(40, 52, 780, 160, 10, SCR, LIN, 1.3),
    PART(70, 110, 84, 54, "REG", INK, PAN),
    T(112, 180, "レギュレータ", "middle", 9, MUT),
    RECT(154, 128, 420, 10, 1, SIG, SIG, 0),
    T(364, 118, "遠い（数十 mm）＋ 経路のインダクタンス", "middle", 9.5, ALI, True),
    PART(660, 100, 100, 74, "IC", INK, PAN),
    PART(596, 122, 36, 30, "C", SIG, SSOFT),
    W(632, 132, 660, 132, c=SIG, lw=2.4),
    T(614, 172, "近い", "middle", 9, GRN, True),
    T(710, 190, "クロックの立ち上がりごとに", "middle", 9.5, MUT),
    T(710, 206, "0.5〜2 A/ns を要求する", "middle", 9.5, ALI, True),
    RECT(40, 230, 780, 60, 8, ASOFT, ALI, 1.4),
    T(430, 252, "V = L · di/dt", "middle", 13, INK, True),
    T(430, 274, "経路 1〜5 nH × 1 A/ns = 1〜5 V の落ち込み。1.0 V 電源なら IC は止まる", "middle", 10.5, ALI, True),
], "だから経路のインダクタンスを 1 nH のオーダーまで下げる必要がある")

F["p14_srf"] = SVG(860, 320, [
    T(430, 26, "コンデンサは高い周波数ではコンデンサではない", "middle", 12.5, INK, True),
    AXES(90, 216, 560, 150, "周波数", "|Z|"),
    PL([(90 + 560 * u, 76 + 140 * u) for u in [i / 40 for i in range(41)]], FNT, 1.4, "4 3"),
    PL([(90 + 560 * u, 216 - 140 * u) for u in [i / 40 for i in range(41)]], FNT, 1.4, "4 3"),
    PL([(90 + 560 * u, min(76 + 140 * u, 216 - 140 * u)) for u in [i / 240 for i in range(241)]], SIG, 2.6),
    T(170, 96, "1/(2πfC)", "middle", 9.5, FNT), T(600, 96, "2πfL（ESL）", "middle", 9.5, FNT),
    W(370, 216, 370, 150, c=ALI, lw=1.4, dash="4 3"),
    T(370, 236, "SRF", "middle", 10.5, ALI, True),
    T(392, 152, "ESR（谷の底）", "start", 9, ALI),
    BOX(662, 66, 176, 52, "f_SRF = 1/(2π√(LC))", None, SIG, SSOFT, INK, 8, 1.4, 11.5, 9, None, True),
    T(750, 142, "SRF より上では", "middle", 10, MUT),
    T(750, 160, "インダクタとして振る舞う", "middle", 10, ALI, True),
    RECT(40, 250, 780, 62, 8, ASOFT, ALI, 1.4),
    T(430, 272, "部品の ESL 0.5 nH に対し、パッド〜配線 3 mm ＋ ビア 2 本で 約 5 nH", "middle", 11.5, INK, True),
    T(430, 294, "型番を選ぶ努力より、配線を 1 mm 短くする努力のほうが効く —— これがこの章の核心である", "middle", 10.5, SIG, True),
], "SRF は √L に反比例するので、配線で L が 10 倍になると共振周波数は 1/3 に落ちる")

F["p14_loop"] = SVG(860, 300, [
    T(430, 26, "最小化すべきループ", "middle", 12.5, INK, True),
    RECT(60, 52, 740, 156, 10, SCR, LIN, 1.3),
    RECT(120, 80, 560, 8, 0, SIG, SIG, 0),
    T(114, 88, "電源面", "end", 9.5, SIG, True),
    COPPER(120, 178, 560, 8, MUT),
    T(114, 186, "GND 面", "end", 9.5, MUT, True),
    PART(170, 96, 110, 72, "IC", INK, PAN),
    PART(400, 112, 44, 36, "C", SIG, SSOFT),
    W(280, 106, 400, 106, c=SIG, lw=2.2),
    W(280, 158, 400, 158, c=MUT, lw=2.2),
    W(196, 88, 196, 96, c=SIG, lw=2.2), W(196, 168, 196, 178, c=MUT, lw=2.2),
    W(422, 88, 422, 112, c=SIG, lw=2.2), W(422, 148, 422, 178, c=MUT, lw=2.2),
    LOOP([(282, 106), (424, 106), (424, 158), (282, 158)], ALI, 2.2, "5 4", 0),
    T(540, 120, "この環の面積 = インダクタンス", "start", 10, ALI, True),
    T(540, 142, "電源ピン → 電源面 → C → GND 面 → GND ピン", "start", 9.5, MUT),
    RECT(60, 226, 740, 60, 8, SSOFT, SIG, 1.4),
    T(430, 250, "IC 直下（裏面）0.5〜1 nH ／ 隣 2 mm で 1〜2 nH ／ 5 mm で 3〜5 nH ／ 10 mm 以上は無意味", "middle", 11, INK, True),
    T(430, 272, "ビアを 2 本ずつにすると、その部分の L は半分になる（コストはほぼゼロ）", "middle", 10, MUT),
], "近すぎるビアは相互インダクタンスで期待ほど減らない。電源と GND のビアを近づけ、同極どうしは離す")

F["p14_layout"] = SVG(860, 300, [
    T(430, 26, "配線パターンの良し悪しは、目で見て分かる", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 170, 10, ASOFT, ALI, 1.4),
    T(225, 76, "×  パッドから細い配線でビアへ", "middle", 11, ALI, True),
    RECT(140, 116, 44, 36, 2, SSOFT, SIG, 1.2),
    W(140, 134, 90, 134, c=SIG, lw=1.6), CIRC(84, 134, 7, MUT, 1.2, SCR),
    W(184, 134, 300, 134, c=SIG, lw=1.6), CIRC(306, 134, 7, MUT, 1.2, SCR),
    T(225, 176, "配線 3 mm × 2 → 4〜6 nH", "middle", 10, ALI, True),
    T(225, 198, "これでは何を選んでも意味がない", "middle", 9.5, MUT),
    RECT(450, 52, 370, 170, 10, SCR, GRN, 1.4),
    T(635, 76, "○  パッドの両端から最短でビアへ", "middle", 11, GRN, True),
    RECT(613, 116, 44, 36, 2, SSOFT, SIG, 1.2),
    W(613, 128, 596, 128, c=SIG, lw=4), CIRC(590, 128, 8, MUT, 1.2, SCR),
    W(613, 142, 596, 142, c=SIG, lw=4), CIRC(590, 142, 8, MUT, 1.2, SCR),
    W(657, 128, 674, 128, c=SIG, lw=4), CIRC(680, 128, 8, MUT, 1.2, SCR),
    W(657, 142, 674, 142, c=SIG, lw=4), CIRC(680, 142, 8, MUT, 1.2, SCR),
    T(635, 176, "幅広・最短・ビア 2 本ずつ → 0.5〜1 nH", "middle", 10, GRN, True),
    T(635, 198, "理想はパッドに直接ビア（12 章）", "middle", 9.5, MUT),
    RECT(40, 242, 780, 44, 8, SSOFT, SIG, 1.4),
    T(430, 268, "レビューで見るのはこれだけ: 「コンデンサの両端から、それぞれ最短でビアに落ちているか」", "middle", 11, INK, True),
], "IC の裏面に置くのは強力。真下なら経路が板厚ぶんだけで済む")

F["p14_multi"] = SVG(860, 310, [
    T(430, 26, "値を混ぜるべきか — 反共振という問題", "middle", 12.5, INK, True),
    # 反共振
    RECT(40, 52, 370, 176, 10, ASOFT, ALI, 1.4),
    T(225, 76, "違う値を並列（100n + 10n）", "middle", 11, ALI, True),
    AXES(80, 190, 290, 84, None, None),
    PL([(80 + 290 * u, y) for u, y in
        [(0.0, 116), (0.26, 180), (0.30, 184), (0.42, 148), (0.52, 122),
         (0.62, 150), (0.74, 182), (0.78, 184), (1.0, 118)]], ALI, 2.4),
    W(231, 122, 231, 190, c=ALI, lw=1.2, dash="3 3"),
    T(231, 114, "反共振の山", "middle", 9.5, ALI, True),
    T(167, 204, "100n の谷", "middle", 8.5, MUT),
    T(306, 204, "10n の谷", "middle", 8.5, MUT),
    T(225, 214, "片方が誘導性・片方が容量性 → 並列共振", "middle", 9.5, ALI, True),
    # 同じ値
    RECT(450, 52, 370, 176, 10, SCR, GRN, 1.4),
    T(635, 76, "同じ値を複数個（100n × 3）", "middle", 11, GRN, True),
    AXES(490, 190, 290, 84, None, None),
    PL([(490 + 290 * u, y) for u, y in
        [(0.0, 116), (0.30, 172), (0.45, 185), (0.60, 185), (0.72, 172), (1.0, 116)]], GRN, 2.4),
    T(635, 204, "谷が深く広い", "middle", 8.5, MUT),
    T(635, 214, "SRF は変わらず、谷が深く広くなる。反共振なし", "middle", 9.5, GRN, True),
    RECT(40, 248, 780, 54, 8, SSOFT, SIG, 1.4),
    T(430, 270, "判断基準", "middle", 11.5, INK, True),
    T(430, 292, "配線の L が 2 nH を超えている → 値を変えても無駄。まず配置を直す ／ 1 nH 以下 → 使い分けに意味が出る", "middle", 10, MUT),
], "昔の部品は ESL が大きく SRF が低かったので、小容量品で高域を補う必要が本当にあった")

F["p14_pdn"] = SVG(860, 320, [
    T(430, 26, "PDN インピーダンス — 帯域ごとに担当が違う", "middle", 12.5, INK, True),
    BOX(300, 48, 260, 44, "Z_target = ΔV / ΔI", None, SIG, SSOFT, INK, 8, 1.5, 13, 9, None, True),
    T(430, 108, "例: 1.0 V・許容 5 %（50 mV）・電流変動 2 A → 25 mΩ を数百 MHz まで維持する", "middle", 10.5, MUT),
    T(180, 142, "帯域", "middle", 10.5, MUT, True),
    T(560, 142, "誰が担当するか", "middle", 10.5, MUT, True),
    W(40, 152, 820, 152, c=LIN, lw=1),
] + sum([[
    RECT(40, 162 + i * 34, 780, 28, 5, fill, c, 1.1),
    T(180, 181 + i * 34, band, "middle", 10, INK, True),
    T(560, 181 + i * 34, who, "middle", 10, c, True),
] for i, (band, who, c, fill) in enumerate([
    ("DC 〜 数 kHz", "レギュレータの帰還制御", GRN, PAN),
    ("数 kHz 〜 数 MHz", "バルクコンデンサ（10〜100 µF）", SIG, SSOFT),
    ("数 MHz 〜 数百 MHz", "セラミックコンデンサ（100 nF）＋ その配線 ← 設計者の領分", ALI, ASOFT),
    ("数百 MHz 〜", "電源面と GND 面の面間容量、パッケージ内、オンチップ", LIN, PAN),
])], []) + [
    T(430, 308, "面間容量: C = ε₀εr A/d。50×50 mm・間隔 0.1 mm で約 1 nF。小さいが ESL がほぼゼロなので高域で効く", "middle", 10, MUT),
], "1 nH で 25 mΩ を満たせるのは 4 MHz まで。だから多段構成になる")

# ===================== 15. クロストーク =====================

F["p15_coupling"] = SVG(860, 300, [
    T(430, 26, "クロストークの 2 つの結合", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 168, 10, SSOFT, SIG, 1.4),
    T(225, 76, "容量結合 C_m（電界）", "middle", 11.5, SIG, True),
    RECT(110, 116, 90, 12, 0, SIG, SIG, 0), RECT(250, 116, 90, 12, 0, GRN, GRN, 0),
] + [
    W(200 + i * 12, 122, 250 - 0 + i * 0, 122, c=ALI, lw=1, dash="2 3") for i in range(1)
] + [
    '<path d="M 200 122 Q 225 100 250 122" fill="none" stroke="%s" stroke-width="1.3" stroke-dasharray="3 3"/>' % ALI,
    '<path d="M 200 122 Q 225 144 250 122" fill="none" stroke="%s" stroke-width="1.3" stroke-dasharray="3 3"/>' % ALI,
    T(225, 164, "I_C = C_m · dV/dt", "middle", 11.5, INK, True),
    T(225, 190, "加害者の電圧の変化率に比例", "middle", 9.5, MUT),
    RECT(450, 52, 370, 168, 10, SCR, GRN, 1.4),
    T(635, 76, "誘導結合 L_m（磁界）", "middle", 11.5, GRN, True),
    RECT(520, 116, 90, 12, 0, SIG, SIG, 0), RECT(660, 116, 90, 12, 0, GRN, GRN, 0),
    CIRC(590, 122, 22, ALI, 1.3, "none", "3 3"), CIRC(590, 122, 36, ALI, 1.1, "none", "3 3"),
    T(635, 164, "V_L = L_m · dI/dt", "middle", 11.5, INK, True),
    T(635, 190, "加害者の電流の変化率に比例", "middle", 9.5, MUT),
    RECT(40, 240, 780, 48, 8, ASOFT, ALI, 1.4),
    T(430, 262, "どちらも「変化率」に比例する", "middle", 11.5, INK, True),
    T(430, 280, "クロストークは周波数ではなく、立ち上がりの速さで決まる（10 章と同じ構図）", "middle", 10, MUT),
], "加害者（aggressor）が漏らす側、被害者（victim）が受ける側")

F["p15_nextfext"] = SVG(860, 320, [
    T(430, 26, "近端（NEXT）と遠端（FEXT）は性質が違う", "middle", 12.5, INK, True),
    RECT(40, 52, 780, 106, 10, SCR, LIN, 1.3),
    RECT(140, 84, 560, 10, 1, SIG, SIG, 0),
    RECT(140, 122, 560, 10, 1, GRN, GRN, 0),
    T(120, 92, "加害者", "end", 9.5, SIG, True), T(120, 130, "被害者", "end", 9.5, GRN, True),
    ARR(160, 76, 300, 76, SIG, 1.6),
    ARR(230, 146, 150, 146, ALI, 1.6), T(190, 162, "NEXT", "middle", 9.5, ALI, True),
    ARR(600, 146, 690, 146, ALI, 1.6), T(645, 162, "FEXT", "middle", 9.5, ALI, True),
    T(150, 68, "近端", "middle", 9, MUT), T(690, 68, "遠端", "middle", 9, MUT),
] + sum([[
    RECT(40, 200 + i * 42, 780, 36, 6, fill, c, 1.2),
    T(120, 223 + i * 42, name, "middle", 11, c, True),
    T(300, 223 + i * 42, pol, "middle", 10, MUT),
    T(500, 223 + i * 42, wave, "middle", 10, MUT),
    T(720, 223 + i * 42, length, "middle", 10, c, True),
] for i, (name, pol, wave, length, c, fill) in enumerate([
    ("NEXT（近端）", "加害者と同じ極性", "幅の広いパルス", "ある長さで飽和する", SIG, SSOFT),
    ("FEXT（遠端）", "逆極性が一般的", "鋭いパルス（t_r 程度）", "長さに比例して増え続ける", ALI, ASOFT),
])], []) + [
    T(300, 190, "極性", "middle", 10, MUT, True),
    T(500, 190, "波形", "middle", 10, MUT, True),
    T(720, 190, "結合長が伸びると", "middle", 10, MUT, True),
    T(430, 306, "そして FEXT は、ストリップライン（内層）では理論上ゼロになる（次図）", "middle", 10.5, GRN, True),
], "被害者の線には両方向に伝わるので、両端で別々に観測される")

F["p15_fext"] = SVG(860, 300, [
    T(430, 26, "なぜ FEXT はストリップラインで消えるのか", "middle", 12.5, INK, True),
    BOX(250, 48, 360, 46, "C_m / C₀ = L_m / L₀ のとき打ち消し合う", None, SIG, SSOFT, INK, 8, 1.5, 12, 9, None, True),
    T(430, 112, "この条件は「線の周りの誘電体が均一」のときに成り立つ", "middle", 10.5, MUT),
    RECT(40, 128, 370, 122, 10, ASOFT, ALI, 1.4),
    T(225, 152, "マイクロストリップ（外層）", "middle", 11, ALI, True),
    RECT(110, 178, 60, 10, 0, SIG, SIG, 0), RECT(240, 178, 60, 10, 0, GRN, GRN, 0),
    RECT(80, 196, 250, 26, 0, PAN, LIN, 1),
    COPPER(80, 222, 250, 8, MUT),
    T(205, 172, "上は空気（εr = 1）", "middle", 8.5, FNT),
    T(225, 242, "誘電体が不均一 → FEXT が残る", "middle", 9.5, ALI, True),
    RECT(450, 128, 370, 122, 10, SCR, GRN, 1.4),
    T(635, 152, "ストリップライン（内層）", "middle", 11, GRN, True),
    COPPER(490, 168, 250, 8, MUT),
    RECT(490, 176, 250, 46, 0, PAN, LIN, 1),
    RECT(520, 194, 60, 10, 0, SIG, SIG, 0), RECT(650, 194, 60, 10, 0, GRN, GRN, 0),
    COPPER(490, 222, 250, 8, MUT),
    T(635, 242, "上下とも FR-4 で均一 → FEXT ほぼゼロ", "middle", 9.5, GRN, True),
    RECT(40, 264, 780, 30, 8, SSOFT, SIG, 1.3),
    T(430, 284, "長く並走する高速バスは、内層に通すだけで FEXT がほぼ消える —— 間隔を広げるより効く", "middle", 11, INK, True),
], "NEXT は内層でも残るので、送信端どうしが隣り合う配置では別途注意が要る")

F["p15_ratio"] = SVG(860, 300, [
    T(430, 26, "結合は s 単独ではなく s/h の比で決まる", "middle", 12.5, INK, True),
    RECT(40, 52, 340, 140, 10, SCR, LIN, 1.3),
    RECT(110, 92, 60, 11, 0, SIG, SIG, 0), RECT(230, 92, 60, 11, 0, GRN, GRN, 0),
    COPPER(80, 152, 250, 9, MUT),
    DIM(170, 78, 230, 78, "s", ALI, 10, 0, ALI),
    DIM(350, 92, 350, 152, None, SIG), T(342, 126, "h", "end", 10, SIG, True),
    T(210, 178, "配線間の距離 s / 基準面までの高さ h", "middle", 9, MUT),
    T(600, 70, "s/h", "middle", 10.5, MUT, True),
    T(730, 70, "相対的な結合の目安", "middle", 10.5, MUT, True),
    W(410, 80, 830, 80, c=LIN, lw=1),
] + sum([[
    T(600, 104 + i * 26, r, "middle", 10.5, INK, True),
    RECT(660, 92 + i * 26, 150 * v / 50, 18, 3, ASOFT if v > 15 else SSOFT, ALI if v > 15 else SIG, 1.1),
    T(846, 106 + i * 26, "%d %%" % v, "end", 10, ALI if v > 15 else SIG, True),
] for i, (r, v) in enumerate([("1", 50), ("2", 20), ("3", 10), ("4", 6), ("5", 4)])], []) + [
    RECT(40, 216, 780, 70, 8, SSOFT, SIG, 1.4),
    T(430, 238, "基準面を近づけるのは、間隔を広げるのと同じ効果を持つ", "middle", 11.5, INK, True),
    T(430, 258, "h を半分にすれば s/h が 2 倍になり、結合は 1/4 程度に減る", "middle", 10, MUT),
    T(430, 278, "しかも h が薄いと 50 Ω の線幅が細くなり、配線が入りやすくなる（05 章の 3 つめの理由）", "middle", 10, SIG),
], "結合 ∝ 1/(1 + k(s/h)²)。k は構造で決まる定数で、マイクロストリップでは概ね 1 前後")

F["p15_3w"] = SVG(860, 290, [
    T(430, 26, "3W 則 — 経験則の正体", "middle", 12.5, INK, True),
    RECT(60, 52, 740, 118, 10, SCR, LIN, 1.3),
    RECT(160, 100, 60, 12, 0, SIG, SIG, 0),
    RECT(340, 100, 60, 12, 0, GRN, GRN, 0),
    DIM(190, 82, 370, 82, "中心間 3W", SIG, 10, 0, SIG),
    DIM(220, 132, 340, 132, "エッジ間 2W", MUT, 9.5),
    DIM(160, 152, 220, 152, "W", MUT, 9),
    T(600, 92, "中心間 3W ＝ エッジ間 2W である", "middle", 11, INK, True),
    T(600, 116, "「エッジ間 3W」と誤解している例が非常に多い", "middle", 9.5, ALI, True),
    T(600, 138, "損はしないが、配線密度を無駄に犠牲にする", "middle", 9.5, MUT),
] + sum([[
    RECT(24 + i * 208, 186, 196, 56, 8, fill, c, 1.3),
    T(122 + i * 208, 208, name, "middle", 11, c, True),
    T(122 + i * 208, 230, use, "middle", 9, MUT),
] for i, (name, use, c, fill) in enumerate([
    ("2W → 結合 20 %", "低速・非クリティカル", LIN, PAN),
    ("3W → 結合 10 %", "既定", SIG, SSOFT),
    ("5W → 結合 4 %", "敏感な信号、アナログとの間", GRN, PAN),
    ("クロック・高速線", "ガードや層分離を併用", ALI, ASOFT),
])], []) + [
    T(430, 268, "3W 則は「典型的な 50 Ω マイクロストリップで、結合 10 % 以下」という条件での目安であって、普遍の法則ではない", "middle", 10, MUT),
], "50 Ω マイクロストリップでは w/h ≈ 1.8 なので、エッジ間 2W は s/h ≈ 3.6 に相当する")

F["p15_guard"] = SVG(860, 300, [
    T(430, 26, "ガードトレース — 落とさないと逆効果になる", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 172, 10, ASOFT, ALI, 1.4),
    T(225, 76, "×  ビアで落としていない", "middle", 11, ALI, True),
    RECT(70, 106, 300, 10, 0, SIG, SIG, 0),
    RECT(70, 140, 300, 10, 0, MUT, MUT, 0),
    RECT(70, 174, 300, 10, 0, GRN, GRN, 0),
    ARR(180, 128, 180, 138, ALI, 1.4), ARR(180, 152, 180, 166, ALI, 1.4),
    T(225, 202, "浮いた導体が結合を中継する", "middle", 9.5, ALI, True),
    RECT(450, 52, 370, 172, 10, SCR, GRN, 1.4),
    T(635, 76, "○  λ/10 以下でビア接地", "middle", 11, GRN, True),
    RECT(480, 106, 300, 10, 0, SIG, SIG, 0),
    RECT(480, 140, 300, 10, 0, MUT, MUT, 0),
    RECT(480, 174, 300, 10, 0, GRN, GRN, 0),
] + [
    CIRC(506 + i * 50, 145, 6, GRN, 1.2, PAN) for i in range(6)
] + [
    T(635, 202, "電位が固定され、遮蔽として働く", "middle", 9.5, GRN, True),
    RECT(40, 244, 780, 46, 8, SSOFT, SIG, 1.4),
    T(430, 264, "正直なところ、ガードを 1 本入れるより、その幅ぶん間隔を空けるほうが効果が大きいことが多い", "middle", 11, INK, True),
    T(430, 282, "有効なのは「空ける場所がなく、かつ確実にビアで落とせる」場合である", "middle", 10, MUT),
], "高速信号に対するビア間隔の目安は 5 mm 以下（13 章と同じ考え方）")

# ===================== 16. 高速インタフェース =====================

F["p16_knee"] = SVG(860, 352, [
    T(430, 26, "「速い」を定義する — ニー周波数", "middle", 12.5, INK, True),
    BOX(290, 48, 280, 46, "f_knee ≈ 0.35 / t_r", None, SIG, SSOFT, INK, 8, 1.6, 14, 10, None, True),
    T(180, 118, "立ち上がり t_r", "middle", 10.5, MUT, True),
    T(430, 118, "f_knee", "middle", 10.5, MUT, True),
    T(690, 118, "制御が要る配線長（外層 6 ps/mm）", "middle", 10.5, MUT, True),
    W(40, 128, 820, 128, c=LIN, lw=1),
] + sum([[
    RECT(40, 136 + i * 24, 780, 20, 4, fill, LIN, 1),
    T(180, 151 + i * 24, tr, "middle", 10, INK, True),
    T(430, 151 + i * 24, fk, "middle", 10, c, True),
    T(690, 151 + i * 24, ln, "middle", 10, c, True),
] for i, (tr, fk, ln, c, fill) in enumerate([
    ("5 ns", "70 MHz", "140 mm", MUT, SCR),
    ("1 ns", "350 MHz", "28 mm", MUT, PAN),
    ("500 ps", "700 MHz", "14 mm", SIG, SCR),
    ("200 ps", "1.75 GHz", "5.5 mm", SIG, PAN),
    ("100 ps", "3.5 GHz", "2.8 mm", ALI, SCR),
    ("35 ps", "10 GHz", "1 mm", ALI, PAN),
])], []) + [
    RECT(40, 290, 780, 52, 8, ASOFT, ALI, 1.4),
    T(430, 312, "10 MHz のクロックでも、立ち上がりが 500 ps なら 700 MHz の設計である", "middle", 11.5, INK, True),
    T(430, 332, "「遅い信号だから適当でよい」は、データシートの t_r を見てから言うこと", "middle", 10, MUT),
], "IC のドライバ強度を設定で下げられることが多い。使わない速さは落としておく（19 章）")

F["p16_table"] = SVG(860, 366, [
    T(430, 26, "規格ごとの、アートワークに直接効く要求", "middle", 12.5, INK, True),
    T(130, 58, "規格", "middle", 10, MUT, True),
    T(300, 58, "速度", "middle", 10, MUT, True),
    T(420, 58, "差動 Z", "middle", 10, MUT, True),
    T(540, 58, "ペア内スキュー", "middle", 10, MUT, True),
    T(710, 58, "主な注意点", "middle", 10, MUT, True),
    W(24, 68, 836, 68, c=LIN, lw=1),
] + sum([[
    RECT(24, 76 + i * 32, 812, 27, 4, fill, LIN, 1),
    T(130, 94 + i * 32, name, "middle", 9.5, INK, True),
    T(300, 94 + i * 32, sp, "middle", 9.5, MUT),
    T(420, 94 + i * 32, z, "middle", 9.5, SIG, True),
    T(540, 94 + i * 32, sk, "middle", 9.5, c),
    T(710, 94 + i * 32, note, "middle", 9, MUT),
] for i, (name, sp, z, sk, note, c, fill) in enumerate([
    ("USB 2.0 HS", "480 Mbps", "90 Ω", "緩い（数 mm）", "短く、ビア最少、ESD 保護は近く", MUT, SCR),
    ("USB 3.x", "5〜10 Gbps", "90 Ω", "厳しい（0.1 mm 級）", "AC カップリング必須、スタブ注意", ALI, PAN),
    ("イーサネット", "125 MHz/ペア", "100 Ω", "中", "トランス以降はシャーシ側。分離が重要", MUT, SCR),
    ("PCIe", "2.5〜32 GT/s", "85 Ω", "非常に厳しい", "AC カップリング、クロックのジッタ", ALI, PAN),
    ("HDMI / DisplayPort", "〜数 Gbps", "100 Ω", "厳しい", "ESD 保護、コネクタの不連続", ALI, SCR),
    ("MIPI D-PHY", "〜2.5 Gbps/レーン", "100 Ω", "厳しい", "低振幅でノイズに弱い", ALI, PAN),
    ("DDR3/4（並列）", "〜3200 MT/s", "40〜50 Ω 単線", "—", "バイト単位で等長、フライバイ", SIG, SCR),
    ("SPI / I²C", "〜50 MHz", "—", "—", "立ち上がりが速ければ配慮が要る", MUT, PAN),
])], []) + [
    T(430, 350, "具体的な数値は規格の版と IC で変わる。必ず規格書と IC のデザインガイドで確認すること", "middle", 10, ALI, True),
], "差動シリアル系は共通の作法が効く。並列バス（DDR）は考え方がまったく違う")

F["p16_serial"] = SVG(860, 332, [
    T(430, 26, "差動シリアル系の作法", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 28, 812, 24, 4, fill, LIN, 1),
    T(280, 68 + i * 28, rule, "middle", 10, INK, True),
    T(640, 68 + i * 28, why, "middle", 9.5, MUT),
] for i, (rule, why, fill) in enumerate([
    ("コネクタや IC からまっすぐ出す", "出口の直後の不連続が最も響く", SCR),
    ("ペアで対称に、間隔を一定に保つ", "途中で変わると反射する（11 章）", PAN),
    ("ビアは最少に。使うなら 2 本対称に", "ビアは最大の不連続。スタブにも注意（12 章）", SCR),
    ("リターンビアを添える", "層を移るとき必須（08・12 章）", PAN),
    ("基準面を絶対にまたがない", "論外の失敗", SCR),
    ("AC カップリングは対称に、同じ位置に", "ずれるとスキューになる", PAN),
    ("他の信号から離す（5W 以上）", "片側だけの結合は差動信号になる（11 章）", SCR),
    ("ESD 保護素子は容量の小さいものを近くに", "容量が大きいと信号が鈍る", PAN),
])], []) + [
    RECT(24, 284, 812, 44, 8, SSOFT, SIG, 1.4),
    T(430, 311, "最も効くのは計算でも部品でもなく、距離を短くすること —— それは配置の仕事である（07 章）", "middle", 11, INK, True),
], "コネクタと IC の位置関係を決めた時点で、勝負の大半はついている")

F["p16_ddr"] = SVG(860, 310, [
    T(430, 26, "DDR — 等長は「バイト単位」、トポロジは 2 種類", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 172, 10, SSOFT, SIG, 1.4),
    T(225, 76, "等長のグループ", "middle", 11, SIG, True),
] + sum([[
    T(70, 106 + i * 30, g, "start", 10, c, True),
    T(380, 106 + i * 30, m, "end", 9, MUT),
] for i, (g, m, c) in enumerate([
    ("DQ ＋ DQS", "同じバイトレーン内で揃える", SIG),
    ("ADDR / CMD / CTRL", "クロック CK に対して揃える", SIG),
    ("CK", "基準", MUT),
])], []) + [
    T(225, 200, "バイトをまたいだ等長には意味がない", "middle", 10, ALI, True),
    RECT(450, 52, 370, 172, 10, SCR, GRN, 1.4),
    T(635, 76, "トポロジ", "middle", 11, GRN, True),
    T(500, 112, "DQ / DQS", "start", 10, INK, True),
    W(600, 108, 780, 108, c=SIG, lw=2.4), PART(560, 100, 34, 18, None, INK, PAN),
    T(690, 100, "点対点", "middle", 9, MUT),
    T(500, 160, "ADDR / CMD", "start", 10, INK, True),
    W(600, 156, 790, 156, c=SIG, lw=2.4),
] + [
    PART(618 + j * 52, 148, 26, 16, None, INK, PAN) for j in range(3)
] + [
    T(690, 184, "フライバイ（数珠つなぎ、終端で終わる）", "middle", 9, MUT),
    T(635, 208, "分岐（スタブ）を作らない", "middle", 10, GRN, True),
    RECT(40, 240, 780, 58, 8, ASOFT, ALI, 1.4),
    T(430, 262, "DDR は「規格書より IC メーカのデザインガイド」である", "middle", 11.5, INK, True),
    T(430, 284, "層構成・線幅・間隔・等長の許容値・終端の値と位置まで具体的に指定されている。外れる理由がないならそのとおりに引く", "middle", 9.5, MUT),
], "全 64 本を等長にすると膨大なサーペンタインで基板が埋まる。バイトごとに独立して調整される")

F["p16_clock"] = SVG(860, 300, [
    T(430, 26, "クロックと水晶 — 基板上で最も強いノイズ源", "middle", 12.5, INK, True),
    RECT(40, 52, 400, 168, 10, SCR, LIN, 1.3),
    T(240, 76, "クロック配線", "middle", 11, INK, True),
] + [
    T(66, 106 + i * 24, t, "start", 9.5, c) for i, (t, c) in enumerate([
        ("最短で引く", MUT), ("基準面の真上を通す。層をまたがない", MUT),
        ("他の信号から離す（5W 以上）", MUT),
        ("直列終端抵抗を送信ピンの隣に", SIG),
        ("必要以上に速いエッジを使わない", ALI),
    ])
] + [
    RECT(460, 52, 370, 168, 10, SSOFT, SIG, 1.4),
    T(645, 76, "水晶振動子の周り", "middle", 11, SIG, True),
    PART(560, 106, 70, 44, "IC", INK, PAN),
    PART(680, 114, 50, 28, "X1", SIG, SSOFT),
    W(630, 122, 680, 122, c=SIG, lw=2.4), W(630, 136, 680, 136, c=SIG, lw=2.4),
    RECT(540, 96, 210, 66, 2, "none", GRN, 1.6, "4 3"),
    T(645, 176, "IC の直近・配線最短・周囲を GND で囲む", "middle", 9.5, GRN, True),
    T(645, 196, "配線の下に他の信号を通さない", "middle", 9.5, ALI, True),
    RECT(40, 240, 790, 46, 8, ASOFT, ALI, 1.4),
    T(430, 262, "汎用 I/O・LED 駆動・リセット・低速シリアルを最速設定で駆動する理由は 1 つもない", "middle", 11, INK, True),
    T(430, 280, "出荷直前に EMC で困る前に、設計時にドライブ強度を落としておく（19 章）", "middle", 10, MUT),
], "負荷容量は水晶の仕様どおりに。基板の浮遊容量も込みで計算する")

F["p16_docs"] = SVG(860, 290, [
    T(430, 26, "規格書とデザインガイドの読み方", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 44, 812, 38, 6, fill, c, 1.2),
    T(230, 76 + i * 44, name, "middle", 10.5, c, True),
    T(560, 76 + i * 44, what, "middle", 9.5, MUT),
    T(790, 76 + i * 44, pri, "end", 10, c, True),
] for i, (name, what, pri, c, fill) in enumerate([
    ("IC メーカのハードウェア設計ガイド", "層構成・線幅・等長・部品配置が具体的に書いてある", "最優先", GRN, PAN),
    ("IC メーカのリファレンスデザイン", "実際に動いた基板のデータ（ガーバーまで公開されることも）", "非常に有用", SIG, SSOFT),
    ("規格団体の仕様書", "電気的な要求、コンプライアンス試験の条件", "判断の根拠", LIN, PAN),
    ("コネクタメーカの資料", "フットプリント、基板側の推奨形状", "忘れがち", ALI, ASOFT),
])], []) + [
    RECT(24, 236, 812, 48, 8, SSOFT, SIG, 1.4),
    T(430, 258, "「動いているリファレンスデザインを真似る」は正当な設計手法である", "middle", 11.5, INK, True),
    T(430, 276, "ただし、そのまま流用してよいのは条件が同じ場合だけ。なぜその引き方なのかを理解して翻訳する", "middle", 10, MUT),
], "層数・板厚・周辺部品が違えば、同じ引き方が最適とは限らない")

# ===================== 17. アナログと混載 =====================

F["p17_scale"] = SVG(860, 290, [
    T(430, 26, "アナログが守るのは「電圧の絶対値」である", "middle", 12.5, INK, True),
    T(240, 60, "系", "middle", 10.5, MUT, True),
    T(560, 60, "1 LSB（最小分解能）", "middle", 10.5, MUT, True),
    W(40, 70, 820, 70, c=LIN, lw=1),
] + sum([[
    RECT(40, 80 + i * 38, 780, 32, 6, fill, c, 1.2),
    T(240, 101 + i * 38, name, "middle", 10.5, INK, True),
    T(560, 101 + i * 38, lsb, "middle", 12, c, True),
] for i, (name, lsb, c, fill) in enumerate([
    ("12 bit ADC、フルスケール 3.3 V", "0.81 mV", MUT, SCR),
    ("16 bit ADC、フルスケール 3.3 V", "50 µV", SIG, PAN),
    ("24 bit ADC、フルスケール 5 V", "0.3 µV", ALI, ASOFT),
])], []) + [
    RECT(40, 208, 780, 68, 8, ASOFT, ALI, 1.4),
    T(430, 230, "0.3 µV とは、幅 0.2 mm・長さ 10 mm の 1 oz 配線（25 mΩ）に 12 µA が流れただけで生じる電圧である", "middle", 10.5, INK, True),
    T(430, 254, "アナログでは「GND」が電位ではなく、場所の名前になる", "middle", 11.5, ALI, True),
    T(430, 272, "どの点を基準とするかを決めて、そこからの電位差を管理する", "middle", 10, MUT),
], "基板上の 2 点の GND の間には必ず何らかの電圧がある。デジタルなら誤差の内だが、24 bit には 10 万 LSB を超える誤差である")

F["p17_zone"] = SVG(860, 310, [
    T(430, 26, "領域を決める — 銅は切らず、線を引くだけ", "middle", 12.5, INK, True),
    RECT(60, 52, 740, 176, 10, SCR, LIN, 1.3),
    RECT(90, 76, 680, 128, 0, PAN, LIN, 1.2),
    W(320, 76, 320, 204, c=MUT, lw=1.4, dash="5 4"),
    W(560, 76, 560, 204, c=MUT, lw=1.4, dash="5 4"),
    T(205, 96, "アナログ領域", "middle", 10.5, GRN, True),
    T(440, 96, "デジタル領域", "middle", 10.5, SIG, True),
    T(665, 96, "電源領域", "middle", 10.5, ALI, True),
    PART(130, 120, 50, 34, "AMP", GRN, SCR), PART(210, 120, 40, 30, "REF", GRN, SCR),
    PART(288, 124, 60, 46, "ADC", INK, SSOFT),
    PART(390, 120, 70, 50, "MCU", SIG, SCR), PART(480, 128, 44, 34, "MEM", SIG, SCR),
    PART(600, 120, 60, 44, "DC-DC", ALI, ASOFT), PART(690, 128, 44, 32, "L", ALI, ASOFT),
    T(430, 220, "グラウンド面は 1 枚のまま（切らない）", "middle", 10, MUT, True),
    ARR(230, 182, 150, 182, GRN, 1.4), ARR(400, 182, 480, 182, SIG, 1.4),
    T(430, 244, "ADC はアナログ領域の、デジタル側の端に置く", "middle", 10.5, INK, True),
    RECT(60, 258, 740, 44, 8, SSOFT, SIG, 1.4),
    T(430, 284, "各回路のリターン電流はそれぞれの領域の真下を流れる → 銅を切らなくても自然に分離される", "middle", 11, INK, True),
], "領域をまたぐ信号は、決められた 1 か所を通す。それだけで分離は完成している（08 章）")

F["p17_adc"] = SVG(860, 300, [
    T(430, 26, "ADC の周り — 最も失敗しやすい場所", "middle", 12.5, INK, True),
    RECT(40, 52, 400, 178, 10, SCR, LIN, 1.3),
    W(240, 62, 240, 220, c=MUT, lw=1.2, dash="4 4"),
    T(140, 80, "アナログ側", "middle", 9.5, GRN, True),
    T(345, 80, "デジタル側", "middle", 9.5, SIG, True),
    PART(196, 108, 88, 70, "ADC", INK, SSOFT),
] + [
    W(196, 122 + i * 20, 170, 122 + i * 20, c=GRN, lw=2.4) for i in range(3)
] + [
    W(284, 122 + i * 20, 310, 122 + i * 20, c=SIG, lw=2.4) for i in range(3)
] + [
    PART(120, 116, 44, 32, "BUF", GRN, SCR),
    PART(320, 124, 50, 34, "MCU", SIG, SCR),
    T(240, 202, "アナログピンがアナログ側を向くように回転させる", "middle", 9.5, INK, True),
    RECT(460, 52, 370, 178, 10, SSOFT, SIG, 1.4),
    T(645, 76, "基準電圧（リファレンス）", "middle", 11, SIG, True),
] + [
    T(486, 106 + i * 24, t, "start", 9.5, c) for i, (t, c) in enumerate([
        ("ADC のすぐ隣に置く", MUT),
        ("短く、太く。他の信号から離す", MUT),
        ("デカップリングは ADC のピンの直近", SIG),
        ("リターンを他の電流と共用しない", SIG),
        ("発熱源から離す（温度係数を持つ）", ALI),
    ])
] + [
    T(645, 214, "基準が 0.1 % ずれれば、測定値も 0.1 % ずれる", "middle", 9.5, ALI, True),
    RECT(40, 246, 790, 46, 8, ASOFT, ALI, 1.4),
    T(430, 266, "AGND / DGND ピンの扱いは、必ずデータシートの推奨に従う", "middle", 11.5, INK, True),
    T(430, 284, "「昔こうだった」で決めるのが最悪である。どちらの流儀の IC かを確認するのが設計者の仕事", "middle", 10, MUT),
], "現代の多くの ADC は「両方とも 1 枚の GND 面に落とせ」と明記している")

F["p17_guard"] = SVG(860, 324, [
    T(430, 26, "ガードリング — 同電位で囲むと漏れ電流が止まる", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 194, 10, ASOFT, ALI, 1.4),
    T(225, 76, "×  GND で囲む", "middle", 11, ALI, True),
    RECT(150, 106, 150, 76, 2, "none", MUT, 3),
    CIRC(225, 144, 12, SIG, 1.6, SSOFT),
    ARR(213, 144, 162, 144, ALI, 1.3), ARR(237, 144, 288, 144, ALI, 1.3),
    T(225, 210, "電位差があるので漏れ電流が流れる", "middle", 9.5, ALI, True),
    T(225, 232, "（ただし静電シールドにはなる）", "middle", 9, MUT),
    RECT(450, 52, 370, 194, 10, SCR, GRN, 1.4),
    T(635, 76, "○  同電位（バッファ出力）で囲む", "middle", 11, GRN, True),
    RECT(560, 106, 150, 76, 2, "none", GRN, 3),
    CIRC(635, 144, 12, SIG, 1.6, SSOFT),
    PART(602, 190, 66, 22, "×1 BUF", GRN, SCR),
    W(635, 190, 635, 182, c=GRN, lw=1.6),
    T(635, 232, "電圧がかからない → 漏れ電流ゼロ", "middle", 9.5, GRN, True),
    RECT(40, 262, 780, 54, 8, SSOFT, SIG, 1.4),
    T(430, 284, "表面の絶縁抵抗は、湿気や汚れで 10¹² Ω 程度まで落ちる", "middle", 11.5, INK, True),
    T(430, 304, "pA 級を扱うなら、表裏両面にガードリングを設ける（表面漏れは裏面でも起きる）", "middle", 10, MUT),
], "目的で使い分ける: 漏れ電流の遮断ならノードと同電位、静電シールドなら GND")

F["p17_smps"] = SVG(860, 310, [
    T(430, 26, "スイッチング電源との共存 — 小さくするものと近づけるもの", "middle", 12.5, INK, True),
    RECT(40, 52, 780, 168, 10, SCR, LIN, 1.3),
    # 回路
    PART(120, 116, 44, 36, "Cin", SIG, SSOFT),
    PART(220, 108, 70, 52, "SW", INK, PAN),
    PART(360, 116, 50, 34, "L", GRN, PAN),
    PART(470, 116, 44, 36, "Cout", SIG, SSOFT),
    W(164, 122, 220, 122, c=SIG, lw=3),
    W(290, 128, 360, 128, c=ALI, lw=5),
    W(410, 128, 470, 128, c=SIG, lw=3),
    W(120, 176, 514, 176, c=MUT, lw=3),
    W(142, 152, 142, 176, c=MUT, lw=3), W(255, 160, 255, 176, c=MUT, lw=3),
    LOOP([(142, 122), (255, 122), (255, 176), (142, 176)], ALI, 2.2, "4 3"),
    T(198, 96, "入力ループ ← 最小にする", "middle", 10, ALI, True),
    T(325, 152, "SW ノード", "middle", 9.5, ALI, True),
    T(325, 170, "← 面積を最小に", "middle", 9, ALI),
    T(660, 100, "小さくするもの: SW ノードの面積", "start", 10, ALI, True),
    T(660, 124, "近づけるもの: 入力コンデンサとスイッチ", "start", 10, SIG, True),
    T(660, 152, "SW ノードはベタで囲まない", "start", 9.5, MUT),
    T(660, 170, "（容量結合で GND にノイズが乗る）", "start", 9, FNT),
    T(660, 194, "インダクタの磁束の向きにも配慮", "start", 9.5, MUT),
    RECT(40, 234, 780, 62, 8, SSOFT, SIG, 1.4),
    T(430, 256, "対策の優先順位", "middle", 11.5, INK, True),
    T(430, 276, "① 物理的に離す（最も効果的で最も安い） ② 入力ループ最小化 ③ SW ノード最小化", "middle", 10, MUT),
    T(430, 292, "④ 出力に LC フィルタ、アナログ用に LDO ⑤ 間に GND ビアの列", "middle", 10, MUT),
], "ノイズは入力ループで生まれる。出力側にはインダクタがあるので電流は連続的にしか変わらない")

F["p17_flow"] = SVG(860, 318, [
    T(430, 26, "混載基板の設計手順", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("① 信号を分類する（高速/低速/電源/アナログ小信号/基準）", None, LIN, PAN),
        ("② 領域を紙の上で決める（配置の前に）", None, SIG, SSOFT),
        ("③ 境界をまたぐ信号を数え、通す場所を 1 か所に決める", None, SIG, SSOFT),
        ("④ 配置（07 章の順序）", None, LIN, PAN),
        ("⑤ アナログ領域を先に配線する", "本数が少なく要求が厳しいものを先に", GRN, PAN),
        ("⑥ デジタルを配線 → ベタは 1 枚のまま流してスティッチング", None, LIN, PAN),
    ], 620, 34, 5)[0],
    T(430, 306, "デジタルを先に引くと、残った隙間にアナログを押し込むことになる", "middle", 10.5, ALI, True),
], "最後に見直す: アナログ配線の下に、デジタルのリターンが流れていないか")

# ===================== 18. 熱設計 =====================

F["p18_analogy"] = SVG(860, 260, [
    T(430, 26, "熱の流れは、電流の流れと同じ形の式で書ける", "middle", 12.5, INK, True),
    T(280, 62, "電気", "middle", 11.5, SIG, True),
    T(600, 62, "熱", "middle", 11.5, ALI, True),
    W(40, 72, 820, 72, c=LIN, lw=1),
] + sum([[
    RECT(40, 82 + i * 34, 780, 28, 5, fill, LIN, 1),
    T(280, 101 + i * 34, e, "middle", 10.5, SIG, True),
    T(600, 101 + i * 34, h, "middle", 10.5, ALI, True),
] for i, (e, h, fill) in enumerate([
    ("電流 I [A]", "熱流 P [W]", SCR),
    ("電圧 V [V]", "温度差 ΔT [℃]", PAN),
    ("抵抗 R [Ω]", "熱抵抗 θ [℃/W]", SCR),
    ("V = I R", "ΔT = P θ", PAN),
])], []) + [
    RECT(40, 226, 780, 26, 5, SSOFT, SIG, 1.3),
    T(430, 244, "直列は足し算、並列は逆数の和 —— この 1 つの道具で熱設計の見積りはほぼ全部できる", "middle", 11, INK, True),
], "θ_直列 = θ₁ + θ₂ + …、1/θ_並列 = 1/θ₁ + 1/θ₂ + …")

F["p18_path"] = SVG(860, 290, [
    T(430, 26, "ジャンクションから空気まで、熱抵抗の直列回路として書く", "middle", 12.5, INK, True),
    flowright(24, 96, [("ジャンクション", "チップ表面", ALI, ASOFT),
                       ("ケース（サーマルパッド）", "θ_JC ← 部品固有", SIG, SSOFT),
                       ("はんだ接合部", "θ_CB", LIN, PAN),
                       ("基板の銅 ＋ ビア", "設計者の領分", GRN, PAN),
                       ("周囲の空気", "θ_BA", LIN, PAN)], 157, 66, 12)[0],
    RECT(24, 190, 812, 94, 8, ASOFT, ALI, 1.4),
    T(430, 212, "データシートの θ_JA をそのまま信じてはいけない", "middle", 11.5, INK, True),
    T(430, 234, "θ_JA は JEDEC の標準試験基板（4 層・76×114 mm・自然対流など）で測った値である", "middle", 10, MUT),
    T(430, 254, "2 層・サーマルビアなし・銅面積が小さい基板では、実際は 2〜3 倍悪い", "middle", 10, ALI),
    T(430, 274, "θ_JA は部品の性質ではなく、部品と基板の組み合わせの性質である", "middle", 10.5, ALI, True),
], "見積りには θ_JC（これは部品固有）から出発して、基板側を自分で積むほうが確実である")

F["p18_area"] = SVG(860, 300, [
    T(430, 26, "銅の面積と熱抵抗 — 効果は飽和する", "middle", 12.5, INK, True),
    T(220, 62, "銅の面積（片面・1 oz・自然対流）", "middle", 10.5, MUT, True),
    T(640, 62, "熱抵抗の目安", "middle", 10.5, MUT, True),
    W(40, 72, 820, 72, c=LIN, lw=1),
] + sum([[
    RECT(40, 82 + i * 36, 780, 30, 5, fill, LIN, 1),
    T(220, 102 + i * 36, a, "middle", 10.5, INK, True),
    RECT(430, 88 + i * 36, 260 * th / 110, 18, 3, SSOFT, SIG, 1.1),
    T(710, 102 + i * 36, "約 %d ℃/W" % th, "start", 10.5, SIG, True),
] for i, (a, th, fill) in enumerate([
    ("100 mm²（10×10 mm）", 110, SCR), ("400 mm²（20×20 mm）", 60, PAN),
    ("1000 mm²（32×32 mm）", 40, SCR), ("2500 mm²（50×50 mm）", 30, PAN),
])], []) + [
    RECT(40, 236, 380, 54, 8, ASOFT, ALI, 1.4),
    T(230, 258, "面積 10 倍で熱抵抗は 1/3 弱", "middle", 10.5, INK, True),
    T(230, 278, "1 oz で有効なのは熱源から半径 15〜25 mm", "middle", 9.5, MUT),
    RECT(440, 236, 380, 54, 8, SCR, GRN, 1.4),
    T(630, 258, "両面使えば、ほぼ 2 倍効く", "middle", 10.5, INK, True),
    T(630, 278, "サーマルビアが十分にあることが条件", "middle", 9.5, GRN, True),
], "代表値である。空気の流れ・基板の向き・周囲の部品で大きく変わる")

F["p18_via"] = SVG(860, 362, [
    T(430, 26, "サーマルビア — 1 本では役に立たない", "middle", 12.5, INK, True),
    BOX(230, 48, 400, 46, "θ_via = L / (λ_Cu · π D t) ≈ 170 ℃/W",
        None, ALI, ASOFT, INK, 8, 1.5, 12.5, 9, None, True),
    T(430, 110, "板厚 1.6 mm・φ0.3 mm・めっき 25 µm の場合（銅の熱伝導率 400 W/(m·K)）", "middle", 9.5, MUT),
    T(230, 142, "本数", "middle", 10.5, MUT, True),
    T(560, 142, "合成熱抵抗（並列）", "middle", 10.5, MUT, True),
    W(40, 152, 820, 152, c=LIN, lw=1),
] + sum([[
    RECT(40, 162 + i * 26, 780, 22, 4, fill, LIN, 1),
    T(230, 178 + i * 26, "%d 本" % n, "middle", 10.5, INK, True),
    RECT(400, 165 + i * 26, 240 * th / 170, 16, 3, ASOFT if th > 40 else SSOFT, ALI if th > 40 else SIG, 1),
    T(660, 178 + i * 26, "%.0f ℃/W" % th, "start", 10.5, ALI if th > 40 else SIG, True),
] for i, (n, th, fill) in enumerate([
    (1, 170, SCR), (4, 42, PAN), (9, 19, SCR), (16, 11, PAN), (25, 6.8, SCR),
])], []) + [
    RECT(40, 300, 780, 54, 8, SSOFT, SIG, 1.4),
    T(430, 322, "9 本以上でようやく意味のある値になる。ピッチ 1.0〜1.2 mm でパッドに収まるだけ並べる", "middle", 11, INK, True),
    T(430, 342, "必ず樹脂で埋めるか裏からレジストで塞ぐ —— 埋めないとはんだが流れ落ちて接合部に空隙ができる", "middle", 10, ALI, True),
], "放熱のために開けたビアが放熱を悪化させる、という皮肉が実際に起きる（06・12 章）")

F["p18_calc"] = SVG(860, 320, [
    T(430, 26, "見積りの実例 — 3 W の QFN レギュレータ", "middle", 12.5, INK, True),
    T(430, 50, "θ_JC = 2 ℃/W、周囲温度 60 ℃、ジャンクション上限 125 ℃", "middle", 10, MUT),
    T(240, 82, "区間", "middle", 10.5, MUT, True),
    T(560, 82, "熱抵抗", "middle", 10.5, MUT, True),
    W(40, 92, 820, 92, c=LIN, lw=1),
] + sum([[
    T(240, 118 + i * 26, name, "middle", 10, INK, True),
    RECT(400, 104 + i * 26, 260 * v / 44, 18, 3, SSOFT, SIG, 1),
    T(690, 118 + i * 26, "%.0f ℃/W" % v, "start", 10.5, SIG, True),
] for i, (name, v) in enumerate([
    ("θ_JC（データシート）", 2), ("はんだ接合", 1),
    ("サーマルビア 16 本", 11), ("裏面銅 400 mm² 両面", 30),
])], []) + [
    W(40, 216, 820, 216, c=LIN, lw=1),
    T(240, 240, "合計", "middle", 11, INK, True),
    T(690, 240, "44 ℃/W", "start", 12, ALI, True),
    RECT(40, 256, 780, 56, 8, ASOFT, ALI, 1.4),
    T(430, 278, "ΔT = 3 W × 44 ℃/W = 132 ℃ → T_J = 60 + 132 = 192 ℃", "middle", 11.5, INK, True),
    T(430, 300, "上限 125 ℃ を大幅に超過 —— この設計は成立しない", "middle", 11, ALI, True),
], "この計算は 5 分で終わる。配置の段階でやれば、機構との調整が間に合う")

F["p18_practice"] = SVG(860, 290, [
    T(430, 26, "対策の効き方と、その他の作法", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 208, 52, 196, 88, 10, fill, c, 1.3),
    T(122 + i * 208, 78, name, "middle", 11, c, True),
    T(122 + i * 208, 104, eff, "middle", 12, INK, True),
    T(122 + i * 208, 126, note, "middle", 9, MUT),
] for i, (name, eff, note, c, fill) in enumerate([
    ("風を当てる", "最も効く", "0.5 m/s で熱抵抗が半分以下", GRN, PAN),
    ("ヒートシンク", "数 ℃/W まで", "取付穴とスペースが要る", SIG, SSOFT),
    ("銅面積を増やす", "飽和する", "半径 15〜25 mm まで", SIG, SSOFT),
    ("発熱を減らす", "根本対策", "効率の良い IC、スイッチング化", ALI, ASOFT),
])], []) + [
    RECT(24, 156, 812, 30, 5, SCR, LIN, 1.1),
    T(430, 176, "発熱部品を分散する ／ 熱に弱い部品を離す ／ 銅の橋を切らない（熱も遮る）", "middle", 10.5, MUT),
    RECT(24, 196, 812, 78, 8, ASOFT, ALI, 1.4),
    T(430, 220, "電解コンデンサの寿命は「10 ℃ 2 倍則」で効く", "middle", 11.5, INK, True),
    T(430, 242, "周囲温度が 10 ℃ 下がるごとに寿命がおよそ 2 倍。105 ℃ 品を 85 ℃ で使えば約 4 倍", "middle", 10, MUT),
    T(430, 264, "レギュレータの隣に置くか 20 mm 離すかで、製品寿命が数倍変わる —— 配置だけで得られる利益である", "middle", 10, ALI),
], "温度センサの位置も、最も熱い場所か制御したい場所か、目的を決めて置く")

# ===================== 19. EMC のためのアートワーク =====================

F["p19_two"] = SVG(860, 320, [
    T(430, 26, "基板は 2 種類のアンテナを持つ", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 180, 10, SSOFT, SIG, 1.4),
    T(225, 76, "DM 放射（ループ）", "middle", 11.5, SIG, True),
    LOOP([(140, 106), (310, 106), (310, 146), (140, 146)], SIG, 2.2, None, 0),
    T(225, 168, "E ≈ 1.3×10⁻¹⁴ · f² A I / r", "middle", 11, INK, True),
    T(225, 192, "周波数の 2 乗・面積に比例", "middle", 9.5, MUT),
    T(225, 214, "設計者にできるのは面積を減らすこと", "middle", 9.5, SIG, True),
    RECT(450, 52, 370, 180, 10, ASOFT, ALI, 1.4),
    T(635, 76, "CM 放射（ケーブル）", "middle", 11.5, ALI, True),
    RECT(500, 108, 90, 44, 2, PAN, INK, 1.3),
    W(590, 130, 780, 130, c=ALI, lw=3),
    ARR(620, 118, 700, 118, ALI, 1.4), ARR(700, 142, 620, 142, ALI, 1.4),
    T(545, 132, "基板", "middle", 9, MUT),
    T(690, 160, "ケーブル", "middle", 9, ALI),
    T(635, 184, "E ≈ 1.26×10⁻⁶ · f L I_CM / r", "middle", 11, INK, True),
    T(635, 208, "電流 × 長さ × 周波数に比例", "middle", 9.5, MUT),
    RECT(40, 246, 780, 66, 8, ASOFT, ALI, 1.4),
    T(430, 268, "3 m・100 MHz で 40 dBµV/m に達する条件", "middle", 11.5, INK, True),
    T(430, 288, "DM: ループ 1 cm² なら電流 23 mA ／ CM: ケーブル 1 m なら電流 2.4 µA", "middle", 10.5, MUT),
    T(430, 306, "CM は DM の 1 万分の 1 の電流で、同じだけ放射する", "middle", 10.5, ALI, True),
], "基板内の信号電流は mA、ケーブルに漏れる CM は µA —— 桁の差はちょうど打ち消し合う")

F["p19_cm"] = SVG(860, 290, [
    T(430, 26, "CM 電流は、設計の不備の副産物である", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 34, 812, 28, 5, fill, c, 1.2),
    T(250, 71 + i * 34, src, "middle", 10.5, INK, True),
    T(620, 71 + i * 34, what, "middle", 9.5, MUT),
    T(810, 71 + i * 34, ch, "end", 9.5, c, True),
] for i, (src, what, ch, c, fill) in enumerate([
    ("リターンパスの断絶", "迂回で生じた電位差がケーブルに乗る", "08 章", ALI, ASOFT),
    ("層をまたぐビアにリターンビアがない", "帰り道を探して面上を広がる", "12 章", ALI, ASOFT),
    ("グラウンドの電位差", "基板の端と端が違う電位。ケーブルが駆動される", "13・14 章", SIG, SSOFT),
    ("差動ペアのスキュー", "DM が CM に変換される", "11 章", SIG, SSOFT),
    ("電源面の共振", "面全体が同相で揺れる", "14 章", LIN, PAN),
])], []) + [
    RECT(24, 234, 812, 50, 8, SSOFT, SIG, 1.4),
    T(430, 256, "一言でまとめると: CM 電流は「帰り道が悪い」ことの現れである", "middle", 11.5, INK, True),
    T(430, 276, "だから EMC 対策の中心はフィルタでも金属箱でもなく、08・12・13 章の内容そのものである", "middle", 10, MUT),
], "ここまでの原則を守っていれば、EMC はおおむね通る。この章はその確認である")

F["p19_loops"] = SVG(860, 300, [
    T(430, 26, "放射源になるループ — 優先順位", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 172, 10, fill, c, 1.4),
    T(155 + i * 278, 76, "%d. %s" % (i + 1, name), "middle", 11, c, True),
    LOOP([(70 + i * 278, 100), (240 + i * 278, 100), (240 + i * 278, 142), (70 + i * 278, 142)],
         c, 2.2, None, 0),
    T(155 + i * 278, 168, d1, "middle", 9.5, MUT),
    T(155 + i * 278, 186, d2, "middle", 9.5, MUT),
    T(155 + i * 278, 208, prio, "middle", 10, c, True),
] for i, (name, d1, d2, prio, c, fill) in enumerate([
    ("スイッチング電源の入力", "Cin → ハイサイド → ローサイド → GND", "数 A・立ち上がり数 ns", "最優先", ALI, ASOFT),
    ("デカップリング", "電源ピン → C → GND ピン", "14 章のとおり", "次点", SIG, SSOFT),
    ("信号のループ", "信号線 → 受け側 → 基準面", "基準面が連続なら自動的に最小", "08 章で決着済み", GRN, PAN),
])], []) + [
    RECT(24, 240, 812, 50, 8, ASOFT, ALI, 1.4),
    T(430, 262, "出力側のループは、入力側ほど重要ではない", "middle", 11.5, INK, True),
    T(430, 280, "出力にはインダクタがあり、電流は連続的にしか変わらない。激しい di/dt は入力側だけである", "middle", 10, MUT),
], "初心者は出力コンデンサの位置を気にしがちだが、見るべきは入力コンデンサである")

F["p19_cable"] = SVG(860, 310, [
    T(430, 26, "ケーブルとコネクタ — 出口を管理する", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 176, 10, ASOFT, ALI, 1.4),
    T(225, 76, "×  コネクタが分散している", "middle", 11, ALI, True),
    RECT(80, 100, 290, 100, 0, PAN, LIN, 1.2),
    PART(74, 110, 16, 34, None, ALI, ASOFT), PART(360, 156, 16, 34, None, ALI, ASOFT),
    W(74, 127, 40, 127, c=ALI, lw=3), W(376, 173, 404, 173, c=ALI, lw=3),
    T(225, 218, "基板全体がダイポールの給電点になる", "middle", 9.5, ALI, True),
    RECT(450, 52, 370, 176, 10, SCR, GRN, 1.4),
    T(635, 76, "○  1 か所にまとめる", "middle", 11, GRN, True),
    RECT(490, 100, 290, 100, 0, PAN, LIN, 1.2),
    PART(484, 116, 16, 30, None, GRN, PAN), PART(484, 152, 16, 30, None, GRN, PAN),
    W(484, 131, 452, 131, c=GRN, lw=3), W(484, 167, 452, 167, c=GRN, lw=3),
    RECT(516, 100, 10, 100, 0, GRN, GRN, 0),
] + [
    CIRC(540, 112 + i * 25, 5, GRN, 1.2, PAN) for i in range(4)
] + [
    T(635, 218, "GND を強化し、フィルタの前後を離す", "middle", 9.5, GRN, True),
    RECT(40, 242, 780, 62, 8, ASOFT, ALI, 1.4),
    T(430, 264, "フィルタの前後を隣接させない", "middle", 11.5, INK, True),
    T(430, 284, "どれだけ良いフィルタでも、入力側と出力側が数 mm で並走すれば空間結合で飛び越えられる", "middle", 10, MUT),
    T(430, 300, "フィルタの GND は、基板の GND ではなくコネクタの GND に直接落とす", "middle", 10, SIG),
], "完璧な基板でも、ケーブル 1 本が CM 電流を運べばそれが効率の良いアンテナになる")

F["p19_spectrum"] = SVG(860, 300, [
    T(430, 26, "立ち上がりを必要以上に速くしない", "middle", 12.5, INK, True),
    AXES(90, 200, 480, 130, "周波数（対数）", "レベル"),
    PL([(90, 90), (230, 90)], SIG, 2.4),
    PL([(230, 90), (390, 128)], SIG, 2.4),
    PL([(390, 128), (556, 196)], SIG, 2.4),
    W(230, 200, 230, 84, c=LIN, lw=1, dash="4 3"),
    W(390, 200, 390, 122, c=ALI, lw=1.4, dash="4 3"),
    T(230, 216, "f₁ = 1/(πτ)", "middle", 9.5, MUT),
    T(390, 216, "f₂ = 1/(π t_r)", "middle", 9.5, ALI, True),
    T(300, 100, "−20 dB/dec", "middle", 9, FNT),
    T(480, 150, "−40 dB/dec", "middle", 9, FNT),
    T(660, 96, "t_r を 2 倍にすれば", "start", 10.5, INK, True),
    T(660, 118, "f₂ は半分になり、", "start", 10.5, MUT),
    T(660, 140, "その上の放射は 6 dB 減る", "start", 10.5, ALI, True),
] + sum([[
    RECT(24 + i * 208, 232, 196, 56, 8, fill, c, 1.3),
    T(122 + i * 208, 254, name, "middle", 10.5, c, True),
    T(122 + i * 208, 275, note, "middle", 9, MUT),
] for i, (name, note, c, fill) in enumerate([
    ("ドライブ強度を下げる", "設定を変えるだけ。タダ", GRN, PAN),
    ("直列抵抗 22〜33 Ω", "部品 1 個。反射対策も兼ねる", SIG, SSOFT),
    ("クロック周波数を下げる", "機能に影響", LIN, PAN),
    ("スペクトラム拡散（SSC）", "ピークを分散。規格が許す場合", LIN, PAN),
])], []), "タイミングに余裕があるなら、エッジは遅いほうが良い")

F["p19_check"] = SVG(860, 352, [
    T(430, 26, "アートワーク段階の EMC チェック", "middle", 12.5, INK, True),
] + sum([[
    T(56, 60 + i * 22, "□", "start", 11, SIG, True),
    T(78, 60 + i * 22, t, "start", 10, MUT),
    T(820, 60 + i * 22, ch, "end", 9, FNT),
] for i, (t, ch) in enumerate([
    ("基準面が連続しているか。スリットを横切る信号はないか", "08 章"),
    ("層を移る高速信号にリターンビアが添えられているか", "12 章"),
    ("スイッチング電源の入力ループが最小か", "本章"),
    ("デカップリングが電源ピンの直近にあるか", "14 章"),
    ("クロックが最短・基準面の上・他の信号から離れているか", "16 章"),
    ("コネクタが 1 か所にまとまっているか", "本章"),
    ("コネクタ周りの GND が強化され、フィルタの前後が離れているか", "本章"),
    ("基板端にビアフェンスがあるか", "13 章"),
    ("表層ベタがスティッチングされ、浮いた銅がないか", "13 章"),
    ("不要に速いエッジを使っていないか", "本章"),
    ("細長い導体（λ/4 になる長さ）を作っていないか", "13 章"),
])], []) + [
    RECT(40, 300, 780, 44, 8, SSOFT, SIG, 1.4),
    T(430, 328, "この 11 項目のうち 9 つは、08・12・13・14 章の再確認である", "middle", 11, INK, True),
], "EMC のための特別な工夫は、本来はほとんど要らない。原則を守ることがそのまま対策になる")

# ===================== 20. DFM =====================

F["p20_drc_dfm"] = SVG(860, 280, [
    T(430, 26, "DRC と DFM の違い", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 168, 10, SSOFT, SIG, 1.4),
    T(225, 76, "DRC（設計ルールチェック）", "middle", 11.5, SIG, True),
] + [
    T(70, 106 + i * 24, t, "start", 9.5, MUT) for i, t in enumerate([
        "決めたルールに対する違反を検出",
        "ルールを決めるのは設計者",
        "通れば「決めたルールは守れている」",
    ])
] + [
    T(225, 192, "ルールに入れていない項目は見ない", "middle", 10, ALI, True),
    RECT(450, 52, 370, 168, 10, SCR, GRN, 1.4),
    T(635, 76, "DFM（製造性チェック）", "middle", 11.5, GRN, True),
] + [
    T(480, 106 + i * 24, t, "start", 9.5, MUT) for i, t in enumerate([
        "作りやすさ・歩留まりの観点で検出",
        "製造側の知見に基づく",
        "通れば「量産で問題が出にくい」",
    ])
] + [
    T(635, 192, "ツールによって項目がまちまち", "middle", 10, MUT),
    RECT(40, 234, 780, 34, 8, ASOFT, ALI, 1.3),
    T(430, 256, "DRC が通ったことは、作れることを意味しない", "middle", 11.5, INK, True),
], "この章で扱うのは、DRC が見ていない典型的な項目である")

F["p20_copper"] = SVG(860, 320, [
    T(430, 26, "銅パターンの DFM", "middle", 12.5, INK, True),
    T(180, 58, "項目", "middle", 10, MUT, True),
    T(460, 58, "何が問題か", "middle", 10, MUT, True),
    T(720, 58, "対策", "middle", 10, MUT, True),
    W(24, 68, 836, 68, c=LIN, lw=1),
] + sum([[
    RECT(24, 76 + i * 34, 812, 29, 5, fill, LIN, 1),
    T(180, 95 + i * 34, name, "middle", 10, INK, True),
    T(460, 95 + i * 34, bad, "middle", 9.5, ALI),
    T(720, 95 + i * 34, fix, "middle", 9.5, GRN),
] for i, (name, bad, fix, fill) in enumerate([
    ("アシッドトラップ（鋭角の入り隅）", "液が滞留して削られすぎる", "内角を 45° 以上に", SCR),
    ("細い首（ネック）", "電流・熱・リターンが破綻", "流したあと目視・ネックチェック", PAN),
    ("孤立した銅", "浮いた導体がアンテナになる", "孤立領域の自動削除", SCR),
    ("スリバー（極細の銅片）", "剥がれて他所で短絡させる", "最小幅ルール・形を単純に", PAN),
    ("銅残り率の偏り", "収縮差で基板が反る", "ダミーパターン・上下対称", SCR),
    ("基板端の銅", "ルータで削られてバリ・剥離", "端から 0.3 mm 以上（V カット 0.5）", PAN),
])], []) + [
    RECT(24, 288, 812, 26, 5, ASOFT, ALI, 1.3),
    T(430, 306, "反った基板は実装機が平面として扱えず、BGA の一部だけが浮く不良を起こす", "middle", 10.5, INK, True),
], "銅残り率は 30〜70 % に収め、層間の差を 20 % 以内に。CAD に表示機能があることが多い")

F["p20_drill"] = SVG(860, 290, [
    T(430, 26, "穴とビアの DFM", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 30, 812, 25, 4, fill, LIN, 1),
    T(300, 69 + i * 30, name, "middle", 10, INK, True),
    T(660, 69 + i * 30, val, "middle", 10, SIG, True),
] for i, (name, val, fill) in enumerate([
    ("アスペクト比（板厚 / ドリル径）", "8:1 以下", SCR),
    ("ドリル径の種類", "5〜8 種類以内に減らす", PAN),
    ("同じ穴径をライブラリで統一", "ビアは 1 種類、部品穴は 2〜3 種類", SCR),
    ("穴どうしの距離", "壁 0.3 mm 以上（中心間で径の 2 倍以上）", PAN),
    ("ビアとパッドの距離", "0.2 mm 以上、またはテンティング", SCR),
    ("穴と基板端の距離", "0.5 mm 以上", PAN),
])], []) + [
    RECT(24, 240, 812, 44, 8, SSOFT, SIG, 1.4),
    T(430, 262, "ドリル径を統一するだけで、価格と納期が改善する", "middle", 11.5, INK, True),
    T(430, 280, "「ドリル径の種類数」が見積り項目に入っているメーカもある。機能上の必要がないなら統一する", "middle", 10, MUT),
], "ライブラリを寄せ集めると、φ0.8・φ0.85・φ0.82 が混在する。これは減らせる")

F["p20_silk"] = SVG(860, 290, [
    T(430, 26, "レジスト・シルクの DFM", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 32, 812, 27, 4, fill, c, 1.1),
    T(300, 70 + i * 32, name, "middle", 10, INK, True),
    T(600, 70 + i * 32, val, "middle", 10, c, True),
    T(800, 70 + i * 32, bad, "end", 9, MUT),
] for i, (name, val, bad, c, fill) in enumerate([
    ("レジスト開口とパッドの隙間", "片側 0.05 mm", "開口がパッドを覆う", SIG, SCR),
    ("パッド間のレジスト土手", "0.1 mm 以上", "印刷できず消える", SIG, PAN),
    ("シルクとパッドの重なり", "禁止", "はんだが濡れない", ALI, ASOFT),
    ("シルクの線幅 / 文字高", "0.15 mm / 0.8 mm 以上", "潰れて読めない", SIG, SCR),
    ("シルクとレジスト開口の隙間", "0.1 mm 以上", "インクが開口にはみ出す", SIG, PAN),
])], []) + [
    RECT(24, 226, 812, 54, 8, ASOFT, ALI, 1.4),
    T(430, 248, "シルクとパッドの重なりは、CAD が自動で逃がす場合とそのまま出す場合がある", "middle", 11.5, INK, True),
    T(430, 268, "出図データで必ず確認する（22 章）", "middle", 10.5, MUT),
], "0.4 mm ピッチ BGA のようにパッド間隔が 0.2 mm しかない場合、土手は物理的に作れない")

F["p20_comm"] = SVG(860, 350, [
    T(430, 26, "メーカからの問い合わせと、事前に潰す方法", "middle", 12.5, INK, True),
    T(280, 58, "問い合わせの内容", "middle", 10, MUT, True),
    T(660, 58, "事前に潰す方法", "middle", 10, MUT, True),
    W(24, 68, 836, 68, c=LIN, lw=1),
] + sum([[
    RECT(24, 76 + i * 28, 812, 24, 4, fill, LIN, 1),
    T(280, 92 + i * 28, q, "middle", 9.5, ALI),
    T(660, 92 + i * 28, a, "middle", 9.5, GRN, True),
] for i, (q, a, fill) in enumerate([
    ("「この線幅は当社の最小を下回ります」", "製造仕様書を最初に見る（04 章）", SCR),
    ("「アニュラリングが不足しています」", "公差を積み上げる（04 章）", PAN),
    ("「ドリル径 φ0.15 は対応できません」", "最小穴径を確認", SCR),
    ("「基板端に銅があります」", "クリアランスルールに入れる", PAN),
    ("「レジスト土手が 0.08 mm です」", "フットプリント設計時に確認（06 章）", SCR),
    ("「層構成の指定が当社標準にありません」", "標準構成から選ぶ（05 章）", PAN),
    ("「銅残り率が層間で大きく違います」", "ダミーパターンを入れる", SCR),
])], []) + [
    RECT(24, 284, 812, 44, 8, SSOFT, SIG, 1.4),
    T(430, 311, "1 往復で 1〜2 日、時差があれば 2〜3 日。3 往復すれば 1 週間が消える", "middle", 11, INK, True),
    T(430, 344, "着手前に「この層構成・線幅・穴径で作れますか」と聞く 10 分が、1 週間を救う", "middle", 11, SIG, True),
], "試作で作れたから量産でも作れる、は成り立たない。量産メーカの仕様で再チェックする")

# ===================== 21. 実装性と検査性 =====================

F["p21_flow"] = SVG(860, 244, [
    T(430, 26, "表面実装（SMT）の工程と、アートワークが効くところ", "middle", 12.5, INK, True),
    flowright(24, 96, [("はんだペースト印刷", "ステンシル開口", SIG, SSOFT),
                       ("部品搭載（マウンタ）", "部品間隔・基準マーク", GRN, PAN),
                       ("リフロー", "ランドの熱容量バランス", ALI, ASOFT),
                       ("検査（AOI・ICT）", "テストポイント", GRN, PAN),
                       ("後付け・手はんだ", "サーマルリリーフ", LIN, PAN)], 157, 76, 12)[0],
    RECT(24, 166, 812, 62, 8, SSOFT, SIG, 1.4),
    T(430, 190, "基板を「作れる」だけでなく、部品が載り、良否が判定でき、直せるものにする", "middle", 11.5, INK, True),
    T(430, 212, "リフローという熱の工程で何が起きるかを理解すれば、アートワークで防げる不良が見えてくる", "middle", 10, MUT),
], "スルーホール部品は、SMT のあとに手はんだかフローはんだで後付けする")

F["p21_stencil"] = SVG(860, 300, [
    T(430, 26, "メタルマスク（ステンシル）と面積比", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 158, 10, SCR, LIN, 1.3),
    T(225, 76, "断面", "middle", 10.5, MUT, True),
    RECT(80, 150, 290, 14, 0, PAN, LIN, 1.1),
    RECT(80, 118, 100, 32, 0, MUT, MUT, 0),
    RECT(230, 118, 140, 32, 0, MUT, MUT, 0),
    RECT(180, 118, 50, 32, 0, SSOFT, SIG, 1.2),
    RECT(180, 150, 50, 12, 0, SIG, SIG, 0),
    T(205, 108, "開口", "middle", 9, SIG, True),
    T(120, 138, "ステンシル", "middle", 9, SCR, True),
    T(225, 182, "側壁にペーストが残ると転写されない", "middle", 9.5, ALI, True),
    RECT(450, 52, 370, 158, 10, SSOFT, SIG, 1.4),
    T(635, 78, "面積比 = LW / (2(L+W)t)", "middle", 12.5, INK, True),
    T(635, 104, "0.66 以上でないと転写不良", "middle", 11, ALI, True),
    T(635, 140, "例: 0.3 × 0.8 mm、厚 0.12 mm → 0.91（可）", "middle", 9.5, MUT),
    T(635, 160, "厚 0.15 mm にすると 0.73", "middle", 9.5, MUT),
    T(635, 180, "0.25 × 0.6 mm なら 0.59 → 転写不良", "middle", 9.5, ALI, True),
    RECT(40, 226, 780, 62, 8, SCR, LIN, 1.3),
    T(430, 248, "調整すべき場面", "middle", 11, INK, True),
    T(430, 268, "QFN のサーマルパッド → 格子状に分割、開口率 50〜70 %（06 章）", "middle", 10, MUT),
    T(430, 284, "細ピッチ QFP → 開口をやや小さく ／ 背の高い部品と混在 → 段付きステンシル", "middle", 10, MUT),
], "標準は板厚 0.1〜0.15 mm、開口はパッドと 1:1。細ピッチ部品があるなら実装業者と相談する")

F["p21_reflow"] = SVG(860, 300, [
    T(430, 26, "リフローの温度プロファイル", "middle", 12.5, INK, True),
    AXES(80, 210, 540, 140, "時間", "温度"),
    PL([(80, 210), (170, 150), (280, 132), (360, 118), (420, 78), (470, 78), (520, 130), (620, 200)], SIG, 2.6),
    W(80, 132, 620, 132, c=LIN, lw=1, dash="4 3"),
    T(72, 136, "150 ℃", "end", 9, FNT),
    W(80, 96, 620, 96, c=ALI, lw=1, dash="4 3"),
    T(72, 100, "217 ℃（融点）", "end", 9, ALI),
    T(125, 178, "予熱", "middle", 9.5, MUT), T(320, 156, "均熱（ソーク）", "middle", 9.5, MUT),
    T(445, 66, "リフロー", "middle", 9.5, ALI, True), T(570, 172, "冷却", "middle", 9.5, MUT),
    RECT(650, 60, 190, 148, 8, SSOFT, SIG, 1.3),
    T(745, 84, "均熱区間があるのは", "middle", 10, INK, True),
    T(745, 104, "基板内の温度差を", "middle", 10, INK, True),
    T(745, 124, "ならすためである", "middle", 10, INK, True),
    T(745, 156, "差が大きすぎれば", "middle", 9.5, ALI),
    T(745, 174, "ならしきれない", "middle", 9.5, ALI, True),
    RECT(40, 240, 780, 46, 8, ASOFT, ALI, 1.4),
    T(430, 262, "アートワークの仕事は、この温度差を作らないことである", "middle", 11.5, INK, True),
    T(430, 280, "大きな銅面につながったパッドは温まりにくく、小さなパッドはすぐ温まる（13 章）", "middle", 10, MUT),
], "鉛フリーはんだの融点は 217 ℃。ピークは 230〜245 ℃、30〜60 s 保持が典型的である")

F["p21_tomb"] = SVG(860, 300, [
    T(430, 26, "トゥームストーン — 片側だけ先に溶けて部品が立つ", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 156, 10, ASOFT, ALI, 1.4),
    T(225, 76, "左右の熱容量が違う", "middle", 11, ALI, True),
    RECT(90, 148, 60, 14, 1, SIG, SIG, 0),
    RECT(250, 148, 60, 14, 1, SIG, SIG, 0),
    RECT(300, 140, 90, 30, 0, SIG, SIG, 0),
    '<polygon points="150,148 178,104 196,110 168,152" fill="%s" stroke="%s" stroke-width="1.3"/>' % (PAN, INK),
    T(120, 178, "細い接続", "middle", 9, MUT), T(320, 186, "ベタ直結", "middle", 9, ALI, True),
    T(225, 200, "溶けた側の表面張力で部品が引き起こされる", "middle", 9.5, ALI, True),
    RECT(450, 52, 370, 156, 10, SCR, GRN, 1.4),
    T(635, 76, "熱容量を揃える", "middle", 11, GRN, True),
    RECT(500, 148, 60, 14, 1, SIG, SIG, 0),
    RECT(660, 148, 60, 14, 1, SIG, SIG, 0),
    RECT(560, 140, 100, 26, 2, PAN, INK, 1.3),
    W(500, 155, 470, 155, c=SIG, lw=2), W(720, 155, 750, 155, c=SIG, lw=2),
    T(635, 190, "両側とも同じ細さでベタにつなぐ", "middle", 9.5, GRN, True),
    RECT(40, 226, 780, 62, 8, SSOFT, SIG, 1.4),
    T(430, 248, "アートワーク側の対策", "middle", 11.5, INK, True),
    T(430, 268, "両側をサーマルリリーフに揃える ／ 配線幅を揃える ／ ランドを大きくしすぎない", "middle", 10, MUT),
    T(430, 284, "部品の向きを揃える（07 章） ／ ステンシル開口を対称に", "middle", 10, MUT),
], "1005（0603 メトリック）以下の小さなチップ部品で起きやすい")

F["p21_mounter"] = SVG(860, 300, [
    T(430, 26, "マウンタ（実装機）のための配慮", "middle", 12.5, INK, True),
    RECT(40, 52, 370, 168, 10, SCR, LIN, 1.3),
    RECT(70, 78, 310, 116, 0, PAN, LIN, 1.2),
    RECT(70, 78, 310, 22, 0, ASOFT, ALI, 1),
    RECT(70, 172, 310, 22, 0, ASOFT, ALI, 1),
    T(225, 93, "搬送レール領域（部品禁止 3〜5 mm）", "middle", 8.5, ALI, True),
    T(225, 187, "搬送レール領域", "middle", 8.5, ALI, True),
    CIRC(100, 116, 7, SIG, 1.6, SSOFT), CIRC(350, 156, 7, SIG, 1.6, SSOFT),
    T(100, 138, "◎", "middle", 10, SIG, True), T(350, 178, "◎", "middle", 10, SIG, True),
    PART(160, 120, 40, 24, None, INK, SCR), PART(220, 120, 40, 24, None, INK, SCR),
    PART(280, 120, 40, 24, None, INK, SCR),
    T(225, 210, "基準マーク（フィデューシャル）は対角に", "middle", 9.5, SIG, True),
] + sum([[
    RECT(450, 52 + i * 30, 370, 26, 4, fill, LIN, 1),
    T(560, 69 + i * 30, name, "middle", 9.5, INK, True),
    T(760, 69 + i * 30, val, "middle", 9.5, SIG, True),
] for i, (name, val, fill) in enumerate([
    ("基準マーク", "基板に 2〜3 個", SCR),
    ("マークの寸法", "φ1 mm 銅＋φ3 mm 開口", PAN),
    ("搬送レール領域", "両端 3〜5 mm 部品禁止", SCR),
    ("部品間隔", "0.5 mm 以上", PAN),
    ("部品の向き", "揃える", SCR),
    ("極性表示", "シルクで明確に", PAN),
])], []) + [
    RECT(450, 234, 370, 44, 8, ASOFT, ALI, 1.3),
    T(635, 254, "基準マークがないと、実装機が", "middle", 10, INK, True),
    T(635, 272, "そもそも基板を認識できない", "middle", 10.5, ALI, True),
    T(225, 268, "面付けするならパネルに 3 個、各基板に 2 個", "middle", 10, MUT),
], "面付けは業者が行うこともある。基板側の 2 個は必ず自分で入れる")

F["p21_test"] = SVG(860, 300, [
    T(430, 26, "検査性（DFT）— 検査の種類と必要なもの", "middle", 12.5, INK, True),
    T(180, 58, "検査", "middle", 10, MUT, True),
    T(430, 58, "中身", "middle", 10, MUT, True),
    T(690, 58, "アートワークで必要なこと", "middle", 10, MUT, True),
    W(24, 68, 836, 68, c=LIN, lw=1),
] + sum([[
    RECT(24, 76 + i * 32, 812, 27, 4, fill, LIN, 1),
    T(180, 94 + i * 32, name, "middle", 10, INK, True),
    T(430, 94 + i * 32, what, "middle", 9.5, MUT),
    T(690, 94 + i * 32, need, "middle", 9.5, SIG, True),
] for i, (name, what, need, fill) in enumerate([
    ("AOI（自動光学検査）", "カメラで外観を見る", "部品が隠れない配置・読めるシルク", SCR),
    ("X 線検査", "BGA の下を透視", "裏面に重なる部品を避ける", PAN),
    ("ICT（インサーキット）", "針を当てて回路を測る", "テストポイント", SCR),
    ("フライングプローブ", "針を動かして測る", "テストポイント（少数ロット向き）", PAN),
    ("ファンクションテスト", "動作させる", "コネクタ・テスト用端子", SCR),
])], []) + [
    RECT(24, 244, 400, 44, 8, SSOFT, SIG, 1.3),
    T(224, 264, "テストポイント: φ0.9〜1.0 mm", "middle", 10, INK, True),
    T(224, 282, "ピッチ 2.54 mm 以上・片面に集約", "middle", 10, SIG, True),
    RECT(436, 244, 400, 44, 8, ASOFT, ALI, 1.3),
    T(636, 264, "ビア兼用は安いが、テンティングすると使えない", "middle", 9.5, INK, True),
    T(636, 282, "量産なら専用テストポイントが確実。業者と早期に決める", "middle", 9.5, MUT),
], "基板端から 3 mm 以上、部品から 1 mm 以上離す。両面治具は高価なので片面に集約する")

# ===================== 22. 出図データ =====================

F["p22_files"] = SVG(860, 290, [
    T(430, 26, "出図は 3 つの相手に向けたデータに分かれる", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 168, 10, fill, c, 1.4),
    T(155 + i * 278, 78, who, "middle", 11.5, c, True),
] + [
    T(155 + i * 278, 108 + j * 22, it, "middle", 9.5, MUT) for j, it in enumerate(items)
] for i, (who, items, c, fill) in enumerate([
    ("基板メーカ", ["ガーバー（または IPC-2581 / ODB++）", "ドリルデータ", "外形データ", "仕様書（材料・層構成・処理）"], SIG, SSOFT),
    ("実装業者", ["BOM（部品表）", "マウントデータ（座標）", "メタルマスクデータ", "実装指示図（極性・向き）"], GRN, PAN),
    ("自社・将来の自分", ["回路図", "CAD データ", "変更履歴", "設計判断の記録"], LIN, PAN),
])], []) + [
    RECT(24, 234, 812, 46, 8, ASOFT, ALI, 1.4),
    T(430, 256, "3 つ目を軽視しないこと", "middle", 11.5, INK, True),
    T(430, 274, "半年後に修正するのは自分である。「なぜその層構成か」まで残す（20 章）", "middle", 10, MUT),
], "最も間抜けで最も多い事故は「渡し忘れ」と「取り違え」である")

F["p22_layers"] = SVG(860, 336, [
    T(430, 26, "ガーバーの層 — 1 ファイルが 1 層に対応する", "middle", 12.5, INK, True),
    T(230, 58, "ファイル", "middle", 10, MUT, True),
    T(560, 58, "内容", "middle", 10, MUT, True),
    T(790, 58, "拡張子の例", "middle", 10, MUT, True),
    W(24, 68, 836, 68, c=LIN, lw=1),
] + sum([[
    RECT(24, 76 + i * 28, 812, 24, 4, fill, LIN, 1),
    T(230, 92 + i * 28, name, "middle", 9.5, INK, True),
    T(560, 92 + i * 28, what, "middle", 9.5, c),
    T(790, 92 + i * 28, ext, "middle", 9.5, FNT),
] for i, (name, what, ext, c, fill) in enumerate([
    ("外層（表）の銅", "L1 のパターン", ".gtl", MUT, SCR),
    ("外層（裏）の銅", "最終層のパターン", ".gbl", MUT, PAN),
    ("内層の銅", "L2、L3、…", ".g2l / .gbr", MUT, SCR),
    ("レジスト（表・裏）", "開口部 ＝ 銅を露出させる場所", ".gts / .gbs", ALI, ASOFT),
    ("シルク（表・裏）", "印刷する図柄", ".gto / .gbo", MUT, SCR),
    ("ペースト（表・裏）", "メタルマスクの開口", ".gtp / .gbp", MUT, PAN),
    ("外形", "基板の輪郭", ".gko / .gml", MUT, SCR),
])], []) + [
    RECT(24, 282, 812, 46, 8, ASOFT, ALI, 1.4),
    T(430, 304, "レジストのデータは「塗るところ」ではなく「開けるところ」である", "middle", 11.5, INK, True),
    T(430, 322, "確認の仕方: パッドの位置に図形があれば正しい。それ以外が塗りつぶされていたら反転している", "middle", 10, MUT),
], "現在の標準は RS-274X（拡張ガーバー）。Gerber X2 は層の属性情報も持てる")

F["p22_drill"] = SVG(860, 280, [
    T(430, 26, "ドリルデータ（Excellon）の確認項目", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 32, 812, 27, 4, fill, c, 1.1),
    T(240, 70 + i * 32, name, "middle", 10, INK, True),
    T(620, 70 + i * 32, what, "middle", 9.5, c),
] for i, (name, what, c, fill) in enumerate([
    ("単位と桁数", "mm か inch か。3.3 形式などの指定", SIG, SCR),
    ("ゼロサプレス", "先頭省略 / 後方省略 / なし。間違えると 10 倍ずれる", ALI, ASOFT),
    ("めっきあり / なし", "PTH と NPTH は別ファイルにする", ALI, ASOFT),
    ("穴径", "仕上がり径かドリル径か（03 章）", SIG, PAN),
    ("座標原点", "ガーバーと同じ原点か", SIG, SCR),
])], []) + [
    RECT(24, 224, 812, 48, 8, SSOFT, SIG, 1.4),
    T(430, 246, "取り付け穴（ネジ穴）は、ふつうめっきなし（NPTH）である", "middle", 11.5, INK, True),
    T(430, 264, "めっきありにすると、ネジやスペーサと接触して意図しない GND 接続が起きる。どちらかを明示する", "middle", 10, MUT),
], "ビューアで穴が基板の外に固まって見えたら、単位設定かゼロサプレスの食い違いである")

F["p22_spec"] = SVG(860, 320, [
    T(430, 26, "仕様書 — ガーバーに書けないことを伝える", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + (i % 2) * 414, 52 + (i // 2) * 28, 398, 24, 4, SCR if i % 4 < 2 else PAN, LIN, 1),
    T(120 + (i % 2) * 414, 68 + (i // 2) * 28, name, "start", 9.5, INK, True),
    T(410 + (i % 2) * 414, 68 + (i // 2) * 28, val, "end", 9.5, MUT),
] for i, (name, val) in enumerate([
    ("板厚", "1.6 mm ±10 %"), ("層数", "4 層"),
    ("材料", "FR-4、Tg 150 以上"), ("層構成", "各層の銅厚と誘電体厚"),
    ("銅厚", "外層 1 oz（仕上がり）/ 内層 1 oz"), ("ソルダーレジスト", "色（緑）、両面"),
    ("シルク", "色（白）、両面"), ("表面処理", "ENIG（金厚 0.05 µm 以上）"),
    ("インピーダンス制御", "有無・対象ネット・目標値と公差"), ("外形加工", "ルータ / V カット"),
    ("面付け", "有無・寸法・捨て板"), ("検査", "電気検査（全数）、外観"),
    ("規格", "IPC-A-600 クラス 2 など"), ("特記", "ビア埋め、バックドリル、UL 認定材"),
])], []) + [
    RECT(24, 258, 812, 54, 8, ASOFT, ALI, 1.4),
    T(430, 280, "層の対応表は必ず付ける", "middle", 11.5, INK, True),
    T(430, 300, "「.g2l が L2 です」がないとメーカは推測するしかない。8 層で順番を取り違えると動かない基板が届く", "middle", 10, MUT),
], "図付きの層構成図（層番号・ファイル名・銅厚・誘電体厚）を 1 枚作る。10 分でできて事故を確実に防ぐ")

F["p22_bom"] = SVG(860, 290, [
    T(430, 26, "BOM（部品表）に必要な列", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 26, 812, 22, 4, fill, c, 1.1),
    T(200, 67 + i * 26, name, "middle", 9.5, INK, True),
    T(520, 67 + i * 26, what, "middle", 9.5, MUT),
    T(790, 67 + i * 26, note, "end", 9.5, c, True),
] for i, (name, what, note, c, fill) in enumerate([
    ("参照記号（R1, C2, U3…）", "基板上の位置と対応", "抜けがないか", MUT, SCR),
    ("値", "10 kΩ、100 nF、…", "—", MUT, PAN),
    ("フットプリント", "1608、SOP-8、…", "CAD と一致しているか", SIG, SCR),
    ("メーカ名・型番", "完全な型番", "部分型番は誤発注のもと", ALI, ASOFT),
    ("数量", "1 枚あたり", "—", MUT, SCR),
    ("実装するか", "実装 / 未実装（DNP）", "明記しないと載る", ALI, ASOFT),
    ("代替品", "可否と型番", "供給の問題への備え", SIG, SCR),
])], []) + [
    RECT(24, 246, 812, 40, 8, SSOFT, SIG, 1.4),
    T(430, 262, "温度特性（X7R / C0G）・耐圧・精度が効く部品では、業者が選んだ品で特性が変わる", "middle", 10.5, INK, True),
    T(430, 280, "効くところは完全型番、効かないところは仕様指定、と使い分ける", "middle", 10, MUT),
], "マウントデータには参照記号・X・Y・回転角・面。極性は実装図（PDF）でも伝える")

F["p22_check"] = SVG(860, 352, [
    T(430, 26, "出図前 — 必ず別のガーバービューアで開く", "middle", 12.5, INK, True),
] + sum([[
    T(56, 60 + i * 22, "□", "start", 11, SIG, True),
    T(78, 60 + i * 22, t, "start", 9.5, c),
] for i, (t, c) in enumerate([
    ("すべての層が出力されているか（銅 ＋ レジスト 2 ＋ シルク 2 ＋ ペースト 2 ＋ 外形）", MUT),
    ("層の対応が合っているか（L2 と L3 が入れ替わっていないか）", ALI),
    ("裏面が鏡像になっていないか（正しくは表から見た向き）", ALI),
    ("レジスト開口がパッドの位置にあるか", MUT),
    ("シルクがパッドに乗っていないか", ALI),
    ("ドリルとパッドの位置が一致しているか", MUT),
    ("外形の中に全部が収まっているか", MUT),
    ("ドリルの単位・桁数が正しく読めているか", ALI),
    ("ペースト開口が意図どおりか（QFN の分割開口など）", MUT),
    ("面付け・基準マーク・捨て板が含まれているか", MUT),
])], []) + [
    RECT(40, 288, 780, 56, 8, ASOFT, ALI, 1.4),
    T(430, 312, "CAD の画面で正しく見えても、出力で壊れていることがある", "middle", 11.5, INK, True),
    T(430, 332, "そして基板にはリビジョンをシルクで入れる —— 実物を見て版が分からないと、評価データが信用できなくなる", "middle", 10, MUT),
], "試作を数回まわすと、机の上に見分けのつかない基板が並ぶ。それを防ぐのはシルク 1 行である")

# ===================== 23. 特殊な基板とコスト =====================

F["p23_cost"] = SVG(860, 402, [
    T(430, 26, "基板の価格は何で決まるか", "middle", 12.5, INK, True),
    BOX(210, 48, 440, 46, "単価 = 初期費用/枚数 ＋ 面積単価 ＋ 加工の追加費",
        None, SIG, SSOFT, INK, 8, 1.5, 12.5, 9, None, True),
] + sum([[
    T(250, 128 + i * 24, name, "end", 9.5, MUT),
    RECT(266, 118 + i * 24, 300 * w / 100, 16, 3, fill, c, 1),
    T(580, 131 + i * 24, eff, "start", 9.5, c, True),
] for i, (name, w, eff, c, fill) in enumerate([
    ("納期（短納期）", 100, "×1.5〜3 ← 最大の変動要因", ALI, ASOFT),
    ("材料（低損失材）", 90, "×2〜5", ALI, ASOFT),
    ("ブラインド/ベリードビア", 80, "×1.5〜3", ALI, ASOFT),
    ("層数（2→4）", 55, "×1.8", SIG, SSOFT),
    ("最小線幅・間隔のクラス", 40, "+20〜40 %", SIG, SSOFT),
    ("面積", 35, "ほぼ比例", SIG, SSOFT),
    ("銅厚（2 oz）", 20, "+10〜20 %", LIN, PAN),
    ("表面処理（ENIG）", 15, "+10〜20 %", LIN, PAN),
])], []) + [
    RECT(24, 314, 812, 80, 8, SSOFT, SIG, 1.4),
    T(430, 338, "「安くしたい」と言われたときに見る順番", "middle", 11.5, INK, True),
    T(430, 360, "① 納期を延ばせないか　② 面付けの取り数を増やせないか　③ 層数を減らせないか（SI を犠牲にせずに）", "middle", 10, MUT),
    T(430, 380, "④ 面積　⑤ クラス　⑥ 表面処理・材料 —— ①と②で解決することが多い。設計を削るのは最後である", "middle", 10, MUT),
], "見積りは「1 枚あたり」ではなく「ロットあたり」で見る。10 枚と 1000 枚では単価が桁で違う")

F["p23_panel"] = SVG(860, 320, [
    T(430, 26, "面付け（パネライズ）— 取り数が単価を決める", "middle", 12.5, INK, True),
    # パネル図
    RECT(60, 52, 340, 200, 6, SCR, LIN, 1.4),
    RECT(60, 52, 340, 22, 0, ASOFT, ALI, 1),
    RECT(60, 230, 340, 22, 0, ASOFT, ALI, 1),
    T(230, 67, "捨て板（レール）5〜10 mm", "middle", 8.5, ALI, True),
] + [
    RECT(76 + (j % 4) * 82, 84 + (j // 4) * 70, 74, 62, 2, SSOFT, SIG, 1.2) for j in range(8)
] + [
    CIRC(72, 80, 5, SIG, 1.4, SSOFT), CIRC(388, 80, 5, SIG, 1.4, SSOFT), CIRC(72, 224, 5, SIG, 1.4, SSOFT),
    T(230, 268, "パネルに基準マーク 3 個（対角＋1）", "middle", 9.5, MUT),
    RECT(440, 52, 390, 200, 10, SCR, LIN, 1.3),
    T(635, 78, "取り数の例", "middle", 11, INK, True),
    T(635, 104, "100 × 80 mm の基板 / 250 × 330 mm のパネル", "middle", 9.5, MUT),
    T(560, 138, "そのまま", "middle", 10.5, MUT, True), T(740, 138, "2 × 4 = 8 枚", "middle", 11, MUT, True),
    T(560, 168, "90° 回して", "middle", 10.5, GRN, True), T(740, 168, "3 × 3 = 9 枚（＋12 %）", "middle", 11, GRN, True),
    T(635, 208, "基板の寸法を数 mm 詰めるだけで", "middle", 10, INK, True),
    T(635, 228, "1 列増えることがある", "middle", 10.5, SIG, True),
    RECT(60, 282, 770, 30, 8, SSOFT, SIG, 1.3),
    T(445, 302, "「あと 3 mm 縮められないか」は、コスト会議で本当に効く質問である", "middle", 11, INK, True),
], "分割は V カット（直線のみ・隙間 0）かミシン目タブ（任意形状・隙間 2 mm 程度）")

F["p23_hdi"] = SVG(860, 300, [
    T(430, 26, "HDI — レーザで開けるマイクロビア", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 150, 10, fill, c, 1.3),
    T(155 + i * 278, 76, name, "middle", 11, c, True),
    RECT(56 + i * 278, 96, 198, 76, 0, PAN, LIN, 1.1),
] + [
    COPPER(56 + i * 278, 96 + j * 25, 198, 4, MUT) for j in range(4)
] + vias + [
    T(155 + i * 278, 190, note, "middle", 9.5, MUT),
] for i, (name, vias, note, c, fill) in enumerate([
    ("1+N+1", [RECT(140, 96, 5, 29, 0, SIG, SIG, 0), RECT(152, 96, 5, 29, 0, SIG, SIG, 0),
               RECT(180, 121, 5, 29, 0, SIG, SIG, 0), RECT(192, 121, 5, 29, 0, SIG, SIG, 0)],
     "コアの上下にビルドアップ 1 層ずつ", SIG, SSOFT),
    ("2+N+2（スタックド）", [RECT(418, 96, 5, 29, 0, SIG, SIG, 0), RECT(430, 96, 5, 29, 0, SIG, SIG, 0),
                       RECT(418, 121, 5, 29, 0, SIG, SIG, 0), RECT(430, 121, 5, 29, 0, SIG, SIG, 0)],
     "マイクロビアを縦に積める", SIG, SSOFT),
    ("エニーレイヤ", [RECT(640 + j * 34, 96 + (j % 3) * 25, 5, 29, 0, SIG, SIG, 0) for j in range(4)],
     "全層がビルドアップ。任意の層間をつなげる", ALI, ASOFT),
])], []) + [
    RECT(24, 216, 812, 70, 8, ASOFT, ALI, 1.4),
    T(430, 238, "HDI は高い。まず回避を検討する", "middle", 11.5, INK, True),
    T(430, 258, "① 層数を増やして貫通ビアで脱出できないか　② BGA のピン配置を変えられないか", "middle", 10, MUT),
    T(430, 276, "③ ピッチの大きいパッケージを選べないか —— 本当に必要なのは極限の小型化か 1000 ピン級である", "middle", 10, MUT),
], "マイクロビアは φ0.075〜0.15 mm、レーザで 1 層ぶんだけ開ける。スタガード（ずらす）ほうが信頼性は高い")

F["p23_flex"] = SVG(860, 300, [
    T(430, 26, "フレキシブル基板の設計ルール", "middle", 12.5, INK, True),
    RECT(40, 52, 340, 150, 10, SCR, LIN, 1.3),
    '<path d="M 70 160 L 170 160 A 46 46 0 0 1 216 114 L 216 76" fill="none" stroke="%s" stroke-width="10"/>' % SSOFT,
    '<path d="M 70 160 L 170 160 A 46 46 0 0 1 216 114 L 216 76" fill="none" stroke="%s" stroke-width="1.4"/>' % SIG,
    DIM(170, 172, 216, 172, "R", ALI, 9.5, 0, ALI),
    T(300, 120, "曲げ半径", "middle", 10, INK, True),
    T(300, 142, "静的: 厚みの 10 倍以上", "middle", 9.5, MUT),
    T(300, 162, "動的: 100 倍以上", "middle", 9.5, ALI, True),
    T(210, 190, "曲げ部に部品・ビアを置かない", "middle", 9.5, ALI, True),
] + sum([[
    RECT(410, 52 + i * 26, 420, 22, 4, SCR if i % 2 == 0 else PAN, LIN, 1),
    T(560, 67 + i * 26, name, "middle", 9.5, INK, True),
    T(810, 67 + i * 26, val, "end", 9.5, SIG, True),
] for i, (name, val) in enumerate([
    ("配線は曲げ方向に対して垂直に横切らせる", "斜め・平行は割れる"),
    ("ベタはハッチングに", "ソリッドの銅は曲がらない"),
    ("配線の角を丸く", "応力集中を避ける"),
    ("カバーレイ（レジストの代わり）", "開口公差 ±0.2 mm"),
    ("補強板（スティフナ）", "コネクタ部の裏に貼る"),
])], []) + [
    RECT(40, 222, 790, 62, 8, SSOFT, SIG, 1.4),
    T(430, 244, "フレキの見積りは「面積」ではなく「材料の取り数」で決まる", "middle", 11.5, INK, True),
    T(430, 266, "細長い形が多く、少しだけ長いために取り数が減ることがある。長さを詰められるか確認する価値がある", "middle", 10, MUT),
], "リジッドフレックスは硬い基板とフレキが一体。コネクタを減らせて信頼性が上がるが高価である")

F["p23_early"] = SVG(860, 280, [
    T(430, 26, "早期に決めるだけで、価格の 8 割が決まる 5 項目", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 166, 54, 154, 96, 10, fill, c, 1.3),
    T(101 + i * 166, 82, name, "middle", 11, c, True),
    T(101 + i * 166, 112, eff, "middle", 12, INK, True),
    T(101 + i * 166, 134, note, "middle", 8.5, MUT),
] for i, (name, eff, note, c, fill) in enumerate([
    ("外形寸法", "面積に比例", "直接効く", SIG, SSOFT),
    ("層数", "2→4 で 1.8 倍", "面積単価", SIG, SSOFT),
    ("クラス", "+0〜40 %", "線幅・穴径", LIN, PAN),
    ("材料", "×1〜5", "低損失材は高い", ALI, ASOFT),
    ("納期", "×1〜3", "最大の変動要因", ALI, ASOFT),
])], []) + [
    RECT(24, 168, 812, 96, 8, SSOFT, SIG, 1.4),
    T(430, 192, "試作の見積りを見て「基板は高い」と判断するのは誤りである", "middle", 11.5, INK, True),
    T(430, 214, "初期費用（版下・面付け・検査治具）が枚数で割られるので、10 枚と 1000 枚では単価が桁で違う", "middle", 10, MUT),
    T(430, 236, "量産の枚数で聞き直す。試作を安くするなら、共通パネルの相乗りサービスという手もある", "middle", 10, MUT),
    T(430, 256, "特殊仕様: 厚銅（3 oz〜）／ メタルコア（IMS）／ キャビティ／ 端面スルーホール／ UL 認定材", "middle", 9.5, FNT),
], "これらを配置や配線が固まる前に決めておくと、あとからの変更がほぼなくなる")

# ===================== 24. レビューとチェックリスト =====================

F["p24_timing"] = SVG(860, 300, [
    T(430, 26, "レビューは 3 回に分ける", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + i * 278, 52, 262, 172, 10, fill, c, 1.4),
    T(155 + i * 278, 76, "%s" % name, "middle", 11.5, c, True),
    T(155 + i * 278, 98, when, "middle", 9.5, MUT),
    W(50 + i * 278, 110, 260 + i * 278, 110, c=LIN, lw=1),
    T(155 + i * 278, 130, "見るもの", "middle", 9, FNT),
] + [
    T(155 + i * 278, 150 + j * 18, s, "middle", 9, MUT) for j, s in enumerate(sees)
] + [
    T(155 + i * 278, 210, "直せるもの: " + fix, "middle", 10, c, True),
] for i, (name, when, sees, fix, c, fill) in enumerate([
    ("① 制約レビュー", "配置の前", ["層構成・外形・機構制約", "ネットの分類", "コスト目標"], "全部", GRN, PAN),
    ("② 配置レビュー", "配線の前", ["部品配置・領域分け", "電流の環・熱", "実装性"], "配置と配線", SIG, SSOFT),
    ("③ 出図レビュー", "出図の前", ["配線・ベタ", "DRC / DFM", "出図データ"], "配線の一部と出図", LIN, PAN),
])], []) + [
    RECT(24, 238, 812, 50, 8, ASOFT, ALI, 1.4),
    T(430, 260, "①と②が本体である。③で大きな指摘が出るのは失敗である", "middle", 11.5, INK, True),
    T(430, 278, "配線を始める前の 30 分のレビューが、数日ぶんの手戻りを防ぐ", "middle", 10, MUT),
], "配線済みの基板を見せられると、人は「もう完成している」と感じて配置への指摘を遠慮してしまう")

F["p24_how"] = SVG(860, 290, [
    T(430, 26, "レビューの進め方", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 28, 812, 24, 4, SCR if i % 2 == 0 else PAN, LIN, 1),
    T(260, 68 + i * 28, name, "middle", 10, INK, True),
    T(620, 68 + i * 28, what, "middle", 9.5, MUT),
] for i, (name, what) in enumerate([
    ("紙のチェックリストを使う", "記憶に頼らない。抜けは必ず起きる"),
    ("設計者以外が見る", "自分の設計の穴は自分では見えない"),
    ("信号を追う", "重要ネットを 1 本ずつ、送信から受信まで指でたどる"),
    ("電流を追う", "「この電流はどこから来て、どこへ帰るか」を口に出す"),
    ("指摘は記録して、対応を残す", "「直した / 直さない（理由）」まで書く"),
    ("時間を区切る", "1 回 1 時間。長いレビューは集中力が切れて見落とす"),
])], []) + [
    RECT(24, 228, 812, 56, 8, SSOFT, SIG, 1.4),
    T(430, 250, "最も効く質問は「この電流はどこを帰りますか」である", "middle", 11.5, INK, True),
    T(430, 272, "答えられなければ、そこが穴である", "middle", 10.5, SIG, True),
], "このクロックのリターンは／このビアの近くにリターンビアは／このコンデンサの GND は何 mm か")

F["p24_map"] = SVG(860, 300, [
    T(430, 26, "総合チェックリストの分野", "middle", 12.5, INK, True),
] + sum([[
    RECT(24 + (i % 4) * 208, 52 + (i // 4) * 88, 196, 78, 10, fill, c, 1.3),
    T(122 + (i % 4) * 208, 76 + (i // 4) * 88, name, "middle", 10.5, c, True),
    T(122 + (i % 4) * 208, 98 + (i // 4) * 88, ch, "middle", 9, FNT),
    T(122 + (i % 4) * 208, 118 + (i // 4) * 88, n, "middle", 10, MUT),
] for i, (name, ch, n, c, fill) in enumerate([
    ("制約", "01・04・05・07・23 章", "6 項目", GRN, PAN),
    ("フットプリント", "06 章", "4 項目", SIG, SSOFT),
    ("配置", "07・14・17〜19・21 章", "9 項目", ALI, ASOFT),
    ("グラウンドと電源", "08・09・12〜14 章", "9 項目", ALI, ASOFT),
    ("配線", "09〜12・15・16 章", "9 項目", SIG, SSOFT),
    ("熱", "18 章", "3 項目", LIN, PAN),
    ("製造・実装", "20・21 章", "7 項目", GRN, PAN),
    ("出図", "22 章", "9 項目", SIG, SSOFT),
])], []) + [
    RECT(24, 240, 812, 46, 8, SSOFT, SIG, 1.4),
    T(430, 262, "自分のプロジェクトに合わせて削り、追加して使うこと", "middle", 11.5, INK, True),
    T(430, 280, "チェックリストは、賢さの代わりではなく、記憶の代わりである", "middle", 10.5, SIG, True),
], "全 56 項目。デモではチェックを付けながら点検できる")

F["p24_top"] = SVG(860, 346, [
    T(430, 26, "よくある失敗の上位", "middle", 12.5, INK, True),
] + sum([[
    RECT(24, 52 + i * 28, 812, 24, 4, fill, c, 1.1),
    T(56, 68 + i * 28, "%d" % (i + 1), "middle", 11, c, True),
    T(300, 68 + i * 28, name, "middle", 10, INK, True),
    T(660, 68 + i * 28, ch, "middle", 9.5, MUT),
] for i, (name, ch, c, fill) in enumerate([
    ("フットプリントの間違い（ピン配置・寸法・1 番ピン）", "06 章", ALI, ASOFT),
    ("グラウンドの分断（分割・ビア列・面の層に配線）", "08 章", ALI, ASOFT),
    ("デカップリングが遠い", "14 章", ALI, ASOFT),
    ("機構との不整合（コネクタ位置・高さ・取付穴）", "01・07 章", ALI, ASOFT),
    ("出図データの不備（層の取り違え・ドリル設定・DNP 未記載）", "22 章", ALI, ASOFT),
    ("熱の見積り漏れ", "18 章", SIG, SSOFT),
    ("基準マーク・テストポイントの欠落", "21 章", SIG, SSOFT),
    ("電圧降下の見落とし", "09 章", SIG, SSOFT),
])], []) + [
    RECT(24, 286, 812, 54, 8, SSOFT, SIG, 1.4),
    T(430, 310, "上位 5 つは、すべて「確認すれば防げる」ものである", "middle", 11.5, INK, True),
    T(430, 332, "データシートを開く、機構図面を確認する、ビューアで見る —— それぞれ 10 分で終わる作業の省略が、基板の作り直しになっている", "middle", 9.5, MUT),
], "難しい理論の話は 1 つもない。だからこそチェックリストが要る")

F["p24_series"] = SVG(860, 400, [
    T(430, 26, "シリーズ全体の地図", "middle", 12.5, INK, True),
    stack(140, 52, 580, [
        ("作れる形に", "DFM・実装性・出図・コスト・レビュー（20〜24 章）", GRN, PAN),
        ("効かせる", "クロストーク・高速 IF・アナログ・熱・EMC（15〜19 章）", GRN, PAN),
        ("配線", "線幅・インピーダンス・差動・ビア・ベタ・電源（09〜14 章）", SIG, SSOFT),
        ("骨格 ← 性能の 8 割", "層構成・フットプリント・配置・グラウンド（05〜08 章）", ALI, ASOFT),
        ("物理と製造 ← すべてのルールの根拠", "銅・樹脂・エッチング・めっき・公差（01〜04 章）", ALI, ASOFT),
    ], 52, 6)[0],
    RECT(60, 352, 740, 38, 8, SSOFT, SIG, 1.4),
    T(430, 376, "電流が通る道と帰る道を、作れて・載せられて・冷える形で描く仕事である", "middle", 11.5, INK, True),
], "下の層ほど普遍で、上の層ほど道具や用途に近い。「つなぐ」ことは回路図がすでに終えている")
