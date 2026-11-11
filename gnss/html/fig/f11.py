# -*- coding: utf-8 -*-
# 11 章 RF の基板設計 の図。figures.py の部品をそのまま使う（exec で読み込まれる）。
# 数値は本文の検算（$SP/g11/check.py・fd.py）と同じ式で、この中で計算する。数値の計算（2 次元の静電界）は fd.py と同じ方法。
import math as _f11_m
import cmath as _f11_cm
import numpy as _f11_np

_F11_C = 299792458.0
_F11_F1 = 1575.42e6
_F11_L0 = _F11_C / _F11_F1 * 1e3          # 真空の波長 [mm]
_F11_ER, _F11_H, _F11_T = 4.4, 0.2, 0.035  # 例の基板: 比誘電率・1 層目と 2 層目の間 [mm]・銅の厚さ [mm]
_F11_W50 = 0.3506                         # 数値の計算で 50 Ω になるマイクロストリップ線路の幅 [mm]（check.py）
_F11_EE50 = 3.1828                        # そのときの実効比誘電率（check.py）
_F11_LG = _F11_L0 / _f11_m.sqrt(_F11_EE50)  # 線の上の波長 [mm]（106.7）
_F11_WIPC = 0.3304                        # 近似式（IPC-2141 の形）で 50 Ω になる幅（check.py）
_F11_WG50 = 0.3074                        # コプレーナ線路（隙間 0.2 mm、厚さ 35 μm）の 50 Ω の幅（数値の計算。check.py）
_F11_EEG50 = 2.9107
_F11_WGCM = 0.3602                        # 同じ線の、厚さ 0 の式（等角写像）で 50 Ω になる幅
# 例の基板の線（数値の計算。check2.py）: 特性インピーダンス → (幅 [mm], 実効比誘電率)
_F11_LINES = {50: (0.3506, 3.1828), 60: (0.2461, 3.0693), 75: (0.1463, 2.9269)}
_F11_L2 = (0.30, 125.47, 2.8791)          # 2 層の基板（1.6 mm）の幅 0.3 mm の線: 幅・Z0・実効比誘電率
_F11_LOSS = 0.0694                        # 例の線の線の損失 [dB/cm]（誘電体 0.045 + 銅 0.024。check.py）

# 数値の計算の結果（fd.py、格子の細かさ 2.5 μm。gendata.py）: (幅 [mm], Z0 [Ω])
_F11_FD_MS = [(0.1, 85.72), (0.15, 74.29), (0.2, 65.98), (0.25, 59.54), (0.3, 54.35), (0.35, 50.05), (0.4, 46.41), (0.5, 40.6), (0.6, 36.12), (0.7, 32.57), (0.8, 29.67)]
_F11_FD_GC = [(0.1, 78.69), (0.15, 68.44), (0.2, 61.02), (0.25, 55.26), (0.3, 50.62), (0.35, 46.76), (0.4, 43.49), (0.5, 38.24), (0.6, 34.17), (0.7, 30.93), (0.8, 28.27)]
_F11_FD_MS2 = [(0.2, 138.19), (0.3, 125.47), (0.5, 108.84), (0.75, 95.28), (1.0, 85.57), (1.5, 71.98), (2.0, 62.58), (2.5, 55.54), (3.0, 50.03), (3.5, 45.57), (4.0, 41.88)]
_F11_FD_GC2 = [(0.2, 79.18), (0.3, 71.21), (0.5, 61.91), (0.75, 55.16), (1.0, 50.65), (1.5, 44.54), (2.0, 40.27), (2.5, 36.97), (3.0, 34.27), (3.5, 31.99), (4.0, 30.04)]


def _f11_f(v, d=1):
    """数の文字（負の符号は −）。"""
    return ("%.*f" % (d, v)).replace("-", "−")


# =====================================================================
# 線路の式（本文 2 節と同じ）
# =====================================================================
def _f11_zipc(w, h=_F11_H, t=_F11_T, er=_F11_ER):
    """マイクロストリップ線路の近似式（IPC-2141 の形。基板アートワークシリーズ 10 章 3 節と同じ式）。"""
    return 87.0 / _f11_m.sqrt(er + 1.41) * _f11_m.log(5.98 * h / (0.8 * w + t))


def _f11_kk(k):
    from scipy.special import ellipk
    return float(ellipk(k * k) / ellipk(1 - k * k))


def _f11_gcpw(w, s, h=_F11_H, er=_F11_ER):
    """コプレーナ線路（グラウンド付き）の、上の銅の厚さを 0 とした等角写像の近似式。返り値 (Z0, 実効比誘電率)。"""
    k1 = w / (w + 2 * s)
    k2 = _f11_m.tanh(_f11_m.pi * w / (4 * h)) / _f11_m.tanh(_f11_m.pi * (w + 2 * s) / (4 * h))
    a, b = _f11_kk(k1), _f11_kk(k2)
    ee = (1 + er * b / a) / (1 + b / a)
    return 60 * _f11_m.pi / _f11_m.sqrt(ee) / (a + b), ee


# =====================================================================
# 断面の 2 次元の静電界（有限体積法。fd.py と同じ）。単位 mm
# =====================================================================
def _f11_grid(keys, lo, hi, fine, grow=1.15, cap=0.25):
    keys = sorted(set([lo, hi] + [k for k in keys if lo <= k <= hi]))
    pts = [lo]
    while pts[-1] < hi - 1e-12:
        x = pts[-1]
        d = min(abs(x - k) for k in keys)
        step = min(cap, fine + (grow - 1.0) * d)
        nxt = min([k for k in keys if k > x + 1e-12] + [hi])
        step = min(step, fine + (grow - 1.0) * max(0.0, nxt - x - step))
        step = max(step, fine * 0.5)
        if x + step > nxt - 0.3 * fine:
            step = nxt - x
        pts.append(x + step)
    return _f11_np.array(pts)


def _f11_solve(w, h, t, er, s=None, fine=0.005, X=4.0, Y=4.0):
    """線に 1 V、グラウンドに 0 V を与えた電位。返り値 dict(Z0, eeff, xs, ys, phi, sig)（sig は地板の上の面電荷の密度の分布）。"""
    import scipy.sparse as _sp
    import scipy.sparse.linalg as _spla
    np = _f11_np
    xk = [-w / 2, w / 2, 0.0] + ([-w / 2 - s, w / 2 + s] if s is not None else [])
    xs = _f11_grid(xk, -X, X, fine)
    ys = _f11_grid([0.0, h, h + t], 0.0, Y, fine)
    nx, ny = len(xs), len(ys)
    dx, dy = np.diff(xs), np.diff(ys)
    yc = (ys[:-1] + ys[1:]) / 2
    XX, YY = np.meshgrid(xs, ys, indexing="ij")
    strip = (np.abs(XX) <= w / 2 + 1e-12) & (YY >= h - 1e-12) & (YY <= h + t + 1e-12)
    gnd = (YY <= 1e-12) | (np.abs(XX) >= X - 1e-12) | (YY >= Y - 1e-12)
    if s is not None:
        gnd |= (np.abs(XX) >= w / 2 + s - 1e-12) & (YY >= h - 1e-12) & (YY <= h + t + 1e-12)
    fixed = strip | gnd
    V = np.where(strip, 1.0, 0.0)
    idx = -np.ones((nx, ny), dtype=int)
    unk = ~fixed
    idx[unk] = np.arange(unk.sum())
    n = int(unk.sum())

    def run(er_):
        E = np.ones((nx - 1, ny - 1))
        E[:, yc < h] = er_
        GE = np.zeros((nx - 1, ny)); GN = np.zeros((nx, ny - 1))
        for j in range(ny):
            GE[:, j] = ((E[:, j - 1] * dy[j - 1] / 2 if j > 0 else 0.0) + (E[:, j] * dy[j] / 2 if j < ny - 1 else 0.0)) / dx
        for i in range(nx):
            GN[i, :] = ((E[i - 1, :] * dx[i - 1] / 2 if i > 0 else 0.0) + (E[i, :] * dx[i] / 2 if i < nx - 1 else 0.0)) / dy
        rows, cols, vals = [], [], []
        b = np.zeros(n)

        def add(i1, j1, i2, j2, g):
            a = idx[i1, j1]; c = idx[i2, j2]
            ua, uc = a >= 0, c >= 0
            rows.append(a[ua]); cols.append(a[ua]); vals.append(g[ua])
            rows.append(c[uc]); cols.append(c[uc]); vals.append(g[uc])
            bo = ua & uc
            rows.append(a[bo]); cols.append(c[bo]); vals.append(-g[bo])
            rows.append(c[bo]); cols.append(a[bo]); vals.append(-g[bo])
            m = ua & ~uc
            np.add.at(b, a[m], g[m] * V[i2, j2][m])
            m = uc & ~ua
            np.add.at(b, c[m], g[m] * V[i1, j1][m])
        I, J = np.meshgrid(np.arange(nx - 1), np.arange(ny), indexing="ij")
        add(I.ravel(), J.ravel(), I.ravel() + 1, J.ravel(), GE.ravel())
        I, J = np.meshgrid(np.arange(nx), np.arange(ny - 1), indexing="ij")
        add(I.ravel(), J.ravel(), I.ravel(), J.ravel() + 1, GN.ravel())
        A = _sp.csr_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n))
        phi = V.copy()
        phi[unk] = _spla.spsolve(A.tocsc(), b)
        Wd = (GE * (phi[1:, :] - phi[:-1, :]) ** 2).sum() + (GN * (phi[:, 1:] - phi[:, :-1]) ** 2).sum()
        return Wd, phi, E
    Cd, phi, E = run(er)
    Ca, _, _ = run(1.0)
    eps0 = 8.8541878128e-12
    Z0 = 1.0 / (_F11_C * eps0 * _f11_m.sqrt(Cd * Ca))
    # 地板（y = 0）の上の面電荷の密度 ∝ 比誘電率 × 電界の縦の成分（戻る電流の密度に比例する）
    sig = E[:, 0] * (phi[:-1, 1] + phi[1:, 1]) / 2 / dy[0]
    xm = (xs[:-1] + xs[1:]) / 2
    return dict(Z0=Z0, eeff=Cd / Ca, xs=xs, ys=ys, phi=phi, sig=(xm, sig))


def _f11_contours(xs, ys, phi, level):
    """格子 (xs, ys) の上の電位 phi の等電位の線（マーチングスクエア）。返り値は線分 [(x0, y0, x1, y1), ...]。"""
    np = _f11_np
    out = []
    nx, ny = phi.shape
    for i in range(nx - 1):
        for j in range(ny - 1):
            v = (phi[i, j], phi[i + 1, j], phi[i + 1, j + 1], phi[i, j + 1])
            p = ((xs[i], ys[j]), (xs[i + 1], ys[j]), (xs[i + 1], ys[j + 1]), (xs[i], ys[j + 1]))
            pts = []
            for k in range(4):
                a, b = v[k], v[(k + 1) % 4]
                if (a - level) * (b - level) < 0:
                    tt = (level - a) / (b - a)
                    pa, pb = p[k], p[(k + 1) % 4]
                    pts.append((pa[0] + tt * (pb[0] - pa[0]), pa[1] + tt * (pb[1] - pa[1])))
            if len(pts) == 2:
                out.append((pts[0][0], pts[0][1], pts[1][0], pts[1][1]))
            elif len(pts) == 4:
                out.append((pts[0][0], pts[0][1], pts[1][0], pts[1][1]))
                out.append((pts[2][0], pts[2][1], pts[3][0], pts[3][1]))
    return out


def _f11_chain(segs, tol=1e-9):
    """線分の集まりを、つながった折れ線にまとめる（SVG を軽くするため）。"""
    from collections import defaultdict
    key = lambda x, y: (round(x / 1e-6), round(y / 1e-6))
    adj = defaultdict(list)
    for k, (x0, y0, x1, y1) in enumerate(segs):
        adj[key(x0, y0)].append((k, (x1, y1)))
        adj[key(x1, y1)].append((k, (x0, y0)))
    used = [False] * len(segs)
    lines = []
    for k, (x0, y0, x1, y1) in enumerate(segs):
        if used[k]:
            continue
        used[k] = True
        line = [(x0, y0), (x1, y1)]
        for end in (1, 0):
            while True:
                px, py = line[-1] if end else line[0]
                nxt = None
                for kk, q in adj[key(px, py)]:
                    if not used[kk]:
                        nxt = (kk, q); break
                if nxt is None:
                    break
                used[nxt[0]] = True
                if end:
                    line.append(nxt[1])
                else:
                    line.insert(0, nxt[1])
        lines.append(line)
    return lines


# =====================================================================
# 図の補助
# =====================================================================
def _f11_part(o, x, y, w, h, c=INK, fill=PAN, lab=None, sz=9, lc=None, r=1.5):
    """部品（上から見た長方形）。(x, y) は中心。"""
    o.append(RECT(x - w / 2, y - h / 2, w, h, r, fill, c, 1.2))
    if lab:
        o.append(T(x, y + sz * 0.36, lab, "middle", sz, lc or c, True))


def _f11_via(o, x, y, r=2.3, c=MUT):
    o.append(CIRC(x, y, r + 1.1, c=c, lw=1.0, fill=SCR))
    o.append(D(x, y, c, r * 0.55))


def _f11_hatch(x, y, w, h, c=ALI, step=7, lw=0.9):
    """斜線の網かけ（キープアウトなど）。"""
    o = []
    k = -h
    while k < w:
        x0, y0 = x + max(k, 0), y + max(0, -k)
        x1 = x + min(k + h, w); y1 = y + (x1 - x - k)
        if x1 > x0:
            o.append(W(x0, y0 if k >= 0 else y + (-k), x1, y1 if y1 <= y + h else y + h, c=c, lw=lw))
        k += step
    return "".join(o)


def _f11_smith(o, cx, cy, R, grid=True, lab=True):
    """50 Ω で正規化したスミスチャートの地（8 章 6 節と同じ見た目）。返り値は Γ → 座標の関数。"""
    np = _f11_np
    o.append(CIRC(cx, cy, R, c=INK, lw=1.3, fill=SCR))
    o.append(W(cx - R, cy, cx + R, cy, c=MUT, lw=1.0))
    def g2(G):
        return cx + R * G.real, cy - R * G.imag
    def zg(r, x):
        z = complex(r, x)
        return (z - 1) / (z + 1)
    if grid:
        xs_ = np.concatenate([-np.logspace(3, -2, 120), np.logspace(-2, 3, 120)])
        for r in (0.2, 0.5, 1.0, 2.0):
            o.append(PL([g2(zg(r, x)) for x in xs_], c=MUT if r == 1.0 else FNT, lw=1.0 if r == 1.0 else 0.8, dash=None if r == 1.0 else "3 3"))
        rs_ = np.concatenate([[0], np.logspace(-2, 3.5, 150)])
        for x in (-2.0, -1.0, -0.5, 0.5, 1.0, 2.0):
            o.append(PL([g2(zg(r, x)) for r in rs_], c=FNT, lw=0.8, dash="3 3"))
    if lab:
        o.append(T(cx - R - 4, cy - 5, "短絡", "end", 9, INK, True))
        o.append(T(cx + R + 4, cy - 5, "開放", "start", 9, INK, True))
    return g2


def _f11_gam(z, zr=50.0):
    return (z - zr) / (z + zr)


def _f11_zin(zl, z0, bl):
    """負荷 zl を、特性インピーダンス z0・電気的な長さ bl [rad] の線の手前から見たインピーダンス。"""
    g = (zl - z0) / (zl + z0) * _f11_cm.exp(-2j * bl)
    return z0 * (1 + g) / (1 - g)


def _f11_db(x):
    return 10 * _f11_m.log10(x)


# =====================================================================
# 1 節: 線の上の波長と部品の大きさ（同じ縮尺）
# =====================================================================
def _f11_scale_fig():
    o = []
    x0, x1, z1 = 40.0, 676.0, 110.0          # 0〜110 mm
    sc = (x1 - x0) / z1
    X = lambda z: x0 + z * sc
    lg = _F11_LG
    o.append(T(14, 18, "(a) 50 Ω の線の上の電圧（ある瞬間）", "start", 11.5, INK, True))
    yc, A = 78, 30
    o.append(W(x0, yc, x1, yc, c=GRD, lw=1))
    # 10 MHz の電圧（波長 16.8 m なので、どこもほぼ同じ）
    o.append(W(x0, yc - A, x1, yc - A, c=MUT, lw=1.4, dash="5 4"))
    o.append(T(X(54), yc - A - 6, "10 MHz（線の上の波長 9.5 m）: どこもほぼ同じ電圧", "middle", 9.5, MUT, False, halo=True))
    pts = [(X(z), yc - A * _f11_m.cos(2 * _f11_m.pi * z / lg)) for z in _f11_np.linspace(0, z1, 400)]
    o.append(PL(pts, c=SIG, lw=2.2))
    o.append(T(X(lg / 2) + 6, yc + A + 13, "L1（1575.42 MHz）", "start", 10, SIG, True, halo=True))
    # 波長の寸法
    dims = [(lg / 10, "1/10 波長 = %.1f mm（位相 36°）" % (lg / 10)), (lg / 4, "1/4 波長 = %.1f mm" % (lg / 4)), (lg, "1 波長 λ_g = %.1f mm" % lg)]
    yd = yc + A + 30
    for k, (L, lab) in enumerate(dims):
        y = yd + k * 17
        o.append(DIM(X(0), y, X(L), y, None, c=GLD))
        o.append(W(X(L), yc - A - 2, X(L), y + 4, c=GLD, lw=0.8, dash="2 3"))
        if X(L) + 6 + TXW(lab, 9.5) > 696:
            o.append(TX(X(L) - 8, y + 4, lab, "end", 9.5, GLD, True, halo=True))
        else:
            o.append(TX(X(L) + 6, y + 4, lab, "start", 9.5, GLD, True, halo=True))
    # (b) 基板の上の部品の並び（同じ縮尺）
    yb = yd + 3 * 17 + 22
    o.append(T(14, yb, "(b) RF の部品の並びの例（上から見た図。同じ縮尺）", "start", 11.5, INK, True))
    by0, by1 = yb + 12, yb + 12 + 13.5 * sc
    o.append(RECT(x0, by0, X(z1) - x0, by1 - by0, 2, GOSOFT, GLD, 1.0))
    ym = (by0 + by1) / 2
    wl = _F11_W50 * sc
    # 部品（寸法は例の値）: チップアンテナ 3.2×1.6、整合の部品 1.0×0.5、LNA 1.5×1.5、SAW 1.4×1.1、モジュール 10×10
    parts = [(3.0, 3.2, 1.6, "チップアンテナ", ALI), (7.0, 1.0, 0.5, None, MUT), (10.5, 1.5, 1.5, "LNA", INK), (15.0, 1.4, 1.1, "SAW", INK), (25.0, 10.0, 10.0, "モジュール", INK)]
    o.append(RECT(X(1.4), ym - wl / 2, X(20.0) - X(1.4), wl, 0, SIG, SIG, 0))
    for zc, pw, ph, lab, c in parts:
        o.append(RECT(X(zc) - pw * sc / 2, ym - ph * sc / 2, pw * sc, ph * sc, 1.2, PAN if c != ALI else ASOFT, c, 1.2))
    o.append(T(X(25.0), ym + 4, "モジュール（10 mm 角）", "middle", 9.5, INK, True))
    lab_y = by1 + 14
    for k, (zc, lab, c) in enumerate(((3.0, "アンテナ", ALI), (7.0, "整合の部品", MUT), (10.5, "LNA", INK), (15.0, "SAW", INK))):
        yy = lab_y + (k % 2) * 13
        o.append(W(X(zc), ym, X(zc), yy - 10, c=MUT, lw=0.8))
        o.append(T(X(zc), yy, lab, "middle", 9, c, True, halo=True))
    o.append(DIM(X(1.4), by0 - 6, X(30.0), by0 - 6, None, c=MUT))
    o.append(T(X(40), by0 + 12, "アンテナからモジュールの奥まで約 3 cm ≈ 1/4 波長", "start", 9.5, INK, True))
    o.append(T(X(40), by0 + 27, "線の幅 0.35 mm（50 Ω）、部品の寸法は例の値", "start", 9.5, MUT))
    o.append(T(X(40), by0 + 42, "真空の波長は 190.3 mm で、この図の幅より長い", "start", 9.5, MUT))
    h = by1 + 34
    return SVG(700, h, o, "例の基板の 50 Ω のマイクロストリップ線路（実効比誘電率 3.18）の上の電圧と、RF の部品の並び（(a) と (b) は同じ縮尺）。")


F["e11_scale"] = _f11_scale_fig()
