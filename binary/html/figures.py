# -*- coding: utf-8 -*-
"""バイナリ解析編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
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

F["b01_targets"] = SVG(860, 360, [
    T(430, 26, "解析対象と、知りたいこと", "middle", 12.5, INK, True),
    BOX(40, 56, 240, 74, "ファームウェアの入れ物", "ELF / HEX / Cortex-M / MCUboot / FS。何が、どこに、どう配置されるか", SIG, SSOFT, INK, 8, 1.6, 12, 9.5),
    BOX(310, 56, 240, 74, "データ領域", "NVM3 / NVS / ログ。設定・記録・秘密がどう残るか", SIG, SSOFT, INK, 8, 1.6, 12, 9.5),
    BOX(580, 56, 240, 74, "実行ファイルとメモリ", "Linux イメージ、機械語、RAM の状態", SIG, SSOFT, INK, 8, 1.6, 12, 9.5),
    T(430, 168, "共通の前提", "middle", 11.5, INK, True),
    BOX(150, 182, 560, 60, "バイト列には必ず構造がある",
        "書いた人間（またはコンパイラ・ライブラリ）が、意味のある形でバイトを並べた。その構造を対象ごとに復元する", GRN, "none", INK, 8, 1.6, 13, 10),
    stack(40, 262, 780, [("更新の失敗、設定の化け、秘密の漏れ、古い製品の保守、相互運用、不具合の再現", "——どれも「バイト列の意味を復元する」作業に帰着する", LIN, PAN)], 62, 0)[0],
], "対象は「入れ物・データ・実行ファイル」の 3 種。共通するのは「構造を復元する」こと")

F["b01_workflow"] = SVG(860, 300, [
    T(430, 26, "ダンプを手にしてからの 5 手順", "middle", 12.5, INK, True),
    flowright(30, 100, [("① 固定", "ハッシュ・由来を記録。原本は読み取り専用", SIG, SSOFT),
                        ("② 眺める", "サイズ・エントロピー・文字列・マジック"),
                        ("③ 地図", "アドレス範囲ごとに何があるか（メモリマップ）"),
                        ("④ 解く", "各領域を対象ごとの手順で。公式ツール優先", SIG, SSOFT),
                        ("⑤ 記録", "表・図・スクリプトにして再現可能に")], 150, 64, 12, sz=11.5, ssz=9)[0],
    BOX(40, 165, 780, 56, "「まず既知の形式を疑う」",
        "自分で全部解く前に、そのライブラリの公式ツール（commander / imgtool / littlefs-python …）を試す。ライブラリのソースが最強の仕様書", GRN, "none", INK, 8, 1.6, 12, 10),
    T(430, 258, "対象が変わっても、この 5 手順は同じ", "middle", 11, MUT),
], "固定・眺める・地図・解く・記録。どんな対象でも最初の 5 手順は共通")

# ===================== 02. 道具箱 =====================

F["b02_kinds"] = SVG(860, 350, [
    T(430, 26, "道具の 7 分類", "middle", 12.5, INK, True),
    stack(40, 54, 380, [("眺める", "xxd / hexdump / ImHex / 010 Editor", SIG, SSOFT),
                        ("拾う", "strings / binwalk / file / grep -a", SIG, SSOFT),
                        ("測る", "binwalk -E / ent / cmp / radiff2", SIG, SSOFT),
                        ("解く（形式）", "readelf / srec_cat / imgtool / Kaitai", GRN, "none")], 58, 6)[0],
    stack(440, 54, 380, [("解く（コード）", "Ghidra / radare2 / objdump -d", GRN, "none"),
                         ("動かす", "OpenOCD / pyOCD / gdb / QEMU / Renode", LIN, PAN),
                         ("作る", "Python struct / construct / Kaitai", LIN, PAN),
                         ("取る", "OpenOCD / esptool / flashrom（4 章）", LIN, PAN)], 58, 6)[0],
    T(430, 332, "基本の 4 つ = hexdump（xxd -e -g4）・strings・binwalk・Python の struct", "middle", 11, MUT, True),
], "眺める・拾う・測る・解く・動かす・作る・取る。まず基本の 4 つを手足のように")

F["b02_python"] = SVG(860, 280, [
    T(430, 26, "Python の struct — バイト列と整数を 1 行で", "middle", 12.5, INK, True),
    CODE(40, 62, [("import struct",),
                  ("data = open('work.bin','rb').read()",),
                  ("sp, reset = struct.unpack_from('<II', data, 0)   # 先頭 8 バイトを u32×2 に", GRN),
                  ("print(hex(sp), hex(reset))                       # 0x20000400 0x080081c5", MUT)], 11, INK, 20),
    T(40, 150, "書式文字（先頭の < がリトル、> がビッグ）", "start", 10.5, INK, True),
    HEXROW(40, 162, [("B/b", GRN, "none"), ("H/h", GRN, "none"), ("I/i", GRN, "none"), ("Q/q", GRN, "none"), ("f/d", LIN, PAN), ("4s", LIN, PAN)], 90, 26, 10)[0],
    HEXROW(40, 190, [("u8/i8", None), ("u16", None), ("u32", None), ("u64", None), ("float", None), ("bytes", None)], 90, 22, 9)[0],
    T(40, 240, "繰り返し → struct.iter_unpack、可変長・条件 → construct、多言語・可視化 → Kaitai（19 章）", "start", 10, MUT),
], "struct は固定構造に最適。<II は「リトルエンディアンの u32 が 2 つ」")

# ===================== 03. バイト列を読む基本 =====================

F["b03_endian"] = SVG(860, 280, [
    T(430, 26, "エンディアン — 0x20000400 をメモリにどう置くか", "middle", 12.5, INK, True),
    T(215, 66, "リトルエンディアン（下位が先）", "middle", 11.5, SIG, True),
    HEXROW(50, 80, [("00", SIG, SSOFT), ("04", SIG, SSOFT), ("00", SIG, SSOFT), ("20", SIG, SSOFT)], 78, 30, 12)[0],
    T(50, 130, "アドレス低 →→→ 高", "start", 9.5, FNT),
    T(215, 152, "Cortex-M / x86 / RISC-V", "middle", 10, MUT),
    T(645, 66, "ビッグエンディアン（上位が先）", "middle", 11.5, GRN, True),
    HEXROW(480, 80, [("20", GRN, "none"), ("00", GRN, "none"), ("04", GRN, "none"), ("00", GRN, "none")], 78, 30, 12)[0],
    T(645, 152, "ネットワーク / 多くのファイルヘッダ", "middle", 10, MUT),
    BOX(40, 185, 780, 66, "見分け方: 小さな正の整数を探す",
        "「04 00 00 00」はリトルなら 4、ビッグなら 0x04000000（67108864）。4 のほうがありそうなら、その領域はリトル。xxd -e -g4（リトル）と xxd -g4（バイト順）を切り替えて意味の通るほうを選ぶ", GRN, "none", INK, 8, 1.6, 12, 10),
], "組み込みはほぼリトル。ネットワークとファイルヘッダにビッグが混ざる。小さな整数で見分ける")

F["b03_struct"] = SVG(860, 300, [
    T(430, 26, "アラインメント — 値は境界に揃い、詰め物が入る", "middle", 12.5, INK, True),
    CODE(40, 58, [("struct rec {",),
                  ("  uint8_t  type;   // オフセット 0",),
                  ("  uint32_t value;  // オフセット 4（1 ではない！）", ALI),
                  ("  uint16_t len;    // オフセット 8",),
                  ("};                 // 合計 12 バイト（7 ではない）", ALI)], 10.5, INK, 17),
    T(430, 158, "メモリ上の並び", "middle", 10.5, INK, True),
    HEXROW(60, 172, [("type", SIG, SSOFT), ("pad", ALI, ASOFT), ("pad", ALI, ASOFT), ("pad", ALI, ASOFT),
                     ("value", GRN, "none"), ("value", GRN, "none"), ("value", GRN, "none"), ("value", GRN, "none"),
                     ("len", LIN, PAN), ("len", LIN, PAN), ("pad", ALI, ASOFT), ("pad", ALI, ASOFT)], 60, 28, 9.5)[0],
    TICKS(60+30, 200, 60+30+11*60, [(i/11, str(i)) for i in range(0,12,2)], c=FNT, sz=8),
    BOX(40, 232, 780, 52, "詰め物を無視して「バイト数を足しただけ」ではズレる",
        "パディングを考慮するか、struct 書式に明示（<B3xIH2x の x が詰め物）。通信フレームや packed 構造体は詰め物がない。実物で確かめる", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "32 ビット値は 4 の倍数アドレスに置かれ、間に詰め物が入る。バイト数の足し算はズレる")

F["b03_magic"] = SVG(860, 340, [
    T(430, 26, "マジックナンバー — 形式の目印を全域検索する", "middle", 12.5, INK, True),
    stack(40, 54, 380, [(".ELF  7F 45 4C 46", "ELF 実行ファイル（05 章）", SIG, SSOFT),
                        ("gzip  1F 8B", "圧縮（14 章）", GRN, "none"),
                        ("zstd  28 B5 2F FD / xz  FD 37 7A 58 5A", "圧縮", GRN, "none"),
                        ("PK..  50 4B 03 04", "ZIP / JAR / APK", LIN, PAN)], 44, 6)[0],
    stack(440, 54, 380, [("MCUboot  3D B8 F3 96（0x96f3b83d）", "各スロット先頭（08 章）", SIG, SSOFT),
                         ("hsqs / sqsh", "squashfs（15 章）", GRN, "none"),
                         ("D0 0D FE ED（0xd00dfeed BE）", "デバイスツリー（15 章）", LIN, PAN),
                         ("55 AA / EB / E9", "ブートセクタ・FAT の目印（09 章）", LIN, PAN)], 44, 6)[0],
    BOX(40, 290, 780, 40, "マジックがファイル先頭でなく各構造の頭にある形式（MCUboot・NVM3）は全域を検索する",
        None, GRN, "none", INK, 8, 1.4, 11, 10),
], "既知形式の先頭バイト列を探すのが最初の一歩。構造ごとに頭にある形式は全域検索")

# ===================== 04. ダンプを手に入れる =====================

F["b04_paths"] = SVG(860, 300, [
    T(430, 26, "吸い出しの 4 経路", "middle", 12.5, INK, True),
    BOX(40, 56, 185, 90, "デバッグポート", "SWD / JTAG。内蔵フラッシュ・RAM。保護が無効なら全部。OpenOCD / pyOCD / J-Link", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(240, 56, 185, 90, "フラッシュ直読み", "外付け SPI / NAND。クリップか取り外し。flashrom", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(440, 56, 185, 90, "ブートローダ / ISP", "UART / USB。ブートローダが許す範囲。esptool / stm32flash / dfu-util", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(640, 56, 180, 90, "エミュレータ / ソフト", "既にファイルがある場合。QEMU / Renode。実機不要", LIN, PAN, INK, 8, 1.5, 12, 9.5),
    BOX(40, 170, 780, 50, "Cortex-M: フラッシュ 0x08000000 付近、RAM 0x20000000 付近",
        "ダンプのオフセット 0 が、実機のどのアドレスに対応するかを必ず記録する（6・7 章のアドレス変換で必要）", GRN, "none", INK, 8, 1.4, 11.5, 10),
    BOX(40, 232, 780, 48, "吸い出したら 2 回読んで比較（cmp）・サイズ確認・先頭がベクタテーブルか",
        "全部 0x00 / 0xFF なら読み出し保護かアドレス指定ミス", LIN, PAN, INK, 8, 1.4, 11.5, 10),
], "SWD・SPI 直読み・ブートローダ・エミュレータ。オフセット 0 が実機のどのアドレスかを記録する")

F["b04_rdp"] = SVG(860, 260, [
    T(430, 26, "読み出し保護 — 読めないのは設計どおり", "middle", 12.5, INK, True),
    BOX(40, 58, 360, 90, "保護あり",
        "STM32 RDP / nRF APPROTECT / ESP Flash Encryption。接続できてもフラッシュは 0x00 / 0xFF が返る、または接続拒否。レベル下げには全消去が要り中身は失われる", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 58, 380, 90, "保護なし",
        "SWD や SPI 直読みで全部読める。＝攻撃者にも読める", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(40, 165, 780, 66, "「読めた」ことの意味",
        "保護なしで鍵や証明書が平文で出てきたら、それは脆弱性の発見（13 章）。「解析できた」で終わらず「保護すべきものが保護されていたか」を確認する。対策は PSA 編・IoT セキュリティ編", GRN, "none", INK, 8, 1.6, 12, 10),
], "読み出し保護は安全機構。平文で読めたら逆に脆弱性")

# ===================== 05. ELF =====================

F["b05_layout"] = SVG(860, 300, [
    T(430, 26, "ELF の全体構造", "middle", 12.5, INK, True),
    MEMMAP(260, 52, 340, [("0x00", "ELF ヘッダ（52 B）", "7F 45 4C 46 で始まる", SIG, SSOFT),
                          ("", "プログラムヘッダ表", "セグメント = メモリへの積み方"),
                          ("", ".text / .rodata / .data …", "セクション = 部品", GRN, "none"),
                          ("", "セクションヘッダ表", "セクションの一覧"),
                          ("", ".symtab / .debug_*", "シンボル・デバッグ情報", LIN, PAN)], 40)[0],
    BOX(40, 60, 200, 150, "最も情報が多い形",
        "コード・データ・シンボル・デバッグ情報を全部含む。ELF があれば解析の大半は済む。生バイナリにはこの情報がない", GRN, "none", INK, 8, 1.6, 12, 10),
    T(430, 285, "先頭 4 バイトは必ず 7F 45 4C 46（.ELF）", "middle", 10.5, MUT),
], "コード・データ・シンボル・デバッグ情報を全部含む「最も情報の多い」形式")

F["b05_sections"] = SVG(860, 320, [
    T(430, 26, "セクションとセグメント — 同じ中身の 2 つの見方", "middle", 12.5, INK, True),
    BOX(40, 56, 380, 100, "セクション（readelf -S）",
        "リンク・デバッグのための細かい分類。.text / .rodata / .data / .bss / .symtab / .debug_info。部品の一覧", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 56, 380, 100, "セグメント（readelf -l）",
        "実行時にメモリへ載せる大きな単位。LOAD がフラッシュ / RAM に配置される。メモリへの積み方", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(40, 180, 780, 60, "VMA と LMA の違い",
        ".data の初期値はフラッシュ（LMA = 配置アドレス）、実行時は RAM（VMA = 実行時アドレス）。起動時にコピー。.bss はファイルに入らない（起動時に 0 埋め）", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    T(430, 275, "1 つの LOAD セグメントが複数のセクション（.text + .rodata）をまとめて含む", "middle", 10.5, MUT),
    T(430, 298, "「セクション = 部品の一覧」「セグメント = 積み方」", "middle", 11, MUT, True),
], "セクションは部品の一覧、セグメントはメモリへの積み方。.data は VMA と LMA が違う")

F["b05_tobin"] = SVG(860, 280, [
    T(430, 26, "objcopy -O binary で何が捨てられるか", "middle", 12.5, INK, True),
    BOX(40, 60, 220, 130, "firmware.elf",
        ".text / .rodata / .data / .bss / .symtab / .debug_* / セクション情報", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    ARR(260, 125, 360, 125, MUT, 1.8),
    T(310, 112, "objcopy", "middle", 9.5, MUT, True),
    T(310, 138, "-O binary", "middle", 9, MUT, False, True),
    BOX(360, 75, 200, 100, "firmware.bin",
        "LOAD セグメントの中身だけ、LMA 順に", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(590, 60, 230, 130, "捨てられるもの",
        "シンボル表・デバッグ情報（→ 名前が復元できない）、.bss（起動時に 0 埋め）、セクションの境界と名前", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    T(430, 255, "生バイナリから ELF には戻せない。だから生バイナリの解析は難しい（16 章で構造を推定し直す）", "middle", 10.5, MUT),
], "生バイナリはシンボル・デバッグ情報・.bss を捨てる。ELF には戻せない")

# ===================== 06. HEX / SREC =====================

F["b06_why"] = SVG(860, 250, [
    T(430, 26, "なぜアドレス付きテキスト形式か — 飛び地を表す", "middle", 12.5, INK, True),
    T(215, 60, ".bin（アドレス 0 から詰めるだけ）", "middle", 11, INK, True),
    HEXROW(40, 74, [("Boot", SIG, SSOFT), ("0xFF…", ALI, ASOFT), ("0xFF…", ALI, ASOFT), ("App", GRN, "none"), ("0xFF…", ALI, ASOFT), ("Cfg", LIN, PAN)], 62, 30, 10)[0],
    T(215, 128, "空きを 0xFF で埋めるので巨大になる", "middle", 9.5, ALI),
    T(645, 60, "HEX / SREC（レコードの列）", "middle", 11, INK, True),
    CODE(475, 82, [(":10 08000000 …  CC   Boot", SIG),
                   (":10 08008000 …  CC   App", GRN),
                   (":10 08078000 …  CC   Cfg", MUT),
                   (":00000001FF          終端", FNT)], 9.5, INK, 15),
    T(645, 150, "「このアドレスに、この数バイトを書け」の列で飛び地を素直に表す", "middle", 9, MUT),
    BOX(40, 180, 780, 50, "書き込みツール・ブートローダ・製造装置が扱う。中身は ASCII でエディタでも開ける",
        None, GRN, "none", INK, 8, 1.4, 11, 10),
], ".bin は飛び地を 0xFF で埋めるしかない。HEX / SREC はレコードの列で飛び地を表す")

F["b06_ihex"] = SVG(860, 300, [
    T(430, 26, "Intel HEX の 1 行", "middle", 12.5, INK, True),
    HEXROW(70, 60, [(":", LIN, PAN), ("10", SIG, SSOFT), ("8000", GRN, "none"), ("00", ALI, ASOFT),
                    ("…16 バイト…", LIN, PAN), ("7A", INK, PAN)], 0, 30, 10)[0] if False else "",
    BYTES(60, 60, [(":", 24, LIN, PAN, ""), ("10", 60, SIG, SSOFT, "Byte count=16"),
                   ("8000", 90, GRN, "none", "アドレス下位16bit"), ("00", 50, ALI, ASOFT, "種別=データ"),
                   ("00 04 00 20 …（データ 16 バイト）", 380, LIN, PAN, ""), ("7A", 50, INK, "none", "checksum")], 32, 10, 8.5)[0],
    T(430, 135, "レコード種別", "middle", 11, INK, True),
    stack(150, 148, 560, [("00 Data / 01 End Of File", "データ本体・終端", SIG, SSOFT),
                          ("04 Extended Linear Address", "以降のアドレスの上位 16 ビットを決める", ALI, ASOFT),
                          ("05 Start Linear Address", "実行開始アドレス", LIN, PAN)], 34, 4)[0],
    T(430, 278, "データ行のアドレスは下位 16 ビットだけ。上位は直前の 04 レコードで決まる（見落とすと誤読）", "middle", 10, ALI),
], "「:」+ 長さ + アドレス下位 + 種別 + データ + チェックサム。上位アドレスは 04 レコード")

F["b06_srec"] = SVG(860, 220, [
    T(430, 26, "Motorola S-record", "middle", 12.5, INK, True),
    BYTES(60, 56, [("S3", 50, SIG, SSOFT, "種別"), ("15", 50, GRN, "none", "Byte count"),
                   ("08008000", 130, ALI, ASOFT, "32bit アドレス"), ("…データ…", 300, LIN, PAN, ""), ("CC", 50, INK, "none", "checksum")], 32, 10, 8.5)[0],
    stack(150, 120, 560, [("S1 / S2 / S3 = 16 / 24 / 32 ビットアドレスのデータ", "S3 が Cortex-M で普通。1 行で実アドレスが読める", SIG, SSOFT),
                          ("S0 ヘッダ / S5・S6 個数 / S7・S8・S9 実行開始", "", LIN, PAN)], 40, 6)[0],
    T(430, 205, "S3 はフル 32 ビットアドレスを 1 行に持つ（04 レコードのような上位管理が不要）", "middle", 10.5, MUT),
], "S + 種別で始まる。S3 は 32 ビットアドレスを 1 行に持つ")

# ===================== 07. Cortex-M イメージ =====================

F["b07_vectors"] = SVG(860, 320, [
    T(430, 26, "ベクタテーブル — 生イメージの先頭に必ずある表", "middle", 12.5, INK, True),
    MEMMAP(220, 52, 420, [("+0x00", "初期スタックポインタ（MSP）", "RAM 範囲 0x2000xxxx", SIG, SSOFT),
                          ("+0x04", "リセットハンドラ", "フラッシュ範囲・奇数", GRN, "none"),
                          ("+0x08", "NMI / HardFault …", "システム例外", LIN, PAN),
                          ("+0x40", "外部割り込み（IRQ）", "周辺機器ごと、数十〜200 個", LIN, PAN)], 40)[0],
    BOX(40, 210, 780, 66, "「Cortex-M のイメージだ」と判断する決め手",
        "① オフセット 0 の u32 が RAM 範囲（0x20000000 台）  ② オフセット 4 以降の u32 がフラッシュ範囲で、すべて奇数（最下位ビット=1）", GRN, "none", INK, 8, 1.6, 12, 10),
    CODE(190, 296, [("xxd -e -g4:  20000400  080081c5  08008181  08008183   ← MSP  Reset  NMI  HardFault", MUT)], 9.5, MUT, 14),
], "先頭 = MSP（RAM 範囲）、+4 = リセットハンドラ（フラッシュ範囲・奇数）が決め手")

F["b07_load"] = SVG(860, 250, [
    T(430, 26, "Thumb ビットとロードアドレス", "middle", 12.5, INK, True),
    BOX(40, 56, 380, 78, "ハンドラのアドレスは全部奇数 = Thumb ビット",
        "Cortex-M は Thumb 命令のみ。分岐先の最下位ビット 1 が「Thumb で実行」。表の値 0x080081C5 → 実コードは 0x080081C4（−1）", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 56, 380, 78, "ロードアドレスを突き止める",
        "リセットハンドラの値（−1 の偶数）はイメージ内を指す。0x08008xxx なら 0x08008000 付近に焼かれている", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(40, 152, 780, 66, "ファイル内オフセット = アドレス − ロードアドレス",
        "ロードアドレス L が正しければ、リセットハンドラのオフセット位置に実際のコードがある。逆アセンブル（16 章）で確かめられる。ブートローダの後ろのアプリは 0x08008000 + ヘッダ分（8 章）", LIN, PAN, INK, 8, 1.6, 12, 10),
], "ハンドラが奇数なのは Thumb ビット。ロードアドレスはリセットハンドラの値から推定")

F["b07_codedata"] = SVG(860, 290, [
    T(430, 26, "コードとデータを見分ける", "middle", 12.5, INK, True),
    stack(40, 54, 380, [("Thumb コード", "push {lr}（B5xx）/ pop {pc}（BDxx）/ bl（4B）が頻出", SIG, SSOFT),
                        ("リテラルプール", "コードの合間に 32bit の定数・ポインタが島状に", GRN, "none"),
                        ("文字列", ".rodata に固まる。strings で位置", LIN, PAN)], 54, 6)[0],
    stack(440, 54, 380, [("繰り返す同じアドレス", "未使用割り込みのデフォルトハンドラ = B .（E7FE）", ALI, ASOFT),
                         ("0x0800xxxx", "フラッシュ内のポインタ（コード・データ）", LIN, PAN),
                         ("0x2000xxxx / 0x4000xxxx", "RAM のポインタ / 周辺レジスタ", LIN, PAN)], 54, 6)[0],
    BOX(40, 232, 780, 50, "RAM ダンプのスタックには、関数の戻りアドレス（0x0800xxxx の奇数）が点在する",
        "拾えば呼び出しの履歴が復元できる（17 章のスタックトレース）", GRN, "none", INK, 8, 1.4, 11.5, 10),
], "コード中に点在する 0x0800/0x2000/0x4000 のポインタはリテラルプール。繰り返すアドレスは未使用割り込み")

# ===================== 08. ブートローダ =====================

F["b08_why"] = SVG(860, 230, [
    T(430, 26, "なぜアプリの前後にメタデータが付くか", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 90, "更新の管理", "バージョン、サイズ、複数スロットのどちらが新しいか", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(305, 56, 250, 90, "完全性と真正性", "ハッシュで壊れていないか、署名で正規のものかを起動前に確かめる", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(570, 56, 250, 90, "配置の自由", "ブートローダがアプリを別スロットへコピー・入れ替えできる", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    T(430, 180, "組み込みで最も普及 = MCUboot（Arm 系・ESP・Nordic・Zephyr・TF-M）", "middle", 11, MUT, True),
    T(430, 205, "PSA 編・IoT セキュリティ編のセキュアブートの実体", "middle", 10, MUT),
], "更新管理・完全性/真正性・配置の自由のため。標準は MCUboot")

F["b08_layout"] = SVG(860, 345, [
    T(430, 26, "フラッシュ全体とスロットの 3 部構成", "middle", 12.5, INK, True),
    MEMMAP(200, 52, 460, [("0x0", "Bootloader（MCUboot 本体）", "それ自身が Cortex-M イメージ", LIN, PAN),
                          ("", "Primary slot（slot0）— いま動くアプリ", "ヘッダ + アプリ + トレーラ", SIG, SSOFT),
                          ("", "Secondary slot（slot1）— 更新候補", "同じ構造", GRN, "none"),
                          ("", "Scratch（構成による）", "入れ替えの一時退避", LIN, PAN),
                          ("", "Storage — 設定・ログ", "10〜12 章", LIN, PAN)], 36)[0],
    T(430, 250, "各スロットの詳細", "middle", 11, INK, True),
    BYTES(120, 266, [("ヘッダ 32 B", 150, SIG, SSOFT, "0x96f3b83d"), ("アプリ本体", 320, GRN, "none", "ベクタテーブル(7章)はここから"), ("TLV トレーラ", 150, LIN, PAN, "hash・署名")], 30, 10, 8.5)[0],
], "スロットは ヘッダ + アプリ本体 + TLV トレーラ。アプリのベクタテーブルはヘッダの後ろから")

F["b08_tlv"] = SVG(860, 300, [
    T(430, 26, "イメージヘッダと TLV トレーラ", "middle", 12.5, INK, True),
    T(215, 58, "ヘッダ（先頭 32 バイト）", "middle", 11, SIG, True),
    CODE(50, 78, [("+0x00  ih_magic     0x96f3b83d", GRN),
                  ("+0x08  ih_hdr_size  32（本体はこの後ろ）",),
                  ("+0x0C  ih_img_size  アプリのバイト数",),
                  ("+0x14  ih_ver       01 02 00 00 = v1.2.0", INK)], 9.5, INK, 16),
    T(645, 58, "TLV トレーラ（本体の後ろ）", "middle", 11, GRN, True),
    CODE(475, 78, [("magic 0x6907 / 0x6908",),
                   ("0x10 SHA256   本体の完全性", SIG),
                   ("0x20 KEYHASH  どの鍵か",),
                   ("0x22 署名     真正性", SIG)], 9.5, INK, 16),
    BOX(40, 158, 780, 54, "SHA-256 が完全性（壊れていない）、署名が真正性（正規の鍵）",
        "ブートローダは起動前にハッシュを計算し直し、署名を公開鍵で検証してからジャンプする。imgtool dumpinfo / verify で読める", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    T(430, 240, "スロット末尾の boot magic / image ok / swap status で更新の段階（テスト中・中断・有効）が分かる", "middle", 10.5, MUT),
    T(430, 262, "image ok が未セット → テスト起動中。次の再起動で前スロットに戻る（ロールバック）", "middle", 10, MUT),
], "ヘッダのマジックは 0x96f3b83d。TLV に SHA-256（完全性）と署名（真正性）。末尾で更新段階を判定")

# ===================== 09. ファイルシステム =====================

F["b09_flash"] = SVG(860, 250, [
    T(430, 26, "フラッシュの制約とファイルシステム", "middle", 12.5, INK, True),
    BOX(40, 56, 380, 78, "フラッシュの 2 つの制約",
        "① 消去はブロック単位（4KB/64KB）、書き込みは 1→0 だけ。上書きは「消して書き直す」  ② 書き換え回数に寿命（1万〜10万回）", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 56, 380, 78, "だから専用の FS",
        "書き込みを全域に分散（ウェアレベリング）、電源断に強い設計。LittleFS / SPIFFS / JFFS2 / UBIFS", GRN, "none", INK, 8, 1.6, 12, 10),
    stack(40, 150, 780, [("見分け: FAT は 55 AA と EB/E9、LittleFS は \"littlefs\" 文字列、squashfs は hsqs", "binwalk / strings / xxd で先頭を見る", SIG, SSOFT)], 60, 0)[0],
], "フラッシュは消去がブロック単位で寿命がある。だからウェアレベリングと電源断耐性を持つ専用 FS")

F["b09_littlefs"] = SVG(860, 240, [
    T(430, 26, "LittleFS — マイコンで最も使われる", "middle", 12.5, INK, True),
    BOX(40, 56, 380, 80, "取り出し方",
        "littlefs-python でダンプからファイルを取り出す。block_size と block_count を機器の設定に合わせる（合わないとマウント失敗）", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 56, 380, 80, "内部の勘どころ",
        "メタデータペア（2 ブロックを交互に使い、片方が壊れても残る）+ CTZ スキップリスト。ブロック先頭に revision カウンタ", GRN, "none", INK, 8, 1.6, 12, 10),
    T(430, 165, "block_count × block_size = 領域サイズ。ソース（lfs_config）・データシート・繰り返し境界から求める", "middle", 10.5, MUT),
    T(430, 190, "littlefs-fuse でマウントもできる。SPIFFS は mkspiffs、FAT は mtools / 7z / マウント", "middle", 10.5, MUT),
    T(430, 220, "「同じ内容が 2 か所にある」「revision カウンタ」が目視の手がかり", "middle", 10, FNT),
], "LittleFS は littlefs-python で取り出す。block_size / block_count を機器に合わせる")

# ===================== 10. NVM3 =====================

F["b10_append"] = SVG(860, 300, [
    T(430, 26, "追記型 — 更新は「上書き」ではなく「末尾に追記」", "middle", 12.5, INK, True),
    T(430, 54, "キー 0x4001 を 3 回更新すると", "middle", 11, INK, True),
    BYTES(90, 66, [("key 0x4001 = 10", 170, LIN, PAN, "古い（残る）"), ("key 0x4001 = 12", 170, LIN, PAN, "古い（残る）"),
                   ("key 0x4001 = 15", 170, SIG, SSOFT, "最新 = 有効"), ("0xFF 空き", 150, ALI, "none", "")], 32, 9.5, 8)[0],
    ARR(600, 130, 600, 150, MUT, 1.4), T(600, 165, "後に書かれたものが有効", "middle", 9, MUT),
    BOX(40, 185, 780, 60, "なぜこの設計か（フラッシュの制約、9 章）",
        "同じ場所を消して書き直すと消去ブロック全体を巻き込み寿命を縮める。だから空き場所に追記し、区画が埋まったら有効な最新版だけ集めて古いブロックを消す（ガベージコレクション）", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(40, 255, 780, 38, "古い値・削除したはずのデータが履歴として残る（障害解析の宝、監査の危険。13 章）",
        None, ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "更新は末尾に追記、最新版を有効とする。古い値が履歴として残る。NVM3・NVS・ログ共通")

F["b10_object"] = SVG(860, 270, [
    T(430, 26, "NVM3 の構造 — ページとオブジェクト", "middle", 12.5, INK, True),
    T(215, 56, "ページ（消去ブロックに対応）", "middle", 11, SIG, True),
    BYTES(50, 70, [("ページヘッダ", 120, SIG, SSOFT, "消去カウンタ=世代"), ("obj", 60, LIN, PAN, ""), ("obj", 60, LIN, PAN, ""), ("obj", 60, LIN, PAN, ""), ("0xFF…", 80, ALI, "none", "空き")], 30, 9, 8)[0],
    T(645, 56, "オブジェクト", "middle", 11, GRN, True),
    BYTES(470, 70, [("ヘッダ", 195, GRN, "none", "キー(20bit)・型・長さ"), ("データ", 145, LIN, PAN, "値"), ("CRC", 40, INK, "none", "")], 30, 9, 8)[0],
    BOX(40, 135, 780, 54, "読み方: ① Commander nvm3 parse をまず試す  ② ページヘッダの消去カウンタで新旧  ③ オブジェクトを 4 バイト境界で連続パース  ④ 0xFF でページ終わり  ⑤ 同じキーは最新を採用",
        None, SIG, SSOFT, INK, 8, 1.6, 11, 9.5),
    T(430, 215, "ヘッダのビット割り当ては NVM3 のソース（nvm3_*.c）が仕様書。キーの意味は SDK のトークン定義", "middle", 10.5, MUT),
    T(430, 240, "Zigbee / Thread / BLE スタックは決まったキー範囲を鍵・アドレスに使う", "middle", 10, FNT),
], "ページ（消去カウンタで世代）にオブジェクト（キー・型・長さ）が 4 バイト境界で連続")

# ===================== 11. NVS =====================

F["b11_nvs_entry"] = SVG(860, 260, [
    T(430, 26, "ESP-IDF NVS — 4 KB ページと 32 バイトエントリ", "middle", 12.5, INK, True),
    BYTES(70, 56, [("ページヘッダ 32B", 170, SIG, SSOFT, "状態・シーケンス番号・CRC"),
                   ("状態ビットマップ 32B", 190, GRN, "none", "各エントリ 空/書込済/消去済"),
                   ("エントリ 32B × 126", 260, LIN, PAN, "")], 30, 9.5, 8)[0],
    T(430, 118, "各エントリ（32 バイト）", "middle", 11, INK, True),
    CODE(140, 138, [("+0x00 Namespace  +0x01 Type  +0x02 Span  +0x03 ChunkIndex", MUT),
                    ("+0x04 CRC32      +0x08 Key（最大15文字）  +0x18 Value", INK)], 9.5, INK, 16),
    BOX(40, 178, 780, 66, "読み方: シーケンス番号でページの新旧 → 状態ビットマップで「書込済」だけ → Namespace+Key+Type+Value を読む → 同じ Namespace+Key は最新を採用 → string/blob は Span 分の後続エントリを連結",
        None, SIG, SSOFT, INK, 8, 1.6, 11, 9.5),
], "ESP-IDF NVS: 4KB ページ + 状態ビットマップ + 32 バイトエントリ（Namespace + 文字列キー）")

F["b11_zephyr"] = SVG(860, 220, [
    T(430, 26, "Zephyr NVS — 両端から詰める", "middle", 12.5, INK, True),
    RECT(120, 60, 620, 46, 4, PAN, LIN, 1.4),
    RECT(120, 60, 240, 46, 4, GRN, GRN, 0),
    RECT(560, 60, 180, 46, 4, SIG, SIG, 0),
    T(240, 88, "データ（前方から）", "middle", 10.5, "#fff", True),
    T(650, 88, "ATE（後方から）", "middle", 10.5, "#fff", True),
    ARR(180, 120, 320, 120, GRN, 1.6), ARR(700, 120, 560, 120, SIG, 1.6),
    T(430, 138, "互いに向かって伸ばす。ATE = 16 ビット ID・オフセット・長さ・CRC の固定長記録", "middle", 10, MUT),
    BOX(40, 158, 780, 50, "キーは 16 ビット ID（文字列でなく番号）。後の ATE ほど手前に積まれ、最新の ATE が有効。ソース subsys/fs/nvs/nvs.c の struct nvs_ate が仕様書。後継が ZMS",
        None, LIN, PAN, INK, 8, 1.4, 11, 9.5),
], "Zephyr NVS は 16 ビット ID。データは前方、ATE は後方から両端で詰める")

F["b11_common"] = SVG(860, 260, [
    T(430, 26, "追記型キー値ストアの共通パターン", "middle", 12.5, INK, True),
    T(240, 62, "5 つの共通部品", "middle", 10.5, INK, True),
    T(60, 84, "区画を分ける単位（ページ / セクタ）", "start", 10, INK),
    T(60, 106, "世代の順序（消去カウンタ / シーケンス / ATE 順）", "start", 10, INK),
    T(60, 128, "キー（20bit / 文字列 / 16bit）", "start", 10, INK),
    T(60, 150, "エントリの状態（型・削除マーカ・ビットマップ・CRC）", "start", 10, INK),
    T(60, 172, "最新版の決定（後に書かれたもの）", "start", 10, INK),
    BOX(440, 60, 380, 130, "共通の 5 手順",
        "① 区画を消去ブロックに区切る  ② 各ブロックの世代番号で新旧を並べる  ③ 有効なエントリを拾う（消去済みは飛ばす）  ④ 同じキーは最新世代を採用  ⑤ 値の型に従い解釈（3 章）", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    T(430, 220, "一度この型を覚えると、NVM3 も ESP-IDF NVS も Zephyr NVS も、初見の独自ストアも読める", "middle", 10.5, MUT),
    T(430, 244, "ここでも古い値が履歴として残る（10・13 章）。ソースが仕様書", "middle", 10, FNT),
], "細部は違っても、区画・世代・キー・状態・最新版の 5 部品と 5 手順は共通")

# ===================== 12. ログ =====================

F["b12_ring"] = SVG(860, 280, [
    T(430, 26, "リングバッファ — 物理順 ≠ 時系列", "middle", 12.5, INK, True),
    CIRC(430, 150, 78, LIN, 1.4),
    T(430, 66, "末尾まで書いたら先頭に戻って古いのを上書き", "middle", 10, MUT),
    ARR(430, 82, 500, 110, SIG, 1.6),
    T(560, 150, "head（次に書く位置）", "start", 9.5, SIG, True),
    D(505, 108, SIG, 4),
    T(430, 155, "常に直近の N 件", "middle", 9.5, FNT),
    BOX(40, 235, 780, 40, "物理: レコード5 6 7 | 3 4（head の後ろが最古、前が最新）。時系列: 3→4→5→6→7",
        None, LIN, PAN, INK, 8, 1.4, 11, 9.5),
    T(220, 110, "head の見つけ方:", "start", 10.5, INK, True),
    T(220, 132, "① 明示的ポインタ", "start", 9.5, MUT),
    T(220, 152, "② シーケンス番号でソート（最も確実）", "start", 9.5, MUT),
    T(220, 172, "③ 0xFF との境界", "start", 9.5, MUT),
    T(220, 192, "④ 番号が急に小さくなる継ぎ目", "start", 9.5, MUT),
], "リングバッファは巻き戻って上書きする。物理順と時系列は違う。シーケンス番号でソートが確実")

F["b12_record"] = SVG(860, 250, [
    T(430, 26, "バイナリログのレコード", "middle", 12.5, INK, True),
    BYTES(50, 58, [("同期 A5", 70, ALI, ASOFT, "境界再発見"), ("timestamp", 130, SIG, SSOFT, "Unix秒/tick"),
                   ("seq", 70, GRN, "none", "並替・欠落"), ("level/mod/event", 200, LIN, PAN, "数値ID"),
                   ("引数", 130, LIN, PAN, "温度・code"), ("len/CRC", 90, INK, "none", "壊れ検出")], 32, 9, 7.5)[0],
    BOX(40, 128, 780, 58, "イベント ID の意味はソース（ログマクロ）か、ビルド時生成の辞書ファイルにある",
        "省メモリのため「文字列を置かず ID だけ記録、PC 側で辞書と突き合わせ」（Zephyr dictionary logging・SystemView）。辞書がないと ID の意味が分からない", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(40, 194, 780, 44, "最後のレコードは途中で切れている前提（電源断）。長さ/マジック不完全なら破棄、CRC 不一致も捨てる",
        None, ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "型付き記録 [同期][時刻][seq][ID][引数][CRC]。ID の意味は辞書/ソース。最後は切れている")

# ===================== 13. 秘密情報 =====================

F["b13_entropy"] = SVG(860, 240, [
    T(430, 26, "高エントロピー領域を探す — 鍵の在りか", "middle", 12.5, INK, True),
    AXES(70, 170, 720, 110, "オフセット", "H"),
    W(70, 110, 200, 110, c=SIG, lw=2), T(135, 100, "コード ~6", "middle", 9, MUT),
    W(200, 145, 320, 145, c=LIN, lw=2), T(260, 158, "文字列 ~4", "middle", 9, MUT),
    W(320, 168, 420, 168, c=MUT, lw=2), T(370, 158, "空き ~0", "middle", 9, MUT),
    W(420, 66, 560, 66, c=ALI, lw=2.4), T(490, 56, "鍵/圧縮/暗号 ~8", "middle", 9, ALI, True),
    W(560, 110, 720, 110, c=SIG, lw=2),
    T(430, 210, "鍵はランダム = 周囲より高エントロピー。16/24/32（対称）・32/66（ECC）に区切れる区間が候補", "middle", 10.5, MUT),
    T(430, 232, "binwalk -E / ent で測る。圧縮・暗号も高いので区別は文脈による（14 章）", "middle", 10, FNT),
], "鍵は高エントロピー。binwalk -E の急に高い区間で、鍵長に区切れるものが候補")

F["b13_patterns"] = SVG(860, 260, [
    T(430, 26, "既知の形式・パターンで探す", "middle", 12.5, INK, True),
    stack(40, 54, 380, [("PEM（テキスト）", "BEGIN ... PRIVATE KEY = 平文の秘密鍵", ALI, ASOFT),
                        ("DER（バイナリ）", "30 82 で始まる証明書・鍵。openssl asn1parse", GRN, "none"),
                        ("証明書", "BEGIN CERTIFICATE。openssl x509 で中身", LIN, PAN)], 54, 6)[0],
    stack(440, 54, 380, [("JWT トークン", "eyJ で始まる Base64.Base64.Base64", GRN, "none"),
                         ("クラウド鍵", "AKIA…（AWS）などの決まった形", GRN, "none"),
                         ("汎用", "password/token/psk 文字列、32/64 桁 hex", LIN, PAN)], 54, 6)[0],
    T(430, 235, "gitleaks / trufflehog は多数のパターンを内蔵。CI に組み込んで自動化（19 章）", "middle", 10.5, MUT),
], "PEM の BEGIN PRIVATE KEY、DER の 30 82、JWT の eyJ、クラウド鍵の形で検索")

# ===================== 14. 圧縮と暗号化 =====================

F["b14_entropy"] = SVG(860, 240, [
    T(430, 26, "エントロピー H（0〜8）= ランダムさ", "middle", 12.5, INK, True),
    AXES(70, 175, 720, 130, "H", None),
    W(70, 175, 200, 175, c=MUT, lw=3), T(135, 190, "空き ≈ 0", "middle", 9, MUT),
    W(200, 110, 340, 110, c=LIN, lw=3), T(270, 125, "テキスト ≈ 4", "middle", 9, MUT),
    W(340, 78, 500, 78, c=SIG, lw=3), T(420, 93, "コード ≈ 6", "middle", 9, MUT),
    W(500, 52, 720, 52, c=ALI, lw=3), T(610, 67, "圧縮 / 暗号 ≈ 8", "middle", 9, ALI, True),
    T(60, 52, "8", "end", 9, FNT), T(60, 175, "0", "end", 9, FNT),
    T(430, 218, "区間ごとに H を測ると、中身の種類（コード・データ・空き・圧縮/暗号）と境界が見える", "middle", 10.5, MUT),
], "H は 0〜8 のランダムさ。空き0・テキスト4・コード6・圧縮/暗号8。区間ごとに測り領域を分類")

F["b14_distinguish"] = SVG(860, 280, [
    T(430, 26, "H ≈ 8 を「圧縮」と「暗号」に分ける", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 90, "手がかり1: ヘッダ / マジック",
        "圧縮には形式があり先頭にマジック（1F 8B gzip、28 B5 2F FD zstd…）。暗号にはマジックがない", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(305, 56, 250, 90, "手がかり2: ヒストグラム",
        "暗号は全バイト値がほぼ均一（カイ二乗が理想に近い）。圧縮は微妙な偏りが残ることも。ent で見る", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(570, 56, 250, 90, "手がかり3: 展開できるか",
        "圧縮なら展開すれば意味のあるデータ。暗号は鍵なしでゴミのまま。binwalk -e / unblob が自動", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(40, 170, 780, 66, "なぜ大事か",
        "圧縮なら展開して中身を解析できる。暗号なら鍵なしでは踏み込めない（時間を無駄にしない判断）。「暗号化されている＝一定の保護がある」という設計の読み取りにもなる（13 章の逆）", GRN, "none", INK, 8, 1.6, 12, 10),
    T(430, 262, "ヘッダは低エントロピーで手がかりが残る。区間を細かく測るのが効く", "middle", 10.5, MUT),
], "マジックがあれば圧縮、なければ暗号。展開できれば圧縮。カイ二乗の均一さも手がかり")

# ===================== 15. Linux =====================

F["b15_layers"] = SVG(860, 335, [
    T(430, 26, "Linux 組み込みイメージの層構造", "middle", 12.5, INK, True),
    MEMMAP(220, 52, 420, [("0x0", "1次/2次ブートローダ（SPL）", "生バイナリ", LIN, PAN),
                          ("", "U-Boot", "環境変数（bootargs・mtdparts）", SIG, SSOFT),
                          ("", "カーネル（zImage/uImage）", "多くは圧縮", GRN, "none"),
                          ("", "デバイスツリー（DTB）", "0xd00dfeed", LIN, PAN),
                          ("", "ルートファイルシステム", "squashfs/JFFS2/UBIFS/ext4", GRN, "none"),
                          ("", "オーバーレイ・データ", "設定・ログ", LIN, PAN)], 40)[0],
    BOX(40, 60, 160, 120, "まず binwalk -e / unblob",
        "既知形式の塊なので自動で割れる。メモリマップがほぼ完成", GRN, "none", INK, 8, 1.6, 11.5, 10),
    T(430, 316, "U-Boot の mtdparts と DTB（dtc で DTS に）がパーティション構成の決定版", "middle", 10.5, MUT),
], "ブートローダ・カーネル・DTB・ルートFSの層。binwalk -e / unblob でまず割る")

F["b15_rootfs"] = SVG(860, 280, [
    T(430, 26, "ルートファイルシステムから何を読むか", "middle", 12.5, INK, True),
    stack(40, 54, 380, [("/etc/passwd /etc/shadow", "ユーザとパスワードハッシュ。弱いハッシュ・共通PW", ALI, ASOFT),
                        ("/etc/init.d rc* systemd", "起動時に何が動くか。裏口・telnet", GRN, "none"),
                        ("/etc/ssl /etc/*/keys", "証明書と秘密鍵（13 章）", ALI, ASOFT)], 54, 6)[0],
    stack(440, 54, 380, [("/etc/config *.conf", "ネットワーク・資格情報", LIN, PAN),
                         ("/bin /sbin /usr/bin", "独自バイナリ → 16 章の対象", GRN, "none"),
                         ("/etc/os-release banner", "バージョン → 既知の CVE と照合", LIN, PAN)], 54, 6)[0],
    BOX(40, 234, 780, 40, "展開: squashfs → unsquashfs、JFFS2 → jefferson、UBIFS → ubireader、ext4 → マウント/7z。NAND は OOB/ECC が混じることがある",
        None, SIG, SSOFT, INK, 8, 1.4, 11, 9.5),
], "shadow・鍵・独自バイナリ・バージョンを監査。squashfs は unsquashfs")

# ===================== 16. 逆アセンブル =====================

F["b16_flow"] = SVG(860, 210, [
    T(430, 26, "逆アセンブルと逆コンパイル", "middle", 12.5, INK, True),
    flowright(70, 110, [("機械語（バイト列）", "7f b5 04 46 …", LIN, PAN),
                        ("アセンブリ", "push {r0-r2,r4,lr} …（1対1に近い）", SIG, SSOFT),
                        ("C 風擬似コード", "推測が入るが読みやすい", GRN, "none")], 210, 60, 30)[0],
    T(430, 175, "Ghidra は両方を並べて見せる。擬似コードで把握し、疑問はアセンブリで確かめる", "middle", 10.5, MUT),
], "逆アセンブルは命令に、逆コンパイルは C 風に戻す。擬似コードで把握しアセンブリで確認")

F["b16_load"] = SVG(860, 250, [
    T(430, 26, "生バイナリを Ghidra に読ませる 3 設定", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 80, "① アーキテクチャ",
        "Cortex-M は ARM:LE:32:Cortex。Cortex-A は v7/AArch64。7 章で調べた CPU", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(305, 56, 250, 80, "② ロードアドレス",
        "オフセット 0 が焼かれる実アドレス（7 章）。0x08000000 や 0x08008000（MCUboot の後ろ）", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(570, 56, 250, 80, "③ ベクタテーブル",
        "先頭を表として解釈させ、リセットハンドラ（−1 の偶数）から解析開始", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(40, 160, 780, 66, "ロードアドレスが正しいと、コード中のポインタ（リテラルプール、7 章）が正しい場所を指し、文字列や関数への参照がつながる",
        "間違っていると参照が全部外れる。ELF なら Ghidra が自動判定（5 章）", GRN, "none", INK, 8, 1.6, 12, 10),
], "アーキテクチャ・ロードアドレス・ベクタテーブルの 3 設定。ロードアドレスで参照がつながる")

F["b16_anchors"] = SVG(860, 300, [
    T(430, 26, "どこから読むか — とっかかりの見つけ方", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("文字列から", "特徴的な文字列（\"Login failed\"、フォーマット文字列）を XREF でたどる。エラーメッセージは機能の目印", SIG, SSOFT),
                        ("周辺レジスタから", "0x40000000 台の定数 = ハードウェアレジスタ。データシートで「UART/SPI/GPIO を触る関数」と分かる", GRN, "none"),
                        ("既知の定数から", "AES の S-box、SHA の初期値 0x6a09e667、CRC 多項式、マジックナンバーを検索", SIG, SSOFT),
                        ("割り込みハンドラから", "ベクタテーブルの各エントリ = その周辺機器の処理。SysTick=タイマ、USART=通信", GRN, "none"),
                        ("エントリポイントから", "リセットハンドラ → スタートアップ → main と順にたどる", LIN, PAN)], 40, 4)[0],
    T(430, 288, "シンボルがないと FUN_08001234 が並ぶだけ。意味のある入口から入り、XREF で役割を逆にたどる", "middle", 10, MUT),
], "文字列・周辺レジスタ・既知の定数・割り込みハンドラから入り、XREF で役割をたどる")

# ===================== 17. 動的解析 =====================

F["b17_vs"] = SVG(860, 210, [
    T(430, 26, "静的解析と動的解析", "middle", 12.5, INK, True),
    BOX(40, 56, 380, 80, "静的解析（5〜16 章）",
        "動かさずにファイルの中身を読む。全体を俯瞰できるが、実行時に決まる値（計算される鍵、通る経路）は追えない", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 56, 380, 80, "動的解析（この章）",
        "動かして実行時の状態を観察する。鍵が実行時に計算される・状態遷移が複雑・経路が入力で変わるときに効く", GRN, "none", INK, 8, 1.6, 12, 10),
    T(430, 170, "実務では両者を往復する（16 章で当たりをつけ、17 章で確かめ、書き戻す）", "middle", 10.5, MUT),
], "静的は読むだけ、動的は動かして観察。実行時にしか分からないことに効く")

F["b17_emu"] = SVG(860, 230, [
    T(430, 26, "実機とエミュレータ", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("gdb + OpenOCD / pyOCD（実機）", "SWD/JTAG で接続。ブレーク・ウォッチ・ステップ・メモリ読み書き。「鍵を使う関数」で止めて RAM を読めば実行時の鍵が見える", SIG, SSOFT),
                        ("QEMU / Renode（系全体）", "実機なしでボードと周辺を再現。周辺の応答を差し替え、実行を記録・再現できる", GRN, "none"),
                        ("Unicorn Engine（関数単位）", "CPU コアだけで特定関数を実行。「この暗号/チェックサム関数だけ動かして出力を見る」", SIG, SSOFT)], 48, 6)[0],
    T(430, 212, "エミュレータの利点は周辺応答の差し替えと再現性。難点は対象ボード/周辺の再現が要ること", "middle", 10, MUT),
], "実機は gdb+OpenOCD、系全体は QEMU/Renode、関数単位は Unicorn")

F["b17_stack"] = SVG(860, 280, [
    T(430, 26, "クラッシュ解析 — スタックから履歴を復元", "middle", 12.5, INK, True),
    BOX(40, 56, 380, 78, "Cortex-M は例外時に自動退避",
        "R0-R3・R12・LR・PC・xPSR をスタックに積む。フォールトハンドラや RAM ダンプ（4 章）でこれを取る", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(440, 56, 380, 78, "PC と LR が原因を語る",
        "積まれた PC = クラッシュした命令。LR = 呼び出し元。addr2line（ELF があれば）で行に", GRN, "none", INK, 8, 1.6, 12, 10),
    T(430, 152, "スタックをさかのぼる", "middle", 11, INK, True),
    BYTES(120, 166, [("local変数", 120, LIN, PAN, ""), ("0x080012a5", 120, GRN, "none", "戻りアドレス"), ("引数", 90, LIN, PAN, ""), ("0x08003f11", 120, GRN, "none", "戻りアドレス"), ("…", 60, LIN, PAN, "")], 30, 9, 8)[0],
    T(430, 228, "フラッシュ範囲の奇数値（0x0800xxxx | 1）を拾えば、呼び出しの履歴（コールスタック）が復元できる", "middle", 10.5, MUT),
    T(430, 252, "ESP32 espcoredump.py、Zephyr coredump が半自動化（12 章）", "middle", 10, FNT),
], "例外時に PC/LR がスタックに積まれる。フラッシュ範囲の奇数値を拾えばコールスタックが復元できる")

F["b17_loop"] = SVG(860, 210, [
    T(430, 26, "静的と動的の往復", "middle", 12.5, INK, True),
    flowright(40, 105, [("静的で当たり", "この関数が鍵を作るらしい（16 章）", SIG, SSOFT),
                        ("動的で確認", "ブレークして実行時の入出力を見る"),
                        ("書き戻す", "関数名・型を付ける", GRN, "none"),
                        ("次の疑問へ", "解析を育てる")], 175, 60, 20)[0],
    ARR(760, 130, 760, 160, MUT, 1.4), W(760, 160, 127, 160, c=MUT, lw=1.4, dash="4,3"), ARR(127, 160, 127, 133, MUT, 1.4),
    T(430, 195, "分かったことを静的解析に書き戻し、次へ。解析は 1 回で終わらず育てる作業", "middle", 10.5, MUT),
], "静的で当たりをつけ、動的で確かめ、書き戻す。解析は育てる作業")

# ===================== 18. 差分 =====================

F["b18_why"] = SVG(860, 250, [
    T(430, 26, "なぜ差分が強力か", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("更新前後", "書き換わった場所 = 更新が触った領域。バージョン・設定・コードのどこが変わったか", SIG, SSOFT),
                        ("正常機と異常機", "違う場所に異常の原因がある可能性が高い", GRN, "none"),
                        ("操作の前後", "ある操作がフラッシュのどこに何を書いたか = 未知の構造を解く最短路", SIG, SSOFT),
                        ("同一ロットの複数機", "共通=固定値/コード、違う=個体データ（シリアル・鍵・較正値）", GRN, "none")], 40, 6)[0],
    T(430, 232, "ゼロから理解するより、2 つを比べて違いだけ見るのは桁違いに速い", "middle", 10.5, MUT),
], "更新前後・正常異常・操作前後・個体間を比べ、変わった場所だけ見る")

F["b18_runs"] = SVG(860, 230, [
    T(430, 26, "差分を意味に変える", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("小さな連続した変化", "カウンタ・バージョン・タイムスタンプ", SIG, SSOFT),
                        ("4KB / 64KB 境界に揃った大きな変化", "フラッシュブロックの書き換え（設定更新・ログ追記）", GRN, "none"),
                        ("コード領域の変化", "ファーム更新", LIN, PAN)], 46, 6)[0],
    T(430, 198, "cmp -l / radiff2 / vbindiff。ずれる場合はブロック/構造単位で。変化区間をメモリマップに重ねて意味を推定", "middle", 10.5, MUT),
], "変化した区間がどの領域かを見て意味を推定。小さな連続=カウンタ、ブロック境界=設定/ログ")

F["b18_corrupt"] = SVG(860, 250, [
    T(430, 26, "壊れたダンプ — まず切り分ける", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 80, "読み出しの失敗",
        "2 回読むと違う、特定区間だけ 0/0xFF。→ 読み直す。配線・電源・クロック", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    BOX(305, 56, 250, 80, "実際の破損",
        "CRC/ハッシュが合わない、追記の途中で切れている。→ 破損として扱う", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    BOX(570, 56, 250, 80, "自分の解釈違い（最多）",
        "1 か所だけ辻褄が合わない。→ エンディアン・オフセット・アラインメント・版を疑う", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(40, 158, 780, 66, "「まず自分を疑う」",
        "壊れていると決める前に、エンディアン（3 章）・ロードアドレス（7 章）・構造体の版・パディングを確かめる。破損は CRC/ハッシュで確認、追記型は最後を捨て、冗長領域で救い、必要な部分だけ取れれば十分", GRN, "none", INK, 8, 1.6, 12, 10),
], "読み出し失敗・実際の破損・自分の解釈違いを切り分ける。まず自分を疑う")

# ===================== 19. 自動化 =====================

F["b19_why"] = SVG(860, 210, [
    T(430, 26, "なぜパーサに落とすか", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 80, "再現できる",
        "半年後に同じダンプを見て、どう解いたか思い出せる", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(305, 56, 250, 80, "横展開できる",
        "同じ形式の別ダンプ（別ロット・別版）に、また手作業しなくて済む", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(570, 56, 250, 80, "検証できる",
        "「この解釈で全レコード読めるか」を確かめられる。差分・監査を仕組み化", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    T(430, 175, "手で解くのは最初の 1 回。構造が分かった時点でパーサに落とす", "middle", 10.5, MUT),
], "再現・横展開・検証のためにパーサに落とす。手作業は最初の 1 回だけ")

F["b19_tools"] = SVG(860, 250, [
    T(430, 26, "3 つの道具の使い分け", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 96, "struct",
        "固定長・アラインメントの分かった構造。1 行で済む。assert でマジック・長さを検査", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    BOX(305, 56, 250, 96, "construct",
        "可変長・繰り返し・条件で形が変わる構造（TLV・追記型ストレージ）。宣言的に書ける。build でテストデータ生成も", GRN, "none", INK, 8, 1.6, 12, 10),
    BOX(570, 56, 250, 96, "Kaitai Struct",
        ".ksy を 1 回書くと多言語パーサを生成 + Web IDE で色付き可視化。チームで共有する形式仕様に", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    T(430, 178, "固定 → struct、可変 → construct、多言語+可視化+仕様 → Kaitai", "middle", 10.5, MUT, True),
    T(430, 202, "ダンプ → 分類 → 各領域パース → 報告 をパイプライン化し、CI で秘密・バージョンを自動チェック（13 章）", "middle", 10, MUT),
], "固定は struct、可変は construct、多言語・可視化・仕様は Kaitai")

F["b19_verify"] = SVG(860, 236, [
    T(430, 26, "パーサに検証を組み込む", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("マジックと固定値の assert", "構造の入口で理解違い・オフセットずれを露見させる", SIG, SSOFT),
                        ("CRC / ハッシュの照合", "3・18 章。合えば解釈が正しく壊れていない", GRN, "none"),
                        ("末尾まで読み切れるか", "ちょうど到達すれば OK。余る/足りないなら理解違い", SIG, SSOFT),
                        ("ラウンドトリップ", "読んだものを書き戻すと元のバイト列に一致するか", GRN, "none")], 40, 6)[0],
    T(430, 205, "パーサ・スクリプト・メモリマップ・由来を残すのが解析の完成", "middle", 10.5, MUT),
], "assert・CRC 照合・末尾まで読み切る・ラウンドトリップで「正しく読めているか」を確かめる")

# ===================== 20. ケーススタディ =====================

F["b20_caseA"] = SVG(860, 250, [
    T(430, 26, "ケース A: 更新に失敗する機器", "middle", 12.5, INK, True),
    flowright(30, 100, [("ダンプ", "SWD で全体、ハッシュ記録", SIG, SSOFT),
                        ("メモリマップ", "Boot/slot0/slot1/設定"),
                        ("MCUboot ヘッダ", "slot1 が新しい = 更新は届いた", GRN, "none"),
                        ("トレーラ", "slot1 の image ok が未セット", ALI, ASOFT),
                        ("SHA-256 照合", "一致 = 壊れていない", GRN, "none")], 152, 62, 10, sz=10.5, ssz=8.5)[0],
    BOX(40, 165, 780, 60, "判断",
        "イメージも署名も正しい。だがアプリの「自己確認（image ok を書く）」処理が呼ばれず、ブートローダがロールバックしている。アプリのコードを 16 章で確認へ", GRN, "none", INK, 8, 1.6, 12, 10),
], "ヘッダ・トレーラ・image ok・SHA-256 でロールバックの原因を特定")

F["b20_caseC"] = SVG(860, 290, [
    T(430, 26, "ケース C: 秘密が漏れていないかの監査", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("① 読み出し保護の確認", "有効か。レビューのため開発機でダンプ", SIG, SSOFT),
                        ("② エントロピーマップ", "高エントロピー区間を列挙。ファーム本体は暗号化なし（H≈6）", GRN, "none"),
                        ("③ PEM/DER 検索", "公開鍵・証明書はあるが秘密鍵はない（正しい）", SIG, SSOFT),
                        ("④ NVS の全履歴検査", "削除済みマーカ付きのテスト用 Wi-Fi パスワードが平文で残存", ALI, ASOFT),
                        ("⑤ パターンスキャン", "API キー・トークンはなし", GRN, "none")], 40, 5)[0],
    BOX(40, 245, 780, 40, "判断: 致命的な鍵漏れはないが、(1) 本体が暗号化されず保護のみが防御、(2) 削除情報が履歴に残る、が指摘。対策は PSA / IoT セキュリティ編。監査は 19 章で自動化",
        None, GRN, "none", INK, 8, 1.4, 11, 9.5),
], "保護確認・エントロピー・鍵/証明書検索・ストレージ履歴・パターンで自己監査")

F["b20_caseD"] = SVG(860, 310, [
    T(430, 26, "ケース D: 素性の分からないファーム", "middle", 12.5, INK, True),
    stack(40, 54, 780, [("① file/strings/binwalk", "生バイナリ。RTOS/ベアメタルの手がかり", SIG, SSOFT),
                        ("② xxd -e -g4 で先頭", "0 が RAM、4 がフラッシュ奇数 = Cortex-M 確定。ロードアドレス推定", GRN, "none"),
                        ("③ ベクタテーブル", "繰り返しアドレス・割り込み数からチップ推定", SIG, SSOFT),
                        ("④ Ghidra", "ARM Cortex/ロードアドレス/ベクタで読み込み", GRN, "none"),
                        ("⑤ 文字列・周辺から機能", "\"FreeRTOS\" を XREF、0x40013800=USART1 で通信処理", SIG, SSOFT),
                        ("⑥ Unicorn で関数実行", "設定チェックサム関数 = CRC-16/CCITT と判明", GRN, "none")], 38, 5)[0],
    BOX(40, 248, 780, 38, "判断: ソースなしでも使用 RTOS・通信周辺・設定形式が復元でき、保守に必要な範囲を把握。構造は 19 章でパーサに残す",
        None, GRN, "none", INK, 8, 1.4, 11, 9.5),
], "ベクタテーブル → ロードアドレス → Ghidra → 文字列/周辺 → Unicorn で素性を復元")

