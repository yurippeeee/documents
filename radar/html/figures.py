# -*- coding: utf-8 -*-
"""レーダー編の図版（インライン SVG）。CSS 変数参照でダーク/ライト両対応。"""
import math
import os as _os

F = {}
_CHECK = bool(_os.environ.get("FIGCHECK"))
_OVER = []

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"    # スチールブルー
ALI = "var(--alias)"     # 警告の赤
GRN = "var(--blue)"      # 第3色（緑）
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

# ===================== 01. 原理 =====================

def radar_icon(x, y, s=1.0, c=SIG):
    """レーダー装置のアイコン（箱＋アンテナ扇）"""
    o = [RECT(x - 16*s, y - 10*s, 32*s, 26*s, 4*s, PAN, c, 1.6)]
    o.append(W(x - 8*s, y - 10*s, x + 10*s, y - 26*s, c=c, lw=1.6))
    o.append('<path d="M %g %g A %g %g 0 0 1 %g %g" fill="none" stroke="%s" stroke-width="%g"/>'
             % (x + 2*s, y - 30*s, 10*s, 10*s, x + 16*s, y - 20*s, c, 1.4))
    return "".join(o)

def car_icon(x, y, s=1.0, c=INK):
    o = ['<path d="M %g %g q %g %g %g 0 l %g 0 q %g %g %g 0 z" fill="none" stroke="%s" stroke-width="%g"/>'
         % (x - 22*s, y, 6*s, -16*s, 16*s, 12*s, 10*s, -16*s, 16*s, c, 1.8)]
    o.append(CIRC(x - 11*s, y, 4.5*s, c, 1.8))
    o.append(CIRC(x + 11*s, y, 4.5*s, c, 1.8))
    return "".join(o)

F["r01_tof"] = SVG(800, 290, [
    T(400, 26, "往復時間 τ を測れば距離が出る", "middle", 12.5, INK, True),
    radar_icon(80, 120), T(80, 148, "レーダー", "middle", 10.5, MUT, True),
    car_icon(680, 116), T(680, 146, "目標（距離 R）", "middle", 10.5, MUT, True),
    ARR(120, 92, 640, 92, SIG, 2), T(380, 82, "行き R", "middle", 11, SIG, True),
    ARR(640, 132, 120, 132, GRN, 2), T(380, 156, "帰り R（エコー）", "middle", 11, GRN, True),
    W(80, 190, 720, 190, c=LIN, lw=1.6),
    D(120, 190, SIG, 5), T(120, 214, "送信", "middle", 10, MUT),
    D(600, 190, GRN, 5), T(600, 214, "受信", "middle", 10, MUT),
    DARR(126, 178, 594, 178, MUT, 1.3, 6), T(146, 172, "往復時間 τ", "start", 10.5, INK, True),
    BOX(240, 232, 320, 44, "R = cτ / 2", "往復だから 2 で割る。1 µs → 150 m", SIG, SSOFT, INK, 8, 1.6, 14, 10),
], "電波は光速 c で飛ぶ。送信から受信までの時間 τ の半分が「行き」に相当する")

F["r01_block"] = SVG(840, 300, [
    T(420, 26, "レーダーの 4 つのブロック", "middle", 12.5, INK, True),
    BOX(30, 60, 150, 52, "送信機（TX）", "波形を作って増幅", SIG, SSOFT),
    BOX(30, 190, 150, 52, "受信機（RX）", "増幅してデジタル化", SIG, SSOFT),
    BOX(230, 122, 120, 56, "アンテナ", "空間との窓口", GRN, PAN),
    car_icon(680, 148, 1.1), T(680, 180, "目標", "middle", 10.5, MUT, True),
    ARR(180, 86, 262, 122, MUT, 1.6),
    ARR(286, 178, 180, 212, MUT, 1.6),
    ARR(350, 136, 632, 136, SIG, 1.8), T(490, 126, "送信波", "middle", 10, SIG, True),
    ARR(632, 162, 350, 162, GRN, 1.8), T(490, 184, "エコー", "middle", 10, GRN, True),
    BOX(230, 226, 260, 52, "信号処理", "検出・距離・速度・角度・追尾", ALI, ASOFT),
    ARR(180, 226, 226, 240, MUT, 1.6),
    T(30, 288, "送信と受信で同じアンテナを共用する構成も多い（送受切替器やサーキュレータで分離する）", "start", 9.5, FNT),
], "波形を作る・空間へ出す・拾って増幅する・数値に変える。以降の章はこの 4 ブロックを 1 つずつ開けていく")

F["r01_meas"] = SVG(820, 300, [
    T(410, 26, "エコーの 4 つの性質が、4 つの測定量になる", "middle", 12.5, INK, True),
    BOX(320, 120, 180, 56, "エコー", "戻ってきた電波", GRN, PAN, INK, 10, 1.8, 13),
    BOX(40, 52, 210, 52, "遅れ時間 → 距離 R", "τ を測る（05・08 章）", SIG, SSOFT),
    BOX(570, 52, 210, 52, "周波数のずれ → 速度 v", "ドップラー効果（07 章）", SIG, SSOFT),
    BOX(40, 200, 210, 52, "位相の差 → 角度 θ", "複数アンテナで受ける（10 章）", SIG, SSOFT),
    BOX(570, 200, 210, 52, "振幅 → 反射の強さ", "目標の RCS（04 章）", SIG, SSOFT),
    ARR(316, 130, 254, 92, MUT, 1.5), ARR(504, 130, 566, 92, MUT, 1.5),
    ARR(316, 166, 254, 208, MUT, 1.5), ARR(504, 166, 566, 208, MUT, 1.5),
    T(410, 286, "レーダーの出力は画像ではなく、目標ごとの (R, v, θ, 強さ) の組である", "middle", 10.5, MUT),
], "1 つのエコーの中に 4 種類の情報が同居している。それぞれを別の物差し（時間・周波数・位相・振幅）で読み出す")

F["r01_types"] = SVG(820, 300, [
    T(410, 26, "レーダーの 2 大方式", "middle", 12.5, INK, True),
    BOX(310, 48, 200, 44, "レーダー", None, INK, PAN, INK, 8, 1.6, 13),
    W(410, 92, 410, 108, c=MUT, lw=1.5),
    W(210, 108, 610, 108, c=MUT, lw=1.5),
    ARR(210, 108, 210, 124, MUT, 1.5), ARR(610, 108, 610, 124, MUT, 1.5),
    BOX(80, 126, 260, 60, "パルスレーダー", "短く打って、沈黙して聴く", SIG, SSOFT),
    BOX(480, 126, 260, 60, "連続波レーダー（CW / FMCW）", "出しっぱなし。周波数で時間の目印", SIG, SSOFT),
    BOX(80, 206, 260, 56, "航空管制・気象・艦船", "大電力・長距離。05〜06 章", LIN, PAN, MUT, 8, 1.3, 11, 9.5),
    BOX(480, 206, 260, 56, "車載・産業・屋内", "小型・ワンチップ。08〜09 章", LIN, PAN, MUT, 8, 1.3, 11, 9.5),
    ARR(210, 186, 210, 202, MUT, 1.4), ARR(610, 186, 610, 202, MUT, 1.4),
    T(410, 288, "原理は連続している——パルスで導く式のほとんどが FMCW にもそのまま効く", "middle", 10.5, MUT),
], "「時間の目印をどう作るか」の違い。パルスは沈黙が目印、FMCW は周波数の傾きが目印になる")

# ===================== 02. 電波の基礎 =====================

F["r02_wave"] = SVG(800, 300, [
    T(400, 26, "波長 λ = c / f — 1 秒に f 回振動しながら 30 万 km 進む", "middle", 12.5, INK, True),
    T(60, 76, "10 GHz", "middle", 11, SIG, True),
    sine(120, 80, 620, 5, 26, SIG, 1.8),
    DARR(120, 122, 244, 122, MUT, 1.3, 5), T(182, 140, "λ = 3 cm", "middle", 10, MUT, True),
    T(60, 196, "77 GHz", "middle", 11, GRN, True),
    sine(120, 200, 620, 20, 26, GRN, 1.6),
    DARR(120, 242, 151, 242, MUT, 1.3, 4), T(200, 248, "λ = 3.9 mm", "start", 10, MUT, True),
    T(400, 286, "同じ距離に、周波数が高いほど多くの波が詰まる＝波長が短い", "middle", 10.5, MUT),
], "周波数が 7.7 倍なら波長は 1/7.7。ミリ波（波長 1 cm 以下）では波そのものが部品サイズになる")

F["r02_whyhigh"] = SVG(840, 250, [
    T(420, 26, "高い周波数（短い波長）を選ぶ 3 つの理由", "middle", 12.5, INK, True),
    BOX(30, 56, 250, 76, "アンテナが小さい", "素子間隔の基本は λ/2。77 GHz なら 2 mm——8 本並べても 1.6 cm", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(295, 56, 250, 76, "広い帯域が取れる", "距離分解能は帯域で決まる（06 章）。77〜81 GHz には 4 GHz ある", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(560, 56, 250, 76, "細かい動きが見える", "速度・変位は波長を物差しに測る（07 章）。短いほど敏感", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(160, 158, 520, 60, "代償: 部品が難しい・遠くへ届きにくい",
        "周波数の選択は「小型・高分解能」と「距離・コスト」のトレードオフ", ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    ARR(155, 136, 240, 154, MUT, 1.4), ARR(420, 136, 420, 154, MUT, 1.4), ARR(685, 136, 600, 154, MUT, 1.4),
], "ミリ波が選ばれるのは「小さく・細かく」の 2 点がどうしても欲しい用途。長距離監視は今も低い周波数を使う")

F["r02_bands"] = SVG(840, 300, [
    T(420, 26, "レーダーの周波数帯とバンド名", "middle", 12.5, INK, True),
] + [
    RECT(40 + i * 95, 60, 91, 44, 5, SSOFT if nm in ("W",) else SCR, SIG if nm in ("W",) else LIN, 1.6 if nm=="W" else 1.2)
    for i, nm in enumerate(["L", "S", "C", "X", "K", "V", "W", " "][:8])
][:7] + [
    T(40 + i * 95 + 45, 80, nm, "middle", 13, SIG if nm=="W" else INK, True)
    for i, nm in enumerate(["L", "S", "C", "X", "K", "V", "W"])
] + [
    T(40 + i * 95 + 45, 96, fr, "middle", 8.8, MUT)
    for i, fr in enumerate(["1〜2", "2〜4", "4〜8", "8〜12", "18〜27", "40〜75", "75〜110"])
] + [
    T(40, 122, "GHz", "start", 9, FNT),
    BOX(40, 140, 230, 52, "L・S・C・X", "航空管制・気象・船舶。遠くまで届く", LIN, PAN, INK, 6, 1.3, 11, 9.5),
    BOX(290, 140, 230, 52, "K（24 GHz）・V（60 GHz）", "産業センサ・屋内センシング", LIN, PAN, INK, 6, 1.3, 11, 9.5),
    BOX(540, 140, 260, 52, "W（76〜81 GHz）", "車載レーダーの主戦場", SIG, SSOFT, INK, 6, 1.5, 11, 9.5),
    T(420, 226, "電波は共有資源——放送・通信・衛星との取り合いで、レーダーに使える帯は国際的に決められている",
      "middle", 10.5, MUT),
    T(420, 248, "「割り当てられた帯の中で最善を尽くす」のがレーダー設計の前提になる", "middle", 10.5, MUT),
], "バンド名は歴史的な符牒だが現役の共通語。「X バンドの船舶レーダー」「W バンドの車載」のように使う")

F["r02_spread"] = SVG(800, 300, [
    T(400, 26, "球面拡散 — 吸収ではなく「薄まり」", "middle", 12.5, INK, True),
    radar_icon(110, 170),
] + [
    '<path d="M %g %g A %g %g 0 0 1 %g %g" fill="none" stroke="%s" stroke-width="%g" stroke-dasharray="5 4"/>'
    % (110 + r * math.cos(-0.46), 160 + r * math.sin(-0.46),
       r, r, 110 + r * math.cos(0.46), 160 + r * math.sin(0.46), SIG, lw)
    for r, lw in ((150, 1.6), (300, 1.2))
] + [
    T(254, 90, "距離 R", "start", 10.5, SIG, True),
    T(390, 54, "距離 2R", "start", 10.5, SIG, True),
    RECT(253, 140, 14, 40, 2, SSOFT, SIG, 1.6),
    RECT(403, 120, 14, 80, 2, SSOFT, SIG, 1.2),
    T(260, 226, "面積 A に", "middle", 9.5, MUT), T(260, 240, "電力 P", "middle", 9.5, MUT),
    T(410, 226, "同じ電力が", "middle", 9.5, MUT), T(410, 240, "4 倍の面積に", "middle", 9.5, MUT),
    BOX(560, 120, 220, 76, "電力密度", "S = Pt / (4πR²)\n距離 2 倍で 1/4（−6 dB）", SIG, SSOFT, INK, 8, 1.6, 12.5, 10),
    T(400, 284, "風船に塗った絵の具と同じ——総量は不変のまま、表面積に反比例して薄まる", "middle", 10.5, MUT),
], "半径 R の球の表面積は 4πR²。レーダーではこの薄まりが往復で 2 回起きる（03 章）")

F["r02_atten"] = SVG(800, 320, [
    T(400, 26, "大気による減衰 — 60 GHz の酸素吸収", "middle", 12.5, INK, True),
    AXES(90, 250, 640, 190, "周波数 [GHz]", "減衰 [dB/km]"),
] + [
    PL([(90 + 640 * u,
         250 - (6 + 170 * math.exp(-((u - 0.62) / 0.055) ** 2) + 40 * u * u
                + 26 * math.exp(-((u - 0.98) / 0.06) ** 2)) * 0.9)
        for u in [i / 200 for i in range(201)]], SIG, 2)
] + [
    T(170, 268, "10", "middle", 9.5, FNT), T(410, 268, "60", "middle", 9.5, FNT),
    T(500, 268, "77", "middle", 9.5, FNT),
    W(410, 250, 410, 100, c=ALI, lw=1.2, dash="4 4"),
    T(410, 88, "O₂ 吸収 約 15 dB/km", "middle", 10.5, ALI, True),
    W(500, 250, 500, 226, c=GRN, lw=1.2, dash="4 4"),
    T(526, 216, "77 GHz は約 0.4 dB/km", "start", 10, GRN, True),
    T(400, 306, "60 GHz は遠くへ届かない——逆に「部屋の外へ漏れない」ことが屋内用途では利点になる（17 章）",
      "middle", 10.5, MUT),
], "酸素分子が 60 GHz 付近の電波を選択的に吸収する。車載の 77 GHz は谷間にあり、数百 m では実質無視できる")

F["r02_db"] = SVG(820, 320, [
    T(410, 26, "デシベル — 桁違いの掛け算を足し算に変える", "middle", 12.5, INK, True),
    T(210, 56, "比の階段", "middle", 11.5, INK, True),
] + [
    RECT(80, 200 - i * 34, 130 + i * 30, 28, 4, SSOFT, SIG, 1.2)
    for i in range(4)
] + [
    T(90, 219 - i * 34, lab, "start", 10.5, INK, True)
    for i, lab in enumerate(["×1 = 0 dB", "×2 = +3 dB", "×10 = +10 dB", "×100 = +20 dB"])
] + [
    T(210, 268, "掛け算 → dB の足し算", "middle", 10.5, MUT),
    T(210, 286, "「1000 倍の 2 倍」= 30 + 3 = 33 dB", "middle", 10.5, MUT),
    T(600, 56, "dBm 物差し（1 mW 基準）", "middle", 11.5, INK, True),
    W(600, 80, 600, 250, c=LIN, lw=2),
] + [
    W(592, 80 + i * 42.5, 608, 80 + i * 42.5, c=MUT, lw=1.4)
    for i in range(5)
] + [
    T(616, 84 + i * 42.5, lab, "start", 10, INK)
    for i, lab in enumerate(["+30 dBm = 1 W", "+10 dBm = 10 mW（車載の送信）", "0 dBm = 1 mW",
                             "−60 dBm = 1 nW", "−120 dBm = 1 fW（微弱なエコー）"])
] + [
    T(410, 310, "dBi はアンテナ利得の dB（等方性アンテナ基準）。dBsm は RCS の dB（1 m² 基準、04 章）",
      "middle", 10, FNT),
], "送信 1 W とエコー 1 fW——10¹⁵ 倍違う量を同じ表で扱うための共通言語。3 dB = 2 倍だけは体に入れる")

# ===================== 03. レーダー方程式 =====================

F["r03_steps"] = SVG(860, 474, [
    T(430, 26, "レーダー方程式の 5 歩", "middle", 12.5, INK, True),
    flowdown(430, 48, [
        ("① 等方放射で薄まる", "S₀ = Pt / 4πR²   ——球面に塗り広げ", LIN, PAN),
        ("② アンテナで集中", "S₁ = Pt G / 4πR²   ——利得 G 倍", LIN, PAN),
        ("③ 目標が受けて撒き散らす", "Pσ = S₁ · σ   ——σ が RCS（04 章）", SIG, SSOFT),
        ("④ 帰り道でもう一度薄まる", "S₂ = Pσ / 4πR²   ——ここで R⁴ が完成", ALI, ASOFT),
        ("⑤ 開口 Ae で掬い取る", "Pr = S₂ · Ae,   Ae = Gλ²/4π（11 章）", LIN, PAN),
    ], 480, 52, 18)[0],
    BOX(190, 402, 480, 46, "Pr = Pt G² λ² σ / ( (4π)³ R⁴ )", None, SIG, SSOFT, INK, 8, 1.8, 14, 10, None, True),
], "行きの拡散・集中・反射・帰りの拡散・受信——5 つの掛け算を並べただけで、覚える式ではなく組み立てる式である")

F["r03_r4"] = SVG(800, 320, [
    T(400, 26, "R⁴ の壁 — 距離 2 倍で 1/16（−12 dB）", "middle", 12.5, INK, True),
    AXES(100, 260, 620, 200, "距離 R（対数）", "受信電力 [dB]"),
    PL([(100 + 620 * u, 92 + 150 * u) for u in [i / 50 for i in range(51)]], SIG, 2.2),
    D(255, 129.5, INK, 4.5), D(410, 167, INK, 4.5),
    T(255, 116, "R", "middle", 10.5, INK, True), T(410, 186, "2R", "middle", 10.5, INK, True),
    W(255, 129.5, 410, 129.5, c=FNT, lw=1.1, dash="3 4"),
    DARR(410, 133, 410, 163, ALI, 1.4, 5),
    T(424, 152, "−12 dB", "start", 10.5, ALI, True),
    T(400, 292, "傾きは片道通信（1/R²）の 2 倍。探知距離を 2 倍にするには全体で 16 倍（+12 dB）の改善が要る",
      "middle", 10.5, MUT),
    T(400, 310, "送信電力 2 倍では距離は 2^(1/4) = 1.19 倍——19 % しか伸びない", "middle", 10.5, ALI, True),
], "行きで R²、帰りで R²。レーダーが「絶望的に弱い信号を拾う技術」である根源がこの 4 乗である")

F["r03_budget"] = SVG(840, 360, [
    T(420, 26, "リンクバジェット — dB の足し算で収支を見る（77 GHz・R=150 m・σ=10 m²）", "middle", 12.2, INK, True),
] + [
    # ウォーターフォール: (label, y_from, y_to, color)
    RECT(70, 60, 90, 24, 3, SSOFT, SIG, 1.3), T(115, 76, "+10 dBm", "middle", 9.5, INK, True),
    T(115, 100, "送信電力", "middle", 9.5, MUT),
    RECT(190, 44, 90, 40, 3, SSOFT, SIG, 1.3), T(235, 68, "+25 dB", "middle", 9.5, INK, True),
    T(235, 100, "TX 利得", "middle", 9.5, MUT),
    RECT(310, 44, 110, 210, 3, ASOFT, ALI, 1.3), T(365, 150, "−155 dB", "middle", 10.5, ALI, True),
    T(365, 270, "拡散往復＋RCS", "middle", 9.5, MUT),
    RECT(450, 214, 90, 40, 3, SSOFT, SIG, 1.3), T(495, 238, "+25 dB", "middle", 9.5, INK, True),
    T(495, 270, "RX 利得", "middle", 9.5, MUT),
    RECT(570, 214, 100, 24, 3, PAN, INK, 1.5), T(620, 230, "−95 dBm", "middle", 9.8, INK, True),
    T(620, 270, "受信電力", "middle", 9.5, MUT),
    W(60, 300, 800, 300, c=ALI, lw=1.6, dash="6 4"),
    T(796, 292, "雑音 −100 dBm（kTB+NF）", "end", 9.8, ALI, True),
    DARR(720, 238, 720, 296, GRN, 1.5, 5),
    T(736, 272, "SNR +5 dB", "start", 10.5, GRN, True),
    T(420, 336, "検出には 13 dB 程度が要る——足りない分は積分（コヒーレント加算）で稼ぐ。09 章の FFT がその実行役",
      "middle", 10.5, MUT),
], "電力の旅を dB で並べた収支表。どの行を何 dB 改善できるかが、そのまま設計の選択肢一覧になる")

# ===================== 04. RCS =====================

F["r04_def"] = SVG(820, 300, [
    T(410, 26, "RCS の定義 — 等方に散らしたと仮定した捕獲面積", "middle", 12.5, INK, True),
    W(60, 100, 300, 100, c=SIG, lw=1.8), W(60, 130, 300, 130, c=SIG, lw=1.8),
    W(60, 160, 300, 160, c=SIG, lw=1.8),
    ARR(300, 130, 336, 130, SIG, 1.8),
    T(180, 86, "入射電力密度 S入射", "middle", 10.5, SIG, True),
    CIRC(400, 130, 34, INK, 2, SCR),
    T(400, 135, "目標", "middle", 11, INK, True),
] + [
    ARR(400 + 46 * math.cos(a), 130 + 46 * math.sin(a),
        400 + 78 * math.cos(a), 130 + 78 * math.sin(a), GRN, 1.3, 5)
    for a in [i * math.pi / 4 for i in range(8)]
] + [
    T(400, 232, "等方に散乱したと「仮定」する", "middle", 10, GRN, True),
    BOX(560, 84, 230, 92, "σ = 4πR² · S戻り / S入射",
        "帰りの拡散を巻き戻すので、σ は距離に依存しない目標固有の量になる", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    T(410, 284, "単位は m²。dB では 1 m² 基準の dBsm。実面積ではなく「返しやすさ」の指標である",
      "middle", 10.5, MUT),
], "「レーダーへ返ってきた強さ」を説明できるだけの面積を持つ等方散乱体に置き換えたら何 m² か、という定義")

F["r04_shapes"] = SVG(840, 330, [
    T(420, 26, "3 つの基本形 — 球・平板・コーナーリフレクタ", "middle", 12.5, INK, True),
    # 球
    CIRC(160, 130, 40, INK, 2, SCR),
    T(160, 210, "球: σ = πa²", "middle", 11, INK, True),
    T(160, 230, "向きに依存しない", "middle", 9.5, MUT),
    T(160, 244, "→ 校正の基準", "middle", 9.5, SIG),
    # 平板
    W(400, 90, 400, 170, c=INK, lw=4),
    ARR(340, 130, 392, 130, SIG, 1.6),
    ARR(408, 130, 460, 130, GRN, 1.6),
    T(430, 210, "平板: σ = 4πA²/λ²", "middle", 11, INK, True),
    T(430, 230, "正対で巨大（10 cm 角 ≈ 車 1 台分）", "middle", 9.5, MUT),
    T(430, 244, "数度傾くと急落", "middle", 9.5, ALI),
    # コーナー
    W(640, 170, 700, 130, c=INK, lw=3), W(700, 130, 760, 170, c=INK, lw=3),
    W(700, 130, 700, 74, c=INK, lw=3),
    W(650, 158, 690, 132, c=SIG, lw=1.4), W(690, 132, 736, 158, c=GRN, lw=1.4),
    ARR(736, 158, 664, 166, GRN, 1.4, 6),
    T(700, 210, "コーナー: 3 回反射で", "middle", 11, INK, True),
    T(700, 228, "来た方向へ正確に返す", "middle", 11, INK, True),
    T(700, 246, "広い角度で強い → 試験・校正用", "middle", 9.5, SIG),
    T(420, 292, "平板の式の分母に λ² がある——波長が短いほど同じ板が「大きく」見える。ミリ波で小物が光る理由",
      "middle", 10.5, MUT),
], "実面積が同じでも RCS は形で桁違いになる。校正には向きに鈍感な球とコーナーリフレクタを使う")

F["r04_aspect"] = SVG(820, 300, [
    T(410, 26, "アスペクト角依存 — RCS はギザギザに揺れる", "middle", 12.5, INK, True),
    AXES(80, 230, 660, 170, "見る角度（アスペクト角）", "RCS [dBsm]"),
] + [
    PL([(80 + 660 * u,
         230 - 90 - 28 * math.sin(24 * math.pi * u + 1.2) * math.sin(7 * math.pi * u)
         - 24 * math.sin(66 * math.pi * u + 0.4) + 34 * abs(math.sin(3.3 * u + 0.6)))
        for u in [i / 300 for i in range(301)]], SIG, 1.6)
] + [
    W(80, 140, 740, 140, c=ALI, lw=1.4, dash="6 4"),
    T(736, 130, "角度平均（カタログ値）", "end", 10, ALI, True),
    T(410, 262, "多数の反射点からのエコーが位相干渉するため、数度の違いで数十 dB 変動する",
      "middle", 10.5, MUT),
    T(410, 282, "「乗用車 = 10 dBsm」は平均値。最悪の向きは 10〜20 dB 低いと見込んで設計する", "middle", 10.5, ALI, True),
], "実目標は反射点の集合体。強め合いと打ち消しが角度とともに入れ替わり、RCS は 1 つの数字では書けない")

F["r04_swerling"] = SVG(840, 300, [
    T(420, 26, "スワリングモデル — 揺らぎを確率として扱う", "middle", 12.5, INK, True),
] + [
    # 3 パネル: Sw0 / Sw1 / Sw3
    RECT(40 + i * 270, 52, 250, 150, 8, SCR, LIN, 1.2) for i in range(3)
] + [
    T(165, 74, "Swerling 0（揺れない）", "middle", 10.5, INK, True),
    PL([(60 + 210 * u, 150 - 30) for u in [i / 40 for i in range(41)]], SIG, 1.8),
    T(435, 74, "Swerling 1/2（大きく揺れる）", "middle", 10.5, INK, True),
    PL([(330 + 210 * u, 150 - 34 * abs(math.sin(9 * u + 0.4) * math.sin(23 * u + 1.9)) - 6)
        for u in [i / 120 for i in range(121)]], SIG, 1.6),
    T(705, 74, "Swerling 3/4（穏やかに揺れる）", "middle", 10.5, INK, True),
    PL([(600 + 210 * u, 150 - 24 - 12 * math.sin(11 * u + 0.8) * math.sin(5 * u))
        for u in [i / 120 for i in range(121)]], SIG, 1.6),
] + [
    W(60, 168, 270, 168, c=ALI, lw=1.2, dash="4 4"),
    W(330, 168, 540, 168, c=ALI, lw=1.2, dash="4 4"),
    W(600, 168, 810, 168, c=ALI, lw=1.2, dash="4 4"),
    T(165, 190, "校正球・リフレクタ", "middle", 9.5, MUT),
    T(435, 190, "多数の同格な反射点（複雑形状）", "middle", 9.5, MUT),
    T(705, 190, "支配的な 1 点＋小物", "middle", 9.5, MUT),
    T(420, 236, "破線＝検出しきい値。揺れる目標は「たまたま暗い瞬間」に当たると見逃す", "middle", 10.5, MUT),
    T(420, 258, "→ 同じ検出確率を出すには、揺れない目標より数 dB〜10 dB 余分な SN 比が要る（13 章）",
      "middle", 10.5, ALI, True),
], "RCS の時間変動を確率モデルで分類したもの。実務への含意は「揺らぐ目標にはマージンを積む」の一点である")

# ===================== 05. パルスレーダー =====================

def pulse_train(x0, y, w, n, duty, amp, c=SIG, lw=1.8):
    """方形パルス列"""
    o = []
    per = w / n
    pts = [(x0, y)]
    for i in range(n):
        xs = x0 + i * per
        pts += [(xs, y), (xs, y - amp), (xs + per * duty, y - amp), (xs + per * duty, y)]
    pts.append((x0 + w, y))
    return PL(pts, c, lw)

F["r05_train"] = SVG(840, 300, [
    T(420, 26, "パルス列とエコー", "middle", 12.5, INK, True),
    T(48, 92, "送信", "middle", 10.5, MUT, True),
    pulse_train(90, 110, 700, 3, 0.09, 52, SIG, 2),
    DARR(90, 124, 111, 124, MUT, 1.2, 4), T(100, 143, "τp", "middle", 10, SIG, True),
    DARR(90, 160, 323, 160, MUT, 1.3, 5), T(206, 152, "PRI = 1/PRF", "middle", 10.5, INK, True),
    T(48, 216, "受信", "middle", 10.5, MUT, True),
    gauss_pulse(90, 232, 233, 0.55, 0.045, 30, GRN),
    gauss_pulse(323, 232, 233, 0.55, 0.045, 30, GRN),
    gauss_pulse(556, 232, 234, 0.55, 0.045, 30, GRN),
    DARR(96, 246, 218, 246, MUT, 1.2, 5), T(157, 264, "τ = 2R/c", "middle", 10, GRN, True),
    T(420, 290, "打つ → 沈黙して聴く → また打つ。エコーの遅れ τ が距離になる", "middle", 10.5, MUT),
], "パルス幅 τp が「1 発の長さ」、PRI が「打つ間隔」。この 2 つがそれぞれ分解能と最大距離を決める")

F["r05_res"] = SVG(840, 330, [
    T(420, 26, "距離分解能 — エコーが重ならない条件", "middle", 12.5, INK, True),
    T(210, 56, "間隔が広い（ΔR > cτp/2）", "middle", 11, GRN, True),
    gauss_pulse(60, 130, 300, 0.32, 0.06, 52, GRN, 2),
    gauss_pulse(60, 130, 300, 0.68, 0.06, 52, GRN, 2),
    T(156, 148, "目標 1", "middle", 9.5, MUT), T(264, 148, "目標 2", "middle", 9.5, MUT),
    T(210, 170, "2 つの山に分かれる", "middle", 10, MUT),
    T(630, 56, "間隔が狭い（ΔR < cτp/2）", "middle", 11, ALI, True),
] + [
    PL([(480 + 300 * u, 130 - 52 * (math.exp(-((u - 0.44) / 0.06) ** 2) + math.exp(-((u - 0.55) / 0.06) ** 2)) * 0.7)
        for u in [i / 150 for i in range(151)]], ALI, 2)
] + [
    T(630, 170, "1 本に融合——分離できない", "middle", 10, ALI, True),
    BOX(240, 210, 360, 52, "ΔR = c τp / 2", "パルスは空間では長さ cτp の「棒」。その半分が限界", SIG, SSOFT, INK, 8, 1.7, 14, 9.5),
    T(420, 296, "τp = 1 µs → 150 m。細かく見たければ短いパルス——だがエネルギーが減る（06 章のジレンマ）",
      "middle", 10.5, MUT),
], "後ろのエコーの先頭が、前のエコーの尻尾より遅く着けば分離できる。境目が cτp/2 である")

F["r05_blind"] = SVG(800, 260, [
    T(400, 26, "ブラインドレンジ — 送信中は聴けない", "middle", 12.5, INK, True),
    RECT(90, 60, 90, 60, 4, SSOFT, SIG, 1.6),
    T(135, 95, "送信中", "middle", 10.5, SIG, True),
    RECT(180, 60, 540, 60, 4, SCR, LIN, 1.2),
    T(590, 95, "受信できる時間", "middle", 10.5, MUT),
    gauss_pulse(90, 118, 200, 0.35, 0.05, 34, ALI, 1.8),
    T(160, 140, "近すぎるエコー（消失）", "middle", 9.5, ALI, True),
    gauss_pulse(300, 118, 300, 0.5, 0.04, 34, GRN, 1.8),
    T(450, 140, "受かるエコー", "middle", 9.5, GRN, True),
    BOX(240, 176, 320, 44, "Rmin = c τp / 2", "τp = 1 µs なら手前 150 m が死角", ALI, ASOFT, INK, 8, 1.5, 13, 9.5),
    T(400, 248, "長距離用の長いパルスと近距離用の短いパルスを交互に打って死角を埋める設計もある", "middle", 10, FNT),
], "強大な送信波から受信機を守るため、送信の間は受信を切り離す。その時間ぶんの近距離が見えない")

F["r05_amb"] = SVG(840, 330, [
    T(420, 26, "距離の曖昧さ — 前のパルスへの返事が化ける", "middle", 12.5, INK, True),
    T(50, 80, "送信", "start", 10.5, MUT, True),
    pulse_train(110, 96, 660, 2, 0.05, 44, SIG, 2),
    T(126, 116, "パルス 1", "middle", 9.5, MUT), T(456, 116, "パルス 2", "middle", 9.5, MUT),
    T(50, 172, "受信", "start", 10.5, MUT, True),
    gauss_pulse(110, 188, 660, 0.62, 0.022, 36, GRN, 2),
    T(519, 208, "遠い目標のエコー（パルス 1 への返事）", "middle", 9.5, GRN, True),
    W(440, 60, 440, 200, c=FNT, lw=1.1, dash="4 5"),
    ARR(470, 232, 522, 200, ALI, 1.5),
    T(430, 246, "レーダーは「パルス 2 の直後」と誤読 → 近距離の偽目標", "middle", 10.5, ALI, True),
    BOX(230, 264, 380, 44, "Rua = c / (2 PRF)", "これより遠くは折り返して見える", SIG, SSOFT, INK, 8, 1.6, 13.5, 9.5),
    T(420, 322, "対策: PRF を切り替える——本物は動かず、折り返しの偽目標だけ見かけの距離が動く", "middle", 10, FNT),
], "エコーがどのパルスへの返事か分からなくなる。サンプリングの折り返し（エイリアシング）と同じ構造である")

F["r05_duty"] = SVG(800, 260, [
    T(400, 26, "デューティ比 — ピークと平均のギャップ", "middle", 12.5, INK, True),
    pulse_train(90, 170, 620, 4, 0.07, 110, SIG, 2),
    W(90, 162, 710, 162, c=ALI, lw=1.6, dash="6 4"),
    T(716, 166, "平均電力", "start", 10, ALI, True),
    T(140, 46, "ピーク電力 Pt", "middle", 10.5, SIG, True),
    ARR(140, 52, 122, 62, SIG, 1.3, 5),
    BOX(240, 196, 320, 44, "Pavg = Pt × τp × PRF", "デューティ 0.1 % なら ピーク 1 MW → 平均 1 kW", GRN, PAN, INK, 8, 1.5, 12.5, 9.5),
], "検出を決めるのはピークではなくエネルギー（電力×時間）。ここから「長いパルスが欲しい」が始まる")

# ===================== 06. パルス圧縮 =====================

F["r06_dilemma"] = SVG(840, 300, [
    T(420, 26, "長さとエネルギーのジレンマ", "middle", 12.5, INK, True),
    RECT(40, 52, 360, 170, 10, SCR, LIN, 1.3),
    T(220, 76, "短いパルス", "middle", 11.5, INK, True),
    pulse_train(90, 150, 120, 1, 0.18, 60, SIG, 2),
    T(220, 176, "分解能 ◎   エネルギー ×", "middle", 10.5, MUT),
    T(220, 198, "遠くの目標が雑音に沈む", "middle", 10, ALI),
    RECT(440, 52, 360, 170, 10, SCR, LIN, 1.3),
    T(620, 76, "長いパルス", "middle", 11.5, INK, True),
    pulse_train(480, 150, 240, 1, 0.75, 60, SIG, 2),
    T(620, 176, "エネルギー ◎   分解能 ×", "middle", 10.5, MUT),
    T(620, 198, "150 m の「棒」で全部つながる", "middle", 10, ALI),
    BOX(250, 240, 340, 44, "パルス圧縮", "長いパルスに変調を仕込み、受信後に数学で潰す", GRN, PAN, INK, 8, 1.6, 13, 9.5),
    ARR(220, 226, 330, 240, MUT, 1.5), ARR(620, 226, 510, 240, MUT, 1.5),
], "ピーク電力は法規と部品で頭打ち。「長さで稼いで、処理で細かくする」のが正解になる")

F["r06_mf"] = SVG(840, 300, [
    T(420, 26, "整合フィルタ — 既知の波形を相関で探す", "middle", 12.5, INK, True),
] + [
    PL([(40 + 300 * u, 110 - 26 * math.sin(2 * math.pi * (3 * u + 9 * u * u)) *
         (1 if 0.15 < u < 0.75 else 0) - 9 * math.sin(37 * u + 1.3) - 5 * math.sin(61 * u))
        for u in [i / 400 for i in range(401)]], MUT, 1.2)
] + [
    T(190, 56, "受信信号（雑音まみれ）", "middle", 10.5, MUT, True),
    BOX(390, 84, 180, 56, "相関器", "s*(u−t) を掛けて積分", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(344, 112, 386, 112, MUT, 1.6), ARR(570, 112, 612, 112, MUT, 1.6),
    PL([(620, 130), (650, 130), (664, 62), (678, 130), (800, 130)], GRN, 2),
    T(710, 56, "鋭いピーク", "middle", 10.5, GRN, True),
    T(664, 148, "位置 = 遅れ時間 τ", "middle", 9.5, MUT),
    BOX(150, 200, 540, 44, "SNRpeak = 2E / N₀", "白色雑音下で SN 比最大。効くのはエネルギー E だけで、波形の形は無関係",
        SIG, SSOFT, INK, 8, 1.6, 13, 9.5),
    T(420, 284, "テンプレートマッチングと同じ発想——「自分が送った形」を知っているのがレーダーの強み", "middle", 10.5, MUT),
], "受信信号に送信波形の複製を重ねてずらしながら照合する。一致した瞬間だけ大きな値が立つ")

F["r06_chirp"] = SVG(840, 330, [
    T(420, 26, "チャープ（LFM）とその圧縮", "middle", 12.5, INK, True),
    T(210, 54, "送信: 周波数を滑らせた長いパルス", "middle", 10.5, INK, True),
    chirpw(50, 110, 330, 2, 12, 34, SIG, 1.6),
    ARR(50, 160, 380, 160, MUT, 1.4), T(376, 176, "t", "middle", 9.5, FNT),
    PL([(50, 156), (380, 130)], GRN, 1.6, "5 4"),
    T(214, 122, "f: f₀ → f₀+B", "middle", 9.5, GRN, True),
    T(630, 54, "整合フィルタ後: 幅 1/B に圧縮", "middle", 10.5, INK, True),
    PL([(470, 150), (600, 150), (622, 66), (644, 150), (790, 150)], GRN, 2.2),
    DARR(614, 160, 630, 160, MUT, 1.1, 4), T(622, 178, "1/B", "middle", 9.5, MUT, True),
    BOX(190, 220, 460, 48, "圧縮率 = SN 比利得 = τp·B（TB 積）",
        "τp=100 µs・B=10 MHz なら 1000 倍＝30 dB を信号処理で獲得", SIG, SSOFT, INK, 8, 1.6, 13, 9.5),
    T(420, 302, "パルスの長さ（エネルギー）と帯域（分解能）を独立に設計できるようになった", "middle", 10.5, MUT),
], "小鳥のさえずりのように音程が滑る波形。受信後の相関で、長さ τp のエコーが幅 1/B のピークに潰れる")

F["r06_sidelobe"] = SVG(820, 320, [
    T(410, 26, "サイドローブ — 強い目標が弱い目標を隠す", "middle", 12.5, INK, True),
    AXES(80, 240, 660, 180, "距離", "出力 [dB]"),
] + [
    # sinc メイン+サイドローブ（dB 風の折れ線）
    PL([(80 + 660 * u, 240 - max(4, 170 * math.exp(-((u - 0.4) / 0.018) ** 2)
        + 62 * math.exp(-((u - 0.345) / 0.012) ** 2) + 62 * math.exp(-((u - 0.455) / 0.012) ** 2)
        + 46 * math.exp(-((u - 0.30) / 0.011) ** 2) + 46 * math.exp(-((u - 0.50) / 0.011) ** 2)
        + 36 * math.exp(-((u - 0.26) / 0.010) ** 2) + 36 * math.exp(-((u - 0.545) / 0.010) ** 2)
        + 78 * math.exp(-((u - 0.62) / 0.014) ** 2)))
        for u in [i / 400 for i in range(401)]], SIG, 1.8)
] + [
    T(344, 66, "強い目標（車）", "middle", 10.5, SIG, True),
    W(80, 178, 740, 178, c=FNT, lw=1.1, dash="3 5"),
    T(736, 172, "−13 dB", "end", 9.5, FNT),
    ARR(506, 130, 494, 156, ALI, 1.5),
    T(520, 120, "弱い目標（歩行者）はサイドローブに埋まる", "start", 10, ALI, True),
    T(410, 272, "対策は窓（テーパ）: ハミング窓で −43 dB。代償はピーク幅 1.5 倍と SN 比 −1.4 dB",
      "middle", 10.5, MUT),
    T(410, 292, "時間窓・圧縮窓・アンテナのテーパ——同じトレードオフが 3 つの顔で現れる（09・11 章）",
      "middle", 10, FNT),
], "矩形のまま圧縮すると sinc 状の裾が −13 dB に立つ。20 dB 弱い隣接目標はこの裾に沈む")

F["r06_barker"] = SVG(820, 330, [
    T(410, 26, "位相符号（バーカー 13）", "middle", 12.5, INK, True),
    T(70, 66, "符号:", "start", 10.5, MUT, True),
] + [
    RECT(130 + i * 42, 50, 40, 26, 3, SSOFT if b > 0 else ASOFT, SIG if b > 0 else ALI, 1.2)
    for i, b in enumerate([1,1,1,1,1,-1,-1,1,1,-1,1,-1,1])
] + [
    T(150 + i * 42, 68, "+" if b > 0 else "−", "middle", 12, SIG if b > 0 else ALI, True)
    for i, b in enumerate([1,1,1,1,1,-1,-1,1,1,-1,1,-1,1])
] + [
    T(410, 100, "各チップの位相を 0°/180° で反転させる（+/−）", "middle", 10, MUT),
    T(120, 190, "自己相関:", "start", 10.5, MUT, True),
    PL([(150, 252)] + [(150 + 520 * (i / 24), 252 - (13 if i == 12 else (1 if (12 - i) % 2 == 0 else 0)) * 9)
        for i in range(25)] + [(670, 252)], SIG, 1.8),
    T(410, 280, "中央だけ 13、脇は高々 1 —— サイドローブ −22.3 dB", "middle", 10.5, SIG, True),
    T(410, 312, "相互相関の低い符号ペアは同時に送っても分離できる——MIMO（10 章）と干渉対策（14 章）の伏線",
      "middle", 10, FNT),
], "チャープ以外の圧縮波形の代表。符号の設計次第で「混ざっても見分けられる」波を作れる")

# ===================== 07. ドップラー =====================

F["r07_wave"] = SVG(820, 300, [
    T(410, 26, "動く目標は波面を詰める", "middle", 12.5, INK, True),
    radar_icon(90, 150),
] + [
    CIRC(556 + (r - 24) * 0.32, 130, r, GRN, 1.5) for r in (24, 52, 80, 108)
] + [
    car_icon(556, 122, 0.9),
    ARR(556, 88, 496, 88, INK, 1.8), T(524, 76, "v", "middle", 11, INK, True),
] + [
    T(410, 250, "目標が波を「追いかけながら」反射するため、レーダー側（左）の波面間隔が詰まる", "middle", 10.5, MUT),
    T(410, 272, "行きの受け取りで 1 回、帰りの送り出しで 1 回——合計 2 回、だから f_d = 2v/λ", "middle", 10.5, SIG, True),
], "円弧がエコーの波面。近づく目標の左側（レーダー側）では間隔が狭い＝波長が縮む＝周波数が上がる")

F["r07_phase"] = SVG(820, 300, [
    T(410, 26, "位相の導出 — φ = −4πR/λ の時間微分", "middle", 12.5, INK, True),
    CIRC(190, 150, 78, LIN, 1.6),
    W(190, 150, 190 + 78 * math.cos(-0.7), 150 + 78 * math.sin(-0.7), c=SIG, lw=2.4),
    ARR(190 + 82 * math.cos(-1.05), 150 + 82 * math.sin(-1.05),
        190 + 82 * math.cos(-1.45), 150 + 82 * math.sin(-1.45), SIG, 1.6, 6),
    T(190, 258, "エコーの複素数（フェーザ）", "middle", 10.5, MUT),
    T(190, 276, "R が縮む → 位相が回る", "middle", 10, SIG, True),
    BOX(360, 66, 420, 54, "φ(t) = −4π R(t) / λ", "往復 2R を波長で測った角度（遅れ）", LIN, PAN, INK, 8, 1.5, 13, 9.5, None, True),
    BOX(360, 134, 420, 54, "R(t) = R₀ − v t を代入して微分", "位相の回転速度 ÷ 2π が周波数", LIN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(360, 202, 420, 54, "f_d = 2v / λ", "77 GHz: 1 m/s → 513 Hz、30 m/s → 15.4 kHz", SIG, SSOFT, INK, 8, 1.8, 14, 9.5, None, True),
    ARR(570, 120, 570, 130, MUT, 1.5), ARR(570, 188, 570, 198, MUT, 1.5),
], "「距離が λ/2 縮むごとに位相が 1 回転する」と読める。位相は距離のミクロン級の変化まで感じる物差しである")

F["r07_radial"] = SVG(800, 280, [
    T(400, 26, "見えるのは視線方向の成分だけ", "middle", 12.5, INK, True),
    radar_icon(110, 160),
    car_icon(560, 130, 1.0),
    W(150, 138, 520, 138, c=FNT, lw=1.2, dash="5 5"),
    ARR(560, 122, 640, 74, INK, 2), T(650, 66, "v（実際の速度）", "start", 10.5, INK, True),
    ARR(560, 122, 640, 122, SIG, 2), T(650, 126, "v·cosα（見える成分）", "start", 10.5, SIG, True),
    ARR(560, 122, 560, 74, FNT, 1.4), T(552, 64, "見えない成分", "end", 9.5, FNT),
    '<path d="M 600 122 A 40 40 0 0 0 592 103" fill="none" stroke="%s" stroke-width="1.3"/>' % MUT,
    T(610, 104, "α", "middle", 10.5, MUT, True),
    T(400, 232, "ドップラーが感じるのは「距離の変化率」だけ。真横に横切る目標（α=90°）はドップラー 0",
      "middle", 10.5, MUT),
    T(400, 254, "本当の速度ベクトルは、角度測定（10 章）や追尾（15 章）と組み合わせて初めて得られる",
      "middle", 10, FNT),
], "レーダーに向かう成分（ラジアル速度）だけが周波数に現れる。横切りは速度上、静止物と区別できない")

F["r07_pulses"] = SVG(860, 320, [
    T(430, 26, "パルス間の位相回転 — 速度の実際の測り方", "middle", 12.5, INK, True),
    pulse_train(70, 90, 720, 6, 0.08, 40, SIG, 1.8),
    T(430, 112, "PRI = T ごとに打つ", "middle", 9.5, MUT),
] + [
    CIRC(130 + i * 120, 190, 34, LIN, 1.4) for i in range(6)
] + [
    ARR(130 + i * 120, 190,
        130 + i * 120 + 30 * math.cos(-math.pi/2 + i * 0.94),
        190 + 30 * math.sin(-math.pi/2 + i * 0.94), GRN, 2, 6)
    for i in range(6)
] + [
    T(130 + i * 120, 242, "n=%d" % i, "middle", 9.5, FNT) for i in range(6)
] + [
    T(430, 270, "各パルスのエコーの複素数を並べると、1 パルスごとに Δφ = 4πvT/λ ずつ回る等速回転",
      "middle", 10.5, INK, True),
    T(430, 292, "＝「PRF でサンプルされた周波数 f_d の正弦波」——FFT で読める（09 章のドップラー FFT）",
      "middle", 10.5, SIG, True),
], "1 発の中では 5° しか回らない位相が、パルスを跨ぐと 1 発ごとに数十° 回る。速度は「パルス間」で測る")

F["r07_alias"] = SVG(820, 300, [
    T(410, 26, "速度の折り返し — 位相は ±180° まで", "middle", 12.5, INK, True),
    CIRC(200, 150, 72, LIN, 1.5),
    ARR(200, 150, 200 + 64 * math.cos(-math.pi/2), 150 + 64 * math.sin(-math.pi/2), FNT, 1.6, 6),
    ARR(200, 150, 200 + 64 * math.cos(-math.pi/2 + 2.4), 150 + 64 * math.sin(-math.pi/2 + 2.4), GRN, 2, 7),
    '<path d="M 200 92 A 58 58 0 0 1 %g %g" fill="none" stroke="%s" stroke-width="1.6"/>'
      % (200 + 58 * math.cos(-math.pi/2 + 2.4), 150 + 58 * math.sin(-math.pi/2 + 2.4), GRN),
    T(286, 118, "+137°", "middle", 10, GRN, True),
    '<path d="M 200 92 A 58 58 0 0 0 %g %g" fill="none" stroke="%s" stroke-width="1.4" stroke-dasharray="4 4"/>'
      % (200 + 58 * math.cos(-math.pi/2 - 2.4), 150 + 58 * math.sin(-math.pi/2 - 2.4), ALI),
    T(116, 118, "−223°?", "middle", 10, ALI, True),
    T(200, 252, "1 回転引いても同じ位置——区別できない", "middle", 10, MUT),
    BOX(420, 84, 360, 56, "v_max = λ / (4T)", "|Δφ| ≤ π ⇔ |f_d| ≤ PRF/2 の言い換え", SIG, SSOFT, INK, 8, 1.7, 13.5, 9.5),
    BOX(420, 156, 360, 66, "R_ua × v_max = cλ / 8 = 一定",
        "距離範囲と速度範囲はトレードオフ。PRF は配分のつまみにすぎない", ALI, ASOFT, INK, 8, 1.5, 12.5, 9.5),
    T(410, 282, "超えた速度は反対側に折り返す——映画で車輪が逆回転して見える現象と同じ", "middle", 10.5, MUT),
], "1 サンプル（1 パルス）あたり半回転を超える回転は向きが曖昧になる。速度にも標本化の上限（ナイキスト限界、DSP シリーズ 02 章）がある")

# ===================== 08. FMCW =====================

F["r08_cw"] = SVG(820, 280, [
    T(410, 26, "CW レーダー — 最小構成、ただし距離は測れない", "middle", 12.5, INK, True),
    BOX(50, 70, 160, 50, "発振器 f₀", "単一周波数を出し続ける", SIG, SSOFT),
    BOX(50, 170, 160, 50, "ミキサ", "差の周波数を取り出す", LIN, PAN),
    BOX(280, 120, 110, 50, "アンテナ", None, GRN, PAN),
    car_icon(650, 148, 1.0),
    ARR(210, 95, 300, 122, MUT, 1.5),
    ARR(316, 172, 210, 188, MUT, 1.5),
    ARR(390, 136, 610, 136, SIG, 1.7), ARR(610, 158, 390, 158, GRN, 1.7),
    W(130, 120, 130, 166, c=MUT, lw=1.4), T(142, 148, "参照（ローカル信号）", "start", 9, FNT),
    BOX(280, 208, 260, 44, "出力 = f_d = 2v/λ だけ", "速度計として完成。スピードガンがこれ", GRN, PAN, INK, 8, 1.4, 12, 9.5),
    ARR(210, 202, 276, 220, MUT, 1.4),
    T(410, 272, "一定の正弦波はどこを切っても同じ形——「いつ送った波か」の目印がなく、距離情報がゼロ", "middle", 10.5, ALI),
], "電波を出しっぱなしにしてドップラーだけ読む。距離を測るには波に「時間の目印」を刻む必要がある")

F["r08_chirp"] = SVG(820, 300, [
    T(410, 26, "FMCW のチャープ — 周波数の斜め線", "middle", 12.5, INK, True),
    AXES(90, 230, 640, 170, "時間 t", "周波数 f"),
] + [
    PL([(90 + i * 200, 220), (90 + (i + 1) * 200, 90)], SIG, 2.2) for i in range(3)
] + [
    W(90, 220, 730, 220, c=FNT, lw=1, dash="2 5"),
    T(78, 224, "f₀", "end", 10, MUT, True),
    W(90, 90, 730, 90, c=FNT, lw=1, dash="2 5"),
    T(78, 94, "f₀+B", "end", 10, MUT, True),
    DARR(90, 246, 290, 246, MUT, 1.3, 5), T(190, 264, "T_c", "middle", 10.5, INK, True),
    DARR(310, 220, 310, 90, MUT, 1.3, 5), T(324, 158, "B", "start", 10.5, INK, True),
    T(214, 130, "傾き S = B/T_c", "middle", 10.5, SIG, True),
    T(410, 292, "例: B = 1 GHz を T_c = 50 µs で掃く → S = 20 MHz/µs。傾きが「時間の目印」になる",
      "middle", 10.5, MUT),
], "周波数を一定の速さで滑らせ続ける。のこぎり波状に繰り返す 1 本 1 本がチャープである")

F["r08_beat"] = SVG(840, 380, [
    T(420, 26, "ビート周波数の導出 — 2 本の斜め線の縦差", "middle", 12.5, INK, True),
    AXES(90, 220, 660, 160, "t", "f"),
    PL([(110, 210), (500, 84)], SIG, 2.2), T(210, 118, "送信", "middle", 10.5, SIG, True),
    PL([(190, 210), (580, 84)], GRN, 2.2), T(560, 130, "受信（τ 遅れ）", "middle", 10.5, GRN, True),
    DARR(110, 228, 190, 228, MUT, 1.3, 5), T(150, 246, "τ = 2R/c", "middle", 10, INK, True),
    W(400, 116.2, 400, 142.1, c=ALI, lw=2.4),
    T(414, 106, "縦差 = f_b = S·τ", "start", 10.5, ALI, True),
    BOX(180, 268, 480, 46, "f_b = 2 R S / c", "ビート周波数は距離に比例する", SIG, SSOFT, INK, 8, 1.9, 15, 10, None, True),
    T(420, 340, "ミキサで送受を掛け算すると、この「縦差」だけの低い周波数（うなり＝ビート）が残る",
      "middle", 10.5, MUT),
    T(420, 362, "例: S = 20 MHz/µs、R = 30 m → τ = 0.2 µs、f_b = 4 MHz。目標が複数なら周波数の混合 → FFT で分解",
      "middle", 10, FNT),
], "送信と受信は平行な斜め線なので、縦の差（ビート）は時間によらず一定。その値が距離の翻訳である")

F["r08_triangle"] = SVG(820, 300, [
    T(410, 26, "三角波 FMCW — 上りと下りでドップラーを分離", "middle", 12.5, INK, True),
    AXES(90, 210, 640, 150, "t", "f"),
    PL([(100, 200), (280, 80), (460, 200), (640, 80)], SIG, 2),
    PL([(150, 200), (330, 80), (510, 200), (690, 80)], GRN, 1.8),
    T(220, 66, "上り: f_b↑ = Sτ − f_d", "middle", 10, INK, True),
    T(480, 236, "下り: f_b↓ = Sτ + f_d", "middle", 10, INK, True),
    BOX(120, 250, 280, 40, "和 → 距離、差 → 速度", "連立で両方解ける", SIG, SSOFT, INK, 6, 1.4, 11.5, 9.5),
    BOX(430, 250, 300, 40, "弱点: 多目標で組み合わせ爆発", "どの上りとどの下りが同じ目標か不明", ALI, ASOFT, INK, 6, 1.4, 11.5, 9.5),
], "古典的な解。上り下りのビートの和と差から R と v を連立で解くが、目標が増えると対応付けに悩む")

F["r08_fastchirp"] = SVG(840, 320, [
    T(420, 26, "高速チャープ方式 — 現代の主流", "middle", 12.5, INK, True),
    AXES(80, 160, 680, 110, "t", "f"),
] + [
    PL([(90 + i * 82, 152), (90 + (i + 1) * 82 - 10, 70)], SIG, 1.8) for i in range(8)
] + [
    T(420, 184, "S を大きく（急峻に）して、距離項 Sτ をドップラーの数百倍にする", "middle", 10, MUT),
    BOX(60, 210, 340, 62, "チャープ 1 本の中", "ビート＝ほぼ距離だけ。ドップラーは 260 倍小さく誤差扱い",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(440, 210, 340, 62, "チャープからチャープへ", "位相が Δφ = 4πvT_c/λ ずつ回転 → 速度（07 章と同じ）",
        GRN, PAN, INK, 8, 1.5, 12, 9.5),
    T(420, 302, "「チャープ＝パルス」と読み替えれば、パルスレーダーの理論がそのまま載る——09 章の 2 次元 FFT へ",
      "middle", 10.5, SIG, True),
], "距離はチャープ内のビートで、速度はチャープ間の位相で。役割を時間スケールで分けるのが現代式である")

F["r08_if"] = SVG(840, 330, [
    T(420, 26, "なぜ ADC が安く済むのか — ミキシングの魔法", "middle", 12.5, INK, True),
    BOX(40, 60, 190, 54, "受信エコー 77 GHz", "直接サンプルなら 150 G サンプル/秒 必要", ALI, ASOFT, INK, 8, 1.4, 11.5, 9),
    BOX(300, 60, 170, 54, "ミキサ", "送信チャープの複製と掛け算", SIG, SSOFT),
    BOX(540, 60, 250, 54, "ビート（IF）数 MHz 〜 数十 MHz", "距離の情報はすべてここに保存されている", GRN, PAN, INK, 8, 1.4, 11.5, 9),
    ARR(230, 87, 296, 87, MUT, 1.6), ARR(470, 87, 536, 87, MUT, 1.6),
    BOX(300, 150, 240, 50, "ADC（数十 M サンプル/秒）", "安価な変換器で足りる", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(620, 114, 480, 150, MUT, 1.6),
    BOX(120, 232, 600, 52, "f_IF,max = 2 R_max S / c",
        "IF 帯域（ADC）が最大距離を決める。R_max=100 m・S=20 MHz/µs でも 13.3 MHz", SIG, SSOFT, INK, 8, 1.7, 13.5, 9.5),
    T(420, 316, "連続送信でピーク電力も小さい——「安い部品で成立する」ことが FMCW を民生の主役にした", "middle", 10.5, MUT),
], "RF の困難をアナログ掛け算 1 回で低周波に畳み込む。距離を欲張るほど IF 帯域＝ADC が高く付く、という対価も生まれる")

# ===================== 09. 信号処理 =====================

F["r09_frame"] = SVG(840, 330, [
    T(420, 26, "フレーム — M サンプル × N チャープの行列", "middle", 12.5, INK, True),
    RECT(150, 60, 420, 200, 6, SCR, LIN, 1.4),
] + [
    W(150, 60 + i * 25, 570, 60 + i * 25, c=LIN, lw=0.7) for i in range(1, 8)
] + [
    W(150 + j * 42, 60, 150 + j * 42, 260, c=LIN, lw=0.7) for j in range(1, 10)
] + [
    ARR(150, 288, 570, 288, MUT, 1.5),
    T(360, 306, "高速時間（チャープ内のサンプル 1..M）——刻み 数十 ns", "middle", 10, MUT),
    ARR(120, 60, 120, 260, MUT, 1.5),
    '<text x="100" y="160" text-anchor="middle" font-size="10" fill="%s" font-family="var(--sans)" transform="rotate(-90 100 160)">低速時間（チャープ番号 1..N）——刻み 数十 µs</text>' % MUT,
    BOX(600, 100, 200, 110, "1 行 = 1 チャープのビート信号", "1 列 = 同じ瞬間（同じ距離ビン）をチャープ越しに眺めた値",
        LIN, PAN, INK, 8, 1.3, 11, 9.5),
], "同じ「時間」でも刻みが 3 桁違う 2 つの軸を持つのが FMCW 処理の要。行方向と列方向で別の情報を運ぶ")

F["r09_2dfft"] = SVG(860, 330, [
    T(430, 26, "2 段の FFT — 行で距離、列で速度", "middle", 12.5, INK, True),
    RECT(40, 70, 190, 150, 6, SCR, LIN, 1.3),
    T(135, 62, "生データ M×N", "middle", 10, MUT, True),
    W(40, 145, 230, 145, c=SIG, lw=2.4),
    T(135, 240, "行ごとに FFT", "middle", 10.5, SIG, True),
    ARR(238, 145, 292, 145, MUT, 1.8),
    T(265, 132, "距離 FFT", "middle", 9.5, SIG, True),
    RECT(300, 70, 190, 150, 6, SCR, LIN, 1.3),
    T(395, 62, "距離ビン × チャープ", "middle", 10, MUT, True),
    W(395, 70, 395, 220, c=GRN, lw=2.4),
    T(395, 240, "列ごとに FFT", "middle", 10.5, GRN, True),
    ARR(498, 145, 552, 145, MUT, 1.8),
    T(525, 124, "ドップラー FFT", "middle", 9.5, GRN, True),
    RECT(560, 70, 190, 150, 6, SCR, LIN, 1.3),
    T(655, 62, "RD マップ", "middle", 10, MUT, True),
    D(640, 180, SIG, 6), D(700, 110, GRN, 6), D(615, 130, ALI, 6),
    T(430, 290, "距離 FFT は「ビートの周波数＝距離」の分解、ドップラー FFT は「チャープ間位相回転＝速度」の分解",
      "middle", 10.5, MUT),
    T(430, 312, "2 つの FFT は独立で、順序は距離 → ドップラーが標準（メモリの並びの都合）", "middle", 10, FNT),
], "行列に FFT を 2 回かけるだけで、時間データが「距離 × 速度」の地図に化ける")

F["r09_map"] = SVG(820, 360, [
    T(410, 26, "距離-ドップラーマップの読み方", "middle", 12.5, INK, True),
    RECT(180, 56, 460, 240, 8, SCR, LIN, 1.4),
    W(410, 56, 410, 296, c=FNT, lw=1.2, dash="4 4"),
    T(410, 316, "v = 0", "middle", 10, MUT, True),
    ARR(180, 330, 640, 330, MUT, 1.5), T(628, 348, "速度 →", "end", 10, MUT, True),
    T(200, 348, "← 近づく側", "start", 9.5, FNT),
    ARR(158, 296, 158, 56, MUT, 1.5),
    '<text x="140" y="176" text-anchor="middle" font-size="10" fill="%s" font-family="var(--sans)" transform="rotate(-90 140 176)">距離 →</text>' % MUT,
] + [
    D(410, 90 + i * 26, MUT, 4.2) for i in range(8)
] + [
    T(444, 96, "静止物の列（壁・ガードレール）", "start", 9.5, MUT),
    D(320, 220, SIG, 7), T(320, 242, "近づく車", "middle", 10, SIG, True),
    D(500, 140, GRN, 7), T(500, 122, "遠ざかる自転車", "middle", 10, GRN, True),
    D(360, 110, ALI, 5), T(348, 96, "歩行者", "end", 10, ALI, True),
    T(410, 356 - 14 + 12, "", "middle", 9, FNT),
], "世界の大半（静止物）は v=0 の縦線に整列し、動くものだけが横へ飛び出す。速度軸は最強のフィルタである")

F["r09_res"] = SVG(860, 300, [
    T(430, 26, "性能はこの 4 式で全部決まる", "middle", 12.5, INK, True),
    BOX(40, 60, 390, 60, "距離分解能  ΔR = c / 2B", "掃引幅 B だけで決まる。4 GHz → 3.75 cm", SIG, SSOFT, INK, 8, 1.6, 13, 9.5),
    BOX(40, 140, 390, 60, "最大距離  R_max = c·f_IF / 2S", "IF 帯域（ADC レート）とスロープで決まる", GRN, PAN, INK, 8, 1.6, 13, 9.5),
    BOX(430 + 0, 60, 390, 60, "速度分解能  Δv = λ / 2NT_c", "フレーム全体の観測時間 NT_c で決まる", GRN, PAN, INK, 8, 1.6, 13, 9.5),
    BOX(430, 140, 390, 60, "最大速度  v_max = λ / 4T_c", "チャープ周期 T_c で決まる", SIG, SSOFT, INK, 8, 1.6, 13, 9.5),
    T(430, 236, "B↑ → 距離が細かい／ T_c↓ → 速い目標に対応／ NT_c↑ → 速度が細かい／ ADC↑ → 遠くまで",
      "middle", 10.5, MUT),
    T(430, 258, "全部を同時に良くするつまみは存在しない——配分の設計は 18 章で実演する", "middle", 10.5, ALI, True),
], "チャープ設計とはこの 4 式の連立である。データシートの数字はすべてここから逆算できる")

F["r09_chain"] = SVG(880, 240, [
    T(440, 26, "処理チェーンの全体像", "middle", 12.5, INK, True),
    flowright(24, 100, [("ADC", "ビートを標本化"), ("距離 FFT", "チャープごと"),
                        ("ドップラー FFT", "距離ビンごと"), ("CFAR 検出", "13 章"),
                        ("角度推定", "10 章"), ("追尾", "15 章")], 122, 56, 20)[0],
    T(440, 160, "RD マップはゴールではなく中間生成物。ここから「点」を拾い、「物体」へ束ね、「軌跡」にする",
      "middle", 10.5, MUT),
    BOX(250, 180, 380, 40, "FFT×2 の処理利得 = 10 log(MN) dB", "M=256, N=128 → +45 dB（03 章の積分の正体）",
        SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
], "ミリ波レーダーのチップ（SoC、16 章）の中では、このチェーンがフレームごと（数十 ms）に丸ごと走っている")

# ===================== 10. 角度 =====================

F["r10_path"] = SVG(820, 330, [
    T(410, 26, "2 本のアンテナと行程差 d·sinθ", "middle", 12.5, INK, True),
] + [
    PL([(240 - 170 * math.sin(0.5) + k * 46 * math.cos(0.5) + 300 * math.sin(0.5),
         60 + k * 46 * math.sin(0.5) + 0),
        (240 + k * 46 * math.cos(0.5) - 90 * math.sin(0.5) + 300 * math.sin(0.5) - 140,
         60 + 170 * math.cos(0.5) + k * 46 * math.sin(0.5))], FNT, 1.2)
    for k in range(0)
] + [
    # 波面（斜めの平行線）
    PL([(150 + i * 52 + 130, 50 + i * 30), (150 + i * 52 - 60, 50 + i * 30 + 110)], GRN, 1.3, "6 5")
    for i in range(5)
] + [
    ARR(430, 90, 350, 152, GRN, 1.8),
    T(452, 84, "到来波（平面波）", "start", 10, GRN, True),
    D(250, 230, SIG, 6), D(400, 230, SIG, 6),
    T(250, 256, "RX1", "middle", 10.5, SIG, True), T(400, 256, "RX2", "middle", 10.5, SIG, True),
    DARR(250, 274, 400, 274, MUT, 1.3, 5), T(325, 292, "d", "middle", 10.5, INK, True),
    W(250, 230, 366, 152, c=FNT, lw=1.1, dash="3 4"),
    W(400, 230, 366, 152, c=ALI, lw=2),
    T(418, 190, "行程差 d·sinθ", "start", 10.5, ALI, True),
    BOX(560, 226, 240, 62, "Δφ = 2π d sinθ / λ", "位相差を測れば角度が出る\nd=λ/2, θ=30° → Δφ=90°", SIG, SSOFT, INK, 8, 1.6, 13, 9.5, None, True),
], "斜めから来る波は片方のアンテナに少し遅れて届く。海岸の 2 本の杭のどちらが先に濡れるか、と同じ幾何である")

F["r10_fov"] = SVG(820, 320, [
    T(410, 26, "視野と折り返し — なぜ間隔は λ/2 なのか", "middle", 12.5, INK, True),
    AXES(110, 240, 600, 170, "sinθ", "位相差 Δφ"),
    W(110, 155, 710, 155, c=FNT, lw=1, dash="2 5"),
    PL([(170, 240), (650, 70)], SIG, 2.2),
    W(110, 70, 710, 70, c=ALI, lw=1.2, dash="5 4"), T(716, 74, "+π", "start", 10, ALI, True),
    W(110, 240, 710, 240, c=ALI, lw=1.2, dash="5 4"), T(716, 244, "−π", "start", 10, ALI, True),
    T(170, 258, "−90°", "middle", 9.5, MUT), T(410, 258, "0°", "middle", 9.5, MUT), T(650, 258, "+90°", "middle", 9.5, MUT),
    BOX(160, 92, 250, 44, "d = λ/2 のとき", "±90° がちょうど ±π に対応——半空間ぜんぶ見える", SIG, SSOFT, INK, 6, 1.3, 11, 9.5),
    T(410, 292, "d を広げると傾きが立ち、±π を超えた角度が反対側に折り返す＝視野の外の目標が偽の角度に現れる",
      "middle", 10.5, MUT),
], "位相は ±180° までしか区別できない。λ/2 間隔は「角度のナイキスト条件」であり、速度の折り返しと同じ構造である")

F["r10_cube"] = SVG(840, 300, [
    T(420, 26, "3 回の FFT でデータキューブが完成する", "middle", 12.5, INK, True),
] + [
    RECT(200 + k * 26, 66 + (2 - k) * 16, 240, 150, 6, SCR if k < 2 else PAN, LIN, 1.2)
    for k in range(3)
] + [
    T(214, 92, "RX1", "start", 8.5, FNT),
    T(240, 78, "RX2", "start", 8.5, FNT),
    T(266, 62, "RX3", "start", 8.5, FNT),
    D(340, 150, SIG, 5), D(420, 120, GRN, 5), D(380, 180, ALI, 4),
    ARR(200, 250, 440, 250, MUT, 1.4), T(320, 268, "距離（チャープ内 FFT）", "middle", 9.5, MUT),
    ARR(176, 232, 176, 96, MUT, 1.4),
    '<text x="158" y="170" text-anchor="middle" font-size="9.5" fill="%s" font-family="var(--sans)" transform="rotate(-90 158 170)">速度（チャープ間 FFT）</text>' % MUT,
    ARR(452, 236, 500, 208, MUT, 1.4), T(506, 204, "角度（素子間 FFT）", "start", 9.5, MUT),
    BOX(560, 84, 240, 110, "同じ数学が 3 回",
        "時間の等速回転→速度\n素子方向の等差位相→角度\nビートの周波数→距離", SIG, SSOFT, INK, 8, 1.4, 12, 10),
    T(420, 292, "「等間隔サンプルの正弦波を FFT で読む」——それだけを 3 方向にやるのが FMCW レーダーの信号処理である",
      "middle", 10.5, MUT),
], "距離 × 速度 × 角度の 3 次元に目標が点として浮かぶ。ここまで来れば残りは検出と追尾だけ")

F["r10_mimo"] = SVG(860, 380, [
    T(430, 26, "MIMO — 3TX × 4RX で仮想 12 素子", "middle", 12.5, INK, True),
    T(90, 66, "実アンテナ", "start", 10.5, INK, True),
] + [
    D(150 + i * 30, 100, GRN, 6) for i in range(4)
] + [
    T(150 + i * 30, 124, "R%d" % (i+1), "middle", 9, MUT) for i in range(4)
] + [
    T(105, 104, "RX（λ/2）", "end", 9.5, GRN, True),
] + [
    D(150 + i * 120, 160, SIG, 7) for i in range(3)
] + [
    T(150 + i * 120, 184, "T%d" % (i+1), "middle", 9, MUT) for i in range(3)
] + [
    T(105, 164, "TX（2λ）", "end", 9.5, SIG, True),
    BOX(500, 76, 320, 96, "仮想素子の位置 = TX の位置 + RX の位置",
        "行きの行程差と帰りの行程差が足し算で効くため。TX を 1 歩ずらす＝アレイ全体を 1 歩ずらす", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    T(90, 232, "仮想アレイ", "start", 10.5, INK, True),
] + [
    D(150 + i * 30, 262, ALI, 5.5) for i in range(12)
] + [
    T(150 + i * 30, 284, str(i+1), "middle", 8.5, FNT) for i in range(12)
] + [
    T(430, 316, "λ/2 間隔 12 素子が隙間なく並ぶ → 角度分解能 約 9.5°。アンテナ 7 本・受信 4 系統で 12 素子ぶんが手に入る",
      "middle", 10.5, MUT),
    T(430, 340, "TX の見分けは時分割（TDM）が主流——ただし同一 TX の周期が 3 倍になり v_max が 1/3 に（18 章の落とし穴）",
      "middle", 10, ALI),
], "受信を増やす代わりに送信を増やす。掛け算（3×4=12）で開口を稼ぐのが MIMO の発明である")

# ===================== 11. アンテナ =====================

def lobew(cx, cy, wts, dl, scale, c=SIG, lw=2):
    """重み付き ULA アレイファクタの極座標プロット（上半面）"""
    K = len(wts); wsum = sum(wts)
    pts = []
    for i in range(-90, 91):
        th = math.radians(i)
        re = im = 0.0
        for k in range(K):
            ph = 2 * math.pi * dl * k * math.sin(th)
            re += wts[k] * math.cos(ph); im += wts[k] * math.sin(ph)
        af = math.hypot(re, im) / wsum
        r = scale * af
        pts.append((cx + r * math.sin(th), cy - r * math.cos(th)))
    return PL(pts, c, lw)

def lobe_path(cx, cy, K, dl, steer_deg, scale, c=SIG, lw=2):
    """ULA のアレイファクタ極座標プロット（上半面）。dl = d/λ"""
    pts = []
    s0 = math.sin(math.radians(steer_deg))
    for i in range(-90, 91):
        th = math.radians(i)
        psi = math.pi * 2 * dl * (math.sin(th) - s0)
        num = math.sin(K * psi / 2)
        den = math.sin(psi / 2)
        af = abs(num / den) / K if abs(den) > 1e-9 else 1.0
        r = scale * af
        pts.append((cx + r * math.sin(th), cy - r * math.cos(th)))
    return PL(pts, c, lw)

F["r11_pattern"] = SVG(820, 330, [
    T(410, 26, "放射パターン — メインローブとサイドローブ", "middle", 12.5, INK, True),
    W(110, 260, 710, 260, c=LIN, lw=1.4),
    lobe_path(410, 260, 8, 0.5, 0, 200, SIG, 2.2),
    T(410, 44, "メインローブ", "middle", 10.5, SIG, True),
    T(258, 210, "サイドローブ", "middle", 10, MUT),
    DARR(384, 96, 442, 96, ALI, 1.3, 5),
    T(410, 84, "θ3dB（ビーム幅）", "middle", 10, ALI, True),
    T(410, 290, "横軸: 角度（正面 = 上）。この形の「細さ」が利得と分解能を決める", "middle", 10.5, MUT),
    T(410, 312, "8 素子・λ/2 間隔のアレイの例。素子数を増やすとメインローブが細くなる", "middle", 10, FNT),
], "アンテナは空間フィルタ——方向ごとの感度分布（放射パターン）を持つ。山の細さと脇の低さが品質である")

F["r11_aperture"] = SVG(840, 330, [
    T(420, 26, "開口 D とビーム幅 — θ3dB ≈ λ/D", "middle", 12.5, INK, True),
    T(220, 56, "小さい開口", "middle", 11, INK, True),
    W(180, 90, 180, 150, c=INK, lw=5),
    lobe_path(180, 190, 3, 0.5, 0, 120, SIG, 2)[0:0] or lobe_path(220, 240, 3, 0.5, 0, 120, SIG, 2),
    T(220, 280, "広いビーム（ぼんやり）", "middle", 10, MUT),
    T(620, 42, "大きい開口", "middle", 11, INK, True),
    W(560, 70, 560, 170, c=INK, lw=5),
    lobe_path(620, 240, 12, 0.5, 0, 190, GRN, 2),
    T(620, 280, "細いビーム（鋭い）", "middle", 10, MUT),
    T(420, 310, "開口の端と端の行程差が λ を超える方向から打ち消しが始まる——境目が λ/D。77 GHz・D=5 cm で約 4.5°",
      "middle", 10.5, MUT),
], "開口内の全点からの波が同位相で足される方向だけが明るい。大きな口ほど、その条件は狭い角度でしか成立しない")

F["r11_steer"] = SVG(840, 330, [
    T(420, 26, "フェーズドアレイ — 位相の勾配でビームが曲がる", "middle", 12.5, INK, True),
] + [
    D(240 + i * 44, 250, SIG, 6) for i in range(6)
] + [
    T(240 + i * 44, 274, "φ=%d°" % (i * 45), "middle", 8.5, FNT) for i in range(6)
] + [
    PL([(200 + i * 30, 214 - i * 17), (420 + i * 30, 214 - i * 17 - 74)], GRN, 1.4, "6 5")
    for i in range(4)
] + [
    ARR(400, 160, 480, 96, GRN, 2),
    T(492, 88, "ビーム方向 θ₀", "start", 10.5, GRN, True),
    BOX(560, 200, 250, 70, "素子間の位相差", "Δφ = 2π d sinθ₀ / λ\n受信で「読んだ」式を、送信では「与える」", SIG, SSOFT, INK, 8, 1.5, 12, 9.5, None, False),
    T(420, 310, "機械で回さず、位相だけでマイクロ秒オーダーの向き変更ができる。角度 FFT はこれの全方向同時版である",
      "middle", 10.5, MUT),
], "各素子の位相を等差でずらすと波面が斜めに揃い、主ビームが傾く。電子走査（フェーズドアレイ）の原理である")

F["r11_grating"] = SVG(840, 330, [
    T(420, 26, "グレーティングローブ — d > λ/2 の罰", "middle", 12.5, INK, True),
    W(100, 240, 740, 240, c=LIN, lw=1.4),
    lobe_path(420, 240, 6, 1.0, 0, 185, ALI, 2),
    T(420, 46, "本物のメインローブ", "middle", 10, INK, True),
    T(214, 60, "グレーティングローブ", "middle", 10, ALI, True),
    T(626, 60, "グレーティングローブ", "middle", 10, ALI, True),
    BOX(180, 262, 480, 44, "条件: d(sinθg − sinθ₀) = ±λ, ±2λ, …",
        "隣の素子と「ちょうど 1 波長ずれ」の方向では全素子がまた同位相になる", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    T(420, 324, "d = λ（6 素子）の例。±90° 付近に偽の主ビーム——空間サンプリングのエイリアシングである", "middle", 10, FNT),
], "間隔を広げると、意図しない方向でも波が完全に揃ってしまう。角度の折り返し（10 章）を送信側から見た姿である")

F["r11_taper"] = SVG(840, 330, [
    T(420, 26, "テーパ — サイドローブと引き換えの窓関数", "middle", 12.5, INK, True),
    T(230, 54, "一様給電", "middle", 10.5, INK, True),
] + [
    RECT(140 + i * 24, 84 - 30, 18, 30, 2, SSOFT, SIG, 1.1) for i in range(8)
] + [
    lobe_path(230, 250, 8, 0.5, 0, 165, SIG, 2),
    T(230, 276, "鋭いが、サイドローブ −13 dB", "middle", 9.5, MUT),
    T(610, 54, "テーパ給電（端を弱く）", "middle", 10.5, INK, True),
] + [
    RECT(520 + i * 24, 84 - h, 18, h, 2, SSOFT, GRN, 1.1)
    for i, h in enumerate([8, 15, 24, 30, 30, 24, 15, 8])
] + [
    lobew(610, 250, [0.16, 0.4, 0.77, 1.0, 1.0, 0.77, 0.4, 0.16], 0.5, 165, GRN, 2),
    T(610, 276, "サイドローブ −35 dB、幅は広がる", "middle", 9.5, MUT),
    T(420, 310, "時間窓（DSP）・圧縮窓（06 章）・開口テーパ——3 つの顔をした同じトレードオフ", "middle", 10.5, SIG, True),
], "端の素子を弱くするとフーリエ変換の裾が下がる。強い目標の脇の弱い目標を守るための、利得と幅の支払いである")

# ===================== 12. 受信機と雑音 =====================

F["r12_chain"] = SVG(880, 260, [
    T(440, 26, "FMCW 受信チェーン", "middle", 12.5, INK, True),
    flowright(24, 100, [("アンテナ", "エコー到着"), ("LNA", "低雑音増幅。全体の NF をほぼ決める", SIG, SSOFT),
                        ("ミキサ", "チャープ複製と掛け算 → ビート"), ("IF フィルタ", "帯域制限＋近距離リーク除去"),
                        ("ADC", "数十 MHz で標本化")], 140, 62, 26)[0],
    ARR(360, 174, 360, 136, MUT, 1.5),
    BOX(270, 178, 200, 44, "チャープ生成（PLL、5 節）", "送信と同じ発振器の複製を渡す", GRN, PAN, INK, 8, 1.3, 11, 9.5),
    T(440, 246, "「増幅してから混ぜて、絞ってから測る」。各段が足す雑音の収支が次の図である", "middle", 10.5, MUT),
], "受信機の使命は、数 fW のエコーを雑音をなるべく足さずに ADC まで運ぶこと。主役は先頭の LNA である")

F["r12_ktb"] = SVG(840, 320, [
    T(420, 26, "雑音フロアの積み上げ — −174 dBm/Hz から", "middle", 12.5, INK, True),
    RECT(120, 220, 600, 30, 4, SCR, LIN, 1.3),
    T(420, 240, "熱雑音密度 kT = −174 dBm/Hz（290 K）", "middle", 10.5, INK, True),
    RECT(120, 168, 600, 44, 4, SSOFT, SIG, 1.3),
    T(420, 194, "+ 10 log B  …… 帯域 10 MHz なら +70 dB → −104 dBm", "middle", 10.5, INK, True),
    RECT(120, 116, 600, 44, 4, ASOFT, ALI, 1.3),
    T(420, 142, "+ NF …… 受信機の上乗せ 4 dB → 雑音フロア −100 dBm", "middle", 10.5, INK, True),
    ARR(80, 236, 80, 130, MUT, 1.6), T(66, 180, "積み上げ", "end", 9.5, MUT),
    T(420, 284, "「帯域を広く聴くほど床が上がる」——必要な帯域だけ聴くのが鉄則で、整合フィルタ（06 章）の本質もこれ",
      "middle", 10.5, MUT),
], "雑音は 1 Hz あたり −174 dBm で万遍なく敷かれている。帯域と NF を足した高さが、エコーと比べるべき床になる")

F["r12_friis"] = SVG(860, 300, [
    T(430, 26, "フリスの式 — 初段がすべてを決める", "middle", 12.5, INK, True),
    BOX(60, 70, 200, 66, "初段 LNA", "利得 G₁、雑音 F₁\n寄与: F₁ そのまま", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(330, 70, 200, 66, "2 段目", "寄与: (F₂−1)/G₁\n→ G₁ で割られて小さい", LIN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(600, 70, 200, 66, "3 段目", "寄与: (F₃−1)/G₁G₂\n→ ほぼ無視できる", LIN, PAN, INK, 8, 1.4, 12, 9.5),
    ARR(260, 103, 326, 103, MUT, 1.6), ARR(530, 103, 596, 103, MUT, 1.6),
    BOX(160, 170, 540, 46, "F_total = F₁ + (F₂−1)/G₁ + (F₃−1)/G₁G₂ + …",
        "初段で信号を大きくしてしまえば、後段の雑音は相対的に効かない", SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5, None, True),
    T(430, 252, "裏返し: LNA より前の損失（ケーブル・コネクタ・汚れたレドーム）は、その dB がそのまま NF に加算される",
      "middle", 10.5, ALI, True),
    T(430, 274, "「アンテナの直後に LNA」はこの式からの帰結である", "middle", 10.5, MUT),
], "縦続の雑音指数は初段支配。低雑音設計の投資は先頭の 1 段に集中させるのが正しい配分になる")

F["r12_dynamic"] = SVG(840, 330, [
    T(420, 26, "ダイナミックレンジ — 近くの巨人と遠くの小人", "middle", 12.5, INK, True),
    W(140, 60, 140, 270, c=LIN, lw=2),
] + [
    W(132, 60 + i * 52.5, 148, 60 + i * 52.5, c=MUT, lw=1.3) for i in range(5)
] + [
    T(156, 66, "−20 dBm  1 m の強反射（バンパー・リーク）", "start", 10, ALI, True),
    T(156, 118, "−60 dBm", "start", 9.5, MUT),
    T(156, 171, "−100 dBm  150 m の歩行者", "start", 10, GRN, True),
    T(156, 223, "−120 dBm  雑音フロア", "start", 9.5, MUT),
    T(156, 274, "", "start", 9),
    DARR(110, 66, 110, 168, SIG, 1.5, 6),
    '<text x="96" y="120" text-anchor="middle" font-size="10" fill="%s" font-family="var(--sans)" font-weight="700" transform="rotate(-90 96 120)">80 dB 差</text>' % SIG,
    BOX(490, 80, 310, 60, "ADC は 6 dB/ビット", "16 ビットでも約 96 dB——上を飽和させず、下を量子化雑音に沈めない綱渡り", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    BOX(490, 156, 310, 74, "助っ人が 2 人", "① FFT 処理利得（+45 dB 級）が量子化雑音も薄める\n② IF ハイパスで近距離の巨人をあらかじめ減衰（R⁴ の逆勾配）", GRN, PAN, INK, 8, 1.4, 12, 9.5),
    T(420, 312, "強い方が飽和（クリップ）すると高調波が全域に撒き散り、弱い方ごと潰れる——飽和だけは絶対に避ける",
      "middle", 10.5, ALI, True),
], "R⁴ 則が生む 80 dB の同時受信。ビット数・処理利得・アナログフィルタの三者で分担して受け止める")

F["r12_phasenoise"] = SVG(820, 320, [
    T(410, 26, "位相雑音 — 強者の裾が弱者を埋める", "middle", 12.5, INK, True),
    AXES(90, 250, 640, 190, "周波数（≒距離）", "電力 [dB]"),
] + [
    PL([(90 + 640 * u, 250 - min(max(6, 175 * math.exp(-((u - 0.3) / 0.012) ** 2)
         + 120 * math.exp(-abs(u - 0.3) / 0.13)
         + 90 * math.exp(-((u - 0.62) / 0.014) ** 2)), 196))
        for u in [i / 400 for i in range(401)]], SIG, 1.8)
] + [
    T(282, 62, "強い目標", "middle", 10.5, SIG, True),
    T(292, 158, "位相雑音の裾（スカート）", "start", 9.5, MUT),
    ARR(560, 130, 542, 154, ALI, 1.5),
    T(574, 120, "弱い目標が裾に沈む", "start", 10, ALI, True),
    T(410, 282, "発振器の位相の揺らぎが、すべてのエコーの両脇に「裾」を付ける。サイドローブ（06・11 章）と並ぶ第 3 の隠蔽経路",
      "middle", 10, MUT),
    T(410, 304, "FMCW の救い: 送受が同じ発振器なので、遅延が小さい（近距離）ほど揺らぎが共通で打ち消える（レンジ相関）",
      "middle", 10, GRN),
], "スペクトルの裾は PLL の品質で決まる。近距離レーダーがレンジ相関に守られるのは FMCW 特有の幸運である")

# ===================== 13. 検出と CFAR =====================

F["r13_cell"] = SVG(820, 300, [
    T(410, 26, "検出はセルごとの二択", "middle", 12.5, INK, True),
    RECT(200, 56, 420, 180, 6, SCR, LIN, 1.3),
] + [
    W(200, 56 + i * 30, 620, 56 + i * 30, c=LIN, lw=0.6) for i in range(1, 6)
] + [
    W(200 + j * 42, 56, 200 + j * 42, 236, c=LIN, lw=0.6) for j in range(1, 10)
] + [
    RECT(410, 116, 42, 30, 2, SSOFT, SIG, 2),
    T(431, 106, "このセルは？", "middle", 10, SIG, True),
    T(280, 262, "H0: 雑音だけ", "middle", 10.5, MUT, True),
    T(540, 262, "H1: 雑音 + 目標", "middle", 10.5, SIG, True),
    T(410, 288, "RD マップの数万セルに対して、フレームごとにこの二択を下すのが検出である", "middle", 10.5, MUT),
], "判定は「電力がしきい値を超えたか」しかない。問題のすべては、しきい値をどこに引くかに集約される")

F["r13_pfapd"] = SVG(840, 340, [
    T(420, 26, "誤警報と検出 — 2 つの分布と 1 本のしきい値", "middle", 12.5, INK, True),
    AXES(90, 260, 660, 200, "セルの電力", "確率密度"),
] + [
    # 雑音: 指数分布
    PL([(90 + 660 * u, 260 - 185 * math.exp(-6 * u)) for u in [i / 300 for i in range(301)]], MUT, 2),
    # 信号+雑音: 山
    PL([(90 + 660 * u, 260 - 150 * math.exp(-((u - 0.55) / 0.16) ** 2)) for u in [i / 300 for i in range(301)]], SIG, 2),
] + [
    T(180, 92, "雑音だけ（H0）", "middle", 10.5, MUT, True),
    T(500, 92, "目標あり（H1）", "middle", 10.5, SIG, True),
    W(360, 260, 360, 70, c=ALI, lw=2, dash="6 4"),
    T(360, 60, "しきい値 T", "middle", 10.5, ALI, True),
    T(420, 292, "T より右の面積: 雑音側の裾 = 誤警報確率 Pfa、信号側の山 = 検出確率 Pd", "middle", 10.5, MUT),
    T(420, 314, "T を上げれば Pfa も Pd も下がる。同時に良くする唯一の道は「山を右へ動かす」＝ SN 比を上げること",
      "middle", 10.5, SIG, True),
], "目安として Pfa=10⁻⁶・Pd=0.9 には SNR 約 13 dB。RCS が揺らぐ目標（04 章）ではさらに数 dB のマージンが要る")

F["r13_fixed"] = SVG(840, 330, [
    T(420, 26, "固定しきい値の破綻", "middle", 12.5, INK, True),
    AXES(70, 250, 700, 190, "距離", "電力"),
] + [
    PL([(70 + 700 * u, 250 - 44 - (58 if u > 0.55 else 0)
         - 16 * abs(math.sin(31 * u + 1.2) * math.sin(13 * u)) - 8 * math.sin(53 * u)
         - (105 * math.exp(-((u - 0.3) / 0.012) ** 2)))
        for u in [i / 500 for i in range(501)]], MUT, 1.4)
] + [
    W(70, 148, 770, 148, c=ALI, lw=2, dash="7 4"),
    T(766, 140, "固定しきい値", "end", 10, ALI, True),
    T(240, 116, "目標（検出できる）", "middle", 9.5, SIG, True),
    RECT(455, 60, 315, 24, 4, ASOFT, ALI, 1.2),
    T(612, 76, "雨・クラッタで床が 10 dB 上昇 → 誤警報の洪水", "middle", 9.5, ALI, True),
    T(420, 288, "指数分布の裾は敏感で、床が 10 dB 動くと Pfa は 10⁻⁶ → 0.25 に暴れる", "middle", 10.5, MUT),
    T(420, 310, "マージンを積んで高くすれば、今度は静かな環境で感度を丸ごと捨てる——固定値に正解はない", "middle", 10.5, ALI, True),
], "雑音・クラッタの床は場所と天候で何十 dB も動く。しきい値は「その場の床」から毎回作るしかない")

F["r13_cacfar"] = SVG(860, 340, [
    T(430, 26, "CA-CFAR — 周囲の平均の α 倍をしきい値に", "middle", 12.5, INK, True),
] + [
    RECT(130 + i * 40, 90, 36, 36, 3,
         SSOFT if lab == "参" else (ASOFT if lab == "CUT" else PAN),
         SIG if lab == "参" else (ALI if lab == "CUT" else LIN),
         2 if lab == "CUT" else 1.2)
    for i, lab in enumerate(["参","参","参","参","参","G","G","CUT","G","G","参","参","参","参","参"])
] + [
    T(148 + i * 40, 113, lab, "middle", 9.5,
      SIG if lab == "参" else (ALI if lab == "CUT" else FNT), lab == "CUT")
    for i, lab in enumerate(["参","参","参","参","参","G","G","CUT","G","G","参","参","参","参","参"])
] + [
    T(240, 150, "参照セル N 個 → 平均 Z", "middle", 10, SIG, True),
    T(430, 150, "G = ガード（目標の漏れを平均から除外）", "middle", 10, FNT),
    BOX(180, 180, 500, 46, "しきい値 T = α·Z,   α = N (Pfa^(−1/N) − 1)",
        "指数分布の和（ガンマ分布）の積分から閉形式で出る", SIG, SSOFT, INK, 8, 1.6, 13, 9.5, None, True),
    T(430, 262, "N→∞ の極限では α → ln(1/Pfa)（固定しきい値の理想値）に一致する", "middle", 10.5, MUT),
    T(430, 284, "有限 N の推定ばらつき税 = CFAR ロス: Pfa=10⁻⁶・N=16 で約 2 dB", "middle", 10.5, ALI, True),
    T(430, 318, "実装では距離×速度の 2 次元窓でかけ、さらに「隣より大きい（ピーク）」を要求して 1 目標 1 検出に絞る",
      "middle", 10, FNT),
], "しきい値が雑音レベルに自動追従するので、環境が変わっても Pfa が一定に保たれる——名前の由来である")

F["r13_mask"] = SVG(840, 330, [
    T(420, 26, "マスキングと OS-CFAR", "middle", 12.5, INK, True),
    AXES(70, 250, 700, 190, "距離", "電力"),
] + [
    PL([(70 + 700 * u, 250 - 40 - 10 * abs(math.sin(37 * u + 0.7))
         - 150 * math.exp(-((u - 0.42) / 0.014) ** 2)
         - 130 * math.exp(-((u - 0.50) / 0.014) ** 2))
        for u in [i / 500 for i in range(501)]], MUT, 1.5)
] + [
    # CA しきい値: 双方のピーク周辺で持ち上がる
    PL([(70 + 700 * u, 250 - 72 - 66 * (math.exp(-((u - 0.42) / 0.09) ** 2) + math.exp(-((u - 0.50) / 0.09) ** 2)))
        for u in [i / 250 for i in range(251)]], ALI, 1.8, "6 4"),
    PL([(70 + 700 * u, 250 - 76) for u in (0, 1)], GRN, 1.8, "2 4"),
] + [
    T(364, 74, "目標 A", "middle", 10, SIG, True), T(422, 92, "目標 B", "middle", 10, SIG, True),
    T(600, 128, "CA のしきい値（破線・赤）が", "start", 10, ALI, True),
    T(600, 146, "隣の目標で吊り上がり B を隠す", "start", 10, ALI, True),
    T(600, 250, "OS（緑点線）はソートして", "start", 10, GRN, True),
    T(600, 268, "k 番目を使う→異物に鈍感", "start", 10, GRN, True),
    T(420, 288, "OS-CFAR: 参照セルを並べ替えて 3/4 位あたりの値を雑音推定に使う。少数の強い異物は上位に押しやられ効かない",
      "middle", 10, MUT),
    T(420, 310, "多目標が常態の車載では OS 系が事実上の標準。代償はソート計算とわずかな追加ロス", "middle", 10, FNT),
], "隣に強い目標がいると CA の平均は汚染される。順序統計（OS）は「多数決」で汚染を無視する")

# ===================== 14. クラッタと干渉 =====================

F["r14_scene"] = SVG(840, 300, [
    T(420, 26, "クラッタ — 目標以外の本物の反射", "middle", 12.5, INK, True),
    W(60, 230, 780, 230, c=INK, lw=2),
    radar_icon(110, 216),
    car_icon(430, 216, 1.1), T(430, 250, "目標", "middle", 10, SIG, True),
    RECT(560, 160, 16, 70, 2, SCR, MUT, 1.6), RECT(600, 160, 16, 70, 2, SCR, MUT, 1.6),
    T(608, 150, "ガードレール・構造物", "middle", 9.5, MUT),
    PL([(680, 90), (676, 110)], GRN, 1.4), PL([(700, 82), (696, 102)], GRN, 1.4),
    PL([(720, 94), (716, 114)], GRN, 1.4), PL([(740, 86), (736, 106)], GRN, 1.4),
    T(712, 70, "雨", "middle", 10, GRN, True),
    ARR(150, 208, 400, 208, SIG, 1.4),
    ARR(150, 222, 545, 222, MUT, 1.3),
    T(420, 274, "路面・構造物・雨からのエコーは目標より 20〜40 dB 強いことも普通にある", "middle", 10.5, MUT),
], "クラッタは雑音と違って本物の反射。送信を強くしても比は 1 dB も改善しない——性質の違いで分離するしかない")

F["r14_spectrum"] = SVG(840, 330, [
    T(420, 26, "ドップラー軸で見ると勝負が見える", "middle", 12.5, INK, True),
    AXES(90, 250, 660, 190, "ドップラー周波数（速度）", "電力"),
] + [
    PL([(90 + 660 * u, 250 - min(max(5, 185 * math.exp(-((u - 0.5) / 0.045) ** 2)
         + 70 * math.exp(-((u - 0.5) / 0.13) ** 2)
         + 95 * math.exp(-((u - 0.78) / 0.016) ** 2)), 186))
        for u in [i / 400 for i in range(401)]], MUT, 1.8)
] + [
    T(420, 56, "クラッタ（静止物・雨）", "middle", 10.5, MUT, True),
    T(605, 128, "動く目標", "middle", 10.5, SIG, True),
    D(605, 156, SIG, 5),
    PL([(90 + 660 * u, 250 - 170 * abs(math.sin(math.pi * (u - 0.5) * 2.4)) ** 0.7 * 0.5)
        for u in [i / 300 for i in range(301)]], GRN, 1.6, "6 4"),
    T(200, 168, "MTI の応答（破線）", "middle", 10, GRN, True),
    T(420, 288, "クラッタは 0 付近の巨大な山、目標は離れた孤立峰。「0 付近を削るハイパス」が答えになる",
      "middle", 10.5, MUT),
    T(420, 310, "自車が動く車載では、静止物は「−自車速」の位置にずれる——消すのではなく既知の列として別扱いする",
      "middle", 10, FNT),
], "速度という軸の上では、圧倒的な強者（クラッタ）と小さな目標が最初から別の場所に立っている")

F["r14_mti"] = SVG(840, 330, [
    T(420, 26, "MTI キャンセラ — 引き算 1 回のハイパス", "middle", 12.5, INK, True),
    BOX(70, 70, 150, 46, "エコー x_n", None, LIN, PAN),
    BOX(290, 70, 170, 46, "1 パルス遅延 (T)", "前回のエコーを覚えておく", SIG, SSOFT, INK, 8, 1.4, 11.5, 9),
    CIRC(560, 93, 20, INK, 1.8, PAN),
    T(560, 98, "−", "middle", 16, INK, True),
    BOX(640, 70, 160, 46, "出力 y_n", "静止物は消える", GRN, PAN),
    ARR(220, 93, 286, 93, MUT, 1.6), ARR(460, 93, 536, 93, MUT, 1.6),
    ARR(580, 93, 636, 93, MUT, 1.6),
    W(253, 93, 253, 140, c=MUT, lw=1.4), W(253, 140, 560, 140, c=MUT, lw=1.4),
    ARR(560, 140, 560, 117, MUT, 1.5),
    AXES(120, 290, 600, 110, None, "|H|"),
] + [
    PL([(120 + 600 * u, 290 - 95 * abs(math.sin(math.pi * u * 2))) for u in [i / 300 for i in range(301)]], SIG, 2)
] + [
    T(120, 306, "0", "middle", 9.5, FNT), T(420, 306, "PRF/2", "middle", 9.5, FNT), T(716, 306, "PRF", "middle", 9.5, FNT),
    T(430, 196, "|H(f_d)| = 2 |sin(π f_d T)| —— H(z) = 1 − z⁻¹ の 1 次差分ハイパス", "middle", 10.5, INK, True),
], "「前回と同じなら引けばゼロ」。DSP の最初に習う差分フィルタが、クラッタ抑圧の古典 MTI そのものである")

F["r14_blind"] = SVG(840, 300, [
    T(420, 26, "ブラインドスピード — sin の零点の代償", "middle", 12.5, INK, True),
    AXES(90, 220, 660, 150, "速度", "MTI 応答"),
] + [
    PL([(90 + 660 * u, 220 - 120 * abs(math.sin(math.pi * u * 3))) for u in [i / 400 for i in range(401)]], SIG, 2),
    PL([(90 + 660 * u, 220 - 120 * abs(math.sin(math.pi * u * 3 * 0.75))) for u in [i / 400 for i in range(401)]], GRN, 1.6, "6 4"),
] + [
    D(310, 220, ALI, 5), D(530, 220, ALI, 5),
    T(310, 244, "v_blind", "middle", 10, ALI, True), T(530, 244, "2·v_blind", "middle", 10, ALI, True),
    T(420, 268, "v_blind = k·λ·PRF/2 —— パルス間でちょうど 1 回転して静止に見える速度", "middle", 10.5, MUT),
    T(420, 290, "対策: PRF を切り替える（緑破線）と零点の位置が動き、取りこぼしを塞げる", "middle", 10.5, GRN, True),
], "折り返しの外に出た速度が 0 に重なる点。距離の曖昧さ対策と同じく、PRF の多重化で穴をずらして埋める")

F["r14_interf"] = SVG(860, 340, [
    T(430, 26, "レーダー間干渉 — チャープの交差とゴースト", "middle", 12.5, INK, True),
    AXES(80, 180, 320, 130, "t", "f"),
    PL([(90, 172), (190, 70)], SIG, 2), PL([(190, 172), (290, 70)], SIG, 2),
    PL([(90, 130), (330, 92)], ALI, 2, None),
    T(238, 60, "自分のチャープ", "middle", 9.5, SIG, True),
    T(348, 100, "他車（斜め横断）", "middle", 9.5, ALI, True),
    T(240, 206, "交差の瞬間だけ IF に強いパルス", "middle", 9.5, MUT),
    T(240, 224, "→ FFT 後は床全体が持ち上がる（感度低下）", "middle", 9.5, ALI),
    AXES(500, 180, 320, 130, "t", "f"),
    PL([(510, 172), (610, 70)], SIG, 2),
    PL([(524, 172), (624, 70)], ALI, 1.8, "6 4"),
    T(660, 84, "スロープほぼ一致", "middle", 9.5, ALI, True),
    T(660, 206, "ビートが本物そっくりに残る", "middle", 9.5, MUT),
    T(660, 224, "→ 実在しないゴースト目標", "middle", 9.5, ALI),
    BOX(120, 252, 620, 56, "対策の層", "① タイミング・スロープの擬似ランダム化 ② 時間領域で干渉を検出して除去・補間 ③ ビーム・45° 偏波 ④ 帯域の住み分けと標準化", GRN, PAN, INK, 8, 1.4, 12, 9.5),
], "増え続ける同族との戦い。ほとんどは床上げ（検出距離の低下）だが、まれに出るゴーストが最も危険である")

# ===================== 15. 追尾 =====================

F["r15_pipeline"] = SVG(880, 240, [
    T(440, 26, "追尾のパイプライン", "middle", 12.5, INK, True),
    flowright(24, 100, [("検出点群", "CFAR の出力（13 章）"), ("予測", "運動モデルで先読み"),
                        ("ゲーティング", "予測の周囲だけ探す"), ("対応付け", "点をトラックに割当"),
                        ("更新", "フィルタで状態修正"), ("トラック管理", "生成・確認・削除")], 122, 56, 20)[0],
    W(818, 128, 818, 168, c=MUT, lw=1.4), W(818, 168, 208, 168, c=MUT, lw=1.4),
    ARR(208, 168, 208, 132, MUT, 1.5),
    T(510, 186, "次のフレームへ（予測から繰り返す）", "middle", 9.5, FNT),
    T(440, 222, "「点」の不都合（ばらつく・抜ける・偽物）を、時間方向の一貫性で濾すのが追尾である", "middle", 10.5, MUT),
], "フレームごとに 予測 → 照合 → 修正 を回す。以降の図で各段を 1 つずつ開く")

F["r15_ab"] = SVG(840, 340, [
    T(420, 26, "α-β フィルタ — 観測をどれだけ信じるか", "middle", 12.5, INK, True),
    AXES(80, 250, 700, 190, "時間", "位置"),
] + [
    D(80 + 40 + i * 58, 250 - 30 - i * 14.5 - [8,-11,6,-14,10,-7,12,-9,5,-12,7,-4][i] , MUT, 3.6)
    for i in range(11)
] + [
    PL([(120 + i * 58, 250 - 30 - i * 14.5 - [8,-11,6,-14,10,-7,12,-9,5,-12,7,-4][i] * 0.25)
        for i in range(11)], SIG, 2.2),
    PL([(120 + i * 58, 250 - 30 - i * 14.5 - [8,-11,6,-14,10,-7,12,-9,5,-12,7,-4][i] * 0.85)
        for i in range(11)], ALI, 1.5, "5 4"),
] + [
    T(196, 96, "観測点（ばらつく）", "start", 10, MUT, True),
    T(560, 76, "α 小: 滑らか（実線）", "end", 10, SIG, True),
    T(560, 100, "α 大: 追従優先（破線）", "end", 10, ALI, True),
    BOX(140, 268, 560, 48, "予測 x_p = x + vT → 更新 x = x_p + α(z − x_p),  v += (β/T)(z − x_p)",
        "ずれ（イノベーション）の何割を取り込むかが α と β", SIG, SSOFT, INK, 8, 1.4, 12, 9.5, None, True),
], "滑らかさと応答性は両立せず、配分だけが選べる。α-β はその配分を固定値で人間が決める最小の追尾フィルタ")

F["r15_kalman"] = SVG(840, 300, [
    T(420, 26, "カルマンフィルタ — 配分を不確かさから計算する", "middle", 12.5, INK, True),
    BOX(60, 66, 220, 66, "予測の不確かさ P", "予測するたびに増える（モデルの不完全さぶん）", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    BOX(560, 66, 220, 66, "観測の不確かさ R", "センサの測定雑音。距離は細かく角度は粗い、も表現できる", GRN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(310, 90, 220, 56, "ゲイン K = P / (P + R)", "α の役を毎フレーム自動計算", ALI, ASOFT, INK, 8, 1.6, 13, 9.5, None, True),
    ARR(280, 99, 306, 108, MUT, 1.5), ARR(560, 99, 534, 108, MUT, 1.5),
    T(420, 186, "P ≫ R（予測に自信なし）→ K→1: 観測に飛びつく。トラック開始直後はこちら", "middle", 10.5, MUT),
    T(420, 208, "P ≪ R（予測に自信あり）→ K→0: 観測を軽く流す。収束後はこちら", "middle", 10.5, MUT),
    T(420, 244, "α-β で人間が決めていた配分が、分散の帳簿の算術に置き換わる——それがカルマンフィルタの核心",
      "middle", 10.5, SIG, True),
    T(420, 268, "レーダーは速度（ドップラー）を直接観測できるため、初期収束が速いのも強み", "middle", 10, FNT),
], "「どちらをどれだけ信じるか」を、信念ではなく分散で決める。不確かさの帳簿を持った α-β と読めばよい")

F["r15_gate"] = SVG(840, 320, [
    T(420, 26, "ゲーティングと対応付け", "middle", 12.5, INK, True),
    RECT(80, 56, 680, 210, 8, SCR, LIN, 1.3),
    # トラック1
    PL([(140, 210), (240, 190), (340, 172)], SIG, 1.8),
    D(340, 172, SIG, 5),
    '<ellipse cx="430" cy="156" rx="66" ry="40" fill="none" stroke="%s" stroke-width="1.6" stroke-dasharray="6 4"/>' % SIG,
    T(430, 104, "トラック 1 のゲート", "middle", 9.5, SIG, True),
    D(418, 150, INK, 4), D(472, 170, INK, 4),
    # トラック2
    PL([(180, 90), (280, 104), (380, 120)], GRN, 1.8),
    D(380, 120, GRN, 5),
    '<ellipse cx="470" cy="132" rx="60" ry="36" fill="none" stroke="%s" stroke-width="1.6" stroke-dasharray="6 4"/>' % GRN,
    D(600, 226, FNT, 4), T(600, 246, "ゲート外（新規 or 誤警報）", "middle", 9, FNT),
    T(508, 196, "重なり領域——取り違え（スワップ）の火種", "start", 9.5, ALI, True),
    ARR(506, 190, 462, 158, ALI, 1.3),
    T(420, 292, "割り当ては最近傍（NN）→ 全体最適（GNN）→ 確率的（JPDA/MHT）と高級化していく",
      "middle", 10.5, MUT),
    T(420, 312, "追尾の失敗はフィルタでなく対応付けで起きる。上限を決めるのはセンサの分解能である", "middle", 10.5, ALI, True),
], "予測の不確かさに応じた楕円窓の中だけで観測を探す。2 つのゲートが重なる瞬間が追尾の正念場になる")

F["r15_mn"] = SVG(860, 280, [
    T(430, 26, "トラック管理 — 生まれてから消えるまで", "middle", 12.5, INK, True),
    flowright(30, 110, [("仮トラック", "新しい検出点で誕生"), ("確定トラック", "N 中 M 回当たれば昇格（例 3/5）", SIG, SSOFT),
                        ("コースティング", "見失い中。予測だけで維持"), ("削除", "K 回連続で外れたら消す", ALI, ASOFT)],
              170, 60, 32)[0],
    W(637, 140, 637, 178, c=MUT, lw=1.4), W(637, 178, 500, 178, c=MUT, lw=1.4),
    ARR(500, 178, 442, 143, MUT, 1.5),
    T(560, 196, "再捕捉したら確定に戻る", "middle", 9.5, FNT),
    T(430, 240, "1 回の誤警報でトラックを立てず、1 回の見逃しで殺さない——確認と猶予のヒステリシス",
      "middle", 10.5, MUT),
    T(430, 262, "検出（Pfa・Pd）と M-of-N は一体で設計する。検出を少し緩めても確認論理が偽物を濾す", "middle", 10, FNT),
], "点の信頼性を時間方向の多数決で担保する状態機械。検出器と追尾器は 1 つのシステムの前段と後段である")

# ===================== 16. 車載 =====================

F["r16_band"] = SVG(820, 260, [
    T(410, 26, "車載レーダーの周波数 — 76〜81 GHz への集約", "middle", 12.5, INK, True),
    W(100, 150, 720, 150, c=LIN, lw=2),
    RECT(150, 116, 90, 34, 4, SCR, LIN, 1.3),
    T(195, 138, "24 GHz", "middle", 10.5, MUT, True),
    T(195, 170, "旧世代（狭帯域）", "middle", 9.5, FNT),
    T(195, 186, "新規設計は縮小", "middle", 9.5, FNT),
    RECT(480, 108, 200, 42, 4, SSOFT, SIG, 1.8),
    T(580, 134, "76〜81 GHz", "middle", 11.5, SIG, True),
    T(580, 170, "最大 5 GHz 幅 → ΔR 数 cm", "middle", 9.5, MUT),
    T(580, 186, "λ = 3.9 mm → アンテナ数 cm 角", "middle", 9.5, MUT),
    T(410, 232, "世界的にレーダー用として確保された帯。帯域・小型・全天候・シリコン化——すべての矢印がここを指した",
      "middle", 10.5, MUT),
], "24 GHz は許可帯域約 200 MHz で分解能 75 cm 止まり。cm 級が要る新機能はすべて 77 GHz 帯に移った")

F["r16_usecase"] = SVG(840, 412, [
    T(420, 26, "1 台の車に載る複数のレーダー", "middle", 12.5, INK, True),
    # 車を上から
    RECT(380, 130, 80, 150, 14, PAN, INK, 2),
    T(420, 210, "車", "middle", 11, INK, True),
    # LRR 前方
    '<path d="M 420 130 L 372 40 A 130 60 0 0 1 468 40 Z" fill="%s" opacity="0.85" stroke="%s" stroke-width="1.2"/>' % (SSOFT, SIG),
    T(420, 66, "LRR 〜250 m", "middle", 9.5, SIG, True),
    T(420, 80, "±15°・ACC/AEB", "middle", 8.5, MUT),
] + [
    # SRR 四隅
    '<path d="M %g %g L %g %g A 70 70 0 0 1 %g %g Z" fill="%s" opacity="0.8" stroke="%s" stroke-width="1"/>'
    % (x, y, x + dx1, y + dy1, x + dx2, y + dy2, ASOFT, ALI)
    for (x, y, dx1, dy1, dx2, dy2) in [
        (388, 140, -80, -18, -30, -76), (452, 140, 30, -76, 80, -18),
        (388, 270, -30, 76, -80, 18), (452, 270, 80, 18, 30, 76)]
] + [
    T(250, 118, "SRR 〜30 m・±75°", "middle", 9.5, ALI, True),
    T(250, 134, "死角・駐車・ドア", "middle", 8.5, MUT),
    T(600, 300, "SRR（後側方）", "middle", 9.5, ALI, True),
    T(420, 372, "遠くを見るほどビームは細い——利得と視野のトレードオフ（03・11 章）が、そのまま製品の分業になる",
      "middle", 10.5, MUT),
    T(420, 394, "典型は前 1 + 四隅 4 の 5 センサ構成。高機能車では 10 個近く載る", "middle", 10, FNT),
], "LRR は細く遠く、SRR は広く近く。全周をレーダーの傘で覆うのが現代の運転支援の標準装備である")

F["r16_soc"] = SVG(880, 360, [
    T(440, 26, "レーダー SoC の中身 — 本シリーズの総集編", "middle", 12.5, INK, True),
    RECT(50, 52, 780, 250, 12, SCR, INK, 1.8),
    T(90, 76, "1 チップ", "start", 10, MUT, True),
    BOX(80, 92, 170, 52, "PLL・チャープ生成", "S, T_c をレジスタ設定（08 章）", SIG, SSOFT, INK, 6, 1.3, 10.5, 8.8),
    BOX(80, 160, 170, 52, "送信アンプ（PA）×3", "10 dBm 級・TDM-MIMO（10 章）", SIG, SSOFT, INK, 6, 1.3, 10.5, 8.8),
    BOX(80, 228, 170, 52, "LNA・ミキサ ×4（RX）", "ビートへ変換（12 章）", SIG, SSOFT, INK, 6, 1.3, 10.5, 8.8),
    BOX(300, 160, 150, 52, "IF・ADC ×4", "ハイパス＋数十 MHz（12 章）", GRN, PAN, INK, 6, 1.3, 10.5, 8.8),
    BOX(300, 228, 150, 52, "FFT アクセラレータ", "距離・速度 FFT（09 章）", GRN, PAN, INK, 6, 1.3, 10.5, 8.8),
    BOX(500, 160, 150, 52, "DSP", "CFAR・角度・クラスタ（10・13 章）", GRN, PAN, INK, 6, 1.3, 10.5, 8.8),
    BOX(500, 228, 150, 52, "CPU（追尾・制御）", "トラック管理（15 章）", GRN, PAN, INK, 6, 1.3, 10.5, 8.8),
    BOX(690, 160, 120, 52, "車載バス I/F", "CAN-FD / Ethernet", LIN, PAN, INK, 6, 1.3, 10.5, 8.8),
    BOX(690, 228, 120, 52, "安全機構", "自己診断・冗長化", ALI, ASOFT, INK, 6, 1.3, 10.5, 8.8),
    ARR(250, 186, 296, 186, MUT, 1.4), ARR(250, 254, 296, 254, MUT, 1.4),
    ARR(450, 186, 496, 186, MUT, 1.4), ARR(450, 254, 496, 254, MUT, 1.4),
    ARR(650, 186, 686, 186, MUT, 1.4),
    T(440, 330, "チャープ生成から追尾までが同じダイ・同じクロック上——コヒーレント処理（積分・位相測定）がただで成立する",
      "middle", 10.5, SIG, True),
], "「部屋いっぱいの装置」が数 cm 角・数十ドルに。ミリ波レーダーの普及は半導体集積の直接の産物である")

F["r16_cascade"] = SVG(840, 300, [
    T(420, 26, "カスケード — チップを束ねてイメージングレーダーへ", "middle", 12.5, INK, True),
] + [
    RECT(90 + i * 120, 70, 100, 60, 8, SSOFT, SIG, 1.5) for i in range(4)
] + [
    T(140 + i * 120, 96, "SoC %d" % (i + 1), "middle", 10.5, INK, True) for i in range(4)
] + [
    T(140 + i * 120, 114, "3TX·4RX", "middle", 9, MUT) for i in range(4)
] + [
    W(90, 150, 550, 150, c=GRN, lw=1.6),
    T(600, 154, "基準発振（LO）を共有して同期", "start", 9.5, GRN, True),
    BOX(140, 190, 560, 52, "12TX × 16RX = 仮想 192 素子", "方位分解能 1° 級＋仰角。出力は数千点/フレームの点群",
        SIG, SSOFT, INK, 8, 1.6, 13, 9.5),
    T(420, 276, "距離×速度×方位×仰角の「4D イメージングレーダー」——全天候で LiDAR に迫る空間情報を出す現在の先端",
      "middle", 10.5, MUT),
], "仮想アレイの掛け算（10 章）をチップ間まで拡張する。同期した 4 チップは 1 枚の大きなレーダーとして振る舞う")

# ===================== 17. さまざまなレーダー =====================

F["r17_weather"] = SVG(840, 300, [
    T(420, 26, "気象レーダー — D⁶ の世界", "middle", 12.5, INK, True),
    radar_icon(100, 200),
    '<path d="M 140 172 L 430 96 L 430 232 Z" fill="%s" opacity="0.55" stroke="%s" stroke-width="1"/>' % (SSOFT, SIG),
] + [
    D(480 + (i * 37) % 220, 100 + (i * 53) % 140, GRN, 2.2 + (i % 3)) for i in range(24)
] + [
    T(590, 76, "雨の体積（無数の粒）", "middle", 10, GRN, True),
    BOX(560, 244, 240, 48, "σ ∝ D⁶ / λ⁴（レイリー散乱）", "直径 6 乗——大粒が圧倒的に光る", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    T(70, 266, "反射の合計 = レーダー反射因子 Z → dBZ（雨雲レーダーの色）", "start", 10, MUT),
    T(70, 286, "ドップラーで風の場、二重偏波で粒の種類——道具立ては本シリーズと同じ", "start", 10, FNT),
], "小雨 20 dBZ、土砂降り 50 dBZ。天気予報の色分けは、この章の言葉で言えば「体積クラッタの RCS 地図」である")

F["r17_sar"] = SVG(840, 320, [
    T(420, 26, "SAR — 移動で開口を合成する", "middle", 12.5, INK, True),
] + [
    D(120 + i * 75, 80, SIG, 5) for i in range(8)
] + [
    ARR(120, 60, 645, 60, MUT, 1.4), T(390, 48, "衛星・航空機の軌跡（速度 v）", "middle", 9.5, MUT),
    DARR(120, 104, 645, 104, GRN, 1.4, 5),
    T(382, 122, "合成開口 L = 照らしていた距離ぶん", "middle", 10, GRN, True),
] + [
    W(120 + i * 75, 86, 420, 240, c=FNT, lw=0.9, dash="2 5") for i in range(8)
] + [
    D(420, 240, ALI, 6), T(420, 264, "地上の 1 点", "middle", 10, ALI, True),
    BOX(560, 180, 250, 74, "各位置の受信を コヒーレントに合成",
        "= 長さ L の仮想アレイ。MIMO の仮想アレイ（10 章）の時間版", SIG, SSOFT, INK, 8, 1.4, 11.5, 9.5),
    T(420, 302, "遠いほどビームが広く長く照らせる → L ∝ R となり、分解能 ≈ D/2 は距離にも波長にも依らない",
      "middle", 10.5, SIG, True),
], "700 km 上空から 1 m 分解能で、雲を透して昼夜問わず地表を撮る。InSAR は 2 回の撮像の位相差で mm の変位まで見る")

F["r17_gpr"] = SVG(840, 320, [
    T(420, 26, "GPR — 地中を見るレーダー", "middle", 12.5, INK, True),
    RECT(60, 120, 340, 150, 0, SCR, LIN, 1.2),
    W(60, 120, 400, 120, c=INK, lw=2.4),
    BOX(150, 84, 130, 34, "アンテナを引く →", None, SIG, SSOFT, INK, 6, 1.3, 10.5),
    CIRC(230, 210, 16, ALI, 2.2, PAN),
    T(230, 246, "埋設管", "middle", 9.5, ALI, True),
] + [
    W(120 + i * 36, 120, 230, 196, c=FNT, lw=0.9, dash="2 4") for i in range(7)
] + [
    RECT(470, 84, 330, 186, 6, SCR, LIN, 1.2),
    T(635, 106, "記録（B スキャン）", "middle", 10, MUT, True),
    PL([(500 + 270 * u, 160 + 74 * (1 - math.exp(-((u - 0.5) / 0.32) ** 2)) + 8)
        for u in [i / 200 for i in range(201)]], ALI, 2),
    T(635, 154, "点状の物体は双曲線に写る", "middle", 9.5, ALI, True),
    T(635, 250, "真上で最短、離れると斜め距離が伸びるため", "middle", 9, FNT),
    T(420, 300, "土中では速度が c/√εr に落ちる。透過を稼ぐため低周波（100 MHz〜数 GHz）——深さと分解能のトレードオフ再び",
      "middle", 10, MUT),
], "水道管・空洞・遺跡・鉄筋——「掘らずに見る」道具。双曲線の開き具合から深さと土の誘電率まで推定できる")

F["r17_indoor"] = SVG(840, 300, [
    T(420, 26, "屋内センシング — 60 GHz の静かな仕事", "middle", 12.5, INK, True),
    RECT(120, 60, 600, 190, 4, "none", INK, 2.4),
    BOX(160, 84, 120, 40, "60 GHz センサ", None, SIG, SSOFT, INK, 6, 1.3, 10),
] + [
    '<path d="M %g %g q 8 -12 0 -24 q -8 -12 0 -24" fill="none" stroke="%s" stroke-width="1.6"/>' % (470, 200, GRN),
    '<path d="M %g %g q 10 -14 0 -28 q -10 -14 0 -28" fill="none" stroke="%s" stroke-width="1.4"/>' % (492, 200, GRN),
    CIRC(455, 148, 13, INK, 2), W(455, 161, 455, 200, c=INK, lw=2),
    W(455, 172, 436, 188, c=INK, lw=2), W(455, 172, 474, 188, c=INK, lw=2),
    T(470, 226, "呼吸・動きを検知", "middle", 9.5, GRN, True),
] + [
    T(646, 106, "電波は部屋の外へ", "middle", 9.5, MUT),
    T(646, 122, "漏れにくい（O₂ 吸収）", "middle", 9.5, MUT),
    T(420, 274, "映像を撮らずに人を感じる——在室検知・ジェスチャ・転倒検知・車内の置き去り検知",
      "middle", 10.5, MUT),
], "カメラのプライバシー問題と無縁のまま、樹脂・布を透かして人の存在と動きだけを検出できる")

F["r17_vital"] = SVG(840, 330, [
    T(420, 26, "バイタルセンシング — 位相はミクロン級の変位計", "middle", 12.5, INK, True),
    T(90, 66, "位相の時系列", "start", 10.5, INK, True),
] + [
    PL([(90 + 660 * u, 130 - 42 * math.sin(2 * math.pi * 2.6 * u) - 6 * math.sin(2 * math.pi * 13 * u))
        for u in [i / 500 for i in range(501)]], SIG, 1.8)
] + [
    T(420, 196, "大きなうねり＝呼吸（数 mm）、小さなさざ波＝心拍（0.1〜0.5 mm）", "middle", 10, MUT),
    BOX(150, 218, 540, 48, "Δφ = 4π ΔR / λ",
        "λ = 5 mm（60 GHz）で胸が 0.5 mm 動くと位相 72°——堂々と見える", SIG, SSOFT, INK, 8, 1.7, 14, 9.5, None, True),
    T(420, 296, "距離分解能（cm）では見えない動きが、同じ距離ビンの中の位相でなら読める",
      "middle", 10.5, SIG, True),
    T(420, 318, "対象ビンの複素値の偏角を追うだけ。呼吸 0.1〜0.5 Hz と心拍 0.8〜2 Hz は FFT で分離できる", "middle", 10, FNT),
], "InSAR の地盤 mm 監視も、呼吸検知も同じ 1 つの事実——「レーダーは往復位相の測定器」の応用である")

# ===================== 18. 設計 =====================

F["r18_flow"] = SVG(860, 400, [
    T(430, 26, "要求仕様 → チャープパラメータへの翻訳", "middle", 12.5, INK, True),
    BOX(50, 60, 240, 46, "距離分解能 ΔR", None, ALI, ASOFT, INK, 8, 1.5, 12),
    BOX(50, 120, 240, 46, "最大速度 v_max", None, ALI, ASOFT, INK, 8, 1.5, 12),
    BOX(50, 180, 240, 46, "速度分解能 Δv", None, ALI, ASOFT, INK, 8, 1.5, 12),
    BOX(50, 240, 240, 46, "最大距離 R_max", None, ALI, ASOFT, INK, 8, 1.5, 12),
    BOX(50, 300, 240, 46, "視野・角度分解能", None, ALI, ASOFT, INK, 8, 1.5, 12),
    BOX(570, 60, 240, 46, "掃引幅 B = c/2ΔR", None, SIG, SSOFT, INK, 8, 1.5, 12, 10, None, True),
    BOX(570, 120, 240, 46, "T_c ≤ λ/4v_max", None, SIG, SSOFT, INK, 8, 1.5, 12, 10, None, True),
    BOX(570, 180, 240, 46, "N ≥ λ/2T_cΔv", None, SIG, SSOFT, INK, 8, 1.5, 12, 10, None, True),
    BOX(570, 240, 240, 46, "f_IF = 2R_max·S/c → ADC", None, SIG, SSOFT, INK, 8, 1.5, 12, 10, None, True),
    BOX(570, 300, 240, 46, "素子数 K・間隔 d", None, SIG, SSOFT, INK, 8, 1.5, 12, 10, None, True),
] + [
    ARR(294, 83 + i * 60, 566, 83 + i * 60, MUT, 1.5) for i in range(5)
] + [
    T(430, 74, "09 章の式", "middle", 9, FNT),
    T(430, 380, "順番も大事: B → T_c →（S が決まる）→ N → ADC → アンテナ → 最後にリンクバジェットで成立性確認",
      "middle", 10.5, MUT),
], "左の「製品の言葉」を右の「チャープの言葉」へ 1 対 1 で翻訳する。この表がそのまま設計手順書になる")

F["r18_worked"] = SVG(860, 380, [
    T(430, 26, "ワークスルーの結果（駐車支援 SRR・77 GHz）", "middle", 12.5, INK, True),
] + [
    BOX(50, 56 + i * 50, 760, 42, t, s, c, f, INK, 6, 1.3, 11.5, 9.5)
    for i, (t, s, c, f) in enumerate([
        ("① ΔR 5 cm → B = 3 GHz", "77〜81 GHz 帯に収まる。合格", LIN, PAN),
        ("② v_max 20 m/s → T_c = 40 µs、S = 75 MHz/µs", "スロープはチップ上限級——最初の綱引き", LIN, PAN),
        ("③ Δv 0.4 m/s → N = 128 チャープ（5.1 ms）", "フレーム 50 ms に余裕で収まる", LIN, PAN),
        ("④ R_max 30 m → f_IF = 15 MHz、ADC 30 MSa/s", "M ≈ 1024 サンプル/チャープ", LIN, PAN),
        ("⑤ 視野±60°・分解能 10° → 3TX×4RX MIMO", "★ TDM で v_max が 1/3 に低下——要求割れ。対策の決断が要る", ALI, ASOFT),
        ("⑥ リンクバジェット: SNR +59 dB（処理利得込み）", "電力は楽勝。SRR の本丸は分解能と曖昧さの方", SIG, SSOFT),
    ])
], "手順は機械的に進むが、⑤のような衝突が必ずどこかで起きる。設計とは、その衝突のどこで妥協するかの決断である")

F["r18_triangle"] = SVG(820, 340, [
    T(410, 26, "設計の三角関係 — 全部は取れない", "middle", 12.5, INK, True),
    PL([(410, 70), (150, 264), (670, 264), (410, 70)], LIN, 1.8),
    BOX(320, 48, 180, 44, "距離を細かく", "B を広く → S が立つ", SIG, SSOFT, INK, 8, 1.4, 11.5, 9),
    BOX(60, 242, 180, 44, "速い目標に対応", "T_c を短く → S が立つ", SIG, SSOFT, INK, 8, 1.4, 11.5, 9),
    BOX(580, 242, 180, 44, "遠く・細かい速度", "ADC・観測時間・データ量", SIG, SSOFT, INK, 8, 1.4, 11.5, 9),
    T(410, 178, "S・ADC・時間", "middle", 11, ALI, True),
    T(410, 196, "という共有資源", "middle", 10, ALI, True),
    T(410, 300, "どの頂点へ寄るかが製品の性格になる: LRR は右下へ、駐車支援は上へ、干渉耐性は乱数化の余白へ",
      "middle", 10.5, MUT),
    T(410, 322, "「なぜこの仕様なのか」への答えは、いつもこの三角形の中にある", "middle", 10.5, SIG, True),
], "スロープ・ADC レート・観測時間という共有資源を、3 方向の欲求が取り合う構図。妥協点の置き場が設計である")

F["r18_map"] = SVG(840, 442, [
    T(420, 26, "シリーズ全体の地図", "middle", 12.5, INK, True),
    stack(170, 52, 500, [
        ("応用", "車載・気象・SAR・GPR・バイタル（16〜17 章）", GRN, PAN),
        ("設計", "要求 → B, T_c, N, S への翻訳（18 章）", SIG, SSOFT),
        ("処理", "3 回の FFT＋CFAR＋追尾（09〜10・13〜15 章）", SIG, SSOFT),
        ("ハードウェア", "アンテナ開口・雑音・ADC・SoC（11〜12・16 章）", LIN, PAN),
        ("波形", "パルス・圧縮・チャープ——分解能は帯域（05〜08 章）", LIN, PAN),
        ("物理", "往復時間・R⁴・RCS・ドップラー・位相（01〜04・07 章）", ALI, ASOFT),
    ], 52, 6)[0],
    T(420, 424, "レーダーとは「時間・周波数・位相」の 3 つの物差しで空間を測り直す技術である",
      "middle", 11, SIG, True),
], "下の層ほど普遍で、上の層ほど用途に近い。どの応用も、最下層の 5 つの物理の言い換えでできている")
