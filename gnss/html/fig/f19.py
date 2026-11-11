# -*- coding: utf-8 -*-
# 19 章 慣性センサとの融合の図
import numpy as _f19_np

# =====================================================================
# 例の値（本文・デモ w19.js と同じ）
# =====================================================================
_F19_D = math.pi / 180
_F19_G = 9.8                 # 重力の加速度 g [m/s²]（代表値）
_F19_TS = 0.01               # IMU のサンプリング周期 T_s [s]（100 Hz）
_F19_SA = 0.02               # 加速度センサの雑音 σ_a（1 サンプルごと）[m/s²]
_F19_SB = 3e-4               # バイアスの変わり方 σ_b [m/s²/√s]（フィルタの見込み）
_F19_SY = 2.0                # GNSS の位置の誤差 σ_GNSS（東・北それぞれ、回ごとに独立）[m]
_F19_BA = 0.05               # 加速度センサのバイアス b_a（進む向き・東）[m/s²]
_F19_BAN = -0.03             # 横（北）の加速度センサのバイアス [m/s²]
_F19_BGD = 0.05              # ジャイロのバイアス b_g [°/s]
_F19_SGD = 0.05              # ジャイロの雑音（1 サンプルごと）[°/s]
_F19_V0 = 20.0               # 3 節の速さ [m/s]
_F19_TUN = (90.0, 120.0)     # 4 節のトンネル [s]
_F19_TD = 0.27               # 位置の遅れ t_d [s]（15 章 3 節の例と同じ）
_F19_SM = 3.0                # 動きのモデルの見込む加速度 σ_m [m/s²]（13 章 4 節の「車」と同じ大きさ）
_F19_S0 = (2.0, 1.0, 0.1)    # 初めの推定誤差の標準偏差（位置 [m]・速度 [m/s]・バイアス [m/s²]）
_F19_SW, _F19_SC = 0.05, 0.1 # 車速の雑音・拘束の雑音 [m/s]（10 Hz）


def _f19_m(v, d=1):
    """負の数の − を全角の負号にした数。"""
    s = ("%%.%df" % d) % v
    if s.lstrip("-").strip("0.") == "":
        s = s.lstrip("-")
    return s.replace("-", "−")


# ---- 乱数（widgets.js の U.rng と同じ列。図とデモで同じ雑音を使う） ----
def _f19_imul(a, b):
    return ((a & 0xffffffff) * (b & 0xffffffff)) & 0xffffffff


class _F19_Rng:
    def __init__(self, seed):
        self.a = (seed & 0xffffffff) or 1

    def next(self):
        a = self.a
        a = (a + 0x6D2B79F5) & 0xffffffff
        self.a = a
        t = _f19_imul(a ^ (a >> 15), 1 | a)
        t = ((t + _f19_imul(t ^ (t >> 7), 61 | t)) & 0xffffffff) ^ t
        return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296.0

    def normal(self):
        u = 1 - self.next()
        v = self.next()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


# =====================================================================
# 1 次元の例（4 節）: 直線の道を走る車。状態は位置・速度・加速度センサのバイアス
# =====================================================================
def _f19_acc1(t):
    """本当の加速度 [m/s²]: 10 s から加速して 20 m/s、トンネルの中（100〜105 s）で 10 m/s まで減速、125〜130 s で 20 m/s へ。"""
    if t < 10:
        return 0.0
    if t < 30:
        return 1.0
    if 100 <= t < 105:
        return -2.0
    if 125 <= t < 130:
        return 2.0
    return 0.0


def _f19_truth1(Tend=180.0, acc=_f19_acc1):
    N = int(round(Tend / _F19_TS))
    P, V, A = _f19_np.zeros(N + 1), _f19_np.zeros(N + 1), _f19_np.zeros(N + 1)
    p = v = 0.0
    for k in range(N + 1):
        a = acc(k * _F19_TS)
        P[k], V[k], A[k] = p, v, a
        p += v * _F19_TS + 0.5 * a * _F19_TS * _F19_TS
        v += a * _F19_TS
    return P, V, A


def _f19_pred(x, S, u, T, sa2, qb, bias=True):
    """予測 1 周期: x⁻ = A_d x + B_d u、Σ⁻ = A_d Σ A_dᵀ + W（A_d = [[1, T, −T²/2], [0, 1, −T], [0, 0, 1]]）。
    S は対称な 3 行 3 列（リストのリスト）。bias=False ならバイアスの行と列を 0 に保つ。"""
    h = T * T / 2
    a = u - x[2]
    x0 = x[0] + T * x[1] + h * a
    x1 = x[1] + T * a
    s00, s01, s02, s11, s12, s22 = S[0][0], S[0][1], S[0][2], S[1][1], S[1][2], S[2][2]
    r00 = s00 + T * s01 - h * s02
    r01 = s01 + T * s11 - h * s12
    r02 = s02 + T * s12 - h * s22
    r11 = s11 - T * s12
    r12 = s12 - T * s22
    n00 = r00 + T * r01 - h * r02 + sa2 * h * h
    n01 = r01 - T * r02 + sa2 * h * T
    n02 = r02
    n11 = r11 - T * r12 + sa2 * T * T
    n12 = r12
    n22 = s22 + (qb if bias else 0.0)
    return [x0, x1, x[2]], [[n00, n01, n02], [n01, n11, n12], [n02, n12, n22]]


def _f19_upd(x, S, j, y, V):
    """更新（観測は状態の j 番目に雑音の分散 V が加わった値）。返り値 (x, Σ, イノベーション, その分散)。"""
    e = y - x[j]
    Sv = S[j][j] + V
    H = [S[i][j] / Sv for i in range(3)]
    x = [x[i] + H[i] * e for i in range(3)]
    r = [S[j][0], S[j][1], S[j][2]]
    S = [[S[i][k] - H[i] * r[k] for k in range(3)] for i in range(3)]
    return x, S, e, Sv


def _f19_kf1(seed=1, bias=True, wscale=1.0, tunnel=_F19_TUN, Tu=1.0, sy=_F19_SY, ba=_F19_BA, sa=_F19_SA,
             Tend=180.0, acc=_f19_acc1, lat=None, gate=False, outl=(), obsv=None, sv=_F19_SW, vrate=10,
             every=10, axis=0, keep_innov=False):
    """1 次元の融合（4・5 節。デモ w19_kf の 1 つの軸・w19_bias と同じ計算）。
    IMU の雑音は U.rng(seed·7 + 1) を 1 周期に 2 つ（東・北）、GNSS の雑音は U.rng(seed·7 + 2) を 1 回に 2 つ（東・北）引き、axis 番目を使う。
    lat: None（遅れなし）・"ignore"（届いた時刻の予測と比べる）・"comp"（求めた時刻に戻して更新し、今まで予測し直す）。
    obsv: None・"wheel"（車速 = 速度 + 雑音）・"zero"（拘束: 0 = 速度 + 雑音）。返り値は辞書（every 周期ごとの記録）。"""
    rI, rG, rV = _F19_Rng(seed * 7 + 1), _F19_Rng(seed * 7 + 2), _F19_Rng(seed * 7 + 3)
    T = _F19_TS
    N = int(round(Tend / T))
    m = int(round(Tu / T))
    nd = int(round(_F19_TD / T)) if lat else 0
    P, Vv, A = _f19_truth1(Tend, acc)
    sa2 = sa * sa * wscale
    qb = _F19_SB ** 2 * T if bias else 0.0
    x = [0.0, 0.0, 0.0]
    S = [[_F19_S0[0] ** 2, 0, 0], [0, _F19_S0[1] ** 2, 0], [0, 0, (_F19_S0[2] ** 2 if bias else 0.0)]]
    first = True
    hist = []        # 遅れを補うための記録 (x, Σ, u)（その周期の予測の前）
    pend = []        # 届くのを待つ GNSS の値 (届く周期, 求めた周期, 値)
    rec = dict(t=[], err=[], sp=[], verr=[], sv=[], b=[], sb=[], spre=[], innov=[], ok=[], tin=[], Sin=[])
    vstep = int(round(1.0 / vrate / T)) if obsv else 0
    for k in range(N + 1):
        t = k * T
        # GNSS の値（求めた時刻の真値 + 雑音）。トンネルの中も乱数は引く（トンネルの長さで列がずれないように）
        if k % m == 0:
            g2 = (rG.normal(), rG.normal())
            if not (tunnel[0] <= t < tunnel[1]):
                y = P[k] + sy * g2[axis]
                for (o0, o1, off) in outl:
                    if o0 <= t < o1:
                        y += off
                if first:
                    x[0] = y
                    first = False
                else:
                    pend.append((k + nd, k, y))
        # 届いた GNSS の値で更新
        while pend and pend[0][0] <= k:
            ka, kf, y = pend.pop(0)
            if lat == "comp" and nd > 0:
                # 求めた時刻（kf）の予測に戻して更新し、記録した IMU の値で今まで予測し直す
                j0 = len(hist) - (k - kf)
                xb, Sb, _ = hist[j0]
                xb, Sb, e, Sv = _f19_upd(xb, Sb, 0, y, sy * sy)
                use = (not gate) or e * e <= 9 * Sv
                if use:
                    xx, SS = xb, Sb
                    for j in range(j0, len(hist)):
                        uu = hist[j][2]
                        hist[j] = (xx, SS, uu)
                        xx, SS = _f19_pred(xx, SS, uu, T, sa2, qb, bias)
                    x, S = xx, SS
            else:
                spre = math.sqrt(S[0][0])
                xn, Sn, e, Sv = _f19_upd(x, S, 0, y, sy * sy)
                use = (not gate) or e * e <= 9 * Sv
                if use:
                    x, S = xn, Sn
                rec["spre"].append((t, spre, math.sqrt(S[0][0])))
            if keep_innov:
                rec["tin"].append(t); rec["innov"].append(e); rec["Sin"].append(Sv); rec["ok"].append(use)
        # 車速・拘束（擬似的な観測）
        if obsv and k % vstep == 0:
            nv = rV.normal()
            yv = (Vv[k] + sv * nv) if obsv == "wheel" else sv * nv
            x, S, _, _ = _f19_upd(x, S, 1, yv, sv * sv)
        if k % every == 0:
            rec["t"].append(t); rec["err"].append(x[0] - P[k]); rec["sp"].append(math.sqrt(max(S[0][0], 0.0)))
            rec["verr"].append(x[1] - Vv[k]); rec["sv"].append(math.sqrt(max(S[1][1], 0.0)))
            rec["b"].append(x[2]); rec["sb"].append(math.sqrt(max(S[2][2], 0.0)))
        # IMU の値（本当の加速度 + バイアス + 雑音）で予測
        n2 = (rI.normal(), rI.normal())
        u = A[k] + ba + sa * n2[axis]
        if lat == "comp":
            hist.append((x, S, u))
            if len(hist) > nd + 2:
                hist.pop(0)
        x, S = _f19_pred(x, S, u, T, sa2, qb, bias)
    for kk in rec:
        rec[kk] = _f19_np.array(rec[kk])
    return rec



def _f19_kfm(seed=1, sm=_F19_SM, Tu=1.0, tunnel=_F19_TUN, sy=_F19_SY, Tend=180.0, acc=_f19_acc1, sub=10, axis=0):
    """IMU を使わないフィルタ（13 章 4 節の動きのモデル）: 状態は位置と速度、u = 0、
    加速度は 1 周期 Tu の間は一定の分からない値（標準偏差 σ_m）として W = σ_m² B_d B_dᵀ。GNSS の雑音は _f19_kf1 と同じ列。
    返り値は sub 個に分けた 1 周期の中の値も含む記録（のこぎりの形を描くため）。"""
    rG = _F19_Rng(seed * 7 + 2)
    P, V, A = _f19_truth1(Tend, acc)
    m = int(round(Tu / _F19_TS))
    N = int(round(Tend / _F19_TS))
    x = [0.0, 0.0]
    S = [[_F19_S0[0] ** 2, 0.0], [0.0, _F19_S0[1] ** 2]]
    first = True
    rec = dict(t=[], err=[], sp=[])
    for k in range(0, N + 1, m):
        t = k * _F19_TS
        g2 = (rG.normal(), rG.normal())
        if not (tunnel[0] <= t < tunnel[1]):
            y = P[k] + sy * g2[axis]
            if first:
                x = [y, 0.0]
                first = False
            else:
                rec["t"].append(t); rec["err"].append(x[0] - P[k]); rec["sp"].append(math.sqrt(S[0][0]))
                e = y - x[0]
                Sv = S[0][0] + sy * sy
                H = [S[0][0] / Sv, S[1][0] / Sv]
                x = [x[0] + H[0] * e, x[1] + H[1] * e]
                S = [[S[0][0] - H[0] * S[0][0], S[0][1] - H[0] * S[0][1]], [S[1][0] - H[1] * S[0][0], S[1][1] - H[1] * S[0][1]]]
        # 1 周期の中の予測（同じ加速度の見込みで、時間 τ だけ進めた値）
        for j in range(sub):
            tau = Tu * j / sub
            kk = min(N, k + int(round(tau / _F19_TS)))
            s00 = S[0][0] + 2 * tau * S[0][1] + tau * tau * S[1][1] + sm * sm * (tau * tau / 2) ** 2
            rec["t"].append(t + tau); rec["err"].append(x[0] + x[1] * tau - P[kk]); rec["sp"].append(math.sqrt(s00))
        a2 = Tu * Tu / 2
        x = [x[0] + Tu * x[1], x[1]]
        S = [[S[0][0] + 2 * Tu * S[0][1] + Tu * Tu * S[1][1] + sm * sm * a2 * a2, S[0][1] + Tu * S[1][1] + sm * sm * a2 * Tu],
             [S[0][1] + Tu * S[1][1] + sm * sm * a2 * Tu, S[1][1] + sm * sm * Tu * Tu]]
    for kk in rec:
        rec[kk] = _f19_np.array(rec[kk])
    return rec


# =====================================================================
# 平面の推測航法（2・3 節、デモ w19_dr と同じ計算）: 前向きの加速度で速さ、上下の軸のまわりの角速度で向きを進める
# =====================================================================
def _f19_route_straight(t):
    """本文の例: 東へ一定の 20 m/s。返り値 (前向きの加速度 [m/s²], 向きの変わる速さ [rad/s])。"""
    return 0.0, 0.0


def _f19_dr(seed=1, ba=_F19_BA, bgd=_F19_BGD, bpd=0.0, noise=1.0, Tend=60.0, route=_f19_route_straight, v0=_F19_V0, psi0=90.0, every=10):
    """慣性航法だけの位置（平面のモデル）。bpd: 傾きの軸（ピッチ）のジャイロのバイアス [°/s]（3 次元の傾きの誤差を入れるとき）。
    乱数は U.rng(seed·7 + 4) を 1 周期に 3 つ（前の加速度・向きの角速度・傾きの角速度）。返り値は記録の辞書。"""
    r = _F19_Rng(seed * 7 + 4)
    T = _F19_TS
    N = int(round(Tend / T))
    # 本当の動き
    s, ps, e, n = v0, psi0 * _F19_D, 0.0, 0.0
    # 推定（初めは正しい）
    s2, ps2, e2, n2, th2 = v0, psi0 * _F19_D, 0.0, 0.0, 0.0
    rec = dict(t=[], e=[], n=[], e2=[], n2=[], al=[], cr=[])
    for k in range(N + 1):
        t = k * T
        if k % every == 0:
            de, dn = e2 - e, n2 - n
            rec["t"].append(t); rec["e"].append(e); rec["n"].append(n); rec["e2"].append(e2); rec["n2"].append(n2)
            rec["al"].append(de * math.sin(ps) + dn * math.cos(ps)); rec["cr"].append(de * math.cos(ps) - dn * math.sin(ps))
        a, w = route(t)
        z = (r.normal(), r.normal(), r.normal())
        am = a + ba + _F19_SA * noise * z[0]                       # 前向きの加速度センサの値
        wm = w + (bgd + _F19_SGD * noise * z[1]) * _F19_D          # 上下の軸のまわりのジャイロの値
        qm = (bpd + _F19_SGD * noise * z[2]) * _F19_D if bpd else 0.0   # 傾きの軸のジャイロの値（本当は 0）
        # 推定: 傾きを積分し、重力の漏れ g sin(傾き) を前の加速度に足す（3 次元の傾きの誤差）
        th2 += qm * T
        af = am * math.cos(th2) + _F19_G * math.sin(th2)
        e2 += s2 * math.sin(ps2) * T + 0.5 * af * math.sin(ps2) * T * T
        n2 += s2 * math.cos(ps2) * T + 0.5 * af * math.cos(ps2) * T * T
        s2 += af * T
        ps2 += wm * T
        # 本当の動き
        e += s * math.sin(ps) * T + 0.5 * a * math.sin(ps) * T * T
        n += s * math.cos(ps) * T + 0.5 * a * math.cos(ps) * T * T
        s += a * T
        ps += w * T
    for kk in rec:
        rec[kk] = _f19_np.array(rec[kk])
    return rec


def _f19_tilt_ins(bgd=_F19_BGD, Tend=100.0, h=0.001):
    """鉛直の面の慣性航法（ピッチのジャイロのバイアスだけ）を細かい刻みで数値積分した位置の誤差。返り値 [(t, 誤差)]。"""
    bg = bgd * _F19_D
    th = vx = x = 0.0
    out = []
    n = int(round(Tend / h))
    marks = {int(round(tt / h)) for tt in (1, 2, 5, 10, 20, 50, 100) if tt <= Tend}
    for k in range(1, n + 1):
        th += bg * h
        ax = math.sin(th) * _F19_G           # 本体の上向きの g を、誤った傾きで回すと、水平に g sin(傾き) が残る
        x += vx * h + 0.5 * ax * h * h
        vx += ax * h
        if k in marks:
            out.append((k * h, x))
    return out


# =====================================================================
# 6 節: 疎結合と密結合（東・北・上の 3 つの軸に 4 節の 1 次元のモデルを並べ、時計のずれ b とドリフト ḃ を足した 11 個の状態）
# =====================================================================
_F19_SATS = [("G9", 74.9, 186.6), ("G6", 51.5, 45.1), ("G22", 45.6, 234.9), ("G2", 40.6, 315.8),
             ("G3", 25.9, 124.5), ("G13", 21.4, 68.0), ("G5", 8.7, 269.2), ("G16", 4.4, 171.1)]   # 東京・時刻 0 の GPS（6・7 章と同じ）
_F19_CAN = ["G9", "G6", "G22"]          # ビル街で見える 3 つ（北東〜南西の通り）
_F19_SRHO = 3.0                         # 擬似距離の誤差 σ [m]（衛星ごとに独立。例の値）
_F19_CLK = (0.009, 0.0355)              # 時計の乱れ: 時計のずれ [m²/s]・ドリフト [m²/s³]（TCXO の例の値）
_F19_BA3 = (_F19_BA, _F19_BAN, 0.02)    # 東・北・上の加速度センサのバイアス [m/s²]


def _f19_los(el, az):
    e, a = el * _F19_D, az * _F19_D
    return _f19_np.array([math.cos(e) * math.sin(a), math.cos(e) * math.cos(a), math.sin(e)])


def _f19_vis6(t):
    """6 節の場面: 開けた空（8 つ）→ ビル街（3 つ）→ トンネル（0）→ ビル街（3 つ）→ 開けた空。"""
    if 60 <= t < 90 or 120 <= t < 150:
        return _F19_CAN
    if 90 <= t < 120:
        return []
    return [s[0] for s in _F19_SATS]


def _f19_lt(mode, seed=1, Tend=180.0, every=10):
    """mode: "loose"（衛星が 4 つ以上のとき、受信機が最小二乗法で解いた位置で更新）・"tight"（擬似距離を 1 つずつ観測として更新）。
    返り値: 記録の辞書（t・東と北の誤差・東と北の 2 行 2 列の共分散）。"""
    L = {s[0]: _f19_los(s[1], s[2]) for s in _F19_SATS}
    rI, rG, rC = _F19_Rng(seed * 7 + 1), _F19_Rng(seed * 7 + 5), _F19_Rng(seed * 7 + 6)
    T = _F19_TS
    n = 11
    A = _f19_np.eye(n)
    B = _f19_np.zeros((n, 3))
    for ax in range(3):
        i = 3 * ax
        A[i, i + 1] = T; A[i, i + 2] = -T * T / 2; A[i + 1, i + 2] = -T
        B[i, ax] = T * T / 2; B[i + 1, ax] = T
    A[9, 10] = T
    W = _F19_SA ** 2 * B @ B.T
    for ax in range(3):
        W[3 * ax + 2, 3 * ax + 2] = _F19_SB ** 2 * T
    Sb, Sd = _F19_CLK
    W[9, 9] = Sb * T + Sd * T ** 3 / 3; W[9, 10] = W[10, 9] = Sd * T * T / 2; W[10, 10] = Sd * T
    x = _f19_np.zeros(n)
    S = _f19_np.diag([3, 1, 0.1, 3, 1, 0.1, 3, 1, 0.1, 30, 3.0]) ** 2
    p = _f19_np.zeros(3); b, bd = 0.0, 0.0
    ba = _f19_np.array(_F19_BA3)
    rec = dict(t=[], ee=[], en=[], C=[], nsat=[], nupd=[])
    N = int(round(Tend / T))
    for k in range(N + 1):
        t = k * T
        nu = 0
        if k % 100 == 0:
            vs = _f19_vis6(t)
            g8 = [rG.normal() for _ in range(8)]
            rho = {s[0]: -L[s[0]] @ p + b + _F19_SRHO * g8[j] for j, s in enumerate(_F19_SATS)}
            if k == 0:
                x[0], x[3], x[6] = p + 0.0
            elif mode == "loose" and len(vs) >= 4:
                G = _f19_np.array([_f19_np.r_[-L[s], 1.0] for s in vs])
                yv = _f19_np.array([rho[s] for s in vs])
                sol = _f19_np.linalg.solve(G.T @ G, G.T @ yv)
                Vp = _F19_SRHO ** 2 * _f19_np.linalg.inv(G.T @ G)[:3, :3]
                C = _f19_np.zeros((3, n)); C[0, 0] = C[1, 3] = C[2, 6] = 1
                Sv = C @ S @ C.T + Vp
                H = S @ C.T @ _f19_np.linalg.inv(Sv)
                x = x + H @ (sol[:3] - C @ x)
                S = S - H @ C @ S
                nu = len(vs)
            elif mode == "tight":
                for s in vs:
                    C = _f19_np.zeros(n); C[0], C[3], C[6] = -L[s]; C[9] = 1.0
                    Sv = C @ S @ C + _F19_SRHO ** 2
                    H = S @ C / Sv
                    x = x + H * (rho[s] - C @ x)
                    S = S - _f19_np.outer(H, C @ S)
                nu = len(vs)
            S = (S + S.T) / 2
        if k % every == 0:
            rec["t"].append(t); rec["ee"].append(x[0] - p[0]); rec["en"].append(x[3] - p[1])
            rec["C"].append(S[_f19_np.ix_([0, 3], [0, 3])].copy())
            rec["nsat"].append(len(_f19_vis6(t))); rec["nupd"].append(nu)
        u = ba + _F19_SA * _f19_np.array([rI.normal(), rI.normal(), rI.normal()])   # 止まった車（本当の加速度 0）
        x = A @ x + B @ u
        S = A @ S @ A.T + W
        b += bd * T + math.sqrt(Sb * T) * rC.normal()
        bd += math.sqrt(Sd * T) * rC.normal()
    for kk in rec:
        rec[kk] = _f19_np.array(rec[kk])
    return rec


def _f19_ell(C2):
    """2 行 2 列の共分散（東・北）から、楕円の長い半径・短い半径と、長い軸の向き（東から北へ回った角 [°]）（7 章と同じ）。"""
    a, b, c = C2[0][0], C2[0][1], C2[1][1]
    m = (a + c) / 2
    r = math.sqrt(((a - c) / 2) ** 2 + b * b)
    return math.sqrt(m + r), math.sqrt(max(m - r, 0.0)), 0.5 * math.degrees(math.atan2(2 * b, a - c))


def _f19_ellpts(s1, s2, ang, k=1.0, n=96):
    ca, sa = math.cos(ang * _F19_D), math.sin(ang * _F19_D)
    return [((k * s1 * math.cos(2 * math.pi * i / n)) * ca - (k * s2 * math.sin(2 * math.pi * i / n)) * sa,
             (k * s1 * math.cos(2 * math.pi * i / n)) * sa + (k * s2 * math.sin(2 * math.pi * i / n)) * ca) for i in range(n + 1)]


# =====================================================================
# 図の部品
# =====================================================================
def _f19_sat(x, y, c=SIG, s=1.0):
    """衛星の印（1 章・16 章と同じ見た目）。"""
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f19_car(x, y, c=GRN, s=1.0, flip=False):
    """車の印（横から見た形）。(x, y) は車の下の真ん中（道の上）。"""
    w, h = 30 * s, 10 * s
    o = [RECT(x - w / 2, y - h - 4 * s, w, h, 3 * s, soft(c), c, 1.3),
         PATH("M%g,%g L%g,%g L%g,%g L%g,%g Z" % (x - w * 0.28, y - h - 4 * s, x - w * 0.16, y - h - 11 * s, x + w * 0.22, y - h - 11 * s, x + w * 0.34, y - h - 4 * s), c=c, lw=1.3, fill=soft(c)),
         CIRC(x - w * 0.3, y - 3.5 * s, 3.5 * s, c=c, lw=1.3, fill=SCR), CIRC(x + w * 0.3, y - 3.5 * s, 3.5 * s, c=c, lw=1.3, fill=SCR)]
    return "".join(o)


def _f19_cross(x, y, c=ALI, r=4.5):
    return W(x - r, y - r, x + r, y + r, c=c, lw=2) + W(x - r, y + r, x + r, y - r, c=c, lw=2)


def _f19_band(p, xs, lo, hi, c):
    """Plot p の上の帯（xs の各点で lo〜hi）。枠の外は枠で切る。"""
    y0, y1 = sorted(p.yr)
    pts = [(p.X(x), p.Y(min(max(v, y0), y1))) for x, v in zip(xs, hi)] + [(p.X(x), p.Y(min(max(v, y0), y1))) for x, v in zip(xs[::-1], lo[::-1])]
    return PL(pts, c="none", lw=0, fill=soft(c), op=0.75)


def _f19_shade(p, t0, t1, lab=None, c=MUT, sz=9.5):
    """時間の軸の上のトンネルなどの区間（薄い塗り）。"""
    o = [RECT(p.X(t0), p.y, p.X(t1) - p.X(t0), p.h, 0, MSOFT, "none", 0)]
    if lab:
        o.append(T((p.X(t0) + p.X(t1)) / 2, p.y + 12, lab, "middle", sz, c, True))
    return "".join(o)


def _f19_thin(xs, ys, step):
    return list(zip(xs[::step], ys[::step]))


# =====================================================================
# 1 節: GNSS が苦手な場面（例のモデル）
# =====================================================================
_F19_SEG = [(0, 60, "開けた空"), (60, 90, "ビル街"), (90, 120, "トンネル"), (120, 150, "ビル街"), (150, 180, "開けた空")]


def _f19_weak_data():
    """1 秒ごとの使える衛星の数と、GNSS の水平の位置の誤差（例のモデル）。"""
    r = _F19_Rng(1901)
    out = []
    for t in range(181):
        nlos = 70 <= t < 74 or 133 <= t < 136
        if 90 <= t < 122:
            n = 0                                   # トンネルの中と、出た後に捕捉し直す 2 s
        elif 60 <= t < 90 or 122 <= t < 150:
            n = 5 if nlos else [3, 3, 4, 4, 5, 6][int(r.next() * 6)]
        else:
            n = 8
        f = {8: 1.0, 6: 1.5, 5: 2.0, 4: 3.0}.get(n, 0.0)
        z1, z2 = r.normal(), r.normal()
        err = None
        if n >= 4:
            err = 2.0 * f * math.hypot(z1, z2) / math.sqrt(2)
            if nlos:
                err += 22.0 + 6.0 * r.next()           # 反射波だけを受けた衛星（NLOS）で飛ぶ
        out.append((t, n, err))
    return out


def _f19_canyon_scene(o, dx, yg, full=True):
    """ビル街の場面（左の建物・右の建物・真上の衛星。full なら、さえぎられる衛星と反射だけ届く衛星も描く）。dx は横のずれ。"""
    cx = 324 + dx
    for (bx, bw, bt) in ((282, 22, 76), (344, 20, 62)):
        o.append(RECT(bx + dx, bt, bw, yg - bt, 1, MSOFT, MUT, 1.0))
        for wy in range(bt + 8, yg - 8, 12):
            o.append(W(bx + dx + 5, wy, bx + dx + bw - 5, wy, c=LIN, lw=1))
    o.append(_f19_car(cx, yg, GRN, 0.9))
    sats = [(324 + dx, 30)]
    o.append(W(324 + dx, 35, cx, 136, c=SIG, lw=1.0))                       # 真上に近い衛星はまっすぐ届く
    if full:
        sb, sc = (240 + dx, 54), (262 + dx, 24)
        o.append(W(sb[0] + 6, sb[1] + 3, 282 + dx, 96, c=SIG, lw=1.0))        # 低い衛星は建物でさえぎられる
        o.append(_f19_cross(282 + dx, 96))
        o.append(W(sc[0] + 4, sc[1] + 4, 344 + dx, 114.4, c=ALI, lw=1.2, dash="4 3"))   # 向かいの壁で反射して届く（NLOS）
        o.append(W(344 + dx, 114.4, cx + 8, 136, c=ALI, lw=1.2, dash="4 3"))
        sats += [sb, sc]
    for q in sats:
        o.append(_f19_sat(q[0], q[1], SIG, 0.8))


def _f19_weak_fig():
    o = []
    X = lambda t: 70 + t * (610 / 180.0)
    yg = 158
    o.append(T(14, 16, "(a) 例の場面", "start", 11, INK, True))
    o.append(W(X(0) - 10, yg, X(180) + 10, yg, c=MUT, lw=2))
    for t0, t1, nm in _F19_SEG:
        o.append(T((X(t0) + X(t1)) / 2, yg + 17, nm, "middle", 10, INK, True))
        o.append(T((X(t0) + X(t1)) / 2, yg + 31, "%d〜%d s" % (t0, t1), "middle", 9, MUT))
        if t0 > 0:
            o.append(W(X(t0), yg - 4, X(t0), yg + 30, c=LIN, lw=1, dash="3 3"))
    # 開けた空: どの衛星もまっすぐ届く
    for cx, ss in ((X(30), [(92, 46), (132, 30), (182, 36), (214, 58)]), (X(165), [(590, 52), (620, 30), (654, 38), (684, 56)])):
        for (sx, sy) in ss:
            o.append(W(sx, sy + 5, cx, 136, c=SIG, lw=1.0))
        for (sx, sy) in ss:
            o.append(_f19_sat(sx, sy, SIG, 0.8))
        o.append(_f19_car(cx, yg, GRN, 0.9))
    # ビル街（2 か所）
    _f19_canyon_scene(o, 0, yg)
    _f19_canyon_scene(o, X(135) - X(75), yg, False)
    o.append(T(296, 52, "反射だけ届く（NLOS）", "start", 9, ALI, True, halo=True))
    # トンネル
    cx = X(105)
    o.append(PATH("M%g,%g Q%g,%g %g,%g" % (X(90) - 4, yg, cx, yg - 120, X(120) + 4, yg), c=MUT, lw=1.4, fill=MSOFT))
    o.append(RECT(X(90) + 10, yg - 26, X(120) - X(90) - 20, 26, 2, SCR, MUT, 1.0))
    o.append(_f19_car(cx, yg, GRN, 0.9))
    for (sx, sy, hx, hy) in ((410, 34, 414, 102), (446, 26, 440, 102)):
        o.append(W(sx, sy + 5, hx, hy, c=SIG, lw=1.0))
        o.append(_f19_cross(hx, hy))
        o.append(_f19_sat(sx, sy, SIG, 0.8))
    o.append(T(cx, yg - 34, "届かない", "middle", 9, ALI, True, halo=True))
    # (b) 衛星の数と (c) 位置の誤差
    D_ = _f19_weak_data()
    p = Plot(70, 226, 610, 74, (0, 180), (0, 8))
    o.append(T(14, 214, "(b) 使える衛星の数", "start", 11, INK, True))
    o.append(p.axes(yt=[0, 4, 8], xt=[0, 30, 60, 90, 120, 150, 180], xfmt=lambda v: "", sz=9))
    o.append(W(p.x, p.Y(4), p.x + p.w, p.Y(4), c=ALI, lw=1, dash="4 3"))
    o.append(T(p.X(105), p.Y(4) - 5, "3 次元の位置に要る 4 つ", "middle", 9, ALI, True, halo=True))
    o.append(p.steps([(t, n) for t, n, _ in D_], c=SIG, lw=1.8))
    q = Plot(70, 330, 610, 96, (0, 180), (0, 40))
    o.append(T(14, 320, "(c) GNSS の水平の位置の誤差", "start", 11, INK, True))
    o.append(q.axes(xl="時間 t [s]", yl="誤差 [m]", yt=[0, 10, 20, 30, 40], xt=[0, 30, 60, 90, 120, 150, 180], sz=9))
    o.append(_f19_shade(q, 90, 122, "位置が出ない", ALI))
    for t, n, e in D_:
        if e is not None:
            o.append(D(q.X(t), q.Y(min(e, 40)), ALI if e > 15 else PUR, 2.2))
    o.append(T(q.X(72), q.Y(33), "NLOS で飛ぶ", "middle", 9, ALI, True, halo=True))
    o.append(T(q.X(30), q.Y(12), "数 m で、時間とともに育たない", "middle", 9, PUR, True, halo=True))
    return SVG(700, 466, o, "GNSS が苦手な場面（例のモデル）。衛星が 4 つ以上のときだけ位置が出るとし、誤差は開けた空で東・北それぞれ 2 m（1σ）、衛星が少ないほど大きくした。")


F["e19_weak"] = _f19_weak_fig()


def _f19_gap_fig():
    o = []
    v, td = _F19_V0, _F19_TD
    p = Plot(78, 22, 420, 230, (40.0, 43.0), (0, 70))
    o.append(p.axes(xl="時間 t [s]", yl="道に沿った位置 [m]", xt=[40, 40.5, 41, 41.5, 42, 42.5, 43], yt=[0, 20, 40, 60],
                    xfmt=lambda x: ("%g" % x)))
    o.append(p.line([(40.0, 0.0), (43.0, 60.0)], c=GRN, lw=2.4))
    # 使う位置（最後に届いた値）
    st = [(40.0 + td, 0.0), (41.0 + td, 0.0), (41.0 + td, 20.0), (42.0 + td, 20.0), (42.0 + td, 40.0), (43.0, 40.0)]
    o.append(p.line(st, c=PUR, lw=2.2))
    for tf in (40, 41, 42):
        yf = v * (tf - 40)
        o.append(D(p.X(tf), p.Y(yf), PUR, 4))
        o.append(ARR(p.X(tf) + 4, p.Y(yf), p.X(tf + td) - 1, p.Y(yf), c=PUR, lw=1.3, head=6))
    # 凡例
    lx, ly = p.x + 12, p.y + 16
    o.append(D(lx + 12, ly - 4, PUR, 4)); o.append(T(lx + 30, ly, "位置を求めた時刻（1 秒ごと）", "start", 9.5, PUR, True))
    o.append(ARR(lx, ly + 14, lx + 24, ly + 14, c=PUR, lw=1.3, head=6)); o.append(T(lx + 30, ly + 18, "文が届くまでの遅れ 0.27 s", "start", 9.5, PUR, True))
    o.append(LEGL(lx, ly + 36, [(PUR, None, "使う位置（最後に届いた値）")], 9.5))
    o.append(LEGL(lx, ly + 54, [(GRN, None, "本当の位置（20 m/s）")], 9.5))
    # ずれの寸法
    tA = 42.0 + td - 0.01
    o.append(DIM(p.X(tA), p.Y(20), p.X(tA), p.Y(v * (tA - 40)), None, c=ALI))
    o.append(T(p.X(tA) + 6, p.Y(32), "25.4 m", "start", 10, ALI, True, halo=True))
    tB = 42.0 + td + 0.01
    o.append(DIM(p.X(tB) + 10, p.Y(40), p.X(tB) + 10, p.Y(v * (tB - 40)), None, c=ALI))
    o.append(T(p.X(tB) + 16, p.Y(43.5), "5.4 m", "start", 10, ALI, True, halo=True))
    # IMU の値の刻み
    yb = p.y + p.h + 44
    o.append(T(14, yb - 12, "動きを測る", "start", 9.5, SIG, True))
    o.append(T(14, yb + 2, "センサ（2 節）", "start", 9.5, SIG, True))
    xs = [p.X(40.0 + 0.01 * k) for k in range(301)]
    o.append(PATH("".join("M%.2f,%.1fv8" % (x, yb - 6) for x in xs), c=SIG, lw=0.6))
    o.append(T(p.x + p.w, yb + 18, "の値は 10 ms ごと（例の値。20 m/s で 0.2 m ごと）", "end", 9.5, SIG, False))
    # 右: 速さと遅れの表
    x0 = 516
    o.append(T(x0, 36, "使う位置のずれ", "start", 10.5, INK, True))
    o.append(TX(x0, 54, "= 速さ × (遅れ t_d + 前の値が", "start", 9.5, MUT))
    o.append(T(x0 + 10, 68, "届いてから経った時間)", "start", 9.5, MUT))
    rows = [("速さ", "最小", "最大"), ("5 m/s（自転車）", "1.4 m", "6.4 m"), ("20 m/s（72 km/h）", "5.4 m", "25.4 m"), ("28 m/s（約 100 km/h）", "7.6 m", "35.6 m")]
    for i, (a, b, c) in enumerate(rows):
        yy = 96 + i * 20
        bb = i == 0
        o.append(T(x0, yy, a, "start", 9.5, INK if not bb else MUT, bb))
        o.append(T(x0 + 140, yy, b, "end", 9.5, ALI if not bb else MUT, bb))
        o.append(T(x0 + 178, yy, c, "end", 9.5, ALI if not bb else MUT, bb))
    o.append(W(x0, 101, x0 + 180, 101, c=LIN, lw=1))
    o.append(TX(x0, 190, "1 Hz・t_d = 0.27 s の例", "start", 9.5, MUT))
    return SVG(700, 330, o, "1 秒ごとに求めた位置が 0.27 s 遅れて届くとき、走る車が使う位置（例の値。GNSS の誤差は 0 として描いた）。")


F["e19_gap"] = _f19_gap_fig()


# =====================================================================
# 2 節: 加速度センサが測るもの（重力の分も測る）と、向きの誤差で重力が水平に漏れること
# =====================================================================
def _f19_rot(cx, cy, ang, body):
    """body を (cx, cy) のまわりに ang 度（時計回りが正。SVG の向き）回す。"""
    return '<g transform="rotate(%g %g %g)">%s</g>' % (ang, cx, cy, body)


def _f19_tilt_fig():
    o = []
    g = _F19_G
    sc = 5.2                      # 1 m/s² を何 px で描くか
    panels = [("(a) 平らな所で止まっている", 0.0, 0.0, None),
              ("(b) 前へ 2 m/s² で加速する", 0.0, 2.0, None),
              ("(c) 5° の上り坂で止まっている", 5.0, 0.0, None),
              ("(d) 傾きを 1° 誤って見込む", 0.0, 0.0, 1.0)]
    for k, (ttl, slope, acc, err) in enumerate(panels):
        x0 = 8 + k * 174
        cx, cy = x0 + (46 if err else 70), 150
        o.append(T(x0, 18, ttl, "start", 10, INK, True))
        # 道
        dx = 76 * math.cos(slope * _F19_D); dy = 76 * math.sin(slope * _F19_D)
        o.append(W(cx - dx, cy + dy + 4, cx + dx, cy - dy + 4, c=MUT, lw=2))
        body = _f19_car(cx, cy + 4, GRN, 1.15)
        # センサの軸（前・上）と読み
        fwd = acc + g * math.sin(slope * _F19_D)
        up = g * math.cos(slope * _F19_D)
        ax = []
        if not err:
            ax.append(ARR(cx, cy - 18, cx, cy - 18 - up * sc, c=SIG, lw=2.2, head=8))
        if abs(fwd) > 1e-9:
            ax.append(ARR(cx, cy - 18, cx + fwd * sc * 3, cy - 18, c=SIG, lw=2.2, head=8))
        if not err:
            ax.append(W(cx, cy - 18, cx + 56, cy - 18, c=FNT, lw=1, dash="3 3"))
        o.append(_f19_rot(cx, cy + 4, -slope, body + "".join(ax)))
        # 重力（下向き）
        if not err:
            o.append(ARR(x0 + 150, 52, x0 + 150, 52 + g * 4.2, c=MUT, lw=1.6, head=7))
            o.append(T(x0 + 150, 46, "重力 g", "middle", 9, MUT, True))
        if acc:
            o.append(ARR(cx - 30, cy + 22, cx + 30, cy + 22, c=GRN, lw=1.8, head=7))
            o.append(T(cx, cy + 36, "本当の加速度 2 m/s²", "middle", 9, GRN, True))
        # 読み
        yy = 206
        if err is None:
            o.append(T(x0 + 4, yy, "読み（前の軸）%s m/s²" % ("+" + _f19_m(fwd, 2) if fwd else "0.00"), "start", 9.5, SIG, True))
            o.append(T(x0 + 4, yy + 16, "読み（上の軸）+%s m/s²" % _f19_m(up, 2), "start", 9.5, SIG, True))
        if slope:
            o.append(T(x0 + 4, yy + 34, "加速していないのに、前へ", "start", 9.5, ALI))
            o.append(T(x0 + 4, yy + 48, "+%s m/s² と読む" % _f19_m(fwd, 2), "start", 9.5, ALI))
        if err:
            # 本当の上（緑の破線）と、誤った向きで回した読み（金）。水平に残る分（赤）。角は見やすいように 20° で描く
            a = 20.0 * _F19_D
            L = 84
            bx, by = x0 + 100, cy - 2
            o.append(W(bx, by, bx, by - L, c=GRN, lw=1.4, dash="4 3"))
            o.append(T(bx - 4, by - L + 4, "本当の上", "end", 9, GRN, True, halo=True))
            hx, hy = bx + L * math.sin(a), by - L * math.cos(a)
            o.append(ARR(bx, by, hx, hy, c=GLD, lw=2, head=8))
            o.append(T(hx + 3, hy + 40, "誤った", "start", 9, GLD, True, halo=True))
            o.append(T(hx + 3, hy + 52, "向きで", "start", 9, GLD, True, halo=True))
            o.append(T(hx + 3, hy + 64, "回した", "start", 9, GLD, True, halo=True))
            o.append(ARR(bx, hy, hx - 1, hy, c=ALI, lw=2.2, head=6))
            o.append(T(bx + 2, hy - 9, "水平に残る", "start", 9, ALI, True, halo=True))
            o.append(T(x0 + 4, yy, "上の軸の +9.8 m/s² を、", "start", 9.5, INK))
            o.append(T(x0 + 4, yy + 16, "1° 誤った向きで回すと", "start", 9.5, INK))
            o.append(T(x0 + 4, yy + 32, "水平に %s m/s² が残る" % _f19_m(g * math.sin(_F19_D), 3), "start", 9.5, ALI, True))
            o.append(T(x0 + 4, yy + 48, "（30 s 積分すると %s m）" % _f19_m(g * math.sin(_F19_D) * 900 / 2, 0), "start", 9.5, ALI, True))
    return SVG(700, 266, o, "加速度センサの読み（青の矢印。重力の加速度 g = 9.8 m/s²）。(d) の角は見やすいように大きく描いた。")


F["e19_tilt"] = _f19_tilt_fig()


def _f19_ins_fig():
    o = []
    def bx(x, y, w, h, t, sub=None, c=LIN, fill=PAN, tc=INK, sz=10.5):
        o.append(BOX(x, y, w, h, t, sub, c=c, fill=fill, tc=tc, sz=sz, ssz=9))
    def ar(x1, y1, x2, y2, lab=None, c=MUT, dy=-6):
        o.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=7))
        if lab:
            o.append(TX((x1 + x2) / 2, y1 + dy, lab, "middle", 9.5, c, True, halo=True))
    # (a) 3 次元
    o.append(T(14, 18, "(a) 3 次元の慣性航法", "start", 11, INK, True))
    bx(14, 34, 112, 38, "ジャイロ", "3 つの軸の角速度", SIG, soft(SIG), SIG)
    bx(14, 100, 112, 38, "加速度センサ", "3 つの軸の読み", SIG, soft(SIG), SIG)
    bx(160, 34, 52, 38, "積分")
    bx(246, 34, 118, 38, "向き", "傾きと方位", GLD, soft(GLD), GLD)
    ar(126, 53, 160, 53)
    ar(212, 53, 246, 53)
    bx(156, 100, 118, 38, "向きで回す", "東・北・上の成分へ")
    ar(126, 119, 156, 119)
    ar(270, 72, 270, 100, None, GLD)
    bx(302, 100, 108, 38, "重力の分を引く", "上の成分から g")
    ar(274, 119, 302, 119)
    bx(452, 100, 48, 38, "積分")
    ar(410, 119, 452, 119, "加速度")
    bx(548, 100, 48, 38, "積分")
    ar(500, 119, 548, 119, "速度", GLD)
    ar(596, 119, 636, 119)
    bx(636, 100, 54, 38, "位置", None, GLD, soft(GLD), GLD)
    o.append(T(400, 64, "積分の初めの値（位置・速度・向き）は、GNSS などで決める", "start", 9.5, PUR, True))
    # (b) 平面のモデル
    yb = 182
    o.append(T(14, yb - 14, "(b) 平面のモデル（車が向いている向きに進むとする）", "start", 11, INK, True))
    bx(14, yb, 112, 38, "ジャイロ", "上下の軸のまわり", SIG, soft(SIG), SIG)
    bx(14, yb + 64, 112, 38, "加速度センサ", "前の向き", SIG, soft(SIG), SIG)
    bx(160, yb, 52, 38, "積分")
    bx(160, yb + 64, 52, 38, "積分")
    ar(126, yb + 19, 160, yb + 19)
    ar(126, yb + 83, 160, yb + 83)
    bx(246, yb, 92, 38, "向き ψ", "北から東へ", GLD, soft(GLD), GLD)
    o.append(RECT(246, yb + 64, 92, 38, 8, soft(GLD), GLD, 1.4))
    o.append(TX(292, yb + 80, "速さ \\dot{p}", "middle", 10.5, GLD, True))
    o.append(T(292, yb + 94, "道に沿って", "middle", 9, MUT))
    ar(212, yb + 19, 246, yb + 19)
    ar(212, yb + 83, 246, yb + 83)
    o.append(RECT(380, yb + 22, 168, 58, 8, PAN, LIN, 1.4))
    o.append(T(464, yb + 42, "向きと速さで進める", "middle", 10.5, INK, True))
    o.append(TX(464, yb + 66, "東へ \\dot{p} sin ψ・北へ \\dot{p} cos ψ", "middle", 10, INK))
    ar(338, yb + 19, 380, yb + 40)
    ar(338, yb + 83, 380, yb + 62)
    bx(580, yb + 32, 52, 38, "積分")
    ar(548, yb + 51, 580, yb + 51, "速度", GLD)
    ar(632, yb + 51, 646, yb + 51)
    o.append(BOX(646, yb + 22, 46, 58, "位置", "東・北", c=GLD, fill=soft(GLD), tc=GLD, sz=10.5, ssz=9))
    return SVG(700, yb + 116, o, "慣性航法の流れ（左から右へ計算する）。青はセンサが測る値、金は計算で求める値。")


F["e19_ins"] = _f19_ins_fig()


# =====================================================================
# 3 節: バイアスが位置の誤差を育てる 3 つの道すじと、時間との関係
# =====================================================================
_F19_CA, _F19_CH, _F19_CT, _F19_CN = ALI, PUR, GLD, TEA     # 加速度のバイアス・向き・傾き・雑音の色（図とデモで同じ）


def _f19_err3_fig():
    o = []
    bg = _F19_BGD * _F19_D
    cols = [("(a) 加速度センサのバイアス", _F19_CA,
             ["加速度の誤差 b_a（一定）", "速度の誤差 b_a t", "位置の誤差 b_a t^2/2"], ["積分", "積分"],
             "進む向きに %s m" % _f19_m(_F19_BA * 900 / 2, 1), "b_a = 0.05 m/s²"),
            ("(b) ジャイロのバイアス（向き）", _F19_CH,
             ["角速度の誤差 b_g", "向きの誤差 b_g t", "横の速度の誤差 \\dot{p} b_g t", "横の位置の誤差 \\dot{p} b_g t^2/2"], ["積分", "× 速さ", "積分"],
             "横に %s m" % _f19_m(_F19_V0 * bg * 900 / 2, 1), "平面のモデル・\\dot{p} = 20 m/s"),
            ("(c) ジャイロのバイアス（傾き）", _F19_CT,
             ["角速度の誤差 b_g", "傾きの誤差 b_g t", "加速度の誤差 g b_g t", "速度の誤差 g b_g t^2/2", "位置の誤差 g b_g t^3/6"], ["積分", "× g", "積分", "積分"],
             "進む向きに %s m" % _f19_m(_F19_G * bg * 27000 / 6, 1), "3 次元・b_g = 0.05 °/s")]
    for k, (ttl, c, chain, ops, val, cond) in enumerate(cols):
        x0 = 10 + k * 232
        o.append(T(x0, 18, ttl, "start", 10.5, INK, True))
        # 小さな絵
        yS = 34
        if k == 0:
            o.append(W(x0 + 8, yS + 44, x0 + 214, yS + 44, c=MUT, lw=2))
            o.append(_f19_car(x0 + 60, yS + 44, GRN, 0.8))
            o.append(_f19_car(x0 + 150, yS + 44, c, 0.8))
            o.append(DARR(x0 + 62, yS + 58, x0 + 150, yS + 58, c=c, lw=1.4))
            o.append(T(x0 + 106, yS + 72, "推定が先へ進む（横から見た図）", "middle", 9, c, True))
            o.append(T(x0 + 60, yS + 18, "本当", "middle", 9, GRN, True))
            o.append(T(x0 + 150, yS + 18, "推定", "middle", 9, c, True))
        elif k == 1:
            o.append(W(x0 + 10, yS + 52, x0 + 214, yS + 52, c=GRN, lw=2))
            pts = [(x0 + 10 + u, yS + 52 - 30 * (u / 204.0) ** 2) for u in range(0, 205, 6)]
            o.append(PL(pts, c=c, lw=2, dash="5 3"))
            o.append(T(x0 + 212, yS + 66, "本当の道", "end", 9, GRN, True))
            o.append(T(x0 + 150, yS + 22, "推定（向きが少しずつ回る）", "middle", 9, c, True))
            o.append(T(x0 + 14, yS + 76, "上から見た図", "start", 9, MUT))
        else:
            gx, gy = x0 + 34, yS + 70
            o.append(W(x0 + 10, gy, x0 + 214, gy, c=MUT, lw=2))
            for j, aa in enumerate((0, 7, 14, 21)):
                a = aa * _F19_D
                L = 50
                xb = gx + 46 * j
                o.append(W(xb, gy, xb + L * math.sin(a), gy - L * math.cos(a), c=GRN if j == 0 else c, lw=1.2 if j == 0 else 1.8, dash="4 3" if j == 0 else None))
            o.append(T(gx - 4, gy - 40, "上", "end", 9, GRN, True))
            o.append(ARR(gx + 40, gy + 10, gx + 150, gy + 10, c=MUT, lw=1.2, head=6))
            o.append(T(gx + 156, gy + 14, "時間", "start", 9, MUT))
            o.append(T(x0 + 214, yS + 4, "見込んだ上が少しずつ傾く", "end", 9, c, True))
            o.append(T(x0 + 14, yS + 92, "横から見た図", "start", 9, MUT))
        # 誤差の連鎖
        y = 132
        for i, txt in enumerate(chain):
            o.append(RECT(x0 + 6, y, 208, 26, 6, soft(c) if i == len(chain) - 1 else PAN, c if i == len(chain) - 1 else LIN, 1.3))
            o.append(TX(x0 + 110, y + 17.5, txt, "middle", 10, c if i == len(chain) - 1 else INK, i == len(chain) - 1))
            if i < len(chain) - 1:
                o.append(ARR(x0 + 110, y + 26, x0 + 110, y + 42, c=MUT, lw=1.4, head=6))
                o.append(T(x0 + 118, y + 38, ops[i], "start", 9, MUT, True))
            y += 42
        o.append(T(x0 + 110, 360, "30 s で " + val, "middle", 10.5, c, True))
        o.append(TX(x0 + 110, 376, cond, "middle", 9, MUT))
    return SVG(700, 388, o, "センサのバイアスが位置の誤差に育つ 3 つの道すじ（例の値。どれも初めの位置・速度・向きは正しく、ほかのバイアスは 0。(c) の角は大きく描いた）。")


F["e19_err3"] = _f19_err3_fig()


def _f19_grow_fig():
    o = []
    bg = _F19_BGD * _F19_D
    p = Plot(80, 26, 380, 286, (1, 100), (0.01, 1000), xlog=True, ylog=True)
    o.append(p.axes(xl="慣性航法だけで進めた時間 t [s]", yl="位置の誤差 [m]", xt=[1, 2, 5, 10, 20, 50, 100], yt=[0.01, 0.1, 1, 10, 100, 1000],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    ts = [10 ** (k / 40.0) for k in range(0, 81)]
    fa = lambda t: _F19_BA * t * t / 2
    fh = lambda t: _F19_V0 * bg * t * t / 2
    ft = lambda t: _F19_G * bg * t ** 3 / 6
    fn = lambda t: _F19_SA * math.sqrt(_F19_TS) * t ** 1.5 / math.sqrt(3)
    for f, c in ((fa, _F19_CA), (fh, _F19_CH), (ft, _F19_CT), (fn, _F19_CN)):
        o.append(p.clip([(t, f(t)) for t in ts], c=c, lw=2))
    # 数値で積分した値（点）。目盛の範囲の外は描かない
    marks = [1, 2, 5, 10, 20, 50, 100]
    def mk(tt, val, c):
        if 0.01 <= val <= 1000:
            o.append(CIRC(p.X(tt), p.Y(val), 3.6, c=c, lw=1.6, fill=SCR))
    ra = _f19_dr(noise=0.0, bgd=0.0, Tend=100.0)
    rh = _f19_dr(noise=0.0, ba=0.0, Tend=100.0)
    for tt in marks:
        i = int(round(tt * 10))
        mk(tt, abs(ra["al"][i]), _F19_CA)
        mk(tt, abs(rh["cr"][i]), _F19_CH)
    for tt, x in _f19_tilt_ins():
        mk(tt, abs(x), _F19_CT)
    # 雑音: 400 回の 2 乗平均の平方根（数値で）
    rg = _f19_np.random.default_rng(19)
    n = rg.standard_normal((400, 10000)) * _F19_SA
    v = _f19_np.cumsum(n, axis=1) * _F19_TS
    x = _f19_np.cumsum(v, axis=1) * _F19_TS
    for tt in marks:
        i = int(round(tt / _F19_TS)) - 1
        mk(tt, float(_f19_np.sqrt(_f19_np.mean(x[:, i] ** 2))), _F19_CN)
    # ラベル
    o.append(TX(p.X(60), p.Y(fa(60)) - 10, "b_a t^2/2", "end", 10, _F19_CA, True, halo=True))
    o.append(TX(p.X(55), p.Y(fh(55)) + 20, "\\dot{p} b_g t^2/2", "start", 10, _F19_CH, True, halo=True))
    o.append(TX(p.X(26), p.Y(ft(26)) - 12, "g b_g t^3/6", "end", 10, _F19_CT, True, halo=True))
    o.append(TX(p.X(40), p.Y(fn(40)) + 18, "σ_a√T_s t^{1.5}/√3", "start", 10, _F19_CN, True, halo=True))
    tc = 3 * _F19_BA / (_F19_G * bg)
    o.append(W(p.X(tc), p.Y(fa(tc)), p.X(tc), p.Y(0.01), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(tc) + 3, p.Y(0.02), "%.1f s" % tc, "start", 9, MUT, True, halo=True))
    # 右: 値の表
    x0 = 486
    o.append(T(x0, 40, "例の値で", "start", 10.5, INK, True))
    hd = ["", "10 s", "30 s", "60 s"]
    for j, h in enumerate(hd):
        o.append(T(x0 + 92 + 38 * j - 38, 62, h, "end", 9.5, MUT, True))
    rows = [("加速度（b_a）", fa, _F19_CA), ("向き（b_g）", fh, _F19_CH), ("傾き（b_g）", ft, _F19_CT), ("雑音（1σ）", fn, _F19_CN)]
    for i, (nm, f, c) in enumerate(rows):
        yy = 84 + i * 22
        o.append(TX(x0, yy, nm, "start", 9.5, c, True))
        for j, tt in enumerate((10, 30, 60)):
            val = f(tt)
            o.append(T(x0 + 92 + 38 * j, yy, ("%.2f" % val) if val < 1 else ("%.1f" % val if val < 100 else "%.0f" % val), "end", 9.5, INK))
    o.append(W(x0, 68, x0 + 206, 68, c=LIN, lw=1))
    o.append(T(x0, 186, "単位は m", "start", 9, MUT))
    o.append(T(x0, 214, "線: 式の値", "start", 9.5, INK))
    o.append(T(x0, 232, "○: 数値で積分した値", "start", 9.5, INK))
    o.append(T(x0, 250, "（雑音は 400 回の 2 乗平均の", "start", 9, MUT))
    o.append(T(x0, 264, "平方根）", "start", 9, MUT))
    return SVG(700, 362, o, "慣性航法だけで進めたときの位置の誤差（両対数の目盛）。加速度センサのバイアス 0.05 m/s²、ジャイロのバイアス 0.05 °/s、速さ 20 m/s、加速度センサの雑音 0.02 m/s²（100 Hz の 1 サンプルごと）。")


F["e19_grow"] = _f19_grow_fig()


# =====================================================================
# 4 節: 予測は IMU、更新は GNSS
# =====================================================================
def _f19_kfmap_fig():
    o = []
    o.append(T(14, 18, "(a) 計算の流れ（1 次元の例）", "start", 11, INK, True))
    # IMU
    o.append(BOX(14, 40, 104, 44, "IMU", "100 Hz", c=SIG, fill=soft(SIG), tc=SIG, sz=11, ssz=9.5))
    # 予測
    o.append(RECT(214, 30, 190, 66, 8, PAN, LIN, 1.4))
    o.append(T(309, 48, "予測（時間更新）", "middle", 10.5, INK, True))
    o.append(TX(309, 68, "x̂^{−} = A_d x̂ + B_d u", "middle", 10, INK))
    o.append(TX(309, 86, "Σ^{−} = A_d Σ A_d^T + W", "middle", 10, INK))
    o.append(ARR(118, 62, 214, 62, c=SIG, lw=1.8, head=8))
    o.append(TX(166, 54, "入力 u[k]", "middle", 9.5, SIG, True, halo=True))
    o.append(T(166, 80, "加速度の読み", "middle", 9, SIG))
    # 更新
    o.append(RECT(462, 30, 196, 66, 8, PAN, LIN, 1.4))
    o.append(T(560, 48, "更新（観測更新）", "middle", 10.5, INK, True))
    o.append(TX(560, 68, "x̂ = x̂^{−} + H_k(y − Cx̂^{−})", "middle", 10, INK))
    o.append(TX(560, 86, "Σ = (I − H_kC)Σ^{−}", "middle", 10, INK))
    o.append(ARR(404, 62, 462, 62, c=GLD, lw=1.8, head=8))
    o.append(TX(433, 54, "x̂^{−}・Σ^{−}", "middle", 9.5, GLD, True, halo=True))
    # GNSS
    o.append(BOX(500, 128, 120, 40, "GNSS", "1 Hz・位置", c=PUR, fill=soft(PUR), tc=PUR, sz=11, ssz=9.5))
    o.append(ARR(560, 128, 560, 96, c=PUR, lw=1.8, head=8))
    o.append(TX(566, 116, "観測 y[k]", "start", 9.5, PUR, True, halo=True))
    # 出力と、次の周期へ
    o.append(ARR(658, 62, 692, 62, c=GLD, lw=1.8, head=7))
    o.append(T(684, 48, "x̂", "middle", 10, GLD, True))
    o.append(W(676, 62, 676, 186, 309, 186, c=GLD, lw=1.3, dash="5 3"))
    o.append(ARR(309, 186, 309, 98, c=GLD, lw=1.3, head=7, dash="5 3"))
    o.append(T(318, 150, "次の周期の予測へ", "start", 9.5, GLD, True))
    o.append(T(318, 166, "（GNSS が来ない周期は x̂ = x̂⁻）", "start", 9, MUT))
    o.append(T(14, 112, "状態 x = (p, ṗ, b_a)ᵀ", "start", 10, INK, True))
    o.append(TX(14, 112, "", "start", 10, INK))
    # (b) 時間の軸
    yb = 214
    o.append(T(14, yb, "(b) 時間の軸の上の繰り返し", "start", 11, INK, True))
    X = lambda t: 70 + t * 290.0
    ya = yb + 44
    o.append(W(X(0) - 6, ya, X(2.1) + 6, ya, c=MUT, lw=1.2))
    o.append(PATH("".join("M%.2f,%gv-8" % (X(0.01 * k), ya) for k in range(211)), c=SIG, lw=0.7))
    for k, tt in enumerate((0, 1, 2)):
        o.append(PL([(X(tt), ya - 10), (X(tt) - 6, ya - 22), (X(tt) + 6, ya - 22)], c=PUR, lw=1.2, fill=soft(PUR)))
        o.append(T(X(tt), ya + 15, "%d s" % tt, "middle", 9.5, MUT))
    o.append(T(X(0.5), ya - 16, "予測を 100 回（10 ms ごと）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(X(1.5), ya - 16, "予測を 100 回", "middle", 9.5, SIG, True, halo=True))
    o.append(T(X(2.06), ya - 28, "更新（1 s ごと）", "end", 9.5, PUR, True))
    return SVG(700, 284, o, "IMU の値で予測し、GNSS の位置で更新するカルマンフィルタ（制御工学シリーズ 20 章 5 節と同じ式。1 次元の例は本文）。")


F["e19_kfmap"] = _f19_kfmap_fig()
