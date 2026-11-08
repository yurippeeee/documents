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
    for k in range(3):   # 準天頂軌道（3 機が同じ 8 の字をたどるように、面を 120° ずつ回し、8 時間ずつずらす。8 の字の中心は東経 136°。時刻 0 で 3 機が離れて見える位相にした）
        S.append(dict(sys="QZSS", a=42164e3, e=0.075, i=41.0, w=270.0, Om=166.0 + 120 * k, M=60.0 - 120.0 * k, nm="J%d" % (k + 1)))
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


def _f01_ctxw(segs, sz=13):
    """_f01_ctx で書く式の幅の見積もり。"""
    return sum(_tx_adv(t, sz * _TX_SMALL[k]) if k in _TX_SMALL else _tx_adv(t, sz) for txt, c in segs for k, t in _tx_tokens(txt))


def _f01_ctx(x, y, segs, sz=13, b=True, fit=None):
    """色分けした式を 1 つの text 要素で書く。segs = [(TX の書き方の文字, 色), ...]。
    fit を与えると、全体の幅をその値にそろえる（根号の上の線を合わせるため）。返り値 (svg, 見積もった幅)。"""
    toks = []
    for txt, c in segs:
        for kind, t in _tx_tokens(txt):
            toks.append((kind, t, c))
    w = sum(_tx_adv(t, sz * _TX_SMALL[k]) if k in _TX_SMALL else _tx_adv(t, sz) for k, t, c in toks)
    if _CHECK:
        _BOXES.append((x, y - sz * 0.82, x + (fit or w), y + sz * 0.22 + 2, "".join(t for _, t, _ in toks)))
    tl = ' textLength="%g" lengthAdjust="spacingAndGlyphs"' % round(fit, 2) if fit else ""
    o = ['<text x="%g" y="%g" font-size="%g" font-family="var(--sans)" font-weight="%s"%s>' % (round(x, 2), round(y, 2), sz, "700" if b else "400", tl)]
    cur = 0.0
    for kind, t, c in toks:
        want = 3.0 if kind == "sub" else (-sz * 0.38 if kind == "sup" else (-sz * 0.18 if kind == "supsub" else 0.0))
        dy = want - cur
        cur = want
        fs = ' font-size="%g"' % round(sz * _TX_SMALL[kind], 2) if kind in _TX_SMALL else ""
        o.append('<tspan fill="%s"%s%s>%s</tspan>' % (c, (' dy="%g"' % round(dy, 2)) if abs(dy) > 1e-9 else "", fs, E(t)))
    o.append("</text>")
    return "".join(o), (fit or w)


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
    o.append(T(xf + 5, oy - d0 * sc + 13, "3 つの衛星を通る面", "start", 9.5, PUR, False, halo=True))
    o.append(T(ox - 26560e3 * sc * 0.72, oy + 26560e3 * sc * 0.62 + 12, "GPS の軌道", "middle", 9.5, SIG, False, halo=True))
    o.append(T(ox, oy + 4, "地球", "middle", 9.5, GRN, True, halo=True))
    dist = float(_f01_np.linalg.norm(Pm))
    o.append(T(xf, y0 + 238, "候補 2 は地球の中心から %s km" % format(int(round(dist / 1e6) * 1000), ",").replace(",", " "), "start", 9.5, MUT))
    return SVG(700, y0 + 246, o, "三辺測量（上の段: 平面、下の段: 空間）。(f) は、5 節の配置で東京から見える GPS の衛星 3 つの距離の球が交わる 2 点を、3 つの衛星を通る面を真横から見て描いた（地球と軌道の大きさの比は実際のとおり）。")
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
    """拡大した枠の縁に、受信機（原点）から見た点 S の向きを衛星の印で示す。向きが近いときは印を小さくする。"""
    o = []
    angs = sorted(math.atan2(s[1], s[0]) for s in S)
    small = min(abs(angs[k + 1] - angs[k]) for k in range(len(angs) - 1)) < 0.35
    for i, s in enumerate(S):
        a = math.atan2(s[1], s[0])
        best = None
        for t in _f01_np.linspace(0, 40, 4001):
            x, y = t * math.cos(a), t * math.sin(a)
            if p.X(x) < p.x + 16 or p.X(x) > p.x + p.w - 16 or p.Y(y) < p.y + 13 or p.Y(y) > p.y + p.h - 12:
                break
            best = (x, y)
        x, y = p.X(best[0]), p.Y(best[1])
        o.append(_f01_sat(x, y, c, 0.45 if small else 0.62))
        o.append(T(x + (0 if abs(math.cos(a)) < 0.6 else (-15 if math.cos(a) > 0 else 15)), y + 14, "S%d" % (i + 1), "middle", 9.5, c, True, halo=True))
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
    return SVG(700, 268, o, "距離に誤差があるときの交わり（1 節の配置。(b)・(c) の帯は、測った距離が本当の距離に等しい場合。(c) は点を上の 27° の範囲に偏らせた配置）。")
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
    return SVG(700, 342, o, "GPS の衛星までの距離と、電波の届く時間（地球の半径 6 371 km、軌道の半径 26 560 km の円で計算。(a) は地球と軌道の大きさの比を実際のとおりに描いた）。")
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
    return SVG(700, y0 + 172, o, "往復（レーダー）と片道（GNSS）。衛星の時計は、補正した後は正しいとみなした。")
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
    return SVG(700, 300, o, "時計の進み方の違いでたまる、時刻のずれ（進み方の違いは例の値。右の目盛りは、時刻のずれに光の速さを掛けた距離）。")
F["e01_clocks"] = _f01_clocks_fig()


# =====================================================================
# 3 節: 擬似距離の円は一斉に膨らむ（平面の例、受信機の時計が 10 μs 進む）
# =====================================================================
def _f01_inflate_fig():
    o = []
    S = [_f01_np.array(s) for s in _F01_S]
    r = [float(_f01_np.linalg.norm(s)) for s in S]
    rho = [x + _F01_B for x in r]
    xs = [14, 245, 476]
    xr, yr = (-16.0, 17.0), (-8.0, 14.0)
    o.append(T(14, 17, "平面の例（単位 km）。受信機の時計が 10 μs 進んでいると b = 3.0 km", "start", 11.5, INK, True))
    tit = ["(a) 本当の距離 r_i の円", "(b) 擬似距離 ρ_i = r_i + b の円", "(c) ρ_i − b̂ の円を描き直す"]
    for k in range(3):
        p = _f01_pp(xs[k], 40, 210, xr, yr)
        sc = p.w / (xr[1] - xr[0])
        o.append(TX(p.x, 33, tit[k], "start", 10.5, INK, True))
        o.append(_f01_frame(p))
        body = [_f01_grid(p)]
        if k == 0:
            for i in range(3):
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), r[i] * sc, c=GRN, lw=1.5))
        elif k == 1:
            for i in range(3):
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), r[i] * sc, c=GRN, lw=1.0, dash="3 3"))
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), rho[i] * sc, c=SIG, lw=1.6))
        else:
            for i in range(3):
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), (rho[i] - 1.5) * sc, c=GLD, lw=1.1, dash="4 3"))
                body.append(CIRC(p.X(S[i][0]), p.Y(S[i][1]), (rho[i] - _F01_B) * sc, c=GLD, lw=1.8))
        o.append(_f01_clip(p.x, p.y, p.w, p.h, body))
        for i in range(3):
            o.append(_f01_sat(p.X(S[i][0]), p.Y(S[i][1]), SIG, 0.75))
            o.append(T(p.X(S[i][0]), p.Y(S[i][1]) - 8, "S%d" % (i + 1), "middle", 9.5, SIG, True, halo=True))
        if k == 1:
            for i, j in ((0, 1), (1, 2), (0, 2)):
                q = min(_f01_cc(S[i], rho[i], S[j], rho[j]), key=lambda v: _f01_np.linalg.norm(v))
                o.append(D(p.X(q[0]), p.Y(q[1]), SIG, 3.2))
            o.append(_f01_rx(p.X(0), p.Y(0)))
            o.append(T(p.X(-15.4), p.Y(-6.6), "1 点で交わらない", "start", 9.5, SIG, True, halo=True))
        else:
            o.append(D(p.X(0), p.Y(0), GLD if k == 2 else GRN, 4.6))
            o.append(T(p.X(-15.4), p.Y(-6.6), "(0, 0) で交わる" if k == 0 else "b̂ = 3.0 km で 1 点に戻る", "start", 9.5, GRN if k == 0 else GLD, True, halo=True))
    o.append(T(xs[0], 196, "時計が正しければ 1 点で交わる", "start", 9.5, MUT))
    o.append(T(xs[1], 196, "どの円も 3.0 km 大きい（破線は (a)）", "start", 9.5, MUT))
    o.append(T(xs[2], 196, "破線 b̂ = 1.5 km、実線 b̂ = 3.0 km", "start", 9.5, MUT))
    o.append(TX(xs[0], 214, "r_1, r_2, r_3 = 15, 13, 17 km", "start", 9.5, GRN))
    o.append(TX(xs[1], 214, "ρ_1, ρ_2, ρ_3 = 18.0, 16.0, 20.0 km", "start", 9.5, SIG))
    o.append(TX(xs[2], 214, "全部から同じ b̂ を引く", "start", 9.5, GLD))
    return SVG(700, 224, o, "受信機の時計のずれと、擬似距離の円（1 節の平面の例。受信機は原点）。")
F["e01_inflate"] = _f01_inflate_fig()


# =====================================================================
# 3 節: 4 つの擬似距離の式と未知数（東京から見える GPS の衛星 4 つの例）
# =====================================================================
_F01_EQ4 = ["G9", "G6", "G2", "G3"]


def _f01_eqs_fig():
    o = []
    con = {s["nm"]: s for s in _f01_const()}
    rx = _f01_geod2ecef(*_F01_TOK)
    sats = []
    for nm in _F01_EQ4:
        q = _f01_ecef(con[nm], 0.0)
        el, az = _f01_elaz(*_F01_TOK, q)
        sats.append((nm, el, az, float(_f01_np.linalg.norm(q - rx))))
    bkm = _F01_C * 1e-3 / 1e3
    # 左: 空の 4 つの衛星（南から見た図。横は東西、縦は高さの向き）
    o.append(T(14, 17, "(a) 4 つの衛星までの擬似距離", "start", 11.5, INK, True))
    cx, cy, R = 150, 196, 118
    o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g" % (cx - R, cy, R, R, cx + R, cy), c=FNT, lw=1, dash="3 4"))
    o.append(W(cx - R - 12, cy, cx + R + 12, cy, c=GRN, lw=1.6))
    o.append(T(cx - R - 8, cy + 14, "西", "middle", 9.5, MUT))
    o.append(T(cx + R + 8, cy + 14, "東", "middle", 9.5, MUT))
    for k, (nm, el, az, d) in enumerate(sats):
        x = cx + R * math.cos(el * _F01_D2R) * math.sin(az * _F01_D2R)
        y = cy - R * math.sin(el * _F01_D2R)
        o.append(W(cx, cy - 6, x, y, c=SIG, lw=1.5))
        mx, my = cx + (x - cx) * 0.55, cy - 6 + (y - cy + 6) * 0.55
        o.append(TX(mx + (8 if x >= cx else -8), my + 4, "ρ_%d" % (k + 1), "start" if x >= cx else "end", 10.5, SIG, True, halo=True))
        o.append(_f01_sat(x, y, PUR, 0.8))
        o.append(T(x, y - 9, "衛星 %d" % (k + 1), "middle", 9.5, PUR, True, halo=True))
    o.append(_f01_rx(cx, cy - 6))
    o.append(T(cx, cy + 16, "受信機 (x, y, z)、時計のずれ b", "middle", 9.5, GLD, True))
    # 右: 式（色分け）
    xe = 318
    o.append(T(xe, 17, "(b) 式と未知数", "start", 11.5, INK, True))
    y1 = 58
    sv, w1 = _f01_ctx(xe, y1, [("ρ_i", SIG), (" = ", INK)], 13)
    o.append(sv)
    xr0 = xe + w1 + 2
    xr1 = xr0 + 14
    rad = [("(", INK), ("x_i", PUR), (" − ", INK), ("x", GLD), (")^2 + (", INK), ("y_i", PUR), (" − ", INK), ("y", GLD), (")^2 + (", INK), ("z_i", PUR), (" − ", INK), ("z", GLD), (")^2", INK)]
    sv, w2 = _f01_ctx(xr1, y1, rad, 13, fit=_f01_ctxw(rad, 13))
    o.append(sv)
    o.append(W(xr0, y1 - 6, xr0 + 3, y1 - 8, xr0 + 7, y1 + 3, xr0 + 11, y1 - 15, xr1 + w2 + 2, y1 - 15, c=INK, lw=1.2))
    sv, w3 = _f01_ctx(xr1 + w2 + 4, y1, [(" + ", INK), ("b", GLD)], 13)
    o.append(sv)
    o.append(T(xe, y1 + 22, "（i = 1, 2, 3, 4。衛星 1 つにつき式が 1 つ）", "start", 9.5, MUT))
    leg = [(SIG, "受信機が測る値（擬似距離）", "4 つ"), (PUR, "衛星が送る軌道の値から分かる位置", "4 組"), (GLD, "未知数（受信機の位置と時計のずれ）", "4 つ")]
    for k, (c, lab, n) in enumerate(leg):
        yy = y1 + 46 + k * 19
        o.append(RECT(xe, yy - 10, 12, 12, 2, soft(c), c, 1.2))
        o.append(T(xe + 18, yy, lab, "start", 10, c, True))
        o.append(T(xe + 280, yy, n, "start", 10, c, True))
    o.append(T(xe, y1 + 114, "未知数 4 つ ＝ 式 4 つ → 衛星が 4 つ要る", "start", 10.5, INK, True))
    # 下: 数値の例
    yt = 242
    o.append(T(xe, yt - 42, "例: 東京、受信機の時計が 1 ms 進む（b = 299.792 km）", "start", 10, INK, True))
    hd = [("衛星", xe, "start"), ("本当の距離 r_i", xe + 150, "end"), ("擬似距離 ρ_i", xe + 260, "end"), ("ρ_i − r_i", xe + 362, "end")]
    for txt, x, a_ in hd:
        o.append(TX(x, yt - 20, txt, a_, 9.5, MUT, True))
    o.append(W(xe, yt - 14, xe + 364, yt - 14, c=LIN, lw=0.8))
    for k, (nm, el, az, d) in enumerate(sats):
        yy = yt + k * 16
        o.append(T(xe, yy, "%d（%s）" % (k + 1, nm), "start", 9.5, PUR))
        o.append(T(xe + 150, yy, "%s km" % ("{:,.3f}".format(d / 1e3).replace(",", " ")), "end", 9.5, GRN))
        o.append(T(xe + 260, yy, "%s km" % ("{:,.3f}".format(d / 1e3 + bkm).replace(",", " ")), "end", 9.5, SIG))
        o.append(T(xe + 362, yy, "%.3f km" % bkm, "end", 9.5, GLD, True))
    return SVG(700, 306, o, "4 つの衛星の擬似距離の式（衛星は 5 節の配置で東京から見える GPS の衛星 4 つ。図は南から見た向き。G9 などは、この章の配置で付けた衛星の名前）。")
F["e01_eqs"] = _f01_eqs_fig()


# =====================================================================
# 3 節: 差をとると b が消える — 双曲線の交わり
# =====================================================================
def _f01_branch(Si, Sj, ri, rj, side, bmin=-40.0, n=500):
    """b̂ を変えたときの、円 i と円 j の交わる点の道（side = 0, 1 で 2 つの点のどちらか）。"""
    bmax = (ri + rj - float(_f01_np.linalg.norm(_f01_np.asarray(Sj) - _f01_np.asarray(Si)))) / 2 - 1e-9
    pts = []
    for bh in _f01_np.linspace(bmin, bmax, n):
        cs = _f01_cc(Si, ri - bh, Sj, rj - bh)
        if cs:
            pts.append(tuple(cs[side]))
    return pts


def _f01_hyper_fig():
    o = []
    S = [_f01_np.array(s) for s in _F01_S]
    r = [float(_f01_np.linalg.norm(s)) for s in S]
    rho = [x + _F01_B for x in r]
    # (a) 広い範囲
    o.append(T(14, 17, "(a) 擬似距離の差が一定の点（双曲線）", "start", 11.5, INK, True))
    p = _f01_pp(14, 28, 300, (-24.0, 24.0), (-12.0, 30.0))
    o.append(_f01_frame(p))
    body = [_f01_grid(p)]
    for (i, j), c in (((0, 1), PUR), ((1, 2), TEA)):
        for side in (0, 1):
            body.append(p.line(_f01_branch(S[i], S[j], rho[i], rho[j], side), c=c, lw=2.0))
    body.append(W(p.X(S[0][0]), p.Y(S[0][1]), p.X(S[1][0]), p.Y(S[1][1]), c=PUR, lw=0.8, dash="2 3"))
    body.append(W(p.X(S[1][0]), p.Y(S[1][1]), p.X(S[2][0]), p.Y(S[2][1]), c=TEA, lw=0.8, dash="2 3"))
    o.append(_f01_clip(p.x, p.y, p.w, p.h, body))
    for i in range(3):
        o.append(_f01_sat(p.X(S[i][0]), p.Y(S[i][1]), SIG, 0.7))
        o.append(T(p.X(S[i][0]), p.Y(S[i][1]) + 15, "S%d" % (i + 1), "middle", 9.5, SIG, True, halo=True))
    o.append(D(p.X(0), p.Y(0), GLD, 4.6))
    o.append(T(p.X(0.8), p.Y(-1.8), "受信機 (0, 0)", "start", 9.5, GLD, True, halo=True))
    o.append(RECT(p.X(-3.5), p.Y(3.5), 7 * p.w / 48, 7 * p.w / 48, 0, "none", INK, 1, dash="3 2"))
    o.append(TX(p.X(-23), p.Y(27.5), "ρ_1 − ρ_2 = r_1 − r_2 = 2 km", "start", 9.5, PUR, True, halo=True))
    o.append(TX(p.X(-23), p.Y(24.8), "ρ_2 − ρ_3 = r_2 − r_3 = −4 km", "start", 9.5, TEA, True, halo=True))
    # (b) 受信機のまわりを拡大: b̂ を 1 km ずつ変えたときの交わる点
    o.append(T(342, 17, "(b) 受信機のまわり（点の数字は b̂ [km]）", "start", 11.5, INK, True))
    q = Plot(372, 28, 300, 300, (-3.5, 3.5), (-3.5, 3.5))
    o.append(_f01_frame(q))
    body = [_f01_grid(q, 1.0)]
    for (i, j), c in (((0, 1), PUR), ((1, 2), TEA)):
        body.append(q.line(_f01_branch(S[i], S[j], rho[i], rho[j], 1 if (i, j) == (0, 1) else 1, bmin=-6, n=600), c=c, lw=2.0))
        body.append(q.line(_f01_branch(S[i], S[j], rho[i], rho[j], 0, bmin=-6, n=600), c=c, lw=2.0))
    sc = q.w / 7.0
    for i in range(3):
        body.append(CIRC(q.X(S[i][0]), q.Y(S[i][1]), r[i] * sc, c=GLD, lw=1.2, dash="5 3"))
    o.append(_f01_clip(q.x, q.y, q.w, q.h, body))
    for (i, j), c, off in (((0, 1), PUR, (8, 4)), ((1, 2), TEA, (-8, 4))):
        for bh in range(0, 7):
            cs = _f01_cc(S[i], rho[i] - bh, S[j], rho[j] - bh)
            v = min(cs, key=lambda w: _f01_np.linalg.norm(w))
            if abs(v[0]) > 3.4 or abs(v[1]) > 3.4:
                continue
            o.append(D(q.X(v[0]), q.Y(v[1]), c, 3.4))
            if bh != 3:
                o.append(T(q.X(v[0]) + off[0], q.Y(v[1]) + off[1], "%d" % bh, "start" if off[0] > 0 else "end", 9.5, c, True, halo=True))
    o.append(D(q.X(0), q.Y(0), GLD, 5))
    o.append(T(q.X(0.3), q.Y(-0.5), "b̂ = 3: 3 つの円が交わる", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(3.35), q.Y(-2.75), "紫: S1 と S2 の円の交わる点", "end", 9.5, PUR, True, halo=True))
    o.append(T(q.X(3.35), q.Y(-3.15), "青緑: S2 と S3 の円の交わる点", "end", 9.5, TEA, True, halo=True))
    return SVG(700, 340, o, "2 つの擬似距離の差と双曲線（平面の例、b = 3.0 km。(b) は (a) の破線の四角を拡大した図）。")
F["e01_hyper"] = _f01_hyper_fig()


# =====================================================================
# 4 節: 軌道の高さと周期（大きさの比は実際のとおり）
# =====================================================================
_F01_ORB = [  # 名前, 軌道の半径 [m], 色
    ("GLONASS", 25510e3, PUR), ("GPS", 26560e3, SIG), ("BeiDou", 27906e3, GLD), ("Galileo", 29600e3, GRN), ("静止軌道", 42164e3, MUT)]


def _f01_period(a):
    return 2 * math.pi * math.sqrt(a ** 3 / _F01_MU)


def _f01_hm(sec):
    h = int(sec // 3600)
    m = int(round((sec - h * 3600) / 60))
    if m == 60:
        h, m = h + 1, 0
    return "%d 時間 %02d 分" % (h, m) if h else "%d 分" % m


def _f01_orbits_fig():
    o = []
    o.append(T(14, 17, "(a) 地球と軌道（大きさの比は実際のとおり）", "start", 11.5, INK, True))
    ox, oy = 24, 318
    sc = 282.0 / 46000e3
    arc = lambda r, c, lw=1.8, dash=None: PATH("M%g,%g A%g,%g 0 0,1 %g,%g" % (ox, oy - r * sc, r * sc, r * sc, ox + r * sc, oy), c=c, lw=lw, dash=dash)
    # 準天頂軌道（楕円。地球からの距離は 39 000〜45 300 km）
    rq0, rq1 = 42164e3 * (1 - 0.075), 42164e3 * (1 + 0.075)
    o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g L%g,%g A%g,%g 0 0,0 %g,%g Z" % (ox, oy - rq1 * sc, rq1 * sc, rq1 * sc, ox + rq1 * sc, oy, ox + rq0 * sc, oy, rq0 * sc, rq0 * sc, ox, oy - rq0 * sc), c="none", lw=0, fill=TSOFT))
    for nm, a, c in _F01_ORB:
        o.append(arc(a, c, 1.4 if nm == "静止軌道" else 1.8, "5 3" if nm == "静止軌道" else None))
    o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g L%g,%g Z" % (ox, oy - _F01_RE * sc, _F01_RE * sc, _F01_RE * sc, ox + _F01_RE * sc, oy, ox, oy), c=GRN, lw=1.4, fill=GSOFT))
    o.append(arc(_F01_RE + 400e3, ALI, 1.2))
    o.append(W(ox, oy, ox + 290, oy, c=MUT, lw=1))
    o.append(W(ox, oy, ox, oy - 290, c=MUT, lw=1))
    for k in range(0, 5):
        x = ox + k * 10000e3 * sc
        o.append(W(x, oy, x, oy + 4, c=MUT, lw=1))
        o.append(T(x, oy + 15, "%d" % (k * 10000) if k else "0", "middle", 9.5, MUT))
    o.append(T(ox + 150, oy + 31, "地球の中心からの距離 [km]", "middle", 10, MUT))
    o.append(T(ox + 18, oy - 8, "地球", "start", 9.5, GRN, True, halo=True))
    o.append(W(ox + 44, oy - 22, ox + 74, oy - 52, c=ALI, lw=1))
    o.append(T(ox + 76, oy - 55, "国際宇宙ステーション", "start", 9.5, ALI, True, halo=True))
    o.append(T(ox + 76, oy - 42, "（高さ約 400 km）", "start", 9.5, ALI, False, halo=True))
    # 名前（右上の余白に、矢印で軌道を指す）
    labs = [("GLONASS", 25510e3, PUR, 74), ("GPS", 26560e3, SIG, 64), ("BeiDou（中軌道）", 27906e3, GLD, 54), ("Galileo", 29600e3, GRN, 44)]
    for nm, a, c, ang in labs:
        th = ang * _F01_D2R
        x, y = ox + a * sc * math.cos(th), oy - a * sc * math.sin(th)
        o.append(D(x, y, c, 2.6))
    o.append(T(ox + 196, 64, "GLONASS 19 100 km", "start", 9.5, PUR, True))
    o.append(T(ox + 196, 78, "GPS 20 200 km", "start", 9.5, SIG, True))
    o.append(T(ox + 196, 92, "BeiDou 21 500 km", "start", 9.5, GLD, True))
    o.append(T(ox + 196, 106, "Galileo 23 200 km", "start", 9.5, GRN, True))
    o.append(T(ox + 196, 50, "高さ（代表値）", "start", 9.5, MUT, True))
    for nm, a, c, ang in labs:
        th = ang * _F01_D2R
        x, y = ox + a * sc * math.cos(th), oy - a * sc * math.sin(th)
        ty = {"GLONASS": 61, "GPS": 75, "BeiDou（中軌道）": 89, "Galileo": 103}[nm]
        o.append(W(x, y, ox + 192, ty, c=c, lw=0.8, dash="2 2"))
    o.append(T(ox + 6, oy - 42164e3 * sc - 6, "静止軌道（高さ 35 786 km）", "start", 9.5, MUT, True, halo=True))
    o.append(T(ox + rq1 * sc * 0.975 + 2, oy - rq1 * sc * 0.22, "準天頂軌道", "start", 9.5, TEA, True, halo=True))
    # (b) 周期と軌道の半径
    o.append(T(380, 17, "(b) 周期と軌道の半径", "start", 11.5, INK, True))
    p = Plot(424, 40, 252, 238, (0, 45), (0, 26))
    o.append(p.axes(xl="軌道の半径 a [1000 km]", yl="周期 T_{orb} [時間]", xt=[0, 10, 20, 30, 40], yt=[0, 6, 12, 18, 24]))
    sid = _F01_SID / 3600
    o.append(W(p.x, p.Y(sid), p.x + p.w, p.Y(sid), c=MUT, lw=1, dash="5 3"))
    o.append(T(p.X(1), p.Y(sid) - 5, "1 恒星日 23 時間 56 分", "start", 9.5, MUT, False, halo=True))
    o.append(W(p.x, p.Y(sid / 2), p.X(26.56), p.Y(sid / 2), c=SIG, lw=1, dash="3 3"))
    o.append(T(p.X(1), p.Y(sid / 2) - 5, "その半分", "start", 9.5, SIG, False, halo=True))
    aa = _f01_np.linspace(6.371e6, 45e6, 200)
    o.append(p.line([(a / 1e6, _f01_period(a) / 3600) for a in aa], c=INK, lw=1.6))
    pts = [("ISS", _F01_RE + 400e3, ALI, (22, 4)), ("GLONASS", 25510e3, PUR, (-8, 4)), ("GPS", 26560e3, SIG, (-8, -22)), ("BeiDou", 27906e3, GLD, (10, 10)), ("Galileo", 29600e3, GRN, (10, -14)), ("静止軌道", 42164e3, MUT, (-10, 12))]
    for nm, a, c, (dx, dy) in pts:
        Tp = _f01_period(a)
        x, y = p.X(a / 1e6), p.Y(Tp / 3600)
        o.append(D(x, y, c, 4))
        if nm == "ISS":   # 横軸のすぐ上なので 1 行にまとめ、曲線の下に置く
            o.append(T(x + dx, y + dy, "ISS（%s）" % _f01_hm(Tp), "start", 9.5, c, True, halo=True))
            continue
        o.append(T(x + dx, y + dy, nm, "start" if dx > 0 else "end", 9.5, c, True, halo=True))
        o.append(T(x + dx, y + dy + 12, _f01_hm(Tp), "start" if dx > 0 else "end", 9.5, c, False, halo=True))
    o.append(TX(p.X(16), p.Y(4.5), "T_{orb} = 2π√(a^3/μ)", "start", 11, INK, True, halo=True))
    return SVG(700, 360, o, "軌道の高さと周期（軌道を円とした計算。μ = 3.986 004 418 × 10¹⁴ m³/s²。(a) は地球と軌道の大きさの比を実際のとおりに描いた。準天頂軌道は楕円なので、地球の中心からの距離が 39 000〜45 300 km の間で変わる）。")
F["e01_orbits"] = _f01_orbits_fig()


# =====================================================================
# 4 節: 軌道面の並び（GPS・GLONASS・Galileo）
# =====================================================================
def _f01_constel_fig():
    o = []
    V = _f01_view(20.0, 24.0)
    sc = 92.0 / 29600e3
    con = _f01_const()
    panels = [("GPS", "(a) GPS: 6 つの面・傾き 55°"), ("GLONASS", "(b) GLONASS: 3 つの面・64.8°"), ("Galileo", "(c) Galileo: 3 つの面・56°")]
    for k, (sysn, tit) in enumerate(panels):
        x0 = 14 + k * 231
        cx, cy = x0 + 105, 140
        c = _F01_SYSC[sysn]
        o.append(T(x0, 17, tit, "start", 10.5, INK, True))
        o.append(RECT(x0, 26, 210, 228, 4, SCR, LIN, 1.0))
        sats = [s for s in con if s["sys"] == sysn]
        a = sats[0]["a"]
        o.append(_f01_ring3([0, 0, 0], [0, 0, 1], a, V, cx, cy, sc, FNT, 1.0, back="2 4"))
        oms = sorted(set(round(s["Om"], 6) for s in sats))
        for Om in oms:
            inc = sats[0]["i"] * _F01_D2R
            O = Om * _F01_D2R
            nrm = [math.sin(inc) * math.sin(O), -math.sin(inc) * math.cos(O), math.cos(inc)]
            o.append(_f01_ring3([0, 0, 0], nrm, a, V, cx, cy, sc, c, 1.3, back="3 3"))
        o.append(CIRC(cx, cy, _F01_RE * sc, c=GRN, lw=1.3, fill=GSOFT))
        o.append(_f01_ring3([0, 0, 0], [0, 0, 1], _F01_RE, V, cx, cy, sc, GRN, 0.8, back="1 2"))
        top = _f01_p3([0, 0, _F01_RE * 1.0], V, cx, cy, sc)
        up = _f01_p3([0, 0, a * 1.12], V, cx, cy, sc)
        o.append(W(top[0], top[1], up[0], up[1], c=MUT, lw=1, dash="2 2"))
        o.append(T(up[0], up[1] - 4, "北極の向き", "middle", 9.5, MUT, False, halo=True))
        for s in sats:
            q = _f01_eci(s, 0.0)
            x, y = _f01_p3(q, V, cx, cy, sc)
            front = float(q @ V[2]) > 0
            hid = (not front) and math.hypot(x - cx, y - cy) < _F01_RE * sc
            if hid:
                continue
            o.append(D(x, y, c if front else FNT, 3.4 if front else 2.6))
        o.append(T(x0 + 105, 244, "%d 機（この章の近似の配置）" % len(sats), "middle", 9.5, MUT))
    o.append(T(14, 272, "細い破線の楕円は赤道面の上の、同じ半径の円。各面はそれより傾いている。手前の衛星を濃く、地球の奥の衛星を薄く描いた。", "start", 9.5, MUT))
    return SVG(700, 282, o, "主な衛星系の軌道面の並び（軌道は円で近似し、衛星を各面に等間隔に置いた。地球と軌道の大きさの比は実際のとおり。BeiDou の中軌道の衛星も 3 つの面に並ぶ）。")
F["e01_constel"] = _f01_constel_fig()


# =====================================================================
# 4 節: みちびきの準天頂軌道 — 8 の字の地上軌跡と、東京から見た高さ
# =====================================================================
def _f01_lonlat(q):
    return math.degrees(math.atan2(q[1], q[0])) % 360.0, math.degrees(math.atan2(q[2], math.hypot(q[0], q[1])))


def _f01_qzss_fig():
    o = []
    con = {s["nm"]: s for s in _f01_const()}
    qz = [con["J1"], con["J2"], con["J3"]]
    o.append(T(14, 17, "(a) 地上軌跡（衛星の真下の点の道。1 恒星日）", "start", 11.5, INK, True))
    p = Plot(52, 30, 300, 250, (95.0, 180.0), (-55.0, 55.0))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 1.0))
    for v in range(105, 181, 15):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 14, "%d°" % v, "middle", 9.5, MUT))
    for v in range(-45, 56, 15):
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD if v else MUT, lw=1 if v else 1.2))
        o.append(T(p.x - 6, p.Y(v) + 3.5, ("%d°" % abs(v)) + ("N" if v > 0 else ("S" if v < 0 else "")), "end", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "経度（東経）", "middle", 10, MUT))
    o.append(T(p.x + p.w - 4, p.Y(0) - 4, "赤道", "end", 9.5, MUT, False, halo=True))
    # GPS の衛星 1 機の地上軌跡（比べるため）
    g = con["G9"]
    seg, segs = [], []
    for t in _f01_np.linspace(0, _F01_SID, 721):
        lo, la = _f01_lonlat(_f01_ecef(g, t))
        if 95 <= lo <= 180:
            if seg and abs(lo - seg[-1][0]) > 5:
                segs.append(seg); seg = []
            seg.append((lo, la))
        elif seg:
            segs.append(seg); seg = []
    if seg:
        segs.append(seg)
    for sg in segs:
        if len(sg) > 1:
            o.append(p.line(sg, c=SIG, lw=1.2, dash="4 3"))
    # 準天頂軌道（3 機とも同じ 8 の字）
    tr = [_f01_lonlat(_f01_ecef(qz[0], t)) for t in _f01_np.linspace(0, _F01_SID, 721)]
    o.append(p.line(tr, c=TEA, lw=2.4))
    for s in qz:
        lo, la = _f01_lonlat(_f01_ecef(s, 0.0))
        o.append(D(p.X(lo), p.Y(la), TEA, 4.6))
        lft = lo < 136
        o.append(T(p.X(lo) + (-7 if lft else 7), p.Y(la) + 4, s["nm"], "end" if lft else "start", 9.5, TEA, True, halo=True))
    o.append(D(p.X(127), p.Y(0), TEA, 4.6))
    o.append(CIRC(p.X(127), p.Y(0), 7, c=TEA, lw=1.2))
    o.append(T(p.X(127), p.Y(0) + 18, "J4 静止軌道（127°）", "middle", 9.5, TEA, True, halo=True))
    for nm, la, lo in (("東京", 35.68, 139.77), ("シドニー", -33.87, 151.21)):
        o.append(_f01_rx(p.X(lo), p.Y(la)))
        o.append(T(p.X(lo) + 9, p.Y(la) - 4, nm, "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(97), p.Y(51), "青の破線: GPS の衛星 1 機の地上軌跡", "start", 9.5, SIG, False, halo=True))
    # (b) 東京から見た、地平線からの角度
    o.append(T(380, 17, "(b) 東京から見た、地平線からの角度", "start", 11.5, INK, True))
    q = Plot(424, 30, 256, 222, (0, 24), (0, 90))
    o.append(q.axes(xl="時刻 [時間]", yl="地平線からの角度 [°]", xt=[0, 4, 8, 12, 16, 20, 24], yt=[0, 30, 60, 90]))
    o.append(W(q.x, q.Y(70), q.x + q.w, q.Y(70), c=MUT, lw=1, dash="4 3"))
    o.append(T(q.x + q.w - 2, q.Y(70) - 4, "70°", "end", 9.5, MUT, False, halo=True))
    ts = _f01_np.linspace(0, 24 * 3600, 481)
    dash = [None, "6 3", "2 3"]
    for k, s in enumerate(qz):
        el = [_f01_elaz(*_F01_TOK, _f01_ecef(s, t))[0] for t in ts]
        o.append(q.clip(list(zip(ts / 3600, el)), c=TEA, lw=2.0, dash=dash[k]))
    elg = _f01_elaz(*_F01_TOK, _f01_ecef(con["J4"], 0))[0]
    o.append(W(q.x, q.Y(elg), q.x + q.w, q.Y(elg), c=TEA, lw=1.4, dash="1 3"))
    o.append(T(q.X(23.5), q.Y(elg) - 5, "J4（静止）%.0f°" % elg, "end", 9.5, TEA, True, halo=True))
    elG = [_f01_elaz(*_F01_TOK, _f01_ecef(g, t))[0] for t in ts]
    o.append(q.clip(list(zip(ts / 3600, elG)), c=SIG, lw=1.6))
    o.append(LEGL(424, 310, [(TEA, None, "J1"), (TEA, "6 3", "J2"), (TEA, "2 3", "J3"), (SIG, None, "GPS の衛星 1 機")], 9.5, 14))
    return SVG(700, 330, o, "みちびきの準天頂軌道（この章のモデル: 長半径 42 164 km・離心率 0.075・傾き 41°・8 の字の中心は東経 136°。値は近似で、実際の軌道とは少し違う）。")
F["e01_qzss"] = _f01_qzss_fig()


# =====================================================================
# 5 節: スカイプロット（後の章もこの見た目にそろえる）
#   中心が真上（仰角 90°）、外の円が地平線（仰角 0°）、上が北・右が東。中心からの距離は 90° − 仰角 に比例。
#   sats = [(仰角 [°], 方位角 [°], 名前 or None, 色), ...]。trails = [([(仰角, 方位角), ...], 色), ...]
# =====================================================================
def _f01_skyxy(cx, cy, R, el, az):
    rr = R * (90.0 - el) / 90.0
    return cx + rr * math.sin(az * _F01_D2R), cy - rr * math.cos(az * _F01_D2R)


def _f01_sky(cx, cy, R, sats, labels=True, sz=9.5, rings=(30, 60), dirs=True, trails=(), dot=4.2):
    o = [CIRC(cx, cy, R, c=MUT, lw=1.3, fill=SCR)]
    for az in range(0, 360, 30):
        x, y = _f01_skyxy(cx, cy, R, 0, az)
        o.append(W(cx, cy, x, y, c=GRD, lw=1))
    for e in rings:
        o.append(CIRC(cx, cy, R * (90 - e) / 90, c=FNT, lw=0.9, dash="3 3"))
    o.append(W(cx - 4, cy, cx + 4, cy, c=MUT, lw=1))
    o.append(W(cx, cy - 4, cx, cy + 4, c=MUT, lw=1))
    for e in (0,) + tuple(rings):
        o.append(T(cx + 3, cy - R * (90 - e) / 90 + 11, "%d°" % e, "start", 9.5, MUT, False, halo=True))
    if dirs:
        for az, lab in ((0, "北"), (90, "東"), (180, "南"), (270, "西")):
            x, y = _f01_skyxy(cx, cy, R + 11, 0, az)
            o.append(T(x, y + 4, lab, "middle", 10, INK, True))
    for pts, c in trails:
        seg = []
        for el, az in pts:
            if el >= 0:
                seg.append(_f01_skyxy(cx, cy, R, el, az))
            elif seg:
                if len(seg) > 1:
                    o.append(PL(seg, c=c, lw=1.2, dash="2 2"))
                seg = []
        if len(seg) > 1:
            o.append(PL(seg, c=c, lw=1.2, dash="2 2"))
    for el, az, nm, c in sats:
        if el < 0:
            continue
        x, y = _f01_skyxy(cx, cy, R, el, az)
        o.append(D(x, y, c, dot))
        if labels and nm:
            o.append(T(x + dot + 2, y + 3.5, nm, "start", sz, c, True, halo=True))
    return "".join(o)


# =====================================================================
# 5 節: ECEF と、緯度・経度・楕円体高
# =====================================================================
def _f01_ecef_fig():
    o = []
    o.append(T(14, 17, "(a) ECEF（地球の中心が原点。地球と一緒に回る）", "start", 11.5, INK, True))
    V = _f01_view(62.0, 24.0)
    cx, cy, R = 168, 182, 104.0
    sc = R
    o.append(CIRC(cx, cy, R, c=GRN, lw=1.4, fill=GSOFT))
    o.append(_f01_ring3([0, 0, 0], [0, 0, 1], 1.0, V, cx, cy, sc, GRN, 1.2, back="2 3"))
    def merid(lon, c, lw, lat0=-90, lat1=90, dash=None):
        pts = []
        for la in _f01_np.linspace(lat0, lat1, 61):
            q = [math.cos(la * _F01_D2R) * math.cos(lon * _F01_D2R), math.cos(la * _F01_D2R) * math.sin(lon * _F01_D2R), math.sin(la * _F01_D2R)]
            if float(_f01_np.asarray(q) @ V[2]) >= 0:
                pts.append(_f01_p3(q, V, cx, cy, sc))
        return PL(pts, c=c, lw=lw, dash=dash) if len(pts) > 1 else ""
    o.append(merid(0, MUT, 1.2))
    B, L = _F01_TOK[0], _F01_TOK[1]
    o.append(merid(L, SIG, 1.2))
    # 軸
    for vec, lab, dx, dy in (([1.45, 0, 0], "x（経度 0°）", 0, 18), ([0, 1.5, 0], "y（東経 90°）", 6, 4), ([0, 0, 1.42], "z（北極）", 6, 0)):
        x0, y0 = _f01_p3([v / max(abs(c) for c in vec) for v in vec], V, cx, cy, sc)
        x1, y1 = _f01_p3(vec, V, cx, cy, sc)
        o.append(W(cx, cy, x0, y0, c=INK, lw=1, dash="3 3"))
        o.append(ARR(x0, y0, x1, y1, c=INK, lw=1.5, head=6))
        o.append(T(x1 + dx, y1 + dy, lab, "start" if dx >= 0 else "end", 9.5, INK, True, halo=True))
    o.append(D(cx, cy, INK, 2.6))
    o.append(T(cx - 6, cy + 13, "原点（地球の中心）", "end", 9.5, MUT, False, halo=True))
    # 東京
    q = [math.cos(B * _F01_D2R) * math.cos(L * _F01_D2R), math.cos(B * _F01_D2R) * math.sin(L * _F01_D2R), math.sin(B * _F01_D2R)]
    px, py = _f01_p3(q, V, cx, cy, sc)
    o.append(W(cx, cy, px, py, c=SIG, lw=1, dash="2 2"))
    o.append(D(px, py, GLD, 4.6))
    o.append(T(px + 7, py - 4, "東京", "start", 10, GLD, True, halo=True))
    # 経度の角（赤道の上）と緯度の角（子午線の上）
    arc = [_f01_p3([0.42 * math.cos(t * _F01_D2R), 0.42 * math.sin(t * _F01_D2R), 0], V, cx, cy, sc) for t in _f01_np.linspace(0, L, 40)]
    o.append(PL(arc, c=PUR, lw=1.6))
    xl, yl = arc[len(arc) // 2]
    o.append(TX(xl - 2, yl + 14, "経度 L", "middle", 9.5, PUR, True, halo=True))
    arc2 = [_f01_p3([0.62 * math.cos(t * _F01_D2R) * math.cos(L * _F01_D2R), 0.62 * math.cos(t * _F01_D2R) * math.sin(L * _F01_D2R), 0.62 * math.sin(t * _F01_D2R)], V, cx, cy, sc) for t in _f01_np.linspace(0, B, 30)]
    o.append(PL(arc2, c=TEA, lw=1.6))
    xb, yb = arc2[len(arc2) // 2]
    o.append(TX(xb + 6, yb + 2, "緯度 B", "start", 9.5, TEA, True, halo=True))
    o.append(T(cx, cy + R + 22, "東京 (−3 959.7, 3 350.1, 3 699.5) km", "middle", 9.5, GLD, True))
    # (b) 子午線の断面（つぶれ方を大きくして描く）
    o.append(T(360, 17, "(b) 子午線の断面（つぶれ方を大きくして描いた）", "start", 11.5, INK, True))
    ex, ey, A_, B_ = 470, 236, 150.0, 108.0
    o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g" % (ex - A_, ey, A_, B_, ex + A_, ey), c=GRN, lw=1.6, fill=GSOFT))
    o.append(W(ex - A_ - 10, ey, ex + A_ + 30, ey, c=MUT, lw=1.1))
    o.append(T(ex + A_ + 28, ey + 14, "赤道面", "end", 9.5, MUT))
    o.append(W(ex, ey, ex, ey - B_ - 26, c=MUT, lw=1.1))
    o.append(T(ex + 4, ey - B_ - 18, "自転の軸", "start", 9.5, MUT))
    phi = 40.0 * _F01_D2R
    beta = math.atan((B_ / A_) * math.tan(phi))
    fx, fy = ex + A_ * math.cos(beta), ey - B_ * math.sin(beta)
    nx, ny = math.cos(phi), -math.sin(phi)
    hpx = 46
    Px, Py = fx + hpx * nx, fy + hpx * ny
    # 法線を赤道面まで延ばす
    tq = (ey - fy) / ny
    o.append(W(fx + tq * nx, ey, Px + 0.3 * hpx * nx, Py + 0.3 * hpx * ny, c=SIG, lw=1.4))
    o.append(T(Px + 0.3 * hpx * nx - 6, Py + 0.3 * hpx * ny - 6, "法線（面に垂直な線）", "end", 9.5, SIG, True, halo=True))
    xn = fx + tq * nx
    o.append(PATH("M%g,%g A28,28 0 0,0 %g,%g" % (xn + 28, ey, xn + 28 * math.cos(phi), ey - 28 * math.sin(phi)), c=TEA, lw=1.6))
    o.append(TX(xn + 32, ey - 9, "緯度 B", "start", 9.5, TEA, True, halo=True))
    o.append(DIM(fx + 8 * math.sin(phi), fy + 8 * math.cos(phi), Px + 8 * math.sin(phi), Py + 8 * math.cos(phi), None, c=GLD))
    o.append(TX((fx + Px) / 2 + 14, (fy + Py) / 2 + 12, "楕円体高 h", "start", 9.5, GLD, True, halo=True))
    o.append(D(fx, fy, GRN, 3))
    o.append(D(Px, Py, GLD, 4.6))
    o.append(T(Px - 8, Py + 5, "点", "end", 10, GLD, True, halo=True))
    o.append(W(ex, ey, Px, Py, c=ALI, lw=1.2, dash="4 3"))
    gc = math.atan2(ey - Py, Px - ex)
    o.append(PATH("M%g,%g A60,60 0 0,0 %g,%g" % (ex + 60, ey, ex + 60 * math.cos(gc), ey - 60 * math.sin(gc)), c=ALI, lw=1.2, dash="3 2"))
    mx_, my_ = (ex + Px) / 2, (ey + Py) / 2
    o.append(T(mx_ - 8, my_ - 6, "中心から見た角（緯度とは違う）", "end", 9.5, ALI, True, halo=True))
    o.append(T(ex - A_ + 30, ey + 24, "楕円体（地球の形を近似した、少しつぶれた回転楕円体）", "start", 9.5, GRN, False))
    o.append(T(ex - A_ + 30, ey + 40, "法線は中心を通らない。東京では 2 つの角が 0.18° 違う", "start", 9.5, MUT, False))
    return SVG(700, 330, o, "地球の中心を原点とする座標と、緯度・経度・楕円体高（(b) は、つぶれ方を大きくして描いた）。")
F["e01_ecef"] = _f01_ecef_fig()


# =====================================================================
# 5 節: ENU 座標・仰角・方位角と、スカイプロット
# =====================================================================
def _f01_sky_fig():
    o = []
    con = _f01_const()
    sel = [s for s in con if s["nm"] == "G6"][0]
    th, al = _f01_elaz(*_F01_TOK, _f01_ecef(sel, 0.0))
    o.append(T(14, 17, "(a) ENU 座標と、衛星の向き（例: G6）", "start", 11.5, INK, True))
    V = _f01_view(-72.0, 24.0)
    cx, cy, sc = 166, 200, 128.0
    ring = [_f01_p3([math.cos(t), math.sin(t), 0], V, cx, cy, sc) for t in _f01_np.linspace(0, 2 * math.pi, 97)]
    o.append(PL(ring, c=GRN, lw=1.2, fill=GSOFT))
    o.append(T(cx - 30, cy + 62, "水平面（地平線までの面）", "middle", 9.5, GRN, False, halo=True))
    for vec, lab, dx, dy in (([1.3, 0, 0], "e（東）", 6, 4), ([0, 1.25, 0], "n（北）", 4, -4), ([0, 0, 1.1], "u（上）", 6, 0)):
        x1, y1 = _f01_p3(vec, V, cx, cy, sc)
        o.append(ARR(cx, cy, x1, y1, c=INK, lw=1.5, head=6))
        o.append(TX(x1 + dx, y1 + dy, lab, "start", 10, INK, True, halo=True))
    t, a = th * _F01_D2R, al * _F01_D2R
    v = [math.cos(t) * math.sin(a), math.cos(t) * math.cos(a), math.sin(t)]
    hv = [v[0], v[1], 0]
    sx, sy = _f01_p3(v, V, cx, cy, sc)
    hx, hy = _f01_p3(hv, V, cx, cy, sc)
    o.append(W(cx, cy, hx, hy, c=PUR, lw=1.3, dash="4 3"))
    o.append(W(hx, hy, sx, sy, c=FNT, lw=1, dash="2 2"))
    o.append(ARR(cx, cy, sx, sy, c=SIG, lw=2.0))
    o.append(_f01_sat(sx + 6, sy - 6, SIG, 0.8))
    o.append(T(sx + 14, sy - 14, "衛星", "start", 10, SIG, True, halo=True))
    # 仰角の弧（衛星の向きと、その水平面への投影の間）
    rr = 0.42
    arcp = []
    for k in range(25):
        f = k / 24.0
        w = [math.cos(t * f) * math.sin(a), math.cos(t * f) * math.cos(a), math.sin(t * f)]
        arcp.append(_f01_p3([rr * c for c in w], V, cx, cy, sc))
    o.append(PL(arcp, c=GLD, lw=1.8))
    xt, yt = arcp[12]
    o.append(TX(xt + 6, yt + 2, "仰角 θ", "start", 10, GLD, True, halo=True))
    # 方位角の弧（北から東へ、水平面の上）
    rr = 0.6
    arca = [_f01_p3([rr * math.sin(x), rr * math.cos(x), 0], V, cx, cy, sc) for x in _f01_np.linspace(0, a, 25)]
    o.append(PL(arca, c=PUR, lw=1.8))
    xa, ya = arca[6]
    o.append(TX(xa - 10, ya - 2, "方位角 α", "end", 10, PUR, True, halo=True))
    o.append(_f01_rx(cx, cy - 2))
    o.append(T(14, 304, "G6: 仰角 θ = %.1f°、方位角 α = %.1f°" % (th, al), "start", 10, INK, True))
    o.append(TX(14, 320, "tan θ = u/√(e^2 + n^2)、tan α = e/n", "start", 10, MUT))
    # (b) スカイプロット
    o.append(T(358, 17, "(b) スカイプロット（東京、この章の配置）", "start", 11.5, INK, True))
    sats, cnt = [], {}
    for s in con:
        el, az = _f01_elaz(*_F01_TOK, _f01_ecef(s, 0.0))
        if el > 0:
            cnt[s["sys"]] = cnt.get(s["sys"], 0) + 1
        sats.append((el, az, None, _F01_SYSC[s["sys"]]))
    scx, scy, sR = 512, 166, 120
    o.append(_f01_sky(scx, scy, sR, sats, labels=False, dot=3.6))
    gx, gy = _f01_skyxy(scx, scy, sR, th, al)
    o.append(CIRC(gx, gy, 8, c=SIG, lw=1.6))
    o.append(T(gx + 10, gy - 6, "G6", "start", 10, SIG, True, halo=True))
    nx_, ny_ = _f01_skyxy(scx, scy, sR, 0, 0)
    ex_, ey_ = _f01_skyxy(scx, scy, sR, 0, al)
    o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g" % (scx, scy - sR * 0.22, sR * 0.22, sR * 0.22, scx + sR * 0.22 * math.sin(a), scy - sR * 0.22 * math.cos(a)), c=PUR, lw=1.6))
    o.append(W(scx, scy, gx, gy, c=PUR, lw=1, dash="3 2"))
    o.append(T(scx + 26, scy - 16, "α", "start", 10, PUR, True, halo=True))
    legs = [("GPS", "GPS"), ("GLONASS", "GLONASS"), ("Galileo", "Galileo"), ("BeiDou", "BeiDou"), ("QZSS", "みちびき")]
    xx = 352
    for k, (key, nm) in enumerate(legs):
        lab = "%s %d" % (nm, cnt.get(key, 0))
        o.append(D(xx + 4, 312 - 4, _F01_SYSC[key], 4))
        o.append(T(xx + 11, 312, lab, "start", 9.5, _F01_SYSC[key], True))
        xx += 22 + tw(lab, 9.5)
    o.append(T(352, 328, "地平線より上の衛星は合計 %d 機（数字は衛星系ごとの数）" % sum(cnt.values()), "start", 9.5, MUT))
    return SVG(700, 338, o, "受信機から見た衛星の向き（(b) は、この章の近似の配置（時刻 0）で東京から見える衛星。名前の最初の文字は衛星系で、G は GPS、R は GLONASS、E は Galileo、C は BeiDou、J はみちびき）。")
F["e01_sky"] = _f01_sky_fig()


# =====================================================================
# 5 節: GPS 時刻と UTC の差（うるう秒）
# =====================================================================
_F01_LEAP = [1981.5, 1982.5, 1983.5, 1985.5, 1988.0, 1990.0, 1991.0, 1992.5, 1993.5, 1994.5, 1996.0, 1997.5, 1999.0, 2006.0, 2009.0, 2012.5, 2015.5, 2017.0]


def _f01_gpsutc_fig():
    o = []
    o.append(T(14, 17, "(a) GPS 時刻 − UTC（うるう秒が入るたびに 1 s 開く）", "start", 11.5, INK, True))
    p = Plot(58, 34, 380, 210, (1980, 2027), (0, 20))
    o.append(p.axes(xl="年", yl="GPS 時刻 − UTC [s]", xt=[1980, 1990, 2000, 2010, 2020], yt=[0, 5, 10, 15, 18, 20], xfmt=lambda v: "%d" % v))
    pts = [(1980.016, 0)]
    for k, y in enumerate(_F01_LEAP):
        pts.append((y, k + 1))
    pts.append((2026.9, 18))
    o.append(p.steps(pts, c=SIG, lw=2.2))
    for y in _F01_LEAP:
        o.append(D(p.X(y), p.Y(_F01_LEAP.index(y) + 1), SIG, 2.4))
    o.append(T(p.X(1980.6), p.Y(1.6), "1980 年 1 月 6 日: 差 0 s から", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(2026.5), p.Y(18) - 8, "2017 年 1 月から 18 s", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(2026.5), p.Y(18) + 16, "（書いた時点）", "end", 9.5, MUT, False, halo=True))
    # (b) 同じ瞬間を、いくつかの時刻で表す
    xb = 470
    o.append(T(xb, 17, "(b) 同じ瞬間の例", "start", 11.5, INK, True))
    rows = [("UTC", "12:00:00", INK, "基準"), ("GPS 時刻", "12:00:18", SIG, "UTC + 18 s"), ("Galileo・みちびき", "12:00:18", GRN, "GPS 時刻にそろえる"),
            ("BeiDou の時刻", "12:00:04", GLD, "GPS 時刻 − 14 s"), ("GLONASS の時刻", "15:00:00", PUR, "UTC + 3 時間"), ("日本標準時", "21:00:00", MUT, "UTC + 9 時間")]
    for k, (nm, tm, c, note) in enumerate(rows):
        yy = 46 + k * 34
        o.append(RECT(xb, yy - 14, 214, 28, 5, soft(c), c, 1.1))
        o.append(T(xb + 8, yy + 4, nm, "start", 10, c, True))
        o.append(T(xb + 206, yy - 1, tm, "end", 11, INK, True, True))
        o.append(T(xb + 206, yy + 10.5, note, "end", 9.5, MUT))
    return SVG(700, 284, o, "GNSS の時刻（書いた時点の値。(b) の衛星系どうしの時刻には、ほかに ns 単位の小さな差がある。14 章）。")
F["e01_gpsutc"] = _f01_gpsutc_fig()


# =====================================================================
# 6 節: このシリーズの地図（5 つの部と 24 章。題は計画の題）
# =====================================================================
_F01_PARTS = [
    ("第 I 部", "GNSS の仕組み", SIG, [("01", "GNSS とは何か"), ("02", "衛星の信号"), ("03", "雑音より弱い電波を受ける"), ("04", "受信機の中"), ("05", "捕捉と追尾"), ("06", "位置を解く"), ("07", "誤差と DOP")]),
    ("第 II 部", "回路", GLD, [("08", "アンテナ"), ("09", "LNA とフィルタ"), ("10", "モジュールの回路"), ("11", "RF の基板設計")]),
    ("第 III 部", "プログラム", PUR, [("12", "NMEA を読む"), ("13", "バイナリプロトコルと設定"), ("14", "時刻と 1PPS"), ("15", "組み込みでの実装")]),
    ("第 IV 部", "精度を上げる", GRN, [("16", "DGNSS と SBAS"), ("17", "搬送波位相と RTK"), ("18", "多周波と PPP"), ("19", "慣性センサとの融合")]),
    ("第 V 部", "ノイズ対策・筐体・評価", ALI, [("20", "妨害とノイズの源"), ("21", "ノイズ対策の設計"), ("22", "筐体とアンテナの置き方"), ("23", "評価と試験"), ("24", "総合演習")]),
]
_F01_PARTGOAL = ["信号・受信機・位置の計算・誤差の仕組みを説明できる", "アンテナから受信モジュールまでの回路と基板を設計できる",
                 "モジュールの出力を C で読み、時刻と状態を扱える", "補正・搬送波・2 周波・慣性センサで精度を上げる",
                 "ノイズを見つけて対策し、置き方を決め、性能を測る"]


def _f01_map_fig():
    o = []
    y = 10
    for k, (pn, nm, c, chs) in enumerate(_F01_PARTS):
        rows = (len(chs) + 2) // 3
        h = 30 + rows * 30
        o.append(RECT(14, y, 672, h, 8, soft(c), c, 1.2))
        o.append(T(26, y + 22, pn, "start", 12, c, True))
        o.append(T(26 + tw(pn, 12) + 8, y + 22, nm, "start", 12, INK, True))
        o.append(T(674, y + 21, _F01_PARTGOAL[k], "end", 10, MUT))
        for j, (num, tit) in enumerate(chs):
            r_, c_ = divmod(j, 3)
            x = 26 + c_ * 218
            yy = y + 32 + r_ * 30
            me = num == "01"
            o.append(RECT(x, yy, 208, 24, 5, SCR, c, 2.2 if me else 1.0))
            o.append(T(x + 8, yy + 16.5, num, "start", 10.5, c, True, True))
            o.append(T(x + 32, yy + 16.5, tit + ("（この章）" if me else ""), "start", 10.5, INK, me))
        y += h + 8
    return SVG(700, y + 2, o, "このシリーズの 5 つの部と 24 章。各部の右上は、その部を読み終えるとできるようになること。")
F["e01_map"] = _f01_map_fig()


# =====================================================================
# 6 節: 受信機の中の流れと、扱う章
# =====================================================================
def _f01_flow_fig():
    o = []
    def box(x, y, w, h, title, sub, chs, c=SIG, fill=PAN):
        o.append(RECT(x, y, w, h, 7, fill, c, 1.4))
        o.append(T(x + w / 2, y + 18, title, "middle", 10.5, INK, True))
        if sub:
            o.append(T(x + w / 2, y + 33, sub, "middle", 9.5, MUT))
        s_, wd = CHIP(x + w / 2, y + h - 6, chs, c, 9.5, 4, "middle")
        o.append(s_)
    # 受信機（モジュール）の中の枠
    o.append(RECT(262, 26, 424, 222, 10, "none", SIG, 1.2, dash="6 4"))
    o.append(T(274, 42, "受信機（モジュール）の中", "start", 10.5, SIG, True))
    y1, y2, hh = 58, 170, 62
    # 1 段目: 衛星 → アンテナ → LNA・フィルタ → RF フロントエンド → 相関器・捕捉と追尾
    o.append(_f01_sat(40, y1 + 22, SIG, 1.0))
    o.append(T(40, y1 + 44, "衛星の電波", "middle", 10, SIG, True))
    o.append(T(40, y1 + 58, "2・3 章", "middle", 9.5, SIG))
    o.append(ARR(66, y1 + 26, 84, y1 + 26, c=SIG, lw=1.6))
    box(86, y1, 72, hh, "アンテナ", "電波を受ける", "8 章", GLD)
    o.append(ARR(158, y1 + 26, 172, y1 + 26, c=SIG, lw=1.6))
    box(174, y1, 82, hh, "増幅とフィルタ", "弱い電波を強く", "9 章", GLD)
    o.append(ARR(256, y1 + 26, 274, y1 + 26, c=SIG, lw=1.6))
    box(276, y1, 124, hh, "周波数を下げ", "数値に変える", "4 章", SIG)
    o.append(ARR(400, y1 + 26, 416, y1 + 26, c=SIG, lw=1.6))
    box(418, y1, 128, hh, "信号を見つけ", "追いかける", "4・5 章", SIG)
    o.append(ARR(546, y1 + 26, 564, y1 + 26, c=SIG, lw=1.6))
    box(566, y1, 108, hh, "届いた時刻", "→ 擬似距離", "2〜5 章", SIG)
    # 2 段目へ折り返す
    o.append(W(620, y1 + hh, 620, y1 + hh + 12, 338, y1 + hh + 12, 338, y2 - 12, c=SIG, lw=1.6))
    o.append(ARR(338, y2 - 12, 338, y2 - 1, c=SIG, lw=1.6))
    box(276, y2, 124, hh, "位置・速度・時刻", "を解く", "6・7 章", SIG)
    o.append(ARR(400, y2 + 26, 416, y2 + 26, c=SIG, lw=1.6))
    box(418, y2, 128, hh, "結果を出す", "文字・バイナリ", "12・13 章", PUR)
    o.append(W(546, y2 + 26, 700 - 10, y2 + 26, c=SIG, lw=1.6))
    o.append(W(690, y2 + 26, 690, y2 + 106, 640, y2 + 106, c=SIG, lw=1.6))
    o.append(ARR(640, y2 + 106, 626, y2 + 106, c=SIG, lw=1.6))
    box(500, y2 + 80, 124, hh - 6, "機器のマイコン", "時刻・状態の管理", "14・15 章", PUR)
    # 外から入るもの
    o.append(RECT(32, y2 + 4, 186, 50, 7, PSOFT, PUR, 1.2))
    o.append(T(125, y2 + 22, "補正の情報（基準局・衛星）", "middle", 10, PUR, True))
    o.append(T(125, y2 + 40, "16〜18 章", "middle", 9.5, PUR))
    o.append(ARR(218, y2 + 30, 274, y2 + 30, c=PUR, lw=1.6))
    o.append(RECT(286, y2 + 84, 168, 46, 7, GSOFT, GRN, 1.2))
    o.append(T(370, y2 + 102, "慣性センサと組み合わせる", "middle", 10, GRN, True))
    o.append(T(370, y2 + 120, "19 章", "middle", 9.5, GRN))
    o.append(ARR(454, y2 + 108, 498, y2 + 108, c=GRN, lw=1.6))
    # ノイズ・筐体
    o.append(ARR(215, 8, 215, y1 - 2, c=ALI, lw=1.6))
    o.append(T(223, 16, "ノイズ・妨害（20・21 章）", "start", 9.5, ALI, True))
    o.append(T(86, 24, "置き方・筐体（22 章）", "start", 9.5, GLD, True))
    o.append(W(122, 28, 122, y1 - 2, c=GLD, lw=1, dash="2 2"))
    o.append(T(14, y2 + 76, "回路と基板（10・11 章）は、", "start", 9.5, GLD, True))
    o.append(T(14, y2 + 90, "アンテナから受信機までを", "start", 9.5, GLD, True))
    o.append(T(14, y2 + 104, "つなぐ回路と配線", "start", 9.5, GLD, True))
    o.append(W(14, y2 + 150, 686, y2 + 150, c=LIN, lw=0.8))
    o.append(T(350, y2 + 168, "全体の性能を測る: 評価と試験（23 章）　1 つの機器に通して使う: 総合演習（24 章）", "middle", 10, INK, True))
    return SVG(700, y2 + 178, o, "受信機の中の流れと、それを扱う章。")
F["e01_flow"] = _f01_flow_fig()
