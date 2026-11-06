# -*- coding: utf-8 -*-
# 01 章 GNSS とは何か の図
import numpy as _f01_np

# ---- 定数（本文と同じ値） ----
_F01_C = 299792458.0                 # 光の速さ [m/s]
_F01_MU = 3.986004418e14             # 地球の重力定数 μ [m³/s²]（WGS 84）
_F01_WE = 7.2921151467e-5            # 地球の自転の角速度 [rad/s]（WGS 84）
_F01_RE = 6371e3                     # 地球の平均の半径 [m]（図の地球の大きさ）
_F01_AW = 6378137.0                  # WGS 84 の赤道の半径 [m]
_F01_FW = 1 / 298.257223563          # WGS 84 の扁平率
_F01_E2 = _F01_FW * (2 - _F01_FW)
_F01_D2R = math.pi / 180
_F01_TOK = (35.681, 139.767, 40.0)   # 東京駅のあたり（緯度・経度 [°]・楕円体高 [m]）
_F01_SID = 2 * math.pi / _F01_WE     # 1 恒星日 [s]

# 平面の例（1・3 節。単位 km）: 受信機は原点
_F01_S = [(-12.0, 9.0), (5.0, 12.0), (15.0, 8.0)]
_F01_BAD = [(-4.0, 16.5), (0.0, 17.0), (4.0, 16.5)]
_F01_ERR = (0.6, -0.4, 0.5)          # 1 節の (a) の距離の誤差 [km]
_F01_B = _F01_C * 10e-6 / 1e3        # 3 節: 受信機の時計が 10 μs 進んだときの b [km]

# 衛星系の色（ガイドの約束: GPS 青・Galileo 緑・GLONASS 紫・BeiDou 金・みちびき 青緑）
_F01_SYSC = {"GPS": SIG, "GLONASS": PUR, "Galileo": GRN, "BeiDou": GLD, "QZSS": TEA}
_F01_SYSN = {"GPS": "GPS", "GLONASS": "GLONASS", "Galileo": "Galileo", "BeiDou": "BeiDou", "QZSS": "みちびき"}
_F01_SYSL = {"GPS": "G", "GLONASS": "R", "Galileo": "E", "BeiDou": "C", "QZSS": "J"}


# =====================================================================
# 軌道のモデル（円軌道の近似。みちびきの準天頂軌道だけは楕円）。w01.js の _w01_* と同じ計算
# =====================================================================
def _f01_geod2ecef(B, L, h):
    """緯度・経度 [°]・楕円体高 [m] → ECEF [m]（WGS 84）。"""
    B, L = B * _F01_D2R, L * _F01_D2R
    N = _F01_AW / math.sqrt(1 - _F01_E2 * math.sin(B) ** 2)
    return _f01_np.array([(N + h) * math.cos(B) * math.cos(L), (N + h) * math.cos(B) * math.sin(L), (N * (1 - _F01_E2) + h) * math.sin(B)])


def _f01_enu(B, L, h, p):
    """受信機（B, L, h）から見た点 p（ECEF [m]）の ENU [m]。"""
    d = _f01_np.asarray(p, float) - _f01_geod2ecef(B, L, h)
    b, l = B * _F01_D2R, L * _F01_D2R
    e = -math.sin(l) * d[0] + math.cos(l) * d[1]
    n = -math.sin(b) * math.cos(l) * d[0] - math.sin(b) * math.sin(l) * d[1] + math.cos(b) * d[2]
    u = math.cos(b) * math.cos(l) * d[0] + math.cos(b) * math.sin(l) * d[1] + math.sin(b) * d[2]
    return e, n, u


def _f01_elaz(B, L, h, p):
    """仰角 θ と方位角 α [°]（北から東へ）。"""
    e, n, u = _f01_enu(B, L, h, p)
    return math.degrees(math.atan2(u, math.hypot(e, n))), math.degrees(math.atan2(e, n)) % 360.0


def _f01_kep(a, e, i, w, Om, M):
    """軌道要素（a [m]、角は度）→ 慣性座標の位置 [m]。"""
    M = M * _F01_D2R
    E = M
    for _ in range(30):
        E = E - (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
    nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E / 2), math.sqrt(1 - e) * math.cos(E / 2))
    r = a * (1 - e * math.cos(E))
    u = w * _F01_D2R + nu
    O = Om * _F01_D2R
    inc = i * _F01_D2R
    return _f01_np.array([r * (math.cos(O) * math.cos(u) - math.sin(O) * math.sin(u) * math.cos(inc)),
                          r * (math.sin(O) * math.cos(u) + math.cos(O) * math.sin(u) * math.cos(inc)),
                          r * math.sin(u) * math.sin(inc)])


def _f01_walker(sysn, a, inc, P, S, F, Om0=0.0):
    """P 面 × S 機を等間隔に置いた円軌道（隣の面とは 360°·F/(P·S) ずらす）。"""
    out = []
    for p in range(P):
        for s in range(S):
            out.append(dict(sys=sysn, a=a, e=0.0, i=inc, w=0.0, Om=Om0 + 360.0 * p / P,
                            M=360.0 * s / S + 360.0 * F * p / (P * S), nm="%s%d" % (_F01_SYSL[sysn], p * S + s + 1)))
    return out


def _f01_const():
    """この章の近似の配置（時刻 0 で、慣性座標の x 軸が経度 0° を向く）。"""
    S = []
    S += _f01_walker("GPS", 26560e3, 55.0, 6, 4, 1)
    S += _f01_walker("GLONASS", 25510e3, 64.8, 3, 8, 1, 15.0)
    S += _f01_walker("Galileo", 29600e3, 56.0, 3, 8, 1, 40.0)
    S += _f01_walker("BeiDou", 27906e3, 55.0, 3, 8, 1, 70.0)
    for k in range(3):   # 準天頂軌道（3 機が同じ 8 の字をたどるように、面を 120° ずつ回し、8 時間ずつずらす）
        S.append(dict(sys="QZSS", a=42164e3, e=0.075, i=41.0, w=270.0, Om=226.0 + 120 * k, M=-120.0 * k, nm="J%d" % (k + 1)))
    S.append(dict(sys="QZSS", a=42164e3, geo=127.0, nm="J4"))   # 静止軌道（東経 127°）
    return S


def _f01_eci(s, t):
    """慣性座標の位置 [m]（時刻 t [s]）。"""
    if s.get("geo") is not None:
        th = _F01_WE * t + s["geo"] * _F01_D2R
        return _f01_np.array([s["a"] * math.cos(th), s["a"] * math.sin(th), 0.0])
    n = math.sqrt(_F01_MU / s["a"] ** 3) / _F01_D2R
    return _f01_kep(s["a"], s["e"], s["i"], s["w"], s["Om"], s["M"] + n * t)


def _f01_ecef(s, t):
    p = _f01_eci(s, t)
    th = _F01_WE * t
    return _f01_np.array([p[0] * math.cos(th) + p[1] * math.sin(th), -p[0] * math.sin(th) + p[1] * math.cos(th), p[2]])


# =====================================================================
# 図の補助
# =====================================================================
_F01_CID = [0]


def _f01_clip(x, y, w, h, body):
    """枠 (x, y, w, h) の外を切って描く（clipPath。名前は図ごとに変える）。"""
    _F01_CID[0] += 1
    cid = "f01cp%d" % _F01_CID[0]
    return ('<clipPath id="%s"><rect x="%g" y="%g" width="%g" height="%g"/></clipPath><g clip-path="url(#%s)">%s</g>'
            % (cid, x, y, w, h, cid, "".join(body) if isinstance(body, list) else body))


def _f01_pp(x, y, w, xr=(-21.0, 21.0), yr=(-10.0, 25.0)):
    """平面の例の座標系（km、縦横の目盛をそろえる）。"""
    h = w * (yr[1] - yr[0]) / (xr[1] - xr[0])
    return Plot(x, y, w, h, xr, yr)


def _f01_frame(p):
    return RECT(p.x, p.y, p.w, p.h, 4, SCR, LIN, 1.0)


def _f01_grid(p, step=5.0):
    o = []
    v = math.ceil(p.xr[0] / step) * step
    while v <= p.xr[1] + 1e-9:
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        v += step
    v = math.ceil(p.yr[0] / step) * step
    while v <= p.yr[1] + 1e-9:
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
        v += step
    return "".join(o)


def _f01_sat(x, y, c=SIG, s=1.0):
    """衛星の印（本体と 2 枚の太陽電池の板）。"""
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f01_rx(x, y, c=GRN):
    """受信機の印（地面に置いたアンテナ）。"""
    return W(x - 6, y + 6, x + 6, y + 6, c=c, lw=1.6) + W(x, y + 6, x, y, c=c, lw=1.4) + D(x, y - 1, c, 3.4)


def _f01_cross(x, y, c=ALI, r=5):
    return W(x - r, y - r, x + r, y + r, c=c, lw=2.2) + W(x - r, y + r, x + r, y - r, c=c, lw=2.2)


def _f01_cc(p0, r0, p1, r1):
    """2 つの円の交わる点（0・2 個）。"""
    p0 = _f01_np.asarray(p0, float); p1 = _f01_np.asarray(p1, float)
    d = float(_f01_np.linalg.norm(p1 - p0))
    a = (r0 ** 2 - r1 ** 2 + d ** 2) / (2 * d)
    h2 = r0 ** 2 - a ** 2
    if h2 < 0:
        return []
    h = math.sqrt(h2)
    m = p0 + a * (p1 - p0) / d
    pr = _f01_np.array([-(p1 - p0)[1], (p1 - p0)[0]]) / d
    return [m + h * pr, m - h * pr]


def _f01_view(az, el):
    """正射影の向き（az・el [°]）。返り値 (右, 上, 手前) の単位ベクトル。"""
    A, E = az * _F01_D2R, el * _F01_D2R
    r = _f01_np.array([-math.sin(A), math.cos(A), 0.0])
    u = _f01_np.array([-math.sin(E) * math.cos(A), -math.sin(E) * math.sin(A), math.cos(E)])
    d = _f01_np.array([math.cos(E) * math.cos(A), math.cos(E) * math.sin(A), math.sin(E)])
    return r, u, d


def _f01_ring3(C, Nn, rad, V, cx, cy, sc, c, lw=1.6, n=120, back="4 3"):
    """3 次元の円（中心 C、法線 Nn、半径 rad）の正射影。手前の半分を実線、奥の半分を破線で描く。"""
    r_, u_, d_ = V
    Nn = _f01_np.asarray(Nn, float) / _f01_np.linalg.norm(Nn)
    t0 = _f01_np.array([1.0, 0, 0]) if abs(Nn[0]) < 0.9 else _f01_np.array([0, 1.0, 0])
    U = _f01_np.cross(Nn, t0); U /= _f01_np.linalg.norm(U)
    Vv = _f01_np.cross(Nn, U)
    pts = []
    for k in range(n + 1):
        t = 2 * math.pi * k / n
        q = _f01_np.asarray(C, float) + rad * (math.cos(t) * U + math.sin(t) * Vv)
        pts.append((cx + sc * float(q @ r_), cy - sc * float(q @ u_), float(q @ d_) >= float(_f01_np.asarray(C, float) @ d_) - 1e-9))
    o, cur, front = [], [], None
    for x, y, f in pts:
        if front is None or f == front:
            cur.append((x, y))
        else:
            cur.append((x, y))
            o.append(PL(cur, c=c, lw=lw, dash=None if front else back))
            cur = [(x, y)]
        front = f
    if len(cur) >= 2:
        o.append(PL(cur, c=c, lw=lw, dash=None if front else back))
    return "".join(o)


def _f01_p3(q, V, cx, cy, sc):
    r_, u_, d_ = V
    q = _f01_np.asarray(q, float)
    return cx + sc * float(q @ r_), cy - sc * float(q @ u_)


# =====================================================================
# 1 節: 平面では円、空間では球の交わり
# =====================================================================
def _f01_trilat_fig():
    o = []
    S = [_f01_np.array(s) for s in _F01_S]
    r = [float(_f01_np.linalg.norm(s)) for s in S]
    cand = _f01_cc(S[0], r[0], S[1], r[1])
    far = max(cand, key=lambda q: _f01_np.linalg.norm(q))
    o.append(T(14, 17, "平面: 位置の分かった点 S1・S2・S3 からの距離の円（受信機は原点、単位 km）", "start", 11.5, INK, True))
    xs = [14, 245, 476]
    W_ = 210
    tit = ["(a) 点 1 つ: 円の上のどこか", "(b) 点 2 つ: 候補が 2 つ", "(c) 点 3 つ: 1 つに決まる"]
    for k in range(3):
        p = _f01_pp(xs[k], 40, W_)
        sc = p.w / (p.xr[1] - p.xr[0])
        o.append(T(p.x, 33, tit[k], "start", 10.5, INK, True))
        o.append(_f01_frame(p))
        body = [_f01_grid(p)]
        for i in range(k + 1):
            cc = GLD if k == 0 else SIG
            body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), r[i] * sc, c=cc, lw=1.8 if k == 0 else 1.5))
        o.append(_f01_clip(p.x, p.y, p.w, p.h, body))
        for i in range(k + 1):
            o.append(_f01_sat(p.X(S[i][0]), p.Y(S[i][1]), SIG, 0.8))
            o.append(T(p.X(S[i][0]) + (0 if i != 2 else -2), p.Y(S[i][1]) - 9, "S%d" % (i + 1), "middle", 9.5, SIG, True, halo=True))
        if k == 0:
            q = S[0] + r[0] * _f01_np.array([math.cos(-0.35), math.sin(-0.35)])
            o.append(W(p.X(S[0][0]), p.Y(S[0][1]), p.X(q[0]), p.Y(q[1]), c=GLD, lw=1.2, dash="4 3"))
            o.append(TX(p.X(2.5), p.Y(5.4), "r_1 = 15", "start", 10, GLD, True, halo=True))
            o.append(T(p.X(-7.5), p.Y(-7.6), "この円の上のどこか", "middle", 9.5, GLD, True, halo=True))
        if k == 1:
            for q, lab, dy in ((cand[0] if _f01_np.linalg.norm(cand[0]) < 1 else cand[1], "候補 (0, 0)", 14), (far, "候補 (−3.8, 21.6)", -8)):
                o.append(D(p.X(q[0]), p.Y(q[1]), GLD, 4.4))
                o.append(T(p.X(q[0]) + 6, p.Y(q[1]) + dy, lab, "start", 9.5, GLD, True, halo=True))
            o.append(W(p.X(S[0][0]), p.Y(S[0][1]), p.X(S[1][0]), p.Y(S[1][1]), c=MUT, lw=1, dash="3 3"))
        if k == 2:
            o.append(D(p.X(0), p.Y(0), GLD, 5))
            o.append(T(p.X(1.2), p.Y(-3.3), "(0, 0) に決まる", "start", 9.5, GLD, True, halo=True))
            o.append(_f01_cross(p.X(far[0]), p.Y(far[1])))
            o.append(T(p.X(far[0]) + 8, p.Y(far[1]) + 4, "S3 まで 23.2", "start", 9.5, ALI, True, halo=True))
    o.append(T(xs[0], 236, "S1 から 15 km の点の集まり", "start", 9.5, MUT))
    o.append(T(xs[1], 236, "S1–S2 の線（破線）について対称", "start", 9.5, MUT))
    o.append(T(xs[2], 236, "S3 の円は候補の 1 つだけを通る", "start", 9.5, MUT))
    # ---- 空間 ----
    y0 = 262
    o.append(W(14, y0 - 12, 686, y0 - 12, c=LIN, lw=0.8))
    o.append(T(14, y0 + 6, "空間: 距離の球（(d)(e) は形を示す図、(f) は大きさの比を実際のとおりにした図）", "start", 11.5, INK, True))
    V = _f01_view(25.0, 20.0)
    C1, C2, C3 = _f01_np.array([0, -1.0, 0]), _f01_np.array([0, 1.0, 0]), _f01_np.array([1.4, 0, 0])
    R12, R3 = 1.6, 1.35
    rc = math.sqrt(R12 ** 2 - 1.0)
    xq = (rc ** 2 + C3[0] ** 2 - R3 ** 2) / (2 * C3[0])
    zq = math.sqrt(rc ** 2 - xq ** 2)
    P1, P2 = _f01_np.array([xq, 0, zq]), _f01_np.array([xq, 0, -zq])
    for k in range(2):
        cx, cy, sc = xs[k] + 105, y0 + 130, 38.0
        o.append(T(xs[k], y0 + 28, ["(d) 球 2 つ: 交わりは円", "(e) 球 3 つ: 候補が 2 つ"][k], "start", 10.5, INK, True))
        o.append(RECT(xs[k], y0 + 36, 210, 186, 4, SCR, LIN, 1.0))
        body = []
        if k == 1:   # 3 つの中心を通る面（z = 0）
            q = [_f01_p3(v, V, cx, cy, sc) for v in ([-2.2, -2.8, 0], [2.6, -2.8, 0], [2.6, 2.8, 0], [-2.2, 2.8, 0])]
            body.append(PL(q + [q[0]], c=PUR, lw=1.0, dash="3 3", fill=PSOFT))
        cents = [(C1, R12, SIG, "1"), (C2, R12, SIG, "2")] + ([(C3, R3, TEA, "3")] if k == 1 else [])
        for C, R, c, nm in sorted(cents, key=lambda q: float(q[0] @ V[2])):
            x, y = _f01_p3(C, V, cx, cy, sc)
            body.append(CIRC(x, y, R * sc, c=c, lw=1.4, fill=soft(c)))
        o.append(_f01_clip(xs[k], y0 + 36, 210, 186, body))
        o.append(_f01_ring3([0, 0, 0], [0, 1, 0], rc, V, cx, cy, sc, GLD, 2.0))
        for C, R, c, nm in cents:
            x, y = _f01_p3(C, V, cx, cy, sc)
            o.append(_f01_sat(x, y, c, 0.7))
            o.append(T(x, y + (15 if nm == "3" else -8), "S" + nm, "middle", 9.5, c, True, halo=True))
        if k == 0:
            x, y = _f01_p3([0, 0, rc], V, cx, cy, sc)
            o.append(T(x + 4, y - 8, "交わりの円", "middle", 9.5, GLD, True, halo=True))
        else:
            for P, lab, dy in ((P1, "候補 1", -6), (P2, "候補 2", 14)):
                x, y = _f01_p3(P, V, cx, cy, sc)
                o.append(D(x, y, GLD, 4.6))
                o.append(T(x + 7, y + dy, lab, "start", 9.5, GLD, True, halo=True))
    o.append(T(xs[0], y0 + 238, "受信機は円の上のどこか", "start", 9.5, MUT))
    o.append(T(xs[1], y0 + 238, "中心を通る面（紫）について対称", "start", 9.5, MUT))
    # (f) 東京と GPS の衛星 3 つ（大きさの比は実際のとおり。3 つの衛星を通る面を真横から見る）
    S3d = [s for s in _f01_const() if s["sys"] == "GPS"]
    rx = _f01_geod2ecef(*_F01_TOK)
    vis = sorted(((_f01_elaz(*_F01_TOK, _f01_ecef(s, 0.0))[0], _f01_ecef(s, 0.0)) for s in S3d), key=lambda q: -q[0])[:3]
    Q = [q[1] for q in vis]
    nrm = _f01_np.cross(Q[1] - Q[0], Q[2] - Q[0]); nrm /= _f01_np.linalg.norm(nrm)
    if nrm @ Q[0] < 0:
        nrm = -nrm
    d0 = float(Q[0] @ nrm)
    Pm = rx + 2 * (d0 - float(rx @ nrm)) * nrm
    rgt = rx - (rx @ nrm) * nrm; rgt /= _f01_np.linalg.norm(rgt)
    to2 = lambda q: (float(q @ rgt), float(q @ nrm))
    xf = xs[2]
    o.append(T(xf, y0 + 28, "(f) GNSS の例: もう 1 つは宇宙の遠く", "start", 10.5, INK, True))
    o.append(RECT(xf, y0 + 36, 210, 186, 4, SCR, LIN, 1.0))
    ys = [to2(Pm)[1], -26560e3, 26560e3]
    ymax, ymin = max(ys) + 2500e3, min(ys) - 1500e3
    sc = 178.0 / (ymax - ymin)
    ox, oy = xf + 92, y0 + 40 + ymax * sc
    F2 = lambda q: (ox + sc * to2(q)[0], oy - sc * to2(q)[1])
    body = [CIRC(ox, oy, 26560e3 * sc, c=SIG, lw=1, dash="4 3")]
    body.append(W(xf, oy - d0 * sc, xf + 210, oy - d0 * sc, c=PUR, lw=1.2, dash="5 3"))
    body.append(CIRC(ox, oy, _F01_RE * sc, c=GRN, lw=1.3, fill=GSOFT))
    o.append(_f01_clip(xf, y0 + 36, 210, 186, body))
    for q in Q:
        x, y = F2(q)
        o.append(_f01_sat(x, y, SIG, 0.6))
    x, y = F2(rx)
    o.append(D(x, y, GLD, 4.2))
    o.append(T(x + 7, y + 13, "候補 1 = 東京", "start", 9.5, GLD, True, halo=True))
    xm, ym = F2(Pm)
    o.append(W(x, y, xm, ym, c=GLD, lw=1, dash="2 3"))
    o.append(D(xm, ym, GLD, 4.2))
    o.append(T(xm + 7, ym + 4, "候補 2", "start", 9.5, GLD, True, halo=True))
    o.append(T(xf + 5, oy - d0 * sc + 13, "3 つの衛星を通る面", "start", 9, PUR, False, halo=True))
    o.append(T(ox - 26560e3 * sc * 0.72, oy + 26560e3 * sc * 0.62 + 12, "GPS の軌道", "middle", 9, SIG, False, halo=True))
    o.append(T(ox, oy + 4, "地球", "middle", 9, GRN, True, halo=True))
    dist = float(_f01_np.linalg.norm(Pm))
    o.append(T(xf, y0 + 238, "候補 2 は地球の中心から %s km" % format(int(round(dist / 1e6) * 1000), ",").replace(",", " "), "start", 9.5, MUT))
    return SVG(700, y0 + 246, o, "三辺測量。上の段は平面で、受信機から位置の分かった点（後で衛星になる）までの距離が分かると、受信機はその点を中心とする円の上にいる。円が 2 つなら交わる点は 2 つ、3 つなら 1 つに決まる。下の段は空間で、円は球になる。球 2 つの交わりは円（金）、球 3 つなら 2 点で、2 点は 3 つの中心を通る面について対称である。(f) は 5 節の配置で、東京から見える GPS の衛星 3 つの距離の球が交わる 2 点を、3 つの衛星を通る面を真横から見て描いた（地球と軌道の大きさの比は実際のとおり）。もう 1 つの候補は地球から遠く離れた宇宙にあるので、受信機の位置ではないと分かる。")
F["e01_trilat"] = _f01_trilat_fig()


# =====================================================================
# 1 節: 距離に誤差があると — 三角形と、帯の重なり（点の並びで大きさが変わる）
# =====================================================================
def _f01_region(S, rho, sig, xr, yr, step=0.03):
    """|測った距離 − 点までの距離| ≤ sig をすべての点で満たす範囲（格子で調べる）。返り値 (行ごとの区間, 面積, 差し渡し)。"""
    xs = _f01_np.arange(xr[0], xr[1] + 1e-9, step)
    ys = _f01_np.arange(yr[0], yr[1] + 1e-9, step)
    X, Y = _f01_np.meshgrid(xs, ys)
    ok = _f01_np.ones_like(X, bool)
    for s, r in zip(S, rho):
        ok &= _f01_np.abs(_f01_np.hypot(X - s[0], Y - s[1]) - r) <= sig
    runs = []
    for j in range(len(ys)):
        row = ok[j]
        i = 0
        while i < len(xs):
            if row[i]:
                k = i
                while k < len(xs) and row[k]:
                    k += 1
                runs.append((ys[j], xs[i], xs[k - 1]))
                i = k
            else:
                i += 1
    P = _f01_np.c_[X[ok], Y[ok]]
    diam = 0.0
    for a in _f01_np.linspace(0, math.pi, 180, endpoint=False):
        pr = P @ _f01_np.array([math.cos(a), math.sin(a)])
        diam = max(diam, float(pr.max() - pr.min()))
    return runs, float(ok.sum()) * step * step, diam


def _f01_dirmark(p, S, c=SIG):
    """拡大した枠の縁に、受信機（原点）から見た点 S の向きを衛星の印で示す。"""
    o = []
    for i, s in enumerate(S):
        a = math.atan2(s[1], s[0])
        best = None
        for t in _f01_np.linspace(0, 40, 4001):
            x, y = t * math.cos(a), t * math.sin(a)
            if p.X(x) < p.x + 16 or p.X(x) > p.x + p.w - 16 or p.Y(y) < p.y + 13 or p.Y(y) > p.y + p.h - 12:
                break
            best = (x, y)
        x, y = p.X(best[0]), p.Y(best[1])
        o.append(_f01_sat(x, y, c, 0.62))
        o.append(T(x + (0 if abs(math.cos(a)) < 0.6 else (-15 if math.cos(a) > 0 else 15)), y + 14, "S%d" % (i + 1), "middle", 9, c, True, halo=True))
    return "".join(o)


def _f01_trierr_fig():
    o = []
    xr, yr = (-6.0, 6.0), (-5.0, 5.0)
    xs = [14, 245, 476]
    o.append(T(14, 17, "受信機のまわりを拡大した図（受信機は原点、単位 km。縁の印は各点の向き）", "start", 11.5, INK, True))
    tit = ["(a) 距離に誤差: 三角形ができる", "(b) 広がった配置・誤差 ±1 km", "(c) 偏った配置・誤差 ±1 km"]
    res = []
    for k in range(3):
        S = [_f01_np.array(s) for s in (_F01_S if k < 2 else _F01_BAD)]
        r = [float(_f01_np.linalg.norm(s)) for s in S]
        p = Plot(xs[k], 40, 210, 175, xr, yr)
        sc = p.w / (xr[1] - xr[0])
        o.append(T(p.x, 33, tit[k], "start", 10.5, INK, True))
        o.append(_f01_frame(p))
        body = [_f01_grid(p, 1.0)]
        body.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=FNT, lw=0.8))
        body.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=FNT, lw=0.8))
        if k == 0:
            rho = [r[i] + _F01_ERR[i] for i in range(3)]
            for i in range(3):
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), rho[i] * sc, c=SIG, lw=1.5))
            tri = []
            for i, j in ((0, 1), (1, 2), (0, 2)):
                cs = _f01_cc(S[i], rho[i], S[j], rho[j])
                tri.append(min(cs, key=lambda q: _f01_np.linalg.norm(q)))
            body.append(PL([(p.X(q[0]), p.Y(q[1])) for q in tri] + [(p.X(tri[0][0]), p.Y(tri[0][1]))], c=GLD, lw=1.4, fill=GOSOFT))
            o.append(_f01_clip(p.x, p.y, p.w, p.h, body))
            for q in tri:
                o.append(D(p.X(q[0]), p.Y(q[1]), GLD, 3.6))
            sides = [float(_f01_np.linalg.norm(tri[m] - tri[(m + 1) % 3])) for m in range(3)]
            res.append(sides)
            o.append(T(p.X(-5.7), p.Y(-3.6), "三角形の辺 %.1f〜%.1f km" % (min(sides), max(sides)), "start", 9.5, GLD, True, halo=True))
            o.append(T(p.X(-5.7), p.Y(-4.5), "誤差 +0.6・−0.4・+0.5 km", "start", 9.5, SIG, False, halo=True))
        else:
            runs, area, diam = _f01_region(S, r, 1.0, xr, yr)
            res.append((area, diam))
            for i in range(3):
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), r[i] * sc, c=SSOFT, lw=2.0 * sc))
            step = 0.03
            for yv, x0, x1 in runs:
                body.append(RECT(p.X(x0 - step / 2), p.Y(yv + step / 2), (x1 - x0 + step) * sc, step * sc + 0.4, 0, GLD, "none", 0, op=0.55))
            for i in range(3):
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), r[i] * sc, c=SIG, lw=1.0, dash="4 3"))
            o.append(_f01_clip(p.x, p.y, p.w, p.h, body))
            o.append(T(p.X(-5.7), p.Y(-4.5), "重なりの差し渡し %.1f km" % diam, "start", 9.5, GLD, True, halo=True))
        o.append(_f01_rx(p.X(0), p.Y(0)))
        o.append(_f01_dirmark(p, S))
    o.append(T(xs[0], 236, "2 つずつの円の交わる点（金）", "start", 9.5, MUT))
    o.append(T(xs[1], 236, "帯（青）が大きな角度で交わる", "start", 9.5, MUT))
    o.append(T(xs[2], 236, "帯が浅い角度で交わり、横に細長い", "start", 9.5, MUT))
    o.append(LEGL(14, 258, [(SIG, None, "測った距離の円"), (SIG, "4 3", "帯の中心（本当の距離）"), (GRN, None, "受信機の本当の位置")], 9.5, 16))
    o.append(RECT(470, 249, 12, 11, 2, GLD, "none", 0, op=0.55))
    o.append(T(488, 258, "受信機のいるかもしれない範囲", "start", 9.5, MUT))
    return SVG(700, 268, o, "距離に誤差があるときの交わり。(a) 1 節の配置で、測った距離が +0.6・−0.4・+0.5 km ずれていると、3 つの円は 1 点で交わらず、2 つずつの交わる点が三角形をつくる。(b) 誤差が ±1 km 以内なら、受信機は各点からの距離 ± 1 km の帯（ここでは測った距離が本当の距離に等しい場合）の重なりの中にいる。点が受信機から見て広い向きに散らばると、帯は大きな角度で交わり、重なりは小さい。(c) 点が同じような向き（上の 27° の範囲）に偏ると、同じ ±1 km でも重なりは横に細長く、差し渡しは (b) の 3 倍以上になる。")
F["e01_trierr"] = _f01_trierr_fig()


# =====================================================================
# 2 節: 電波の届く時間（地球と GPS の軌道の大きさの比は実際のとおり）
# =====================================================================
def _f01_dist_el(el_deg, a=26560e3, R=_F01_RE):
    """地表の受信機から、地平線からの角度 el の向きにある、半径 a の軌道の衛星までの距離 [m]。"""
    th = el_deg * _F01_D2R
    return -R * math.sin(th) + math.sqrt(a * a - (R * math.cos(th)) ** 2)


def _f01_tof_fig():
    o = []
    a, R = 26560e3, _F01_RE
    sc = 300.0 / 36000e3
    ox, oy = 112.0, 34 + 27500e3 * sc        # 地球の中心
    X = lambda x: ox + x * sc
    Y = lambda y: oy - y * sc
    o.append(T(14, 17, "(a) 地球と GPS の軌道（大きさの比は実際のとおり）", "start", 11.5, INK, True))
    body = [CIRC(ox, oy, a * sc, c=SIG, lw=1.2, dash="5 4"), CIRC(ox, oy, R * sc, c=GRN, lw=1.4, fill=GSOFT)]
    o.append(_f01_clip(14, 26, 330, 306, body))
    o.append(T(X(0), Y(-1200e3), "地球", "middle", 10, GRN, True))
    o.append(T(X(0), Y(-2600e3), "半径 6 371 km", "middle", 9.5, GRN))
    o.append(T(20, Y(24400e3), "GPS の軌道", "start", 9.5, SIG, True, halo=True))
    o.append(T(20, Y(24400e3) + 13, "半径 26 560 km", "start", 9.5, SIG, False, halo=True))
    rx, ry = X(0), Y(R)
    cols = {90: GLD, 30: PUR, 0: ALI}
    for el in (90, 30, 0):
        d = _f01_dist_el(el)
        th = el * _F01_D2R
        sx, sy = d * math.cos(th), R + d * math.sin(th)
        o.append(W(rx, ry, X(sx), Y(sy), c=cols[el], lw=1.6))
        o.append(_f01_sat(X(sx), Y(sy), SIG, 0.8))
    o.append(_f01_rx(rx, ry - 4))
    o.append(T(rx - 8, ry - 6, "受信機", "end", 9.5, GRN, True, halo=True))
    o.append(T(X(0) + 8, Y(26560e3) - 2, "真上", "start", 9.5, GLD, True, halo=True))
    d30 = _f01_dist_el(30)
    o.append(T(X(d30 * math.cos(math.pi / 6)) - 8, Y(R + d30 * 0.5) - 10, "地平線から 30°", "end", 9.5, PUR, True, halo=True))
    o.append(T(X(25785e3) - 2, Y(R) + 18, "地平線の近く", "end", 9.5, ALI, True, halo=True))
    o.append(DIM(98, Y(26560e3) + 6, 98, Y(R) - 4, None, c=MUT))
    o.append(T(92, Y(14500e3), "高さ", "end", 9.5, MUT, False, halo=True))
    o.append(T(92, Y(14500e3) + 13, "約 20 200 km", "end", 9.5, MUT, False, halo=True))
    # (b) 距離と届く時間
    o.append(T(368, 17, "(b) 衛星までの距離と、電波の届く時間", "start", 11.5, INK, True))
    p = Plot(452, 46, 210, 150, (0, 90), (0, 4))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    for v in (0, 20, 40, 60, 80):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 14, "%d" % v, "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "電波の届く時間 [ms]", "middle", 10, MUT))
    rows = [(90, "真上"), (30, "地平線から 30°"), (0, "地平線の近く")]
    for k, (el, lab) in enumerate(rows):
        d = _f01_dist_el(el)
        t = d / _F01_C * 1e3
        yy = p.y + 14 + k * 46
        o.append(T(p.x - 8, yy + 4, lab, "end", 10, cols[el], True))
        o.append(T(p.x - 8, yy + 18, "%s km" % format(int(round(d / 1e4) * 10), ",").replace(",", " "), "end", 9.5, MUT))
        o.append(RECT(p.x, yy - 7, p.X(t) - p.x, 16, 3, soft(cols[el]), cols[el], 1.2))
        o.append(T(p.X(t) + 6, yy + 5, "%.1f ms" % t, "start", 10, cols[el], True))
    o.append(T(368, 252, "距離 = 光の速さ × 届いた時間", "start", 10.5, INK, True))
    o.append(T(368, 270, "光は 1 ms に 299.8 km、1 μs に 299.8 m 進む。", "start", 10, MUT))
    o.append(T(368, 286, "真上と地平線の近くで、距離は 3 割ほど違う。", "start", 10, MUT))
    return SVG(700, 342, o, "GPS の衛星までの距離と、電波の届く時間（地球の半径 6 371 km、軌道の半径 26 560 km の円で計算）。(a) は地球と軌道の大きさの比を実際のとおりに描いた。真上の衛星までは 20 189 km で 67.3 ms、地平線から 30° の向きでは 22 795 km で 76.0 ms、地平線の近くでは 25 785 km で 86.0 ms かかる。")
F["e01_tof"] = _f01_tof_fig()


# =====================================================================
# 2 節: 往復で測るレーダーと、片道で測る GNSS
# =====================================================================
def _f01_clockico(x, y, c=INK, r=9):
    return CIRC(x, y, r, c=c, lw=1.4, fill=SCR) + W(x, y, x, y - r * 0.62, c=c, lw=1.3) + W(x, y, x + r * 0.5, y + r * 0.2, c=c, lw=1.3)


def _f01_oneway_fig():
    o = []
    # (a) レーダー
    o.append(T(14, 17, "(a) レーダー: 往復の時間を、同じ時計で測る", "start", 11.5, INK, True))
    o.append(RECT(30, 46, 58, 40, 6, SSOFT, SIG, 1.4))
    o.append(T(59, 70, "レーダー", "middle", 10, SIG, True))
    o.append(_f01_clockico(98, 40))
    o.append(T(112, 36, "時計 A", "start", 9.5, INK, True))
    o.append(RECT(300, 50, 22, 32, 3, MSOFT, MUT, 1.4))
    o.append(T(311, 100, "物", "middle", 10, MUT, True))
    o.append(ARR(92, 58, 296, 58, c=SIG, lw=1.6))
    o.append(ARR(296, 74, 92, 74, c=SIG, lw=1.6, dash="5 3"))
    o.append(T(194, 53, "出す", "middle", 9.5, SIG, False, halo=True))
    o.append(T(194, 88, "跳ね返って戻る", "middle", 9.5, SIG, False, halo=True))
    # 時間の軸
    ax = 360
    o.append(ARR(ax, 66, 680, 66, c=MUT, lw=1.2, head=6))
    o.append(T(682, 82, "時計 A の時刻", "end", 9.5, MUT))
    for x, lab in ((400, "出した時刻"), (620, "戻った時刻")):
        o.append(W(x, 58, x, 74, c=INK, lw=1.6))
        o.append(T(x, 50, lab, "middle", 9.5, INK, True))
    o.append(DIM(400, 96, 620, 96, None, c=SIG))
    o.append(T(510, 112, "差 = 往復の時間（時計 A の時刻がずれていても正しい）", "middle", 9.5, SIG, True))
    o.append(W(14, 130, 686, 130, c=LIN, lw=0.8))
    # (b) GNSS
    y0 = 140
    o.append(T(14, y0 + 17, "(b) GNSS: 片道の時間を、衛星の時計と受信機の時計で測る", "start", 11.5, INK, True))
    o.append(_f01_sat(54, y0 + 54, SIG, 1.0))
    o.append(T(54, y0 + 76, "衛星", "middle", 10, SIG, True))
    o.append(_f01_clockico(88, y0 + 40, GRN))
    o.append(T(100, y0 + 36, "原子時計（正しい）", "start", 9.5, GRN, True))
    o.append(_f01_rx(300, y0 + 64))
    o.append(T(300, y0 + 86, "受信機", "middle", 10, GRN, True))
    o.append(_f01_clockico(326, y0 + 50, ALI))
    o.append(TX(250, y0 + 106, "水晶の時計（δt_r 進んでいる）", "start", 9.5, ALI, True))
    o.append(ARR(76, y0 + 56, 288, y0 + 62, c=SIG, lw=1.6))
    o.append(TX(150, y0 + 52, "時刻 t_{tx,i} の印", "start", 9.5, SIG, False, halo=True))
    # 2 本の時間の軸
    a1, a2 = y0 + 62, y0 + 118
    o.append(ARR(ax, a1, 682, a1, c=GRN, lw=1.2, head=6))
    o.append(T(682, a1 - 7, "基準の時刻", "end", 9.5, GRN, True))
    o.append(ARR(ax, a2, 682, a2, c=ALI, lw=1.2, head=6))
    o.append(T(682, a2 - 7, "受信機の時計", "end", 9.5, ALI, True))
    xt, xr, dx = 400, 548, 56
    o.append(W(xt, a1 - 8, xt, a1 + 8, c=INK, lw=1.6))
    o.append(TX(xt, a1 - 12, "送った t_{tx,i}", "middle", 9.5, INK, True))
    o.append(W(xr, a1 - 8, xr, a1 + 8, c=INK, lw=1.6))
    o.append(TX(xr, a1 - 12, "届いた t_{rx}", "middle", 9.5, INK, True))
    o.append(DIM(xt, a1 + 16, xr, a1 + 16, None, c=GRN))
    o.append(T((xt + xr) / 2, a1 + 30, "本当に届くまでの時間", "middle", 9.5, GRN, True, halo=True))
    o.append(W(xr, a1 + 8, xr, a2 + 8, c=FNT, lw=1, dash="3 3"))
    o.append(W(xr + dx, a2 - 8, xr + dx, a2 + 8, c=ALI, lw=1.8))
    o.append(TX(xr + dx, a2 + 20, "読み t_{rx} + δt_r", "middle", 9.5, ALI, True, halo=True))
    o.append(DIM(xr, a2 - 12, xr + dx, a2 - 12, None, c=ALI))
    o.append(TX(xr + dx / 2, a2 - 17, "δt_r", "middle", 9.5, ALI, True, halo=True))
    o.append(DIM(xt, a2 + 30, xr + dx, a2 + 30, None, c=ALI))
    o.append(T((xt + xr + dx) / 2, a2 + 44, "受信機が測る時間", "middle", 9.5, ALI, True, halo=True))
    o.append(TX(14, y0 + 136, "受信機が測る時間 = 本当の時間 + δt_r なので、", "start", 10, INK))
    o.append(T(14, y0 + 152, "時計のずれがそのまま距離の誤差になる（3 節）", "start", 10, INK))
    return SVG(700, y0 + 172, o, "往復と片道。(a) レーダーは、電波を出した時刻と戻った時刻を同じ時計で測るので、時計の時刻がずれていても往復の時間は正しい。(b) GNSS は、送った時刻を衛星の時計（原子時計で、ずれは補正できる）で決め、届いた時刻を受信機の時計（水晶）で測る。受信機の時計が δt<sub>r</sub> 進んでいると、測った時間は本当の時間より δt<sub>r</sub> 長くなる。")
F["e01_oneway"] = _f01_oneway_fig()


# =====================================================================
# 2 節: 時計の進み方の違いで、時刻のずれがたまる
# =====================================================================
def _f01_clocks_fig():
    o = []
    p = Plot(86, 22, 420, 212, (1, 1e5), (1e-13, 10), xlog=True, ylog=True)
    xt = [1, 10, 60, 600, 3600, 86400]
    xl = ["1 s", "10 s", "1 分", "10 分", "1 時間", "1 日"]
    for v in [10.0 ** k for k in range(-13, 2)]:
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
    for v in xt:
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    o.append(W(p.x + p.w, p.y, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    for v, s in zip(xt, xl):
        o.append(W(p.X(v), p.y + p.h, p.X(v), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, s, "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 32, "時計を合わせてからの時間（対数の目盛）", "middle", 10, MUT))
    for k, s in ((-12, "1 ps"), (-9, "1 ns"), (-6, "1 μs"), (-3, "1 ms"), (0, "1 s")):
        v = 10.0 ** k
        o.append(W(p.x - 4, p.Y(v), p.x, p.Y(v), c=MUT, lw=1))
        o.append(T(p.x - 7, p.Y(v) + 3.5, s, "end", 9.5, MUT))
    o.append(T(p.x - 54, p.y + p.h / 2, "たまった時刻のずれ", "middle", 10, MUT, rot=-90))
    for d, s in ((1e-3, "1 mm"), (1.0, "1 m"), (1e3, "1 km"), (1e6, "1000 km")):
        v = d / _F01_C
        o.append(W(p.x + p.w, p.Y(v), p.x + p.w + 4, p.Y(v), c=MUT, lw=1))
        o.append(T(p.x + p.w + 7, p.Y(v) + 3.5, s, "start", 9.5, MUT))
    o.append(T(p.x + p.w + 62, p.y + p.h / 2, "距離にして", "middle", 10, MUT, rot=90))
    # 数 m の精度に要る 10 ns
    o.append(W(p.x, p.Y(1e-8), p.x + p.w, p.Y(1e-8), c=GRN, lw=1.2, dash="6 3"))
    o.append(T(p.X(150), p.Y(1e-8) - 5, "数 m の精度に要る 10 ns（3 m）", "start", 9.5, GRN, True, halo=True))
    lines = [(1e-13, GRN, "原子時計の例（10 兆分の 1）"), (5e-7, SIG, "水晶の例（100 万分の 0.5）"), (2e-5, ALI, "安い水晶の例（100 万分の 20）")]
    for f, c, lab in lines:
        pts = [(t, f * t) for t in (1, 1e5)]
        o.append(p.clip(pts, c=c, lw=2.2))
    o.append(D(p.X(86400), p.Y(1e-13 * 86400), GRN, 4))
    o.append(T(p.X(86400) - 6, p.Y(1e-13 * 86400) + 30, "1 日で 8.6 ns（2.6 m）", "end", 9.5, GRN, True, halo=True))
    o.append(D(p.X(1), p.Y(5e-7), SIG, 4))
    o.append(T(p.X(1) + 8, p.Y(5e-7) + 14, "1 秒で 0.5 μs（150 m）", "start", 9.5, SIG, True, halo=True))
    o.append(D(p.X(60), p.Y(2e-5 * 60), ALI, 4))
    o.append(T(p.X(60) - 8, p.Y(2e-5 * 60) - 7, "1 分で 1.2 ms（360 km）", "end", 9.5, ALI, True, halo=True))
    yy = 290
    for k, (f, c, lab) in enumerate(lines):
        o.append(W(16 + k * 226, yy - 4, 40 + k * 226, yy - 4, c=c, lw=2.2))
        o.append(T(46 + k * 226, yy, lab, "start", 9.5, MUT))
    return SVG(700, 300, o, "時計の進み方が、正しい時計からわずかに違うと、時刻のずれは時間に比例してたまる（進み方の違いは例の値）。原子時計の例では 1 日たっても 8.6 ns だが、受信機の水晶の時計では 1 秒で 0.5 μs（距離にして 150 m）もずれる。位置を数 m の精度で求めるのに要る 10 ns（緑の破線）を、水晶の時計は 1 秒もたたずに超える。右の目盛は、時刻のずれに光の速さを掛けた距離である。")
F["e01_clocks"] = _f01_clocks_fig()
