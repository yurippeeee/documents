# -*- coding: utf-8 -*-
# 16 章 マイコンで実装する の図
import numpy as _f16_np

# =====================================================================
# 補助
# =====================================================================
def _f16_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f16_up(x, y, c, s=6.0):
    """上向きの三角（頂点が上）。底辺の中央が (x, y)。測る時刻の印。"""
    return PL([(x - s * 0.6, y), (x + s * 0.6, y), (x, y - s)], c=c, lw=1, fill=c)


def _f16_dn(x, y, c, s=6.0):
    """下向きの三角（頂点が下）。底辺の中央が (x, y)。出す時刻の印。"""
    return PL([(x - s * 0.6, y), (x + s * 0.6, y), (x, y + s)], c=c, lw=1, fill=c)


# ---- モータの角度（10 章の 1000/{s(s+20)}）を、電圧 v を h [s] 保ったときに厳密に進める ----
def _f16_madv(th, w, v, h):
    e = _f16_np.exp(-20.0 * h)
    wi = 50.0 * v
    return th + wi * h + (w - wi) * (1.0 - e) / 20.0, wi + (w - wi) * e


class _F16PID:
    """11 章 4 節の pid_step（クランプのアンチワインドアップ）と同じ計算（倍精度）。"""
    def __init__(s, kp=0.84, ti=0.168, td=0.0238, n=10.0, b=0.5, dt=1e-3, umin=-12.0, umax=12.0, tt=0.0, aw=True):
        s.kp, s.ti, s.td, s.n, s.b, s.dt, s.umin, s.umax, s.tt, s.aw = kp, ti, td, n, b, dt, umin, umax, tt, aw
        s.i = 0.0; s.d = 0.0; s.y1 = 0.0
    def start(s, y):
        s.i = 0.0; s.d = 0.0; s.y1 = y
    def pd(s, r, y):
        if s.td > 0:
            a = s.td / (s.td + s.n * s.dt)
            s.d = a * s.d - a * s.kp * s.n * (y - s.y1)
        s.y1 = y
        return s.kp * (s.b * r - y) + s.d
    def step(s, r, y):
        e = r - y
        uc = s.pd(r, y) + s.i
        u = min(max(uc, s.umin), s.umax)
        if s.ti > 0:
            di = s.kp * s.dt / s.ti * e
            if not s.aw:
                s.i += di
            elif s.tt > 0:
                s.i += di + s.dt / s.tt * (u - uc)
            elif not ((uc > s.umax and e > 0) or (uc < s.umin and e < 0)):
                s.i += di
        s.uc = uc
        return u


class _F16VEL:
    """16 章 2 節の速度形（範囲に収めた値に増分を足す）。"""
    def __init__(s, **k):
        s.p = _F16PID(**k)
        s.u1 = 0.0; s.pd1 = 0.0; s.e1 = 0.0
    def start(s, r, y, u):
        s.p.start(y); s.pd1 = s.p.pd(r, y); s.e1 = 0.0; s.u1 = min(max(u, s.p.umin), s.p.umax)
    def step(s, r, y):
        p = s.p
        pd = p.pd(r, y)
        du = pd - s.pd1
        if p.ti > 0:
            du += p.kp * p.dt / p.ti * s.e1
        s.pd1 = pd; s.e1 = r - y
        s.u1 = min(max(s.u1 + du, p.umin), p.umax)
        return s.u1


def _f16_jit_run(Ts=1e-3, mode="B", J=0.0, seed=1, b=0.5, tend=2.0, tload=1.0, rec=1e-4, cmin=0.2e-3, cmax=0.4e-3):
    """モータの角度の PID を、出来事（測る・出す）の時刻ごとに厳密に進める。
    処理の始まりは kTs から 0〜J·Ts の間でずれ、その時刻に測る。(A) は測ってから cmin〜cmax 後に出し、
    (B) は前の周期の値を次の割り込みの始めに出す（本文 1 節のコード。出す時刻も揺らぐ）。
    "D" はタイマが測る時刻 kTs と出す時刻 (k+1)Ts を決める（揺らぎなし）。返り値 (t, 角度, 電圧)。"""
    rng = _f16_np.random.default_rng(seed)
    pid = _F16PID(b=b, dt=Ts)
    ns = int(round(tend / Ts))
    ts = [k * Ts + (rng.uniform(0, J * Ts) if J > 0 else 0.0) for k in range(ns + 1)]
    th = w = v = 0.0; t = 0.0
    out_t, out_th, out_u = [0.0], [0.0], [0.0]
    nrec = [1]
    def adv(t_to):
        nonlocal th, w, t
        while t < t_to - 1e-15:
            tr = nrec[0] * rec
            nxt = min(t_to, tr) if tr > t + 1e-15 else t_to
            if tload is not None and t < tload < nxt:
                nxt = tload
            d = 1.0 if (tload is not None and t >= tload - 1e-15) else 0.0
            th, w = _f16_madv(th, w, v - d, nxt - t)
            t = nxt
            if abs(t - tr) < 1e-12:
                out_t.append(tr); out_th.append(th); out_u.append(v); nrec[0] += 1
    pid.start(0.0)
    pend = []
    for k in range(ns + 1):
        tk = max(ts[k], t) if mode != "D" else k * Ts
        while pend and pend[0][0] <= tk:
            to, val = pend.pop(0); adv(to); v = val
        adv(tk)
        u = pid.step(1.0, th)
        if mode == "A":
            to = tk + rng.uniform(cmin, cmax)          # 計算が終わりしだい
        elif mode == "B":
            to = ts[k + 1] if k + 1 <= ns else (k + 1) * Ts   # 次の割り込みの始め（それも揺らぐ）
        else:
            to = (k + 1) * Ts                          # タイマの区切り（揺れない）
        pend.append((to, u)); pend.sort()
    while pend:
        to, val = pend.pop(0)
        if to > tend:
            break
        adv(to); v = val
    adv(tend)
    return _f16_np.array(out_t), _f16_np.array(out_th), _f16_np.array(out_u)


# =====================================================================
# 1 節: 周期の作り方
# =====================================================================
def _f16_ways_fig():
    o = []
    x0, x1, tmax = 210.0, 686.0, 4.7
    X = lambda t: x0 + t / tmax * (x1 - x0)
    rows = [
        ("(a) 計算の後で 1 ms 待つ", "for (;;) { 計算; 1 ms 待つ; }"),
        ("(b) タイマ割り込み", "タイマが 1 ms ごとに起こす"),
        ("(c) 優先度の高いタスク", "前の予定から 1 ms 後に起こす"),
        ("(d) タイマが測る・出す時刻を決める", "ADC の変換と PWM の反映"),
    ]
    notes = [
        "周期 = 1 ms ＋ 計算の時間（1.30〜1.33 ms）。ずれがたまっていく",
        "始まりが割り込みの遅れの分だけ揺らぐ（例 0.01〜0.06 ms）",
        "始まりがほかの処理の分だけ揺らぐ（例 0.05〜0.35 ms）",
        "計算はいつでもよい。測る ▲・出す ▼ はタイマの時刻どおり",
    ]
    comp = [0.30, 0.32, 0.33, 0.30, 0.31]
    lat_b = [0.02, 0.05, 0.01, 0.06, 0.03]
    lat_c = [0.10, 0.35, 0.05, 0.22, 0.15]
    yc0, dy = 50.0, 74.0
    for i, (ttl, sub) in enumerate(rows):
        yc = yc0 + i * dy
        o.append(T(14, yc - 4, ttl, "start", 10.5, INK, True))
        o.append(T(14, yc + 12, sub, "start", 9.5, MUT))
        o.append(W(x0, yc + 10, x1, yc + 10, c=LIN, lw=1))
        for k in range(5):
            o.append(W(X(k), yc - 16, X(k), yc + 14, c=FNT, lw=1, dash="3 3"))
        if i == 0:
            t = 0.0
            for k in range(4):
                c = comp[k]
                o.append(RECT(X(t), yc - 8, X(t + c) - X(t), 16, 2, soft(GLD), GLD, 1))
                o.append(_f16_up(X(t), yc + 18, TEA))
                o.append(_f16_dn(X(t + c), yc - 18, GLD))
                if t + c + 1.0 <= tmax:
                    o.append(DARR(X(t + c), yc + 2, X(t + c + 1.0), yc + 2, c=MUT, lw=1, head=4))
                t += c + 1.0
            o.append(T((X(0.30) + X(1.30)) / 2, yc - 1, "待つ 1 ms", "middle", 9.5, MUT, halo=True))
        elif i in (1, 2):
            lat = lat_b if i == 1 else lat_c
            for k in range(5):
                t = k + lat[k]
                c = comp[k]
                if t + c > tmax:
                    continue
                o.append(RECT(X(t), yc - 8, X(t + c) - X(t), 16, 2, soft(GLD), GLD, 1))
                o.append(_f16_up(X(t), yc + 18, TEA))
                o.append(_f16_dn(X(t + c), yc - 18, GLD))
        else:
            for k in range(5):
                t = k + lat_c[k]
                c = comp[k]
                if t + c <= tmax:
                    o.append(RECT(X(t), yc - 8, X(t + c) - X(t), 16, 2, soft(GLD), GLD, 1))
                o.append(_f16_up(X(k), yc + 18, TEA))
                if k >= 1:
                    o.append(_f16_dn(X(k), yc - 18, GLD))
        o.append(T(x0, yc + 34, notes[i], "start", 9.5, SIG if i == 3 else (ALI if i == 0 else MUT), i in (0, 3)))
    ya = yc0 + 3 * dy + 48
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for k in range(5):
        o.append(W(X(k), ya, X(k), ya + 4, c=MUT, lw=1))
        o.append(T(X(k), ya + 16, "%d" % k, "middle", 9.5, MUT))
    o.append(TX((x0 + x1) / 2, ya + 32, "時間 [ms]（縦の破線は決めた時刻 kT_s。T_s = 1 ms）", "middle", 9.5, MUT))
    yl = ya + 52
    o.append(_f16_up(20, yl + 1, TEA)); o.append(T(30, yl, "測る時刻", "start", 9.5, MUT))
    o.append(_f16_dn(110, yl - 9, GLD)); o.append(T(120, yl, "出す時刻", "start", 9.5, MUT))
    o.append(RECT(196, yl - 10, 22, 12, 2, soft(GLD), GLD, 1)); o.append(T(224, yl, "計算（例 0.3 ms）", "start", 9.5, MUT))
    return SVG(700, yl + 10, o, "決めた間隔で計算を繰り返す 4 つの方法（時間はどれも例の値）。(a) 計算の後で決まった時間だけ待つと、1 回の繰り返しは待つ時間に計算の時間を足した長さになり、決めた時刻からずれていく。(b) タイマ割り込みと (c) タスクは、周期はタイマで決まるが、処理を始める時刻が回ごとに揺らぐ。(d) タイマの合図で ADC が測り、PWM が周期の区切りで値を反映させると、計算がいつ行われても、測る時刻と出す時刻はタイマの時刻どおりになる。")
F["e16_ways"] = _f16_ways_fig()


# =====================================================================
# 1 節: 出す時刻の決め方 (A)・(B) と計算遅れ
# =====================================================================
def _f16_order_fig():
    o = []
    x0, x1, tmax = 150.0, 686.0, 4.3
    X = lambda t: x0 + t / tmax * (x1 - x0)
    lat = [0.03, 0.12, 0.02, 0.08, 0.05]
    comp = [0.25, 0.38, 0.22, 0.31, 0.27]
    uval = [0.35, 0.80, 0.55, 0.70, 0.62]
    panels = [("(A) 計算が終わりしだい出す", "A"), ("(B) 次の周期の頭で出す", "B")]
    y0 = 14.0
    for pi, (ttl, md) in enumerate(panels):
        yb = y0 + pi * 172
        o.append(T(14, yb + 10, ttl, "start", 11, INK, True))
        yc = yb + 46
        o.append(T(14, yc + 4, "割り込みの処理", "start", 9.5, MUT))
        o.append(W(x0, yc + 10, x1, yc + 10, c=LIN, lw=1))
        for k in range(5):
            o.append(W(X(k), yc - 18, X(k), yc + 104, c=FNT, lw=1, dash="3 3"))
        outs = []
        for k in range(5):
            ts = k + lat[k]
            te = ts + comp[k]
            if te > tmax:
                continue
            o.append(RECT(X(ts), yc - 8, X(te) - X(ts), 16, 2, soft(GLD), GLD, 1))
            o.append(_f16_up(X(ts), yc + 18, TEA))
            to = te if md == "A" else k + 1 + lat[k + 1]
            if to <= tmax:
                o.append(_f16_dn(X(to), yc - 18, GLD))
                outs.append((ts, to, uval[k]))
        # 計算遅れの矢印
        ya = yc + 30
        for j, (ts, to, _) in enumerate(outs):
            o.append(DARR(X(ts), ya, X(to), ya, c=SIG, lw=1, head=4))
            lab = "%.2f" % (to - ts)
            if md == "A":
                o.append(T(X(to) + 4, ya + 4, lab, "start", 9.5, SIG, halo=True))
            else:
                o.append(T((X(ts) + X(to)) / 2, ya - 4, lab, "middle", 9.5, SIG, halo=True))
        o.append(TX(14, ya + 4, "計算遅れ L_c [ms]", "start", 9.5, SIG))
        # 出した値の階段
        yp = yc + 46
        hp = 46
        o.append(T(14, yp + hp / 2 + 4, "出した操作量 u(t)", "start", 9.5, GLD))
        o.append(W(x0, yp + hp, x1, yp + hp, c=LIN, lw=1))
        pts = [(X(0), yp + hp - 0.2 * hp)]
        cur = 0.2
        for ts, to, val in outs:
            pts.append((X(to), yp + hp - cur * hp))
            pts.append((X(to), yp + hp - val * hp))
            cur = val
        pts.append((X(tmax), yp + hp - cur * hp))
        o.append(PL(pts, c=GLD, lw=2))
    ya = y0 + 2 * 172 - 6
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for k in range(5):
        o.append(W(X(k), ya, X(k), ya + 4, c=MUT, lw=1))
        o.append(T(X(k), ya + 16, "%d" % k, "middle", 9.5, MUT))
    o.append(TX((x0 + x1) / 2, ya + 32, "時間 [ms]（T_s = 1 ms。▲ 測る時刻、▼ 出す時刻、帯は計算）", "middle", 9.5, MUT))
    return SVG(700, ya + 40, o, "出す時刻の 2 つの決め方（処理の始まりの遅れと計算の時間はどれも例の値）。(A) 計算が終わりしだい出すと、計算遅れ（測ってから出すまで）は 0.22〜0.38 ms と短いが、計算の時間で回ごとに違う。(B) 前の周期に計算した値を、次の割り込みの始めに出すと、計算遅れは平均でちょうど 1 周期で、始まりの遅れの差の分（この例で 0.90〜1.09 ms）しか揺れない。測る時刻と出す時刻をタイマに決めさせれば（前の図の (d)）、ちょうど 1 周期になる。")
F["e16_order"] = _f16_order_fig()


# =====================================================================
# 1 節: 揺らぎの影響
# =====================================================================
def _f16_jitter_fig():
    o = []
    # (a) 測る時刻のずれと、測った値の誤差
    o.append(TX(14, 18, "(a) 測る時刻が δ ずれると、値は \\dot{y}δ ずれる", "start", 11, INK, True))
    t, th, u = _f16_jit_run(Ts=1e-3, mode="B", J=0.0, tend=0.2, tload=None, rec=1e-5)
    i0 = int(_f16_np.argmax(_f16_np.gradient(th, t)))
    tc = t[i0]
    ta, tb = tc - 3.5e-3, tc + 3.5e-3
    m = (t >= ta) & (t <= tb)
    tt, yy = (t[m] - ta) * 1e3, th[m]
    p = Plot(62, 34, 250, 190, (0, 7), (float(yy.min()) - 0.004, float(yy.max()) + 0.004))
    o.append(p.axes(xl="時間 [ms]（最も速く回るあたり）", yl="角度 [rad]", xt=[0, 1, 2, 3, 4, 5, 6, 7], yt=None, sz=9.5, yfmt=lambda v: _f16_f(v, 2)))
    o.append(p.line(list(zip(tt, yy)), c=SIG, lw=2))
    rng = _f16_np.random.default_rng(7)
    f = lambda x: float(_f16_np.interp(x, tt, yy))
    for k in range(1, 7):
        d = rng.uniform(0.1, 0.45)
        xk, xd = float(k), k + d
        o.append(CIRC(p.X(xk), p.Y(f(xk)), 3.2, c=SIG, lw=1.4, fill=SCR))
        o.append(D(p.X(xd), p.Y(f(xd)), TEA, 3.2))
        o.append(W(p.X(xk), p.Y(f(xd)), p.X(xd), p.Y(f(xd)), c=TEA, lw=1, dash="2 2"))
        o.append(W(p.X(xk), p.Y(f(xk)), p.X(xk), p.Y(f(xd)), c=ALI, lw=2))
    o.append(T(p.X(0.2), p.Y(float(yy.max())) + 4, "○ 決めた時刻の値", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(0.2), p.Y(float(yy.max())) + 17, "● 実際に測った値", "start", 9.5, TEA, halo=True))
    o.append(TX(p.X(6.9), p.Y(float(yy.min())) - 6, "赤: 誤差 \\dot{y}δ", "end", 9.5, ALI, True, halo=True))
    vmax = float(_f16_np.gradient(th, t).max())
    o.append(T(62, 266, "角速度 %s rad/s で δ = 0.1 ms なら %s mrad" % (_f16_f(vmax, 1), _f16_f(vmax * 0.1, 2)), "start", 9.5, MUT))
    # (b) 負荷トルクによるずれの最大
    xb = 372
    o.append(T(xb - 14, 18, "(b) 負荷トルクによるずれの最大", "start", 11, INK, True))
    cats = [("1 ms", 1e-3, "A"), ("1 ms", 1e-3, "B"), ("10 ms", 10e-3, "A"), ("10 ms", 10e-3, "B")]
    Js = [(0.0, GRN, "揺らぎ 0"), (0.2, GLD, "20 %"), (0.4, ALI, "40 %")]
    q = Plot(xb + 30, 34, 290, 190, (0, 4), (1.0, 1.4))
    o.append(q.axes(xl=None, yl="ずれの最大 [rad]", xt=[], yt=[1.0, 1.1, 1.2, 1.3, 1.4], sz=9.5, yfmt=lambda v: _f16_f(v, 1)))
    o.append(W(q.X(0), q.Y(1.0514), q.X(4), q.Y(1.0514), c=MUT, lw=1, dash="4 3"))
    o.append(T(q.X(3.97), q.Y(1.0514) + 13, "連続時間 1.051", "end", 9.5, MUT, halo=True))
    bw = 0.22
    vals = {}
    for ci, (lab, Ts, md) in enumerate(cats):
        for ji, (J, c, _) in enumerate(Js):
            tt_, thh, _u = _f16_jit_run(Ts=Ts, mode=md, J=J, seed=1)
            v = 1.0 - float(thh[tt_ >= 1.0].min())
            vals[(ci, ji)] = v
            xl = ci + 0.5 + (ji - 1) * bw
            o.append(RECT(q.X(xl - bw / 2), q.Y(v), q.X(xl + bw / 2) - q.X(xl - bw / 2), q.Y(1.0) - q.Y(v), 1, soft(c), c, 1))
        o.append(T(q.X(ci + 0.5), q.y + q.h + 15, lab, "middle", 9.5, INK))
        o.append(T(q.X(ci + 0.5), q.y + q.h + 28, "(%s)" % md, "middle", 9.5, INK, True))
        top = max(vals[(ci, j)] for j in range(3))
        o.append(T(q.X(ci + 0.5), q.Y(top) - 5, _f16_f(vals[(ci, 0)], 3), "middle", 9.5, INK, halo=True))
    o.append(LEGEND(xb, 266, [(c, l) for _, c, l in Js]))
    return SVG(700, 276, o, "揺らぎの影響（モータの角度の PID、目標 1 rad の後、1 s に負荷トルク 0.01 N·m）。(a) 処理の始まりが遅れると、その時刻に測った値を、決めた時刻の値として使うので、制御量の変わる速さ × 遅れの誤差が入る（遅れは例の値）。(b) 処理の始まりが 0〜周期の 20 %・40 % の間で回ごとにでたらめに遅れても、ずれの最大はほとんど変わらない（増えることも減ることもある）。違いの大部分は、(A)（計算の時間 0.2〜0.4 ms）と (B)（次の割り込みの始めに出す）の、平均の計算遅れの差による。棒の上の数は揺らぎ 0 の値。")
F["e16_jitter"] = _f16_jitter_fig()


# =====================================================================
# 2 節: 位置形と速度形
# =====================================================================
def _f16_box(x, y, w, h, s, c=LIN, fill=PAN, sz=10, tc=INK, b=False, dash=None):
    """角の丸い箱に 1 行の文字（TX の書き方）。"""
    return RECT(x, y, w, h, 5, fill, c, 1.3, dash) + TX(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b)


def _f16_forms_fig():
    o = []
    cols = [(14, "(a) 位置形 — 操作量そのものを計算する"), (362, "(b) 速度形 — 増分を前の操作量に足す")]
    for x, t in cols:
        o.append(T(x, 18, t, "start", 11, INK, True))
    # ---- (a) 位置形 ----
    o.append(_f16_box(84, 30, 180, 26, "r[k]・y[k] を受け取る", MUT, SCR, 9.5, MUT))
    o.append(ARR(174, 56, 174, 70, c=MUT, lw=1.3, head=6))
    o.append(_f16_box(14, 70, 96, 28, "P の分 u_P[k]", LIN, PAN, 10))
    o.append(_f16_box(120, 70, 100, 28, "I の分 u_I[k]", SIG, SSOFT, 10, INK, True))
    o.append(_f16_box(230, 70, 116, 28, "D の分 u_D[k]", LIN, PAN, 10))
    o.append(_f16_box(120, 104, 100, 22, "覚える（ためる）", SIG, SCR, 9.5, SIG, True, dash="4 3"))
    o.append(_f16_box(230, 104, 116, 22, "覚える: 前の u_D・y", MUT, SCR, 9.5, MUT, dash="4 3"))
    xs, ys = 170, 160
    o.append(SUMJ(xs, ys, {"l": "+", "t": "+", "r": "+"}, r=13))
    o.append(W(62, 98, 62, ys, xs - 20, ys, c=LIN, lw=1.3)); o.append(_head(xs - 22, ys, xs - 13, ys, LIN, 6))
    o.append(ARR(xs, 126, xs, ys - 13, c=SIG, lw=1.3, head=6))
    o.append(W(288, 126, 288, ys, xs + 20, ys, c=LIN, lw=1.3)); o.append(_head(xs + 22, ys, xs + 13, ys, LIN, 6))
    o.append(ARR(xs, ys + 13, xs, 190, c=GLD, lw=1.4, head=6))
    o.append(TX(xs + 8, 184, "u_c[k]", "start", 10, GLD, True))
    o.append(_f16_box(100, 190, 140, 26, "範囲で切る → u[k]", GLD, GOSOFT, 10))
    o.append(T(14, 240, "次の回のために、I の分に今回の偏差の分を足す:", "start", 9.5, MUT))
    o.append(TX(14, 257, "u_I[k+1] = u_I[k] + (K_P T_s/T_I) e[k]", "start", 10, SIG, True))
    o.append(T(14, 282, "範囲で切っても I の分はたまる（ワインドアップ）", "start", 9.5, ALI, True))
    o.append(T(14, 298, "→ 11 章 4 節のアンチワインドアップが要る", "start", 9.5, MUT))
    # ---- (b) 速度形 ----
    o.append(_f16_box(432, 30, 180, 26, "r[k]・y[k] を受け取る", MUT, SCR, 9.5, MUT))
    o.append(ARR(522, 56, 522, 70, c=MUT, lw=1.3, head=6))
    o.append(_f16_box(392, 70, 264, 28, "P と D の分 u_PD[k]（位置形と同じ）", LIN, PAN, 10))
    o.append(ARR(522, 98, 522, 108, c=LIN, lw=1.2, head=5))
    o.append(_f16_box(362, 108, 328, 28, "増分 Δu[k] = u_PD[k] − u_PD[k−1] + (K_P T_s/T_I) e[k−1]", LIN, PAN, 10))
    o.append(_f16_box(412, 140, 220, 22, "覚える: 前の u_PD と e", MUT, SCR, 9.5, MUT, dash="4 3"))
    o.append(ARR(522, 162, 522, 172, c=LIN, lw=1.2, head=5))
    o.append(_f16_box(442, 172, 160, 26, "u[k−1] + Δu[k]", LIN, PAN, 10))
    o.append(ARR(522, 198, 522, 208, c=GLD, lw=1.4, head=5))
    o.append(_f16_box(452, 208, 140, 26, "範囲で切る → u[k]", GLD, GOSOFT, 10))
    o.append(W(592, 221, 646, 221, 646, 185, 610, 185, c=SIG, lw=1.6))
    o.append(_head(616, 185, 603, 185, SIG, 7))
    o.append(_f16_box(616, 240, 74, 24, "u[k−1]", SIG, SSOFT, 10, INK, True))
    o.append(W(646, 221, 646, 240, c=SIG, lw=1.6))
    o.append(T(606, 257, "覚える: 範囲に収めた", "end", 9.5, SIG, True))
    o.append(T(606, 272, "前の操作量", "end", 9.5, SIG, True))
    o.append(T(362, 298, "範囲に収めた値を覚えるので、たまり過ぎない（I の分はためない）", "start", 9.5, GRN, True))
    return SVG(700, 306, o, "PID の 1 回分の計算の 2 つの形（10 章 6 節・11 章 4 節のコードは位置形）。(a) 位置形は、I の分をためておき、毎回 P・I・D の分を足して操作量そのものを出す。範囲で切っても I の分はたまり続ける。(b) 速度形は、P と D の分の差と I の分の 1 回分を足した増分を、前の回の操作量に足す。覚えるのは、範囲に収めた前の操作量である。範囲の外に出なければ、2 つの形は同じ操作量を出す。")
F["e16_forms"] = _f16_forms_fig()


def _f16_plate_run(kind, tend=1500, Ts=1.0):
    """25 °C で落ち着いた温度の板（PI 10 W/K・160 s、0〜80 W、1 s ごと、読みは 20 s 遅れ）の目標値を 60 °C に変える。
    kind: "none"（対策なし）・"clamp"・"back80"（T_t = 80 s）・"vel"（速度形）。返り値 (t, 読み, u)。"""
    if kind == "vel":
        c = _F16VEL(kp=10.0, ti=160.0, td=0.0, n=10.0, b=1.0, dt=Ts, umin=0.0, umax=80.0)
        c.start(25.0, 25.0, 0.0)
    else:
        c = _F16PID(kp=10.0, ti=160.0, td=0.0, n=10.0, b=1.0, dt=Ts, umin=0.0, umax=80.0,
                    tt=80.0 if kind == "back80" else 0.0, aw=(kind != "none"))
        c.start(25.0)
    q = _f16_np.exp(-Ts / 500.0)
    hist = [25.0] * 20; th = 25.0
    T_, R_, U_ = [], [], []
    for k in range(int(tend / Ts) + 1):
        rd = hist[0]
        u = c.step(60.0, rd)
        T_.append(k * Ts); R_.append(rd); U_.append(u)
        tinf = 25.0 + 1.25 * u
        hist.pop(0); hist.append(th)
        th = tinf + (th - tinf) * q
    return _f16_np.array(T_), _f16_np.array(R_), _f16_np.array(U_)


def _f16_sat_fig():
    o = []
    cases = [("none", ALI, None, "対策なし"), ("clamp", SIG, None, "クランプ"), ("back80", GRN, "4 3", "逆算（T_t = 80 s）"), ("vel", PUR, None, "速度形")]
    res = {k: _f16_plate_run(k) for k, _, _, _ in cases}
    def settle(t, r):
        bad = _f16_np.where(_f16_np.abs(r - 60.0) > 0.5)[0]
        return t[bad[-1] + 1]
    def leave(t, u):
        return t[_f16_np.where(u < 79.999)[0][0]]
    o.append(T(14, 18, "(a) 板の温度（読み）。25 °C で落ち着いた所で、目標を 60 °C に変える", "start", 11, INK, True))
    p = Plot(62, 32, 610, 170, (0, 1000), (20, 80))
    o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 200, 400, 600, 800, 1000], yt=[20, 40, 60, 80], sz=9.5, xfmt=lambda v: ""))
    o.append(W(p.X(0), p.Y(60), p.X(1000), p.Y(60), c=MUT, lw=1, dash="5 3"))
    for k, c, dsh, lab in cases:
        t, r, u = res[k]
        m = t <= 1000
        o.append(p.line(list(zip(t[m], r[m])), c=c, lw=2, dash=dsh))
    t, r, u = res["none"]
    i = int(_f16_np.argmax(r))
    o.append(T(p.X(t[i]) + 8, p.Y(r[i]) + 4, "%s °C まで行き過ぎる" % _f16_f(r[i], 1), "start", 9.5, ALI, True, halo=True))
    lab_y = {"none": 74, "clamp": 54.5, "back80": 50, "vel": 45.5}
    for k, c, dsh, lab in cases:
        t, r, u = res[k]
        o.append(TX(p.X(985), p.Y(lab_y[k]), "%s: ±0.5 K に入るのは %d s" % (lab, settle(t, r)), "end", 9.5, c, True, halo=True))
    o.append(T(14, 232, "(b) ヒータの電力（0〜80 W に収めた値）", "start", 11, INK, True))
    q = Plot(62, 244, 610, 120, (0, 1000), (0, 90))
    o.append(q.axes(xl="時間 t [s]", yl="[W]", xt=[0, 200, 400, 600, 800, 1000], yt=[0, 28, 80], sz=9.5))
    for k, c, dsh, lab in cases:
        t, r, u = res[k]
        m = t <= 1000
        o.append(q.line(list(zip(t[m], u[m])), c=c, lw=1.8, dash=dsh))
    yy = {"vel": 40, "back80": 58, "clamp": 70, "none": 40}
    for k, c, dsh, lab in cases:
        t, r, u = res[k]
        lv = leave(t, u)
        o.append(W(q.X(lv), q.Y(80), q.X(lv), q.Y(yy[k] + 8), c=c, lw=1, dash="2 2"))
        o.append(T(q.X(lv) + (4 if k != "none" else 4), q.Y(yy[k]), "%d s" % lv, "start", 9.5, c, True, halo=True))
    o.append(T(q.X(985), q.Y(28) - 5, "保つのに要る 28 W", "end", 9.5, MUT, halo=True))
    o.append(LEGL(62, 410, [(c, dsh, lab) for k, c, dsh, lab in cases], 9.5, 16))
    return SVG(700, 420, o, "範囲で切ったときの位置形と速度形（温度の板、PI 10 W/K・160 s、ヒータ 0〜80 W、1 s ごと）。対策の無い位置形は、張り付いている間に I の分がたまり、大きく行き過ぎる。範囲に収めた値に増分を足す速度形は、T<sub>t</sub> = T<sub>s</sub> = 1 s の逆算（バックカリキュレーション）と同じ操作量を出し、44 s で最も早く 80 W から下がり始めるが、その分、目標に近づくのは遅い。(b) の縦の破線は、80 W から下がり始める時刻。")
F["e16_sat"] = _f16_sat_fig()


def _f16_motor_run(kind, r=20.0, ti=0.0, tend=3.0, Ts=1e-3, b=1.0):
    """モータの角度（1 ms ごと、測った瞬間に出す）を PD または PID で動かす。kind: "pos" か "vel"。返り値 (t, 角度, 電圧)。"""
    if kind == "vel":
        c = _F16VEL(kp=0.84, ti=ti, td=0.0238, n=10.0, b=b, dt=Ts, umin=-12.0, umax=12.0)
        c.start(0.0, 0.0, 0.0)
    else:
        c = _F16PID(kp=0.84, ti=ti, td=0.0238, n=10.0, b=b, dt=Ts, umin=-12.0, umax=12.0)
        c.start(0.0)
    th = w = 0.0
    T_, Y_, U_ = [0.0], [0.0], [0.0]
    for k in range(int(round(tend / Ts))):
        u = c.step(r, th)
        U_[-1] = u
        th, w = _f16_madv(th, w, u, Ts)
        T_.append((k + 1) * Ts); Y_.append(th); U_.append(u)
    return _f16_np.array(T_), _f16_np.array(Y_), _f16_np.array(U_)


def _f16_velpd_fig():
    o = []
    pdp = _f16_motor_run("pos"); pdv = _f16_motor_run("vel")
    pip = _f16_motor_run("pos", ti=0.168); piv = _f16_motor_run("vel", ti=0.168)
    o.append(T(14, 18, "(a) PD（I 動作なし）で目標を 20 rad に", "start", 11, INK, True))
    p = Plot(62, 32, 270, 170, (0, 3), (0, 26))
    o.append(p.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 1, 2, 3], yt=[0, 5, 10, 15, 20, 25], sz=9.5))
    o.append(W(p.X(0), p.Y(20), p.X(3), p.Y(20), c=MUT, lw=1, dash="5 3"))
    o.append(p.line(list(zip(pdp[0], pdp[1])), c=SIG, lw=2))
    o.append(p.line(list(zip(pdv[0], pdv[1])), c=ALI, lw=2))
    o.append(T(p.X(2.95), p.Y(20) - 6, "位置形: 20 rad", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(2.95), p.Y(pdv[1][-1]) + 14, "速度形: %s rad で止まる" % _f16_f(pdv[1][-1], 2), "end", 9.5, ALI, True, halo=True))
    o.append(DIM(p.X(1.4), p.Y(20), p.X(1.4), p.Y(pdv[1][-1]), None, c=ALI))
    o.append(T(p.X(1.4) + 6, p.Y(17.2), "5.71 rad", "start", 9.5, ALI, True, halo=True))
    o.append(TX(370, 18, "(b) PID（T_I = 0.168 s を足す）", "start", 11, INK, True))
    q = Plot(410, 32, 270, 170, (0, 3), (0, 26))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 1, 2, 3], yt=[0, 5, 10, 15, 20, 25], sz=9.5))
    o.append(W(q.X(0), q.Y(20), q.X(3), q.Y(20), c=MUT, lw=1, dash="5 3"))
    o.append(q.line(list(zip(pip[0], pip[1])), c=SIG, lw=2))
    o.append(q.line(list(zip(piv[0], piv[1])), c=GRN, lw=2))
    o.append(T(q.X(0.75), q.Y(pip[1].max()) - 4, "位置形（クランプ）: 最大 %s rad" % _f16_f(pip[1].max(), 2), "start", 9.5, SIG, True, halo=True))
    o.append(T(q.X(2.95), q.Y(13), "速度形: 最大 %s rad、20 rad に届く" % _f16_f(piv[1].max(), 2), "end", 9.5, GRN, True, halo=True))
    # (c) 始めの電圧
    o.append(T(14, 248, "(c) PD の始めの 0.1 s の電圧: 求めた 16.8 V のうち 12 V を越えた分を、速度形は捨てる", "start", 11, INK, True))
    r_ = Plot(62, 262, 618, 110, (0, 0.1), (-14, 18))
    o.append(r_.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.02, 0.04, 0.06, 0.08, 0.1], yt=[-12, 0, 12], sz=9.5, xfmt=lambda v: _f16_f(v, 2)))
    o.append(W(r_.X(0), r_.Y(12), r_.X(0.1), r_.Y(12), c=ALI, lw=1, dash="4 3"))
    o.append(W(r_.X(0), r_.Y(-12), r_.X(0.1), r_.Y(-12), c=ALI, lw=1, dash="4 3"))
    m = pdp[0] <= 0.1
    o.append(r_.steps(list(zip(pdp[0][m], pdp[2][m])), c=SIG, lw=1.8))
    o.append(r_.steps(list(zip(pdv[0][m], pdv[2][m])), c=ALI, lw=1.8))
    o.append(D(r_.X(0), r_.Y(16.8), GLD, 3.4))
    o.append(T(r_.X(0) + 8, r_.Y(16.8) + 4, "求めた 16.8 V", "start", 9.5, GLD, True, halo=True))
    o.append(LEGL(62, 412, [(SIG, None, "位置形"), (ALI, None, "速度形（PD）"), (GRN, None, "速度形（PID）")], 9.5, 16))
    return SVG(700, 422, o, "速度形の落とし穴（モータの角度、1 ms ごと、電圧 ±12 V）。(a) I 動作の無い PD を速度形にすると、始めに 12 V を越えた 4.8 V の増分が捨てられ、そのずれが残って、角度は 4.8 ÷ 0.84 = 5.71 rad 手前で止まる。(b) I 動作があれば、残ったずれを I の分が消すので、速度形でも目標に届く。行き過ぎも、クランプの位置形より小さい。(c) 始めの電圧。位置形は張り付いている間も P の分を覚えているが、速度形は 12 V を越えた分を忘れる。")
F["e16_velpd"] = _f16_velpd_fig()


# =====================================================================
# 3 節: 量子化
# =====================================================================
def _f16_qsim(ba=None, bp=None, tend=2500, kp=10.0, ti=160.0, td=0.0, N=10.0, carry=False, noise=0.0, seed=1,
              tdist=200.0, dTa=-2.0, span=102.4, pmax=80.0):
    """60 °C で落ち着いた温度の板を 1 s ごとに PI（PID）で保つ。tdist に周りの温度が dTa 変わる。
    ba・bp: ADC（0〜span °C）と PWM（0〜pmax W）のビット数（None なら段なし）。carry: 出力の端数を持ち越す。
    返り値 (t, 板の温度, 読み（量子化の後）, 出した電力)。"""
    K, T, L, r = 1.25, 500.0, 20, 60.0
    la = span / 2 ** ba if ba else 0.0
    lp = pmax / 2 ** bp if bp else 0.0
    q = _f16_np.exp(-1.0 / T)
    rng = _f16_np.random.default_rng(seed)
    th = r; hist = [r] * (L + 1)
    I = (r - 25.0) / K; d = 0.0; y1 = None; cr = 0.0
    a = td / (td + N) if td > 0 else 0.0
    T_, TH, YM, V = [], [], [], []
    for k in range(int(tend) + 1):
        rd = hist[0]
        ym = rd + (noise * rng.standard_normal() if noise else 0.0)
        if la:
            ym = la * round(ym / la)
        if y1 is None:
            y1 = ym
        e = r - ym
        if td > 0:
            d = a * d - a * kp * N * (ym - y1)
        y1 = ym
        uc = kp * e + I + d
        u = min(max(uc, 0.0), pmax)
        if lp:
            if carry:
                v = min(max(lp * round((u + cr) / lp), 0.0), pmax); cr = u + cr - v
            else:
                v = min(max(lp * round(u / lp), 0.0), pmax)
        else:
            v = u
        if not ((uc > pmax and e > 0) or (uc < 0 and e < 0)):
            I += kp / ti * e
        Ta = 25.0 + (dTa if k >= tdist else 0.0)
        T_.append(k); TH.append(th); YM.append(ym); V.append(v)
        tinf = Ta + K * v
        th = tinf + (th - tinf) * q
        hist.pop(0); hist.append(th)
    return _f16_np.array(T_), _f16_np.array(TH), _f16_np.array(YM), _f16_np.array(V)


def _f16_stair(x, y, w, h, c, n=4):
    """量子化を表す小さな階段の印。"""
    pts = [(x, y + h)]
    for i in range(n):
        pts += [(x + w * i / n, y + h - h * (i + 1) / n), (x + w * (i + 1) / n, y + h - h * (i + 1) / n)]
    return PL(pts, c=c, lw=1.6)


def _f16_qloop_fig():
    o = []
    o.append(T(14, 18, "(a) ループの中で値が段に丸められる所", "start", 11, INK, True))
    yc = 80
    svg, pos, xe = CHAIN(14, yc, [("a", 34, "r", MUT), ("s", {"l": "+", "b": "−"}, "s"), ("a", 24, None, MUT), ("b", "PI", "c"),
                                  ("a", 38, "u_c", GLD), ("b", "PWM の段", "pwm", GLD, GOSOFT), ("a", 38, "u", GLD), ("b", "温度の板", "p"),
                                  ("a", 22, None, SIG), ("t", "tp", SIG), ("a", 30, "θ", SIG)])
    o.append(svg)
    o.append(FBPATH(pos["tp"], pos["s"], yc, 64, c=TEA, box="ADC の段", bc=TEA, bfill=TSOFT, lab=None))
    o.append(TX((pos["tp"] + pos["s"]) / 2 - 62, yc + 58, "読み y_q", "end", 10, TEA, True, halo=True))
    xp0, xp1 = pos["pwm"]
    o.append(_f16_stair(xp0 + 18, yc - 46, 30, 20, GLD))
    xa = (pos["tp"] + pos["s"]) / 2
    o.append(_f16_stair(xa - 15, yc + 80, 30, 18, TEA))
    o.append(T(xp1 + 4, yc - 30, "1 段 Δu", "start", 9.5, GLD))
    o.append(T(xa + 22, yc + 96, "1 段 = 1 LSB", "start", 9.5, TEA))
    # 表
    yt = 196
    o.append(T(14, yt, "1 段の大きさ（例の値: ADC は 0〜102.4 °C、PWM は 0〜80 W）", "start", 10, INK, True))
    hdr = ["ビット数", "6", "8", "10", "12"]
    xs = [14, 214, 274, 334, 394]
    rows = [("ADC の 1 LSB [K]", ["—", "0.4", "0.1", "0.025"], TEA),
            ("PWM の 1 段 Δu [W]", ["1.25", "0.31", "0.078", "0.020"], GLD),
            ("行き着く温度の差 KΔu [K]", ["1.56", "0.39", "0.098", "0.024"], GLD)]
    for x, h_ in zip(xs, hdr):
        o.append(T(x, yt + 22, h_, "start" if x == 14 else "middle", 9.5, MUT, True))
    o.append(W(14, yt + 28, 420, yt + 28, c=LIN, lw=1))
    for i, (nm, vals, c) in enumerate(rows):
        y = yt + 46 + i * 19
        o.append(TX(14, y, nm, "start", 9.5, c, True))
        for x, v in zip(xs[1:], vals):
            o.append(T(x, y, v, "middle", 9.5, INK))
    # (b) 温度の目盛
    xb = 452
    o.append(T(xb, 18, "(b) 出力の段ごとに行き着く温度", "start", 11, INK, True))
    o.append(T(xb, 34, "と ADC 10 ビットの段（周りの温度 23 °C）", "start", 9.5, MUT))
    lo, hi = 59.4, 60.6
    ytop, ybot = 52, 262
    Yv = lambda v: ybot - (v - lo) / (hi - lo) * (ybot - ytop)
    xax = xb + 36
    o.append(RECT(xax, Yv(60.05), 190, Yv(59.95) - Yv(60.05), 0, GSOFT, "none", 0))
    for j in range(13):
        v = 59.45 + 0.1 * j
        if v <= hi:
            o.append(W(xax, Yv(v), xax + 190, Yv(v), c=TEA, lw=0.8, dash="3 3"))
    o.append(W(xax, ytop, xax, ybot, c=MUT, lw=1.2))
    for v in (59.5, 60.0, 60.5):
        o.append(W(xax - 4, Yv(v), xax, Yv(v), c=MUT, lw=1))
        o.append(T(xax - 7, Yv(v) + 3.5, _f16_f(v, 1), "end", 9.5, MUT))
    o.append(T(xax + 4, Yv(60.0) + 3.5, "偏差の読み 0", "start", 9.5, GRN, True, halo=True))
    c1, c2 = xax + 85, xax + 158
    o.append(TX(c1, ybot + 16, "6 ビット", "middle", 9.5, INK, True))
    o.append(TX(c2, ybot + 16, "10 ビット", "middle", 9.5, INK, True))
    for j in range(20, 28):
        v = 23.0 + 1.5625 * j
        if lo <= v <= hi:
            o.append(D(c1, Yv(v), GRN if abs(v - 60) < 0.05 else ALI, 4.2))
    o.append(ARR(c1, Yv(59.5), c1, ybot - 2, c=ALI, lw=1.2, head=6))
    o.append(T(c1 - 8, Yv(59.55), "58.94", "end", 9.5, ALI, halo=True))
    o.append(T(c1 - 8, Yv(60.50) + 3.5, "60.50", "end", 9.5, ALI, halo=True))
    for j in range(370, 390):
        v = 23.0 + 0.09765625 * j
        if lo <= v <= hi:
            o.append(D(c2, Yv(v), GRN if abs(v - 60) < 0.05 else GLD, 3.2))
    o.append(T(c2 + 8, Yv(60.012) + 3.5, "60.01", "start", 9.5, GRN, True, halo=True))
    o.append(T(c1, ybot + 30, "止まれる段なし", "middle", 9.5, ALI, True))
    o.append(T(c2, ybot + 30, "止まれる段あり", "middle", 9.5, GRN, True))
    o.append(T(xb + 6, ybot + 16, "PWM:", "start", 9.5, MUT))
    return SVG(700, ybot + 40, o, "量子化。(a) 制御器の出す操作量は PWM の段に、板の温度は ADC の段に丸められる。表は、例の値での 1 段の大きさと、出力の 1 段で板の行き着く温度が変わる量 KΔu（K = 1.25 K/W）。(b) 周りの温度が 23 °C のとき、出力の段ごとに板が行き着く温度（点）と、ADC 10 ビットの段（破線）。偏差の読みが 0 になる範囲（緑の帯）に入る点が無ければ、I の分は止まれない。PWM 6 ビットでは KΔu = 1.56 K が帯の幅 0.1 K より大きく、どの段も帯に入らない。10 ビットでは 0.098 K で、少なくとも 1 つの段が帯に入る。")
F["e16_qloop"] = _f16_qloop_fig()


def _f16_limit_fig():
    o = []
    lv8 = [27.8125, 28.125, 29.375, 29.6875]
    cases = [("(a) PWM 8 ビット、ADC は段なし", dict(bp=8), (27.5, 30.5), lv8),
             ("(b) ADC 10 ビット、PWM は段なし", dict(ba=10), (27.5, 31.5), []),
             ("(c) PWM 8 ビット、端数を持ち越す", dict(bp=8, carry=True), (27.5, 30.5), lv8),
             ("(d) PID（10 章 5 節）、ADC 10 ビット", dict(ba=10, kp=24.0, ti=40.0, td=10.0), (10.0, 50.0), [])]
    y0 = 10
    for i, (ttl, kw, ur, lev) in enumerate(cases):
        t, th, ym, v = _f16_qsim(**kw)
        yb = y0 + i * 122
        o.append(T(14, yb + 12, ttl, "start", 10.5, INK, True))
        m = t >= 1500
        pp = th[m].max() - th[m].min()
        o.append(T(352, yb + 12, "揺れ（1500 s 以降）%s K" % (_f16_f(pp, 4) if pp < 0.01 else _f16_f(pp, 3)), "end", 9.5, SIG, True))
        p = Plot(62, yb + 22, 290, 70, (0, 2500), (59.8, 60.1))
        last = i == 3
        o.append(p.axes(xl="時間 t [s]" if last else None, yl=None, xt=[0, 500, 1000, 1500, 2000, 2500], yt=[59.8, 59.9, 60.0, 60.1], sz=9.5,
                        xfmt=(lambda v: "%d" % v) if last else (lambda v: ""), yfmt=lambda v: _f16_f(v, 1)))
        o.append(W(p.X(0), p.Y(60), p.X(2500), p.Y(60), c=MUT, lw=1, dash="5 3"))
        if kw.get("ba"):
            sp = []
            for a_, b_, c_ in zip(t[:-1], t[1:], ym[:-1]):
                sp += [(a_, c_), (b_, c_)]
            o.append(p.clip(sp, c=TEA, lw=1.2))
        o.append(p.clip(list(zip(t, th)), c=SIG, lw=1.6))
        q = Plot(418, yb + 22, 262, 70, (0, 2500), ur)
        yt = [ur[0], (ur[0] + ur[1]) / 2, ur[1]] if i == 3 else [28.0, 29.0, 30.0] + ([31.0] if ur[1] > 31 else [])
        o.append(q.axes(xl="時間 t [s]" if last else None, yl=None, xt=[0, 500, 1000, 1500, 2000, 2500], yt=yt, sz=9.5,
                        xfmt=(lambda v: "%d" % v) if last else (lambda v: ""), yfmt=lambda v: _f16_f(v, 1)))
        for lv in lev:
            o.append(W(q.X(0), q.Y(lv), q.X(2500), q.Y(lv), c=GLD, lw=0.8, dash="3 3"))
        sp = []
        for a_, b_, c_ in zip(t[:-1], t[1:], v[:-1]):
            sp += [(a_, c_), (b_, c_)]
        o.append(q.clip(sp, c=GLD, lw=1.1))
        if i == 0:
            o.append(T(418, yb + 12, "ヒータの電力 [W]", "start", 9.5, GLD, True))
    yl = y0 + 4 * 122 + 26
    o.append(LEGL(14, yl, [(SIG, None, "板の温度 [°C]（左）"), (TEA, None, "読み（ADC の段）"), (MUT, "5 3", "目標 60 °C"), (GLD, None, "ヒータの電力（右）"), (GLD, "3 3", "PWM の段")], 9.5, 12))
    return SVG(700, yl + 10, o, "量子化によるリミットサイクル（温度の板、PI 10 W/K・160 s、1 s ごと。200 s に周りの温度が 25 °C から 23 °C に下がり、保つのに要る電力が 29.6 W になる）。(a) 出力の段が粗いと、29.6 W をはさむ 2 つの段を約 106 s で往復し続ける。(b) ADC の段が粗いと、読みが 60.0 °C の間は I の分が止まり、温度は 1 LSB ほどの幅をゆっくり往復する。(c) 端数を持ち越すと、往復が速くなり、板がならして温度はほとんど揺れない。(d) 測定値の微分が ADC の段差を 12 W の山にする。")
F["e16_limit"] = _f16_limit_fig()


# =====================================================================
# 4 節: 固定小数点
# =====================================================================
def _f16_bits(x, y, w, nint, nfrac, lab, sz=9.5):
    """32 ビットの並び（符号・整数部・小数部）。"""
    n = 1 + nint + nfrac
    cw = w / n
    o = []
    for i in range(n):
        if i == 0:
            c = ALI
        elif i <= nint:
            c = SIG
        else:
            c = GRN
        o.append(RECT(x + i * cw, y, cw, 20, 0, soft(c), c, 0.8))
    o.append(T(x + cw / 2, y + 34, "符号", "middle", sz, ALI, True))
    if nint >= 8:
        o.append(T(x + cw * (1 + nint / 2), y + 34, "整数部 %d ビット" % nint, "middle", sz, SIG, True))
    elif nint:
        o.append(T(x + cw + 14, y + 34, "整数部 %d ビット" % nint, "start", sz, SIG, True))
    o.append(T(x + cw * (1 + nint + nfrac / 2), y + 34, "小数部 %d ビット" % nfrac, "middle", sz, GRN, True))
    o.append(T(x - 8, y + 15, lab, "end", 10, INK, True))
    return "".join(o)


def _f16_qfmt_fig():
    o = []
    o.append(T(14, 18, "(a) 32 ビットの整数を、決めた 2 のべきで割った値として読む", "start", 11, INK, True))
    o.append(_f16_bits(110, 32, 572, 15, 16, "Q16.16"))
    o.append(TX(110, 84, "x = X/2^{16}。刻み 2^{−16} = 1.53 × 10^{−5}、範囲 −32768 以上 32768 未満", "start", 9.5, MUT))
    o.append(_f16_bits(110, 98, 572, 4, 27, "Q5.27"))
    o.append(TX(110, 150, "x = X/2^{27}。刻み 7.5 × 10^{−9}、範囲 −16 以上 16 未満（20 rad は表せない）", "start", 9.5, MUT))
    # (b) 係数を整数にする
    o.append(T(14, 184, "(b) 係数を整数にする（Q16.16）", "start", 11, INK, True))
    steps = [("0.84", INK), ("× 65536 → 55050.24", MUT), ("四捨五入 → 55050", SIG), ("÷ 65536 → 0.8399963", GRN)]
    x = 14
    for i, (s, c) in enumerate(steps):
        w = TXW(s, 10) + 16
        o.append(RECT(x, 194, w, 26, 5, soft(c) if c != INK else PAN, c, 1.1))
        o.append(T(x + w / 2, 211, s, "middle", 10, c if c != MUT else INK, i in (0, 2)))
        if i < 3:
            o.append(ARR(x + w + 2, 207, x + w + 14, 207, c=MUT, lw=1.2, head=5))
        x += w + 16
    o.append(TX(14, 238, "差 −0.0004 %。K_P T_s/T_I = 0.005 は 328（+0.098 %）で、小さい係数ほど割合の誤差が大きい", "start", 9.5, MUT))
    # (c) 積の桁合わせ
    o.append(TX(14, 272, "(c) 積の桁合わせ: 64 ビットで掛け、2^{15} を足してから 16 ビット右へずらす（四捨五入）", "start", 11, INK, True))
    xa, wa = 110, 572
    cw = wa / 64
    for i in range(64):
        c = ALI if i == 0 else (SIG if i < 32 else GRN)
        keep = 16 <= i < 48
        o.append(RECT(xa + i * cw, 284, cw, 18, 0, soft(c) if keep else SCR, c if keep else LIN, 0.6))
    o.append(T(xa - 8, 297, "積", "end", 10, INK, True))
    o.append(T(xa + cw * 8, 320, "捨てる上位（桁あふれは飽和演算で）", "middle", 9.5, MUT))
    o.append(T(xa + cw * 32, 320, "残す 32 ビット = Q16.16", "middle", 9.5, SIG, True))
    o.append(T(xa + cw * 56, 320, "捨てる下位（丸める）", "middle", 9.5, MUT))
    o.append(DARR(xa + cw * 16, 308, xa + cw * 48, 308, c=SIG, lw=1, head=5))
    o.append(TX(14, 344, "例: K_P × e（e = 0.5 rad、32768）= 55050 × 32768 = 1803878400。32768 を足して 65536 で割ると 27525", "start", 9.5, INK))
    o.append(T(14, 361, "（0.4199982 V。正しい値は 0.42 V）", "start", 9.5, INK))
    return SVG(700, 370, o, "固定小数点と Q 形式。(a) 同じ 32 ビットの整数でも、小数部を何ビットとみなすかで、刻みと範囲が入れ替わる（Q16.16 は符号を含めて整数部 16 ビット、小数部 16 ビット）。(b) 係数は、2 のべきを掛けて四捨五入した整数で持つ。(c) 小数部 16 ビットどうしの積は小数部 32 ビットになるので、64 ビットで掛けてから 16 ビット右へずらし、真ん中の 32 ビットを残す。")
F["e16_qfmt"] = _f16_qfmt_fig()


def _f16_fx_run(f=16, wide=True, ovf="sat", rnd="round", r=1.0, tload=1.0, tend=5.0, ts=1e-3, b=0.5):
    """16 章 4 節の pid_q16_step と同じ整数の計算（小数部 f ビット）でモータの角度を 1 ms ごとに動かす。
    wide=False なら I の分を小数部 f ビットのまま丸めてためる。ovf: "sat"（飽和演算）・"wrap"（一周する）。返り値 (t, 角度)。"""
    I32MIN, I32MAX = -2 ** 31, 2 ** 31 - 1
    sat = lambda v: I32MAX if v > I32MAX else (I32MIN if v < I32MIN else v)
    wrap = lambda v: ((v + 2 ** 31) % 2 ** 32) - 2 ** 31
    L = sat if ovf == "sat" else wrap
    def rq(v, s):
        if rnd == "floor":
            return v >> s
        h = 1 << (s - 1)
        return (v + h) >> s if v >= 0 else -((h - v) >> s)
    def toq(x):
        v = x * 2.0 ** f
        return L(int(_f16_np.floor(v + 0.5)) if v >= 0 else -int(_f16_np.floor(-v + 0.5)))
    a = 0.0238 / (0.0238 + 10.0 * ts)
    KP, B, A, AKN, KI = toq(0.84), toq(b), toq(a), toq(a * 0.84 * 10.0), toq(0.84 * ts / 0.168)
    UMIN, UMAX = toq(-12.0), toq(12.0)
    I = 0; D = 0; Y1 = toq(0.0); R = toq(r)
    th = w = 0.0
    T_, Y_ = [0.0], [0.0]
    for k in range(int(round(tend / ts))):
        Y = toq(th)
        E = L(R - Y)
        D = L(rq(A * D, f) - rq(AKN * L(Y - Y1), f))
        Y1 = Y
        PD = L(rq(KP * L(rq(B * R, f) - Y), f) + D)
        UC = PD + (rq(I, f) if wide else I)
        U = UMAX if UC > UMAX else (UMIN if UC < UMIN else UC)
        U = L(U)
        if not ((UC > UMAX and E > 0) or (UC < UMIN and E < 0)):
            I = I + KI * E if wide else L(I + rq(KI * E, f))
        d = 1.0 if (tload is not None and k * ts >= tload - 1e-12) else 0.0
        th, w = _f16_madv(th, w, U / 2.0 ** f - d, ts)
        T_.append((k + 1) * ts); Y_.append(th)
    return _f16_np.array(T_), _f16_np.array(Y_)


def _f16_qres_fig():
    o = []
    o.append(T(14, 18, "(a) 負荷トルクの後に残る偏差（5 s 後）", "start", 11, INK, True))
    fs = [8, 10, 12, 14, 16, 18, 20, 24]
    p = Plot(70, 34, 260, 200, (7, 25), (1e-9, 1.0), ylog=True)
    o.append(p.axes(xl="小数部のビット数 f", yl="偏差 [rad]", xt=[8, 12, 16, 20, 24], yt=[1e-9, 1e-7, 1e-5, 1e-3, 1e-1], sz=9.5,
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: ""))
    for v in (1e-9, 1e-7, 1e-5, 1e-3, 1e-1):
        o.append(TX(p.x - 7, p.Y(v) + 3.3, "10^{%d}" % round(_f16_np.log10(v)), "end", 9.5, MUT))
    o.append(p.line([(x, 0.5 * 2.0 ** -x / 0.005) for x in _f16_np.linspace(7, 25, 40)], c=MUT, lw=1.2, dash="5 3"))
    o.append(p.line([(x, 0.5 * 2.0 ** -x) for x in _f16_np.linspace(7, 25, 40)], c=GRN, lw=1.2, dash="2 3"))
    for wide, c in ((False, ALI), (True, GRN)):
        pts = []
        for f in fs:
            t, th = _f16_fx_run(f=f, wide=wide)
            pts.append((f, max(abs(1.0 - th[-1]), 1e-9)))
        if not wide:
            o.append(p.line(pts, c=c, lw=2))
        for x, v in pts:
            o.append(D(p.X(x), p.Y(v), c, 3.4))
    o.append(TX(p.X(24.5), p.Y(1.2e-4), "2^{−f}/(2k_I)", "end", 9.5, MUT, halo=True))
    o.append(TX(p.X(24.5), p.Y(2.5e-8), "1/2 LSB", "end", 9.5, GRN, halo=True))
    o.append(T(p.X(7.5), p.Y(3e-7), "赤: Qf のまま丸める", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(7.5), p.Y(5e-8), "緑: 64 ビットでためる", "start", 9.5, GRN, True, halo=True))
    o.append(T(372, 18, "(b) 目標 20 rad（範囲 ±16 と ±32 の形）", "start", 11, INK, True))
    q = Plot(410, 34, 270, 200, (0, 2), (-15, 25))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.5, 1, 1.5, 2], yt=[-10, 0, 10, 20], sz=9.5))
    o.append(W(q.X(0), q.Y(20), q.X(2), q.Y(20), c=MUT, lw=1, dash="5 3"))
    for f, ovf, c, lab, ly in ((26, "sat", GRN, "Q6.26: 20 rad", 20), (27, "sat", GLD, "Q5.27 飽和演算: 16 rad で止まる", 16), (27, "wrap", ALI, "Q5.27 一周する: −12 rad へ", -12)):
        t, th = _f16_fx_run(f=f, ovf=ovf, r=20.0, tload=None, tend=2.0)
        o.append(q.line(list(zip(t, th)), c=c, lw=2))
        o.append(T(q.X(1.98), q.Y(ly) + (13 if ly != 20 else -6), lab, "end", 9.5, c, True, halo=True))
    return SVG(700, 284, o, "整数で計算したときの誤り（モータの角度の PID、1 ms ごと）。(a) I の分の増分を小数部 f ビットに丸めてためると、偏差が 2<sup>−f</sup>/(2k<sub>I</sub>)（破線）より小さい所で I の分が動かなくなり、負荷トルクを支えきれずに偏差が残る（k<sub>I</sub> = K<sub>P</sub>T<sub>s</sub>/T<sub>I</sub> = 0.005）。積を右へずらさずに 64 ビットでためると、残る偏差は 1/2 LSB（点線）より小さい。(b) 範囲 ±16 の形で目標 20 rad を表すと、一周する計算では目標が −12 rad になって逆へ回り、飽和演算では 16 rad で止まる。整数部を 1 ビット増やせば正しく動く。")
F["e16_qres"] = _f16_qres_fig()


# =====================================================================
# 5 節: 起動・停止・異常
# =====================================================================
def _f16_modes_fig():
    o = []
    st = {"stop": (95, 70, "停止", MUT, "出力: 安全な値"), "auto": (375, 70, "自動", SIG, "出力: pid_step()"),
          "man": (615, 70, "手動", GLD, "出力: 手動の値"), "fault": (375, 236, "異常", ALI, "出力: 安全な値・記録")}
    for k, (x, y, nm, c, sub) in st.items():
        o.append(STATE(x, y, 150, 52, nm, c, sub))
    o.append(EDGE(170, 60, 300, 60, None, 0, SIG, 1.5))
    o.append(T(235, 52, "始める", "middle", 10, SIG, True))
    o.append(EDGE(300, 82, 170, 82, None, 0, MUT, 1.3))
    o.append(T(235, 100, "止める", "middle", 10, MUT, True))
    o.append(EDGE(450, 60, 540, 60, None, 0, GLD, 1.5))
    o.append(T(495, 52, "手動へ", "middle", 10, GLD, True))
    o.append(EDGE(540, 82, 450, 82, None, 0, SIG, 1.5))
    o.append(T(495, 100, "自動へ", "middle", 10, SIG, True))
    o.append(T(14, 128, "始めるとき: pid_start() で D の分と y1 を整え、", "start", 9.5, SIG))
    o.append(T(14, 143, "I の分を今の操作量に合わせる（跳ねない）", "start", 9.5, SIG))
    o.append(T(690, 128, "手動の間: pid_manual() で I の分を", "end", 9.5, GLD))
    o.append(T(690, 143, "出している値に合わせ続ける（跳ねない）", "end", 9.5, GLD))
    o.append(EDGE(375, 96, 375, 210, None, 0, ALI, 1.6))
    o.append(EDGE(600, 96, 440, 214, None, 0, ALI, 1.4))
    o.append(T(365, 166, "読めない回が 3 回続く・範囲の外・NaN", "end", 9.5, ALI, True))
    o.append(T(365, 181, "周期に間に合わない回が続く", "end", 9.5, ALI, True))
    o.append(T(365, 196, "張り付いたまま動かない（拘束）", "end", 9.5, ALI, True))
    o.append(W(300, 246, 60, 246, 60, 96, c=MUT, lw=1.3, dash="5 3"))
    o.append(_head(60, 110, 60, 96, MUT, 7))
    o.append(T(70, 238, "人が原因を直して戻す（自動では戻らない）", "start", 9.5, MUT, True))
    return SVG(700, 272, o, "制御器の運転の状態と、状態を移るときにすること。停止と異常では安全な値（モータなら 0 V、ヒータなら 0 W）を出し、PID の計算をしない。停止から始めるときと、手動と自動を切り替えるときは、I の分を今の操作量に合わせて跳ねないようにする。異常へは、自動と手動のどちらからでも移り（停止の間に見張るものは機器による）、人が原因を直すまで戻らない。")
F["e16_modes"] = _f16_modes_fig()


def _f16_start_run(kind, tend=0.5, Ts=1e-3):
    """2 rad で止まっているモータを、目標 2 rad の PID（b = 0.5）で保ち始める。
    kind: "none"（1 回前の値が 0 のまま）・"start"（pid_start だけ。I の分 0）・"bump"（I の分を今の電圧 0 V に合わせる）。"""
    c = _F16PID(dt=Ts)
    th, w = 2.0, 0.0
    if kind == "none":
        c.i = 0.0; c.d = 0.0; c.y1 = 0.0
    else:
        c.start(th)
        if kind == "bump":
            c.i = 0.0 - c.pd(th, th)
    T_, Y_, U_ = [0.0], [th], []
    for k in range(int(round(tend / Ts))):
        u = c.step(2.0, th)
        U_.append(u)
        th, w = _f16_madv(th, w, u, Ts)
        T_.append((k + 1) * Ts); Y_.append(th)
    U_.append(U_[-1])
    return _f16_np.array(T_), _f16_np.array(Y_), _f16_np.array(U_)


def _f16_fault_run(guard, tend=3000, tfail=600):
    """温度の板を PI（10 W/K・160 s、0〜80 W、1 s ごと）で 25 °C から 60 °C に温め、tfail に NTC が断線して
    読みが −40 °C になる。guard なら、読みが範囲（−20〜150 °C）の外の回が 3 回続いたら異常として 0 W にする（5 節の ctl_tick と同じ）。"""
    c = _F16PID(kp=10.0, ti=160.0, td=0.0, n=10.0, b=1.0, dt=1.0, umin=0.0, umax=80.0)
    c.start(25.0)
    q = _f16_np.exp(-1.0 / 500.0)
    hist = [25.0] * 20; th = 25.0
    bad = 0; fault = False; u = 0.0; tf = None
    T_, TH, RD, U_ = [], [], [], []
    for k in range(tend + 1):
        rd = -40.0 if k >= tfail else hist[0]
        ok = (-20.0 < rd < 150.0) if guard else True
        if not ok:
            bad += 1
            if bad >= 3:
                fault = True
                if tf is None:
                    tf = k
            u = 0.0 if fault else u
        else:
            bad = 0
            u = 0.0 if fault else c.step(60.0, rd)
        T_.append(k); TH.append(th); RD.append(rd); U_.append(u)
        tinf = 25.0 + 1.25 * u
        hist.pop(0); hist.append(th)
        th = tinf + (th - tinf) * q
    return _f16_np.array(T_), _f16_np.array(TH), _f16_np.array(RD), _f16_np.array(U_), tf


def _f16_start_fig():
    o = []
    o.append(T(14, 18, "(a) 2 rad で止まっているモータを、目標 2 rad で保ち始める", "start", 11, INK, True))
    p = Plot(62, 34, 270, 170, (0, 0.5), (0.6, 2.2))
    o.append(p.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yt=[0.6, 1.0, 1.4, 1.8, 2.2], sz=9.5,
                    xfmt=lambda v: _f16_f(v, 1), yfmt=lambda v: _f16_f(v, 1)))
    o.append(W(p.X(0), p.Y(2), p.X(0.5), p.Y(2), c=MUT, lw=1, dash="5 3"))
    cases = [("none", ALI, "1 回前の値が 0 のまま"), ("start", GLD, "I の分を 0 にする"), ("bump", GRN, "I の分を今の 0 V に合わせる")]
    for k, c, lab in cases:
        t, th, u = _f16_start_run(k)
        o.append(p.line(list(zip(t, th)), c=c, lw=2))
    t, th, u = _f16_start_run("none")
    o.append(T(p.X(0.06) + 4, p.Y(th.min()) + 4, "前の値が 0 のまま: %s rad まで戻される" % _f16_f(th.min(), 2), "start", 9.5, ALI, True, halo=True))
    t, th, u = _f16_start_run("start")
    o.append(T(p.X(0.17), p.Y(th.min()) - 6, "I の分を 0: %s rad まで動く" % _f16_f(th.min(), 2), "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.49), p.Y(2.0) - 6, "I の分を今の 0 V に合わせる: 動かない", "end", 9.5, GRN, True, halo=True))
    t, th, u = _f16_start_run("none")
    o.append(T(62, 246, "前の値が 0 のままだと、始めの回は", "start", 9.5, ALI))
    o.append(T(62, 262, "%s V を求め、%s V に張り付く" % (_f16_f(-0.84 - 0.7041 * 0.84 * 10 * 2.0, 1), _f16_f(u[0], 0)), "start", 9.5, ALI))
    # (b) センサの断線
    o.append(T(372, 18, "(b) 600 s に温度センサの線が切れる", "start", 11, INK, True))
    q = Plot(410, 34, 270, 170, (0, 3000), (0, 140))
    o.append(q.axes(xl="時間 t [s]", yl="板の温度 [°C]", xt=[0, 1000, 2000, 3000], yt=[0, 40, 80, 120], sz=9.5))
    o.append(W(q.X(600), q.y, q.X(600), q.y + q.h, c=ALI, lw=1, dash="3 3"))
    t0, th0, rd0, u0, tf0 = _f16_fault_run(False)
    t1, th1, rd1, u1, tf1 = _f16_fault_run(True)
    o.append(q.line(list(zip(t0, th0)), c=ALI, lw=2))
    o.append(q.line(list(zip(t1, th1)), c=GRN, lw=2))
    o.append(T(q.X(2950), q.Y(th0[-1]) + 15, "見張りなし: 80 W のまま %s °C" % _f16_f(th0[-1], 1), "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(2950), q.Y(th1[-1]) - 8, "3 回で異常（%d s）→ 0 W" % tf1, "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(620), q.Y(8), "読みは −40 °C", "start", 9.5, TEA, halo=True))
    o.append(T(410, 248, "ヒータの電力（0〜80 W）", "start", 9.5, MUT))
    for j, (u_, c) in enumerate(((u0, ALI), (u1, GRN))):
        ys = 254 + j * 14
        o.append(RECT(q.x, ys, q.w, 10, 2, SCR, LIN, 0.8))
        pts = [(q.X(0), ys + 10)] + [(q.X(tt), ys + 10 - uu / 80 * 10) for tt, uu in zip(t0[::5], u_[::5])] + [(q.X(3000), ys + 10)]
        o.append(PL(pts, c=c, lw=0.8, fill=soft(c)))
    return SVG(700, 284, o, "始めるときと異常のとき。(a) 2 rad で止まっているモータ（PID、b = 0.5）を目標 2 rad のまま保ち始める。1 回前の測った値を 0 のままにすると、始めの回の D の分が −aK<sub>P</sub>N × 2 rad になり、電圧が −12 V に張り付く。I の分を 0 にすると、目標の位置でも P の分 K<sub>P</sub>(b − 1)r = −0.84 V が出る。I の分を今の電圧に合わせると動かない。(b) 温度の板を PI で 60 °C に保っている 600 s に NTC の線が切れ、読みが最も冷たい側になる。見張りが無いと、ヒータは 80 W のまま、板は 125 °C に向かう。読みが範囲の外の回が 3 回続いたら異常と決めると、602 s にヒータを切る。")
F["e16_start"] = _f16_start_fig()


# =====================================================================
# 6 節: ログ・正弦波を足して測る・試験の段階
# =====================================================================
def _f16_log_fig():
    o = []
    o.append(T(14, 18, "(a) リングバッファ: 最後の 1024 周期分を上書きしながら残し、きっかけの前後を取り出す", "start", 11, INK, True))
    x0, x1 = 30, 670
    n = 32
    cw = (x1 - x0) / n
    wp = 21
    for i in range(n):
        c = GLD if i == wp else TEA
        o.append(RECT(x0 + i * cw, 40, cw, 22, 0, soft(c), c, 1.6 if i == wp else 0.8))
    o.append(ARR(x0 + (wp + 0.5) * cw, 92, x0 + (wp + 0.5) * cw, 66, c=GLD, lw=1.6, head=7))
    o.append(T(x0 + (wp + 0.5) * cw, 106, "次に書く場所（log_k % 1024）", "middle", 9.5, GLD, True))
    o.append(T(x0, 84, "古い記録の上に、新しい記録を書く", "start", 9.5, MUT))
    o.append(TX(x1, 84, "1 つの枠 = 1 周期の r・y・u_c・u", "end", 9.5, MUT))
    # 時間の軸での取り出し
    o.append(T(14, 136, "きっかけ（目標値を変えた・異常）の前 256 周期と後 768 周期を止めて残し、後でゆっくり送る", "start", 10, INK))
    tx0, tx1 = 30, 670
    o.append(W(tx0, 170, tx1, 170, c=MUT, lw=1))
    xt = tx0 + (tx1 - tx0) * 0.35
    o.append(RECT(tx0 + (tx1 - tx0) * 0.10, 158, (tx1 - tx0) * 0.25, 24, 3, soft(SIG), SIG, 1))
    o.append(RECT(xt, 158, (tx1 - tx0) * 0.55, 24, 3, soft(TEA), TEA, 1))
    o.append(T(tx0 + (tx1 - tx0) * 0.225, 174, "前 256 周期", "middle", 9.5, SIG, True))
    o.append(T(xt + (tx1 - tx0) * 0.275, 174, "後 768 周期（1 ms ごとなら 0.77 s）", "middle", 9.5, TEA, True))
    o.append(W(xt, 148, xt, 192, c=ALI, lw=2))
    o.append(T(xt, 206, "きっかけ", "middle", 9.5, ALI, True))
    # (b) 帯域
    o.append(T(14, 240, "(b) 1 ms ごとの記録の量と、UART（115200 bps）で送れる量", "start", 11, INK, True))
    items = [("float 4 つ（16 バイト）", 16.0, ALI), ("int16 4 つ（8 バイト）", 8.0, GRN), ("UART で送れる量", 11.52, MUT)]
    for i, (lab, v, c) in enumerate(items):
        y = 256 + i * 26
        o.append(T(200, y + 14, lab, "end", 9.5, INK))
        o.append(RECT(210, y + 2, v / 18.0 * 420, 16, 2, soft(c), c, 1))
        o.append(T(214 + v / 18.0 * 420, y + 14, "%s kB/s" % (_f16_f(v, 1) if v != 11.52 else "11.5"), "start", 9.5, c, True))
    o.append(T(14, 348, "全部を送り続けられないので、RAM に残してきっかけの前後だけを送るか、間引く（1024 周期分は float で 16 KB）", "start", 9.5, MUT))
    return SVG(700, 358, o, "周期ごとのログ。(a) RAM のリングバッファに、周期ごとの目標値・測った値・計算した操作量・出した操作量を上書きしながら残す。目標値を変えた、異常が起きた、などのきっかけで書くのを止め、その前後を後で送る。(b) 1 ms ごとに float を 4 つ残すと 16 kB/s で、115200 bps の UART（1 バイトに 10 ビットとして約 11.5 kB/s）では送り切れない。")
F["e16_log"] = _f16_log_fig()


def _f16_loopL(w, Ts=1e-3, d=1):
    """モータの角度の PID（10 章 6 節の値）を Ts ごとに計算するループの一巡伝達関数 P(z)C(z)z^{−d} の z = e^{jωTs} での値。"""
    from scipy.linalg import expm as _expm
    M = _f16_np.zeros((3, 3)); M[0, 1] = Ts; M[1, 1] = -20.0 * Ts; M[1, 2] = 1000.0 * Ts
    E = _expm(M); Ad, Bd = E[:2, :2], E[:2, 2]
    kp, ti, td, N = 0.84, 0.168, 0.0238, 10.0
    a = td / (td + N * Ts); ki = kp * Ts / ti
    z = _f16_np.exp(1j * w * Ts)
    P = _f16_np.array([1.0, 0.0]) @ _f16_np.linalg.solve(z * _f16_np.eye(2) - Ad, Bd)
    C = kp + ki / (z - 1) + a * kp * N * (z - 1) / (z - a)
    return C * P * z ** (-d)


def _f16_inject_meas(w, A=0.2, M=3, settle=1.0, Ts=1e-3):
    """16 章 6 節のとおり、(B) の出し方のループの操作量に A sin ωt を足し、記録の u_c と u から −U_c/U を求める。"""
    c = _F16PID(dt=Ts)
    th, wv = 1.0, 0.0
    c.start(th); c.i = 0.0 - c.pd(1.0, th)
    nP = 2 * _f16_np.pi / (w * Ts); nrec = int(round(M * nP)); n0 = int(round(settle / Ts))
    u_next = 0.0; Uc = 0j; U = 0j
    for k in range(n0 + nrec):
        u_out = u_next
        uc = c.step(1.0, th)
        u_next = min(max(uc + A * _f16_np.sin(w * k * Ts), -12.0), 12.0)
        if k >= n0:
            e = _f16_np.exp(-1j * w * k * Ts)
            Uc += uc * e; U += u_next * e
        th, wv = _f16_madv(th, wv, u_out, Ts)
    return -Uc / U


def _f16_inject_fig():
    o = []
    o.append(T(14, 18, "(a) ループを閉じたまま、操作量に正弦波 d を足す", "start", 11, INK, True))
    yc = 76
    svg, pos, xe = CHAIN(14, yc, [("a", 34, "r", MUT), ("s", {"l": "+", "b": "−"}, "s"), ("a", 24, None, MUT), ("b", "C", "c"),
                                  ("a", 24, None, GLD), ("t", "tuc", GLD), ("a", 26, "u_c", GLD), ("s", {"l": "+", "t": "+"}, "s2"),
                                  ("a", 24, None, GLD), ("t", "tu", GLD), ("a", 26, "u", GLD), ("b", "P", "p"), ("a", 26, None, SIG), ("t", "ty", SIG), ("a", 26, "y", SIG)])
    o.append(svg)
    o.append(TOPIN(pos["s2"], yc, 44, "d = A sin ωt", PUR))
    o.append(FBPATH(pos["ty"], pos["s"], yc, 46, c=SIG))
    for k, lab, c in (("tuc", "記録 u_c", GLD), ("tu", "記録 u", GLD), ("ty", "記録 y", SIG)):
        o.append(D(pos[k], yc, TEA, 4.2))
        o.append(TX(pos[k], yc + 22, lab, "middle", 9.5, TEA, True, halo=True))
    o.append(TX(14, 152, "目標値が一定なら U_c = −C·Y、Y = P·U なので、一巡伝達関数は P C = −U_c/U", "start", 10, INK, True))
    o.append(TX(14, 170, "（U_c・U は、記録に正弦波を掛けて平均した ω の成分。8 章 6 節）", "start", 9.5, MUT))
    # (b) ボード線図
    o.append(T(14, 200, "(b) モータの角度の PID（1 ms、(B) の出し方）で測った点（○）と厳密な値（線）", "start", 11, INK, True))
    ws = _f16_np.logspace(0, _f16_np.log10(400), 300)
    Ls = _f16_np.array([_f16_loopL(w) for w in ws])
    db = 20 * _f16_np.log10(_f16_np.abs(Ls)); ph = _f16_np.degrees(_f16_np.unwrap(_f16_np.angle(Ls)))
    ph = ph - 360.0 * round((ph[0] + 90) / 360.0)
    svgb, pm, pp, hh = BODE(70, 214, 600, [(ws, db, ph, SIG, None)], (1, 400), (-30, 50), (-200, -90), hm=110, hp=100, gap=26,
                           dbt=[-20, 0, 20, 40], pht=[-180, -135, -90])
    o.append(svgb)
    meas = [3, 5, 10, 20, 28, 40, 60, 100, 200]
    for w in meas:
        Lm = _f16_inject_meas(float(w))
        g = 20 * _f16_np.log10(abs(Lm)); a = _f16_np.degrees(_f16_np.angle(Lm))
        if a > 0:
            a -= 360
        o.append(CIRC(pm.X(w), pm.Y(g), 4, c=GLD, lw=1.8, fill=SCR))
        o.append(CIRC(pp.X(w), pp.Y(a), 4, c=GLD, lw=1.8, fill=SCR))
    from scipy.optimize import brentq as _bq
    wgc = _bq(lambda w: abs(_f16_loopL(w)) - 1, 5, 100)
    pmv = 180 + _f16_np.degrees(_f16_np.angle(_f16_loopL(wgc)))
    o.append(W(pm.X(wgc), pm.y, pm.X(wgc), pp.y + pp.h, c=ALI, lw=1, dash="3 3"))
    o.append(TX(pm.X(wgc) + 6, pm.Y(0) - 6, "ω_gc = %s rad/s" % _f16_f(wgc, 1), "start", 9.5, ALI, True, halo=True))
    o.append(DARR(pp.X(wgc), pp.Y(-180), pp.X(wgc), pp.Y(-180 + pmv), c=ALI, lw=1.2, head=5))
    o.append(T(pp.X(wgc) + 6, pp.Y(-160), "位相余裕 %s°" % _f16_f(pmv, 1), "start", 9.5, ALI, True, halo=True))
    return SVG(700, hh + 10, o, "ループを閉じたまま周波数応答を測る。(a) 目標値を一定にし、制御器の出す u<sub>c</sub> に正弦波 d を足して対象に出す。記録した u<sub>c</sub> と u の、角周波数 ω の成分の比から、一巡伝達関数が求まる。(b) モータの角度の PID（(B) の出し方）に振幅 0.2 V の正弦波を足し、それぞれ 1 s 待ってから 3 周期分を記録して求めた点（○）と、15 章 5 節の方法の厳密な値（線）。測った点は計算遅れと零次ホールドを含めた実際のループの値で、ゲイン交差角周波数と位相余裕を読める。")
F["e16_inject"] = _f16_inject_fig()


def _f16_tests_fig():
    o = []
    cols = [("ホストで模型と動かす", "（この章のテスト）", SIG), ("HIL", "マイコン ＋ 対象の模型", GLD), ("実機", "本当の対象", GRN)]
    rows = [("動くもの", ["制御のコードを PC で", "コンパイル。対象は模型", "", "マイコンの上のコード。", "対象を別の装置で模擬", "", "マイコンと本当の対象", "", ""]),
            ("見つかること", ["計算の誤り・桁あふれ", "飽和・故障の扱い", "", "周期・計算遅れ・", "割り込み・量子化", "", "モデルのずれ・ノイズ・", "摩擦・発熱", ""]),
            ("繰り返し", ["速い（数千回の", "場合を自動で）", "", "実時間で、何度でも", "", "", "遅い。壊さない範囲で", "小さな段差から", ""])]
    xs = [150, 330, 510]
    for (nm, sub, c), x in zip(cols, xs):
        o.append(RECT(x, 14, 170, 46, 8, soft(c), c, 1.4))
        o.append(T(x + 85, 34, nm, "middle", 11, c, True))
        o.append(T(x + 85, 51, sub, "middle", 9.5, MUT))
    for i in range(2):
        o.append(ARR(xs[i] + 172, 37, xs[i + 1] - 2, 37, c=MUT, lw=1.6, head=7))
    for r, (nm, cells) in enumerate(rows):
        y = 80 + r * 66
        o.append(T(14, y + 20, nm, "start", 10, INK, True))
        o.append(W(14, y - 6, 686, y - 6, c=LIN, lw=0.8))
        for j, x in enumerate(xs):
            for q in range(3):
                txt = cells[j * 3 + q]
                if txt:
                    o.append(T(x + 6, y + 14 + q * 16, txt, "start", 9.5, INK))
    return SVG(700, 280, o, "試験の段階。制御のコードを、まずホストのコンピュータで対象の模型とつないで動かし（この章と 10・11 章のテストの方法）、次にマイコンの上で、対象だけを模型にした装置（HIL）につないで周期と計算遅れを含めて確かめ、最後に実機で小さな段差と小さな正弦波から試す。左ほど速く多くの場合を試せ、右ほど本当の対象の性質が分かる。")
F["e16_tests"] = _f16_tests_fig()
