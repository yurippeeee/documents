# -*- coding: utf-8 -*-
# 08 章 アンテナ — 右旋円偏波・パッチ・地板 の図
import numpy as _f08_np

# ---- 例の値（本文と同じ） ----
_F08_C = 299792458.0
_F08_F1 = 1575.42e6                    # L1 [Hz]
_F08_F5 = 1176.45e6                    # L5 [Hz]
_F08_LAM = _F08_C / _F08_F1            # L1 の波長（19.03 cm）
_F08_K = 2 * math.pi / _F08_LAM
_F08_GB = -13.0                        # 例のアンテナの真下の利得（右旋 + 左旋）[dBi]（例の値）
_F08_PB = 0.5                          # 地平線から真下への下がり方の形（例の値）
_F08_Q = 100.0                         # 例のパッチの共振の鋭さ Q（例の値）
_F08_ER = 20.0                         # 例のセラミックの比誘電率（例の値）


def _f08_dB(v):
    return 10 * math.log10(max(v, 1e-30))


def _f08_m(v):
    """目盛の数字（負の符号は −、余分な 0 を付けない）。"""
    if abs(v) < 1e-12:
        return "0"
    return ("%g" % v).replace("-", "−")


def _f08_f(v, d=1):
    return (("%." + str(d) + "f") % v).replace("-", "−")


def _f08_ga3(el):
    """3 章の例のアンテナ（上の半分の右旋の利得 [dBi]。真上 +3、30° で約 −1、5° で −5）。"""
    return 3.0 - 8.0 * ((90.0 - el) / 85.0) ** 2


def _f08_ex(el):
    """例のアンテナの、仰角 el [°]（−90〜90）の右旋と左旋の利得（真数）。
    上の半分: 右旋は 3 章の値。水平の成分が仰角の sin に比例して小さくなるとし（1 節）、左旋はその分（軸比 1/sinθ）。
    下の半分: 合計の利得が地平線の値から真下の _F08_GB へ下がり、真下に近いほど左旋が主になる（例の値）。"""
    s = math.sin(math.radians(abs(el)))
    rho = (1 - s) / (1 + s)
    if el >= 0:
        gr = 10 ** (_f08_ga3(el) / 10)
        return gr, gr * rho ** 2
    g0 = 10 * math.log10(2 * 10 ** (_f08_ga3(0.0) / 10))
    gt = 10 ** ((g0 + (_F08_GB - g0) * s ** _F08_PB) / 10)
    return gt * rho ** 2 / (1 + rho ** 2), gt / (1 + rho ** 2)


def _f08_budget():
    """例のアンテナの電力の行き先（入力の電力に対する割合）: 上の右旋・上の左旋・下・熱。"""
    els = _f08_np.linspace(-90, 90, 3601)
    w = _f08_np.cos(_f08_np.radians(els))
    gr = _f08_np.array([_f08_ex(e)[0] for e in els]); gl = _f08_np.array([_f08_ex(e)[1] for e in els])
    up = els >= 0
    def integ(v):
        return 0.5 * float(_f08_np.trapezoid(v * w, _f08_np.radians(els)))
    a = integ(_f08_np.where(up, gr, 0)); b = integ(_f08_np.where(up, gl, 0)); d = integ(_f08_np.where(up, 0, gr + gl))
    return a, b, d, 1 - a - b - d


def _f08_fres(er, psi):
    """誘電体（比誘電率 er、損失なし）の面での反射係数。psi は面とのなす角 [rad]。返り値 (Γ_H, Γ_V)。"""
    s = math.sin(psi); q = math.sqrt(er - math.cos(psi) ** 2)
    return (s - q) / (s + q), (er * s - q) / (er * s + q)


def _f08_rl(gh, gv):
    """反射波の右旋と左旋の振幅（右旋の電波が入ったとき）: ((Γ_V + Γ_H)/2, (Γ_V − Γ_H)/2)。"""
    return (gv + gh) / 2, (gv - gh) / 2


# ---- 空洞のモデル（無限に大きい地板の上の正方形のパッチ）。方位で平均した右旋・左旋の指向性 ----
_F08_CAV = {}


def _f08_cav(er):
    if er in _F08_CAV:
        return _F08_CAV[er]
    np = _f08_np
    l = _F08_LAM / (2 * math.sqrt(er)); W = l; k = _F08_K
    th = np.linspace(0, math.pi / 2, 181); ph = np.linspace(0, 2 * math.pi, 241)
    TH, PH = np.meshgrid(th, ph, indexing="ij")
    def sinc(u):
        return np.sinc(u / math.pi)
    Sy = sinc(k * W / 2 * np.sin(TH) * np.sin(PH)); AFx = np.cos(k * l / 2 * np.sin(TH) * np.cos(PH))
    Sx = sinc(k * W / 2 * np.sin(TH) * np.cos(PH)); AFy = np.cos(k * l / 2 * np.sin(TH) * np.sin(PH))
    Eth = -np.cos(PH) * Sy * AFx - 1j * (-np.sin(PH) * Sx * AFy)
    Eph = np.cos(TH) * np.sin(PH) * Sy * AFx - 1j * (-np.cos(TH) * np.cos(PH) * Sx * AFy)
    ER = (Eth + 1j * Eph) / math.sqrt(2); EL = (Eth - 1j * Eph) / math.sqrt(2)
    U = np.abs(Eth) ** 2 + np.abs(Eph) ** 2
    P = np.trapezoid(np.trapezoid(U * np.sin(TH), ph, axis=1), th)
    DR = (4 * math.pi * np.abs(ER) ** 2 / P).mean(axis=1); DL = (4 * math.pi * np.abs(EL) ** 2 / P).mean(axis=1)
    el = 90 - np.degrees(th)
    _F08_CAV[er] = (el[::-1], DR[::-1], DL[::-1])
    return _F08_CAV[er]


# ---- 有限の地板: 2 次元のモーメント法（帯の上の磁流の線源 = パッチの縁のスロット。硬い偏波） ----
def _f08_mom(width, xs_list, vt, N=240):
    """幅 width [m] の薄い金属の帯（中心 0）の上面のすぐ上に、磁流の線源を xs_list の位置に置く（同じ位相）。
    vt は地平線（右）から反時計回りの角 [rad]。返り値は遠方の H_z（複素数。単位はそろっていればよい）。
    電流はパルス基底・点整合、電荷はセルの端の線電荷（混合ポテンシャル）。"""
    np = _f08_np
    from scipy.special import hankel2 as _h2
    lam = _F08_LAM; k = _F08_K; f = _F08_F1
    d = lam / 400
    x = np.linspace(-width / 2, width / 2, N + 1); dx = x[1] - x[0]; xc = (x[:-1] + x[1:]) / 2
    eta = 376.73; w = 2 * math.pi * f; eps = 1 / (eta * _F08_C); mu = eta / _F08_C
    g16, w16 = np.polynomial.legendre.leggauss(16)
    def cellint(xo, a, b):
        tq = (a + b) / 2 + (b - a) / 2 * g16
        R = np.abs(xo[:, None] - tq[None, :]); R = np.where(R < 1e-12, 1e-12, R)
        return (_h2(0, k * R) * w16[None, :]).sum(axis=1) * (b - a) / 2
    g40, w40 = np.polynomial.legendre.leggauss(40)
    def cellself(a, b):
        m = (a + b) / 2; tot = 0
        for (p, q) in [(a, m), (m, b)]:
            u = (g40 + 1) / 2
            t = p + (q - p) * u ** 2 if p == m else q - (q - p) * u ** 2
            R = np.abs(m - t); R = np.where(R < 1e-15, 1e-15, R)
            tot += (_h2(0, k * R) * w40 * (q - p) * u).sum()
        return tot
    Ex = np.zeros(N, dtype=complex)
    for xs in xs_list:
        dxs = xc - xs; dy = -d; rho = np.hypot(dxs, dy)
        Ex += (-(w * eps / 4) * (-k * _h2(1, k * rho)) * dy / rho) / (1j * w * eps)
    Z = np.zeros((N, N), dtype=complex)
    for n in range(N):
        col = cellint(xc, x[n], x[n + 1]); col[n] = cellself(x[n], x[n + 1])
        Z[:, n] += -1j * w * (mu / 4j) * col
    xp = xc + dx / 2; xm = xc - dx / 2
    for n in range(N):
        for xe, sg in ((x[n], -1.0), (x[n + 1], 1.0)):
            q = sg / (1j * w)
            php = cellint(xp, xe - dx / 2, xe + dx / 2) / dx / (4j * eps)
            phm = cellint(xm, xe - dx / 2, xe + dx / 2) / dx / (4j * eps)
            Z[:, n] += -(q * (php - phm)) / dx
    J = np.linalg.solve(Z, -Ex)
    pre = math.sqrt(2 / (math.pi * k))
    Hs = np.zeros(len(vt), dtype=complex)
    for xs in xs_list:
        Hs += -(w * eps / 4) * pre * np.exp(1j * k * (xs * np.cos(vt) + d * np.sin(vt)))
    Hj = (k / 4) * pre * np.sin(vt) * (J[None, :] * np.exp(1j * k * xc[None, :] * np.cos(vt)[:, None])).sum(axis=1) * dx
    return Hs + Hj


_F08_GPS = [30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300]   # 地板の一辺 [mm]
_F08_GPC = {}


def _f08_gp(size_mm):
    """一辺 size_mm の地板の、上下の成分の 2 次元の指向性 [dB]（無限の地板の真上を 0 dB）。仰角 −90〜90°、1° ごと。
    size_mm が None なら無限の地板。パッチは例のセラミック（比誘電率 20、一辺 λ/(2√εr)）の 2 つの縁。"""
    if size_mm in _F08_GPC:
        return _F08_GPC[size_mm]
    np = _f08_np
    lp = _F08_LAM / (2 * math.sqrt(_F08_ER)); xs = [-lp / 2, lp / 2]
    vfull = np.radians(np.arange(0.25, 360, 0.5))
    Einf = np.where((vfull > 0) & (vfull < math.pi), 4 * np.cos(_F08_K * lp / 2 * np.cos(vfull)), 0)
    Dinf = np.abs(Einf) ** 2 / np.mean(np.abs(Einf) ** 2); D0 = Dinf[np.argmin(np.abs(vfull - math.pi / 2))]
    if size_mm is None:
        E = Einf
    else:
        E = _f08_mom(size_mm * 1e-3, xs, vfull, N=240 if size_mm <= 190 else 400)
    D = np.abs(E) ** 2 / np.mean(np.abs(E) ** 2)
    els = np.arange(-90, 91, 1.0)
    out = []
    for e in els:
        a = math.radians(e if e >= 0 else 360 + e)
        i = int(np.argmin(np.abs(vfull - a)))
        out.append(10 * math.log10(max(D[i] / D0, 1e-6)))
    _F08_GPC[size_mm] = (els, np.array(out))
    return _F08_GPC[size_mm]


# ---- 描き方の部品 ----
def _f08_polar(cx, cy, R, gmin, gmax, rings, full=True, lab=True, unit="dBi", sz=9.5):
    """仰角の切り口の極座標の地（上が真上、左右が地平線、下が真下）。rings は目盛の値の並び。"""
    o = [CIRC(cx, cy, R, c=MUT, lw=1.2, fill=SCR)]
    for g in rings:
        r = R * (g - gmin) / (gmax - gmin)
        if r > 0.5:
            o.append(CIRC(cx, cy, r, c=FNT, lw=0.9, dash="3 3"))
    for a in range(0, 360, 30):
        if not full and 180 < a < 360:
            continue
        o.append(W(cx, cy, cx + R * math.cos(math.radians(a)), cy - R * math.sin(math.radians(a)), c=GRD, lw=1))
    o.append(W(cx - R - 6, cy, cx + R + 6, cy, c=MUT, lw=1.3))
    if lab:
        for g in rings:
            r = R * (g - gmin) / (gmax - gmin)
            if r > 0.5:
                o.append(T(cx + 3, cy - r + 11, "%s" % _f08_m(g), "start", sz, MUT, False, halo=True))
        o.append(T(cx + 3, cy - R - 4, unit, "start", sz, MUT))
    return "".join(o)


def _f08_ppts(cx, cy, R, gmin, gmax, els, gs, side=1):
    """極座標の点の並び（side=1 で右の半分、−1 で左の半分）。"""
    pts = []
    for e, g in zip(els, gs):
        r = max(0.0, R * (g - gmin) / (gmax - gmin))
        r = min(r, R)
        pts.append((cx + side * r * math.cos(math.radians(e)), cy - r * math.sin(math.radians(e))))
    return pts


def _f08_patchicon(x, y, w=40, c=GLD):
    """横から見たパッチ（地板・誘電体・パッチ）。(x, y) は地板の上面の中心。"""
    return (RECT(x - w / 2, y, w, 4, 1, MSOFT, MUT, 1.0) + RECT(x - w * 0.28, y - 7, w * 0.56, 7, 1, soft(c), c, 1.0)
            + W(x - w * 0.24, y - 7.5, x + w * 0.24, y - 7.5, c=c, lw=2.2))


def _f08_sat(x, y, c=SIG, s=1.0):
    return (RECT(x - 4 * s, y - 4 * s, 8 * s, 8 * s, 1.5, c, c, 1.0)
            + RECT(x - 15 * s, y - 2.6 * s, 9 * s, 5.2 * s, 1, soft(c), c, 1.0)
            + RECT(x + 6 * s, y - 2.6 * s, 9 * s, 5.2 * s, 1, soft(c), c, 1.0))


# =====================================================================
# 1 節: アンテナの位置と役割
# =====================================================================
def _f08_role_fig():
    o = []
    o.append(T(14, 18, "(a) 受信機の中のアンテナ（1 章 6 節・4 章 1 節の図の左端）", "start", 11.5, INK, True))
    y = 34; h = 56
    o.append(_f08_sat(36, y + 22, SIG, 1.0))
    o.append(T(36, y + 46, "衛星の電波", "middle", 9.5, SIG, True))
    o.append(ARR(56, y + 26, 84, y + 26, c=SIG, lw=1.6))
    o.append(RECT(86, y, 150, h, 8, GOSOFT, GLD, 2.0))
    o.append(T(161, y + 20, "アンテナ（この章）", "middle", 11, GLD, True))
    o.append(TX(161, y + 38, "密度 S [W/m²] → 電力 C [W]", "middle", 9.5, INK))
    o.append(ARR(236, y + 26, 262, y + 26, c=SIG, lw=1.6))
    boxes = [(264, 112, "LNA・フィルタ", "9 章"), (394, 140, "RF フロントエンド", "4 章 2・3 節"), (552, 134, "相関器・追尾・位置", "4〜7 章")]
    for i, (x, w, t1, t2) in enumerate(boxes):
        o.append(RECT(x, y, w, h, 8, PAN, SIG, 1.3))
        o.append(T(x + w / 2, y + 22, t1, "middle", 10.5, INK, True))
        o.append(T(x + w / 2, y + 40, t2, "middle", 9.5, MUT))
        if i + 1 < len(boxes):
            o.append(ARR(x + w, y + 26, boxes[i + 1][0], y + 26, c=SIG, lw=1.6))
    o.append(TX(161, y + h + 18, "C = S × A_e、A_e = G_aλ²/(4π)（3 章 1 節）", "middle", 9.5, GLD, True))
    # (b) 空とアンテナ
    yb = 142
    o.append(W(14, yb - 14, 686, yb - 14, c=LIN, lw=0.8))
    o.append(T(14, yb + 4, "(b) GNSS のアンテナに要る性質", "start", 11.5, INK, True))
    cx, cy, R = 200, 318, 150
    o.append(PATH("M%g,%g A%g,%g 0 0 1 %g,%g" % (cx - R, cy, R, R, cx + R, cy), c=SIG, lw=1.0, dash="4 4"))
    o.append(RECT(cx - R - 20, cy, 2 * R + 40, 12, 0, MSOFT, "none", 0))
    o.append(W(cx - R - 20, cy, cx + R + 20, cy, c=MUT, lw=1.6))
    o.append(T(cx + R + 16, cy + 26, "地面（約 290 K）", "end", 9.5, MUT))
    o.append(_f08_patchicon(cx, cy - 12, 44))
    o.append(RECT(cx - 34, cy - 12, 68, 4, 1, MSOFT, MUT, 1.0))
    for el, nm in ((90, "真上"), (30, "30°"), (5, "5°")):
        a = math.radians(el)
        x1, y1 = cx + 0.97 * R * math.cos(a), cy - 0.97 * R * math.sin(a)
        o.append(_f08_sat(x1 + (0 if el == 90 else 6), y1 - (6 if el == 90 else 2), SIG, 0.8))
        o.append(ARR(cx + 0.82 * R * math.cos(a), cy - 0.82 * R * math.sin(a), cx + 26 * math.cos(a), cy - 18 - 22 * math.sin(a), c=SIG, lw=1.6))
    o.append(T(cx + 0.97 * R * math.cos(math.radians(90)) + 16, cy - 0.97 * R + 6, "真上", "start", 9.5, SIG, True))
    o.append(T(cx + 0.97 * R * math.cos(math.radians(30)) - 14, cy - 0.97 * R * math.sin(math.radians(30)) - 12, "仰角 30°", "end", 9.5, SIG, True, halo=True))
    o.append(T(cx + R + 4, cy - 0.97 * R * math.sin(math.radians(5)) - 14, "5°", "end", 9.5, SIG, True, halo=True))
    # 地面の反射
    xr = cx - 108
    o.append(W(cx - R + 6, cy - 50, xr, cy, c=ALI, lw=1.5, dash="5 3"))
    o.append(ARR(xr, cy, cx - 24, cy - 12, c=ALI, lw=1.5))
    o.append(T(cx - R + 4, cy - 58, "反射波", "start", 9.5, ALI, True, halo=True))
    o.append(T(xr - 4, cy + 26, "地面で反射して下から（2 節）", "middle", 9.5, ALI, True))
    # 要件の列
    xl = 400
    items = [(SIG, "① 上の半分の空を広く受ける", "仰角の低い衛星も DOP に要る（7 章 4 節）"),
             (SIG, "② 衛星の電波の偏波を受ける", "電界の向きが回る偏波（2 節）"),
             (ALI, "③ 地平線の近くと下からは弱く", "反射波・地面の雑音（2・4 節）"),
             (GLD, "④ 小さく、機器の中で働く", "寸法・地板・整合（3〜6 節）")]
    for i, (c, t1, t2) in enumerate(items):
        yy = yb + 28 + i * 44
        o.append(RECT(xl, yy, 286, 36, 6, soft(c), c, 1.2))
        o.append(T(xl + 10, yy + 15, t1, "start", 10.5, c, True))
        o.append(T(xl + 10, yy + 30, t2, "start", 9.5, INK))
    return SVG(700, 350, o, "受信機の中のアンテナと、その役割。(a) アンテナは、空から来る電波（1 m² あたりの電力の密度 S）を、端子から取り出せる電力 C に変える。C は S に実効開口面積 A_e を掛けた値である（3 章 1 節）。(b) GNSS のアンテナは、上の半分の空のどの向きの衛星の電波も受け、地面で反射した電波や地面の雑音は弱く受け、しかも機器の中に収まる大きさであることが求められる。")
F["e08_role"] = _f08_role_fig()
