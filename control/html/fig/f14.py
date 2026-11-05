# -*- coding: utf-8 -*-
# 14 章 フィードフォワード・カスケード・むだ時間補償 の図
import numpy as _f14_np
from scipy.linalg import expm as _f14_expm

# =====================================================================
# 補助（書式）
# =====================================================================
def _f14_g(v, d=3):
    """有効数字 d 桁（負の符号は −）。"""
    if v == 0:
        return "0"
    s = ("%." + str(d) + "g") % v
    if "e" in s:
        s = "%.0f" % v
    return s.replace("-", "−")


def _f14_f(v, d=1):
    """小数点以下 d 桁（負の符号は −、−0 は 0）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f14_settle(t, y, yf, band):
    """|y − yf| が band の外に最後にいた後の時刻（線形補間）。"""
    t = _f14_np.asarray(t); y = _f14_np.asarray(y)
    out = _f14_np.where(_f14_np.abs(y - yf) > band)[0]
    if len(out) == 0:
        return 0.0
    i = out[-1]
    if i + 1 >= len(t):
        return float("nan")
    a, b = abs(y[i] - yf) - band, abs(y[i + 1] - yf) - band
    return float(t[i] + (t[i + 1] - t[i]) * a / (a - b)) if a != b else float(t[i + 1])


# =====================================================================
# 温度の板（60 °C・28 W からのずれ）: P = 1.25 e^{−20s}/(500s + 1)
# =====================================================================
_F14_K, _F14_T, _F14_L = 1.25, 500.0, 20.0


def _f14_plate(KP=10.0, TI=160.0, b=1.0, r=None, d=None, tEnd=1500.0, h=0.1, Lt=20.0, Kt=1.25, Tt=500.0,
               smith=False, Lm=20.0, Km=1.25, Tm=500.0, ref=None, dff=None, every=10, umin=None, umax=None):
    """温度の板を刻み h で数値計算する。y: 60 °C からの温度のずれ [K]、u: 28 W からの電力のずれ [W]。
    対象は一次遅れを零次ホールドで厳密に離散化し、むだ時間は入力（u + d）を刻みの数だけ遅らせる。
    制御器は PI（P の分は K_P(b r − y_f)、I の分は K_P/T_I ∫(r − y_f)）。y_f は戻す値:
      smith=False なら測った値 y、smith=True ならスミス予測器の y_p = y + ỹ0 − ỹ0(t − Lm)（モデル Km・Tm・Lm）。
    ref=λ なら、目標値を前置フィルタ e^{−Lm s}/(λs + 1) に通した r_m を目標値とし、フィードフォワード
      Q r = (Tm s + 1)/(Km(λs + 1)) r を足す。dff(t): 外乱のフィードフォワード（足す電力）。
    返り値: t, y, u, yp, y0, rm, uff の並び（every 刻みごと）。"""
    np = _f14_np
    n = int(round(tEnd / h)); nd = int(round(Lt / h)); ndm = int(round(Lm / h))
    a = math.exp(-h / Tt); bb = Kt * (1 - a)
    am = math.exp(-h / Tm); bm = Km * (1 - am)
    x = 0.0; I = 0.0
    buf = [0.0] * max(nd, 1); bi = 0
    xm = 0.0; bufm = [0.0] * max(ndm, 1); bim = 0
    z = 0.0; zb = [0.0] * max(ndm, 1); zi = 0
    al = math.exp(-h / ref) if ref else 0.0
    alh = math.exp(-h / (2 * ref)) if ref else 0.0
    rf = r or (lambda t: 0.0); df = d or (lambda t: 0.0)
    out = {k: [] for k in ("t", "y", "u", "yp", "y0", "rm", "uff")}
    for k in range(n + 1):
        t = k * h
        y = x
        rr = rf(t)
        if ref:
            rm = zb[zi] if ndm else z
            zh = rr + (z - rr) * alh          # 刻みの中ほどの値で、零次ホールドの遅れを小さくする
            uff = (Tm * (rr - zh) / ref + zh) / Km
        else:
            rm = rr; uff = 0.0
        if smith:
            yd = bufm[bim] if ndm else xm
            yfb = y + xm - yd
        else:
            yfb = y
        e = rm - yfb
        u = uff + KP * (b * rm - yfb) + I + (dff(t) if dff else 0.0)
        if umax is not None:
            u = min(u, umax)
        if umin is not None:
            u = max(u, umin)
        if k % every == 0:
            out["t"].append(t); out["y"].append(y); out["u"].append(u); out["yp"].append(yfb)
            out["y0"].append(xm); out["rm"].append(rm); out["uff"].append(uff)
        if TI:
            I += KP * h / TI * e
        uin = u + df(t)
        if nd:
            ua = buf[bi]; buf[bi] = uin; bi = (bi + 1) % nd
        else:
            ua = uin
        x = a * x + bb * ua
        if smith:
            if ndm:
                bufm[bim] = xm; bim = (bim + 1) % ndm
            xm = am * xm + bm * u
        if ref:
            if ndm:
                zb[zi] = z; zi = (zi + 1) % ndm
            z = rr + (z - rr) * al
    return {k: np.array(v) for k, v in out.items()}


def _f14_stepm(R, yf=1.0):
    """行き過ぎ量 [%] と 2 % 整定時間。"""
    y = R["y"]
    return max(0.0, (float(y.max()) - yf) / yf * 100), _f14_settle(R["t"], y, yf, 0.02 * abs(yf))


def _f14_iae(R):
    return float(_f14_np.trapezoid(_f14_np.abs(R["y"]), R["t"]))


# =====================================================================
# モータの角度（L_a を無視）: T θ'' + θ' = K v、K = 50、T = 0.05
# =====================================================================
def _f14_traj(th=10.0, v=50.0, a=500.0):
    """台形の速度の目標。返り値 (f, 終わる時刻)。f(t) = (r, r', r'')。"""
    ta = v / a
    da = 0.5 * a * ta * ta
    if 2 * da > th:
        ta = math.sqrt(th / a); v = a * ta; da = th / 2; tc = 0.0
    else:
        tc = (th - 2 * da) / v
    tf = 2 * ta + tc

    def f(t):
        if t <= 0:
            return 0.0, 0.0, 0.0
        if t < ta:
            return 0.5 * a * t * t, a * t, a
        if t < ta + tc:
            return da + v * (t - ta), v, 0.0
        if t < tf:
            s = t - ta - tc
            return da + v * tc + v * s - 0.5 * a * s * s, v - a * s, -a
        return th, 0.0, 0.0
    return f, tf


def _f14_mff(f, KP=0.84, KD=0.02, ff=2, fb=True, K=50.0, T=0.05, Km=50.0, Tm=0.05, tEnd=0.6, h=1e-4, every=5, vlim=12.0):
    """モータの角度の目標値フィードフォワード。v = v_ff + (K_P e + K_D e')（D は偏差に掛ける）。
    ff: 0 なし、1 角速度の分 r'/Km、2 さらに角加速度の分 Tm r''/Km。零次ホールドで厳密に刻む。"""
    np = _f14_np
    n = int(round(tEnd / h)); a = math.exp(-h / T)
    th = w = 0.0
    out = {k: [] for k in ("t", "th", "e", "v", "vff", "r")}
    for k in range(n + 1):
        t = k * h
        r, rd, rdd = f(t + 0.5 * h)          # 刻みの中ほどの目標値（加速度の段差を刻みの境に合わせる）
        r0, rd0, _ = f(t)
        vff = (rd / Km if ff >= 1 else 0.0) + (Tm * rdd / Km if ff >= 2 else 0.0)
        e = r0 - th
        v = vff + ((KP * e + KD * (rd0 - w)) if fb else 0.0)
        v = max(-vlim, min(vlim, v))
        if k % every == 0:
            out["t"].append(t); out["th"].append(th); out["e"].append(e); out["v"].append(v); out["vff"].append(vff); out["r"].append(r0)
        wi = K * v
        th = th + wi * h + (w - wi) * T * (1 - a)
        w = wi + (w - wi) * a
    return {k: np.array(v) for k, v in out.items()}


# =====================================================================
# 台車の速度（1 章）: m v' + c v = u + d、d = −m g sin φ
# =====================================================================
def _f14_cart(KP=8.0, KI=0.0, ff=False, fb=True, ang=4.0, angm=3.0, tS=1.0, tEnd=4.0, h=1e-3, m=1.0, c=2.0):
    np = _f14_np
    n = int(round(tEnd / h)); v = 1.0; I = 0.0
    out = {"t": [], "v": [], "u": []}
    a = math.exp(-c / m * h)
    for k in range(n + 1):
        t = k * h
        on = t >= tS
        d = -m * 9.81 * math.sin(math.radians(ang)) if on else 0.0
        uff = m * 9.81 * math.sin(math.radians(angm)) if (ff and on) else 0.0
        e = 1.0 - v
        u = 2.0 + uff + ((KP * e + I) if fb else 0.0)
        out["t"].append(t); out["v"].append(v); out["u"].append(u)
        I += KI * e * h
        vin = (u + d) / c
        v = vin + (v - vin) * a
    return {k: np.array(x) for k, x in out.items()}


# =====================================================================
# モータの角度のカスケード（L_a を含む）: 状態 [θ, ω, i]
# =====================================================================
_F14_RA, _F14_LA, _F14_KT, _F14_J = 2.0, 1e-3, 0.02, 1e-5


def _f14_mdisc(h, J=_F14_J):
    A = _f14_np.array([[0, 1, 0], [0, 0, _F14_KT / J], [0, -_F14_KT / _F14_LA, -_F14_RA / _F14_LA]])
    B = _f14_np.array([[0, 0], [0, -1 / J], [1 / _F14_LA, 0]])
    M = _f14_np.zeros((5, 5)); M[:3, :3] = A * h; M[:3, 3:] = B * h
    E = _f14_expm(M)
    return E[:3, :3].tolist(), E[:3, 3:].tolist()


def _f14_casc(mode, tEnd=0.6, h=1e-5, r=None, tau=None, vs=None, every=20, Kth=None, ilim=None, J=_F14_J):
    """mode: "pid"（角度の PID だけ。10 章 5 節の値、測定値の不完全微分 N = 10）、
    "ps"（角度の比例 → 角速度の PI → 電圧）、"psc"（角度の比例 → 角速度の PI → 電流の PI → 電圧）。
    電圧の指令は ±12 V で切り、電源の電圧 vs(t) に比例して実際の電圧になる。積分はクランプ（張り付いて外へ向かう間は止める）。"""
    np = _f14_np
    Ad, Bd = _f14_mdisc(h, J)
    (a00, a01, a02), (a10, a11, a12), (a20, a21, a22) = Ad
    (b00, b01), (b10, b11), (b20, b21) = Bd
    rf = r or (lambda t: 0.0); tf = tau or (lambda t: 0.0); vf = vs or (lambda t: 12.0)
    th = w = i = 0.0
    Ip = Dp = 0.0; yprev = 0.0; Iw = 0.0; Ii = 0.0
    KP, KI, KD, N = 0.84, 5.0, 0.02, 10.0
    Tf = KD / KP / N
    if mode == "ps":
        Kth = 20.0 if Kth is None else Kth; KPw, TIw = 0.1, 0.05
    elif mode == "psc":
        Kth = 200.0 if Kth is None else Kth; KPw, TIw = 0.5, 4e-3; KPi, TIi = 5.0, 5e-4
    n = int(round(tEnd / h))
    out = {k: [] for k in ("t", "th", "w", "i", "v")}
    for k in range(n + 1):
        t = k * h
        rr = rf(t)
        if mode == "pid":
            Dp = Tf / (Tf + h) * Dp - KD / (Tf + h) * (th - yprev)
            yprev = th
            e = rr - th
            vc = KP * e + Ip + Dp
            v = max(-12.0, min(12.0, vc))
            if not ((vc > 12 and e > 0) or (vc < -12 and e < 0)):
                Ip += KI * e * h
        elif mode == "ps":
            ew = Kth * (rr - th) - w
            vc = KPw * ew + Iw
            v = max(-12.0, min(12.0, vc))
            if not ((vc > 12 and ew > 0) or (vc < -12 and ew < 0)):
                Iw += KPw / TIw * ew * h
        else:
            ew = Kth * (rr - th) - w
            icc = KPw * ew + Iw
            ic = icc if ilim is None else max(-ilim, min(ilim, icc))
            if not (ilim is not None and ((icc > ilim and ew > 0) or (icc < -ilim and ew < 0))):
                Iw += KPw / TIw * ew * h
            ei = ic - i
            vc = KPi * ei + Ii
            v = max(-12.0, min(12.0, vc))
            if not ((vc > 12 and ei > 0) or (vc < -12 and ei < 0)):
                Ii += KPi / TIi * ei * h
        va = v * vf(t) / 12.0
        tl = tf(t)
        if k % every == 0:
            out["t"].append(t); out["th"].append(th); out["w"].append(w); out["i"].append(i); out["v"].append(v)
        th, w, i = (a00 * th + a01 * w + a02 * i + b00 * va + b01 * tl,
                    a10 * th + a11 * w + a12 * i + b10 * va + b11 * tl,
                    a20 * th + a21 * w + a22 * i + b20 * va + b21 * tl)
    return {k: np.array(x) for k, x in out.items()}


# =====================================================================
# ヒータの電力のループ（温度の板、周りとの差 y、目標 35 K）
# =====================================================================
def _f14_heater(inner=False, KP=10.0, TI=160.0, Vd=90.0, tD=200.0, tEnd=1200.0, h=0.1, taup=2.0, every=10):
    np = _f14_np
    n = int(round(tEnd / h)); nd = int(round(_F14_L / h))
    a = math.exp(-h / _F14_T); bb = _F14_K * (1 - a)
    x = 35.0; I = 28.0; buf = [28.0] * nd; bi = 0; duty = 28 / 80.0
    out = {k: [] for k in ("t", "y", "u", "p")}
    for k in range(n + 1):
        t = k * h
        V = 100.0 if t < tD else Vd
        Pf = 80 * (V / 100) ** 2
        y = x; e = 35.0 - y
        u = min(max(KP * e + I, 0.0), 80.0)
        if inner:
            duty += (u - duty * Pf) / (80 * taup) * h
            duty = min(max(duty, 0.0), 1.0)
        else:
            duty = u / 80.0
        p = duty * Pf
        if k % every == 0:
            out["t"].append(t); out["y"].append(y - 35.0); out["u"].append(u); out["p"].append(p)
        I += KP * h / TI * e
        ua = buf[bi]; buf[bi] = p; bi = (bi + 1) % nd
        x = a * x + bb * ua
    return {k: np.array(v) for k, v in out.items()}


# =====================================================================
# 波線（モデルの印 ~）付きの文字。"P~_0(s)" は P の上に波線を描き、_0 を添字にする
# （共通部品 TX は、結合文字の波線の後の添字を扱えないため）
# =====================================================================
_F14_TXRE = None


def _f14_tt(x, y, s, a="start", sz=10, c=INK, b=False, halo=False):
    """TX と同じ書き方に加えて、「文字~」でその文字に結合文字の波線（U+0303、モデルの印）を付ける。
    共通部品 TX の分け方は、波線の付いた文字の後の添字を扱えないので、波線の付いた文字も添字の土台にできる分け方で書く。"""
    import re as _re
    global _F14_TXRE
    if _F14_TXRE is None:
        _F14_TXRE = _re.compile(r"\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-\u024F]\u0303?)_\{([^}]*)\}|([A-Za-zα-ωΑ-Ω]\u0303?)_([A-Za-z0-9∞%]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)")
    s = _re.sub(r"(.)~", lambda m: m.group(1) + "\u0303", s)
    segs, pos = [], 0
    for mm in _F14_TXRE.finditer(s):
        if mm.start() > pos:
            segs.append(("n", s[pos:mm.start()]))
        if mm.group(1):
            segs.append(("n", mm.group(2)))
        elif mm.group(3) is not None:
            segs.append(("n", mm.group(3))); segs.append(("sub", mm.group(4)))
        elif mm.group(5) is not None:
            segs.append(("n", mm.group(5))); segs.append(("sub", mm.group(6)))
        else:
            segs.append(("sup", mm.group(7) if mm.group(7) is not None else mm.group(8)))
        pos = mm.end()
    if pos < len(s):
        segs.append(("n", s[pos:]))
    ssz = sz * 0.72
    w = sum(tw(t, ssz) if k in ("sub", "sup") else tw(t, sz) for k, t in segs)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, s))
    hs = ' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR if halo else ""
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"%s>'
         % (round(x0, 2), round(y, 2), sz, c, "700" if b else "400", hs)]
    cur = 0.0
    for kind, t in segs:
        want = 3.0 if kind == "sub" else (-sz * 0.38 if kind == "sup" else 0.0)
        dy = want - cur; cur = want
        fs = ' font-size="%g"' % round(ssz, 2) if kind in ("sub", "sup") else ""
        o.append('<tspan%s%s>%s</tspan>' % ((' dy="%g"' % round(dy, 2)) if abs(dy) > 1e-9 else "", fs, E(t)))
    o.append("</text>")
    return "".join(o)


def _f14_tbox(x, yc, s, w=None, c=LIN, fill=PAN, sz=11.5, h=34):
    """波線付きの文字を 1 行で書いた箱。返り値 (svg, 幅)。"""
    clean = s.replace("~", "")
    w = w or max(40, TXW(clean, sz) + 18)

    return RECT(x, yc - h / 2, w, h, 6, fill, c, 1.4) + _f14_tt(x + w / 2, yc + sz * 0.36, s, "middle", sz, INK), w


# =====================================================================
# 図の小さな部品
# =====================================================================
def _f14_plot(x, y, w, h, xr, yr, xt, yt, xl=None, yl=None, xf=None, yf=None, sz=9):
    p = Plot(x, y, w, h, xr, yr)
    return p, p.axes(xl=xl, yl=yl, xt=xt, yt=yt, xfmt=xf or (lambda v: _f14_g(v, 4)), yfmt=yf or (lambda v: _f14_g(v, 4)), sz=sz)


def _f14_pts(t, y, step=1):
    return list(zip(_f14_np.asarray(t)[::step].tolist(), _f14_np.asarray(y)[::step].tolist()))


# =====================================================================
# 1 節: ブロック線図 — 1 自由度・2 自由度・前置フィルタ・フィードフォワード
# =====================================================================
def _f14_2dof_bd_fig():
    o = []
    R = 15

    def note(x, y, lines, c=INK):
        for k, (s, cc, bb) in enumerate(lines):
            o.append(TX(x, y + k * 16, s, "start", 10, cc or c, bb))

    # (a) 1 自由度
    y = 62
    o.append(T(14, 18, "(a) 1 自由度: 偏差だけを見る", "start", 11.5, INK, True))
    s, P, xe = CHAIN(18, y, [("a", 50, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, None, ALI),
                             ("b", "C(s)", "c", SIG, SSOFT), ("a", 46, None, GLD), ("b", "P(s)", "p"), ("a", 50, None, SIG),
                             ("t", "o", SIG), ("a", 30, None, SIG)])
    o.append(s)
    o.append(FBPATH(P["o"], P["s1"], y, 30, SIG))
    o.append(TX(20, y - 9, "r", "start", 10, MUT, True))
    o.append(TX((P["c"][1] + P["p"][0]) / 2, y - 9, "u", "middle", 10, GLD, True))
    o.append(TX(xe - 2, y - 9, "y", "end", 10, SIG, True))
    note(430, y - 14, [("U = C(s)(R − Y)", INK, True), ("G_{yr} と G_{yd} がどちらも C(s) で決まる", MUT, False)])
    # (b) 2 自由度
    y = 160
    o.append(T(14, y - 44, "(b) 2 自由度: 目標値と測った値に別の伝達関数を掛ける", "start", 11.5, INK, True))
    s, P, xe = CHAIN(18, y, [("a", 30, None, MUT), ("b", "C_r(s)", "cr", SIG, SSOFT), ("a", 30, None, GLD),
                             ("s", {"l": "+", "b": "−"}, "s1"), ("a", 46, None, GLD), ("b", "P(s)", "p"), ("a", 50, None, SIG),
                             ("t", "o", SIG), ("a", 30, None, SIG)])
    o.append(s)
    o.append(FBPATH(P["o"], P["s1"], y, 36, SIG, box="C_y(s)", bc=SIG, bfill=SSOFT, bh=26))
    o.append(TX(20, y - 9, "r", "start", 10, MUT, True))
    o.append(TX((P["s1"] + R + P["p"][0]) / 2, y - 9, "u", "middle", 10, GLD, True))
    o.append(TX(xe - 2, y - 9, "y", "end", 10, SIG, True))
    note(430, y - 14, [("U = C_r(s)R − C_y(s)Y", INK, True), ("外乱・ノイズ・安定性は C_y(s) で、", MUT, False),
                       ("目標値への応答はさらに C_r(s) で決まる", MUT, False)])
    # (c) 前置フィルタ
    y = 268
    o.append(T(14, y - 44, "(c) 前置フィルタ: 目標値をループの前で整える", "start", 11.5, INK, True))
    s, P, xe = CHAIN(18, y, [("a", 26, None, MUT), ("b", "G_f(s)", "gf", SIG, SSOFT), ("a", 26, None, MUT),
                             ("s", {"l": "+", "b": "−"}, "s1"), ("a", 30, None, ALI), ("b", "C(s)", "c"), ("a", 30, None, GLD),
                             ("b", "P(s)", "p"), ("a", 36, None, SIG), ("t", "o", SIG), ("a", 24, None, SIG)])
    o.append(s)
    o.append(FBPATH(P["o"], P["s1"], y, 28, SIG))
    o.append(TX(20, y - 9, "r", "start", 10, MUT, True))
    o.append(TX(xe - 2, y - 9, "y", "end", 10, SIG, True))
    note(430, y - 14, [("C_r = G_f C、C_y = C", INK, True), ("G_{yr} は 1 自由度の G_{yr} の G_f 倍", MUT, False)])
    # (d) フィードフォワード
    y = 392
    o.append(T(14, y - 66, "(d) フィードフォワード: 目標値から輪の外の道で操作量を足す", "start", 11.5, INK, True))
    s, P, xe = CHAIN(18, y, [("a", 22, None, MUT), ("t", "br", MUT), ("a", 26, None, MUT),
                             ("s", {"l": "+", "b": "−"}, "s1"), ("a", 26, None, ALI), ("b", "C(s)", "c"), ("a", 26, None, GLD),
                             ("s", {"l": "+", "t": "+"}, "s2"), ("a", 26, None, GLD), ("b", "P(s)", "p"), ("a", 34, None, SIG),
                             ("t", "o", SIG), ("a", 22, None, SIG)])
    o.append(s)
    o.append(FFPATH(P["br"], P["s2"], y, 40, GLD, box="C_ff(s)", bc=SIG, bfill=SSOFT, bh=26))
    o.append(FBPATH(P["o"], P["s1"], y, 28, SIG))
    o.append(TX(20, y - 9, "r", "start", 10, MUT, True))
    o.append(TX(xe - 2, y - 9, "y", "end", 10, SIG, True))
    note(430, y - 14, [("C_r = C + C_ff、C_y = C", INK, True), ("偏差を待たずに操作量を出す", MUT, False)])
    return SVG(700, y + 46, o, "制御器の 4 つの形。(a) 1 自由度の制御器は偏差だけを見るので、目標値への応答と外乱への応答が同じ C(s) で決まる。(b) 2 自由度の制御器は、目標値に C<sub>r</sub>(s)、測った値に C<sub>y</sub>(s) を掛ける。閉ループの極・外乱・観測ノイズは C<sub>y</sub>(s) だけで決まる。(c)・(d) は C<sub>r</sub>(s) の作り方で、目標値の形を整える前置フィルタと、目標値から輪の外の道で操作量を足すフィードフォワードである。")


F["e14_2dof_bd"] = _f14_2dof_bd_fig()


# =====================================================================
# 1 節: 1 自由度の 2 つの PI と、2 自由度（前置フィルタ）の比較
# =====================================================================
def _f14_2dof_cmp_fig():
    o = []
    cases = [("(a) 1 自由度: PI 10 W/K・T_I = 500 s", 10.0, 500.0, 1.0, SIG),
             ("(b) 1 自由度: PI 10 W/K・T_I = 160 s", 10.0, 160.0, 1.0, ALI),
             ("(c) 2 自由度: (b) の PI ＋ 前置フィルタ (128s + 1)/(160s + 1)（b = 0.8）", 10.0, 160.0, 0.8, GRN)]
    o.append(T(200, 16, "目標値を 1 K 上げる", "middle", 11, INK, True))
    o.append(T(550, 16, "ヒータの電力に −10 W の外乱", "middle", 11, INK, True))
    y0 = 30
    for k, (lab, KP, TI, b, c) in enumerate(cases):
        yy = y0 + k * 124
        o.append(TX(14, yy + 14, lab, "start", 10.5, c, True))
        A = _f14_plate(KP, TI, b, r=lambda t: 1.0, tEnd=700.0, every=10)
        B = _f14_plate(KP, TI, 1.0, d=lambda t: -10.0, tEnd=1800.0, every=10)
        mp, ts = _f14_stepm(A)
        iae = 10.0 * TI / KP
        mn = float(B["y"].min())
        last = k == 2
        p, ax = _f14_plot(70, yy + 26, 260, 74, (0, 700), (0, 1.3), [0, 100, 200, 300, 400, 500, 600, 700], [0, 0.5, 1],
                          yl="ずれ [K]", xl="時間 t [s]" if last else None, xf=None if last else (lambda v: ""))
        o.append(ax)
        o.append(W(p.X(0), p.Y(1), p.X(700), p.Y(1), c=MUT, lw=1, dash="5 3"))
        o.append(p.line(_f14_pts(A["t"], A["y"]), c=c, lw=2))
        o.append(T(p.X(690), p.Y(0.33), "行き過ぎ %s %%" % _f14_f(mp, 1), "end", 9.5, c, True, halo=True))
        o.append(T(p.X(690), p.Y(0.12), "2 %% 整定 %s s" % _f14_g(ts, 3), "end", 9.5, c, True, halo=True))
        q, ax = _f14_plot(430, yy + 26, 250, 74, (0, 1800), (-1.1, 0.25), [0, 300, 600, 900, 1200, 1500, 1800], [-1, -0.5, 0],
                          yl="ずれ [K]", xl="時間 t [s]" if last else None, xf=None if last else (lambda v: ""))
        o.append(ax)
        pts = _f14_pts(B["t"], B["y"])
        o.append(PL([(q.X(pts[0][0]), q.Y(0))] + [(q.X(a_), q.Y(b_)) for a_, b_ in pts] + [(q.X(pts[-1][0]), q.Y(0))],
                    c="none", lw=0, fill=soft(c), op=0.8))
        o.append(q.line(pts, c=c, lw=2))
        o.append(T(q.X(1780), q.Y(-0.62), "最大 %s K" % _f14_f(-mn, 2), "end", 9.5, c, True, halo=True))
        o.append(T(q.X(1780), q.Y(-0.88), "IAE %s K·s" % _f14_g(iae, 3), "end", 9.5, c, True, halo=True))
    return SVG(700, y0 + 3 * 124 + 26, o, "温度の板（60 °C で落ち着いた所から）を 3 つの制御器で比べる。左は目標値を 1 K 上げたときの温度のずれ、右はヒータの電力に −10 W の外乱が入ったときの温度のずれ（塗った面積が IAE）。(a) は目標値によいが外乱に弱く、(b) は外乱に強いが目標値に 19.3 % 行き過ぎる。(c) は (b) と同じ C<sub>y</sub> なので外乱への応答は (b) と同じで、目標値への応答だけが前置フィルタで (a) と同じくらいに整う。")


F["e14_2dof_cmp"] = _f14_2dof_cmp_fig()


# =====================================================================
# 2 節: モデルの逆 — 台形の速度の目標と、要る電圧
# =====================================================================
def _f14_ff_inv_fig():
    o = []
    f, tf = _f14_traj()
    R = _f14_mff(f, ff=2, fb=False, tEnd=0.4, h=1e-4, every=10)
    t = R["t"]
    rr = _f14_np.array([f(x)[0] for x in t]); rd = _f14_np.array([f(x)[1] for x in t]); rdd = _f14_np.array([f(x + 1e-9)[2] for x in t])
    xt = [0, 0.1, 0.2, 0.3, 0.4]
    # (a) 角度
    o.append(TX(14, 18, "(a) 目標値 r と、v_ff だけで回したモータの角度", "start", 11, INK, True))
    p, ax = _f14_plot(62, 30, 250, 96, (0, 0.4), (0, 11), xt, [0, 5, 10], yl="角度 [rad]", xf=lambda v: "")
    o.append(ax)
    o.append(p.line(_f14_pts(t, rr), c=MUT, lw=3.2))
    o.append(p.line(_f14_pts(t, R["th"]), c=SIG, lw=1.6, dash="5 3"))
    o.append(LEGL(p.X(0.012), p.Y(10.2), [(MUT, None, "r"), (SIG, "5 3", "θ_m")], 9.5, 12))
    dmax = float(_f14_np.abs(R["th"] - rr).max())
    o.append(T(p.X(0.39), p.Y(1.8), "2 つは重なる（差は %s rad 未満）" % ("0.001" if dmax < 1e-3 else _f14_g(dmax * 1.5, 1)), "end", 9.5, SIG, True, halo=True))
    # (b) 角速度
    o.append(TX(390, 18, "(b) 角速度の目標 \\dot{r}（台形）", "start", 11, INK, True))
    q, ax = _f14_plot(438, 30, 250, 96, (0, 0.4), (0, 60), xt, [0, 25, 50], yl="[rad/s]", xf=lambda v: "")
    o.append(ax)
    o.append(q.line(_f14_pts(t, rd), c=MUT, lw=2.2))
    o.append(T(q.X(0.15), q.Y(52) - 4, "50 rad/s", "middle", 9.5, MUT, True, halo=True))
    # (c) 角加速度
    o.append(TX(14, 164, "(c) 角加速度 \\ddot{r}（段差で変わる）", "start", 11, INK, True))
    p2, ax = _f14_plot(62, 176, 250, 96, (0, 0.4), (-650, 650), xt, [-500, 0, 500], yl="[rad/s^2]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(p2.X(0), p2.Y(0), p2.X(0.4), p2.Y(0), c=LIN, lw=1))
    o.append(p2.line(_f14_pts(t, rdd), c=MUT, lw=2.2))
    o.append(T(p2.X(0.05), p2.Y(500) - 6, "加速", "middle", 9.5, MUT, True, halo=True))
    o.append(T(p2.X(0.15), p2.Y(0) - 6, "等速", "middle", 9.5, MUT, True, halo=True))
    o.append(T(p2.X(0.25), p2.Y(-500) + 14, "減速", "middle", 9.5, MUT, True, halo=True))
    # (d) 電圧
    o.append(TX(390, 164, "(d) v_ff = \\dot{r}/K + T\\ddot{r}/K", "start", 11, INK, True))
    q2, ax = _f14_plot(438, 176, 250, 96, (0, 0.4), (-0.8, 1.8), xt, [-0.5, 0, 0.5, 1, 1.5], yl="電圧 [V]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(q2.X(0), q2.Y(0), q2.X(0.4), q2.Y(0), c=LIN, lw=1))
    o.append(q2.line(_f14_pts(t, rd / 50.0), c=MUT, lw=1.4, dash="5 3"))
    o.append(q2.line(_f14_pts(t, 0.05 * rdd / 50.0), c=MUT, lw=1.4, dash="2 2"))
    o.append(q2.line(_f14_pts(t, R["vff"]), c=GLD, lw=2.2))
    o.append(TX(q2.X(0.205), q2.Y(1.35), "\\dot{r}/K", "start", 9.5, MUT, True, halo=True))
    o.append(TX(q2.X(0.205), q2.Y(-0.62), "T\\ddot{r}/K", "start", 9.5, MUT, True, halo=True))
    o.append(T(q2.X(0.1) + 4, q2.Y(1.5) + 2, "1.5 V", "start", 9.5, GLD, True, halo=True))
    return SVG(700, 316, o, "モデルの逆で電圧を決める。(a) 10 rad を 0.3 s で回す目標値 r（太い灰色）と、(d) の電圧 v<sub>ff</sub> だけを加えたモータの角度（青の破線）。モデルが正しければ、フィードバックが無くても 2 つは重なる。(b)・(c) 目標値の角速度は台形、角加速度は ±500 rad/s² の段差になる。(d) 要る電圧は、逆起電力と釣り合う角速度の分（破線）と、慣性を加速する角加速度の分（点線）の和で、最大 1.5 V である。")


F["e14_ff_inv"] = _f14_ff_inv_fig()


# =====================================================================
# 2 節: フィードフォワードの項を足す・モデルの誤差
# =====================================================================
def _f14_ff_cmp_fig():
    o = []
    f, tf = _f14_traj()
    xt = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
    cases = [(0, MUT, None, "フィードバックだけ"), (1, SIG, None, "＋角速度の分"), (2, GRN, None, "＋角加速度の分（両方）")]
    o.append(T(14, 18, "(a) モデルが正しいとき（フィードバックは PD: 0.84 V/rad・0.02 V·s/rad）", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 270, 110, (0, 0.6), (-0.8, 1.6), xt, [-0.5, 0, 0.5, 1, 1.5], yl="偏差 e [rad]", xl="時間 t [s]")
    o.append(ax)
    q, ax2 = _f14_plot(418, 32, 270, 110, (0, 0.6), (-1.5, 2.5), xt, [-1, 0, 1, 2], yl="電圧 v [V]", xl="時間 t [s]")
    o.append(ax2)
    for P_ in (p, q):
        o.append(RECT(P_.X(0), P_.y, P_.X(0.3) - P_.X(0), P_.h, 0, MSOFT, "none", 0, op=0.5))
        o.append(W(P_.X(0), P_.Y(0), P_.X(0.6), P_.Y(0), c=LIN, lw=1))
    for ff, c, dash, lab in cases:
        R = _f14_mff(f, ff=ff, tEnd=0.6, h=1e-4, every=10)
        o.append(p.line(_f14_pts(R["t"], R["e"]), c=c, lw=2, dash=dash))
        o.append(q.line(_f14_pts(R["t"], R["v"]), c=c, lw=1.8, dash=dash))
    o.append(T(p.X(0.155), p.Y(1.39) - 6, "1.39 rad", "middle", 9.5, MUT, True, halo=True))
    o.append(T(p.X(0.33), p.Y(-0.595) + 4, "−0.595 rad", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.58), p.Y(0.12), "両方: 0", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(0.15), p.y + p.h - 4, "目標値が動く間", "middle", 9, MUT, halo=True))
    o.append(LEGL(62, 194, [(MUT, None, "フィードバックだけ"), (SIG, None, "＋角速度の分 \\dot{r}/K"), (GRN, None, "＋角加速度の分 T\\ddot{r}/K（両方）")], 10, 22))
    # (b)(c) モデルの誤差
    yb = 228
    errs = [("(b) 慣性モーメントが 1.5 倍（T = 0.075 s）", dict(T=0.075)), ("(c) 電圧の効きが 0.8 倍（K = 40 (rad/s)/V）", dict(K=40.0))]
    for j, (lab, kw) in enumerate(errs):
        x0 = 62 + j * 356
        o.append(TX(x0 - 48, yb, lab, "start", 11, INK, True))
        P_, ax = _f14_plot(x0, yb + 14, 270, 100, (0, 0.6), (-0.6, 2.4), xt, [0, 1, 2], yl="偏差 e [rad]", xl="時間 t [s]")
        o.append(ax)
        o.append(RECT(P_.X(0), P_.y, P_.X(0.3) - P_.X(0), P_.h, 0, MSOFT, "none", 0, op=0.5))
        o.append(W(P_.X(0), P_.Y(0), P_.X(0.6), P_.Y(0), c=LIN, lw=1))
        A = _f14_mff(f, ff=0, tEnd=0.6, every=10, **kw)
        B = _f14_mff(f, ff=2, fb=False, tEnd=0.6, every=10, **kw)
        C_ = _f14_mff(f, ff=2, tEnd=0.6, every=10, **kw)
        o.append(P_.line(_f14_pts(A["t"], A["e"]), c=MUT, lw=1.5, dash="4 3"))
        o.append(P_.line(_f14_pts(B["t"], B["e"]), c=ALI, lw=2))
        o.append(P_.line(_f14_pts(C_["t"], C_["e"]), c=GRN, lw=2.2))
        mb = float(_f14_np.abs(B["e"]).max()); mc = float(_f14_np.abs(C_["e"]).max())
        if j == 0:
            o.append(T(P_.X(0.59), P_.Y(1.5), "フィードフォワードだけ: 最大 %s rad" % _f14_f(mb, 2), "end", 9.5, ALI, True, halo=True))
        else:
            o.append(T(P_.X(0.59), P_.Y(1.65), "フィードフォワードだけ: %s rad 残る" % _f14_f(float(B["e"][-1]), 2), "end", 9.5, ALI, True, halo=True))
        o.append(T(P_.X(0.59), P_.Y(-0.35), "両方: 最大 %s rad" % _f14_f(mc, 2), "end", 9.5, GRN, True, halo=True))
    o.append(LEGL(62, yb + 162, [(ALI, None, "フィードフォワードだけ（開ループ）"), (GRN, None, "フィードフォワード＋フィードバック"), (MUT, "4 3", "フィードバックだけ")], 10, 22))
    return SVG(700, yb + 172, o, "モータの角度を 10 rad 回す（灰色の帯は目標値が動いている 0〜0.3 s）。(a) フィードバックだけでは、回っている間に要る電圧を偏差から作るので 1.19 rad 以上遅れる。角速度の分を足すと、加速と減速の間だけ角加速度の分が足りずに ±0.595 rad 残り、両方を足すと偏差は 0 になる。(b)・(c) モデルが違うと、フィードフォワードだけ（赤）では偏差が残るが、フィードバックを合わせる（緑）と、その偏差が感度関数の分だけ縮み、止まった後は 0 に戻る。")


F["e14_ff_cmp"] = _f14_ff_cmp_fig()


# =====================================================================
# 2 節: 温度の板 — 前置フィルタとフィードフォワードで段差の目標値
# =====================================================================
def _f14_ff_plate_fig():
    o = []
    xt = [0, 100, 200, 300, 400, 500]
    o.append(T(14, 18, "(a) 目標値を 1 K 上げる（モデルが正しいとき）", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 270, 120, (0, 500), (0, 1.3), xt, [0, 0.5, 1], yl="温度のずれ [K]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(p.X(0), p.Y(1), p.X(500), p.Y(1), c=MUT, lw=1, dash="5 3"))
    A = _f14_plate(10, 160, 1.0, r=lambda t: 1.0, tEnd=500, every=5)
    Bb = _f14_plate(10, 160, 0.8, r=lambda t: 1.0, tEnd=500, every=5)
    C20 = _f14_plate(10, 160, 1.0, r=lambda t: 1.0, tEnd=500, every=5, ref=20.0)
    C10 = _f14_plate(10, 160, 1.0, r=lambda t: 1.0, tEnd=500, every=5, ref=10.0)
    o.append(p.line(_f14_pts(A["t"], A["y"]), c=ALI, lw=1.6))
    o.append(p.line(_f14_pts(Bb["t"], Bb["y"]), c=SIG, lw=1.6, dash="5 3"))
    o.append(p.line(_f14_pts(C20["t"], C20["y"]), c=GRN, lw=2.2))
    o.append(p.line(_f14_pts(C10["t"], C10["y"]), c=GRN, lw=1.6, dash="2 2"))
    rows = []
    for c, dash, lab, R_ in [(ALI, None, "1 自由度 (b)", A), (SIG, "5 3", "前置フィルタ b = 0.8", Bb),
                             (GRN, None, "フィードフォワード λ = 20 s", C20), (GRN, "2 2", "フィードフォワード λ = 10 s", C10)]:
        mp, ts = _f14_stepm(R_)
        rows.append((c, dash, "%s: %s %%・%s s" % (lab, _f14_f(mp, 1), _f14_g(ts, 3))))
    for k, (c, dash, s_) in enumerate(rows):
        o.append(LEGL(p.X(130), p.Y(0.6) + k * 14, [(c, dash, s_)], 9.5, 10))
    # (b) モデルの誤差
    o.append(T(380, 18, "(b) λ = 20 s で、本当の対象がモデルと違うとき", "start", 11, INK, True))
    q, ax = _f14_plot(418, 32, 270, 120, (0, 500), (0, 1.3), xt, [0, 0.5, 1], xl="時間 t [s]")
    o.append(ax)
    o.append(W(q.X(0), q.Y(1), q.X(500), q.Y(1), c=MUT, lw=1, dash="5 3"))
    cs = [(dict(), GRN, None, "モデルどおり"), (dict(Lt=25.0), SIG, None, "むだ時間 25 s"), (dict(Kt=1.625), PUR, "5 3", "定常ゲイン 1.3 倍")]
    for k, (kw, c, dash, lab) in enumerate(cs):
        Rr = _f14_plate(10, 160, 1.0, r=lambda t: 1.0, tEnd=500, every=5, ref=20.0, **kw)
        mp, ts = _f14_stepm(Rr)
        o.append(q.line(_f14_pts(Rr["t"], Rr["y"]), c=c, lw=1.9, dash=dash))
        o.append(LEGL(q.X(150), q.Y(0.5) + k * 14, [(c, dash, "%s: %s %%・%s s" % (lab, _f14_f(mp, 1), _f14_g(ts, 3)))], 9.5, 10))
    # (c) 電力
    o.append(T(14, 196, "(c) ヒータの電力のずれ（λ = 20 s、モデルどおり）", "start", 11, INK, True))
    z, ax = _f14_plot(62, 210, 626, 80, (0, 500), (-2, 24), xt, [0, 10, 20], yl="電力 [W]", xl="時間 t [s]")
    o.append(ax)
    o.append(z.line(_f14_pts(A["t"], A["u"]), c=ALI, lw=1.4))
    o.append(z.line(_f14_pts(C20["t"], C20["uff"]), c=GLD, lw=1.4, dash="5 3"))
    o.append(z.line(_f14_pts(C20["t"], C20["u"]), c=GLD, lw=2.2))
    o.append(T(z.X(8), z.Y(20) - 4, "始めに 20 W", "start", 9.5, GLD, True, halo=True))
    o.append(T(z.X(495), z.Y(3.5), "0.8 W に落ち着く（35 K を保つ 28 W からの増し分）", "end", 9.5, GLD, True, halo=True))
    o.append(T(z.X(200), z.Y(13), "1 自由度 (b) の電力", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(z.X(250), z.Y(20), [(GLD, None, "合計"), (GLD, "5 3", "フィードフォワードの分 Q(s)r")], 9.5, 16))
    return SVG(700, 334, o, "温度の板の目標値を段差で 1 K 上げる。目標値を前置フィルタ e<sup>−20s</sup>/(λs + 1) に通し、それにモデルの逆を掛けたもの（11 章の Q(s)）をフィードフォワードとして足す。フィードバックは (b) の PI のまま。(a) モデルどおりなら、制御量は前置フィルタの出力と一致し、行き過ぎない。(b) むだ時間や定常ゲインが違っても、フィードバックが残りを直す。(c) ヒータの電力は、始めに 20 W 増やして、落ち着く値まで減っていく。")


F["e14_ff_plate"] = _f14_ff_plate_fig()


# =====================================================================
# 3 節: 外乱のフィードフォワード — 線図と台車の坂
# =====================================================================
def _f14_dff_cart_fig():
    o = []
    R = 15
    o.append(T(14, 18, "(a) 外乱のフィードフォワード", "start", 11.5, INK, True))
    y = 120
    s, P, xe = CHAIN(18, y, [("a", 40, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 34, None, ALI), ("b", "C(s)", "c"),
                             ("a", 50, None, GLD), ("s", {"l": "+", "t": "+"}, "s2"), ("a", 36, None, GLD), ("b", "P(s)", "p"),
                             ("a", 40, None, SIG), ("s", {"l": "+", "t": "+"}, "s3"), ("a", 40, None, SIG), ("t", "o", SIG), ("a", 30, None, SIG)])
    o.append(s)
    o.append(FBPATH(P["o"], P["s1"], y, 30, SIG))
    o.append(TX(20, y - 9, "r", "start", 10, MUT, True))
    o.append(TX(xe - 2, y - 9, "y", "end", 10, SIG, True))
    # 外乱の線
    yd = 48
    xd = 60
    o.append(TX(xd - 6, yd + 4, "d", "end", 11, PUR, True))
    o.append(W(xd, yd, P["s3"], yd, c=PUR, lw=1.6))
    xpd = (P["p"][0] + P["p"][1]) / 2 + 60
    o.append(TFBOX(xpd - 30, yd, "P_d(s)", 60, PUR, PSOFT, h=26)[0])
    o.append(ARR(P["s3"], yd, P["s3"], y - R, c=PUR, lw=1.6))
    # 測る → モデルで −P_d/P → s2
    xm = xd + 30
    o.append(D(xm, yd, PUR, 3.6))
    o.append(W(xm, yd, xm, yd + 26, c=TEA, lw=1.6))
    o.append(T(xm + 6, yd + 22, "測る", "start", 9.5, TEA, True))
    fw = TFBW(("−P_d(s)", "P(s)"))
    xb = P["s2"] - fw / 2 - 40
    o.append(W(xm, yd + 26, xm, yd + 44, xb, yd + 44, c=TEA, lw=1.6))
    o.append(TFBOX(xb, yd + 44, ("−P_d(s)", "P(s)"), fw, SIG, SSOFT, h=40)[0])
    o.append(T(xb - 6, yd + 30, "モデルで", "end", 9.5, SIG, True, halo=True))
    o.append(W(xb + fw, yd + 44, P["s2"], yd + 44, c=GLD, lw=1.6))
    o.append(ARR(P["s2"], yd + 44, P["s2"], y - R, c=GLD, lw=1.6))
    o.append(T(540, 66, "モデルどおりなら打ち消し合う", "start", 10, GRN, True))
    o.append(T(540, 82, "ずれた分は感度関数 S 倍に縮む", "start", 10, INK))
    o.append(T(540, 98, "輪の外なので極は変わらない", "start", 10, MUT))
    # (b) 台車
    yb = 196
    o.append(T(14, yb, "(b) 台車の坂（本当は 4°、センサは 3° と読む）", "start", 11.5, INK, True))
    p, ax = _f14_plot(62, yb + 14, 420, 150, (0, 4), (0.88, 1.02), [0, 1, 2, 3, 4], [0.9, 0.95, 1.0], yl="速度 [m/s]", xl="時間 t [s]",
                      yf=lambda v: "%.2f" % v)
    o.append(ax)
    o.append(RECT(p.X(1), p.y, p.X(4) - p.X(1), p.h, 0, PSOFT, "none", 0, op=0.6))
    o.append(T(p.X(2.5), p.y + 12, "坂（4°）", "middle", 9.5, PUR, True, halo=True))
    o.append(W(p.X(0), p.Y(1), p.X(4), p.Y(1), c=MUT, lw=1, dash="5 3"))
    cs = [("フィードフォワードだけ", dict(ff=True, fb=False), ALI, None),
          ("比例だけ", dict(KP=8), MUT, None),
          ("両方（比例）", dict(KP=8, ff=True), SIG, None),
          ("PI だけ", dict(KP=8, KI=25), MUT, "4 3"),
          ("両方（PI）", dict(KP=8, KI=25, ff=True), GRN, None)]
    res = []
    for lab, kw, c, dash in cs:
        Rr = _f14_cart(**kw)
        o.append(p.line(_f14_pts(Rr["t"], Rr["v"], 4), c=c, lw=2 if dash is None else 1.6, dash=dash))
        res.append((lab, c, dash, float(Rr["v"][-1]), float(Rr["v"][Rr["t"] >= 1].min())))
    xr = 500
    o.append(T(xr, yb + 26, "坂の上の速度", "start", 10, INK, True))
    for k, (lab, c, dash, vf, vmin) in enumerate(res):
        yy = yb + 46 + k * 26
        o.append(W(xr, yy - 4, xr + 22, yy - 4, c=c, lw=2.2, dash=dash))
        o.append(T(xr + 28, yy, lab, "start", 10, INK))
        txt = ("%.3f m/s" % vf) if "PI" not in lab else ("1 m/s（最低 %.3f）" % vmin)
        o.append(T(xr + 28, yy + 13, txt, "start", 9.5, c if c != MUT else INK, True))
    return SVG(700, yb + 206, o, "(a) 外乱 d が対象の中の P<sub>d</sub>(s) を通って制御量に現れるとき、d を測り、モデルの P<sub>d</sub>/P の符号を変えたものを掛けて操作量に足す。モデルが正しければ外乱は打ち消され、ずれた分は感度関数 S 倍に縮む。(b) 1 章の台車が 1 s に 4° の坂に入る。傾きのセンサが 3° と読むので、坂の力 0.684 N のうち 0.513 N だけを足す。フィードフォワードだけでは 0.171 N 足りずに遅くなるが、比例制御と合わせると、フィードバックはその 0.171 N だけを受け持つ。")


F["e14_dff_cart"] = _f14_dff_cart_fig()


# =====================================================================
# 3 節: 温度の板の周りの温度
# =====================================================================
def _f14_dff_plate_fig():
    o = []
    xt = [0, 100, 200, 300, 400, 500, 600, 700, 800]
    o.append(T(14, 18, "(a) 温度のずれ（100 s に周りの温度が 25 °C → 15 °C）", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 626, 136, (0, 800), (-2.0, 0.3), xt, [-2, -1.5, -1, -0.5, 0], yl="温度のずれ [K]", xl=None, xf=lambda v: "")
    o.append(ax)
    yb = 278
    q, ax2 = _f14_plot(62, yb, 626, 90, (0, 800), (-2, 12), xt, [0, 4, 8, 12], yl="電力 [W]", xl="時間 t [s]")
    o.append(T(14, yb - 12, "(b) ヒータの電力のずれ（28 W から）", "start", 11, INK, True))
    o.append(ax2)
    for P_ in (p, q):
        o.append(W(P_.X(100), P_.y, P_.X(100), P_.y + P_.h, c=PUR, lw=1.2, dash="3 3"))
        o.append(RECT(P_.X(100), P_.y, P_.X(120) - P_.X(100), P_.h, 0, PSOFT, "none", 0, op=0.7))
    o.append(T(p.X(122), p.y + 12, "むだ時間 20 s: この間フィードバックは気づかない", "start", 9.5, PUR, True, halo=True))
    cs = [("PI だけ", dict(), ALI, None), ("PI ＋ フィードフォワード（モデルどおり）", dict(ff=1.0), GRN, None),
          ("PI ＋ フィードフォワード（熱抵抗のモデルが 1.3 倍）", dict(ff=1.3), SIG, None),
          ("フィードフォワードだけ（熱抵抗のモデルが 1.3 倍）", dict(ff=1.3, fb=False), ALI, "5 3")]
    leg = []
    for lab, kw, c, dash in cs:
        Rerr = kw.get("ff"); fb = kw.get("fb", True)
        dff = (lambda t, _e=Rerr: (10.0 / (1.25 * _e)) if t >= 100 else 0.0) if Rerr else None
        if fb:
            Rr = _f14_plate(10, 160, 1.0, d=lambda t: -8.0 if t >= 100 else 0.0, dff=dff, tEnd=800, every=5)
        else:
            Rr = _f14_plate(0.0, None, 1.0, d=lambda t: -8.0 if t >= 100 else 0.0, dff=dff, tEnd=800, every=5)
        o.append(p.line(_f14_pts(Rr["t"], Rr["y"]), c=c, lw=2 if dash is None else 1.7, dash=dash))
        o.append(q.line(_f14_pts(Rr["t"], Rr["u"]), c=c, lw=1.8 if dash is None else 1.5, dash=dash))
        mn = -float(Rr["y"].min())
        if fb:
            leg.append((c, dash, "%s: 最大 %s K" % (lab, _f14_f(mn, 2))))
        else:
            leg.append((c, dash, "%s: %s K 低い所へ向かう" % (lab, _f14_f(1.85 * 1.25, 2))))
    for k, it in enumerate(leg):
        o.append(LEGL(62, 194 + k * 14, [it], 9.5, 10))
    o.append(T(q.X(790), q.Y(8) - 5, "8 W（10 K ÷ 1.25 K/W）", "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(790), q.Y(6.15) + 13, "6.15 W", "end", 9.5, ALI, True, halo=True))
    return SVG(700, yb + 134, o, "温度の板（60 °C、PI は 10 W/K・160 s）の周りの温度が 100 s に 10 K 下がり、逃げる熱が 8 W 増える。PI だけでは、むだ時間 20 s の後に温度の読みが下がってから電力を増やすので、0.74 K 下がる。周りの温度を測ってフィードフォワードで 8 W 足すと、同じ時刻に電力が増えるので温度は動かない。熱抵抗のモデルがずれて 6.15 W しか足さなくても、残りを PI が直す。PI が無いと、足りない 1.85 W の分だけ低い所（2.31 K 下）へ、板の時定数 500 s でゆっくり向かう。")


F["e14_dff_plate"] = _f14_dff_plate_fig()


# =====================================================================
# 4 節: カスケード制御の線図
# =====================================================================
def _f14_casc_bd_fig():
    o = []
    R = 15
    # (a) 一般の形
    o.append(T(14, 18, "(a) カスケード制御: 外側の制御器の出力を、内側のループの目標値にする", "start", 11.5, INK, True))
    y = 92
    s, P, xe = CHAIN(18, y, [("a", 30, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 26, None, ALI), ("b", "C_1(s)", "c1", SIG, SSOFT),
                             ("a", 40, None, GLD), ("s", {"l": "+", "b": "−"}, "s2"), ("a", 26, None, ALI), ("b", "C_2(s)", "c2", SIG, SSOFT),
                             ("a", 34, None, GLD), ("s", {"l": "+", "t": "+"}, "sd"), ("a", 26, None, GLD), ("b", "P_2(s)", "p2"),
                             ("a", 34, None, SIG), ("t", "o2", SIG), ("a", 26, None, SIG), ("b", "P_1(s)", "p1"), ("a", 34, None, SIG),
                             ("t", "o1", SIG), ("a", 26, None, SIG)])
    o.append(s)
    o.append(TOPIN(P["sd"], y, 36, "d_2", PUR))
    o.append(FBPATH(P["o2"], P["s2"], y, 28, SIG))
    o.append(FBPATH(P["o1"], P["s1"], y, 52, SIG))
    o.append(TX(20, y - 9, "r_1", "start", 10, MUT, True))
    o.append(TX((P["c1"][1] + P["s2"] - R) / 2, y - 9, "r_2", "middle", 10, GLD, True))
    o.append(TX((P["c2"][1] + P["sd"] - R) / 2, y - 9, "u", "middle", 10, GLD, True))
    o.append(TX((P["o2"] + P["p1"][0]) / 2, y - 9, "y_2", "middle", 10, SIG, True))
    o.append(TX(xe - 2, y - 9, "y_1", "end", 10, SIG, True))
    x0, x1 = P["s2"] - R - 8, P["o2"] + 8
    o.append(RECT(x0, y - 46, x1 - x0, 86, 6, "none", SIG, 1.1, dash="5 4"))
    o.append(T(x0 + 4, y - 50, "内側のループ（マイナーループ）", "start", 9.5, SIG, True, halo=True))
    o.append(T(P["s1"] + 10, y + 66, "外側のループ", "start", 9.5, MUT, True, halo=True))
    # (b) モータ
    yb = 222
    o.append(T(14, yb - 46, "(b) モータの位置決め: 角度 → 角速度 → 電流の 3 段", "start", 11.5, INK, True))
    s, P, xe = CHAIN(14, yb, [("a", 20, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 14, None, ALI), ("b", "C_{θ}", "ct", SIG, SSOFT),
                              ("a", 20, None, GLD), ("s", {"l": "+", "b": "−"}, "s2"), ("a", 14, None, ALI), ("b", "C_{ω}", "cw", SIG, SSOFT),
                              ("a", 20, None, GLD), ("s", {"l": "+", "b": "−"}, "s3"), ("a", 14, None, ALI), ("b", "C_i", "ci", SIG, SSOFT),
                              ("a", 22, None, GLD), ("b", ("1", "L_a s + R_a"), "el"), ("a", 18, None, SIG), ("t", "oi", SIG),
                              ("a", 18, None, SIG), ("b", ("K_t", "Js"), "me"), ("a", 18, None, SIG), ("t", "ow", SIG), ("a", 18, None, SIG),
                              ("b", ("1", "s"), "in"), ("a", 18, None, SIG), ("t", "ot", SIG), ("a", 18, None, SIG)])
    o.append(s)
    o.append(FBPATH(P["oi"], P["s3"], yb, 32, SIG))
    o.append(FBPATH(P["ow"], P["s2"], yb, 52, SIG))
    o.append(FBPATH(P["ot"], P["s1"], yb, 72, SIG))
    xm = (P["me"][0] + P["me"][1]) / 2
    o.append(ARR(xm, yb - 44, xm, yb - 23, c=PUR, lw=1.6))
    o.append(TX(xm + 6, yb - 34, "τ_L", "start", 10, PUR, True, halo=True))
    o.append(TX(16, yb - 9, "θ_r", "start", 10, MUT, True))
    o.append(TX((P["el"][1] + P["oi"]) / 2, yb - 9, "i", "middle", 10, SIG, True, halo=True))
    o.append(TX((P["ow"] + P["in"][0]) / 2, yb - 9, "ω_m", "middle", 10, SIG, True, halo=True))
    o.append(TX(xe - 2, yb - 9, "θ_m", "end", 10, SIG, True))
    o.append(T(14, yb + 94, "例の値: 角度は比例 200 /s、角速度は PI 0.5 A/(rad/s)・4 ms、電流は PI 5 V/A・0.5 ms", "start", 9.5, MUT))
    # (c) ヒータ
    yc = 386
    o.append(T(14, yc - 44, "(c) ヒータ: 温度 → 電力の 2 段", "start", 11.5, INK, True))
    s, P, xe = CHAIN(18, yc, [("a", 24, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 16, None, ALI), ("b", "温度の PI", "ct", SIG, SSOFT),
                              ("a", 64, None, GLD), ("s", {"l": "+", "b": "−"}, "s2"), ("a", 16, None, ALI), ("b", "電力の制御器", "cq", SIG, SSOFT),
                              ("a", 66, None, GLD), ("b", "ヒータ", "ht"), ("a", 30, None, SIG), ("t", "oq", SIG), ("a", 24, None, SIG),
                              ("b", "板", "pl"), ("a", 34, None, SIG), ("t", "ot", SIG), ("a", 20, None, SIG)])
    o.append(s)
    o.append(FBPATH(P["oq"], P["s2"], yc, 30, SIG, lab="測った電力"))
    o.append(FBPATH(P["ot"], P["s1"], yc, 58, SIG))
    xh = (P["ht"][0] + P["ht"][1]) / 2
    o.append(ARR(xh, yc - 40, xh, yc - 17, c=PUR, lw=1.6))
    o.append(TX(xh + 6, yc - 30, "電源の電圧 V", "start", 10, PUR, True, halo=True))
    o.append(TX((P["ct"][1] + P["s2"] - R) / 2, yc - 9, "電力の指令", "middle", 9.5, GLD, True, halo=True))
    o.append(TX((P["cq"][1] + P["ht"][0]) / 2, yc - 9, "デューティ比", "middle", 9.5, GLD, True, halo=True))
    o.append(TX(xe - 2, yc - 9, "θ", "end", 10, SIG, True))
    o.append(T((P["pl"][0] + P["pl"][1]) / 2, yc + 30, "むだ時間 20 s", "middle", 9.5, MUT))
    return SVG(700, yc + 76, o, "カスケード制御。(a) 対象を途中の量 y<sub>2</sub> で分け、y<sub>2</sub> を目標値 r<sub>2</sub> に合わせる内側のループを作る。外側の制御器 C<sub>1</sub> は、制御量 y<sub>1</sub> の偏差から r<sub>2</sub> を決める。内側に入る外乱 d<sub>2</sub> は、外側に届く前に内側のループが打ち消す。(b) モータの位置決めでは、電流・角速度・角度を測り、3 つのループを入れ子にする。負荷トルク τ<sub>L</sub> は電流と角速度の間に入る。(c) ヒータでは、電力を測って指令に合わせるループを内側に置く。電源の電圧が変わっても、温度が動く前に電力が戻る。")


F["e14_casc_bd"] = _f14_casc_bd_fig()


# =====================================================================
# 4 節: 内側に入る外乱 — モータの負荷トルク・拘束・ヒータの電源
# =====================================================================
def _f14_casc_dist_fig():
    o = []
    tl = lambda t: 0.01 if t >= 0.05 else 0.0
    A = _f14_casc("pid", tEnd=0.6, h=2e-5, tau=tl, every=25)
    B = _f14_casc("ps", tEnd=0.6, h=2e-5, tau=tl, every=25)
    C_ = _f14_casc("psc", tEnd=0.6, h=1e-5, tau=tl, every=50)
    o.append(T(14, 18, "(a) 止めている軸に、0.05 s に負荷トルク 0.01 N·m", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 300, 128, (0, 0.6), (-1.15, 0.15), [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], [-1, -0.5, 0], yl="角度のずれ [rad]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(p.X(0.05), p.y, p.X(0.05), p.y + p.h, c=PUR, lw=1.1, dash="3 3"))
    o.append(p.line(_f14_pts(A["t"], A["th"]), c=ALI, lw=2))
    o.append(p.line(_f14_pts(B["t"], B["th"]), c=SIG, lw=2))
    o.append(p.line(_f14_pts(C_["t"], C_["th"]), c=GRN, lw=2.2))
    ma, mb, mc = float(A["th"].min()), float(B["th"].min()), float(C_["th"].min())
    ia = int(_f14_np.argmin(A["th"])); ib = int(_f14_np.argmin(B["th"]))
    o.append(T(p.X(0.235), p.Y(-1.06), "角度の PID だけ: %s rad" % _f14_f(ma, 2), "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(B["t"][ib]) + 8, p.Y(mb) + 12, "2 段: %s rad" % _f14_f(mb, 2), "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.59), p.Y(0.07), "3 段: %s rad（この目盛では見えない）" % _f14_f(mc, 4), "end", 9.5, GRN, True, halo=True))
    # (b) 拘束
    o.append(T(390, 18, "(b) 目標を 1 rad 先にして、軸を止められる", "start", 11, INK, True))
    q, ax = _f14_plot(438, 32, 250, 128, (0, 3), (0, 7), [0, 1, 2, 3], [0, 2, 4, 6], yl="電流 i [A]", xl="時間 t [s]")
    o.append(ax)
    Ab = _f14_casc("pid", tEnd=3.0, h=1e-4, r=lambda t: 1.0, J=1e3, every=100)
    Cb = _f14_casc("psc", tEnd=0.05, h=1e-5, r=lambda t: 1.0, J=1e3, ilim=1.0, every=50)
    tc = list(Cb["t"]) + [3.0]; ic = list(Cb["i"]) + [float(Cb["i"][-1])]
    o.append(W(q.X(0), q.Y(6), q.X(3), q.Y(6), c=MUT, lw=1, dash="4 3"))
    o.append(T(q.X(0.05), q.Y(6) - 5, "拘束電流 12 V ÷ 2 Ω = 6 A", "start", 9.5, MUT, halo=True))
    o.append(q.line(_f14_pts(Ab["t"], Ab["i"]), c=ALI, lw=2))
    o.append(q.line(list(zip(tc, ic)), c=GRN, lw=2.2))
    o.append(T(q.X(0.75), q.Y(4.3), "角度の PID だけ", "middle", 9.5, ALI, True, halo=True))
    o.append(T(q.X(2.95), q.Y(1) + 14, "3 段（電流の指令を 1 A で切る）", "end", 9.5, GRN, True, halo=True))
    # (c) ヒータ
    yc = 222
    o.append(T(14, yc, "(c) ヒータの電源が 200 s に 100 V → 90 V（温度の PI は 10 W/K・160 s）", "start", 11, INK, True))
    H0 = _f14_heater(False, tEnd=1000)
    H1 = _f14_heater(True, tEnd=1000)
    r_, ax = _f14_plot(62, yc + 14, 300, 110, (0, 1000), (-0.65, 0.15), [0, 200, 400, 600, 800, 1000], [-0.6, -0.4, -0.2, 0], yl="温度のずれ [K]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(r_.X(200), r_.y, r_.X(200), r_.y + r_.h, c=PUR, lw=1.1, dash="3 3"))
    o.append(r_.line(_f14_pts(H0["t"], H0["y"]), c=ALI, lw=2))
    o.append(r_.line(_f14_pts(H1["t"], H1["y"]), c=GRN, lw=2.2))
    o.append(T(r_.X(300), r_.Y(float(H0["y"].min())) + 4, "温度の PI だけ: %s K" % _f14_f(float(H0["y"].min()), 2), "start", 9.5, ALI, True, halo=True))
    o.append(T(r_.X(990), r_.Y(0.06), "電力のループあり: %s K" % _f14_f(float(H1["y"].min()), 2), "end", 9.5, GRN, True, halo=True))
    s_, ax = _f14_plot(438, yc + 14, 250, 110, (0, 1000), (18, 40), [0, 200, 400, 600, 800, 1000], [20, 28, 36], yl="電力 [W]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(s_.X(200), s_.y, s_.X(200), s_.y + s_.h, c=PUR, lw=1.1, dash="3 3"))
    o.append(s_.line(_f14_pts(H0["t"], H0["p"]), c=ALI, lw=1.8))
    o.append(s_.line(_f14_pts(H1["t"], H1["p"]), c=GRN, lw=2))
    o.append(T(s_.X(210), s_.Y(21.5), "実際の電力が 22.7 W に", "start", 9.5, ALI, True, halo=True))
    o.append(T(s_.X(990), s_.Y(30.5), "電力のループが 28 W に戻す", "end", 9.5, GRN, True, halo=True))
    return SVG(700, yc + 168, o, "内側のループの効き目。(a) モータの角度を止めておく所に負荷トルクが加わる。角度の PID だけでは 1.05 rad ずれるが、角速度のループを内側に置くと 0.20 rad、さらに電流のループを置くと 0.002 rad で済む（巻線のインダクタンスを含む式、電源 12 V）。(b) 軸が止められると、角度の PID の積分がたまり、電流は拘束電流 6 A に向かう。カスケードでは電流の指令を上限で切れる。(c) 電源の電圧が下がるとヒータの電力が 0.81 倍になる。温度の PI だけでは、むだ時間の後に気づいて 0.55 K 下がるが、電力のループを内側に置くと、温度が動く前に電力が戻る。")


F["e14_casc_dist"] = _f14_casc_dist_fig()


# =====================================================================
# 4 節: 内側と外側の速さの比
# =====================================================================
def _f14_casc_sep_fig():
    o = []
    o.append(TX(14, 18, "(a) 角度を 0.1 rad 変える（2 段、角速度のループは 1/T_2 = 100 /s）", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 330, 150, (0, 0.4), (0, 1.4), [0, 0.1, 0.2, 0.3, 0.4], [0, 0.5, 1], yl="角度 ÷ 0.1 rad", xl="時間 t [s]")
    o.append(ax)
    o.append(W(p.X(0), p.Y(1), p.X(0.4), p.Y(1), c=MUT, lw=1, dash="5 3"))
    cs = [(100.0, ALI, "1"), (50.0, GLD, "2"), (25.0, GRN, "4"), (10.0, SIG, "10")]
    res = []
    for K1, c, lab in cs:
        Rr = _f14_casc("ps", tEnd=0.4, h=2e-5, r=lambda t: 0.1, Kth=K1, every=25)
        y = Rr["th"] / 0.1
        o.append(p.line(_f14_pts(Rr["t"], y), c=c, lw=2))
        res.append((K1, c, lab, max(0.0, (float(y.max()) - 1) * 100)))
    for k, (K1, c, lab, mp) in enumerate(res):
        o.append(TX(p.X(0.39), p.Y(0.52) + k * 15, "K_{P1} = %g /s（%s 倍）: %s %%" % (K1, lab, _f14_f(mp, 1)), "end", 9.5, c, True, halo=True))
    # (b) 減衰比
    o.append(T(430, 18, "(b) 減衰比 ζ = (1/2)√(内側の速さ ÷ 外側)", "start", 11, INK, True))
    q = Plot(470, 32, 218, 150, (0.5, 20), (0, 2.4), xlog=True)
    o.append(q.axes(xl="内側の速さ 1/T_2 ÷ 外側の K_{P1}", yl="減衰比 ζ", xt=[0.5, 1, 2, 4, 10, 20], yt=[0, 0.5, 1, 1.5, 2],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9))
    xs = _f14_np.logspace(math.log10(0.5), math.log10(20), 120)
    o.append(q.line([(x, 0.5 * math.sqrt(x)) for x in xs], c=SIG, lw=2))
    o.append(W(q.X(0.5), q.Y(1), q.X(20), q.Y(1), c=GRN, lw=1.1, dash="4 3"))
    o.append(T(q.X(0.55), q.Y(1) - 5, "ζ = 1（振動しない境目）", "start", 9, GRN, True, halo=True))
    for K1, c, lab, mp in res:
        x = 100.0 / K1
        o.append(D(q.X(x), q.Y(0.5 * math.sqrt(x)), c, 4))
    o.append(RECT(q.X(3), q.y, q.X(10) - q.X(3), q.h, 0, GSOFT, "none", 0, op=0.6))
    o.append(T(q.X(5.5), q.y + q.h - 6, "目安 3〜10 倍", "middle", 9, GRN, True, halo=True))
    return SVG(700, 226, o, "内側のループの速さと外側の応答。(a) モータの 2 段のカスケードで、角速度のループ（閉ループの時定数 T_2 = 0.01 s）はそのままにして、外側の角度の比例ゲイン K_P1 を変える。内側が外側の 1 倍・2 倍しか速くないと行き過ぎ、4 倍以上なら行き過ぎない。(b) 内側を一次遅れとみなした式の減衰比。点は (a) の 4 つの場合で、(a) の行き過ぎ量は、この減衰比の二次遅れの値（16.3・4.3・0・0 %）とほぼ一致する。")


F["e14_casc_sep"] = _f14_casc_sep_fig()


# =====================================================================
# 5 節: スミス予測器の線図
# =====================================================================
def _f14_smith_bd_fig():
    o = []
    R = 15
    o.append(T(14, 18, "(a) スミス予測器: モデルで「むだ時間の前の制御量」を作って戻す", "start", 11.5, INK, True))
    y = 66
    s, P, xe = CHAIN(18, y, [("a", 40, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, None, ALI), ("b", "C(s)", "c", SIG, SSOFT),
                             ("a", 40, None, GLD), ("t", "bu", GLD), ("a", 70, None, GLD), ("b", "P_0(s)e^{−Ls}", "p"),
                             ("a", 216, None, SIG), ("t", "by", SIG), ("a", 40, None, SIG)])
    o.append(s)
    o.append(TX(20, y - 9, "r", "start", 10, MUT, True))
    o.append(TX((P["c"][1] + P["bu"]) / 2, y - 9, "u", "middle", 10, GLD, True))
    o.append(TX(xe - 2, y - 9, "y", "end", 10, SIG, True))
    o.append(T((P["p"][0] + P["p"][1]) / 2, y + 30, "本当の対象", "middle", 9.5, MUT))
    # モデルの行
    ym = 156
    o.append(T(P["bu"] + 30, ym - 30, "モデル（制御器の中で計算する）", "start", 9.5, TEA, True))
    o.append(W(P["bu"], y, P["bu"], ym, c=GLD, lw=1.6))
    xb1 = P["bu"] + 26
    o.append(ARR(P["bu"], ym, xb1, ym, c=GLD, lw=1.6))
    bx, wb = _f14_tbox(xb1, ym, "P~_0(s)", None, TEA, TSOFT)
    o.append(bx)
    xbr = xb1 + wb + 44
    o.append(W(xb1 + wb, ym, xbr, ym, c=TEA, lw=1.6))
    o.append(D(xbr, ym, TEA, 3.6))
    o.append(_f14_tt((xb1 + wb + xbr) / 2, ym - 8, "y~_0", "middle", 10, TEA, True))
    xb2 = xbr + 26
    bx, wd = _f14_tbox(xb2, ym, "e^{−L̃s}", None, TEA, TSOFT)
    o.append(bx)
    o.append(ARR(xbr, ym, xb2, ym, c=TEA, lw=1.6))
    xsa = P["by"] - 70
    o.append(ARR(xb2 + wd, ym, xsa - R, ym, c=TEA, lw=1.6))
    o.append(_f14_tt((xb2 + wd + xsa - R) / 2, ym - 8, "y~_0(t − L~)", "middle", 10, TEA, True, halo=True))
    o.append(SUMJ(xsa, ym, {"l": "−", "b": "+"}))
    o.append(W(xbr, ym, xbr, ym + 46, xsa, ym + 46, c=TEA, lw=1.6))
    o.append(ARR(xsa, ym + 46, xsa, ym + R, c=TEA, lw=1.6))
    # y_p を作る
    yb = 262
    xsb = xsa + 34
    o.append(W(P["by"], y, P["by"], yb, c=SIG, lw=1.6))
    o.append(ARR(P["by"], yb, xsb + R, yb, c=SIG, lw=1.6))
    o.append(SUMJ(xsb, yb, {"r": "+", "t": "+"}))
    o.append(W(xsa + R, ym, xsb, ym, c=TEA, lw=1.6))
    o.append(ARR(xsb, ym, xsb, yb - R, c=TEA, lw=1.6))
    o.append(_f14_tt(xsb - 8, yb - 28, "y~_0 − y~_0(t − L~)", "end", 10, TEA, True, halo=True))
    o.append(W(xsb - R, yb, P["s1"], yb, c=GLD, lw=1.6))
    o.append(ARR(P["s1"], yb, P["s1"], y + R, c=GLD, lw=1.6))
    o.append(_f14_tt((P["s1"] + xsb) / 2 - 60, yb - 8, "y_p = y + y~_0 − y~_0(t − L~)", "middle", 10, GLD, True, halo=True))
    # (b) 等価な形
    y2 = 350
    o.append(T(14, y2 - 40, "(b) モデルが正しいとき: むだ時間が輪の外へ出る", "start", 11.5, INK, True))
    s, P2, xe2 = CHAIN(18, y2, [("a", 40, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, None, ALI), ("b", "C(s)", "c", SIG, SSOFT),
                                ("a", 50, None, GLD), ("b", "P_0(s)", "p0"), ("a", 50, None, SIG), ("t", "b0", SIG), ("a", 40, None, SIG),
                                ("b", "e^{−Ls}", "dl", ALI, ASOFT), ("a", 50, None, SIG)])
    o.append(s)
    o.append(FBPATH(P2["b0"], P2["s1"], y2, 32, GLD))
    o.append(_f14_tt((P2["b0"] + P2["s1"]) / 2, y2 + 26, "y_p = y~_0", "middle", 9.5, GLD, True, halo=True))
    o.append(TX(20, y2 - 9, "r", "start", 10, MUT, True))
    o.append(TX(xe2 - 2, y2 - 9, "y", "end", 10, SIG, True))
    o.append(TX(xe2 + 16, y2 - 6, "特性方程式 1 + P_0(s)C(s) = 0", "start", 10, INK, True))
    o.append(TX(xe2 + 16, y2 + 12, "にむだ時間が無い", "start", 10, INK, True))
    return SVG(700, y2 + 48, o, "(a) スミス予測器。制御器が出した操作量 u をモデルにも入れ、むだ時間の無いモデルの出力 ỹ<sub>0</sub> と、それをモデルのむだ時間 L̃ だけ遅らせたものの差を、測った値 y に足して戻す（記号の上の波線はモデルの値）。(b) モデルが正しければ y = ỹ<sub>0</sub>(t − L) なので、戻す値 y<sub>p</sub> は ỹ<sub>0</sub> そのもの、つまりむだ時間の前の制御量になる。むだ時間は輪の外へ出て、C(s) はむだ時間の無い P<sub>0</sub>(s) に合わせて決められる。")


F["e14_smith_bd"] = _f14_smith_bd_fig()


# =====================================================================
# 5 節: 温度の板で比べる（目標値・外乱・予測器の中の信号）
# =====================================================================
def _f14_smith_resp_fig():
    o = []
    cs = [("1 自由度 (a) PI 10 W/K・500 s", dict(KP=10, TI=500), MUT, None),
          ("1 自由度 (b) PI 10 W/K・160 s", dict(KP=10, TI=160), ALI, None),
          ("スミス予測器 λ = 20 s（20 W/K・500 s）", dict(KP=20, TI=500, smith=True), SIG, None),
          ("スミス予測器 λ = 10 s（40 W/K・500 s）", dict(KP=40, TI=500, smith=True), GRN, None)]
    o.append(T(14, 18, "(a) 目標値を 1 K 上げる", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 270, 120, (0, 400), (0, 1.3), [0, 100, 200, 300, 400], [0, 0.5, 1], yl="温度のずれ [K]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(p.X(0), p.Y(1), p.X(400), p.Y(1), c=MUT, lw=1, dash="5 3"))
    o.append(T(380, 18, "(b) ヒータの電力に −10 W の外乱", "start", 11, INK, True))
    q, ax = _f14_plot(418, 32, 270, 120, (0, 2000), (-1.0, 0.15), [0, 500, 1000, 1500, 2000], [-1, -0.5, 0], xl="時間 t [s]")
    o.append(ax)
    for k, (lab, kw, c, dash) in enumerate(cs):
        A = _f14_plate(r=lambda t: 1.0, tEnd=400, every=5, **kw)
        B = _f14_plate(d=lambda t: -10.0, tEnd=4000, every=10, **kw)
        mp, ts = _f14_stepm(A)
        iae = _f14_iae(B)
        o.append(p.line(_f14_pts(A["t"], A["y"]), c=c, lw=2 if c != MUT else 1.6))
        o.append(q.clip(_f14_pts(B["t"], B["y"]), c=c, lw=2 if c != MUT else 1.6))
        o.append(LEGL(14, 202 + k * 15, [(c, dash, lab)], 9.5, 10))
        o.append(T(330, 202 + k * 15, "目標値: %s %%・%s s" % (_f14_f(mp, 1), _f14_g(ts, 3)), "start", 9.5, c if c != MUT else INK, True))
        o.append(T(500, 202 + k * 15, "外乱: 最大 %s K・IAE %s K·s" % (_f14_f(-float(B["y"].min()), 2), _f14_g(iae, 3)), "start", 9.5, c if c != MUT else INK, True))
    # (c) 予測器の中の信号（λ = 10 s、外乱）
    yc = 278
    o.append(TX(14, yc, "(c) λ = 10 s の外乱への応答: 制御器が見る y_p と、本当の y", "start", 11, INK, True))
    S = _f14_plate(KP=40, TI=500, smith=True, d=lambda t: -10.0, tEnd=1500, every=5)
    SL = _f14_plate(KP=40, TI=500, smith=True, d=lambda t: -10.0, tEnd=8000, every=10)
    z, ax = _f14_plot(62, yc + 14, 626, 110, (0, 1500), (-0.8, 0.12), [0, 250, 500, 750, 1000, 1250, 1500], [-0.75, -0.5, -0.25, 0], yl="[K]", xl="時間 t [s]")
    o.append(ax)
    pts = _f14_pts(S["t"], S["y"]); ptp = _f14_pts(S["t"], S["yp"])
    o.append(PL([(z.X(a_), z.Y(b_)) for a_, b_ in ptp] + [(z.X(a_), z.Y(b_)) for a_, b_ in pts[::-1]], c="none", lw=0, fill=GSOFT, op=0.9))
    o.append(PL([(z.X(ptp[0][0]), z.Y(0))] + [(z.X(a_), z.Y(b_)) for a_, b_ in ptp] + [(z.X(ptp[-1][0]), z.Y(0))], c="none", lw=0, fill=GOSOFT, op=0.9))
    o.append(z.line(pts, c=SIG, lw=2))
    o.append(z.line(ptp, c=GLD, lw=1.8, dash="5 3"))
    ap = float(_f14_np.trapezoid(SL["yp"], SL["t"])); ay = float(_f14_np.trapezoid(SL["y"], SL["t"]))
    o.append(TX(z.X(70), z.Y(-0.12), "y_p（制御器が見る値）: 面積 %s K·s = d/K_I" % _f14_g(ap, 3), "start", 9.5, GLD, True, halo=True))
    o.append(TX(z.X(330), z.Y(-0.5), "y（本当の温度）: 面積 %s K·s。差の %s K·s = KLd" % (_f14_g(ay, 3), _f14_g(ay - ap, 3)), "start", 9.5, SIG, True, halo=True))
    return SVG(700, yc + 168, o, "温度の板をスミス予測器で制御する（モデルは正しい）。(a) 目標値への応答は e<sup>−20s</sup>/(λs + 1) そのもので、行き過ぎず、1 自由度の PI より速い。(b) 外乱には、λ = 10 s でも 1 自由度の (b) より偏差の面積が大きく、板の時定数 500 s でゆっくり戻る。(c) 制御器が見る y<sub>p</sub>（金色の破線）は早く 0 に近づくが、本当の温度 y（青）は遅れて戻る。2 つの差の面積が KLd = 250 K·s である（面積は 8000 s までの数値計算）。")


F["e14_smith_resp"] = _f14_smith_resp_fig()


# =====================================================================
# 5 節: むだ時間のずれ — 応答と安定な範囲の地図
# =====================================================================
def _f14_smith_map(lams, Ls, Lm=20.0, nw=4000):
    """λ ごと・本当のむだ時間ごとに、閉ループが不安定か（1 + G の偏角が回るか）。G = (e^{−Ls} − e^{−Lm s})/(λs + 1)。
    |G| < 1 になる ω > 2/λ より先は −1 を回れないので、そこまでを細かく調べる。"""
    np = _f14_np
    res = np.zeros((len(lams), len(Ls)), dtype=bool)
    Lv = np.asarray(Ls, dtype=float)[:, None]
    for i, lam in enumerate(lams):
        w = np.linspace(1e-6, 2.5 / lam, nw)[None, :]
        G = (np.exp(-1j * w * Lv) - np.exp(-1j * w * Lm)) / (1j * w * lam + 1)
        ph = np.unwrap(np.angle(1 + G), axis=1)
        res[i] = np.abs(ph[:, -1] - ph[:, 0]) > np.pi
    return res


def _f14_smith_robust_fig():
    o = []
    o.append(T(14, 18, "(a) 目標値を 1 K 上げる（モデルのむだ時間 20 s）", "start", 11, INK, True))
    p, ax = _f14_plot(62, 32, 270, 140, (0, 600), (-0.5, 2.0), [0, 100, 200, 300, 400, 500, 600], [0, 0.5, 1, 1.5, 2], yl="温度のずれ [K]", xl="時間 t [s]")
    o.append(ax)
    o.append(W(p.X(0), p.Y(1), p.X(600), p.Y(1), c=MUT, lw=1, dash="5 3"))
    cs = [(10.0, 20.0, GRN, None, "λ = 10 s、本当のむだ時間 20 s"), (10.0, 30.0, SIG, None, "λ = 10 s、本当のむだ時間 30 s"),
          (10.0, 45.0, GLD, None, "λ = 10 s、本当のむだ時間 45 s"), (5.0, 10.0, ALI, None, "λ = 5 s、本当のむだ時間 10 s（短い）")]
    for k, (lam, Lt, c, dash, lab) in enumerate(cs):
        Rr = _f14_plate(KP=500 / (1.25 * lam), TI=500, smith=True, Lt=Lt, r=lambda t: 1.0, tEnd=600, every=2)
        t_, y_ = Rr["t"], Rr["y"]
        bad = _f14_np.where(_f14_np.abs(y_) > 2.5)[0]
        if len(bad):
            t_, y_ = t_[:bad[0] + 1], y_[:bad[0] + 1]
        o.append(p.clip(_f14_pts(t_, y_), c=c, lw=1.9 if c != ALI else 1.1, dash=dash))
        o.append(LEGL(14, 222 + k * 15, [(c, dash, lab)], 9.5, 10))
    o.append(T(p.X(200), p.Y(1.75), "振れが大きくなり続ける", "start", 9.5, ALI, True, halo=True))
    # (b) 地図
    o.append(T(380, 18, "(b) 安定な組（白）と不安定な組（赤）", "start", 11, INK, True))
    lams = list(_f14_np.exp(_f14_np.linspace(math.log(2), math.log(40), 34)))
    Ls = list(range(0, 71))
    M = _f14_smith_map(lams, Ls)
    q = Plot(430, 32, 258, 150, (0, 70), (2, 40), ylog=True)
    rr = (lams[1] / lams[0]) ** 0.5
    for i in range(len(lams)):
        y0 = lams[i] / rr; y1 = lams[i] * rr
        for j in range(len(Ls)):
            if M[i, j]:
                o.append(RECT(q.X(max(0, Ls[j] - 0.5)), q.Y(min(40, y1)), q.X(min(70, Ls[j] + 0.5)) - q.X(max(0, Ls[j] - 0.5)),
                              q.Y(max(2, y0)) - q.Y(min(40, y1)), 0, ASOFT, "none", 0))
    o.append(q.axes(xl="本当のむだ時間 L [s]", yl="λ [s]", xt=[0, 10, 20, 30, 40, 50, 60, 70], yt=[2, 5, 10, 20, 40],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v, sz=9))
    ys = list(_f14_np.exp(_f14_np.linspace(math.log(2), math.log(40), 60)))
    o.append(q.line([(max(0.0, 20 - lam), lam) for lam in ys], c=GRN, lw=1.8))
    o.append(q.line([(min(70.0, 20 + lam), lam) for lam in ys], c=GRN, lw=1.8))
    o.append(_f14_tt(q.X(20), q.Y(24), "|L − L~| ≤ λ", "middle", 9.5, GRN, True, halo=True))
    o.append(W(q.X(55), q.y, q.X(55), q.y + q.h, c=MUT, lw=1.2, dash="4 3"))
    o.append(T(q.X(55) + 3, q.Y(14), "PI (b)", "start", 9, MUT, True, halo=True))
    o.append(T(q.X(55) + 3, q.Y(14) + 12, "の限界", "start", 9, MUT, True, halo=True))
    for lam, Lt, c, dash, lab in cs:
        o.append(D(q.X(Lt), q.Y(lam), c, 3.8))
    return SVG(700, 284, o, "モデルのむだ時間（L̃ = 20 s）が本当のむだ時間 L と違うとき。(a) λ = 10 s では、本当のむだ時間が 30 s・45 s でも収まるが、λ = 5 s では、本当のむだ時間が 10 s と短い側に外れただけで振れが大きくなり続ける（途中で切って描いた）。(b) λ と本当のむだ時間の組で、閉ループが安定か（ナイキストの安定判別法で数値的に判定）。緑の線の間は、本文で導いた十分な条件 |L − L̃| ≤ λ を満たす。λ が小さいと、モデルより短い側にも長い側にも不安定な組がある。破線は、1 節の (b) の PI が安定でいられる限界の 55 s。点は (a) の 4 つの場合。")


F["e14_smith_robust"] = _f14_smith_robust_fig()


# =====================================================================
# 6 節: 構成の選び方
# =====================================================================
def _f14_choose_fig():
    o = []
    o.append(T(14, 18, "何に困っているかから、構成を選ぶ", "start", 11.5, INK, True))

    def box(x, y, w, h, lines, c, fill, bold=True, sz=10):
        o.append(RECT(x, y, w, h, 7, fill, c, 1.4))
        n = len(lines)
        for k, s in enumerate(lines):
            o.append(TX(x + w / 2, y + h / 2 + (k - (n - 1) / 2) * (sz + 3) + sz * 0.36, s, "middle", sz, INK if not bold else c, bold))

    def q(x, y, w, h, s, c=MUT):
        o.append(RECT(x, y, w, h, h / 2, SCR, c, 1.2, dash="4 3"))
        o.append(TX(x + w / 2, y + h / 2 + 3.6, s, "middle", 9.5, INK))

    rows = [44, 108, 172, 252]
    xl, wl = 14, 168
    box(xl, rows[0], wl, 40, ["外乱を抑えると、", "目標値に行き過ぎる"], MUT, PAN, False)
    box(xl, rows[1], wl, 40, ["決まった形で動く目標値に", "遅れる"], MUT, PAN, False)
    box(xl, rows[2], wl, 64, ["外乱で制御量がずれる"], MUT, PAN, False)
    box(xl, rows[3], wl, 40, ["むだ時間が長くて", "速くできない"], MUT, PAN, False)
    xr, wr = 520, 166
    box(xr, rows[0], wr, 40, ["2 自由度制御", "前置フィルタ（1 節）"], GRN, GSOFT)
    box(xr, rows[1], wr, 40, ["目標値フィードフォワード", "（2 節）"], GRN, GSOFT)
    box(xr, rows[2] - 6, wr, 30, ["外乱フィードフォワード（3 節）"], GRN, GSOFT)
    box(xr, rows[2] + 32, wr, 30, ["カスケード制御（4 節）"], GLD, GOSOFT)
    box(xr, rows[3] - 6, wr, 30, ["スミス予測器（5 節）"], GLD, GOSOFT)
    box(xr, rows[3] + 32, wr, 30, ["PI ＋ 2 自由度（1・2 節）"], GRN, GSOFT)
    # 問い
    xq, wq = 226, 250
    o.append(ARR(xl + wl, rows[0] + 20, xr, rows[0] + 20, c=MUT, lw=1.4))
    o.append(T((xl + wl + xr) / 2, rows[0] + 14, "目標値の通り道だけを変える", "middle", 9.5, MUT, halo=True))
    q(xq, rows[1] + 6, wq, 28, "対象のモデルがあるか")
    o.append(ARR(xl + wl, rows[1] + 20, xq, rows[1] + 20, c=MUT, lw=1.4))
    o.append(ARR(xq + wq, rows[1] + 20, xr, rows[1] + 20, c=GRN, lw=1.4))
    o.append(T((xq + wq + xr) / 2, rows[1] + 14, "ある", "middle", 9.5, GRN, True, halo=True))
    q(xq, rows[2] - 5, wq, 28, "外乱そのものを測れるか")
    o.append(ARR(xl + wl, rows[2] + 9, xq, rows[2] + 9, c=MUT, lw=1.4))
    o.append(ARR(xq + wq, rows[2] + 9, xr, rows[2] + 9, c=GRN, lw=1.4))
    o.append(T((xq + wq + xr) / 2, rows[2] + 3, "測れる", "middle", 9.5, GRN, True, halo=True))
    q(xq, rows[2] + 33, wq, 28, "外乱が通る途中の量を測れるか")
    o.append(ARR(xq + wq / 2, rows[2] + 23, xq + wq / 2, rows[2] + 33, c=MUT, lw=1.4, head=5))
    o.append(T(xq + wq / 2 + 6, rows[2] + 31, "測れない", "start", 9, MUT, halo=True))
    o.append(ARR(xq + wq, rows[2] + 47, xr, rows[2] + 47, c=GLD, lw=1.4))
    o.append(T((xq + wq + xr) / 2, rows[2] + 41, "測れる", "middle", 9.5, GLD, True, halo=True))
    q(xq, rows[3] + 6, wq, 28, "むだ時間 ≧ 時定数で、正確に分かるか")
    o.append(ARR(xl + wl, rows[3] + 20, xq, rows[3] + 20, c=MUT, lw=1.4))
    o.append(ARR(xq + wq, rows[3] + 14, xr, rows[3] + 9, c=GLD, lw=1.4))
    o.append(T((xq + wq + xr) / 2, rows[3] + 4, "はい", "middle", 9.5, GLD, True, halo=True))
    o.append(ARR(xq + wq, rows[3] + 26, xr, rows[3] + 47, c=GRN, lw=1.4))
    o.append(T((xq + wq + xr) / 2 + 6, rows[3] + 46, "いいえ", "middle", 9.5, GRN, True, halo=True))
    yl_ = 342
    o.append(RECT(14, yl_ - 10, 12, 12, 2, GSOFT, GRN, 1.2))
    o.append(T(32, yl_, "輪の外に道を足す: 閉ループの極は変わらない（安定性を確かめ直さなくてよい）", "start", 10, GRN, True))
    o.append(RECT(14, yl_ + 8, 12, 12, 2, GOSOFT, GLD, 1.2))
    o.append(T(32, yl_ + 18, "輪の形を変える: 閉ループの極が変わる（余裕を確かめ直す）", "start", 10, GLD, True))
    return SVG(700, yl_ + 28, o, "構成の選び方。左の困りごとから、右の構成へたどる。緑は輪の外に道を足す構成で、閉ループの特性方程式を変えない。金色は輪の形を変える構成で、閉ループの極が変わるので、余裕を確かめ直す。外乱も途中の量も測れないときは、フィードバックの制御器そのものを強くする（10〜13 章）。")


F["e14_choose"] = _f14_choose_fig()


# =====================================================================
# 6 節: 組み合わせた構成の例
# =====================================================================
def _f14_whole_fig():
    o = []
    R = 15
    o.append(T(14, 18, "(a) モータの位置決め: 3 段のカスケード＋目標値フィードフォワード", "start", 11.5, INK, True))
    y = 112
    s, P, xe = CHAIN(14, y, [("b", "目標の形", "tg", SIG, SSOFT), ("a", 16, None, MUT), ("t", "br", MUT), ("a", 14, None, MUT),
                             ("s", {"l": "+", "b": "−"}, "s1"), ("a", 12, None, ALI), ("b", "C_{θ}", "ct"), ("a", 14, None, GLD),
                             ("s", {"l": "+", "t": "+"}, "f1"), ("a", 12, None, GLD), ("s", {"l": "+", "b": "−"}, "s2"), ("a", 12, None, ALI),
                             ("b", "C_{ω}", "cw"), ("a", 14, None, GLD), ("s", {"l": "+", "t": "+"}, "f2"), ("a", 12, None, GLD),
                             ("s", {"l": "+", "b": "−"}, "s3"), ("a", 12, None, ALI), ("b", "C_i", "ci"), ("a", 18, None, GLD),
                             ("b", "モータ", "m"), ("a", 30, None, SIG)])
    o.append(s)
    o.append(FFPATH(P["br"], P["f1"], y, 36, GLD, box="\\dot{r}", bc=SIG, bfill=SSOFT, bh=24))
    o.append(FFPATH(P["br"] + 0.01, P["f2"], y, 72, GLD, box="J\\ddot{r}/K_t", bc=SIG, bfill=SSOFT, bh=24))
    o.append(TX(xe - 2, y - 9, "θ_m", "end", 10, SIG, True))
    # 測った量を、モータの箱の下から戻す
    m0, m1 = P["m"]
    for k, (xs_, dep, lab) in enumerate([(m0 + 14, 30, "i"), (m0 + 32, 48, "ω_m"), (m1 - 12, 66, "θ_m")]):
        xt_ = [P["s3"], P["s2"], P["s1"]][k]
        o.append(W(xs_, y + 17, xs_, y + dep, xt_, y + dep, c=SIG, lw=1.5))
        o.append(ARR(xt_, y + dep, xt_, y + R, c=SIG, lw=1.5, head=6))
        o.append(TX(xs_ + 5, y + dep - 4, lab, "start", 9.5, SIG, True, halo=True))
    # (b) 温度の板
    yb = 296
    o.append(T(14, yb - 70, "(b) 温度の板: 電力のループ＋周りの温度と目標値のフィードフォワード", "start", 11.5, INK, True))
    s, P, xe = CHAIN(14, yb, [("a", 20, None, MUT), ("t", "br", MUT), ("a", 16, None, MUT), ("b", "G_f(s)", "gf", SIG, SSOFT),
                              ("a", 16, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 14, None, ALI), ("b", "PI", "pi"),
                              ("a", 18, None, GLD), ("s", {"l": "+", "t": "+"}, "f1"), ("a", 18, None, GLD), ("s", {"l": "+", "t": "+"}, "f2"),
                              ("a", 18, None, GLD), ("b", "電力のループ", "pw"), ("a", 20, None, SIG), ("b", "板", "pl"), ("a", 30, None, SIG),
                              ("t", "ot", SIG), ("a", 20, None, SIG)])
    o.append(s)
    o.append(FFPATH(P["br"], P["f1"], yb, 44, GLD, box="Q(s)", bc=SIG, bfill=SSOFT, bh=24))
    xa = P["f2"]
    o.append(ARR(xa, yb - 34, xa, yb - R, c=GLD, lw=1.5))
    o.append(_f14_tt(xa + 6, yb - 24, "(25 − θ_a)/R~_th", "start", 9.5, GLD, True, halo=True))
    o.append(FBPATH(P["ot"], P["s1"], yb, 32, SIG))
    o.append(TX(16, yb - 9, "θ_r", "start", 10, MUT, True))
    o.append(TX(xe - 2, yb - 9, "θ", "end", 10, SIG, True))
    return SVG(700, yb + 46, o, "構成の組み合わせの例。(a) モータの位置決め装置でよく使われる形。3 段のカスケードの角速度の指令に目標値の角速度を、電流の指令に角加速度に要る電流を、フィードフォワードとして足す。(b) 温度の板では、ヒータの電力のループを内側に置き、目標値には前置フィルタ G<sub>f</sub> とフィードフォワード Q(s)、周りの温度（測った値 θ<sub>a</sub>）には熱抵抗のモデル R̃<sub>th</sub> を使った外乱のフィードフォワードを足して、PI は残りの偏差だけを受け持つ。")


F["e14_whole"] = _f14_whole_fig()
