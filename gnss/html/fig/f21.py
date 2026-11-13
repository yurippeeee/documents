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
    """符号付き（+ と −）の数値の文字列。"""
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
    for v, c, lab in ends[1:]:
        o.append(T(p.x + p.w - 4, p.Y(v) - 5, "%s %.1f" % (lab, v), "end", 9, c, True, halo=True))
    a20 = _F21_CN0 - _f21_drop(tot * 0.01)
    o.append(D(p.X(20), p.Y(a20), GRN, 3.8))
    o.append(T(p.X(20) + 6, p.Y(a20) + 14, "源で 20 dB: %.1f" % a20, "start", 9.5, GRN, True, halo=True))
    o.append(D(p.X(0), p.Y(_F21_CN0 - _f21_drop(tot)), INK, 3.6))
    o.append(T(p.X(0) + 6, p.Y(_F21_CN0 - _f21_drop(tot)) + 4, "%.1f" % (_F21_CN0 - _f21_drop(tot)), "start", 9.5, INK, True, halo=True))
    o.append(LEGL(352, 276, [(GRN, None, "源で抑える（全部の経路が下がる）"), (ALI, None, "経路 1 だけ")], 9.5, 12))
    o.append(LEGL(352, 292, [(ALI, "6 3", "経路 2 だけ"), (ALI, "2 3", "経路 3 だけ")], 9.5, 12))
    return SVG(700, 300, o, "経路ごとの N_J/N0 は例の値（+6・+3・0 dB）。9 章の例の受信機（C/N0 47.5 dB-Hz）。")


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
    o.append(T(p.X(-1950), p.Y((n0 * f0 * (1 - 1950e-6) - _F21_L1) / 1e6) - 6, "%d 次" % n0, "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1950), p.Y(((n0 + 1) * f0 * (1 + 1950e-6) - _F21_L1) / 1e6) + 14, "%d 次" % (n0 + 1), "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(-1900), p.Y(1.023) - 4, "L1 の帯域 ±1.023 MHz", "start", 9, SIG, True, halo=True))
    # 窓と水晶
    o.append(T(p.X(0), p.y + 12, "入らない範囲 %s〜%s ppm" % (_f21_pm(wl, 0), _f21_pm(wh, 0)), "middle", 9, GRN, True, halo=True))
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
            (2e6, "(c) ほとんど変わらない: 2 MHz の DC-DC（2 MHz おきに線）", GLD)]
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
    o.append(q.axes(xl="直列の抵抗 R_d [Ω]", yl="[dB]", xt=[0, 50, 100, 150], yt=[-25, -20, -15, -10, -5, 0],
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
    return SVG(700, yc + 126, o, "(a)(b) 立ち上がり 1 ns の出力に直列の抵抗 R_d を入れ、受け側の入力の容量 C_in = 10 pF（例の値）とした RC のモデル（線は短いとした）。(c) の面積は例の値。")


F["e21_edge"] = _f21_edge_fig()
