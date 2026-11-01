# -*- coding: utf-8 -*-
# 07 章 眠らせ方と起こし方 の図

# ---- 補助: 記号・回路の部品 ----
def _f07_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    for s, sub, it in parts:
        o.append('<tspan font-style="%s">%s</tspan>' % ("italic" if it else "normal", E(s)))
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan><tspan dy="-3"></tspan>' % (sz * 0.72, E(sub)))
    o.append("</text>")
    return "".join(o)

def _f07_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    """横向きの抵抗（ぎざぎざ）。"""
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f07_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6):
    """縦向きの抵抗。"""
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw)

def _f07_gnd(x, y, c=MUT):
    """GND の記号。y は線の上端。"""
    return W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6) + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2)

def _f07_vdd(x, y, label="3.0 V", c=GLD):
    """電源の記号（上向きの短い横線と文字）。y は線の下端。"""
    return W(x, y, x, y - 8, c=c, lw=1.5) + W(x - 9, y - 8, x + 9, y - 8, c=c, lw=1.8) + T(x, y - 13, label, "middle", 9.5, c, True)

def _f07_swv(x, y1, y2, closed, c=INK):
    """縦向きのスイッチ（y1 から y2 へ）。"""
    ym1, ym2 = y1 + (y2 - y1) * 0.3, y1 + (y2 - y1) * 0.7
    o = W(x, y1, x, ym1, c=c, lw=1.5) + W(x, ym2, x, y2, c=c, lw=1.5) + D(x, ym1, c, 2.4) + D(x, ym2, c, 2.4)
    if closed:
        o += W(x, ym1, x + 1, ym2, c=c, lw=1.8)
    else:
        o += W(x, ym2, x + 11, ym1 + 2, c=c, lw=1.8)
    return o

def _f07_diode_up(x, y, c=INK, s=6):
    """上向き（下から上へ電流を通す）のダイオード。(x, y) は三角の先（上）。"""
    return (PL([(x - s, y + 1.6 * s), (x + s, y + 1.6 * s), (x, y)], c=c, lw=1.3, fill=soft(c))
            + W(x - s, y, x + s, y, c=c, lw=1.8))

def _f07_q(v, d=3):
    s = ("%.*f" % (d, v)).rstrip("0").rstrip(".")
    return s

def _f07_legm(x, y, items, sz=10, gap=16):
    """凡例（文字に添字を使える）。items = [(色, parts), ...]、parts は _f07_m と同じ形。"""
    o, xx = [], x
    for c, parts in items:
        o.append(RECT(xx, y - sz + 1, sz, sz, 2, soft(c), c, 1.2))
        o.append(_f07_m(xx + sz + 5, y, parts, "start", sz, MUT))
        xx += sz + 5 + sum(tw(a, sz) + (tw(b, sz * 0.72) if b else 0) for a, b, _ in parts) + gap
    return "".join(o)

# ---- 例の値（本文と同じ） ----
_F07_IRUN = 3e-3
# (名前, 眠りの電流 [A], 起床時間 [s], 色)
_F07_ST = [("軽い眠り", 0.5e-3, 1e-6, SIG), ("深い眠り", 2e-6, 20e-6, TEA), ("最も深い眠り", 0.4e-6, 2e-3, PUR)]

def _f07_qw(i):
    nm, I, t, c = _F07_ST[i]
    return (_F07_IRUN - I) * t          # 起床の電荷 [C]

def _f07_tbe(a, b):
    return (_f07_qw(b) - _f07_qw(a)) / (_F07_ST[a][1] - _F07_ST[b][1])

def _f07_fmt_i(A):
    a = abs(A)
    if a >= 1e-3:
        return "%s mA" % _f07_q(A * 1e3, 2)
    if a >= 1e-6:
        return "%s µA" % _f07_q(A * 1e6, 2)
    return "%s nA" % _f07_q(A * 1e9, 1)

def _f07_fmt_t(s):
    a = abs(s)
    if a >= 1:
        return "%s s" % _f07_q(s, 2)
    if a >= 1e-3:
        return "%s ms" % _f07_q(s * 1e3, 2)
    return "%s µs" % _f07_q(s * 1e6, 1)

# ---- 1 節: 段階ごとに動くもの ----
def _f07_keep():
    o = []
    cols = ["動作", "軽い眠り", "深い眠り", "最も深い眠り"]
    ccol = [INK, SIG, TEA, PUR]
    rows = ["CPU", "速いクロック", "速いクロックで動く周辺回路", "遅いクロックで動く周辺回路", "RAM", "レジスタ（CPU・周辺回路の設定）", "遅いクロック・RTC", "起こすためのピンの見張り"]
    ST = {"g": ("動く", GRN), "k": ("止まる・中身は保つ", GLD), "s": ("止まる", MUT), "x": ("消える", ALI)}
    grid = [["g", "k", "k", "x"], ["g", "g", "s", "s"], ["g", "g", "k", "x"], ["g", "g", "g", "x"],
            ["g", "g", "k", "x"], ["g", "g", "k", "x"], ["g", "g", "g", "g"], ["g", "g", "g", "g"]]
    sub = {(4, 3): "保持用の RAM だけ残る", (7, 3): "決まったピンだけ"}
    x0, cw, y0, rh = 222, 118, 34, 31
    for j, (nm, c) in enumerate(zip(cols, ccol)):
        o.append(T(x0 + j * cw + cw / 2, y0 - 10, nm, "middle", 11.5, c, True))
    for i, nm in enumerate(rows):
        y = y0 + i * rh
        o.append(T(x0 - 10, y + rh / 2 + 4, nm, "end", 10, INK))
        for j in range(4):
            lab, c = ST[grid[i][j]]
            o.append(RECT(x0 + j * cw + 3, y + 2, cw - 6, rh - 4, 4, soft(c), c, 1.0))
            if (i, j) in sub:
                o.append(T(x0 + j * cw + cw / 2, y + 13, lab, "middle", 9.5, c, True))
                o.append(T(x0 + j * cw + cw / 2, y + 25, sub[(i, j)], "middle", 8.5, INK))
            else:
                o.append(T(x0 + j * cw + cw / 2, y + rh / 2 + 4, lab, "middle", 9.5, c, True))
    y = y0 + len(rows) * rh + 8
    o.append(T(x0 - 10, y + 16, "起きた後の実行", "end", 10, INK, True))
    after = ["—", "眠った命令の次から", "眠った命令の次から", "最初から（リセットと同じ）"]
    for j, a in enumerate(after):
        o.append(RECT(x0 + j * cw + 3, y + 1, cw - 6, rh - 4, 4, PAN, LIN, 1.0))
        o.append(T(x0 + j * cw + cw / 2, y + 18, a, "middle", 9 if j == 3 else 9.5, ALI if j == 3 else INK, j == 3))
    yl = y + rh + 18
    o.append(LEGEND(14, yl, [(GRN, "動く"), (GLD, "止まるが中身は保つ"), (MUT, "止まる"), (ALI, "電源が切れて中身が消える")], gap=14))
    return SVG(700, yl + 10, o, "低消費電力モードの 3 つの段階で、マイコンの中の何が動き、何が止まるか（代表的な分け方。実際は製品ごとに違う）。深い段階ほど止まるものが増え、最も深い眠りでは RAM とレジスタの中身が消えるので、起きると最初から実行し直す。")
F["e07_keep"] = _f07_keep()

# ---- 1 節: 電流と起床時間の階段 ----
def _f07_ladder():
    o = []
    p = Plot(104, 22, 390, 236, (1e-7, 1e-2), (1e-7, 1e-2), xlog=True, ylog=True)
    xf = {1e-7: "0.1 µs", 1e-6: "1 µs", 1e-5: "10 µs", 1e-4: "100 µs", 1e-3: "1 ms", 1e-2: "10 ms"}
    yf = {1e-7: "0.1 µA", 1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA", 1e-2: "10 mA"}
    o.append(p.axes(xl="起床時間（対数目盛）", xt=sorted(xf), yt=sorted(yf), xfmt=lambda v: xf[v], yfmt=lambda v: yf[v]))
    o.append(T(24, p.y + p.h / 2, "眠っている間の電流（対数目盛）", "middle", 10, MUT, rot=-90))
    # 代表値の範囲
    rng = [((0.5e-6, 2e-6), (0.2e-3, 3e-3)), ((3e-6, 60e-6), (1e-6, 15e-6)), ((0.2e-3, 5e-3), (0.1e-6, 1e-6))]
    for (nm, I, t, c), ((xa, xb), (ya, yb)) in zip(_F07_ST, rng):
        o.append(RECT(p.X(xa), p.Y(yb), p.X(xb) - p.X(xa), p.Y(ya) - p.Y(yb), 4, soft(c), c, 1.0, dash="4 3"))
    # 動作
    o.append(p.line([(1e-7, 3e-3), (1e-2, 3e-3)], c=MUT, lw=1.3, dash="6 4"))
    o.append(T(p.X(1.3e-7), p.Y(3e-3) - 6, "動作 3 mA", "start", 9.5, MUT, True, halo=True))
    # 例の値の点と線
    pts = [(t, I) for nm, I, t, c in _F07_ST]
    o.append(p.line(pts, c=FNT, lw=1.2, dash="3 3"))
    lab = [("軽い眠り", "0.5 mA・1 µs", 10, -10, "start"), ("深い眠り", "2 µA・20 µs", 12, -6, "start"), ("最も深い眠り", "0.4 µA・2 ms", -12, -8, "end")]
    for (nm, I, t, c), (n2, v, dx, dy, a) in zip(_F07_ST, lab):
        o.append(D(p.X(t), p.Y(I), c, 5))
        o.append(T(p.X(t) + dx, p.Y(I) + dy, nm, a, 10, c, True, halo=True))
        o.append(T(p.X(t) + dx, p.Y(I) + dy + 13, v, a, 9.5, c, False, halo=True))
    # 右の説明
    xr = 520
    o.append(T(xr, 40, "深い段階ほど", "start", 11, INK, True))
    items = [("眠っている間の電流は小さい", GRN), ("起床時間は長い", ALI), ("止まって使えないものが増える", ALI), ("最も深い眠りでは RAM が消え、", ALI), ("起きると最初から実行する", ALI)]
    for k, (s, c) in enumerate(items):
        o.append(T(xr, 62 + k * 17, ("・" if k != 4 else "　") + s, "start", 9.5, c))
    o.append(LEGEND(14, 316, [(SIG, "軽い眠り"), (TEA, "深い眠り"), (PUR, "最も深い眠り")], gap=14))
    o.append(T(300, 316, "点はこの章の例の値、破線の枠は代表値の範囲", "start", 9.5, MUT))
    return SVG(700, 326, o, "眠りの段階ごとの、眠っている間の電流と起床時間（両軸とも対数目盛）。深い段階ほど電流は小さいが、起床時間は長い。点はこの章の計算に使う例の値で、破線の枠は代表値の範囲（製品によって 1 桁以上違う）。")
F["e07_ladder"] = _f07_ladder()

# ---- 2 節: 起床要因と段階 ----
def _f07_wake():
    o = []
    cols = [("軽い眠り", SIG), ("深い眠り", TEA), ("最も深い眠り", PUR)]
    rows = [("RTC", "決めた時刻・周期", GLD, "ooo"), ("ピンの変化（起こせると決まったピン）", "扉・ボタン・センサの割り込み", TEA, "ooo"),
            ("ピンの変化（ほかのピン）", "製品によって使えない", TEA, "oo-"),
            ("遅いクロックで動く周辺回路", "タイマ・コンパレータなど", SIG, "oo-"),
            ("速いクロックで動く周辺回路", "通信の受信・ADC など", SIG, "o--")]
    MK = {"o": ("○ 起こせる", GRN), "-": ("× 起こせない", MUT)}
    x0, cw, y0, rh = 300, 130, 40, 40
    for j, (nm, c) in enumerate(cols):
        o.append(T(x0 + j * cw + cw / 2, y0 - 12, nm, "middle", 11.5, c, True))
    for i, (nm, sub, c, mk) in enumerate(rows):
        y = y0 + i * rh
        o.append(RECT(14, y + 3, 6, rh - 6, 2, c, "none", 0))
        o.append(T(28, y + 17, nm, "start", 10, INK, True))
        o.append(T(28, y + 32, sub, "start", 9, MUT))
        for j in range(3):
            k = mk[j]
            lab, cc = MK[k]
            if i == 2 and j == 2:
                lab, cc = ("△ 製品による", GLD)
            o.append(RECT(x0 + j * cw + 4, y + 4, cw - 8, rh - 8, 4, soft(cc), cc, 1.0))
            o.append(T(x0 + j * cw + cw / 2, y + rh / 2 + 4, lab, "middle", 10, cc, True))
    y = y0 + len(rows) * rh + 22
    o.append(T(14, y, "最も深い眠りから起きると、最初から実行する。起動の直後に、リセットの原因と起床要因を読んで仕事を分ける。", "start", 9.5, INK))
    o.append(T(14, y + 17, "起床時間の間に届いた信号（通信のデータ・リモコンの信号の始まり）は受け取れない。", "start", 9.5, INK))
    return SVG(700, y + 26, o, "起床要因と、それで起こせる段階（代表的な例。どのピン・どの周辺回路で起こせるかは製品ごとに違うので、データシートで確かめる）。深い段階ほど、使える起床要因が減る。")
F["e07_wake"] = _f07_wake()

# ---- 2 節: 起こし方の 2 つの失敗 ----
def _f07_race():
    o = []
    x0, x1 = 150, 680
    rows = [("(a) 古い印が残っている", "すぐに起き、眠れない", ALI),
            ("(b) 割り込みを止めずに判定", "仕事が次の起床要因まで待たされる", ALI),
            ("(c) 割り込みを止めて判定", "すぐに起きて仕事をする", GRN)]
    hh = 22
    for k, (title, res, rc) in enumerate(rows):
        y = 30 + k * 112
        o.append(T(14, y + 2, title, "start", 11, INK, True))
        o.append(T(14, y + 19, res, "start", 9.5, rc, True))
        yl = y + 34
        o.append(T(x0 - 8, yl + 15, "プログラム", "end", 9.5, SIG))
        o.append(T(x0 - 8, yl + hh + 29, "割り込み", "end", 9.5, GLD))
        o.append(W(x0, yl + hh + 24, x1, yl + hh + 24, c=FNT, lw=1))
        def seg(xa, xb, lab, c, dash=None):
            o.append(RECT(xa, yl, xb - xa, hh, 3, soft(c), c, 1.1, dash=dash))
            if lab and xb - xa >= tw(lab, 9) + 4:
                o.append(T((xa + xb) / 2, yl + 15, lab, "middle", 9, c, True))
        if k == 0:
            xx = x0
            for r in range(5):
                seg(xx, xx + 40, "判定" if r == 0 else "判定", TEA)
                seg(xx + 40, xx + 52, "", GRN)
                o.append(ARR(xx + 52, yl + hh + 20, xx + 52, yl + hh + 2, c=ALI, lw=1.4, head=5))
                xx += 60
            o.append(T(xx + 6, yl + 15, "…（いつまでも繰り返す）", "start", 9.5, ALI, True))
            o.append(T(x0 + 2, yl + hh + 40, "古い印のため、眠りに入るとすぐ起きる", "start", 9, ALI))
        elif k == 1:
            seg(x0, x0 + 70, "判定: 印なし", TEA)
            seg(x0 + 70, x0 + 96, "", MUT)
            seg(x0 + 96, x1 - 70, "眠る（印は立っているのに）", ALI)
            seg(x1 - 70, x1, "仕事", SIG)
            xa = x0 + 80
            o.append(ARR(xa, yl + hh + 22, xa, yl + hh + 2, c=GLD, lw=1.6, head=6))
            o.append(T(xa + 6, yl + hh + 40, "判定の直後に割り込み → ハンドラが印を立てる", "start", 9, GLD))
            o.append(ARR(x1 - 70, yl + hh + 22, x1 - 70, yl + hh + 2, c=MUT, lw=1.4, head=5))
            o.append(T(x1 - 74, yl + hh + 40, "次の起床要因（例 1 分後の RTC）", "end", 9, MUT))
        else:
            o.append(RECT(x0, yl - 4, 104, hh + 8, 3, MSOFT, "none", 0))
            seg(x0, x0 + 70, "判定: 印なし", TEA)
            seg(x0 + 70, x0 + 96, "", GRN)
            seg(x0 + 104, x0 + 160, "ハンドラ", GLD)
            seg(x0 + 160, x0 + 230, "判定: 印あり", TEA)
            seg(x0 + 230, x0 + 300, "仕事", SIG)
            xa = x0 + 80
            o.append(ARR(xa, yl + hh + 22, xa, yl + hh + 2, c=GLD, lw=1.6, head=6))
            o.append(T(x0 + 52, yl - 8, "割り込みを止めている間", "middle", 9, MUT))
            o.append(T(xa + 6, yl + hh + 40, "要求が来たので眠りから戻る（ハンドラは、割り込みを戻すまで待たされる）", "start", 9, GLD))
    yb = 30 + 3 * 112 + 8
    o.append(LEGEND(14, yb, [(TEA, "印の判定"), (GRN, "眠り（短い）"), (ALI, "誤った眠り"), (SIG, "仕事"), (GLD, "割り込みの要求")], gap=12))
    return SVG(700, yb + 10, o, "起床要因の扱いの 2 つの失敗と、正しい方法。(a) 古い要求の印が残っていると、眠ってもすぐに起きる。(b) 判定と眠りの間に割り込みが来ると、印が立っているのに眠ってしまう。(c) 割り込みを止めて判定し、止めたまま眠れば、来た要求で眠りから戻り、割り込みを戻した所でハンドラが動く。")
F["e07_race"] = _f07_race()

# ---- 3 節: 浮いた入力 ----
def _f07_float():
    o = []
    o.append(T(14, 20, "(a) 入力の回路", "start", 11, INK, True))
    o.append(T(250, 20, "(b) 入力の電圧と、入力の回路の電流（例）", "start", 11, INK, True))
    # (a) 2 つのトランジスタ
    xc = 130
    o.append(_f07_vdd(xc, 50))
    o.append(W(xc, 50, xc, 62, c=INK, lw=1.5))
    o.append(RECT(xc - 52, 62, 104, 34, 5, SSOFT, SIG, 1.2))
    o.append(T(xc, 77, "トランジスタ", "middle", 9.5, SIG, True))
    o.append(T(xc, 90, "L で入る", "middle", 9, INK))
    o.append(W(xc, 96, xc, 128, c=INK, lw=1.5))
    o.append(D(xc, 112, INK, 2.6))
    o.append(W(xc, 112, xc + 70, 112, c=INK, lw=1.4))
    o.append(T(xc + 74, 108, "読む回路へ", "start", 9, MUT))
    o.append(RECT(xc - 52, 128, 104, 34, 5, SSOFT, SIG, 1.2))
    o.append(T(xc, 143, "トランジスタ", "middle", 9.5, SIG, True))
    o.append(T(xc, 156, "H で入る", "middle", 9, INK))
    o.append(W(xc, 162, xc, 176, c=INK, lw=1.5) + _f07_gnd(xc, 176))
    # ピン
    o.append(RECT(14, 104, 16, 16, 2, PAN, INK, 1.2))
    o.append(T(22, 136, "ピン", "middle", 9.5, INK))
    o.append(W(30, 112, 56, 112, c=INK, lw=1.4))
    o.append(W(56, 79, 56, 145, c=INK, lw=1.4))
    o.append(W(56, 79, xc - 52, 79, c=INK, lw=1.4))
    o.append(W(56, 145, xc - 52, 145, c=INK, lw=1.4))
    # 貫通電流
    o.append(ARR(xc + 64, 60, xc + 64, 168, c=ALI, lw=2, head=7))
    o.append(T(xc + 72, 140, "貫通電流", "start", 9.5, ALI, True))
    o.append(T(14, 204, "入力が中ほどの電圧だと、2 つが", "start", 9, INK))
    o.append(T(14, 217, "両方とも半ば入り、電流が流れ続ける", "start", 9, INK))
    # (b) グラフ
    p = Plot(290, 40, 160, 150, (0, 3.0), (0, 100))
    o.append(RECT(p.X(0.9), p.y, p.X(2.1) - p.X(0.9), p.h, 0, ASOFT, "none", 0, op=0.6))
    o.append(p.axes(xt=[0, 0.9, 1.5, 2.1, 3.0], yt=[0, 50, 100], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "入力の電圧 [V]", "middle", 9.5, MUT))
    o.append(T(p.x - 30, p.y + p.h / 2, "電流 [µA]", "middle", 9.5, MUT, rot=-90))
    pts = [(v / 100 * 3.0, 100 * math.exp(-((v / 100 * 3.0 - 1.5) / 0.38) ** 2)) for v in range(101)]
    o.append(p.line(pts, c=ALI, lw=2.2))
    o.append(T(p.X(0.45), p.Y(88), "L と読む", "middle", 9, MUT, True))
    o.append(T(p.X(2.55), p.Y(88), "H と読む", "middle", 9, MUT, True))
    o.append(T(p.X(1.5), p.Y(108), "決まらない", "middle", 9, ALI, True))
    o.append(T(p.X(0.9), p.y + p.h + 44, "", "middle", 9, MUT))
    # (c) 浮いた入力の電圧のふらつき
    o.append(T(480, 20, "(c) 浮いた入力の電圧（例）", "start", 11, INK, True))
    q = Plot(510, 40, 175, 150, (0, 60), (0, 3.0))
    o.append(q.axes(xt=[0, 20, 40, 60], yt=[0, 0.9, 2.1, 3.0], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(q.x + q.w / 2, q.y + q.h + 30, "時間 [s]", "middle", 9.5, MUT))
    o.append(W(q.x, q.Y(0.9), q.x + q.w, q.Y(0.9), c=MUT, lw=1, dash="3 3"))
    o.append(W(q.x, q.Y(2.1), q.x + q.w, q.Y(2.1), c=MUT, lw=1, dash="3 3"))
    f = lambda t: 1.55 + 0.75 * math.sin(0.13 * t + 0.4) + 0.32 * math.sin(0.47 * t + 1.1) + 0.12 * math.sin(1.7 * t)
    ts = [k * 0.25 for k in range(241)]
    o.append(q.line([(t, f(t)) for t in ts], c=ALI, lw=1.8))
    st = f(0) > 2.1
    for t in ts[1:]:
        v = f(t)
        if (v > 2.1 and not st) or (v < 0.9 and st):
            st = not st
            o.append(D(q.X(t), q.Y(v), GLD, 3.6))
    o.append(T(q.x + q.w, q.y - 6, "● 読む値が変わる（起きる）", "end", 9, GLD, True))
    o.append(T(480, 237, "中ほどにある間は (b) の電流が流れ続ける", "start", 9, INK))
    return SVG(700, 246, o, "浮いた入力。(a) 入力の回路は 2 つのトランジスタを直列にしたもので、入力が中ほどの電圧だと電源から GND へ貫通電流が流れる。(b) 電流は入力の電圧が中ほどのときに最も大きい（形と値は例。製品と電源の電圧で大きく違う）。(c) 浮いた入力の電圧はふらつき、しきい値をまたぐたびに読む値が変わって、ピンで起こす設定ならマイコンが起きる。")
F["e07_float"] = _f07_float()

# ---- 3 節: プルアップ抵抗の上限と、読み方の工夫 ----
def _f07_pullr():
    o = []
    o.append(T(14, 18, "(a) 抵抗の値と、スイッチが閉じている間の電流", "start", 11, INK, True))
    p = Plot(86, 40, 270, 200, (1e4, 1e7), (1e-7, 1e-3), xlog=True, ylog=True)
    xf = {1e4: "10 kΩ", 1e5: "100 kΩ", 1e6: "1 MΩ", 1e7: "10 MΩ"}
    yf = {1e-7: "0.1 µA", 1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA"}
    o.append(RECT(p.X(6e5), p.y, p.X(1e7) - p.X(6e5), p.h, 0, ASOFT, "none", 0, op=0.7))
    o.append(p.axes(xt=sorted(xf), yt=sorted(yf), xfmt=lambda v: xf[v], yfmt=lambda v: yf[v]))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "プルアップ抵抗 R", "middle", 9.5, MUT))
    pts = [(10 ** (4 + k / 60 * 3), 3.0 / 10 ** (4 + k / 60 * 3)) for k in range(61)]
    o.append(p.line(pts, c=GLD, lw=2.2))
    o.append(W(p.x, p.Y(2e-6), p.x + p.w, p.Y(2e-6), c=GRN, lw=1.3, dash="6 4"))
    o.append(T(p.x + 6, p.Y(2e-6) + 13, "深い眠りの電流 2 µA", "start", 9, GRN, True, halo=True))
    o.append(T(p.X(6e5) + 4, p.y + 14, "開いたとき H と", "start", 9, ALI, True))
    o.append(T(p.X(6e5) + 4, p.y + 27, "読めない", "start", 9, ALI, True))
    o.append(W(p.X(6e5), p.y, p.X(6e5), p.y + p.h, c=ALI, lw=1.3, dash="4 3"))
    o.append(D(p.X(4e4), p.Y(7.5e-5), GLD, 4.5))
    o.append(T(p.X(4e4) + 8, p.Y(7.5e-5) - 6, "内蔵 40 kΩ: 75 µA", "start", 9.5, GLD, True, halo=True))
    o.append(D(p.X(6e5), p.Y(5e-6), ALI, 4.5))
    o.append(T(p.X(6e5) - 8, p.Y(5e-6) - 8, "上限 600 kΩ: 5 µA", "end", 9.5, ALI, True, halo=True))
    o.append(_f07_m(14, 292, [("V", "DD", True), (" = 3.0 V、", None, False), ("I", "lk", True), (" = 1 µA、", None, False),
                              ("V", "IH", True), (" = 2.1 V、", None, False), ("V", "mg", True), (" = 0.3 V の例", None, False)], "start", 9, MUT))
    # (b) 読み方による平均の電流
    o.append(T(392, 18, "(b) 閉じている間の電流（平均）", "start", 11, INK, True))
    rows = [("内蔵 40 kΩ のまま", "75 µA", 75e-6, ALI), ("外付けの 560 kΩ", "5.4 µA", 3.0 / 560e3, GLD),
            ("閉じている間は周期的に読む", "1.5 µA（100 ms ごと）", 1.515e-6, GRN), ("普段は開いている向きにする", "0（扉が閉まっている間）", 0, GRN)]
    xb, bw = 392, 280
    Xl = lambda v: xb + (math.log10(v) - math.log10(0.1e-6)) / 3.0 * bw
    for v, lab in ((1e-7, "0.1"), (1e-6, "1"), (1e-5, "10"), (1e-4, "100 µA")):
        o.append(W(Xl(v), 48, Xl(v), 230, c=GRD, lw=1))
        o.append(T(Xl(v), 244, lab, "middle", 9, MUT))
    o.append(W(Xl(2e-6), 48, Xl(2e-6), 230, c=GRN, lw=1.2, dash="6 4"))
    for k, (nm, val, v, c) in enumerate(rows):
        y = 52 + k * 45
        o.append(T(xb, y + 10, nm, "start", 10, INK, True))
        if v > 0:
            o.append(RECT(xb, y + 16, Xl(v) - xb, 16, 2, soft(c), c, 1.1))
            o.append(T(min(Xl(v) + 6, 640), y + 29, val, "start" if Xl(v) + 6 < 600 else "end", 9.5, c, True, halo=True))
        else:
            o.append(T(xb + 4, y + 29, val, "start", 9.5, c, True))
    o.append(T(392, 262, "対数目盛。緑の破線は深い眠りの電流 2 µA。", "start", 9, MUT))
    o.append(T(392, 278, "周期的に読む間は、閉じたことに気づくのが最大 100 ms 遅れる。", "start", 9, MUT))
    return SVG(700, 300, o, "閉じたスイッチのプルアップ抵抗に流れる電流。(a) 抵抗を大きくすると電流は減るが、開いたときに漏れ電流でピンの電圧が下がり、600 kΩ（この例）より大きくすると H と読めない。抵抗だけでは 5 µA より下げられない。(b) スイッチの向きと読み方を変えれば、眠りの電流より小さくできる。")
F["e07_pullr"] = _f07_pullr()

# ---- 3 節: ピンを通る 4 つの道 ----
def _f07_paths():
    o = []
    pw, ph = 336, 158
    pos = [(10, 8), (354, 8), (10, 174), (354, 174)]
    titles = ["(a) 浮いた入力", "(b) プルアップ抵抗と閉じたスイッチ", "(c) 電源を切った周辺へ H を出す", "(d) 相手のプルアップ抵抗へ L を出す"]
    bad = ["数 µA〜数百 µA（ふらつく）", "3.0 V ÷ 40 kΩ = 75 µA", "数百 µA になることがある", "3.0 V ÷ 100 kΩ = 30 µA"]
    fix = ["使わないならアナログの設定 → 0", "閉じている間は周期的に読む → 平均 1.5 µA", "電源を切る前に L かアナログの設定 → 0", "相手が待つ側の H にする → 0"]
    for k, ((x, y), tt, b, fx) in enumerate(zip(pos, titles, bad, fix)):
        o.append(RECT(x, y, pw, ph, 8, PAN, LIN, 1.0))
        o.append(T(x + 10, y + 18, tt, "start", 10.5, INK, True))
        # マイコン
        mx, my = x + 12, y + 34
        o.append(RECT(mx, my, 110, 78, 6, SSOFT, SIG, 1.2))
        o.append(T(mx + (30 if k == 1 else 55), my + 14, "マイコン", "middle", 9.5, SIG, True))
        pinx, piny = mx + 110, my + 46
        o.append(RECT(pinx - 5, piny - 5, 10, 10, 1, PAN, INK, 1.1))
        if k == 0:
            o.append(T(mx + 52, my + 32, "入力（何も", "middle", 9, INK))
            o.append(T(mx + 52, my + 44, "つながない）", "middle", 9, INK))
            o.append(ARR(mx + 30, my + 52, mx + 30, my + 74, c=ALI, lw=1.8, head=5))
            o.append(T(mx + 38, my + 68, "貫通電流", "start", 9, ALI, True))
            o.append(W(pinx + 5, piny, pinx + 40, piny, c=INK, lw=1.3))
            o.append(T(pinx + 46, piny + 4, "どこにもつながない", "start", 9, MUT))
        elif k == 1:
            o.append(_f07_vdd(mx + 86, my + 24, "3.0 V"))
            o.append(_f07_resv(mx + 86, my + 24, my + 46, c=GLD, n=4))
            o.append(T(mx + 76, my + 39, "内蔵 40 kΩ", "end", 9, GLD, True))
            o.append(W(mx + 86, my + 46, pinx - 5, piny, c=INK, lw=1.3))
            o.append(W(pinx + 5, piny, pinx + 60, piny, c=INK, lw=1.3))
            o.append(_f07_swv(pinx + 60, piny, piny + 40, True))
            o.append(_f07_gnd(pinx + 60, piny + 40))
            o.append(T(pinx + 74, piny + 24, "スイッチ（閉じている）", "start", 9, INK))
            o.append(ARR(pinx + 12, piny - 6, pinx + 52, piny - 6, c=ALI, lw=1.8, head=5))
        elif k == 2:
            o.append(T(mx + 52, my + 38, "出力 H", "middle", 9.5, INK, True))
            sx = pinx + 70
            o.append(RECT(sx, my - 6, 120, 92, 6, TSOFT, TEA, 1.2))
            o.append(T(sx + 60, my + 80, "センサ（電源は切った）", "middle", 9, TEA, True))
            o.append(W(pinx + 5, piny, sx + 22, piny, c=INK, lw=1.3))
            o.append(_f07_diode_up(sx + 22, piny - 26, c=ALI))
            o.append(W(sx + 22, piny - 26, sx + 22, my + 14, sx + 90, my + 14, sx + 90, my + 28, c=ALI, lw=1.4))
            o.append(RECT(sx + 76, my + 28, 28, 26, 3, PAN, MUT, 1.0))
            o.append(T(sx + 90, my + 45, "回路", "middle", 8.5, MUT))
            o.append(W(sx + 90, my + 54, sx + 90, my + 62, c=MUT, lw=1.2))
            o.append(T(sx + 36, my + 8, "保護ダイオード", "start", 8.5, ALI))
            o.append(ARR(pinx + 12, piny - 6, sx + 14, piny - 6, c=ALI, lw=1.8, head=5))
        else:
            o.append(T(mx + 52, my + 38, "出力 L", "middle", 9.5, INK, True))
            sx = pinx + 70
            o.append(RECT(sx, my - 6, 120, 92, 6, TSOFT, TEA, 1.2))
            o.append(T(sx + 60, my + 80, "周辺（電源は入れたまま）", "middle", 9, TEA, True))
            o.append(_f07_vdd(sx + 60, my + 22, "3.0 V"))
            o.append(_f07_resv(sx + 60, my + 22, my + 46, c=GLD, n=4))
            o.append(T(sx + 70, my + 38, "100 kΩ", "start", 9, GLD, True))
            o.append(W(sx + 60, my + 46, sx + 60, piny, pinx + 5, piny, c=INK, lw=1.3))
            o.append(ARR(sx - 8, piny - 6, pinx + 14, piny - 6, c=ALI, lw=1.8, head=5))
        o.append(T(x + 10, y + ph - 26, b, "start", 9.5, ALI, True))
        o.append(T(x + 10, y + ph - 10, fx, "start", 9.5, GRN, True))
    o.append(T(10, 352, "赤い矢印は眠っている間も流れ続ける電流。どの設定でも、ピンの漏れ電流（数十 nA〜1 µA。代表値）は残る。", "start", 9.5, MUT))
    return SVG(700, 362, o, "眠っている間にピンを通って流れる電流の 4 つの道と、その直し方（値は例）。どれも、深い眠りの電流（例 2 µA）より何倍も大きくなりうる。")
F["e07_paths"] = _f07_paths()

# ---- 4 節: クロックと電源の木 ----
def _f07_tree():
    o = []
    o.append(T(14, 16, "クロック", "start", 11, INK, True))
    # 発振器
    osc = [("中の発振器（速い）", "例 16 MHz", 34), ("水晶振動子（速い）", "例 32 MHz", 78), ("32.768 kHz（遅い）", "水晶か中の発振器", 160)]
    for nm, sub, y in osc:
        c = SIG if y < 150 else GLD
        o.append(RECT(14, y, 138, 36, 6, soft(c), c, 1.2))
        o.append(T(83, y + 15, nm, "middle", 9.5, c, True))
        o.append(T(83, y + 29, sub, "middle", 8.5, MUT))
    # 選ぶ・分ける
    o.append(RECT(176, 46, 70, 56, 6, PAN, SIG, 1.2))
    o.append(T(211, 70, "選ぶ・", "middle", 9.5, SIG, True))
    o.append(T(211, 84, "分ける", "middle", 9.5, SIG, True))
    o.append(ARR(152, 52, 175, 62, c=SIG, lw=1.3, head=5))
    o.append(ARR(152, 96, 175, 86, c=SIG, lw=1.3, head=5))
    # 速いクロックの線と、入れ切りの関門
    o.append(W(246, 74, 280, 74, c=SIG, lw=2))
    o.append(W(280, 36, 280, 140, c=SIG, lw=2))
    o.append(RECT(8, 26, 484, 124, 8, "none", SIG, 1.2, dash="5 4"))
    o.append(T(486, 20, "深い眠りで止まる", "end", 9.5, SIG, True))
    dests = [("CPU", True, 40), ("通信の回路", True, 66), ("ADC", False, 92), ("タイマ（速い）", False, 118)]
    for nm, on, y in dests:
        o.append(W(280, y, 330, y, c=SIG, lw=1.6))
        gc = GRN if on else ALI
        o.append(RECT(330, y - 9, 30, 18, 3, soft(gc), gc, 1.1))
        o.append(T(345, y + 4, "入" if on else "切", "middle", 9.5, gc, True))
        o.append(W(360, y, 390, y, c=SIG if on else FNT, lw=1.6, dash=None if on else "3 3"))
        o.append(RECT(390, y - 10, 92, 20, 4, SSOFT if on else MSOFT, SIG if on else MUT, 1.0))
        o.append(T(436, y + 4, nm, "middle", 9.5, INK if on else MUT, on))
    o.append(T(345, 141, "入れ切りの関門", "middle", 9, MUT))
    # 遅いクロック
    o.append(W(152, 178, 330, 178, c=GLD, lw=2))
    for k, nm in enumerate(["RTC", "遅いタイマ", "ピンの見張り"]):
        xx = 330 + k * 120
        o.append(W(xx, 178, xx, 190, c=GLD, lw=1.4))
        o.append(RECT(xx - 2, 190, 108, 22, 4, GOSOFT, GLD, 1.0))
        o.append(T(xx + 52, 205, nm, "middle", 9.5, INK, True))
    o.append(T(500, 64, "使わない回路のクロックを止める", "start", 9.5, ALI, True))
    o.append(T(500, 78, "（クロックゲーティング）", "start", 9.5, ALI))
    o.append(T(500, 100, "1 つで 1 MHz あたり数 µA（代表値）", "start", 9, MUT))
    # 電源
    y0 = 246
    o.append(T(14, y0, "電源", "start", 11, INK, True))
    o.append(RECT(14, y0 + 12, 90, 30, 6, GOSOFT, GLD, 1.2))
    o.append(T(59, y0 + 32, "電池", "middle", 10, GLD, True))
    o.append(W(104, y0 + 27, 140, y0 + 27, c=GLD, lw=1.8))
    o.append(RECT(140, y0 + 12, 120, 30, 6, PAN, GLD, 1.2))
    o.append(T(200, y0 + 26, "レギュレータ", "middle", 9.5, GLD, True))
    o.append(T(200, y0 + 38, "静止電流（05 章 2 節）", "middle", 8.5, MUT))
    o.append(ARR(260, y0 + 27, 300, y0 + 27, c=GLD, lw=1.6, head=6))
    o.append(RECT(300, y0 + 12, 110, 30, 6, SSOFT, SIG, 1.2))
    o.append(T(355, y0 + 32, "マイコン", "middle", 10, SIG, True))
    o.append(W(120, y0 + 27, 120, y0 + 66, 140, y0 + 66, c=GLD, lw=1.6))
    o.append(RECT(140, y0 + 52, 120, 30, 6, PAN, GLD, 1.2))
    o.append(T(200, y0 + 66, "負荷スイッチ", "middle", 9.5, GLD, True))
    o.append(T(200, y0 + 78, "（05 章 3 節）", "middle", 8.5, MUT))
    o.append(W(260, y0 + 67, 300, y0 + 67, c=FNT, lw=1.6, dash="3 3"))
    o.append(RECT(300, y0 + 52, 110, 30, 6, MSOFT, MUT, 1.0))
    o.append(T(355, y0 + 72, "センサ（切る）", "middle", 10, MUT, True))
    o.append(T(430, y0 + 30, "マイコンの電源は入れたまま、眠りの段階で減らす（1 節）", "start", 9, MUT))
    o.append(T(430, y0 + 70, "使わない周辺は電源ごと切る（08 章 3 節）", "start", 9, MUT))
    return SVG(700, y0 + 94, o, "マイコンのクロックと電源の配り方（例）。速いクロックは、周辺回路ごとの入れ切りの関門を通って配られ、使わない回路の関門を切ると、その回路の電流が減る。深い眠りでは速いクロックそのものが止まる。遅いクロックは、RTC や起こすためのピンの見張りに使われ、眠っている間も動く。")
F["e07_tree"] = _f07_tree()

# ---- 4 節: クロックを下げたときの電荷 ----
def _f07_clockq():
    o = []
    k, I0, N = 150e-6 / 1e6, 0.3e-3, 32000
    rows = [(16e6, "16 MHz"), (4e6, "4 MHz"), (1e6, "1 MHz")]
    x0, sx, sy = 120, 16.0, 22.0             # px/ms, px/mA
    for r, (f, lab) in enumerate(rows):
        yb = 74 + r * 82
        t = N / f * 1e3
        Ik = k * f * 1e3                     # mA
        I0m = I0 * 1e3
        o.append(T(14, yb - 22, lab, "start", 11, INK, True))
        o.append(T(14, yb - 6, "%s mA × %s ms" % (_f07_q(Ik + I0m, 2), _f07_q(t, 1)), "start", 9.5, MUT))
        o.append(W(x0, yb, x0 + 34 * sx, yb, c=MUT, lw=1))
        o.append(W(x0, yb, x0, yb - 3.2 * sy, c=MUT, lw=1))
        for mA in (0, 1, 2, 3):
            o.append(W(x0 - 3, yb - mA * sy, x0, yb - mA * sy, c=MUT, lw=1))
            o.append(T(x0 - 6, yb - mA * sy + 3.5, "%d" % mA, "end", 8.5, MUT))
        o.append(T(x0 + 6, yb - 3.2 * sy + 4, "mA", "start", 8.5, MUT))
        o.append(RECT(x0, yb - I0m * sy, t * sx, I0m * sy, 0, GOSOFT, GLD, 1.0))
        o.append(RECT(x0, yb - (I0m + Ik) * sy, t * sx, Ik * sy, 0, SSOFT, SIG, 1.0))
        q0 = I0 * N / f * 1e6
        lab2 = "%s µC（= 4.8 + %s）" % (_f07_q(4.8 + q0, 1), _f07_q(q0, 1))
        if x0 + t * sx + 8 + tw(lab2, 10) < 696:
            o.append(T(x0 + t * sx + 8, yb - 14, lab2, "start", 10, INK, True, halo=True))
        else:
            o.append(T(x0 + 8, yb - (I0m + Ik) * sy - 6, lab2, "start", 10, INK, True, halo=True))
    ya = 74 + 2 * 82
    for tm in (0, 8, 16, 24, 32):
        o.append(W(x0 + tm * sx, ya, x0 + tm * sx, ya + 4, c=MUT, lw=1))
        o.append(T(x0 + tm * sx, ya + 16, "%d" % tm, "middle", 9, MUT))
    o.append(T(x0 + 17 * sx, ya + 30, "時間 [ms]", "middle", 9.5, MUT))
    o.append(LEGEND(14, ya + 52, [(SIG, "周波数に比例する部分 kf（面積 kN = 4.8 µC。どれも同じ）"), (GLD, "周波数によらない部分 I0 = 0.3 mA（面積 I0 N/f）")], gap=14))
    return SVG(700, ya + 62, o, "同じ仕事（クロック 32,000 回分）を 3 つの周波数で行うときの電流（例の値）。塗った面積が電荷である。周波数に比例する部分の面積はどれも同じで、周波数によらない部分は、遅いほど長く流れる。クロックを下げるとピーク電流は下がるが、電荷は増える。")
F["e07_clockq"] = _f07_clockq()

# ---- 4 節: 止める順番 ----
def _f07_order():
    o = []
    steps = [("1. 仕事を終える", ["送信・変換・", "書き込み"], ["先にクロックを", "止めると、", "データが切れる"]),
             ("2. ピンを整える", ["信号が先", "（3 節）"], ["電源を先に", "切ると、", "流れ込む"]),
             ("3. 周辺の電源を切る", ["電源が後"], ["切り忘れると、", "周辺の電流が", "残る"]),
             ("4. クロックを止める", ["周辺回路ごと"], ["軽い眠りでは、", "電流が残る"]),
             ("5. レギュレータ", ["静止電流の", "小さい動作へ"], ["静止電流が", "残る"]),
             ("6. 印を消す", ["使わない割り込", "みも止める"], ["消し忘れると、", "すぐ起きる"]),
             ("7. 眠る", ["割り込みを", "止めて判定"], ["取りこぼすと、", "待たされる"])]
    o.append(T(14, 18, "眠るとき", "start", 11, INK, True))
    bw, gap, x0, y0 = 92, 4, 14, 28
    for k, (nm, sub, bad) in enumerate(steps):
        x = x0 + k * (bw + gap)
        c = GRN if k == 6 else SIG
        o.append(RECT(x, y0, bw, 54, 6, soft(c), c, 1.2))
        o.append(T(x + bw / 2, y0 + 16, nm, "middle", 9, c, True))
        for j, l in enumerate(sub):
            o.append(T(x + bw / 2, y0 + 31 + j * 12, l, "middle", 8.5, INK))
        for j, l in enumerate(bad):
            o.append(T(x + bw / 2, y0 + 72 + j * 12, l, "middle", 8.5, ALI))
    o.append(T(14, 150, "赤は、その手順を飛ばしたり、順を誤ったりしたときに起きること。", "start", 9, ALI))
    y1 = 184
    o.append(T(14, y1 - 8, "起きるとき（逆の順）", "start", 11, INK, True))
    back = [("起床要因", "RTC・ピン・周辺回路", GLD), ("起床時間", "速いクロックが落ち着く", MUT), ("レギュレータを戻す", "", SIG),
            ("仕事", "印を見て分ける", SIG), ("使う直前に入れる", "クロック・電源・ピン", SIG)]
    bw2 = 124
    for k, (nm, sub, c) in enumerate(back):
        x = 14 + k * (bw2 + 13)
        o.append(RECT(x, y1, bw2, 44, 6, soft(c), c, 1.2))
        o.append(T(x + bw2 / 2, y1 + (18 if sub else 26), nm, "middle", 9.5, c, True))
        if sub:
            o.append(T(x + bw2 / 2, y1 + 33, sub, "middle", 8.5, INK))
        if k < 4:
            o.append(ARR(x + bw2, y1 + 22, x + bw2 + 13, y1 + 22, c=FNT, lw=1.2, head=4))
    return SVG(700, y1 + 54, o, "眠るときと起きるときの手順。眠るときは、動いている仕事を終え、信号を先に、電源を後に止め、古い印を消してから眠る。起きるときは逆の順に戻し、周辺のクロックと電源は使う直前に入れる（05 章 4 節の順番）。")
F["e07_order"] = _f07_order()

# ---- 5 節: 眠る長さと電荷 ----
def _f07_breakeven():
    o = []
    p = Plot(100, 24, 520, 250, (1e-6, 100), (1e-3, 1e5), xlog=True, ylog=True)
    xf = {1e-6: "1 µs", 1e-5: "10 µs", 1e-4: "100 µs", 1e-3: "1 ms", 1e-2: "10 ms", 0.1: "100 ms", 1: "1 s", 10: "10 s", 100: "100 s"}
    yf = {1e-3: "0.001", 1e-2: "0.01", 0.1: "0.1", 1: "1", 10: "10", 100: "100", 1e3: "1000", 1e4: "10⁴", 1e5: "10⁵"}
    t12, t23 = _f07_tbe(0, 1), _f07_tbe(1, 2)
    # 得な範囲の帯
    for (xa, xb), c in (((1e-6, t12), SIG), ((t12, t23), TEA), ((t23, 100), PUR)):
        o.append(RECT(p.X(xa), p.y + p.h - 12, p.X(xb) - p.X(xa), 12, 0, soft(c), "none", 0))
    o.append(p.axes(xl="眠る長さ t（対数目盛）", xt=sorted(xf), yt=sorted(yf), xfmt=lambda v: xf[v], yfmt=lambda v: yf[v]))
    o.append(T(30, p.y + p.h / 2, "眠る間の電荷 [µC]（対数目盛）", "middle", 10, MUT, rot=-90))
    ts = [10 ** (-6 + k / 80 * 8) for k in range(81)]
    for i, (nm, I, tw_, c) in enumerate(_F07_ST):
        q = lambda t: (I * t + _f07_qw(i)) * 1e6
        o.append(p.line([(t, q(t)) for t in ts if 1e-3 <= q(t) <= 1e5], c=c, lw=2.2))
    for t, lab in ((t12, " ≈ 115 µs"), (t23, " ≈ 3.7 s")):
        q = (_F07_ST[1][1] * t + _f07_qw(1)) * 1e6
        o.append(W(p.X(t), p.Y(1e-3), p.X(t), p.Y(q), c=ALI, lw=1.2, dash="3 3"))
        o.append(D(p.X(t), p.Y(q), ALI, 4.5))
        o.append(_f07_m(p.X(t) + 6, p.Y(q) - 8, [("t", "be", True), (lab, None, False)], "start", 9.5, ALI, True))
    o.append(T(p.X(1.5e-6), p.Y(2.2e-3) - 4, "軽い眠りが得", "start", 9, SIG, True, halo=True))
    o.append(T(p.X(3e-3), p.Y(2.2e-3) - 4, "深い眠りが得", "start", 9, TEA, True, halo=True))
    o.append(T(p.X(12), p.Y(2.2e-3) - 4, "最も深い", "start", 9, PUR, True, halo=True))
    o.append(T(p.X(2e-4), p.Y(3e3), "軽い眠り 0.5 mA × t + 0.0025 µC", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(3e-4), p.Y(0.06) + 15, "深い眠り 2 µA × t + 0.060 µC", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(1.2e-6), p.Y(10), "最も深い眠り 0.4 µA × t + 6.0 µC", "start", 9.5, PUR, True, halo=True))
    return SVG(700, 320, o, "眠る長さと、その間に使う電荷（眠りの電流 × 長さ + 起床の電荷。この章の例の値。両軸とも対数目盛）。浅い段階は起床の電荷が小さく、深い段階は眠りの電流が小さい。2 本の線が交わる長さが損益分岐の眠りの長さで、下の帯は、その長さのときに最も得な段階を示す。")
F["e07_breakeven"] = _f07_breakeven()

# ---- 5 節: ドアの開閉センサの平均電流 ----
def _f07_door():
    o = []
    cases = [("60 s ごと", " = 42.0 µC）", 60.0, 42.0e-6), ("1 s ごと", " = 0.1 µC）", 1.0, 0.1e-6)]
    xb, sc = 200, 62.0                       # px/µA
    y = 26
    for title, qv, T_, qt in cases:
        o.append(_f07_m(14, y, [(title + "（", None, False), ("Q", "task", True), (qv, None, False)], "start", 11, INK, True))
        y += 10
        vals = []
        for i in (1, 2):
            nm, I, tw_, c = _F07_ST[i]
            parts = [(I, GRN), (qt / T_, SIG), (_f07_qw(i) / T_, ALI)]
            tot = sum(v for v, _ in parts)
            vals.append(tot)
            o.append(T(xb - 10, y + 15, nm, "end", 10, c, True))
            xx = xb
            for v, cc in parts:
                w = v * 1e6 * sc
                o.append(RECT(xx, y + 3, max(w, 0.8), 18, 2, soft(cc), cc, 1.0))
                xx += w
            o.append(T(xx + 6, y + 16, "%s µA" % _f07_q(tot * 1e6, 2), "start", 10, INK, True))
            y += 28
        best = 1 if vals[0] < vals[1] else 2
        o.append(T(xb, y + 10, "→ %s が得" % _F07_ST[best][0], "start", 9.5, _F07_ST[best][3], True))
        y += 34
    for v in range(0, 8):
        o.append(W(xb + v * sc, y - 8, xb + v * sc, y - 4, c=MUT, lw=1))
        o.append(T(xb + v * sc, y + 8, "%d" % v, "middle", 9, MUT))
    o.append(T(xb + 7 * sc + 8, y + 8, "µA", "start", 9, MUT))
    o.append(_f07_legm(14, y + 30, [(GRN, [("眠りの電流 ", None, False), ("I", "s,m", True)]),
                                    (SIG, [("仕事の上乗せ ", None, False), ("Q", "task", True), (" ÷ ", None, False), ("T", None, True)]),
                                    (ALI, [("起床の電荷 ", None, False), ("Q", "w,m", True), (" ÷ ", None, False), ("T", None, True)])], gap=14))
    o.append(T(14, y + 50, "60 s ごとの場合の電池寿命（CR2032、自己放電 0.25 µA を足す）: 深い眠り 8.5 年、最も深い眠り 17.3 年。", "start", 9.5, MUT))
    return SVG(700, y + 60, o, "ドアの開閉センサの平均電流の内訳（例の値）。60 s ごとに起きるなら、最も深い眠りの起床の電荷 6.0 µC を払っても、眠りの電流が小さいほうが効く。1 s ごとに起きるなら、起床の電荷が 1 秒に 6.0 µA 分になり、深い眠りのほうが得になる。")
F["e07_door"] = _f07_door()

# ---- 6 節: 電流計の負担電圧 ----
def _f07_meter():
    o = []
    panels = [("(a) テスタの µA の範囲", "中の抵抗 100 Ω", 100.0), ("(b) テスタの mA の範囲", "中の抵抗 1.8 Ω", 1.8), ("(c) シャント抵抗と増幅器", "例 1 Ω", 1.0)]
    E, Rin, Ipk, Is, Vbor = 3.0, 15.0, 10e-3, 2e-6, 2.2
    for k, (title, sub, R) in enumerate(panels):
        x = 14 + k * 230
        o.append(T(x, 18, title, "start", 10.5, INK, True))
        # 回路: 電池 → 計器 → 機器
        o.append(RECT(x, 34, 56, 40, 6, GOSOFT, GLD, 1.1))
        o.append(T(x + 28, 51, "電池", "middle", 9.5, GLD, True))
        o.append(T(x + 28, 65, "3.0 V・15 Ω", "middle", 8, INK))
        o.append(W(x + 56, 54, x + 74, 54, c=INK, lw=1.4))
        if k < 2:
            o.append(CIRC(x + 94, 54, 18, c=PUR, lw=1.4, fill=PSOFT))
            o.append(T(x + 94, 58, "A", "middle", 12, PUR, True))
            o.append(T(x + 94, 88, sub, "middle", 8.5, PUR))
        else:
            o.append(_f07_resh(x + 74, x + 114, 54, c=PUR))
            o.append(T(x + 94, 74, sub, "middle", 8.5, PUR))
            o.append(RECT(x + 76, 80, 36, 16, 3, PSOFT, PUR, 1.0))
            o.append(T(x + 94, 92, "増幅", "middle", 8.5, PUR, True))
            o.append(W(x + 80, 54, x + 80, 80, c=PUR, lw=1) + W(x + 108, 54, x + 108, 80, c=PUR, lw=1))
            o.append(T(x + 94, 108, "→ 記録", "middle", 8.5, PUR))
        o.append(W(x + 114, 54, x + 134, 54, c=INK, lw=1.4))
        o.append(RECT(x + 134, 34, 70, 40, 6, SSOFT, SIG, 1.1))
        o.append(T(x + 169, 51, "機器", "middle", 9.5, SIG, True))
        o.append(T(x + 169, 65, "眠り 2 µA", "middle", 8, INK))
        # 送信の 10 mA のときの機器の電圧
        V = E - Ipk * (Rin + R)
        yb, hb = 126, 70
        Yv = lambda v: yb + hb - (v - 1.5) / 1.5 * hb
        o.append(T(x, yb - 8, "送信 10 mA の間の機器の電圧 [V]", "start", 9, MUT))
        o.append(W(x + 30, yb, x + 30, yb + hb, x + 205, yb + hb, c=MUT, lw=1))
        for v in (1.5, 2.0, 2.5, 3.0):
            o.append(W(x + 26, Yv(v), x + 30, Yv(v), c=MUT, lw=1))
            o.append(T(x + 24, Yv(v) + 3, "%.1f" % v, "end", 8.5, MUT))
        ok = V >= Vbor
        c = GRN if ok else ALI
        o.append(RECT(x + 50, Yv(V), 56, yb + hb - Yv(V), 2, soft(c), c, 1.1))
        o.append(T(x + 112, Yv(V) + 4, "%s V" % _f07_q(V, 2), "start", 10, c, True, halo=True))
        o.append(W(x + 30, Yv(Vbor), x + 205, Yv(Vbor), c=ALI, lw=1.2, dash="4 3"))
        o.append(T(x + 204, Yv(Vbor) - 4, "BOR 2.2 V", "end", 8.5, ALI, True, halo=True))
        lines = {0: ["1 V 下がり、リセットする"], 1: ["送信はできるが、眠りの 2 µA は", "3.6 µV にしかならず、0 と表示"],
                 2: ["1 本では、眠りと送信の両方は", "測れない（次の図）"]}[k]
        for j, l in enumerate(lines):
            o.append(T(x, yb + hb + 18 + j * 14, l, "start", 9, ALI if k < 2 else INK, k == 0))
    return SVG(700, 240, o, "電流計を入れたときの、送信の間の機器の電圧（電池は起電力 3.0 V・内部抵抗 15 Ω、送信は 10 mA の例）。計器の中の抵抗の電圧（負担電圧）の分だけ機器の電圧が下がる。µA の範囲では BOR を割ってリセットし、mA の範囲では眠りの電流が小さすぎて読めない。")
F["e07_meter"] = _f07_meter()

# ---- 6 節: 1 本のシャント抵抗で測れる範囲 ----
def _f07_range():
    o = []
    lo, hi = 1e-7, 1e-1
    xb, bw = 110, 560
    X = lambda v: xb + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * bw
    lab = {1e-7: "0.1 µA", 1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA", 1e-2: "10 mA", 1e-1: "100 mA"}
    y0 = 40
    marks = [(0.4e-6, "最も深い眠り 0.4 µA", PUR), (2e-6, "深い眠り 2 µA", TEA), (3e-3, "処理 3 mA", SIG), (10e-3, "送信 10 mA", SIG)]
    for v, nm, c in marks:
        o.append(W(X(v), y0 - 6, X(v), y0 + 4 * 34 + 4, c=c, lw=1.3, dash="4 3"))
    for v, nm, c in marks:
        up = v in (2e-6, 10e-3)
        o.append(T(X(v), y0 - 12 - (14 if up else 0), nm, "middle", 9, c, True, halo=True))
    for k, R in enumerate((1.0, 10.0, 100.0, 1000.0)):
        y = y0 + 8 + k * 34
        a, b = 500e-6 / R, 0.1 / R
        o.append(T(xb - 10, y + 14, "%g Ω" % R if R < 1000 else "1 kΩ", "end", 10, INK, True))
        o.append(RECT(X(a), y + 2, X(b) - X(a), 18, 3, GOSOFT, GLD, 1.1))
        o.append(T((X(a) + X(b)) / 2, y + 15, "%s〜%s" % (_f07_fmt_i(a), _f07_fmt_i(b)), "middle", 9, INK, True))
    ya = y0 + 8 + 4 * 34 + 6
    o.append(W(xb, ya, xb + bw, ya, c=MUT, lw=1))
    for v, s in lab.items():
        o.append(W(X(v), ya, X(v), ya + 4, c=MUT, lw=1))
        o.append(T(X(v), ya + 16, s, "middle", 9, MUT))
    o.append(T(xb + bw / 2, ya + 32, "電流（対数目盛）", "middle", 9.5, MUT))
    o.append(T(14, ya + 52, "帯: 上限で抵抗の電圧が 0.1 V、下限で誤差 50 µV の 10 倍（500 µV）になる範囲。どれも 200 倍の幅しかない。", "start", 9.5, MUT))
    return SVG(700, ya + 62, o, "1 本のシャント抵抗で測れる電流の範囲（許せる電圧の低下 0.1 V、測る誤差 50 µV、誤差 10 % の例）。機器の電流は 0.4 µA から 10 mA まで 25,000 倍に広がるので、1 本の抵抗では測れない。眠りの電流と起きている間の電流を、別の抵抗で測り分ける。")
F["e07_range"] = _f07_range()

# ---- 6 節: 平均をとる時間 ----
def _f07_window():
    o = []
    Is, Qe, Tp = 2e-6, 42e-6, 60.0
    Itrue = Is + Qe / Tp
    o.append(T(14, 18, "(a) 電流と、平均をとる時間（10 s の例）", "start", 11, INK, True))
    x0, sx = 70, 1.8                          # px/s
    yb = 96
    o.append(W(x0, yb, x0 + 330 * sx, yb, c=MUT, lw=1))
    for t in range(0, 331, 60):
        o.append(W(x0 + t * sx, yb, x0 + t * sx, yb + 4, c=MUT, lw=1))
        o.append(T(x0 + t * sx, yb + 16, "%d s" % t, "middle", 9, MUT))
    o.append(W(x0, yb - 6, x0 + 330 * sx, yb - 6, c=GRN, lw=1.6))
    o.append(T(x0 - 6, yb - 3, "2 µA", "end", 9, GRN))
    for t in range(30, 331, 60):
        o.append(W(x0 + t * sx, yb - 6, x0 + t * sx, yb - 58, c=SIG, lw=2))
    o.append(T(x0 + 210 * sx + 6, yb - 46, "起床（7 ms で 42 µC の上乗せ）", "start", 9, SIG, True, halo=True))
    for (ta, lab, c) in ((95.0, "入らない → 2.0 µA", ALI), (145.0, "入る → 6.2 µA", ALI)):
        o.append(RECT(x0 + ta * sx, yb - 34, 10 * sx, 28, 2, ASOFT, ALI, 1.0, op=0.8))
        o.append(T(x0 + ta * sx + 9, yb - 38, lab, "middle", 9, c, True, halo=True))
    # (b) 測った平均の幅
    o.append(T(14, 146, "(b) 平均をとる時間と、測った平均（始める時刻によって帯の中のどこかになる）", "start", 11, INK, True))
    p = Plot(84, 166, 520, 170, (10, 1000), (1.5, 7.0), xlog=True)
    xs = [10 ** (1 + k / 400 * 2) for k in range(401)]
    hi = [(w, (Is + math.ceil(w / Tp - 1e-9) * Qe / w) * 1e6) for w in xs]
    lo_ = [(w, (Is + math.floor(w / Tp + 1e-9) * Qe / w) * 1e6) for w in xs]
    poly = [(p.X(w), p.Y(v)) for w, v in hi] + [(p.X(w), p.Y(v)) for w, v in reversed(lo_)]
    o.append(PL(poly, c="none", lw=0, fill=ASOFT))
    o.append(p.axes(xl="平均をとる時間 W（対数目盛）", xt=[10, 30, 60, 100, 300, 600, 1000], yt=[2, 3, 4, 5, 6, 7],
                    xfmt=lambda v: "%g s" % v, yfmt=lambda v: "%g" % v))
    o.append(T(40, p.y + p.h / 2, "測った平均 [µA]", "middle", 9.5, MUT, rot=-90))
    o.append(p.line(hi, c=ALI, lw=1.4))
    o.append(p.line(lo_, c=ALI, lw=1.4))
    o.append(p.line([(10, Itrue * 1e6), (1000, Itrue * 1e6)], c=GRN, lw=1.6, dash="6 4"))
    o.append(T(p.X(1000) - 4, p.Y(Itrue * 1e6) - 6, "本当の平均 2.70 µA", "end", 9.5, GRN, True, halo=True))
    o.append(W(p.X(311), p.y, p.X(311), p.y + p.h, c=SIG, lw=1.2, dash="3 3"))
    o.append(T(p.X(311) + 4, p.y + 14, "311 s: 誤差 5 % 以下", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(60) + 4, p.Y(6.2), "60 s の整数倍では幅が 0", "start", 9, MUT, False, halo=True))
    return SVG(700, 380, o, "平均をとる時間による、平均の読みの違い（深い眠りのドアの開閉センサ。眠り 2 µA、60 s ごとに 42 µC）。(a) 10 s の平均は、起床が入るかどうかで 2.0 µA か 6.2 µA になる。(b) 誤差は、1 回の上乗せの電荷 ÷ 平均をとる時間より小さく、周期のちょうど整数倍の時間なら 0 になる。")
F["e07_window"] = _f07_window()
