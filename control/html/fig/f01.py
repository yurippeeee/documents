# -*- coding: utf-8 -*-
# 01 章 制御とは何か の図
import numpy as _f01_np

# ---- 例の値（本文と同じ）: 台車 m = 1 kg、抵抗の係数 c = 2 N·s/m、目標 1 m/s、坂 3° ----
_F01_C, _F01_G, _F01_R = 2.0, 9.81, 1.0
def _f01_dslope(m, deg=3.0):
    return m * _F01_G * math.sin(math.radians(deg))

def _f01_sim(Kp, L=0.0, m=1.0, tend=8.0, h=1e-3, slope_t=None, uff=True, noise=0.0, seed=1, hold=0.01, rec=0.005, y0=0.0):
    """台車の速度を h 刻みで進める（刻みの間は力が一定として、速度の式を厳密に解く）。
    比例制御 u = u0 + Kp (r − 測った値)。測った値は L だけ遅れ、noise（標準偏差）を hold ごとに変える。
    slope_t 以降は 3° の上り坂。返り値 [(t, y, 測った値, u, d), ...]（rec ごと）。"""
    n = int(round(tend / h)); nd = int(round(L / h)); kr = max(1, int(round(rec / h))); kh = max(1, int(round(hold / h)))
    rng = _f01_np.random.default_rng(seed)
    hist = [0.0] * (n + 1); y = y0; nz = 0.0; out = []
    a = math.exp(-_F01_C * h / m); u0 = _F01_C * _F01_R if uff else 0.0
    for k in range(n + 1):
        t = k * h
        hist[k] = y
        ym = hist[k - nd] if k >= nd else y0
        if noise and k % kh == 0:
            nz = noise * rng.standard_normal()
        ymn = ym + (nz if noise else 0.0)
        u = u0 + Kp * (_F01_R - ymn)
        d = _f01_dslope(m) if (slope_t is not None and t >= slope_t - 1e-9) else 0.0
        if k % kr == 0:
            out.append((t, y, ymn, u, d))
        yinf = (u - d) / _F01_C
        y = yinf + (y - yinf) * a
    return out

def _f01_line(p, pts, c, lw=2.0, dash=None):
    """Plot p の縦の範囲に切り詰めた折れ線（範囲の外の点は端に寄せる）。"""
    y0, y1 = min(p.yr), max(p.yr)
    q = [(p.X(a), p.Y(min(max(b, y0), y1))) for a, b in pts if p.xr[0] - 1e-9 <= a <= p.xr[1] + 1e-9]
    return PL(q, c=c, lw=lw, dash=dash)

def _f01_clipline(p, pts, c, lw=2.0, dash=None):
    """範囲の外に出たところで線を止める（不安定な応答の描き方）。"""
    y0, y1 = min(p.yr), max(p.yr)
    q = []
    for a, b in pts:
        if not (p.xr[0] - 1e-9 <= a <= p.xr[1] + 1e-9):
            continue
        if b > y1 or b < y0:
            q.append((p.X(a), p.Y(min(max(b, y0), y1))))
            break
        q.append((p.X(a), p.Y(b)))
    return PL(q, c=c, lw=lw, dash=dash)

# ---- 添字付きの文字（"K_P" → K の右下に小さな P）。FIGCHECK の重なり検査にも登録する ----
import re as _f01_re
def _f01_tx(x, y, s, a="start", sz=10, c=INK, b=False, halo=False):
    segs, pos = [], 0
    for mm in _f01_re.finditer(r"([A-Za-z])_([A-Za-z0-9∞]+)", s):
        if mm.start() > pos:
            segs.append((s[pos:mm.start()], None))
        segs.append((mm.group(1), mm.group(2)))
        pos = mm.end()
    if pos < len(s):
        segs.append((s[pos:], None))
    ssz = sz * 0.72
    w = sum(tw(t, sz) + (tw(u, ssz) if u else 0) for t, u in segs)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, s))
    hs = ' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hs)]
    pend = 0
    for t, u in segs:
        o.append('<tspan%s>%s</tspan>' % ((' dy="%g"' % pend) if pend else "", E(t)))
        pend = 0
        if u:
            o.append('<tspan dy="3" font-size="%g">%s</tspan>' % (round(ssz, 2), E(u)))
            pend = -3
    o.append("</text>")
    return "".join(o)

# ---- ブロック線図の部品（この章のすべての線図で同じ大きさにする） ----
_F01_SR = 15          # 加え合わせ点の半径
def _f01_sum(x, y, signs, c=INK):
    """加え合わせ点。signs は {"l": "+", "t": "−", "b": "−", "r": "+"}: 矢印が入ってくる側と符号。
    丸を斜めの線で 4 つに区切り、矢印が入る側の区画に符号を小さく書く。"""
    rr = _F01_SR; k = rr * 0.7071
    o = [CIRC(x, y, rr, c=c, lw=1.5, fill=SCR),
         W(x - k, y - k, x + k, y + k, c=MUT, lw=0.9), W(x - k, y + k, x + k, y - k, c=MUT, lw=0.9)]
    pos = {"l": (-8.2, 3.9), "r": (8.2, 3.9), "t": (0, -4.6), "b": (0, 12.4)}
    for side, s in signs.items():
        dx, dy = pos[side]
        o.append('<text x="%g" y="%g" text-anchor="middle" font-size="10.5" fill="%s" font-family="var(--sans)" font-weight="700">%s</text>'
                 % (round(x + dx, 2), round(y + dy, 2), c, E(s)))
    return "".join(o)

def _f01_blk(x, y, w, h, title, sub=None, c=LIN, fill=PAN, tc=INK, sz=11.5, ssz=9.5):
    """ブロック線図の箱（(x, y) は左上）。"""
    return BOX(x, y, w, h, title, sub, c=c, fill=fill, tc=tc, sz=sz, ssz=ssz, r=6)

def _f01_val(x, y, s, c, a="middle"):
    """矢印の値を示す札。"""
    return CHIP(x, y, s, c, 9.5, 4, a)[0]

# ---- 小さな絵 ----
def _f01_icon_ac(x, y):
    o = [RECT(x + 4, y + 4, 52, 16, 4, PAN, MUT, 1.3), W(x + 9, y + 15, x + 51, y + 15, c=MUT, lw=1)]
    for i in range(3):
        xx = x + 14 + i * 14
        o.append(PATH("M%g,%g q3,5 0,9 q-3,5 0,9" % (xx, y + 23), c=TEA, lw=1.3))
    o.append(W(x + 62, y + 6, x + 62, y + 26, c=SIG, lw=2))
    o.append(D(x + 62, y + 30, SIG, 3.4))
    return "".join(o)

def _f01_icon_car(x, y):
    o = [W(x, y + 42, x + 66, y + 34, c=MUT, lw=1.3)]
    g = ['<g transform="rotate(-7 %g %g)">' % (x + 33, y + 30)]
    g.append(PL([(x + 10, y + 32), (x + 12, y + 22), (x + 22, y + 21), (x + 30, y + 13), (x + 46, y + 13), (x + 54, y + 21), (x + 60, y + 23), (x + 60, y + 32)], c=SIG, lw=1.4, fill=SSOFT))
    g.append(CIRC(x + 20, y + 33, 5, c=INK, lw=1.4, fill=PAN)); g.append(CIRC(x + 50, y + 33, 5, c=INK, lw=1.4, fill=PAN))
    g.append('</g>')
    o.append("".join(g))
    return "".join(o)

def _f01_icon_motor(x, y):
    o = [RECT(x + 4, y + 10, 32, 24, 4, SSOFT, SIG, 1.4), RECT(x + 36, y + 15, 5, 14, 1, PAN, SIG, 1.2),
         W(x + 41, y + 22, x + 54, y + 22, c=INK, lw=2.2), RECT(x + 54, y + 8, 7, 28, 2, MSOFT, MUT, 1.2)]
    o.append(CARR(x + 50, y + 4, x + 66, y + 10, 0.35, c=GLD, lw=1.3, head=5))
    return "".join(o)

def _f01_icon_drone(x, y):
    cx, cy = x + 34, y + 22
    g = ['<g transform="rotate(-12 %g %g)">' % (cx, cy)]
    g.append(W(cx - 22, cy - 6, cx + 22, cy + 6, c=INK, lw=1.6)); g.append(W(cx - 22, cy + 6, cx + 22, cy - 6, c=INK, lw=1.6))
    for dx, dy in ((-22, -6), (22, -6), (-22, 6), (22, 6)):
        g.append('<ellipse cx="%g" cy="%g" rx="9" ry="2.6" fill="%s" stroke="%s" stroke-width="1.2"/>' % (cx + dx, cy + dy - 4, SSOFT, SIG))
    g.append(RECT(cx - 7, cy - 4, 14, 8, 2, PAN, INK, 1.3))
    g.append('</g>')
    o = ["".join(g), W(x + 2, y + 42, x + 66, y + 42, c=FNT, lw=1, dash="3 3")]
    return "".join(o)

# ==== 1 節: 身近な例 ====
def _f01_examples_fig():
    o = []
    cols = [(170, "制御量（目標値の例）", SIG), (305, "操作量", GLD), (445, "外乱", PUR), (590, "センサ", TEA)]
    o.append(T(14, 18, "例（制御対象）", "start", 10.5, INK, True))
    for x, h_, c in cols:
        o.append(T(x, 18, h_, "start", 10.5, c, True))
    o.append(W(12, 26, 694, 26, c=LIN, lw=1.2))
    rows = [
        (_f01_icon_ac, "エアコン（冷房）", "対象: 部屋の空気",
         ["室温", "目標値 26 °C"], ["冷やす強さ", "（圧縮機の回転の速さ）"], ["日差し・人の体の熱", "窓から入る外の空気"], ["温度センサ"]),
        (_f01_icon_car, "自動車の速度を保つ機能", "対象: 自動車",
         ["車の速度", "目標値 80 km/h"], ["エンジンの力", "（下り坂ではブレーキ）"], ["坂・向かい風", "乗る人と荷物の重さ"], ["車輪の回転の速さ"]),
        (_f01_icon_motor, "モータの速度", "対象: モータと回す物",
         ["回転の速さ", "目標値 314 rad/s", "（毎分 3000 回転）"], ["モータに加える電圧"], ["回す物の重さの変化", "電源の電圧の変化"], ["回転を数えるセンサ", "（エンコーダ）"]),
        (_f01_icon_drone, "ドローンの姿勢", "対象: 機体",
         ["機体の傾き", "目標値 0°（水平）"], ["4 つのプロペラの", "回転の速さの差"], ["風", "荷物の偏り"], ["角速度センサ", "（ジャイロ）"]),
    ]
    rh = 80
    for i, (icon, name, obj, a, b, cc, s) in enumerate(rows):
        ry = 30 + i * rh
        if i:
            o.append(W(12, ry, 694, ry, c=LIN, lw=0.8))
        o.append(icon(16, ry + 6))
        o.append(T(14, ry + 63, name, "start", 10.5, INK, True))
        o.append(T(14, ry + 76, obj, "start", 9.5, MUT))
        for (x, _, c), lines in zip(cols, (a, b, cc, s)):
            for k, l in enumerate(lines):
                o.append(T(x, ry + 22 + k * 14, l, "start", 10, c if k == 0 else INK, k == 0))
    return SVG(700, 30 + 4 * rh + 4, o, "身近な制御の例。どの例も、センサで測った制御量を目標値に合わせるように、制御器が操作量を決める。外乱は、制御器とは関係なく制御量を動かす。目標値は例の値。")
F["e01_examples"] = _f01_examples_fig()

# ==== 1 節: 保つ制御と追わせる制御 ====
def _f01_roles_fig():
    o = []
    # (a) 部屋: C dθ/dt = (θout − θ)/R + d − q、q = q0 + Kp (θ − r)（R 4 K/kW、C 150 kJ/K、θout 32 °C、Kp 1 kW/K）
    R, Cc, tho, r = 4.0, 150.0, 32.0, 26.0
    q0, Kp = (tho - r) / R, 1.0
    h = 2.0; th = r; A = []
    for k in range(int(50 * 60 / h) + 1):
        t = k * h
        d = 0.8 if 15 * 60 <= t < 35 * 60 else 0.0
        q = q0 + Kp * (th - r)
        A.append((t / 60.0, th, q, d))
        lam = 1.0 / R + Kp
        thi = (tho / R + d - q0 + Kp * r) / lam
        th = thi + (th - thi) * math.exp(-h * lam / Cc)
    o.append(T(14, 16, "(a) 保つ: エアコンの室温（15〜35 分に窓を開ける）", "start", 11, INK, True))
    p = Plot(62, 30, 250, 104, (0, 50), (25.8, 26.9))
    o.append(RECT(p.X(15), p.y, p.X(35) - p.X(15), p.h, 0, PSOFT, "none", 0))
    o.append(p.axes(xl=None, yl="室温 [°C]", xt=[0, 10, 20, 30, 40, 50], yt=[25.8, 26.0, 26.2, 26.4, 26.6, 26.8], yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 26.0), (50, 26.0)], c=MUT, lw=1.4, dash="5 3"))
    o.append(p.line([(t, y) for t, y, q, d in A], c=SIG, lw=2.2))
    o.append(T(p.X(25), p.y + 13, "窓が開いている", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(49), p.Y(26.0) + 13, "目標値 r = 26 °C", "end", 9.5, MUT, halo=True))
    o.append(T(p.X(4), p.Y(26.0) - 6, "制御量 y", "start", 9.5, SIG, True, halo=True))
    o.append(DIM(p.X(31), p.Y(26.0), p.X(31), p.Y(26.64), None, c=ALI))
    o.append(T(p.X(30), p.Y(26.32) + 4, "偏差 −0.64 °C", "end", 9.5, ALI, True, halo=True))
    q2 = Plot(62, 166, 250, 62, (0, 50), (0, 2.5))
    o.append(RECT(q2.X(15), q2.y, q2.X(35) - q2.X(15), q2.h, 0, PSOFT, "none", 0))
    o.append(q2.axes(xl="時間 [分]", yl="熱 [kW]", xt=[0, 10, 20, 30, 40, 50], yt=[0, 1, 2]))
    o.append(q2.line([(t, q) for t, y, q, d in A], c=GLD, lw=2.0))
    o.append(q2.line([(t, d) for t, y, q, d in A], c=PUR, lw=2.0))
    o.append(T(q2.X(1), q2.Y(1.5) - 5, "操作量 u（冷やす強さ）", "start", 9.5, GLD, True, halo=True))
    o.append(T(q2.X(36), q2.Y(0.8) - 5, "外乱 d", "start", 9.5, PUR, True, halo=True))
    o.append(T(q2.X(25), q2.Y(2.14) - 5, "2.14 kW", "middle", 9.5, GLD, halo=True))
    # (b) モータの速さ: T dy/dt + y = K u、u = r/K + Kp (r − y)（K 50 (rad/s)/V、T 0.05 s、Kp 0.03 V/(rad/s)）
    K, Tm, Kq = 50.0, 0.05, 0.03
    hb = 1e-4; y = 0.0; B = []
    for k in range(int(0.6 / hb) + 1):
        t = k * hb
        rr = 0.0 if t < 0.05 else (200.0 if t < 0.35 else 100.0)
        u = rr / K + Kq * (rr - y)
        if k % 10 == 0:
            B.append((t, rr, y, u))
        yi = K * u
        y = yi + (y - yi) * math.exp(-hb / Tm)
    xb = 410
    o.append(T(xb - 30, 16, "(b) 追わせる: モータの回転の速さ", "start", 11, INK, True))
    p2 = Plot(xb + 18, 30, 252, 104, (0, 0.6), (0, 250))
    o.append(p2.axes(xl=None, yl="速さ [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 100, 200], xfmt=lambda v: "%g" % v))
    o.append(p2.steps([(t, rr) for t, rr, y, u in B[::5]], c=MUT, lw=1.4))
    o.append(p2.line([(t, y) for t, rr, y, u in B], c=SIG, lw=2.2))
    o.append(T(p2.X(0.36), p2.Y(200) - 6, "目標値 r", "start", 9.5, MUT, halo=True))
    o.append(T(p2.X(0.12), p2.Y(165) + 2, "制御量 y", "start", 9.5, SIG, True, halo=True))
    q3 = Plot(xb + 18, 166, 252, 62, (0, 0.6), (-2, 12))
    o.append(q3.axes(xl="時間 [s]", yl="電圧 [V]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 4, 8, 12], xfmt=lambda v: "%g" % v))
    o.append(q3.line([(t, u) for t, rr, y, u in B], c=GLD, lw=2.0))
    o.append(T(q3.X(0.075), q3.Y(10) + 2, "操作量 u", "start", 9.5, GLD, True, halo=True))
    o.append(T(q3.X(0.37), q3.Y(-1) + 1, "−1 V", "start", 9.5, GLD, halo=True))
    return SVG(700, 268, o, "制御の 2 つの目的（制御器の計算は 4 節の比例制御とした。値は例の値）。(a) 外乱があっても制御量を目標値に保つ。窓を開けて入る熱（外乱）が増えると、制御器は冷やす強さ（操作量）を上げる。(b) 変わっていく目標値に制御量をついていかせる。目標値が変わった直後は偏差が大きいので、操作量を大きく動かす。下げるときは、電圧を負にしてブレーキをかける。")
F["e01_roles"] = _f01_roles_fig()

# ==== 2 節: ブロック線図の約束 ====
def _f01_bdrules_fig():
    o = []
    # (a) 箱
    o.append(T(14, 18, "(a) 箱: 入る信号から出る信号を作る", "start", 11, INK, True))
    cy = 78
    o.append(ARR(40, cy, 128, cy, c=GLD, lw=1.8))
    o.append(T(84, cy - 8, "押す力 u [N]", "middle", 10, GLD, True))
    o.append(_f01_blk(128, cy - 19, 84, 38, "台車"))
    o.append(ARR(212, cy, 304, cy, c=SIG, lw=1.8))
    o.append(T(258, cy - 8, "速度 y [m/s]", "middle", 10, SIG, True))
    o.append(T(170, cy + 38, "入力の矢印 → 箱 → 出力の矢印", "middle", 9.5, MUT))
    # (b) 矢印
    xb = 362
    o.append(T(xb, 18, "(b) 矢印: 信号（時間とともに変わる値）", "start", 11, INK, True))
    o.append(ARR(xb + 20, cy, xb + 310, cy, c=SIG, lw=1.8))
    sp = Plot(xb + 110, cy - 46, 110, 34, (0, 4), (0, 1.1))
    o.append(RECT(sp.x - 6, sp.y - 4, sp.w + 12, sp.h + 8, 4, SCR, LIN, 0.8))
    o.append(sp.line([(t, 1 - math.exp(-1.6 * t)) for t in [i * 0.05 for i in range(81)]], c=SIG, lw=1.6))
    o.append(T(sp.x + sp.w + 12, sp.y + 14, "速度 y の", "start", 9.5, SIG))
    o.append(T(sp.x + sp.w + 12, sp.y + 28, "時間の動き", "start", 9.5, SIG))
    o.append(T(xb + 165, cy + 38, "矢じりの向きに、値が伝わる", "middle", 9.5, MUT))
    o.append(W(12, 134, 694, 134, c=LIN, lw=0.8))
    # (c) 加え合わせ点
    y2 = 152
    o.append(T(14, y2, "(c) 加え合わせ点: 符号のとおりに足し引きする", "start", 11, INK, True))
    cx, cy2 = 170, y2 + 46
    o.append(ARR(40, cy2, cx - _F01_SR, cy2, c=MUT, lw=1.8))
    o.append(T(86, cy2 - 8, "r = 1.0 m/s", "middle", 10, MUT, True))
    o.append(ARR(cx, cy2 + 52, cx, cy2 + _F01_SR, c=SIG, lw=1.8))
    o.append(T(cx + 8, cy2 + 46, "y = 0.8 m/s", "start", 10, SIG, True))
    o.append(_f01_sum(cx, cy2, {"l": "+", "b": "−"}))
    o.append(ARR(cx + _F01_SR, cy2, 318, cy2, c=ALI, lw=1.8))
    o.append(T(250, cy2 - 8, "e = r − y = 0.2 m/s", "middle", 10, ALI, True))
    o.append(T(cx + 18, cy2 + 24, "丸の中の符号: 左から + 、下から −", "start", 9.5, MUT))
    # (d) 引き出し点
    o.append(T(xb, y2, "(d) 引き出し点: 同じ値のまま分ける", "start", 11, INK, True))
    bx = xb + 120
    o.append(W(xb + 20, cy2, bx, cy2, c=SIG, lw=1.8))
    o.append(T(xb + 66, cy2 - 8, "y = 0.8 m/s", "middle", 10, SIG, True))
    o.append(D(bx, cy2, SIG, 4))
    o.append(ARR(bx, cy2, xb + 250, cy2, c=SIG, lw=1.8))
    o.append(T(xb + 196, cy2 - 8, "0.8 m/s", "middle", 10, SIG, True))
    o.append(T(xb + 256, cy2 + 4, "表示へ", "start", 10, INK))
    o.append(W(bx, cy2, bx, cy2 + 40, c=SIG, lw=1.8))
    o.append(ARR(bx, cy2 + 40, xb + 250, cy2 + 40, c=SIG, lw=1.8))
    o.append(T(xb + 196, cy2 + 32, "0.8 m/s", "middle", 10, SIG, True))
    o.append(T(xb + 256, cy2 + 44, "制御器へ", "start", 10, INK))
    o.append(T(bx + 8, cy2 + 62, "分けても値は減らない", "start", 9.5, MUT))
    return SVG(700, y2 + 132, o, "ブロック線図の描き方の約束。(a) 箱は、入る信号から出る信号を作る物や働きを表す。(b) 矢印は信号で、時間とともに変わる値が矢じりの向きに伝わる。(c) 加え合わせ点（白い丸）は、丸の中に書いた符号のとおりに入力を足し引きする。目標値から制御量を引くと偏差になる。(d) 引き出し点（黒い点）は、同じ値をそのまま 2 つ以上の行き先へ送る。")
F["e01_bd_rules"] = _f01_bdrules_fig()

# ==== 2 節: エアコンの絵とブロック線図 ====
def _f01_bdac_fig():
    o = []
    o.append(T(14, 18, "(a) 絵: 冷房で部屋を 26 °C に保つ", "start", 11, INK, True))
    # 部屋
    rx0, ry0, rx1, ry1 = 30, 30, 420, 196
    o.append(RECT(rx0, ry0, rx1 - rx0, ry1 - ry0, 3, SCR, MUT, 1.6))
    o.append(RECT(rx0 + 2, ry0 + 2, rx1 - rx0 - 4, ry1 - ry0 - 4, 2, SSOFT, "none", 0))
    # エアコン
    o.append(RECT(46, 42, 132, 30, 5, PAN, INK, 1.4))
    o.append(T(80, 61, "エアコン", "middle", 10, INK, True))
    o.append(T(140, 61, "②", "middle", 10.5, INK, True))
    o.append(W(160, 48, 160, 64, c=TEA, lw=2)); o.append(D(160, 66, TEA, 3))
    for i in range(4):
        xx = 62 + i * 26
        o.append(PATH("M%g,%g q5,6 0,12 q-5,6 0,12" % (xx, 78), c=GLD, lw=1.4))
    o.append(T(46, 122, "③ 冷たい風", "start", 10, GLD, True))
    o.append(T(170, 92, "⑥ 温度センサ", "start", 10, TEA, True))
    # リモコン
    o.append(RECT(52, 146, 34, 40, 4, PAN, MUT, 1.2)); o.append(RECT(56, 150, 26, 12, 2, SCR, MUT, 0.8))
    o.append(T(69, 159.5, "26°", "middle", 8.5, INK, True))
    o.append(T(94, 168, "① リモコンで 26 °C に設定", "start", 10, MUT, True))
    # 人
    hx = 300
    o.append(CIRC(hx, 118, 8, c=INK, lw=1.4, fill=PAN))
    o.append(W(hx, 126, hx, 158, c=INK, lw=1.6)); o.append(W(hx - 12, 138, hx + 12, 138, c=INK, lw=1.6))
    o.append(W(hx, 158, hx - 9, 186, c=INK, lw=1.6)); o.append(W(hx, 158, hx + 9, 186, c=INK, lw=1.6))
    for k in range(3):
        o.append(PATH("M%g,%g q3,-5 0,-10" % (hx - 14 + k * 14, 106), c=PUR, lw=1.2))
    # 窓と日差し
    o.append(RECT(rx1 - 4, 60, 8, 80, 1, PAN, MUT, 1.2))
    o.append(D(470, 54, PUR, 9))
    for a in range(8):
        ang = a * math.pi / 4
        o.append(W(470 + 13 * math.cos(ang), 54 + 13 * math.sin(ang), 470 + 19 * math.cos(ang), 54 + 19 * math.sin(ang), c=PUR, lw=1.4))
    for k in range(3):
        yy = 84 + k * 20
        o.append(ARR(470, yy, 380, yy + 8, c=PUR, lw=1.5, head=6))
    o.append(T(440, 160, "⑦ 外乱: 日差し・外の", "start", 10, PUR, True))
    o.append(T(440, 174, "空気・人の体の熱", "start", 10, PUR, True))
    o.append(T(232, 186, "④ 部屋の空気", "middle", 10, SIG, True))
    o.append(T(232, 60, "⑤ 室温 26.6 °C", "middle", 10, SIG, True))
    # (b) ブロック線図
    yb = 226
    o.append(T(14, yb, "(b) ブロック線図", "start", 11, INK, True))
    y = yb + 52
    s1, s2 = 136, 404
    o.append(ARR(20, y, s1 - _F01_SR, y, c=MUT, lw=1.8))
    o.append(T(22, y - 9, "① 目標値 r", "start", 10, MUT, True))
    o.append(_f01_sum(s1, y, {"l": "+", "b": "−"}))
    o.append(ARR(s1 + _F01_SR, y, 194, y, c=INK, lw=1.8))
    o.append(T(171, y - 9, "偏差 e", "middle", 10, INK, True))
    o.append(_f01_blk(194, y - 21, 104, 42, "② 制御器", "マイコン"))
    o.append(ARR(298, y, s2 - _F01_SR, y, c=GLD, lw=1.8))
    o.append(T(346, y - 9, "③ 操作量 u", "middle", 10, GLD, True))
    o.append(T(346, y + 16, "冷やす強さ", "middle", 9.5, GLD))
    o.append(_f01_sum(s2, y, {"l": "−", "t": "+"}))
    o.append(ARR(s2, y - 46, s2, y - _F01_SR, c=PUR, lw=1.8))
    o.append(T(s2 + 8, y - 34, "⑦ 外乱 d（入る熱）", "start", 10, PUR, True))
    o.append(ARR(s2 + _F01_SR, y, 450, y, c=INK, lw=1.8))
    o.append(_f01_blk(450, y - 21, 110, 42, "④ 制御対象", "部屋の空気", c=SIG))
    o.append(ARR(560, y, 690, y, c=SIG, lw=1.8))
    o.append(T(625, y - 9, "⑤ 制御量 y", "middle", 10, SIG, True))
    o.append(T(625, y + 16, "室温", "middle", 9.5, SIG))
    bp = 600
    o.append(D(bp, y, SIG, 4))
    yf = y + 66
    o.append(W(bp, y, bp, yf, c=SIG, lw=1.8))
    o.append(ARR(bp, yf, 452, yf, c=SIG, lw=1.8))
    o.append(_f01_blk(352, yf - 18, 100, 36, "⑥ センサ", None, c=TEA, sz=10.5))
    o.append(W(352, yf, s1, yf, c=TEA, lw=1.8))
    o.append(ARR(s1, yf, s1, y + _F01_SR, c=TEA, lw=1.8))
    o.append(T(250, yf - 8, "測った室温", "middle", 10, TEA, True))
    o.append(T(bp + 8, y + 44, "引き出し点", "start", 9.5, MUT))
    return SVG(700, yf + 26, o, "同じエアコンを、(a) 絵と (b) ブロック線図で描く。番号は同じものを指す。ブロック線図は、物の形ではなく、どの信号がどの信号を決めるかを描く。室温はセンサで測られて目標値と比べられ、その差（偏差）から制御器が冷やす強さを決める。部屋の温度は、入る熱（外乱）と取り去る熱の差で変わる。信号をたどると輪ができる。")
F["e01_bd_ac"] = _f01_bdac_fig()

# ==== 3・4 節: 台車の線図の並び（開ループと比例制御で同じ位置・大きさにする） ====
_F01_BX = dict(r0=18, br=70, s1=108, kp=(176, 250), s2=300, sd=380, cart=(428, 524), bp=592, end=690)

def _f01_cart_bd(y, fb, vals=None, L=None):
    """台車の速度の線図。fb=False で開ループ、True で比例制御（センサと観測ノイズ付き）。vals は各信号の値の文字列。"""
    B = _F01_BX; R = _F01_SR; o = []
    v = vals or {}
    cy = y + 33
    def chip(x, yy, key, c, a="middle"):
        if key in v:
            o.append(_f01_val(x, yy, v[key], c, a))
    if fb:
        o.append(ARR(B["r0"], y, B["s1"] - R, y, c=MUT, lw=1.8))
        o.append(T(B["r0"] + 2, y - 9, "目標値 r", "start", 10, MUT, True))
        chip((B["r0"] + B["br"]) / 2 + 4, cy, "r", MUT)
        o.append(_f01_sum(B["s1"], y, {"l": "+", "b": "−"}))
        o.append(ARR(B["s1"] + R, y, B["kp"][0], y, c=ALI, lw=1.8))
        o.append(T((B["s1"] + R + B["kp"][0]) / 2, y - 9, "偏差 e", "middle", 10, ALI, True))
        chip((B["s1"] + R + B["kp"][0]) / 2, cy, "e", ALI)
        o.append(RECT(B["kp"][0], y - 20, B["kp"][1] - B["kp"][0], 40, 6, PAN, SIG, 1.4))
        o.append(_f01_tx((B["kp"][0] + B["kp"][1]) / 2, y + 5, "× K_P", "middle", 12, INK, True))
        o.append(ARR(B["kp"][1], y, B["s2"] - R, y, c=GLD, lw=1.8))
        o.append(_f01_tx((B["kp"][1] + B["s2"] - R) / 2, y - 9, "K_P e", "middle", 10, GLD, True))
        chip((B["kp"][1] + B["s2"] - R) / 2, cy, "kpe", GLD)
        # 決めた力（上の段）
        yu = y - 62
        o.append(D(B["br"], y, MUT, 3.6))
        o.append(W(B["br"], y, B["br"], yu, c=MUT, lw=1.6))
        o.append(ARR(B["br"], yu, B["kp"][0], yu, c=MUT, lw=1.6))
        o.append(RECT(B["kp"][0], yu - 19, B["kp"][1] - B["kp"][0], 38, 6, PAN, LIN, 1.4))
        o.append(T((B["kp"][0] + B["kp"][1]) / 2, yu - 3, "決めた力", "middle", 10.5, INK, True))
        o.append(_f01_tx((B["kp"][0] + B["kp"][1]) / 2, yu + 12, "u_0 = c r", "middle", 9.5, MUT))
        o.append(W(B["kp"][1], yu, B["s2"], yu, c=GLD, lw=1.8))
        o.append(ARR(B["s2"], yu, B["s2"], y - R, c=GLD, lw=1.8))
        o.append(_f01_tx(B["s2"] + 8, yu + 16, "u_0", "start", 10, GLD, True))
        chip(B["s2"] + 8, yu + 36, "u0", GLD, "start")
        o.append(_f01_sum(B["s2"], y, {"l": "+", "t": "+"}))
        o.append(ARR(B["s2"] + R, y, B["sd"] - R, y, c=GLD, lw=1.8))
        o.append(T((B["s2"] + B["sd"]) / 2, y - 9, "操作量 u", "middle", 10, GLD, True))
        chip((B["s2"] + B["sd"]) / 2, cy, "u", GLD)
    else:
        o.append(ARR(B["r0"], y, B["kp"][0], y, c=MUT, lw=1.8))
        o.append(T(B["r0"] + 2, y - 9, "目標値 r", "start", 10, MUT, True))
        o.append(RECT(B["kp"][0], y - 20, B["kp"][1] - B["kp"][0], 40, 6, PAN, LIN, 1.4))
        o.append(T((B["kp"][0] + B["kp"][1]) / 2, y - 3, "決めた力", "middle", 10.5, INK, True))
        o.append(_f01_tx((B["kp"][0] + B["kp"][1]) / 2, y + 12, "u_0 = c r", "middle", 9.5, MUT))
        o.append(ARR(B["kp"][1], y, B["sd"] - R, y, c=GLD, lw=1.8))
        o.append(_f01_tx((B["kp"][1] + B["sd"] - R) / 2, y - 9, "操作量 u = u_0", "middle", 10, GLD, True))
        chip((B["kp"][1] + B["sd"] - R) / 2, cy, "u", GLD)
    # 坂の力と台車
    o.append(_f01_sum(B["sd"], y, {"l": "+", "t": "−"}))
    o.append(ARR(B["sd"], y - 46, B["sd"], y - R, c=PUR, lw=1.8))
    o.append(T(B["sd"] + 8, y - 34, "外乱 d（坂の力）", "start", 10, PUR, True))
    chip(B["sd"] + 8, y - 54, "d", PUR, "start")
    o.append(ARR(B["sd"] + R, y, B["cart"][0], y, c=INK, lw=1.8))
    o.append(_f01_blk(B["cart"][0], y - 20, B["cart"][1] - B["cart"][0], 40, "台車", "質量と抵抗", c=SIG, sz=11))
    o.append(ARR(B["cart"][1], y, B["end"], y, c=SIG, lw=1.8))
    o.append(T((B["cart"][1] + B["end"]) / 2 + 26, y - 9, "制御量 y（速度）", "middle", 10, SIG, True))
    chip(B["end"] - 6, cy, "y", SIG, "end")
    if fb:
        bp = B["bp"]; yf = y + 70
        o.append(D(bp, y, SIG, 4))
        o.append(W(bp, y, bp, yf, c=SIG, lw=1.8))
        o.append(ARR(bp, yf, B["cart"][1], yf, c=SIG, lw=1.8))
        o.append(_f01_blk(B["cart"][0], yf - 18, B["cart"][1] - B["cart"][0], 36, "センサ", ("%g s 遅れる" % L) if L else None, c=TEA, sz=10.5))
        o.append(W(B["cart"][0], yf, B["s2"] + R, yf, c=TEA, lw=1.8))
        o.append(_f01_sum(B["s2"], yf, {"r": "+", "b": "+"}))
        o.append(ARR(B["s2"], yf + 44, B["s2"], yf + R, c=TEA, lw=1.6, dash="4 3"))
        o.append(T(B["s2"] + 8, yf + 40, "観測ノイズ n", "start", 10, TEA, True))
        o.append(W(B["s2"] - R, yf, B["s1"], yf, c=TEA, lw=1.8))
        o.append(ARR(B["s1"], yf, B["s1"], y + R, c=TEA, lw=1.8))
        o.append(T((B["s1"] + B["s2"]) / 2, yf - 8, "測った値 y + n", "middle", 10, TEA, True))
        chip((B["s1"] + B["s2"]) / 2, yf + 26, "ym", TEA)
    else:
        o.append(T(B["end"] - 2, y + 54, "速度は測らない", "end", 10, ALI, True))
    return "".join(o)

def _f01_slopecart(gx, gy, ang, forces, wlen=150):
    """坂の上の台車と力の矢印。ang は描く角度 [度]（上り坂が正）。
    forces = [(長さ [px], 向き +1（前）/−1（後ろ）, 高さ（車体の中心から坂に垂直な向き）, 色), ...]。
    前向きの力は車体の前の端から、後ろ向きの力は後ろの端から描く。"""
    a = math.radians(ang)
    tx, ty = math.cos(a), -math.sin(a)          # 坂に沿って前（上り）向き
    nx, ny = -math.sin(a), -math.cos(a)         # 坂に垂直で上向き
    o = [W(gx - tx * wlen * 0.75, gy - ty * wlen * 0.75, gx + tx * wlen * 0.75, gy + ty * wlen * 0.75, c=MUT, lw=2)]
    bw, bh, wr = 64, 26, 7
    cxx, cyy = gx + nx * (2 * wr + bh / 2), gy + ny * (2 * wr + bh / 2)
    corners = [(cxx + sx * tx * bw / 2 + sy * nx * bh / 2, cyy + sx * ty * bw / 2 + sy * ny * bh / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    o.append(PL(corners, c=SIG, lw=1.6, fill=SSOFT))
    for sx in (-1, 1):
        wx, wy = gx + tx * sx * (bw / 2 - 12) + nx * wr, gy + ty * sx * (bw / 2 - 12) + ny * wr
        o.append(CIRC(wx, wy, wr, c=INK, lw=1.4, fill=PAN))
    ends = []
    for L_, sg, hgt, c in forces:
        bx_, by_ = cxx + sg * tx * bw / 2 + nx * hgt, cyy + sg * ty * bw / 2 + ny * hgt
        ex, ey = bx_ + sg * tx * L_, by_ + sg * ty * L_
        o.append(ARR(bx_, by_, ex, ey, c=c, lw=2.4, head=8))
        ends.append((ex, ey))
    return "".join(o), (cxx, cyy), ends

def _f01_open_fig():
    o = []
    o.append(T(14, 18, "(a) 開ループ制御の線図", "start", 11, INK, True))
    o.append(_f01_cart_bd(72, False))
    yb = 132
    o.append(W(12, yb - 12, 694, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 6, "(b) 落ち着いたときの力（矢印の長さは力の大きさ。1 N = 40 px）", "start", 11, INK, True))
    sc = 40.0
    d3 = _f01_dslope(1.0)
    # 平らな道
    s1, cc1, e1 = _f01_slopecart(170, yb + 116, 0, [(2.0 * sc, 1, 0, GLD), (2.0 * sc, -1, 0, MUT)])
    o.append(s1)
    o.append(T(40, yb + 32, "平らな道: 1 m/s で釣り合う", "start", 10.5, INK, True))
    o.append(_f01_tx(e1[0][0] - 40, e1[0][1] - 10, "押す力 u_0 = 2 N", "middle", 10, GLD, True))
    o.append(T(e1[1][0] + 40, e1[1][1] - 10, "抵抗 2 N", "middle", 10, MUT, True))
    o.append(T(cc1[0], cc1[1] - 24, "速度 1.00 m/s", "middle", 10, SIG, True))
    # 坂（描く角度は 10°、本当は 3°）
    s2_, cc2, e2 = _f01_slopecart(540, yb + 122, 10, [(2.0 * sc, 1, 0, GLD), (1.487 * sc, -1, 5, MUT), (d3 * sc, -1, -7, PUR)])
    o.append(s2_)
    o.append(T(392, yb + 32, "上り坂 3°: 0.74 m/s で釣り合う", "start", 10.5, INK, True))
    o.append(T(e2[0][0] - 6, e2[0][1] - 12, "押す力 2 N", "middle", 10, GLD, True))
    o.append(T(e2[1][0] + 2, e2[1][1] - 12, "抵抗 1.49 N", "end", 10, MUT, True))
    o.append(T(e2[2][0] - 4, e2[2][1] + 16, "坂の力 d = 0.51 N", "end", 10, PUR, True))
    o.append(T(cc2[0] + 6, cc2[1] - 30, "速度 0.74 m/s", "middle", 10, SIG, True))
    o.append(T(690, yb + 182, "（坂の傾きは大きくして描いた）", "end", 9.5, MUT))
    # 釣り合いの棒（1 N = 40 px）
    yy = yb + 196
    def bar(x, y, segs):
        xx = x
        for val, c in segs:
            w = val * sc
            o.append(RECT(xx, y, w, 14, 2, soft(c), c, 1.1))
            xx += w
        return xx
    for x0, segs, lab in ((40, [(2.0, MUT)], "抵抗 2 N"), (392, [(1.487, MUT), (d3, PUR)], "抵抗 1.49 N ＋ 坂 0.51 N")):
        o.append(T(x0, yy + 11, "前", "start", 9.5, GLD, True))
        xe = bar(x0 + 22, yy, [(2.0, GLD)])
        o.append(T(xe + 8, yy + 11, "押す力 2 N", "start", 9.5, GLD))
        o.append(T(x0, yy + 31, "後ろ", "start", 9.5, MUT, True))
        xe = bar(x0 + 22, yy + 20, segs)
        o.append(T(xe + 8, yy + 31, lab, "start", 9.5, MUT))
    return SVG(700, yy + 44, o, "開ループ制御。(a) 目標値から決めた力 u<sub>0</sub> = c r（1 m/s なら 2 N）を出すだけで、速度は測らない。(b) 速度が落ち着くのは、押す力と、後ろ向きの力（抵抗と坂の力）が釣り合うときである。上り坂では押す力 2 N のうち 0.51 N が坂に取られるので、残りの 1.49 N と抵抗が釣り合う 0.74 m/s まで遅くなる。")
F["e01_open"] = _f01_open_fig()

def _f01_leg(x, y, items, sz=10, gap=18):
    """線の見本つきの凡例。items = [(色, 破線 or None, 文字), ...]。"""
    o, xx = [], x
    for c, dash, t in items:
        o.append(W(xx, y - 4, xx + 24, y - 4, c=c, lw=2.2, dash=dash))
        o.append(_f01_tx(xx + 30, y, t, "start", sz, MUT))
        xx += 30 + tw(t.replace("_", ""), sz) + gap
    return "".join(o)

# ==== 3 節: 開ループの速度の動き ====
def _f01_resp_panel(o, Kp, title, ref=False):
    """止まった台車を 1 m/s で走らせ、4 s から 3° の上り坂。荷物なし（実線）と荷物 1 kg（破線）。"""
    p = Plot(64, 34, 606, 168, (0, 8), (0, 1.2))
    o.append(RECT(p.X(4), p.y, p.X(8) - p.X(4), p.h, 0, PSOFT, "none", 0))
    o.append(p.axes(xl=None, yl="速度 y [m/s]", xt=[0, 1, 2, 3, 4, 5, 6, 7, 8], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 1.0), (8, 1.0)], c=MUT, lw=1.4, dash="5 3"))
    o.append(T(p.X(6), p.y + 14, "上り坂 3°（4 s から）", "middle", 10, PUR, True, halo=True))
    runs = {}
    for m, dash in ((1.0, None), (2.0, "7 4")):
        if ref:
            ro = _f01_sim(0.0, m=m, tend=8.0, slope_t=4.0, rec=0.02)
            o.append(p.line([(t, y) for t, y, ym, u, d in ro], c=MUT, lw=1.3, dash=dash))
        r = _f01_sim(Kp, m=m, tend=8.0, slope_t=4.0, rec=0.01)
        runs[m] = r
        o.append(p.line([(t, y) for t, y, ym, u, d in r], c=SIG, lw=2.2, dash=dash))
    q = Plot(64, 236, 606, 70, (0, 8), (0, 4 if Kp else 2.5))
    o.append(RECT(q.X(4), q.y, q.X(8) - q.X(4), q.h, 0, PSOFT, "none", 0))
    o.append(q.axes(xl="時間 t [s]", yl="力 [N]", xt=[0, 1, 2, 3, 4, 5, 6, 7, 8], yt=[0, 1, 2, 3, 4] if Kp else [0, 1, 2]))
    for m, dash in ((1.0, None), (2.0, "7 4")):
        r = runs[m]
        o.append(_f01_line(q, [(t, u) for t, y, ym, u, d in r], GLD, 2.0, dash))
        o.append(q.line([(t, d) for t, y, ym, u, d in r], c=PUR, lw=1.8, dash=dash))
    return p, q, runs

def _f01_openresp_fig():
    o = []
    p, q, runs = _f01_resp_panel(o, 0.0, "")
    o.append(T(14, 18, "開ループ制御（決めた力 2 N を出し続ける）", "start", 11, INK, True))
    o.append(T(p.X(7.95), p.Y(0.743) - 7, "荷物なし 0.74 m/s", "end", 10, SIG, True, halo=True))
    o.append(T(p.X(7.95), p.Y(0.487) - 7, "荷物 1 kg 0.49 m/s", "end", 10, SIG, True, halo=True))
    o.append(D(p.X(1.498), p.Y(0.95), SIG, 3.4)); o.append(D(p.X(2.996), p.Y(0.95), SIG, 3.4))
    o.append(T(p.X(1.498) + 6, p.Y(0.95) + 16, "95 % に 1.5 s", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(2.996) + 6, p.Y(0.95) + 16, "荷物 1 kg: 3.0 s", "start", 9.5, SIG, halo=True))
    o.append(T(p.X(0.1), p.Y(1.0) - 6, "目標値 1 m/s", "start", 9.5, MUT, halo=True))
    o.append(_f01_tx(q.X(0.1), q.Y(2.0) - 5, "押す力 u = u_0 = 2 N", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(4.1), q.Y(1.03) - 5, "坂の力 d（荷物 1 kg: 1.03 N）", "start", 9.5, PUR, True, halo=True))
    o.append(T(q.X(6.4), q.Y(0.51) - 5, "0.51 N", "start", 9.5, PUR, True, halo=True))
    o.append(_f01_leg(64, 358, [(SIG, None, "荷物なし（質量 1 kg）"), (SIG, "7 4", "荷物 1 kg（質量 2 kg）"), (GLD, None, "押す力 u"), (PUR, None, "坂の力 d")]))
    return SVG(700, 366, o, "開ループ制御の台車の速度（止まった状態から 2 N で押し、4 s に上り坂 3° に入る）。速度は、押す力と抵抗が釣り合う速度へだんだん近づく。荷物を載せると近づくのが遅くなる。上り坂では、坂の力の分だけ遅くなり、荷物があると坂の力が 2 倍になるので、さらに遅くなる。力は変わらないので、ずれは直らない。")
F["e01_open_resp"] = _f01_openresp_fig()

# ==== 4 節: 比例制御の線図（坂の上で落ち着いたときの値） ====
def _f01_fbbd_fig():
    o = []
    d3 = _f01_dslope(1.0); e = d3 / (_F01_C + 8.0); y = 1.0 - e
    vals = {"r": "1.000 m/s", "e": "%.3f m/s" % e, "kpe": "%.2f N" % (8 * e), "u0": "2.00 N", "u": "%.2f N" % (2 + 8 * e),
            "d": "%.2f N" % d3, "y": "%.3f m/s" % y, "ym": "%.3f m/s" % y}
    o.append(_f01_tx(14, 18, "比例制御の線図。札は、坂 3° の上で落ち着いたときの値（K_P = 8 N/(m/s)、観測ノイズなし）", "start", 11, INK, True))
    o.append(_f01_cart_bd(118, True, vals))
    o.append(T(14, 268, "釣り合い: 押す力 2.41 N ＝ 抵抗 2 × 0.949 = 1.90 N ＋ 坂の力 0.51 N", "start", 10.5, INK, True))
    return SVG(700, 280, o, "比例制御で台車の速度を保つ線図。センサで測った速度を目標値から引いて偏差を作り、その K<sub>P</sub> 倍を、決めた力 u<sub>0</sub> に足して押す力にする。測った値には観測ノイズ n が混じる。坂の上で落ち着いたとき、偏差 0.051 m/s の 8 倍の 0.41 N が足され、押す力は、抵抗と坂の力の和と釣り合う。")
F["e01_fb_bd"] = _f01_fbbd_fig()

# ==== 4 節: 比例制御の速度の動き ====
def _f01_fbresp_fig():
    o = []
    p, q, runs = _f01_resp_panel(o, 8.0, "", ref=True)
    o.append(_f01_tx(14, 18, "比例制御（K_P = 8 N/(m/s)）。灰色は開ループ", "start", 11, INK, True))
    o.append(T(p.X(7.95), p.Y(0.9487) - 7, "荷物なし 0.95 m/s", "end", 10, SIG, True, halo=True))
    o.append(T(p.X(5.6), p.Y(0.8973) + 15, "荷物 1 kg 0.90 m/s", "end", 10, SIG, True, halo=True))
    o.append(T(p.X(7.95), p.Y(0.743) + 15, "開ループ 0.74", "end", 9.5, MUT, halo=True))
    o.append(T(p.X(7.95), p.Y(0.487) + 15, "開ループ 0.49", "end", 9.5, MUT, halo=True))
    o.append(D(p.X(0.299), p.Y(0.95), SIG, 3.4)); o.append(D(p.X(0.598), p.Y(0.95), SIG, 3.4))
    o.append(T(p.X(0.65) + 4, p.Y(0.95) + 14, "95 % に 0.30 s（荷物 1 kg: 0.60 s）", "start", 9.5, SIG, halo=True))
    o.append(T(q.X(4.1), q.Y(2.82) - 6, "押す力 u（荷物 1 kg: 2.82 N）", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(6.4), q.Y(2.41) + 13, "2.41 N", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(0.12), q.Y(3.7), "動き始めは 10 N（枠の外）", "start", 9.5, GLD, halo=True))
    o.append(T(q.X(4.1), q.Y(1.03) - 5, "坂の力 d", "start", 9.5, PUR, True, halo=True))
    o.append(_f01_leg(64, 358, [(SIG, None, "荷物なし"), (SIG, "7 4", "荷物 1 kg"), (MUT, None, "開ループ（3 節）"), (GLD, None, "押す力 u"), (PUR, None, "坂の力 d")]))
    return SVG(700, 366, o, "比例制御の台車の速度（3 節と同じ坂と荷物）。坂で速度が落ちると偏差が生まれ、その 8 倍の力が自動で足されるので、遅くなる分が開ループの 1/5 になる。動き始めも、偏差が大きい間は大きな力で押すので速い。")
F["e01_fb_resp"] = _f01_fbresp_fig()

# ==== 4 節: 定常偏差と比例ゲイン ====
def _f01_err_fig():
    o = []
    p = Plot(70, 30, 430, 220, (0, 30), (0, 1.0))
    o.append(p.axes(xl="比例ゲイン [N/(m/s)]", yl="定常偏差 [m/s]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], yfmt=lambda v: "%.1f" % v))
    ks = [i * 0.1 for i in range(301)]
    cases = [(_f01_dslope(1.0), SIG, None, 1.0, True), (_f01_dslope(2.0), SIG, "7 4", 2.0, True), (_F01_C * _F01_R, GLD, None, 1.0, False)]
    for num, c, dash, m, uff in cases:
        o.append(p.line([(k, num / (_F01_C + k)) for k in ks], c=c, lw=2.2, dash=dash))
        for k in (0, 2, 4, 8, 16, 30):
            r = _f01_sim(k, m=m, tend=6.0, slope_t=0.0 if uff else None, uff=uff, rec=0.5)
            o.append(CIRC(p.X(k), p.Y(_F01_R - r[-1][1]), 3.6, c=c, lw=1.6, fill=SCR))
    o.append(W(p.X(8), p.y, p.X(8), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(8) + 4, p.Y(0.2) - 6, "0.200", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(8) + 4, p.Y(0.1027) - 5, "0.103", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(8) + 4, p.Y(0.0513) + 13, "0.051", "start", 9.5, SIG, True, halo=True))
    # 凡例と式
    x0 = 520
    rows = [(SIG, None, "坂 3°・荷物なし", "e_∞ = 0.513 ÷ (2 + K_P)"), (SIG, "7 4", "坂 3°・荷物 1 kg", "e_∞ = 1.03 ÷ (2 + K_P)"),
            (GLD, None, "平らな道で決めた力なし", "e_∞ = 2 ÷ (2 + K_P)")]
    for i, (c, dash, a_, b_) in enumerate(rows):
        yy = 52 + i * 52
        o.append(W(x0, yy - 4, x0 + 28, yy - 4, c=c, lw=2.2, dash=dash))
        o.append(T(x0 + 34, yy, a_, "start", 10, c, True))
        o.append(_f01_tx(x0 + 34, yy + 16, b_, "start", 10, INK))
    o.append(_f01_tx(x0, 196, "左端の K_P = 0 は開ループ", "start", 9.5, INK))
    o.append(T(x0, 210, "（坂 3°・荷物なしで 0.257 m/s）", "start", 9.5, INK))
    o.append(T(x0, 232, "線: 4 節の式", "start", 9.5, MUT))
    o.append(CIRC(x0 + 4, 246, 3.6, c=MUT, lw=1.6, fill=SCR)); o.append(T(x0 + 14, 250, "点: 数値計算（6 s 後の値）", "start", 9.5, MUT))
    return SVG(700, 290, o, "定常偏差と比例ゲイン（台車、目標値 1 m/s）。線は 4 節で導いた式、点は細かい時間刻みの数値計算の値で、一致する。K<sub>P</sub> = 0 は開ループで、比例ゲインを上げると、坂の偏差は c/(c + K<sub>P</sub>) 倍に縮むが、0 にはならない。決めた力 u<sub>0</sub> を足さないと、平らな道でも抵抗に打ち勝つ力を偏差から作るので、偏差が残る。")
F["e01_err"] = _f01_err_fig()

# ==== 4 節: 観測ノイズ ====
def _f01_noise_fig():
    o = []
    o.append(T(14, 18, "平らな道を 1 m/s で走る台車（観測ノイズは 0.01 s ごとに変わる、標準偏差 0.02 m/s の値）", "start", 11, INK, True))
    for j, (Kp, x0) in enumerate(((8.0, 66), (30.0, 418))):
        r = _f01_sim(Kp, tend=60.0, noise=0.02, seed=3, rec=0.001)
        i0 = 5000
        su = _f01_np.std([u for t, y, ym, u, d in r[i0:]]); sy = _f01_np.std([y for t, y, ym, u, d in r[i0:]])
        w = [(t - 4.0, y, ym, u) for t, y, ym, u, d in r if 4.0 <= t <= 5.5]
        o.append(_f01_tx(x0 - 50, 44, "(%s) K_P = %g N/(m/s)" % ("ab"[j], Kp), "start", 11, INK, True))
        p = Plot(x0, 56, 270, 110, (0, 1.5), (0.92, 1.08))
        o.append(p.axes(xl=None, yl="速度 [m/s]", xt=[0, 0.5, 1.0, 1.5], yt=[0.92, 0.96, 1.0, 1.04, 1.08], xfmt=lambda v: "", yfmt=lambda v: "%.2f" % v))
        o.append(p.line([(t, ym) for t, y, ym, u in w], c=TEA, lw=1.0))
        o.append(p.line([(t, y) for t, y, ym, u in w], c=SIG, lw=2.2))
        o.append(T(p.X(1.48), p.Y(1.08) + 12, "速度の揺れ %.4f m/s" % sy, "end", 9.5, SIG, True, halo=True))
        q = Plot(x0, 180, 270, 92, (0, 1.5), (0, 4))
        o.append(q.axes(xl="時間 t [s]", yl="力 [N]", xt=[0, 0.5, 1.0, 1.5], yt=[0, 1, 2, 3, 4], xfmt=lambda v: "%g" % v))
        o.append(q.line([(t, u) for t, y, ym, u in w], c=GLD, lw=1.2))
        o.append(T(q.X(1.48), q.Y(4) + 12, "力の揺れ %.2f N" % su, "end", 9.5, GLD, True, halo=True))
    o.append(LEGEND(66, 318, [(TEA, "測った値 y + n"), (SIG, "台車の速度 y"), (GLD, "押す力 u")]))
    return SVG(700, 326, o, "観測ノイズの影響（揺れの大きさは標準偏差。60 s の計算から求めた）。制御器は測った値の揺れにも K<sub>P</sub> を掛けて力に足すので、比例ゲインが大きいほど力が大きく揺れる。台車の速度の揺れは、質量が速い力の変化をならすので小さいが、比例ゲインとともに増える。")
F["e01_noise"] = _f01_noise_fig()

# ==== 5 節: 比例ゲインを 4 通りに ====
_F01_GAINS = [(2.0, TEA), (8.0, SIG), (14.0, GLD), (20.0, ALI)]

def _f01_bounds(L, T_=0.5, K=0.5):
    """一次の台車 + 測定の遅れ L の比例制御の境目。返り値 (振動し始める K_P, 振れが大きくなり始める K_P)。"""
    if L <= 0:
        return float("inf"), float("inf")
    lo, hi = 1e-9, math.pi / L
    for _ in range(100):
        mid = (lo + hi) / 2
        if math.atan(mid * T_) + mid * L > math.pi:
            hi = mid
        else:
            lo = mid
    w = (lo + hi) / 2
    return (T_ / L) * math.exp(-(1 + L / T_)) / K, math.sqrt(1 + (w * T_) ** 2) / K

def _f01_gain4_fig():
    o = []
    for j, (L, x0, title) in enumerate(((0.0, 62, "(a) 測った値がすぐに届く"), (0.1, 404, "(b) 測った値が 0.1 s 遅れて届く"))):
        o.append(T(x0 - 48, 18, title, "start", 11, INK, True))
        p = Plot(x0, 32, 280, 180, (0, 6), (0, 2.0))
        o.append(RECT(p.X(3), p.y, p.X(6) - p.X(3), p.h, 0, PSOFT, "none", 0))
        o.append(p.axes(xl="時間 t [s]", yl="速度 y [m/s]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[0, 0.5, 1.0, 1.5, 2.0], yfmt=lambda v: "%.1f" % v))
        o.append(p.line([(0, 1.0), (6, 1.0)], c=MUT, lw=1.3, dash="5 3"))
        o.append(T(p.X(4.5), p.y + 14, "上り坂 3°", "middle", 9.5, PUR, True, halo=True))
        rows = []
        for Kp, c in _F01_GAINS:
            r = _f01_sim(Kp, L, tend=6.0, slope_t=3.0, rec=0.004)
            o.append(_f01_clipline(p, [(t, y) for t, y, ym, u, d in r], c, 1.9))
            ys = [y for t, y, ym, u, d in r]
            if L == 0:
                rows.append((Kp, c, "%.3f m/s" % ys[-1]))
            else:
                mx = max(ys[:int(3.0 / 0.004)])
                rows.append((Kp, c, "%.2f m/s" % mx if mx < 5 else "増え続ける"))
        hdr = "坂の上の速度（6 s）" if L == 0 else "いちばん速いとき"
        yt = p.y + p.h + 52
        o.append(T(x0 - 48, yt, hdr, "start", 10, INK, True))
        for i, (Kp, c, txt) in enumerate(rows):
            xx = x0 - 48 + 124 + (i % 2) * 104
            yy = yt + (i // 2) * 16 - 8
            o.append(_f01_tx(xx, yy + 8 if i // 2 == 0 else yy + 8, ("K_P %g: " % Kp) + txt, "start", 9.5, c, True))
    o.append(_f01_leg(62, 302, [(c, None, "K_P = %g N/(m/s)" % Kp) for Kp, c in _F01_GAINS]))
    return SVG(700, 312, o, "比例ゲインを 2・8・14・20 N/(m/s) にして、止まった台車を 1 m/s で走らせ、3 s から上り坂 3° に入る。(a) 測った値がすぐに届くと、ゲインを上げるほど速く近づき、坂の上の定常偏差も小さくなる。どのゲインでも目標値を越えない。(b) 測った値が 0.1 s 遅れて届くと、ゲインを上げるほど目標値を越えて振れ、20 N/(m/s) では振れが大きくなり続ける（線は枠を出たところで止めた）。")
F["e01_gain4"] = _f01_gain4_fig()

# ==== 5 節: 遅れがあると行き過ぎる理由 ====
def _f01_why_fig():
    o = []
    r = _f01_sim(14.0, 0.1, tend=0.8, rec=0.002)
    r0 = _f01_sim(14.0, 0.0, tend=0.8, rec=0.002)
    o.append(_f01_tx(14, 18, "K_P = 14 N/(m/s)、測った値が 0.1 s 遅れて届く（灰色は遅れが無いとき）", "start", 11, INK, True))
    p = Plot(66, 34, 600, 170, (0, 0.8), (0, 2.0))
    o.append(RECT(p.X(0), p.y, p.X(0.1) - p.X(0), p.h, 0, ASOFT, "none", 0))
    o.append(p.axes(xl=None, yl="速度 [m/s]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], yt=[0, 0.5, 1.0, 1.5, 2.0], xfmt=lambda v: "", yfmt=lambda v: "%.1f" % v))
    o.append(p.line([(0, 1.0), (0.8, 1.0)], c=MUT, lw=1.3, dash="5 3"))
    o.append(p.line([(t, y) for t, y, ym, u, d in r0], c=MUT, lw=1.4))
    o.append(p.line([(t, ym) for t, y, ym, u, d in r], c=TEA, lw=1.8, dash="6 3"))
    o.append(p.line([(t, y) for t, y, ym, u, d in r], c=SIG, lw=2.4))
    # ② 0.1 s 遅れて知る
    o.append(D(p.X(0.067), p.Y(1.0), SIG, 4)); o.append(D(p.X(0.167), p.Y(1.0), TEA, 4))
    o.append(DIM(p.X(0.067), p.Y(1.0) + 16, p.X(0.167), p.Y(1.0) + 16, None, c=ALI))
    o.append(T(p.X(0.17) + 8, p.Y(1.0) + 20, "② 0.07 s に 1 m/s を越えたことを、0.17 s に知る", "start", 9.5, ALI, True, halo=True))
    o.append(D(p.X(0.159), p.Y(1.8245), SIG, 3.6))
    o.append(T(p.X(0.159) + 8, p.Y(1.8245) - 2, "そのとき実際は 1.82 m/s", "start", 9.5, SIG, True, halo=True))
    o.append(D(p.X(0.355), p.Y(0.366), SIG, 3.6))
    o.append(T(p.X(0.355) + 8, p.Y(0.366) + 13, "④ 下がったことも 0.1 s 遅れて知るので、0.37 m/s まで下がりすぎる", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.78), p.Y(1.62), "実際の速度 y", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.78), p.Y(1.44), "制御器に届く値（0.1 s 前の速度）", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(0.78), p.Y(0.78), "遅れが無いとき", "end", 9.5, MUT, halo=True))
    q = Plot(66, 222, 600, 110, (0, 0.8), (-12, 18))
    o.append(RECT(q.X(0), q.y, q.X(0.1) - q.X(0), q.h, 0, ASOFT, "none", 0))
    o.append(q.axes(xl="時間 t [s]", yl="力 u [N]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], yt=[-10, 0, 10], xfmt=lambda v: "%g" % v))
    o.append(q.line([(0, 0), (0.8, 0)], c=FNT, lw=1))
    o.append(q.line([(t, u) for t, y, ym, u, d in r0], c=MUT, lw=1.4))
    o.append(q.line([(t, u) for t, y, ym, u, d in r], c=GLD, lw=2.2))
    o.append(T(q.X(0.003), q.Y(16) - 4, "① 届く値はまだ 0: 16 N で押し続ける", "start", 9.5, ALI, True, halo=True))
    o.append(D(q.X(0.259), q.Y(-9.54), GLD, 3.6))
    o.append(T(q.X(0.259) + 8, q.Y(-9.54) + 4, "③ 届いた値が目標を越えたので、力を負に（−9.5 N）", "start", 9.5, GLD, True, halo=True))
    return SVG(700, 370, o, "測った値の遅れが行き過ぎを生む仕組み（比例ゲイン 14 N/(m/s)）。赤い帯は、走り始めてから最初の値が届くまでの 0.1 s。制御器は 0.1 s 前の速度に反応するので、速度が目標値を越えても強く押し続け、下がり始めても強くブレーキをかけ続ける。遅れが無ければ、速度が目標値に近づくにつれて力が弱まり、目標値を越えない。")
F["e01_why"] = _f01_why_fig()

# ==== 5 節: 比例ゲインとむだ時間の地図 ====
def _f01_map_fig():
    o = []
    p = Plot(74, 30, 380, 250, (0, 0.3), (0.5, 60), ylog=True)
    Ls = [0.002 + i * 0.002 for i in range(150)]
    B = [_f01_bounds(L) for L in Ls]
    top, bot = 60.0, 0.5
    po = [(p.X(L), p.Y(min(max(b[0], bot), top))) for L, b in zip(Ls, B)]
    pc = [(p.X(L), p.Y(min(max(b[1], bot), top))) for L, b in zip(Ls, B)]
    o.append(PL([(p.X(0), p.Y(bot)), (p.X(0), p.Y(top))] + [pt for pt in po] + [(p.X(0.3), p.Y(bot))], c="none", lw=0, fill=GSOFT))
    o.append(PL(po + pc[::-1], c="none", lw=0, fill=GOSOFT))
    o.append(PL(pc + [(p.X(0.3), p.Y(top))], c="none", lw=0, fill=ASOFT))
    o.append(p.axes(xl="むだ時間 L [s]", yl="比例ゲイン [N/(m/s)]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3], yt=[0.5, 1, 2, 5, 10, 20, 50], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(PL(po, c=GRN, lw=2)); o.append(PL(pc, c=ALI, lw=2))
    o.append(T(p.X(0.22), p.Y(0.75), "振動しない", "middle", 10.5, GRN, True, halo=True))
    o.append(T(p.X(0.21), p.Y(3.0), "振動して収まる", "middle", 10.5, GLD, True, halo=True))
    o.append(T(p.X(0.2), p.Y(30), "振れが大きくなり続ける", "middle", 10.5, ALI, True, halo=True))
    o.append(W(p.X(0.1), p.y, p.X(0.1), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    for Kp, c in _F01_GAINS:
        o.append(D(p.X(0.1), p.Y(Kp), c, 4.6))
        o.append(T(p.X(0.1) - 8, p.Y(Kp) + 4, "%g" % Kp, "end", 10, c, True, halo=True))
    # 表
    x0 = 480
    o.append(T(x0, 44, "境目の比例ゲイン [N/(m/s)]", "start", 10.5, INK, True))
    o.append(T(x0, 64, "むだ時間", "start", 9.5, MUT)); o.append(T(x0 + 104, 64, "振動し始める", "end", 9.5, GRN)); o.append(T(x0 + 200, 64, "大きくなり始める", "end", 9.5, ALI))
    for i, L in enumerate((0.05, 0.1, 0.15, 0.2, 0.3)):
        a_, b_ = _f01_bounds(L)
        yy = 84 + i * 18
        o.append(T(x0, yy, "%g s" % L, "start", 10, INK, L == 0.1))
        o.append(T(x0 + 104, yy, "%.1f" % a_, "end", 10, GRN, L == 0.1))
        o.append(T(x0 + 200, yy, "%.1f" % b_, "end", 10, ALI, L == 0.1))
    o.append(T(x0, 194, "遅れが無ければ、どこまで", "start", 9.5, MUT))
    o.append(T(x0, 208, "上げても振動しない", "start", 9.5, MUT))
    o.append(T(x0, 236, "点: 4 通りの比例ゲイン", "start", 9.5, MUT))
    o.append(T(x0, 250, "（むだ時間 0.1 s）", "start", 9.5, MUT))
    return SVG(700, 318, o, "比例ゲインとむだ時間の組で、台車の速度の動きは 3 つに分かれる（荷物なし）。むだ時間が長いほど、振動し始める比例ゲインと、振れが大きくなり始める比例ゲインが小さくなる。境目は細かい時間刻みの数値計算と一致する。")
F["e01_map"] = _f01_map_fig()

# ==== 6 節: シリーズの地図 ====
def _f01_series_fig():
    o = []
    parts = [
        ("第 I 部", "フィードバックと", "動きのモデル", SIG, ["01 制御とは何か", "02 動きを式にする", "03 一次遅れの応答", "04 二次遅れの応答"],
         ["台車・モータ・温度の動きを", "微分方程式で表し、時間の応答", "（速さ・行き過ぎ）を読む"]),
        ("第 II 部", "伝達関数と", "周波数応答", TEA, ["05 ラプラス変換", "06 伝達関数と極・零点", "07 フィードバック系の式", "08 周波数応答とボード線図", "09 安定性と安定余裕"],
         ["応答を代数で計算し、極と周波", "数応答から、安定か、余裕は", "どれだけかを判定する"]),
        ("第 III 部", "制御器を", "設計する", GRN, ["10 PID 制御", "11 PID の調整と現場の問題", "12 根軌跡", "13 ループ整形", "14 フィードフォワード・カスケード"],
         ["PID を調整し、根軌跡とボード", "線図で、仕様を満たす制御器を", "設計する"]),
        ("第 IV 部", "デジタル制御", None, GLD, ["15 サンプリングと離散化", "16 マイコンで実装する"],
         ["設計した制御器を、一定の周期", "で動くマイコンのプログラムに", "する"]),
        ("第 V 部", "状態空間と", "推定", PUR, ["17 状態空間モデル", "18 状態フィードバック", "19 最適レギュレータ", "20 オブザーバとカルマンフィルタ", "21 総合演習（倒立振子を立てる）"],
         ["複数の量をまとめて扱い、測れ", "ない量を推定して、倒立振子を", "立てる"]),
    ]
    o.append(T(14, 18, "部", "start", 10.5, INK, True)); o.append(T(196, 18, "章", "start", 10.5, INK, True)); o.append(T(450, 18, "できるようになること", "start", 10.5, INK, True))
    y = 30
    for i, (nm, t1, t2, c, chs, can) in enumerate(parts):
        h = max(len(chs), 3) * 16 + 14
        o.append(RECT(14, y, 160, h, 7, soft(c), c, 1.4))
        o.append(T(26, y + 22, nm, "start", 11.5, c, True))
        o.append(T(26, y + 40, t1, "start", 10.5, INK, True))
        if t2:
            o.append(T(26, y + 55, t2, "start", 10.5, INK, True))
        for k, ch in enumerate(chs):
            o.append(T(196, y + 20 + k * 16, ch, "start", 10.5, ALI if ch.startswith("01") else INK, ch.startswith("01")))
        for k, l in enumerate(can):
            o.append(T(450, y + 20 + k * 16, l, "start", 10, MUT))
        if i + 1 < len(parts):
            o.append(ARR(94, y + h, 94, y + h + 12, c=MUT, lw=1.6, head=6))
        y += h + 12
    o.append(T(196 + 104, 30 + 20, "← この章", "start", 10, ALI, True))
    return SVG(700, y - 4, o, "このシリーズの 5 つの部と 21 章。第 I 部は時間の微分方程式とシミュレーションだけで書き、第 II 部でラプラス変換と伝達関数を入れて、極・周波数応答・安定余裕で調べる。第 III 部で制御器を設計し、第 IV 部でマイコンに載せ、第 V 部で状態空間の方法に進む。")
F["e01_series"] = _f01_series_fig()

# ==== 6 節: 例の対象 ====
def _f01_objects_fig():
    o = []
    cells = [(14, 10), (360, 10), (14, 196), (360, 196)]
    W_, H_ = 330, 176
    for x, y in cells:
        o.append(RECT(x, y, W_, H_, 8, PAN, LIN, 1.2))
    # 台車（ばね・ダンパ付き）
    x, y = cells[0]
    o.append(T(x + 12, y + 20, "台車（ばね・ダンパ付き）", "start", 11, SIG, True))
    gy = y + 112
    o.append(W(x + 14, gy, x + 160, gy, c=MUT, lw=1.6)); o.append(W(x + 18, gy, x + 18, gy - 64, c=MUT, lw=2.4))
    zz = [(x + 18, gy - 46)]
    for k in range(8):
        zz.append((x + 26 + k * 5.5, gy - 46 + (-6 if k % 2 == 0 else 6)))
    zz.append((x + 74, gy - 46))
    o.append(PL(zz, c=INK, lw=1.4))
    o.append(W(x + 18, gy - 22, x + 40, gy - 22, c=INK, lw=1.4)); o.append(W(x + 40, gy - 30, x + 40, gy - 14, c=INK, lw=1.6))
    o.append(W(x + 34, gy - 32, x + 58, gy - 32, x + 58, gy - 12, x + 34, gy - 12, c=INK, lw=1.4)); o.append(W(x + 58, gy - 22, x + 74, gy - 22, c=INK, lw=1.4))
    o.append(RECT(x + 74, gy - 58, 54, 44, 4, SSOFT, SIG, 1.5))
    o.append(CIRC(x + 86, gy - 7, 7, c=INK, lw=1.3, fill=PAN)); o.append(CIRC(x + 116, gy - 7, 7, c=INK, lw=1.3, fill=PAN))
    o.append(ARR(x + 128, gy - 36, x + 156, gy - 36, c=GLD, lw=2, head=6)); o.append(T(x + 142, gy - 44, "力", "middle", 9.5, GLD, True))
    o.append(ARR(x + 74, gy + 18, x + 108, gy + 18, c=SIG, lw=1.4, head=5)); o.append(T(x + 112, gy + 22, "位置", "start", 9.5, SIG))
    for k, l in enumerate(["質量 1 kg", "抵抗の係数 2 N·s/m", "ばね定数 25 N/m", "ばねを外すと速度の例", "（この章の台車）"]):
        o.append(T(x + 178, y + 46 + k * 16, l, "start", 10, INK if k < 3 else MUT))
    o.append(T(x + 12, y + H_ - 12, "使う章: 1・2・4・5・6・17", "start", 10, SIG, True))
    # DC モータ
    x, y = cells[1]
    o.append(T(x + 12, y + 20, "DC モータ", "start", 11, SIG, True))
    my = y + 82
    o.append(RECT(x + 46, my - 24, 56, 48, 6, SSOFT, SIG, 1.5)); o.append(RECT(x + 102, my - 10, 8, 20, 2, PAN, SIG, 1.2))
    o.append(W(x + 110, my, x + 132, my, c=INK, lw=2.4)); o.append(RECT(x + 132, my - 26, 10, 52, 2, MSOFT, MUT, 1.2))
    o.append(CARR(x + 128, my - 36, x + 150, my - 28, 0.4, c=GLD, lw=1.4, head=5))
    o.append(W(x + 46, my - 12, x + 22, my - 12, x + 22, my + 40, c=GLD, lw=1.4)); o.append(W(x + 46, my + 12, x + 34, my + 12, x + 34, my + 40, c=GLD, lw=1.4))
    o.append(T(x + 28, my + 54, "電圧", "middle", 9.5, GLD, True))
    o.append(T(x + 120, my + 46, "回転の速さ", "middle", 9.5, SIG))
    for k, l in enumerate(["電源 12 V", "巻線 2 Ω・1 mH", "トルク定数 0.02 N·m/A", "慣性モーメント 1×10⁻⁵ kg·m²"]):
        o.append(T(x + 166, y + 46 + k * 16, l, "start", 10, INK))
    o.append(T(x + 12, y + H_ - 12, "使う章: 2〜4・7・10・12〜16", "start", 10, SIG, True))
    # 温度の板
    x, y = cells[2]
    o.append(T(x + 12, y + 20, "温度の板（ヒータ）", "start", 11, SIG, True))
    py_ = y + 92
    o.append(RECT(x + 24, py_ - 12, 120, 18, 3, MSOFT, MUT, 1.4)); o.append(RECT(x + 40, py_ + 6, 88, 7, 2, PSOFT, PUR, 1.2))
    o.append(T(x + 84, py_ + 30, "ヒータ 0〜80 W", "middle", 9.5, PUR, True))
    o.append(RECT(x + 112, py_ - 20, 16, 8, 2, TSOFT, TEA, 1.2)); o.append(T(x + 120, py_ - 26, "センサ", "middle", 9.5, TEA, True))
    for k in range(3):
        xx = x + 44 + k * 22
        o.append(PATH("M%g,%g c-5,-6 5,-10 0,-16 c-5,-6 5,-10 0,-16" % (xx, py_ - 16), c=GLD, lw=1.3))
    o.append(T(x + 64, py_ - 56, "逃げる熱", "middle", 9.5, GLD))
    for k, l in enumerate(["熱容量 400 J/K", "熱抵抗 1.25 K/W", "センサの遅れ 20 s", "周り 25 °C、目標 60 °C"]):
        o.append(T(x + 166, y + 46 + k * 16, l, "start", 10, INK))
    o.append(T(x + 12, y + H_ - 12, "使う章: 2・3・9〜11・14", "start", 10, SIG, True))
    # 倒立振子
    x, y = cells[3]
    o.append(T(x + 12, y + 20, "倒立振子（台車型）", "start", 11, SIG, True))
    gy = y + 132
    o.append(W(x + 14, gy, x + 160, gy, c=MUT, lw=1.6))
    o.append(RECT(x + 52, gy - 30, 56, 20, 3, SSOFT, SIG, 1.5))
    o.append(CIRC(x + 64, gy - 6, 6, c=INK, lw=1.3, fill=PAN)); o.append(CIRC(x + 96, gy - 6, 6, c=INK, lw=1.3, fill=PAN))
    ax_, ay_ = x + 80, gy - 30
    tx_, ty_ = ax_ + 70 * math.sin(math.radians(12)), ay_ - 70 * math.cos(math.radians(12))
    o.append(W(ax_, ay_, tx_, ty_, c=INK, lw=2.4)); o.append(D(tx_, ty_, ALI, 7))
    o.append(W(ax_, ay_, ax_, ay_ - 76, c=FNT, lw=1, dash="3 3"))
    o.append(ARR(x + 22, gy - 20, x + 50, gy - 20, c=GLD, lw=2, head=6)); o.append(T(x + 30, gy - 28, "押す力", "middle", 9.5, GLD, True))
    o.append(PATH("M%g,%g A34,34 0 0,1 %g,%g" % (ax_, ay_ - 34, ax_ + 34 * math.sin(math.radians(12)), ay_ - 34 * math.cos(math.radians(12))), c=ALI, lw=1.3))
    o.append(T(ax_ + 14, ay_ - 30, "角度", "start", 9.5, ALI, True))
    for k, l in enumerate(["台車 0.5 kg", "振子 0.2 kg", "長さ 0.3 m", "真上で倒れないように", "台車を押して立てる"]):
        o.append(T(x + 166, y + 46 + k * 16, l, "start", 10, INK if k < 3 else MUT))
    o.append(T(x + 12, y + H_ - 12, "使う章: 2・17〜21", "start", 10, SIG, True))
    return SVG(700, 380, o, "シリーズの例の対象（値はどれも計算のための例の値）。章をまたいで同じ値を使い、前の章で求めた式や性質を、後の章でそのまま使う。DC モータと温度の板は、電源と周辺の制御シリーズ 13・14 章と同じものである。")
F["e01_objects"] = _f01_objects_fig()
