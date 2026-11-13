# -*- coding: utf-8 -*-
# 22 章 筐体とアンテナの置き方 — 材料・金属・空の見え方 の図
# 数値は本文の検算（$SP/g22/*.py）と同じ式で、この中で計算する。w22.js と同じモデル。
import numpy as _f22_np

_F22_D = math.pi / 180
_F22_C = 299792458.0
_F22_F1 = 1575.42e6                      # L1 [Hz]
_F22_LAM = _F22_C / _F22_F1              # L1 の波長 [m]（19.03 cm）
_F22_TOK = GNSS_TOKYO
_F22_ALL = ("GPS", "GLONASS", "Galileo", "BeiDou", "QZSS")


def _f22_f(v, d=1):
    """数の文字（負の符号は −）。"""
    s = ("%." + str(d) + "f") % v
    if s.startswith("-") and float(s) == 0:
        s = s[1:]
    return s.replace("-", "−")


def _f22_m(v):
    """目盛の数字。"""
    if abs(v) < 1e-12:
        return "0"
    return ("%g" % v).replace("-", "−")


# =====================================================================
# 空の配置と DOP（6・7 章と同じ: 東京・時刻 0。全部の衛星系では時計のずれを衛星系ごとに置く）
# =====================================================================
def _f22_vis(systems=("GPS",), t=0.0):
    out = []
    for s in gnss_const():
        if s["sys"] not in systems:
            continue
        el, az, d = elaz(*_F22_TOK, sat_ecef(s, t))
        if el > 0:
            out.append((s["nm"], el, az, s["sys"]))
    return sorted(out, key=lambda q: -q[1])


_F22_GPS = _f22_vis()
_F22_AS = _f22_vis(_F22_ALL)


def _f22_G(sats):
    us = []
    for q in sats:
        if q[3] not in us:
            us.append(q[3])
    rows = []
    for nm, el, az, sy in sats:
        e, a = el * _F22_D, az * _F22_D
        r = [-math.cos(e) * math.sin(a), -math.cos(e) * math.cos(a), -math.sin(e)] + [0.0] * len(us)
        r[3 + us.index(sy)] = 1.0
        rows.append(r)
    return _f22_np.array(rows), len(us)


def _f22_dops(sats):
    if not sats:
        return None
    Gm, nu = _f22_G(sats)
    if len(sats) < 3 + nu:
        return None
    H = _f22_np.linalg.inv(Gm.T @ Gm)
    return dict(H=math.sqrt(H[0, 0] + H[1, 1]), V=math.sqrt(H[2, 2]), n=len(sats))


def _f22_err(sats, eta):
    """擬似距離の誤差 eta を入れたときの解の誤差（東・北・上）と残差。"""
    Gm, nu = _f22_G(sats)
    dx = _f22_np.linalg.solve(Gm.T @ Gm, Gm.T @ _f22_np.array(eta))
    return dx, _f22_np.array(eta) - Gm @ dx


# 遮る仰角 [°]（方位角 az [°] の向き）
def _f22_wall(az, aw=180.0, h=20.0, d=10.0):
    """長い壁: 受信機から壁へ垂直に向かう方位 aw、壁までの距離 d、高さ h。"""
    c = math.cos((az - aw) * _F22_D)
    return math.degrees(math.atan(h * c / d)) if c > 0 else 0.0


def _f22_canyon(az, als=45.0, h=24.0, w=18.0):
    """通り（向き als、幅 w、両側の高さ h。受信機は真ん中）: tan θb = (2h/w)|sin(α − αs)|。"""
    return math.degrees(math.atan(2 * h / w * abs(math.sin((az - als) * _F22_D))))


def _f22_body(az, face=0.0, elb=60.0):
    """胸に着けた機器（face の向きを向いて立つ）: 後ろの半分を仰角 elb まで遮る（例の値）。"""
    return elb if math.cos((az - face) * _F22_D) < 0 else 0.0


def _f22_car(az, head=0.0):
    """車の室内（ダッシュボード。head の向きへ走る）: 後ろを 40°、横を 20° まで遮る（例の値）。"""
    r = (az - head) % 360
    if 100 <= r <= 260:
        return 40.0
    if 60 <= r < 100 or 260 < r <= 300:
        return 20.0
    return 0.0


def _f22_scene(sats, mf):
    return [q for q in sats if q[1] > mf(q[2])]


def _f22_nlos(q, als=45.0, h=24.0, w=18.0):
    """通りの中で、向かいの壁で 1 回反射して届くか。返り値: None（直接見える）、0（届かない）、余分の道のり [m]。"""
    s = abs(math.sin((q[2] - als) * _F22_D))
    if s < 1e-9:
        return None
    tp = math.tan(q[1] * _F22_D) / s          # 通りに垂直な面に投影した仰角の tan
    if (w / 2) * tp >= h:
        return None
    if 1.5 * w * tp > h:                       # 反射する点（高さ w/2·tp < h）へ向かう電波が手前の建物を越える
        return w * math.cos(q[1] * _F22_D) * s
    return 0


# =====================================================================
# 8 章のパッチのモデル（2 つのモードの共振回路を直列、Q = 100、共振で 50 Ω）と、離調の傾向のモデル（2 節）
# =====================================================================
_F22_Q = 100.0
_F22_XI0 = 0.010        # パッチの容量のうち、上の空気へはみ出した電界が受け持つ割合（例の値）
_F22_HE = 3.0           # はみ出した電界の容量が 1/e に減る高さ [mm]（例の値）
_F22_MAT = [("PP", 2.2), ("ABS", 2.8), ("PC", 2.9), ("PA66", 3.4), ("PA66-GF30", 4.0), ("ガラス", 6.5)]   # 比誘電率（代表値）


def _f22_patch(f, shift=0.0, match=False):
    """返り値 (Γ, 右旋の電力, 左旋の電力)。信号源 1 V・50 Ω。match=True は、L1 で整合の回路を足した場合（損失の無い回路で、L1 で Γ = 0）。"""
    f0 = _F22_F1 + shift; Z0 = 50.0; Q = _F22_Q
    K = lambda fk: 1 / (1 + 1j * Q * (f / fk - fk / f))
    ku, kv = K(f0 * (1 - 1 / (2 * Q))), K(f0 * (1 + 1 / (2 * Q)))
    Z = Z0 * (ku + kv); G = (Z - Z0) / (Z + Z0)
    I = 1 / (Z0 + Z); Vu, Vv = I * Z0 * ku, I * Z0 * kv
    PR, PL = abs(Vu - 1j * Vv) ** 2 / 2, abs(Vu + 1j * Vv) ** 2 / 2
    if match:   # 整合の回路は電力の受け渡しだけを変える（2 つのモードの比は変えない）
        sc = 0.25 / (PR + PL) if f == _F22_F1 else 1.0
        PR, PL, G = PR * sc, PL * sc, 0j if f == _F22_F1 else G
    return G, PR, PL


def _f22_l1(shift, match=False):
    G, PR, PL = _f22_patch(_F22_F1, shift, match)
    aR, aL = math.sqrt(PR), math.sqrt(PL)
    return dict(s11=20 * math.log10(max(abs(G), 1e-6)), ar=20 * math.log10((aR + aL) / max(abs(aR - aL), 1e-12)),
                rhcp=-10 * math.log10(PR / 0.25), lhcp=10 * math.log10(max(PL, 1e-30) / (PR + PL)),
                mis=-10 * math.log10(max(1 - abs(G) ** 2, 1e-12)))


def _f22_ar(f, shift):
    G, PR, PL = _f22_patch(f, shift)
    aR, aL = math.sqrt(PR), math.sqrt(PL)
    return 20 * math.log10((aR + aL) / max(abs(aR - aL), 1e-12))


def _f22_xip(hp, dp):
    return _F22_XI0 * math.exp(-dp / _F22_HE) * (1 - math.exp(-hp / _F22_HE))


def _f22_df(ep, hp, dp):
    """共振周波数のずれ [Hz]（近似 Δf ≈ −(εp − 1)ξp f0/2）。"""
    return -(ep - 1) * _f22_xip(hp, dp) * _F22_F1 / 2


# =====================================================================
# 8 章の例のアンテナのパターン（右旋の利得）と、3 章 3 節の C/N0 のモデル（4 節）
# =====================================================================
def _f22_ga3(el):
    return 3.0 - 8.0 * ((90.0 - el) / 85.0) ** 2


def _f22_gr(ela):
    """アンテナから見た仰角 ela [°]（−90〜90）の右旋の利得 [dBi]（8 章の例のアンテナ）。"""
    s = math.sin(math.radians(abs(ela)))
    rho = (1 - s) / (1 + s)
    if ela >= 0:
        return _f22_ga3(ela)
    g0 = 10 * math.log10(2 * 10 ** (_f22_ga3(0.0) / 10))
    gt = 10 ** ((g0 + (-13.0 - g0) * s ** 0.5) / 10)
    return 10 * math.log10(max(gt * rho ** 2 / (1 + rho ** 2), 1e-30))


def _f22_ela(el, az, chi, at):
    """傾けたアンテナから見た仰角: sin θa = sin θ cos χ + cos θ sin χ cos(α − αt)。"""
    s = math.sin(el * _F22_D) * math.cos(chi * _F22_D) + math.cos(el * _F22_D) * math.sin(chi * _F22_D) * math.cos((az - at) * _F22_D)
    return math.degrees(math.asin(max(-1.0, min(1.0, s))))


def _f22_cn0(el, ga):
    """3 章 3 節: EIRP 26.4 dBW、大気 0.5 dB、雑音は 290 K の熱雑音だけ。"""
    R, a = 6371e3, 26560e3
    r = math.sqrt(a * a - (R * math.cos(el * _F22_D)) ** 2) - R * math.sin(el * _F22_D)
    return 56.4 - 20 * math.log10(4 * math.pi * r / _F22_LAM) - 0.5 + ga + 174.0


def _f22_cn0t(q, chi, at, att=0.0):
    return _f22_cn0(q[1], _f22_gr(_f22_ela(q[1], q[2], chi, at))) - att


# =====================================================================
# 9 章のフリスの式（5 節）: アンテナの雑音温度 100 K、受信電力 −128.5 dBm
# =====================================================================
_F22_ST = [(18.0, 1.0), (-1.5, 1.5), (20.0, 3.0), (68.5, 3.0)]   # LNA・フィルタ・チップの増幅 2 つ（9 章 1 節）
_F22_ACT = [(18.0, 1.0), (-1.5, 1.5), (11.5, 2.0)]               # 9 章 5 節の例のアクティブアンテナ（28 dB）
_F22_CAB = [("細い同軸（外径 約 3 mm）", 1.2, ALI), ("中くらい（約 5 mm）", 0.5, GLD), ("太い同軸（約 10 mm）", 0.2, GRN)]   # dB/m（例の値）


def _f22_chain(st, tant=100.0):
    g, tot = 1.0, 0.0
    for G, NF in st:
        tot += (10 ** (NF / 10) - 1) * 290.0 / g
        g *= 10 ** (G / 10)
    tsys = tant + tot
    return -128.5 - (10 * math.log10(1.380649e-23 * tsys) + 30)


def _f22_passive(Lc):
    return _f22_chain([(-Lc, Lc)] + _F22_ST)


def _f22_active(Lc, gact=28.0):
    return _f22_chain([(18.0, 1.0), (-1.5, 1.5), (gact - 16.5, 2.0), (-Lc, Lc)] + _F22_ST[2:])


# =====================================================================
# 描く部品
# =====================================================================
def _f22_maskpoly(cx, cy, R, mf, n=180):
    """遮る範囲（地平線と、遮る仰角の線の間）の多角形。"""
    outer = [skyxy(cx, cy, R, 0.0, 360.0 * k / n) for k in range(n + 1)]
    inner = [skyxy(cx, cy, R, mf(360.0 * k / n), 360.0 * k / n) for k in range(n, -1, -1)]
    return PL(outer + inner, c="none", lw=0, fill=MSOFT) + PL(inner, c=MUT, lw=1.3)


def _f22_skyframe(cx, cy, R, rings=(30, 60), lab=True):
    """スカイプロットの地（01 章と同じ見た目。衛星は描かない）。"""
    return sky(cx, cy, R, [], rings=rings, dirs=lab)


def _f22_satmark(cx, cy, R, q, kind, lab=True, sz=9, c=None):
    """kind: "v"（直接見える）、"x"（遮られる）、"n"（反射波だけ）。"""
    x, y = skyxy(cx, cy, R, q[1], q[2])
    c = c or GNSS_SYSC[q[3]]
    o = []
    if kind == "x":
        o.append(W(x - 3.4, y - 3.4, x + 3.4, y + 3.4, c=FNT, lw=1.6) + W(x - 3.4, y + 3.4, x + 3.4, y - 3.4, c=FNT, lw=1.6))
        c = FNT
    elif kind == "n":
        o.append(CIRC(x, y, 6.5, c=ALI, lw=1.6))
        o.append(D(x, y, ALI, 3.4))
        c = ALI
    else:
        o.append(D(x, y, c, 3.8))
    if lab:
        o.append(T(x + 6, y + 3.5, q[0], "start", sz, c, kind != "x", halo=True))
    return "".join(o)


def _f22_rx(x, y, c=GRN):
    """受信機のアンテナの印（地面に置いた小さな板）。"""
    return W(x - 6, y, x + 6, y, c=c, lw=2.2) + RECT(x - 3.5, y - 4, 7, 4, 1, soft(c), c, 1.0)


def _f22_sat(x, y, c=SIG, s=0.7):
    return (W(x - 9 * s, y, x + 9 * s, y, c=c, lw=1.1)
            + RECT(x - 14 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x + 7.5 * s, y - 3.2 * s, 6.5 * s, 6.4 * s, 1, soft(c), c, 1.0)
            + RECT(x - 3.6 * s, y - 3.6 * s, 7.2 * s, 7.2 * s, 1.5, c, c, 1.0))


_F22_CID = [0]


def _f22_clip(x, y, w, h, body):
    """枠 (x, y, w, h) の外を切って描く。"""
    _F22_CID[0] += 1
    cid = "f22cp%d" % _F22_CID[0]
    return ('<clipPath id="%s"><rect x="%g" y="%g" width="%g" height="%g"/></clipPath><g clip-path="url(#%s)">%s</g>'
            % (cid, x, y, w, h, cid, "".join(body) if isinstance(body, list) else body))


def _f22_arc(cx, cy, r, a0, a1, n=30):
    """画面の角度 a0→a1 [°]（x 軸から反時計回り、y は上が負）の円弧の点。"""
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / n)), cy - r * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]


# =====================================================================
# 1 節: 遮る物と、スカイプロットの上の範囲
# =====================================================================
def _f22_mask_fig():
    o = []
    # (a) 横から見る（縦横を同じ縮尺で描いた: 1 m = 4.4 px）
    o.append(T(14, 18, "(a) 横から見る", "start", 11, INK, True))
    gy, sc = 238, 4.4
    ax = 30
    o.append(W(14, gy, 236, gy, c=MUT, lw=1.4))
    for k in range(9):
        o.append(W(20 + 26 * k, gy, 14 + 26 * k, gy + 6, c=FNT, lw=1))
    hb = 20.0 * sc
    for d, c, r in ((10.0, SIG, 30), (40.0, PUR, 56)):
        bx = ax + d * sc
        o.append(RECT(bx, gy - hb, 18, hb, 1, MSOFT, MUT, 1.2))
        th = math.degrees(math.atan2(hb, bx - ax))
        L = math.hypot(bx - ax, hb) + 26
        o.append(W(ax, gy, ax + L * math.cos(math.radians(th)), gy - L * math.sin(math.radians(th)), c=c, lw=1.4, dash="5 3"))
        o.append(PL(_f22_arc(ax, gy, r, 0, th), c=c, lw=1.8))
        o.append(DIM(ax, gy + (14 if d < 20 else 30), bx, gy + (14 if d < 20 else 30), None, c=c))
        o.append(T((ax + bx) / 2, gy + (14 if d < 20 else 30) - 3, "%d m" % d, "middle", 9.5, c, True, halo=True))
    o.append(_f22_rx(ax, gy))
    o.append(T(ax + 13, gy - 40, "63.4°", "end", 10, SIG, True, halo=True))
    o.append(T(ax + 64, gy - 10, "26.6°", "start", 10, PUR, True, halo=True))
    o.append(T(ax + 172, gy - 34, "どちらも", "end", 9.5, MUT, False, halo=True))
    o.append(T(ax + 172, gy - 20, "高さ 20 m", "end", 9.5, MUT, True, halo=True))
    o.append(TX(14, 42, "tan θ_b = h_b/d_b", "start", 11, INK, True))
    o.append(T(14, 60, "この仰角より低い衛星の直接波は届かない", "start", 9.5, MUT))
    # (b)(c) 上から見た図とスカイプロット
    pan = [("(b) 南に長い壁", ["高さ 20 m・10 m 先"], lambda a: _f22_wall(a), "wall"),
           ("(c) 北東〜南西に延びる通り", ["幅 18 m・両側の建物 24 m", "受信機は通りの真ん中"], lambda a: _f22_canyon(a), "canyon")]
    for k, (ttl, sub, mf, kind) in enumerate(pan):
        x0 = 252 + k * 226
        o.append(T(x0, 18, ttl, "start", 11, INK, True))
        mx, my, ms = x0 + 4, 28, 60
        cxm, cym = mx + ms / 2, my + ms / 2
        body = [RECT(mx, my, ms, ms, 0, SCR, "none", 0)]
        if kind == "wall":
            body.append(RECT(mx + 2, cym + 11, ms - 4, 9, 1, MSOFT, MUT, 1.1))
        else:
            u = (math.sin(math.radians(45)), -math.cos(math.radians(45)))     # 通りの向き（画面の座標。北東）
            v = (u[1] * -1, u[0])                                               # 通りに垂直（南東）
            for sg in (1, -1):
                c0 = (cxm + sg * 16 * v[0], cym + sg * 16 * v[1])
                pts = [(c0[0] + t * u[0] + e * v[0] * sg, c0[1] + t * u[1] + e * v[1] * sg) for t, e in ((-60, 0), (60, 0), (60, 30), (-60, 30))]
                body.append(PL(pts, c=MUT, lw=1.1, fill=MSOFT))
        o.append(_f22_clip(mx, my, ms, ms, body))
        o.append(RECT(mx, my, ms, ms, 3, "none", LIN, 1))
        o.append(D(cxm, cym, GRN, 3.6))
        o.append(ARR(mx + ms - 8, my + 20, mx + ms - 8, my + 5, c=INK, lw=1.1, head=5))
        o.append(T(mx + ms - 16, my + 16, "北", "end", 9, INK, True, halo=True))
        o.append(T(mx + ms + 8, my + 13, "上から見た図", "start", 9.5, MUT))
        for j, l in enumerate(sub):
            o.append(T(mx + ms + 8, my + 30 + 14 * j, l, "start", 9.5, INK))
        o.append(T(mx + ms + 8, my + 30 + 14 * len(sub), "緑の点が受信機", "start", 9.5, GRN))
        cx, cy, R = x0 + 104, 190, 74
        o.append(_f22_skyframe(cx, cy, R))
        o.append(_f22_maskpoly(cx, cy, R, mf))
        if kind == "wall":
            x, y = skyxy(cx, cy, R, _f22_wall(180.0), 180.0)
            o.append(T(x + 8, y + 14, "南で 63.4°", "start", 9.5, INK, True, halo=True))
        else:
            for az in (135.0, 315.0):
                x, y = skyxy(cx, cy, R, _f22_canyon(az), az)
                o.append(T(x + (6 if az == 135 else -6), y + (12 if az == 135 else -4), "69.4°", "start" if az == 135 else "end", 9.5, INK, True, halo=True))
    o.append(RECT(14, 289, 12, 11, 2, MSOFT, MUT, 1.0))
    o.append(T(32, 299, "遮る範囲（地平線から遮る仰角まで）", "start", 9.5, MUT))
    return SVG(700, 306, o, "遮る物の高さと距離から、スカイプロットの上に遮る範囲を描く（例の値の建物。(c) は受信機が通りの真ん中にいるとした）。")


F["e22_mask"] = _f22_mask_fig()


# =====================================================================
# 1 節: 場面ごとの見える衛星と DOP
# =====================================================================
def _f22_scenes_fig():
    o = []
    pan = [("(a) 開けた空", "周りに何も無い", lambda a: 0.0),
           ("(b) 南に建物", "高さ 20 m・10 m 先", lambda a: _f22_wall(a)),
           ("(c) 北東〜南西の通り", "幅 18 m・建物 24 m", lambda a: _f22_canyon(a)),
           ("(d) 胸に着けた機器", "北を向く・後ろを 60° まで", lambda a: _f22_body(a))]
    for k, (ttl, sub, mf) in enumerate(pan):
        x0 = 8 + k * 174
        o.append(T(x0 + 4, 16, ttl, "start", 10.5, INK, True))
        o.append(T(x0 + 4, 31, sub, "start", 9.5, MUT))
        cx, cy, R = x0 + 86, 116, 62
        o.append(sky(cx, cy, R, [], rings=(30, 60), dirs=True))
        if k > 0:
            o.append(_f22_maskpoly(cx, cy, R, mf))
        vis = _f22_scene(_F22_GPS, mf)
        for q in _F22_GPS:
            o.append(_f22_satmark(cx, cy, R, q, "v" if q in vis else "x", sz=8.5))
        dd = _f22_dops(vis)
        y = cy + R + 34
        if dd:
            o.append(T(cx, y, "GPS: %d つ" % len(vis), "middle", 10, SIG, True))
            o.append(T(cx, y + 15, "HDOP %s・VDOP %s" % (_f22_f(dd["H"], 2), _f22_f(dd["V"], 2)), "middle", 9.5, INK))
        else:
            o.append(T(cx, y, "GPS: %d つ" % len(vis), "middle", 10, ALI, True))
            o.append(T(cx, y + 15, "3 次元の位置を解けない", "middle", 9.5, ALI, True))
        va = _f22_scene(_F22_AS, mf)
        da = _f22_dops(va)
        o.append(T(cx, y + 34, "全部の衛星系: %d つ" % len(va), "middle", 9.5, GLD, True))
        o.append(T(cx, y + 48, "HDOP %s・VDOP %s" % (_f22_f(da["H"], 2), _f22_f(da["V"], 2)), "middle", 9.5, MUT))
    o.append(D(20, 296, SIG, 3.8)); o.append(T(28, 300, "直接波が届く GPS の衛星", "start", 9.5, MUT))
    o.append(W(196, 292, 203, 299, c=FNT, lw=1.6)); o.append(W(196, 299, 203, 292, c=FNT, lw=1.6))
    o.append(T(209, 300, "遮られる衛星", "start", 9.5, MUT))
    o.append(RECT(300, 291, 12, 11, 2, MSOFT, MUT, 1.0)); o.append(T(318, 300, "遮る範囲", "start", 9.5, MUT))
    return SVG(700, 308, o, "場面ごとの見える衛星と DOP（6・7 章の東京・時刻 0。全部の衛星系では、時計のずれの未知数を衛星系ごとに置いた。(d) の体の陰は例の値）。")


F["e22_scenes"] = _f22_scenes_fig()


# =====================================================================
# 1 節: 通りの中の NLOS（断面・空・位置のずれ）
# =====================================================================
def _f22_nlos_fig():
    o = []
    h, w, als = 24.0, 18.0, 45.0
    q13 = [q for q in _F22_GPS if q[0] == "G13"][0]
    s13 = abs(math.sin((q13[2] - als) * _F22_D))
    tp = math.tan(q13[1] * _F22_D) / s13
    thp = math.degrees(math.atan(tp))
    # (a) 通りに垂直な断面（衛星の向きを、通りに垂直な面に投影した）
    o.append(T(14, 16, "(a) 通りに垂直な断面（G13 の向きを投影した）", "start", 10.5, INK, True))
    sc = 5.0
    cx, gy = 150, 196
    xa, xb = cx + w / 2 * sc, cx - w / 2 * sc          # 衛星の側の建物 A の壁（右）、向かいの建物 B の壁（左）
    o.append(W(20, gy, 290, gy, c=MUT, lw=1.4))
    o.append(RECT(xa, gy - h * sc, 290 - xa, h * sc, 0, MSOFT, MUT, 1.2))
    o.append(RECT(20, gy - h * sc, xb - 20, h * sc, 0, MSOFT, MUT, 1.2))
    o.append(T((xa + 290) / 2, gy - h * sc + 16, "建物 A", "middle", 9.5, INK, True))
    o.append(T((20 + xb) / 2, gy - h * sc + 16, "建物 B", "middle", 9.5, INK, True))
    yr = (w / 2) * tp                                 # 反射する点の高さ [m]
    # 直接波（A の壁に当たる）
    hit = (w / 2) * tp
    o.append(W(cx, gy, xa, gy - hit * sc, c=ALI, lw=1.6, dash="4 3"))
    xx, yy = xa + 3, gy - hit * sc
    o.append(W(xx - 5, yy - 5, xx + 5, yy + 5, c=ALI, lw=2)); o.append(W(xx - 5, yy + 5, xx + 5, yy - 5, c=ALI, lw=2))
    # 反射波: 衛星 → B の壁の点 → 受信機
    pr = (xb, gy - yr * sc)
    far = 175.0
    src = (pr[0] + far * math.cos(math.radians(thp)), pr[1] - far * math.sin(math.radians(thp)))
    o.append(ARR(src[0], src[1], pr[0] + 1, pr[1] + 1, c=PUR, lw=1.7, head=7))
    o.append(ARR(pr[0], pr[1], cx - 2, gy - 2, c=PUR, lw=1.7, head=7))
    o.append(D(pr[0], pr[1], PUR, 3.2))
    o.append(_f22_sat(src[0], src[1], SIG, 0.62))
    o.append(T(src[0] - 14, src[1] - 2, "G13", "end", 10, SIG, True, halo=True))
    o.append(_f22_rx(cx, gy))
    o.append(DIM(xb, gy + 14, xa, gy + 14, None, c=MUT))
    o.append(T(cx, gy + 11, "18 m", "middle", 9.5, MUT, True, halo=True))
    o.append(T(xb + 6, pr[1] + 14, "反射する点", "start", 9.5, PUR, True, halo=True))
    o.append(T(xb + 6, pr[1] + 27, "（高さ %s m）" % _f22_f(yr, 1), "start", 9.5, PUR, False, halo=True))
    o.append(T(xa - 6, gy - hit * sc - 8, "直接波は A に当たる", "end", 9.5, ALI, True, halo=True))
    o.append(T(20, gy + 34, "余分の道のり w_s cos θ |sin(α − α_s)| = %s m" % _f22_f(w * math.cos(q13[1] * _F22_D) * s13, 1), "start", 9.5, INK))
    o.append(T(20, gy + 50, "建物の高さ 24 m。投影した仰角 %s°" % _f22_f(thp, 1), "start", 9.5, MUT))
    # (b) 空
    o.append(T(316, 16, "(b) 空（GPS）", "start", 10.5, INK, True))
    scx, scy, R = 392, 112, 70
    o.append(sky(scx, scy, R, [], rings=(30, 60)))
    o.append(_f22_maskpoly(scx, scy, R, lambda a: _f22_canyon(a)))
    for q in _F22_GPS:
        r = _f22_nlos(q)
        o.append(_f22_satmark(scx, scy, R, q, "v" if r is None else ("n" if r else "x"), sz=8.5))
    o.append(D(318, 222, SIG, 3.8)); o.append(T(326, 226, "直接波", "start", 9.5, MUT))
    o.append(CIRC(378, 222, 6, c=ALI, lw=1.6)); o.append(D(378, 222, ALI, 3)); o.append(T(388, 226, "反射波だけ", "start", 9.5, MUT))
    o.append(W(446, 218, 453, 225, c=FNT, lw=1.6)); o.append(W(446, 225, 453, 218, c=FNT, lw=1.6)); o.append(T(458, 226, "届かない", "start", 9.5, MUT))
    # (c) 位置のずれ
    o.append(T(492, 16, "(c) 反射波だけの衛星も使って解く", "start", 10.5, INK, True))
    rows = []
    for nm, base in (("GPS だけ", _F22_GPS), ("全部の衛星系", _F22_AS)):
        use, eta = [], []
        for q in base:
            r = _f22_nlos(q)
            if r is None or r:
                use.append(q); eta.append(r or 0.0)
        dx, res = _f22_err(use, eta)
        rows.append((nm, len(use), sum(1 for e in eta if e > 0), dx, res))
    for j, (nm, n, nn, dx, res) in enumerate(rows):
        y0 = 40 + j * 132
        c = ALI if j == 0 else GLD
        o.append(T(492, y0, "%s: %d つ（うち反射波だけ %d）" % (nm, n, nn), "start", 9.5, c, True))
        p = Plot(500, y0 + 10, 84, 84, (-10, 10), (-10, 10))
        o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 1))
        o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=GRD, lw=1)); o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=GRD, lw=1))
        o.append(ARR(p.X(0), p.Y(0), p.X(dx[0]), p.Y(dx[1]), c=c, lw=2, head=7))
        o.append(D(p.X(0), p.Y(0), GRN, 3.4))
        o.append(T(p.x + p.w / 2, p.y + p.h + 12, "東・北 ±10 m", "middle", 9, MUT))
        xt = 596
        o.append(T(xt, y0 + 26, "水平 %s m" % _f22_f(math.hypot(dx[0], dx[1]), 1), "start", 10, c, True))
        o.append(T(xt, y0 + 42, "上下 %s m" % _f22_f(dx[2], 1), "start", 10, c, True))
        mr = float(_f22_np.max(_f22_np.abs(res)))
        o.append(T(xt, y0 + 62, "残差の最大", "start", 9.5, INK))
        o.append(T(xt, y0 + 76, "%s m" % _f22_f(mr, 1), "start", 9.5, INK, True))
        if mr < 1e-6:
            o.append(T(xt, y0 + 92, "見つけられない", "start", 9.5, ALI, True))
        else:
            o.append(T(xt, y0 + 92, "食い違いが見える", "start", 9.5, GRN, True))
    return SVG(700, 300, o, "通りの中の NLOS（幅 18 m・両側の建物 24 m の北東〜南西の通り。反射は向かいの壁での 1 回だけを数えた。(c) の矢印は、本当の位置（緑）からのずれの水平の成分）。")


F["e22_nlos"] = _f22_nlos_fig()
