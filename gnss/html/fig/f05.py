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
    s90s = [10 * math.log10(_f05_opt.brentq(lambda x: _f05_pmax(x, 1022) - 0.9, 2, 100)),
            10 * math.log10(_f05_opt.brentq(lambda x: float(_f05_pd(x, thr)) - 0.9, 2, 100)),
            10 * math.log10(_f05_opt.brentq(lambda x: _f05_pd_str(x, thr) - 0.9, 2, 100))]
    for s90, c in zip(s90s, (MUT, SIG, ALI)):
        o.append(D(r.X(s90), r.Y(0.9), c, 3.6))
    o.append(LEGL(xc - 6, 216, [(MUT, "5 3", "3 章 6 節の基準（%.1f dB）" % s90s[0])], 9.5, 12))
    o.append(LEGL(xc - 6, 232, [(SIG, None, "しきい値・42 966 ビン（%.1f dB）" % s90s[1])], 9.5, 12))
    o.append(LEGL(xc - 6, 248, [(ALI, None, "さらに刻みの損失（%.1f dB）" % s90s[2])], 9.5, 12))
    o.append(T(14, 282, "(c) のしきい値は、格子全体で誤って超える確率を 1 % にした値（雑音の平均の 11.8 dB 上）。", "start", 9.5, MUT))
    o.append(T(14, 297, "3 章 6 節の基準は、1023 通りの中の最大が本当のずれに来る割合（しきい値なし）。", "start", 9.5, MUT))
    return SVG(700, 306, o, "ビンの刻みと、見つけるのに要る SN 比。(a) ドップラーの向きの電力は sinc² の形で、500 Hz（1/(2T<sub>coh</sub>)）の刻みなら、真ん中でも 0.81 倍で済むが、1 kHz の刻みでは 0.41 倍に落ちる。(b) 符号の位相の向きは三角形の 2 乗で、1/2 チップの刻みの真ん中では 0.56 倍になる。(c) 検出確率（見つかる割合）と SNR。3 章 6 節の基準より、ビンの数としきい値の分と、刻みの損失の分だけ、多くの SN 比が要る（点が 90 %）。")
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
    o.append(T(r.X(0), r.Y(0) + 22, "本当の点", "middle", 9.5, GRN, True, halo=True))
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


# =====================================================================
# 4 節: コスタスの判別器
# =====================================================================
def _f05_costas_fig():
    o = []
    rng = _f05_np.random.default_rng(8)
    psi = math.radians(25.0)
    c = 10 ** 4.5; sd = math.sqrt(1 / (2 * c * 1e-3))
    bits = _f05_np.where(rng.random(8) < 0.5, 1, -1); bits[0] = 1; bits[1] = -1
    o.append(T(14, 18, "(a) P の I・Q（位相のずれ 25°、45 dB-Hz、1 ms ごと）", "start", 11, INK, True))
    p = Plot(70, 40, 200, 200, (-1.4, 1.4), (-1.4, 1.4))
    o.append(p.axes(xl="I（√(2C) で割った値）", yl="Q", xt=[-1, 0, 1], yt=[-1, 0, 1], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1)); o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    cir = [(math.cos(a), math.sin(a)) for a in _f05_np.linspace(0, 2 * math.pi, 121)]
    o.append(p.line(cir, c=FNT, lw=1, dash="4 3"))
    ang = -psi
    o.append(p.line([(-1.4 * math.cos(ang), -1.4 * math.sin(ang)), (1.4 * math.cos(ang), 1.4 * math.sin(ang))], c=GLD, lw=1.2, dash="5 3"))
    for k in range(160):
        d = bits[k // 20]
        I = d * math.cos(psi) + sd * rng.standard_normal(); Q = -d * math.sin(psi) + sd * rng.standard_normal()
        o.append(D(p.X(I), p.Y(Q), SIG if d > 0 else PUR, 2.2))
    arc = [(0.55 * math.cos(a), 0.55 * math.sin(a)) for a in _f05_np.linspace(0, -psi, 20)]
    o.append(p.line(arc, c=GLD, lw=1.4))
    o.append(T(p.X(0.62), p.Y(-0.18), "25°", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.92), p.Y(-0.75), "d = +1", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-0.92), p.Y(0.75), "d = −1", "middle", 9.5, PUR, True, halo=True))
    o.append(TX(14, 300, "データが変わると点は反対側へ移るが、−Q_P/I_P は同じなので", "start", 9.5, INK))
    o.append(TX(14, 315, "D_{PLL} = arctan(−Q_P/I_P) = 25° はビットによらない", "start", 9.5, INK, True))
    # (b) S 字
    xb = 330
    o.append(T(xb, 18, "(b) 位相の判別器の出力", "start", 11, INK, True))
    q = Plot(xb + 44, 40, 300, 200, (-180, 180), (-200, 200))
    o.append(q.axes(xl="位相のずれ [°]", yl="出力 [°]", xt=[-180, -90, 0, 90, 180], yt=[-180, -90, 0, 90, 180], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    xs = _f05_np.linspace(-180, 180, 721)
    four = [(x, x) for x in xs]
    o.append(q.line(four, c=FNT, lw=1.6, dash="5 3"))
    cost = _f05_np.degrees(_f05_np.arctan(_f05_np.tan(_f05_np.radians(xs))))
    segs = []; cur = []
    for x, v in zip(xs, cost):
        if cur and abs(v - cur[-1][1]) > 90:
            segs.append(cur); cur = []
        cur.append((x, v))
    segs.append(cur)
    for sg in segs:
        o.append(q.line(sg, c=SIG, lw=2.2))
    o.append(q.line([(x, math.degrees(math.sin(2 * math.radians(x)) / 2)) for x in xs], c=GRN, lw=1.8))
    for x0 in (-180, 0, 180):
        o.append(D(q.X(x0), q.Y(0), SIG, 4.2))
    o.append(T(q.X(-178), q.Y(160), "4 象限 arctan2", "start", 9.5, MUT, True, halo=True))
    o.append(T(q.X(-178), q.Y(130), "（データが無いときだけ）", "start", 9.5, MUT, False, halo=True))
    o.append(LEGL(xb, 300, [(SIG, None, "コスタス arctan(−Q/I)"), (GRN, None, "−QI（小さい間）")], 9.5, 14))
    o.append(T(xb, 318, "●: ロックする点（0° と ±180°）。180° でロックすると、", "start", 9.5, MUT))
    o.append(T(xb, 333, "ビットが反転して読める（プリアンブルで気づく）", "start", 9.5, MUT))
    return SVG(700, 344, o, "コスタスループの判別器。(a) データのビットが −1 になると、P の点は原点の反対側へ移るが、−Q/I の比は変わらないので、arctan(−Q/I) は位相のずれ 25° を出し続ける。(b) コスタスの判別器は 180° ごとに同じ値をくり返し、0° と ±180° の両方でロックする。−QI は、ずれが小さい間は位相のずれに比例する（傾きは信号の電力で変わる）。4 象限の arctan2 は ±180° まで測れるが、データがあると、ビットが変わるたびに 180° 跳ぶ。")
F["e05_costas"] = _f05_costas_fig()


# =====================================================================
# 4 節: FLL で引き込んでから PLL（1 ms ごとのシミュレーション）
# =====================================================================
def _f05_pll_sim(cn0, Bn, T_, tend, order=2, acc=0.0, jerk=0.0, df0=0.0, dpsi0=0.0, data=True, fll_time=0.0, Bf=10.0, seed=5, lin=False, kind="costas"):
    rng = _f05_np.random.default_rng(seed)
    n = int(round(tend / T_)); c = 10 ** (cn0 / 10); sd = math.sqrt(1 / (2 * c * T_)) if cn0 < 200 else 0.0
    w0 = Bn / 0.53 if order == 2 else (Bn / 0.7845 if order == 3 else 4 * Bn)
    psh = 0.0; wh = 0.0; x1 = None; x2 = 0.0; prev = None
    bits = _f05_np.where(rng.random(int(tend / 0.02) + 3) < 0.5, 1, -1)
    E = _f05_np.zeros(n); F = _f05_np.zeros(n); IQ = _f05_np.zeros((n, 2))
    for k in range(n):
        t0 = k * T_; tm = t0 + T_ / 2
        psi = dpsi0 + 2 * math.pi * (df0 * tm + 0.5 * acc / _F05_LAM * tm * tm + jerk / _F05_LAM * tm ** 3 / 6)
        fd = df0 + acc / _F05_LAM * tm + 0.5 * jerk / _F05_LAM * tm * tm
        dpb = psi - (psh + wh * T_ / 2); dfr = fd - wh / (2 * math.pi)
        amp = float(_f05_np.sinc(dfr * T_)); d = bits[int(t0 / 0.02)] if data else 1
        I = d * amp * math.cos(dpb) + sd * rng.standard_normal(); Q = -d * amp * math.sin(dpb) + sd * rng.standard_normal()
        IQ[k] = (I, Q); E[k] = dpb; F[k] = dfr
        if t0 < fll_time:
            if prev is not None:
                num = I * prev[1] - prev[0] * Q; den = prev[0] * I + prev[1] * Q
                fe = math.atan(num / den) / (2 * math.pi * T_) if den != 0 else 0.0
                kf = 4 * T_ * Bf / (1 + 2 * T_ * Bf); wh += 2 * math.pi * kf * fe
            prev = (I, Q)
        else:
            if x1 is None:
                x1 = wh
            if lin:
                e = dpb
            elif kind == "costas":
                e = math.atan(-Q / I) if I != 0 else 0.0
            else:
                e = math.atan2(-Q, I)
            if order == 1:
                wh = x1 + w0 * e
            elif order == 2:
                x1 += w0 * w0 * T_ * e; wh = x1 + 1.414 * w0 * e
            else:
                x2 += w0 ** 3 * T_ * e; x1 += (x2 + 1.1 * w0 * w0 * e) * T_; wh = x1 + 2.4 * w0 * e
        psh += wh * T_
    return E, F, IQ


def _f05_wrapc(x):
    return (x + math.pi / 2) % math.pi - math.pi / 2


def _f05_pullin_fig():
    o = []
    T_ = 1e-3
    E, F, IQ = _f05_pll_sim(45.0, 15.0, T_, 0.6, df0=200.0, dpsi0=1.0, fll_time=0.2, Bf=10.0, seed=5)
    tt = _f05_np.arange(len(E)) * T_
    # (a) FLL の判別器
    o.append(T(14, 18, "(a) FLL の判別器（1 ms）", "start", 11, INK, True))
    p = Plot(60, 40, 250, 150, (-750, 750), (-300, 300))
    o.append(RECT(p.X(-250), p.y, p.X(250) - p.X(-250), p.h, 0, GSOFT, "none", 0))
    o.append(p.axes(xl="周波数のずれ Δf [Hz]", yl="出力 [Hz]", xt=[-750, -500, -250, 0, 250, 500, 750], yt=[-250, 0, 250], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    xs = _f05_np.linspace(-750, 750, 1501)
    ys = _f05_np.degrees(_f05_np.arctan(_f05_np.tan(2 * math.pi * xs * T_))) / 360 / T_
    segs = []; cur = []
    for x, v in zip(xs, ys):
        if cur and abs(v - cur[-1][1]) > 200:
            segs.append(cur); cur = []
        cur.append((x, v))
    segs.append(cur)
    for sg in segs:
        o.append(p.line(sg, c=SIG, lw=2))
    o.append(T(p.X(0), p.y + 12, "±250 Hz で正しい", "middle", 9.5, GRN, True, halo=True))
    # (d) I・Q
    xq = 380
    o.append(T(xq, 18, "(d) P の I・Q の点", "start", 11, INK, True))
    q = Plot(xq + 50, 40, 150, 150, (-1.3, 1.3), (-1.3, 1.3))
    o.append(q.axes(xl="I", yl="Q", xt=[-1, 0, 1], yt=[-1, 0, 1], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(q.X(0), q.y, q.X(0), q.y + q.h, c=MUT, lw=1)); o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    for k in range(0, 200, 2):
        o.append(D(q.X(max(-1.3, min(1.3, IQ[k, 0]))), q.Y(max(-1.3, min(1.3, IQ[k, 1]))), FNT, 1.8))
    for k in range(350, 600, 2):
        o.append(D(q.X(max(-1.3, min(1.3, IQ[k, 0]))), q.Y(max(-1.3, min(1.3, IQ[k, 1]))), SIG, 2.2))
    o.append(T(q.x + q.w + 10, q.y + 30, "灰: FLL の間", "start", 9.5, MUT, True))
    o.append(T(q.x + q.w + 10, q.y + 45, "（回り続ける）", "start", 9.5, MUT))
    o.append(T(q.x + q.w + 10, q.y + 75, "青: PLL で", "start", 9.5, SIG, True))
    o.append(T(q.x + q.w + 10, q.y + 90, "ロックした後", "start", 9.5, SIG, True))
    o.append(T(q.x + q.w + 10, q.y + 105, "（I の軸の ±1）", "start", 9.5, SIG))
    # (b) 周波数のずれ
    yb = 236
    o.append(T(14, yb, "(b) 周波数のずれ（初め 200 Hz、帯域 10 Hz の FLL）", "start", 11, INK, True))
    r = Plot(60, yb + 16, 600, 110, (0, 0.6), (-30, 220))
    o.append(RECT(r.X(0), r.y, r.X(0.2) - r.X(0), r.h, 0, MSOFT, "none", 0))
    o.append(r.axes(yl="Δf [Hz]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 100, 200], xfmt=lambda v: "", yfmt=_f05_m))
    o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=MUT, lw=1))
    o.append(r.line(list(zip(tt, F)), c=SIG, lw=1.8))
    o.append(T(r.X(0.1), r.y + 14, "FLL", "middle", 10, MUT, True))
    o.append(T(r.X(0.4), r.y + 14, "PLL（帯域 15 Hz、2 次）", "middle", 10, SIG, True))
    f2 = float(_f05_np.abs(F[195:200]).mean())
    o.append(T(r.X(0.21), r.Y(60), "0.2 s で %.1f Hz" % f2, "start", 9.5, SIG, True, halo=True))
    # (c) 位相のずれ
    yc = yb + 160
    o.append(T(14, yc, "(c) 位相のずれ（180° ごとに同じとして、±90° に折り返した値）", "start", 11, INK, True))
    s_ = Plot(60, yc + 16, 600, 110, (0, 0.6), (-90, 90))
    o.append(RECT(s_.X(0), s_.y, s_.X(0.2) - s_.X(0), s_.h, 0, MSOFT, "none", 0))
    o.append(s_.axes(xl="時間 t [s]", yl="ずれ [°]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[-90, -45, 0, 45, 90], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(s_.x, s_.Y(0), s_.x + s_.w, s_.Y(0), c=MUT, lw=1))
    ew = [math.degrees(_f05_wrapc(e)) for e in E]
    pts = list(zip(tt, ew)); segs = []; cur = []
    for x, v in pts:
        if cur and abs(v - cur[-1][1]) > 90:
            segs.append(cur); cur = []
        cur.append((x, v))
    segs.append(cur)
    for sg in segs:
        o.append(s_.line(sg, c=PUR, lw=1.2))
    E2, _, _ = _f05_pll_sim(45.0, 15.0, T_, 1.6, df0=200.0, dpsi0=1.0, fll_time=0.2, Bf=10.0, seed=5)
    sdv = float(_f05_np.std([math.degrees(_f05_wrapc(e)) for e in E2[600:]]))
    o.append(T(s_.X(0.36), s_.Y(60), "落ち着いた後（0.6〜1.6 s）の揺れ σ = %.2f°（式 1.26°）" % sdv, "start", 9.5, PUR, True, halo=True))
    return SVG(700, yc + 176, o, "捕捉の後、FLL で周波数を引き込んでから PLL で位相を合わせる様子（C/N0 45 dB-Hz、1 ms ごとの計算）。(a) FLL の判別器は、2 回の P の点の角度の差から周波数のずれを測り、1 ms の積分なら ±250 Hz の中で正しい（データが変わっても同じ）。(b) 初めの 200 Hz のずれを、FLL が 0.2 s で 1 Hz より小さくする。(c) PLL に切り替えると、0.1〜0.2 s で位相のずれが数度に収まる。(d) FLL の間は点が回り続け、ロックした後は I の軸の上の 2 か所（ビット ±1）に集まる。")
F["e05_pullin"] = _f05_pullin_fig()


# =====================================================================
# 4 節: ループの次数と帯域
# =====================================================================
def _f05_loops_fig():
    o = []
    T_ = 1e-3; tend = 0.6
    tt = _f05_np.arange(int(tend / T_)) * T_
    cols = {1: TEA, 2: SIG, 3: PUR}
    tests = [("(a) 位相が 30° 跳ぶ", dict(dpsi0=math.radians(30.0)), (-12, 36), [0, 15, 30]),
             ("(b) 周波数が 10 Hz 跳ぶ", dict(df0=10.0), (-50, 70), [-30, 0, 30, 60]),
             ("(c) 加速度 1 g（51.6 Hz/s）", dict(acc=9.81), (-15, 60), [0, 23.2, 50])]
    for i, (ttl, kw, yr, yt) in enumerate(tests):
        x0 = 14 + i * 228
        o.append(T(x0, 18, ttl, "start", 11, INK, True))
        p = Plot(x0 + 44, 36, 166, 120, (0, tend), yr)
        o.append(p.axes(xl="時間 t [s]", yl="位相のずれ [°]" if i == 0 else None, xt=[0, 0.2, 0.4, 0.6], yt=yt, xfmt=_f05_m, yfmt=lambda v: _f05_m(round(v, 1))))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        for order in (1, 2, 3):
            E, _, _ = _f05_pll_sim(999.0, 15.0, T_, tend, order=order, data=False, lin=True, **kw)
            o.append(p.clip(list(zip(tt, _f05_np.degrees(E))), c=cols[order], lw=1.8))
    o.append(LEGL(58, 214, [(TEA, None, "1 次"), (SIG, None, "2 次"), (PUR, None, "3 次（どれも帯域 15 Hz）")], 9.5, 16))
    o.append(T(390, 208, "残るずれ: 1 次は (b) で 60°、2 次は (c) で 23.2°", "start", 9.5, MUT))
    o.append(T(390, 223, "3 次は行き過ぎが大きいが、(c) でも 0 に戻る", "start", 9.5, MUT))
    # (d) 帯域の釣り合い
    yd = 244
    o.append(W(10, yd - 14, 690, yd - 14, c=LIN, lw=0.8))
    o.append(T(14, yd + 4, "(d) 2 次の PLL の帯域の選び方（加速度 1 g、1 ms）", "start", 11, INK, True))
    q = Plot(60, yd + 24, 330, 170, (2, 60), (0, 90), xlog=True)
    o.append(q.axes(xl="ループの帯域 B_L [Hz]", yl="3σ + 動きのずれ [°]", xt=[2, 5, 10, 20, 50], yt=[0, 15, 30, 45, 60, 75, 90], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(q.x, q.Y(45), q.x + q.w, q.Y(45), c=ALI, lw=1.2, dash="5 3"))
    o.append(T(q.x + 4, q.Y(45) - 5, "目安 45°", "start", 9.5, ALI, True, halo=True))
    bl = _f05_np.logspace(math.log10(2), math.log10(60), 140)
    dyn = [math.degrees(2 * math.pi * 9.81 / _F05_LAM / (b / 0.53) ** 2) for b in bl]
    o.append(q.clip(list(zip(bl, dyn)), c=MUT, lw=1.4, dash="4 3"))
    best = []
    for cn, c in ((27, TEA), (30, SIG), (45, PUR)):
        cc = 10 ** (cn / 10)
        tot = [3 * math.degrees(math.sqrt(b / cc * (1 + 1 / (2 * T_ * cc)))) + dv for b, dv in zip(bl, dyn)]
        o.append(q.clip(list(zip(bl, tot)), c=c, lw=2))
        j = int(_f05_np.argmin(tot)); best.append((cn, bl[j], tot[j]))
        o.append(D(q.X(bl[j]), q.Y(tot[j]), c, 3.8))
    xt_ = 420
    o.append(T(xt_, yd + 40, "破線: 動きによるずれ（帯域を広くすると減る）", "start", 9.5, MUT))
    o.append(T(xt_, yd + 56, "実線: 雑音の 3σ を足した値（帯域を広くすると増える）", "start", 9.5, MUT))
    yy = yd + 82
    for (cn, b, v), c in zip(best, (TEA, SIG, PUR)):
        o.append(T(xt_, yy, "%d dB-Hz: 最も小さいのは %.0f Hz で %.0f°" % (cn, b, v), "start", 9.5, c, True))
        yy += 16
    o.append(T(xt_, yy + 10, "27 dB-Hz では、どの帯域でも 45° を超える", "start", 9.5, ALI, True))
    o.append(T(xt_, yy + 26, "（3 次にして動きのずれを消すか、積分の時間を延ばす）", "start", 9.5, MUT))
    return SVG(700, yd + 236, o, "ループの次数と帯域（1 ms ごとの計算、雑音なし。判別器は直線とした。3 次の係数は代表的な 1.1 と 2.4）。(a) 位相の跳びには、どの次数もずれを 0 に戻す。(b) 周波数の跳び（位相が一定の速さで進む）には、1 次のループは一定のずれを残す。3 次はこの係数では行き過ぎが大きく、落ち着くのに時間がかかる。(c) 加速度（周波数が一定の速さで変わる）には、2 次のループが 23.2° のずれを残し、3 次は 0 に戻す。(d) 帯域を広くすると動きによるずれは減るが、雑音の揺れは増える。2 つの和が最も小さい帯域があり、C/N0 が低いと、その値でも目安の 45° を超える。")
F["e05_loops"] = _f05_loops_fig()


# =====================================================================
# 5 節: ビット同期（1 ms ごとの I の符号の変わり目を数える）
# =====================================================================
def _f05_bitsync_fig():
    o = []
    off = 7
    def run(cn0, ms, seed):
        rng = _f05_np.random.default_rng(seed)
        c = 10 ** (cn0 / 10); sd = math.sqrt(1 / (2 * c * 1e-3))
        nb = ms // 20 + 3
        bits = _f05_np.where(rng.random(nb) < 0.5, 1, -1)
        t = _f05_np.arange(ms)
        truth = bits[(t - off) // 20 + 1]
        I = truth + sd * rng.standard_normal(ms)
        ch = _f05_np.sign(I[1:]) != _f05_np.sign(I[:-1])
        pos = t[1:] % 20
        return I, truth, _f05_np.bincount(pos[ch], minlength=20)
    I, truth, _ = run(30.0, 200, 4)
    o.append(T(14, 18, "(a) 1 ms ごとの P の I（30 dB-Hz。金の線はデータのビット）", "start", 11, INK, True))
    p = Plot(56, 36, 610, 110, (0, 200), (-2.6, 2.6))
    for k in range(0, 200, 20):
        o.append(RECT(p.X(k + off), p.y, 1.2, p.h, 0, FNT, "none", 0))
    o.append(p.axes(xl="時間 [ms]", yl="I", xt=list(range(0, 201, 20)), yt=[-2, -1, 0, 1, 2], xfmt=_f05_m, yfmt=_f05_m))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(p.steps([(k, truth[k]) for k in range(200)] + [(200, truth[199])], c=GLD, lw=1.8))
    for k in range(200):
        c = ALI if (k > 0 and _f05_np.sign(I[k]) != _f05_np.sign(I[k - 1]) and (k % 20) != off) else SIG
        o.append(D(p.X(k + 0.5), p.Y(max(-2.6, min(2.6, I[k]))), c, 1.9))
    o.append(T(p.x + p.w, p.y - 4, "細い縦線: ビットの境目（20 ms の中の 7 ms 目）。赤: 雑音で符号が変わった所", "end", 9.5, MUT))
    # (b) 20 ms の中の位置ごとの回数（1 s）
    yb = 210
    o.append(T(14, yb, "(b) 符号が変わった回数を、20 ms の中の位置ごとに数える（1 s = 50 bit の後）", "start", 11, INK, True))
    for i, (cn, sd_) in enumerate(((45.0, 41), (30.0, 42), (25.0, 43))):
        _, _, h = run(cn, 1000, sd_)
        x0 = 56 + i * 216
        q = Plot(x0, yb + 32, 180, 100, (-0.5, 19.5), (0, 35))
        o.append(q.axes(xl="20 ms の中の位置 [ms]", yl="回数" if i == 0 else None, xt=[0, 5, 10, 15], yt=[0, 10, 20, 30], xfmt=_f05_m, yfmt=_f05_m))
        for k in range(20):
            c = SIG if k == off else MUT
            o.append(RECT(q.X(k) - 3.6, q.Y(h[k]), 7.2, q.Y(0) - q.Y(h[k]), 1, soft(c), c, 1.0))
        o.append(T(x0 + 90, yb + 26, "%d dB-Hz" % cn, "middle", 10, INK, True))
        o.append(T(q.X(off) + 8, q.Y(h[off]) + 4, "%d" % h[off], "start", 9.5, SIG, True, halo=True))
    return SVG(700, yb + 180, o, "ビット同期。(a) 位相が合った P の I は、データのビットに雑音が加わった値で、符号が変わるのは、主に値の違うビットへ移る境目である（同じ値のビットが続けば変わらない）。(b) 1 s のあいだに符号が変わった回数を 20 ms の中の位置ごとに数えると、境目の位置（7 ms 目）だけが 25 回ほどになる。C/N0 が低いと、雑音で変わる回数がほかの位置にも増え、見分けるのに長くかかる。")
F["e05_bitsync"] = _f05_bitsync_fig()


# =====================================================================
# 5 節: エフェメリスを受けるまでの時間（18〜36 s）
# =====================================================================
def _f05_teph(t0):
    ends = []
    for i in (1, 2, 3):
        st = 6.0 * (i - 1)
        while st < t0 - 1e-9:
            st += 30.0
        ends.append(st + 6.0)
    return max(ends) - t0


def _f05_ephwait_fig():
    o = []
    o.append(T(14, 18, "(a) サブフレームの並びと、読み始める時刻の例", "start", 11, INK, True))
    x0, w = 40, 620
    X = lambda t: x0 + t / 60.0 * w
    yf = 48
    for k in range(10):
        i = k % 5 + 1
        c = SIG if i <= 3 else MUT
        o.append(RECT(X(6 * k), yf, X(6) - X(0) - 1, 22, 2, soft(c), c, 1.0))
        o.append(T(X(6 * k + 3), yf + 15, "%d" % i, "middle", 10, c, True))
    for v in range(0, 61, 6):
        o.append(T(X(v), yf + 36, "%d" % v, "middle", 9.5, MUT))
    o.append(T(X(30), yf + 52, "フレームの頭からの時刻 [s]（青: サブフレーム 1〜3。時計の補正の値とエフェメリス）", "middle", 9.5, MUT))
    exs = [(3.0, GLD), (20.0, PUR)]
    for j, (t0, c) in enumerate(exs):
        y = yf + 76 + j * 46
        te = _f05_teph(t0)
        o.append(D(X(t0), y, c, 4.4))
        o.append(W(X(t0), y, X(t0 + te), y, c=c, lw=1.6))
        o.append(W(X(t0 + te), y - 6, X(t0 + te), y + 6, c=c, lw=1.6))
        for i in (1, 2, 3):
            st = 6.0 * (i - 1)
            while st < t0 - 1e-9:
                st += 30.0
            o.append(RECT(X(st), y + 6, X(st + 6) - X(st) - 1, 12, 2, soft(GRN), GRN, 1.0))
            o.append(T(X(st + 3), y + 16, "%d" % i, "middle", 9, GRN, True))
        o.append(T(X(t0) - 6, y + 4, "t₀ = %g s" % t0, "end", 9.5, c, True))
        o.append(T(X(t0 + te) + 8, y + 4, "%g s 待つ" % te, "start", 9.5, c, True))
    # (b) 待つ時間と t0
    yb = 236
    o.append(W(10, yb - 16, 690, yb - 16, c=LIN, lw=0.8))
    o.append(T(14, yb + 2, "(b) 読み始める時刻 t₀ と、待つ時間", "start", 11, INK, True))
    p = Plot(70, yb + 22, 430, 150, (0, 30), (10, 40))
    o.append(p.axes(xl="読み始める時刻 t₀ [s]（フレームの頭から）", yl="待つ時間 [s]", xt=[0, 6, 12, 18, 24, 30], yt=[10, 18, 29.4, 36, 40], xfmt=_f05_m, yfmt=lambda v: _f05_m(v)))
    for a, b in ((0.0001, 6), (6.0001, 12), (12.0001, 18), (18.0, 30)):
        ts = _f05_np.linspace(a, b, 60)
        o.append(p.line([(t, _f05_teph(t)) for t in ts], c=SIG, lw=2.2))
    o.append(D(p.X(0), p.Y(18), SIG, 3.6))
    o.append(W(p.x, p.Y(29.4), p.x + p.w, p.Y(29.4), c=GLD, lw=1.2, dash="5 3"))
    o.append(T(p.X(29.5), p.Y(29.4) + 14, "平均 29.4 s", "end", 9.5, GLD, True, halo=True))
    for t0, c in exs:
        o.append(D(p.X(t0), p.Y(_f05_teph(t0)), c, 4.2))
    o.append(T(530, yb + 50, "最も短い: 18 s", "start", 10, SIG, True))
    o.append(T(530, yb + 66, "（サブフレーム 1 の頭から）", "start", 9.5, MUT))
    o.append(T(530, yb + 92, "最も長い: 36 s", "start", 10, SIG, True))
    o.append(T(530, yb + 108, "（1 の頭を少し逃した）", "start", 9.5, MUT))
    o.append(T(530, yb + 134, "t₀ が一様なら平均 29.4 s", "start", 10, GLD, True))
    return SVG(700, yb + 214, o, "エフェメリスを受けるまでの時間。(a) サブフレーム 1〜3 は 30 s のフレームごとに繰り返す。サブフレームは頭から受けないと読めないので、t₀ = 3 s に読み始めると、1 は次のフレームまで待ち、33 s かかる。t₀ = 20 s では、1〜3 とも次のフレームのものを受け、28 s かかる。(b) 待つ時間は 18〜36 s で、読み始める時刻がフレームの中のどこでも同じ確からしさなら、平均 29.4 s である。")
F["e05_ephwait"] = _f05_ephwait_fig()


# =====================================================================
# 5 節: スタートの種類と、手順ごとの時間（例の値）
# =====================================================================
_F05_STAGES = [("探す", GLD), ("合わせる", PUR), ("ビット同期", TEA), ("エフェメリスを待つ", SIG), ("位置を出す", GRN)]


def _f05_ttffseq_fig():
    o = []
    rows = [("コールドスタート", [1.64, 0.3, 1.0, 29.4, 0.0]),
            ("ウォームスタート", [0.09, 0.3, 1.0, 29.4, 0.0]),
            ("ホットスタート", [0.06, 0.3, 0.0, 0.0, 0.5])]
    o.append(T(14, 18, "(a) 手順ごとの時間（例の値。エフェメリスは平均 29.4 s、細い線は 18〜36 s）", "start", 11, INK, True))
    x0, w = 130, 540
    X = lambda t: x0 + t / 40.0 * w
    for i, (nm, ts) in enumerate(rows):
        y = 44 + i * 40
        o.append(T(x0 - 8, y + 15, nm, "end", 10, INK, True))
        t = 0.0
        for (lab, c), d in zip(_F05_STAGES, ts):
            if d > 0:
                o.append(RECT(X(t), y, max(X(t + d) - X(t), 1.5), 22, 2, soft(c), c, 1.0))
                if X(t + d) - X(t) > tw(lab, 9.5) + 6:
                    o.append(T((X(t) + X(t + d)) / 2, y + 15, lab, "middle", 9.5, c, True))
            t += d
        if ts[3] > 0:
            a = sum(ts[:3]); o.append(W(X(a + 18), y + 26, X(a + 36), y + 26, c=SIG, lw=1.2))
            o.append(W(X(a + 18), y + 23, X(a + 18), y + 29, c=SIG, lw=1.2)); o.append(W(X(a + 36), y + 23, X(a + 36), y + 29, c=SIG, lw=1.2))
        o.append(T(X(t) + 6, y + 15, "%.1f s" % t, "start", 10, INK, True))
    o.append(W(x0, 168, x0 + w, 168, c=MUT, lw=1.1))
    for v in range(0, 41, 5):
        o.append(W(X(v), 168, X(v), 172, c=MUT, lw=1)); o.append(T(X(v), 184, "%d" % v, "middle", 9.5, MUT))
    o.append(T(x0 + w / 2, 200, "電源を入れてからの時間 [s]", "middle", 10, MUT))
    # (b) 初めの 3 s を拡大
    yb = 226
    o.append(W(10, yb - 12, 690, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 4, "(b) 初めの 3 s を拡大", "start", 11, INK, True))
    X2 = lambda t: x0 + t / 3.0 * w
    for i, (nm, ts) in enumerate(rows):
        y = yb + 18 + i * 30
        o.append(T(x0 - 8, y + 13, nm, "end", 9.5, INK))
        t = 0.0
        for (lab, c), d in zip(_F05_STAGES, ts):
            if d > 0:
                e = min(t + d, 3.0)
                if t < 3.0:
                    o.append(RECT(X2(t), y, max(X2(e) - X2(t), 1.5), 18, 2, soft(c), c, 1.0))
                    if X2(e) - X2(t) > tw(lab, 9) + 6:
                        o.append(T((X2(t) + X2(e)) / 2, y + 13, lab, "middle", 9, c, True))
            t += d
    o.append(W(x0, yb + 110, x0 + w, yb + 110, c=MUT, lw=1.1))
    for v in (0, 0.5, 1, 1.5, 2, 2.5, 3):
        o.append(W(X2(v), yb + 110, X2(v), yb + 114, c=MUT, lw=1)); o.append(T(X2(v), yb + 126, _f05_m(v), "middle", 9.5, MUT))
    o.append(LEGL(14, yb + 152, [(GLD, None, "探す"), (PUR, None, "合わせる"), (TEA, None, "ビット同期"), (SIG, None, "エフェメリス"), (GRN, None, "位置（出力の時刻まで）")], 9.5, 14))
    return SVG(700, yb + 162, o, "スタートの種類と、手順ごとの時間（例の値: 探す回路は同時に 4000 個のビンを計算し、1 つのビンに 4 ms をかける。コールドスタートは 32 機 × 2046 × 25 = 164 万個のビン、ウォームスタートは見えている 9 機 × 2046 × 5 = 9.2 万個）。コールドとウォームは、どちらもエフェメリスを待つ時間が大部分を占め、TTFF はほとんど変わらない。ホットスタートはエフェメリスを待たず、1 s ほどで位置が出る。")
F["e05_ttffseq"] = _f05_ttffseq_fig()


# =====================================================================
# 6 節: 前もって持つ情報で、探すビンが減る・バックアップ電源
# =====================================================================
def _f05_agnss_fig():
    o = []
    rows = [("コールド", 32 * 2046 * 25, "32 機 × 2046 × 25（±6 kHz）", ALI),
            ("ウォーム", 9 * 2046 * 5, "9 機 × 2046 × 5（TCXO の ±0.8 kHz）", GLD),
            ("ホット・A-GNSS", 9 * 2046 * 3, "9 機 × 2046 × 3（前の周波数のずれを使う）", SIG),
            ("A-GNSS＋精密な時刻", 9 * 40 * 3, "9 機 × 40（±10 チップ）× 3", GRN)]
    o.append(T(14, 18, "(a) 探すビンの数と、探す時間（同時に 4000 個のビンを計算する例）", "start", 11, INK, True))
    x0, w = 150, 300
    X = lambda v: x0 + (math.log10(v) - 2) / 5.0 * w
    for v in (1e2, 1e3, 1e4, 1e5, 1e6, 1e7):
        o.append(W(X(v), 34, X(v), 160, c=GRD, lw=1))
        o.append(T(X(v), 174, "10%s" % "⁰¹²³⁴⁵⁶⁷⁸⁹"[int(round(math.log10(v)))], "middle", 9.5, MUT))
    o.append(T(x0 + w / 2, 190, "ビンの数（対数の目盛）", "middle", 10, MUT))
    o.append(T(470, 44, "1 ビンに 4 ms", "middle", 9.5, MUT, True))
    o.append(T(470, 57, "（強い信号）", "middle", 9, MUT))
    o.append(T(600, 44, "1 ビンに 0.2 s", "middle", 9.5, MUT, True))
    o.append(T(600, 57, "（弱い信号。6 節）", "middle", 9, MUT))
    for i, (nm, v, sub, c) in enumerate(rows):
        y = 66 + i * 24
        o.append(T(x0 - 8, y + 13, nm, "end", 10, INK, True))
        o.append(RECT(x0, y, X(v) - x0, 17, 2, soft(c), c, 1.0))
        o.append(T(x0 + 4, y + 13, sub, "start", 9, INK, False, halo=True))
        o.append(T(470, y + 13, _f05_fmt_t(v * 4e-3 / 4000), "middle", 10, c, True))
        o.append(T(600, y + 13, _f05_fmt_t(v * 0.2 / 4000), "middle", 10, c, True))
    # (b) バックアップ電源
    yb = 214
    o.append(W(10, yb - 12, 690, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 4, "(b) 電源を切っていた時間と、次に入れたときのスタート（代表値）", "start", 11, INK, True))
    xa, wa = 150, 500
    lt = lambda h: xa + (math.log10(h) - math.log10(1 / 60)) / (math.log10(24 * 365) - math.log10(1 / 60)) * wa
    def band(y, a, b, c, lab):
        o.append(RECT(lt(a), y, lt(b) - lt(a), 22, 0, soft(c), "none", 0))
        if lt(b) - lt(a) > tw(lab, 9.5) + 6:
            o.append(T((lt(a) + lt(b)) / 2, y + 15, lab, "middle", 9.5, c, True))
    y1 = yb + 22
    o.append(T(xa - 8, y1 + 15, "バックアップあり", "end", 10, INK, True))
    band(y1, 1 / 60, 3, SIG, "ホット"); band(y1, 3, 24 * 21, GLD, "ウォーム"); band(y1, 24 * 21, 24 * 365, ALI, "コールド")
    o.append(RECT(lt(2), y1, lt(4) - lt(2), 22, 0, "none", MUT, 1, dash="3 2"))
    o.append(RECT(lt(24 * 14), y1, lt(24 * 60) - lt(24 * 14), 22, 0, "none", MUT, 1, dash="3 2"))
    y2 = y1 + 34
    o.append(T(xa - 8, y2 + 15, "バックアップなし", "end", 10, INK, True))
    band(y2, 1 / 60, 24 * 365, ALI, "コールド（時刻が分からない）")
    ticks = [(1 / 60, "1 分"), (10 / 60, "10 分"), (1, "1 時間"), (4, "4 時間"), (24, "1 日"), (24 * 7, "1 週"), (24 * 30, "1 か月"), (24 * 365, "1 年")]
    for h, lab in ticks:
        o.append(W(lt(h), y2 + 26, lt(h), y2 + 30, c=MUT, lw=1)); o.append(T(lt(h), y2 + 43, lab, "middle", 9.5, MUT))
    o.append(T(xa + wa / 2, y2 + 60, "電源を切っていた時間（対数の目盛。破線の枠は、境目がこの範囲にあること）", "middle", 9.5, MUT))
    return SVG(700, y2 + 72, o, "前もって持つ情報と、探す範囲・スタートの種類（例の値と代表値）。(a) アルマナック・時刻・位置があれば、見えている衛星とドップラーが予想でき、精密な時刻があれば符号の位相も予想できるので、探すビンの数が桁で減る。弱い信号を長い積分で探すときほど、その差が効く。(b) バックアップ電源で時計とメモリを保つと、エフェメリスが有効な間（2〜4 時間ほど）はホットスタート、アルマナックが使える間（数週間）はウォームスタートになる。")


def _f05_fmt_t(s):
    if s < 0.01:
        return "%.1f ms" % (s * 1e3)
    if s < 1:
        return "%.2f s" % s
    if s < 100:
        return "%.1f s" % s
    return "%.0f s" % s


F["e05_agnss"] = _f05_agnss_fig()


# =====================================================================
# 6 節: 非コヒーレント積分の利得と、感度と時間
# =====================================================================
def _f05_req_snr(N, pfa, straddle=True):
    thr = float(_f05_st.gamma.isf(pfa, N))
    g = _F05_STR if straddle else _f05_np.array([1.0])
    f = lambda s: float(_f05_st.ncx2.sf(2 * thr, 2 * N, 2 * N * s * g).mean()) - 0.9
    return _f05_opt.brentq(f, 1e-4, 1e5)


def _f05_noncoh_fig():
    o = []
    pfa0 = 0.01 / 42966
    s1 = _f05_req_snr(1, pfa0, False)
    Ns = [1, 2, 3, 5, 7, 10, 20, 30, 50, 70, 100, 200, 300, 500, 1000]
    gains = [(n, 10 * math.log10(s1 / _f05_req_snr(n, pfa0, False))) for n in Ns]
    o.append(T(14, 18, "(a) 足す回数と利得（1 回あたりの SNR が下げられる量）", "start", 11, INK, True))
    p = Plot(60, 40, 260, 180, (1, 1000), (0, 30), xlog=True)
    o.append(p.axes(xl="足す回数 N_nc", yl="利得 [dB]", xt=[1, 10, 100, 1000], yt=[0, 10, 20, 30], xfmt=_f05_m, yfmt=_f05_m))
    o.append(p.line([(n, 10 * math.log10(n)) for n in (1, 1000)], c=MUT, lw=1.4, dash="5 3"))
    o.append(p.line([(n, 5 * math.log10(n)) for n in (1, 1000)], c=FNT, lw=1.4, dash="2 3"))
    o.append(p.line(gains, c=SIG, lw=2.2))
    for n, g in gains:
        if n in (10, 100):
            o.append(D(p.X(n), p.Y(g), SIG, 4))
            o.append(T(p.X(n) + 6, p.Y(g) + 14, "%.1f dB" % g, "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(30), p.Y(25), "コヒーレント（10 log N）", "middle", 9.5, MUT, False, halo=True))
    o.append(T(p.X(200), p.Y(8), "平方根（5 log N）", "middle", 9.5, MUT, False, halo=True))
    o.append(T(p.X(1.2), p.Y(27), "青: 非コヒーレント", "start", 9.5, SIG, True, halo=True))
    # (b) 合わせた積分の時間と、要る C/N0
    xb = 370
    o.append(T(xb, 18, "(b) 合わせた積分の時間と、見つけられる C/N0", "start", 11, INK, True))
    q = Plot(xb + 50, 40, 250, 180, (1, 3000), (15, 50), xlog=True)
    o.append(q.axes(xl="合わせた積分の時間 [ms]", yl="要る C/N0 [dB-Hz]", xt=[1, 10, 100, 1000], yt=[15, 20, 25, 30, 35, 40, 45, 50], xfmt=_f05_m, yfmt=_f05_m))
    marks = []
    for Tc, c in ((1, TEA), (10, SIG), (20, PUR)):
        nb = int(round(10000 * 2 * Tc * 1e-3)) + 1; cells = 2046 * nb; pfa = 0.01 / cells
        pts = []
        for n in (1, 2, 5, 10, 20, 50, 100):
            if Tc * n > 3000:
                continue
            snr = _f05_req_snr(n, pfa)
            cn = 10 * math.log10(snr) - 10 * math.log10(Tc * 1e-3)
            pts.append((Tc * n, cn))
            if (Tc, n) in ((1, 1), (20, 10), (20, 100)):
                marks.append((Tc, n, cn, cells, c))
        o.append(q.line(pts, c=c, lw=2))
        for x, v in pts:
            o.append(D(q.X(x), q.Y(v), c, 2.6))
        o.append(T(q.X(pts[-1][0]) + 4, q.Y(pts[-1][1]) - 8, "%d ms" % Tc, "start", 9.5, c, True, halo=True))
    yy = 278
    o.append(T(14, yy, "1 つの衛星の ±5 kHz の格子を、同時に 4000 個のビンを計算する回路で探す時間（例の値）:", "start", 9.5, INK, True))
    for k, (Tc, n, cn, cells, c) in enumerate(marks):
        o.append(T(14 + k * 228, yy + 18, "%d ms × %d 回: %.1f dB-Hz" % (Tc, n, cn), "start", 9.5, c, True))
        o.append(T(14 + k * 228, yy + 33, "%s ビン、%s" % (_f05_g(cells), _f05_fmt_t(cells * Tc * n * 1e-3 / 4000)), "start", 9.5, MUT))
    return SVG(700, yy + 44, o, "非コヒーレント積分。(a) P<sub>d</sub> = 0.9・1 つのビンの誤警報確率 2.33 × 10⁻⁷ で計算した利得。足す回数を 10 倍にしても、利得はコヒーレントの 10 dB より小さく、回数が多いほど平方根（10 倍で 5 dB）に近づく。(b) コヒーレント積分の時間（1・10・20 ms）と、それを足す回数を変えたときに見つけられる C/N0（刻みの損失の平均を含む）。長い積分ほど弱い信号を見つけられるが、ドップラーのビンも増え、探す時間が急に延びる。")
F["e05_noncoh"] = _f05_noncoh_fig()
