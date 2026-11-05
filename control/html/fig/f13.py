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
