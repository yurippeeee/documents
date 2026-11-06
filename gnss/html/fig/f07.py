# -*- coding: utf-8 -*-
# 07 章 誤差と DOP の図
import numpy as _f07_np

# ---- 例の値（本文と同じ） ----
_F07_C = 299792458.0                     # 光の速さ [m/s]
_F07_TC = 1 / 1.023e6                    # C/A 符号の 1 チップ [s]
_F07_CTC = _F07_C * _F07_TC              # 1 チップ = 293.05 m
_F07_F1, _F07_F2, _F07_F5 = 1575.42e6, 1227.60e6, 1176.45e6
_F07_TOK = GNSS_TOKYO                    # 1 章の例の受信機（東京駅のあたり）
_F07_D2R = math.pi / 180
_F07_RE = 6371e3                         # 1 章と同じ地球の半径 [m]
_F07_HI = 350e3                          # 電離層を薄い殻とみなす高さ [m]（クロブッチャー・モデルと同じ）
_F07_N4 = ["G9", "G6", "G2", "G3"]       # 1 章の 4 つの衛星
_F07_CL4 = ["G6", "G13", "G3", "G9"]     # 東から南の空に偏った 4 つ（6 章 3 節）
# クロブッチャー・モデルの 8 つの係数（例の値。規格の α₀〜α₃・β₀〜β₃。本文では A_n・P_n と書く）
_F07_KA = [0.1118e-7, -0.7451e-8, -0.5961e-7, 0.1192e-6]
_F07_KP = [0.1167e6, -0.2294e6, -0.1311e6, 0.1049e7]
# 誤差の源の色（本文と同じ）: 衛星 紫・電離層 金・対流圏 緑・マルチパス 赤・受信機の雑音 青緑
_F07_SC = {"s": PUR, "I": GLD, "T": GRN, "M": ALI, "e": TEA}
# 6 節の誤差の予算（1σ、代表値）
_F07_BUD = [("衛星の時計と軌道", "s", 1.5), ("電離層（モデルで直した後）", "I", 3.5), ("対流圏（モデルで直した後）", "T", 0.4),
            ("マルチパス（開けた空）", "M", 1.0), ("受信機の雑音", "e", 0.5)]


def _f07_m(v, d=1):
    """負の数の − を全角の負号にした数。"""
    return (("%%.%df" % d) % v).replace("-", "−")


def _f07_fmt(v):
    if abs(v) < 1e-12:
        return "0"
    return ("%.4g" % v).replace("-", "−")


_F07_SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def _f07_pow(v):
    """10 のべきの目盛（10⁻¹・1・10・10²…）。"""
    e = int(round(math.log10(v)))
    if e == 0:
        return "1"
    if e == 1:
        return "10"
    return "10" + str(e).translate(_F07_SUP)


def _f07_sat(x, y, c=PUR, s=1.0, dash=None):
    """衛星の印（1 章と同じ見た目）。dash を与えると輪郭だけの印（計算した位置など）。"""
    if dash:
        return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.0, dash=dash)
                + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, "none", c, 1.0, dash)
                + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, "none", c, 1.0, dash)
                + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, "none", c, 1.2, dash))
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f07_rx(x, y, c=GRN):
    """受信機の印（地面に置いたアンテナ。1 章と同じ見た目）。"""
    return W(x - 6, y + 6, x + 6, y + 6, c=c, lw=1.6) + W(x, y + 6, x, y, c=c, lw=1.4) + D(x, y - 1, c, 3.4)


def _f07_ctx(x, y, segs, sz=13, b=True):
    """色分けした式を左から順に書く。segs = [(TX の書き方の文字, 色), ...]。返り値 (svg, 幅)。"""
    o, xx = [], x
    for txt, c in segs:
        o.append(TX(xx, y, txt, "start", sz, c, b))
        xx += TXW(txt, sz)
    return "".join(o), xx - x


# ---- 空の配置（1 章・6 章と同じ: GPS、時刻 0） ----
def _f07_visible(t=0.0, sysn=("GPS",), mask=0.0):
    """東京から時刻 t に見える衛星 [(名前, 仰角, 方位角, 距離, 衛星系)]（仰角の高い順）。"""
    out = []
    for s in gnss_const():
        if s["sys"] not in sysn:
            continue
        el, az, d = elaz(*_F07_TOK, sat_ecef(s, t))
        if el > mask:
            out.append((s["nm"], el, az, d, s["sys"]))
    return sorted(out, key=lambda q: -q[1])


_F07_VL = _f07_visible()
_F07_V = {q[0]: q for q in _F07_VL}
_F07_ALL = [q[0] for q in _F07_VL]       # 見えている 8 つ（仰角の高い順）


def _f07_G(elaz_list, sysl=None):
    """幾何行列 G（ENU の成分。i 行目は (−l_iᵀ, 1)。sysl を与えると衛星系ごとに時計の列を分ける）。"""
    rows = []
    us = []
    if sysl is not None:
        for s in sysl:
            if s not in us:
                us.append(s)
    nc = max(1, len(us))
    for k, (el, az) in enumerate(elaz_list):
        e, a = el * _F07_D2R, az * _F07_D2R
        r = [-math.cos(e) * math.sin(a), -math.cos(e) * math.cos(a), -math.sin(e)] + [0.0] * nc
        r[3 + (us.index(sysl[k]) if sysl is not None else 0)] = 1.0
        rows.append(r)
    return _f07_np.array(rows)


def _f07_H(names):
    """名前の並びの衛星（時刻 0 の東京）の (GᵀG)⁻¹。"""
    G = _f07_G([(_F07_V[n][1], _F07_V[n][2]) for n in names])
    return _f07_np.linalg.inv(G.T @ G)


def _f07_dops(H):
    return dict(G=math.sqrt(_f07_np.trace(H)), P=math.sqrt(H[0, 0] + H[1, 1] + H[2, 2]), H=math.sqrt(H[0, 0] + H[1, 1]),
                V=math.sqrt(H[2, 2]), T=math.sqrt(H[3, 3]))


def _f07_ell(C2):
    """2 行 2 列の共分散（東・北）から、楕円の長い半径・短い半径と、長い軸の向き（東から北へ回った角 [°]）。"""
    a, b, c = C2[0][0], C2[0][1], C2[1][1]
    m = (a + c) / 2
    r = math.sqrt(((a - c) / 2) ** 2 + b * b)
    return math.sqrt(m + r), math.sqrt(max(m - r, 0.0)), 0.5 * math.degrees(math.atan2(2 * b, a - c))


def _f07_ellpts(s1, s2, ang, k=1.0, n=120):
    """楕円の点（東・北の値）。"""
    ca, sa = math.cos(ang * _F07_D2R), math.sin(ang * _F07_D2R)
    out = []
    for i in range(n + 1):
        t = 2 * math.pi * i / n
        u, v = k * s1 * math.cos(t), k * s2 * math.sin(t)
        out.append((u * ca - v * sa, u * sa + v * ca))
    return out


# ---- 2 次元の正規分布の半径の確率（5 節） ----
def _f07_pin(R, s1, s2, n=2000):
    """長い半径 s1・短い半径 s2 の楕円の正規分布で、半径 R の円の中に入る確率。"""
    if s2 < 1e-12 * s1:
        return math.erf(R / (s1 * math.sqrt(2)))
    ph = _f07_np.linspace(0, 2 * math.pi, n, endpoint=False)
    q = _f07_np.cos(ph) ** 2 / s1 ** 2 + _f07_np.sin(ph) ** 2 / s2 ** 2
    return float(_f07_np.mean((1 - _f07_np.exp(-R * R * q / 2)) / q) / (s1 * s2))


def _f07_rad(p, s1, s2):
    """確率 p の円の半径（二分法）。"""
    lo, hi = 0.0, 10 * (s1 + s2)
    for _ in range(80):
        m = (lo + hi) / 2
        if _f07_pin(m, s1, s2) < p:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


# ---- 電離層・対流圏（2 節） ----
def _f07_klob(latd, lond, eld, azd, tgps, detail=False, scale=1.0):
    """クロブッチャー・モデル（IS-GPS-200 の手順）。L1 の遅れ [s]。角は度で受け取り、中で半円（180° = 1）に直す。"""
    phu, lmu, E, A = latd / 180, lond / 180, eld / 180, azd * _F07_D2R
    psi = 0.0137 / (E + 0.11) - 0.022                     # 受信機と電離層を通る点の、地球の中心から見た角
    phi = max(-0.416, min(0.416, phu + psi * math.cos(A)))
    lam = lmu + psi * math.sin(A) / math.cos(phi * math.pi)
    phm = phi + 0.064 * math.cos((lam - 1.617) * math.pi)   # 地磁気の緯度
    t = (4.32e4 * lam + tgps) % 86400.0                     # 電離層を通る点の地方時 [s]
    F = 1.0 + 16.0 * (0.53 - E) ** 3
    PER = max(sum(_F07_KP[n] * phm ** n for n in range(4)), 72000.0)
    AMP = max(scale * sum(_F07_KA[n] * phm ** n for n in range(4)), 0.0)
    x = 2 * math.pi * (t - 50400.0) / PER
    Tv = 5e-9 + AMP * (1 - x * x / 2 + x ** 4 / 24) if abs(x) < 1.57 else 5e-9
    if detail:
        return dict(psi=psi, phi=phi, lam=lam, phm=phm, t=t, F=F, PER=PER, AMP=AMP, x=x, Tv=Tv, T=F * Tv)
    return F * Tv


def _f07_klob_lt(lt, eld=90.0, azd=180.0, scale=1.0):
    """東京の地方時 lt [時] の L1 の遅れ [m]（GPS 時刻は地方時から経度で換算）。"""
    tg = (lt - _F07_TOK[1] / 15.0) * 3600.0
    return _f07_klob(_F07_TOK[0], _F07_TOK[1], eld, azd, tg, scale=scale) * _F07_C


def _f07_shell(eld):
    """薄い殻（高さ 350 km）のマッピング関数 1/cos z'（sin z' = R cos θ /(R + h)）。"""
    s = _F07_RE * math.cos(eld * _F07_D2R) / (_F07_RE + _F07_HI)
    return 1 / math.sqrt(1 - s * s)


def _f07_mT(eld):
    """対流圏のマッピング関数（Black と Eisner の近似の式）。"""
    s = math.sin(eld * _F07_D2R)
    return 1.001 / math.sqrt(0.002001 + s * s)


_F07_ZHD = 0.0022768 * 1013.25 / (1 - 0.00266 * math.cos(2 * _F07_TOK[0] * _F07_D2R) - 0.00028 * _F07_TOK[2] / 1000)  # 乾燥の天頂の遅れ（2.31 m）
_F07_ZWD = 0.10                          # 湿潤の天頂の遅れ（例の値）


# ---- マルチパス（3 節） ----
def _f07_lam(u):
    return max(0.0, 1 - abs(u))


def _f07_mpenv(g, tm, d, sgn):
    """同じ位相（sgn = +1）・逆の位相（−1）の反射波があるときの、E と L が等しくなる局部の符号のずれ [チップ]。
    g: 反射波の振幅の比、tm: 反射波の遅れ [チップ]、d: E と L の間隔 [チップ]。本文の場合分けの式。"""
    if sgn > 0:
        if tm < (1 + g) * d / 2:
            return g * tm / (1 + g)
        if tm <= 1 - d / 2 + g * d / 2:
            return g * d / 2
        if tm <= 1 + d / 2:
            return g * (1 + d / 2 - tm) / (2 - g)
        return 0.0
    if tm < (1 - g) * d / 2:
        return -g * tm / (1 - g)
    if tm <= 1 - d / 2 - g * d / 2:
        return -g * d / 2
    if tm <= 1 + d / 2:
        return -g * (1 + d / 2 - tm) / (2 + g)
    return 0.0


def _f07_mpcorr(u, g, tm, psi):
    """直接波と反射波を合わせた相関（複素数。直接波の位相を基準にした値）。"""
    return _f07_lam(u) + g * complex(math.cos(psi), math.sin(psi)) * _f07_lam(u - tm)


def _f07_mpdisc(u, g, tm, psi, d):
    """E と L の電力の差（5 章 3 節の判別器の分子）。"""
    E = _f07_mpcorr(u - d / 2, g, tm, psi)
    L = _f07_mpcorr(u + d / 2, g, tm, psi)
    return abs(E) ** 2 - abs(L) ** 2


def _f07_mptrack(g, tm, psi, d):
    """電力の差の判別器が 0 になり、ずれを戻す向きに働く点のうち、0 に最も近いもの [チップ]。"""
    us = _f07_np.linspace(-1.2, 1.6, 2801) + 1e-9
    vs = [_f07_mpdisc(u, g, tm, psi, d) for u in us]
    best = None
    for i in range(len(us) - 1):
        if vs[i] < 0 < vs[i + 1]:
            a, b = us[i], us[i + 1]
            for _ in range(40):
                m = (a + b) / 2
                if _f07_mpdisc(m, g, tm, psi, d) < 0:
                    a = m
                else:
                    b = m
            r = (a + b) / 2
            if best is None or abs(r) < abs(best):
                best = r
    return best if best is not None else 0.0


# =====================================================================
# 1 節: 信号の道と、誤差の源（擬似距離の式の各項）
# =====================================================================
def _f07_path_fig():
    o = []
    o.append(T(14, 18, "(a) 衛星から受信機までの道（高さの比は実際のとおりではない）", "start", 11.5, INK, True))
    gy = 300                                    # 地面
    # 層
    o.append(RECT(14, 86, 400, 40, 0, soft(GLD), "none", 0))
    o.append(T(20, 101, "電離層（高さ 60〜1000 km ほど）", "start", 10, GLD, True))
    o.append(TX(20, 117, "② 電離層遅延 I_i", "start", 10, GLD))
    o.append(RECT(14, 196, 400, 64, 0, soft(GRN), "none", 0))
    o.append(T(20, 211, "対流圏（地上から十数 km）", "start", 10, GRN, True))
    o.append(TX(20, 227, "③ 対流圏遅延 T_i", "start", 10, GRN))
    o.append(W(14, gy, 414, gy, c=MUT, lw=1.6))
    for xx in range(20, 414, 16):
        o.append(W(xx, gy, xx - 6, gy + 7, c=FNT, lw=1))
    # 建物
    bx, bw, bt = 330, 52, 210
    o.append(RECT(bx, bt, bw, gy - bt, 2, MSOFT, MUT, 1.2))
    for yy in range(bt + 12, gy - 8, 18):
        o.append(RECT(bx + 9, yy, 12, 9, 1, SCR, FNT, 0.8)); o.append(RECT(bx + 31, yy, 12, 9, 1, SCR, FNT, 0.8))
    # 衛星（本当の位置と、エフェメリスから計算した位置）
    sx, sy = 84, 46
    ax, ay = 250, gy - 10
    o.append(_f07_sat(sx, sy, PUR, 1.2))
    o.append(_f07_sat(sx + 30, sy - 12, PUR, 1.2, dash="2 2"))
    o.append(ARR(sx + 4, sy - 3, sx + 25, sy - 11, c=PUR, lw=1.2, head=5))
    o.append(T(sx + 50, sy - 14, "計算した位置", "start", 9.5, PUR, halo=True))
    o.append(TX(sx - 30, sy + 26, "① 衛星の時計と軌道の誤差 δr_i^s", "start", 10, PUR, True, halo=True))
    # 直接波
    o.append(ARR(sx + 4, sy + 6, ax - 1, ay - 8, c=SIG, lw=2.2, head=8))
    o.append(T(170, 168, "直接波", "start", 10, SIG, True, halo=True))
    # 反射波（建物の壁で反射）
    wx, wy = bx, 238
    o.append(W(sx + 8, sy + 4, wx, wy, c=ALI, lw=1.6, dash="6 3"))
    o.append(ARR(wx, wy, ax + 5, ay - 6, c=ALI, lw=1.6, head=7, dash="6 3"))
    o.append(T(wx - 6, wy - 30, "反射波", "end", 10, ALI, True, halo=True))
    o.append(TX(wx - 6, wy - 16, "④ マルチパス M_i", "end", 10, ALI, halo=True))
    # 受信機
    o.append(_f07_rx(ax, ay, GRN))
    o.append(RECT(ax - 70, gy + 12, 140, 22, 4, soft(TEA), TEA, 1.1))
    o.append(TX(ax, gy + 27, "⑤ 受信機の雑音 ε_i", "middle", 10, TEA, True))
    o.append(W(ax, ay + 6, ax, gy + 12, c=TEA, lw=1.1))
    # (b) 式
    xb = 436
    o.append(T(xb, 18, "(b) 擬似距離の式の各項", "start", 11.5, INK, True))
    rows = [("ρ_i", INK, "測った擬似距離（衛星の時計の補正の後）"), ("= r_i", INK, "衛星までの幾何学的な距離"), ("+ b", INK, "受信機の時計のずれ（距離に直した値）"),
            ("+ δr_i^s", PUR, "① 補正の後に残る衛星の時計と軌道の誤差"), ("+ I_i", GLD, "② 電離層の中で電波が遅れる分"),
            ("+ T_i", GRN, "③ 対流圏の中で電波が遅れる分"), ("+ M_i", ALI, "④ 反射波が混ざって山がずれる分"), ("+ ε_i", TEA, "⑤ 受信機の雑音で山が揺れる分")]
    for k, (sym, c, desc) in enumerate(rows):
        yy = 56 + k * 32
        o.append(TX(xb + 8, yy, sym, "start", 13, c, True))
        o.append(T(xb + 70, yy, desc, "start", 9.5, c if c != INK else MUT))
    o.append(W(xb, 56 + 2 * 32 + 12, xb + 260, 56 + 2 * 32 + 12, c=LIN, lw=0.8, dash="3 3"))
    o.append(TX(xb + 8, 56 + 8 * 32, "①〜⑤ が、6 章でまとめて ε_i と書いた誤差", "start", 9.5, INK, True))
    return SVG(700, 340, o, "擬似距離の誤差の源。(a) 衛星の電波は、衛星の時計と軌道の誤差（①）を含んで送られ、電離層（②）と対流圏（③）で遅れ、建物などで反射した電波（④）と混ざって、雑音（⑤）のある受信機で測られる。(b) 6 章でまとめて ε<sub>i</sub> と書いた誤差を、源ごとの 5 つの項に分けた式。色は、この章の図とデモで、どの源かを表す。")
F["e07_path"] = _f07_path_fig()


# =====================================================================
# 1 節: 誤差の大きさ（補正しないときと、補正した後。代表値。対数の目盛）
# =====================================================================
def _f07_sources_fig():
    o = []
    p = Plot(176, 40, 500, 300, (0.05, 3e5), (0, 1), xlog=True)
    xt = [0.1, 1, 10, 100, 1e3, 1e4, 1e5]
    o.append(p.axes(xl="擬似距離の誤差の大きさ [m]（対数の目盛）", yl=None, xt=xt, yt=[],
                    xfmt=lambda v: {0.1: "0.1", 1: "1", 10: "10", 100: "100", 1e3: "1 km", 1e4: "10 km", 1e5: "100 km"}[v]))
    rows = [("① 衛星の時計と軌道", PUR, (1e3, 1.5e5, "時計の補正の値を使わないとき（2 章 5 節）"), (0.5, 2, "補正の後")),
            ("② 電離層", GLD, (1, 45, "天頂で 1〜15 m、低い仰角で約 3 倍"), (0.5, 20, "モデルで直した後（約半分）")),
            ("③ 対流圏", GRN, (2.3, 25, "天頂 約 2.4 m 〜 仰角 5° で約 25 m"), (0.05, 1, "モデルで直した後")),
            ("④ マルチパス", ALI, (0.2, 50, "開けた空 〜1 m、ビル街で数十 m"), None),
            ("⑤ 受信機の雑音", TEA, (0.1, 3, "C/N_0 と追尾の設定による"), None)]
    o.append(T(14, 22, "誤差の大きさの範囲（代表値）。薄い棒: 補正しないとき　濃い棒: 補正した後", "start", 10.5, INK, True))
    for k, (nm, c, a, b) in enumerate(rows):
        y0 = 52 + k * 58
        o.append(T(p.x - 10, y0 + 14, nm, "end", 10.5, c, True))
        x1, x2 = p.X(a[0]), p.X(a[1])
        o.append(RECT(x1, y0, x2 - x1, 16, 3, soft(c), c, 1.1))
        lab = a[2]
        if x2 + 6 + TXW(lab, 9.5) < p.x + p.w:
            o.append(TX(x2 + 6, y0 + 12, lab, "start", 9.5, c))
        else:
            o.append(TX(x1 - 6, y0 + 12, lab, "end", 9.5, c))
        if b:
            x1, x2 = p.X(b[0]), p.X(b[1])
            o.append(RECT(x1, y0 + 22, x2 - x1, 14, 3, c, c, 1.1))
            o.append(T(x2 + 6, y0 + 33, b[2], "start", 9.5, c, True))
        else:
            o.append(T(p.X(a[0]), y0 + 33, "補正の値は無い（減らす工夫は 3 節・5 章 3 節）" if k == 3 else "補正の値は無い（追尾の工夫で小さくする。5 章 3 節）", "start", 9.5, MUT))
    return SVG(700, 384, o, "擬似距離の誤差の源ごとの大きさ（代表値。時刻・場所・受信機で大きく変わる）。衛星の時計のずれは、補正しないと数 km〜百 km あまりにもなるが、航法メッセージの値で直すと 1 m 前後になる。補正した後に最も大きく残るのは電離層である。マルチパスと受信機の雑音には、航法メッセージのような補正の値が無い。")
F["e07_sources"] = _f07_sources_fig()


# =====================================================================
# 1 節: 軌道の誤差は、視線の向きの成分だけが擬似距離に効く
# =====================================================================
def _f07_orbit_proj():
    """衛星から見える地上の範囲（仰角 0° 以上）で、視線の単位ベクトルの半径の成分と横の成分の 2 乗を、面積の重みで平均した平方根。"""
    a = 26560e3
    gmax = math.acos(_F07_RE / a)
    gs = _f07_np.linspace(0, gmax, 40001)
    w = _f07_np.sin(gs)
    px, pz = _F07_RE * _f07_np.sin(gs), _F07_RE * _f07_np.cos(gs)
    lx, lz = -px, a - pz
    n = _f07_np.hypot(lx, lz)
    cr = lz / n
    wr = math.sqrt(float(_f07_np.sum(w * cr ** 2) / _f07_np.sum(w)))
    wt = math.sqrt(float(_f07_np.sum(w * (1 - cr ** 2)) / _f07_np.sum(w) / 2))
    return wr, wt, math.degrees(math.asin(_F07_RE / a))


_F07_WR, _F07_WT, _F07_NADIR = _f07_orbit_proj()


def _f07_orbit_fig():
    o = []
    o.append(T(14, 18, "(a) GPS の衛星から見た地球（大きさの比は実際のとおり）", "start", 11.5, INK, True))
    k = 0.0074 / 1e3                      # px/m
    sx, sy = 190, 78
    ex, ey = sx, sy + 26560e3 * k
    Rp = _F07_RE * k
    o.append(CIRC(ex, ey, Rp, c=SIG, lw=1.4, fill=SSOFT))
    o.append(T(ex, ey + 8, "地球", "middle", 10, SIG, True))
    # 見える範囲の端（接線）
    ang = math.asin(_F07_RE / 26560e3)
    for sg in (-1, 1):
        tx = ex + sg * Rp * math.cos(ang); ty = ey - Rp * math.sin(ang)
        o.append(W(sx, sy, tx, ty, c=MUT, lw=1.1, dash="4 3"))
        o.append(_f07_rx(tx, ty - 5, GRN))
    o.append(_f07_rx(ex, ey - Rp - 5, GRN))
    o.append(W(sx, sy + 6, ex, ey - Rp - 11, c=SIG, lw=1.6))
    # 角の印（真下の向きと、見える範囲の端の線のなす角）
    ra = 70
    pts = [(sx + ra * math.sin(t), sy + ra * math.cos(t)) for t in _f07_np.linspace(0, ang, 12)]
    o.append(PL(pts, c=MUT, lw=1.1))
    o.append(T(sx + 16, sy + ra + 14, "%.1f°" % _F07_NADIR, "start", 10, MUT, True, halo=True))
    o.append(T(ex + 8, ey - Rp - 12, "真下の受信機", "start", 9.5, GRN, halo=True))
    o.append(T(ex - Rp * math.cos(ang) - 10, ey - Rp * math.sin(ang) - 2, "地平線に衛星を", "end", 9.5, GRN, halo=True))
    o.append(T(ex - Rp * math.cos(ang) - 10, ey - Rp * math.sin(ang) + 11, "見る受信機", "end", 9.5, GRN, halo=True))
    # 衛星と軌道の誤差の 3 つの向き
    o.append(_f07_sat(sx, sy, PUR, 1.2))
    o.append(ARR(sx, sy - 6, sx, sy - 34, c=PUR, lw=1.8, head=6))
    o.append(T(sx + 8, sy - 26, "半径の向き", "start", 9.5, PUR, True))
    o.append(ARR(sx + 18, sy, sx + 56, sy, c=PUR, lw=1.8, head=6))
    o.append(T(sx + 62, sy + 4, "進む向き", "start", 9.5, PUR, True))
    o.append(CIRC(sx - 34, sy, 6, c=PUR, lw=1.4)); o.append(D(sx - 34, sy, PUR, 2))
    o.append(T(sx - 46, sy + 4, "軌道面に垂直", "end", 9.5, PUR, True))
    o.append(T(14, 352, "どの受信機の視線も、半径の向きから %.1f° 以内にある" % _F07_NADIR, "start", 10, INK))
    # (b) 擬似距離に効く割合
    xb = 392
    o.append(T(xb, 18, "(b) 擬似距離に効く割合（地上で平均）", "start", 11.5, INK, True))
    q = Plot(xb + 118, 50, 160, 180, (0, 1.1), (0, 1))
    o.append(q.axes(xl="誤差 1 m あたりの擬似距離の誤差 [m]", yl=None, xt=[0, 0.25, 0.5, 0.75, 1.0], yt=[], xfmt=_f07_fmt))
    items = [("軌道（半径の向き）", _F07_WR, PUR), ("軌道（進む向き）", _F07_WT, PUR), ("軌道（軌道面に垂直）", _F07_WT, PUR), ("衛星の時計", 1.0, PUR)]
    for i, (lab, v, c) in enumerate(items):
        yy = 62 + i * 42
        o.append(T(q.x - 8, yy + 13, lab, "end", 9.5, INK))
        o.append(RECT(q.X(0), yy, q.X(v) - q.X(0), 20, 3, soft(c) if i < 3 else c, c, 1.2))
        o.append(T(q.X(v) + 5, yy + 14, "%.2f" % v, "start", 10, c, True))
    o.append(T(xb, 300, "半径の向きの誤差と時計の誤差は、ほぼそのまま入る。", "start", 9.5, INK))
    o.append(T(xb, 316, "進む向き・軌道面に垂直な向きの誤差は 1/7 ほどになる。", "start", 9.5, INK))
    o.append(T(xb, 332, "（視線の単位ベクトルの成分の 2 乗を、見える範囲で平均）", "start", 9.5, MUT))
    return SVG(700, 362, o, "衛星の軌道の誤差のうち、擬似距離に効くのは、受信機の視線の向きの成分だけである。(a) 2 万 km 先の衛星からは、地球は %.1f° の範囲にしか見えないので、どの受信機の視線も、衛星の半径の向きに近い。(b) 半径の向きの誤差は %.2f 倍、それに垂直な 2 つの向きの誤差は %.2f 倍で擬似距離に入る（衛星から見える地上の範囲で、面積の重みで 2 乗を平均した値）。時計の誤差は、どの受信機にも同じ量で入る。" % (_F07_NADIR, _F07_WR, _F07_WT))
F["e07_orbit"] = _f07_orbit_fig()


# =====================================================================
# 2 節: 電離層の電子の密度（代表的な形）と、遅れの周波数による違い（1/f²）
# =====================================================================
def _f07_chap(h, Nm, hm, H):
    z = (h - hm) / H
    return Nm * _f07_np.exp(0.5 * (1 - z - _f07_np.exp(-z)))


def _f07_tec(Nm, hm, H):
    hs = _f07_np.linspace(0, 3000e3, 30001)
    return float(_f07_np.trapezoid(_f07_chap(hs, Nm, hm, H), hs))


_F07_DAY = (1.0e12, 300e3, 60e3)      # 昼の例（最も多い所の電子の数 [個/m³]・その高さ・広がり）
_F07_NIGHT = (2.0e11, 350e3, 70e3)    # 夜の例
_F07_TECD = _f07_tec(*_F07_DAY) / 1e16
_F07_TECN = _f07_tec(*_F07_NIGHT) / 1e16


def _f07_atmos_fig():
    o = []
    o.append(T(14, 18, "(a) 電離層の電子の数の高さ分布（代表的な形）", "start", 11.5, INK, True))
    p = Plot(70, 40, 250, 270, (0, 12), (0, 1000))
    o.append(p.axes(xl="電子の数 [10^{11} 個/m^3]", yl="高さ [km]", xt=[0, 3, 6, 9, 12], yt=[0, 200, 400, 600, 800, 1000]))
    hs = _f07_np.linspace(60e3, 1000e3, 300)
    o.append(p.line([(v / 1e11, h / 1e3) for v, h in zip(_f07_chap(hs, *_F07_DAY), hs)], c=GLD, lw=2.2))
    o.append(p.line([(v / 1e11, h / 1e3) for v, h in zip(_f07_chap(hs, *_F07_NIGHT), hs)], c=GLD, lw=1.8, dash="5 3"))
    o.append(T(p.X(5.6), p.Y(500), "昼", "start", 10, GLD, True, halo=True))
    o.append(T(p.X(5.6), p.Y(500) + 14, "TEC %.0f TECU" % _F07_TECD, "start", 9.5, GLD, halo=True))
    o.append(T(p.X(2.4), p.Y(450), "夜", "start", 10, GLD, True, halo=True))
    o.append(T(p.X(2.4), p.Y(450) + 14, "TEC %.0f TECU" % _F07_TECN, "start", 9.5, GLD, halo=True))
    o.append(W(p.x, p.Y(350), p.x + p.w, p.Y(350), c=MUT, lw=1, dash="3 3"))
    o.append(T(p.x + p.w - 3, p.Y(350) - 4, "350 km", "end", 9, MUT, halo=True))
    o.append(RECT(p.x, p.Y(14), p.w, p.Y(0) - p.Y(14), 0, soft(GRN), GRN, 0.8))
    o.append(T(p.x + 6, p.Y(14) - 4, "対流圏（0〜十数 km。この目盛では細い帯）", "start", 9, GRN, halo=True))
    # (b) 周波数と遅れ
    xb = 400
    o.append(T(xb - 14, 18, "(b) 天頂の遅れと周波数（昼の例の TEC）", "start", 11.5, INK, True))
    q = Plot(xb + 30, 40, 250, 230, (1100, 1700), (0, 9))
    o.append(q.axes(xl="周波数 f [MHz]", yl="天頂の遅れ [m]", xt=[1100, 1200, 1300, 1400, 1500, 1600, 1700], yt=[0, 3, 6, 9]))
    tec = _F07_TECD * 1e16
    fs = _f07_np.linspace(1100e6, 1700e6, 200)
    o.append(q.line([(f / 1e6, 40.3 * tec / f ** 2) for f in fs], c=GLD, lw=2.2))
    for nm, f in (("L5", _F07_F5), ("L2", _F07_F2), ("L1", _F07_F1)):
        v = 40.3 * tec / f ** 2
        o.append(D(q.X(f / 1e6), q.Y(v), GLD, 4))
        o.append(T(q.X(f / 1e6) + (6 if nm != "L5" else -2), q.Y(v) + (-7 if nm != "L5" else 18), "%s %.2f m" % (nm, v), "start", 9.5, GLD, True, halo=True))
    o.append(W(q.X(1100), q.Y(2.41), q.X(1700), q.Y(2.41), c=GRN, lw=2, dash="6 3"))
    o.append(T(q.X(1690), q.Y(2.41) + 14, "対流圏 約 2.4 m（周波数によらない）", "end", 9.5, GRN, True, halo=True))
    o.append(TX(xb + 4, 330, "I = 40.3 TEC / f^2: L2 は L1 の %.2f 倍、L5 は %.2f 倍" % ((_F07_F1 / _F07_F2) ** 2, (_F07_F1 / _F07_F5) ** 2), "start", 9.5, GLD, True))
    return SVG(700, 356, o, "電離層の遅れの源と、周波数による違い。(a) 電離層の電子は、高さ 300 km 前後で最も多く、昼は夜の数倍ある（形と数は代表的な例）。点線は、後半で電離層を薄い殻とみなす高さ 350 km。電波の通り道の電子の数の合計（TEC）が遅れを決める。(b) 昼の例の TEC（%.0f TECU）での天頂の遅れ。電離層の遅れは周波数の 2 乗に反比例し、L1 より低い L2・L5 では大きい。対流圏の遅れは、L バンドでは周波数によらない。" % _F07_TECD)
F["e07_atmos"] = _f07_atmos_fig()


# =====================================================================
# 2 節: 斜めに通ると長くなる（薄い殻）と、クロブッチャー・モデルの 1 日の形
# =====================================================================
def _f07_klob_fig():
    o = []
    o.append(T(14, 18, "(a) 薄い殻を斜めに通る（高さは誇張）", "start", 11.5, INK, True))
    cx, cy, R, hh = 175, 292, 120, 52           # 地球の中心・半径・殻の高さ（図の上の長さ）
    th = 25 * _F07_D2R                            # 描く仰角
    def arc(rr, a0, a1, c, lw):
        pts = [(cx + rr * math.sin(a), cy - rr * math.cos(a)) for a in _f07_np.linspace(a0, a1, 60)]
        return PL(pts, c=c, lw=lw)
    o.append(arc(R, -1.05, 1.05, SIG, 1.6))
    o.append(arc(R + hh, -0.95, 0.95, GLD, 2.4))
    o.append(T(cx + (R + hh) * math.sin(0.62) + 6, cy - (R + hh) * math.cos(0.62) + 4, "電離層（高さ h）", "start", 9.5, GLD, True, halo=True))
    o.append(T(cx + R * math.sin(0.95) + 6, cy - R * math.cos(0.95) + 10, "地面", "start", 9.5, SIG, halo=True))
    a_r = -0.42                                    # 受信機の位置（中心から見た角）
    rx, ry = cx + R * math.sin(a_r), cy - R * math.cos(a_r)
    ux, uy = math.sin(a_r), -math.cos(a_r)        # 上の向き
    hx, hy = -uy, ux                               # 水平（右向き）
    dx, dy = hx * math.cos(th) + ux * math.sin(th), hy * math.cos(th) + uy * math.sin(th)
    bq = 2 * ((rx - cx) * dx + (ry - cy) * dy); cq = (rx - cx) ** 2 + (ry - cy) ** 2 - (R + hh) ** 2
    s_ = (-bq + math.sqrt(bq * bq - 4 * cq)) / 2
    px, py = rx + s_ * dx, ry + s_ * dy
    o.append(W(cx, cy, rx, ry, c=MUT, lw=1.1, dash="4 3"))
    o.append(W(cx, cy, px, py, c=MUT, lw=1.1, dash="4 3"))
    o.append(D(cx, cy, MUT, 3))
    o.append(T(cx + 6, cy + 4, "地球の中心", "start", 9, MUT, halo=True))
    o.append(TX((cx + rx) / 2 - 8, (cy + ry) / 2, "R", "end", 10.5, MUT, True, halo=True))
    o.append(TX((cx + px) / 2 + 8, (cy + py) / 2 + 4, "R + h", "start", 10.5, MUT, True, halo=True))
    o.append(W(rx - hx * 40, ry - hy * 40, rx + hx * 40, ry + hy * 40, c=FNT, lw=1, dash="2 3"))
    o.append(W(px, py, px + (px - cx) / (R + hh) * 46, py + (py - cy) / (R + hh) * 46, c=FNT, lw=1, dash="2 3"))
    o.append(ARR(rx, ry, px + dx * 46, py + dy * 46, c=SIG, lw=2, head=7))
    o.append(_f07_rx(rx, ry - 5, GRN))
    o.append(D(px, py, GLD, 4.5))
    o.append(T(px - 10, py + 4, "電離層を通る点", "end", 9.5, GLD, True, halo=True))
    o.append(TX(rx + 34, ry - 4, "θ", "start", 11, SIG, True, halo=True))
    o.append(TX(px + 12, py - 20, "z'", "start", 11, GLD, True, halo=True))
    o.append(T(14, 318, "中心・受信機・通る点の三角形の正弦定理から", "start", 9.5, INK))
    o.append(TX(14, 336, "sin z' = R cos θ / (R + h)", "start", 10.5, GLD, True))
    o.append(TX(14, 354, "倍率 m_I(θ) = 1 / cos z'（R = 6 371 km、h = 350 km）", "start", 9.5, INK))
    # (b) 倍率と仰角
    xb = 392
    o.append(T(xb, 18, "(b) 天頂の何倍か（電離層の倍率）", "start", 11.5, INK, True))
    q = Plot(xb + 40, 40, 250, 200, (0, 90), (0, 3.5))
    o.append(q.axes(xl="仰角 θ [°]", yl="倍率", xt=[0, 15, 30, 45, 60, 75, 90], yt=[0, 1, 2, 3]))
    els = _f07_np.linspace(0, 90, 181)
    o.append(q.line([(e, _f07_shell(e)) for e in els], c=GLD, lw=2.2))
    o.append(q.line([(e, 1 + 16 * (0.53 - e / 180) ** 3) for e in els], c=MUT, lw=1.4, dash="5 3"))
    for e in (5, 10, 30, 90):
        o.append(D(q.X(e), q.Y(_f07_shell(e)), GLD, 3.6))
        o.append(T(q.X(e) + (5 if e < 90 else -4), q.Y(_f07_shell(e)) - 7, "%.2f" % _f07_shell(e), "start" if e < 90 else "end", 9.5, GLD, True, halo=True))
    o.append(LEGL(xb + 10, 296, [(GLD, None, "薄い殻の 1/cos z'"), (MUT, "5 3", "モデルの近似の式")], 9.5))
    # (c) 1 日の形
    o.append(T(14, 388, "(c) クロブッチャー・モデルで計算した東京の天頂の遅れ（L1、例の 8 つの係数）", "start", 11.5, INK, True))
    r = Plot(70, 408, 560, 170, (0, 24), (0, 5))
    o.append(r.axes(xl="電離層を通る点の地方時 [時]", yl="天頂の遅れ [m]", xt=list(range(0, 25, 2)), yt=[0, 1, 2, 3, 4, 5]))
    lts = _f07_np.linspace(0, 24, 481)
    vals = [_f07_klob_lt(lt) for lt in lts]
    o.append(r.line(list(zip(lts, vals)), c=GLD, lw=2.4))
    o.append(W(r.X(0), r.Y(1.499), r.X(24), r.Y(1.499), c=MUT, lw=1, dash="3 3"))
    o.append(T(r.X(0.4), r.Y(1.499) - 6, "夜は一定の 5 ns（1.50 m）", "start", 9.5, MUT, True, halo=True))
    pk = _f07_klob_lt(14.0)
    o.append(D(r.X(14), r.Y(pk), GLD, 4.5))
    o.append(T(r.X(14) + 10, r.Y(pk) - 4, "14 時に頂点 %.2f m" % pk, "start", 10, GLD, True, halo=True))
    d0 = _f07_klob(_F07_TOK[0], _F07_TOK[1], 90, 0, (14 - _F07_TOK[1] / 15) * 3600, detail=True)
    half = d0["PER"] / 4 / 3600
    o.append(DIM(r.X(14 - half), r.Y(0.45), r.X(14 + half), r.Y(0.45), None, c=GLD))
    o.append(TX(r.X(14), r.Y(0.45) - 6, "cos の半周期（周期 P_I = %.1f 時間の半分）" % (d0["PER"] / 3600), "middle", 9.5, GLD, halo=True))
    o.append(DIM(r.X(20.6), r.Y(1.499), r.X(20.6), r.Y(pk), None, c=GLD))
    o.append(TX(r.X(20.9), r.Y((pk + 1.5) / 2) + 4, "振幅 A_I = %.2f m" % (d0["AMP"] * _F07_C), "start", 9.5, GLD, True, halo=True))
    return SVG(700, 632, o, "電離層の遅れの計算。(a) 電離層を高さ h の薄い殻とみなすと、仰角 θ で見た電波は、殻を天頂角 z' で斜めに横切り、遅れは天頂の 1/cos z' 倍になる。(b) その倍率は、真上で 1、仰角 30° で 1.75、5° で 3.04 になる。クロブッチャー・モデルの近似の式（破線）もほぼ同じ。(c) クロブッチャー・モデルの天頂の遅れは、夜は 5 ns で一定、昼は 14 時を頂点とする cos の半周期の形で、振幅と周期を、航法メッセージの 8 つの係数（ここでは例の値）から計算する。")
F["e07_klob"] = _f07_klob_fig()


# =====================================================================
# 2 節: 対流圏 — 天頂の遅れの内訳と、仰角と遅れの関係（電離層と並べる）
# =====================================================================
def _f07_tropo_fig():
    o = []
    o.append(T(14, 18, "(a) 対流圏の天頂の遅れ（内訳）", "start", 11.5, INK, True))
    bx, by, bh = 60, 46, 200
    sc = bh / 3.0
    o.append(W(bx, by, bx, by + bh, c=MUT, lw=1.2))
    for v in (0, 1, 2, 3):
        o.append(W(bx - 4, by + bh - v * sc, bx, by + bh - v * sc, c=MUT, lw=1))
        o.append(T(bx - 7, by + bh - v * sc + 3.5, "%d" % v, "end", 9.5, MUT))
    o.append(TX(bx - 30, by + bh / 2, "天頂の遅れ [m]", "middle", 10, MUT, rot=-90))
    h1 = _F07_ZHD * sc
    o.append(RECT(bx + 20, by + bh - h1, 50, h1, 2, soft(GRN), GRN, 1.3))
    o.append(RECT(bx + 20, by + bh - h1 - 0.4 * sc, 50, 0.4 * sc, 2, GRN, GRN, 1.0, dash="3 2"))
    o.append(RECT(bx + 20, by + bh - h1 - _F07_ZWD * sc, 50, _F07_ZWD * sc, 0, GRN, GRN, 1.0))
    o.append(T(bx + 78, by + bh - h1 / 2 - 6, "乾燥の部分 %.2f m" % _F07_ZHD, "start", 10, GRN, True))
    o.append(T(bx + 78, by + bh - h1 / 2 + 9, "気圧から計算できる", "start", 9.5, MUT))
    o.append(T(bx + 78, by + bh - h1 - 0.2 * sc - 4, "湿潤の部分 0〜0.4 m", "start", 10, GRN, True))
    o.append(T(bx + 78, by + bh - h1 - 0.2 * sc + 11, "水蒸気で決まり、予測しにくい", "start", 9.5, MUT))
    o.append(T(14, 284, "乾燥の部分 ≈ 0.002 277 × 気圧 [hPa]（m）", "start", 9.5, INK))
    o.append(T(14, 300, "1013.25 hPa で %.2f m（Saastamoinen の式。東京の緯度・高さ）" % _F07_ZHD, "start", 9.5, MUT))
    # (b) 平らな層と丸い層
    xb = 360
    o.append(T(xb, 18, "(b) 層を斜めに通る道のり", "start", 11.5, INK, True))
    gy, ty = 220, 120
    o.append(RECT(xb + 10, ty, 310, gy - ty, 0, soft(GRN), "none", 0))
    o.append(W(xb + 10, gy, xb + 320, gy, c=MUT, lw=1.6))
    o.append(T(xb + 286, gy - 10, "対流圏（厚さ H の層）", "end", 9.5, GRN, True))
    rx0 = xb + 60
    o.append(_f07_rx(rx0, gy - 6, GRN))
    o.append(ARR(rx0, gy - 8, rx0, ty - 30, c=SIG, lw=1.6, head=6))
    o.append(T(rx0 + 6, ty - 18, "真上: H", "start", 9.5, SIG, True))
    th = 28 * _F07_D2R
    ex_ = rx0 + (gy - 8 - ty) / math.tan(th)
    o.append(ARR(rx0, gy - 8, ex_ + 30 * math.cos(th), ty - 30 * math.sin(th), c=SIG, lw=1.6, head=6))
    o.append(T(ex_ - 20, ty - 12, "仰角 θ: H / sin θ", "start", 9.5, SIG, True, halo=True))
    o.append(TX(rx0 + 40, gy - 14, "θ", "start", 10.5, SIG, True, halo=True))
    o.append(DIM(xb + 300, ty, xb + 300, gy, None, c=GRN))
    o.append(T(xb + 296, (ty + gy) / 2 + 4, "H", "end", 10.5, GRN, True))
    o.append(T(xb + 10, 252, "平らな層なら倍率は 1/sin θ（θ → 0° で限りなく大きい）。", "start", 9.5, INK))
    o.append(T(xb + 10, 268, "地球は丸いので、低い仰角では 1/sin θ より小さい。", "start", 9.5, INK))
    o.append(TX(xb + 10, 284, "近似の式 m_T(θ) = 1.001 / √(0.002001 + sin^2 θ)", "start", 9.5, GRN, True))
    # (c) 仰角と遅れ
    o.append(T(14, 336, "(c) 仰角と遅れ（L1。電離層はクロブッチャー・モデルの例の値、東京）", "start", 11.5, INK, True))
    q = Plot(70, 356, 560, 220, (0, 90), (0.5, 50), ylog=True)
    o.append(q.axes(xl="仰角 θ [°]", yl="遅れ [m]（対数の目盛）", xt=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90], yt=[1, 2, 5, 10, 20, 50], yfmt=_f07_fmt))
    els = _f07_np.linspace(2, 90, 177)
    zt = _F07_ZHD + _F07_ZWD
    o.append(q.clip([(e, zt / math.sin(e * _F07_D2R)) for e in els], c=GRN, lw=1.3, dash="4 3"))
    o.append(q.line([(e, zt * _f07_mT(e)) for e in els], c=GRN, lw=2.4))
    o.append(q.line([(e, _f07_klob_lt(14.0, e)) for e in els], c=GLD, lw=2.4))
    o.append(q.line([(e, _f07_klob_lt(2.0, e)) for e in els], c=GLD, lw=1.8, dash="6 3"))
    o.append(T(q.X(88), q.Y(zt) - 6, "対流圏", "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(88), q.Y(_f07_klob_lt(14.0, 88)) - 6, "電離層（14 時）", "end", 9.5, GLD, True, halo=True))
    o.append(T(q.X(88), q.Y(_f07_klob_lt(2.0, 88)) + 14, "電離層（2 時）", "end", 9.5, GLD, True, halo=True))
    # 具体値の表
    ty0 = 634
    cols = [90, 30, 10, 5]
    o.append(T(70, ty0, "仰角", "start", 9.5, MUT, True))
    for j, e in enumerate(cols):
        o.append(T(300 + j * 90, ty0, "%d°" % e, "end", 9.5, MUT, True))
    o.append(W(70, ty0 + 5, 640, ty0 + 5, c=LIN, lw=0.8))
    rows = [("対流圏（近似の式、天頂 %.2f m）" % zt, GRN, lambda e: zt * _f07_mT(e)), ("電離層 14 時（クロブッチャー・モデル）", GLD, lambda e: _f07_klob_lt(14.0, e)),
            ("電離層 2 時（同じ）", GLD, lambda e: _f07_klob_lt(2.0, e))]
    for i, (lab, c, fn) in enumerate(rows):
        yy = ty0 + 20 + i * 16
        o.append(T(70, yy, lab, "start", 9.5, c, True))
        for j, e in enumerate(cols):
            o.append(T(300 + j * 90, yy, "%.2f m" % fn(e), "end", 10, c))
    o.append(LEGL(70, ty0 + 76, [(GRN, None, "対流圏 m_T(θ) の近似"), (GRN, "4 3", "対流圏 1/sin θ"), (GLD, None, "電離層 14 時"), (GLD, "6 3", "電離層 2 時")], 9.5, 14))
    return SVG(700, 722, o, "対流圏の遅れ。(a) 天頂の遅れは約 2.4 m で、大部分は気圧から計算できる乾燥の部分である（湿潤の部分は例の値 0.1 m とした）。(b) 層を斜めに通ると、道のりは仰角 θ の低いほど長い。平らな層の 1/sin θ は地平線で限りなく大きくなるが、丸い地球では有限で、近似の式（Black と Eisner の式）が使われる。(c) 仰角と遅れ。対流圏は仰角 5° で天頂の約 10 倍、電離層は約 3 倍になる（電離層は昼と夜で大きく違う）。対流圏の遅れは周波数によらない。")
F["e07_tropo"] = _f07_tropo_fig()
