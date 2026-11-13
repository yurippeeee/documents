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
    far = 122.0
    src = (pr[0] + far * math.cos(math.radians(thp)), pr[1] - far * math.sin(math.radians(thp)))
    o.append(ARR(src[0], src[1], pr[0] + 1, pr[1] + 1, c=PUR, lw=1.7, head=7))
    o.append(ARR(pr[0], pr[1], cx - 2, gy - 2, c=PUR, lw=1.7, head=7))
    o.append(D(pr[0], pr[1], PUR, 3.2))
    o.append(_f22_sat(src[0], src[1], SIG, 0.8))
    o.append(T(src[0] - 14, src[1] - 2, "G13", "end", 10, SIG, True, halo=True))
    o.append(_f22_rx(cx, gy))
    o.append(DIM(xb, gy + 14, xa, gy + 14, None, c=MUT))
    o.append(T(cx, gy + 11, "18 m", "middle", 9.5, MUT, True, halo=True))
    o.append(T(xb - 5, pr[1] + 18, "反射する点", "end", 9.5, PUR, True, halo=True))
    o.append(T(xb - 5, pr[1] + 31, "高さ %s m" % _f22_f(yr, 1), "end", 9.5, PUR, False, halo=True))
    o.append(T(xa + 10, gy - hit * sc + 4, "直接波は", "start", 9.5, ALI, True, halo=True))
    o.append(T(xa + 10, gy - hit * sc + 17, "A に当たる", "start", 9.5, ALI, True, halo=True))
    o.append(TX(20, gy + 34, "余分の道のり w_s cos θ |sin(α − α_s)| = %s m" % _f22_f(w * math.cos(q13[1] * _F22_D) * s13, 1), "start", 9.5, INK))
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


# =====================================================================
# 2 節: レドームと、はみ出した電界の容量のモデル
# =====================================================================
def _f22_radome_fig():
    o = []
    hp, dp, ep = 2.0, 1.0, 2.8
    # (a) 断面（1 mm = 7 px）
    o.append(T(14, 16, "(a) パッチとレドームの断面（例の寸法）", "start", 10.5, INK, True))
    k = 7.0
    gx0, gx1, gy = 24, 340, 236            # 地板の範囲と上の面
    cx = (gx0 + gx1) / 2
    ch = 4.0 * k                           # セラミックの厚さ 4 mm
    cw, pw = 25.0 * k, 21.0 * k
    yt = gy - ch                           # パッチの面
    # はみ出した電界の受け持つ容量の濃さ（高さごとの帯の濃さを e^(−z/h_e) にする）
    for j in range(16):
        op = 0.32 * math.exp(-(j + 0.5) / _F22_HE)
        o.append(RECT(cx - pw / 2 - 26, yt - (j + 1) * k, pw + 52, k + 0.4, 0, SIG, "none", 0, op=op))
    o.append(RECT(gx0, gy, gx1 - gx0, 7, 1, MSOFT, MUT, 1.2))
    o.append(RECT(cx - cw / 2, yt, cw, ch, 2, GOSOFT, GLD, 1.2))
    o.append(W(cx - pw / 2, yt, cx + pw / 2, yt, c=SIG, lw=3))
    o.append(W(cx + pw / 6, yt, cx + pw / 6, gy + 7, c=INK, lw=1.2))
    for sg in (1, -1):
        xe = cx + sg * pw / 2
        for a_, r in ((9, 10), (19, 22), (31, 36), (46, 52)):
            p0, p1, p2, p3 = (xe, yt), (xe, yt - a_), (xe + sg * r, yt - a_), (xe + sg * r * 1.25, gy)
            o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (p0 + p1 + p2 + p3), c=SIG, lw=1.0))
    yl = yt - dp * k
    o.append(RECT(gx0 + 4, yl - hp * k, gx1 - gx0 - 8, hp * k, 1, TSOFT, TEA, 1.3))
    o.append(TX(gx0 + 8, yl - hp * k - 7, "樹脂（比誘電率 ε_p。例: ABS 2.8）", "start", 9.5, TEA, True, halo=True))
    o.append(DIM(gx1 + 6, yl, gx1 + 6, yl - hp * k, None, c=TEA))
    o.append(TX(gx1 + 12, yl - hp * k / 2 + 4, "h_p = 2 mm", "start", 9.5, TEA, True))
    o.append(DIM(gx0 - 6, yt, gx0 - 6, yl, None, c=MUT))
    o.append(TX(gx0 - 10, yt + 13, "d_p = 1 mm", "start", 9.5, MUT, True))
    o.append(T(cx, yt + ch / 2 + 4, "セラミック（比誘電率 20）", "middle", 9.5, GLD, True))
    o.append(T(cx, gy + 22, "地板", "middle", 9.5, MUT, True))
    o.append(T(cx - 30, yt - 4, "パッチ", "middle", 9.5, SIG, True, halo=True))
    o.append(T(cx, 52, "縁からはみ出した電界（青の線）と、", "middle", 9.5, SIG, False, halo=True))
    o.append(T(cx, 66, "それが受け持つ容量の濃さ（青の地）", "middle", 9.5, SIG, False, halo=True))
    # (b) 高さごとの容量の密度
    o.append(T(392, 16, "(b) はみ出した電界の容量の分布（モデル）", "start", 10.5, INK, True))
    p = Plot(440, 34, 220, 150, (0, 1.05), (0, 12))
    o.append(p.axes(xl="高さあたりの容量（パッチの面で 1）", yl="パッチの面からの高さ [mm]", xt=[0, 0.5, 1], yt=[0, 3, 6, 9, 12], xfmt=_f22_m, yfmt=_f22_m))
    zs = [i * 0.05 for i in range(241)]
    band = [(math.exp(-z / _F22_HE), z) for z in zs if dp <= z <= dp + hp]
    poly = [(p.X(0), p.Y(dp))] + [(p.X(v), p.Y(z)) for v, z in band] + [(p.X(0), p.Y(dp + hp))]
    o.append(PL(poly, c="none", lw=0, fill=TSOFT))
    o.append(p.line([(math.exp(-z / _F22_HE), z) for z in zs], c=SIG, lw=2.2))
    o.append(W(p.X(0), p.Y(_F22_HE), p.X(math.exp(-1)), p.Y(_F22_HE), c=MUT, lw=1, dash="3 3"))
    o.append(TX(p.X(math.exp(-1)) + 6, p.Y(_F22_HE) + 4, "h_e = 3 mm で 1/e", "start", 9.5, MUT, False, halo=True))
    o.append(T(p.X(0.42), p.Y(dp + hp / 2) + 4, "樹脂の層", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(0.55), p.Y(9.6), "全部の面積: ξ_0 = 1 %", "start", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(0.55), p.Y(8.1), "層の面積: ξ_p = %s %%" % _f22_f(100 * _f22_xip(hp, dp), 2), "start", 9.5, TEA, True, halo=True))
    # (c) 共振回路の容量
    o.append(T(392, 238, "(c) 共振回路で見る（8 章 3 節）", "start", 10.5, INK, True))
    o.append(TX(392, 258, "C_P′ = C_P {1 + (ε_p − 1) ξ_p} = C_P × %s" % _f22_f(1 + (ep - 1) * _f22_xip(hp, dp), 4), "start", 10, INK))
    o.append(TX(392, 276, "f_0′ = f_0/√%s → Δf = %s MHz" % (_f22_f(1 + (ep - 1) * _f22_xip(hp, dp), 4), _f22_f(_f22_df(ep, hp, dp) / 1e6, 1)), "start", 10, ALI, True))
    o.append(TX(392, 294, "ξ_0・h_e は例の値（傾向のモデル）", "start", 9.5, MUT))
    return SVG(700, 304, o, "レドームの樹脂と、パッチの縁からはみ出した電界（(a) は断面の模式図。(b) は、はみ出した電界の受け持つ容量が高さとともに指数関数で減るとした近似のモデル）。")


F["e22_radome"] = _f22_radome_fig()


# =====================================================================
# 2 節: 離調の傾向（厚さ・隙間・材料）
# =====================================================================
def _f22_detune_fig():
    o = []
    # (a) 厚さ
    o.append(T(14, 16, "(a) 樹脂の厚さと共振のずれ（ABS）", "start", 10.5, INK, True))
    p = Plot(66, 34, 250, 160, (0, 8), (-12, 0))
    o.append(p.axes(xl="樹脂の厚さ h_p [mm]", yl="共振のずれ Δf [MHz]", xt=[0, 2, 4, 6, 8], yt=[-12, -9, -6, -3, 0], xfmt=_f22_m, yfmt=_f22_m))
    hs = [i * 0.05 for i in range(161)]
    cols = [(0.0, ALI), (1.0, SIG), (3.0, GLD), (5.0, GRN)]
    for dp, c in cols:
        o.append(p.line([(h, _f22_df(2.8, h, dp) / 1e6) for h in hs], c=c, lw=2))
        v = _f22_df(2.8, 8.0, dp) / 1e6
        o.append(TX(p.X(8) + 4, p.Y(v) + 4, "d_p = %g mm" % dp, "start", 9.5, c, True))
    o.append(D(p.X(2), p.Y(_f22_df(2.8, 2, 1) / 1e6), SIG, 4.4))
    o.append(T(p.X(2) + 7, p.Y(_f22_df(2.8, 2, 1) / 1e6) + 15, "例 −4.9 MHz", "start", 9.5, SIG, True, halo=True))
    # (b) 隙間
    o.append(T(380, 16, "(b) 隙間と共振のずれ（厚さ 2 mm）", "start", 10.5, INK, True))
    q = Plot(432, 34, 210, 160, (0, 10), (-24, 0))
    o.append(q.axes(xl="パッチとの隙間 d_p [mm]", yl="Δf [MHz]", xt=[0, 2, 4, 6, 8, 10], yt=[-24, -18, -12, -6, 0], xfmt=_f22_m, yfmt=_f22_m))
    ds = [i * 0.05 for i in range(201)]
    mc = {"PP": TEA, "ABS": SIG, "PA66-GF30": GLD, "ガラス": ALI}
    for nm, ep in _F22_MAT:
        if nm not in mc:
            continue
        o.append(q.line([(d, _f22_df(ep, 2.0, d) / 1e6) for d in ds], c=mc[nm], lw=2))
    for nm, yv in (("ガラス", -16.6), ("PA66-GF30", -9.8), ("ABS", -6.6), ("PP", -2.0)):
        o.append(T(q.X(0.25), q.Y(yv) + (13 if nm == "PP" else 0), nm, "start", 9.5, mc[nm], True, halo=True))
    o.append(D(q.X(1), q.Y(_f22_df(2.8, 2, 1) / 1e6), SIG, 4.4))
    # (c) 材料ごとの比誘電率（代表値）と、例の寸法でのずれ（横棒）
    o.append(T(14, 254, "(c) 樹脂の比誘電率（代表値）と、例の寸法（厚さ 2 mm・隙間 1 mm）での共振のずれ", "start", 10.5, INK, True))
    x0, y0, bh, gap = 200, 266, 13, 5
    sc = 380 / 16.0
    for j, (nm, ep) in enumerate(_F22_MAT):
        y = y0 + j * (bh + gap)
        v = _f22_df(ep, 2, 1) / 1e6
        c = SIG if nm == "ABS" else (ALI if nm == "ガラス" else GLD)
        o.append(T(x0 - 70, y + bh - 2, nm, "end", 9.5, INK, True))
        o.append(TX(x0 - 8, y + bh - 2, "ε_p = %s" % _f22_f(ep, 1), "end", 9.5, MUT))
        o.append(RECT(x0, y, -v * sc, bh, 2, soft(c), c, 1.1))
        o.append(T(x0 - v * sc + 6, y + bh - 2, "%s MHz" % _f22_f(v, 1), "start", 9.5, c, True))
        if nm == "PA66":
            o.append(T(x0 - v * sc + 64, y + bh - 2, "（乾燥時。水を吸うと比誘電率が上がる）", "start", 9, MUT))
    return SVG(700, 380, o, "樹脂による共振のずれ（2 節の傾向のモデル。ξ0 = 1 %、he = 3 mm は例の値。比誘電率はグレード・充填材・吸水・周波数で変わる）。")


F["e22_detune"] = _f22_detune_fig()


# =====================================================================
# 2 節: L1 での影響と直し方（8 章 6 節のモデル）
# =====================================================================
def _f22_detunel1_fig():
    o = []
    sh = [-(i * 0.1) for i in range(151)]
    ex = _f22_df(2.8, 2, 1)
    rex = _f22_l1(ex)
    pans = [("(a) L1 での S11", "s11", (-40, 0), [-40, -30, -20, -10, 0], "|S11| [dB]"),
            ("(b) L1 での軸比", "ar", (0, 15), [0, 3, 6, 9, 12, 15], "軸比 [dB]"),
            ("(c) 右旋の損失", "rhcp", (0, 3), [0, 1, 2, 3], "損失 [dB]")]
    for k, (ttl, key, yr, yt, yl) in enumerate(pans):
        x0 = 14 + k * 232
        o.append(T(x0, 16, ttl, "start", 10.5, INK, True))
        p = Plot(x0 + 46, 30, 168, 120, (-15, 0), yr)
        o.append(p.axes(xl="共振のずれ Δf [MHz]", yl=yl, xt=[-15, -10, -5, 0], yt=yt, xfmt=_f22_m, yfmt=_f22_m))
        if key == "s11":
            o.append(W(p.x, p.Y(-10), p.x + p.w, p.Y(-10), c=MUT, lw=1, dash="3 3"))
        if key == "ar":
            o.append(W(p.x, p.Y(3), p.x + p.w, p.Y(3), c=MUT, lw=1, dash="3 3"))
        if key == "rhcp":
            mis = [(s, _f22_l1(s * 1e6)["mis"]) for s in sh]
            tot = [(s, _f22_l1(s * 1e6)["rhcp"]) for s in sh]
            o.append(PL([(p.X(a), p.Y(b)) for a, b in mis] + [(p.X(a), p.Y(0)) for a, b in reversed(mis)], c="none", lw=0, fill=GOSOFT))
            o.append(p.clip(tot, c=ALI, lw=2.2))
            o.append(p.clip(mis, c=GLD, lw=1.6, dash="4 3"))
            o.append(T(p.X(-14.5), p.Y(2.55), "全部", "start", 9.5, ALI, True, halo=True))
            o.append(T(p.X(-14.5), p.Y(0.55), "うち不整合", "start", 9.5, GLD, True, halo=True))
        else:
            o.append(p.clip([(s, _f22_l1(s * 1e6)[key]) for s in sh], c=SIG, lw=2.2))
        v = rex[key]
        o.append(D(p.X(ex / 1e6), p.Y(v), ALI, 4.4))
        lab = {"s11": "%s dB" % _f22_f(v, 1), "ar": "%s dB" % _f22_f(v, 1), "rhcp": "%s dB" % _f22_f(v, 2)}[key]
        o.append(T(p.X(ex / 1e6) + (7 if key != "s11" else 7), p.Y(v) + (14 if key == "s11" else -7), "例 " + lab, "start", 9.5, ALI, True, halo=True))
    # (d) 直し方: 軸比の周波数特性
    o.append(T(14, 214, "(d) 軸比の周波数特性 — 整合の回路では戻らず、共振を合わせたアンテナで戻る", "start", 10.5, INK, True))
    q = Plot(60, 232, 420, 120, (-25, 25), (0, 15))
    o.append(q.axes(xl="L1 からの周波数 [MHz]", yl="軸比 [dB]", xt=[-20, -10, 0, 10, 20], yt=[0, 3, 6, 9, 12, 15], xfmt=_f22_m, yfmt=_f22_m))
    o.append(W(q.x, q.Y(3), q.x + q.w, q.Y(3), c=MUT, lw=1, dash="3 3"))
    o.append(W(q.X(0), q.y, q.X(0), q.y + q.h, c=INK, lw=1, dash="2 3"))
    fs = [(-25 + 0.25 * i) for i in range(201)]
    o.append(q.clip([(f, _f22_ar(_F22_F1 + f * 1e6, 0.0)) for f in fs], c=MUT, lw=4))
    o.append(q.clip([(f, _f22_ar(_F22_F1 + f * 1e6, ex)) for f in fs], c=ALI, lw=2.2))
    o.append(q.clip([(f, _f22_ar(_F22_F1 + f * 1e6, 0.0)) for f in fs], c=GRN, lw=2, dash="5 3"))
    o.append(D(q.X(0), q.Y(rex["ar"]), ALI, 4.4))
    lx = 500
    o.append(W(lx, 254, lx + 24, 254, c=MUT, lw=4)); o.append(T(lx + 30, 258, "樹脂なし", "start", 9.5, MUT))
    o.append(W(lx, 276, lx + 24, 276, c=ALI, lw=2.2)); o.append(T(lx + 30, 280, "樹脂あり（整合の回路を", "start", 9.5, ALI))
    o.append(T(lx + 30, 294, "足しても同じ線）", "start", 9.5, ALI))
    o.append(W(lx, 316, lx + 24, 316, c=GRN, lw=2, dash="5 3")); o.append(T(lx + 30, 320, "樹脂あり・共振を", "start", 9.5, GRN))
    o.append(T(lx + 30, 334, "%s MHz 高くしたアンテナ" % _f22_f(-ex / 1e6, 1), "start", 9.5, GRN))
    return SVG(700, 392, o, "樹脂で共振が下がったときの L1 での値（8 章 6 節の 1 点給電のパッチのモデル、Q = 100。赤の点は例の筐体の −4.9 MHz）。")


F["e22_detunel1"] = _f22_detunel1_fig()


# =====================================================================
# 3 節: 金属の筐体と窓
# =====================================================================
def _f22_patchicon(x, y, w=34, c=GLD):
    """横から見たパッチ（地板の上の板）。(x, y) は地板の上の面の中心。"""
    return RECT(x - w / 2 - 6, y, w + 12, 4, 1, MSOFT, MUT, 1.0) + RECT(x - w / 2, y - 6, w, 6, 1, soft(c), c, 1.1)


def _f22_metal_fig():
    o = []
    pans = ["(a) 金属の筐体の中", "(b) 樹脂の窓の下", "(c) 外に出す（5 節）"]
    for k, ttl in enumerate(pans):
        x0 = 14 + k * 232
        o.append(T(x0, 16, ttl, "start", 10.5, INK, True))
        bx, by, bw, bh = x0 + 20, 70, 180, 70
        o.append(RECT(bx, by, bw, bh, 3, SCR, MUT, 4.0))
        ax, ay = bx + bw / 2, by + bh - 22
        if k == 0:
            o.append(_f22_patchicon(ax, ay))
            for dx in (-50, 0, 50):
                o.append(ARR(ax + dx, 28, ax + dx, by - 6, c=SIG, lw=1.6, head=6))
                o.append(W(ax + dx - 5, by - 13, ax + dx + 5, by - 3, c=ALI, lw=1.8)); o.append(W(ax + dx - 5, by - 3, ax + dx + 5, by - 13, c=ALI, lw=1.8))
            o.append(T(ax, by + 30, "電波が中に入らない", "middle", 9.5, ALI, True))
        elif k == 1:
            wl = 76
            o.append(RECT(ax - wl / 2, by - 3, wl, 6, 1, TSOFT, TEA, 1.2))
            o.append(_f22_patchicon(ax, ay))
            for dx in (-24, 0, 24):
                o.append(ARR(ax + dx, 28, ax + dx * 0.8, by + 9, c=SIG, lw=1.6, head=6))
            o.append(ARR(ax + 64, 28, ax + 64, by - 6, c=SIG, lw=1.3, head=5))
            o.append(DIM(ax - wl / 2, by + 16, ax + wl / 2, by + 16, None, c=TEA))
            o.append(TX(ax, by + bh + 14, "窓の長さ L_w", "middle", 9.5, TEA, True))
        else:
            o.append(_f22_patchicon(ax + 40, by - 4, 28, GRN))
            o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (ax + 40, by, ax + 40, by + 26, ax - 30, by + 10, ax - 40, by + bh - 18), c=INK, lw=2))
            o.append(RECT(ax - 70, by + bh - 26, 44, 16, 3, SSOFT, SIG, 1.1))
            o.append(T(ax - 48, by + bh - 14, "受信機", "middle", 9, SIG, True))
            for dx in (20, 40, 60):
                o.append(ARR(ax + dx, 28, ax + dx, by - 14, c=SIG, lw=1.6, head=6))
            o.append(T(ax + 14, by + 34, "ケーブル", "start", 9.5, INK, True, halo=True))
        o.append(T(bx + 4, by + bh + 14, "金属の筐体", "start", 9, MUT))
    # (d) 窓の長さと弱まり（目安式）
    o.append(T(14, 182, "(d) 窓の長さと、電波が弱まる量の目安（筐体設計シリーズ 14 章 4 節の目安式）", "start", 10.5, INK, True))
    p = Plot(70, 198, 420, 120, (0, 12), (0, 25))
    o.append(p.axes(xl="窓の長さ L_w [cm]", yl="弱まり [dB]", xt=[0, 2, 4, 6, 8, 10, 12], yt=[0, 5, 10, 15, 20, 25], xfmt=_f22_m, yfmt=_f22_m))
    lam = _F22_LAM * 100
    ls = [0.6 + i * 0.02 for i in range(571)]
    o.append(p.clip([(L, max(0.0, 20 * math.log10(lam / (2 * L)))) for L in ls], c=SIG, lw=2.4))
    o.append(W(p.X(lam / 2), p.y, p.X(lam / 2), p.y + p.h, c=GRN, lw=1.2, dash="4 3"))
    o.append(TX(p.X(lam / 2) + 4, p.y + 14, "λ/2 = 9.5 cm", "start", 9.5, GRN, True, halo=True))
    ae = math.sqrt(10 ** 0.3 * lam ** 2 / (4 * math.pi))
    o.append(W(p.X(ae), p.y + 30, p.X(ae), p.y + p.h, c=PUR, lw=1.2, dash="2 3"))
    o.append(T(p.X(ae) - 4, p.y + 40, "7.6 cm", "end", 9.5, PUR, True, halo=True))
    v3 = 20 * math.log10(lam / 6.0)
    o.append(D(p.X(3), p.Y(v3), ALI, 4.4))
    o.append(T(p.X(3) + 7, p.Y(v3) - 6, "3 cm で %s dB" % _f22_f(v3, 1), "start", 9.5, ALI, True, halo=True))
    o.append(TX(512, 222, "20 log_{10}{λ/(2L_w)}", "start", 10.5, SIG, True))
    o.append(T(512, 240, "（L_w < λ/2 のとき。目安）".replace("L_w", "Lw"), "start", 9.5, MUT))
    o.append(T(512, 270, "紫の点線: 真上 +3 dBi のアンテナが", "start", 9.5, PUR))
    o.append(T(512, 284, "電波を集める範囲（57.5 cm²）の一辺", "start", 9.5, PUR))
    return SVG(700, 356, o, "金属の筐体とアンテナ（(d) は、スロットの漏れの目安式を、外から入る電波に使った値。桁を見るための目安で、筐体の中の共振や窓とアンテナの位置で変わる）。")


F["e22_metal"] = _f22_metal_fig()


# =====================================================================
# 3 節: 近くの部品（近傍界の目安と、置き方の悪い例・よい例）
# =====================================================================
def _f22_parts_fig():
    o = []
    k = 2.0                       # 1 mm = 2 px
    rn = _F22_LAM / (2 * math.pi) * 1000 * k   # 近傍界の目安 λ/(2π) = 30.3 mm
    for j, (ttl, c0) in enumerate((("(a) 悪い例", ALI), ("(b) よい例", GRN))):
        x0 = 14 + j * 248
        o.append(T(x0, 16, ttl, "start", 11, c0, True))
        dx, dy, dw, dh = x0 + 20, 50, 70 * k, 120 * k        # 機器（70 mm × 120 mm、上から見た図）
        o.append(RECT(dx, dy, dw, dh, 14, PAN, INK, 1.4))
        if j == 0:
            ax, ay = dx + 22 * k, dy + 60 * k      # アンテナを横の縁の近くに置いた
            parts = [("電池", dx + 6 * k, dy + 84 * k, 56 * k, 34 * k, MUT), ("表示器の枠", dx + 40 * k, dy + 4 * k, 26 * k, 30 * k, MUT)]
            spk = (dx + 52 * k, dy + 67 * k)
            dcdc = (dx + 49 * k, dy + 46 * k)
            cab = [(dx + 2 * k, dy + 44 * k), (dx + 33 * k, dy + 48 * k), (dx + 39 * k, dy + 75 * k)]
        else:
            ax, ay = dx + 35 * k, dy + 14 * k      # 上の端の真ん中
            parts = [("表示器の枠", dx + 8 * k, dy + 50 * k, 54 * k, 18 * k, MUT), ("電池（地板の裏）", dx + 10 * k, dy + 72 * k, 50 * k, 30 * k, MUT)]
            spk = (dx + 58 * k, dy + 108 * k)
            dcdc = (dx + 12 * k, dy + 108 * k)
            cab = [(dx + 26 * k, dy + 111 * k), (dx + 36 * k, dy + 113 * k), (dx + 40 * k, dy + 119 * k)]
        for nm, px, py, pw_, ph_, c in parts:
            dash = "4 3" if "裏" in nm else None
            o.append(RECT(px, py, pw_, ph_, 3, MSOFT, c, 1.2, dash=dash))
            o.append(T(px + pw_ / 2, py + ph_ / 2 + 4, nm, "middle", 9.5, INK, True, halo=True))
        o.append(CIRC(spk[0], spk[1], 9 * k, c=MUT, lw=1.2, fill=MSOFT))
        o.append(T(spk[0], spk[1] + 4, "スピーカ", "middle", 9, INK, True, halo=True))
        o.append(RECT(dcdc[0] - 7 * k, dcdc[1] - 5 * k, 14 * k, 10 * k, 2, ASOFT, ALI, 1.2))
        o.append(T(dcdc[0], dcdc[1] + 4, "DC-DC", "middle", 9, ALI, True, halo=True))
        o.append(PL(cab, c=INK, lw=1.8))
        o.append(T(cab[0][0] + 2, cab[0][1] - 5, "ケーブル", "start", 9, INK, False, halo=True))
        o.append(CIRC(ax, ay, rn, c=c0, lw=1.3, dash="5 3"))
        o.append(RECT(ax - 12.5 * k, ay - 12.5 * k, 25 * k, 25 * k, 2, GOSOFT, GLD, 1.4))
        o.append(T(ax, ay + 4, "アンテナ", "middle", 9, GLD, True, halo=True))
    # 右: 効き方
    xr = 520
    o.append(T(xr, 16, "破線の円: 近傍界の目安", "start", 10, INK, True))
    o.append(TX(xr, 32, "λ/(2π) = 3.0 cm（L1）", "start", 10, INK, True))
    rows = [(MUT, "金属の部品（電池・表示器の枠・", "スピーカ・ケーブル）", "円の内: 離調・効率の低下", "円の外: 遮へい・反射"),
            (ALI, "動く回路（DC-DC・表示器の", "駆動・増幅器・充電の回路）", "高調波が L1 に落ちると", "C/N0 を下げる（20 章）"),
            (GLD, "人の手と体", "", "持ち方で円の内に入る", "（6 節）")]
    y = 62
    for c, a1, a2, b1, b2 in rows:
        o.append(RECT(xr, y - 10, 10, 10, 2, soft(c), c, 1.1))
        o.append(T(xr + 16, y, a1, "start", 9.5, INK, True))
        yy = y
        if a2:
            yy += 14; o.append(T(xr + 16, yy, a2, "start", 9.5, INK, True))
        o.append(T(xr + 16, yy + 15, b1, "start", 9.5, MUT))
        o.append(T(xr + 16, yy + 29, b2, "start", 9.5, MUT))
        y = yy + 52
    o.append(T(xr, 240, "よい例: アンテナを空を向く面の", "start", 9.5, GRN, True))
    o.append(T(xr, 254, "端に置き、金属は円の外か地板の", "start", 9.5, GRN, True))
    o.append(T(xr, 268, "裏へ、動く回路は遠くへ", "start", 9.5, GRN, True))
    return SVG(700, 300, o, "近くの部品とアンテナ（上から見た例の機器、70 mm × 120 mm。部品の大きさと位置は例）。")


F["e22_parts"] = _f22_parts_fig()


# =====================================================================
# 4 節: 地板と機器の向き（良い例・悪い例）
# =====================================================================
def _f22_box(cx, cy, w, h, ang, up=True):
    """機器（箱）と、その中の基板・パッチ・真上の向きの矢印を、角 ang [°]（0 で正面が上、時計回り）に回して描く。"""
    a = math.radians(ang)
    def rot(x, y):
        return cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)
    o = []
    box = [rot(-w / 2, -h / 2), rot(w / 2, -h / 2), rot(w / 2, h / 2), rot(-w / 2, h / 2)]
    o.append(PL(box, c=INK, lw=1.4, fill=PAN))
    brd = [rot(-w / 2 + 6, -h / 2 + 12), rot(w / 2 - 6, -h / 2 + 12), rot(w / 2 - 6, -h / 2 + 15), rot(-w / 2 + 6, -h / 2 + 15)]
    o.append(PL(brd, c=MUT, lw=1.0, fill=MSOFT))
    pt = [rot(-10, -h / 2 + 6), rot(10, -h / 2 + 6), rot(10, -h / 2 + 12), rot(-10, -h / 2 + 12)]
    o.append(PL(pt, c=GLD, lw=1.1, fill=GOSOFT))
    x0, y0 = rot(0, -h / 2 + 6)
    x1, y1 = rot(0, -h / 2 - 24)
    o.append(ARR(x0, y0, x1, y1, c=GLD, lw=1.8, head=6))
    return "".join(o)


def _f22_orient_fig():
    o = []
    cases = [("(a) 机の上", 0.0, 180.0, "真上を向く"), ("(b) 南の壁に掛ける", 90.0, 0.0, "真上の向きが北の水平"),
             ("(c) 北の壁に掛ける", 90.0, 180.0, "真上の向きが南の水平"), ("(d) 天井の下に逆さま", 180.0, 180.0, "真上の向きが真下")]
    for k, (ttl, chi, at, sub) in enumerate(cases):
        x0 = 8 + k * 174
        o.append(T(x0 + 4, 16, ttl, "start", 10.5, INK, True))
        o.append(T(x0 + 4, 31, sub, "start", 9.5, MUT))
        cx, cy = x0 + 86, 96
        if k == 0:
            o.append(RECT(x0 + 20, cy + 22, 132, 6, 1, MSOFT, MUT, 1.0))
            o.append(_f22_box(cx, cy + 4, 60, 34, 0))
        elif k in (1, 2):
            wx = x0 + 34 if k == 1 else x0 + 138
            o.append(RECT(wx - 4, 46, 8, 100, 1, MSOFT, MUT, 1.0))
            o.append(_f22_box(wx + (21 if k == 1 else -21), cy, 60, 34, 90 if k == 1 else -90))
            o.append(T(wx, 160, "南の壁" if k == 1 else "北の壁", "middle", 9, MUT))
        else:
            o.append(RECT(x0 + 20, 48, 132, 6, 1, MSOFT, MUT, 1.0))
            o.append(_f22_box(cx, 54 + 17 + 1, 60, 34, 180))
        n35 = [q for q in _F22_GPS if _f22_cn0t(q, chi, at) >= 35]
        n25 = [q for q in _F22_GPS if _f22_cn0t(q, chi, at) >= 25]
        dd = _f22_dops(n35)
        c = GRN if len(n35) >= 8 else (GLD if dd else ALI)
        o.append(T(x0 + 86, 186, "35 dB-Hz 以上: %d つ" % len(n35), "middle", 10, c, True))
        o.append(T(x0 + 86, 201, "HDOP %s" % _f22_f(dd["H"], 2) if dd else "解けない", "middle", 9.5, c))
        o.append(T(x0 + 86, 216, "25 dB-Hz 以上: %d つ" % len(n25), "middle", 9.5, MUT))
    o.append(W(8, 232, 692, 232, c=LIN, lw=0.8))
    # (e)(f) 地板と部品（断面）
    for j, (ttl, c0) in enumerate((("(e) よい例: 地板の真ん中、部品は地板の裏", GRN), ("(f) 悪い例: 地板の縁、部品がアンテナの横", ALI))):
        x0 = 14 + j * 344
        o.append(T(x0, 252, ttl, "start", 10.5, c0, True))
        gy = 318
        if j == 0:
            o.append(RECT(x0 + 30, gy, 220, 6, 1, MSOFT, MUT, 1.1))
            o.append(_f22_patchicon(x0 + 140, gy, 40))
            o.append(RECT(x0 + 60, gy + 12, 80, 22, 3, MSOFT, MUT, 1.1)); o.append(T(x0 + 100, gy + 27, "電池", "middle", 9.5, INK, True))
            o.append(RECT(x0 + 150, gy + 12, 70, 16, 3, MSOFT, MUT, 1.1)); o.append(T(x0 + 185, gy + 24, "表示器", "middle", 9, INK, True))
            o.append(DIM(x0 + 30, gy - 20, x0 + 250, gy - 20, None, c=GRN))
            o.append(T(x0 + 140, gy - 25, "地板の一辺は資料の大きさ（例 70 mm）", "middle", 9.5, GRN, True, halo=True))
        else:
            o.append(RECT(x0 + 30, gy, 130, 6, 1, MSOFT, MUT, 1.1))
            o.append(_f22_patchicon(x0 + 52, gy, 40))
            o.append(RECT(x0 + 84, gy - 26, 70, 26, 3, MSOFT, MUT, 1.1)); o.append(T(x0 + 119, gy - 9, "電池", "middle", 9.5, INK, True))
            o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (x0 + 20, gy - 28, x0 + 50, gy - 38, x0 + 90, gy - 32, x0 + 200, gy - 38), c=INK, lw=1.8))
            o.append(T(x0 + 204, gy - 34, "ケーブル", "start", 9.5, INK, True, halo=True))
            o.append(T(x0 + 170, gy + 4, "地板が小さい", "start", 9.5, ALI, True))
            o.append(T(x0 + 170, gy + 19, "→ 裏へ漏れる・共振がずれる", "start", 9.5, ALI))
    o.append(T(14, 366, "前後比（8 章 4 節、2 次元の近似）: 地板の一辺 50 mm で 3.1 dB、70 mm で 6.1 dB、150 mm で 13.7 dB", "start", 9.5, MUT))
    return SVG(700, 376, o, "機器の向きと地板（(a)〜(d) は、東京の 8 つの GPS の衛星の C/N0 を、8 章のパターンと 3 章 3 節のモデルで計算した。部品の大きさと位置は例）。")


F["e22_orient"] = _f22_orient_fig()


# =====================================================================
# 4 節: 傾けたアンテナから見た仰角（幾何）と、パターン
# =====================================================================
def _f22_tiltgeo_fig():
    o = []
    chi = 40.0
    # (a) 傾けた面の断面（傾けた向きを右にとる）
    o.append(T(14, 16, "(a) 傾けたアンテナ（傾けた向きの鉛直な面で見る）", "start", 10.5, INK, True))
    cx, cy, R = 176, 196, 120
    o.append(W(30, cy, 330, cy, c=MUT, lw=1.3))
    o.append(T(330, cy + 14, "水平", "end", 9.5, MUT))
    o.append(W(cx, cy, cx, cy - R - 16, c=FNT, lw=1.1, dash="3 3"))
    o.append(T(cx + 4, cy - R - 8, "天頂", "start", 9.5, MUT))
    # パターン（右旋の利得、dBi を −30〜+5 で半径に）を、χ だけ回して描く
    def rr(g):
        return 70 * max(0.0, (g + 30.0) / 35.0)
    pts = []
    for i in range(361):
        ela = -90 + i * 0.5
        side = 1
        # アンテナの面の中で、真上の向きから角 (90 − ela) の向き（右回り）
        ang = math.radians(90 - chi - (90 - ela))
        g = _f22_gr(ela)
        pts.append((cx + rr(g) * math.cos(ang), cy - rr(g) * math.sin(ang)))
    for i in range(361):
        ela = 90 - i * 0.5
        ang = math.radians(90 - chi + (90 - ela))
        g = _f22_gr(ela)
        pts.append((cx + rr(g) * math.cos(ang), cy - rr(g) * math.sin(ang)))
    o.append(PL(pts, c=SIG, lw=1.4, fill=SSOFT, op=0.55))
    # 地板の面と、その裏
    ca, sa = math.cos(math.radians(chi)), math.sin(math.radians(chi))
    gx1, gy1 = cx - 118 * ca, cy - 118 * sa
    gx2, gy2 = cx + 100 * ca, cy + 100 * sa
    o.append(W(gx1, gy1, gx2, gy2, c=MUT, lw=1.2, dash="5 3"))
    # アンテナ（傾いた地板とパッチ）
    def rot(x, y):
        return cx + x * ca - y * sa, cy + x * sa + y * ca
    o.append(PL([rot(-22, 0), rot(22, 0), rot(22, 4), rot(-22, 4)], c=MUT, lw=1.0, fill=MSOFT))
    o.append(PL([rot(-12, -6), rot(12, -6), rot(12, 0), rot(-12, 0)], c=GLD, lw=1.1, fill=GOSOFT))
    ax_, ay_ = cx + 100 * sa, cy - 100 * ca
    o.append(ARR(cx, cy, ax_, ay_, c=GLD, lw=2, head=7))
    o.append(TX(ax_ - 4, ay_ - 8, "アンテナの真上の向き a", "end", 9.5, GLD, True, halo=True))
    o.append(PL(_f22_arc(cx, cy, 52, 90 - chi, 90), c=GLD, lw=1.6))
    o.append(TX(cx + 14, cy - 58, "χ", "start", 10.5, GLD, True, halo=True))
    # 2 つの衛星（仰角 30°）
    for sd, nm, c in ((1, "S1", SIG), (-1, "S2", ALI)):
        th = 30.0
        ux, uy = sd * math.cos(math.radians(th)), math.sin(math.radians(th))
        sx, sy = cx + 128 * ux, cy - 128 * uy
        o.append(W(cx, cy, sx, sy, c=c, lw=1.4))
        o.append(_f22_sat(sx + sd * 8, sy - 5, c, 0.7))
        tha = th + chi if sd > 0 else th - chi
        o.append(TX(sx + sd * 8, sy - 30, "%s: θ = 30°" % nm, "middle", 9.5, c, True, halo=True))
        o.append(TX(sx + sd * 8, sy - 16, "θ_a = %s°" % _f22_f(tha, 0), "middle", 9.5, c, True, halo=True))
    o.append(T(14, 286, "青の地: 8 章の例のアンテナの右旋の利得（−30〜+5 dBi を半径に）。破線: 地板の面", "start", 9.5, SIG))
    o.append(T(14, 302, "χ = 40° の例。S2 は地板の面より下（裏）に回る", "start", 9.5, MUT))
    # (b) 利得
    o.append(T(392, 16, "(b) アンテナから見た仰角と右旋の利得（8 章）", "start", 10.5, INK, True))
    p = Plot(440, 34, 230, 180, (-90, 90), (-35, 5))
    o.append(p.axes(xl="アンテナから見た仰角 θ_a [°]", yl="利得 [dBi]", xt=[-90, -60, -30, 0, 30, 60, 90], yt=[-35, -30, -20, -10, 0, 5], xfmt=_f22_m, yfmt=_f22_m))
    o.append(RECT(p.X(-90), p.y, p.X(0) - p.X(-90), p.h, 0, ASOFT, "none", 0, op=0.6))
    o.append(T(p.X(-45), p.y + 14, "地板の裏", "middle", 9.5, ALI, True, halo=True))
    o.append(p.clip([(e, _f22_gr(e)) for e in [-89.5 + 0.5 * i for i in range(359)]], c=SIG, lw=2.2))
    for e, c in ((70.0, SIG), (30.0, MUT), (-10.0, ALI)):
        g = _f22_gr(e)
        o.append(D(p.X(e), p.Y(g), c, 4.2))
    o.append(T(p.X(70) - 4, p.Y(_f22_gr(70)) + 16, "S1 %s" % _f22_f(_f22_gr(70), 1), "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(30) + 6, p.Y(_f22_gr(30)) + 16, "水平のとき %s" % _f22_f(_f22_gr(30), 1), "start", 9.5, MUT, True, halo=True))
    o.append(T(p.X(-10) - 6, p.Y(_f22_gr(-10)) + 4, "S2 %s" % _f22_f(_f22_gr(-10), 1), "end", 9.5, ALI, True, halo=True))
    o.append(TX(392, 262, "sin θ_a = sin θ cos χ + cos θ sin χ cos(α − α_t)", "start", 10, INK, True))
    return SVG(700, 310, o, "傾けたアンテナから見た仰角（(a) は、傾けた向きを含む鉛直な面の断面。パターンは方位によらないとした 8 章の例のアンテナ）。")


F["e22_tiltgeo"] = _f22_tiltgeo_fig()


# =====================================================================
# 4 節: 空の上の利得と、衛星ごとの C/N0（真上の向きを南へ倒す）
# =====================================================================
def _f22_tiltpoly(cx, cy, R, chi, at, lim=0.0, n=240):
    """空のうち、アンテナから見た仰角が lim より低い所（地板の裏）の点列（スカイプロットの座標）。"""
    out = []
    for i in range(n + 1):
        az = 360.0 * i / n
        # その方位で θa = lim になる仰角を二分法で探す（θa は仰角とともに増えるとは限らないので、低い方から走査）
        lo = None
        for e10 in range(0, 901):
            e = e10 / 10.0
            if _f22_ela(e, az, chi, at) >= lim:
                lo = e
                break
        out.append((az, 90.0 if lo is None else lo))
    return out


def _f22_cncol(v):
    return GRN if v >= 35 else (GLD if v >= 25 else ALI)


def _f22_tiltsky_fig():
    o = []
    chis = [0.0, 30.0, 60.0, 90.0]
    for k, chi in enumerate(chis):
        x0 = 8 + k * 174
        o.append(TX(x0 + 4, 16, "χ = %d°（南へ）" % chi, "start", 10.5, INK, True))
        cx, cy, R = x0 + 86, 100, 62
        o.append(sky(cx, cy, R, [], rings=(30, 60)))
        if chi > 0:
            bd = _f22_tiltpoly(cx, cy, R, chi, 180.0)
            outer = [skyxy(cx, cy, R, 0.0, az) for az, e in bd]
            inner = [skyxy(cx, cy, R, e, az) for az, e in reversed(bd)]
            o.append(PL(outer + inner, c="none", lw=0, fill=ASOFT, op=0.85))
            o.append(PL([skyxy(cx, cy, R, e, az) for az, e in bd if e > 0.05], c=ALI, lw=1.4))
            bx, by = skyxy(cx, cy, R, 90 - chi, 180.0)
            o.append(W(bx - 5, by, bx + 5, by, c=GLD, lw=2)); o.append(W(bx, by - 5, bx, by + 5, c=GLD, lw=2))
        else:
            o.append(W(cx - 5, cy, cx + 5, cy, c=GLD, lw=2)); o.append(W(cx, cy - 5, cx, cy + 5, c=GLD, lw=2))
        n35 = n25 = 0
        for q in _F22_GPS:
            v = _f22_cn0t(q, chi, 180.0)
            x, y = skyxy(cx, cy, R, q[1], q[2])
            o.append(D(x, y, _f22_cncol(v), 4.0))
            o.append(T(x + 6, y + 3.5, "%d" % round(v), "start", 8.5, _f22_cncol(v), True, halo=True))
            n35 += v >= 35; n25 += v >= 25
        sel = [q for q in _F22_GPS if _f22_cn0t(q, chi, 180.0) >= 35]
        dd = _f22_dops(sel)
        o.append(T(cx, cy + R + 32, "35 以上 %d つ・25 以上 %d つ" % (n35, n25), "middle", 9.5, INK, True))
        o.append(T(cx, cy + R + 46, ("HDOP %s（35 以上）" % _f22_f(dd["H"], 2)) if dd else "35 以上では解けない", "middle", 9.5, MUT))
    o.append(T(14, 230, "数字は C/N0 [dB-Hz]。緑 35 以上（捕捉の目安）、金 25〜35（追尾の目安）、赤 25 未満。赤の地は地板の裏、金の + は真上の向き", "start", 9.5, MUT))
    # (e) 傾きと受けられる衛星の数
    o.append(T(14, 258, "(e) 傾きと、目安を超える衛星の数（真上の向きを南へ倒す）", "start", 10.5, INK, True))
    p = Plot(60, 274, 420, 110, (0, 180), (0, 8))
    o.append(p.axes(xl="傾き χ [°]", yl="衛星の数", xt=[0, 30, 60, 90, 120, 150, 180], yt=[0, 2, 4, 6, 8], xfmt=_f22_m, yfmt=_f22_m))
    xs = list(range(0, 181))
    for att, c in ((0.0, SIG), (10.0, GLD)):
        for thr, dash in ((35, None), (25, "5 3")):
            o.append(p.steps([(x, sum(1 for q in _F22_GPS if _f22_cn0t(q, x, 180.0, att) >= thr)) for x in xs], c=c, lw=2, dash=dash))
    lx = 500
    o.append(LEGL(lx, 292, [(SIG, None, "35 以上")], 9.5)); o.append(LEGL(lx + 80, 292, [(SIG, "5 3", "25 以上")], 9.5))
    o.append(T(lx, 310, "青: 周りで弱まらないとき", "start", 9.5, SIG))
    o.append(T(lx, 330, "金: 木の葉などで全部の衛星が", "start", 9.5, GLD))
    o.append(T(lx, 344, "10 dB 弱まるとき（代表値）", "start", 9.5, GLD))
    return SVG(700, 420, o, "アンテナを傾けたときの衛星ごとの C/N0（東京の 8 つの GPS の衛星、時刻 0。8 章の例のアンテナと、3 章 3 節の C/N0 のモデル（雑音は 290 K の熱雑音だけ））。")


F["e22_tiltsky"] = _f22_tiltsky_fig()


# =====================================================================
# 5 節: 外付けのアンテナ（構成と、ケーブルの長さと C/N0）
# =====================================================================
def _f22_ext_fig():
    o = []
    # (a) 構成
    o.append(T(14, 16, "(a) 外付けのアンテナの 2 つの形", "start", 10.5, INK, True))
    for j, (nm, act) in enumerate((("パッシブアンテナ", False), ("アクティブアンテナ（9 章 5 節）", True))):
        y = 44 + j * 72
        o.append(T(14, y, nm, "start", 10, INK, True))
        yy = y + 26
        o.append(_f22_patchicon(44, yy, 30, GLD))
        if act:
            o.append(RECT(70, yy - 14, 50, 22, 3, SSOFT, SIG, 1.2)); o.append(T(95, yy + 1, "LNA", "middle", 9.5, SIG, True))
            o.append(T(95, yy + 22, "28 dB", "middle", 9, SIG, True))
            xs = 120
        else:
            xs = 70
        o.append(W(xs, yy - 3, 292, yy - 3, c=TEA, lw=3))
        o.append(TX((xs + 292) / 2, yy - 10, "ケーブル（損失 L_c）", "middle", 9.5, TEA, True, halo=True))
        o.append(RECT(292, yy - 15, 64, 24, 3, PAN, INK, 1.2)); o.append(T(324, yy + 1, "受信機", "middle", 9.5, INK, True))
        if not act:
            o.append(T(160, yy + 16, "LNA は受信機の中 → ケーブルが LNA の前", "start", 9, ALI, True))
        else:
            o.append(T(160, yy + 16, "ケーブルは LNA の後（直流も同じ芯線で送る）", "start", 9, GRN, True))
    # (b) ケーブルの長さと C/N0
    o.append(T(380, 16, "(b) ケーブルの長さと C/N0", "start", 10.5, INK, True))
    p = Plot(424, 34, 210, 156, (0, 30), (30, 50))
    o.append(p.axes(xl="ケーブルの長さ [m]", yl="C/N_0 [dB-Hz]", xt=[0, 10, 20, 30], yt=[30, 35, 40, 45, 50], xfmt=_f22_m, yfmt=_f22_m))
    ms = [i * 0.25 for i in range(121)]
    for nm, a, c in _F22_CAB:
        o.append(p.clip([(m, _f22_active(a * m)) for m in ms], c=c, lw=2.2))
        o.append(p.clip([(m, _f22_passive(a * m)) for m in ms], c=c, lw=1.6, dash="5 3"))
    o.append(T(p.X(29), p.Y(47.5) - 6, "実線: アクティブ（28 dB）", "end", 9, INK, True, halo=True))
    o.append(T(p.X(29), p.Y(31.5), "破線: パッシブ", "end", 9, INK, True, halo=True))
    y = 206
    o.append(T(14, y - 18, "ケーブルの損失（L1、例の値）", "start", 10, INK, True))
    for nm, a, c in _F22_CAB:
        o.append(W(14, y - 4, 38, y - 4, c=c, lw=2.4))
        o.append(T(44, y, "%s %s dB/m" % (nm, _f22_f(a, 1)), "start", 9.5, c, True))
        y += 17
    return SVG(700, 262, o, "外付けのアンテナとケーブル（ケーブルの損失は L1 での例の値。受信機の段とアクティブアンテナの中の段は 9 章 1・5 節の例）。")


F["e22_ext"] = _f22_ext_fig()


# =====================================================================
# 5 節: アクティブアンテナの利得とケーブルの損失の釣り合い
# =====================================================================
_F22_TACT, _F22_TRX, _F22_TANT = 80.78, 291.51, 100.0     # 9 章 5 節の例: アクティブアンテナの中の段・受信機（チップの増幅器から）・アンテナの雑音温度 [K]


def _f22_lcmax(gdb, drop):
    """C/N0 の減りが drop [dB] になるケーブルの損失 [dB]（5 節の式: 差 = (Lc − 1)(T0 + Trx)/Gact）。"""
    g = 10 ** (gdb / 10)
    ts0 = _F22_TANT + _F22_TACT + _F22_TRX / g
    L = 1 + (10 ** (drop / 10) - 1) * ts0 * g / (290.0 + _F22_TRX)
    return 10 * math.log10(L)


def _f22_window_fig():
    o = []
    p = Plot(70, 30, 360, 250, (0, 30), (10, 50))
    gs = [10 + 0.25 * i for i in range(161)]
    c05 = [(_f22_lcmax(g, 0.5), g) for g in gs]
    c10 = [(_f22_lcmax(g, 1.0), g) for g in gs]
    inside = [(L, g) for L, g in c05 if L <= 30]
    # 地の色: 減りが 0.5 dB を超える所（赤）、上限を超える所（金）、よい所（緑）
    red = [(p.X(0), p.Y(10)), (p.X(30), p.Y(10))] + [(p.X(L), p.Y(g)) for L, g in reversed(inside)] + [(p.X(0), p.Y(c05[0][1]))]
    red = [(p.X(0), p.Y(10)), (p.X(30), p.Y(10)), (p.X(30), p.Y(inside[-1][1]))] + [(p.X(max(L, 0)), p.Y(g)) for L, g in reversed(inside)]
    o.append(PL(red, c="none", lw=0, fill=ASOFT, op=0.7))
    o.append(PL([(p.X(0), p.Y(30)), (p.X(20), p.Y(50)), (p.X(0), p.Y(50))], c="none", lw=0, fill=GOSOFT, op=0.9))
    grn = [(p.X(0), p.Y(30)), (p.X(20), p.Y(50)), (p.X(30), p.Y(50)), (p.X(30), p.Y(inside[-1][1]))] + [(p.X(max(L, 0)), p.Y(g)) for L, g in reversed(inside)] + [(p.X(0), p.Y(10))]
    o.append(PL(grn, c="none", lw=0, fill=GSOFT, op=0.9))
    o.append(p.axes(xl="ケーブル（とコネクタ）の損失 L_c [dB]", yl="アクティブアンテナの利得 G_act [dB]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[10, 20, 30, 40, 50], xfmt=_f22_m, yfmt=_f22_m))
    o.append(p.clip(c05, c=ALI, lw=2.2))
    o.append(p.clip(c10, c=ALI, lw=1.4, dash="4 3"))
    o.append(p.clip([(0, 30), (20, 50)], c=GLD, lw=2))
    o.append(T(p.X(21.5), p.Y(38.8), "減り 0.5 dB", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(28.8), p.Y(37.6), "1 dB", "end", 9.5, ALI, False, halo=True))
    o.append(T(p.X(1), p.Y(47), "正味の利得が上限（例 30 dB）を超える", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(12), p.Y(15), "C/N0 が 0.5 dB より多く下がる", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(13), p.Y(36), "よい範囲", "start", 10, GRN, True, halo=True))
    o.append(D(p.X(1.5), p.Y(28), SIG, 4.4))
    o.append(T(p.X(1.5) + 7, p.Y(28) - 7, "例: 28 dB・中くらい 3 m", "start", 9.5, SIG, True, halo=True))
    lm = _f22_lcmax(28.0, 0.5)
    o.append(D(p.X(lm), p.Y(28), ALI, 4.4))
    o.append(T(p.X(lm) + 7, p.Y(28) + 15, "%s dB まで" % _f22_f(lm, 1), "start", 9.5, ALI, True, halo=True))
    # 右: 長さに直す
    xr = 470
    o.append(T(xr, 40, "28 dB のアンテナで、C/N0 の減りを", "start", 10, INK, True))
    o.append(T(xr, 56, "0.5 dB 以下にできる長さ（例の値）", "start", 10, INK, True))
    y = 84
    for nm, a_, c in _F22_CAB:
        o.append(RECT(xr, y - 11, 10, 10, 2, soft(c), c, 1.1))
        o.append(T(xr + 16, y, nm, "start", 9.5, c, True))
        o.append(T(xr + 16, y + 15, "%s dB/m → %s m" % (_f22_f(a_, 1), _f22_f(lm / a_, 0)), "start", 9.5, INK))
        y += 40
    lo_ref = 10 * math.log10((290.0 + _F22_TRX) / ((10 ** 0.05 - 1) * (_F22_TANT + _F22_TACT + _F22_TRX / 10 ** 2.8)))
    o.append(TX(xr, 222, "下限の目安: G_act − L_c ≥ %s dB" % _f22_f(lo_ref, 1), "start", 10, ALI, True))
    o.append(T(xr, 240, "上限: 受信機が受け入れる正味の利得", "start", 9.5, GLD, True))
    o.append(T(xr, 254, "（例 10〜30 dB。製品による）", "start", 9.5, GLD))
    return SVG(700, 320, o, "アクティブアンテナの利得とケーブルの損失の釣り合い（9 章 5 節の例の段。アンテナの中の段の雑音温度は 28 dB の例の 80.8 K のまま、利得だけを変えた）。")


F["e22_window"] = _f22_window_fig()


# =====================================================================
# 6 節: 用途ごとの置き方（車・ドローン・身に着ける機器）
# =====================================================================
def _f22_mark(x, y, kind):
    """置き場所の印: "o"（よい）、"t"（注意）、"x"（悪い）。"""
    if kind == "o":
        return CIRC(x, y, 6, c=GRN, lw=2.2, fill=SCR) + D(x, y, GRN, 2.6)
    if kind == "t":
        return PL([(x, y - 7), (x + 7, y + 5), (x - 7, y + 5), (x, y - 7)], c=GLD, lw=2, fill=SCR)
    return W(x - 6, y - 6, x + 6, y + 6, c=ALI, lw=2.4) + W(x - 6, y + 6, x + 6, y - 6, c=ALI, lw=2.4)


def _f22_uses_fig():
    o = []
    W_ = 232
    # ---- (a) 車 ----
    x0 = 8
    o.append(T(x0 + 4, 16, "(a) 車（右へ・北へ走る）", "start", 11, INK, True))
    by = 150
    body = [(x0 + 18, by), (x0 + 18, by - 26), (x0 + 60, by - 32), (x0 + 88, by - 64), (x0 + 156, by - 64), (x0 + 186, by - 34), (x0 + 214, by - 28), (x0 + 216, by)]
    o.append(PL(body + [body[0]], c=INK, lw=1.4, fill=PAN))
    o.append(PL([(x0 + 92, by - 60), (x0 + 152, by - 60), (x0 + 178, by - 34), (x0 + 72, by - 34)], c=MUT, lw=1.0, fill=SSOFT, op=0.6))
    o.append(W(x0 + 152, by - 60, x0 + 178, by - 34, c=TEA, lw=3))
    for wx in (x0 + 58, x0 + 176):
        o.append(CIRC(wx, by + 2, 13, c=INK, lw=1.4, fill=MSOFT))
    o.append(_f22_mark(x0 + 122, by - 70, "o"))
    o.append(T(x0 + 122, by - 82, "屋根の中央", "middle", 9.5, GRN, True, halo=True))
    o.append(_f22_mark(x0 + 168, by - 30, "t"))
    o.append(T(x0 + 196, by - 50, "ダッシュボード", "middle", 9.5, GLD, True, halo=True))
    o.append(_f22_mark(x0 + 36, by - 14, "x"))
    o.append(T(x0 + 36, by + 28, "トランクの中", "middle", 9.5, ALI, True))
    o.append(T(x0 + 178, by - 12, "ガラス", "start", 9, TEA, True, halo=True))
    # ---- (b) ドローン（25° 傾いて東へ進む）----
    x0 = 8 + W_
    o.append(T(x0 + 4, 16, "(b) ドローン（東へ 25° 傾く）", "start", 11, INK, True))
    dcx, dcy, tilt = x0 + 112, 112, 25.0
    a = math.radians(tilt)
    def R2(x, y):
        return dcx + x * math.cos(a) - y * math.sin(a), dcy + x * math.sin(a) + y * math.cos(a)
    o.append(PL([R2(-80, -2), R2(80, -2), R2(80, 2), R2(-80, 2)], c=INK, lw=1.0, fill=MSOFT))
    for sx in (-80, 80):
        o.append(PL([R2(sx - 3, -2), R2(sx + 3, -2), R2(sx + 3, -12), R2(sx - 3, -12)], c=ALI, lw=1.1, fill=ASOFT))
        o.append(W(*R2(sx - 30, -14), *R2(sx + 30, -14), c=MUT, lw=2))
    o.append(PL([R2(-26, -8), R2(26, -8), R2(26, 10), R2(-26, 10)], c=INK, lw=1.3, fill=PAN))
    o.append(PL([R2(-20, 10), R2(20, 10), R2(20, 22), R2(-20, 22)], c=MUT, lw=1.1, fill=MSOFT))
    o.append(W(*R2(0, -8), *R2(0, -40), c=INK, lw=1.6))
    o.append(PL([R2(-12, -40), R2(12, -40), R2(12, -46), R2(-12, -46)], c=GLD, lw=1.1, fill=GOSOFT))
    o.append(_f22_mark(*R2(0, -58), "o"))
    tx, ty = R2(0, -58)
    o.append(T(tx - 12, ty - 4, "柱の上", "end", 9.5, GRN, True, halo=True))
    mx, my = R2(-80, -12)
    o.append(T(mx - 2, my - 16, "モータ（雑音）", "middle", 9, ALI, True, halo=True))
    ex, ey = R2(0, 22)
    o.append(T(ex, ey + 16, "電池", "middle", 9, INK, True, halo=True))
    o.append(W(dcx, dcy, dcx, dcy - 62, c=FNT, lw=1, dash="3 3"))
    o.append(PL(_f22_arc(dcx, dcy, 44, 90 - tilt, 90), c=GLD, lw=1.4))
    o.append(T(dcx + 10, dcy - 48, "25°", "start", 9.5, GLD, True, halo=True))
    o.append(T(x0 + 118, 176, "機体（炭素繊維は電気を通す）", "middle", 9, MUT))
    # ---- (c) 身に着ける機器 ----
    x0 = 8 + 2 * W_
    o.append(T(x0 + 4, 16, "(c) 身に着ける機器（北を向く）", "start", 11, INK, True))
    px, py = x0 + 100, 16
    o.append(CIRC(px, 46 + py, 13, c=INK, lw=1.4, fill=PAN))
    o.append(PL([(px - 18, 62 + py), (px + 18, 62 + py), (px + 22, 140 + py), (px - 22, 140 + py)], c=INK, lw=1.4, fill=PAN))
    o.append(W(px - 12, 140 + py, px - 12, 182 + py, c=INK, lw=6)); o.append(W(px + 12, 140 + py, px + 12, 182 + py, c=INK, lw=6))
    o.append(W(px + 18, 70 + py, px + 34, 102 + py, px + 52, 96 + py, c=INK, lw=5))
    o.append(RECT(px + 46, 90 + py, 10, 9, 2, GOSOFT, GLD, 1.2))
    o.append(_f22_mark(px + 26, 82 + py, "t"))
    o.append(T(px + 34, 80 + py, "胸", "start", 9.5, GLD, True, halo=True))
    o.append(_f22_mark(px + 51, 112 + py, "t"))
    o.append(T(px + 60, 126 + py, "腕時計", "start", 9.5, GLD, True, halo=True))
    o.append(_f22_mark(px, 26 + py, "o"))
    o.append(T(px + 10, 22 + py, "肩・帽子の上", "start", 9.5, GRN, True, halo=True))
    o.append(RECT(px - 76, 60 + py, 50, 80, 3, MSOFT, "none", 0, op=0.8))
    o.append(T(px - 51, 96 + py, "体の陰", "middle", 9.5, MUT, True))
    o.append(T(px - 51, 110 + py, "（南）", "middle", 9.5, MUT))
    # ---- 下の段: 空 ----
    skies = [("ダッシュボード", lambda a_: _f22_car(a_), None), ("", None, (25.0, 90.0)), ("胸の機器", lambda a_: _f22_body(a_), None)]
    for k, (nm, mf, tl) in enumerate(skies):
        x0 = 8 + k * W_
        cx, cy, R = x0 + 116, 290, 64
        o.append(sky(cx, cy, R, [], rings=(30, 60)))
        if mf:
            o.append(_f22_maskpoly(cx, cy, R, mf))
            vis = _f22_scene(_F22_GPS, mf)
            for q in _F22_GPS:
                o.append(_f22_satmark(cx, cy, R, q, "v" if q in vis else "x", sz=8.5))
            dd = _f22_dops(vis)
            o.append(T(cx, cy + R + 32, "%s: GPS %d つ・HDOP %s" % (nm, len(vis), _f22_f(dd["H"], 2)), "middle", 9.5, INK, True))
            if k == 0:
                o.append(T(cx, cy + R + 47, "屋根の中央なら 8 つ・HDOP 0.95", "middle", 9.5, GRN, True))
            else:
                o.append(T(cx, cy + R + 47, "後ろの半分を 60° まで遮る（例の値）", "middle", 9.5, MUT))
        else:
            chi, at = tl
            bd = _f22_tiltpoly(cx, cy, R, chi, at)
            outer = [skyxy(cx, cy, R, 0.0, az) for az, e in bd]
            inner = [skyxy(cx, cy, R, e, az) for az, e in reversed(bd)]
            o.append(PL(outer + inner, c="none", lw=0, fill=ASOFT, op=0.85))
            o.append(PL([skyxy(cx, cy, R, e, az) for az, e in bd if e > 0.05], c=ALI, lw=1.4))
            n35 = 0
            for q in _F22_GPS:
                v = _f22_cn0t(q, chi, at)
                x, y = skyxy(cx, cy, R, q[1], q[2])
                o.append(D(x, y, _f22_cncol(v), 4.0))
                o.append(T(x + 6, y + 3.5, "%d" % round(v), "start", 8.5, _f22_cncol(v), True, halo=True))
                n35 += v >= 35
            o.append(T(cx, cy + R + 32, "35 dB-Hz 以上 %d つ（G5 が %s dB-Hz）" % (n35, _f22_f(_f22_cn0t([q for q in _F22_GPS if q[0] == "G5"][0], chi, at), 1)), "middle", 9.5, INK, True))
            o.append(T(cx, cy + R + 47, "赤の地: 地板の裏（4 節）", "middle", 9.5, MUT))
    o.append(_f22_mark(20, 422, "o")); o.append(T(32, 426, "よい", "start", 9.5, MUT))
    o.append(_f22_mark(76, 422, "t")); o.append(T(88, 426, "注意", "start", 9.5, MUT))
    o.append(_f22_mark(132, 422, "x")); o.append(T(144, 426, "悪い", "start", 9.5, MUT))
    return SVG(700, 434, o, "用途ごとの例の配置と、そのときの空（東京の 8 つの GPS の衛星、時刻 0。車の室内の遮へいと体の陰は例の値。ドローンの C/N0 は 4 節と同じモデル）。")


F["e22_uses"] = _f22_uses_fig()
