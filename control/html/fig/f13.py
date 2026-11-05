# -*- coding: utf-8 -*-
# 13 章 ループ整形 の図
import numpy as _f13_np
from scipy import signal as _f13_sg
from scipy.integrate import quad as _f13_quad
from scipy.optimize import brentq as _f13_brentq
import re as _f13_re

# =====================================================================
# 補助
# =====================================================================
def _f13_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f13_g(v, d=3):
    """有効数字 d 桁（負号は −）。"""
    return (("%." + str(d) + "g") % v).replace("-", "−")


def _f13_n(v):
    return ("%g" % v).replace("-", "−")


def _f13_s3(v):
    """有効数字 3 桁（末尾の 0 も残す）。"""
    a = abs(v)
    d = 2 if a >= 1 else 3
    if a >= 10:
        d = 1
    if a >= 100:
        d = 0
    return _f13_f(v, d)


def _f13_cap(s):
    """図の説明文（HTML）で K_P・ω_gc などを添字のタグにする。"""
    s = _f13_re.sub(r"([A-Za-zωζφα])_\{([^}]*)\}", r"\1<sub>\2</sub>", s)
    return _f13_re.sub(r"([A-Za-zωζφα])_([A-Za-z0-9]+)", r"\1<sub>\2</sub>", s)


def _f13_svg(w, h, o, cap):
    return SVG(w, h, o, _f13_cap(cap))


_f13_pm, _f13_pa = _f13_np.polymul, _f13_np.polyadd

# 制御対象（どれも本文の例の値）
_F13_PM = ([1000.0], [1.0, 20.0, 0.0])                 # モータの位置（L_a を無視）rad/V
_F13_PMLA = ([2e6], [1.0, 2000.0, 40000.0, 0.0])       # L_a を含むモータの位置
_F13_CART = ([0.5], [0.5, 1.0])                        # 台車の速度 (m/s)/N
_F13_BOIL = ([-15.0, 0.5], [10.0, 1.0, 0.0])           # ボイラの水位 mm/(kg/s)


def _f13_ser(*tfs):
    n, d = _f13_np.array([1.0]), _f13_np.array([1.0])
    for a, b in tfs:
        n = _f13_pm(n, a); d = _f13_pm(d, b)
    return n, d


def _f13_lead(wz, wp):
    """(1 + s/wz)/(1 + s/wp)"""
    return _f13_np.array([1.0 / wz, 1.0]), _f13_np.array([1.0 / wp, 1.0])


def _f13_lag(wz, wp):
    """(s + wz)/(s + wp)（高い角周波数のゲイン 1）"""
    return _f13_np.array([1.0, wz]), _f13_np.array([1.0, wp])


def _f13_jw(num, den, w, L=0.0):
    s = 1j * _f13_np.asarray(w, dtype=float)
    return _f13_np.polyval(num, s) / _f13_np.polyval(den, s) * _f13_np.exp(-s * L)


def _f13_lw(a, b, n=800):
    return _f13_np.logspace(math.log10(a), math.log10(b), n)


def _f13_margins(num, den, L=0.0, wlo=1e-4, whi=1e5):
    """(ω_gc, 位相余裕 [°], ω_pc, ゲイン余裕 [dB])。位相は BODEPH と同じ約束でつなぐ。無いものは None。"""
    ws = _f13_lw(wlo, whi, 40000)
    db, ph = BODEPH(num, den, ws, L)
    out = [None, None, None, None]
    i = _f13_np.where(_f13_np.diff(_f13_np.sign(db)) != 0)[0]
    if len(i):
        k = i[0]
        f = lambda w: 20 * math.log10(abs(_f13_jw(num, den, w, L)))
        w0 = _f13_brentq(f, ws[k], ws[k + 1], xtol=1e-13)
        a = math.degrees(math.atan2(_f13_jw(num, den, w0, L).imag, _f13_jw(num, den, w0, L).real))
        a += 360 * round((ph[k] - a) / 360)
        out[0], out[1] = w0, 180 + a
    j = _f13_np.where(_f13_np.diff(_f13_np.sign(ph + 180)) != 0)[0]
    if len(j):
        k = j[0]
        def g(w):
            v = _f13_jw(num, den, w, L); a = math.degrees(math.atan2(v.imag, v.real))
            return a + 360 * round((ph[k] - a) / 360) + 180
        w1 = _f13_brentq(g, ws[k], ws[k + 1], xtol=1e-13)
        out[2], out[3] = w1, -20 * math.log10(abs(_f13_jw(num, den, w1, L)))
    return tuple(out)


def _f13_cl(Pn, Pd, Cn, Cd):
    """G_yr・S の (分子, 分母)"""
    gyr, _gyd, S = CLOOP(Pn, Pd, Cn, Cd)
    return gyr, S


def _f13_step(num, den, t):
    return _f13_sg.step((num, den), T=t)[1]


def _f13_metrics(t, y, yf, band=0.02):
    mp = (y.max() - yf) / abs(yf) * 100
    out = _f13_np.where(_f13_np.abs(y - yf) > band * abs(yf))[0]
    ts = t[out[-1] + 1] if len(out) and out[-1] + 1 < len(t) else float("nan")
    return mp, ts


def _f13_sp(p, xt, yt, xl="実部", yl="虚部"):
    """s 平面の地（枠・目盛・右半平面の薄い赤・軸）。"""
    o = [RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8), SPLANE(p, rhp=True)]
    o.append(p.axes(xl=xl, yl=yl, xt=xt, yt=yt, xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(SPLANE(p, rhp=False))
    return "".join(o)


def _f13_db(v):
    return 20 * _f13_np.log10(_f13_np.abs(v))


# =====================================================================
# 1 節: 一巡伝達関数の形で性能を決める
# =====================================================================
def _f13_cart_slg_fig():
    o = []
    Ln, Ld = [4.0], [0.5, 1.0]
    gyr, S = _f13_cl(_F13_CART[0], _F13_CART[1], [8.0], [1.0])
    w = _f13_lw(0.1, 1000, 700)
    dbL, _ = BODEPH(Ln, Ld, w)
    dbS, _ = BODEPH(list(S[0]), list(S[1]), w)
    dbG, _ = BODEPH(list(gyr[0]), list(gyr[1]), w)
    o.append(TX(14, 18, "台車の速度の比例制御（K_P = 8 N/(m/s)）: P(jω)C(jω) = 4/(1 + j0.5ω)", "start", 11, INK, True))
    p = Plot(70, 36, 600, 236, (0.1, 1000), (-40, 20), xlog=True)
    # ループのゲインが大きい所・1 に近い所・小さい所
    wa, wb = 2.0, 30.0
    o.append(RECT(p.X(wa), p.y, p.X(wb) - p.X(wa), p.h, 0, MSOFT, "none", 0))
    o.append(p.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [dB]", yt=[-40, -30, -20, -10, 0, 10, 20], yfmt=_f13_n))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1.1))
    # 近似: 1/|PC|（大きい所）と |PC|（小さい所。|PC| の線そのもの）
    m = w <= 3.0
    o.append(p.clip(list(zip(w[m], -dbL[m])), c=PUR, lw=1.6, dash="5 4"))
    o.append(p.clip(list(zip(w, dbL)), c=SIG, lw=2.6))
    o.append(p.clip(list(zip(w, dbS)), c=PUR, lw=2.2))
    o.append(p.clip(list(zip(w, dbG)), c=TEA, lw=2.2))
    for wv in (1.0, 50.0):
        L = abs(_f13_jw(Ln, Ld, wv)); s_ = 1 / abs(1 + _f13_jw(Ln, Ld, wv)); g_ = L * s_
        o.append(W(p.X(wv), p.y, p.X(wv), p.y + p.h, c=FNT, lw=1, dash="3 3"))
        o.append(D(p.X(wv), p.Y(20 * math.log10(L)), SIG, 3.6))
        o.append(D(p.X(wv), p.Y(20 * math.log10(s_)), PUR, 3.6))
        o.append(D(p.X(wv), p.Y(20 * math.log10(g_)), TEA, 3.6))
    o.append(T(p.X(1) - 6, p.Y(20 * math.log10(3.578)) - 7, "|PC| = 3.58", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1) + 6, p.Y(20 * math.log10(0.2225)) + 16, "|S| = 0.222（1/4.58 〜 1/2.58 の間）", "start", 9.5, PUR, True, halo=True))
    o.append(TX(p.X(50) + 7, p.Y(20 * math.log10(0.1569)) + 17, "|PC| = 0.160、|G_{yr}| = 0.157", "start", 9.5, TEA, True, halo=True))
    o.append(T(p.X(50) + 6, p.Y(20 * math.log10(0.9814)) - 7, "|S| = 0.981", "start", 9.5, PUR, True, halo=True))
    o.append(TX(p.X(1) + 6, p.Y(20 * math.log10(0.796)) - 7, "|G_{yr}| = 0.796", "start", 9.5, TEA, True, halo=True))
    # 説明
    o.append(T(p.X(0.12), p.Y(-25), "ループのゲインが大きい所", "start", 10, INK, True, halo=True))
    o.append(TX(p.X(0.12), p.Y(-25) + 15, "|S| ≈ 1/|PC|（破線）、|G_{yr}| ≈ 1", "start", 10, PUR, False, halo=True))
    o.append(T(p.X(7.75), p.y + 14, "|PC| ≈ 1: 近似は使えない", "middle", 9.5, MUT, True, halo=True))
    o.append(T(p.X(900), p.Y(15), "ループのゲインが小さい所", "end", 10, INK, True, halo=True))
    o.append(TX(p.X(900), p.Y(15) + 15, "|G_{yr}| ≈ |PC|、|S| ≈ 1", "end", 10, TEA, False, halo=True))
    o.append(LEGL(70, 318, [(SIG, None, "|P(jω)C(jω)|"), (PUR, None, "|S(jω)|"), (TEA, None, "|G_{yr}(jω)|"), (PUR, "5 4", "1/|P(jω)C(jω)|")], 9.5))
    return _f13_svg(700, 330, o, "台車の速度の比例制御で、一巡伝達関数のゲイン |PC| と、感度関数 |S|、閉ループ伝達関数 |G_yr| を重ねたもの。|PC| が 1 より十分に大きい遅い角周波数では |S| は 1/|PC|（破線）に、1 より十分に小さい速い角周波数では |G_yr| は |PC| に重なる。点は 1 rad/s と 50 rad/s の値で、三角不等式で挟んだ範囲に入る。灰色の帯は |PC| が 1 に近い所（交差 7.75 rad/s のまわり）で、どちらの近似も使えない。")


F["e13_cart_slg"] = _f13_cart_slg_fig()


def _f13_crossover_fig():
    o = []
    Ks = [(0.21, GRN), (0.84, SIG), (4.0, ALI)]
    w = _f13_lw(1, 1000, 700)
    o.append(TX(14, 18, "(a) 感度関数 |S(jω)|（点は ω_{gc} での値）", "start", 11, INK, True))
    o.append(TX(364, 18, "(b) 閉ループ伝達関数 |G_{yr}(jω)|", "start", 11, INK, True))
    pa = Plot(64, 34, 270, 150, (1, 1000), (-30, 15), xlog=True)
    pb = Plot(414, 34, 270, 150, (1, 1000), (-30, 15), xlog=True)
    for p in (pa, pb):
        o.append(p.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [dB]", yt=[-30, -20, -10, 0, 10], yfmt=_f13_n, sz=9))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1.1))
    res = []
    for K, c in Ks:
        gyr, S = _f13_cl(_F13_PM[0], _F13_PM[1], [K], [1.0])
        dbS, _ = BODEPH(list(S[0]), list(S[1]), w)
        dbG, _ = BODEPH(list(gyr[0]), list(gyr[1]), w)
        Ln, Ld = _f13_ser(([K], [1.0]), _F13_PM)
        wgc, pm, _, _ = _f13_margins(Ln, Ld)
        v = 1 / (2 * math.sin(math.radians(pm) / 2))
        o.append(pa.clip(list(zip(w, dbS)), c=c, lw=2.2))
        o.append(pb.clip(list(zip(w, dbG)), c=c, lw=2.2))
        for p in (pa, pb):
            o.append(W(p.X(wgc), p.Y(20 * math.log10(v)), p.X(wgc), p.y + p.h, c=c, lw=1, dash="2 3"))
            o.append(D(p.X(wgc), p.Y(20 * math.log10(v)), c, 4))
        res.append((K, c, wgc, pm, v))
    # 値の札
    for p, side in ((pa, "S"), (pb, "G")):
        for K, c, wgc, pm, v in res:
            a, dx = ("end", -7) if K != 0.21 else ("end", -7)
            yy = p.Y(20 * math.log10(v)) - 7
            o.append(T(p.X(wgc) + dx, yy, _f13_s3(v), a, 9.5, c, True, halo=True))
    # (c) ステップ応答
    o.append(T(14, 240, "(c) 目標の角度を 1 rad 変えたときの角度", "start", 11, INK, True))
    q = Plot(64, 254, 620, 150, (0, 0.6), (0, 1.7))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 0.5, 1, 1.5], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=MUT, lw=1.2, dash="5 3"))
    t = _f13_np.linspace(0, 0.6, 3001)
    labs = []
    for K, c, wgc, pm, v in res:
        gyr, S = _f13_cl(_F13_PM[0], _F13_PM[1], [K], [1.0])
        y = _f13_step(gyr[0], gyr[1], t)
        o.append(q.clip(list(zip(t, y)), c=c, lw=2.2))
        mp, ts = _f13_metrics(t, y, 1.0)
        labs.append((c, None, "%s V/rad: ω_gc %s rad/s・φ_m %s°・M_p %s %%" % (_f13_n(K), _f13_g(wgc, 3), _f13_f(pm, 1), _f13_f(mp, 1))))
    o.append(LEGL(64, 448, labs[:2], 9.5, 14))
    o.append(LEGL(64, 466, labs[2:], 9.5, 14))
    return _f13_svg(700, 478, o, "モータの位置の比例制御（P(s) = 1000/{s(s + 20)} rad/V）で、比例ゲインを 0.21・0.84・4 V/rad に変えたもの。(a)(b) ゲイン交差角周波数 ω_gc での |S| と |G_yr| は、どちらも 1/{2 sin(φ_m/2)}（0.935・1.54・3.20）で、位相余裕が小さいほど高い山になる。(c) 交差を上げるほど速くなるが、山が高いほど大きく行き過ぎる（5.0・31.5・60.5 %）。")


F["e13_crossover"] = _f13_crossover_fig()


def _f13_target_fig():
    o = []
    # 交差で 1 に正規化した例のループ: 0.25(1 + 4s)/{s^2(1 + s/4)}
    Ln, Ld = [1.0, 0.25], _f13_pm([1.0, 0.0, 0.0], [0.25, 1.0])
    w = _f13_lw(0.01, 100, 700)
    db, ph = BODEPH(Ln, Ld, w)
    o.append(T(14, 18, "(a) ゲイン: 塗った所を通らないように、間を −20 dB/dec 程度の傾きで横切らせる", "start", 11, INK, True))
    p = Plot(70, 34, 600, 200, (0.01, 100), (-60, 60), xlog=True)
    # 通ってはいけない所
    o.append(RECT(p.X(0.01), p.Y(20), p.X(0.1) - p.X(0.01), p.Y(-60) - p.Y(20), 0, ASOFT, "none", 0))
    o.append(RECT(p.X(10), p.Y(60), p.X(100) - p.X(10), p.Y(-20) - p.Y(60), 0, ASOFT, "none", 0))
    o.append(p.axes(xl=None, yl="ゲイン [dB]", yt=[-60, -40, -20, 0, 20, 40, 60], xfmt=lambda v: "", yfmt=_f13_n))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1.1))
    o.append(W(p.X(0.01), p.Y(20), p.X(0.1), p.Y(20), p.X(0.1), p.Y(-60), c=ALI, lw=1.4))
    o.append(W(p.X(10), p.Y(60), p.X(10), p.Y(-20), p.X(100), p.Y(-20), c=ALI, lw=1.4))
    # 漸近線（−40, −20, −40 dB/dec）
    asy = [(0.01, 20 * math.log10(0.25 / 0.01 ** 2)), (0.25, 20 * math.log10(0.25 / 0.25 ** 2)), (4.0, 20 * math.log10(0.25 * 4 / 4.0)), (100, 20 * math.log10(0.25 * 4 * 4 / 100 ** 2))]
    o.append(p.clip(asy, c=FNT, lw=1.3, dash="4 3"))
    o.append(p.clip(list(zip(w, db)), c=SIG, lw=2.6))
    o.append(D(p.X(1), p.Y(0), SIG, 4.2))
    o.append(T(p.X(0.0105), p.Y(-22), "遅い所: ゲインを高く", "start", 10, ALI, True, halo=True))
    o.append(TX(p.X(0.0105), p.Y(-22) + 15, "|S| ≈ 1/|PC| → 追従・外乱", "start", 9.5, ALI, False, halo=True))
    o.append(T(p.X(95), p.Y(42), "速い所: ゲインを低く", "end", 10, ALI, True, halo=True))
    o.append(TX(p.X(95), p.Y(42) + 15, "|G_{yr}| ≈ |PC| → ノイズ", "end", 9.5, ALI, False, halo=True))
    o.append(TX(p.X(1) + 8, p.Y(0) - 8, "交差 ω_{gc}", "start", 10, SIG, True, halo=True))
    o.append(T(p.X(0.03), p.Y(44), "−40 dB/dec", "middle", 9.5, MUT, halo=True))
    o.append(T(p.X(1.6), p.Y(12), "−20 dB/dec", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(18), p.Y(-26), "−40 dB/dec", "middle", 9.5, MUT, halo=True))
    o.append(T(p.X(0.25), p.Y(-50), "交差の 1/4", "middle", 9, MUT, halo=True))
    o.append(T(p.X(4), p.Y(-50), "交差の 4 倍", "middle", 9, MUT, halo=True))
    for wc in (0.25, 4.0):
        o.append(W(p.X(wc), p.y + 6, p.X(wc), p.y + p.h, c=FNT, lw=1, dash="2 3"))
    # (b) 位相
    o.append(T(14, 262, "(b) 位相: 交差で −180° から位相余裕だけ離す", "start", 11, INK, True))
    q = Plot(70, 276, 600, 110, (0.01, 100), (-200, -90), xlog=True)
    o.append(q.axes(xl="角周波数 ω（交差角周波数 ω_gc を 1 とした目盛）", yl="位相 [°]", yt=[-180, -135, -90], xfmt=_f13_n, yfmt=_f13_n))
    o.append(W(q.x, q.Y(-180), q.x + q.w, q.Y(-180), c=MUT, lw=1.1, dash="5 3"))
    o.append(q.clip(list(zip(w, ph)), c=SIG, lw=2.4))
    wgc, pmv, _, _ = _f13_margins(Ln, Ld)
    o.append(ARR(q.X(1), q.Y(-180), q.X(1), q.Y(-180 + pmv), c=GRN, lw=2.0, head=6))
    o.append(TX(q.X(1) + 7, q.Y(-180 + pmv / 2) + 4, "位相余裕 φ_m = %s°（余裕・行き過ぎ）" % _f13_f(pmv, 1), "start", 9.5, GRN, True, halo=True))
    o.append(T(q.X(0.012), q.Y(-104), "傾き −40 dB/dec の所（両端）では −180° に近い", "start", 9, MUT, halo=True))
    return _f13_svg(700, 426, o, "ループ整形の目標の形（例の一巡伝達関数 0.25(1 + 4s)/{s²(1 + s/4)}。角周波数は交差角周波数 ω_gc を 1 とした目盛）。(a) 赤い塗りの領域は、ゲインの線が通ってはいけない所: 遅い角周波数（交差の 1/10 より下）では 20 dB 以上にして外乱を 1/10 以下に縮め、速い角周波数（交差の 10 倍より上）では −20 dB 以下にしてノイズを 1/10 以下にする。その間を、交差の前後で −20 dB/dec の傾きで横切らせる。(b) 交差の前後に −20 dB/dec の区間があるので、交差での位相は −180° から 61.9° 離れる。")


F["e13_target"] = _f13_target_fig()


# =====================================================================
# 2 節: 位相遅れ補償
# =====================================================================
def _f13_lag_bode_fig():
    o = []
    x = _f13_lw(0.001, 100, 700)          # ω/ω_z1
    o.append(TX(14, 18, "(a) 遅れ補償器 (s + ω_{z1})/(s + ω_{p1}) のボード線図（ω_{z1} を 1 とした目盛）", "start", 11, INK, True))
    curves = []
    for r, c, lw in ((3, FNT, 1.3), (30, FNT, 1.3), (10, SIG, 2.4)):
        db, ph = BODEPH([1.0, 1.0], [1.0, 1.0 / r], x)
        curves.append((x, db, ph, c, None if r == 10 else "5 3"))
    svg, pm, pp, hh = BODE(70, 36, 380, curves, (0.001, 100), (-5, 35), (-75, 5), hm=120, hp=110, gap=30,
                           dbt=[0, 10, 20, 30], pht=[-60, -45, -30, -15, 0], xl="ω/ω_{z1}")
    o.append(svg)
    # 倍率 10 の漸近線
    o.append(pm.clip([(0.001, 20), (0.1, 20), (1, 0), (100, 0)], c=GLD, lw=1.3, dash="4 3"))
    o.append(T(pm.X(0.0015), pm.Y(20) - 6, "倍率 10: 20 dB", "start", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(0.0015), pm.Y(29.5) - 4, "倍率 30", "start", 9, MUT, halo=True))
    o.append(T(pm.X(0.0015), pm.Y(9.5) - 4, "倍率 3", "start", 9, MUT, halo=True))
    o.append(TX(pm.X(0.1), pm.Y(26), "ω_{p1}", "middle", 9.5, SIG, True, halo=True))
    o.append(TX(pm.X(1), pm.Y(8), "ω_{z1}", "middle", 9.5, SIG, True, halo=True))
    for xv in (0.1, 1.0):
        o.append(W(pm.X(xv), pm.y, pm.X(xv), pp.y + pp.h, c=FNT, lw=1, dash="2 3"))
    # 最も遅れる所と 10 ω_z1
    v = _f13_jw([1.0, 1.0], [1.0, 0.1], math.sqrt(0.1))
    phm = math.degrees(math.atan2(v.imag, v.real))
    o.append(D(pp.X(math.sqrt(0.1)), pp.Y(phm), SIG, 3.6))
    o.append(TX(pp.X(math.sqrt(0.1)) + 7, pp.Y(phm) + 4, "%s°（√(ω_{z1}ω_{p1})）" % _f13_f(phm, 1), "start", 9.5, SIG, True, halo=True))
    v10 = _f13_jw([1.0, 1.0], [1.0, 0.1], 10.0)
    ph10 = math.degrees(math.atan2(v10.imag, v10.real)); g10 = 20 * math.log10(abs(v10))
    o.append(D(pp.X(10), pp.Y(ph10), SIG, 3.6)); o.append(D(pm.X(10), pm.Y(g10), SIG, 3.6))
    o.append(TX(pp.X(10) + 6, pp.Y(ph10) + 17, "10ω_{z1}: %s°" % _f13_f(ph10, 1), "start", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(10), pm.Y(g10) - 7, "+%s dB" % _f13_f(g10, 2), "middle", 9.5, SIG, True, halo=True))
    # 近似 −(ω_z1 − ω_p1)/ω [rad]
    xa = _f13_lw(2, 100, 100)
    o.append(pp.clip([(xv, -math.degrees(0.9 / xv)) for xv in xa], c=GLD, lw=1.6, dash="4 3"))
    o.append(TX(pp.X(95), pp.Y(-34), "近似 −0.9/(ω/ω_{z1}) rad", "end", 9, GLD, False, halo=True))
    # (b) 交差での位相の遅れと零点の位置
    o.append(TX(486, 18, "(b) 交差での位相の遅れ（倍率 10）", "start", 11, INK, True))
    q = Plot(530, 36, 150, 260, (2, 50), (0, 30), xlog=True)
    o.append(q.axes(xl="ω_{gc}/ω_{z1}", yl="遅れ [°]", xt=[2, 5, 10, 20, 50], yt=[0, 5, 10, 15, 20, 25, 30], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    xx = _f13_lw(2, 50, 200)
    ex = []
    for xv in xx:
        vv = _f13_jw([1.0, 1.0], [1.0, 0.1], xv); ex.append((xv, -math.degrees(math.atan2(vv.imag, vv.real))))
    o.append(q.line(ex, c=SIG, lw=2.2))
    o.append(q.line([(xv, math.degrees(0.9 / xv)) for xv in xx], c=GLD, lw=1.6, dash="4 3"))
    for xv in (3.0, 5.0, 10.0, 20.0):
        vv = _f13_jw([1.0, 1.0], [1.0, 0.1], xv); d_ = -math.degrees(math.atan2(vv.imag, vv.real))
        o.append(D(q.X(xv), q.Y(d_), SIG, 3.4))
        o.append(T(q.X(xv) + 6, q.Y(d_) - 6, "%s°" % _f13_f(d_, 1), "start", 9, SIG, True, halo=True))
    return _f13_svg(700, max(hh, 340) + 4, o, "位相遅れ補償器 (s + ω_z1)/(s + ω_p1)。(a) 遅い角周波数のゲインを ω_z1/ω_p1 倍（倍率 10 なら 20 dB）に上げ、ω_z1 より上では 1 倍（0 dB）に戻る。位相はどこでも遅れ、最も遅れるのは 2 つの折れ点の真ん中（倍率 10 で −54.9°）。ω_z1 の 10 倍では −5.1°・+0.04 dB しか変えない。破線（金）は導出の近似 −(ω_z1 − ω_p1)/ω。(b) 交差角周波数が零点の何倍かと、交差での位相の遅れ。零点を交差の 1/10 に置けば 5.1°、1/3 なら 16.5° 遅れる。")


F["e13_lag_bode"] = _f13_lag_bode_fig()


def _f13_lag_cases():
    lagC = (_f13_pm([8.0], [1.0, 0.8]), [1.0, 0.08])
    return [("比例 8 N/(m/s)", ([8.0], [1.0]), MUT, "5 3"), ("比例 80 N/(m/s)", ([80.0], [1.0]), ALI, None),
            ("遅れ補償 8(s + 0.8)/(s + 0.08)", lagC, SIG, None)]


def _f13_lag_loop_fig():
    o = []
    w = _f13_lw(0.01, 1000, 800)
    curves, marks = [], []
    for lab, (Cn, Cd), c, dash in _f13_lag_cases():
        Ln, Ld = _f13_ser((Cn, Cd), _F13_CART)
        db, ph = BODEPH(Ln, Ld, w)
        curves.append((w, db, ph, c, dash))
        marks.append((lab, c, _f13_margins(Ln, Ld), Ln, Ld))
    o.append(T(14, 18, "台車の速度の一巡伝達関数 P(jω)C(jω)", "start", 11, INK, True))
    svg, pm, pp, hh = BODE(70, 36, 600, curves, (0.01, 1000), (-30, 50), (-100, 0), hm=170, hp=110, gap=30,
                           dbt=[-20, 0, 20, 40], pht=[-90, -45, 0])
    o.append(svg)
    for lab, c, (wgc, pmv, _, _), Ln, Ld in marks:
        o.append(D(pm.X(wgc), pm.Y(0), c, 4))
        v = _f13_jw(Ln, Ld, wgc); ph = math.degrees(math.atan2(v.imag, v.real))
        o.append(D(pp.X(wgc), pp.Y(ph), c, 4))
    o.append(T(pm.X(0.012), pm.Y(32) - 6, "遅れ補償・比例 80: 32.0 dB（40 倍）", "start", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(0.012), pm.Y(12) + 15, "比例 8: 12.0 dB（4 倍）", "start", 9.5, MUT, True, halo=True))
    o.append(T(pm.X(7.79) - 7, pm.Y(0) + 15, "交差 7.79 rad/s（比例 8 は 7.75）", "end", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(80) + 7, pm.Y(0) - 7, "比例 80 の交差 80.0 rad/s", "start", 9.5, ALI, True, halo=True))
    o.append(W(pm.X(50), pm.y, pm.X(50), pm.y + pm.h, c=FNT, lw=1, dash="2 3"))
    o.append(D(pm.X(50), pm.Y(-15.92), SIG, 3.6)); o.append(D(pm.X(50), pm.Y(4.08), ALI, 3.6))
    o.append(T(pm.X(950), pm.Y(44), "50 rad/s での |PC|:", "end", 9.5, INK, True, halo=True))
    o.append(T(pm.X(950), pm.Y(44) + 14, "比例 8・遅れ補償 −15.9 dB、比例 80 +4.1 dB", "end", 9.5, INK, False, halo=True))
    o.append(T(pp.X(0.012), pp.Y(-80), "遅れ補償器の位相の遅れは、交差より十分に低い所にある", "start", 9.5, SIG, False, halo=True))
    o.append(T(pp.X(7.8) + 6, pp.Y(-80.9) - 6, "位相余裕 99.1°（比例 104.5°）", "start", 9.5, SIG, True, halo=True))
    o.append(LEGL(70, hh + 8, [(c, dash, lab) for lab, _, c, dash in _f13_lag_cases()], 9.5))
    return _f13_svg(700, hh + 18, o, "台車の速度（P(s) = 0.5/(0.5s + 1)）の一巡伝達関数。比例ゲインを 10 倍にすると、ゲインの線全体が 20 dB 上がり、交差も 80.0 rad/s に上がって、50 rad/s で |PC| が 1 を越える（観測ノイズが通る）。遅れ補償器は 0.8 rad/s より下だけを 20 dB 上げ、交差（7.79 rad/s）と 50 rad/s のゲイン（−15.9 dB）は比例 8 N/(m/s) のままで、位相余裕は 104.5° から 99.1° に減るだけである。比例ゲインを上げても位相の線は変わらないので、比例 8 と 80 の位相は重なる。")


F["e13_lag_loop"] = _f13_lag_loop_fig()


def _f13_lag_time_fig():
    o = []
    t = _f13_np.linspace(0, 4.0, 4001)
    o.append(T(14, 18, "(a) 目標の速度を 1 m/s に変えたときの速度", "start", 11, INK, True))
    p = Plot(70, 32, 600, 160, (0, 4.0), (0, 1.1))
    o.append(RECT(p.x, p.Y(0.9756 * 1.02), p.w, p.Y(0.9756 * 0.98) - p.Y(0.9756 * 1.02), 0, GSOFT, "none", 0))
    o.append(p.axes(xl=None, yl="速度 [m/s]", xt=[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0], xfmt=lambda v: "", yfmt=_f13_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    for lab, (Cn, Cd), c, dash in _f13_lag_cases():
        gyr, S = _f13_cl(_F13_CART[0], _F13_CART[1], Cn, Cd)
        y = _f13_step(gyr[0], gyr[1], t)
        o.append(p.line(list(zip(t, y)), c=c, lw=2.2 if c != MUT else 1.8, dash=dash))
    o.append(T(p.X(3.95), p.Y(0.8) + 15, "比例 8: 0.8 m/s（偏差 0.2）", "end", 9.5, MUT, True, halo=True))
    o.append(T(p.X(0.08), p.Y(0.9756) - 8, "比例 80: 0.05 s で 0.976 m/s", "start", 9.5, ALI, True, halo=True))
    o.append(D(p.X(0.4), p.Y(0.8555), SIG, 3.6))
    o.append(W(p.X(0.4), p.Y(0.8555), p.X(0.62), p.Y(0.66), c=SIG, lw=1))
    o.append(T(p.X(0.64), p.Y(0.66) + 4, "遅れ補償: 0.4 s で 0.856 m/s", "start", 9.5, SIG, True, halo=True))
    o.append(D(p.X(2.74), p.Y(0.9756 * 0.98), SIG, 3.6))
    o.append(TX(p.X(2.74), p.Y(0.9756 * 0.98) + 15, "2.74 s で 2 % の幅（緑）に入る: 尾 −0.133e^{−0.699t}", "middle", 9.5, SIG, True, halo=True))
    # (b) 観測ノイズによる揺れ
    o.append(T(14, 222, "(b) 観測ノイズ（0.01 s ごとに変わる、標準偏差 0.02 m/s）による速度の揺れ", "start", 11, INK, True))
    rng = _f13_np.random.default_rng(3)   # 1 章 4 節の図と同じ seed（比例 8 の標準偏差が 1 章の本文の 0.0035 m/s にそろう）
    nz = rng.normal(0.0, 0.02, 30000)
    noise = lambda tt, k: nz[int(tt / 0.01)]
    lanes = []
    for i, (lab, (Cn, Cd), c, dash) in enumerate(_f13_lag_cases()):
        R = SIMLOOP(_F13_CART[0], _F13_CART[1], Cn, Cd, 200.0, n=400000, r=0.0, noise=noise, every=4)
        m = R["t"] >= 2.0
        lanes.append((lab, c, R, float(R["y"][m].std())))
    q = Plot(70, 236, 470, 150, (2.0, 4.0), (-0.15, 0.15))
    o.append(q.axes(xl="時間 t [s]", yl="速度の揺れ", xt=[2, 2.5, 3, 3.5, 4], yt=[], xfmt=_f13_n, sz=9))
    names = ("比例 8", "比例 80", "遅れ補償")
    for i, (lab, c, R, sd) in enumerate(lanes):
        off = 0.1 - 0.1 * i
        m = (R["t"] >= 2.0) & (R["t"] <= 4.0)
        o.append(W(q.x, q.Y(off), q.x + q.w, q.Y(off), c=FNT, lw=1, dash="2 3"))
        o.append(q.clip(list(zip(R["t"][m], R["y"][m] + off)), c=c, lw=1.4))
        o.append(T(q.x + q.w + 12, q.Y(off) - 2, names[i], "start", 10, c, True))
        o.append(T(q.x + q.w + 12, q.Y(off) + 12, "標準偏差 %s m/s" % _f13_g(sd, 2 if sd > 0.01 else 2), "start", 9.5, c))
    o.append(T(q.x + 4, q.y + q.h - 5, "3 本をずらして描いた（目盛 0.05 m/s ごと）", "start", 9, MUT, halo=True))
    for i in range(-3, 4):
        o.append(W(q.x - 4, q.Y(i * 0.05), q.x, q.Y(i * 0.05), c=MUT, lw=1))
    return _f13_svg(700, 430, o, "台車の速度で、比例 8 N/(m/s)・比例 80 N/(m/s)・遅れ補償 8(s + 0.8)/(s + 0.08) を比べる。(a) 遅れ補償は、比例 8 と同じように 0.4 s で 0.856 m/s まで上がった後、閉ループの遅い極 −0.699 の項で、残りの偏差をゆっくり詰める（2 % の幅に入るのは 2.74 s）。比例 80 は 0.05 s で落ち着く。(b) 同じ観測ノイズでの速度の揺れ（標準偏差は 2 s から 200 s までの値）。遅れ補償は比例 8 とほとんど同じで、比例 80 の 1/3 である。")


F["e13_lag_time"] = _f13_lag_time_fig()


# =====================================================================
# 3 節: 位相進み補償
# =====================================================================
def _f13_lead_bode_fig():
    o = []
    x = _f13_lw(0.01, 1000, 700)          # ω/ω_z2
    o.append(TX(14, 18, "(a) 進み補償器 (1 + s/ω_{z2})/(1 + s/ω_{p2}) のボード線図（ω_{z2} を 1 とした目盛）", "start", 11, INK, True))
    curves = []
    for a, c in ((10, TEA), (3, SIG)):
        db, ph = BODEPH([1.0, 1.0], [1.0 / a, 1.0], x)
        curves.append((x, db, ph, c, None))
    svg, pm, pp, hh = BODE(70, 36, 400, curves, (0.01, 1000), (-5, 25), (-5, 65), hm=120, hp=110, gap=30,
                           dbt=[0, 10, 20], pht=[0, 15, 30, 45, 60], xl="ω/ω_{z2}")
    o.append(svg)
    o.append(pm.clip([(0.01, 0), (1, 0), (3, 20 * math.log10(3)), (1000, 20 * math.log10(3))], c=GLD, lw=1.3, dash="4 3"))
    for a, c in ((3, SIG), (10, TEA)):
        wc = math.sqrt(a); phm = math.degrees(math.asin((a - 1) / (a + 1)))
        o.append(W(pm.X(wc), pm.Y(10 * math.log10(a)), pm.X(wc), pp.Y(phm), c=c, lw=1, dash="2 3"))
        o.append(D(pm.X(wc), pm.Y(10 * math.log10(a)), c, 3.8))
        o.append(D(pp.X(wc), pp.Y(phm), c, 3.8))
    o.append(TX(pp.X(1.732) - 8, pp.Y(30) + 4, "α = 3: φ_{max} = 30.0°", "end", 9.5, SIG, True, halo=True))
    o.append(TX(pp.X(3.162) + 6, pp.Y(54.9) - 7, "α = 10: 54.9°", "start", 9.5, TEA, True, halo=True))
    o.append(TX(pm.X(1.732) + 6, pm.Y(4.77) + 15, "√3 → 4.8 dB", "start", 9.5, SIG, True, halo=True))
    o.append(TX(pm.X(3.162) - 6, pm.Y(10) - 9, "√10 → 10 dB", "end", 9.5, TEA, True, halo=True))
    o.append(T(pm.X(950), pm.Y(9.54) + 14, "高い所: α 倍（9.5 dB）", "end", 9.5, SIG, True, halo=True))
    o.append(T(pm.X(950), pm.Y(20) - 6, "20 dB", "end", 9.5, TEA, True, halo=True))
    o.append(TX(pp.X(0.012), pp.Y(52), "山の頂 ω_c = √(ω_{z2}ω_{p2})", "start", 9.5, INK, False, halo=True))
    # (b) α と最大位相進み・高い角周波数のゲイン
    o.append(T(512, 18, "(b) α を大きくすると", "start", 11, INK, True))
    q = Plot(552, 36, 128, 120, (1, 100), (0, 90), xlog=True)
    o.append(q.axes(xl=None, yl="φ_max [°]", xt=[1, 10, 100], yt=[0, 30, 60, 90], xfmt=lambda v: "", yfmt=_f13_n, sz=9))
    aa = _f13_lw(1, 100, 200)
    o.append(q.line([(a, math.degrees(math.asin((a - 1) / (a + 1)))) for a in aa], c=SIG, lw=2.2))
    r = Plot(552, 186, 128, 110, (1, 100), (0, 40), xlog=True)
    o.append(r.axes(xl="α", yl="高域 [dB]", xt=[1, 10, 100], yt=[0, 20, 40], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(r.line([(a, 20 * math.log10(a)) for a in aa], c=ALI, lw=2.2))
    for a in (3, 10, 100):
        ph = math.degrees(math.asin((a - 1) / (a + 1)))
        o.append(D(q.X(a), q.Y(ph), SIG, 3.2)); o.append(D(r.X(a), r.Y(20 * math.log10(a)), ALI, 3.2))
    o.append(T(q.X(100) - 2, q.Y(78.6) + 15, "78.6°", "end", 9, SIG, True, halo=True))
    o.append(T(q.X(10) + 2, q.Y(54.9) + 15, "54.9°", "start", 9, SIG, True, halo=True))
    o.append(T(r.X(10) - 3, r.Y(20) - 6, "20 dB", "end", 9, ALI, True, halo=True))
    o.append(T(r.X(100) - 2, r.Y(40) + 14, "40 dB", "end", 9, ALI, True, halo=True))
    return _f13_svg(700, max(hh, 340) + 4, o, "位相進み補償器 (1 + s/ω_z2)/(1 + s/ω_p2)、α = ω_p2/ω_z2。(a) ゲインは 1 から α 倍まで上がり、位相は 2 つの折れ点の真ん中 ω_c = √(ω_z2 ω_p2)（対数の目盛で真ん中）で最大位相進み φ_max になる。そこでのゲインは √α。(b) α を大きくしても φ_max は 90° に届かず増え方が鈍いが、高い角周波数のゲイン（速いノイズが操作量に現れる倍率）は α に比例して増える。")


F["e13_lead_bode"] = _f13_lead_bode_fig()


def _f13_lead_design_fig():
    o = []
    a = 3.0; wgc = 30.0
    wz, wp = wgc / math.sqrt(a), wgc * math.sqrt(a)
    K1 = 1.0 / abs(_f13_jw(*_F13_PM, wgc))
    Kc = K1 / math.sqrt(a)
    leadC = (_f13_pm([Kc], [1 / wz, 1.0]), [1 / wp, 1.0])
    cases = [("比例 1.08 V/rad", ([K1], [1.0]), ALI, "5 3"), ("進み補償", leadC, SIG, None)]
    w = _f13_lw(1, 1000, 700)
    curves = []
    for lab, (Cn, Cd), c, dash in cases:
        Ln, Ld = _f13_ser((Cn, Cd), _F13_PM)
        db, ph = BODEPH(Ln, Ld, w)
        curves.append((w, db, ph, c, dash))
    o.append(T(14, 18, "(a) 一巡伝達関数（交差 30 rad/s）", "start", 11, INK, True))
    svg, pm, pp, hh = BODE(70, 36, 330, curves, (1, 1000), (-40, 40), (-190, -80), hm=120, hp=110, gap=30,
                           dbt=[-40, -20, 0, 20, 40], pht=[-180, -135, -90])
    o.append(svg)
    o.append(W(pm.X(30), pm.y, pm.X(30), pp.y + pp.h, c=FNT, lw=1, dash="2 3"))
    o.append(D(pm.X(30), pm.Y(0), SIG, 4))
    o.append(ARR(pp.X(30) + 3, pp.Y(-180), pp.X(30) + 3, pp.Y(-180 + 63.69), c=SIG, lw=2.0, head=6))
    o.append(ARR(pp.X(30) - 3, pp.Y(-180), pp.X(30) - 3, pp.Y(-180 + 33.69), c=ALI, lw=2.0, head=6))
    o.append(T(pp.X(30) + 9, pp.Y(-180 + 63.7) + 2, "63.7°", "start", 9.5, SIG, True, halo=True))
    o.append(T(pp.X(30) - 9, pp.Y(-180 + 33.7) + 10, "33.7°", "end", 9.5, ALI, True, halo=True))
    o.append(TX(pm.X(17.3), pm.Y(30), "ω_{z2} 17.3", "middle", 9, SIG, True, halo=True))
    o.append(TX(pm.X(52), pm.Y(18), "ω_{p2} 52.0", "middle", 9, SIG, True, halo=True))
    for xv in (17.3, 52.0):
        o.append(W(pm.X(xv), pm.Y(14) if xv > 30 else pm.Y(26), pm.X(xv), pm.y + pm.h, c=SIG, lw=1, dash="1 3"))
    o.append(T(pm.X(950), pm.Y(30), "−40 dB/dec の所を", "end", 9, MUT, halo=True))
    o.append(T(pm.X(950), pm.Y(30) + 12, "−20 dB/dec 程度で横切る", "end", 9, MUT, halo=True))
    # (b) s 平面
    o.append(T(436, 18, "(b) 極と零点（s 平面）", "start", 11, INK, True))
    p = Plot(478, 36, 200, 246, (-60, 5), (-40, 40))
    o.append(_f13_sp(p, [-60, -40, -20, 0], [-40, -20, 0, 20, 40]))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0), complex(-wp, 0)], [complex(-wz, 0)], c=MUT))
    gP, _ = _f13_cl(_F13_PM[0], _F13_PM[1], [K1], [1.0])
    gL, _ = _f13_cl(_F13_PM[0], _F13_PM[1], leadC[0], leadC[1])
    o.append(PZ(p, list(_f13_np.roots(gP[1])), [], c=ALI))
    o.append(PZ(p, list(_f13_np.roots(gL[1])), [], c=SIG))
    o.append(T(p.X(-17.3), p.Y(0) + 18, "零点 −17.3", "middle", 9, MUT, True, halo=True))
    o.append(T(p.X(-52), p.Y(0) - 9, "−52.0", "middle", 9, MUT, halo=True))
    o.append(T(p.X(-10) - 8, p.Y(31.3) + 4, "比例: −10 ± j31.3", "end", 9, ALI, True, halo=True))
    o.append(T(p.X(-27.9), p.Y(35.1) - 9, "−27.9 ± j35.1", "middle", 9, SIG, True, halo=True))
    o.append(T(p.X(-16.1) + 2, p.Y(0) - 22, "−16.1", "middle", 9, SIG, True, halo=True))
    # (c) ステップ応答
    o.append(T(14, hh + 18, "(c) 目標の角度を 1 rad 変えたときの角度", "start", 11, INK, True))
    q = Plot(70, hh + 32, 600, 130, (0, 0.6), (0, 1.5))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yt=[0, 0.5, 1, 1.5], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(W(q.x, q.Y(1), q.x + q.w, q.Y(1), c=MUT, lw=1.2, dash="5 3"))
    t = _f13_np.linspace(0, 0.6, 3001)
    allc = [("比例 0.21 V/rad", ([0.21], [1.0]), MUT, "5 3")] + cases
    labs = []
    for lab, (Cn, Cd), c, dash in allc:
        g, _ = _f13_cl(_F13_PM[0], _F13_PM[1], Cn, Cd)
        y = _f13_step(g[0], g[1], t)
        o.append(q.clip(list(zip(t, y)), c=c, lw=2.2 if dash is None else 1.8, dash=dash))
        mp, ts = _f13_metrics(t, y, 1.0)
        labs.append((c, dash, lab + ": M_p " + _f13_f(mp, 1) + " %・t_{2%} " + _f13_f(ts, 3) + " s"))
    o.append(LEGL(70, hh + 208, labs[:2], 9.5, 16))
    o.append(LEGL(70, hh + 226, labs[2:], 9.5, 16))
    return _f13_svg(700, hh + 236, o, "モータの位置（1000/{s(s + 20)} rad/V）を交差 30 rad/s で制御する。(a) 比例ゲインだけで交差を 30 rad/s にすると（1.08 V/rad）、ゲインの線は −40 dB/dec の所で 0 dB を横切り、位相余裕は 33.7°。進み補償器（α = 3、ω_z2 = 17.3、ω_p2 = 52.0 rad/s、K_c = 0.624 V/rad）は、交差のまわりでゲインの傾きを緩め、位相の山（30°）を交差に重ねて、位相余裕を 63.7° にする。(b) 灰色は開ループの極と零点（対象の 0・−20 と、進み補償器の −17.3・−52.0）。閉ループの極は、零点に引き寄せられて左へ移る。(c) 進み補償は、0.21 V/rad の比例制御とほぼ同じ行き過ぎで、3.4 倍速く落ち着く。")


F["e13_lead_design"] = _f13_lead_design_fig()


# =====================================================================
# 4 節: 進み遅れ補償と PID の関係
# =====================================================================
_F13_PID = (0.84, 0.168, 0.02 / 0.84, 10.0)   # K_P, T_I, T_D, N（10 章 5・6 節）


def _f13_pid_tf(KP, TI, TD, N):
    tau = TD / N
    num = KP * _f13_np.array([TI * (tau + TD), TI + tau, 1.0])
    den = _f13_np.array([TI * tau, TI, 0.0])
    return num, den


def _f13_pid_split_fig():
    o = []
    KP, TI, TD, N = _F13_PID
    Cn, Cd = _f13_pid_tf(KP, TI, TD, N)
    z = sorted(-_f13_np.roots(Cn).real)        # z1 < z2
    z1, z2, wp = z[0], z[1], N / TD
    Kc = KP * (N + 1) * z2 / wp                 # C = Kc (s + z1)/s · (1 + s/z2)/(1 + s/wp)
    w = _f13_lw(0.1, 10000, 800)
    dbC, phC = BODEPH(list(Cn), list(Cd), w)
    dbg, phg = BODEPH([Kc, Kc * z1], [1.0, 0.0], w)
    dbd, phd = BODEPH([1 / z2, 1.0], [1 / wp, 1.0], w)
    Ln, Ld = _f13_ser((Cn, Cd), _F13_PM)
    wgc, pmv, _, _ = _f13_margins(Ln, Ld)
    # 交差に中心を合わせた、同じ進みの進み補償器
    vd = _f13_jw([1 / z2, 1.0], [1 / wp, 1.0], wgc); phd_gc = math.degrees(math.atan2(vd.imag, vd.real))
    sn = math.sin(math.radians(phd_gc)); a2 = (1 + sn) / (1 - sn)
    dbe, phe = BODEPH([1 / (wgc / math.sqrt(a2)), 1.0], [1 / (wgc * math.sqrt(a2)), 1.0], w)
    o.append(TX(14, 18, "不完全微分の PID（10 章のモータの角度: K_P = 0.84 V/rad、T_I = 0.168 s、T_D = 0.0238 s、N = 10）", "start", 11, INK, True))
    curves = [(w, dbg, phg, GRN, "5 3"), (w, dbd, phd, TEA, "5 3"), (w, dbe, phe, TEA, "1 3"), (w, dbC, phC, INK, None)]
    svg, pm, pp, hh = BODE(70, 36, 600, curves, (0.1, 10000), (-10, 40), (-90, 90), hm=150, hp=130, gap=30,
                           dbt=[-10, 0, 10, 20, 30, 40], pht=[-90, -45, 0, 45, 90])
    o.append(svg)
    for xv in (wgc,):
        o.append(W(pm.X(xv), pm.y, pm.X(xv), pp.y + pp.h, c=SIG, lw=1.2, dash="3 3"))
    o.append(TX(pm.X(wgc) + 5, pm.y + 12, "交差 %s rad/s" % _f13_f(wgc, 1), "start", 9.5, SIG, True, halo=True))
    vg = _f13_jw([Kc, Kc * z1], [1.0, 0.0], wgc); phg_gc = math.degrees(math.atan2(vg.imag, vg.real))
    o.append(D(pp.X(wgc), pp.Y(phd_gc), TEA, 3.8)); o.append(D(pp.X(wgc), pp.Y(phg_gc), GRN, 3.8))
    o.append(T(pp.X(wgc) - 6, pp.Y(phd_gc) - 6, "+%s°" % _f13_f(phd_gc, 1), "end", 9.5, TEA, True, halo=True))
    o.append(T(pp.X(wgc) + 6, pp.Y(phg_gc) + 15, "%s°" % _f13_f(phg_gc, 1), "start", 9.5, GRN, True, halo=True))
    wc = math.sqrt(z2 * wp); phmax = math.degrees(math.asin((wp / z2 - 1) / (wp / z2 + 1)))
    o.append(D(pp.X(wc), pp.Y(phmax), TEA, 3.8))
    o.append(T(pp.X(wc) + 7, pp.Y(phmax) - 4, "山の中心 %s rad/s: %s°" % (_f13_f(wc, 0), _f13_f(phmax, 1)), "start", 9.5, TEA, True, halo=True))
    o.append(T(pp.X(9500), pp.Y(-62), "点線: 中心を交差に合わせた α = %s の進み補償器" % _f13_f(a2, 1), "end", 9.5, TEA, False, halo=True))
    o.append(T(pm.X(0.12), pm.Y(31) - 4, "遅れ補償器の部分 %s(s + %s)/s" % (_f13_f(Kc, 3), _f13_f(z1, 2)), "start", 9.5, GRN, True, halo=True))
    o.append(T(pm.X(9500), pm.Y(23.5) - 6, "進み補償器の部分（折れ点 %s・%s rad/s、α = %s）" % (_f13_f(z2, 1), _f13_f(wp, 0), _f13_f(wp / z2, 1)), "end", 9.5, TEA, True, halo=True))
    o.append(T(pm.X(9500), pm.Y(19.3) + 15, "PID 全体（2 つの和）", "end", 9.5, INK, True, halo=True))
    o.append(LEGL(70, hh + 8, [(INK, None, "PID 全体"), (GRN, "5 3", "遅れ補償器の部分"), (TEA, "5 3", "進み補償器の部分"), (TEA, "1 3", "中心を交差に合わせた進み補償器")], 9.5))
    return _f13_svg(700, hh + 18, o, "不完全微分の PID を、原点に極を置いた遅れ補償器（緑）と、進み補償器（青緑）の積に分けたもの。dB と位相は 2 つの和が PID 全体（黒）になる。一巡伝達関数の交差 %s rad/s での位相は、進み補償器の部分が +%s°、遅れ補償器の部分が %s° で、位相余裕は %s° である。進みの山の中心 %s rad/s は交差の約 4 倍上にあり、山の頂の %s° のうち一部しか使っていない。中心を交差に合わせれば、同じ進みを α = %s で得られる（点線）。" % (_f13_f(wgc, 1), _f13_f(phd_gc, 1), _f13_f(phg_gc, 1), _f13_f(pmv, 1), _f13_f(wc, 0), _f13_f(phmax, 1), _f13_f(a2, 1)))


F["e13_pid_split"] = _f13_pid_split_fig()


def _f13_family_fig():
    o = []
    # 角周波数は折れ点を基準にした目盛（どれも例）
    items = [
        ("遅れ補償器", "(s + ω_{z1})/(s + ω_{p1})", [1.0, 1.0], [1.0, 0.1], [0.1], [1.0], None),
        ("PI 制御（ω_{p1} = 0）", "(s + ω_{z1})/s", [1.0, 1.0], [1.0, 0.0], ["0"], [1.0], None),
        ("進み補償器", "(1 + s/ω_{z2})/(1 + s/ω_{p2})", [1.0, 1.0], [0.1, 1.0], [10.0], [1.0], None),
        ("PD 制御（ω_{p2} → ∞）", "1 + s/ω_{z2}", [1.0, 1.0], [1.0], ["inf"], [1.0], None),
        ("進み遅れ補償器", "遅れ補償器 × 進み補償器", list(_f13_pm([1.0, 0.1], [1.0, 1.0])), list(_f13_pm([1.0, 0.01], [0.1, 1.0])), [0.01, 10.0], [0.1, 1.0], None),
        ("不完全微分の PID", "遅れ補償器（ω_{p1} = 0）× 進み補償器", list(_f13_pm([1.0, 0.1], [1.0, 1.0])), list(_f13_pm([1.0, 0.0], [0.1, 1.0])), ["0", 10.0], [0.1, 1.0], None),
    ]
    w = _f13_lw(0.001, 1000, 400)
    cw, ch = 220, 216
    for k, (name, form, num, den, poles, zeros, _) in enumerate(items):
        col, row = k % 3, k // 3
        x0, y0 = 14 + col * (cw + 12), 8 + row * (ch + 14)
        o.append(RECT(x0, y0, cw, ch, 6, PAN, LIN, 1.0))
        o.append(TX(x0 + 8, y0 + 18, name, "start", 10.5, INK, True))
        o.append(TX(x0 + 8, y0 + 34, form, "start", 9.5, MUT))
        db, ph = BODEPH(num, den, w)
        lo = min(db.min(), 0); off = -lo
        pg = Plot(x0 + 40, y0 + 46, cw - 52, 70, (0.001, 1000), (-5, 45), xlog=True)
        pf = Plot(x0 + 40, y0 + 128, cw - 52, 54, (0.001, 1000), (-90, 90), xlog=True)
        o.append(pg.axes(xl=None, yl=None, xt=[0.001, 0.01, 0.1, 1, 10, 100, 1000], yt=[0, 20, 40], xfmt=lambda v: "", yfmt=_f13_n, sz=8.5))
        o.append(pf.axes(xl=None, yl=None, xt=[0.001, 0.01, 0.1, 1, 10, 100, 1000], yt=[-90, 0, 90], xfmt=lambda v: "", yfmt=_f13_n, sz=8.5))
        o.append(W(pf.x, pf.Y(0), pf.x + pf.w, pf.Y(0), c=MUT, lw=1))
        o.append(pg.clip(list(zip(w, db + off)), c=SIG, lw=2.0))
        o.append(pf.clip(list(zip(w, ph)), c=SIG, lw=2.0))
        # 折れ点の印（× 極、○ 零点）を位相の図の下に
        yb = pf.y + pf.h + 14
        o.append(W(pf.x, yb, pf.x + pf.w, yb, c=FNT, lw=1))
        for zv in zeros:
            o.append(CIRC(pf.X(zv), yb, 4.2, c=SIG, lw=1.8, fill=SCR))
        for pv in poles:
            if pv == "0":
                xx = pf.x + 4
                o.append(W(xx - 4, yb - 4, xx + 4, yb + 4, c=SIG, lw=1.8)); o.append(W(xx - 4, yb + 4, xx + 4, yb - 4, c=SIG, lw=1.8))
                o.append(T(xx + 7, yb + 4, "原点", "start", 8.5, MUT))
            elif pv == "inf":
                o.append(T(pf.x + pf.w, yb + 4, "極なし →", "end", 8.5, MUT))
            else:
                xx = pf.X(pv)
                o.append(W(xx - 4, yb - 4, xx + 4, yb + 4, c=SIG, lw=1.8)); o.append(W(xx - 4, yb + 4, xx + 4, yb - 4, c=SIG, lw=1.8))
    o.append(T(14, 2 * (ch + 14) + 18, "上: ゲイン（dB）、中: 位相（°）、下: 折れ点の並び（○ 零点、× 極）。横軸はどれも同じ対数の目盛。", "start", 9.5, MUT))
    return _f13_svg(700, 2 * (ch + 14) + 26, o, "補償器と PID の比較。遅れ補償器は極が零点より低い所にあり、遅い角周波数のゲインを上げて位相を遅らせる。極を原点に置くと PI 制御になり、遅い所のゲインが限りなく大きくなる。進み補償器は零点が極より低い所にあり、高い角周波数のゲインを上げて位相を進める。極を限りなく遠くへやると PD 制御になり、高い所のゲインが限りなく大きくなる。進み遅れ補償器は 2 つの直列で、遅れ補償器の極を原点に置いたものが不完全微分の PID である。")


F["e13_family"] = _f13_family_fig()


# =====================================================================
# 5 節: 速さと余裕の限界
# =====================================================================
def _f13_wall_fig():
    o = []
    wg = _f13_lw(5, 500, 400)
    dbP, phP = BODEPH(*_F13_PMLA, wg)
    o.append(TX(14, 18, "(a) 交差角周波数 ω_{gc} で残る位相余裕（L_a を含む）", "start", 11, INK, True))
    p = Plot(64, 36, 270, 220, (5, 500), (0, 120), xlog=True)
    o.append(p.axes(xl="交差角周波数 ω_gc [rad/s]", yl="位相余裕 [°]", yt=[0, 30, 50, 60, 90, 120], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(W(p.x, p.Y(50), p.x + p.w, p.Y(50), c=ALI, lw=1.2, dash="5 3"))
    for a, c, lab in ((1, MUT, "比例だけ"), (3, SIG, "α = 3"), (10, GRN, "α = 10")):
        add = math.degrees(math.asin((a - 1) / (a + 1)))
        pmv = 180 + phP + add
        o.append(p.clip(list(zip(wg, pmv)), c=c, lw=2.2))
        k = int(_f13_np.argmin(_f13_np.abs(pmv - 50)))
        if 0 < k < len(wg) - 1:
            o.append(D(p.X(wg[k]), p.Y(50), c, 3.6))
    o.append(T(p.X(480), p.Y(50) - 6, "50°", "end", 9.5, ALI, True, halo=True))
    # (b) 高い角周波数のゲイン
    o.append(TX(380, 18, "(b) 要る高い角周波数のゲイン K_c α", "start", 11, INK, True))
    q = Plot(424, 36, 256, 220, (5, 500), (0.01, 1000), xlog=True, ylog=True)
    o.append(q.axes(xl="交差角周波数 ω_gc [rad/s]", yl="ゲイン [V/rad]", xfmt=_f13_n, yfmt=_f13_n, sz=9))
    mag = 10 ** (dbP / 20)
    for a, c in ((1, MUT), (3, SIG), (10, GRN)):
        hf = a / (math.sqrt(a) * mag)
        o.append(q.clip(list(zip(wg, hf)), c=c, lw=2.2))
    for lev, lab in ((12.0, "1 rad の段差で 12 V"), (120.0, "0.1 rad の段差で 12 V")):
        o.append(W(q.x, q.Y(lev), q.x + q.w, q.Y(lev), c=ALI, lw=1.2, dash="5 3"))
        o.append(T(q.X(6), q.Y(lev) - 5, lab, "start", 9, ALI, True, halo=True))
    for wv in (60.0, 300.0):
        v = 3 / (math.sqrt(3) * abs(_f13_jw(*_F13_PMLA, wv)))
        o.append(D(q.X(wv), q.Y(v), SIG, 3.8))
        o.append(T(q.X(wv) - 6, q.Y(v) - 6, "%s V/rad" % _f13_g(v, 3), "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(480), q.Y(0.03), "交差 2 倍でゲイン 4 倍", "end", 9.5, INK, False, halo=True))
    o.append(LEGL(64, 314, [(MUT, None, "比例だけ（α = 1）"), (SIG, None, "進み補償器 α = 3"), (GRN, None, "進み補償器 α = 10")], 9.5))
    return _f13_svg(700, 324, o, "モータの位置（L_a を含む 2×10⁶/{s(s + 20.2)(s + 1980)} rad/V）で、3 節の手順で交差角周波数を上げていったとき。(a) 比例だけで残る位相余裕に、進み補償器の最大位相進みを足した値。α を大きくすれば、位相余裕 50°（点）を保てる交差は上がる。(b) そのとき要る、制御器の高い角周波数のゲイン K_c α。20 rad/s より上では交差角周波数の 2 乗に比例して増え、α = 3 では 60 rad/s で 6.52 V/rad、300 rad/s で 156 V/rad になり、目標の小さな段差でも電圧の上限 12 V を越える。")


F["e13_wall"] = _f13_wall_fig()


def _f13_ms_fig():
    o = []
    # 台車（遅れ 0.1 s、8 N/(m/s)）と、交差 7.75 rad/s・位相余裕 60° の二次遅れの形のループ
    Lc = ([8.0], [1.0, 2.0], 0.1)
    zeta = 0.6124
    wn = 7.746 / math.sqrt(math.sqrt(1 + 4 * zeta ** 4) - 2 * zeta ** 2)
    L2 = ([wn * wn], [1.0, 2 * zeta * wn, 0.0], 0.0)
    cases = [("台車（遅れ 0.1 s）", Lc, ALI), ("二次遅れの形", L2, GRN)]
    o.append(T(14, 18, "(a) ナイキスト線図と −1 の点からの距離", "start", 11, INK, True))
    sv, p = CPLANE(46, 34, 270, 270, (-2.2, 1.0), (-2.6, 0.6), [-2, -1, 0, 1], [-2, -1, 0])
    o.append(sv)
    info = []
    for lab, (n, d, L), c in cases:
        Ms, wm = SMAX(n, d, L)
        ws = _f13_lw(0.05, 400, 3000)
        v = _f13_jw(n, d, ws, L)
        o.append(p.clip(list(zip(v.real, v.imag)), c=c, lw=2.2))
        r = 1 / Ms
        circ = [(-1 + r * math.cos(t_), r * math.sin(t_)) for t_ in _f13_np.linspace(0, 2 * math.pi, 120)]
        o.append(p.clip(circ, c=c, lw=1.2, dash="4 3"))
        pt = _f13_jw(n, d, wm, L)
        o.append(W(p.X(-1), p.Y(0), p.X(pt.real), p.Y(pt.imag), c=c, lw=1.4))
        o.append(D(p.X(pt.real), p.Y(pt.imag), c, 3.8))
        info.append((lab, c, Ms, wm, pt))
    o.append(M1(p))
    o.append(T(p.X(-0.35), p.Y(-0.9), "0.49", "middle", 9.5, ALI, True, halo=True))
    o.append(T(p.X(-1.55), p.Y(-0.62), "0.75", "middle", 9.5, GRN, True, halo=True))
    o.append(T(p.X(0.95), p.Y(-2.45), "点線の円は単位円", "end", 9, MUT, halo=True))
    # (b) |S|
    o.append(T(370, 18, "(b) 感度関数のゲイン |S(jω)|", "start", 11, INK, True))
    q = Plot(414, 34, 266, 230, (0.5, 200), (-30, 10), xlog=True)
    o.append(q.axes(xl="角周波数 ω [rad/s]", yl="ゲイン [dB]", yt=[-30, -20, -10, 0, 10], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1.1))
    o.append(W(q.X(7.746), q.y, q.X(7.746), q.y + q.h, c=FNT, lw=1, dash="2 3"))
    o.append(TX(q.X(7.746) - 4, q.y + q.h - 6, "交差 7.75（どちらも位相余裕 60°）", "end", 9, MUT, False, halo=True))
    ws = _f13_lw(0.5, 200, 800)
    for lab, (n, d, L), c in cases:
        S = 1 / _f13_np.abs(1 + _f13_jw(n, d, ws, L))
        o.append(q.clip(list(zip(ws, 20 * _f13_np.log10(S))), c=c, lw=2.2))
    for lab, c, Ms, wm, pt in info:
        o.append(D(q.X(wm), q.Y(20 * math.log10(Ms)), c, 3.8))
    o.append(TX(q.X(14.5) + 5, q.Y(20 * math.log10(2.034)) - 6, "M_s = 2.03（14.5 rad/s）", "start", 9.5, ALI, True, halo=True))
    o.append(TX(q.X(0.6), q.Y(20 * math.log10(1.342)) - 7, "M_s = 1.34", "start", 9.5, GRN, True, halo=True))
    o.append(LEGL(46, 330, [(ALI, None, "台車（8 N/(m/s)、測った速度の遅れ 0.1 s）"), (GRN, None, "二次遅れの形 ω_n^2/{s(s + 2ζω_n)}、ζ = 0.612")], 9.5))
    return _f13_svg(700, 342, o, "位相余裕が同じ 60° でも、−1 の点との距離は違う。(a) 台車（遅れ 0.1 s）の線図は、むだ時間の遅れで単位円の内側を回り込み、−1 の点に 0.49 まで近づく。交差を同じ 7.75 rad/s にした二次遅れの形のループは 0.75 までしか近づかない。破線の円は −1 を中心とする半径 1/M_s の円で、線図はその外を通る。(b) 最大感度 M_s は距離の逆数で、2.03 と 1.34。台車は 14.5 rad/s の外乱を 2 倍に大きくし、目標値のステップに 29.8 % 行き過ぎる（9 章 5 節）。")


F["e13_ms"] = _f13_ms_fig()


def _f13_waterbed_fig():
    o = []
    cases = [("0.21 V/rad", ([0.21], [1.0]), GRN), ("0.84 V/rad", ([0.84], [1.0]), SIG), ("4 V/rad", ([4.0], [1.0]), ALI),
             ("0.21 V/rad + 遅れ補償器", (_f13_pm([0.21], [1.0, 1.0]), [1.0, 0.1]), TEA)]
    o.append(TX(14, 18, "(a) ln|S(jω)| を、対数でない目盛の ω に描く（緑の面積 = 赤の面積）", "start", 11, INK, True))
    wl = _f13_np.linspace(0.02, 300, 1500)
    y0 = 34
    rows = []
    for i, (lab, (Cn, Cd), c) in enumerate(cases):
        Ln, Ld = _f13_ser((Cn, Cd), _F13_PM)
        f = lambda wv, Ln=Ln, Ld=Ld: -math.log(abs(1 + _f13_jw(Ln, Ld, wv)))
        # 0 を横切る角周波数
        vv = _f13_np.array([f(x) for x in wl])
        k = int(_f13_np.where(_f13_np.diff(_f13_np.sign(vv)) != 0)[0][0])
        wx = _f13_brentq(f, wl[k], wl[k + 1])
        neg = _f13_quad(f, 0, wx, limit=400)[0]
        pos = _f13_quad(f, wx, _f13_np.inf, limit=800)[0]
        p = Plot(84, y0 + i * 74, 330, 58, (0, 300), (-2.5, 1.3))
        last = i == len(cases) - 1
        o.append(p.axes(xl="角周波数 ω [rad/s]（対数でない目盛）" if last else None, yl=None, xt=[0, 50, 100, 150, 200, 250, 300], yt=[-2, 0, 1], xfmt=_f13_n if last else (lambda v: ""), yfmt=_f13_n, sz=8.5))
        pts_n = [(x, max(-2.5, v)) for x, v in zip(wl, vv) if x <= wx]
        pts_p = [(x, v) for x, v in zip(wl, vv) if x >= wx]
        o.append(PL([(p.X(pts_n[0][0]), p.Y(0))] + [(p.X(a), p.Y(b)) for a, b in pts_n] + [(p.X(wx), p.Y(0))], c="none", lw=0, fill=GSOFT))
        o.append(PL([(p.X(wx), p.Y(0))] + [(p.X(a), p.Y(b)) for a, b in pts_p] + [(p.X(300), p.Y(0))], c="none", lw=0, fill=ASOFT))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        o.append(p.clip([(a, b) for a, b in zip(wl, vv)], c=c, lw=1.8))
        o.append(T(p.x + p.w + 8, p.y + 14, lab, "start", 9.5, c, True))
        o.append(T(p.x + p.w + 8, p.y + 30, "緑 −%s・赤 +%s" % (_f13_f(-neg, 1), _f13_f(pos, 1)), "start", 9.5, INK))
        Ms, wm = SMAX(Ln, Ld)
        o.append(T(p.x + p.w + 8, p.y + 46, "最大感度 %s" % _f13_f(Ms, 2), "start", 9.5, MUT))
        rows.append((lab, c, Ms, wm, Ln, Ld))
    o.append(T(14, y0 + 2 * 74 + 30, "ln|S|", "start", 9.5, MUT))
    # (b) ボード線図の |S|
    o.append(T(560, 18, "(b) |S| [dB]", "start", 11, INK, True))
    q = Plot(560, 34, 120, 200, (1, 1000), (-30, 12), xlog=True)
    o.append(q.axes(xl="ω [rad/s]", yl=None, xt=[1, 10, 100, 1000], yt=[-30, -20, -10, 0, 10], xfmt=_f13_n, yfmt=_f13_n, sz=8.5))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    ws = _f13_lw(1, 1000, 500)
    for lab, c, Ms, wm, Ln, Ld in rows[:3]:
        S = 1 / _f13_np.abs(1 + _f13_jw(Ln, Ld, ws))
        o.append(q.clip(list(zip(ws, 20 * _f13_np.log10(S))), c=c, lw=1.8))
        o.append(D(q.X(wm), q.Y(20 * math.log10(Ms)), c, 3.2))
    o.append(T(q.x, q.y + q.h + 46, "点は最大感度", "start", 9, MUT))
    return _f13_svg(700, y0 + 4 * 74 + 30, o, "モータの位置の比例制御（1000/{s(s + 20)} rad/V）で、ln|S(jω)| を対数でない目盛の角周波数に描いたもの（dB の値は ln|S| の 8.69 倍）。0 より下（緑。外乱を縮める所）の面積と、0 より上（赤。外乱を大きくする所）の面積は、どの比例ゲインでも等しい（300 rad/s より先の面積も含めた値。−2.5 より下は描いていない）。比例ゲインを上げて緑を広げると、赤も同じだけ増え、最大感度が高くなる。遅れ補償器で遅い角周波数を下げた分（最下段）は、幅が狭いので面積が小さく、最大感度は 1.28 から 1.32 にしか上がらない。")


F["e13_waterbed"] = _f13_waterbed_fig()


def _f13_nmp_fig():
    o = []
    o.append(T(14, 18, "(a) ゲインを変えずに位相だけを遅らせる因数の遅れ", "start", 11, INK, True))
    p = Plot(64, 34, 270, 220, (0.03, 10), (-180, 0), xlog=True)
    o.append(p.axes(xl="ω/z（右半平面の零点）、ωL（むだ時間）", yl="位相 [°]", yt=[-180, -135, -90, -45, 0], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    x = _f13_lw(0.03, 10, 400)
    o.append(p.clip([(v, -2 * math.degrees(math.atan(v))) for v in x], c=ALI, lw=2.2))
    o.append(p.clip([(v, -math.degrees(v)) for v in x], c=PUR, lw=2.2))
    o.append(W(p.x, p.Y(-45), p.x + p.w, p.Y(-45), c=MUT, lw=1.2, dash="5 3"))
    for xv, c in ((0.4142, ALI), (0.7854, PUR)):
        o.append(D(p.X(xv), p.Y(-45), c, 3.8))
        o.append(W(p.X(xv), p.Y(-45), p.X(xv), p.y + p.h, c=c, lw=1, dash="2 3"))
    o.append(T(p.X(0.4142) - 4, p.y + p.h - 6, "0.41", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.7854) + 4, p.y + p.h - 6, "0.79", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(0.035), p.Y(-45) - 6, "位相余裕 45° に許される遅れ", "start", 9, MUT, halo=True))
    o.append(TX(p.X(0.035), p.Y(-118), "右半平面の零点: −2arctan(ω/z)", "start", 9.5, ALI, True, halo=True))
    o.append(TX(p.X(0.035), p.Y(-138), "むだ時間: −ωL [rad]", "start", 9.5, PUR, True, halo=True))
    # (b) ボイラの水位
    o.append(T(370, 18, "(b) ボイラの水位の比例制御（目標を 10 mm 上げる）", "start", 11, INK, True))
    q = Plot(414, 34, 266, 220, (0, 600), (-6, 15))
    o.append(q.axes(xl="時間 t [s]", yl="水位 [mm]", xt=[0, 100, 200, 300, 400, 500, 600], yt=[-5, 0, 5, 10, 15], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(W(q.x, q.Y(10), q.x + q.w, q.Y(10), c=MUT, lw=1.2, dash="5 3"))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    t = _f13_np.linspace(0, 600, 3001)
    labs = []
    for K, c in ((0.01, GRN), (0.02, SIG), (0.04, ALI)):
        g, _ = _f13_cl(_F13_BOIL[0], _F13_BOIL[1], [K], [1.0])
        y = 10 * _f13_step(g[0], g[1], t)
        o.append(q.clip(list(zip(t, y)), c=c, lw=2.0))
        Ln, Ld = _f13_ser(([K], [1.0]), _F13_BOIL)
        wgc, pmv, _, _ = _f13_margins(Ln, Ld, wlo=1e-5, whi=10)
        labs.append((c, None, "K_c = %s: 交差 %s rad/s・位相余裕 %s°" % (_f13_n(K), _f13_g(wgc, 3), _f13_f(pmv, 1))))
    o.append(T(q.X(15), q.Y(-4.5) + 4, "初めは逆へ下がる", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(64, 300, labs[:2], 9.5, 14))
    o.append(LEGL(64, 318, labs[2:], 9.5, 14))
    return _f13_svg(700, 330, o, "右半平面の零点とむだ時間の限り。(a) 右半平面の零点 z の因数と、むだ時間 L の因数の位相の遅れ。最小位相の部分の位相を −90° とすると、位相余裕 45° を残すには、この遅れを 45° 以内にする必要があり、交差角周波数は 0.41z・0.79/L までになる（目安）。(b) ボイラの水位（(−15s + 0.5)/{s(10s + 1)} mm/(kg/s)、z = 0.033 /s。見積もりは 0.014 rad/s）。比例ゲインを上げて交差を上げると、初めに逆へ下がる量も、行き過ぎも大きくなる。")


F["e13_nmp"] = _f13_nmp_fig()


# =====================================================================
# 6 節: 設計の例
# =====================================================================
def _f13_design_C(lz):
    a, wgc = 5.0, 60.0
    wz, wp = wgc / math.sqrt(a), wgc * math.sqrt(a)
    Kc = 1.0 / (math.sqrt(a) * abs(_f13_jw(*_F13_PM, wgc)))
    if lz is None:
        return _f13_pm([Kc], [1 / wz, 1.0]), _f13_np.array([1 / wp, 1.0]), Kc, wz, wp
    return _f13_pm(_f13_pm([Kc], [1 / wz, 1.0]), [1.0, lz]), _f13_pm([1 / wp, 1.0], [1.0, lz / 10]), Kc, wz, wp


def _f13_design_bode_fig():
    o = []
    Cn, Cd, Kc, wz, wp = _f13_design_C(1.5)
    Cn0, Cd0, _, _, _ = _f13_design_C(None)
    w = _f13_lw(0.1, 3000, 800)
    cases = [("比例 1.70 V/rad", ([Kc], [1.0]), MUT, "5 3"), ("進み補償だけ", (Cn0, Cd0), TEA, "5 3"), ("進み遅れ補償", (Cn, Cd), SIG, None)]
    curves = []
    for lab, (n_, d_), c, dash in cases:
        Ln, Ld = _f13_ser((n_, d_), _F13_PMLA)
        db, ph = BODEPH(Ln, Ld, w)
        curves.append((w, db, ph, c, dash))
    o.append(TX(14, 18, "(a) 一巡伝達関数（L_a を含む）と仕様", "start", 11, INK, True))
    svg, pm, pp, hh = BODE(64, 36, 300, curves, (0.1, 3000), (-60, 100), (-270, -90), hm=150, hp=110, gap=30,
                           dbt=[-60, -20, 0, 20, 60, 100], pht=[-270, -225, -180, -135, -90])
    o.append(svg)
    # 仕様 3: 遅い所で 500/ω より上
    o.append(pm.clip([(0.1, 20 * math.log10(5000)), (5.0, 20 * math.log10(100))], c=ALI, lw=1.6, dash="5 3"))
    o.append(T(pm.X(5.0) + 5, pm.Y(40) + 2, "500/ω より上", "start", 9, ALI, True, halo=True))
    o.append(W(pm.X(60), pm.y, pm.X(60), pp.y + pp.h, c=FNT, lw=1, dash="2 3"))
    Ln, Ld = _f13_ser((Cn, Cd), _F13_PMLA)
    wgc, pmv, wpc, gmv = _f13_margins(Ln, Ld)
    o.append(D(pm.X(wgc), pm.Y(0), SIG, 4))
    o.append(TX(pm.X(60) + 5, pm.y + 12, "仕様 1: ω_{gc} = 60", "start", 9, MUT, True, halo=True))
    o.append(ARR(pp.X(wgc), pp.Y(-180), pp.X(wgc), pp.Y(-180 + pmv), c=SIG, lw=2.0, head=6))
    o.append(T(pp.X(wgc) - 6, pp.Y(-205), "%s°（仕様 2: 50° 以上）" % _f13_f(pmv, 1), "end", 9, SIG, True, halo=True))
    # (b) 制御器
    o.append(TX(400, 18, "(b) 制御器 C(jω) と 4 つの折れ点", "start", 11, INK, True))
    dbC, phC = BODEPH(list(Cn), list(Cd), w)
    svg2, qm, qp, hh2 = BODE(440, 36, 240, [(w, dbC, phC, SIG, None)], (0.1, 3000), (0, 30), (-60, 60), hm=150, hp=110, gap=30,
                             dbt=[0, 10, 20, 30], pht=[-60, -30, 0, 30, 60])
    o.append(svg2)
    o.append(W(qm.x, qm.Y(20 * math.log10(12)), qm.x + qm.w, qm.Y(20 * math.log10(12)), c=ALI, lw=1.4, dash="5 3"))
    o.append(T(qm.x + qm.w - 2, qm.Y(20 * math.log10(12)) - 5, "仕様 4: 12 V/rad", "end", 9, ALI, True, halo=True))
    for xv, kind in ((0.15, "p"), (1.5, "z"), (wz, "z"), (wp, "p")):
        xx, yy = qm.X(xv), qm.y + qm.h - 8
        if kind == "z":
            o.append(CIRC(xx, yy, 4.2, c=SIG, lw=1.8, fill=SCR))
        else:
            o.append(W(xx - 4, yy - 4, xx + 4, yy + 4, c=SIG, lw=1.8)); o.append(W(xx - 4, yy + 4, xx + 4, yy - 4, c=SIG, lw=1.8))
    o.append(TX(qm.X(0.15), qm.y + qm.h - 18, "ω_{p1}", "middle", 9, SIG, True, halo=True))
    o.append(TX(qm.X(1.5), qm.y + qm.h - 18, "ω_{z1}", "middle", 9, SIG, True, halo=True))
    o.append(TX(qm.X(wz), qm.y + qm.h - 18, "ω_{z2}", "middle", 9, SIG, True, halo=True))
    o.append(TX(qm.X(wp), qm.y + qm.h - 18, "ω_{p2}", "middle", 9, SIG, True, halo=True))
    o.append(T(qm.X(2500), qm.Y(18.6) + 14, "8.49 V/rad", "end", 9, SIG, True, halo=True))
    o.append(LEGL(64, max(hh, hh2) + 8, [(c, dash, lab) for lab, _, c, dash in cases], 9.5))
    return _f13_svg(700, max(hh, hh2) + 18, o, "6 節の設計。(a) 一巡伝達関数（L_a を含めた対象）。比例だけで交差を 60 rad/s にすると位相余裕が足りないので、進み補償器（α = 5、ω_z2 = 26.8・ω_p2 = 134.2 rad/s）で交差の位相を進め、遅れ補償器（ω_z1 = 1.5・ω_p1 = 0.15 rad/s）で遅い角周波数のゲインを 10 倍にして、定常速度偏差の仕様の線 500/ω（赤の破線）より上を通す。交差 %s rad/s、位相余裕 %s°。(b) 制御器 C(s) = 1.70(s + 1.5)/(s + 0.15) · (1 + s/26.8)/(1 + s/134.2) V/rad。高い角周波数のゲイン 8.49 V/rad は、仕様 4 の 12 V/rad より小さい。" % (_f13_f(wgc, 1), _f13_f(pmv, 1)))


F["e13_design_bode"] = _f13_design_bode_fig()


def _f13_design_time_fig():
    o = []
    t = _f13_np.linspace(0, 0.4, 4001)
    # 10 章の PD（D は測った角度に掛ける）: G = P K_P/(1 + P(K_P + K_D s))
    gPD = (_f13_pm(_F13_PMLA[0], [0.84]), _f13_pa(_F13_PMLA[1], _f13_pm(_F13_PMLA[0], [0.02, 0.84])))
    cases = [("10 章の PD", None, MUT, "5 3"), ("進み補償だけ", _f13_design_C(None), TEA, None),
             ("進み遅れ（零点 6 rad/s）", _f13_design_C(6.0), ALI, None), ("進み遅れ（零点 1.5 rad/s）", _f13_design_C(1.5), SIG, None)]
    o.append(TX(14, 18, "(a) 目標の角度を 1 rad 変えたときの角度（L_a を含む）", "start", 11, INK, True))
    p = Plot(70, 32, 600, 150, (0, 0.4), (0, 1.3))
    o.append(RECT(p.x, p.Y(1.02), p.w, p.Y(0.98) - p.Y(1.02), 0, GSOFT, "none", 0))
    o.append(p.axes(xl=None, yl="角度 [rad]", xt=[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4], yt=[0, 0.5, 1], xfmt=lambda v: "", yfmt=_f13_n, sz=9))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=MUT, lw=1.2, dash="5 3"))
    labs = []
    for lab, C, c, dash in cases:
        if C is None:
            num, den = gPD
        else:
            (num, den), _ = _f13_cl(_F13_PMLA[0], _F13_PMLA[1], C[0], C[1])
        y = _f13_step(num, den, t)
        o.append(p.clip(list(zip(t, y)), c=c, lw=2.2 if dash is None else 1.8, dash=dash))
        tt = _f13_np.linspace(0, 3.0, 30001)
        mp, ts = _f13_metrics(tt, _f13_step(num, den, tt), 1.0)
        labs.append((c, dash, lab + ": M_p " + _f13_f(mp, 1) + " %・t_{2%} " + _f13_f(ts, 3) + " s"))
    o.append(LEGL(70, 222, labs[:2], 9.5, 16))
    o.append(LEGL(70, 240, labs[2:], 9.5, 16))
    o.append(T(p.X(0.39), p.Y(1.02) - 5, "±2 %", "end", 9, GRN, True, halo=True))
    # (b) 電圧
    o.append(T(14, 270, "(b) 電圧（進み遅れ、零点 1.5 rad/s）", "start", 11, INK, True))
    q = Plot(70, 284, 260, 110, (0, 0.2), (-13, 13))
    o.append(q.axes(xl="時間 t [s]", yl="電圧 [V]", xt=[0, 0.05, 0.1, 0.15, 0.2], yt=[-12, 0, 12], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    for lev in (12, -12):
        o.append(W(q.x, q.Y(lev), q.x + q.w, q.Y(lev), c=ALI, lw=1.2, dash="5 3"))
    Cn, Cd, Kc, wz, wp = _f13_design_C(1.5)
    R = SIMLOOP(_F13_PMLA[0], _F13_PMLA[1], list(Cn), list(Cd), 0.2, n=40000, r=1.0, every=20)
    o.append(q.clip(list(zip(R["t"], R["u"])), c=GLD, lw=2.0))
    o.append(T(q.X(0.004) + 4, q.Y(float(R["u"][0])) + 4, "8.49 V", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(0.198), q.Y(12) + 12, "電源 ±12 V", "end", 9, ALI, True, halo=True))
    # (c) ランプの偏差
    o.append(T(370, 270, "(c) 1 rad/s で回る目標への偏差", "start", 11, INK, True))
    r_ = Plot(414, 284, 266, 110, (0, 3.0), (0, 0.016))
    o.append(r_.axes(xl="時間 t [s]", yl="偏差 [rad]", xt=[0, 1, 2, 3], yt=[0, 0.002, 0.008, 0.016], xfmt=_f13_n, yfmt=_f13_n, sz=9))
    o.append(W(r_.x, r_.Y(0.002), r_.x + r_.w, r_.Y(0.002), c=ALI, lw=1.2, dash="5 3"))
    tt = _f13_np.linspace(0, 3.0, 6001)
    for lab, C, c, dash in cases[1:]:
        (gn, gd), (Sn, Sd) = _f13_cl(_F13_PMLA[0], _F13_PMLA[1], C[0], C[1])
        e = _f13_sg.lsim((Sn, Sd), U=tt, T=tt)[1]
        o.append(r_.clip(list(zip(tt, e)), c=c, lw=2.0))
    for tc, c in ((0.396, ALI), (1.680, SIG)):
        o.append(D(r_.X(tc), r_.Y(0.002), c, 3.6))
    o.append(T(r_.X(0.42) + 4, r_.Y(0.002) - 8, "0.40 s", "start", 9, ALI, True, halo=True))
    o.append(T(r_.X(1.68), r_.Y(0.002) - 8, "1.68 s", "middle", 9, SIG, True, halo=True))
    o.append(T(r_.X(2.95), r_.Y(0.0118) - 5, "進みだけ 0.0118", "end", 9, TEA, True, halo=True))
    o.append(T(r_.X(2.95), r_.Y(0.002) - 8, "仕様 3: 0.002 rad", "end", 9, ALI, True, halo=True))
    return _f13_svg(700, 434, o, "6 節の設計を時間の応答で確かめる（L_a を含めた対象）。(a) 遅れ補償器の零点を 6 rad/s（交差の 1/10）に置くと、遅い極 −6.37 の項が尾を引いて 2 % 整定時間が延びる。1.5 rad/s に下げると尾が小さくなり、10 章の PD のほぼ 2 倍の速さで落ち着く。(b) 電圧は、目標を変えた瞬間の 8.49 V が最大で、電源の 12 V に収まる。(c) ランプの目標への偏差は、遅れ補償器で 0.00118 rad まで小さくなるが、零点を下げるほど、0.002 rad を下回るまでに時間がかかる。")


F["e13_design_time"] = _f13_design_time_fig()
