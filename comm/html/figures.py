# -*- coding: utf-8 -*-
"""組み込み通信編の図版（インライン SVG）。色は CSS 変数で指定し、ダーク/ライトの両方で読めるようにする。

章ごとの図は fig/fNN.py に書く（このファイルの関数と F をそのまま使える）。
図の名前は eNN_xxx とし、F["eNN_xxx"] = SVG(...) の形で登録する。
FIGCHECK=1 で実行すると、文字どうしの重なり（概算）を標準エラーに出す。
"""
import math
import os as _os
import sys as _sys

F = {}
_CHECK = bool(_os.environ.get("FIGCHECK"))
_BOXES = []          # 図 1 枚の中の文字の外接矩形（重なり検査用）
_CUR = ["?", 0]      # 検査の表示に使う、いま読んでいる fig ファイルの名前と、その中で何枚目の図か

# ---- 色（CSS 変数） ----
INK = "var(--ink)";  MUT = "var(--muted)";  FNT = "var(--faint)"
LIN = "var(--line)"; PAN = "var(--panel)";  SCR = "var(--screen)"; GRD = "var(--grid)"
SIG = "var(--signal)"; SSOFT = "var(--signal-soft)"      # シリーズの主色（青）: 機器・注目するもの
ALI = "var(--alias)";  ASOFT = "var(--alias-soft)"       # 警告・誤り・失われたもの（赤）
GRN = "var(--green)";  GSOFT = "var(--green-soft)"       # 正常・成功・サーバ側
GLD = "var(--gold)";   GOSOFT = "var(--gold-soft)"       # 中継（AP・ルータ・ゲートウェイ）・時間
PUR = "var(--purple)"; PSOFT = "var(--purple-soft)"      # スマートフォン・アプリ・上位層
TEA = "var(--teal)";   TSOFT = "var(--teal-soft)"        # 補助の色
MSOFT = "var(--muted-soft)"
SOFT = {SIG: SSOFT, ALI: ASOFT, GRN: GSOFT, GLD: GOSOFT, PUR: PSOFT, TEA: TSOFT, MUT: MSOFT, INK: MSOFT}
MONO = "var(--mono)"; SANS = "var(--sans)"

def soft(c):
    """主な色に対応する薄い塗りの色。"""
    return SOFT.get(c, MSOFT)

def E(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ---- 文字の幅の概算（配置と重なり検査に使う） ----
def tw(s, sz=11.5, mono=False):
    w = 0.0
    for ch in str(s):
        o = ord(ch)
        if o < 128:
            w += sz * (0.6 if mono else 0.56)
        elif 0xFF61 <= o <= 0xFF9F:
            w += sz * 0.55
        else:
            w += sz * 1.0
    return w

def SVG(w, h, body, cap=None, name=None):
    """図 1 枚。body は文字列のリスト。cap は図の下の説明文（Markdown のインライン記法は使わない）。"""
    _CUR[1] += 1
    if _CHECK:
        _check_overlap(name or "%s の %d 枚目" % (_CUR[0], _CUR[1]), w, h)
    _BOXES.clear()
    s = ('<figure class="dia"><svg viewBox="0 0 %g %g" width="%g" role="img" '
         'preserveAspectRatio="xMidYMid meet">%s</svg>' % (w, h, w, "".join(body)))
    if cap:
        s += '<figcaption>%s</figcaption>' % cap
    return s + '</figure>'

def _check_overlap(name, w, h):
    bs = _BOXES
    for i in range(len(bs)):
        x0, y0, x1, y1, t = bs[i]
        if x0 < -1 or x1 > w + 1 or y0 < -1 or y1 > h + 1:
            print("FIGCHECK %s: 枠からはみ出す文字 %r (%.0f,%.0f)-(%.0f,%.0f) / 図 %gx%g" % (name, t, x0, y0, x1, y1, w, h), file=_sys.stderr)
        for j in range(i + 1, len(bs)):
            a0, b0, a1, b1, u = bs[j]
            ox = min(x1, a1) - max(x0, a0); oy = min(y1, b1) - max(y0, b0)
            if ox > 1.5 and oy > 2.5:
                print("FIGCHECK %s: 文字の重なり %r と %r" % (name, t, u), file=_sys.stderr)

def T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=False, rot=None):
    """文字。y はベースライン。a は start/middle/end。"""
    if c == LIN:            # 罫線色は文字には薄すぎるので、読める色に寄せる
        c = MUT
    s = str(s)
    if _CHECK and s.strip() and rot is None:
        wdt = tw(s, sz, mono)
        x0 = x - (wdt / 2 if a == "middle" else (wdt if a == "end" else 0))
        _BOXES.append((x0, y - sz * 0.82, x0 + wdt, y + sz * 0.22, s))
    tr = ' transform="rotate(%g %g %g)"' % (rot, x, y) if rot is not None else ""
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s"'
            ' font-family="%s" font-weight="%s"%s>%s</text>'
            % (round(x, 2), round(y, 2), a, sz, c, MONO if mono else SANS, "700" if b else "400", tr, E(s)))

def TLINES(x, y, lines, a="middle", sz=11, c=MUT, b=False, mono=False, lh=None):
    """複数行の文字（lines は文字列のリスト）。"""
    lh = lh or sz * 1.35
    return "".join(T(x, y + i * lh, l, a, sz, c, b, mono) for i, l in enumerate(lines))

def W(*p, **k):
    """折れ線。W(x1, y1, x2, y2, ..., c=色, lw=太さ, dash="4 3")"""
    c = k.get("c", MUT); lw = k.get("lw", 1.5); dash = k.get("dash")
    d = " ".join("%g,%g" % (round(p[i], 2), round(p[i+1], 2)) for i in range(0, len(p), 2))
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<polyline points="%s" fill="none" stroke="%s" stroke-width="%g"'
            ' stroke-linecap="round" stroke-linejoin="round"%s/>' % (d, c, lw, da))

def PL(pts, c=MUT, lw=1.6, dash=None, fill="none", op=None):
    """点の列 [(x, y), ...] の折れ線（fill を指定すると閉じた多角形）。"""
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ' fill-opacity="%g"' % op if op is not None else ""
    tag = "polygon" if fill != "none" else "polyline"
    return ('<%s points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"%s%s/>'
            % (tag, d, fill, c, lw, da, o))

def PATH(d, c=MUT, lw=1.6, fill="none", dash=None, op=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ' fill-opacity="%g"' % op if op is not None else ""
    return '<path d="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linecap="round" stroke-linejoin="round"%s%s/>' % (d, fill, c, lw, da, o)

def RECT(x, y, w, h, r=6, fill=PAN, c=LIN, lw=1.3, dash=None, op=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ' fill-opacity="%g"' % op if op is not None else ""
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" stroke="%s" stroke-width="%g"%s%s/>'
            % (round(x, 2), round(y, 2), round(w, 2), round(h, 2), r, fill, c, lw, da, o))

def CIRC(x, y, r, c=LIN, lw=1.4, fill="none", dash=None):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return '<circle cx="%g" cy="%g" r="%g" fill="%s" stroke="%s" stroke-width="%g"%s/>' % (round(x, 2), round(y, 2), r, fill, c, lw, da)

def D(x, y, c=MUT, r=3.4):
    return '<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (round(x, 2), round(y, 2), r, c)

def _head(x1, y1, x2, y2, c, head):
    a = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 - head * math.cos(a - 0.42), y2 - head * math.sin(a - 0.42))
    p2 = (x2 - head * math.cos(a + 0.42), y2 - head * math.sin(a + 0.42))
    return '<polygon points="%g,%g %g,%g %g,%g" fill="%s"/>' % (round(x2, 2), round(y2, 2), round(p1[0], 2), round(p1[1], 2), round(p2[0], 2), round(p2[1], 2), c)

def ARR(x1, y1, x2, y2, c=MUT, lw=1.6, head=7, dash=None):
    """矢印（終点に矢じり）。"""
    a = math.atan2(y2 - y1, x2 - x1)
    xe, ye = x2 - head * 0.6 * math.cos(a), y2 - head * 0.6 * math.sin(a)
    return W(x1, y1, xe, ye, c=c, lw=lw, dash=dash) + _head(x1, y1, x2, y2, c, head)

def DARR(x1, y1, x2, y2, c=MUT, lw=1.4, head=6):
    """両向きの矢印（寸法線など）。"""
    a = math.atan2(y2 - y1, x2 - x1)
    xs, ys = x1 + head * 0.6 * math.cos(a), y1 + head * 0.6 * math.sin(a)
    xe, ye = x2 - head * 0.6 * math.cos(a), y2 - head * 0.6 * math.sin(a)
    return W(xs, ys, xe, ye, c=c, lw=lw) + _head(x1, y1, x2, y2, c, head) + _head(x2, y2, x1, y1, c, head)

def CARR(x1, y1, x2, y2, bend=0.25, c=MUT, lw=1.5, head=7, dash=None):
    """曲がった矢印。bend は 2 点の距離に対する膨らみの割合（正で進行方向の左へ膨らむ）。"""
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    cx, cy = mx + bend * L * dy / L, my - bend * L * dx / L
    a = math.atan2(y2 - cy, x2 - cx)
    xe, ye = x2 - head * 0.6 * math.cos(a), y2 - head * 0.6 * math.sin(a)
    d = "M%g,%g Q%g,%g %g,%g" % (x1, y1, cx, cy, xe, ye)
    return PATH(d, c=c, lw=lw, dash=dash) + _head(cx, cy, x2, y2, c, head)

_NOLEAD = "。、，．・）」』】〉》”’!?！？,.:;：；"
def _wrap1(s, n):
    out, cur, cw = [], "", 0.0
    for ch in str(s):
        w = 0.56 if ord(ch) < 128 else 1.0
        if cw + w > n and cur and ch not in _NOLEAD:
            out.append(cur); cur, cw = "", 0.0
        cur += ch; cw += w
    if cur:
        out.append(cur)
    return out

def wrap(s, n):
    """1 行 n 文字（全角換算）までで折り返す。行頭に句読点や閉じ括弧が来ないようにし、
    行の長さがなるべくそろうようにする（最後の行に 1〜2 文字だけ残らないように）。"""
    lines = _wrap1(s, n)
    if len(lines) > 1:
        tot = sum(0.56 if ord(ch) < 128 else 1.0 for ch in str(s))
        m = tot / len(lines) + 1.0
        for _ in range(8):
            cand = _wrap1(s, m)
            if len(cand) <= len(lines):
                return cand
            m += 0.5
    return lines

def BOX(x, y, w, h, title=None, sub=None, c=LIN, fill=PAN, tc=INK, r=8, sz=12, ssz=10, lw=1.4, mono=False, dash=None, sc=MUT):
    """角の丸い箱。title は太字、sub は小さい説明（自動で折り返す）。"""
    o = [RECT(x, y, w, h, r, fill, c, lw, dash)]
    lines = wrap(sub, max(4, int((w - 12) / ssz))) if sub else []
    tot = (sz * 1.25 if title else 0) + len(lines) * ssz * 1.3
    yy = y + h / 2 - tot / 2 + sz * 0.95
    if title:
        o.append(T(x + w / 2, yy, title, "middle", sz, tc, True, mono))
        yy += sz * 0.35 + ssz * 1.1
    else:
        yy = y + h / 2 - tot / 2 + ssz * 0.95
    for i, l in enumerate(lines):
        o.append(T(x + w / 2, yy + i * ssz * 1.3, l, "middle", ssz, sc))
    return "".join(o)

def CHIP(x, y, text, c=SIG, sz=10, pad=5, a="start", mono=False):
    """小さな札（色付きの角丸の中に文字）。返り値は (svg, 幅)。"""
    w = tw(text, sz, mono) + pad * 2
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    s = RECT(x0, y - sz - 2, w, sz + 7, 4, soft(c), c, 1.0) + T(x0 + w / 2, y + 1, text, "middle", sz, c, True, mono)
    return s, w

def LEGEND(x, y, items, sz=10, gap=16):
    """凡例。items = [(色, 文字), ...] を横に並べる。返り値は svg 文字列。"""
    o, xx = [], x
    for c, t in items:
        o.append(RECT(xx, y - sz + 1, sz, sz, 2, soft(c), c, 1.2))
        o.append(T(xx + sz + 5, y, t, "start", sz, MUT))
        xx += sz + 5 + tw(t, sz) + gap
    return "".join(o)

def NOTE(x, y, w, lines, c=SIG, sz=10.5):
    """注釈の箱（左に色の帯）。lines は行のリスト。返り値は (svg, 高さ)。"""
    h = len(lines) * sz * 1.4 + 12
    o = [RECT(x, y, w, h, 6, soft(c), "none", 0), RECT(x, y, 3, h, 1, c, "none", 0)]
    for i, l in enumerate(lines):
        o.append(T(x + 10, y + 8 + sz + i * sz * 1.4, l, "start", sz, INK))
    return "".join(o), h

# ---- 寸法・目盛・軸 ----
def DIM(x1, y1, x2, y2, label=None, c=MUT, sz=9.5, off=0, tc=None, above=True):
    """寸法線（両向きの矢印と文字）。水平・垂直のどちらでもよい。"""
    o = [DARR(x1, y1, x2, y2, c=c, lw=1.1, head=5)]
    if label:
        if abs(y2 - y1) < abs(x2 - x1):
            o.append(T((x1 + x2) / 2, (y1 + y2) / 2 + (-5 if above else sz + 3) + off, label, "middle", sz, tc or c))
        else:
            o.append(T((x1 + x2) / 2 + 6 + off, (y1 + y2) / 2 + sz * 0.35, label, "start", sz, tc or c))
    return "".join(o)

def _nice(lo, hi, n=5):
    span = hi - lo
    if span <= 0:
        return [lo]
    raw = span / n
    p = 10 ** math.floor(math.log10(raw))
    step = min((s * p for s in (1, 2, 2.5, 5, 10)), key=lambda s: abs(s - raw))
    k0 = math.ceil(lo / step - 1e-9)
    out, v = [], k0 * step
    while v <= hi + 1e-9 * abs(step):
        out.append(round(v, 10)); v += step
    return out

def fmt_num(v):
    if v == 0:
        return "0"
    a = abs(v)
    if a >= 1e6 and a % 1e6 == 0: return "%gM" % (v / 1e6)
    if a >= 1e4 and a % 1e3 == 0: return "%gk" % (v / 1e3)
    if a >= 1: return ("%.6g" % v)
    return ("%.3g" % v)

class Plot:
    """グラフの座標系。p = Plot(x, y, w, h, (x0, x1), (y0, y1), xlog=False, ylog=False)
    p.X(v), p.Y(v) で座標に直し、p.axes(...) で軸と目盛を描く。"""
    def __init__(self, x, y, w, h, xr, yr, xlog=False, ylog=False):
        self.x, self.y, self.w, self.h = x, y, w, h
        self.xr, self.yr, self.xlog, self.ylog = xr, yr, xlog, ylog
    def _t(self, v, r, log):
        if log:
            return (math.log10(v) - math.log10(r[0])) / (math.log10(r[1]) - math.log10(r[0]))
        return (v - r[0]) / (r[1] - r[0])
    def X(self, v):
        return self.x + self._t(v, self.xr, self.xlog) * self.w
    def Y(self, v):
        return self.y + self.h - self._t(v, self.yr, self.ylog) * self.h
    def axes(self, xl=None, yl=None, xt=None, yt=None, xfmt=None, yfmt=None, grid=True, sz=9.5):
        o = []
        xt = xt if xt is not None else (self._logticks(self.xr) if self.xlog else _nice(*self.xr))
        yt = yt if yt is not None else (self._logticks(self.yr) if self.ylog else _nice(*self.yr))
        for v in xt:
            xx = self.X(v)
            if grid: o.append(W(xx, self.y, xx, self.y + self.h, c=GRD, lw=1))
            o.append(W(xx, self.y + self.h, xx, self.y + self.h + 4, c=MUT, lw=1))
            o.append(T(xx, self.y + self.h + 15, (xfmt or fmt_num)(v), "middle", sz, MUT))
        for v in yt:
            yy = self.Y(v)
            if grid: o.append(W(self.x, yy, self.x + self.w, yy, c=GRD, lw=1))
            o.append(W(self.x - 4, yy, self.x, yy, c=MUT, lw=1))
            o.append(T(self.x - 7, yy + sz * 0.35, (yfmt or fmt_num)(v), "end", sz, MUT))
        o.append(W(self.x, self.y, self.x, self.y + self.h, self.x + self.w, self.y + self.h, c=MUT, lw=1.2))
        if xl: o.append(T(self.x + self.w / 2, self.y + self.h + 31, xl, "middle", sz + 0.5, MUT))
        if yl: o.append(T(self.x - 38, self.y + self.h / 2, yl, "middle", sz + 0.5, MUT, rot=-90))
        return "".join(o)
    def _logticks(self, r):
        lo, hi = math.floor(math.log10(r[0]) + 1e-9), math.ceil(math.log10(r[1]) - 1e-9)
        return [10 ** k for k in range(lo, hi + 1) if r[0] * (1 - 1e-9) <= 10 ** k <= r[1] * (1 + 1e-9)]
    def line(self, pts, c=SIG, lw=2, dash=None):
        return PL([(self.X(a), self.Y(b)) for a, b in pts], c=c, lw=lw, dash=dash)
    def steps(self, pts, c=SIG, lw=2, dash=None):
        """階段状の線（pts の各点から次の点の x まで水平に伸ばす）。"""
        q = []
        for i, (a, b) in enumerate(pts):
            q.append((self.X(a), self.Y(b)))
            if i + 1 < len(pts):
                q.append((self.X(pts[i + 1][0]), self.Y(b)))
        return PL(q, c=c, lw=lw, dash=dash)

def BARS(x, y, w, h, items, vmax=None, fmt=None, sz=10, horizontal=True, label_w=110, bar_h=None, gap=8):
    """棒グラフ。items = [(ラベル, 値, 色), ...]。横棒（既定）は左にラベル、棒の右に値。"""
    vmax = vmax or max(v for _, v, _ in items) or 1
    o = []
    n = len(items)
    if horizontal:
        bh = bar_h or (h - gap * (n - 1)) / n
        for i, (lab, v, c) in enumerate(items):
            yy = y + i * (bh + gap)
            bw = (w - label_w - 60) * v / vmax
            o.append(T(x + label_w - 8, yy + bh / 2 + sz * 0.35, lab, "end", sz, INK))
            o.append(RECT(x + label_w, yy, max(bw, 0.5), bh, 3, soft(c), c, 1.2))
            o.append(T(x + label_w + bw + 6, yy + bh / 2 + sz * 0.35, (fmt or fmt_num)(v), "start", sz, c, True))
    else:
        bw = bar_h or (w - gap * (n - 1)) / n
        for i, (lab, v, c) in enumerate(items):
            xx = x + i * (bw + gap)
            hh = (h - 34) * v / vmax
            o.append(RECT(xx, y + h - 18 - hh, bw, max(hh, 0.5), 3, soft(c), c, 1.2))
            o.append(T(xx + bw / 2, y + h - 18 - hh - 5, (fmt or fmt_num)(v), "middle", sz, c, True))
            o.append(T(xx + bw / 2, y + h - 4, lab, "middle", sz, INK))
    return "".join(o)

# ---- シーケンス図 ----
def seq(lanes, msgs, x=10, y=10, w=640, head_h=30, dy=34, label_sz=10.5, lane_w=None, tail=18):
    """シーケンス図（時間は上から下）。返り値は (svg 文字列, 高さ)。

    lanes: [(名前, 色), ...]  左から順に縦線（ライフライン）を引く。
    msgs:  次の要素のリスト（上から順に描く）。
      (frm, to, ラベル)                     frm から to への矢印（lanes の番号）
      (frm, to, ラベル, {オプション})        c=色, dash=True, lost=True（途中で × 失われる）, sub=2 行目,
                                             dy=この行の高さ, slant=縦に下がる量（時間がかかる送信）
      ("note", lane, 文字, {c=色})           ライフラインの上の注記（箱）
      ("gap", 文字)                          時間の経過（波線と文字）
      ("span", lane, 行の数, 文字, {c=色, side=1/-1})  直前の k 行の範囲を、ライフラインの右（左）に括弧で示す（タイマなど）
      ("space", 高さ)                        空白
    """
    n = len(lanes)
    lw_ = lane_w or (w / n)
    xs = [x + lw_ * (i + 0.5) for i in range(n)]
    o = []
    for i, (name, c) in enumerate(lanes):
        bw = min(lw_ - 10, max(64, tw(name, 11.5) + 18))
        o.append(RECT(xs[i] - bw / 2, y, bw, head_h, 7, soft(c), c, 1.3))
        o.append(T(xs[i], y + head_h / 2 + 4.2, name, "middle", 11.5, c, True))
    yy = y + head_h + 16
    rows = []
    body = []
    for m in msgs:
        if m[0] == "note":
            _, lane, text = m[:3]; op = m[3] if len(m) > 3 else {}
            c = op.get("c", MUT)
            lines = text.split("\n")
            bw = max(tw(l, 10) for l in lines) + 14
            bh = len(lines) * 13.5 + 8
            body.append(RECT(xs[lane] - bw / 2, yy - 6, bw, bh, 5, SCR, "none", 0))   # 下地: ライフラインを透かさない
            body.append(RECT(xs[lane] - bw / 2, yy - 6, bw, bh, 5, soft(c), c, 1.0))
            for k, l in enumerate(lines):
                body.append(T(xs[lane], yy + 6 + k * 13.5, l, "middle", 10, c))
            rows.append(yy); yy += bh + 10
            continue
        if m[0] == "gap":
            text = m[1]
            for xx in xs:
                body.append(W(xx - 6, yy - 3, xx + 6, yy + 3, c=FNT, lw=1.2))
                body.append(W(xx - 6, yy + 3, xx + 6, yy + 9, c=FNT, lw=1.2))
            if text:
                body.append(T(x + w - 2, yy + 7, text, "end", 10, FNT))
            rows.append(yy); yy += 22
            continue
        if m[0] == "space":
            yy += m[1]; continue
        if m[0] == "span":
            _, lane, k, text = m[:4]; op = m[4] if len(m) > 4 else {}
            c = op.get("c", TEA); side = op.get("side", 1)
            y0 = rows[-k] if k <= len(rows) else rows[0]
            y1 = rows[-1] if rows else yy
            xb = xs[lane] + side * 10
            body.append(W(xb, y0, xb + side * 5, y0, xb + side * 5, y1, xb, y1, c=c, lw=1.3))
            lines = text.split("\n")
            for q, l in enumerate(lines):
                body.append(T(xb + side * 9, (y0 + y1) / 2 + 4 + (q - (len(lines) - 1) / 2) * 12.5, l, "start" if side > 0 else "end", 9.5, c))
            continue
        frm, to, label = m[0], m[1], m[2]
        op = m[3] if len(m) > 3 else {}
        c = op.get("c", INK)
        h = op.get("dy", dy)
        sl = op.get("slant", 0)
        x1, x2 = xs[frm], xs[to]
        y1, y2 = yy + 8, yy + 8 + sl
        if frm == to:      # 自分への矢印（処理）
            body.append(PATH("M%g,%g h26 v12 h-20" % (x1, y1), c=c, lw=1.5))
            body.append(_head(x1 + 26, y1 + 12, x1 + 4, y1 + 12, c, 6))
            body.append(T(x1 + 32, y1 + 10, label, "start", label_sz, c))
            rows.append(y1); yy += h + 6
            continue
        if op.get("lost"):
            fx = x1 + (x2 - x1) * op.get("at", 0.62)
            fy = y1 + (y2 - y1) * op.get("at", 0.62)
            body.append(W(x1, y1, fx, fy, c=ALI, lw=1.6, dash="5 3"))
            body.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=2))
            body.append(W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=2))
            c = ALI
        else:
            body.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=7, dash="5 3" if op.get("dash") else None))
        mxm = (x1 + x2) / 2
        lab_y = min(y1, y2) - 5
        body.append(T(mxm, lab_y, label, "middle", label_sz, c, op.get("b", False), op.get("mono", False)))
        if op.get("sub"):
            body.append(T(mxm, max(y1, y2) + 13, op["sub"], "middle", label_sz - 1, MUT, False, op.get("mono", False)))
        rows.append(max(y1, y2))
        yy += h + sl + (10 if op.get("sub") else 0)
    yend = yy + tail - 10
    for i, (name, c) in enumerate(lanes):
        o.append(W(xs[i], y + head_h, xs[i], yend, c=c, lw=1.2, dash="3 4"))
    o.extend(body)
    return "".join(o), yend - y + 6

def SEQFIG(lanes, msgs, cap=None, w=640, **k):
    """シーケンス図を 1 枚の図にする。"""
    s, h = seq(lanes, msgs, x=10, y=12, w=w - 20, **k)
    return SVG(w, h + 20, [s], cap)

# ---- バイト列・ビット列のレイアウト ----
def BYTES(x, y, fields, unit=22, h=34, sz=10, offs=True, maxw=None, label_inside=True):
    """バイト列の区切り図。fields = [(名前, バイト数, 色[, 値の文字列]), ...]。
    1 バイトを unit px で横に並べる（maxw を超えるときは折り返す）。返り値は (svg, 高さ)。"""
    o = []
    xx, yy, off = x, y, 0
    row_h = h + (30 if offs else 18)
    lim = x + (maxw or 10 ** 6)
    for f in fields:
        name, nb, c = f[0], f[1], f[2]
        val = f[3] if len(f) > 3 else None
        wdt = nb * unit
        if xx + wdt > lim + 0.5 and xx > x:
            xx, yy = x, yy + row_h
        o.append(RECT(xx, yy, wdt, h, 4, soft(c), c, 1.3))
        if label_inside:
            if val is not None:
                o.append(T(xx + wdt / 2, yy + h / 2 - 2, name, "middle", sz, c, True))
                o.append(T(xx + wdt / 2, yy + h / 2 + sz + 1, val, "middle", sz - 0.5, INK, False, True))
            else:
                o.append(T(xx + wdt / 2, yy + h / 2 + sz * 0.38, name, "middle", sz, c, True))
        if offs:
            o.append(T(xx + wdt / 2, yy + h + 13, "%d B" % nb if nb >= 1 else "%g B" % nb, "middle", 9, MUT))
        xx += wdt; off += nb
    return "".join(o), (yy - y) + row_h

def BITS(x, y, fields, bit_w=18, h=30, row_bits=32, sz=10, nums=True):
    """ビット単位のヘッダ図（RFC の図のように 1 行 row_bits ビット）。fields = [(名前, ビット数, 色), ...]。
    返り値は (svg, 高さ)。"""
    o = []
    if nums:
        for b in range(row_bits):
            if b % 4 == 0 or b == row_bits - 1:
                o.append(T(x + (b + 0.5) * bit_w, y + 9, str(b), "middle", 8.5, FNT, False, True))
        y0 = y + 14
    else:
        y0 = y
    pos = 0
    for name, nb, c in fields:
        rem = nb
        while rem > 0:
            r, col = divmod(pos, row_bits)
            take = min(rem, row_bits - col)
            xx, yy = x + col * bit_w, y0 + r * h
            o.append(RECT(xx, yy, take * bit_w, h, 3, soft(c), c, 1.2))
            if take * bit_w >= tw(name, sz) + 4:
                o.append(T(xx + take * bit_w / 2, yy + h / 2 + sz * 0.38, name, "middle", sz, c, True))
            pos += take; rem -= take
    rows = (pos + row_bits - 1) // row_bits
    return "".join(o), (y0 - y) + rows * h

def DWAVE(x, y, levels, bit_w=28, h=26, c=SIG, lw=2, labels=None, lsz=9.5, lc=MUT, idle=None):
    """デジタル波形。levels は各ビット時間の 0/1 のリスト。labels は各ビットの下の文字（None で省略）。
    idle=(前の長さ, 後の長さ) で、前後に 1（アイドル）の区間を足す。返り値は svg 文字列。"""
    pts = []
    xx = x
    seq_ = list(levels)
    pre = post = 0
    if idle:
        pre, post = idle
    yl = lambda v: y + (0 if v else h)
    if pre:
        pts += [(xx, yl(1)), (xx + pre, yl(1))]; xx += pre
    prev = 1 if pre else seq_[0]
    for v in seq_:
        if pts and v != prev:
            pts.append((xx, yl(v)))
        elif not pts:
            pts.append((xx, yl(v)))
        pts.append((xx + bit_w, yl(v)))
        xx += bit_w; prev = v
    if post:
        if prev != 1:
            pts.append((xx, yl(1)))
        pts.append((xx + post, yl(1)))
    o = [PL(pts, c=c, lw=lw)]
    if labels:
        for i, t in enumerate(labels):
            if t is not None:
                o.append(T(x + pre + (i + 0.5) * bit_w, y + h + 14, t, "middle", lsz, lc))
    return "".join(o)

def STACK(x, y, w, layers, lh=36, gap=4, sz=11.5, ssz=9.5):
    """積み重ねた層（上から順）。layers = [(名前, 説明, 色), ...]。返り値は (svg, 高さ)。"""
    o = []
    for i, L in enumerate(layers):
        name, sub, c = L[0], L[1], L[2]
        yy = y + i * (lh + gap)
        o.append(RECT(x, yy, w, lh, 6, soft(c), c, 1.3))
        if sub:
            o.append(T(x + 12, yy + lh / 2 + sz * 0.38, name, "start", sz, c, True))
            o.append(T(x + w - 10, yy + lh / 2 + ssz * 0.38, sub, "end", ssz, MUT))
        else:
            o.append(T(x + w / 2, yy + lh / 2 + sz * 0.38, name, "middle", sz, c, True))
    return "".join(o), len(layers) * (lh + gap) - gap

# ---- 状態機械 ----
def STATE(x, y, w, h, name, c=SIG, sub=None, start=False, end=False):
    """状態（角の丸い箱）。(x, y) は中心。start=True で左に開始の黒丸と矢印を付ける。"""
    o = [RECT(x - w / 2, y - h / 2, w, h, h / 2.6, soft(c), c, 1.6 if not end else 2.6)]
    if sub:
        o.append(T(x, y - 1, name, "middle", 11.5, c, True))
        o.append(T(x, y + 13, sub, "middle", 9, MUT))
    else:
        o.append(T(x, y + 4, name, "middle", 11.5, c, True))
    if start:
        o.append(D(x - w / 2 - 34, y, INK, 5))
        o.append(ARR(x - w / 2 - 28, y, x - w / 2 - 2, y, c=INK, lw=1.4, head=6))
    return "".join(o)

def EDGE(x1, y1, x2, y2, label=None, bend=0.0, c=MUT, lw=1.5, sz=9.5, lc=None, loff=(0, 0), dash=None):
    """状態の間の遷移（矢印と文字）。bend で曲げる。label は線の中ほどに置く（loff でずらす）。"""
    if bend:
        s = CARR(x1, y1, x2, y2, bend, c, lw, 7, dash)
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        dx, dy = x2 - x1, y2 - y1
        mx += bend * 0.5 * dy; my -= bend * 0.5 * dx
    else:
        s = ARR(x1, y1, x2, y2, c, lw, 7, dash)
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    if label:
        for i, l in enumerate(label.split("\n")):
            s += T(mx + loff[0], my - 4 + loff[1] + i * (sz + 2), l, "middle", sz, lc or c)
    return s

def SELF(x, y, label=None, c=MUT, r=14, side="top", sz=9.5):
    """自分自身への遷移（状態の上または下の小さな輪）。(x, y) は箱の縁の点。"""
    sgn = -1 if side == "top" else 1
    d = "M%g,%g C%g,%g %g,%g %g,%g" % (x - 10, y, x - 22, y + sgn * 2.4 * r, x + 22, y + sgn * 2.4 * r, x + 10, y + sgn * 1)
    s = PATH(d, c=c, lw=1.4) + _head(x + 16, y + sgn * 12, x + 10, y + sgn * 1, c, 6)
    if label:
        s += T(x, y + sgn * (2.0 * r + 4) + (4 if sgn > 0 else 0), label, "middle", sz, c)
    return s

# ---- 時間軸の上の区間（電流の波形・送受信の時間など） ----
def TIMEBAR(x, y, w, t0, t1, segs, h=26, sz=9.5, axis=True, tfmt=None, ticks=None):
    """横軸を時間 [t0, t1] とした帯。segs = [(開始, 終了, 文字, 色), ...]。返り値は (svg, 高さ)。"""
    X = lambda t: x + (t - t0) / (t1 - t0) * w
    o = [RECT(x, y, w, h, 3, SCR, LIN, 1)]
    for s in segs:
        a, b, lab, c = s[0], s[1], s[2], s[3]
        o.append(RECT(X(a), y, max(X(b) - X(a), 0.8), h, 2, soft(c), c, 1.1))
        if lab and X(b) - X(a) >= tw(lab, sz) + 4:
            o.append(T((X(a) + X(b)) / 2, y + h / 2 + sz * 0.38, lab, "middle", sz, c, True))
    hh = h
    if axis:
        for t in (ticks if ticks is not None else _nice(t0, t1, 6)):
            o.append(W(X(t), y + h, X(t), y + h + 4, c=MUT, lw=1))
            o.append(T(X(t), y + h + 15, (tfmt or fmt_num)(t), "middle", 9, MUT))
        hh += 20
    return "".join(o), hh

# 章ごとの図は fig/fNN.py に置く（このファイルの関数と F をそのまま使える）
import glob as _glob
_SEL = [s for s in _os.environ.get("COMM_FIGS", "").split(",") if s]
for _p in sorted(_glob.glob(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "fig", "f*.py"))):
    if _SEL and _os.path.basename(_p)[1:3] not in _SEL:
        continue
    _CUR[0], _CUR[1] = _os.path.basename(_p), 0
    exec(compile(open(_p, encoding="utf-8").read(), _p, "exec"), globals())
