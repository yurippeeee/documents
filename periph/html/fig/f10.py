# -*- coding: utf-8 -*-
# 10 章 測り方を設計する の図
import random as _f10_random

# ---- 補助 ----
def _f10_rng(seed):
    return _f10_random.Random(seed)

def _f10_ma(xs, N):
    """移動平均（たまるまでは 0 を前に置いたものとして平均する: 段差の図と同じ扱い）。"""
    buf, out, s = [0.0] * N, [], 0.0
    for i, v in enumerate(xs):
        s += v - buf[i % N]; buf[i % N] = v; out.append(s / N)
    return out

def _f10_med(xs, N):
    buf, out = [xs[0]] * N, []
    for i, v in enumerate(xs):
        buf[i % N] = v; out.append(sorted(buf)[N // 2])
    return out

def _f10_ema(xs, a, y0=None):
    s = xs[0] if y0 is None else y0
    out = []
    for v in xs:
        s += a * (v - s); out.append(s)
    return out

def _f10_frame(p, c=LIN):
    return RECT(p.x, p.y, p.w, p.h, 2, "none", c, 1.0)

def _f10_dots(p, pts, c=TEA, r=1.9):
    return "".join(D(p.X(a), p.Y(b), c, r) for a, b in pts)

def _f10_clip(v, lo, hi):
    return lo if v < lo else (hi if v > hi else v)

# ---- 1 節: 周期を決めるもの ----
def _f10_period():
    o = []
    # (a) 変わる速さ
    o.append(T(14, 20, "(a) 直前に測った値を使うと、差は最大 S T", "start", 11, INK, True))
    p = Plot(78, 34, 330, 130, (0, 80), (21.95, 22.45))
    o.append(p.axes(xl="時間 [s]", yl="温度 [°C]", xt=[0, 20, 40, 60, 80], yt=[22.0, 22.1, 22.2, 22.3, 22.4],
                    yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 22.0), (80, 22.4)], c=TEA, lw=2.2))
    st = [(20 * k, 22.0 + 0.1 * k) for k in range(5)]
    o.append(p.steps(st, c=SIG, lw=1.8))
    for a, b in st:
        o.append(D(p.X(a), p.Y(b), SIG, 3.6))
    o.append(DIM(p.X(39), p.Y(22.1), p.X(39), p.Y(22.2), None, c=ALI))
    o.append(T(p.X(39) - 5, p.Y(22.15) + 4, "S T = 0.1 °C", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(47), p.Y(22.36), "本当の温度（0.005 °C/s）", "middle", 9.5, TEA, True, halo=True))
    o.append(T(p.X(62), p.Y(22.235), "使う値（T = 20 s ごとに測る）", "start", 9.5, SIG, True, halo=True))
    # (c) 見つける確率
    o.append(T(470, 20, "(c) 短い出来事を見つける確率", "start", 11, INK, True))
    q = Plot(510, 34, 170, 130, (0, 2), (0, 1.1))
    o.append(q.axes(xl="出来事の長さ d ÷ T", yl="見つける確率", xt=[0, 0.5, 1, 1.5, 2], yt=[0, 0.5, 1],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(q.line([(0, 0), (1, 1), (2, 1)], c=SIG, lw=2.2))
    o.append(D(q.X(0.2), q.Y(0.2), ALI, 4))
    o.append(T(q.X(0.2) + 7, q.Y(0.2) + 4, "扉 2 s・T = 10 s で 0.2", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0.45), q.Y(0.75), "d/T", "middle", 10, SIG, True, halo=True))
    # (b) 短い出来事
    y0 = 236
    o.append(T(14, y0 - 12, "(b) 2 秒だけ開いた扉を、2 つの周期で測る", "start", 11, INK, True))
    X = lambda t: 120 + t * 14.0
    rows = [("扉", 0), ("T = 1 s", 1), ("T = 10 s", 10)]
    o.append(RECT(X(13), y0, X(15) - X(13), 14, 2, GOSOFT, GLD, 1.2))
    o.append(T(X(15) + 8, y0 + 11, "開いている（d = 2 s）", "start", 9.5, GLD, True))
    for i, (nm, per) in enumerate(rows):
        yy = y0 + 7 + i * 30
        o.append(T(110, yy + 4, nm, "end", 10.5, INK, True))
        if per == 0:
            continue
        o.append(W(X(0), yy, X(30), yy, c=FNT, lw=1))
        t = 0
        while t <= 30:
            hit = 13 <= t <= 15
            o.append(D(X(t), yy, GRN if hit else MUT, 4.2 if hit else 3.0))
            t += per
    for t in (13, 15):
        o.append(W(X(t), y0 - 4, X(t), y0 + 80, c=GLD, lw=1, dash="3 3"))
    o.append(T(X(30) + 10, y0 + 41, "2 回測って見つける", "start", 9.5, GRN, True))
    o.append(T(X(30) + 10, y0 + 71, "測る時刻が入らず、見逃す", "start", 9.5, ALI, True))
    ya = y0 + 92
    o.append(W(X(0), ya, X(30), ya, c=MUT, lw=1))
    for t in range(0, 31, 5):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9.5, MUT))
    o.append(T(X(30) + 10, ya + 16, "時間 [s]", "start", 9.5, MUT))
    return SVG(700, ya + 26, o, "サンプリング周期を決めるもの。(a) 量が速さ S で変わると、直前に測った値は最大 S T ずれる。(b) 測る時刻と時刻の間だけに起きて終わる出来事は見逃す。(c) 長さ d の出来事を見つける確率は d/T（d < T のとき）。")
F["e10_period"] = _f10_period()

# ---- 1 節: マイコンが読むか、センサに見張らせるか ----
def _f10_wake():
    o = []
    X = lambda t: 160 + t * 400.0          # 0〜1 s
    panels = [("(a) マイコンが自分のタイマで 0.1 s ごとに起きて読み、動いたかを判定する", "poll", "平均 +10 µA（例）", ALI),
              ("(b) データレディ割り込み: 測り終えたら知らせ、マイコンはそのときだけ読む", "drdy", "測った値を 1 つずつ読む", SIG),
              ("(c) しきい値割り込み: センサが見張り、動いたときだけ知らせる", "thr", "平均 +0 µA（例）", GRN)]
    y = 24
    for title, kind, note, nc in panels:
        o.append(T(14, y, title, "start", 10.5, INK, True))
        lanes = [y + 20, y + 44, y + 68]
        names = ["センサの測定", "割り込みの出力", "マイコンの電流"]
        for yy, nm in zip(lanes, names):
            o.append(T(150, yy + 8, nm, "end", 9.5, MUT))
            o.append(W(X(0), yy + 12, X(1.0), yy + 12, c=FNT, lw=1))
        # センサの測定（10 Hz）
        for k in range(10):
            t = 0.03 + 0.1 * k
            o.append(RECT(X(t), lanes[0] + 3, 0.02 * 400, 9, 1, TSOFT, TEA, 0.9))
        if kind == "thr":
            o.append(RECT(X(0.6), lanes[0] - 1, X(1.0) - X(0.6), 15, 2, "none", GLD, 1.1, dash="3 2"))
            o.append(T(X(0.8), lanes[0] - 4, "動き始める", "middle", 9, GLD, True, halo=True))
        # 割り込みの出力
        yl, yh = lanes[1] + 12, lanes[1] + 2
        if kind == "poll":
            o.append(T(X(0.5), lanes[1] + 9, "使わない", "middle", 9, MUT, halo=True))
        elif kind == "drdy":
            pts = [(X(0), yl)]
            for k in range(10):
                t = 0.05 + 0.1 * k
                pts += [(X(t), yl), (X(t), yh), (X(t + 0.012), yh), (X(t + 0.012), yl)]
            pts.append((X(1.0), yl))
            o.append(PL(pts, c=SIG, lw=1.5))
        else:
            pts = [(X(0), yl), (X(0.65), yl), (X(0.65), yh), (X(0.665), yh), (X(0.665), yl), (X(1.0), yl)]
            o.append(PL(pts, c=SIG, lw=1.5))
        # マイコンの電流
        ys = lanes[2] + 12
        if kind == "poll":
            ts = [0.1 * k + 0.002 for k in range(10)]
        elif kind == "drdy":
            ts = [0.05 + 0.1 * k + 0.002 for k in range(10)]
        else:
            ts = [0.652]
        for t in ts:
            o.append(RECT(X(t), ys - 10, 0.012 * 400, 10, 0.5, SSOFT, SIG, 1.0))
        o.append(T(X(1.0) + 6, lanes[2] + 9, note, "start", 9.5, nc, True))
        y += 104
    ya = y - 14
    o.append(W(X(0), ya, X(1.0), ya, c=MUT, lw=1))
    for k in range(6):
        t = 0.2 * k
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%g" % t, "middle", 9.5, MUT))
    o.append(T(X(1.0) + 6, ya + 16, "時間 [s]", "start", 9.5, MUT))
    return SVG(700, ya + 26, o, "物に付けて、持ち出されたら知らせる札の 3 つの作り方（加速度センサは中で 10 Hz で測る）。(a) マイコンが毎回起きて読むと、読み出しの電荷が平均電流に加わる。(b) データレディ割り込みなら、センサが測り終えたときだけ読める。(c) しきい値割り込みなら、マイコンは動いたときだけ起きる。")
F["e10_wake"] = _f10_wake()

# ---- 1 節: 2 つの時計のずれ ----
def _f10_clock():
    o = []
    X = lambda t: 200 + t * 1.12           # ms
    ys, ym, yd = 40, 92, 144
    o.append(T(190, ys + 4, "センサが測る", "end", 10, TEA, True))
    o.append(T(190, ys + 18, "（自分の時計で 36 ms ごと）", "end", 9, MUT))
    o.append(T(190, ym + 4, "マイコンのタイマで読む", "end", 10, ALI, True))
    o.append(T(190, ym + 18, "（40 ms ごと）", "end", 9, MUT))
    o.append(T(190, yd + 4, "データレディで読む", "end", 10, GRN, True))
    o.append(T(190, yd + 18, "（測り終えたら読む）", "end", 9, MUT))
    for yy in (ys, ym, yd):
        o.append(W(X(0), yy, X(440), yy, c=FNT, lw=1))
    sens = [18 + 36 * k for k in range(12)]
    for i, t in enumerate(sens):
        o.append(D(X(t), ys, TEA, 3.6))
        o.append(T(X(t), ys - 8, str(i + 1), "middle", 9.5, TEA, True))
    # マイコンのタイマ: 40 ms ごと。読めるのは、その時刻までに最後に測った値
    for k in range(1, 11):
        t = 40 * k
        idx = max(i for i, s in enumerate(sens) if s <= t) + 1
        o.append(ARR(X(sens[idx - 1]), ys + 5, X(t), ym - 5, c=FNT, lw=1, head=5))
        o.append(D(X(t), ym, ALI if idx == 6 else SIG, 3.6))
        o.append(T(X(t), ym + 16, str(idx), "middle", 9.5, ALI if idx == 6 else SIG, True))
    o.append(T(X(176), ym + 34, "5 番を読み落とす", "middle", 9.5, ALI, True))
    # データレディ
    for i, t in enumerate(sens):
        o.append(ARR(X(t), ys + 5, X(t + 3), yd - 5, c=FNT, lw=0.9, head=4))
        o.append(D(X(t + 3), yd, GRN, 3.6))
        o.append(T(X(t + 3), yd + 16, str(i + 1), "middle", 9.5, GRN, True))
    ya = yd + 32
    o.append(W(X(0), ya, X(440), ya, c=MUT, lw=1))
    for t in range(0, 441, 40):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9, MUT))
    o.append(T(X(440), ya + 30, "時間 [ms]", "end", 9.5, MUT))
    return SVG(700, ya + 38, o, "センサの時計とマイコンの時計がずれていると、マイコンのタイマで読む方法では、値を読み落としたり（センサが速いとき）、同じ値を 2 回読んだり（遅いとき）する。図はずれを 10 % に大きくして描いた。1 % なら 100 回に 1 回起きる。データレディ割り込みで読めば、測った値を 1 つずつ読める。")
F["e10_clock"] = _f10_clock()

# ---- 2 節: FIFO にためて読む ----
def _f10_fifo():
    o = []
    X = lambda n: 130 + n * 17.0            # n は T を単位にした時刻
    # (a) FIFO を使わない
    o.append(T(14, 20, "(a) 1 つずつ読む: 測るたびに起きる", "start", 11, INK, True))
    ya1, ya2 = 40, 64
    o.append(T(120, ya1 + 4, "センサの測定", "end", 9.5, MUT))
    o.append(T(120, ya2 + 4, "マイコンの電流", "end", 9.5, MUT))
    for yy in (ya1, ya2):
        o.append(W(X(0), yy + 6, X(26), yy + 6, c=FNT, lw=1))
    for n in range(26):
        o.append(RECT(X(n + 0.2), ya1 - 3, 6, 9, 1, TSOFT, TEA, 0.8))
        o.append(RECT(X(n + 0.55), ya2 - 4, 5, 10, 0.5, SSOFT, SIG, 0.9))
    o.append(T(X(26) + 6, ya2 + 4, "26 回起きる", "start", 9.5, SIG, True))
    # (b) FIFO
    yb = 110
    o.append(T(14, yb, "(b) FIFO にためて、M = 6 個たまったら知らせ、まとめて読む（深さ M_max = 10）", "start", 11, INK, True))
    p = Plot(130, yb + 14, X(26) - 130, 130, (0, 26), (0, 11))
    o.append(W(p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.1))
    o.append(W(p.x, p.y, p.x, p.y + p.h, c=MUT, lw=1.1))
    for v in (0, 6, 10):
        o.append(T(p.x - 6, p.Y(v) + 3.5, "%d" % v, "end", 9, MUT))
    o.append(T(p.x - 32, p.y + p.h / 2, "たまった数", "middle", 9.5, MUT, rot=-90))
    o.append(W(p.x, p.Y(6), p.x + p.w, p.Y(6), c=GLD, lw=1.2, dash="5 3"))
    o.append(W(p.x, p.Y(10), p.x + p.w, p.Y(10), c=ALI, lw=1.2, dash="5 3"))
    o.append(T(p.x + p.w + 6, p.Y(6) + 4, "M（知らせる数）", "start", 9.5, GLD, True))
    o.append(T(p.x + p.w + 6, p.Y(10) + 4, "M_max（深さ）", "start", 9.5, ALI, True))
    # 測るたびに 1 増え、読むと 0 に戻る。2 回目は応えられない時間がある
    reads = [6.6, 15.6, 21.6]       # 読む時刻（2 回目は 3 個分遅れる）
    pts, lvl, t = [], 0, 0.0
    ev = sorted([(n + 0.4, "s") for n in range(26)] + [(r, "r") for r in reads])
    pts.append((0, 0))
    for tt, kind in ev:
        pts.append((tt, lvl))
        lvl = lvl + 1 if kind == "s" else 0
        pts.append((tt, lvl))
    pts.append((26, lvl))
    o.append(PL([(p.X(a), p.Y(b)) for a, b in pts], c=SIG, lw=1.8))
    o.append(RECT(X(12.6), p.y + 2, X(15.6) - X(12.6), p.h - 2, 2, MSOFT, "none", 0))
    o.append(T((X(12.6) + X(15.6)) / 2, p.y + 14, "応えられない間 t_d", "middle", 9, MUT, True, halo=True))
    o.append(T(X(15.6) + 4, p.Y(9) - 2, "9 個まで（あふれない）", "start", 9, SIG, True, halo=True))
    # マイコンの電流
    ym = yb + 14 + 130 + 24
    o.append(T(120, ym + 4, "マイコンの電流", "end", 9.5, MUT))
    o.append(W(X(0), ym + 6, X(26), ym + 6, c=FNT, lw=1))
    for r in reads:
        o.append(RECT(X(r), ym - 6, 14, 12, 0.5, SSOFT, SIG, 0.9))
    o.append(T(X(26) + 6, ym + 4, "3 回だけ起きる", "start", 9.5, SIG, True))
    ya = ym + 22
    o.append(W(X(0), ya, X(26), ya, c=MUT, lw=1))
    for n in range(0, 27, 6):
        o.append(W(X(n), ya, X(n), ya + 4, c=MUT, lw=1))
        o.append(T(X(n), ya + 16, "0" if n == 0 else "%dT" % n, "middle", 9.5, MUT))
    o.append(T(X(26) + 6, ya + 16, "時間", "start", 9.5, MUT))
    return SVG(700, ya + 26, o, "センサの FIFO。(a) 1 つずつ読むと、測るたびにマイコンが起きる。(b) FIFO にためて M 個ずつ読むと、起きる回数は 1/M になる。マイコンが応えられない間（t_d）にもたまり続けるので、M + t_d/T が深さ M_max を超えないようにする。")
F["e10_fifo"] = _f10_fifo()

def _f10_fifocur():
    o = []
    Tm, Qe = 0.04, 1.5
    p = Plot(86, 24, 430, 230, (1, 64), (0.3, 100), xlog=True, ylog=True)
    o.append(p.axes(xl="1 回に読む数 M", yl="読むための平均電流 [µA]", xt=[1, 2, 4, 8, 16, 32, 64], yt=[1, 10, 100],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    o.append(RECT(p.X(27), p.y, p.X(64) - p.X(27), p.h, 0, ASOFT, "none", 0, op=0.6))
    o.append(T(p.X(41), p.y + 14, "あふれる", "middle", 9.5, ALI, True, halo=True))
    for nm, Qr, c, dy in (("I2C 400 kHz", 0.6, ALI, -8), ("SPI 8 MHz", 0.02, SIG, -8)):
        pts = [(m, Qe / (m * Tm) + Qr / Tm) for m in [1 + k * 0.25 for k in range(253)]]
        o.append(p.line(pts, c=c, lw=2.3))
        o.append(p.line([(1, Qr / Tm), (64, Qr / Tm)], c=c, lw=1.1, dash="5 4"))
        ms = Qe / Qr
        if ms <= 64:
            o.append(D(p.X(ms), p.Y(Qe / (ms * Tm) + Qr / Tm), c, 4))
        I27 = Qe / (27 * Tm) + Qr / Tm
        o.append(D(p.X(27), p.Y(I27), c, 3.4))
    o.append(T(p.X(2.5) + 6, p.Y(30) - 6, "M* = 2.5", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1.5), p.Y(15) - 6, "下限 Q_r/T = 15 µA", "start", 9.5, ALI, halo=True))
    o.append(T(p.X(1.5), p.Y(0.5) - 6, "下限 Q_r/T = 0.5 µA", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(27) - 6, p.Y(16.4) + 16, "16.4 µA", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(27) - 6, p.Y(1.89) + 16, "1.9 µA", "end", 9.5, SIG, True, halo=True))
    # 右の凡例
    o.append(T(540, 60, "I2C 400 kHz", "start", 10.5, ALI, True))
    o.append(T(540, 76, "Q_r = 0.6 µC", "start", 9.5, MUT))
    o.append(T(540, 92, "M* = Q_e/Q_r = 2.5", "start", 9.5, MUT))
    o.append(T(540, 130, "SPI 8 MHz", "start", 10.5, SIG, True))
    o.append(T(540, 146, "Q_r = 0.02 µC", "start", 9.5, MUT))
    o.append(T(540, 162, "M* = 75", "start", 9.5, MUT))
    o.append(T(540, 200, "共通: T = 40 ms、", "start", 9.5, MUT))
    o.append(T(540, 215, "Q_e = 1.5 µC、", "start", 9.5, MUT))
    o.append(T(540, 230, "深さ 32、t_d = 0.2 s", "start", 9.5, MUT))
    return SVG(700, 300, o, "1 回に読む数 M と、読むための平均電流 Q_e/(M T) + Q_r/T（例の値。両軸とも対数目盛）。M を増やすと第 1 項が減り、破線の下限 Q_r/T に近づく。I2C では値を読む電荷が大きく、M* = 2.5 より先はほとんど減らない。M = 27 より大きいと、応えられない 0.2 s の間に深さ 32 を超えてあふれる。")
F["e10_fifocur"] = _f10_fifocur()

# ---- 3 節: 自己発熱 ----
def _f10_res_v(x, y1, y2, c=INK):
    dy = (y2 - y1 - 8) / 6.0
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(6):
        pts.append((x + (5 if i % 2 == 0 else -5), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=1.5)

def _f10_heat():
    o = []
    # (a) 分圧の回路
    o.append(T(14, 20, "(a) サーミスタの分圧", "start", 11, INK, True))
    x = 90
    o.append(T(x, 44, "3.0 V（測るときだけ）", "middle", 9.5, GLD, True))
    o.append(W(x, 50, x, 62, c=INK, lw=1.5))
    o.append(_f10_res_v(x, 62, 112))
    o.append(T(x + 12, 92, "固定抵抗 10 kΩ", "start", 9.5, INK))
    o.append(W(x, 112, x, 126, c=INK, lw=1.5))
    o.append(D(x, 126, INK, 3))
    o.append(ARR(x, 126, x + 70, 126, c=MUT, lw=1.2, head=6))
    o.append(T(x + 74, 130, "ADC", "start", 9.5, MUT, True))
    o.append(W(x, 126, x, 140, c=INK, lw=1.5))
    o.append(RECT(x - 9, 140, 18, 46, 3, ASOFT, ALI, 1.4))
    o.append(T(x + 14, 160, "サーミスタ", "start", 9.5, ALI, True))
    o.append(T(x + 14, 175, "25 °C で 10 kΩ", "start", 9.5, MUT))
    o.append(W(x, 186, x, 198, c=INK, lw=1.5))
    o.append(W(x - 10, 198, x + 10, 198, c=MUT, lw=1.6))
    for k in range(3):
        o.append(CARR(x - 30 - 6 * k, 168 - 10 * k, x - 52 - 6 * k, 150 - 12 * k, bend=0.3, c=ALI, lw=1.2, head=5))
    o.append(T(18, 226, "P = 225 µW が熱になる", "start", 9.5, ALI, True))
    o.append(T(18, 241, "流しっぱなしなら", "start", 9.5, MUT))
    o.append(T(18, 256, "Δθ = k_th P = 0.23 °C", "start", 9.5, MUT))
    # (b) 温度の上がり方（一次の模型、時定数 5 s の例）
    o.append(T(250, 20, "(b) 1 mW を加えたときの温度の上昇（k_th = 1 °C/mW、温まる時定数 5 s の例）", "start", 10.5, INK, True))
    p = Plot(290, 36, 390, 170, (0, 40), (0, 1.1))
    o.append(p.axes(xl="時間 [s]", yl="温度の上昇 [°C]", xt=[0, 10, 20, 30, 40], yt=[0, 0.25, 0.5, 0.75, 1.0],
                    yfmt=lambda v: "%g" % v))
    def sim(per, on, tend=40.0, dt=0.01, tau=5.0):
        th, t, out = 0.0, 0.0, []
        for i in range(int(tend / dt) + 1):
            pw = 1.0 if (per is None or (t % per) < on) else 0.0
            out.append((t, th))
            th += dt * (pw - th) / tau
            t += dt
        return out
    o.append(p.line(sim(None, None), c=ALI, lw=2.2))
    o.append(p.line(sim(20.0, 5.0)[::5], c=GLD, lw=1.6))
    o.append(p.line(sim(2.0, 0.5)[::2], c=SIG, lw=1.6))
    o.append(p.line([(0, 0.25), (40, 0.25)], c=FNT, lw=1, dash="4 3"))
    o.append(T(p.X(39), p.Y(0.95), "流しっぱなし: 1 °C へ", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(9.2), p.Y(0.62), "20 s ごとに 5 s", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(25), p.Y(0.36), "2 s ごとに 0.5 s", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(39), p.Y(0.25) + 14, "平均はどちらも 0.25 °C", "end", 9.5, MUT, True, halo=True))
    # (c) 測る間隔と上昇の平均（サーミスタの例）
    yc = 286
    o.append(T(14, yc, "(c) サーミスタ（225 µW、k_th = 1 °C/mW）の温度の上昇の平均", "start", 11, INK, True))
    q = Plot(90, yc + 16, 470, 150, (0.01, 1000), (1e-7, 1), xlog=True, ylog=True)
    o.append(q.axes(xl="サンプリング周期 T [s]", yl="上昇の平均 [°C]", xt=[0.01, 0.1, 1, 10, 100, 1000],
                    yt=[1e-7, 1e-5, 1e-3, 1e-1], xfmt=lambda v: "%g" % v,
                    yfmt=lambda v: {1e-7: "10⁻⁷", 1e-5: "10⁻⁵", 1e-3: "10⁻³", 1e-1: "0.1"}[v]))
    P, k = 0.225, 1.0
    o.append(q.line([(0.01, k * P), (1000, k * P)], c=ALI, lw=1.6, dash="6 4"))
    o.append(T(q.X(900), q.Y(k * P) - 6, "流しっぱなし 0.23 °C", "end", 9.5, ALI, True, halo=True))
    for ton, c, lab in ((0.001, SIG, "1 ms"), (0.01, TEA, "10 ms"), (0.1, GLD, "100 ms")):
        pts = []
        for i in range(0, 101):
            T_ = 10 ** (-2 + 5 * i / 100.0)
            v = k * P * min(1.0, ton / T_)
            pts.append((T_, max(v, 1e-7)))
        o.append(q.line(pts, c=c, lw=2))
        o.append(T(q.X(1000) + 6, q.Y(k * P * ton / 1000) + 4, "流す時間 " + lab, "start", 9.5, c, True))
    for T_, lab, dx, a in ((1.0, "1 s ごと: 2.3 × 10⁻⁴ °C", 8, "start"), (60.0, "60 s ごと: 3.8 × 10⁻⁶ °C", -8, "end")):
        v = k * P * 0.001 / T_
        o.append(D(q.X(T_), q.Y(v), SIG, 4))
        o.append(T(q.X(T_) + dx, q.Y(v) + 15, lab, a, 9.5, SIG, True, halo=True))
    return SVG(700, yc + 16 + 150 + 44, o, "自己発熱。(a) 09 章のサーミスタの分圧では、25 °C でサーミスタに 225 µW が流れる。(b) 電力を周期的に入れ切りすると、温度の上昇の平均は平均の電力で決まり、周期の長さで変わるのは上下の幅だけである（14 章 1 節の一次の模型で計算した）。(c) 測るときだけ短く流せば、上昇の平均は無視できるほど小さい。")
F["e10_heat"] = _f10_heat()

def _f10_board():
    o = []
    o.append(T(14, 20, "(a) 基板の上で熱になる電力と、温度センサの読みの上昇（基板から周りへ 0.05 °C/mW の例）", "start", 10.5, INK, True))
    rows = [("起きたまま・LED を点ける", [(33, "マイコン 33", SIG), (25, "LED 25", PUR), (25.5, "LDO 25.5", GLD)], "84 mW → +4.2 °C", ALI),
            ("測る間以外は眠り・LED を消す", [(5, "5", SIG)], "5 mW → +0.25 °C", GRN)]
    xb, sc = 220, 4.0
    for i, (nm, segs, res, c) in enumerate(rows):
        y = 40 + i * 34
        o.append(T(xb - 8, y + 15, nm, "end", 10, INK, True))
        xx = xb
        for v, lab, cc in segs:
            o.append(RECT(xx, y, v * sc, 22, 2, soft(cc), cc, 1.1))
            if v * sc > 50:
                o.append(T(xx + v * sc / 2, y + 15, lab, "middle", 9.5, cc, True))
            xx += v * sc
        o.append(T(xx + 8, y + 15, res, "start", 10, c, True))
    o.append(T(xb, 122, "単位は mW（例の値）。マイコン 3.3 V・10 mA、LED 5 V から 5 mA、LDO 5 V → 3.3 V で 15 mA。", "start", 9.5, MUT))
    # (b) 相対湿度の読み
    o.append(T(14, 156, "(b) 周りが 25 °C・50 % のとき、センサが温まると相対湿度は低く読める", "start", 10.5, INK, True))
    p = Plot(90, 172, 420, 150, (0, 5), (35, 52))
    o.append(p.axes(xl="センサの温度の上昇 [°C]", yl="相対湿度の読み [%]", xt=[0, 1, 2, 3, 4, 5], yt=[35, 40, 45, 50],
                    yfmt=lambda v: "%g" % v))
    es = lambda t: 6.112 * math.exp(17.62 * t / (243.12 + t))
    pts = [(d / 20.0, 50 * es(25) / es(25 + d / 20.0)) for d in range(0, 101)]
    o.append(p.line(pts, c=TEA, lw=2.2))
    for d in (1, 4):
        v = 50 * es(25) / es(25 + d)
        o.append(D(p.X(d), p.Y(v), ALI, 4))
        o.append(T(p.X(d) + 8, p.Y(v) - 6, "%d °C で %.1f %%" % (d, v), "start", 9.5, ALI, True, halo=True))
    o.append(T(530, 220, "25 °C 付近では、", "start", 9.5, MUT))
    o.append(T(530, 235, "1 °C の上昇で約 6 %", "start", 9.5, MUT))
    o.append(T(530, 250, "（読みに対する割合）", "start", 9.5, MUT))
    o.append(T(530, 265, "低く読める", "start", 9.5, MUT))
    return SVG(700, 172 + 150 + 44, o, "機器自身の熱。(a) マイコン・LED・LDO の熱で、基板に載せた温度センサは周りより高く読む。測る間以外は眠らせ、LED を消すと小さくなる。(b) 湿度センサが温まると、相対湿度は大きく低く読める（Magnus の近似式で計算した）。")
F["e10_board"] = _f10_board()

# ---- 4 節: 校正 ----
def _f10_ntc_err():
    T25 = 298.15
    def R(th, R25, B):
        return R25 * math.exp(B * (1 / (th + 273.15) - 1 / T25))
    def N(th, R25, B, Rf):
        r = R(th, R25, B); return 4096 * r / (Rf + r)
    def temp(n):
        r = 10e3 * n / (4096 - n); return 1 / (1 / T25 + math.log(r / 10e3) / 3435) - 273.15
    return lambda th: temp(N(th, 10e3 * 0.99, 3435 * 1.01, 10e3 * 1.01))

def _f10_cal():
    o = []
    # (a) オフセット・ゲインと 2 点校正
    o.append(T(14, 20, "(a) オフセット・ゲインと 2 点校正", "start", 11, INK, True))
    p = Plot(70, 36, 240, 190, (0, 50), (0, 62))
    o.append(p.axes(xl="本当の値 y（任意の単位）", yl="読み x", xt=[0, 10, 20, 30, 40, 50], yt=[0, 20, 40, 60],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    g, off = 1.12, 5.0
    o.append(p.line([(0, 0), (50, 50)], c=FNT, lw=1.3, dash="5 4"))
    o.append(T(p.X(47), p.Y(44) + 14, "誤差の無い x = y", "end", 9.5, MUT, halo=True))
    o.append(p.line([(0, off), (50, g * 50 + off)], c=TEA, lw=2.2))
    o.append(T(p.X(4), p.Y(g * 4 + off) - 12, "x = g y + o", "start", 10, TEA, True, halo=True))
    o.append(DIM(p.X(0) + 8, p.Y(0), p.X(0) + 8, p.Y(off), None, c=ALI))
    o.append(T(p.X(0) + 14, p.Y(off / 2) + 4, "オフセット o", "start", 9.5, ALI, True, halo=True))
    for yv in (10, 40):
        xv = g * yv + off
        o.append(W(p.X(yv), p.Y(0), p.X(yv), p.Y(xv), c=SIG, lw=1, dash="3 3"))
        o.append(W(p.X(0), p.Y(xv), p.X(yv), p.Y(xv), c=SIG, lw=1, dash="3 3"))
        o.append(D(p.X(yv), p.Y(xv), SIG, 4.2))
    o.append(T(p.X(10) + 6, p.Y(g * 10 + off) - 8, "(y₁, x₁)", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(40) - 6, p.Y(g * 40 + off) - 8, "(y₂, x₂)", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(31), p.Y(g * 31 + off) + 20, "傾き = ゲイン g", "start", 9.5, TEA, True, halo=True))
    # (b) サーミスタの例の誤差
    o.append(T(370, 20, "(b) サーミスタの例の誤差（固定抵抗 +1 %、R₂₅ −1 %、B +1 %）", "start", 10.5, INK, True))
    q = Plot(410, 36, 270, 190, (-20, 80), (-0.2, 1.5))
    o.append(q.axes(xl="本当の温度 [°C]", yl="誤差 [°C]", xt=[-20, 0, 20, 40, 60, 80], yt=[0, 0.5, 1.0, 1.5],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(RECT(q.X(0), q.y, q.X(40) - q.X(0), q.h, 0, GSOFT, "none", 0, op=0.7))
    o.append(T(q.X(20), q.y + 14, "2 点の間", "middle", 9.5, GRN, True, halo=True))
    ind = _f10_ntc_err()
    x1, x2 = ind(0), ind(40)
    a = 40.0 / (x2 - x1); b = -a * x1
    off25 = ind(25) - 25
    ths = [-20 + i for i in range(101)]
    o.append(q.line([(t, ind(t) - t) for t in ths], c=ALI, lw=2))
    o.append(q.line([(t, ind(t) - off25 - t) for t in ths], c=GLD, lw=1.8, dash="6 3"))
    o.append(q.line([(t, a * ind(t) + b - t) for t in ths], c=GRN, lw=2.2))
    for t in (0, 40):
        o.append(D(q.X(t), q.Y(0), GRN, 3.8))
    o.append(T(q.X(66), q.Y(1.12) - 8, "校正の前", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(78), q.Y(0.6), "1 点（25 °C）", "end", 9.5, GLD, True, halo=True))
    o.append(T(q.X(78), q.Y(0.23), "2 点（0・40 °C）", "end", 9.5, GRN, True, halo=True))
    return SVG(700, 270, o, "2 点校正。(a) 読み x が本当の値 y に対して x = g y + o の直線になるとき、本当の値の分かる 2 点を測れば、読みから本当の値を求める直線 y = a x + b が決まる。(b) 09 章のサーミスタで、部品が許容差の中でずれた例。0 °C と 40 °C の 2 点で校正すると、その間の誤差は 0.016 °C 以下になるが、外では直線を延ばした誤差が増える。")
F["e10_cal"] = _f10_cal()

def _f10_tcomp():
    o = []
    off = lambda th: 2.0 * (th - 25) + 0.01 * (th - 25) ** 2
    o5, o40 = off(5), off(40)
    c = (o40 - o5) / 35.0
    fit = lambda th: o5 + c * (th - 5)
    o.append(T(14, 20, "(a) はかりのオフセットの温度変化と、2 つの温度で決めた直線", "start", 10.5, INK, True))
    p = Plot(80, 36, 250, 190, (-10, 50), (-70, 70))
    o.append(p.axes(xl="センサの温度 θ [°C]", yl="オフセット [g]", xt=[-10, 0, 10, 20, 30, 40, 50], yt=[-60, -30, 0, 30, 60],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    ths = [-10 + i * 0.5 for i in range(121)]
    o.append(p.line([(t, off(t)) for t in ths], c=ALI, lw=2.2))
    o.append(p.line([(-10, fit(-10)), (50, fit(50))], c=SIG, lw=1.5, dash="6 4"))
    for t in (5, 40):
        o.append(D(p.X(t), p.Y(off(t)), SIG, 4.2))
    o.append(T(p.X(5) + 6, p.Y(o5) + 16, "5 °C: −36 g", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(40) - 6, p.Y(o40) - 8, "40 °C: +32 g", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(14), p.Y(30), "c = 1.95 g/°C", "middle", 9.5, SIG, True, halo=True))
    o.append(T(410, 20, "(b) 直した後に残るずれ", "start", 10.5, INK, True))
    q = Plot(440, 36, 240, 190, (-10, 50), (-10, 10))
    o.append(q.axes(xl="センサの温度 θ [°C]", yl="残るずれ [g]", xt=[-10, 0, 10, 20, 30, 40, 50], yt=[-10, -5, 0, 5, 10],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(RECT(q.X(5), q.y, q.X(40) - q.X(5), q.h, 0, GSOFT, "none", 0, op=0.7))
    o.append(T(q.X(22.5), q.y + 14, "5〜40 °C: 3.1 g 以下", "middle", 9.5, GRN, True, halo=True))
    o.append(q.line([(t, off(t) - fit(t)) for t in ths], c=GRN, lw=2.2))
    o.append(T(q.X(-9), q.Y(7.5) + 4, "−10 °C: 7.5 g", "start", 9.5, ALI, True, halo=True))
    return SVG(700, 270, o, "温度補正（例の値）。(a) ひずみゲージのはかりで、何も載せないときの読み（オフセット）が温度で動く。5 °C と 40 °C で測ったオフセットを結ぶ直線（傾き c）を、測ったときのセンサの温度で引く。(b) 直した後に残るずれは、2 つの温度の間では小さいが、外では増える。")
F["e10_tcomp"] = _f10_tcomp()

# ---- 5 節: 3 つのフィルタ ----
def _f10_inputs():
    r = _f10_rng(10)
    n = 60
    noise = [r.gauss(0, 1.0) for _ in range(n)]
    r2 = _f10_rng(11)
    spike = [r2.gauss(0, 0.15) for _ in range(n)]
    spike[18] += 5.0
    spike[40] += 5.0; spike[41] += 5.0
    r3 = _f10_rng(12)
    step = [(4.0 if i >= 20 else 0.0) + r3.gauss(0, 0.15) for i in range(n)]
    return noise, spike, step

def _f10_filt():
    o = []
    noise, spike, step = _f10_inputs()
    cols = [("雑音（σ = 1）", noise, (-3.2, 3.2)), ("とび値（1 回・2 回続けて）", spike, (-1, 6)), ("段差（大きさ 4）", step, (-1, 5))]
    rowsF = [("移動平均", "N = 8", lambda xs: _f10_ma(xs, 8), PUR),
             ("中央値", "3 個", lambda xs: _f10_med(xs, 3), GLD),
             ("一次 IIR", "α = 1/8", lambda xs: _f10_ema(xs, 1.0 / 8), SIG)]
    notes = [["残る雑音 0.35 σ", "1/8 に薄めて 8 回", "9 割まで 8 回"],
             ["残る雑音 0.67 σ", "1 回は消え、2 回は残る", "9 割まで 2 回"],
             ["残る雑音 0.26 σ", "1/8 から減っていく", "9 割まで 18 回"]]
    x0s, y0s, w, h = [118, 314, 510], [52, 140, 228], 180, 72
    for j, (nm, xs, yr) in enumerate(cols):
        o.append(T(x0s[j] + w / 2, 40, nm, "middle", 10.5, INK, True))
    for i, (nm, sub, fn, c) in enumerate(rowsF):
        o.append(T(14, y0s[i] + h / 2 - 2, nm, "start", 10.5, c, True))
        o.append(T(14, y0s[i] + h / 2 + 13, sub, "start", 9.5, MUT))
        for j, (cn, xs, yr) in enumerate(cols):
            p = Plot(x0s[j], y0s[i], w, h, (0, 59), yr)
            o.append(_f10_frame(p))
            o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=GRD, lw=1))
            o.append(_f10_dots(p, [(k, _f10_clip(v, yr[0], yr[1])) for k, v in enumerate(xs)], c=TEA, r=1.7))
            ys = fn(xs)
            o.append(p.line([(k, _f10_clip(v, yr[0], yr[1])) for k, v in enumerate(ys)], c=c, lw=1.9))
            o.append(T(p.x + p.w - 4, p.y + 12, notes[i][j], "end", 9, c, True, halo=True))
    o.append(T(x0s[0], 318, "点: フィルタの入力（測った値）。線: 出力。横軸は測った回（T ごとに 1 つ。各図 60 回）。", "start", 9.5, MUT))
    return SVG(700, 330, o, "3 つのフィルタの比較（入力は乱数で作った例。雑音の値は長い列で求めた標準偏差）。移動平均と一次 IIR は雑音を減らすが、とび値を薄く広げ、段差に遅れる。中央値（3 個）は雑音をあまり減らさないが、1 回だけのとび値を消し、段差に 1 回遅れるだけで追いつく。")
F["e10_filt"] = _f10_filt()

def _f10_iirint():
    o = []
    k = 3
    def naive(x, y):
        d = x - y
        q = abs(d) // (1 << k)
        return y + (q if d >= 0 else -q)
    def good_seq(xs):
        acc, out = None, []
        d = 1 << k; hh = d // 2
        def outv(a):
            return (a + hh) // d if a >= 0 else -((-a + hh) // d)
        for x in xs:
            if acc is None:
                acc = x * d
            else:
                acc += x - outv(acc)
            out.append(outv(acc))
        return out
    n = 120
    xs = [0] + [1000] * n
    yn, y = [], 0
    for x in xs:
        y = naive(x, y) if yn else x
        yn.append(y)
    yg = good_seq(xs)
    yf, s = [], 0.0
    for i, x in enumerate(xs):
        s = x if i == 0 else s + (x - s) / 8.0
        yf.append(s)
    o.append(T(14, 20, "(a) 0 から 1000 への段差（α = 1/8）", "start", 11, INK, True))
    p = Plot(70, 36, 260, 170, (0, 60), (0, 1100))
    o.append(p.axes(xl="測った回 n", yl="出力（値の単位）", xt=[0, 20, 40, 60], yt=[0, 500, 1000],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(i, v) for i, v in enumerate(yf[:61])], c=FNT, lw=1.4, dash="4 3"))
    o.append(p.line([(i, v) for i, v in enumerate(yn[:61])], c=ALI, lw=2))
    o.append(p.line([(i, v) for i, v in enumerate(yg[:61])], c=GRN, lw=1.6))
    o.append(RECT(p.X(20), p.Y(1030), p.X(60) - p.X(20), p.Y(960) - p.Y(1030), 2, "none", MUT, 1, dash="3 2"))
    o.append(T(p.X(40), p.Y(940) + 12, "右に拡大", "middle", 9.5, MUT, halo=True))
    o.append(T(380, 20, "(b) 1000 の近くを拡大", "start", 11, INK, True))
    q = Plot(430, 36, 250, 170, (20, 120), (984, 1003))
    o.append(q.axes(xl="測った回 n", yl="出力", xt=[20, 40, 60, 80, 100, 120], yt=[985, 990, 995, 1000],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    clipq = lambda v: _f10_clip(v, 984, 1003)
    o.append(q.line([(i, clipq(v)) for i, v in enumerate(yf) if i >= 20], c=FNT, lw=1.4, dash="4 3"))
    o.append(q.steps([(i, clipq(v)) for i, v in enumerate(yn) if i >= 20], c=ALI, lw=2))
    o.append(q.steps([(i, clipq(v)) for i, v in enumerate(yg) if i >= 20], c=GRN, lw=2))
    o.append(T(q.X(118), q.Y(993) + 15, "小数部なし: 993 で止まる（手前 7）", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(118), q.Y(1000) - 7, "小数部 3 ビット: 1000 に追いつく", "end", 9.5, GRN, True, halo=True))
    o.append(LEGEND(70, 252, [(ALI, "y += (x − y)/8（小数部なし）"), (GRN, "状態を 8 倍で持つ（本文のコード）"), (FNT, "浮動小数点")]))
    return SVG(700, 264, o, "一次 IIR を整数で作るときの不感帯（α = 1/8）。出力を値の単位の整数で持つと、入力との差が 8 より小さくなった所で動かなくなり、7 だけ手前で止まる。状態を 2^k 倍（ここでは 8 倍）で持って小数部を残すと、入力にちょうど追いつく。")
F["e10_iirint"] = _f10_iirint()

# ---- 6 節: 故障の種類 ----
def _f10_faults():
    o = []
    # 上: ADC の値の目盛と範囲
    X = lambda v: 90 + v / 4095.0 * 580
    y = 46
    o.append(T(14, y + 13, "ADC の値", "start", 10.5, INK, True))
    o.append(RECT(X(0), y, X(215) - X(0), 18, 0, ASOFT, ALI, 1.1))
    o.append(RECT(X(215), y, X(3937) - X(215), 18, 0, GSOFT, GRN, 1.1))
    o.append(RECT(X(3937), y, X(4095) - X(3937), 18, 0, ASOFT, ALI, 1.1))
    o.append(T((X(0) + X(215)) / 2, y - 6, "短絡を疑う", "middle", 9.5, ALI, True))
    o.append(T((X(215) + X(3937)) / 2, y - 6, "使う範囲（−40〜125 °C）", "middle", 9.5, GRN, True))
    o.append(T(X(4095) - 4, y - 6, "断線を疑う", "end", 9.5, ALI, True))
    for v, lab in ((0, "0"), (215, "215"), (2048, "2048（25 °C）"), (3937, "3937"), (4095, "4095")):
        o.append(W(X(v), y + 18, X(v), y + 23, c=MUT, lw=1))
        a = "start" if v == 0 else ("end" if v == 4095 else "middle")
        if v == 3937:
            a = "end"
        o.append(T(X(v) + (0 if a == "middle" else (-1 if a == "end" else 0)), y + 34, lab, a, 9, MUT))
    o.append(D(X(2048), y + 9, GRN, 3.5))
    # 下: 故障の種類
    yh = 112
    hdr = [(14, "故障"), (150, "値の列（例）"), (310, "見つける規則"), (560, "気づくまで")]
    for xx, t in hdr:
        o.append(T(xx, yh, t, "start", 10, MUT, True))
    o.append(W(14, yh + 6, 686, yh + 6, c=LIN, lw=1))
    r = _f10_rng(21)
    rows = [("断線", "open", "範囲の外（3937 より大きい）", "K 回（例 3 回）"),
            ("短絡", "short", "範囲の外（215 より小さい）", "K 回"),
            ("答えない", "comm", "ACK・時間の上限・CRC・ID", "K 回"),
            ("張り付き", "stuck", "同じ値が 30 回続く", "30 回"),
            ("接触不良", "flap", "急変（差が 40 を超える）が続く", "K 回"),
            ("ゆっくりずれる", "drift", "ほかのセンサとの差", "差が幅を超えたら")]
    for i, (nm, kind, rule, tm) in enumerate(rows):
        yy = yh + 16 + i * 40
        o.append(T(14, yy + 20, nm, "start", 10.5, INK, True))
        p = Plot(150, yy + 4, 140, 28, (0, 39), (0, 1))
        o.append(_f10_frame(p))
        vals, gaps = [], []
        for k in range(40):
            base = 0.5 + 0.03 * r.gauss(0, 1)
            if k >= 20:
                if kind == "open": base = 0.97
                elif kind == "short": base = 0.03
                elif kind == "stuck": base = 0.52
                elif kind == "flap": base = 0.5 + (0.38 if k % 2 == 0 else 0.0) + 0.03 * r.gauss(0, 1)
                elif kind == "drift": base = 0.5 + 0.012 * (k - 20) + 0.03 * r.gauss(0, 1)
                elif kind == "comm": gaps.append(k); base = None
            vals.append(base)
        pts = [(k, v) for k, v in enumerate(vals) if v is not None]
        o.append(p.line(pts, c=TEA, lw=1.4))
        for k in gaps:
            if k % 3 == 0:
                o.append(T(p.X(k), p.Y(0.5) + 4, "×", "middle", 10, ALI, True))
        if kind == "drift":
            o.append(p.line([(k, 0.5) for k in range(40)], c=PUR, lw=1.2))
        o.append(W(p.X(20), p.y, p.X(20), p.y + p.h, c=ALI, lw=1, dash="2 2"))
        o.append(T(310, yy + 20, rule, "start", 10, INK))
        o.append(T(560, yy + 20, tm, "start", 10, SIG, True))
    yl = yh + 16 + 6 * 40 + 8
    o.append(T(14, yl, "赤い破線: 故障が起きた時刻。紫の線: 同じ量を測るほかのセンサ。気づくまでの回数に、サンプリング周期 T を掛けた時間がかかる。", "start", 9.5, MUT))
    return SVG(700, yl + 12, o, "故障の種類と、それを見つける規則（09 章のサーミスタの比率測定の例）。断線と短絡は ADC の値の範囲の外に出るように回路を決めておく。張り付きと接触不良は値の変わり方で、範囲の中でゆっくりずれる故障は、ほかのセンサとの比較で見つける。")
F["e10_faults"] = _f10_faults()

def _f10_pipe():
    o = []
    boxes = [("測る", "ADC の値・通信の結果", TEA), ("妥当性の検査", "範囲・通信・張り付き・急変", ALI),
             ("校正", "a x + b・温度補正", GLD), ("中央値 3 個", "とび値を除く", PUR),
             ("一次 IIR", "雑音をならす", SIG), ("使う", "表示・送信・制御", GRN)]
    bw, gap, x0, y0, bh = 96, 18, 15, 24, 58
    for i, (nm, sub, c) in enumerate(boxes):
        x = x0 + i * (bw + gap)
        o.append(BOX(x, y0, bw, bh, nm, sub, c, soft(c), INK, sz=11, ssz=9))
        if i < len(boxes) - 1:
            o.append(ARR(x + bw + 2, y0 + bh / 2, x + bw + gap - 2, y0 + bh / 2, c=MUT, lw=1.5, head=6))
    xc = x0 + 1 * (bw + gap) + bw / 2
    o.append(ARR(xc, y0 + bh + 2, xc, 120, c=ALI, lw=1.4, head=6))
    o.append(BOX(xc - 90, 122, 180, 44, "外れた値は使わない", "範囲の外・通信の失敗", ALI, ASOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(xc, 168, xc, 186, c=ALI, lw=1.4, head=6))
    o.append(BOX(xc - 90, 188, 180, 44, "K 回続けて外れた", "故障と確定（張り付きは 30 回）", ALI, ASOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(xc, 234, xc, 252, c=ALI, lw=1.4, head=6))
    o.append(BOX(xc - 90, 254, 180, 58, "安全な状態へ・記録", "戻すのを試し（08 章）、検査が通るまで使わない（15 章）", ALI, ASOFT, INK, sz=10.5, ssz=9))
    xk = x0 + 2 * (bw + gap) + bw / 2
    o.append(ARR(xk, y0 + bh + 2, xk, 120, c=GLD, lw=1.2, head=6, dash="4 3"))
    o.append(BOX(xk - 58, 122, 116, 44, "ほかのセンサと比較", "校正した単位で", GLD, GOSOFT, INK, sz=10, ssz=9))
    o.append(ARR(xk - 58, 160, xc + 92, 205, c=GLD, lw=1.2, head=6, dash="4 3"))
    # 右下: フィルタの後では見えにくい
    p = Plot(440, 146, 240, 140, (0, 40), (1900, 4300))
    o.append(T(440, 136, "フィルタの後では、故障がゆっくりした変化に見える", "start", 9.5, INK, True))
    o.append(p.axes(xl="測った回 n", yl="ADC の値", xt=[0, 10, 20, 30, 40], yt=[2048, 3000, 4095],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    raw = [2048 if k < 10 else 4095 for k in range(41)]
    o.append(p.steps([(k, v) for k, v in enumerate(raw)], c=ALI, lw=1.8))
    o.append(p.line([(k, v) for k, v in enumerate(_f10_ema(raw, 1.0 / 8))], c=SIG, lw=2))
    o.append(T(p.X(11), p.Y(4095) - 6, "検査の前: すぐ 4095（断線）", "start", 9, ALI, True, halo=True))
    o.append(T(p.X(39), p.Y(2700), "IIR の後: 温度が", "end", 9, SIG, True, halo=True))
    o.append(T(p.X(39), p.Y(2700) + 13, "下がるように見える", "end", 9, SIG, True, halo=True))
    return SVG(700, 330, o, "測った値の流れ。妥当性の検査は、校正とフィルタの前の値で行う。範囲の外や通信に失敗した値は使わず、K 回続けて外れたら故障と確定する。右下: 断線で ADC の値がすぐ 4095 になっても、一次 IIR（α = 1/8）の後では、ゆっくり下がる温度と区別できない。")
F["e10_pipe"] = _f10_pipe()
