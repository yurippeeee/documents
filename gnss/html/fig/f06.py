# -*- coding: utf-8 -*-
# 06 章 位置を解く の図
import numpy as _f06_np

# ---- 例の値（本文と同じ） ----
_F06_C = 299792458.0                     # 光の速さ [m/s]
_F06_WE = GNSS_WE                        # 地球の自転の角速度 [rad/s]（WGS 84）
_F06_LAM = _F06_C / 1575.42e6            # L1 の波長 [m]
_F06_TOK = GNSS_TOKYO                    # 1 章の例の受信機（東京駅のあたり）
_F06_RX = _f06_np.array(geod2ecef(*GNSS_TOKYO))
_F06_BT = _F06_C * 1e-3                  # 受信機の時計が 1 ms 進む: b = 299.792 km
_F06_D2R = math.pi / 180
_F06_N4 = ["G9", "G6", "G2", "G3"]       # 1 章の 4 つの衛星
_F06_CL4 = ["G6", "G13", "G3", "G9"]     # 東から南の空に偏った 4 つ


def _f06_visible(t=0.0, sysn=("GPS",)):
    """東京から時刻 t に見える衛星 [(名前, 仰角, 方位角, 距離, ECEF の位置)]（仰角の高い順）。"""
    out = []
    for s in gnss_const():
        if s["sys"] not in sysn:
            continue
        p = _f06_np.array(sat_ecef(s, t))
        el, az, d = elaz(*_F06_TOK, p)
        if el > 0:
            out.append((s["nm"], el, az, d, p))
    return sorted(out, key=lambda q: -q[1])


_F06_VL = _f06_visible()
_F06_V = {q[0]: q for q in _F06_VL}
_F06_ALL = [q[0] for q in _F06_VL]       # 見えている 8 つ（仰角の高い順）
_F06_CON = {s["nm"]: s for s in gnss_const()}
_f06_B, _f06_L = _F06_TOK[0] * _F06_D2R, _F06_TOK[1] * _F06_D2R
_F06_RENU = _f06_np.array([[-math.sin(_f06_L), math.cos(_f06_L), 0.0],
                           [-math.sin(_f06_B) * math.cos(_f06_L), -math.sin(_f06_B) * math.sin(_f06_L), math.cos(_f06_B)],
                           [math.cos(_f06_B) * math.cos(_f06_L), math.cos(_f06_B) * math.sin(_f06_L), math.sin(_f06_B)]])


def _f06_G(names, x=None):
    """幾何行列 G（ECEF の成分）と、距離・視線の単位ベクトル。x は仮の値 (x, y, z, b)。"""
    x = _f06_np.concatenate([_F06_RX, [_F06_BT]]) if x is None else _f06_np.asarray(x, float)
    P = _f06_np.array([_F06_V[n][4] for n in names])
    d = P - x[:3]
    r = _f06_np.linalg.norm(d, axis=1)
    L = d / r[:, None]
    return _f06_np.hstack([-L, _f06_np.ones((len(names), 1))]), r, L


def _f06_Genu(names):
    """幾何行列の位置の 3 列を ENU の成分にしたもの。"""
    G, _, _ = _f06_G(names)
    Ge = G.copy()
    Ge[:, :3] = (_F06_RENU @ G[:, :3].T).T
    return Ge


def _f06_mc(names, sig, W=None, n=100000, seed=6):
    """擬似距離に標準偏差 sig の誤差を入れて n 回解いたときの、解の誤差（ENU と時計）。1 次の式で解く
    （誤差の小さい範囲では、繰り返しの最後の 1 回と同じ）。返り値 (誤差の並び [n, 4], 水平の RMS, 上下の RMS)。"""
    Ge = _f06_Genu(names)
    m = len(names)
    Wm = _f06_np.eye(m) if W is None else W
    A = _f06_np.linalg.solve(Ge.T @ Wm @ Ge, Ge.T @ Wm)
    rng = _f06_np.random.default_rng(seed)
    E = rng.standard_normal((n, m)) * _f06_np.asarray(sig, float)
    X = E @ A.T
    return X, math.sqrt(_f06_np.mean(X[:, 0] ** 2 + X[:, 1] ** 2)), math.sqrt(_f06_np.mean(X[:, 2] ** 2))


def _f06_g3(v, d=1):
    """3 桁ごとに空白を入れた数（−3 959 694.8 など）。"""
    s = ("%%.%df" % d) % abs(v)
    i, _, f = s.partition(".")
    i = "{:,}".format(int(i)).replace(",", " ")
    return ("−" if v < 0 else "") + i + ("." + f if f else "")


def _f06_m(v, d=1):
    """負の数の − を全角の負号にした数。"""
    return (("%%.%df" % d) % v).replace("-", "−")


_F06_SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def _f06_sci(v, d=1):
    """2.5 × 10⁻³ の形の数。"""
    if v == 0:
        return "0"
    e = int(math.floor(math.log10(abs(v))))
    m = v / 10 ** e
    if round(abs(m), d) >= 10:
        m /= 10
        e += 1
    return (("%%.%df" % d) % m).replace("-", "−") + " × 10" + str(e).translate(_F06_SUP)


def _f06_sat(x, y, c=PUR, s=1.0):
    """衛星の印（1 章と同じ見た目）。"""
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


def _f06_rx(x, y, c=GRN):
    """受信機の印（地面に置いたアンテナ。1 章と同じ見た目）。"""
    return W(x - 6, y + 6, x + 6, y + 6, c=c, lw=1.6) + W(x, y + 6, x, y, c=c, lw=1.4) + D(x, y - 1, c, 3.4)


def _f06_ctxw(segs, sz=13):
    return sum(_tx_adv(t, sz * _TX_SMALL[k]) if k in _TX_SMALL else _tx_adv(t, sz) for txt, c in segs for k, t in _tx_tokens(txt))


def _f06_ctx(x, y, segs, sz=13, b=True, fit=None):
    """色分けした式を 1 つの text 要素で書く（1 章の図と同じ書き方）。segs = [(TX の書き方の文字, 色), ...]。返り値 (svg, 幅)。"""
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


def _f06_eq(x, y, sz=13.5):
    """観測方程式（色分け）。返り値 (svg, 右端の x)。"""
    o = []
    sv, w1 = _f06_ctx(x, y, [("ρ_i", SIG), (" = ", INK)], sz)
    o.append(sv)
    xr0 = x + w1 + 2
    xr1 = xr0 + 14
    rad = [("(", INK), ("x_i", PUR), (" − ", INK), ("x", GLD), (")^2 + (", INK), ("y_i", PUR), (" − ", INK), ("y", GLD),
           (")^2 + (", INK), ("z_i", PUR), (" − ", INK), ("z", GLD), (")^2", INK)]
    sv, w2 = _f06_ctx(xr1, y, rad, sz, fit=_f06_ctxw(rad, sz))
    o.append(sv)
    o.append(W(xr0, y - 6, xr0 + 3, y - 8, xr0 + 7, y + 3, xr0 + 11, y - 15, xr1 + w2 + 2, y - 15, c=INK, lw=1.2))
    sv, w3 = _f06_ctx(xr1 + w2 + 4, y, [(" + ", INK), ("b", GLD), (" + ", INK), ("ε_i", TEA)], sz)
    o.append(sv)
    return "".join(o), xr1 + w2 + 4 + w3


# =====================================================================
# 1 節: 観測方程式の各項と、その出どころ
# =====================================================================
def _f06_obs_fig():
    o = []
    o.append(T(14, 18, "(a) 観測方程式（衛星 i = 1, 2, …, m の 1 つにつき 1 つ）", "start", 11.5, INK, True))
    x0, y0, sz = 150, 56, 15
    sv, xe = _f06_eq(x0, y0, sz)
    o.append(sv)
    # 矢印の先（式の中の項の位置）: ρ_i、根号の中の衛星の位置、b、ε_i
    w_rho = _f06_ctxw([("ρ_i", SIG)], sz)
    w_lhs = _f06_ctxw([("ρ_i", SIG), (" = ", INK)], sz)
    rad = [("(", INK), ("x_i", PUR), (" − ", INK), ("x", GLD), (")^2 + (", INK), ("y_i", PUR), (" − ", INK), ("y", GLD),
           (")^2 + (", INK), ("z_i", PUR), (" − ", INK), ("z", GLD), (")^2", INK)]
    w_rad = _f06_ctxw(rad, sz)
    xr1 = x0 + w_lhs + 16
    w_b = _f06_ctxw([(" + ", INK)], sz)
    w_bb = _f06_ctxw([(" + ", INK), ("b", GLD), (" + ", INK)], sz)
    tgt = [x0 + w_rho / 2, xr1 + w_rad * 0.36, xr1 + w_rad + 4 + w_b + 4, xr1 + w_rad + 4 + w_bb + 8]
    cols = [(SIG, "測った値（擬似距離）", ["届いた時刻 − 送った時刻", "（受信機の時計と衛星の", "時計の読み）を c 倍し、", "c δt_i^s を足して直す"]),
            (PUR, "衛星の位置（ECEF）", ["送った時刻 = 衛星の", "時計の読み − δt_i^s", "その時刻の位置を", "エフェメリスから計算"]),
            (GLD, "未知数（4 つ）", ["受信機の位置 x, y, z と", "受信機の時計のずれ b。", "4 つを縦に並べた", "ベクトルを太字の x と書く"]),
            (TEA, "残る誤差", ["大気の遅れ・", "マルチパス・", "受信機の雑音など", "（源ごとの大きさは 7 章）"])]
    by, bw, bh = 96, 160, 88
    for k, ((c, ttl, lines), tx) in enumerate(zip(cols, tgt)):
        bx = 14 + k * (bw + 10)
        o.append(RECT(bx, by, bw, bh, 6, soft(c), c, 1.2))
        o.append(T(bx + bw / 2, by + 17, ttl, "middle", 10.5, c, True))
        for j, ln in enumerate(lines):
            o.append(TX(bx + bw / 2, by + 35 + j * 14, ln, "middle", 9.5, INK))
        o.append(ARR(bx + bw / 2, by, tx, y0 + 9, c=c, lw=1.4, head=6))
    # (b) 例の値の表
    yt = 216
    o.append(T(14, yt, "(b) 例: 東京の受信機と GPS の衛星 4 つ（受信機の時計が 1 ms 進む: b = 299.792 km）", "start", 11.5, INK, True))
    hd = [("衛星", 30, "start"), ("仰角", 128, "end"), ("方位角", 190, "end"), ("x_i [km]", 290, "end"), ("y_i [km]", 380, "end"),
          ("z_i [km]", 470, "end"), ("本当の距離 r_i [km]", 586, "end"), ("擬似距離 ρ_i [km]", 686, "end")]
    for s_, x, a in hd:
        o.append(TX(x, yt + 24, s_, a, 9.5, MUT, True))
    o.append(W(24, yt + 30, 690, yt + 30, c=LIN, lw=0.8))
    for k, nm in enumerate(_F06_N4):
        _, el, az, d, p = _F06_V[nm]
        yy = yt + 46 + k * 17
        o.append(T(30, yy, "%d（%s）" % (k + 1, nm), "start", 10, PUR, True))
        o.append(T(128, yy, "%.1f°" % el, "end", 10, INK))
        o.append(T(190, yy, "%.1f°" % az, "end", 10, INK))
        for j, xx in enumerate((290, 380, 470)):
            o.append(T(xx, yy, _f06_g3(p[j] / 1e3, 1), "end", 10, PUR))
        o.append(T(586, yy, _f06_g3(d / 1e3, 3), "end", 10, GRN))
        o.append(T(686, yy, _f06_g3((d + _F06_BT) / 1e3, 3), "end", 10, SIG, True))
    o.append(TX(30, yt + 124, "擬似距離は、どれも本当の距離より b = 299.792 km 長い（ここでは誤差 ε_i を 0 とした）。4 つの未知数を、この 4 つの式から求める。",
                "start", 9.5, MUT))
    return SVG(700, yt + 134, o, "観測方程式の各項の出どころ。(a) 擬似距離（青）は受信機が測る値、衛星の位置（紫）は航法メッセージから計算する値で、受信機の位置と時計のずれ（金）の 4 つが未知数、ε<sub>i</sub>（青緑）は値の分からない誤差である。(b) 1 章 3 節と同じ東京の例（衛星の位置は、1 章の近似の配置の時刻 0 の値）。")
F["e06_obs"] = _f06_obs_fig()


# =====================================================================
# 1 節: エフェメリスから衛星の位置へ（5 つの段・楕円の上の角度・ケプラーの方程式の繰り返し）
# =====================================================================
def _f06_kepler(Mdeg, ecc, n=6):
    """ケプラーの方程式を、角度 ← 時間に比例する角度 + 離心率 × sin(角度) の繰り返しで解く（度で返す）。"""
    M = Mdeg * _F06_D2R
    E = M
    out = [E]
    for _ in range(n):
        E = M + ecc * math.sin(E)
        out.append(E)
    return [v / _F06_D2R for v in out]


def _f06_eph_fig():
    o = []
    o.append(T(14, 18, "(a) 送った時刻の衛星の位置を計算する 5 つの段", "start", 11.5, INK, True))
    steps = [("1. 時刻の差", "送った時刻 − 基準の時刻", "基準の時刻"),
             ("2. 時間に比例して進む角度", "基準の時刻の角度 + 角速度 × 時刻の差", "角度・長半径・角速度の直し"),
             ("3. 楕円の上の位置", "ケプラーの方程式を繰り返して解く", "離心率"),
             ("4. 周期的な直し", "角度・半径・傾きに小さなずれを足す", "6 つの係数"),
             ("5. ECEF の座標へ", "軌道面を傾け、z 軸のまわりに回す", "傾き・軌道面の向き・その変化")]
    x0, y0, bw, bh, gap = 14, 34, 296, 40, 10
    for k, (ttl, sub, use) in enumerate(steps):
        yy = y0 + k * (bh + gap)
        o.append(RECT(x0, yy, bw, bh, 6, PAN, LIN, 1.3))
        o.append(T(x0 + 10, yy + 16, ttl, "start", 10.5, INK, True))
        o.append(T(x0 + 10, yy + 32, sub, "start", 9.5, MUT))
        if k < len(steps) - 1:
            o.append(ARR(x0 + 40, yy + bh, x0 + 40, yy + bh + gap, c=MUT, lw=1.3, head=5))
        o.append(CHIP(x0 + bw + 8, yy + 25, use, PUR, 9)[0])
    yb = y0 + 5 * (bh + gap) - gap
    o.append(T(x0, yb + 18, "使うエフェメリスの値（紫の札）: 楕円の形と向き 6 つ、その変化 3 つ、", "start", 9.5, MUT))
    o.append(T(x0, yb + 32, "周期的なずれの係数 6 つ、基準の時刻 1 つの、合わせて 16 個", "start", 9.5, MUT))
    # (b) 楕円の上の角度（離心率を大きくして描く）
    xb = 498
    o.append(T(xb - 30, 18, "(b) 楕円の上の位置（離心率 0.4）", "start", 11.5, INK, True))
    ecc, a_ = 0.4, 78.0
    bmin = a_ * math.sqrt(1 - ecc * ecc)
    cx, cy = xb + 84, 108          # 楕円の中心
    fx = cx + a_ * ecc             # 地球のある焦点（右側を近地点側にとる）
    pts = [(cx + a_ * math.cos(t), cy - bmin * math.sin(t)) for t in _f06_np.linspace(0, 2 * math.pi, 121)]
    o.append(PL(pts, c=PUR, lw=1.6))
    o.append(CIRC(fx, cy, 9, c=GRN, lw=1.3, fill=GSOFT))
    o.append(T(fx, cy + 24, "地球", "middle", 9.5, GRN, True))
    o.append(W(fx, cy, cx + a_ + 6, cy, c=FNT, lw=1, dash="3 3"))
    o.append(T(696, cy - 6, "最も近い所", "end", 9, MUT, halo=True))
    Mdeg = 60.0
    E = _f06_kepler(Mdeg, ecc, 40)[-1] * _F06_D2R
    nu = 2 * math.atan2(math.sqrt(1 + ecc) * math.sin(E / 2), math.sqrt(1 - ecc) * math.cos(E / 2))
    rr = a_ * (1 - ecc * math.cos(E))
    sx, sy = fx + rr * math.cos(nu), cy - rr * math.sin(nu)
    # 一定の角速度で回ったとしたときの位置（焦点のまわりの円の上）
    rm = a_ * 0.92
    mx, my = fx + rm * math.cos(Mdeg * _F06_D2R), cy - rm * math.sin(Mdeg * _F06_D2R)
    o.append(W(fx, cy, mx, my, c=MUT, lw=1.2, dash="4 3"))
    o.append(D(mx, my, MUT, 3.6))
    o.append(T(mx + 6, my + 4, "60°", "start", 9.5, MUT, True, halo=True))
    o.append(W(fx, cy, sx, sy, c=PUR, lw=1.4))
    o.append(_f06_sat(sx, sy, PUR, 0.75))
    o.append(T(sx - 13, sy + 4, "%.0f°" % (nu / _F06_D2R), "end", 9.5, PUR, True, halo=True))
    o.append(T(xb - 30, 196, "灰色の点: 一定の角速度で回ったとき", "start", 9.5, MUT))
    o.append(T(xb - 30, 210, "紫の衛星: 本当の位置。地球に近い側で", "start", 9.5, PUR))
    o.append(T(xb - 30, 224, "速く進むので、先に進む（3 の段）", "start", 9.5, PUR))
    # (c) 繰り返しの表（離心率 0.01）
    yc = 254
    o.append(T(xb - 30, yc, "(c) 3 の段の繰り返し（離心率 0.01、", "start", 10.5, INK, True))
    o.append(T(xb - 30, yc + 15, "時間に比例する角度 60°）", "start", 10.5, INK, True))
    o.append(T(xb - 30, yc + 32, "次の角度 = 60° + 0.01 × sin(今の角度)", "start", 9.5, MUT))
    o.append(T(xb - 30, yc + 45, "（sin の後の項は rad で計算して度に直す）", "start", 9, MUT))
    ks = _f06_kepler(60.0, 0.01, 4)
    for k, v in enumerate(ks[:4]):
        yy = yc + 64 + k * 15
        o.append(T(xb - 20, yy, "%d 回目" % k, "start", 9.5, MUT))
        o.append(T(xb + 88, yy, "%.6f°" % v, "end", 9.5, PUR, True))
        if k:
            o.append(T(xb + 94, yy, "（差 %s°）" % _f06_sci(abs(v - ks[-1]), 1) if k < 3 else "（変わらない）", "start", 9, MUT))
    return SVG(700, yc + 122, o, "エフェメリスから衛星の位置を計算する手順の要点（IS-GPS-200 の式の手順をまとめたもの）。(a) 5 つの段と、各段で使うエフェメリスの値。(b) 楕円の上では、地球に近い側で速く進むので、本当の角度は一定の角速度で回るとした角度と違う（離心率を大きくして描いた）。(c) GPS の軌道は円に近いので、ケプラーの方程式の繰り返しは数回で変わらなくなる。")
F["e06_eph"] = _f06_eph_fig()


# =====================================================================
# 2 節: 1 次の近似 — 等しい距離の面は平らに見える・近似の誤差
# =====================================================================
def _f06_lin_fig():
    o = []
    o.append(T(14, 18, "(a) 受信機のまわり ±10 km の、衛星から等しい距離の面", "start", 11.5, INK, True))
    p = Plot(40, 36, 270, 270, (-10, 10), (-10, 10))
    o.append(RECT(p.x, p.y, p.w, p.h, 4, SCR, LIN, 1.0))
    for v in range(-10, 11, 5):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
    # 衛星は右上の 20 200 km 先（向き 35°）。等しい距離の円を 2 km おきに描く
    ang = 35 * _F06_D2R
    R0 = 20200.0
    sxy = (R0 * math.cos(ang), R0 * math.sin(ang))
    lx, ly = math.cos(ang), math.sin(ang)
    for k in range(-7, 8):
        rad = R0 + 2.0 * k
        pts = []
        for t in _f06_np.linspace(-0.0009, 0.0009, 61):
            a2 = ang + math.pi + t
            pts.append((sxy[0] + rad * math.cos(a2), sxy[1] + rad * math.sin(a2)))
        o.append(p.clip(pts, c=PUR if k else SIG, lw=1.0 if k else 1.8, dash=None if k else None))
    # 視線の向き（衛星へ）と、その逆（衛星から受信機へ）
    o.append(ARR(p.X(0), p.Y(0), p.X(6.5 * lx), p.Y(6.5 * ly), c=PUR, lw=1.6, head=7))
    o.append(TX(p.X(6.5 * lx) - 4, p.Y(6.5 * ly) - 8, "l_i（衛星へ）", "end", 10, PUR, True, halo=True))
    o.append(ARR(p.X(0), p.Y(0), p.X(-4.5 * lx), p.Y(-4.5 * ly), c=ALI, lw=1.6, head=7))
    o.append(TX(p.X(-4.5 * lx) - 2, p.Y(-4.5 * ly) + 16, "−l_i（距離が増える向き）", "start", 9.5, ALI, True, halo=True))
    # ずらすベクトル Δp と、視線の向きの成分
    dp = (5.0, -3.0)
    o.append(ARR(p.X(0), p.Y(0), p.X(dp[0]), p.Y(dp[1]), c=GLD, lw=1.8, head=7))
    o.append(TX(p.X(dp[0]) + 4, p.Y(dp[1]) + 12, "Δp", "start", 10.5, GLD, True, halo=True))
    proj = dp[0] * lx + dp[1] * ly
    o.append(W(p.X(dp[0]), p.Y(dp[1]), p.X(proj * lx), p.Y(proj * ly), c=GLD, lw=1.1, dash="3 3"))
    o.append(W(p.X(0), p.Y(0), p.X(proj * lx), p.Y(proj * ly), c=SIG, lw=3.2))
    o.append(TX(p.X(proj * lx) + 8, p.Y(proj * ly) + 2, "l_i·Δp だけ縮む", "start", 9.5, SIG, True, halo=True))
    o.append(_f06_rx(p.X(0), p.Y(0)))
    o.append(T(p.X(-0.7), p.Y(-1.6), "仮の位置", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.x + p.w / 2, p.y + p.h + 16, "格子は 5 km、円は 2 km おき（青: 仮の位置を通る円）", "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 31, "2 万 km 先の衛星の球は、ここでは平らな面に見える", "middle", 9.5, MUT))
    # (b) 近似の誤差
    xb = 400
    o.append(T(xb - 22, 18, "(b) 視線に垂直に d ずれたときの近似の誤差", "start", 11.5, INK, True))
    q = Plot(xb + 36, 40, 250, 250, (1, 1e7), (1e-8, 1e7), xlog=True, ylog=True)
    o.append(q.axes(xl="ずれ d [m]", yl="近似の誤差 [m]", xt=[1, 1e2, 1e4, 1e6], yt=[1e-8, 1e-5, 1e-2, 1e1, 1e4, 1e7],
                    xfmt=lambda v: "10" + str(int(round(math.log10(v)))).translate(_F06_SUP) if v != 1 else "1",
                    yfmt=lambda v: "10" + str(int(round(math.log10(v)))).translate(_F06_SUP)))
    ds = _f06_np.logspace(0, 7, 141)
    Rm = 20200e3
    o.append(q.line([(d, d) for d in ds], c=MUT, lw=1.2, dash="5 3"))
    o.append(T(q.X(3e1), q.Y(1.4e2), "誤差 = d", "start", 9.5, MUT, halo=True))
    o.append(q.line([(d, d * d / (2 * Rm)) for d in ds], c=GLD, lw=1.6, dash="6 3"))
    o.append(q.line([(d, math.sqrt(Rm * Rm + d * d) - Rm) for d in ds], c=SIG, lw=2.2))
    for d, lab in ((1e3, "1 km: 2.5 cm"), (1e4, "10 km: 2.5 m"), (1e5, "100 km: 248 m"), (1e6, "1000 km: 24.7 km")):
        e_ = math.sqrt(Rm * Rm + d * d) - Rm
        o.append(D(q.X(d), q.Y(e_), SIG, 3.6))
        if d < 5e5:
            o.append(T(q.X(d) + 6, q.Y(e_) + 12, lab, "start", 9.5, SIG, True, halo=True))
        else:
            o.append(T(q.X(d) - 6, q.Y(e_) - 6, lab, "end", 9.5, SIG, True, halo=True))
    o.append(LEGL(xb - 10, 344, [(SIG, None, "本当の差"), (GLD, "6 3", "d^2/(2r̂)（r̂ = 20 200 km）")]))
    return SVG(700, 356, o, "1 次の近似。(a) 2 万 km 先の衛星から等しい距離の面（紫の円）は、受信機のまわりでは、視線に垂直な平らな面に見える。受信機を Δp ずらすと、衛星までの距離は、Δp の視線の向きの成分 l<sub>i</sub>·Δp だけ縮む。偏微分を並べた −l<sub>i</sub> は、距離が最も速く増える向き（衛星から受信機へ）を指す。(b) 視線に垂直にずらしたときの、本当の距離と 1 次の近似の差。ずれが衛星までの距離より十分小さければ、差は d²/(2r̂) で、ずれ 10 km でも 2.5 m にとどまる。")
F["e06_lin"] = _f06_lin_fig()


# =====================================================================
# 2 節: 幾何行列 G（東京の 4 つの衛星。ECEF の成分と ENU の成分）
# =====================================================================
def _f06_geom_fig():
    o = []
    o.append(T(14, 18, "(a) 東京の空の 4 つの衛星", "start", 11.5, INK, True))
    cx, cy, R = 128, 160, 100
    sats = []
    for k, nm in enumerate(_F06_N4):
        _, el, az, d, p = _F06_V[nm]
        sats.append((el, az, "%d %s" % (k + 1, nm), PUR))
    others = [(q[1], q[2], None, FNT) for q in _F06_VL if q[0] not in _F06_N4]
    o.append(sky(cx, cy, R, others + sats, dot=4.4))
    o.append(T(cx, cy + R + 32, "番号は G の行の番号（灰色はほかの衛星）", "middle", 9.5, MUT))
    # (b) G の表（ECEF の成分と ENU の成分）
    xb = 262
    Gc, _, Lc = _f06_G(_F06_N4)
    Ge = _f06_Genu(_F06_N4)
    o.append(T(xb, 18, "(b) 幾何行列 G（4 行 4 列）", "start", 11.5, INK, True))
    for blk, (ttl, M, hdr) in enumerate((("ECEF の成分（計算はこちらで行う）", Gc, ["x", "y", "z", "b"]),
                                       ("ENU の成分（東・北・上。仰角と方位角だけで決まる）", Ge, ["東", "北", "上", "b"]))):
        y0 = 44 + blk * 130
        o.append(T(xb, y0, ttl, "start", 10, INK, True))
        for j, h in enumerate(hdr):
            o.append(T(xb + 110 + j * 74, y0 + 20, h + (" の列" if h.isascii() else "の列"), "end", 9.5, MUT))
        o.append(W(xb, y0 + 26, xb + 400, y0 + 26, c=LIN, lw=0.8))
        for i, nm in enumerate(_F06_N4):
            yy = y0 + 42 + i * 16
            o.append(T(xb, yy, "%d 行目（%s）" % (i + 1, nm), "start", 9.5, PUR, True))
            for j in range(4):
                v = M[i, j]
                o.append(T(xb + 110 + j * 74, yy, _f06_m(v, 3) if j < 3 else "1", "end", 10, INK if j < 3 else GLD, j == 3))
    # 1 行目の計算の例
    _, el, az, d, p = _F06_V["G9"]
    yc = 316
    o.append(TX(xb, yc, "例: G9 は θ = %.1f°、α = %.1f° なので、ENU の 1 行目は" % (el, az), "start", 9.5, INK))
    o.append(TX(xb, yc + 16, "(−cos θ sin α, −cos θ cos α, −sin θ) = (%s, %s, %s)" % (_f06_m(Ge[0, 0], 3), _f06_m(Ge[0, 1], 3), _f06_m(Ge[0, 2], 3)),
                "start", 9.5, PUR, True))
    o.append(T(xb, yc + 32, "真上に近い G9 の行は、上の成分が −0.965 と大きく、水平の成分は小さい", "start", 9.5, MUT))
    return SVG(700, yc + 42, o, "東京の 4 つの衛星（1 章の例）の幾何行列 G。(a) スカイプロットの番号が G の行の番号である。(b) 各行は、衛星から受信機へ向かう単位ベクトル −l<sub>i</sub> の 3 つの成分と、時計のずれ b の列の 1 である。ECEF の成分で計算するが、ENU の成分に直すと、各行は衛星の仰角 θ と方位角 α だけで決まる。")
F["e06_geom"] = _f06_geom_fig()


# =====================================================================
# 3 節の補助: 等高線（マーチング・スクエア）・RMS の値・散らばりの図
# =====================================================================
def _f06_contour(xs, ys, Z, lev):
    """等高線。xs・ys は格子の値、Z[j, i] は (xs[i], ys[j]) の値。返り値は線分の並び。"""
    segs = []
    ny, nx = Z.shape
    for j in range(ny - 1):
        for i in range(nx - 1):
            c4 = [(xs[i], ys[j], Z[j, i]), (xs[i + 1], ys[j], Z[j, i + 1]), (xs[i + 1], ys[j + 1], Z[j + 1, i + 1]), (xs[i], ys[j + 1], Z[j + 1, i])]
            pts = []
            for k in range(4):
                (xa, ya, za), (xb, yb, zb) = c4[k], c4[(k + 1) % 4]
                if (za - lev) * (zb - lev) < 0:
                    tq = (lev - za) / (zb - za)
                    pts.append((xa + tq * (xb - xa), ya + tq * (yb - ya)))
            if len(pts) == 2:
                segs.append(pts)
            elif len(pts) == 4:
                segs.append(pts[:2]); segs.append(pts[2:])
    return segs


def _f06_segpath(P, segs, c, lw=1.1, dash=None):
    d = " ".join("M%.1f,%.1f L%.1f,%.1f" % (P.X(a[0]), P.Y(a[1]), P.X(b[0]), P.Y(b[1])) for a, b in segs)
    return PATH(d, c=c, lw=lw, dash=dash) if d else ""


def _f06_rms(names, sig, W=None):
    """回数を十分に増やしたときの、解の誤差の RMS（水平・上下）。誤差の共分散から計算する（計算の方法は 7 章）。"""
    Ge = _f06_Genu(names)
    m = len(names)
    Wm = _f06_np.eye(m) if W is None else W
    A = _f06_np.linalg.solve(Ge.T @ Wm @ Ge, Ge.T @ Wm)
    Q = A @ _f06_np.diag(_f06_np.asarray(sig, float) ** 2 * _f06_np.ones(m)) @ A.T
    return math.sqrt(Q[0, 0] + Q[1, 1]), math.sqrt(Q[2, 2])


def _f06_scatter(x, y, w, X, lim, c, n=400, lab=None):
    """東西（横）と南北（縦）の誤差の散らばり（中心が本当の位置）。返り値 (svg, Plot)。"""
    p = Plot(x, y, w, w, (-lim, lim), (-lim, lim))
    o = [RECT(p.x, p.y, p.w, p.h, 3, SCR, LIN, 1.0)]
    step = lim / 2
    for v in (-2 * step, -step, 0, step, 2 * step):
        if abs(v) < lim:
            o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
            o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
    for e_, n_ in X[:n, :2]:
        if abs(e_) < lim and abs(n_) < lim:
            o.append(D(p.X(e_), p.Y(n_), c, 1.35))
    o.append(W(p.X(0) - 6, p.Y(0), p.X(0) + 6, p.Y(0), c=GRN, lw=2))
    o.append(W(p.X(0), p.Y(0) - 6, p.X(0), p.Y(0) + 6, c=GRN, lw=2))
    for v in (-lim, 0, lim):
        o.append(T(p.X(v), p.y + p.h + 12, ("%g" % v).replace("-", "−"), "middle", 9, MUT))
    o.append(T(p.x - 4, p.Y(lim) + 8, ("%g" % lim), "end", 9, MUT))
    o.append(T(p.x - 4, p.Y(-lim), ("%g" % -lim).replace("-", "−"), "end", 9, MUT))
    if lab:
        o.append(T(p.x + p.w / 2, p.y + p.h + 25, lab, "middle", 9, MUT))
    return "".join(o), p


# =====================================================================
# 3 節: 平面の例で見る最小二乗法（5 つの点・残差・残差の 2 乗の和の鉢）
# =====================================================================
_F06_PS = _f06_np.array([(-12.0, 9.0), (5.0, 12.0), (15.0, 8.0), (-18.0, 3.0), (19.0, 4.0)])
_F06_PE = _f06_np.array([0.6, -0.4, 0.5, -0.3, 0.2])
_F06_PRHO = _f06_np.linalg.norm(_F06_PS, axis=1) + 3.0 + _F06_PE


def _f06_pls(S=_F06_PS, rho=_F06_PRHO, x0=(0.0, 0.0, 0.0), nit=12):
    x = _f06_np.array(x0, float)
    for _ in range(nit):
        d = S - x[:2]
        r = _f06_np.linalg.norm(d, axis=1)
        G = _f06_np.hstack([-d / r[:, None], _f06_np.ones((len(S), 1))])
        x = x + _f06_np.linalg.solve(G.T @ G, G.T @ (rho - (r + x[2])))
    r = _f06_np.linalg.norm(S - x[:2], axis=1)
    return x, rho - (r + x[2])


def _f06_lsplane_fig():
    o = []
    xs_, res = _f06_pls()
    bh = xs_[2]
    # (a) 全体
    o.append(T(14, 18, "(a) 5 つの点と、半径 ρ_i − b̂ の円", "start", 11, INK, True))
    p = Plot(24, 32, 206, 206 * 25 / 42, (-21, 21), (-5, 20))
    o.append(RECT(p.x, p.y, p.w, p.h, 3, SCR, LIN, 1.0))
    for k, (sx, sy) in enumerate(_F06_PS):
        R = _F06_PRHO[k] - bh
        o.append(p.clip([(sx + R * math.cos(t), sy + R * math.sin(t)) for t in _f06_np.linspace(0, 2 * math.pi, 241)], c=SIG, lw=1.0))
    for k, (sx, sy) in enumerate(_F06_PS):
        o.append(_f06_sat(p.X(sx), p.Y(sy), PUR, 0.55))
        o.append(T(p.X(sx), p.Y(sy) - 7, "S%d" % (k + 1), "middle", 9, PUR, True, halo=True))
    o.append(RECT(p.X(-1.2), p.Y(1.2), p.X(1.2) - p.X(-1.2), p.Y(-1.2) - p.Y(1.2), 0, "none", GLD, 1.4))
    o.append(T(p.X(1.6), p.Y(-1.5) + 12, "(b) の範囲", "start", 9, GLD, True, halo=True))
    o.append(T(p.x, p.y + p.h + 14, "単位は km。本当の位置は原点、b = 3.0 km", "start", 9, MUT))
    # (b) 拡大: 円と残差
    o.append(T(254, 18, "(b) 拡大（±1.2 km）と残差", "start", 11, INK, True))
    q = Plot(262, 32, 200, 200, (-1.2, 1.2), (-1.2, 1.2))
    o.append(RECT(q.x, q.y, q.w, q.h, 3, SCR, LIN, 1.0))
    for v in (-1, -0.5, 0, 0.5, 1):
        o.append(W(q.X(v), q.y, q.X(v), q.y + q.h, c=GRD, lw=1))
        o.append(W(q.x, q.Y(v), q.x + q.w, q.Y(v), c=GRD, lw=1))
    ph = xs_[:2]
    for k, (sx, sy) in enumerate(_F06_PS):
        R = _F06_PRHO[k] - bh
        a0 = math.atan2(-sy, -sx)
        arc = [(sx + R * math.cos(a0 + t), sy + R * math.sin(a0 + t)) for t in _f06_np.linspace(-0.2, 0.2, 81)]
        o.append(q.clip(arc, c=SIG, lw=1.4))
        u = (ph - _F06_PS[k]) / _f06_np.linalg.norm(ph - _F06_PS[k])
        qq = _F06_PS[k] + R * u
        o.append(W(q.X(ph[0]), q.Y(ph[1]), q.X(qq[0]), q.Y(qq[1]), c=ALI, lw=2.4))
        # 円の端に点の番号
        ends = [pt for pt in arc if abs(pt[0]) <= 1.15 and abs(pt[1]) <= 1.15]
        if ends:
            ex, ey = ends[0] if k in (0, 3) else ends[-1]
            o.append(T(q.X(ex), q.Y(ey) + (11 if ey < 0 else -4), "S%d" % (k + 1), "middle", 9, SIG, True, halo=True))
    o.append(_f06_rx(q.X(0), q.Y(0)))
    o.append(D(q.X(ph[0]), q.Y(ph[1]), GLD, 4.4))
    o.append(T(q.X(ph[0]) + 7, q.Y(ph[1]) - 6, "解", "start", 10, GLD, True, halo=True))
    o.append(T(q.X(0) + 9, q.Y(0) + 15, "本当の位置", "start", 9, GRN, True, halo=True))
    yy = q.y + q.h + 15
    o.append(TX(q.x, yy, "残差 Δρ_i [km]（赤の線分）:", "start", 9, MUT))
    o.append(T(q.x, yy + 13, "  ".join("S%d %s" % (k + 1, _f06_m(r_, 3).replace("−", "−") if r_ < 0 else "+%.3f" % r_) for k, r_ in enumerate(res[:3])), "start", 9, ALI))
    o.append(T(q.x, yy + 26, "  ".join("S%d %s" % (k + 4, _f06_m(r_, 3) if r_ < 0 else "+%.3f" % r_) for k, r_ in enumerate(res[3:])), "start", 9, ALI))
    # (c) S の等高線
    o.append(T(488, 18, "(c) 残差の 2 乗の和 S [km²]", "start", 11, INK, True))
    c = Plot(494, 32, 200, 200, (-1.2, 1.2), (-1.2, 1.2))
    o.append(RECT(c.x, c.y, c.w, c.h, 3, SCR, LIN, 1.0))
    gx = _f06_np.linspace(-1.2, 1.2, 97)
    Z = _f06_np.zeros((len(gx), len(gx)))
    for j, yv in enumerate(gx):
        for i, xv in enumerate(gx):
            qv = _F06_PRHO - _f06_np.hypot(_F06_PS[:, 0] - xv, _F06_PS[:, 1] - yv)
            Z[j, i] = _f06_np.sum((qv - qv.mean()) ** 2)
    for lev, lw in ((0.82, 1.0), (0.9, 1.0), (1.0, 1.0), (1.2, 1.0), (1.6, 1.0), (2.4, 1.0), (4.0, 1.0)):
        o.append(_f06_segpath(c, _f06_contour(gx, gx, Z, lev), SIG, lw))
    for lev, xv in ((1.0, 0.0), (1.6, 0.0), (2.4, 0.0), (4.0, 0.0)):
        # 縦の線 x = 0 の上で、等高線の高さを探して数を書く
        col = Z[:, len(gx) // 2]
        idx = [j for j in range(len(gx) - 1) if (col[j] - lev) * (col[j + 1] - lev) < 0]
        if idx:
            j = idx[-1]
            o.append(T(c.X(0.02), c.Y(gx[j]) + 3, "%g" % lev, "start", 8.5, SIG, False, halo=True))
    o.append(D(c.X(ph[0]), c.Y(ph[1]), GLD, 4.4))
    o.append(T(c.X(ph[0]) - 7, c.Y(ph[1]) - 6, "最小 0.797", "end", 9, GLD, True, halo=True))
    o.append(W(c.X(0) - 5, c.Y(0), c.X(0) + 5, c.Y(0), c=GRN, lw=2))
    o.append(W(c.X(0), c.Y(0) - 5, c.X(0), c.Y(0) + 5, c=GRN, lw=2))
    o.append(T(c.X(0) + 7, c.Y(0) + 14, "本当の位置 0.828", "start", 9, GRN, True, halo=True))
    o.append(T(c.x, c.y + c.h + 15, "各点で最もよい b̂ を選んで計算した S。", "start", 9, MUT))
    o.append(T(c.x, c.y + c.h + 28, "鉢は上下に約 3 倍長い", "start", 9, MUT))
    return SVG(700, 300, o, "平面の例（1 章 1 節の 3 つの点に、S4 と S5 を足した。未知数は x・y・b の 3 つ）で見る最小二乗法。(a) 擬似距離から b̂ を引いた半径の 5 つの円は、1 点で交わらない。(b) 最小二乗法の解（金）は、円との隙間（残差、赤）の 2 乗の和が最も小さい点で、本当の位置（緑）から 0.21 km 離れている。(c) 残差の 2 乗の和 S は、解を底とする鉢の形で、本当の位置での値（0.828 km²）は、解での値（0.797 km²）より大きい。")
F["e06_lsplane"] = _f06_lsplane_fig()


# =====================================================================
# 3 節: 衛星の数と並びで変わる解の散らばり（同じ 1 m の誤差）
# =====================================================================
def _f06_lsn_fig():
    o = []
    cases = [("(a) 1 章の 4 つ", _F06_N4), ("(b) 見えている 8 つ", _F06_ALL), ("(c) 偏った 4 つ", _F06_CL4)]
    for k, (ttl, ns) in enumerate(cases):
        x0 = 14 + k * 230
        o.append(T(x0, 18, ttl, "start", 11, INK, True))
        cx, cy, R = x0 + 100, 100, 60
        sats = [(q[1], q[2], q[0] if q[0] in ns else None, PUR if q[0] in ns else FNT) for q in _F06_VL]
        o.append(sky(cx, cy, R, sats, dot=3.6, sz=9))
        X, _, _ = _f06_mc(ns, 1.0, n=400, seed=11 + k)
        sv, p = _f06_scatter(x0 + 22, 196, 168, X, 25, GLD, n=400)
        o.append(sv)
        h, v = _f06_rms(ns, 1.0)
        o.append(T(x0 + 106, 386, "水平の RMS %.2f m" % h, "middle", 10, GLD, True))
        o.append(T(x0 + 106, 401, "上下の RMS %.2f m" % v, "middle", 10, GLD, True))
    o.append(T(14, 188, "下の段: 東西（横）と南北（縦）の誤差 [m]。点は 400 回分、十字が本当の位置", "start", 9, MUT))
    return SVG(700, 410, o, "衛星の数と並びで変わる解の散らばり（東京、どの衛星の擬似距離にも標準偏差 1 m の誤差）。上の段は使った衛星（紫）、下の段は解の誤差の散らばり（金。目盛は 3 枚とも ±25 m）。RMS は、回数を十分に増やしたときの値。(a) 1 章の 4 つ、(b) 見えている 8 つ全部、(c) 東から南の空に偏った 4 つ。同じ誤差でも、偏った並びでは散らばりが何倍にも広がる。")
F["e06_lsn"] = _f06_lsn_fig()


# =====================================================================
# 3 節: 重み付き最小二乗法（仰角で誤差が変わるとき）
# =====================================================================
def _f06_wls_fig():
    o = []
    el = {q[0]: q[1] for q in _F06_VL}
    o.append(T(14, 18, "(a) 誤差のモデル σ_i = σ_0 / sin θ_i（σ_0 = 1 m）", "start", 11, INK, True))
    p = Plot(56, 34, 250, 150, (0, 90), (0, 15))
    o.append(p.axes(xl="仰角 θ [°]", yl="擬似距離の誤差 σ [m]", xt=[0, 15, 30, 45, 60, 75, 90], yt=[0, 5, 10, 15]))
    th = _f06_np.linspace(3.8, 90, 200)
    o.append(p.line([(t, 1 / math.sin(t * _F06_D2R)) for t in th], c=MUT, lw=1.6))
    for q in _F06_VL:
        nm, e_ = q[0], q[1]
        sg = 1 / math.sin(e_ * _F06_D2R)
        o.append(D(p.X(e_), p.Y(sg), PUR, 3.8))
        dy = -6 if nm not in ("G2", "G22") else (12 if nm == "G2" else -6)
        dx = 6 if nm not in ("G22",) else -6
        o.append(T(p.X(e_) + dx, p.Y(sg) + dy, "%s %.2f" % (nm, sg), "start" if dx > 0 else "end", 9, PUR, True, halo=True))
    # (b) RMS の棒
    xb = 380
    o.append(T(xb, 18, "(b) 解の誤差の RMS [m]", "start", 11, INK, True))
    sig8 = _f06_np.array([1 / math.sin(el[n] * _F06_D2R) for n in _F06_ALL])
    sig4 = _f06_np.array([1 / math.sin(el[n] * _F06_D2R) for n in _F06_N4])
    vals = [("4 つ", _f06_rms(_F06_N4, sig4), SIG), ("8 つ・同じ重さ", _f06_rms(_F06_ALL, sig8), ALI),
            ("8 つ・重み 1/σ²", _f06_rms(_F06_ALL, sig8, _f06_np.diag(1 / sig8 ** 2)), GRN)]
    q = Plot(xb + 30, 40, 270, 130, (0, 3), (0, 8))
    o.append(q.axes(xl=None, yl=None, xt=[], yt=[0, 2, 4, 6, 8]))
    for k, (lab, (h, v), c) in enumerate(vals):
        x1 = q.X(k + 0.18); x2 = q.X(k + 0.5); x3 = q.X(k + 0.82)
        o.append(RECT(x1, q.Y(h), x2 - x1 - 2, q.Y(0) - q.Y(h), 2, soft(c), c, 1.2))
        o.append(RECT(x2 + 2, q.Y(v), x3 - x2 - 2, q.Y(0) - q.Y(v), 2, c, c, 1.2))
        o.append(T((x1 + x2) / 2, q.Y(h) - 4, "%.2f" % h, "middle", 9, c, True))
        o.append(T((x2 + x3) / 2 + 1, q.Y(v) - 4, "%.2f" % v, "middle", 9, c, True))
        o.append(T(q.X(k + 0.5), q.y + q.h + 14, lab, "middle", 9.5, c, True))
    o.append(T(q.x + q.w, q.y - 4, "薄い棒: 水平　濃い棒: 上下", "end", 9, MUT))
    # (c) 散らばり
    o.append(T(14, 232, "(c) 東西と南北の誤差の散らばり [m]（点は 400 回分）", "start", 11, INK, True))
    cs = [("4 つ", _F06_N4, sig4, None, SIG), ("8 つ・同じ重さ", _F06_ALL, sig8, None, ALI),
          ("8 つ・重み 1/σ²", _F06_ALL, sig8, _f06_np.diag(1 / sig8 ** 2), GRN)]
    for k, (lab, ns, sg, Wm, c) in enumerate(cs):
        X, _, _ = _f06_mc(ns, sg, Wm, n=400, seed=21)
        sv, pp = _f06_scatter(40 + k * 230, 246, 160, X, 20, c, n=400)
        o.append(sv)
        h, v = _f06_rms(ns, sg, Wm)
        o.append(T(pp.x + pp.w / 2, pp.y + pp.h + 28, "%s: 水平 %.2f m・上下 %.2f m" % (lab, h, v), "middle", 9.5, c, True))
    return SVG(700, 448, o, "仰角の低い衛星ほど誤差が大きいとき（σ<sub>i</sub> = σ<sub>0</sub>/sin θ<sub>i</sub>、σ<sub>0</sub> = 1 m。例のモデル）の重み付き最小二乗法。(a) 東京の 8 つの衛星の誤差の大きさ。(b) 8 つを同じ重さで解くと、誤差の大きい G16・G5 に引きずられ、4 つだけの解より悪くなる。重み 1/σ² を付けると、4 つだけの解より良くなる（RMS は回数を十分に増やしたときの値）。(c) 同じ誤差の列から解いた散らばり（3 枚とも ±20 m）。")
F["e06_wls"] = _f06_wls_fig()
