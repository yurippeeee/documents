# -*- coding: utf-8 -*-
# 11 章 PID の調整と現場の問題 の図
import numpy as _f11_np
from scipy import signal as _f11_sg

# =====================================================================
# 補助
# =====================================================================
def _f11_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f11_g(v, d=3):
    """有効数字 d 桁（負号は −）。"""
    return (("%." + str(d) + "g") % v).replace("-", "−")


# 例の対象（制御対象 P(s) = num/den·e^{−Ls}。値はどれも例の値）
_F11_PL = {
    "plate": ([1.25], [500.0, 1.0], 20.0),                       # 温度の板 [K/W]（周りの温度との差）
    "cart": ([1.0], [1.0, 2.0], 0.1),                            # 台車の速度（測った値が 0.1 s 遅れて届く）
    "mpos": ([2e6], [1.0, 2000.0, 40000.0, 0.0], 0.0),           # モータの位置（巻線のインダクタンスを含む）[rad/V]
    "mspd": ([50.0], [0.05, 1.0], 0.0),                          # モータの角速度 [(rad/s)/V]
}


def _f11_disc(num, den, h):
    A, B, C, D = _f11_sg.tf2ss(num, den)
    Ad, Bd, _, _, _ = _f11_sg.cont2discrete((A, B, C, D), h, method="zoh")
    return Ad, Bd[:, 0], _f11_np.atleast_2d(C)[0], float(_f11_np.atleast_2d(D)[0, 0])


def _f11_sim(P, KP=0.0, TI=None, TD=0.0, N=10.0, b=1.0, dmode="y", tEnd=1.0, n=20000, r=0.0, d=None, noise=None,
             umin=None, umax=None, aw="none", Tt=None, u0=0.0, I0=None, manual=None, track="none",
             gains=None, gin=True, gbump=False, relay=None, every=None):
    """フィードバック系を刻み h = tEnd/n で数値計算する（共通部品 SIMLOOP と同じ約束: 対象は零次ホールドで離散化し、
    むだ時間は操作量（外乱を足したもの）を刻みの数だけ遅らせる。Y = P(U + D)）。SIMLOOP に無い次のものを扱う。
    制御器は標準形の PID: P の分 K_P(b r − y_m)、I の分 I（積分の中にゲインを入れて足す）、D の分は不完全微分
    T_D s/(1 + (T_D/N)s) を後退差分で（dmode="y" なら測定値の微分、"e" なら偏差の微分）。y_m は制御量に観測ノイズを足したもの。
    umin・umax: 飽和。aw: "none"（対策なし）・"clamp"（張り付いて外へ向かう間は積分しない）・"back"（逆算して戻す。時定数 Tt）。
    manual(t): 値を返す間は手動（操作量をその値にする）。track: "none"（手動の間も積分はそのまま）・"init"（自動に戻す時刻に
    操作量が続くように積分を決め直す）・"track"（手動の間ずっと、積分を操作量に合わせ続ける）。
    gains(t): (K_P, T_I, T_D) を返すと、その時刻からゲインを変える。gin=False なら I の分を (K_P/T_I)∫e dt で作る（ゲインを
    変えると I の分が跳ねる形）。gbump=True なら K_P を変えたとき P の分の跳ねを積分で打ち消す。
    relay=(h, ε, u_b): 制御器の代わりにリレー（偏差が ε を越えたら u_b + h、−ε を下回ったら u_b − h）。
    u0: 始めに操作量 u0 で落ち着いているとする（対象の状態とむだ時間の中身を u0 にそろえる）。
    返り値: 辞書（t, y, ym, u（実際の操作量）, uc（制御器が計算した値）, P, I, D, e）。"""
    np = _f11_np
    num, den, L = P
    h = tEnd / n
    ev = every or max(1, int(round(n / 1000)))
    Ad, Bd, Cp, Dp = _f11_disc(num, den, h)
    nd = int(round(L / h))
    xp = _f11_np.zeros(Ad.shape[0])
    if u0:
        xp = _f11_np.linalg.solve(_f11_np.eye(Ad.shape[0]) - Ad, Bd * u0)
    buf = _f11_np.full(max(1, nd), float(u0)); bi = 0
    rf = r if callable(r) else (lambda t, _v=r: _v)
    kp, ti, td = KP, TI, TD
    I = I0 if I0 is not None else None
    S = 0.0                      # gin=False のときの ∫e dt
    Df, sp = 0.0, None
    rs = 1                       # リレーの向き
    was_man = False
    out = {k: [] for k in ("t", "y", "ym", "u", "uc", "P", "I", "D", "e")}
    ua = float(u0)
    for k in range(n + 1):
        t = k * h
        if nd:
            ua = buf[bi]
        y = float(Cp @ xp)
        ym = y + (noise(t, k) if noise else 0.0)
        rr = rf(t)
        e = rr - ym
        if gains is not None:
            g = gains(t)
            if g is not None and (g[0] != kp or g[1] != ti or g[2] != td):
                if gbump and I is not None:
                    I += (kp - g[0]) * (b * rr - ym)
                kp, ti, td = g
                if not gin and ti:
                    I = kp / ti * S
        if relay is not None:
            hh, eps, ub = relay
            eps = max(eps, 1e-9)          # 偏差がちょうど 0 のときは向きを変えない（丸めの誤差で始めの向きが変わらないように）
            if e > eps:
                rs = 1
            elif e < -eps:
                rs = -1
            uc = ub + rs * hh; u = uc; Pp = 0.0; Df = 0.0; mv = None
        else:
            Pp = kp * (b * rr - ym)
            if td:
                Tf = td / N
                sig = -ym if dmode == "y" else e
                if sp is None:
                    sp = sig
                Df = Tf / (Tf + h) * Df + kp * td / (Tf + h) * (sig - sp)
                sp = sig
            else:
                Df = 0.0
            if I is None:            # 始めの積分: 操作量 u0 で落ち着いていた状態（偏差 0）から続くように
                I = float(u0) if ti else 0.0
            if k == 0 and not gin and ti and kp:
                S = I * ti / kp
            uc = Pp + I + Df
            mv = manual(t) if manual is not None else None
            if mv is not None:
                u = mv
            else:
                if was_man and track == "init":      # 自動に戻す刻み: 操作量が続くように積分を決め直す
                    I = u_prev - Pp - Df; uc = u_prev
                u = uc
            if umax is not None and u > umax:
                u = umax
            if umin is not None and u < umin:
                u = umin
        if k % ev == 0:
            for kk, vv in zip(("t", "y", "ym", "u", "uc", "P", "I", "D", "e"), (t, y, ym, u, uc, Pp, I if I is not None else 0.0, Df, e)):
                out[kk].append(vv)
        u_prev = u
        if relay is None and ti:
            if mv is not None:
                if track == "track":                 # 手動の間は、出している操作量に合わせ続ける
                    I = u - Pp - Df
            elif gin:
                inc = kp * h / ti * e
                if aw == "clamp" and ((uc > (umax if umax is not None else _f11_np.inf) and e > 0) or
                                      (uc < (umin if umin is not None else -_f11_np.inf) and e < 0)):
                    inc = 0.0
                if aw == "back" and Tt:
                    inc += h / Tt * (u - uc)
                I += inc
            else:
                S += h * e
                I = kp / ti * S
        was_man = mv is not None
        uin = u + (d(t) if d else 0.0)
        if nd:
            buf[bi] = uin; bi = (bi + 1) % nd
        else:
            ua = uin
        if not _f11_np.isfinite(y) or abs(y) > 1e9:
            break
        xp = Ad @ xp + Bd * ua
    return {k: _f11_np.array(v) for k, v in out.items()}


def _f11_pid_tf(KP, TI=None, TD=0.0, N=10.0):
    """標準形の PID（不完全微分）の伝達関数の (分子, 分母)。"""
    np = _f11_np
    if not TI and not TD:
        return [KP], [1.0]
    if not TD:
        return [KP * TI, KP], [TI, 0.0]
    Tf = TD / N
    if not TI:
        return [KP * (Tf + TD), KP], [Tf, 1.0]
    return [KP * (TI * Tf + TI * TD), KP * (TI + Tf), KP], [TI * Tf, TI, 0.0]


def _f11_margins(Pn, Pd, L, Cn, Cd, wlo=1e-5, whi=1e5):
    """一巡伝達関数 P C の (ω_gc, 位相余裕 [°], ω_pc, ゲイン余裕 [dB])。最初に横切る所。"""
    np = _f11_np
    num = np.polymul(Pn, Cn); den = np.polymul(Pd, Cd)
    ws = np.logspace(np.log10(wlo), np.log10(whi), 40000)
    db, ph = BODEPH(num, den, ws, L)
    wgc = pm = wpc = gm = None
    for i in range(1, len(ws)):
        if wgc is None and (db[i - 1] - 0) * (db[i] - 0) <= 0 and db[i - 1] != db[i]:
            f = db[i - 1] / (db[i - 1] - db[i]); wgc = ws[i - 1] * (ws[i] / ws[i - 1]) ** f
            pm = 180 + (ph[i - 1] + f * (ph[i] - ph[i - 1]))
        if wpc is None and (ph[i - 1] + 180) * (ph[i] + 180) <= 0 and ph[i - 1] != ph[i]:
            f = (ph[i - 1] + 180) / (ph[i - 1] - ph[i]); wpc = ws[i - 1] * (ws[i] / ws[i - 1]) ** f
            gm = -(db[i - 1] + f * (db[i] - db[i - 1]))
    return wgc, pm, wpc, gm


def _f11_ind(t, y, rf, yf, t0=0.0, band=0.02, ref=None):
    """指標: 行き過ぎ量 [%]（変化の幅 ref に対する割合）、2 % 整定時間（t0 から）、IAE（t0 から）。"""
    np = _f11_np
    t = np.asarray(t); y = np.asarray(y)
    m = t >= t0
    tt, yy = t[m], y[m]
    ref = ref if ref is not None else abs(yf - yy[0])
    sgn = 1.0 if yf >= yy[0] else -1.0
    over = max(0.0, (np.max(sgn * (yy - yf)))) / ref * 100 if ref else 0.0
    out = np.where(np.abs(yy - yf) > band * ref)[0]
    ts = (tt[out[-1] + 1] - t0) if len(out) and out[-1] + 1 < len(tt) else (None if len(out) else 0.0)
    e = np.abs(rf - yy) if not callable(rf) else np.abs(np.array([rf(x) for x in tt]) - yy)
    iae = float(np.trapezoid(e, tt))
    return over, ts, iae


# ---- 乱数（widgets.js の U.rng と同じ列。図とデモで同じ観測ノイズになる） ----
def _f11_rng(seed):
    st = [(seed & 0xFFFFFFFF) or 1]
    def nx():
        x = (st[0] + 0x6D2B79F5) & 0xFFFFFFFF
        st[0] = x
        t = ((x ^ (x >> 15)) * (1 | x)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    def normal():
        u = 1 - nx(); v = nx()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)
    return normal


def _f11_noise(seed, sig, tmax):
    """1 s ごとに新しい値になる観測ノイズ（標準偏差 sig）。noise(t, k) の形の関数を返す。"""
    nm = _f11_rng(seed)
    v = [sig * nm() for _ in range(int(tmax) + 2)]
    return lambda t, k: v[int(math.floor(t + 1e-9))]


_F11_SEED = 11          # 観測ノイズの種（デモの始めの種と同じ）
_F11_PLATE = _F11_PL["plate"]


# ---- 図の補助 ----
def _f11_area(p, t, e, c, sign=1):
    """偏差 e(t) と 0 の線の間で、符号が sign の部分を塗る（Plot p の座標）。"""
    o, run = [], []
    for a, b in zip(t, e):
        if sign * b > 0:
            run.append((a, b))
        elif run:
            o.append(run); run = []
    if run:
        o.append(run)
    s = []
    for r in o:
        if len(r) < 2:
            continue
        pts = [(p.X(r[0][0]), p.Y(0))] + [(p.X(a), p.Y(b)) for a, b in r] + [(p.X(r[-1][0]), p.Y(0))]
        s.append(PL(pts, c="none", lw=0, fill=soft(c)))
    return "".join(s)


def _f11_pi_run(KP, TI, kind, tEnd=None, n=None, noise=None):
    """温度の板の PI（線形の範囲）。kind: "r"（目標値 +1 K）・"d"（外乱 −10 W）・"n"（観測ノイズだけ）。60 °C・28 W で落ち着いた所から。"""
    if kind == "r":            # 偏差の変数で計算し、60 °C・28 W を足して返す
        a = _f11_sim(_F11_PLATE, KP, TI, tEnd=tEnd or 1500, n=n or 15000, r=1.0)
        a["y"] = a["y"] + 35.0; a["u"] = a["u"] + 28.0; a["uc"] = a["uc"] + 28.0
        return a
    if kind == "d":
        return _f11_sim(_F11_PLATE, KP, TI, tEnd=tEnd or 2000, n=n or 20000, r=35.0, u0=28.0, d=lambda t: -10.0)
    return _f11_sim(_F11_PLATE, KP, TI, tEnd=tEnd or 1600, n=n or 16000, r=35.0, u0=28.0, noise=noise)


_F11_ABC = [("(a)", 5.0, 320.0, TEA), ("(b)", 10.0, 160.0, SIG), ("(c)", 14.37, 65.62, ALI)]


# =====================================================================
# 1 節: 4 つの要求と評価指標
# =====================================================================
def _f11_goals_fig():
    o = []
    o.append(T(14, 18, "(a) 目標値・外乱・観測ノイズは、ループの別々の場所から入る", "start", 11.5, INK, True))
    yc = 74
    R = 15
    s, Pp, xe = CHAIN(20, yc, [("a", 64, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 56, None, ALI),
                               ("b", "C(s)", "c", SIG, SSOFT), ("a", 70, None, GLD), ("s", {"l": "+", "t": "+"}, "s2"),
                               ("a", 34, None, INK), ("b", ("1.25e^{−20s}", "500s + 1"), "p", LIN, PAN), ("a", 70, None, SIG),
                               ("t", "bp", SIG), ("a", 70, None, SIG)])
    o.append(s)
    o.append(TX(22, yc - 9, "目標値 r", "start", 10, MUT, True))
    o.append(TX((Pp["s1"] + R + Pp["c"][0]) / 2, yc - 9, "偏差 e", "middle", 10, ALI, True))
    o.append(TX((Pp["c"][1] + Pp["s2"] - R) / 2, yc - 9, "操作量 u", "middle", 10, GLD, True))
    o.append(T((Pp["c"][0] + Pp["c"][1]) / 2, yc + 30, "PID", "middle", 9.5, MUT))
    o.append(T((Pp["p"][0] + Pp["p"][1]) / 2, yc + 34, "温度の板 P(s)", "middle", 9.5, MUT))
    o.append(TX(xe - 2, yc - 9, "制御量 y", "end", 10, SIG, True))
    o.append(TOPIN(Pp["s2"], yc, 44, "外乱 d（逃げる熱の増加）", PUR))
    yf = yc + 62
    xs3 = (Pp["p"][0] + Pp["p"][1]) / 2
    o.append(W(Pp["bp"], yc, Pp["bp"], yf, c=SIG, lw=1.6))
    o.append(ARR(Pp["bp"], yf, xs3 + R, yf, c=SIG, lw=1.6))
    o.append(SUMJ(xs3, yf, {"r": "+", "b": "+"}))
    o.append(ARR(xs3, yf + 38, xs3, yf + R, c=TEA, lw=1.6, dash="4 3"))
    o.append(TX(xs3 + 8, yf + 34, "観測ノイズ n", "start", 10, TEA, True))
    o.append(W(xs3 - R, yf, Pp["s1"], yf, c=TEA, lw=1.6))
    o.append(ARR(Pp["s1"], yf, Pp["s1"], yc + R, c=TEA, lw=1.6))
    o.append(T((Pp["s1"] + xs3) / 2, yf - 7, "測った値 y + n", "middle", 9.5, TEA, True))
    # (b) 4 つの小さな図（(b) の PI: 10 W/K・160 s）
    yb = 232
    o.append(T(14, yb - 14, "(b) 4 つの要求ごとに読む評価指標（PI 10 W/K・160 s の例）", "start", 11.5, INK, True))
    KP, TI = 10.0, 160.0
    ar = _f11_pi_run(KP, TI, "r", 900, 9000)
    ad = _f11_pi_run(KP, TI, "d", 900, 9000)
    an = _f11_pi_run(KP, TI, "n", 600, 6000, _f11_noise(_F11_SEED, 0.3, 700))
    panels = [("目標値への追従", MUT), ("外乱の抑え", PUR), ("観測ノイズ", TEA), ("余裕", ALI)]
    xs = [44, 214, 384, 554]
    for i, (tt, c) in enumerate(panels):
        o.append(T(xs[i] - 30, yb + 4, tt, "start", 10.5, c, True))
    # 1: 目標値
    p = Plot(xs[0], yb + 14, 130, 74, (0, 900), (-0.1, 1.4))
    o.append(p.axes(xl=None, yl=None, xt=[0, 300, 600, 900], yt=[0, 1], sz=9))
    o.append(W(p.X(0), p.Y(1), p.X(900), p.Y(1), c=MUT, lw=1.1, dash="5 3"))
    o.append(p.line(list(zip(ar["t"], ar["y"] - 35)), c=SIG, lw=1.8))
    mx = float(ar["y"].max() - 35)
    o.append(W(p.X(0), p.Y(mx), p.X(900), p.Y(mx), c=ALI, lw=1, dash="2 2"))
    o.append(T(xs[0] - 30, yb + 118, "行き過ぎ量", "start", 9.5, INK))
    o.append(T(xs[0] - 30, yb + 131, "2 % 整定時間", "start", 9.5, INK))
    o.append(T(xs[0] - 30, yb + 144, "IAE", "start", 9.5, INK))
    # 2: 外乱
    q = Plot(xs[1], yb + 14, 130, 74, (0, 900), (-1.1, 0.2))
    o.append(q.axes(xl=None, yl=None, xt=[0, 300, 600, 900], yt=[-1, 0], sz=9, yfmt=_f11_g))
    o.append(_f11_area(q, ad["t"], ad["y"] - 35, SIG, -1))
    o.append(q.line(list(zip(ad["t"], ad["y"] - 35)), c=SIG, lw=1.8))
    o.append(T(q.X(450), q.Y(-0.45), "面積", "middle", 9, SIG, True, halo=True))
    o.append(T(xs[1] - 30, yb + 118, "最大のずれ", "start", 9.5, INK))
    o.append(T(xs[1] - 30, yb + 131, "IAE（面積）", "start", 9.5, INK))
    o.append(T(xs[1] - 30, yb + 144, "戻るまでの時間", "start", 9.5, INK))
    # 3: ノイズ
    z = Plot(xs[2], yb + 14, 130, 74, (0, 600), (14, 42))
    o.append(z.axes(xl=None, yl=None, xt=[0, 300, 600], yt=[20, 30, 40], sz=9))
    o.append(z.line(list(zip(an["t"], an["u"])), c=GLD, lw=1.1))
    o.append(T(xs[2] - 30, yb + 118, "操作量の揺れ", "start", 9.5, INK))
    o.append(T(xs[2] - 30, yb + 131, "（標準偏差）", "start", 9.5, INK))
    o.append(T(xs[2] - 30, yb + 144, "操作量の最大値", "start", 9.5, INK))
    # 4: ナイキスト線図（−1 の近く）
    num, den, L = _F11_PLATE
    Cn, Cd = _f11_pid_tf(KP, TI)
    ws = _f11_np.logspace(-4, 0, 3000)
    Lv = _f11_np.polyval(_f11_np.polymul(num, Cn), 1j * ws) / _f11_np.polyval(_f11_np.polymul(den, Cd), 1j * ws) * _f11_np.exp(-1j * ws * L)
    w = Plot(xs[3] + 10, yb + 14, 110, 74, (-1.6, 0.6), (-1.2, 0.3))
    o.append(RECT(w.x, w.y, w.w, w.h, 0, SCR, LIN, 0.8))
    o.append(W(w.X(-1.6), w.Y(0), w.X(0.6), w.Y(0), c=MUT, lw=0.8))
    o.append(W(w.X(0), w.Y(-1.2), w.X(0), w.Y(0.3), c=MUT, lw=0.8))
    o.append(w.clip([(v.real, v.imag) for v in Lv], c=SIG, lw=1.8))
    k = int(_f11_np.argmin(_f11_np.abs(1 + Lv))); dm = float(abs(1 + Lv[k]))
    o.append(W(w.X(-1), w.Y(0), w.X(Lv[k].real), w.Y(Lv[k].imag), c=ALI, lw=1.4))
    o.append(W(w.X(-1) - 4, w.Y(0) - 4, w.X(-1) + 4, w.Y(0) + 4, c=ALI, lw=2))
    o.append(W(w.X(-1) - 4, w.Y(0) + 4, w.X(-1) + 4, w.Y(0) - 4, c=ALI, lw=2))
    o.append(T(w.X(-1), w.Y(0) - 7, "−1", "middle", 9, ALI, True, halo=True))
    o.append(T(xs[3] - 30, yb + 118, "ゲイン余裕・位相余裕", "start", 9.5, INK))
    o.append(T(xs[3] - 30, yb + 131, "−1 との最短距離", "start", 9.5, INK))
    o.append(T(xs[3] - 30, yb + 144, "（%s）" % _f11_f(dm, 2), "start", 9.5, ALI))
    o.append(T(14, yb + 168, "横軸はどれも時間 t [s]（右端だけは複素平面）。制御量・外乱への応答は 60 °C からの変化 [K]、ノイズの図は操作量 [W]。", "start", 9.5, MUT))
    return SVG(700, yb + 178, o, "(a) 温度の板の PID 制御のループ。目標値は偏差を作る加え合わせ点に、外乱は操作量に、観測ノイズは測った値に入る。どれも同じ制御器 C(s) を通って制御量と操作量に現れる。(b) 4 つの要求ごとに読む評価指標。目標値を 1 K 上げたときの行き過ぎと落ち着くまでの時間、逃げる熱が 10 W 増えたときのずれの大きさと面積、観測ノイズ（標準偏差 0.3 K）で揺れる操作量、ナイキスト線図が −1 の点に最も近づく距離。")


F["e11_goals"] = _f11_goals_fig()


def _f11_iae_fig():
    o = []
    cases = [("(a) K_P = 10 W/K・T_I = 160 s", 10.0, 160.0, GRN), ("(b) K_P = 3 W/K・T_I = 48 s", 3.0, 48.0, ALI)]
    for i, (tt, KP, TI, c) in enumerate(cases):
        x0 = 62 + i * 340
        a = _f11_sim(_F11_PLATE, KP, TI, tEnd=4000, n=40000, r=35.0, u0=28.0, d=lambda t: -10.0)
        t, e, uI = a["t"], a["e"], a["I"]
        IE = float(_f11_np.trapezoid(e, t)); IAE = float(_f11_np.trapezoid(_f11_np.abs(e), t))
        o.append(TX(x0 - 48, 18, tt, "start", 11, INK, True))
        p = Plot(x0, 32, 280, 130, (0, 1500), (-0.6, 1.8))
        o.append(p.axes(xl=None, yl="偏差 e [K]", xt=[0, 500, 1000, 1500], yt=[-0.5, 0, 0.5, 1, 1.5], sz=9, yfmt=_f11_g))
        o.append(_f11_area(p, t[t <= 1500], e[t <= 1500], SIG, 1))
        o.append(_f11_area(p, t[t <= 1500], e[t <= 1500], ALI, -1))
        o.append(W(p.X(0), p.Y(0), p.X(1500), p.Y(0), c=MUT, lw=1))
        m = t <= 1500
        o.append(p.line(list(zip(t[m], e[m])), c=c, lw=2))
        o.append(TX(p.X(1480), p.Y(1.62), "∫e dt = %s K·s" % _f11_f(IE, 0), "end", 10, INK, True, halo=True))
        o.append(TX(p.X(1480), p.Y(1.38), "IAE = %s K·s" % _f11_f(IAE, 0), "end", 10, c, True, halo=True))
        q = Plot(x0, 204, 280, 70, (0, 1500), (24, 42))
        o.append(q.axes(xl="時間 t [s]", yl="u_I [W]", xt=[0, 500, 1000, 1500], yt=[28, 38], sz=9))
        o.append(W(q.X(0), q.Y(38), q.X(1500), q.Y(38), c=MUT, lw=1, dash="4 3"))
        o.append(q.line(list(zip(t[t <= 1500], uI[t <= 1500])), c=GLD, lw=1.8))
        o.append(T(q.X(1480), q.Y(38) + 13, "28 W → 38 W（−d = 10 W 増える）", "end", 9.5, GLD, True, halo=True))
        o.append(T(x0 - 48, 192, "I の分", "start", 10, INK, True))
    o.append(TX(14, 316, "どちらも積分ゲイン K_I = K_P/T_I = 0.0625 W/(K·s)。外乱 d = −10 W（逃げる熱が 10 W 増える）が時刻 0 に入る。", "start", 10, MUT))
    o.append(LEGEND(14, 334, [(SIG, "正の面積"), (ALI, "負の面積")]))
    return SVG(700, 342, o, "同じ積分ゲインの 2 つの PI で、外乱が入った後の偏差（上）と I の分（下）。I の分はどちらも 28 W から 38 W へ、外乱を打ち消す 10 W だけ増える。その増え方は偏差の面積 × K<sub>I</sub> なので、偏差の面積 ∫e dt はどちらも 10 ÷ 0.0625 = 160 K·s になる。(a) は偏差の符号が変わらないので IAE も 160 K·s だが、(b) は振れて負の面積ができ、正と負を足した IAE は 397 K·s になる。")


F["e11_iae"] = _f11_iae_fig()


def _f11_tradeoff_fig():
    o = []
    nz = _f11_noise(_F11_SEED, 0.3, 1700)
    rows = [("目標値 +1 K", "制御量の変化 [K]"), ("外乱 −10 W", "制御量の変化 [K]"), ("観測ノイズ 0.3 K", "操作量 [W]")]
    xs = [120, 314, 508]
    for j, (lab, KP, TI, c) in enumerate(_F11_ABC):
        o.append(T(xs[j] + 80, 18, "%s %s W/K・%s s" % (lab, _f11_g(KP, 3), _f11_g(TI, 3)), "middle", 11, c, True))
        ar = _f11_pi_run(KP, TI, "r", 1000, 10000)
        ad = _f11_pi_run(KP, TI, "d", 4000, 40000)
        an = _f11_pi_run(KP, TI, "n", 1600, 16000, nz)
        p = Plot(xs[j], 34, 160, 80, (0, 1000), (-0.1, 1.8))
        o.append(p.axes(xl=None, yl=None, xt=[0, 500, 1000], yt=[0, 1], sz=9, yfmt=_f11_g))
        o.append(W(p.X(0), p.Y(1), p.X(1000), p.Y(1), c=MUT, lw=1.1, dash="5 3"))
        o.append(p.line(list(zip(ar["t"], ar["y"] - 35)), c=c, lw=1.9))
        ov = (float(ar["y"].max()) - 36.0) * 100
        o.append(T(p.X(990), p.Y(1.6), "行き過ぎ %s %%" % _f11_f(ov, 1), "end", 9.5, c, True, halo=True))
        q = Plot(xs[j], 150, 160, 80, (0, 1500), (-1.6, 0.3))
        o.append(q.axes(xl=None, yl=None, xt=[0, 500, 1000, 1500], yt=[-1.5, -1, -0.5, 0], sz=9, yfmt=_f11_g))
        md = ad["t"] <= 1500
        o.append(_f11_area(q, ad["t"][md], ad["y"][md] - 35, c, -1))
        o.append(q.line(list(zip(ad["t"][md], ad["y"][md] - 35)), c=c, lw=1.9))
        iae = float(_f11_np.trapezoid(_f11_np.abs(ad["e"]), ad["t"]))
        o.append(T(q.X(1480), q.Y(-1.42), "IAE %s K·s" % _f11_f(iae, 0 if iae > 100 else 1), "end", 9.5, c, True, halo=True))
        z = Plot(xs[j], 266, 160, 80, (1000, 1600), (12, 44))
        o.append(z.axes(xl="時間 t [s]", yl=None, xt=[1000, 1300, 1600], yt=[20, 28, 36], sz=9))
        m = an["t"] >= 1000
        o.append(z.line(list(zip(an["t"][m], an["u"][m])), c=GLD, lw=1.1))
        sd = float(_f11_np.std(an["u"][an["t"] > 500]))
        o.append(T(z.X(1590), z.Y(41), "標準偏差 %s W" % _f11_f(sd, 2), "end", 9.5, GLD, True, halo=True))
    for i, (lab, yl) in enumerate(rows):
        y0 = 34 + i * 116
        o.append(T(14, y0 + 30, lab, "start", 10, INK, True))
        o.append(TLINES(14, y0 + 46, yl.split("の", 1) if False else [yl[:yl.index(" [")], yl[yl.index(" ["):].strip()], "start", 9, MUT, lh=12))
    o.append(T(14, 392, "→ 強くするほど外乱は小さく抑えられ、目標値にも速く近づくが、行き過ぎが増え、ノイズで操作量が大きく揺れる。", "start", 10, INK, True))
    return SVG(700, 400, o, "温度の板を、強さの違う 3 つの PI で制御する（60 °C・28 W で落ち着いた所から）。上: 目標値を 1 K 上げたときの温度の変化。中: 逃げる熱が 10 W 増えたときの温度の変化（塗った部分の面積が IAE）。下: 観測ノイズ（標準偏差 0.3 K、1 s ごとに変わる）だけがあるときの操作量。(a) から (c) へ強くするほど、外乱の IAE は 640・160・50.8 K·s と小さくなるが、目標値への行き過ぎは 4.7・19.3・65.8 % に増え、操作量の揺れも大きくなる。")


F["e11_tradeoff"] = _f11_tradeoff_fig()


# =====================================================================
# 2 節: ジーグラ・ニコルスの方法
# =====================================================================
_F11_KU = {"plate": (31.93, 78.74), "cart": (17.0, 0.3721), "mpos": (40.0, 2 * math.pi / 200.0)}


def _f11_zn(pl, kind):
    Ku, Tu = _F11_KU[pl]
    return {"P": (0.5 * Ku, None, 0.0), "PI": (0.45 * Ku, Tu / 1.2, 0.0), "PID": (0.6 * Ku, 0.5 * Tu, 0.125 * Tu)}[kind]


def _f11_peaks(t, y, yf):
    d = _f11_np.asarray(y) - yf
    return [i for i in range(1, len(d) - 1) if d[i] > d[i - 1] and d[i] >= d[i + 1] and d[i] > 0]


def _f11_upx(t, y, lev):
    """y が lev を下から上へ横切る時刻（線形補間）。"""
    o = []
    for i in range(1, len(y)):
        if y[i - 1] < lev <= y[i]:
            o.append(t[i - 1] + (lev - y[i - 1]) / (y[i] - y[i - 1]) * (t[i] - t[i - 1]))
    return o


def _f11_zn_ult_fig():
    o = []
    Ku = _F11_KU["plate"][0]
    o.append(T(14, 18, "(a) 温度の板を比例制御だけで動かし、目標値を 1 K 上げる", "start", 11.5, INK, True))
    cases = [(0.8, GRN), (1.0, SIG), (1.1, ALI)]
    rd = {}
    for i, (f, c) in enumerate(cases):
        K = f * Ku
        r = SIMLOOP([1.25], [500.0, 1.0], [K], [1.0], 900, L=20.0, n=18000, r=1.0, every=1)
        t, y = r["t"], r["y"]
        yf = 1.25 * K / (1 + 1.25 * K)
        pk = _f11_peaks(t, y, yf)
        ratio = (y[pk[3]] - yf) / (y[pk[2]] - yf)
        ux = _f11_upx(t, y, yf)
        per = (ux[4] - ux[1]) / 3
        rd[f] = (_f11_f(ratio, 2), _f11_f(per, 1))
        p = Plot(62, 50 + i * 100, 380, 62, (0, 900), (-1.0, 3.2))
        o.append(p.axes(xl="時間 t [s]" if i == 2 else None, yl=None, xt=[0, 300, 600, 900], yt=[0, 1, 2, 3], sz=9))
        o.append(W(p.X(0), p.Y(1), p.X(900), p.Y(1), c=MUT, lw=1, dash="5 3"))
        o.append(p.clip(list(zip(t[::10], y[::10])), c=c, lw=1.8))
        # 説明は枠の上に置く（発散する線と重ならないように）
        o.append(TX(p.x, p.y - 6, "K_P = %s W/K（%s K_u）" % (_f11_f(K, 1), "%.1f" % f), "start", 9.5, c, True))
        o.append(T(p.X(900), p.y - 6, "振れは 1 往復ごとに %s 倍・周期 %s s" % (_f11_f(ratio, 2), _f11_f(per, 1)), "end", 9.5, c, True))
        if f == 1.0:
            ta, tb = ux[5], ux[6]
            o.append(DARR(p.X(ta), p.Y(-0.55), p.X(tb), p.Y(-0.55), c=SIG, lw=1.1, head=5))
            o.append(TX((p.X(ta) + p.X(tb)) / 2, p.Y(-0.55) - 4, "T_u", "middle", 9.5, SIG, True, halo=True))
        o.append(T(p.x - 30, p.y + p.h / 2 + 4, "K", "middle", 9, MUT))
    # (b) 例の対象の値（9 章）
    xb = 476
    o.append(T(xb - 6, 62, "(b) 9 章で求めた値", "start", 11.5, INK, True))
    rows = [("温度の板", "31.9 W/K", "78.7 s", "0.0798 rad/s"), ("台車（遅れ 0.1 s）", "17.0 N/(m/s)", "0.372 s", "16.9 rad/s"),
            ("モータの位置", "40 V/rad", "31.4 ms", "200 rad/s")]
    yy = 92
    for nm, a_, b_, c_ in rows:
        o.append(T(xb, yy, nm, "start", 10.5, INK, True))
        o.append(TX(xb + 10, yy + 16, "K_u = " + a_, "start", 10, SIG))
        o.append(TX(xb + 10, yy + 31, "T_u = " + b_ + "（ω_pc = " + c_ + "）", "start", 10, SIG))
        yy += 58
    o.append(TX(xb, yy + 6, "K_u = 1/|P(jω_pc)|、T_u = 2π/ω_pc", "start", 10, INK, True))
    return SVG(700, 352, o, "限界感度法の試験。比例ゲインを上げていくと、限界ゲインの 0.8 倍では振れが 1 往復ごとに %s 倍に減り、ちょうど限界ゲインでは同じ振れ幅で続き（持続振動）、1.1 倍では %s 倍に増える。持続振動の周期が限界周期で、温度の板では %s s と読め、9 章で位相交差角周波数から求めた 78.7 s とほぼ一致する。(b) の値は、どれも 9 章の位相交差角周波数とそこでのゲインから計算できる。" % (rd[0.8][0], rd[1.1][0], rd[1.0][1]))


F["e11_zn_ult"] = _f11_zn_ult_fig()


def _f11_cplane(x, y, w, h, xr, yr, xt, yt, sz=9):
    p = Plot(x, y, w, h, xr, yr)
    o = [RECT(x, y, w, h, 0, SCR, LIN, 0.8)]
    for v in xt:
        o.append(W(p.X(v), y, p.X(v), y + h, c=GRD, lw=1))
        o.append(T(p.X(v), y + h + 13, _f11_g(v), "middle", sz, MUT))
    for v in yt:
        o.append(W(x, p.Y(v), x + w, p.Y(v), c=GRD, lw=1))
        o.append(T(x - 5, p.Y(v) + 3, _f11_g(v), "end", sz, MUT))
    if xr[0] < 0 < xr[1]:
        o.append(W(p.X(0), y, p.X(0), y + h, c=MUT, lw=1))
    if yr[0] < 0 < yr[1]:
        o.append(W(x, p.Y(0), x + w, p.Y(0), c=MUT, lw=1))
    return "".join(o), p


def _f11_m1(p, lab=True):
    xx, yy = p.X(-1), p.Y(0)
    o = [W(xx - 5, yy - 5, xx + 5, yy + 5, c=ALI, lw=2.2), W(xx - 5, yy + 5, xx + 5, yy - 5, c=ALI, lw=2.2)]
    if lab:
        o.append(T(xx, yy - 9, "−1", "middle", 10, ALI, True, halo=True))
    return "".join(o)


def _f11_zn_nyq_fig():
    o = []
    o.append(T(14, 18, "(a) 表の値が、位相交差角周波数の点を動かす先", "start", 11.5, INK, True))
    s, p = _f11_cplane(52, 40, 290, 200, (-1.6, 0.1), (-0.62, 0.55), [-1.5, -1, -0.5, 0], [-0.5, 0, 0.5])
    o.append(s)
    # −1 から 0.5 の円
    pts = [(p.X(-1 + 0.5 * math.cos(a)), p.Y(0.5 * math.sin(a))) for a in _f11_np.linspace(0, 2 * math.pi, 120)]
    o.append(PL(pts, c=ALI, lw=1, dash="4 3"))
    o.append(T(p.X(-1.0), p.Y(-0.5) + 13, "−1 から 0.5 の円", "middle", 9, ALI, halo=True))
    o.append(_f11_m1(p))
    pts3 = [("P", -0.5, 0.0, TEA, "−0.5"), ("PI", -0.45, 0.086, SIG, "−0.45 + 0.086j"), ("PID", -0.60, -0.28, GRN, "−0.60 − 0.28j")]
    for nm, a_, b_, c, lab in pts3:
        o.append(ARR(p.X(-1), p.Y(0), p.X(a_), p.Y(b_), c=c, lw=1.3, head=6))
        o.append(D(p.X(a_), p.Y(b_), c, 4.2))
    o.append(T(p.X(-0.45) + 4, p.Y(0.086) - 9, "PI: −0.45 + 0.086j", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-0.5) + 8, p.Y(0.0) + 14, "P: −0.5", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(-0.6) + 6, p.Y(-0.28) + 15, "PID: −0.60 − 0.28j", "start", 9.5, GRN, True, halo=True))
    o.append(TX(52, 280, "比例ゲイン K_u では、この点は −1 にある。", "start", 9.5, MUT))
    o.append(TX(52, 294, "表の C(jω_pc) を掛けると、−1 から 0.5 前後に移る。", "start", 9.5, MUT))
    # (b) 温度の板の線図全体
    o.append(T(378, 18, "(b) 温度の板の一巡伝達関数の線図", "start", 11.5, INK, True))
    s2, q = _f11_cplane(408, 40, 270, 200, (-2.2, 0.5), (-1.6, 0.4), [-2, -1, 0], [-1, 0])
    o.append(s2)
    num, den, L = _F11_PLATE
    ws = _f11_np.logspace(-3.0, math.log10(0.25), 3000)
    for nm, c in (("P", TEA), ("PI", SIG), ("PID", GRN)):
        KP, TI, TD = _f11_zn("plate", nm)
        Cn, Cd = _f11_pid_tf(KP, TI, TD, 10.0)
        Lv = _f11_np.polyval(_f11_np.polymul(num, Cn), 1j * ws) / _f11_np.polyval(_f11_np.polymul(den, Cd), 1j * ws) * _f11_np.exp(-1j * ws * L)
        o.append(q.clip([(v.real, v.imag) for v in Lv], c=c, lw=1.9))
        k = int(_f11_np.argmin(_f11_np.abs(1 + Lv)))
        o.append(W(q.X(-1), q.Y(0), q.X(Lv[k].real), q.Y(Lv[k].imag), c=c, lw=1.2, dash="2 2"))
        o.append(D(q.X(Lv[k].real), q.Y(Lv[k].imag), c, 3.4))
    o.append(_f11_m1(q))
    o.append(T(408, 280, "点線: −1 に最も近い点までの距離", "start", 9.5, MUT))
    o.append(T(408, 294, "（P 0.45・PI 0.37・PID 0.39）", "start", 9.5, MUT))
    o.append(LEGL(408, 314, [(TEA, None, "P"), (SIG, None, "PI"), (GRN, None, "PID（N = 10）")], 9.5, 14))
    return SVG(700, 322, o, "(a) 限界ゲインのとき −1 にあった、位相交差角周波数の一巡伝達関数の点は、表の値の制御器を掛けると、P で −0.5、PI で −0.45 + 0.086j、PID で −0.60 − 0.28j に移る。どれも −1 から 0.5 前後の距離で、対象によらない。(b) 温度の板で、表の値の一巡伝達関数のナイキスト線図を描くと、線図全体が −1 に最も近づく距離は 0.37〜0.45 で、(a) の点より近い所を通る。")


F["e11_zn_nyq"] = _f11_zn_nyq_fig()


def _f11_zn_resp_fig():
    o, back, front = [], [], []
    cols = [("plate", "温度の板", 600.0, 6000, -10.0, "K", "W"), ("cart", "台車（遅れ 0.1 s）", 2.0, 20000, -1.0, "m/s", "N"),
            ("mpos", "モータの位置", 0.2, 20000, -1.0, "rad", "V")]
    cc = {"P": TEA, "PI": SIG, "PID": GRN}
    o.append(T(14, 46, "目標値を 1 上げる（縦軸は、目標値の変化を 1 とした制御量）", "start", 10.5, INK, True))
    o.append(T(14, 258, "操作量に入る外乱のステップ（縦軸は制御量）", "start", 10.5, PUR, True))
    for j, (pl, nm, tE, n, dd, un, du) in enumerate(cols):
        x0 = 70 + j * 214
        o.append(T(x0 + 80, 22, nm, "middle", 11, INK, True))
        P = _F11_PL[pl]
        K0 = P[0][-1] / P[1][-1] if P[1][-1] else None
        p = Plot(x0, 58, 160, 116, (0, tE), (-0.2, 2.2))
        o.append(p.axes(xl=None, yl=None, xt=[0, tE / 2, tE], yt=[0, 1, 2], sz=9, xfmt=_f11_g, yfmt=_f11_g))
        o.append(W(p.X(0), p.Y(1), p.X(tE), p.Y(1), c=MUT, lw=1, dash="5 3"))
        dmax = {"plate": 1.2, "cart": 0.2, "mpos": 0.12}[pl]
        q = Plot(x0, 282, 160, 100, (0, tE), (-dmax, dmax * 0.5))
        o.append(q.axes(xl="時間 t [s]", yl="[%s]" % un, xt=[0, tE / 2, tE], yt=[-dmax, -dmax / 2, 0], sz=9, xfmt=_f11_g, yfmt=_f11_g))
        o.append(W(q.X(0), q.Y(0), q.X(tE), q.Y(0), c=MUT, lw=1))
        o.append(T(q.X(tE), q.y - 6, "外乱 %s %s" % (_f11_g(dd), du), "end", 9, PUR, True))
        for k, kind in enumerate(("P", "PI", "PID")):
            KP, TI, TD = _f11_zn(pl, kind)
            a = _f11_sim(P, KP, TI, TD, N=10.0, tEnd=tE, n=n, r=1.0)
            b = _f11_sim(P, KP, TI, TD, N=10.0, tEnd=tE, n=n, r=0.0, d=lambda t: dd)
            bad = (not _f11_np.all(_f11_np.isfinite(a["y"]))) or float(_f11_np.max(_f11_np.abs(a["y"]))) > 3
            c = ALI if bad else cc[kind]
            if bad:
                # 発散する線は薄く、下に描く（ほかの線を隠さないように）
                back.append('<g opacity="0.45">' + p.clip(list(zip(a["t"], a["y"])), c=c, lw=1.2) + q.clip(list(zip(b["t"], b["y"])), c=c, lw=1.2) + "</g>")
                lab = "%s: 不安定（振れが増え続ける）" % kind
            else:
                front.append(p.clip(list(zip(a["t"], a["y"])), c=c, lw=1.7) + q.clip(list(zip(b["t"], b["y"])), c=c, lw=1.7))
                yf = 1.0 if (TI or K0 is None) else K0 * KP / (1 + K0 * KP)
                ov = max(0.0, (float(a["y"].max()) - yf) / yf * 100)
                lab = "%s: 行き過ぎ %s %%" % (kind, _f11_f(ov, 0))
            # 行き過ぎの値は枠の下に並べる（線と重ならないように）
            o.append(T(x0, 206 + k * 13, lab, "start", 9, c, True))
    o.extend(back + front)
    o.append(LEGL(70, 432, [(TEA, None, "P の表"), (SIG, None, "PI の表"), (GRN, None, "PID の表"), (ALI, None, "不安定")], 9.5, 14))
    return SVG(700, 440, o, "ジーグラ・ニコルスの限界感度法の表の値で制御した応答（PID は N = 10 の不完全微分を測った値に掛けた）。上: 目標値を 1 だけ上げたとき。下: 操作量に入る外乱のステップ。温度の板と台車では外乱を速く抑えるが、目標値には 44〜68 % 行き過ぎる。モータの位置は、限界周期が巻線の速い遅れで決まるので表の前提から外れ、P でも大きく振れ、PI では不安定になる。")


F["e11_zn_resp"] = _f11_zn_resp_fig()


def _f11_relay_run(pl="plate", du=20.0, eps=0.0, noise=None, tE=1000.0, n=10000):
    """リレーの試験（u_0 で落ち着いた所から）。返り値 (結果, 解析の辞書)。"""
    if pl == "plate":
        P, r, u0, tskip = _F11_PLATE, 35.0, 28.0, 300.0
    else:
        P, r, u0, tskip = _F11_PL["cart"], 1.0, 2.0, 2.0
    a = _f11_sim(P, relay=(du, eps, u0), tEnd=tE, n=n, r=r, u0=u0, noise=noise, every=1)
    t, y, u = a["t"], a["y"], a["u"]
    m = t >= tskip
    tt, yy, uu = t[m], y[m], u[m]
    up = [i for i in range(1, len(uu)) if uu[i] > u0 and uu[i - 1] < u0]
    Tosc = (tt[up[-1]] - tt[up[0]]) / (len(up) - 1)
    seg = (tt >= tt[up[0]]) & (tt < tt[up[-1]])
    ys, ts = yy[seg], tt[seg]
    ym = float(ys.mean()); amp = float(ys.max() - ys.min()) / 2
    w = 2 * math.pi / Tosc
    cs = 2 * float(_f11_np.trapezoid((ys - ym) * _f11_np.cos(w * ts), ts)) / (ts[-1] - ts[0])
    sn = 2 * float(_f11_np.trapezoid((ys - ym) * _f11_np.sin(w * ts), ts)) / (ts[-1] - ts[0])
    a1 = math.hypot(cs, sn)
    return a, {"T": Tosc, "a": amp, "a1": a1, "Ku": 4 * du / (math.pi * amp), "Ku1": 4 * du / (math.pi * a1),
               "ym": ym, "cs": cs, "sn": sn, "w": w, "t0": tt[up[0]], "up": [tt[i] for i in up]}


def _f11_relay_fig():
    o = []
    o.append(T(14, 18, "(a) 比例制御の代わりにリレーを置く", "start", 11.5, INK, True))
    yc = 62
    R = 15
    s, Pp, xe = CHAIN(18, yc, [("a", 50, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, None, ALI)])
    o.append(s)
    bx = xe
    o.append(RECT(bx, yc - 22, 70, 44, 6, SSOFT, SIG, 1.4))
    o.append(W(bx + 10, yc, bx + 60, yc, c=MUT, lw=0.8))
    o.append(W(bx + 35, yc - 18, bx + 35, yc + 18, c=MUT, lw=0.8))
    o.append(W(bx + 10, yc + 11, bx + 35, yc + 11, bx + 35, yc - 11, bx + 60, yc - 11, c=SIG, lw=1.8))
    s2, P2, xe2 = CHAIN(bx + 70, yc, [("a", 56, None, GLD), ("b", "P(s)", "p", LIN, PAN), ("a", 44, None, SIG), ("t", "bp", SIG), ("a", 30, None, SIG)])
    o.append(s2)
    o.append(FBPATH(P2["bp"], Pp["s1"], yc, 40, SIG))
    o.append(TX(20, yc - 9, "r", "start", 10, MUT, True))
    o.append(TX((Pp["s1"] + bx) / 2 + 6, yc - 9, "e", "middle", 10, ALI, True))
    o.append(T(bx + 35, yc + 36, "リレー", "middle", 9.5, SIG, True))
    o.append(TX(bx + 70 + 28, yc - 9, "u", "middle", 10, GLD, True))
    o.append(TX(xe2 - 2, yc - 9, "y", "end", 10, SIG, True))
    o.append(TX(bx + 72, yc + 64, "e > 0 なら u_0 + Δu、e < 0 なら u_0 − Δu", "start", 10, INK))
    # (b) 波形
    a, A = _f11_relay_run()
    t, y, u = a["t"], a["y"], a["u"]
    t0, t1 = 320.0, 640.0
    m = (t >= t0) & (t <= t1)
    o.append(TX(14, 152, "(b) 温度の板（u_0 = 28 W、Δu = 20 W）の振動", "start", 11.5, INK, True))
    p = Plot(62, 166, 380, 70, (t0, t1), (0, 60))
    o.append(p.axes(xl=None, yl="u [W]", xt=[320, 400, 480, 560, 640], yt=[8, 28, 48], sz=9, xfmt=lambda v: ""))
    o.append(p.line(list(zip(t[m], u[m])), c=GLD, lw=1.8))
    w = A["w"]
    tf = _f11_np.linspace(t0, t1, 400)
    # 操作量の基本波（方形波の上がる時刻に合わせた正弦波）
    tu = A["up"][0]
    o.append(p.line([(x, 28 + 4 * 20 / math.pi * math.sin(w * (x - tu))) for x in tf], c=GLD, lw=1.2, dash="4 3"))
    o.append(T(p.X(t1) - 2, p.y + 10, "基本波の振れ幅 4Δu/π = 25.5 W", "end", 9, GLD, True, halo=True))
    q = Plot(62, 252, 380, 80, (t0, t1), (58.6, 61.6))
    o.append(q.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[320, 400, 480, 560, 640], yt=[59, 60, 61], sz=9))
    o.append(W(q.X(t0), q.Y(60), q.X(t1), q.Y(60), c=MUT, lw=1, dash="5 3"))
    o.append(q.line(list(zip(t[m], 25 + y[m])), c=SIG, lw=1.9))
    o.append(q.line([(x, 25 + A["ym"] + A["sn"] * math.sin(w * x) + A["cs"] * math.cos(w * x)) for x in tf], c=SIG, lw=1.2, dash="4 3"))
    ups = [x for x in A["up"] if t0 <= x <= t1]
    o.append(DARR(q.X(ups[0]), q.Y(61.35), q.X(ups[1]), q.Y(61.35), c=INK, lw=1.1, head=5))
    o.append(TX((q.X(ups[0]) + q.X(ups[1])) / 2, q.Y(61.35) - 4, "T_osc = %s s" % _f11_f(A["T"], 1), "middle", 9.5, INK, True, halo=True))
    ymax = 25 + A["ym"] + A["a"]
    k = int(_f11_np.argmax(_f11_np.where(m, y, -1e9)))
    tk = [x for x in A["up"] if t0 <= x <= t1][0] + A["T"] / 2 + 20
    o.append(DARR(q.X(tk), q.Y(25 + A["ym"]), q.X(tk), q.Y(ymax), c=SIG, lw=1.1, head=4))
    o.append(TX(q.X(tk) + 4, q.Y(25 + A["ym"] + A["a"] / 2) + 4, "a = %s K" % _f11_f(A["a"], 2), "start", 9.5, SIG, True, halo=True))
    o.append(TX(q.X(t1) - 2, q.y - 4, "破線: 基本波（振れ幅 a_1 = %s K）" % _f11_f(A["a1"], 2), "end", 9, SIG, True, halo=True))
    # (c) ナイキスト線図
    o.append(T(470, 152, "(c) 負の実軸の近くの線図", "start", 11.5, INK, True))
    s3, c3 = _f11_cplane(490, 170, 190, 150, (-0.05, 0.01), (-0.03, 0.02), [-0.04, -0.02, 0], [-0.02, 0, 0.02], sz=8.5)
    o.append(s3)
    ws = _f11_np.logspace(-1.6, -0.6, 600)
    Pv = 1.25 * _f11_np.exp(-20j * ws) / (500j * ws + 1)
    o.append(c3.clip([(v.real, v.imag) for v in Pv], c=SIG, lw=1.8))
    pk = -math.pi * A["a"] / 80.0; pf = -math.pi * A["a1"] / 80.0
    o.append(D(c3.X(-1 / 31.93), c3.Y(0), SIG, 3.6))
    o.append(D(c3.X(pk), c3.Y(0), ALI, 3.6))
    o.append(D(c3.X(pf), c3.Y(0), GRN, 3.0))
    o.append(TX(c3.X(pk) - 2, c3.Y(0) + 15, "−πa/(4Δu)", "middle", 9, ALI, True, halo=True))
    o.append(TX(c3.X(-0.01), c3.Y(0.012), "−1/K_u", "middle", 9, SIG, True, halo=True))
    o.append(W(c3.X(-1 / 31.93), c3.Y(0) - 4, c3.X(-0.012), c3.Y(0.009), c=SIG, lw=0.8))
    o.append(TX(470, 346, "山の高さから: K_u ≈ %s W/K" % _f11_f(A["Ku"], 1), "start", 9.5, ALI, True))
    o.append(TX(470, 360, "基本波から: K_u ≈ %s W/K（本当は 31.9）" % _f11_f(A["Ku1"], 1), "start", 9.5, GRN, True))
    return SVG(700, 368, o, "リレーの試験。(a) 制御器の代わりに、偏差の符号で操作量を切り替えるリレーを置く。(b) 操作量は振れ幅 20 W の方形波になり、温度は目標値のまわりで一定の振れ幅の振動を続ける。その周期 %s s は限界周期 78.7 s とほぼ同じである。温度は三角波に近く、基本波（破線）の振れ幅 %s K は山の高さ %s K より小さい。(c) リレーの試験は、対象のナイキスト線図が負の実軸を横切る点を −πa/(4Δu) と読む。山の高さ a を使うと横切る点を遠めに読み、限界ゲインを小さく見積もる。" % (_f11_f(A["T"], 1), _f11_f(A["a1"], 2), _f11_f(A["a"], 2)))


F["e11_relay"] = _f11_relay_fig()


# =====================================================================
# 3 節: 内部モデル制御と λ
# =====================================================================
def _f11_imc_bd_fig():
    o = []
    R = 15
    o.append(T(14, 18, "(a) 内部モデル制御: 制御器の中に対象のモデルを持ち、測った値との差を戻す", "start", 11.5, INK, True))
    yc = 70
    s, Pp, xe = CHAIN(18, yc, [("a", 54, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, None, ALI), ("b", "Q(s)", "q", SIG, SSOFT),
                               ("a", 40, None, GLD), ("t", "bq", GLD), ("a", 60, None, GLD), ("s", {"l": "+", "t": "+"}, "sd"),
                               ("a", 30, None, INK), ("b", "P(s)", "p", LIN, PAN), ("a", 70, None, SIG), ("t", "by", SIG), ("a", 110, None, SIG)])
    o.append(s)
    o.append(TOPIN(Pp["sd"], yc, 36, "外乱 d", PUR))
    o.append(TX(20, yc - 9, "r", "start", 10, MUT, True))
    o.append(TX((Pp["q"][1] + Pp["bq"]) / 2, yc - 9, "u", "middle", 10, GLD, True))
    o.append(TX(xe - 2, yc - 9, "y", "end", 10, SIG, True))
    o.append(T((Pp["p"][0] + Pp["p"][1]) / 2, yc + 30, "本当の対象", "middle", 9.5, MUT))
    ym = yc + 74
    xm0 = Pp["p"][0]
    wbox = Pp["p"][1] - Pp["p"][0]
    o.append(W(Pp["bq"], yc, Pp["bq"], ym, c=GLD, lw=1.6))
    o.append(ARR(Pp["bq"], ym, xm0, ym, c=GLD, lw=1.6))
    o.append(TFBOX(xm0, ym, "P̃(s)", wbox, TEA, TSOFT)[0])
    o.append(T(xm0 + wbox / 2, ym + 30, "モデル", "middle", 9.5, TEA))
    xs2 = Pp["by"]
    o.append(ARR(xm0 + wbox, ym, xs2 - R, ym, c=TEA, lw=1.6))
    o.append(TX((xm0 + wbox + xs2 - R) / 2, ym - 7, "ỹ", "middle", 10, TEA, True))
    o.append(ARR(Pp["by"], yc, Pp["by"], ym - R, c=SIG, lw=1.6))
    o.append(SUMJ(xs2, ym, {"t": "+", "l": "−"}))
    yb = ym + 52
    o.append(W(xs2, ym + R, xs2, yb, c=INK, lw=1.6))
    o.append(W(xs2, yb, Pp["s1"], yb, c=INK, lw=1.6))
    o.append(ARR(Pp["s1"], yb, Pp["s1"], yc + R, c=INK, lw=1.6))
    o.append(TX((Pp["s1"] + xs2) / 2, yb - 7, "y − ỹ（外乱とモデルの誤差の分だけ）", "middle", 10, INK, True, halo=True))
    xa, xb_, xc_ = Pp["s1"] - 26, Pp["bq"] + 22, xs2 + 28
    ya, yb2, ybb = yc - 30, ym - 30, yb + 14
    o.append(PL([(xa, ya), (xb_, ya), (xb_, yb2), (xc_, yb2), (xc_, ybb), (xa, ybb), (xa, ya)], c=MUT, lw=1.1, dash="5 4"))
    o.append(T(xc_ - 4, ybb - 5, "制御器", "end", 9.5, MUT, True))
    # (b) 普通のフィードバック制御に直す
    y2 = 274
    o.append(T(14, y2 - 46, "(b) 同じ働きの、普通のフィードバック制御", "start", 11.5, INK, True))
    s2, P2, xe2 = CHAIN(18, y2, [("a", 54, None, MUT), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 40, None, ALI),
                                 ("b", ("Q(s)", "1 − P̃(s)Q(s)"), "c", SIG, SSOFT), ("a", 50, None, GLD), ("b", "P(s)", "p", LIN, PAN),
                                 ("a", 50, None, SIG), ("t", "by", SIG), ("a", 40, None, SIG)])
    o.append(s2)
    o.append(FBPATH(P2["by"], P2["s1"], y2, 34, SIG))
    o.append(TX((P2["c"][0] + P2["c"][1]) / 2, y2 - 28, "C(s)", "middle", 10, SIG, True))
    xt = xe2 + 24
    o.append(TX(xt, y2 - 22, "(a) の点線の枠（制御器）を", "start", 10, INK))
    o.append(TX(xt, y2 - 6, "1 つの伝達関数 C(s) にまとめると、", "start", 10, INK))
    o.append(TX(xt, y2 + 10, "普通のフィードバック制御になる。", "start", 10, INK))
    o.append(TX(xt, y2 + 28, "一次遅れ＋むだ時間のモデルでは、", "start", 10, SIG, True))
    o.append(TX(xt, y2 + 44, "C(s) は PI に近い（本文で導く）", "start", 10, SIG, True))
    return SVG(700, 330, o, "(a) 内部モデル制御。制御器が出す操作量を、本当の対象とモデル P̃(s) の両方に入れ、測った制御量とモデルの出力の差を戻す。モデルが正しく外乱も無ければ、差は 0 で、目標値は Q(s) と P(s) をそのまま通る。(b) 線図をまとめると、制御器は C(s) = Q/(1 − P̃Q) の普通のフィードバック制御と同じで、一次遅れ＋むだ時間のモデルでは、むだ時間を近似すると PI 制御になる。")


F["e11_imc_bd"] = _f11_imc_bd_fig()


def _f11_imc_lambda_fig():
    o = []
    o.append(TX(14, 18, "(a) 温度の板で λ を変える（T_I = T = 500 s、目標値を 1 K 上げる）", "start", 11.5, INK, True))
    p = Plot(62, 34, 330, 130, (0, 400), (-0.1, 1.35))
    o.append(p.axes(xl=None, yl="温度の変化 [K]", xt=[0, 100, 200, 300, 400], yt=[0, 0.5, 1], sz=9, xfmt=lambda v: ""))
    o.append(W(p.X(0), p.Y(1), p.X(400), p.Y(1), c=MUT, lw=1, dash="5 3"))
    q = Plot(62, 186, 330, 96, (0, 400), (-2, 16))
    o.append(q.axes(xl="時間 t [s]", yl="操作量の変化 [W]", xt=[0, 100, 200, 300, 400], yt=[0, 5, 10, 15], sz=9))
    cs = [(10.0, ALI), (20.0, SIG), (40.0, TEA)]
    for k, (lam, c) in enumerate(cs):
        KP = 500.0 / (1.25 * (lam + 20.0))
        a = _f11_sim(_F11_PLATE, KP, 500.0, tEnd=400, n=4000, r=1.0)
        o.append(p.line(list(zip(a["t"], a["y"])), c=c, lw=1.9))
        o.append(q.line(list(zip(a["t"], a["u"])), c=c, lw=1.7))
        ov = (float(a["y"].max()) - 1.0) * 100
        o.append(TX(p.X(395), p.Y(0.42) - k * 14, "λ = %g s: K_P = %s W/K、行き過ぎ %s %%" % (lam, _f11_g(KP, 3), _f11_f(max(ov, 0), 1)), "end", 9.5, c, True, halo=True))
    # (b) 余裕
    o.append(T(430, 18, "(b) λ/L と余裕（式の値）", "start", 11.5, INK, True))
    xs = _f11_np.linspace(0, 3, 200)
    r1 = Plot(470, 34, 210, 100, (0, 3), (30, 90))
    o.append(r1.axes(xl=None, yl="位相余裕 [°]", xt=[0, 0.5, 1, 2, 3], yt=[30, 60, 90], sz=9, xfmt=lambda v: ""))
    o.append(r1.line([(x, 90 - 180 / math.pi / (1 + x)) for x in xs], c=GRN, lw=2))
    r2 = Plot(470, 154, 210, 110, (0, 3), (0, 8))
    o.append(r2.axes(xl="λ/L", yl="倍", xt=[0, 0.5, 1, 2, 3], yt=[0, 2, 4, 6, 8], sz=9, xfmt=_f11_g))
    o.append(r2.line([(x, math.pi / 2 * (1 + x)) for x in xs], c=PUR, lw=2))
    for x in (0.5, 1.0, 2.0):
        pm = 90 - 180 / math.pi / (1 + x); gm = math.pi / 2 * (1 + x)
        o.append(D(r1.X(x), r1.Y(pm), GRN, 3.4)); o.append(D(r2.X(x), r2.Y(gm), PUR, 3.4))
        o.append(T(r1.X(x), r1.Y(pm) + 14, "%s°" % _f11_f(pm, 1), "middle", 9, GRN, True, halo=True))
        o.append(T(r2.X(x) + 5, r2.Y(gm) + 13, _f11_f(gm, 2), "start", 9, PUR, True, halo=True))
    o.append(TX(476, 166, "ゲイン余裕 π(1 + λ/L)/2 [倍]", "start", 9, PUR, True, halo=True))
    o.append(TX(476, 180, "= 安定でいられるむだ時間 [L の倍]", "start", 9, PUR, True, halo=True))
    o.append(TX(r1.x + r1.w - 4, r1.y + r1.h - 8, "φ_m = 90° − 57.3°·L/(λ + L)", "end", 9, GRN, True, halo=True))
    return SVG(700, 330, o, "(a) 温度の板で、閉ループの時定数 λ を 10・20・40 s に選んだ PI（積分時間はどれも 500 s）の、目標値を 1 K 上げたときの応答と操作量。λ を小さくするほど速く、目標値を変えた瞬間の操作量（K<sub>P</sub> × 1 K）が大きくなり、行き過ぎも増える。(b) 位相余裕とゲイン余裕は λ と L の比だけで決まる。ゲイン余裕の倍数は、本当のむだ時間がモデルの何倍まで安定でいられるかと同じ数になる。")


F["e11_imc_lambda"] = _f11_imc_lambda_fig()


def _f11_imc_dist_fig():
    o = []
    cases = [("λ = 20 s、T_I = T = 500 s", 10.0, 500.0, 1.0, TEA, None), ("λ = 20 s、T_I = 4(λ + L) = 160 s", 10.0, 160.0, 1.0, SIG, None),
             ("同じ 160 s、目標値の重み b = 0.5", 10.0, 160.0, 0.5, GRN, "5 3")]
    o.append(T(14, 18, "(a) 逃げる熱が 10 W 増えたとき", "start", 11.5, INK, True))
    p = Plot(62, 34, 300, 150, (0, 2000), (-1.1, 0.15))
    o.append(p.axes(xl="時間 t [s]", yl="温度の変化 [K]", xt=[0, 500, 1000, 1500, 2000], yt=[-1, -0.5, 0], sz=9, yfmt=_f11_g))
    o.append(W(p.X(0), p.Y(0), p.X(2000), p.Y(0), c=MUT, lw=1))
    o.append(T(392, 18, "(b) 目標値を 1 K 上げたとき", "start", 11.5, INK, True))
    q = Plot(422, 34, 260, 150, (0, 800), (-0.1, 1.3))
    o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 200, 400, 600, 800], yt=[0, 0.5, 1], sz=9))
    o.append(W(q.X(0), q.Y(1), q.X(800), q.Y(1), c=MUT, lw=1, dash="5 3"))
    for k, (lab, KP, TI, b, c, dash) in enumerate(cases):
        if k < 2:
            a = _f11_sim(_F11_PLATE, KP, TI, tEnd=5000, n=50000, r=35.0, u0=28.0, d=lambda t: -10.0)
            m = a["t"] <= 2000
            o.append(p.line(list(zip(a["t"][m], a["y"][m] - 35)), c=c, lw=1.9))
            iae = float(_f11_np.trapezoid(_f11_np.abs(a["e"]), a["t"]))
            o.append(TX(p.X(1980), p.Y(-0.62) - (1 - k) * 15, "IAE %s K·s" % _f11_f(iae, 0), "end", 9.5, c, True, halo=True))
        b2 = _f11_sim(_F11_PLATE, KP, TI, b=b, tEnd=800, n=8000, r=1.0)
        o.append(q.line(list(zip(b2["t"], b2["y"])), c=c, lw=1.9, dash=dash))
        ov = max(0.0, (float(b2["y"].max()) - 1.0) * 100)
        o.append(T(q.X(790), q.Y(0.45) - k * 14, "行き過ぎ %s %%" % _f11_f(ov, 1), "end", 9.5, c, True, halo=True))
    o.append(LEGL(62, 226, [(TEA, None, cases[0][0]), (SIG, None, cases[1][0])], 9.5, 14))
    o.append(LEGL(62, 246, [(GRN, "5 3", cases[2][0] + "（外乱への応答は (a) の 160 s と同じ）")], 9.5, 14))
    return SVG(700, 256, o, "温度の板の λ = 20 s の PI で、積分時間の決め方を比べる。(a) T<sub>I</sub> = T では、打ち消した板の極（時定数 500 s）が外乱への応答に残り、戻るのが遅い。T<sub>I</sub> = 4(λ + L) に短くすると、積分ゲインが 3.1 倍になり、IAE は 500 から 160 K·s に減る。(b) 代わりに、目標値への行き過ぎが 4.1 % から 19.3 % に増えるが、目標値の重みを 0.5 にすると、外乱への応答を変えずに 0 % にできる。")


F["e11_imc_dist"] = _f11_imc_dist_fig()


# =====================================================================
# 4 節: 飽和と積分のワインドアップ
# =====================================================================
def _f11_heat(KP=10.0, TI=160.0, aw="none", Tt=None, tE=1500.0, n=15000, **k):
    """25 °C の板を 60 °C に温める（ヒータ 0〜80 W）。"""
    return _f11_sim(_F11_PLATE, KP, TI, tEnd=tE, n=n, r=35.0, umin=0.0, umax=80.0, aw=aw, Tt=Tt, every=1, **k)


def _f11_settle(t, y, yf, band):
    out = _f11_np.where(_f11_np.abs(_f11_np.asarray(y) - yf) > band)[0]
    return float(t[out[-1] + 1]) if len(out) and out[-1] + 1 < len(t) else None


def _f11_windup_fig():
    o = []
    a = _f11_heat(tE=3000, n=30000)
    t, y, u, uc, uI, e = a["t"], a["y"], a["u"], a["uc"], a["I"], a["e"]
    ep = float(_f11_np.trapezoid(_f11_np.clip(e, 0, None), t)); en = float(_f11_np.trapezoid(_f11_np.clip(-e, 0, None), t))
    m = t <= 1000
    o.append(TX(14, 18, "(a) 板の温度（PI 10 W/K・160 s、対策なし。目標 60 °C）", "start", 11.5, INK, True))
    p = Plot(62, 32, 610, 150, (0, 1000), (20, 80))
    o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 200, 400, 600, 800, 1000], yt=[20, 40, 60, 80], sz=9, xfmt=lambda v: ""))
    tt = t[m]
    # 正と負の面積（目標値の線と温度の間）
    for sg, c in ((1, SIG), (-1, ALI)):
        run = []
        for a_, b_ in zip(tt, 25 + y[m]):
            if sg * (60 - b_) > 0:
                run.append((a_, b_))
            elif run:
                if len(run) > 1:
                    o.append(PL([(p.X(run[0][0]), p.Y(60))] + [(p.X(x), p.Y(v)) for x, v in run] + [(p.X(run[-1][0]), p.Y(60))], c="none", lw=0, fill=soft(c)))
                run = []
        if len(run) > 1:
            o.append(PL([(p.X(run[0][0]), p.Y(60))] + [(p.X(x), p.Y(v)) for x, v in run] + [(p.X(run[-1][0]), p.Y(60))], c="none", lw=0, fill=soft(c)))
    o.append(W(p.X(0), p.Y(60), p.X(1000), p.Y(60), c=MUT, lw=1.1, dash="5 3"))
    o.append(p.line(list(zip(tt, 25 + y[m])), c=SIG, lw=2.1))
    k = int(_f11_np.argmax(y))
    o.append(T(p.X(t[k]) + 8, p.Y(25 + y[k]) + 4, "%s °C（%s s）" % (_f11_f(25 + y[k], 1), _f11_f(t[k], 0)), "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(120), p.Y(48), "正の面積 %s K·s" % _f11_f(ep, 0), "middle", 10, SIG, True, halo=True))
    o.append(T(p.X(420), p.Y(63), "負の面積 %s K·s" % _f11_f(en, 0), "middle", 10, ALI, True, halo=True))
    o.append(TX(p.X(990), p.Y(30), "差 %s K·s ＝ 28 W ÷ K_I（0.0625 W/(K·s)）" % _f11_f(ep - en, 0), "end", 10, INK, True, halo=True))
    ix = int(_f11_np.argmax(y >= 35.0))
    o.append(W(p.X(t[ix]), p.Y(20), p.X(t[ix]), p.Y(80), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(t[ix]) - 4, p.Y(76), "%s s: 60 °C に届く" % _f11_f(t[ix], 0), "end", 9.5, MUT, halo=True))
    # (b) 操作量
    o.append(TX(14, 214, "(b) 計算した操作量 u_c・実際の操作量 u・I の分 u_I", "start", 11.5, INK, True))
    q = Plot(62, 228, 610, 150, (0, 1000), (-50, 400))
    o.append(q.axes(xl="時間 t [s]", yl="[W]", xt=[0, 200, 400, 600, 800, 1000], yt=[0, 80, 200, 300, 400], sz=9, yfmt=_f11_g))
    o.append(W(q.X(0), q.Y(80), q.X(1000), q.Y(80), c=ALI, lw=1, dash="4 3"))
    o.append(W(q.X(0), q.Y(28), q.X(1000), q.Y(28), c=MUT, lw=1, dash="2 3"))
    o.append(q.clip(list(zip(tt, uc[m])), c=GLD, lw=1.4, dash="5 3"))
    o.append(q.line(list(zip(tt, u[m])), c=GLD, lw=2.1))
    o.append(q.line(list(zip(tt, uI[m])), c=GRN, lw=1.9))
    ks = int(_f11_np.where(u >= 80 - 1e-9)[0][-1])
    o.append(T(q.X(t[ks]) - 6, q.Y(42), "%s s まで 80 W に張り付く" % _f11_f(t[ks], 0), "end", 9.5, GLD, True, halo=True))
    kI = int(_f11_np.argmax(uI))
    o.append(TX(q.X(t[kI]) + 8, q.Y(uI[kI]) - 4, "u_I = %s W（%s s）" % (_f11_f(uI[kI], 0), _f11_f(t[kI], 0)), "start", 9.5, GRN, True, halo=True))
    o.append(T(q.X(990), q.Y(80) + 13, "上限 80 W", "end", 9, ALI, halo=True))
    o.append(T(q.X(990), q.Y(28) + 13, "保つのに要る 28 W", "end", 9, MUT, halo=True))
    o.append(LEGL(62, 436, [(GLD, "5 3", "計算した操作量 u_c"), (GLD, None, "実際の操作量 u"), (GRN, None, "I の分 u_I")], 9.5, 14))
    return SVG(700, 444, o, "25 °C の板を 60 °C に温める（ヒータは 0〜80 W、アンチワインドアップなし）。温める間、計算した操作量は 80 W を大きく越え、ヒータは張り付く。その間も I の分は正の偏差をため続け、目標に届いた %s s には %s W になっている。I の分は負の偏差の面積の分しか減らないので、ヒータは %s s まで 80 W のままで、温度は %s °C まで上がる。偏差の面積の合計（正 − 負）は、I の分の始め 0 W と終わり 28 W の差を K<sub>I</sub> で割った 448 K·s に決まっている。" % (_f11_f(t[ix], 0), _f11_f(uI[kI], 0), _f11_f(t[ks], 0), _f11_f(25 + y[k], 1)))


F["e11_windup"] = _f11_windup_fig()


_F11_AW = [("none", None, ALI, "対策なし"), ("clamp", None, SIG, "クランプ"), ("back", 80.0, GRN, "バックカリキュレーション（T_t = 80 s）")]


def _f11_aw_cmp_fig():
    o = []
    res = [(_f11_heat(aw=aw, Tt=Tt, tE=1500, n=15000), c, lab) for aw, Tt, c, lab in _F11_AW]
    o.append(T(14, 18, "(a) 板の温度（同じ PI 10 W/K・160 s）", "start", 11.5, INK, True))
    p = Plot(62, 32, 610, 130, (0, 1000), (20, 80))
    o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 200, 400, 600, 800, 1000], yt=[20, 40, 60, 80], sz=9, xfmt=lambda v: ""))
    o.append(W(p.X(0), p.Y(60), p.X(1000), p.Y(60), c=MUT, lw=1.1, dash="5 3"))
    o.append(T(14, 192, "(b) 実際の操作量", "start", 11.5, INK, True))
    q = Plot(62, 204, 610, 80, (0, 1000), (0, 90))
    o.append(q.axes(xl=None, yl="u [W]", xt=[0, 200, 400, 600, 800, 1000], yt=[0, 28, 80], sz=9, xfmt=lambda v: ""))
    o.append(TX(14, 312, "(c) I の分 u_I", "start", 11.5, INK, True))
    z = Plot(62, 324, 610, 90, (0, 1000), (-150, 300))
    o.append(z.axes(xl="時間 t [s]", yl="u_I [W]", xt=[0, 200, 400, 600, 800, 1000], yt=[-100, 0, 100, 200, 300], sz=9, yfmt=_f11_g))
    o.append(W(z.X(0), z.Y(28), z.X(1000), z.Y(28), c=MUT, lw=1, dash="2 3"))
    o.append(T(z.X(990), z.Y(28) - 4, "28 W", "end", 9, MUT, halo=True))
    for i, (a, c, lab) in enumerate(res):
        t = a["t"]; m = t <= 1000
        o.append(p.line(list(zip(t[m], 25 + a["y"][m])), c=c, lw=2.0))
        o.append(q.line(list(zip(t[m], a["u"][m])), c=c, lw=1.7))
        o.append(z.clip(list(zip(t[m], a["I"][m])), c=c, lw=1.7))
        ts = _f11_settle(t, 25 + a["y"], 60.0, 0.5)
        mx = 25 + float(a["y"].max())
        txt = ("最高 %s °C、" % _f11_f(mx, 1) if mx > 60.5 else "行き過ぎなし、") + "±0.5 K に入るのは %s s" % _f11_f(ts, 0)
        o.append(TX(p.X(990), p.Y(36) - (2 - i) * 14, lab + ": " + txt, "end", 9.5, c, True, halo=True))
    return SVG(700, 454, o, "アンチワインドアップの比較。クランプは、ヒータが上限に張り付いていて偏差が正の間、積分を止める。バックカリキュレーションは、計算した操作量と実際の操作量の差を時定数 T<sub>t</sub> で積分に戻すので、張り付いている間 I の分が下がる。どちらも行き過ぎを無くし、±0.5 K に入るまでの時間を対策なしの半分ほどにする。I の分は張り付きが解けてから 28 W までためるので、最後はゆっくり近づく。")


F["e11_aw_cmp"] = _f11_aw_cmp_fig()


# =====================================================================
# 5 節: 手動と自動の切り替え・ゲインの変更
# =====================================================================
def _f11_bump_fig():
    o = []
    man = lambda t: 30.0 if t < 300 else None
    A = _f11_sim(_F11_PLATE, 10.0, 160.0, tEnd=1500, n=15000, r=35.0, u0=30.0, I0=0.0, manual=man, track="none", umin=0, umax=80, aw="clamp", every=1)
    B = _f11_sim(_F11_PLATE, 10.0, 160.0, tEnd=1500, n=15000, r=35.0, u0=30.0, I0=0.0, manual=man, track="track", umin=0, umax=80, aw="clamp", every=1)
    g = lambda t: (10.0, 160.0, 0.0) if t < 300 else (20.0, 80.0, 0.0)
    C = _f11_sim(_F11_PLATE, 10.0, 160.0, tEnd=1500, n=15000, r=35.0, u0=28.0, gains=g, gin=False, umin=0, umax=80, aw="clamp", every=1)
    D_ = _f11_sim(_F11_PLATE, 10.0, 160.0, tEnd=1500, n=15000, r=35.0, u0=28.0, gains=g, gin=True, umin=0, umax=80, aw="clamp", every=1)
    for j, (title, X, Y, labs) in enumerate((("(a) 手動 30 W から、300 s に自動へ切り替える", A, B, ("I の分が 0 のまま", "I の分を合わせておく")),
                                            ("(b) 60 °C で、300 s にゲインを強くする", C, D_, ("I の分 = (K_P/T_I)∫e dt", "I の分 = ∫K_I e dt")))):
        x0 = 62 + j * 340
        o.append(TX(x0 - 48, 18, title, "start", 11, INK, True))
        p = Plot(x0, 34, 280, 130, (0, 1200), (56, 66))
        o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 300, 600, 900, 1200], yt=[56, 58, 60, 62, 64, 66], sz=9, xfmt=lambda v: ""))
        q = Plot(x0, 186, 280, 100, (0, 1200), (0, 90))
        o.append(q.axes(xl="時間 t [s]", yl="u [W]", xt=[0, 300, 600, 900, 1200], yt=[0, 28, 80], sz=9))
        if j == 0:
            o.append(RECT(p.X(0), p.y, p.X(300) - p.X(0), p.h, 0, MSOFT, "none", 0))
            o.append(RECT(q.X(0), q.y, q.X(300) - q.X(0), q.h, 0, MSOFT, "none", 0))
            o.append(T(p.X(150), p.y + 12, "手動", "middle", 9.5, MUT, True))
            o.append(T(p.X(310), p.y + 12, "自動", "start", 9.5, MUT, True))
        else:
            o.append(W(p.X(300), p.y, p.X(300), p.y + p.h, c=MUT, lw=1, dash="3 3"))
            o.append(W(q.X(300), q.y, q.X(300), q.y + q.h, c=MUT, lw=1, dash="3 3"))
            o.append(T(p.X(294), p.y + 12, "ゲインを変える", "end", 9.5, MUT, True))
        o.append(W(p.X(0), p.Y(60), p.X(1200), p.Y(60), c=MUT, lw=1, dash="5 3"))
        for R_, c, lab, k in ((X, ALI, labs[0], 0), (Y, GRN, labs[1], 1)):
            t = R_["t"]; m = t <= 1200
            o.append(p.line(list(zip(t[m], 25 + R_["y"][m])), c=c, lw=2.0))
            o.append(q.line(list(zip(t[m], R_["u"][m])), c=c, lw=1.8))
        a, b = (A, B) if j == 0 else (C, D_)
        ka = int(_f11_np.argmin(a["y"])) if j == 0 else int(_f11_np.argmax(a["y"]))
        o.append(T(p.X(a["t"][ka]) + 10, p.Y(25 + a["y"][ka]) + (12 if j == 0 else 4), "%s °C" % _f11_f(25 + a["y"][ka], 1), "start", 9.5, ALI, True, halo=True))
        if j == 1:
            o.append(TX(p.X(1190), p.Y(57.2), "10 W/K・160 s → 20 W/K・80 s", "end", 9, MUT, halo=True))
        o.append(LEGL(x0 - 48, 326, [(ALI, None, labs[0])], 9.5))
        o.append(LEGL(x0 - 48, 342, [(GRN, None, labs[1])], 9.5))
    return SVG(700, 350, o, "(a) 手動で 30 W を出して 62.5 °C で落ち着いている板を、300 s に自動（目標 60 °C、PI 10 W/K・160 s）へ切り替える。I の分が 0 のままだと、切り替えた瞬間の操作量は 10 × (−2.5) = −25 W でヒータは 0 W に落ち、板は 57.4 °C まで下がる。I の分を手動の操作量に合わせておくと、30 W から跳ねずに 28 W へ移る。(b) 60 °C で落ち着いた板で、運転中にゲインを強くする。I の分を ∫e dt に K<sub>P</sub>/T<sub>I</sub> を掛けて作る形では、それまでの面積に新しいゲインが掛かって I の分が 28 W から 112 W に跳ね、板は 64.9 °C まで上がる。ゲインを積分の中に入れる形では跳ねない。")


F["e11_bump"] = _f11_bump_fig()


# =====================================================================
# 6 節: 調整の手順と温度の板の例
# =====================================================================
def _f11_steps_fig():
    o = []
    steps = [("1. 仕様", "評価指標で決める", "", "（1 節）"), ("2. 測る", "ステップ・リレー", "・周波数掃引", "（2 節、3・8 章）"),
             ("3. モデル", "K・T・L を求める", "", "（3 章 4・5 節）"), ("4. 初期値", "λ = 2L から", "ノイズなら PI", "（3 節）"),
             ("5. 試す", "目標値・外乱・", "ノイズ・余裕", "（1 節）"), ("6. 直す", "λ を変える", "", "（3 節）")]
    xs = [14 + i * 114 for i in range(6)]
    y0 = 40
    for i, (a_, b_, c_, d_) in enumerate(steps):
        c = SIG if i < 4 else (GRN if i == 4 else GLD)
        o.append(RECT(xs[i], y0, 100, 86, 8, soft(c), c, 1.4))
        o.append(T(xs[i] + 50, y0 + 20, a_, "middle", 11, c, True))
        o.append(TX(xs[i] + 50, y0 + 41, b_, "middle", 9.5, INK))
        if c_:
            o.append(TX(xs[i] + 50, y0 + 56, c_, "middle", 9.5, INK))
        o.append(T(xs[i] + 50, y0 + 76, d_, "middle", 9, MUT))
        if i < 5:
            o.append(ARR(xs[i] + 100, y0 + 43, xs[i + 1], y0 + 43, c=MUT, lw=1.5, head=6))
    yl = y0 + 108
    o.append(W(xs[5] + 50, y0 + 86, xs[5] + 50, yl, xs[4] + 50, yl, c=GLD, lw=1.6))
    o.append(ARR(xs[4] + 50, yl, xs[4] + 50, y0 + 88, c=GLD, lw=1.6, head=6))
    o.append(T((xs[4] + xs[5]) / 2 + 50, yl + 16, "満たすまで 5 と 6 を繰り返す", "middle", 9.5, GLD, True))
    o.append(T(14, 18, "調整の手順", "start", 11.5, INK, True))
    o.append(RECT(14, 196, 672, 52, 6, GSOFT, GRN, 1.1))
    o.append(T(24, 216, "最初から入れておくもの: 操作量の範囲とアンチワインドアップ（4 節）、手動と自動のバンプレス切り替え（5 節）、", "start", 10, INK))
    o.append(T(24, 234, "測定値微分と目標値の重み（10 章 6 節）。調整の試験を、実際の機器で安全に繰り返せるようにする。", "start", 10, INK))
    return SVG(700, 256, o, "調整の手順。仕様を評価指標で決め、対象を測ってモデルを作り、穏やかな初期値から始めて、試しては直す。試すときは、モデルの値をずらしたときの余裕も確かめる。")


F["e11_steps"] = _f11_steps_fig()


def _f11_final_run(lam, Ktrue=1.25, Ttrue=500.0, Ltrue=20.0, tE=3000, n=30000):
    Km, Tm, Lm = 1.249, 502.0, 18.0
    KP = Tm / (Km * (lam + Lm)); TI = min(Tm, 4 * (lam + Lm))
    P = ([Ktrue], [Ttrue, 1.0], Ltrue)
    a = _f11_sim(P, KP, TI, tEnd=tE, n=n, r=35.0, umin=0.0, umax=80.0, aw="clamp", d=lambda t: -10.0 if t >= 1500 else 0.0,
                 noise=_f11_noise(_F11_SEED, 0.3, tE + 2), every=1)
    return a, KP, TI


def _f11_plate_final_fig():
    o = []
    runs = [(36.0, TEA, "λ = 36 s（7.44 W/K・216 s）"), (18.0, SIG, "λ = 18 s（11.2 W/K・144 s）")]
    res = [(_f11_final_run(lam)[0], c, lab) for lam, c, lab in runs]
    o.append(T(14, 18, "(a) 板の温度（観測ノイズ 0.3 K。1500 s に逃げる熱が 10 W 増える）", "start", 11.5, INK, True))
    p = Plot(62, 32, 400, 140, (0, 3000), (20, 66))
    o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 500, 1000, 1500, 2000, 2500, 3000], yt=[20, 30, 40, 50, 60], sz=9, xfmt=lambda v: ""))
    o.append(W(p.X(1500), p.y, p.X(1500), p.y + p.h, c=PUR, lw=1, dash="3 3"))
    o.append(T(p.X(1510), p.y + 12, "外乱", "start", 9.5, PUR, True))
    q = Plot(62, 196, 400, 90, (0, 3000), (0, 90))
    o.append(q.axes(xl="時間 t [s]", yl="u [W]", xt=[0, 500, 1000, 1500, 2000, 2500, 3000], yt=[0, 40, 80], sz=9))
    o.append(T(486, 18, "(b) 外乱の前後を拡大", "start", 11.5, INK, True))
    z = Plot(516, 32, 166, 140, (1400, 2000), (58.6, 60.8))
    o.append(z.axes(xl=None, yl=None, xt=[1400, 1700, 2000], yt=[59, 59.5, 60, 60.5], sz=9, xfmt=lambda v: ""))
    o.append(RECT(z.x, z.Y(60.5), z.w, z.Y(59.5) - z.Y(60.5), 0, GSOFT, "none", 0))
    o.append(W(z.X(1400), z.Y(59), z.X(2000), z.Y(59), c=ALI, lw=1, dash="4 3"))
    o.append(T(z.X(1995), z.Y(59) - 5, "下がりの仕様 1 K", "end", 9, ALI, halo=True))
    o.append(T(z.X(1995), z.Y(60.5) - 4, "±0.5 K", "end", 9, GRN, halo=True))
    zq = Plot(516, 196, 166, 90, (1400, 2000), (0, 90))
    o.append(zq.axes(xl="時間 t [s]", yl=None, xt=[1400, 1700, 2000], yt=[0, 40, 80], sz=9))
    rnd = lambda v: "%d" % int(math.floor(v + 0.5))
    vals = []
    for a, c, lab in res:
        t = a["t"]
        o.append(p.line(list(zip(t[::5], 25 + a["y"][::5])), c=c, lw=1.8))
        o.append(q.line(list(zip(t[::10], a["u"][::10])), c=c, lw=1.0))
        m = (t >= 1400) & (t <= 2000)
        o.append(z.line(list(zip(t[m], 25 + a["y"][m])), c=c, lw=1.8))
        o.append(zq.line(list(zip(t[m], a["u"][m])), c=c, lw=1.0))
        m2 = t >= 1500
        k = int(_f11_np.argmin(_f11_np.where(m2, a["y"], 1e9)))
        o.append(D(z.X(t[k]), z.Y(25 + a["y"][k]), c, 3.4))
        out = _f11_np.where(_f11_np.abs(a["y"][m2] - 35.0) > 0.5)[0]
        vals.append((_f11_f(35 - a["y"][k], 2), rnd(t[m2][out[-1] + 1] - 1500)))
    o.append(LEGL(62, 340, [(TEA, None, runs[0][2] + ": 外乱の下がり %s K が仕様の 1 K を越える" % vals[0][0])], 9.5, 14))
    o.append(LEGL(62, 356, [(SIG, None, runs[1][2] + ": 下がり %s K で仕様を満たす" % vals[1][0])], 9.5, 14))
    return SVG(700, 364, o, "3 章 5 節で読んだモデル（1.249 K/W・502 s・18 s）から決めた PI を、本当の板（1.25 K/W・500 s・20 s、ヒータ 0〜80 W、クランプのアンチワインドアップ、観測ノイズ 0.3 K）で試す。λ = 36 s では、逃げる熱が 10 W 増えたときの下がりが %s K で、仕様の 1 K を越える。λ を 18 s に下げると %s K に収まり、±0.5 K に戻るまでの時間も %s s から %s s に縮む。(b) の点は、それぞれの最も下がった所。" % (vals[0][0], vals[1][0], vals[0][1], vals[1][1]))


F["e11_plate_final"] = _f11_plate_final_fig()


def _f11_quant_run(qu=8.0, KP=10.0, TI=160.0, tE=3000.0):
    """ヒータの電力を qu [W] 刻みでしか出せない温度の板の PI（1 s ごと、60 °C で落ち着いた所から）。"""
    a, Ld, n = math.exp(-1.0 / 500.0), 20, int(tE)
    y, u, buf, I = _f11_np.zeros(n + 1), _f11_np.zeros(n), [28.0] * Ld, 28.0
    y[0] = 35.0
    for k in range(n):
        e = 35.0 - y[k]
        u[k] = min(80.0, max(0.0, qu * math.floor((KP * e + I) / qu + 0.5)))
        I += KP / TI * e
        buf.append(u[k])
        y[k + 1] = a * y[k] + (1 - a) * 1.25 * buf.pop(0)
    return _f11_np.arange(n + 1, dtype=float), y, u


def _f11_diag_fig():
    o = []
    cells = [("振れが続く・大きく行き過ぎる", "強すぎる。むだ時間が延びた", "→ K_P を下げ T_I を延ばす（λ を上げる）", ALI),
             ("外乱の後、戻るのが遅い", "I が弱い（T_I = T のまま）", "→ T_I を短く（4(λ + L) まで）", SIG),
             ("温めた後に大きく行き過ぎる", "ワインドアップ", "→ アンチワインドアップ（4 節）", ALI),
             ("操作量がばたつく", "D 動作がノイズを大きくする", "→ N・T_D を下げる、PI にする", GLD),
             ("切り替えた瞬間に跳ねる", "積分と操作量の食い違い", "→ バンプレス切り替え（5 節）", GLD),
             ("小さな振れがいつまでも続く", "量子化・摩擦（線形でない要素）", "→ 16 章 3 節（ゲインでは消えない）", TEA)]
    # 小さな波形（その症状が出る計算）
    w1 = _f11_sim(_F11_PLATE, 14.37, 65.62, tEnd=600, n=6000, r=1.0)
    w2 = _f11_sim(_F11_PLATE, 10.0, 500.0, tEnd=2500, n=12500, r=0.0, d=lambda t: -10.0)
    w3 = _f11_heat(tE=1200, n=6000)
    w4 = _f11_sim(_F11_PLATE, 19.16, 39.37, 9.84, N=10.0, tEnd=300, n=3000, r=35.0, u0=28.0, noise=_f11_noise(_F11_SEED, 0.3, 302))
    w5 = _f11_sim(_F11_PLATE, 10.0, 160.0, tEnd=900, n=4500, r=35.0, u0=30.0, I0=0.0, manual=lambda t: 30.0 if t < 300 else None, umin=0, umax=80, aw="clamp")
    t6, y6, _ = _f11_quant_run()
    m6 = t6 >= 2400
    amp = [float(_f11_np.ptp(_f11_quant_run(KP=kp, TI=ti)[1][2400:])) for kp, ti in ((2.5, 640.0), (14.4, 65.6))]
    waves = [(w1["t"], w1["y"], (0, 600), (-0.1, 1.8), 1.0), (w2["t"], w2["y"], (0, 2500), (-1.0, 0.2), 0.0),
             (w3["t"], 25 + w3["y"], (0, 1200), (20, 80), 60.0), (w4["t"], w4["u"], (0, 300), (-150, 200), 28.0),
             (w5["t"], w5["u"], (0, 900), (-5, 40), None), (t6[m6] - 2400, 25 + y6[m6], (0, 600), (59.4, 60.6), 60.0)]
    for i, ((sy, cause, act, c), (tw_, yw, xr, yr, ref)) in enumerate(zip(cells, waves)):
        col, row = i % 3, i // 3
        x0, y0 = 14 + col * 228, 34 + row * 172
        o.append(RECT(x0, y0, 216, 160, 8, PAN, LIN, 1.0))
        o.append(T(x0 + 10, y0 + 18, sy, "start", 10.5, c, True))
        p = Plot(x0 + 12, y0 + 28, 192, 62, xr, yr)
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.6))
        if ref is not None:
            o.append(W(p.X(xr[0]), p.Y(ref), p.X(xr[1]), p.Y(ref), c=MUT, lw=1, dash="4 3"))
        o.append(p.clip(list(zip(tw_, yw)), c=c, lw=1.5))
        o.append(TX(x0 + 10, y0 + 112, "疑う: " + cause, "start", 9.5, INK))
        o.append(TX(x0 + 10, y0 + 132, act, "start", 9.5, INK, True))
    o.append(T(14, 18, "調整の途中で見る症状と、まず疑うこと（小さな図は、その症状が出る例の計算）", "start", 11.5, INK, True))
    return SVG(700, 384, o, "よく見る症状と、まず疑うこと。上段は、強さ・積分・ワインドアップの問題で、ゲインと対策で直せる。下段の操作量のばたつき・切り替えの跳ねは、微分とバンプレス切り替えの問題である。一定の振れ幅の小さな振れが続くのは、量子化（値を決まった刻みでしか出せない・読めないこと）や摩擦のような、線形でない要素（2 章 1 節）が原因のことが多い。右下の例は、ヒータの電力を 8 W 刻みでしか出せない板で、保つのに要る 28 W を出せず、24 W と 32 W を行き来して振れ続ける。K<sub>P</sub> を 2.5〜14.4 W/K に変えても、振れ幅（山から谷）は %s〜%s K のままで、ゲインでは消えない（量子化は 16 章 3 節）。" % (_f11_f(min(amp), 2), _f11_f(max(amp), 2)))


F["e11_diag"] = _f11_diag_fig()
