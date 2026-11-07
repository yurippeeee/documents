# -*- coding: utf-8 -*-
"""組み込みブラックボックステスト編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
import math
import os as _os

F = {}
_CHECK = bool(_os.environ.get("FIGCHECK"))
_OVER = []

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"    # PSA の青緑
ALI = "var(--alias)"     # 警告の赤
GRN = "var(--blue)"      # 第3色（紫）
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

def flowright(x0, cy, items, w=140, bh=48, gap=34, c=LIN, fill=PAN, note=None, sz=12, ssz=10):
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
        o.append(BOX(x, cy - bh / 2, w, bh, t, s, col, fl, INK, 8, 1.4, sz, ssz))
        if i < len(items) - 1:
            o.append(ARR(x + w, cy, x + w + gap - 3, cy, MUT, 1.6))
            if note and i < len(note) and note[i]:
                o.append(T(x + w + gap / 2, cy - bh / 2 - 8, note[i], "middle", 9.5, FNT))
        x += w + gap
    return "".join(o), x - gap

def flowdown(cx, y0, items, w=300, bh=48, gap=30, c=LIN, fill=PAN, note=None, sz=12, ssz=10):
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
        o.append(BOX(cx - w / 2, y, w, bh, t, s, col, fl, INK, 8, 1.4, sz, ssz))
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

# ===================== バイナリ解析 向けヘルパ =====================

def BYTES(x, y, segs, h=28, sz=10, tsz=9):
    o = []; xx = x
    for s in segs:
        lab, w = s[0], s[1]
        c = s[2] if len(s) > 2 and s[2] else LIN
        fl = s[3] if len(s) > 3 and s[3] else PAN
        sub = s[4] if len(s) > 4 else None
        o.append(RECT(xx, y, w, h, 3, fl, c, 1.3))
        o.append(T(xx + w/2, y + h/2 + sz*0.35, lab, "middle", sz, INK, True, True))
        if sub:
            o.append(T(xx + w/2, y + h + 13, sub, "middle", tsz, MUT))
        xx += w
    return "".join(o), xx

def HEXROW(x, y, cells, cw=30, h=24, sz=10):
    """16 進のセル列。cells = [(text, color, fill)]。"""
    o = []; xx = x
    for c in cells:
        t = c[0]; col = c[1] if len(c) > 1 and c[1] else LIN; fl = c[2] if len(c) > 2 and c[2] else PAN
        o.append(RECT(xx, y, cw, h, 2, fl, col, 1.1))
        o.append(T(xx + cw/2, y + h/2 + sz*0.35, t, "middle", sz, INK, False, True))
        xx += cw
    return "".join(o), xx

def CODE(x, y, lines, sz=10.5, c=INK, lh=15):
    o = []
    for i, l in enumerate(lines):
        col = c
        if isinstance(l, tuple):
            if len(l) == 2: l, col = l
            else: l = l[0]
        o.append(T(x, y + i*lh, l, "start", sz, col, False, True))
    return "".join(o)

def STATE(x, y, w, h, label, sub=None, c=SIG, fill=SSOFT, sz=12):
    return BOX(x, y, w, h, label, sub, c, fill, INK, 12, 1.5, sz, 9.5)

def LANES(names, x0, y0, gap, ytop, ybot, sz=11, bw=130):
    o = []; xs = []
    for i, n in enumerate(names):
        xx = x0 + i*gap
        xs.append(xx)
        o.append(BOX(xx - bw/2, y0, bw, 32, n, None, LIN, PAN, INK, 6, 1.3, sz))
        o.append(W(xx, ytop, xx, ybot, c=LIN, lw=1.2, dash="4,4"))
    return "".join(o), xs

def MSG(xs, a, b, y, label, c=MUT, sz=9.5, dash=None, above=True):
    x1, x2 = xs[a], xs[b]
    o = []
    if dash:
        o.append(W(x1, y, x2 - (7 if x2 > x1 else -7), y, c=c, lw=1.4, dash=dash))
        o.append(ARR(x2 - (14 if x2 > x1 else -14), y, x2, y, c, 1.4, 7))
    else:
        o.append(ARR(x1, y, x2, y, c, 1.5, 7))
    o.append(T((x1 + x2)/2, y - 5 if above else y + 13, label, "middle", sz, c))
    return "".join(o)

def BADGE(x, y, text, c=SIG, fill=SSOFT, sz=9.5, w=None):
    ww = w or (sum(2 if ord(ch) > 0x2000 else 1 for ch in text) * sz * 0.6 + 14)
    return RECT(x, y, ww, 18, 9, fill, c, 1.1) + T(x + ww/2, y + 13, text, "middle", sz, c, True)

def MEMMAP(x, y, w, rows, rh=34, sz=10.5):
    """縦積みのメモリマップ。rows = [(addr, label, sub, color, fill)]。上が高位/先頭。"""
    o = []; yy = y
    for r in rows:
        addr, lab = r[0], r[1]
        sub = r[2] if len(r) > 2 else None
        c = r[3] if len(r) > 3 and r[3] else LIN
        fl = r[4] if len(r) > 4 and r[4] else PAN
        o.append(RECT(x, yy, w, rh, 0, fl, c, 1.2))
        o.append(T(x + 12, yy + rh/2 + sz*0.35, lab, "start", sz, INK, True))
        if sub:
            o.append(T(x + w - 12, yy + rh/2 + sz*0.35, sub, "end", sz*0.88, MUT))
        if addr:
            o.append(T(x - 8, yy + rh/2 + sz*0.35, addr, "end", sz*0.85, FNT, False, True))
        yy += rh
    return "".join(o), yy
# ===================== 01. バイナリ解析とは何か =====================


# ===================== 組み込みブラックボックステスト編 =====================

# ---- 01 ----
F["t01_why"] = SVG(860, 300, [
    T(430, 30, "ソースを読めなくても、外から入れて外から測れば検証できる", "middle", 13, INK, True),
    BOX(320, 95, 220, 110, "生成 AI が書いた\nファームウェア", "中身は読めない・信用できない", ALI, ASOFT, INK, 12, 1.6, 13, 10),
    T(120, 90, "刺激（入れる）", "middle", 11.5, SIG, True),
    ARR(120, 110, 315, 120, SIG, 1.7), T(120, 135, "電源・電圧", "middle", 10, MUT),
    ARR(120, 150, 315, 150, SIG, 1.7), T(120, 172, "信号・コマンド", "middle", 10, MUT),
    ARR(120, 195, 315, 180, SIG, 1.7), T(120, 212, "無線パケット", "middle", 10, MUT),
    T(745, 90, "観測（測る）", "middle", 11.5, GRN, True),
    ARR(545, 120, 740, 110, GRN, 1.7), T(745, 135, "消費電流", "middle", 10, MUT),
    ARR(545, 150, 740, 150, GRN, 1.7), T(745, 172, "信号波形", "middle", 10, MUT),
    ARR(545, 180, 740, 195, GRN, 1.7), T(745, 212, "パケット・ログ", "middle", 10, MUT),
    T(430, 265, "この「入れて／測って／期待と照らす」の繰り返しがブラックボックステスト", "middle", 11, FNT),
], cap="図1-1　中身が読めない相手を、入出力だけで検証する。")

F["t01_points"] = SVG(860, 380, [
    T(430, 28, "一つの基板は、外から触れる「観測点・刺激点」の集まり", "middle", 13, INK, True),
    PART(360, 160, 140, 90, "MCU / 基板", INK, PAN, 12),
    # top: power
    BOX(350, 55, 160, 44, "電源・消費電流", "3 章", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    ARR(430, 99, 430, 158, MUT, 1.5),
    # left top: GPIO
    BOX(70, 70, 150, 44, "GPIO・デジタル", "4 章", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    ARR(220, 100, 358, 175, MUT, 1.5),
    # left mid: UART
    BOX(70, 145, 150, 44, "UART コンソール", "5 章", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    ARR(220, 167, 358, 190, MUT, 1.5),
    # left bottom: I2C/SPI
    BOX(70, 220, 150, 44, "I²C・SPI バス", "6 章", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    ARR(220, 242, 358, 220, MUT, 1.5),
    # right top: radio
    BOX(640, 70, 150, 44, "無線 (BLE/Wi-Fi)", "9〜12 章", GRN, PAN, INK, 8, 1.3, 11, 9),
    ARR(640, 100, 502, 175, MUT, 1.5),
    # right mid: analog
    BOX(640, 145, 150, 44, "アナログ入出力", "7 章", GRN, PAN, INK, 8, 1.3, 11, 9),
    ARR(640, 167, 502, 190, MUT, 1.5),
    # right bottom: debug
    BOX(640, 220, 150, 44, "デバッグポート", "8 章（半BB）", GRN, PAN, INK, 8, 1.3, 11, 9),
    ARR(640, 242, 502, 220, MUT, 1.5),
    # bottom: USB
    BOX(350, 300, 160, 44, "USB・有線", "13 章", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    ARR(430, 300, 430, 252, MUT, 1.5),
], cap="図1-2　MCU を取り巻く観測点・刺激点。どこから触れるかで章が分かれる。")

F["t01_pillars"] = SVG(860, 280, [
    T(430, 30, "見える度合いで 3 つ——本編は左端を主役に、中央も道具として使う", "middle", 12.5, INK, True),
    BOX(50, 70, 240, 150, "ブラックボックス", "入出力だけ。中は不明。\n製品に最も近い視点。\n＝本編の主役", ALI, ASOFT, INK, 12, 1.5, 13, 10.5),
    BOX(310, 70, 240, 150, "グレーボックス", "デバッグポートで内部を\n少し覗く（8 章）。\n開発中の観測に強い", GRN, PAN, INK, 12, 1.5, 13, 10.5),
    BOX(570, 70, 240, 150, "ホワイトボックス", "ソース・回路を全部見る。\n＝コードレビューや\n単体テスト。本編の範囲外", LIN, PAN, INK, 12, 1.5, 13, 10.5),
    ARR(290, 240, 810, 240, MUT, 1.4), T(430, 262, "見える情報が増える →（ただし「製品そのもの」からは遠のく）", "middle", 10.5, FNT),
], cap="図1-3　ブラック／グレー／ホワイトの連続体。")

# ---- 02 ----
F["t02_soa"] = SVG(860, 250, [
    T(430, 30, "テストは必ず「刺激 → 観測 → 判定」の形を持つ", "middle", 13, INK, True),
    flowright(120, 130, [
        ("① 刺激", "決まった入力を与える", SIG, SSOFT),
        ("② 観測", "応答を生データで取る", GRN, PAN),
        ("③ 判定", "期待と照らして合否", ALI, ASOFT),
    ], w=190, bh=70, gap=50, sz=13, ssz=10)[0],
    T(430, 215, "「刺激なしの観測」はモニタリング。テストは「こう入れたら、こうなるはず」を含む", "middle", 11, FNT),
], cap="図2-1　仕様の 1 文を、この 3 段 1 テストに落とす。")

F["t02_double"] = SVG(860, 300, [
    T(430, 30, "テストダブル——本物の代わりに置く「意地悪できる」模擬", "middle", 13, INK, True),
    BOX(70, 80, 320, 70, "本物のセンサ", "正しい値しか出せない", LIN, PAN, INK, 10, 1.4, 12, 10),
    BOX(70, 175, 320, 90, "模擬（フェイク）", "NaN・範囲外・応答なし・フリーズを\n自在に作れる ＝ 異常系を試せる", SIG, SSOFT, INK, 10, 1.4, 12, 10),
    ARR(430, 115, 560, 155, MUT, 1.5),
    ARR(430, 220, 560, 175, MUT, 1.5),
    BOX(560, 130, 230, 90, "テスト対象（MCU）", "異常値をどう扱うか？\nクリップ/無視/クラッシュ", INK, PAN, INK, 10, 1.5, 12, 10),
    T(475, 130, "正常系", "middle", 10, MUT), T(475, 205, "異常系", "middle", 10, ALI, True),
], cap="図2-2　模擬相手は本物より「意地悪」ができる点で優れる。")

F["t02_gear"] = SVG(860, 320, [
    T(430, 28, "道具は役割で 4 系統——本編を通して使い分ける", "middle", 13, INK, True),
    BOX(50, 70, 370, 100, "刺激系（入れる）", "偽センサ・信号発生器・DAC・\nプログラマブル電源・自作注入器", SIG, SSOFT, INK, 10, 1.4, 12.5, 10.5),
    BOX(440, 70, 370, 100, "観測系（測る）", "電流計(PPK2)・ロジアナ・オシロ・\nsniffer・プロトコルアナライザ", GRN, PAN, INK, 10, 1.4, 12.5, 10.5),
    BOX(50, 195, 370, 100, "半ブラックボックス", "デバッグプローブ（J-Link/CMSIS-DAP）\nOpenOCD・pyOCD（8 章）", LIN, PAN, INK, 10, 1.4, 12.5, 10.5),
    BOX(440, 195, 370, 100, "司令塔（束ねる）", "PC + Python・pyvisa・sigrok・\npytest（18〜19 章）", INK, PAN, INK, 10, 1.4, 12.5, 10.5),
], cap="図2-3　刺激・観測・半BB・司令塔の 4 系統。")

# ---- 03 ----
F["t03_states"] = SVG(860, 300, [
    T(430, 28, "消費電流の波形は、そのまま「内部状態」の地図になる", "middle", 13, INK, True),
    AXES(90, 240, 700, 170, "時間", "電流"),
    # stepped current profile: sleep - wake - active - tx spike - sleep
    PL([(90,235),(180,235),(180,150),(300,150),(300,110),(430,110),
        (430,60),(470,60),(470,150),(560,150),(560,235),(790,235)], SIG, 2.0),
    T(135, 255, "スリープ", "middle", 10, MUT), T(240, 255, "起動", "middle", 10, MUT),
    T(365, 255, "処理", "middle", 10, MUT), T(450, 45, "無線送信", "middle", 10, ALI, True),
    T(675, 255, "スリープ復帰", "middle", 10, MUT),
    W(180, 235, 180, 145, c=LIN, lw=0.8, dash="3,3"), W(560, 235, 560, 145, c=LIN, lw=0.8, dash="3,3"),
    T(430, 285, "「寝るべきときに寝ているか」——AI 生成コードで最も見落とされる欠陥がここに出る", "middle", 10.5, FNT),
], cap="図3-1　電流プロファイルから状態遷移を読む。")

F["t03_measure"] = SVG(860, 280, [
    T(430, 28, "電流は「小さな抵抗の両端電圧」として測る", "middle", 13, INK, True),
    BOX(90, 110, 130, 70, "電源", "3.3 V", SIG, SSOFT, INK, 8, 1.4, 12, 10),
    W(220, 130, 330, 130, c=INK, lw=1.8),
    RECT(330, 118, 90, 24, 3, ASOFT, ALI, 1.5), T(375, 134, "シャント", "middle", 10, ALI, True),
    W(420, 130, 540, 130, c=INK, lw=1.8),
    BOX(540, 110, 180, 70, "テスト対象", "MCU / 基板", INK, PAN, INK, 8, 1.4, 12, 10),
    W(630, 180, 630, 230, c=INK, lw=1.8), W(90, 180, 90, 230, c=INK, lw=1.8), W(90,230,630,230,c=INK,lw=1.8),
    # voltmeter across shunt
    CIRC(375, 210, 22, GRN, 1.6), T(375, 214, "mV", "middle", 10, GRN, True),
    W(340, 142, 355, 195, c=GRN, lw=1.3), W(410, 142, 395, 195, c=GRN, lw=1.3),
    T(600, 255, "電流 I = 電圧降下 ÷ 抵抗値（オームの法則）", "middle", 11, MUT),
    T(220, 255, "高分解能: PPK2 / Otii", "middle", 10.5, FNT),
], cap="図3-2　シャント抵抗法。専用計（PPK2）は自動でこれを行う。")

# ---- 04 ----
F["t04_two"] = SVG(860, 300, [
    T(430, 28, "ロジアナは「0/1 の意味」、オシロは「電圧の形」を見る", "middle", 13, INK, True),
    BOX(90, 60, 300, 40, "ロジックアナライザ", None, SIG, SSOFT, INK, 8, 1.3, 12),
    W(110, 175, 130, 175, c=SIG, lw=2), W(130,175,130,130,c=SIG,lw=2), W(130,130,200,130,c=SIG,lw=2),
    W(200,130,200,175,c=SIG,lw=2), W(200,175,260,175,c=SIG,lw=2), W(260,175,260,130,c=SIG,lw=2),
    W(260,130,330,130,c=SIG,lw=2), W(330,130,330,175,c=SIG,lw=2), W(330,175,370,175,c=SIG,lw=2),
    T(240, 200, "多チャネル・長時間・デコード向き", "middle", 10, MUT),
    T(240, 218, "「1 か 0 か」だけを速く記録", "middle", 10, FNT),
    BOX(470, 60, 300, 40, "オシロスコープ", None, GRN, PAN, INK, 8, 1.3, 12),
    PL([(490,152),(510,120),(540,180),(570,120),(600,175),(630,125),(660,170),(690,130),(720,150),(750,150)], GRN, 2),
    T(620, 200, "少チャネル・電圧の詳細な形", "middle", 10, MUT),
    T(620, 218, "なまり・リンギング・ノイズが見える", "middle", 10, FNT),
    T(430, 265, "デジタルのやり取りの 9 割はロジアナ。波形が乱れる／アナログが絡むときオシロを足す", "middle", 10.5, FNT),
], cap="図4-1　二つの観測器の役割分担。")

F["t04_sample"] = SVG(860, 300, [
    T(430, 28, "サンプリングが足りないと、エッジがずれ・パルスが消える", "middle", 13, INK, True),
    T(150, 68, "十分なレート", "middle", 11, GRN, True),
    PL([(70,150),(90,150),(90,100),(140,100),(140,150),(170,150),(170,100),(200,100),(200,150),(250,150)], SIG, 1.8),
    *[ (D(x, 150 if (x<90 or (140<=x<170) or x>=200) else 100, GRN, 2.6)) for x in range(70,251,10)],
    T(600, 68, "低すぎるレート（間引き）", "middle", 11, ALI, True),
    PL([(490,150),(510,150),(510,100),(560,100),(560,150),(590,150),(590,100),(620,100),(620,150),(670,150)], LIN, 1.4, "4,4"),
    *[ D(x, 150 if x<560 else 100, ALI, 3.2) for x in [490,540,590,640]],
    PL([(490,150),(540,150),(590,100),(640,100)], ALI, 2.0),
    T(600, 210, "短いパルスを取り逃し、別の波形に化ける", "middle", 10, FNT),
    T(430, 262, "目安: 見たい最速の変化の 4〜10 倍で標本化する。「デコードできない」ときはまずレートを疑う", "middle", 10.5, FNT),
], cap="図4-2　標本化レートと取りこぼし。")

F["t04_decode"] = SVG(860, 280, [
    T(430, 28, "生のエッジを、段階的に「意味」へ持ち上げる", "middle", 13, INK, True),
    flowdown(430, 60, [
        ("生のエッジ（0/1 の列）", "ロジアナが記録した波形", LIN, PAN),
        ("バイト・フレーム", "プロトコルデコーダ（I²C/SPI/UART）", SIG, SSOFT),
        ("意味（レジスタ・コマンド）", "高位デコーダを重ねる / CSV に出す", GRN, PAN),
    ], w=420, bh=52, gap=26, sz=12, ssz=10)[0],
    T(430, 262, "sigrok/PulseView・Saleae はデコーダをスタックでき、結果を判定スクリプト（19 章）へ渡せる", "middle", 10.5, FNT),
], cap="図4-3　デコーダのスタック。")

# ---- 05 ----
F["t05_console"] = SVG(860, 260, [
    T(430, 28, "UART は 3 本——TX・RX を交差、GND を共通に", "middle", 13, INK, True),
    BOX(90, 90, 220, 90, "PC + USB-シリアル変換", "3.3 V ロジック", GRN, PAN, INK, 10, 1.4, 12, 10),
    BOX(550, 90, 220, 90, "テスト対象（MCU）", "コンソール / printf", INK, PAN, INK, 10, 1.4, 12, 10),
    ARR(310, 110, 550, 110, SIG, 1.7), T(430, 103, "TX → RX", "middle", 10, SIG, True),
    ARR(550, 140, 310, 140, GRN, 1.7), T(430, 133, "RX ← TX", "middle", 10, GRN, True),
    W(310, 170, 550, 170, c=MUT, lw=1.5), T(430, 163, "GND 共通", "middle", 10, MUT),
    T(430, 225, "電圧レベル（3.3V か 5V か）を必ず合わせる。合わないと壊れる／読めない", "middle", 10.5, FNT),
], cap="図5-1　シリアルコンソールの結線。")

F["t05_frame"] = SVG(860, 260, [
    T(430, 28, "1 バイトの枠組み：スタート・データ 8 ビット・ストップ", "middle", 13, INK, True),
    BYTES(70, 110, [
        ("Start", 60, ALI, ASOFT),
        ("b0", 70, SIG, SSOFT), ("b1", 70, SIG, SSOFT), ("b2", 70, SIG, SSOFT), ("b3", 70, SIG, SSOFT),
        ("b4", 70, SIG, SSOFT), ("b5", 70, SIG, SSOFT), ("b6", 70, SIG, SSOFT), ("b7", 70, SIG, SSOFT),
        ("Stop", 60, GRN, PAN),
    ], h=44, sz=10)[0],
    T(70, 185, "アイドル(H)", "start", 10, MUT), T(100, 100, "L に落ちて開始", "start", 9.5, FNT),
    T(430, 210, "「8N1」＝データ 8 ビット・パリティなし・ストップ 1 が最多", "middle", 11, MUT),
    T(430, 232, "クロック線がないので、受信側はボーレート（1 ビットの長さ）を知っている必要がある", "middle", 10.5, FNT),
], cap="図5-2　UART の 8N1 フレーム。")

# ---- 06 ----
F["t06_buses"] = SVG(860, 340, [
    T(430, 28, "I²C は 2 本で多数、SPI は速いが線が多い", "middle", 13, INK, True),
    T(230, 62, "I²C", "middle", 12, SIG, True),
    BOX(80, 80, 90, 40, "MCU", None, INK, PAN, INK, 6, 1.3, 11),
    W(170, 95, 400, 95, c=SIG, lw=1.8), T(410, 99, "SDA", "start", 10, SIG),
    W(170, 112, 400, 112, c=SIG, lw=1.8), T(410, 116, "SCL", "start", 10, SIG),
    BOX(190, 135, 70, 34, "IC①", None, LIN, PAN, INK, 6, 1.2, 10),
    BOX(280, 135, 70, 34, "IC②", None, LIN, PAN, INK, 6, 1.2, 10),
    W(225, 120, 225, 135, c=MUT, lw=1.2), W(315, 120, 315, 135, c=MUT, lw=1.2),
    T(230, 195, "配線少・低速・ACK あり・アドレスで区別", "middle", 10, FNT),
    T(650, 62, "SPI", "middle", 12, GRN, True),
    BOX(500, 80, 90, 40, "MCU", None, INK, PAN, INK, 6, 1.3, 11),
    W(590, 90, 760, 90, c=GRN, lw=1.6), T(770, 94, "MOSI", "start", 9.5, GRN),
    W(590, 103, 760, 103, c=GRN, lw=1.6), T(770, 107, "MISO", "start", 9.5, GRN),
    W(590, 116, 760, 116, c=GRN, lw=1.6), T(770, 120, "SCK", "start", 9.5, GRN),
    W(590, 129, 760, 129, c=ALI, lw=1.6), T(770, 133, "CS", "start", 9.5, ALI),
    BOX(620, 150, 90, 34, "IC", None, LIN, PAN, INK, 6, 1.2, 10),
    T(650, 210, "高速・全二重・CS の数だけ線が増える", "middle", 10, FNT),
    T(430, 255, "どちらも受動的に「盗聴」してバスの会話を読める（クロックがあるので復元は容易）", "middle", 11, INK, True),
    T(430, 285, "SDA=データ線 / SCL=クロック線 / MOSI・MISO=送受信データ / SCK=クロック / CS=チップ選択", "middle", 9.5, FNT),
], cap="図6-1　I²C と SPI の結線と性格。")

F["t06_fake"] = SVG(860, 300, [
    T(430, 28, "偽センサ——本物が出さない異常値を注入して反応を見る", "middle", 13, INK, True),
    BOX(80, 120, 150, 80, "テスト対象\nMCU", "AI 生成ファーム", INK, PAN, INK, 10, 1.5, 12, 9.5),
    W(230, 150, 400, 150, c=MUT, lw=1.6), W(230, 170, 400, 170, c=MUT, lw=1.6),
    BOX(400, 120, 190, 80, "偽センサ", "MCU/ボードで I²C\nスレーブを演じる", ALI, ASOFT, INK, 10, 1.5, 12, 9.5),
    T(315, 140, "SDA/SCL", "middle", 9.5, FNT),
    BOX(650, 90, 150, 44, "−40 ℃ / 上限値", None, ALI, ASOFT, INK, 8, 1.2, 10.5),
    BOX(650, 145, 150, 44, "NACK（応答なし）", None, ALI, ASOFT, INK, 8, 1.2, 10.5),
    BOX(650, 200, 150, 44, "途中でフリーズ", None, ALI, ASOFT, INK, 8, 1.2, 10.5),
    ARR(590, 150, 645, 118, MUT, 1.3), ARR(590, 160, 645, 167, MUT, 1.3), ARR(590, 175, 645, 218, MUT, 1.3),
    T(430, 275, "MCU がクリップ・無視・クラッシュのどれをするかを観測する", "middle", 11, FNT),
], cap="図6-2　偽センサによる異常値注入。")

# ---- 07 ----
F["t07_boundary"] = SVG(860, 300, [
    T(430, 28, "物理世界の代わりに「センサが出すはずの電圧」を注入する", "middle", 13, INK, True),
    BOX(70, 120, 180, 80, "DAC / 可変電圧源", "偽の電圧を作る", SIG, SSOFT, INK, 10, 1.4, 12, 10),
    ARR(250, 160, 340, 160, MUT, 1.6),
    BOX(340, 120, 160, 80, "MCU の ADC", "電圧→数値", INK, PAN, INK, 10, 1.4, 12, 9.5),
    ARR(500, 160, 590, 160, MUT, 1.6),
    BOX(590, 120, 200, 80, "判定", "境界での挙動を見る", GRN, PAN, INK, 10, 1.4, 12, 10),
    # boundary bar
    RECT(120, 235, 620, 26, 4, PAN, LIN, 1.2),
    RECT(120, 235, 70, 26, 4, ASOFT, ALI, 1.2), RECT(670, 235, 70, 26, 4, ASOFT, ALI, 1.2),
    T(155, 252, "下限外", "middle", 9.5, ALI), T(705, 252, "上限外", "middle", 9.5, ALI),
    T(430, 252, "正常範囲", "middle", 10, GRN, True),
    T(430, 285, "0・最小・最大・範囲外・急変を掃引し、クリップ／飽和／校正のずれを確かめる", "middle", 10.5, FNT),
], cap="図7-1　アナログ入力の境界テスト。")

F["t07_pwm"] = SVG(860, 270, [
    T(430, 28, "PWM はデューティ比（オンの割合）で出力の強さを表す", "middle", 13, INK, True),
    T(150, 66, "25%", "middle", 11, MUT, True),
    PL([(70,150),(90,150),(90,110),(110,110),(110,150),(150,150),(150,110),(170,110),(170,150),(210,150),(210,110),(230,110),(230,150)], SIG, 1.8),
    T(430, 66, "50%", "middle", 11, MUT, True),
    PL([(350,150),(380,150),(380,110),(410,110),(410,150),(440,150),(440,110),(470,110),(470,150),(500,150),(500,110),(510,110)], SIG, 1.8),
    T(710, 66, "75%", "middle", 11, MUT, True),
    PL([(630,150),(645,150),(645,110),(690,110),(690,150),(705,150),(705,110),(750,110),(750,150),(765,150),(765,110),(790,110)], SIG, 1.8),
    T(430, 205, "指令→出力の遅延、複数出力の同期（14 章）、そして", "middle", 10.5, MUT),
    T(430, 227, "指令範囲外や通信断で出力が安全側（停止・既定値）に倒れるか＝フェイルセーフを観る", "middle", 10.5, FNT),
], cap="図7-2　PWM のデューティ比と安全側挙動。")

# ---- 08 ----
F["t08_gray"] = SVG(860, 300, [
    T(430, 28, "デバッグポートは「半分中が見える」——強力だが製品とは限らない", "middle", 13, INK, True),
    BOX(90, 100, 180, 90, "PC + プローブ", "J-Link / CMSIS-DAP\nOpenOCD / pyOCD", GRN, PAN, INK, 10, 1.4, 12, 9.5),
    ARR(270, 145, 360, 145, SIG, 1.7), T(315, 135, "SWD/JTAG", "middle", 9.5, SIG),
    BOX(360, 100, 200, 90, "MCU（内部が見える）", "メモリ・レジスタ・変数\nブレーク・トレース", INK, PAN, INK, 10, 1.4, 12, 9.5),
    BOX(620, 85, 180, 44, "止めない観測", "RTT / SWO / ITM", GRN, PAN, INK, 8, 1.3, 11, 9),
    BOX(620, 145, 180, 44, "止める観測", "ブレーク=時間が壊れる", ALI, ASOFT, INK, 8, 1.3, 11, 9),
    ARR(560, 130, 615, 110, MUT, 1.3), ARR(560, 160, 615, 165, MUT, 1.3),
    T(430, 245, "落とし穴: 製品ではロック／読み出し保護される。「開発機 ≠ 製品」", "middle", 11, ALI, True),
    T(430, 272, "最終受け入れは純ブラックボックスで。グレーは開発中の観測・原因究明に使う", "middle", 10.5, FNT),
], cap="図8-1　デバッグポート経由のグレーボックス観測。")

# ---- 09 ----
F["t09_stack"] = SVG(860, 300, [
    T(430, 28, "BLE は役割の違う層の積み重ね——本編が触るのは上二層", "middle", 13, INK, True),
    stack(280, 55, 300, [
        ("アプリ（機器の機能）", "温度・警報など", INK, PAN),
        ("GATT — 何を読み書きするか", "サービス／キャラクタリスティック", GRN, PAN),
        ("GAP — 見つける・つなぐ", "アドバタイズ／スキャン／接続", SIG, SSOFT),
        ("リンク層・物理層（PHY）", "電波そのもの（sniffer 領域）", LIN, PAN),
    ], lh=50, gap=6)[0],
    BADGE(600, 118, "テストの主戦場", GRN, PAN, 10),
    BADGE(600, 174, "スキャン/接続", SIG, SSOFT, 10),
    T(430, 285, "GAP=接続の作法、GATT=データの構造。まず GAP で見つけ、GATT で読み書きする", "middle", 10.5, FNT),
], cap="図9-1　BLE のプロトコルスタック。")

F["t09_gatt"] = SVG(860, 320, [
    T(430, 28, "GATT のデータは「サービス→キャラクタリスティック」の木", "middle", 13, INK, True),
    BOX(340, 60, 180, 46, "GATT サーバ（機器）", None, INK, PAN, INK, 8, 1.3, 11.5),
    ARR(430, 106, 240, 140, MUT, 1.4), ARR(430, 106, 620, 140, MUT, 1.4),
    BOX(120, 140, 240, 46, "サービス：温度計", "UUID（16bit 短縮）", GRN, PAN, INK, 8, 1.3, 11, 9),
    BOX(500, 140, 240, 46, "サービス：設定", "UUID（128bit 独自）", GRN, PAN, INK, 8, 1.3, 11, 9),
    ARR(240, 186, 150, 220, MUT, 1.3), ARR(240, 186, 330, 220, MUT, 1.3),
    BOX(70, 220, 165, 60, "温度値", "Read / Notify", SIG, SSOFT, INK, 8, 1.3, 10.5, 9),
    BOX(250, 220, 165, 60, "しきい値", "Read / Write", SIG, SSOFT, INK, 8, 1.3, 10.5, 9),
    ARR(620, 186, 620, 220, MUT, 1.3),
    BOX(540, 220, 165, 60, "履歴消去コマンド", "Write", SIG, SSOFT, INK, 8, 1.3, 10.5, 9),
    T(430, 305, "各値に UUID（世界でかぶらない識別子）と権限（Read/Write/Notify）が付く＝外から見た API 仕様書", "middle", 10, FNT),
], cap="図9-2　GATT のサービス／キャラクタリスティック階層。")

F["t09_adv"] = SVG(860, 280, [
    T(430, 28, "接続せずに——アドバタイズを聞くだけで多くが分かる", "middle", 13, INK, True),
    BOX(90, 110, 160, 80, "機器（周辺）", "周期的に叫ぶ", SIG, SSOFT, INK, 10, 1.4, 12, 10),
    *[ CIRC(250+i*28, 150, 8+i*10, MUT, 1.1) for i in range(4)],
    T(360, 100, "ア) 電波", "middle", 9.5, FNT),
    BOX(560, 110, 210, 80, "スキャナ（PC/bleak）", "受け取って解析", GRN, PAN, INK, 10, 1.4, 12, 10),
    BOX(300, 210, 130, 40, "機器名", None, LIN, PAN, INK, 6, 1.1, 10),
    BOX(440, 210, 130, 40, "サービス UUID", None, LIN, PAN, INK, 6, 1.1, 10),
    BOX(90, 210, 130, 40, "RSSI（距離目安）", None, LIN, PAN, INK, 6, 1.1, 9.5),
    BOX(580, 210, 190, 40, "製造者データ（生値注意）", None, ALI, ASOFT, INK, 6, 1.1, 9.5),
    T(430, 60, "秘密がアドバタイズに乗っていないか／MAC が固定でないかを、無接続で確かめる", "middle", 10.5, FNT),
], cap="図9-3　アドバタイズとスキャンで得られる情報。")

# ---- 10 ----
F["t10_conn"] = SVG(860, 280, [
    T(430, 28, "接続後は read / write / notify の組み合わせで攻める", "middle", 13, INK, True),
    BOX(90, 110, 200, 90, "セントラル\n（PC / bleak）", "テスト側", GRN, PAN, INK, 10, 1.5, 12, 9.5),
    BOX(570, 110, 200, 90, "ペリフェラル\n（テスト対象）", "AI 生成ファーム", INK, PAN, INK, 10, 1.5, 12, 9.5),
    ARR(290, 130, 570, 130, SIG, 1.6), T(430, 123, "write（コマンド送信）", "middle", 10, SIG),
    ARR(570, 158, 290, 158, GRN, 1.6), T(430, 151, "read（値の確認・オラクル）", "middle", 10, GRN),
    W(570, 185, 290, 185, c=ALI, lw=1.5, dash="5,4"), ARR(305, 185, 290, 185, ALI, 1.5),
    T(430, 178, "notify（自発通知＝観測点）", "middle", 10, ALI),
    T(430, 245, "書いた後は必ず read で「期待どおりの状態になったか」を確かめる", "middle", 10.5, FNT),
], cap="図10-1　能動テストの基本操作。")

F["t10_fuzz"] = SVG(860, 290, [
    T(430, 28, "ファジングは 4 つの軸で攻めると効率がいい", "middle", 13, INK, True),
    BOX(60, 70, 360, 90, "① 値の境界", "長さ 0／最大／最大+1、0x00・0xFF、\nMTU 超え、数値の最小・最大", SIG, SSOFT, INK, 10, 1.4, 12, 10),
    BOX(440, 70, 360, 90, "② 型・書式", "数値の所に文字列、区切り・NUL・制御文字、\nとても長い値（溢れ狙い）", SIG, SSOFT, INK, 10, 1.4, 12, 10),
    BOX(60, 175, 360, 90, "③ 順序（ステートマシン）", "初期化前・認証前の操作、二度打ち、\n途中で切断、あり得ない遷移", GRN, PAN, INK, 10, 1.4, 12, 10),
    BOX(440, 175, 360, 90, "④ タイミング・量", "高速連投、無応答書き込みで溢れさせる、\n接続直後の集中砲火", GRN, PAN, INK, 10, 1.4, 12, 10),
], cap="図10-2　BLE ファジングの 4 軸。")

# ---- 11 ----
F["t11_layers"] = SVG(860, 300, [
    T(430, 28, "Wi-Fi が載ると PC 用の道具がそのまま使える", "middle", 13, INK, True),
    flowright(70, 150, [
        ("① スキャン", "地図を描く\nnmap / mDNS", SIG, SSOFT),
        ("② キャプチャ", "会話を覗く\nWireshark", GRN, PAN),
        ("③ プロキシ", "割り込む\nmitmproxy", GRN, PAN),
        ("④ API 叩き", "直接試す\ncurl / MQTT", SIG, SSOFT),
    ], w=170, bh=90, gap=24, sz=12.5, ssz=9.5)[0],
    T(430, 262, "面が一気に広がる（TCP/UDP ポート・HTTP API・MQTT・mDNS）。余計なポートや無防備な API が残りやすい", "middle", 10.5, FNT),
], cap="図11-1　ネットワークテストの 4 段階。")

F["t11_capture"] = SVG(860, 280, [
    T(430, 28, "PC を「間」に置いて会話を覗く・書き換える", "middle", 13, INK, True),
    BOX(70, 115, 180, 80, "テスト対象\n（機器）", None, INK, PAN, INK, 10, 1.5, 12),
    BOX(340, 115, 180, 80, "PC（観測/改変）", "Wireshark\nmitmproxy", GRN, PAN, INK, 10, 1.5, 12, 9.5),
    BOX(610, 115, 180, 80, "サーバ / クラウド", "本物 or 偽物", LIN, PAN, INK, 10, 1.5, 12, 9.5),
    DARR(250, 155, 340, 155, MUT, 1.5), DARR(520, 155, 610, 155, MUT, 1.5),
    T(430, 235, "平文の秘密が流れていないか、意図しない接続先がないか。応答を異常値に差し替えて反応も試せる", "middle", 10.5, FNT),
], cap="図11-2　中間者としてのパケット観測・注入。")

# ---- 12 ----
F["t12_sdr"] = SVG(860, 280, [
    T(430, 28, "SDR は電波を「生のデータ」で取り込み、ソフトで解読する", "middle", 13, INK, True),
    ANT(130, 95, 1.0, SIG),
    ARR(130, 130, 130, 160, MUT, 1.4),
    flowright(200, 175, [
        ("SDR ハード", "RTL-SDR / HackRF", SIG, SSOFT),
        ("PC ソフト", "GQRX / GNU Radio", GRN, PAN),
        ("解析", "URH / rtl_433", GRN, PAN),
    ], w=180, bh=64, gap=30, sz=12, ssz=9.5)[0],
    T(430, 250, "受信は RTL-SDR（数千円）で入門。送信できる HackRF は強力だが規制対象（後述）", "middle", 10.5, FNT),
], cap="図12-1　SDR の信号処理の流れ。")

F["t12_spectrum"] = SVG(860, 310, [
    T(430, 28, "ウォーターフォール——いつ・どの周波数で・どれだけ出たか", "middle", 13, INK, True),
    AXES(110, 250, 640, 180, "周波数", "時間↓"),
    GRID(110, 70, 640, 180, 8, 6, LIN, 0.5),
    # two vertical signal bands with bursts
    RECT(270, 90, 24, 40, 2, SSOFT, SIG, 0), RECT(270, 170, 24, 30, 2, SSOFT, SIG, 0),
    RECT(500, 120, 20, 50, 2, ASOFT, ALI, 0), RECT(500, 210, 20, 25, 2, ASOFT, ALI, 0),
    T(282, 82, "433 MHz 帯", "middle", 9.5, SIG), T(510, 112, "別の送信", "middle", 9.5, ALI),
    T(430, 285, "ボタンを押した瞬間に「どこが光るか」を探し、周波数と送信タイミングを特定する", "middle", 10.5, FNT),
], cap="図12-2　スペクトラム／ウォーターフォール表示。")

# ---- 13 ----
F["t13_usb"] = SVG(860, 320, [
    T(430, 28, "USB は接続直後の「自己紹介」＝記述子で正体が見える", "middle", 13, INK, True),
    flowdown(300, 58, [
        ("デバイス記述子", "VID/PID・クラス", SIG, SSOFT),
        ("コンフィグ記述子", "電力・構成", GRN, PAN),
        ("インタフェース記述子", "HID/CDC/MSC…", GRN, PAN),
        ("エンドポイント記述子", "転送の口", SIG, SSOFT),
    ], w=300, bh=48, gap=16, sz=12, ssz=9.5)[0],
    BOX(560, 90, 250, 60, "lsusb -v で全部ダンプ", "余計な顔・漏れた文字列を探す", INK, PAN, INK, 10, 1.4, 12, 9.5),
    BOX(560, 175, 250, 60, "usbmon / Facedancer", "覗く／偽デバイスを合成", ALI, ASOFT, INK, 10, 1.4, 12, 9.5),
    ARR(450, 120, 555, 120, MUT, 1.3), ARR(450, 205, 555, 205, MUT, 1.3),
    T(430, 300, "宣言したクラスと実機能が合うか、独自ベンダコマンドが不正値を拒否するか", "middle", 10.5, FNT),
], cap="図13-1　USB 記述子の階層と道具。")

# ---- 14 ----
F["t14_latency"] = SVG(860, 270, [
    T(430, 28, "レイテンシ＝刺激の時刻と応答の時刻の差", "middle", 13, INK, True),
    T(80, 95, "刺激", "start", 11, SIG, True),
    W(120, 110, 300, 110, c=SIG, lw=1.8), W(300, 110, 300, 80, c=SIG, lw=1.8), W(300, 80, 760, 80, c=SIG, lw=1.8),
    T(80, 175, "応答", "start", 11, GRN, True),
    W(120, 190, 500, 190, c=GRN, lw=1.8), W(500, 190, 500, 160, c=GRN, lw=1.8), W(500, 160, 760, 160, c=GRN, lw=1.8),
    W(300, 80, 300, 210, c=LIN, lw=0.8, dash="3,3"), W(500, 160, 500, 210, c=LIN, lw=0.8, dash="3,3"),
    DARR(300, 225, 500, 225, ALI, 1.4), T(400, 245, "レイテンシ", "middle", 11, ALI, True),
    T(430, 260, "刺激と応答の両方に正確な時刻を打つ。オシロ/GPIO トグルが最精度", "middle", 10, FNT),
], cap="図14-1　レイテンシの測り方。")

F["t14_jitter"] = SVG(860, 300, [
    T(430, 28, "1 回でなく分布で見る——平均より「最悪値と裾」に注目", "middle", 13, INK, True),
    AXES(110, 240, 660, 170, "レイテンシ", "回数"),
    *[ RECT(140+i*36, 240-h, 30, h, 2, SSOFT, SIG, 0) for i,h in enumerate([15,60,130,95,45,22,12,8,6,5,4,4,3])],
    # long tail marker
    RECT(140+13*36, 235, 30, 5, 1, ASOFT, ALI, 0),
    ARR(690, 120, 625, 232, ALI, 1.5), T(700, 110, "まれな大遅延", "middle", 10, ALI, True),
    T(700, 126, "＝本命", "middle", 10, ALI),
    W(212, 240, 212, 80, c=GRN, lw=1.2, dash="4,3"), T(212, 72, "中央値", "middle", 9.5, GRN),
    T(430, 282, "裾の長い分布は割り込み競合・ロック・電源管理（スリープ復帰）を疑う手がかり", "middle", 10.5, FNT),
], cap="図14-2　レイテンシのヒストグラムと裾。")

# ---- 15 ----
F["t15_hil"] = SVG(860, 330, [
    T(430, 28, "HIL——実機はそのまま、周囲の世界を PC で模擬して閉じた輪に", "middle", 13, INK, True),
    BOX(350, 130, 160, 90, "テスト対象\n（実機）", "そのまま動かす", INK, PAN, INK, 12, 1.6, 13, 9.5),
    BOX(90, 60, 200, 56, "偽センサ／偽電圧", "6・7 章の技", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    BOX(90, 235, 200, 56, "偽の負荷・偽電源", "3・4 章の技", SIG, SSOFT, INK, 8, 1.3, 11, 9),
    BOX(570, 60, 200, 56, "偽のペア機器／サーバ", "10・11 章の技", GRN, PAN, INK, 8, 1.3, 11, 9),
    BOX(570, 235, 200, 56, "観測（電流・波形）", "3・4・14 章", GRN, PAN, INK, 8, 1.3, 11, 9),
    ARR(290, 95, 348, 145, MUT, 1.4), ARR(290, 260, 348, 205, MUT, 1.4),
    ARR(510, 155, 568, 100, MUT, 1.4), ARR(510, 200, 568, 255, MUT, 1.4),
    BOX(330, 285, 200, 40, "オーケストレータ（PC）", None, ALI, ASOFT, INK, 8, 1.3, 11),
    ARR(430, 285, 430, 222, MUT, 1.4),
    T(430, 116, "時刻付きシナリオで動かす: t=0 起動 → t=1s 温度異常注入 → t=1.5s までに警報", "middle", 9.5, FNT),
], cap="図15-1　HIL の閉ループ構成。")

# ---- 16 ----
F["t16_fuzz"] = SVG(860, 260, [
    T(430, 28, "堅牢性テストのループ——生存確認が命綱", "middle", 13, INK, True),
    flowright(90, 130, [
        ("生成", "境界・不正値", SIG, SSOFT),
        ("送信", "全入口へ", GRN, PAN),
        ("観測", "応答・波形", GRN, PAN),
        ("生存確認", "まだ生きてるか", ALI, ASOFT),
    ], w=155, bh=64, gap=22, sz=12, ssz=9.5)[0],
    ARR(740, 165, 90, 190, MUT, 1.4, 8), ARR(90, 190, 90, 165, MUT, 1.4, 8),
    T(415, 205, "落ちた瞬間の入力を保存（再現できないバグは直せない）", "middle", 10.5, FNT),
], cap="図16-1　入力ファジングのループ。")

F["t16_robust"] = SVG(860, 300, [
    T(430, 28, "「正常系が通る」の先——4 方向から追い込む", "middle", 13, INK, True),
    BOX(60, 70, 360, 90, "入力ファジング", "全入口に境界・不正値・異常順序\n（10・16 章の 4 軸）", SIG, SSOFT, INK, 10, 1.4, 12, 10),
    BOX(440, 70, 360, 90, "リソース枯渇", "メモリ・バッファ・接続・スタックを\n溢れさせる（リークが最頻出）", GRN, PAN, INK, 10, 1.4, 12, 10),
    BOX(60, 175, 360, 90, "電源・環境ストレス", "低電圧・瞬断・温度・ESD・時刻を\n荒らして回復力を見る", GRN, PAN, INK, 10, 1.4, 12, 10),
    BOX(440, 175, 360, 90, "長時間・ソーク", "何時間〜何日流し、劣化・\nカウンタ溢れを炙り出す", ALI, ASOFT, INK, 10, 1.4, 12, 10),
], cap="図16-2　堅牢性の 4 方向。")

# ---- 17 ----
F["t17_attack"] = SVG(860, 330, [
    T(430, 28, "守りは「できてはいけないことができない」を確かめる", "middle", 13, INK, True),
    PART(370, 150, 120, 70, "機器", INK, PAN, 12),
    BOX(70, 70, 190, 48, "物理: デバッグ/UART/フラッシュ", None, ALI, ASOFT, INK, 8, 1.2, 9.5),
    BOX(70, 150, 190, 48, "無線: BLE/Wi-Fi/サブGHz", None, ALI, ASOFT, INK, 8, 1.2, 10),
    BOX(70, 230, 190, 48, "有線: USB/CAN", None, ALI, ASOFT, INK, 8, 1.2, 10),
    BOX(600, 70, 190, 48, "秘密の漏れ（平文・べた書き）", None, ALI, ASOFT, INK, 8, 1.2, 9),
    BOX(600, 150, 190, 48, "認証・認可の欠落", None, ALI, ASOFT, INK, 8, 1.2, 10),
    BOX(600, 230, 190, 48, "更新: 署名検証", None, ALI, ASOFT, INK, 8, 1.2, 10),
    ARR(260, 94, 368, 165, MUT, 1.2), ARR(260, 174, 368, 180, MUT, 1.2), ARR(260, 254, 368, 200, MUT, 1.2),
    ARR(600, 94, 492, 165, MUT, 1.2), ARR(600, 174, 492, 180, MUT, 1.2), ARR(600, 254, 492, 200, MUT, 1.2),
    T(430, 305, "3〜16 章の観測・注入技を「攻撃者の目」で使い直す（自己所有・許可の範囲で）", "middle", 10.5, FNT),
], cap="図17-1　攻撃面の地図。")

F["t17_side"] = SVG(860, 280, [
    T(430, 28, "配線に載らない漏れ——電力・時間・電磁波から", "middle", 13, INK, True),
    BOX(340, 110, 180, 80, "機器（暗号処理中）", None, INK, PAN, INK, 10, 1.5, 12),
    BOX(70, 75, 200, 50, "タイミング攻撃", "処理時間の差から", ALI, ASOFT, INK, 8, 1.3, 11, 9),
    BOX(70, 175, 200, 50, "電力サイドチャネル", "消費電流の波形から", ALI, ASOFT, INK, 8, 1.3, 11, 9),
    BOX(590, 125, 200, 50, "フォールト注入", "グリッチで処理を飛ばす", ALI, ASOFT, INK, 8, 1.3, 11, 9),
    ARR(270, 100, 338, 135, MUT, 1.3), ARR(270, 200, 338, 165, MUT, 1.3), ARR(590, 150, 522, 150, MUT, 1.3),
    T(430, 250, "高価な装置と専門知識を要するが、「そういう漏れ・飛ばしがありうる」と知って項目化する", "middle", 10.5, FNT),
], cap="図17-2　サイドチャネルとフォールト注入の入口。")

# ---- 18 ----
F["t18_harness"] = SVG(860, 340, [
    T(430, 28, "ハーネスは三層に分ける——上ほど読みやすく、ハード非依存", "middle", 13, INK, True),
    BOX(180, 60, 500, 66, "テスト層", "「起動→モード設定→温度異常→0.5s 以内に警報」\n＝仕様書のように読める筋書き", ALI, ASOFT, INK, 12, 1.5, 13, 10),
    ARR(430, 126, 430, 148, MUT, 1.4),
    BOX(180, 150, 500, 66, "機器モデル層", "dut.set_temp(85) / dut.state() / dut.wait_for(\"ALARM\")\n＝意味のある操作（刺激・観測・判定）", GRN, PAN, INK, 12, 1.5, 13, 9.5),
    ARR(430, 216, 430, 238, MUT, 1.4),
    BOX(180, 240, 500, 66, "トランスポート層", "UART・bleak・ロジアナ・DAC・ppk2 を実際に叩く\n＝ハードが変わってもここだけ直す", SIG, SSOFT, INK, 12, 1.5, 13, 9.5),
    T(430, 328, "pytest を土台に fixture・パラメータ化・マーカーで整理する", "middle", 10.5, FNT),
], cap="図18-1　テストハーネスの三層構造。")

F["t18_ci"] = SVG(860, 280, [
    T(430, 28, "CI に載せて、AI の反復修正と噛み合わせる", "middle", 13, INK, True),
    flowright(70, 130, [
        ("push", "コード変更", SIG, SSOFT),
        ("build", "ビルド", GRN, PAN),
        ("HIL 実機テスト", "回帰一式", GRN, PAN),
        ("レポート", "合否・傾向", SIG, SSOFT),
    ], w=165, bh=64, gap=22, sz=12, ssz=9.5)[0],
    BOX(300, 210, 260, 44, "失敗ログを生成 AI に戻す", None, ALI, ASOFT, INK, 8, 1.3, 11.5),
    ARR(620, 162, 430, 208, MUT, 1.4), ARR(300, 232, 150, 162, MUT, 1.4),
    T(430, 275, "速いスモークは毎コミット、重いソークは夜間・週次に段階化する", "middle", 10.5, FNT),
], cap="図18-2　CI パイプラインと自動修正ループ。")

# ---- 19 ----
F["t19_build"] = SVG(860, 300, [
    T(430, 28, "足りない道具は作る——役割で分担するのが肝", "middle", 13, INK, True),
    BOX(70, 80, 330, 100, "ホスト（PC）", "観測・解析・司令塔。\nミリ秒精度。独自デコーダ・\n可視化・既存ツールの糊付け", GRN, PAN, INK, 10, 1.4, 12.5, 10),
    BOX(460, 80, 330, 100, "マイコン エージェント", "正確なタイミング注入・観測。\nマイクロ秒精度。偽センサ・\n信号注入・イベント時刻記録", SIG, SSOFT, INK, 10, 1.4, 12.5, 10),
    DARR(400, 130, 460, 130, MUT, 1.5), T(430, 118, "単純な\nシリアル\nコマンド", "middle", 8.5, FNT),
    BOX(230, 220, 400, 46, "作る／買うは費用対効果で決める", "標準・高精度・高速は買う／独自・密結合は作る", INK, PAN, INK, 10, 1.3, 12, 9.5),
], cap="図19-1　ホストとマイコンの役割分担。")

# ---- 20 ----
F["t20_plan"] = SVG(860, 320, [
    T(430, 28, "テストは軽い順に層で積む——下ほど速く多く", "middle", 13, INK, True),
    *[ (lambda i,lab,w,col,fl: BOX(430-w/2, 60+i*42, w, 36, lab, None, col, fl, INK, 6, 1.2, 11.5))(*a)
       for a in [
        (0,"性能（レイテンシ・スループット）",300,GRN,PAN),
        (1,"セキュリティ（攻撃面・秘密・認証）",380,GRN,PAN),
        (2,"堅牢・長時間（枯渇・ストレス・ソーク）",460,ALI,ASOFT),
        (3,"境界・異常（不正入力・接続の乱れ）",540,SIG,SSOFT),
        (4,"機能（各機能が仕様どおり）",620,SIG,SSOFT),
        (5,"スモーク（起動・基本応答／毎コミット）",700,INK,PAN),
    ]],
    T(430, 305, "上へ行くほど HIL・ハーネス・CI（15・18 章）の価値が上がる", "middle", 10.5, FNT),
], cap="図20-1　テストのピラミッド。")

F["t20_matrix"] = SVG(860, 336, [
    T(430, 28, "面ごとに道具を割り当てる——3〜19 章の技を配置する", "middle", 13, INK, True),
    *[ (lambda i,face,tool: (BOX(60, 60+i*38, 250, 32, face, None, SIG, SSOFT, INK, 6, 1.2, 11)
        + BOX(320, 60+i*38, 480, 32, tool, None, LIN, PAN, INK, 6, 1.2, 10.5)))(*a)
       for a in [
        (0,"状態・電力（3 章）","シャント / PPK2 / Otii"),
        (1,"デジタル信号（4 章）","ロジアナ + オシロ / sigrok"),
        (2,"I²C・SPI（6 章）","ロジアナ / 偽センサ（自作）"),
        (3,"BLE（9・10 章）","bleak / nRF Connect / sniffer"),
        (4,"Wi-Fi・ネット（11 章）","nmap / Wireshark / mitmproxy"),
        (5,"サブGHz（12 章）","RTL-SDR / URH / rtl_433"),
        (6,"統合自動化（15・18 章）","HIL / pytest / pyvisa / CI"),
    ]],
], cap="図20-2　面×道具の早見表（抜粋）。")

F["t20_case"] = SVG(860, 320, [
    T(430, 28, "ケーススタディ：BLE 温度ロガーを計画から発見まで通す", "middle", 13, INK, True),
    flowright(70, 105, [
        ("計画", "リスク×面", SIG, SSOFT),
        ("層で実行", "スモーク→性能", GRN, PAN),
        ("道具を当てる", "各章の技", GRN, PAN),
        ("バグ発見", "実際の欠陥", ALI, ASOFT),
    ], w=170, bh=60, gap=22, sz=12, ssz=9.5)[0],
    BOX(70, 190, 730, 100, "見つかる典型欠陥", "省電力の抜け（3 章）／閾値の境界取り違え（7・16 章）／\n長さ検査なしでハング（10 章）／通信競合でデッドライン破り（14 章）／\n無認証書き込み・平文通知（17 章）／24 時間後にメモリリーク（16 章）", INK, PAN, INK, 12, 1.5, 12.5, 10.5),
], cap="図20-3　ケーススタディの流れと発見。")
