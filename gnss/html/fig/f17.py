# -*- coding: utf-8 -*-
# 17 章 搬送波位相と RTK — センチメートル級の仕組み
# 図の数値は、この中の計算で求める（重いシミュレーションの結果だけは _F17_RES に置いた。F17_RECOMPUTE=1 で作り直せる）。
import math
import os as _f17_os
import json as _f17_json
import numpy as _f17_np

_F17_C = 299792458.0
_F17_F1 = 1575.42e6
_F17_LAM = _F17_C / _F17_F1                  # L1 の波長 19.03 cm
_F17_CHIP = _F17_C / 1.023e6                 # 1 チップ 293 m
_F17_SR, _F17_SP = 0.3, 0.003                # 代表値: 擬似距離 0.3 m・搬送波位相 3 mm（1 つの受信機・1 つの衛星）
_F17_D2R = math.pi / 180


def _f17_fmt(v, d=2):
    s = ("%." + str(d) + "f") % v
    return s.replace("-", "−")


def _f17_g3(v):
    """3 桁ごとに空白を入れた整数。"""
    s = "%d" % round(abs(v))
    out = ""
    while len(s) > 3:
        out = " " + s[-3:] + out
        s = s[:-3]
    return ("−" if v < 0 else "") + s + out


def _f17_sat(x, y, c=SIG, s=1.0):
    """衛星の印（1 章・7 章・16 章と同じ見た目）。"""
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f17_rx(x, y, c=GRN):
    """受信機の印（地面に置いたアンテナ）。(x, y) はアンテナの頭。"""
    return W(x - 6, y + 6, x + 6, y + 6, c=c, lw=1.6) + W(x, y + 6, x, y, c=c, lw=1.4) + D(x, y - 1, c, 3.4)


def _f17_base(x, y, c=PUR):
    """基準局の印（三脚の上のアンテナ。16 章と同じ見た目）。(x, y) はアンテナの頭。"""
    return (W(x - 8, y + 16, x, y + 2, x + 8, y + 16, c=c, lw=1.4) + W(x, y + 2, x, y + 16, c=c, lw=1.2)
            + RECT(x - 7, y - 3, 14, 5, 1.5, soft(c), c, 1.2) + D(x, y - 5, c, 2.6))


def _f17_Q(x):
    """標準正規分布の上側確率 Q(x)（3 章 6 節）。"""
    return 0.5 * math.erfc(x / math.sqrt(2))


# =====================================================================
# 4 節の小さな例（線路の上の移動局）と、整数の最小二乗（LAMBDA の変換と探索。RTKLIB の lambda.c と同じ手順）
# =====================================================================
_F17_TOYSAT = {"G9": (74.9, 186.6), "G6": (51.5, 45.1), "G22": (45.6, 234.9)}   # 6 章・7 章の東京の衛星（時刻 0）の仰角・方位角


def _f17_lvec(el, az):
    e, a = el * _F17_D2R, az * _F17_D2R
    return _f17_np.array([math.cos(e) * math.sin(a), math.cos(e) * math.cos(a), math.sin(e)])


def _f17_toyg():
    """移動局を東へ e 動かしたときの、二重差の距離の変化 g_j e の係数 g_j = −(l_j − l_9) の東の成分（j = G6・G22）。"""
    l9 = _f17_lvec(*_F17_TOYSAT["G9"])
    return _f17_np.array([-(_f17_lvec(*_F17_TOYSAT[k])[0] - l9[0]) for k in ("G6", "G22")])


def _f17_toyQ(sr=_F17_SR, sp=_F17_SP, K=1):
    """K エポック（移動局は止まっている、雑音はエポックごとに独立）の二重差の擬似距離と搬送波位相から、
    最小二乗で (e, N6, N22) を解いたときの共分散（3×3）。"""
    g = _f17_toyg()
    Qs = _f17_np.array([[2.0, 1.0], [1.0, 2.0]]) * 2.0         # 二重差の雑音の共分散 / σ²（受信機 2 つ・基準の衛星を共有）
    Wc = _f17_np.linalg.inv(Qs * sr ** 2); Wp = _f17_np.linalg.inv(Qs * sp ** 2)
    Hc = _f17_np.c_[g, _f17_np.zeros((2, 2))]
    Hp = _f17_np.c_[g, _F17_LAM * _f17_np.eye(2)]
    return _f17_np.linalg.inv(K * (Hc.T @ Wc @ Hc + Hp.T @ Wp @ Hp))


def _f17_LD(Q):
    n = Q.shape[0]; A = Q.copy().astype(float)
    L = _f17_np.zeros((n, n)); Dd = _f17_np.zeros(n)
    for i in range(n - 1, -1, -1):
        Dd[i] = A[i, i]; a = math.sqrt(Dd[i])
        for j in range(i + 1):
            L[i, j] = A[i, j] / a
        for j in range(i):
            for k in range(j + 1):
                A[j, k] -= L[i, k] * L[i, j]
        for j in range(i + 1):
            L[i, j] /= L[i, i]
    return L, Dd


def _f17_reduction(L, Dd):
    n = L.shape[0]; Z = _f17_np.eye(n); j = n - 2; k = n - 2
    while j >= 0:
        if j <= k:
            for i in range(j + 1, n):
                mu = int(round(L[i, j]))
                if mu:
                    L[i:, j] -= mu * L[i:, i]; Z[:, j] -= mu * Z[:, i]
        dl = Dd[j] + L[j + 1, j] ** 2 * Dd[j + 1]
        if dl + 1e-6 < Dd[j + 1]:
            eta = Dd[j] / dl; lam = Dd[j + 1] * L[j + 1, j] / dl
            Dd[j] = eta * Dd[j + 1]; Dd[j + 1] = dl
            for kk in range(j):
                a0, a1 = L[j, kk], L[j + 1, kk]
                L[j, kk] = -L[j + 1, j] * a0 + a1; L[j + 1, kk] = eta * a0 + lam * a1
            L[j + 1, j] = lam
            for kk in range(j + 2, n):
                L[kk, j], L[kk, j + 1] = L[kk, j + 1], L[kk, j]
            Z[:, [j, j + 1]] = Z[:, [j + 1, j]]
            k = j; j = n - 2
        else:
            j -= 1
    return Z


def _f17_search(L, Dd, zs, m=2):
    n = L.shape[0]
    S = _f17_np.zeros((n, n)); dist = _f17_np.zeros(n); zb = _f17_np.zeros(n); z = _f17_np.zeros(n); step = _f17_np.zeros(n)
    zn = _f17_np.zeros((n, m)); s = _f17_np.zeros(m); nn = 0; imax = 0; maxdist = 1e99
    sgn = lambda v: 1.0 if v >= 0 else -1.0
    k = n - 1; zb[k] = zs[k]; z[k] = round(zb[k]); y = zb[k] - z[k]; step[k] = sgn(y)
    for _ in range(200000):
        nd = dist[k] + y * y / Dd[k]
        if nd < maxdist:
            if k != 0:
                k -= 1; dist[k] = nd
                for i in range(k + 1):
                    S[k, i] = S[k + 1, i] + (z[k + 1] - zb[k + 1]) * L[k + 1, i]
                zb[k] = zs[k] + S[k, k]; z[k] = round(zb[k]); y = zb[k] - z[k]; step[k] = sgn(y)
            else:
                if nn < m:
                    if nn == 0 or nd > s[imax]:
                        imax = nn
                    zn[:, nn] = z; s[nn] = nd; nn += 1
                else:
                    if nd < s[imax]:
                        zn[:, imax] = z; s[imax] = nd; imax = int(_f17_np.argmax(s))
                    maxdist = s[imax]
                z[0] += step[0]; y = zb[0] - z[0]; step[0] = -step[0] - sgn(step[0])
        else:
            if k == n - 1:
                break
            k += 1; z[k] += step[k]; y = zb[k] - z[k]; step[k] = -step[k] - sgn(step[k])
    o = _f17_np.argsort(s[:nn])
    return zn[:, o], s[o]


def _f17_ils(a, Q, m=2):
    """整数の最小二乗: 候補を良い順に m 個（列）と、その J = (a − z)^T Q^-1 (a − z)。"""
    L, Dd = _f17_LD(Q)
    Z = _f17_reduction(L, Dd)
    E, s = _f17_search(L, Dd, Z.T @ a, m)
    return _f17_np.round(_f17_np.linalg.solve(Z.T, E)), s


def _f17_clip(P, n, c):
    """凸多角形 P を半平面 n·p ≤ c で切る。"""
    out = []
    for i in range(len(P)):
        A, B = P[i], P[(i + 1) % len(P)]
        da = n[0] * A[0] + n[1] * A[1] - c; db = n[0] * B[0] + n[1] * B[1] - c
        if da <= 0:
            out.append(A)
        if (da < 0 < db) or (db < 0 < da):
            t = da / (da - db)
            out.append((A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])))
    return out


def _f17_pin(P, ns=3000):
    """原点を含む凸多角形 P の中に、2 次元の標準正規分布の点が入る確率（原点から見た角度で積分）。"""
    tot = 0.0
    for i in range(len(P)):
        A = _f17_np.array(P[i]); B = _f17_np.array(P[(i + 1) % len(P)])
        t1 = math.atan2(A[1], A[0]); dt = math.atan2(B[1], B[0]) - t1
        while dt <= -math.pi: dt += 2 * math.pi
        while dt > math.pi: dt -= 2 * math.pi
        e = B - A; nr = _f17_np.array([e[1], -e[0]]) / math.hypot(e[0], e[1]); p = float(nr @ A)
        if p < 0: nr, p = -nr, -p
        th0 = math.atan2(nr[1], nr[0]); ts = t1 + dt * (_f17_np.arange(ns) + 0.5) / ns
        rr = p / _f17_np.cos(ts - th0)
        tot += float(_f17_np.sum(1 - _f17_np.exp(-rr ** 2 / 2))) * dt / ns
    return tot / (2 * math.pi)


def _f17_regions(Qa, M=None):
    """2 つの整数値バイアスの、丸めの領域（単位の正方形）と、整数の最小二乗で 0 が選ばれる領域（ボロノイの領域）。
    M を与えると、座標を z = M a に変えた後の領域を返す。返り値 (正方形, 6 角形, 丸めの確率, 整数の最小二乗の確率)。"""
    Qa = _f17_np.asarray(Qa)
    if M is not None:
        Qa = M @ Qa @ M.T
    R = _f17_np.linalg.cholesky(Qa); Ri = _f17_np.linalg.inv(R)
    L, Dd = _f17_LD(Qa); Z = _f17_reduction(L.copy(), Dd.copy())
    Zi = _f17_np.round(_f17_np.linalg.inv(Z.T))
    big = 1e4
    P = [(-big, -big), (big, -big), (big, big), (-big, big)]
    for i in range(-3, 4):
        for j in range(-3, 4):
            if i == 0 and j == 0:
                continue
            v = Ri @ (Zi @ _f17_np.array([i, j], float))
            P = _f17_clip(P, v, float(v @ v) / 2)
    sq = [Ri @ _f17_np.array(v) for v in ((-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5))]
    hexa = [tuple(R @ _f17_np.array(p)) for p in P]
    return [(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)], hexa, _f17_pin([tuple(q) for q in sq]), _f17_pin(P)


def _f17_toysamples(n=300, K=1, seed=17, sr=_F17_SR, sp=_F17_SP):
    """(e, N6, N22) のフロート解の誤差の標本（本当の値からの差）。"""
    Qt = _f17_toyQ(sr, sp, K)
    rng = _f17_np.random.default_rng(seed)
    return (_f17_np.linalg.cholesky(Qt) @ rng.normal(size=(3, n))).T, Qt


# =====================================================================
# 1 節: 符号の目盛と搬送波の目盛、PLL が数えるもの
# =====================================================================
def _f17_ruler_fig():
    o = []
    o.append(T(14, 18, "(a) 1 チップの目盛と、搬送波の目盛（L1）", "start", 11.5, INK, True))
    x0, x1 = 40.0, 660.0
    # 1 チップの帯
    o.append(RECT(x0, 34, x1 - x0, 16, 3, SSOFT, SIG, 1.2))
    o.append(T((x0 + x1) / 2, 46, "1 チップ = 977.5 ns = 293.05 m（符号の目盛）", "middle", 10, SIG, True))
    # 拡大する部分（2 m 分 = 帯の 0.68 %。見えるように少し太く描く）
    zx = x0 + 6
    o.append(RECT(zx, 31, 5, 22, 1, GLD, GLD, 1.0))
    o.append(W(zx, 53, x0, 78, c=GLD, lw=1, dash="3 3"))
    o.append(W(zx + 5, 53, x1, 78, c=GLD, lw=1, dash="3 3"))
    o.append(T(zx + 10, 64, "この 1.9 m を拡大", "start", 9.5, GLD, True, halo=True))
    # 搬送波 10 周期
    yc, A = 112.0, 22.0
    ncy = 10
    pts = []
    for k in range(0, 801):
        t = k / 800.0
        pts.append((x0 + t * (x1 - x0), yc - A * math.cos(2 * math.pi * ncy * t)))
    o.append(RECT(x0, 80, x1 - x0, 64, 4, SCR, LIN, 1))
    o.append(PL(pts, c=SIG, lw=1.6))
    for k in range(ncy + 1):
        xx = x0 + (x1 - x0) * k / ncy
        o.append(W(xx, 140, xx, 148, c=INK, lw=1.2))
        o.append(T(xx, 160, "%d" % k, "middle", 9.5, INK))
    o.append(DIM(x0, 172, x0 + (x1 - x0) / ncy, 172, None, c=MUT))
    o.append(T(x0 + (x1 - x0) / ncy / 2, 186, "λ = 19.03 cm", "middle", 9.5, MUT, True))
    o.append(T(x0 + (x1 - x0) / ncy * 1.2, 176, "1 チップの中に 1540 周期（10 周期だけ描いた）", "start", 9.5, MUT))
    # (b) NCO と数えた周期
    yb = 214
    o.append(T(14, yb, "(b) PLL が測るもの: 遅れの端数（NCO）と、数えた周期", "start", 11.5, INK, True))
    cx, cy, R = 92.0, yb + 74, 44.0
    frac = 0.37
    o.append(CIRC(cx, cy, R, c=MUT, lw=1.3, fill=SCR))
    for q in range(4):
        a = q * math.pi / 2
        o.append(W(cx + (R - 5) * math.sin(a), cy - (R - 5) * math.cos(a), cx + R * math.sin(a), cy - R * math.cos(a), c=MUT, lw=1))
    o.append(T(cx, cy - R - 5, "0", "middle", 9.5, MUT))
    o.append(T(cx + R + 4, cy + 3.5, "0.25", "start", 9.5, MUT))
    o.append(T(cx, cy + R + 13, "0.5", "middle", 9.5, MUT))
    o.append(T(cx - R - 4, cy + 3.5, "0.75", "end", 9.5, MUT))
    a = 2 * math.pi * frac
    o.append(PATH("M%g,%g L%g,%g A%g,%g 0 0,1 %g,%g Z" % (cx, cy, cx, cy - R + 6, R - 6, R - 6, cx + (R - 6) * math.sin(a), cy - (R - 6) * math.cos(a)), c="none", lw=0, fill=GOSOFT))
    o.append(ARR(cx, cy, cx + (R - 8) * math.sin(a), cy - (R - 8) * math.cos(a), c=GLD, lw=2.2))
    o.append(T(cx, cy + R + 30, "端数 0.37 周期", "middle", 10, GLD, True))
    # 数える箱
    bx = 168
    o.append(RECT(bx, yb + 40, 120, 34, 5, PSOFT, PUR, 1.2))
    o.append(T(bx + 60, yb + 52, "数えた周期", "middle", 9.5, PUR, True))
    o.append(T(bx + 60, yb + 68, "1 247", "middle", 12, INK, True, True))
    o.append(T(bx, yb + 96, "端数が 1 を超えて 0 に戻るたびに +1", "start", 9.5, MUT))
    o.append(TX(bx, yb + 116, "φ = 1 247 + 0.37 = 1 247.37 周期", "start", 10, INK, True))
    o.append(TX(bx, yb + 134, "Φ = λφ = 237.37 m", "start", 10, INK, True))
    # (c) 距離が延びると φ が増える
    p = Plot(388, yb + 26, 284, 110, (0, 1.0), (0, 1.1))
    o.append(T(330, yb, "(c) 衛星から 1 m/s で遠ざかるとき", "start", 11.5, INK, True))
    o.append(p.axes(xl="時間 t [s]", yl="長さ [m]", xt=[0, 0.25, 0.5, 0.75, 1.0], yt=[0, 0.5, 1.0], xfmt=lambda v: ("%g" % v), sz=9.5))
    v = 1.0
    ts = _f17_np.linspace(0, 1.0, 801)
    dist = v * ts
    cnt = _f17_np.floor(dist / _F17_LAM) * _F17_LAM
    fr = dist - cnt
    o.append(p.line([(t, d) for t, d in zip(ts, dist)], c=INK, lw=3.0))
    o.append(p.steps([(t, c) for t, c in zip(ts[::4], cnt[::4])], c=PUR, lw=1.6))
    o.append(p.line([(t, f) for t, f in zip(ts, fr)], c=GLD, lw=1.4))
    o.append(LEGL(330, p.y + p.h + 50, [(INK, None, "Φ − Φ(0) = 距離の変化"), (PUR, None, "数えた周期 × λ"), (GLD, None, "端数 × λ")], 9.5, 10))
    return SVG(700, yb + 202, o, "搬送波位相の目盛（L1）。(b) の数は例の値。(c) は、衛星を止めたまま、受信機が 1 m/s で遠ざかる場合。")


F["e17_ruler"] = _f17_ruler_fig()


# =====================================================================
# 1 節: マルチパスの誤差（矢印の和）と、符号との比べ
# =====================================================================
def _f17_noise_fig():
    o = []
    o.append(T(14, 18, "(a) 直接波と反射波の和の角度", "start", 11.5, INK, True))
    ox, oy, Lp = 24.0, 128.0, 140.0
    g = 0.5
    tipx = ox + Lp
    o.append(CIRC(tipx, oy, g * Lp, c=FNT, lw=1.1, dash="4 3"))
    o.append(ARR(ox, oy, tipx, oy, c=SIG, lw=2.0))
    o.append(T(ox + 6, oy + 16, "直接波（長さ 1）", "start", 9.5, SIG, True, halo=True))
    # 接するときの和
    dm = math.asin(g)
    tx, ty = ox + Lp * math.cos(dm) * math.cos(dm), oy - Lp * math.cos(dm) * math.sin(dm)
    o.append(ARR(tipx, oy, tx, ty, c=ALI, lw=1.8))
    o.append(ARR(ox, oy, tx, ty, c=GLD, lw=2.0))
    o.append(T(tipx + 8, oy - 40, "反射波", "start", 9.5, ALI, True, halo=True))
    o.append(T(tipx + 8, oy - 27, "（長さ γ = 0.5）", "start", 9.5, ALI, False, halo=True))
    o.append(T(tx - 6, ty - 10, "和（PLL が合わせる）", "end", 9.5, GLD, True, halo=True))
    # 直角の印
    ux, uy = (tx - ox) / math.hypot(tx - ox, ty - oy), (ty - oy) / math.hypot(tx - ox, ty - oy)
    vx, vy = (tipx - tx), (oy - ty)
    vl = math.hypot(vx, vy); vx, vy = vx / vl, vy / vl
    s = 8
    o.append(W(tx - ux * s, ty - uy * s, tx - ux * s + vx * s, ty - uy * s + vy * s, tx + vx * s, ty + vy * s, c=MUT, lw=1))
    # 角度の弧
    ra = 40
    o.append(PATH("M%g,%g A%g,%g 0 0,0 %g,%g" % (ox + ra, oy, ra, ra, ox + ra * math.cos(dm), oy - ra * math.sin(dm)), c=GLD, lw=1.4))
    o.append(TX(ox + ra + 5, oy - 6, "δ_{max}", "start", 10, GLD, True, halo=True))
    o.append(TX(14, oy + 84, "ψ_M が変わると、反射波の矢印の先は破線の円の", "start", 9.5, MUT))
    o.append(T(14, oy + 98, "上を回る。和が円に接するとき角度が最大で", "start", 9.5, MUT))
    o.append(TX(14, oy + 116, "sin δ_{max} = γ（γ < 1）", "start", 10, INK, True))
    # (b) 誤差と反射波の位相
    p = Plot(306, 46, 210, 150, (0, 360), (-5, 5))
    o.append(T(254, 18, "(b) 搬送波位相の誤差と反射波の位相", "start", 11.5, INK, True))
    o.append(p.axes(xl="反射波の位相の差 ψ_M [°]", yl="誤差 [cm]", xt=[0, 90, 180, 270, 360], yt=[-4, -2, 0, 2, 4]))
    lam4 = _F17_LAM / 4 * 100
    o.append(W(p.x, p.Y(lam4), p.x + p.w, p.Y(lam4), c=ALI, lw=1, dash="5 3"))
    o.append(W(p.x, p.Y(-lam4), p.x + p.w, p.Y(-lam4), c=ALI, lw=1, dash="5 3"))
    o.append(T(p.x + p.w - 3, p.Y(lam4) - 4, "上限 λ/4 = 4.76 cm", "end", 9.5, ALI, True, halo=True))
    cols = {0.3: TEA, 0.5: GLD, 0.8: PUR}
    for gg in (0.3, 0.5, 0.8):
        ps = _f17_np.linspace(0, 2 * math.pi, 361)
        e = _f17_np.arctan2(gg * _f17_np.sin(ps), 1 + gg * _f17_np.cos(ps)) * _F17_LAM / (2 * math.pi) * 100
        o.append(p.line([(math.degrees(a), v) for a, v in zip(ps, e)], c=cols[gg], lw=1.8))
    o.append(LEGL(p.x - 6, p.y + p.h + 48, [(TEA, None, "γ = 0.3"), (GLD, None, "γ = 0.5"), (PUR, None, "γ = 0.8")], 9.5, 10))
    # (c) 符号と搬送波の比べ（対数）
    o.append(T(14, 286, "(c) 符号の擬似距離と搬送波位相の比べ（対数の目盛）", "start", 11.5, INK, True))
    q = Plot(250, 302, 420, 150, (1e-4, 1e3), (0, 4), xlog=True)
    rows = [("目盛（1 チップ・1 周期）", _F17_CHIP, _F17_LAM, "293 m", "19.0 cm"),
            ("熱雑音（45 dB-Hz。5 章の式）", 1.202, 0.000665, "1.20 m", "0.67 mm"),
            ("マルチパス（γ = 0.5 の最大）", 67.9, 0.0159, "67.9 m", "1.59 cm"),
            ("代表値（マルチパスを含む）", 0.3, 0.003, "0.3 m", "3 mm")]
    for v in (1e-3, 1e-2, 1e-1, 1, 10, 100, 1000):
        o.append(W(q.X(v), q.y, q.X(v), q.y + q.h, c=GRD, lw=1))
    labs = {1e-3: "1 mm", 1e-2: "1 cm", 1e-1: "10 cm", 1: "1 m", 10: "10 m", 100: "100 m", 1000: "1 km"}
    for v, s_ in labs.items():
        o.append(T(q.X(v), q.y + q.h + 15, s_, "middle", 9.5, MUT))
    o.append(W(q.x, q.y + q.h, q.x + q.w, q.y + q.h, c=MUT, lw=1.2))
    for k, (lab, vc, vp, sc, sp_) in enumerate(rows):
        yy = q.y + 12 + k * 36
        o.append(T(q.x - 8, yy + 12, lab, "end", 10, INK, True))
        o.append(RECT(q.x, yy, q.X(vc) - q.x, 11, 2, SSOFT, SIG, 1.1))
        o.append(T(q.X(vc) + 4, yy + 9.5, sc, "start", 9.5, SIG, True))
        o.append(RECT(q.x, yy + 13, q.X(vp) - q.x, 11, 2, GSOFT, GRN, 1.1))
        o.append(T(q.X(vp) + 4, yy + 22.5, sp_, "start", 9.5, GRN, True))
    o.append(LEGEND(250, q.y + q.h + 36, [(SIG, "符号の擬似距離"), (GRN, "搬送波位相")], 10, 18))
    return SVG(700, q.y + q.h + 46, o, "搬送波位相の誤差（L1）。熱雑音は DLL（帯域 1 Hz・E と L の間隔 1 チップ）と PLL（帯域 15 Hz）の式の値。マルチパスの符号の値は、7 章 3 節の例（余分の道のり 100 m）の最大。")


F["e17_noise"] = _f17_noise_fig()


# =====================================================================
# 2 節: ものさしの 0 が分からない（整数値バイアス）
# =====================================================================
_F17_R22 = 21627.0e3          # G22 までの距離の例 [m]（時刻 0、6 章・7 章の配置）


def _f17_ambig_fig():
    o = []
    o.append(T(14, 18, "(a) 受信機のまわりの目盛と、2 通りの数え方", "start", 11.5, INK, True))
    x0, dx = 200.0, 50.0
    ytk = 70
    o.append(ARR(320, 40, 210, 40, c=SIG, lw=1.3, head=6))
    o.append(_f17_sat(196, 40, SIG, 0.8))
    o.append(T(326, 44, "衛星の向き（21 627 km 先）", "start", 9.5, SIG, True))
    ntrue0 = int(_F17_R22 / _F17_LAM) - 7      # 左端の目盛の、衛星から数えた周期の数
    o.append(W(x0 - 16, ytk, x0 + 9 * dx + 16, ytk, c=MUT, lw=1.2))
    for k in range(10):
        xx = x0 + k * dx
        o.append(W(xx, ytk - 6, xx, ytk + 6, c=INK, lw=1.2))
        o.append(T(xx, ytk + 20, "…%03d" % ((ntrue0 + k) % 1000), "middle", 9.5, MUT, False, True))
        o.append(T(xx, ytk + 37, ("%d" % (k - 3)).replace("-", "−"), "middle", 10, PUR, True))
    o.append(T(14, ytk + 13, "衛星から数えた番号", "start", 9.5, MUT, True))
    o.append(T(14, ytk + 25, "（%s…。受信機は知らない）" % _f17_g3(ntrue0 // 1000 * 1000)[:-3], "start", 9, MUT))
    o.append(T(14, ytk + 41, "受信機が数えた番号", "start", 9.5, PUR, True))
    frac = 0.37
    xr = x0 + (7 + frac) * dx
    o.append(_f17_rx(xr, ytk - 18, GRN))
    o.append(T(xr + 9, ytk - 22, "受信機", "start", 9.5, GRN, True, halo=True))
    o.append(DIM(x0 + 7 * dx, ytk - 34, xr, ytk - 34, None, c=GLD))
    o.append(T(x0 + 7 * dx - 4, ytk - 30, "端数 0.37", "end", 9.5, GLD, True, halo=True))
    o.append(T(14, ytk + 66, "2 つの番号の差 = 整数値バイアス N = −%s 周期（追尾が続く間は一定。受信機には分からない）" % _f17_g3(ntrue0 + 3), "start", 10, INK, True))
    # (b) 擬似距離で絞っても候補が残る
    yb = 170
    o.append(T(14, yb, "(b) 擬似距離で絞った後の候補", "start", 11.5, INK, True))
    p = Plot(40, yb + 30, 300, 50, (-1.4, 1.4), (0, 1))
    rho = 0.17
    o.append(RECT(p.X(rho - 0.9), p.y, p.X(rho + 0.9) - p.X(rho - 0.9), p.h, 2, SSOFT, "none", 0))
    o.append(W(p.X(rho), p.y - 4, p.X(rho), p.y + p.h, c=SIG, lw=1.6))
    o.append(T(p.X(rho), p.y - 8, "擬似距離", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(rho + 0.9) + 2, p.y + 11, "±3σ（±0.9 m）", "start", 9.5, SIG, False, halo=True))
    o.append(W(p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    nin = 0
    for k in range(-8, 9):
        v = k * _F17_LAM
        if v < -1.4 or v > 1.4:
            continue
        inside = abs(v - rho) <= 0.9
        nin += inside
        c = GRN if k == 0 else (GLD if inside else FNT)
        o.append(W(p.X(v), p.y + p.h - (26 if k == 0 else 18), p.X(v), p.y + p.h, c=c, lw=2.4 if k == 0 else 1.6))
        o.append(D(p.X(v), p.y + p.h - (26 if k == 0 else 18), c, 3.2))
    for v in (-1.0, -0.5, 0, 0.5, 1.0):
        o.append(W(p.X(v), p.y + p.h, p.X(v), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, ("%g" % v).replace("-", "−"), "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 31, "本当の距離からの差 [m]", "middle", 10, MUT))
    o.append(T(p.x, p.y + p.h + 50, "19.03 cm ごとの候補のうち、帯の中に %d 個（金）。本当の値は緑" % nin, "start", 9.5, INK))
    # (c) 距離の変化は mm で追う
    o.append(T(372, yb, "(c) 距離の変化の誤差（追尾を始めてから）", "start", 11.5, INK, True))
    q = Plot(420, yb + 30, 260, 104, (0, 60), (-1.0, 1.0))
    o.append(q.axes(xl="時間 t [s]", yl="誤差 [m]", xt=[0, 20, 40, 60], yt=[-1, -0.5, 0, 0.5, 1]))
    rng = _f17_np.random.default_rng(3)
    ts = _f17_np.arange(0, 60.01, 0.5)
    a = math.exp(-0.5 / 30.0)
    m = 0.0; cr = []
    for t in ts:
        m = a * m + math.sqrt(1 - a * a) * rng.normal() * 0.27
        cr.append(m + rng.normal() * 0.13)
    cr = _f17_np.array(cr) - cr[0]
    ph = rng.normal(size=len(ts)) * 0.003
    ph = ph - ph[0]
    o.append(q.clip([(t, v) for t, v in zip(ts, cr)], c=SIG, lw=1.2))
    o.append(q.line([(t, v) for t, v in zip(ts, ph)], c=GRN, lw=2.0))
    o.append(T(q.X(31), q.Y(0.78), "擬似距離（σ 0.3 m）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(q.X(45), q.Y(-0.24), "搬送波位相（σ 3 mm）", "middle", 9.5, GRN, True, halo=True))
    return SVG(700, yb + 186, o, "整数値バイアス（L1、G22 の例。(b)・(c) の誤差は 1 節の代表値で作った乱数の 1 例）。")


F["e17_ambig"] = _f17_ambig_fig()


# =====================================================================
# 2 節: 擬似距離と搬送波位相の式の項（大きさと符号）
# =====================================================================
def _f17_terms_fig():
    o = []
    el = math.radians(45.6)
    mI = 1 / math.sqrt(1 - (6371.0 * math.cos(el) / (6371.0 + 350.0)) ** 2)
    mT = 1.001 / math.sqrt(0.002001 + math.sin(el) ** 2)
    I = 40.3 * 25e16 / _F17_F1 ** 2 * mI
    Tt = 2.41 * mT
    rows = [("幾何学的な距離", "r_i", _F17_R22, _F17_R22, "21 627 km", "21 627 km", "同じ", SIG),
            ("受信機の時計", "b", _F17_C * 1e-3, _F17_C * 1e-3, "+299.792 km", "+299.792 km", "同じ", SIG),
            ("衛星の時計", "−cδt_i^s", _F17_C * 1e-4, _F17_C * 1e-4, "−29.979 km", "−29.979 km", "同じ", SIG),
            ("電離層", "±I_i", I, I, "+%.2f m" % I, "−%.2f m" % I, "符号が逆", ALI),
            ("対流圏", "T_i", Tt, Tt, "+%.2f m" % Tt, "+%.2f m" % Tt, "同じ", SIG),
            ("整数値バイアス", "λN_i", None, None, "なし", "整数 × 19.03 cm", "位相だけ", PUR),
            ("マルチパスと雑音", "M_i + ε_i", 0.3, 0.003, "0.3 m", "3 mm", "100 分の 1", GRN)]
    xl, xr, xp = 14, 226, 338
    bx0, bx1 = 410, 600
    lo, hi = 1e-3, 1e8
    X = lambda v: bx0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (bx1 - bx0)
    yh = 22
    o.append(T(xl, yh, "項", "start", 10.5, INK, True))
    o.append(TX(xr, yh, "擬似距離 ρ_i", "middle", 10.5, SIG, True))
    o.append(TX(xp, yh, "搬送波位相 Φ_i", "middle", 10.5, GRN, True))
    o.append(T((bx0 + bx1) / 2, yh, "大きさ（対数の目盛）", "middle", 10.5, INK, True))
    o.append(T(650, yh, "違い", "middle", 10.5, INK, True))
    y0 = 36
    rh = 30
    for v, s_ in ((1e-3, "1 mm"), (1, "1 m"), (1e3, "1 km"), (1e6, "1000 km")):
        o.append(W(X(v), y0, X(v), y0 + rh * len(rows), c=GRD, lw=1))
        o.append(T(X(v), y0 + rh * len(rows) + 14, s_, "middle", 9.5, MUT))
    for k, (nm, sym, vc, vp, sc, sp_, st, cst) in enumerate(rows):
        yy = y0 + k * rh
        if k % 2 == 0:
            o.append(RECT(10, yy, 680, rh, 0, MSOFT, "none", 0, op=0.5))
        o.append(T(xl, yy + 13, nm, "start", 10, INK, True))
        o.append(TX(xl, yy + 26, sym, "start", 9.5, MUT))
        o.append(T(xr, yy + 19, sc, "middle", 10, SIG if st != "符号が逆" else ALI, True))
        o.append(T(xp, yy + 19, sp_, "middle", 10, GRN if st != "符号が逆" else ALI, True))
        if vc is not None:
            o.append(RECT(bx0, yy + 6, X(vc) - bx0, 7, 2, SSOFT, SIG, 1))
            o.append(RECT(bx0, yy + 16, X(vp) - bx0, 7, 2, GSOFT, GRN, 1))
        else:
            o.append(RECT(bx0, yy + 16, X(_F17_R22) - bx0, 7, 2, PSOFT, PUR, 1, dash="3 2"))
            o.append(T(bx0 + 6, yy + 13, "（値が分からない）", "start", 9, PUR, False, halo=True))
        cw = tw(st, 9.5) + 12
        o.append(RECT(650 - cw / 2, yy + 8, cw, 15, 4, soft(cst), cst, 1))
        o.append(T(650, yy + 19, st, "middle", 9.5, cst, True))
    o.append(LEGEND(bx0 - 20, y0 + rh * len(rows) + 34, [(SIG, "擬似距離"), (GRN, "搬送波位相")], 9.5, 14))
    return SVG(700, y0 + rh * len(rows) + 44, o, "擬似距離と搬送波位相の式の項（G22、仰角 45.6°、昼の電離層 25 TECU、受信機の時計 1 ms、衛星の時計 100 μs。時計の値は例の値）。")


F["e17_terms"] = _f17_terms_fig()


# =====================================================================
# 2 節: 電離層で位相が進み、包絡線（符号）が遅れる
# =====================================================================
def _f17_iono_fig():
    o = []
    o.append(T(14, 18, "(a) 周波数の違う 2 つの波の和（電離層の効きを誇張して描いた）", "start", 11.5, INK, True))
    f1, f2, A = 10.0, 14.0, 4.0                 # 時間の単位を任意にとった例。A = 40.3 TEC/c にあたる
    x0, x1 = 40.0, 440.0
    t0, span = 0.0, 0.3
    X = lambda t: x0 + (t - (t0 - span)) / (2 * span) * (x1 - x0)
    panels = [("真空", 0.0, 74), ("電離層を通った後", 1.0, 176)]
    tg = A / (f1 * f2)
    for nm, on, yc in panels:
        amp = 22
        ts = _f17_np.linspace(t0 - span, t0 + span, 1200)
        d1 = on * A / f1 ** 2; d2 = on * A / f2 ** 2
        w1 = _f17_np.cos(2 * math.pi * f1 * (ts - t0 + d1))
        w2 = _f17_np.cos(2 * math.pi * f2 * (ts - t0 + d2))
        env = _f17_np.abs(_f17_np.exp(2j * math.pi * f1 * (ts - t0 + d1)) + _f17_np.exp(2j * math.pi * f2 * (ts - t0 + d2)))
        o.append(T(14, yc - 34, nm, "start", 10.5, INK, True))
        o.append(PL([(X(t), yc - amp * 0.5 * v) for t, v in zip(ts, env)], c=GLD, lw=1.2, dash="4 3"))
        o.append(PL([(X(t), yc + amp * 0.5 * v) for t, v in zip(ts, env)], c=GLD, lw=1.2, dash="4 3"))
        o.append(PL([(X(t), yc - amp * 0.5 * (a_ + b_)) for t, a_, b_ in zip(ts, w1, w2)], c=SIG, lw=1.6))
        tc = t0 - on * A / f1 ** 2          # f1 の山（真空で t0 にあった山）
        o.append(W(X(tc), yc - amp - 6, X(tc), yc + amp + 4, c=SIG, lw=1.2))
        o.append(D(X(tc), yc - amp - 6, SIG, 3))
        te = t0 + on * tg
        o.append(W(X(te), yc - amp - 6, X(te), yc + amp + 4, c=GLD, lw=1.6))
        o.append(D(X(te), yc + amp + 4, GLD, 3))
    o.append(W(X(t0), 44, X(t0), 226, c=MUT, lw=1, dash="2 3"))
    o.append(T(X(t0), 240, "真空なら届く時刻", "middle", 9.5, MUT, False, halo=True))
    yc = 176
    o.append(ARR(X(t0), yc - 40, X(t0 - A / f1 ** 2) - 2, yc - 40, c=SIG, lw=1.6, head=6))
    o.append(T(X(t0) + 6, yc - 36, "山は早く届く（位相が進む）", "start", 9.5, SIG, True, halo=True))
    o.append(ARR(X(t0), yc + 38, X(t0 + tg) + 2, yc + 38, c=GLD, lw=1.6, head=6))
    o.append(T(X(t0 + tg) + 6, yc + 42, "包絡線の山は遅れる（符号が遅れる）", "start", 9.5, GLD, True, halo=True))
    o.append(T(x1, 240, "受信機に届く時刻 →", "end", 9.5, MUT))
    # (b) 周波数ごとの道のりの差
    o.append(T(472, 18, "(b) 天頂の道のりの差（25 TECU）", "start", 11.5, INK, True))
    p = Plot(510, 52, 150, 150, (-9, 9), (0, 3))
    o.append(W(p.X(0), p.y - 4, p.X(0), p.y + p.h, c=MUT, lw=1.2))
    for v in (-8, -4, 0, 4, 8):
        o.append(W(p.X(v), p.y + p.h, p.X(v), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, ("%g" % v).replace("-", "−"), "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 31, "真空との差 [m]", "middle", 10, MUT))
    for k, (nm, f) in enumerate((("L1", 1575.42e6), ("L2", 1227.60e6), ("L5", 1176.45e6))):
        I = 40.3 * 25e16 / f ** 2
        yy = p.y + 10 + k * 48
        o.append(T(p.x - 8, yy + 16, nm, "end", 10, INK, True))
        o.append(RECT(p.X(0), yy, p.X(I) - p.X(0), 13, 2, GOSOFT, GLD, 1.1))
        o.append(T(p.X(I) + 3, yy + 10, "+%.2f" % I, "start", 9.5, GLD, True))
        o.append(RECT(p.X(-I), yy + 17, p.X(0) - p.X(-I), 13, 2, SSOFT, SIG, 1.1))
        o.append(T(p.X(-I) - 3, yy + 27, "−%.2f" % I, "end", 9.5, SIG, True))
    o.append(LEGEND(482, 252, [(GLD, "符号"), (SIG, "搬送波の位相")], 9.5, 12))
    return SVG(700, 262, o, "電離層の中の符号と搬送波の位相。(a) は 2 つの周波数を 10 と 14（任意の単位）にとり、進み・遅れを大きく描いた。(b) は 7 章 2 節の式 I = 40.3 TEC/f² の値。")


F["e17_iono"] = _f17_iono_fig()


# =====================================================================
# 3 節: 一重差と二重差（作り方と、各項の行き先）
# =====================================================================
def _f17_sddd_fig():
    o = []
    o.append(T(14, 18, "(a) 4 つの観測と、差のとり方", "start", 11.5, INK, True))
    si, sj = (92, 52), (232, 52)
    rf, rv = (60, 196), (250, 196)
    o.append(_f17_sat(si[0], si[1], SIG, 0.9)); o.append(_f17_sat(sj[0], sj[1], SIG, 0.9))
    o.append(T(si[0], si[1] - 12, "衛星 i（基準の衛星）", "middle", 9.5, SIG, True))
    o.append(T(sj[0], sj[1] - 12, "衛星 j", "middle", 9.5, SIG, True))
    o.append(_f17_base(rf[0], rf[1] - 4, PUR)); o.append(_f17_rx(rv[0], rv[1] - 4, GRN))
    o.append(T(rf[0], rf[1] + 28, "基準局 ref", "middle", 9.5, PUR, True))
    o.append(T(rv[0], rv[1] + 28, "移動局 rov", "middle", 9.5, GRN, True))
    for sx, sy in (si, sj):
        for rx_, ry, c in ((rf[0], rf[1] - 10, PUR), (rv[0], rv[1] - 10, GRN)):
            o.append(W(sx, sy + 6, rx_, ry, c=c, lw=1.2, dash="4 3"))
    labs = [((70, 118), "Φ_{ref,i}", PUR), ((140, 150), "Φ_{ref,j}", PUR), ((168, 118), "Φ_{rov,i}", GRN), ((248, 150), "Φ_{rov,j}", GRN)]
    for (x, y), t, c in labs:
        o.append(TX(x, y, t, "middle", 10, c, True, halo=True))
    yb = 250
    o.append(TX(14, yb, "ΔΦ_i = Φ_{rov,i} − Φ_{ref,i}", "start", 10.5, INK, True))
    o.append(TX(14, yb + 20, "ΔΦ_j = Φ_{rov,j} − Φ_{ref,j}", "start", 10.5, INK, True))
    o.append(T(196, yb + 10, "一重差", "start", 10, TEA, True))
    o.append(TX(14, yb + 48, "∇ΔΦ_{ij} = ΔΦ_j − ΔΦ_i", "start", 10.5, INK, True))
    o.append(T(196, yb + 48, "二重差", "start", 10, TEA, True))
    o.append(W(188, yb - 8, 192, yb - 8, 192, yb + 26, 188, yb + 26, c=TEA, lw=1.2))
    # (b) 各項の行き先
    o.append(T(300, 18, "(b) 各項は、差をとるとどうなるか", "start", 11.5, INK, True))
    cols = [(420, "1 つの観測"), (520, "一重差（受信機の間）"), (636, "二重差（衛星の間）")]
    for x, t in cols:
        o.append(T(x, 44, t, "middle", 10, INK, True))
    rows = [("距離", ("r", INK), ("Δr", INK), ("∇Δr（位置で決まる）", SIG)),
            ("受信機の時計", ("b", INK), ("Δb（衛星によらない）", INK), ("消える", GRN)),
            ("衛星の時計", ("−cδt_i^s", INK), ("消える", GRN), ("—", MUT)),
            ("電離層・対流圏", ("−I + T", INK), ("ほぼ 0（短い基線）", TEA), ("ほぼ 0", TEA)),
            ("整数値バイアス", ("λN", INK), ("λΔN（整数）", PUR), ("λ∇ΔN（整数）", PUR)),
            ("発振器の初めの位相", ("端数", INK), ("受信機の分が残る", INK), ("消える", GRN)),
            ("雑音の標準偏差", ("σ", INK), ("√2 σ", ALI), ("2σ", ALI))]
    y0 = 56
    for k, (nm, a, b, c) in enumerate(rows):
        yy = y0 + k * 34
        if k % 2 == 0:
            o.append(RECT(300, yy, 392, 34, 0, MSOFT, "none", 0, op=0.5))
        o.append(T(306, yy + 21, nm, "start", 9.5, INK, True))
        for (x, _), (txt, cc) in zip(cols, (a, b, c)):
            if cc in (GRN, TEA, PUR, ALI) and txt not in ("—",):
                wdt = TXW(txt, 9.5) + 12
                o.append(RECT(x - wdt / 2, yy + 10, wdt, 16, 4, soft(cc), cc, 1))
                o.append(TX(x, yy + 22, txt, "middle", 9.5, cc, True))
            else:
                o.append(TX(x, yy + 22, txt, "middle", 9.5, cc, False))
    return SVG(700, y0 + 34 * len(rows) + 8, o, "一重差と二重差。(b) の雑音は、4 つの観測の雑音が独立で、標準偏差がどれも σ のとき。")


F["e17_sddd"] = _f17_sddd_fig()


# =====================================================================
# 3 節: 数値の例（東京の基準局と、1 km 東の移動局。G9 と G22）
# =====================================================================
def _f17_ddex(dkm=1.0, gmm=1.0, Iz=4.06):
    """3 節の数値の例の各項 [m]。キーは (受信機, 衛星)。移動局は基準局の東 dkm [km]。
    電離層の天頂の遅れは、基準局で Iz [m]、東へ 1 km 行くごとに gmm [mm] 増える（例のモデル。デモ w17_dd と同じ）。"""
    B, L, h = GNSS_TOKYO
    pref = _f17_np.array(geod2ecef(B, L, h))
    l = math.radians(L)
    east = _f17_np.array([-math.sin(l), math.cos(l), 0.0])
    prov = pref + dkm * 1000.0 * east
    sats = {s["nm"]: s for s in gnss_const()}
    out = {}
    clk = {"ref": 0.4e-3, "rov": -0.25e-3}
    sclk = {"G9": 25e-6, "G22": -60e-6}
    Ns = {("ref", "G9"): 31, ("rov", "G9"): 5, ("ref", "G22"): -12, ("rov", "G22"): 44}
    for nm in ("G9", "G22"):
        ps = _f17_np.array(sat_ecef(sats[nm], 0.0))
        elv = elaz(B, L, h, ps)[0]
        e = math.radians(elv)
        mI = 1 / math.sqrt(1 - (6371.0 * math.cos(e) / (6371.0 + 350.0)) ** 2)
        mT = 1.001 / math.sqrt(0.002001 + math.sin(e) ** 2)
        for rcv, pr, dd_ in (("ref", pref, 0.0), ("rov", prov, dkm)):
            r = float(_f17_np.linalg.norm(ps - pr))
            I = (Iz + gmm * 1e-3 * dd_) * mI
            out[(rcv, nm)] = dict(r=r, b=_F17_C * clk[rcv], s=-_F17_C * sclk[nm], I=-I, T=2.41 * mT, N=_F17_LAM * Ns[(rcv, nm)], n=Ns[(rcv, nm)], el=elv)
    return out


def _f17_num(v):
    """表の数値（3 桁ごとに空白、小数 3 桁）。"""
    whole = _f17_g3(int(abs(v)))
    return ("−" if v < 0 else "") + whole + ("%.3f" % (abs(v) % 1))[1:]


def _f17_ddnum_fig():
    o = []
    ex = _f17_ddex()
    keys = ["r", "b", "s", "I", "T", "N"]
    names = ["距離 r", "受信機の時計 b", "衛星の時計 −cδt^s", "電離層 −I", "対流圏 T", "整数値バイアス λN"]
    obs = [("ref", "G9"), ("rov", "G9"), ("ref", "G22"), ("rov", "G22")]
    sd = {nm: {k: ex[("rov", nm)][k] - ex[("ref", nm)][k] for k in keys} for nm in ("G9", "G22")}
    dd = {k: sd["G22"][k] - sd["G9"][k] for k in keys}

    def table(y, title, cols, xs, vals_of, tot, diff):
        o.append(T(14, y, title, "start", 11.5, INK, True))
        for x, c in zip(xs, cols):
            o.append(T(x, y + 22, c, "end", 9.5, TEA if diff else INK, True))
        y0 = y + 30
        for k, (key, nm) in enumerate(zip(keys, names)):
            yy = y0 + k * 22
            if k % 2 == 0:
                o.append(RECT(10, yy, 680, 22, 0, MSOFT, "none", 0, op=0.5))
            o.append(TX(14, yy + 15, nm, "start", 9.5, INK, True))
            for x, v in zip(xs, vals_of(key)):
                gone = diff and abs(v) < 5e-4
                small = diff and not gone and abs(v) < 0.01
                txt = _f17_num(v)
                c = GRN if gone else (TEA if small else INK)
                if gone:
                    txt = "0（消える）" if key in ("s", "b") else "0.000"
                o.append(T(x, yy + 15, txt, "end", 9.5, c, gone or small, True))
        yy = y0 + 6 * 22
        o.append(W(10, yy + 2, 690, yy + 2, c=MUT, lw=1))
        o.append(T(14, yy + 17, "合計（測った値）", "start", 9.5, INK, True))
        for x, v in zip(xs, tot):
            o.append(T(x, yy + 17, _f17_num(v), "end", 9.5, INK, True, True))
        return yy + 24

    ya = table(18, "(a) 4 つの観測の各項 [m]（衛星 i = G9、j = G22）", ["基準局・G9", "移動局・G9", "基準局・G22", "移動局・G22"],
               [300, 430, 560, 690], lambda key: [ex[q][key] for q in obs], [sum(ex[q][k] for k in keys) for q in obs], False)
    yb = table(ya + 22, "(b) 差をとった後 [m]", ["一重差 G9", "一重差 G22", "二重差"], [400, 545, 690],
               lambda key: [sd["G9"][key], sd["G22"][key], dd[key]], [sum(sd["G9"].values()), sum(sd["G22"].values()), sum(dd.values())], True)
    nI = dd["I"]; nN = round(dd["N"] / _F17_LAM)
    o.append(T(14, yb + 18, "二重差に残るのは、距離の差 %s m（移動局の位置で決まる）、整数値バイアス %d 周期 × 19.03 cm、電離層の差 %.1f mm だけ" % (_f17_fmt(dd["r"], 3), nN, abs(nI) * 1e3), "start", 9.5, INK))
    return SVG(700, yb + 30, o, "二重差の数値の例（基準局は東京、移動局はその 1 km 東。時計のずれと整数値バイアスは例の値。電離層は天頂 4.06 m で、東へ 1 km ごとに 1 mm 増える例のモデル。距離は 1 章の配置の時刻 0）。雑音は省いた。")


F["e17_ddnum"] = _f17_ddnum_fig()


# =====================================================================
# 4・6 節の 3 次元の例: 東京の基準局と、近くの移動局（短い基線）。二重差の擬似距離と搬送波位相の最小二乗（フロート解）と整数の最小二乗
# =====================================================================
def _f17_enurot(B, L):
    b, l = math.radians(B), math.radians(L)
    return _f17_np.array([[-math.sin(l), math.cos(l), 0.0],
                          [-math.sin(b) * math.cos(l), -math.sin(b) * math.sin(l), math.cos(b)],
                          [math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b)]])


_F17_RENU = _f17_enurot(GNSS_TOKYO[0], GNSS_TOKYO[1])
_F17_PREF = _f17_np.array(geod2ecef(*GNSS_TOKYO))


def _f17_sats(t, systems=("GPS",), mask=10.0):
    """時刻 t の、仰角 mask 以上の衛星 [(系, 名前, 仰角, 方位角, 視線の単位ベクトル(ENU))]。"""
    out = []
    for s in gnss_const():
        if s["sys"] not in systems:
            continue
        d = _F17_RENU @ (_f17_np.array(sat_ecef(s, t)) - _F17_PREF)
        r = float(_f17_np.linalg.norm(d))
        el = math.degrees(math.asin(d[2] / r)); az = math.degrees(math.atan2(d[0], d[1])) % 360
        if el >= mask:
            out.append((s["sys"], s["nm"], el, az, d / r))
    return out


def _f17_ddmat(sats):
    """系ごとに、仰角の最も高い衛星を基準の衛星にした二重差の作り方（行列）。"""
    n = len(sats); rows = []
    for sysn in sorted(set(s[0] for s in sats)):
        idx = [i for i, s in enumerate(sats) if s[0] == sysn]
        if len(idx) < 2:
            continue
        ref = max(idx, key=lambda i: sats[i][2])
        for i in idx:
            if i != ref:
                r = _f17_np.zeros(n); r[i] = 1; r[ref] = -1; rows.append(r)
    return _f17_np.array(rows)


def _f17_normal(K, systems=("GPS",), mask=10.0, sr=_F17_SR, sp=_F17_SP, dt=1.0):
    """K エポック（間隔 dt [s]）の、未知数 (東・北・上の位置の誤差, 整数値バイアス) の正規行列と、エポックごとの H・W・二重差の共分散。"""
    s0 = _f17_sats(0.0, systems, mask)
    names = [s[1] for s in s0]
    Dm = _f17_ddmat(s0); m = Dm.shape[0]
    Nm = _f17_np.zeros((3 + m, 3 + m)); Hs = []
    for k in range(K):
        allv = {s[1]: s for s in _f17_sats(k * dt, systems, -90.0)}
        A = -(Dm @ _f17_np.array([allv[nm][4] for nm in names]))
        Qdd = 2.0 * Dm @ Dm.T
        Wc = _f17_np.linalg.inv(Qdd * sr ** 2); Wp = _f17_np.linalg.inv(Qdd * sp ** 2)
        Hc = _f17_np.c_[A, _f17_np.zeros((m, m))]; Hp = _f17_np.c_[A, _F17_LAM * _f17_np.eye(m)]
        Nm += Hc.T @ Wc @ Hc + Hp.T @ Wp @ Hp
        Hs.append((Hc, Hp, Wc, Wp, Qdd))
    return Nm, Hs, s0, Dm


def _f17_mc(K, systems=("GPS",), ntr=1000, seed=1, tc=None, wfrac=0.3, iono_k=0.0, dkm=0.0, thr=3.0, keep=0):
    """モンテカルロ。tc [s] を与えると、誤差の分散の (1 − wfrac) を相関の時間 tc の 1 次のマルコフ過程（マルチパスのモデル）にする。
    iono_k [m/km] と dkm [km] で、二重差に残る電離層の誤差（天頂の向きで標準偏差 iono_k·dkm。初期化の間は一定）を足す。"""
    Nm, Hs, s0, Dm = _f17_normal(K, systems)
    Qt = _f17_np.linalg.inv(Nm); m = Nm.shape[0] - 3
    if tc is None:
        Sig = Qt
    else:
        rho = math.exp(-1.0 / tc)
        G = [(H[0].T @ H[2], H[1].T @ H[3]) for H in Hs]
        Cv = _f17_np.zeros_like(Qt)
        for k in range(K):
            for l in range(K):
                c = (1 - wfrac) * rho ** abs(k - l) + (wfrac if k == l else 0.0)
                Q = Hs[k][4]
                Cv += c * (G[k][0] @ (Q * _F17_SR ** 2) @ G[l][0].T + G[k][1] @ (Q * _F17_SP ** 2) @ G[l][1].T)
        Sig = Qt @ Cv @ Qt; Sig = (Sig + Sig.T) / 2
    Lc = _f17_np.linalg.cholesky(Sig + 1e-15 * _f17_np.eye(3 + m))
    Bmap = Qt @ sum(H[0].T @ H[2] - H[1].T @ H[3] for H in Hs)
    els = _f17_np.array([s[2] for s in s0])
    mI = 1 / _f17_np.sqrt(1 - (6371.0 * _f17_np.cos(_f17_np.radians(els)) / 6721.0) ** 2)
    Qa = Qt[3:, 3:]; Qxa = Qt[:3, 3:]
    rng = _f17_np.random.default_rng(seed)
    res = dict(ok=0, acc=0, accw=0, herr=[], recs=[])
    for t in range(ntr):
        th = Lc @ rng.normal(size=3 + m)
        if iono_k > 0:
            th = th + Bmap @ (Dm @ (rng.normal(size=len(s0)) * iono_k * dkm * mI / math.sqrt(2)))
        F, s = _f17_ils(th[3:], Qa, 2)
        z = F[:, 0]; ok = bool(_f17_np.all(z == 0)); ratio = float(s[1] / s[0]) if s[0] > 0 else 1e9
        acc = ratio >= thr
        res["ok"] += ok; res["acc"] += acc; res["accw"] += (acc and not ok)
        xfix = th[:3] - Qxa @ _f17_np.linalg.solve(Qa, th[3:] - z)
        if ok:
            res["herr"].append(math.hypot(xfix[0], xfix[1]))
        if t < keep:
            res["recs"].append((ok, ratio, float(th[0]), float(th[1]), float(xfix[0]), float(xfix[1])))
    for k in ("ok", "acc", "accw"):
        res[k] /= ntr
    res["sx"] = _f17_np.sqrt(_f17_np.diag(Qt[:3, :3]))
    res["n"] = len(s0); res["m"] = m; res["s0"] = s0
    return res


# =====================================================================
# 4 節: フロート解の整数値バイアスの散らばり（線路の上の例）と、丸めの確率
# =====================================================================
def _f17_float_fig():
    o = []
    g = _f17_toyg()
    # (b) 例の配置
    o.append(T(392, 18, "(b) 例の配置（6 章・7 章の東京の衛星）", "start", 11.5, INK, True))
    cx, cy, R = 452.0, 102.0, 56.0
    sats = [(_F17_TOYSAT[k][0], _F17_TOYSAT[k][1], k, SIG) for k in ("G9", "G6", "G22")]
    o.append(sky(cx, cy, R, sats, labels=True, sz=9.5, rings=(30, 60)))
    o.append(W(cx - R - 4, cy, cx + R + 4, cy, c=GRN, lw=2.2))
    xt = 540
    o.append(T(xt, 54, "緑の線: 線路（東西）。", "start", 9.5, GRN, True))
    o.append(T(xt, 68, "移動局はこの上にあり、", "start", 9.5, GRN, True))
    o.append(T(xt, 82, "東の座標 e だけが", "start", 9.5, GRN, True))
    o.append(T(xt, 96, "分からない", "start", 9.5, GRN, True))
    o.append(TX(xt, 120, "g_6 = %s" % _f17_fmt(g[0], 3), "start", 10, INK, True))
    o.append(TX(xt, 136, "g_{22} = +%s" % _f17_fmt(g[1], 3), "start", 10, INK, True))
    o.append(T(xt, 152, "（基準の衛星は G9）", "start", 9.5, MUT))
    # (a) 整数値バイアスの実数の値
    o.append(T(14, 18, "(a) 2 つの整数値バイアスの実数の値（誤差）", "start", 11.5, INK, True))
    p = Plot(58, 40, 270, 270, (-6, 6), (-6, 6))
    for v in range(-6, 7, 2):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1)); o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
    o.append(p.axes(xl="N̂_6 − N_6 [周期]", yl="N̂_{22} − N_{22} [周期]", xt=[-6, -4, -2, 0, 2, 4, 6], yt=[-6, -4, -2, 0, 2, 4, 6], grid=False))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, "none", MUT, 1))
    for i in range(-6, 7):
        for j in range(-6, 7):
            o.append(D(p.X(i), p.Y(j), MUT, 1.6))
    u = g / math.hypot(*g)
    o.append(p.clip([(-9 * u[0], -9 * u[1]), (9 * u[0], 9 * u[1])], c=MUT, lw=1, dash="5 3"))
    for K, c, sd in ((1, GLD, 17), (10, TEA, 18)):
        S, Qt = _f17_toysamples(300, K, sd)
        for e_, a_, b_ in S:
            if abs(a_) < 6 and abs(b_) < 6:
                o.append(D(p.X(a_), p.Y(b_), c, 1.7))
    o.append(CIRC(p.X(0), p.Y(0), 6, c=GRN, lw=2))
    o.append(T(p.X(0) + 9, p.Y(0) + 16, "本当の整数", "start", 9.5, GRN, True, halo=True))
    Q1 = _f17_toyQ(K=1); Qa = Q1[1:, 1:]
    ev = _f17_np.linalg.eigvalsh(Qa)
    o.append(T(p.X(-5.6), p.Y(-3.6), "1 エポック（金）", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(-5.6), p.Y(-4.4), "10 エポック（青緑）", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(-5.6), p.Y(-5.3), "破線: 向き (g_6, g_{22}) の直線", "start", 9, MUT, False, halo=True))
    # (c) 丸めの確率
    o.append(T(392, 196, "(c) 1 つの値を丸めて正しい整数になる確率", "start", 11.5, INK, True))
    q = Plot(440, 218, 236, 96, (0, 1.8), (0, 100))
    o.append(q.axes(xl="標準偏差 σ_N [周期]", yl="確率 [%]", xt=[0, 0.5, 1.0, 1.5], yt=[0, 50, 100]))
    xs = _f17_np.linspace(0.02, 1.8, 200)
    o.append(q.line([(x, 100 * (1 - 2 * _f17_Q(1 / (2 * x)))) for x in xs], c=SIG, lw=2))
    s6 = math.sqrt(Qa[0, 0])
    for x, lab, a in ((0.2, "0.2 周期で 98.8 %", "start"), (s6, "例の N̂_6（%.2f 周期）: %.1f %%" % (s6, 100 * (1 - 2 * _f17_Q(1 / (2 * s6)))), "end")):
        P = 100 * (1 - 2 * _f17_Q(1 / (2 * x)))
        o.append(D(q.X(x), q.Y(P), GLD, 3.6))
        o.append(TX(q.X(x) + (6 if a == "start" else -2), q.Y(P) - 7, lab, a, 9.5, GLD, True, halo=True))
    o.append(TX(14, 358, "1 エポックの標準偏差: N̂_6 %.2f 周期・N̂_{22} %.2f 周期（相関係数 %s）" % (
        math.sqrt(Qa[0, 0]), math.sqrt(Qa[1, 1]), _f17_fmt(Qa[0, 1] / math.sqrt(Qa[0, 0] * Qa[1, 1]), 4)), "start", 9.5, INK))
    o.append(T(14, 373, "直線の向きに %.2f 周期、直線に垂直に %.3f 周期" % (math.sqrt(ev[1]), math.sqrt(ev[0])), "start", 9.5, INK))
    return SVG(700, 382, o, "フロート解の 2 つの整数値バイアスの誤差（線路の上の例。1 節の代表値の雑音で作った乱数の標本 300 個ずつ。雑音はエポックごとに独立とした）。")


F["e17_float"] = _f17_float_fig()


# =====================================================================
# 4 節: 丸めと整数の最小二乗の領域、LAMBDA の組み替え
# =====================================================================
_F17_ZM = _f17_np.array([[1.0, 1.0], [7.0, 6.0]])     # z1 = N6 + N22、z2 = 7 N6 + 6 N22（整数の足し引き。行列式 −1）


def _f17_boxclip(P, x0, x1, y0, y1):
    for n, c in (((1, 0), x1), ((-1, 0), -x0), ((0, 1), y1), ((0, -1), -y0)):
        P = _f17_clip(P, n, c)
    return P


def _f17_search_fig():
    o = []
    Qt = _f17_toyQ(K=1); Qa = Qt[1:, 1:]
    sq, hexa, pr, pi = _f17_regions(Qa)
    sqz, hexz, prz, piz = _f17_regions(Qa, _F17_ZM)
    S, _ = _f17_toysamples(400, 1, 21)
    Qz = _F17_ZM @ Qa @ _F17_ZM.T
    for k, (title, M, hx, prr, lab_x, lab_y) in enumerate((
            ("(a) 元の整数値バイアス", None, hexa, pr, "N̂_6 − N_6 [周期]", "N̂_{22} − N_{22} [周期]"),
            ("(b) 組み替えた後（z_1 = N_6 + N_{22}、z_2 = 7N_6 + 6N_{22}）", _F17_ZM, hexz, prz, "ẑ_1 − z_1 [周期]", "ẑ_2 − z_2 [周期]"))):
        x0 = 56 + 350 * k
        o.append(TX(x0 - 42, 18, title, "start", 11.5, INK, True))
        p = Plot(x0, 40, 210, 210, (-2.5, 2.5), (-2.5, 2.5))
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, MUT, 1))
        o.append(p.axes(xl=lab_x, yl=lab_y, xt=[-2, -1, 0, 1, 2], yt=[-2, -1, 0, 1, 2], grid=False))
        H = _f17_boxclip([tuple(q) for q in hx], -2.5, 2.5, -2.5, 2.5)
        if len(H) >= 3:
            o.append(PL([(p.X(a), p.Y(b)) for a, b in H], c=GRN, lw=1.4, fill=GSOFT))
        o.append(PL([(p.X(a), p.Y(b)) for a, b in sq] + [(p.X(sq[0][0]), p.Y(sq[0][1]))], c=SIG, lw=1.6, dash="5 3"))
        for i in range(-2, 3):
            for j in range(-2, 3):
                o.append(D(p.X(i), p.Y(j), INK if (i, j) == (0, 0) else MUT, 2.4 if (i, j) == (0, 0) else 1.8))
        Qi = _f17_np.linalg.inv(Qa)
        for e_, a_, b_ in S:
            v = _f17_np.array([a_, b_])
            F, s = _f17_ils(v, Qa, 1)
            ok = bool(_f17_np.all(F[:, 0] == 0))
            w = v if M is None else M @ v
            if abs(w[0]) < 2.5 and abs(w[1]) < 2.5:
                o.append(D(p.X(w[0]), p.Y(w[1]), GRN if ok else ALI, 1.9))
        xt = p.x + p.w + 8
        o.append(T(xt, p.y + 14, "丸め", "start", 9.5, SIG, True))
        o.append(T(xt, p.y + 28, "（青の破線）", "start", 9.5, SIG))
        o.append(T(xt, p.y + 45, "%.1f %%" % (100 * prr), "start", 12, SIG, True))
        o.append(T(xt, p.y + 72, "整数の最小二乗", "start", 9.5, GRN, True))
        o.append(T(xt, p.y + 86, "（緑の範囲）", "start", 9.5, GRN))
        o.append(T(xt, p.y + 103, "%.1f %%" % (100 * pi), "start", 12, GRN, True))
        if M is not None:
            o.append(TX(xt, p.y + 136, "σ_{z1} = %.2f 周期" % math.sqrt(Qz[0, 0]), "start", 9.5, INK))
            o.append(TX(xt, p.y + 150, "σ_{z2} = %.2f 周期" % math.sqrt(Qz[1, 1]), "start", 9.5, INK))
            o.append(T(xt, p.y + 164, "相関係数 %s" % _f17_fmt(Qz[0, 1] / math.sqrt(Qz[0, 0] * Qz[1, 1]), 2), "start", 9.5, INK))
    o.append(LEGEND(56, 314, [(GRN, "正しい整数が選ばれた実数の値"), (ALI, "誤った整数が選ばれた値")], 10, 18))
    return SVG(700, 324, o, "丸めと整数の最小二乗（線路の上の例、1 エポック。割合は、範囲の中の確率を数値で積分した値。点は乱数の標本 400 個）。")


F["e17_search"] = _f17_search_fig()


# =====================================================================
# 4 節: フロート解とフィックス解の位置（3 次元の例: 東京、GPS の 6 機、5 エポック）
# =====================================================================
_F17_FIXK = 5
_F17_FIXRES = _f17_mc(_F17_FIXK, ("GPS",), ntr=800, seed=505, keep=800)


def _f17_fixpos_fig():
    o = []
    r = _F17_FIXRES
    recs = r["recs"]
    o.append(T(14, 18, "(a) 水平の位置の誤差（フロート解と、決めた整数でのフィックス解）", "start", 11.5, INK, True))
    p = Plot(70, 40, 270, 270, (-0.9, 0.9), (-0.9, 0.9))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, MUT, 1))
    o.append(p.axes(xl="東の誤差 [m]", yl="北の誤差 [m]", xt=[-0.8, -0.4, 0, 0.4, 0.8], yt=[-0.8, -0.4, 0, 0.4, 0.8]))
    for ok, rt, e, n, fe, fn in recs:
        if abs(e) < 0.9 and abs(n) < 0.9:
            o.append(D(p.X(e), p.Y(n), GLD, 1.5))
    nw = 0
    for ok, rt, e, n, fe, fn in recs:
        if not ok:
            nw += 1
            if abs(fe) < 0.9 and abs(fn) < 0.9:
                o.append(W(p.X(fe) - 3.5, p.Y(fn) - 3.5, p.X(fe) + 3.5, p.Y(fn) + 3.5, c=ALI, lw=1.6))
                o.append(W(p.X(fe) - 3.5, p.Y(fn) + 3.5, p.X(fe) + 3.5, p.Y(fn) - 3.5, c=ALI, lw=1.6))
    for ok, rt, e, n, fe, fn in recs:
        if ok:
            o.append(D(p.X(fe), p.Y(fn), GRN, 2.2))
    o.append(RECT(p.X(0) - 9, p.Y(0) - 9, 18, 18, 0, "none", INK, 1, dash="2 2"))
    sx = r["sx"]
    nfix = sum(1 for q in recs if q[0])
    fe = _f17_np.array([[q[4], q[5]] for q in recs if q[0]])
    we = _f17_np.array([math.hypot(q[4], q[5]) for q in recs if not q[0]])
    xt = 360
    o.append(T(xt, 58, "フロート解（金）", "start", 10, GLD, True))
    o.append(T(xt, 74, "標準偏差 東 %.2f m・北 %.2f m" % (sx[0], sx[1]), "start", 9.5, INK))
    o.append(T(xt, 100, "正しい整数のフィックス解（緑）", "start", 10, GRN, True))
    o.append(T(xt, 116, "%d %% が中央の破線の四角の中に集まる" % round(100 * nfix / len(recs)), "start", 9.5, INK))
    o.append(T(xt, 142, "誤った整数のフィックス解（赤の ×）", "start", 10, ALI, True))
    o.append(T(xt, 158, "%d %%。%.1f〜%.1f m ずれる" % (round(100 * nw / len(recs)), we.min(), we.max()), "start", 9.5, INK))
    # (b) 拡大
    o.append(T(xt, 196, "(b) 中央の四角を拡大", "start", 11.5, INK, True))
    q = Plot(xt + 46, 214, 110, 110, (-0.012, 0.012), (-0.012, 0.012))
    o.append(RECT(q.x, q.y, q.w, q.h, 0, SCR, INK, 1, dash="2 2"))
    o.append(q.axes(xt=[-0.01, 0, 0.01], yt=[-0.01, 0, 0.01], xfmt=lambda v: "%g" % round(v * 100, 1), yfmt=lambda v: "%g" % round(v * 100, 1), grid=False))
    o.append(T(q.x + q.w / 2, q.y + q.h + 30, "東 [cm]", "middle", 10, MUT))
    o.append(T(q.x - 30, q.y + q.h / 2, "北 [cm]", "middle", 10, MUT, rot=-90))
    for a, b in fe:
        if abs(a) < 0.012 and abs(b) < 0.012:
            o.append(D(q.X(a), q.Y(b), GRN, 1.8))
    o.append(T(q.x + q.w + 10, q.y + 40, "標準偏差", "start", 9.5, INK))
    o.append(T(q.x + q.w + 10, q.y + 54, "東 %.1f mm" % (1e3 * fe[:, 0].std()), "start", 9.5, INK, True))
    o.append(T(q.x + q.w + 10, q.y + 68, "北 %.1f mm" % (1e3 * fe[:, 1].std()), "start", 9.5, INK, True))
    return SVG(700, 362, o, "フロート解とフィックス解（東京、GPS の 6 機（仰角 10° 以上）、L1、%d エポック、基線は短く大気の差を 0 とした。1 節の代表値の雑音で作った乱数の標本 %d 組）。" % (_F17_FIXK, len(recs)))


F["e17_fixpos"] = _f17_fixpos_fig()


# =====================================================================
# 4 節: 比の検定（GPS の 6 機、1・5・10 エポック）
# =====================================================================
_F17_RATIO = {K: _f17_mc(K, ("GPS",), ntr=1500, seed=900 + K, keep=1500) for K in (1, 5, 10)}


def _f17_ratio_fig():
    o = []
    o.append(TX(14, 18, "(a) 比 J_2/J_1 の分布（5 エポック）", "start", 11.5, INK, True))
    recs = _F17_RATIO[5]["recs"]
    edges = _f17_np.linspace(0, 1.6, 33)
    lr_ok = _f17_np.array([math.log10(max(1.0, q[1])) for q in recs if q[0]])
    lr_ng = _f17_np.array([math.log10(max(1.0, q[1])) for q in recs if not q[0]])
    ho, _ = _f17_np.histogram(_f17_np.clip(lr_ok, 0, 1.599), edges)
    hn, _ = _f17_np.histogram(_f17_np.clip(lr_ng, 0, 1.599), edges)
    p = Plot(60, 40, 300, 170, (0, 1.6), (0, max(ho.max(), 1) * 1.1))
    yt = [0, 50, 100, 150] if ho.max() > 120 else [0, 25, 50, 75, 100]
    o.append(p.axes(xl="比 J_2/J_1（対数の目盛）", yl="回数", xt=[0, math.log10(2), math.log10(3), math.log10(5), 1, math.log10(20)], yt=yt,
                    xfmt=lambda v: "%g" % round(10 ** v, 1)))
    for i in range(len(edges) - 1):
        x0, x1 = p.X(edges[i]), p.X(edges[i + 1])
        if ho[i]:
            o.append(RECT(x0 + 0.5, p.Y(ho[i]), x1 - x0 - 1, p.Y(0) - p.Y(ho[i]), 0, GSOFT, GRN, 1))
        if hn[i]:
            o.append(RECT(x0 + 0.5, p.Y(hn[i]), x1 - x0 - 1, p.Y(0) - p.Y(hn[i]), 0, ASOFT, ALI, 1))
    for thv, lab in ((3.0, "しきい値 3"),):
        o.append(W(p.X(math.log10(thv)), p.y, p.X(math.log10(thv)), p.y + p.h, c=INK, lw=1.4, dash="5 3"))
        o.append(T(p.X(math.log10(thv)) + 4, p.y + 12, lab, "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(math.log10(3.0)) + 4, p.y + 28, "右側だけ整数を決める", "start", 9.5, INK, False, halo=True))
    o.append(LEGEND(60, p.y + p.h + 50, [(GRN, "最も良い候補が正しい"), (ALI, "誤っている")], 9.5, 14))
    # (b) 結果の割合
    o.append(T(392, 18, "(b) しきい値 3 の結果", "start", 11.5, INK, True))
    q0, qw = 470, 210
    for k, K in enumerate((1, 5, 10)):
        r = _F17_RATIO[K]
        good = r["acc"] - r["accw"]; bad = r["accw"]; none = 1 - r["acc"]
        yy = 52 + k * 52
        o.append(T(q0 - 8, yy + 14, "%d エポック" % K, "end", 10, INK, True))
        x = q0
        for v, c in ((good, GRN), (bad, ALI), (none, MUT)):
            if v > 0:
                o.append(RECT(x, yy, v * qw, 20, 0, soft(c), c, 1))
            x += v * qw
        o.append(T(q0, yy + 34, "正 %.1f %%・誤 %.1f %%・決めない %.1f %%" % (100 * good, 100 * bad, 100 * none), "start", 9.5, INK))
    o.append(LEGEND(400, 222, [(GRN, "正しく決めた"), (ALI, "誤って決めた"), (MUT, "決めない（フロート）")], 9.5, 10))
    r1 = _F17_RATIO[1]
    o.append(T(400, 250, "1 エポックでは、決めた解の %d %% が誤り" % round(100 * r1["accw"] / max(1e-9, r1["acc"])), "start", 10, ALI, True))
    return SVG(700, 262, o, "比の検定（4 節の 3 次元の例と同じ条件。乱数の標本 1500 組ずつ。雑音はエポックごとに独立とした）。")


F["e17_ratio"] = _f17_ratio_fig()



# =====================================================================
# 5 節: RTK の構成
# =====================================================================
def _f17_rtk_fig():
    o = []
    o.append(T(14, 18, "基準局の 3 つの選び方", "start", 11.5, INK, True))
    items = [("自分で置いた基準局", ["座標を cm より細かく", "決めておく"], 64),
             ("電子基準点（国土地理院）", ["約 1,300 点・約 20 km 間隔", "（書いた時点）"], 150),
             ("基準局の網", ["（ネットワーク型 RTK）。近くに", "仮の基準局を置いた観測を計算"], 236)]
    for k, (t1, t2s, yy) in enumerate(items):
        o.append(RECT(14, yy - 26, 214, 64, 7, PSOFT, PUR, 1.2))
        if k < 2:
            o.append(_f17_base(42, yy - 8, PUR))
        else:
            for dx_, dy_ in ((-14, -8), (6, -14), (14, 4)):
                o.append(_f17_base(38 + dx_, yy - 8 + dy_ * 0.5, PUR))
        o.append(T(78, yy - 8, t1, "start", 10, PUR, True))
        o.append(T(78, yy + 8, t2s[0], "start", 9, INK))
        o.append(T(78, yy + 21, t2s[1], "start", 9, INK))
        o.append(ARR(228, yy + 4, 262, 150 + (yy - 150) * 0.25, c=PUR, lw=1.5))
    # 中: RTCM と運び方
    o.append(RECT(266, 72, 178, 130, 8, SCR, PUR, 1.4))
    o.append(T(355, 92, "RTCM 版 3（16 章 5 節）", "middle", 10.5, PUR, True))
    o.append(T(276, 114, "1005・1006: 基準局の座標", "start", 9.5, INK))
    o.append(T(276, 132, "MSM（GPS は 1074 など）:", "start", 9.5, INK))
    o.append(T(286, 148, "擬似距離・搬送波位相・C/N0・", "start", 9.5, INK))
    o.append(T(286, 164, "ロックの時間（エポックごと）", "start", 9.5, INK))
    o.append(T(355, 190, "無線機・インターネット（NTRIP）", "middle", 9.5, PUR, True))
    o.append(ARR(444, 136, 476, 136, c=PUR, lw=2.0))
    # 右: 移動局
    o.append(RECT(478, 40, 210, 230, 8, GSOFT, GRN, 1.4))
    o.append(_f17_rx(500, 60, GRN))
    o.append(T(514, 64, "移動局", "start", 10.5, GRN, True))
    steps = ["同じエポックの二重差を作る", "フロート解（実数）", "整数の最小二乗（LAMBDA 法）", "比の検定", "フィックス解"]
    for k, st in enumerate(steps):
        yy = 84 + k * 36
        o.append(RECT(492, yy, 182, 24, 5, SCR, GRN, 1))
        o.append(T(583, yy + 16, st, "middle", 9.5, INK, k in (1, 4)))
        if k:
            o.append(ARR(583, yy - 12, 583, yy - 1, c=GRN, lw=1.3, head=5))
    o.append(ARR(583, 270, 583, 290, c=GRN, lw=1.6))
    o.append(T(686, 304, "GGA: 品質 4（フィックス）・5（フロート）", "end", 9.5, GRN, True))
    o.append(T(686, 318, "13 番の欄に補正の年齢", "end", 9.5, GRN))
    # 網へ GGA を送る
    o.append(PATH("M478,258 C400,300 300,300 230,262", c=GLD, lw=1.4, dash="5 3"))
    o.append(_head(260, 286, 230, 262, GLD, 6))
    o.append(T(330, 304, "ネットワーク型 RTK: おおよその位置（GGA）を送る", "middle", 9.5, GLD, True, halo=True))
    return SVG(700, 326, o, "RTK の構成（RTCM のメッセージの番号は 16 章 5 節と同じ範囲。基準局の選び方の数値は国土地理院の発表による）。")


F["e17_rtk"] = _f17_rtk_fig()


# =====================================================================
# 5 節: 観測値のデータ量（MSM4）と、通信の遅れ・更新の周期
# =====================================================================
def _f17_msmbytes(nsat, nsig, kind=4):
    hdr = 169 + nsat * nsig
    bits = hdr + nsat * {4: 18, 7: 36}[kind] + nsat * nsig * {4: 48, 7: 80}[kind]
    return bits, math.ceil(bits / 8) + 6


def _f17_stream_fig():
    o = []
    o.append(T(14, 18, "(a) MSM4 の 1 つのフレーム（GPS の L1、8 機）", "start", 11.5, INK, True))
    segs = [("見出し", 24, MUT), ("MSM の見出し", 169, PUR), ("セル", 8, PUR), ("衛星ごと 18 bit × 8", 144, SIG), ("信号ごと 48 bit × 8", 384, GRN), ("CRC", 24, MUT)]
    tot = sum(s_[1] for s_ in segs)
    x, x0, wpx = 14.0, 14.0, 672.0
    for nm, nb, c in segs:
        w = wpx * nb / tot
        o.append(RECT(x, 30, w, 24, 2, soft(c), c, 1))
        if w > tw(nm, 9) + 6:
            o.append(T(x + w / 2, 46, nm, "middle", 9, c, True))
        o.append(T(x + w / 2, 68, "%d" % nb, "middle", 9, MUT))
        x += w
    b4, B4 = _f17_msmbytes(8, 1, 4)
    o.append(T(14, 88, "本体 %d bit → 1 フレーム %d バイト（見出し 3 バイト・CRC 3 バイトを含む）" % (b4, B4), "start", 9.5, INK, True))
    o.append(T(14, 102, "信号ごとの 48 bit: 擬似距離 15・搬送波位相 22・ロックの時間 4・半周期の印 1・C/N0 6 bit", "start", 9.5, INK))
    rows = [("GPS L1・8 機", 8, 1, 1), ("1 つの衛星系・10 機・2 信号", 10, 2, 1), ("4 つの衛星系・10 機ずつ・2 信号", 10, 2, 4)]
    o.append(T(250, 126, "MSM4", "end", 9.5, INK, True)); o.append(T(330, 126, "MSM7", "end", 9.5, INK, True))
    o.append(T(470, 126, "1 秒に 1 回送るとき（MSM7）", "end", 9.5, INK, True))
    for k, (nm, ns, ng, nsys) in enumerate(rows):
        yy = 143 + k * 16
        o.append(T(14, yy, nm, "start", 9.5, INK))
        B4 = _f17_msmbytes(ns, ng, 4)[1] * nsys; B7 = _f17_msmbytes(ns, ng, 7)[1] * nsys
        o.append(T(250, yy, "%d B" % B4, "end", 9.5, INK, False, True)); o.append(T(330, yy, "%d B" % B7, "end", 9.5, INK, False, True))
        o.append(T(470, yy, "%.1f kbit/s" % (B7 * 8 / 1000), "end", 9.5, INK, False, True))
    o.append(T(490, 159, "1005 は 25 バイト（10 s に 1 回など）", "start", 9.5, MUT))
    # (b) 時間の並び
    yb = 202
    o.append(T(14, yb, "(b) 基準局の観測（1 Hz）と、移動局の解（5 Hz）。通信の遅れ 0.4 s の例", "start", 11.5, INK, True))
    p = Plot(80, yb + 18, 590, 120, (0, 3.2), (0, 1))
    X = p.X
    yA, yB = yb + 34, yb + 74
    o.append(T(72, yA + 4, "基準局", "end", 9.5, PUR, True))
    o.append(T(72, yB + 4, "移動局", "end", 9.5, GRN, True))
    o.append(W(X(0), yA, X(3.2), yA, c=PUR, lw=1)); o.append(W(X(0), yB, X(3.2), yB, c=GRN, lw=1))
    for t in range(4):
        o.append(D(X(t), yA, PUR, 4))
        o.append(T(X(t), yA - 8, "%d s" % t, "middle", 9, PUR, True))
        if t + 0.4 <= 3.2:
            o.append(ARR(X(t), yA + 4, X(t + 0.4), yB - 6, c=PUR, lw=1.2, head=5))
    for k in range(17):
        t = k * 0.2
        o.append(W(X(t), yB - 5, X(t), yB + 5, c=GRN, lw=1.6))
    # 年齢
    q = Plot(80, yb + 98, 590, 60, (0, 3.2), (0, 1.6))
    o.append(q.axes(xl="時刻 t [s]", yl="年齢 [s]", xt=[0, 1, 2, 3], yt=[0, 0.4, 1.4], yfmt=lambda v: "%g" % v))
    pts = []
    for k in range(17):
        t = k * 0.2
        last = math.floor(t - 0.4 + 1e-9)
        if last < 0:
            continue
        pts.append((t, t - last))
    o.append(q.line(pts, c=GLD, lw=0) if False else "")
    for t, a in pts:
        o.append(D(q.X(t), q.Y(a), GLD, 3.2))
    o.append(T(q.X(3.2), q.Y(1.4) - 6, "延ばして使う: 補正の年齢 0.4〜1.4 s", "end", 9.5, GLD, True, halo=True))
    o.append(T(80, yb + 210, "そろうのを待つ方式では、年齢は 0 だが、位置の遅れに 0.4 s が足される", "start", 9.5, INK))
    return SVG(700, yb + 220, o, "観測値のデータ量（公開されている解読のプログラムの欄の表で数えた）と、通信の遅れと更新の周期（遅れと更新レートは例の値）。")


F["e17_stream"] = _f17_stream_fig()


# =====================================================================
# 6 節: 重いシミュレーションの結果（初期化の時間と基線長）。F17_RECOMPUTE=1 で作り直す
# =====================================================================
_F17_RES = {"init":{"GPS":[[1,0.2213,0.066,0.0433],[2,0.5353,0.1307,0.0313],[3,0.702,0.2173,0.0213],[5,0.9007,0.4247,0.0053],[10,0.9893,0.7847,0.0],[20,1.0,0.982,0.0],[30,1.0,1.0,0.0],[45,1.0,1.0,0.0],[60,1.0,1.0,0.0],[90,1.0,1.0,0.0],[120,1.0,1.0,0.0],[180,1.0,1.0,0.0]],"GPSc":[[1,0.2213,0.066,0.0433],[2,0.2953,0.0767,0.04],[3,0.31,0.082,0.0453],[5,0.3307,0.0787,0.04],[10,0.37,0.1087,0.046],[20,0.4087,0.1053,0.0453],[30,0.4607,0.13,0.0407],[45,0.534,0.1647,0.0327],[60,0.602,0.1907,0.0307],[90,0.702,0.252,0.0193],[120,0.7953,0.2973,0.018],[180,0.8533,0.3687,0.0107]],"GJc":[[1,0.99,0.614,0.0],[2,0.996,0.7407,0.0],[3,0.998,0.7687,0.0],[5,0.9993,0.818,0.0],[10,0.998,0.844,0.0],[20,1.0,0.872,0.0],[30,1.0,0.8987,0.0],[45,0.9993,0.9233,0.0],[60,1.0,0.9633,0.0],[90,1.0,0.984,0.0],[120,1.0,0.9967,0.0],[180,1.0,0.9973,0.0]],"GEJc":[[1,1.0,1.0,0.0],[2,1.0,1.0,0.0],[3,1.0,1.0,0.0],[5,1.0,1.0,0.0],[10,1.0,1.0,0.0],[20,1.0,1.0,0.0],[30,1.0,1.0,0.0]]},"base":{"1":[[0.5,1.0,1.0,0.0,0.00229],[1,1.0,1.0,0.0,0.00247],[2,1.0,1.0,0.0,0.00294],[3,1.0,1.0,0.0,0.0035],[5,1.0,0.987,0.0,0.00487],[7,1.0,0.863,0.0,0.00656],[10,0.989,0.366,0.0,0.00908],[15,0.662,0.028,0.0,0.01296],[20,0.224,0.001,0.001,0.01634],[30,0.011,0.0,0.0,0.03127]],"2":[[0.5,1.0,1.0,0.0,0.00252],[1,1.0,1.0,0.0,0.00298],[2,1.0,0.999,0.0,0.00417],[3,1.0,0.962,0.0,0.00566],[5,0.986,0.401,0.0,0.00888],[7,0.76,0.061,0.0,0.0125],[10,0.21,0.003,0.0,0.01699],[15,0.008,0.001,0.001,0.03145],[20,0.0,0.0,0.0,None],[30,0.0,0.0,0.0,None]],"4":[[0.5,1.0,1.0,0.0,0.00285],[1,1.0,0.999,0.0,0.00413],[2,0.999,0.716,0.0,0.00696],[3,0.896,0.149,0.0,0.01086],[5,0.235,0.007,0.0,0.01769],[7,0.014,0.0,0.0,0.02239],[10,0.0,0.0,0.0,None],[15,0.0,0.0,0.0,None],[20,0.0,0.0,0.0,None],[30,0.0,0.0,0.0,None]]}}


def _f17_recompute():
    res = {"init": {}, "base": {}}
    Ks = [1, 2, 3, 5, 10, 20, 30, 45, 60, 90, 120, 180]
    for name, systems, tc in (("GPS", ("GPS",), None), ("GPSc", ("GPS",), 60.0), ("GJc", ("GPS", "QZSS"), 60.0), ("GEJc", ("GPS", "Galileo", "QZSS"), 60.0)):
        for K in Ks:
            if name == "GEJc" and K > 30:
                continue
            r = _f17_mc(K, systems, ntr=1500, seed=1000 + K, tc=tc)
            res["init"].setdefault(name, []).append([K, r["ok"], r["acc"], r["accw"]])
    for kppm in (1, 2, 4):
        for d in (0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30):
            r = _f17_mc(10, ("GPS", "Galileo", "QZSS"), ntr=1000, seed=2000 + int(d * 10) + kppm * 1000, tc=60.0, iono_k=kppm * 1e-3, dkm=d)
            h = float(_f17_np.sqrt(_f17_np.mean(_f17_np.array(r["herr"]) ** 2))) if r["herr"] else None
            res["base"].setdefault(str(kppm), []).append([d, r["ok"], r["acc"], r["accw"], h])
    return res


if _f17_os.environ.get("F17_RECOMPUTE"):
    _F17_RES = _f17_recompute()


# =====================================================================
# 6 節: 初期化の時間
# =====================================================================
def _f17_init_fig():
    o = []
    o.append(T(14, 18, "(a) 東京の空（時刻 0、仰角 10° 以上）", "start", 11.5, INK, True))
    cx, cy, R = 110.0, 140.0, 86.0
    ss = _f17_sats(0.0, ("GPS", "Galileo", "QZSS"), 10.0)
    o.append(sky(cx, cy, R, [(s[2], s[3], (None if s[1] == "E3" else s[1]), GNSS_SYSC[s[0]]) for s in ss], labels=True, sz=8.5, rings=(30, 60)))
    for s_ in ss:
        if s_[1] == "E3":
            ex_, ey_ = skyxy(cx, cy, R, s_[2], s_[3])
            o.append(T(ex_ - 6, ey_ + 3.5, "E3", "end", 8.5, GRN, True, halo=True))
    o.append(CIRC(cx, cy, R * 80 / 90, c=ALI, lw=1, dash="2 3"))
    o.append(LEGEND(14, 252, [(SIG, "GPS 6"), (GRN, "Galileo 9"), (TEA, "みちびき 4")], 9.5, 8))
    o.append(T(14, 270, "赤の点線: 仰角 10°", "start", 9.5, ALI))
    o.append(T(250, 18, "(b) 比の検定（3）を通って正しい整数に決まる割合", "start", 11.5, INK, True))
    p = Plot(300, 40, 370, 210, (1, 180), (0, 100), xlog=True)
    o.append(p.axes(xl="観測を始めてからの時間 [s]（1 秒に 1 エポック）", yl="割合 [%]", xt=[1, 10, 100], yt=[0, 25, 50, 75, 100], xfmt=lambda v: "%g" % v))
    for v in (2, 3, 5, 20, 30, 50, 180):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=0.8))
        o.append(T(p.X(v), p.y + p.h + 15, "%g" % v, "middle", 9, MUT))
    cases = [("GPS", SIG, "5 3", "GPS 6 機（誤差が独立）"), ("GPSc", SIG, None, "GPS 6 機"), ("GJc", TEA, None, "GPS・みちびき 10 機"), ("GEJc", GRN, None, "GPS・Galileo・みちびき 19 機")]
    for key, c, dash, lab in cases:
        pts = [(K, 100 * (acc - accw)) for K, ok, acc, accw in _F17_RES["init"][key]]
        o.append(p.line(pts, c=c, lw=2.2, dash=dash))
        for K, v in pts:
            o.append(D(p.X(K), p.Y(v), c, 2.6))
    lab_y = {"GPS": 0.0, "GPSc": 0.0}
    o.append(T(p.X(18), p.Y(100) - 5, "19 機（1 エポックから）", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(5), p.Y(80) + 14, "10 機", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(4.6), p.Y(42) - 4, "6 機・誤差が独立（破線）", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(60), p.Y(20) + 16, "6 機（マルチパスが続く）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(250, 296, "6 機は GPS、10 機は GPS・みちびき、19 機は GPS・Galileo・みちびき", "start", 9.5, INK))
    return SVG(700, 306, o, "初期化の時間（L1 だけ、基線は短く大気の差を 0 とした例のモデル。実線は、誤差の分散の 7 割が相関の時間 60 s のマルチパス、3 割が独立な雑音。各点は乱数の標本 1500 組）。")


F["e17_init"] = _f17_init_fig()


# =====================================================================
# 6 節: サイクルスリップ
# =====================================================================
def _f17_slip_fig():
    o = []
    rng = _f17_np.random.default_rng(41)
    ts = _f17_np.arange(0, 120.0001, 0.5)
    o.append(T(14, 18, "(a) 電波がさえぎられたときの C/N0（例）", "start", 11.5, INK, True))
    p = Plot(70, 36, 600, 70, (0, 120), (10, 50))
    o.append(p.axes(yl="C/N0 [dB-Hz]", xt=[0, 20, 40, 60, 80, 100, 120], yt=[10, 30, 50], xfmt=lambda v: ""))
    cn = 45 + rng.normal(size=len(ts)) * 0.8
    for a, b, lo in ((40.0, 41.0, 14), (80.0, 80.5, 18)):
        cn[(ts >= a) & (ts <= b)] = lo
    o.append(p.line([(t, v) for t, v in zip(ts, cn)], c=SIG, lw=1.4))
    o.append(W(p.x, p.Y(26), p.x + p.w, p.Y(26), c=ALI, lw=1, dash="4 3"))
    o.append(T(p.x + p.w - 2, p.Y(26) - 4, "PLL の目安（5 章 4 節）", "end", 9, ALI, True, halo=True))
    o.append(T(p.X(43), p.Y(14) + 4, "木で 1 s さえぎる", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(82.5), p.Y(18) + 4, "0.5 s さえぎる", "start", 9.5, ALI, True, halo=True))
    # (b) Φ − ρ
    o.append(T(14, 140, "(b) 搬送波位相 − 擬似距離（追尾を始めたときの値を引いた）", "start", 11.5, INK, True))
    q = Plot(70, 158, 600, 150, (0, 120), (-1.0, 2.2))
    o.append(q.axes(xl="時間 t [s]", yl="Φ − ρ [m]", xt=[0, 20, 40, 60, 80, 100, 120], yt=[-1, 0, 1, 2]))
    a = math.exp(-0.5 / 60.0); m = 0.0; err = []
    for t in ts:
        m = a * m + math.sqrt(1 - a * a) * rng.normal() * 0.25
        err.append(-(m + rng.normal() * 0.16))
    err = _f17_np.array(err)
    step = _f17_np.where(ts >= 41.0, 5 * _F17_LAM, 0.0) + _f17_np.where(ts >= 80.5, 1 * _F17_LAM, 0.0)
    y = err - err[0] + step
    o.append(q.line([(t, v) for t, v in zip(ts, y)], c=GLD, lw=1.2))
    o.append(q.steps([(0, 0), (41.0, 5 * _F17_LAM), (80.5, 6 * _F17_LAM), (120, 6 * _F17_LAM)], c=ALI, lw=2.0))
    o.append(T(q.X(42), q.Y(5 * _F17_LAM) - 34, "+5 周期（95 cm）: 段が見える", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(82), q.Y(6 * _F17_LAM) + 46, "+1 周期（19 cm）: 擬似距離の誤差に埋もれる", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(70, 352, [(GLD, None, "Φ − ρ（擬似距離の誤差 σ 0.3 m を含む）"), (ALI, None, "跳んだ周期の数 × λ")], 9.5, 14))
    return SVG(700, 362, o, "サイクルスリップ（L1。擬似距離の誤差は 6 節の例のモデル（相関の時間 60 s のマルチパスと独立な雑音）の乱数の 1 例。2 分の間の電離層の変わりは無視した）。")


F["e17_slip"] = _f17_slip_fig()


# =====================================================================
# 6 節: 基線長
# =====================================================================
def _f17_baseline_fig():
    o = []
    cols = {"1": GRN, "2": GLD, "4": ALI}
    o.append(T(14, 18, "(a) 比の検定（3）を通って正しく決まる割合", "start", 11.5, INK, True))
    p = Plot(64, 40, 270, 190, (0, 30), (0, 100))
    o.append(p.axes(xl="基線長 d [km]", yl="割合 [%]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 25, 50, 75, 100]))
    for k, c in cols.items():
        pts = [(d, 100 * (acc - accw)) for d, ok, acc, accw, h in _F17_RES["base"][k]]
        o.append(p.line(pts, c=c, lw=2.2))
        for d, v in pts:
            o.append(D(p.X(d), p.Y(v), c, 2.6))
    o.append(T(p.X(9.5), p.Y(55), "1 mm/km", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(5.4), p.Y(36), "2 mm/km", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(3.2), p.Y(10), "4 mm/km", "start", 9.5, ALI, True, halo=True))
    o.append(T(370, 18, "(b) 正しく決まったフィックス解の水平の誤差", "start", 11.5, INK, True))
    q = Plot(420, 40, 260, 190, (0, 30), (0, 40))
    o.append(q.axes(xl="基線長 d [km]", yl="誤差の RMS [mm]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 10, 20, 30, 40]))
    o.append(q.line([(0, 10), (30, 40)], c=MUT, lw=1.4, dash="5 3"))
    o.append(T(q.X(29), q.Y(39) + 14, "1 cm + 1 ppm", "end", 9.5, MUT, True, halo=True))
    for k, c in cols.items():
        pts = [(d, 1e3 * h) for d, ok, acc, accw, h in _F17_RES["base"][k] if h is not None and ok > 0.05]
        o.append(q.line(pts, c=c, lw=2.2))
        for d, v in pts:
            o.append(D(q.X(d), q.Y(v), c, 2.6))
    o.append(T(14, 284, "線の色は、二重差に残る電離層の誤差の標準偏差（天頂の向き、基線長 1 km あたり）:", "start", 9.5, INK))
    o.append(T(14, 298, "緑 1 mm・金 2 mm・赤 4 mm（代表値の範囲から選んだ例）", "start", 9.5, INK))
    return SVG(700, 308, o, "基線長と、整数の決まりやすさ・フィックス解の誤差（GPS・Galileo・みちびきの 19 機、L1 だけ、10 エポック、6 節の例のモデル。各点は乱数の標本 1000 組）。")


F["e17_baseline"] = _f17_baseline_fig()
