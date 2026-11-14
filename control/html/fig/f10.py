# -*- coding: utf-8 -*-
# 10 章 PID 制御 の図
import numpy as _f10_np
from scipy.linalg import expm as _f10_expm
from scipy import signal as _f10_sg

# =====================================================================
# 補助
# =====================================================================
def _f10_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f10_g(v, d=3):
    """有効数字 d 桁（負号は −）。"""
    return (("%." + str(d) + "g") % v).replace("-", "−")


def _f10_n(v):
    return ("%g" % v).replace("-", "−")


# 色の約束（この章）: P の分 = 金、I の分 = 緑、D の分 = 青緑、操作量の合計 = 黒、制御量 = 青、目標値 = 灰の破線、外乱 = 紫
_F10_CP, _F10_CI, _F10_CD = GLD, GRN, TEA

# 制御対象（状態空間 A・B・C と、測った値の遅れ L）。値はどれも例の値
_F10_PL = {
    "cart": (_f10_np.array([[-2.0]]), _f10_np.array([1.0]), _f10_np.array([1.0]), 0.0),       # 台車の速度 0.5/(0.5s + 1)
    "mspd": (_f10_np.array([[-20.0]]), _f10_np.array([1000.0]), _f10_np.array([1.0]), 0.0),   # モータの角速度 50/(0.05s + 1)
    "mpos": (_f10_np.array([[0.0, 1.0], [0.0, -20.0]]), _f10_np.array([0.0, 1000.0]),
             _f10_np.array([1.0, 0.0]), 0.0),                                                 # モータの角度 1000/(s(s + 20))
    "plate": (_f10_np.array([[-0.002]]), _f10_np.array([0.0025]), _f10_np.array([1.0]), 20.0),  # 温度の板（周りとの差）
}


def _f10_sim(pl, KP, KI=0.0, KD=0.0, tend=1.0, h=1e-4, r=None, d=None, N=None, dmode="y", b=1.0,
             x0=None, I0=0.0, L=None, noise=None, every=1):
    """刻み h ごとに PID を計算して次の刻みまで保ち、対象は厳密に離散化して進める（デモと同じ計算）。
    P の分 K_P(b r − y_m)、I の分 K_I∫(r − y_m)dt、D の分は dmode="y" なら −K_D dy_m/dt、"e" なら K_D de/dt
    （微分は 1 刻み前との差。N を与えると不完全微分）。y_m は測った値（L だけ遅れ、noise を足す）。
    d(t) は操作量に足す外乱。返り値は辞書（t, y, ym, u, uP, uI, uD）。"""
    A, B, C, L0 = _F10_PL[pl]
    L = L0 if L is None else L
    r = r or (lambda t: 1.0)
    d = d or (lambda t: 0.0)
    n = A.shape[0]
    M = _f10_np.zeros((n + 1, n + 1)); M[:n, :n] = A * h; M[:n, n] = B * h
    E = _f10_expm(M); Ad = E[:n, :n]; Bd = E[:n, n]
    nd = int(round(L / h)); steps = int(round(tend / h))
    x = _f10_np.zeros(n) if x0 is None else _f10_np.array(x0, dtype=float)
    hist = [float(C @ x)] * (nd + 1)
    I, Df, prev = I0, 0.0, None
    keys = ("t", "y", "ym", "u", "uP", "uI", "uD")
    out = {k: [] for k in keys}
    for k in range(steps + 1):
        t = k * h
        y = float(C @ x)
        hist.append(y); ym = hist[-1 - nd]
        if noise is not None:
            ym += noise[k]
        rr = r(t); e = rr - ym
        sig = -ym if dmode == "y" else e
        if prev is None:
            prev = sig
        if KD:
            if N is None:
                Df = KD * (sig - prev) / h
            else:
                Tf = KD / KP / N
                Df = Tf / (Tf + h) * Df + KD / (Tf + h) * (sig - prev)
        prev = sig
        uP = KP * (b * rr - ym); uI = I; uD = Df
        u = uP + uI + uD
        if k % every == 0:
            for kk, vv in zip(keys, (t, y, ym, u, uP, uI, uD)):
                out[kk].append(vv)
        I += KI * h * e
        x = Ad @ x + Bd * (u + d(t))
    return {k: _f10_np.array(v) for k, v in out.items()}


def _f10_cl_step(num, den, t):
    """伝達関数 num/den の単位ステップ応答。"""
    return _f10_sg.step((num, den), T=t)[1]


def _f10_metrics(t, y, yf, t0=0.0, t1=None, band=0.02):
    """行き過ぎ量 [%] と ±band の整定時間 [s]（t0 から測る）。"""
    m = (t >= t0) & (t <= (t1 if t1 is not None else t[-1]))
    tt, yy = t[m], y[m]
    mp = (yy.max() - yf) / abs(yf) * 100
    out = _f10_np.where(_f10_np.abs(yy - yf) > band * abs(yf))[0]
    ts = (tt[out[-1] + 1] - t0) if len(out) and out[-1] + 1 < len(tt) else (float("nan") if len(out) else 0.0)
    return mp, ts


def _f10_sp(p, xt, yt, xl="実部", yl="虚部", zeta=None):
    """s 平面の地（枠・目盛・右半平面の薄い赤・軸）。"""
    o = [RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8), SPLANE(p, rhp=True, zeta=zeta)]
    o.append(p.axes(xl=xl, yl=yl, xt=xt, yt=yt, xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(SPLANE(p, rhp=False))
    return "".join(o)


def _f10_band(p, t0, t1, c=PUR):
    """時間軸の区間を薄く塗る（外乱が入っている間など）。"""
    return RECT(p.X(t0), p.y, p.X(t1) - p.X(t0), p.h, 0, soft(c), "none", 0)


import re as _f10_re


def _f10_cap(s):
    """図の説明文（HTML）で K_P・T_{2%} などを添字のタグにする。"""
    s = _f10_re.sub(r"([A-Za-zωζθτ])_\{([^}]*)\}", r"\1<sub>\2</sub>", s)
    return _f10_re.sub(r"([A-Za-zωζθτ])_([A-Za-z0-9]+)", r"\1<sub>\2</sub>", s)


def _f10_svg(w, h, o, cap):
    return SVG(w, h, o, _f10_cap(cap))


# =====================================================================
# 1 節: 偏差のどこを見るか
# =====================================================================
def _f10_views_fig():
    o = []
    t = _f10_np.linspace(0, 0.3, 3001)
    th = _f10_cl_step([840.0], [1.0, 20.0, 840.0], t)
    e = 1.0 - th
    t1 = 0.045
    k1 = int(round(t1 / (t[1] - t[0])))
    e1 = e[k1]
    de1 = (e[k1 + 1] - e[k1 - 1]) / (2 * (t[1] - t[0]))
    o.append(TX(14, 18, "モータの角度の比例制御（K_P = 0.84 V/rad）で、目標を 1 rad 変えた後の偏差 e(t)。時刻 t_1 = 0.045 s で、どこを見るか", "start", 10.5, INK, True))
    panels = [("(a) 今の値", "e(t_1) = %s rad" % _f10_f(e1, 2), "P 動作: K_P e（この節）", _F10_CP),
              ("(b) これまでの面積", "∫e dt = %s rad·s" % _f10_f(_f10_np.trapezoid(e[:k1 + 1], t[:k1 + 1]), 4), "面積に比例する働き（2 節）", _F10_CI),
              ("(c) 今の傾き", "de/dt = %s rad/s" % _f10_f(de1, 1), "傾きに比例する働き（3 節）", _F10_CD)]
    for j, (title, val, act, c) in enumerate(panels):
        x0 = 56 + j * 222
        p = Plot(x0, 52, 172, 116, (0, 0.3), (-0.4, 1.0))
        o.append(T(x0 - 40, 42, title, "start", 11, INK, True))
        o.append(p.axes(xl="時間 t [s]", yl="偏差 e [rad]" if j == 0 else None, xt=[0, 0.1, 0.2, 0.3], yt=[-0.4, 0, 0.4, 0.8],
                        xfmt=_f10_n, yfmt=_f10_n, sz=9))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        if j == 1:
            pts = [(p.X(0), p.Y(0))] + [(p.X(a), p.Y(b_)) for a, b_ in zip(t[:k1 + 1], e[:k1 + 1])] + [(p.X(t1), p.Y(0))]
            o.append(PL(pts, c=c, lw=0.8, fill=soft(c)))
        o.append(p.line(list(zip(t, e)), c=SIG, lw=2.0))
        o.append(W(p.X(t1), p.y, p.X(t1), p.y + p.h, c=FNT, lw=1, dash="3 3"))
        if j == 0:
            o.append(W(p.X(t1), p.Y(0), p.X(t1), p.Y(e1), c=c, lw=3))
            o.append(D(p.X(t1), p.Y(e1), c, 4))
        if j == 2:
            ta, tb = t1 - 0.03, t1 + 0.03
            o.append(W(p.X(ta), p.Y(e1 + de1 * (ta - t1)), p.X(tb), p.Y(e1 + de1 * (tb - t1)), c=c, lw=2.4))
            o.append(D(p.X(t1), p.Y(e1), c, 4))
        o.append(TX(p.X(t1) + 6, p.Y(0.86), "t_1", "start", 9.5, MUT, halo=True))
        o.append(TX(x0 + 86, 214, val, "middle", 10, c, True))
        o.append(TX(x0 + 86, 230, act, "middle", 10, INK))
    # 時間の向きの帯
    yb = 262
    o.append(ARR(60, yb, 650, yb, c=MUT, lw=1.4))
    o.append(D(355, yb, INK, 4))
    o.append(TX(355, yb - 8, "今（t_1）", "middle", 10, INK, True))
    o.append(T(200, yb + 18, "過去: たまった偏差（面積）", "middle", 10, _F10_CI, True))
    o.append(T(355, yb + 18, "今の偏差", "middle", 10, _F10_CP, True))
    o.append(T(520, yb + 18, "少し先: 傾きから予想した偏差", "middle", 10, _F10_CD, True))
    o.append(T(655, yb + 4, "時間", "start", 9.5, MUT))
    return _f10_svg(700, yb + 30, o, "同じ偏差の波形から、3 つの量を取り出せる。(a) 今の値は、比例制御（P 動作）が使う量である。(b) 時刻 0 からの面積（積分）は、過去の偏差がどれだけたまったかを表す。(c) 今の傾き（微分）は、偏差がこの先どちらへ動くかを表す。2 節と 3 節で、面積と傾きに比例した操作量を足していく。")
F["e10_views"] = _f10_views_fig()


def _f10_cart_delay(K, L=0.1, tend=1.2, u0=2.0, r=1.0):
    """1 章の台車の速度: u = u0 + K(r − 測った速度)、測った速度は L 遅れる（共通部品 SIMLOOP で計算）。
    SIMLOOP はむだ時間を操作量の側に置くので、その制御量は測った速度にあたる。実際の速度は L だけ前へずらして得る。"""
    res = SIMLOOP([0.5], [0.5, 1.0], [K], [1.0], tend + L, L=L, n=int(round((tend + L) / 2e-4)), r=r, d=lambda t: u0, every=1)
    m = res["t"] >= L - 1e-12
    return res["t"][m] - L, res["y"][m]


def _f10_p_limits_fig():
    o = []
    cols = [60, 402]; rows = [44, 240]; pw, ph = 180, 122
    lx = [cols[0] + pw + 8, cols[1] + pw + 8]
    # (a) 台車の速度: 偏差が残る
    p = Plot(cols[0], rows[0], pw, ph, (0, 1.0), (0, 1.15))
    o.append(T(14, rows[0] - 22, "(a) 台車の速度（目標 1 m/s、決めた力なし）", "start", 11, INK, True))
    o.append(p.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.5, 1.0], yt=[0, 0.5, 1.0], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    t = _f10_np.linspace(0, 1.0, 1001)
    o.append(TX(lx[0], p.y + 12, "K_P [N/(m/s)]: 落ち着く速度", "start", 9, MUT))
    for k, (KP, c) in enumerate(((20, PUR), (8, SIG), (2, TEA))):
        kk = 0.5 * KP
        y = kk / (1 + kk) * (1 - _f10_np.exp(-(1 + kk) / 0.5 * t))
        o.append(p.line(list(zip(t, y)), c=c, lw=2))
        o.append(T(lx[0], p.y + 30 + k * 15, "%d: %s m/s" % (KP, _f10_f(kk / (1 + kk), 3)), "start", 9.5, c, True))
    o.append(T(lx[0], p.y + 84, "上げても", "start", 9.5, ALI, True))
    o.append(T(lx[0], p.y + 98, "1 m/s に届かない", "start", 9.5, ALI, True))
    # (b) モータの角度: 揺れが増え、速くならない
    q = Plot(cols[1], rows[0], pw, ph, (0, 0.5), (0, 1.8))
    o.append(T(cols[1] - 54, rows[0] - 22, "(b) モータの角度（目標 1 rad）", "start", 11, INK, True))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.25, 0.5], yt=[0, 0.5, 1.0, 1.5], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(RECT(q.x, q.Y(1.02), q.w, q.Y(0.98) - q.Y(1.02), 0, GSOFT, "none", 0))
    t = _f10_np.linspace(0, 0.5, 5001)
    o.append(TX(lx[1], q.y + 12, "K_P [V/rad]: 行き過ぎ量", "start", 9, MUT))
    o.append(T(lx[1], q.y + 24, "・2 % 整定時間", "start", 9, MUT))
    for k, (KP, c, lab) in enumerate(((0.21, TEA, "0.21: 5.0 %・0.41 s"), (0.84, SIG, "0.84: 31.5 %・0.38 s"), (10, PUR, "10: 72.9 %・0.38 s"))):
        y = _f10_cl_step([1000.0 * KP], [1.0, 20.0, 1000.0 * KP], t)
        o.append(q.line(list(zip(t, y)), c=c, lw=1.6 if KP == 10 else 2))
        o.append(T(lx[1], q.y + 42 + k * 15, lab, "start", 9, c, True))
    o.append(T(lx[1], q.y + 96, "速くならず、", "start", 9.5, ALI, True))
    o.append(T(lx[1], q.y + 110, "揺れが増える", "start", 9.5, ALI, True))
    # (c) 台車 + 測った値の遅れ
    p = Plot(cols[0], rows[1], pw, ph, (0, 1.2), (-1.0, 3.0))
    o.append(T(14, rows[1] - 22, "(c) 台車の速度（測った値が 0.1 s 遅れる）", "start", 11, INK, True))
    o.append(p.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.4, 0.8, 1.2], yt=[-1, 0, 1, 2, 3], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    o.append(TX(lx[0], p.y + 12, "K_P [N/(m/s)]: 最大", "start", 9, MUT))
    for k, (KP, c) in enumerate(((8, TEA), (14, SIG), (20, ALI))):
        tt, v = _f10_cart_delay(KP)
        o.append(p.clip(list(zip(tt[::4], v[::4])), c=c, lw=1.5 if KP == 20 else 1.9))
        txt = ("%d: %s m/s" % (KP, _f10_f(v.max(), 2))) if KP < 20 else "20: 大きくなり続ける"
        o.append(T(lx[0], p.y + 30 + k * 15, txt, "start", 9.5, c, True))
    o.append(T(lx[0], p.y + 84, "上げるほど揺れ、", "start", 9.5, ALI, True))
    o.append(T(lx[0], p.y + 98, "ついに不安定", "start", 9.5, ALI, True))
    # (d) モータの角度 + 負荷トルク
    q = Plot(cols[1], rows[1], pw, ph, (0, 0.6), (-5.5, 0.5))
    o.append(T(cols[1] - 54, rows[1] - 22, "(d) モータの角度（目標 0、負荷トルク）", "start", 11, INK, True))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.3, 0.6], yt=[-5, -4, -3, -2, -1, 0], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1.2, dash="5 3"))
    t = _f10_np.linspace(0, 0.6, 3001)
    o.append(TX(lx[1], q.y + 12, "K_P [V/rad]: ずれ", "start", 9, MUT))
    for k, (KP, c) in enumerate(((0.84, SIG), (0.21, TEA))):
        y = -_f10_cl_step([1000.0], [1.0, 20.0, 1000.0 * KP], t)
        o.append(q.line(list(zip(t, y)), c=c, lw=2))
        o.append(T(lx[1], q.y + 30 + k * 15, "%s: %s rad" % (_f10_n(KP), _f10_f(-1.0 / KP, 2)), "start", 9.5, c, True))
    o.append(TX(lx[1], q.y + 70, "−1 V ÷ K_P の", "start", 9.5, ALI, True))
    o.append(T(lx[1], q.y + 84, "ずれが残る", "start", 9.5, ALI, True))
    return _f10_svg(700, rows[1] + ph + 44, o, "比例制御（P 動作だけ）の限界を、前の章の例で数値に並べた。(a) 一次遅れの台車の速度は、比例ゲインを上げても目標値に届かない（3 章 6 節）。(b) モータの角度は、比例ゲインを上げると行き過ぎが増え、2 % 整定時間は 0.4 s 前後から縮まない（4 章 6 節）。(c) 測った値が遅れて届くと、比例ゲインを上げるほど揺れ、20 N/(m/s) で振れが大きくなり続ける（1 章 5 節）。(d) モータの軸に負荷トルク 0.01 N·m（電圧に換算して −1 V）がかかると、それを支える電圧を偏差から作るので、角度がずれたまま止まる（7 章 4 節）。")
F["e10_p_limits"] = _f10_p_limits_fig()


# =====================================================================
# 2 節: I 動作
# =====================================================================
_F10_D3 = -9.81 * math.sin(math.radians(3))     # 3° の上り坂の力（前向きを正）−0.513 N


def _f10_i_hold_fig():
    o = []
    rP = _f10_sim("cart", 8.0, 0.0, 0.0, 4.0, 1e-3, d=lambda t: _F10_D3 if t >= 1.5 else 0.0)
    rI = _f10_sim("cart", 8.0, 25.0, 0.0, 4.0, 1e-3, d=lambda t: _F10_D3 if t >= 1.5 else 0.0)
    t = rI["t"]
    kc = int(_f10_np.argmax(rI["y"] >= 1.0))
    tc = t[kc]
    o.append(T(14, 18, "(a) 台車の速度（目標 1 m/s。1.5 s から 3° の上り坂）", "start", 11.5, INK, True))
    p = Plot(70, 32, 600, 130, (0, 4.0), (0, 1.15))
    o.append(_f10_band(p, 1.5, 4.0))
    o.append(p.axes(xl=None, yl="速度 [m/s]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4], yt=[0, 0.5, 1.0], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    o.append(p.line(list(zip(rP["t"], rP["y"])), c=TEA, lw=2))
    o.append(p.line(list(zip(t, rI["y"])), c=SIG, lw=2.2))
    o.append(W(p.X(tc), p.y, p.X(tc), p.y + p.h, c=ALI, lw=1, dash="3 3"))
    o.append(TX(p.X(0.45), p.Y(0.8) + 15, "比例だけ（K_P = 8 N/(m/s)）: 0.80 m/s", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(3.95), p.Y(0.749) + 15, "坂で 0.75 m/s", "end", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(0.45), p.Y(0.9) + 3, "PI（K_I = 25 N/m を足す）: 最大 1.042 m/s", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(2.05), p.Y(0.963) + 15, "坂でいったん 0.963 m/s、1 m/s に戻る", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.55), p.Y(0.12), "1.5 s から上り坂", "start", 9.5, PUR, True, halo=True))
    o.append(T(14, 196, "(b) PI の押す力の内訳", "start", 11.5, INK, True))
    q = Plot(70, 210, 600, 150, (0, 4.0), (-0.5, 4.0))
    o.append(_f10_band(q, 1.5, 4.0))
    o.append(q.axes(xl="時間 t [s]", yl="力 [N]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4], yt=[0, 1, 2, 3, 4], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(W(q.X(0), q.Y(2.0), q.X(1.5), q.Y(2.0), c=PUR, lw=1, dash="3 3"))
    o.append(W(q.X(1.5), q.Y(2.513), q.X(4.0), q.Y(2.513), c=PUR, lw=1, dash="3 3"))
    o.append(q.clip(list(zip(t, rI["uP"])), c=_F10_CP, lw=1.8))
    o.append(q.clip(list(zip(t, rI["uI"])), c=_F10_CI, lw=2.2))
    o.append(q.clip(list(zip(t, rI["u"])), c=INK, lw=1.4))
    o.append(W(q.X(tc), q.y, q.X(tc), q.y + q.h, c=ALI, lw=1, dash="3 3"))
    o.append(D(q.X(tc), q.Y(rI["uI"][kc]), ALI, 3.6))
    o.append(W(q.X(tc), q.Y(rI["uI"][kc]), q.X(0.6), q.Y(3.05), c=ALI, lw=1))
    o.append(T(q.X(0.62), q.Y(3.0), "0.33 s: 偏差が 0 になる。I の分は 2.57 N で、要る 2 N を越えている", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0.62), q.Y(3.0) + 14, "→ 台車はまだ加速し、目標を行き過ぎる", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(1.45), q.Y(2.0) + 14, "平らな道で要る力 2 N", "end", 9.5, PUR, True, halo=True))
    o.append(T(q.X(3.95), q.Y(2.513) - 6, "坂で要る力 2.51 N", "end", 9.5, PUR, True, halo=True))
    o.append(T(q.X(0.13), q.y + 10, "合計は 8 N から（枠の外）", "start", 9, INK, halo=True))
    o.append(T(q.X(3.95), q.Y(0.0) - 6, "P の分は 0 へ", "end", 9.5, _F10_CP, True, halo=True))
    o.append(LEGL(70, 404, [(INK, None, "押す力の合計"), (_F10_CP, None, "P の分 K_P e"), (_F10_CI, None, "I の分 K_I ∫e dt"), (PUR, "3 3", "要る力（抵抗 + 坂）")], 9.5))
    return _f10_svg(700, 414, o, "台車の速度を、決めた力を足さずに制御する（K_P = 8 N/(m/s)）。(a) 比例だけでは、平らな道で 0.2 m/s、坂で 0.25 m/s の偏差が残る。K_I = 25 N/m の I 動作を足すと、どちらでも 1 m/s に戻る。(b) PI の力の内訳。偏差が残っている間 I の分が増え、要る力（平らな道 2 N、坂 2.51 N）に届くと、P の分が 0 のまま、I の分だけで台車を押し続ける。偏差が初めて 0 になる 0.33 s には、I の分がすでに要る力を越えているので、速度は行き過ぎる。")
F["e10_i_hold"] = _f10_i_hold_fig()


def _f10_i_more_fig():
    o = []
    t = _f10_np.linspace(0, 2.0, 4001)
    # (a) 台車の速度: K_P = 8 のまま K_I を上げる
    o.append(TX(14, 18, "(a) 台車の速度（K_P = 8 N/(m/s) のまま K_I を上げる）", "start", 11.5, INK, True))
    sp = Plot(70, 36, 170, 150, (-14, 2), (-22, 22))
    o.append(_f10_sp(sp, [-10, -5, 0], [-20, -10, 0, 10, 20], xl="実部", yl="虚部"))
    cases = [(0, MUT, None, "比例だけ"), (25, GRN, "5 3", "K_I = 25 N/m"), (100, GLD, None, "K_I = 100 N/m"), (400, ALI, None, "K_I = 400 N/m")]
    q = Plot(330, 36, 250, 150, (0, 2.0), (0, 1.6))
    o.append(q.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.5, 1, 1.5, 2], yt=[0, 0.5, 1, 1.5], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=MUT, lw=1.2, dash="5 3"))
    o.append(W(sp.X(-5), sp.y, sp.X(-5), sp.y + sp.h, c=FNT, lw=1, dash="2 3"))
    for k, (KI, c, dash, lab) in enumerate(cases):
        if KI == 0:
            num, den = [4.0], [0.5, 5.0]
        else:
            num, den = [4.0, 0.5 * KI], [0.5, 5.0, 0.5 * KI]
        y = _f10_cl_step(num, den, t)
        o.append(q.line(list(zip(t, y)), c=c, lw=2, dash=None))
        rts = _f10_np.roots(den)
        o.append(PZ(sp, [complex(z) for z in rts], [complex(-KI / 8.0)] if 0 < KI < 112 else [], c=c, r=4.6))
        mp, ts = _f10_metrics(t, y, float(_f10_np.polyval(num, 0) / _f10_np.polyval(den, 0)))
        info = "0.8 m/s に 0.39 s" if KI == 0 else "%s %%・%s s" % (_f10_f(mp, 1), _f10_f(ts, 2))
        o.append(TX(q.x + q.w + 8, q.y + 14 + k * 30, lab, "start", 9.5, c, True))
        o.append(T(q.x + q.w + 8, q.y + 27 + k * 30, info, "start", 9, c))
    o.append(T(sp.X(-5) - 3, sp.y + 12, "実部 −5", "end", 9, MUT, halo=True))
    o.append(TX(sp.X(-13.5), sp.Y(-17), "○: 零点 −K_I/K_P", "start", 9, MUT, halo=True))
    o.append(T(q.x + q.w + 8, q.y + 134, "行き過ぎ量・", "start", 9, MUT))
    o.append(T(q.x + q.w + 8, q.y + 146, "2 % 整定時間", "start", 9, MUT))
    # (b) モータの角度: K_P = 0.21 のまま K_I を上げる
    yb = 232
    o.append(TX(14, yb, "(b) モータの角度（K_P = 0.21 V/rad のまま K_I を上げる）", "start", 11.5, INK, True))
    sp = Plot(70, yb + 18, 170, 150, (-24, 4), (-18, 18))
    o.append(_f10_sp(sp, [-20, -10, 0], [-15, 0, 15], xl="実部", yl="虚部"))
    q = Plot(330, yb + 18, 250, 150, (0, 2.0), (0, 1.8))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.5, 1, 1.5, 2], yt=[0, 0.5, 1, 1.5], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=MUT, lw=1.2, dash="5 3"))
    mc = [(0, MUT, "比例だけ"), (0.5, GRN, "K_I = 0.5 V/(rad·s)"), (2, GLD, "K_I = 2 V/(rad·s)"), (4.2, ALI, "K_I = 4.2 V/(rad·s)")]
    for k, (KI, c, lab) in enumerate(mc):
        if KI == 0:
            num, den = [210.0], [1.0, 20.0, 210.0]
        else:
            num, den = [210.0, 1000.0 * KI], [1.0, 20.0, 210.0, 1000.0 * KI]
        y = _f10_cl_step(num, den, t)
        o.append(q.clip(list(zip(t, y)), c=c, lw=1.6 if KI == 4.2 else 2))
        rts = _f10_np.roots(den)
        o.append(PZ(sp, [complex(z) for z in rts], [] if KI == 0 else [complex(-KI / 0.21)], c=c, r=4.6))
        if KI < 4.2:
            mp, ts = _f10_metrics(t, y, 1.0)
            info = "%s %%・%s s" % (_f10_f(mp, 1), _f10_f(ts, 2))
        else:
            info = "揺れ続ける（安定限界）"
        o.append(TX(q.x + q.w + 8, q.y + 14 + k * 30, lab, "start", 9.5, c, True))
        o.append(T(q.x + q.w + 8, q.y + 27 + k * 30, info, "start", 9, c))

    return _f10_svg(700, yb + 214, o, "比例ゲインはそのままで、I 動作の積分ゲイン K_I を上げる（左: 閉ループの極 × と零点 ○、右: 目標値のステップ応答）。K_I = 400 N/m の零点 −50 は枠の外にある。(a) 台車の速度では、極は実部 −5 の縦の線の上を上下に離れ、行き過ぎ量が増える。K_I = 25 N/m では極は −5 に重なるが、零点 −3.125 のために 4.2 % 行き過ぎる。比例だけのときの極 −10 より虚軸に近いので、落ち着くのも遅い。(b) モータの角度では、原点の近くに遅い極が加わり、残りの組が虚軸へ近づいて、K_I = 4.2 V/(rad·s) で虚軸の上に乗る。")
F["e10_i_more"] = _f10_i_more_fig()


def _f10_pi_bode_fig():
    o = []
    w = _f10_np.logspace(-1, 3, 800)
    o.append(TX(14, 18, "(a) PI の制御器 C(s) = K_P + K_I/s", "start", 11.5, INK, True))
    o.append(TX(14, 33, "（K_P = 8 N/(m/s)、K_I = 25 N/m）", "start", 9.5, MUT))
    dbC, phC = BODEPH([8.0, 25.0], [1.0, 0.0], w)
    dbP, phP = BODEPH([8.0], [1.0], w)
    svg, pm, pp, hh = BODE(70, 44, 250, [(w, dbP, phP, MUT, "5 3"), (w, dbC, phC, _F10_CI, None)], (0.1, 1000), (0, 50), (-100, 10),
                           hm=120, hp=96, dbt=[0, 10, 20, 30, 40, 50], pht=[-90, -45, 0])
    o.append(svg)
    wi = 25.0 / 8.0
    o.append(W(pm.X(0.1), pm.Y(20 * math.log10(25 / 0.1)), pm.X(wi), pm.Y(20 * math.log10(8)), c=_F10_CI, lw=1, dash="2 3"))
    o.append(W(pm.X(wi), pm.y, pm.X(wi), pm.y + pm.h, c=FNT, lw=1, dash="3 3"))
    o.append(W(pp.X(wi), pp.y, pp.X(wi), pp.y + pp.h, c=FNT, lw=1, dash="3 3"))
    o.append(TX(pm.X(wi) + 4, pm.y + 12, "K_I/K_P = 3.1 rad/s", "start", 9, MUT, halo=True))
    o.append(T(pm.X(0.13), pm.Y(44), "−20 dB/dec（積分）", "start", 9, _F10_CI, True, halo=True))
    o.append(TX(pm.X(900), pm.Y(18.06) - 6, "K_P = 18.1 dB", "end", 9, MUT, halo=True))
    o.append(T(pp.X(0.13), pp.Y(-80), "低い角周波数で −90°", "start", 9, _F10_CI, True, halo=True))
    o.append(T(pp.X(900), pp.Y(-12), "0° へ", "end", 9, _F10_CI, True, halo=True))
    # (b) 一巡伝達関数
    o.append(T(370, 18, "(b) 一巡伝達関数 P(s)C(s) と位相余裕", "start", 11.5, INK, True))
    curves = []
    infos = []
    for KI, c, dash in ((0, MUT, "5 3"), (25, _F10_CI, None), (100, GLD, None)):
        num = _f10_np.polymul([0.5], [8.0, KI]) if KI else [4.0]
        den = _f10_np.polymul([0.5, 1.0], [1.0, 0.0]) if KI else [0.5, 1.0]
        db, ph = BODEPH(num, den, w)
        curves.append((w, db, ph, c, dash))
        k = int(_f10_np.where(_f10_np.diff(_f10_np.sign(db)))[0][-1])
        wg = w[k] - db[k] * (w[k + 1] - w[k]) / (db[k + 1] - db[k])
        phg = float(_f10_np.interp(wg, w, ph))
        infos.append((KI, c, wg, phg))
    svg, pm, pp, hh = BODE(430, 44, 250, curves, (0.1, 1000), (-40, 50), (-180, 0), hm=120, hp=96, dbt=[-40, -20, 0, 20, 40], pht=[-180, -90, 0])
    o.append(svg)
    for j, (KI, c, wg, phg) in enumerate(infos):
        o.append(D(pp.X(wg), pp.Y(phg), c, 3.6))
        o.append(D(pm.X(wg), pm.Y(0), c, 3.2))
        lab = ("比例だけ" if KI == 0 else "K_I = %d" % KI) + ": 位相余裕 %s°" % _f10_f(180 + phg, 1)
        o.append(TX(pp.x + 4, pp.y + pp.h + 54 + j * 14, lab, "start", 9.5, c, True))
    o.append(T(pm.X(0.13), pm.Y(40), "低い角周波数で限りなく大きい", "start", 9, _F10_CI, True, halo=True))
    o.append(T(pp.X(0.13), pp.Y(-160) + 4, "−180°", "start", 9, MUT, halo=True))
    return _f10_svg(700, hh + 46, o, "I 動作を周波数で見る。(a) PI の制御器のゲインは、K_I/K_P = 3.1 rad/s より低い角周波数で −20 dB/dec で大きくなり、位相は −90° に近づく（8 章 4 節の積分）。(b) 台車の速度の一巡伝達関数。I 動作で低い角周波数のゲインが限りなく大きくなる（偏差が残らない）。代わりに、ゲインが 1 になる角周波数（点）での位相が下がり、位相余裕（9 章 5 節）は比例だけの 104.5° から 82.9°（K_I = 25）、52.6°（K_I = 100）に減る。")
F["e10_pi_bode"] = _f10_pi_bode_fig()


# =====================================================================
# 3 節: D 動作
# =====================================================================
def _f10_pd_curves(t):
    """モータの角度（目標 1 rad）: 比例だけ K_P = 0.84 と、PD（K_P = 0.84、K_D = 0.02、微分は測った角度に掛ける）。"""
    thP = _f10_cl_step([840.0], [1.0, 20.0, 840.0], t)
    thD = _f10_cl_step([840.0], [1.0, 40.0, 840.0], t)
    wD = _f10_np.gradient(thD, t)
    return thP, thD, wD


def _f10_d_predict_fig():
    o = []
    t = _f10_np.linspace(0, 0.3, 6001)
    thP, thD, wD = _f10_pd_curves(t)
    TD = 0.02 / 0.84
    eD = 1.0 - thD
    pred = eD - TD * wD
    o.append(TX(14, 18, "(a) 偏差（目標 1 rad。PD: K_P = 0.84 V/rad、K_D = 0.02 V·s/rad、K_D/K_P = 0.0238 s）", "start", 11, INK, True))
    p = Plot(70, 32, 600, 140, (0, 0.3), (-0.4, 1.05))
    o.append(p.axes(xl=None, yl="偏差 e [rad]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3], yt=[-0.4, 0, 0.4, 0.8], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(p.line(list(zip(t, 1.0 - thP)), c=MUT, lw=1.6, dash="5 3"))
    o.append(p.line(list(zip(t, pred)), c=_F10_CD, lw=1.8, dash="6 3"))
    o.append(p.line(list(zip(t, eD)), c=SIG, lw=2.2))
    t1 = 0.04
    k1 = int(round(t1 / (t[1] - t[0])))
    e1, de1 = eD[k1], -wD[k1]
    o.append(W(p.X(t1), p.Y(e1), p.X(t1 + TD), p.Y(e1 + de1 * TD), c=_F10_CD, lw=2.2))
    o.append(D(p.X(t1), p.Y(e1), SIG, 4))
    o.append(D(p.X(t1 + TD), p.Y(e1 + de1 * TD), _F10_CD, 4))
    k2 = int(round((t1 + TD) / (t[1] - t[0])))
    o.append(D(p.X(t1 + TD), p.Y(eD[k2]), SIG, 3))
    o.append(TX(p.X(t1) - 8, p.Y(e1) + 14, "t_1 = 0.04 s", "end", 9.5, SIG, True, halo=True))
    o.append(W(p.X(t1 + TD) + 4, p.Y(e1 + de1 * TD) - 3, p.X(0.098), p.Y(0.6) + 4, c=_F10_CD, lw=0.9))
    o.append(TX(p.X(0.1), p.Y(0.6), "接線で K_D/K_P 先を予想: e + (K_D/K_P) de/dt = %s" % _f10_f(e1 + de1 * TD, 3), "start", 9.5, _F10_CD, True, halo=True))
    o.append(TX(p.X(0.1), p.Y(0.6) + 15, "（K_D/K_P 後の本当の偏差は %s rad）" % _f10_f(eD[k2], 3), "start", 9.5, SIG, halo=True))
    o.append(TX(p.X(0.13), p.Y(-0.33), "比例だけ（K_P = 0.84 V/rad）の偏差: 0 を大きく行き過ぎる", "start", 9.5, MUT, True, halo=True))
    o.append(T(p.X(0.24), p.Y(0.2), "PD の偏差", "middle", 9.5, SIG, True, halo=True))
    # (b) 電圧の内訳
    o.append(T(14, 212, "(b) PD の電圧の内訳", "start", 11, INK, True))
    q = Plot(70, 224, 600, 130, (0, 0.3), (-0.6, 0.9))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3], yt=[-0.5, 0, 0.5], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    uP = 0.84 * eD; uD = -0.02 * wD
    o.append(q.line(list(zip(t, uP)), c=_F10_CP, lw=1.8))
    o.append(q.line(list(zip(t, uD)), c=_F10_CD, lw=2.0))
    o.append(q.line(list(zip(t, uP + uD)), c=INK, lw=1.5))
    km = int(_f10_np.argmax(wD))
    o.append(D(q.X(t[km]), q.Y(uD[km]), _F10_CD, 3.6))
    o.append(T(q.X(t[km]) + 8, q.Y(uD[km]) + 4, "D の分: 角速度 %s rad/s × 0.02 = %s V（ブレーキ）" % (_f10_f(wD[km], 1), _f10_f(uD[km], 3)), "start", 9.5, _F10_CD, True, halo=True))
    kz = int(_f10_np.argmax(uP + uD < 0))
    o.append(T(q.X(t[kz]) + 6, q.Y(0.12), "%s s: 合計が負になる（偏差はまだ %s rad 残っている）" % (_f10_f(t[kz], 3), _f10_f(eD[kz], 2)), "start", 9.5, INK, True, halo=True))
    o.append(LEGL(70, 398, [(INK, None, "電圧の合計"), (_F10_CP, None, "P の分 K_P e"), (_F10_CD, None, "D の分 K_D de/dt"), (_F10_CD, "6 3", "予想した偏差 e + (K_D/K_P) de/dt"), (MUT, "5 3", "比例だけの偏差")], 9.5, 14))
    return _f10_svg(700, 408, o, "D 動作は、偏差の傾きから、少し先の偏差を予想して電圧を決める。(a) K_P e + K_D de/dt = K_P{e + (K_D/K_P) de/dt} で、e + (K_D/K_P) de/dt は、今の点で引いた接線の K_D/K_P 後の値である。(b) 角度が目標へ速く近づく間、D の分は負になってブレーキをかけ、偏差が 0 になる前に電圧の合計を負にする。比例だけでは、偏差が 0 になるまで加速の電圧を出し続けるので、大きく行き過ぎる。")
F["e10_d_predict"] = _f10_d_predict_fig()


def _f10_d_poles_fig():
    o = []
    o.append(TX(14, 18, "(a) 閉ループの極（K_P を変えたときの道）", "start", 11.5, INK, True))
    sp = Plot(70, 36, 220, 220, (-44, 4), (-32, 32))
    o.append(_f10_sp(sp, [-40, -30, -20, -10, 0], [-30, -20, -10, 0, 10, 20, 30], zeta=[0.69]))
    o.append(W(sp.X(0), sp.Y(0), sp.X(-20), sp.Y(0), c=MUT, lw=3))
    o.append(W(sp.X(-10), sp.Y(-31), sp.X(-10), sp.Y(31), c=MUT, lw=3))
    o.append(W(sp.X(0), sp.Y(0), sp.X(-40), sp.Y(0), c=GRN, lw=1.8, dash="5 3"))
    o.append(W(sp.X(-20), sp.Y(-31), sp.X(-20), sp.Y(31), c=GRN, lw=1.8, dash="5 3"))
    o.append(PZ(sp, [complex(-10, 10.488), complex(-10, -10.488)], [], c=TEA, r=5))
    o.append(PZ(sp, [complex(-10, 27.20), complex(-10, -27.20)], [], c=ALI, r=5))
    o.append(PZ(sp, [complex(-20, 20.98), complex(-20, -20.98)], [], c=GRN, r=5))
    o.append(TX(sp.X(-10) + 6, sp.Y(-12) + 4, "比例だけ: 実部 −10", "start", 9, MUT, True, halo=True))
    o.append(TX(sp.X(-43), sp.Y(-26), "PD（K_D = 0.02）: 実部 −20", "start", 9, GRN, True, halo=True))
    o.append(T(sp.X(-28), sp.Y(26), "ζ = 0.69", "middle", 9, MUT, halo=True))
    # (b) 応答
    o.append(T(330, 18, "(b) 目標 1 rad のステップ応答", "start", 11.5, INK, True))
    t = _f10_np.linspace(0, 0.6, 6001)
    q = Plot(370, 36, 300, 160, (0, 0.6), (0, 1.4))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 0.5, 1.0], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(RECT(q.x, q.Y(1.02), q.w, q.Y(0.98) - q.Y(1.02), 0, GSOFT, "none", 0))
    cases = [([210.0], [1.0, 20.0, 210.0], TEA, "比例だけ K_P = 0.21"), ([840.0], [1.0, 20.0, 840.0], ALI, "比例だけ K_P = 0.84"),
             ([840.0], [1.0, 40.0, 840.0], GRN, "PD K_P = 0.84、K_D = 0.02")]
    for k, (num, den, c, lab) in enumerate(cases):
        y = _f10_cl_step(num, den, t)
        mp, ts = _f10_metrics(t, y, 1.0)
        o.append(q.line(list(zip(t, y)), c=c, lw=2.2 if c == GRN else 1.8))
        o.append(W(q.X(ts), q.Y(1.0), q.X(ts), q.y + q.h, c=c, lw=1, dash="2 3"))
        o.append(TX(q.x - 30, 264 + k * 16, lab, "start", 10, c, True))
        o.append(T(q.x + 160, 264 + k * 16, "%s %%・%s s" % (_f10_f(mp, 1), _f10_f(ts, 3)), "start", 10, c))
    o.append(T(q.X(0.59), q.Y(1.02) - 4, "±2 %", "end", 9, GRN, halo=True))
    o.append(T(q.x + 160, 248, "行き過ぎ量・2 % 整定時間", "start", 9, MUT))
    o.append(TX(14, 328, "PD の特性方程式 Ts^2 + (1 + KK_D)s + KK_P = 0: K_D は s の係数だけを増やし、極の実部 −(1 + KK_D)/(2T) を左へ動かす。", "start", 10, INK))
    return _f10_svg(700, 340, o, "D 動作でモータの角度を速く落ち着かせる。(a) 比例だけでは、K_P をどれだけ上げても極の実部は −10 のまま上下に動くだけである（太い灰色の線）。K_D = 0.02 V·s/rad の D 動作を加えると、極の道は実部 −20 の線（緑の破線）に移る。(b) K_P = 0.84 V/rad で比例だけなら 31.5 % 行き過ぎるが、D 動作を加えると、K_P = 0.21 V/rad のときと同じ 5.0 % の行き過ぎで、2 % 整定時間は 0.414 s から 0.207 s に半分になる。")
F["e10_d_poles"] = _f10_d_poles_fig()


def _f10_d_noise_fig():
    o = []
    rng = _f10_np.random.default_rng(10)
    h = 1e-3
    nz = rng.normal(0.0, 0.002, int(round(1.2 / h)) + 1)
    r = _f10_sim("mpos", 0.84, 0.0, 0.02, 1.2, h, noise=nz)
    m = (r["t"] >= 1.0) & (r["t"] <= 1.06)
    sP, sD = r["uP"][r["t"] >= 0.6].std(), r["uD"][r["t"] >= 0.6].std()
    o.append(T(14, 18, "(a) 落ち着いた後の電圧の揺れ（角度に標準偏差 0.002 rad のノイズ、1 ms ごとに測る）", "start", 11, INK, True))
    p = Plot(70, 32, 330, 160, (1.0, 1.06), (-0.2, 0.2))
    o.append(p.axes(xl="時間 t [s]", yl="電圧の揺れ [V]", xt=[1.0, 1.02, 1.04, 1.06], yt=[-0.2, -0.1, 0, 0.1, 0.2], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    tt = r["t"][m]
    o.append(p.steps(list(zip(tt, r["uD"][m])), c=_F10_CD, lw=1.4))
    o.append(p.steps(list(zip(tt, r["uP"][m] - 0.84 * (1 - 1.0))), c=_F10_CP, lw=2.0))
    o.append(TX(p.x + p.w + 10, p.y + 40, "P の分 K_P e", "start", 10, _F10_CP, True))
    o.append(TX(p.x + p.w + 10, p.y + 55, "標準偏差 K_P σ = %s V" % _f10_f(0.84 * 0.002, 4), "start", 10, _F10_CP))
    o.append(TX(p.x + p.w + 10, p.y + 85, "D の分 K_D de/dt", "start", 10, _F10_CD, True))
    o.append(TX(p.x + p.w + 10, p.y + 100, "標準偏差 √2 K_D σ/Δt = %s V" % _f10_f(math.sqrt(2) * 0.02 * 0.002 / 0.001, 3), "start", 10, _F10_CD))
    o.append(T(p.x + p.w + 10, p.y + 115, "（P の分の %s 倍）" % _f10_f(math.sqrt(2) * 0.02 / (0.84 * 0.001), 0), "start", 10, _F10_CD))
    o.append(TX(p.x + p.w + 10, p.y + 140, "σ: ノイズの標準偏差、Δt = 1 ms", "start", 9.5, MUT))
    # (b) ゲイン
    o.append(T(14, 244, "(b) 正弦波の揺れに対するゲイン（偏差 1 rad の振幅あたりの電圧の振幅）", "start", 11, INK, True))
    w = _f10_np.logspace(0, 3.5, 200)
    q = Plot(70, 258, 400, 130, (1, 3162), (0.1, 100), xlog=True, ylog=True)
    o.append(q.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [V/rad]", xt=[1, 10, 100, 1000], yt=[0.1, 1, 10, 100], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(RECT(q.X(300), q.y, q.X(3162) - q.X(300), q.h, 0, TSOFT, "none", 0))
    o.append(q.line([(1, 0.84), (3162, 0.84)], c=_F10_CP, lw=2))
    o.append(q.clip([(wv, 0.02 * wv) for wv in w], c=_F10_CD, lw=2))
    o.append(D(q.X(42), q.Y(0.84), INK, 3.4))
    o.append(TX(q.X(42) + 8, q.Y(0.84) + 16, "K_P/K_D = 42 rad/s", "start", 9.5, INK, True, halo=True))
    o.append(TX(q.X(1.2), q.Y(0.84) - 6, "P: K_P = 0.84（どの角周波数でも同じ）", "start", 9.5, _F10_CP, True, halo=True))
    o.append(TX(q.X(1.2), q.Y(0.13), "D: K_D ω（+20 dB/dec）", "start", 9.5, _F10_CD, True, halo=True))
    o.append(T(q.X(1800), q.y + 14, "速い揺れ", "middle", 9.5, TEA, True, halo=True))
    o.append(TX(q.x + q.w + 14, q.y + 30, "1000 rad/s の揺れでは", "start", 9.5, INK))
    o.append(TX(q.x + q.w + 14, q.y + 46, "D の分は K_D × 1000 = 20 V/rad、", "start", 9.5, _F10_CD, True))
    o.append(TX(q.x + q.w + 14, q.y + 62, "P の分の 24 倍", "start", 9.5, _F10_CD, True))
    o.append(TX(q.x + q.w + 14, q.y + 92, "観測ノイズは、動かしたい", "start", 9.5, MUT))
    o.append(TX(q.x + q.w + 14, q.y + 106, "角度の動きより速く揺れる", "start", 9.5, MUT))
    o.append(TX(q.x + q.w + 14, q.y + 120, "ことが多い（7 章 6 節）", "start", 9.5, MUT))
    return _f10_svg(700, 430, o, "D 動作は観測ノイズを大きくする（モータの角度の PD、K_P = 0.84 V/rad、K_D = 0.02 V·s/rad）。(a) 角度の読みの小さなノイズは、P の分には K_P 倍で現れるが、D の分では、1 ms ごとの差を 1 ms で割るので、約 34 倍の大きさになる。(b) 正弦波で見ると、P の分のゲインは一定で、D の分のゲインは角周波数に比例して大きくなる（8 章 4 節の微分）。速く揺れるノイズほど、D の分を通って大きく電圧に現れる。")
F["e10_d_noise"] = _f10_d_noise_fig()


# =====================================================================
# 4 節: PID の式
# =====================================================================
def _f10_par_bd(x0, yc, boxes, tail=None, labs=("P の分", "I の分", "D の分")):
    """3 つの枝が並んだ線図（偏差 e を引き出して 3 つの箱に入れ、加え合わせ点で足す）。tail は後ろに直列につなぐ箱。"""
    o = []
    R = 15
    bw = max(TFBW(b) for b in boxes)
    xb = x0 + 70
    xs = xb + bw + 70
    ys = (yc - 46, yc, yc + 46)
    o.append(ARR(x0, yc, x0 + 40, yc, c=ALI, lw=1.6))
    o.append(TX(x0 + 2, yc - 8, "偏差 e", "start", 10, ALI, True, halo=True))
    o.append(D(x0 + 40, yc, ALI, 3.6))
    o.append(W(x0 + 40, ys[0], x0 + 40, ys[2], c=ALI, lw=1.6))
    for k, (yy, b) in enumerate(zip(ys, boxes)):
        o.append(ARR(x0 + 40, yy, xb, yy, c=ALI, lw=1.6))
        o.append(TFBOX(xb, yy, b, bw, SIG if k == 1 and False else LIN, PAN, h=40 if isinstance(b, tuple) else 32)[0])
        c = (_F10_CP, _F10_CI, _F10_CD)[k]
        if k == 1:
            o.append(ARR(xb + bw, yy, xs - R, yy, c=c, lw=1.8))
        else:
            o.append(W(xb + bw, yy, xs, yy, c=c, lw=1.8))
            o.append(ARR(xs, yy, xs, yc + (-R if k == 0 else R), c=c, lw=1.8))
        o.append(T(xb + bw + 6, yy - 6, labs[k], "start", 9.5, c, True, halo=True))
    o.append(SUMJ(xs, yc, {"l": "+", "t": "+", "b": "+"}))
    x = xs + R
    if tail is not None:
        o.append(ARR(x, yc, x + 26, yc, c=INK, lw=1.6))
        svg, w = TFBOX(x + 26, yc, tail, None, SIG, SSOFT)
        o.append(svg)
        x = x + 26 + w
    o.append(ARR(x, yc, x + 56, yc, c=GLD, lw=1.8))
    o.append(TX(x + 56, yc + 18, "操作量 u", "end", 10, GLD, True, halo=True))
    return "".join(o), x + 56


def _f10_forms_fig():
    o = []
    yc = 96
    o.append(T(14, 18, "(a) 並列形", "start", 11.5, INK, True))
    svg, xe = _f10_par_bd(16, yc, ["K_P", ("K_I", "s"), "K_D s"])
    o.append(svg)
    o.append(T(370, 18, "(b) 標準形", "start", 11.5, INK, True))
    svg, xe2 = _f10_par_bd(368, yc, ["1", ("1", "T_I s"), "T_D s"], tail="K_P")
    o.append(svg)
    y = 190
    o.append(W(12, y - 14, 688, y - 14, c=LIN, lw=0.8))
    o.append(TX(16, y + 6, "並列形: u = K_P e + K_I ∫e dt + K_D de/dt（3 つのゲインを別々に決める）", "start", 10.5, INK))
    o.append(TX(16, y + 28, "標準形: u = K_P（e + (1/T_I) ∫e dt + T_D de/dt）（K_P が全体の強さ、T_I・T_D は時間）", "start", 10.5, INK))
    o.append(TX(16, y + 54, "変換: K_I = K_P/T_I、K_D = K_P T_D　　逆に T_I = K_P/K_I、T_D = K_D/K_P", "start", 10.5, SIG, True))
    o.append(TX(16, y + 76, "I を使わないときは、並列形では K_I = 0、標準形では T_I を限りなく大きくする", "start", 10, MUT))
    return _f10_svg(700, y + 88, o, "PID の 2 つの書き方。(a) 並列形は、偏差を 3 つの枝に分け、それぞれに K_P・K_I/s・K_D s を掛けて足す。(b) 標準形は、1・1/(T_I s)・T_D s の和に、最後に K_P を掛ける。どちらも同じ制御器を表し、ゲインは下の式で書き換えられる。")
F["e10_forms"] = _f10_forms_fig()


def _f10_ti_td_fig():
    o = []
    o.append(TX(14, 18, "(a) 偏差が 1 で一定のとき（PI）: T_I の意味", "start", 11.5, INK, True))
    p = Plot(66, 40, 250, 150, (-0.3, 2.3), (0, 3.4))
    o.append(p.axes(xl="時間 t", yl="操作量", xt=[0, 1, 2], yt=[0, 1, 2, 3], xfmt=lambda v: "", yfmt=lambda v: "", sz=9))
    for v, lab in ((0, "0"), (1, "T_I"), (2, "2T_I")):
        o.append(TX(p.X(v), p.y + p.h + 15, lab, "middle", 9.5, MUT))
    for v, lab in ((0, "0"), (1, "K_P"), (2, "2K_P"), (3, "3K_P")):
        o.append(TX(p.x - 7, p.Y(v) + 3.5, lab, "end", 9.5, MUT))
    o.append(p.line([(-0.3, 0), (0, 0), (0, 1), (2.3, 1)], c=_F10_CP, lw=2))
    o.append(p.line([(-0.3, 0), (0, 0), (2.3, 2.3)], c=_F10_CI, lw=2))
    o.append(p.line([(-0.3, 0), (0, 0), (0, 1), (2.3, 3.3)], c=INK, lw=1.6))
    o.append(W(p.X(1), p.Y(1), p.X(1), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(D(p.X(1), p.Y(1), _F10_CI, 4))
    o.append(TX(p.X(1.05), p.Y(1) + 15, "T_I 後に I の分が P の分に追いつく", "start", 9.5, _F10_CI, True, halo=True))
    o.append(TX(p.X(2.25), p.Y(1) - 6, "P の分 K_P", "end", 9.5, _F10_CP, True, halo=True))
    o.append(TX(p.X(1.15), p.Y(2.75), "合計", "end", 9.5, INK, True, halo=True))
    o.append(TX(p.X(2.25), p.Y(1.45), "I の分 K_P t/T_I", "end", 9.5, _F10_CI, True, halo=True))
    o.append(TX(386, 18, "(b) 偏差が一定の速さで増えるとき（PD）: T_D の意味", "start", 11.5, INK, True))
    q = Plot(430, 40, 250, 150, (-0.5, 4.0), (0, 4.4))
    o.append(q.axes(xl="時間 t", yl="操作量", xt=[0, 1, 2, 3, 4], yt=[0, 1, 2, 3, 4], xfmt=lambda v: "", yfmt=lambda v: "", sz=9))
    for v, lab in ((0, "0"), (1, "T_D"), (2, "2T_D"), (3, "3T_D")):
        o.append(TX(q.X(v), q.y + q.h + 15, lab, "middle", 9.5, MUT))
    o.append(TX(q.x - 7, q.Y(1) + 3.5, "K_P αT_D", "end", 9, MUT))
    o.append(q.line([(-0.5, 0), (0, 0), (4.0, 4.0)], c=_F10_CP, lw=2))
    o.append(q.line([(-0.5, 0), (0, 0), (0, 1), (4.0, 1)], c=_F10_CD, lw=2))
    o.append(q.clip([(-0.5, 0), (0, 0), (0, 1), (3.4, 4.4)], c=INK, lw=1.6))
    o.append(DIM(q.X(1), q.Y(2), q.X(2), q.Y(2), None, c=SIG))
    o.append(TX(q.X(1.5), q.Y(2) + 15, "T_D", "middle", 10, SIG, True, halo=True))
    o.append(TX(q.X(0.15), q.Y(3.6), "P + D = K_P α(t + T_D)", "start", 9.5, INK, True, halo=True))
    o.append(TX(q.X(3.9), q.Y(3.0) + 18, "P の分 K_P αt", "end", 9.5, _F10_CP, True, halo=True))
    o.append(TX(q.X(3.9), q.Y(1) - 6, "D の分 K_P T_D α", "end", 9.5, _F10_CD, True, halo=True))
    o.append(TX(14, 238, "(a) 一定の偏差が T_I だけ続くと、I の分は P の分と同じ大きさになる。T_I が短いほど I 動作は強い。", "start", 10, INK))
    o.append(TX(14, 256, "(b) P と D の和は、P の分の線を T_D だけ左へずらしたもの: P の分が T_D 後に出す値を、今出す。", "start", 10, INK))
    return _f10_svg(700, 266, o, "標準形の積分時間 T_I と微分時間 T_D の意味（制御器だけを取り出し、偏差を決めた形で入れたときの操作量）。(a) 偏差が時刻 0 から 1 のとき、P の分は K_P のまま、I の分は時間に比例して増え、T_I で K_P に届く。(b) 偏差が一定の速さ α で増えるとき、D の分は K_P T_D α で一定で、P と D の和は、P の分だけの線より T_D だけ早く同じ値になる。")
F["e10_ti_td"] = _f10_ti_td_fig()


_F10_PID_M = (0.84, 5.0, 0.02)          # モータの角度の PID（K_P [V/rad]、K_I [V/(rad·s)]、K_D [V·s/rad]）


def _f10_pid_bode_fig():
    o = []
    KP, KI, KD = _F10_PID_M
    w = _f10_np.logspace(0, 3, 600)
    db, ph = BODEPH([KD, KP, KI], [1.0, 0.0], w)
    w0 = 1.0 / math.sqrt((KP / KI) * (KD / KP))
    o.append(TX(14, 18, "(a) PID のボード線図（モータの角度の例: K_P = 0.84、K_I = 5、K_D = 0.02）", "start", 11, INK, True))
    svg, pm, pp, hh = BODE(70, 40, 340, [(w, db, ph, INK, None)], (1, 1000), (-10, 30), (-90, 90), hm=130, hp=100,
                           dbt=[-10, 0, 10, 20, 30], pht=[-90, -45, 0, 45, 90])
    o.append(svg)
    o.append(pm.clip([(wv, 20 * math.log10(KI / wv)) for wv in w], c=_F10_CI, lw=1.4, dash="4 3"))
    o.append(pm.line([(1, 20 * math.log10(KP)), (1000, 20 * math.log10(KP))], c=_F10_CP, lw=1.4, dash="4 3"))
    o.append(pm.clip([(wv, 20 * math.log10(KD * wv)) for wv in w], c=_F10_CD, lw=1.4, dash="4 3"))
    o.append(pm.line(list(zip(w, db)), c=INK, lw=2.2))
    for z in (7.18, 34.8):
        o.append(W(pm.X(z), pm.y, pm.X(z), pm.y + pm.h, c=FNT, lw=1, dash="2 3"))
        o.append(W(pp.X(z), pp.y, pp.X(z), pp.y + pp.h, c=FNT, lw=1, dash="2 3"))
    o.append(D(pm.X(w0), pm.Y(20 * math.log10(KP)), INK, 3.6))
    o.append(D(pp.X(w0), pp.Y(0), INK, 3.6))
    o.append(TX(pm.X(w0), pm.Y(20 * math.log10(KP)) + 16, "ω_0 = 15.8 rad/s で最小 K_P", "middle", 9.5, INK, True, halo=True))
    o.append(TX(pm.X(1.15), pm.Y(26), "I: K_I/ω", "start", 9.5, _F10_CI, True, halo=True))
    o.append(TX(pm.X(900), pm.Y(26), "D: K_D ω", "end", 9.5, _F10_CD, True, halo=True))
    o.append(TX(pm.X(900), pm.Y(20 * math.log10(KP)) - 6, "P: K_P", "end", 9.5, _F10_CP, True, halo=True))
    o.append(T(pm.X(7.18), pm.y - 4, "零点 7.18", "middle", 9, MUT, halo=True))
    o.append(T(pm.X(34.8), pm.y - 4, "34.8 rad/s", "middle", 9, MUT, halo=True))
    o.append(T(pp.X(1.15), pp.Y(-70), "低い角周波数: −90°（I）", "start", 9.5, _F10_CI, True, halo=True))
    o.append(T(pp.X(900), pp.Y(70), "高い角周波数: +90°（D）", "end", 9.5, _F10_CD, True, halo=True))
    # (b) 複素平面の C(jω)
    o.append(TX(450, 18, "(b) C(jω) = K_P + j(K_D ω − K_I/ω)", "start", 11, INK, True))
    q = Plot(480, 40, 190, 230, (-0.3, 1.6), (-1.6, 1.6))
    o.append(RECT(q.x, q.y, q.w, q.h, 0, SCR, LIN, 0.8))
    o.append(q.axes(xl="実部 [V/rad]", yl="虚部 [V/rad]", xt=[0, 0.5, 1, 1.5], yt=[-1.5, -1, -0.5, 0, 0.5, 1, 1.5], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.X(0), q.y, q.X(0), q.y + q.h, c=MUT, lw=1.2))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(ARR(q.X(KP), q.Y(-1.55), q.X(KP), q.Y(1.55), c=INK, lw=2))
    for wv, a in ((4.0, "start"), (7.18, "start"), (15.8, "start"), (34.8, "start"), (60.0, "start")):
        im = KD * wv - KI / wv
        o.append(D(q.X(KP), q.Y(im), SIG, 3.6))
        o.append(T(q.X(KP) + 7, q.Y(im) + 4, "ω = %s" % _f10_n(wv), a, 9, SIG, True, halo=True))
    im = KD * 34.8 - KI / 34.8
    o.append(ARR(q.X(0), q.Y(0), q.X(KP) - 3, q.Y(im) + 2, c=_F10_CD, lw=1.4, head=6))
    o.append(T(q.X(0.05), q.Y(0.5), "+33°", "start", 9.5, _F10_CD, True, halo=True))
    o.append(T(q.X(-0.25), q.Y(-1.35), "ω が増すと上へ", "start", 9, INK, halo=True))
    return _f10_svg(700, hh + 44, o, "PID の周波数応答（K_P = 0.84 V/rad、K_I = 5 V/(rad·s)、K_D = 0.02 V·s/rad。T_I = 0.168 s、T_D = 0.0238 s）。(a) ゲインは、低い角周波数では I の K_I/ω、中ほどでは P の K_P、高い角周波数では D の K_D ω にそって谷の形になり、位相は −90° から +90° へ進む。(b) s = jω を入れると、実部はいつも K_P で、虚部は K_D ω − K_I/ω なので、C(jω) は実部 K_P の縦の線の上を下から上へ動く。虚部が 0 になる ω_0 = 1/√(T_I T_D) でゲインは最小の K_P、位相は 0° になる。")
F["e10_pid_bode"] = _f10_pid_bode_fig()


# =====================================================================
# 5 節: 制御対象ごとの効き方
# =====================================================================
def _f10_cmp_speed_fig():
    o = []
    res = {}
    for name, Cn, Cd in (("P", [0.1], [1.0]), ("PI", [0.1, 2.0], [1.0, 0.0])):
        r = SIMLOOP([50.0], [0.05, 1.0], Cn, Cd, 0.6, n=60000, r=100.0, d=lambda t: -1.0 if t >= 0.3 else 0.0, every=10)
        res[name] = r
    t = res["PI"]["t"]
    o.append(TX(14, 18, "(a) モータの角速度（目標 100 rad/s。0.3 s から負荷トルク 0.01 N·m、電圧に換算して −1 V）", "start", 11, INK, True))
    p = Plot(70, 32, 600, 140, (0, 0.6), (0, 115))
    o.append(_f10_band(p, 0.3, 0.6))
    o.append(p.axes(xl=None, yl="角速度 [rad/s]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 25, 50, 75, 100], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(100), p.x + p.w, p.Y(100), c=MUT, lw=1.2, dash="5 3"))
    o.append(p.line(list(zip(res["P"]["t"], res["P"]["y"])), c=TEA, lw=2))
    o.append(p.line(list(zip(t, res["PI"]["y"])), c=SIG, lw=2.2))
    yPI = res["PI"]["y"]; m = t >= 0.3
    kmin = int(_f10_np.argmin(_f10_np.where(m, yPI, 1e9)))
    o.append(TX(p.X(0.1), p.Y(83.33) + 15, "比例だけ（K_P = 0.1 V/(rad/s)）: 83.3 rad/s（偏差 16.7）", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(0.59), p.Y(75.0) + 15, "負荷で 75.0 rad/s", "end", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(0.1), p.Y(100) - 6, "PI（K_I = 2 V/rad を足す）: 100 rad/s", "start", 9.5, SIG, True, halo=True))
    o.append(D(p.X(t[kmin]), p.Y(yPI[kmin]), SIG, 3.4))
    o.append(T(p.X(t[kmin]) + 8, p.Y(yPI[kmin]) + 4, "いったん %s rad/s、0.09 s で ±2 rad/s に戻る" % _f10_f(yPI[kmin], 1), "start", 9.5, SIG, True, halo=True))
    o.append(T(14, 204, "(b) 電圧の内訳（PI）と、比例だけの電圧", "start", 11, INK, True))
    q = Plot(70, 216, 600, 120, (0, 0.6), (0, 11))
    o.append(_f10_band(q, 0.3, 0.6))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 2, 4, 6, 8, 10], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    uP = 0.1 * res["PI"]["e"]; uI = res["PI"]["u"] - uP
    o.append(q.line(list(zip(res["P"]["t"], res["P"]["u"])), c=TEA, lw=1.4, dash="5 3"))
    o.append(q.line(list(zip(t, uP)), c=_F10_CP, lw=1.8))
    o.append(q.line(list(zip(t, uI)), c=_F10_CI, lw=2.2))
    o.append(q.line(list(zip(t, res["PI"]["u"])), c=INK, lw=1.4))
    o.append(T(q.X(0.29), q.Y(2) - 6, "I の分 2 V（100 rad/s を保つ電圧）", "end", 9.5, _F10_CI, True, halo=True))
    o.append(T(q.X(0.59), q.Y(3) - 6, "I の分 3 V（負荷の 1 V を足す）", "end", 9.5, _F10_CI, True, halo=True))
    o.append(T(q.X(0.012), q.Y(10) + 4, "始めは 10 V", "start", 9.5, INK, True, halo=True))
    o.append(LEGL(70, 380, [(INK, None, "PI の電圧"), (_F10_CP, None, "P の分"), (_F10_CI, None, "I の分"), (TEA, "5 3", "比例だけの電圧")], 9.5))
    return _f10_svg(700, 390, o, "モータの角速度（一次遅れ 50/(0.05s + 1)）。(a) 比例だけでは、目標を保つ電圧を偏差から作るので 16.7 rad/s 低く落ち着き、負荷がかかるとさらに 8.3 rad/s 下がる。I 動作を足すと、どちらの偏差も消える。(b) PI の I の分が、100 rad/s を保つ 2 V と、負荷を支える 1 V を、偏差 0 のまま出す。比例だけで偏差を小さくしようと K_P を 0.5 V/(rad/s) に上げると、目標を変えた瞬間の電圧が 50 V になり、12 V の電源では出せない。")
F["e10_cmp_speed"] = _f10_cmp_speed_fig()


def _f10_cmp_pos_fig():
    o = []
    load = lambda t: -1.0 if t >= 1.0 else 0.0
    cs = [("P", 0.21, 0.0, 0.0, TEA, "比例だけ（K_P = 0.21）"), ("PD", 0.84, 0.0, 0.02, SIG, "PD（K_P = 0.84、K_D = 0.02）"),
          ("PID", 0.84, 5.0, 0.02, GRN, "PID（さらに K_I = 5）")]
    res = {}
    for name, KP, KI, KD, c, lab in cs:
        res[name] = _f10_sim("mpos", KP, KI, KD, 2.0, 1e-4, d=load, every=10)
    o.append(T(14, 18, "(a) モータの角度（目標 1 rad。1.0 s から負荷トルク 0.01 N·m、電圧に換算して −1 V）", "start", 11, INK, True))
    p = Plot(70, 32, 600, 160, (0, 2.0), (-0.6, 1.5))
    o.append(_f10_band(p, 1.0, 2.0))
    o.append(p.axes(xl=None, yl="角度 [rad]", xt=[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], yt=[-0.5, 0, 0.5, 1, 1.5], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    for name, KP, KI, KD, c, lab in cs:
        r = res[name]
        o.append(p.clip(list(zip(r["t"], r["y"])), c=c, lw=2.2 if name == "PID" else 1.9))
    rp = res["PID"]
    mp, ts = _f10_metrics(rp["t"], rp["y"], 1.0, 0.0, 0.999)
    o.append(TX(p.X(1.02), p.y + p.h - 8, "比例だけ: −3.76 rad へ（枠の外。ずれ 4.76 rad）", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(1.98), p.Y(1 - 1.0 / 0.84) - 6, "PD: ずれ 1.19 rad が残る", "end", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(1.42), p.Y(1.0) + 15, "PID: 0.56 s で ±0.02 rad に戻る", "start", 9.5, GRN, True, halo=True))
    o.append(TX(p.X(0.17), p.Y(1.30) + 4, "PID: 行き過ぎ %s %%" % _f10_f(mp, 1), "start", 9.5, GRN, True, halo=True))
    o.append(TX(p.X(0.42), p.Y(0.62), "PD: 5.0 %・0.21 s", "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(0.42), p.Y(0.47), "比例だけ: 5.0 %・0.41 s", "start", 9.5, TEA, True, halo=True))
    o.append(T(14, 232, "(b) 電圧（PID は I の分も示す）", "start", 11, INK, True))
    q = Plot(70, 244, 600, 120, (0, 2.0), (-0.4, 1.4))
    o.append(_f10_band(q, 1.0, 2.0))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], yt=[0, 0.5, 1], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    o.append(W(q.X(1.0), q.Y(1.0), q.X(2.0), q.Y(1.0), c=PUR, lw=1, dash="3 3"))
    for name, KP, KI, KD, c, lab in cs:
        r = res[name]
        o.append(q.clip(list(zip(r["t"], r["u"])), c=c, lw=1.6))
    o.append(q.line(list(zip(rp["t"], rp["uI"])), c=_F10_CI, lw=1.6, dash="5 3"))
    o.append(T(q.X(1.98), q.Y(1.0) + 14, "負荷を支える 1 V", "end", 9.5, PUR, True, halo=True))
    o.append(T(q.X(1.98), q.Y(0.55), "PID の I の分 → 1 V", "end", 9.5, _F10_CI, True, halo=True))
    o.append(LEGL(70, 408, [(TEA, None, cs[0][5]), (SIG, None, cs[1][5]), (GRN, None, cs[2][5]), (_F10_CI, "5 3", "PID の I の分")], 9.5, 12))
    return _f10_svg(700, 418, o, "モータの角度（積分を含む 1000/(s(s + 20))）。D 動作は測った角度の変わる速さに掛けた（3 節）。(a) PD は、比例だけと同じ 5.0 % の行き過ぎで 2 倍速く落ち着くが、負荷トルクを支える 1 V を偏差から作るので、1/0.84 = 1.19 rad ずれる。I 動作を足した PID は、負荷のずれを 0 に戻す。代わりに、目標値への行き過ぎが 30.4 % に増える（6 節で減らし方を述べる）。(b) PID の I の分が、負荷を支える 1 V を出すようになる。")
F["e10_cmp_pos"] = _f10_cmp_pos_fig()


def _f10_plate_run(KP, KI, KD, tend=1100.0, h=0.05, t_d=100.0, N=None, noise=None, every=20):
    """温度の板を 60 °C で落ち着かせておき、t_d に周りの温度が 25 °C から 15 °C に下がる（板から逃げる熱が 8 W 増える）。
    制御量は周りとの差ではなく板の温度 [°C] で返す。比例だけのときは、比例だけで落ち着く温度から始める。"""
    if KI:
        x0, I0 = [35.0], 28.0
    else:
        x0, I0 = [35.0 * 1.25 * KP / (1 + 1.25 * KP)], 0.0
    r = _f10_sim("plate", KP, KI, KD, tend, h, r=lambda t: 35.0, d=lambda t: -8.0 if t >= t_d else 0.0, x0=x0, I0=I0,
                 N=N, noise=noise, every=every)
    r["y"] = r["y"] + 25.0
    return r


def _f10_cmp_plate_fig():
    o = []
    cs = [("P", 24.0, 0.0, 0.0, TEA, "比例だけ（K_P = 24 W/K）"), ("PI1", 12.0, 0.15, 0.0, SIG, "PI（12 W/K・T_I = 80 s）"),
          ("PID", 24.0, 0.6, 240.0, GRN, "PID（24 W/K・40 s・T_D = 10 s）")]
    res = {c[0]: _f10_plate_run(c[1], c[2], c[3]) for c in cs}
    res["PI2"] = _f10_plate_run(24.0, 0.6, 0.0)
    o.append(T(14, 18, "(a) 板の温度（目標 60 °C。100 s に周りの温度が 25 °C から 15 °C に下がる）", "start", 11, INK, True))
    p = Plot(70, 32, 600, 150, (0, 1100), (58.2, 60.3))
    o.append(_f10_band(p, 100, 1100))
    o.append(p.axes(xl=None, yl="温度 [°C]", xt=[0, 100, 300, 500, 700, 900, 1100], yt=[58.5, 59, 59.5, 60], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(60), p.x + p.w, p.Y(60), c=MUT, lw=1.2, dash="5 3"))
    for name, KP, KI, KD, c, lab in cs:
        r = res[name]
        o.append(p.clip(list(zip(r["t"], r["y"])), c=c, lw=2.2 if name == "PID" else 1.9))
    o.append(T(p.X(1090), p.Y(58.871) - 5, "比例だけ: 58.87 °C（偏差 1.13 K）", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(1090), p.Y(58.548) + 14, "→ 58.55 °C（偏差 1.45 K）", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(330), p.Y(59.38), "PI（12 W/K・80 s）: −0.66 K、125 s で ±0.1 K に戻る", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(330), p.Y(59.58), "PID: −0.41 K、52 s で ±0.1 K に戻る", "start", 9.5, GRN, True, halo=True))
    o.append(T(14, 222, "(b) ヒータの電力", "start", 11, INK, True))
    q = Plot(70, 234, 600, 100, (0, 1100), (0, 80))
    o.append(_f10_band(q, 100, 1100))
    o.append(q.axes(xl="時間 t [s]", yl="電力 [W]", xt=[0, 100, 300, 500, 700, 900, 1100], yt=[0, 20, 40, 60, 80], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    for name, KP, KI, KD, c, lab in cs:
        r = res[name]
        o.append(q.clip(list(zip(r["t"], r["u"])), c=c, lw=1.8))
    o.append(T(q.X(1090), q.Y(36) - 6, "PI・PID: 28 W → 36 W", "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(1090), q.Y(34.8) + 14, "比例だけ: 27.1 W → 34.8 W", "end", 9.5, TEA, True, halo=True))
    o.append(LEGL(70, 378, [(TEA, None, cs[0][5]), (SIG, None, cs[1][5]), (GRN, None, cs[2][5])], 9.5, 14))
    # (c) 同じ 24 W/K・40 s で D の有無
    o.append(TX(14, 412, "(c) 同じ 24 W/K・T_I = 40 s で、D 動作の有無を比べる", "start", 11, INK, True))
    z = Plot(70, 426, 600, 110, (0, 1100), (58.0, 62.0))
    o.append(_f10_band(z, 100, 1100))
    o.append(z.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 100, 300, 500, 700, 900, 1100], yt=[58, 59, 60, 61, 62], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(z.x, z.Y(60), z.x + z.w, z.Y(60), c=MUT, lw=1.2, dash="5 3"))
    o.append(z.clip(list(zip(res["PI2"]["t"], res["PI2"]["y"])), c=ALI, lw=1.6))
    o.append(z.clip(list(zip(res["PID"]["t"], res["PID"]["y"])), c=GRN, lw=2.2))
    o.append(T(z.X(330), z.y + 14, "PI（D なし）: 振れが大きくなり続ける（不安定）", "start", 9.5, ALI, True, halo=True))
    o.append(TX(z.X(330), z.Y(60) + 16, "PID（T_D = 10 s）: 落ち着く", "start", 9.5, GRN, True, halo=True))
    return _f10_svg(700, 572, o, "温度の板（一次遅れ ＋ むだ時間 20 s）で、周りの温度が下がったとき。D 動作は測った温度の変わる速さに掛けた。(a) 比例だけでは、逃げる熱を補う電力を偏差から作るので偏差が残る。I 動作を足すと偏差は消える。D 動作も足した PID は、12 W/K・80 s の PI より小さく速く戻る。(b) PI と PID の電力は、逃げる熱が 8 W 増えた分だけ増えて 36 W になる。(c) PID と同じ 24 W/K・40 s で D 動作を除くと、むだ時間のために振れが大きくなり続ける（この計算は電力の上限・下限を考えていない）。D 動作が、強い P と I を使えるようにしている。")
F["e10_cmp_plate"] = _f10_cmp_plate_fig()


# =====================================================================
# 6 節: 微分の実際
# =====================================================================
def _f10_filter_fig():
    o = []
    KP, TD = 0.84, 0.02 / 0.84
    o.append(T(14, 18, "(a) 微分する信号が段差で 1 変わったとき", "start", 11, INK, True))
    p = Plot(70, 34, 250, 130, (-0.002, 0.02), (0, 9.5))
    o.append(p.axes(xl="時間 t [s]", yl="D の分 [V]", xt=[0, 0.005, 0.01, 0.015, 0.02], yt=[0, 2, 4, 6, 8], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    t = _f10_np.linspace(0, 0.02, 801)
    o.append(ARR(p.X(0), p.Y(0), p.X(0), p.y + 2, c=MUT, lw=2.4))
    o.append(TX(p.X(0) + 5, p.y + 12, "理想の微分: 限りなく高く細い山（面積 K_P T_D）", "start", 9, MUT, True, halo=True))
    for N, c in ((10, _F10_CD), (3, SIG)):
        y = KP * N * _f10_np.exp(-N * t / TD)
        o.append(p.line([(-0.002, 0), (0, 0)] + list(zip(t, y)), c=c, lw=2))
        lx, ly = (p.X(TD / N) + 6, p.Y(KP * N * math.exp(-1)) + 4) if N == 10 else (p.X(0.0095), p.Y(1.75))
        o.append(TX(lx, ly, "N = %d: 山 K_P N = %s V" % (N, _f10_f(KP * N, 2)), "start", 9.5, c, True, halo=True))
    o.append(T(390, 18, "(b) 微分する信号が一定の速さ 1 rad/s で増えるとき", "start", 11, INK, True))
    q = Plot(430, 34, 250, 130, (-0.01, 0.08), (0, 0.025))
    o.append(q.axes(xl="時間 t [s]", yl="D の分 [V]", xt=[0, 0.02, 0.04, 0.06, 0.08], yt=[0, 0.01, 0.02], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    t = _f10_np.linspace(0, 0.08, 801)
    o.append(q.line([(-0.01, 0), (0, 0), (0, KP * TD), (0.08, KP * TD)], c=MUT, lw=2, dash="5 3"))
    for N, c in ((10, _F10_CD), (3, SIG)):
        y = KP * TD * (1 - _f10_np.exp(-N * t / TD))
        o.append(q.line([(-0.01, 0), (0, 0)] + list(zip(t, y)), c=c, lw=2))
    o.append(TX(q.X(0.078), q.Y(KP * TD) - 6, "理想: K_P T_D × 1 rad/s = 0.02 V", "end", 9.5, MUT, True, halo=True))
    o.append(TX(q.X(0.006), q.Y(0.006), "時定数 T_D/N で追いつく", "start", 9.5, INK, True, halo=True))
    o.append(T(14, 218, "(c) D の分のゲイン（正弦波の振幅の比）", "start", 11, INK, True))
    w = _f10_np.logspace(0, 4, 400)
    z = Plot(70, 232, 400, 140, (1, 10000), (0.01, 30), xlog=True, ylog=True)
    o.append(z.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [V/rad]", xt=[1, 10, 100, 1000, 10000], yt=[0.01, 0.1, 1, 10], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(z.clip([(wv, KP * TD * wv) for wv in w], c=MUT, lw=1.8, dash="5 3"))
    for N, c in ((10, _F10_CD), (3, SIG)):
        g = KP * TD * w / _f10_np.sqrt(1 + (TD * w / N) ** 2)
        o.append(z.line(list(zip(w, g)), c=c, lw=2))
        o.append(TX(z.X(9000), z.Y(KP * N) - 6, "N = %d: 上限 K_P N = %s" % (N, _f10_f(KP * N, 2)), "end", 9.5, c, True, halo=True))
        o.append(W(z.X(N / TD), z.y + z.h, z.X(N / TD), z.Y(KP * N), c=c, lw=1, dash="2 3"))
    o.append(z.line([(1, KP), (10000, KP)], c=_F10_CP, lw=1.4, dash="4 3"))
    o.append(TX(z.X(1.3), z.Y(KP) - 6, "P の分 K_P", "start", 9.5, _F10_CP, True, halo=True))
    o.append(TX(z.X(1.3), z.Y(0.05), "理想の微分 K_P T_D ω", "start", 9.5, MUT, True, halo=True))
    o.append(TX(z.x + z.w + 14, z.y + 24, "折れ点 N/T_D:", "start", 10, INK, True))
    o.append(TX(z.x + z.w + 14, z.y + 40, "N = 3 で 126 rad/s", "start", 10, SIG))
    o.append(TX(z.x + z.w + 14, z.y + 56, "N = 10 で 420 rad/s", "start", 10, _F10_CD))
    o.append(TX(z.x + z.w + 14, z.y + 84, "それより遅い揺れには微分", "start", 10, INK))
    o.append(TX(z.x + z.w + 14, z.y + 100, "として働き、速い揺れには", "start", 10, INK))
    o.append(TX(z.x + z.w + 14, z.y + 116, "K_P N 倍より大きくしない", "start", 10, INK))
    return _f10_svg(700, 412, o, "不完全微分 K_P T_D s/(1 + (T_D/N)s) の働き（モータの角度の例 K_P = 0.84 V/rad、T_D = 0.0238 s）。(a) 段差を微分すると、理想の微分は限りなく高い山になるが、不完全微分は高さ K_P N の山を時定数 T_D/N で減らす。(b) 一定の速さで増える信号には、時定数 T_D/N 遅れて理想の微分と同じ値になる。(c) ゲインは、折れ点 N/T_D より低い角周波数では理想の微分と同じで、それより高い角周波数では K_P N で頭打ちになる。")
F["e10_filter"] = _f10_filter_fig()


def _f10_noise_n_fig():
    o = []
    rng = _f10_np.random.default_rng(7)
    h = 1.0
    nz = rng.normal(0.0, 0.05, int(round(1100 / h)) + 1)
    o.append(T(14, 18, "(a) ヒータの電力（読みに標準偏差 0.05 K のノイズ、1 s ごとに読む。100 s に周りの温度が下がる）", "start", 10.5, INK, True))
    rows = [(None, ALI, "理想の微分（N なし）"), (10, _F10_CD, "N = 10"), (2, SIG, "N = 2")]
    y0 = 34
    stds = []
    for k, (N, c, lab) in enumerate(rows):
        r = _f10_plate_run(24.0, 0.6, 240.0, h=h, N=N, noise=nz, every=1)
        p = Plot(70, y0 + k * 74, 480, 60, (0, 1100), (-30, 110))
        o.append(RECT(p.x, p.Y(80), p.w, p.Y(0) - p.Y(80), 0, GSOFT, "none", 0))
        o.append(p.axes(xl="時間 t [s]" if k == 2 else None, yl=None, xt=[0, 100, 300, 500, 700, 900, 1100], yt=[0, 80], xfmt=_f10_n if k == 2 else (lambda v: ""), yfmt=_f10_n, sz=9))
        o.append(p.clip(list(zip(r["t"], r["u"])), c=c, lw=1.0))
        sd = float(r["u"][r["t"] >= 300].std())
        stds.append(sd)
        o.append(TX(p.x + p.w + 12, p.y + 22, lab, "start", 10, c, True))
        o.append(T(p.x + p.w + 12, p.y + 38, "揺れの標準偏差 %s W" % _f10_f(sd, 1), "start", 10, c))
    o.append(T(36, y0 + 74 + 34, "電力 [W]", "middle", 9.5, MUT, rot=-90))
    o.append(T(p.x + p.w + 12, y0 + 3 * 74 + 4, "緑の帯: 出せる 0〜80 W", "start", 9, GRN))
    yb = y0 + 3 * 74 + 46
    o.append(T(14, yb, "(b) ノイズの無いときの、周りの温度が下がった後の板の温度", "start", 10.5, INK, True))
    q = Plot(70, yb + 14, 480, 120, (0, 1100), (59.4, 60.2))
    o.append(_f10_band(q, 100, 1100))
    o.append(q.axes(xl="時間 t [s]", yl="温度 [°C]", xt=[0, 100, 300, 500, 700, 900, 1100], yt=[59.4, 59.6, 59.8, 60, 60.2], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(60), q.x + q.w, q.Y(60), c=MUT, lw=1.2, dash="5 3"))
    for k, (N, c, nm) in enumerate([(None, ALI, "N なし"), (10, _F10_CD, "N = 10"), (2, SIG, "N = 2"), (1, GLD, "N = 1")]):
        r = _f10_plate_run(24.0, 0.6, 240.0, N=N, every=1)
        m = r["t"] >= 100.0
        tt, yy = r["t"][m], r["y"][m]
        out = _f10_np.where(_f10_np.abs(yy - 60.0) > 0.1)[0]
        lab = ("%s: %s s" % (nm, _f10_f(tt[out[-1] + 1] - 100.0, 0))) if len(out) and out[-1] + 1 < len(tt) else "%s: 揺れが続く" % nm
        o.append(q.clip(list(zip(r["t"][::20], r["y"][::20])), c=c, lw=1.8))
        o.append(T(q.x + q.w + 12, q.y + 18 + k * 16, lab, "start", 10, c, True))
    o.append(T(q.x + q.w + 12, q.y + 88, "±0.1 K に戻るまで", "start", 9, MUT))
    return _f10_svg(700, yb + 180, o, "温度の板の PID（24 W/K・T_I = 40 s・T_D = 10 s）で、不完全微分の N を変える。(a) 理想の微分では、読みのわずかなノイズが、ヒータが出せない負の電力や 80 W を超える電力になって現れる。N を小さくするほど電力の揺れは小さくなる。(b) 一方で、N を小さくしすぎると、D 動作の先読みが遅れて効かなくなり、外乱の後に揺れが長く続く。N は、ノイズへの弱さと D 動作の効き目の釣り合いで選ぶ。")
F["e10_noise_n"] = _f10_noise_n_fig()


def _f10_kick_fig():
    o = []
    t0 = 0.1
    step = lambda t: 1.0 if t >= t0 else 0.0
    rE = _f10_sim("mpos", 0.84, 5.0, 0.02, 0.7, 1e-5, r=step, N=10, dmode="e", every=10)
    rY = _f10_sim("mpos", 0.84, 5.0, 0.02, 0.7, 1e-5, r=step, N=10, dmode="y", every=10)
    o.append(T(14, 18, "(a) 何を微分するか（目標を 0.1 s に 1 rad 変える。N = 10）", "start", 11, INK, True))
    p = Plot(66, 34, 260, 120, (0, 0.7), (0, 1.4))
    o.append(p.axes(xl=None, yl="角度 [rad]", xt=[0, 0.1, 0.3, 0.5, 0.7], yt=[0, 0.5, 1.0], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(p.line([(0, 0), (t0, 0), (t0, 1), (0.7, 1)], c=MUT, lw=1.2, dash="5 3"))
    o.append(p.line(list(zip(rE["t"], rE["y"])), c=ALI, lw=1.9))
    o.append(p.line(list(zip(rY["t"], rY["y"])), c=SIG, lw=2.1))
    mpE, tsE = _f10_metrics(rE["t"], rE["y"], 1.0, t0)
    mpY, tsY = _f10_metrics(rY["t"], rY["y"], 1.0, t0)
    o.append(T(p.X(0.69), p.Y(0.42), "偏差の微分: 行き過ぎ %s %%" % _f10_f(mpE, 1), "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.69), p.Y(0.26), "測った角度の微分: %s %%" % _f10_f(mpY, 1), "end", 9.5, SIG, True, halo=True))
    q = Plot(66, 178, 260, 120, (0, 0.7), (-1, 10))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.1, 0.3, 0.5, 0.7], yt=[0, 2, 4, 6, 8, 10], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(q.line(list(zip(rE["t"], rE["u"])), c=ALI, lw=1.6))
    o.append(q.line(list(zip(rY["t"], rY["u"])), c=SIG, lw=2.0))
    o.append(T(q.X(0.112), q.Y(rE["u"].max()) + 6, "微分キック %s V" % _f10_f(rE["u"].max(), 1), "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0.15), q.Y(2.2), "測った角度の微分: 最大 %s V" % _f10_f(rY["u"].max(), 2), "start", 9.5, SIG, True, halo=True))
    # (b) 目標値の重み
    o.append(T(380, 18, "(b) 比例の目標値の重み b（測った角度の微分）", "start", 11, INK, True))
    p2 = Plot(430, 34, 250, 120, (0, 0.7), (0, 1.4))
    o.append(p2.axes(xl=None, yl="角度 [rad]", xt=[0, 0.1, 0.3, 0.5, 0.7], yt=[0, 0.5, 1.0], xfmt=lambda v: "", yfmt=_f10_n, sz=9))
    o.append(p2.line([(0, 0), (t0, 0), (t0, 1), (0.7, 1)], c=MUT, lw=1.2, dash="5 3"))
    q2 = Plot(430, 178, 250, 120, (0, 0.7), (-0.2, 1.0))
    o.append(q2.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.1, 0.3, 0.5, 0.7], yt=[0, 0.5, 1.0], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q2.x, q2.Y(0), q2.x + q2.w, q2.Y(0), c=MUT, lw=1))
    for k, (b, c) in enumerate(((1.0, SIG), (0.5, GRN), (0.0, GLD))):
        r = rY if b == 1.0 else _f10_sim("mpos", 0.84, 5.0, 0.02, 0.7, 1e-5, r=step, N=10, dmode="y", b=b, every=10)
        mp, ts = _f10_metrics(r["t"], r["y"], 1.0, t0)
        o.append(p2.line(list(zip(r["t"], r["y"])), c=c, lw=2))
        o.append(q2.line(list(zip(r["t"], r["u"])), c=c, lw=1.8))
        o.append(T(p2.X(0.69), p2.Y(0.42) + k * 15, "b = %s: %s %%・%s s" % (_f10_n(b), _f10_f(max(mp, 0.0), 1), _f10_f(ts, 2)), "end", 9.5, c, True, halo=True))
    o.append(T(p2.X(0.69), p2.Y(0.42) - 14, "行き過ぎ量・2 % 整定時間", "end", 9, MUT, halo=True))
    o.append(TX(q2.X(0.69), q2.Y(0.85), "目標を変えた瞬間の電圧の跳び: bK_P", "end", 9.5, INK, halo=True))
    return _f10_svg(700, 340, o, "モータの角度の PID（K_P = 0.84 V/rad、K_I = 5 V/(rad·s)、K_D = 0.02 V·s/rad、N = 10）で、目標を段差で変える。(a) 偏差を微分すると、目標の段差がそのまま微分され、電圧に 9.2 V の一瞬の山（微分キック）が出る（N なしの理想の微分なら限りなく高い）。測った角度だけを微分すると山は消える。2 つは目標値が一定の間は同じ働きで、極も同じである。(b) 比例の分の目標値に重み b を掛けると、目標を変えた瞬間の電圧の跳びと行き過ぎが小さくなる。b は外乱への応答を変えない。")
F["e10_kick"] = _f10_kick_fig()
