# -*- coding: utf-8 -*-
# 16 章 DGNSS と SBAS の図
import numpy as _f16_np

# =====================================================================
# 例の値（本文・デモと同じ）
# =====================================================================
_F16_C = 299792458.0
_F16_D2R = math.pi / 180
_F16_TOK = GNSS_TOKYO                      # 1 章の例の受信機（東京駅のあたり）
# 7 章 6 節の誤差の予算（1σ、代表値）: 衛星の時計と軌道・電離層・対流圏・マルチパス・受信機の雑音
_F16_B7 = [1.5, 3.5, 0.4, 1.0, 0.5]
_F16_SRC = [("衛星の時計と軌道", PUR), ("電離層", GLD), ("対流圏", GRN), ("マルチパス", ALI), ("受信機の雑音", TEA)]
_F16_MREF, _F16_EREF = 0.3, 0.3            # 基準局のマルチパスと雑音（例の値）
# 共通の誤差の、場所と時刻による違いのモデル（例の値）: 相関係数 exp(−(d/D)² − (τ/τ_c)²)
_F16_SI, _F16_DI, _F16_TI = 3.5, 1000.0, 1800.0     # 電離層: σ [m]・相関の距離 [km]・相関の時間 [s]
_F16_ST, _F16_DT, _F16_TT = 0.4, 100.0, 3600.0      # 対流圏
_F16_SS, _F16_TS = 1.5, 7200.0                      # 衛星の時計と軌道（時間の変化）
_F16_SORB, _F16_RSAT = 1.0, 20200.0                 # 軌道の誤差 [m]・衛星までの距離 [km]（場所の違いの上限 σ d / r）
_F16_SBAS = [0.5, 0.7, 0.4, 1.0, 0.5]               # SBAS で直した後（代表値・例の値）


def _f16_m(v, d=1):
    """負の数の − を全角の負号にした数。"""
    s = ("%%.%df" % d) % v
    if s.lstrip("-").strip("0.") == "":
        s = s.lstrip("-")
    return s.replace("-", "−")


def _f16_g(v, d=1):
    """3 桁ごとに空白を入れた数（−3 953 221.1 など）。"""
    s = _f16_m(abs(v), d)
    ip, _, fp = s.partition(".")
    ip = "{:,}".format(int(ip)).replace(",", " ")
    return ("−" if v < 0 else "") + ip + ("." + fp if fp else "")


def _f16_res(sig, d, D, tau, Tc):
    """差の標準偏差 σ √(2{1 − exp(−(d/D)² − (τ/τ_c)²)})。"""
    x = (d / D) ** 2 + (tau / Tc) ** 2
    return sig * math.sqrt(2 * (1 - math.exp(-x)))


def _f16_common(d, tau):
    """DGNSS の後に残る共通の誤差 [衛星の時計と軌道, 電離層, 対流圏]（1σ [m]）。"""
    s = math.sqrt((_F16_SORB * d / _F16_RSAT) ** 2 + _f16_res(_F16_SS, 0, 1, tau, _F16_TS) ** 2)
    return [s, _f16_res(_F16_SI, d, _F16_DI, tau, _F16_TI), _f16_res(_F16_ST, d, _F16_DT, tau, _F16_TT)]


def _f16_budget(d, tau, mref=_F16_MREF, eref=_F16_EREF):
    s, i, t = _f16_common(d, tau)
    return [s, i, t, math.hypot(_F16_B7[3], mref), math.hypot(_F16_B7[4], eref)]


def _f16_uere(v):
    return math.sqrt(sum(x * x for x in v))


# ---- 空の配置（1 章・6 章・7 章と同じ: GPS、時刻 0、東京） ----
def _f16_visible(t=0.0):
    out = []
    for s in gnss_const():
        if s["sys"] != "GPS":
            continue
        el, az, d = elaz(*_F16_TOK, sat_ecef(s, t))
        if el > 0:
            out.append((s["nm"], el, az, d, s))
    return sorted(out, key=lambda q: -q[1])


_F16_VL = _f16_visible()                  # 東京の 8 つの衛星（仰角の高い順）
_F16_G = _f16_np.array([[-math.cos(q[1] * _F16_D2R) * math.sin(q[2] * _F16_D2R), -math.cos(q[1] * _F16_D2R) * math.cos(q[2] * _F16_D2R),
                         -math.sin(q[1] * _F16_D2R), 1.0] for q in _F16_VL])
_F16_H = _f16_np.linalg.inv(_F16_G.T @ _F16_G)
_F16_A = _F16_H @ _F16_G.T
_F16_HDOP = math.sqrt(_F16_H[0, 0] + _F16_H[1, 1])
_F16_VDOP = math.sqrt(_F16_H[2, 2])


def _f16_ell(C2):
    a, b, c = C2[0][0], C2[0][1], C2[1][1]
    m = (a + c) / 2
    r = math.sqrt(((a - c) / 2) ** 2 + b * b)
    return math.sqrt(m + r), math.sqrt(max(m - r, 0.0)), 0.5 * math.degrees(math.atan2(2 * b, a - c))


def _f16_ellpts(s1, s2, ang, n=96):
    ca, sa = math.cos(ang * _F16_D2R), math.sin(ang * _F16_D2R)
    return [(s1 * math.cos(2 * math.pi * i / n) * ca - s2 * math.sin(2 * math.pi * i / n) * sa,
             s1 * math.cos(2 * math.pi * i / n) * sa + s2 * math.sin(2 * math.pi * i / n) * ca) for i in range(n + 1)]


def _f16_pin(R, s1, s2, n=2000):
    ph = _f16_np.linspace(0, 2 * math.pi, n, endpoint=False)
    q = _f16_np.cos(ph) ** 2 / s1 ** 2 + _f16_np.sin(ph) ** 2 / s2 ** 2
    return float(_f16_np.mean((1 - _f16_np.exp(-R * R * q / 2)) / q) / (s1 * s2))


def _f16_rad(p, s1, s2):
    lo, hi = 0.0, 10 * (s1 + s2)
    for _ in range(70):
        m = (lo + hi) / 2
        if _f16_pin(m, s1, s2) < p:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


_F16_S1, _F16_S2, _F16_ANG = _f16_ell(_F16_H[:2, :2])     # σ = 1 m の誤差の楕円（0.76 m × 0.57 m）
_F16_KCEP = _f16_rad(0.5, _F16_S1, _F16_S2)                # CEP = 0.781 × UERE
_F16_K95 = _f16_rad(0.95, _F16_S1, _F16_S2)                # R95 = 1.663 × UERE


def _f16_acc(u):
    """UERE u [m] から（CEP, R95, 上下の 95 %）[m]（東京の 8 つの衛星）。"""
    return _F16_KCEP * u, _F16_K95 * u, 1.96 * _F16_VDOP * u


# ---- widgets.js の U.rng(seed) と同じ乱数（図とデモで同じ場を作るため） ----
class _F16Rng:
    def __init__(self, seed):
        self.a = (seed & 0xFFFFFFFF) or 1

    def next(self):
        M = 0xFFFFFFFF
        a = (self.a + 0x6D2B79F5) & M
        self.a = a
        t = ((a ^ (a >> 15)) * (1 | a)) & M
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & M)) & M) ^ t
        return ((t ^ (t >> 14)) & M) / 4294967296.0

    def normal(self):
        u = 1 - self.next()
        v = self.next()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


def _f16_modes(seed, n=120):
    """不規則な場の成分（向きと大きさを決める 2 つの正規分布の数と位相）。デモの _w16_modes と同じ。"""
    r = _F16Rng(seed)
    out = []
    for _ in range(n):
        gx = r.normal()
        gy = r.normal()
        out.append((gx, gy, 2 * math.pi * r.next()))
    return out


def _f16_field(md, sig, D, x, y):
    """相関係数 exp(−(d/D)²) の不規則な場の値（x, y [km]）。σ √(2/N) Σ cos((√2/D) g·p + φ)。"""
    s = math.sqrt(2) / D
    a = sig * math.sqrt(2.0 / len(md))
    return a * sum(math.cos(s * (gx * x + gy * y) + ph) for gx, gy, ph in md)


# ---- 7 章のモデル（クロブッチャー・対流圏）と、電離層の薄い殻 ----
_F16_KA = [0.1118e-7, -0.7451e-8, -0.5961e-7, 0.1192e-6]
_F16_KP = [0.1167e6, -0.2294e6, -0.1311e6, 0.1049e7]
_F16_TG = 14 * 3600 - _F16_TOK[1] / 15 * 3600            # 東京の地方時 14 時の GPS 時刻（その日の秒）
_F16_RE, _F16_HI = 6371.0, 350.0


def _f16_klob(latd, lond, eld, azd, tgps=_F16_TG):
    """クロブッチャー・モデルの L1 の遅れ [m]（7 章 2 節と同じ手順）。"""
    phu, lmu, E, A = latd / 180, lond / 180, eld / 180, azd * _F16_D2R
    psi = 0.0137 / (E + 0.11) - 0.022
    phi = max(-0.416, min(0.416, phu + psi * math.cos(A)))
    lam = lmu + psi * math.sin(A) / math.cos(phi * math.pi)
    phm = phi + 0.064 * math.cos((lam - 1.617) * math.pi)
    t = (4.32e4 * lam + tgps) % 86400.0
    F = 1.0 + 16.0 * (0.53 - E) ** 3
    PER = max(sum(_F16_KP[n] * phm ** n for n in range(4)), 72000.0)
    AMP = max(sum(_F16_KA[n] * phm ** n for n in range(4)), 0.0)
    x = 2 * math.pi * (t - 50400.0) / PER
    Tv = 5e-9 + AMP * (1 - x * x / 2 + x ** 4 / 24) if abs(x) < 1.57 else 5e-9
    return F * Tv * _F16_C


def _f16_mT(eld):
    s = math.sin(eld * _F16_D2R)
    return 1.001 / math.sqrt(0.002001 + s * s)


def _f16_mI(eld):
    s = _F16_RE * math.cos(eld * _F16_D2R) / (_F16_RE + _F16_HI)
    return 1 / math.sqrt(1 - s * s)


_F16_ZT = 0.0022768 * 1013.25 / (1 - 0.00266 * math.cos(2 * _F16_TOK[0] * _F16_D2R) - 0.00028 * _F16_TOK[2] / 1000) + 0.10


def _f16_ipp(B, L, el, az):
    """電離層を通る点（高さ 350 km の殻）の緯度・経度 [°]。"""
    e, a = el * _F16_D2R, az * _F16_D2R
    psi = math.pi / 2 - e - math.asin(_F16_RE * math.cos(e) / (_F16_RE + _F16_HI))
    b = math.asin(math.sin(B * _F16_D2R) * math.cos(psi) + math.cos(B * _F16_D2R) * math.sin(psi) * math.cos(a))
    l = L * _F16_D2R + math.asin(math.sin(psi) * math.sin(a) / math.cos(b))
    return b / _F16_D2R, l / _F16_D2R


# ---- 4 節の電離層の本当の天頂の遅れ（クロブッチャー・モデルの天頂の値 + モデルからのずれ）。デモと同じ ----
_F16_KX = 111.32 * math.cos(35 * _F16_D2R)
_F16_KY = 110.6
_F16_GSEED = 38
_F16_GMD = _f16_modes(_F16_GSEED)
_F16_GMS = _f16_modes(_F16_GSEED + 100)


def _f16_truth(B, L, small=False):
    x, y = (L - 137.5) * _F16_KX, (B - 35.0) * _F16_KY
    v = _f16_klob(B, L, 90.0, 0.0) + _f16_field(_F16_GMD, 1.2, 1000.0, x, y)
    if small:
        v += _f16_field(_F16_GMS, 0.4, 150.0, x, y)
    return v


def _f16_interp(Bp, Lp, small=False):
    B1, L1 = math.floor(Bp / 5) * 5, math.floor(Lp / 5) * 5
    xi, ze = (Lp - L1) / 5, (Bp - B1) / 5
    c = {"SW": _f16_truth(B1, L1, small), "SE": _f16_truth(B1, L1 + 5, small), "NE": _f16_truth(B1 + 5, L1 + 5, small), "NW": _f16_truth(B1 + 5, L1, small)}
    w = {"SW": (1 - xi) * (1 - ze), "SE": xi * (1 - ze), "NE": xi * ze, "NW": (1 - xi) * ze}
    return sum(c[k] * w[k] for k in c), c, w, (B1, L1, xi, ze)


# ---- 絵の部品 ----
def _f16_sat(x, y, c=SIG, s=1.0):
    """衛星の印（1 章・7 章と同じ見た目）。"""
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f16_rx(x, y, c=GRN):
    """受信機の印（地面に置いたアンテナ。1 章・7 章と同じ見た目）。(x, y) はアンテナの頭。"""
    return W(x - 6, y + 6, x + 6, y + 6, c=c, lw=1.6) + W(x, y + 6, x, y, c=c, lw=1.4) + D(x, y - 1, c, 3.4)


def _f16_base(x, y, c=PUR):
    """基準局の印（三脚の上のアンテナ）。(x, y) はアンテナの頭。"""
    return (W(x - 8, y + 16, x, y + 2, x + 8, y + 16, c=c, lw=1.4) + W(x, y + 2, x, y + 16, c=c, lw=1.2)
            + RECT(x - 7, y - 3, 14, 5, 1.5, soft(c), c, 1.2) + D(x, y - 5, c, 2.6))


def _f16_heat(p, fn, xs, ys, vmin, vmax, c=GLD, nlev=10, omax=0.62):
    """値の大きさを色の濃さで描く（同じ濃さの升を 1 本の path にまとめる）。xs・ys は升の境目の値。"""
    paths = [[] for _ in range(nlev)]
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            v = fn((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2)
            k = int(max(0, min(nlev - 1, math.floor((v - vmin) / (vmax - vmin) * nlev))))
            x0, x1 = p.X(xs[i]), p.X(xs[i + 1])
            y0, y1 = p.Y(ys[j + 1]), p.Y(ys[j])
            paths[k].append("M%.1f %.1fh%.1fv%.1fh%.1fz" % (x0, y0, x1 - x0 + 0.3, y1 - y0 + 0.3, -(x1 - x0 + 0.3)))
    o = []
    for k, ps in enumerate(paths):
        if ps:
            o.append('<path d="%s" fill="%s" fill-opacity="%.3f" stroke="none"/>' % ("".join(ps), c, omax * (k + 0.5) / nlev))
    return "".join(o)


def _f16_scale(x, y, w, vmin, vmax, lab, c=GLD, nlev=10, omax=0.62, fmt=lambda v: _f16_m(v, 0)):
    """色の濃さの目盛（横長の帯）。"""
    o = []
    for k in range(nlev):
        o.append('<rect x="%.1f" y="%.1f" width="%.1f" height="9" fill="%s" fill-opacity="%.3f"/>' % (x + w * k / nlev, y, w / nlev + 0.3, c, omax * (k + 0.5) / nlev))
    o.append(RECT(x, y, w, 9, 0, "none", LIN, 0.8))
    o.append(T(x, y + 21, fmt(vmin), "middle", 9.5, MUT))
    o.append(T(x + w, y + 21, fmt(vmax), "middle", 9.5, MUT))
    o.append(T(x + w / 2, y + 21, lab, "middle", 9.5, MUT))
    return "".join(o)


# =====================================================================
# 1 節: 共通の誤差と受信機ごとの誤差
# =====================================================================
def _f16_common_fig():
    o = []
    o.append(T(14, 18, "(a) 同じ衛星の電波を受ける 2 つの受信機（10 km 離れた例）", "start", 11.5, INK, True))
    sx, sy = 196, 50
    r1, r2 = (112, 300), (262, 300)
    o.append(RECT(18, 100, 356, 40, 4, GOSOFT, "none", 0))
    o.append(W(18, 120, 374, 120, c=GLD, lw=1, dash="4 3"))
    o.append(T(24, 114, "電離層", "start", 10, GLD, True))
    o.append(T(370, 134, "高さ 350 km の殻", "end", 9.5, GLD, False, halo=True))
    o.append(RECT(18, 232, 356, 44, 4, GSOFT, "none", 0))
    o.append(T(24, 247, "対流圏", "start", 10, GRN, True))
    o.append(W(18, 306, 374, 306, c=MUT, lw=1.4))
    # 2 本の電波の道
    for (rx, ry) in (r1, r2):
        o.append(W(sx, sy + 6, rx, ry - 4, c=SIG, lw=1.6))
    def at_y(rx, ry, yy):
        t = (yy - (sy + 6)) / ((ry - 4) - (sy + 6))
        return sx + t * (rx - sx)
    pa, pb = at_y(*r1, 120), at_y(*r2, 120)
    o.append(D(pa, 120, GLD, 4)); o.append(D(pb, 120, GLD, 4))
    o.append(DIM(pa, 156, pb, 156, None, c=GLD))
    o.append(T((pa + pb) / 2, 172, "電離層を通る 2 点の間 ≈ 受信機の間の距離", "middle", 9.5, GLD, True, halo=True))
    for (rx, ry) in (r1, r2):
        ta, tb = at_y(rx, ry, 232), at_y(rx, ry, 276)
        o.append(W(ta, 232, tb, 276, c=GRN, lw=3.2))
    o.append(_f16_sat(sx, sy, SIG, 1.15))
    o.append(T(sx - 26, sy - 2, "衛星 i（2 万 km 先）", "end", 9.5, SIG, True))
    o.append(T(sx - 26, sy + 12, "2 本の道の向きの違いは 0.03°", "end", 9.5, SIG))
    # 受信機 2 の近くの建物と反射波
    bx = 300
    o.append(RECT(bx, 196, 38, 110, 2, MSOFT, MUT, 1.2))
    o.append(T(bx + 19, 192, "建物", "middle", 9.5, MUT))
    wy = 214
    o.append(W(sx + 4, sy + 8, bx, wy, c=ALI, lw=1.3, dash="5 3"))
    o.append(ARR(bx, wy, r2[0] + 3, r2[1] - 6, c=ALI, lw=1.3, dash="5 3"))
    o.append(T(bx + 42, 236, "反射波", "start", 9.5, ALI, True))
    o.append(TX(bx + 42, 251, "M_i", "start", 10, ALI, True))
    for k, (rx, ry) in enumerate((r1, r2)):
        o.append(_f16_rx(rx, ry, GRN))
        o.append(T(rx, ry + 24, "受信機 %d" % (k + 1), "middle", 10, GRN, True))
        o.append(T(rx, ry + 38, "中の熱雑音", "middle", 9.5, TEA))
    o.append(DIM(r1[0], 352, r2[0], 352, "10 km", c=MUT))
    # (b) 分け方
    x0 = 398
    o.append(T(x0, 18, "(b) 5 つの源の分け方（記号は 7 章 1 節）", "start", 11.5, INK, True))
    rows1 = [("δr_i^s", PUR, "衛星の時計と軌道", "同じ衛星の同じ誤差。軌道は視線の向きの成分"),
             ("I_i", GLD, "電離層", "電波が通る所の差は、受信機の間の距離ほど"),
             ("T_i", GRN, "対流圏", "同じく、電波が通る所の大気がほぼ同じ")]
    rows2 = [("M_i", ALI, "マルチパス", "アンテナの周りの地面や建物で決まる"),
             ("ε_i", TEA, "受信機の雑音", "それぞれの受信機の中の熱雑音")]
    def block(y, title, rows, c):
        h = 30 + len(rows) * 44
        out = [RECT(x0, y, 292, h, 7, soft(c), c, 1.2), T(x0 + 10, y + 19, title, "start", 10.5, c, True)]
        for i, (sym, sc, nm, why) in enumerate(rows):
            yy = y + 44 + i * 44
            out.append(TX(x0 + 12, yy, sym, "start", 12.5, sc, True))
            out.append(T(x0 + 56, yy, nm, "start", 10.5, INK, True))
            out.append(T(x0 + 56, yy + 16, why, "start", 9.5, MUT))
        return "".join(out), h
    s, h = block(34, "共通の誤差（ほぼ同じ量で入る）", rows1, PUR)
    o.append(s)
    s2, h2 = block(34 + h + 14, "受信機ごとの誤差（違う量で入る）", rows2, ALI)
    o.append(s2)
    return SVG(700, 372, o, "近くの 2 つの受信機が同じ衛星の電波を受けるときの、5 つの誤差の源（模式図。高さと距離の比は実際と違う）。")


F["e16_common"] = _f16_common_fig()


# =====================================================================
# 1 節: 2 つの受信機の誤差の時間の変化と、その差
# =====================================================================
def _f16_twin_data():
    rng = _f16_np.random.default_rng(1601)
    t = _f16_np.arange(0, 1801, 1.0)
    el = 25 + 15 * t / 1800.0                       # 衛星が昇っていく（仰角 25° → 40°）
    mi = _f16_np.array([_f16_mI(e) for e in el])
    mt = _f16_np.array([_f16_mT(e) for e in el])
    sat = 0.6 + 0.3 * t / 1800.0
    iono = 4.3 * mi * (1 + 0.04 * _f16_np.sin(2 * math.pi * t / 1500.0))
    tro = _F16_ZT * mt
    com = sat + iono + tro
    def mp(seed):
        r = _f16_np.random.default_rng(seed)
        per = r.uniform(140, 520, 3); amp = _f16_np.array([1.0, 0.8, 0.5]); ph = r.uniform(0, 2 * math.pi, 3)
        v = sum(amp[k] * _f16_np.sin(2 * math.pi * t / per[k] + ph[k]) for k in range(3))
        return v / math.sqrt((amp ** 2).sum() / 2)
    m1, m2 = mp(11), mp(23)
    e1, e2 = rng.normal(0, 0.5, t.size), rng.normal(0, 0.5, t.size)
    dc = 0.03 + 0.02 * _f16_np.sin(2 * math.pi * t / 1300.0)   # 10 km 離れた共通の誤差の差（0.05 m ほど）
    return t, com, com + m1 + e1, com + dc + m2 + e2


def _f16_twin_fig():
    t, com, y1, y2 = _f16_twin_data()
    o = []
    k = _f16_np.arange(0, t.size, 5)
    o.append(T(14, 18, "(a) 擬似距離の誤差（同じ衛星。衛星の時計の補正の後、電離層と対流圏のモデルは使わない）", "start", 11.5, INK, True))
    p = Plot(70, 34, 600, 150, (0, 30), (0, 20))
    o.append(p.axes(yl="誤差 [m]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 5, 10, 15, 20], xfmt=lambda v: ""))
    o.append(p.line([(t[i] / 60, y2[i]) for i in k], c=GLD, lw=1.3))
    o.append(p.line([(t[i] / 60, y1[i]) for i in k], c=SIG, lw=1.3))
    o.append(p.line([(t[i] / 60, com[i]) for i in k], c=INK, lw=1.6, dash="5 3"))
    o.append(LEGL(80, 54, [(SIG, None, "受信機 1"), (GLD, None, "受信機 2"), (INK, "5 3", "共通の誤差 δr_i^s + I_i + T_i")], 10))
    o.append(T(14, 222, "(b) 2 つの誤差の差（受信機 1 − 受信機 2）", "start", 11.5, INK, True))
    q = Plot(70, 236, 600, 120, (0, 30), (-5, 5))
    o.append(q.axes(xl="時間 t [min]", yl="差 [m]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[-5, 0, 5]))
    sd = math.sqrt(2 * 1.0 ** 2 + 2 * 0.5 ** 2)
    o.append(RECT(q.X(0), q.Y(sd), q.w, q.Y(-sd) - q.Y(sd), 0, GSOFT, "none", 0))
    o.append(q.line([(t[i] / 60, y1[i] - y2[i]) for i in k], c=GRN, lw=1.3))
    o.append(TX(q.x + q.w - 4, q.Y(sd) - 5, "M_1 − M_2 + ε_1 − ε_2 の広がり ±%.2f m（1σ）" % sd, "end", 9.5, GRN, True, halo=True))
    return SVG(700, 392, o, "近くの 2 つの受信機（10 km）で同じ衛星の擬似距離の誤差を 30 分記録した例（モデルで作った値。マルチパスは 1 m、受信機の雑音は 0.5 m の 1σ）。")


F["e16_twin"] = _f16_twin_fig()


# =====================================================================
# 2 節: DGNSS の流れ
# =====================================================================
def _f16_flow_fig():
    o = []
    sats = [(236, 34), (350, 24), (464, 34)]
    bx, rx = (60, 96), (470, 96)
    for (x, y) in sats:
        o.append(W(x, y + 6, bx[0], bx[1] - 6, c=SIG, lw=0.9))
        o.append(W(x, y + 6, rx[0], rx[1] - 4, c=SIG, lw=0.9))
    for (x, y) in sats:
        o.append(_f16_sat(x, y, SIG, 0.95))
    o.append(T(350, 50, "同じ衛星の電波", "middle", 9.5, SIG, True, halo=True))
    # 基準局
    o.append(RECT(14, 112, 286, 116, 8, PSOFT, PUR, 1.3))
    o.append(_f16_base(bx[0], bx[1], PUR))
    o.append(T(84, 104, "基準局（位置を測量で決めた点）", "start", 10.5, PUR, True))
    o.append(TX(26, 136, "① 自分の位置と、エフェメリスから計算した", "start", 10, INK))
    o.append(TX(44, 152, "衛星の位置 → 本当の距離 r_{ref,i}", "start", 10, INK))
    o.append(TX(26, 176, "② 測った擬似距離 ρ_{ref,i}", "start", 10, INK))
    o.append(TX(26, 200, "③ PRC_i = r_{ref,i} − ρ_{ref,i}（衛星ごと）", "start", 10, PUR, True))
    # 移動局
    o.append(RECT(426, 112, 260, 116, 8, GSOFT, GRN, 1.3))
    o.append(_f16_rx(rx[0], rx[1] + 2, GRN))
    o.append(T(486, 104, "移動局", "start", 10.5, GRN, True))
    o.append(TX(438, 136, "④ 自分が測った擬似距離 ρ_{rov,i} に", "start", 10, INK))
    o.append(TX(456, 152, "PRC_i を足す", "start", 10, INK))
    o.append(TX(438, 176, "⑤ 6 章の最小二乗法で、位置と", "start", 10, INK))
    o.append(TX(456, 192, "時計のずれ b' = b_{rov} − b_{ref} を求める", "start", 10, INK))
    o.append(T(438, 216, "（④⑤ は 2 節の導出）", "start", 9.5, MUT))
    # 補正の流れ
    o.append(ARR(304, 170, 422, 170, c=PUR, lw=2.4, head=9))
    o.append(TX(363, 148, "PRC_i（衛星ごと）", "middle", 9.5, PUR, True))
    o.append(T(363, 162, "時刻・基準局の番号", "middle", 9.5, PUR, True))
    o.append(T(363, 188, "無線・インターネット", "middle", 9.5, MUT))
    o.append(T(363, 201, "（5 節）", "middle", 9.5, MUT))
    return SVG(700, 240, o, "DGNSS の流れ。基準局が衛星ごとの補正値を作り、移動局が自分の擬似距離に足す。")


F["e16_flow"] = _f16_flow_fig()


# =====================================================================
# 2 節: 項ごとの対応（何が消え、何が残るか）
# =====================================================================
def _f16_cancel_fig():
    o = []
    cols = [("本当の距離", INK), ("時計のずれ", INK), ("衛星の時計と軌道", PUR), ("電離層", GLD), ("対流圏", GRN), ("マルチパス", ALI), ("受信機の雑音", TEA)]
    x0, cw = 168, 75
    xs = [x0 + cw * (k + 0.5) for k in range(7)]
    y0 = 30
    # 共通の誤差・受信機ごとの誤差の帯
    o.append(RECT(x0 + 2 * cw + 2, y0 - 4, 3 * cw - 4, 204, 6, PSOFT, "none", 0))
    o.append(RECT(x0 + 5 * cw + 2, y0 - 4, 2 * cw - 4, 204, 6, ASOFT, "none", 0))
    o.append(T(x0 + 3.5 * cw, y0 + 214, "共通の誤差", "middle", 10, PUR, True))
    o.append(T(x0 + 6 * cw, y0 + 214, "受信機ごとの誤差", "middle", 10, ALI, True))
    for k, (nm, c) in enumerate(cols):
        o.append(T(xs[k], y0 + 10, nm, "middle", 9.5, c, True))
    rows = [("基準局が測る", "ρ_{ref,i}", INK, ["r_{ref,i}", "b_{ref}", "δr_i^s", "I_{ref,i}", "T_{ref,i}", "M_{ref,i}", "ε_{ref,i}"]),
            ("補正値 = r_{ref,i} − ρ_{ref,i}", "PRC_i", PUR, ["（消える）", "−b_{ref}", "−δr_i^s", "−I_{ref,i}", "−T_{ref,i}", "−M_{ref,i}", "−ε_{ref,i}"]),
            ("移動局が測る", "ρ_{rov,i}", INK, ["r_{rov,i}", "b_{rov}", "δr_i^s", "I_{rov,i}", "T_{rov,i}", "M_{rov,i}", "ε_{rov,i}"]),
            ("補正値を足す", "ρ_{rov,i} + PRC_i", GRN, ["r_{rov,i}", "b_{rov} − b_{ref}", "0", "≈ 0", "≈ 0", "M_{rov,i} − M_{ref,i}", "ε_{rov,i} − ε_{ref,i}"])]
    for r, (lab, lhs, c, cells) in enumerate(rows):
        yy = y0 + 42 + r * 38
        if r == 3:
            o.append(W(14, yy - 22, 690, yy - 22, c=MUT, lw=1))
        o.append(TX(14, yy - 4, lab, "start", 9.5, MUT))
        o.append(TX(14, yy + 11, lhs + " =", "start", 11, c, True))
        for k, s in enumerate(cells):
            cc = cols[k][1] if r != 1 else PUR
            if r == 3 and k in (2, 3, 4):
                cc = GRN
            sz = 10 if (r == 3 and k >= 5) else 11
            o.append(TX(xs[k], yy + 4, s, "middle", sz, cc, r == 3))
            if k > 0 and r in (0, 2):
                o.append(T(xs[k] - cw / 2, yy + 4, "+", "middle", 10, MUT))
    # 一番下の行の意味
    yn = y0 + 42 + 3 * 38 + 26
    notes = [("求めたい", INK), ("全部の衛星に", INK), ("消える", GRN), ("近くでは", GRN), ("近くでは", GRN), ("残る", ALI), ("残る", TEA)]
    for k, (s, c) in enumerate(notes):
        o.append(T(xs[k], yn, s, "middle", 9.5, c, True))
    for k, s in ((1, "同じ → b'"), (3, "消える"), (4, "消える")):
        o.append(T(xs[k], yn + 14, s, "middle", 9.5, INK if k == 1 else GRN, True))
    return SVG(700, 262, o, "基準局と移動局の擬似距離の各項と、補正値を足したときに消える項と残る項（衛星 i について。2 節の導出の式を、源ごとの列に並べた）。")


F["e16_cancel"] = _f16_cancel_fig()


# =====================================================================
# 2 節: 数値の例（東京の 8 つの衛星、基準局は西へ 10 km）
# =====================================================================
_F16_BREF, _F16_BROV = 0.5e-6 * _F16_C, 1e-3 * _F16_C
_F16_REF = (_F16_TOK[0], _F16_TOK[1] - 10.0 / (111.32 * math.cos(_F16_TOK[0] * _F16_D2R)), _F16_TOK[2])


def _f16_ex2(seed=49):
    """2 節の例（検算の ex2.py と同じ計算）。7 章の大きさの誤差を乱数で作り、補正値と補正の後の誤差を求める。"""
    rng = _f16_np.random.default_rng(seed)
    rows = []
    for q in _F16_VL:
        p = sat_ecef(q[4], 0.0)
        el_r, az_r, _ = elaz(*_F16_REF, p)
        rows.append(dict(nm=q[0], el=q[1], az=q[2], el_r=el_r, az_r=az_r))
    for r in rows:
        r["sat"] = rng.normal(0, 1.5)
        r["Ik_rov"] = _f16_klob(_F16_TOK[0], _F16_TOK[1], r["el"], r["az"]); r["Ik_ref"] = _f16_klob(_F16_REF[0], _F16_REF[1], r["el_r"], r["az_r"])
        r["Tk_rov"] = _F16_ZT * _f16_mT(r["el"]); r["Tk_ref"] = _F16_ZT * _f16_mT(r["el_r"])
        r["dI"] = 0.5 * r["Ik_ref"] * rng.normal(); r["dT"] = 0.05 * _f16_mT(r["el_r"]) * rng.normal()
        r["dI2"] = rng.normal(0, _f16_res(_F16_SI, 10, _F16_DI, 0, _F16_TI)); r["dT2"] = rng.normal(0, _f16_res(_F16_ST, 10, _F16_DT, 0, _F16_TT))
        r["M_ref"] = rng.normal(0, _F16_MREF); r["e_ref"] = rng.normal(0, _F16_EREF)
        r["M_rov"] = rng.normal(0, 1.0); r["e_rov"] = rng.normal(0, 0.5)
    for r in rows:
        r["I_ref"] = r["Ik_ref"] + r["dI"]; r["I_rov"] = r["Ik_rov"] + r["dI"] + r["dI2"]
        r["T_ref"] = r["Tk_ref"] + r["dT"]; r["T_rov"] = r["Tk_rov"] + r["dT"] + r["dT2"]
        r["err_ref"] = r["sat"] + r["I_ref"] + r["T_ref"] + r["M_ref"] + r["e_ref"]
        r["err_rov"] = r["sat"] + r["I_rov"] + r["T_rov"] + r["M_rov"] + r["e_rov"]
        r["PRC"] = -(_F16_BREF + r["err_ref"])
        r["after"] = r["err_rov"] - r["err_ref"]
        r["model"] = r["err_rov"] - r["Ik_rov"] - r["Tk_rov"]
    return rows


_F16_EX2 = _f16_ex2()


def _f16_prc_fig():
    rows = _F16_EX2
    o = []
    o.append(T(14, 18, "(a) 基準局が測った誤差の内訳（時計のずれを除く）と、補正値", "start", 11.5, INK, True))
    o.append(T(500, 18, "(b) 移動局の、補正の後の誤差", "start", 11.5, INK, True))
    pa = Plot(112, 34, 262, 8 * 26, (-6, 40), (0, 1))
    pb = Plot(518, 34, 170, 8 * 26, (-3, 3), (0, 1))
    o.append(pa.axes(xl="誤差 [m]", yl=None, xt=[0, 10, 20, 30, 40], yt=[]))
    o.append(pb.axes(xl="誤差 [m]", yl=None, xt=[-3, -2, -1, 0, 1, 2, 3], yt=[]))
    o.append(W(pa.X(0), pa.y, pa.X(0), pa.y + pa.h, c=MUT, lw=1.2))
    o.append(W(pb.X(0), pb.y, pb.X(0), pb.y + pb.h, c=MUT, lw=1.2))
    o.append(TX(436, 30, "PRC_i [m]", "middle", 10, PUR, True))
    keys = [("sat", PUR), ("I_ref", GLD), ("T_ref", GRN), ("M_ref", ALI), ("e_ref", TEA)]
    for i, r in enumerate(rows):
        yc = pa.y + 13 + i * 26
        o.append(T(14, yc + 4, "%s（%.1f°）" % (r["nm"], r["el"]), "start", 10, INK, True))
        xp, xn = pa.X(0), pa.X(0)
        for k, c in keys:
            v = r[k]
            w = abs(pa.X(v) - pa.X(0))
            if v >= 0:
                o.append(RECT(xp, yc - 7, max(w, 0.6), 14, 1, soft(c), c, 0.9)); xp += w
            else:
                o.append(RECT(xn - w, yc - 7, max(w, 0.6), 14, 1, soft(c), c, 0.9)); xn -= w
        o.append(T(436, yc + 4, _f16_m(r["PRC"], 1), "middle", 10, PUR, True))
        a = r["after"]
        o.append(RECT(min(pb.X(0), pb.X(a)), yc - 7, max(abs(pb.X(a) - pb.X(0)), 0.6), 14, 1, GSOFT, GRN, 1.0))
        o.append(T(pb.X(a) + (5 if a >= 0 else -5), yc + 4, _f16_m(a, 2), "start" if a >= 0 else "end", 9.5, GRN, True, halo=True))
    yl = pa.y + pa.h + 50
    o.append(LEGEND(14, yl, [(PUR, "衛星の時計と軌道"), (GLD, "電離層"), (GRN, "対流圏"), (ALI, "基準局のマルチパス"), (TEA, "基準局の雑音")], 10))
    o.append(TX(14, yl + 22, "PRC_i = −(b_{ref} + 内訳の和)。b_{ref} = 149.9 m（0.5 μs）が、どの衛星にも同じだけ入る", "start", 10, PUR))
    # (c) 位置の誤差
    yc0 = yl + 52
    o.append(T(14, yc0, "(c) 移動局の位置の誤差（8 つの衛星を最小二乗法で解いた）", "start", 11.5, INK, True))
    cases = [("電離層と対流圏のモデルも使わない", "err_rov", MUT), ("7 章のモデルで直した単独", "model", ALI), ("DGNSS（補正値を足した）", "after", GRN)]
    q = Plot(300, yc0 + 10, 230, 3 * 22, (0, 6), (0, 1))
    o.append(q.axes(xl="水平の誤差 [m]", yl=None, xt=[0, 2, 4, 6], yt=[]))
    for k, (lab, key, c) in enumerate(cases):
        x = _F16_A @ _f16_np.array([r[key] for r in rows])
        h = math.hypot(x[0], x[1])
        yy = q.y + 11 + k * 22
        o.append(T(q.x - 8, yy + 4, lab, "end", 10, c, True))
        o.append(RECT(q.X(0), yy - 7, q.X(h) - q.X(0), 14, 1, soft(c), c, 1))
        o.append(T(q.X(h) + 5, yy + 4, "%.2f m" % h, "start", 9.5, c, True))
        o.append(T(690, yy + 4, "上下 %s m" % _f16_m(x[2], 2), "end", 9.5, c, True))
    xd = _F16_A @ _f16_np.array([r["after"] for r in rows])
    prc = _f16_np.array([r["PRC"] for r in rows])
    yb = q.y + q.h + 54
    o.append(TX(14, yb, "求めた時計のずれ b' = b_{rov} − b_{ref} %s m（b_{rov} = 1 ms 分の 299 792.5 m）。" % (("+ " if xd[3] >= 0 else "− ") + "%.2f" % abs(xd[3])), "start", 10, INK))
    o.append(T(14, yb + 18, "補正値の平均（%s m）を全部の衛星から引いて配っても、位置は変わらず、b' が %.1f m 変わるだけ。" % (_f16_m(prc.mean(), 1), abs(prc.mean())), "start", 10, INK))
    return SVG(700, yb + 30, o, "DGNSS の数値の例（東京の 8 つの衛星、時刻 0。基準局は西へ 10 km。誤差は 7 章の大きさの乱数の 1 組）。")


F["e16_prc"] = _f16_prc_fig()


# =====================================================================
# 3 節: 相関のモデルの場（電離層の、モデルで直せずに残る分）
# =====================================================================
_F16_FSEED = 1          # デモ w16_common の初めの場と同じ種


def _f16_heat2(p, fn, xs, ys, vmax, nlev=6, omax=0.6, cp=GLD, cn=SIG):
    """正の値は cp、負の値は cn の濃さで描く（値の大きさ |v| / vmax で nlev 段）。"""
    paths = {}
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            v = fn((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2)
            k = int(min(nlev - 1, math.floor(abs(v) / vmax * nlev)))
            key = (v >= 0, k)
            x0, x1 = p.X(xs[i]), p.X(xs[i + 1])
            y0, y1 = p.Y(ys[j + 1]), p.Y(ys[j])
            paths.setdefault(key, []).append("M%.1f %.1fh%.1fv%.1fh%.1fz" % (x0, y0, x1 - x0 + 0.3, y1 - y0 + 0.3, -(x1 - x0 + 0.3)))
    o = []
    for (pos, k), ps in sorted(paths.items()):
        o.append('<path d="%s" fill="%s" fill-opacity="%.3f" stroke="none"/>' % ("".join(ps), cp if pos else cn, omax * (k + 0.5) / nlev))
    return "".join(o)


def _f16_field_fig():
    o = []
    md = _f16_modes(_F16_FSEED)
    fn = lambda x, y: _f16_field(md, _F16_SI, _F16_DI, x, y)
    o.append(T(14, 18, "(a) 電離層の遅れの、モデルで直せずに残る分（1 つの例）", "start", 11.5, INK, True))
    p = Plot(58, 34, 270, 270, (-1000, 1000), (-1000, 1000))
    edges = [-1000 + 50 * k for k in range(41)]
    o.append(_f16_heat2(p, fn, edges, edges, 8.0))
    o.append(p.axes(xl="東西 [km]", yl="南北 [km]", xt=[-1000, -500, 0, 500, 1000], yt=[-1000, -500, 0, 500, 1000], grid=False))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, "none", LIN, 1))
    pts = [((0.0, 0.0), "基準局", PUR), ((300.0, 0.0), "300 km", GRN), ((-707.1, 707.1), "1000 km", GRN)]
    v0 = fn(0.0, 0.0)
    for (x, y), lab, c in pts:
        X, Y = p.X(x), p.Y(y)
        if c == PUR:
            o.append(CIRC(X, Y, 5.5, c=PUR, lw=2, fill=SCR))
            o.append(T(X - 8, Y + 18, "基準局 %s m" % _f16_m(v0, 1), "middle", 9.5, PUR, True, halo=True))
        else:
            o.append(W(p.X(0), p.Y(0), X, Y, c=MUT, lw=1, dash="3 3"))
            o.append(D(X, Y, GRN, 4.5))
            v = fn(x, y)
            if x > 0:
                o.append(T(X, Y - 22, "%s: %s m" % (lab, _f16_m(v, 1)), "middle", 9.5, GRN, True, halo=True))
                o.append(T(X, Y - 9, "（差 %s m）" % _f16_m(v - v0, 1), "middle", 9.5, GRN, True, halo=True))
            else:
                o.append(T(X - 6, Y - 8, "%s: %s m（差 %s m）" % (lab, _f16_m(v, 1), _f16_m(v - v0, 1)), "start", 9.5, GRN, True, halo=True))
    o.append(T(p.x, p.y + p.h + 48, "金: モデルより遅れが大きい所、青: 小さい所（濃いほど大きい。±8 m で最も濃い）", "start", 9.5, MUT))
    # (b) 2 点の値の組
    x0 = 372
    o.append(T(x0, 18, "(b) 距離 d だけ離れた 2 点の値の組（400 組）", "start", 11.5, INK, True))
    rng = _f16_np.random.default_rng(1616)
    mds = [_f16_modes(3000 + k) for k in range(20)]
    for j, d in enumerate((100.0, 500.0, 1000.0)):
        q = Plot(x0 + 12 + j * 108, 40, 88, 88, (-10, 10), (-10, 10))
        o.append(RECT(q.x, q.y, q.w, q.h, 0, SCR, LIN, 1))
        o.append(W(q.X(-10), q.Y(-10), q.X(10), q.Y(10), c=FNT, lw=1, dash="3 3"))
        a, b = [], []
        for m_ in mds:
            for _ in range(20):
                xx, yy, th = rng.uniform(-3000, 3000), rng.uniform(-3000, 3000), rng.uniform(0, 2 * math.pi)
                a.append(_f16_field(m_, _F16_SI, _F16_DI, xx, yy)); b.append(_f16_field(m_, _F16_SI, _F16_DI, xx + d * math.cos(th), yy + d * math.sin(th)))
        for u, v in zip(a, b):
            if abs(u) < 10 and abs(v) < 10:
                o.append(D(q.X(u), q.Y(v), GLD, 1.1))
        r = float(_f16_np.corrcoef(a, b)[0, 1])
        o.append(T(q.x + q.w / 2, q.y + q.h + 16, "d = %d km" % d, "middle", 10, INK, True))
        o.append(T(q.x + q.w / 2, q.y + q.h + 30, "相関係数 %.2f" % r, "middle", 9.5, MUT))
    o.append(T(x0 + 12, 186, "横: 基準局の値、縦: 移動局の値（どちらも −10〜10 m）", "start", 9.5, MUT))
    # (c) 相関係数と差の標準偏差
    o.append(T(x0, 214, "(c) モデルの相関係数と、差の標準偏差", "start", 11.5, INK, True))
    c = Plot(x0 + 50, 228, 250, 96, (0, 2000), (0, 1.5))
    o.append(c.axes(xl="2 点の距離 d [km]", yl=None, xt=[0, 500, 1000, 1500, 2000], yt=[0, 0.5, 1, 1.5]))
    ds = _f16_np.linspace(0, 2000, 201)
    o.append(c.line([(d, math.exp(-(d / _F16_DI) ** 2)) for d in ds], c=GLD, lw=2))
    o.append(c.line([(d, math.sqrt(2 * (1 - math.exp(-(d / _F16_DI) ** 2)))) for d in ds], c=ALI, lw=2))
    o.append(W(c.X(0), c.Y(1), c.X(2000), c.Y(1), c=MUT, lw=1, dash="4 3"))
    dx = _F16_DI * math.sqrt(math.log(2))
    o.append(W(c.X(dx), c.Y(0), c.X(dx), c.Y(1), c=MUT, lw=1, dash="2 2"))
    o.append(D(c.X(dx), c.Y(1), INK, 3.5))
    o.append(T(c.X(dx) + 5, c.Y(1) - 6, "%.0f km" % dx, "start", 9.5, INK, True, halo=True))
    o.append(TX(c.X(1990), c.Y(0.22), "κ = e^{−(d/D)²}", "end", 10, GLD, True, halo=True))
    o.append(TX(c.X(60), c.Y(1.3), "σ_Δ/σ = √(2(1 − κ))", "start", 10, ALI, True, halo=True))
    return SVG(700, 362, o, "電離層の、モデルで直せずに残る遅れのモデル（標準偏差 3.5 m、相関の距離 1000 km。例の値）。(b) は 20 通りの場から作った値の組。")


F["e16_field"] = _f16_field_fig()


# =====================================================================
# 3 節: 基線長と、残る誤差
# =====================================================================
def _f16_baseline_fig():
    o = []
    p = Plot(72, 26, 400, 236, (1, 3000), (0, 6), xlog=True)
    o.append(p.axes(xl="基線長 d [km]（対数の目盛）", yl="残る誤差の標準偏差 [m]", xt=[1, 10, 100, 1000, 3000], yt=[0, 1, 2, 3, 4, 5, 6]))
    ds = [10 ** (k / 60.0) for k in range(0, int(60 * math.log10(3000)) + 1)] + [3000.0]
    tau = 5.0
    cur = {"I": [], "T": [], "S": [], "U": []}
    for d in ds:
        s, i, t = _f16_common(d, tau)
        cur["S"].append((d, s)); cur["I"].append((d, i)); cur["T"].append((d, t)); cur["U"].append((d, _f16_uere(_f16_budget(d, tau))))
    u7 = _f16_uere(_F16_B7)
    rx = _f16_uere(_f16_budget(0, 0)[3:])
    o.append(W(p.X(1), p.Y(u7), p.X(3000), p.Y(u7), c=ALI, lw=1.4, dash="6 3"))
    o.append(T(p.X(1.2), p.Y(u7) - 6, "単独の UERE %.2f m（7 章 6 節）" % u7, "start", 9.5, ALI, True, halo=True))
    o.append(W(p.X(1), p.Y(_F16_SI), p.X(3000), p.Y(_F16_SI), c=GLD, lw=1.1, dash="2 3"))
    o.append(T(p.X(1.2), p.Y(_F16_SI) + 13, "単独の電離層 3.5 m", "start", 9.5, GLD, False, halo=True))
    o.append(W(p.X(1), p.Y(rx), p.X(3000), p.Y(rx), c=MUT, lw=1.1, dash="4 3"))
    o.append(T(p.X(1.2), p.Y(rx) - 6, "受信機ごとの誤差（移動局と基準局）%.2f m" % rx, "start", 9.5, MUT, False, halo=True))
    o.append(p.line(cur["S"], c=PUR, lw=1.6, dash="5 3"))
    o.append(p.line(cur["T"], c=GRN, lw=2))
    o.append(p.line(cur["I"], c=GLD, lw=2))
    o.append(p.line(cur["U"], c=INK, lw=2.6))
    dI = _F16_DI * math.sqrt(math.log(2))
    o.append(D(p.X(dI), p.Y(_F16_SI), GLD, 4))
    o.append(T(p.X(dI) - 6, p.Y(_F16_SI) - 8, "%.0f km" % dI, "end", 9.5, GLD, True, halo=True))
    lo, hi = 1.0, 5000.0
    for _ in range(80):
        m = (lo + hi) / 2
        if _f16_uere(_f16_budget(m, tau)) < u7: lo = m
        else: hi = m
    o.append(D(p.X(lo), p.Y(u7), INK, 4))
    o.append(T(p.X(lo) + 6, p.Y(u7) + 14, "約 %.0f km" % (round(lo / 10) * 10), "start", 9.5, INK, True, halo=True))
    o.append(LEGL(80, 316, [(INK, None, "UERE（全部）"), (GLD, None, "電離層"), (GRN, None, "対流圏"), (PUR, "5 3", "衛星の時計と軌道")], 10))
    # 表
    x0 = 500
    o.append(T(x0, 40, "残る誤差 [m]（補正の年齢 5 s）", "start", 10.5, INK, True))
    hd = [("基線長", INK, 54), ("電離層", GLD, 104), ("対流圏", GRN, 146), ("UERE", INK, 190)]
    for s, c, xx in hd:
        o.append(T(x0 + xx, 62, s, "end", 9.5, c, True))
    for k, d in enumerate((10, 100, 300, 1000)):
        yy = 84 + k * 22
        s, i, t = _f16_common(d, tau)
        u = _f16_uere(_f16_budget(d, tau))
        o.append(T(x0 + 54, yy, "%d km" % d, "end", 10, INK))
        o.append(T(x0 + 104, yy, "%.2f" % i, "end", 10, GLD, True))
        o.append(T(x0 + 146, yy, "%.2f" % t, "end", 10, GRN, True))
        o.append(T(x0 + 190, yy, "%.2f" % u, "end", 10, INK, True))
    o.append(T(x0, 186, "単独: 電離層 3.50・対流圏 0.40・", "start", 9.5, MUT))
    o.append(T(x0, 200, "UERE 3.99", "start", 9.5, MUT))
    return SVG(700, 328, o, "基線長と、DGNSS の後に残る誤差（相関の距離は電離層 1000 km・対流圏 100 km、補正の年齢 5 s のモデル。例の値）。")


F["e16_baseline"] = _f16_baseline_fig()


# =====================================================================
# 3 節: 補正の年齢と、GGA の文
# =====================================================================
def _f16_mono(x, y, text, spans, sz=10.5):
    """等幅の文字の列と、欄の下の括弧と説明。spans = [(始めの字, 終わりの字, 色, 説明), ...]。"""
    cw = 0.6 * sz
    if _CHECK:
        _BOXES.append((x, y - sz * 0.82, x + len(text) * cw, y + sz * 0.22, text))
    xs = " ".join("%g" % round(x + i * cw, 2) for i in range(len(text)))
    o = ['<text y="%g" font-size="%g" font-family="var(--mono)" fill="%s"><tspan x="%s">%s</tspan></text>' % (round(y, 2), sz, INK, xs, E(text))]
    for k, (a, b, c, lab) in enumerate(spans):
        xa, xb = x + a * cw, x + b * cw
        o.append(RECT(xa - 1, y - sz - 2, xb - xa + 2, sz + 7, 2, soft(c), c, 1.0))
        yb = y + 16 + k * 16
        xc = (xa + xb) / 2
        o.append(W(xc, y + 6, xc, yb - 4, c=c, lw=1))
        o.append(T(xc + 4, yb, lab, "start", 9.5, c, True))
    return "".join(o)


def _f16_age_fig():
    o = []
    o.append(T(14, 18, "(a) 補正の年齢と、残る誤差（基線長 10 km）", "start", 11.5, INK, True))
    p = Plot(72, 34, 400, 180, (0, 900), (0, 2.5))
    o.append(p.axes(xl="補正の年齢 τ [s]", yl="残る誤差の標準偏差 [m]", xt=[0, 120, 300, 600, 900], yt=[0, 0.5, 1, 1.5, 2, 2.5]))
    ts = [k * 5.0 for k in range(181)]
    rx = _f16_uere(_f16_budget(0, 0)[3:])
    o.append(W(p.X(0), p.Y(rx), p.X(900), p.Y(rx), c=MUT, lw=1.1, dash="4 3"))
    o.append(T(p.X(890), p.Y(rx) + 13, "受信機ごとの誤差 %.2f m" % rx, "end", 9.5, MUT, False, halo=True))
    o.append(p.line([(t, _f16_common(10, t)[0]) for t in ts], c=PUR, lw=1.6, dash="5 3"))
    o.append(p.line([(t, _f16_common(10, t)[2]) for t in ts], c=GRN, lw=2))
    o.append(p.line([(t, _f16_common(10, t)[1]) for t in ts], c=GLD, lw=2))
    o.append(p.line([(t, _f16_uere(_f16_budget(10, t))) for t in ts], c=INK, lw=2.6))
    o.append(W(p.X(30), p.Y(0), p.X(30), p.Y(2.5), c=ALI, lw=1.2, dash="3 3"))
    o.append(T(p.X(30) + 4, p.Y(2.38), "限度の例 30 s", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(80, 266, [(INK, None, "UERE"), (GLD, None, "電離層"), (GRN, None, "対流圏"), (PUR, "5 3", "衛星の時計と軌道")], 10))
    x0 = 500
    o.append(T(x0, 44, "UERE [m]（基線長 10 km）", "start", 10.5, INK, True))
    for k, t in enumerate((5, 30, 60, 300, 600)):
        yy = 66 + k * 22
        o.append(T(x0 + 70, yy, "τ = %d s" % t, "end", 10, INK))
        o.append(T(x0 + 130, yy, "%.2f" % _f16_uere(_f16_budget(10, t)), "end", 10, INK, True))
    o.append(T(x0, 186, "相関の時間（例の値）:", "start", 9.5, MUT))
    o.append(T(x0, 200, "電離層 30 分・衛星 2 時間・", "start", 9.5, MUT))
    o.append(T(x0, 214, "対流圏 1 時間", "start", 9.5, MUT))
    # (b) GGA
    yg = 312
    o.append(T(14, yg - 20, "(b) DGNSS の解を書いた GGA の文（12 章の例の文の、品質と 13・14 番の欄を書き換えた例）", "start", 11.5, INK, True))
    body = "GPGGA,092750.00,3540.86000,N,13946.02000,E,2,08,0.95,3.3,M,36.7,M,5.0,0123"
    ck = 0
    for ch in body:
        ck ^= ord(ch)
    s = "$" + body + "*%02X" % ck
    cm = [i for i, ch in enumerate(s) if ch == ","]
    sp = [(cm[5] + 1, cm[6], GRN, "6 番: 測位の品質 2（補正を使った）"),
          (cm[12] + 1, cm[13], PUR, "13 番: 補正の年齢 5.0 s"),
          (cm[13] + 1, s.index("*"), PUR, "14 番: 基準局の番号 0123"),
          (s.index("*"), len(s), MUT, "チェックサム（12 章 3 節）")]
    o.append(_f16_mono(14, yg + 6, s, sp, 10.5))
    return SVG(700, yg + 84, o, "補正の年齢と、DGNSS の後に残る誤差（例の値のモデル）と、DGNSS の解を書いた GGA の文（年齢と番号は例の値）。")


F["e16_age"] = _f16_age_fig()


# =====================================================================
# 4 節: SBAS の構成と、補正の分け方
# =====================================================================
def _f16_sbas_fig():
    o = []
    o.append(T(14, 18, "(a) SBAS の構成（MSAS の例）", "start", 11.5, INK, True))
    gy = 200
    o.append(W(14, gy, 690, gy, c=MUT, lw=1.4))
    gps = [(70, 50), (190, 40)]
    sts = [32, 82, 132, 182, 232]
    geo = (560, 52)
    users = [(616, gy - 10), (664, gy - 10)]
    for (x, y) in gps:
        for sx in sts:
            o.append(W(x, y + 6, sx, gy - 24, c=SIG, lw=0.6))
        for ux, uy in users:
            o.append(W(x, y + 6, ux, uy - 6, c=SIG, lw=0.6, dash="2 3"))
    for (x, y) in gps:
        o.append(_f16_sat(x, y, SIG, 0.95))
    o.append(T(130, 30, "GPS の衛星", "middle", 9.5, SIG, True))
    for sx in sts:
        o.append(_f16_base(sx, gy - 22, PUR))
    o.append(T(132, gy + 18, "基準局（MSAS では監視局という。多くの地点）", "middle", 9.5, PUR, True))
    o.append(RECT(282, gy - 52, 112, 46, 6, PSOFT, PUR, 1.3))
    o.append(T(338, gy - 33, "主局", "middle", 10.5, PUR, True))
    o.append(T(338, gy - 17, "補正と誤差の上限を計算", "middle", 9, PUR))
    o.append(ARR(250, gy - 14, 280, gy - 22, c=PUR, lw=1.6))
    o.append(W(452, gy - 6, 446, gy - 34, 458, gy - 34, 452, gy - 6, c=PUR, lw=1.4))
    o.append(PATH("M%g,%g A16,8 0 0,1 %g,%g" % (436, gy - 40, 468, gy - 40), c=PUR, lw=1.6))
    o.append(T(452, gy + 18, "送信局", "middle", 9.5, PUR, True))
    o.append(ARR(396, gy - 28, 430, gy - 28, c=PUR, lw=1.6))
    o.append(ARR(456, gy - 46, geo[0] - 8, geo[1] + 12, c=PUR, lw=1.6))
    o.append(_f16_sat(geo[0], geo[1], TEA, 1.1))
    o.append(T(geo[0] + 22, geo[1] - 14, "静止軌道の衛星", "start", 9.5, TEA, True))
    o.append(T(geo[0] + 22, geo[1] + 0, "（MSAS は みちびき", "start", 9.5, TEA))
    o.append(T(geo[0] + 22, geo[1] + 14, "3 号機・6 号機）", "start", 9.5, TEA))
    for ux, uy in users:
        o.append(ARR(geo[0] + 4, geo[1] + 10, ux, uy - 8, c=PUR, lw=1.6))
        o.append(_f16_rx(ux, uy, GRN))
    o.append(T(640, gy + 18, "利用者の受信機", "middle", 9.5, GRN, True))
    o.append(T(690, gy + 33, "L1 で受ける（1 秒に 1 つ、250 bit のメッセージ）", "end", 9.5, PUR, True))
    # (b) 補正の分け方
    yb = 256
    o.append(T(14, yb, "(b) 補正の分け方", "start", 11.5, INK, True))
    rows = [("衛星の時計と軌道", PUR, "衛星ごとの補正（速い補正・遅い補正）", "どこでも同じ値を使う"),
            ("電離層", GLD, "格子の点の天頂の遅れ", "自分の位置で補間する"),
            ("対流圏", GRN, "配らない", "受信機のモデル（7 章 2 節）")]
    o.append(T(126, yb + 22, "DGNSS", "middle", 10, PUR, True))
    o.append(T(300, yb + 22, "SBAS", "middle", 10, TEA, True))
    o.append(RECT(96, yb + 30, 60, 3 * 34 - 6, 5, PSOFT, PUR, 1))
    o.append(TX(126, yb + 70, "PRC_i", "middle", 10.5, PUR, True))
    o.append(T(126, yb + 86, "（全部の和）", "middle", 9, PUR))
    for k, (nm, c, what, how) in enumerate(rows):
        yy = yb + 30 + k * 34
        o.append(T(14, yy + 19, nm, "start", 9.5, c, True))
        o.append(RECT(176, yy, 232, 28, 5, soft(c), c, 1))
        o.append(T(184, yy + 12, what, "start", 9.5, INK, True))
        o.append(T(184, yy + 24, how, "start", 9, MUT))
    o.append(T(126, yb + 148, "基準局の近くだけ", "middle", 9.5, PUR, True))
    o.append(T(292, yb + 148, "基準局の網が覆う広い地域", "middle", 9.5, TEA, True))
    # (c) メッセージの型
    xc = 432
    o.append(T(xc, yb, "(c) メッセージの型の例（L1 の SBAS）", "start", 11.5, INK, True))
    msgs = [("0", "試験（安全に関わる使い方に使わない）"), ("1", "補正する衛星の一覧"), ("2〜5", "速い補正（時計の速い変化）"),
            ("18", "電離層の格子の点の一覧"), ("25", "遅い補正（軌道と時計）"), ("26", "格子の点の遅れと誤差の上限")]
    for k, (n, d) in enumerate(msgs):
        yy = yb + 24 + k * 21
        o.append(RECT(xc, yy - 12, 40, 17, 4, TSOFT, TEA, 1))
        o.append(T(xc + 20, yy + 1, n, "middle", 10, TEA, True, True))
        o.append(T(xc + 48, yy + 1, d, "start", 9.5, INK))
    return SVG(700, yb + 160, o, "SBAS の構成と、補正の分け方（メッセージの型は L1 の SBAS の規格の例。中身は版と SBAS による）。")


F["e16_sbas"] = _f16_sbas_fig()


# =====================================================================
# 4 節: 電離層の格子と補間（東京から見た G22）
# =====================================================================
def _f16_grid_fig():
    o = []
    g22 = _F16_VL[2]
    Bp, Lp = _f16_ipp(_F16_TOK[0], _F16_TOK[1], g22[1], g22[2])
    iv, c, w, (B1, L1, xi, ze) = _f16_interp(Bp, Lp)
    tv = _f16_truth(Bp, Lp)
    o.append(T(14, 18, "(a) 格子の点（5° ごと）の天頂の遅れ [m]", "start", 11.5, INK, True))
    p = Plot(50, 34, 300, 316, (120, 155), (20, 50))
    o.append(_f16_heat(p, lambda L, B: _f16_truth(B, L), list(range(120, 156)), list(range(20, 51)), 2.5, 7.5))
    o.append(p.axes(xl="経度 [°]", yl="緯度 [°]", xt=list(range(120, 156, 5)), yt=list(range(20, 51, 5)), grid=False))
    for L in range(120, 156, 5):
        o.append(W(p.X(L), p.Y(20), p.X(L), p.Y(50), c=MUT, lw=0.6, dash="2 3"))
    for B in range(20, 51, 5):
        o.append(W(p.X(120), p.Y(B), p.X(155), p.Y(B), c=MUT, lw=0.6, dash="2 3"))
    o.append(RECT(p.X(L1), p.Y(B1 + 5), p.X(L1 + 5) - p.X(L1), p.Y(B1) - p.Y(B1 + 5), 0, "none", SIG, 2))
    for L in range(120, 156, 5):
        for B in range(20, 51, 5):
            o.append(D(p.X(L), p.Y(B), INK, 2.2))
            if L < 155 and B < 50:
                o.append(T(p.X(L) + 3, p.Y(B) - 4, "%.1f" % _f16_truth(B, L), "start", 9.5, INK, False, halo=True))
    tx, ty = p.X(_F16_TOK[1]), p.Y(_F16_TOK[0])
    o.append(W(tx, ty, p.X(Lp), p.Y(Bp), c=GLD, lw=1.4, dash="4 2"))
    o.append(D(p.X(Lp), p.Y(Bp), GLD, 4.5))
    o.append(CIRC(tx, ty, 5, c=GRN, lw=2, fill=SCR))
    o.append(T(tx - 7, ty - 6, "東京", "end", 10, GRN, True, halo=True))
    o.append(T(p.X(Lp) - 6, p.Y(Bp) + 15, "G22 の電波が通る点", "end", 9.5, GLD, True, halo=True))
    o.append(_f16_scale(p.x, p.y + p.h + 46, 160, 2.5, 7.5, "本当の天頂の遅れ [m]（例）", GLD, 10, 0.62, lambda v: "%.1f" % v))
    # (b) 升の中の補間
    x0, y0, S = 420, 60, 190
    o.append(T(392, 18, "(b) 升（北緯 30〜35°・東経 135〜140°）の中の補間", "start", 11.5, INK, True))
    px, py = x0 + xi * S, y0 + (1 - ze) * S
    rects = [((x0, py, px - x0, y0 + S - py), "NE", "ξζ"), ((px, py, x0 + S - px, y0 + S - py), "NW", "(1 − ξ)ζ"),
             ((px, y0, x0 + S - px, py - y0), "SW", "(1 − ξ)(1 − ζ)"), ((x0, y0, px - x0, py - y0), "SE", "ξ(1 − ζ)")]
    cols = {"SW": SIG, "SE": PUR, "NE": GRN, "NW": ALI}
    for (rx_, ry_, rw, rh), k, fm in rects:
        o.append(RECT(rx_, ry_, rw, rh, 0, soft(cols[k]), cols[k], 0.8))
        cx, cy = rx_ + rw / 2, ry_ + rh / 2
        if rh > 60:
            o.append(TX(cx, cy - 6, "w_{%s}" % k, "middle", 10.5, cols[k], True))
            o.append(T(cx, cy + 10, "%.3f" % w[k], "middle", 10, cols[k], True))
        else:
            o.append(TX(cx, cy + 4, "w_{%s} %.3f" % (k, w[k]), "middle", 9.5, cols[k], True))
    o.append(RECT(x0, y0, S, S, 0, "none", SIG, 2))
    o.append(D(px, py, GLD, 5))
    o.append(DIM(x0, y0 + S + 14, px, y0 + S + 14, "ξ = %.3f" % xi, c=MUT))
    o.append(DIM(x0 - 14, y0 + S, x0 - 14, py, None, c=MUT))
    o.append(T(x0 - 18, (y0 + S + py) / 2 + 4, "ζ = %.3f" % ze, "end", 9.5, MUT))
    corner = {"SW": (x0, y0 + S, "end", 14), "SE": (x0 + S, y0 + S, "start", 14), "NE": (x0 + S, y0, "start", -6), "NW": (x0, y0, "end", -6)}
    for k, (cx, cy, a, dy) in corner.items():
        o.append(D(cx, cy, INK, 3.4))
        o.append(TX(cx + (-6 if a == "end" else 6), cy + dy, "I_{%s} = %.2f" % (k, c[k]), a, 10, cols[k], True))
    yf = y0 + S + 52
    o.append(TX(392, yf, "I_z = %.3f × %.2f + %.3f × %.2f" % (w["SW"], c["SW"], w["SE"], c["SE"]), "start", 10, INK))
    o.append(T(416, yf + 17, "+ %.3f × %.2f + %.3f × %.2f = %.2f m" % (w["NE"], c["NE"], w["NW"], c["NW"], iv), "start", 10, INK, True))
    o.append(T(416, yf + 32, "（本当の値 %.2f m）" % tv, "start", 9.5, MUT))
    o.append(TX(392, yf + 54, "斜め: m_I(%.1f°) × I_z = %.3f × %.2f = %.2f m" % (g22[1], _f16_mI(g22[1]), iv, _f16_mI(g22[1]) * iv), "start", 10, INK))
    kl = _f16_klob(_F16_TOK[0], _F16_TOK[1], g22[1], g22[2])
    o.append(T(392, yf + 70, "（本当の斜めの遅れ %.2f m。クロブッチャー・モデルは %.2f m）" % (_f16_mI(g22[1]) * tv, kl), "start", 9.5, MUT))
    o.append(TX(392, yf + 90, "重み w_{SW} などは、対角の向かいの長方形の面積", "start", 9.5, MUT))
    return SVG(700, 448, o, "電離層の格子の点の天頂の遅れと、東京から見た G22（仰角 %.1f°）の電波が電離層を通る点での補間（地方時 14 時。遅れの値はモデルで作った例）。" % g22[1])


F["e16_grid"] = _f16_grid_fig()


# =====================================================================
# 4 節: 完全性の考え方
# =====================================================================
def _f16_integrity_fig():
    o = []
    o.append(T(14, 18, "(a) 衛星の時計が故障したとき（例）", "start", 11.5, INK, True))
    p = Plot(66, 34, 320, 190, (-10, 30), (0, 30))
    o.append(RECT(p.X(0), p.y, p.X(6) - p.X(0), p.h, 0, PSOFT, "none", 0))
    o.append(p.axes(xl="故障が始まってからの時間 t [s]", yl="位置の誤差 [m]", xt=[-10, 0, 6, 10, 20, 30], yt=[0, 10, 20, 30]))
    ts = _f16_np.linspace(-10, 30, 161)
    bad = [(t, 1.2 + (0.9 * t if t > 0 else 0)) for t in ts]
    good = [(t, 1.2 + (0.9 * t if 0 < t <= 6 else 0) + (0.1 if t > 6 else 0)) for t in ts]
    o.append(p.line(bad, c=ALI, lw=2))
    o.append(p.line(good, c=GRN, lw=2.2))
    o.append(T(p.X(3), p.y + 14, "知らせるまで", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(3), p.y + 28, "（例 6 s）", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(29), p.Y(26.5), "その衛星を使い続ける", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(29), p.Y(4.0), "「使わない」を受けて除く", "end", 9.5, GRN, True, halo=True))
    # (b) 保護レベルと警報限界
    x0 = 430
    o.append(T(x0 - 14, 18, "(b) 保護レベルと警報限界（例の値）", "start", 11.5, INK, True))
    q = Plot(x0 + 70, 40, 180, 3 * 56, (0, 60), (0, 1))
    AL = 40
    o.append(q.axes(xl="位置の誤差の大きさ [m]", yl=None, xt=[0, 20, 40, 60], yt=[]))
    cases = [("ふだん", 2.0, 18.0, True), ("衛星が少ない", 3.0, 52.0, False), ("電離層が荒れた", 4.0, 46.0, False)]
    for k, (lab, err, pl, ok) in enumerate(cases):
        yy = q.y + 12 + k * 56
        o.append(T(q.x - 8, yy + 12, lab, "end", 9.5, INK, True))
        o.append(RECT(q.X(0), yy, q.X(pl) - q.X(0), 12, 2, PSOFT, PUR, 1))
        o.append(RECT(q.X(0), yy + 16, q.X(err) - q.X(0), 10, 2, GOSOFT, GLD, 1))
        o.append(T(q.X(pl) + 4, yy + 10, "保護レベル", "start", 9, PUR, True, halo=True) if q.X(pl) + 60 < 690 else T(q.X(pl) - 4, yy + 10, "保護レベル", "end", 9, PUR, True, halo=True))
        o.append(T(q.X(0) + 2, yy + 40, "使える" if ok else "使えない（知らせる）", "start", 9.5, GRN if ok else ALI, True))
    o.append(W(q.X(AL), q.y, q.X(AL), q.y + q.h, c=ALI, lw=1.6, dash="5 3"))
    o.append(T(q.X(AL), q.y - 4, "警報限界", "middle", 9.5, ALI, True))
    o.append(LEGEND(x0 - 14, q.y + q.h + 50, [(GLD, "本当の誤差（受信機は知らない）")], 9.5))
    return SVG(700, 300, o, "完全性の考え方（値は例。知らせるまでの時間と警報限界は、使い方ごとに規格で決まる）。")


F["e16_integrity"] = _f16_integrity_fig()


# =====================================================================
# 5 節: RTCM の形
# =====================================================================
def _f16_crc24q(data):
    crc = 0
    for b in data:
        crc ^= b << 16
        for _ in range(8):
            crc <<= 1
            if crc & 0x1000000:
                crc ^= 0x1864CFB
    return crc & 0xFFFFFF


def _f16_1005(sid, x, y, z):
    """RTCM 版 3 の 1005（基準局のアンテナの位置）のフレーム。公開されている例のフレームを、この関数で再現できることを確かめた。"""
    v, n = 0, 0
    for val, nb in ((1005, 12), (sid, 12), (0, 6), (1, 1), (0, 1), (0, 1), (0, 1), (round(x * 1e4), 38), (0, 1), (0, 1),
                    (round(y * 1e4), 38), (0, 2), (round(z * 1e4), 38)):
        if val < 0:
            val += 1 << nb
        v = (v << nb) | val
        n += nb
    pay = v.to_bytes(n // 8, "big")
    head = bytes([0xD3, (len(pay) >> 8) & 3, len(pay) & 0xFF])
    return head + pay + _f16_crc24q(head + pay).to_bytes(3, "big")


_F16_REFXYZ = geod2ecef(*_F16_REF)
_F16_FR1005 = _f16_1005(123, *_F16_REFXYZ)


def _f16_rtcm_fig():
    o = []
    fr = _F16_FR1005
    o.append(T(14, 18, "(a) 版 3 のフレーム（例の基準局の 1005。%d バイト）" % len(fr), "start", 11.5, INK, True))
    x0, u, y0 = 24, 26, 32
    role = lambda i: ("同期", MUT) if i == 0 else (("長さ", GLD) if i < 3 else (("CRC", GRN) if i >= len(fr) - 3 else ("本体", SIG)))
    for i, b in enumerate(fr):
        nm, c = role(i)
        o.append(RECT(x0 + i * u, y0, u - 2, 22, 3, soft(c), c, 1))
        o.append(T(x0 + i * u + (u - 2) / 2, y0 + 15, "%02X" % b, "middle", 9.5, INK, False, True))
    def brace(i0, i1, lab, c, yy):
        xa, xb = x0 + i0 * u, x0 + i1 * u - 2
        return W(xa, yy - 6, xa, yy, xb, yy, xb, yy - 6, c=c, lw=1.1) + T((xa + xb) / 2, yy + 13, lab, "middle", 9.5, c, True)
    o.append(brace(0, 1, "同期 0xD3", MUT, y0 + 32))
    o.append(brace(1, 3, "予備 6 bit・長さ 10 bit = 19", GLD, y0 + 46))
    o.append(brace(3, len(fr) - 3, "本体 19 バイト（下の (b)）", SIG, y0 + 32))
    o.append(brace(len(fr) - 3, len(fr), "CRC-24Q", GRN, y0 + 46))
    # (b) 本体の欄（152 bit）
    yb = 130
    o.append(T(14, yb, "(b) 1005 の本体の欄（152 bit。座標は ECEF、0.1 mm 単位の 38 bit）", "start", 11.5, INK, True))
    flds = [(12, "番号", PUR), (12, "基準局", PUR), (6, "", MUT), (4, "", MUT), (38, "X", SIG), (2, "", MUT), (38, "Y", SIG), (2, "", MUT), (38, "Z", SIG)]
    bw = 652.0 / 152
    xx = 24
    for nb, nm, c in flds:
        o.append(RECT(xx, yb + 12, nb * bw - 1, 22, 2, soft(c), c, 1))
        if nm:
            o.append(T(xx + nb * bw / 2, yb + 27, nm, "middle", 9.5, c, True))
        xx += nb * bw
    X, Y, Z = _F16_REFXYZ
    o.append(T(24, yb + 52, "番号 1005（12 bit）・基準局の番号 123（12 bit。例）・灰は印と予備（衛星系の印・座標の年版など）", "start", 9.5, INK))
    o.append(T(24, yb + 68, "X = %s m、Y = %s m、Z = %s m（西へ 10 km の例の基準局）" % (_f16_g(X, 4), _f16_g(Y, 4), _f16_g(Z, 4)), "start", 9.5, SIG, True))
    # (c) メッセージの番号の例
    yc = 236
    o.append(T(14, yc, "(c) 版 3 のメッセージの番号の例", "start", 11.5, INK, True))
    ms = [("1005・1006", "基準局のアンテナの位置（1006 はアンテナの高さも）"), ("1019", "GPS のエフェメリス"), ("1033", "受信機とアンテナの名前"),
          ("1074・1077 など", "GPS の観測値（MSM。17 章）"), ("1084・1094・1124", "GLONASS・Galileo・BeiDou の MSM（例）")]
    for k, (n, d) in enumerate(ms):
        yy = yc + 22 + k * 20
        o.append(T(24, yy, n, "start", 10, PUR, True, True))
        o.append(T(150, yy, d, "start", 9.5, INK))
    # (d) 版 2 の型 1
    xd = 470
    o.append(T(xd - 10, yc, "(d) 版 2 の型 1（30 bit のワード）", "start", 11.5, INK, True))
    w1 = [(8, "同期", MUT), (6, "型", PUR), (10, "基準局", PUR), (6, "P", FNT)]
    w2 = [(13, "時刻", GLD), (3, "", MUT), (5, "長", MUT), (3, "", MUT), (6, "P", FNT)]
    bx = 210.0 / 30
    for r, ww in enumerate((w1, w2)):
        xx = xd + 12
        yy = yc + 14 + r * 26
        o.append(T(xd - 4, yy + 15, "%d" % (r + 1), "middle", 9.5, MUT))
        for nb, nm, c in ww:
            o.append(RECT(xx, yy, nb * bx - 1, 20, 2, soft(c), c, 1))
            if nm:
                o.append(T(xx + nb * bx / 2, yy + 14, nm, "middle", 9, c, True))
            xx += nb * bx
    ys = yc + 82
    o.append(T(xd - 10, ys - 4, "衛星 1 つ分（40 bit）", "start", 9.5, INK, True))
    sat = [(1, "", MUT), (2, "", MUT), (5, "衛星", PUR), (16, "PRC", SIG), (8, "RRC", SIG), (8, "IOD", GLD)]
    bs = 210.0 / 40
    xx = xd + 12
    for nb, nm, c in sat:
        o.append(RECT(xx, ys + 4, nb * bs - 1, 20, 2, soft(c), c, 1))
        if nm:
            o.append(T(xx + nb * bs / 2, ys + 18, nm, "middle", 9, c, True))
        xx += nb * bs
    o.append(T(xd - 10, ys + 42, "P はパリティ（6 bit）。灰は通し番号・状態・尺度・UDRE", "start", 9, MUT))
    o.append(T(xd - 10, ys + 58, "8 衛星: 2 + 14 ワード = 480 bit", "start", 9.5, INK, True))
    return SVG(700, ys + 70, o, "RTCM の形（版 3 のフレームと 1005、版 2 の型 1。欄は二次資料で確かめた範囲。細部は版による）。")


F["e16_rtcm"] = _f16_rtcm_fig()


# =====================================================================
# 5 節: 届け方と、補正の年齢の変わり方
# =====================================================================
def _f16_delivery_fig():
    o = []
    # 1 段目: 無線
    o.append(T(14, 20, "無線", "start", 11, INK, True))
    o.append(_f16_base(110, 34, PUR))
    o.append(T(110, 66, "基準局", "middle", 9.5, PUR, True))
    for k in range(3):
        o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g" % (138 + k * 9, 28 - k * 5, 10 + k * 7, 10 + k * 7, 138 + k * 9, 46 + k * 5), c=PUR, lw=1.3))
    o.append(ARR(170, 38, 316, 38, c=PUR, lw=1.8))
    o.append(T(243, 30, "無線機（数 km〜数十 km。例）", "middle", 9.5, PUR, True, halo=True))
    o.append(_f16_rx(340, 34, GRN))
    o.append(T(340, 66, "移動局", "middle", 9.5, GRN, True))
    o.append(T(392, 34, "日本の中波のビーコン（海上保安庁、全国 27 局）は", "start", 9.5, MUT))
    o.append(T(392, 48, "1997 年から配り、2019 年 3 月 1 日に廃止した", "start", 9.5, MUT))
    # 2 段目: インターネット
    y2 = 94
    o.append(T(14, y2, "インターネット（NTRIP）", "start", 11, INK, True))
    o.append(_f16_base(60, y2 + 26, PUR))
    o.append(T(60, y2 + 58, "基準局", "middle", 9.5, PUR, True))
    o.append(RECT(104, y2 + 18, 96, 34, 6, PSOFT, PUR, 1.2))
    o.append(T(152, y2 + 39, "送り出す側", "middle", 9.5, PUR, True))
    o.append(ARR(76, y2 + 35, 102, y2 + 35, c=PUR, lw=1.6))
    o.append(RECT(236, y2 + 10, 132, 96, 6, PSOFT, PUR, 1.3))
    o.append(T(302, y2 + 28, "キャスタ（サーバ）", "middle", 10, PUR, True))
    for k, nm in enumerate(("BASE01", "BASE02", "…")):
        o.append(RECT(252, y2 + 38 + k * 21, 100, 17, 3, SCR if k else soft(GLD), GLD if k == 0 else LIN, 1))
        o.append(T(302, y2 + 51 + k * 21, nm, "middle", 9.5, INK, k == 0, True))
    o.append(ARR(200, y2 + 35, 234, y2 + 35, c=PUR, lw=1.6))
    xr = 640
    o.append(_f16_rx(xr, y2 + 28, GRN))
    o.append(T(xr, y2 + 102, "移動局", "middle", 9.5, GRN, True))
    o.append(T(690, y2 + 116, "（携帯電話の回線など）", "end", 9.5, MUT))
    msg = [("① GET /BASE01 HTTP/1.1（流れの名前を指定）", GRN, -1), ("② 応答 200 OK", PUR, 1), ("③ RTCM の流れが届き続ける（TCP の上）", PUR, 1)]
    for k, (s, c, dr) in enumerate(msg):
        yy = y2 + 32 + k * 26
        if dr < 0:
            o.append(ARR(xr - 16, yy, 372, yy, c=c, lw=1.4))
        else:
            o.append(ARR(372, yy, xr - 16, yy, c=c, lw=1.4 if k == 1 else 2.4))
        o.append(T((372 + xr - 16) / 2, yy - 5, s, "middle", 9.5, c, True, halo=True))
    # 3 段目: 衛星
    y3 = 218
    o.append(T(14, y3, "衛星", "start", 11, INK, True))
    o.append(_f16_sat(130, y3 + 14, TEA, 1.0))
    o.append(ARR(150, y3 + 18, 316, y3 + 18, c=PUR, lw=1.8))
    o.append(T(233, y3 + 10, "SBAS（4 節）・みちびきの補強（18 章）", "middle", 9.5, PUR, True, halo=True))
    o.append(_f16_rx(340, y3 + 14, GRN))
    # 4 段目: 補正の年齢
    y4 = 268
    o.append(T(14, y4, "補正の年齢の変わり方（例: 5 s ごとに送り、届くまで 0.5 s）", "start", 11, INK, True))
    p = Plot(70, y4 + 12, 560, 80, (0, 20), (0, 6))
    o.append(p.axes(xl="時刻 t [s]", yl="年齢 τ [s]", xt=[0, 5, 10, 15, 20], yt=[0, 2, 4, 6]))
    pts = []
    for k in range(4):
        a = 5 * k + 0.5
        pts += [(a, 0.5), (a + 5, 5.5)]
    pts = [(0, 5.0), (0.5, 5.5)] + pts
    segs = []
    for k in range(0, len(pts) - 1, 2):
        segs.append(p.clip([pts[k], pts[k + 1]], c=PUR, lw=2))
    o.append("".join(segs))
    for k in range(5):
        a = 5 * k + 0.5
        if a <= 20:
            o.append(W(p.X(a), p.Y(0.5), p.X(a), p.Y(5.5), c=PUR, lw=1, dash="2 2"))
            o.append(D(p.X(a), p.Y(0.5), PUR, 3))
    o.append(T(p.X(10.6), p.Y(0.5) + 13, "届いた（τ = 0.5 s）", "start", 9.5, PUR, True, halo=True))
    return SVG(700, y4 + 140, o, "補正の情報の届け方の例と、補正の年齢の変わり方（NTRIP のやり取りは要点だけ。流れの名前は例）。")


F["e16_delivery"] = _f16_delivery_fig()


# =====================================================================
# 6 節: 誤差の予算の比べ
# =====================================================================
def _f16_cases():
    """[(名前, 源ごとの 1σ（7 つ: 衛星・電離層・対流圏・移動局の M・移動局の ε・基準局の M・基準局の ε）)]"""
    def dg(d, tau):
        s, i, t = _f16_common(d, tau)
        return [s, i, t, _F16_B7[3], _F16_B7[4], _F16_MREF, _F16_EREF]
    return [("単独（7 章 6 節）", _F16_B7 + [0, 0]), ("SBAS（代表値）", _F16_SBAS + [0, 0]),
            ("DGNSS 10 km・5 s", dg(10, 5)), ("DGNSS 300 km・5 s", dg(300, 5)), ("DGNSS 10 km・10 分", dg(10, 600))]


def _f16_budget_fig():
    o = []
    cs = _f16_cases()
    cols = [PUR, GLD, GRN, ALI, TEA, ALI, TEA]
    o.append(T(14, 18, "(a) 源ごとの分散の積み上げ [m²]", "start", 11.5, INK, True))
    o.append(T(440, 18, "(b) 分散の割合 [%]", "start", 11.5, INK, True))
    pa = Plot(160, 30, 250, 5 * 30, (0, 18), (0, 1))
    pb = Plot(440, 30, 250, 5 * 30, (0, 100), (0, 1))
    o.append(pa.axes(xl=None, yl=None, xt=[0, 5, 10, 15], yt=[]))
    o.append(pb.axes(xl=None, yl=None, xt=[0, 25, 50, 75, 100], yt=[]))
    for k, (nm, v) in enumerate(cs):
        yy = pa.y + 6 + k * 30
        o.append(T(pa.x - 8, yy + 13, nm, "end", 10, INK, True))
        tot = sum(x * x for x in v)
        xa, xb = pa.X(0), pb.X(0)
        for j, x in enumerate(v):
            if x <= 0:
                continue
            wa = pa.X(x * x) - pa.X(0)
            wb = pb.w * x * x / tot
            dash = "3 2" if j >= 5 else None
            o.append(RECT(xa, yy, max(wa, 0.4), 18, 0, soft(cols[j]), cols[j], 1, dash))
            o.append(RECT(xb, yy, max(wb, 0.4), 18, 0, soft(cols[j]), cols[j], 1, dash))
            xa += wa; xb += wb
        o.append(T(xa + 5, yy + 13, "UERE %.2f m" % math.sqrt(tot), "start", 9.5, INK, True, halo=True))
        mn = 100 * (v[3] ** 2 + v[4] ** 2 + v[5] ** 2 + v[6] ** 2) / tot
        o.append(T(pb.x + pb.w - 4, yy + 13, "%.1f %%" % mn, "end", 9.5, INK, True, halo=True))
    o.append(T(pb.x + pb.w, pb.y - 4, "右の数: マルチパスと雑音の割合", "end", 9, MUT))
    yl = pa.y + pa.h + 28
    o.append(LEGEND(14, yl, [(PUR, "衛星の時計と軌道"), (GLD, "電離層"), (GRN, "対流圏"), (ALI, "マルチパス"), (TEA, "受信機の雑音")], 10))
    o.append(T(14, yl + 18, "破線の枠は、DGNSS の補正値に入って届く基準局のマルチパスと雑音（0.3 m ずつ。例の値）", "start", 9.5, MUT))
    # (c) 精度
    yc = yl + 46
    o.append(T(14, yc, "(c) 位置の精度（東京の 8 つの衛星。HDOP 0.95・VDOP 1.30）", "start", 11.5, INK, True))
    q = Plot(160, yc + 12, 470, 5 * 40, (0, 11), (0, 1))
    o.append(q.axes(xl="誤差 [m]", yl=None, xt=[0, 2, 4, 6, 8, 10], yt=[]))
    for k, (nm, v) in enumerate(cs):
        u = math.sqrt(sum(x * x for x in v))
        cep, r95, v95 = _f16_acc(u)
        yy = q.y + 4 + k * 40
        o.append(T(q.x - 8, yy + 18, nm, "end", 10, INK, True))
        for j, (val, c, lab) in enumerate(((cep, SIG, "CEP"), (r95, ALI, "R95"), (v95, PUR, "上下 95 %"))):
            y_ = yy + j * 11
            o.append(RECT(q.X(0), y_, q.X(val) - q.X(0), 9, 1, soft(c), c, 1))
            o.append(T(q.X(val) + 4, y_ + 8.5, "%s %.1f m" % (lab, val), "start", 9, c, True))
    return SVG(700, q.y + q.h + 40, o, "単独・SBAS・DGNSS の誤差の予算と位置の精度（SBAS の値と DGNSS のモデルは例の値。年齢の 10 分は限度を超えても使った場合）。")


F["e16_budget"] = _f16_budget_fig()


# =====================================================================
# 6 節: 位置の散らばり
# =====================================================================
def _f16_scatter_fig():
    o = []
    cs = _f16_cases()
    pan = [("(a) 単独", cs[0][1], (0.0, 0.0)), ("(b) SBAS", cs[1][1], (0.0, 0.0)), ("(c) DGNSS 10 km", cs[2][1], (0.0, 0.0)),
           ("(d) 基準局の座標が東へ 2 m", cs[2][1], (2.0, 0.0))]
    rng = _f16_np.random.default_rng(1666)
    lim = 8.0
    for k, (ttl, v, sh) in enumerate(pan):
        x0 = 14 + k * 170
        o.append(T(x0, 18, ttl, "start", 10.5, INK, True))
        p = Plot(x0 + 16, 30, 144, 144, (-lim, lim), (-lim, lim))
        o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 1))
        o.append(p.axes(xl=None, yl=None, xt=[-8, 0, 8], yt=[-8, 0, 8], sz=9))
        u = math.sqrt(sum(x * x for x in v))
        eta = rng.standard_normal((400, 8)) * u
        X = eta @ _F16_A.T
        for e_, n_ in X[:, :2]:
            e_, n_ = e_ + sh[0], n_ + sh[1]
            if abs(e_) < lim and abs(n_) < lim:
                o.append(D(p.X(e_), p.Y(n_), GLD, 1.1))
        el = [(a + sh[0], b + sh[1]) for a, b in _f16_ellpts(_F16_S1 * u, _F16_S2 * u, _F16_ANG)]
        o.append(p.clip(el, c=ALI, lw=1.8))
        cep = _F16_KCEP * u
        o.append(p.clip([(sh[0] + cep * math.cos(2 * math.pi * i / 96), sh[1] + cep * math.sin(2 * math.pi * i / 96)) for i in range(97)], c=SIG, lw=1.6, dash="4 2"))
        o.append(W(p.X(0) - 6, p.Y(0), p.X(0) + 6, p.Y(0), c=GRN, lw=2)); o.append(W(p.X(0), p.Y(0) - 6, p.X(0), p.Y(0) + 6, c=GRN, lw=2))
        o.append(T(p.x + p.w / 2, p.y + p.h + 30, "UERE %.2f m・CEP %.2f m" % (u, cep), "middle", 9.5, INK, True))
    o.append(T(14, 236, "横: 東西、縦: 南北 [m]。金の点: 400 回解いた位置、赤: 誤差の楕円（1σ）、青の破線: CEP の円、緑の十字: 本当の位置", "start", 9.5, MUT))
    return SVG(700, 246, o, "位置の散らばり（東京の 8 つの衛星、7 章と同じ計算。誤差の予算は上の図と同じ）。")


F["e16_scatter"] = _f16_scatter_fig()
