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
    o.append(TX(bx, yb + 134, "Φ = λφ = 237.38 m", "start", 10, INK, True))
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
    o.append(T(X(t0 - A / f1 ** 2) - 4, yc - 44, "山は早く届く（位相が進む）", "end", 9.5, SIG, True, halo=True))
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
def _f17_ddex():
    """3 節の数値の例の各項 [m]。キーは (受信機, 衛星)。"""
    B, L, h = GNSS_TOKYO
    pref = _f17_np.array(geod2ecef(B, L, h))
    b, l = math.radians(B), math.radians(L)
    east = _f17_np.array([-math.sin(l), math.cos(l), 0.0])
    prov = pref + 1000.0 * east
    sats = {s["nm"]: s for s in gnss_const()}
    el = {"G9": 74.9, "G22": 45.6}
    out = {}
    clk = {"ref": 0.4e-3, "rov": -0.25e-3}
    sclk = {"G9": 25e-6, "G22": -60e-6}
    Ns = {("ref", "G9"): 31, ("rov", "G9"): 5, ("ref", "G22"): -12, ("rov", "G22"): 44}
    gradI = {"G9": 0.001, "G22": 0.002}           # 移動局の電離層の遅れが、基準局より大きい分 [m]（例の値）
    for rcv, pr in (("ref", pref), ("rov", prov)):
        for nm in ("G9", "G22"):
            ps = _f17_np.array(sat_ecef(sats[nm], 0.0))
            r = float(_f17_np.linalg.norm(ps - pr))
            e = math.radians(el[nm])
            mI = 1 / math.sqrt(1 - (6371.0 * math.cos(e) / (6371.0 + 350.0)) ** 2)
            mT = 1.001 / math.sqrt(0.002001 + math.sin(e) ** 2)
            I = 40.3 * 25e16 / _F17_F1 ** 2 * mI + (gradI[nm] if rcv == "rov" else 0.0)
            Tt = 2.41 * mT
            out[(rcv, nm)] = dict(r=r, b=_F17_C * clk[rcv], s=-_F17_C * sclk[nm], I=-I, T=Tt, N=_F17_LAM * Ns[(rcv, nm)], n=Ns[(rcv, nm)])
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
    return SVG(700, yb + 30, o, "二重差の数値の例（基準局は東京、移動局はその 1 km 東。時計のずれ・整数値バイアス・電離層の差は例の値、距離は 1 章の配置の時刻 0）。雑音は省いた。")


F["e17_ddnum"] = _f17_ddnum_fig()
