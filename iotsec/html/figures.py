# -*- coding: utf-8 -*-
"""IoT セキュリティ編の図版（インライン SVG）。

配色はページの CSS 変数を参照するので、ダーク/ライト両対応になる。
"""

F = {}

MUT = "var(--muted)"
INK = "var(--ink)"
SIG = "var(--signal)"
ALI = "var(--alias)"
BLU = "var(--blue)"
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

# ---------- 基本 ----------
def T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=False):
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s"'
            ' font-family="%s" font-weight="%s">%s</text>'
            % (x, y, a, sz, c, MONO if mono else "var(--sans)", "700" if b else "400", E(s)))

def W(*p, **k):
    c = k.get("c", MUT); lw = k.get("lw", 1.5); dash = k.get("dash")
    d = " ".join("%g,%g" % (p[i], p[i+1]) for i in range(0, len(p), 2))
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round" stroke-linejoin="round"%s/>' % (d, c, lw, da))

def RECT(x, y, w, h, r=8, fill=PAN, c=LIN, lw=1.4, dash=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" stroke="%s"'
            ' stroke-width="%g"%s/>' % (x, y, w, h, r, fill, c, lw, da))

def D(x, y, c=MUT, r=3.4):
    return '<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (x, y, r, c)

def ARR(x1, y1, x2, y2, c=MUT, lw=1.6, head=7):
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    hx, hy = x2 - head * math.cos(a), y2 - head * math.sin(a)
    p = "%g,%g %g,%g %g,%g" % (
        x2, y2,
        hx - head * 0.45 * math.sin(a), hy + head * 0.45 * math.cos(a),
        hx + head * 0.45 * math.sin(a), hy - head * 0.45 * math.cos(a))
    return W(x1, y1, hx, hy, c=c, lw=lw) + '<polygon points="%s" fill="%s"/>' % (p, c)

_NOLEAD = "。、，．・）」』】〉》”’!?！？,.:;：；"

def _wrap(s, n):
    """全角を 2 幅として概算で折り返す（行頭に句読点・閉じ括弧を置かない）"""
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

import os as _os
_CHECK = bool(_os.environ.get("FIGCHECK"))
_OVER = []

def BOX(x, y, w, h, title=None, sub=None, c=LIN, fill=PAN, tc=INK, r=8,
        lw=1.4, sz=12, ssz=10, dash=None, mono=False):
    o = [RECT(x, y, w, h, r, fill, c, lw, dash)]
    lines = _wrap(title, int((w - 14) / (sz * 0.55))) if title else []
    subl = _wrap(sub, int((w - 14) / (ssz * 0.6))) if sub else []
    n = len(lines) + len(subl)
    need = len(lines) * sz * 0.78 + len(subl) * ssz * 0.9 + (n - 1) * 3 + 10
    if _CHECK and need > h:
        _OVER.append((title, w, h, round(need, 1), lines + subl))
    y0 = y + h / 2 - (n - 1) * (sz * 0.78) / 2 + sz * 0.34
    for i, l in enumerate(lines):
        o.append(T(x + w / 2, y0 + i * sz * 0.78 + i * 3, l, "middle", sz, tc, True, mono))
    for j, l in enumerate(subl):
        o.append(T(x + w / 2, y0 + (len(lines) + j) * sz * 0.78 + (len(lines) + j) * 3 + 3,
                   l, "middle", ssz, MUT, False, mono))
    return "".join(o)

# ---------- 高水準の部品 ----------
def flowdown(cx, y0, items, w=300, bh=48, gap=30, c=LIN, fill=PAN, note=None):
    """縦に並べて矢印でつなぐ。items = [(title, sub) or title]"""
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

def stack(x, y, w, layers, lh=40, gap=4):
    """積層図。layers = [(label, sub, color, fill)]"""
    o = []
    yy = y
    for l in layers:
        lab = l[0]; sub = l[1] if len(l) > 1 else None
        col = l[2] if len(l) > 2 else LIN
        fl = l[3] if len(l) > 3 else PAN
        o.append(BOX(x, yy, w, lh, lab, sub, col, fl, INK, 6, 1.4, 11.5, 9.5))
        yy += lh + gap
    return "".join(o), yy - gap

def tree(x, y, nodes, lh=26, indent=26, cw=9.2):
    """字下げツリー。nodes = [(depth, text, color)]"""
    o = []
    ys = {}
    for i, nd in enumerate(nodes):
        dep, txt = nd[0], nd[1]
        col = nd[2] if len(nd) > 2 else MUT
        b = nd[3] if len(nd) > 3 else False
        yy = y + i * lh
        xx = x + dep * indent
        ys[i] = (dep, xx, yy)
        if dep > 0:
            # 親を探す
            pj = None
            for j in range(i - 1, -1, -1):
                if nodes[j][0] == dep - 1:
                    pj = j; break
            if pj is not None:
                px = x + (dep - 1) * indent + 8
                o.append(W(px, ys[pj][2] + 6, px, yy - 4, c=LIN, lw=1.2))
                o.append(W(px, yy - 4, xx - 6, yy - 4, c=LIN, lw=1.2))
        o.append(T(xx, yy, txt, "start", 11.5 if dep == 0 else 11, col, b))
    return "".join(o), y + len(nodes) * lh

def seq(x0, y0, actors, msgs, aw=170, ah=40, mh=34, span=None):
    """シーケンス図。actors = [名前]、msgs = [(from, to, ラベル, 注記)]"""
    o = []
    n = len(actors)
    span = span or 300
    xs = [x0 + i * span for i in range(n)]
    for i, a in enumerate(actors):
        o.append(BOX(xs[i] - aw / 2, y0, aw, ah, a, None, LIN, SCR))
    bottom = y0 + ah + 20 + len(msgs) * mh
    for i in range(n):
        o.append(W(xs[i], y0 + ah, xs[i], bottom, c=LIN, lw=1.2, dash="4 5"))
    yy = y0 + ah + 28
    for m in msgs:
        fr, to, lb = m[0], m[1], m[2]
        nt = m[3] if len(m) > 3 else None
        col = m[4] if len(m) > 4 else MUT
        if fr == to:
            o.append(T(xs[fr] + 14, yy + 4, lb, "start", 10.5, col, True))
        else:
            o.append(ARR(xs[fr] + (18 if to > fr else -18), yy,
                         xs[to] - (18 if to > fr else -18), yy, col, 1.6))
            o.append(T((xs[fr] + xs[to]) / 2, yy - 8, lb, "middle", 10.5, col, True))
            if nt:
                o.append(T((xs[fr] + xs[to]) / 2, yy + 15, nt, "middle", 9.5, FNT))
        yy += mh
    return "".join(o), bottom

def panel2(w, h, left, right, y0=54, gap=28):
    """左右比較。left/right = (見出し, 色, [行])"""
    o = []
    pw = (w - gap) / 2 - 20
    for k, (side, x) in enumerate([(left, 20), (right, 20 + pw + gap)]):
        title, col, rows = side
        o.append(RECT(x, y0, pw, h - y0 - 16, 10, SCR if k == 0 else SSOFT if col == SIG else ASOFT,
                      col, 1.5))
        o.append(T(x + pw / 2, y0 + 24, title, "middle", 12.5, col, True))
        yy = y0 + 50
        for r in rows:
            for l in _wrap(r, int(pw / 6.4)):
                o.append(T(x + 16, yy, l, "start", 10.5, INK))
                yy += 17
            yy += 6
    return "".join(o)

def chip(x, y, w, h, label, sub=None, c=INK):
    """チップの外形（脚つき）"""
    o = [RECT(x, y, w, h, 6, PAN, c, 1.8)]
    for i in range(4):
        px = x + w * (i + 1) / 5
        o.append(W(px, y, px, y - 8, c=c, lw=1.6))
        o.append(W(px, y + h, px, y + h + 8, c=c, lw=1.6))
    o.append(T(x + w / 2, y + h / 2 + (0 if not sub else -4), label, "middle", 12, INK, True))
    if sub:
        o.append(T(x + w / 2, y + h / 2 + 13, sub, "middle", 9.5, MUT))
    return "".join(o)

def lockicon(x, y, s=1.0, c=ALI, open_=False):
    o = [RECT(x - 9 * s, y - 2 * s, 18 * s, 15 * s, 3 * s, PAN, c, 1.8)]
    if open_:
        o.append('<path d="M %g %g a %g %g 0 0 1 %g 0 l 0 %g" fill="none" stroke="%s" stroke-width="%g"/>'
                 % (x - 5 * s, y - 2 * s, 5 * s, 5 * s, 10 * s, -3 * s, c, 1.8))
    else:
        o.append('<path d="M %g %g a %g %g 0 0 1 %g 0 l 0 %g" fill="none" stroke="%s" stroke-width="%g"/>'
                 % (x - 5 * s, y - 2 * s, 5 * s, 5 * s, 10 * s, 2 * s, c, 1.8))
    return "".join(o)

def keyicon(x, y, s=1.0, c=SIG):
    return ('<circle cx="%g" cy="%g" r="%g" fill="none" stroke="%s" stroke-width="%g"/>'
            % (x - 6 * s, y, 5 * s, c, 1.8)
            + W(x - 1 * s, y, x + 11 * s, y, c=c, lw=1.8)
            + W(x + 5 * s, y, x + 5 * s, y + 5 * s, c=c, lw=1.8)
            + W(x + 10 * s, y, x + 10 * s, y + 4 * s, c=c, lw=1.8))

def barrier(x, y0, y1, label=None, c=ALI):
    o = [W(x - 4, y0, x - 4, y1, c=c, lw=2.4), W(x + 4, y0, x + 4, y1, c=c, lw=2.4)]
    if label:
        o.append(T(x, y1 + 16, label, "middle", 10.5, c, True))
    return "".join(o)

def band(x, y, w, h, label, sub=None, c=SIG, fill=SSOFT):
    return BOX(x, y, w, h, label, sub, c, fill, INK, 6, 1.5, 11.5, 9.5)

def steps(x, y, items, lh=24, c=SIG):
    """丸数字つきの手順"""
    o = []
    for i, s in enumerate(items):
        yy = y + i * lh
        o.append('<circle cx="%g" cy="%g" r="9" fill="%s"/>' % (x, yy - 4, c))
        o.append(T(x, yy, str(i + 1), "middle", 10.5, "#fff", True))
        o.append(T(x + 18, yy, s, "start", 11, INK))
    return "".join(o), y + len(items) * lh

def timeline(x0, x1, y, marks, c=LIN):
    """marks = [(位置 0..1, ラベル, 補足, 色)]"""
    o = [W(x0, y, x1, y, c=c, lw=2), ARR(x1 - 10, y, x1, y, c, 1.6, 6)]
    for m in marks:
        p, lb = m[0], m[1]
        sub = m[2] if len(m) > 2 else None
        col = m[3] if len(m) > 3 else SIG
        xx = x0 + (x1 - x0) * p
        o.append(W(xx, y - 10, xx, y + 10, c=col, lw=2))
        o.append(D(xx, y, col, 4))
        o.append(T(xx, y - 20, lb, "middle", 11, col, True))
        if sub:
            o.append(T(xx, y + 30, sub, "middle", 9.5, FNT))
    return "".join(o)
# ===================== 01. なぜ難しいのか =====================

F["s01_supply"] = SVG(880, 250, [
    T(440, 26, "サプライチェーン — 「誰が鍵を持つのか」が決まっていない", "middle", 12.5, INK, True),
    flowright(24, 100, ["シリコン\nベンダ", "モジュール\nメーカー", ("ODM / EMS", "設計・製造の受託会社"),
                        "ブランド\nメーカー", "販売", "設置業者"], 118, 54, 18)[0],
    ARR(838, 100, 862, 100, MUT, 1.6),
    T(862, 122, "ユーザ", "middle", 11, MUT, True),
    W(214, 127, 214, 168, c=ALI, lw=1.4, dash="4 3"),
    T(214, 186, "誰が鍵を持つ？", "middle", 11, ALI, True),
    W(486, 127, 486, 168, c=ALI, lw=1.4, dash="4 3"),
    T(486, 186, "誰がファームウェアを署名する？", "middle", 11, ALI, True),
    RECT(120, 204, 640, 34, 8, SCR, LIN, 1.3),
    T(440, 226, "この線のどこかに必ず「決まっていない」箇所がある。そこが最初の穴になる",
      "middle", 11, MUT),
], "組み込み機器は多くの会社の手を渡って市場に出る。責任の切れ目が、そのままセキュリティの切れ目になる")

F["s01_asym"] = SVG(760, 270, [
    T(380, 26, "IT システムとの決定的な違い", "middle", 12.5, INK, True),
    panel2(760, 262, ("サーバ／クラウド", BLU,
        ["攻撃者は手元に実物を持てない",
         "ログインの試行回数を制限できる",
         "異常なアクセスを監視して遮断できる",
         "脆弱性が見つかれば即座に更新できる",
         "物理的な保護は データセンタが担う"]),
      ("組み込み機器", ALI,
        ["★ 攻撃者が現物を買って持ち帰れる",
         "★ 試行回数を制限できない（何度でも試せる）",
         "★ 誰も見ていない場所で解析される",
         "★ 更新が届くとは限らない。10 年動く",
         "★ 分解・加熱・給電を自由にされる"]), 46),
], "「攻撃者が現物を手に持てる」——この一点で、IT の常識がほとんど通用しなくなる")

F["s01_cost"] = SVG(680, 280, [
    T(340, 26, "守り方の基準は「割に合わない」ところまで上げること", "middle", 12.5, INK, True),
    W(90, 232, 620, 232, c=LIN, lw=1.4), W(90, 232, 90, 56, c=LIN, lw=1.4),
    T(620, 254, "対策の強さ →", "end", 10.5, FNT),
    T(84, 62, "コスト", "end", 10.5, FNT),
    '<polyline points="100,222 180,196 270,160 360,124 450,96 540,76 610,66" fill="none"'
    ' stroke="%s" stroke-width="2.6"/>' % ALI,
    T(470, 88, "攻撃コスト", "end", 11, ALI, True),
    W(90, 150, 615, 150, c=BLU, lw=2.2, dash="6 4"),
    T(610, 142, "資産の価値（守るものの値段）", "end", 11, BLU, True),
    W(316, 232, 316, 76, c=SIG, lw=1.6, dash="3 3"),
    T(316, 252, "ここを超えれば、攻撃は割に合わない", "middle", 10.5, SIG, True),
    RECT(316, 60, 300, 90, 0, SSOFT, "none", 0),
    T(470, 118, "十分な領域", "middle", 12, SIG, True),
], "完全な安全は買えない。「守るものの価値より、破るコストのほうが高い」状態を作るのが目標になる")

F["s01_lifetime"] = SVG(760, 230, [
    T(380, 26, "製品寿命と脆弱性の時間軸", "middle", 12.5, INK, True),
    timeline(80, 690, 110, [
        (0.0, "出荷", "ここで作り込んだものが確定する", SIG),
        (0.28, "2 年後", "使っている OSS に CVE が出る", ALI),
        (0.58, "5 年後", "暗号アルゴリズムが非推奨になる", ALI),
        (0.95, "10 年後", "まだ現場で動いている", MUT)]),
    RECT(90, 168, 580, 48, 8, SCR, LIN, 1.3),
    T(380, 190, "設計時に「更新できる仕組み」を入れておかなければ、", "middle", 11, MUT),
    T(380, 208, "この 10 年のどこかで必ず詰む", "middle", 11.5, ALI, True),
], "組み込み機器は出荷後 10 年動く。「今は安全」では足りず、「後から直せる」ことが要件になる")

# ===================== 02. 脅威モデリング =====================

F["s02_boundary"] = SVG(840, 340, [
    T(420, 26, "信頼境界 — どこで信頼が切り替わるか", "middle", 12.5, INK, True),
    RECT(250, 48, 560, 250, 12, "none", INK, 2, "8 5"),
    T(530, 68, "機器の筐体（物理境界）", "middle", 11, INK, True),
    BOX(40, 96, 150, 46, "クラウド", None, LIN, SCR),
    BOX(40, 186, 150, 46, "スマホ", None, LIN, SCR),
    chip(300, 96, 150, 62, "MCU"),
    BOX(560, 96, 190, 46, "外付けフラッシュ", None, LIN, PAN),
    BOX(290, 196, 250, 46, "SoC 内部：Secure / Non-secure", None, SIG, SSOFT),
    BOX(590, 196, 160, 46, "デバッグポート", "SWD / JTAG", ALI, ASOFT),
    ARR(190, 119, 296, 119, MUT, 1.6), T(243, 104, "TLS", "middle", 10, BLU, True),
    ARR(190, 209, 286, 209, MUT, 1.6), T(238, 194, "BLE", "middle", 10, BLU, True),
    ARR(454, 119, 556, 119, MUT, 1.6), T(505, 104, "SPI", "middle", 10, BLU, True),
    W(375, 158, 375, 192, c=MUT, lw=1.4),
    W(590, 219, 545, 219, c=MUT, lw=1.4),
] + [
    T(x, y, s, "middle", 10.5, ALI, True) for x, y, s in
    [(243, 152, "境界 A"), (238, 242, "境界 B"), (505, 152, "境界 C"),
     (415, 260, "境界 D"), (670, 260, "境界 E")]
] + [
    RECT(40, 288, 190, 44, 8, SCR, LIN, 1.3),
    T(135, 306, "境界を跨ぐところが", "middle", 10.5, MUT),
    T(135, 322, "すべて検討対象になる", "middle", 10.5, MUT, True),
], "信頼境界を引く作業が脅威モデリングの本体。境界を跨ぐデータには必ず検証が要る")

F["s02_tree"] = SVG(780, 524, [
    T(390, 26, "攻撃ツリー — 目標「機器の秘密鍵を入手する」", "middle", 12.5, INK, True),
    tree(40, 66, [
        (0, "目標：機器の秘密鍵を入手する", ALI, True),
        (1, "(a) ソフトウェア経由", INK, True),
        (2, "ファームウェアの脆弱性を突いてメモリを読む", MUT),
        (3, "対策：メモリ安全・スタック保護・MPU（15 章）", SIG),
        (2, "デバッグ／診断コマンドで読み出す", MUT),
        (3, "対策：量産ビルドから除去", SIG),
        (1, "(b) デバッグポート経由", INK, True),
        (2, "SWD / JTAG でメモリを読む", MUT),
        (3, "対策：デバッグ無効化・ライフサイクル状態（11・14 章）", SIG),
        (2, "保護をグリッチで解除する", MUT),
        (3, "対策：耐フォールト設計（10 章）", SIG),
        (1, "(c) 外部メモリ経由", INK, True),
        (2, "SPI フラッシュを外して読む", MUT),
        (3, "対策：フラッシュ暗号化（06 章）", SIG),
        (2, "SPI バスをプロービングする", MUT),
        (3, "対策：オンザフライ復号（鍵はチップ内）", SIG),
        (1, "(d) サイドチャネル", INK, True),
        (2, "暗号処理中の消費電力から鍵を推定する", MUT),
        (3, "対策：DPA 対策済み暗号エンジン（09 章）", SIG),
        (1, "(e) サプライチェーン", INK, True),
        (2, "工場から鍵が流出する", MUT),
        (3, "対策：セキュアプロビジョニング（12 章）", SIG),
        (2, "開発環境から署名鍵が流出する", MUT),
        (3, "対策：HSM での鍵管理、署名の分離（12 章）", SIG),
    ], 17)[0],
    T(390, 506, "枝を全部潰す必要はない。「最も安い枝」から順に、割に合わない高さまで塞ぐ",
      "middle", 11, MUT, True),
], "攻撃ツリーは、目標から手段へ分解していく。対策は葉に対応させ、どの枝が一番安いかで優先順位を決める")

F["s02_stride"] = SVG(760, 300, [
    T(380, 26, "STRIDE — 脅威の 6 分類", "middle", 12.5, INK, True),
] + sum([[BOX(30 + (i % 3) * 240, 52 + (i // 3) * 112, 222, 98, t, s, c, PAN, INK, 8, 1.4, 12, 10)]
         for i, (t, s, c) in enumerate([
    ("S — なりすまし", "他の機器やサーバのふりをする。対策：相互認証・機器固有鍵", LIN),
    ("T — 改ざん", "ファームウェアやデータを書き換える。対策：署名検証・完全性", LIN),
    ("R — 否認", "やったことを否定する。対策：ログ・監査証跡", LIN),
    ("I — 情報漏洩", "鍵や個人情報が読まれる。対策：暗号化・不可視化", ALI),
    ("D — サービス妨害", "動作を止める。対策：ウォッチドッグ・帯域制御", LIN),
    ("E — 権限昇格", "できないはずのことをする。対策：分離・最小権限", ALI)])], [])
  + [T(380, 288, "境界を跨ぐデータフローごとに、この 6 つを順に当てて漏れを潰す", "middle", 11, MUT, True)],
    "STRIDE は「思いつき」を防ぐためのチェックリスト。分類そのものより、全境界に機械的に当てることに意味がある")

F["s02_classes"] = SVG(800, 330, [
    T(400, 26, "攻撃者のクラス — どこまで守るかを決めるための物差し", "middle", 12.5, INK, True),
] + sum([[
    RECT(40, 56 + i * 50, 720, 42, 8, ASOFT if i >= 3 else SCR, ALI if i >= 3 else LIN, 1.3),
    T(72, 82 + i * 50, "クラス %d" % (i + 1), "middle", 11.5, ALI if i >= 3 else INK, True),
    T(120, 76 + i * 50, n, "start", 11.5, INK, True),
    T(120, 92 + i * 50, d, "start", 10, MUT),
    T(744, 82 + i * 50, cost, "end", 11, ALI if i >= 3 else MUT, True),
] for i, (n, d, cost) in enumerate([
    ("いたずら・スクリプトキディ", "公開ツールを試すだけ。既知の穴を突く", "〜1 万円"),
    ("熟練した個人・愛好家", "分解して UART / SPI を読む。ロジアナ程度", "〜10 万円"),
    ("犯罪者（金銭目的）", "サイドチャネル・グリッチ。投資回収を計算している", "〜数百万円"),
    ("専門ラボ・競合企業", "FIB・レーザー・チップ解析。設備を持っている", "〜数千万円"),
    ("国家レベル", "実質的に制限がない", "制限なし")])], [])
  + [T(400, 318, "「クラス 3 まで守り、4 以上は受容する」——この線引きを文書に書くことが設計の出発点になる",
       "middle", 11, MUT, True)],
    "守る相手を決めないと、対策の過不足が判断できない。クラスを明記して、受容するリスクも明記する")

F["s02_goal"] = SVG(760, 300, [
    T(380, 26, "セキュリティ目標の書き方（例：屋外カメラ）", "middle", 12.5, INK, True),
] + sum([[
    RECT(40, 52 + i * 40, 680, 34, 6, SSOFT if c == SIG else SCR, c, 1.3),
    T(150, 74 + i * 40, k, "end", 11, c if c != LIN else MUT, True),
    T(168, 74 + i * 40, v, "start", 10.5, INK),
] for i, (k, v, c) in enumerate([
    ("守るもの", "① ファームウェア完全性 ② クラウド接続用の秘密鍵 ③ ユーザの映像データ", SIG),
    ("想定攻撃者", "クラス 3（犯罪者・金銭目的）まで", SIG),
    ("前提", "屋外に設置され、攻撃者は現物を入手できる", LIN),
    ("必須要件", "セキュアブート／機器固有鍵／セキュア OTA／デバッグ無効化／TLS 相互認証", SIG),
    ("受容するリスク", "専用ラボによる物理攻撃（FIB・レーザー）での鍵抽出", ALI),
])], [])
  + [T(380, 274, "「受容するリスク」を書くことが最も重要。書かないと、際限なく対策が増えるか、逆に無防備になる",
       "middle", 11, MUT, True)],
    "脅威モデリングの成果物はこの 5 行。これが後の設計判断すべての根拠になる")

# ===================== 03. 規制と認証 =====================

F["s03_map"] = SVG(820, 340, [
    T(410, 26, "規制と認証の地図", "middle", 12.5, INK, True),
    RECT(30, 48, 380, 268, 10, SCR, ALI, 1.5),
    T(220, 72, "強制力のあるもの（法規制）", "middle", 12, ALI, True),
] + sum([[BOX(48, 88 + i * 56, 344, 46, t, s, ALI, PAN, INK, 6, 1.3, 11.5, 9.5)]
         for i, (t, s) in enumerate([
    ("EU — CRA（サイバーレジリエンス法）", "デジタル製品全般。脆弱性対応・SBOM・報告義務"),
    ("EU — RED 委任規則 3.3(d)(e)(f)", "無線機器。ネットワーク保護・個人情報・詐欺防止"),
    ("英国 — PSTI 法", "消費者向け IoT。既定パスワード禁止・更新期間の公表"),
    ("米国 — Cyber Trust Mark ほか", "任意のラベリング制度として運用される")])], [])
  + [RECT(430, 48, 360, 268, 10, SCR, BLU, 1.5),
     T(610, 72, "任意だが取引条件になるもの", "middle", 12, BLU, True)]
  + sum([[BOX(448, 88 + i * 56, 324, 46, t, s, BLU, PAN, INK, 6, 1.3, 11.5, 9.5)]
         for i, (t, s) in enumerate([
    ("IEC 62443-4-1 / 4-2", "産業用制御。開発プロセスと製品要求"),
    ("PSA Certified（Level 1〜3）", "Arm 系。RoT の実装を第三者が評価する"),
    ("SESIP", "組み込み向けの評価手法。レベルで深さが決まる"),
    ("Common Criteria（EAL）", "厳格だが高コスト。SE / TPM が取得している")])], []),
   "規制の詳細と適用日は改訂される。ここは全体像の把握用で、判断は必ず規則本文と認証機関の一次情報で行う")

F["s03_levels"] = SVG(780, 284, [
    T(390, 26, "認証レベルは「どこまで踏み込んで調べたか」の深さを表す", "middle", 12.5, INK, True),
    stack(150, 54, 480, [
        ("Level 3 相当", "実際に攻撃を試みる（サイドチャネル・フォールト）。実験室で評価", ALI, ASOFT),
        ("Level 2 相当", "設計と実装を第三者が精査する。時間を区切った脆弱性評価", SIG, SSOFT),
        ("Level 1 相当", "質問票への回答と設計文書のレビュー。自己申告に近い", LIN, SCR),
    ], 56, 6)[0],
    T(390, 268, "「認証を取っている」だけでは意味が薄い。どのレベルで、いつ、どの構成で取ったかを見る",
      "middle", 11, MUT, True),
], "レベルが上がるほど評価コストと期間が跳ね上がる。必要な水準を先に決めてから品種を選ぶ")

F["s03_who"] = SVG(760, 250, [
    T(380, 26, "誰が何に責任を負うか", "middle", 12.5, INK, True),
    flowright(40, 110, [("シリコンベンダ", "チップの機能と認証"),
                        ("モジュール／OEM", "実装と設定"),
                        ("製品を出す会社", "★ 規制上の義務"),
                        ("運用者", "更新の適用")], 152, 62, 26)[0],
    RECT(40, 176, 680, 58, 8, ASOFT, ALI, 1.4),
    T(380, 200, "規制の名宛人は「市場に出す会社」である。", "middle", 11.5, ALI, True),
    T(380, 220, "チップが認証済みでも、設定を間違えれば責任は自社に来る", "middle", 11, INK),
], "「ベンダが認証を取っているから大丈夫」は成立しない。有効化と設定の責任は製品を出す側にある")
# ===================== 04. Root of Trust =====================

F["s04_two"] = SVG(760, 350, [
    T(380, 26, "2 段構えの Root of Trust", "middle", 12.5, INK, True),
    BOX(150, 50, 460, 78, "第 1 段：Immutable RoT（変えられない）",
        "ブート ROM に焼かれた、ごく小さな検証コード。OTP の公開鍵ハッシュを読み、次段の署名を検証するだけ。数 KB",
        ALI, ASOFT, INK, 8, 1.6, 12.5, 10),
    ARR(380, 128, 380, 156, MUT, 1.8), T(392, 148, "検証して起動", "start", 10, FNT),
    BOX(150, 158, 460, 92, "第 2 段：Updatable RoT（更新できる）",
        "フラッシュ上の本格的なセキュリティサービス。複数アルゴリズム対応の署名検証、鍵管理、暗号サービス、アテステーション、セキュア OTA の制御。数十〜数百 KB",
        SIG, SSOFT, INK, 8, 1.6, 12.5, 10),
    ARR(380, 250, 380, 278, MUT, 1.8), T(392, 270, "検証して起動", "start", 10, FNT),
    BOX(150, 280, 460, 46, "第 3 段：アプリケーションファームウェア", None, LIN, PAN),
    T(96, 92, "焼き切り", "middle", 10, ALI, True),
    T(96, 208, "更新可", "middle", 10, SIG, True),
    lockicon(96, 66, 1.0, ALI),
    lockicon(96, 182, 1.0, SIG, True),
], "第 1 段は絶対に更新できないので、極限まで小さくする。バグがあっても直せないから")

F["s04_keyhier"] = SVG(840, 480, [
    T(420, 26, "鍵の階層 — 1 個の HUK からすべてを導出する", "middle", 12.5, INK, True),

    # HUK の実体（品種によりどちらか）
    RECT(30, 56, 270, 138, 10, SCR, LIN, 1.3),
    T(165, 80, "HUK の実体は品種による", "middle", 11, MUT, True),
    BOX(48, 92, 234, 40, "製造時に乱数を OTP に焼き込む", None, LIN, PAN, INK, 6, 1.3, 10.5),
    T(165, 146, "または", "middle", 9.5, FNT),
    BOX(48, 152, 234, 40, "PUF から起動のたびに再生成する", None, LIN, PAN, INK, 6, 1.3, 10.5),
    ARR(304, 124, 356, 124, MUT, 1.5),
    T(330, 110, "どちらでも", "middle", 9, FNT),
    T(330, 142, "以降は同じ", "middle", 9, FNT),

    BOX(360, 90, 330, 68, "HUK（Hardware Unique Key）",
        "機器ごとに固有の秘密。CPU から読めない", ALI, ASOFT, INK, 8, 1.6, 12, 9.5),

    ARR(525, 158, 525, 218, MUT, 1.8),
    T(540, 192, "KDF（鍵導出関数）に通す", "start", 10.5, SIG, True),

    # 派生鍵（3 本とも HUK 由来）
    W(525, 218, 155, 218, 155, 232, c=MUT, lw=1.5),
    W(525, 218, 420, 218, 420, 232, c=MUT, lw=1.5),
    W(525, 218, 685, 218, 685, 232, c=MUT, lw=1.5),
    T(740, 214, "派生鍵", "start", 11.5, SIG, True),
] + [BOX(40 + i * 265, 234, 230, 56, t, s, SIG, SSOFT, INK, 6, 1.3, 11, 9.5)
     for i, (t, s) in enumerate([
    ("ストレージ暗号鍵", "フラッシュ／NVM の暗号化に使う"),
    ("アプリごとの鍵", "アプリ別・パーティション別に分ける"),
    ("アテステーション鍵の保護鍵", "証明用の鍵（IAK、次節）を包む")])] + [

    # 別系統
    W(40, 318, 800, 318, c=LIN, lw=1, dash="3 5"),
    T(420, 336, "以下は HUK の派生ではない（別系統で持つもの）", "middle", 10.5, BLU, True),
    BOX(40, 348, 380, 52, "ROTPK のハッシュ", "OTP に焼く。署名検証用の公開鍵情報なので秘密ではない",
        BLU, PAN, INK, 6, 1.3, 11.5, 9.5),
    BOX(440, 348, 360, 52, "機器 ID（IAK / DevID）", "機器固有の秘密鍵と証明書（12 章）",
        BLU, PAN, INK, 6, 1.3, 11.5, 9.5),

    T(420, 436, "使う鍵は 1 本ずつ保存するのではなく、必要になるたびに HUK から KDF で導出する",
      "middle", 11, MUT, True),
    T(420, 458, "HUK さえ読めなければ派生鍵も再現できない——だから「HUK を CPU から読めなくする」ことが最優先になる",
      "middle", 11, ALI, True),
], "OTP か PUF かは HUK の置き場所の違いにすぎず、どちらの品種でも派生の仕組みは同じ。守るべき根は HUK の 1 点に集約される")
F["s04_attest"] = SVG(820, 448, [
    T(410, 26, "リモートアテステーション — 「本当に正規のコードが動いているか」", "middle", 12.5, INK, True),
    seq(200, 48, ["機器", "サーバ"], [
        (0, 0, "① 起動時に各段のコードを測定して記録する", "測定ブート", SIG),
        (1, 0, "② チャレンジ（乱数）", "リプレイを防ぐため毎回変える"),
        (0, 0, "③ 「チャレンジ + 測定値 + 機器 ID」を機器固有の秘密鍵で署名", None, SIG),
        (0, 1, "④ 署名を返す"),
        (1, 1, "⑤ 証明書チェーンで署名を検証", None, BLU),
        (1, 1, "⑥ 測定値が期待値と一致するか確認", None, BLU),
    ], 190, 40, 40, 420)[0],
    RECT(60, 372, 700, 52, 8, SCR, LIN, 1.3),
    T(410, 396, "一致 → 正規のファームウェアが動いていると判断してサービスを許可", "middle", 11, SIG, True),
    T(410, 416, "不一致 → 隔離・更新の強制・アラート", "middle", 11, ALI, True),
], "セキュアブートは機器の中で完結する。アテステーションは、その結果を外から確認できるようにする")

F["s04_dice"] = SVG(800, 320, [
    T(400, 26, "DICE — コードのハッシュを混ぜながら鍵を派生させる", "middle", 12.5, INK, True),
    BOX(230, 50, 340, 54, "UDS（Unique Device Secret）",
        "OTP に焼く。第 1 段の ROM だけが読める", ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    ARR(400, 104, 400, 136, MUT, 1.6),
    T(414, 126, "CDI = KDF( UDS, Hash(第 1 段のコード) )", "start", 10.5, SIG, True),
    BOX(230, 138, 340, 54, "CDI（Compound Device Identifier）",
        "第 1 段のコードに依存する秘密", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(400, 192, 400, 224, MUT, 1.6),
    T(414, 214, "さらに次段のハッシュと合成", "start", 10.5, SIG),
    BOX(260, 226, 280, 44, "次段の CDI …", None, LIN, PAN),
    RECT(60, 282, 680, 30, 8, SCR, LIN, 1.3),
    T(400, 302, "コードが 1 ビットでも変わると、派生する鍵が全部変わる＝改ざんが鍵の不一致として現れる",
      "middle", 11, MUT, True),
], "測定と鍵導出を一体にしてしまう考え方。改ざんされた機器は「正しい鍵を作れない」ので自動的に締め出される")

F["s04_tocttou"] = SVG(760, 260, [
    T(380, 26, "検証したもの ≠ 実行したもの（TOCTOU）", "middle", 12.5, INK, True),
    timeline(120, 640, 110, [
        (0.05, "t1", "ファームウェアを検証する → OK", SIG),
        (0.95, "t2", "ファームウェアを実行する", SIG)]),
    RECT(230, 148, 300, 40, 8, ASOFT, ALI, 1.5),
    T(380, 172, "この間に書き換えられたら？", "middle", 12, ALI, True),
    ARR(380, 148, 380, 126, ALI, 1.6),
    T(380, 214, "外部フラッシュから実行する構成では現実的な脅威になる。", "middle", 11, MUT),
    T(380, 234, "対策：内部フラッシュへコピーしてから検証する／オンザフライ復号と認証（06 章）",
      "middle", 11, INK, True),
], "「検証した瞬間」と「実行する瞬間」が離れていると、その隙間が攻撃面になる")

F["s04_chain"] = SVG(800, 230, [
    T(400, 26, "信頼の連鎖 — 1 か所でも切れると全部が無効になる", "middle", 12.5, INK, True),
    flowright(40, 110, [("ROM", "焼き切り", ALI, ASOFT), ("ブートローダ", "署名検証済"),
                        ("アプリ", "署名検証済"), ("設定・データ", "★ 検証されるか？", ALI, ASOFT)],
              160, 58, 26)[0],
    T(400, 178, "各段が「次の段を検証してから渡す」。どこか 1 段でも検証を飛ばせば、そこから下は保証がない",
      "middle", 11, MUT, True),
    T(400, 200, "見落としやすいのは最後——設定ファイル・ブートパラメータ・外部ストレージ",
      "middle", 11, ALI, True),
], "信頼の連鎖は最も弱い環の強さしか持たない。「コードは検証したがデータは素通し」は典型的な抜け穴")

# ===================== 05. セキュアブート =====================

F["s05_chain"] = SVG(820, 400, [
    T(410, 26, "セキュアブートの流れ", "middle", 12.5, INK, True),
    BOX(300, 48, 220, 36, "電源投入", None, LIN, SCR),
    ARR(410, 84, 410, 106, MUT, 1.6),
    RECT(230, 108, 360, 96, 8, ASOFT, ALI, 1.6),
    T(410, 128, "ブート ROM（Immutable RoT）", "middle", 12.5, INK, True),
    steps(258, 150, ["OTP から ROTPK のハッシュを読む",
                     "イメージ添付の公開鍵をハッシュして照合",
                     "その公開鍵でイメージの署名を検証",
                     "OK なら実行、NG なら停止／リカバリ"], 17, ALI)[0],
    ARR(410, 204, 410, 226, MUT, 1.6),
    BOX(230, 228, 360, 52, "第 2 段：ブートローダ / Updatable RoT",
        "同じことを次段に対して行う", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(410, 280, 410, 302, MUT, 1.6),
    BOX(230, 304, 360, 46, "第 3 段：アプリケーション", None, LIN, PAN),
    ARR(410, 350, 410, 368, MUT, 1.6),
    T(410, 386, "起動完了", "middle", 12, INK, True),
    RECT(30, 108, 180, 96, 8, SCR, LIN, 1.3),
    T(120, 138, "ここだけは", "middle", 11, MUT),
    T(120, 158, "更新できない", "middle", 11.5, ALI, True),
    T(120, 182, "＝ 最小限にする", "middle", 10.5, MUT),
], "各段が次段を検証してから制御を渡す。ROM は焼き切りなので、そこにバグがあると回収不能になる")

F["s05_image"] = SVG(720, 340, [
    T(360, 26, "署名付きイメージの構造", "middle", 12.5, INK, True),
    stack(120, 50, 480, [
        ("ヘッダ", "マジック番号・バージョン・サイズ・ロードアドレス・アルゴリズム識別子", LIN, SCR),
        ("セキュリティバージョン番号（SVN）", "ロールバック防止に使う（13 章）", ALI, ASOFT),
        ("公開鍵（または鍵の識別子）", "OTP のハッシュと照合する", BLU, PAN),
        ("ペイロード（実際のコード）", None, LIN, PAN),
        ("署名 = Sign( 秘密鍵, Hash(ヘッダ + ペイロード) )", None, SIG, SSOFT),
    ], 52, 4)[0],
    RECT(60, 350 - 62, 600, 0, 0, "none", "none", 0),
    T(360, 320, "署名の対象に「ヘッダ」を含めることが重要。含めないとサイズや SVN を書き換えられる",
      "middle", 11, ALI, True),
], "ヘッダを署名対象から外した実装は実際に存在した。何を署名しているかを必ず確認する")

F["s05_verify"] = SVG(820, 290, [
    T(410, 26, "検証の中身 — どこでハードウェアに繋がっているか", "middle", 12.5, INK, True),
    BOX(40, 60, 190, 54, "イメージ", "ヘッダ + コード", LIN, PAN),
    ARR(230, 87, 268, 87, MUT, 1.6),
    BOX(270, 60, 150, 54, "ハッシュ計算", "SHA-256", LIN, PAN),
    ARR(420, 87, 458, 87, MUT, 1.6),
    BOX(460, 60, 200, 54, "署名検証", "公開鍵で復号して比較", SIG, SSOFT),
    BOX(460, 160, 200, 54, "添付の公開鍵", None, BLU, PAN),
    ARR(560, 160, 560, 118, MUT, 1.6),
    ARR(560, 214, 560, 244, MUT, 1.6),
    BOX(440, 246, 240, 40, "ハッシュして OTP と照合", None, ALI, ASOFT),
    BOX(700, 160, 100, 54, "OTP", "ROTPK\nハッシュ", ALI, ASOFT),
    ARR(700, 266, 750, 266, MUT, 1.6), W(750, 266, 750, 214, c=MUT, lw=1.6),
    RECT(40, 160, 380, 126, 8, SCR, LIN, 1.3),
    T(230, 192, "ここが「信頼の起点」", "middle", 12, ALI, True),
    T(230, 216, "添付された公開鍵をそのまま信じてはいけない。", "middle", 10.5, MUT),
    T(230, 234, "必ずシリコンに焼かれたハッシュと突き合わせる。", "middle", 10.5, MUT),
    T(230, 256, "この照合を飛ばすと、攻撃者は自分の鍵で", "middle", 10.5, ALI),
    T(230, 274, "署名したイメージを通せてしまう", "middle", 10.5, ALI, True),
], "署名検証そのものより、「どの公開鍵を信じるか」の決め方が本質。OTP のハッシュ照合が要になる")

F["s05_measure"] = SVG(780, 230, [
    T(390, 26, "セキュアブートと測定ブートは目的が違う", "middle", 12.5, INK, True),
    panel2(780, 222, ("セキュアブート", SIG,
        ["検証 → NG なら停止する",
         "機器の中で判断が完結する",
         "改ざんされたコードは動かない",
         "起動できない＝現地で文鎮化する危険もある"]),
      ("測定ブート", BLU,
        ["ハッシュを記録 → そのまま起動する",
         "判定は後からサーバが行う（04 章）",
         "改ざんされていても動きはする",
         "「動くが隔離される」運用ができる"]), 46),
], "止めるか、記録するか。両方を組み合わせて「起動はするが、サービスは受けられない」設計にすることも多い")

# ===================== 06. 鍵の保管 =====================

F["s06_bad_good"] = SVG(800, 300, [
    T(400, 26, "鍵は「読めない」ことが要件になる", "middle", 12.5, INK, True),
    RECT(24, 48, 372, 236, 10, ASOFT, ALI, 1.5),
    T(210, 72, "悪い設計", "middle", 12.5, ALI, True),
    BOX(48, 88, 130, 44, "OTP", "AES 鍵（平文）", ALI, PAN, INK, 6, 1.3, 11, 9),
    ARR(178, 110, 216, 110, ALI, 1.6),
    BOX(218, 88, 150, 44, "CPU", "鍵を読み出す", ALI, PAN, INK, 6, 1.3, 11, 9),
    ARR(293, 132, 293, 160, ALI, 1.6),
    BOX(198, 162, 190, 44, "CPU のメモリ", "平文の鍵が乗る", ALI, PAN, INK, 6, 1.3, 11, 9),
    T(210, 232, "脆弱性 1 個で鍵が漏れる", "middle", 11.5, ALI, True),
    T(210, 254, "デバッガでも読める", "middle", 10.5, MUT),
    T(210, 272, "メモリダンプでも読める", "middle", 10.5, MUT),
    RECT(404, 48, 372, 236, 10, SSOFT, SIG, 1.5),
    T(590, 72, "良い設計", "middle", 12.5, SIG, True),
    BOX(428, 88, 130, 44, "OTP", "鍵（読出禁止）", SIG, PAN, INK, 6, 1.3, 11, 9),
    ARR(558, 110, 596, 110, SIG, 1.6), T(577, 100, "専用配線", "middle", 9, SIG),
    BOX(598, 88, 150, 44, "暗号エンジン", None, SIG, PAN, INK, 6, 1.3, 11, 9),
    BOX(468, 162, 240, 44, "CPU", "「スロット 2 で暗号化して」と依頼するだけ", LIN, PAN, INK, 6, 1.3, 11, 9),
    ARR(670, 162, 670, 134, MUT, 1.6),
    T(590, 232, "平文の鍵が CPU バスに一度も出ない", "middle", 11.5, SIG, True),
    T(590, 254, "CPU が乗っ取られても、鍵は「使える」が", "middle", 10.5, MUT),
    T(590, 272, "「読めない」——これが不可視化", "middle", 10.5, MUT),
], "鍵を CPU に見せない。この一点だけで、ソフトウェア脆弱性による鍵漏洩をほぼ封じられる")

F["s06_puf"] = SVG(800, 432, [
    T(400, 26, "PUF — チップの個体差そのものを鍵にする", "middle", 12.5, INK, True),
    flowdown(400, 48, [
        ("電源投入", "SRAM の初期値を読む → 0101 1100 1011 …（このチップ固有のパターン）"),
        ("誤り訂正", "ヘルパーデータ（公開してよい）で数 % のビット反転を訂正する", SIG, SSOFT),
        ("鍵導出", "安定したビット列を KDF に通して鍵を得る", SIG, SSOFT),
        ("使い終わったら SRAM をクリアする", None, ALI, ASOFT),
    ], 480, 52, 26)[0],
    RECT(60, 352, 680, 40, 8, SCR, LIN, 1.3),
    T(400, 376, "電源を切ると鍵はどこにも存在しない。分解しても「読み出す場所」がない",
      "middle", 11, SIG, True),
    T(72, 132, "温度・電圧・経年で", "middle", 10, FNT),
    T(72, 148, "数 % 反転する", "middle", 10, FNT),
    ARR(124, 140, 154, 140, FNT, 1.3),
], "PUF は「鍵を保存しない」方式。ただしヘルパーデータの管理と、起動のたびに数 ms かかる点は設計に効く")

F["s06_wrap"] = SVG(800, 330, [
    T(400, 26, "鍵ラッピング — 鍵を平文のまま置かない", "middle", 12.5, INK, True),
    BOX(250, 50, 300, 56, "HUK", "OTP か PUF に 1 個だけ。CPU から読めない", ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    ARR(400, 106, 400, 136, MUT, 1.6),
    T(414, 128, "各種の鍵を HUK で暗号化（ラップ）する", "start", 10.5, SIG),
    BOX(230, 138, 340, 52, "Wrapped Key（ラップ済み鍵）",
        "普通のフラッシュに置いてよい", SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(400, 190, 400, 220, MUT, 1.6),
    T(414, 212, "使うときは暗号エンジンに渡す", "start", 10.5, SIG),
    BOX(210, 222, 380, 52, "暗号エンジンが内部でアンラップして、そのまま使う",
        None, SIG, PAN, INK, 8, 1.5, 11.5),
    RECT(60, 288, 680, 34, 8, SCR, LIN, 1.3),
    T(400, 310, "平文の鍵は一度も CPU バスに出ない。フラッシュを吸い出されても復号できない",
      "middle", 11, MUT, True),
], "鍵の本数が増えても、守るべきものは HUK 1 本に集約できる。これが階層設計の実利")

F["s06_otfd"] = SVG(820, 250, [
    T(410, 26, "オンザフライ復号 — 外部フラッシュを暗号のまま置く", "middle", 12.5, INK, True),
    BOX(30, 74, 180, 60, "外部フラッシュ", "中身は暗号文", LIN, PAN),
    ARR(210, 104, 260, 104, ALI, 1.8), T(235, 92, "SPI バス", "middle", 10, ALI, True),
    T(235, 146, "ここをプローブしても", "middle", 9.5, FNT),
    T(235, 162, "ランダムに見える", "middle", 9.5, FNT),
    BOX(262, 74, 200, 60, "オンザフライ復号", "AES-CTR / PRINCE", SIG, SSOFT),
    ARR(462, 104, 512, 104, SIG, 1.8),
    BOX(514, 74, 180, 60, "CPU", "平文が届く", LIN, PAN),
    BOX(276, 168, 172, 44, "鍵：OTP / PUF", "CPU からは読めない", ALI, ASOFT, INK, 6, 1.3, 11, 9),
    ARR(362, 168, 362, 138, MUT, 1.6),
    RECT(710, 74, 90, 60, 8, SCR, LIN, 1.3),
    T(755, 100, "XIP で", "middle", 10.5, MUT),
    T(755, 118, "そのまま実行", "middle", 10.5, MUT),
    ARR(694, 104, 708, 104, MUT, 1.4),
], "フラッシュを外して読まれても中身が分からない。ただし「暗号化」であって「認証」ではない点に注意する")

F["s06_storage"] = SVG(840, 300, [
    T(420, 26, "鍵をどこに置くか", "middle", 12.5, INK, True),
] + sum([[
    RECT(30, 52 + i * 46, 780, 40, 8, ASOFT if bad else SCR, ALI if bad else LIN, 1.3),
    T(120, 76 + i * 46, n, "middle", 11.5, INK, True),
    T(215, 76 + i * 46, a, "start", 10.5, MUT),
    T(790, 76 + i * 46, v, "end", 11, ALI if bad else SIG, True),
] for i, (n, a, v, bad) in enumerate([
    ("フラッシュに平文", "ソースに直書き、または NVM に平文で保存", "論外", True),
    ("OTP / eFuse", "焼き切り。読出保護をかければ CPU からも読めない", "◯ 基本", False),
    ("PUF", "保存しない。起動のたびに再構成する", "◎ 強い", False),
    ("鍵ラッピング", "HUK で暗号化してフラッシュに置く", "◎ 実用的", False),
    ("セキュアエレメント", "別チップに隔離。耐タンパ設計（22 章）", "◎ 最強", False),
])], [])
  + [T(420, 288, "「どこに置くか」より「CPU から読めるか」で評価する。読めた時点で対策の意味が薄れる",
       "middle", 11, MUT, True)],
    "保管場所そのものより、可視性が本質。読めない形にできているかを基準に選ぶ")

# ===================== 07. 分離 =====================

F["s07_iso"] = SVG(840, 330, [
    T(420, 26, "分離があるかないかで、脆弱性の影響範囲が変わる", "middle", 12.5, INK, True),
    T(200, 58, "分離がない場合", "middle", 12, ALI, True),
    RECT(30, 70, 340, 76, 10, ASOFT, ALI, 1.6),
] + [T(60 + i * 62, 114, s, "middle", 10.5, INK) for i, s in
     enumerate(["TCP/IP", "BLE", "アプリ", "暗号", "鍵"])] + [
    T(200, 168, "TCP/IP の脆弱性", "middle", 10.5, MUT),
    ARR(200, 176, 200, 196, ALI, 1.6),
    T(200, 212, "任意コード実行", "middle", 10.5, MUT),
    ARR(200, 220, 200, 240, ALI, 1.6),
    T(200, 258, "鍵を読める", "middle", 12, ALI, True),
    W(420, 50, 420, 300, c=LIN, lw=1, dash="5 5"),
    T(630, 58, "分離がある場合", "middle", 12, SIG, True),
    RECT(456, 70, 200, 76, 10, ASOFT, ALI, 1.5),
    T(556, 90, "Non-secure（広い）", "middle", 10.5, ALI, True),
] + [T(490 + i * 66, 122, s, "middle", 10, INK) for i, s in enumerate(["TCP/IP", "BLE", "アプリ"])] + [
    barrier(676, 66, 150, None, ALI),
    RECT(696, 70, 130, 76, 10, SSOFT, SIG, 1.5),
    T(761, 90, "Secure（狭い）", "middle", 10.5, SIG, True),
] + [T(722 + i * 40, 122, s, "middle", 10, INK) for i, s in enumerate(["暗号", "鍵", "RoT"])] + [
    T(676, 166, "ハードウェアで隔離", "middle", 10, ALI, True),
    T(630, 196, "TCP/IP の脆弱性 → 任意コード実行", "middle", 10.5, MUT),
    ARR(630, 204, 630, 224, SIG, 1.6),
    T(630, 242, "Secure 側には触れない", "middle", 12, SIG, True),
    T(630, 264, "鍵は「使える」が「読めない」", "middle", 11, SIG, True),
    T(420, 316, "分離は脆弱性を無くさない。影響範囲を閉じ込めるための仕組みである", "middle", 11, MUT, True),
], "通信スタックは大きく、脆弱性はいずれ出る。前提を「出る」に置いて、被害を閉じ込める設計にする")

F["s07_sg"] = SVG(820, 350, [
    T(410, 26, "TrustZone-M の呼び出し — SG 命令が唯一の入口", "middle", 12.5, INK, True),
    RECT(24, 50, 250, 240, 10, ASOFT, ALI, 1.5),
    T(149, 72, "Non-secure", "middle", 12, ALI, True),
    BOX(44, 88, 210, 50, "result = secure_sign(...)", "普通の関数呼び出しに見える",
        LIN, PAN, INK, 6, 1.3, 10.5, 9, None, True),
    ARR(149, 138, 149, 168, MUT, 1.6), T(160, 160, "飛び先は NSC", "start", 9.5, FNT),
    RECT(296, 50, 250, 240, 10, SSOFT, SIG, 1.5),
    T(421, 72, "NSC（呼び出し可能）", "middle", 12, SIG, True),
    BOX(316, 88, 210, 74, "SG\nB.W secure_sign_impl", "★ Secure Gateway 命令",
        SIG, PAN, INK, 6, 1.4, 11, 9, None, True),
    ARR(421, 162, 421, 192, MUT, 1.6),
    RECT(568, 50, 228, 240, 10, SSOFT, SIG, 1.5),
    T(682, 72, "Secure", "middle", 12, SIG, True),
    BOX(588, 88, 190, 74, "secure_sign_impl", "鍵を使って署名する", SIG, PAN, INK, 6, 1.4, 11, 9, None, True),
    ARR(682, 162, 682, 192, MUT, 1.6),
    BOX(588, 194, 190, 44, "BXNS lr", "Non-secure へ戻る専用命令", LIN, PAN, INK, 6, 1.3, 10.5, 9, None, True),
    W(588, 216, 546, 216, c=MUT, lw=1.4), ARR(546, 216, 274, 216, MUT, 1.6),
    T(410, 312, "SG 命令のない場所に飛び込むと、その場で Fault になる", "middle", 11, ALI, True),
    T(410, 336, "入口が 1 種類の命令に限定されているので、「途中に飛び込む」攻撃ができない",
      "middle", 11, MUT, True),
], "Secure 側へ入る方法を 1 命令に限定したのが TrustZone-M の要点。任意の番地へは飛び込めない")

F["s07_tfm"] = SVG(800, 340, [
    T(400, 26, "TF-M のサービス構成", "middle", 12.5, INK, True),
    RECT(40, 48, 720, 90, 10, ASOFT, ALI, 1.5),
    T(400, 70, "Non-secure（NSPE）", "middle", 12, ALI, True),
] + [BOX(60 + i * 232, 84, 216, 42, t, None, LIN, PAN, INK, 6, 1.3, 11)
     for i, t in enumerate(["アプリケーション", "RTOS（FreeRTOS / Zephyr）", "TCP/IP・BLE・ミドルウェア"])]
  + [ARR(400, 138, 400, 162, MUT, 1.8),
     T(414, 156, "PSA Functional API（psa_crypto_* など）", "start", 10.5, SIG, True),
     RECT(40, 164, 720, 156, 10, SSOFT, SIG, 1.5),
     T(400, 186, "Secure（SPE）", "middle", 12, SIG, True),
     BOX(60, 200, 680, 36, "TF-M Core（SPM：Secure Partition Manager）", None, SIG, PAN, INK, 6, 1.3, 11.5)]
  + [BOX(60 + (i % 3) * 232, 244 + (i // 3) * 40, 216, 32, t, None, LIN, PAN, INK, 5, 1.2, 10.5)
     for i, t in enumerate(["Crypto Service", "Internal Trusted Storage", "Protected Storage",
                            "Initial Attestation", "Firmware Update", "ベンダ固有パーティション"])],
    "PSA API に対して書いておけば、TrustZone がない MCU でも同じコードが動く。移行を見据えるなら最初からこれで書く")

F["s07_mpu"] = SVG(780, 260, [
    T(390, 26, "TrustZone がない MCU — MPU による特権分離", "middle", 12.5, INK, True),
    RECT(40, 52, 700, 78, 10, SSOFT, SIG, 1.5),
    T(390, 74, "特権モード", "middle", 12, SIG, True),
] + [BOX(70 + i * 222, 88, 206, 32, t, None, SIG, PAN, INK, 5, 1.2, 10.5)
     for i, t in enumerate(["RTOS カーネル", "セキュリティ関連処理", "鍵"])]
  + [ARR(390, 130, 390, 152, MUT, 1.6), T(404, 146, "SVC 呼び出しで依頼する", "start", 10, FNT),
     RECT(40, 154, 700, 68, 10, ASOFT, ALI, 1.5),
     T(390, 176, "非特権モード", "middle", 12, ALI, True)]
  + [BOX(110 + i * 260, 190, 240, 26, t, None, ALI, PAN, INK, 5, 1.2, 10.5)
     for i, t in enumerate(["アプリケーション", "通信スタック"])]
  + [T(390, 246, "非特権コードからは、鍵の領域を MPU でアクセス禁止にしておく", "middle", 11, MUT, True)],
    "TrustZone ほど強くはないが、「通信スタックの脆弱性から鍵を守る」という目的にはかなり効く")

F["s07_ela"] = SVG(820, 300, [
    T(410, 26, "TrustZone-A（Cortex-A）の例外レベル", "middle", 12.5, INK, True),
    RECT(30, 50, 440, 158, 10, ASOFT, ALI, 1.5),
    T(250, 72, "Normal World", "middle", 12, ALI, True),
] + [BOX(50 + 0, 86 + i * 40, 400, 32, t, None, LIN, PAN, INK, 5, 1.2, 11)
     for i, t in enumerate(["EL2：ハイパーバイザ", "EL1：Linux カーネル", "EL0：Linux アプリ"])]
  + [RECT(500, 50, 290, 158, 10, SSOFT, SIG, 1.5),
     T(645, 72, "Secure World", "middle", 12, SIG, True)]
  + [BOX(520, 106 + i * 40, 250, 32, t, None, SIG, PAN, INK, 5, 1.2, 11)
     for i, t in enumerate(["S-EL1：OP-TEE OS", "S-EL0：Trusted App"])]
  + [BOX(160, 222, 500, 40, "EL3：Secure Monitor", "SMC 命令で切り替える", INK, SCR, INK, 8, 1.6, 12, 9.5),
     W(250, 208, 250, 222, c=MUT, lw=1.4), W(645, 208, 645, 222, c=MUT, lw=1.4),
     T(410, 286, "MCU の TrustZone-M とは別物。名前は同じでも、切り替えの仕組みも粒度も違う",
       "middle", 11, ALI, True)],
    "Cortex-A では EL3 のモニタが両世界を切り替える。Cortex-M の TrustZone-M とは実装がまったく異なる")
# ===================== 08. 暗号エンジンと乱数 =====================

F["s08_trng"] = SVG(760, 526, [
    T(380, 26, "乱数生成の全体像", "middle", 12.5, INK, True),
    flowdown(380, 48, [
        ("物理現象", "熱雑音・ジッタ・準安定状態", LIN, SCR),
        ("エントロピー源", "ノイズを電気信号として取り出す。生の出力は偏っている"),
        ("健全性テスト", "オンライン試験。故障を検出する", ALI, ASOFT),
        ("調整（Conditioning）", "偏りを取り除く。フォンノイマン補正・SHA-256・CBC-MAC"),
        ("TRNG 出力", "高品質だが遅い（数十 kbps〜数 Mbps）", SIG, SSOFT),
        ("DRBG（疑似乱数生成器）", "NIST SP 800-90A。決定的アルゴリズムで高速に大量生成", SIG, SSOFT),
        ("アプリケーションへ", None, LIN, PAN),
    ], 420, 44, 22, [None, None, None, None, "これをシードにする", None])[0],
    T(380, 512, "TRNG が壊れても出力は「それらしく」見える。だから健全性テストが必須になる",
      "middle", 11, ALI, True),
], "乱数はすべての土台。ここが弱いと、その上の暗号アルゴリズムがどれだけ強くても意味がない")

F["s08_engine"] = SVG(800, 270, [
    T(400, 26, "暗号エンジンは「速いから」ではなく「鍵を隠せるから」使う", "middle", 12.5, INK, True),
    RECT(30, 52, 740, 150, 10, "none", INK, 1.6, "8 5"),
    T(400, 72, "SoC の内部", "middle", 10.5, FNT),
    BOX(60, 92, 180, 60, "CPU", "ソフトウェアが動く", LIN, PAN),
    ARR(240, 122, 296, 122, MUT, 1.6), T(268, 110, "依頼", "middle", 9.5, FNT),
    BOX(298, 92, 200, 60, "暗号エンジン", "AES / SHA / PKA", SIG, SSOFT),
    ARR(498, 122, 554, 122, MUT, 1.6), T(526, 110, "結果", "middle", 9.5, FNT),
    BOX(556, 92, 180, 60, "データ", None, LIN, PAN),
    BOX(298, 162, 200, 32, "鍵スロット（OTP / KMU）", None, ALI, ASOFT, INK, 5, 1.3, 10.5),
    W(398, 162, 398, 152, c=ALI, lw=1.8),
    W(240, 178, 296, 178, c=ALI, lw=1.6, dash="4 3"),
    T(150, 182, "CPU からは読めない", "middle", 10.5, ALI, True),
    RECT(30, 216, 740, 40, 8, SCR, LIN, 1.3),
    T(400, 240, "CPU が渡すのは「スロット番号」だけ。鍵の値は一度も CPU バスに現れない",
      "middle", 11, MUT, True),
], "速度目的なら妥協できるが、鍵の不可視化は妥協できない。エンジンを選ぶときはこの観点で見る")

F["s08_entropy"] = SVG(800, 250, [
    T(400, 26, "エントロピーが足りなくなる典型的な場面", "middle", 12.5, INK, True),
] + sum([[
    BOX(30 + i * 258, 52, 240, 120, t, s, ALI, ASOFT, INK, 8, 1.4, 12, 10)
] for i, (t, s) in enumerate([
    ("起動直後", "TRNG が十分なエントロピーを溜める前に鍵を生成してしまう。全機器で同じ鍵になることがある"),
    ("低温・低電圧", "ノイズ源の振幅が落ちる。仕様の温度範囲の端で品質が落ちていないか"),
    ("実装の取り違え", "rand() や時刻をシードに使う。「乱数に見えるもの」は乱数ではない")])], [])
  + [RECT(30, 186, 740, 52, 8, SSOFT, SIG, 1.4),
     T(400, 208, "対策：健全性テストの結果を必ず確認してから鍵を生成する。", "middle", 11, SIG, True),
     T(400, 228, "起動時に足りなければ、溜まるまで待つ（待てる設計にしておく）", "middle", 11, INK)],
    "「全機器の鍵が同じだった」という事故は、ほぼすべて起動直後のエントロピー不足が原因")

# ===================== 09. サイドチャネル =====================

F["s09_channels"] = SVG(800, 300, [
    T(400, 26, "設計者が見ている経路と、実際に存在する経路", "middle", 12.5, INK, True),
    BOX(60, 60, 140, 48, "平文", None, LIN, PAN),
    ARR(200, 84, 250, 84, MUT, 1.8),
    BOX(252, 52, 200, 64, "暗号処理", "ここだけを守っている", SIG, SSOFT),
    ARR(452, 84, 502, 84, MUT, 1.8),
    BOX(504, 60, 140, 48, "暗号文", None, LIN, PAN),
] + sum([[ARR(352, 116, 150 + i * 100, 176, ALI, 1.4),
          T(150 + i * 100, 196, s, "middle", 10.5, ALI, True)]
         for i, s in enumerate(["消費電力", "処理時間", "電磁放射", "音", "温度", "キャッシュ"])], [])
  + [RECT(60, 216, 680, 66, 8, ASOFT, ALI, 1.4),
     T(400, 240, "攻撃者はこれらを観測できる", "middle", 12, ALI, True),
     T(400, 264, "アルゴリズムが数学的に安全でも、実装が漏らす情報から鍵が求まる", "middle", 11, INK)],
    "暗号の強度は数学だけでは決まらない。実装が外に出してしまう副次的な情報が攻撃面になる")

F["s09_timing"] = SVG(820, 300, [
    T(410, 26, "タイミング攻撃 — 1 バイトずつ独立に破れてしまう", "middle", 12.5, INK, True),
    steps(60, 66, [
        "1 バイト目を 0x00〜0xFF まで試す",
        "正しい値のときだけ 2 バイト目の比較まで進む → その分だけ処理時間が長い（数十 ns）",
        "何千回も測って平均を取ると、その差が見える → 1 バイト目が確定",
        "2 バイト目へ。以下同様",
    ], 30, ALI)[0],
    RECT(60, 190, 340, 92, 8, ASOFT, ALI, 1.4),
    T(230, 214, "1 バイトずつ独立に決められる", "middle", 12, ALI, True),
    T(230, 240, "256 × 16 = 4096 回", "middle", 14, ALI, True),
    T(230, 266, "16 バイトの MAC を破るのに必要な試行", "middle", 10, MUT),
    RECT(420, 190, 340, 92, 8, SSOFT, SIG, 1.4),
    T(590, 214, "総当たりなら", "middle", 12, SIG, True),
    T(590, 240, "2¹²⁸ 回", "middle", 14, SIG, True),
    T(590, 266, "現実的に不可能な回数", "middle", 10, MUT),
    T(410, 176, "この差が「早期リターンする比較」を使ってはいけない理由", "middle", 11, MUT, True),
], "memcmp で MAC を比較してはいけない。定数時間比較（全バイトを必ず見る）を使う")

F["s09_trace"] = SVG(800, 280, [
    T(400, 26, "SPA — 波形を 1 本見るだけで秘密指数が読める", "middle", 12.5, INK, True),
    T(60, 110, "消費電流", "end", 11, MUT, True),
    W(70, 150, 760, 150, c=LIN, lw=1.2),
] + sum([[
    RECT(x, 74, w, 62, 4, SSOFT if k == "S" else ASOFT, SIG if k == "S" else ALI, 1.4),
    T(x + w / 2, 110, k, "middle", 13, SIG if k == "S" else ALI, True),
] for x, w, k in [(80, 60, "S"), (160, 60, "S"), (228, 110, "M"),
                  (360, 60, "S"), (440, 60, "S"), (508, 110, "M"),
                  (640, 60, "S")]], [])
  + [T(120, 172, "0", "middle", 13, INK, True),
     T(275, 172, "1", "middle", 13, INK, True),
     T(400, 172, "0", "middle", 13, INK, True),
     T(555, 172, "1", "middle", 13, INK, True),
     T(670, 172, "0", "middle", 13, INK, True),
     T(400, 206, "S = 二乗のみ → 指数のビットは 0", "middle", 11, SIG, True),
     T(400, 226, "S + M = 二乗して乗算 → 指数のビットは 1", "middle", 11, ALI, True),
     T(400, 256, "「ビットが 1 のときだけ乗算する」実装は、波形の形がそのまま鍵になる",
       "middle", 11, MUT, True)],
    "対策は「常に同じ処理をする」こと。モンゴメリラダーのように、ビットの値によらず同じ命令列を実行する")

F["s09_mask"] = SVG(820, 280, [
    T(410, 26, "マスキング — 処理する値そのものをランダム化する", "middle", 12.5, INK, True),
    RECT(24, 52, 372, 200, 10, ASOFT, ALI, 1.5),
    T(210, 76, "対策なし", "middle", 12.5, ALI, True),
    BOX(50, 92, 320, 46, "v = SBox(p ⊕ k)", None, ALI, PAN, INK, 6, 1.4, 13, 10, None, True),
    ARR(210, 138, 210, 162, ALI, 1.6),
    T(210, 182, "v のハミング重みが消費電力に出る", "middle", 10.5, INK),
    T(210, 206, "→ p は既知、v が分かる", "middle", 10.5, INK),
    T(210, 232, "→ k が求まる", "middle", 12, ALI, True),
    RECT(424, 52, 372, 200, 10, SSOFT, SIG, 1.5),
    T(610, 76, "1 次マスキング", "middle", 12.5, SIG, True),
    BOX(450, 92, 320, 46, "v' = SBox(p ⊕ k ⊕ m) ⊕ m'", "m は毎回ランダムに生成する",
        SIG, PAN, INK, 6, 1.4, 12, 9, None, True),
    ARR(610, 138, 610, 162, SIG, 1.6),
    T(610, 182, "消費電力は v' に比例するが", "middle", 10.5, INK),
    T(610, 206, "m がランダムなので、攻撃者が", "middle", 10.5, INK),
    T(610, 230, "予測する v と相関しない", "middle", 11.5, SIG, True),
], "マスキングは有効だが、実装は難しく性能も落ちる。自前でやらず、対策済みのハードウェアエンジンを使うのが現実的")

F["s09_dpa"] = SVG(820, 320, [
    T(410, 26, "DPA — 「1 バイトずつ」試せることが本質的な弱さ", "middle", 12.5, INK, True),
    flowright(30, 100, [("波形を大量に収集", "数千〜数万本"),
                        ("鍵 1 バイトを仮定", "256 通り"),
                        ("中間値を予測", "鍵候補ごとに計算"),
                        ("波形との相関を取る", "正解だけ相関が出る")], 178, 62, 20)[0],
    ARR(410, 142, 410, 170, MUT, 1.6),
    RECT(150, 172, 520, 60, 8, ASOFT, ALI, 1.5),
    T(410, 196, "256 通り × 16 バイト = 4096 回の計算で 128 bit 鍵が求まる", "middle", 12, ALI, True),
    T(410, 218, "総当たり 2¹²⁸ とは比較にならない", "middle", 10.5, MUT),
    RECT(150, 248, 520, 60, 8, SSOFT, SIG, 1.4),
    T(410, 272, "対策：マスキング・シャッフリング・ダミー演算・電源フィルタ", "middle", 11.5, SIG, True),
    T(410, 294, "そして「DPA 対策済み」と明記されたエンジンを選ぶこと", "middle", 11, INK),
], "鍵全体を一度に当てる必要がないのが DPA の怖さ。バイトごとに独立して検証できてしまう")

# ===================== 11. ファームウェア抽出 =====================

F["s11_paths"] = SVG(840, 392, [
    T(420, 26, "ファームウェアを手に入れる経路 — 安い順に塞ぐ", "middle", 12.5, INK, True),
] + sum([[
    RECT(30, 52 + i * 48, 780, 42, 8, ASOFT if i < 3 else SCR, ALI if i < 3 else LIN, 1.3),
    T(150, 78 + i * 48, n, "middle", 11.5, INK, True),
    T(250, 78 + i * 48, d, "start", 10.5, MUT),
    T(792, 78 + i * 48, cost, "end", 11, ALI if i < 3 else MUT, True),
] for i, (n, d, cost) in enumerate([
    ("公開ファイル", "メーカーのサポートサイトから更新ファイルを落とす", "0 円"),
    ("UART コンソール", "テストパッドに USB シリアルを繋いで起動ログとシェルを取る", "数百円"),
    ("SPI フラッシュ", "クリップを挟んで基板上から読む、または外して読む", "数千円"),
    ("JTAG / SWD", "デバッグポートからメモリを読む", "数千円"),
    ("グリッチ", "保護ビットの読み出しを飛ばす（10 章）", "数万円"),
    ("チップ解析", "開封して FIB・レーザー・プロービング", "数百万円〜"),
])], [])
  + [T(420, 374, "上の 3 つは道具代がほぼゼロ。ここを塞がずに高度な対策をしても意味がない",
       "middle", 11, ALI, True)],
    "攻撃者は必ず一番安い経路から来る。費用対効果の高い対策は、実はいちばん地味なところにある")

F["s11_debugauth"] = SVG(880, 406, [
    T(440, 26, "デバッグ認証 — 「閉じる」ではなく「鍵を持つ人だけ開ける」", "middle", 12.5, INK, True),
    seq(210, 50, ["デバッガ", "デバイス"], [
        (0, 1, "チャレンジ要求"),
        (1, 0, "乱数チャレンジ", "毎回変える（リプレイ防止）"),
        (0, 0, "秘密鍵で署名する", None, SIG),
        (0, 1, "署名 + 証明書"),
        (1, 1, "OTP の公開鍵で検証", None, BLU),
        (1, 1, "OK → デバッグポートを開く（権限も証明書で指定）", None, SIG),
    ], 180, 40, 36, 380)[0],
    T(440, 386, "完全に閉じてしまうと自社も解析できない。認証つきで開けられるようにしておく",
      "middle", 11, MUT, True),
], "ライフサイクル状態で完全に閉じるか、認証つきで開けるか。故障解析の体制と併せて決める")

# ===================== 12. プロビジョニング =====================

F["s12_inject"] = SVG(760, 372, [
    T(380, 26, "方式 A：外で鍵を作って注入する", "middle", 12.5, INK, True),
    flowdown(380, 52, [
        ("HSM / 鍵生成サーバ", "秘密鍵と証明書を生成する", SIG, SSOFT),
        ("工場の書き込み装置", "機器に書き込む", ALI, ASOFT),
        ("機器", None, LIN, PAN),
    ], 380, 52, 44, ["何らかの経路で工場へ", None])[0],
    RECT(60, 312, 640, 46, 8, ASOFT, ALI, 1.4),
    T(380, 334, "★ 秘密鍵が「機器の外」に一度存在する", "middle", 12, ALI, True),
    T(380, 352, "経路・工場・装置のすべてが保護対象になる", "middle", 10.5, INK),
], "最も素直だが、鍵が外を通る。工場を信頼できるか、経路を保護できるかがそのまま安全性になる")

F["s12_csr"] = SVG(760, 388, [
    T(380, 26, "方式 B：機器の中で鍵を作る（推奨）", "middle", 12.5, INK, True),
    flowdown(380, 52, [
        ("機器", "起動時／初回に、内部の TRNG で鍵ペアを生成する", SIG, SSOFT),
        ("CA", "CSR を検証して証明書を発行する", LIN, PAN),
        ("機器", "証明書を保存して完成", SIG, SSOFT),
    ], 400, 54, 46, ["公開鍵を含む CSR を出力", "証明書を書き戻す（公開情報なので保護不要）"])[0],
    RECT(60, 326, 640, 46, 8, SSOFT, SIG, 1.4),
    T(380, 348, "★ 秘密鍵は一度も機器の外に出ない", "middle", 12, SIG, True),
    T(380, 366, "工場が漏らすものが存在しない", "middle", 10.5, INK),
], "「外に出ない鍵は漏れない」。TRNG の品質と、CSR を偽装されない仕組みが条件になる")

F["s12_preprov"] = SVG(780, 374, [
    T(390, 26, "方式 C：プロビジョニング済みチップを買う", "middle", 12.5, INK, True),
    flowdown(390, 52, [
        ("シリコンベンダの工場", "チップ製造時に、耐タンパ環境で鍵と証明書を注入する", SIG, SSOFT),
        ("チップを購入して基板に載せる", None, LIN, PAN),
        ("自社の CA", "ベンダの証明書を検証して、自社の証明書を発行（チェーンする）", LIN, PAN),
    ], 460, 54, 40)[0],
    RECT(60, 312, 660, 46, 8, SSOFT, SIG, 1.4),
    T(390, 334, "★ 自社に HSM も CA も工場の保護もなくても、機器固有鍵が手に入る", "middle", 11.5, SIG, True),
    T(390, 352, "小〜中規模の製品では、これが最も現実的な選択になることが多い", "middle", 10.5, INK),
], "自社でプロビジョニング体制を作るのは高い。ベンダの「出生証明書」に相乗りできるなら、その方が安全で安い")

F["s12_sfi"] = SVG(800, 340, [
    T(400, 26, "SFI — 工場に平文を渡さずに書き込ませる", "middle", 12.5, INK, True),
    RECT(24, 50, 372, 130, 10, SSOFT, SIG, 1.5),
    T(210, 74, "開発元（自社）", "middle", 12.5, SIG, True),
    T(210, 100, "ファームウェアを暗号化 → 暗号化イメージ（.sfi）", "middle", 10.5, INK),
    T(210, 122, "鍵を HSM カードに入れる", "middle", 10.5, INK),
    T(210, 148, "★ HSM は「書き込める台数」を持つ", "middle", 10.5, SIG, True),
    ARR(396, 116, 428, 116, MUT, 1.8),
    T(413, 44, ".sfi と HSM カードを送る", "middle", 9.5, FNT),
    RECT(430, 50, 346, 130, 10, ASOFT, ALI, 1.5),
    T(603, 74, "製造委託先（工場）", "middle", 12.5, ALI, True),
    T(603, 100, "書き込み装置に HSM カードを挿す", "middle", 10.5, INK),
    T(603, 122, "装置 ⇄ MCU の ROM が HSM 経由で鍵を渡す", "middle", 10.5, INK),
    T(603, 148, "MCU が自分で復号して書き込む", "middle", 10.5, INK),
    RECT(60, 200, 680, 46, 8, SSOFT, SIG, 1.4),
    T(400, 222, "★ 工場は平文のファームウェアも鍵も見られない", "middle", 12, SIG, True),
    T(400, 240, "書き込み装置のログにも平文は残らない", "middle", 10, MUT),
    RECT(60, 258, 680, 46, 8, SSOFT, SIG, 1.4),
    T(400, 280, "★ HSM のカウンタが減る → 契約台数を超えて作れない", "middle", 12, SIG, True),
    T(400, 298, "「夜間に余分に作って横流し」を仕組みで防ぐ", "middle", 10, MUT),
    T(400, 328, "ST の SFI、NXP の SB2/SB3、Espressif の Flash Encryption など各社が同種の仕組みを持つ",
      "middle", 10.5, FNT),
], "委託先を「信頼する」のではなく「信頼しなくてよい形にする」。過剰生産の防止も同じ仕組みで実現できる")

F["s12_pki"] = SVG(760, 300, [
    T(380, 26, "PKI の階層 — どこをオフラインに置くか", "middle", 12.5, INK, True),
    BOX(230, 50, 300, 56, "Root CA", "自社の最上位 CA。オフラインの HSM に保管する",
        ALI, ASOFT, INK, 8, 1.5, 12.5, 9.5),
    ARR(380, 106, 380, 132, MUT, 1.6),
    BOX(230, 134, 300, 56, "Intermediate CA", "製品ライン別／年度別に分ける",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 9.5),
    ARR(380, 190, 380, 216, MUT, 1.6),
    BOX(200, 218, 360, 56, "Device Certificate", "機器ごと。有効期間は機器寿命に合わせて長めにする",
        LIN, PAN, INK, 8, 1.4, 12.5, 9.5),
    T(60, 84, "ネットワークから", "middle", 10, FNT), T(60, 100, "切り離す", "middle", 10, ALI, True),
    T(700, 162, "漏れても、その", "middle", 10, FNT), T(700, 178, "ラインだけ失効", "middle", 10, SIG, True),
    T(380, 292, "中間 CA を分けておくと、事故のときに影響範囲を製品ライン単位に閉じ込められる",
      "middle", 11, MUT, True),
], "Root を守るために中間 CA を挟む。分け方は「事故が起きたとき、どの単位で失効させたいか」で決める")

F["s12_certs"] = SVG(780, 250, [
    T(390, 26, "2 種類の証明書を使い分ける", "middle", 12.5, INK, True),
    BOX(80, 60, 280, 70, "製造証明書（20 年）", "工場で入れる。「この機器は正規品である」ことだけを示す",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(360, 95, 420, 95, MUT, 1.8),
    T(391, 50, "これで認証して", "middle", 9.5, FNT),
    BOX(422, 60, 280, 70, "運用証明書（1 年）", "クラウドが発行する。日常の通信に使う",
        BLU, PAN, INK, 8, 1.5, 12, 9.5),
    RECT(80, 156, 622, 78, 8, SCR, LIN, 1.3),
    T(390, 180, "製造証明書を長くするのは、機器の寿命（10〜20 年）に合わせる必要があるから。", "middle", 11, MUT),
    T(390, 202, "一方で、日常的に使う証明書が 20 年有効だと、漏れたときに止められない。", "middle", 11, MUT),
    T(390, 224, "だから「長期の身分証」と「短期の入館証」に分ける", "middle", 11.5, INK, True),
], "有効期間の要求が正反対なので、1 枚では両立しない。役割を分けるのが定石")

F["s12_dps"] = SVG(800, 428, [
    T(400, 26, "デバイスプロビジョニングサービス（DPS）の流れ", "middle", 12.5, INK, True),
    seq(200, 50, ["機器", "DPS"], [
        (0, 0, "出荷時：製造証明書だけを持っている", None, MUT),
        (0, 1, "① 電源投入 → 接続。製造証明書で TLS クライアント認証"),
        (1, 1, "② 証明書チェーンを検証する", None, BLU),
        (1, 1, "③ 正規品と確認 → テナント／Hub を決定", None, BLU),
        (1, 0, "④ 運用証明書または接続情報を発行"),
        (0, 0, "⑤ 運用証明書で本番サービスに接続する", None, SIG),
    ], 190, 40, 38, 340)[0],
    RECT(60, 368, 680, 44, 8, SCR, LIN, 1.3),
    T(400, 394, "工場では「どの顧客のどのテナントに繋ぐか」を知らなくてよい。出荷後に決まる",
      "middle", 11, MUT, True),
], "在庫を顧客ごとに作り分けなくて済むのが大きい。製造は 1 種類、割り当ては出荷後に行う")

F["s12_shared"] = SVG(820, 320, [
    T(410, 26, "全台共通鍵と機器固有鍵 — 被害の広がり方が違う", "middle", 12.5, INK, True),
    RECT(24, 52, 380, 244, 10, ASOFT, ALI, 1.5),
    T(214, 76, "全台共通鍵", "middle", 12.5, ALI, True),
    T(214, 102, "1 台を解析して鍵を得る", "middle", 11, INK),
    ARR(214, 110, 214, 132, ALI, 1.6),
] + [T(214, 152 + i * 22, s, "middle", 10.5, INK) for i, s in enumerate([
    "すべての機器になりすませる", "すべての通信を復号できる", "全機器に偽ファームウェアを送れる"])] + [
    RECT(48, 224, 332, 60, 8, PAN, ALI, 1.3),
    T(214, 246, "攻撃者の投資：1 台分の解析コスト", "middle", 10.5, INK),
    T(214, 270, "被害：出荷済み全台", "middle", 12, ALI, True),
    RECT(416, 52, 380, 244, 10, SSOFT, SIG, 1.5),
    T(606, 76, "機器固有鍵", "middle", 12.5, SIG, True),
    T(606, 102, "1 台を解析して鍵を得る", "middle", 11, INK),
    ARR(606, 110, 606, 132, SIG, 1.6),
    T(606, 174, "その 1 台になりすませるだけ", "middle", 11.5, SIG, True),
    RECT(440, 224, 332, 60, 8, PAN, SIG, 1.3),
    T(606, 246, "攻撃者の投資：1 台あたり数万〜数百万円", "middle", 10.5, INK),
    T(606, 270, "被害：1 台", "middle", 12, SIG, True),
], "機器固有鍵は「攻撃を防ぐ」のではなく「攻撃を割に合わなくする」。1 台ずつ壊す必要がある状態を作る")
# ===================== 13. セキュア OTA =====================

F["s13_flow"] = SVG(880, 400, [
    T(440, 26, "OTA の 10 ステップ — 検証は 2 回ある", "middle", 12.5, INK, True),
] + sum([[
    BOX(30 + (i % 5) * 172, 56 + (i // 5) * 130, 156, 74,
        "%d. %s" % (i + 1, t), s, c, fl, INK, 8, 1.4, 11.5, 9.5)
] + ([ARR(186 + (i % 5) * 172, 93 + (i // 5) * 130, 200 + (i % 5) * 172, 93 + (i // 5) * 130, MUT, 1.5)]
     if (i % 5) < 4 else []) for i, (t, s, c, fl) in enumerate([
    ("通知", "サーバが知らせる／機器が定期確認", LIN, PAN),
    ("取得", "TLS でダウンロード", LIN, PAN),
    ("保存", "Secondary Slot へ保存", LIN, PAN),
    ("検証", "★ 署名と SVN を検証", SIG, SSOFT),
    ("適用準備", "次回はこちらを使うフラグ", LIN, PAN),
    ("再起動", None, LIN, PAN),
    ("ブート時検証", "★ 起動時に再検証", SIG, SSOFT),
    ("起動", "新しい版が動く", LIN, PAN),
    ("確認", "自己診断が通れば確定する", ALI, ASOFT),
    ("報告", "サーバに結果を返す", LIN, PAN)])], [])
  + [W(890 - 40, 93, 862, 93, c=MUT, lw=1.5), W(862, 93, 862, 152, c=MUT, lw=1.5),
     W(862, 152, 20, 152, c=MUT, lw=1.5), ARR(20, 152, 20, 210, MUT, 1.5),
     W(20, 210, 30, 210, c=MUT, lw=1.5),
     RECT(30, 322, 820, 66, 8, SCR, LIN, 1.3),
     T(440, 346, "検証が 2 回あるのは、①の保存後に書き換えられる可能性があるから（TOCTOU）",
       "middle", 11, MUT, True),
     T(440, 370, "⑨の「確定」を忘れると、次の再起動で旧版に戻る——これは仕様であってバグではない",
       "middle", 11, ALI, True)],
    "ダウンロードして書けば終わりではない。ブート時の再検証と、起動確認後の確定までが 1 セット")

F["s13_slots"] = SVG(800, 270, [
    T(400, 26, "A/B スロット構成", "middle", 12.5, INK, True),
    BOX(40, 58, 200, 66, "ブートローダ", "不変・署名済", ALI, ASOFT),
    BOX(248, 58, 280, 66, "Slot 0", "現在動作中", SIG, SSOFT),
    BOX(536, 58, 224, 66, "Slot 1", "更新用", BLU, PAN),
    ARR(400, 132, 620, 158, MUT, 1.6),
    T(400, 168, "更新：Slot 1 に書く → 検証 → 次回は Slot 1 から起動", "middle", 11.5, SIG, True),
    T(400, 192, "失敗：Slot 0 に戻す（そのまま残っている）", "middle", 11.5, ALI, True),
    RECT(120, 212, 560, 46, 8, SCR, LIN, 1.3),
    T(400, 236, "フラッシュ容量は「ブートローダ + アプリ × 2 + スクラッチ + データ」が要る", "middle", 11, MUT, True),
    T(400, 254, "＝ 容量見積もりの段階で OTA 方式を決めておく必要がある", "middle", 10, FNT),
], "A/B は容量を食うが、失敗しても確実に戻れる。容量が足りないなら、設計の初期に気づかないと詰む")

F["s13_rollback"] = SVG(820, 300, [
    T(410, 26, "ロールバック攻撃 — 署名が正しくても危ない", "middle", 12.5, INK, True),
    steps(60, 62, [
        "メーカーが v1.0 をリリースする",
        "v1.0 に深刻な脆弱性が見つかる",
        "メーカーが v1.1 で修正してリリースする",
    ], 30, SIG)[0],
    steps(60, 158, [
        "★ 攻撃者が、正規に署名された v1.0 を機器に送り込む",
        "署名は正しいので、機器は喜んで受け入れる",
        "機器が脆弱な v1.0 に戻る → 攻撃者が脆弱性を突く",
    ], 30, ALI)[0],
    RECT(60, 250, 700, 40, 8, ASOFT, ALI, 1.4),
    T(410, 274, "署名検証は「誰が作ったか」しか確かめない。「新しいか」は別の仕組みが要る",
      "middle", 11.5, ALI, True),
], "旧版の署名は永久に有効である。だから署名検証だけでは、古い脆弱な版に戻す攻撃を止められない")

F["s13_svn"] = SVG(800, 300, [
    T(400, 26, "ロールバック防止 — SVN と単調カウンタ", "middle", 12.5, INK, True),
    BOX(40, 60, 340, 78, "イメージのヘッダ", "Security Version Number（SVN）= 3\n脆弱性を直したときだけ増やす",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(420, 60, 340, 78, "機器側", "不揮発の単調カウンタ = 3\n一度増やしたら減らせない",
        ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    ARR(400, 138, 400, 166, MUT, 1.6),
    BOX(200, 168, 400, 40, "検証", None, LIN, SCR, INK, 8, 1.4, 12),
    T(400, 236, "image.svn < device.counter  →  拒否する", "middle", 12, ALI, True, True),
    T(400, 264, "image.svn > device.counter  →  受け入れ、起動確定後にカウンタを更新する",
      "middle", 12, SIG, True, True),
    T(400, 290, "カウンタを更新するタイミングが要（次の図）", "middle", 10.5, FNT),
], "SVN は「表示用のバージョン」とは別物。脆弱性を直したときだけ上げる")

F["s13_svnpolicy"] = SVG(760, 250, [
    T(380, 26, "SVN を上げるタイミング", "middle", 12.5, INK, True),
] + sum([[
    RECT(80, 52 + i * 40, 600, 34, 6, SSOFT if up else SCR, SIG if up else LIN, 1.3),
    T(240, 74 + i * 40, v, "end", 11.5, INK, True, True),
    T(266, 74 + i * 40, d, "start", 10.5, MUT),
    T(660, 74 + i * 40, s, "end", 11.5, SIG if up else MUT, True),
] for i, (v, d, s, up) in enumerate([
    ("v1.0.0", "最初のリリース", "SVN 1", False),
    ("v1.0.1", "機能追加", "SVN 1（変えない）", False),
    ("v1.0.2", "機能追加", "SVN 1（変えない）", False),
    ("v1.1.0", "★ 脆弱性修正", "SVN 2", True),
])], [])
  + [T(380, 232, "毎回上げると、単調カウンタの書き換え回数（有限）をすぐ使い切る", "middle", 11, ALI, True)],
    "SVN は「戻ってはいけない境界」を示すもの。上げすぎるとカウンタの寿命を無駄に消費する")

F["s13_counter"] = SVG(820, 292, [
    T(410, 26, "カウンタを更新する場所を間違えると文鎮化する", "middle", 12.5, INK, True),
    RECT(24, 52, 380, 216, 10, ASOFT, ALI, 1.5),
    T(214, 76, "危険な設計", "middle", 12.5, ALI, True),
    flowdown(214, 92, [("新しいイメージを検証", None, ALI, PAN),
                       ("その場でカウンタを更新", None, ALI, PAN),
                       ("起動", None, ALI, PAN)], 320, 34, 16)[0],
    T(214, 254, "★ 起動に失敗すると旧版に戻れない", "middle", 11, ALI, True),
    RECT(416, 52, 380, 216, 10, SSOFT, SIG, 1.5),
    T(606, 76, "安全な設計", "middle", 12.5, SIG, True),
    flowdown(606, 92, [("新しいイメージを検証", None, SIG, PAN),
                       ("起動 → 自己診断 OK", None, SIG, PAN),
                       ("★ そこでカウンタを更新", None, SIG, PAN)], 320, 34, 16)[0],
    T(606, 254, "起動失敗なら旧版に戻れる。カウンタはまだ古いまま", "middle", 11, SIG, True),
], "順番を 1 つ入れ替えるだけで、回収不能な事故が防げる。この種の設計ミスは実機の失敗試験でしか見つからない")

F["s13_enc"] = SVG(820, 290, [
    T(410, 26, "イメージを暗号化して配る — 鍵の配り方", "middle", 12.5, INK, True),
    BOX(40, 60, 300, 60, "イメージ本体", "共通の一時鍵 K で暗号化する（1 回だけでよい）",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    BOX(440, 60, 340, 60, "各機器へ", "K を、その機器の公開鍵で暗号化して配る（小さなデータ）",
        BLU, PAN, INK, 8, 1.5, 12, 9.5),
    ARR(340, 90, 436, 90, MUT, 1.6),
    ARR(410, 120, 410, 152, MUT, 1.6),
    BOX(230, 154, 360, 56, "機器", "自分の秘密鍵で K を復号 → イメージを復号する",
        LIN, PAN, INK, 8, 1.4, 12, 9.5),
    RECT(80, 226, 660, 50, 8, SSOFT, SIG, 1.4),
    T(410, 250, "★ 1 台の鍵が漏れても、漏れるのはその機器が受け取った K だけ", "middle", 11.5, SIG, True),
    T(410, 270, "全機器に同じ鍵で暗号化して配ると、1 台の解析で全部が読まれる", "middle", 10.5, MUT),
], "配信サイズを抑えつつ、機器ごとに鍵を分ける。ハイブリッド暗号のごく標準的な使い方")

F["s13_uptane"] = SVG(800, 300, [
    T(400, 26, "Uptane — 役割ごとに鍵を分ける", "middle", 12.5, INK, True),
] + sum([[BOX(30 + (i % 2) * 388, 56 + (i // 2) * 74, 372, 62, t, s, c, fl, INK, 8, 1.4, 12, 9.5)]
         for i, (t, s, c, fl) in enumerate([
    ("Root キー", "他の鍵を承認する。オフライン保管。最も重要", ALI, ASOFT),
    ("Targets キー", "どのイメージが正規かを示す", ALI, ASOFT),
    ("Snapshot キー", "メタデータの一貫性を保証する", LIN, PAN),
    ("Timestamp キー", "鮮度を保証する。オンラインで頻繁に使う", BLU, PAN)])], [])
  + [RECT(30, 212, 740, 76, 8, SSOFT, SIG, 1.4),
     T(400, 238, "★ オンラインで使う鍵（Timestamp）が漏れても、イメージの差し替えはできない",
       "middle", 12, SIG, True),
     T(400, 262, "差し替えには Targets キーが必要で、それはオフラインにある", "middle", 11, INK),
     T(400, 280, "「よく使う鍵ほど権限を小さくする」——鍵設計の一般原則", "middle", 10.5, MUT)],
    "車載で使われる仕組みだが、考え方は一般の IoT にも効く。1 本の鍵にすべての権限を持たせない")

# ===================== 14. ライフサイクル =====================

F["s14_lcs"] = SVG(880, 260, [
    T(440, 26, "ライフサイクル状態（LCS）", "middle", 12.5, INK, True),
    flowright(24, 96, [("Chip Manufacturing", None, LIN, SCR), ("Development", None, LIN, PAN),
                       ("Production", None, LIN, PAN), ("Deployed", None, SIG, SSOFT),
                       ("Locked / RMA", None, ALI, ASOFT)], 152, 52, 20)[0],
] + [T(100 + i * 172, 148, s, "middle", 10.5, MUT, True) for i, s in
     enumerate(["ベンダの工場", "開発者の手元", "自社の量産ライン", "市場", "故障解析"])]
  + [T(100 + i * 172, 168, s, "middle", 10, FNT) for i, s in
     enumerate(["全部開いている", "デバッグ可能", "鍵を書き込む", "全部閉じる", "認証つきで開く"])]
  + [RECT(80, 194, 720, 52, 8, ASOFT, ALI, 1.4),
     T(440, 216, "★ 状態は一方向にしか進まない。戻せない", "middle", 12, ALI, True),
     T(440, 236, "だから「量産ビルドで全機能を検証してから」進める", "middle", 10.5, INK)],
    "LCS は焼き切りの状態機械。テストを飛ばして進めてしまうと、直せないまま出荷することになる")

F["s14_dilemma"] = SVG(760, 220, [
    T(380, 26, "RMA のジレンマ", "middle", 12.5, INK, True),
    panel2(760, 212, ("出荷時に完全ロック", SIG,
        ["安全。攻撃者もデバッグできない",
         "★ だが自社も故障解析ができない",
         "「返ってきた不良品の原因が分からない」"]),
      ("出荷時に開けておく", ALI,
        ["解析できる。歩留まり改善が回る",
         "★ だが攻撃者も開けられる",
         "デバッグポートは最も安い攻撃経路（11 章）"]), 46),
], "どちらも成立しない。だから「認証つきで開ける」という第三の道が用意されている")

F["s14_rma"] = SVG(800, 456, [
    T(400, 26, "RMA 遷移 — 消してから開ける", "middle", 12.5, INK, True),
    flowdown(400, 50, [
        ("Deployed", "デバッグ不可、鍵あり", SIG, SSOFT),
        ("RMA_REQ", "機器がチャレンジを出力する", LIN, PAN),
        ("RMA_ACK", "★ 鍵とユーザデータを消去してから、デバッグポートを開く", ALI, ASOFT),
        ("故障解析ができる", "だが機密は既に消えている", LIN, PAN),
    ], 460, 54, 40,
      ["① メーカーが署名付きコマンドを送る／機器が RMA 要求トークンを出す",
       "② メーカーが自社の鍵で署名して応答する", None])[0],
    RECT(70, 400, 660, 40, 8, SCR, LIN, 1.3),
    T(400, 424, "順番が命。「開けてから消す」では、開いた瞬間に読まれる", "middle", 11, ALI, True),
], "消去と開放を不可分な 1 つの遷移にしてあるのがポイント。順番を選べる実装は危ない")

F["s14_build"] = SVG(780, 250, [
    T(390, 26, "量産ビルドで検証する", "middle", 12.5, INK, True),
    RECT(24, 52, 366, 110, 10, ASOFT, ALI, 1.5),
    T(207, 76, "よくある失敗", "middle", 12, ALI, True),
    flowright(44, 122, [("開発ビルドで\nテスト", None, ALI, PAN), ("動く", None, ALI, PAN),
                        ("量産ビルドを\n作って出荷", None, ALI, PAN)], 100, 44, 12)[0],
    T(207, 156, "→ 動かない", "middle", 11, ALI, True),
    RECT(410, 52, 366, 110, 10, SSOFT, SIG, 1.5),
    T(593, 76, "正しい手順", "middle", 12, SIG, True),
    flowright(430, 122, [("量産ビルドで\n全機能を検証", None, SIG, PAN), ("動く", None, SIG, PAN),
                         ("そのまま\n量産する", None, SIG, PAN)], 100, 44, 12)[0],
    RECT(60, 180, 660, 60, 8, SCR, LIN, 1.3),
    T(390, 204, "デバッグ機能を切り、LCS を Production 相当にした状態で検証すること。",
      "middle", 11, MUT),
    T(390, 226, "セキュア機能を有効にすると動かなくなる、は極めてよくある", "middle", 11, ALI, True),
], "「開発では動いた」は保証にならない。有効化した状態で通しの検証をしない限り、出荷後に必ず問題が出る")

F["s14_erase"] = SVG(760, 252, [
    T(380, 26, "暗号消去 — 鍵を消せばデータは消えたのと同じ", "middle", 12.5, INK, True),
    BOX(60, 58, 300, 72, "設計", "ユーザデータは常に機器固有の鍵 K で暗号化する",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(360, 94, 420, 94, MUT, 1.8),
    BOX(422, 58, 280, 72, "消去", "K を消すだけ", ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    RECT(60, 162, 642, 66, 8, SCR, LIN, 1.3),
    T(380, 186, "フラッシュ全体を上書き消去すると時間もかかり、摩耗もする。", "middle", 11, MUT),
    T(380, 210, "鍵 1 個（数十バイト）を消せば、残ったデータは復元不可能になる", "middle", 11.5, INK, True),
], "所有権移転・廃棄・工場出荷リセットのすべてで使える。設計段階から「全部暗号化」にしておくことが条件")

# ===================== 15. ソフトウェア防御 =====================

F["s15_defense"] = SVG(820, 300, [
    T(410, 26, "セキュアブートが守らないもの", "middle", 12.5, INK, True),
    BOX(60, 58, 700, 46, "セキュアブート：正規に署名されたコードだけが動く", None, SIG, SSOFT),
    ARR(410, 104, 410, 130, ALI, 1.8),
    BOX(160, 132, 500, 46, "★ しかし、その正規のコードに脆弱性があれば止められない", None, ALI, ASOFT),
    ARR(410, 178, 410, 204, MUT, 1.6),
] + [BOX(40 + i * 250, 206, 232, 62, t, s, LIN, PAN, INK, 8, 1.4, 11.5, 9.5)
     for i, (t, s) in enumerate([
    ("メモリ安全", "境界チェック、安全な文字列関数、Rust の採用"),
    ("実行時の緩和", "スタック保護、MPU、W^X、ASLR"),
    ("入力の検証", "外から来るものは全部疑う。ファジングで確かめる")])]
  + [T(410, 290, "署名検証はあくまで「誰が作ったか」の保証。中身の品質は別の層で担保する",
       "middle", 11, MUT, True)],
    "セキュアブートを入れると安心してしまいがちだが、守っているのは出所だけ。中身の脆弱性には無力")

F["s15_sbom"] = SVG(800, 250, [
    T(400, 26, "SBOM があるかないかで、事故のときの速度が変わる", "middle", 12.5, INK, True),
    panel2(800, 242, ("SBOM がない", ALI,
        ["「Log4j に重大な脆弱性が見つかった」",
         "↓",
         "「うちの製品に入っているか？」",
         "↓",
         "★ 調べるのに数週間かかる。調べきれない"]),
      ("SBOM がある", SIG,
        ["同じ知らせを受け取る",
         "↓",
         "SBOM を検索する",
         "↓",
         "★ 該当製品が数分で分かり、対応を開始できる"]), 46),
], "SBOM は平時には役に立たない。価値が出るのは事故が起きた日で、そのときに作り始めても間に合わない")

F["s15_loop"] = SVG(760, 412, [
    T(380, 26, "脆弱性管理の運用ループ", "middle", 12.5, INK, True),
    flowdown(380, 50, [
        ("SBOM（部品と版の一覧）", None, SIG, SSOFT),
        ("脆弱性データベース", "NVD・OSV・ベンダのアドバイザリ", LIN, PAN),
        ("影響評価", "本当に自社製品に影響するか", LIN, PAN),
        ("修正版の作成 → テスト → OTA 配信（13 章）", None, SIG, SSOFT),
        ("顧客への通知、当局への報告", "CRA では 24 時間以内の早期警告", ALI, ASOFT),
    ], 420, 48, 24, ["毎日照合", "該当あり", "影響あり", None])[0],
    W(170, 362, 120, 362, c=MUT, lw=1.4), W(120, 362, 120, 74, c=MUT, lw=1.4),
    ARR(120, 74, 166, 74, MUT, 1.5),
    T(112, 216, "更新", "end", 10.5, MUT, True),
], "これは製品を出したあと 10 年間まわし続ける仕組み。人と手順を決めておかないと、必ず止まる")

# ===================== 16. 通信セキュリティ =====================

F["s16_tls"] = SVG(820, 420, [
    T(410, 26, "TLS で実際に守られるもの、守られないもの", "middle", 12.5, INK, True),
    seq(200, 48, ["機器", "サーバ"], [
        (0, 1, "ClientHello"),
        (1, 0, "証明書 + 鍵交換", "★ ここを検証しないと全部無意味", SIG),
        (0, 0, "証明書チェーン検証・ホスト名照合・有効期限確認", None, SIG),
        (0, 1, "クライアント証明書（相互認証の場合）"),
        (0, 1, "暗号化された通信"),
    ], 180, 40, 38, 400)[0],
    RECT(40, 318, 350, 84, 8, SSOFT, SIG, 1.4),
    T(215, 342, "TLS が守るもの", "middle", 11.5, SIG, True),
    T(215, 364, "経路上の盗聴・改ざん・なりすまし", "middle", 10.5, INK),
    T(215, 386, "（正しく検証していれば）", "middle", 10, MUT),
    RECT(430, 318, 350, 84, 8, ASOFT, ALI, 1.4),
    T(605, 342, "TLS が守らないもの", "middle", 11.5, ALI, True),
    T(605, 364, "機器の中の鍵・サーバ側の実装・", "middle", 10.5, INK),
    T(605, 386, "アプリケーション層の権限設計", "middle", 10.5, INK),
], "TLS を「使った」ことと「正しく検証している」ことはまったく別。検証を切った瞬間に、ただの難読化になる")

F["s16_time"] = SVG(780, 230, [
    T(390, 26, "証明書検証は時計に依存する", "middle", 12.5, INK, True),
    BOX(40, 58, 320, 52, "機器の時計が 1970 年", "すべての証明書が「まだ有効期間前」", ALI, ASOFT, INK, 8, 1.4, 12, 9.5),
    BOX(420, 58, 320, 52, "機器の時計が 2099 年", "すべての証明書が「期限切れ」", ALI, ASOFT, INK, 8, 1.4, 12, 9.5),
    ARR(390, 110, 390, 136, ALI, 1.8),
    BOX(240, 138, 300, 40, "検証が失敗する", None, ALI, ASOFT),
    ARR(390, 178, 390, 200, ALI, 1.8),
    T(390, 220, "「面倒だから検証を切ろう」 → 破滅", "middle", 13, ALI, True),
], "RTC がない機器・電池が切れた機器では日常的に起きる。時刻同期の設計を証明書検証とセットで考える")

F["s16_mqtt"] = SVG(800, 300, [
    T(400, 26, "MQTT のトピック設計 — 認証だけでなく認可も要る", "middle", 12.5, INK, True),
    RECT(24, 52, 372, 224, 10, ASOFT, ALI, 1.5),
    T(210, 76, "悪い設計", "middle", 12.5, ALI, True),
    T(210, 104, "全機器が同じユーザ名／パスワード", "middle", 10.5, INK),
    BOX(50, 122, 320, 40, "sensors/#  を全機器が購読できる", None, ALI, PAN, INK, 6, 1.3, 11, 9, None, True),
    ARR(210, 162, 210, 186, ALI, 1.6),
    T(210, 210, "1 台から認証情報が漏れたら", "middle", 10.5, INK),
    T(210, 232, "全機器のデータが読まれる", "middle", 11.5, ALI, True),
    RECT(424, 52, 372, 224, 10, SSOFT, SIG, 1.5),
    T(610, 76, "良い設計", "middle", 12.5, SIG, True),
    T(610, 104, "機器ごとの X.509 証明書", "middle", 10.5, INK),
    BOX(450, 118, 320, 30, "devices/{deviceId}/up    （書き込みのみ）", None, SIG, PAN, INK, 5, 1.2, 10, 9, None, True),
    BOX(450, 152, 320, 30, "devices/{deviceId}/down  （読み取りのみ）", None, SIG, PAN, INK, 5, 1.2, 10, 9, None, True),
    ARR(610, 182, 610, 202, SIG, 1.6),
    T(610, 222, "deviceId は証明書のサブジェクトから導出", "middle", 10.5, INK),
    T(610, 246, "他機器のトピックには触れない", "middle", 11.5, SIG, True),
], "認証（誰か）が通っても、認可（何をしてよいか）を絞らなければ被害は全体に広がる")
# ===================== 17. Arm =====================

F["s17_sau"] = SVG(760, 280, [
    T(380, 26, "SAU と IDAU — アドレスの属性はどう決まるか", "middle", 12.5, INK, True),
    BOX(280, 52, 200, 40, "アドレス X へのアクセス", None, LIN, SCR),
    ARR(380, 92, 380, 116, MUT, 1.6),
    BOX(180, 118, 170, 56, "IDAU", "シリコンで固定。変更不可", ALI, ASOFT, INK, 8, 1.4, 12, 9.5),
    BOX(410, 118, 170, 56, "SAU", "ソフトウェアで設定できる", SIG, SSOFT, INK, 8, 1.4, 12, 9.5),
    W(265, 174, 265, 194, c=MUT, lw=1.5), W(495, 174, 495, 194, c=MUT, lw=1.5),
    W(265, 194, 495, 194, c=MUT, lw=1.5),
    T(380, 210, "より制限の強いほうが勝つ", "middle", 11.5, ALI, True),
    ARR(380, 216, 380, 238, MUT, 1.6),
    BOX(230, 240, 300, 34, "Secure / NSC / Non-secure", None, LIN, PAN, INK, 6, 1.4, 11.5),
    RECT(600, 112, 150, 68, 8, SCR, LIN, 1.3),
    T(675, 134, "SAU で緩めても", "middle", 10, MUT),
    T(675, 152, "IDAU の制限は", "middle", 10, MUT),
    T(675, 170, "外せない", "middle", 10, ALI, True),
], "SAU の設定を間違えても、IDAU より緩くはできない。安全側に倒れる設計になっている")

F["s17_alias"] = SVG(760, 220, [
    T(380, 26, "同じフラッシュが 2 つのアドレスに見える（エイリアス）", "middle", 12.5, INK, True),
    BOX(60, 62, 300, 56, "0x0800_0000", "Non-secure から見たフラッシュ", ALI, ASOFT, INK, 8, 1.5, 13, 10, None, True),
    BOX(420, 62, 300, 56, "0x0C00_0000", "Secure から見た同じフラッシュ", SIG, SSOFT, INK, 8, 1.5, 13, 10, None, True),
    W(210, 118, 210, 148, c=MUT, lw=1.4), W(570, 118, 570, 148, c=MUT, lw=1.4),
    W(210, 148, 570, 148, c=MUT, lw=1.4),
    BOX(280, 150, 220, 40, "物理的には同じ領域", None, LIN, SCR),
    T(380, 210, "リンカスクリプトとデバッガでアドレスが食い違うのは、たいていこれが原因",
      "middle", 11, MUT, True),
], "bit 28 が属性を表す。同じ内容が別アドレスで見えるので、慣れるまでは混乱の元になる")

F["s17_psa"] = SVG(800, 330, [
    T(400, 26, "PSA の階層構造", "middle", 12.5, INK, True),
    RECT(40, 48, 720, 76, 10, ASOFT, ALI, 1.5),
    T(400, 70, "NSPE（Non-secure Processing Environment）", "middle", 12, ALI, True),
    T(400, 100, "アプリケーション、RTOS、通信スタック", "middle", 11, INK),
    ARR(400, 124, 400, 148, MUT, 1.8),
    T(414, 142, "PSA Functional API", "start", 10.5, SIG, True),
    RECT(40, 150, 720, 164, 10, SSOFT, SIG, 1.5),
    T(400, 172, "SPE（Secure Processing Environment）", "middle", 12, SIG, True),
    BOX(60, 186, 680, 52, "ARoT（Application Root of Trust）",
        "アプリ固有のセキュアサービス。ベンダや顧客が追加する", LIN, PAN, INK, 8, 1.4, 11.5, 9.5),
    BOX(60, 246, 680, 58, "PSA-RoT（PSA Root of Trust）",
        "Crypto・ITS・Attestation・Firmware Update。最も特権が高いので最小限に保つ",
        ALI, ASOFT, INK, 8, 1.5, 11.5, 9.5),
    T(400, 326, "特権の高い層ほど小さくする——RoT 設計の一般原則がそのまま構造になっている",
      "middle", 11, MUT, True),
], "PSA-RoT に何でも入れてはいけない。追加したいものは ARoT に置き、PSA-RoT は薄いままにする")

F["s17_migrate"] = SVG(780, 250, [
    T(390, 26, "PSA API で書いておくと移行できる", "middle", 12.5, INK, True),
    BOX(40, 62, 320, 74, "今：Cortex-M4 + Mbed TLS", "PSA Crypto API で書く。実装はソフトウェア",
        LIN, PAN, INK, 8, 1.5, 12, 9.5),
    ARR(360, 99, 420, 99, MUT, 1.8), T(390, 86, "移行", "middle", 10, FNT),
    BOX(422, 62, 320, 74, "後：Cortex-M33 + TF-M", "同じ API のまま、実装が SPE 側に移る",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    RECT(120, 170, 540, 62, 8, SSOFT, SIG, 1.4),
    T(390, 196, "★ アプリケーションコードを変えずに移行できる", "middle", 12.5, SIG, True),
    T(390, 220, "自前の暗号ラッパを書いてしまうと、この道が閉じる", "middle", 11, ALI, True),
], "TrustZone がないチップでも、最初から PSA Crypto API で書いておく。将来の移行コストがほぼゼロになる")

F["s17_mte"] = SVG(800, 260, [
    T(400, 26, "MTE — メモリにタグを付けて不正アクセスを検出する", "middle", 12.5, INK, True),
] + sum([[RECT(60 + i * 100, 66, 88, 44, 6, SCR, LIN, 1.3),
          T(104 + i * 100, 92, "16 バイト", "middle", 10, MUT),
          RECT(60 + i * 100, 116, 88, 26, 4, SSOFT if i != 2 else ASOFT, SIG if i != 2 else ALI, 1.3),
          T(104 + i * 100, 134, "タグ %d" % [3, 3, 7, 3, 3, 3][i], "middle", 10,
            SIG if i != 2 else ALI, True)] for i in range(6)], [])
  + [BOX(60, 168, 300, 44, "ポインタの上位ビット：タグ 3", None, SIG, SSOFT, INK, 6, 1.4, 11.5),
     ARR(360, 190, 400, 190, MUT, 1.6),
     BOX(402, 168, 336, 44, "タグが一致しなければ Fault", None, ALI, ASOFT, INK, 6, 1.4, 11.5),
     T(400, 244, "Use-after-free とバッファオーバーフローが、実行時に確率的に検出される",
       "middle", 11, MUT, True)],
    "ソフトウェアの書き換えなしにメモリ安全性を上げる仕組み。Cortex-A 系で先行し、組み込みにも降りてきつつある")

F["s17_cca"] = SVG(800, 326, [
    T(400, 26, "Arm CCA — Realm World の追加", "middle", 12.5, INK, True),
    RECT(24, 52, 372, 250, 10, SCR, LIN, 1.5),
    T(210, 76, "従来", "middle", 12.5, INK, True),
    stack(48, 92, 324, [("Normal World", "ハイパーバイザ / ゲスト VM", LIN, PAN),
                        ("Secure World", "TEE", SIG, SSOFT)], 62, 8)[0],
    T(210, 288, "ハイパーバイザはゲストの中身を見られる", "middle", 10.5, MUT),
    RECT(424, 52, 372, 250, 10, SCR, LIN, 1.5),
    T(610, 76, "CCA", "middle", 12.5, INK, True),
    stack(448, 92, 324, [("Normal World", "ハイパーバイザ / ゲスト VM", LIN, PAN),
                         ("Secure World", "TEE", SIG, SSOFT),
                         ("Realm World ★ 新設", "ハイパーバイザからも見えない", ALI, ASOFT)], 52, 6)[0],
    T(610, 288, "クラウド事業者からも中身を守る", "middle", 10.5, ALI, True),
], "「インフラ提供者すら信頼しない」方向への拡張。組み込み単体よりは、エッジ／クラウド寄りの話")

# ===================== 18. ST =====================

F["s18_pcrop"] = SVG(780, 250, [
    T(390, 26, "PCROP — 実行はできるが読めない領域", "middle", 12.5, INK, True),
    BOX(40, 62, 300, 70, "自社のアルゴリズム", "モータ制御・音声処理・DSP。顧客に提供したいが中身は見せたくない",
        LIN, PAN, INK, 8, 1.5, 12, 9.5),
    ARR(340, 97, 400, 97, MUT, 1.8),
    BOX(402, 62, 340, 70, "PCROP 領域に置く", "CPU は命令フェッチできる（実行できる）／データとして読むと Fault",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    RECT(80, 166, 620, 66, 8, SCR, LIN, 1.3),
    T(390, 190, "ライブラリを配布したいが逆アセンブルされたくない、という用途向け。", "middle", 11, MUT),
    T(390, 214, "セキュリティ機能というより知財保護の機能に近い", "middle", 11, INK, True),
], "実行専用（execute-only）メモリ。用途がはっきりしているので、目的が違う場面で使わないこと")

F["s18_hdp"] = SVG(780, 424, [
    T(390, 26, "HDP — 起動処理が終わったら自分で閉じる", "middle", 12.5, INK, True),
    flowdown(390, 50, [
        ("ブートローダ（HDP 領域）が動く", "鍵を読む・検証する・初期化する", SIG, SSOFT),
        ("★ HDP を有効化する（一方向）", None, ALI, ASOFT),
        ("アプリケーションを起動", None, LIN, PAN),
        ("★ 以後、HDP 領域は CPU からも DMA からも読めない", "次のリセットまで解除されない", ALI, ASOFT),
    ], 460, 52, 32)[0],
    RECT(70, 372, 640, 40, 8, SCR, LIN, 1.3),
    T(390, 396, "アプリに脆弱性があっても、ブート時の鍵や処理には手が届かない", "middle", 11, MUT, True),
], "「使い終わったら自分を隠す」という考え方。TrustZone がない品種でも、時間軸の分離はできる")

F["s18_otfdec"] = SVG(760, 292, [
    T(380, 26, "OTFDEC — 外部フラッシュを暗号のまま XIP する", "middle", 12.5, INK, True),
    flowdown(380, 54, [
        ("外部 QSPI / OCTOSPI フラッシュ", None, LIN, PAN),
        ("OTFDEC", "AES-CTR。鍵はチップ内", SIG, SSOFT),
        ("CPU（XIP で実行）", None, LIN, PAN),
    ], 380, 46, 30, ["暗号文", "平文"])[0],
    T(380, 276, "暗号化であって認証ではない。改ざん検知が要るなら別の仕組みを重ねる",
      "middle", 11, ALI, True),
], "外部フラッシュを使う構成では実質必須の機能。ただし完全性の保証は別問題として残る")

F["s18_dbgauth"] = SVG(760, 388, [
    T(380, 26, "STM32 のデバッグ認証", "middle", 12.5, INK, True),
    seq(190, 50, ["デバッガ", "STM32"], [
        (0, 1, "接続要求"),
        (1, 0, "チャレンジ（乱数）"),
        (0, 1, "秘密鍵で署名 + 証明書"),
        (1, 1, "登録された公開鍵で検証", None, BLU),
        (1, 1, "権限レベルを判定", None, BLU),
        (1, 0, "デバッグポート開放", None, SIG),
    ], 180, 40, 36, 380)[0],
    T(380, 366, "権限レベルを分けられるので、「メモリは読めないが再起動はできる」といった運用ができる",
      "middle", 11, MUT, True),
], "完全ロックと開放の中間を作れる。RMA の運用設計と合わせて権限レベルを決める")

F["s18_sfi"] = SVG(820, 300, [
    T(410, 26, "SFI — ST の Secure Firmware Install", "middle", 12.5, INK, True),
    RECT(24, 52, 380, 152, 10, SSOFT, SIG, 1.5),
    T(214, 76, "開発元（自社）", "middle", 12.5, SIG, True),
    T(214, 102, "ファームウェアを暗号化 → .sfi ファイル", "middle", 10.5, INK),
    T(214, 126, "暗号鍵を HSM カードに格納", "middle", 10.5, INK),
    T(214, 152, "★ HSM に「書き込める台数」を設定", "middle", 10.5, SIG, True),
    T(214, 182, ".sfi と HSM カードを製造委託先へ送る", "middle", 10, FNT),
    ARR(404, 128, 436, 128, MUT, 1.8),
    RECT(438, 52, 358, 152, 10, ASOFT, ALI, 1.5),
    T(617, 76, "工場", "middle", 12.5, ALI, True),
    T(617, 102, "書き込み装置に HSM カードを挿入", "middle", 10.5, INK),
    T(617, 126, "装置 ⇄ STM32 の ROM が HSM 経由で", "middle", 10.5, INK),
    T(617, 146, "セキュアな経路を確立する", "middle", 10.5, INK),
    T(617, 176, "STM32 が自分で復号して内部フラッシュに書く", "middle", 10, FNT),
    RECT(60, 220, 700, 34, 8, SSOFT, SIG, 1.4),
    T(410, 242, "★ 工場はファームウェアの平文も鍵も見られない", "middle", 11.5, SIG, True),
    RECT(60, 258, 700, 34, 8, SSOFT, SIG, 1.4),
    T(410, 280, "★ HSM のカウンタが減る → 契約台数以上は書き込めない", "middle", 11.5, SIG, True),
], "12 章の SFI 方式を ST が製品化したもの。各社に同種の仕組みがあるので、委託生産では選定条件になる")

# ===================== 19. NXP =====================

F["s19_hab"] = SVG(800, 320, [
    T(400, 26, "HAB / AHAB — 4 個の鍵と失効ビット", "middle", 12.5, INK, True),
    BOX(230, 50, 340, 46, "eFuse：SRK_HASH", "4 個の公開鍵（SRK テーブル）のハッシュ",
        ALI, ASOFT, INK, 8, 1.5, 12, 9.5),
    ARR(400, 96, 400, 118, MUT, 1.6),
    RECT(180, 120, 440, 140, 8, SSOFT, SIG, 1.5),
    T(400, 142, "ブート ROM", "middle", 12.5, INK, True),
    steps(206, 168, ["イメージ添付の SRK テーブルをハッシュして eFuse と照合",
                     "使用する SRK を選ぶ（4 個から。★ 失効ビットで無効化できる）",
                     "SRK で CSF の署名を検証する",
                     "CSF の指示に従ってイメージ本体の署名を検証する",
                     "OK → 実行"], 19, SIG)[0],
    RECT(60, 274, 680, 40, 8, SCR, LIN, 1.3),
    T(400, 298, "★ 署名鍵が漏れたら、その鍵だけ失効させて残り 3 本で運用を続けられる",
      "middle", 11, MUT, True),
], "鍵が 1 本しかないと、漏れた瞬間に打つ手がなくなる。複数持って失効できる設計は実運用で効く")

F["s19_puf"] = SVG(780, 352, [
    T(390, 26, "SRAM PUF の起動シーケンス", "middle", 12.5, INK, True),
    flowdown(390, 50, [
        ("起動時：SRAM PUF から鍵を再構成する", "ヘルパーデータ（アクティベーションコード）で誤り訂正／数 ms〜数十 ms かかる", SIG, SSOFT),
        ("デバイス固有鍵（ルート鍵）が得られる", None, SIG, SSOFT),
        ("この鍵で他の鍵をラップして保存する（06 章）", None, LIN, PAN),
    ], 480, 56, 32)[0],
    RECT(70, 296, 640, 44, 8, SSOFT, SIG, 1.4),
    T(390, 322, "★ 電源が切れると、鍵はどこにも存在しない", "middle", 12.5, SIG, True),
    T(70, 78, "起動時間に", "middle", 10, FNT), T(70, 94, "効くので注意", "middle", 10, ALI, True),
], "PUF は「保存しない」ので分解しても読めない。代わりに起動のたびに数 ms〜数十 ms かかる")

F["s19_blob"] = SVG(800, 260, [
    T(400, 26, "Black Key と Blob — どちらも「平文で持たない」形式", "middle", 12.5, INK, True),
    BOX(30, 58, 370, 96, "Black Key", "平文の鍵を CAAM が内部の鍵（OTPMK / ZMK）で暗号化した形式。\nCPU が読んでも暗号文。CAAM に渡すと内部で復号して使う",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 10),
    BOX(420, 58, 350, 96, "Blob", "任意のデータを、デバイス固有鍵で暗号化 + 認証した形式。\n他のチップに移しても復号できない",
        BLU, PAN, INK, 8, 1.5, 12.5, 10),
    RECT(60, 180, 680, 66, 8, SCR, LIN, 1.3),
    T(400, 204, "「鍵の形式」を用意しているベンダは、鍵の扱いを設計として持っている。", "middle", 11, MUT),
    T(400, 228, "この種の仕組みがあるかどうかは、品種選定の重要な判断材料になる", "middle", 11, INK, True),
], "06 章の鍵ラッピングを、ベンダが製品として実装したもの。名前は違っても各社に相当機能がある")

F["s19_dc"] = SVG(800, 300, [
    T(400, 26, "デバッグ証明書（DC）による権限つきデバッグ", "middle", 12.5, INK, True),
    BOX(40, 58, 340, 106, "デバッグ証明書（DC）",
        "ベンダ（あなた）が発行する\nどのデバイス（UUID）に有効かを指定できる\nどの権限（コア・レベル）を与えるか記述できる",
        SIG, SSOFT, INK, 8, 1.5, 12.5, 10),
    ARR(380, 111, 440, 111, MUT, 1.8),
    BOX(442, 58, 330, 106, "デバイス",
        "eFuse の RoTK ハッシュで DC を検証\nチャレンジ・レスポンスで所有者を確認\n指定された権限でデバッグポートを開く",
        LIN, PAN, INK, 8, 1.5, 12.5, 10),
    RECT(60, 194, 680, 88, 8, SCR, LIN, 1.3),
    T(400, 218, "「特定の 1 台だけ、読み出しなしで、再起動だけ許す」といった細かい制御ができる。",
      "middle", 11, MUT),
    T(400, 242, "返品された機器を解析する運用（14 章の RMA）を、", "middle", 11, MUT),
    T(400, 264, "セキュリティを落とさずに成立させるための仕組み", "middle", 11.5, INK, True),
], "「開ける／閉じる」の 2 値ではなく、誰に・どの機器で・どこまで、を証明書で表現する")

# ===================== 20. Espressif =====================

F["s20_efuse"] = SVG(800, 392, [
    T(400, 26, "eFuse に鍵を焼く手順", "middle", 12.5, INK, True),
    flowdown(400, 52, [
        ("BLOCK_KEYn に鍵を書き込む", None, LIN, PAN),
        ("KEY_PURPOSE_n に用途を設定する", "Secure Boot 用、Flash Encryption 用など", LIN, PAN),
        ("★ 読み出し保護ビットを焼く", "CPU からも読めなくなる", SIG, SSOFT),
        ("★ 書き込み保護ビットを焼く", "二度と変更できなくなる", ALI, ASOFT),
    ], 420, 50, 22)[0],
    RECT(70, 336, 660, 40, 8, ASOFT, ALI, 1.4),
    T(400, 360, "3 と 4 を焼き忘れたまま出荷する事故が多い。焼いたことを製造検査で確認する",
      "middle", 11, ALI, True),
], "機能はあるが、有効化されないまま出荷されるのが最大の問題。工程に組み込んで検査する")

F["s20_boot"] = SVG(760, 336, [
    T(380, 26, "ESP32 系のブートの流れ", "middle", 12.5, INK, True),
    flowdown(380, 52, [
        ("ROM ブートローダ", "Immutable RoT（04 章）", ALI, ASOFT),
        ("第 2 段ブートローダ（フラッシュ上）", "同じ鍵でアプリの署名を検証する", SIG, SSOFT),
        ("アプリケーション", None, LIN, PAN),
    ], 420, 54, 40,
      ["eFuse のダイジェストで第 2 段の署名を検証", "同じ鍵でアプリの署名を検証"])[0],
    T(380, 318, "ROM は焼き切り。第 2 段以降は更新できる——04 章の 2 段構えそのもの",
      "middle", 11, MUT, True),
], "構成は他社と同じ。違うのは「デフォルトでは何も有効になっていない」こと")

F["s20_hmac"] = SVG(780, 292, [
    T(390, 26, "HMAC ペリフェラル — 鍵を CPU に見せない", "middle", 12.5, INK, True),
    flowdown(390, 52, [
        ("eFuse に HMAC 鍵を焼く（読み出し保護をかける）", None, ALI, ASOFT),
        ("ソフトウェアは「この HMAC を計算して」と依頼するだけ", None, LIN, PAN),
        ("★ 鍵は CPU に一度も現れない（06 章の鍵の不可視化）", None, SIG, SSOFT),
    ], 500, 46, 30)[0],
    T(390, 276, "同じ考え方が DS ペリフェラル（RSA/ECDSA の秘密鍵）にも適用されている",
      "middle", 11, MUT, True),
], "06 章で述べた原則が、そのまま製品機能になっている例")

F["s20_ds"] = SVG(800, 300, [
    T(400, 26, "DS ペリフェラル — 秘密鍵をソフトウェアに見せずに署名する", "middle", 12.5, INK, True),
    steps(70, 66, [
        "秘密鍵を、eFuse の HMAC 鍵から導出した鍵で暗号化してフラッシュに保存する",
        "署名するとき、DS ペリフェラルに暗号化されたパラメータを渡す",
        "★ ペリフェラルが内部で復号し、署名を計算する",
        "平文の秘密鍵は CPU バスに現れない",
    ], 32, SIG)[0],
    RECT(70, 208, 660, 76, 8, SSOFT, SIG, 1.4),
    T(400, 232, "TLS クライアント認証の秘密鍵をこの形で持てば、", "middle", 11, INK),
    T(400, 254, "ファームウェアを吸い出されても機器になりすませない", "middle", 12, SIG, True),
    T(400, 276, "＝ 12 章の「機器固有鍵」を安価な MCU で実現できる", "middle", 10.5, MUT),
], "外付けのセキュアエレメントを使わずに、鍵の不可視化を実現する仕組み。コスト面での意味が大きい")

# ===================== 21. その他ベンダ =====================

F["s21_wrap"] = SVG(780, 336, [
    T(390, 26, "各社に共通する「鍵を見せない」構造", "middle", 12.5, INK, True),
    flowdown(390, 52, [
        ("HUK", "チップ固有鍵。CPU から読めない", ALI, ASOFT),
        ("鍵のインストール", "平文の鍵を渡すのではなく、ラップされた鍵の形で扱う", SIG, SSOFT),
        ("使用", "ラップ済み鍵を暗号エンジンに渡す。エンジンが内部でアンラップする", SIG, SSOFT),
    ], 500, 54, 26)[0],
    RECT(70, 282, 640, 40, 8, SSOFT, SIG, 1.4),
    T(390, 306, "★ 平文の鍵が CPU バスに現れることが一度もない", "middle", 12, SIG, True),
], "呼び名は各社バラバラ（KMU・Secure Vault・Black Key・DS…）だが、やっていることは同じ")

F["s21_vendors"] = SVG(840, 300, [
    T(420, 26, "各社の力点はどこにあるか", "middle", 12.5, INK, True),
] + sum([[BOX(24 + (i % 3) * 268, 52 + (i // 3) * 116, 252, 102, n, d, c, PAN, INK, 8, 1.4, 12, 9.5)]
         for i, (n, d, c) in enumerate([
    ("Nordic", "SPU による分離と KMU。BLE / Thread 前提の低消費電力製品に最適化", LIN),
    ("Silicon Labs", "Secure Vault。ハイグレードでは専用のセキュアコアと耐タンパを持つ", SIG),
    ("TI", "GP / HS-FS / HS-SE のグレード分け。用途に応じて選ぶ", LIN),
    ("Microchip", "Trust&GO などプロビジョニング済み SE。体制がなくても機器固有鍵が入る", SIG),
    ("Renesas", "DLM によるライフサイクル管理と、RSIP / TSIP の暗号エンジン", LIN),
    ("Infineon", "PSoC 64 と AURIX HSM。車載と高信頼領域に厚い", LIN)])], [])
  + [T(420, 288, "機能名は違っても、04〜08 章の枠組み（RoT・鍵の不可視化・分離・乱数）に必ず対応づけられる",
       "middle", 11, MUT, True)],
    "各社の機能名・提供状況は改訂されるので、判断は必ずデータシートとセキュリティ資料の一次情報で行う")

# ===================== 22. セキュアエレメント =====================

F["s22_se"] = SVG(820, 280, [
    T(410, 26, "セキュアエレメント — 別チップに隔離する", "middle", 12.5, INK, True),
    BOX(50, 62, 280, 110, "MCU", "アプリケーション\n通信スタック\n（脆弱性はいずれ出る）",
        ALI, ASOFT, INK, 10, 1.6, 13, 10),
    ARR(330, 104, 464, 104, MUT, 1.8), T(397, 92, "I2C", "middle", 10, BLU, True),
    ARR(464, 130, 330, 130, MUT, 1.8), T(397, 148, "SPI", "middle", 10, BLU, True),
    BOX(466, 62, 300, 110, "Secure Element", "鍵は内部に固定\n演算だけを提供する\n耐タンパ設計",
        SIG, SSOFT, INK, 10, 1.6, 13, 10),
    T(190, 196, "ここが完全に侵害されても", "middle", 11.5, ALI, True),
    T(616, 196, "鍵は取り出せない", "middle", 11.5, SIG, True),
    ARR(190, 178, 190, 190, ALI, 1.4), ARR(616, 178, 616, 190, SIG, 1.4),
    RECT(80, 220, 660, 46, 8, SCR, LIN, 1.3),
    T(410, 248, "境界がチップの外に引かれるので、ソフトウェアの脆弱性から完全に切り離せる",
      "middle", 11, MUT, True),
], "MCU 内蔵の機能で足りるなら SE は要らない。SE が効くのは「MCU が丸ごと落ちても鍵を守りたい」場面")

F["s22_seal"] = SVG(800, 322, [
    T(400, 26, "TPM のシーリング — 状態が変わると復号できなくなる", "middle", 12.5, INK, True),
    flowdown(400, 52, [
        ("ディスク暗号鍵を「PCR が正しい値のときだけ復号できる」ようにシールする", None, SIG, SSOFT),
        ("ブートローダやカーネルが改ざんされる", None, ALI, ASOFT),
        ("PCR の値が変わる", None, ALI, ASOFT),
        ("★ 鍵が復号できなくなる → ディスクが読めない", None, ALI, ASOFT),
    ], 560, 42, 20)[0],
    T(400, 306, "「改ざんを検出して止める」のではなく、「改ざんされると鍵が使えなくなる」という作り方",
      "middle", 11, MUT, True),
], "検証ロジックを迂回されても効くのが強み。DICE（04 章）と同じ発想がここにも現れる")

F["s22_decide"] = SVG(860, 372, [
    T(430, 26, "SE を使うべきか — 判断の順序", "middle", 12.5, INK, True),
] + sum([[
    BOX(24, 52 + i * 72, 300, 60, q, None, LIN, SCR, INK, 8, 1.4, 11.5),
    BOX(344, 52 + i * 72, 250, 26, a1, None, LIN, PAN, INK, 5, 1.2, 10.5),
    BOX(344, 84 + i * 72, 250, 26, a2, None, LIN, PAN, INK, 5, 1.2, 10.5),
    BOX(614, 52 + i * 72, 222, 26, r1, None, c1, PAN if c1 == LIN else SSOFT if c1 == SIG else ASOFT, INK, 5, 1.2, 10.5),
    BOX(614, 84 + i * 72, 222, 26, r2, None, c2, PAN if c2 == LIN else SSOFT if c2 == SIG else ASOFT, INK, 5, 1.2, 10.5),
    ARR(594, 65 + i * 72, 610, 65 + i * 72, MUT, 1.3, 5),
    ARR(594, 97 + i * 72, 610, 97 + i * 72, MUT, 1.3, 5),
] for i, (q, a1, a2, r1, c1, r2, c2) in enumerate([
    ("Q1. 想定する攻撃者クラスは？（02 章）", "クラス 1〜2", "クラス 4〜5",
     "MCU 内蔵で十分", SIG, "SE を強く推奨", ALI),
    ("Q2.「1 台破ると全台破れる」構造があるか？", "ない（機器固有鍵がある）", "ある",
     "MCU 内蔵で検討可", SIG, "固有鍵の実現方法を検討", ALI),
    ("Q3. プロビジョニングの体制はあるか？（12 章）", "HSM・CA・保護された工場がある", "ない",
     "自社プロビジョニング", SIG, "★ プロビジョニング済み SE", ALI),
    ("Q4. MCU が鍵の不可視化機構を持つか？（06 章）", "持つ（ラッピング・KMU・DS）", "持たない",
     "MCU 内蔵で検討可", SIG, "SE を推奨", ALI)])], [])
  + [T(430, 354, "「全部入れる」は間違い。要件から降ろして、必要なところにだけ使う", "middle", 11, MUT, True)],
    "SE は万能薬ではない。クラス 3 以下で機器固有鍵が既に実現できているなら、追加する必要はないことも多い")

F["s22_hybrid"] = SVG(780, 230, [
    T(390, 26, "SE と MCU の役割分担", "middle", 12.5, INK, True),
    BOX(40, 62, 300, 66, "SE が長期鍵を持つ", "1 回だけ鍵共有（ECDH）や署名を行う",
        SIG, SSOFT, INK, 8, 1.5, 12, 9.5),
    ARR(340, 95, 400, 95, MUT, 1.8),
    BOX(402, 62, 340, 66, "MCU がセッション鍵を得る", "以後は MCU の AES アクセラレータで高速に処理",
        LIN, PAN, INK, 8, 1.5, 12, 9.5),
    RECT(80, 158, 620, 60, 8, SCR, LIN, 1.3),
    T(390, 182, "SE は遅い（I2C 経由で数十 ms かかることもある）。", "middle", 11, MUT),
    T(390, 206, "すべてを SE でやろうとせず、長期鍵の保護だけに使うのが実用的", "middle", 11.5, INK, True),
], "SE の速度は MCU の暗号アクセラレータに遠く及ばない。使いどころを絞ることで両方の利点が取れる")

# ===================== 23. 選定指針 =====================

F["s23_matrix"] = SVG(860, 340, [
    T(430, 26, "要件 → 機能 → 品種 の降ろし方", "middle", 12.5, INK, True),
    T(150, 58, "要件（02・03 章）", "middle", 12, ALI, True),
    T(430, 58, "必要な機能（04〜08 章）", "middle", 12, SIG, True),
    T(730, 58, "品種の条件（17〜22 章）", "middle", 12, BLU, True),
] + sum([[
    BOX(24, 72 + i * 60, 252, 50, a, None, ALI, ASOFT, INK, 7, 1.3, 11),
    ARR(276, 97 + i * 60, 300, 97 + i * 60, MUT, 1.4, 5),
    BOX(302, 72 + i * 60, 256, 50, b, None, SIG, SSOFT, INK, 7, 1.3, 11),
    ARR(558, 97 + i * 60, 582, 97 + i * 60, MUT, 1.4, 5),
    BOX(584, 72 + i * 60, 252, 50, c, None, BLU, PAN, INK, 7, 1.3, 11),
] for i, (a, b, c) in enumerate([
    ("改ざんされた機器を動かさない", "セキュアブート", "ROM ベースの検証と OTP 鍵"),
    ("1 台破られても波及させない", "機器固有鍵とその不可視化", "鍵ラッピング／KMU／SE"),
    ("出荷後 10 年、直し続ける", "セキュア OTA とロールバック防止", "A/B 容量と単調カウンタ"),
    ("解析されても鍵を守る", "デバッグ制御とライフサイクル", "認証つきデバッグと LCS"),
])], [])
  + [T(430, 324, "この表が埋まらない要件は、そもそも実現できない。基板を起こす前にここで気づく",
       "middle", 11, MUT, True)],
    "「この機能が欲しい」から入ると必ず過不足が出る。要件から降ろすと、必要なものだけが残る")

# ===================== 10. フォールトインジェクション =====================

def _sq(x0, y, w, n, hi=16, c=MUT):
    """方形波 n 周期"""
    p = []
    per = w / n
    for i in range(n):
        x = x0 + i * per
        p += [x, y, x, y - hi, x + per / 2, y - hi, x + per / 2, y]
    p += [x0 + w, y]
    return W(*p, c=c, lw=1.5)

F["s10_glitch"] = SVG(840, 320, [
    T(420, 26, "電圧グリッチが命令を飛ばす仕組み", "middle", 12.5, INK, True),

    # --- VDD ---
    T(16, 74, "VDD", "start", 11, MUT, True),
    W(70, 62, 380, 62, c=SIG, lw=2),
    W(380, 62, 392, 104, 404, 104, 416, 62, c=ALI, lw=2),
    W(416, 62, 800, 62, c=SIG, lw=2),
    W(70, 62, 800, 62, c=FNT, lw=1, dash="2 6"),
    T(398, 122, "数十〜数百 ns", "middle", 10, ALI, True),
    T(398, 46, "グリッチ", "middle", 10.5, ALI, True),
    T(806, 66, "3.3 V", "start", 9.5, FNT),

    # --- CLK ---
    T(16, 172, "CLK", "start", 11, MUT, True),
    _sq(70, 172, 730, 13, 20, BLU),

    # --- 命令列 ---
    T(16, 232, "命令", "start", 11, MUT, True),
    BOX(70, 208, 96, 40, "LDR", None, LIN, PAN, INK, 6, 1.3, 11, 9),
    BOX(174, 208, 96, 40, "CMP", "署名を比較", LIN, PAN, INK, 6, 1.3, 11, 9),
    BOX(278, 208, 108, 40, "B.NE fail", "不一致なら停止", ALI, ASOFT, INK, 6, 1.6, 11, 9),
    BOX(394, 208, 118, 40, "NOP", "実行されない", ALI, PAN, ALI, 6, 1.6, 11, 9, "5 4"),
    BOX(520, 208, 130, 40, "BLX app", "アプリへ跳ぶ", SIG, SSOFT, INK, 6, 1.6, 11, 9),
    ARR(398, 130, 398, 202, ALI, 1.8),
    W(400, 214, 506, 242, c=ALI, lw=1.6),
    W(400, 242, 506, 214, c=ALI, lw=1.6),

    RECT(70, 268, 730, 36, 8, ASOFT, ALI, 1.4),
    T(435, 291, "「署名が一致しなかったのに、一致したときと同じ道を通る」——判定そのものを壊すのではなく、判定の結果を使う命令を消す",
      "middle", 10.5, INK),
], "電圧を一瞬だけ落とすと、その瞬間にフェッチされた命令が実行されない。狙うのは暗号ではなく、その直後の <code>if</code> である")

F["s10_methods"] = SVG(800, 340, [
    T(400, 26, "攻撃手法の位置づけ — 費用と空間分解能", "middle", 12.5, INK, True),
    RECT(78, 46, 660, 232, 10, SCR, LIN, 1.2),
    # 軸
    ARR(78, 278, 748, 278, MUT, 1.5),
    ARR(78, 278, 78, 40, MUT, 1.5),
    T(413, 302, "費用 →", "middle", 11, MUT, True),
    '<text transform="translate(26,180) rotate(-90)" text-anchor="middle" font-size="11"'
    ' fill="%s" font-family="var(--sans)" font-weight="700">空間分解能 →</text>' % MUT,
    T(150, 294, "数千円", "middle", 9.5, FNT),
    T(300, 294, "数万円", "middle", 9.5, FNT),
    T(470, 294, "数十〜数百万円", "middle", 9.5, FNT),
    T(660, 294, "数千万円", "middle", 9.5, FNT),
    T(70, 262, "低", "end", 9.5, FNT),
    T(70, 70, "高", "end", 9.5, FNT),
    # 点
    D(150, 252, FNT, 6), T(150, 236, "温度・電源の酷使", "middle", 10, MUT),
    D(300, 208, ALI, 7), T(300, 192, "電圧グリッチ", "middle", 10.5, ALI, True),
    D(340, 178, ALI, 7), T(404, 182, "クロックグリッチ", "start", 10.5, ALI, True),
    D(500, 122, SIG, 7), T(500, 106, "EMFI（電磁パルス）", "middle", 10.5, SIG, True),
    D(560, 150, SIG, 6), T(575, 138, "ボディバイアス注入", "start", 10, MUT),
    D(680, 74, BLU, 7), T(680, 58, "レーザー（LFI）", "middle", 10.5, BLU, True),
    # 危険域
    RECT(240, 160, 150, 70, 10, ASOFT, ALI, 1.3, "5 4"),
    T(315, 250, "ここが問題——「愛好家でも届く」領域", "middle", 10.5, ALI, True),
], "怖いのは高価な手法ではない。数万円の電圧グリッチが公開ツールで再現できてしまうこと、つまり 02 章のクラス 2 が実行できることが問題になる")

F["s10_redundant"] = SVG(840, 330, [
    T(420, 26, "冗長な検証が効く理由", "middle", 12.5, INK, True),
    # 左: 単純
    RECT(20, 44, 390, 268, 10, SCR, ALI, 1.5),
    T(215, 70, "単純な 1 回判定", "middle", 12, ALI, True),
    BOX(90, 86, 250, 38, "verify(sig) の結果を判定", None, LIN, PAN, INK, 6, 1.3, 11, 9),
    ARR(215, 124, 215, 148, MUT, 1.5),
    BOX(90, 148, 250, 38, "if (ok) { boot(); }", None, ALI, ASOFT, INK, 6, 1.6, 11, 9),
    ARR(215, 186, 215, 210, MUT, 1.5),
    BOX(90, 210, 250, 38, "boot()", None, SIG, SSOFT, INK, 6, 1.3, 11, 9),
    ARR(36, 167, 84, 167, ALI, 1.8),
    T(36, 152, "1 発", "start", 10, ALI, True),
    T(215, 278, "1 回のグリッチが当たれば突破される", "middle", 10.5, ALI, True),
    T(215, 297, "成功率 数 % でも、何万回でも試せる", "middle", 9.5, FNT),
    # 右: 冗長
    RECT(430, 44, 390, 268, 10, SSOFT, SIG, 1.5),
    T(625, 70, "冗長化 + ランダム遅延", "middle", 12, SIG, True),
    BOX(500, 86, 250, 34, "1 回目の判定（!= 0xA5A5 なら停止）", None, LIN, PAN, INK, 6, 1.3, 10, 9),
    ARR(625, 120, 625, 138, MUT, 1.4),
    BOX(500, 138, 250, 30, "ランダム遅延（0〜数百 µs）", None, BLU, PAN, INK, 6, 1.3, 10, 9),
    ARR(625, 168, 625, 186, MUT, 1.4),
    BOX(500, 186, 250, 34, "2 回目の判定（別の変数・別の場所）", None, LIN, PAN, INK, 6, 1.3, 10, 9),
    ARR(625, 220, 625, 238, MUT, 1.4),
    BOX(500, 238, 250, 30, "boot()", None, SIG, PAN, INK, 6, 1.3, 10, 9),
    ARR(446, 103, 494, 103, ALI, 1.6),
    ARR(446, 203, 494, 203, ALI, 1.6),
    T(462, 224, "2 発とも当てる必要", "start", 9.5, ALI, True),
    T(625, 297, "成功率が p なら p²、しかもタイミングが揺れる", "middle", 9.5, FNT),
], "グリッチ対策の本質は「1 回の成功では足りなくする」こと。判定を 2 回に分け、間にランダム遅延を挟むだけで成功確率は劇的に下がる")

F["s10_hw"] = SVG(820, 320, [
    T(410, 26, "ハードウェア側の防御 — 検出して即座に止める", "middle", 12.5, INK, True),
    RECT(250, 108, 320, 132, 12, SCR, INK, 1.8),
    T(410, 138, "ダイ", "middle", 11, MUT, True),
    BOX(272, 152, 130, 34, "CPU コア A", None, LIN, PAN, INK, 6, 1.3, 10.5, 9),
    BOX(418, 152, 130, 34, "CPU コア B", None, LIN, PAN, INK, 6, 1.3, 10.5, 9),
    T(410, 204, "ロックステップ照合", "middle", 10, SIG, True),
    W(337, 186, 337, 196, c=SIG, lw=1.4), W(483, 186, 483, 196, c=SIG, lw=1.4),
    W(337, 196, 483, 196, c=SIG, lw=1.4),
    BOX(272, 212, 276, 22, "SRAM / Flash — ECC・パリティ", None, LIN, PAN, MUT, 5, 1.2, 9.5, 9),
    # アクティブシールド
    W(250, 100, 570, 100, c=BLU, lw=2.2, dash="6 4"),
    T(410, 90, "アクティブシールド（配線が切れたら検出）", "middle", 10, BLU, True),
    # センサ
    BOX(24, 84, 190, 40, "電圧モニタ", "範囲外で即リセット", SIG, PAN, INK, 6, 1.3, 11, 9),
    BOX(24, 136, 190, 40, "クロックモニタ", "異常なパルスを検出", SIG, PAN, INK, 6, 1.3, 11, 9),
    BOX(24, 188, 190, 40, "温度センサ", "動作範囲外を検出", SIG, PAN, INK, 6, 1.3, 11, 9),
    BOX(606, 84, 190, 40, "光センサ", "開封を検出", SIG, PAN, INK, 6, 1.3, 11, 9),
    BOX(606, 136, 190, 40, "タンパー検出", "検出したら鍵を消去", ALI, ASOFT, INK, 6, 1.3, 11, 9),
    BOX(606, 188, 190, 40, "試行回数の制限", "繰り返しを許さない", SIG, PAN, INK, 6, 1.3, 11, 9),
    ARR(214, 104, 246, 128, MUT, 1.4), ARR(214, 156, 246, 160, MUT, 1.4),
    ARR(214, 208, 246, 196, MUT, 1.4),
    ARR(606, 104, 574, 128, MUT, 1.4), ARR(606, 156, 574, 160, MUT, 1.4),
    ARR(606, 208, 574, 196, MUT, 1.4),
    RECT(24, 256, 772, 48, 8, ASOFT, ALI, 1.4),
    T(410, 276, "汎用 MCU のブラウンアウト検出は「電源異常」への対策であって、攻撃への対策ではない", "middle", 11, INK, True),
    T(410, 294, "数十 ns のグリッチはブラウンアウト検出の応答より速い。ここが MCU とセキュアエレメントの差が最も出る領域になる", "middle", 10, MUT),
], "攻撃を防ぐのではなく、攻撃の兆候（電圧・クロック・温度・光の異常）を検出して止める。専用回路の有無は選定時にデータシートで確認する")

F["s10_flow"] = SVG(880, 270, [
    T(440, 26, "攻撃の実際のフローと、それぞれを潰す対策", "middle", 12.5, INK, True),
    flowright(20, 92, [("① 標的の特定", "どの命令を飛ばすか"),
                       ("② トリガー確立", "打つ基準を見つける"),
                       ("③ パラメータ探索", "数千〜数万回試す"),
                       ("④ 成功の検出", "外れたと分かるか"),
                       ("⑤ 再現性の確保", "数 % でも実用")], 152, 56, 20)[0],
    BOX(20, 158, 152, 56, "FW を読ませない", "06・11 章", SIG, SSOFT, INK, 6, 1.3, 10.5, 9),
    BOX(192, 158, 152, 56, "ランダム遅延", "基準を揺らす", SIG, SSOFT, INK, 6, 1.3, 10.5, 9),
    BOX(364, 158, 152, 56, "試行回数の制限", "異常検出でロック", SIG, SSOFT, INK, 6, 1.3, 10.5, 9),
    BOX(536, 158, 152, 56, "応答を一様にする", "失敗の見分けを消す", SIG, SSOFT, INK, 6, 1.3, 10.5, 9),
    BOX(708, 158, 152, 56, "冗長チェック", "1 発では足りなくする", SIG, SSOFT, INK, 6, 1.3, 10.5, 9),
    ARR(96, 120, 96, 154, SIG, 1.4), ARR(268, 120, 268, 154, SIG, 1.4),
    ARR(440, 120, 440, 154, SIG, 1.4), ARR(612, 120, 612, 154, SIG, 1.4),
    ARR(784, 120, 784, 154, SIG, 1.4),
    RECT(20, 228, 840, 30, 8, SCR, LIN, 1.3),
    T(440, 248, "最も効くのは実は ① ——どこを狙えばよいか分からなければ、②〜⑤ に進めない", "middle", 11, INK, True),
], "攻撃者の作業を段階に分けると、対策の効き所が見える。ただしブート ROM は同じチップを買えば誰でも解析できるので、① の防御は ROM を狙う攻撃には効かない")

# ===================== 11 / 21 / 23 / 03 追加 =====================

F["s11_flash"] = SVG(840, 330, [
    T(420, 26, "外付けフラッシュ — MCU がどれだけ堅牢でも別のチップである", "middle", 12.5, INK, True),
    # 左: 平文
    RECT(20, 44, 390, 250, 10, SCR, ALI, 1.5),
    T(215, 68, "平文で置いた場合", "middle", 12, ALI, True),
    chip(52, 96, 120, 62, "MCU", "堅牢"),
    chip(258, 96, 120, 62, "SPI Flash", "W25Qxx"),
    W(172, 118, 258, 118, c=MUT, lw=1.5), T(215, 110, "SCK/IO", "middle", 9, FNT),
    W(172, 138, 258, 138, c=MUT, lw=1.5),
    BOX(238, 190, 160, 34, "SOIC クリップ", "その場で数分でダンプ", ALI, ASOFT, INK, 6, 1.4, 10.5, 9),
    ARR(318, 190, 318, 166, ALI, 1.6),
    BOX(44, 190, 172, 34, "ロジックアナライザ", "バスを流れる中身が読める", ALI, ASOFT, INK, 6, 1.4, 10.5, 9),
    ARR(160, 190, 196, 142, ALI, 1.6),
    T(215, 250, "XIP で実行していれば、", "middle", 10.5, INK),
    T(215, 268, "実行中のコードがそのままバスに流れる", "middle", 10.5, ALI, True),
    # 右: 暗号化
    RECT(430, 44, 390, 250, 10, SSOFT, SIG, 1.5),
    T(625, 68, "オンザフライ復号を使う", "middle", 12, SIG, True),
    chip(462, 96, 120, 62, "MCU", "鍵は内部"),
    chip(668, 96, 120, 62, "SPI Flash", "暗号文のみ"),
    W(582, 118, 668, 118, c=SIG, lw=1.5), W(582, 138, 668, 138, c=SIG, lw=1.5),
    T(625, 110, "暗号文", "middle", 9, SIG, True),
    keyicon(522, 178, 1.0, SIG),
    T(522, 200, "鍵は MCU 内から出ない", "middle", 10, MUT),
    BOX(660, 168, 136, 34, "読んでも暗号文", None, SIG, PAN, INK, 6, 1.4, 10.5, 9),
    T(625, 250, "「起動時だけ復号」では足りない。", "middle", 10.5, INK),
    T(625, 268, "常時暗号化されたまま転送される必要がある", "middle", 10.5, SIG, True),
    RECT(20, 302, 800, 22, 6, SCR, LIN, 1.2),
    T(420, 318, "最も確実なのは、本当に守りたいものを内部フラッシュに置くこと", "middle", 10.5, MUT),
], "外付けフラッシュは基板上で誰でも触れる。取り外さなくてもバスを盗聴すれば中身が流れるので、対策は「常時暗号化」しかない")

F["s11_ram"] = SVG(820, 276, [
    T(410, 26, "RAM に残る秘密 — フラッシュを守っても実行中は平文である", "middle", 12.5, INK, True),
    RECT(40, 58, 740, 66, 10, SCR, LIN, 1.3),
    T(60, 80, "RAM 上の鍵", "start", 11, MUT, True),
    RECT(200, 88, 300, 24, 5, ASOFT, ALI, 1.4),
    T(350, 105, "平文の鍵が存在する区間", "middle", 10, ALI, True),
    W(40, 148, 770, 148, c=LIN, lw=1.6),
    D(200, 148, SIG, 5), T(200, 172, "復号／導出", "middle", 10, SIG, True),
    D(350, 148, MUT, 5), T(350, 172, "使用", "middle", 10, MUT),
    D(500, 148, SIG, 5), T(500, 172, "zeroize() で消去", "middle", 10, SIG, True),
    D(700, 148, MUT, 5), T(700, 172, "電源断", "middle", 10, MUT),
    ARR(752, 148, 772, 148, MUT, 1.4),
    T(668, 196, "SRAM の内容はしばらく残る（冷却すると更に伸びる）", "middle", 9.5, FNT),
    BOX(140, 208, 210, 56, "この区間だけが攻撃対象", "デバッガで読む・コールドブート", ALI, ASOFT, INK, 6, 1.4, 10.5, 9),
    ARR(280, 208, 320, 118, ALI, 1.5),
    BOX(470, 208, 300, 56, "対策: 使ったら必ず消す／起動時に SRAM をクリア",
        "タンパー検出時の自動消去があれば更に良い", SIG, SSOFT, INK, 6, 1.4, 10.5, 9),
], "鍵が平文で存在する時間を最短にするのが基本。リセットでは SRAM がクリアされない MCU があるので、起動時のクリアも必要になる")

F["s21_vault"] = SVG(760, 300, [
    T(380, 26, "Secure Vault の 3 段階 — 攻撃者クラスとの対応", "middle", 12.5, INK, True),
    BOX(40, 210, 300, 62, "Secure Vault Base", "セキュアブート（RTSL）・セキュアデバッグアンロック・暗号アクセラレータ",
        LIN, PAN, INK, 8, 1.4, 12, 9.5),
    BOX(40, 138, 300, 62, "Secure Vault Mid", "＋ 専用セキュリティコアによる鍵管理・TRNG・DPA 対策",
        BLU, PAN, INK, 8, 1.5, 12, 9.5),
    BOX(40, 66, 300, 62, "Secure Vault High", "＋ PUF 鍵ラッピング・アンチタンパ・アテステーション・PSA L3",
        SIG, SSOFT, INK, 8, 1.7, 12, 9.5),
    ARR(190, 210, 190, 204, MUT, 1.4), ARR(190, 138, 190, 132, MUT, 1.4),
    BOX(420, 210, 300, 62, "クラス 1〜2", "好奇心・愛好家", LIN, SCR, INK, 8, 1.4, 12, 9.5),
    BOX(420, 138, 300, 62, "クラス 3", "組織的な犯罪者", BLU, SCR, INK, 8, 1.5, 12, 9.5),
    BOX(420, 66, 300, 62, "クラス 4", "潤沢な予算をもつ攻撃者", SIG, SSOFT, INK, 8, 1.7, 12, 9.5),
    ARR(346, 241, 414, 241, MUT, 1.5),
    ARR(346, 169, 414, 169, MUT, 1.5),
    ARR(346, 97, 414, 97, MUT, 1.5),
    T(570, 46, "想定する攻撃者（02 章）", "middle", 11, MUT, True),
    T(190, 46, "製品ライン", "middle", 11, MUT, True),
], "「どこまで守るか」を製品ラインで選べる構造になっている。02 章で決めた攻撃者クラスから品種を降ろせるので、設計者にとって扱いやすい")

F["s21_dlm"] = SVG(860, 250, [
    T(430, 26, "Renesas DLM — 状態遷移に認証が要る", "middle", 12.5, INK, True),
    flowright(20, 96, [("CM", "ルネサス出荷時"), ("SSD", "全デバッグ可"),
                       ("NSECSD", "非セキュア側のみ"), ("DPL", "市場投入")],
              170, 56, 32)[0],
    ARR(80, 130, 80, 160, MUT, 1.4),
    BOX(478, 158, 170, 50, "LCK_DBG", "デバッグを恒久ロック", ALI, ASOFT, INK, 6, 1.4, 11, 9),
    BOX(668, 158, 170, 50, "LCK_BOOT", "ブート I/F もロック", ALI, ASOFT, INK, 6, 1.4, 11, 9),
    ARR(563, 124, 563, 154, MUT, 1.4),
    ARR(648, 183, 664, 183, MUT, 1.4),
    BOX(20, 158, 300, 50, "RMA_REQ / RMA_ACK", "返品分析用 — 鍵を消してから開く", SIG, SSOFT, INK, 6, 1.4, 11, 9),
    RECT(20, 224, 818, 22, 6, SCR, LIN, 1.2),
    T(429, 240, "遷移には DLM キーによる署名が必要——攻撃者が勝手に状態を戻すことはできない", "middle", 10.5, MUT),
], "NSECSD（セキュア開発の後もアプリ開発を続けられる）と RMA（機密を消してから故障解析できる）が、14 章で挙げた実務の悩みへの直接的な回答になっている")

F["s23_levels"] = SVG(840, 350, [
    T(420, 26, "要件から機能へ — 3 つのレベル", "middle", 12.5, INK, True),
    # ピラミッド風
    BOX(140, 248, 560, 74, "レベル A: 基本", "セキュアブート／デバッグ無効化／機器固有鍵／セキュア OTA・ロールバック防止／TLS",
        LIN, PAN, INK, 8, 1.5, 13, 10),
    BOX(190, 158, 460, 74, "レベル B: 標準", "＋ TrustZone による分離／鍵の不可視化／フラッシュ暗号化／認証付きデバッグ／良質な TRNG",
        BLU, PAN, INK, 8, 1.6, 13, 10),
    BOX(250, 68, 340, 74, "レベル C: 高", "＋ DPA・フォールト対策／PUF／独立セキュリティコア／第三者認証",
        SIG, SSOFT, INK, 8, 1.8, 13, 10),
    T(60, 285, "クラス 1〜2", "middle", 11, MUT, True),
    T(60, 302, "規制の最低限", "middle", 9.5, FNT),
    T(110, 195, "クラス 3", "middle", 11, BLU, True),
    T(110, 212, "EU 市場の一般 IoT", "middle", 9.5, FNT),
    T(170, 105, "クラス 4〜5", "middle", 11, SIG, True),
    T(170, 122, "決済・重要インフラ・自動車", "middle", 9.5, FNT),
    ARR(716, 300, 760, 300, LIN, 1.4),
    RECT(20, 332, 800, 0, 0, PAN, PAN, 0),
    T(760, 128, "評価コスト", "middle", 10, MUT, True),
    ARR(760, 296, 760, 146, ALI, 1.8),
    T(760, 316, "低", "middle", 9.5, FNT),
], "「この機能が欲しい」から入ると必ず過不足が出る。02 章で決めた攻撃者クラスからレベルを選び、レベルから必要な機能を降ろすと、必要なものだけが残る")

F["s23_plan"] = SVG(860, 290, [
    T(430, 26, "段階的な導入計画 — 全部を一度にやろうとすると何も進まない", "middle", 12.5, INK, True),
    timeline(50, 800, 78, [(0.0, "第 1〜2 歩", "数週間", SIG),
                           (0.34, "第 3〜4 歩", "1〜4 か月", BLU),
                           (0.66, "第 5〜6 歩", "2〜4 か月＋継続", BLU),
                           (1.0, "第 7〜8 歩", "次期製品以降", MUT)]),
    BOX(30, 132, 216, 76, "既存製品にも適用できる",
        "① EN 303 645 の基本項目\n② 出荷前チェックリスト", SIG, SSOFT, INK, 8, 1.6, 11.5, 9.5),
    BOX(262, 132, 216, 76, "鍵と起動の土台",
        "③ 機器固有鍵の導入\n④ セキュアブート（MCUboot）", BLU, PAN, INK, 8, 1.4, 11.5, 9.5),
    BOX(494, 132, 216, 76, "運用の体制",
        "⑤ セキュア OTA とロールバック防止\n⑥ SBOM と脆弱性管理（CRA の中核）", BLU, PAN, INK, 8, 1.4, 11.5, 9.5),
    BOX(726, 132, 104, 76, "次の世代", "⑦ 分離\n⑧ 物理対策", LIN, PAN, INK, 8, 1.4, 11.5, 9.5),
    RECT(30, 226, 800, 46, 8, SCR, LIN, 1.3),
    T(430, 246, "第 1 歩と第 2 歩は、ハードウェアを変えずに設定とビルド構成の見直しだけで効く", "middle", 11, INK, True),
    T(430, 264, "いま出荷している製品にも今日から適用できる——ここから始めるのが最も費用対効果が高い", "middle", 10, MUT),
], "順番が大事になる。鍵の入れ物（SoC）を決める前に OTA の体制を作っても回らないし、逆に OTA なしでセキュアブートだけ入れても更新できない機器が残る")

F["s03_cra"] = SVG(840, 274, [
    T(420, 26, "CRA（EU サイバーレジリエンス法）の時間軸", "middle", 12.5, INK, True),
    timeline(70, 770, 92, [(0.0, "2024/12", "発効", MUT),
                           (0.46, "2026/09", "報告義務が先行", ALI),
                           (1.0, "2027/12", "主要義務の適用", ALI)]),
    BOX(40, 160, 240, 90, "今日やること",
        "リスクアセスメントを文書化\nSBOM を作れる体制\n開示ポリシーと受付窓口", SIG, SSOFT, INK, 8, 1.5, 11.5, 9.5),
    BOX(300, 160, 240, 90, "2026/09 まで",
        "悪用された脆弱性・重大インシデントを\nENISA / CSIRT へ 24 時間以内に早期警告\n——検知できる仕組みが要る", ALI, PAN, INK, 8, 1.5, 11.5, 9.5),
    BOX(560, 160, 240, 90, "2027/12 まで",
        "既知の脆弱性なしで出荷\nサポート期間（原則 5 年以上）の明示\nその期間、無償で更新を提供", ALI, ASOFT, INK, 8, 1.5, 11.5, 9.5),
    ARR(160, 132, 160, 156, MUT, 1.4),
    ARR(420, 132, 420, 156, ALI, 1.4),
    ARR(680, 132, 680, 156, ALI, 1.4),
], "重いのは出荷時の要件ではなく「サポート期間中ずっと更新を提供する」という継続的な運用義務のほう。13 章と 15 章がそのまま CRA 対応の中身になる。適用日と細目は改訂されるので、判断は必ず規則本文で行う")
