# -*- coding: utf-8 -*-
"""制御工学編の図版（インライン SVG）。色は CSS 変数で指定し、ダーク/ライトの両方で読めるようにする。

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
        if o < 128 or 0x1E00 <= o <= 0x1EFF:   # 0x1E00〜: ラテン文字の拡張追加（ỹ・ẽ など）は半角と同じ
            w += sz * (0.6 if mono else 0.56)
        elif 0xFF61 <= o <= 0xFF9F:
            w += sz * 0.55
        elif o in (0xB2, 0xB3, 0xB9) or 0x2070 <= o <= 0x209F:   # 上付き・下付きの数字（10⁶ など）は幅が狭い
            w += sz * 0.4
        elif 0x0300 <= o <= 0x036F:   # 結合文字（上の点など）は幅を持たない
            pass
        elif 0x0370 <= o <= 0x03FF:   # ギリシャ文字（ω・ζ・φ など）は半角と同じくらい
            w += sz * 0.6
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

def T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=False, rot=None, halo=False):
    """文字。y はベースライン。a は start/middle/end。halo=True で、図の地の色の縁取りを付け、下を通る線を隠す。"""
    if c == LIN:            # 罫線色は文字には薄すぎるので、読める色に寄せる
        c = MUT
    s = str(s)
    if _CHECK and s.strip() and rot is None:
        wdt = tw(s, sz, mono)
        x0 = x - (wdt / 2 if a == "middle" else (wdt if a == "end" else 0))
        _BOXES.append((x0, y - sz * 0.82, x0 + wdt, y + sz * 0.22, s))
    tr = ' transform="rotate(%g %g %g)"' % (rot, x, y) if rot is not None else ""
    if halo:
        tr += ' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR
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
        if xl: o.append(TX(self.x + self.w / 2, self.y + self.h + 31, xl, "middle", sz + 0.5, MUT))
        if yl: o.append(TX(self.x - 38, self.y + self.h / 2, yl, "middle", sz + 0.5, MUT, rot=-90))
        return "".join(o)
    def _logticks(self, r):
        lo, hi = math.floor(math.log10(r[0]) + 1e-9), math.ceil(math.log10(r[1]) - 1e-9)
        return [10 ** k for k in range(lo, hi + 1) if r[0] * (1 - 1e-9) <= 10 ** k <= r[1] * (1 + 1e-9)]
    def line(self, pts, c=SIG, lw=2, dash=None):
        return PL([(self.X(a), self.Y(b)) for a, b in pts], c=c, lw=lw, dash=dash)
    def clip(self, pts, c=SIG, lw=2, dash=None):
        """枠の外に出る部分を切った折れ線（発散する応答や、目盛より大きい値を描くとき）。枠の境目で線を止める。"""
        x0, x1 = sorted(self.xr); y0, y1 = sorted(self.yr)
        runs, cur = [], []
        for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
            t0, t1, dx, dy = 0.0, 1.0, bx - ax, by - ay
            ok = True
            for p_, q_ in ((-dx, ax - x0), (dx, x1 - ax), (-dy, ay - y0), (dy, y1 - ay)):
                if p_ == 0:
                    if q_ < 0: ok = False; break
                else:
                    r_ = q_ / p_
                    if p_ < 0: t0 = max(t0, r_)
                    else: t1 = min(t1, r_)
            if not ok or t0 > t1:
                if cur: runs.append(cur); cur = []
                continue
            pa = (ax + t0 * dx, ay + t0 * dy); pb = (ax + t1 * dx, ay + t1 * dy)
            if cur and (abs(cur[-1][0] - pa[0]) > 1e-12 * (1 + abs(pa[0])) or abs(cur[-1][1] - pa[1]) > 1e-12 * (1 + abs(pa[1]))):
                runs.append(cur); cur = []
            if not cur: cur = [pa]
            cur.append(pb)
            if t1 < 1.0: runs.append(cur); cur = []
        if cur: runs.append(cur)
        return "".join(self.line(r, c=c, lw=lw, dash=dash) for r in runs if len(r) >= 2)
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
      ("gap", 文字, {lane=k})                時間の経過（波線と文字）。文字は右端に置き、いちばん右のライフラインに
                                             重なるときは右の 2 本の間に置く。lane=k なら k 番と k+1 番の間に置く
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
                op = m[2] if len(m) > 2 else {}
                tw_ = tw(text, 10)
                k = op.get("lane")
                if k is None and n >= 2 and x + w - 2 - tw_ < xs[-1] + 12:
                    k = n - 2          # 右端に置くと、いちばん右のライフラインに重なる
                if k is None:
                    body.append(T(x + w - 2, yy + 7, text, "end", 10, FNT, halo=True))
                else:
                    body.append(T((xs[k] + xs[k + 1]) / 2, yy + 7, text, "middle", 10, FNT, halo=True))
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
        if frm == to:      # 自分への矢印（処理）。右にはみ出すときは左側に描く
            sd = -1 if x1 + 32 + tw(label, label_sz) > x + w - 2 else 1
            body.append(PATH("M%g,%g h%g v12 h%g" % (x1, y1, 26 * sd, -20 * sd), c=c, lw=1.5))
            body.append(_head(x1 + 26 * sd, y1 + 12, x1 + 4 * sd, y1 + 12, c, 6))
            body.append(T(x1 + 32 * sd, y1 + 10, label, "start" if sd > 0 else "end", label_sz, c, halo=True))
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
        # 文字の下に地の色の帯を敷き、文字の後ろを通るほかのライフラインを隠す（帯は矢印より上なので矢印は隠れない）
        lw_ = tw(label, label_sz, op.get("mono", False)) + 6
        body.append(RECT(mxm - lw_ / 2, lab_y - label_sz * 0.85, lw_, label_sz * 1.1, 2, SCR, "none", 0))
        body.append(T(mxm, lab_y, label, "middle", label_sz, c, op.get("b", False), op.get("mono", False), halo=True))
        if op.get("sub"):
            sw_ = tw(op["sub"], label_sz - 1, op.get("mono", False)) + 6
            body.append(RECT(mxm - sw_ / 2, max(y1, y2) + 13 - (label_sz - 1) * 0.85, sw_, (label_sz - 1) * 1.1, 2, SCR, "none", 0))
            body.append(T(mxm, max(y1, y2) + 13, op["sub"], "middle", label_sz - 1, MUT, False, op.get("mono", False), halo=True))
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

# ---- 添字付きの文字・加え合わせ点・線の見本つきの凡例（全章で同じ見た目にする） ----
import re as _re_tx
_TX_RE = None
_TX_SUPSUB_RE = None
def _tx_sup(c, out):
    """上付きの中の添字（"e^{−sT_s}" の T_s など）を ("supsub", 添字) に分けて out に足す。"""
    global _TX_SUPSUB_RE
    if _TX_SUPSUB_RE is None:
        _TX_SUPSUB_RE = _re_tx.compile(r"([A-Za-zα-ωΑ-Ω\u0080-\u024F\u1E00-\u1EFF][\u0300-\u036F]*)_(?:\{([^}]*)\}|([A-Za-z0-9∞%α-ωΑ-Ω]+))")
    pos = 0
    for m in _TX_SUPSUB_RE.finditer(c):
        out.append(("sup", c[pos:m.start()] + m.group(1)))
        out.append(("supsub", m.group(2) if m.group(2) is not None else m.group(3)))
        pos = m.end()
    if pos < len(c) or pos == 0:
        out.append(("sup", c[pos:]))

def _tx_tokens(s):
    """TX の文字列を (種類, 文字) の並びに分ける。種類は "n"（普通）・"sub"・"sup"・"supsub"（上付きの中の添字）・
    "dot1"・"dot2"（上に点 1 つ・2 つ）。添字の前の文字には結合文字（波線 ̃・山形 ̂ など）が付いていてよい（"P̃_0"）。
    _ の後の括弧なしの添字には、英数字のほかギリシャ文字も書ける（"C_θ"）。"""
    global _TX_RE
    if _TX_RE is None:
        _TX_RE = _re_tx.compile(r"\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-\u024F\u1E00-\u1EFF][\u0300-\u036F]*)_\{([^}]*)\}|([A-Za-zα-ωΑ-Ω\u1E00-\u1EFF][\u0300-\u036F]*)_([A-Za-z0-9∞%α-ωΑ-Ω]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)")
    out, pos = [], 0
    for mm in _TX_RE.finditer(s):
        if mm.start() > pos:
            out.append(("n", s[pos:mm.start()]))
        if mm.group(1):
            out.append(("dot2" if mm.group(1) == "ddot" else "dot1", mm.group(2)))
            m2 = _re_tx.match(r"_\{([^}]*)\}|_([A-Za-z0-9∞%α-ωΑ-Ω]+)", s[mm.end():])   # 点の付いた文字の添字（\dot{θ}_m）
            if m2:
                out.append(("sub", m2.group(1) if m2.group(1) is not None else m2.group(2)))
                pos = mm.end() + m2.end()
                continue
        elif mm.group(3) is not None:
            out.append(("n", mm.group(3))); out.append(("sub", mm.group(4)))
        elif mm.group(5) is not None:
            out.append(("n", mm.group(5))); out.append(("sub", mm.group(6)))
        elif mm.group(7) is not None:
            _tx_sup(mm.group(7), out)
        else:
            out.append(("sup", mm.group(8)))
        pos = mm.end()
    if pos < len(s):
        out.append(("n", s[pos:]))
    return out

_TX_SMALL = {"sub": 0.72, "sup": 0.72, "supsub": 0.72 * 0.8}   # 普通の文字に対する大きさ

def TX(x, y, s, a="start", sz=10, c=INK, b=False, halo=False, rot=None):
    """添字・上付き・上の点を含む文字。
    "K_P" "u_0" "ω_gc"（1 文字の後の _ に続く英数字）・"t_{2%}"（_{…} で何でも添字）・"e^{−Ls}" "x^2"（上付き）・
    "\\dot{θ}" "\\ddot{p}"（上に点。結合文字はフォントで位置がずれるので、点を小さな円で描く）。rot は回転の角度（縦軸の題に）。
    "P̃_0"（結合文字の付いた文字の添字）・"C_θ"（ギリシャ文字の添字）・"e^{−sT_s}"（上付きの中の添字）も書ける。"""
    segs = _tx_tokens(s)
    ssz = sz * 0.72
    def wseg(kind, t):
        return tw(t, sz * _TX_SMALL[kind]) if kind in _TX_SMALL else tw(t, sz)
    w = sum(wseg(k, t) for k, t in segs)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK and rot is None:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, s))
    hs = ' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hs)]
    dots, xx, cur = [], x0, 0.0   # cur: 今の基線からのずれ（下が正）
    for kind, t in segs:
        want = 3.0 if kind == "sub" else (-sz * 0.38 if kind == "sup" else (-sz * 0.18 if kind == "supsub" else 0.0))
        dy = want - cur; cur = want
        fs = ' font-size="%g"' % round(sz * _TX_SMALL[kind], 2) if kind in _TX_SMALL else ""
        o.append('<tspan%s%s>%s</tspan>' % ((' dy="%g"' % round(dy, 2)) if abs(dy) > 1e-9 else "", fs, E(t)))
        ww = wseg(kind, t)
        if t.count(" "):   # 点の位置だけは、空白を実際の幅（0.28 字ほど）で数える（文字の配置と重なり検査は今までどおり）
            ww -= t.count(" ") * (sz * _TX_SMALL[kind] if kind in _TX_SMALL else sz) * (0.56 - 0.28)
        if kind in ("dot1", "dot2"):
            cx = xx + ww / 2; cy = y - sz * 0.86; r = max(1.1, sz * 0.11)
            if kind == "dot1": dots.append((cx, cy, r))
            else: dots += [(cx - sz * 0.13, cy, r), (cx + sz * 0.13, cy, r)]
        xx += ww
    o.append("</text>")
    for cx, cy, r in dots:
        o.append('<circle cx="%g" cy="%g" r="%g" fill="%s"/>' % (round(cx, 2), round(cy, 2), round(r, 2), c))
    body = "".join(o)
    if rot is not None:
        return '<g transform="rotate(%g %g %g)">%s</g>' % (rot, round(x, 2), round(y, 2), body)
    return body

def SUMJ(x, y, signs, c=INK, r=15):
    """ブロック線図の加え合わせ点。signs = {"l": "+", "b": "−"}: 矢印が入ってくる側（l・r・t・b）と符号。
    丸を斜めの線で 4 つに区切り、矢印が入る側の区画に符号を書く（01 章と同じ見た目）。"""
    k = r * 0.7071; f = r / 15.0
    o = [CIRC(x, y, r, c=c, lw=1.5, fill=SCR),
         W(x - k, y - k, x + k, y + k, c=MUT, lw=0.9), W(x - k, y + k, x + k, y - k, c=MUT, lw=0.9)]
    pos = {"l": (-8.2, 3.9), "r": (8.2, 3.9), "t": (0, -4.6), "b": (0, 12.4)}
    for side, sg in signs.items():
        dx, dy = pos[side]
        o.append('<text x="%g" y="%g" text-anchor="middle" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="700">%s</text>'
                 % (round(x + dx * f, 2), round(y + (dy - 3.9) * f + 3.9 if side in "lr" else y + dy * f, 2), round(10.5 * f, 2), c, E(sg)))
    return "".join(o)

# ---- ブロック線図の部品（07 章で作ったものを共通にした。見た目は 01 章の線図と同じ） ----
def TXW(s, sz=10):
    """TX で書いた文字の幅（添字・上付きは 0.72 倍の大きさで数える）。"""
    return sum(tw(t, sz * _TX_SMALL[k]) if k in _TX_SMALL else tw(t, sz) for k, t in _tx_tokens(s))

def FRAC(xc, yc, num, den, sz=10.5, c=INK, b=False):
    """分数（xc は中心、yc は横線の高さ）。num・den は TX の書き方の文字。返り値 (svg, 幅)。"""
    w = max(TXW(num, sz), TXW(den, sz)) + 6
    s = (TX(xc, yc - 4, num, "middle", sz, c, b) + W(xc - w / 2, yc, xc + w / 2, yc, c=c, lw=1.0)
         + TX(xc, yc + sz + 1.5, den, "middle", sz, c, b))
    return s, w

def TFBW(s, sz=10.5):
    """伝達関数の箱の幅（中身に合わせる）。s が (分子, 分母) なら分数。"""
    if isinstance(s, tuple):
        return max(40, max(TXW(s[0], sz), TXW(s[1], sz)) + 18)
    return max(40, TXW(s, sz + 1) + 18)

def TFBOX(x, yc, s, w=None, c=LIN, fill=PAN, sz=10.5, h=None):
    """ブロック線図の箱（左端 x、中心の高さ yc）。s が (分子, 分母) なら分数で、文字なら 1 行で書く。返り値 (svg, 幅)。"""
    w = w or TFBW(s, sz)
    if isinstance(s, tuple):
        h = h or 44
        f, _ = FRAC(x + w / 2, yc - 1, s[0], s[1], sz)
        return RECT(x, yc - h / 2, w, h, 6, fill, c, 1.4) + f, w
    h = h or 34
    return RECT(x, yc - h / 2, w, h, 6, fill, c, 1.4) + TX(x + w / 2, yc + (sz + 1) * 0.36, s, "middle", sz + 1, INK), w

def CHAIN(x, yc, items, R=15):
    """横一列のブロック線図。items は左から順に
       ("a", 長さ, 文字, 色)            矢印（文字は矢印の上。None なら書かない）
       ("b", 中身, 名前, 枠の色, 塗り)   箱（中身が (分子, 分母) なら分数。幅は中身に合わせる。枠の色・塗りは省略可）
       ("s", 符号の辞書, 名前)           加え合わせ点（SUMJ。{"l": "+", "b": "−"} など）
       ("t", 名前, 色)                   引き出し点（幅 0）
       ("w", 長さ, 色)                   矢じりの無い線
    返り値 (svg, 位置の辞書, 右端の x)。箱の位置は (左, 右)、加え合わせ点と引き出し点は中心の x。
    戻る線は FBPATH、上から入る外乱は TOPIN、上を通る道は FFPATH で描く。"""
    o, pos = [], {}
    for it in items:
        k = it[0]
        if k == "a":
            L, lab, c = it[1], it[2], it[3]
            o.append(ARR(x, yc, x + L, yc, c=c, lw=1.6))
            if lab:
                o.append(TX(x + L / 2, yc - 8, lab, "middle", 10, c, True, halo=True))
            x += L
        elif k == "b":
            s = it[1]
            c = it[3] if len(it) > 3 else LIN
            fill = it[4] if len(it) > 4 else PAN
            svg, w = TFBOX(x, yc, s, None, c, fill)
            o.append(svg)
            if it[2]:
                pos[it[2]] = (x, x + w)
            x += w
        elif k == "s":
            o.append(SUMJ(x + R, yc, it[1]))
            pos[it[2]] = x + R
            x += 2 * R
        elif k == "t":
            o.append(D(x, yc, it[2] if len(it) > 2 else INK, 3.6))
            pos[it[1]] = x
        elif k == "w":
            o.append(W(x, yc, x + it[1], yc, c=it[2], lw=1.6))
            x += it[1]
    return "".join(o), pos, x

def FBPATH(xf, xt, yc, depth, c=SIG, box=None, bc=LIN, bfill=PAN, R=15, lab=None, lc=None, bh=None):
    """戻る線: 引き出し点 xf から depth だけ下がり、左へ戻って、加え合わせ点（中心 xt）の下から入る。
    box が中身（文字か (分子, 分母)）なら、戻る線の真ん中に箱を置く。lab は線の名前。"""
    yb = yc + depth
    o = [W(xf, yc, xf, yb, c=c, lw=1.5)]
    if box is not None:
        w = TFBW(box)
        xm = (xf + xt) / 2
        o.append(ARR(xf, yb, xm + w / 2, yb, c=c, lw=1.5, head=6))
        o.append(TFBOX(xm - w / 2, yb, box, w, bc, bfill, h=bh)[0])
        o.append(W(xm - w / 2, yb, xt, yb, c=c, lw=1.5))
    else:
        o.append(W(xf, yb, xt, yb, c=c, lw=1.5))
    o.append(ARR(xt, yb, xt, yc + R, c=c, lw=1.5, head=6))
    if lab:
        o.append(TX((xf + xt) / 2 if box is None else xf - 8, yb - 6, lab, "middle" if box is None else "end", 9.5, lc or c, True, halo=True))
    return "".join(o)

def FFPATH(xf, xt, yc, height, c=SIG, box=None, bc=LIN, bfill=PAN, R=15, lab=None, lc=None, bh=None):
    """上を通る道: 引き出し点 xf から height だけ上がり、右へ進んで、加え合わせ点（中心 xt）の上から入る
    （フィードフォワードの道など）。box があれば道の真ん中に箱を置く。"""
    yt = yc - height
    o = [W(xf, yc, xf, yt, c=c, lw=1.5)]
    if box is not None:
        w = TFBW(box)
        xm = (xf + xt) / 2
        o.append(ARR(xf, yt, xm - w / 2, yt, c=c, lw=1.5, head=6))
        o.append(TFBOX(xm - w / 2, yt, box, w, bc, bfill, h=bh)[0])
        o.append(W(xm + w / 2, yt, xt, yt, c=c, lw=1.5))
    else:
        o.append(W(xf, yt, xt, yt, c=c, lw=1.5))
    o.append(ARR(xt, yt, xt, yc - R, c=c, lw=1.5, head=6))
    if lab:
        o.append(TX((xf + xt) / 2, yt - 6, lab, "middle", 9.5, lc or c, True, halo=True))
    return "".join(o)

def TOPIN(x, yc, h, lab, c=PUR, R=15, a="start", dash=None):
    """上から加え合わせ点（中心 x）に入る矢印（外乱・観測ノイズなど）。"""
    o = [ARR(x, yc - h, x, yc - R, c=c, lw=1.6, dash=dash)]
    if lab:
        o.append(TX(x + (8 if a == "start" else -8), yc - h + 10, lab, a, 10, c, True, halo=True))
    return "".join(o)

def CLOOP(Pn, Pd, Cn, Cd):
    """フィードバック系（制御器 C、制御対象 P、負帰還）の閉ループ伝達関数。係数は numpy の並び（高い次から）。
    返り値 (G_yr, G_yd（操作量に入る外乱から制御量）, S（感度関数）)。それぞれ (分子, 分母)。分母はどれも a_P a_C + b_P b_C。"""
    import numpy as _np
    pm, pa = _np.polymul, _np.polyadd
    den = pa(pm(Pd, Cd), pm(Pn, Cn))
    return (pm(Pn, Cn), den), (pm(Pn, Cd), den), (pm(Pd, Cd), den)

def LEGL(x, y, items, sz=10, gap=18):
    """線の見本つきの凡例（横に並べる）。items = [(色, 破線 or None, 文字), ...]。文字には TX の添字が使える。"""
    o, xx = [], x
    for c, dash, t in items:
        o.append(W(xx, y - 4, xx + 24, y - 4, c=c, lw=2.2, dash=dash))
        o.append(TX(xx + 30, y, t, "start", sz, MUT))
        xx += 30 + tw(_re_tx.sub(r"_", "", t), sz) + gap
    return "".join(o)

# ---- 制御の図の補助（s 平面・極と零点・ボード線図）。数値の計算は numpy・scipy を使ってよい（ビルドは python3.13） ----
def SPLANE(p, rhp=True, zeta=None):
    """s 平面の地。p は Plot。右半平面を薄い赤で塗り、実軸・虚軸を引く。zeta=[0.5, 0.7] で減衰比の線（原点からの破線）。"""
    o = []
    x0 = max(p.x, min(p.x + p.w, p.X(0)))
    if rhp and x0 < p.x + p.w:
        o.append(RECT(x0, p.y, p.x + p.w - x0, p.h, 0, soft(ALI), "none", 0))
    for z in (zeta or []):
        th = math.acos(z); R = 2 * max(abs(p.xr[0]), abs(p.yr[0]), abs(p.yr[1]))
        for sg in (1, -1):   # 枠の外へは伸ばさない（枠の境目で切る）
            o.append(p.clip([(0.0, 0.0), (-R * math.cos(th), sg * R * math.sin(th))], c=FNT, lw=1, dash="4 3"))
    if p.yr[0] < 0 < p.yr[1]:
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    if p.xr[0] < 0 < p.xr[1]:
        o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1.4))
    return "".join(o)

def PZ(p, poles=(), zeros=(), c=SIG, r=5.5):
    """極（×）と零点（○）。poles・zeros は複素数の並び。"""
    o = []
    for z in poles:
        x, y = p.X(z.real), p.Y(z.imag)
        o.append(W(x - r, y - r, x + r, y + r, c=c, lw=2.2)); o.append(W(x - r, y + r, x + r, y - r, c=c, lw=2.2))
    for z in zeros:
        o.append(CIRC(p.X(z.real), p.Y(z.imag), r, c=c, lw=2, fill=SCR))
    return "".join(o)

def BODE(x, y, w, curves, wr, dbr, phr, hm=140, hp=110, gap=34, dbt=None, pht=None, xl="角周波数 ω [rad/s]"):
    """ボード線図（上にゲイン [dB]、下に位相 [°]）。curves = [(ω の並び, dB の並び, 位相 [°] の並び, 色, 破線 or None), ...]。
    返り値 (svg の部品の文字列, ゲインの Plot, 位相の Plot, 全体の高さ)。"""
    pm = Plot(x, y, w, hm, wr, dbr, xlog=True)
    pp = Plot(x, y + hm + gap, w, hp, wr, phr, xlog=True)
    o = [pm.axes(yl="ゲイン [dB]", yt=dbt, xfmt=lambda v: ""), pp.axes(yl="位相 [°]", yt=pht, xl=xl)]
    if dbr[0] < 0 < dbr[1]:
        o.append(W(x, pm.Y(0), x + w, pm.Y(0), c=MUT, lw=1.1))
    if phr[0] < -180 < phr[1]:
        o.append(W(x, pp.Y(-180), x + w, pp.Y(-180), c=MUT, lw=1.1, dash="5 3"))
    for ws, db, ph, c, dash in curves:   # 目盛の範囲の外に出る部分は、枠の端に張り付けず、切り落とす
        a = [(wv, d) for wv, d in zip(ws, db) if wr[0] * (1 - 1e-9) <= wv <= wr[1] * (1 + 1e-9)]
        b = [(wv, q) for wv, q in zip(ws, ph) if wr[0] * (1 - 1e-9) <= wv <= wr[1] * (1 + 1e-9)]
        o.append(pm.clip(a, c=c, dash=dash)); o.append(pp.clip(b, c=c, dash=dash))
    return "".join(o), pm, pp, y + hm + gap + hp + 40

def CPLANE(x, y, w, h, xr, yr, xt, yt, unit=True, m1=True, sz=9, lab=True, grid=True):
    """複素平面（ナイキスト線図の地。09 章で作ったものを共通にした）。格子・目盛・実軸と虚軸・単位円（破線）を描く。
    縦と横の目盛の間隔をそろえるには、w/(xr の幅) = h/(yr の幅) にする。m1 は使わない（−1 の点は M1 で描く）。返り値 (svg, Plot)。"""
    p = Plot(x, y, w, h, xr, yr)
    fm = lambda v: ("%g" % v).replace("-", "−")
    o = [RECT(x, y, w, h, 0, SCR, LIN, 0.8)]
    if grid:
        for v in xt:
            o.append(W(p.X(v), y, p.X(v), y + h, c=GRD, lw=1))
        for v in yt:
            o.append(W(x, p.Y(v), x + w, p.Y(v), c=GRD, lw=1))
    for v in xt:
        o.append(W(p.X(v), y + h, p.X(v), y + h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), y + h + 14, fm(v), "middle", sz, MUT))
    for v in yt:
        o.append(W(x - 4, p.Y(v), x, p.Y(v), c=MUT, lw=1))
        o.append(T(x - 6, p.Y(v) + 3.2, fm(v), "end", sz, MUT))
    if yr[0] < 0 < yr[1]:
        o.append(W(x, p.Y(0), x + w, p.Y(0), c=MUT, lw=1))
    if xr[0] < 0 < xr[1]:
        o.append(W(p.X(0), y, p.X(0), y + h, c=MUT, lw=1))
    if unit:
        import numpy as _np
        pts = [(math.cos(a), math.sin(a)) for a in _np.linspace(0, 2 * math.pi, 181)]
        o.append(p.clip(pts, c=FNT, lw=1.1, dash="4 3"))
    if lab:
        o.append(T(x + w - 3, p.Y(0) - 5 if yr[0] < 0 < yr[1] else y + h - 4, "実部", "end", sz, MUT, halo=True))
        o.append(T(p.X(0) + 4 if xr[0] < 0 < xr[1] else x + 4, y + 11, "虚部", "start", sz, MUT, halo=True))
    return "".join(o), p

def M1(p, lab=True, a="above"):
    """複素平面の −1 の点（赤い ×）。p は CPLANE の Plot。"""
    xx, yy = p.X(-1), p.Y(0)
    o = [W(xx - 5, yy - 5, xx + 5, yy + 5, c=ALI, lw=2.2), W(xx - 5, yy + 5, xx + 5, yy - 5, c=ALI, lw=2.2)]
    if lab:
        o.append(T(xx, yy - 9 if a == "above" else yy + 18, "−1", "middle", 10, ALI, True, halo=True))
    return "".join(o)

def CURVEHEAD(p, vals, k, c, head=7):
    """曲線（複素数の並び vals。Plot p の座標）の k 番目の点に、進む向き（番号が増える向き）の矢じりを置く。"""
    a, b = vals[k - 1], vals[k + 1]
    return _head(p.X(a.real), p.Y(a.imag), p.X(b.real), p.Y(b.imag), c, head)

def RLOCUS(a, b, Ks):
    """根軌跡: a(s) + K b(s) = 0 の根を Ks の各 K で求め、枝ごとに並べる（12 章で作ったものを共通にした）。
    a・b は係数の並び（高い次から）。1 つ前の K の根に近い根を同じ枝につなぐ（距離の和が最小になる対応）ので、
    根の順番の入れ替わりで線が飛ばない。返り値は複素数の配列 R[枝, K の番号]。Ks は対数の刻みで細かくとる。"""
    import numpy as _np
    from scipy.optimize import linear_sum_assignment as _lsa
    a = _np.asarray(a, float); b = _np.asarray(b, float)
    rows, prev = [], None
    for K in Ks:
        r = _np.roots(_np.polyadd(a, K * b))
        if prev is not None and len(r) == len(prev):
            i, j = _lsa(_np.abs(prev[:, None] - r[None, :]))
            r = r[j[_np.argsort(i)]]
        rows.append(r); prev = r
    return _np.array(rows).T

def RLBRANCH(p, R, c=SIG, lw=2.0, dash=None):
    """RLOCUS の枝をすべて Plot p に描く（枠の外は切る）。"""
    return "".join(p.clip([(z.real, z.imag) for z in br], c=c, lw=lw, dash=dash) for br in R)

def SIMLOOP(Pn, Pd, Cn, Cd, tEnd, L=0.0, n=20000, r=1.0, d=None, dy=None, noise=None, umin=None, umax=None, every=None):
    """フィードバック系（07 章の基本の形、センサは 1）を時間の刻みで数値計算する（widgets.js の U.ctl.simLoop と同じ計算）。
    制御対象 Pn/Pd（むだ時間 L [s] を含んでよい）、制御器 Cn/Cd（プロパー）。r は目標値（数か t の関数）、d は操作量に入る外乱、
    dy は制御量に入る外乱、noise は観測ノイズ（t, k の関数）、umin・umax は操作量の飽和（積分は止めないので、ワインドアップは起きる）。
    零次ホールドで離散化し、むだ時間は操作量を刻みの数だけ遅らせる（平均 h/2 の遅れが加わるので、h = tEnd/n を十分小さくする）。
    返り値 {"t", "y"（制御量）, "u"（制御器の出力。飽和の後）, "e"（偏差）, "blow"（発散したか）}（numpy の並び。every 刻みごとに記録）。"""
    import numpy as _np
    from scipy import signal as _sg
    h = tEnd / n
    ev = every or max(1, int(round(n / 1000)))
    def _d(num, den):
        num = _np.atleast_1d(_np.asarray(num, dtype=float)); den = _np.atleast_1d(_np.asarray(den, dtype=float))
        A, B, C, D = _sg.tf2ss(num, den)
        if A.shape[0] == 0:
            return None, None, _np.zeros((1, 0)), float(_np.atleast_2d(D)[0, 0])
        Ad, Bd, _, _, _ = _sg.cont2discrete((A, B, C, D), h, method="zoh")
        return Ad, Bd[:, 0], _np.atleast_2d(C)[0], float(_np.atleast_2d(D)[0, 0])
    Apd, Bpd, Cp, Dp = _d(Pn, Pd)
    Acd, Bcd, Cc, Dc = _d(Cn, Cd)
    nd = int(round(L / h))
    if Dp != 0 and nd == 0:
        raise ValueError("SIMLOOP: むだ時間の無い対象は厳密にプロパーにする")
    xp = _np.zeros(0 if Apd is None else Apd.shape[0]); xc = _np.zeros(0 if Acd is None else Acd.shape[0])
    buf = _np.zeros(max(1, nd)); bi = 0
    rf = r if callable(r) else (lambda t, _v=r: _v)
    T, Y, U, E, blow = [], [], [], [], False
    for k in range(n + 1):
        t = k * h
        ua = buf[bi] if nd else 0.0
        y = float(Cp @ xp) if xp.size else 0.0
        if nd:
            y += Dp * ua
        if dy:
            y += dy(t)
        e = rf(t) - (y + (noise(t, k) if noise else 0.0))
        uc = (float(Cc @ xc) if xc.size else 0.0) + Dc * e
        if umax is not None and uc > umax:
            uc = umax
        if umin is not None and uc < umin:
            uc = umin
        uin = uc + (d(t) if d else 0.0)
        if nd:
            buf[bi] = uin; bi = (bi + 1) % nd
        else:
            ua = uin
        if k % ev == 0:
            T.append(t); Y.append(y); U.append(uc); E.append(e)
        if not _np.isfinite(y) or abs(y) > 1e9:
            blow = True
            break
        if xc.size:
            xc = Acd @ xc + Bcd * e
        if xp.size:
            xp = Apd @ xp + Bpd * ua
    return {"t": _np.array(T), "y": _np.array(Y), "u": _np.array(U), "e": _np.array(E), "blow": blow}

def SMAX(num, den, delay=0.0, wlo=1e-4, whi=1e5):
    """感度関数のゲインの最大値 Ms = max |1/(1 + L(jω))| と、その角周波数 (Ms, ω)。1/Ms はナイキスト線図の −1 から L(jω) までの最短距離。
    L = num/den·e^{−delay·s}（U.ctl.smax と同じ計算）。"""
    import numpy as _np
    from scipy.optimize import minimize_scalar as _ms
    f = lambda w: 1.0 / abs(1 + _np.polyval(num, 1j * w) / _np.polyval(den, 1j * w) * _np.exp(-1j * w * delay))
    ws = _np.logspace(_np.log10(wlo), _np.log10(whi), 4000)
    vals = _np.array([f(w) for w in ws]); i = int(vals.argmax())
    lo, hi = _np.log(ws[max(0, i - 1)]), _np.log(ws[min(len(ws) - 1, i + 1)])
    res = _ms(lambda x: -f(_np.exp(x)), bounds=(lo, hi), method="bounded", options={"xatol": 1e-10})
    wm = float(_np.exp(res.x)); Ms = max(vals[i], f(wm))
    return float(Ms), (wm if f(wm) >= vals[i] else float(ws[i]))

def BODEPH(num, den, ws, delay=0.0):
    """伝達関数 num/den（係数は高い次から。むだ時間 delay [s] を掛けたもの）のゲイン [dB] と位相 [°] の並び。
    位相は連続につなぎ、始まりを因数ごとの位相の和にそろえる（widgets.js の U.ctl.bode と同じ約束）:
    積分 1 つなら −90° から、負の定数なら −180° から、右半平面の零点・むだ時間は位相を遅らせる側に描く。"""
    import numpy as _np
    ws = _np.asarray(ws, dtype=float)
    g = _np.polyval(num, 1j * ws) / _np.polyval(den, 1j * ws)
    db = 20 * _np.log10(_np.abs(g))
    ph = _np.degrees(_np.unwrap(_np.angle(g)))
    n = list(_np.trim_zeros(_np.atleast_1d(_np.asarray(num, dtype=float)), "f"))
    d = list(_np.trim_zeros(_np.atleast_1d(_np.asarray(den, dtype=float)), "f"))
    N = 0
    while len(d) > 1 and d[-1] == 0:
        d.pop(); N += 1
    while len(n) > 1 and n[-1] == 0:
        n.pop(); N -= 1
    ref = (-_np.pi if n[-1] / d[-1] < 0 else 0.0) - N * _np.pi / 2
    jw = 1j * ws[0]
    for z in (_np.roots(n) if len(n) > 1 else []):
        ref += _np.angle(1 - jw / z)
    for p_ in (_np.roots(d) if len(d) > 1 else []):
        ref -= _np.angle(1 - jw / p_)
    ph = ph + 360.0 * round((_np.degrees(ref) - ph[0]) / 360.0)
    return db, ph - _np.degrees(ws * delay)

# 章ごとの図は fig/fNN.py に置く（このファイルの関数と F をそのまま使える）
import glob as _glob
_SEL = [s for s in _os.environ.get("CONTROL_FIGS", "").split(",") if s]
for _p in sorted(_glob.glob(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "fig", "f*.py"))):
    if _SEL and _os.path.basename(_p)[1:3] not in _SEL:
        continue
    _CUR[0], _CUR[1] = _os.path.basename(_p), 0
    exec(compile(open(_p, encoding="utf-8").read(), _p, "exec"), globals())
