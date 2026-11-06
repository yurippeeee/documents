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
    o.append(TX(14, 18, "(a) 5 つの点と、半径 ρ_i − b̂ の円", "start", 11, INK, True))
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
    placed = []
    for k, (sx, sy) in enumerate(_F06_PS):
        R = _F06_PRHO[k] - bh
        a0 = math.atan2(-sy, -sx)
        arc = [(sx + R * math.cos(a0 + t), sy + R * math.sin(a0 + t)) for t in _f06_np.linspace(-0.2, 0.2, 81)]
        o.append(q.clip(arc, c=SIG, lw=1.4))
        u = (ph - _F06_PS[k]) / _f06_np.linalg.norm(ph - _F06_PS[k])
        qq = _F06_PS[k] + R * u
        o.append(W(q.X(ph[0]), q.Y(ph[1]), q.X(qq[0]), q.Y(qq[1]), c=ALI, lw=2.4))
        # 円の端に点の番号（ほかの番号から遠い方の端に置く）
        ends = [pt for pt in arc if abs(pt[0]) <= 1.1 and abs(pt[1]) <= 1.1]
        if ends:
            cand = [ends[0], ends[-1]]
            best = max(cand, key=lambda e: min([math.hypot(e[0] - a, e[1] - b) for a, b in placed] + [9.0]))
            placed.append(best)
            ex, ey = best
            o.append(T(q.X(ex) + (8 if ex > 0.9 else (-8 if ex < -0.9 else 0)), q.Y(ey) + (12 if ey < -0.9 else (-5 if ey > 0.9 else 4)),
                       "S%d" % (k + 1), "middle", 9, SIG, True, halo=True))
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
    jrow = int(_f06_np.argmin(abs(gx - ph[1])))
    row = Z[jrow, :]
    for lev in (1.0, 1.6, 2.4, 4.0):
        # 解を通る横の線の右側で、等高線を横切る所に値を書く
        idx = [i for i in range(len(gx) // 2, len(gx) - 1) if (row[i] - lev) * (row[i + 1] - lev) < 0]
        if idx:
            i = idx[0]
            o.append(T(c.X(gx[i]) + 1, c.Y(ph[1]) - 3, "%g" % lev, "start", 8.5, SIG, False, halo=True))
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
    o.append(TX(14, 18, "(a) 誤差のモデル σ_i = σ_0 / sin θ_i（σ_0 = 1 m）", "start", 11, INK, True))
    p = Plot(56, 34, 250, 150, (0, 90), (0, 15))
    o.append(p.axes(xl="仰角 θ [°]", yl="擬似距離の誤差 σ [m]", xt=[0, 15, 30, 45, 60, 75, 90], yt=[0, 5, 10, 15]))
    th = _f06_np.linspace(3.8, 90, 200)
    o.append(p.line([(t, 1 / math.sin(t * _F06_D2R)) for t in th], c=MUT, lw=1.6))
    ly = 66
    for q in sorted(_F06_VL, key=lambda q: q[1]):
        nm, e_ = q[0], q[1]
        sg = 1 / math.sin(e_ * _F06_D2R)
        o.append(D(p.X(e_), p.Y(sg), PUR, 3.8))
        if sg > 5:
            o.append(T(p.X(e_) + 7, p.Y(sg) + 4, "%s %.2f m" % (nm, sg), "start", 9, PUR, True, halo=True))
        else:
            # 混んだ所の名前は、右の空いた所に並べて線でつなぐ
            o.append(W(p.X(e_), p.Y(sg) - 4, p.X(e_), ly + 4, p.X(68), ly + 4, c=FNT, lw=0.8))
            o.append(T(p.X(69), ly + 7, "%s %.2f m" % (nm, sg), "start", 9, PUR, True, halo=True))
            ly += 16
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


# =====================================================================
# 4 節の補助: ガウス・ニュートン法（東京の例。誤差 0、受信機の時計は 1 ms 進む）
# =====================================================================
def _f06_gn(names, x0=(0.0, 0.0, 0.0, 0.0), nit=8, P=None, rho=None):
    """ガウス・ニュートン法。返り値は仮の値の並び [x̂_0, x̂_1, …]（発散したら途中で止める）。"""
    P = _f06_np.array([_F06_V[n][4] for n in names]) if P is None else P
    rho = _f06_np.linalg.norm(P - _F06_RX, axis=1) + _F06_BT if rho is None else rho
    x = _f06_np.array(x0, float)
    hist = [x.copy()]
    for _ in range(nit):
        d = P - x[:3]
        r = _f06_np.linalg.norm(d, axis=1)
        G = _f06_np.hstack([-d / r[:, None], _f06_np.ones((len(P), 1))])
        try:
            dx = _f06_np.linalg.solve(G.T @ G, G.T @ (rho - (r + x[3])))
        except _f06_np.linalg.LinAlgError:
            break
        x = x + dx
        hist.append(x.copy())
        if not _f06_np.all(_f06_np.isfinite(x)) or _f06_np.linalg.norm(x[:3]) > 1e9:
            break
        if _f06_np.linalg.norm(dx[:3]) < 1e-3:
            break
    return hist


_F06_UH = _f06_np.array([math.cos(_f06_L), math.sin(_f06_L), 0.0])   # 東京の経度の向き（子午線を含む面の横の軸）


def _f06_mer(p):
    """ECEF の点を、東京を通る子午線を含む面に投影した (横 [km], z [km])。"""
    return float(p[:3] @ _F06_UH) / 1e3, float(p[2]) / 1e3


# =====================================================================
# 4 節: ガウス・ニュートン法の手順
# =====================================================================
def _f06_gnflow_fig():
    o = []
    y = 44
    boxes = [(14, "0. 初めの仮の値", ["地球の中心と b̂ = 0、", "または前に求めた位置"], GRN),
             (184, "1. 衛星ごとに計算", ["r̂_i・ρ̂_i・残差 Δρ_i・l_i", "（衛星の位置は自転を直す）"], SIG),
             (354, "2. 正規方程式を解く", ["G^T G Δx = G^T Δρ", "（重みを付けるなら G^T W G）"], GLD),
             (524, "3. 仮の値を直す", ["x̂_{k+1} = x̂_k + Δx", "k を 1 増やす"], GLD)]
    bw, bh = 162, 64
    for x, ttl, lines, c in boxes:
        o.append(RECT(x, y, bw, bh, 7, soft(c), c, 1.3))
        o.append(T(x + bw / 2, y + 18, ttl, "middle", 10.5, c, True))
        for j, ln in enumerate(lines):
            o.append(TX(x + bw / 2, y + 36 + j * 15, ln, "middle", 9.5, INK))
    for k in range(3):
        o.append(ARR(boxes[k][0] + bw, y + bh / 2, boxes[k + 1][0], y + bh / 2, c=MUT, lw=1.5, head=6))
    # 4. 判定
    dx, dy = 605, 150
    o.append(ARR(605, y + bh, 605, dy - 22, c=MUT, lw=1.5, head=6))
    o.append(PL([(dx, dy - 22), (dx + 78, dy), (dx, dy + 22), (dx - 78, dy)], c=PUR, lw=1.4, fill=PSOFT))
    o.append(TX(dx, dy - 2, "4. |Δp| < 1 mm ?", "middle", 10, PUR, True))
    o.append(T(dx, dy + 12, "（位置の修正量）", "middle", 8.5, MUT))
    # いいえ → 1 へ戻る
    o.append(W(dx - 78, dy, 265, dy, c=ALI, lw=1.5))
    o.append(ARR(265, dy, 265, y + bh, c=ALI, lw=1.5, head=6))
    o.append(T(470, dy - 6, "いいえ: 1 に戻る", "middle", 10, ALI, True))
    # はい → 終わり
    o.append(ARR(dx, dy + 22, dx, dy + 46, c=GRN, lw=1.5, head=6))
    o.append(T(dx + 8, dy + 38, "はい", "start", 10, GRN, True))
    o.append(RECT(dx - 90, dy + 48, 180, 30, 7, GSOFT, GRN, 1.3))
    o.append(T(dx, dy + 67, "終わり: 位置と時計のずれ", "middle", 10, GRN, True))
    # 例の値
    hist = _f06_gn(_F06_N4)
    steps = [_f06_np.linalg.norm(hist[k + 1][:3] - hist[k][:3]) for k in range(len(hist) - 1)]
    def ln(v):
        return ("%.0f km" % (v / 1e3)) if v >= 1e5 else (("%.1f km" % (v / 1e3)) if v >= 1e4 else (("%.0f m" % v) if v >= 1 else "%.2f mm" % (v * 1e3)))
    o.append(T(14, 256, "東京の例（4 つの衛星、地球の中心から）の位置の修正量 |Δp|:", "start", 9.5, INK, True))
    o.append(T(14, 272, " → ".join("%d 回目 %s" % (k + 1, ln(v)) for k, v in enumerate(steps)) + "（5 回目で 1 mm を下回って終わる）", "start", 9.5, GLD))
    o.append(T(14, 18, "ガウス・ニュートン法: 線形化（1）と最小二乗法（2）を、修正量が十分小さくなるまで繰り返す", "start", 11, INK, True))
    return SVG(700, 282, o, "ガウス・ニュートン法の手順。1 で、今の仮の値のまわりで線形化し（残差と G を計算し）、2 で正規方程式を解いて修正量を求め、3 で仮の値を直す。位置の修正量が決めた値（ここでは 1 mm）より小さくなったら終わる。")
F["e06_gnflow"] = _f06_gnflow_fig()


# =====================================================================
# 4 節: 地球の中心から始めたときの収束
# =====================================================================
def _f06_conv_fig():
    o = []
    h4 = _f06_gn(_F06_N4)
    h8 = _f06_gn(_F06_ALL)
    o.append(T(14, 18, "(a) 仮の位置の動き（子午線を含む面に投影）", "start", 11, INK, True))
    p = Plot(24, 34, 260, 260, (-6000, 26000), (-6000, 26000))
    o.append(RECT(p.x, p.y, p.w, p.h, 3, SCR, LIN, 1.0))
    o.append(CIRC(p.X(0), p.Y(0), p.X(6371) - p.X(0), c=GRN, lw=1.3, fill=GSOFT))
    o.append(T(p.X(0), p.Y(-2600), "地球", "middle", 9.5, GRN, True, halo=True))
    for nm in _F06_N4:
        sx, sz = _f06_mer(_F06_V[nm][4])
        o.append(_f06_sat(p.X(sx), p.Y(sz), PUR, 0.6))
        o.append(T(p.X(sx), p.Y(sz) - 8, nm, "middle", 9, PUR, True, halo=True))
    tk = _f06_mer(_F06_RX)
    pts = [_f06_mer(h) for h in h4]
    o.append(ARR(p.X(pts[0][0]), p.Y(pts[0][1]), p.X(pts[1][0]), p.Y(pts[1][1]), c=GLD, lw=1.6, head=7))
    o.append(D(p.X(pts[0][0]), p.Y(pts[0][1]), GLD, 3.6))
    o.append(T(p.X(pts[0][0]) - 5, p.Y(pts[0][1]) + 13, "k = 0（中心）", "end", 9, GLD, True, halo=True))
    o.append(D(p.X(pts[1][0]), p.Y(pts[1][1]), GLD, 3.6))
    o.append(T(p.X(pts[1][0]) + 6, p.Y(pts[1][1]) + 12, "k = 1", "start", 9, GLD, True, halo=True))
    o.append(_f06_rx(p.X(tk[0]), p.Y(tk[1]) - 2))
    o.append(T(p.X(tk[0]) - 7, p.Y(tk[1]) - 6, "東京", "end", 9.5, GRN, True, halo=True))
    # 拡大（東京のまわり ±1600 km）
    zx, zy, zw = p.x + 6, p.y + 6, 106
    z = Plot(zx, zy, zw, zw, (tk[0] - 2000, tk[0] + 2000), (tk[1] - 2000, tk[1] + 2000))
    o.append(RECT(z.x, z.y, z.w, z.h, 2, PAN, GLD, 1.0))
    zp = [(min(max(a, z.xr[0]), z.xr[1]), min(max(b, z.yr[0]), z.yr[1])) for a, b in pts[1:4]]
    o.append(PL([(z.X(a), z.Y(b)) for a, b in zp], c=GLD, lw=1.2, dash="3 2"))
    for k, (a, b) in enumerate(pts[1:4], start=1):
        if z.xr[0] <= a <= z.xr[1] and z.yr[0] <= b <= z.yr[1]:
            o.append(D(z.X(a), z.Y(b), GLD, 2.8))
    o.append(_f06_rx(z.X(tk[0]), z.Y(tk[1]) - 2))
    o.append(T(z.x + 4, z.y + 11, "拡大: 東京 ±2000 km", "start", 8.5, MUT))
    a1, b1 = pts[1]
    o.append(T(z.X(a1) + 4, z.Y(b1) + 11, "k=1", "start", 8.5, GLD, True, halo=True))
    o.append(T(z.X(tk[0]) - 4, z.Y(tk[1]) + 12, "k=2〜", "end", 8.5, GLD, True, halo=True))
    o.append(T(p.x, p.y + p.h + 14, "k = 2 以降は、この大きさでは東京の点に重なる（左上の枠は拡大）", "start", 9, MUT))
    # (b) 誤差の減り方
    xb = 366
    o.append(T(xb - 20, 18, "(b) 位置の誤差と、2 節の近似からの見積もり", "start", 11, INK, True))
    q = Plot(xb + 30, 36, 290, 230, (0, 6), (1e-9, 1e7), ylog=True)
    o.append(q.axes(xl="繰り返した回数 k", yl="位置の誤差 [m]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[1e-9, 1e-6, 1e-3, 1, 1e3, 1e6],
                    yfmt=lambda v: "10" + str(int(round(math.log10(v)))).translate(_F06_SUP) if v != 1 else "1"))
    o.append(W(q.x, q.Y(1e-3), q.x + q.w, q.Y(1e-3), c=PUR, lw=1.1, dash="4 3"))
    o.append(T(q.x + 4, q.Y(1e-3) - 5, "1 mm（終わりの判定）", "start", 9, PUR, halo=True))
    for hist, c, lab in ((h4, SIG, "4 つ"), (h8, GLD, "8 つ")):
        es = [max(_f06_np.linalg.norm(h[:3] - _F06_RX), 2e-9) for h in hist]
        o.append(q.clip([(k, e) for k, e in enumerate(es)], c=c, lw=2))
        for k, e in enumerate(es):
            o.append(D(q.X(k), q.Y(e), c, 3.4))
    es4 = [_f06_np.linalg.norm(h[:3] - _F06_RX) for h in h4]
    for k in range(len(es4) - 1):
        pred = es4[k] ** 2 / (2 * 21000e3)
        if pred > 1e-9:
            o.append(CIRC(q.X(k + 1), q.Y(pred), 4.2, c=MUT, lw=1.3))
    o.append(T(q.X(2) + 8, q.Y(es4[2]) - 2, "62.6 km", "start", 9, SIG, True, halo=True))
    o.append(T(q.X(3) + 8, q.Y(es4[3]) - 2, "126 m", "start", 9, SIG, True, halo=True))
    o.append(T(q.X(4) + 8, q.Y(es4[4]) - 2, "0.52 mm", "start", 9, SIG, True, halo=True))
    o.append(LEGL(xb - 10, 312, [(SIG, None, "4 つの衛星"), (GLD, None, "8 つの衛星")]))
    o.append(CIRC(xb + 200, 308, 4.2, c=MUT, lw=1.3))
    o.append(TX(xb + 210, 312, "d^2/(2r̂) の見積もり", "start", 10, MUT))
    o.append(T(q.x + q.w, q.Y(2e-9) - 4, "計算の桁の限り", "end", 9, MUT, halo=True))
    return SVG(700, 322, o, "地球の中心と b̂ = 0 から始めたガウス・ニュートン法（東京、誤差 0、受信機の時計は 1 ms 進む）。(a) 1 回目は東京を通り越して 1441 km 先に出るが、2 回目で 62.6 km まで近づく。(b) 誤差は回ごとにほぼ 2 乗で縮み、5 回目で計算の桁の限りに届く。○は、前の回の誤差 d から 2 節の近似の誤差 d²/(2r̂)（r̂ = 21 000 km）で見積もった次の回の誤差で、実際の値とおよそ合う。")
F["e06_conv"] = _f06_conv_fig()


# =====================================================================
# 4 節: どこから始めると収束するか（子午線を含む面の上の初めの位置）
# =====================================================================
def _f06_basin_run(x0):
    """初めの位置 x0（ECEF [m]、b̂ = 0）から繰り返した結果: (収束したか, 回数)。"""
    P = _f06_np.array([_F06_V[n][4] for n in _F06_N4])
    rho = _f06_np.linalg.norm(P - _F06_RX, axis=1) + _F06_BT
    x = _f06_np.concatenate([x0, [0.0]])
    for k in range(30):
        d = P - x[:3]
        r = _f06_np.linalg.norm(d, axis=1)
        G = _f06_np.hstack([-d / r[:, None], _f06_np.ones((4, 1))])
        try:
            dx = _f06_np.linalg.solve(G, rho - (r + x[3]))
        except _f06_np.linalg.LinAlgError:
            return False, k
        x = x + dx
        if not _f06_np.all(_f06_np.isfinite(x)) or _f06_np.linalg.norm(x[:3]) > 1e9:
            return False, k + 1
        if _f06_np.linalg.norm(dx[:3]) < 1e-3:
            return _f06_np.linalg.norm(x[:3] - _F06_RX) < 1.0, k + 1
    return False, 30


def _f06_basin_fig():
    o = []
    o.append(T(14, 18, "初めの仮の位置（b̂ = 0）を子午線を含む面の上に置いたとき、東京の解に収束するか（1 章の 4 つの衛星）", "start", 11, INK, True))
    lim, step = 40000.0, 2500.0
    p = Plot(56, 34, 340, 340, (-lim, lim), (-lim, lim))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 1.0))
    vals = _f06_np.arange(-lim + step / 2, lim, step)
    for zc in vals:
        run, prev = None, None
        cells = []
        for sc in vals:
            ok, k = _f06_basin_run(sc * 1e3 * _F06_UH + _f06_np.array([0, 0, zc * 1e3]))
            key = ("ok", min(k, 9)) if ok else ("ng", 0)
            cells.append((sc, key))
        # 同じ種類が続く所は 1 つの長方形にまとめる
        i = 0
        while i < len(cells):
            j = i
            while j + 1 < len(cells) and cells[j + 1][1] == cells[i][1]:
                j += 1
            x1, x2 = cells[i][0] - step / 2, cells[j][0] + step / 2
            kind, k = cells[i][1]
            if kind == "ok":
                fill, op = GRN, {5: 0.55, 6: 0.42, 7: 0.3, 8: 0.2}.get(k, 0.12)
            else:
                fill, op = ALI, 0.22
            o.append(RECT(p.X(x1), p.Y(zc + step / 2), p.X(x2) - p.X(x1), p.Y(zc - step / 2) - p.Y(zc + step / 2), 0, fill, "none", 0, op=op))
            i = j + 1
    for v in (-40000, -20000, 0, 20000, 40000):
        o.append(T(p.X(v), p.y + p.h + 14, ("%g" % (v / 1000)).replace("-", "−"), "middle", 9, MUT))
        o.append(T(p.x - 6, p.Y(v) + 3, ("%g" % (v / 1000)).replace("-", "−"), "end", 9, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "東京の経度の向き [1000 km]", "middle", 10, MUT))
    o.append(T(p.x - 32, p.y + p.h / 2, "z [1000 km]", "middle", 10, MUT, rot=-90))
    o.append(CIRC(p.X(0), p.Y(0), p.X(26560) - p.X(0), c=PUR, lw=1.1, dash="4 3"))
    o.append(CIRC(p.X(0), p.Y(0), p.X(6371) - p.X(0), c=GRN, lw=1.4, fill=GSOFT))
    for nm in _F06_N4:
        sx, sz = _f06_mer(_F06_V[nm][4])
        o.append(_f06_sat(p.X(sx), p.Y(sz), PUR, 0.55))
    tk = _f06_mer(_F06_RX)
    o.append(_f06_rx(p.X(tk[0]), p.Y(tk[1]) - 2))
    # 例: 地球の裏側の遠くから始めると発散する道
    x0 = -20000e3 * _F06_UH
    hist = _f06_gn(_F06_N4, (x0[0], x0[1], x0[2], 0.0), nit=3)
    pts = [_f06_mer(h) for h in hist]
    o.append(p.clip([(a * 1, b * 1) for a, b in pts], c=ALI, lw=1.6))
    o.append(D(p.X(pts[0][0]), p.Y(pts[0][1]), ALI, 3.6))
    o.append(T(p.X(pts[0][0]), p.Y(pts[0][1]) + 14, "ここから始めると", "middle", 9, ALI, True, halo=True))
    o.append(T(p.X(pts[0][0]), p.Y(pts[0][1]) + 27, "遠ざかって発散", "middle", 9, ALI, True, halo=True))
    # 説明
    xr = 420
    items = [(GRN, 0.55, "収束（5 回）"), (GRN, 0.42, "収束（6 回）"), (GRN, 0.3, "収束（7 回）"), (GRN, 0.2, "収束（8 回）"),
             (GRN, 0.12, "収束（9 回以上）"), (ALI, 0.22, "発散（遠ざかる）")]
    for k, (c, op, lab) in enumerate(items):
        yy = 56 + k * 20
        o.append(RECT(xr, yy - 11, 22, 14, 2, c, c, 0.8, op=op))
        o.append(T(xr + 30, yy, lab, "start", 10, INK))
    o.append(W(xr, 186, xr + 22, 186, c=PUR, lw=1.1, dash="4 3"))
    o.append(T(xr + 30, 190, "GPS の衛星の軌道の半径 26 560 km", "start", 10, PUR))
    o.append(T(xr, 220, "地球の中心からの距離が、向きによって", "start", 10, INK))
    o.append(T(xr, 236, "1.6 万〜2.4 万 km ほどより内側なら、", "start", 10, INK))
    o.append(T(xr, 252, "どこから始めても 5〜9 回で収束する。", "start", 10, INK))
    o.append(T(xr, 276, "それより遠く（特に衛星の外側）では、", "start", 10, INK))
    o.append(T(xr, 292, "1 次の近似が成り立たないうえ、", "start", 10, INK))
    o.append(T(xr, 308, "どの衛星も同じような向きに見えるので、", "start", 10, INK))
    o.append(T(xr, 324, "修正量が大きくなり続けて発散する。", "start", 10, INK))
    o.append(T(xr, 350, "衛星の印は、4 つの衛星の位置をこの面に", "start", 9.5, MUT))
    o.append(T(xr, 364, "投影したもの。格子は 2 500 km おき", "start", 9.5, MUT))
    return SVG(700, 412, o, "初めの仮の位置と収束（東京、1 章の 4 つの衛星、誤差 0、受信機の時計は 1 ms 進む）。東京の経度の子午線を含む面の上に、2 500 km おきに初めの位置を置き、b̂ = 0 からガウス・ニュートン法を繰り返した。緑は東京の解に収束した所（濃いほど少ない回数）、赤は発散した所。")
F["e06_basin"] = _f06_basin_fig()


# =====================================================================
# 4 節: 電波が届く間に地球が回る（サニャック効果）
# =====================================================================
def _f06_rotz(p, th):
    return _f06_np.array([p[0] * math.cos(th) + p[1] * math.sin(th), -p[0] * math.sin(th) + p[1] * math.cos(th), p[2]])


def _f06_sagnac_vals():
    """衛星ごとの、電波が届く時間と、地球の自転の直しで変わる距離 [m]（衛星の位置を西へ ω_e τ 回したとき）。"""
    out = []
    for nm in _F06_ALL:
        s = _F06_CON[nm]
        tau = 0.07
        for _ in range(6):
            p_tx = _f06_np.array(sat_ecef(s, -tau))
            p_rx = _f06_rotz(p_tx, _F06_WE * tau)
            tau = _f06_np.linalg.norm(p_rx - _F06_RX) / _F06_C
        out.append((nm, tau, _f06_np.linalg.norm(p_rx - _F06_RX) - _f06_np.linalg.norm(p_tx - _F06_RX), _f06_np.linalg.norm(p_rx - p_tx), p_tx, p_rx))
    return out


def _f06_sagnac_fig():
    o = []
    o.append(T(14, 18, "(a) 北極の上から見た図（回る角度は大きく描いた）", "start", 11, INK, True))
    cx, cy, Re = 118, 236, 78
    o.append(CIRC(cx, cy, Re, c=GRN, lw=1.4, fill=GSOFT))
    o.append(D(cx, cy, GRN, 2.6))
    o.append(T(cx, cy + 16, "地球", "middle", 9.5, GRN, True, halo=True))
    phi = 30 * _F06_D2R
    a_tx = -8 * _F06_D2R              # 送ったときの受信機の向き（画面の角度。反時計回りが東）
    rtx = (cx + Re * math.cos(a_tx), cy - Re * math.sin(a_tx))
    rrx = (cx + Re * math.cos(a_tx + phi), cy - Re * math.sin(a_tx + phi))
    ra = Re + 16
    o.append(PATH("M%g,%g A%g,%g 0 0,0 %g,%g" % (cx + ra * math.cos(a_tx), cy - ra * math.sin(a_tx), ra, ra,
                                                 cx + ra * math.cos(a_tx + phi + 0.05), cy - ra * math.sin(a_tx + phi + 0.05)), c=GLD, lw=1.4))
    o.append(_head(cx + ra * math.cos(a_tx + phi - 0.05), cy - ra * math.sin(a_tx + phi - 0.05),
                   cx + ra * math.cos(a_tx + phi + 0.06), cy - ra * math.sin(a_tx + phi + 0.06), GLD, 7))
    o.append(T(cx + (ra + 8) * math.cos(a_tx + phi / 2), cy - (ra + 8) * math.sin(a_tx + phi / 2) + 4, "自転（東へ）", "start", 9.5, GLD, True, halo=True))
    sat = (288, 62)
    o.append(_f06_sat(sat[0], sat[1], PUR, 0.9))
    o.append(T(sat[0] - 6, sat[1] - 12, "電波を送ったときの衛星", "middle", 9.5, PUR, True, halo=True))
    o.append(W(sat[0], sat[1], rtx[0], rtx[1], c=ALI, lw=1.4, dash="5 3"))
    o.append(ARR(sat[0], sat[1], rrx[0], rrx[1], c=SIG, lw=2, head=8))
    o.append(_f06_rx(rtx[0], rtx[1] - 3, MUT))
    o.append(_f06_rx(rrx[0], rrx[1] - 3))
    o.append(T(rtx[0] + 10, rtx[1] + 18, "送ったときの受信機", "start", 9, MUT, True, halo=True))
    o.append(T(rrx[0] - 10, rrx[1] - 8, "受けたときの受信機", "end", 9, GRN, True, halo=True))
    o.append(T(14, 352, "青: 電波が実際に通る道（受けたときの受信機まで）", "start", 9.5, SIG, True))
    o.append(T(14, 368, "赤の破線: 直さずに ECEF の座標どうしで計算した距離", "start", 9.5, ALI, True))
    o.append(T(14, 384, "（送ったときの受信機までの距離と同じになる）", "start", 9.5, ALI))
    # (b) 衛星ごとの直し
    xb = 372
    o.append(T(xb - 10, 18, "(b) 東京の 8 つの衛星の、距離の直し [m]", "start", 11, INK, True))
    vals = _f06_sagnac_vals()
    q = Plot(xb + 60, 46, 240, 200, (-40, 40), (0, len(vals)))
    o.append(q.axes(xl="距離の直し Δr_i [m]", yl=None, xt=[-40, -20, 0, 20, 40], yt=[], xfmt=lambda v: ("%g" % v).replace("-", "−")))
    o.append(W(q.X(0), q.y, q.X(0), q.y + q.h, c=MUT, lw=1.2))
    for k, (nm, tau, dr, mv, ptx, prx) in enumerate(vals):
        yy = q.y + (k + 0.5) * q.h / len(vals)
        o.append(RECT(min(q.X(0), q.X(dr)), yy - 8, abs(q.X(dr) - q.X(0)), 16, 2, soft(SIG), SIG, 1.1))
        o.append(T(q.x - 8, yy + 4, "%s（%.1f ms）" % (nm, tau * 1e3), "end", 9, PUR, True))
        o.append(T(q.X(dr) + (5 if dr >= 0 else -5), yy + 4, ("%+.1f" % dr).replace("-", "−"), "start" if dr >= 0 else "end", 9, SIG, True, halo=True))
    o.append(T(q.x - 8, q.y - 6, "衛星（届く時間）", "end", 9, MUT))
    # 位置の誤差
    o.append(T(xb - 10, 318, "直しを省いて解くと（8 つの衛星）:", "start", 10, INK, True))
    o.append(T(xb - 10, 336, "位置が東へ 29.5 m、北へ −0.6 m、上へ 1.3 m ずれる", "start", 10, ALI, True))
    o.append(TX(xb - 10, 356, "式: Δr_i ≈ (ω_e/c)(x_i y − y_i x)。直しの大きさは", "start", 9.5, MUT))
    o.append(T(xb - 10, 371, "衛星の位置と受信機の位置で決まる", "start", 9.5, MUT))
    return SVG(700, 394, o, "電波が届く間（67〜86 ms）に地球が回る分の直し（サニャック効果）。(a) 衛星の位置は送ったときの ECEF の座標なので、そのまま受信機の ECEF の座標との距離を計算すると、送ったときの受信機の位置までの距離になってしまう（角度は大きく描いた。実際は 5 × 10⁻⁶ rad ほど）。(b) 東京の 8 つの衛星では、衛星の位置を西へ ω<sub>e</sub>τ<sub>i</sub> 回して直すと、距離が −25.7〜+31.0 m 変わる。")
F["e06_sagnac"] = _f06_sagnac_fig()


# =====================================================================
# 5 節の補助: 衛星の速度とドップラーの内訳（受信機は東へ 20 m/s、TCXO +0.5 ppm）
# =====================================================================
_F06_VRX = _F06_RENU.T @ _f06_np.array([20.0, 0.0, 0.0])    # 受信機の速度（ECEF）
_F06_BDOT = _F06_C * 0.5e-6                                  # 時計のドリフトを距離に直した値 [m/s]


def _f06_satvel(nm, t=0.0, h=0.5):
    s = _F06_CON[nm]
    return (_f06_np.array(sat_ecef(s, t + h)) - _f06_np.array(sat_ecef(s, t - h))) / (2 * h)


def _f06_dopparts():
    """衛星ごとのドップラーの内訳 [(名前, 衛星の動き, 受信機の動き, 時計, 合計)] [Hz]。"""
    out = []
    for nm in _F06_ALL:
        p = _F06_V[nm][4]
        l = (p - _F06_RX) / _f06_np.linalg.norm(p - _F06_RX)
        fs = -float(l @ _f06_satvel(nm)) / _F06_LAM
        fr = float(l @ _F06_VRX) / _F06_LAM
        fc = -_F06_BDOT / _F06_LAM
        out.append((nm, fs, fr, fc, fs + fr + fc))
    return out


# =====================================================================
# 5 節: ドップラーの内訳（衛星の動き・受信機の動き・時計のドリフト）
# =====================================================================
def _f06_dopgeom_fig():
    o = []
    o.append(T(14, 18, "(a) 距離の変わる速さは、視線の向きの速度の差", "start", 11, INK, True))
    rx, ry = 66, 196
    sx, sy = 300, 76
    o.append(W(rx, ry, sx, sy, c=MUT, lw=1.1, dash="4 3"))
    L = _f06_np.array([sx - rx, sy - ry], float)
    L /= _f06_np.linalg.norm(L)
    vs = _f06_np.array([-84.0, 22.0])
    o.append(_f06_sat(sx, sy, PUR, 0.9))
    o.append(ARR(sx, sy, sx + vs[0], sy + vs[1], c=PUR, lw=1.8, head=7))
    o.append(TX(sx + vs[0] - 4, sy + vs[1] + 4, "v_i", "end", 10.5, PUR, True, halo=True))
    pr = float(vs @ L)
    o.append(W(sx + vs[0], sy + vs[1], sx + pr * L[0], sy + pr * L[1], c=PUR, lw=1, dash="3 3"))
    o.append(W(sx, sy, sx + pr * L[0], sy + pr * L[1], c=PUR, lw=3.4))
    o.append(TX(sx + pr * L[0] + 8, sy + pr * L[1] + 14, "l_i·v_i", "start", 10, PUR, True, halo=True))
    o.append(_f06_rx(rx, ry))
    vr = _f06_np.array([76.0, 0.0])
    o.append(ARR(rx, ry, rx + vr[0], ry + vr[1], c=SIG, lw=1.8, head=7))
    o.append(TX(rx + vr[0] + 4, ry + 4, "v（東へ 20 m/s）", "start", 10, SIG, True, halo=True))
    pr2 = float(vr @ L)
    o.append(W(rx + vr[0], ry, rx + pr2 * L[0], ry + pr2 * L[1], c=SIG, lw=1, dash="3 3"))
    o.append(W(rx, ry, rx + pr2 * L[0], ry + pr2 * L[1], c=SIG, lw=3.4))
    o.append(TX(rx + pr2 * L[0] - 8, ry + pr2 * L[1] - 6, "l_i·v", "end", 10, SIG, True, halo=True))
    o.append(TX(176, 124, "視線 l_i", "middle", 10, MUT, True, halo=True))
    xf = 360
    o.append(T(xf, 50, "距離の変わる速さ:", "start", 10, INK, True))
    o.append(TX(xf, 70, "ṙ_i = l_i·(v_i − v)", "start", 11, INK, True))
    o.append(T(xf, 98, "擬似距離の変化率（時計のドリフト ḃ が加わる）:", "start", 10, INK, True))
    o.append(TX(xf, 118, "ρ̇_i = ṙ_i + ḃ = −λ f_{D,i}", "start", 11, INK, True))
    o.append(TX(xf, 146, "ドップラー f_D は、距離が縮むとき正（4 章 2 節）。", "start", 9.5, MUT))
    o.append(T(xf, 162, "したがってドップラーは、", "start", 9.5, MUT))
    o.append(TX(xf, 178, "−l_i·v_i/λ（衛星）＋ l_i·v/λ（受信機）− ḃ/λ（時計）", "start", 9.5, INK, True))
    o.append(T(xf, 194, "の 3 つの和になる（λ = 19.03 cm）", "start", 9.5, MUT))
    # (b) 内訳（全幅）
    y0 = 252
    o.append(T(14, y0 - 22, "(b) 東京の 8 つの衛星のドップラーの内訳 [Hz]（受信機は東へ 20 m/s、TCXO +0.5 ppm）", "start", 11, INK, True))
    parts = _f06_dopparts()
    rh = 22
    cols = [("衛星の動きによる分", 190, 110, 3500, PUR, 1), ("受信機の動きによる分", 420, 76, 120, SIG, 2), ("時計のドリフト", 600, 48, 1000, GLD, 3)]
    for ttl, xc, half, vmax, c, idx in cols:
        o.append(T(xc, y0 - 4, ttl, "middle", 9.5, c, True))
        o.append(W(xc, y0 + 2, xc, y0 + rh * len(parts) + 2, c=MUT, lw=1))
        o.append(W(xc - half, y0 + rh * len(parts) + 2, xc + half, y0 + rh * len(parts) + 2, c=MUT, lw=1))
        for v in (-vmax, 0, vmax):
            o.append(T(xc + half * v / vmax, y0 + rh * len(parts) + 15, ("%+g" % v if v else "0").replace("-", "−"), "middle", 8.5, MUT))
        for k, row in enumerate(parts):
            v = row[idx]
            yy = y0 + 4 + k * rh
            w_ = half * v / vmax
            o.append(RECT(min(xc, xc + w_), yy + 2, abs(w_), rh - 8, 2, soft(c), c, 1.0))
            txt = ("+" if v > 0 else "") + _f06_m(v, 1)
            o.append(T(xc + (-5 if v > 0 else 5), yy + 13, txt, "end" if v > 0 else "start", 9, c, True))
    o.append(T(694, y0 - 4, "合計", "end", 9.5, INK, True))
    for k, (nm, fs, fr, fc, ft) in enumerate(parts):
        yy = y0 + 4 + k * rh
        o.append(T(16, yy + 13, nm, "start", 10, PUR, True))
        o.append(T(694, yy + 13, _f06_m(ft, 1), "end", 9.5, INK, True))
    return SVG(700, y0 + rh * len(parts) + 24, o, "ドップラーの内訳（東京、受信機は東へ 20 m/s、TCXO の周波数のずれは +0.5 ppm。例の値）。(a) 距離の変わる速さは、衛星と受信機の速度の差の、視線の向きの成分である。(b) 衛星の動きによる分は衛星ごとに大きく違い、受信機の動きによる分は東の空の衛星（G13・G3 など）で正になる。時計のドリフトによる分は、どの衛星も同じ −787.7 Hz である（棒の目盛は列ごとに違う）。")
F["e06_dopgeom"] = _f06_dopgeom_fig()


# =====================================================================
# 5 節: 位置の差から求める速度と、ドップラーから求める速度
# =====================================================================
def _f06_velnoise_fig():
    o = []
    Ge = _f06_Genu(_F06_ALL)
    A = _f06_np.linalg.solve(Ge.T @ Ge, Ge.T)
    rng = _f06_np.random.default_rng(16)
    n = 61
    pos = (rng.standard_normal((n, len(_F06_ALL))) * 0.82) @ A.T          # 位置の誤差（1 s ごと）
    vd = (rng.standard_normal((n, len(_F06_ALL))) * 0.05 * _F06_LAM) @ A.T  # ドップラーから求めた速度の誤差
    ve_pos = 20.0 + (pos[1:, 0] - pos[:-1, 0]) / 1.0
    ve_dop = 20.0 + vd[1:, 0]
    ts = _f06_np.arange(1, n)
    o.append(T(14, 18, "(a) 東向きの速度（本当は 20 m/s 一定）", "start", 11, INK, True))
    p = Plot(56, 34, 400, 200, (0, 60), (16, 24))
    o.append(p.axes(xl="時間 t [s]", yl="東向きの速度 [m/s]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[16, 18, 20, 22, 24]))
    o.append(p.line([(0, 20), (60, 20)], c=GRN, lw=1.4, dash="5 3"))
    o.append(p.clip(list(zip(ts, ve_pos)), c=ALI, lw=1.4))
    o.append(p.line(list(zip(ts, ve_dop)), c=GLD, lw=2))
    sd_pos = float(_f06_np.sqrt(2 * (A @ A.T)[0, 0]) * 0.82)
    sd_dop = float(_f06_np.sqrt((A @ A.T)[0, 0]) * 0.05 * _F06_LAM)
    o.append(LEGL(56, 288, [(ALI, None, "位置の差 ÷ 1 s"), (GLD, None, "ドップラーから"), (GRN, "5 3", "本当の値")]))
    # (b) 拡大
    xb = 500
    o.append(T(xb - 14, 18, "(b) ドップラーから（拡大）", "start", 11, INK, True))
    q = Plot(xb + 36, 34, 150, 200, (0, 60), (19.95, 20.05))
    o.append(q.axes(xl="時間 t [s]", yl=None, xt=[0, 30, 60], yt=[19.95, 20.0, 20.05], yfmt=lambda v: "%.2f" % v))
    o.append(q.line([(0, 20), (60, 20)], c=GRN, lw=1.4, dash="5 3"))
    o.append(q.clip(list(zip(ts, ve_dop)), c=GLD, lw=1.8))
    o.append(T(14, 312, "誤差の標準偏差（東向きの成分）: 位置の差から %.2f m/s、ドップラーから %.3f m/s（約 %.0f 分の 1）" % (sd_pos, sd_dop, sd_pos / sd_dop), "start", 10, INK, True))
    return SVG(700, 322, o, "位置の差から求めた速度と、ドップラーから求めた速度（東京、8 つの衛星。擬似距離の雑音は 1 s ごとに 0.82 m（3 章 6 節の 45 dB-Hz の値）、ドップラーの雑音は 0.05 Hz（例の値））。位置の揺れは、差をとるとそのまま速度の揺れになる。ドップラーから求めた速度の揺れは、その 100 分の 1 ほどである。ゆっくり変わる誤差（大気の遅れなど）は、どちらでもほとんど消える。")
F["e06_velnoise"] = _f06_velnoise_fig()


# =====================================================================
# 6 節: 楕円体の切り口・法線・緯度と、逆の変換の繰り返し
# =====================================================================
_F06_A = GNSS_AW
_F06_AP = GNSS_AW * (1 - GNSS_FW)


def _f06_inv(x, y, z, n=4):
    """ECEF → 緯度・楕円体高の繰り返し。返り値 [(B [°], h [m]), …]（B_0 は h = 0 とおいた値）。"""
    s = math.hypot(x, y)
    k2 = _F06_AP ** 2 / _F06_A ** 2
    B = math.atan2(z, s * k2)
    out = []
    for _ in range(n):
        RN = _F06_A ** 2 / math.sqrt(_F06_A ** 2 * math.cos(B) ** 2 + _F06_AP ** 2 * math.sin(B) ** 2)
        h = s / math.cos(B) - RN
        out.append((B / _F06_D2R, h))
        B = math.atan2(z * (RN + h), s * (k2 * RN + h))
    return out


def _f06_ellip_fig():
    o = []
    o.append(T(14, 18, "(a) 子午線を含む面の切り口（扁平率を大きくして描いた）", "start", 11, INK, True))
    A, Bp = 146.0, 103.0           # 描くときの赤道の半径と極の半径 [px]
    cx, cy = 226, 196
    o.append(W(cx - A - 16, cy, cx + A + 24, cy, c=MUT, lw=1))
    o.append(W(cx, cy + Bp + 20, cx, cy - Bp - 22, c=MUT, lw=1))
    o.append(T(cx + A + 26, cy + 4, "s", "start", 10, MUT, True))
    o.append(T(cx + 5, cy - Bp - 22, "z", "start", 10, MUT, True))
    pts = [(cx + A * math.cos(t), cy - Bp * math.sin(t)) for t in _f06_np.linspace(0, 2 * math.pi, 181)]
    o.append(PL(pts, c=GRN, lw=1.8, fill=GSOFT))
    Bd = 35.681 * _F06_D2R
    RN = A * A / math.sqrt(A * A * math.cos(Bd) ** 2 + Bp * Bp * math.sin(Bd) ** 2)
    ps, pz = RN * math.cos(Bd), (Bp * Bp / (A * A)) * RN * math.sin(Bd)
    P = (cx + ps, cy - pz)
    qz = -(1 - Bp * Bp / (A * A)) * RN * math.sin(Bd)
    Q = (cx, cy - qz)
    hh = 34.0
    P2 = (P[0] + hh * math.cos(Bd), P[1] - hh * math.sin(Bd))
    o.append(W(Q[0], Q[1], P2[0], P2[1], c=SIG, lw=1.6))
    o.append(W(cx, cy, P[0], P[1], c=MUT, lw=1.2, dash="4 3"))
    o.append(D(P[0], P[1], SIG, 3.8))
    o.append(D(Q[0], Q[1], SIG, 3.4))
    o.append(_f06_rx(P2[0], P2[1] - 3))
    o.append(T(P2[0], P2[1] - 16, "受信機", "middle", 9.5, GRN, True, halo=True))
    o.append(TX((P[0] + P2[0]) / 2 + 8, (P[1] + P2[1]) / 2 + 8, "h", "start", 10.5, SIG, True, halo=True))
    o.append(TX((Q[0] + P[0]) / 2 - 2, (Q[1] + P[1]) / 2 - 10, "R_N", "end", 10.5, SIG, True, halo=True))
    # 緯度 B（Q での法線と水平の角）
    ra = 26
    o.append(W(Q[0], Q[1], Q[0] + 44, Q[1], c=SIG, lw=1, dash="2 2"))
    o.append(PATH("M%g,%g A%g,%g 0 0,0 %g,%g" % (Q[0] + ra, Q[1], ra, ra, Q[0] + ra * math.cos(Bd), Q[1] - ra * math.sin(Bd)), c=SIG, lw=1.3))
    o.append(TX(Q[0] + ra + 6, Q[1] - 6, "B", "start", 10.5, SIG, True, halo=True))
    # 地球の中心から見た角度
    gc = math.atan2(pz, ps)
    rg = 44
    o.append(PATH("M%g,%g A%g,%g 0 0,0 %g,%g" % (cx + rg, cy, rg, rg, cx + rg * math.cos(gc), cy - rg * math.sin(gc)), c=MUT, lw=1.2))
    o.append(T(cx + rg + 4, cy + 14, "中心から見た角度", "start", 9, MUT, halo=True))
    o.append(T(Q[0] - 6, Q[1] + 4, "法線が z 軸を横切る点", "end", 9, SIG, True, halo=True))
    o.append(DIM(cx, cy + Bp + 12, cx + A, cy + Bp + 12, None, c=INK))
    o.append(TX(cx + A / 2, cy + Bp + 26, "a（赤道の半径）", "middle", 9.5, INK))
    o.append(DIM(cx - A - 10, cy, cx - A - 10, cy - Bp, None, c=INK))
    o.append(TX(cx - A - 14, cy - Bp / 2, "a_p", "end", 10, INK, True))
    o.append(T(cx - A - 14, cy - Bp / 2 + 14, "（極の半径）", "end", 9, INK))
    # (b) WGS 84 と東京の値
    xb = 420
    o.append(T(xb, 18, "(b) WGS 84 と東京の値", "start", 11, INK, True))
    rows = [("赤道の半径 a", "6 378 137 m（規格の値）"), ("扁平率", "1/298.257 223 563（規格の値）"),
            ("極の半径 a_p", "6 356 752.314 m"), ("a − a_p", "21 384.686 m")]
    for k, (l1, l2) in enumerate(rows):
        o.append(TX(xb, 42 + k * 17, l1, "start", 9.5, MUT))
        o.append(T(xb + 104, 42 + k * 17, l2, "start", 9.5, INK, True))
    RNt = _F06_A ** 2 / math.sqrt(_F06_A ** 2 * math.cos(_f06_B) ** 2 + _F06_AP ** 2 * math.sin(_f06_B) ** 2)
    zc = (1 - _F06_AP ** 2 / _F06_A ** 2) * RNt * math.sin(_f06_B)
    s_t = math.hypot(_F06_RX[0], _F06_RX[1])
    gct = math.atan2(_F06_RX[2], s_t) / _F06_D2R
    o.append(T(xb, 122, "東京（35.681°、139.767°、40 m）:", "start", 9.5, INK, True))
    o.append(TX(xb, 139, "R_N = %s km、法線は中心の %.1f km 南を通る" % (_f06_g3(RNt / 1e3, 3), zc / 1e3), "start", 9.5, SIG))
    o.append(T(xb, 156, "中心から見た角度 %.3f°（緯度との差 %.3f°）" % (gct, 35.681 - gct), "start", 9.5, MUT))
    # (c) 逆の変換の繰り返し
    o.append(T(xb, 190, "(c) ECEF → 緯度・楕円体高の繰り返し（東京）", "start", 11, INK, True))
    hd = [("回", xb + 10, "middle"), ("緯度 B [°]", xb + 132, "end"), ("緯度の誤差", xb + 210, "end"), ("h [m]", xb + 270, "end")]
    for t_, x, a_ in hd:
        o.append(T(x, 210, t_, a_, 9.5, MUT, True))
    o.append(W(xb, 215, xb + 276, 215, c=LIN, lw=0.8))
    for k, (Bk, hk) in enumerate(_f06_inv(*_F06_RX, n=4)):
        yy = 230 + k * 16
        err_m = abs(Bk - 35.681) * _F06_D2R * 6.37e6
        o.append(T(xb + 10, yy, "%d" % k, "middle", 9.5, INK))
        o.append(T(xb + 132, yy, "%.10f" % Bk, "end", 9.5, SIG, True))
        es = "%.2f m" % err_m if err_m >= 0.01 else ("%.1f mm" % (err_m * 1e3) if err_m >= 1e-4 else ("%.1f μm" % (err_m * 1e6) if err_m >= 1e-8 else "0"))
        o.append(T(xb + 210, yy, es, "end", 9.5, MUT))
        o.append(T(xb + 270, yy, "%.4f" % hk, "end", 9.5, SIG))
    o.append(T(xb, 306, "0 回目は h = 0 とおいて求めた値。誤差は地上の距離", "start", 9, MUT))
    o.append(T(xb, 320, "に直したもの。2 回で 1 mm よりはるかに小さくなる", "start", 9, MUT))
    return SVG(700, 334, o, "楕円体の幾何（WGS 84）。(a) 緯度 B は、楕円体の法線が赤道面となす角で、法線は地球の中心を通らず、z 軸を中心より南で横切る。R<sub>N</sub> は、面の点から法線に沿って z 軸まで測った長さ、h は法線に沿った高さ（扁平率を大きくして描いた）。(b) WGS 84 の寸法と、東京の値。(c) ECEF の座標から緯度と楕円体高を求める繰り返し。")
F["e06_ellip"] = _f06_ellip_fig()


# =====================================================================
# 6 節: ENU の軸と、ECEF の差を ENU の成分に直す回転
# =====================================================================
def _f06_enu_fig():
    o = []
    o.append(T(14, 18, "(a) 地球と、東京の ENU の軸", "start", 11, INK, True))
    az, el = (_F06_TOK[1] + 60) * _F06_D2R, 38 * _F06_D2R
    r_ = _f06_np.array([-math.sin(az), math.cos(az), 0.0])
    u_ = _f06_np.array([-math.sin(el) * math.cos(az), -math.sin(el) * math.sin(az), math.cos(el)])
    d_ = _f06_np.array([math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)])
    cx, cy, R = 186, 188, 110

    def pj(q):
        q = _f06_np.asarray(q, float)
        return cx + R * float(q @ r_), cy - R * float(q @ u_), float(q @ d_)
    o.append(CIRC(cx, cy, R, c=GRN, lw=1.4, fill=GSOFT))

    def curve(pts3, c, lw=0.8, dash=None):
        seg, out = [], []
        for q in pts3:
            x, y, dd = pj(q)
            if dd >= 0:
                seg.append((x, y))
            else:
                if len(seg) > 1:
                    out.append(PL(seg, c=c, lw=lw, dash=dash))
                seg = []
        if len(seg) > 1:
            out.append(PL(seg, c=c, lw=lw, dash=dash))
        return "".join(out)
    for lat in (-60, -30, 0, 30, 60):
        b = lat * _F06_D2R
        o.append(curve([(math.cos(b) * math.cos(t), math.cos(b) * math.sin(t), math.sin(b)) for t in _f06_np.linspace(0, 2 * math.pi, 145)], GRN, 1.0 if lat == 0 else 0.6))
    for lon in range(0, 360, 30):
        l = lon * _F06_D2R
        o.append(curve([(math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b)) for b in _f06_np.linspace(-math.pi / 2, math.pi / 2, 73)], GRN, 1.0 if lon == 0 else 0.6))
    # ECEF の軸
    for vec, lab in (((1.3, 0, 0), "x"), ((0, 1.35, 0), "y"), ((0, 0, 1.38), "z")):
        x, y, _ = pj(vec)
        o.append(ARR(cx, cy, x, y, c=INK, lw=1.3, head=6))
        o.append(T(x + (6 if x >= cx else -6), y - 4, lab, "start" if x >= cx else "end", 10.5, INK, True, halo=True))
    # 東京の ENU
    Bt, Lt = _f06_B, _f06_L
    P = _f06_np.array([math.cos(Bt) * math.cos(Lt), math.cos(Bt) * math.sin(Lt), math.sin(Bt)])
    px, py, _ = pj(P)
    o.append(D(px, py, SIG, 3.6))
    for row, lab in ((_F06_RENU[0], "東"), (_F06_RENU[1], "北"), (_F06_RENU[2], "上")):
        x, y, _ = pj(P + 0.42 * row)
        o.append(ARR(px, py, x, y, c=SIG, lw=1.8, head=7))
        o.append(T(x + (5 if x >= px else -5), y + (12 if y > py else -3), lab, "start" if x >= px else "end", 10, SIG, True, halo=True))
    o.append(T(px - 8, py + 15, "東京", "end", 9.5, SIG, True, halo=True))
    # (b) 回転の行列（東京の値）
    xb = 350
    o.append(T(xb, 18, "(b) 東京の回転の行列（緯度 35.681°、経度 139.767°）", "start", 11, INK, True))
    names = [("東", "(−sin L, cos L, 0)"), ("北", "(−sin B cos L, −sin B sin L, cos B)"), ("上", "(cos B cos L, cos B sin L, sin B)")]
    for k, (lab, f) in enumerate(names):
        yy = 46 + k * 34
        o.append(T(xb, yy, lab, "start", 10.5, SIG, True))
        o.append(TX(xb + 22, yy, f, "start", 9.5, MUT))
        o.append(T(xb + 22, yy + 15, "= (%s, %s, %s)" % tuple(_f06_m(v, 4) for v in _F06_RENU[k]), "start", 10, INK, True))
    # 例: G9 への向き
    p9 = _F06_V["G9"][4]
    dvec = p9 - _F06_RX
    enu = _F06_RENU @ dvec
    th = math.atan2(enu[2], math.hypot(enu[0], enu[1])) / _F06_D2R
    al = (math.atan2(enu[0], enu[1]) / _F06_D2R) % 360
    yc = 168
    o.append(T(xb, yc, "例: 受信機から G9 へのベクトル [km]", "start", 10, INK, True))
    o.append(TX(xb, yc + 18, "ECEF の差 (x_i − x, y_i − y, z_i − z)", "start", 9.5, PUR))
    o.append(TX(xb + 14, yc + 34, "= (%s, %s, %s)" % tuple(_f06_g3(v / 1e3, 1) for v in dvec), "start", 9.5, PUR, True))
    o.append(TX(xb, yc + 52, "→ (e, n, u) = (%s, %s, %s)" % tuple(_f06_g3(v / 1e3, 1) for v in enu), "start", 9.5, SIG, True))
    o.append(TX(xb, yc + 70, "→ 仰角 θ = %.1f°、方位角 α = %.1f°（1 章 5 節の式）" % (th, al), "start", 9.5, SIG, True))
    o.append(T(xb, yc + 96, "東・北・上は互いに直交する長さ 1 のベクトルなので、", "start", 9.5, MUT))
    o.append(T(xb, yc + 110, "ENU の成分は、それぞれとの内積で求まる", "start", 9.5, MUT))
    o.append(T(xb, yc + 130, "使い道: 衛星の仰角と方位角、解の誤差の水平と上下、", "start", 9.5, MUT))
    o.append(T(xb, yc + 144, "速度の東・北・上の成分（速さと進む向き）", "start", 9.5, MUT))
    return SVG(700, 322, o, "ENU 座標の軸と回転。(a) 東京の ENU の 3 つの軸（青）。上は楕円体の法線の向き、東は経度を増やす向き、北は緯度を増やす向きで、どれも緯度 B と経度 L で決まる（地球の網目は 30° ごと）。(b) 3 つの向きを行に並べた行列を ECEF の差のベクトルに掛けると、ENU の成分になる。")
F["e06_enu"] = _f06_enu_fig()


# =====================================================================
# 6 節: 楕円体・ジオイド・地面と、楕円体高・ジオイド高・標高
# =====================================================================
def _f06_geoid_fig():
    o = []
    o.append(TX(14, 18, "楕円体高 h、ジオイド高 h_g、標高 H の関係（高さの向きは大きく引き伸ばした）", "start", 11, INK, True))
    x0, x1, ye = 30, 670, 250
    o.append(W(x0, ye, x1, ye, c=MUT, lw=1.6))
    o.append(T(x1, ye + 16, "楕円体（WGS 84）", "end", 10, MUT, True))
    xs = _f06_np.linspace(x0, x1, 161)
    geo = [ye - 110 - 26 * math.sin((x - x0) / 120.0) - 12 * math.sin((x - x0) / 47.0) for x in xs]
    # 海（左側）
    sea_end = 250
    sea = [(x, g) for x, g in zip(xs, geo) if x <= sea_end]
    o.append(PL(sea + [(sea_end, ye - 20), (x0, ye - 20)], c="none", lw=0, fill=SSOFT))
    o.append(T(80, ye - 36, "海", "middle", 10, SIG, True))
    # 地面（右側の陸）
    land = []
    for x, g in zip(xs, geo):
        if x >= sea_end - 10:
            land.append((x, max(52.0, g - 8 - max(0.0, (x - sea_end + 10)) * 0.2 - 30 * math.sin((x - sea_end) / 70.0) ** 2)))
    o.append(PL(land + [(x1, ye - 20), (sea_end - 10, ye - 20)], c=GRN, lw=1.4, fill=GSOFT))
    o.append(T(620, ye - 34, "陸", "middle", 10, GRN, True))
    o.append(PL(list(zip(xs, geo)), c=PUR, lw=1.8, dash="6 3"))
    o.append(T(150, geo[30] - 10, "ジオイド（平均の海面にほぼ一致する、重力の向きに垂直な面）", "start", 9.5, PUR, True, halo=True))
    # 受信機の点
    k = 112
    xp, yg = xs[k], geo[k]
    yp = land[k - (len(xs) - len(land))][1]
    o.append(_f06_rx(xp, yp - 4))
    o.append(T(xp + 10, yp - 12, "受信機", "start", 10, GRN, True, halo=True))
    o.append(DIM(xp - 34, ye, xp - 34, yp, None, c=SIG))
    o.append(TX(xp - 40, (ye + yp) / 2 + 4, "楕円体高 h", "end", 10, SIG, True, halo=True))
    o.append(DIM(xp + 26, ye, xp + 26, yg, None, c=PUR))
    o.append(TX(xp + 32, (ye + yg) / 2 + 4, "ジオイド高 h_g", "start", 10, PUR, True, halo=True))
    o.append(DIM(xp + 6, yg, xp + 6, yp, None, c=GLD))
    o.append(TX(xp + 12, (yg + yp) / 2 + 4, "標高 H", "start", 10, GLD, True, halo=True))
    o.append(W(xp - 50, yg, xp + 30, yg, c=PUR, lw=0.8, dash="2 2"))
    # 式と東京の値
    o.append(TX(30, 290, "H ≈ h − h_g（楕円体の法線と重力の向きの違いは、ごく小さい）", "start", 10.5, INK, True))
    o.append(TX(30, 310, "例: 東京駅のあたり  h = 40 m（1 章の例）、h_g ≈ 37 m（代表値）→ H ≈ 3 m", "start", 10, GLD, True))
    o.append(T(30, 328, "GNSS で求まるのは h。標高にするには、その場所のジオイド高（国土地理院のジオイド・モデルなど）が要る", "start", 9.5, MUT))
    return SVG(700, 338, o, "楕円体高・ジオイド高・標高。GNSS で求まるのは楕円体から測った高さ（楕円体高）で、地図の標高は、平均の海面にほぼ一致するジオイドから測る。ジオイドは楕円体に対して波打っていて、日本の陸地ではジオイド高が数十 m ある（東京のあたりで約 37 m。代表値）。")
F["e06_geoid"] = _f06_geoid_fig()
