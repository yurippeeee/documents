# -*- coding: utf-8 -*-
# 05 章 捕捉と追尾 の図
import numpy as _f05_np
from scipy import stats as _f05_st, optimize as _f05_opt, integrate as _f05_int

# ---- 例の値（本文と同じ） ----
_F05_FS = 2.048e6          # 2 節の例の標本の周波数（1 ms に 2048 標本、複素数の標本）
_F05_J = 2048
_F05_RC = 1.023e6
_F05_TAU = 120.25          # PRN 1 の符号の位相 [チップ]
_F05_FD = 1630.0           # PRN 1 のドップラー [Hz]
_F05_CN0 = 45.0            # [dB-Hz]
_F05_LAM = 299792458.0 / 1575.42e6
_F05_CTC = 299792458.0 / 1.023e6   # 1 チップの距離 293.05 m


def _f05_m(v, d=None):
    """数の文字（負の符号は −）。"""
    if d is None:
        s = "0" if abs(v) < 1e-12 else ("%g" % v)
    else:
        s = ("%." + str(d) + "f") % v
    return s.replace("-", "−")


def _f05_g(v, d=0):
    """3 桁ごとに空白を入れた数。"""
    s = ("%." + str(d) + "f") % abs(v)
    ip, _, fp = s.partition(".")
    ip = "{:,}".format(int(ip)).replace(",", " ")
    return ("−" if v < 0 else "") + ip + ("." + fp if fp else "")


def _f05_lam(x):
    return _f05_np.maximum(0.0, 1.0 - _f05_np.abs(x))


def _f05_code_samples(prn, tau_chips=0.0, J=_F05_J, fs=_F05_FS, t0=0.0):
    """標本の時刻の C/A 符号（+1/−1）。tau_chips だけ遅れた符号。"""
    pm = _f05_np.array(ca_pm(prn), dtype=float)
    t = t0 + _f05_np.arange(J) / fs
    idx = _f05_np.floor((t * _F05_RC - tau_chips)).astype(int) % 1023
    return pm[idx]


def _f05_received(ms, cn0, seed, sats=((1, _F05_TAU, _F05_FD, 0.7),), J=_F05_J, fs=_F05_FS):
    """複素数の標本（周波数 0 のまわりに下げた信号）。信号の振幅 1、雑音は C/N0 に合わせる。"""
    rng = _f05_np.random.default_rng(seed)
    n = J * ms
    t = _f05_np.arange(n) / fs
    y = _f05_np.zeros(n, dtype=complex)
    pm = {}
    for prn, tau, fd, ph in sats:
        if prn not in pm:
            pm[prn] = _f05_np.array(ca_pm(prn), dtype=float)
        idx = _f05_np.floor(t * _F05_RC - tau).astype(int) % 1023
        y += pm[prn][idx] * _f05_np.exp(1j * (2 * _f05_np.pi * fd * t + ph))
    c = 10 ** (cn0 / 10)
    sd = _f05_np.sqrt(fs / c / 2)       # 1 標本の雑音（実部・虚部それぞれ）: 電力 N0 fs、N0 = 1/(C/N0)
    y += sd * (rng.standard_normal(n) + 1j * rng.standard_normal(n))
    return y


def _f05_search(y, prn, bins, ms, J=_F05_J, fs=_F05_FS):
    """FFT による捕捉。bins [Hz] ごとに、ms 個の 1 ms の積を足してから逆 FFT。p = |R|²/(雑音の平均)。"""
    A = _f05_np.fft.fft(_f05_code_samples(prn, 0.0, J, fs))
    t = _f05_np.arange(J * ms) / fs
    out = _f05_np.zeros((len(bins), J))
    for i, f in enumerate(bins):
        z = y * _f05_np.exp(-2j * _f05_np.pi * f * t)
        acc = _f05_np.zeros(J, dtype=complex)
        for k in range(ms):
            acc += _f05_np.fft.fft(z[k * J:(k + 1) * J]) * _f05_np.conj(A)
        R = _f05_np.fft.ifft(acc)          # = Σ_n z[n] a[(n−k) mod J]
        out[i] = _f05_np.abs(R) ** 2
    return out


def _f05_noise_mean(cn0, ms, J=_F05_J, fs=_F05_FS):
    """雑音だけのときの |R|² の平均: J·ms 標本 × 1 標本の雑音の電力 fs/(C/N0)。"""
    return J * ms * fs / 10 ** (cn0 / 10)


# =====================================================================
# 1 節: 探索の格子と、相関の山（立体の図）
# =====================================================================
def _f05_ridge(o, rows, xs, x0, y0, WW, dx, dy, hz, pmax, cols=None, lw=1.1, fill=SCR):
    """立体の図（奥の行から順に、地の色で塗った折れ線を重ねて、後ろの線を隠す）。rows[r] は xs の各点の高さ。"""
    n = len(rows)
    for r in range(n - 1, -1, -1):
        pts = [(x0 + u * WW + r * dx, y0 - r * dy - min(p, pmax) * hz) for u, p in zip(xs, rows[r])]
        base = [(x0 + xs[-1] * WW + r * dx, y0 - r * dy), (x0 + xs[0] * WW + r * dx, y0 - r * dy)]
        c = cols[r] if cols else MUT
        o.append(PL(pts + base, c="none", lw=0, fill=fill))
        o.append(PL(pts, c=c, lw=lw))


def _f05_grid_fig():
    o = []
    bins = _f05_np.arange(-5000, 5001, 500.0)
    y = _f05_received(1, _F05_CN0, 13)
    P = _f05_search(y, 1, bins, 1) / _f05_noise_mean(_F05_CN0, 1)
    ipk, kpk = _f05_np.unravel_index(P.argmax(), P.shape)
    # (a) 全部の格子（符号の位相は 8 標本ごとに 1 つを描く。山の標本は必ず描く）
    o.append(T(14, 18, "(a) 1 つの衛星の格子の全部（2046 × 21 = 42 966 ビン）", "start", 11, INK, True))
    sel = _f05_np.arange(0, _F05_J, 8)
    sel = _f05_np.where(_f05_np.abs(sel - kpk) < 4, kpk, sel)
    sub = P[:, sel]
    xs = (sel + 0.5) / _F05_J
    x0, y0, WW, dx, dy, hz, pmax = 46, 300, 450, 7.0, 6.4, 4.4, 40.0
    n = len(bins)
    for r in range(n - 1, -1, -1):
        pts = [(x0 + u * WW + r * dx, y0 - r * dy - min(p_, pmax) * hz) for u, p_ in zip(xs, sub[r])]
        base = [(x0 + xs[-1] * WW + r * dx, y0 - r * dy), (x0 + xs[0] * WW + r * dx, y0 - r * dy)]
        o.append(PL(pts + base, c=SIG if r == ipk else MUT, lw=1.3 if r == ipk else 0.9, fill=SCR))
    o.append(W(x0, y0 + 4, x0 + WW, y0 + 4, c=MUT, lw=1.1))
    for v in (0, 200, 400, 600, 800, 1000):
        xx = x0 + v / 1023 * WW
        o.append(W(xx, y0 + 4, xx, y0 + 8, c=MUT, lw=1))
        o.append(T(xx, y0 + 20, "%d" % v, "middle", 9.5, MUT))
    o.append(T(x0 + WW / 2, y0 + 36, "符号の位相 [チップ]", "middle", 10, MUT))
    for r, lab in ((0, "−5 kHz"), (10, "0 kHz"), (20, "+5 kHz")):
        o.append(T(x0 + WW + r * dx + 6, y0 - r * dy + 4, lab, "start", 9.5, MUT))
    o.append(T(x0 + WW + 20 * dx - 4, y0 - 20 * dy - 16, "ドップラー", "start", 9.5, MUT))
    pk = float(P[ipk, kpk])
    xpk = x0 + (kpk + 0.5) / _F05_J * WW + ipk * dx
    ytop = y0 - ipk * dy - min(pk, pmax) * hz
    o.append(T(xpk + 8, ytop + 6, "山: p = %.1f" % pk, "start", 10, SIG, True, halo=True))
    o.append(T(xpk + 8, ytop + 20, "%.2f チップ・+%d Hz のビン" % (kpk * 1023.0 / _F05_J, int(bins[ipk])), "start", 9.5, SIG, False, halo=True))
    # 山の近く（±3 標本・±2 ビン）を除いた、雑音だけのビンの最大
    mask = _f05_np.ones(P.shape, bool)
    mask[max(0, ipk - 2):ipk + 3, :] &= ~((_f05_np.abs(_f05_np.arange(_F05_J) - kpk) <= 3)[None, :])
    nzmax = float(P[mask].max())
    o.append(T(14, 54, "縦: 電力を雑音の平均で割った値 p", "start", 9.5, MUT))
    o.append(T(14, 69, "雑音だけのビンの最大 p = %.1f（平均は 1）" % nzmax, "start", 9.5, MUT))
    o.append(W(10, 352, 690, 352, c=LIN, lw=0.8))
    # (b) 山の近く（雑音の無い式の値）
    yb = 374
    o.append(T(14, yb, "(b) 山の近く（雑音の無い式の値）", "start", 11, INK, True))
    T1 = 1e-3
    fl = [500.0, 1000.0, 1500.0, 2000.0, 2500.0]
    cx = _f05_np.linspace(118.25, 122.25, 161)
    X0, Y0, W2, DX, DY, HZ = 50, yb + 156, 210, 16.0, 19.0, 84.0
    for r in range(len(fl) - 1, -1, -1):
        f = fl[r]
        vals = _f05_lam(cx - _F05_TAU) ** 2 * _f05_np.sinc((f - _F05_FD) * T1) ** 2
        xs2 = (cx - cx[0]) / (cx[-1] - cx[0])
        pts = [(X0 + u * W2 + r * DX, Y0 - r * DY - v * HZ) for u, v in zip(xs2, vals)]
        base = [(X0 + W2 + r * DX, Y0 - r * DY), (X0 + r * DX, Y0 - r * DY)]
        o.append(PL(pts + base, c=MUT, lw=1.2, fill=SCR))
        if r == 2:   # 本当のドップラー +1630 Hz の断面（1500 Hz と 2000 Hz の行の間）
            rr = (_F05_FD - 500.0) / 500.0
            tr = _f05_lam(cx - _F05_TAU) ** 2
            o.append(PL([(X0 + u * W2 + rr * DX, Y0 - rr * DY - v * HZ) for u, v in zip(xs2, tr)], c=GLD, lw=1.7, dash="4 3"))
            o.append(D(X0 + (_F05_TAU - cx[0]) / 4.0 * W2 + rr * DX, Y0 - rr * DY - 1.0 * HZ, GLD, 4.2))
        for kk in range(237, 245):
            c0 = kk * 1023.0 / _F05_J
            v = float(_f05_lam(c0 - _F05_TAU) ** 2 * _f05_np.sinc((f - _F05_FD) * T1) ** 2)
            xx = X0 + (c0 - cx[0]) / 4.0 * W2 + r * DX
            yy = Y0 - r * DY - v * HZ
            if v > 0.02:
                o.append(W(xx, Y0 - r * DY, xx, yy, c=FNT, lw=0.8))
            o.append(D(xx, yy, SIG if (r == 2 and kk == 241) else INK, 3.6 if (r == 2 and kk == 241) else 2.4))
        o.append(T(X0 + W2 + r * DX + 6, Y0 - r * DY + 4, "%d Hz" % f, "start", 9.5, MUT))
    o.append(W(X0, Y0 + 4, X0 + W2, Y0 + 4, c=MUT, lw=1.1))
    for v in (118.5, 119.5, 120.5, 121.5):
        xx = X0 + (v - cx[0]) / 4.0 * W2
        o.append(W(xx, Y0 + 4, xx, Y0 + 8, c=MUT, lw=1))
        o.append(T(xx, Y0 + 20, _f05_m(v), "middle", 9.5, MUT))
    o.append(T(X0 + W2 / 2, Y0 + 36, "符号の位相 [チップ]", "middle", 10, MUT))
    best = float(_f05_lam(241 * 1023.0 / _F05_J - _F05_TAU) ** 2 * _f05_np.sinc((1500.0 - _F05_FD) * T1) ** 2)
    xt = 400
    o.append(T(xt, yb + 34, "灰の線: ビンの行（500 Hz ごと）の式の値", "start", 9.5, MUT))
    o.append(T(xt, yb + 52, "点: ビン（1 ms に 2048 標本。約 1/2 チップごと）", "start", 9.5, INK))
    o.append(T(xt, yb + 70, "金の破線: 本当のドップラー +1630 Hz の断面", "start", 9.5, GLD, True))
    o.append(T(xt, yb + 88, "金の点: 本当の頂点（120.25 チップ、高さ 1）", "start", 9.5, GLD))
    o.append(T(xt, yb + 112, "最も高いビン（青の点）でも %.2f 倍" % best, "start", 10, SIG, True))
    o.append(T(xt, yb + 128, "（−%.2f dB）。頂点がビンの間にあるため" % (-10 * math.log10(best)), "start", 9.5, SIG))
    return SVG(700, yb + 200, o, "PRN 1 の信号（符号の位相 120.25 チップ、ドップラー +1630 Hz、C/N0 45 dB-Hz）を、積分の時間 1 ms の格子で探した結果。(a) 縦は相関の電力を雑音の平均で割った値で、行は 500 Hz ごとのドップラーのビン（8 つに 1 つの符号の位相を描いた）。山が立つのは 1 か所だけである。(b) 山の近くの式の値（三角形の 2 乗と sinc² の積）。ビンは山をとびとびの間隔でしか見ないので、本当の頂点より低い所で山を見る。")
F["e05_grid"] = _f05_grid_fig()


# =====================================================================
# 1 節: 刻みの損失と、見つかる割合
# =====================================================================
def _f05_pd(snr, thr):
    return _f05_st.ncx2.sf(2 * thr, 2, 2 * _f05_np.asarray(snr))


def _f05_pmax(snr, M):
    f = lambda x: _f05_st.ncx2.pdf(2 * x, 2, 2 * snr) * 2 * (1 - _f05_np.exp(-x)) ** M
    return _f05_int.quad(f, 0, snr * 4 + 60, limit=400)[0]


_F05_GRID = _f05_np.linspace(-0.25, 0.25, 41)
_F05_STR = ((_f05_lam(_F05_GRID)[:, None] ** 2) * (_f05_np.sinc(_F05_GRID)[None, :] ** 2)).ravel()   # 刻みの損失（一様に並べた位置）


def _f05_pd_str(snr, thr):
    return float(_f05_pd(snr * _F05_STR, thr).mean())


def _f05_binstep_fig():
    o = []
    T1 = 1e-3
    # (a) ドップラーの断面
    o.append(T(14, 18, "(a) ドップラーの断面（1 ms）", "start", 11, INK, True))
    p = Plot(56, 40, 180, 130, (-1500, 1500), (0, 1.1))
    o.append(p.axes(xl=None, yl="電力の倍率", xt=[-1000, 0, 1000], yt=[0, 0.5, 1.0], xfmt=_f05_m, yfmt=lambda v: _f05_m(v, 1)))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "周波数のずれ Δf [Hz]", "middle", 10, MUT))
    fs_ = _f05_np.linspace(-1500, 1500, 301)
    o.append(p.line(list(zip(fs_, _f05_np.sinc(fs_ * T1) ** 2)), c=SIG, lw=2))
    for f in (-1000, -500, 0, 500, 1000):
        o.append(D(p.X(f), p.Y(_f05_np.sinc(f * T1) ** 2), INK, 2.8))
    w1 = float(_f05_np.sinc(0.25) ** 2); w2 = float(_f05_np.sinc(0.5) ** 2)
    o.append(W(p.X(250), p.Y(0), p.X(250), p.Y(w1), c=GRN, lw=1.2, dash="3 2")); o.append(D(p.X(250), p.Y(w1), GRN, 4))
    o.append(W(p.X(500), p.Y(0), p.X(500), p.Y(w2), c=ALI, lw=1.2, dash="3 2")); o.append(D(p.X(500), p.Y(w2), ALI, 4))
    o.append(T(14, 212, "緑: 500 Hz の刻みの真ん中（250 Hz）", "start", 9.5, GRN, True))
    o.append(T(14, 226, "　0.81 倍（−0.91 dB）", "start", 9.5, GRN))
    o.append(T(14, 242, "赤: 1 kHz の刻みの真ん中（500 Hz）", "start", 9.5, ALI, True))
    o.append(T(14, 256, "　0.41 倍（−3.92 dB）", "start", 9.5, ALI))
    # (b) 符号の位相の断面
    xb = 270
    o.append(T(xb - 14, 18, "(b) 符号の位相の断面", "start", 11, INK, True))
    q = Plot(xb + 30, 40, 160, 130, (-1.5, 1.5), (0, 1.1))
    o.append(q.axes(xl="符号のずれ Δτ [チップ]", xt=[-1, -0.5, 0, 0.5, 1], yt=[0, 0.5, 1.0], xfmt=_f05_m, yfmt=lambda v: ""))
    cs = _f05_np.linspace(-1.5, 1.5, 301)
    o.append(q.line(list(zip(cs, _f05_lam(cs) ** 2)), c=SIG, lw=2))
    for c0 in (-1, -0.5, 0, 0.5, 1):
        o.append(D(q.X(c0), q.Y(float(_f05_lam(c0)) ** 2), INK, 2.8))
    o.append(W(q.X(0.25), q.Y(0), q.X(0.25), q.Y(0.5625), c=GRN, lw=1.2, dash="3 2")); o.append(D(q.X(0.25), q.Y(0.5625), GRN, 4))
    o.append(T(xb - 14, 212, "緑: 1/2 チップの刻みの真ん中", "start", 9.5, GRN, True))
    o.append(T(xb - 14, 226, "　（1/4 チップ）0.56 倍（−2.50 dB）", "start", 9.5, GRN))
    # (c) 見つかる割合
    xc = 486
    o.append(T(xc - 6, 18, "(c) 見つかる割合と SN 比", "start", 11, INK, True))
    r = Plot(xc + 44, 40, 156, 130, (6, 20), (0, 1.0))
    o.append(r.axes(xl="SNR [dB]", yl="割合", xt=[6, 10, 14, 18], yt=[0, 0.5, 0.9], xfmt=_f05_m, yfmt=lambda v: _f05_m(v, 1)))
    o.append(W(r.x, r.Y(0.9), r.x + r.w, r.Y(0.9), c=FNT, lw=1, dash="4 3"))
    sdb = _f05_np.linspace(6, 20, 57)
    Mx = 42966; thr = float(_f05_np.log(Mx / 0.01))
    c1 = [(s, _f05_pmax(10 ** (s / 10), 1022)) for s in sdb]
    c2 = [(s, float(_f05_pd(10 ** (s / 10), thr))) for s in sdb]
    c3 = [(s, _f05_pd_str(10 ** (s / 10), thr)) for s in sdb]
    o.append(r.line(c1, c=MUT, lw=1.6, dash="5 3"))
    o.append(r.line(c2, c=SIG, lw=1.8))
    o.append(r.line(c3, c=ALI, lw=2))
    for curve, c, lab in ((c1, MUT, "11.1"), (c2, SIG, "13.6"), (c3, ALI, "15.3")):
        s90 = _f05_np.interp(0.9, [v for _, v in curve], [s for s, _ in curve])
        o.append(D(r.X(s90), r.Y(0.9), c, 3.6))
    o.append(LEGL(xc - 6, 216, [(MUT, "5 3", "3 章 6 節の基準（11.1 dB）")], 9.5, 12))
    o.append(LEGL(xc - 6, 232, [(SIG, None, "しきい値・42 966 ビン（13.6 dB）")], 9.5, 12))
    o.append(LEGL(xc - 6, 248, [(ALI, None, "さらに刻みの損失（15.3 dB）")], 9.5, 12))
    o.append(T(14, 282, "(c) のしきい値は、格子全体で誤って超える確率を 1 % にした値（雑音の平均の 11.8 dB 上）。", "start", 9.5, MUT))
    o.append(T(14, 297, "3 章 6 節の基準は、1023 通りの中の最大が本当のずれに来る割合（しきい値なし）。", "start", 9.5, MUT))
    return SVG(700, 306, o, "ビンの刻みと、見つけるのに要る SN 比。(a) ドップラーの向きの電力は sinc² の形で、500 Hz（1/(2T_coh)）の刻みなら、真ん中でも 0.81 倍で済むが、1 kHz の刻みでは 0.41 倍に落ちる。(b) 符号の位相の向きは三角形の 2 乗で、1/2 チップの刻みの真ん中では 0.56 倍になる。(c) 検出確率（見つかる割合）と SNR。3 章 6 節の基準より、ビンの数としきい値の分と、刻みの損失の分だけ、多くの SN 比が要る（点が 90 %）。")
F["e05_binstep"] = _f05_binstep_fig()


# =====================================================================
# 1 節: ビットの境目
# =====================================================================
def _f05_bitedge_fig():
    o = []
    o.append(T(14, 18, "(a) データのビットの境目と、積分の時間の窓", "start", 11, INK, True))
    x0, w, t0, t1 = 40, 420, 0.0, 60.0
    X = lambda t: x0 + (t - t0) / (t1 - t0) * w
    # ビット（20 ms）: +1, −1, −1
    yb = 46
    bits = [(-0.0, 13.0, 1), (13.0, 33.0, -1), (33.0, 53.0, -1), (53.0, 60.0, 1)]
    for a, b, v in bits:
        yy = yb if v > 0 else yb + 22
        o.append(W(X(a), yy, X(b), yy, c=SIG, lw=2))
    for e in (13.0, 33.0, 53.0):
        o.append(W(X(e), yb, X(e), yb + 22, c=SIG, lw=2 if e != 33.0 else 1, dash=None if e != 33.0 else "2 2"))
        o.append(W(X(e), yb + 26, X(e), 214, c=FNT, lw=0.9, dash="2 3"))
    o.append(T(X(0) - 4, yb + 4, "+1", "end", 9.5, SIG, True))
    o.append(T(X(0) - 4, yb + 26, "−1", "end", 9.5, SIG, True))
    o.append(T(X(23), yb - 6, "1 bit = 20 ms", "middle", 9.5, SIG))
    o.append(T(X(33), yb + 36, "同じ値なので変わらない", "middle", 9, MUT, False, halo=True))
    # 窓
    def win(y, a, b, ok, lab, sub=None):
        c = GRN if ok else ALI
        o.append(RECT(X(a), y, X(b) - X(a), 16, 3, soft(c), c, 1.2))
        o.append(T((X(a) + X(b)) / 2, y + 12, lab, "middle", 9, c, True))
    yw = 96
    o.append(T(X(0) - 4, yw + 12, "10 ms", "end", 9.5, INK, True))
    win(yw, 5, 15, False, "境目あり 0.6 倍")
    win(yw, 15, 25, True, "境目なし")
    o.append(T(X(25) + 6, yw + 12, "← 2 回のうち良い方を使う", "start", 9, GRN, True))
    yw2 = 128
    o.append(T(X(0) - 4, yw2 + 12, "20 ms", "end", 9.5, INK, True))
    win(yw2, 5, 25, False, "境目が 8 ms 目: 0.2 倍")
    yw3 = 160
    o.append(T(X(0) - 4, yw3 + 12, "20 ms", "end", 9.5, INK, True))
    o.append(T(X(0) - 4, yw3 + 26, "ずらす", "end", 9, MUT))
    for k, s in enumerate((1, 5, 9, 13, 17)):
        yy = yw3 + k * 4
        c = GRN if s == 13 else FNT
        o.append(W(X(s), yy, X(s + 20), yy, c=c, lw=2.4 if s == 13 else 1.2))
    o.append(T(X(37) + 4, yw3 + 14, "4 ms ずつ 5 通り。境目にそろう窓（緑）が最大", "start", 9, GRN, True))
    for v in (0, 10, 20, 30, 40, 50, 60):
        o.append(W(X(v), 214, X(v), 218, c=MUT, lw=1))
        o.append(T(X(v), 230, "%d" % v, "middle", 9.5, MUT))
    o.append(W(X(0), 214, X(60), 214, c=MUT, lw=1.1))
    o.append(T(X(30), 246, "時間 [ms]", "middle", 10, MUT))
    # (b) 和の大きさ |1 − 2ξ|
    xb = 500
    o.append(T(xb - 10, 18, "(b) 境目の位置と和の大きさ", "start", 11, INK, True))
    p = Plot(xb + 36, 48, 150, 140, (0, 1), (0, 1.05))
    o.append(p.axes(xl="境目の位置 ξ", yl="和の大きさ", xt=[0, 0.25, 0.5, 0.75, 1], yt=[0, 0.5, 0.707, 1.0], xfmt=lambda v: _f05_m(v), yfmt=lambda v: _f05_m(v, 2) if v not in (0, 1.0) else _f05_m(v)))
    a = 0.5 - 0.5 / math.sqrt(2); b = 0.5 + 0.5 / math.sqrt(2)
    o.append(RECT(p.X(a), p.y, p.X(b) - p.X(a), p.h, 0, ASOFT, "none", 0))
    o.append(p.line([(0, 1), (0.5, 0), (1, 1)], c=SIG, lw=2.2))
    o.append(W(p.x, p.Y(0.707), p.x + p.w, p.Y(0.707), c=ALI, lw=1, dash="4 3"))
    o.append(T(p.X(0.5), p.Y(0.88), "3 dB 以上", "middle", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.5), p.Y(0.78), "失う範囲", "middle", 9.5, ALI, True, halo=True))
    o.append(T(xb - 10, 236, "ビットが変わるとき、前の部分 ξ と", "start", 9.5, MUT))
    o.append(T(xb - 10, 251, "後の部分 −(1 − ξ) が打ち消し合う", "start", 9.5, MUT))
    return SVG(700, 262, o, "ビットの境目と積分の時間。(a) 10 ms の積分を 2 回続けると、20 ms の中の境目は 1 つなので、どちらかは境目を含まない。20 ms の窓は必ず境目を含み、ビットが変わると和が小さくなるので、窓を始める時刻を 4 ms ずつずらして試し、境目にそろった窓を選ぶ。(b) 窓の初めから割合 ξ の所に境目があり、前後でビットが違うと、和の大きさは |1 − 2ξ| 倍になる。")
F["e05_bitedge"] = _f05_bitedge_fig()


# =====================================================================
# 2 節: 直列の探索と FFT による捕捉の流れ
# =====================================================================
def _f05_blk(o, x, y, w, h, t1, t2=None, c=SIG, fill=PAN, sz=10):
    o.append(RECT(x, y, w, h, 6, fill, c, 1.4))
    if t2:
        o.append(TX(x + w / 2, y + h / 2 - 3, t1, "middle", sz, INK, True))
        o.append(TX(x + w / 2, y + h / 2 + 11, t2, "middle", 9, MUT))
    else:
        o.append(TX(x + w / 2, y + h / 2 + 4, t1, "middle", sz, INK, True))


def _f05_fftflow_fig():
    o = []
    # (a) 直列
    o.append(T(14, 18, "(a) 直列: 符号の位相を 1 つずつ（1 つのドップラーのビン）", "start", 11, INK, True))
    y1 = 40; h = 40
    _f05_blk(o, 14, y1, 92, h, "標本 1 ms", "J 個", GLD)
    o.append(ARR(106, y1 + h / 2, 126, y1 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 126, y1, 120, h, "× 局部の搬送波", "そのビンのドップラー", SIG)
    o.append(ARR(246, y1 + h / 2, 266, y1 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 266, y1, 150, h, "× 局部の符号（位相 k）", "J 回足す → R[k]", SIG)
    o.append(ARR(416, y1 + h / 2, 436, y1 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 436, y1, 64, h, "|R[k]|²", None, SIG)
    o.append(ARR(500, y1 + h / 2, 520, y1 + h / 2, c=MUT, lw=1.4, head=6))
    o.append(T(526, y1 + 17, "1 つの位相の電力", "start", 10, INK))
    o.append(T(526, y1 + 32, "（1 つのビン）", "start", 9.5, MUT))
    o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (468, y1 + h, 468, y1 + h + 26, 341, y1 + h + 26, 341, y1 + h + 4), c=ALI, lw=1.4))
    o.append(T(404, y1 + h + 32, "k を変えて 2046 回くり返す（J × 2046 回の足し算）", "middle", 9.5, ALI, True))
    o.append(W(10, 136, 690, 136, c=LIN, lw=0.8))
    # (b) FFT
    o.append(T(14, 158, "(b) FFT による捕捉: 1 つのドップラーで、全部の位相を一度に", "start", 11, INK, True))
    y2 = 178
    _f05_blk(o, 14, y2, 92, h, "標本 1 ms", "y[n]（J 個）", GLD)
    o.append(ARR(106, y2 + h / 2, 122, y2 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 122, y2, 104, h, "× 局部の搬送波", None, SIG)
    o.append(ARR(226, y2 + h / 2, 242, y2 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 242, y2, 64, h, "FFT", "Y[m]", PUR)
    o.append(ARR(306, y2 + h / 2, 330, y2 + h / 2, c=MUT, lw=1.4, head=6))
    o.append(CIRC(343, y2 + h / 2, 13, c=INK, lw=1.4, fill=SCR))
    o.append(T(343, y2 + h / 2 + 5, "×", "middle", 13, INK, True))
    o.append(ARR(356, y2 + h / 2, 376, y2 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 376, y2, 76, h, "逆 FFT", "R[k]", PUR)
    o.append(ARR(452, y2 + h / 2, 468, y2 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 468, y2, 60, h, "|R[k]|²", None, SIG)
    o.append(ARR(528, y2 + h / 2, 544, y2 + h / 2, c=MUT, lw=1.4, head=6))
    o.append(T(550, y2 + 17, "J 通りの位相の", "start", 10, INK))
    o.append(T(550, y2 + 32, "電力が一度に出る", "start", 10, INK))
    # 局部の符号の FFT（衛星ごとに 1 回）
    y3 = y2 + 74
    _f05_blk(o, 122, y3, 104, h, "局部の符号", "a[n]（PRN 番号）", GRN)
    o.append(ARR(226, y3 + h / 2, 242, y3 + h / 2, c=MUT, lw=1.4, head=6))
    _f05_blk(o, 242, y3, 64, h, "FFT", "A[m]", PUR)
    o.append(W(306, y3 + h / 2, 343, y3 + h / 2, c=MUT, lw=1.4))
    o.append(ARR(343, y3 + h / 2, 343, y2 + h / 2 + 14, c=MUT, lw=1.4, head=6))
    o.append(TX(350, y3 + h / 2 - 8, "共役 A^{*}[m]", "start", 10, PUR, True, halo=True))
    o.append(T(122, y3 + h + 18, "局部の符号の FFT は、衛星ごとに 1 回だけ計算しておく", "start", 9.5, GRN))
    o.append(T(456, y3 + 12, "1 つのビンの計算（J = 2048）", "start", 9.5, MUT, True))
    o.append(T(456, y3 + 28, "直列: 4.19 × 10⁶ 回", "start", 9.5, ALI))
    o.append(T(456, y3 + 44, "FFT: 7.17 × 10⁴ 回（58 分の 1）", "start", 9.5, GRN, True))
    o.append(W(10, 360, 690, 360, c=LIN, lw=0.8))
    # (c) 円状にずらす
    o.append(T(14, 382, "(c) 円状の相関: 1 ms の外へはみ出した標本は、列の初めに回して数える（C/A 符号は 1 ms ごとに繰り返す）", "start", 10.5, INK, True))
    pm = _f05_np.array(ca_pm(1)[:30], dtype=float)
    cw = 15.0; xa = 96; ya = 398; hh = 14; nn = 30; sh = 4
    o.append(T(xa - 8, ya + 11, "元の列", "end", 9.5, INK, True))
    o.append(T(xa - 8, ya + 45, "4 個ずらす", "end", 9.5, INK, True))
    for i in range(nn):
        c = SIG if pm[i] > 0 else GLD
        if i >= nn - sh:
            c = ALI
        o.append(RECT(xa + i * cw, ya, cw - 1.5, hh, 2, soft(c), c, 1.0))
        j = (i - sh) % nn
        c2 = ALI if j >= nn - sh else (SIG if pm[j] > 0 else GLD)
        o.append(RECT(xa + i * cw, ya + 34, cw - 1.5, hh, 2, soft(c2), c2, 1.0))
    o.append(CARR(xa + (nn - 2) * cw, ya + hh + 2, xa + 2 * cw, ya + 32, bend=-0.08, c=ALI, lw=1.4, head=6))
    o.append(T(xa + nn / 2 * cw, ya + 30, "末尾の 4 個が初めに回る", "middle", 9.5, ALI, True, halo=True))
    o.append(T(xa + nn * cw + 10, ya + 11, "青 +1・金 −1", "start", 9.5, MUT))
    o.append(T(xa + nn * cw + 10, ya + 26, "（30 個だけ描いた）", "start", 9.5, MUT))
    return SVG(700, 462, o, "直列の探索と FFT による捕捉。(a) 直列では、符号の位相 1 つごとに J 個の標本を掛けて足す。(b) FFT による捕捉では、局部の搬送波を掛けた標本の FFT に、局部の符号の FFT の共役を掛け、逆 FFT すると、J 通りの位相の相関 R[k] が一度に求まる（円状の相関 = 周波数での掛け算）。(c) 円状にずらすと、はみ出した標本が初めに回る。C/A 符号は 1 ms ごとに同じ並びを繰り返すので、受けた 1 ms の標本は、符号を円状にずらしたものになっている。")
F["e05_fftflow"] = _f05_fftflow_fig()


# =====================================================================
# 2 節: FFT による捕捉の途中の値（PRN 1 の例）
# =====================================================================
def _f05_fftcalc_fig():
    o = []
    bins = _f05_np.arange(-5000, 5001, 500.0)
    y = _f05_received(1, _F05_CN0, 13)
    J = _F05_J
    t = _f05_np.arange(J) / _F05_FS
    z = y[:J] * _f05_np.exp(-2j * _f05_np.pi * 1500.0 * t)
    a = _f05_code_samples(1, 0.0)
    Y = _f05_np.fft.fft(z)
    A = _f05_np.fft.fft(a)
    R = _f05_np.fft.ifft(Y * _f05_np.conj(A))
    nm = _f05_noise_mean(_F05_CN0, 1)
    p = _f05_np.abs(R) ** 2 / nm
    # 直列に足した相関（一部の k）
    ks = list(range(0, J, 64)) + list(range(236, 247))
    Rd = {k: complex(_f05_np.sum(z * _f05_np.roll(a, k))) for k in ks}
    err = max(abs(Rd[k] - R[k]) for k in ks) / abs(R).max()
    # (a) 標本
    o.append(T(14, 18, "(a) 局部の搬送波を掛けた後の標本（実部、初めの 100 個）", "start", 10.5, INK, True))
    pa = Plot(56, 36, 270, 110, (0, 100), (-20, 20))
    o.append(pa.axes(xl="標本の番号 n", yl="値", xt=[0, 25, 50, 75, 100], yt=[-20, 0, 20], xfmt=_f05_m, yfmt=_f05_m))
    n = _f05_np.arange(100)
    clean = (a * 0 + _f05_code_samples(1, _F05_TAU)[:J]) * _f05_np.exp(1j * (2 * _f05_np.pi * (_F05_FD - 1500.0) * t + 0.7))
    o.append(pa.line(list(zip(n, z[:100].real)), c=TEA, lw=1.0))
    o.append(pa.line(list(zip(n, clean[:100].real)), c=SIG, lw=1.8))
    o.append(T(pa.x + pa.w, pa.y - 4, "青: 信号だけ（±1）・青緑: 雑音を含む", "end", 9.5, MUT))
    # (b) |Y[m]|
    xb = 370
    o.append(T(xb, 18, "(b) 標本の DFT の大きさ |Y[m]|", "start", 10.5, INK, True))
    pb = Plot(xb + 44, 36, 260, 110, (-1.024, 1.024), (0, 1.0))
    Ys = _f05_np.fft.fftshift(_f05_np.abs(Y)) / _f05_np.abs(Y).max()
    fr = (_f05_np.arange(J) - J // 2) * (_F05_FS / J) / 1e6
    o.append(pb.axes(xl="周波数 [MHz]", yl="大きさ（最大で割った値）", xt=[-1, -0.5, 0, 0.5, 1], yt=[0, 0.5, 1], xfmt=_f05_m, yfmt=_f05_m))
    sub = _f05_np.arange(0, J, 2)
    o.append(pb.line(list(zip(fr[sub], Ys[sub])), c=TEA, lw=0.8))
    o.append(T(pb.x + pb.w, pb.y - 4, "雑音のように平らで、信号は見えない", "end", 9.5, MUT))
    # (c) p[k]
    yc = 200
    o.append(T(14, yc, "(c) Y[m]A*[m] の逆 DFT: 2048 通りの符号の位相の相関（+1500 Hz のビン）", "start", 10.5, INK, True))
    pc = Plot(56, yc + 18, 600, 120, (0, 2048), (0, 35))
    o.append(pc.axes(xl="符号の位相 k [標本]（1 標本 = 0.4995 チップ）", yl="p", xt=[0, 256, 512, 768, 1024, 1280, 1536, 1792, 2048], yt=[0, 10, 20, 30], xfmt=_f05_m, yfmt=_f05_m))
    o.append(pc.line(list(zip(_f05_np.arange(J), p)), c=SIG, lw=0.9))
    for k in ks:
        o.append(CIRC(pc.X(k), pc.Y(abs(Rd[k]) ** 2 / nm), 2.6, c=GLD, lw=1.2))
    kpk = int(p.argmax())
    o.append(T(pc.X(kpk) + 8, pc.Y(p[kpk]) + 10, "k = %d（%.2f チップ）、p = %.1f" % (kpk, kpk * 1023.0 / J, p[kpk]), "start", 10, SIG, True, halo=True))
    ee = "%.0e" % err; mant, ex = ee.split("e")
    o.append(T(pc.x + pc.w, yc + 12, "金の○: 直列に足した値（差は山の高さの %s × 10%s 倍）" % (mant, "".join("⁰¹²³⁴⁵⁶⁷⁸⁹"[int(ch)] if ch.isdigit() else "⁻" for ch in str(int(ex)))), "end", 9.5, GLD))
    # (d) ドップラーのビンごとの最大
    yd = yc + 196
    o.append(T(14, yd, "(d) ドップラーのビンごとの最大の p", "start", 10.5, INK, True))
    P = _f05_search(y, 1, bins, 1) / nm
    mx = P.max(axis=1)
    pd = Plot(56, yd + 16, 600, 90, (-5250, 5250), (0, 35))
    o.append(pd.axes(xl="ドップラーのビン [Hz]", yl="最大の p", xt=list(range(-5000, 5001, 1000)), yt=[0, 10, 20, 30], xfmt=_f05_m, yfmt=_f05_m))
    for f, v in zip(bins, mx):
        c = SIG if f == 1500 else MUT
        o.append(RECT(pd.X(f) - 9, pd.Y(v), 18, pd.Y(0) - pd.Y(v), 2, soft(c), c, 1.0))
    o.append(W(pd.X(_F05_FD), pd.y, pd.X(_F05_FD), pd.y + pd.h, c=GLD, lw=1.2, dash="4 3"))
    o.append(T(pd.X(_F05_FD) + 6, pd.y + 10, "本当のドップラー +1630 Hz", "start", 9.5, GLD, True, halo=True))
    return SVG(700, yd + 160, o, "FFT による捕捉の途中の値（PRN 1、符号の位相 120.25 チップ、ドップラー +1630 Hz、C/N0 45 dB-Hz、1 ms に 2048 標本）。(a) 局部の搬送波を掛けた後の標本は雑音に埋もれている。(b) その DFT も平らである。(c) 局部の符号の DFT の共役を掛けて逆 DFT すると、2048 通りの位相の相関が一度に求まり、240〜241 標本に山が立つ。金の○は、同じ値を直列に足して求めたもので、FFT の結果と一致する。(d) 21 個のドップラーのビンのうち、+1500 Hz のビンの山が最も高い。")
F["e05_fftcalc"] = _f05_fftcalc_fig()


# =====================================================================
# 3 節: 判別器の S 字
# =====================================================================
def _f05_boc(x):
    a = _f05_np.abs(x)
    return _f05_np.where(a <= 0.5, 1 - 3 * a, _f05_np.where(a <= 1.0, a - 1.0, 0.0))


def _f05_disc(dt, d, kind="pow", R=None):
    """雑音の無い判別器の出力（ずれ dt [チップ]、E と L の間隔 d [チップ]）。R は相関の形（既定は三角形）。"""
    R = R or _f05_lam
    e = R(dt - d / 2); l = R(dt + d / 2)
    if kind == "pow":
        return (e ** 2 - l ** 2) / (2 * (2 - d))
    if kind == "env":
        s_ = _f05_np.abs(e) + _f05_np.abs(l)
        return _f05_np.where(s_ > 1e-12, (1 - d / 2) * (_f05_np.abs(e) - _f05_np.abs(l)) / _f05_np.where(s_ > 1e-12, s_, 1), 0.0)
    return (e - l) / 2


def _f05_scurve_fig():
    o = []
    xs = _f05_np.linspace(-2, 2, 801)
    # (a) 3 つの判別器（間隔 1 チップ）
    o.append(T(14, 18, "(a) 3 つの判別器（間隔 1 チップ）", "start", 11, INK, True))
    p = Plot(52, 40, 170, 150, (-2, 2), (-0.65, 0.65))
    o.append(RECT(p.X(-0.5), p.y, p.X(0.5) - p.X(-0.5), p.h, 0, GSOFT, "none", 0))
    o.append(p.axes(xl="ずれ Δτ [チップ]", yl="出力 D [チップ]", xt=[-2, -1, 0, 1, 2], yt=[-0.5, 0, 0.5], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(p.clip([(-0.65, -0.65), (0.65, 0.65)], c=FNT, lw=1, dash="2 3"))
    o.append(p.line(list(zip(xs, _f05_disc(xs, 1.0, "env"))), c=GRN, lw=1.8))
    o.append(p.line(list(zip(xs, _f05_disc(xs, 1.0, "coh"))), c=GLD, lw=1.8, dash="5 3"))
    o.append(p.line(list(zip(xs, _f05_disc(xs, 1.0, "pow"))), c=SIG, lw=2.2))
    o.append(LEGL(14, 238, [(SIG, None, "電力の差"), (GRN, None, "大きさの差 ÷ 和")], 9.5, 12))
    o.append(LEGL(14, 254, [(GLD, "5 3", "I だけの差"), (FNT, "2 3", "D = Δτ")], 9.5, 12))
    o.append(T(14, 272, "緑の帯: 出力がずれに等しい範囲", "start", 9.5, GRN))
    # (b) 電力の差: 間隔を変える
    xb = 250
    o.append(T(xb, 18, "(b) 電力の差: E と L の間隔を変える", "start", 11, INK, True))
    q = Plot(xb + 36, 40, 170, 150, (-2, 2), (-0.65, 0.65))
    o.append(q.axes(xl="ずれ Δτ [チップ]", xt=[-2, -1, 0, 1, 2], yt=[-0.5, 0, 0.5], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    for d, c in ((1.0, SIG), (0.5, TEA), (0.2, PUR)):
        o.append(q.line(list(zip(xs, _f05_disc(xs, d, "pow"))), c=c, lw=2))
        o.append(D(q.X(1 + d / 2), q.Y(0), c, 3.4)); o.append(D(q.X(-1 - d / 2), q.Y(0), c, 3.4))
    o.append(LEGL(xb, 238, [(SIG, None, "1 チップ"), (TEA, None, "0.5"), (PUR, None, "0.2")], 9.5, 12))
    o.append(T(xb, 256, "点: 直す向きが正しい範囲の端", "start", 9.5, MUT))
    o.append(T(xb, 271, "± (1 + 間隔/2) チップ", "start", 9.5, MUT))
    # (c) BOC(1,1)
    xc = 484
    o.append(T(xc, 18, "(c) BOC(1,1)（間隔 0.2 チップ）", "start", 11, INK, True))
    r = Plot(xc + 36, 40, 170, 150, (-1.5, 1.5), (-0.65, 0.65))
    o.append(r.axes(xl="ずれ Δτ [チップ]", xt=[-1, -0.5, 0, 0.5, 1], yt=[-0.5, 0, 0.5], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=1))
    d = 0.2
    xs2 = _f05_np.linspace(-1.5, 1.5, 1201)
    e = _f05_boc(xs2 - d / 2); l = _f05_boc(xs2 + d / 2)
    yb = (e ** 2 - l ** 2) / (6 * (2 - 3 * d))
    o.append(r.line(list(zip(xs2, _f05_disc(xs2, d, "pow") * (2 * (2 - d)) / (2 * (2 - d)))), c=FNT, lw=1.4, dash="4 3"))
    o.append(r.clip(list(zip(xs2, yb)), c=PUR, lw=2.2))
    o.append(D(r.X(0), r.Y(0), GRN, 4.4))
    for sg in (1, -1):
        o.append(D(r.X(sg * (0.5 + d / 4)), r.Y(0), ALI, 4.4))
    o.append(T(r.X(0), r.y + 12, "本当の点", "middle", 9.5, GRN, True, halo=True))
    o.append(T(r.X(0.55) + 4, r.Y(0) - 26, "偽の点", "middle", 9.5, ALI, True, halo=True))
    o.append(T(r.X(0.55) + 4, r.Y(0) - 13, "±0.55", "middle", 9.5, ALI, False, halo=True))
    o.append(LEGL(xc, 238, [(PUR, None, "BOC(1,1)"), (FNT, "4 3", "BPSK（同じ間隔）")], 9.5, 12))
    o.append(T(xc, 256, "出力が 0 で、右上がりの所に", "start", 9.5, MUT))
    o.append(T(xc, 271, "引き込まれる（赤は横の山）", "start", 9.5, MUT))
    return SVG(700, 282, o, "判別器の S 字（雑音の無い値。出力はずれ Δτ をチップで数えた値に合わせてある）。(a) 間隔 1 チップでは、3 つの判別器はどれも ±0.5 チップの中でずれに等しく、その外では形が違うが、±1.5 チップまで直す向きが正しい。(b) 間隔を狭くすると、ずれに等しい範囲が ±間隔/2 に狭くなる。(c) BOC(1,1) の信号では、±0.55 チップにも出力が 0 になって引き込まれる点ができる（横の山。間隔 0.2 チップでは 0.5 + 0.2/4 = 0.55）。")
F["e05_scurve"] = _f05_scurve_fig()


# =====================================================================
# 3 節: DLL のループと、帯域・支援で変わる応答
# =====================================================================
def _f05_dll_run(cn0, BL, d, T_, steps, e0=0.25, v_step=0.0, t_step=3.0, aided=True, seed=1, nl=1):
    """1 次の DLL（E と L の電力の差、振幅で正規化）。nl 個のループを並べて計算する。返り値 e [steps, nl]（チップ）。"""
    rng = _f05_np.random.default_rng(seed)
    c = 10 ** (cn0 / 10); sd = math.sqrt(1 / (2 * c * T_))
    kap = 4 * T_ * BL / (1 + 2 * T_ * BL)
    rho = max(0.0, 1 - d)
    e = _f05_np.full(nl, e0); out = _f05_np.empty((steps, nl))
    for k in range(steps):
        out[k] = e
        z = rng.standard_normal((4, nl))
        wEi = z[0]; wLi = rho * z[0] + math.sqrt(1 - rho * rho) * z[1]
        wEq = z[2]; wLq = rho * z[2] + math.sqrt(1 - rho * rho) * z[3]
        sE = _f05_lam(e - d / 2); sL = _f05_lam(e + d / 2)
        E2 = (sE + sd * wEi) ** 2 + (sd * wEq) ** 2
        L2 = (sL + sd * wLi) ** 2 + (sd * wLq) ** 2
        D = (E2 - L2) / (2 * (2 - d))
        v = v_step if (k * T_ >= t_step and not aided) else 0.0
        e = e - kap * D + v * T_
    return out


def _f05_dllloop_fig():
    o = []
    o.append(T(14, 18, "(a) DLL のループ（1 ms ごとに 1 回まわる）", "start", 11, INK, True))
    yc = 76
    o.append(T(14, yc - 22, "受けた符号の位相", "start", 9.5, INK))
    o.append(ARR(14, yc, 70, yc, c=GLD, lw=1.6))
    o.append(TX(20, yc + 15, "τ", "start", 11, GLD, True))
    o.append(SUMJ(85, yc, {"l": "−", "b": "+"}))
    o.append(ARR(100, yc, 136, yc, c=PUR, lw=1.6))
    o.append(TX(110, yc - 7, "Δτ", "start", 10, PUR, True))
    _f05_blk(o, 136, yc - 22, 110, 44, "判別器", "≈ Δτ/T_c + 雑音", SIG)
    o.append(ARR(246, yc, 278, yc, c=SIG, lw=1.6))
    o.append(TX(256, yc - 7, "D_k", "start", 10, SIG, True))
    _f05_blk(o, 278, yc - 22, 110, 44, "ループフィルタ", "× κ（1 次）", PUR)
    o.append(ARR(388, yc, 418, yc, c=PUR, lw=1.6))
    o.append(SUMJ(433, yc, {"l": "−", "t": "+"}))
    o.append(ARR(448, yc, 478, yc, c=MUT, lw=1.6))
    _f05_blk(o, 478, yc - 22, 104, 44, "符号の NCO", "足し込む（積分）", GLD)
    o.append(W(582, yc, 630, yc, c=GLD, lw=1.6))
    o.append(TX(596, yc - 7, "τ̂", "start", 11, GLD, True))
    o.append(D(630, yc, INK, 3.4))
    o.append(W(630, yc, 630, yc + 50, 85, yc + 50, c=GLD, lw=1.4))
    o.append(ARR(85, yc + 50, 85, yc + 16, c=GLD, lw=1.4, head=6))
    o.append(T(358, yc + 46, "局部の符号の位相（E・P・L の相関器へ）", "middle", 9.5, GLD, False, halo=True))
    o.append(ARR(433, yc - 52, 433, yc - 16, c=GRN, lw=1.6, head=6))
    o.append(T(441, yc - 46, "搬送波による支援: 搬送波のループの", "start", 9.5, GRN, True))
    o.append(TX(441, yc - 32, "ドップラーから、速さ 1.023 M × (1 + f_D/f_{L1})", "start", 9.5, GRN))
    # (b) 応答
    yb = 172
    o.append(W(10, yb - 18, 690, yb - 18, c=LIN, lw=0.8))
    o.append(T(14, yb, "(b) 局部の符号のずれ（C/N0 35 dB-Hz、間隔 1 チップ、3 s で受信機が 100 m/s に）", "start", 11, INK, True))
    T_ = 1e-3; steps = 8000
    p = Plot(60, yb + 18, 600, 180, (0, 8), (-0.15, 0.35))
    o.append(p.axes(xl="時間 t [s]", yl="ずれ [チップ]", xt=[0, 1, 2, 3, 4, 5, 6, 7, 8], yt=[-0.1, 0, 0.1, 0.2, 0.3], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(W(p.X(3), p.y, p.X(3), p.y + p.h, c=FNT, lw=1, dash="4 3"))
    o.append(T(p.X(3) + 4, p.y + 12, "受信機が動き始める", "start", 9.5, MUT, False, halo=True))
    tt = _f05_np.arange(steps) * T_
    cases = [(5.0, True, TEA, "5 Hz・支援あり"), (0.5, True, SIG, "0.5 Hz・支援あり"), (0.5, False, ALI, "0.5 Hz・支援なし")]
    for i, (BL, aid, c, lab) in enumerate(cases):
        e = _f05_dll_run(35.0, BL, 1.0, T_, steps, e0=0.25, v_step=100.0 / _F05_CTC, aided=aid, seed=20 + i)[:, 0]
        sub = _f05_np.arange(0, steps, 4)
        o.append(p.clip(list(zip(tt[sub], e[sub])), c=c, lw=1.2 if BL > 1 else 1.7))
    lag = (100.0 / _F05_CTC) * T_ / (4 * T_ * 0.5 / (1 + 2 * T_ * 0.5))
    o.append(W(p.X(5), p.Y(lag), p.X(8), p.Y(lag), c=ALI, lw=1, dash="2 2"))
    o.append(T(p.X(7.95), p.Y(lag) - 6, "式の遅れ %.2f チップ（%.0f m）" % (lag, lag * _F05_CTC), "end", 9.5, ALI, True, halo=True))
    o.append(LEGL(60, p.y + p.h + 48, [(TEA, None, cases[0][3]), (SIG, None, cases[1][3]), (ALI, None, cases[2][3])], 9.5, 16))
    return SVG(700, p.y + p.h + 58, o, "DLL のループ。(a) 判別器でずれを測り、ループフィルタで κ 倍して、符号の NCO の位相を直す。NCO は直す量を足し込むので、ループの中の積分である。搬送波による支援があると、NCO の速さは搬送波のループのドップラーから決まり、DLL は残りのずれだけを直す。(b) 1 ms ごとに計算したずれ。帯域の広い DLL は初めのずれを速く直すが揺れが大きく、狭い DLL は揺れが小さい。支援が無いと、受信機が動き始めた後、狭い DLL は一定のずれを残して遅れる。")
F["e05_dllloop"] = _f05_dllloop_fig()


# =====================================================================
# 3 節: 距離の雑音（式とシミュレーション）
# =====================================================================
def _f05_dll_sigma(cn0, BL, d, T_, coh=False):
    c = 10 ** (cn0 / 10)
    v = BL * d / (2 * c)
    return math.sqrt(v if coh else v * (1 + 2 / ((2 - d) * T_ * c)))


def _f05_dll_sim_sigma(cn0, BL, d, T_, coh=False, seed=3, nl=48, steps=5000):
    rng = _f05_np.random.default_rng(seed)
    c = 10 ** (cn0 / 10); sd = math.sqrt(1 / (2 * c * T_)); kap = 4 * T_ * BL / (1 + 2 * T_ * BL); rho = max(0.0, 1 - d)
    e = _f05_np.zeros(nl); acc = []
    for k in range(steps):
        z = rng.standard_normal((4, nl))
        wEi = z[0]; wLi = rho * z[0] + math.sqrt(1 - rho * rho) * z[1]
        sE = _f05_lam(e - d / 2); sL = _f05_lam(e + d / 2)
        if coh:
            Dk = ((sE + sd * wEi) - (sL + sd * wLi)) / 2
        else:
            wEq = z[2]; wLq = rho * z[2] + math.sqrt(1 - rho * rho) * z[3]
            Dk = (((sE + sd * wEi) ** 2 + (sd * wEq) ** 2) - ((sL + sd * wLi) ** 2 + (sd * wLq) ** 2)) / (2 * (2 - d))
        e = e - kap * Dk
        if k >= 1000:
            acc.append(e.copy())
    return float(_f05_np.std(_f05_np.array(acc)))


def _f05_dllnoise_fig():
    o = []
    o.append(T(14, 18, "擬似距離の雑音（1 次の DLL、ループの帯域 1 Hz、支援あり）", "start", 11, INK, True))
    p = Plot(64, 36, 420, 250, (15, 50), (0.1, 300), ylog=True)
    o.append(p.axes(xl="C/N0 [dB-Hz]", yl="雑音の標準偏差 σ_ρ [m]", xt=[15, 20, 25, 30, 35, 40, 45, 50], yt=[0.1, 1, 10, 100], xfmt=_f05_m, yfmt=lambda v: _f05_m(v)))
    cs = _f05_np.linspace(15, 50, 141)
    curves = [(1.0, 1.0, 1e-3, False, SIG, None, "間隔 1・1 ms・電力の差"),
              (1.0, 1.0, 1e-3, True, SIG, "5 3", "間隔 1・位相が合っている"),
              (0.2, 1.0, 1e-3, False, GRN, None, "間隔 0.2・1 ms・電力の差"),
              (1.0, 1.0, 20e-3, False, PUR, None, "間隔 1・20 ms・電力の差")]
    for d, BL, T_, coh, c, dash, lab in curves:
        o.append(p.clip([(x, _F05_CTC * _f05_dll_sigma(x, BL, d, T_, coh)) for x in cs], c=c, lw=2, dash=dash))
    # 3 章 6 節の式（1 s の平均 = 帯域 0.5 Hz・間隔 1・位相が合っている）
    o.append(p.clip([(x, _F05_CTC / (2 * math.sqrt(10 ** (x / 10) * 1.0))) for x in cs], c=MUT, lw=1.4, dash="2 3"))
    # シミュレーションの点
    for (d, BL, T_, coh, c, dash, lab), sd in zip(curves[:3], (31, 32, 33)):
        for x in (25, 30, 35, 40, 45):
            sg = _f05_dll_sim_sigma(x, BL, d, T_, coh, seed=sd + x)
            o.append(CIRC(p.X(x), p.Y(_F05_CTC * sg), 3.6, c=c, lw=1.4, fill=SCR))
    # 目安（3σ = 間隔/2）
    for d, T_, c in ((1.0, 1e-3, SIG), (0.2, 1e-3, GRN), (1.0, 20e-3, PUR)):
        lim = _F05_CTC * d / 6
        th = _f05_opt.brentq(lambda x: _f05_dll_sigma(x, 1.0, d, T_) * _F05_CTC - lim, 5, 60)
        o.append(D(p.X(th), p.Y(lim), c, 4.2))
        o.append(T(p.X(th) + 6, p.Y(lim) - 6, "%.1f" % th, "start", 9.5, c, True, halo=True))
    o.append(W(p.x, p.Y(_F05_CTC / 6), p.x + p.w, p.Y(_F05_CTC / 6), c=FNT, lw=1, dash="4 3"))
    o.append(T(p.x + p.w - 4, p.Y(_F05_CTC / 6) - 5, "3σ = 0.5 チップ（間隔 1 の目安）", "end", 9.5, MUT, False, halo=True))
    o.append(W(p.x, p.Y(_F05_CTC * 0.2 / 6), p.x + p.w, p.Y(_F05_CTC * 0.2 / 6), c=FNT, lw=1, dash="4 3"))
    o.append(T(p.x + p.w - 4, p.Y(_F05_CTC * 0.2 / 6) - 5, "3σ = 0.1 チップ（間隔 0.2）", "end", 9.5, MUT, False, halo=True))
    # 凡例
    xl = 510
    yy = 52
    for d, BL, T_, coh, c, dash, lab in curves:
        o.append(W(xl, yy - 4, xl + 22, yy - 4, c=c, lw=2.2, dash=dash))
        o.append(T(xl + 28, yy, lab, "start", 9.5, MUT))
        yy += 18
    o.append(W(xl, yy - 4, xl + 22, yy - 4, c=MUT, lw=1.4, dash="2 3"))
    o.append(T(xl + 28, yy, "3 章 6 節の式（1 s の平均）", "start", 9.5, MUT))
    yy += 26
    o.append(T(xl, yy, "○: シミュレーション", "start", 9.5, INK, True))
    o.append(T(xl, yy + 15, "（48 本のループ × 4 s）", "start", 9.5, MUT))
    o.append(T(xl, yy + 38, "●: 追尾の目安に届く所", "start", 9.5, INK, True))
    o.append(T(xl, yy + 53, "（数字は C/N0 [dB-Hz]）", "start", 9.5, MUT))
    return SVG(700, 330, o, "1 次の DLL（ループの帯域 1 Hz、搬送波による支援あり）の擬似距離の雑音。実線は E と L の電力の差の判別器の式、破線は位相が合っている（I だけの差）ときの式、○は 1 ms ごとのシミュレーション。E・L の間隔を狭くすると雑音が減る。C/N0 が低いと、電力の差では雑音どうしの積の分だけ雑音が増えるが、積分の時間を 20 ms にすると、その分が小さくなる。3 章 6 節の式（点線）は、間隔 1 チップ・帯域 0.5 Hz・位相が合っているときの式にあたる。")
F["e05_dllnoise"] = _f05_dllnoise_fig()
