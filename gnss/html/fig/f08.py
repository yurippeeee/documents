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


_F08_GPS = [30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 175, 200]   # 地板の一辺 [mm]（デモの値と同じ）
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


def _f08_arc(cx, cy, r, a0, a1, n=40):
    """中心 (cx, cy)、半径 r の円弧の点（角度は x 軸から反時計回りの度、画面の上が正）。"""
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy - r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


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
    o.append(TX(161, y + h + 18, "C = S × A_e、A_e = G_{a}λ²/(4π)（3 章 1 節）", "middle", 9.5, GLD, True))
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
    return SVG(700, 350, o, "受信機の中のアンテナと、その役割。(a) アンテナは、空から来る電波（1 m² あたりの電力の密度 S）を、端子から取り出せる電力 C に変える。C は S に実効開口面積 A<sub>e</sub> を掛けた値である（3 章 1 節）。(b) GNSS のアンテナは、上の半分の空のどの向きの衛星の電波も受け、地面で反射した電波や地面の雑音は弱く受け、しかも機器の中に収まる大きさであることが求められる。")
F["e08_role"] = _f08_role_fig()


# =====================================================================
# 1 節: 例のアンテナの放射パターンと、電力の行き先
# =====================================================================
def _f08_pattern_fig():
    o = []
    els = _f08_np.linspace(-90, 90, 361)
    gr = [_f08_dB(_f08_ex(e)[0]) for e in els]; gl = [_f08_dB(_f08_ex(e)[1]) for e in els]
    o.append(T(14, 18, "(a) 放射パターン（仰角の切り口）", "start", 11.5, INK, True))
    cx, cy, R, gmin, gmax = 178, 186, 130, -25.0, 5.0
    o.append(_f08_polar(cx, cy, R, gmin, gmax, [-20, -10, 0], unit=""))
    o.append(T(cx + R - 8, cy - R + 8, "[dBi]", "start", 9.5, MUT))
    r0 = R * (0 - gmin) / (gmax - gmin); r3 = R * (3 - gmin) / (gmax - gmin)
    o.append(CIRC(cx, cy, r0, c=MUT, lw=1.3, dash="6 4"))
    o.append(PATH("M%g,%g A%g,%g 0 0 1 %g,%g" % (cx - r3, cy, r3, r3, cx + r3, cy), c=GRN, lw=1.8, dash="6 4"))
    for side in (1, -1):
        o.append(PL(_f08_ppts(cx, cy, R, gmin, gmax, els, gl, side), c=ALI, lw=1.5, dash="4 3"))
        o.append(PL(_f08_ppts(cx, cy, R, gmin, gmax, els, gr, side), c=SIG, lw=2.4))
    o.append(T(cx, cy - R - 8, "真上", "middle", 10, INK, True))
    o.append(T(cx + R + 6, cy - 6, "地平線", "start", 9.5, INK, True))
    o.append(T(cx - R - 6, cy - 6, "地平線", "end", 9.5, INK, True))
    o.append(T(cx, cy + R + 16, "真下（地板の裏）", "middle", 10, INK, True))
    yl = cy + R + 38
    o.append(LEGL(18, yl, [(SIG, None, "衛星の電波の偏波"), (ALI, "4 3", "逆の偏波（2 節）")], 9.5, 12))
    o.append(LEGL(18, yl + 18, [(MUT, "6 4", "等方性 0 dBi"), (GRN, "6 4", "上だけに一様 +3 dBi")], 9.5, 12))
    # (b) 仰角と利得
    xb = 404
    o.append(T(xb - 30, 18, "(b) 仰角ごとの利得", "start", 11.5, INK, True))
    p = Plot(xb + 14, 34, 262, 150, (-90, 90), (-30, 5))
    o.append(p.axes(xl="仰角 θ [°]", yl="利得 G_a [dBi]", xt=[-90, -60, -30, 0, 30, 60, 90], yt=[-30, -20, -10, 0], xfmt=_f08_m, yfmt=_f08_m))
    o.append(RECT(p.X(-90), p.y, p.X(0) - p.X(-90), p.h, 0, MSOFT, "none", 0, op=0.5))
    o.append(T(p.X(-45), p.y + 14, "地平線より下", "middle", 9.5, MUT, False, halo=True))
    o.append(p.clip(list(zip(els, gl)), c=ALI, lw=1.5, dash="4 3"))
    o.append(p.clip(list(zip(els, gr)), c=SIG, lw=2.4))
    for e, v, lab, a, dy in ((90, 3, "+3", "end", 14), (30, -1, "−1", "middle", -10), (5, -5, "−5", "start", -8)):
        o.append(D(p.X(e), p.Y(_f08_ga3(e)), GLD, 4.4))
        o.append(T(p.X(e) + (-6 if a == "end" else (6 if a == "start" else 0)), p.Y(_f08_ga3(e)) + dy, lab, a, 10, GLD, True, halo=True))
    o.append(T(p.X(88), p.Y(-26), "点: 3 章 3 節の例の値", "end", 9.5, GLD, True, halo=True))
    # (c) 電力の行き先
    a, b, d, loss = _f08_budget()
    yc = 254
    o.append(T(xb - 30, yc, "(c) 入れた電力の行き先（例のアンテナ）", "start", 11.5, INK, True))
    x0, wbar, yb = xb - 30, 316, yc + 14
    parts = [(a, SIG, "上・同じ偏波"), (b, ALI, "上・逆"), (d, PUR, "下"), (loss, MUT, "熱（損失）")]
    xx = x0
    for i, (v, c, lab) in enumerate(parts):
        wv = wbar * v
        o.append(RECT(xx, yb, wv, 24, 0, soft(c), c, 1.2))
        if i in (0, 3):
            o.append(T(xx + wv / 2, yb + 16, "%.0f %%" % (100 * v), "middle", 10, c, True))
        xx += wv
    lab_y = yb + 42
    o.append(T(x0, lab_y, "上・同じ偏波 %.1f %%　上・逆 %.1f %%　下 %.1f %%" % (100 * a, 100 * b, 100 * d), "start", 9.5, INK))
    o.append(T(x0, lab_y + 16, "熱（損失）%.1f %%" % (100 * loss), "start", 9.5, MUT))
    o.append(TX(x0, lab_y + 36, "効率 η_a = %.1f %%（放射した電力の割合）" % (100 * (a + b + d)), "start", 10, GRN, True))
    o.append(TX(x0, lab_y + 54, "真上の指向性 D_a = G_a/η_a = %.2f dBi" % (3 - 10 * math.log10(a + b + d)), "start", 10, INK, True))
    return SVG(700, 396, o, "例のアンテナ（3 章 3 節の値に、この章で足した例の値を合わせたもの）。(a) 仰角の切り口の放射パターン。衛星の電波の偏波に対する利得（青）は、真上で +3 dBi、地平線に近づくと下がり、地平線より下（地板の裏）ではさらに小さい。どの方位でも同じとした。(b) 同じ利得を仰角の関数で描いた。点は 3 章 3 節の 3 つの値。赤の破線は、衛星の電波と逆の偏波（2 節）に対する利得。(c) 全部の向きの利得を積分すると、入れた電力のうち放射した割合（効率）が求まる。この例では 57 % で、真上の指向性は 5.5 dBi にあたる。")
F["e08_pattern"] = _f08_pattern_fig()


# =====================================================================
# 1 節: 送りと受けで同じ（可逆性）
# =====================================================================
def _f08_recip_fig():
    o = []
    dirs = [(90, "真上"), (30, "30°"), (5, "5°")]
    gs = [10 ** (_f08_ga3(e) / 10) for e, _ in dirs]
    # (a) 送る
    o.append(T(14, 18, "(a) 送る: 入れた電力が、向きごとに利得の倍率で出る", "start", 10.5, INK, True))
    cx, cy = 150, 214
    o.append(RECT(cx - 90, cy, 180, 8, 0, MSOFT, "none", 0)); o.append(W(cx - 90, cy, cx + 90, cy, c=MUT, lw=1.4))
    o.append(_f08_patchicon(cx, cy - 2, 40))
    for (e, nm), g in zip(dirs, gs):
        a = math.radians(e); ux, uy = math.cos(a), -math.sin(a)
        x1, y1 = cx + 18 * ux, cy - 14 + 18 * uy
        x2, y2 = x1 + 60 * g * ux, y1 + 60 * g * uy
        o.append(ARR(x1, y1, x2, y2, c=SIG, lw=3.0, head=9))
        val = "+3" if e == 90 else _f08_f(_f08_ga3(e), 0)
        if e == 90:
            o.append(T(x2 + 8, y2 + 8, "%s %s dBi（%.2f 倍）" % (nm, val, g), "start", 9.5, SIG, True, halo=True))
        else:
            o.append(T(x2 + 8, y2 + 4, "%s %s dBi（%.2f 倍）" % (nm, val, g), "start", 9.5, SIG, True, halo=True))
    o.append(ARR(cx, cy + 46, cx, cy + 10, c=GLD, lw=2.0))
    o.append(TX(cx + 8, cy + 40, "入れた電力 P_{in}", "start", 9.5, GLD, True))
    o.append(W(345, 30, 345, 262, c=LIN, lw=0.8))
    # (b) 受ける
    o.append(T(356, 18, "(b) 受ける: 同じ密度の電波から、利得の倍率で受ける", "start", 10.5, INK, True))
    cx = 440
    o.append(RECT(cx - 70, cy, 140, 8, 0, MSOFT, "none", 0)); o.append(W(cx - 70, cy, cx + 70, cy, c=MUT, lw=1.4))
    o.append(_f08_patchicon(cx, cy - 2, 40))
    for (e, nm), g in zip(dirs, gs):
        a = math.radians(e); ux, uy = math.cos(a), -math.sin(a)
        x1, y1 = cx + 18 * ux, cy - 14 + 18 * uy
        xa, ya = x1 + 104 * ux, y1 + 104 * uy
        o.append(ARR(xa, ya, x1 + 6 * ux, y1 + 6 * uy, c=MUT, lw=1.4, head=7))
        for s_ in (0.82, 0.58):
            px, py = x1 + 104 * s_ * ux, y1 + 104 * s_ * uy
            o.append(W(px - 11 * uy, py + 11 * ux, px + 11 * uy, py - 11 * ux, c=MUT, lw=1.2))
        if e == 90:
            o.append(T(xa + 8, ya + 10, nm, "start", 9.5, MUT, True, halo=True))
        else:
            o.append(T(xa + 4, ya - 6, nm, "start", 9.5, MUT, True, halo=True))
    o.append(T(cx - 66, 76, "どの向きも", "start", 9.5, MUT))
    o.append(T(cx - 66, 90, "同じ密度 S", "start", 9.5, MUT))
    o.append(ARR(cx, cy + 10, cx, cy + 46, c=GLD, lw=2.0))
    o.append(TX(cx + 8, cy + 40, "C = S A_e = S G_{a}λ²/(4π)", "start", 9.5, GLD, True))
    bx = 604
    o.append(T(bx + 36, 50, "受けた電力", "middle", 9.5, INK, True))
    o.append(T(bx + 36, 63, "（等方性 = 1 倍）", "middle", 9.5, MUT))
    o.append(W(bx + 30, 70, bx + 30, 180, c=MUT, lw=1, dash="3 3"))
    for i, ((e, nm), g) in enumerate(zip(dirs, gs)):
        yy = 76 + i * 34
        o.append(T(bx - 6, yy + 13, nm, "end", 9.5, SIG, True))
        o.append(RECT(bx, yy, 30 * g, 18, 2, SSOFT, SIG, 1.2))
        o.append(T(bx + max(30 * g, 30) + 5, yy + 13, "%.2f" % g, "start", 9.5, SIG, True, halo=True))
    o.append(T(bx + 30, 194, "等方性", "middle", 9.5, MUT))
    o.append(T(350, 286, "どちらも同じ倍率（2.00・0.80・0.32）。偏波も同じで、送るときの偏波の電波を、受けるときに最もよく受ける", "middle", 10, INK, True))
    return SVG(700, 296, o, "可逆性。(a) アンテナに電力を入れると、向きごとに利得の倍率の強さで電波が出る（例のアンテナで、真上 2.00 倍・仰角 30° で 0.80 倍・5° で 0.32 倍）。(b) 同じアンテナで、どの向きからも同じ密度の電波を受けると、受ける電力は同じ倍率になる。受けたときの実効開口面積は G<sub>a</sub>λ²/(4π) である（3 章 1 節）。")
F["e08_recip"] = _f08_recip_fig()


# =====================================================================
# 1 節: 地平線に近い向きで利得が下がる理由（地板の上の電界の向き）
# =====================================================================
def _f08_horizon_fig():
    o = []
    def comps(e):
        g = 10 ** (_f08_ga3(e) / 10); s = math.sin(math.radians(e))
        ev = math.sqrt(2 * g) / (1 + s)
        return ev, ev * s
    o.append(T(14, 18, "(a) 出ていく電波の 2 つの成分（例のアンテナ）", "start", 11.5, INK, True))
    o.append(LEGL(18, 42, [(PUR, None, "垂直の成分（紙面の中。地平線では上下）")], 9.5))
    o.append(CIRC(26, 60, 5, c=TEA, lw=1.8, fill=TSOFT)); o.append(D(26, 60, TEA, 1.6))
    o.append(T(40, 64, "水平の成分（紙面に垂直。円の大きさ）", "start", 9.5, MUT))
    cx, cy = 190, 262
    o.append(RECT(cx - 170, cy, 340, 10, 0, MSOFT, "none", 0)); o.append(W(cx - 170, cy, cx + 170, cy, c=MUT, lw=1.6))
    o.append(T(cx - 166, cy + 26, "地板（金属）", "start", 9.5, MUT, True))
    o.append(_f08_patchicon(cx, cy - 2, 40))
    for e in (90, 30, 5):
        a = math.radians(e); ux, uy = math.cos(a), -math.sin(a)
        L = 196 if e != 90 else 168
        o.append(W(cx + 14 * ux, cy - 14 + 14 * uy, cx + L * ux, cy - 14 + L * uy, c=FNT, lw=1.2, dash="3 3"))
        px, py = cx + (L - 40) * ux, cy - 14 + (L - 40) * uy
        ev, eh = comps(e)
        vx, vy = -uy, ux
        if vy > 0:
            vx, vy = -vx, -vy
        lv = 36 * ev
        o.append(DARR(px - lv * vx, py - lv * vy, px + lv * vx, py + lv * vy, c=PUR, lw=2.2, head=6))
        rh = 13 * eh
        if rh > 1.2:
            o.append(CIRC(px, py, rh, c=TEA, lw=2.0, fill=TSOFT)); o.append(D(px, py, TEA, 2.2))
        else:
            o.append(T(px + 8, py + 16, "水平の成分 0", "start", 9.5, TEA, True, halo=True))
        if e == 90:
            o.append(T(px + 22, py - 28, "真上", "start", 10, INK, True, halo=True))
        elif e == 30:
            o.append(T(px + 14, py - 38, "仰角 30°", "start", 10, INK, True, halo=True))
        else:
            o.append(T(px + 8, py - 30, "仰角 5°", "start", 10, INK, True, halo=True))
    # (b) 金属の上の電界
    xb = 404
    o.append(T(xb, 18, "(b) 金属の面の上の電界", "start", 11.5, INK, True))
    yb = 110
    for i, (tang, title) in enumerate(((True, "面に沿う向き"), (False, "面に垂直な向き"))):
        x0 = xb + 10 + i * 140
        o.append(RECT(x0, yb, 110, 8, 0, MSOFT, MUT, 1.2))
        o.append(T(x0 + 55, yb - 64, title, "middle", 10, INK, True))
        if tang:
            o.append(ARR(x0 + 28, yb - 22, x0 + 82, yb - 22, c=TEA, lw=2.2))
            o.append(ARR(x0 + 82, yb + 30, x0 + 28, yb + 30, c=TEA, lw=1.6, dash="4 3"))
            o.append(T(x0 + 55, yb - 30, "電界", "middle", 9.5, TEA, True))
            o.append(T(x0 + 55, yb + 50, "鏡の像は逆向き", "middle", 9.5, TEA))
            o.append(T(x0 + 55, yb + 66, "→ 打ち消して 0", "middle", 10, ALI, True))
        else:
            o.append(ARR(x0 + 55, yb - 48, x0 + 55, yb - 6, c=PUR, lw=2.2))
            o.append(ARR(x0 + 55, yb + 14, x0 + 55, yb + 40, c=PUR, lw=1.6, dash="4 3"))
            o.append(T(x0 + 60, yb - 30, "電界", "start", 9.5, PUR, True))
            o.append(T(x0 + 55, yb + 58, "鏡の像は同じ向き", "middle", 9.5, PUR))
            o.append(T(x0 + 55, yb + 74, "→ 残る", "middle", 10, GRN, True))
    # (c) 成分の大きさと仰角
    yc = 222
    o.append(T(xb, yc - 4, "(c) 2 つの成分の大きさ（真上を 0 dB）", "start", 11.5, INK, True))
    p = Plot(xb + 44, yc + 12, 230, 90, (0, 90), (-25, 2))
    o.append(p.axes(xl="仰角 θ [°]", yl="[dB]", xt=[0, 30, 60, 90], yt=[-20, -10, 0], xfmt=_f08_m, yfmt=_f08_m))
    es = _f08_np.linspace(0.3, 90, 300)
    o.append(p.line([(e, 20 * math.log10(comps(e)[0])) for e in es], c=PUR, lw=2.2))
    o.append(p.clip([(e, 20 * math.log10(max(comps(e)[1], 1e-9))) for e in es], c=TEA, lw=2.2))
    o.append(T(p.X(48), p.Y(-1.2) - 6, "垂直の成分", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(30), p.Y(-14), "水平の成分 ∝ sin θ", "start", 9.5, TEA, True, halo=True))
    return SVG(700, 370, o, "地平線に近い向きで、衛星の電波を受ける強さが下がる理由。(a) 例のアンテナが出す電波を、電波の進む向きを含む垂直の面の中の成分（垂直の成分）と、それに直交する水平の成分に分けた。真上では 2 つの成分が同じ大きさだが、地平線に近づくと水平の成分が小さくなり、地平線で 0 になる。(b) 金属の面に沿う向きの電界は、面の中の電子が動いて打ち消すので、面のすぐ上では 0 になる（鏡に映した像が逆向きと考えてもよい）。面に垂直な電界は残る。地平線の向きに出る電波は地板に沿って進むので、水平の成分だけが打ち消される。(c) 例のアンテナの 2 つの成分の大きさ（水平の成分が仰角の sin に比例するとした）。")
F["e08_horizon"] = _f08_horizon_fig()


def _f08_cp_fig():
    o = []
    o.append(T(14, 18, "(a) 1 点で見た電界の向き（電波の進む向きに見る。衛星の側から見下ろす）", "start", 11.5, INK, True))
    kinds = [("直線偏波", "lin", MUT), ("右旋円偏波（RHCP）", "R", SIG), ("左旋円偏波（LHCP）", "L", ALI)]
    for i, (nm, kd, c) in enumerate(kinds):
        cx, cy, r = 112 + i * 236, 112, 48
        o.append(T(cx, 44, nm, "middle", 10.5, c, True))
        o.append(CIRC(cx, cy, r + 2, c=GRD, lw=1))
        o.append(W(cx - r - 8, cy, cx + r + 8, cy, c=GRD, lw=1)); o.append(W(cx, cy - r - 8, cx, cy + r + 8, c=GRD, lw=1))
        for k in range(8):
            t = k / 8.0
            if kd == "lin":
                ex, ey = 0.0, math.cos(2 * math.pi * t)
            elif kd == "R":
                ex, ey = math.sin(2 * math.pi * t), math.cos(2 * math.pi * t)
            else:
                ex, ey = -math.sin(2 * math.pi * t), math.cos(2 * math.pi * t)
            if abs(ex) + abs(ey) < 1e-6:
                continue
            op = 1.0 if k == 0 else 0.35
            o.append('<g opacity="%g">' % op + ARR(cx, cy, cx + r * ex, cy - r * ey, c=c, lw=2.2 if k == 0 else 1.6, head=7) + "</g>")
        if kd == "lin":
            o.append(T(cx + 10, cy - r - 2, "t = 0", "start", 9.5, c, True, halo=True))
            o.append(T(cx + 10, cy + r + 4, "T/2", "start", 9.5, c, True, halo=True))
            o.append(T(cx, cy + r + 26, "向きは変わらず、大きさだけが変わる", "middle", 9.5, INK))
        else:
            sg = 1 if kd == "R" else -1
            # 回る向きの矢印（円弧）
            a0, a1 = math.radians(60), math.radians(10)
            rr = r + 12
            x0_, y0_ = cx + sg * rr * math.sin(a0) * 0 + rr * math.sin(math.radians(20)) * sg, cy - rr * math.cos(math.radians(20))
            x1_, y1_ = cx + sg * rr * math.sin(math.radians(70)), cy - rr * math.cos(math.radians(70))
            o.append(CARR(x0_, y0_, x1_, y1_, bend=-0.18 * sg, c=c, lw=1.8, head=7))
            o.append(T(cx - sg * 4, cy - r - 4, "t = 0", "end" if sg > 0 else "start", 9.5, c, True, halo=True))
            o.append(T(cx + sg * (r + 4), cy + 14, "T/4", "start" if sg > 0 else "end", 9.5, c, True, halo=True))
            o.append(T(cx, cy + r + 26, "時計回り" if kd == "R" else "反時計回り", "middle", 10, c, True))
            o.append(T(cx, cy + r + 41, "大きさは一定で、向きが 1 周期で 1 回転", "middle", 9.5, INK))
    # (b) 楕円 = 右旋 + 左旋
    yb = 216
    o.append(W(14, yb - 12, 686, yb - 12, c=LIN, lw=0.8))
    o.append(TX(14, yb + 6, "(b) 楕円偏波 = 右旋（振幅 a_R）+ 左旋（振幅 a_L）", "start", 11.5, INK, True))
    aR, aL = 1.0, 0.3
    cx, cy, S = 132, yb + 112, 62
    o.append(W(cx - 90, cy, cx + 90, cy, c=GRD, lw=1)); o.append(W(cx, cy - 90, cx, cy + 90, c=GRD, lw=1))
    pts = [(cx + S * (aR - aL) * math.sin(2 * math.pi * k / 120), cy - S * (aR + aL) * math.cos(2 * math.pi * k / 120)) for k in range(121)]
    o.append(PL(pts, c=INK, lw=1.4, dash="4 3"))
    t = 1 / 12.0
    rx, ry = aR * math.sin(2 * math.pi * t), aR * math.cos(2 * math.pi * t)
    lx, ly = -aL * math.sin(2 * math.pi * t), aL * math.cos(2 * math.pi * t)
    o.append(ARR(cx, cy, cx + S * rx, cy - S * ry, c=SIG, lw=2.2))
    o.append(ARR(cx + S * rx, cy - S * ry, cx + S * (rx + lx), cy - S * (ry + ly), c=ALI, lw=2.2))
    o.append(ARR(cx, cy, cx + S * (rx + lx), cy - S * (ry + ly), c=INK, lw=1.4, dash="3 2"))
    o.append(TX(cx + S * rx * 0.5 + 8, cy - S * ry * 0.5 + 4, "a_R", "start", 10, SIG, True, halo=True))
    o.append(TX(cx + S * (rx + lx / 2) - 22, cy - S * (ry + ly / 2) - 4, "a_L", "end", 10, ALI, True, halo=True))
    o.append(T(cx + 30, cy + S * (aR + aL) + 18, "和の先が楕円を描く", "middle", 9.5, INK, True))
    o.append(DIM(cx - 82, cy - S * (aR + aL), cx - 82, cy + S * (aR + aL), None, c=MUT))
    o.append(TX(cx - 78, cy + S * (aR + aL) - 6, "2(a_R + a_L)", "start", 9.5, MUT, False, halo=True))
    o.append(DIM(cx - S * (aR - aL), cy + S * (aR + aL) + 26, cx + S * (aR - aL), cy + S * (aR + aL) + 26, None, c=MUT))
    o.append(TX(cx + S * (aR - aL) + 6, cy + S * (aR + aL) + 30, "2|a_R − a_L|", "start", 9.5, MUT, False, halo=True))
    # 軸比の例
    xe = 330
    o.append(TX(xe, yb + 32, "軸比 AR = (a_R + a_L)/|a_R − a_L|（楕円の長い軸 ÷ 短い軸）", "start", 10.5, INK, True))
    exs = [(0.0, "a_L/a_R = 0", "AR 0 dB（円）"), (0.171, "0.17", "3 dB"), (0.52, "0.52", "10 dB"), (1.0, "1", "∞（直線）")]
    for i, (q, s1, s2) in enumerate(exs):
        ex_c, ey_c = xe + 40 + i * 92, yb + 116
        a_, b_ = (1 + q) / (1 + q), abs(1 - q) / (1 + q)
        sz = 38
        pts = [(ex_c + sz * b_ * math.sin(2 * math.pi * k / 90), ey_c - sz * a_ * math.cos(2 * math.pi * k / 90)) for k in range(91)]
        if b_ < 0.02:
            o.append(W(ex_c, ey_c - sz, ex_c, ey_c + sz, c=MUT, lw=2.2))
        else:
            o.append(PL(pts, c=SIG if q < 0.99 else MUT, lw=2.0))
        o.append(TX(ex_c, ey_c + sz + 18, s1, "middle", 9.5, INK))
        o.append(T(ex_c, ey_c + sz + 34, s2, "middle", 9.5, SIG if q < 0.99 else MUT, True))
    o.append(TX(xe, yb + 214, "a_L が a_R に近いほど楕円はつぶれ、等しいと直線になる。大きい方の向きに回る", "start", 9.5, INK))
    return SVG(700, 456, o, "偏波の種類。(a) 空間の 1 点で、電界の向きが時間とともにどう変わるか（電波の進む向きに見た。矢印の薄いものは 1/8 周期ごとの向き）。直線偏波は向きが一定で大きさだけが変わり、円偏波は大きさが一定で向きが回る。電波の進む向きに見て時計回りが右旋（RHCP）、反時計回りが左旋（LHCP）である。(b) 右旋（青）と左旋（赤）の 2 つの円偏波を足すと、和の先は楕円を描く。長い軸は 2(a<sub>R</sub> + a<sub>L</sub>)、短い軸は 2|a<sub>R</sub> − a<sub>L</sub>| で、その比が軸比である（図は a<sub>L</sub>/a<sub>R</sub> = 0.3、軸比 1.86 = 5.4 dB）。")
F["e08_cp"] = _f08_cp_fig()


def _f08_plf_fig():
    o = []
    o.append(T(14, 18, "(a) 2 つの受け口（横・縦）と 90° の遅れで受ける（右旋を受ける組）", "start", 11.5, INK, True))
    cases = [("右旋の電波", SIG, (lambda t: math.sin(t)), (lambda t: math.cos(t)), "出力 1（合っている）"),
             ("直線の電波（横）", MUT, (lambda t: math.sqrt(2) * math.sin(t)), (lambda t: 0.0), "出力 1/2（−3 dB）"),
             ("左旋の電波", ALI, (lambda t: -math.sin(t)), (lambda t: math.cos(t)), "出力 0")]
    for i, (nm, c, fx, fy, res) in enumerate(cases):
        x0 = 14 + i * 228
        o.append(T(x0 + 100, 44, nm, "middle", 10.5, c, True))
        p = Plot(x0 + 34, 56, 170, 92, (0, 2 * math.pi), (-2.3, 2.3))
        o.append(p.axes(xl=None, yl=None, xt=[0, math.pi, 2 * math.pi], yt=[-2, 0, 2], xfmt=lambda v: {0: "0", math.pi: "T/2", 2 * math.pi: "T"}.get(v, ""), yfmt=_f08_m, sz=9))
        ts = _f08_np.linspace(0, 2 * math.pi, 181)
        o.append(p.line([(t, fx(t)) for t in ts], c=TEA, lw=1.5))
        o.append(p.line([(t, fy(t - math.pi / 2)) for t in ts], c=PUR, lw=1.5, dash="4 3"))
        o.append(p.line([(t, fx(t) + fy(t - math.pi / 2)) for t in ts], c=c, lw=2.4))
        o.append(T(x0 + 119, 178, res, "middle", 10, c, True))
    o.append(LEGL(48, 198, [(TEA, None, "横の受け口"), (PUR, "4 3", "縦の受け口（90° 遅らせる）"), (INK, None, "和（アンテナの出力。色は電波の種類）")], 9.5, 14))
    # (b) 軸比と受ける電力
    yb = 216
    o.append(W(14, yb, 686, yb, c=LIN, lw=0.8))
    o.append(T(14, yb + 20, "(b) アンテナの軸比と、受ける電力（円偏波の電波を、合うときに 0 dB）", "start", 11.5, INK, True))
    p = Plot(80, yb + 40, 360, 150, (0, 20), (-30, 1))
    o.append(p.axes(xl="アンテナの軸比 [dB]", yl="受ける電力 [dB]", xt=[0, 3, 6, 10, 15, 20], yt=[-30, -20, -10, -3, 0], xfmt=_f08_m, yfmt=_f08_m))
    ars = _f08_np.linspace(0.01, 20, 400)
    def rho(ar):
        A = 10 ** (ar / 20)
        return (A - 1) / (A + 1)
    o.append(p.line([(a, 10 * math.log10(1 / (1 + rho(a) ** 2))) for a in ars], c=SIG, lw=2.4))
    o.append(p.clip([(a, 10 * math.log10(rho(a) ** 2 / (1 + rho(a) ** 2))) for a in ars], c=ALI, lw=2.4))
    o.append(W(p.X(0), p.Y(-3.01), p.X(20), p.Y(-3.01), c=MUT, lw=1.2, dash="5 3"))
    o.append(T(p.X(19.6), p.Y(-3.01) + 30, "直線のアンテナ（軸比 ∞）は、どちらも −3 dB", "end", 9.5, MUT, True, halo=True))
    o.append(T(p.X(12), p.Y(-1.0) - 6, "右旋の電波", "middle", 10, SIG, True, halo=True))
    o.append(T(p.X(13), p.Y(-11.5), "左旋の電波", "middle", 10, ALI, True, halo=True))
    for a in (1, 3):
        v = 10 * math.log10(rho(a) ** 2 / (1 + rho(a) ** 2))
        o.append(D(p.X(a), p.Y(v), ALI, 4.2))
        o.append(T(p.X(a) + 6, p.Y(v) + 14, "%s dB → %s dB" % (_f08_m(a), _f08_f(v, 1)), "start", 9.5, ALI, True, halo=True))
    # 表
    xt = 476
    o.append(T(xt, yb + 52, "受ける電力（式と同じ値）", "start", 10, INK, True))
    rows = [("アンテナ", "電波", "電力"), ("右旋（理想）", "右旋", "0 dB"), ("右旋（理想）", "左旋", "0（−∞ dB）"), ("直線", "右旋", "−3.01 dB"),
            ("右旋・軸比 3 dB", "右旋", "−0.13 dB"), ("右旋・軸比 3 dB", "左旋", "−15.5 dB"), ("右旋・軸比 1 dB", "左旋", "−24.8 dB")]
    for i, (a_, b_, c_) in enumerate(rows):
        yy = yb + 74 + i * 18
        bold = i == 0
        o.append(T(xt, yy, a_, "start", 9.5, INK if not bold else MUT, bold))
        o.append(T(xt + 116, yy, b_, "start", 9.5, (SIG if b_ == "右旋" else ALI) if not bold else MUT, bold))
        o.append(T(xt + 210, yy, c_, "end", 9.5, INK if not bold else MUT, bold))
        if i == 0:
            o.append(W(xt, yy + 5, xt + 212, yy + 5, c=LIN, lw=0.8))
    return SVG(700, 456, o, "偏波が合わないときの損失。(a) 横と縦の 2 つの受け口の出力を、縦を 90° 遅らせて足すアンテナ（右旋を受ける組）。右旋の電波では 2 つが同じ位相になって強め合い、左旋では逆の位相になって打ち消し合う。横に振れる直線の電波では、横の受け口だけが受け、電力は半分になる（どれも電波の電力は同じ）。(b) アンテナに軸比があると、右旋の電波をわずかに損し、左旋の電波も少し受ける。軸比 3 dB のアンテナは、左旋の電波を 15.5 dB 弱く受ける。")
F["e08_plf"] = _f08_plf_fig()


def _f08_mirror_fig():
    o = []
    o.append(T(14, 18, "(a) 金属の面での反射（面とのなす角 ψ）", "start", 11.5, INK, True))
    cx, cy = 180, 226
    o.append(RECT(cx - 160, cy, 320, 12, 0, MSOFT, MUT, 1.2))
    o.append(T(cx + 156, cy + 30, "金属の面", "end", 9.5, MUT, True))
    psi = math.radians(35)
    L = 150
    xi, yi = cx - L * math.cos(psi), cy - L * math.sin(psi)
    xr, yr = cx + L * math.cos(psi), cy - L * math.sin(psi)
    o.append(ARR(xi, yi, cx - 4, cy - 2, c=SIG, lw=1.8))
    o.append(ARR(cx + 4, cy - 2, xr, yr, c=ALI, lw=1.8))
    o.append(PATH("M%g,%g A40,40 0 0 0 %g,%g" % (cx - 40, cy, cx - 40 * math.cos(psi), cy - 40 * math.sin(psi)), c=MUT, lw=1.0))
    o.append(T(cx - 52, cy - 8, "ψ", "end", 11, MUT, True))
    for side in (-1, 1):
        px = cx + side * 0.55 * L * math.cos(psi); py = cy - 0.55 * L * math.sin(psi)
        kx, ky = (math.cos(psi), math.sin(psi)) if side < 0 else (math.cos(psi), -math.sin(psi))
        vx, vy = ky, -kx
        if vy < 0:
            vx, vy = -vx, -vy
        o.append(ARR(px, py, px + 30 * vx, py + 30 * vy, c=PUR, lw=2.2))
        o.append(CIRC(px, py, 7, c=TEA, lw=2, fill=SCR))
        if side < 0:
            o.append(D(px, py, TEA, 2.4))
        else:
            o.append(W(px - 4.5, py - 4.5, px + 4.5, py + 4.5, c=TEA, lw=1.8)); o.append(W(px - 4.5, py + 4.5, px + 4.5, py - 4.5, c=TEA, lw=1.8))
    o.append(T(xi - 6, yi - 8, "入射波（右旋）", "start", 10, SIG, True, halo=True))
    o.append(T(xr + 6, yr - 8, "反射波（左旋）", "end", 10, ALI, True, halo=True))
    o.append(TX(20, 46, "垂直の成分（紫）の上下の部分: 同じ向き → Γ_V = +1", "start", 9.5, PUR, True))
    o.append(TX(20, 62, "水平の成分（⊙ 手前向き → ⊗ 奥向き）: 逆向き → Γ_H = −1", "start", 9.5, TEA, True))
    o.append(T(20, 78, "面に沿う部分は、入射と反射で打ち消し合う（和が 0）", "start", 9.5, INK))
    # (b) 真上から当たるとき（上から見下ろした図）
    xb = 400
    o.append(W(386, 30, 386, 280, c=LIN, lw=0.8))
    o.append(T(xb, 18, "(b) 真上から当たるとき（ψ = 90°）を上から見る", "start", 11.5, INK, True))
    for k, (c, t1, sym, t2, t3) in enumerate(((SIG, "入射波", "in", "紙面の奥へ進む", "進む向きに見て時計回り → 右旋"),
                                             (ALI, "反射波", "out", "紙面の手前へ進む", "進む向きに見て反時計回り → 左旋"))):
        bx, by, rr = xb + 70 + 150 * k, 130, 46
        o.append(T(bx, 52, t1, "middle", 10.5, c, True))
        o.append(CIRC(bx, by, rr, c=c, lw=1.6))
        # 時計回りの矢印（上から見て。どちらも同じ）
        a0, a1 = math.radians(100), math.radians(20)
        x0_, y0_ = bx + rr * math.cos(a0), by - rr * math.sin(a0)
        x1_, y1_ = bx + rr * math.cos(a1), by - rr * math.sin(a1)
        o.append(CARR(x0_, y0_, x1_, y1_, bend=-0.22, c=c, lw=2.2, head=8))
        o.append(CIRC(bx, by, 8, c=c, lw=2, fill=SCR))
        if sym == "in":
            o.append(W(bx - 5, by - 5, bx + 5, by + 5, c=c, lw=2)); o.append(W(bx - 5, by + 5, bx + 5, by - 5, c=c, lw=2))
        else:
            o.append(D(bx, by, c, 3))
        o.append(T(bx, by + rr + 18, t2, "middle", 9.5, c, True))
        o.append(T(bx, by + rr + 34, "上から見て時計回り", "middle", 9.5, INK))
    o.append(T(xb + 145, 248, "空間で回る向きは反射しても同じ。進む向きだけが逆になるので、", "middle", 9.5, INK))
    o.append(T(xb + 145, 264, "進む向きに見た回り方が逆になる → 右旋は左旋に", "middle", 9.5, ALI, True))
    return SVG(700, 290, o, "金属の面での反射。(a) 金属の面に沿う向きの電界は 0 なので、入射波と反射波の面に沿う部分が打ち消し合う。水平の成分（面に沿う）は逆向きに反射し（Γ<sub>H</sub> = −1）、垂直の成分は、面に沿う部分が打ち消し合うように反射するので、上下の部分は同じ向きになる（Γ<sub>V</sub> = +1）。(b) 真上から当たるときを上から見ると、電界が空間で回る向きは反射しても変わらないが、進む向きが逆になるので、進む向きに見た回る向きが逆になる。斜めに当たるときも、反射波は入射波を鏡に映した形（全体の符号は逆）で、回る向きが逆になる。")
F["e08_mirror"] = _f08_mirror_fig()


def _f08_fresnel_fig():
    o = []
    np = _f08_np
    ps = np.linspace(0.2, 90, 450)
    mats = [(4.0, GLD, "乾いた地面 εr = 4"), (20.0, TEA, "湿った地面 εr = 20")]
    o.append(T(14, 18, "(a) 反射係数（右: 面とのなす角）", "start", 11.5, INK, True))
    p = Plot(70, 38, 270, 200, (0, 90), (-1.05, 1.05))
    o.append(p.axes(xl="面とのなす角 ψ [°]", yl="反射係数", xt=[0, 15, 30, 45, 60, 75, 90], yt=[-1, -0.5, 0, 0.5, 1], xfmt=_f08_m, yfmt=_f08_m))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    o.append(W(p.X(0), p.Y(1), p.X(90), p.Y(1), c=PUR, lw=1.6, dash="2 3"))
    o.append(W(p.X(0), p.Y(-1), p.X(90), p.Y(-1), c=TEA, lw=1.6, dash="2 3"))
    o.append(TX(p.X(89), p.Y(1) + 13, "金属 Γ_V = +1", "end", 9.5, PUR, True, halo=True))
    for er, c, nm in mats:
        gh = [_f08_fres(er, math.radians(v))[0] for v in ps]; gv = [_f08_fres(er, math.radians(v))[1] for v in ps]
        o.append(p.line(list(zip(ps, gh)), c=c, lw=1.8, dash="5 3"))
        o.append(p.line(list(zip(ps, gv)), c=c, lw=2.4))
        tb = math.degrees(math.atan(1 / math.sqrt(er)))
        o.append(D(p.X(tb), p.Y(0), c, 4.4))
        o.append(T(p.X(tb) + 3, p.Y(0) - 8, "%.1f°" % tb, "start", 9.5, c, True, halo=True))
    o.append(TX(p.X(60), p.Y(0.42) - 10, "Γ_V（実線）", "middle", 9.5, INK, True, halo=True))
    o.append(TX(p.X(60), p.Y(-0.60) + 18, "Γ_H（破線）", "middle", 9.5, INK, True, halo=True))
    o.append(LEGL(70, 282, [(GLD, None, "乾いた地面 εr = 4"), (TEA, None, "湿った地面 εr = 20")], 9.5, 12))
    o.append(TX(70, 300, "点: ブルースター角（Γ_V = 0）。金属は Γ_H = −1、Γ_V = +1", "start", 9.5, MUT))
    # (b) 反射波の右旋と左旋
    xb = 392
    o.append(T(xb, 18, "(b) 右旋の電波が反射した後の、右旋と左旋の電力", "start", 11.5, INK, True))
    q = Plot(xb + 50, 38, 248, 200, (0, 90), (-30, 0.5))
    o.append(q.axes(xl="面とのなす角 ψ [°]", yl="入射に対する電力 [dB]", xt=[0, 15, 30, 45, 60, 75, 90], yt=[-30, -20, -10, 0], xfmt=_f08_m, yfmt=_f08_m))
    for er, c, nm in mats:
        rr = []; ll = []
        for v in ps:
            gh, gv = _f08_fres(er, math.radians(v)); a, b = _f08_rl(gh, gv)
            rr.append((v, 20 * math.log10(max(abs(a), 1e-9)))); ll.append((v, 20 * math.log10(max(abs(b), 1e-9))))
        o.append(q.clip(rr, c=c, lw=2.4))
        o.append(q.clip(ll, c=c, lw=1.8, dash="5 3"))
    o.append(T(q.X(5), q.Y(-1.5) + 6, "右旋のまま（実線）", "start", 9.5, INK, True, halo=True))
    o.append(T(q.X(88), q.Y(-6.2), "左旋になる（破線）", "end", 9.5, INK, True, halo=True))
    o.append(T(xb, 282, "ブルースター角より浅い（すれすれの）反射: 右旋が多い", "start", 9.5, INK))
    o.append(T(xb, 300, "深い反射: 左旋が多い（金属はどの角でも全部が左旋）", "start", 9.5, INK))
    return SVG(700, 310, o, "誘電体の面での反射（比誘電率は例の値。損失は無いとした）。(a) 水平の成分の反射係数 Γ<sub>H</sub>（破線）はどの角でも負で、垂直の成分の反射係数 Γ<sub>V</sub>（実線）は、すれすれの −1 から増え、ブルースター角で 0 になり、その上で正になる。(b) 右旋の電波が反射した後の、右旋の成分 (Γ<sub>V</sub> + Γ<sub>H</sub>)/2 と左旋の成分 (Γ<sub>V</sub> − Γ<sub>H</sub>)/2 の電力。ブルースター角より浅い反射では右旋が多く残り、深い反射では左旋が多い。")
F["e08_fresnel"] = _f08_fresnel_fig()


def _f08_gamma_fig():
    o = []
    np = _f08_np
    def gam(er, th, kind, ant):
        psi = th if kind == "ground" else 90.0 - th
        gh, gv = _f08_fres(er, math.radians(psi)); a, b = _f08_rl(gh, gv)
        if ant == "lin":
            return math.sqrt(a * a + b * b)
        gd = _f08_ex(th)[0]
        gr, gl = _f08_ex(-th) if kind == "ground" else _f08_ex(th)
        return math.sqrt((a * a * gr + b * b * gl) / gd)
    o.append(T(14, 18, "(a) 反射波の来る向き", "start", 11.5, INK, True))
    # 地面
    gx, gy = 30, 150
    o.append(RECT(gx, gy, 150, 8, 0, MSOFT, MUT, 1.0)); o.append(T(gx + 150, gy + 22, "地面（εr = 4）", "end", 9.5, MUT, True))
    ax, ay = gx + 118, gy - 46
    o.append(W(ax, gy, ax, ay + 4, c=MUT, lw=1.2)); o.append(_f08_patchicon(ax, ay, 28))
    th = math.radians(24)
    o.append(ARR(ax - 110 * math.cos(th), ay - 110 * math.sin(th), ax - 6, ay - 6, c=SIG, lw=1.6))
    xg = ax - 46 / math.tan(th) * 1.0
    o.append(W(ax - 140 * math.cos(th), gy - 140 * math.sin(th) + 46 + 0, xg, gy, c=ALI, lw=1.4, dash="5 3"))
    o.append(ARR(xg, gy, ax - 4, ay + 6, c=ALI, lw=1.6))
    o.append(T(gx, 40, "地面: 下から来る", "start", 10, INK, True))
    o.append(T(gx, 56, "（面とのなす角 = 仰角 θ）", "start", 9.5, MUT))
    # 壁
    wx = 214
    o.append(RECT(wx + 150, 40, 8, 118, 0, MSOFT, MUT, 1.0)); o.append(RECT(wx, gy, 158, 8, 0, MSOFT, "none", 0))
    o.append(T(wx + 146, gy + 22, "壁（εr = 6）", "end", 9.5, MUT, True))
    bx, by = wx + 60, gy - 46
    o.append(W(bx, gy, bx, by + 4, c=MUT, lw=1.2)); o.append(_f08_patchicon(bx, by, 28))
    th2 = math.radians(30); cw, sw = math.cos(th2), math.sin(th2)
    o.append(ARR(bx - 96 * cw, by - 10 - 96 * sw, bx - 6, by - 12, c=SIG, lw=1.6))
    tw_ = (wx + 150 - bx) / cw; pxw, pyw = wx + 150, by - 10 - tw_ * sw
    o.append(W(pxw - 58 * cw, pyw - 58 * sw, pxw, pyw, c=ALI, lw=1.4, dash="5 3"))
    o.append(ARR(pxw, pyw, bx + 6, by - 12, c=ALI, lw=1.6))
    o.append(T(wx, 40 - 16 + 16, "壁: 上の横から来る", "start", 10, INK, True))
    o.append(T(wx, 56, "（面とのなす角 = 90° − θ）", "start", 9.5, MUT))
    o.append(LEGL(30, 196, [(SIG, None, "直接波"), (ALI, "5 3", "反射波")], 9.5, 14))
    # (b) γ と仰角
    xb = 404
    o.append(T(xb - 10, 18, "(b) 反射波と直接波の振幅の比 γ", "start", 11.5, INK, True))
    p = Plot(xb + 30, 34, 250, 170, (5, 80), (0, 1))
    o.append(p.axes(xl="衛星の仰角 θ [°]", yl="γ", xt=[5, 20, 40, 60, 80], yt=[0, 0.25, 0.5, 0.75, 1], xfmt=_f08_m, yfmt=_f08_m))
    o.append(W(p.X(5), p.Y(0.5), p.X(80), p.Y(0.5), c=MUT, lw=1.0, dash="2 3"))
    o.append(T(p.X(56), p.Y(0.5) - 5, "7 章の例 γ = 0.5", "end", 9.5, MUT, False, halo=True))
    ths = np.linspace(5, 80, 151)
    for kind, er, c in (("ground", 4.0, GLD), ("wall", 6.0, PUR)):
        o.append(p.line([(t, gam(er, t, kind, "lin")) for t in ths], c=c, lw=1.6, dash="5 3"))
        o.append(p.line([(t, gam(er, t, kind, "ex")) for t in ths], c=c, lw=2.4))
    for t, kind, er, c, dx, dy in ((10, "ground", 4.0, GLD, 6, -6), (30, "wall", 6.0, PUR, 6, 14)):
        g1 = gam(er, t, kind, "ex"); g2 = gam(er, t, kind, "lin")
        o.append(D(p.X(t), p.Y(g1), c, 4.2)); o.append(D(p.X(t), p.Y(g2), c, 4.2))
        o.append(T(p.X(t) + dx, p.Y(g1) + dy, "%.2f" % g1, "start", 9.5, c, True, halo=True))
        o.append(T(p.X(t) + dx, p.Y(g2) - 6, "%.2f" % g2, "start", 9.5, c, True, halo=True))
    o.append(LEGL(xb - 10, 252, [(GLD, None, "地面・例のアンテナ"), (GLD, "5 3", "地面・直線")], 9.5, 10))
    o.append(LEGL(xb - 10, 270, [(PUR, None, "壁・例のアンテナ"), (PUR, "5 3", "壁・直線")], 9.5, 10))
    o.append(T(xb - 10, 292, "直線: 向きによらない利得の、直線偏波のアンテナ", "start", 9.5, MUT))
    o.append(T(14, 232, "例のアンテナは、地面の反射を下の向きの小さい利得で、", "start", 9.5, INK))
    o.append(T(14, 248, "壁の反射（深い反射で左旋になる）を偏波で弱く受ける", "start", 9.5, INK))
    o.append(T(14, 270, "低い衛星の地面の反射は右旋のまま、地平線のすぐ下から", "start", 9.5, ALI, True))
    o.append(T(14, 286, "来るので、弱めにくい（10° で γ = %.2f）" % gam(4.0, 10, "ground", "ex"), "start", 9.5, ALI, True))
    return SVG(700, 300, o, "反射波と直接波の振幅の比 γ（7 章 3 節の記号）。(a) 地面の反射は地平線より下から、壁の反射は上の半分の横から来る。(b) 例のアンテナ（1 節。右旋を受け、下の向きの利得が小さい）と、向きによらない利得の直線偏波のアンテナで比べた（地面・壁の比誘電率と、例のアンテナの左旋と下の半分の利得は例の値。反射波の右旋と左旋の分を電力で足した）。仰角の低い衛星の地面の反射は、右旋のまま地平線のすぐ下から来るので、例のアンテナでも γ が大きく残る。")
F["e08_gamma"] = _f08_gamma_fig()


def _f08_patch_fig():
    o = []
    o.append(T(14, 18, "(a) 上から見る", "start", 11.5, INK, True))
    cx, cy, G, P, E = 120, 150, 200, 92, 76      # 地板・誘電体・電極の大きさ（絵の寸法）
    o.append(RECT(cx - G / 2, cy - G / 2 + 10, G, G - 20, 3, MSOFT, MUT, 1.2))
    o.append(RECT(cx - P / 2, cy - P / 2, P, P, 3, GOSOFT, GLD, 1.4))
    c5 = 13
    pts = [(cx - E / 2 + c5, cy - E / 2), (cx + E / 2, cy - E / 2), (cx + E / 2, cy + E / 2 - c5), (cx + E / 2 - c5, cy + E / 2), (cx - E / 2, cy + E / 2), (cx - E / 2, cy - E / 2 + c5)]
    o.append(PL(pts + [pts[0]], c=SIG, lw=1.8, fill=SSOFT))
    o.append(D(cx + E / 6, cy, ALI, 4.2))
    o.append(T(cx - G / 2 + 6, cy - G / 2 + 26, "地板（金属）", "start", 9.5, MUT, True))
    o.append(T(cx + P / 2 + 4, cy - P / 2 + 2, "誘電体", "start", 9.5, GLD, True, halo=True))
    o.append(T(cx + P / 2 + 4, cy - P / 2 + 15, "（セラミック）", "start", 9.5, GLD, False, halo=True))
    o.append(T(cx, cy - 8, "パッチ", "middle", 10, SIG, True, halo=True))
    o.append(T(cx + E / 6 + 6, cy + 16, "給電点", "start", 9.5, ALI, True, halo=True))
    o.append(DIM(cx - E / 2, cy + E / 2 + 12, cx + E / 2, cy + E / 2 + 12, None, c=SIG))
    o.append(TX(cx, cy + E / 2 + 28, "一辺 ℓ", "middle", 10, SIG, True, halo=True))
    o.append(T(cx, cy + G / 2 + 6, "（2 つの角を切ってある。円偏波にする工夫。後の項）", "middle", 9.5, MUT))
    # (b) 横から見る（断面）
    xb = 276
    o.append(T(xb, 18, "(b) 横から見る（断面）と、パッチの下の電界", "start", 11.5, INK, True))
    gx0, gx1, gy = xb + 20, xb + 400, 140
    hp = 34
    px0, px1 = xb + 110, xb + 310
    o.append(RECT(gx0, gy, gx1 - gx0, 7, 0, MSOFT, MUT, 1.2))
    o.append(RECT(px0 - 20, gy - hp, px1 - px0 + 40, hp, 0, GOSOFT, GLD, 1.2))
    o.append(W(px0, gy - hp, px1, gy - hp, c=SIG, lw=3))
    xf = (px0 + px1) / 2 + (px1 - px0) / 6
    o.append(W(xf, gy + 30, xf, gy - hp, c=ALI, lw=2.2)); o.append(D(xf, gy - hp, ALI, 3.2))
    o.append(T(xf + 6, gy + 28, "給電のピン（地板の穴を通る）", "start", 9.5, ALI, True))
    for k in range(9):
        x = px0 + (px1 - px0) * (k + 0.5) / 9
        u = (x - (px0 + px1) / 2) / ((px1 - px0) / 2)
        v = math.sin(math.pi * u / 2)
        if abs(v) < 0.08:
            continue
        L = 24 * abs(v)
        if v > 0:
            o.append(ARR(x, gy - 4, x, gy - 4 - L, c=PUR, lw=1.8, head=6))
        else:
            o.append(ARR(x, gy - hp + 4, x, gy - hp + 4 + L, c=PUR, lw=1.8, head=6))
    for sg, xe in ((-1, px0), (1, px1)):
        for r in (12, 20):
            if sg > 0:
                o.append(PATH("M%g,%g A%g,%g 0 0 0 %g,%g" % (xe + r, gy, r, r, xe, gy - hp - 0), c=PUR, lw=1.3))
            else:
                o.append(PATH("M%g,%g A%g,%g 0 0 1 %g,%g" % (xe - r, gy, r, r, xe, gy - hp), c=PUR, lw=1.3))
    o.append(T(px0 - 2, gy - hp - 26, "縁の電界（ここから", "end", 9.5, PUR, True, halo=True))
    o.append(T(px0 - 2, gy - hp - 12, "電波が出る）", "end", 9.5, PUR, True, halo=True))
    o.append(T((px0 + px1) / 2, gy - hp - 10, "パッチ", "middle", 10, SIG, True, halo=True))
    o.append(DIM(gx0 + 6, gy - hp, gx0 + 6, gy, None, c=GLD))
    o.append(TX(gx0 + 14, gy - hp / 2 + 4, "h_d", "start", 9.5, GLD, True))
    # (c) 定在波と入力の抵抗
    yc = 200
    o.append(T(xb, yc, "(c) 縁で跳ね返る波が重なって、半波長の定在波になる", "start", 11.5, INK, True))
    p = Plot(xb + 56, yc + 20, 310, 120, (-0.5, 0.5), (-1.1, 1.1))
    o.append(p.axes(xl="パッチの中心からの位置 x / ℓ", yl=None, xt=[-0.5, -1 / 6.0, 0, 1 / 6.0, 0.5], yt=[-1, 0, 1], xfmt=lambda v: {-3: "−1/2", -1: "−1/6", 0: "0", 1: "1/6", 3: "1/2"}[int(round(v * 6))], yfmt=_f08_m))
    xs = _f08_np.linspace(-0.5, 0.5, 201)
    o.append(p.line([(x, math.sin(math.pi * x)) for x in xs], c=PUR, lw=2.2))
    o.append(p.line([(x, math.cos(math.pi * x)) for x in xs], c=TEA, lw=2.0, dash="5 3"))
    o.append(p.line([(x, math.sin(math.pi * x) ** 2) for x in xs], c=ALI, lw=1.8, dash="2 2"))
    o.append(D(p.X(1 / 6.0), p.Y(0.25), ALI, 4.2))
    o.append(T(p.X(1 / 6.0) + 6, p.Y(0.25) + 14, "50 Ω（縁で 200 Ω の例）", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.49), p.Y(1.0) + 14, "電界", "end", 9.5, PUR, True, halo=True))
    o.append(T(p.X(-0.02), p.Y(0.98) - 6, "電流", "end", 9.5, TEA, True, halo=True))
    o.append(T(p.X(-0.32), p.Y(0.35) - 6, "入力の抵抗 ∝ 電界²", "middle", 9.5, ALI, True, halo=True))
    return SVG(700, 380, o, "パッチアンテナ（形と寸法は例）。(a) 地板の上に誘電体（セラミック）を置き、その上に金属のパッチを付けて、下から給電のピンでつなぐ。(b) パッチと地板の間の電界は、両端で向きが逆で、中心で 0 になる。両端の縁からはみ出した電界から電波が出る。(c) 縁で跳ね返った波が重なり、一辺が誘電体の中の半波長のとき、電界（実線）は両端で最も強く、電流（破線）は中心で最も強い定在波になる。給電点から見た入力の抵抗は電界の 2 乗に比例し、中心で 0、縁で最も大きい。縁で 200 Ω なら、中心から ℓ/6 の所で 50 Ω になる。")
F["e08_patch"] = _f08_patch_fig()


def _f08_epsr_fig():
    o = []
    o.append(T(14, 18, "(a) L1 のパッチの一辺 ℓ = λ/(2√εr)（同じ縮尺）", "start", 11.5, INK, True))
    sc = 1.55   # px / mm
    x = 24; yb = 196
    for er, c, nm in ((1.0, MUT, "空気"), (4.4, GRN, "FR-4"), (10.2, TEA, ""), (20.0, SIG, "セラミック"), (37.0, PUR, "")):
        l = _F08_LAM / (2 * math.sqrt(er)) * 1e3
        w = l * sc
        o.append(RECT(x, yb - w, w, w, 2, soft(c), c, 1.4))
        o.append(T(x + w / 2, yb + 16, "εr = %g" % er, "middle", 9.5, c, True))
        o.append(T(x + w / 2, yb + 31, "%.1f mm" % l, "middle", 9.5, INK))
        if nm:
            o.append(T(x + w / 2, yb + 46, nm, "middle", 9.5, MUT))
        x += w + 14
    o.append(W(24, yb + 56, 24 + 50 * sc, yb + 56, c=INK, lw=2)); o.append(T(24 + 25 * sc, yb + 70, "50 mm", "middle", 9.5, INK))
    # (b) 比誘電率とパターン（無限の地板の空洞のモデル）
    xb = 420
    o.append(T(xb - 14, 18, "(b) 右旋の指向性（地板が無限に大きいとき）", "start", 11.5, INK, True))
    p = Plot(xb + 30, 36, 240, 170, (0, 90), (-8, 10))
    o.append(p.axes(xl="仰角 θ [°]", yl="指向性 [dBi]", xt=[0, 30, 60, 90], yt=[-5, 0, 5, 10], xfmt=_f08_m, yfmt=_f08_m))
    for er, c in ((1.0, MUT), (4.4, GRN), (20.0, SIG)):
        el, DR, DL = _f08_cav(er)
        o.append(p.line([(e, 10 * math.log10(max(d, 1e-9))) for e, d in zip(el, DR) if e >= 0.5], c=c, lw=2.2))
        dz = 10 * math.log10(DR[-1]); i10 = int(_f08_np.argmin(_f08_np.abs(el - 10)))
        dy_ = {1.0: -6, 4.4: -7, 20.0: 15}[er]
        o.append(T(p.X(88), p.Y(dz) + dy_, "εr = %g: %.1f" % (er, dz), "end", 9.5, c, True, halo=True))
        o.append(D(p.X(10), p.Y(10 * math.log10(DR[i10])), c, 3.6))
    o.append(T(p.X(20), p.Y(-6.8), "点: 仰角 10° の値", "start", 9.5, MUT, False, halo=True))
    o.append(T(xb - 14, 268, "比誘電率が高い → 小さい・上の半分を広く見る", "start", 10, SIG, True))
    o.append(T(xb - 14, 286, "その代わり、帯域が狭く、効率が下がりやすい（emsim/17）", "start", 9.5, INK))
    return SVG(700, 300, o, "誘電体の比誘電率とパッチ。(a) L1（波長 190.3 mm）のパッチの一辺を、簡単な式 λ/(2√εr) で計算し、同じ縮尺で並べた。比誘電率 20 のセラミックでは 21.3 mm になる（縁の電界で、実際は少し短い）。(b) 地板が無限に大きいとしたときの、右旋の指向性（方位で平均。空洞のモデルの計算）。比誘電率が高く小さいパッチほど、真上の指向性が下がり、地平線に近い向きが上がる。")
F["e08_epsr"] = _f08_epsr_fig()


def _f08_cpfeed_fig():
    o = []
    np = _f08_np
    o.append(T(14, 18, "(a) 2 点で給電し、90° ずらす", "start", 11.5, INK, True))
    cx, cy, E = 110, 120, 84
    o.append(RECT(cx - E / 2, cy - E / 2, E, E, 2, SSOFT, SIG, 1.6))
    f1 = (cx + E / 4, cy); f2 = (cx, cy - E / 4)
    o.append(D(f1[0], f1[1], ALI, 4)); o.append(D(f2[0], f2[1], ALI, 4))
    o.append(DARR(cx - E / 2 - 2, cy + E / 2 + 10, cx + E / 2 + 2, cy + E / 2 + 10, c=PUR, lw=1.4, head=6))
    o.append(DARR(cx + E / 2 + 10, cy - E / 2 - 2, cx + E / 2 + 10, cy + E / 2 + 2, c=TEA, lw=1.4, head=6))
    o.append(T(cx - E / 2, cy + E / 2 + 24, "モード x（横の定在波）", "start", 9.5, PUR, True))
    o.append(T(cx + E / 2 + 16, cy - E / 2 + 6, "モード y", "start", 9.5, TEA, True))
    hx, hy = cx - 40, cy + E / 2 + 34
    o.append(BOX(hx, hy, 80, 34, "90° の遅れ", None, GLD, GOSOFT, sz=10))
    o.append(W(f1[0], f1[1], f1[0], cy + E / 2 - 2, c=ALI, lw=1.2, dash="3 2"))
    o.append(W(f2[0], f2[1], cx - E / 2 + 6, f2[1], c=ALI, lw=1.2, dash="3 2"))
    o.append(W(cx - E / 2 - 12, f2[1], cx - E / 2 - 12, hy + 17, hx, hy + 17, c=ALI, lw=1.2, dash="3 2"))
    o.append(W(f1[0], cy + E / 2 + 18, f1[0], hy, c=ALI, lw=1.2, dash="3 2"))
    o.append(ARR(cx, hy + 34, cx, hy + 54, c=ALI, lw=1.4))
    o.append(T(cx, hy + 68, "受信機へ", "middle", 9.5, ALI, True))
    # (b) 1 点で給電し、角を切る
    xb = 236
    o.append(T(xb, 18, "(b) 1 点で給電し、角を切る", "start", 11.5, INK, True))
    cx2, cy2, c5 = xb + 92, 120, 15
    pts = [(cx2 - E / 2 + c5, cy2 - E / 2), (cx2 + E / 2, cy2 - E / 2), (cx2 + E / 2, cy2 + E / 2 - c5), (cx2 + E / 2 - c5, cy2 + E / 2), (cx2 - E / 2, cy2 + E / 2), (cx2 - E / 2, cy2 - E / 2 + c5)]
    o.append(PL(pts + [pts[0]], c=SIG, lw=1.6, fill=SSOFT))
    o.append(D(cx2 + E / 6, cy2, ALI, 4.2))
    o.append(T(cx2 + E / 6 + 6, cy2 + 15, "給電点", "start", 9.5, ALI, True, halo=True))
    d = E / 2 + 18
    o.append(DARR(cx2 - d * 0.707, cy2 - d * 0.707, cx2 + d * 0.707, cy2 + d * 0.707, c=TEA, lw=1.3))
    o.append(DARR(cx2 - d * 0.707, cy2 + d * 0.707, cx2 + d * 0.707, cy2 - d * 0.707, c=PUR, lw=1.3))
    o.append(T(cx2 + d * 0.707 + 2, cy2 + d * 0.707 + 6, "モード v（高い）", "start", 9.5, TEA, True, halo=True))
    o.append(T(cx2 + d * 0.707 + 2, cy2 - d * 0.707 + 2, "モード u（低い）", "start", 9.5, PUR, True, halo=True))
    o.append(T(cx2, cy2 + E / 2 + 40, "切った角を結ぶ対角（v）は短い", "middle", 9.5, INK))
    o.append(T(cx2, cy2 + E / 2 + 56, "→ その向きのモードの周波数が高い", "middle", 9.5, INK))
    o.append(T(cx2, cy2 + E / 2 + 74, "この切り方と給電点で右旋", "middle", 10, SIG, True))
    # (c) 2 つのモードの振幅と、軸比
    xc = 460
    o.append(T(xc - 8, 18, "(c) 2 つのモードと軸比（Q = 100）", "start", 11.5, INK, True))
    f0 = _F08_F1; Q = _F08_Q; Dl = 1 / (2 * Q)
    fs = np.linspace(-25e6, 25e6, 501)
    def Hm(f, fk):
        return 1 / (1 + 1j * Q * (f / fk - fk / f))
    fu, fv = f0 * (1 - Dl), f0 * (1 + Dl)
    p = Plot(xc + 30, 40, 200, 84, (-25, 25), (0, 1.1))
    o.append(p.axes(xl=None, yl="振幅", xt=[-20, -10, 0, 10, 20], yt=[0, 0.5, 1], xfmt=lambda v: "", yfmt=_f08_m))
    o.append(W(p.x, p.Y(1 / math.sqrt(2)), p.x + p.w, p.Y(1 / math.sqrt(2)), c=MUT, lw=1, dash="3 3"))
    o.append(p.line([(a / 1e6, abs(Hm(f0 + a, fu))) for a in fs], c=PUR, lw=2.0))
    o.append(p.line([(a / 1e6, abs(Hm(f0 + a, fv))) for a in fs], c=TEA, lw=2.0))
    o.append(D(p.X(0), p.Y(1 / math.sqrt(2)), INK, 3.6))
    o.append(T(p.X((fu - f0) / 1e6) - 3, p.Y(1.0) - 4, "u", "end", 10, PUR, True, halo=True))
    o.append(T(p.X((fv - f0) / 1e6) + 3, p.Y(1.0) - 4, "v", "start", 10, TEA, True, halo=True))
    o.append(T(p.X(0), p.Y(0.2), "L1: どちらも 0.71、", "middle", 9.5, INK, True, halo=True))
    o.append(T(p.X(0), p.Y(0.2) + 13, "位相 −45° と +45°", "middle", 9.5, INK, True, halo=True))
    q = Plot(xc + 30, 146, 200, 92, (-25, 25), (0, 20))
    o.append(q.axes(xl="L1 からの周波数 [MHz]", yl="軸比 [dB]", xt=[-20, -10, 0, 10, 20], yt=[0, 3, 10, 20], xfmt=_f08_m, yfmt=_f08_m))
    def arr(f):
        Ex = Hm(f, fu) + Hm(f, fv); Ey = Hm(f, fu) - Hm(f, fv)
        aR = abs(Ex + 1j * Ey) / math.sqrt(2); aL = abs(Ex - 1j * Ey) / math.sqrt(2)
        return 20 * math.log10((aR + aL) / max(abs(aR - aL), 1e-12))
    fine = np.linspace(-6e6, 6e6, 2401)
    ok = [a for a in fine if arr(f0 + a) <= 3.0]
    b0, b1 = min(ok) / 1e6, max(ok) / 1e6
    o.append(RECT(q.X(b0), q.y, q.X(b1) - q.X(b0), q.h, 0, GSOFT, "none", 0, op=0.7))
    o.append(q.clip([(a / 1e6, arr(f0 + a)) for a in fs], c=SIG, lw=2.2))
    o.append(W(q.x, q.Y(3), q.x + q.w, q.Y(3), c=MUT, lw=1, dash="3 3"))
    o.append(T(q.X(0), q.y + 13, "3 dB 以下: %.1f MHz" % (b1 - b0), "middle", 9.5, GRN, True, halo=True))
    o.append(TX(xc - 8, 290, "2 つのモードの周波数を f_0/Q だけ離すと、", "start", 9.5, INK))
    o.append(T(xc - 8, 306, "L1 で振幅が等しく位相が 90° ずれる", "start", 9.5, INK))
    return SVG(700, 316, o, "パッチを円偏波にする 2 つの方法（形は例）。(a) 縦と横の 2 つのモード（定在波の向き）を 2 つの給電点で別々に起こし、一方を 90° 遅らせる。(b) 1 点で給電し、パッチの 2 つの角を切ると、対角の向きの 2 つのモードの共振周波数がわずかに離れる。(c) 共振の鋭さ Q = 100（例の値）のとき、2 つのモードの共振周波数を f<sub>0</sub>/Q = 15.75 MHz 離すと、L1 はどちらのモードにとっても振幅が 1/√2 になる周波数で、位相が −45° と +45°（差 90°）になり、軸比が 0 dB になる。L1 から離れると軸比が悪くなり、3 dB 以下に保てるのは %.1f MHz の幅である。" % (b1 - b0))
F["e08_cpfeed"] = _f08_cpfeed_fig()


def _f08_gpidea_fig():
    o = []
    np = _f08_np
    # (a) 無限の地板
    o.append(T(14, 18, "(a) 無限に大きい地板", "start", 11.5, INK, True))
    yg, cx = 150, 180
    o.append(W(34, yg, 326, yg, c=MUT, lw=2.4))
    o.append(W(16, yg, 34, yg, c=MUT, lw=2.4, dash="2 4")); o.append(W(326, yg, 344, yg, c=MUT, lw=2.4, dash="2 4"))
    for r in (34, 60, 86, 112):
        o.append(PL(_f08_arc(cx, yg - 4, r, 2, 178), c=SIG, lw=1.3))
    o.append(_f08_patchicon(cx, yg - 2, 36))
    for sx in (-1, 1):
        x_ = cx + sx * 132
        o.append(DARR(x_, yg - 30, x_, yg - 4, c=PUR, lw=2.0, head=5))
    o.append(T(cx + 132, yg - 38, "残る", "middle", 9.5, PUR, True, halo=True))
    o.append(T(cx, 40, "電波は上の半分だけに出る", "middle", 9.5, SIG, True, halo=True))
    o.append(T(cx, yg + 26, "地板（どこまでも続く）", "middle", 9.5, MUT, True))
    o.append(T(cx, yg + 46, "下の半分には出ない", "middle", 9.5, MUT))
    o.append(T(30, yg - 38, "地平線の向きでも", "start", 9.5, PUR, True, halo=True))
    o.append(T(30, yg - 24, "垂直の成分は", "start", 9.5, PUR, True, halo=True))
    # (b) 有限の地板
    xb = 362
    o.append(W(352, 30, 352, 196, c=LIN, lw=0.8))
    o.append(T(xb, 18, "(b) 有限の地板: 縁で回り込む（回折）", "start", 11.5, INK, True))
    cxb, x0, x1 = 525, 455, 595
    o.append(W(x0, yg, x1, yg, c=MUT, lw=2.4))
    for r in (34, 60):
        o.append(PL(_f08_arc(cxb, yg - 4, r, 2, 178), c=SIG, lw=1.3))
    for xe, a0, a1 in ((x0, 95, 355), (x1, -175, 85)):
        for r in (14, 28, 42):
            o.append(PL(_f08_arc(xe, yg, r, a0, a1), c=ALI, lw=1.2, dash="4 3"))
        o.append(D(xe, yg, ALI, 3.2))
    o.append(_f08_patchicon(cxb, yg - 2, 36))
    o.append(T(cxb, 40, "上へ出る電波（直接）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(x0 - 6, yg + 62, "縁で回り込んだ電波", "middle", 9.5, ALI, True, halo=True))
    o.append(T(x0 - 6, yg + 76, "（下へも漏れる）", "middle", 9.5, ALI, True, halo=True))
    o.append(T(x1 + 52, yg - 26, "地平線: 約半分", "middle", 9.5, GLD, True, halo=True))
    o.append(T(x1 + 52, yg - 12, "（−6 dB）", "middle", 9.5, GLD, True, halo=True))
    o.append(T(cxb + 6, yg + 26, "地板", "middle", 9.5, MUT, True))
    # (c) 地平線の前後の電界
    yc = 238
    o.append(T(14, yc - 14, "(c) 地平線の前後の、垂直の成分の電界（2 次元の近似）", "start", 11.5, INK, True))
    p = Plot(60, yc, 290, 100, (-40, 40), (0, 1.25))
    o.append(p.axes(xl="仰角 θ [°]", yl="電界", xt=[-40, -20, 0, 20, 40], yt=[0, 0.5, 1], xfmt=_f08_m, yfmt=_f08_m))
    elI, dI = _f08_gp(None); el7, d7 = _f08_gp(70)
    ref = dI[list(elI).index(1.0)]
    def amp(dv):
        return 10 ** ((dv - ref) / 20)
    pin = [(e, 0.0) for e in range(-40, 0)] + [(0, 0.0)] + [(e, amp(v)) for e, v in zip(elI, dI) if 0 <= e <= 40]
    o.append(p.line(pin, c=MUT, lw=2.0, dash="5 3"))
    o.append(p.line([(e, amp(v)) for e, v in zip(el7, d7) if -40 <= e <= 40], c=SIG, lw=2.4))
    a0 = amp(d7[list(el7).index(0.0)])
    o.append(D(p.X(0), p.Y(a0), GLD, 4.2))
    o.append(T(p.X(0) + 7, p.Y(a0) + 4, "%.2f（%s dB）" % (a0, _f08_f(20 * math.log10(a0), 1)), "start", 9.5, GLD, True, halo=True))
    o.append(LEGL(390, yc + 6, [(MUT, "5 3", "無限の地板（地平線で段差）"), (SIG, None, "地板 70 mm（なめらか）")], 9.5, 16))
    o.append(T(390, yc + 56, "縁で回り込んだ電波が段差をならし、", "start", 9.5, INK))
    o.append(T(390, yc + 72, "境目（地平線）でほぼ半分になる。", "start", 9.5, INK))
    o.append(T(390, yc + 92, "下の半分にも電波が回り込む", "start", 9.5, ALI, True))
    o.append(T(390, yc + 108, "→ 真下の向きの後ろのローブ", "start", 9.5, ALI, True))
    return SVG(700, 380, o, "地板の働き。(a) 地板が無限に大きいと、下へ向かう電波は地板で跳ね返り、電波は上の半分だけに出る。地平線の向き（地板に沿う向き）でも、地板に垂直な成分は残る（1 節）。(b) 地板が有限だと、地板に沿って進む電波が縁で回り込み（回折）、縁を中心に広がる。(c) 地平線の前後の、垂直の成分の電界（地板が無限のときの、地平線のすぐ上の値を 1 とした。パッチは例の比誘電率 20 のもの。地板の奥行きを無限とした 2 次元の計算で、モーメント法による）。無限の地板では地平線を境に電界が急に 0 になるが、有限の地板では縁で回り込んだ電波が段差をならし、地平線でほぼ半分（約 −6 dB）になる。")
F["e08_gpidea"] = _f08_gpidea_fig()


def _f08_gpsize_fig():
    o = []
    np = _f08_np
    o.append(T(14, 18, "(a) 地板の大きさとパターン（2 次元の近似）", "start", 11.5, INK, True))
    cx, cy, R = 186, 180, 128
    gmin, gmax = -25.0, 5.0
    o.append(_f08_polar(cx, cy, R, gmin, gmax, [-20, -10, 0], full=True, lab=True, unit="[dB]"))
    o.append(T(cx, cy - R - 16, "真上", "middle", 9.5, INK, True))
    o.append(T(cx, cy + R + 16, "真下", "middle", 9.5, INK, True))
    o.append(T(cx - R - 10, cy + 4, "地平線", "end", 9.5, INK, True))
    o.append(T(cx + R + 10, cy + 4, "地平線", "start", 9.5, INK, True))
    sets = [(None, MUT, "5 3", "無限"), (50, ALI, None, "50 mm"), (70, GLD, None, "70 mm"), (150, GRN, None, "150 mm")]
    for sz, c, da, nm in sets:
        els, dv = _f08_gp(sz)
        if sz is None:
            sel = [(e, v) for e, v in zip(els, dv) if e >= 0]
        else:
            sel = list(zip(els, dv))
        ee = [a for a, _ in sel]; vv = [b for _, b in sel]
        for side in (1, -1):
            o.append(PL(_f08_ppts(cx, cy, R, gmin, gmax, ee, vv, side), c=c, lw=2.0 if sz else 1.6, dash=da))
    o.append(LEGL(30, 342, [(MUT, "5 3", "無限"), (ALI, None, "50 mm"), (GLD, None, "70 mm"), (GRN, None, "150 mm")], 9.5, 14))
    o.append(T(30, 366, "地板の一辺。無限の地板の真上を 0 dB にした", "start", 9.5, MUT))
    # (b) 大きさと、真上・地平線・真下
    xb = 392
    o.append(T(xb, 18, "(b) 地板の一辺と、向きごとの値", "start", 11.5, INK, True))
    p = Plot(xb + 46, 44, 230, 210, (30, 200), (-16, 5))
    o.append(p.axes(xl="地板の一辺 [mm]", yl="[dB]（無限の地板の真上を 0）", xt=[30, 50, 70, 100, 150, 200], yt=[-15, -10, -5, 0, 5], xfmt=_f08_m, yfmt=_f08_m))
    rows = []
    for s in _F08_GPS:
        els, dv = _f08_gp(s); L = list(els)
        rows.append((s, dv[L.index(90.0)], dv[L.index(0.0)], dv[L.index(-90.0)]))
    o.append(W(p.X(70), p.y, p.X(70), p.y + p.h, c=MUT, lw=1, dash="3 3"))
    o.append(T(p.X(70) + 4, p.y + 12, "70 mm", "start", 9.5, MUT, False, halo=True))
    for k, c, nm, dy in ((1, SIG, "真上", -8), (2, GLD, "地平線", -8), (3, ALI, "真下", 14)):
        o.append(p.line([(r[0], r[k]) for r in rows], c=c, lw=2.2))
        for r in rows:
            o.append(D(p.X(r[0]), p.Y(r[k]), c, 2.6))
        o.append(T(p.X(200) - 2, p.Y(rows[-1][k]) + dy, nm, "end", 9.5, c, True, halo=True))
    for s in (50, 150):
        r = [q for q in rows if q[0] == s][0]
        o.append(DARR(p.X(s), p.Y(r[1]) + 3, p.X(s), p.Y(r[3]) - 3, c=INK, lw=1.0, head=5))
        o.append(T(p.X(s) + 5, (p.Y(r[1]) + p.Y(r[3])) / 2 + 4, "前後比 %.1f dB" % (r[1] - r[3]), "start", 9.5, INK, True, halo=True))
    o.append(T(xb, 300, "大きい地板ほど真下へ漏れる電波（後ろのローブ）が", "start", 9.5, INK))
    o.append(T(xb, 316, "小さく、真上が強い。地平線は大きさによらず約 −6 dB", "start", 9.5, INK))
    o.append(T(xb, 336, "（1 波長 = 190 mm より大きいと、大きさの効き方が", "start", 9.5, MUT))
    o.append(T(xb, 352, "小さくなる）", "start", 9.5, MUT))
    return SVG(700, 376, o, "地板の大きさによるパターンの違い（例の比誘電率 20 のパッチを、正方形の地板の中心に置いた。地板の奥行きを無限とした 2 次元のモーメント法の計算で、パッチの 2 つの縁を通る切り口の、地板に垂直な成分。値は無限の地板の真上に対する [dB]）。(a) 地板が小さいほど、真下へ漏れる電波（後ろのローブ）が大きく、真上が弱い。(b) 真上・地平線・真下の値と、地板の一辺。真上と真下の差（前後比）は、地板 50 mm で 3.1 dB、150 mm で 13.7 dB。地平線の値は、地板の大きさによらず、無限の地板のときより約 6 dB 低い。実際の 3 次元の地板では値が変わるので、傾向として見る。")
F["e08_gpsize"] = _f08_gpsize_fig()
