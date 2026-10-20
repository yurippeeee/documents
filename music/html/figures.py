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

def STAFF(x, ytop, w, s=10, clef="treble", items=(), lc=None, clef_fill=INK, info=None):
    """items: dict(x=五線左端からの x, notes=[...], dur="whole"/"half"/"quarter", fill=色, acc=True,
    label=下に書く文字, lcol=, stem="up"/"down"/None)。clef="grand" なら大譜表（下に低音部）。"""
    lc = lc or MUT
    o = []
    staves = [("treble", ytop)] if clef == "treble" else [("bass", ytop)] if clef == "bass" else \
             [("treble", ytop), ("bass", ytop + 8 * s)]
    for kind, yt in staves:
        for i in range(5):
            o.append(W(x, yt + i * s, x + w, yt + i * s, c=lc, lw=1))
        o.append(CLEF(kind, x + 0.8 * s, yt, s, clef_fill))
    if clef == "grand":
        o.append(W(x, ytop, x, ytop + 12 * s, c=lc, lw=1.2))
    for it in items:
        cx = x + it["x"]
        fill = it.get("fill", INK)
        dur = it.get("dur", "whole")
        ns = [parse(n) for n in it["notes"]]
        placed = []
        for p in sorted(ns, key=lambda q: q["dia"]):
            if clef == "grand":
                kind = it.get("staff") or ("treble" if p["midi"] >= 60 else "bass")
                yt = ytop if kind == "treble" else ytop + 8 * s
            else:
                kind, yt = staves[0]
            pp = p["dia"] - (30 if kind == "treble" else 18)
            yb = yt + 4 * s
            yn = yb - pp * s / 2
            placed.append((p, kind, yt, pp, yn))
        # 2 度でぶつかる音は右にずらす
        shifted = set()
        for i in range(1, len(placed)):
            if placed[i][1] == placed[i - 1][1] and placed[i][3] - placed[i - 1][3] == 1 and (i - 1) not in shifted:
                shifted.add(i)
        hw = 0.78 * s if dur == "whole" else 0.64 * s
        for i, (p, kind, yt, pp, yn) in enumerate(placed):
            nx = cx + (2 * hw - 0.1 * s if i in shifted else 0)
            # 加線
            lw_ = hw * 1.55
            if pp <= -2:
                for q in range(-2, pp - 1, -2):
                    yy = yt + 4 * s - q * s / 2
                    o.append(W(nx - lw_, yy, nx + lw_, yy, c=lc, lw=1.1))
            if pp >= 10:
                for q in range(10, pp + 1, 2):
                    yy = yt + 4 * s - q * s / 2
                    o.append(W(nx - lw_, yy, nx + lw_, yy, c=lc, lw=1.1))
            col = it.get("fills", {}).get(nname("%s%s%d" % (p["letter"], acc_str(p["acc"]), p["oct"])), fill) if it.get("fills") else fill
            o.append(HEAD(nx, yn, s, dur, col))
            if p["acc"] != 0 and it.get("acc", True):
                ax = cx - hw - 0.35 * s - (0.9 * s if (i % 2 and len(placed) > 1 and any(q[0]["acc"] for q in placed[:i])) else 0)
                o.append(ACC(p["acc"], ax, yn, s, col))
            if info is not None:
                info.setdefault(it.get("key", len(info)), []).append((nx, yn))
        if dur in ("half", "quarter") and placed:
            st = it.get("stem") or ("down" if placed[-1][3] >= 4 else "up")
            if st == "up":
                xs_ = cx + hw - 0.06 * s; y0 = placed[0][4] - 0.1 * s; y1 = placed[-1][4] - 3.4 * s
            else:
                xs_ = cx - hw + 0.06 * s; y0 = placed[-1][4] + 0.1 * s; y1 = placed[0][4] + 3.4 * s
            o.append(W(xs_, y0, xs_, y1, c=fill, lw=1.2))
        if it.get("label"):
            ly = (ytop + (12 * s if clef == "grand" else 4 * s)) + it.get("label_dy", 2.6 * s)
            o.append(T(cx, ly, it["label"], "middle", it.get("lsz", 11), it.get("lcol", fill), it.get("lbold", True)))
    return "".join(o)

# ---------- 12 音の円 ----------
def CLOCK(cx, cy, r, active=(), fills=None, labels=None, poly=True, pcol=SIG, sz=11, dot=7, start=0):
    """12 の音（ピッチクラス）を円周に並べる。0 = C を真上に置き、時計回りに半音ずつ。"""
    labels = labels or NAMES_SHARP
    fills = fills or {}
    o = [CIRC(cx, cy, r, LIN, 1.2)]
    pts = {}
    for k in range(12):
        a = math.radians(-90 + 30 * k)
        px, py = cx + r * math.cos(a), cy + r * math.sin(a)
        pts[k] = (px, py)
    act = [k % 12 for k in active]
    if poly and len(act) >= 2:
        seq = sorted(set(act), key=lambda k: (k - start) % 12)
        o.append(PL([pts[k] for k in seq] + [pts[seq[0]]], c=pcol, lw=1.8, fill="none"))
    for k in range(12):
        px, py = pts[k]
        on = k in act
        o.append(CIRC(px, py, dot if on else 3.2, fills.get(k, pcol) if on else MUT, 1.4,
                      fills.get(k, pcol) if on else PAN))
        a = math.radians(-90 + 30 * k)
        lx, ly = cx + (r + 16) * math.cos(a), cy + (r + 16) * math.sin(a) + sz * 0.36
        o.append(T(lx, ly, labels[k], "middle", sz, INK if on else MUT, on))
    return "".join(o)

# 章ごとの図は fig/fNN.py に置く（このファイルの関数と F をそのまま使える）
import glob as _glob
for _p in sorted(_glob.glob(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "fig", "f*.py"))):
    exec(compile(open(_p, encoding="utf-8").read(), _p, "exec"), globals())
