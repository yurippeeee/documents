# -*- coding: utf-8 -*-
# 21 章 ノイズ対策の設計 の図
# 数値は本文の検算（$SP/g21/check*.py）と同じ式で、この中で計算する（隔離ビルドでは他の章の fig は読まれないので、要る式はここに置く）。
import numpy as _f21_np

# ---- 例の値（本文・デモと同じ） ----
_F21_C = 299792458.0
_F21_L1 = 1575.42e6                     # L1 [Hz]
_F21_RC = 1.023e6                       # チップレート [Hz]
_F21_TC = 1 / _F21_RC
_F21_BW = 2.046e6                       # L1 C/A の帯域の幅 f_hi − f_lo [Hz]
_F21_KB = 1.380649e-23
_F21_N0 = 10 * math.log10(_F21_KB * 183.5) + 30      # 9 章の例の雑音の床 −175.96 dBm/Hz
_F21_CN0 = -128.5 - _F21_N0                          # 47.46 dB-Hz（20 章と同じ）
_F21_LAM = _F21_C / _F21_L1                          # 0.1903 m


def _f21_db(x):
    return 10 * math.log10(x)


def _f21_drop(r):
    """N_J/N0（真数）→ C/N0 の下がり [dB]。"""
    return 10 * math.log10(1 + r)


def _f21_m(v, d=1):
    """負の数の − を正しい記号にした数値の文字列。"""
    return ("%.*f" % (d, v)).replace("-", "−")


def _f21_pm(v, d=1):
    """符号付き（+ と −）の数値の文字列（0 には符号を付けない）。"""
    if abs(v) < 0.5 * 10 ** (-d):
        return "%.*f" % (d, 0.0)
    s = "%+.*f" % (d, v)
    return s.replace("-", "−")


def _f21_sbar(f):
    """平均の S~（2 章 4 節の形）T_c sinc²(f T_c) [1/Hz]。"""
    x = _f21_np.asarray(f, float) * _F21_TC
    return _F21_TC * _f21_np.sinc(x) ** 2


def _f21_sint(a, b, n=4001):
    """∫_a^b S~ df（a, b は L1 からの差 [Hz]）。"""
    xs = _f21_np.linspace(a, b, n)
    return float(_f21_np.trapezoid(_f21_sbar(xs), xs))


_F21_CID = [0]


def _f21_clip(x, y, w, h, body):
    """枠 (x, y, w, h) の外を切って描く（clipPath。名前は図ごとに変える）。"""
    _F21_CID[0] += 1
    cid = "f21cp%d" % _F21_CID[0]
    return ('<clipPath id="%s"><rect x="%g" y="%g" width="%g" height="%g"/></clipPath><g clip-path="url(#%s)">%s</g>'
            % (cid, x, y, w, h, cid, "".join(body) if isinstance(body, list) else body))


# =====================================================================
# 1 節: 源・経路・受け側と、各節の対策の場所
# =====================================================================
def _f21_order_fig():
    o = []
    cols = [(14, 176, "源（2 節）", ALI), (262, 196, "経路（3・4 節）", TEA), (530, 156, "受け側（5 節）", SIG)]
    for x, w, t, c in cols:
        o.append(T(x + w / 2, 20, t, "middle", 11.5, c, True))
    srcs = [("DC-DC", "スイッチング・リンギング"), ("クロック", "マイコン・カメラ・表示"), ("速い信号の線", "USB・メモリ")]
    pths = [("電源の線とグラウンド", "伝わって入る"), ("基板の上の結合", "近くの線と部品へ移る"), ("空間の電波", "アンテナで受ける")]
    rcv = [("モジュールの電源の端子", "局部発振器・A/D 変換"), ("RF の線・LNA", "帯域の中は通る"), ("アンテナ", "衛星の信号と一緒に")]
    ys = [34, 84, 134]
    for (a, b), y in zip(srcs, ys):
        o.append(BOX(14, y, 176, 40, a, b, c=ALI, sz=10.5, ssz=9, sc=MUT))
    for (a, b), y in zip(pths, ys):
        o.append(BOX(262, y, 196, 40, a, b, c=TEA, sz=10.5, ssz=9, sc=MUT))
    for (a, b), y in zip(rcv, ys):
        o.append(BOX(530, y, 156, 40, a, b, c=SIG, sz=10, ssz=9, sc=MUT))
    # 源 → 経路（どの源もどの経路も通りうる）
    o.append(W(212, ys[0] + 20, 212, ys[2] + 20, c=ALI, lw=1.4))
    for y in ys:
        o.append(W(190, y + 20, 212, y + 20, c=ALI, lw=1.4))
        o.append(ARR(212, y + 20, 260, y + 20, c=ALI, lw=1.4, head=6))
    for y in ys:
        o.append(ARR(458, y + 20, 528, y + 20, c=ALI, lw=1.4, head=6))
    # 対策
    yb = 196
    o.append(T(14, yb - 8, "対策", "start", 10.5, GRN, True))
    meas = [(14, ["周波数を選ぶ", "拡散スペクトラム（SSC）", "エッジを遅く", "電流の輪を小さく"]),
            (262, ["LC フィルタ・ビーズ（3 節）", "RF の電源を分ける（3 節）", "シールドケース（4 節）", "区分けと層（11 章 5 節）"]),
            (530, ["LNA の前のフィルタ", "アンテナを源から離す", "地板の裏に源を置く", "アンテナを機器の外へ"])]
    for x0, items in meas:
        for k, t in enumerate(items):
            s, w = CHIP(x0, yb + 12 + k * 22, t, GRN, 9.5)
            o.append(s)
    # 下: 後ろほど効率が悪い
    ya = 300
    o.append(ARR(20, ya, 676, ya, c=MUT, lw=1.6, head=8))
    o.append(T(348, ya - 8, "右へ行くほど: 効く経路が限られる・部品と場所が増える・作った後では変えにくい", "middle", 10, MUT, True, halo=True))
    o.append(T(348, ya + 18, "効果は、対策の前後の C/N0 で確かめる（6 節）", "middle", 10, INK))
    return SVG(700, ya + 26, o, "ノイズの源・経路・受け側と、この章で扱う対策の場所（源は 20 章 2 節の例）。")


F["e21_order"] = _f21_order_fig()


# =====================================================================
# 1 節: 1 つの源が 3 つの経路で届くとき — 源で抑えるか、経路を 1 つ断つか
# =====================================================================
_F21_PATHS = [("経路 1（電源の線）", 6.0), ("経路 2（基板の上）", 3.0), ("経路 3（空間）", 0.0)]   # N_J/N0 [dB]（例の値）


def _f21_paths_fig():
    o = []
    o.append(T(14, 18, "(a) 1 つの源と 3 つの経路（例の値）", "start", 11.5, INK, True))
    o.append(BOX(14, 50, 64, 150, "DC-DC", None, c=ALI, sz=11))
    o.append(BOX(246, 50, 64, 150, "受信機", None, c=SIG, sz=11))
    ys = [82, 128, 174]
    r = [10 ** (v / 10) for _, v in _F21_PATHS]
    for (nm, v), y in zip(_F21_PATHS, ys):
        o.append(ARR(78, y, 246, y, c=TEA, lw=1.8, head=7))
        o.append(T(162, y - 7, nm, "middle", 9.5, TEA, True, halo=True))
        o.append(TX(162, y + 15, "N_J/N_0 = %s dB" % _f21_pm(v), "middle", 9.5, ALI))
    tot = sum(r)
    o.append(TX(14, 226, "合計 N_J/N_0 = %s dB → C/N_0 = %.1f dB-Hz" % (_f21_pm(_f21_db(tot)), _F21_CN0 - _f21_drop(tot)), "start", 10, INK, True))
    o.append(T(14, 244, "（密度の足し算。妨害が無いと 47.5 dB-Hz）", "start", 9.5, MUT))
    # (b) 弱める量と C/N0
    o.append(TX(352, 18, "(b) 弱める量と C/N_0", "start", 11.5, INK, True))
    p = Plot(398, 40, 270, 190, (0, 40), (36, 48))
    o.append(p.axes(xl="弱める量 A [dB]", yl="C/N_0 [dB-Hz]", xt=[0, 10, 20, 30, 40], yt=[36, 38, 40, 42, 44, 46, 48],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(W(p.x, p.Y(_F21_CN0), p.x + p.w, p.Y(_F21_CN0), c=MUT, lw=1, dash="4 3"))
    xs = _f21_np.linspace(0, 40, 161)
    curves = [(None, GRN, None, "源で抑える"), (0, ALI, None, "経路 1 だけ"), (1, ALI, "6 3", "経路 2 だけ"), (2, ALI, "2 3", "経路 3 だけ")]
    ends = []
    for k, c, dash, lab in curves:
        if k is None:
            pts = [(a, _F21_CN0 - _f21_drop(tot * 10 ** (-a / 10))) for a in xs]
        else:
            pts = [(a, _F21_CN0 - _f21_drop(tot - r[k] + r[k] * 10 ** (-a / 10))) for a in xs]
        o.append(p.clip(pts, c=c, lw=2.2, dash=dash))
        ends.append((pts[-1][1], c, lab))
    o.append(T(p.x + 4, p.Y(_F21_CN0) - 5, "妨害が無いとき 47.5", "start", 9, MUT, False, halo=True))
    for k, (v, c, lab) in enumerate(ends[1:]):
        o.append(T(p.x + p.w - 4, p.Y(v) + (13 if k == 2 else -5), "%s %.1f" % (lab, v), "end", 9, c, True, halo=True))
    a20 = _F21_CN0 - _f21_drop(tot * 0.01)
    o.append(D(p.X(20), p.Y(a20), GRN, 3.8))
    o.append(T(p.X(20) + 6, p.Y(a20) + 14, "源で 20 dB: %.1f" % a20, "start", 9.5, GRN, True, halo=True))
    o.append(D(p.X(0), p.Y(_F21_CN0 - _f21_drop(tot)), INK, 3.6))
    o.append(T(p.X(0) + 6, p.Y(_F21_CN0 - _f21_drop(tot)) + 4, "%.1f" % (_F21_CN0 - _f21_drop(tot)), "start", 9.5, INK, True, halo=True))
    o.append(LEGL(352, 276, [(GRN, None, "源で抑える（全部の経路が下がる）"), (ALI, None, "経路 1 だけ")], 9.5, 12))
    o.append(LEGL(352, 292, [(ALI, "6 3", "経路 2 だけ"), (ALI, "2 3", "経路 3 だけ")], 9.5, 12))
    return SVG(700, 300, o, "経路ごとの雑音の密度（N0 に対する比）は例の値。9 章の例の受信機（妨害が無いとき C/N0 47.5 dB-Hz）。")


F["e21_paths"] = _f21_paths_fig()


# =====================================================================
# 2 節: 周波数の選び方 — 許されるずれ
# =====================================================================
def _f21_tol(f):
    """最も余裕のある場合の許されるずれ |Δf/f|（f > 帯域の幅）。"""
    return (f - _F21_BW) / (2 * _F21_L1)


def _f21_window(f0, n_lo=None):
    """周波数 f0 のまわりで、どの高調波も帯域に入らない Δf/f の範囲 [下, 上]（ppm）。"""
    lo, hi = _F21_L1 - _F21_BW / 2, _F21_L1 + _F21_BW / 2
    n = math.floor(lo / f0)          # 帯域の下の端より下の最も近い高調波
    a = (lo / n - f0) / f0 * 1e6     # n 次が帯域の下の端に届くずれ（正）
    b = (hi / (n + 1) - f0) / f0 * 1e6   # n+1 次が上の端に届くずれ（負）
    return b, a, n


def _f21_freq_fig():
    o = []
    f0 = 2.7e6
    o.append(T(14, 18, "(a) 2.7 MHz のまわりのずれと、L1 に近い高調波", "start", 11.5, INK, True))
    p = Plot(70, 40, 260, 190, (-2000, 2000), (-3, 3))
    o.append(RECT(p.x, p.Y(1.023), p.w, p.Y(-1.023) - p.Y(1.023), 0, SSOFT, "none", 0))
    wl, wh, n0 = _f21_window(f0)
    o.append(RECT(p.X(wl), p.y, p.X(wh) - p.X(wl), p.h, 0, GSOFT, "none", 0))
    o.append(p.axes(xl="周波数のずれ Δf/f [ppm]", yl="L1 からの差 [MHz]", xt=[-2000, -1000, 0, 1000, 2000], yt=[-3, -2, -1, 0, 1, 2, 3],
                    xfmt=lambda v: _f21_m(v, 0), yfmt=lambda v: _f21_m(v, 0)))
    for n in range(n0 - 2, n0 + 4):
        pts = [(d, (n * f0 * (1 + d * 1e-6) - _F21_L1) / 1e6) for d in (-2000, 2000)]
        on = n in (n0, n0 + 1)
        o.append(p.clip(pts, c=ALI if on else MUT, lw=2.0 if on else 1.2))
    o.append(T(p.X(-650) + 6, p.Y((n0 * f0 * (1 - 650e-6) - _F21_L1) / 1e6) + 4, "%d 次" % n0, "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(650) - 6, p.Y(((n0 + 1) * f0 * (1 + 650e-6) - _F21_L1) / 1e6) - 2, "%d 次" % (n0 + 1), "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(-1900), p.Y(1.023) - 4, "L1 の帯域 ±1.023 MHz", "start", 9, SIG, True, halo=True))
    # 窓と水晶
    o.append(T(p.X(0), p.Y(0) - 3, "入らない範囲", "middle", 9, GRN, True, halo=True))
    o.append(T(p.X(0), p.Y(0) + 10, "%s〜%s ppm" % (_f21_pm(wl, 0), _f21_pm(wh, 0)), "middle", 9, GRN, True, halo=True))
    o.append(W(p.X(-50), p.Y(-2.55), p.X(50), p.Y(-2.55), c=GRN, lw=5))
    o.append(T(p.X(80), p.Y(-2.55) + 4, "水晶 ±50 ppm（例）", "start", 9, GRN, True, halo=True))
    o.append(T(p.x + p.w / 2, p.y + p.h + 46, "RC の発振のばらつき ±10 %（例）は、この図の横の幅の 50 倍", "middle", 9.5, ALI, True))
    # (b) 許されるずれと周波数
    o.append(T(380, 18, "(b) 許されるずれ（最も余裕のある場合）", "start", 11.5, INK, True))
    q = Plot(430, 40, 250, 190, (1, 30), (10, 1e4), xlog=True, ylog=True)
    o.append(RECT(q.x, q.y, q.X(_F21_BW / 1e6) - q.x, q.h, 0, ASOFT, "none", 0))
    o.append(q.axes(xl="源の周波数 f [MHz]", yl="|Δf/f| [ppm]", xt=[1, 2, 5, 10, 20, 30], yt=[10, 100, 1000, 10000],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    fs = _f21_np.logspace(math.log10(2.06), math.log10(30), 200)
    o.append(q.clip([(f, _f21_tol(f * 1e6) * 1e6) for f in fs], c=SIG, lw=2.2))
    o.append(W(q.x, q.Y(50), q.x + q.w, q.Y(50), c=GRN, lw=1.2, dash="5 3"))
    o.append(T(q.x + q.w - 4, q.Y(50) + 13, "水晶 ±50 ppm（例）", "end", 9, GRN, True, halo=True))
    o.append(T(q.X(1.02), q.Y(5000), "必ず", "start", 9, ALI, True, halo=True))
    o.append(T(q.X(1.02), q.Y(5000) + 12, "入る", "start", 9, ALI, True, halo=True))
    for f, lab in ((2.7, "2.7 MHz"), (25.0, "25 MHz")):
        v = _f21_tol(f * 1e6) * 1e6
        o.append(D(q.X(f), q.Y(v), SIG, 3.8))
        txt = "%s: %d ppm" % (lab, round(v)) if v < 1000 else "%s: %.2f %%" % (lab, v / 1e4)
        o.append(T(q.X(f) + (6 if f < 10 else -6), q.Y(v) - 7, txt, "start" if f < 10 else "end", 9.5, SIG, True, halo=True))
    o.append(T(q.x + q.w / 2, q.y + q.h + 46, "±10 %（100 000 ppm）は枠の外", "middle", 9.5, ALI, True))
    return SVG(700, 290, o, "L1 C/A の帯域（幅 2.046 MHz）。(a) は 2.7 MHz の DC-DC（583 次・584 次が帯域の外）、(b) は帯域が 2 本の高調波のちょうど真ん中にある場合の上限。")


F["e21_freq"] = _f21_freq_fig()


# =====================================================================
# 2 節: 拡散スペクトラムクロック — 良くなる・悪くなる・変わらない
# =====================================================================
_F21_SSC_P = -105.0          # 受信機の入力での各高調波の電力 [dBm]（例の値）
_F21_SSC_D = 0.01            # 広げる幅 δs（全幅の割合）


def _f21_ssc_calc(fc, delta, kind="center", span=40e6):
    """(帯域に入る電力/P の前・後, N_J/P の前・後 [1/Hz], 高調波の並び [(f0, a, b, W)])。平らに広がる近似。"""
    nlo = math.floor((_F21_L1 - span) / fc); nhi = math.ceil((_F21_L1 + span) / fc)
    pin0 = nj0 = pin = nj = 0.0
    hs = []
    for n in range(max(1, nlo), nhi + 1):
        f0 = n * fc - _F21_L1
        if abs(f0) <= _F21_BW / 2:
            pin0 += 1.0
        nj0 += float(_f21_sbar(f0))
        W_ = n * fc * delta
        if delta <= 0:
            hs.append((f0, f0, f0, 0.0)); continue
        a, b = (f0 - W_, f0) if kind == "down" else (f0 - W_ / 2, f0 + W_ / 2)
        lo, hi = max(a, -_F21_BW / 2), min(b, _F21_BW / 2)
        if hi > lo:
            pin += (hi - lo) / W_
        aa, bb = max(a, -30e6), min(b, 30e6)
        if bb > aa:
            nj += _f21_sint(aa, bb) / W_
        hs.append((f0, a, b, W_))
    return pin0, pin, nj0, nj, hs


def _f21_ssc_fig():
    o = []
    rows = [(25e6, "(a) 良くなる: 25 MHz のクロック（63 次が L1 の帯域の中）", GRN),
            (32e6, "(b) 悪くなる: 32 MHz のクロック（49 次は L1 から −7.4 MHz）", ALI),
            (2e6, "(c) 良くならない: 2 MHz の DC-DC（2 MHz おきに線）", GLD)]
    a0 = 10 ** ((_F21_SSC_P - _F21_N0) / 10)
    rh = 118
    o.append(T(560, 18, "広げる前 → 後", "middle", 10.5, INK, True))
    for i, (fc, title, cc) in enumerate(rows):
        y0 = 30 + i * rh
        o.append(T(14, y0 + 4, title, "start", 11, INK, True))
        p = Plot(70, y0 + 16, 380, 66, (-20, 20), (-130, -100))
        o.append(RECT(p.X(-1.023), p.y, p.X(1.023) - p.X(-1.023), p.h, 0, SSOFT, "none", 0))
        o.append(p.axes(yl="電力 [dBm]", xt=[-20, -10, 0, 10, 20], yt=[-130, -115, -100], xfmt=(lambda v: _f21_m(v, 0)) if i == 2 else (lambda v: ""),
                        yfmt=lambda v: _f21_m(v, 0)))
        pin0, pin, nj0, nj, hs = _f21_ssc_calc(fc, _F21_SSC_D)
        # 広げた後の密度（1 MHz あたり）を細かい格子で足す
        xs = _f21_np.linspace(-20e6, 20e6, 1601)
        dens = _f21_np.zeros_like(xs)
        for f0, a, b, W_ in hs:
            if W_ > 0:
                dens += _f21_np.where((xs >= a) & (xs <= b), 1e6 / W_, 0.0)
        lv = [(x / 1e6, _F21_SSC_P + 10 * math.log10(max(d, 1e-9))) for x, d in zip(xs, dens)]
        poly = [(p.X(-20), p.y + p.h)] + [(p.X(x), p.Y(max(-130, min(-100, v)))) for x, v in lv] + [(p.X(20), p.y + p.h)]
        o.append(PL(poly, c=ALI, lw=1.4, fill=ASOFT))
        for f0, a, b, W_ in hs:
            if -20e6 <= f0 <= 20e6:
                o.append(W(p.X(f0 / 1e6), p.y + p.h, p.X(f0 / 1e6), p.Y(_F21_SSC_P), c=MUT, lw=1.6))
        # 数値
        x1 = 480
        pi0 = "−∞" if pin0 <= 0 else "%s dB" % _f21_m(_f21_db(pin0))
        pi1 = "−∞" if pin <= 0 else "%s dB" % _f21_m(_f21_db(pin))
        c0, c1 = _F21_CN0 - _f21_drop(a0 * nj0), _F21_CN0 - _f21_drop(a0 * nj)
        o.append(T(x1, y0 + 30, "帯域に入る電力: %s → %s" % (pi0, pi1), "start", 9.5, INK))
        o.append(TX(x1, y0 + 48, "N_J/N_0: %s → %s dB" % (_f21_pm(_f21_db(a0 * nj0)), _f21_pm(_f21_db(a0 * nj))), "start", 9.5, INK))
        o.append(TX(x1, y0 + 68, "C/N_0: %.1f → %.1f dB-Hz" % (c0, c1), "start", 10.5, cc, True))
    yb = 30 + 3 * rh
    o.append(T(260, yb - 4, "L1 からの差 [MHz]（縦は 1 MHz あたりの電力。灰の線は広げる前、赤は後）", "middle", 9.5, MUT))
    return SVG(700, yb + 4, o, "上下に 1 % 広げた場合（δs = 1 %、W ≈ 15.8 MHz、平らに広がる近似）。受信機の入力での各高調波の電力は −105 dBm（例の値）。青い帯は L1 C/A の帯域。")


F["e21_ssc"] = _f21_ssc_fig()


# =====================================================================
# 2 節: エッジを遅くする（直列の抵抗と入力の容量）・電流の輪を小さくする
# =====================================================================
_F21_CIN = 10e-12        # 受け側の入力の容量（例の値）
_F21_RDS = [(0, ALI, None, "0 Ω"), (33, GLD, "6 3", "33 Ω"), (100, GRN, "2 3", "100 Ω")]


def _f21_rc_wave(rd, f=25e6, A=3.3, tr=1e-9, n=4000, periods=4):
    """25 MHz・3.3 V・立ち上がり 1 ns の台形の波を RC（R_d·C_in）に通した電圧（最後の 1 周期）。"""
    T_ = 1 / f
    dt = T_ / n
    tau = rd * _F21_CIN
    v = 0.0
    out = []
    for k in range(n * periods):
        t = (k * dt) % T_
        if t < tr:
            u = A * t / tr
        elif t < T_ / 2:
            u = A
        elif t < T_ / 2 + tr:
            u = A * (1 - (t - T_ / 2) / tr)
        else:
            u = 0.0
        v = u if tau == 0 else v + (u - v) * (1 - math.exp(-dt / tau))
        if k >= n * (periods - 1):
            out.append((t * 1e9, v))
    return out


def _f21_edge_fig():
    o = []
    o.append(T(14, 18, "(a) 受け側の入力の電圧（25 MHz のクロック）", "start", 11.5, INK, True))
    p = Plot(60, 40, 250, 130, (0, 40), (-0.3, 3.8))
    o.append(p.axes(xl="時間 t [ns]", yl="電圧 [V]", xt=[0, 10, 20, 30, 40], yt=[0, 1, 2, 3], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    for rd, c, dash, lab in _F21_RDS:
        w = _f21_rc_wave(rd)
        o.append(p.line(w[::10], c=c, lw=2, dash=dash))
    o.append(LEGL(60, 222, [(c, dash, "R_d = " + lab) for rd, c, dash, lab in _F21_RDS], 9.5, 10))
    # 回路の小さな図
    o.append(T(330, 18, "直列の抵抗と入力の容量", "start", 10, MUT, True))
    o.append(BOX(330, 28, 46, 24, "出力", None, c=ALI, sz=9.5))
    o.append(W(376, 40, 392, 40, c=INK, lw=1.4))
    o.append(RECT(392, 34, 26, 12, 2, PAN, INK, 1.3))
    o.append(TX(405, 62, "R_d", "middle", 9.5, INK))
    o.append(W(418, 40, 460, 40, c=INK, lw=1.4))
    o.append(W(446, 40, 446, 52, c=INK, lw=1.4))
    o.append(W(438, 52, 454, 52, c=INK, lw=2)); o.append(W(438, 57, 454, 57, c=INK, lw=2))
    o.append(W(446, 57, 446, 64, c=INK, lw=1.4)); o.append(W(440, 64, 452, 64, c=MUT, lw=1.4))
    o.append(TX(460, 62, "C_in", "start", 9.5, INK))
    o.append(BOX(460, 28, 46, 24, "入力", None, c=SIG, sz=9.5))
    # (b) L1 の成分の下がり
    o.append(T(380, 98, "(b) L1 の高さの成分の下がり", "start", 11.5, INK, True))
    q = Plot(430, 118, 250, 100, (0, 150), (-25, 0))
    o.append(q.axes(xl="直列の抵抗 R_d [Ω]", yl="変化 [dB]", xt=[0, 50, 100, 150], yt=[-25, -20, -15, -10, -5, 0],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: _f21_m(v, 0)))
    rs = _f21_np.linspace(0, 150, 151)
    o.append(q.clip([(r, -10 * math.log10(1 + (2 * math.pi * _F21_L1 * r * _F21_CIN) ** 2)) for r in rs], c=GRN, lw=2.2))
    for r in (22, 33, 100):
        v = -10 * math.log10(1 + (2 * math.pi * _F21_L1 * r * _F21_CIN) ** 2)
        o.append(D(q.X(r), q.Y(v), GRN, 3.6))
        o.append(T(q.X(r) + 5, q.Y(v) - 5, "%s dB（%d Ω）" % (_f21_m(v), r), "start", 9, GRN, True, halo=True))
    # (c) 電流の輪
    yc = 262
    o.append(T(14, yc, "(c) DC-DC の入力の電流の輪（上から見た配置の例）", "start", 11.5, INK, True))
    for k, (x0, cx, area, lab, cc) in enumerate(((30, 158, 0.48, "悪い例: コンデンサが離れている", ALI), (380, 470, 0.12, "良い例: コンデンサを端子のすぐ横に", GRN))):
        y0 = yc + 18
        o.append(T(x0, y0 + 6, lab, "start", 10, cc, True))
        # IC と入力のコンデンサ
        o.append(BOX(x0 + 6, y0 + 22, 70, 50, "DC-DC", "の IC", c=MUT, sz=9.5, ssz=9))
        o.append(RECT(cx, y0 + 30, 22, 34, 3, PAN, SIG, 1.4))
        o.append(T(cx + 11, y0 + 84, "入力の C", "middle", 9, SIG))
        # 輪
        x_ic = x0 + 76
        poly = [(x_ic, y0 + 34), (cx, y0 + 34), (cx, y0 + 60), (x_ic, y0 + 60)]
        o.append(PL(poly + [poly[0]], c=cc, lw=1.6, fill=soft(cc), op=0.6))
        o.append(ARR(x_ic + 4, y0 + 34, (x_ic + cx) / 2 + 6, y0 + 34, c=cc, lw=1.6, head=6))
        o.append(T((x_ic + cx) / 2 + 30 if k == 0 else cx + 30, y0 + 52, "面積 %.2f cm²（例）" % area, "start", 9.5, cc, True, halo=True))
    o.append(T(350, yc + 116, "面積が 1/4 になると、近くの線や部品に移る成分は 20 log10 4 = 12 dB 下がる", "middle", 10, INK))
    return SVG(700, yc + 126, o, "(a)(b) 立ち上がり 1 ns の出力に直列の抵抗を入れ、受け側の入力の容量を 10 pF（例の値）とした RC のモデル（線は短いとした）。(c) の面積は例の値。")


F["e21_edge"] = _f21_edge_fig()


# =====================================================================
# 3 節: 電源のフィルタ（傾向のモデル: 部品の寄生成分は例の値）と 10 章 2 節の例のモデル
# =====================================================================
_F21_LP, _F21_CP = 2.2e-6, 10e-6          # LC フィルタの例の値
_F21_RDAMP = 0.4                          # ダンピングの抵抗（例の値）


def _f21_zind(f, L=_F21_LP, rdc=0.1, cpar=3.2e-12, rpar=4e3):
    """コイル（巻線の抵抗 0.1 Ω、巻線の間の容量で 60 MHz で共振。例の値）。"""
    w = 2 * math.pi * _f21_np.asarray(f, float)
    return 1 / (1 / (rdc + 1j * w * L) + 1j * w * cpar + 1 / rpar)


def _f21_zbead(f, L0=1.5e-6, fr=60e6, rdc=0.1, cpar=0.25e-12):
    """フェライトビーズ（傾向のモデル: jωL0/(1 + j f/fr) に、直流の抵抗と並列の容量。例の値）。"""
    f = _f21_np.asarray(f, float)
    w = 2 * math.pi * f
    zf = 1j * w * L0 / (1 + 1j * f / fr)
    return rdc + 1 / (1 / zf + 1j * w * cpar)


def _f21_zcap(f, C=_F21_CP, esr=0.005, esl=0.5e-9):
    """コンデンサ（ESR 5 mΩ・ESL 0.5 nH。例の値）。"""
    w = 2 * math.pi * _f21_np.asarray(f, float)
    return esr + 1j * w * esl + 1 / (1j * w * C)


def _f21_hfilt(f, kind, L=_F21_LP, C=_F21_CP, rd=_F21_RDAMP):
    """フィルタの電圧の比 H（kind: "lc"・"bead"・"both"。後ろの LDO の入力は電流を流さないとした）。"""
    zs = rd + 0j * _f21_np.asarray(f, float)
    if kind in ("lc", "both"):
        zs = zs + _f21_zind(f, L)
    if kind in ("bead", "both"):
        zs = zs + _f21_zbead(f)
    zc = _f21_zcap(f, C)
    return zc / (zs + zc)


# 10 章 2 節の例のモデル（f10.py と同じ値）: PSRR = 20 log10 |1 + A0/(1 + j f/fp)|
_F21_EXT, _F21_INT = (60.0, 10e3), (40.0, 20e3)
_F21_CN0_10 = 47.5                         # 10 章のモデルの基準（電源の雑音が無いとき）


def _f21_psrr(f, a0db, fp):
    a0 = 10 ** (a0db / 20.0)
    return 20 * math.log10(abs(1 + a0 / (1 + 1j * f / fp)))


def _f21_ripple(vr=20.0, f=2e6, af=0.0, ldo=True):
    """揺れ vr [mVpp]・周波数 f・フィルタの減衰 af [dB] → (RF の段の揺れ [mVpp], N_p/N0, C/N0)。1 mVpp で N_p = N0（10 章の例のモデル）。"""
    att = _f21_psrr(f, *_F21_INT) + (_f21_psrr(f, *_F21_EXT) if ldo else 0.0) + af
    v = vr * 10 ** (-att / 20.0)
    q = v * v
    return v, q, _F21_CN0_10 - _f21_drop(q)


_F21_Q0 = _f21_ripple()[1]                 # 7.60


def _f21_lc_ideal(f, L, C, R):
    x = f / (1 / (2 * math.pi * math.sqrt(L * C)))
    Q = math.sqrt(L / C) / R
    return 1 / (1 - x * x + 1j * x / Q)


def _f21_lc_fig():
    o = []
    o.append(T(14, 18, "(a) 電源の LC フィルタ", "start", 11.5, INK, True))
    y = 92
    o.append(BOX(14, y - 18, 62, 36, "DC-DC", None, c=ALI, sz=10))
    o.append(W(76, y, 92, y, c=INK, lw=1.4))
    o.append(RECT(92, y - 6, 22, 12, 2, PAN, INK, 1.3))
    o.append(TX(103, y - 12, "R_p", "middle", 9.5, INK))
    o.append(W(114, y, 120, y, c=INK, lw=1.4))
    for k in range(4):
        o.append(PATH("M %g %g a 5 5 0 0 1 10 0" % (120 + k * 10, y), c=INK, lw=1.4))
    o.append(TX(140, y - 12, "L_p", "middle", 9.5, INK))
    o.append(W(160, y, 214, y, c=INK, lw=1.4))
    o.append(D(184, y, INK, 2.6))
    o.append(W(184, y, 184, y + 16, c=INK, lw=1.4))
    o.append(W(175, y + 16, 193, y + 16, c=INK, lw=2)); o.append(W(175, y + 22, 193, y + 22, c=INK, lw=2))
    o.append(W(184, y + 22, 184, y + 34, c=INK, lw=1.4)); o.append(W(177, y + 34, 191, y + 34, c=MUT, lw=1.4))
    o.append(TX(198, y + 24, "C_p", "start", 9.5, INK))
    o.append(BOX(214, y - 18, 46, 36, "LDO", None, c=PUR, sz=10))
    o.append(ARR(260, y, 280, y, c=INK, lw=1.4, head=6))
    o.append(T(284, y + 4, "モジュール", "start", 9.5, SIG, True))
    o.append(TX(14, y + 64, "例の値: L_p = 2.2 µH、C_p = 10 µF", "start", 9.5, MUT))
    o.append(TX(14, y + 80, "f_{LC} = 1/(2π√(L_p C_p)) = 34 kHz", "start", 9.5, MUT))
    o.append(TX(14, y + 96, "Q = √(L_p/C_p)/R_p", "start", 9.5, MUT))
    # (b) |H|
    o.append(T(372, 18, "(b) 電圧の比 |H| の周波数特性", "start", 11.5, INK, True))
    p = Plot(420, 40, 262, 180, (1e3, 1e7), (-80, 20), xlog=True)
    o.append(p.axes(xl="周波数 f [Hz]", yl="|H| [dB]", xt=[1e3, 1e4, 1e5, 1e6, 1e7], yt=[-80, -60, -40, -20, 0, 20],
                    xfmt=lambda v: {1e3: "1 k", 1e4: "10 k", 1e5: "100 k", 1e6: "1 M", 1e7: "10 M"}[v], yfmt=lambda v: _f21_m(v, 0)))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    fs = _f21_np.logspace(3, 7, 400)
    fLC = 1 / (2 * math.pi * math.sqrt(_F21_LP * _F21_CP))
    for R, c, dash in ((0.105, ALI, None), (0.505, GRN, "6 3")):
        o.append(p.clip([(f, 20 * math.log10(abs(_f21_lc_ideal(f, _F21_LP, _F21_CP, R)))) for f in fs], c=c, lw=2.2, dash=dash))
    o.append(W(p.X(fLC), p.y, p.X(fLC), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(TX(p.X(fLC) + 4, p.y + 12, "f_{LC} = 34 kHz", "start", 9, MUT, False, halo=True))
    pk = 20 * math.log10(abs(_f21_lc_ideal(fLC, _F21_LP, _F21_CP, 0.105)))
    o.append(T(p.X(fLC) - 4, p.Y(pk) - 2, "+%.1f dB" % pk, "end", 9.5, ALI, True, halo=True))
    # 40 dB/dec の目安
    o.append(T(p.X(3e5) + 4, p.Y(-38), "−40 dB/dec", "start", 9.5, INK, False, halo=True))
    v2 = 20 * math.log10(abs(_f21_lc_ideal(2e6, _F21_LP, _F21_CP, 0.505)))
    o.append(W(p.X(2e6), p.y, p.X(2e6), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(2e6), p.y - 4, "2 MHz", "middle", 9, MUT, True))
    o.append(D(p.X(2e6), p.Y(v2), GRN, 3.6))
    o.append(T(p.X(2e6) - 5, p.Y(v2) + 14, "%s dB" % _f21_m(v2), "end", 9.5, GRN, True, halo=True))
    o.append(W(p.X(5e5), p.Y(-18), p.x + p.w, p.Y(-18), c=GLD, lw=1.4, dash="5 3"))
    o.append(T(p.X(5e5) - 3, p.Y(-18) + 4, "要る 18 dB", "end", 9, GLD, True, halo=True))
    o.append(LEGL(372, 270, [(ALI, None, "R_p = 0.1 Ω（Q = 4.5）"), (GRN, "6 3", "R_p = 0.5 Ω（Q = 0.9）")], 9.5, 12))
    return SVG(700, 280, o, "コイル・コンデンサは理想のものとした式。要る 18 dB は 10 章 2 節の例で C/N0 の下がりを 0.5 dB 以内にする減衰（次の導出）。")


F["e21_lc"] = _f21_lc_fig()


def _f21_ripple_fig():
    o = []
    o.append(TX(14, 18, "(a) 2 MHz での減衰 A_F と C/N_0（10 章 2 節の例: 20 mVpp・LDO あり）", "start", 11.5, INK, True))
    p = Plot(70, 40, 380, 190, (0, 40), (36, 48))
    o.append(p.axes(xl="フィルタの減衰 A_F [dB]（2 MHz）", yl="C/N_0 [dB-Hz]", xt=[0, 10, 20, 30, 40], yt=[36, 38, 40, 42, 44, 46, 48],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(W(p.x, p.Y(_F21_CN0_10), p.x + p.w, p.Y(_F21_CN0_10), c=GRN, lw=1.1, dash="5 3"))
    o.append(T(p.x + p.w - 4, p.Y(_F21_CN0_10) - 5, "揺れが無いとき 47.5", "end", 9, GRN, True, halo=True))
    o.append(W(p.x, p.Y(_F21_CN0_10 - 0.5), p.x + p.w, p.Y(_F21_CN0_10 - 0.5), c=MUT, lw=1, dash="2 3"))
    xs = _f21_np.linspace(0, 40, 201)
    o.append(p.clip([(a, _F21_CN0_10 - _f21_drop(_F21_Q0 * 10 ** (-a / 10))) for a in xs], c=SIG, lw=2.4))
    # 傾き 1 の目安（q0 10^{-A/10} ≫ 1 のとき）
    o.append(p.clip([(a, _F21_CN0_10 - _f21_db(_F21_Q0) + a) for a in (0, 12)], c=FNT, lw=1.2, dash="4 3"))
    o.append(T(p.X(3.2), p.Y(43.2), "1 dB 減らすと約 1 dB 戻る", "start", 9, MUT, False, halo=True))
    need = _f21_db(_F21_Q0) - _f21_db(10 ** 0.05 - 1)
    for a in (0.0, 10.0, need):
        v = _F21_CN0_10 - _f21_drop(_F21_Q0 * 10 ** (-a / 10))
        o.append(D(p.X(a), p.Y(v), SIG, 3.8))
        lab = "%.1f" % v if a != need else "%.1f dB で %.1f" % (a, v)
        o.append(T(p.X(a) + 6, p.Y(v) + (14 if a == 0 else 15), lab, "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(32), p.Y(46.4), "頭打ち", "middle", 9.5, MUT, True, halo=True))
    # (b) 鎖の値
    o.append(T(486, 56, "(b) 減衰の前と後（例のモデル）", "start", 11, INK, True))
    rows = [("", "A_F = 0", "A_F = %.1f dB" % need)]
    v0, q0, c0 = _f21_ripple(af=0.0)
    v1, q1, c1 = _f21_ripple(af=need)
    rows += [("RF の段の揺れ", "%.2f mVpp" % v0, "%.2f mVpp" % v1), ("N_p/N_0", "%.2f" % q0, "%.2f" % q1), ("C/N_0", "%.1f dB-Hz" % c0, "%.1f dB-Hz" % c1)]
    for k, (a, b, c) in enumerate(rows):
        yy = 80 + k * 26
        o.append(TX(486, yy, a, "start", 9.5, INK, k > 0))
        o.append(TX(600, yy, b, "middle", 9.5, ALI if k else MUT, k > 0))
        o.append(TX(664, yy, c, "middle", 9.5, GRN if k else MUT, k > 0))
    o.append(TX(486, 200, "1 mVpp で N_p = N_0 とした", "start", 9, MUT))
    o.append(T(486, 214, "10 章 2 節の例のモデル", "start", 9, MUT))
    return SVG(700, 270, o, "10 章 2 節の例のモデル（2 MHz・20 mVpp・外付けの LDO あり、フィルタが無いとき q0 = 7.60）。")


F["e21_ripple"] = _f21_ripple_fig()


def _f21_bead_fig():
    o = []
    o.append(T(14, 18, "(a) フェライトビーズのインピーダンス（傾向のモデル）", "start", 11.5, INK, True))
    p = Plot(66, 40, 250, 190, (1e6, 3e9), (-300, 600), xlog=True)
    o.append(p.axes(xl="周波数 f [Hz]", yl="[Ω]", xt=[1e6, 1e7, 1e8, 1e9], yt=[-300, -150, 0, 150, 300, 450, 600],
                    xfmt=lambda v: {1e6: "1 M", 1e7: "10 M", 1e8: "100 M", 1e9: "1 G"}[v], yfmt=lambda v: _f21_m(v, 0)))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    fs = _f21_np.logspace(6, math.log10(3e9), 300)
    z = _f21_zbead(fs)
    o.append(p.clip(list(zip(fs, _f21_np.abs(z))), c=INK, lw=1.4, dash="2 3"))
    o.append(p.clip(list(zip(fs, z.real)), c=ALI, lw=2.4))
    o.append(p.clip(list(zip(fs, z.imag)), c=SIG, lw=2.0, dash="6 3"))
    o.append(T(p.X(1.2e6), p.Y(330), "コイルとして働く", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(3e8), p.Y(230), "抵抗として働く", "middle", 9.5, ALI, True, halo=True))
    for f, lab in ((2e6, "2 MHz"), (100e6, "100 MHz"), (_F21_L1, "L1")):
        zz = complex(_f21_zbead(f))
        o.append(D(p.X(f), p.Y(abs(zz)), INK, 3.4))
        o.append(T(p.X(f) + (5 if f < 1e9 else -5), p.Y(abs(zz)) - 7, "%s: %d Ω" % (lab, round(abs(zz))), "start" if f < 1e9 else "end", 9, INK, True, halo=True))
    o.append(LEGL(14, 290, [(ALI, None, "抵抗の成分 R_b"), (SIG, "6 3", "リアクタンス X_b"), (INK, "2 3", "|Z_b|")], 9.5, 10))
    # (b) フィルタの減衰
    o.append(T(366, 18, "(b) フィルタの減衰（後ろに 10 µF）", "start", 11.5, INK, True))
    q = Plot(414, 40, 268, 190, (1e4, 3e9), (-10, 100), xlog=True)
    o.append(q.axes(xl="周波数 f [Hz]", yl="減衰 [dB]", xt=[1e4, 1e5, 1e6, 1e7, 1e8, 1e9], yt=[0, 20, 40, 60, 80, 100],
                    xfmt=lambda v: {1e4: "10 k", 1e5: "100 k", 1e6: "1 M", 1e7: "10 M", 1e8: "100 M", 1e9: "1 G"}[v], yfmt=lambda v: "%d" % v))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    fs2 = _f21_np.logspace(4, math.log10(3e9), 500)
    kinds = [("lc", SIG, None, "コイル 2.2 µH"), ("bead", PUR, "6 3", "ビーズ"), ("both", GRN, "2 3", "コイル + ビーズ")]
    for kind, c, dash, lab in kinds:
        a = -20 * _f21_np.log10(_f21_np.abs(_f21_hfilt(fs2, kind)))
        o.append(q.clip(list(zip(fs2, a)), c=c, lw=2.2, dash=dash))
    for f, lab in ((2e6, "2 MHz"), (_F21_L1, "L1")):
        o.append(W(q.X(f), q.y, q.X(f), q.y + q.h, c=FNT, lw=1, dash="3 3"))
        o.append(T(q.X(f), q.y - 4, lab, "middle", 9, MUT, True))
    for k, (kind, c, dash, lab) in enumerate(kinds):
        a2 = float(-20 * math.log10(abs(complex(_f21_hfilt(2e6, kind)))))
        aL = float(-20 * math.log10(abs(complex(_f21_hfilt(1576e6, kind)))))
        o.append(T(q.X(2e6) - 4, q.Y(a2) + {0: 3, 1: 14, 2: -6}[k], "%.0f" % a2, "end", 9, c, True, halo=True))
        o.append(T(q.X(_F21_L1) - 5, q.Y(aL) + {0: 14, 1: 14, 2: -6}[k], "%.0f" % aL, "end", 9, c, True, halo=True))
    o.append(LEGL(366, 290, [(c, dash, lab) for kind, c, dash, lab in kinds], 9.5, 10))
    return SVG(700, 300, o, "傾向のモデル（例の値: ビーズは 1.5 µH・60 MHz で抵抗に変わる形、コイルは 60 MHz で自己共振、コンデンサは ESL 0.5 nH、ダンピング 0.4 Ω）。基板の上の結合は入れていない。")


F["e21_bead"] = _f21_bead_fig()


def _f21_rails_fig():
    o = []
    for k, (x0, title, cc) in enumerate(((14, "(a) 悪い例: 1 つの LDO を分け合う", ALI), (366, "(b) 良い例: RF の電源を分ける", GRN))):
        o.append(T(x0, 18, title, "start", 11.5, cc, True))
        o.append(BOX(x0, 40, 64, 36, "DC-DC", None, c=MUT, sz=10))
    # (a)
    x0 = 14
    o.append(ARR(78, 58, 100, 58, c=INK, lw=1.4, head=6))
    o.append(BOX(100, 40, 70, 36, "LDO", "（共通）", c=PUR, sz=10, ssz=9, sc=PUR))
    o.append(W(170, 58, 196, 58, c=INK, lw=1.6))
    o.append(W(196, 58, 196, 186, c=INK, lw=1.6))
    loads = [("マイコン", ALI, 100), ("カメラ", ALI, 140), ("モジュール・LNA", SIG, 180)]
    for nm, c, y in loads:
        o.append(ARR(196, y, 222, y, c=INK, lw=1.4, head=6))
        o.append(BOX(222, y - 16, 112, 32, nm, None, c=c, sz=9.5))
    for y in (100, 140):
        o.append(CARR(222, y + 8, 200, 74, bend=-0.3, c=ALI, lw=1.4, head=6, dash="4 3"))
    o.append(PATH(_f21_wavy(197, 214, 172, amp=3, per=6), c=ALI, lw=1.6))
    o.append(T(14, 214, "電流の揺れが、共通の出力と配線の", "start", 9.5, ALI, True))
    o.append(T(14, 228, "インピーダンスで電圧の揺れになり、", "start", 9.5, ALI, True))
    o.append(T(14, 242, "そのまま RF の電源に乗る", "start", 9.5, ALI, True))
    # (b)
    x0 = 366
    o.append(W(430, 58, 450, 58, c=INK, lw=1.6))
    o.append(W(450, 58, 450, 150, c=INK, lw=1.6))
    o.append(ARR(450, 58, 470, 58, c=INK, lw=1.4, head=6))
    o.append(BOX(470, 40, 80, 36, "LC・ビーズ", None, c=GRN, sz=9.5))
    o.append(ARR(550, 58, 566, 58, c=INK, lw=1.4, head=6))
    o.append(BOX(566, 40, 56, 36, "LDO", "（RF）", c=PUR, sz=10, ssz=9, sc=PUR))
    o.append(ARR(622, 58, 630, 58, c=INK, lw=1.4, head=5))
    o.append(BOX(630, 36, 64, 44, "モジュール", "と LNA", c=SIG, sz=9.5, ssz=9, sc=SIG))
    o.append(ARR(450, 150, 470, 150, c=INK, lw=1.4, head=6))
    o.append(BOX(470, 132, 80, 36, "LDO", "（ディジタル）", c=PUR, sz=10, ssz=9, sc=PUR))
    o.append(ARR(550, 150, 566, 150, c=INK, lw=1.4, head=6))
    o.append(BOX(566, 132, 124, 36, "マイコン・カメラ", None, c=ALI, sz=9.5))
    o.append(CARR(600, 168, 520, 168, bend=-0.35, c=ALI, lw=1.4, head=6, dash="4 3"))
    o.append(T(560, 206, "揺れはディジタルの側で閉じる", "middle", 9.5, ALI, True))
    o.append(T(366, 228, "分かれ目は DC-DC の出力（大きなコンデンサ）。RF に届くのは、", "start", 9.5, GRN, True))
    o.append(T(366, 242, "フィルタと RF の LDO の PSRR を通った分だけ", "start", 9.5, GRN, True))
    return SVG(700, 252, o, "電源の分け方の 2 通り（構成は例）。点線の矢印は、ディジタルの回路の電流の揺れが戻る道。")


def _f21_wavy(x1, x2, y, amp=4, per=10):
    d = "M %g %g" % (x1, y)
    n = max(2, int((x2 - x1) / per * 8))
    for i in range(1, n + 1):
        x = x1 + (x2 - x1) * i / n
        d += " L %g %g" % (x, y + amp * math.sin(2 * math.pi * (x - x1) / per))
    return d


F["e21_rails"] = _f21_rails_fig()


# =====================================================================
# 4 節: 隙間の漏れ（目安の式 SE ≈ 20 log10(λ/(2ℓ))）
# =====================================================================
def _f21_se(l, f=_F21_L1):
    v = _F21_C / f / (2 * l)
    return 20 * math.log10(v) if v > 1 else 0.0


def _f21_slot_fig():
    o = []
    o.append(T(14, 18, "(a) 隙間の長さと SE（L1・L5）", "start", 11.5, INK, True))
    p = Plot(66, 40, 260, 190, (1, 200), (0, 45), xlog=True)
    o.append(p.axes(xl="隙間の長さ ℓ [mm]", yl="SE [dB]", xt=[1, 2, 5, 10, 20, 50, 100, 200], yt=[0, 10, 20, 30, 40],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    ls = _f21_np.logspace(0, math.log10(200), 300)
    o.append(p.clip([(l, _f21_se(l / 1000)) for l in ls], c=SIG, lw=2.4))
    o.append(p.clip([(l, _f21_se(l / 1000, 1176.45e6)) for l in ls], c=TEA, lw=1.8, dash="6 3"))
    l20 = _F21_LAM / 20 * 1000; l2 = _F21_LAM / 2 * 1000
    for l, lab in ((l20, "λ/20 = %.1f mm" % l20), (l2, "λ/2 = %.0f mm" % l2)):
        o.append(W(p.X(l), p.y, p.X(l), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(l20) + 4, p.y + 12, "λ/20 = %.1f mm" % l20, "start", 9, MUT, True, halo=True))
    o.append(T(p.X(l2) - 4, p.Y(5), "λ/2 = %.0f mm" % l2, "end", 9, MUT, True, halo=True))
    for l in (3, 10, 30):
        v = _f21_se(l / 1000)
        o.append(D(p.X(l), p.Y(v), SIG, 3.6))
        o.append(T(p.X(l) + 5, p.Y(v) - 6, "%.1f dB" % v, "start", 9.5, SIG, True, halo=True))
    o.append(LEGL(14, 290, [(SIG, None, "L1（λ = 19.0 cm）"), (TEA, "6 3", "L5（λ = 25.5 cm）")], 9.5, 12))
    # (b) 周波数
    o.append(T(370, 18, "(b) 長さを決めたときの SE と周波数", "start", 11.5, INK, True))
    q = Plot(420, 40, 262, 190, (0.3, 6), (0, 45), xlog=True)
    o.append(RECT(q.X(1.164), q.y, q.X(1.610) - q.X(1.164), q.h, 0, SSOFT, "none", 0))
    o.append(q.axes(xl="周波数 f [GHz]", yl="SE [dB]", xt=[0.3, 0.5, 1, 2, 3, 6], yt=[0, 10, 20, 30, 40],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%d" % v))
    o.append(T(q.X(1.37), q.y + 12, "GNSS", "middle", 9, SIG, True, halo=True))
    fs = _f21_np.logspace(math.log10(0.3), math.log10(6), 300)
    cases = [(10, GRN, None), (30, GLD, "6 3"), (95, ALI, "2 3")]
    for l, c, dash in cases:
        o.append(q.clip([(f, _f21_se(l / 1000, f * 1e9)) for f in fs], c=c, lw=2.2, dash=dash))
        fr = _F21_C / (2 * l / 1000) / 1e9
        if fr < 6:
            o.append(D(q.X(fr), q.Y(0), c, 3.6))
            o.append(T(q.X(fr), q.Y(0) - 8, "%.2f GHz" % fr, "middle", 9, c, True, halo=True))
    o.append(T(q.X(5.8), q.Y(_f21_se(0.010, 5.8e9)) - 6, "10 mm", "end", 9, GRN, True, halo=True))
    o.append(LEGL(370, 290, [(GRN, None, "ℓ = 10 mm"), (GLD, "6 3", "30 mm"), (ALI, "2 3", "95 mm")], 9.5, 12))
    return SVG(700, 300, o, "目安の式（隙間 1 つ。0 dB は、隙間が半波長で共振して、ほとんど遮らないことを表す）。青い帯は GNSS の周波数帯（1164〜1610 MHz）。")


F["e21_slot"] = _f21_slot_fig()


def _f21_can_fig():
    o = []
    o.append(T(14, 18, "(a) 上から見たシールドケース（構成は例）", "start", 11.5, INK, True))
    # 基板の上の枠 48 × 30 mm（1 mm = 5 px）
    X0, Y0, S = 44, 58, 5.0
    w, h = 48 * S, 30 * S
    o.append(RECT(X0 - 16, Y0 - 14, w + 32, h + 28, 4, GRD, LIN, 0.8))
    o.append(RECT(X0, Y0, w, h, 2, "none", MUT, 3.0))
    for k in range(int(w / 20) + 1):                       # 枠の下の銅の帯のビア（外側に描く）
        o.append(CIRC(X0 + k * 20, Y0 - 8, 2.0, c=MUT, lw=1))
    for k in range(int(48 / 3) + 1):                       # 上の辺: 3 mm おきの接点
        o.append(D(X0 + k * 3 * S, Y0, GRN, 2.6))
    for k in range(int(30 / 3) + 1):                       # 左の辺: 3 mm おき
        o.append(D(X0, Y0 + k * 3 * S, GRN, 2.6))
    for xm in (0, 24, 48):                                 # 下の辺: 24 mm おき（悪い例）
        o.append(D(X0 + xm * S, Y0 + h, ALI, 3.2))
    o.append(T(X0 + w / 2, Y0 - 18, "上と左の辺: 3 mm おきにつなぐ", "middle", 9.5, GRN, True, halo=True))
    o.append(DIM(X0 + 3, Y0 + h + 16, X0 + 24 * S - 3, Y0 + h + 16, "下の辺: 24 mm おき", c=ALI, tc=ALI, sz=9, above=False))
    # 中の部品と RF の線（右の切り欠きから入り、LNA → SAW → モジュール）
    o.append(BOX(X0 + 170, Y0 + 18, 50, 26, "LNA", None, c=SIG, sz=9))
    o.append(BOX(X0 + 100, Y0 + 18, 50, 26, "SAW", None, c=SIG, sz=9))
    o.append(BOX(X0 + 20, Y0 + 70, 90, 28, "モジュール", None, c=SIG, sz=9))
    o.append(W(X0 + w + 22, Y0 + 31, X0 + 220, Y0 + 31, c=SIG, lw=2.2))
    o.append(W(X0 + 170, Y0 + 31, X0 + 150, Y0 + 31, c=SIG, lw=2.2))
    o.append(W(X0 + 100, Y0 + 31, X0 + 65, Y0 + 31, X0 + 65, Y0 + 70, c=SIG, lw=2.2))
    o.append(RECT(X0 + w - 2, Y0 + 25, 6, 12, 1, SCR, "none", 0))
    o.append(T(X0 + w + 4, Y0 + 52, "切り欠き 2 mm", "start", 9, SIG, True, halo=True))
    # 電源の線（左の壁の所にフィルタ）
    o.append(W(X0 - 34, Y0 + 120, X0 + 30, Y0 + 120, c=PUR, lw=1.8))
    o.append(RECT(X0 - 7, Y0 + 114, 14, 12, 2, PSOFT, PUR, 1.2))
    o.append(T(X0 + 14, Y0 + 113, "壁の所でビーズ + C", "start", 9, PUR, True, halo=True))
    o.append(T(X0 - 30, Y0 + 112, "電源", "start", 9, PUR, True, halo=True))
    # (b) 横から見た図
    o.append(T(350, 18, "(b) 横から見た図", "start", 11.5, INK, True))
    bx, by = 350, 52
    o.append(RECT(bx + 20, by, 180, 8, 1, MSOFT, MUT, 1.2))
    o.append(T(bx + 110, by - 6, "ふた", "middle", 9, MUT, True))
    o.append(RECT(bx + 20, by + 8, 6, 36, 0, MSOFT, MUT, 1.2)); o.append(RECT(bx + 194, by + 8, 6, 36, 0, MSOFT, MUT, 1.2))
    o.append(T(bx + 206, by + 30, "枠", "start", 9, MUT, True))
    o.append(RECT(bx, by + 44, 220, 6, 0, GOSOFT, GLD, 1))
    o.append(T(bx + 226, by + 50, "1 層目の銅の帯", "start", 9, GLD, True))
    o.append(RECT(bx, by + 50, 220, 14, 0, PAN, LIN, 1))
    o.append(RECT(bx, by + 64, 220, 5, 0, GOSOFT, GLD, 1))
    o.append(T(bx + 226, by + 70, "2 層目のグラウンド", "start", 9, GLD, True))
    for xx in (bx + 10, bx + 32, bx + 188, bx + 210):
        o.append(RECT(xx - 2, by + 50, 4, 14, 0, GLD, "none", 0))
    o.append(T(bx + 110, by + 86, "ビアの柵（11 章 3 節。L1 で 4.5 mm 以下）", "middle", 9, GLD, True))
    # (c) つなぐ点の間隔と SE
    o.append(T(350, 172, "(c) つなぐ点の間隔と L1 での SE（目安）", "start", 11.5, INK, True))
    items = [("3 mm おき", 3.0, GRN), ("10 mm おき", 10.0, GLD), ("24 mm おき", 24.0, ALI)]
    for k, (nm, l, c) in enumerate(items):
        y = 186 + k * 26
        v = _f21_se(l / 1000)
        o.append(T(440, y + 13, nm, "end", 9.5, INK))
        o.append(RECT(448, y + 2, 5.0 * v, 16, 3, soft(c), c, 1.2))
        o.append(T(448 + 5.0 * v + 6, y + 14, "%.1f dB" % v, "start", 9.5, c, True))
    o.append(T(14, 286, "つなぐ点の間は浮くので、間隔がそのまま隙間の長さになる（最も長い隙間が全体を決める）", "start", 9.5, INK))
    return SVG(700, 296, o, "枠 48 × 30 mm の例。緑の点ははんだの接点、赤の点は間隔の広い接点、灰の丸は銅の帯の下のビア。")


F["e21_can"] = _f21_can_fig()


# =====================================================================
# 5 節: 受け側のフィルタの置き方（9 章の 3 つの構成）と、強い電波があるとき
# =====================================================================
_F21_T0, _F21_TA = 290.0, 100.0
_F21_ST9 = [("チップ 1", 20.0, 3.0), ("チップ 2", 68.5, 3.0)]     # 9 章の例のチップの中の増幅（仮に置いた値）


def _f21_cn0_chain(stages):
    """9 章 1 節のフリスの式（雑音温度の形）で C/N0 [dB-Hz] を求める。stages = [(名前, 利得 dB, 雑音指数 dB)]。"""
    g, te = 1.0, 0.0
    for nm, G, NF in stages:
        te += (10 ** (NF / 10) - 1) * _F21_T0 / g
        g *= 10 ** (G / 10)
    return -128.5 - (10 * math.log10(_F21_KB * (_F21_TA + te)) + 30)


def _f21_rxfilter_fig():
    o = []
    cfgs = [("(a) LNA の後に SAW", [("LNA", 18, 1.0), ("SAW", -1.5, 1.5)], [("LNA", SIG), ("SAW", GLD)], -120.0, "相互変調の積 −120 dBm（弱めない）", ALI),
            ("(b) SAW を LNA の前に", [("SAW", -1.5, 1.5), ("LNA", 18, 1.0)], [("SAW", GLD), ("LNA", SIG)], 3 * (-40 - 45.0), "−255 dBm（SAW で 45 dB 弱める）", GRN),
            ("(c) 広いフィルタを前に", [("広い", -0.5, 0.5), ("LNA", 18, 1.0), ("SAW", -1.5, 1.5)], [("広い", TEA), ("LNA", SIG), ("SAW", GLD)], 3 * (-40 - 20.0), "−180 dBm（広いフィルタで 20 dB）", GRN)]
    o.append(T(14, 18, "構成と、LNA に入る強い電波（−40 dBm × 2、9 章 4 節の例）の相互変調の積", "start", 11, INK, True))
    o.append(TX(420, 44, "C/N_0 [dB-Hz]", "start", 10.5, INK, True))
    q = Plot(420, 52, 260, 210, (30, 48), (0, 1))
    for v in (30, 35, 40, 45, 48):
        o.append(W(q.X(v), q.y, q.X(v), q.y + q.h, c=GRD, lw=1))
        o.append(T(q.X(v), q.y + q.h + 14, "%d" % v, "middle", 9.5, MUT))
    cw_avg = _F21_TC                 # 平均の S~（中心の近く）
    worst = 14.8                     # 20 章 4 節: PRN 1 の強い線に重なり 20 ms 積分したときの下がり（−120 dBm）
    for k, (title, st, boxes, pim, note, nc) in enumerate(cfgs):
        y = 50 + k * 72
        o.append(T(14, y + 4, title, "start", 10.5, INK, True))
        x = 30
        o.append(CIRC(x, y + 26, 6, c=MUT, lw=1.3))
        x += 7
        for nm, c in boxes + [("チップ", MUT)]:
            o.append(ARR(x, y + 26, x + 12, y + 26, c=MUT, lw=1.3, head=5))
            o.append(BOX(x + 12, y + 14, 50, 24, nm, None, c=c, sz=9.5))
            x += 62
        o.append(T(30, y + 56, note, "start", 9.5, nc, True))
        base = _f21_cn0_chain(st + _F21_ST9)
        nj = 10 ** ((pim - _F21_N0) / 10) * cw_avg
        withj = base - _f21_drop(nj)
        yb = q.y + k * 72
        o.append(RECT(q.X(30), yb + 4, q.X(base) - q.X(30), 18, 3, SSOFT, SIG, 1.2))
        o.append(T(q.X(base) + 4, yb + 17, "%.1f" % base, "start", 9.5, SIG, True))
        o.append(RECT(q.X(30), yb + 28, q.X(withj) - q.X(30), 18, 3, ASOFT if k == 0 else GSOFT, ALI if k == 0 else GRN, 1.2))
        o.append(T(q.X(withj) + 4, yb + 41, "%.1f" % withj, "start", 9.5, ALI if k == 0 else GRN, True))
        if k == 0:
            wv = base - worst
            o.append(W(q.X(wv), yb + 37, q.X(withj), yb + 37, c=ALI, lw=1.4, dash="3 2"))
            o.append(W(q.X(wv), yb + 31, q.X(wv), yb + 43, c=ALI, lw=1.6))
            o.append(T(q.X(wv) + 3, yb + 58, "線に重なると %.1f" % wv, "start", 9, ALI, True))
    o.append(LEGEND(420, 288, [(SIG, "強い電波が無い"), (ALI, "強い電波がある")], 9.5, 14))
    return SVG(700, 296, o, "9 章 3 節の 3 つの構成（例の値。広いフィルタは挿入損失 0.5 dB・L1 から離れた電波を 20 dB 弱めるとした）。強い電波の積の効きは 20 章 4 節の平均の連続波。")


F["e21_rxfilter"] = _f21_rxfilter_fig()


# =====================================================================
# 5 節: 源からの距離と結合（傾向のモデル）・地板の向き
# =====================================================================
def _f21_coup(d):
    """小さな源の真横の電界（短い線）・磁界（電流の輪）の 2 乗（係数を除く）: {(1 − 1/(kd)²)² + 1/(kd)²}/d²。"""
    x = 2 * math.pi / _F21_LAM * d
    return ((1 - 1 / x ** 2) ** 2 + 1 / x ** 2) / d ** 2


def _f21_rel(d, d0=0.01):
    return 10 * math.log10(_f21_coup(d) / _f21_coup(d0))


def _f21_distance_fig():
    o = []
    o.append(T(14, 18, "(a) 源からの距離と、アンテナに入る成分（1 cm を 0 dB）", "start", 11.5, INK, True))
    p = Plot(70, 40, 330, 190, (0.5, 100), (-70, 20), xlog=True)
    o.append(p.axes(xl="源からの距離 d [cm]", yl="相対値 [dB]", xt=[0.5, 1, 2, 5, 10, 20, 50, 100], yt=[-60, -40, -20, 0, 20],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: _f21_m(v, 0)))
    ds = _f21_np.logspace(math.log10(0.5), 2, 300)
    d0 = _F21_LAM / (2 * math.pi) * 100
    o.append(W(p.X(d0), p.y, p.X(d0), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(d0) + 4, p.y + 12, "λ/2π = %.1f cm" % d0, "start", 9, MUT, True, halo=True))
    # 近い所と遠い所の傾き
    a_near = _f21_rel(0.005)
    o.append(p.clip([(0.5, a_near), (5.0, a_near - 60)], c=FNT, lw=1.2, dash="4 3"))
    a_far = _f21_rel(1.0)
    o.append(p.clip([(5.0, a_far + 20 * math.log10(100 / 5)), (100, a_far)], c=FNT, lw=1.2, dash="4 3"))
    o.append(p.clip([(d, _f21_rel(d / 100)) for d in ds], c=ALI, lw=2.4))
    o.append(T(p.X(0.62), p.Y(-28), "距離の 3 乗に反比例", "start", 9, MUT, False, halo=True))
    o.append(T(p.X(0.62), p.Y(-28) + 12, "（2 倍で −18 dB）", "start", 9, MUT, False, halo=True))
    o.append(T(p.X(95), p.Y(-66), "距離に反比例（2 倍で −6 dB）", "end", 9, MUT, False, halo=True))
    for d in (1, 2, 10, 20):
        v = _f21_rel(d / 100)
        o.append(D(p.X(d), p.Y(v), ALI, 3.6))
        o.append(T(p.X(d) + 5, p.Y(v) - 6, "%s" % _f21_m(v), "start", 9.5, ALI, True, halo=True))
    # (b) 向きと場所
    o.append(T(440, 18, "(b) 向きと場所（例）", "start", 11.5, INK, True))
    gx, gy = 470, 140
    o.append(RECT(gx, gy, 200, 6, 1, MSOFT, MUT, 1.2))
    o.append(T(gx + 100, gy + 20, "地板（基板のグラウンド）", "middle", 9, MUT, True))
    o.append(RECT(gx + 80, gy - 10, 40, 10, 2, SSOFT, SIG, 1.3))
    o.append(T(gx + 100, gy - 16, "パッチ", "middle", 9, SIG, True, halo=True))
    o.append(ARR(gx + 100, gy - 30, gx + 100, gy - 76, c=SIG, lw=1.6, head=7))
    o.append(T(gx + 106, gy - 64, "空（衛星）", "start", 9.5, SIG, True))
    o.append(D(gx + 18, gy - 24, ALI, 6))
    o.append(T(gx + 18, gy - 36, "同じ側の源", "middle", 9, ALI, True, halo=True))
    o.append(D(gx + 150, gy + 38, ALI, 6))
    o.append(T(gx + 150, gy + 58, "地板の裏の源", "middle", 9, GRN, True))
    for k, line in enumerate(["地板の裏の源は、前後比の分だけ弱い", "（8 章 4 節: 地板 70 mm 角で 6.1 dB、", "150 mm 角で 13.7 dB）。アンテナを", "機器の外に出すと距離が延び、ケーブル", "は LNA の後になる（9 章 5 節）"]):
        o.append(T(gx - 20, gy + 78 + k * 13, line, "start", 9, INK))
    o.append(LEGL(70, 286, [(ALI, None, "傾向のモデル（L1・小さな源）"), (FNT, "4 3", "近い所と遠い所の傾き")], 9.5, 14))
    return SVG(700, 300, o, "(a) 短い線の源の電界・小さな電流の輪の源の磁界の、真横の向きの式（源の形と大きさは入れていない傾向のモデル）。")


F["e21_distance"] = _f21_distance_fig()


# =====================================================================
# 6 節: 同じ条件で比べる — 空の変化と、基準の受信機との差（例: 東京・GPS の近似の配置）
# =====================================================================
def _f21_sky_series(t0=12 * 3600.0, T_=5 * 3600.0, dt=60.0, seed=21):
    """基準の受信機と対策する機器の C/N0（C/N0 の高い 8 機の平均）の時系列。C/N0 の仰角の形は例のモデル。"""
    B, L, h = GNSS_TOKYO
    sats = [s for s in gnss_const() if s["sys"] == "GPS"]
    ts = _f21_np.arange(0, T_ + 1, dt)
    el = _f21_np.array([[elaz(B, L, h, sat_ecef(s, t0 + t))[0] for s in sats] for t in ts])
    base = 48.8 + 15 * _f21_np.log10(_f21_np.sin(_f21_np.radians(_f21_np.clip(el, 1, 90))))
    vis = el >= 10
    def top8(x):
        out = []
        for i in range(len(ts)):
            v = _f21_np.sort(_f21_np.where(vis[i], x[i], -1e9))[::-1][:8]
            out.append(v[v > -1e8].mean())
        return _f21_np.array(out)
    rng = _f21_np.random.default_rng(seed)
    a = math.exp(-dt / 300.0)
    def ar(s):
        x = _f21_np.zeros(len(ts))
        for i in range(1, len(ts)):
            x[i] = a * x[i - 1] + math.sqrt(1 - a * a) * rng.normal(0, s)
        return x
    R = top8(base)
    ref = R + ar(0.25)
    dut = R + ar(0.25)
    return ts / 3600.0, ref, dut


_F21_JB, _F21_JA = 3.0, -7.0          # 対策の前と後の N_J/N0 [dB]（例の値。帯域に平らな妨害）


def _f21_methods_fig():
    o = []
    th, ref, dut0 = _f21_sky_series()
    dB_, dA_ = _f21_drop(10 ** (_F21_JB / 10)), _f21_drop(10 ** (_F21_JA / 10))
    w1 = (th >= 0.25) & (th <= 0.75)
    w2 = (th >= 4.25) & (th <= 4.75)
    dut = _f21_np.where(th < 2.5, dut0 - dB_, dut0 - dA_)
    o.append(TX(14, 18, "(a) 対策の前と後を 4 時間あけて測った例（C/N_0 の高い 8 機の平均）", "start", 11.5, INK, True))
    p = Plot(70, 40, 610, 160, (0, 5), (38, 48))
    o.append(RECT(p.X(0.25), p.y, p.X(0.75) - p.X(0.25), p.h, 0, ASOFT, "none", 0))
    o.append(RECT(p.X(4.25), p.y, p.X(4.75) - p.X(4.25), p.h, 0, GSOFT, "none", 0))
    o.append(p.axes(xl="測り始めからの時間 [h]", yl="C/N_0 [dB-Hz]", xt=[0, 1, 2, 3, 4, 5], yt=[38, 40, 42, 44, 46, 48],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(p.line(list(zip(th, ref)), c=TEA, lw=2))
    o.append(p.line(list(zip(th[w1], dut[w1])), c=ALI, lw=2.4))
    o.append(p.line(list(zip(th[w2], dut[w2])), c=GRN, lw=2.4))
    r1, r2 = ref[w1].mean(), ref[w2].mean()
    d1, d2 = dut[w1].mean(), dut[w2].mean()
    o.append(T(p.X(0.8) + 4, p.Y(d1) + 4, "前 %.1f" % d1, "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(4.2) - 4, p.Y(d2) + 4, "後 %.1f" % d2, "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(2.5), p.Y(ref[len(th) // 2]) - 8, "基準の受信機（空の変化）", "middle", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(2.5), p.y + p.h - 26, "そのまま比べると %.1f dB、基準との差で比べると %.1f dB（本当の改善 %.1f dB）" % (d2 - d1, (d2 - r2) - (d1 - r1), dB_ - dA_),
                "middle", 10, INK, True, halo=True))
    # (b) 3 つの方法
    yb = 250
    o.append(T(14, yb - 12, "(b) 条件をそろえる 3 つの方法", "start", 11.5, INK, True))
    boxes = [("基準の受信機と並べる", "同じ時刻に測って差をとる。空の変化は差から消える", TEA),
             ("同じ空で測る", "1 恒星日後、約 4 分早い時刻（GPS）。日をまたぐ", PUR),
             ("GNSS シミュレータ", "同じ信号を何度でも入れる。ケーブルでは、アンテナに入る経路を測れない", GLD)]
    for k, (a, b, c) in enumerate(boxes):
        o.append(BOX(14 + k * 228, yb, 216, 54, a, b, c=c, sz=10, ssz=9, sc=MUT))
    return SVG(700, yb + 62, o, "東京・GPS の近似の配置（1 章）、C/N0 は仰角の例のモデル。対策で帯域に平らな妨害が +3 dB から −7 dB（N0 に対して）に下がるとした。")


F["e21_methods"] = _f21_methods_fig()


# =====================================================================
# 6 節: 例の機器（20 章 6 節）に対策を足していく（対策の効きは例の値）
# =====================================================================
_F21_HSATS = [("G05", 5, 72, 48.5, -420), ("G13", 13, 61, 47.8, 1210), ("G20", 20, 48, 46.5, -2380), ("G15", 15, 40, 45.2, 2950),
              ("G24", 24, 33, 44.0, -3130), ("G18", 18, 25, 42.3, 3720), ("G29", 29, 17, 40.1, -1650), ("G02", 2, 11, 38.0, 4180)]
_F21_SRC0 = {"usb": ("bb", 6.0), "cam": ("bb", 2.0), "disp": ("cw", -420e3, -112.0), "dcdc": ("cw", 580e3, -118.0)}
_F21_MEAS = [("usb", ("bb", -14.0), "RF の区画をシールドケース", "で覆う（4 節。−20 dB）"),
             ("cam", ("bb", -13.0), "カメラの線を内側の層へ", "（11 章 5 節。−15 dB）"),
             ("disp", ("cw", -420e3, -122.7), "表示のクロックに 33 Ω", "（2 節。−10.7 dB）"),
             ("dcdc", None, "DC-DC を 2.7 MHz に", "（2 節。帯域の外へ）")]
_F21_STC = {}


def _f21_st1(prn, f):
    """PRN の C/A 符号を 1 ms 積分したときの S~(f) [1/Hz]（20 章 4 節の導出の式）。"""
    key = (prn, round(f, 3))
    if key not in _F21_STC:
        a = _f21_np.array(ca_pm(prn), float)
        n = _f21_np.arange(1023)
        A1 = (_f21_np.exp(1j * 2 * math.pi * f * n * _F21_TC) @ a) / 1023.0 * _f21_np.sinc(f * _F21_TC)
        _F21_STC[key] = 1e-3 * abs(A1) ** 2
    return _F21_STC[key]


def _f21_dev(src):
    """源の組 → 8 機の C/N0 の平均。"""
    out = []
    for nm, prn, el, base, fd in _F21_HSATS:
        r = 0.0
        for v in src.values():
            if v is None:
                continue
            if v[0] == "bb":
                r += 10 ** (v[1] / 10)
            else:
                r += 10 ** ((v[2] - _F21_N0) / 10) * _f21_st1(prn, v[1] - fd)
        out.append(base - _f21_drop(r))
    return sum(out) / len(out)


def _f21_gain_calc():
    cur = dict(_F21_SRC0)
    steps = [_f21_dev(cur)]
    for k, v, a, b in _F21_MEAS:
        cur[k] = v
        steps.append(_f21_dev(cur))
    first, last = [], []
    for k, v, a, b in _F21_MEAS:
        s = dict(_F21_SRC0); s[k] = v
        first.append(_f21_dev(s) - steps[0])
        s = dict(cur); s[k] = _F21_SRC0[k]
        last.append(steps[-1] - _f21_dev(s))
    base = sum(x[3] for x in _F21_HSATS) / len(_F21_HSATS)
    return base, steps, first, last


def _f21_gain_fig():
    o = []
    base, steps, first, last = _f21_gain_calc()
    o.append(TX(14, 18, "(a) 対策を 1 つずつ足したときの C/N_0（8 機の平均）", "start", 11.5, INK, True))
    p = Plot(66, 40, 330, 180, (0, 5), (34, 46))
    o.append(RECT(p.x, p.Y(base), p.w, p.Y(base - 1) - p.Y(base), 0, GSOFT, "none", 0))
    o.append(p.axes(yl="C/N_0 [dB-Hz]", xt=[], yt=[34, 36, 38, 40, 42, 44, 46], yfmt=lambda v: "%d" % v))
    o.append(W(p.x, p.Y(base), p.x + p.w, p.Y(base), c=GRN, lw=1.2, dash="5 3"))
    o.append(T(p.x + p.w - 4, p.Y(base) - 5, "妨害が無いとき %.1f（緑の帯は 1 dB 以内）" % base, "end", 9, GRN, True, halo=True))
    labs = [("全部を", "動かす")] + [("+ " + a.split("を")[0] if False else "+ 対策 %d" % (i + 1), "") for i, (k, v, a, b) in enumerate(_F21_MEAS)]
    for i, v in enumerate(steps):
        x0 = p.X(i + 0.18); x1 = p.X(i + 0.82)
        c = ALI if i == 0 else (GRN if v >= base - 1 else GLD)
        o.append(RECT(x0, p.Y(v), x1 - x0, p.Y(34) - p.Y(v), 2, soft(c), c, 1.2))
        o.append(T((x0 + x1) / 2, p.Y(v) - 5, "%.1f" % v, "middle", 9.5, c, True, halo=True))
        if i == 0:
            o.append(T((x0 + x1) / 2, p.y + p.h + 14, "全部を", "middle", 9, INK))
            o.append(T((x0 + x1) / 2, p.y + p.h + 27, "動かす", "middle", 9, INK))
        else:
            o.append(T((x0 + x1) / 2, p.y + p.h + 14, "+ 対策 %d" % i, "middle", 9, INK, True))
    for i, (k, v, a, b) in enumerate(_F21_MEAS):
        o.append(T(14 + (i % 2) * 200, 262 + (i // 2) * 32, "対策 %d: %s" % (i + 1, a), "start", 9, INK))
        o.append(T(14 + (i % 2) * 200 + 12, 262 + (i // 2) * 32 + 13, b, "start", 9, MUT))
    # (b) 改善量
    o.append(T(430, 18, "(b) 1 つの対策の改善量 [dB]", "start", 11.5, INK, True))
    q = Plot(500, 40, 160, 180, (0, 7), (0, 1))
    for v in range(0, 8):
        o.append(W(q.X(v), q.y, q.X(v), q.y + q.h, c=GRD, lw=1))
        o.append(T(q.X(v), q.y + q.h + 14, "%d" % v, "middle", 9.5, MUT))
    for i in range(len(_F21_MEAS)):
        y = q.y + 6 + i * 44
        o.append(T(q.x - 8, y + 18, "対策 %d" % (i + 1), "end", 9.5, INK, True))
        for j, (vals, c) in enumerate(((first, MUT), (last, GRN))):
            v = vals[i]
            o.append(RECT(q.X(0), y + j * 16, max(1, q.X(v) - q.X(0)), 13, 2, soft(c), c, 1.1))
            o.append(T(q.X(v) + 4, y + j * 16 + 11, "%.1f" % v, "start", 9, c, True))
    o.append(LEGEND(430, 262, [(MUT, "最初に 1 つだけ行う")], 9.5, 10))
    o.append(LEGEND(430, 280, [(GRN, "全部の後に 1 つだけ外す")], 9.5, 10))
    return SVG(700, 314, o, "20 章 6 節の例の機器（DC-DC・カメラ・USB・表示の 4 つの源）。各対策の効き（dB）は例の値。")


F["e21_gain"] = _f21_gain_fig()
