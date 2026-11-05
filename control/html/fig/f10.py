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
    return SVG(700, yb + 30, o, "同じ偏差の波形から、3 つの量を取り出せる。(a) 今の値は、比例制御（P 動作）が使う量である。(b) 時刻 0 からの面積（積分）は、過去の偏差がどれだけたまったかを表す。(c) 今の傾き（微分）は、偏差がこの先どちらへ動くかを表す。2 節と 3 節で、面積と傾きに比例した操作量を足していく。")
F["e10_views"] = _f10_views_fig()


def _f10_cart_delay(K, L=0.1, tend=3.0, h=2e-4, u0=2.0, r=1.0):
    """1 章の台車の速度（質量 1 kg、減衰係数 2 N·s/m）: u = u0 + K(r − 測った速度)、測った速度は L 遅れる。"""
    n = int(round(tend / h)); nd = int(round(L / h)); a = math.exp(-2.0 * h)
    v = _f10_np.zeros(n + 1)
    for k in range(n):
        vm = v[k - nd] if k >= nd else 0.0
        u = u0 + K * (r - vm)
        v[k + 1] = u / 2.0 + (v[k] - u / 2.0) * a
    return _f10_np.linspace(0, tend, n + 1), v


def _f10_p_limits_fig():
    o = []
    cols = [70, 418]; rows = [44, 236]; pw, ph = 250, 118
    # (a) 台車の速度: 偏差が残る
    p = Plot(cols[0], rows[0], pw, ph, (0, 1.0), (0, 1.15))
    o.append(T(14, rows[0] - 22, "(a) 台車の速度（目標 1 m/s。決めた力は足さない）", "start", 11, INK, True))
    o.append(p.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 0.25, 0.5, 0.75, 1.0], yt=[0, 0.5, 1.0], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    t = _f10_np.linspace(0, 1.0, 1001)
    for KP, c in ((2, TEA), (8, SIG), (20, PUR)):
        kk = 0.5 * KP
        y = kk / (1 + kk) * (1 - _f10_np.exp(-(1 + kk) / 0.5 * t))
        o.append(p.line(list(zip(t, y)), c=c, lw=2))
        o.append(TX(p.x + p.w + 6, p.Y(y[-1]) + 4, "K_P = %d: %s" % (KP, _f10_f(y[-1], 3)), "start", 9.5, c, True))
    o.append(T(p.x + 6, p.Y(0.12), "上げても 1 m/s に届かない", "start", 9.5, ALI, True, halo=True))
    # (b) モータの位置: 揺れが増え、速くならない
    q = Plot(cols[1], rows[0], pw, ph, (0, 0.5), (0, 1.8))
    o.append(T(cols[1] - 46, rows[0] - 22, "(b) モータの角度（目標 1 rad）", "start", 11, INK, True))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5], yt=[0, 0.5, 1.0, 1.5], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(RECT(q.x, q.Y(1.02), q.w, q.Y(0.98) - q.Y(1.02), 0, GSOFT, "none", 0))
    t = _f10_np.linspace(0, 0.5, 5001)
    labs = {0.21: ("0.21: 5.0 %、0.41 s", TEA), 0.84: ("0.84: 31.5 %、0.38 s", SIG), 10: ("10: 72.9 %、0.38 s", PUR)}
    for k, KP in enumerate((0.21, 0.84, 10)):
        y = _f10_cl_step([1000.0 * KP], [1.0, 20.0, 1000.0 * KP], t)
        lab, c = labs[KP]
        o.append(q.line(list(zip(t, y)), c=c, lw=1.8 if KP == 10 else 2))
        o.append(TX(q.x + q.w - 2, q.y + 12 + k * 14, "K_P = " + lab, "end", 9.5, c, True, halo=True))
    o.append(T(q.x + q.w - 2, q.y + q.h - 8, "行き過ぎ量・2 % 整定時間", "end", 9, MUT, halo=True))
    # (c) 台車 + 測った値の遅れ
    p = Plot(cols[0], rows[1], pw, ph, (0, 3.0), (0, 2.2))
    o.append(T(14, rows[1] - 22, "(c) 台車の速度（測った速度が 0.1 s 遅れる）", "start", 11, INK, True))
    o.append(p.axes(xl="時間 t [s]", yl="速度 [m/s]", xt=[0, 1, 2, 3], yt=[0, 1, 2], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    for KP, c, lab in ((8, TEA, "8: 最大 %s m/s"), (14, SIG, "14: 最大 %s m/s"), (20, ALI, "20: 振れが大きくなり続ける")):
        tt, v = _f10_cart_delay(KP)
        o.append(p.clip(list(zip(tt[::5], v[::5])), c=c, lw=1.6 if KP == 20 else 1.9))
        txt = ("K_P = " + lab % _f10_f(v.max(), 2)) if KP < 20 else "K_P = " + lab
        o.append(TX(p.x + p.w + 6, p.y + 14 + [8, 14, 20].index(KP) * 15, txt, "start", 9.5, c, True))
    # (d) モータの位置 + 負荷トルク
    q = Plot(cols[1], rows[1], pw, ph, (0, 0.6), (-5.5, 0.5))
    o.append(T(cols[1] - 46, rows[1] - 22, "(d) モータの角度（目標 0、負荷トルク 0.01 N·m）", "start", 11, INK, True))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6], yt=[-5, -4, -3, -2, -1, 0], xfmt=_f10_n, yfmt=_f10_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1.2, dash="5 3"))
    t = _f10_np.linspace(0, 0.6, 3001)
    for KP, c in ((0.21, TEA), (0.84, SIG)):
        y = -_f10_cl_step([1000.0], [1.0, 20.0, 1000.0 * KP], t)
        o.append(q.line(list(zip(t, y)), c=c, lw=2))
        o.append(TX(q.x + q.w - 4, q.Y(-1.0 / KP) + (-6 if KP == 0.21 else 15), "K_P = %s: −1 V ÷ K_P = %s rad" % (_f10_n(KP), _f10_f(-1.0 / KP, 2)), "end", 9.5, c, True, halo=True))
    return SVG(700, rows[1] + ph + 44, o, "比例制御（P 動作だけ）の限界を、前の章の例で数値に並べた。(a) 一次遅れの台車の速度は、比例ゲインを上げても目標値に届かない（3 章 6 節）。(b) モータの角度は、比例ゲインを上げると行き過ぎが増え、2 % 整定時間は 0.4 s 前後から縮まない（4 章 6 節）。(c) 測った値が遅れて届くと、比例ゲインを上げるほど揺れ、20 N/(m/s) で振れが大きくなり続ける（1 章 5 節）。(d) 操作量に加わる負荷トルク（電圧に換算して −1 V）を支える電圧を偏差から作るので、角度がずれたまま止まる（7 章 4 節）。")
F["e10_p_limits"] = _f10_p_limits_fig()
