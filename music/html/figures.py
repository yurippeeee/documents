# -*- coding: utf-8 -*-
"""音楽理論編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
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


# ===================== 音楽用の色と部品 =====================
import re as _re
from glyphs import GLYPH

BLU = "var(--blue)";   BSOFT = "var(--blue-soft)"
GRN2 = "var(--green)"; GSOFT = "var(--green-soft)"
GLD = "var(--gold)";   GOSOFT = "var(--gold-soft)"
PUR = "var(--purple)"; PSOFT = "var(--purple-soft)"
KW = "var(--key-white)"; KB = "var(--key-black)"; KL = "var(--key-line)"; KI = "var(--key-ink)"

LETTERS = "CDEFGAB"
PC_OF_LETTER = [0, 2, 4, 5, 7, 9, 11]
NAMES_SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
NAMES_FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
DOREMI = {"C": "ド", "D": "レ", "E": "ミ", "F": "ファ", "G": "ソ", "A": "ラ", "B": "シ"}
IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]

def parse(n):
    """'C4' 'F#3' 'Bb2' 'C♯4' 'E♭5' 'Fx4' を読む。midi は C4 = 60（国際式）。"""
    m = _re.match(r"^([A-Ga-g])([#♯b♭x]*)(-?\d+)$", n.strip())
    if not m:
        raise ValueError("bad note %r" % n)
    letter = m.group(1).upper(); acc_s = m.group(2); octv = int(m.group(3))
    acc = sum(c in "#♯" for c in acc_s) - sum(c in "b♭" for c in acc_s) + 2 * acc_s.count("x")
    li = LETTERS.index(letter)
    return dict(letter=letter, li=li, acc=acc, oct=octv,
                midi=12 * (octv + 1) + PC_OF_LETTER[li] + acc, dia=li + 7 * octv)

def midi_of(n):
    return n if isinstance(n, int) else parse(n)["midi"]

def freq(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)

def acc_str(acc):
    return {0: "", 1: "♯", -1: "♭", 2: "𝄪", -2: "♭♭"}[acc]

def nname(n, octave=True):
    """'C#4' → 'C♯4'。int（MIDI）なら♯表記。"""
    if isinstance(n, int):
        return NAMES_SHARP[n % 12] + (str(n // 12 - 1) if octave else "")
    p = parse(n)
    return p["letter"] + acc_str(p["acc"]) + (str(p["oct"]) if octave else "")

# ---------- 鍵盤 ----------
def _white_list(lo, hi):
    return [m for m in range(lo, hi + 1) if not IS_BLACK[m % 12]]

def KEYBOARD(x, y, lo, hi, ww=22, wh=92, hl=None, names="c", bwr=0.62, bhr=0.62, sz=None, info=None):
    """lo..hi（MIDI）の鍵盤。hl = {midi: dict(c=色, label=文字, strong=True/False)}。
    strong でない白鍵は薄く色を重ね、strong の鍵と黒鍵は色で塗る（文字は白）。
    names: None / "c"（C だけ、オクターブ番号付き）/ "white"（白鍵すべて）/ "doremi"。
    info に dict を渡すと、各鍵の中心 x と下端 y を {midi: (cx, ybottom)} で返す。"""
    hl = hl or {}
    whites = _white_list(lo, hi)
    pos = {}
    o = []
    for i, m in enumerate(whites):
        kx = x + i * ww
        h = hl.get(m)
        o.append('<rect x="%g" y="%g" width="%g" height="%g" rx="3" fill="%s" stroke="%s" stroke-width="1.1"/>'
                 % (kx, y, ww, wh, KW, KL))
        if h:
            o.append('<rect x="%g" y="%g" width="%g" height="%g" rx="3" fill="%s" fill-opacity="%g" stroke="%s" stroke-width="1.8"/>'
                     % (kx + 0.9, y + 0.9, ww - 1.8, wh - 1.8, h.get("c", SIG), 0.9 if h.get("strong") else 0.3, h.get("c", SIG)))
        pos[m] = (kx + ww / 2, y + wh)
    bw, bh = ww * bwr, wh * bhr
    for m in range(lo, hi + 1):
        if not IS_BLACK[m % 12]:
            continue
        prev = m - 1
        if prev not in pos:
            continue
        pc = m % 12
        shift = {1: -0.12, 3: 0.12, 6: -0.14, 8: 0.0, 10: 0.14}[pc] * bw
        cx = pos[prev][0] + ww / 2 + shift
        h = hl.get(m)
        o.append('<rect x="%g" y="%g" width="%g" height="%g" rx="2.5" fill="%s" stroke="%s" stroke-width="1"/>'
                 % (cx - bw / 2, y, bw, bh, h.get("c", SIG) if h else KB, KB))
        pos[m] = (cx, y + bh)
    fs = sz or max(8.5, min(11.5, ww * 0.46))
    for m in range(lo, hi + 1):
        h = hl.get(m) or {}
        cx, yb = pos[m]
        black = IS_BLACK[m % 12]
        lab = h.get("label")
        if lab is None and not black:
            if names == "c" and m % 12 == 0:
                lab = "C%d" % (m // 12 - 1)
            elif names == "white":
                lab = NAMES_SHARP[m % 12]
            elif names == "doremi":
                lab = DOREMI[NAMES_SHARP[m % 12]]
        if lab:
            col = "#fff" if (black or h.get("strong")) else KI
            o.append(T(cx, yb - (7 if not black else 6), lab, "middle",
                       fs if not black else fs * 0.82, col, bool(h)))
    if info is not None:
        info.update(pos)
    return "".join(o)

def kb_width(lo, hi, ww=22):
    return len(_white_list(lo, hi)) * ww

# ---------- 五線 ----------
# グリフの基準（フォント単位）: ト音記号は 1 間 = 170、G 線 = y156。ヘ音記号は 1 間 = 194、F 線 = y564。
_GC = (170.0, 156.0)
_FC = (194.0, 564.0)

def _glyph(name, gx, gy, k, fill):
    return '<path d="%s" fill="%s" transform="translate(%g,%g) scale(%g,%g)"/>' % (GLYPH[name]["d"], fill, gx, gy, k, -k)

def CLEF(kind, x, ytop, s, fill=INK):
    """ytop: 第 5 線（いちばん上の線）の y。s: 線の間隔。"""
    if kind == "treble":
        k = s / _GC[0]; yG = ytop + 3 * s
        return _glyph("gclef", x - 120 * k, yG + _GC[1] * k, k, fill)
    k = s / _FC[0]; yF = ytop + s
    return _glyph("fclef", x - 75 * k, yF + _FC[1] * k, k, fill)

def ACC(acc, x, yn, s, fill=INK):
    """臨時記号を右端 x、音の高さ yn に描く。"""
    if acc == 1:
        k = 2.8 * s / 954.0; return _glyph("sharp", x - 365 * k, yn + 198 * k, k, fill)
    if acc == -1:
        k = 2.45 * s / 836.0; return _glyph("flat", x - 329 * k, yn + 205 * k, k, fill)
    if acc == 0:
        k = 2.7 * s / 965.0; return _glyph("natural", x - 324 * k, yn + 192.5 * k, k, fill)
    if acc == -2:   # ダブルフラット = フラット 2 つ
        return ACC(-1, x, yn, s, fill) + ACC(-1, x - 0.84 * s, yn, s, fill)
    if acc == 2:    # ダブルシャープ = ×
        r = 0.32 * s
        return W(x - 2 * r, yn - r, x, yn + r, c=fill, lw=0.3 * s) + W(x - 2 * r, yn + r, x, yn - r, c=fill, lw=0.3 * s)
    return ""

def _ell(cx, cy, rx, ry, rot):
    a = math.radians(rot); dx, dy = rx * math.cos(a), rx * math.sin(a)
    return ("M%g,%g A%g,%g %g 1 0 %g,%g A%g,%g %g 1 0 %g,%gZ"
            % (cx - dx, cy - dy, rx, ry, rot, cx + dx, cy + dy, rx, ry, rot, cx - dx, cy - dy))

def HEAD(cx, cy, s, dur="whole", fill=INK):
    if dur == "whole":
        d = _ell(cx, cy, 0.78 * s, 0.52 * s, 0) + _ell(cx, cy, 0.36 * s, 0.22 * s, 65)
    elif dur == "half":
        d = _ell(cx, cy, 0.64 * s, 0.44 * s, -22) + _ell(cx, cy, 0.5 * s, 0.2 * s, -32)
    else:
        d = _ell(cx, cy, 0.64 * s, 0.44 * s, -22)
    return '<path d="%s" fill="%s" fill-rule="evenodd"/>' % (d, fill)

def staff_pos(n, clef):
    """第 1 線（いちばん下の線）を 0 とし、線と間を 1 つずつ数えた位置。"""
    d = parse(n)["dia"] if isinstance(n, str) else n
    return d - (30 if clef == "treble" else 18)   # E4 / G2

# ---------- 調・音階・和音の名前 ----------
# 調号: 正の数 = ♯ の数、負の数 = ♭ の数
KEY_SIGS = {"C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
            "F": -1, "Bb": -2, "Eb": -3, "Ab": -4, "Db": -5, "Gb": -6, "Cb": -7,
            "Am": 0, "Em": 1, "Bm": 2, "F#m": 3, "C#m": 4, "G#m": 5, "D#m": 6, "A#m": 7,
            "Dm": -1, "Gm": -2, "Cm": -3, "Fm": -4, "Bbm": -5, "Ebm": -6, "Abm": -7}
SHARP_ORDER = "FCGDAEB"
FLAT_ORDER = "BEADGCF"
MAJOR = [2, 2, 1, 2, 2, 2, 1]
NAT_MINOR = [2, 1, 2, 2, 1, 2, 2]
HARM_MINOR = [2, 1, 2, 2, 1, 3, 1]
MEL_MINOR = [2, 1, 2, 2, 2, 2, 1]

def _norm_acc(s):
    return s.replace("♯", "#").replace("♭", "b")

def key_count(key):
    """'G' → 1、'F' → -1、'Am' → 0 のように調号の数を返す（♯ が正、♭ が負）"""
    return KEY_SIGS[_norm_acc(key)]

def key_acc(key):
    """調号で変わる文字ごとの変化: {'F': 1, ...}。key は数でも調の名前でもよい"""
    n = key if isinstance(key, int) else key_count(key)
    acc = {L: 0 for L in LETTERS}
    for L in (SHARP_ORDER[:n] if n > 0 else FLAT_ORDER[:-n]):
        acc[L] = 1 if n > 0 else -1
    return acc

def spell_scale(tonic, steps=MAJOR, n=None):
    """主音（例 'D4'）から、全音・半音の並び steps で音階を作る。7 つの文字を 1 回ずつ使って綴る。
    n を指定すると n 音（オクターブ上の主音まで含めるなら 8）。"""
    p = parse(tonic)
    out = [tonic]
    n = n or (len(steps) + 1)
    pc = p["midi"]
    for i in range(1, n):
        pc += steps[(i - 1) % len(steps)]
        dia = p["dia"] + i
        li, octv = dia % 7, dia // 7
        nat = 12 * (octv + 1) + PC_OF_LETTER[li]
        a = pc - nat
        if a < -2 or a > 2:
            raise ValueError("cannot spell %s step %d" % (tonic, i))
        out.append("%s%s%d" % (LETTERS[li], {0: "", 1: "#", -1: "b", 2: "x", -2: "bb"}[a], octv))
    return out

# コードネーム（例 C, Am7, G7(♭9), Bm7(♭5), F/A, Cdim7, Caug, Csus4, CM7, C6, Cadd9）
_CH_TOK = _re.compile(r"(M13|M9|M7|13|11|9|7|6|sus4|sus2|add9|add2|\([^)]*\))")

def chord_parse(sym):
    """返り値 dict(root='C♯', root_pc, ivs=[根音からの半音数], bass=None or 'E', bass_pc, suffix)"""
    m = _re.match(r"^([A-G])([#♯b♭]?)(.*)$", sym.strip())
    if not m:
        raise ValueError("bad chord %r" % sym)
    L, a, rest = m.group(1), _norm_acc(m.group(2)), m.group(3)
    bass = None
    mb = _re.match(r"^(.*)/([A-G][#♯b♭]?)$", rest)
    if mb:
        rest, bass = mb.group(1), _norm_acc(mb.group(2))
    suffix = rest
    r = _norm_acc(rest).replace("△", "M").replace("Δ", "M").replace("maj", "M").replace("ø", "m7(b5)") \
        .replace("°7", "dim7").replace("°", "dim").replace("-5", "b5").replace("m7b5", "m7(b5)")
    if r.startswith("+"):
        r = "aug" + r[1:]
    ivs = None
    if r.startswith("mM7") or r.startswith("m(M7)"):
        ivs = [0, 3, 7, 11]; r = r[3:] if r.startswith("mM7") else r[5:]
    elif r.startswith("m7(b5)"):
        ivs = [0, 3, 6, 10]; r = r[6:]
    elif r.startswith("dim7"):
        ivs = [0, 3, 6, 9]; r = r[4:]
    elif r.startswith("dim"):
        ivs = [0, 3, 6]; r = r[3:]
    elif r.startswith("aug"):
        ivs = [0, 4, 8]; r = r[3:]
    elif r.startswith("m") and not r.startswith("maj"):
        ivs = [0, 3, 7]; r = r[1:]
    else:
        ivs = [0, 4, 7]
    for t in _CH_TOK.findall(r):
        if t in ("M7", "M9", "M13"):
            ivs.append(11)
            if t != "M7": ivs.append(14)
            if t == "M13": ivs.append(21)
        elif t == "7": ivs.append(10)
        elif t == "9": ivs += [10, 14]
        elif t == "11": ivs += [10, 14, 17]
        elif t == "13": ivs += [10, 14, 21]
        elif t == "6": ivs.append(9)
        elif t in ("add9", "add2"): ivs.append(14)
        elif t == "sus4": ivs = [5 if v in (3, 4) else v for v in ivs]
        elif t == "sus2": ivs = [2 if v in (3, 4) else v for v in ivs]
        elif t.startswith("("):
            for x in t[1:-1].split(","):
                x = x.strip()
                tab = {"9": 14, "b9": 13, "#9": 15, "11": 17, "#11": 18, "13": 21, "b13": 20}
                if x in tab: ivs.append(tab[x])
                elif x == "b5": ivs = [6 if v == 7 else v for v in ivs]
                elif x == "#5": ivs = [8 if v == 7 else v for v in ivs]
    seen = []
    for v in ivs:
        if v not in seen: seen.append(v)
    root_pc = (PC_OF_LETTER[LETTERS.index(L)] + {"": 0, "#": 1, "b": -1}[a]) % 12
    bass_pc = None
    if bass:
        bass_pc = (PC_OF_LETTER[LETTERS.index(bass[0])] + {"": 0, "#": 1, "b": -1}[bass[1:]]) % 12
    sh = lambda s: s.replace("#", "♯").replace("b", "♭")
    return dict(root=L + sh(a), root_letter=L, root_pc=root_pc, ivs=sorted(seen), bass=sh(bass) if bass else None,
                bass_pc=bass_pc, suffix=sh(suffix))

def chord_midis(sym, root_lo=48):
    """密集配置（根音を root_lo 以上の最も低い位置に置き、上へ積む）。分数コードは低音を 1 オクターブ下に足す。"""
    c = chord_parse(sym)
    r = root_lo + (c["root_pc"] - root_lo) % 12
    ms = [r + v for v in c["ivs"]]
    if c["bass_pc"] is not None and c["bass_pc"] != c["root_pc"]:
        b = r - 12 + (c["bass_pc"] - r) % 12
        ms = [b] + ms
    return ms

def roman(sym, key):
    """コードネームを調の主音から見たローマ数字（ディグリーネーム）にする。例: roman('Am7','C') → 'VIm7'。
    文字の数で I〜VII を決め、主音の長音階からの変化を ♭・♯ で付ける。"""
    k = _norm_acc(key)
    minor = k.endswith("m")
    tk = k[:-1] if minor else k
    tl, ta = tk[0], {"": 0, "#": 1, "b": -1}[tk[1:]]
    t_pc = (PC_OF_LETTER[LETTERS.index(tl)] + ta) % 12
    c = chord_parse(sym)
    def num(letter, pc):
        d = (LETTERS.index(letter) - LETTERS.index(tl)) % 7
        exp = (t_pc + MAJOR_CUM[d]) % 12
        diff = (pc - exp + 6) % 12 - 6
        return {0: "", -1: "♭", 1: "♯", -2: "♭♭", 2: "𝄪"}.get(diff, "?") + ["I", "II", "III", "IV", "V", "VI", "VII"][d]
    s = num(c["root_letter"], c["root_pc"]) + c["suffix"]
    if c["bass"]:
        s += "/" + num(c["bass"][0], c["bass_pc"])
    return s

MAJOR_CUM = [0, 2, 4, 5, 7, 9, 11]

# ---------- 五線 ----------
PERC_PP = {"%kick": 1, "%snare": 5, "%hat": 9, "%click": 4, "%accent": 4}   # 打楽器の五線での位置（第 1 線 = 0）

def staff_start(s=10, key=0, time=None):
    """音部記号・調号・拍子記号のあとで、最初の音符を置ける x（五線の左端から）"""
    n = abs(key if isinstance(key, int) else key_count(key))
    return 4.0 * s + n * 1.05 * s + (2.6 * s if time else 0) + 1.7 * s

_KS_POS = {("treble", 1): [8, 5, 9, 6, 3, 7, 4], ("treble", -1): [4, 7, 3, 6, 2, 5, 1],
           ("bass", 1): [6, 3, 7, 4, 1, 5, 2], ("bass", -1): [2, 5, 1, 4, 0, 3, -1]}

def KEYSIG(x, ytop, s, clef, key, fill=INK):
    """調号を、音部記号の右（x = 五線の左端）に描く"""
    n = key if isinstance(key, int) else key_count(key)
    if n == 0 or clef not in ("treble", "bass"):
        return ""
    sg = 1 if n > 0 else -1
    o = []
    for i, pp in enumerate(_KS_POS[(clef, sg)][:abs(n)]):
        yn = ytop + 4 * s - pp * s / 2
        o.append(ACC(sg, x + 4.0 * s + i * 1.05 * s + 0.9 * s, yn, s, fill))
    return "".join(o)

def TIMESIG(cx, ytop, s, time, fill=INK):
    a, b = time.split("/")
    st = ' text-anchor="middle" font-size="%g" fill="%s" font-family="Georgia, \'Times New Roman\', serif" font-weight="700"' % (2.75 * s, fill)
    return ('<text x="%g" y="%g"%s>%s</text><text x="%g" y="%g"%s>%s</text>'
            % (cx, ytop + 1.97 * s, st, a, cx, ytop + 3.97 * s, st, b))

def REST(cx, ytop, s, dur="quarter", fill=INK, dot=False):
    """休符。ytop は第 5 線（打楽器の 1 本線では、線を真ん中の線とみなした第 5 線の位置）"""
    o = []
    if dur == "whole":
        o.append('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (cx - 0.6 * s, ytop + s, 1.2 * s, 0.5 * s, fill))
    elif dur == "half":
        o.append('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (cx - 0.6 * s, ytop + 1.5 * s, 1.2 * s, 0.5 * s, fill))
    elif dur == "quarter":
        k = 2.9 * s / 596.0
        o.append(_glyph("qrest", cx - 159.5 * k, ytop + 0.55 * s + 658 * k, k, fill))
    elif dur == "eighth":
        k = 1.9 * s / 366.0
        o.append(_glyph("erest", cx - 126.5 * k, ytop + 1.1 * s + 532 * k, k, fill))
    else:   # 16th: 8 分休符の旗を 2 つ重ねる
        k = 1.9 * s / 366.0
        o.append(_glyph("erest", cx - 126.5 * k + 0.22 * s, ytop + 0.6 * s + 532 * k, k, fill))
        o.append(_glyph("erest", cx - 126.5 * k - 0.1 * s, ytop + 1.6 * s + 532 * k, k, fill))
    if dot:
        o.append('<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (cx + 1.0 * s, ytop + 1.5 * s, 0.17 * s, fill))
    return "".join(o)

def _flag(xs, y1, s, up, fill, n=1):
    o = []
    for j in range(n):
        d = 1 if up else -1
        yy = y1 + d * j * 0.85 * s
        o.append('<path d="M%g,%g c%g,%g %g,%g %g,%g c%g,%g %g,%g %g,%gZ" fill="%s"/>'
                 % (xs, yy, 0.2 * s, d * 1.2 * s, 1.6 * s, d * 1.4 * s, 1.1 * s, d * 2.8 * s,
                    0.1 * s, -d * 1.0 * s, -0.6 * s, -d * 1.6 * s, -1.1 * s, -d * 1.9 * s, fill))
    return "".join(o)

def STAFF(x, ytop, w, s=10, clef="treble", items=(), lc=None, clef_fill=INK, info=None, key=0, time=None):
    """五線。clef: "treble" / "bass" / "grand"（大譜表）/ "perc"（打楽器用の 1 本線）。
    key: 調号（♯ の数を正、♭ の数を負。'G' のような調の名前でもよい）。time: 拍子記号（例 "3/4"）。
    最初の音符を置ける x は staff_start(s, key, time) で求まる。
    items の各要素（dict）:
      x（五線の左端から）, notes=[音名…], dur="whole"/"half"/"quarter"/"eighth"/"16th", dot=True（付点）,
      rest=True（音符の代わりに dur の休符）, bar=True / "double" / "end"（その x に小節線）,
      fill=色, fills={音名: 色}, acc=False（臨時記号を書かない）, stem="up"/"down", staff="treble"/"bass"（大譜表で段を指定）,
      tie=True（次の音符の同じ高さへタイ）, beam=任意の値（同じ値の 8 分・16 分音符を連桁でつなぐ）,
      label=五線の下の文字, lcol, lsz, lbold, label_dy, sym=五線の上の文字（コードネームなど）, symcol, head="x"（× の符頭）。
    調号があるときの臨時記号: 調号と同じ変化なら書かず、違えば書く（本位記号 ♮ を含む）。"""
    lc = lc or MUT
    o = []
    if clef in ("perc", "rhythm"):
        staves = [(clef, ytop)]
    elif clef in ("treble", "bass"):
        staves = [(clef, ytop)]
    else:
        staves = [("treble", ytop), ("bass", ytop + 8 * s)]
    ka = key_acc(key)
    kn = key if isinstance(key, int) else key_count(key)
    for kind, yt in staves:
        if kind in ("perc", "rhythm"):
            if kind == "rhythm":
                o.append(W(x, yt + 2 * s, x + w, yt + 2 * s, c=lc, lw=1))
            else:
                for i in range(5):
                    o.append(W(x, yt + i * s, x + w, yt + i * s, c=lc, lw=1))
            o.append('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (x + 1.3 * s, yt + s, 0.38 * s, 2 * s, clef_fill))
            o.append('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (x + 2.1 * s, yt + s, 0.38 * s, 2 * s, clef_fill))
        else:
            for i in range(5):
                o.append(W(x, yt + i * s, x + w, yt + i * s, c=lc, lw=1))
            o.append(CLEF(kind, x + 0.8 * s, yt, s, clef_fill))
            o.append(KEYSIG(x, yt, s, kind, kn, clef_fill))
        if time:
            o.append(TIMESIG(x + 4.0 * s + abs(kn) * 1.05 * s + 1.3 * s, yt, s, time, clef_fill))
    if clef == "grand":
        o.append(W(x, ytop, x, ytop + 12 * s, c=lc, lw=1.2))
    ybot_all = staves[-1][1] + 4 * s
    heads = []     # 各 item の音符の位置（タイ・連桁用）
    for idx, it in enumerate(items):
        cx = x + it["x"]
        fill = it.get("fill", INK)
        dur = it.get("dur", "whole")
        if it.get("bar"):
            y0, y1 = (ytop + s, ytop + 3 * s) if clef == "rhythm" else (ytop, ybot_all)
            kind = it["bar"]
            if kind == "double":
                o.append(W(cx - 0.45 * s, y0, cx - 0.45 * s, y1, c=lc, lw=1.1)); o.append(W(cx, y0, cx, y1, c=lc, lw=1.1))
            elif kind == "end":
                o.append(W(cx - 0.75 * s, y0, cx - 0.75 * s, y1, c=lc, lw=1.1))
                o.append('<rect x="%g" y="%g" width="%g" height="%g" fill="%s"/>' % (cx - 0.4 * s, y0, 0.45 * s, y1 - y0, INK))
            else:
                o.append(W(cx, y0, cx, y1, c=lc, lw=1.1))
            heads.append(None)
            continue
        if it.get("rest"):
            yt = staves[0][1] if clef != "grand" else (ytop + 8 * s if it.get("staff") == "bass" else ytop)
            o.append(REST(cx, yt, s, dur, fill, it.get("dot")))
            heads.append(None)
            if it.get("label"):
                ly = (ytop + (12 * s if clef == "grand" else 4 * s)) + it.get("label_dy", 2.6 * s)
                o.append(T(cx, ly, it["label"], "middle", it.get("lsz", 11), it.get("lcol", fill), it.get("lbold", True)))
            continue
        placed = []
        for n in it.get("notes", []):
            if clef == "rhythm":
                if not placed:
                    placed.append((dict(letter="B", acc=0, midi=-4, oct=4), "rhythm", ytop, 4, ytop + 2 * s))
                continue
            if n.startswith("%"):
                pp = PERC_PP.get(n, 4)
                placed.append((dict(letter="B", acc=0, midi=-1, oct=4, perc=n), "perc", ytop, pp, ytop + 4 * s - pp * s / 2))
                continue
            p = parse(n)
            if clef == "grand":
                kind = it.get("staff") or ("treble" if p["midi"] >= 60 else "bass")
                yt = ytop if kind == "treble" else ytop + 8 * s
            else:
                kind, yt = ("treble", ytop) if clef == "perc" else staves[0]
            pp = p["dia"] - (30 if kind == "treble" else 18)
            placed.append((p, kind, yt, pp, yt + 4 * s - pp * s / 2))
        placed.sort(key=lambda q: -q[4])
        shifted = set()
        for i in range(1, len(placed)):
            if placed[i][1] == placed[i - 1][1] and placed[i][3] - placed[i - 1][3] == 1 and (i - 1) not in shifted:
                shifted.add(i)
        hw = 0.78 * s if dur == "whole" else 0.64 * s
        hd = []
        for i, (p, kind, yt, pp, yn) in enumerate(placed):
            nx = cx + (2 * hw - 0.1 * s if i in shifted else 0)
            lw_ = hw * 1.55
            if kind != "rhythm":
                if pp <= -2:
                    for q in range(-2, pp - 1, -2):
                        yy = yt + 4 * s - q * s / 2
                        o.append(W(nx - lw_, yy, nx + lw_, yy, c=lc, lw=1.1))
                if pp >= 10:
                    for q in range(10, pp + 1, 2):
                        yy = yt + 4 * s - q * s / 2
                        o.append(W(nx - lw_, yy, nx + lw_, yy, c=lc, lw=1.1))
            nm = p.get("perc") or (nname("%s%s%d" % (p["letter"], {0: "", 1: "#", -1: "b", 2: "x", -2: "bb"}[p["acc"]], p["oct"])) if kind != "rhythm" else "")
            col = it.get("fills", {}).get(nm, fill) if it.get("fills") else fill
            if it.get("head") == "x" or p.get("perc") == "%hat":
                r_ = 0.5 * s
                o.append(W(nx - r_, yn - r_, nx + r_, yn + r_, c=col, lw=1.6)); o.append(W(nx - r_, yn + r_, nx + r_, yn - r_, c=col, lw=1.6))
            else:
                o.append(HEAD(nx, yn, s, "quarter" if dur in ("eighth", "16th") else dur, col))
            if it.get("dot"):
                o.append('<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (nx + hw + 0.5 * s, yn - (0.5 * s if pp % 2 == 0 else 0), 0.17 * s, col))
            need = p["acc"] != ka[p["letter"]] if kind not in ("perc", "rhythm") else False
            if need and it.get("acc", True):
                ax = cx - hw - 0.35 * s - (0.9 * s if (i % 2 and len(placed) > 1 and any(q[0]["acc"] for q in placed[:i])) else 0)
                o.append(ACC(p["acc"], ax, yn, s, col))
            hd.append((p["midi"], kind, nx, yn, pp))
            if info is not None:
                info.setdefault(it.get("key", len(info)), []).append((nx, yn))
        heads.append(dict(it=it, cx=cx, hw=hw, hd=hd, placed=placed, fill=fill, dur=dur))
        if it.get("sym"):
            ys = min([ytop - 1.0 * s] + [q[4] - 1.7 * s for q in placed])
            o.append(T(cx, ys, it["sym"], "middle", it.get("symsz", 1.3 * s), it.get("symcol", INK), True))
        if it.get("label"):
            ly = (ytop + (12 * s if clef == "grand" else 4 * s)) + it.get("label_dy", 2.6 * s)
            o.append(T(cx, ly, it["label"], "middle", it.get("lsz", 11), it.get("lcol", fill), it.get("lbold", True)))
    # 符幹・旗・連桁
    groups = {}
    for k, h in enumerate(heads):
        if h and h["dur"] in ("eighth", "16th") and h["it"].get("beam") is not None:
            groups.setdefault(h["it"]["beam"], []).append(k)
    beamed = set(k for g in groups.values() if len(g) > 1 for k in g)
    for k, h in enumerate(heads):
        if not h or k in beamed or h["dur"] not in ("half", "quarter", "eighth", "16th") or not h["placed"]:
            continue
        s_ = s; hw = h["hw"]; cx = h["cx"]
        parts = [h["placed"]] if clef != "grand" else [g for g in ([q for q in h["placed"] if q[1] == "bass"], [q for q in h["placed"] if q[1] == "treble"]) if g]
        for pl in parts:
            st = h["it"].get("stem") or ("down" if pl[-1][3] >= 4 else "up")
            if st == "up":
                xs_ = cx + hw - 0.06 * s_; y0 = pl[0][4] - 0.1 * s_; y1 = pl[-1][4] - 3.4 * s_
            else:
                xs_ = cx - hw + 0.06 * s_; y0 = pl[-1][4] + 0.1 * s_; y1 = pl[0][4] + 3.4 * s_
            o.append(W(xs_, y0, xs_, y1, c=h["fill"], lw=1.2))
            if h["dur"] in ("eighth", "16th"):
                o.append(_flag(xs_, y1, s_, st == "up", h["fill"], 1 if h["dur"] == "eighth" else 2))
    for g in groups.values():
        if len(g) < 2:
            continue
        hs = [heads[k] for k in g]
        allpp = [q[3] for h in hs for q in h["placed"]]
        up = (sum(allpp) / len(allpp)) < 4 if not hs[0]["it"].get("stem") else hs[0]["it"]["stem"] == "up"
        xs = [(h["cx"] + h["hw"] - 0.06 * s) if up else (h["cx"] - h["hw"] + 0.06 * s) for h in hs]
        ext = [(min(q[4] for q in h["placed"]) - 3.3 * s) if up else (max(q[4] for q in h["placed"]) + 3.3 * s) for h in hs]
        slope = (ext[-1] - ext[0]) / (xs[-1] - xs[0]) if xs[-1] != xs[0] else 0
        slope = max(-0.12, min(0.12, slope * 0.5))
        b0 = ext[0]
        for xi, ei in zip(xs, ext):
            yb = b0 + slope * (xi - xs[0])
            if up and yb > ei: b0 -= yb - ei
            if not up and yb < ei: b0 += ei - yb
        by = lambda xx: b0 + slope * (xx - xs[0])
        bt = 0.48 * s
        for h, xi in zip(hs, xs):
            far = (max if up else min)(q[4] for q in h["placed"])
            o.append(W(xi, far + (-0.1 * s if up else 0.1 * s), xi, by(xi), c=h["fill"], lw=1.2))
        def beam(xa, xb, off):
            d = off if up else -off
            ya, yb_ = by(xa) + d, by(xb) + d
            t_ = bt if up else -bt
            return '<path d="M%g,%g L%g,%g L%g,%g L%g,%gZ" fill="%s"/>' % (xa, ya, xb, yb_, xb, yb_ + t_, xa, ya + t_, hs[0]["fill"])
        o.append(beam(xs[0], xs[-1], 0))
        for j, h in enumerate(hs):
            if h["dur"] != "16th":
                continue
            nb = j + 1 < len(hs) and hs[j + 1]["dur"] == "16th"
            pb = j > 0 and hs[j - 1]["dur"] == "16th"
            if nb:
                o.append(beam(xs[j], xs[j + 1], 0.8 * s))
            elif not pb:
                if j + 1 < len(hs):
                    o.append(beam(xs[j], xs[j] + 1.1 * s, 0.8 * s))
                else:
                    o.append(beam(xs[j] - 1.1 * s, xs[j], 0.8 * s))
    # タイ
    for k, h in enumerate(heads):
        if not h or not h["it"].get("tie"):
            continue
        nxt = next((heads[j] for j in range(k + 1, len(heads)) if heads[j]), None)
        if not nxt:
            continue
        st = h["it"].get("stem") or ("down" if h["placed"] and h["placed"][-1][3] >= 4 else "up")
        nh = len(h["hd"])
        for ti, (m1, kd1, x1, y1, pp1) in enumerate(h["hd"]):
            for (m2, kd2, x2, y2, pp2) in nxt["hd"]:
                if m1 == m2 and kd1 == kd2:
                    # 1 音なら符幹と反対側へ。和音なら上半分の音は上へ、下半分の音は下へ曲げる
                    d = (1 if st == "up" else -1) if nh == 1 else (-1 if ti >= (nh + 1) // 2 else 1)
                    xa, xb = x1 + 0.55 * h["hw"], x2 - 0.55 * nxt["hw"]
                    ya = y1 + d * 0.55 * s
                    xm = (xa + xb) / 2
                    o.append('<path d="M%g,%g Q%g,%g %g,%g Q%g,%g %g,%gZ" fill="%s"/>'
                             % (xa, ya, xm, ya + d * 1.1 * s, xb, ya, xm, ya + d * 0.8 * s, xa, ya, h["fill"]))
    return "".join(o)

# ---------- 12 音の円 ----------
def CLOCK(cx, cy, r, active=(), fills=None, labels=None, poly=True, pcol=SIG, sz=11, dot=7, start=0, order="chroma"):
    """12 の音（ピッチクラス）を円周に並べる。0 = C を真上に置き、時計回りに半音ずつ。
    order="fifths" なら完全 5 度ずつ（C G D A E B F♯ C♯ G♯ D♯ A♯ F）に並べる（五度圏）。labels は音（0〜11）ごとの文字。"""
    labels = labels or NAMES_SHARP
    fills = fills or {}
    o = [CIRC(cx, cy, r, LIN, 1.2)]
    pos = (lambda k: (7 * k) % 12) if order == "fifths" else (lambda k: k)
    pts = {}
    for k in range(12):
        a = math.radians(-90 + 30 * pos(k))
        px, py = cx + r * math.cos(a), cy + r * math.sin(a)
        pts[k] = (px, py)
    act = [k % 12 for k in active]
    if poly and len(act) >= 2:
        seq = sorted(set(act), key=lambda k: (pos(k) - pos(start % 12)) % 12)
        o.append(PL([pts[k] for k in seq] + [pts[seq[0]]], c=pcol, lw=1.8, fill="none"))
    for k in range(12):
        px, py = pts[k]
        on = k in act
        o.append(CIRC(px, py, dot if on else 3.2, fills.get(k, pcol) if on else MUT, 1.4,
                      fills.get(k, pcol) if on else PAN))
        a = math.radians(-90 + 30 * pos(k))
        lx, ly = cx + (r + 16) * math.cos(a), cy + (r + 16) * math.sin(a) + sz * 0.36
        o.append(T(lx, ly, labels[k], "middle", sz, INK if on else MUT, on))
    return "".join(o)

# ---------- 倍音のスペクトル（音の組み合わせの相性） ----------
def _rough_g(u):
    return math.exp(-3.51 * u) - math.exp(-5.75 * u)

def rough_pair(fa, aa, fb, ab):
    """2 つの純音成分の粗さ（Plomp–Levelt の実験曲線を Sethares が式にしたもの）"""
    lo = min(fa, fb)
    s_ = 0.24 / (0.0207 * lo + 18.96)
    return min(aa, ab) * _rough_g(s_ * abs(fb - fa))

def spec_analyze(fs, H=8, tol=16.0, thr=0.015):
    """fs: 各音の基本周波数。倍音は第 1〜H 倍音、振幅 1/h。
    返り値: 一致（差が tol セント以内）の組、ぶつかり（粗さ thr 以上）の組、粗さの合計"""
    co, cl, R = [], [], 0.0
    for i in range(len(fs)):
        for j in range(i + 1, len(fs)):
            for h in range(1, H + 1):
                for k in range(1, H + 1):
                    fa, fb = fs[i] * h, fs[j] * k
                    r = rough_pair(fa, 1.0 / h, fb, 1.0 / k)
                    R += r
                    c = abs(1200 * math.log2(fb / fa))
                    if c <= tol:
                        co.append((i, h, j, k, abs(fb - fa)))
                    elif r >= thr:
                        cl.append((i, h, j, k, r))
    return co, cl, R

ROUGH_REF = spec_analyze([261.6256, 261.6256 * 2 ** (1 / 12)])[2]   # 短 2 度（C4–C♯4）を 100 とする

def _wave(x1, y1, x2, y2, wl=8.0, amp=2.2):
    """(x1,y1) から (x2,y2) へ向かう波線（path の d）。半波長ごとに 2 次ベジェで左右に振る"""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    n = max(2, int(round(L / (wl / 2))))
    d = ["M%.1f,%.1f" % (x1, y1)]
    for t in range(n):
        um, u1 = (t + 0.5) / n, (t + 1) / n
        sg = 1 if t % 2 == 0 else -1
        d.append("Q%.1f,%.1f %.1f,%.1f" % (x1 + dx * um + nx * 2 * amp * sg, y1 + dy * um + ny * 2 * amp * sg, x1 + dx * u1, y1 + dy * u1))
    return " ".join(d)

def SPECTRUM(x, y, w, notes, H=8, lane_h=46, fmin=None, fmax=None, tol=16.0, thr=0.015, label_w=86, axis=True, stats=True):
    """notes: [dict(f=周波数, label=表示名, c=色)]。高い音を上の段に描く。
    各段に第 1〜H 倍音の棒（高さは振幅 1/h）。一致する倍音を緑の線、ぶつかる倍音を赤の波線で結ぶ。"""
    o = []
    fs = [n["f"] for n in notes]
    fmin = fmin or min(fs) * 0.82
    fmax = fmax or max(fs) * H * 1.12
    X = lambda f: x + label_w + (w - label_w) * math.log(f / fmin) / math.log(fmax / fmin)
    order = sorted(range(len(notes)), key=lambda i: -fs[i])     # 上の段ほど高い音
    lane_y = {i: y + r * lane_h for r, i in enumerate(order)}
    base = {i: lane_y[i] + lane_h - 6 for i in order}
    top = {}
    for i in order:
        n = notes[i]
        o.append(W(x + label_w, base[i], x + w, base[i], c=LIN, lw=1))
        o.append(T(x + label_w - 10, base[i] - 8, n["label"], "end", 11.5, n["c"], True))
        for h in range(1, H + 1):
            fx = X(fs[i] * h)
            hh = (lane_h - 12) / h
            o.append('<rect x="%.1f" y="%.1f" width="4" height="%.1f" rx="1" fill="%s"/>' % (fx - 2, base[i] - hh, hh, n["c"]))
            top[(i, h)] = (fx, base[i] - hh)
    co, cl, R = spec_analyze(fs, H, tol, thr)
    for (i, h, j, k, r) in cl:
        (x1, y1), (x2, y2) = top[(i, h)], top[(j, k)]
        op = min(1.0, 0.25 + r * 8)
        o.append('<path d="%s" fill="none" stroke="%s" stroke-width="1.4" stroke-opacity="%.2f"/>' % (_wave(x1, y1, x2, y2), ALI, op))
    for (i, h, j, k, df) in co:
        (x1, y1), (x2, y2) = top[(i, h)], top[(j, k)]
        o.append(W(x1, y1, x2, y2, c=GRN2, lw=2.4))
        o.append(CIRC(x1, y1, 3.6, GRN2, 1.4, GRN2))
        o.append(CIRC(x2, y2, 3.6, GRN2, 1.4, GRN2))
    yb = y + len(notes) * lane_h
    if axis:
        o.append(W(x + label_w, yb + 2, x + w, yb + 2, c=MUT, lw=1))
        for m in range(24, 121, 12):
            f = freq(m)
            if fmin <= f <= fmax:
                xx = X(f)
                o.append(W(xx, yb + 2, xx, yb + 7, c=MUT, lw=1))
                o.append(T(xx, yb + 19, "C%d" % (m // 12 - 1), "middle", 9.5, MUT))
    if stats:
        o.append(T(x + w, y - 6, "一致 %d 組 ・ ぶつかり %d 組 ・ 粗さ %d" % (len(co), len(cl), round(100 * R / ROUGH_REF)), "end", 10.5, INK, True))
    return "".join(o), (len(co), len(cl), 100 * R / ROUGH_REF)

# 章ごとの図は fig/fNN.py に置く（このファイルの関数と F をそのまま使える）
import glob as _glob
_SEL = [x for x in _os.environ.get("MUSIC_FIGS", "").split(",") if x]
for _p in sorted(_glob.glob(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "fig", "f*.py"))):
    if _SEL and _os.path.basename(_p)[1:3] not in _SEL:
        continue
    exec(compile(open(_p, encoding="utf-8").read(), _p, "exec"), globals())
