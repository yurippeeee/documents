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
    """薄い殻（高さ 350 km）のマッピング関数 1/cos z'（sin z' = R_E cos θ /(R_E + h_I)）。"""
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
    o.append(T(sx + 52, sy - 10, "計算した位置", "start", 9.5, PUR, halo=True))
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
    return SVG(700, 340, o, "擬似距離の誤差の 5 つの源（色は、この章の図とデモで、どの源かを表す）。")
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
    same, diff = "近くの受信機でほぼ同じ", "受信機ごとに違う"
    slow = "数分〜数時間でゆっくり変わる"
    spd = [slow, slow, slow, "数十秒〜十分ほどで変わる", "1 秒ごとに変わる"]
    rows = [("① 衛星の時計と軌道", PUR, (1e3, 1.5e5, "時計の補正の値を使わないとき（2 章 5 節）"), (0.5, 2, "航法メッセージの値で直した後: 軌道 約 1 m・時計 約 5 ns（1.5 m）"), same),
            ("② 電離層", GLD, (1, 45, "天頂で 1〜10 m あまり、低い仰角で約 3 倍"), (0.5, 20, "クロブッチャー・モデルで直した後（約半分が残る。2 節）"), same),
            ("③ 対流圏", GRN, (2.3, 25, "天頂 約 2.4 m 〜 仰角 5° で約 25 m"), (0.05, 1, "気圧などからのモデルで直した後（2 節）"), same),
            ("④ マルチパス", ALI, (0.2, 50, "開けた空 〜1 m、ビル街で数十 m"), "補正の値は無い（アンテナ・相関器・置き場所・仰角マスクで減らす。3 節）", diff),
            ("⑤ 受信機の雑音", TEA, (0.1, 3, "C/N_0 と追尾の設定による"), "補正の値は無い（ループの帯域と E・L の間隔で小さくする。5 章 3 節）", diff)]
    o.append(T(14, 22, "誤差の大きさの範囲。薄い棒: 補正しないとき　濃い棒: 補正した後　左の列: 近くの受信機との違いと、変わる速さ", "start", 10.5, INK, True))
    for k, (nm, c, a, b, near) in enumerate(rows):
        y0 = 52 + k * 58
        o.append(T(p.x - 10, y0 + 14, nm, "end", 10.5, c, True))
        o.append(T(p.x - 10, y0 + 29, near, "end", 9.5, MUT))
        o.append(T(p.x - 10, y0 + 43, spd[k], "end", 9.5, MUT))
        x1, x2 = p.X(a[0]), p.X(a[1])
        o.append(RECT(x1, y0, x2 - x1, 16, 3, soft(c), c, 1.1))
        lab = a[2]
        if x2 + 6 + TXW(lab, 9.5) < p.x + p.w:
            o.append(TX(x2 + 6, y0 + 12, lab, "start", 9.5, c))
        else:
            o.append(TX(x1 - 6, y0 + 12, lab, "end", 9.5, c))
        if not isinstance(b, str):
            x1, x2 = p.X(b[0]), p.X(b[1])
            o.append(RECT(x1, y0 + 22, x2 - x1, 14, 3, c, c, 1.1))
            o.append(T(x2 + 6, y0 + 33, b[2], "start", 9.5, c, True))
        else:
            o.append(T(p.X(a[0]), y0 + 33, b, "start", 9.5, MUT))
    return SVG(700, 384, o, "擬似距離の誤差の源ごとの大きさと性質（どれも代表値で、時刻・場所・受信機で大きく変わる。衛星の時計と軌道の補正の後の値は、国際的な観測網 IGS の公表による RMS）。")
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
    return SVG(700, 362, o, "衛星の軌道と時計の誤差が、擬似距離に入る割合（(b) は、衛星から見える地上の範囲で、視線の単位ベクトルの成分の 2 乗を面積の重みで平均した平方根）。")
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


_F07_SQ2PIE = math.sqrt(2 * math.pi * math.e)   # チャップマンの形の積分 ∫exp(½(1 − z − e^{−z}))dz
_F07_DAY = (25e16 / (60e3 * _F07_SQ2PIE), 300e3, 60e3)     # 昼の例（最も多い所の電子の数 [個/m³]・その高さ・広がり）。TEC 25 TECU
_F07_NIGHT = (6e16 / (70e3 * _F07_SQ2PIE), 350e3, 70e3)    # 夜の例。TEC 6 TECU
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
        o.append(T(q.X(f / 1e6) + (6 if nm != "L5" else -7), q.Y(v) + (-7 if nm != "L5" else 17), "%s %.2f m" % (nm, v), "start" if nm != "L5" else "end", 9.5, GLD, True, halo=True))
    o.append(W(q.X(1100), q.Y(2.41), q.X(1700), q.Y(2.41), c=GRN, lw=2, dash="6 3"))
    o.append(T(q.X(1690), q.Y(2.41) + 14, "対流圏 約 2.4 m（周波数によらない）", "end", 9.5, GRN, True, halo=True))
    o.append(TX(xb + 4, 318, "I = 40.3 TEC / f^2: L2 は L1 の %.2f 倍、L5 は %.2f 倍" % ((_F07_F1 / _F07_F2) ** 2, (_F07_F1 / _F07_F5) ** 2), "start", 9.5, GLD, True))
    o.append(T(xb + 4, 334, "L1 では 1 TECU あたり %.3f m（%.0f TECU で %.2f m）" % (40.3e16 / _F07_F1 ** 2, _F07_TECD, 40.3e16 * _F07_TECD / _F07_F1 ** 2), "start", 9.5, GLD, True))
    return SVG(700, 356, o, "電離層の電子の数と、天頂の遅れ（電子の数の形と値は代表的な例。(a) の点線は、電離層を薄い殻とみなす高さ。(b) は昼の例の TEC %.0f TECU）。" % _F07_TECD)
F["e07_atmos"] = _f07_atmos_fig()


# =====================================================================
# 2 節: 斜めに通ると長くなる（薄い殻のマッピング関数）
# =====================================================================
def _f07_angarc(x, y, r, v1, v2, c=MUT, lw=1.1):
    """点 (x, y) で、向き v1 から向き v2 までの角を示す弧（近い側を回る）。"""
    a1, a2 = math.atan2(v1[1], v1[0]), math.atan2(v2[1], v2[0])
    da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
    return PL([(x + r * math.cos(a1 + da * k / 24), y + r * math.sin(a1 + da * k / 24)) for k in range(25)], c=c, lw=lw)


def _f07_shell_fig():
    o = []
    o.append(T(14, 18, "(a) 薄い殻を斜めに通る（高さは誇張）", "start", 11.5, INK, True))
    cx, cy, R, hh = 175, 292, 120, 52           # 地球の中心・半径・殻の高さ（図の上の長さ）
    th = 25 * _F07_D2R                            # 描く仰角
    def arc(rr, a0, a1, c, lw):
        pts = [(cx + rr * math.sin(a), cy - rr * math.cos(a)) for a in _f07_np.linspace(a0, a1, 60)]
        return PL(pts, c=c, lw=lw)
    o.append(arc(R, -1.05, 1.05, SIG, 1.6))
    o.append(arc(R + hh, -0.95, 0.95, GLD, 2.4))
    o.append(TX(cx + (R + hh) * math.sin(0.62) + 6, cy - (R + hh) * math.cos(0.62) + 4, "電離層（高さ h_I）", "start", 9.5, GLD, True, halo=True))
    o.append(T(cx + R * math.sin(0.95) + 6, cy - R * math.cos(0.95) + 10, "地面", "start", 9.5, SIG, halo=True))
    a_r = -0.42                                    # 受信機の位置（中心から見た角）
    rx, ry = cx + R * math.sin(a_r), cy - R * math.cos(a_r)
    ux, uy = math.sin(a_r), -math.cos(a_r)        # 上の向き
    hx, hy = -uy, ux                               # 水平（右向き）
    dx, dy = hx * math.cos(th) + ux * math.sin(th), hy * math.cos(th) + uy * math.sin(th)
    bq = 2 * ((rx - cx) * dx + (ry - cy) * dy); cq = (rx - cx) ** 2 + (ry - cy) ** 2 - (R + hh) ** 2
    s_ = (-bq + math.sqrt(bq * bq - 4 * cq)) / 2
    px, py = rx + s_ * dx, ry + s_ * dy
    # 三角形（中心・受信機・通る点）
    o.append(PL([(cx, cy), (rx, ry), (px, py)], c="none", lw=0, fill=MSOFT, op=0.5))
    o.append(W(cx, cy, rx, ry, c=MUT, lw=1.3))
    o.append(W(cx, cy, px, py, c=MUT, lw=1.3))
    o.append(D(cx, cy, MUT, 3))
    o.append(T(cx + 6, cy + 4, "地球の中心", "start", 9, MUT, halo=True))
    o.append(TX((cx + rx) / 2 - 8, (cy + ry) / 2 + 8, "R_E", "end", 10.5, MUT, True, halo=True))
    o.append(TX((cx + px) / 2 + 8, (cy + py) / 2 + 14, "R_E + h_I", "start", 10.5, MUT, True, halo=True))
    o.append(W(rx - hx * 40, ry - hy * 40, rx + hx * 40, ry + hy * 40, c=FNT, lw=1, dash="2 3"))
    pux, puy = (px - cx) / (R + hh), (py - cy) / (R + hh)      # 通る点の真上の向き
    o.append(W(px, py, px + pux * 46, py + puy * 46, c=FNT, lw=1, dash="2 3"))
    o.append(ARR(rx, ry, px + dx * 46, py + dy * 46, c=SIG, lw=2, head=7))
    o.append(T(px + dx * 46 + 4, py + dy * 46 - 4, "衛星へ", "start", 9.5, SIG, True, halo=True))
    # 角の印: 受信機の所の内角 90° + θ、通る点の所の内角 z'（と、真上の向きと衛星の向きのなす角 z'）
    o.append(_f07_angarc(rx, ry, 17, (cx - rx, cy - ry), (dx, dy), ALI, 1.4))
    o.append(_f07_angarc(px, py, 22, (cx - px, cy - py), (-dx, -dy), ALI, 1.4))
    o.append(_f07_angarc(px, py, 22, (pux, puy), (dx, dy), GLD, 1.4))
    o.append(_f07_angarc(rx, ry, 30, (hx, hy), (dx, dy), SIG, 1.2))
    o.append(_f07_rx(rx, ry - 5, GRN))
    o.append(D(px, py, GLD, 4.5))
    o.append(T(px - 12, py - 8, "電離層を通る点", "end", 9.5, GLD, True, halo=True))
    o.append(TX(rx + 36, ry - 5, "θ", "start", 11, SIG, True, halo=True))
    o.append(TX(rx - 12, ry + 30, "90° + θ", "end", 10, ALI, True, halo=True))
    o.append(TX(px + 9, py - 28, "z'", "start", 11, GLD, True, halo=True))
    o.append(TX(px + 7, py + 36, "z'", "start", 11, ALI, True, halo=True))
    o.append(T(14, 322, "赤の 2 つの角と、向かい合う 2 つの辺に、正弦定理を使う", "start", 9.5, ALI))
    o.append(TX(14, 340, "sin z' = R_E cos θ / (R_E + h_I)、倍率 m_I(θ) = 1 / cos z'", "start", 10.5, GLD, True))
    # (b) 倍率と仰角
    xb = 392
    o.append(TX(xb, 18, "(b) 電離層の倍率 m_I(θ)（天頂の何倍か）", "start", 11.5, INK, True))
    q = Plot(xb + 40, 40, 250, 200, (0, 90), (0, 3.5))
    o.append(q.axes(xl="仰角 θ [°]", yl="倍率", xt=[0, 15, 30, 45, 60, 75, 90], yt=[0, 1, 2, 3]))
    els = _f07_np.linspace(0, 90, 181)
    o.append(q.line([(e, _f07_shell(e)) for e in els], c=GLD, lw=2.2))
    o.append(q.line([(e, 1 + 16 * (0.53 - e / 180) ** 3) for e in els], c=MUT, lw=1.4, dash="5 3"))
    for e in (5, 10, 30, 90):
        o.append(D(q.X(e), q.Y(_f07_shell(e)), GLD, 3.6))
        o.append(T(q.X(e) + (5 if e < 90 else -4), q.Y(_f07_shell(e)) - 7, "%.2f" % _f07_shell(e), "start" if e < 90 else "end", 9.5, GLD, True, halo=True))
    o.append(LEGL(xb + 10, 292, [(GLD, None, "薄い殻の 1/cos z'")], 9.5))
    o.append(LEGL(xb + 10, 308, [(MUT, "5 3", "クロブッチャー・モデルの近似の式（次の項）")], 9.5))
    o.append(T(xb + 10, 334, "仰角 5° で %.2f、10° で %.2f、30° で %.2f、地平線で %.2f" % (_f07_shell(5), _f07_shell(10), _f07_shell(30), _f07_shell(0)), "start", 9.5, GLD, True))
    return SVG(700, 356, o, "薄い殻とみなした電離層のマッピング関数（地球の半径 R<sub>E</sub> = 6 371 km、殻の高さ h<sub>I</sub> = 350 km）。")
F["e07_shell"] = _f07_shell_fig()


# =====================================================================
# 2 節: クロブッチャー・モデルの手順（東京の例）と、1 日の形
# =====================================================================
def _f07_sci(v):
    """1.118 × 10⁻⁸ の形の文字。"""
    e = int(math.floor(math.log10(abs(v))))
    return ("%.3f × 10%s" % (v / 10 ** e, str(e).translate(_F07_SUP))).replace("-", "−")


def _f07_klob_fig():
    o = []
    o.append(T(14, 18, "(a) 計算の手順と、東京の 14 時の例（L1）", "start", 11.5, INK, True))
    tg = (14 - _F07_TOK[1] / 15) * 3600
    dz = _f07_klob(_F07_TOK[0], _F07_TOK[1], 90, 180, tg, detail=True)
    d5 = _f07_klob(_F07_TOK[0], _F07_TOK[1], 5, 180, tg, detail=True)
    x1, x2 = 548, 686
    o.append(T(x1, 40, "真上の衛星", "end", 9.5, MUT, True)); o.append(T(x2, 40, "南・仰角 5° の衛星", "end", 9.5, MUT, True))
    o.append(W(14, 46, 686, 46, c=LIN, lw=0.8))
    def hm(t):
        return "%d:%02d" % (int(t // 3600), int(round(t % 3600 / 60)))
    def pos(d):
        return "北緯 %.1f°・東経 %.1f°" % (d["phi"] * 180, d["lam"] * 180)
    steps = [("① 電離層を通る点（高さ 350 km）を、受信機の位置と衛星の仰角・方位角から求める", [
                 ("地球の中心から見た、受信機と通る点の間の角", "%.1f°" % (dz["psi"] * 180), "%.1f°" % (d5["psi"] * 180)),
                 ("通る点の緯度・経度", pos(dz), pos(d5))]),
             ("② 通る点の地方時 t_I と、地磁気の緯度 B_m（地球の磁場の軸を基準にした緯度）を求める", [
                 ("地方時 t_I（経度から求める）", hm(dz["t"]), hm(d5["t"])),
                 ("B_m（180° を 1 とする半円の単位）", "%.3f" % dz["phm"], "%.3f" % d5["phm"])]),
             ("③ 天頂の遅れ I_z = c{5 ns + A_I cos(2π(t_I − 50 400 s)/P_I)} を計算する（夜は c × 5 ns = %.2f m）" % (5e-9 * _F07_C), [
                 ("振幅 A_I = A_0 + A_1 B_m + A_2 B_m^2 + A_3 B_m^3（c を掛けた値）", "%.2f m" % (dz["AMP"] * _F07_C), "%.2f m" % (d5["AMP"] * _F07_C)),
                 ("周期 P_I = P_0 + P_1 B_m + P_2 B_m^2 + P_3 B_m^3", "%.1f 時間" % (dz["PER"] / 3600), "%.1f 時間" % (d5["PER"] / 3600)),
                 ("通る点の天頂の遅れ I_z", "%.2f m" % (dz["Tv"] * _F07_C), "%.2f m" % (d5["Tv"] * _F07_C))]),
             ("④ 斜めに通る分の倍率（薄い殻の近似の式）を掛ける。L1 以外の周波数 f では、さらに (f_{L1}/f)^2 を掛ける", [
                 ("倍率 1 + 16(0.53 − θ/180°)^3", "%.2f" % dz["F"], "%.2f" % d5["F"]),
                 ("L1 の遅れ I", "%.2f m" % (dz["T"] * _F07_C), "%.2f m" % (d5["T"] * _F07_C))])]
    yy = 64
    for ttl, rows in steps:
        o.append(TX(14, yy, ttl, "start", 10, INK, True))
        yy += 17
        for k, (lab, v1, v2) in enumerate(rows):
            last = ttl.startswith("④") and k == len(rows) - 1
            o.append(TX(30, yy, lab, "start", 9.5, MUT))
            o.append(T(x1, yy, v1, "end", 10, GLD, last)); o.append(T(x2, yy, v2, "end", 10, GLD, last))
            yy += 16
        yy += 7
    o.append(W(14, yy - 12, 686, yy - 12, c=LIN, lw=0.8))
    o.append(TX(14, yy + 4, "A_I が負なら 0、P_I が 72 000 s より短ければ 72 000 s とする。cos は、角の 4 乗の項までのテイラー展開で計算する。", "start", 9.5, MUT))
    o.append(TX(14, yy + 21, "例の 8 つの係数（単位は s と s/半円^n）: A_0〜A_3 = " + "、".join(_f07_sci(v) for v in _F07_KA), "start", 9.5, MUT))
    o.append(TX(14, yy + 38, "P_0〜P_3 = " + "、".join(_f07_sci(v) for v in _F07_KP), "start", 9.5, MUT))
    # (b) 1 日の形
    y0 = yy + 74
    o.append(T(14, y0, "(b) 東京の真上の衛星の遅れの 1 日の変化（L1）", "start", 11.5, INK, True))
    r = Plot(70, y0 + 20, 560, 170, (0, 24), (0, 5))
    o.append(r.axes(xl="電離層を通る点の地方時 [時]", yl="天頂の遅れ [m]", xt=list(range(0, 25, 2)), yt=[0, 1, 2, 3, 4, 5]))
    lts = _f07_np.linspace(0, 24, 481)
    vals = [_f07_klob_lt(lt) for lt in lts]
    o.append(r.line(list(zip(lts, vals)), c=GLD, lw=2.4))
    o.append(W(r.X(0), r.Y(1.499), r.X(24), r.Y(1.499), c=MUT, lw=1, dash="3 3"))
    o.append(T(r.X(0.4), r.Y(1.499) - 6, "夜は一定の 5 ns（%.2f m）" % (5e-9 * _F07_C), "start", 9.5, MUT, True, halo=True))
    pk = _f07_klob_lt(14.0)
    o.append(D(r.X(14), r.Y(pk), GLD, 4.5))
    o.append(T(r.X(14) + 10, r.Y(pk) - 4, "14 時に頂点 %.2f m" % pk, "start", 10, GLD, True, halo=True))
    half = dz["PER"] / 4 / 3600
    o.append(DIM(r.X(14 - half), r.Y(0.45), r.X(14 + half), r.Y(0.45), None, c=GLD))
    o.append(TX(r.X(14), r.Y(0.45) - 6, "cos の半周期（周期 P_I = %.1f 時間の半分）" % (dz["PER"] / 3600), "middle", 9.5, GLD, halo=True))
    o.append(DIM(r.X(20.6), r.Y(1.499), r.X(20.6), r.Y(pk), None, c=GLD))
    o.append(TX(r.X(20.9), r.Y((pk + 1.5) / 2) + 4, "振幅 A_I = %.2f m" % (dz["AMP"] * _F07_C), "start", 9.5, GLD, True, halo=True))
    return SVG(700, y0 + 20 + 170 + 44, o, "クロブッチャー・モデルの手順と、東京の例（8 つの係数は例の値。手順は規格 IS-GPS-200 による）。")
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
    rows = [("対流圏の倍率 m_T(θ)", GRN, lambda e: _f07_mT(e), "%.2f"), ("平らな層の倍率 1/sin θ", MUT, lambda e: 1 / math.sin(e * _F07_D2R), "%.2f"),
            ("対流圏の遅れ（天頂 %.2f m × m_T）" % zt, GRN, lambda e: zt * _f07_mT(e), "%.2f m"),
            ("電離層 14 時（クロブッチャー・モデル）", GLD, lambda e: _f07_klob_lt(14.0, e), "%.2f m"),
            ("電離層 2 時（同じ）", GLD, lambda e: _f07_klob_lt(2.0, e), "%.2f m")]
    for i, (lab, c, fn, ff) in enumerate(rows):
        yy = ty0 + 20 + i * 16
        o.append(TX(70, yy, lab, "start", 9.5, c, True))
        for j, e in enumerate(cols):
            o.append(T(300 + j * 90, yy, ff % fn(e), "end", 10, c))
    o.append(LEGL(70, ty0 + 108, [(GRN, None, "対流圏 m_T(θ) の近似"), (GRN, "4 3", "対流圏 1/sin θ"), (GLD, None, "電離層 14 時"), (GLD, "6 3", "電離層 2 時")], 9.5, 14))
    return SVG(700, 754, o, "対流圏の遅れ（湿潤の部分は例の値 %.1f m とした。(b) の近似の式は Black と Eisner の式。(c) の電離層は、クロブッチャー・モデルの例の係数で計算した、東京から南の空の衛星の遅れ）。" % _F07_ZWD)
F["e07_tropo"] = _f07_tropo_fig()


# =====================================================================
# 3 節: 反射の幾何（地面・壁・見えない衛星）と仰角マスク
# =====================================================================
def _f07_mpgeom_fig():
    o = []
    th = 30 * _F07_D2R
    ux, uy = math.cos(th), -math.sin(th)          # 衛星から来る向きの逆（受信機から衛星へ）: 右上
    # (a) 地面の反射
    o.append(T(14, 18, "(a) 地面で反射", "start", 11.5, INK, True))
    gy, ax, ha = 220, 120, 60
    o.append(W(14, gy, 226, gy, c=MUT, lw=1.6))
    for xx in range(18, 226, 14):
        o.append(W(xx, gy, xx - 6, gy + 7, c=FNT, lw=1))
    o.append(W(ax, gy, ax, gy - ha + 6, c=MUT, lw=2))
    o.append(_f07_rx(ax, gy - ha, GRN))
    A = (ax, gy - ha - 1); Ai = (ax, gy + ha - 1)
    o.append(D(Ai[0], Ai[1], FNT, 3)); o.append(CIRC(Ai[0], Ai[1], 5, c=FNT, lw=1, dash="2 2"))
    o.append(T(Ai[0] - 9, Ai[1] + 4, "地面に映った位置", "end", 9, MUT))
    # 直接波（右上から）
    o.append(ARR(A[0] + 110 * ux, A[1] + 110 * uy, A[0] + 4 * ux, A[1] + 4 * uy, c=SIG, lw=2, head=7))
    # 反射波: 映った位置から右上へ向かう直線が地面と交わる点で反射
    tg = (gy - Ai[1]) / uy
    Gx, Gy = Ai[0] + tg * ux, gy
    o.append(W(Ai[0], Ai[1], Gx, Gy, c=FNT, lw=1, dash="2 3"))
    o.append(W(Gx + 70 * ux, Gy + 70 * uy, Gx, Gy, c=ALI, lw=1.6, dash="6 3"))
    o.append(ARR(Gx, Gy, A[0] + 3, A[1] + 3, c=ALI, lw=1.6, head=6, dash="6 3"))
    # 余分の道のり: A から、映った位置を通る線への垂線の足
    t = (A[0] - Ai[0]) * ux + (A[1] - Ai[1]) * uy
    Fx, Fy = Ai[0] + t * ux, Ai[1] + t * uy
    o.append(W(A[0], A[1], Fx, Fy, c=MUT, lw=1, dash="2 2"))
    o.append(W(Ai[0], Ai[1], Fx, Fy, c=ALI, lw=3))
    o.append(TX(Ai[0] + 30, Ai[1] - 26, "2h_a sin θ", "start", 10, ALI, True, halo=True))
    o.append(DIM(ax - 14, gy, ax - 14, gy - ha, None, c=MUT))
    o.append(TX(ax - 18, gy - ha / 2 + 4, "h_a", "end", 10, MUT, True))
    o.append(T(14, 308, "高さ 1.5 m・仰角 30° で", "start", 9.5, INK))
    o.append(T(14, 323, "%.1f m（%.3f チップ）" % (2 * 1.5 * math.sin(th), 2 * 1.5 * math.sin(th) / _F07_CTC), "start", 9.5, ALI, True))
    # (b) 壁の反射
    xb = 240
    o.append(T(xb, 18, "(b) 壁で反射", "start", 11.5, INK, True))
    o.append(W(xb, gy, xb + 220, gy, c=MUT, lw=1.6))
    wx = xb + 190
    o.append(RECT(wx, 60, 20, gy - 60, 2, MSOFT, MUT, 1.2))
    bx_ = xb + 100
    o.append(_f07_rx(bx_, gy - 6, GRN))
    B = (bx_, gy - 7)
    vx, vy = -math.cos(th), -math.sin(th)        # 受信機から衛星へ（左上）
    o.append(ARR(B[0] + 110 * vx, B[1] + 110 * vy, B[0] + 3 * vx, B[1] + 3 * vy, c=SIG, lw=2, head=7))
    tw_ = (wx - B[0]) / (-vx)                    # 受信機から壁へ水平に進む向きに対し、反射して戻る道
    Wy = B[1] - (wx - B[0]) * math.tan(th)       # 壁に当たる高さ（受信機から仰角 θ で壁へ向かう線）
    o.append(W(wx + 100 * vx, Wy + 100 * vy, wx, Wy, c=ALI, lw=1.6, dash="6 3"))
    o.append(ARR(wx, Wy, B[0] + 3, B[1] - 1, c=ALI, lw=1.6, head=6, dash="6 3"))
    o.append(DIM(B[0], gy + 14, wx, gy + 14, None, c=MUT))
    o.append(TX((B[0] + wx) / 2, gy + 30, "d_w", "middle", 10, MUT, True))
    o.append(TX(xb + 4, 290, "余分の道のり 2d_w cos θ", "start", 10, ALI, True))
    o.append(T(xb + 4, 308, "20 m 先の壁・仰角 30° で", "start", 9.5, INK))
    o.append(T(xb + 4, 323, "%.1f m（%.3f チップ）" % (2 * 20 * math.cos(th), 2 * 20 * math.cos(th) / _F07_CTC), "start", 9.5, ALI, True))
    # (c) 見えない衛星の反射だけ
    xc = 470
    o.append(T(xc, 18, "(c) 直接波が届かない（NLOS）", "start", 11.5, INK, True))
    o.append(W(xc, gy, xc + 225, gy, c=MUT, lw=1.6))
    o.append(RECT(xc + 10, 70, 60, gy - 70, 2, MSOFT, MUT, 1.2))
    o.append(RECT(xc + 180, 50, 40, gy - 50, 2, MSOFT, MUT, 1.2))
    C = (xc + 112, gy - 7)
    o.append(_f07_rx(C[0], gy - 6, GRN))
    dvx, dvy = -math.cos(50 * _F07_D2R), -math.sin(50 * _F07_D2R)   # 受信機から衛星へ（左上）
    # 直接波は左の建物でさえぎられる
    tb = (xc + 70 - C[0]) / dvx
    Hx, Hy = C[0] + tb * dvx, C[1] + tb * dvy
    o.append(W(Hx + 70 * dvx, Hy + 70 * dvy, Hx, Hy, c=SIG, lw=2, dash="2 3"))
    o.append(W(Hx - 6, Hy - 6, Hx + 6, Hy + 6, c=ALI, lw=2.4)); o.append(W(Hx - 6, Hy + 6, Hx + 6, Hy - 6, c=ALI, lw=2.4))
    o.append(T(xc + 8, 62, "直接波はさえぎられる", "start", 9, SIG, True, halo=True))
    # 右の建物の壁で反射して届く
    Rx, Ry = xc + 180, 118
    o.append(W(Rx + 122 * dvx, Ry + 122 * dvy, Rx, Ry, c=ALI, lw=1.6, dash="6 3"))
    o.append(ARR(Rx, Ry, C[0] + 3, C[1] - 3, c=ALI, lw=1.6, head=6, dash="6 3"))
    o.append(T(xc + 4, 290, "反射波だけを受け、その遅れの全部が", "start", 9.5, ALI, True))
    o.append(T(xc + 4, 305, "擬似距離の誤差になる（数十〜数百 m）", "start", 9.5, ALI, True))
    o.append(LEGL(14, 352, [(SIG, None, "直接波"), (ALI, "6 3", "反射波（余分の道のり cτ_M、振幅は直接波の γ 倍、位相の差 ψ_M）")], 9.5, 16))
    return SVG(700, 362, o, "反射波の通り道（h<sub>a</sub> はアンテナの地面からの高さ、d<sub>w</sub> は壁までの距離。(b) の式は、壁が、受信機から見て衛星と反対の側に、衛星の方位に垂直に立つ場合）。")
F["e07_mpgeom"] = _f07_mpgeom_fig()


# =====================================================================
# 3 節: 反射波で相関の三角形がゆがみ、E と L が等しくなる点がずれる
# =====================================================================
_F07_MPG, _F07_MPT, _F07_MPD = 0.5, 0.5, 1.0     # 例: 振幅の比 0.5、遅れ 0.5 チップ（146.5 m）、E と L の間隔 1 チップ


def _f07_mptri_panel(o, x0, y0, sgn, ttl):
    g, tm, d = _F07_MPG, _F07_MPT, _F07_MPD
    o.append(T(x0, y0, ttl, "start", 11, INK, True))
    p = Plot(x0 + 34, y0 + 18, 286, 190, (-1.5, 2.0), (-0.6, 1.6))
    o.append(p.axes(xl="局部の符号のずれ Δτ [チップ]", yl=None, xt=[-1, -0.5, 0, 0.5, 1, 1.5, 2], yt=[-0.5, 0, 0.5, 1, 1.5], xfmt=_f07_fmt, yfmt=_f07_fmt))
    us = _f07_np.linspace(-1.5, 2.0, 351)
    o.append(p.line([(u, _f07_lam(u)) for u in us], c=GRN, lw=1.6, dash="5 3"))
    o.append(p.line([(u, sgn * g * _f07_lam(u - tm)) for u in us], c=ALI, lw=1.6, dash="5 3"))
    o.append(p.line([(u, _f07_lam(u) + sgn * g * _f07_lam(u - tm)) for u in us], c=SIG, lw=2.4))
    x = _f07_mpenv(g, tm, d, sgn)
    ev = _f07_lam(x - d / 2) + sgn * g * _f07_lam(x - d / 2 - tm)
    for u, lab in ((x - d / 2, "E"), (x, "P"), (x + d / 2, "L")):
        v = _f07_lam(u) + sgn * g * _f07_lam(u - tm)
        o.append(W(p.X(u), p.Y(v), p.X(u), p.Y(-0.6), c=GLD, lw=1, dash="2 2"))
        o.append(D(p.X(u), p.Y(v), GLD, 4.6))
        o.append(T(p.X(u), p.Y(v) - 8, lab, "middle", 10, GLD, True, halo=True))
    o.append(W(p.X(x - d / 2), p.Y(ev), p.X(x + d / 2), p.Y(ev), c=GLD, lw=1, dash="4 3"))
    o.append(W(p.X(0), p.Y(1.0), p.X(0), p.Y(-0.6), c=GRN, lw=1, dash="2 2"))
    yy = p.Y(-0.36)
    o.append(ARR(p.X(0), yy, p.X(x), yy, c=ALI, lw=2, head=6))
    lab = ("%+.3f チップ（%+.1f m）" % (x, x * _F07_CTC)).replace("-", "−")
    o.append(T(p.X(0) + (6 if sgn > 0 else -6), yy - 7, lab, "start" if sgn > 0 else "end", 9.5, ALI, True, halo=True))
    return x


def _f07_mptri_fig():
    o = []
    xa = _f07_mptri_panel(o, 14, 18, +1, "(a) 同じ位相の反射波（足し合う）")
    xb_ = _f07_mptri_panel(o, 362, 18, -1, "(b) 逆の位相の反射波（打ち消し合う）")
    o.append(LEGL(48, 272, [(GRN, "5 3", "直接波の三角形 Λ(Δτ)"), (ALI, "5 3", "反射波 ±γΛ(Δτ − τ_M)"), (SIG, None, "受けた信号の相関（和）")], 9.5, 14))
    o.append(TX(48, 290, "縦軸: 相関（直接波の山を 1 とした値）。金の点: E・P・L（E と L の高さが等しくなる所。DLL が落ち着く所）", "start", 9.5, MUT))
    # (c) 判別器の S 字
    o.append(T(14, 324, "(c) 判別器の S 字（E と L の電力の差。5 章 3 節）が 0 を横切る点がずれる", "start", 11, INK, True))
    q = Plot(70, 344, 560, 190, (-1.0, 1.5), (-0.9, 0.9))   # 縦は 5 章 3 節と同じ正規化（ずれが小さい間はずれ [チップ] に等しい）
    o.append(q.axes(xl="局部の符号のずれ Δτ [チップ]", yl="判別器の出力", xt=[-1, -0.5, 0, 0.5, 1, 1.5], yt=[-0.8, -0.4, 0, 0.4, 0.8], xfmt=_f07_fmt, yfmt=_f07_fmt))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    g, tm, d = _F07_MPG, _F07_MPT, _F07_MPD
    us = _f07_np.linspace(-1.0, 1.5, 501)
    def sc(u, sg, gg):
        return _f07_mpdisc(u, gg, tm, 0.0 if sg > 0 else math.pi, d) / (2 * (2 - d))
    o.append(q.line([(u, sc(u, 1, 0.0)) for u in us], c=GRN, lw=1.6, dash="5 3"))
    o.append(q.line([(u, sc(u, 1, g)) for u in us], c=SIG, lw=2.2))
    o.append(q.line([(u, sc(u, -1, g)) for u in us], c=SIG, lw=2.2, dash="7 3"))
    for x, lab, dy in ((0.0, "反射波なし: 0", -10), (xa, "同じ位相: %+.3f" % xa, 22), (xb_, "逆の位相: %+.3f" % xb_, 38)):
        o.append(D(q.X(x), q.Y(0), GLD if x else GRN, 4.6))
        o.append(T(q.X(x), q.Y(0) + dy, lab.replace("-", "−"), "middle", 9.5, GLD if x else GRN, True, halo=True))
    o.append(LEGL(70, 590, [(GRN, "5 3", "反射波なし"), (SIG, None, "同じ位相の反射波"), (SIG, "7 3", "逆の位相の反射波")], 9.5, 14))
    return SVG(700, 600, o, "反射波による相関のゆがみ（例: 振幅の比 γ = %g、遅れ τ<sub>M</sub> = %g チップ（%.1f m）、E と L の間隔 %g チップ。γ は例の値）。" % (_F07_MPG, _F07_MPT, _F07_MPT * _F07_CTC, _F07_MPD))
F["e07_mptri"] = _f07_mptri_fig()


# =====================================================================
# 3 節: 導出の場合分け — 反射波の山が、E と L に対してどこにあるか
# =====================================================================
def _f07_mpcase_fig():
    o = []
    g, d = 0.5, 0.5
    cases = [("(a) 反射波の山が、E と L の間", 0.2, "山が L より早い: τ_M < (1 + γ)Δ_{EL}T_c/2", "Δτ* = γτ_M/(1 + γ)"),
             ("(b) E も L も、反射波の左の辺", 0.6, "山が L より遅く、E は反射波の三角形の中", "Δτ* = γΔ_{EL}T_c/2"),
             ("(c) L だけが、反射波の左の辺", 1.1, "E が三角形の外。τ_M ≤ (1 + Δ_{EL}/2)T_c まで", "Δτ* = γ{(1 + Δ_{EL}/2)T_c − τ_M}/(2 − γ)")]
    us = _f07_np.linspace(-1.2, 2.3, 351)
    for k, (ttl, tm, cond, frm) in enumerate(cases):
        x0 = 14 + k * 230
        o.append(T(x0, 18, ttl, "start", 11, INK, True))
        p = Plot(x0 + 22, 46, 196, 130, (-1.2, 2.3), (0, 1.15))
        o.append(p.axes(xl="局部の符号のずれ Δτ [チップ]", yl=None, xt=[-1, 0, 1, 2], yt=[0, 0.5, 1], xfmt=_f07_fmt, yfmt=_f07_fmt))
        x = _f07_mpenv(g, tm, d, 1)
        o.append(p.line([(u, _f07_lam(u)) for u in us], c=GRN, lw=1.6, dash="5 3"))
        o.append(p.line([(u, g * _f07_lam(u - tm)) for u in us], c=ALI, lw=2.2))
        o.append(W(p.X(tm), p.Y(g), p.X(tm), p.Y(0), c=ALI, lw=1, dash="2 2"))
        o.append(TX(p.X(tm), p.Y(g) - 6, "τ_M", "middle", 9.5, ALI, True, halo=True))
        for u, lab in ((x - d / 2, "E"), (x + d / 2, "L")):
            o.append(W(p.X(u), p.Y(1.08), p.X(u), p.Y(0), c=GLD, lw=1.2, dash="3 2"))
            o.append(T(p.X(u), p.Y(1.08) - 3, lab, "middle", 10, GLD, True, halo=True))
            o.append(D(p.X(u), p.Y(_f07_lam(u)), GRN, 3.4))
            o.append(D(p.X(u), p.Y(g * _f07_lam(u - tm)), ALI, 3.8))
        o.append(TX(x0, 228, cond, "start", 9.5, MUT))
        o.append(TX(x0, 246, frm, "start", 10, ALI, True))
        o.append(TX(x0, 264, "例: τ_M = %g チップのとき" % tm, "start", 9.5, INK))
        o.append(TX(x0, 280, "Δτ* = %.3f チップ（%.1f m）" % (x, x * _F07_CTC), "start", 9.5, INK, True))
    o.append(LEGL(14, 308, [(GRN, "5 3", "直接波の三角形"), (ALI, None, "反射波の三角形（同じ位相）"), (GLD, "3 2", "E と L の位置")], 9.5, 16))
    return SVG(700, 318, o, "導出の 3 つの場合（例: 振幅の比 γ = %g、E と L の間隔 Δ<sub>EL</sub> = %g チップ、同じ位相の反射波）。" % (g, d))
F["e07_mpcase"] = _f07_mpcase_fig()


# =====================================================================
# 3 節: マルチパスの誤差の包絡線と、位相が回るときの揺れ
# =====================================================================
def _f07_mpenv_fig():
    o = []
    g = 0.5
    o.append(T(14, 18, "(a) 誤差の包絡線（γ = 0.5。上の線: 同じ位相、下の線: 逆の位相）", "start", 11.5, INK, True))
    p = Plot(74, 52, 560, 230, (0, 1.6), (-80, 80))
    o.append(p.axes(xl="反射波の遅れ τ_M [チップ]", yl="擬似距離の誤差 [m]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6], yt=[-80, -40, 0, 40, 80], xfmt=_f07_fmt))
    for v in (0, 100, 200, 300, 400):
        o.append(W(p.X(v / _F07_CTC), p.y, p.X(v / _F07_CTC), p.y - 4, c=MUT, lw=1))
        o.append(T(p.X(v / _F07_CTC), p.y - 7, "%d m" % v, "middle", 9, MUT))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    tms = _f07_np.linspace(0, 1.6, 641)
    for d, c, lab in ((1.0, GLD, "E と L の間隔 1 チップ"), (0.1, SIG, "0.1 チップ")):
        up = [(t, _f07_mpenv(g, t, d, 1) * _F07_CTC) for t in tms]
        dn = [(t, _f07_mpenv(g, t, d, -1) * _F07_CTC) for t in tms]
        o.append(PL([(p.X(a), p.Y(b)) for a, b in up] + [(p.X(a), p.Y(b)) for a, b in dn[::-1]], c="none", lw=0, fill=soft(c)))
        o.append(p.line(up, c=c, lw=2.2)); o.append(p.line(dn, c=c, lw=2.2))
    o.append(p.clip([(0, 0), (80 / _F07_CTC, 80)], c=ALI, lw=1.4, dash="5 3"))
    o.append(T(p.X(0.28), p.Y(72), "NLOS（直接波なし）:", "start", 9, ALI, True, halo=True))
    o.append(T(p.X(0.28), p.Y(72) + 13, "誤差 = 遅れの全部", "start", 9, ALI, True, halo=True))
    o.append(T(p.X(0.82), p.Y(73.3) - 4, "最大 γ × 間隔 / 2 = 0.25 チップ（73.3 m）", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.62), p.Y(7.3) - 8, "最大 0.025 チップ（7.3 m）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(74, 353, "線が 0 に戻る所: 余分の道のりが、間隔 1 チップで %.0f m、0.1 チップで %.0f m。これより長い反射波は、誤差を生まない" % (1.5 * _F07_CTC, 1.05 * _F07_CTC), "start", 9.5, MUT))
    o.append(T(p.X(1.59), p.Y(-48), "遅れの短い所では、2 つの間隔の線が重なる", "end", 9.5, INK, halo=True))
    o.append(T(p.X(1.59), p.Y(-48) + 14, "（0.1 チップでは、余分の道のりが、同じ位相で", "end", 9.5, MUT, halo=True))
    o.append(T(p.X(1.59), p.Y(-48) + 28, "%.0f m、逆の位相で %.1f m まで）" % ((1 + g) * 0.1 / 2 * _F07_CTC, (1 - g) * 0.1 / 2 * _F07_CTC), "end", 9.5, MUT, halo=True))
    o.append(LEGL(74, 334, [(GLD, None, "E と L の間隔 1 チップ"), (SIG, None, "0.1 チップ"), (ALI, "5 3", "NLOS")], 9.5, 16))
    # (b) 位相が回るときの誤差
    o.append(TX(14, 380, "(b) 反射波の位相 ψ_M が回るときの誤差（余分の道のり cτ_M = 100 m、γ = 0.5）", "start", 11.5, INK, True))
    q = Plot(74, 400, 560, 170, (0, 360), (-80, 80))
    o.append(q.axes(xl="反射波の位相 ψ_M [°]", yl="擬似距離の誤差 [m]", xt=[0, 60, 120, 180, 240, 300, 360], yt=[-80, -40, 0, 40, 80]))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    tm = 100 / _F07_CTC
    ps = _f07_np.linspace(0, 360, 73)
    stats = []
    for d, c in ((1.0, GLD), (0.1, SIG)):
        vals = [_f07_mptrack(g, tm, ph * _F07_D2R, d) * _F07_CTC for ph in ps]
        o.append(q.line(list(zip(ps, vals)), c=c, lw=2.2))
        vu = vals[:-1]   # 0° と 360° は同じ位相なので、統計では 1 回だけ数える
        stats.append((d, c, float(_f07_np.mean(vu)), float(_f07_np.sqrt(_f07_np.mean(_f07_np.square(vu)))), min(vals), max(vals)))
    for k, (d, c, mn, rms, lo, hi) in enumerate(stats):
        o.append(T(q.x, q.y + q.h + 52 + k * 16, ("E と L の間隔 %g チップ: %.1f〜%.1f m、RMS %.1f m、平均 %.1f m" % (d, lo, hi, rms, mn)).replace("-", "−"), "start", 9.5, c, True))
    return SVG(700, 648, o, "マルチパスの誤差の包絡線と、位相が回るときの誤差（振幅の比 γ = 0.5 の例。(b) は 5 章 3 節の電力の差の判別器が 0 を横切る点を、数値で探した値）。")
F["e07_mpenv"] = _f07_mpenv_fig()


# =====================================================================
# 3 節: マルチパスを減らす 4 つの方法（アンテナ・相関器・置き場所・仰角マスク）
# =====================================================================
def _f07_mpreduce_fig():
    o = []
    gy = 196
    # (a) アンテナ
    x0 = 14
    o.append(T(x0, 18, "(a) アンテナ", "start", 11.5, INK, True))
    o.append(W(x0, gy, x0 + 212, gy, c=MUT, lw=1.6))
    ax, ay = x0 + 96, 132
    o.append(W(ax, gy, ax, ay + 6, c=MUT, lw=2))
    pat = []
    for k in range(0, 73):
        a = 2 * math.pi * k / 72
        r = 6 + 44 * ((1 + math.cos(a)) / 2) ** 0.8
        pat.append((ax + r * math.sin(a), ay - r * math.cos(a)))
    o.append(PL(pat, c=GRN, lw=1.4, fill=soft(GRN), op=0.6))
    o.append(_f07_rx(ax, ay, GRN))
    o.append(T(ax, ay - 56, "受ける強さ", "middle", 9.5, GRN, True, halo=True))
    a30 = 35 * _F07_D2R
    o.append(ARR(ax - 96 * math.cos(a30), ay - 96 * math.sin(a30), ax - 8 * math.cos(a30), ay - 8 * math.sin(a30), c=SIG, lw=2, head=7))
    o.append(T(x0, 44, "直接波（右旋）: 強く受ける", "start", 9.5, SIG, True, halo=True))
    gx = ax + (gy - ay) / math.tan(a30)
    o.append(W(gx + 60 * math.cos(a30), gy - 60 * math.sin(a30), gx, gy, c=ALI, lw=1.6, dash="6 3"))
    o.append(ARR(gx, gy, ax + 7 * math.cos(a30), ay + 7 * math.sin(a30), c=ALI, lw=1.6, head=6, dash="6 3"))
    o.append(T(x0 + 212, gy + 16, "反射波（左旋が多い）: 弱く受ける", "end", 9.5, ALI, True))
    # (b) 相関器
    x1 = 244
    o.append(T(x1, 18, "(b) 相関器", "start", 11.5, INK, True))
    p = Plot(x1 + 20, 40, 190, 120, (-1.2, 1.2), (0, 1.15))
    o.append(p.axes(xl="局部の符号のずれ Δτ [チップ]", yl=None, xt=[-1, 0, 1], yt=[], xfmt=_f07_fmt))
    o.append(p.line([(u, _f07_lam(u)) for u in (-1.2, -1, 0, 1, 1.2)], c=GRN, lw=1.8))
    for d, c in ((1.0, GLD), (0.1, SIG)):
        for sg, lab in ((-1, "E"), (1, "L")):
            u = sg * d / 2
            o.append(W(p.X(u), p.Y(_f07_lam(u)), p.X(u), p.Y(0), c=c, lw=1.2, dash="3 2"))
            o.append(D(p.X(u), p.Y(_f07_lam(u)), c, 3.8))
            if d == 1.0:
                o.append(T(p.X(u) + sg * 9, p.Y(_f07_lam(u)) + 2, lab, "middle", 10, c, True, halo=True))
    gg = 0.5
    o.append(T(x1, gy + 16, "E と L の間隔を狭くする", "start", 9.5, INK, True))
    o.append(T(x1, gy + 32, "1 チップ: 誤差の最大 %.1f m" % (gg * 1.0 / 2 * _F07_CTC), "start", 9.5, GLD, True))
    o.append(T(x1, gy + 48, "0.1 チップ: %.1f m（γ = %g）" % (gg * 0.1 / 2 * _F07_CTC, gg), "start", 9.5, SIG, True))
    # (c) 置き場所
    x2 = 474
    o.append(T(x2, 18, "(c) 置き場所", "start", 11.5, INK, True))
    o.append(W(x2, gy, x2 + 212, gy, c=MUT, lw=1.6))
    o.append(RECT(x2 + 6, 60, 38, gy - 60, 2, MSOFT, MUT, 1.2))
    bx, gx2 = x2 + 62, x2 + 168
    o.append(_f07_rx(bx, gy - 6, ALI))
    o.append(_f07_rx(gx2, gy - 6, GRN))
    wy = 128
    o.append(W(bx + 60, wy - 60 * math.tan(a30), x2 + 44, wy + 16 * math.tan(a30), c=ALI, lw=1.4, dash="6 3"))
    o.append(ARR(x2 + 44, wy + 16 * math.tan(a30), bx - 2, gy - 9, c=ALI, lw=1.4, head=6, dash="6 3"))
    o.append(T(bx, gy + 16, "壁の近く", "middle", 9.5, ALI, True))
    o.append(T(gx2, gy + 16, "離して、空の広い所", "middle", 9.5, GRN, True))
    for sg in (-1, 1):
        o.append(W(gx2, gy - 8, gx2 + sg * 40, gy - 8 - 40 * math.tan(60 * _F07_D2R) * 0.9, c=GRN, lw=1, dash="2 3"))
    o.append(T(x2, gy + 48, "壁・金属の板・車の屋根の突起から離す（22 章）", "start", 9.5, MUT))
    # (d) 仰角マスク（横から見た図とスカイプロット）
    y0 = 282
    o.append(T(14, y0, "(d) 仰角マスク（決めた仰角より低い衛星を使わない）", "start", 11.5, INK, True))
    gy2 = y0 + 172
    o.append(W(14, gy2, 380, gy2, c=MUT, lw=1.6))
    ox = 200
    o.append(_f07_rx(ox, gy2 - 6, GRN))
    for side in (-1, 1):
        o.append(W(ox, gy2 - 7, ox + side * 168, gy2 - 7 - 168 * math.tan(15 * _F07_D2R), c=ALI, lw=1.4, dash="5 3"))
    o.append(T(34, gy2 - 68, "マスク 15°", "start", 9.5, ALI, True, halo=True))
    for el, az_s in ((75, 1), (40, -1), (22, 1), (10, -1), (4, 1)):
        rr = 140
        sx_, sy_ = ox + az_s * rr * math.cos(el * _F07_D2R), gy2 - 7 - rr * math.sin(el * _F07_D2R)
        c = PUR if el > 15 else FNT
        o.append(W(ox, gy2 - 7, sx_, sy_, c=c, lw=1, dash=None if el > 15 else "2 3"))
        o.append(_f07_sat(sx_, sy_, c, 0.8))
        o.append(T(sx_, sy_ - 10, "%d° %s" % (el, "使う" if el > 15 else "使わない"), "middle", 9, c if el > 15 else MUT, True, halo=True))
    cx, cy, R = 560, y0 + 100, 84
    sats = [(q[1], q[2], q[0], PUR if q[1] > 15 else FNT) for q in _F07_VL]
    o.append(sky(cx, cy, R, sats, dot=4.2))
    o.append(CIRC(cx, cy, R * (90 - 15) / 90, c=ALI, lw=1.4, dash="5 3"))
    low = [q for q in _F07_VL if q[1] <= 15]
    o.append(T(14, gy2 + 22, "東京の空（時刻 0）では、マスク 15° で " + " と ".join("%s（仰角 %.1f°）" % (q[0], q[1]) for q in low) + " を使わない", "start", 9.5, INK))
    return SVG(700, gy2 + 36, o, "マルチパスを減らす 4 つの方法（(a) の受ける強さの形と、(b) の振幅の比 γ は例。(d) の右は東京の時刻 0 のスカイプロット）。")
F["e07_mpreduce"] = _f07_mpreduce_fig()


# =====================================================================
# 4 節: 3 つの並びのスカイプロットと、誤差の楕円（σ = 1 m）
# =====================================================================
def _f07_lsA(names):
    G = _f07_G([(_F07_V[n][1], _F07_V[n][2]) for n in names])
    return _f07_np.linalg.solve(G.T @ G, G.T)


def _f07_dopcalc_fig():
    o = []
    ns = _F07_ALL
    G = _f07_G([(_F07_V[n][1], _F07_V[n][2]) for n in ns])
    H = _f07_H(ns); dd = _f07_dops(H)
    o.append(TX(14, 18, "(a) 幾何行列 G（i 行目は、視線の単位ベクトルの東・北・上の成分の符号を変えた値と、1）", "start", 11, INK, True))
    xs = [14, 80, 126, 186, 232, 278, 312]
    for x, h in zip(xs, ["衛星", "仰角", "方位角", "東", "北", "上", "時計"]):
        o.append(T(x, 42, h, "start" if x == 14 else "end", 9.5, MUT, True))
    o.append(W(14, 47, 318, 47, c=LIN, lw=0.8))
    for i, n in enumerate(ns):
        yy = 64 + i * 17
        o.append(T(xs[0], yy, n, "start", 10, PUR, True))
        o.append(T(xs[1], yy, "%.1f°" % _F07_V[n][1], "end", 9.5, MUT)); o.append(T(xs[2], yy, "%.1f°" % _F07_V[n][2], "end", 9.5, MUT))
        for j in range(4):
            o.append(T(xs[3 + j], yy, _f07_m(G[i, j], 2) if j < 3 else "1", "end", 10, INK))
    yb0, yb1 = 52, 64 + 7 * 17 + 6
    for xx, sg in ((144, 1), (318, -1)):
        o.append(W(xx + sg * 5, yb0, xx, yb0, xx, yb1, xx + sg * 5, yb1, c=INK, lw=1.2))
    # (b) (GᵀG)⁻¹
    xb = 356
    o.append(TX(xb, 42, "(b) (G^{T}G)^{−1}（対角成分が D_e・D_n・D_u・D_b）", "start", 11, INK, True))
    cs = [xb + 96, xb + 150, xb + 204, xb + 258]
    nm = ["東", "北", "上", "時計"]; dn = ["D_e", "D_n", "D_u", "D_b"]
    for x, h in zip(cs, nm):
        o.append(T(x, 64, h, "end", 9.5, MUT, True))
    for i in range(4):
        yy = 84 + i * 20
        o.append(T(xb + 40, yy, nm[i], "end", 9.5, MUT, True))
        for j in range(4):
            if i == j:
                o.append(RECT(cs[j] - 42, yy - 13, 46, 18, 3, soft(ALI), ALI, 1))
            o.append(T(cs[j], yy, _f07_m(H[i, j], 3), "end", 10, ALI if i == j else INK, i == j))
        o.append(TX(cs[3] + 14, yy, dn[i], "start", 10, ALI, True))
    for xx, sg in ((xb + 50, 1), (cs[3] + 6, -1)):
        o.append(W(xx + sg * 5, 70, xx, 70, xx, 150, xx + sg * 5, 150, c=INK, lw=1.2))
    o.append(ARR(326, 110, 350, 110, c=MUT, lw=1.6, head=7))
    # (c) DOP
    o.append(T(xb, 180, "(c) 対角成分から DOP を計算する", "start", 11, INK, True))
    D_ = [H[i, i] for i in range(4)]
    rows = [("HDOP = √(D_e + D_n) = √(%.3f + %.3f)" % (D_[0], D_[1]), dd["H"]), ("VDOP = √D_u = √%.3f" % D_[2], dd["V"]), ("TDOP = √D_b = √%.3f" % D_[3], dd["T"]),
            ("PDOP = √(D_e + D_n + D_u)", dd["P"]), ("GDOP = √(D_e + D_n + D_u + D_b)", dd["G"])]
    for i, (lab, v) in enumerate(rows):
        yy = 200 + i * 17
        o.append(TX(xb + 8, yy, lab, "start", 10, INK))
        o.append(T(xb + 318, yy, "= %.2f" % v, "end", 10.5, ALI, True))
    o.append(TX(14, 222, "擬似距離の誤差が σ = 1 m なら", "start", 9.5, MUT))
    o.append(TX(14, 239, "水平の誤差の 2 乗の平均の平方根は %.2f m、上下の誤差の標準偏差は %.2f m" % (dd["H"], dd["V"]), "start", 9.5, INK))
    o.append(TX(14, 256, "時計のずれ b の誤差の標準偏差は %.2f m（時間で %.1f ns）" % (dd["T"], dd["T"] / _F07_C * 1e9), "start", 9.5, INK))
    return SVG(700, 290, o, "DOP の計算の例（東京、時刻 0 に見えている GPS の 8 つの衛星。6 章 3 節と同じ並び）。")
F["e07_dopcalc"] = _f07_dopcalc_fig()


def _f07_dopsky_fig():
    o = []
    cases = [("(a) 1 章の 4 つ", _F07_N4, 4.0), ("(b) 見えている 8 つ", _F07_ALL, 2.0), ("(c) 偏った 4 つ", _F07_CL4, 25.0)]
    for k, (ttl, ns, lim) in enumerate(cases):
        x0 = 14 + k * 232
        o.append(T(x0, 18, ttl, "start", 11, INK, True))
        cx, cy, R = x0 + 104, 102, 62
        sats = [(q[1], q[2], q[0] if q[0] in ns else None, PUR if q[0] in ns else FNT) for q in _F07_VL]
        o.append(sky(cx, cy, R, sats, dot=3.6, sz=9))
        H = _f07_H(ns); dd = _f07_dops(H)
        s1, s2, ang = _f07_ell(H[:2, :2])
        # 散らばり（σ = 1 m の誤差を入れて 300 回解いた位置の誤差）
        A = _f07_lsA(ns)
        rng = _f07_np.random.default_rng(70 + k)
        X = (rng.standard_normal((300, len(ns))) @ A.T)
        p = Plot(x0 + 36, 196, 160, 160, (-lim, lim), (-lim, lim))
        o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 1))
        o.append(p.axes(xl=None, yl=None, xt=[-lim, 0, lim], yt=[-lim, 0, lim], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
        for e_, n_ in X[:, :2]:
            if abs(e_) < lim and abs(n_) < lim:
                o.append(D(p.X(e_), p.Y(n_), GLD, 1.2))
        o.append(p.line(_f07_ellpts(s1, s2, ang), c=ALI, lw=2))
        o.append(W(p.X(0) - 5, p.Y(0), p.X(0) + 5, p.Y(0), c=INK, lw=1.6)); o.append(W(p.X(0), p.Y(0) - 5, p.X(0), p.Y(0) + 5, c=INK, lw=1.6))
        o.append(T(p.x + p.w / 2, p.y + p.h + 28, "東西（横）・南北（縦）[m]", "middle", 9, MUT))
        o.append(T(x0 + 116, 404, "楕円 %.2f m × %.2f m" % (s1, s2), "middle", 10, ALI, True))
        o.append(T(x0 + 116, 422, "HDOP %.2f　VDOP %.2f" % (dd["H"], dd["V"]), "middle", 10.5, INK, True))
        o.append(T(x0 + 116, 438, "PDOP %.2f　TDOP %.2f　GDOP %.2f" % (dd["P"], dd["T"], dd["G"]), "middle", 9.5, MUT))
        o.append(T(x0 + 116, 455, "上下と時計の誤差の相関係数 %.3f" % (H[2, 3] / math.sqrt(H[2, 2] * H[3, 3])), "middle", 9.5, MUT))
    return SVG(700, 466, o, "衛星の並びと DOP・誤差の楕円（東京、時刻 0。擬似距離の誤差は標準偏差 σ = 1 m。金の点は、誤差を入れて 300 回解いた位置。目盛は 3 枚で違う）。")
F["e07_dopsky"] = _f07_dopsky_fig()


# =====================================================================
# 4 節: 上下の誤差が大きい理由 — 上下の列と時計の列が似ている
# =====================================================================
def _f07_vdop_fig():
    o = []
    o.append(T(14, 18, "(a) 受信機を 1 m 動かしたときの、8 つの衛星の擬似距離の変化（G の列）と、時計で打ち消せない残り", "start", 11, INK, True))
    G = _f07_G([(_F07_V[n][1], _F07_V[n][2]) for n in _F07_ALL])
    cols = [("東へ 1 m", 0), ("北へ 1 m", 1), ("上へ 1 m", 2)]
    for k, (ttl, j) in enumerate(cols):
        x0 = 30 + k * 226
        col = G[:, j]; mu = float(col.mean()); ss = float(((col - mu) ** 2).sum())
        p = Plot(x0 + 24, 44, 180, 150, (0, 8), (-1.05, 1.05))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        o.append(W(p.x, p.y, p.x, p.y + p.h, c=MUT, lw=1))
        for v in (-1, 0, 1):
            o.append(T(p.x - 5, p.Y(v) + 3.5, _f07_fmt(v), "end", 9, MUT))
        for i, v in enumerate(col):
            x1, x2 = p.X(i + 0.18), p.X(i + 0.82)
            o.append(RECT(x1, min(p.Y(v), p.Y(0)), x2 - x1, abs(p.Y(v) - p.Y(0)), 1.5, soft(PUR), PUR, 1))
        o.append(W(p.x, p.Y(mu), p.x + p.w, p.Y(mu), c=GLD, lw=2, dash="5 3"))
        for i, v in enumerate(col):
            o.append(W(p.X(i + 0.5), p.Y(v), p.X(i + 0.5), p.Y(mu), c=ALI, lw=1.6))
        o.append(T(p.x + p.w / 2, p.y - 4, ttl, "middle", 10.5, INK, True))
        o.append(T(p.x + p.w / 2, p.y + p.h + 16, "時計で打ち消せる分（平均）%s" % _f07_m(mu, 2), "middle", 9.5, GLD, True))
        o.append(T(p.x + p.w / 2, p.y + p.h + 32, "残りの 2 乗の和 %.2f" % ss, "middle", 9.5, ALI, True))
        o.append(T(p.x + p.w / 2, p.y + p.h + 48, "1/√（2 乗の和）= %.2f" % (1 / math.sqrt(ss)), "middle", 9.5, INK, True))
    o.append(T(14, 268, "棒: 衛星ごとの変化 [m]。金の線: 平均（時計のずれを動かせば、どの衛星にも同じだけ足せる）。赤: 打ち消せない残り", "start", 9.5, MUT))
    # (b) 上下と時計の誤差の楕円
    o.append(T(14, 300, "(b) 上下と時計の誤差（8 つ、σ = 1 m）", "start", 11, INK, True))
    H = _f07_H(_F07_ALL)
    A = _f07_lsA(_F07_ALL)
    rng = _f07_np.random.default_rng(77)
    X = rng.standard_normal((300, len(_F07_ALL))) @ A.T
    q = Plot(70, 320, 190, 190, (-4, 4), (-4, 4))
    o.append(RECT(q.x, q.y, q.w, q.h, 2, SCR, LIN, 1))
    o.append(q.axes(xl="上下の誤差 [m]", yl="時計の誤差 b [m]", xt=[-4, -2, 0, 2, 4], yt=[-4, -2, 0, 2, 4], xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    for u_, b_ in X[:, 2:4]:
        if abs(u_) < 4 and abs(b_) < 4:
            o.append(D(q.X(u_), q.Y(b_), GLD, 1.2))
    s1, s2, ang = _f07_ell(H[2:4, 2:4])
    o.append(q.line(_f07_ellpts(s1, s2, ang), c=ALI, lw=2))
    cr = H[2, 3] / math.sqrt(H[2, 2] * H[3, 3])
    o.append(T(q.x + q.w + 12, q.y + 40, "相関係数 %.2f" % cr, "start", 10, ALI, True))
    o.append(T(q.x + q.w + 12, q.y + 58, "上に誤るときは、時計も", "start", 9.5, INK))
    o.append(T(q.x + q.w + 12, q.y + 72, "同じ向きに誤る", "start", 9.5, INK))
    # (c) 残りからの見積もりと、全部の未知数で解いた倍率
    xc = 420
    o.append(T(xc, 300, "(c) 残りからの見積もりと、4 つの未知数で解いた倍率", "start", 11, INK, True))
    o.append(T(xc + 150, 326, "1/√（残りの 2 乗の和）", "end", 9.5, MUT, True)); o.append(TX(xc + 266, 326, "√D（4 つで解く）", "end", 9.5, MUT, True))
    o.append(W(xc, 331, xc + 268, 331, c=LIN, lw=0.8))
    for j, lab in enumerate(["東", "北", "上"]):
        col = G[:, j]; ss = float(((col - col.mean()) ** 2).sum())
        yy = 350 + j * 20
        o.append(T(xc + 6, yy, lab, "start", 10, INK, True))
        o.append(T(xc + 150, yy, "%.2f" % (1 / math.sqrt(ss)), "end", 10, INK))
        o.append(T(xc + 266, yy, "%.2f" % math.sqrt(H[j, j]), "end", 10, ALI if j == 2 else INK, True))
    o.append(T(xc, 430, "上の残りが最も小さく、上下の倍率（VDOP）が最も大きい", "start", 9.5, ALI, True))
    return SVG(700, 552, o, "上下の誤差が水平より大きい理由（東京、時刻 0 の 8 つの衛星。(a) の棒は仰角の高い順。(b) の点は、σ = 1 m の誤差を入れて 300 回解いた値）。")
F["e07_vdop"] = _f07_vdop_fig()


# =====================================================================
# 4 節: 解けない並び — 4 つの衛星が、受信機を頂点とする 1 つの円錐の上に並ぶ
# =====================================================================
def _f07_cone_fig():
    o = []
    o.append(T(14, 18, "(a) 1 つの円錐の上に並んだ 4 つの衛星", "start", 11.5, INK, True))
    rx, ry, cyy, ea, eb = 170, 236, 78, 118, 24
    o.append(W(20, ry + 6, 330, ry + 6, c=MUT, lw=1.4))
    o.append(PATH("M%g,%g a%g,%g 0 1,0 %g,0 a%g,%g 0 1,0 %g,0" % (rx - ea, cyy, ea, eb, 2 * ea, ea, eb, -2 * ea), c=FNT, lw=1.2, dash="4 3"))
    o.append(W(rx, ry, rx, cyy - 44, c=MUT, lw=1.2, dash="5 3"))
    o.append(T(rx + 6, cyy - 38, "円錐の軸", "start", 9.5, MUT, halo=True))
    pts = []
    for a in (25, 115, 205, 295):
        pts.append((rx + ea * math.cos(a * _F07_D2R), cyy + eb * math.sin(a * _F07_D2R)))
    for k, (sx, sy) in enumerate(pts):
        o.append(W(rx, ry, sx, sy, c=PUR, lw=1.1))
        o.append(_f07_sat(sx, sy, PUR, 0.8))
    sx, sy = rx + ea, cyy                              # 角 κ を示す母線（円錐の右の縁）
    o.append(W(rx, ry, sx, sy, c=FNT, lw=1, dash="2 3"))
    o.append(_f07_angarc(rx, ry, 58, (0, -1), (sx - rx, sy - ry), GLD, 1.4))
    o.append(TX(rx + 18, ry - 64, "κ", "start", 11, GLD, True, halo=True))
    o.append(ARR(rx, ry - 2, rx, ry - 40, c=ALI, lw=2.6, head=8))
    o.append(TX(rx - 8, ry - 20, "a", "end", 11, ALI, True, halo=True))
    o.append(_f07_rx(rx, ry, GRN))
    o.append(TX(14, 266, "受信機を軸の向きに a 動かす → どの衛星までの距離も a cos κ 縮む", "start", 9.5, ALI, True))
    o.append(TX(14, 283, "時計のずれを a cos κ 増やす → 全部の擬似距離が元に戻る", "start", 9.5, GLD, True))
    o.append(T(14, 300, "擬似距離が変わらないので、この 2 つの動きを見分けられない", "start", 9.5, INK, True))
    # (b) 並びを変えた例
    xc = 392
    o.append(T(xc, 18, "(b) 並びと DOP", "start", 11.5, INK, True))
    rows = []
    for dl, lab in ((0.0, "4 つが同じ仰角 45°（方位 90° おき）"), (1.0, "仰角 46°・44°・46°・44°"), (5.0, "仰角 50°・40°・50°・40°")):
        G4 = _f07_G([(45 + dl, 0), (45 - dl, 90), (45 + dl, 180), (45 - dl, 270)])
        M = G4.T @ G4
        if abs(_f07_np.linalg.det(M)) < 1e-9:
            rows.append((lab, "解けない", "解けない"))
        else:
            Hh = _f07_np.linalg.inv(M); d4 = _f07_dops(Hh)
            rows.append((lab, "%.2f" % d4["H"], "%.1f" % d4["V"]))
    H = _f07_H(_F07_ALL)
    els = [_F07_V[n][1] for n in _F07_ALL]; azs = [_F07_V[n][2] for n in _F07_ALL]
    Gh = _f07_G([(e if i % 2 == 0 else -e, a) for i, (e, a) in enumerate(zip(els, azs))])
    dh = _f07_dops(_f07_np.linalg.inv(Gh.T @ Gh))
    rows.append(("東京の 8 つ（実際の並び）", "%.2f" % _f07_dops(H)["H"], "%.2f" % _f07_dops(H)["V"]))
    rows.append(("8 つのうち 4 つを地平線の下へ（仮）", "%.2f" % dh["H"], "%.2f" % dh["V"]))
    o.append(T(xc + 220, 44, "HDOP", "end", 9.5, MUT, True)); o.append(T(xc + 292, 44, "VDOP", "end", 9.5, MUT, True))
    o.append(W(xc, 49, xc + 294, 49, c=LIN, lw=0.8))
    for i, (lab, hd, vd) in enumerate(rows):
        yy = 66 + i * 30
        o.append(T(xc, yy, lab, "start", 9.5, INK))
        o.append(T(xc + 220, yy + 14, hd, "end", 10, ALI if i == 0 else INK, True))
        o.append(T(xc + 292, yy + 14, vd, "end", 10, ALI if i < 3 else INK, True))
    o.append(T(xc, 232, "同じ仰角に近いほど VDOP が大きい。", "start", 9.5, ALI, True))
    o.append(T(xc, 249, "衛星が地平線の下にもあれば、VDOP は HDOP より", "start", 9.5, INK))
    o.append(T(xc, 264, "小さくなる（実際には見えない）。", "start", 9.5, INK))
    return SVG(700, 312, o, "解けない並びと、その近くの並びの DOP（(b) の上の 3 つは、方位角が 90° おきの 4 つの衛星）。")
F["e07_cone"] = _f07_cone_fig()


# =====================================================================
# 4 節: 1 日の DOP の変わり方（GPS だけ・全部の衛星系）と仰角マスク
# =====================================================================
_F07_SYSALL = ("GPS", "GLONASS", "Galileo", "BeiDou", "QZSS")


def _f07_dop_at(t, systems, mask=10.0):
    """時刻 t の東京の (衛星の数, HDOP, VDOP)。衛星系ごとに時計のずれの未知数を 1 つずつ置く。"""
    vis = _f07_visible(t, systems, mask)
    if len(vis) < 4:
        return len(vis), float("nan"), float("nan")
    G = _f07_G([(q[1], q[2]) for q in vis], [q[4] for q in vis])
    if G.shape[0] < G.shape[1]:
        return len(vis), float("nan"), float("nan")
    H = _f07_np.linalg.inv(G.T @ G)
    return len(vis), math.sqrt(H[0, 0] + H[1, 1]), math.sqrt(H[2, 2])


_F07_DAYG = [_f07_dop_at(k * 600.0, ("GPS",)) for k in range(24 * 6 + 1)]
_F07_DAYA = [_f07_dop_at(k * 600.0, _F07_SYSALL) for k in range(24 * 6 + 1)]


def _f07_dopday_fig():
    o = []
    ts = [k / 6 for k in range(24 * 6 + 1)]
    o.append(T(14, 18, "(a) 東京の 24 時間（仰角マスク 10°、1 章の近似の配置）", "start", 11.5, INK, True))
    p = Plot(70, 44, 560, 110, (0, 24), (0, 40))
    o.append(p.axes(xl=None, yl="衛星の数", xt=list(range(0, 25, 3)), yt=[0, 10, 20, 30, 40], xfmt=lambda v: ""))
    o.append(p.steps([(t, q[0]) for t, q in zip(ts, _F07_DAYG)], c=SIG, lw=2))
    o.append(p.steps([(t, q[0]) for t, q in zip(ts, _F07_DAYA)], c=INK, lw=2))
    o.append(T(p.X(23.6), p.Y(_F07_DAYA[-3][0]) - 6, "全部の衛星系", "end", 9.5, INK, True, halo=True))
    o.append(T(p.X(23.6), p.Y(_F07_DAYG[-3][0]) - 6, "GPS だけ", "end", 9.5, SIG, True, halo=True))
    q = Plot(70, 172, 560, 170, (0, 24), (0, 3))
    o.append(q.axes(xl="時刻 0 からの時間 [時]", yl="DOP", xt=list(range(0, 25, 3)), yt=[0, 1, 2, 3]))
    for data, c in ((_F07_DAYG, SIG), (_F07_DAYA, INK)):
        o.append(q.clip([(t, d[1]) for t, d in zip(ts, data)], c=c, lw=2))
        o.append(q.clip([(t, d[2]) for t, d in zip(ts, data)], c=c, lw=1.6, dash="6 3"))
    hg = sorted(d[1] for d in _F07_DAYG); ha = sorted(d[1] for d in _F07_DAYA)
    vg = sorted(d[2] for d in _F07_DAYG); va = sorted(d[2] for d in _F07_DAYA)
    med = lambda a: a[len(a) // 2]
    o.append(LEGL(70, 392, [(SIG, None, "GPS だけ HDOP"), (SIG, "6 3", "GPS だけ VDOP"), (INK, None, "全部 HDOP"), (INK, "6 3", "全部 VDOP")], 9.5, 14))
    o.append(T(70, 412, "中央値: GPS だけ HDOP %.2f・VDOP %.2f（衛星 %d〜%d 個）、全部の衛星系 HDOP %.2f・VDOP %.2f（%d〜%d 個）" % (
        med(hg), med(vg), min(d[0] for d in _F07_DAYG), max(d[0] for d in _F07_DAYG), med(ha), med(va), min(d[0] for d in _F07_DAYA), max(d[0] for d in _F07_DAYA)), "start", 9.5, INK, True))
    # (b) 仰角マスク
    o.append(T(14, 448, "(b) 仰角マスクと DOP（時刻 0）", "start", 11.5, INK, True))
    masks = [0, 5, 10, 20, 30]
    hdr = ["仰角マスク", "GPS: 衛星の数", "HDOP", "VDOP", "全部: 衛星の数", "HDOP", "VDOP"]
    xs = [70, 250, 320, 390, 520, 590, 660]
    for x, h in zip(xs, hdr):
        o.append(T(x, 470, h, "start" if x == 70 else "end", 9.5, MUT, True))
    o.append(W(70, 475, 664, 475, c=LIN, lw=0.8))
    for i, mk in enumerate(masks):
        yy = 492 + i * 17
        n1, h1, v1 = _f07_dop_at(0.0, ("GPS",), mk); n2, h2, v2 = _f07_dop_at(0.0, _F07_SYSALL, mk)
        vals = ["%d°" % mk, "%d" % n1, "%.2f" % h1, "%.2f" % v1, "%d" % n2, "%.2f" % h2, "%.2f" % v2]
        for j, (x, v) in enumerate(zip(xs, vals)):
            o.append(T(x, yy, v, "start" if j == 0 else "end", 10, SIG if 1 <= j <= 3 else (INK if j else MUT), j in (2, 5)))
    return SVG(700, 580, o, "東京の DOP の 24 時間の変化と、衛星系・仰角マスクの効果（1 章の近似の配置: GPS・GLONASS・Galileo・BeiDou 各 24 機、みちびき 4 機。衛星系を混ぜるときは、時計のずれの未知数を衛星系ごとに 1 つ置き、G の時計の列を衛星系の数だけにした）。")
F["e07_dopday"] = _f07_dopday_fig()


# =====================================================================
# 5 節: 水平の誤差の散布図と、CEP・DRMS・R95・2DRMS の円
# =====================================================================
def _f07_radial_panel(o, x0, ns, lim, ttl, seed):
    o.append(T(x0, 18, ttl, "start", 11, INK, True))
    H = _f07_H(ns)
    s1, s2, ang = _f07_ell(H[:2, :2])
    drms = math.sqrt(s1 * s1 + s2 * s2)
    A = _f07_lsA(ns)
    rng = _f07_np.random.default_rng(seed)
    X = rng.standard_normal((2000, len(ns))) @ A.T
    dh = _f07_np.hypot(X[:, 0], X[:, 1])
    p = Plot(x0 + 40, 36, 250, 250, (-lim, lim), (-lim, lim))
    o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 1))
    tk = [-lim, -lim / 2, 0, lim / 2, lim]
    o.append(p.axes(xl="東西の誤差 [m]", yl="南北の誤差 [m]", xt=tk, yt=tk, xfmt=_f07_fmt, yfmt=_f07_fmt, sz=9))
    for e_, n_ in X[:, :2]:
        if abs(e_) < lim and abs(n_) < lim:
            o.append(D(p.X(e_), p.Y(n_), GLD, 1.0))
    cep = _f07_rad(0.5, s1, s2); r95 = _f07_rad(0.95, s1, s2)
    circ = [("CEP", cep, SIG, None), ("DRMS", drms, PUR, "5 3"), ("R95", r95, ALI, None), ("2DRMS", 2 * drms, INK, "5 3")]
    k = (p.w / 2) / lim
    for nm, r, c, dash in circ:
        if r < lim * 1.42:
            o.append(PATH("M%g,%g a%g,%g 0 1,0 %g,0 a%g,%g 0 1,0 %g,0" % (p.X(0) - r * k, p.Y(0), r * k, r * k, 2 * r * k, r * k, r * k, -2 * r * k), c=c, lw=1.8, dash=dash))
    o.append(W(p.X(0) - 5, p.Y(0), p.X(0) + 5, p.Y(0), c=GRN, lw=2)); o.append(W(p.X(0), p.Y(0) - 5, p.X(0), p.Y(0) + 5, c=GRN, lw=2))
    # 表
    ty = 336
    o.append(T(x0 + 4, ty, "円", "start", 9.5, MUT, True)); o.append(T(x0 + 128, ty, "半径", "end", 9.5, MUT, True))
    o.append(T(x0 + 214, ty, "式の割合", "end", 9.5, MUT, True)); o.append(T(x0 + 300, ty, "点の割合", "end", 9.5, MUT, True))
    o.append(W(x0 + 4, ty + 5, x0 + 302, ty + 5, c=LIN, lw=0.8))
    for i, (nm, r, c, dash) in enumerate(circ):
        yy = ty + 20 + i * 16
        o.append(W(x0 + 4, yy - 4, x0 + 22, yy - 4, c=c, lw=2, dash=dash))
        o.append(T(x0 + 28, yy, nm, "start", 10, c, True))
        o.append(T(x0 + 128, yy, "%.2f m" % r, "end", 10, INK))
        o.append(T(x0 + 214, yy, "%.1f %%" % (100 * _f07_pin(r, s1, s2)), "end", 10, INK))
        o.append(T(x0 + 300, yy, "%.1f %%" % (100 * float(_f07_np.mean(dh <= r))), "end", 10, INK))
    return s1, s2


def _f07_radial_fig():
    o = []
    _f07_radial_panel(o, 14, _F07_ALL, 2.5, "(a) 円に近い場合（見えている 8 つ）", 501)
    _f07_radial_panel(o, 366, _F07_CL4, 25.0, "(b) 細長い場合（偏った 4 つ）", 502)
    o.append(T(14, 420, "どちらも、擬似距離の誤差 σ = 1 m の正規分布で 2000 回解いた位置（金の点）。緑の十字が本当の位置。", "start", 9.5, MUT))
    return SVG(700, 430, o, "水平の誤差の散らばりと、精度を表す 4 つの円（「式の割合」は 2 次元の正規分布の積分、「点の割合」は 2000 回の中で数えた値）。")
F["e07_radial"] = _f07_radial_fig()


# =====================================================================
# 5 節: 半径の累積確率と、換算の係数（楕円の細長さで変わる）・上下の 95 %
# =====================================================================
# CEP の近似の式 0.59(σ₁ + σ₂) と、数値で積分した CEP の差（短い半径 ÷ 長い半径が 0.2〜1 の範囲の最大。近似の値を基準にした割合）
_F07_CEPERR = max(abs(_f07_rad(0.5, 1.0, r) / (0.59 * (1.0 + r)) - 1) for r in _f07_np.linspace(0.2, 1.0, 81))


def _f07_cdf_fig():
    o = []
    o.append(T(14, 18, "(a) 水平の誤差が半径 R の円に入る確率", "start", 11.5, INK, True))
    p = Plot(64, 40, 330, 230, (0, 2.5), (0, 1))
    o.append(p.axes(xl="R / DRMS", yl="円に入る確率", xt=[0, 0.5, 1, 1.5, 2, 2.5], yt=[0, 0.25, 0.5, 0.75, 0.95, 1.0], xfmt=_f07_fmt, yfmt=lambda v: "%g %%" % (100 * v)))
    o.append(W(p.x, p.Y(0.5), p.x + p.w, p.Y(0.5), c=SIG, lw=1, dash="3 3"))
    o.append(W(p.x, p.Y(0.95), p.x + p.w, p.Y(0.95), c=ALI, lw=1, dash="3 3"))
    for xv in (1, 2):
        o.append(W(p.X(xv), p.y, p.X(xv), p.y + p.h, c=PUR if xv == 1 else INK, lw=1, dash="3 3"))
    ratios = [(1.0, SIG, None, "円（比 1）"), (0.5, GLD, None, "比 0.5"), (0.2, PUR, None, "比 0.2"), (0.0, ALI, "6 3", "直線（比 0）")]
    Rs = _f07_np.linspace(0, 2.5, 126)
    for r, c, dash, lab in ratios:
        s1 = 1 / math.sqrt(1 + r * r); s2 = r * s1
        o.append(p.line([(R, _f07_pin(R, s1, s2, 720)) for R in Rs], c=c, lw=2, dash=dash))
    o.append(LEGL(64, 322, [(c, dash, lab) for r, c, dash, lab in ratios], 9.5, 12))
    o.append(T(p.X(1) + 3, p.y + 12, "DRMS", "start", 9, PUR, True, halo=True))
    o.append(T(p.X(2) + 3, p.y + 12, "2DRMS", "start", 9, INK, True, halo=True))
    # (b) 係数の表
    xb = 420
    o.append(T(xb, 18, "(b) 換算の係数", "start", 11.5, INK, True))
    o.append(T(xb + 100, 18, "比 = 楕円の短い半径 ÷ 長い半径", "start", 9.5, MUT))
    hdr = ["比", "CEP/DRMS", "R95/DRMS", "DRMS の円", "2DRMS の円"]
    xs = [xb + 6, xb + 86, xb + 152, xb + 214, xb + 278]
    for x, h in zip(xs, hdr):
        o.append(T(x, 44, h, "start" if x == xs[0] else "end", 9.5, MUT, True))
    o.append(W(xb, 49, xb + 280, 49, c=LIN, lw=0.8))
    for i, r in enumerate([1.0, 0.75, 0.5, 0.3, 0.2, 0.1, 0.0]):
        s1 = 1 / math.sqrt(1 + r * r); s2 = r * s1
        yy = 66 + i * 18
        vals = ["%.2f" % r, "%.3f" % _f07_rad(0.5, s1, s2), "%.3f" % _f07_rad(0.95, s1, s2), "%.1f %%" % (100 * _f07_pin(1.0, s1, s2)), "%.1f %%" % (100 * _f07_pin(2.0, s1, s2))]
        for j, (x, v) in enumerate(zip(xs, vals)):
            o.append(T(x, yy, v, "start" if j == 0 else "end", 10, INK, j == 0))
    o.append(T(xb + 6, 206, "比 1: CEP = 1.177σ、R95 = 2.448σ（σ は 1 軸）", "start", 9.5, SIG))
    o.append(T(xb + 6, 222, "比 0（直線）: 1 次元の正規分布と同じ", "start", 9.5, ALI))
    o.append(TX(xb + 6, 238, "比 0.2 以上: CEP ≈ 0.59(σ_1 + σ_2)（差は %.1f %% 以内）" % (100 * _F07_CEPERR), "start", 9.5, MUT))
    # (c) 上下（1 次元）
    o.append(T(xb, 262, "(c) 上下の誤差（1 次元の正規分布）", "start", 11.5, INK, True))
    q = Plot(xb + 14, 280, 260, 80, (-3.2, 3.2), (0, 0.42))
    xs_ = _f07_np.linspace(-3.2, 3.2, 161)
    pdf = lambda x: math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
    for k_, c in ((2.0, MSOFT), (1.96, soft(ALI)), (1.0, soft(SIG))):
        pts = [(q.X(-k_), q.Y(0))] + [(q.X(x), q.Y(pdf(x))) for x in _f07_np.linspace(-k_, k_, 81)] + [(q.X(k_), q.Y(0))]
        o.append(PL(pts, c="none", lw=0, fill=c))
    o.append(q.line([(x, pdf(x)) for x in xs_], c=INK, lw=1.6))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    for v in (-2, -1, 0, 1, 2):
        o.append(T(q.X(v), q.Y(0) + 13, ("%dσ" % v).replace("-", "−") if v else "0", "middle", 9, MUT))
    o.append(T(xb + 14, 390, "±1σ: 68.3 %　±1.96σ: 95.0 %　±2σ: 95.4 %", "start", 10, INK, True))
    o.append(T(xb + 14, 406, "上下の 95 % の値 = 1.96 × VDOP × σ", "start", 9.5, MUT))
    return SVG(700, 420, o, "半径 R の円に入る確率と、換算の係数（誤差の楕円の形ごとに、2 次元の正規分布を数値で積分した値。横軸は DRMS で割った半径）。")
F["e07_cdf"] = _f07_cdf_fig()


# =====================================================================
# 6 節: 誤差の予算 — 2 乗の和の平方根と、どの源を減らすと効くか
# =====================================================================
def _f07_uere(vals):
    return math.sqrt(sum(v * v for v in vals))


_F07_UERE = _f07_uere([b[2] for b in _F07_BUD])


def _f07_budget_fig():
    o = []
    o.append(T(14, 18, "(a) 源ごとの誤差（1σ、代表値）と UERE", "start", 11.5, INK, True))
    p = Plot(176, 34, 180, 150, (0, 7.5), (0, 1))
    o.append(p.axes(xl="擬似距離の誤差の標準偏差 [m]", yl=None, xt=[0, 2, 4, 6], yt=[], xfmt=_f07_fmt))
    for i, (nm, k, v) in enumerate(_F07_BUD):
        yy = 40 + i * 24
        c = _F07_SC[k]
        o.append(T(p.x - 8, yy + 13, nm, "end", 9.5, c, True))
        o.append(RECT(p.X(0), yy + 2, p.X(v) - p.X(0), 15, 2, soft(c), c, 1.2))
        o.append(T(p.X(v) + 5, yy + 14, "%.1f m" % v, "start", 9.5, c, True))
    lin = sum(b[2] for b in _F07_BUD)
    o.append(T(14, 246, "単純に足した値: %.1f m（大きすぎる見積もり）" % lin, "start", 10, MUT, True))
    o.append(TX(14, 264, "2 乗の和の平方根: σ_{UERE} = √(%s) = %.2f m" % (" + ".join("%.1f^2" % b[2] for b in _F07_BUD), _F07_UERE), "start", 10, INK, True))
    # (b) 分散の割合
    xb = 400
    o.append(T(xb, 18, "(b) 分散（2 乗）の割合", "start", 11.5, INK, True))
    tot = sum(b[2] ** 2 for b in _F07_BUD)
    x = xb + 6; w = 280
    for nm, k, v in _F07_BUD:
        ww = w * v * v / tot
        c = _F07_SC[k]
        o.append(RECT(x, 40, ww, 30, 0, soft(c), c, 1))
        x += ww
    yy = 92
    for nm, k, v in _F07_BUD:
        c = _F07_SC[k]
        o.append(RECT(xb + 6, yy - 9, 10, 10, 2, soft(c), c, 1))
        o.append(T(xb + 22, yy, "%s %.2f m²（%.0f %%）" % (nm.split("（")[0], v * v, 100 * v * v / tot), "start", 9.5, c, True))
        yy += 17
    o.append(TX(xb + 6, yy + 4, "合計 %.2f m² → σ_{UERE} = %.2f m" % (tot, _F07_UERE), "start", 10, INK, True))
    # (c) どれを減らすと効くか
    o.append(T(14, 300, "(c) 1 つの源を変えたときの UERE", "start", 11.5, INK, True))
    q = Plot(286, 316, 300, 150, (0, 4.5), (0, 1))
    o.append(q.axes(xl="UERE [m]", yl=None, xt=[0, 1, 2, 3, 4], yt=[], xfmt=_f07_fmt))
    vals0 = [b[2] for b in _F07_BUD]
    cases = [("例のとおり", vals0, INK)]
    names = ["衛星の時計と軌道", "電離層", "対流圏", "マルチパス", "受信機の雑音"]
    for j, (lab, c) in enumerate([("電離層を半分に（3.5 → 1.75 m）", GLD), ("マルチパスを 0 に", ALI), ("受信機の雑音を半分に", TEA), ("衛星の時計と軌道を半分に", PUR)]):
        v = list(vals0)
        idx = {0: 1, 1: 3, 2: 4, 3: 0}[j]
        v[idx] = 0.0 if j == 1 else v[idx] / 2
        cases.append((lab, v, c))
    for i, (lab, v, c) in enumerate(cases):
        yy = 322 + i * 28
        u = _f07_uere(v)
        o.append(T(q.x - 8, yy + 13, lab, "end", 9.5, c, True))
        o.append(RECT(q.X(0), yy + 2, q.X(u) - q.X(0), 16, 2, soft(c) if i else c, c, 1.2))
        o.append(T(q.X(u) + 5, yy + 14, ("%.2f m（%+.1f %%）" % (u, 100 * (u / _F07_UERE - 1))).replace("-", "−") if i else "%.2f m" % u, "start", 9.5, c, True))
    return SVG(700, 514, o, "誤差の予算の例（L1 だけの受信機、開けた空、航法メッセージの補正とモデルを使う場合の代表値）。")
F["e07_budget"] = _f07_budget_fig()


# =====================================================================
# 6 節: UERE × DOP — 衛星の並びごとの精度の見積もり
# =====================================================================
def _f07_acc_rows():
    """並びごとの (名前, HDOP, VDOP, CEP, R95, 上下 95 %)（UERE をかけた値 [m]）。24 時間は中央値。"""
    rows = []
    for lab, ns in (("1 章の 4 つ（時刻 0）", _F07_N4), ("見えている 8 つ（時刻 0）", _F07_ALL), ("偏った 4 つ（時刻 0）", _F07_CL4)):
        H = _f07_H(ns); s1, s2, _ = _f07_ell(H[:2, :2]); dd = _f07_dops(H)
        rows.append((lab, dd["H"], dd["V"], _F07_UERE * _f07_rad(0.5, s1, s2), _F07_UERE * _f07_rad(0.95, s1, s2), 1.96 * dd["V"] * _F07_UERE))
    for lab, systems in (("GPS だけ・マスク 10°（24 時間の中央値）", ("GPS",)), ("全部の衛星系・マスク 10°（24 時間の中央値）", _F07_SYSALL)):
        hs, vs, cs, rs = [], [], [], []
        for k in range(0, 24 * 6 + 1):
            vis = _f07_visible(k * 600.0, systems, 10.0)
            G = _f07_G([(q[1], q[2]) for q in vis], [q[4] for q in vis])
            H = _f07_np.linalg.inv(G.T @ G); s1, s2, _ = _f07_ell(H[:2, :2])
            hs.append(math.sqrt(H[0, 0] + H[1, 1])); vs.append(math.sqrt(H[2, 2]))
            cs.append(_f07_rad(0.5, s1, s2)); rs.append(_f07_rad(0.95, s1, s2))
        med = lambda a: float(_f07_np.median(a))
        rows.append((lab, med(hs), med(vs), _F07_UERE * med(cs), _F07_UERE * med(rs), 1.96 * med(vs) * _F07_UERE))
    return rows


_F07_ACC = _f07_acc_rows()


def _f07_acc_fig():
    o = []
    o.append(TX(14, 18, "UERE %.2f m（6 節の例）× DOP → 位置の誤差" % _F07_UERE, "start", 11.5, INK, True))
    order = [4, 3, 1, 0, 2]
    p = Plot(330, 60, 340, 290, (0.5, 120), (0, 1), xlog=True)
    o.append(p.axes(xl="位置の誤差 [m]（対数の目盛）", yl=None, xt=[1, 2, 5, 10, 20, 50, 100], yt=[], xfmt=_f07_fmt))
    o.append(T(14, 46, "衛星の並び", "start", 9.5, MUT, True))
    o.append(T(256, 46, "HDOP", "end", 9.5, MUT, True)); o.append(T(312, 46, "VDOP", "end", 9.5, MUT, True))
    for i, k in enumerate(order):
        lab, hd, vd, cep, r95, v95 = _F07_ACC[k]
        y0 = 66 + i * 58
        o.append(T(14, y0 + 16, lab.split("（")[0], "start", 10, INK, True))
        o.append(T(14, y0 + 31, "（" + lab.split("（")[1] if "（" in lab else "", "start", 9, MUT))
        o.append(T(256, y0 + 16, "%.2f" % hd, "end", 10, INK, True)); o.append(T(312, y0 + 16, "%.2f" % vd, "end", 10, INK, True))
        for j, (v, c, nm) in enumerate(((cep, SIG, "CEP"), (r95, ALI, "R95"), (v95, PUR, "上下 95 %"))):
            yy = y0 + 4 + j * 15
            o.append(RECT(p.X(0.5), yy, p.X(v) - p.X(0.5), 11, 2, soft(c), c, 1))
            lab_ = "%s %.1f m" % (nm, v)
            if p.X(v) + 4 + tw(lab_, 9) < 698:
                o.append(T(p.X(v) + 4, yy + 10, lab_, "start", 9, c, True))
            else:
                o.append(T(p.X(v) - 4, yy + 9.5, lab_, "end", 9, c, True, halo=True))
    return SVG(700, 400, o, "UERE と DOP からの精度の見積もり（どの衛星も同じ大きさの独立な誤差とした。CEP と R95 は誤差の楕円から、上下の 95 % は 1.96 × VDOP × UERE で計算した。24 時間の値は、10 分おきの値の中央値）。")
F["e07_acc"] = _f07_acc_fig()


# =====================================================================
# 6 節: 見積もりの前提 — 源ごとの、誤差が変わる時間の目安
# =====================================================================
def _f07_assume_fig():
    o = []
    o.append(T(14, 18, "誤差が変わる時間の目安（代表値）", "start", 11.5, INK, True))
    p = Plot(176, 40, 480, 150, (0.5, 1e5), (0, 1), xlog=True)
    xt = [1, 10, 60, 600, 3600, 36000]
    o.append(p.axes(xl="誤差が変わる時間（対数の目盛）", yl=None, xt=xt, yt=[],
                    xfmt=lambda v: {1: "1 秒", 10: "10 秒", 60: "1 分", 600: "10 分", 3600: "1 時間", 36000: "10 時間"}[v]))
    rows = [("衛星の時計と軌道", "s", 120, 4 * 3600, "数分〜数時間"), ("電離層", "I", 120, 4 * 3600, "数分〜数時間"), ("対流圏", "T", 120, 4 * 3600, "数分〜数時間"),
            ("マルチパス", "M", 30, 600, "数十秒〜十分ほど"), ("受信機の雑音", "e", 0.7, 1.4, "1 秒ごとに変わる")]
    for i, (nm, k, a, b, lab) in enumerate(rows):
        yy = 46 + i * 28
        c = _F07_SC[k]
        o.append(T(p.x - 8, yy + 13, nm, "end", 9.5, c, True))
        o.append(RECT(p.X(a), yy + 2, p.X(b) - p.X(a), 15, 3, soft(c), c, 1.2))
        if i < 3:
            o.append(T(p.X(a) - 6, yy + 14, lab, "end", 9.5, c, True))
        else:
            o.append(T(p.X(b) + 6, yy + 14, lab, "start", 9.5, c, True))
    xm = p.X(600)
    o.append(W(xm, p.y - 4, xm, p.y + p.h, c=INK, lw=1.2, dash="4 3"))
    o.append(T(xm, 252, "例: 位置を 10 分平均する", "middle", 9.5, INK, True))
    o.append(ARR(xm - 8, 268, xm - 150, 268, c=GRN, lw=1.4, head=6)); o.append(T(xm - 158, 272, "速く変わる誤差は、平均で減る", "end", 9.5, GRN, True))
    o.append(ARR(xm + 8, 268, xm + 60, 268, c=ALI, lw=1.4, head=6)); o.append(T(xm + 66, 272, "ゆっくり変わる誤差は残る", "start", 9.5, ALI, True))
    return SVG(700, 284, o, "源ごとの、誤差が変わる時間の目安（代表値。色は 1 節の図と同じ）。")
F["e07_assume"] = _f07_assume_fig()
