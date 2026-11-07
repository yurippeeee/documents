# -*- coding: utf-8 -*-
"""暗号と誤り訂正編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
import math
import os as _os

F = {}
_CHECK = bool(_os.environ.get("FIGCHECK"))
_OVER = []

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"    # シリーズのアクセント色
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


# ===== 図版 =====

# ===================== 01. 筐体設計とは =====================

# 章ごとの図は fig/fNN.py に置く（このファイルの関数と F をそのまま使える）
import glob as _glob
for _p in sorted(_glob.glob(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "fig", "f*.py"))):
    exec(compile(open(_p, encoding="utf-8").read(), _p, "exec"), globals())
