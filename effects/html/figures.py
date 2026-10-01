# -*- coding: utf-8 -*-
"""エフェクター編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
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

# ===================== エフェクター編 ヘルパ =====================

def HEXROW(x, y, cells, cw=30, h=24, sz=10):
    o = []; xx = x
    for c2 in cells:
        t = c2[0]; col = c2[1] if len(c2) > 1 and c2[1] else LIN; fl = c2[2] if len(c2) > 2 and c2[2] else PAN
        o.append(RECT(xx, y, cw, h, 2, fl, col, 1.1))
        o.append(T(xx + cw/2, y + h/2 + sz*0.35, t, "middle", sz, INK, False, True))
        xx += cw
    return "".join(o), xx

def BYTES(x, y, segs, h=28, sz=10, tsz=9):
    o = []; xx = x
    for s2 in segs:
        lab, w = s2[0], s2[1]
        c = s2[2] if len(s2) > 2 and s2[2] else LIN
        fl = s2[3] if len(s2) > 3 and s2[3] else PAN
        sub = s2[4] if len(s2) > 4 else None
        o.append(RECT(xx, y, w, h, 3, fl, c, 1.3))
        o.append(T(xx + w/2, y + h/2 + sz*0.35, lab, "middle", sz, INK, True))
        if sub:
            o.append(T(xx + w/2, y + h + 13, sub, "middle", tsz, MUT))
        xx += w
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

def FWAVE(x0, y0, w, h, fn, n=240, c=SIG, lw=1.8):
    """fn(u in 0..1) -> -1..1 の波形を描く。y0 が中心線、h が全振幅。"""
    pts = [(x0 + w*i/n, y0 - fn(i/n)*h/2) for i in range(n+1)]
    return PL(pts, c, lw)

def MIDLINE(x0, y0, w, c=LIN):
    return W(x0, y0, x0+w, y0, c=c, lw=1)

def clip_sine(cycles, drive, soft):
    """クリップした正弦波の関数を返す。drive=増幅倍率、soft=True でtanh。"""
    def fn(u):
        v = drive*math.sin(2*math.pi*cycles*u)
        if soft:
            return math.tanh(v)
        return max(-1.0, min(1.0, v))
    return fn

def SPEC(x, ybase, w, h, bars, bw=10, c=SIG):
    """スペクトルのバー列。bars = [(u 0..1, amp 0..1, color?)]"""
    o = [ARR(x, ybase, x+w, ybase, MUT, 1.4)]
    for b in bars:
        u, a = b[0], b[1]
        col = b[2] if len(b) > 2 else c
        xx = x + u*w
        o.append(RECT(xx-bw/2, ybase-a*h, bw, a*h, 1, col, col, 0))
    return "".join(o)

def KNOB(cx, cy, r, label, frac, sub=None, c=INK):
    """ツマミ。frac 0..1 が 7 時→5 時。"""
    a = math.pi*0.75 + frac*math.pi*1.5
    o = [CIRC(cx, cy, r, c, 1.6, PAN),
         W(cx, cy, cx + r*0.72*math.cos(a), cy + r*0.72*math.sin(a), c=c, lw=2.2)]
    if label: o.append(T(cx, cy + r + 14, label, "middle", 9.5, MUT))
    if sub: o.append(T(cx, cy + r + 26, sub, "middle", 8.5, FNT))
    return "".join(o)

def PEDAL(x, y, w, h, name, c=SIG, fill=SSOFT, sz=10.5):
    """ペダルの箱アイコン。"""
    o = [RECT(x, y, w, h, 8, fill, c, 1.5),
         T(x+w/2, y+18, name, "middle", sz, INK, True),
         CIRC(x+w/2, y+h-14, 6, c, 1.4, PAN)]
    return "".join(o)

def LFOICON(cx, cy, w, c=GRN):
    return sine(cx-w/2, cy, w, 2, 8, c, 1.6) + CIRC(cx, cy, w/2+8, c, 1.2)

# ===================== 01 =====================

F["e01_signal"] = SVG(860, 250, [
    T(430, 26, "エフェクターは電圧の波形を加工する箱", "middle", 12.5, INK, True),
    BOX(40, 70, 130, 60, "ギター", "ピックアップが振動→電圧に", LIN, PAN, INK, 8, 1.4, 11.5, 9),
    sine(180, 100, 90, 3, 14, MUT, 1.6), ARR(180, 100, 275, 100, MUT, 0.1),
    PEDAL(290, 60, 120, 84, "エフェクター"),
    T(350, 118, "波形を加工", "middle", 9, MUT),
    FWAVE(425, 100, 95, 30, clip_sine(3, 3.0, True), 200, SIG, 1.8),
    BOX(540, 70, 130, 60, "アンプ", "増幅してスピーカーへ", LIN, PAN, INK, 8, 1.4, 11.5, 9),
    ARR(670, 100, 700, 100, MUT, 1.4),
    T(760, 104, "音", "middle", 12, INK, True),
    T(430, 185, "形が変われば音色、大きさが変われば音量、ずらしたコピーを混ぜれば空間", "middle", 11, MUT),
    T(430, 210, "どんなエフェクトも「波形への数学的な操作」である", "middle", 10.5, FNT),
], "ピックアップの電圧波形を途中で加工する。神秘的な効果もすべて波形への操作")

F["e01_chain"] = SVG(860, 260, [
    T(430, 26, "つなぎ順の定石と理由", "middle", 12.5, INK, True),
    flowright(30, 90, [("コンプ / ワウ", "歪む前の素直な信号に掛けたい", SIG, SSOFT),
                       ("歪み系", "倍音を足す。前段の情報に反応", ALI, ASOFT),
                       ("モジュレーション", "歪んだ後に揺らすと澄む", GRN, "none"),
                       ("ディレイ", "演奏の響きは最後", LIN, PAN),
                       ("リバーブ", "いちばん外側の空間", LIN, PAN)], 148, 64, 10, sz=11, ssz=8.5)[0],
    BOX(40, 155, 780, 56, "原理: 歪みは「後から来たもの全部」をまとめて潰す",
        "歪みは非線形。響きや揺れを前に置くと、混ざった波形ごと潰れて分離できない濁りになる。例外（ファズ前のワウ、轟音系の前段リバーブ）は濁りを音色として使う「選択」", GRN, "none", INK, 8, 1.4, 11.5, 10),
    T(430, 240, "順番がすべてを変える——本編で繰り返し出てくる第一原理", "middle", 10.5, MUT),
], "コンプ/ワウ → 歪み → モジュレーション → ディレイ → リバーブ。理由は「歪みは全部まとめて潰す」")

F["e01_drywet"] = SVG(860, 230, [
    T(430, 26, "ほとんどのエフェクトは「分岐 → 加工 → 混合」", "middle", 12.5, INK, True),
    BOX(60, 95, 90, 44, "入力", None, LIN, PAN),
    W(150, 117, 210, 117, c=MUT, lw=1.6), D(210, 117, MUT, 4),
    W(210, 117, 260, 77, c=MUT, lw=1.6), W(210, 117, 260, 157, c=MUT, lw=1.6),
    BOX(260, 55, 200, 44, "そのまま（Dry）", None, LIN, PAN),
    BOX(260, 135, 200, 44, "加工（Wet）", "遅延・フィルタ・揺れ…", SIG, SSOFT, INK, 8, 1.4, 11.5, 9),
    W(460, 77, 540, 112, c=MUT, lw=1.6), W(460, 157, 540, 122, c=MUT, lw=1.6),
    CIRC(555, 117, 16, INK, 1.6), T(555, 122, "＋", "middle", 14, INK, True),
    T(555, 152, "Mix ツマミ = 混合比", "middle", 9, MUT),
    W(571, 117, 630, 117, c=MUT, lw=1.6), ARR(630, 117, 640, 117, MUT, 1.6),
    BOX(640, 95, 90, 44, "出力", None, LIN, PAN),
    T(430, 205, "並列接続・パラレルコンプ・Dry/Wet ツマミは全部この形。ブロック図で見る癖をつける", "middle", 10.5, MUT),
], "Mix ツマミ付きのエフェクトは「並列を 1 つの箱でやっている」")

# ===================== 02 =====================

F["e02_wave"] = SVG(860, 240, [
    T(430, 26, "波形 — 時間軸で見る", "middle", 12.5, INK, True),
    AXES(60, 190, 320, 120, "時間", "電圧"),
    MIDLINE(60, 130, 320),
    sine(60, 130, 320, 3, 45, SIG, 2),
    DIM(60, 208, 167, 208, "1 周期（110 Hz なら 1/110 秒）", MUT, 9),
    DIM(395, 85, 395, 130, None, GRN, 9),
    T(408, 108, "振幅", "start", 9.5, GRN),
    AXES(480, 190, 320, 120, "時間", None),
    MIDLINE(480, 130, 320),
    sine(480, 130, 320, 3, 45, SIG, 1.5),
    sine(480, 130, 320, 3, 45, GRN, 1.8, math.pi*0.6),
    T(640, 62, "位相のずれ（単体では聞こえない。混ぜると強め合い/打ち消しになる）", "middle", 9.5, MUT),
    T(430, 225, "周波数 = 高さ、振幅 = 大きさ、位相 = 混ぜたときのタイミング", "middle", 10.5, MUT),
], "横軸=時間・縦軸=電圧。周波数・振幅・位相の 3 語で語る")

F["e02_harmonics"] = SVG(860, 260, [
    T(430, 26, "倍音 — 音色の正体", "middle", 12.5, INK, True),
    T(220, 56, "波形（A 弦 110 Hz）", "middle", 10.5, INK, True),
    MIDLINE(60, 120, 320),
    FWAVE(60, 120, 320, 80, lambda u: 0.62*math.sin(2*math.pi*2*u)+0.3*math.sin(2*math.pi*4*u+0.7)+0.2*math.sin(2*math.pi*6*u+1.9)+0.1*math.sin(2*math.pi*8*u+0.3), 300, SIG, 1.8),
    ARR(395, 120, 445, 120, MUT, 1.8), T(420, 108, "分解", "middle", 9, MUT),
    T(640, 56, "スペクトル（成分ごとの大きさ）", "middle", 10.5, INK, True),
    SPEC(480, 175, 320, 100, [(0.08,1.0),(0.24,0.55,GRN),(0.40,0.38),(0.56,0.26,GRN),(0.72,0.16),(0.88,0.10,GRN)], 14),
    T(506, 190, "基音 110", "middle", 8.5, FNT), T(557, 190, "220", "middle", 8.5, FNT), T(608, 190, "330", "middle", 8.5, FNT),
    T(659, 190, "440", "middle", 8.5, FNT), T(710, 190, "550", "middle", 8.5, FNT), T(761, 190, "660 Hz", "middle", 8.5, FNT),
    T(640, 215, "青 = 偶数次（豊かさ）、金 = 基音と奇数次（硬さ・エッジ）", "middle", 9.5, MUT),
    T(430, 244, "音色 = 倍音のバランス。エフェクトの半分は倍音の操作である", "middle", 11, MUT, True),
], "同じ音を時間軸と周波数軸で見る。整数倍の成分（倍音）のバランスが音色")

F["e02_envelope"] = SVG(860, 230, [
    T(430, 26, "エンベロープ — 1 音の音量の時間変化", "middle", 12.5, INK, True),
    AXES(80, 180, 700, 120, "時間", "音量"),
    PL([(80,180),(110,72),(150,105),(430,128),(700,176)], SIG, 2.2),
    T(108, 62, "アタック", "middle", 9.5, GRN, True),
    T(160, 96, "ディケイ", "middle", 9.5, MUT),
    T(300, 118, "サステイン（減衰しながら伸びる）", "middle", 9.5, MUT),
    T(600, 158, "リリース（消え際）", "middle", 9.5, MUT),
    T(430, 215, "コンプレッサー（6 章）はこの形を作り変える道具。「アタックを残す/潰す」はこのグラフ上の操作", "middle", 10.5, MUT),
], "ピッキングの「ツン」がアタック、減衰していく尾がサステイン。コンプの彫刻対象")

F["e02_freqmap"] = SVG(860, 250, [
    T(430, 26, "周波数の地図 — ギターの音はどこにいるか", "middle", 12.5, INK, True),
    BYTES(40, 70, [("低域", 100, LIN, PAN, "60–150"), ("中低域", 110, LIN, PAN, "150–400"),
                   ("中域＝芯", 150, SIG, SSOFT, "400–1k"), ("中高域＝おいしい", 170, SIG, SSOFT, "1k–3k"),
                   ("高域", 130, LIN, PAN, "3k–6k"), ("超高域", 120, FNT, "none", "6k– [Hz]")], 34, 10, 8.5)[0],
    T(90, 135, "ベースの土台/ボワつき", "middle", 8.5, FNT),
    T(200, 135, "厚み/こもり", "middle", 8.5, FNT),
    T(330, 135, "抜けはここ", "middle", 8.5, FNT),
    T(490, 135, "アタック感/刺さり", "middle", 8.5, FNT),
    T(640, 135, "ギラつき", "middle", 8.5, FNT),
    T(760, 135, "空気感", "middle", 8.5, FNT),
    BOX(40, 160, 780, 60, "ギターアンプのスピーカーは 5 kHz あたりから上をほぼ出さない",
        "この強烈なローパスが、歪みの高次倍音の汚い部分を捨てている（4 章）。ライン録りにキャビネットシミュレータが必須の理由", GRN, "none", INK, 8, 1.4, 11.5, 10),
], "「何 Hz を削る/足す」の会話に使う地図。スピーカーの帯域制限も音作りの一部")

# ===================== 03 =====================

F["e03_headroom"] = SVG(860, 260, [
    T(430, 26, "ヘッドルーム — 潰れ始めるまでの余白", "middle", 12.5, INK, True),
    # left: small signal
    W(60, 60, 380, 60, c=ALI, lw=1.4, dash="6,4"), W(60, 180, 380, 180, c=ALI, lw=1.4, dash="6,4"),
    T(70, 52, "回路の上限（電源で決まる）", "start", 9, ALI),
    MIDLINE(60, 120, 320), sine(60, 120, 320, 3, 28, SIG, 2),
    DIM(390, 60, 390, 92, None, GRN, 9), T(398, 80, "余白 = ヘッドルーム", "start", 9, GRN),
    T(220, 215, "小さい信号: そのまま増幅される（リニア）", "middle", 9.5, MUT),
    # right: big signal
    W(480, 60, 800, 60, c=ALI, lw=1.4, dash="6,4"), W(480, 180, 800, 180, c=ALI, lw=1.4, dash="6,4"),
    MIDLINE(480, 120, 320),
    FWAVE(480, 120, 320, 120, clip_sine(3, 1.6, False), 240, SIG, 2),
    T(640, 215, "上限に達した信号: 頭が潰れる（クリッピング → 4 章）", "middle", 9.5, MUT),
    T(430, 245, "ブースターは「次の段のヘッドルームを食い潰す」道具", "middle", 11, MUT, True),
], "上限までの余白がヘッドルーム。超えた部分は潰れて歪みになる")

F["e03_position"] = SVG(860, 270, [
    T(430, 26, "同じブースターでも、置き場所で仕事が変わる", "middle", 12.5, INK, True),
    T(90, 70, "歪みの後ろ:", "start", 10.5, INK, True),
    PEDAL(200, 50, 110, 56, "歪み", ALI, ASOFT), ARR(310, 78, 340, 78, MUT, 1.5),
    PEDAL(340, 50, 110, 56, "ブースター"), ARR(450, 78, 480, 78, MUT, 1.5),
    T(560, 74, "音量が上がる（歪みは不変）", "start", 10, GRN),
    T(560, 90, "→ ソロ用 +4〜6 dB", "start", 9, FNT),
    T(90, 150, "歪みの前:", "start", 10.5, INK, True),
    PEDAL(200, 130, 110, 56, "ブースター"), ARR(310, 158, 340, 158, MUT, 1.5),
    PEDAL(340, 130, 110, 56, "歪み/アンプ", ALI, ASOFT), ARR(450, 158, 480, 158, MUT, 1.5),
    T(560, 150, "歪みが深くなる（音量はほぼ不変。", "start", 10, GRN),
    T(560, 166, "後段が飽和して頭打ち）→「アンプをプッシュ」", "start", 9, FNT),
    BOX(40, 205, 780, 48, "トレブルブースターは「低域を削ってから増幅」",
        "歪ませる前に低域を削ると歪みが整理される——歪み系全体で使う原理（4 章の TS 系へ続く）", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
], "後ろに置けば音量、前に置けば歪みの深さ。1 章の「順番がすべて」の最初の実例")

# ===================== 04 =====================

F["e04_clip"] = SVG(860, 260, [
    T(430, 26, "歪み = クリッピング = 倍音の追加", "middle", 12.5, INK, True),
    T(180, 56, "波形（潰れるほど四角へ）", "middle", 10, INK, True),
    MIDLINE(50, 115, 260),
    FWAVE(50, 115, 260, 90, clip_sine(2, 1.0, False), 200, LIN, 1.4),
    FWAVE(50, 115, 260, 90, clip_sine(2, 3.0, True), 200, SIG, 2),
    T(180, 185, "薄い線 = 原音、金 = 歪み後", "middle", 8.5, FNT),
    ARR(330, 115, 380, 115, MUT, 1.8),
    T(560, 56, "スペクトル（倍音が足される）", "middle", 10, INK, True),
    SPEC(420, 165, 380, 95, [(0.06,1.0),(0.18,0.45,ALI),(0.30,0.55,ALI),(0.42,0.30,ALI),(0.54,0.35,ALI),(0.66,0.22,ALI),(0.78,0.24,ALI),(0.90,0.15,ALI)], 12),
    T(443, 180, "基音", "middle", 8.5, FNT),
    T(610, 180, "赤 = クリッピングで生まれた倍音", "middle", 8.5, ALI),
    T(430, 225, "「太い・伸びる・攻撃的」はすべて足された倍音の聞こえ方", "middle", 10.5, MUT),
], "頭を潰した波形には、元の音になかった倍音がぎっしり乗る")

F["e04_softhard"] = SVG(860, 280, [
    T(430, 26, "ソフトクリップとハードクリップ", "middle", 12.5, INK, True),
    T(220, 56, "ソフト（オーバードライブ）", "middle", 10.5, SIG, True),
    MIDLINE(60, 125, 320),
    FWAVE(60, 125, 320, 100, clip_sine(2, 2.2, True), 240, SIG, 2),
    T(220, 195, "なだらかに丸まる。低次倍音中心・穏やか", "middle", 9, MUT),
    T(220, 212, "帰還路のダイオード / 真空管の自然な飽和", "middle", 8.5, FNT),
    T(640, 56, "ハード（ディストーション）", "middle", 10.5, ALI, True),
    MIDLINE(480, 125, 320),
    FWAVE(480, 125, 320, 100, clip_sine(2, 4.0, False), 240, ALI, 2),
    T(640, 195, "スパッと切れる。高次までギラギラ", "middle", 9, MUT),
    T(640, 212, "グラウンドへのダイオード / 電源での頭打ち", "middle", 8.5, FNT),
    T(430, 250, "非対称に潰す（上下で違う高さ）と偶数次倍音が乗り「チューブっぽく」なる", "middle", 10.5, MUT),
], "潰し方の違い = 倍音の違い = OD と DS の違い。原理は同じ")

F["e04_circuits"] = SVG(860, 300, [
    T(430, 26, "2 大流儀 — TS 系と RAT 系", "middle", 12.5, INK, True),
    T(220, 58, "Tube Screamer 系", "middle", 11, SIG, True),
    flowdown(220, 70, [("オペアンプ増幅 + 帰還路にダイオード", "ソフトクリップ", SIG, SSOFT),
                       ("前後で低域・高域をカット", "→ 700 Hz〜1 kHz の山（ミッドブースト）", SIG, SSOFT)], 340, 50, 22, sz=10.5, ssz=9)[0],
    T(220, 240, "単体では鼻づまり、アンプの前で真価（低域整理 + プッシュ）", "middle", 9, MUT),
    T(640, 58, "RAT / DS-1 系", "middle", 11, ALI, True),
    flowdown(640, 70, [("オペアンプで大きく増幅（〜1000 倍）", None, ALI, ASOFT),
                       ("後ろでグラウンドへダイオード", "ハードクリップ", ALI, ASOFT)], 340, 50, 22, sz=10.5, ssz=9)[0],
    T(640, 240, "密度の高い歪み + 最後にトーン（ローパス）", "middle", 9, MUT),
    T(430, 272, "クリッピング素子の順方向電圧 = 潰れ始めの高さ: ゲルマ 0.3 V（甘い）/ シリコン 0.6 V / LED 1.8 V（開放的）", "middle", 10, MUT),
], "帰還路のソフトクリップ + ミッドブーストが TS、増幅後のハードクリップが RAT")

# ===================== 05 =====================

F["e05_square"] = SVG(860, 240, [
    T(430, 26, "ファズ = ほぼ矩形波", "middle", 12.5, INK, True),
    MIDLINE(60, 110, 320),
    FWAVE(60, 110, 320, 100, clip_sine(2, 12.0, False), 400, SIG, 2),
    T(220, 180, "上下とも深く潰れ、スイッチのオンオフに近い", "middle", 9.5, MUT),
    SPEC(480, 160, 320, 100, [(0.05,1.0),(0.15,0.75,ALI),(0.25,0.62,ALI),(0.35,0.52,ALI),(0.45,0.45,ALI),(0.55,0.38,ALI),(0.65,0.33,ALI),(0.75,0.28,ALI),(0.85,0.25,ALI),(0.95,0.22,ALI)], 10),
    T(640, 180, "倍音は高次までびっしり——ブザー/シンセの質感", "middle", 9.5, MUT),
    T(430, 218, "3 系統: Fuzz Face（2 石）/ Tone Bender（3 石）/ Big Muff（4 段・ミッドスクープの壁）", "middle", 10.5, MUT),
], "動作点をずらした数石の増幅器が波形を矩形波まで潰す")

F["e05_interact"] = SVG(860, 260, [
    T(430, 26, "ファズはギターと「相互作用」する", "middle", 12.5, INK, True),
    BOX(50, 70, 190, 70, "ギターのボリューム", "絞ると回路との関係そのものが変わる", GRN, "none", INK, 8, 1.5, 11.5, 9.5),
    DARR(240, 105, 320, 105, SIG, 2),
    BOX(320, 70, 220, 70, "Fuzz Face（入力インピーダンス極小）", "ピックアップと直結の生き物", SIG, SSOFT, INK, 8, 1.5, 10.5, 9.5),
    stack(580, 56, 240, [("Vol 10: 轟音ファズ", None, ALI, ASOFT),("Vol 7: クランチ", None, SIG, SSOFT),("Vol 5: ほぼクリーン", None, LIN, PAN)], 34, 5)[0],
    BOX(50, 170, 770, 60, "だからバッファ・ワイヤレスを前に入れると「ただの汚い歪み」になる",
        "相互作用の条件（ハイインピーダンス直結）が消えるため。ファズはチェーン先頭・ギター直結が原則（19 章）。音の好みでなく回路の動作条件", ALI, ASOFT, INK, 8, 1.5, 11.5, 10),
], "手元のボリュームで 1 台 3 役。その代償が「直結でないと動かない」")

# ===================== 06 =====================

F["e06_curve"] = SVG(860, 280, [
    T(430, 26, "コンプレッサーの入出力カーブ", "middle", 12.5, INK, True),
    AXES(110, 230, 300, 180, "入力 (dB)", "出力 (dB)"),
    PL([(110,230),(410,50)], LIN, 1.4, "5,4"),
    T(360, 66, "1:1（何もしない）", "middle", 8.5, FNT),
    PL([(110,230),(260,140),(410,110)], SIG, 2.4),
    D(260, 140, ALI, 4.5),
    T(268, 132, "スレッショルド", "start", 9.5, ALI),
    T(345, 98, "レシオ 4:1（超過 8 dB → 2 dB）", "middle", 9, SIG),
    stack(490, 60, 330, [("スレッショルド", "ここより大きい音だけ圧縮", SIG, SSOFT),
                         ("レシオ", "超えた分を何分の 1 に。∞:1 = リミッター", SIG, SSOFT),
                         ("アタック / リリース", "効き始め / 戻りの速さ（下図）", GRN, "none"),
                         ("メイクアップ", "下がった分を持ち上げる", LIN, PAN)], 40, 5)[0],
], "閾値の上をレシオで縮める自動フェーダー。持ち上げれば「小さい音が上がった」ように聞こえる")

F["e06_envelope"] = SVG(860, 260, [
    T(430, 26, "アタック/リリースはエンベロープの彫刻刀", "middle", 12.5, INK, True),
    T(230, 56, "アタック遅め（20〜30 ms）", "middle", 10.5, SIG, True),
    AXES(70, 190, 320, 120, None, None),
    PL([(70,190),(95,80),(130,120),(390,150)], LIN, 1.4, "5,4"),
    PL([(70,190),(95,80),(112,84),(130,142),(390,158)], SIG, 2.2),
    T(102, 68, "頭が通り抜ける「パコッ」", "start", 9, GRN),
    T(230, 215, "ピッキングを残して後を潰す — ファンク/カントリー", "middle", 9, MUT),
    T(650, 56, "アタック速め", "middle", 10.5, ALI, True),
    AXES(490, 190, 320, 120, None, None),
    PL([(490,190),(515,80),(550,120),(810,150)], LIN, 1.4, "5,4"),
    PL([(490,190),(500,132),(530,138),(810,152)], ALI, 2.2),
    T(650, 215, "頭から潰す — 粒は完全に揃うがノペッとする", "middle", 9, MUT),
    T(430, 245, "「伸びる」= 圧縮 + メイクアップで消え際が持ち上がること。ノイズも一緒に上がる", "middle", 10.5, MUT),
], "破線 = 元のエンベロープ。アタック時間で「頭を残すか潰すか」を選ぶ")

# ===================== 07 =====================

F["e07_gate"] = SVG(860, 270, [
    T(430, 26, "ノイズゲート — 閾値以下を閉じる", "middle", 12.5, INK, True),
    AXES(70, 200, 700, 140, "時間", "音量"),
    W(70, 160, 770, 160, c=ALI, lw=1.3, dash="6,4"), T(80, 152, "スレッショルド（開く）", "start", 8.5, ALI),
    W(70, 172, 770, 172, c=GRN, lw=1.3, dash="6,4"), T(80, 186, "閉じる閾値（数 dB 低く = ヒステリシス）", "start", 8.5, GRN),
    # noise floor then playing then decay then noise
    PL([(70,192),(180,190),(185,90),(300,110),(420,150),(500,168),(560,178),(770,190)], SIG, 2),
    RECT(70, 60, 112, 140, 0, ASOFT, "none", 0), T(126, 76, "閉", "middle", 10, ALI, True),
    RECT(556, 60, 214, 140, 0, ASOFT, "none", 0), T(660, 76, "閉", "middle", 10, ALI, True),
    T(360, 76, "開（演奏中はノイズがマスクされる）", "middle", 9.5, MUT),
    T(430, 240, "副作用 = 余韻の切断。メタルの刻みでは武器、クリーンでは不自然。置き場所は「歪みの後ろ・空間系の前」", "middle", 10.5, MUT),
], "弾いていない瞬間だけ黙らせる。ヒステリシスでバタつき（チャタリング）を防ぐ")

# ===================== 08 =====================

F["e08_types"] = SVG(860, 260, [
    T(430, 26, "フィルタの基本形", "middle", 12.5, INK, True),
    T(175, 56, "シェルビング（棚）", "middle", 10, INK, True),
    AXES(60, 170, 230, 100, None, None), MIDLINE(60, 120, 230),
    PL([(60,120),(150,120),(200,95),(290,95)], SIG, 2.2),
    T(175, 192, "Bass/Treble ツマミの正体", "middle", 8.5, FNT),
    T(455, 56, "ピーキング（山/谷）", "middle", 10, INK, True),
    AXES(340, 170, 230, 100, None, None), MIDLINE(340, 120, 230),
    FWAVE(340, 120, 230, 70, lambda u: math.exp(-((u-0.5)/0.13)**2)*0.9, 150, SIG, 2.2),
    DARR(415, 96, 495, 96, GRN, 1.2), T(455, 88, "幅 = Q", "middle", 8.5, GRN),
    T(455, 192, "Mid・パラメトリックの正体", "middle", 8.5, FNT),
    T(735, 56, "パス系（切り落とし）", "middle", 10, INK, True),
    AXES(620, 170, 230, 100, None, None), MIDLINE(620, 120, 230),
    PL([(620,168),(680,165),(720,122),(850,120)], SIG, 2.2),
    T(735, 192, "ハイパス（低域の掃除）", "middle", 8.5, FNT),
    T(430, 235, "グラフィック = 絵を描く（固定帯域のスライダー列）、パラメトリック = 狙撃（周波数・量・Q を自由に）", "middle", 10.5, MUT),
], "EQ はこの 3 形の詰め合わせ。横軸は周波数、縦軸は音量の増減")

F["e08_tonestack"] = SVG(860, 240, [
    T(430, 26, "アンプのトーンスタックは「全部 5」でもフラットではない", "middle", 12.5, INK, True),
    AXES(110, 180, 640, 120, "周波数", "dB"),
    MIDLINE(110, 120, 640),
    FWAVE(110, 120, 640, 90, lambda u: 0.35 - 0.75*math.exp(-((u-0.45)/0.22)**2) + 0.30*u, 300, SIG, 2.2),
    T(400, 168, "中域が数 dB 凹むのが標準（ミッドスクープ）", "middle", 9.5, MUT),
    T(430, 212, "3 ツマミは相互干渉する受動回路。フラットが欲しければ Mid 上げ気味。ギターのトーンはコンデンサ 1 個のローパス", "middle", 10, MUT),
], "Fender/Marshall 系の Bass/Mid/Treble は干渉し、直感どおりには動かない")

# ===================== 09 =====================

F["e09_wah"] = SVG(860, 260, [
    T(430, 26, "ワウ = 動くレゾナンス付きフィルタ", "middle", 12.5, INK, True),
    AXES(110, 190, 640, 130, "周波数", "dB"),
    MIDLINE(110, 140, 640),
    FWAVE(110, 140, 640, 110, lambda u: max(-0.35, 1.0*math.exp(-((u-0.28)/0.09)**2)-0.35), 300, LIN, 1.6),
    FWAVE(110, 140, 640, 110, lambda u: max(-0.35, 1.0*math.exp(-((u-0.55)/0.09)**2)-0.35), 300, SIG, 2.2),
    ARR(320, 70, 440, 70, GRN, 2),
    T(380, 60, "ペダルで山が動く（400 Hz〜2 kHz）", "middle", 9.5, GRN),
    T(240, 96, "戻す", "middle", 9, FNT), T(505, 96, "踏み込む", "middle", 9, SIG),
    T(430, 218, "強調帯域が動く = 母音（フォルマント）の変化に聞こえる。「あ→お→う」と同じ物理", "middle", 10.5, MUT),
    T(430, 240, "Q（山の鋭さ）がクセの量。歪みの前に置くと山の帯域だけ深く歪む（ジミヘンのギラつき）", "middle", 10, FNT),
], "レゾナンスの山をペダルで掃引する。動く共振 = しゃべっているように聞こえる")

F["e09_variants"] = SVG(860, 250, [
    T(430, 26, "「動くフィルタ」の動かし方で別のエフェクトになる", "middle", 12.5, INK, True),
    BOX(330, 60, 200, 56, "レゾナンス付きフィルタ", "共振の山", SIG, SSOFT, INK, 8, 1.6, 12, 9.5),
    ARR(240, 158, 380, 118, MUT, 1.5), ARR(430, 170, 430, 118, MUT, 1.5), ARR(620, 158, 480, 118, MUT, 1.5),
    BOX(120, 160, 190, 56, "足で動かす", "ワウペダル", GRN, "none", INK, 8, 1.4, 11.5, 9.5),
    BOX(335, 172, 190, 62, "音量で動かす", "エンベロープフィルタ / タッチワウ（ファンク）", GRN, "none", INK, 8, 1.4, 11, 9),
    BOX(550, 160, 190, 56, "LFO / 乱数で動かす", "オートワウ / サンプル&ホールド", GRN, "none", INK, 8, 1.4, 11, 9),
    T(430, 245, "止めればフィクスドワウ（強いピーキング EQ）。エンベロープフィルタは Sensitivity 合わせが 9 割", "middle", 10, MUT),
], "同じフィルタでも、足・エンベロープ・LFO・乱数のどれで動かすかで名前が変わる")

# ===================== 10 =====================

F["e10_lfo"] = SVG(860, 315, [
    T(430, 26, "LFO — 聞こえない周波数（0.1〜10 Hz）で何かを揺らす", "middle", 12.5, INK, True),
    LFOICON(120, 100, 60),
    T(120, 150, "LFO", "middle", 10.5, GRN, True),
    ARR(170, 100, 240, 100, GRN, 1.8),
    stack(240, 48, 280, [("音量を揺らす", "トレモロ（本章）", SIG, SSOFT),
                         ("音程（遅延）を揺らす", "ビブラート（本章）→ コーラス（11 章）", SIG, SSOFT),
                         ("位相を揺らす", "フェイザー（13 章）", LIN, PAN),
                         ("フィルタを揺らす", "オートワウ（9 章）", LIN, PAN),
                         ("定位を揺らす", "オートパン", LIN, PAN)], 38, 5)[0],
    T(660, 56, "LFO の波形も音色", "middle", 10.5, INK, True),
    sine(570, 90, 180, 2, 14, SIG, 1.8), T(770, 94, "滑らか", "start", 8.5, FNT),
    PL([(570,130),(615,130),(615,116),(660,116),(660,130),(705,130),(705,116),(750,116)], ALI, 1.8), T(770, 127, "スライサー的", "start", 8.5, FNT),
    PL([(570,160),(600,148),(600,160),(630,150),(630,162),(665,146),(665,158),(700,152),(700,164),(750,150)], GRN, 1.8), T(770, 160, "ランダム", "start", 8.5, FNT),
    T(430, 292, "モジュレーション系はすべて「LFO が何を揺らすか」の一覧で整理できる", "middle", 11, MUT, True),
], "モジュレーション系の心臓。揺らす対象と波形の組み合わせがエフェクト名になる")

F["e10_vibrato"] = SVG(860, 250, [
    T(430, 26, "ビブラートの実装 = 遅延時間の変調（ドップラー）", "middle", 12.5, INK, True),
    BOX(60, 80, 120, 50, "入力", None, LIN, PAN),
    ARR(180, 105, 240, 105, MUT, 1.6),
    BOX(240, 70, 220, 70, "短い遅延（数 ms）", "遅延時間を LFO で伸び縮み", SIG, SSOFT, INK, 8, 1.6, 12, 9.5),
    LFOICON(350, 190, 50), ARR(350, 168, 350, 142, GRN, 1.8),
    ARR(460, 105, 520, 105, MUT, 1.6),
    BOX(520, 80, 160, 50, "出力（100 % Wet）", "揺れる音程", GRN, "none", INK, 8, 1.4, 11, 9.5),
    T(430, 232, "遅延が増え続けている間は低く、減り続けている間は高く聞こえる。これを原音と混ぜればコーラス（11 章）", "middle", 10.5, MUT),
], "音程を直接は変えられないので、遅延の伸び縮みで作る。コーラスへの伏線")

# ===================== 11 =====================

F["e11_chorus"] = SVG(860, 270, [
    T(430, 26, "コーラス = 原音 + 揺れる 10〜30 ms の遅延", "middle", 12.5, INK, True),
    BOX(50, 100, 100, 46, "入力", None, LIN, PAN),
    W(150, 123, 200, 123, c=MUT, lw=1.6), D(200, 123, MUT, 4),
    W(200, 123, 250, 83, c=MUT, lw=1.6), W(200, 123, 250, 163, c=MUT, lw=1.6),
    BOX(250, 62, 180, 42, "Dry（そのまま）", None, LIN, PAN),
    BOX(250, 142, 180, 52, "遅延 10〜30 ms", "LFO で揺らす = ビブラート", SIG, SSOFT, INK, 8, 1.5, 11, 9),
    LFOICON(340, 238, 44), ARR(340, 218, 340, 196, GRN, 1.6),
    W(430, 83, 520, 113, c=MUT, lw=1.6), W(430, 168, 520, 133, c=MUT, lw=1.6),
    CIRC(535, 123, 15, INK, 1.6), T(535, 128, "＋", "middle", 13, INK, True),
    ARR(550, 123, 600, 123, MUT, 1.6),
    BOX(600, 100, 110, 46, "出力", "厚み・うねり", GRN, "none", INK, 8, 1.4, 11.5, 9),
    T(770, 100, "Mix 100% で", "middle", 8.5, FNT), T(770, 114, "ビブラートに戻る", "middle", 8.5, FNT),
    T(430, 258, "合唱の「タイミングと音程のずれの変動」を 1 台で再現。Rate = うねりの速さ、Depth = 音程のずれ幅", "middle", 10.5, MUT),
], "1 章の「分岐→加工→混合」+ 10 章のビブラートで組み上がる")

F["e11_bbd"] = SVG(860, 240, [
    T(430, 26, "BBD — コンデンサのバケツリレー", "middle", 12.5, INK, True),
    BOX(60, 70, 90, 44, "入力", None, LIN, PAN),
    HEXROW(160, 74, [("C1",SIG,SSOFT),("C2",SIG,SSOFT),("C3",SIG,SSOFT),("…",LIN,PAN),("C512",SIG,SSOFT),("C1024",SIG,SSOFT)], 78, 36, 10)[0],
    ARR(628, 92, 680, 92, MUT, 1.6),
    BOX(680, 70, 110, 44, "出力（遅れた音）", None, GRN, "none", INK, 8, 1.3, 10.5, 9),
    T(394, 132, "クロックで電荷を隣へ順送り。遅延 = 段数 ÷ クロック周波数", "middle", 9.5, MUT),
    BOX(60, 155, 760, 60, "クロックを LFO で揺らせば遅延が揺れる（コーラスに最適）。段を通るたび高域が落ちノイズが乗る",
        "この劣化こそ「アナログコーラス/ディレイの温かさ」の正体。デジタル機はわざわざ劣化をモデリングする", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
], "デジタル以前の遅延素子。CE-2・Small Clone・DM-2 の心臓部")

# ===================== 12 =====================

F["e12_comb"] = SVG(860, 300, [
    T(430, 26, "原音 + 短い遅延 = コムフィルタ（櫛形）", "middle", 12.5, INK, True),
    AXES(110, 170, 640, 110, "周波数", "dB"),
    FWAVE(110, 118, 640, 95, lambda u: math.cos(2*math.pi*5.5*u)*0.9, 500, SIG, 2),
    T(220, 60, "谷 = 半波長ずれて打ち消す周波数（1/2t, 3/2t, 5/2t…）", "start", 9.5, MUT),
    ARR(350, 196, 440, 196, GRN, 1.8), ARR(440, 196, 350, 196, GRN, 1.8),
    T(500, 198, "LFO で t が揺れる → 櫛が伸び縮みして掃引 = ジェット音", "start", 9.5, GRN),
    BOX(60, 215, 380, 66, "t = 1 ms（フランジャー）",
        "谷が 500 Hz, 1.5k, 2.5k… → 可聴域に数本。はっきり聞こえる", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    BOX(460, 215, 360, 66, "t = 20 ms（コーラス）",
        "谷が 25 Hz 間隔でびっしり → 個々は聞こえず「厚み」になる", GRN, "none", INK, 8, 1.5, 11.5, 9.5),
], "遅延の長さだけで、同じ干渉が「フランジャー」と「コーラス」に化ける。フィードバックは山を尖らせる")

# ===================== 13 =====================

F["e13_phaser"] = SVG(860, 300, [
    T(430, 26, "フェイザー = オールパス数段 + 原音ミックス", "middle", 12.5, INK, True),
    BOX(50, 70, 90, 44, "入力", None, LIN, PAN),
    W(140, 92, 175, 92, c=MUT, lw=1.5), D(175, 92, MUT, 4),
    W(175, 92, 175, 170, c=MUT, lw=1.5),
    HEXROW(200, 70, [("AP1",SIG,SSOFT),("AP2",SIG,SSOFT),("AP3",SIG,SSOFT),("AP4",SIG,SSOFT)], 70, 44, 10)[0],
    T(340, 132, "オールパス: 音量そのまま・位相だけ回す。LFO で回る周波数を揺らす", "middle", 9, MUT),
    LFOICON(340, 175, 40),
    W(480, 92, 540, 92, c=MUT, lw=1.5),
    W(175, 170, 540, 170, c=MUT, lw=1.5),
    CIRC(555, 130, 15, INK, 1.6), T(555, 135, "＋", "middle", 13, INK, True),
    W(540, 92, 552, 118, c=MUT, lw=1.5), W(540, 170, 552, 143, c=MUT, lw=1.5),
    ARR(570, 130, 620, 130, MUT, 1.6),
    BOX(620, 108, 110, 44, "出力", None, GRN, "none"),
    AXES(110, 275, 640, 55, None, None),
    FWAVE(110, 248, 640, 45, lambda u: 0.8 - 1.7*(math.exp(-((u-0.22)/0.035)**2) + math.exp(-((u-0.58)/0.05)**2)), 400, SIG, 2),
    T(700, 240, "ノッチは段数の半分・不等間隔", "middle", 8.5, MUT),
], "位相 180° の周波数にノッチ。フランジャー（多数・等間隔）と違い数本だけ——「うねり」の質感")

# ===================== 14 =====================

F["e14_leslie"] = SVG(860, 300, [
    T(430, 26, "レスリー = 回転が生む 4 つの同時変調", "middle", 12.5, INK, True),
    CIRC(180, 130, 55, SIG, 2), ARR(228, 105, 218, 90, SIG, 2),
    T(180, 135, "回転ホーン", "middle", 10, INK, True),
    T(180, 205, "高域: ホーンが回る / 低域: ドラムが回る（別モーター・別速度）", "middle", 9, MUT),
    stack(330, 52, 490, [("音程（ビブラート）", "近づく/遠ざかるドップラー効果", SIG, SSOFT),
                         ("音量（トレモロ）", "距離と向きの変化", SIG, SSOFT),
                         ("音色（フィルタ）", "ホーンの指向性——正面の瞬間だけ高域が届く", GRN, "none"),
                         ("定位（パン）", "部屋の反射ごと音の方向が回る", GRN, "none")], 44, 6)[0],
    T(430, 262, "1 つの回転から全部が相関して導かれる——単品エフェクトの直列では似ない理由", "middle", 10.5, MUT),
    T(430, 284, "Chorale 0.7 回転/秒 ⇄ Tremolo 6.7 回転/秒。切り替えの加減速の慣性も音の一部", "middle", 10, FNT),
], "トレモロ+ビブラート+オートワウ+オートパンを物理現象として同時に起こす")

F["e14_univibe"] = SVG(860, 240, [
    T(430, 26, "ユニヴァイブ = 電球と光で揺らす不均一フェイザー", "middle", 12.5, INK, True),
    CIRC(160, 110, 26, SIG, 1.8), T(160, 116, "電球", "middle", 9.5, INK, True),
    T(160, 158, "LFO で明滅", "middle", 8.5, MUT),
    ARR(190, 100, 250, 80, GRN, 1.4), ARR(192, 108, 250, 108, GRN, 1.4), ARR(190, 118, 250, 136, GRN, 1.4), ARR(185, 126, 248, 162, GRN, 1.4),
    stack(250, 62, 200, [("光抵抗 1 → AP1", None, LIN, PAN),("光抵抗 2 → AP2", None, LIN, PAN),("光抵抗 3 → AP3", None, LIN, PAN),("光抵抗 4 → AP4", None, LIN, PAN)], 28, 4)[0],
    BOX(500, 62, 320, 120, "わざと不均一",
        "電球の応答は非対称（点くのは速く、余熱で消えるのは遅い）。4 段のコンデンサ値もバラバラ。結果 = 脈打つ有機的なうねり——レスリーには似なかったが別の名機に", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    T(430, 214, "Machine Gun（ジミヘン）、Breathe（フロイド）。Rate 遅め + 歪みの前が Hendrix 流", "middle", 10, MUT),
], "フェイザーの親戚だが、電球+光抵抗の非対称と設計のバラつきが個性")

# ===================== 15 =====================

F["e15_analog"] = SVG(860, 280, [
    T(430, 26, "アナログのオクターブ — 波形の細工", "middle", 12.5, INK, True),
    T(220, 56, "1 オクターブ上 = 全波整流", "middle", 10.5, SIG, True),
    MIDLINE(60, 110, 320),
    FWAVE(60, 110, 320, 70, lambda u: math.sin(2*math.pi*2*u), 200, LIN, 1.4),
    FWAVE(60, 110, 320, 70, lambda u: abs(math.sin(2*math.pi*2*u)), 200, SIG, 2.2),
    T(220, 165, "マイナス側を折り返す → 周期が半分 = 2 倍の高さ", "middle", 9, MUT),
    T(220, 182, "Octavia / Green Ringer。癖のある「鳴き」", "middle", 8.5, FNT),
    T(640, 56, "1 オクターブ下 = フリップフロップ（分周）", "middle", 10.5, GRN, True),
    MIDLINE(480, 100, 320),
    FWAVE(480, 100, 320, 44, lambda u: math.sin(2*math.pi*4*u), 200, LIN, 1.4),
    MIDLINE(480, 160, 320),
    PL([(480,142),(560,142),(560,178),(640,178),(640,142),(720,142),(720,178),(800,178)], GRN, 2.2),
    T(640, 205, "山を数えて 2 回に 1 回反転 → 周期 2 倍の矩形波", "middle", 9, MUT),
    T(640, 222, "BOSS OC-2。ブーッとしたシンセ的な下の音。単音のみ", "middle", 8.5, FNT),
    T(430, 255, "三種の神器「単音・ネック PU・トーン絞り」——倍音が少ないほどトラッキングが安定", "middle", 10.5, MUT),
], "整流で上、分周で下。オクターブ限定・単音限定の職人芸")

F["e15_grain"] = SVG(860, 270, [
    T(430, 26, "デジタルピッチシフト — 録って速度を変えてつなぐ", "middle", 12.5, INK, True),
    RECT(60, 70, 500, 40, 4, SCR, LIN, 1.3),
    T(310, 62, "バッファ（録音し続ける）", "middle", 9.5, MUT),
    ARR(90, 130, 130, 112, SIG, 1.6), T(85, 148, "書き込み", "start", 9, MUT),
    ARR(300, 130, 340, 112, GRN, 1.6), T(295, 148, "違う速度で読み出し（速く=高く）", "start", 9, GRN),
    HEXROW(600, 70, [("粒",SIG,SSOFT),("粒",GRN,"none"),("粒",SIG,SSOFT),("粒",GRN,"none")], 55, 40, 9.5)[0],
    T(710, 130, "追いつく前に短い断片（グレイン）", "middle", 8.5, MUT),
    T(710, 145, "に切ってつなぎ直す", "middle", 8.5, MUT),
    BOX(60, 175, 760, 62, "宿命 2 つ: レイテンシ（溜めてから読むので必ず遅れる）と、つなぎ目の揺らぎ（グリッチ）",
        "つなぎ目を賢く選ぶほど自然 = 高品質シフト。和音を 1 音ずつ動かすポリフォニック対応は近年の DSP の進歩", SIG, SSOFT, INK, 8, 1.5, 11.5, 10),
    T(430, 258, "ハーモナイザー = キーとスケールを知っているピッチシフター。ワーミー = ペダルで連続シフト", "middle", 10, MUT),
], "任意の音程差が作れる代わりに、遅れとつなぎ目が宿命")

# ===================== 16 =====================

F["e16_delay"] = SVG(860, 280, [
    T(430, 26, "ディレイ = 遅延線 + フィードバックループ", "middle", 12.5, INK, True),
    BOX(50, 90, 100, 46, "入力", None, LIN, PAN),
    CIRC(190, 113, 14, INK, 1.5), T(190, 118, "＋", "middle", 12, INK, True),
    W(150, 113, 176, 113, c=MUT, lw=1.5),
    ARR(204, 113, 250, 113, MUT, 1.5),
    BOX(250, 90, 170, 46, "遅延（Time）", "100 ms〜", SIG, SSOFT, INK, 8, 1.4, 11.5, 9),
    W(420, 113, 470, 113, c=MUT, lw=1.5), D(470, 113, MUT, 4),
    ARR(470, 113, 530, 113, MUT, 1.5),
    CIRC(545, 113, 14, INK, 1.5), T(545, 118, "＋", "middle", 12, INK, True),
    ARR(559, 113, 610, 113, MUT, 1.5),
    BOX(610, 90, 100, 46, "出力", None, GRN, "none"),
    W(470, 113, 470, 185, c=ALI, lw=1.8), W(470, 185, 190, 185, c=ALI, lw=1.8), ARR(190, 185, 190, 128, ALI, 1.8),
    T(330, 200, "Feedback（戻す量 = 繰り返し回数。100 % 超で発振 = ダブの奏法）", "middle", 9.5, ALI),
    W(60, 160, 110, 160, c=MUT, lw=1.5), W(110, 160, 530, 160, c=LIN, lw=1.2, dash="4,4"), W(530, 160, 540, 127, c=LIN, lw=1.2, dash="4,4"),
    T(300, 152, "Dry（原音）", "middle", 8.5, FNT),
    BOX(50, 225, 770, 42, "遅延の長さだけの違い: 0.5〜5 ms=フランジャー / 10〜30 ms=コーラス / 30〜100 ms=スラップバック / 100 ms〜=やまびこ",
        None, LIN, PAN, INK, 8, 1.3, 10.5, 9.5),
], "Time・Feedback・Mix の 3 点。11〜12 章と同じ遅延線の長さ違い")

F["e16_dotted"] = SVG(860, 260, [
    T(430, 26, "付点 8 分ディレイ — 1 人シーケンスの魔法", "middle", 12.5, INK, True),
    T(70, 66, "BPM120: 1 拍 = 60000/120 = 500 ms、付点 8 分 = 375 ms", "start", 10.5, INK),
    AXES(70, 180, 700, 90, "時間", None),
    # beats
    TICKS(70, 180, 710, [(i/8.0, ["1","","2","","3","","4",""][i]) for i in range(8)], c=FNT, sz=9),
    # played 8ths
    D(70, 130, SIG, 6), D(150, 130, SIG, 6), D(230, 130, SIG, 6), D(310, 130, SIG, 6),
    T(60, 112, "弾く音（8 分）", "start", 9, SIG),
    # echoes at +375ms = +0.75 beat = 60px*1.5 = offset
    D(130, 155, GRN, 5), D(210, 155, GRN, 5), D(290, 155, GRN, 5), D(370, 155, GRN, 5),
    T(60, 168, "繰り返し（+375 ms）", "start", 9, GRN),
    T(560, 138, "繰り返しが「弾いていない 16 分の位置」に落ち、", "start", 9.5, MUT),
    T(560, 155, "パターンが編み上がる（The Edge / U2）", "start", 9.5, MUT),
    T(430, 235, "タップテンポ + 付点 8 分モードなら、足で 4 分を踏むだけ。繰り返しは原音より小さく・暗く", "middle", 10.5, MUT),
], "60000 ÷ BPM × 0.75。8 分のフレーズと組むと 16 分の隙間が埋まる")

# ===================== 17 =====================

F["e17_room"] = SVG(860, 260, [
    T(430, 26, "残響の物理 — 直接音・初期反射・後部残響", "middle", 12.5, INK, True),
    AXES(80, 200, 700, 140, "時間", "音量"),
    RECT(96, 70, 7, 130, 0, SIG, SIG, 0), T(100, 60, "直接音", "middle", 9.5, SIG),
    RECT(150, 110, 5, 90, 0, GRN, GRN, 0), RECT(175, 122, 5, 78, 0, GRN, GRN, 0), RECT(210, 116, 5, 84, 0, GRN, GRN, 0), RECT(235, 135, 5, 65, 0, GRN, GRN, 0),
    T(195, 100, "初期反射（部屋の形）", "middle", 9.5, GRN),
    FWAVE(260, 200, 500, 0, lambda u: 0, 2, LIN, 0.1),
    PL([(260,145)] + [(260+500*i/60, 200-58*math.exp(-3*i/60)*(0.75+0.25*math.sin(i*2.1))) for i in range(1,61)], MUT, 1.6),
    T(500, 120, "後部残響（密な反射の混合。指数減衰）", "middle", 9.5, MUT),
    DIM(260, 218, 700, 218, "ディケイ（RT60 = 60 dB 減るまで。風呂 0.5 s / ホール 2 s / 大聖堂 8 s）", MUT, 9),
    T(430, 250, "Pre-delay = 直接音から残響までの間。ここを空けると原音の輪郭が残る", "middle", 10.5, MUT),
], "数えられる反射（初期反射）と数えられない反射（後部残響）。ディレイとリバーブの境目でもある")

F["e17_algo"] = SVG(860, 280, [
    T(430, 26, "リバーブの 4 つの作り方", "middle", 12.5, INK, True),
    BOX(40, 56, 190, 88, "スプリング", "バネの機械振動の乱反射。「ビシャーン」。アンプ内蔵・サーフ", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    BOX(245, 56, 190, 88, "プレート", "吊るした鉄板の振動。密で明るい。ボーカル/スネアの定番", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    BOX(450, 56, 190, 88, "アルゴリズム", "コム + オールパス + ローパスの網（下図）。Room/Hall はプリセット", GRN, "none", INK, 8, 1.5, 11.5, 9.5),
    BOX(655, 56, 165, 88, "コンボリューション", "実空間の IR を畳み込む。再現は最強・自由度は低い", GRN, "none", INK, 8, 1.5, 11, 9.5),
    T(430, 172, "アルゴリズム方式の中身（本編の部品の集大成）", "middle", 10.5, INK, True),
    flowright(90, 215, [("コム群（並列）", "減衰する反射の骨格（12 章）", SIG, SSOFT),
                        ("オールパス群（直列）", "反射を塗り重ねて密に（13 章）", SIG, SSOFT),
                        ("ループ内ローパス", "空気と壁の吸収（高域から減衰）", GRN, "none")], 220, 62, 25, sz=10.5, ssz=9)[0],
], "バネ・鉄板・ディレイ網・畳み込み。ディレイとフィルタだけでリバーブは組める")

# ===================== 18 =====================

F["e18_ring"] = SVG(860, 260, [
    T(430, 26, "リングモジュレータ = 掛け算", "middle", 12.5, INK, True),
    BOX(50, 80, 130, 50, "入力（楽器）", None, LIN, PAN),
    CIRC(250, 105, 18, INK, 1.8), T(250, 111, "×", "middle", 15, INK, True),
    W(180, 105, 232, 105, c=MUT, lw=1.6),
    LFOICON(250, 190, 44), T(250, 232, "キャリア発振器", "middle", 9, MUT),
    ARR(250, 168, 250, 125, GRN, 1.8),
    ARR(268, 105, 330, 105, MUT, 1.6),
    T(430, 66, "出力のスペクトル", "middle", 9.5, INK, True),
    SPEC(340, 160, 300, 80, [(0.30,0.8,ALI),(0.70,0.8,ALI),(0.50,0.5,FNT)], 12),
    T(430, 178, "入力±キャリアの「和と差」だけが残り、元の音程（薄い棒）は消える", "middle", 9, MUT),
    BOX(660, 70, 160, 100, "音", "倍音列と無関係な成分 = 金属的・非楽音的。鐘・ダーレク声。キャリアを曲のキーに合わせると調性内に", ALI, ASOFT, INK, 8, 1.4, 11.5, 9.5),
    T(430, 240, "歪みの相互変調（4 章の濁り）を主役に据えたエフェクト", "middle", 10.5, MUT),
], "input × sin(キャリア)。和と差の周波数だけが出て音程が崩壊する")

F["e18_granular"] = SVG(860, 260, [
    T(430, 26, "グラニュラー — 音を粒に砕いてまき散らす", "middle", 12.5, INK, True),
    RECT(60, 66, 300, 36, 4, SCR, LIN, 1.3), T(210, 58, "録音（バッファ）", "middle", 9, MUT),
    HEXROW(80, 72, [("",SIG,SSOFT),("",GRN,"none"),("",SIG,SSOFT),("",GRN,"none"),("",SIG,SSOFT)], 40, 24, 8)[0],
    T(210, 118, "10〜100 ms の粒（グレイン）に切る", "middle", 9, MUT),
    ARR(370, 90, 430, 90, MUT, 1.8),
    stack(440, 52, 380, [("位置・速度（ピッチ）・逆再生・密度を粒ごとに変える", "散らす = 音の雲、テクスチャ", SIG, SSOFT),
                         ("同じ位置の粒を重ね続ける = フリーズ（時間停止）", "弾いた和音がパッドになる", GRN, "none"),
                         ("粒をオクターブ上に散らす = クリスタル/シマー系", "ピッチシフトは「規律正しい特殊例」", GRN, "none")], 44, 6)[0],
    T(430, 242, "MOOD / Particle / Microcosm などブティック系の主戦場。スウェルと組むとパッド化が完成", "middle", 10, MUT),
], "粒の操作の自由度がそのまま音の多様性。フリーズもシマーもこの特殊例")

# ===================== 19 =====================

F["e19_cable"] = SVG(860, 270, [
    T(430, 26, "ハイインピーダンス + ケーブル容量 = ローパスフィルタ", "middle", 12.5, INK, True),
    BOX(50, 80, 160, 60, "ピックアップ", "内部抵抗 数百 kΩ（ハイインピーダンス）", LIN, PAN, INK, 8, 1.4, 11, 9),
    W(210, 110, 400, 110, c=SIG, lw=2),
    T(305, 98, "ケーブル（約 100 pF/m）", "middle", 9, MUT),
    W(300, 110, 300, 145, c=LIN, lw=1.4), W(288, 145, 312, 145, c=LIN, lw=1.8), W(292, 151, 308, 151, c=LIN, lw=1.4),
    T(340, 152, "容量が R とフィルタを作る", "start", 8.5, FNT),
    AXES(480, 180, 320, 100, "周波数", None), MIDLINE(480, 120, 320),
    PL([(480,120),(620,122),(680,135),(740,158),(800,172)], SIG, 2.2),
    T(660, 108, "長いほど高域が落ちる", "middle", 9, ALI),
    BOX(50, 200, 770, 52, "バッファ（増幅率 1 倍・出力インピーダンスだけ低く）を通すと、それ以降は何 m でも高域が落ちない",
        "「トゥルーバイパスが常に高音質」は誤解。正解は「チェーンのどこかに質の良いバッファ 1 個」。ただしファズ/ワウはバッファより前（5 章）", GRN, "none", INK, 8, 1.4, 11, 9.5),
], "「長いシールドで音が死ぬ」は RC フィルタの物理。バッファ 1 個で解決する")

F["e19_loop"] = SVG(860, 260, [
    T(430, 26, "エフェクトループ — アンプの歪みの後ろに挿す", "middle", 12.5, INK, True),
    BOX(40, 80, 150, 50, "ギター → 歪み系", "ワウ・コンプも", LIN, PAN, INK, 8, 1.4, 10.5, 9),
    ARR(190, 105, 230, 105, MUT, 1.6),
    RECT(230, 60, 400, 130, 10, PAN, SIG, 1.6),
    T(430, 80, "アンプ", "middle", 11, SIG, True),
    BOX(250, 95, 130, 50, "プリ（歪み）", None, SIG, SSOFT),
    BOX(480, 95, 130, 50, "パワー（音量）", None, SIG, SSOFT),
    ARR(380, 120, 400, 120, MUT, 1.4), W(400, 120, 400, 170, c=GRN, lw=1.8), ARR(400, 170, 400, 205, GRN, 1.8),
    ARR(460, 205, 460, 170, GRN, 1.8), W(460, 170, 460, 120, c=GRN, lw=1.8), ARR(460, 120, 480, 120, MUT, 1.4),
    T(388, 220, "Send", "middle", 9, GRN), T(472, 220, "Return", "middle", 9, GRN),
    BOX(360, 225, 140, 30, "空間系・モジュレーション", None, GRN, "none", INK, 6, 1.3, 9.5, 8),
    T(700, 100, "input へ: ワウ・コンプ・歪み", "middle", 9.5, MUT),
    T(700, 120, "ループへ: ディレイ・リバーブ・", "middle", 9.5, MUT),
    T(700, 136, "モジュレーション・EQ", "middle", 9.5, MUT),
    T(700, 165, "アンプで歪ませても", "middle", 9, FNT),
    T(700, 180, "1 章の定石が守れる", "middle", 9, FNT),
], "プリ（歪み）とパワー（音量）の間の Send/Return。空間系を歪みの後ろに置くための端子")

