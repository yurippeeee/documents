# -*- coding: utf-8 -*-
"""電磁界シミュレーション編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
import math
import os as _os

F = {}
_CHECK = bool(_os.environ.get("FIGCHECK"))
_OVER = []

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"    # スチールブルー
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

# ===================== 01. なぜ必要か =====================

F["e01_scale"] = SVG(840, 320, [
    T(420, 26, "構造の長さ ℓ と波長 λ の比が、使う道具を決める", "middle", 12.5, INK, True),
    # 3 パネル
    RECT(24, 52, 256, 176, 10, SCR, LIN, 1.3),
    T(152, 76, "ℓ < λ/20", "middle", 12.5, GRN, True),
    WAVE(44, 140, 216, 0.55, 26, GRN, 1.8),
    RECT(120, 128, 26, 24, 2, SSOFT, INK, 1.4),
    T(133, 172, "構造", "middle", 9, MUT),
    T(152, 200, "位相のずれ < 18°", "middle", 10.5, MUT),
    T(152, 218, "集中定数（SPICE）", "middle", 10.5, INK, True),

    RECT(292, 52, 256, 176, 10, SCR, LIN, 1.3),
    T(420, 76, "λ/20 〜 λ/4", "middle", 12.5, SIG, True),
    WAVE(312, 140, 216, 1.6, 26, SIG, 1.8),
    RECT(360, 128, 92, 24, 2, SSOFT, INK, 1.4),
    T(406, 172, "構造", "middle", 9, MUT),
    T(420, 200, "位相が場所で違う", "middle", 10.5, MUT),
    T(420, 218, "分布定数（伝送線路）", "middle", 10.5, INK, True),

    RECT(560, 52, 256, 176, 10, SCR, LIN, 1.3),
    T(688, 76, "ℓ > λ/4", "middle", 12.5, ALI, True),
    WAVE(580, 140, 216, 4.2, 26, ALI, 1.8),
    RECT(600, 128, 176, 24, 2, ASOFT, INK, 1.4),
    T(688, 172, "構造", "middle", 9, MUT),
    T(688, 200, "放射・共振・結合", "middle", 10.5, MUT),
    T(688, 218, "3D 電磁界解析", "middle", 10.5, ALI, True),

    RECT(24, 246, 792, 58, 8, SSOFT, SIG, 1.4),
    T(420, 268, "判断は「材料中の波長」で行う —— 基板（εr=4.4）では λ が 1/√4.4 = 0.48 倍に縮む",
      "middle", 11, INK, True),
    T(420, 290, "1 GHz・FR-4 なら λ = 14 cm、その 1/20 は 7 mm —— これを超える配線は、もう「線」ではない",
      "middle", 10.5, MUT),
], "同じ構造でも周波数が上がれば右へ移動する。デジタルでは立ち上がり時間が実効的な周波数を決める（18 章）")

F["e01_why"] = SVG(840, 300, [
    T(420, 26, "電磁界シミュレータが答えられる問い", "middle", 12.5, INK, True),
    BOX(320, 132, 200, 56, "その形にしたら\n電磁界はどうなるか", None, SIG, SSOFT, INK, 10, 1.8, 12),
    BOX(30, 56, 230, 52, "どこへ、どれだけ放射するか", "利得・指向性・帯域（15・17 章）", LIN, PAN, INK, 8, 1.3, 11, 9),
    BOX(580, 56, 230, 52, "どれだけ通り、どれだけ返るか", "S パラメータ（14 章）", LIN, PAN, INK, 8, 1.3, 11, 9),
    BOX(30, 134, 230, 52, "どこが結合するか", "クロストーク・漏れ（18 章）", LIN, PAN, INK, 8, 1.3, 11, 9),
    BOX(580, 134, 230, 52, "どこが共振するか", "筐体・プレーン・キャビティ", LIN, PAN, INK, 8, 1.3, 11, 9),
    BOX(30, 212, 230, 52, "どこが強くなるか", "電流集中・電界の最大点", LIN, PAN, INK, 8, 1.3, 11, 9),
    BOX(580, 212, 230, 52, "どれだけ遮蔽できるか", "シールド効果（19 章）", LIN, PAN, INK, 8, 1.3, 11, 9),
    ARR(264, 82, 316, 136, MUT, 1.4), ARR(576, 82, 524, 136, MUT, 1.4),
    ARR(264, 160, 316, 160, MUT, 1.4), ARR(576, 160, 524, 160, MUT, 1.4),
    ARR(264, 238, 316, 184, MUT, 1.4), ARR(576, 238, 524, 184, MUT, 1.4),
    T(420, 288, "共通するのは「作る前に知りたい」——試作の前に形を決めるための道具である", "middle", 10.5, MUT),
], "測れないもの（構造の内部の場、電流の流れ方）が見えるのが、実測に対する決定的な優位である")

F["e01_flow"] = SVG(860, 320, [
    T(430, 26, "手計算・シミュレーション・実測の三角形", "middle", 12.5, INK, True),
    BOX(330, 56, 200, 52, "手計算・近似式", "桁を決める。初期値", GRN, PAN, INK, 8, 1.5, 12, 9.5),
    BOX(60, 176, 230, 60, "シミュレーション", "任意形状・内部が見える\n掃引が安い", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(570, 176, 230, 60, "実測", "現実そのもの\n中は見えない", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    DARR(320, 96, 200, 172, MUT, 1.5, 6),
    DARR(540, 96, 660, 172, MUT, 1.5, 6),
    DARR(296, 206, 564, 206, MUT, 1.6, 6),
    T(240, 148, "初期値", "middle", 9.5, FNT), T(624, 148, "桁の検算", "middle", 9.5, FNT),
    T(430, 196, "相互検証", "middle", 10.5, INK, True),
    RECT(60, 258, 740, 46, 8, ASOFT, ALI, 1.4),
    T(430, 278, "3 つは違う種類の間違え方をする —— だから互いの検算になる", "middle", 11, INK, True),
    T(430, 296, "「合わない」ときに疑うべきは、多くの場合ソルバではなくモデルである（20 章）", "middle", 10, MUT),
], "どれか 1 つだけに頼ると、その手段固有の誤りに気づけない。3 つを回すのが設計の作法である")

F["e01_when"] = SVG(860, 300, [
    T(430, 26, "シミュレーションと現実の差 — 4 つの源", "middle", 12.5, INK, True),
    BOX(30, 62, 380, 62, "① 離散化誤差", "連続の場を有限個の数値にしたことによる誤差", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(30, 140, 380, 62, "② 境界の誤差", "無限空間を有限の箱で打ち切ったことによる誤差", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(450, 62, 380, 62, "③ モデル化誤差", "形状の簡略化・材料値・励振のモデル", ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    BOX(450, 140, 380, 62, "④ 数値・実装の誤差", "丸め誤差・反復解法の打ち切り・補間", ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    RECT(30, 218, 380, 34, 6, SSOFT, SIG, 1.3),
    T(220, 240, "計算を増やせば減る（04・10・13 章）", "middle", 10.5, SIG, True),
    RECT(450, 218, 380, 34, 6, ASOFT, ALI, 1.3),
    T(640, 240, "計算を増やしても減らない（03・12・20 章）", "middle", 10.5, ALI, True),
    T(430, 280, "初学者は左ばかり気にするが、実務で足をすくわれるのはほぼ右である", "middle", 11, INK, True),
], "「メッシュを細かくしたのに実測と合わない」——それは右側の問題なので、計算量では解決しない")

# ===================== 02. マクスウェル方程式 =====================

F["e02_maxwell"] = SVG(860, 330, [
    T(430, 26, "4 本の式が言っていること", "middle", 12.5, INK, True),
    BOX(30, 54, 390, 76, "∇×E = −∂B/∂t", "磁界が時間変化すると、その周りに渦巻く電界ができる",
        SIG, SSOFT, INK, 8, 1.6, 14, 9.5, None, True),
    BOX(440, 54, 390, 76, "∇×H = J + ∂D/∂t", "電流が流れるか電界が時間変化すると、渦巻く磁界ができる",
        SIG, SSOFT, INK, 8, 1.6, 14, 9.5, None, True),
    BOX(30, 148, 390, 68, "∇·D = ρ", "電気力線は電荷から湧き出す", LIN, PAN, INK, 8, 1.4, 14, 9.5, None, True),
    BOX(440, 148, 390, 68, "∇·B = 0", "磁力線は湧き出さない。必ず閉じる", LIN, PAN, INK, 8, 1.4, 14, 9.5, None, True),
    DARR(424, 92, 436, 92, ALI, 2, 7),
    RECT(30, 236, 800, 66, 8, ASOFT, ALI, 1.4),
    T(430, 258, "上 2 本が互いを餌にしている —— これが電磁波の正体である", "middle", 11.5, INK, True),
    T(430, 278, "変化する磁界 → 電界 → その変化が磁界 → … の連鎖が空間を伝わる", "middle", 10.5, MUT),
    T(430, 296, "FDTD（05 章）は、この 2 本を交互に更新するだけの手法である", "middle", 10.5, SIG, True),
], "微分形は「その点で何が起きているか」を述べる。ソルバが離散化するのはこの形である")

F["e02_curl"] = SVG(840, 320, [
    T(420, 26, "発散と回転 — 2 つの演算の直感", "middle", 12.5, INK, True),
    RECT(24, 52, 390, 200, 10, SCR, LIN, 1.3),
    T(219, 76, "発散 ∇·F — 湧き出しか吸い込みか", "middle", 11.5, INK, True),
    D(150, 160, SIG, 5),
] + [
    ARR(150 + 12*math.cos(a), 160 + 12*math.sin(a),
        150 + 44*math.cos(a), 160 + 44*math.sin(a), SIG, 1.5, 5)
    for a in [i*math.pi/4 for i in range(8)]
] + [
    T(150, 226, "∇·F > 0（湧き出し）", "middle", 10, MUT),
    CIRC(320, 160, 34, LIN, 1.3, "none", "4 4"),
    T(320, 226, "微小な球で正味の流出を測る", "middle", 9.5, FNT),
    T(320, 160, "測る", "middle", 10, FNT),

    RECT(426, 52, 390, 200, 10, SCR, LIN, 1.3),
    T(621, 76, "回転 ∇×F — どちら向きに渦巻くか", "middle", 11.5, INK, True),
] + [
    ARR(552 + 40*math.cos(a), 160 + 40*math.sin(a),
        552 + 40*math.cos(a + 0.5), 160 + 40*math.sin(a + 0.5), GRN, 1.5, 5)
    for a in [i*math.pi/3 for i in range(6)]
] + [
    T(552, 226, "∇×F ≠ 0（渦がある）", "middle", 10, MUT),
    CIRC(720, 160, 22, LIN, 1.6),
] + [
    W(720, 160, 720 + 22*math.cos(a), 160 + 22*math.sin(a), c=MUT, lw=1.4)
    for a in [i*math.pi/2 for i in range(4)]
] + [
    T(720, 226, "微小な羽根車の回り方で測る", "middle", 9.5, FNT),
    RECT(24, 264, 792, 42, 8, SSOFT, SIG, 1.4),
    T(420, 282, "回転の x 成分 = ∂Ez/∂y − ∂Ey/∂z —— y と z の微分だけでできている", "middle", 11, INK, True),
    T(420, 300, "この構造が、Yee 格子で E と H を互い違いに置く理由になる（05 章）", "middle", 10, MUT),
], "発散はスカラーを、回転はベクトルを返す。マクスウェル方程式はこの 2 つだけでできている")

F["e02_wave"] = SVG(860, 384, [
    T(430, 26, "波動方程式の導出 — 光速が出てくる", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("∇×E = −μ₀ ∂H/∂t の両辺の回転を取る", None, LIN, PAN),
        ("右辺に ∇×H = ε₀ ∂E/∂t を代入", "2 本の式が結合した", LIN, PAN),
        ("恒等式 ∇×(∇×E) = ∇(∇·E) − ∇²E、真空では ∇·E = 0", None, LIN, PAN),
        ("∇²E = μ₀ε₀ ∂²E/∂t²   ← 波動方程式", None, SIG, SSOFT),
    ], 560, 46, 22)[0],
    ARR(430, 300, 430, 320, MUT, 1.6),
    BOX(230, 322, 400, 50, "v = 1/√(μ₀ε₀) ≈ 3.00×10⁸ m/s = c",
        "電気と磁気の実験定数だけから、光の速さが出た", SIG, SSOFT, INK, 8, 1.8, 14, 9.5, None, True),
], "材料中では v = c/√(εr μr)、波長も同じ比で縮む。メッシュを決めるのは常にこの短い方の波長である")

F["e02_regimes"] = SVG(840, 300, [
    T(420, 26, "時間領域と周波数領域 — ∂/∂t → jω", "middle", 12.5, INK, True),
    RECT(24, 52, 390, 200, 10, SSOFT, SIG, 1.4),
    T(219, 76, "時間領域", "middle", 12.5, SIG, True),
    T(219, 98, "微分方程式を時間発展させる", "middle", 10, MUT),
    WAVE(50, 150, 340, 3, 22, SIG, 1.6, 0, 200, 1.6),
    T(219, 190, "パルスを入れて応答を追う", "middle", 10, MUT),
    T(219, 214, "◎ 1 回で広帯域　◎ 過渡・非線形", "middle", 10, INK, True),
    T(219, 234, "× 鋭い共振（待ち時間）", "middle", 10, ALI),

    RECT(426, 52, 390, 200, 10, SSOFT, GRN, 1.4),
    T(621, 76, "周波数領域", "middle", 12.5, GRN, True),
    T(621, 98, "各周波数で連立方程式を解く", "middle", 10, MUT),
    W(470, 190, 470, 130, c=GRN, lw=2.6), W(520, 190, 520, 158, c=GRN, lw=2.6),
    W(570, 190, 570, 118, c=GRN, lw=2.6), W(620, 190, 620, 168, c=GRN, lw=2.6),
    W(670, 190, 670, 146, c=GRN, lw=2.6), W(720, 190, 720, 176, c=GRN, lw=2.6),
    W(456, 190, 780, 190, c=LIN, lw=1.4),
    T(621, 210, "1 点ずつ解いて掃引する", "middle", 10, MUT),
    T(621, 234, "◎ 共振・分散材料　× 広帯域は高価", "middle", 10, INK, True),
    T(420, 284, "この表が第 II 部の手法選択の骨格になる —— 広帯域なら時間領域、鋭い共振なら周波数領域",
      "middle", 11, INK, True),
], "同じマクスウェル方程式でも、時間微分をどう扱うかで解き方も得手不得手も変わる")

# ===================== 03. 材料と境界条件 =====================

F["e03_material"] = SVG(840, 300, [
    T(420, 26, "材料は 3 つの定数で決まる", "middle", 12.5, INK, True),
    BOX(24, 56, 250, 92, "ε（誘電率）", "電界で分極する度合い\n→ 波を遅くする\n→ 容量を増やす", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(294, 56, 250, 92, "μ（透磁率）", "磁界で磁化する度合い\n→ 波を遅くする\n→ インダクタンスを増やす", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(564, 56, 250, 92, "σ（導電率）", "電界で電流が流れる度合い\n→ エネルギーを熱に変える\n→ 電流を流す", ALI, ASOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(190, 170, 460, 46, "D = εE,   B = μH,   J = σE", None, LIN, PAN, INK, 8, 1.5, 14, 10, None, True),
    RECT(90, 232, 660, 54, 8, SCR, LIN, 1.3),
    T(420, 254, "波の速さ v = c/√(εr μr) —— 材料中では波長が縮む", "middle", 11, INK, True),
    T(420, 274, "FR-4（εr≈4.4）では λ が 0.48 倍。メッシュはこの短い波長で決める", "middle", 10, MUT),
], "非分散・等方・線形という理想化のもとでの話。現実には周波数依存・異方性・非線形がある")

F["e03_disp"] = SVG(840, 300, [
    T(420, 26, "損失 — 導電損も誘電損も複素誘電率にまとめる", "middle", 12.5, INK, True),
    BOX(30, 56, 360, 56, "∇×H = σE + jωεE", "導電損と変位電流", LIN, PAN, INK, 8, 1.4, 13, 9.5, None, True),
    ARR(400, 84, 440, 84, MUT, 1.6),
    BOX(450, 56, 360, 56, "= jω(ε − jσ/ω)E", "導電率は誘電率の虚部になる", SIG, SSOFT, INK, 8, 1.5, 13, 9.5, None, True),
    BOX(230, 130, 380, 50, "tanδ = ε″ / ε′（損失正接）", None, SIG, SSOFT, INK, 8, 1.6, 14, 9.5, None, True),
    RECT(30, 198, 780, 90, 8, SCR, LIN, 1.3),
    T(420, 220, "材料ごとの tanδ（GHz 帯の目安）", "middle", 11, INK, True),
    T(140, 244, "PTFE・低損失材", "middle", 10, MUT), T(140, 264, "0.001〜0.002", "middle", 11, GRN, True),
    T(420, 244, "FR-4", "middle", 10, MUT), T(420, 264, "0.02（基板損失の主犯）", "middle", 11, ALI, True),
    T(700, 244, "一般的な樹脂", "middle", 10, MUT), T(700, 264, "0.005〜0.03", "middle", 11, MUT, True),
], "数 GHz を超えると誘電損が導体損に匹敵する。挿入損失が実測より小さいなら、まず tanδ の入れ忘れを疑う")

F["e03_skin"] = SVG(840, 330, [
    T(420, 26, "表皮効果 — 導体の中に電流が入れる深さ", "middle", 12.5, INK, True),
    RECT(60, 56, 300, 160, 4, SCR, INK, 1.8),
    T(210, 46, "導体の断面", "middle", 10.5, MUT, True),
] + [
    W(60, 56, 60, 216, c=ALI, lw=3),
    T(48, 140, "表面", "end", 10, ALI, True),
] + [
    PL([(60 + 290 * u, 216 - 150 * math.exp(-u * 4.2)) for u in [i / 120 for i in range(121)]], SIG, 2.2),
    W(60, 216, 360, 216, c=LIN, lw=1.2),
    W(129, 216, 129, 68, c=GRN, lw=1.4, dash="4 4"),
    T(133, 82, "δ（1/e に落ちる深さ）", "start", 10, GRN, True),
    T(210, 236, "深さ →", "middle", 9.5, FNT),
    BOX(400, 60, 410, 52, "δ = 1/√(π f μ σ)", "√f に反比例して薄くなる", SIG, SSOFT, INK, 8, 1.7, 14, 9.5, None, True),
    RECT(400, 126, 410, 92, 8, SCR, LIN, 1.3),
    T(605, 146, "銅の表皮深さ", "middle", 10.5, INK, True),
    T(470, 168, "1 MHz", "middle", 10, MUT), T(700, 168, "66 µm", "middle", 10, MUT),
    T(470, 188, "1 GHz", "middle", 10, ALI, True), T(700, 188, "2.1 µm", "middle", 10, ALI, True),
    T(470, 208, "10 GHz", "middle", 10, MUT), T(700, 208, "0.66 µm", "middle", 10, MUT),
    RECT(60, 250, 750, 60, 8, ASOFT, ALI, 1.4),
    T(435, 272, "1 GHz で電流が流れる層は 2 µm —— メッシュで刻むのは非現実的", "middle", 11, INK, True),
    T(435, 292, "だから「表面インピーダンス境界」で内部を解かずに済ませる（導体厚 ≫ δ が条件）", "middle", 10, MUT),
], "低周波や薄膜では δ が厚さと同程度になり、この近似は使えない。そこは実体をメッシュする")

F["e03_bc"] = SVG(860, 320, [
    T(430, 26, "境界条件 — 場は境界で何を守るか", "middle", 12.5, INK, True),
    RECT(60, 60, 340, 90, 0, SCR, LIN, 1.2),
    RECT(60, 150, 340, 90, 0, SSOFT, LIN, 1.2),
    W(60, 150, 400, 150, c=INK, lw=2.4),
    T(230, 84, "媒質 1（ε₁, μ₁）", "middle", 10.5, MUT, True),
    T(230, 226, "媒質 2（ε₂, μ₂）", "middle", 10.5, MUT, True),
    ARR(150, 150, 150, 118, GRN, 1.8), T(150, 108, "法線", "middle", 9.5, GRN, True),
    ARR(276, 140, 336, 140, SIG, 1.8), T(342, 144, "接線", "start", 9.5, SIG, True),
    RECT(440, 60, 390, 180, 8, SCR, LIN, 1.3),
    T(635, 84, "境界で連続な成分", "middle", 11.5, INK, True),
    T(520, 114, "E の接線成分", "middle", 10.5, SIG, True), T(760, 114, "連続", "middle", 10.5, MUT),
    T(520, 142, "H の接線成分", "middle", 10.5, SIG, True), T(760, 142, "連続（表面電流がなければ）", "middle", 10, MUT),
    T(520, 170, "D の法線成分", "middle", 10.5, GRN, True), T(760, 170, "連続（表面電荷がなければ）", "middle", 10, MUT),
    T(520, 198, "B の法線成分", "middle", 10.5, GRN, True), T(760, 198, "常に連続", "middle", 10.5, MUT),
    T(635, 224, "覚え方: 接線は E と H、法線は D と B", "middle", 10.5, INK, True),
    RECT(60, 258, 770, 50, 8, SSOFT, SIG, 1.4),
    T(445, 278, "PEC: E の接線 = 0（金属の近似・電気的対称面） ／ PMC: H の接線 = 0（磁気的対称面）",
      "middle", 11, INK, True),
    T(445, 297, "PEC は損失をゼロにするので、Q 値や効率の評価には使えない", "middle", 10, ALI),
], "積分形（02 章）を境界を跨ぐ微小ループ・微小円柱に適用すると、これらの条件が出る")

# ===================== 04. 離散化 =====================

F["e04_sampling"] = SVG(840, 300, [
    T(420, 26, "離散化 — 連続の場を格子点の値だけで表す", "middle", 12.5, INK, True),
    WAVE(60, 130, 720, 2.2, 46, FNT, 1.4),
    T(60, 62, "連続の場 E(x)", "start", 10.5, MUT, True),
] + [
    (D(60 + 720 * i / 18, 130 - 46 * math.sin(2 * math.pi * 2.2 * i / 18), SIG, 4)
     + W(60 + 720 * i / 18, 130, 60 + 720 * i / 18, 130 - 46 * math.sin(2 * math.pi * 2.2 * i / 18), c=SIG, lw=1.2))
    for i in range(19)
] + [
    W(60, 130, 780, 130, c=LIN, lw=1.2),
    T(420, 196, "格子点上の値 Eᵢⁿ だけを保持する", "middle", 11, SIG, True),
    DARR(60, 214, 100, 214, MUT, 1.3, 5), T(80, 232, "Δx", "middle", 10.5, INK, True),
    RECT(150, 246, 540, 46, 8, SSOFT, SIG, 1.4),
    T(420, 266, "DSP のサンプリングと同じ話 —— ただし空間 3 軸 + 時間軸の 4 次元", "middle", 11, INK, True),
    T(420, 284, "実用には波長あたり 10〜20 点が要る（ナイキストの 2 点では全く足りない）", "middle", 10, MUT),
], "「何点で表すか」がすべてを決める。多いほど正確だが、3 次元では点数が 3 乗で効く")

F["e04_stagger"] = SVG(840, 300, [
    T(420, 26, "中心差分 — 偶数次の誤差項が打ち消える", "middle", 12.5, INK, True),
    RECT(24, 52, 390, 150, 10, SCR, LIN, 1.3),
    T(219, 76, "前進差分", "middle", 11.5, MUT, True),
    D(120, 140, MUT, 5), D(280, 140, MUT, 5),
    T(120, 162, "uᵢ", "middle", 10, MUT), T(280, 162, "uᵢ₊₁", "middle", 10, MUT),
    W(120, 140, 280, 140, c=MUT, lw=1.4),
    T(200, 122, "微分を評価する点はここではない", "middle", 9, FNT),
    D(200, 140, ALI, 4),
    T(219, 188, "誤差 ∝ Δx（1 次精度）", "middle", 11, ALI, True),

    RECT(426, 52, 390, 150, 10, SCR, LIN, 1.3),
    T(621, 76, "中心差分", "middle", 11.5, SIG, True),
    D(500, 140, MUT, 5), D(660, 140, MUT, 5), D(580, 140, SIG, 6),
    T(500, 162, "uᵢ₋₁", "middle", 10, MUT), T(660, 162, "uᵢ₊₁", "middle", 10, MUT),
    T(580, 118, "ここを評価", "middle", 9.5, SIG, True),
    W(500, 140, 660, 140, c=SIG, lw=1.4),
    T(621, 188, "誤差 ∝ Δx²（2 次精度）", "middle", 11, SIG, True),

    RECT(24, 216, 792, 70, 8, SSOFT, SIG, 1.4),
    T(420, 238, "(uᵢ₊₁ − uᵢ₋₁)/2Δx = u′ + (Δx²/6)u‴ + …   ← u″ の項が消える", "middle", 11.5, INK, True, True),
    T(420, 260, "同じ手間で精度が 1 桁良い。だからセルを半分にすると誤差は 1/4 になる", "middle", 10.5, MUT),
    T(420, 278, "この「両側に値が要る」という要求が、Yee 格子のずらし配置を生む（05 章）", "middle", 10, SIG),
], "FDTD も FEM（1 次要素）も基本は 2 次精度。ここが崩れると（曲面の階段近似など）精度が落ちる")

F["e04_error"] = SVG(840, 320, [
    T(420, 26, "位相誤差は距離とともに積み上がる", "middle", 12.5, INK, True),
    AXES(80, 230, 660, 170, "伝搬距離（波長数）", "位相誤差"),
] + [
    PL([(80 + 660 * u, 230 - u * 165 * s) for u in [i / 60 for i in range(61)]], c, 2.2)
    for s, c in ((1.0, ALI), (0.25, SIG), (0.0625, GRN))
] + [
    T(746, 62, "5 セル/λ", "start", 10.5, ALI, True),
    T(746, 192, "10 セル/λ", "start", 10.5, SIG, True),
    T(746, 224, "20 セル/λ", "start", 10.5, GRN, True),
    RECT(90, 252, 660, 56, 8, SCR, LIN, 1.3),
    T(420, 274, "1 波長ぶんの誤差が小さくても、長い距離を伝わるほど比例して溜まる", "middle", 11, INK, True),
    T(420, 294, "→ 必要なセル数は「構造が電気的に何波長あるか」で決まる（大きい構造ほど多く要る）", "middle", 10, MUT),
], "小さな部品なら 10〜15 セル/λ で足りるが、数十波長の構造では 20〜30 が要る。06 章の数値分散の正体である")

F["e04_cost"] = SVG(840, 300, [
    T(420, 26, "セルを半分にすると、何が起きるか", "middle", 12.5, INK, True),
    flowright(30, 96, [("1 辺のセル数", "×2", LIN, PAN),
                       ("3D の総セル数", "×8", SIG, SSOFT),
                       ("メモリ", "×8", SIG, SSOFT),
                       ("Δt（クーラン）", "×1/2", ALI, ASOFT),
                       ("総計算時間", "×16", ALI, ASOFT)], 140, 60, 20)[0],
    RECT(30, 168, 780, 60, 8, ASOFT, ALI, 1.4),
    T(420, 190, "精度を 4 倍にするために、計算を 16 倍する", "middle", 12, INK, True),
    T(420, 212, "（誤差は Δx² なのでセル半分で 1/4、計算時間は 3 次元 8 倍 × ステップ数 2 倍）", "middle", 10, MUT),
    RECT(30, 244, 780, 46, 8, SSOFT, SIG, 1.4),
    T(420, 264, "だから「一律に細かく」は最も高くつく —— 必要なところだけ細かくする", "middle", 11, INK, True),
    T(420, 282, "局所細分化・適応メッシュ（07・10 章）が決定的に重要になる理由がこれである", "middle", 10, MUT),
], "周波数領域ソルバでも事情は同じ。未知数 N に対して直接解法は O(N³)——さらに厳しい")

F["e04_cost2"] = SVG(860, 280, [
    T(430, 26, "何を離散化するか — 3 つの流儀", "middle", 12.5, INK, True),
    BOX(24, 56, 262, 92, "微分を差分に置き換える", "未知数 = 格子点上の場の値\n直交格子\n→ FDTD（05 章）", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(300, 56, 262, 92, "積分形を面と辺に載せる", "未知数 = 面の磁束・辺の電圧\n直交格子（デュアル格子）\n→ FIT", GRN, PAN, INK, 8, 1.5, 12, 9.5),
    BOX(576, 56, 262, 92, "関数を基底で展開する", "未知数 = 基底関数の係数\n任意形状の要素\n→ FEM・MoM（07・08 章）", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(200, 172, 460, 50, "E(r) ≈ Σ cₙ φₙ(r)", "3 番目が最も強力 —— 曲面を階段で近似しなくて済む",
        SIG, SSOFT, INK, 8, 1.6, 14, 9.5, None, True),
    T(430, 254, "同じマクスウェル方程式を、どう有限個の数に落とすか。その選択が手法の名前になる",
      "middle", 11, MUT),
], "第 II 部では、この 3 つの流儀を順に開けていく。それぞれ得意な問題が違う")

# ===================== 05. FDTD =====================

F["e05_leapfrog"] = SVG(840, 300, [
    T(420, 26, "蛙飛び（leapfrog）— E と H を交互に更新する", "middle", 12.5, INK, True),
    W(60, 150, 790, 150, c=LIN, lw=1.4),
    ARR(770, 150, 800, 150, MUT, 1.4), T(800, 172, "t", "middle", 10, MUT, True),
] + [
    (D(110 + i * 160, 150, SIG, 6) + T(110 + i * 160, 128, "E", "middle", 12, SIG, True)
     + T(110 + i * 160, 176, "n=%d" % i, "middle", 9, FNT))
    for i in range(5)
] + [
    (D(190 + i * 160, 150, GRN, 6) + T(190 + i * 160, 128, "H", "middle", 12, GRN, True)
     + T(190 + i * 160, 176, "n+½", "middle", 9, FNT))
    for i in range(4)
] + [
    '<path d="M %g 140 Q %g 96 %g 140" fill="none" stroke="%s" stroke-width="1.6"/>'
    % (110 + i * 160, 150 + i * 160, 190 + i * 160, SIG) for i in range(4)
] + [
    '<path d="M %g 160 Q %g 204 %g 160" fill="none" stroke="%s" stroke-width="1.6"/>'
    % (190 + i * 160, 230 + i * 160, 270 + i * 160, GRN) for i in range(4)
] + [
    RECT(90, 218, 660, 66, 8, SSOFT, SIG, 1.4),
    T(420, 240, "E が H を更新し、H が E を更新する —— 行列も連立方程式も出てこない", "middle", 11.5, INK, True),
    T(420, 262, "各ステップは「隣のセルとの引き算」だけ。だから O(N)・並列化が容易・大規模に強い",
      "middle", 10.5, MUT),
], "マクスウェル方程式の回転 2 本が互いを餌にしている構造を、そのまま計算手順にしたのが FDTD である")

F["e05_yee"] = SVG(860, 330, [
    T(430, 26, "1 次元の Yee 配置 — すべてを中心差分にするために", "middle", 12.5, INK, True),
    # 空間軸
    W(70, 200, 800, 200, c=LIN, lw=1.4),
] + [
    (D(110 + i * 160, 200, SIG, 6) + T(110 + i * 160, 224, "Eᶻ", "middle", 12, SIG, True)
     + T(110 + i * 160, 244, "i=%d" % i, "middle", 9, FNT))
    for i in range(5)
] + [
    (CROSS(190 + i * 160, 200, 7, GRN, 1.6) + T(190 + i * 160, 176, "Hʸ", "middle", 12, GRN, True)
     + T(190 + i * 160, 156, "i+½", "middle", 9, FNT))
    for i in range(4)
] + [
    T(70, 174, "空間", "end", 10, MUT, True),
    RECT(30, 60, 380, 76, 8, SSOFT, SIG, 1.4),
    T(220, 82, "E は 整数点 i・整数時刻 n", "middle", 11, SIG, True),
    T(220, 104, "H は 半整数点 i+½・半整数時刻 n+½", "middle", 11, GRN, True),
    T(220, 126, "空間で半セル、時間で半ステップずらす", "middle", 10, MUT),
    RECT(450, 60, 380, 76, 8, SCR, LIN, 1.3),
    T(640, 82, "なぜずらすのか", "middle", 11, INK, True),
    T(640, 104, "微分を評価したい点の「両側」に値が来る", "middle", 10, MUT),
    T(640, 126, "→ すべてが中心差分（2 次精度、04 章）", "middle", 10.5, SIG, True),
    RECT(70, 268, 730, 48, 8, ASOFT, ALI, 1.4),
    T(435, 288, "「隣り合う E の差が、その間の H を変える」——回転がそのまま「隣との差」になっている",
      "middle", 11, INK, True),
    T(435, 308, "材料はセルごとに係数を変えるだけ。誘電体を置くのに特別な処理は要らない", "middle", 10, MUT),
], "×印は紙面奥向きの磁界を表す。この 1 次元の配置を 3 次元に拡張したものが Yee セルである")

F["e05_update"] = SVG(860, 300, [
    T(430, 26, "更新式 — これで FDTD は完成する", "middle", 12.5, INK, True),
    BOX(40, 56, 780, 62, "H(i+½)ⁿ⁺½ = H(i+½)ⁿ⁻½ − (Δt / μΔx) · [ E(i+1)ⁿ − E(i)ⁿ ]",
        "磁界の更新: 隣り合う E の差で決まる", GRN, PAN, INK, 8, 1.6, 13.5, 9.5, None, True),
    BOX(40, 134, 780, 62, "E(i)ⁿ⁺¹ = E(i)ⁿ − (Δt / εΔx) · [ H(i+½)ⁿ⁺½ − H(i−½)ⁿ⁺½ ]",
        "電界の更新: 隣り合う H の差で決まる", SIG, SSOFT, INK, 8, 1.6, 13.5, 9.5, None, True),
    ARR(430, 118, 430, 130, MUT, 1.5),
    RECT(40, 212, 780, 76, 8, SCR, LIN, 1.3),
    T(430, 234, "この 2 行を交互にループで回すだけで、電磁波が計算機の中を伝わる", "middle", 11.5, INK, True),
    T(430, 256, "係数 Δt/(μΔx)、Δt/(εΔx) の中に材料定数が入る", "middle", 10.5, MUT),
    T(430, 276, "→ セルごとに係数を変えれば、任意の不均質媒質が扱える", "middle", 10.5, SIG, True),
], "損失（σ）を入れると係数が 2 つになるが、構造は同じ。時間平均を使って無条件安定にする")

F["e05_3d"] = SVG(860, 330, [
    T(430, 26, "3 次元の Yee セル — 電界は辺に、磁界は面に", "middle", 12.5, INK, True),
    # 立方体（等角投影風）
] + [
    # 前面
    W(180, 120, 380, 120, 380, 260, 180, 260, 180, 120, c=LIN, lw=1.6),
    # 奥面
    W(260, 76, 460, 76, 460, 216, 260, 216, 260, 76, c=LIN, lw=1.2, dash="4 4"),
    W(180, 120, 260, 76, c=LIN, lw=1.2), W(380, 120, 460, 76, c=LIN, lw=1.2),
    W(380, 260, 460, 216, c=LIN, lw=1.2), W(180, 260, 260, 216, c=LIN, lw=1.2, dash="4 4"),
    # 辺上の電界
    ARR(240, 120, 320, 120, SIG, 2), T(280, 110, "Ex", "middle", 10.5, SIG, True),
    ARR(180, 214, 180, 156, SIG, 2), T(166, 148, "Ez", "middle", 10.5, SIG, True),
    ARR(380, 190, 420, 168, SIG, 2), T(414, 194, "Ey", "middle", 10.5, SIG, True),
    # 面中心の磁界
    CROSS(280, 190, 8, GRN, 1.8), T(280, 214, "Hz（面の中心）", "middle", 10, GRN, True),
    ARR(180, 190, 140, 190, GRN, 2), T(126, 186, "Hx", "middle", 10.5, GRN, True),
    RECT(500, 66, 336, 200, 8, SSOFT, SIG, 1.4),
    T(668, 90, "この配置の意味", "middle", 11.5, INK, True),
    T(668, 116, "Hx を更新するのに要る 4 本の電界は", "middle", 10, MUT),
    T(668, 136, "ちょうどその面を囲む 4 辺に載っている", "middle", 10.5, SIG, True),
    T(668, 162, "→ 面の周りを 1 周足すと磁束の変化になる", "middle", 10, MUT),
    T(668, 182, "＝ 積分形のファラデーの法則そのもの", "middle", 10.5, INK, True),
    T(668, 212, "∇·B = 0 が数値的にも厳密に保たれる", "middle", 10.5, GRN, True),
    T(668, 234, "（磁束が数値誤差で湧き出さない）", "middle", 9.5, FNT),
    RECT(60, 286, 776, 34, 6, SCR, LIN, 1.3),
    T(448, 308, "Yee 格子が 60 年経っても現役なのは、この構造的な正しさによる", "middle", 11, INK, True),
], "電界は 1-形式（線に沿って積分する量）、磁界は 2-形式（面を貫く量）——微分幾何の構造が背後にある")

F["e05_1d"] = SVG(880, 300, [
    T(440, 26, "FDTD のアルゴリズム", "middle", 12.5, INK, True),
    flowdown(300, 50, [
        ("格子・材料係数を用意", None, LIN, PAN),
        ("H を半ステップ更新", None, GRN, PAN),
        ("境界条件（PML など、11 章）", None, LIN, PAN),
        ("E を 1 ステップ更新", None, SIG, SSOFT),
        ("励振を加える（12 章）", None, LIN, PAN),
        ("出力点の値を記録", None, LIN, PAN),
    ], 320, 34, 8)[0],
    W(140, 118, 118, 118, c=MUT, lw=1.4), W(118, 118, 118, 288, c=MUT, lw=1.4),
    W(118, 288, 300, 288, c=MUT, lw=1.4), ARR(300, 288, 300, 268, MUT, 1.5),
    T(112, 210, "繰り返し", "end", 10, MUT, True),
    BOX(560, 96, 290, 58, "記録した時間波形を FFT", "1 回の計算で広帯域の特性が出る（16 章）", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(466, 172, 556, 138, MUT, 1.6),
    RECT(560, 176, 290, 96, 8, SCR, LIN, 1.3),
    T(705, 198, "FDTD の強み", "middle", 11, INK, True),
    T(705, 222, "計算量・メモリが O(N)", "middle", 10, MUT),
    T(705, 242, "隣としかやり取りしない → 並列化容易", "middle", 10, MUT),
    T(705, 262, "1 回で広帯域", "middle", 10, MUT),
], "終了条件はエネルギーの減衰（13 章）。十分減衰する前に切ると FFT の結果が汚れる")

# ===================== 06. FDTD の限界 =====================

F["e06_courant"] = SVG(860, 320, [
    T(430, 26, "クーラン条件 — 1 ステップで 1 セル以上進めない", "middle", 12.5, INK, True),
    RECT(30, 54, 390, 176, 10, SSOFT, GRN, 1.4),
    T(225, 78, "S ≤ 1（安定）", "middle", 12, GRN, True),
    GRID(60, 96, 330, 66, 5, 2, LIN, 0.9),
    ARR(126, 129, 186, 129, GRN, 2.2),
    T(156, 116, "1 ステップ", "middle", 9, FNT),
    T(225, 186, "波は 1 セル以内に留まる", "middle", 10.5, MUT),
    T(225, 208, "隣の情報だけで計算できる", "middle", 10.5, GRN, True),

    RECT(440, 54, 390, 176, 10, ASOFT, ALI, 1.4),
    T(635, 78, "S > 1（発散）", "middle", 12, ALI, True),
    GRID(470, 96, 330, 66, 5, 2, LIN, 0.9),
    ARR(536, 129, 728, 129, ALI, 2.2),
    T(632, 116, "1 ステップ", "middle", 9, FNT),
    T(635, 186, "情報が届いていない場所の値を使う", "middle", 10.5, MUT),
    T(635, 208, "→ 因果関係が壊れ、数十ステップで爆発", "middle", 10.5, ALI, True),

    BOX(140, 246, 580, 60, "c Δt ≤ 1 / √( 1/Δx² + 1/Δy² + 1/Δz² )",
        "立方体セルなら c Δt ≤ Δx/√3。S = cΔt/Δx がクーラン数",
        SIG, SSOFT, INK, 8, 1.7, 14, 9.5, None, True),
], "導出は「平面波を代入して増幅率 q を求め、|q| ≤ 1 を課す」だけ。フォン・ノイマンの安定性解析である")

F["e06_grid"] = SVG(860, 300, [
    T(430, 26, "最小セルの呪い — 1 箇所の細かさが全体を支配する", "middle", 12.5, INK, True),
    GRID(40, 56, 500, 130, 10, 3, LIN, 0.8),
    GRID(300, 82, 60, 52, 12, 10, ALI, 0.7),
    RECT(300, 82, 60, 52, 0, "none", ALI, 2),
    T(330, 200, "細い配線のために\nここだけ 10 µm", "middle", 9.5, ALI, True),
    T(330, 216, "", "middle", 9.5, ALI),
    T(150, 200, "他は 1 mm で十分", "middle", 9.5, MUT),
    ARR(560, 120, 600, 120, ALI, 1.8),
    RECT(614, 56, 216, 130, 8, ASOFT, ALI, 1.4),
    T(722, 80, "Δt は最小セルで決まる", "middle", 11, ALI, True),
    T(722, 108, "1 mm → 1.9 ps", "middle", 10, MUT),
    T(722, 130, "100 µm → 190 fs", "middle", 10, MUT),
    T(722, 152, "10 µm → 19 fs", "middle", 10.5, ALI, True),
    T(722, 174, "ステップ数が 100 倍", "middle", 10, ALI, True),
    RECT(40, 214, 790, 74, 8, SCR, LIN, 1.3),
    T(435, 236, "対策: サブグリッド／非一様格子（隣接比 1.5 以内）／陰解法", "middle", 11, INK, True),
    T(435, 258, "だが最も効くのは「なぜこのセルが小さいのか」を問い直すこと", "middle", 11, SIG, True),
    T(435, 278, "等価モデルへの置換（10 章）・モデル簡略化（20 章）が最大の高速化である", "middle", 10, MUT),
], "「ちょっと細かくしただけ」で計算が数日になるのはこの仕組みによる。細分化には常に理由が要る")

F["e06_dispersion"] = SVG(860, 320, [
    T(430, 26, "数値分散 — 波の速度が離散化のせいで狂う", "middle", 12.5, INK, True),
    AXES(80, 210, 400, 150, "波数 k", "位相速度"),
    W(80, 90, 480, 90, c=GRN, lw=2, dash="6 4"),
    T(486, 94, "真の速度 c", "start", 10, GRN, True),
    PL([(80 + 400 * u, 90 + 100 * u * u) for u in [i / 60 for i in range(61)]], SIG, 2.2),
    T(300, 170, "離散化された速度", "middle", 10.5, SIG, True),
    T(300, 232, "高い周波数ほど遅くなる", "middle", 10, MUT),
    RECT(540, 60, 296, 158, 8, SCR, LIN, 1.3),
    T(688, 84, "2 つの厄介な性質", "middle", 11.5, INK, True),
    T(688, 112, "① 周波数依存", "middle", 10.5, SIG, True),
    T(688, 132, "パルスが伝わるうちに崩れて尾を引く", "middle", 9.5, MUT),
    T(688, 160, "② 方向依存（異方性）", "middle", 10.5, SIG, True),
    T(688, 180, "軸方向と対角方向で速度が違う", "middle", 9.5, MUT),
    T(688, 202, "→ 円形に広がる波がわずかに歪む", "middle", 9.5, MUT),
    RECT(80, 240, 756, 66, 8, SSOFT, SIG, 1.4),
    T(458, 262, "意外な事実: 対角方向のほうが誤差が小さい。S = 1/√3 で対角の分散はゼロになる",
      "middle", 11, INK, True),
    T(458, 284, "→ クーラン数は安定限界ギリギリ（0.95〜0.99 倍）が得。速くなるうえ分散も小さい",
      "middle", 10.5, MUT),
], "対策は結局セル/波長を増やすこと。高次差分の FDTD もあるが境界処理が複雑で商用では一般的でない")

F["e06_stair"] = SVG(860, 320, [
    T(430, 26, "階段近似 — 直交格子の宿命", "middle", 12.5, INK, True),
    RECT(30, 52, 390, 190, 10, SCR, LIN, 1.3),
    T(225, 76, "階段近似", "middle", 11.5, ALI, True),
    GRID(70, 92, 300, 120, 10, 4, LIN, 0.8),
] + [
    RECT(70 + 30 * i, 92 + 30 * max(0, min(3, int(i * 0.42))), 30,
         120 - 30 * max(0, min(3, int(i * 0.42))), 0, ASOFT, "none", 0)
    for i in range(10)
] + [
    PL([(70 + 300 * u, 92 + 120 * (u ** 1.6)) for u in [i / 40 for i in range(41)]], GRN, 2.2),
    T(225, 228, "本来の曲面（曲線）と、セルで刻んだ階段（塗り）", "middle", 9.5, MUT),

    RECT(440, 52, 390, 190, 10, SCR, LIN, 1.3),
    T(635, 76, "症状", "middle", 11.5, INK, True),
    T(635, 106, "共振周波数のずれ（実効寸法が変わる）", "middle", 10, MUT),
    T(635, 132, "階段の角に偽の電界集中・散乱", "middle", 10, MUT),
    T(635, 158, "収束が Δx² から Δx へ落ちる", "middle", 10.5, ALI, True),
    T(635, 180, "＝ せっかくの 2 次精度が 1 次になる", "middle", 9.5, ALI),
    T(635, 212, "対策: 適合メッシュ（conformal / PBA）", "middle", 10.5, GRN, True),
    RECT(30, 256, 800, 50, 8, SSOFT, SIG, 1.4),
    T(430, 276, "セルが境界で切られている割合に応じて更新式の係数を補正し、2 次精度を回復する",
      "middle", 11, INK, True),
    T(430, 296, "曲面が主役なら、そもそも FEM（四面体）を選ぶほうが速い（09 章）", "middle", 10, MUT),
], "商用ソルバではほぼ標準搭載だが、有効になっているかは確認する価値がある")

# ===================== 07. FEM =====================

F["e07_weak"] = SVG(860, 320, [
    T(430, 26, "弱形式 — 何を「弱める」のか", "middle", 12.5, INK, True),
    BOX(30, 56, 370, 70, "強形式", "各点で方程式が厳密に成り立つことを要求\n→ 解に 2 階微分可能性が要る",
        ALI, ASOFT, INK, 8, 1.5, 12.5, 9.5),
    ARR(410, 91, 450, 91, MUT, 1.8), T(430, 78, "弱める", "middle", 9.5, FNT),
    BOX(460, 56, 370, 70, "弱形式", "任意の試験関数と掛けて積分したときに成立\n∫ W·R dV = 0",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(150, 146, 560, 56, "部分積分（グリーンの定理）を適用する", None, GRN, PAN, INK, 8, 1.5, 12.5),
    ARR(430, 126, 430, 142, MUT, 1.5),
    ARR(300, 202, 240, 226, MUT, 1.5), ARR(560, 202, 620, 226, MUT, 1.5),
    BOX(30, 230, 380, 74, "① 微分の階数が下がる", "E と W が 1 階ずつ微分されるだけになる\n→ 1 次多項式のような単純な基底が使える",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(450, 230, 380, 74, "② 境界条件が式に現れる", "面積分に n̂×∇×E ∝ n̂×H が出る\n→ ポート励振・吸収境界をここに書き込める",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
], "「各点で厳密」を「積分で平均的に」に緩める。その副産物として境界条件が自然に入るのが FEM の設計思想である")

F["e07_basis"] = SVG(860, 330, [
    T(430, 26, "辺要素 — 電磁界で節点を使ってはいけない理由", "middle", 12.5, INK, True),
    RECT(30, 52, 390, 200, 10, ASOFT, ALI, 1.4),
    T(225, 76, "節点要素（使うと失敗する）", "middle", 11.5, ALI, True),
    TRI([(120, 210), (330, 210), (225, 104)], MUT, 1.6, SCR),
    D(120, 210, ALI, 6), D(330, 210, ALI, 6), D(225, 104, ALI, 6),
    T(225, 238, "未知数を頂点に置く", "middle", 10, MUT),

    RECT(440, 52, 390, 200, 10, SSOFT, SIG, 1.4),
    T(635, 76, "辺要素（Whitney 要素）", "middle", 11.5, SIG, True),
    TRI([(530, 210), (740, 210), (635, 104)], MUT, 1.6, SCR),
    ARR(546, 210, 724, 210, SIG, 2.2),
    ARR(732, 200, 648, 112, SIG, 2.2),
    ARR(622, 112, 538, 200, SIG, 2.2),
    T(635, 238, "未知数は「辺に沿った電界の線積分」", "middle", 10, SIG, True),
    RECT(30, 264, 800, 58, 8, SCR, LIN, 1.3),
    T(430, 286, "節点だと: 発散条件が課せず偽の解（スプリアス）が出る／3 成分すべてを連続にしてしまう",
      "middle", 10.5, ALI, True),
    T(430, 308, "辺要素なら: 接線成分だけ連続（材料境界を正しく表現）・∇·N = 0 が構造的に成立",
      "middle", 10.5, SIG, True),
], "05 章の Yee 格子も電界を辺に置いていた。「電界は辺に住む」という原理は手法を超えて共通している")

F["e07_matrix"] = SVG(860, 300, [
    T(430, 26, "ガラーキン法 — 疎行列の連立方程式へ", "middle", 12.5, INK, True),
    BOX(40, 56, 360, 56, "E(r) ≈ Σ xₙ Nₙ(r)", "基底関数で展開し、係数を未知数にする", LIN, PAN, INK, 8, 1.4, 13, 9.5, None, True),
    ARR(410, 84, 450, 84, MUT, 1.6),
    BOX(460, 56, 370, 56, "試験関数 = 基底関数（ガラーキン）", None, LIN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(240, 128, 380, 54, "(S − k₀² T) x = b", None, SIG, SSOFT, INK, 8, 1.8, 16, 10, None, True),
    ARR(430, 112, 430, 124, MUT, 1.5),
    # 疎行列の絵
    GRID(60, 200, 100, 80, 8, 8, LIN, 0.6),
] + [
    RECT(60 + 12.5 * i, 200 + 10 * j, 12.5, 10, 0, SSOFT, "none", 0)
    for i in range(8) for j in range(8) if abs(i - j) <= 1
] + [
    T(110, 294, "疎行列", "middle", 10, SIG, True),
    RECT(200, 196, 630, 88, 8, SCR, LIN, 1.3),
    T(515, 218, "行列の性質が実務を決める", "middle", 11, INK, True),
    T(515, 242, "疎（基底は局所的）→ メモリ O(N)　／　対称（相反媒質なら）", "middle", 10, MUT),
    T(515, 266, "k₀² を含む → 周波数ごとに解き直し。だから高速掃引（有理関数補間）がある", "middle", 10.5, ALI, True),
], "FEM の最大の弱点は「1 周波数 1 回」。共振が鋭い帯域では補間が外れるので、疑わしければ離散点で検算する")

F["e07_adaptive"] = SVG(860, 300, [
    T(430, 26, "適応メッシュ — FEM 最大の武器", "middle", 12.5, INK, True),
    flowright(24, 100, [("粗いメッシュで解く", None, LIN, PAN),
                        ("誤差推定", "どこが怪しいか", SIG, SSOFT),
                        ("怪しい要素だけ細分化", None, SIG, SSOFT),
                        ("解き直す", None, LIN, PAN),
                        ("ΔS < 閾値？", "満たせば終了", GRN, PAN)], 148, 62, 20)[0],
    W(806, 132, 806, 168, c=MUT, lw=1.4), W(806, 168, 190, 168, c=MUT, lw=1.4),
    ARR(190, 168, 190, 134, MUT, 1.5),
    T(500, 188, "満たさなければ繰り返す", "middle", 9.5, FNT),
    RECT(40, 206, 780, 80, 8, SSOFT, SIG, 1.4),
    T(430, 228, "04 章の「一律細分化は最も高い」への直接の回答 —— 場が急変する場所だけが自動で細かくなる",
      "middle", 11, INK, True),
    T(430, 252, "停止条件（ΔS < 0.02 を 2 回連続など）が、そのままメッシュ収束の判定になる（13 章）",
      "middle", 10.5, MUT),
    T(430, 274, "ただし「収束した」は「メッシュに対して安定」であって、モデルが正しい保証ではない",
      "middle", 10.5, ALI, True),
], "FDTD では人間がメッシュを設計するが、FEM ではソルバが自動で最適化できる。これが大きな実務差になる")

# ===================== 08. MoM =====================

F["e08_surface"] = SVG(860, 320, [
    T(430, 26, "発想の転換 — 場ではなく、表面電流を未知数にする", "middle", 12.5, INK, True),
    RECT(30, 52, 390, 190, 10, SCR, LIN, 1.3),
    T(225, 76, "FDTD / FEM", "middle", 11.5, MUT, True),
    GRID(70, 94, 310, 116, 13, 5, LIN, 0.7),
    RECT(180, 118, 90, 68, 3, SSOFT, INK, 1.8),
    T(225, 156, "導体", "middle", 10, INK, True),
    T(225, 228, "空気も全部メッシュする", "middle", 10.5, MUT),

    RECT(440, 52, 390, 190, 10, SCR, LIN, 1.3),
    T(635, 76, "MoM", "middle", 11.5, SIG, True),
    RECT(590, 118, 90, 68, 3, PAN, INK, 1.8),
    T(635, 156, "導体", "middle", 10, INK, True),
] + [
    ARR(590 + 18 * i, 114, 590 + 18 * i + 12, 114, SIG, 1.6, 4) for i in range(5)
] + [
    ARR(590 + 18 * i, 190, 590 + 18 * i + 12, 190, SIG, 1.6, 4) for i in range(5)
] + [
    T(635, 228, "表面電流だけが未知数。空気は刻まない", "middle", 10.5, SIG, True),
    RECT(30, 256, 800, 56, 8, SSOFT, SIG, 1.4),
    T(430, 278, "「空気の中で何が起きるかは既に分かっている。分からないのは表面の電流だけ」",
      "middle", 11.5, INK, True),
    T(430, 300, "未知数が体積から表面へ落ちる。しかも吸収境界（11 章）が要らない", "middle", 10.5, MUT),
], "アンテナのように「小さい導体が広い空間に浮いている」問題では、未知数の数が桁違いに減る")

F["e08_green"] = SVG(860, 300, [
    T(430, 26, "グリーン関数 — 点源が作る場を知っている", "middle", 12.5, INK, True),
    D(200, 132, ALI, 7),
    T(200, 112, "点源 r′", "middle", 10.5, ALI, True),
] + [
    CIRC(200, 132, r, SIG, 1.4 - i * 0.25, "none", "5 4") for i, r in enumerate((32, 56, 78))
] + [
    D(360, 96, GRN, 6), T(376, 92, "観測点 r", "start", 10.5, GRN, True),
    W(200, 132, 360, 96, c=MUT, lw=1.2, dash="3 4"),
    T(284, 106, "|r − r′|", "middle", 9.5, FNT),
    BOX(450, 74, 380, 62, "G = e^(−jk|r−r′|) / (4π|r−r′|)", None, SIG, SSOFT, INK, 8, 1.7, 14, 10, None, True),
    T(640, 156, "分子 = 位相の遅れ（距離ぶん遅れて届く）", "middle", 10, MUT),
    T(640, 178, "分母 = 距離による減衰（1/R）", "middle", 10, MUT),
    RECT(60, 216, 770, 70, 8, ASOFT, ALI, 1.4),
    T(445, 238, "グリーン関数は「無限遠で外向きに進む」放射条件を最初から満たしている", "middle", 11.5, INK, True),
    T(445, 262, "→ MoM の解は自動的に正しい放射場になる。FDTD/FEM が PML で苦労して作る条件がただで手に入る",
      "middle", 10.5, MUT),
], "任意の電流分布が作る場は、点源の寄与を足し合わせるだけで得られる。これが「空気を刻まなくてよい」根拠である")

F["e08_matrix"] = SVG(860, 348, [
    T(430, 26, "積分方程式から行列方程式へ", "middle", 12.5, INK, True),
    flowdown(280, 50, [
        ("境界条件: 導体表面で E の接線 = 0", None, LIN, PAN),
        ("散乱界を未知電流 J で表す（グリーン関数）", "→ J が積分の中に入る = 積分方程式", LIN, PAN),
        ("J を基底関数で展開（RWG）", None, LIN, PAN),
        ("試験関数と内積を取る（モーメントを取る）", None, SIG, SSOFT),
    ], 460, 44, 16)[0],
    BOX(580, 96, 250, 58, "Z I = V", None, SIG, SSOFT, INK, 8, 1.8, 18, 10, None, True),
    ARR(516, 160, 574, 132, MUT, 1.6),
    RECT(580, 170, 250, 100, 8, SCR, LIN, 1.3),
    T(705, 192, "オームの法則の形", "middle", 11, INK, True),
    T(705, 216, "Z = 相互インピーダンス行列", "middle", 10, MUT),
    T(705, 236, "I = 各基底の電流", "middle", 10, MUT),
    T(705, 256, "V = 入射波・給電の起電力", "middle", 10, MUT),
    RECT(30, 292, 800, 46, 8, ASOFT, ALI, 1.4),
    T(430, 311, "ただし Z は密行列 —— すべての基底がすべてと相互作用する", "middle", 10.5, INK, True),
    T(430, 329, "メモリ O(N²)、直接解法 O(N³)。ここが MoM の限界だった", "middle", 9.5, MUT),
], "RWG 基底関数は隣り合う 2 つの三角形にまたがり、共有辺を横切る電流の連続性を保証する——ここでも未知数は辺に住む")

F["e08_mlfmm"] = SVG(860, 320, [
    T(430, 26, "MLFMA — 遠い相互作用をまとめる", "middle", 12.5, INK, True),
    RECT(30, 54, 390, 180, 10, ASOFT, ALI, 1.4),
    T(225, 78, "素朴な MoM: 全対全", "middle", 11.5, ALI, True),
] + [
    D(110 + (i % 4) * 60, 116 + (i // 4) * 46, MUT, 4) for i in range(12)
] + [
    W(110 + (i % 4) * 60, 116 + (i // 4) * 46, 110 + (j % 4) * 60, 116 + (j // 4) * 46, c=ALI, lw=0.5)
    for i in range(12) for j in range(i + 1, 12)
] + [
    T(225, 216, "O(N²) の相互作用", "middle", 10.5, ALI, True),

    RECT(440, 54, 390, 180, 10, SSOFT, SIG, 1.4),
    T(635, 78, "MLFMA: 箱にまとめる", "middle", 11.5, SIG, True),
    RECT(500, 100, 110, 46, 4, SCR, SIG, 1.4),
    RECT(670, 100, 110, 46, 4, SCR, SIG, 1.4),
    RECT(500, 160, 110, 46, 4, SCR, SIG, 1.4),
    RECT(670, 160, 110, 46, 4, SCR, SIG, 1.4),
] + [
    D(520 + (i % 3) * 30, 116 + (i // 3) * 20, MUT, 3.4) for i in range(6)
] + [
    D(690 + (i % 3) * 30, 116 + (i // 3) * 20, MUT, 3.4) for i in range(6)
] + [
    ARR(614, 123, 666, 123, SIG, 2.4),
    T(640, 110, "1 回", "middle", 9, SIG, True),
    T(635, 216, "箱と箱の相互作用に集約 → O(N log N)", "middle", 10.5, SIG, True),
    RECT(30, 248, 800, 60, 8, SCR, LIN, 1.3),
    T(430, 270, "近い箱は厳密に、遠い箱は多重極展開でまとめて —— 天体力学の N 体問題と同じ発想",
      "middle", 11, INK, True),
    T(430, 292, "これにより航空機の RCS・車両全体の EMC など、波長の数百倍の構造が現実的になった",
      "middle", 10, MUT),
], "集約（aggregation）→ 変換（translation）→ 展開（disaggregation）の 3 段で、遠距離相互作用を階層的に処理する")

# ===================== 09. 解法の選び方 =====================

F["e09_map"] = SVG(860, 340, [
    T(430, 26, "5 つの質問で手法が絞れる", "middle", 12.5, INK, True),
] + [
    BOX(30, 54 + i * 54, 400, 44, q, None, LIN, SCR, INK, 7, 1.3, 11.5)
    for i, q in enumerate([
        "Q1. 広い帯域か、1 点の高精度か",
        "Q2. 導体主体か、誘電体が詰まっているか",
        "Q3. 直方体・層構造か、曲面が主役か",
        "Q4. 開放領域（放射）か、閉じた構造か",
        "Q5. 電気的な大きさは何波長か"])
] + [
    BOX(470, 54 + i * 54, 360, 44, a, None, c, f, INK, 7, 1.3, 11)
    for i, (a, c, f) in enumerate([
        ("広帯域→時間領域 ／ 狭帯域→周波数領域", SIG, SSOFT),
        ("導体→MoM ／ 誘電体→FDTD・FEM", SIG, SSOFT),
        ("直方体→FDTD ／ 曲面→FEM", SIG, SSOFT),
        ("開放→MoM が有利 ／ 閉領域→FEM が有利", GRN, PAN),
        ("数十波長以上→FDTD or MoM+MLFMA", GRN, PAN)])
] + [
    ARR(434, 76 + i * 54, 466, 76 + i * 54, MUT, 1.4, 5) for i in range(5)
] + [
    T(430, 330, "「どれが一番よいか」という問いには答えがない。問題の形が手法を決める",
      "middle", 11, INK, True),
], "複数の答えが競合したら、優先順位は Q1（帯域）→ Q2（未知数の数）→ Q3〜5 の順で考えるとよい")

F["e09_compare"] = SVG(860, 340, [
    T(430, 26, "三大手法の比較", "middle", 12.5, INK, True),
    T(300, 58, "FDTD", "middle", 12, SIG, True),
    T(490, 58, "FEM", "middle", 12, SIG, True),
    T(680, 58, "MoM", "middle", 12, SIG, True),
] + sum([[
    RECT(24, 68 + i * 30, 812, 28, 0, SCR if i % 2 == 0 else PAN, "none", 0),
    T(34, 87 + i * 30, lab, "start", 10.5, MUT, True),
    T(300, 87 + i * 30, a, "middle", 10.5, INK),
    T(490, 87 + i * 30, b, "middle", 10.5, INK),
    T(680, 87 + i * 30, c, "middle", 10.5, INK),
] for i, (lab, a, b, c) in enumerate([
    ("領域", "時間", "周波数", "周波数"),
    ("離散化", "体積・直交格子", "体積・任意形状", "表面のみ"),
    ("行列", "なし", "疎", "密（MLFMA で緩和）"),
    ("広帯域", "◎ 1 回で全部", "△ 掃引", "△ 掃引"),
    ("曲面", "△ 階段", "◎", "◎"),
    ("高 Q 共振", "× 減衰待ち", "◎", "○"),
    ("開放領域", "○ PML が要る", "○ 吸収境界が要る", "◎ 不要"),
    ("不均質誘電体", "◎", "◎", "×"),
])], []) + [
    T(430, 330, "「なし・疎・密」という行列の性質が、そのまま扱える規模と得意問題を決めている",
      "middle", 11, MUT),
], "非線形・時変を扱えるのは FDTD だけ。メッシュ自動化（適応）が最も進んでいるのは FEM である")

F["e09_hybrid"] = SVG(860, 310, [
    T(430, 26, "分けて解いて、S パラメータで繋ぐ", "middle", 12.5, INK, True),
    BOX(30, 60, 210, 62, "コネクタ", "3D FEM（曲面・立体）", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    BOX(280, 60, 210, 62, "基板の配線", "2.5D MoM（層構造）", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    BOX(530, 60, 210, 62, "パッケージ", "3D FDTD（広帯域）", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    ARR(244, 91, 276, 91, MUT, 1.5), ARR(494, 91, 526, 91, MUT, 1.5),
    ARR(385, 126, 385, 150, MUT, 1.6),
    BOX(240, 154, 380, 54, "S 行列をカスケード（14 章）", "回路シミュレータで全体を組む", GRN, PAN, INK, 8, 1.5, 12.5, 9.5),
    RECT(30, 228, 800, 70, 8, SSOFT, SIG, 1.4),
    T(430, 250, "「全部を 1 回の解析で」はたいてい失敗する —— 大きい構造の中の微細部は計算量が破綻する",
      "middle", 11, INK, True),
    T(430, 274, "切る面は「場が単純な場所」を選ぶ。伝送線路の途中など、モードが確定している位置がよい",
      "middle", 10.5, MUT),
    T(430, 292, "実務のスキルの大半は「どこで切るか」の判断にある", "middle", 10, SIG),
], "領域分割・ハイブリッド解法・等価回路への還元・マルチスケール——形は違うがすべて同じ発想である")

F["e09_flow"] = SVG(880, 250, [
    T(440, 26, "現実的な進め方 — 粗く速く、から始める", "middle", 12.5, INK, True),
    flowright(24, 100, [("手計算", "桁を外さない"), ("粗く速く解く", "傾向を掴む", SIG, SSOFT),
                        ("掃引・最適化", "相対比較が目的", SIG, SSOFT),
                        ("メッシュ収束", "絶対値を信じる", GRN, PAN),
                        ("検証", "別手法・実測", GRN, PAN)], 152, 60, 22)[0],
    RECT(24, 162, 832, 76, 8, SCR, LIN, 1.3),
    T(440, 184, "最初から最高精度で回すのは時間の無駄である", "middle", 11.5, INK, True),
    T(440, 208, "段 2〜3 では「A と B のどちらが良いか」が分かればよく、絶対値は要らない", "middle", 10.5, MUT),
    T(440, 228, "精度が要るのは段 4 以降だけ。ここで初めてメッシュ収束を確認する（13 章）", "middle", 10.5, MUT),
], "最適化を粗いメッシュで回し、最終候補だけ収束を確認する——これが計算資源の正しい配分である")

# ===================== 10. メッシュ =====================

F["e10_mesh"] = SVG(860, 320, [
    T(430, 26, "メッシュ密度を決める 3 つの独立した基準", "middle", 12.5, INK, True),
    BOX(24, 56, 262, 92, "① 波長", "場の位相変化を解像する\n材料中の波長で 10〜20 セル/λ\n（04 章）", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(300, 56, 262, 92, "② 形状", "最小構造の寸法を解像する\nギャップ・線幅・板厚に 3〜5 セル", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(576, 56, 262, 92, "③ 場の勾配", "場の急変を解像する\nエッジ・角・給電点の近傍", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(240, 166, 380, 46, "実際のセルサイズ = 3 つすべてを満たす最小値", None, ALI, ASOFT, INK, 8, 1.6, 12.5),
    ARR(155, 152, 300, 164, MUT, 1.4), ARR(430, 152, 430, 162, MUT, 1.4), ARR(707, 152, 560, 164, MUT, 1.4),
    RECT(60, 228, 740, 78, 8, ASOFT, ALI, 1.4),
    T(430, 250, "①だけ見て失敗する典型", "middle", 11.5, INK, True),
    T(430, 272, "10 GHz で「20 セル/λ だから 1.5 mm」→ モデルに 0.2 mm のギャップがあった",
      "middle", 10.5, MUT),
    T(430, 292, "ギャップは 1 セルにも満たず、構造として存在しないことになる。容量結合が全く再現されない",
      "middle", 10.5, ALI, True),
], "基準②が①を上回ることは日常茶飯事で、そのとき計算量は波長基準の見積りを大きく超える")

F["e10_quality"] = SVG(860, 300, [
    T(430, 26, "要素品質 — 形が悪いと答えが壊れる", "middle", 12.5, INK, True),
    RECT(30, 52, 250, 170, 10, SSOFT, GRN, 1.4),
    T(155, 76, "良い要素", "middle", 11.5, GRN, True),
    TRI([(105, 190), (205, 190), (155, 104)], GRN, 1.8, PAN),
    T(155, 212, "正三角形に近い", "middle", 10, MUT),
    RECT(305, 52, 250, 170, 10, ASOFT, ALI, 1.4),
    T(430, 76, "悪い要素", "middle", 11.5, ALI, True),
    TRI([(330, 186), (530, 186), (500, 160)], ALI, 1.8, PAN),
    T(430, 212, "細長い（アスペクト比が大きい）", "middle", 10, MUT),
    RECT(580, 52, 250, 170, 10, SCR, LIN, 1.3),
    T(705, 76, "指標と目安", "middle", 11.5, INK, True),
    T(705, 106, "アスペクト比 < 10（できれば 5）", "middle", 10, MUT),
    T(705, 132, "スキュー < 0.9", "middle", 10, MUT),
    T(705, 158, "隣接セル比 < 1.5〜2", "middle", 10.5, SIG, True),
    T(705, 190, "急に変わると数値的な反射が出る", "middle", 9.5, FNT),
    RECT(30, 238, 800, 52, 8, SCR, LIN, 1.3),
    T(430, 260, "細長い要素は行列の条件数を悪化させ、反復解法が収束しなくなる", "middle", 11, INK, True),
    T(430, 280, "ただし「細長い＝悪い」ではなく「意図せず細長い＝悪い」——薄い層は厚さ方向だけ細かくてよい",
      "middle", 10.5, SIG, True),
], "細分化は段階的に。急にセルサイズが変わる界面は、インピーダンス不整合と同じ理屈で偽の反射を生む")

F["e10_local"] = SVG(860, 320, [
    T(430, 26, "局所細分化と「メッシュしない」技術", "middle", 12.5, INK, True),
    GRID(40, 56, 360, 140, 9, 5, LIN, 0.8),
    GRID(200, 84, 80, 56, 16, 12, SIG, 0.6),
    RECT(200, 84, 80, 56, 0, "none", SIG, 1.8),
    T(240, 214, "エッジ・給電点の近傍だけ細かく", "middle", 10, SIG, True),
    T(240, 234, "空気領域は粗くてよい", "middle", 10, MUT),
    RECT(440, 56, 390, 196, 8, SCR, LIN, 1.3),
    T(635, 78, "メッシュせずに済ませる等価モデル", "middle", 11.5, INK, True),
] + [
    (T(500, 106 + i * 30, a, "middle", 10, MUT, True) + T(720, 106 + i * 30, b, "middle", 10, SIG))
    for i, (a, b) in enumerate([
        ("厚い金属（δ=2 µm）", "表面インピーダンス境界"),
        ("薄い金属シート", "薄板（thin sheet）境界"),
        ("細いワイヤ", "薄線モデル"),
        ("塗装・接着層", "インピーダンス境界"),
        ("金属メッシュ・穴あき板", "等価遮蔽インピーダンス")])
] + [
    RECT(40, 262, 790, 46, 8, SSOFT, SIG, 1.4),
    T(435, 282, "これらは「賢い手抜き」ではなく、精度を保つための正しい選択である", "middle", 11, INK, True),
    T(435, 300, "無理に実体をメッシュすると要素品質が破綻し、かえって答えが悪くなる", "middle", 10, MUT),
], "「空気は粗く、金属の際は細かく」がメッシュ設計の基本姿勢。場が急変する場所は物理から予測できる")

F["e10_conformal"] = SVG(860, 300, [
    T(430, 26, "適合メッシュ — 階段近似の解消", "middle", 12.5, INK, True),
    RECT(30, 52, 390, 174, 10, ASOFT, ALI, 1.4),
    T(225, 76, "階段近似", "middle", 11.5, ALI, True),
    GRID(90, 94, 270, 90, 9, 3, LIN, 0.8),
] + [
    RECT(90 + 30 * i, 94, 30, 30 * (1 + (i // 3)), 0, ASOFT, "none", 0) for i in range(9)
] + [
    PL([(90 + 270 * u, 94 + 90 * u) for u in [i / 30 for i in range(31)]], GRN, 2),
    T(225, 208, "精度が Δx² → Δx に落ちる", "middle", 10.5, ALI, True),

    RECT(440, 52, 390, 174, 10, SSOFT, GRN, 1.4),
    T(635, 76, "適合メッシュ（conformal / PBA）", "middle", 11.5, GRN, True),
    GRID(500, 94, 270, 90, 9, 3, LIN, 0.8),
] + [
    TRI([(500 + 30 * i, 94 + 30 * i / 3), (500 + 30 * (i + 1), 94 + 30 * (i + 1) / 3),
         (500 + 30 * (i + 1), 184), (500 + 30 * i, 184)], "none", 0, SSOFT)
    for i in range(9)
] + [
    PL([(500 + 270 * u, 94 + 90 * u) for u in [i / 30 for i in range(31)]], GRN, 2),
    T(635, 208, "切られた面積・辺長で係数を補正 → 2 次精度を維持", "middle", 10.5, GRN, True),
    RECT(30, 242, 800, 46, 8, SCR, LIN, 1.3),
    T(430, 262, "同じ精度に必要なセル数が数倍〜1 桁減る。曲面や斜め構造があるなら必ず有効にする",
      "middle", 11, INK, True),
    T(430, 280, "現代の商用 FDTD/FIT では既定で有効なことが多いが、確認する価値はある", "middle", 10, MUT),
], "セルが境界で部分的に切られていることを認め、その割合を更新式に反映するのが適合メッシュの中身である")

# ===================== 11. 境界と PML =====================

F["e11_abc"] = SVG(860, 300, [
    T(430, 26, "問題 — 打ち切った面は完全反射の壁になる", "middle", 12.5, INK, True),
    RECT(60, 56, 340, 170, 4, SCR, INK, 2.4),
    D(230, 141, ALI, 6), T(230, 118, "アンテナ", "middle", 10, ALI, True),
] + [
    CIRC(230, 141, r, SIG, 1.4, "none", "5 4") for r in (40, 66)
] + [
    ARR(272, 141, 380, 141, SIG, 2),
    ARR(380, 155, 272, 155, ALI, 2),
    T(340, 178, "跳ね返る", "middle", 10, ALI, True),
    T(230, 244, "何もしなければ壁で全反射", "middle", 10.5, ALI, True),
    ARR(420, 141, 460, 141, MUT, 1.8),
    RECT(480, 56, 350, 170, 4, SCR, LIN, 1.6),
] + [
    RECT(480 + 350 - 44, 56, 44, 170, 0, SSOFT, SIG, 1.2),
    RECT(480, 56, 44, 170, 0, SSOFT, SIG, 1.2),
    D(650, 141, ALI, 6),
] + [
    CIRC(650, 141, r, SIG, 1.4, "none", "5 4") for r in (40, 66)
] + [
    ARR(692, 141, 782, 141, SIG, 2),
    T(806, 145, "吸収", "start", 10, GRN, True),
    T(655, 244, "PML: 出ていった波は戻ってこない", "middle", 10.5, GRN, True),
    RECT(60, 262, 770, 30, 6, SCR, LIN, 1.3),
    T(445, 282, "求められているのは「窓」ではなく「無限の彼方」——出た波が二度と戻らない条件である",
      "middle", 11, INK, True),
], "ABC（吸収境界条件）は垂直入射では良いが斜め入射で悪化する。現代のソルバはほぼ PML を使う")

F["e11_pml"] = SVG(860, 320, [
    T(430, 26, "PML の原理 — 電気と磁気の損失を釣り合わせる", "middle", 12.5, INK, True),
    RECT(30, 54, 390, 176, 10, ASOFT, ALI, 1.4),
    T(225, 78, "素朴な吸収材（失敗）", "middle", 11.5, ALI, True),
    RECT(60, 100, 160, 80, 0, SCR, LIN, 1.2),
    RECT(220, 100, 170, 80, 0, ASOFT, ALI, 1.4),
    T(140, 170, "真空 η₀", "middle", 10, MUT), T(305, 170, "σ を入れた材料", "middle", 10, MUT),
    ARR(80, 122, 208, 122, SIG, 2),
    ARR(208, 148, 80, 148, ALI, 2),
    T(144, 142, "入り口で反射する", "middle", 10, ALI, True),
    T(225, 210, "η が変わってしまうから", "middle", 10, MUT),

    RECT(440, 54, 390, 176, 10, SSOFT, GRN, 1.4),
    T(635, 78, "PML（Bérenger 1994）", "middle", 11.5, GRN, True),
    RECT(470, 100, 160, 80, 0, SCR, LIN, 1.2),
    RECT(630, 100, 170, 80, 0, SSOFT, GRN, 1.4),
    T(550, 170, "真空 η₀", "middle", 10, MUT), T(715, 170, "σ と σ* を両方", "middle", 10, MUT),
    PL([(478 + 317 * u, 128 - 20 * math.sin(2 * math.pi * 3.6 * u)
         * (1.0 if u < 0.4795 else math.exp(-3.6 * (u - 0.4795) / 0.5205)))
        for u in [i / 260 for i in range(261)]], GRN, 1.8),
    T(635, 210, "反射せずに入り、中で減衰する", "middle", 10.5, GRN, True),
    BOX(230, 246, 400, 50, "σ/ε = σ*/μ （整合条件）", "括弧の中が約分され、η が真空と同じままになる",
        SIG, SSOFT, INK, 8, 1.7, 14, 9.5, None, True),
], "波動インピーダンス η = √(μ/ε) が変わらなければ界面で反射しない。それを損失を入れつつ実現するのが PML である")

F["e11_stretch"] = SVG(860, 320, [
    T(430, 26, "座標伸長 — なぜ角度・周波数に依存しないのか", "middle", 12.5, INK, True),
    BOX(160, 54, 540, 54, "∂/∂x → (1/sₓ) ∂/∂x,   sₓ = κₓ + σₓ/(jωε₀)",
        None, SIG, SSOFT, INK, 8, 1.6, 14, 10, None, True),
    T(430, 124, "＝ 空間座標を複素数に「引き伸ばす」", "middle", 11, MUT),
    # 斜め入射の図
    RECT(60, 150, 300, 120, 0, SCR, LIN, 1.2),
    RECT(360, 150, 120, 120, 0, SSOFT, GRN, 1.4),
    T(420, 145, "PML", "middle", 10, GRN, True),
    ARR(120, 250, 340, 172, SIG, 2.2),
    T(200, 186, "斜め入射", "middle", 10, SIG, True),
    W(360, 150, 360, 270, c=GRN, lw=2),
    ARR(360, 214, 360, 250, ALI, 1.6), T(340, 244, "x", "middle", 10, ALI, True),
    ARR(360, 214, 396, 214, GRN, 1.6), T(400, 228, "y", "start", 10, GRN, True),
    RECT(500, 150, 330, 120, 8, SCR, LIN, 1.3),
    T(665, 172, "伸長は x 方向にだけ掛かる", "middle", 11, INK, True),
    T(665, 196, "→ 接線方向の波数 k_y は保存される", "middle", 10.5, SIG, True),
    T(665, 220, "→ 界面での位相整合が完全", "middle", 10.5, SIG, True),
    T(665, 246, "→ どんな入射角でも反射ゼロ", "middle", 11, GRN, True),
    RECT(60, 284, 770, 28, 6, SSOFT, SIG, 1.3),
    T(445, 303, "これが \"Perfectly Matched\"（完全整合）という名前の意味である", "middle", 11, INK, True),
], "整合条件は ω を含まないので周波数にも依存しない。だから広帯域の FDTD でそのまま使える")

F["e11_place"] = SVG(860, 330, [
    T(430, 26, "実務の設定 — 層数と、構造からの距離", "middle", 12.5, INK, True),
    RECT(60, 54, 400, 176, 4, SCR, LIN, 1.4),
] + [
    RECT(60 + i * 8, 54, 8, 176, 0, SSOFT, "none", 0) for i in range(6)
] + [
    RECT(460 - 48 + i * 8, 54, 8, 176, 0, SSOFT, "none", 0) for i in range(6)
] + [
    ANT(260, 130, 1.0),
    DARR(112, 176, 216, 176, ALI, 1.6, 6),
    T(164, 198, "λ/4 以上", "middle", 10.5, ALI, True),
    T(84, 246, "PML 8〜12 層", "middle", 9.5, GRN, True),
    T(436, 246, "PML", "middle", 9.5, GRN, True),
    RECT(490, 54, 340, 176, 8, ASOFT, ALI, 1.4),
    T(660, 78, "最も間違えられる設定", "middle", 11.5, ALI, True),
    T(660, 106, "PML は伝搬する波を吸収する装置である", "middle", 10, MUT),
    T(660, 130, "構造のすぐ近くには「リアクティブ近傍界」", "middle", 10, MUT),
    T(660, 150, "（蓄えられて放射しない場、15 章）がある", "middle", 10, MUT),
    T(660, 178, "これが PML に触れると、", "middle", 10.5, ALI, True),
    T(660, 198, "共振周波数と入力インピーダンスが狂う", "middle", 10.5, ALI, True),
    RECT(60, 250, 770, 66, 8, SSOFT, SIG, 1.4),
    T(445, 272, "距離は「解析帯域の最低周波数の波長」で判断する", "middle", 11.5, INK, True),
    T(445, 296, "1〜10 GHz を見るなら λ は 30 cm（1 GHz のもの）であって 3 cm ではない", "middle", 10.5, MUT),
], "σ を滑らかに立ち上げる（多項式分布）、κ>1 でエバネッセント波も吸う、CPML で低周波の安定性を確保する")

# ===================== 12. 励振とポート =====================

F["e12_source"] = SVG(860, 290, [
    T(430, 26, "ポートの 2 つの役割", "middle", 12.5, INK, True),
    BOX(320, 60, 220, 56, "ポート", None, SIG, SSOFT, INK, 10, 1.8, 14),
    BOX(40, 156, 320, 66, "励振", "電磁界を発生させる源として働く", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(500, 156, 320, 66, "測定", "入射波と反射波を分離し、振幅と位相を記録する", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    ARR(360, 116, 240, 152, MUT, 1.6), ARR(500, 116, 620, 152, MUT, 1.6),
    RECT(40, 240, 780, 40, 8, ASOFT, ALI, 1.4),
    T(430, 265, "ポートの定義が間違っていれば、どれだけ精密に解いても S パラメータは間違う",
      "middle", 11.5, INK, True),
], "S パラメータ（14 章）はすべてポートを基準に定義される。ここが解析の入口であり出口でもある")

F["e12_lumped"] = SVG(860, 300, [
    T(430, 26, "集中ポート — 2 導体間に電圧源を置く", "middle", 12.5, INK, True),
    RECT(120, 70, 300, 14, 2, SSOFT, INK, 1.6),
    RECT(120, 176, 300, 14, 2, MUT, MUT, 1.2),
    T(270, 62, "導体 1", "middle", 10, MUT), T(270, 208, "導体 2（グラウンド）", "middle", 10, MUT),
    CIRC(270, 130, 20, SIG, 2, PAN),
    T(270, 136, "~", "middle", 18, SIG, True),
    W(270, 84, 270, 110, c=SIG, lw=2), W(270, 150, 270, 176, c=SIG, lw=2),
    T(322, 134, "Z₀ = 50 Ω", "start", 10, SIG, True),
    DARR(180, 90, 180, 170, MUT, 1.3, 5), T(160, 134, "ギャップ", "end", 9.5, MUT),
    RECT(460, 60, 370, 150, 8, SCR, LIN, 1.3),
    T(645, 82, "定義に必要なもの", "middle", 11, INK, True),
    T(645, 106, "V = −∫E·dl（ギャップ間の線積分）", "middle", 10, MUT),
    T(645, 128, "I = ∮H·dl（導体を囲む閉路）", "middle", 10, MUT),
    T(645, 154, "適用条件: ギャップ ≪ 波長", "middle", 10.5, SIG, True),
    T(645, 184, "アンテナ給電・IC ピンのモデルに自然", "middle", 10, MUT),
    RECT(60, 228, 770, 60, 8, ASOFT, ALI, 1.4),
    T(445, 250, "隠れた誤差: 給電ギャップのインダクタンス", "middle", 11.5, INK, True),
    T(445, 272, "1 セルのギャップに実在しないインダクタンスが生まれ、共振が下にずれる", "middle", 10.5, MUT),
], "対策は「実際の給電構造をモデル化する」「ギャップを細かくメッシュする」「校正で差し引く」のいずれか")

F["e12_wave"] = SVG(860, 320, [
    T(430, 26, "導波ポート — 断面のモード解析から励振する", "middle", 12.5, INK, True),
    flowright(60, 96, [("ポート断面を 2D で解く", "固有値問題", SIG, SSOFT),
                       ("伝搬モードを得る", "場の分布と γ", SIG, SSOFT),
                       ("3D 領域へ注入", "正しいモードで励振", GRN, PAN)], 220, 62, 30)[0],
    # マイクロストリップ断面
    RECT(90, 190, 200, 60, 0, SSOFT, LIN, 1.2),
    RECT(160, 182, 60, 8, 1, MUT, INK, 1.4),
    RECT(90, 250, 200, 6, 0, MUT, MUT, 1),
    T(190, 272, "マイクロストリップ断面", "middle", 9.5, MUT),
] + [
    ARR(160 + i * 15, 186, 160 + i * 15, 246, SIG, 1.2, 4) for i in range(5)
] + [
    RECT(330, 176, 500, 90, 8, ASOFT, ALI, 1.4),
    T(580, 198, "ポートのサイズ設定が重要", "middle", 11.5, INK, True),
    T(580, 222, "小さすぎる → モードの場が切られ、特性インピーダンスが誤る", "middle", 10.5, MUT),
    T(580, 244, "大きすぎる → 断面が導波管として働き、不要な高次モードが伝搬する", "middle", 10.5, MUT),
    T(430, 300, "目安: 幅は線幅の 6〜10 倍、高さは基板厚の 4〜6 倍。サイズを変えて結果が動かないことを確認する",
      "middle", 11, SIG, True),
], "均一な伝送線路の端なら導波ポート、構造の途中の給電点なら集中ポート——というのが基本の使い分けである")

F["e12_deembed"] = SVG(860, 300, [
    T(430, 26, "ディエンベッド — 基準面を動かす", "middle", 12.5, INK, True),
    RECT(60, 90, 740, 60, 4, SCR, LIN, 1.3),
    RECT(340, 90, 180, 60, 4, SSOFT, SIG, 1.6),
    T(430, 126, "評価したい素子", "middle", 11, INK, True),
    RECT(60, 112, 280, 16, 2, MUT, MUT, 1),
    RECT(520, 112, 280, 16, 2, MUT, MUT, 1),
    T(200, 106, "余分な線路 ℓ₁", "middle", 9.5, MUT), T(660, 106, "余分な線路 ℓ₂", "middle", 9.5, MUT),
    W(60, 76, 60, 164, c=ALI, lw=2), W(800, 76, 800, 164, c=ALI, lw=2),
    T(60, 68, "ポート面", "middle", 9.5, ALI, True), T(800, 68, "ポート面", "middle", 9.5, ALI, True),
    W(340, 76, 340, 164, c=GRN, lw=2, dash="5 4"), W(520, 76, 520, 164, c=GRN, lw=2, dash="5 4"),
    T(340, 180, "移動後の基準面", "middle", 9.5, GRN, True), T(520, 180, "移動後の基準面", "middle", 9.5, GRN, True),
    BOX(180, 200, 500, 50, "S₁₁ᵈᵉ = S₁₁ · e^(+2γℓ),   S₂₁ᵈᵉ = S₂₁ · e^(+γ(ℓ₁+ℓ₂))",
        None, SIG, SSOFT, INK, 8, 1.6, 13, 10, None, True),
    T(430, 278, "実測の TRL 校正と同じことをしている —— 比較するときは両者の基準面を必ず合わせる",
      "middle", 11, INK, True),
], "「位相が合わない」の原因の筆頭が基準面の不一致である。振幅は合うのに位相だけずれるならまずここを疑う")

F["e12_pulse"] = SVG(860, 320, [
    T(430, 26, "励振波形が解析帯域を決める", "middle", 12.5, INK, True),
    T(200, 56, "時間波形", "middle", 11, INK, True),
    T(650, 56, "スペクトル", "middle", 11, INK, True),
] + sum([[
    PL([(60 + 280 * u, y0 + 26 - 26 * math.exp(-((u - 0.5) / wdt) ** 2) * mult(u))
        for u in [i / 120 for i in range(121)]], SIG, 1.8),
    W(60, y0 + 26, 340, y0 + 26, c=LIN, lw=1),
    T(60, y0 - 4, name, "start", 10, MUT, True),
    PL([(420 + 280 * u, y0 + 46 - 40 * sp(u)) for u in [i / 120 for i in range(121)]], GRN, 1.8),
    W(420, y0 + 46, 700, y0 + 46, c=LIN, lw=1),
    T(712, y0 + 30, note, "start", 9.5, MUT),
] for y0, name, wdt, mult, sp, note in [
    (80, "ガウシアン", 0.12, (lambda u: 1.0), (lambda u: math.exp(-(u / 0.28) ** 2)), "DC を含む"),
    (156, "微分ガウシアン", 0.12, (lambda u: -(u - 0.5) / 0.12 * 1.4),
     (lambda u: (u / 0.22) * math.exp(-(u / 0.30) ** 2) * 1.5), "DC 成分ゼロ（標準）"),
    (232, "変調ガウシアン", 0.16, (lambda u: math.cos(2 * math.pi * 6 * (u - 0.5))),
     (lambda u: math.exp(-((u - 0.45) / 0.14) ** 2)), "帯域を絞れる"),
]], []) + [
    T(430, 306, "鉄則: 解析帯域の 1.5〜2 倍まで含み、それ以上は含まない", "middle", 11.5, SIG, True),
], "鋭くしすぎるとメッシュで解像できない高周波が入り、数値分散で汚れる。緩すぎると高域が雑音になる")

# ===================== 13. 収束 =====================

F["e13_conv"] = SVG(860, 300, [
    T(430, 26, "「収束した」の 3 つの意味", "middle", 12.5, INK, True),
    BOX(24, 56, 262, 100, "① 反復解法の収束", "連立方程式の残差が閾値以下\n→「その離散化された方程式を\n正しく解けた」だけ", LIN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(300, 56, 262, 100, "② 時間発展の収束", "エネルギーが十分減衰した\n→「計算を打ち切ってよい」だけ", LIN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(576, 56, 262, 100, "③ メッシュ収束", "細かくしても答えが変わらない\n→ 離散化誤差が小さい\n★ これが本命", SIG, SSOFT, INK, 8, 1.7, 12, 9.5),
    RECT(24, 176, 814, 110, 8, ASOFT, ALI, 1.4),
    T(430, 200, "①と③を混同するのが最大の落とし穴である", "middle", 12, INK, True),
    T(430, 226, "①は「1000 セルの粗いメッシュで作った方程式を、機械が厳密に解いた」という報告にすぎない",
      "middle", 10.5, MUT),
    T(430, 248, "粗いメッシュの答えを、極めて正確に計算しただけ。物理的に正しい保証は何もない",
      "middle", 10.5, MUT),
    T(430, 274, "ソルバが「収束しました」と出しても、③を自分で確認していないなら信じてはいけない",
      "middle", 11, ALI, True),
], "FEM の適応メッシュは③を自動化している。FDTD では人間が確認する必要がある——ここが実務上の大きな違いである")

F["e13_meshconv"] = SVG(860, 320, [
    T(430, 26, "メッシュ収束の確認 — 変化しなくなった点を採る", "middle", 12.5, INK, True),
    AXES(90, 230, 620, 170, "メッシュ細分化 →", "評価量"),
] + [
    PL([(90 + 620 * u, 230 - 130 * (1 - math.exp(-3.4 * u))) for u in [i / 80 for i in range(81)]], SIG, 2.4)
] + [
    D(90 + 620 * u, 230 - 130 * (1 - math.exp(-3.4 * u)), INK, 5)
    for u in (0.05, 0.2, 0.4, 0.62, 0.85)
] + [
    W(90, 100, 730, 100, c=GRN, lw=1.6, dash="6 4"),
    T(736, 104, "真値", "start", 10, GRN, True),
    ARR(480, 152, 480, 116, ALI, 1.5),
    T(500, 148, "ここを採用（変化が止まった点）", "start", 10.5, ALI, True),
    T(200, 200, "まだ変化している", "middle", 10, MUT),
    RECT(90, 252, 680, 56, 8, SSOFT, SIG, 1.4),
    T(430, 274, "評価量を 1 つ決め（共振周波数・|S₂₁|・利得など）、1.3〜1.5 倍ずつ細かくして変化を追う",
      "middle", 11, INK, True),
    T(430, 296, "リチャードソン外挿: f ≈ f_h + (f_h − f_2h)/(2^p − 1) で真値を推定できる（p=2）",
      "middle", 10.5, MUT),
], "「最後に細かくした結果」ではなく「変化しなくなった点」を採る。平坦になっていないなら、まだ真値は分からない")

F["e13_energy"] = SVG(860, 310, [
    T(430, 26, "FDTD の打ち切り — 残留エネルギーで判断する", "middle", 12.5, INK, True),
    AXES(90, 220, 620, 160, "時間ステップ →", "エネルギー [dB]"),
    PL([(90 + 620 * u, 70 + 145 * u + 8 * math.sin(40 * u) * math.exp(-3 * u))
        for u in [i / 200 for i in range(201)]], SIG, 2.2),
] + [
    (W(90, 70 + 145 * u, 710, 70 + 145 * u, c=c, lw=1.4, dash="5 4")
     + T(716, 74 + 145 * u, lab, "start", 10, c, True))
    for u, lab, c in ((0.28, "−30 dB", MUT), (0.42, "−40 dB", SIG), (0.62, "−50 dB", GRN))
] + [
    RECT(90, 242, 680, 60, 8, ASOFT, ALI, 1.4),
    T(430, 264, "早く切ると: 時間波形に矩形窓を掛けたのと同じ → スペクトルにリップルが乗る",
      "middle", 11, INK, True),
    T(430, 288, "症状は「S パラメータが本来滑らかな帯域で細かく波打つ」。周期はおよそ 1/T である",
      "middle", 10.5, MUT),
], "−40 dB が標準。高 Q 構造、低いサイドローブ、深いノッチを見たいなら −50〜−60 dB まで待つ")

F["e13_check"] = SVG(860, 320, [
    T(430, 26, "物理法則による検算 — 1 分で致命傷を見つける", "middle", 12.5, INK, True),
    BOX(24, 56, 400, 76, "① エネルギー保存", "P入射 = P反射 + P透過 + P損失 + P放射\n無損失 2 ポートなら |S₁₁|² + |S₂₁|² = 1",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(440, 56, 400, 76, "② パッシブ性", "Σⱼ |Sⱼᵢ|² ≤ 1（すべての i で）\n1 を超えたら計算が間違っている",
        ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    BOX(24, 148, 400, 76, "③ 相反性", "Sᵢⱼ = Sⱼᵢ（非相反素子がなければ）\n破れたらメッシュ非対称かポート設定",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(440, 148, 400, 76, "④ 因果性", "入力より前に応答が出ないこと\n破れたら周波数点不足か帯域不足",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    RECT(24, 240, 816, 66, 8, SCR, LIN, 1.3),
    T(432, 262, "S パラメータを出したら、まずパッシブ性と相反性を見る習慣をつける", "middle", 11.5, INK, True),
    T(432, 286, "「|S₁₁|²+|S₂₁|² = 1.4」のような結果は、どれだけ綺麗なグラフでも深刻な問題を意味する",
      "middle", 10.5, MUT),
], "1 − |S₁₁|² − |S₂₁|² が損失と放射の合計になる。その差が「どこへ行ったか」を説明できなければならない")

# ===================== 14. S パラメータ =====================

F["e14_sdef"] = SVG(860, 300, [
    T(430, 26, "S パラメータ — 進行波の比で定義する", "middle", 12.5, INK, True),
    RECT(300, 110, 260, 80, 8, SSOFT, SIG, 1.6),
    T(430, 156, "回路（2 ポート）", "middle", 12, INK, True),
    RECT(100, 142, 200, 16, 2, MUT, MUT, 1),
    RECT(560, 142, 200, 16, 2, MUT, MUT, 1),
    ARR(120, 122, 280, 122, SIG, 2), T(200, 112, "a₁（入射）", "middle", 10, SIG, True),
    ARR(280, 178, 120, 178, ALI, 2), T(200, 200, "b₁（反射）", "middle", 10, ALI, True),
    ARR(580, 122, 740, 122, GRN, 2), T(660, 112, "b₂（透過）", "middle", 10, GRN, True),
    ARR(740, 178, 580, 178, MUT, 1.6), T(660, 200, "a₂（普通は 0）", "middle", 10, MUT),
    BOX(230, 226, 400, 54, "Sᵢⱼ = bᵢ / aⱼ  （他ポートは整合終端）", None, SIG, SSOFT, INK, 8, 1.7, 14, 10, None, True),
    T(80, 96, "ポート 1", "middle", 10.5, MUT, True), T(780, 96, "ポート 2", "middle", 10.5, MUT, True),
], "電圧・電流ではなく波で定義するのは、GHz では「開放・短絡」が作れず、導波管では電圧が一意でないから")

F["e14_read"] = SVG(860, 320, [
    T(430, 26, "|S₁₁| の読み方 — dB と電力の対応", "middle", 12.5, INK, True),
] + sum([[
    RECT(60, 56 + i * 34, 740, 30, 4, fill, c, 1.3),
    T(150, 76 + i * 34, db, "middle", 11, c, True),
    T(340, 76 + i * 34, rf, "middle", 10.5, INK),
    T(530, 76 + i * 34, ps, "middle", 10.5, INK),
    T(700, 76 + i * 34, note, "middle", 10, MUT),
] for i, (db, rf, ps, note, c, fill) in enumerate([
    ("0 dB", "反射 100 %", "通過 0 %", "全反射", ALI, ASOFT),
    ("−6 dB", "反射 25 %", "通過 75 %", "かなり悪い", ALI, ASOFT),
    ("−10 dB", "反射 10 %", "通過 90 %", "一般的な合格ライン", SIG, SSOFT),
    ("−20 dB", "反射 1 %", "通過 99 %", "良好", GRN, PAN),
    ("−30 dB", "反射 0.1 %", "通過 99.9 %", "非常に良好", GRN, PAN),
])], []) + [
    RECT(60, 236, 740, 72, 8, SCR, LIN, 1.3),
    T(430, 258, "dB は 20 log（振幅比だから）。アンテナの「帯域」は |S₁₁| < −10 dB の範囲で定義される",
      "middle", 11, INK, True),
    T(430, 282, "リターンロス = −20log|S₁₁|（正の値） ／ VSWR = (1+|S₁₁|)/(1−|S₁₁|)",
      "middle", 10.5, MUT),
    T(430, 302, "リターンロス＝戻ってくる電力の小ささ、VSWR＝電圧定在波比。−10 dB は VSWR = 2 に対応する", "middle", 10, FNT),
], "振幅だけ見て位相を捨てると多くを失う。群遅延 τ = −d∠S₂₁/dω の平坦性はデジタル伝送で決定的である")

F["e14_matrix"] = SVG(860, 300, [
    T(430, 26, "S 行列の性質 — 検算に使う", "middle", 12.5, INK, True),
    BOX(24, 56, 400, 68, "相反性", "S = Sᵀ（Sᵢⱼ = Sⱼᵢ）\n非相反素子（磁化フェライト）がなければ成立",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(440, 56, 400, 68, "パッシブ性", "Σᵢ |Sᵢⱼ|² ≤ 1\n電源を含まなければ必ず成立",
        ALI, ASOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(24, 140, 400, 68, "無損失（ユニタリ性）", "Sᴴ S = I\n無損失 2 ポートなら |S₁₁|²+|S₂₁|² = 1",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(440, 140, 400, 68, "対称性", "構造が対称なら S₁₁ = S₂₂\n破れたらメッシュかポートが非対称",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    BOX(150, 226, 560, 56, "1 − |S₁₁|² − |S₂₁|² = (P損失 + P放射) / P入射",
        "この和からのずれが、損失と放射の合計になる", GRN, PAN, INK, 8, 1.6, 13.5, 9.5, None, True),
], "1 ポートのアンテナなら 1−|S₁₁|² が「構造に入った電力の割合」。そのうち放射されたぶんが放射効率である")

F["e14_cascade"] = SVG(860, 300, [
    T(430, 26, "S 行列は繋げない — T / ABCD に変換して合成する", "middle", 12.5, INK, True),
    BOX(60, 62, 200, 56, "回路 A の S 行列", None, SIG, SSOFT, INK, 8, 1.4, 12),
    BOX(320, 62, 200, 56, "回路 B の S 行列", None, SIG, SSOFT, INK, 8, 1.4, 12),
    ARR(268, 90, 312, 90, ALI, 1.6),
    W(548, 78, 578, 102, c=ALI, lw=2.2), W(548, 102, 578, 78, c=ALI, lw=2.2),
    T(704, 86, "S 行列どうしを掛けても", "middle", 10.5, MUT),
    T(704, 104, "縦続接続にはならない", "middle", 11, ALI, True),
    ARR(430, 128, 430, 148, MUT, 1.6),
    BOX(160, 152, 540, 50, "T 行列（伝送行列）に変換すると、縦続接続が行列の積になる",
        None, GRN, PAN, INK, 8, 1.5, 12.5),
    BOX(230, 216, 400, 62, "T = (1/S₂₁) [ −detS, S₁₁ ; −S₂₂, 1 ]",
        "定義には流儀がある。ツール間の受け渡しでは規約を確認する", SIG, SSOFT, INK, 8, 1.6, 13, 9.5, None, True),
], "この変換によって「分けて解いて後で繋ぐ」（09 章）が可能になる。ABCD 行列は集中素子と混ぜやすい")

# ===================== 15. 遠方界 =====================

F["e15_zones"] = SVG(860, 336, [
    T(430, 26, "アンテナの周りの 3 つの領域", "middle", 12.5, INK, True),
    ANT(78, 104, 0.9),
    T(78, 152, "アンテナ", "middle", 9.5, MUT),
    T(78, 168, "最大寸法 D", "middle", 9.5, MUT),
    # 距離軸に沿った 3 つの帯
    RECT(124, 96, 176, 46, 6, ASOFT, ALI, 1.4),
    RECT(300, 96, 220, 46, 6, SSOFT, SIG, 1.4),
    RECT(520, 96, 312, 46, 6, SCR, GRN, 1.4),
    T(212, 124, "リアクティブ近傍界", "middle", 10.5, ALI, True),
    T(410, 124, "放射近傍界（フレネル）", "middle", 10.5, SIG, True),
    T(676, 124, "遠方界（フラウンホーファー）", "middle", 10.5, GRN, True),
    ARR(124, 158, 838, 158, MUT, 1.4, 7),
    T(838, 176, "距離 R", "end", 10, MUT),
    # 境界の位置
    W(300, 60, 300, 158, c=ALI, lw=1.3, dash="4 4"),
    W(520, 60, 520, 158, c=GRN, lw=1.3, dash="4 4"),
    T(300, 54, "R ≈ 0.62 √(D³/λ)", "middle", 10.5, ALI, True),
    T(520, 54, "R = 2D² / λ", "middle", 10.5, GRN, True),
    # 各領域の説明
    RECT(24, 196, 252, 66, 8, SCR, ALI, 1.3),
    T(150, 218, "エネルギーが蓄えられて戻る", "middle", 9.5, MUT),
    T(150, 236, "正味の放射をしない", "middle", 9.5, MUT),
    T(150, 254, "PML を触れさせてはいけない", "middle", 9.5, ALI, True),
    RECT(304, 196, 252, 66, 8, SCR, SIG, 1.3),
    T(430, 218, "放射はしているが、距離によって", "middle", 9.5, MUT),
    T(430, 236, "パターンの形が変わる", "middle", 9.5, MUT),
    T(430, 254, "ここで測ったパターンは遠方界ではない", "middle", 9.5, SIG, True),
    RECT(584, 196, 252, 66, 8, SCR, GRN, 1.3),
    T(710, 218, "パターンの形が距離に依らない", "middle", 9.5, MUT),
    T(710, 236, "振幅だけが 1/R で減る", "middle", 9.5, MUT),
    T(710, 254, "アンテナの「性能」はここで定義される", "middle", 9.5, GRN, True),
    RECT(24, 276, 812, 48, 8, PAN, LIN, 1.3),
    T(430, 296, "直径 30 cm・10 GHz なら遠方界は R > 6 m —— 測定には広い電波暗室が要る", "middle", 10.5, INK, True),
    T(430, 314, "シミュレーションは近傍界から遠方界を計算で作れるので、この距離の制約から自由である（15 章）", "middle", 10, MUT),
], "境界の条件は、アンテナの端と中心からの距離差が λ/16 以下、つまり位相差 22.5° 以下になることから来る")

F["e15_ntff"] = SVG(860, 330, [
    T(430, 26, "近傍界→遠方界変換 — 囲み面の場だけで無限遠が出る", "middle", 12.5, INK, True),
    RECT(70, 60, 330, 190, 8, SCR, LIN, 1.3),
    ANT(235, 150, 0.9),
    RECT(120, 92, 230, 130, 4, "none", GRN, 2, "6 4"),
    T(235, 84, "積分面 S", "middle", 10.5, GRN, True),
] + [
    ARR(120, 108 + i * 30, 104, 108 + i * 30, SIG, 1.3, 4) for i in range(4)
] + [
    ARR(350, 108 + i * 30, 366, 108 + i * 30, SIG, 1.3, 4) for i in range(4)
] + [
    T(235, 238, "面上の E と H を記録", "middle", 10, MUT),
    BOX(430, 74, 400, 76, "Js = n̂×H,  Ms = −n̂×E", "面上の場を等価な表面電流に置き換える（等価定理）",
        SIG, SSOFT, INK, 8, 1.6, 13.5, 9.5, None, True),
    ARR(410, 112, 424, 112, MUT, 1.5),
    BOX(430, 166, 400, 84, "E_far ∝ (e^(−jkr)/r) ∫ [Js + r̂×Ms] e^(+jk r̂·r′) dS′",
        "グリーン関数で無限遠へ飛ばす", GRN, PAN, INK, 8, 1.5, 11.5, 9.5, None, True),
    RECT(70, 266, 760, 56, 8, ASOFT, ALI, 1.4),
    T(450, 288, "積分の中の e^(+jk r̂·r′) はフーリエ変換の核 —— 遠方界は開口分布のフーリエ変換である",
      "middle", 11.5, INK, True),
    T(450, 310, "→ 開口が大きいほどビームが細く、テーパを掛けるとサイドローブが下がって太くなる",
      "middle", 10.5, MUT),
], "積分面は構造を完全に囲み、PML には触れない位置に置く。面上の場を最高周波数で十分サンプルできていること")

F["e15_metrics"] = SVG(860, 300, [
    T(430, 26, "混同しやすい 4 つの量", "middle", 12.5, INK, True),
] + sum([[
    RECT(60, 56 + i * 44, 740, 40, 5, fill, c, 1.3),
    T(180, 81 + i * 44, name, "middle", 11, c, True),
    T(430, 81 + i * 44, form, "middle", 10.5, INK),
    T(690, 81 + i * 44, inc, "middle", 10, MUT),
] for i, (name, form, inc, c, fill) in enumerate([
    ("指向性 D", "最大放射強度 / 等方換算", "形だけ。損失を含まない", LIN, PAN),
    ("利得 G", "η_rad × D", "＋ 導体損・誘電損", SIG, SSOFT),
    ("実効利得", "(1 − |S₁₁|²) × G", "＋ 反射損", SIG, SSOFT),
    ("放射効率 η_rad", "P放射 / P入力", "損失の割合", GRN, PAN),
])], []) + [
    RECT(60, 240, 740, 50, 8, ASOFT, ALI, 1.4),
    T(430, 260, "PEC でモデル化すると η_rad = 1 になり、利得 = 指向性になってしまう", "middle", 11, INK, True),
    T(430, 280, "効率を評価したいなら、必ず実際の導電率と tanδ を入れる（03 章）", "middle", 10.5, MUT),
], "単位も 2 種類ある。dBi は等方性基準（標準）、dBd は半波長ダイポール基準で dBi = dBd + 2.15 である")

F["e15_pattern"] = SVG(860, 320, [
    T(430, 26, "放射パターンの読み方", "middle", 12.5, INK, True),
    W(90, 250, 560, 250, c=LIN, lw=1.4),
] + [
    PL([(325 + r * math.sin(math.radians(a)), 250 - r * math.cos(math.radians(a)))
        for a in range(-90, 91)
        for r in [190 * max(abs(math.sin(10 * math.pi * 0.5 * math.sin(math.radians(a)) / 2)
                  / (10 * math.sin(math.pi * 0.5 * math.sin(math.radians(a)) / 2 + 1e-9) + 1e-9))
                  if abs(math.sin(math.radians(a))) > 0.008 else 1.0, 0.004)]], SIG, 2.2)
] + [
    T(325, 46, "主ローブ", "middle", 10.5, SIG, True),
    DARR(295, 108, 355, 108, ALI, 1.4, 5),
    T(325, 84, "半値幅 HPBW", "middle", 10, ALI, True),
    T(176, 212, "サイドローブ", "middle", 10, MUT),
    ARR(218, 216, 276, 234, MUT, 1.2, 6),
    RECT(600, 56, 236, 200, 8, SCR, LIN, 1.3),
    T(718, 78, "見る指標", "middle", 11, INK, True),
    T(718, 104, "HPBW（−3 dB の角度幅）", "middle", 9.5, MUT),
    T(718, 128, "サイドローブレベル SLL", "middle", 9.5, MUT),
    T(718, 152, "フロントバック比 F/B", "middle", 9.5, MUT),
    T(718, 176, "クロスポーラ・XPD", "middle", 9.5, MUT),
    T(718, 208, "断面は E 面 / H 面で切る", "middle", 10, SIG, True),
    T(718, 230, "（電界／磁界と最大方向を含む面）", "middle", 9, FNT),
    T(430, 296, "アレイなら 素子パターン × アレイファクタ。結合は周期境界（11 章）で織り込む",
      "middle", 11, MUT),
], "レーダーシリーズ 11 章のアンテナの性質は、すべて「遠方界＝開口分布のフーリエ変換」から導かれる")

# ===================== 16. 時間と周波数 =====================

F["e16_pulse"] = SVG(860, 300, [
    T(430, 26, "1 回の計算で広帯域が出る仕組み", "middle", 12.5, INK, True),
    flowright(30, 100, [("広帯域パルスを入力", "x(t)", SIG, SSOFT),
                        ("時間発展を計算", "FDTD", LIN, PAN),
                        ("出力波形を記録", "y(t)", SIG, SSOFT),
                        ("両方を FFT して割る", "Y(ω)/X(ω)", GRN, PAN)], 178, 62, 24)[0],
    BOX(230, 176, 400, 54, "H(ω) = F{y(t)} / F{x(t)}", None, SIG, SSOFT, INK, 8, 1.7, 15, 10, None, True),
    RECT(30, 246, 800, 46, 8, SCR, LIN, 1.3),
    T(430, 266, "周波数領域なら 200 点の掃引に 200 回。時間領域なら 1 回で 2000 点でも同じコスト",
      "middle", 11, INK, True),
    T(430, 286, "ただしポートの数だけ計算が要る（各ポートを順に励振する）", "middle", 10, MUT),
], "線形時不変系ではインパルス応答が系のすべてを決める。この当たり前の事実が時間領域ソルバの最大の武器になる")

F["e16_fft"] = SVG(860, 300, [
    T(430, 26, "分解能と帯域 — DSP と全く同じ関係", "middle", 12.5, INK, True),
    BOX(40, 60, 380, 76, "周波数分解能 Δf = 1/T", "計算した総時間 T が決める\n→ 鋭い共振を見たければ長く計算する",
        SIG, SSOFT, INK, 8, 1.5, 13, 9.5),
    BOX(440, 60, 380, 76, "最高周波数 f_max = 1/(2Δt)", "時間ステップが決める（ナイキスト）\n→ Δt はクーラン条件でセルに縛られる",
        SIG, SSOFT, INK, 8, 1.5, 13, 9.5),
    RECT(40, 156, 780, 70, 8, ASOFT, ALI, 1.4),
    T(430, 178, "実用上、上限を決めるのはナイキストではなくメッシュである", "middle", 11.5, INK, True),
    T(430, 202, "メッシュが波長を解像できる周波数（10〜20 セル/λ）を超えると、数値分散で信用できなくなる",
      "middle", 10.5, MUT),
    T(430, 220, "「FFT が出す周波数」と「信じてよい周波数」は違う", "middle", 10.5, ALI, True),
    T(430, 258, "グラフが描けるからといって、解析帯域の上限を超えた領域を読んではいけない",
      "middle", 11, SIG, True),
    T(430, 282, "励振パルスに含まれていない周波数も同様である（12 章）", "middle", 10, MUT),
], "細かい分解能が欲しければ長く、高い周波数まで欲しければ細かく——両方欲しければ計算量が二重に増える")

F["e16_causal"] = SVG(860, 310, [
    T(430, 26, "打ち切り誤差 — S パラメータがギザギザになる原因", "middle", 12.5, INK, True),
    T(200, 58, "時間波形", "middle", 11, INK, True),
    PL([(60 + 280 * u, 120 - 34 * math.sin(30 * u) * math.exp(-2.4 * u))
        for u in [i / 200 for i in range(201)]], SIG, 1.6),
    W(60, 120, 340, 120, c=LIN, lw=1),
    W(250, 80, 250, 160, c=ALI, lw=2, dash="5 4"),
    T(250, 176, "ここで打ち切り", "middle", 10, ALI, True),
    T(300, 96, "残っている", "middle", 9.5, ALI),
    T(650, 58, "スペクトル", "middle", 11, INK, True),
    PL([(420 + 380 * u, 140 - 60 * math.exp(-((u - 0.4) / 0.16) ** 2)
         - 9 * math.sin(56 * u) * math.exp(-((u - 0.4) / 0.4) ** 2))
        for u in [i / 300 for i in range(301)]], ALI, 1.8),
    W(420, 140, 800, 140, c=LIN, lw=1),
    T(650, 172, "リップルが乗る（周期 ≈ 1/T）", "middle", 10, ALI, True),
    ARR(350, 120, 410, 120, MUT, 1.6), T(380, 108, "FFT", "middle", 9, FNT),
    RECT(60, 198, 770, 100, 8, SCR, LIN, 1.3),
    T(445, 220, "症状から原因を当てる", "middle", 11.5, INK, True),
    T(445, 244, "細かく等間隔に波打つ → 打ち切り誤差（もっと長く計算する）", "middle", 10.5, MUT),
    T(445, 266, "滑らかだが実測とずれる → モデル化誤差（材料・形状・ポート）", "middle", 10.5, MUT),
    T(445, 288, "高域だけノイズ的に暴れる → 励振パルスにその成分が乏しい（12 章）", "middle", 10.5, MUT),
], "窓関数を掛ければリップルは減るが周波数分解能が落ちる。DSP シリーズ 04 章と全く同じトレードオフである")

F["e16_tdr"] = SVG(860, 320, [
    T(430, 26, "TDR — S₁₁ を逆変換して不整合の場所を見つける", "middle", 12.5, INK, True),
    AXES(80, 200, 560, 130, "時間（＝距離）", "反射"),
    PL([(80 + 560 * u, 130 + (0 if u < 0.2 else (-24 if u < 0.32 else (18 if u < 0.5 else (0 if u < 0.7 else -30)))))
        for u in [i / 300 for i in range(301)]], SIG, 2.2),
    W(80, 130, 640, 130, c=FNT, lw=1, dash="3 5"),
    T(200, 88, "上向き = Z が上がる", "middle", 9.5, GRN, True),
    T(340, 172, "下向き = Z が下がる", "middle", 9.5, ALI, True),
    T(560, 100, "終端", "middle", 9.5, MUT),
    BOX(660, 66, 180, 62, "d = c·t / (2√εr,eff)", "時間が距離に対応する", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5, None, True),
    RECT(660, 140, 180, 78, 8, SCR, LIN, 1.3),
    T(750, 162, "波形の読み方", "middle", 10.5, INK, True),
    T(750, 184, "上向き: 細い線・ギャップ", "middle", 9, MUT),
    T(750, 202, "下向き: パッド・余分な容量", "middle", 9, MUT),
    RECT(80, 234, 760, 74, 8, SSOFT, SIG, 1.4),
    T(460, 256, "周波数グラフでは「1.8 GHz で反射が大きい」しか分からない", "middle", 11, INK, True),
    T(460, 280, "TDR なら「入力から 12 mm の位置で容量性の不整合」と場所が特定できる", "middle", 11, SIG, True),
    T(460, 300, "分解能 Δd ≈ v/(2B) —— レーダーの距離分解能と同じ式である", "middle", 10, MUT),
], "20 GHz まで解析していれば基板上で数 mm の分解能。18 章のシグナルインテグリティではこの見方が主役になる")

# ===================== 17. アンテナ設計 =====================

F["e17_patch"] = SVG(860, 340, [
    T(430, 26, "マイクロストリップパッチの設計式", "middle", 12.5, INK, True),
    # 上面図
    RECT(60, 60, 240, 196, 4, SCR, LIN, 1.3),
    RECT(100, 96, 160, 100, 2, SSOFT, SIG, 1.8),
    DARR(100, 212, 260, 212, MUT, 1.3, 5), T(94, 216, "W", "end", 11, INK, True),
    DARR(280, 96, 280, 196, MUT, 1.3, 5), T(296, 150, "L", "start", 11, INK, True),
    RECT(172, 196, 16, 34, 1, SIG, SIG, 1),
    T(180, 248, "給電（インセット y₀）", "middle", 9.5, MUT),
    T(180, 80, "パッチ（上面図）", "middle", 10, MUT, True),
    # 側面
    RECT(60, 268, 240, 40, 0, SSOFT, LIN, 1.2),
    RECT(100, 262, 160, 6, 0, SIG, SIG, 1),
    RECT(60, 308, 240, 5, 0, MUT, MUT, 1),
    DARR(320, 268, 320, 308, MUT, 1.2, 4), T(336, 292, "h", "start", 10, INK, True),
    T(180, 328, "側面（基板 εr、厚さ h）", "middle", 9.5, MUT),
] + [
    BOX(360, 56 + i * 62, 470, 54, f, note, SIG if i in (0, 3) else LIN, SSOFT if i in (0, 3) else PAN,
        INK, 8, 1.5, 12, 9.5, None, True)
    for i, (f, note) in enumerate([
        ("W = (c/2f₀) √(2/(εr+1))", "放射効率が良くなる幅"),
        ("εeff = (εr+1)/2 + (εr−1)/2 · (1+12h/W)^(−1/2)", "電界が基板と空気を通る平均"),
        ("ΔL/h = 0.412 (εeff+0.3)(W/h+0.264) / ((εeff−0.258)(W/h+0.8))", "縁の張り出しによる伸び"),
        ("L = c/(2f₀√εeff) − 2ΔL", "共振条件：電気長が半波長"),
    ])
] + [
    RECT(360, 310, 470, 26, 5, ASOFT, ALI, 1.3),
    T(595, 328, "「基板で縮み、縁で少し伸びる半波長共振器」", "middle", 10.5, INK, True),
], "ΔL は h に比例するので、厚い基板ほど補正が大きい。帯域を広げようと厚くすると共振がずれる理由がこれである")

F["e17_flow"] = SVG(860, 320, [
    T(430, 26, "寸法感度の地図 — どれが何を動かすか", "middle", 12.5, INK, True),
] + sum([[
    RECT(40, 56 + i * 40, 780, 36, 5, fill, c, 1.3),
    T(130, 79 + i * 40, v, "middle", 11, c, True),
    T(400, 79 + i * 40, main, "middle", 10.5, INK),
    T(680, 79 + i * 40, side, "middle", 10, MUT),
] for i, (v, main, side, c, fill) in enumerate([
    ("L（長さ）", "共振周波数（f₀ ∝ 1/L）", "ほぼこれだけ。最重要", SIG, SSOFT),
    ("y₀（給電位置）", "整合（|S₁₁| の深さ）", "共振周波数はほぼ動かない", SIG, SSOFT),
    ("W（幅）", "入力インピーダンス・帯域・パターン", "共振も少し動く", LIN, PAN),
    ("h（基板厚）", "帯域（厚いほど広い）", "表面波損失増・共振ずれ", LIN, PAN),
    ("εr", "サイズ（高いほど小さい）", "帯域も効率も落ちる", LIN, PAN),
    ("グラウンド面サイズ", "後方放射・F/B 比", "実機で必ず効く", ALI, ASOFT),
])], []) + [
    RECT(40, 302 - 4, 780, 0, 0, PAN, PAN, 0),
    T(430, 312, "L が周波数、y₀ が整合 —— 役割が分かれているので、2 変数の最適化が事実上 1 変数ずつになる",
      "middle", 11, SIG, True),
], "式で感度が分かっていると最適化が劇的に速くなる。闇雲に多変数最適化を回すのが最も遅い進め方である")

F["e17_env"] = SVG(860, 372, [
    T(430, 26, "実機との差を生むのは「環境」である", "middle", 12.5, INK, True),
    ANT(200, 130, 1.1),
    T(200, 178, "単体解析", "middle", 10.5, MUT, True),
    T(200, 200, "（出発点にすぎない）", "middle", 9.5, FNT),
    ARR(300, 140, 350, 140, MUT, 1.8),
] + [
    BOX(380, 56 + i * 46, 450, 40, name, note, c, fill, INK, 6, 1.3, 11, 9)
    for i, (name, note, c, fill) in enumerate([
        ("有限グラウンド面", "無限を仮定すると後方放射を過小評価", ALI, ASOFT),
        ("筐体", "金属は共振をずらす。樹脂も εr で数 % 動く", ALI, ASOFT),
        ("周辺部品", "バッテリ・シールドケース・コネクタが結合", SIG, SSOFT),
        ("人体", "誘電体・損失体として効き、効率が数 dB 落ちる", SIG, SSOFT),
        ("ケーブル", "コモンモード電流でパターンが乱れる", SIG, SSOFT),
    ])
] + [
    RECT(40, 296, 790, 62, 8, ASOFT, ALI, 1.4),
    T(435, 320, "「単体では完璧なアンテナが、製品に入れたら動かない」——きわめてよくある",
      "middle", 11.5, INK, True),
    T(435, 344, "アンテナは環境込みで設計するもの。段階的に環境を足しながら確認していく",
      "middle", 10.5, MUT),
], "進め方: 手計算 → 2.5D で粗く → 3D で詰める → 環境を足す → 公差解析（εr ±0.2、寸法 ±50 µm）")

# ===================== 18. シグナルインテグリティ =====================

F["e18_stack"] = SVG(860, 300, [
    T(430, 26, "「速い信号」とは、立ち上がりが速い信号である", "middle", 12.5, INK, True),
    BOX(230, 56, 400, 52, "f_knee ≈ 0.35 / t_r", "実効的な帯域は立ち上がり時間で決まる",
        SIG, SSOFT, INK, 8, 1.7, 15, 9.5, None, True),
] + sum([[
    RECT(60, 128 + i * 40, 740, 36, 5, fill, c, 1.3),
    T(160, 151 + i * 40, tr, "middle", 11, c, True),
    T(420, 151 + i * 40, bw, "middle", 10.5, INK),
    T(680, 151 + i * 40, lam, "middle", 10.5, MUT),
] for i, (tr, bw, lam, c, fill) in enumerate([
    ("t_r = 1 ns", "実効帯域 350 MHz", "λ/20 = 20 mm", LIN, PAN),
    ("t_r = 100 ps", "実効帯域 3.5 GHz", "λ/20 = 2.0 mm", SIG, SSOFT),
    ("t_r = 20 ps", "実効帯域 17.5 GHz", "λ/20 = 0.4 mm", ALI, ASOFT),
])], []) + [
    RECT(60, 254, 740, 40, 8, SCR, LIN, 1.3),
    T(430, 279, "10 MHz のクロックでも t_r = 100 ps なら帯域は 3.5 GHz。ビア 1 個が問題になる領域である",
      "middle", 11, INK, True),
], "基板中（εr=4.4）での λ/20 を示した。この長さを超える構造はすべて分布定数として扱う必要がある")

F["e18_via"] = SVG(860, 330, [
    T(430, 26, "リターン電流 — SI の中心概念", "middle", 12.5, INK, True),
    RECT(40, 56, 380, 150, 8, SCR, LIN, 1.3),
    T(230, 78, "連続したグラウンド", "middle", 11, GRN, True),
    RECT(70, 100, 320, 8, 1, SIG, SIG, 1),
    RECT(70, 160, 320, 8, 1, MUT, MUT, 1),
    ARR(90, 96, 370, 96, SIG, 1.8), T(230, 126, "信号電流", "middle", 9, SIG, True),
    ARR(370, 172, 90, 172, GRN, 1.8), T(230, 190, "リターン電流（真下を追う）", "middle", 9, GRN, True),

    RECT(440, 56, 380, 150, 8, ASOFT, ALI, 1.4),
    T(630, 78, "グラウンドにスリット", "middle", 11, ALI, True),
    RECT(470, 100, 320, 8, 1, SIG, SIG, 1),
    RECT(470, 160, 130, 8, 1, MUT, MUT, 1),
    RECT(660, 160, 130, 8, 1, MUT, MUT, 1),
    T(630, 156, "スリット", "middle", 9, ALI, True),
    ARR(490, 96, 770, 96, SIG, 1.8),
    PL([(770, 172), (665, 172), (630, 196), (595, 172), (490, 172)], ALI, 1.8),
    T(704, 192, "迂回 → 巨大なループ", "middle", 9.5, ALI, True),
    RECT(40, 224, 780, 96, 8, SSOFT, SIG, 1.4),
    T(430, 246, "高周波では、リターン電流は「最短経路」ではなく「最小インダクタンス経路」を通る",
      "middle", 11.5, INK, True),
    T(430, 270, "＝ 信号線の真下をぴったり追いかける（ループ面積を最小にするため）", "middle", 10.5, MUT),
    T(430, 296, "この一文から、スリット・ビア・クロストーク・コモンモード放射がすべて説明できる",
      "middle", 10.5, SIG, True),
    T(430, 314, "電磁界解析の最大の価値は、この流れを可視化できることにある", "middle", 10, FNT),
], "回路シミュレータでは絶対に見えない。「なぜここが悪いのか」を教えてくれるのが電磁界解析である")

F["e18_pdn"] = SVG(860, 320, [
    T(430, 26, "PDN — 電源プレーンは共振器である", "middle", 12.5, INK, True),
    AXES(90, 220, 560, 150, "周波数", "|Z| [Ω]"),
    PL([(90 + 560 * u, 200 - 30 * math.sin(3.4 * u) - 90 * math.exp(-((u - 0.55) / 0.06) ** 2)
         - 60 * math.exp(-((u - 0.78) / 0.05) ** 2))
        for u in [i / 300 for i in range(301)]], SIG, 2.2),
    W(90, 130, 656, 130, c=ALI, lw=1.8, dash="6 4"),
    T(650, 122, "Z_target", "end", 10, ALI, True),
    T(400, 78, "反共振ピーク", "middle", 10.5, ALI, True),
    ARR(400, 88, 400, 108, ALI, 1.4),
    BOX(680, 60, 160, 54, "Z_target = ΔV / ΔI", None, SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5, None, True),
    RECT(680, 126, 160, 96, 8, SCR, LIN, 1.3),
    T(760, 148, "見る量", "middle", 10.5, INK, True),
    T(760, 172, "PDN インピーダンス", "middle", 9.5, MUT),
    T(760, 192, "共振ピーク", "middle", 9.5, MUT),
    T(760, 212, "伝達インピーダンス", "middle", 9.5, MUT),
    RECT(90, 244, 750, 66, 8, ASOFT, ALI, 1.4),
    T(465, 266, "デカップリングコンデンサは自己共振周波数を超えるとインダクタになる",
      "middle", 11.5, INK, True),
    T(465, 290, "SRF は容量値ではなく実装の寄生インダクタンス（パッド・ビア・配線）で決まる → どこに置くかが効く",
      "middle", 10.5, MUT),
], "容量値を並べただけの計算では反共振は見えない。プレーン構造と実装寄生を含めて Z(f) を計算する必要がある")

F["e18_eye"] = SVG(860, 300, [
    T(430, 26, "S パラメータからアイパターンまで", "middle", 12.5, INK, True),
    flowright(24, 96, [("電磁界解析", "S パラメータ", SIG, SSOFT),
                       ("パッシブ化・因果化", "怠ると発散", ALI, ASOFT),
                       ("ドライバ／レシーバ", "IBIS-AMI など", LIN, PAN),
                       ("ビット列を流す", None, LIN, PAN),
                       ("アイパターン判定", "規格を満たすか", GRN, PAN)], 150, 62, 20)[0],
    RECT(24, 166, 400, 120, 8, SCR, LIN, 1.3),
    T(224, 188, "アイの症状と原因", "middle", 11, INK, True),
    T(120, 214, "上下が潰れる", "middle", 10, MUT), T(320, 214, "損失・反射", "middle", 10, ALI),
    T(120, 240, "左右が狭い", "middle", 10, MUT), T(320, 240, "分散・ISI（符号間干渉）・クロストーク", "middle", 10, ALI),
    T(120, 266, "非対称に歪む", "middle", 10, MUT), T(320, 266, "反射・スタブ共振", "middle", 10, ALI),
    RECT(440, 166, 396, 120, 8, ASOFT, ALI, 1.4),
    T(638, 190, "SI の解析は S パラメータで終わりではない", "middle", 11, INK, True),
    T(638, 216, "|S₂₁| が −3 dB でも、その周波数依存の形と", "middle", 10, MUT),
    T(638, 236, "アイの関係は自明ではない", "middle", 10, MUT),
    T(638, 264, "電磁界解析はチェーンの 1 段目。その品質が全体を決める", "middle", 10.5, SIG, True),
], "ビアスタブの共振（f = c/(4ℓ√εeff)）は 25 Gbps 級を直撃する。バックドリルの効果を定量化するのが解析の仕事である")

# ===================== 19. EMC =====================

F["e19_test"] = SVG(860, 300, [
    T(430, 26, "EMC 解析の価値は「経路の特定」にある", "middle", 12.5, INK, True),
] + sum([[
    RECT(40, 56 + i * 46, 780, 40, 5, fill, c, 1.3),
    T(150, 80 + i * 46, name, "middle", 11, c, True),
    T(400, 80 + i * 46, what, "middle", 10, INK),
    T(690, 80 + i * 46, sim, "middle", 10, MUT),
] for i, (name, what, sim, c, fill) in enumerate([
    ("放射エミッション", "製品から出る電波（30 MHz〜数 GHz）", "どこが放射しているか", SIG, SSOFT),
    ("伝導エミッション", "電源・信号線に乗るノイズ", "コモンモードの経路", SIG, SSOFT),
    ("放射イミュニティ", "外部の電波で誤動作しないか", "筐体内部への侵入経路", LIN, PAN),
    ("静電気（ESD）", "放電に耐えるか", "放電電流の経路・誘導電圧", LIN, PAN),
])], []) + [
    RECT(40, 248, 780, 44, 8, ASOFT, ALI, 1.4),
    T(430, 270, "絶対値を ±3 dB で当てるのは難しいが、「スリットを埋めれば 10 dB 下がる」は十分な精度で出せる",
      "middle", 11, INK, True),
    T(430, 288, "相対比較ならモデル化誤差の多くが両方の解析でキャンセルするからである", "middle", 10, MUT),
], "EMC 試験は製品ができてから行うので、落ちれば手戻りが最大級になる。だから「試験の前」に使う価値がある")

F["e19_mode"] = SVG(860, 320, [
    T(430, 26, "なぜコモンモードが放射の主犯なのか", "middle", 12.5, INK, True),
    RECT(30, 54, 390, 170, 10, SCR, GRN, 1.4),
    T(225, 78, "ディファレンシャルモード（DM）", "middle", 11.5, GRN, True),
    ARR(90, 120, 340, 120, SIG, 2), ARR(340, 160, 90, 160, GRN, 2),
    T(215, 108, "行き", "middle", 9, SIG), T(215, 178, "帰り（逆向き）", "middle", 9, GRN),
    T(225, 202, "打ち消し合う → 放射が小さい", "middle", 10.5, GRN, True),

    RECT(440, 54, 390, 170, 10, ASOFT, ALI, 1.4),
    T(635, 78, "コモンモード（CM）", "middle", 11.5, ALI, True),
    ARR(500, 120, 750, 120, ALI, 2), ARR(500, 160, 750, 160, ALI, 2),
    T(625, 108, "同じ向き", "middle", 9, ALI), T(625, 178, "同じ向き", "middle", 9, ALI),
    T(635, 202, "打ち消しがない → 放射が大きい", "middle", 10.5, ALI, True),
    RECT(30, 238, 800, 74, 8, SSOFT, SIG, 1.4),
    T(430, 260, "100 MHz・ケーブル 1 m・距離 3 m で比較すると", "middle", 11, INK, True),
    T(430, 284, "DM 20 mA（ループ 10 cm²） ≈ CM わずか 8 µA が、同程度の放射を生む", "middle", 11.5, ALI, True),
    T(430, 304, "コモンモードは、桁で 3 つ小さい電流で同じだけ放射する", "middle", 10.5, MUT),
], "「差動だから放射しない」は完全対称なら、という条件付き。わずかな非対称が CM を生み、それが放射を支配する")

F["e19_slot"] = SVG(860, 330, [
    T(430, 26, "スリット — 効くのは面積ではなく最長寸法", "middle", 12.5, INK, True),
    RECT(60, 56, 300, 150, 4, SCR, INK, 2),
    RECT(90, 120, 240, 6, 1, ASOFT, ALI, 1.4),
    T(210, 148, "1 mm × 100 mm", "middle", 10, ALI, True),
    T(210, 168, "面積 100 mm²", "middle", 9.5, MUT),
    T(210, 190, "→ 100 mm のスロットアンテナ", "middle", 10, ALI, True),
    RECT(420, 56, 300, 150, 4, SCR, INK, 2),
    RECT(535, 86, 70, 70, 2, SSOFT, GRN, 1.4),
    T(570, 176, "10 mm × 10 mm・面積 100 mm²", "middle", 10, GRN, True),
    T(570, 196, "→ 遥かに漏れにくい", "middle", 10, GRN, True),
    BOX(60, 222, 300, 50, "SE ≈ 20 log(λ / 2ℓ)", None, SIG, SSOFT, INK, 8, 1.6, 14, 9.5, None, True),
    RECT(400, 222, 320, 50, 6, SCR, LIN, 1.3),
    T(560, 242, "ℓ = λ/100 → 34 dB", "middle", 10, MUT),
    T(560, 262, "ℓ = λ/2 → 0 dB（全く遮蔽しない）", "middle", 10.5, ALI, True),
    RECT(60, 286, 660, 38, 8, ASOFT, ALI, 1.4),
    T(390, 310, "対策は「長いスリットを短く分割する」——ガスケット・ネジ間隔・ハニカム通気口",
      "middle", 11, INK, True),
], "シールド材の厚さはまず問題にならない（10 µm の銅で吸収損 43 dB）。問題は必ず穴とケーブルである")

F["e19_cable"] = SVG(860, 300, [
    T(430, 26, "ケーブルが最大の漏れ経路である", "middle", 12.5, INK, True),
    RECT(80, 70, 260, 140, 6, SCR, INK, 2.4),
    T(210, 96, "完璧な筐体", "middle", 11, GRN, True),
    D(210, 150, ALI, 6), T(210, 176, "ノイズ源", "middle", 9.5, ALI, True),
    W(340, 140, 700, 140, c=MUT, lw=4),
    T(520, 124, "ケーブル", "middle", 10, MUT, True),
] + [
    ARR(380 + i * 60, 140, 380 + i * 60 + 40, 140, ALI, 1.4, 4) for i in range(5)
] + [
    T(520, 162, "コモンモード電流が乗って外へ運ばれる", "middle", 9.5, ALI, True),
] + [
    CIRC(700, 140, r, SIG, 1.2, "none", "4 4") for r in (28, 52, 76)
] + [
    T(760, 100, "放射", "middle", 10.5, SIG, True),
    RECT(80, 230, 700, 60, 8, ASOFT, ALI, 1.4),
    T(430, 252, "完璧な筐体でも、ケーブル 1 本がコモンモード電流を外へ運べば、それが効率の良いアンテナになる",
      "middle", 11, INK, True),
    T(430, 276, "筐体の解析にケーブルを含めなければ意味がない", "middle", 11, ALI, True),
], "他の経路（コネクタのシェル接地、表示窓、通気口、合わせ目）も同じ原理。長い導体を作らないことが原則である")

# ===================== 20. 実務 =====================

F["e20_flow"] = SVG(880, 260, [
    T(440, 26, "ワークフローの全体像", "middle", 12.5, INK, True),
    flowright(24, 96, [("目的を決める", "何を何 % で", ALI, ASOFT),
                       ("手計算", "初期値と桁"),
                       ("モデル化", "形状・材料・境界"),
                       ("粗く解く", "傾向を掴む"),
                       ("収束確認", "13 章", SIG, SSOFT),
                       ("検証", "別手法・実測", GRN, PAN)], 126, 58, 16)[0],
    RECT(24, 166, 832, 76, 8, ASOFT, ALI, 1.4),
    T(440, 190, "段 1 を飛ばすと、すべてが無駄になる", "middle", 12, INK, True),
    T(440, 214, "「共振周波数を 1 % で」なのか「相対比較ができればよい」のかで、必要なメッシュもコストも桁で変わる",
      "middle", 10.5, MUT),
    T(440, 234, "目的が精度を決め、精度がコストを決める", "middle", 10.5, SIG, True),
], "最後に文書化を忘れない。半年後の自分と、結果を受け取る人のために「モデルの限界」を必ず書き残す")

F["e20_valid"] = SVG(860, 300, [
    T(430, 26, "モデル簡略化 — 何を残し、何を捨てるか", "middle", 12.5, INK, True),
    BOX(24, 56, 262, 100, "消してよい", "λ/20 より小さい特徴\n場が弱い場所の細部\nネジ・面取り・刻印\n内部の非導電部品",
        GRN, PAN, INK, 8, 1.5, 12, 9.5),
    BOX(300, 56, 262, 100, "残すべき", "電流経路上の構造\n電界が集中する場所\nλ/10 を超える金属\nケーブル（19 章）",
        ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    BOX(576, 56, 262, 100, "等価モデルに置換", "厚い導体（表面インピーダンス）\n薄膜・細線\n金属メッシュ\n周期構造",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    RECT(24, 172, 814, 44, 8, SSOFT, SIG, 1.4),
    T(430, 198, "迷ったら「両方で解いて差を見る」。差が評価量に影響しなければ捨ててよい", "middle", 11.5, INK, True),
    RECT(24, 228, 814, 62, 8, SCR, LIN, 1.3),
    T(430, 250, "「メッシュが切れない」の原因は、ほぼジオメトリにある", "middle", 11, INK, True),
    T(430, 274, "微小な隙間・重なり・スリバー面・過剰な曲面分割 —— メッシャ設定をいじる前に形状を疑う",
      "middle", 10.5, MUT),
], "機械 CAD から取り込んだ形状には、設計上は無意味な 0.001 mm の隙間が無数にある。前処理の大半はこの掃除である")

F["e20_pitfall"] = SVG(860, 400, [
    T(430, 26, "実測と合わないとき — 切り分けの順序", "middle", 12.5, INK, True),
    flowdown(430, 50, [
        ("Step 0. どう違うかを分類する", "周波数がずれる／レベルが違う／形が違う／ギザギザ", LIN, PAN),
        ("Step 1. 自分の解析を疑う（内部整合性）", "メッシュ収束・パッシブ性・境界距離・ポート依存", SIG, SSOFT),
        ("Step 2. モデルを疑う ← 最も可能性が高い", "材料定数・tanδ・表面粗さ・寸法・構造の欠落・給電", ALI, ASOFT),
        ("Step 3. 測定を疑う", "校正・基準面・治具・参照インピーダンス・環境", SIG, SSOFT),
        ("Step 4. 数値を疑う（最後）", "階段近似・高 Q・掃引の補間・手法固有の弱点", LIN, PAN),
    ], 620, 48, 12)[0],
    RECT(60, 352, 740, 40, 8, SSOFT, SIG, 1.4),
    T(430, 377, "経験則: 周波数のずれ → 材料か寸法 ／ レベルのずれ → 損失か校正",
      "middle", 11.5, INK, True),
], "Step 4 に来る前に、9 割は Step 2〜3 で解決している。「同じモデルのつもり」を疑うところから始める")

F["e20_map"] = SVG(860, 448, [
    T(430, 26, "シリーズ全体の地図", "middle", 12.5, INK, True),
    stack(150, 52, 560, [
        ("実務", "簡略化・切り分け・文書化（01・20 章）", GRN, PAN),
        ("応用", "アンテナ・SI・EMC（17〜19 章）", GRN, PAN),
        ("結果を読む", "S パラメータ・遠方界・時間↔周波数（14〜16 章）", SIG, SSOFT),
        ("正しく解かせる", "メッシュ・境界・ポート・収束（10〜13 章）", SIG, SSOFT),
        ("手法", "FDTD・FEM・MoM（05〜09 章）", SIG, SSOFT),
        ("離散化", "差分と基底展開。セル/波長（04 章）", LIN, PAN),
        ("物理", "マクスウェル方程式・材料・境界条件（02・03 章）", ALI, ASOFT),
    ], 46, 6)[0],
    T(430, 436, "シミュレータは、与えたモデルの答えしか返さない", "middle", 11.5, SIG, True),
], "下の層ほど普遍で、上の層ほど道具や用途に近い。どのソルバを使っても、下 3 層の話は変わらない")
