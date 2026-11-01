# -*- coding: utf-8 -*-
# 14 章 熱を扱う の図

# ---- 補助: 添字付きの記号（09 章の方法: 添字の次の tspan に dy を付けて元の高さに戻す） ----
def _f14_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """parts = [(文字, 添字, 斜体か), ...]。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    pend = 0
    for s, sub, it in parts:
        o.append('<tspan font-style="%s"%s>%s</tspan>' % ("italic" if it else "normal", (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan>' % (sz * 0.72, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)

# ---- 例の値（本文と同じ）と、板 + むだ時間の模型 ----
_F14_C, _F14_R, _F14_P, _F14_TA, _F14_L = 400.0, 1.25, 80.0, 25.0, 20.0

def _f14_sim(ctrl, tend, dt=0.1, dtc=1.0, T0=25.0, Ta=25.0, L=20.0, P=80.0, Rf=None, C=400.0, rec=1.0):
    """板の温度を厳密な離散化で dt ごとに進める。ctrl(t, 読み) -> u（0〜1）を dtc ごとに呼ぶ。
    返り値 [(t, 板の温度, 読み, u), ...]（rec ごと）。読みは L 秒前の板の温度。"""
    n = int(round(tend / dt)); nd = int(round(L / dt))
    kc = max(1, int(round(dtc / dt))); kr = max(1, int(round(rec / dt)))
    hist = [T0] * (n + 1); T = T0; u = 0.0; out = []; cache = {}
    for k in range(n + 1):
        t = k * dt
        hist[k] = T
        rd = hist[k - nd] if k >= nd else T0
        if k % kc == 0:
            u = ctrl(t, rd)
        if k % kr == 0:
            out.append((t, T, rd, u))
        R = Rf(t) if Rf else _F14_R
        if R not in cache:
            cache[R] = math.exp(-dt / (R * C))
        Ti = Ta + P * u * R
        T = Ti + (T - Ti) * cache[R]
    return out

def _f14_onoff(h, Tset=60.0, min_off=0.0):
    st = {"on": False, "off": 1e9, "t": None}
    def f(t, rd):
        if st["t"] is not None and not st["on"]:
            st["off"] += t - st["t"]
        st["t"] = t
        if st["on"] and rd >= Tset + h:
            st["on"] = False; st["off"] = 0.0
        elif (not st["on"]) and rd <= Tset - h and st["off"] >= min_off:
            st["on"] = True
        return 1.0 if st["on"] else 0.0
    return f

def _f14_pid(Kp, Ti, Td, aw=True, dt=1.0, Tset=60.0, trace=None):
    st = {"I": 0.0, "y1": None}
    def f(t, y):
        e = Tset - y
        y1 = st["y1"] if st["y1"] is not None else y
        P = Kp * e
        D = -Kp * Td * (y - y1) / dt if Td else 0.0
        st["y1"] = y
        dI = (Kp * dt / Ti * e) if Ti else 0.0
        u0 = P + st["I"] + D
        if aw:
            if not ((u0 >= 1.0 and dI > 0) or (u0 <= 0.0 and dI < 0)):
                st["I"] += dI
            st["I"] = min(max(st["I"], 0.0), 1.0)
        else:
            st["I"] += dI
        if trace is not None:
            trace.append((t, st["I"]))
        return min(max(P + st["I"] + D, 0.0), 1.0)
    return f

def _f14_line(p, pts, c, lw=2.0, dash=None, xr=None, yr=None):
    """Plot p の範囲に切り詰めた折れ線（範囲の外の点は端に寄せる）。"""
    y0, y1 = p.yr
    q = [(p.X(a), p.Y(min(max(b, min(y0, y1)), max(y0, y1)))) for a, b in pts if p.xr[0] - 1e-9 <= a <= p.xr[1] + 1e-9]
    return PL(q, c=c, lw=lw, dash=dash)

def _f14_strip(x0, y, w, t0, t1, pts, c=PUR, h=12, label=None):
    """ヒータの出力（0〜1）の帯。pts = [(t, u), ...]。"""
    o = [RECT(x0, y, w, h, 2, SCR, LIN, 0.8)]
    X = lambda t: x0 + (t - t0) / (t1 - t0) * w
    q = [(X(t0), y + h)]
    for t, u in pts:
        if t0 <= t <= t1:
            q.append((X(t), y + h - u * h))
    q.append((X(t1), y + h))
    o.append(PL(q, c=c, lw=0.8, fill=soft(c)))
    if label:
        o.append(T(x0 - 6, y + h - 2, label, "end", 9.5, c))
    return "".join(o)

# ---- 1 節: 熱の流れと電気の回路 ----
def _f14_model_fig():
    o = []
    o.append(T(14, 18, "(a) 保温プレートの熱の流れ", "start", 11.5, INK, True))
    # 板・ヒータ・センサ
    px, py, pw, ph = 70, 118, 240, 26
    o.append(RECT(px, py, pw, ph, 4, MSOFT, MUT, 1.4))
    o.append(T(px + pw / 2, py + 17, "アルミニウムの板（440 g）", "middle", 10.5, INK, True))
    o.append(RECT(px + 20, py + ph, pw - 40, 9, 2, PSOFT, PUR, 1.2))
    o.append(T(px + 20, py + ph + 24, "ヒータ（100 V・80 W）", "start", 10, PUR, True))
    o.append(RECT(px + pw - 54, py - 10, 22, 10, 2, TSOFT, TEA, 1.2))
    o.append(T(px + pw - 43, py - 16, "NTC サーミスタ", "middle", 9.5, TEA, True))
    # 逃げる熱（上へ）
    for xx in (px + 30, px + 85, px + 140):
        o.append(PATH("M%g,%g c-6,-8 6,-14 0,-22 c-6,-8 6,-14 0,-22" % (xx, py - 4), c=GLD, lw=1.5))
        o.append(_head(xx, py - 40, xx, py - 50, GLD, 6))
    o.append(_f14_m(px + 6, py - 64, [("逃げる熱 (", None, False), ("T", None, True), (" − ", None, False), ("T", "a", True), (") ÷ ", None, False), ("R", "th", True)], "start", 10.5, GLD, True))
    o.append(_f14_m(px + 6, py - 82, [("周りの空気（周囲温度 ", None, False), ("T", "a", True), ("）", None, False)], "start", 10.5, MUT))
    # 入る熱
    o.append(ARR(px + pw - 40, py + ph + 52, px + pw - 40, py + ph + 12, c=GLD, lw=2))
    o.append(_f14_m(px + pw - 32, py + ph + 44, [("入る熱 ", None, False), ("P", None, True)], "start", 10.5, GLD, True))
    o.append(_f14_m(px + 6, py + ph + 78, [("板にたまる熱 ", None, False), ("C", "th", True), (" d", None, False), ("T", None, True), ("/d", None, False), ("t", None, True), ("（温度が上がる）", None, False)], "start", 10.5, SIG))
    # (b) 電気の回路との対応
    xb = 380
    o.append(T(xb, 18, "(b) 同じ形の電気の回路", "start", 11.5, INK, True))
    yt, yb = 60, 170
    xs, xn, xc, xr = xb + 40, xb + 140, xb + 200, xb + 270
    o.append(W(xs, yt, xr, yt, c=INK, lw=1.5))
    o.append(W(xs, yb, xr, yb, c=INK, lw=1.5))
    # 電流源
    o.append(W(xs, yt, xs, yt + 32, c=INK, lw=1.5)); o.append(W(xs, yb, xs, yb - 32, c=INK, lw=1.5))
    o.append(CIRC(xs, (yt + yb) / 2, 22, GLD, 1.6))
    o.append(ARR(xs, (yt + yb) / 2 + 12, xs, (yt + yb) / 2 - 12, c=GLD, lw=1.6, head=6))
    o.append(_f14_m(xs - 28, (yt + yb) / 2 + 4, [("P", None, True)], "end", 12, GLD, True))
    # コンデンサ
    ym = (yt + yb) / 2
    o.append(W(xc, yt, xc, ym - 4, c=INK, lw=1.5)); o.append(W(xc - 13, ym - 4, xc + 13, ym - 4, c=SIG, lw=2.2))
    o.append(W(xc - 13, ym + 4, xc + 13, ym + 4, c=SIG, lw=2.2)); o.append(W(xc, ym + 4, xc, yb, c=INK, lw=1.5))
    o.append(_f14_m(xc - 18, ym + 4, [("C", "th", True)], "end", 12, SIG, True))
    # 抵抗
    pts = [(xr, yt), (xr, yt + 26)]
    for i in range(6):
        pts.append((xr + (6 if i % 2 == 0 else -6), yt + 30 + i * 9 + 4))
    pts += [(xr, yt + 88), (xr, yb)]
    o.append(PL(pts, c=GLD, lw=1.6))
    o.append(_f14_m(xr + 12, ym + 4, [("R", "th", True)], "start", 12, GLD, True))
    o.append(D(xn, yt, INK, 3.4))
    o.append(_f14_m(xn, yt - 8, [("T", None, True), ("（板の温度）", None, False)], "middle", 10.5, INK, True))
    o.append(_f14_m(xn, yb + 18, [("T", "a", True), ("（周囲温度。電気の GND にあたる）", None, False)], "middle", 10, MUT))
    rows = [("温度の差 [K]", "電圧 [V]"), ("熱の流れ [W]", "電流 [A]"), ("熱抵抗 [K/W]", "抵抗 [Ω]"), ("熱容量 [J/K]", "容量 [F]"), ("熱時定数 R·C [s]", "時定数 R·C [s]")]
    yy = yb + 40
    o.append(T(xb + 30, yy, "熱", "start", 10, INK, True)); o.append(T(xb + 175, yy, "電気", "start", 10, INK, True))
    for i, (a_, b_) in enumerate(rows):
        o.append(T(xb + 30, yy + 16 + i * 15, a_, "start", 10, MUT))
        o.append(T(xb + 150, yy + 16 + i * 15, "↔", "start", 10, MUT))
        o.append(T(xb + 175, yy + 16 + i * 15, b_, "start", 10, MUT))
    return SVG(700, yy + 16 + 5 * 15, o, "保温プレートの熱の流れ。(a) ヒータの電力は板の中で熱になり、一部が板を温め、残りが周りの空気へ逃げる。逃げる速さは、板と周りの温度の差に比例する。(b) 熱の流れは、電流源とコンデンサと抵抗の回路と同じ形の式で表せる。")
F["e14_model"] = _f14_model_fig()

def _f14_step_fig():
    o = []
    o.append(T(14, 18, "(a) 80 W を入れ続ける（周囲温度 25 °C から）", "start", 11.5, INK, True))
    p = Plot(62, 34, 360, 200, (0, 2000), (20, 130))
    o.append(p.axes(xl="時間 [s]", yl="板の温度 [°C]", xt=[0, 500, 1000, 1500, 2000], yt=[20, 40, 60, 80, 100, 120]))
    def curve(R, C, P=80.0):
        tau = R * C
        return [(t, 25 + P * R * (1 - math.exp(-t / tau))) for t in range(0, 2001, 10)]
    o.append(_f14_line(p, curve(0.625, 400), TEA, 2.0, "6 4"))
    o.append(_f14_line(p, curve(1.25, 800), PUR, 2.0, "2 3"))
    o.append(_f14_line(p, curve(1.25, 400), SIG, 2.4))
    # 接線と目印
    o.append(W(p.X(0), p.Y(25), p.X(500), p.Y(125), c=MUT, lw=1.1, dash="4 3"))
    o.append(W(p.X(0), p.Y(125), p.X(2000), p.Y(125), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(2000) - 2, p.Y(125) - 5, "行き着く温度 125 °C", "end", 9.5, MUT, halo=True))
    o.append(D(p.X(500), p.Y(88.2), SIG, 3.6))
    o.append(T(p.X(500) + 8, p.Y(88.2) + 14, "τ = 500 s で 63.2 %（88.2 °C）", "start", 9.5, SIG, True, halo=True))
    o.append(D(p.X(1500), p.Y(120.0), SIG, 3.6))
    o.append(T(p.X(1500), p.Y(120.0) + 16, "3τ で 95 %", "middle", 9.5, SIG, True, halo=True))
    o.append(W(p.X(0), p.Y(60), p.X(215), p.Y(60), c=GRN, lw=1.1, dash="3 3"))
    o.append(W(p.X(215), p.Y(60), p.X(215), p.Y(20), c=GRN, lw=1.1, dash="3 3"))
    o.append(T(p.X(215) + 4, p.Y(24) - 2, "60 °C に 215 s", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(40), p.Y(108), "接線の傾き P ÷ C = 0.2 K/s", "start", 9.5, MUT, halo=True))
    o.append(T(p.X(1980), p.Y(98), "熱容量 2 倍: 同じ温度へ遅く", "end", 9.5, PUR, True, halo=True))
    o.append(T(p.X(1980), p.Y(68), "熱抵抗 1/2（風）: 75 °C 止まり", "end", 9.5, TEA, True, halo=True))
    # (b) 切ったとき
    o.append(T(470, 18, "(b) 60 °C で切る", "start", 11.5, INK, True))
    q = Plot(500, 34, 180, 200, (0, 1500), (20, 70))
    o.append(q.axes(xl="切ってからの時間 [s]", yl="", xt=[0, 500, 1000, 1500], yt=[20, 30, 40, 50, 60, 70]))
    o.append(_f14_line(q, [(t, 25 + 35 * math.exp(-t / 500.0)) for t in range(0, 1501, 10)], SIG, 2.4))
    o.append(W(q.X(0), q.Y(25), q.X(1500), q.Y(25), c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(1500) - 2, q.Y(25) + 13, "周囲温度 25 °C", "end", 9.5, MUT, halo=True))
    o.append(D(q.X(973), q.Y(30), SIG, 3.6))
    o.append(T(q.X(973) + 2, q.Y(30) - 12, "973 s で 30 °C", "start", 9.5, SIG, True, halo=True))
    return SVG(700, 280, o, "温度の時間変化（熱抵抗 1.25 K/W、熱容量 400 J/K、80 W）。(a) 温め始めの傾きは P ÷ C で、その接線は熱時定数 τ で行き着く温度に届く。熱容量を 2 倍にすると同じ温度へ遅く近づき、風で熱抵抗が半分になると、行き着く温度が下がり、速さも変わる。(b) 切ると、周囲温度との差が同じ τ で減る。")
F["e14_step"] = _f14_step_fig()

# ---- 2 節: オンオフ制御 ----
def _f14_onoff_fig():
    o = []
    def panel(x, title, L, sub):
        o.append(T(x - 48, 18, title, "start", 11.5, INK, True))
        o.append(T(x - 48, 34, sub, "start", 9.5, MUT))
        r = _f14_sim(_f14_onoff(0.5), 1800, dt=0.05, dtc=0.05, T0=60.0, L=L, rec=0.5)
        r = [(t - 1500, a, b, u) for t, a, b, u in r if t >= 1500]
        p = Plot(x, 48, 250, 150, (0, 300), (57, 64))
        o.append(p.axes(xl="時間 [s]", yl="温度 [°C]", xt=[0, 100, 200, 300], yt=[57, 58, 59, 60, 61, 62, 63, 64]))
        for v in (59.5, 60.5):
            o.append(W(p.X(0), p.Y(v), p.X(300), p.Y(v), c=GRN, lw=1, dash="4 3"))
        if L > 0:
            o.append(_f14_line(p, [(t, b) for t, a, b, u in r], TEA, 1.6, "5 3"))
        o.append(_f14_line(p, [(t, a) for t, a, b, u in r], SIG, 2.2))
        o.append(_f14_strip(p.x, p.y + p.h + 36, p.w, 0, 300, [(t, u) for t, a, b, u in r], PUR, 12, "ヒータ"))
        return p, r
    pa, ra = panel(62, "(a) むだ時間なし", 0.0, "59.5〜60.5 °C を 22 s ごとに往復")
    o.append(T(pa.X(298), pa.Y(61.4), "しきい値 60 ± 0.5", "end", 9.5, GRN, halo=True))
    pb, rb = panel(420, "(b) むだ時間 20 s", 20.0, "58.15〜63.03 °C を 106.6 s ごとに往復")
    o.append(W(pb.X(0), pb.Y(63.03), pb.X(300), pb.Y(63.03), c=ALI, lw=1, dash="2 3"))
    o.append(W(pb.X(0), pb.Y(58.15), pb.X(300), pb.Y(58.15), c=ALI, lw=1, dash="2 3"))
    o.append(T(pb.X(298), pb.Y(63.03) - 4, "行き過ぎ 2.53 K", "end", 9.5, ALI, True, halo=True))
    o.append(T(pb.X(298), pb.Y(58.15) + 12, "下がり過ぎ 1.35 K", "end", 9.5, ALI, True, halo=True))
    yl = 270
    o.append(LEGEND(62, yl, [(SIG, "板の温度"), (TEA, "センサの読み（20 s 遅れ）"), (GRN, "しきい値"), (PUR, "ヒータの入れ切り")]))
    # (c) 入れ切りの回数とリレーの寿命
    yc = 300
    o.append(T(14, yc, "(c) 入れ切りの回数と温度の振れ幅（リレーの寿命は 10 万回として）", "start", 11.5, INK, True))
    rows = [("むだ時間なし・h 0.5 K", 3931, "1.0 K", "25 日"),
            ("むだ時間 20 s・h 0.5 K", 810, "4.9 K", "123 日"),
            ("むだ時間 20 s・h 2 K", 509, "7.8 K", "197 日"),
            ("20 s・h 0.5 K・最短 120 s", 476, "8.1 K", "210 日")]
    bx, bw = 210, 250
    o.append(T(bx, yc + 22, "1 日の入れ切りの回数", "start", 9.5, MUT))
    o.append(T(560, yc + 22, "振れ幅", "middle", 9.5, MUT))
    o.append(T(640, yc + 22, "寿命", "middle", 9.5, MUT))
    for i, (nm, n, sw, life) in enumerate(rows):
        y = yc + 32 + i * 24
        w = bw * n / 4000.0
        o.append(T(bx - 8, y + 13, nm, "end", 10, INK))
        o.append(RECT(bx, y + 2, w, 15, 2, soft(PUR), PUR, 1.1))
        o.append(T(bx + w + 6, y + 14, "%d 回" % n, "start", 10, PUR, True))
        o.append(T(560, y + 14, sw, "middle", 10, SIG, True))
        o.append(T(640, y + 14, life, "middle", 10, ALI if i == 0 else GLD, True))
    return SVG(700, yc + 32 + 4 * 24 + 6, o, "オンオフ制御（目標 60 °C、h = 0.5 K）。(a) 読みが板の温度と同じなら、温度はしきい値の間を往復する。(b) 読みが 20 s 遅れると、しきい値を越えた後もヒータが入ったまま・切れたままになり、温度は大きく行き過ぎ、往復はゆっくりになる。(c) h を広げる、切ってから入れるまでの最短の時間を置くと回数は減るが、振れ幅が広がり、それでもリレーの寿命は 1 年に届かない。")
F["e14_onoff"] = _f14_onoff_fig()

# ---- 3 節: P・PI・PID の比較 ----
def _f14_pcmp_fig():
    o = []
    Rd = lambda t: 0.8 if t >= 1200 else _F14_R
    cases = [("(a) P（Kp 0.3 /K）", (0.3, 0, 0), "定常偏差 1.13 K → 風の後 1.73 K"),
             ("(b) PI（Kp 0.3 /K・Ti 40 s）", (0.3, 40, 0), "偏差は 0 に向かうが、振れ続ける"),
             ("(c) PID（Kp 0.3 /K・Ti 40 s・Td 10 s）", (0.3, 40, 10), "行き過ぎ 0.77 K。風の後 0.83 K 下がって戻る")]
    y = 12
    for title, g, note in cases:
        r = _f14_sim(_f14_pid(*g), 2400, dt=0.1, Rf=Rd, rec=2.0)
        o.append(T(14, y + 12, title, "start", 11, INK, True))
        o.append(T(686, y + 12, note, "end", 10, SIG, True))
        p = Plot(62, y + 20, 610, 82, (0, 2400), (54, 66))
        o.append(p.axes(xl=None, yl=None, xt=[0, 400, 800, 1200, 1600, 2000, 2400], yt=[54, 57, 60, 63, 66]))
        o.append(T(p.x - 34, p.y + p.h / 2 + 4, "°C", "middle", 9.5, MUT))
        o.append(W(p.X(0), p.Y(60), p.X(2400), p.Y(60), c=GRN, lw=1, dash="4 3"))
        o.append(W(p.X(1200), p.y, p.X(1200), p.y + p.h, c=ALI, lw=1, dash="3 3"))
        o.append(_f14_line(p, [(t, a) for t, a, b, u in r], SIG, 2.0))
        y += 128
    o.append(T(62 + 305, y + 4, "時間 [s]（1200 s に風が当たり、熱抵抗が 1.25 → 0.8 K/W）", "middle", 10, MUT))
    o.append(T(62 + 610 * 1200 / 2400 + 4, 44, "風", "start", 9.5, ALI, True, halo=True))
    return SVG(700, y + 14, o, "冷えた板（25 °C）から 60 °C へ温め、1200 s に風が当たって熱を逃がしやすくなった場合（むだ時間 20 s）。温度の目盛は 54〜66 °C を拡大した。(a) P 制御は目標より低い所に落ち着き、熱が逃げやすくなると偏差が増える。(b) 積分を加えると偏差は 0 に向かうが、この強さでは振動が収まらない。(c) 微分を加えると振動が収まり、風の後もすぐに戻る。")
F["e14_pcmp"] = _f14_pcmp_fig()

# ---- 3 節: 積分の飽和 ----
def _f14_windup_fig():
    o = []
    trA, trB = [], []
    rA = _f14_sim(_f14_pid(0.3, 40, 10, aw=False, trace=trA), 1200, dt=0.1, rec=1.0)
    rB = _f14_sim(_f14_pid(0.3, 40, 10, aw=True, trace=trB), 1200, dt=0.1, rec=1.0)
    o.append(T(14, 18, "(a) 板の温度", "start", 11.5, INK, True))
    p = Plot(62, 30, 610, 150, (0, 1200), (20, 90))
    o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 200, 400, 600, 800, 1000, 1200], yt=[20, 40, 60, 80]))
    o.append(W(p.X(0), p.Y(60), p.X(1200), p.Y(60), c=GRN, lw=1, dash="4 3"))
    o.append(_f14_line(p, [(t, a) for t, a, b, u in rA], ALI, 2.2))
    o.append(_f14_line(p, [(t, a) for t, a, b, u in rB], GRN, 2.2))
    o.append(T(p.X(472), p.Y(86.0) - 6, "対策なし: 86.0 °C まで", "middle", 10, ALI, True, halo=True))
    o.append(T(p.X(300), p.Y(60) + 16, "対策あり: 行き過ぎ 0.77 K", "start", 10, GRN, True, halo=True))
    o.append(T(p.X(8), p.Y(60) - 6, "目標 60 °C", "start", 9.5, GRN, halo=True))
    o.append(T(p.X(1042), p.Y(44.6) + 16, "その後 44.6 °C まで下がる", "middle", 10, ALI, True, halo=True))
    # (b) 積分の項
    o.append(T(14, 220, "(b) 積分の項（出力の 100 % を 1 として）", "start", 11.5, INK, True))
    q = Plot(62, 232, 610, 110, (0, 1200), (-25, 35))
    o.append(q.axes(xl="時間 [s]", yl="積分の項", xt=[0, 200, 400, 600, 800, 1000, 1200], yt=[-20, -10, 0, 10, 20, 30]))
    o.append(W(q.X(0), q.Y(1), q.X(1200), q.Y(1), c=MUT, lw=1, dash="4 3"))
    o.append(_f14_line(q, [(t, i) for t, i in trA], ALI, 2.2))
    o.append(_f14_line(q, [(t, i) for t, i in trB], GRN, 2.2))
    o.append(T(q.X(250), q.Y(31.6) + 2, "温度が目標に届くころ約 31（100 % の約 30 倍）", "start", 10, ALI, True, halo=True))
    o.append(T(q.X(150), q.Y(1) - 6, "対策あり: 0〜1 に収まる", "start", 9.5, GRN, True, halo=True))
    o.append(T(q.X(760), q.Y(-20.5) + 2, "負にも大きくたまる（約 −20）", "start", 10, ALI, True, halo=True))
    o.append(T(14, 376, "出力", "start", 10, INK, True))
    o.append(_f14_strip(q.x, 380, q.w, 0, 1200, [(t, u) for t, a, b, u in rA], ALI, 10, "なし"))
    o.append(_f14_strip(q.x, 396, q.w, 0, 1200, [(t, u) for t, a, b, u in rB], GRN, 10, "あり"))
    return SVG(700, 414, o, "冷えた板から温めるときの積分の飽和（Kp 0.3 /K・Ti 40 s・Td 10 s、むだ時間 20 s）。出力が 100 % に張り付いている間に積分の項がたまり続け、目標を越えても減り終わるまで出力は 100 % のままで、温度は 26 K 行き過ぎる。その間に積分の項は負に大きくたまり、今度は大きく下がる。張り付いている間は積分を止め、積分の項を出力の範囲に収めると、行き過ぎは 0.77 K になる。")
F["e14_windup"] = _f14_windup_fig()

# ---- 3 節: ステップ応答から K・L・τ を読む ----
def _f14_steptest_fig():
    o = []
    r = _f14_sim(lambda t, rd: 0.5, 2000, dt=0.1, rec=2.0)
    p = Plot(62, 24, 420, 210, (0, 2000), (20, 80))
    o.append(p.axes(xl="出力を 50 % にしてからの時間 [s]", yl="温度 [°C]", xt=[0, 500, 1000, 1500, 2000], yt=[20, 30, 40, 50, 60, 70, 80]))
    o.append(_f14_line(p, [(t, b) for t, a, b, u in r], TEA, 2.4))
    o.append(W(p.X(0), p.Y(75), p.X(2000), p.Y(75), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(1990), p.Y(75) - 5, "落ち着く温度 75 °C（+50 K）", "end", 9.5, MUT, halo=True))
    o.append(D(p.X(520), p.Y(56.6), TEA, 3.8))
    o.append(W(p.X(520), p.Y(56.6), p.X(520), p.Y(20), c=TEA, lw=1, dash="3 3"))
    o.append(T(p.X(520) + 6, p.Y(56.6) + 14, "63 %（56.6 °C）に L + τ = 520 s", "start", 9.5, TEA, True, halo=True))
    # 拡大
    zx, zy = 520, 30
    o.append(T(zx, zy - 10, "始めの 120 s を拡大", "start", 10, INK, True))
    z = Plot(zx + 30, zy, 130, 110, (0, 120), (24, 30))
    o.append(z.axes(xl="[s]", yl=None, xt=[0, 20, 60, 120], yt=[24, 26, 28, 30]))
    o.append(_f14_line(z, [(t, a) for t, a, b, u in r], SIG, 1.6, "4 3"))
    o.append(_f14_line(z, [(t, b) for t, a, b, u in r], TEA, 2.2))
    o.append(DIM(z.X(0), z.Y(29), z.X(20), z.Y(29), None, c=ALI))
    o.append(T(z.X(10), z.Y(29) - 6, "L = 20 s", "middle", 9.5, ALI, True, halo=True))
    o.append(T(z.X(118), z.Y(27.5) - 18, "板", "end", 9.5, SIG, halo=True))
    o.append(T(z.X(118), z.Y(25.6) + 2, "読み", "end", 9.5, TEA, halo=True))
    # 読んだ値と目安
    yb = 196
    lines = [("読んだ値: K = 50 K ÷ 0.5 = 100 K", INK, False), ("L = 20 s、τ = 500 s", INK, False),
             ("ジーグラとニコルスの目安（PID）:", INK, True), ("Kp = 1.2τ ÷ (KL) = 0.3 /K", INK, False),
             ("Ti = 2L = 40 s、Td = 0.5L = 10 s", INK, False), ("穏やかな値: 0.15 /K・80 s・10 s", GRN, True)]
    for i, (l, c, bb) in enumerate(lines):
        o.append(T(zx - 10, yb + i * 16, l, "start", 9.5, c, bb))
    return SVG(700, 292, o, "ステップ応答（出力を 0 から 50 % へ変え、制御せずに読みを記録する）。読みが動き始めるまでの時間がむだ時間 L、そこから上がり幅の 63 % に届くまでが熱時定数 τ、出力 1 あたりの上がり幅が K である。この 3 つから、ゲインの目安を求める。")
F["e14_steptest"] = _f14_steptest_fig()

# ---- 4 節: SSR ----
def _f14_ssr_fig():
    o = []
    o.append(T(14, 18, "(a) SSR の中（ゼロクロス形）", "start", 11.5, INK, True))
    # 入力側
    o.append(BOX(14, 50, 64, 40, "マイコン", "GPIO", SIG, SSOFT, sz=11, ssz=9.5))
    o.append(W(78, 70, 98, 70, c=SIG, lw=1.6))
    o.append(BOX(98, 52, 62, 36, "トランジスタ", None, SIG, PAN, sz=9.5))
    o.append(W(129, 88, 129, 108, c=MUT, lw=1.2))
    o.append(T(129, 120, "プルダウン抵抗", "middle", 9.5, MUT))
    o.append(T(129, 133, "（リセット中は切れる）", "middle", 9.5, MUT))
    # SSR の枠
    sx, sy, sw, sh = 176, 36, 250, 150
    o.append(RECT(sx, sy, sw, sh, 8, PAN, INK, 1.4))
    o.append(T(sx + sw - 8, sy + sh - 8, "SSR", "end", 11, INK, True))
    o.append(W(160, 70, sx + 18, 70, c=SIG, lw=1.6))
    o.append(BOX(sx + 14, 56, 54, 30, "LED", None, SIG, SSOFT, sz=10))
    o.append(W(sx + 82, sy + 4, sx + 82, sy + sh - 4, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(sx + 82, sy + sh + 14, "絶縁（光で結ぶ）", "middle", 9.5, ALI, True))
    for k in range(3):
        o.append(ARR(sx + 70, 64 + k * 8, sx + 96, 64 + k * 8, c=GLD, lw=1.1, head=5))
    o.append(BOX(sx + 98, 50, 70, 40, "受光の", "トライアック", PUR, PSOFT, sz=9.5, ssz=8.5))
    o.append(BOX(sx + 98, 104, 70, 40, "ゼロクロス", "検出", PUR, PSOFT, sz=9.5, ssz=8.5))
    o.append(BOX(sx + 180, 76, 64, 44, "トライアック", "（主）", PUR, PSOFT, sz=9, ssz=8.5))
    o.append(W(sx + 168, 70, sx + 180, 90, c=PUR, lw=1.2))
    o.append(W(sx + 168, 124, sx + 180, 106, c=PUR, lw=1.2))
    # 出力側
    o.append(W(sx + 244, 98, 470, 98, c=GLD, lw=2))
    o.append(BOX(470, 80, 70, 36, "ヒータ", None, PUR, PSOFT, sz=10.5))
    o.append(W(540, 98, 560, 98, c=GLD, lw=2))
    o.append(BOX(560, 76, 60, 44, "商用電源", "100 V", GLD, GOSOFT, sz=9.5, ssz=9))
    o.append(T(sx + sw + 8, 130, "入っている間 1〜1.5 V → 熱", "start", 9.5, ALI, True))
    o.append(T(sx + sw + 8, 146, "切っても漏れ電流（数 mA）", "start", 9.5, ALI, True))
    o.append(T(sx + sw + 8, 162, "壊れると短絡しやすい", "start", 9.5, ALI, True))
    o.append(T(sx + sw + 8, 178, "（値は代表値）", "start", 9.5, MUT))
    # (b) リレーとの比較
    yb = 224
    o.append(T(14, yb, "(b) リレー（12 章 5 節）と SSR", "start", 11.5, INK, True))
    rows = [("入れ切りの回数", "接点が傷む（10 万回程度）", "回数では傷まない", ALI, GRN),
            ("入れる瞬間", "動作時間がばらつく", "ゼロクロスで入る", GLD, GRN),
            ("入っている間の熱", "ほとんど出ない", "電圧 × 電流の熱（放熱が要る）", GRN, ALI),
            ("切っている間", "電流は流れない", "漏れ電流が流れる", GRN, ALI),
            ("壊れたとき", "溶着すると入ったまま", "短絡して入ったままが多い", ALI, ALI)]
    x1, x2, x3 = 14, 170, 430
    o.append(T(x2, yb + 22, "リレー", "start", 10, INK, True)); o.append(T(x3, yb + 22, "SSR", "start", 10, INK, True))
    for i, (nm, a_, b_, ca, cb) in enumerate(rows):
        y = yb + 40 + i * 19
        o.append(T(x1, y, nm, "start", 10, INK))
        o.append(T(x2, y, a_, "start", 10, ca))
        o.append(T(x3, y, b_, "start", 10, cb))
    return SVG(700, yb + 40 + 5 * 19, o, "ソリッドステートリレー（SSR）。(a) 入力の LED の光で受光のトライアックを入れ、それが主のトライアックのゲートに電流を流す。ゼロクロス形は、交流の電圧がゼロクロスを通るときにだけ入る。入力と出力は光で結ばれ、絶縁されている。(b) リレーとの比較（値は代表値）。")
F["e14_ssr"] = _f14_ssr_fig()

# ---- 4 節: 交流の入れ切りの方法 ----
def _f14_cycle_fig():
    o = []
    ncy = 20                       # 50 Hz の 20 周期 = 0.4 s
    x0, w = 170, 390
    X = lambda c: x0 + c / ncy * w
    pat_spread, acc = [], 0
    for k in range(ncy):
        acc += 300
        if acc >= 1000:
            acc -= 1000; pat_spread.append(1)
        else:
            pat_spread.append(0)
    pat_burst = [1 if (k % 10) < 3 else 0 for k in range(ncy)]
    alpha = 108.64 / 180.0           # 半周期の割合
    halfpat = [1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0] * 2   # 半周期ごとの例（正と負がそろわない）
    rows = [("(a) 位相制御（α 109°）", "半周期の途中で入れる: ノイズ・高調波", "phase", ALI),
            ("(b) 窓でまとめる（10 周期に 3）", "窓（0.2 s）ごとに: 電流が大きく揺れる", pat_burst, GLD),
            ("(c) 散らす（cycle_on）", "入れる周期が: 散らばる", pat_spread, GRN),
            ("(d) 半周期単位（例）", "正と負の数がずれる: 直流の成分", "half", ALI)]
    y = 26
    o.append(T(14, 16, "出力 30 %、50 Hz の 20 周期（0.4 s）。灰色は電源の電圧の形、色は流れる電流", "start", 10.5, INK, True))
    for nm, note, pat, c in rows:
        amp = 16
        ym = y + 24
        o.append(T(14, ym + 4, nm, "start", 10, INK, True))
        o.append(W(x0, ym, x0 + w, ym, c=FNT, lw=0.8))
        ref, cur = [], []
        segs = []
        N = ncy * 40
        for i in range(N + 1):
            ph = i / 40.0                  # 周期の単位
            v = math.sin(2 * math.pi * ph)
            ref.append((X(ph), ym - amp * v))
            k = min(int(ph), ncy - 1)
            hk = min(int(ph * 2), 2 * ncy - 1)
            if pat == "phase":
                fr = (ph * 2) % 1.0
                on = fr >= alpha
            elif pat == "half":
                on = halfpat[hk] == 1
            else:
                on = pat[k] == 1
            segs.append((X(ph), ym - amp * v if on else ym))
        o.append(PL(ref, c=FNT, lw=0.9, dash="2 2"))
        o.append(PL(segs, c=c, lw=1.6))
        o.append(T(x0 + w + 6, ym - 4, note.split(": ")[0], "start", 9.5, c, True))
        if ": " in note:
            o.append(T(x0 + w + 6, ym + 10, note.split(": ")[1], "start", 9.5, c, True))
        y += 62
    o.append(W(X(0), y + 4, X(ncy), y + 4, c=MUT, lw=1))
    for k in range(0, ncy + 1, 5):
        o.append(W(X(k), y + 4, X(k), y + 8, c=MUT, lw=1))
        o.append(T(X(k), y + 20, "%d" % (k * 20), "middle", 9.5, MUT))
    o.append(T(X(ncy / 2), y + 36, "時間 [ms]", "middle", 9.5, MUT))
    return SVG(700, y + 44, o, "交流のヒータの入れ切りの方法（どれも平均の電力は約 30 %）。(a) 位相制御は半周期の途中で電流を流し始めるので、ノイズと波形のひずみを出す。(b) サイクル単位の制御で、窓の中でまとめて入れると、窓の周期で電流と温度が揺れる。(c) 周期ごとに出力を足し込んで散らすと、揺れが細かくなる。(d) 半周期を単位にすると、正と負の半周期の数がそろわず、直流の成分が流れることがある。")
F["e14_cycle"] = _f14_cycle_fig()

# ---- 5 節: 故障と、どうなるか ----
def _f14_faults_fig():
    o = []
    hdr = ["故障", "読み・スイッチはどうなるか", "ヒータ", "見つける・止める守り"]
    xs = [14, 160, 386, 470]
    rows = [("センサの断線", "最も冷たいと読める（NTC）", "最大", ALI, "範囲の検査（10 章 6 節）"),
            ("センサの短絡", "最も熱いと読める", "切れる", GRN, "範囲の検査"),
            ("センサがはがれる", "周囲温度へ近づく（範囲の中）", "最大", ALI, "上がらないことの検出"),
            ("SSR の短絡・溶着", "マイコンが切っても入ったまま", "切れない", ALI, "上限の温度 → 2 つ目のスイッチ"),
            ("マイコンの停止", "出力が入ったまま変わらない", "入ったまま", ALI, "ウォッチドッグ → リセットで切れる"),
            ("ヒータの断線", "温まらない", "危険なし", GRN, "上がらないことの検出")]
    y = 22
    for x, h_ in zip(xs, hdr):
        o.append(T(x, y, h_, "start", 10.5, INK, True))
    o.append(W(14, y + 6, 686, y + 6, c=LIN, lw=1))
    for i, (a_, b_, c_, cc, d_) in enumerate(rows):
        yy = y + 26 + i * 24
        o.append(T(xs[0], yy, a_, "start", 10.5, INK, True))
        o.append(T(xs[1], yy, b_, "start", 10, MUT))
        o.append(CHIP(xs[2], yy, c_, cc, 9.5)[0])
        o.append(T(xs[3], yy, d_, "start", 10, SIG))
    yb = y + 26 + 6 * 24
    o.append(T(14, yb, "どれにも効く最後の守り: サーモスタットと温度ヒューズ（ヒータの電源の線に直列。マイコンを通らない）", "start", 10.5, GRN, True))
    return SVG(700, yb + 10, o, "ヒータの機器で起きる故障と、そのときヒータがどうなるか。赤は、最大の電力で入ったままになりうる故障である。プログラムの見張りで見つけられるものと、見つけてもプログラムでは切れないものがあるので、守りを重ねる。")
F["e14_faults"] = _f14_faults_fig()

# ---- 5 節: 守りの層と温度のはしご ----
def _f14_layers_fig():
    o = []
    o.append(T(14, 18, "(a) ヒータの電源の線に直列に入れる守り", "start", 11.5, INK, True))
    y = 64
    parts = [("商用電源", GLD, 60), ("温度ヒューズ", ALI, 74), ("サーモスタット", ALI, 84), ("リレー", SIG, 52), ("SSR", PUR, 46), ("ヒータ", PUR, 52)]
    x = 14
    xc = {}
    for i, (nm, c, w) in enumerate(parts):
        o.append(BOX(x, y - 14, w, 28, nm, None, c, soft(c), sz=9.5))
        xc[nm] = x + w / 2
        if i + 1 < len(parts):
            o.append(W(x + w, y, x + w + 12, y, c=GLD, lw=2))
        x += w + 12
    xe = x - 12
    o.append(W(xe, y, xe + 8, y, c=GLD, lw=2)); o.append(W(xe + 8, y, xe + 8, y + 30, c=GLD, lw=2))
    o.append(W(xe + 8, y + 30, 44, y + 30, c=GLD, lw=2)); o.append(W(44, y + 30, 44, y + 14, c=GLD, lw=2))
    # マイコン
    o.append(BOX(250, 130, 90, 40, "マイコン", "PID と見張り", SIG, SSOFT, sz=10.5, ssz=9))
    o.append(ARR(282, 130, xc["リレー"], y + 15, c=SIG, lw=1.3, head=6))
    o.append(ARR(310, 130, xc["SSR"], y + 15, c=SIG, lw=1.3, head=6))
    o.append(T(xc["SSR"] + 30, 118, "別のピンで", "start", 9.5, SIG))
    o.append(BOX(380, 130, 98, 40, "ウォッチドッグ", "止まったらリセット", SIG, PAN, sz=10, ssz=9))
    o.append(W(340, 150, 380, 150, c=SIG, lw=1.3))
    o.append(BOX(130, 130, 80, 40, "センサ", "板の温度", TEA, TSOFT, sz=10.5, ssz=9))
    o.append(ARR(210, 150, 250, 150, c=TEA, lw=1.3, head=6))
    # 板への取り付け
    o.append(RECT(14, 196, 470, 16, 3, MSOFT, MUT, 1.2))
    o.append(T(249, 208, "板（ヒータ・サーモスタット・温度ヒューズ・センサを取り付ける）", "middle", 9.5, INK))
    for nm in ("温度ヒューズ", "サーモスタット"):
        o.append(W(xc[nm], y + 14, xc[nm], 196, c=ALI, lw=1, dash="3 3"))
    o.append(W(170, 170, 170, 196, c=TEA, lw=1, dash="3 3"))
    o.append(T(14, 232, "温度ヒューズとサーモスタットは、マイコンを通らずにヒータの電流を切る", "start", 10, ALI, True))
    # (b) 温度のはしご
    xb = 520
    o.append(T(xb - 10, 18, "(b) 動く温度の並び（例）", "start", 11.5, INK, True))
    p = Plot(xb + 30, 34, 20, 200, (0, 1), (50, 130))
    o.append(W(p.X(0.5), p.Y(50), p.X(0.5), p.Y(130), c=MUT, lw=1.2))
    marks = [(60, "目標", GRN, ""), (75, "ソフトの上限", SIG, "131 s"), (90, "サーモスタット", ALI, "310 s"),
             (115, "温度ヒューズ", ALI, "936 s"), (125, "最大の電力で行き着く", GLD, "")]
    for v, nm, c, tt in marks:
        yy = p.Y(v)
        o.append(W(p.X(0.5) - 6, yy, p.X(0.5) + 6, yy, c=c, lw=2))
        o.append(T(p.X(0.5) - 10, yy + 4, "%d °C" % v, "end", 9.5, c, True))
        o.append(T(p.X(0.5) + 10, yy + 4, nm, "start", 9.5, c, True))
        if tt:
            o.append(T(p.X(0.5) + 10, yy + 17, "60 °C から " + tt, "start", 9, MUT))
    return SVG(700, 244, o, "守りを重ねる。(a) 温度ヒューズ・サーモスタット・2 つ目のスイッチ（リレー）を、SSR と直列にヒータの電源の線に入れる。温度ヒューズとサーモスタットは板に取り付け、マイコンを通らずに切る。(b) 動く温度は下から順に並べ、最大の電力で行き着く温度より低くする。時間は、最大の電力で入ったままのとき 60 °C から届くまで（周囲温度 25 °C）。")
F["e14_layers"] = _f14_layers_fig()

# ---- 6 節: 部品の温度とディレーティング ----
def _f14_parts_fig():
    o = []
    o.append(T(14, 18, "(a) 周囲温度 45 °C での接合部温度の見積もり（例）", "start", 11.5, INK, True))
    rows = [("LDO 12 V → 3.3 V・100 mA", 0.87, 100, ALI),
            ("スイッチング電源（効率 90 %）", 0.037, 100, GRN),
            ("MOSFET 12 V・2 A（35 mΩ）", 0.14, 60, GRN),
            ("SSR 10 A（放熱器で 4.6 K/W）", 12.0, 4.6, GLD)]
    x0, x1 = 230, 460
    X = lambda v: x0 + (v - 40) / (140 - 40) * (x1 - x0)
    y0 = 40
    for v in (40, 60, 80, 100, 120, 140):
        o.append(W(X(v), y0, X(v), y0 + 4 * 34, c=GRD, lw=1))
        o.append(T(X(v), y0 + 4 * 34 + 14, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, y0 + 4 * 34 + 30, "接合部温度 [°C]", "middle", 10, MUT))
    o.append(W(X(125), y0 - 4, X(125), y0 + 4 * 34, c=ALI, lw=1.2, dash="4 3"))
    o.append(W(X(100), y0 - 4, X(100), y0 + 4 * 34, c=GLD, lw=1.2, dash="4 3"))
    for i, (nm, P, R, c) in enumerate(rows):
        y = y0 + i * 34
        tj = 45 + P * R
        o.append(T(x0 - 8, y + 14, nm, "end", 10, INK))
        o.append(T(x0 - 8, y + 27, "%s W × %s K/W" % (("%g" % P), ("%g" % R)), "end", 9, MUT))
        o.append(RECT(X(40), y + 6, X(45) - X(40), 18, 0, MSOFT, "none", 0))
        o.append(RECT(X(45), y + 6, max(X(min(tj, 140)) - X(45), 1), 18, 2, soft(c), c, 1.1))
        o.append(T(X(min(tj, 140)) + 5, y + 19, "%.0f °C" % tj, "start", 10, c, True))
    o.append(T(X(125) + 3, y0 + 2, "上限（例 125 °C）", "start", 9, ALI, halo=True))
    o.append(T(X(100) - 3, y0 + 2, "余裕の目安", "end", 9, GLD, halo=True))
    # (b) ディレーティング
    xb = 540
    o.append(T(xb - 30, 18, "(b) LDO の許される損失", "start", 11.5, INK, True))
    p = Plot(xb, 34, 140, 136, (0, 125), (0, 1.3))
    o.append(p.axes(xl="周囲温度 [°C]", yl="損失 [W]", xt=[0, 25, 50, 75, 100, 125], yt=[0, 0.5, 1.0], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    o.append(p.line([(0, 1.25), (125, 0)], c=SIG, lw=2.2))
    o.append(p.line([(0, 0.87), (125, 0.87)], c=ALI, lw=1.2, dash="4 3"))
    o.append(D(p.X(38), p.Y(0.87), ALI, 3.6))
    o.append(T(p.X(40), p.Y(0.87) - 8, "0.87 W は 38 °C まで", "start", 9, ALI, True, halo=True))
    for v in (25, 85):
        o.append(D(p.X(v), p.Y((125 - v) / 100.0), SIG, 3))
    o.append(T(p.X(88), p.Y(0.4) + 4, "0.4 W", "start", 9, SIG, halo=True))
    o.append(T(p.X(27), p.Y(1.0) - 6, "1.0 W", "start", 9, SIG, halo=True))
    return SVG(700, 222, o, "部品の発熱。(a) 損失 × 熱抵抗の分だけ、接合部温度は周囲温度より高くなる（熱抵抗はどれも例の値）。12 V から LDO で 3.3 V を作ると上限を超え、スイッチング電源なら余裕がある。(b) 許される損失は (上限 − 周囲温度) ÷ 熱抵抗で、周囲温度とともに直線で下がる（熱抵抗 100 K/W、上限 125 °C）。0.87 W の LDO は、周囲温度 38 °C までしか使えない。")
F["e14_parts"] = _f14_parts_fig()
