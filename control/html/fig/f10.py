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
    o.append(TX(14, 18, "(a) 偏差（目標 1 rad。PD: K_P = 0.84 V/rad、K_D = 0.02 V·s/rad、T = K_D/K_P = 0.0238 s）", "start", 11, INK, True))
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
    o.append(TX(p.X(t1 + TD) + 6, p.Y(e1 + de1 * TD) + 12, "接線で T 先を予想: e + T de/dt = %s" % _f10_f(e1 + de1 * TD, 3), "start", 9.5, _F10_CD, True, halo=True))
    o.append(TX(p.X(t1 + TD) + 6, p.Y(e1 + de1 * TD) + 26, "（T 後の本当の偏差は %s rad）" % _f10_f(eD[k2], 3), "start", 9.5, SIG, halo=True))
    o.append(T(p.X(0.13), p.Y(-0.33), "比例だけ（K_P = 0.84）の偏差: 0 を大きく行き過ぎる", "start", 9.5, MUT, True, halo=True))
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
    o.append(LEGL(70, 398, [(INK, None, "電圧の合計"), (_F10_CP, None, "P の分 K_P e"), (_F10_CD, None, "D の分 K_D de/dt"), (_F10_CD, "6 3", "予想した偏差 e + T de/dt"), (MUT, "5 3", "比例だけの偏差")], 9.5, 14))
    return _f10_svg(700, 408, o, "D 動作は、偏差の傾きから、少し先の偏差を予想して電圧を決める。(a) K_P e + K_D de/dt = K_P(e + T de/dt)（T = K_D/K_P）で、e + T de/dt は、今の点で引いた接線の T 後の値である。(b) 角度が目標へ速く近づく間、D の分は負になってブレーキをかけ、偏差が 0 になる前に電圧の合計を負にする。比例だけでは、偏差が 0 になるまで加速の電圧を出し続けるので、大きく行き過ぎる。")
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
        o.append(TX(q.x - 30, 240 + k * 16, lab, "start", 10, c, True))
        o.append(T(q.x + 160, 240 + k * 16, "%s %%・%s s" % (_f10_f(mp, 1), _f10_f(ts, 3)), "start", 10, c))
    o.append(T(q.X(0.59), q.Y(1.02) - 4, "±2 %", "end", 9, GRN, halo=True))
    o.append(T(q.x + 160, 224, "行き過ぎ量・2 % 整定時間", "start", 9, MUT))
    o.append(TX(14, 304, "PD の特性方程式 Ts^2 + (1 + KK_D)s + KK_P = 0: K_D は s の係数だけを増やし、極の実部 −(1 + KK_D)/(2T) を左へ動かす。", "start", 10, INK))
    return _f10_svg(700, 316, o, "D 動作でモータの角度を速く落ち着かせる。(a) 比例だけでは、K_P をどれだけ上げても極の実部は −10 のまま上下に動くだけである（太い灰色の線）。K_D = 0.02 V·s/rad の D 動作を加えると、極の道は実部 −20 の線（緑の破線）に移る。(b) K_P = 0.84 V/rad で比例だけなら 31.5 % 行き過ぎるが、D 動作を加えると、K_P = 0.21 V/rad のときと同じ 5.0 % の行き過ぎで、2 % 整定時間は 0.414 s から 0.207 s に半分になる。")
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
    o.append(TX(q.X(42) - 4, q.Y(0.84) + 16, "1/T = 42 rad/s", "end", 9.5, INK, True, halo=True))
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
