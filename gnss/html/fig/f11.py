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


def _f11_solve(w, h, t, er, s=None, fine=0.0025, X=5.0, Y=5.0):
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
    o.append(W(x0, yc - 0.55 * A, x1, yc - 0.55 * A, c=MUT, lw=1.4, dash="5 4"))
    o.append(T(X(54), yc - A - 8, "10 MHz（線の上の波長 9.5 m）: どこもほぼ同じ電圧（破線）", "middle", 9.5, MUT, False, halo=True))
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
    o.append(T(X(25.0), ym - 2, "モジュール", "middle", 9, INK, True))
    o.append(T(X(25.0), ym + 11, "10 mm 角", "middle", 9, MUT))
    lab_y = by1 + 14
    for k, (zc, lab, c) in enumerate(((3.0, "アンテナ", ALI), (7.0, "整合の部品", MUT), (10.5, "LNA", INK), (15.0, "SAW", INK))):
        yy = lab_y + (k % 2) * 13
        o.append(W(X(zc), ym, X(zc), yy - 10, c=MUT, lw=0.8))
        o.append(T(X(zc), yy, lab, "middle", 9, c, True, halo=True))
    o.append(T(X(36), by0 + 20, "アンテナからモジュールの奥まで約 3 cm（1/4 波長 26.7 mm と同じくらい）", "start", 9.5, INK, True))
    o.append(T(X(36), by0 + 36, "線の幅 0.35 mm（50 Ω）。部品の寸法は例の値", "start", 9.5, MUT))
    o.append(T(X(36), by0 + 52, "真空の波長 190.3 mm は、この図の幅より長い", "start", 9.5, MUT))
    h = by1 + 36
    return SVG(700, h, o, "例の基板の 50 Ω のマイクロストリップ線路（実効比誘電率 3.18）の上の電圧と、RF の部品の並び（(a) と (b) は同じ縮尺）。")


F["e11_scale"] = _f11_scale_fig()


# =====================================================================
# 1 節: 伝送線路の断面と、L′・C′ のはしごのモデル
# =====================================================================
def _f11_ind_h(o, x1, x2, y, c=INK, n=4):
    """横向きのコイル（半円の連なり）。"""
    w = (x2 - x1) / n
    d = "M%g,%g" % (x1, y)
    for k in range(n):
        d += " a%g,%g 0 0 1 %g,0" % (w / 2, w / 2, w)
    o.append(PATH(d, c=c, lw=1.5))


def _f11_cap_v(o, x, y1, y2, c=INK, w=14):
    """縦向きのコンデンサ（y1 から y2 へ。真ん中に 2 枚の板）。"""
    ym = (y1 + y2) / 2
    o.append(W(x, y1, x, ym - 3, c=c, lw=1.4))
    o.append(W(x, ym + 3, x, y2, c=c, lw=1.4))
    o.append(W(x - w / 2, ym - 3, x + w / 2, ym - 3, c=c, lw=2))
    o.append(W(x - w / 2, ym + 3, x + w / 2, ym + 3, c=c, lw=2))


def _f11_tline_fig():
    o = []
    # (a) 断面
    o.append(T(14, 18, "(a) 断面（マイクロストリップ線路）", "start", 11.5, INK, True))
    cx, gy, hd = 132, 176, 52          # 線の中心、地板の上面、誘電体の厚さ（絵の寸法）
    o.append(RECT(24, gy, 216, 9, 0, MSOFT, MUT, 1.2))
    o.append(RECT(24, gy - hd, 216, hd, 0, GOSOFT, GLD, 1.0))
    wl = 44
    o.append(RECT(cx - wl / 2, gy - hd - 7, wl, 7, 0, SIG, SIG, 1))
    # 電界（線から地板へ）
    for k, dx in enumerate((-30, -14, 0, 14, 30)):
        if abs(dx) < 20:
            o.append(ARR(cx + dx * 0.7, gy - hd + 2, cx + dx * 0.7, gy - 3, c=PUR, lw=1.3, head=5))
        else:
            sx = cx + (wl / 2 if dx > 0 else -wl / 2)
            ex = cx + dx * 2.6
            o.append(CARR(sx, gy - hd - 3, ex, gy - 3, bend=0.25 if dx < 0 else -0.25, c=PUR, lw=1.3, head=5))
    # 磁界（線の周りの輪）
    for rx, ry in ((32, 15), (50, 26)):
        o.append('<ellipse cx="%g" cy="%g" rx="%g" ry="%g" fill="none" stroke="%s" stroke-width="1.2" stroke-dasharray="4 3"/>' % (cx, gy - hd - 4, rx, ry, TEA))
    o.append(T(cx + 52, gy - hd - 24, "磁界", "start", 9.5, TEA, True, halo=True))
    o.append(T(cx - 70, gy - 16, "電界", "end", 9.5, PUR, True, halo=True))
    # 電流の向き（⊗ 奥へ・⊙ 手前へ）
    xi, yi = cx - 62, gy - hd - 40
    o.append(CIRC(xi, yi, 5, c=SIG, lw=1.3, fill=SCR))
    o.append(W(xi - 3.2, yi - 3.2, xi + 3.2, yi + 3.2, c=SIG, lw=1.2)); o.append(W(xi - 3.2, yi + 3.2, xi + 3.2, yi - 3.2, c=SIG, lw=1.2))
    o.append(W(xi + 5, yi + 4, cx - wl / 2 + 4, gy - hd - 7, c=SIG, lw=0.9))
    o.append(T(xi - 8, yi + 4, "行きの電流", "end", 9.5, SIG, True, halo=True))
    o.append(CIRC(cx, gy + 4.5, 4.5, c=SIG, lw=1.3, fill=SCR)); o.append(D(cx, gy + 4.5, SIG, 1.6))
    o.append(T(cx, gy + 24, "戻る電流（グラウンドの面）", "middle", 9.5, SIG, True))
    o.append(T(24, gy - hd + 14, "誘電体", "start", 9.5, GLD, True, halo=True))
    o.append(T(24, 40, "電界 → 容量 C′、磁界 → インダクタンス L′", "start", 9.5, INK))
    o.append(T(24, 54, "（どちらも単位長さあたり。断面で決まる）", "start", 9.5, MUT))
    # (b) はしごのモデルと波の先
    xb = 270
    o.append(T(xb, 18, "(b) L′ と C′ のはしご（長さ Δz ごと）と、進む波の先", "start", 11.5, INK, True))
    yt, yg = 84, 154
    xs0, n, cw = xb + 46, 7, 52
    # 信号源
    o.append(CIRC(xb + 16, (yt + yg) / 2, 11, c=INK, lw=1.3, fill=SCR))
    o.append(T(xb + 16, (yt + yg) / 2 + 4, "V", "middle", 10, INK, True))
    o.append(W(xb + 16, (yt + yg) / 2 - 11, xb + 16, yt, xs0, yt, c=INK, lw=1.4))
    o.append(W(xb + 16, (yt + yg) / 2 + 11, xb + 16, yg, c=INK, lw=1.4))
    front = 4                              # 波の先が 4 区間目まで来た瞬間
    o.append(RECT(xs0 - 6, yt - 26, front * cw + 6, yg - yt + 40, 4, SSOFT, "none", 0))
    for k in range(n):
        xa = xs0 + k * cw
        c = SIG if k < front else MUT
        _f11_ind_h(o, xa + 4, xa + 30, yt, c=c)
        o.append(W(xa, yt, xa + 4, yt, c=c, lw=1.4)); o.append(W(xa + 30, yt, xa + cw, yt, c=c, lw=1.4))
        _f11_cap_v(o, xa + 40, yt, yg, c=c)
        o.append(D(xa + 40, yt, c, 2.2))
    o.append(W(xb + 16, yg, xs0 + n * cw, yg, c=MUT, lw=1.4))
    o.append(T(xs0 + n * cw + 4, yt + 4, "…", "start", 11, MUT))
    o.append(TX(xs0 + 17, yt - 10, "L′Δz", "middle", 9.5, SIG, True, halo=True))
    o.append(TX(xs0 + 54, (yt + yg) / 2 + 4, "C′Δz", "start", 9.5, SIG, True, halo=True))
    xf = xs0 + front * cw
    o.append(W(xf, yt - 30, xf, yg + 18, c=ALI, lw=1.6, dash="5 3"))
    o.append(ARR(xf + 2, yt - 22, xf + 40, yt - 22, c=ALI, lw=1.6, head=6))
    o.append(T(xf + 44, yt - 18, "波の先（速さ v）", "start", 9.5, ALI, True, halo=True))
    o.append(T(xs0 + front * cw / 2, yg + 30, "電圧 V まで充電され、電流 I が流れている", "middle", 9.5, SIG, True))
    o.append(T(xf + (n - front) * cw / 2 + 4, yg + 30, "まだ届いていない", "middle", 9.5, MUT, True))
    o.append(T(xb, 214, "時間 dt の間に、長さ v dt の部分の容量 C′v dt を V まで充電し、", "start", 9.5, INK))
    o.append(T(xb, 229, "インダクタンスに電流 I が流れる部分が v dt 延びる（本文の導出）。", "start", 9.5, INK))
    return SVG(700, 244, o, "伝送線路の断面の電界と磁界（(a)）と、単位長さあたりのインダクタンス L′ と容量 C′ で表したモデル（(b)）。")


F["e11_tline"] = _f11_tline_fig()


# =====================================================================
# 1 節: 負荷と定在波（50 Ω の線）
# =====================================================================
def _f11_standing_fig():
    o = []
    lg = _F11_LG
    p = Plot(80, 34, 470, 210, (110.0, 0.0), (0.0, 2.1))
    o.append(p.axes(xl="負荷までの距離 ℓ [mm]", yl="電圧の振幅（入ってくる波 = 1）", xt=[100, 80, 60, 40, 20, 0], yt=[0, 0.5, 1, 1.5, 2],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%g" % v)))
    loads = [(50.0, GRN, "50 Ω", None), (100.0, PUR, "100 Ω", None), (25.0, GLD, "25 Ω", "5 3"), (1e12, ALI, "開放", None)]
    for zl, c, nm, dash in loads:
        g = (zl - 50.0) / (zl + 50.0)
        pts = [(l, abs(1 + g * _f11_cm.exp(-2j * 2 * _f11_m.pi * l / lg))) for l in _f11_np.linspace(0, 110, 500)]
        o.append(p.clip(pts, c=c, lw=2.2, dash=dash))
    # 右の端（負荷）の名前と VSWR
    lab = [(50.0, 1.0, GRN, "50 Ω（整合）: VSWR 1"), (100.0, 4 / 3, PUR, "100 Ω: VSWR 2"), (25.0, 2 / 3, GLD, "25 Ω: VSWR 2"), (1e12, 2.0, ALI, "開放: VSWR ∞")]
    for zl, v, c, txt in lab:
        o.append(D(p.X(0), p.Y(v), c, 3.6))
        o.append(T(p.X(0) + 10, p.Y(v) + 4, txt, "start", 9.5, c, True))
    # 100 Ω の最大と最小（1 + |Γ| と 1 − |Γ|）
    xm = lg / 4
    o.append(W(p.X(xm), p.Y(4 / 3), p.X(xm), p.Y(2 / 3), c=PUR, lw=0.8, dash="2 3"))
    o.append(D(p.X(lg / 2), p.Y(4 / 3), PUR, 3.4)); o.append(D(p.X(xm), p.Y(2 / 3), PUR, 3.4))
    o.append(T(p.X(lg / 2), p.Y(4 / 3) - 8, "1 + |Γ| = 1.33", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(xm) - 8, p.Y(2 / 3) + 16, "1 − |Γ| = 0.67", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(xm) - 30, p.Y(0.06), "1/4 波長 26.7 mm", "end", 9, MUT, False, halo=True))
    o.append(W(p.X(xm), p.Y(0.5), p.X(xm), p.Y(0.0), c=MUT, lw=0.8, dash="2 3"))
    o.append(T(p.X(110), 24, "← 信号源の側", "start", 9.5, MUT))
    o.append(T(p.X(0), 24, "負荷 →", "end", 9.5, MUT))
    return SVG(700, 290, o, "50 Ω の線（例の基板）の先の負荷と、線の上の電圧の振幅（入ってくる波の振幅を 1 とした。右の端が負荷）。")


F["e11_standing"] = _f11_standing_fig()


# =====================================================================
# 1 節: 50 Ω の部品の間を、50 Ω でない線でつなぐと
# =====================================================================
def _f11_why50_fig():
    o = []
    cases = [(50.0, _F11_LINES[50][1], GRN, "50 Ω（幅 0.35 mm）", None),
             (60.0, _F11_LINES[60][1], GLD, "60 Ω（幅 0.25 mm）", None),
             (75.0, _F11_LINES[75][1], SIG, "75 Ω（幅 0.15 mm）", None),
             (_F11_L2[1], _F11_L2[2], ALI, "126 Ω（2 層の基板の幅 0.3 mm）", "6 3")]
    # (a) スミスチャート
    o.append(T(14, 18, "(a) 手前から見たインピーダンス（スミスチャート）", "start", 11.5, INK, True))
    cx, cy, R = 150, 172, 118
    g2 = _f11_smith(o, cx, cy, R)
    for z0, ee, c, nm, dash in cases:
        lg = _F11_L0 / _f11_m.sqrt(ee)
        pts = [g2(_f11_gam(_f11_zin(50.0, z0, 2 * _f11_m.pi * l / lg))) for l in _f11_np.linspace(0, lg / 2, 200)]
        if z0 == 50.0:
            continue
        o.append(PL(pts, c=c, lw=2.0, dash=dash))
        for l, mk in ((10.0, 3.6), (lg / 4, 4.6)):
            x, y = g2(_f11_gam(_f11_zin(50.0, z0, 2 * _f11_m.pi * l / lg)))
            o.append(D(x, y, c, mk))
    o.append(D(cx, cy, GRN, 5.5))
    o.append(W(cx, cy, cx - 50, cy + 72, c=GRN, lw=0.9))
    o.append(T(cx - 52, cy + 84, "50 Ω の線: どの長さでも中心", "middle", 9.5, GRN, True, halo=True))
    x, y = g2(_f11_gam(112.5))
    o.append(W(x, y, x + 10, y - 62, c=SIG, lw=0.9))
    o.append(T(x + 10, y - 66, "75 Ω の線の 1/4 波長: 112.5 Ω", "middle", 9.5, SIG, True, halo=True))
    o.append(T(cx, cy + R + 18, "線の長さ 0 から 1/2 波長まで（点は 10 mm と 1/4 波長）", "middle", 9.5, MUT))
    # (b) 反射の大きさと線の長さ
    xb = 318
    o.append(T(xb, 18, "(b) 手前から見た反射の大きさ", "start", 11.5, INK, True))
    p = Plot(xb + 46, 40, 288, 220, (0, 60), (0, 0.8))
    o.append(RECT(p.X(0), p.y, p.X(_F11_LG / 10) - p.X(0), p.h, 0, GSOFT, "none", 0))
    o.append(p.axes(xl="線の長さ ℓ [mm]", yl="反射係数の大きさ |Γ|", xt=[0, 10, 20, 30, 40, 50, 60], yt=[0, 0.2, 0.4, 0.6, 0.8], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    o.append(T(p.X(_F11_LG / 20), p.y + 14, "1/10 波長", "middle", 9, GRN, True, halo=True))
    o.append(T(p.X(_F11_LG / 20), p.y + 26, "より短い", "middle", 9, GRN, True, halo=True))
    for rl in (10.0, 20.0):
        gg = 10 ** (-rl / 20)
        o.append(W(p.x, p.Y(gg), p.x + p.w, p.Y(gg), c=MUT, lw=0.9, dash="3 3"))
        o.append(T(p.x + p.w + 4, p.Y(gg) + 3, "RL %d dB" % rl, "start", 9, MUT))
    for z0, ee, c, nm, dash in cases:
        lg = _F11_L0 / _f11_m.sqrt(ee)
        pts = [(l, abs(_f11_gam(_f11_zin(50.0, z0, 2 * _f11_m.pi * l / lg)))) for l in _f11_np.linspace(0, 60, 300)]
        o.append(p.clip(pts, c=c, lw=2.2, dash=dash))
    lg75 = _F11_L0 / _f11_m.sqrt(_F11_LINES[75][1])
    g75 = abs(_f11_gam(112.5))
    o.append(D(p.X(lg75 / 4), p.Y(g75), SIG, 4.4))
    o.append(T(p.X(lg75 / 4) + 4, p.Y(g75) - 38, "27.8 mm（1/4 波長）: |Γ| = %.3f" % g75, "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(lg75 / 4) + 4, p.Y(g75) - 24, "リターンロス 8.3 dB", "start", 9.5, SIG, False, halo=True))
    o.append(T(p.X(lg75 / 4) + 4, p.Y(g75) - 10, "不整合損失 0.70 dB", "start", 9.5, SIG, False, halo=True))
    o.append(LEGL(24, 318, [(c, d, nm) for z0, ee, c, nm, d in cases], 9.5, 14))
    return SVG(700, 330, o, "50 Ω の信号源と 50 Ω の負荷の間を、特性インピーダンス Z0 の線でつないだとき、手前から見た反射（L1。線の寸法と実効比誘電率は例の基板の数値の計算）。")


F["e11_why50"] = _f11_why50_fig()


# =====================================================================
# 2 節: 2 つの線の断面と、数値で解いた電位
# =====================================================================
def _f11_xsec_panel(o, x0, y0, w, s, title, sol, xr=0.85, sc=200.0):
    h, t = _F11_H, _F11_T
    X = lambda v: x0 + (v + xr) * sc
    Y = lambda v: y0 - v * sc            # y0 は地板の上面
    top = 0.62
    o.append(T(x0, y0 - top * sc - 16, title, "start", 11.5, INK, True))
    body = []
    body.append(RECT(X(-xr), Y(top), 2 * xr * sc, top * sc, 0, SCR, "none", 0))
    body.append(RECT(X(-xr), Y(h), 2 * xr * sc, h * sc, 0, GOSOFT, "none", 0))
    for lev in (0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9):
        segs = _f11_contours(sol["xs"], sol["ys"], sol["phi"], lev)
        segs = [sg for sg in segs if max(abs(sg[0]), abs(sg[2])) < xr + 0.3 and min(sg[1], sg[3]) < top + 0.3]
        for ln in _f11_chain(segs):
            body.append(PL([(X(a), Y(b)) for a, b in ln], c=PUR, lw=1.0))
    cid = "f11xs%d" % int(x0)
    o.append('<clipPath id="%s"><rect x="%g" y="%g" width="%g" height="%g"/></clipPath><g clip-path="url(#%s)">%s</g>'
             % (cid, X(-xr), Y(top), 2 * xr * sc, top * sc, cid, "".join(body)))
    o.append(W(X(-xr), Y(h), X(xr), Y(h), c=GLD, lw=0.8))
    o.append(RECT(X(-xr), y0, 2 * xr * sc, 8, 0, MSOFT, MUT, 1.1))
    o.append(RECT(X(-w / 2), Y(h + t), w * sc, t * sc, 0, SIG, SIG, 0.8))
    if s is not None:
        o.append(RECT(X(-xr), Y(h + t), (xr - w / 2 - s) * sc, t * sc, 0, MSOFT, MUT, 1.0))
        o.append(RECT(X(w / 2 + s), Y(h + t), (xr - w / 2 - s) * sc, t * sc, 0, MSOFT, MUT, 1.0))
        for xv in (-0.70, 0.70):
            o.append(RECT(X(xv) - 5, Y(h), 10, h * sc, 0, MSOFT, MUT, 1.0))
        o.append(T(X(0.70), y0 + 22, "ビア", "middle", 9.5, MUT, True))
        o.append(T(X(-0.70), y0 + 22, "ビア", "middle", 9.5, MUT, True))
        o.append(DIM(X(w / 2), Y(h + t) - 8, X(w / 2 + s), Y(h + t) - 8, None, c=INK))
        o.append(TX(X(w / 2 + s / 2), Y(h + t) - 14, "s = %.2f mm" % s, "start", 9.5, INK, True, halo=True))
    o.append(DIM(X(-w / 2), Y(h + t) - 8, X(w / 2), Y(h + t) - 8, None, c=SIG))
    o.append(TX(X(0), Y(h + t) - 14 - (12 if s is not None else 0), "w = %.2f mm" % w, "middle", 9.5, SIG, True, halo=True))
    o.append(DIM(X(-xr) + 14, Y(h), X(-xr) + 14, y0, None, c=GLD))
    o.append(TX(X(-xr) + 20, Y(h / 2) + 4, "h = 0.2 mm", "start", 9.5, GLD, True, halo=True))
    o.append(TX(X(xr) - 4, y0 + 22, "グラウンドの面（2 層目）", "end", 9.5, MUT, True) if s is None else "")
    o.append(TX(x0, y0 + 40, "Z_0 = %.1f Ω、ε_{eff} = %.2f（数値の計算）" % (sol["Z0"], sol["eeff"]), "start", 10, INK, True))


def _f11_xsec_fig():
    o = []
    msol = _f11_solve(_F11_W50, _F11_H, _F11_T, _F11_ER)
    gsol = _f11_solve(_F11_WG50, _F11_H, _F11_T, _F11_ER, s=0.20)
    _f11_xsec_panel(o, 14, 168, _F11_W50, None, "(a) マイクロストリップ線路", msol)
    _f11_xsec_panel(o, 362, 168, _F11_WG50, 0.20, "(b) コプレーナ線路（グラウンド付き）", gsol)
    o.append(T(14, 238, "紫の線: 等電位の線（線 1 V・グラウンド 0 V、0.1 V おき）。誘電体（比誘電率 4.4）・銅の厚さ 35 μm。", "start", 9.5, MUT))
    o.append(T(14, 253, "(a) は電界が上の空気と横にも広がり、(b) は線と両側のグラウンドの隙間に集まる。", "start", 9.5, MUT))
    return SVG(700, 262, o, "例の基板の 2 つの 50 Ω の線の断面と、2 次元の静電界を数値で解いた電位（線の付近を拡大）。")


F["e11_xsec"] = _f11_xsec_fig()


# =====================================================================
# 2 節: 幅と特性インピーダンス（近似式と数値の計算）、2 層の基板、ばらつき
# =====================================================================
def _f11_zw_fig():
    o = []
    np = _f11_np
    # (a) 例の基板
    o.append(T(14, 18, "(a) 例の基板（h = 0.2 mm）", "start", 11.5, INK, True))
    p = Plot(70, 36, 260, 190, (0.1, 0.8), (25, 90))
    o.append(p.axes(xl="線の幅 w [mm]", yl="特性インピーダンス Z_0 [Ω]", xt=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], yt=[30, 40, 50, 60, 70, 80, 90],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    o.append(W(p.x, p.Y(50), p.x + p.w, p.Y(50), c=MUT, lw=1.0))
    ws = np.linspace(0.1, 0.8, 120)
    o.append(p.clip([(w, _f11_zipc(w)) for w in ws], c=SIG, lw=1.8, dash="6 4"))
    o.append(p.clip([(w, _f11_gcpw(w, 0.2)[0]) for w in ws], c=PUR, lw=1.8, dash="6 4"))
    o.append(p.clip(_F11_FD_MS, c=SIG, lw=2.2))
    o.append(p.clip(_F11_FD_GC, c=PUR, lw=2.2))
    for w, z in _F11_FD_MS:
        o.append(D(p.X(w), p.Y(z), SIG, 2.6))
    for w, z in _F11_FD_GC:
        o.append(D(p.X(w), p.Y(z), PUR, 2.6))
    marks = [(_F11_WIPC, SIG, "0.33", -1), (_F11_W50, SIG, "0.35", 1), (_F11_WG50, PUR, "0.31", -1), (_F11_WGCM, PUR, "0.36", 1)]
    for k, (w, c, lab, side) in enumerate(marks):
        o.append(W(p.X(w), p.Y(50), p.X(w), p.Y(25), c=c, lw=0.8, dash="2 2"))
    o.append(T(p.X(0.40), p.Y(85), "50 Ω になる幅 [mm]", "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(0.40), p.Y(85) + 14, "マイクロストリップ: 0.35（式 0.33）", "start", 9, SIG, True, halo=True))
    o.append(T(p.X(0.40), p.Y(85) + 27, "コプレーナ: 0.31（式 0.36）", "start", 9, PUR, True, halo=True))
    o.append(T(p.X(0.16), p.Y(87), "マイクロストリップ", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.105), p.Y(31), "コプレーナ（s = 0.2 mm）", "start", 9.5, PUR, True, halo=True))
    # (b) 2 層の基板
    xb = 372
    o.append(T(xb, 18, "(b) 2 層の基板（h = 1.6 mm）", "start", 11.5, INK, True))
    q = Plot(xb + 56, 36, 250, 190, (0.2, 4.0), (25, 145))
    o.append(q.axes(xl="線の幅 w [mm]", yl="Z_0 [Ω]", xt=[0.5, 1, 2, 3, 4], yt=[30, 50, 75, 100, 125], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    o.append(W(q.x, q.Y(50), q.x + q.w, q.Y(50), c=MUT, lw=1.0))
    ws2 = np.linspace(0.2, 4.0, 150)
    o.append(q.clip([(w, _f11_zipc(w, h=1.6)) for w in ws2], c=SIG, lw=1.8, dash="6 4"))
    o.append(q.clip([(w, _f11_gcpw(w, 0.2, h=1.6)[0]) for w in ws2], c=PUR, lw=1.8, dash="6 4"))
    o.append(q.clip(_F11_FD_MS2, c=SIG, lw=2.2))
    o.append(q.clip(_F11_FD_GC2, c=PUR, lw=2.2))
    o.append(D(q.X(0.3), q.Y(_F11_L2[1]), ALI, 4.4))
    o.append(T(q.X(0.3) + 8, q.Y(_F11_L2[1]) + 4, "幅 0.3 mm: 126 Ω", "start", 9.5, ALI, True, halo=True))
    o.append(D(q.X(3.0), q.Y(50), SIG, 4.2)); o.append(D(q.X(1.04), q.Y(50), PUR, 4.2))
    o.append(T(q.X(3.0), q.Y(50) - 9, "3.0 mm", "middle", 9.5, SIG, True, halo=True))
    o.append(T(q.X(1.04), q.Y(50) + 16, "1.0 mm", "middle", 9.5, PUR, True, halo=True))
    o.append(LEGL(24, 274, [(SIG, None, "マイクロストリップ（数値の計算）"), (SIG, "6 4", "同（近似式）"), (PUR, None, "コプレーナ（数値の計算）"), (PUR, "6 4", "同（厚さ 0 の式）")], 9.5, 14))
    # (c) ばらつき（数値の計算、幅 0.35 mm のマイクロストリップ線路）
    yc0 = 300
    o.append(T(14, yc0, "(c) 50 Ω の線（幅 0.35 mm）の特性インピーダンスのずれ（数値の計算）", "start", 11.5, INK, True))
    r = Plot(250, yc0 + 12, 330, 72, (45, 55), (0, 3))
    for v in (46, 48, 50, 52, 54):
        o.append(W(r.X(v), r.y, r.X(v), r.y + r.h, c=GRD, lw=1))
        o.append(T(r.X(v), r.y + r.h + 13, "%d Ω" % v, "middle", 9, MUT))
    o.append(W(r.X(50), r.y - 2, r.X(50), r.y + r.h, c=INK, lw=1.2))
    rows = [("比誘電率 4.2 ↔ 4.6", 51.02, 49.04, GLD), ("誘電体の厚さ 0.18 ↔ 0.22 mm", 46.97, 52.85, SIG), ("ソルダーレジスト（20 μm・比誘電率 3.5）", 48.83, None, PUR)]
    for k, (lab, a, b, c) in enumerate(rows):
        yy = r.y + 6 + k * 23
        o.append(T(r.x - 8, yy + 11, lab, "end", 9.5, INK))
        for v in (a, b):
            if v is None:
                continue
            o.append(RECT(min(r.X(50), r.X(v)), yy + 2, abs(r.X(v) - r.X(50)), 13, 2, soft(c), c, 1.1))
            o.append(T(r.X(v) + (5 if v > 50 else -5), yy + 12, "%.1f" % v, "start" if v > 50 else "end", 9, c, True))
    return SVG(700, yc0 + 112, o, "幅と特性インピーダンス（比誘電率 4.4・銅の厚さ 35 μm。実線と点は 2 次元の静電界の数値の計算、破線は本文の近似式。値は例の値）。")


F["e11_zw"] = _f11_zw_fig()


# =====================================================================
# 3 節: 戻る電流の密度（数値の計算と式）と、グラウンドの面の切れ目
# =====================================================================
def _f11_return_fig():
    o = []
    np = _f11_np
    h = _F11_H
    sol = _f11_solve(_F11_W50, h, _F11_T, _F11_ER)
    xm, sg = sol["sig"]
    sel = np.abs(xm) <= 2.0
    xm, sg = xm[sel], sg[sel]
    sg = sg / sg.max()
    o.append(T(14, 18, "(a) グラウンドの面を流れる戻る電流の密度", "start", 11.5, INK, True))
    p = Plot(74, 92, 270, 150, (-2.0, 2.0), (0, 1.05))
    # 上の断面（同じ横の縮尺）
    gy = 70
    o.append(RECT(p.X(-2.0), gy, p.w, 5, 0, MSOFT, MUT, 1.0))
    o.append(RECT(p.X(-2.0), gy - h * (p.w / 4.0), p.w, h * (p.w / 4.0), 0, GOSOFT, GLD, 0.8))
    o.append(RECT(p.X(-_F11_W50 / 2), gy - h * (p.w / 4.0) - 3, _F11_W50 * (p.w / 4.0), 3, 0, SIG, SIG, 0.8))
    o.append(T(p.X(0.25), gy - 18, "線（幅 0.35 mm）", "start", 9.5, SIG, True))
    o.append(T(p.X(-2.0) - 6, gy + 5, "面", "end", 9.5, MUT, True))
    o.append(RECT(p.X(-3 * h), p.y, p.X(3 * h) - p.X(-3 * h), p.h, 0, SSOFT, "none", 0))
    o.append(p.axes(xl="線の真下からの距離 x [mm]", yl="密度（真下 = 1）", xt=[-2, -1, -0.6, 0, 0.6, 1, 2], yt=[0, 0.5, 1],
                    xfmt=lambda v: _f11_f(v, 1) if abs(v) == 0.6 else ("%g" % v).replace("-", "−"), yfmt=lambda v: "%g" % v))
    xs = np.linspace(-2, 2, 300)
    o.append(p.line([(x, 1 / (1 + (x / h) ** 2)) for x in xs], c=MUT, lw=1.4, dash="5 3"))
    o.append(p.line(list(zip(xm, sg)), c=SIG, lw=2.2))
    o.append(T(p.X(0.75), p.Y(0.92), "青い帯（両側 3h = 0.6 mm）", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.75), p.Y(0.92) + 13, "に戻る電流の 80 %", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.85), p.Y(0.48), "数値の計算", "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(0.85), p.Y(0.33), "細い線の式 1/{1 + (x/h)^2}", "start", 9.5, MUT, False, halo=True))
    # (b) 上から見た図: 切れ目なし／切れ目をまたぐ
    xb = 384
    o.append(T(xb, 18, "(b) 上から見た図（行きの電流と戻る電流）", "start", 11.5, INK, True))
    for k, (title, slot, c) in enumerate((("切れ目なし", False, GRN), ("面の切れ目をまたぐ", True, ALI))):
        y0 = 40 + k * 118
        bx, bw, bh = xb + 6, 296, 96
        o.append(RECT(bx, y0, bw, bh, 3, MSOFT, MUT, 1.0))
        o.append(T(bx + 6, y0 + 15, title, "start", 10, c, True, halo=True))
        yl = y0 + 50
        o.append(ARR(bx + 14, yl, bx + bw - 14, yl, c=SIG, lw=2.4, head=8))
        if not slot:
            o.append(ARR(bx + bw - 20, yl + 9, bx + 20, yl + 9, c=GRN, lw=1.6, head=6, dash="5 3"))
            o.append(T(bx + bw / 2, yl + 28, "戻る電流は線の真下（輪が小さい）", "middle", 9.5, GRN, True, halo=True))
        else:
            sx, sw = bx + 150, 16
            o.append(RECT(sx, y0 + 22, sw, bh - 22, 0, SCR, ALI, 1.2))
            path = [(bx + bw - 20, yl + 9), (sx + sw + 6, yl + 9), (sx + sw + 6, y0 + bh - 3), (sx - 6, y0 + bh - 3), (sx - 6, yl + 9), (bx + 20, yl + 9)]
            o.append(PL([(sx - 6, yl + 1), (sx + sw + 6, yl + 1), (sx + sw + 6, y0 + bh - 3), (sx - 6, y0 + bh - 3)], c="none", lw=0, fill=ASOFT, op=0.9))
            o.append(PL(path[:-1], c=ALI, lw=1.6, dash="5 3"))
            o.append(ARR(path[-2][0], path[-2][1], path[-1][0], path[-1][1], c=ALI, lw=1.6, head=6, dash="5 3"))
            o.append(T(sx + sw + 12, y0 + 82, "回り道（輪が大きい）", "start", 9.5, ALI, True, halo=True))
            o.append(T(sx - 10, y0 + 32, "切れ目", "end", 9.5, ALI, True, halo=True))
        o.append(T(bx + 14, yl - 8, "行きの電流（線）", "start", 9.5, SIG, True, halo=True))
    return SVG(700, 280, o, "戻る電流（例の基板の 50 Ω のマイクロストリップ線路。(a) は地板の上の電流の密度を、数値の計算と細い線の式で比べた）。")


F["e11_return"] = _f11_return_fig()


# =====================================================================
# 3 節: ビアの柵と、ビアのインダクタンスのインピーダンス
# =====================================================================
def _f11_via_fig():
    o = []
    np = _f11_np
    o.append(T(14, 18, "(a) コプレーナ線路とビアの柵（上から見た図）", "start", 11.5, INK, True))
    bx, by, bw, bh = 24, 34, 330, 150
    o.append(RECT(bx, by, bw, bh, 3, MSOFT, MUT, 1.0))
    yl = by + 66
    o.append(RECT(bx, yl - 14, bw - 72, 28, 0, GOSOFT, "none", 0))
    o.append(RECT(bx, yl - 4, bw - 72, 8, 0, SIG, SIG, 0))
    pitch = 26
    for k in range(10):
        x = bx + 14 + k * pitch
        if x > bx + bw - 80:
            break
        _f11_via(o, x, yl - 24); _f11_via(o, x, yl + 24)
    o.append(DIM(bx + 14, yl - 40, bx + 14 + pitch, yl - 40, None, c=INK))
    o.append(T(bx + 14 + pitch / 2, yl - 46, "間隔", "middle", 9.5, INK, True))
    # 部品（LNA）と GND の端子のビア
    lx = bx + bw - 50
    _f11_part(o, lx, yl, 30, 30, c=INK, lab="LNA", sz=9.5)
    o.append(RECT(bx + bw - 72, yl - 4, 7, 8, 0, SIG, SIG, 0))
    for dy in (-11, 11):
        o.append(RECT(lx - 6 + 0, yl + (19 if dy > 0 else -27), 12, 8, 1, MSOFT, MUT, 1.0))
        _f11_via(o, lx, yl + (35 if dy > 0 else -35), r=2.0)
    o.append(T(lx, by + bh - 8, "GND の端子のそばにビア", "middle", 9, INK, True, halo=True))
    o.append(T(bx + 8, by + bh - 26, "線の両側の銅（灰色）を、", "start", 9.5, INK, False, halo=True))
    o.append(T(bx + 8, by + bh - 12, "ビアで 2 層目の面につなぐ", "start", 9.5, INK, False, halo=True))
    lam = _F11_L0 / _f11_m.sqrt(_F11_ER)
    lam24 = _F11_C / 2.45e9 * 1e3 / _f11_m.sqrt(_F11_ER)
    o.append(T(bx, by + bh + 20, "間隔の目安: 誘電体の中の波長の 1/10〜1/20 以下", "start", 10, INK, True))
    o.append(T(bx, by + bh + 36, "L1: 波長 %.1f mm → 1/20 で %.1f mm" % (lam, lam / 20), "start", 9.5, GLD, True))
    o.append(T(bx, by + bh + 51, "2.45 GHz の無線も持つ機器: 波長 %.1f mm → 1/20 で %.1f mm" % (lam24, lam24 / 20), "start", 9.5, GLD, True))
    # (b) インダクタンスのインピーダンス
    xb = 400
    o.append(T(xb, 18, "(b) インダクタンス L_v のインピーダンス", "start", 11.5, INK, True))
    p = Plot(xb + 48, 40, 180, 170, (0.1, 3.0), (0.03, 60), xlog=True, ylog=True)
    o.append(p.axes(xl="周波数 f [GHz]", yl="2πfL_v [Ω]", xt=[0.1, 0.3, 1, 3], yt=[0.1, 1, 10, 50], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(W(p.X(_F11_F1 / 1e9), p.y, p.X(_F11_F1 / 1e9), p.y + p.h, c=SIG, lw=1.2, dash="4 3"))
    o.append(T(p.X(_F11_F1 / 1e9) - 4, p.y + 12, "L1", "end", 9.5, SIG, True, halo=True))
    o.append(W(p.x, p.Y(50), p.x + p.w, p.Y(50), c=MUT, lw=1.0, dash="3 3"))
    o.append(T(p.x + 4, p.Y(50) + 13, "50 Ω", "start", 9, MUT, False, halo=True))
    fs = np.logspace(-1, np.log10(3.0), 80)
    for L, c, lab in ((1.3, ALI, "1.3 nH"), (0.5, GLD, "0.5 nH"), (0.1, GRN, "0.1 nH")):
        o.append(p.line([(f, 2 * _f11_m.pi * f * 1e9 * L * 1e-9) for f in fs], c=c, lw=2.0))
        zl1 = 2 * _f11_m.pi * _F11_F1 * L * 1e-9
        o.append(D(p.X(_F11_F1 / 1e9), p.Y(zl1), c, 3.8))
        o.append(T(p.X(_F11_F1 / 1e9) + 6, p.Y(zl1) + 4, "%s: %.1f Ω" % (lab, zl1), "start", 9.5, c, True, halo=True))
    o.append(T(xb, 262, "1.3 nH: 板厚 1.6 mm・穴の径 0.3 mm のビア", "start", 9.5, ALI))
    o.append(T(xb, 277, "（基板アートワークシリーズ 12 章 2 節の式）", "start", 9.5, MUT))
    return SVG(700, 290, o, "ビアの柵（(a)。間隔の目安は比誘電率 4.4 の中の波長から）と、ビアのインダクタンスのインピーダンス（(b)）。")


F["e11_via"] = _f11_via_fig()


# =====================================================================
# 4 節: RF の線の長さと C/N0 の減り（9 章の例の段）
# =====================================================================
_F11_K, _F11_T0, _F11_CDBM, _F11_TA = 1.380649e-23, 290.0, -128.5, 100.0
_F11_ST = [("LNA", 18.0, 1.0), ("フィルタ", -1.5, 1.5), ("チップの増幅 1", 20.0, 3.0), ("チップの増幅 2", 68.5, 3.0)]


def _f11_cn0(st, tant=_F11_TA):
    g, tot = 1.0, 0.0
    for n, G, NF in st:
        tot += (10 ** (NF / 10) - 1) * _F11_T0 / g
        g *= 10 ** (G / 10)
    return _F11_CDBM - (10 * _f11_m.log10(_F11_K * (tant + tot)) + 30)


def _f11_drop(loss_db, before=True):
    base = _f11_cn0(_F11_ST)
    st = ([("線", -loss_db, loss_db)] + _F11_ST) if before else (_F11_ST[:1] + [("線", -loss_db, loss_db)] + _F11_ST[1:])
    return base - _f11_cn0(st)


def _f11_cn0len_fig():
    o = []
    np = _f11_np
    p = Plot(78, 30, 360, 230, (0, 10), (0, 1.5))
    o.append(p.axes(xl="RF の線の長さ [cm]", yl="C/N_0 の減り [dB]", xt=[0, 2, 4, 6, 8, 10], yt=[0, 0.5, 1.0, 1.5], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    ls = np.linspace(0, 10, 101)
    o.append(p.line([(l, _f11_drop(l * _F11_LOSS, True)) for l in ls], c=ALI, lw=2.4))
    o.append(p.line([(l, _f11_drop(l * _F11_LOSS, False)) for l in ls], c=GRN, lw=2.4))
    l5 = 0.5 / _F11_LOSS
    d5 = _f11_drop(0.5, True); a5 = _f11_drop(0.5, False)
    o.append(W(p.X(l5), p.Y(0), p.X(l5), p.Y(d5), c=MUT, lw=0.8, dash="2 3"))
    o.append(D(p.X(l5), p.Y(d5), ALI, 4.4)); o.append(D(p.X(l5), p.Y(a5), GRN, 4.4))
    o.append(T(p.X(l5) - 6, p.Y(d5) - 8, "損失 0.5 dB（%.1f cm）: %.2f dB" % (l5, d5), "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(l5) + 6, p.Y(a5) - 8, "%.2f dB" % a5, "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(9.8), p.Y(_f11_drop(9.8 * _F11_LOSS, True)) - 10, "LNA の前", "end", 10, ALI, True, halo=True))
    o.append(T(p.X(9.8), p.Y(_f11_drop(9.8 * _F11_LOSS, False)) - 8, "LNA の後", "end", 10, GRN, True, halo=True))
    # 右: 2 つの並び
    xr = 470
    def chain(y, before, c, title):
        o.append(T(xr, y - 22, title, "start", 10, c, True))
        x = xr
        items = [("アンテナ", 52, MUT), ("線", 0, c), ("LNA", 34, INK), ("…", 0, MUT)] if before else [("アンテナ", 52, MUT), ("LNA", 34, INK), ("線", 0, c), ("…", 0, MUT)]
        for nm, wd, cc in items:
            if nm == "線":
                o.append(W(x, y, x + 46, y, c=c, lw=3)); o.append(T(x + 23, y - 6, "線", "middle", 9.5, c, True, halo=True)); x += 46
            elif nm == "…":
                o.append(W(x, y, x + 16, y, c=MUT, lw=1.4)); o.append(T(x + 20, y + 4, "モジュール", "start", 9.5, MUT)); x += 16
            else:
                o.append(RECT(x, y - 11, wd, 22, 4, PAN, cc, 1.2)); o.append(T(x + wd / 2, y + 4, nm, "middle", 9.5, cc, True)); x += wd
                o.append(W(x, y, x + 8, y, c=MUT, lw=1.4)); x += 8
    chain(80, True, ALI, "LNA の前の線（損失がそのまま効く）")
    chain(150, False, GRN, "LNA の後の線（LNA の利得で割られる）")
    o.append(T(xr, 204, "線の損失 0.07 dB/cm（例の値）", "start", 9.5, MUT))
    o.append(T(xr, 219, "アンテナの雑音温度 100 K、後の段は", "start", 9.5, MUT))
    o.append(T(xr, 234, "9 章 1 節の例（47.5 dB-Hz）", "start", 9.5, MUT))
    return SVG(700, 300, o, "RF の線の長さと C/N0 の減り（線の損失 0.07 dB/cm、アンテナの雑音温度 100 K、LNA から後は 9 章 1 節の例の段）。")


F["e11_cn0len"] = _f11_cn0len_fig()


# =====================================================================
# 4 節: 部品の置き方の良い例と悪い例（上から見た図）
# =====================================================================
def _f11_trace(o, pts, c=SIG, lw=3.2):
    """1 層目の線（周りに誘電体の見える隙間を付ける）。"""
    o.append(PL(pts, c=GOSOFT, lw=lw + 5))
    o.append(PL(pts, c=c, lw=lw))


def _f11_conn(o, x, y):
    """アンテナのコネクタ（真ん中の信号のパッドと 4 つの GND のパッド）。"""
    for dx, dy in ((-9, -9), (9, -9), (-9, 9), (9, 9)):
        o.append(RECT(x + dx - 4, y + dy - 4, 8, 8, 1, MSOFT, MUT, 1.0))
    o.append(CIRC(x, y, 4.5, c=SIG, lw=1.2, fill=SSOFT))


def _f11_r0402(o, x, y, vert=False, c=INK):
    """0402 の部品（整合の部品など）。"""
    if vert:
        o.append(RECT(x - 3, y - 6, 6, 12, 1, PAN, c, 1.1))
    else:
        o.append(RECT(x - 6, y - 3, 12, 6, 1, PAN, c, 1.1))


def _f11_place_fig():
    o = []
    for k, (title, c) in enumerate((("(a) 良い例", GRN), ("(b) 悪い例", ALI))):
        x0 = 10 + k * 346
        o.append(T(x0 + 4, 18, title, "start", 11.5, c, True))
        o.append(RECT(x0, 28, 334, 214, 4, MSOFT, MUT, 1.0))
    # ---- (a) 良い例 ----
    x0, yl = 10, 106
    _f11_conn(o, x0 + 26, yl)
    _f11_trace(o, [(x0 + 30, yl), (x0 + 96, yl)])
    _f11_r0402(o, x0 + 74, yl)                         # 直列の整合の部品
    _f11_trace(o, [(x0 + 62, yl), (x0 + 62, yl + 14)], lw=2.0)
    _f11_r0402(o, x0 + 62, yl + 16, vert=True)        # 並列の整合の部品
    _f11_via(o, x0 + 62, yl + 30, r=2.0)
    lx = x0 + 112
    _f11_part(o, lx, yl, 30, 30, c=INK, lab="LNA", sz=9.5)
    for dy in (-1, 1):
        o.append(RECT(lx - 5, yl + dy * 15 - (0 if dy > 0 else 6), 10, 6, 1, MSOFT, MUT, 1.0))
        _f11_via(o, lx - 8, yl + dy * 24, r=2.0); _f11_via(o, lx + 8, yl + dy * 24, r=2.0)
    _f11_trace(o, [(lx + 15, yl), (x0 + 186, yl)])
    _f11_part(o, x0 + 200, yl, 26, 20, c=INK, lab="SAW", sz=9)
    for dy in (-1, 1):
        _f11_via(o, x0 + 200, yl + dy * 18, r=2.0)
    _f11_trace(o, [(x0 + 213, yl), (x0 + 270, yl)])
    o.append(RECT(x0 + 270, yl - 46, 58, 92, 3, PAN, INK, 1.4))
    o.append(T(x0 + 299, yl + 30, "モジュール", "middle", 9, INK, True))
    o.append(RECT(x0 + 270, yl - 4, 8, 8, 1, SSOFT, SIG, 1.0))
    for dy in (-14, 14):
        o.append(RECT(x0 + 270, yl + dy - 4, 8, 8, 1, MSOFT, MUT, 1.0))
        _f11_via(o, x0 + 262, yl + dy, r=1.8)
    for xx in range(int(x0 + 40), int(x0 + 262), 22):
        if abs(xx - lx) < 24 or abs(xx - (x0 + 200)) < 18 or abs(xx - (x0 + 62)) < 9:
            continue
        _f11_via(o, xx, yl - 13, r=1.6); _f11_via(o, xx, yl + 13, r=1.6)
    gn = [("LNA の前の線は 4 mm（0.03 dB）", x0 + 8, 50), ("整合の部品は LNA の入力の端子のそば", x0 + 8, 64),
          ("入力と出力は LNA の反対の側。一直線に並べる", x0 + 8, 166), ("GND の端子のそばにビア。線の両側にビアの柵", x0 + 8, 180),
          ("モジュールの RF の端子へ 50 Ω の線をまっすぐ", x0 + 8, 194)]
    for txt, x, y in gn:
        o.append(T(x, y + 14 if y > 100 else y, txt, "start", 9.5, GRN, True, halo=True))
    o.append(T(x0 + 26, yl + 26, "アンテナ", "middle", 9, SIG, True, halo=True))
    # ---- (b) 悪い例 ----
    x0 = 356
    _f11_conn(o, x0 + 26, yl)
    _f11_r0402(o, x0 + 52, yl)                         # 整合の部品がコネクタのそば（LNA の入力から遠い）
    mp = [(x0 + 30, yl), (x0 + 150, yl), (x0 + 150, yl + 44), (x0 + 70, yl + 44), (x0 + 70, yl + 76), (x0 + 214, yl + 76), (x0 + 214, yl + 52), (x0 + 234, yl + 52)]
    _f11_trace(o, mp)
    _f11_r0402(o, x0 + 52, yl)
    lx, ly = x0 + 250, yl + 52
    _f11_part(o, lx, ly, 30, 30, c=INK, lab="LNA", sz=9.5)
    # 出力が戻って、入力の線と平行に走る
    _f11_trace(o, [(lx + 15, ly), (x0 + 300, ly), (x0 + 300, yl - 14), (x0 + 90, yl - 14), (x0 + 90, yl - 34)], c=ALI)
    _f11_part(o, x0 + 90, yl - 46, 26, 20, c=INK, lab="SAW", sz=9)
    o.append(RECT(x0 + 82, yl - 22, 70, 30, 6, "none", ALI, 1.4, dash="4 3"))
    o.append(T(x0 + 160, yl - 26, "出力の線と入力の線が平行（回り込み）", "start", 9.5, ALI, True, halo=True))
    # GND の端子から遠いビア
    o.append(PL([(lx, ly + 15), (lx, ly + 24), (lx + 60, ly + 24), (lx + 60, ly + 48)], c=MUT, lw=1.2))
    _f11_via(o, lx + 60, ly + 52, r=2.0)
    bd = [("LNA の前の線が 40 mm（%.2f dB → C/N0 −%.2f dB）" % (4 * _F11_LOSS, _f11_drop(4 * _F11_LOSS)), x0 + 8, 206),
          ("整合の部品が LNA の入力の端子から遠い", x0 + 8, 221)]
    for txt, x, y in bd:
        o.append(T(x, y, txt, "start", 9.5, ALI, True, halo=True))
    o.append(T(x0 + 8, 236, "LNA の GND の端子からビアまで遠い", "start", 9.5, ALI, True, halo=True))
    o.append(T(x0 + 26, yl + 26, "アンテナ", "middle", 9, SIG, True, halo=True))
    return SVG(700, 252, o, "RF の部品の置き方の良い例と悪い例（上から見た図。灰色は 1 層目のグラウンドの銅、寸法は例）。")


F["e11_place"] = _f11_place_fig()


# =====================================================================
# 5 節: 区分け（基板の配置の例）
# =====================================================================
def _f11_zone_fig():
    o = []
    for k, (title, c) in enumerate((("(a) 良い例: 置き場所で分ける", GRN), ("(b) 悪い例", ALI))):
        x0 = 10 + k * 346
        o.append(T(x0 + 4, 18, title, "start", 11.5, c, True))
        o.append(RECT(x0, 28, 334, 222, 6, PAN, MUT, 1.4))
    # ---- (a) ----
    x0, y0 = 10, 28
    zones = [(x0 + 8, y0 + 8, 150, 112, SIG, "RF の区画"), (x0 + 166, y0 + 8, 160, 206, PUR, "ディジタルの区画"), (x0 + 8, y0 + 128, 150, 86, ALI, "電源の区画")]
    for zx, zy, zw, zh, c, nm in zones:
        o.append(RECT(zx, zy, zw, zh, 5, soft(c), c, 1.2, dash="5 3"))
        o.append(T(zx + 6, zy + 14, nm, "start", 9.5, c, True))
    # RF: アンテナ（角）・LNA・SAW・モジュールの RF の端子
    o.append(RECT(x0 + 14, y0 + 26, 20, 10, 1.5, ASOFT, ALI, 1.1)); o.append(T(x0 + 38, y0 + 35, "アンテナ", "start", 9, ALI, True))
    _f11_trace(o, [(x0 + 24, y0 + 36), (x0 + 24, y0 + 62), (x0 + 110, y0 + 62)], lw=2.4)
    _f11_part(o, x0 + 56, y0 + 62, 16, 16, c=INK, lab="", sz=8); o.append(T(x0 + 56, y0 + 84, "LNA", "middle", 9, INK, True))
    _f11_part(o, x0 + 88, y0 + 62, 14, 12, c=INK, lab="", sz=8); o.append(T(x0 + 88, y0 + 84, "SAW", "middle", 9, INK, True))
    o.append(RECT(x0 + 112, y0 + 40, 54, 54, 3, PAN, INK, 1.3)); o.append(T(x0 + 139, y0 + 70, "モジュール", "middle", 9, INK, True))
    o.append(T(x0 + 14, y0 + 106, "RF の線は短く区画の中", "start", 9, SIG))
    # ディジタル
    _f11_part(o, x0 + 240, y0 + 80, 44, 44, c=PUR, lab="MCU", sz=9.5)
    _f11_part(o, x0 + 300, y0 + 80, 26, 30, c=PUR, lab="", sz=9); o.append(T(x0 + 300, y0 + 116, "メモリ", "middle", 9, PUR, True))
    o.append(RECT(x0 + 312, y0 + 160, 18, 30, 2, PSOFT, PUR, 1.1)); o.append(T(x0 + 308, y0 + 200, "USB", "end", 9, PUR, True))
    o.append(PL([(x0 + 166, y0 + 60), (x0 + 218, y0 + 60), (x0 + 218, y0 + 70)], c=PUR, lw=1.4))
    o.append(T(x0 + 192, y0 + 54, "UART", "middle", 8.5, PUR, True, halo=True))
    o.append(PL([(x0 + 262, y0 + 92), (x0 + 290, y0 + 92), (x0 + 290, y0 + 168), (x0 + 312, y0 + 168)], c=PUR, lw=1.4))
    o.append(D(x0 + 200, y0 + 150, PUR, 0)); o.append(RECT(x0 + 196, y0 + 140, 16, 10, 2, PSOFT, PUR, 1.0)); o.append(T(x0 + 220, y0 + 149, "クロック", "start", 9, PUR, True))
    # 電源
    _f11_part(o, x0 + 40, y0 + 170, 22, 22, c=ALI, lab="", sz=9); o.append(T(x0 + 40, y0 + 196, "DC-DC", "middle", 9, ALI, True))
    o.append(CIRC(x0 + 80, y0 + 170, 11, c=ALI, lw=1.3, fill=ASOFT)); o.append(T(x0 + 80, y0 + 196, "コイル", "middle", 9, ALI, True))
    o.append(PL([(x0 + 92, y0 + 170), (x0 + 139, y0 + 170), (x0 + 139, y0 + 94)], c=ALI, lw=1.6))
    o.append(RECT(x0 + 130, y0 + 120, 18, 10, 2, GSOFT, GRN, 1.0))
    o.append(T(x0 + 150, y0 + 140, "フィルタ", "start", 9, GRN, True, halo=True))
    o.append(T(x0 + 8, 266, "2 層目のグラウンドの面は 1 枚のまま。区画をまたぐ線は決めた所を通す", "start", 9.5, GRN, True))
    # ---- (b) ----
    x0 = 356
    o.append(RECT(x0 + 14, y0 + 26, 20, 10, 1.5, ASOFT, ALI, 1.1)); o.append(T(x0 + 38, y0 + 35, "アンテナ", "start", 9, ALI, True))
    # モジュールの RF の端子がアンテナと反対の側 → 長い RF の線
    o.append(RECT(x0 + 236, y0 + 30, 56, 56, 3, PAN, INK, 1.3)); o.append(T(x0 + 264, y0 + 62, "モジュール", "middle", 9, INK, True))
    _f11_trace(o, [(x0 + 24, y0 + 36), (x0 + 24, y0 + 110), (x0 + 264, y0 + 110), (x0 + 264, y0 + 86)], lw=2.4)
    _f11_part(o, x0 + 60, y0 + 110, 16, 16, c=INK, lab="", sz=8); o.append(T(x0 + 60, y0 + 132, "LNA", "middle", 9, INK, True))
    # DC-DC が LNA のそば
    _f11_part(o, x0 + 66, y0 + 70, 22, 22, c=ALI, lab="", sz=9); o.append(CIRC(x0 + 100, y0 + 70, 11, c=ALI, lw=1.3, fill=ASOFT))
    o.append(T(x0 + 118, y0 + 66, "DC-DC とコイルが", "start", 9, ALI, True, halo=True)); o.append(T(x0 + 118, y0 + 79, "LNA のそば", "start", 9, ALI, True, halo=True))
    # USB の線が RF の線に沿って走る
    o.append(PL([(x0 + 324, y0 + 122), (x0 + 150, y0 + 122), (x0 + 150, y0 + 190)], c=PUR, lw=1.4))
    o.append(PL([(x0 + 324, y0 + 126), (x0 + 154, y0 + 126), (x0 + 154, y0 + 190)], c=PUR, lw=1.4))
    o.append(T(x0 + 170, y0 + 142, "USB の線が RF に沿う", "start", 9, PUR, True, halo=True))
    o.append(RECT(x0 + 40, y0 + 160, 16, 10, 2, PSOFT, PUR, 1.0)); o.append(T(x0 + 62, y0 + 169, "クロックがアンテナの近く", "start", 9, PUR, True))
    # グラウンドの面の切れ目
    o.append(W(x0 + 226, y0 + 4, x0 + 226, y0 + 218, c=ALI, lw=1.8, dash="6 4"))
    o.append(T(x0 + 222, y0 + 204, "面の切れ目をまたぐ", "end", 9, ALI, True, halo=True))
    o.append(T(x0 + 8, 266, "RF の線が長く、雑音の源と区画が重なっている", "start", 9.5, ALI, True))
    return SVG(700, 276, o, "区分けの良い例と悪い例（上から見た基板の配置の例。大きさは 80 × 55 mm 程度）。")


F["e11_zone"] = _f11_zone_fig()


# =====================================================================
# 5 節: 線どうしの結合の目安（例のモデル）と、層で分けたとき
# =====================================================================
def _f11_couple_fig():
    o = []
    np = _f11_np
    o.append(T(14, 18, "(a) 平行に走る線どうしの結合（例のモデル）", "start", 11.5, INK, True))
    p = Plot(78, 36, 290, 200, (0, 5), (-70, 0))
    o.append(p.axes(xl="線の間の距離 d [mm]（中心の間）", yl="平行な 1 mm あたりの結合 [dB]", xt=[0, 1, 2, 3, 4, 5], yt=[-70, -60, -50, -40, -30, -20, -10, 0],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%d" % v).replace("-", "−")))
    ds = np.linspace(0.0, 5, 200)
    for hh, c, lab in ((0.2, SIG, "h = 0.2 mm（例の 4 層の基板）"), (1.6, ALI, "h = 1.6 mm（2 層の基板）")):
        o.append(p.clip([(d, 20 * _f11_m.log10(1 / (1 + (d / hh) ** 2))) for d in ds], c=c, lw=2.2))
    for d in (1.0, 2.0, 5.0):
        v = 20 * _f11_m.log10(1 / (1 + (d / 0.2) ** 2))
        o.append(D(p.X(d), p.Y(v), SIG, 3.8))
        o.append(T(p.X(d) + 5, p.Y(v) - 6, "%s dB" % _f11_f(v, 0), "start", 9.5, SIG, True, halo=True))
    v2 = 20 * _f11_m.log10(1 / (1 + (2.0 / 1.6) ** 2))
    o.append(D(p.X(2.0), p.Y(v2), ALI, 3.8))
    o.append(T(p.X(2.0) + 5, p.Y(v2) - 6, "%s dB" % _f11_f(v2, 0), "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(80, 278, [(SIG, None, "h = 0.2 mm（例の 4 層の基板）")], 9.5, 16))
    o.append(LEGL(80, 293, [(ALI, None, "h = 1.6 mm（2 層の基板）")], 9.5, 16))
    o.append(TX(80, 310, "結合 ∝ 1/{1 + (d/h)^2}（平行な長さに比例）。値は目安", "start", 9.5, MUT))
    # (b) 層で分ける（断面）
    xb = 420
    o.append(T(xb, 18, "(b) グラウンドの面を挟んで層を分ける", "start", 11.5, INK, True))
    lx0, lx1 = xb + 52, 692
    ys = {"L1": 70, "L2": 98, "L3": 210, "L4": 238}
    o.append(RECT(lx0, ys["L1"], lx1 - lx0, ys["L4"] - ys["L1"], 0, GOSOFT, "none", 0))
    o.append(RECT(lx0, ys["L2"], lx1 - lx0, 6, 0, MSOFT, MUT, 1.0))
    o.append(RECT(lx0, ys["L3"] - 6, lx1 - lx0, 6, 0, MSOFT, MUT, 1.0))
    o.append(T(lx0 - 4, ys["L2"] + 6, "L2 GND", "end", 9, MUT, True))
    o.append(T(lx0 - 4, ys["L3"], "L3 電源", "end", 9, MUT, True))
    o.append(T(lx0 - 4, ys["L1"] + 2, "L1", "end", 9, INK, True))
    o.append(T(lx0 - 4, ys["L4"] + 4, "L4", "end", 9, INK, True))
    # L1: RF の線とクロックの線
    rx, cxl = xb + 96, xb + 196
    o.append(RECT(rx - 12, ys["L1"] - 5, 24, 5, 0, SIG, SIG, 0))
    o.append(RECT(cxl - 10, ys["L1"] - 5, 20, 5, 0, ALI, ALI, 0))
    o.append(T(rx, ys["L1"] - 12, "RF の線", "middle", 9.5, SIG, True, halo=True))
    o.append(T(cxl, ys["L1"] - 12, "クロックの線（L1）", "middle", 9.5, ALI, True, halo=True))
    o.append(CARR(cxl - 10, ys["L1"] - 6, rx + 14, ys["L1"] - 6, bend=0.25, c=ALI, lw=1.3, head=5))
    o.append(T((rx + cxl) / 2, ys["L1"] - 36, "結合する", "middle", 9, ALI, True, halo=True))
    for dx in (-8, 0, 8):
        o.append(ARR(rx + dx, ys["L1"] + 1, rx + dx, ys["L2"] - 1, c=PUR, lw=1.1, head=4))
    # L4: 速い線（電界は L3 の面との間）
    ux = xb + 150
    o.append(RECT(ux - 10, ys["L4"], 20, 5, 0, ALI, ALI, 0))
    for dx in (-6, 0, 6):
        o.append(ARR(ux + dx, ys["L4"] - 1, ux + dx, ys["L3"] + 1, c=PUR, lw=1.1, head=4))
    o.append(T(ux + 16, ys["L4"] + 18, "USB の線（L4）", "start", 9.5, ALI, True))
    o.append(T((lx0 + lx1) / 2, (ys["L2"] + ys["L3"]) / 2 - 8, "電界と磁界は面で止まる", "middle", 9.5, GRN, True, halo=True))
    o.append(T((lx0 + lx1) / 2, (ys["L2"] + ys["L3"]) / 2 + 8, "（銅 35 μm は表皮の深さ 1.7 μm の約 20 倍）", "middle", 9, GRN, False, halo=True))
    o.append(T(xb, 268, "漏れるのは面の穴・切れ目・縁から", "start", 9.5, INK))
    o.append(T(xb, 283, "（L3 の電源の面も、コンデンサで GND と", "start", 9.5, MUT))
    o.append(T(xb, 298, "つながり、L4 の線の戻る電流の道になる）", "start", 9.5, MUT))
    return SVG(700, 318, o, "線どうしの結合の目安（(a)。平行な部分の単位長さあたりの結合を、距離 d で 1/{1 + (d/h)²} とした例のモデル）と、層を分けたときの断面（(b)。厚さは模式）。")


F["e11_couple"] = _f11_couple_fig()


# =====================================================================
# 6 節: 基板の上のアンテナ（チップアンテナのキープアウト、パッチアンテナの地板と給電）
# =====================================================================
def _f11_pi(o, x, y, c=INK):
    """π 形の整合の回路の 3 つの場所（並列・直列・並列）。(x, y) は直列の部品の中心。"""
    _f11_r0402(o, x, y, c=c)
    _f11_r0402(o, x - 14, y + 13, vert=True, c=c)
    _f11_r0402(o, x + 14, y + 13, vert=True, c=c)
    _f11_via(o, x - 14, y + 26, r=1.6); _f11_via(o, x + 14, y + 26, r=1.6)


def _f11_chipboard(o, x0, y0, good=True):
    bw, bh = 300, 150
    o.append(RECT(x0, y0, bw, bh, 4, GOSOFT, GLD, 1.2))
    kx, ky, kw, kh = x0, y0, 92, 58          # キープアウト（左上の角）
    gnd = [(x0 + (kw if good else 0), y0), (x0 + bw, y0), (x0 + bw, y0 + bh), (x0, y0 + bh), (x0, y0 + (kh if good else 0))]
    if good:
        gnd = [(x0 + kw, y0), (x0 + bw, y0), (x0 + bw, y0 + bh), (x0, y0 + bh), (x0, y0 + kh), (x0 + kw, y0 + kh)]
    o.append(PL(gnd + [gnd[0]], c=MUT, lw=1.0, fill=MSOFT))
    if good:
        o.append(RECT(kx + 1, ky + 1, kw - 2, kh - 2, 3, "none", ALI, 1.2, dash="5 3"))
        o.append(T(kx + kw + 6, ky + 14, "← キープアウト", "start", 9.5, ALI, True, halo=True))
        o.append(T(kx + kw + 6, ky + 28, "（どの層にも銅を置かない）", "start", 9, ALI, False, halo=True))
    o.append(RECT(kx + 22, ky + 14, 36, 14, 2, ASOFT, ALI, 1.2))
    o.append(T(kx + 40, ky + 24, "チップ", "middle", 8.5, ALI, True))
    # 給電の線と整合の回路（グラウンドの縁）
    fx = kx + 40
    _f11_trace(o, [(fx, ky + 28), (fx, ky + kh + 26), (x0 + 190, ky + kh + 26)], lw=2.4)
    _f11_pi(o, fx + 26, ky + kh + 26)
    _f11_part(o, x0 + 206, ky + kh + 26, 24, 24, c=INK, lab="LNA", sz=8.5)
    for xx in range(int(fx + 50), int(x0 + 186), 18):
        _f11_via(o, xx, ky + kh + 14, r=1.4); _f11_via(o, xx, ky + kh + 38, r=1.4)
    if not good:
        # キープアウトに銅・部品・電池
        o.append(RECT(kx + 66, ky + 8, 20, 12, 1.5, PAN, INK, 1.1))
        o.append(RECT(x0 + 110, y0 + 8, 70, 40, 6, PSOFT, PUR, 1.2))
        o.append(T(x0 + 145, y0 + 32, "電池", "middle", 9.5, PUR, True))
        o.append(T(kx + 4, ky + bh - 10, "アンテナの下まで銅（グラウンド）がある", "start", 9.5, ALI, True, halo=True))
        o.append(T(kx + 4, ky + bh - 25, "部品と電池がアンテナのすぐそば", "start", 9.5, ALI, True, halo=True))
    else:
        o.append(T(fx + 26, ky + kh + 56, "整合の回路（π 形）", "middle", 9, INK, True, halo=True))
        o.append(T(x0 + 296, y0 + bh - 10, "グラウンドの面（アンテナの一部として働く）", "end", 9.5, MUT, True, halo=True))
        for (ax, ay, bx2, by2) in ((x0 + 120, y0 + bh - 26, x0 + 270, y0 + bh - 26), (x0 + 284, y0 + bh - 32, x0 + 284, y0 + 18)):
            o.append(ARR(ax, ay, bx2, by2, c=GLD, lw=1.3, head=6, dash="4 3"))
        o.append(T(x0 + 280, y0 + 42, "電流", "end", 9, GLD, True, halo=True))


def _f11_antpcb_fig():
    o = []
    o.append(T(14, 18, "(a) チップアンテナ（良い例）", "start", 11.5, GRN, True))
    _f11_chipboard(o, 14, 30, True)
    o.append(T(370, 18, "(b) チップアンテナ（悪い例）", "start", 11.5, ALI, True))
    _f11_chipboard(o, 370, 30, False)
    # (c) パッチアンテナを基板に載せる（断面）
    yc = 214
    o.append(T(14, yc, "(c) パッチアンテナを基板に載せる（断面）", "start", 11.5, INK, True))
    bx0, bx1, by = 60, 560, yc + 80
    o.append(RECT(bx0, by, bx1 - bx0, 24, 0, GOSOFT, GLD, 1.0))
    fx = 318
    for yy in (by + 4, by + 20):
        o.append(W(bx0, yy, fx - 9, yy, c=MUT, lw=2.6)); o.append(W(fx + 9, yy, bx1, yy, c=MUT, lw=2.6))
    o.append(T(bx1 + 6, by + 8, "グラウンドの面", "start", 9.5, MUT, True))
    o.append(T(bx1 + 6, by + 21, "（= 地板）", "start", 9.5, MUT))
    # パッチ（セラミック）
    px0, px1 = 258, 378
    o.append(RECT(px0, by - 26, px1 - px0, 26, 2, GOSOFT, GLD, 1.3))
    o.append(W(px0 + 10, by - 27, px1 - 10, by - 27, c=SIG, lw=3))
    o.append(T((px0 + px1) / 2, by - 33, "パッチ（セラミックの上）", "middle", 9.5, SIG, True, halo=True))
    o.append(W(fx, by - 27, fx, by + 34, c=ALI, lw=2.2))
    o.append(T(fx + 12, by + 52, "給電のピン: 面の銅を輪の形に除いた穴を通す", "start", 9.5, ALI, True))
    _f11_part(o, fx + 34, by + 34, 30, 12, c=INK, lab="", sz=8)
    o.append(W(fx, by + 34, fx + 19, by + 34, c=SIG, lw=2.2))
    o.append(T(fx + 52, by + 38, "LNA（裏。給電のピンのすぐそば）", "start", 9.5, INK, True))
    # 背の高い部品は縁から離す
    o.append(RECT(120, by - 40, 34, 40, 2, PSOFT, PUR, 1.2))
    o.append(T(137, by - 46, "背の高い部品", "middle", 9.5, PUR, True))
    o.append(DARR(156, by - 18, px0 - 2, by - 18, c=PUR, lw=1.2))
    o.append(T((156 + px0) / 2, by - 24, "離す", "middle", 9.5, PUR, True, halo=True))
    o.append(DIM(bx0, by + 64, bx1, by + 64, None, c=MUT))
    o.append(T((bx0 + bx1) / 2, by + 78, "地板の大きさはデータシートの値（70 mm 角ほどが多い。代表値）", "middle", 9.5, MUT))
    return SVG(700, yc + 168, o, "基板の上のアンテナ（上から見た図と断面。寸法は例。キープアウトと地板の大きさは部品の資料の値にそろえる）。")


F["e11_antpcb"] = _f11_antpcb_fig()


# =====================================================================
# 6 節: 整合の回路の値（直列と並列の 2 つの部品）。スミスチャートの上の道と S11
# =====================================================================
_F11_ZA = complex(30.0, -20.0)          # 例のアンテナのインピーダンス（L1）
_F11_QA = 10.0                           # 例のアンテナのモデル（直列の共振回路）の Q


def _f11_match_vals(za=_F11_ZA, z0=50.0, f=_F11_F1, sign=1):
    R, X = za.real, za.imag
    X1 = sign * _f11_m.sqrt(R * (z0 - R))
    Xs = X1 - X
    B = X1 / (R * z0)
    w = 2 * _f11_m.pi * f
    return Xs, B, Xs / w, B / w        # 直列のリアクタンス、並列のサセプタンス、L [H]、C [F]


def _f11_ant_z(f):
    """例のアンテナ: 直列の共振回路（R = 30 Ω、Q = 10、L1 で 30 − j20 Ω になる共振周波数）。"""
    R, Q = _F11_ZA.real, _F11_QA
    r = (-(-_F11_ZA.imag / (R * Q)) + _f11_m.sqrt((_F11_ZA.imag / (R * Q)) ** 2 + 4)) / 2
    fr = _F11_F1 / r
    return complex(R, R * Q * (f / fr - fr / f))


def _f11_match_fig():
    o = []
    np = _f11_np
    Xs, B, Ls, Cp = _f11_match_vals()
    # (a) 回路
    o.append(T(14, 18, "(a) 整合の回路（π 形の 3 つの場所）", "start", 11.5, INK, True))
    y = 92
    o.append(RECT(24, y - 22, 54, 44, 4, ASOFT, ALI, 1.2))
    o.append(T(51, y - 2, "アンテナ", "middle", 9.5, ALI, True))
    o.append(TX(51, y + 12, "Z_A", "middle", 9.5, ALI, True))
    o.append(W(78, y, 112, y, c=SIG, lw=2))
    # 並列 1（付けない）
    o.append(W(112, y, 112, y + 18, c=MUT, lw=1.2, dash="3 3"))
    o.append(RECT(104, y + 18, 16, 26, 2, "none", MUT, 1.1, dash="3 3"))
    o.append(T(112, y + 58, "付けない", "middle", 9, MUT, True))
    # 直列 L
    o.append(W(112, y, 132, y, c=SIG, lw=2))
    _f11_ind_h(o, 132, 170, y, c=SIG, n=4)
    o.append(T(151, y - 14, "直列 %.1f nH" % (Ls * 1e9), "middle", 9.5, SIG, True, halo=True))
    o.append(W(170, y, 230, y, c=SIG, lw=2))
    # 並列 C
    _f11_cap_v(o, 196, y, y + 44, c=SIG)
    o.append(W(186, y + 44, 206, y + 44, c=MUT, lw=1.4))
    o.append(T(212, y + 30, "並列 %.2f pF" % (Cp * 1e12), "start", 9.5, SIG, True, halo=True))
    o.append(T(230, y - 6, "50 Ω の線へ", "start", 9.5, INK, True))
    o.append(T(24, 172, "アンテナの給電点のすぐそばに置く。", "start", 9.5, INK))
    o.append(T(24, 187, "初めは直列に 0 Ω、並列は付けず、", "start", 9.5, MUT))
    o.append(T(24, 202, "機器に組んで S11 を測ってから決める。", "start", 9.5, MUT))
    # (b) スミスチャートの上の道
    o.append(T(300, 18, "(b) スミスチャートの上の道", "start", 11.5, INK, True))
    cx, cy, R = 400, 136, 96
    g2 = _f11_smith(o, cx, cy, R)
    za = _F11_ZA
    pa = [g2(_f11_gam(complex(za.real, x))) for x in np.linspace(za.imag, za.imag + Xs, 80)]
    o.append(PL(pa, c=SIG, lw=2.2))
    zb = complex(za.real, za.imag + Xs)
    pb = [g2(_f11_gam(1 / (1 / zb + 1j * b))) for b in np.linspace(0, B, 80)]
    o.append(PL(pb, c=GRN, lw=2.2))
    o.append(_head(pb[-6][0], pb[-6][1], pb[-1][0], pb[-1][1], GRN, 7))
    o.append(_head(pa[-6][0], pa[-6][1], pa[-1][0], pa[-1][1], SIG, 7))
    xa, ya = g2(_f11_gam(za)); o.append(D(xa, ya, ALI, 5))
    o.append(T(xa - 8, ya + 16, "アンテナ 30 − j20 Ω", "middle", 9.5, ALI, True, halo=True))
    xb_, yb_ = g2(_f11_gam(zb)); o.append(D(xb_, yb_, SIG, 4))
    o.append(T(xb_ + 4, yb_ - 10, "直列の L の後 30 + j24.5 Ω", "middle", 9.5, SIG, True, halo=True))
    o.append(D(cx, cy, GRN, 4.5))
    o.append(T(cx + 6, cy + 14, "並列の C の後 50 Ω", "start", 9.5, GRN, True, halo=True))
    # (c) S11 の周波数特性
    xp = 528
    o.append(T(xp, 18, "(c) |S11| の周波数特性", "start", 11.5, INK, True))
    p = Plot(xp + 34, 40, 120, 168, (1500, 1650), (-35, 0))
    o.append(p.axes(xl="周波数 [MHz]", yl="|S11| [dB]", xt=[1500, 1575, 1650], yt=[-30, -20, -10, 0], xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%d" % v).replace("-", "−")))
    o.append(W(p.x, p.Y(-10), p.x + p.w, p.Y(-10), c=MUT, lw=0.9, dash="3 3"))
    o.append(W(p.X(_F11_F1 / 1e6), p.y, p.X(_F11_F1 / 1e6), p.y + p.h, c=SIG, lw=1, dash="4 3"))
    fs = np.linspace(1500e6, 1650e6, 300)
    bef, aft = [], []
    for f in fs:
        zaf = _f11_ant_z(f)
        bef.append((f / 1e6, 20 * _f11_m.log10(abs(_f11_gam(zaf)))))
        w = 2 * _f11_m.pi * f
        zin = 1 / (1 / (zaf + 1j * w * Ls) + 1j * w * Cp)
        aft.append((f / 1e6, max(-60, 20 * _f11_m.log10(max(abs(_f11_gam(zin)), 1e-6)))))
    o.append(p.clip(bef, c=ALI, lw=2.2))
    o.append(p.clip(aft, c=GRN, lw=2.2))
    o.append(T(p.x + 4, p.y + 12, "整合の前", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1600), p.Y(-27), "後", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(1575.42), p.y - 4, "L1", "middle", 9.5, SIG, True))
    return SVG(700, 252, o, "整合の回路の値の例（アンテナは L1 で 30 − j20 Ω とした例。(c) のアンテナは、Q = 10 の直列の共振回路のモデル）。")


F["e11_match"] = _f11_match_fig()
