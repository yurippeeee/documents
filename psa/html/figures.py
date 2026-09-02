# -*- coding: utf-8 -*-
"""PSA API 編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
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

# ===================== PSA 向けヘルパ =====================

def BYTES(x, y, segs, h=28, sz=10, tsz=9):
    """バイト列の区画図。segs = [(label, width, color, fill, sublabel)]。区画を横に並べる。"""
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

def STATE(x, y, w, h, label, sub=None, c=SIG, fill=SSOFT, sz=12):
    return BOX(x, y, w, h, label, sub, c, fill, INK, 16, 1.5, sz, 9.5)

def CODE(x, y, lines, sz=10.5, c=INK, lh=15):
    o = []
    for i, l in enumerate(lines):
        col = c
        if isinstance(l, tuple):
            l, col = l
        o.append(T(x, y + i*lh, l, "start", sz, col, False, True))
    return "".join(o)

def NOTE(x, y, w, h, text, c=FNT, sz=10):
    return BOX(x, y, w, h, None, text, c, "none", MUT, 8, 1.1, 11, sz, dash="4,3")

def LANES(names, x0, y0, gap, ytop, ybot, sz=11, bw=124):
    """シーケンス図の縦線。names の数だけ。戻り値: (svg, [x座標])"""
    o = []; xs = []
    for i, n in enumerate(names):
        xx = x0 + i*gap
        xs.append(xx)
        o.append(BOX(xx - bw/2, y0, bw, 32, n, None, LIN, PAN, INK, 6, 1.3, sz))
        o.append(W(xx, ytop, xx, ybot, c=LIN, lw=1.2, dash="4,4"))
    return "".join(o), xs

def MSG(xs, a, b, y, label, c=MUT, sz=9.5, dash=None, above=True):
    """レーン a から b への矢印とラベル。"""
    x1, x2 = xs[a], xs[b]
    o = []
    if dash:
        o.append(W(x1, y, x2 - (7 if x2 > x1 else -7), y, c=c, lw=1.4, dash=dash))
        o.append(ARR(x2 - (14 if x2 > x1 else -14), y, x2, y, c, 1.4, 7))
    else:
        o.append(ARR(x1, y, x2, y, c, 1.5, 7))
    o.append(T((x1 + x2)/2, y - 5 if above else y + 13, label, "middle", sz, c))
    return "".join(o)

def SELF(xs, a, y, label, c=MUT, sz=9.5, w=200, side=1):
    """レーン a 自身の処理（枠つき注記）。"""
    x = xs[a]
    return RECT(x - w/2, y - 11, w, 22, 5, PAN, c, 1.1) + T(x, y + 4, label, "middle", sz, c)

def BADGE(x, y, text, c=SIG, fill=SSOFT, sz=9.5, w=None):
    ww = w or (sum(2 if ord(ch) > 0x2000 else 1 for ch in text) * sz * 0.6 + 14)
    return RECT(x, y, ww, 18, 9, fill, c, 1.1) + T(x + ww/2, y + 13, text, "middle", sz, c, True)

# ===================== 01. PSA とは何か =====================

F["s01_three"] = SVG(860, 330, [
    T(430, 26, "「PSA」と呼ばれる 3 つのもの", "middle", 12.5, INK, True),
    BOX(40, 60, 240, 96, "PSA Certified（認証制度）",
        "第三者機関がチップ・製品のセキュリティを評価。Level 1〜3。製品を出すときに取る", SIG, SSOFT),
    BOX(310, 60, 240, 96, "PSA Certified APIs（関数仕様）",
        "Crypto / Storage / Attestation / FWU の C 関数仕様。無償公開。本編の主題", SIG, SSOFT, INK, 8, 2.2),
    BOX(580, 60, 240, 96, "参照実装（コード）",
        "TF-M と Mbed TLS / TF-PSA-Crypto。API の中身を実際に動かすオープンソース", SIG, SSOFT),
    ARR(430, 156, 430, 196, MUT, 1.6), ARR(700, 156, 700, 196, MUT, 1.6), ARR(160, 156, 160, 196, MUT, 1.6),
    BOX(40, 200, 240, 60, "製品の評価に使う", "コードに直接は関係しない", LIN, PAN),
    BOX(310, 200, 240, 60, "読者が呼ぶ関数はここで定義", "psa_import_key() など", LIN, PAN),
    BOX(580, 200, 240, 60, "読者がリンクするライブラリ", "関数の中身はここにある", LIN, PAN),
    T(430, 300, "「PSA を使う」＝コードを書く人にとっては「PSA Certified APIs の関数を呼ぶ」こと", "middle", 11, MUT),
], "認証制度・関数仕様・参照実装の 3 つが同じ名前で呼ばれる。本編は真ん中の「関数仕様」を扱う")

F["s01_apis"] = SVG(860, 360, [
    T(430, 26, "PSA Certified APIs の一覧と、本編で扱う範囲", "middle", 12.5, INK, True),
    BOX(40, 56, 250, 120, "Crypto API", "psa/crypto.h — 鍵管理・ハッシュ・MAC・暗号・AEAD・署名・鍵導出・鍵合意・乱数", SIG, SSOFT, INK, 8, 2.2),
    BADGE(48, 150, "03〜12 章（中心）", SIG, SSOFT),
    BOX(305, 56, 250, 120, "Secure Storage API", "psa/internal_trusted_storage.h, psa/protected_storage.h — 小さなデータを守って保存", SIG, SSOFT, INK, 8, 2.2),
    BADGE(313, 150, "13 章", SIG, SSOFT),
    BOX(570, 56, 250, 120, "Attestation API", "psa/initial_attestation.h — 「何者で何を動かしているか」の署名付き申告", SIG, SSOFT, INK, 8, 2.2),
    BADGE(578, 150, "14 章", SIG, SSOFT),
    BOX(40, 200, 250, 100, "Firmware Update API", "psa/update.h — 更新イメージの受け取り・検証・切り替え", LIN, PAN),
    BADGE(48, 274, "18 章で概要のみ", FNT, "none"),
    BOX(305, 200, 250, 100, "Firmware Framework（FF-M）", "psa/service.h, psa/client.h — セキュア側の部屋（パーティション）の仕組み", LIN, PAN),
    BADGE(313, 274, "16 章で必要な分", FNT, "none"),
    BOX(570, 200, 250, 100, "Status codes", "psa/error.h — 全 API 共通の戻り値 psa_status_t", LIN, PAN),
    BADGE(578, 274, "02 章", SIG, SSOFT),
    T(430, 338, "実際のアプリケーションが日常的に呼ぶのは、Crypto API の 20〜30 関数に収まる", "middle", 11, MUT),
], "色の濃い 3 つが本編の中心。薄い 3 つは概要と参照先だけを示す")

F["s01_where"] = SVG(860, 380, [
    T(430, 26, "同じソースコードが動く 2 つの配置", "middle", 12.5, INK, True),
    # left: library
    T(220, 56, "A. ライブラリとして同じ場所で（Mbed TLS 単体）", "middle", 11.5, INK, True),
    RECT(40, 70, 360, 250, 10, PAN, LIN, 1.4),
    BOX(60, 90, 320, 60, "アプリケーション", "psa_import_key(...) を呼ぶ", LIN, SCR),
    ARR(220, 150, 220, 178, MUT, 1.6),
    BOX(60, 182, 320, 60, "Mbed TLS（PSA Crypto 実装）", "普通の C 関数。同じメモリ空間・同じ特権", SIG, SSOFT),
    BOX(60, 254, 320, 50, "鍵ストア（ライブラリ内の配列）", "アプリのバグで読まれ得る", ALI, ASOFT),
    # right: TF-M
    T(640, 56, "B. セキュア側に置いて壁越しに（TF-M）", "middle", 11.5, INK, True),
    RECT(460, 70, 170, 250, 10, PAN, LIN, 1.4),
    T(545, 88, "非セキュア領域", "middle", 10, MUT, True),
    BOX(472, 100, 146, 70, "アプリケーション", "psa_import_key(...) ← 呼び方は同じ", LIN, SCR),
    BOX(472, 182, 146, 50, "NS インタフェース", "引数を包んで渡す", LIN, SCR),
    RECT(650, 70, 170, 250, 10, PAN, SIG, 1.8),
    T(735, 88, "セキュア領域", "middle", 10, SIG, True),
    BOX(662, 100, 146, 60, "ベニア（入口）", "SG 命令で状態切替", SIG, SSOFT),
    BOX(662, 172, 146, 60, "Crypto パーティション", "本物の psa_import_key", SIG, SSOFT),
    BOX(662, 244, 146, 60, "鍵ストア", "非セキュア側から物理的に読めない", SIG, SSOFT),
    ARR(618, 207, 662, 130, MUT, 1.6),
    T(640, 335, "TrustZone の壁", "middle", 10, SIG, True),
    W(640, 70, 640, 320, c=SIG, lw=3),
    T(430, 365, "PSA API は「関数の呼び方」だけを決め、「どこで実行されるか」は決めない", "middle", 11, MUT),
], "左: アプリと同じ場所で動く（覚えるのに最適）。右: セキュア側で動き、鍵は壁の向こう（製品向け）。呼び出すコードは同じ")

F["s01_handle"] = SVG(860, 320, [
    T(430, 26, "鍵の「値」ではなく「番号」を持つ", "middle", 12.5, INK, True),
    BOX(40, 60, 190, 66, "アプリケーション", "鍵のバイト列を一時的に持つ", LIN, PAN),
    ARR(230, 80, 400, 80, SIG, 2.0),
    T(315, 70, "psa_import_key（預ける）", "middle", 9, SIG, True),
    BOX(400, 60, 190, 66, "PSA の鍵ストア", "値＋方針（属性）を保持", SIG, SSOFT),
    ARR(400, 108, 230, 108, SIG, 2.0),
    T(315, 122, "鍵 ID（32 ビット整数）が返る", "middle", 9, SIG),
    BOX(40, 170, 190, 66, "アプリケーション", "以後は鍵 ID だけを持つ。値は memset で消す", LIN, PAN),
    ARR(230, 190, 400, 190, MUT, 1.6),
    T(315, 180, "psa_sign_hash(key_id, …)", "middle", 9, MUT, False, True),
    BOX(400, 170, 190, 66, "PSA が鍵を使って計算", "方針に合わない使い方は NOT_PERMITTED", SIG, SSOFT),
    ARR(400, 218, 230, 218, MUT, 1.6),
    T(315, 232, "結果（署名など）だけ返る", "middle", 9, MUT),
    BOX(620, 60, 200, 176, "値を取り出す関数がない",
        "psa_export_key は属性に EXPORT 用途を付けた鍵にしか効かない。付けなければ、乗っ取られたコードも鍵を読めない", ALI, ASOFT, INK, 8, 1.6, 12, 10),
    T(430, 290, "鍵を預けるときに用途を宣言し、以後ライブラリがそれを強制する（3 章）", "middle", 11, MUT),
], "鍵の値はライブラリに預け、アプリケーションは番号（鍵 ID）で使う。値を返す関数は原則として存在しない")

# ===================== 02. API の共通作法 =====================

F["s02_status"] = SVG(860, 340, [
    T(430, 26, "psa_status_t — 0 が成功、負が失敗。分類で覚える", "middle", 12.5, INK, True),
    BOX(40, 56, 160, 50, "PSA_SUCCESS = 0", "成功", SIG, SSOFT, INK, 8, 1.4, 11.5, 10, None, True),
    T(120, 130, "呼び方の誤り（コードを直す）", "middle", 10.5, INK, True),
    stack(40, 140, 220, [("BAD_STATE −137", "順序違反・init 忘れ", ALI, ASOFT),
                         ("INVALID_ARGUMENT −135", "引数の組み合わせ・形式", ALI, ASOFT),
                         ("NOT_PERMITTED −133", "鍵の用途・方針", ALI, ASOFT),
                         ("BUFFER_TOO_SMALL −138", "サイズマクロを使え", ALI, ASOFT)], 40, 4)[0],
    T(430, 130, "環境・設定（ビルドを直す）", "middle", 10.5, INK, True),
    stack(320, 140, 220, [("NOT_SUPPORTED −134", "PSA_WANT_* の宣言漏れ", GRN, "none"),
                          ("INSUFFICIENT_ENTROPY −148", "乱数源が未接続", GRN, "none"),
                          ("INSUFFICIENT_MEMORY −141", "鍵スロット・ヒープ", GRN, "none"),
                          ("INSUFFICIENT_STORAGE −142", "ITS/PS が満杯", GRN, "none")], 40, 4)[0],
    T(710, 130, "データ・実行時（設計で対処）", "middle", 10.5, INK, True),
    stack(600, 140, 220, [("INVALID_SIGNATURE −149", "改ざん・鍵違い", MUT, PAN),
                          ("DOES_NOT_EXIST −140", "ID 違い・未作成", MUT, PAN),
                          ("ALREADY_EXISTS −139", "永続鍵の残り", MUT, PAN),
                          ("HARDWARE/STORAGE_FAILURE", "−147 / −146。ドライバ", MUT, PAN)], 40, 4)[0],
    T(430, 325, "値はすべて psa/error.h で定義され、Crypto でもストレージでも共通", "middle", 10.5, MUT),
], "エラーは「コードを直す」「ビルドを直す」「設計で対処する」の 3 群に分けると原因の探し方が決まる")

F["s02_init"] = SVG(860, 250, [
    T(430, 26, "psa_crypto_init() が行うこと", "middle", 12.5, INK, True),
    flowright(40, 110, [("psa_crypto_init()", "全 API の前に 1 回", SIG, SSOFT),
                        ("乱数生成器の種付け", "エントロピー源 → DRBG"),
                        ("鍵ストレージの準備", "永続鍵の一覧を読む"),
                        ("ドライバの起動", "暗号エンジン・SE の初期化"),
                        ("PSA_SUCCESS", "2 回目以降は何もしない", SIG, SSOFT)], 150, 60, 12)[0],
    BOX(40, 170, 380, 56, "失敗の典型: PSA_ERROR_INSUFFICIENT_ENTROPY", "マイコンで乱数源（TRNG）を接続していない（15 章）", ALI, ASOFT, INK, 8, 1.4, 11, 9.5),
    BOX(440, 170, 380, 56, "呼び忘れの症状: PSA_ERROR_BAD_STATE", "ほとんどの関数が最初の呼び出しでこれを返す", ALI, ASOFT, INK, 8, 1.4, 11, 9.5),
], "初期化は乱数・ストレージ・ドライバの準備。何度呼んでも安全なので、各モジュールの先頭で呼んでよい")

F["s02_alg"] = SVG(860, 330, [
    T(430, 26, "psa_algorithm_t（32 ビット）のビット区画", "middle", 12.5, INK, True),
    BYTES(40, 60, [("分類 8bit", 130, SIG, SSOFT, "0x02 ハッシュ 0x03 MAC 0x04 暗号"),
                   ("方式・詳細 16bit", 340, LIN, PAN, "アルゴリズムの種類、パラメータ"),
                   ("ハッシュ 8bit", 350, GRN, "none", "内包するハッシュの ID（0x09 = SHA-256）")], 34, 11, 9.5)[0],
    T(40, 128, "分類: 0x05 AEAD  0x06 署名  0x07 公開鍵暗号  0x08 鍵導出  0x09 鍵合意  0x0a PAKE", "start", 9.5, MUT),
    CODE(40, 165, [("PSA_ALG_SHA_256                = 0x02000009   ← 分類 02、ハッシュ 09", MUT),
                   ("PSA_ALG_HMAC(PSA_ALG_SHA_256)  = 0x03800009   ← 分類 03（MAC）+ HMAC + SHA-256", INK),
                   ("PSA_ALG_GCM                    = 0x05500200   ← 分類 05（AEAD）、GCM", INK),
                   ("PSA_ALG_ECDSA(PSA_ALG_SHA_256) = 0x06000609   ← 分類 06（署名）+ ECDSA + SHA-256", INK),
                   ("PSA_ALG_HKDF(PSA_ALG_SHA_256)  = 0x08000109   ← 分類 08（鍵導出）+ HKDF + SHA-256", INK),
                   ("PSA_ALG_KEY_AGREEMENT(PSA_ALG_ECDH, PSA_ALG_HKDF(PSA_ALG_SHA_256))", INK),
                   ("                               = 0x09020109   ← 分類 09（鍵合意）+ ECDH + HKDF + SHA-256", MUT)], 10.5, INK, 17),
    T(430, 305, "括弧の中にハッシュを入れて組み立てる。PSA_ALG_GET_HASH(alg) で取り出せる", "middle", 11, MUT),
], "アルゴリズム定数は「分類 + 方式 + ハッシュ」の符号化された整数。上位 8 ビットを見れば何の操作か分かる")

F["s02_buffer"] = SVG(860, 300, [
    T(430, 26, "出力バッファの 3 つ組 — (buf, buf_size, &out_len)", "middle", 12.5, INK, True),
    RECT(40, 60, 480, 40, 4, SCR, LIN, 1.4),
    RECT(40, 60, 320, 40, 4, SSOFT, SIG, 1.4),
    T(200, 85, "実際に書かれた out_len バイト", "middle", 10.5, INK, True),
    T(440, 85, "未使用", "middle", 10.5, FNT),
    DIM(40, 115, 520, 115, "buf_size（呼ぶ側が伝える上限）", MUT, 10, 0),
    DIM(40, 135, 360, 135, "out_len（関数が返す実長）", SIG, 10, 0),
    BOX(560, 56, 260, 100, "足りないとき", "PSA_ERROR_BUFFER_TOO_SMALL を返し、何も書かない（部分出力なし）。out_len も不定", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    T(40, 190, "buf_size はサイズマクロで決める:", "start", 11, INK, True),
    CODE(40, 212, [("uint8_t sig[PSA_SIGN_OUTPUT_SIZE(PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1), 256,", INK),
                   ("                                PSA_ALG_ECDSA(PSA_ALG_SHA_256))];   /* = 64 */", INK),
                   ("uint8_t ct[PSA_AEAD_ENCRYPT_OUTPUT_SIZE(PSA_KEY_TYPE_AES, PSA_ALG_GCM, len)];  /* = len+16 */", INK),
                   ("uint8_t h[PSA_HASH_MAX_SIZE];   /* アルゴリズムが実行時に決まるなら MAX を使う */", MUT)], 10.5, INK, 16),
], "「サイズ」は上限、「長さ」は実長。決め打ちの数字はアルゴリズムを変えた瞬間に壊れるので、マクロで計算する")

F["s02_opstate"] = SVG(860, 300, [
    T(430, 26, "操作オブジェクトの状態遷移（ハッシュ・MAC・暗号・AEAD・鍵導出に共通）", "middle", 12.5, INK, True),
    STATE(40, 100, 170, 64, "inactive", "INIT 直後 / finish 後 / abort 後", LIN, PAN),
    STATE(330, 100, 170, 64, "active", "update を受け付ける", SIG, SSOFT),
    STATE(620, 100, 170, 64, "error", "abort 以外は BAD_STATE", ALI, ASOFT),
    ARR(210, 118, 330, 118, SIG, 1.8), T(270, 108, "setup 成功", "middle", 10, SIG, True),
    ARR(330, 146, 210, 146, MUT, 1.6), T(270, 165, "finish / verify 成功", "middle", 10, MUT),
    ARR(500, 118, 620, 118, ALI, 1.8), T(560, 108, "どれかが失敗", "middle", 10, ALI, True),
    # abort from error back to inactive: curved line under
    PL([(705, 164), (705, 230), (125, 230), (125, 170)], MUT, 1.6, "5,4"),
    ARR(125, 190, 125, 166, MUT, 1.6),
    T(415, 246, "abort（どの状態からでも inactive へ。inactive に対しても安全）", "middle", 10, MUT),
    # self loop on active
    PL([(415, 100), (415, 78), (470, 78), (470, 100)], SIG, 1.4),
    ARR(470, 92, 470, 100, SIG, 1.4, 6),
    T(442, 72, "update（何回でも）", "middle", 9.5, SIG),
    T(430, 285, "エラーが出たら必ず abort する。cleanup で無条件に abort するのが最も簡単", "middle", 11, MUT),
], "setup で active、finish で inactive に戻る。失敗すると error になり、abort でしか戻れない")

# ===================== 03. 鍵と属性 =====================

F["s03_policy"] = SVG(860, 300, [
    T(430, 26, "鍵 = 値 + 方針（policy）", "middle", 12.5, INK, True),
    T(200, 60, "従来のライブラリ", "middle", 11.5, INK, True),
    BOX(60, 74, 280, 50, "鍵 = 16 バイトの配列", "uint8_t key[16]", LIN, PAN, INK, 8, 1.4, 11.5, 10, None, False),
    ARR(200, 124, 120, 160, MUT, 1.5), ARR(200, 124, 280, 160, MUT, 1.5),
    BOX(40, 162, 150, 46, "AES に渡す", None, LIN, PAN), BOX(210, 162, 150, 46, "HMAC にも渡せる", None, ALI, ASOFT),
    T(200, 240, "同じ鍵の使い回しを止められない", "middle", 10.5, ALI),
    T(640, 60, "PSA", "middle", 11.5, INK, True),
    BOX(470, 74, 340, 90, "鍵 = 値 + psa_key_attributes_t",
        "type: AES / bits: 128 / usage: ENCRYPT|DECRYPT / algorithm: GCM / lifetime: 揮発 / id: —", SIG, SSOFT, INK, 8, 1.8, 11.5, 10),
    ARR(640, 164, 560, 200, MUT, 1.5), ARR(640, 164, 720, 200, MUT, 1.5),
    BOX(480, 202, 150, 46, "AES-GCM: 可", None, SIG, SSOFT), BOX(650, 202, 150, 46, "HMAC: NOT_PERMITTED", None, ALI, ASOFT),
    T(640, 270, "宣言した方針以外はライブラリが拒否する", "middle", 10.5, SIG),
], "PSA では鍵を作るときに「何の鍵で、何に使えるか」を宣言し、以後ライブラリがそれを強制する")

F["s03_types"] = SVG(860, 340, [
    T(430, 26, "psa_key_type_t（16 ビット）の主な値", "middle", 12.5, INK, True),
    BYTES(40, 56, [("カテゴリ", 200, SIG, SSOFT, "上位ビット: 0x1 生/HMAC, 0x2 対称, 0x4 公開鍵, 0x7 鍵ペア"),
                   ("詳細", 300, LIN, PAN, "暗号の種類、または楕円曲線の族（family）")], 30, 10.5, 9)[0],
    T(160, 130, "対称鍵・生データ", "middle", 11, INK, True),
    stack(40, 140, 240, [("AES  0x2400", "128 / 192 / 256 ビット", SIG, SSOFT),
                         ("HMAC  0x1100", "MAC 用。長さ任意", SIG, SSOFT),
                         ("DERIVE  0x1200", "鍵導出の入力専用", SIG, SSOFT),
                         ("RAW_DATA  0x1001", "暗号に使えない生データ", LIN, PAN)], 40, 4)[0],
    T(430, 130, "楕円曲線（family を添える）", "middle", 11, INK, True),
    stack(310, 140, 240, [("ECC_KEY_PAIR(f)  0x7100|f", "秘密鍵。公開鍵を導出できる", GRN, "none"),
                          ("ECC_PUBLIC_KEY(f)  0x4100|f", "公開鍵だけ", GRN, "none"),
                          ("SECP_R1  f=0x12", "P-256 / P-384 / P-521", LIN, PAN),
                          ("MONTGOMERY  f=0x41", "X25519（255 ビット）", LIN, PAN)], 40, 4)[0],
    T(700, 130, "RSA", "middle", 11, INK, True),
    stack(580, 140, 240, [("RSA_KEY_PAIR  0x7001", "2048 以上", GRN, "none"),
                          ("RSA_PUBLIC_KEY  0x4001", "公開鍵だけ", GRN, "none"),
                          ("TWISTED_EDWARDS  f=0x42", "Ed25519（255 ビット）", LIN, PAN),
                          ("CHACHA20  0x2004", "256 ビット。AEAD 用", SIG, SSOFT)], 40, 4)[0],
], "鍵ペア（0x7…）と公開鍵（0x4…）は別の種類。相手の公開鍵を取り込むときは PUBLIC_KEY を使う")

F["s03_usage"] = SVG(860, 320, [
    T(430, 26, "psa_key_usage_t — 1 ビット 1 用途。OR で組み合わせる", "middle", 12.5, INK, True),
    BYTES(40, 60, [("EXPORT 0x1", 90, ALI, ASOFT, "値を取り出す"), ("COPY 0x2", 80, LIN, PAN, "複製"),
                   ("CACHE 0x4", 80, LIN, PAN, "メモリ保持"),
                   ("ENCRYPT 0x100", 100, SIG, SSOFT, "暗号化"), ("DECRYPT 0x200", 100, SIG, SSOFT, "復号"),
                   ("SIGN_MSG 0x400", 105, GRN, "none", "署名・MAC 計算"), ("VERIFY_MSG 0x800", 105, GRN, "none", "検証"),
                   ("DERIVE 0x4000", 100, LIN, PAN, "導出・鍵合意")], 32, 9.5, 8.5)[0],
    T(40, 135, "SIGN_HASH 0x1000 / VERIFY_HASH 0x2000 は SIGN_MSG / VERIFY_MSG を暗黙に含む（逆は含まない）", "start", 10, MUT),
    BOX(40, 160, 250, 64, "署名鍵の最小", "SIGN_HASH のみ。EXPORT なし", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(305, 160, 250, 64, "AEAD 鍵の最小", "ENCRYPT | DECRYPT。片方向なら片方だけ", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(570, 160, 250, 64, "MAC 鍵", "SIGN_MESSAGE | VERIFY_MESSAGE（ENCRYPT ではない）", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(40, 240, 780, 56, "EXPORT を付けない限り psa_export_key() は NOT_PERMITTED",
        "これが「鍵が外に出ない」保証の実体。公開鍵は用途に関係なく psa_export_public_key() で取り出せる", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "用途は最小にする。特に EXPORT は「理由を説明できる鍵」だけに付ける")

F["s03_lifetime"] = SVG(860, 260, [
    T(430, 26, "psa_key_lifetime_t（32 ビット）= 場所 + 持続性", "middle", 12.5, INK, True),
    BYTES(40, 60, [("location（場所）24 ビット", 520, GRN, "none", "0 = 実装の内部、1 = 主セキュアエレメント、0x800000〜 = ベンダ定義"),
                   ("persistence 8 ビット", 260, SIG, SSOFT, "0 = 揮発、1 = 永続、0xff = 読み取り専用")], 34, 11, 9.5)[0],
    BOX(40, 130, 250, 60, "VOLATILE = 0", "電源断・destroy で消える。ID は自動。既定", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(305, 130, 250, 60, "PERSISTENT = 1", "ITS に保存。次回起動でも同じ ID。ID は自分で決める", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(570, 130, 250, 60, "(1 << 8) | 1 = 0x101", "セキュアエレメント内の永続鍵。コードは変わらない", GRN, "none", INK, 8, 1.4, 11.5, 10),
    T(430, 225, "PSA_KEY_LIFETIME_FROM_PERSISTENCE_AND_LOCATION(p, l) で組み立てる（12 章）", "middle", 10.5, MUT),
], "上位 24 ビットが「どこに置くか」、下位 8 ビットが「電源を切っても残るか」")

# ===================== 04. 鍵の作成と破棄 =====================

F["s04_lifecycle"] = SVG(860, 300, [
    T(430, 26, "鍵の一生", "middle", 12.5, INK, True),
    STATE(40, 70, 170, 64, "存在しない", "ID は無効", LIN, PAN),
    STATE(345, 70, 170, 64, "存在する", "鍵 ID で使える", SIG, SSOFT),
    STATE(650, 70, 170, 64, "破棄済み", "ID は無効", LIN, PAN),
    ARR(210, 94, 345, 94, SIG, 1.8), T(277, 84, "import / generate", "middle", 10, SIG, True),
    T(277, 110, "derivation_output_key", "middle", 9, SIG, False, True),
    ARR(515, 102, 650, 102, ALI, 1.8), T(582, 92, "destroy_key", "middle", 10, ALI, True),
    PL([(430, 70), (430, 48), (480, 48), (480, 70)], SIG, 1.4), ARR(480, 62, 480, 70, SIG, 1.4, 6),
    T(455, 44, "使用（何回でも）", "middle", 9.5, SIG),
    BOX(40, 165, 380, 60, "揮発鍵", "RAM のみ。プログラム終了・電源断でも消える", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    BOX(440, 165, 380, 60, "永続鍵", "作成時点で ITS に書かれる。destroy するまで残る。同じ ID は ALREADY_EXISTS", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    T(430, 265, "作成で鍵 ID が返り、破棄で無効になる。永続鍵は電源を切っても「存在する」に留まる", "middle", 11, MUT),
], "作成・使用・破棄の 3 段階。永続鍵だけが電源断をまたいで「存在する」状態を保つ")

F["s04_formats"] = SVG(860, 360, [
    T(430, 26, "psa_import_key / psa_export_* のバイト列形式", "middle", 12.5, INK, True),
    T(40, 60, "ECC 公開鍵（P-256）: 非圧縮点形式 65 バイト", "start", 11, INK, True),
    BYTES(40, 70, [("0x04", 50, SIG, SSOFT, "1"), ("X 座標（32 バイト、ビッグエンディアン）", 330, LIN, PAN, "32"),
                   ("Y 座標（32 バイト）", 330, LIN, PAN, "32")], 30, 10, 9)[0],
    T(40, 135, "ECC 秘密鍵（P-256 鍵ペア）: 整数 d をビッグエンディアン固定長で", "start", 11, INK, True),
    BYTES(40, 145, [("d（32 バイト。先頭 0 詰め）", 340, SIG, SSOFT, "32")], 30, 10, 9)[0],
    T(40, 210, "ECDSA 署名（9 章）: r と s の生の連結。DER ではない", "start", 11, INK, True),
    BYTES(40, 220, [("r（32 バイト）", 200, GRN, "none", "32"), ("s（32 バイト）", 200, GRN, "none", "32")], 30, 10, 9)[0],
    BOX(480, 140, 340, 120, "受け付けない形式",
        "PEM（-----BEGIN …）、SubjectPublicKeyInfo の DER 包装、SEC1 ECPrivateKey の包装、DER 形式の ECDSA 署名。いずれも中身のバイト列を取り出してから渡す", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    T(40, 290, "RSA: PKCS#1 の RSAPrivateKey / RSAPublicKey を DER 符号化（包装なし）。X25519 / Ed25519: 32 バイト（RFC 7748 / 8032）", "start", 10, MUT),
    T(430, 330, "形式が違うと PSA_ERROR_INVALID_ARGUMENT。import で最も多いエラー", "middle", 11, MUT),
], "PSA は「包装のない生のバイト列」を扱う。証明書や PEM から取り出すのは PSA の外の仕事")

F["s04_exists"] = SVG(860, 250, [
    T(430, 26, "永続鍵は「あれば使う、なければ作る」", "middle", 12.5, INK, True),
    BOX(40, 60, 230, 56, "psa_get_key_attributes(ID)", "存在を確かめる", SIG, SSOFT, INK, 8, 1.4, 11, 10, None, True),
    ARR(270, 88, 320, 88, MUT, 1.6),
    BOX(320, 60, 210, 56, "SUCCESS", "すでにある → その ID を使う", SIG, SSOFT, INK, 8, 1.4, 11, 10),
    ARR(155, 116, 155, 150, MUT, 1.6),
    BOX(40, 150, 230, 56, "DOES_NOT_EXIST / INVALID_HANDLE", "初回 → generate_key で作る", LIN, PAN, INK, 8, 1.4, 10, 10),
    ARR(270, 178, 320, 178, MUT, 1.6),
    BOX(320, 150, 210, 56, "以後は ID を直接使える", "psa_sign_hash(ID, ...)", LIN, PAN, INK, 8, 1.4, 11, 10),
    BOX(550, 60, 270, 146, "毎回 generate すると",
        "2 回目以降は PSA_ERROR_ALREADY_EXISTS で失敗する。存在しない永続鍵に対して DOES_NOT_EXIST と INVALID_HANDLE のどちらが返るかは実装差があるので、両方を受ける", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "起動のたびに作ろうとしないで、存在確認を先に行う")

# ===================== 05. 乱数とハッシュ =====================

F["s05_rng"] = SVG(860, 260, [
    T(430, 26, "psa_generate_random() の中身 — エントロピー源と DRBG", "middle", 12.5, INK, True),
    flowright(40, 100, [("エントロピー源", "TRNG（物理ゆらぎ）や OS の乱数", GRN, "none"),
                        ("種（seed）", "数十バイトの真の乱数"),
                        ("DRBG", "CTR_DRBG / HMAC_DRBG。種から大量の乱数を生成", SIG, SSOFT),
                        ("psa_generate_random", "output_size バイトを必ず埋める", SIG, SSOFT)], 175, 64, 28)[0],
    BOX(40, 160, 380, 70, "マイコンで INSUFFICIENT_ENTROPY が出たら",
        "エントロピー源が未接続。mbedtls_hardware_poll() か MBEDTLS_PSA_CRYPTO_EXTERNAL_RNG を実装する（15 章）", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    BOX(440, 160, 380, 70, "rand() / HAL_GetTick() は使わない",
        "予測できる乱数は暗号を無力化する。鍵にしたいなら psa_generate_key() を使う", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "物理的な乱数源から取った種を DRBG で伸ばす。種がなければ初期化そのものが失敗する")

F["s05_hash"] = SVG(860, 260, [
    T(430, 26, "ハッシュ — 任意長から固定長の「指紋」", "middle", 12.5, INK, True),
    BOX(40, 60, 200, 46, "hello", "5 バイト", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    BOX(40, 116, 200, 46, "hellp（1 文字違い）", "5 バイト", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    BOX(40, 172, 200, 46, "1 MB のファームウェア", None, LIN, PAN, INK, 8, 1.4, 11.5, 10),
    ARR(240, 83, 320, 83, MUT, 1.6), ARR(240, 139, 320, 139, MUT, 1.6), ARR(240, 195, 320, 195, MUT, 1.6),
    BOX(320, 60, 130, 158, "SHA-256", "psa_hash_compute", SIG, SSOFT, INK, 8, 1.6, 12, 9.5),
    ARR(450, 83, 500, 83, MUT, 1.6), ARR(450, 139, 500, 139, MUT, 1.6), ARR(450, 195, 500, 195, MUT, 1.6),
    BOX(500, 60, 320, 46, "2cf24dba…9824 (32 バイト)", "同じ入力なら必ず同じ", SIG, SSOFT, INK, 8, 1.4, 11, 10, None, True),
    BOX(500, 116, 320, 46, "6b28c6e8…f1a0 (32 バイト)", "1 ビット違えば全く別", SIG, SSOFT, INK, 8, 1.4, 11, 10, None, True),
    BOX(500, 172, 320, 46, "a5e1…ff3c (32 バイト)", "出力から入力は逆算できない", SIG, SSOFT, INK, 8, 1.4, 11, 10, None, True),
    T(430, 245, "出力長は PSA_HASH_LENGTH(alg)。ハッシュに鍵はなく、誰でも同じ値を計算できる", "middle", 10.5, MUT),
], "どんな長さでも 32 バイトになる。似た入力でも出力は無関係に見える")

F["s05_multipart"] = SVG(860, 300, [
    T(430, 26, "分割ハッシュ — どう分けても結果は同じ", "middle", 12.5, INK, True),
    T(40, 60, "全体を一度に", "start", 10.5, INK, True),
    BYTES(40, 68, [("psa_hash_compute(全体 1024 B)", 400, SIG, SSOFT)], 28, 10)[0],
    T(40, 125, "256 バイトずつ update", "start", 10.5, INK, True),
    BYTES(40, 133, [("update 256", 100, LIN, PAN), ("update 256", 100, LIN, PAN), ("update 256", 100, LIN, PAN), ("update 256", 100, LIN, PAN)], 28, 10)[0],
    T(40, 190, "不揃いに update", "start", 10.5, INK, True),
    BYTES(40, 198, [("10", 40, LIN, PAN), ("500", 200, LIN, PAN), ("1", 30, LIN, PAN), ("513", 130, LIN, PAN)], 28, 10)[0],
    ARR(445, 82, 520, 150, MUT, 1.5), ARR(445, 147, 520, 150, MUT, 1.5), ARR(445, 212, 520, 150, MUT, 1.5),
    BOX(520, 110, 300, 80, "finish → 同じ 32 バイト",
        "内部は 64 バイトのブロック単位で処理し、端数を操作オブジェクトに溜めている", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    T(430, 270, "setup → update（任意回・任意長）→ finish。エラー時は abort。psa_hash_clone で途中状態を分岐できる", "middle", 10.5, MUT),
], "分割の仕方は結果に影響しない。全体をメモリに置けないデータでも同じハッシュが得られる")

# ===================== 06. MAC =====================

F["s06_what"] = SVG(860, 300, [
    T(430, 26, "MAC = 鍵 + メッセージ → 短いタグ", "middle", 12.5, INK, True),
    T(220, 58, "送信側", "middle", 11, INK, True),
    BOX(40, 70, 130, 46, "鍵 K", "共有秘密", SIG, SSOFT), BOX(40, 126, 130, 46, "メッセージ M", None, LIN, PAN),
    ARR(170, 93, 230, 110, MUT, 1.5), ARR(170, 149, 230, 130, MUT, 1.5),
    BOX(230, 96, 140, 48, "HMAC-SHA256", "psa_mac_compute", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    ARR(370, 120, 420, 120, MUT, 1.5),
    BOX(420, 96, 120, 48, "タグ T", "32 バイト", GRN, "none"),
    ARR(300, 144, 300, 200, MUT, 1.5), T(320, 176, "M ∥ T を送る", "start", 10, MUT),
    T(660, 58, "受信側", "middle", 11, INK, True),
    BOX(590, 70, 130, 46, "同じ鍵 K", None, SIG, SSOFT), BOX(590, 126, 130, 46, "届いた M", None, LIN, PAN),
    BOX(600, 200, 220, 48, "psa_mac_verify(K, M, T)", "一定時間で比較", SIG, SSOFT, INK, 8, 1.5, 11, 9.5, None, True),
    ARR(655, 172, 655, 200, MUT, 1.5),
    T(710, 275, "一致 → 鍵を知る相手からの、改ざんのない M", "middle", 10, SIG, True),
    BOX(40, 200, 330, 48, "攻撃者", "K を知らないので正しい T を作れない。M を書き換えると T が合わない", ALI, ASOFT, INK, 8, 1.4, 11, 9.5),
], "鍵を知る者だけが正しいタグを作れる。ハッシュ単体では防げない改ざんを検出できる")

F["s06_flow"] = SVG(860, 240, [
    T(430, 26, "一発関数の対 — compute と verify", "middle", 12.5, INK, True),
    flowright(40, 90, [("psa_mac_compute", "key, alg, input → mac, mac_size, &mac_length", SIG, SSOFT),
                       ("送信 / 保存", "input ∥ mac"),
                       ("psa_mac_verify", "key, alg, input, mac, mac_length → SUCCESS / INVALID_SIGNATURE", SIG, SSOFT)], 250, 64, 15, sz=11.5)[0],
    BOX(40, 150, 780, 60, "verify を compute + memcmp で代用しない",
        "memcmp は最初に違うバイトで止まるので、一致した長さが処理時間に現れる（タイミング攻撃）。psa_mac_verify は一定時間で比べる", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "検証は必ず検証専用関数で行う")

F["s06_state"] = SVG(860, 260, [
    T(430, 26, "MAC の分割関数 — setup と finish が 2 種類ずつ", "middle", 12.5, INK, True),
    T(220, 60, "計算する側", "middle", 11, SIG, True),
    flowdown(220, 70, [("psa_mac_sign_setup(op, key, alg)", "SIGN_MESSAGE 用途を確認", SIG, SSOFT),
                       ("psa_mac_update(op, data, len) × n", None),
                       ("psa_mac_sign_finish(op, mac, size, &len)", "タグを返す", SIG, SSOFT)], 340, 40, 18)[0],
    T(640, 60, "検証する側", "middle", 11, GRN, True),
    flowdown(640, 70, [("psa_mac_verify_setup(op, key, alg)", "VERIFY_MESSAGE 用途を確認", GRN, "none"),
                       ("psa_mac_update(op, data, len) × n", None),
                       ("psa_mac_verify_finish(op, mac, len)", "一致なら SUCCESS", GRN, "none")], 340, 40, 18)[0],
    T(430, 245, "sign_setup に verify_finish を組み合わせると BAD_STATE", "middle", 10.5, ALI),
], "ハッシュとの違いは、setup と finish の組み合わせを揃えることだけ")

F["s06_trunc"] = SVG(860, 250, [
    T(430, 26, "タグの切り詰め — PSA_ALG_TRUNCATED_MAC(alg, n)", "middle", 12.5, INK, True),
    T(40, 62, "完全長（HMAC-SHA256）", "start", 10.5, INK, True),
    BYTES(40, 70, [("32 バイト", 512, SIG, SSOFT)], 26, 10)[0],
    T(40, 122, "TRUNCATED_MAC(…, 16)", "start", 10.5, INK, True),
    BYTES(40, 130, [("先頭 16 バイト", 256, SIG, SSOFT), ("捨てる", 256, LIN, "none")], 26, 10)[0],
    T(40, 182, "TRUNCATED_MAC(…, 8)", "start", 10.5, INK, True),
    BYTES(40, 190, [("8", 128, SIG, SSOFT), ("捨てる", 384, LIN, "none")], 26, 10)[0],
    BOX(590, 70, 230, 146, "当てずっぽうで通る確率",
        "n バイトなら 1 回あたり 2^(−8n)。8 バイト: 2^64 分の 1。4 バイト: 43 億分の 1（オンラインでも現実的）。4 バイト未満は避ける", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "無線フレームなど 1 バイトが惜しい場面では短くできるが、下限がある")

# ===================== 07. 対称暗号 =====================

F["s07_modes"] = SVG(860, 330, [
    T(430, 26, "ブロック暗号の「モード」— 16 バイトのブロックをどうつなぐか", "middle", 12.5, INK, True),
    T(180, 60, "ECB（使わない）", "middle", 11, ALI, True),
    BYTES(40, 70, [("P1", 60, LIN, PAN), ("P2", 60, LIN, PAN), ("P1", 60, LIN, PAN)], 26, 10)[0],
    ARR(130, 96, 130, 120, MUT, 1.4), T(150, 112, "AES(K)", "start", 9.5, MUT),
    BYTES(40, 124, [("C1", 60, ALI, ASOFT), ("C2", 60, ALI, ASOFT), ("C1", 60, ALI, ASOFT)], 26, 10)[0],
    T(130, 172, "同じ平文 → 同じ暗号文。模様が見える", "middle", 9.5, ALI),
    T(480, 60, "CBC（互換のみ）", "middle", 11, MUT, True),
    BYTES(340, 70, [("IV", 50, GRN, "none"), ("P1", 60, LIN, PAN), ("P2", 60, LIN, PAN)], 26, 10)[0],
    T(420, 112, "IV⊕P1 → AES → C1、C1⊕P2 → AES → C2", "middle", 9.5, MUT),
    BYTES(340, 124, [("IV", 50, GRN, "none"), ("C1", 60, SIG, SSOFT), ("C2", 60, SIG, SSOFT)], 26, 10)[0],
    T(430, 172, "前の暗号文が次に混ざる。詰め物が要る", "middle", 9.5, MUT),
    T(710, 60, "CTR（標準）", "middle", 11, SIG, True),
    BYTES(600, 70, [("IV∥0", 55, GRN, "none"), ("IV∥1", 55, GRN, "none"), ("IV∥2", 55, GRN, "none")], 26, 10)[0],
    T(682, 112, "AES(K, カウンタ) ⊕ P → C", "middle", 9.5, MUT),
    BYTES(600, 124, [("C1", 55, SIG, SSOFT), ("C2", 55, SIG, SSOFT), ("C3", 55, SIG, SSOFT)], 26, 10)[0],
    T(700, 172, "任意長。並列可。詰め物なし", "middle", 9.5, SIG),
    BOX(40, 200, 780, 60, "どのモードも「認証」はしない",
        "暗号文を書き換えても復号は失敗せず、ゴミか、狙った位置のビット反転が出る。データの暗号化には AEAD（8 章）を使う", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    T(430, 300, "psa_cipher_* は、プロトコルが CTR / CBC 単体を要求する場合の互換用と考える", "middle", 10.5, MUT),
], "ECB は模様が残り、CBC は詰め物と連鎖の問題を持つ。新規設計で選ぶのは CTR だけ")

F["s07_iv"] = SVG(860, 250, [
    T(430, 26, "一発関数の出力は「IV ∥ 暗号文」", "middle", 12.5, INK, True),
    T(40, 62, "psa_cipher_encrypt(key, CTR, plain[50]) の出力（66 バイト）", "start", 10.5, INK, True),
    BYTES(40, 72, [("IV（16 バイト、ライブラリが乱数で生成）", 250, GRN, "none", "ct[0..15]"),
                   ("暗号文（50 バイト）", 400, SIG, SSOFT, "ct[16..65]")], 30, 10, 9.5)[0],
    T(40, 140, "psa_cipher_decrypt(key, CTR, ct[66]) は先頭 16 バイトを IV として読み、残りを復号 → 50 バイト", "start", 10.5, INK),
    BOX(40, 165, 780, 60, "IV は秘密ではないが、同じ鍵で二度使ってはいけない",
        "CTR で IV が繰り返されると 2 つの平文の XOR が漏れる。乱数 IV をライブラリに任せるのが最も安全", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "出力サイズは PSA_CIPHER_ENCRYPT_OUTPUT_SIZE で計算する。IV の 16 バイトを忘れると BUFFER_TOO_SMALL")

F["s07_state"] = SVG(860, 280, [
    T(430, 26, "分割関数の順序 — IV は update の前に 1 回", "middle", 12.5, INK, True),
    flowright(40, 90, [("encrypt_setup / decrypt_setup", "鍵とモードを決める", SIG, SSOFT),
                       ("generate_iv（暗号化） / set_iv（復号）", "update の前に 1 回だけ", GRN, "none"),
                       ("update × n", "CBC は 16 バイト溜まるまで出力しない"),
                       ("finish", "CBC の詰め物の最終ブロック", SIG, SSOFT)], 182, 64, 17, sz=10.5)[0],
    BOX(40, 150, 380, 70, "update の出力長 ≠ 入力長のことがある",
        "CBC: 10 バイト入れて 0 バイト出て、次に 10 バイトで 16 出る。CTR: 常に同じ長さ", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    BOX(440, 150, 380, 70, "set_iv を暗号化側に使うなら",
        "IV が二度使われないことを自分で保証する。再起動でカウンタが戻る設計は典型的な失敗", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    T(430, 255, "バッファは PSA_CIPHER_UPDATE_OUTPUT_SIZE / PSA_CIPHER_FINISH_OUTPUT_SIZE で見積もる", "middle", 10.5, MUT),
], "分割版では IV が出力に含まれず、別に扱う")

F["s07_bitflip"] = SVG(860, 250, [
    T(430, 26, "CTR のビット反転 — 復号は失敗しない", "middle", 12.5, INK, True),
    T(40, 60, "平文 P", "start", 10.5, INK, True),
    BYTES(40, 68, [("金額 = 100", 200, LIN, PAN)], 28, 10.5)[0],
    T(40, 122, "暗号文 C の 1 ビットを攻撃者が反転", "start", 10.5, INK, True),
    BYTES(40, 130, [("C ⊕ 00…04…00", 200, ALI, ASOFT)], 28, 10.5)[0],
    T(40, 184, "復号結果", "start", 10.5, INK, True),
    BYTES(40, 192, [("金額 = 104", 200, ALI, ASOFT)], 28, 10.5)[0],
    ARR(250, 82, 320, 144, MUT, 1.4), ARR(250, 206, 320, 144, MUT, 1.4),
    BOX(330, 100, 490, 90, "暗号文の同じ位置の平文ビットが反転する",
        "攻撃者は平文の中身を知らなくても「桁の位置」を狙って書き換えられる。psa_cipher_decrypt は PSA_SUCCESS を返し、アプリはゴミを正しい値だと思って使う", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "機密性は守っても完全性は守らない。だから AEAD が要る")

# ===================== 08. AEAD =====================

F["s08_inputs"] = SVG(860, 300, [
    T(430, 26, "AEAD の 4 つの入力と 2 つの出力", "middle", 12.5, INK, True),
    BOX(40, 60, 150, 46, "鍵", "秘密。出力に含まれない", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    BOX(40, 116, 150, 46, "ノンス", "一度きり。公開でよい", GRN, "none", INK, 8, 1.4, 11.5, 9.5),
    BOX(40, 172, 150, 46, "追加データ AD", "暗号化しない。改ざん検出する", LIN, PAN, INK, 8, 1.4, 11.5, 9.5),
    BOX(40, 228, 150, 46, "平文", "秘密", LIN, PAN, INK, 8, 1.4, 11.5, 9.5),
    ARR(190, 83, 300, 140, MUT, 1.4), ARR(190, 139, 300, 148, MUT, 1.4), ARR(190, 195, 300, 156, MUT, 1.4), ARR(190, 251, 300, 164, MUT, 1.4),
    BOX(300, 120, 170, 64, "AES-GCM", "psa_aead_encrypt", SIG, SSOFT, INK, 8, 1.6, 12.5, 10),
    ARR(470, 140, 540, 120, MUT, 1.4), ARR(470, 164, 540, 190, MUT, 1.4),
    BOX(540, 96, 280, 48, "暗号文（平文と同じ長さ）", None, SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    BOX(540, 166, 280, 48, "タグ（16 バイト）", "AD と暗号文の両方に対する認証値", GRN, "none", INK, 8, 1.4, 11.5, 9.5),
    T(680, 240, "PSA の出力は「暗号文 ∥ タグ」の 1 本", "middle", 10, MUT),
    T(430, 285, "復号側は 4 つの入力とタグをすべて揃える。1 ビット違えば INVALID_SIGNATURE で平文は出ない", "middle", 10.5, MUT),
], "追加データは「暗号化しないが書き換えられると困る」ヘッダ類。宛先やバージョンをここに入れる")

F["s08_frame"] = SVG(860, 240, [
    T(430, 26, "送るフレームの形", "middle", 12.5, INK, True),
    BYTES(40, 60, [("header（AD）", 160, LIN, PAN, "平文。宛先・種別・番号"),
                   ("nonce 12", 120, GRN, "none", "乱数またはカウンタ"),
                   ("ciphertext", 340, SIG, SSOFT, "平文と同じ長さ"),
                   ("tag 16", 160, GRN, "none", "psa_aead_encrypt の出力末尾")], 34, 10.5, 9.5)[0],
    T(40, 135, "psa_aead_decrypt(key, GCM, nonce, 12, header, hlen, ciphertext∥tag, clen+16, plain, size, &plen)", "start", 10, INK, False, True),
    BOX(40, 160, 780, 56, "カウンタノンスなら nonce フィールドは省略できる",
        "header のシーケンス番号から受信側がノンスを復元する。その場合も AD に header を含める", LIN, PAN, INK, 8, 1.4, 11.5, 10),
], "暗号文 ∥ タグは psa_aead_encrypt の出力そのもの。復号にはヘッダとノンスも必要")

F["s08_nonce"] = SVG(860, 290, [
    T(430, 26, "ノンスの 2 つの決め方", "middle", 12.5, INK, True),
    T(220, 60, "乱数", "middle", 11.5, INK, True),
    BYTES(40, 70, [("psa_generate_random 12 バイト", 360, GRN, "none")], 28, 10)[0],
    T(220, 122, "状態不要。暗号文と一緒に送る。2^32 回程度で衝突の心配（鍵の寿命を制限）", "middle", 9.5, MUT),
    T(640, 60, "カウンタ", "middle", 11.5, INK, True),
    BYTES(460, 70, [("装置 ID 4", 110, LIN, PAN), ("起動世代 2", 90, GRN, "none"), ("通し番号 6", 160, SIG, SSOFT)], 28, 10)[0],
    T(640, 122, "衝突しない。ただし再起動で戻ると致命的", "middle", 9.5, MUT),
    BOX(40, 150, 780, 60, "再起動対策（カウンタ方式）",
        "(a) 起動ごとに乱数の世代番号を入れる  (b) 1000 回ごとに ITS に保存し、起動時は「保存値 + 1000」から再開する", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(40, 220, 780, 52, "GCM でノンスが繰り返されると認証鍵が漏れ、以後すべてのメッセージが偽造できる",
        "CTR の IV 繰り返しよりさらに悪い", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "乱数は簡単だが鍵の寿命に上限、カウンタは再起動対策が必須")

F["s08_state"] = SVG(860, 300, [
    T(430, 26, "AEAD の分割関数の順序", "middle", 12.5, INK, True),
    flowright(40, 80, [("encrypt_setup / decrypt_setup", None, SIG, SSOFT),
                       ("set_lengths(ad, pt)", "CCM は必須", GRN, "none"),
                       ("generate_nonce / set_nonce", None, GRN, "none"),
                       ("update_ad × n", "AD を先に全部")], 182, 52, 17, sz=10.5)[0],
    flowright(40, 160, [("update × n", "平文 → 暗号文（または逆）"),
                        ("finish", "残りの暗号文 + タグ", SIG, SSOFT),
                        ("verify", "残りの平文、タグを照合", SIG, SSOFT),
                        ("abort", "エラー時は必ず")], 182, 52, 17, sz=10.5)[0],
    W(729, 106, 729, 134, c=MUT, lw=1.4), W(729, 134, 131, 134, c=MUT, lw=1.4), ARR(131, 134, 131, 134, MUT, 1.4, 6),
    BOX(40, 220, 780, 60, "復号の分割版: verify が成功するまで update の出力を信用しない",
        "タグの照合前に平文が返る。フラッシュに書きながら復号するなら、verify 失敗時に書いた領域を無効化する", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "AD を先に全部、次に本文、最後に finish（暗号化）または verify（復号）")

# ===================== 09. 署名と検証 =====================

F["s09_vs_mac"] = SVG(860, 280, [
    T(430, 26, "MAC と署名 — 検証者が偽造できるか", "middle", 12.5, INK, True),
    T(220, 60, "MAC（対称）", "middle", 11.5, INK, True),
    BOX(40, 72, 160, 50, "送信者: 鍵 K", "タグを作る", SIG, SSOFT), BOX(280, 72, 160, 50, "受信者: 同じ鍵 K", "タグを検証する", SIG, SSOFT),
    DARR(200, 97, 280, 97, MUT, 1.4),
    T(220, 150, "受信者も正しいタグを作れる → 「送信者が作った」とは第三者に証明できない", "middle", 9.5, ALI),
    T(640, 60, "署名（非対称）", "middle", 11.5, INK, True),
    BOX(460, 72, 160, 50, "署名者: 秘密鍵 d", "署名を作る", SIG, SSOFT), BOX(700, 72, 120, 50, "検証者: 公開鍵 Q", "検証だけ", GRN, "none"),
    ARR(620, 97, 700, 97, MUT, 1.4),
    T(640, 150, "検証者は秘密鍵を持たないので偽造できない → 認証と否認防止", "middle", 9.5, SIG),
    stack(40, 175, 780, [("速度: MAC は µs、署名は ms〜数十 ms。出力: MAC 16〜32 B、署名 64〜256 B", "通信フレームは MAC、ファームウェア検証と装置認証は署名", LIN, PAN)], 60, 0)[0],
], "検証者が生成もできる MAC に対し、署名は公開鍵しか持たない者にも検証できる")

F["s09_two_apis"] = SVG(860, 280, [
    T(430, 26, "hash 版と message 版", "middle", 12.5, INK, True),
    T(220, 60, "psa_sign_hash / psa_verify_hash", "middle", 11, SIG, True),
    flowdown(220, 72, [("アプリが psa_hash_* でハッシュを計算", "大きなデータを分割で。TLS のように「ハッシュだけ」がある場合", LIN, PAN),
                       ("psa_sign_hash(key, ECDSA(SHA_256), hash, 32, …)", "ハッシュ長はアルゴリズムのハッシュと一致", SIG, SSOFT)], 360, 54, 26)[0],
    T(640, 60, "psa_sign_message / psa_verify_message", "middle", 11, GRN, True),
    flowdown(640, 72, [("元データをそのまま渡す", "小さなデータ。チャレンジ応答など", LIN, PAN),
                       ("内部でハッシュしてから署名", "Ed25519（PURE_EDDSA）はこちらのみ", GRN, "none")], 360, 54, 26)[0],
    T(430, 255, "用途: SIGN_HASH は SIGN_MESSAGE を含む。逆は含まない", "middle", 10.5, MUT),
], "ハッシュを自分で取るか、ライブラリに任せるか。Ed25519 はメッセージ全体が必要なので message 版だけ")

F["s09_challenge"] = SVG(860, 300, [
    T(430, 26, "チャレンジ応答による装置の認証", "middle", 12.5, INK, True),
    LANES(["サーバ", "装置"], 220, 50, 420, 90, 260)[0],
    MSG([220, 640], 0, 1, 110, "チャレンジ（32 バイトの乱数）"),
    SELF([220, 640], 1, 150, "psa_sign_message(DEVICE_KEY, ECDSA(SHA_256), challenge)", SIG, 9, 340),
    MSG([220, 640], 1, 0, 190, "署名（64 バイト）", SIG),
    SELF([220, 640], 0, 230, "登録済み公開鍵で psa_verify_hash → SUCCESS なら本物", GRN, 9, 330),
    T(430, 285, "チャレンジが乱数なので、過去の署名を再利用できない（再送攻撃の防止）", "middle", 10.5, MUT),
], "サーバの乱数に装置が署名し、登録済みの公開鍵で検証する。秘密鍵は装置から出ない")

F["s09_sigformat"] = SVG(860, 260, [
    T(430, 26, "ECDSA 署名の形式 — PSA は r ∥ s の生連結", "middle", 12.5, INK, True),
    T(40, 62, "PSA（64 バイト固定）", "start", 10.5, INK, True),
    BYTES(40, 72, [("r（32、0 詰め）", 240, SIG, SSOFT), ("s（32、0 詰め）", 240, SIG, SSOFT)], 30, 10)[0],
    T(40, 135, "DER（OpenSSL、X.509、70〜72 バイト可変）", "start", 10.5, INK, True),
    BYTES(40, 145, [("30 len", 55, LIN, PAN), ("02 len", 55, LIN, PAN), ("(00) r", 180, GRN, "none"), ("02 len", 55, LIN, PAN), ("(00) s", 180, GRN, "none")], 30, 10)[0],
    BOX(600, 62, 220, 113, "相互変換",
        "r や s の先頭が 0x80 以上なら DER は 0x00 を前置する。mbedtls_ecdsa_der_to_raw / raw_to_der（3.6〜）", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    T(430, 235, "DER をそのまま psa_verify_hash に渡すと INVALID_SIGNATURE または INVALID_ARGUMENT", "middle", 10.5, ALI),
], "他のライブラリと署名をやり取りするときは、まず形式を疑う")

# ===================== 10. 鍵導出 =====================

F["s10_why"] = SVG(860, 260, [
    T(430, 26, "1 つの秘密から、用途ごとに独立な鍵を作る", "middle", 12.5, INK, True),
    BOX(40, 90, 180, 70, "マスター秘密", "共有秘密、工場の秘密", SIG, SSOFT, INK, 8, 1.6, 12, 10),
    ARR(220, 125, 330, 125, MUT, 1.6),
    BOX(330, 90, 160, 70, "HKDF", "salt, info を変えて", SIG, SSOFT, INK, 8, 1.6, 12.5, 10),
    ARR(490, 110, 580, 70, MUT, 1.4), ARR(490, 125, 580, 125, MUT, 1.4), ARR(490, 140, 580, 180, MUT, 1.4),
    BOX(580, 50, 240, 40, "送信用 AES 鍵", "info = \"tx\"", GRN, "none", INK, 8, 1.3, 11, 9.5),
    BOX(580, 105, 240, 40, "受信用 AES 鍵", "info = \"rx\"", GRN, "none", INK, 8, 1.3, 11, 9.5),
    BOX(580, 160, 240, 40, "MAC 鍵", "info = \"mac\"", GRN, "none", INK, 8, 1.3, 11, 9.5),
    T(430, 235, "どれか 1 つが漏れても他は分からない。もう 1 つの役割は「素材を一様な鍵の形に整える」こと", "middle", 10.5, MUT),
], "鍵導出関数は、秘密を増やさずに「1 鍵 1 用途」の原則を満たす道具")

F["s10_hkdf"] = SVG(860, 300, [
    T(430, 26, "HKDF の 2 段階 — extract と expand", "middle", 12.5, INK, True),
    BOX(40, 60, 150, 46, "IKM（SECRET）", "元の秘密", SIG, SSOFT, INK, 8, 1.4, 11, 9.5),
    BOX(40, 116, 150, 46, "salt（SALT）", "公開の乱数。省略可", GRN, "none", INK, 8, 1.4, 11, 9.5),
    ARR(190, 83, 270, 100, MUT, 1.4), ARR(190, 139, 270, 122, MUT, 1.4),
    BOX(270, 86, 150, 50, "extract", "PRK = HMAC(salt, IKM)", LIN, PAN, INK, 8, 1.4, 11.5, 9.5),
    ARR(420, 111, 490, 111, MUT, 1.4),
    T(455, 100, "PRK", "middle", 9.5, MUT),
    BOX(490, 86, 150, 50, "expand", "HMAC(PRK, info ∥ i)", LIN, PAN, INK, 8, 1.4, 11.5, 9.5),
    BOX(490, 150, 150, 46, "info（INFO）", "用途のラベル", GRN, "none", INK, 8, 1.4, 11, 9.5),
    ARR(565, 150, 565, 136, MUT, 1.4),
    ARR(640, 111, 700, 111, MUT, 1.4),
    BOX(700, 76, 120, 70, "OKM", "必要な長さの鍵素材", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    BOX(40, 210, 780, 66, "PSA の入力順: SALT → SECRET → INFO",
        "salt は secret より前、info は secret より後。順序を違えると BAD_STATE。info に「方向・用途・バージョン」を必ず書く", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
], "extract で偏りをならし、expand で用途ラベルを混ぜて必要な長さに伸ばす")

F["s10_flow"] = SVG(860, 300, [
    T(430, 26, "鍵導出の操作オブジェクト — input で入れて output で取り出す", "middle", 12.5, INK, True),
    flowright(40, 80, [("setup(op, HKDF(SHA_256))", None, SIG, SSOFT),
                       ("input_bytes(SALT, …)", "公開の乱数"),
                       ("input_key(SECRET, master)", "鍵 ID で。値を出さない", GRN, "none"),
                       ("input_bytes(INFO, \"tx\")", "用途ラベル")], 182, 52, 17, sz=10.5)[0],
    flowright(40, 160, [("output_key(attr, op, &key)", "鍵として。原則こちら", SIG, SSOFT),
                        ("output_bytes(op, buf, n)", "バイト列。PSA の外に渡すときだけ"),
                        ("（続けて output 可）", "同じ操作から続きが出る"),
                        ("abort", None)], 182, 52, 17, sz=10.5)[0],
    W(729, 106, 729, 134, c=MUT, lw=1.4), W(729, 134, 131, 134, c=MUT, lw=1.4), ARR(131, 134, 131, 134, MUT, 1.4, 6),
    BOX(40, 220, 780, 56, "容量（capacity）",
        "1 つの操作から取り出せる合計に上限（HKDF-SHA256 で 8160 バイト）。set_capacity で狭めれば安全装置になる。超えると INSUFFICIENT_DATA", LIN, PAN, INK, 8, 1.4, 11.5, 10),
], "他の分割操作と違い、update/finish ではなく input/output。output は何回でも呼べる")

F["s10_pbkdf2"] = SVG(860, 260, [
    T(430, 26, "PBKDF2 — パスワードには「遅い」KDF を使う", "middle", 12.5, INK, True),
    BOX(40, 60, 170, 50, "パスワード", "エントロピーが低い", ALI, ASOFT, INK, 8, 1.4, 11.5, 9.5),
    BOX(40, 120, 170, 50, "salt（装置ごとの乱数）", "保存しておく", GRN, "none", INK, 8, 1.4, 11, 9.5),
    ARR(210, 85, 290, 100, MUT, 1.4), ARR(210, 145, 290, 120, MUT, 1.4),
    BOX(290, 80, 200, 60, "HMAC を COST 回反復", "10 万回 → 1 回の試行が 0.5 秒", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    ARR(490, 110, 560, 110, MUT, 1.4),
    BOX(560, 85, 260, 50, "鍵（または保存用の検証値）", "verify_bytes で一定時間比較", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    BOX(40, 190, 780, 50, "入力順: COST → SALT → PASSWORD。HKDF にパスワードを入れてはいけない（辞書攻撃に 1 秒で数百万回）",
        None, LIN, PAN, INK, 8, 1.4, 11, 10),
], "反復回数で総当たりを遅くし、ソルトで事前計算表を無効化する")

# ===================== 11. 鍵合意 =====================

F["s11_ecdh"] = SVG(860, 300, [
    T(430, 26, "ECDH — 公開鍵を交換し、同じ点を計算する", "middle", 12.5, INK, True),
    LANES(["自分", "相手"], 220, 50, 420, 90, 270)[0],
    SELF([220, 640], 0, 105, "鍵ペア (a, A = a·G) を生成", SIG, 9.5, 200),
    SELF([220, 640], 1, 105, "鍵ペア (b, B = b·G) を生成", SIG, 9.5, 200),
    MSG([220, 640], 0, 1, 145, "A を送る（盗聴されてよい）"),
    MSG([220, 640], 1, 0, 180, "B を送る", MUT, 9.5, None, False),
    SELF([220, 640], 0, 225, "a·B = a·b·G", GRN, 10, 160),
    SELF([220, 640], 1, 225, "b·A = b·a·G", GRN, 10, 160),
    T(430, 232, "＝ 同じ点", "middle", 10.5, GRN, True),
    T(430, 285, "盗聴者は A と B を知るが a も b も知らないので a·b·G を出せない（離散対数問題）", "middle", 10, MUT),
], "秘密鍵どうしを掛けた点が一致する。x 座標が共有秘密になる")

F["s11_flow"] = SVG(860, 280, [
    T(430, 26, "ECDH の結果を KDF に直接注入する", "middle", 12.5, INK, True),
    flowright(40, 80, [("setup(op, KEY_AGREEMENT(ECDH, HKDF))", None, SIG, SSOFT),
                       ("input_bytes(SALT, 両者の乱数)", None),
                       ("key_agreement(op, SECRET, my_priv, peer_pub, 65)", "ECDH がここで走る。共有秘密は外に出ない", GRN, "none")], 250, 60, 15, sz=9.5)[0],
    flowright(40, 160, [("input_bytes(INFO, \"app-session-v1\")", None),
                        ("output_key(attr, op, &session)", "AES-256-GCM 鍵として", SIG, SSOFT),
                        ("abort", None)], 250, 60, 15, sz=10.5)[0],
    BOX(40, 210, 780, 56, "鍵の属性の algorithm は setup のアルゴリズムと完全一致",
        "鍵に PSA_ALG_ECDH だけを設定して KEY_AGREEMENT(ECDH, HKDF) の操作に使うと NOT_PERMITTED", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
], "psa_raw_key_agreement は共有秘密をバイト列で返すが、通常はこちらの経路を使う")

F["s11_auth"] = SVG(860, 330, [
    T(430, 26, "認証付き鍵交換 — 一時鍵 + 長期署名鍵", "middle", 12.5, INK, True),
    LANES(["装置", "サーバ"], 220, 50, 420, 90, 300)[0],
    SELF([220, 640], 0, 105, "一時 ECDH 鍵ペア生成（揮発）", SIG, 9.5, 230),
    MSG([220, 640], 0, 1, 145, "一時公開鍵 ∥ 乱数 ∥ 長期鍵による署名"),
    SELF([220, 640], 1, 180, "登録済み公開鍵で署名を検証 → 本物の装置", GRN, 9.5, 260),
    MSG([220, 640], 1, 0, 215, "サーバの一時公開鍵 ∥ 署名", MUT, 9.5, None, False),
    SELF([220, 640], 0, 255, "検証 → ECDH → HKDF → セッション鍵", SIG, 9.5, 260),
    SELF([220, 640], 1, 255, "同じ計算 → 同じセッション鍵", SIG, 9.5, 230),
    T(430, 295, "一時鍵は使い終わったら destroy（前方秘匿性）。署名鍵は長期・永続", "middle", 10, MUT),
], "ECDH だけでは中間者を防げない。一時公開鍵に長期鍵で署名して相手を認証する（TLS の骨格）")

# ===================== 12. 永続鍵とライフタイム =====================

F["s12_two"] = SVG(860, 260, [
    T(430, 26, "揮発鍵と永続鍵", "middle", 12.5, INK, True),
    BOX(40, 60, 380, 130, "揮発（VOLATILE = 0、既定）",
        "RAM のみ。ID は実装が割り当てる。destroy・電源断・mbedtls_psa_crypto_free で消える。セッション鍵、一時 ECDH 鍵、毎回 import する公開鍵", LIN, PAN, INK, 8, 1.4, 12, 10),
    BOX(440, 60, 380, 130, "永続（PERSISTENT = 1）",
        "ITS に保存。ID は自分で決める（1〜0x3FFFFFFF）。destroy するまで残る。作るのは 1 回だけ。装置の署名鍵、長期の共有鍵、工場書き込みの秘密", SIG, SSOFT, INK, 8, 1.4, 12, 10),
    T(430, 225, "「次の起動でも同じ鍵が要る」ときだけ永続にする", "middle", 11, MUT),
], "既定は揮発。永続鍵はストレージを使い、消し忘れると残り続ける")

F["s12_lifetime_bits"] = SVG(860, 280, [
    T(430, 26, "lifetime = (location << 8) | persistence", "middle", 12.5, INK, True),
    BYTES(40, 60, [("location 24 ビット", 520, GRN, "none"), ("persistence 8", 260, SIG, SSOFT)], 32, 11)[0],
    CODE(40, 125, [("PSA_KEY_LIFETIME_VOLATILE                         = 0x00000000", INK),
                   ("PSA_KEY_LIFETIME_PERSISTENT                       = 0x00000001", INK),
                   ("FROM_PERSISTENCE_AND_LOCATION(DEFAULT, PRIMARY_SECURE_ELEMENT) = 0x00000101", INK),
                   ("FROM_PERSISTENCE_AND_LOCATION(READ_ONLY, LOCAL_STORAGE)        = 0x000000ff", MUT)], 10.5, INK, 17),
    BOX(40, 205, 780, 56, "場所が 0 以外の鍵は「ドライバ」が処理する",
        "psa_sign_hash(key, …) を呼ぶと、実装が鍵の場所を見てセキュアエレメントに署名を依頼する。アプリのコードは変わらない", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
], "上位が「どこに置くか」、下位が「残るか」。場所を変えるだけでセキュアエレメントに移る")

F["s12_idmap"] = SVG(860, 250, [
    T(430, 26, "psa_key_id_t の範囲", "middle", 12.5, INK, True),
    BYTES(40, 60, [("0", 30, ALI, ASOFT, "NULL"),
                   ("0x00000001 〜 0x3FFFFFFF: アプリケーション（永続鍵）", 400, SIG, SSOFT, "PSA_KEY_ID_USER_MIN 〜 USER_MAX"),
                   ("0x40000000 〜 0x7FFFFFFF: 実装", 220, LIN, PAN, "揮発鍵の自動 ID、組み込み鍵"),
                   ("0x80000000 〜", 130, LIN, "none", "予約")], 34, 9.5, 8.5)[0],
    CODE(40, 140, [("#define KEY_ID_DEVICE_SIGN    ((psa_key_id_t)0x00010001)   /* 区分 0x0001: 装置固有 */", INK),
                   ("#define KEY_ID_OTA_VERIFY_PUB ((psa_key_id_t)0x00020001)   /* 区分 0x0002: 検証用公開鍵 */", INK),
                   ("#define KEY_ID_CONFIG_AEAD    ((psa_key_id_t)0x00030001)   /* 区分 0x0003: データ保護 */", INK)], 10.5, INK, 17),
    T(430, 225, "上位 16 ビットを区分、下位を通し番号にして、プロジェクトの 1 つのヘッダで管理する", "middle", 10.5, MUT),
], "永続鍵の ID はアプリケーション範囲から選び、台帳で一元管理する")

F["s12_storage"] = SVG(860, 320, [
    T(430, 26, "永続鍵はどこにあるか — 環境で安全性が変わる", "middle", 12.5, INK, True),
    BOX(40, 60, 250, 110, "Mbed TLS（PC）",
        "MBEDTLS_PSA_ITS_FILE_C: カレントディレクトリのファイル。平文。保護は OS のファイル権限のみ", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    BOX(305, 60, 250, 110, "Mbed TLS 単体（マイコン）",
        "自前の ITS で内蔵フラッシュに。平文。フラッシュ読み出し保護（RDP 等）がなければ丸見え", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    BOX(570, 60, 250, 110, "TF-M",
        "ITS パーティションのフラッシュ領域。非セキュア側から読めない。平文だが「内部にあるから信頼」", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(40, 190, 380, 70, "セキュアエレメント（場所 ≠ 0）",
        "ITS にはスロット番号だけ。鍵の値はチップから出ない", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(440, 190, 380, 70, "結論",
        "「PSA を使ったから安全」ではなく「PSA + TF-M + 読み出し保護、またはセキュアエレメント」で鍵が守られる", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    T(430, 295, "永続鍵の安全性 = ITS がどこにあるか", "middle", 11, MUT, True),
], "同じ psa_generate_key でも、鍵の置かれる場所は環境で全く違う")

# ===================== 13. セキュアストレージ =====================

F["s13_its_ps"] = SVG(860, 340, [
    T(430, 26, "ITS と PS", "middle", 12.5, INK, True),
    RECT(40, 56, 380, 250, 10, PAN, SIG, 1.6),
    T(230, 78, "ITS — Internal Trusted Storage", "middle", 11.5, SIG, True),
    stack(60, 90, 340, [("チップ内部のフラッシュ（セキュア側）", "小さい・速い", LIN, SCR),
                        ("平文で書く", "「内部にあるから信頼」。読み出し保護が根拠", LIN, SCR),
                        ("PSA Crypto の永続鍵の保存先", "アテステーションのカウンタ、ブート状態", SIG, SSOFT),
                        ("psa_its_set / get / get_info / remove", None, LIN, SCR)], 44, 6)[0],
    RECT(440, 56, 380, 250, 10, PAN, GRN, 1.6),
    T(630, 78, "PS — Protected Storage", "middle", 11.5, GRN, True),
    stack(460, 90, 340, [("外部フラッシュでもよい", "大きい・遅い", LIN, SCR),
                         ("AEAD で暗号化＋改ざん検出＋リプレイ防止", "鍵は HUK から導出、表は ITS に", LIN, SCR),
                         ("アプリケーションの設定・資格情報・証明書", None, GRN, "none"),
                         ("psa_ps_set / get / get_info / remove (+create, set_extended)", None, LIN, SCR)], 44, 6)[0],
    T(430, 325, "どちらも UID（64 ビット整数）で引く鍵値ストア。ファイルシステムではない", "middle", 10.5, MUT),
], "ITS は「場所」で守り、PS は「暗号」で守る")

F["s13_flow"] = SVG(860, 250, [
    T(430, 26, "ITS の 4 関数", "middle", 12.5, INK, True),
    BOX(40, 60, 180, 70, "psa_its_set(uid, len, data, flags)", "あれば上書き、なければ作る。全体を渡す", SIG, SSOFT, INK, 8, 1.4, 10.5, 9.5),
    BOX(240, 60, 180, 70, "psa_its_get(uid, offset, size, buf, &len)", "offset からの部分読み出し可", SIG, SSOFT, INK, 8, 1.4, 10.5, 9.5),
    BOX(440, 60, 180, 70, "psa_its_get_info(uid, &info)", "capacity / size / flags。存在確認に", LIN, PAN, INK, 8, 1.4, 10.5, 9.5),
    BOX(640, 60, 180, 70, "psa_its_remove(uid)", "WRITE_ONCE は消せない", LIN, PAN, INK, 8, 1.4, 10.5, 9.5),
    BOX(40, 150, 380, 70, "フラグは最初に作るときだけ有効",
        "WRITE_ONCE = 1（二度と変えられない）、NO_CONFIDENTIALITY = 2、NO_REPLAY_PROTECTION = 4", LIN, PAN, INK, 8, 1.4, 11, 10),
    BOX(440, 150, 380, 70, "TF-M では UID の名前空間がクライアントごと",
        "非セキュア側の UID 5 と Crypto パーティションの UID 5 は別物。永続鍵と衝突しない", LIN, PAN, INK, 8, 1.4, 11, 10),
], "UID は 64 ビット。0 は無効。プロジェクトの台帳で管理する")

F["s13_ps_inside"] = SVG(860, 280, [
    T(430, 26, "PS の内部（TF-M）— ITS の上に暗号を重ねる", "middle", 12.5, INK, True),
    flowright(40, 90, [("psa_ps_set(uid, data)", None, GRN, "none"),
                       ("HUK → HKDF → PS 鍵", "ハードウェア固有鍵から導出"),
                       ("AES-GCM で暗号化", "バージョン番号を AD に", SIG, SSOFT),
                       ("外部フラッシュに書く", "暗号文＋タグ")], 175, 60, 28)[0],
    ARR(495, 120, 495, 165, MUT, 1.4),
    BOX(320, 168, 350, 56, "オブジェクト表（UID → 位置・バージョン）を ITS に保存", "外部フラッシュを古い状態に戻しても表と食い違う → リプレイ検出", SIG, SSOFT, INK, 8, 1.4, 10.5, 9.5),
    T(430, 255, "書き込みごとに ITS も更新するので遅い。NO_REPLAY_PROTECTION で省ける", "middle", 10.5, MUT),
], "PS の安全性は ITS と HUK に依存する")

# ===================== 14. アテステーション =====================

F["s14_vs_challenge"] = SVG(860, 260, [
    T(430, 26, "チャレンジ応答とアテステーションの違い", "middle", 12.5, INK, True),
    BOX(40, 60, 380, 80, "チャレンジ応答（9 章）",
        "署名対象 = チャレンジ。証明できるのは「秘密鍵を持っている」ことだけ。乗っ取られた装置も通る", LIN, PAN, INK, 8, 1.4, 12, 10),
    BOX(440, 60, 380, 80, "アテステーション",
        "署名対象 = チャレンジ + ブート時に測ったファームウェアのハッシュ + ライフサイクル状態 + 装置 ID", SIG, SSOFT, INK, 8, 1.4, 12, 10),
    BOX(40, 160, 780, 70, "署名するのはアプリケーションではなく、セキュア側（TF-M のアテステーションパーティション）",
        "アプリが乗っ取られても、セキュア側が独立に測定した値を書き換えられない。だから申告に価値がある", GRN, "none", INK, 8, 1.4, 11.5, 10),
], "「鍵を持っているか」に加えて「何を動かしているか」を、独立した側が証明する")

F["s14_flow"] = SVG(860, 300, [
    T(430, 26, "トークンの取得と検証の流れ", "middle", 12.5, INK, True),
    LANES(["検証サービス", "アプリ（NSPE）", "TF-M（SPE）"], 150, 50, 280, 90, 270)[0],
    MSG([150, 430, 710], 0, 1, 110, "チャレンジ（32 / 48 / 64 バイトの乱数）"),
    MSG([150, 430, 710], 1, 2, 145, "psa_initial_attest_get_token(challenge)"),
    SELF([150, 430, 710], 2, 185, "測定値 + 主張を CBOR に → IAK で署名", SIG, 9.5, 230),
    MSG([150, 430, 710], 2, 1, 220, "トークン（300〜700 バイト）", SIG, 9.5, None, False),
    MSG([150, 430, 710], 1, 0, 250, "トークンを転送", SIG, 9.5, None, False),
    T(430, 285, "アプリは鍵にも測定値にも触らない。1 関数を呼ぶだけ", "middle", 10.5, MUT),
], "チャレンジを受けてトークンを返す。中身を作るのはセキュア側")

F["s14_token"] = SVG(860, 360, [
    T(430, 26, "トークンの構造 — COSE_Sign1 で包んだ CBOR", "middle", 12.5, INK, True),
    RECT(40, 56, 780, 270, 10, PAN, GRN, 1.6),
    T(430, 78, "COSE_Sign1（RFC 9052）", "middle", 11.5, GRN, True),
    BOX(60, 92, 160, 40, "protected header", "alg: ES256", LIN, SCR, INK, 6, 1.2, 10.5, 9),
    BOX(60, 140, 160, 40, "unprotected header", "kid（任意）", LIN, SCR, INK, 6, 1.2, 10.5, 9),
    BOX(60, 188, 160, 40, "signature", "ECDSA P-256、64 B", SIG, SSOFT, INK, 6, 1.2, 10.5, 9),
    RECT(240, 92, 560, 220, 8, SCR, SIG, 1.4),
    T(520, 110, "payload = CBOR マップ（主張、EAT の PSA プロファイル）", "middle", 10.5, SIG, True),
    CODE(255, 132, [("10    nonce               ← チャレンジそのもの", INK),
                    ("256   ueid                ← 装置の一意 ID", INK),
                    ("265   profile             \"http://arm.com/psa/2.0.0\"", INK),
                    ("2394  client id           呼び出し元（NSPE は負）", INK),
                    ("2395  security lifecycle  0x3000 = SECURED", INK),
                    ("2396  implementation id   チップ・実装の識別子", INK),
                    ("2397  boot seed           起動ごとの乱数", INK),
                    ("2399  sw components  [ {type, measurement, version, signer id}, … ]", SIG),
                    ("2400  verification service（任意）", MUT)], 10, INK, 17),
    T(430, 345, "旧プロファイル（PSA_IOT_PROFILE_1）ではキーが −75000 台の負の整数", "middle", 10, MUT),
], "外側が署名の包み、中がキー番号付きの主張。核心は 2399 のソフトウェア構成要素")

F["s14_verify"] = SVG(860, 300, [
    T(430, 26, "検証サービスが確かめること", "middle", 12.5, INK, True),
    flowdown(230, 56, [("① COSE を解析し CBOR の主張を取り出す", None),
                       ("② UEID から登録済み IAK 公開鍵を引く", None),
                       ("③ 署名を検証", "ECDSA P-256 + SHA-256", SIG, SSOFT),
                       ("④ nonce = 送ったチャレンジ", "再送防止", SIG, SSOFT)], 360, 40, 12)[0],
    flowdown(640, 56, [("⑤ lifecycle = SECURED", "デバッグ状態を拒否", SIG, SSOFT),
                       ("⑥ sw components の各ハッシュが許可リストに", "既知の正しいファームウェアか", SIG, SSOFT),
                       ("⑦ 結果をアプリケーションサーバへ", None),
                       ("参照実装: Veraison / iat-verifier", None, LIN, PAN)], 360, 40, 12)[0],
    T(430, 280, "装置側は 1 関数だが、価値は検証側で生まれる", "middle", 10.5, MUT),
], "署名・nonce・ライフサイクル・ハッシュの 4 点を確認して初めて意味がある")

# ===================== 15. Mbed TLS =====================

F["s15_history"] = SVG(860, 260, [
    T(430, 26, "Mbed TLS と PSA の関係の変遷", "middle", 12.5, INK, True),
    flowright(40, 100, [("Mbed TLS 2.x", "PSA は実験的。mbedtls_aes_* が主", LIN, PAN),
                        ("Mbed TLS 3.x", "PSA が正式 API。旧 API と共存。USE_PSA_CRYPTO", LIN, PAN),
                        ("3.6 LTS (2024〜27)", "3.x 最後。多くの SDK が採用", SIG, SSOFT),
                        ("4.0 + TF-PSA-Crypto 1.0 (2025〜)", "暗号は PSA のみ。旧 API 削除", SIG, SSOFT)], 180, 70, 22)[0],
    BOX(40, 170, 780, 60, "新規コードは PSA API だけを使い、mbedtls_* の暗号関数を呼ばない",
        "3.6 で書いたコードがそのまま 4.0 で動く。暗号部分は TF-PSA-Crypto という別リポジトリになった", GRN, "none", INK, 8, 1.4, 11.5, 10),
], "4.0 からは PSA が唯一の暗号 API")

F["s15_want"] = SVG(860, 300, [
    T(430, 26, "PSA_WANT_* — 使うものを宣言する", "middle", 12.5, INK, True),
    BOX(40, 60, 250, 90, "アルゴリズム", "PSA_WANT_ALG_SHA_256 / _HMAC / _GCM / _CTR / _ECDSA / _ECDH / _HKDF …", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    BOX(305, 60, 250, 90, "鍵種別", "PSA_WANT_KEY_TYPE_AES / _HMAC / _DERIVE / _ECC_PUBLIC_KEY …", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    BOX(570, 60, 250, 90, "曲線・鍵長", "PSA_WANT_ECC_SECP_R1_256 / _MONTGOMERY_255 / PSA_WANT_ECC_TWISTED_EDWARDS_255", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    T(430, 175, "鍵ペアは操作ごとに個別に宣言する", "middle", 11, INK, True),
    BYTES(40, 185, [("_BASIC", 150, GRN, "none", "持てる"), ("_IMPORT", 150, GRN, "none", "import"), ("_EXPORT", 150, GRN, "none", "export（公開鍵も）"),
                    ("_GENERATE", 165, GRN, "none", "generate"), ("_DERIVE", 165, GRN, "none", "導出で作る")], 30, 10, 9)[0],
    T(430, 280, "宣言していないものを呼ぶと NOT_SUPPORTED。psa_generate_key の NOT_SUPPORTED はまず _GENERATE 漏れを疑う", "middle", 10, MUT),
], "使うものだけをリンクしてフラッシュを節約する。その代償が宣言漏れによる NOT_SUPPORTED")

F["s15_entropy"] = SVG(860, 260, [
    T(430, 26, "エントロピー源の接続 — 2 つの方法", "middle", 12.5, INK, True),
    BOX(40, 60, 380, 110, "A. MBEDTLS_ENTROPY_HARDWARE_ALT",
        "mbedtls_hardware_poll() を実装し TRNG を読む。Mbed TLS の CTR_DRBG がその種で乱数を生成。TRNG が遅くても DRBG が吸収する", SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(440, 60, 380, 110, "B. MBEDTLS_PSA_CRYPTO_EXTERNAL_RNG",
        "mbedtls_psa_external_get_random() を実装し、すべての乱数を外部から取る。TRNG が速い場合、TF-M やセキュアエレメントの RNG を使う場合", GRN, "none", INK, 8, 1.4, 11.5, 10),
    BOX(40, 185, 780, 50, "どちらも未設定なら psa_crypto_init() が INSUFFICIENT_ENTROPY で失敗する（PC では OS の乱数が使われる）",
        None, ALI, ASOFT, INK, 8, 1.4, 11, 10),
], "マイコンには既定のエントロピー源がない。最初に詰まるところ")

F["s15_driver"] = SVG(860, 340, [
    T(430, 26, "ドライバラッパー — 呼び出しを振り分ける層", "middle", 12.5, INK, True),
    BOX(330, 56, 200, 46, "psa_sign_hash(key, …)", "アプリの呼び出し", LIN, PAN, INK, 8, 1.4, 11, 9.5),
    ARR(430, 102, 430, 130, MUT, 1.6),
    BOX(280, 132, 300, 50, "psa_crypto_driver_wrappers", "鍵の location を見て振り分け", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    ARR(330, 182, 150, 222, MUT, 1.5), ARR(430, 182, 430, 222, MUT, 1.5), ARR(530, 182, 710, 222, MUT, 1.5),
    BOX(40, 224, 220, 80, "ソフトウェア実装", "location 0。鍵の値は実装が持つ。Mbed TLS の C コード", LIN, PAN, INK, 8, 1.4, 11, 9.5),
    BOX(320, 224, 220, 80, "透過ドライバ", "location 0。鍵はソフトが持ち、計算だけハードに。AES / SHA / ECC アクセラレータ", GRN, "none", INK, 8, 1.4, 11, 9.5),
    BOX(600, 224, 220, 80, "不透明ドライバ", "location ≥ 1。鍵がドライバの向こう側。セキュアエレメント、KMU", SIG, SSOFT, INK, 8, 1.4, 11, 9.5),
    T(430, 325, "アプリからは lifetime の location 以外で違いが見えない", "middle", 10.5, MUT),
], "透過は「計算だけ」、不透明は「鍵ごと」を肩代わりする")

# ===================== 16. TF-M =====================

F["s16_arch"] = SVG(860, 380, [
    T(430, 26, "TF-M の構造 — SPE と NSPE", "middle", 12.5, INK, True),
    RECT(40, 56, 340, 280, 10, PAN, LIN, 1.4),
    T(210, 78, "NSPE（非セキュア）", "middle", 11.5, MUT, True),
    BOX(60, 92, 300, 60, "アプリケーション + RTOS", "読者のコード。psa_* を呼ぶ", LIN, SCR),
    BOX(60, 164, 300, 50, "NS インタフェースライブラリ", "libtfm_api_ns.a: 引数を invec/outvec に", LIN, SCR, INK, 8, 1.3, 11, 9.5),
    BOX(60, 226, 300, 44, "ベニアのアドレス表（s_veneers.o）", None, LIN, SCR, INK, 8, 1.3, 10.5, 9.5),
    W(430, 56, 430, 336, c=SIG, lw=3), T(430, 352, "TrustZone（SAU / IDAU）", "middle", 10, SIG, True),
    RECT(480, 56, 340, 280, 10, PAN, SIG, 1.8),
    T(650, 78, "SPE（セキュア）", "middle", 11.5, SIG, True),
    BOX(500, 92, 300, 44, "ベニア（SG 命令の入口）", None, SIG, SSOFT, INK, 8, 1.3, 11, 9.5),
    BOX(500, 146, 300, 44, "SPM（Secure Partition Manager）", "振り分け・メモリ検査・隔離", SIG, SSOFT, INK, 8, 1.3, 11, 9.5),
    BOX(500, 200, 140, 60, "Crypto", "TF-PSA-Crypto", SIG, SSOFT, INK, 6, 1.2, 10.5, 9),
    BOX(660, 200, 140, 60, "ITS / PS", "ストレージ", SIG, SSOFT, INK, 6, 1.2, 10.5, 9),
    BOX(500, 270, 140, 56, "Attestation", "IAK、測定値", SIG, SSOFT, INK, 6, 1.2, 10.5, 9),
    BOX(660, 270, 140, 56, "Platform / FWU", "リセット、NV カウンタ、更新", SIG, SSOFT, INK, 6, 1.2, 10.5, 9),
    ARR(360, 248, 500, 114, MUT, 1.6),
    T(210, 300, "BL2（MCUboot）が両方のイメージを検証して起動", "middle", 9.5, MUT),
], "PSA サービスはセキュア側のパーティションとして動く。非セキュア側はベニアを通してしか入れない")

F["s16_call"] = SVG(860, 360, [
    T(430, 26, "psa_sign_hash() が壁を越えるまで", "middle", 12.5, INK, True),
    LANES(["アプリ", "NS ライブラリ", "SPM", "Crypto パーティション"], 130, 50, 200, 90, 330, 10, 150)[0],
    MSG([130, 330, 530, 730], 0, 1, 110, "psa_sign_hash(key, alg, hash, sig, …)", MUT, 9),
    SELF([130, 330, 530, 730], 1, 140, "invec/outvec に詰め、ロック取得", MUT, 9, 180),
    MSG([130, 330, 530, 730], 1, 2, 170, "psa_call → ベニア → SG 命令", SIG, 9),
    SELF([130, 330, 530, 730], 2, 200, "ポインタが NS メモリか検査", ALI, 9, 180),
    MSG([130, 330, 530, 730], 2, 3, 230, "要求を渡す（隔離レベルに応じ MPU 切替）", MUT, 9),
    SELF([130, 330, 530, 730], 3, 260, "本物の psa_sign_hash（鍵はここ）", SIG, 9, 200),
    MSG([130, 330, 530, 730], 3, 0, 300, "outvec に署名を書き、psa_status_t を返す", SIG, 9, None, False),
    T(430, 345, "往復 5〜20 µs。検査に失敗すると PSA_ERROR_PROGRAMMER_ERROR（−129）", "middle", 10, MUT),
], "非セキュア側の関数はスタブ。本物はパーティションの中で走る")

F["s16_build"] = SVG(860, 300, [
    T(430, 26, "ビルドの主要オプション", "middle", 12.5, INK, True),
    stack(40, 56, 380, [("TFM_PLATFORM", "arm/mps2/an521、stm/stm32u5xx など", SIG, SSOFT),
                        ("TFM_PROFILE", "small / medium / medium_arot-less / large", SIG, SSOFT),
                        ("TFM_ISOLATION_LEVEL", "1 / 2 / 3", SIG, SSOFT),
                        ("TFM_PARTITION_*", "CRYPTO / ITS / PS / INITIAL_ATTESTATION / PLATFORM / FIRMWARE_UPDATE", LIN, PAN)], 44, 6)[0],
    stack(440, 56, 380, [("BL2 / MCUBOOT_IMAGE_NUMBER", "ブートローダの有無、S/NS を別イメージに", LIN, PAN),
                         ("ITS_MAX_ASSET_SIZE / PS_MAX_ASSET_SIZE", "1 オブジェクトの最大。RSA 鍵は既定に入らない", ALI, ASOFT),
                         ("CRYPTO_ENGINE_BUF_SIZE", "Crypto パーティションのヒープ。RSA なら増やす", ALI, ASOFT),
                         ("TFM_MBEDCRYPTO_PSA_CRYPTO_CONFIG_PATH", "PSA_WANT_* のヘッダを差し替え", LIN, PAN)], 44, 6)[0],
    T(430, 280, "cmake --build build -- install で build/api_ns/ に NSPE 用一式（ヘッダ・ライブラリ・ベニア表）が出る", "middle", 10, MUT),
], "プロファイルで機能セットを選び、パーティションとサイズ上限を調整する")

F["s16_client"] = SVG(860, 250, [
    T(430, 26, "クライアント ID と鍵の所有", "middle", 12.5, INK, True),
    BOX(40, 60, 240, 70, "NSPE（クライアント ID = −1）", "既定では非セキュア側全体が 1 つ", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    BOX(310, 60, 240, 70, "Crypto パーティション（正の ID）", None, SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(580, 60, 240, 70, "Attestation パーティション（正の ID）", None, SIG, SSOFT, INK, 8, 1.4, 11.5, 10),
    BOX(40, 150, 780, 70, "鍵 ID と ITS の UID は「作ったクライアント」の名前空間に属する",
        "他のクライアントが同じ ID を指定しても INVALID_HANDLE。TFM_NS_MANAGE_NSID で NS 側のスレッドを別クライアントにすると、互いの鍵が見えなくなる", GRN, "none", INK, 8, 1.4, 11.5, 10),
], "同じ番号でも所有者が違えば別の鍵")

# ===================== 17. 実践パターン =====================

F["s17_map"] = SVG(860, 330, [
    T(430, 26, "7 つのパターンと主役の関数", "middle", 12.5, INK, True),
    stack(40, 56, 380, [("A. 装置の認証", "psa_sign_hash / pk_setup_opaque — 永続 ECDSA 鍵、装置内生成", SIG, SSOFT),
                        ("B. 設定の暗号化保存", "psa_aead_* + ITS — 永続 AES-GCM 鍵", SIG, SSOFT),
                        ("C. OTA イメージ検証", "分割ハッシュ + psa_verify_hash — 公開鍵は WRITE_ONCE", SIG, SSOFT),
                        ("D. 装置間の暗号化通信", "ECDH + HKDF + AEAD + 署名 — 一時鍵と長期鍵", SIG, SSOFT)], 54, 6)[0],
    stack(440, 56, 380, [("E. データの改ざん防止", "psa_mac_compute — HMAC 鍵、チェーン", GRN, "none"),
                         ("F. 製造時の鍵注入", "psa_import_key + 導出 — マスター鍵から装置鍵", GRN, "none"),
                         ("G. 健全性の証明", "psa_initial_attest_get_token — IAK", GRN, "none"),
                         ("共通", "鍵の一覧・ノンス管理・失敗時動作・更新手順・保存場所を紙に書く", LIN, PAN)], 54, 6)[0],
    T(430, 315, "要件は「鍵の属性 + 関数の呼び出し列 + 保存場所」に翻訳する", "middle", 10.5, MUT),
], "各パターンが本編のどの関数を組み合わせるかの見取り図")

F["s17_auth"] = SVG(860, 280, [
    T(430, 26, "パターン A — 装置の認証", "middle", 12.5, INK, True),
    flowright(40, 90, [("初回起動", "psa_generate_key: ECC P-256、SIGN_HASH、永続、EXPORT なし", SIG, SSOFT),
                       ("公開鍵を登録", "psa_export_public_key → CSR → 装置証明書を PS に", LIN, PAN),
                       ("毎回", "mbedtls_pk_setup_opaque(&pk, KEY_ID) → TLS クライアント認証", SIG, SSOFT)], 250, 70, 30)[0],
    BOX(40, 160, 780, 60, "algorithm は PSA_ALG_ECDSA(PSA_ALG_ANY_HASH)",
        "TLS はサーバとハッシュを交渉するため。自社プロトコルなら SHA_256 に固定する", LIN, PAN, INK, 8, 1.4, 11.5, 10),
    T(430, 255, "TF-M では鍵は Crypto パーティションの所有。乗っ取られた NSPE は「署名の依頼」しかできない", "middle", 10, MUT),
], "秘密鍵は装置内で生まれ、一度も外に出ない")

F["s17_ota"] = SVG(860, 280, [
    T(430, 26, "パターン C — OTA イメージの検証", "middle", 12.5, INK, True),
    flowright(40, 90, [("受信しながら", "psa_hash_update をチャンクごとに。フラッシュに書いてよい", LIN, PAN),
                       ("受信完了", "psa_hash_finish → psa_verify_hash(pub, ECDSA(SHA_256), hash, sig)", SIG, SSOFT),
                       ("バージョン比較", "ITS の番号より新しいときだけ切替。古ければ拒否", GRN, "none"),
                       ("切替", "スロットを有効化、番号を ITS に更新", LIN, PAN)], 180, 70, 22)[0],
    BOX(40, 160, 780, 60, "検証用公開鍵は差し替えられない場所に",
        "TF-M: read-only の組み込み鍵 / MCUboot: ブートローダに埋め込み / 単体: ITS WRITE_ONCE", ALI, ASOFT, INK, 8, 1.4, 11.5, 10),
    T(430, 255, "署名が正しくても古いイメージなら拒否する（ロールバック防止）", "middle", 10.5, MUT),
], "受信しながらハッシュ、検証、バージョン比較、切替の順")

F["s17_channel"] = SVG(860, 300, [
    T(430, 26, "パターン D — 装置間の暗号化通信（簡略化した TLS 1.3）", "middle", 12.5, INK, True),
    flowdown(430, 56, [("① 一時 ECDH 鍵ペアを生成し、(一時公開鍵 ∥ 乱数) に長期鍵で署名して交換", None, LIN, PAN),
                       ("② 相手の署名を検証（登録済み公開鍵）", "中間者の排除", SIG, SSOFT),
                       ("③ key_derivation_key_agreement → HKDF（salt = 両者の乱数、info = 方向）→ tx 鍵 / rx 鍵", None, SIG, SSOFT),
                       ("④ AEAD でカウンタノンス通信。一時鍵は destroy。一定回数で①へ", "前方秘匿性と鍵の更新", GRN, "none")], 760, 44, 12)[0],
    T(430, 285, "可能なら DTLS / Noise の既存実装を使い、PSA 鍵は mbedtls_pk_setup_opaque で渡す", "middle", 10, MUT),
], "一時鍵で秘密を作り、長期鍵で相手を確かめ、KDF で方向別の鍵にし、AEAD で運ぶ")

F["s17_provision"] = SVG(860, 260, [
    T(430, 26, "パターン F — 製造時の鍵注入", "middle", 12.5, INK, True),
    BOX(40, 60, 380, 100, "装置内生成（非対称）",
        "初回起動で psa_generate_key。公開鍵だけ取り出して登録。秘密鍵は装置の外に一度も存在しない。対称鍵には使えない", SIG, SSOFT, INK, 8, 1.4, 12, 10),
    BOX(440, 60, 380, 100, "導出注入（対称）",
        "製造ラインの HSM が HKDF(master, info=\"dev-key/v1/\"∥serial) を計算し、psa_import_key で永続鍵に。サーバは同じ計算で再現できる", GRN, "none", INK, 8, 1.4, 12, 10),
    BOX(40, 180, 780, 56, "注入コードは製品ファームウェアから外す。注入した鍵は EXPORT なし。info に用途と世代を入れる",
        None, LIN, PAN, INK, 8, 1.4, 11, 10),
], "非対称は装置内で生み、対称はマスター鍵から導出して注入する")

# ===================== 18. 落とし穴 =====================

F["s18_errors"] = SVG(860, 300, [
    T(430, 26, "エラーコードから原因への最短経路", "middle", 12.5, INK, True),
    flowright(40, 90, [("NOT_PERMITTED", "→ 鍵の usage / algorithm", ALI, ASOFT),
                       ("INVALID_ARGUMENT", "→ バイト列の形式・長さ", ALI, ASOFT),
                       ("NOT_SUPPORTED", "→ PSA_WANT_* の宣言", GRN, "none"),
                       ("BAD_STATE", "→ init 忘れ・順序", ALI, ASOFT)], 180, 60, 22)[0],
    flowright(40, 170, [("BUFFER_TOO_SMALL", "→ サイズマクロ（IV・タグ分）", ALI, ASOFT),
                        ("INVALID_HANDLE", "→ ID 0・破棄済み・他クライアント", ALI, ASOFT),
                        ("INVALID_SIGNATURE", "→ 改ざん、または鍵・AD・形式の不一致", LIN, PAN),
                        ("PROGRAMMER_ERROR", "→ TF-M: ポインタの領域", GRN, "none")], 180, 60, 22)[0],
    T(430, 250, "赤: コードを直す。緑: 設定・環境を直す。灰: データや設計で対処する", "middle", 10.5, MUT),
    T(430, 280, "psa_constant_names（Mbed TLS の programs/psa）で数値を定数名に戻せる", "middle", 10, MUT),
], "最初の 1 つの当たりをつけるための表")

F["s18_scope"] = SVG(860, 300, [
    T(430, 26, "本編で扱った範囲と、名前だけ知っておく範囲", "middle", 12.5, INK, True),
    RECT(40, 56, 500, 220, 10, SSOFT, SIG, 1.6),
    T(290, 78, "本編で扱った（日常の 9 割）", "middle", 11.5, SIG, True),
    T(60, 102, "鍵管理: import / generate / export_public_key / destroy / get_key_attributes", "start", 10, INK),
    T(60, 122, "ハッシュ・MAC・cipher・AEAD の一発関数と分割関数", "start", 10, INK),
    T(60, 142, "署名: sign_hash / verify_hash / sign_message / verify_message", "start", 10, INK),
    T(60, 162, "鍵導出: HKDF / PBKDF2、鍵合意: ECDH", "start", 10, INK),
    T(60, 182, "ストレージ: ITS / PS の 4 関数、アテステーション: get_token", "start", 10, INK),
    T(60, 202, "Mbed TLS の設定・乱数源・ドライバ、TF-M の構造・ビルド", "start", 10, INK),
    T(60, 232, "psa_generate_random、psa_status_t、サイズマクロ", "start", 10, INK),
    RECT(560, 56, 260, 220, 10, "none", FNT, 1.2, "5,4"),
    T(690, 78, "名前と参照先だけ", "middle", 11.5, MUT, True),
    T(575, 102, "PAKE（SPAKE2+ / EC-JPAKE）", "start", 10, MUT),
    T(575, 122, "中断可能な署名", "start", 10, MUT),
    T(575, 142, "wrap_key / unwrap_key", "start", 10, MUT),
    T(575, 162, "Firmware Update API", "start", 10, MUT),
    T(575, 182, "FF-M クライアント API", "start", 10, MUT),
    T(575, 202, "SP 800-108、XChaCha、SHAKE", "start", 10, MUT),
    T(575, 222, "ポスト量子（ML-KEM / ML-DSA）", "start", 10, MUT),
    T(575, 242, "旧 SE ドライバ（psa_drv_se_*）", "start", 10, MUT),
], "右側は必要になったときに仕様書を引く")
