#!/usr/bin/env python3
"""dsp/ ドキュメント群の図をすべて生成するスクリプト。

使い方:
    pip install numpy scipy matplotlib
    python3 generate_figures.py

日本語ラベルには IPA ゴシック等の日本語フォントが必要
(Debian/Ubuntu: apt install fonts-ipafont-gothic)。
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, FancyArrowPatch
from scipy import signal as sig

OUT = os.path.dirname(os.path.abspath(__file__))

plt.rcParams.update({
    "font.family": ["IPAPGothic", "IPAGothic", "sans-serif"],
    "axes.unicode_minus": False,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "figure.constrained_layout.use": True,
    "font.size": 10,
})


def save(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("wrote", name)


def unit_circle(ax, **kw):
    th = np.linspace(0, 2 * np.pi, 400)
    ax.plot(np.cos(th), np.sin(th), "k--", lw=1, **kw)


# ---------------------------------------------------------------- 01 章
def fig01_sampling():
    fs, dur = 4000.0, 0.004
    t = np.linspace(0, dur, 2000)
    f = lambda t: np.sin(2 * np.pi * 500 * t) + 0.5 * np.sin(2 * np.pi * 1300 * t + 1.0)
    n = np.arange(0, int(dur * fs) + 1)
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.plot(t * 1e3, f(t), "C0", lw=1.5, label="連続信号 $x_a(t)$")
    ml, sl, bl = ax.stem(n / fs * 1e3, f(n / fs), linefmt="C3-", markerfmt="C3o", basefmt="k-",
                         label="サンプル列 $x[n]=x_a(nT)$")
    plt.setp(ml, markersize=6)
    ax.set_xlabel("時間 [ms]")
    ax.set_ylabel("振幅")
    ax.set_title("サンプリング: 連続波形を周期 T ごとの「スナップ写真」にする")
    ax.annotate("", xy=(8 / fs * 1e3, -1.45), xytext=(9 / fs * 1e3, -1.45),
                arrowprops=dict(arrowstyle="<->", color="k"))
    ax.text(8.5 / fs * 1e3, -1.35, "T", ha="center", fontsize=11)
    ax.set_ylim(-1.7, 1.7)
    ax.legend(loc="upper right")
    save(fig, "01_sampling.png")


def _triangle(ax, center, B, height=1.0, **kw):
    ax.fill([center - B, center, center + B], [0, height, 0], **kw)


def fig01_replication():
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3), sharey=True)
    fs = 1.0
    for ax, B, title in [
        (axes[0], 0.3, "fs > 2B: コピー同士に隙間 → 復元可能"),
        (axes[1], 0.7, "fs < 2B: コピーが重なる → エイリアシング"),
    ]:
        for k in range(-2, 3):
            color = "C0" if k == 0 else "C1"
            alpha = 0.55 if k == 0 else 0.35
            _triangle(ax, k * fs, B, color=color, alpha=alpha,
                      edgecolor=color, lw=1.5)
        if B > fs / 2:
            x = np.linspace(fs - B, B, 100)
            tri = lambda x, c: np.clip(1 - np.abs(x - c) / B, 0, None)
            ax.fill_between(x, np.minimum(tri(x, 0), tri(x, fs)), color="red", alpha=0.6)
            ax.annotate("混入して\n区別不能", xy=(fs / 2, 0.25), xytext=(fs * 0.95, 0.8),
                        arrowprops=dict(arrowstyle="->", color="red"), color="red", ha="center")
        ax.axvline(fs / 2, color="k", lw=1, ls=":")
        ax.text(fs / 2, 1.06, "fs/2", ha="center")
        ax.set_xticks([-2, -1, 0, 1, 2])
        ax.set_xticklabels(["-2fs", "-fs", "0", "fs", "2fs"])
        ax.set_xlim(-1.7, 1.7)
        ax.set_ylim(0, 1.25)
        ax.set_title(title, fontsize=10)
        ax.set_xlabel("周波数")
    axes[0].set_ylabel("$|X_s|$")
    fig.suptitle("サンプリングによるスペクトルの複製 $X_s = \\frac{1}{T}\\sum_k X_a(j(\\Omega - k\\Omega_s))$")
    save(fig, "01_spectrum_replication.png")


def fig01_aliasing_time():
    fs = 48e3
    f0, f1 = 30e3, 18e3
    t = np.linspace(0, 2.5e-4, 4000)
    n = np.arange(0, 13)
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.plot(t * 1e6, np.cos(2 * np.pi * f0 * t), "C1", lw=1, alpha=0.9,
            label="30 kHz (元の信号)")
    ax.plot(t * 1e6, np.cos(2 * np.pi * f1 * t), "C0", lw=1.8, alpha=0.8,
            label="18 kHz (= 48−30 kHz)")
    ax.plot(n / fs * 1e6, np.cos(2 * np.pi * f0 * n / fs), "ko", ms=7, zorder=5,
            label="fs = 48 kHz のサンプル点")
    ax.set_xlabel("時間 [μs]")
    ax.set_ylabel("振幅")
    ax.set_title("エイリアシング: 30 kHz と 18 kHz はサンプル点上で完全に一致する")
    ax.legend(loc="upper right", fontsize=9)
    save(fig, "01_aliasing_time.png")


# ---------------------------------------------------------------- 02 章
def fig02_euler():
    th = np.deg2rad(50)
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.2))
    ax = axes[0]
    unit_circle(ax)
    ax.plot([0, np.cos(th)], [0, np.sin(th)], "C0", lw=2)
    ax.plot([np.cos(th)], [np.sin(th)], "C0o", ms=8)
    ax.plot([np.cos(th), np.cos(th)], [0, np.sin(th)], "C1--", lw=1.5)
    ax.plot([0, np.cos(th)], [np.sin(th), np.sin(th)], "C2--", lw=1.5)
    ax.plot([np.cos(th)], [0], "C1s", ms=6)
    ax.plot([0], [np.sin(th)], "C2s", ms=6)
    arc = np.linspace(0, th, 50)
    ax.plot(0.25 * np.cos(arc), 0.25 * np.sin(arc), "k", lw=1)
    ax.text(0.32 * np.cos(th / 2), 0.32 * np.sin(th / 2), r"$\theta$")
    ax.text(np.cos(th) + 0.05, np.sin(th) + 0.05, r"$e^{j\theta}$", color="C0", fontsize=12)
    ax.text(np.cos(th) - 0.1, -0.15, r"$\cos\theta$", color="C1")
    ax.text(-0.45, np.sin(th), r"$\sin\theta$", color="C2")
    ax.axhline(0, color="k", lw=0.8)
    ax.axvline(0, color="k", lw=0.8)
    ax.set_xlim(-1.3, 1.3); ax.set_ylim(-1.3, 1.3); ax.set_aspect("equal")
    ax.set_title("単位円上の点 $e^{j\\theta}$ と実軸/虚軸への射影")
    ax.set_xlabel("Re"); ax.set_ylabel("Im")

    ax = axes[1]
    unit_circle(ax)
    for sgn, color, label in [(+1, "C0", r"$\frac{1}{2}e^{j\theta}$ (反時計回り)"),
                              (-1, "C3", r"$\frac{1}{2}e^{-j\theta}$ (時計回り)")]:
        ax.add_patch(FancyArrowPatch((0, 0), (0.5 * np.cos(th), 0.5 * sgn * np.sin(th)),
                                     arrowstyle="-|>", mutation_scale=15, color=color, lw=2))
        ax.text(0.52 * np.cos(th), 0.58 * sgn * np.sin(th), label, color=color, fontsize=10)
    ax.add_patch(FancyArrowPatch((0, 0), (np.cos(th), 0), arrowstyle="-|>",
                                 mutation_scale=15, color="C1", lw=2.5))
    ax.text(np.cos(th) * 0.75, -0.14, r"和 = $\cos\theta$", color="C1", fontsize=11)
    ax.plot([0.5 * np.cos(th), np.cos(th), 0.5 * np.cos(th)],
            [0.5 * np.sin(th), 0, -0.5 * np.sin(th)], "k:", lw=1)
    ax.axhline(0, color="k", lw=0.8); ax.axvline(0, color="k", lw=0.8)
    ax.set_xlim(-1.3, 1.3); ax.set_ylim(-1.3, 1.3); ax.set_aspect("equal")
    ax.set_title("cos は逆回転する 2 本のベクトルの和\n(虚部が打ち消し合う → 負の周波数の正体)")
    ax.set_xlabel("Re"); ax.set_ylabel("Im")
    save(fig, "02_euler_circle.png")


# ---------------------------------------------------------------- 03 章
def fig03_convolution():
    N = 18
    n = np.arange(N)
    h = 0.75 ** n
    imps = [(2, 1.0, "C0"), (5, 0.7, "C1"), (9, -0.6, "C2")]
    y = np.zeros(N)
    for k, amp, _ in imps:
        e = np.zeros(N); e[k:] = amp * h[: N - k]
        y += e
    fig, axes = plt.subplots(3, 1, figsize=(8, 6.5), sharex=True)
    ax = axes[0]
    for k, amp, c in imps:
        ml, _, _ = ax.stem([k], [amp], linefmt=c + "-", markerfmt=c + "o", basefmt="k-")
    ax.set_ylabel("入力 $x[n]$")
    ax.set_title("畳み込み = 各入力インパルスが起こす「余韻 h」の重ね合わせ")
    ax.set_xlim(-0.5, N - 0.5)
    ax = axes[1]
    for k, amp, c in imps:
        e = np.zeros(N); e[k:] = amp * h[: N - k]
        ax.plot(n, e, c + "o-", ms=4, lw=1, alpha=0.8,
                label=f"$x[{k}]\\,h[n-{k}]$")
    ax.set_ylabel("各インパルスの余韻")
    ax.legend(fontsize=9, ncol=3)
    ax = axes[2]
    ml, _, _ = ax.stem(n, y, linefmt="k-", markerfmt="ko", basefmt="k-")
    for k, amp, c in imps:
        e = np.zeros(N); e[k:] = amp * h[: N - k]
        ax.plot(n, e, c, lw=1, alpha=0.45)
    ax.set_ylabel("出力 $y[n]$ = 余韻の合計")
    ax.set_xlabel("n")
    save(fig, "03_convolution.png")


# ---------------------------------------------------------------- 04 章
def fig04_dtft():
    w = np.linspace(-2 * np.pi, 2 * np.pi, 2000)
    mag = lambda a, w: 1.0 / np.sqrt(1 - 2 * a * np.cos(w) + a * a)
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.3))
    ax = axes[0]
    ax.plot(w, mag(0.8, w), "C0")
    ax.axvspan(-np.pi, np.pi, color="C0", alpha=0.12)
    for x, lab in [(-2*np.pi, r"$-2\pi$"), (-np.pi, r"$-\pi$"), (0, "0"),
                   (np.pi, r"$\pi$"), (2*np.pi, r"$2\pi$")]:
        pass
    ax.set_xticks([-2*np.pi, -np.pi, 0, np.pi, 2*np.pi],
                  [r"$-2\pi$", r"$-\pi$", "0", r"$\pi$", r"$2\pi$"])
    ax.set_title("DTFT は周期 $2\\pi$・実信号なら左右対称\n→ 見るべきは $[0,\\pi]$ だけ (青帯が 1 周期)")
    ax.set_xlabel(r"$\omega$"); ax.set_ylabel(r"$|X(e^{j\omega})|$")
    ax = axes[1]
    w2 = np.linspace(0, np.pi, 1000)
    for a in [0.5, 0.8, 0.95]:
        ax.plot(w2, mag(a, w2) / mag(a, 0), label=f"a = {a}")
    ax.set_xticks([0, np.pi/2, np.pi], ["0", r"$\pi/2$", r"$\pi$"])
    ax.set_title("$x[n]=a^n u[n]$ の振幅特性 (最大値で正規化)\na が 1 に近いほど鋭いローパス")
    ax.set_xlabel(r"$\omega$"); ax.set_ylabel("正規化振幅")
    ax.legend()
    save(fig, "04_dtft_lowpass.png")


# ---------------------------------------------------------------- 05 章
def fig05_roc():
    a = 0.7
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.2))
    for ax, outside, title in [
        (axes[0], True, "右側信号 $a^n u[n]$ → ROC は極の外側\n(単位円を含む → DTFT が存在・安定)"),
        (axes[1], False, "左側信号 $-a^n u[-n-1]$ → ROC は極の内側\n(式は同じでも別の信号)"),
    ]:
        lim = 1.6
        if outside:
            ax.add_patch(Circle((0, 0), 2.4, color="C0", alpha=0.25))
            ax.add_patch(Circle((0, 0), a, color="white", zorder=2))
        else:
            ax.add_patch(Circle((0, 0), a, color="C0", alpha=0.25, zorder=2))
        unit_circle(ax)
        th = np.linspace(0, 2 * np.pi, 200)
        ax.plot(a * np.cos(th), a * np.sin(th), "C3:", lw=1, zorder=3)
        ax.plot([a], [0], "C3x", ms=11, mew=3, zorder=4)
        ax.text(a + 0.06, 0.08, "極 $z=a$", color="C3", zorder=4)
        ax.text(0.1, 1.06, "単位円", fontsize=9)
        ax.text(-1.5, 1.35 if outside else -1.45, "ROC (青)", color="C0")
        ax.axhline(0, color="k", lw=0.8); ax.axvline(0, color="k", lw=0.8)
        ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim); ax.set_aspect("equal")
        ax.set_title(title, fontsize=10)
        ax.set_xlabel("Re(z)"); ax.set_ylabel("Im(z)")
    save(fig, "05_roc.png")


def fig05_damped():
    r, th = 0.92, np.pi / 8
    n = np.arange(60)
    x = r ** n * np.cos(th * n)
    fig, ax = plt.subplots(figsize=(8, 3))
    ml, sl, bl = ax.stem(n, x, linefmt="C0-", markerfmt="C0o", basefmt="k-")
    plt.setp(ml, markersize=4)
    ax.plot(n, r ** n, "C3--", lw=1.5, label=r"包絡線 $\pm r^n$ (減衰率 = 極の半径 $r$)")
    ax.plot(n, -r ** n, "C3--", lw=1.5)
    ax.set_xlabel("n")
    ax.set_title(r"共役極対 $p = re^{\pm j\theta}$ が生む減衰振動 $r^n\cos(\theta n)$"
                 "  (r = 0.92, θ = π/8) — 鐘の余韻の正体")
    ax.legend()
    save(fig, "05_damped_oscillation.png")


# ---------------------------------------------------------------- 06 章
def fig06_surface():
    p = 0.85 * np.exp(1j * np.pi / 3)
    H = lambda z: (z - 1) * (z + 1) / ((z - p) * (z - np.conj(p)))
    dB = lambda z: 20 * np.log10(np.clip(np.abs(H(z)), 10 ** (-35 / 20), 10 ** (25 / 20)))
    lim = 1.5
    X, Y = np.meshgrid(np.linspace(-lim, lim, 300), np.linspace(-lim, lim, 300))
    fig = plt.figure(figsize=(10, 4))
    ax = fig.add_subplot(1, 2, 1, projection="3d")
    ax.plot_surface(X, Y, dB(X + 1j * Y), cmap="viridis", rstride=4, cstride=4,
                    linewidth=0, antialiased=True, alpha=0.9)
    w = np.linspace(0, 2 * np.pi, 400)
    ax.plot(np.cos(w), np.sin(w), dB(np.exp(1j * w)), "r", lw=2.5)
    ax.set_xlabel("Re(z)"); ax.set_ylabel("Im(z)"); ax.set_zlabel("|H| [dB]")
    ax.set_title("ゴム膜 $|H(z)|$: 極=支柱, 零点=ペグ\n赤線 = 単位円に沿った断面", fontsize=10)
    ax.view_init(elev=40, azim=-60)
    ax2 = fig.add_subplot(1, 2, 2)
    w = np.linspace(0, np.pi, 500)
    ax2.plot(w, dB(np.exp(1j * w)), "r", lw=2)
    ax2.set_ylim(-38, 28)
    ax2.axvline(np.pi / 3, color="k", ls=":", lw=1)
    ax2.text(np.pi / 3 + 0.08, 15, "極の角度 θ=π/3\n(共振ピーク)", fontsize=9)
    ax2.text(0.1, -33, "零点 z=1 (ω=0) と z=−1 (ω=π) で谷", fontsize=9)
    ax2.set_xticks([0, np.pi/2, np.pi], ["0", r"$\pi/2$", r"$\pi$"])
    ax2.set_xlabel(r"$\omega$"); ax2.set_ylabel("|H| [dB]")
    ax2.set_title("その断面を平面に開いたもの = 周波数特性", fontsize=10)
    save(fig, "06_pole_zero_surface.png")


def fig06_resonator():
    th = np.pi / 3
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 4))
    ax = axes[0]
    unit_circle(ax)
    for r, c in [(0.8, "C0"), (0.9, "C1"), (0.95, "C3")]:
        ax.plot([r * np.cos(th), r * np.cos(th)], [r * np.sin(th), -r * np.sin(th)],
                c + "x", ms=10, mew=2.5, label=f"r = {r}")
    ax.plot(np.cos(th), np.sin(th), "ko", ms=6, mfc="none")
    ax.annotate("単位円上の点 $e^{j\\theta}$\n(この周波数で距離最小)", xy=(np.cos(th), np.sin(th)),
                xytext=(-1.4, 1.1), fontsize=8, arrowprops=dict(arrowstyle="->"))
    ax.axhline(0, color="k", lw=0.8); ax.axvline(0, color="k", lw=0.8)
    ax.set_xlim(-1.5, 1.5); ax.set_ylim(-1.5, 1.5); ax.set_aspect("equal")
    ax.legend(loc="lower left", fontsize=9)
    ax.set_title("2 次共振器の極 $re^{\\pm j\\theta}$ (θ=π/3)")
    ax.set_xlabel("Re(z)"); ax.set_ylabel("Im(z)")
    ax = axes[1]
    w = np.linspace(0.01, np.pi, 1000)
    for r, c in [(0.8, "C0"), (0.9, "C1"), (0.95, "C3")]:
        b = [1.0]; a = [1.0, -2 * r * np.cos(th), r * r]
        _, h = sig.freqz(b, a, worN=w)
        ax.plot(w, 20 * np.log10(np.abs(h)), c, label=f"r = {r}")
    ax.axvline(th, color="k", ls=":", lw=1)
    ax.set_xticks([0, th, np.pi/2, np.pi], ["0", r"$\theta$", r"$\pi/2$", r"$\pi$"])
    ax.set_xlabel(r"$\omega$"); ax.set_ylabel("|H| [dB]")
    ax.set_title("極が単位円に近いほどピークが鋭くなる\n(ピーク高さ ≈ 1/(1−r))")
    ax.legend()
    save(fig, "06_resonator_peak.png")


# ---------------------------------------------------------------- 07 章
def fig07_ema():
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.3))
    ax = axes[0]
    a = 0.9
    n = np.arange(40)
    ml, sl, bl = ax.stem(n, (1 - a) * a ** n, linefmt="C0-", markerfmt="C0o", basefmt="k-")
    plt.setp(ml, markersize=4)
    ax.set_yscale("log")
    ax.set_title("EMA のインパルス応答 $h[n]=(1-a)a^n$ (a=0.9)\n対数軸で直線 = 指数減衰。厳密には永遠に 0 にならない")
    ax.set_xlabel("n"); ax.set_ylabel("h[n] (対数)")
    ax = axes[1]
    w = np.linspace(1e-3, np.pi, 2000)
    for a in [0.5, 0.8, 0.9]:
        _, h = sig.freqz([1 - a], [1, -a], worN=w)
        ax.plot(w, 20 * np.log10(np.abs(h)), label=f"a = {a}")
        wc = np.arccos((4 * a - a * a - 1) / (2 * a))
        ax.plot([wc], [-3.01], "kv", ms=6)
    ax.axhline(-3.01, color="k", ls=":", lw=1)
    ax.text(0.0012, -2.6, "−3 dB", fontsize=9)
    ax.set_xscale("log")
    ax.set_xlabel(r"$\omega$ (対数)"); ax.set_ylabel("|H| [dB]")
    ax.set_title("EMA の振幅特性: a を 1 に近づけるほど\nカットオフ (▼) が下がる")
    ax.legend(loc="lower left")
    save(fig, "07_ema.png")


def fig07_triangle():
    fig, ax = plt.subplots(figsize=(6.5, 4.6))
    tri_x = [-2, 2, 0, -2]
    tri_y = [1, 1, -1, 1]
    ax.fill(tri_x, tri_y, color="C0", alpha=0.2)
    ax.plot(tri_x, tri_y, "C0", lw=2)
    a1 = np.linspace(-2, 2, 400)
    ax.plot(a1, a1 ** 2 / 4, "C3--", lw=1.5)
    ax.fill_between(a1, a1 ** 2 / 4, 1, where=(np.abs(a1) <= 2), color="C1", alpha=0.15)
    ax.text(0, 0.62, "複素共役極\n(減衰振動)", ha="center", color="C1", fontsize=10)
    ax.text(0, -0.55, "実数極 2 個\n(振動しない減衰)", ha="center", color="C0", fontsize=10)
    ax.text(-2.65, 0.32, "$a_2 = a_1^2/4$\n(重根の境界)", color="C3", fontsize=9)
    for x, y, lab, va in [(-2, 1, "(-2, 1)", "bottom"), (2, 1, "(2, 1)", "bottom"), (0, -1, "(0, -1)", "top")]:
        ax.plot([x], [y], "ko", ms=5)
        ax.annotate(lab, (x, y), textcoords="offset points",
                    xytext=(0, 6 if va == "bottom" else -14), ha="center", fontsize=9)
    ax.plot([2.35], [0.55], "C3*", ms=14)
    ax.annotate("三角形の外 = 極が単位円外\n(発振)", (2.35, 0.55), textcoords="offset points",
                xytext=(-20, -30), color="C3", fontsize=9, ha="center")
    ax.set_xlim(-2.7, 2.9); ax.set_ylim(-1.5, 1.6)
    ax.set_xlabel("$a_1$"); ax.set_ylabel("$a_2$")
    ax.set_title("biquad の安定三角形: $|a_2|<1$, $1\\pm a_1 + a_2 > 0$")
    ax.axhline(0, color="k", lw=0.6); ax.axvline(0, color="k", lw=0.6)
    save(fig, "07_stability_triangle.png")


def fig07_fir_vs_iir():
    fig, ax = plt.subplots(figsize=(8, 3.3))
    w = np.linspace(1e-3, np.pi, 2000)
    b, a = sig.butter(4, 0.2)
    _, h = sig.freqz(b, a, worN=w)
    ax.plot(w / np.pi, 20 * np.log10(np.abs(h) + 1e-12), "C3", lw=2,
            label="IIR バタワース 4 次 (係数 9 個)")
    for taps, c in [(15, "C0"), (101, "C1")]:
        bf = sig.firwin(taps, 0.2)
        _, h = sig.freqz(bf, [1], worN=w)
        ax.plot(w / np.pi, 20 * np.log10(np.abs(h) + 1e-12), c, lw=1.2,
                label=f"FIR {taps} タップ (係数 {taps} 個)")
    ax.set_ylim(-100, 5)
    ax.set_xlabel(r"正規化周波数 $\omega/\pi$"); ax.set_ylabel("|H| [dB]")
    ax.set_title("同じカットオフでの比較: 極が使える IIR は少ない係数で急峻に切れる")
    ax.legend(fontsize=9)
    save(fig, "07_fir_vs_iir.png")


# ---------------------------------------------------------------- 08 章
def fig08_butterworth():
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.4))
    Om = np.linspace(0, 3, 1000)
    ax = axes[0]
    for N in [1, 2, 4, 8]:
        ax.plot(Om, 1 / np.sqrt(1 + Om ** (2 * N)), label=f"N = {N}")
    ax.plot([1], [1 / np.sqrt(2)], "ko", ms=6)
    ax.annotate("次数によらず\n$\\Omega_c$ で −3dB", xy=(1, 1/np.sqrt(2)), xytext=(1.5, 0.82),
                arrowprops=dict(arrowstyle="->"), fontsize=9)
    ax.set_xlabel(r"$\Omega/\Omega_c$"); ax.set_ylabel(r"$|H_a|$")
    ax.set_title("バタワース振幅特性 (線形): N が大きいほど\n「理想の角」に近づく。通過域は常に平坦")
    ax.legend()
    ax = axes[1]
    Om = np.logspace(-1, 1.3, 1000)
    for N in [1, 2, 4, 8]:
        ax.plot(Om, -10 * np.log10(1 + Om ** (2 * N)), label=f"N = {N}")
    ax.axhline(-3.01, color="k", ls=":", lw=1)
    ax.set_xscale("log")
    ax.set_ylim(-100, 5)
    ax.annotate("傾き −20N dB/dec", xy=(4, -75), fontsize=9)
    ax.set_xlabel(r"$\Omega/\Omega_c$ (対数)"); ax.set_ylabel("[dB]")
    ax.set_title("dB 表示: 阻止域は次数 1 つあたり\n20 dB/decade (6 dB/oct) ずつ急になる")
    ax.legend(loc="lower left")
    save(fig, "08_butterworth_family.png")


def fig08_spec_compare():
    Ap, As = 1.0, 40.0
    eps = np.sqrt(10 ** (Ap / 10) - 1)
    Om = np.logspace(-0.7, 1.0, 1200)
    fig, ax = plt.subplots(figsize=(8, 3.6))
    # 仕様マスク
    ax.fill_between([Om[0], 1], -Ap, -80, color="gray", alpha=0.25, lw=0)
    ax.fill_between([2, Om[-1]], -As, 5, color="gray", alpha=0.25, lw=0)
    ax.text(0.3, -25, "通過域仕様:\nΩ≤1 で −1dB 以内\n(灰色に入ると違反)", fontsize=8)
    ax.text(3.6, -20, "阻止域仕様:\nΩ≥2 で −40dB 以下", fontsize=8)
    Oc_b = 1 / (10 ** (Ap / 10) - 1) ** (1 / 16)  # N=8, 通過域端で等号
    for (b, a), lab, c in [
        (sig.butter(8, Oc_b, analog=True), "バタワース N=8", "C0"),
        (sig.cheby1(5, Ap, 1, analog=True), "チェビシェフ I N=5", "C1"),
        (sig.ellip(4, Ap, As, 1, analog=True), "楕円 N=4", "C2"),
    ]:
        _, h = sig.freqs(b, a, worN=Om)
        ax.plot(Om, 20 * np.log10(np.abs(h)), c, label=lab)
    ax.set_xscale("log")
    ax.set_ylim(-80, 4)
    ax.set_xlabel(r"$\Omega/\Omega_p$ (対数)"); ax.set_ylabel("ゲイン [dB]")
    ax.set_title("同一仕様 (1 dB / 40 dB / 遷移比 2) を満たす最小次数の比較")
    ax.legend(loc="lower left", fontsize=9)
    save(fig, "08_spec_comparison.png")


def fig08_cheby_poly():
    eps = np.sqrt(10 ** 0.1 - 1)
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.4))
    ax = axes[0]
    x = np.linspace(0, 1.25, 1000)
    for N, c in [(2, "C2"), (4, "C0"), (7, "C1")]:
        Tn = np.polynomial.chebyshev.Chebyshev([0] * N + [1])(x)
        ax.plot(x, Tn, c, label=f"$T_{{{N}}}$")
    ax.fill_between([0, 1], -1, 1, color="C0", alpha=0.1)
    ax.axhline(1, color="k", lw=0.8, ls=":"); ax.axhline(-1, color="k", lw=0.8, ls=":")
    ax.axvline(1, color="k", lw=0.8)
    ax.set_ylim(-1.6, 4)
    ax.text(0.03, 1.15, "|x|≤1: cos → ±1 の間で振動", fontsize=9)
    ax.text(1.02, 2.9, "x>1: cosh →\n指数的に急増", fontsize=9)
    ax.set_xlabel("x"); ax.set_ylabel(r"$T_N(x)$")
    ax.set_title("チェビシェフ多項式: x=1 を境に\n三角関数から双曲線関数へ「変身」")
    ax.legend(loc="upper left")
    ax = axes[1]
    Om = np.linspace(0, 1.8, 2000)
    T4 = np.polynomial.chebyshev.Chebyshev([0, 0, 0, 0, 1])(Om)
    H2 = 1 / (1 + eps ** 2 * T4 ** 2)
    ax.plot(Om, H2, "C0")
    ax.axhline(1, color="k", ls=":", lw=1)
    ax.axhline(1 / (1 + eps ** 2), color="k", ls=":", lw=1)
    ax.axvline(1, color="k", lw=0.8)
    ax.annotate(r"$\frac{1}{1+\varepsilon^2}$ (=−1dB)", xy=(0.1, 1 / (1 + eps ** 2) - 0.02),
                va="top", fontsize=10)
    ax.set_xlabel(r"$\Omega/\Omega_c$"); ax.set_ylabel(r"$|H_a|^2$")
    ax.set_title("N=4, リプル 1dB の振幅特性:\n通過域は 2 本の線の間を等振幅で往復 (等リプル)")
    save(fig, "08_chebyshev_equiripple.png")


def fig08_pole_layout():
    N = 4
    eps = np.sqrt(10 ** 0.1 - 1)
    b0 = np.arcsinh(1 / eps) / N
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.4), sharex=True, sharey=True)
    t = np.linspace(np.pi / 2, 3 * np.pi / 2, 200)
    ax = axes[0]
    ax.plot(np.cos(t), np.sin(t), "k--", lw=1)
    ang = np.pi * (N + 1 + 2 * np.arange(N)) / (2 * N)
    ax.plot(np.cos(ang), np.sin(ang), "C0x", ms=11, mew=3)
    for a_ in ang:
        ax.plot([0, np.cos(a_)], [0, np.sin(a_)], "C0:", lw=0.8)
    ax.set_title("バタワース N=4:\n半径 $\\Omega_c$ の円周上に等間隔 (π/N)")
    ax = axes[1]
    ax.plot(np.cos(t), np.sin(t), "k--", lw=1, label="バタワースの円")
    ax.plot(np.sinh(b0) * np.cos(t), np.cosh(b0) * np.sin(t), "C3--", lw=1.2, label="チェビシェフの楕円")
    alph = (2 * np.arange(N) + 1) * np.pi / (2 * N)
    s = -np.sinh(b0) * np.sin(alph) + 1j * np.cosh(b0) * np.cos(alph)
    ax.plot(s.real, s.imag, "C3x", ms=11, mew=3)
    ax.annotate("実軸方向に潰れて\n虚軸 (=周波数軸) に接近\n→ 鋭い共振がリプルの山を作る",
                xy=(s[0].real, s[0].imag), xytext=(-1.55, 0.15), fontsize=8,
                arrowprops=dict(arrowstyle="->"))
    ax.legend(loc="lower left", fontsize=8)
    ax.set_title("チェビシェフ N=4 (リプル1dB):\n楕円上 (角度は同じ $\\alpha_k$)")
    for ax in axes:
        ax.axhline(0, color="k", lw=0.8); ax.axvline(0, color="k", lw=0.8)
        ax.set_aspect("equal")
        ax.set_xlim(-1.7, 0.6); ax.set_ylim(-1.4, 1.4)
        ax.set_xlabel(r"$\sigma/\Omega_c$")
    axes[0].set_ylabel(r"$\Omega/\Omega_c$")
    save(fig, "08_pole_layouts.png")


def fig08_bilinear():
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 4))
    # 左: s平面の格子が z平面へどう写るか (T=2 で z=(1+s)/(1-s))
    ax = axes[0]
    unit_circle(ax)
    Om = np.linspace(-40, 40, 4000)
    for sg, c, lw in [(-2.0, "C0", 1), (-1.0, "C0", 1), (-0.5, "C0", 1), (-0.2, "C0", 1),
                      (0.0, "k", 2), (0.5, "C3", 1)]:
        s = sg + 1j * Om
        z = (1 + s) / (1 - s)
        ax.plot(z.real, z.imag, color=c, lw=lw)
    ax.set_aspect("equal"); ax.set_xlim(-2, 2.6); ax.set_ylim(-2.1, 2.1)
    ax.text(-0.62, 0.1, "σ<0 の縦線\n→ 全部円内", color="C0", fontsize=9)
    ax.text(0.75, 1.7, "虚軸 σ=0\n→ 単位円", fontsize=9)
    ax.text(1.75, 0.42, "σ>0\n→ 円外", color="C3", fontsize=9)
    ax.set_xlabel("Re(z)"); ax.set_ylabel("Im(z)")
    ax.set_title("双一次変換による s 平面の像:\n左半平面全体が単位円の内側へ (安定性保存)")
    # 右: ワーピング曲線
    ax = axes[1]
    T = 1.0
    Omg = np.linspace(0, 25, 2000)
    ax.plot(Omg, 2 * np.arctan(Omg * T / 2), "C0", lw=2, label=r"$\omega = 2\arctan(\Omega T/2)$")
    ax.plot(Omg, Omg * T, "C2--", lw=1.2, label=r"線形対応 $\omega = \Omega T$ (低域の近似)")
    ax.axhline(np.pi, color="k", ls=":", lw=1)
    ax.text(17, np.pi + 0.08, r"$\omega = \pi$ (ナイキスト)", fontsize=9)
    ax.set_ylim(0, 3.7); ax.set_xlim(0, 25)
    ax.set_xlabel(r"アナログ周波数 $\Omega$"); ax.set_ylabel(r"デジタル周波数 $\omega$")
    ax.set_title("周波数ワーピング: 無限の $\\Omega$ 軸が\n有限の $[0,\\pi)$ に tan で圧縮される")
    ax.legend(loc="lower right", fontsize=9)
    save(fig, "08_bilinear_mapping.png")


def fig08_design_example():
    lam = np.tan(2 * np.pi * 1000 / 48000 / 2)
    D = 1 + np.sqrt(2) * lam + lam * lam
    b = np.array([lam * lam, 2 * lam * lam, lam * lam]) / D
    a = np.array([1.0, 2 * (lam * lam - 1) / D, (1 - np.sqrt(2) * lam + lam * lam) / D])
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.6))
    ax = axes[0]
    f = np.logspace(np.log10(20), np.log10(24000), 2000)
    _, h = sig.freqz(b, a, worN=f, fs=48000)
    ax.plot(f, 20 * np.log10(np.abs(h)), "C0", lw=2)
    ax.plot([1000], [-3.01], "ko", ms=6)
    ax.annotate("1 kHz で −3.01 dB\n(プリワーピングのおかげで正確)", xy=(1000, -3.01),
                xytext=(60, -30), fontsize=9, arrowprops=dict(arrowstyle="->"))
    ax.set_xscale("log")
    ax.set_ylim(-80, 5)
    ax.set_xlabel("周波数 [Hz]"); ax.set_ylabel("|H| [dB]")
    ax.set_title("設計例の周波数特性 (fs=48kHz, fc=1kHz, N=2)")
    ax = axes[1]
    unit_circle(ax)
    poles = np.roots(a)
    ax.plot(poles.real, poles.imag, "C3x", ms=11, mew=3, label="極 (z=1 のすぐ近く)")
    ax.plot([-1], [0], "C0o", ms=10, mfc="none", mew=2, label="二重零点 z=−1 (ナイキスト)")
    ax.axhline(0, color="k", lw=0.8); ax.axvline(0, color="k", lw=0.8)
    ax.set_aspect("equal"); ax.set_xlim(-1.4, 1.4); ax.set_ylim(-1.4, 1.4)
    ax.legend(loc="lower left", fontsize=9)
    ax.set_xlabel("Re(z)"); ax.set_ylabel("Im(z)")
    ax.set_title("極零点配置: 低いカットオフゆえ\n極は z=1 の至近距離にいる")
    save(fig, "08_design_example.png")


def fig08_impulse_invariance():
    w = np.linspace(-np.pi, np.pi, 2000)
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.4), sharey=True)
    Hlp = lambda Om: 1 / np.sqrt(1 + (Om / 1.2) ** 4)   # 2次バタワース LP (Ωc=1.2)
    Hhp = lambda Om: 1 / np.sqrt(1 + (1.2 / np.maximum(np.abs(Om), 1e-9)) ** 4)
    for ax, H, title in [
        (axes[0], Hlp, "ローパス: 裾のみ重なる (誤差小 → 実用可)"),
        (axes[1], Hhp, "ハイパス: 本体同士が全面的に重なり崩壊"),
    ]:
        total = np.zeros_like(w)
        for k in [-1, 0, 1]:
            comp = H(w - 2 * np.pi * k)
            total += comp
            ax.plot(w, comp, "C1" if k else "C0", lw=1.2 if k else 1.8,
                    ls="--" if k else "-", alpha=0.8)
        ax.plot(w, total, "k", lw=2)
        ax.set_xticks([-np.pi, 0, np.pi], [r"$-\pi$", "0", r"$\pi$"])
        ax.set_xlabel(r"$\omega$")
        ax.set_title(title, fontsize=10)
    axes[0].set_ylabel("振幅")
    axes[0].plot([], [], "C0", label="k=0 (欲しい特性)")
    axes[0].plot([], [], "C1--", label="k=±1 の複製")
    axes[0].plot([], [], "k", lw=2, label="実際に得られる和")
    axes[0].legend(fontsize=8, loc="center")
    fig.suptitle("インパルス不変法: $H(e^{j\\omega}) = \\sum_k H_a(j(\\omega-2\\pi k)/T)$ — 複製の和になる")
    save(fig, "08_impulse_invariance.png")


# ---------------------------------------------------------------- 09 章
def _quantize(c, nbits):
    c = np.asarray(c, float)
    scale = 2.0 ** (nbits - 1 - np.ceil(np.log2(np.max(np.abs(c)) + 1e-30)))
    return np.round(c * scale) / scale


def fig09_quantization():
    nbits = 12
    b, a = sig.butter(8, 0.08)
    sos = sig.butter(8, 0.08, output="sos")
    aq = _quantize(a, nbits)
    p_ideal = np.roots(a)
    p_df = np.roots(aq)
    p_sos = np.concatenate([np.roots(_quantize(s[3:], nbits)) for s in sos])
    fig, ax = plt.subplots(figsize=(7.2, 5.4))
    th = np.linspace(-np.pi, np.pi, 600)
    ax.plot(np.cos(th), np.sin(th), "k--", lw=1, label="単位円")
    ax.fill(np.cos(th), np.sin(th), color="C0", alpha=0.06)
    ax.plot(p_ideal.real, p_ideal.imag, "C0o", ms=9, mfc="none", mew=2, label="設計値の極")
    ax.plot(p_df.real, p_df.imag, "C3x", ms=9, mew=2.5,
            label=f"直接形: 係数を {nbits}bit に丸めた極")
    ax.plot(p_sos.real, p_sos.imag, "C2+", ms=11, mew=2.5,
            label=f"SOS(biquad): 同じく {nbits}bit")
    for pp in p_df[np.abs(p_df) > 1]:
        ax.annotate("円外 = 発振", (pp.real, pp.imag), textcoords="offset points",
                    xytext=(6, 6), color="C3", fontsize=8)
    ax.set_aspect("equal")
    ax.set_xlim(0.2, 1.75); ax.set_ylim(-0.75, 0.75)
    ax.set_xlabel("Re(z)"); ax.set_ylabel("Im(z)")
    unstable = np.sum(np.abs(p_df) > 1)
    ax.set_title(f"8 次バタワース (低カットオフ) の係数量子化\n"
                 f"直接形は極が大きく飛散{'・単位円外に脱出 (発振!)' if unstable else ''}、SOS はほぼ動かない")
    ax.legend(fontsize=9, loc="upper left")
    print(f"  quantization: direct-form poles outside unit circle: {unstable}, "
          f"max|p|={np.max(np.abs(p_df)):.4f}")
    save(fig, "09_coefficient_quantization.png")


def fig09_limit_cycle():
    N = 60
    n = np.arange(N)
    fig, axes = plt.subplots(1, 2, figsize=(9.5, 3.2), sharex=True)
    for ax, a, title in [
        (axes[0], 0.95, "a = 0.95: 10 × 0.95 = 9.5 → 丸めて 10 に戻る\n→ 減衰がそこで止まる (デッドバンド)"),
        (axes[1], -0.95, "a = −0.95: 丸めが減衰を打ち消し\n±10 LSB で永久に振動 (リミットサイクル)"),
    ]:
        y_f, y_q = np.zeros(N), np.zeros(N)
        y_f[0] = y_q[0] = 16   # 初期値 16 LSB
        for k in range(1, N):
            y_f[k] = a * y_f[k - 1]
            y_q[k] = np.round(a * y_q[k - 1])   # 固定小数点: 毎回 LSB に丸め
        ax.plot(n, y_f, "C0o-", ms=3, lw=1, label="理想 (無限精度)")
        ax.plot(n, y_q, "C3s-", ms=3, lw=1, label="固定小数点 (丸めあり)")
        ax.set_title(title, fontsize=9.5)
        ax.set_xlabel("n")
        ax.legend(fontsize=8)
    axes[0].set_ylabel("出力 [LSB]")
    fig.suptitle("1 次 IIR $y[n] = a\\,y[n-1]$ の零入力応答: 丸め誤差がループを回り続ける")
    save(fig, "09_limit_cycle.png")


if __name__ == "__main__":
    fig01_sampling()
    fig01_replication()
    fig01_aliasing_time()
    fig02_euler()
    fig03_convolution()
    fig04_dtft()
    fig05_roc()
    fig05_damped()
    fig06_surface()
    fig06_resonator()
    fig07_ema()
    fig07_triangle()
    fig07_fir_vs_iir()
    fig08_butterworth()
    fig08_spec_compare()
    fig08_cheby_poly()
    fig08_pole_layout()
    fig08_bilinear()
    fig08_design_example()
    fig08_impulse_invariance()
    fig09_quantization()
    fig09_limit_cycle()
    print("done")
