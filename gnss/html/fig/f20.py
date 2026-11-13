# -*- coding: utf-8 -*-
# 20 章 妨害とノイズの源 の図
import numpy as _f20_np

# ---- 例の値（本文・デモと同じ） ----
_F20_L1 = 1575.42                      # L1 [MHz]
_F20_HB = 1.023                        # L1 C/A の主ローブの半分の幅 [MHz]
_F20_TC = 1 / 1.023e6                  # 1 チップの時間 [s]
_F20_KB = 1.380649e-23
_F20_TSYS = 183.5                      # 9 章 1 節の例のシステム雑音温度 [K]
_F20_N0 = 10 * math.log10(_F20_KB * _F20_TSYS) + 30   # 雑音の床 −175.96 dBm/Hz
_F20_C = -128.5                        # 衛星の信号の電力 [dBm]
_F20_CN0 = _F20_C - _F20_N0            # 47.46 dB-Hz
_F20_BW = 2.046e6                      # 受信機の帯域 [Hz]
_F20_NB = _F20_N0 + 10 * math.log10(_F20_BW)          # 帯域の雑音の電力 −112.85 dBm
_F20_TCDB = 10 * math.log10(_F20_TC)                  # −60.10 dB（S~ の中心の平均）
_F20_BDB = -10 * math.log10(_F20_BW)                  # −63.11 dB（帯域に平らな妨害）
_F20_ACQ, _F20_TRK = 35.0, 25.0        # 捕捉・搬送波の位相の追尾の目安 [dB-Hz]（3 章 6 節の代表値）

# GNSS の帯域（2 章 1 節の値。3 節の数え上げに使う）: (名前, 下の端, 上の端) [MHz]
_F20_BANDS = [("L1", 1575.42 - 1.023, 1575.42 + 1.023), ("E1・B1C", 1575.42 - 2.046, 1575.42 + 2.046),
              ("B1I", 1561.098 - 2.046, 1561.098 + 2.046), ("G1", 1598.0625 - 0.511, 1605.375 + 0.511),
              ("L2", 1227.60 - 1.023, 1227.60 + 1.023), ("L5", 1176.45 - 10.23, 1176.45 + 10.23)]


def _f20_db(x):
    return 10 * math.log10(x)


def _f20_drop(r):
    """N_J/N0（真数）→ C/N0 の下がり [dB]。"""
    return 10 * math.log10(1 + r)


def _f20_m(v, d=1):
    """負の数の − を正しい記号にした数値の文字列。"""
    return ("%.*f" % (d, v)).replace("-", "−")


def _f20_inband(f):
    """周波数 f [MHz] の高調波のうち、各帯域に入るものの次数のリスト。"""
    out = []
    for nm, lo, hi in _F20_BANDS:
        n0 = math.ceil(lo / f - 1e-12); n1 = math.floor(hi / f + 1e-12)
        out.append((nm, list(range(n0, n1 + 1))))
    return out


# ---- 相関器から見た符号のスペクトラム S~(f) = T_coh |A(f)|²（4 節の導出。w20.js の _w20_st と同じ計算） ----
_F20_CODE = {}


def _f20_code(prn):
    if prn not in _F20_CODE:
        _F20_CODE[prn] = _f20_np.array(ca_pm(prn), float)
    return _F20_CODE[prn]


def _f20_st(prn, f, M=1):
    """PRN の C/A 符号を M ms 積分したときの S~(f) [1/Hz]。f は周波数のずれ [Hz] の並び。"""
    a = _f20_code(prn)
    f = _f20_np.atleast_1d(_f20_np.asarray(f, float))
    n = _f20_np.arange(1023)
    out = _f20_np.empty(len(f))
    for i0 in range(0, len(f), 1500):
        ff = f[i0:i0 + 1500]
        E = _f20_np.exp(1j * 2 * _f20_np.pi * _f20_np.outer(ff, n) * _F20_TC)
        A1 = (E @ a) / 1023.0 * _f20_np.sinc(ff * _F20_TC)
        s = _f20_np.sin(_f20_np.pi * ff * 1e-3)
        small = _f20_np.abs(s) < 1e-12
        DM = _f20_np.where(small, 1.0, _f20_np.sin(_f20_np.pi * M * ff * 1e-3) / (M * _f20_np.where(small, 1.0, s)))
        out[i0:i0 + 1500] = M * 1e-3 * _f20_np.abs(A1) ** 2 * DM ** 2
    return out


def _f20_lines(prn):
    """C/A 符号のスペクトラムの線 k kHz の電力の割合 |c_k|²（k = 0..1022）。"""
    a = _f20_code(prn)
    D = _f20_np.fft.fft(a) / 1023.0
    return _f20_np.abs(D) ** 2 * _f20_np.sinc(_f20_np.arange(1023) / 1023.0) ** 2


# ---- 台形の波の高調波（2 節。w20.js の _w20_trap と同じ） ----
def _f20_trap(A, f, tau, tr, n):
    """振幅 A [V]・周波数 f [Hz]・幅 tau・立ち上がり tr [s] の台形の波の、n 次の成分の振幅 [V]。"""
    T_ = 1.0 / f
    return 2 * A * (tau / T_) * abs(_f20_np.sinc(n * tau / T_)) * abs(_f20_np.sinc(n * tr / T_))


def _f20_trenv(A, f, tau, tr, fn):
    """台形の波の包絡線（線の高さの上限）[V]。fn は周波数 [Hz]。"""
    d = tau * f
    return 2 * A * d * min(1.0, 1 / (math.pi * fn * tau)) * min(1.0, 1 / (math.pi * fn * tr))


def _f20_dbuv(v):
    return 20 * math.log10(v / 1e-6)


def _f20_dbm50(v):
    """振幅 v [V] の正弦波を 50 Ω に出したときの電力 [dBm]。"""
    return 10 * math.log10(v * v / 2 / 50) + 30


def _f20_nrz(A, rb, tr, f):
    """でたらめな ±A のデータ（rb [bit/s]、立ち上がり tr）の、周波数 f の片側の電力スペクトル密度を 50 Ω に換算 [dBm/Hz]。"""
    tb = 1.0 / rb
    S = 2 * A * A * tb * _f20_np.sinc(f * tb) ** 2 * _f20_np.sinc(f * tr) ** 2 / 50
    return 10 * math.log10(S) + 30


# 2 節の 4 つの源（例の値）と、L1 の帯域に入る電力（源の所、50 Ω に換算）
_F20_SRC_DCDC = (5.0, 2e6, 0.66, 2e-9)      # 入力 5 V・2 MHz・時間の割合 0.66・立ち上がり 2 ns
_F20_SRC_CLK = (3.3, 25e6, 0.5, 1e-9)       # 3.3 V・25 MHz・50 %・1 ns
_F20_SRC_USB3 = (0.5, 5e9, 0.08e-9)         # ±0.5 V・5 Gbit/s・80 ps
_F20_SRC_USB2 = (0.4, 480e6, 0.5e-9)        # ±0.4 V・480 Mbit/s・0.5 ns
_F20_SRC_PPS = (3.3, 3e-9)                  # 3.3 V・立ち上がり 3 ns・1 秒に 2 回


def _f20_src_levels():
    A, f, d, tr = _F20_SRC_DCDC
    dc = _f20_dbm50(_f20_trap(A, f, d / f, tr, 788))
    A, f, d, tr = _F20_SRC_CLK
    ck = _f20_dbm50(_f20_trap(A, f, d / f, tr, 63))
    u3 = _f20_nrz(*_F20_SRC_USB3, _F20_L1 * 1e6) + 10 * math.log10(_F20_BW)
    u2 = _f20_nrz(*_F20_SRC_USB2, _F20_L1 * 1e6) + 10 * math.log10(_F20_BW)
    A, tr = _F20_SRC_PPS
    fl = _F20_L1 * 1e6
    V = A / (2 * math.pi * fl) * abs(_f20_np.sinc(fl * tr))
    pps_psd = 10 * math.log10(2 * (2 * V * V / 50)) + 30          # 1 秒に 2 回の縁の平均 [dBm/Hz]
    return {"dcdc": dc, "clk": ck, "usb3": u3, "usb2": u2, "pps": pps_psd + 10 * math.log10(_F20_BW), "pps_psd": pps_psd}


_F20_LV = _f20_src_levels()

# 4 節: C/N0 を 1 dB 下げる受信機の入力の電力（連続波は S~ の中心の平均 T_c で、平らな雑音は帯域 2.046 MHz で）
_F20_R1DB = 10 ** (1 / 10.0) - 1
_F20_P1CW = _F20_N0 + _f20_db(_F20_R1DB) - _F20_TCDB
_F20_P1BB = _F20_N0 + _f20_db(_F20_R1DB) - _F20_BDB


def _f20_pj_for(target, sdb):
    """C/N0 を target [dB-Hz] まで下げる妨害の電力 [dBm]（sdb = 10 log10 S~ [dB/Hz]）。"""
    r = 10 ** ((_F20_CN0 - target) / 10) - 1
    return _F20_N0 + _f20_db(r) - sdb


def _f20_cn0eq(pj, sdb):
    """妨害の電力 pj [dBm] と 10 log10 S~ [dB/Hz] → 等価な C/N0 [dB-Hz]。"""
    r = 10 ** ((pj + sdb - _F20_N0) / 10)
    return _F20_CN0 - _f20_drop(r)


_F20_CID = [0]


def _f20_clip(x, y, w, h, body):
    """枠 (x, y, w, h) の外を切って描く（clipPath。名前は図ごとに変える）。"""
    _F20_CID[0] += 1
    cid = "f20cp%d" % _F20_CID[0]
    return ('<clipPath id="%s"><rect x="%g" y="%g" width="%g" height="%g"/></clipPath><g clip-path="url(#%s)">%s</g>'
            % (cid, x, y, w, h, cid, "".join(body) if isinstance(body, list) else body))


def _f20_spike(p, f, v, c=ALI, lw=2.2, base=None):
    """Plot p の上の、周波数 f・高さ v の縦の線（連続波）。"""
    yb = p.y + p.h if base is None else p.Y(base)
    return W(p.X(f), yb, p.X(f), p.Y(v), c=c, lw=lw) + D(p.X(f), p.Y(v), c, 2.6)


# =====================================================================
# 1 節: 妨害の源・道・受信機の中で効く所
# =====================================================================
def _f20_paths_fig():
    o = []
    o.append(T(14, 18, "妨害の源 → 道 → 受信機（受信機の中は信号が左から右へ流れる）", "start", 11.5, INK, True))
    # 源: 機器の外（左）と機器の中（右）
    o.append(RECT(10, 30, 254, 74, 8, "none", ALI, 1.0, dash="5 4"))
    o.append(T(18, 45, "機器の外（5 節）", "start", 10, ALI, True))
    outs = [("近くの無線機", "携帯電話など"), ("ジャミング", "わざと出す"), ("スプーフィング", "偽の信号")]
    xo = [16, 98, 180]
    for (a, b), x in zip(outs, xo):
        o.append(BOX(x, 52, 78, 44, a, b, c=ALI, sz=9.5, ssz=9, sc=MUT))
    o.append(RECT(276, 30, 414, 74, 8, "none", ALI, 1.0, dash="5 4"))
    o.append(T(284, 45, "機器の中（ノイズ。2・3 節）", "start", 10, ALI, True))
    ins = [("1PPS の線", "10 章 5 節"), ("速い信号の線", "USB・メモリ"), ("クロック", "マイコンなど"), ("DC-DC", "スイッチング電源")]
    xi = [282, 384, 486, 588]
    for (a, b), x in zip(ins, xi):
        o.append(BOX(x, 52, 96, 44, a, b, c=ALI, sz=9.5, ssz=9, sc=MUT))
    # 道
    yp = 140
    paths = [("空間の電波", "アンテナで受ける", 16, 200), ("基板の上の結合", "近くの線・部品から（11 章 5 節）", 240, 230), ("電源の線とグラウンド", "伝わって入る（10 章 2 節）", 494, 196)]
    for a, b, x, w in paths:
        o.append(BOX(x, yp, w, 42, a, b, c=TEA, sz=10, ssz=9, sc=MUT))
    o.append(T(14, yp - 8, "道", "start", 10, TEA, True))
    # 源 → 道
    for x in xo:
        o.append(ARR(x + 39, 96, 116, yp - 2, c=ALI, lw=1.2, head=6))
    o.append(ARR(xi[0] + 48, 96, 355, yp - 2, c=ALI, lw=1.2, head=6))          # 1PPS → 基板
    o.append(ARR(xi[1] + 40, 96, 140, yp - 2, c=ALI, lw=1.2, head=6))          # 速い線 → 空間
    o.append(ARR(xi[1] + 56, 96, 370, yp - 2, c=ALI, lw=1.2, head=6))          # 速い線 → 基板
    o.append(ARR(xi[2] + 48, 96, 400, yp - 2, c=ALI, lw=1.2, head=6))          # クロック → 基板
    o.append(ARR(xi[3] + 36, 96, 430, yp - 2, c=ALI, lw=1.2, head=6))          # DC-DC → 基板
    o.append(ARR(xi[3] + 60, 96, 600, yp - 2, c=ALI, lw=1.2, head=6))          # DC-DC → 電源
    # 受信機の段
    yr = 232
    stages = ["アンテナ", "LNA", "SAW フィルタ", "混合器", "A/D 変換", "相関器"]
    xs = [23 + i * 112 for i in range(6)]
    for i, (nm, x) in enumerate(zip(stages, xs)):
        o.append(BOX(x, yr, 94, 34, nm, None, c=SIG, sz=10.5, fill=SSOFT))
        if i < 5:
            o.append(ARR(x + 94, yr + 17, x + 112, yr + 17, c=SIG, lw=1.5, head=6))
    o.append(T(14, yr - 8, "受信機（RF フロントエンドから相関器）", "start", 10, SIG, True, halo=True))
    # 道 → 受信機
    o.append(ARR(116, yp + 42, xs[0] + 47, yr - 2, c=TEA, lw=1.4, head=6))
    o.append(ARR(320, yp + 42, xs[1] + 47, yr - 2, c=TEA, lw=1.4, head=6))
    o.append(ARR(380, yp + 42, xs[2] + 47, yr - 2, c=TEA, lw=1.4, head=6))
    o.append(ARR(560, yp + 42, xs[3] + 47, yr - 2, c=TEA, lw=1.4, head=6))
    o.append(ARR(640, yp + 42, xs[4] + 47, yr - 2, c=TEA, lw=1.4, head=6))
    o.append(T(250, yp + 62, "RF の配線・LNA へ", "middle", 9, TEA, False, halo=True))
    o.append(T(612, yp + 62, "局部発振器・A/D の電源へ", "middle", 9, TEA, False, halo=True))
    # 帯域の外と内
    y1, y2 = yr + 62, yr + 104
    o.append(W(xs[0] + 47, yr + 34, xs[0] + 47, y2, c=ALI, lw=1.2, dash="3 3"))
    o.append(W(xs[0] + 47, y1, xs[2] + 40, y1, c=ALI, lw=2))
    xx = xs[2] + 47
    o.append(W(xx - 6, y1 - 6, xx + 6, y1 + 6, c=ALI, lw=2.4))
    o.append(W(xx - 6, y1 + 6, xx + 6, y1 - 6, c=ALI, lw=2.4))
    o.append(T(xs[0] + 54, y1 - 6, "帯域外の妨害", "start", 10, ALI, True, halo=True))
    o.append(T(xx + 14, y1 + 4, "フィルタで弱まる。強いと LNA で利得の圧縮・相互変調（9 章 4 節）", "start", 9.5, MUT))
    o.append(ARR(xs[0] + 47, y2, xs[5] + 47, y2, c=ALI, lw=2, head=8))
    o.append(W(xs[5] + 47, y2, xs[5] + 47, yr + 36, c=ALI, lw=1.2, dash="3 3"))
    o.append(T(xs[0] + 54, y2 - 6, "帯域内の妨害", "start", 10, ALI, True, halo=True))
    o.append(TX(xs[0] + 54, y2 + 16, "フィルタを通り抜けて相関器まで届き、C/N_0 を下げる（4 節）", "start", 9.5, MUT))
    return SVG(700, y2 + 26, o, "妨害の源と、受信機までの道（源と道は代表的なものを並べた）。")


F["e20_paths"] = _f20_paths_fig()


# =====================================================================
# 1 節: 帯域の内と外（周波数の軸）・妨害の形と雑音の床
# =====================================================================
def _f20_sinc2(x):
    return _f20_np.sinc(x) ** 2


def _f20_inout_fig():
    o = []
    # (a) 広い範囲: 受信機の入力の電力
    o.append(T(14, 18, "(a) 受信機の入力の電力（L1 の受信機の例）", "start", 11.5, INK, True))
    p = Plot(70, 34, 610, 150, (1450, 1900), (-140, -20))
    o.append(RECT(p.X(1559), p.y, p.X(1610) - p.X(1559), p.h, 0, SSOFT, "none", 0))
    o.append(T(p.X(1584.5), p.y + 14, "SAW フィルタが通す範囲（例）", "middle", 9.5, SIG, True, halo=True))
    o.append(p.axes(xl="周波数 f [MHz]", yl="電力 [dBm]", xt=[1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900], yt=[-140, -110, -80, -50, -20],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: _f20_m(v, 0)))
    # 帯域外の強い電波（9 章 4 節の例）
    for f in (1712.71, 1850.00):
        o.append(_f20_spike(p, f, -40, ALI))
    o.append(T(p.X(1781), p.Y(-40) - 6, "近くの無線機の送信 −40 dBm（9 章 4 節の例）", "middle", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1781), p.Y(-40) + 10, "帯域外の妨害: フィルタで弱まる", "middle", 9.5, MUT, False, halo=True))
    # 帯域内: 相互変調の積・信号・雑音
    o.append(_f20_spike(p, 1575.42, -120, ALI))
    o.append(T(p.X(1575.42) - 6, p.Y(-120) - 4, "相互変調の積 −120 dBm", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(1575.42) - 6, p.Y(-120) + 10, "帯域内の妨害", "end", 9.5, ALI, False, halo=True))
    o.append(W(p.X(1574.4), p.Y(_F20_NB), p.X(1576.4), p.Y(_F20_NB), c=TEA, lw=3))
    o.append(T(p.X(1590), p.Y(_F20_NB) - 4, "帯域 2.046 MHz の雑音 %s dBm" % _f20_m(_F20_NB), "start", 9.5, TEA, True, halo=True))
    o.append(D(p.X(1575.42), p.Y(_F20_C), SIG, 3.8))
    o.append(T(p.X(1590), p.Y(_F20_C) + 4, "衛星の信号 −128.5 dBm", "start", 9.5, SIG, True, halo=True))
    # (b) L1 のまわり: 電力スペクトル密度
    y0 = 236
    o.append(T(14, y0, "(b) L1 のまわりの電力スペクトル密度と、帯域内の妨害の 3 つの形（例の値）", "start", 11.5, INK, True))
    q = Plot(70, y0 + 16, 610, 170, (-4, 4), (-196, -140))
    o.append(RECT(q.X(-_F20_HB), q.y, q.X(_F20_HB) - q.X(-_F20_HB), q.h, 0, SSOFT, "none", 0))
    o.append(q.axes(xl="L1 からの周波数の差 [MHz]", yl="電力スペクトル密度 [dBm/Hz]", xt=[-4, -3, -2, -1, 0, 1, 2, 3, 4], yt=[-190, -180, -170, -160, -150, -140],
                    xfmt=lambda v: _f20_m(v, 0) if v else "0", yfmt=lambda v: _f20_m(v, 0)))
    xs = _f20_np.linspace(-4, 4, 401)
    sig = [(x, _F20_C + _F20_TCDB + 10 * math.log10(max(_f20_sinc2(x / 1.023), 1e-12))) for x in xs]
    o.append(q.clip(sig, c=SIG, lw=2))
    # 広い帯域の妨害で床が上がる（+4 dB の例）
    o.append(q.line([(-4, _F20_N0 + 4), (4, _F20_N0 + 4)], c=ALI, lw=1.6, dash="6 4"))
    o.append(q.line([(-4, _F20_N0), (4, _F20_N0)], c=TEA, lw=2.2))
    o.append(T(q.X(-3.95), q.Y(_F20_N0) + 13, "雑音の床 %s dBm/Hz" % _f20_m(_F20_N0), "start", 9.5, TEA, True, halo=True))
    o.append(T(q.X(3.95), q.Y(_F20_N0 + 4) - 5, "広い帯域の妨害: 床が上がる", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(-1.6), q.Y(-189) - 3, "衛星の信号（床の 12.6 dB 下）", "end", 9.5, SIG, True, halo=True))
    # 狭い帯域の妨害（幅 100 kHz）
    o.append(RECT(q.X(1.95), q.Y(-158), q.X(2.05) - q.X(1.95), q.Y(_F20_N0) - q.Y(-158), 0, ASOFT, ALI, 1.2))
    o.append(T(q.X(2.12), q.Y(-158) + 2, "狭い帯域（幅 100 kHz）", "start", 9.5, ALI, True, halo=True))
    # 連続波（帯域の中）
    o.append(W(q.X(-0.42), q.Y(_F20_N0), q.X(-0.42), q.Y(-146), c=ALI, lw=2.4))
    o.append(_head(q.X(-0.42), q.Y(-150), q.X(-0.42), q.Y(-144), ALI, 7))
    o.append(T(q.X(-0.5), q.Y(-146) + 3, "連続波（1 本の線）", "end", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0.12), q.y + 12, "受信機の帯域 ±1.023 MHz", "start", 9.5, SIG, False, halo=True))
    return SVG(700, q.y + q.h + 44, o, "(a) 帯域の外と内の妨害（9 章 4 節の例の電波と相互変調の積）。(b) 雑音の床（9 章 1 節の例の受信機、183.5 K）と衛星の信号、帯域内の妨害の形。連続波は電力が 1 つの周波数に集まるので、密度ではなく線で描いた。")


F["e20_inout"] = _f20_inout_fig()


# =====================================================================
# 2 節: 立ち上がりの時間と、高調波の包絡線（クロック 25 MHz の例）
# =====================================================================
_F20_TRS = [(1e-9, ALI, None, "1 ns"), (3e-9, GLD, "6 3", "3 ns"), (10e-9, GRN, "2 3", "10 ns")]


def _f20_edges_fig():
    o = []
    A, f, d, _ = _F20_SRC_CLK
    tau = d / f
    o.append(T(14, 18, "(a) 1 周期の波形（25 MHz・3.3 V）", "start", 11.5, INK, True))
    p = Plot(60, 40, 196, 150, (0, 40), (-0.3, 3.8))
    o.append(p.axes(xl="時間 t [ns]", yl="電圧 [V]", xt=[0, 10, 20, 30, 40], yt=[0, 1, 2, 3], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    for tr, c, dash, lab in _F20_TRS:
        t1 = tr * 1e9
        pts = [(0, 0), (t1, A), (20, A), (20 + t1, 0), (40, 0)]
        o.append(p.line(pts, c=c, lw=2, dash=dash))
    o.append(LEGL(60, 236, [(c, dash, "t_r = " + lab) for tr, c, dash, lab in _F20_TRS], 9.5, 10))
    # (b) 包絡線と線
    o.append(T(300, 18, "(b) 高調波の高さ（包絡線と、1 ns のときの線）", "start", 11.5, INK, True))
    q = Plot(350, 40, 330, 190, (1e6, 3e9), (20, 150), xlog=True)
    o.append(RECT(q.X(1164e6), q.y, q.X(1610e6) - q.X(1164e6), q.h, 0, SSOFT, "none", 0))
    o.append(q.axes(xl="周波数 f [Hz]", yl="線の高さ [dBμV]", xt=[1e6, 1e7, 1e8, 1e9], yt=[20, 40, 60, 80, 100, 120, 140],
                    xfmt=lambda v: {1e6: "1 M", 1e7: "10 M", 1e8: "100 M", 1e9: "1 G"}.get(v, ""), yfmt=lambda v: "%d" % v))
    body = []
    n = 1
    while n * f <= 3e9:
        v = _f20_trap(A, f, tau, 1e-9, n)
        if v > 1e-7:
            body.append(W(q.X(n * f), q.y + q.h, q.X(n * f), q.Y(max(20, _f20_dbuv(v))), c=ALI, lw=0.8))
        n += 1
    o.append(_f20_clip(q.x, q.y, q.w, q.h, body))
    fs = _f20_np.logspace(6, math.log10(3e9), 240)
    for tr, c, dash, lab in _F20_TRS:
        o.append(q.clip([(x, _f20_dbuv(_f20_trenv(A, f, tau, tr, x))) for x in fs], c=c, lw=2.2, dash=dash))
    fc1 = 1 / (math.pi * tau)
    o.append(W(q.X(fc1), q.y, q.X(fc1), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(fc1) + 3, q.y + 12, "1/(πτ) = %.1f MHz" % (fc1 / 1e6), "start", 9, MUT, False, halo=True))
    fc2 = 1 / (math.pi * 1e-9)
    o.append(W(q.X(fc2), q.y, q.X(fc2), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(fc2) - 3, q.y + 26, "1/(πt_r) = %d MHz（1 ns）" % round(fc2 / 1e6), "end", 9, MUT, False, halo=True))
    o.append(T(q.X(1400e6), q.y + q.h - 6, "GNSS の帯域", "middle", 9, SIG, True, halo=True))
    vals = []
    for tr, c, dash, lab in _F20_TRS:
        vals.append((_f20_dbuv(_f20_trap(A, f, tau, tr, 63)), c, lab))
    for i, (v, c, lab) in enumerate(vals):
        o.append(D(q.X(1575e6), q.Y(v), c, 3.6))
        o.append(T(q.X(1575e6) - 6, q.Y(v) + 4 + (0 if i else -2), "%.1f" % v, "end", 9.5, c, True, halo=True))
    o.append(TX(686, 290, "L1（63 次、1575.000 MHz）の線: %.1f・%.1f・%.1f dBμV（t_r = 1・3・10 ns）" % (vals[0][0], vals[1][0], vals[2][0]), "end", 9.5, INK))
    return SVG(700, 300, o, "クロックの例（25 MHz・3.3 V・時間の割合 50 %、幅 τ = 20 ns）。包絡線は台形の波の式、細い線は立ち上がり 1 ns のときの各次の高調波（偶数次は 0）。")


F["e20_edges"] = _f20_edges_fig()


# =====================================================================
# 2 節: 4 つの源 — 波形・L1 のまわりのスペクトラム・L1 の帯域に入る電力（例の値）
# =====================================================================
def _f20_sources_fig():
    o = []
    hy = 30
    o.append(T(14, hy, "源（例の値）", "start", 10, INK, True))
    o.append(T(250, hy, "電圧の波形", "middle", 10, INK, True))
    o.append(T(455, hy, "L1 のまわり（±3 MHz）の 1 MHz ごとの電力", "middle", 10, INK, True))
    o.append(T(628, hy - 12, "L1 の帯域に", "middle", 10, INK, True))
    o.append(T(628, hy, "入る電力", "middle", 10, INK, True))
    rows = [
        ("DC-DC", ["5 V・2 MHz・t_r 2 ns", "切り替えの後にリンギング"], "dcdc"),
        ("クロック", ["3.3 V・25 MHz・t_r 1 ns", "（2 節の図と同じ）"], "clk"),
        ("速い信号の線", ["USB 3.0: ±0.5 V・5 Gbit/s", "USB 2.0: ±0.4 V・480 Mbit/s"], "usb"),
        ("1PPS の線", ["3.3 V・t_r 3 ns", "1 秒に 2 回だけ切り替わる"], "pps"),
    ]
    rh = 78
    for i, (nm, lines, key) in enumerate(rows):
        y = hy + 14 + i * rh
        o.append(W(10, y - 4, 690, y - 4, c=LIN, lw=0.8))
        o.append(T(14, y + 16, nm, "start", 11, ALI, True))
        for k, l in enumerate(lines):
            o.append(TX(14, y + 33 + k * 14, l, "start", 9, MUT))
        # 波形
        wx, wy, ww, wh = 172, y + 8, 156, 52
        o.append(RECT(wx, wy, ww, wh, 4, SCR, LIN, 0.8))
        if key == "dcdc":
            pts = []
            for k in range(0, 157):
                t = k / 156.0
                ph = t * 2.6 % 1.0
                v = 1.0 if ph < 0.66 else 0.0
                if ph < 0.66 and ph < 0.10:
                    v = 1.0 + 0.35 * math.exp(-ph * 60) * math.cos(ph * 260)
                pts.append((wx + 4 + t * (ww - 8), wy + wh - 8 - v * (wh - 22)))
            o.append(PL(pts, c=ALI, lw=1.4))
        elif key == "clk":
            pts = []
            for k in range(7):
                x0 = wx + 6 + k * 22
                pts += [(x0, wy + wh - 8), (x0 + 1.5, wy + 10), (x0 + 11, wy + 10), (x0 + 12.5, wy + wh - 8)]
            o.append(PL(pts, c=ALI, lw=1.4))
        elif key == "usb":
            r = _f20_np.random.default_rng(3)
            bits = r.integers(0, 2, 30)
            pts = []
            for k, b_ in enumerate(bits):
                x0 = wx + 6 + k * 4.8
                yv = wy + 12 if b_ else wy + wh - 10
                pts += [(x0, yv), (x0 + 4.8, yv)]
            o.append(PL(pts, c=ALI, lw=1.2))
        else:
            o.append(PL([(wx + 6, wy + wh - 8), (wx + 50, wy + wh - 8), (wx + 51, wy + 12), (wx + 70, wy + 12), (wx + 71, wy + wh - 8), (wx + ww - 6, wy + wh - 8)], c=ALI, lw=1.4))
            o.append(T(wx + ww - 8, wy + 22, "1 秒", "end", 9, MUT))
        # スペクトラム（1 MHz ごとの電力 [dBm]）
        p = Plot(370, y + 8, 170, 52, (-3, 3), (-140, -20))
        o.append(RECT(p.X(-_F20_HB), p.y, p.X(_F20_HB) - p.X(-_F20_HB), p.h, 0, SSOFT, "none", 0))
        o.append(RECT(p.x, p.y, p.w, p.h, 0, "none", LIN, 0.8))
        for v in (-140, -80, -20):
            o.append(T(p.x - 4, p.Y(v) + 3, _f20_m(v, 0), "end", 8.5, MUT))
        if key == "dcdc":
            A_, f_, d_, tr_ = _F20_SRC_DCDC
            for n in range(786, 790):
                fr = n * 2.0 - _F20_L1
                v = _f20_dbm50(_f20_trap(A_, f_, d_ / f_, tr_, n))
                inb = abs(fr) <= _F20_HB
                o.append(_f20_spike(p, fr, v, ALI if inb else MUT, 1.8))
        elif key == "clk":
            o.append(_f20_spike(p, 1575.0 - _F20_L1, _F20_LV["clk"], ALI, 2))
        elif key == "usb":
            l3 = _f20_nrz(*_F20_SRC_USB3, _F20_L1 * 1e6) + 60
            l2 = _f20_nrz(*_F20_SRC_USB2, _F20_L1 * 1e6) + 60
            o.append(p.line([(-3, l3), (3, l3)], c=ALI, lw=2))
            o.append(p.line([(-3, l2), (3, l2)], c=ALI, lw=1.6, dash="5 3"))
            o.append(T(p.X(2.9), p.Y(l3) - 3, "3.0", "end", 8.5, ALI, True, halo=True))
            o.append(T(p.X(2.9), p.Y(l2) - 3, "2.0", "end", 8.5, ALI, True, halo=True))
        else:
            lp = _F20_LV["pps_psd"] + 60
            o.append(p.line([(-3, lp), (3, lp)], c=ALI, lw=2))
            o.append(T(p.X(0), p.Y(lp) - 6, "平均（縁の瞬間だけ強い）", "middle", 8.5, ALI, False, halo=True))
        if i == 3:
            for v in (-3, 0, 3):
                o.append(T(p.X(v), p.y + p.h + 12, ("L1" if v == 0 else _f20_m(v, 0)), "middle", 8.5, MUT))
        # 電力
        if key == "dcdc":
            txt = [("%s dBm" % _f20_m(_F20_LV["dcdc"]), True), ("1 本（788 次）", False)]
        elif key == "clk":
            txt = [("%s dBm" % _f20_m(_F20_LV["clk"]), True), ("1 本（63 次）", False)]
        elif key == "usb":
            txt = [("%s dBm（3.0）" % _f20_m(_F20_LV["usb3"]), True), ("%s dBm（2.0）" % _f20_m(_F20_LV["usb2"]), True)]
        else:
            txt = [("%s dBm" % _f20_m(_F20_LV["pps"]), True), ("平均", False)]
        for k, (t_, b_) in enumerate(txt):
            o.append(T(628, y + 28 + k * 16, t_, "middle", 10 if b_ else 9, ALI if b_ else MUT, b_))
    yb = hy + 14 + 4 * rh
    o.append(T(455, yb + 10, "横軸: L1 からの周波数の差 [MHz]、縦軸: 電力 [dBm]", "middle", 9, MUT))
    return SVG(700, yb + 18, o, "源の所の電圧を 50 Ω の線に出したとしたときの値（例のモデル: DC-DC とクロックは台形の波、USB はでたらめなデータ、1PPS は縁の平均）。青い帯は L1 の受信機の帯域 ±1.023 MHz。")


F["e20_sources"] = _f20_sources_fig()


# =====================================================================
# 3 節: 高調波の並び（櫛）と帯域の窓
# =====================================================================
def _f20_comb_fig():
    o = []
    o.append(T(14, 18, "高調波の並び（f おきの線）と帯域の幅", "start", 11.5, INK, True))
    rows = [(1.5, "L1", 1575.42, 1.023, 4.0, "f = 1.5 MHz", "間隔が帯域の幅 2.046 MHz より狭い: 必ず入る"),
            (2.7, "L1", 1575.42, 1.023, 4.0, "f = 2.7 MHz", "間隔が帯域の幅より広い: 入らないこともある"),
            (16.0, "L5", 1176.45, 10.23, 24.0, "f = 16 MHz", "L5 の帯域の幅 20.46 MHz より狭い: 必ず入る")]
    for i, (f, bn, fc, hb, span, lab, note) in enumerate(rows):
        y = 40 + i * 86
        p = Plot(150, y + 8, 520, 34, (fc - span, fc + span), (0, 1))
        o.append(RECT(p.X(fc - hb), p.y, p.X(fc + hb) - p.X(fc - hb), p.h, 0, SSOFT, "none", 0))
        o.append(W(p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.1))
        n0 = math.ceil((fc - span) / f); n1 = math.floor((fc + span) / f)
        nin = []
        for n in range(n0, n1 + 1):
            fr = n * f
            inb = abs(fr - fc) <= hb + 1e-9
            if inb:
                nin.append(n)
            o.append(W(p.X(fr), p.y + p.h, p.X(fr), p.y + 4, c=ALI if inb else MUT, lw=2.2 if inb else 1.3))
            o.append(T(p.X(fr), p.y - 3, "%.1f" % fr if f < 10 else "%d" % round(fr), "middle", 8.5, ALI if inb else MUT, inb, halo=True))
        o.append(T(14, y + 22, lab, "start", 10.5, INK, True))
        o.append(T(14, y + 37, "%s の帯域に %d 本" % (bn, len(nin)), "start", 9.5, ALI if nin else GRN, True))
        step = 1 if span < 10 else 4
        for v in range(-int(span), int(span) + 1, step):
            o.append(W(p.X(fc + v), p.y + p.h, p.X(fc + v), p.y + p.h + 3, c=MUT, lw=1))
            o.append(T(p.X(fc + v), p.y + p.h + 13, (bn if v == 0 else (("+%d" % v) if v > 0 else _f20_m(v, 0))), "middle", 8.5, MUT))
        o.append(T(p.x + p.w, y + 74, note, "end", 9.5, ALI if nin else GRN, False))
    return SVG(700, 40 + 3 * 86 + 2, o, "線の上の数は高調波の周波数 [MHz]、目盛は帯域の中心からの差 [MHz]。青い帯は受信機の帯域（L1 C/A ±1.023 MHz、L5 ±10.23 MHz）。")


F["e20_comb"] = _f20_comb_fig()


# =====================================================================
# 3 節: 最も近い高調波と L1 の中心の差（のこぎりの歯）。20〜40 MHz のクロック
# =====================================================================
def _f20_saw_fig():
    o = []
    fc = _F20_L1
    o.append(TX(14, 18, "f の整数倍のうち L1 に最も近いものと、L1 の中心の差（20〜40 MHz のクロック）", "start", 11.5, INK, True))
    p = Plot(64, 36, 610, 200, (20, 40), (0, 12))
    o.append(p.axes(xl="源の周波数 f [MHz]", yl="中心からの差 [MHz]", xt=[20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40], yt=[0, 2, 4, 6, 8, 10, 12],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    pts = []
    nmax = int(fc / 20) + 2; nmin = int(fc / 40) - 1
    for n in range(nmax, nmin - 1, -1):
        for fa in (fc / (n + 0.5), fc / n):
            pts.append((fa, abs(n * fa - fc)))
    pts.append((fc / (nmin - 0.5), abs(nmin * fc / (nmin - 0.5) - fc)))
    pts = [q for q in pts if 19.5 <= q[0] <= 40.5]
    pts.sort()
    o.append(p.clip(pts, c=MUT, lw=1.3))
    # 帯域の半分の幅より下（帯域に入る）を赤く
    yl = p.Y(_F20_HB)
    o.append(_f20_clip(p.x, yl, p.w, p.y + p.h - yl, p.clip(pts, c=ALI, lw=2.6)))
    o.append(W(p.x, yl, p.x + p.w, yl, c=ALI, lw=1, dash="4 3"))
    o.append(T(p.X(36.6), yl - 4, "1.023 MHz: これより下なら L1 C/A の帯域に入る", "end", 9.5, ALI, True, halo=True))
    y2 = p.Y(2.046)
    o.append(W(p.x, y2, p.x + p.w, y2, c=GLD, lw=1, dash="2 3"))
    o.append(T(p.X(36.6), y2 - 4, "2.046 MHz: E1・B1C（BOC）の帯域", "end", 9.5, GLD, True, halo=True))
    for f, dy in ((24.0, -8), (25.0, -8), (26.0, -8), (27.0, -8), (32.0, -8), (38.4, 15)):
        n = round(fc / f); d = abs(n * f - fc)
        dd = min(d, 11.6)
        c = ALI if d <= _F20_HB else MUT
        o.append(D(p.X(f), p.Y(dd), c, 3.8))
        lab = "%g MHz: %d 倍 %.3f" % (f, n, n * f)
        o.append(T(p.X(f), p.Y(dd) + dy, lab, "middle", 9, c, True, halo=True))
    return SVG(700, 284, o, "歯の底（差 0）は f = 1575.42/n（n は整数）の所。点は例の周波数。")


F["e20_saw"] = _f20_saw_fig()


# =====================================================================
# 4 節: 広い帯域の雑音 — 雑音の床が上がる
# =====================================================================
def _f20_floor_fig():
    o = []
    o.append(TX(14, 18, "(a) 帯域に平らな妨害（N_J = N_0 の例）", "start", 11.5, INK, True))
    p = Plot(70, 38, 250, 170, (-3, 3), (-196, -164))
    o.append(RECT(p.X(-_F20_HB), p.y, p.X(_F20_HB) - p.X(-_F20_HB), p.h, 0, SSOFT, "none", 0))
    o.append(p.axes(xl="L1 からの周波数の差 [MHz]", yl="電力スペクトル密度 [dBm/Hz]", xt=[-3, -2, -1, 0, 1, 2, 3], yt=[-195, -185, -175, -165],
                    xfmt=lambda v: _f20_m(v, 0) if v else "0", yfmt=lambda v: _f20_m(v, 0)))
    xs = _f20_np.linspace(-3, 3, 301)
    o.append(p.clip([(x, _F20_C + _F20_TCDB + 10 * math.log10(max(_f20_sinc2(x / 1.023), 1e-12))) for x in xs], c=SIG, lw=2))
    o.append(p.line([(-3, _F20_N0), (3, _F20_N0)], c=TEA, lw=2))
    o.append(p.line([(-_F20_HB, _F20_N0 + 3.01), (_F20_HB, _F20_N0 + 3.01)], c=ALI, lw=2.2, dash="6 3"))
    o.append(TX(p.X(-2.9), p.Y(_F20_N0) + 13, "雑音の床 N_0", "start", 9.5, TEA, True, halo=True))
    o.append(TX(p.X(0), p.Y(_F20_N0 + 3.01) - 6, "N_0 + N_J（+3.0 dB）", "middle", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0), p.Y(-191), "衛星の信号", "middle", 9.5, SIG, True, halo=True))
    # (b) N_J/N0 と C/N0
    o.append(TX(366, 18, "(b) N_J/N_0 と等価な C/N_0", "start", 11.5, INK, True))
    q = Plot(420, 38, 260, 170, (-20, 30), (15, 50))
    o.append(q.axes(xl="N_J/N_0 [dB]", yl="等価な C/N_0 [dB-Hz]", xt=[-20, -10, 0, 10, 20, 30], yt=[15, 20, 25, 30, 35, 40, 45, 50],
                    xfmt=lambda v: _f20_m(v, 0), yfmt=lambda v: "%d" % v))
    for th, lab in ((_F20_ACQ, "捕捉の目安 35"), (_F20_TRK, "追尾の目安 25")):
        o.append(W(q.x, q.Y(th), q.x + q.w, q.Y(th), c=MUT, lw=1, dash="4 3"))
        o.append(T(q.x + 4, q.Y(th) - 4, lab, "start", 9, MUT, False, halo=True))
    xs = _f20_np.linspace(-20, 30, 201)
    o.append(q.clip([(x, _F20_CN0 - _f20_drop(10 ** (x / 10))) for x in xs], c=ALI, lw=2.4))
    pts = [(_f20_db(_F20_R1DB), "1 dB 下がる", 4, -9, "start"), (0.0, "3.0 dB 下がる", 6, 14, "start")]
    for x, lab, dx, dy, a in pts:
        y = _F20_CN0 - _f20_drop(10 ** (x / 10))
        o.append(D(q.X(x), q.Y(y), ALI, 3.8))
        o.append(T(q.X(x) + dx, q.Y(y) + dy, "%s（%s dB）" % (lab, _f20_m(x)), a, 9, ALI, True, halo=True))
    for x, y, lab in ((22.97, 24.51, "10 章 2 節の例（LDO なし）"), (8.81, 38.15, "LDO あり")):
        o.append(D(q.X(x), q.Y(y), PUR, 4))
        o.append(T(q.X(x) - 6, q.Y(y) + (14 if x > 20 else 13), lab, "end", 9, PUR, True, halo=True))
    return SVG(700, 248, o, "(a) 雑音の床（9 章 1 節の例の受信機）に、同じ密度の妨害が加わった例。(b) 本文の式の下がり方。紫の点は 10 章 2 節の電源の雑音の例（2 MHz・20 mVpp）。")


F["e20_floor"] = _f20_floor_fig()


# =====================================================================
# 4 節: 連続波は逆拡散で広げられる（P_J = −106 dBm、L1 から −0.42 MHz の例）
# =====================================================================
_F20_PJX = _F20_N0 + 70.0            # 例の連続波 −106.0 dBm（P_J/N0 = 70 dB-Hz）
_F20_DFX = -0.42                     # 例の連続波の周波数の差 [MHz]（25 MHz の 63 倍の高調波）


def _f20_despread_fig():
    o = []
    pj = _F20_PJX
    ytop = -140
    o.append(T(14, 18, "(a) 逆拡散の前", "start", 11.5, INK, True))
    o.append(T(366, 18, "(b) 局部の符号を掛けた後", "start", 11.5, INK, True))
    for k, x0 in enumerate((70, 420)):
        p = Plot(x0, 38, 250, 160, (-2.5, 2.5), (-200, ytop))
        o.append(RECT(p.X(-_F20_HB), p.y, p.X(_F20_HB) - p.X(-_F20_HB), p.h, 0, SSOFT, "none", 0))
        o.append(p.axes(xl="搬送波からの周波数の差 [MHz]", yl="電力スペクトル密度 [dBm/Hz]" if k == 0 else None, xt=[-2, -1, 0, 1, 2], yt=[-200, -190, -180, -170, -160, -150, -140],
                        xfmt=lambda v: _f20_m(v, 0) if v else "0", yfmt=lambda v: _f20_m(v, 0)))
        o.append(p.line([(-2.5, _F20_N0), (2.5, _F20_N0)], c=TEA, lw=2))
        xs = _f20_np.linspace(-2.5, 2.5, 301)
        if k == 0:
            o.append(p.clip([(x, _F20_C + _F20_TCDB + 10 * math.log10(max(_f20_sinc2(x / 1.023), 1e-12))) for x in xs], c=SIG, lw=2))
            o.append(W(p.X(_F20_DFX), p.Y(_F20_N0), p.X(_F20_DFX), p.Y(-143), c=ALI, lw=2.4))
            o.append(_head(p.X(_F20_DFX), p.Y(-147), p.X(_F20_DFX), p.Y(-141), ALI, 7))
            o.append(T(p.X(_F20_DFX) + 6, p.Y(-146), "連続波 %s dBm" % _f20_m(pj, 0), "start", 9.5, ALI, True, halo=True))
            o.append(T(p.X(1.3), p.Y(-192), "衛星の信号", "middle", 9.5, SIG, True, halo=True))
            o.append(T(p.X(-2.4), p.Y(_F20_N0) + 13, "雑音の床", "start", 9.5, TEA, True, halo=True))
        else:
            o.append(p.clip([(x, pj + _F20_TCDB + 10 * math.log10(max(_f20_sinc2((x - _F20_DFX) / 1.023), 1e-12))) for x in xs], c=ALI, lw=2.2))
            o.append(W(p.X(0), p.Y(_F20_N0), p.X(0), p.Y(-143), c=SIG, lw=2.4))
            o.append(_head(p.X(0), p.Y(-147), p.X(0), p.Y(-141), SIG, 7))
            o.append(TX(p.X(0.08), p.Y(-146), "信号: 幅 1/T_{coh} ほどに集まる", "start", 9.5, SIG, True, halo=True))
            yv = pj + _F20_TCDB + 10 * math.log10(_f20_sinc2(-_F20_DFX / 1.023))
            o.append(D(p.X(0), p.Y(yv), ALI, 3.6))
            o.append(T(p.X(-2.45), p.Y(-188), "連続波: 符号のスペクトラムの形に", "start", 9.5, ALI, True, halo=True))
            o.append(T(p.X(-2.45), p.Y(-188) + 13, "広がる（1 kHz おきの線の並び）", "start", 9.5, ALI, True, halo=True))
            o.append(T(p.X(0.12), p.Y(yv) + 4, "床の %s dB 上" % _f20_m(yv - _F20_N0), "start", 9, ALI, True, halo=True))
            o.append(T(p.X(2.4), p.Y(_F20_N0) + 13, "雑音の床（変わらない）", "end", 9.5, TEA, True, halo=True))
    # (c) 窓のまわりの拡大
    y0 = 248
    o.append(TX(14, y0, "(c) 搬送波のまわりの拡大: 広がった連続波の線（1 kHz おき）と相関器の窓（衛星のドップラー −0.25 kHz の例）", "start", 11.5, INK, True))
    p = Plot(70, y0 + 20, 610, 150, (-5, 5), (-166, -128))
    o.append(p.axes(xl="搬送波からの周波数の差 [kHz]", yl="線の電力 [dBm]", xt=[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], yt=[-165, -155, -145, -135],
                    xfmt=lambda v: _f20_m(v, 0) if v else "0", yfmt=lambda v: _f20_m(v, 0)))
    o.append(RECT(p.X(-0.5), p.y, p.X(0.5) - p.X(-0.5), p.h, 0, GOSOFT, "none", 0))
    o.append(RECT(p.X(-0.025), p.y, max(2.0, p.X(0.025) - p.X(-0.025)), p.h, 0, GLD, "none", 0, op=0.6))
    o.append(T(p.X(-0.55), p.y + 12, "1 ms の窓（幅 1 kHz）", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.08), p.y + 12, "20 ms の窓（幅 50 Hz）", "start", 9.5, GLD, True, halo=True))
    L = _f20_lines(1)
    dfj = _F20_DFX * 1000 + 0.25          # [kHz] ドップラー −0.25 kHz のとき、線は k − 419.75 kHz
    for kk in range(410, 430):
        fr = dfj + kk
        if -5 <= fr <= 5:
            v = pj + _f20_db(L[kk])
            o.append(W(p.X(fr), p.y + p.h, p.X(fr), p.Y(max(-166, v)), c=ALI, lw=2.2))
            o.append(D(p.X(fr), p.Y(max(-166, v)), ALI, 2.6))
    for nz, lab in ((_F20_N0 + 30, "1 ms の窓に入る雑音 %s dBm"), (_F20_N0 + 10 * math.log10(50), "20 ms の窓に入る雑音 %s dBm")):
        o.append(W(p.x, p.Y(nz), p.x + p.w, p.Y(nz), c=TEA, lw=1.4, dash="5 3"))
        o.append(T(p.x + p.w - 4, p.Y(nz) - 4, lab % _f20_m(nz), "end", 9.5, TEA, True, halo=True))
    return SVG(700, y0 + 20 + 150 + 42, o, "連続波 −106 dBm（L1 から −0.42 MHz。25 MHz の 63 倍の高調波）と PRN 1 の信号。(c) の線の高さは、PRN 1 の符号のスペクトラムの各線の電力の割合に連続波の電力を掛けた値。")


F["e20_despread"] = _f20_despread_fig()


# =====================================================================
# 4 節: 相関器から見た符号のスペクトラム S~ と、連続波の周波数による C/N0（PRN 1）
# =====================================================================
# 検証の点: 複素ベースバンドのシミュレーション（PRN 1・1 チップに 8 標本・C/N0 47.46 dB-Hz・P_J/N0 = 70 dB-Hz、
# 1 ms は 500 回、20 ms は 700 回の積分の揺れから測った値。$SP/g20/simcw_final.py）
_F20_SIMCW = {1: [(0, 47.60), (1000, 39.92), (2500, 41.12), (5000, 36.02), (6500, 33.58), (7000, 31.78), (7500, 41.25), (9000, 41.92)],
              20: [(0, 46.77), (1000, 27.72), (2500, 47.49), (5000, 23.28), (6500, 47.47), (7000, 18.80), (7500, 47.53), (9000, 30.41)]}


def _f20_lines_fig():
    o = []
    fs = _f20_np.linspace(0, 10000, 2001)
    s1 = _f20_st(1, fs, 1); s20 = _f20_st(1, fs, 20)
    o.append(TX(14, 18, "(a) 相関器から見た符号のスペクトラム S̃(Δf_J)（PRN 1）", "start", 11.5, INK, True))
    p = Plot(70, 38, 610, 170, (0, 10), (-90, -40))
    o.append(p.axes(xl="連続波と搬送波の周波数の差 Δf_J [kHz]", yl="10 log_{10} S̃ [dB/Hz]", xt=list(range(0, 11)), yt=[-90, -80, -70, -60, -50, -40],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: _f20_m(v, 0)))
    for k in range(0, 11):
        v = 10 * math.log10(max(_f20_st(1, [k * 1000.0], 20)[0], 1e-30))
        o.append(W(p.X(k), p.y + p.h, p.X(k), p.Y(max(-90, v)), c=GLD, lw=2.2))
        o.append(D(p.X(k), p.Y(max(-90, v)), GLD, 3.2))
    o.append(p.clip([(f / 1000, 10 * math.log10(max(v, 1e-30))) for f, v in zip(fs, s1)], c=SIG, lw=2.2))
    o.append(W(p.x, p.Y(_F20_TCDB), p.x + p.w, p.Y(_F20_TCDB), c=MUT, lw=1.2, dash="6 3"))
    o.append(W(p.x, p.Y(_F20_BDB), p.x + p.w, p.Y(_F20_BDB), c=TEA, lw=1.2, dash="2 3"))
    o.append(TX(p.X(9.95), p.Y(_F20_TCDB) - 4, "平均 T_c（−60.1 dB）", "end", 9.5, MUT, True, halo=True))
    o.append(T(p.X(9.95), p.Y(_F20_BDB) + 13, "同じ電力を帯域 2.046 MHz に平らに広げたとき（−63.1 dB）", "end", 9.5, TEA, True, halo=True))
    o.append(LEGL(80, 258, [(SIG, None, "T_{coh} = 1 ms"), (GLD, None, "T_{coh} = 20 ms（1 kHz おきの線の高さ。線の間は 0 に近い）")], 9.5, 14))
    o.append(T(p.X(0.1), p.Y(-88), "0 の線は −90.2 dB（符号の和は −1）", "start", 9, MUT, False, halo=True))
    # (b) C/N0
    y0 = 290
    o.append(TX(14, y0, "(b) 連続波 −106 dBm（P_J/N_0 = 70 dB-Hz）があるときの等価な C/N_0", "start", 11.5, INK, True))
    q = Plot(70, y0 + 18, 610, 170, (0, 10), (15, 50))
    o.append(q.axes(xl="連続波と搬送波の周波数の差 Δf_J [kHz]", yl="等価な C/N_0 [dB-Hz]", xt=list(range(0, 11)), yt=[15, 20, 25, 30, 35, 40, 45, 50],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    for th, lab in ((_F20_ACQ, "捕捉の目安 35"), (_F20_TRK, "追尾の目安 25")):
        o.append(W(q.x, q.Y(th), q.x + q.w, q.Y(th), c=MUT, lw=1, dash="4 3"))
        o.append(T(q.x + q.w - 4, q.Y(th) - 4, lab, "end", 9, MUT, False, halo=True))
    for k in range(0, 11):
        v = _F20_CN0 - _f20_drop(10 ** 7.0 * _f20_st(1, [k * 1000.0], 20)[0])
        o.append(W(q.X(k), q.Y(_F20_CN0), q.X(k), q.Y(max(15, v)), c=GLD, lw=2.2))
    o.append(W(q.x, q.Y(_F20_CN0), q.x + q.w, q.Y(_F20_CN0), c=GLD, lw=1.2, dash="2 3"))
    o.append(q.clip([(f / 1000, _F20_CN0 - _f20_drop(10 ** 7.0 * v)) for f, v in zip(fs, s1)], c=SIG, lw=2.2))
    for M, c in ((1, SIG), (20, GLD)):
        for f, v in _F20_SIMCW[M]:
            o.append(CIRC(q.X(f / 1000), q.Y(v), 4.6, c=c, lw=1.6, fill=SCR))
    o.append(LEGL(80, y0 + 18 + 170 + 46, [(SIG, None, "式（1 ms）"), (GLD, None, "式（20 ms の線の所）")], 9.5, 14))
    o.append(CIRC(372, y0 + 18 + 170 + 42, 4.6, c=INK, lw=1.6, fill=SCR))
    o.append(T(382, y0 + 18 + 170 + 46, "シミュレーション（PRN 1 の信号＋雑音＋連続波）", "start", 9.5, MUT))
    return SVG(700, y0 + 18 + 170 + 56, o, "S̃ は PRN 1 の C/A 符号から計算した値。20 ms は線の中心の値だけを描いた（線から 50 Hz の倍数だけずれた所で 0、その間に小さな山がある）。(b) の点は 1 ms で 500 回、20 ms で 700 回の積分から測った値。")


F["e20_lines"] = _f20_lines_fig()


# =====================================================================
# 4 節: 強い連続波と量子化（4 章 3 節のモデル）・AGC の利得
# =====================================================================
# シミュレーション（$SP/g20/simq_final.py）: 中間周波数 4.092 MHz・16.368 MHz・幅 2.046 MHz の理想のフィルタ・PRN 1・C/N0 47.46 dB-Hz、
# 連続波は中間周波数 + 3 kHz。各点 600 回（連続波なしは 800 回）の 1 ms の積分から測った等価な C/N0
_F20_QJN = [-10, -5, 0, 5, 10, 15, 20, 25, 30]
_F20_QLIN = [46.60, 45.95, 43.60, 40.05, 35.91, 31.11, 25.98, 20.76, 14.62]
_F20_Q2 = [46.34, 45.63, 43.13, 39.47, 35.48, 30.16, 24.21, 18.76, 11.46]
_F20_Q1 = [45.42, 44.33, 41.45, 35.75, 30.00, 25.07, 19.26, 12.78, 6.89]
_F20_QBASE = (46.98, 46.81, 46.00)


def _f20_quant_fig():
    o = []
    o.append(TX(14, 18, "(a) 連続波の強さと等価な C/N_0（量子化のビット数で比べる）", "start", 11.5, INK, True))
    p = Plot(70, 38, 380, 210, (-10, 30), (5, 50))
    o.append(p.axes(xl="連続波の電力 ÷ 帯域の雑音の電力 [dB]", yl="等価な C/N_0 [dB-Hz]", xt=[-10, -5, 0, 5, 10, 15, 20, 25, 30], yt=[5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
                    xfmt=lambda v: _f20_m(v, 0), yfmt=lambda v: "%d" % v))
    st = _f20_db(_f20_st(1, [3000.0], 1)[0])
    base = _F20_CN0 - 0.44
    xs = _f20_np.linspace(-10, 30, 161)
    o.append(p.clip([(x, base - _f20_drop(10 ** ((x - _f20_db(1 / _F20_BW) + st) / 10))) for x in xs], c=MUT, lw=1.4, dash="6 3"))
    for data, c, lab in ((_F20_QLIN, GRN, None), (_F20_Q2, GLD, None), (_F20_Q1, ALI, None)):
        o.append(p.line(list(zip(_F20_QJN, data)), c=c, lw=2))
        for x, v in zip(_F20_QJN, data):
            o.append(D(p.X(x), p.Y(v), c, 3.4))
    o.append(T(p.X(30) - 6, p.Y(_F20_QLIN[-1]) - 9, "量子化しない", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(30) - 8, p.Y(_F20_Q2[-1]) + 4, "2 bit（AGC）", "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(14), p.Y(_F20_Q1[5]) + 4, "1 bit", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(-9.5), p.Y(8), "破線: 量子化しない場合の式", "start", 9, MUT, False, halo=True))
    # 1 bit の増える損失
    o.append(DARR(p.X(20), p.Y(_F20_QLIN[6]), p.X(20), p.Y(_F20_Q1[6]), c=ALI, lw=1.2, head=5))
    o.append(T(p.X(20) - 5, (p.Y(_F20_QLIN[6]) + p.Y(_F20_Q1[6])) / 2 + 8, "%.1f dB" % (_F20_QLIN[6] - _F20_Q1[6]), "end", 9.5, ALI, True, halo=True))
    # (b) AGC の利得
    o.append(T(486, 18, "(b) AGC の利得の変化", "start", 11.5, INK, True))
    q = Plot(530, 38, 150, 210, (-10, 30), (-32, 2))
    o.append(q.axes(xl="P_J/N [dB]", yl="利得の変化 [dB]", xt=[-10, 0, 10, 20, 30], yt=[-30, -20, -10, 0], xfmt=lambda v: _f20_m(v, 0), yfmt=lambda v: _f20_m(v, 0)))
    o.append(q.clip([(x, -_f20_drop(10 ** (x / 10))) for x in xs], c=PUR, lw=2.2))
    for x in (0, 20):
        y = -_f20_drop(10 ** (x / 10))
        o.append(D(q.X(x), q.Y(y), PUR, 3.6))
        o.append(T(q.X(x) + 5, q.Y(y) - 5, _f20_m(y), "start", 9.5, PUR, True, halo=True))
    return SVG(700, 290, o, "4 章 3 節の量子化のモデル（中間周波数 4.092 MHz・16.368 MHz で標本・幅 2.046 MHz の理想のフィルタ・PRN 1）に、中間周波数 + 3 kHz の連続波を足したシミュレーション（各点 600 回の 1 ms の積分）。2 bit のしきい値は、入力の全体の標準偏差（AGC が合わせる大きさ）の 1.0 倍。")


F["e20_quant"] = _f20_quant_fig()


# =====================================================================
# 4 節: 妨害の電力と C/N0、源から受信機までに要る減衰
# =====================================================================
def _f20_cn0budget_fig():
    o = []
    o.append(TX(14, 18, "(a) 妨害の電力と等価な C/N_0（例の受信機）", "start", 11.5, INK, True))
    p = Plot(70, 38, 380, 230, (-140, -80), (10, 50))
    o.append(p.axes(xl="受信機の入力の妨害の電力 P_J [dBm]", yl="等価な C/N_0 [dB-Hz]", xt=[-140, -130, -120, -110, -100, -90, -80], yt=[10, 15, 20, 25, 30, 35, 40, 45, 50],
                    xfmt=lambda v: _f20_m(v, 0), yfmt=lambda v: "%d" % v))
    for th, lab in ((_F20_ACQ, "捕捉の目安 35"), (_F20_TRK, "追尾の目安 25")):
        o.append(W(p.x, p.Y(th), p.x + p.w, p.Y(th), c=MUT, lw=1, dash="4 3"))
        o.append(T(p.x + p.w - 4, p.Y(th) - 4, lab, "end", 9, MUT, False, halo=True))
    s7 = _f20_db(_f20_st(1, [7000.0], 1)[0]); s7b = _f20_db(_f20_st(1, [7000.0], 20)[0])
    curves = [(_F20_BDB, TEA, None, "平らな雑音（2.046 MHz）"), (_F20_TCDB, ALI, None, "連続波（平均）"),
              (s7, ALI, "6 3", "連続波が線に重なる（1 ms）"), (s7b, ALI, "2 3", "連続波が線に重なる（20 ms）")]
    xs = _f20_np.linspace(-140, -80, 241)
    for sdb, c, dash, lab in curves:
        o.append(p.clip([(x, _f20_cn0eq(x, sdb)) for x in xs], c=c, lw=2.2, dash=dash))
    o.append(W(p.X(-120), p.y, p.X(-120), p.y + p.h, c=PUR, lw=1, dash="3 3"))
    o.append(T(p.X(-120) + 4, p.y + 12, "−120 dBm（9 章 4 節の相互変調の積）", "start", 9, PUR, True, halo=True))
    for sdb, c, dash, lab in curves[1:]:
        v = _f20_cn0eq(-120, sdb)
        o.append(D(p.X(-120), p.Y(v), c, 3.6))
        o.append(T(p.X(-120) - 5, p.Y(v) + 4, "%.1f" % v, "end", 9.5, c, True, halo=True))
    o.append(LEGL(76, 322, [(c, dash, lab) for sdb, c, dash, lab in curves[:2]], 9.5, 12))
    o.append(LEGL(76, 338, [(c, dash, lab) for sdb, c, dash, lab in curves[2:]], 9.5, 12))
    # (b) 要る減衰
    o.append(T(486, 18, "(b) 源から受信機の入力までに", "start", 11.5, INK, True))
    o.append(T(486, 34, "要る減衰（1 dB 下がるまで）", "start", 11.5, INK, True))
    items = [("クロック 25 MHz", _F20_LV["clk"] - _F20_P1CW, "連続波"), ("USB 3.0", _F20_LV["usb3"] - _F20_P1BB, "平らな雑音"),
             ("USB 2.0", _F20_LV["usb2"] - _F20_P1BB, "平らな雑音"), ("DC-DC 2 MHz", _F20_LV["dcdc"] - _F20_P1CW, "連続波 1 本"),
             ("1PPS（平均）", _F20_LV["pps"] - _F20_P1BB, "平らな雑音")]
    x0, wmax = 552, 100
    for i, (nm, db, kind) in enumerate(items):
        y = 62 + i * 46
        o.append(T(x0 - 6, y + 12, nm, "end", 9.5, INK, True))
        o.append(T(x0 - 6, y + 25, kind, "end", 8.5, MUT))
        if db > 0:
            w = wmax * db / 100.0
            o.append(RECT(x0, y, w, 18, 3, ASOFT, ALI, 1.2))
            o.append(T(x0 + w + 4, y + 13, "%.0f dB" % db, "start", 9.5, ALI, True))
        else:
            o.append(T(x0 + 2, y + 13, "要らない（%s dB）" % _f20_m(db, 0), "start", 9.5, GRN, True))
    o.append(W(x0, 58, x0, 62 + 5 * 46 - 22, c=MUT, lw=1))
    o.append(TX(486, 322, "許される電力: 連続波 %s dBm、" % _f20_m(_F20_P1CW), "start", 9, MUT))
    o.append(TX(486, 338, "平らな雑音 %s dBm（C/N_0 が 1 dB 下がる）" % _f20_m(_F20_P1BB), "start", 9, MUT))
    return SVG(700, 350, o, "(a) 9 章 1 節の例の受信機（C/N0 47.5 dB-Hz）。線に重なる例は PRN 1 の 7 kHz の線（−24.3 dB）。(b) 2 節の源の所の電力（例のモデル）と、C/N0 を 1 dB 下げる受信機の入力の電力との差。")


F["e20_cn0budget"] = _f20_cn0budget_fig()


# =====================================================================
# 5 節: 妨害の電波が届く距離（自由空間・0 dBi・帯域 2.046 MHz に平らな妨害）
# =====================================================================
_F20_LAM = 299792458.0 / (_F20_L1 * 1e6)


def _f20_lfs(d):
    return 20 * math.log10(4 * math.pi * d / _F20_LAM)


def _f20_jam_fig():
    o = []
    o.append(TX(14, 18, "妨害の電波の EIRP と、受信機までの距離による等価な C/N_0", "start", 11.5, INK, True))
    p = Plot(70, 36, 600, 220, (10, 1e5), (15, 50), xlog=True)
    o.append(p.axes(xl="妨害の源からの距離 [m]", yl="等価な C/N_0 [dB-Hz]", xt=[10, 100, 1000, 1e4, 1e5], yt=[15, 20, 25, 30, 35, 40, 45, 50],
                    xfmt=lambda v: {10: "10", 100: "100", 1000: "1 k", 1e4: "10 k", 1e5: "100 k"}.get(v, ""), yfmt=lambda v: "%d" % v))
    for th, lab in ((_F20_ACQ, "捕捉の目安 35"), (_F20_TRK, "追尾の目安 25")):
        o.append(W(p.x, p.Y(th), p.x + p.w, p.Y(th), c=MUT, lw=1, dash="4 3"))
        o.append(T(p.x + 4, p.Y(th) - 4, lab, "start", 9, MUT, False, halo=True))
    ds = _f20_np.logspace(1, 5, 241)
    rows = [(0.0, ALI, None, "1 mW（0 dBm）"), (10.0, ALI, "6 3", "10 mW（10 dBm）"), (20.0, ALI, "2 3", "100 mW（20 dBm）")]
    for eirp, c, dash, lab in rows:
        o.append(p.clip([(d, _f20_cn0eq(eirp - _f20_lfs(d), _F20_BDB)) for d in ds], c=c, lw=2.2, dash=dash))
        for th in (_F20_ACQ, _F20_TRK):
            pj = _f20_pj_for(th, _F20_BDB)
            d = _F20_LAM / (4 * math.pi) * 10 ** ((eirp - pj) / 20)
            o.append(D(p.X(d), p.Y(th), c, 3.8))
            o.append(T(p.X(d) + 4, p.Y(th) + 14, ("%.1f km" % (d / 1000)) if d >= 1000 else ("%d m" % round(d, -1)), "start", 9.5, c, True, halo=True))
    o.append(LEGL(80, 300, [(c, dash, "EIRP " + lab) for e, c, dash, lab in rows], 9.5, 16))
    return SVG(700, 312, o, "見通しのある自由空間で、妨害の源と受信機のアンテナの利得を 0 dBi、妨害は L1 の帯域 2.046 MHz に平らに広がるとした上限の目安（9 章 1 節の例の受信機）。")


F["e20_jam"] = _f20_jam_fig()


# =====================================================================
# 5 節: 近くの無線機の周波数と GNSS の帯域（範囲は例）
# =====================================================================
def _f20_radios_fig():
    o = []
    o.append(T(14, 18, "GNSS の帯域と、近くの無線機の周波数の例（範囲は例で、国・事業者・規格の版で違う）", "start", 11.5, INK, True))
    gn = [("L5・E5a", 1166.22, 1186.68), ("L2", 1226.58, 1228.62), ("L6・E6", 1273.64, 1283.87), ("B1I", 1559.05, 1563.14), ("L1・E1", 1573.37, 1577.47), ("G1", 1597.55, 1605.89)]
    rows = [(1150, 1680, 40, [("アマチュア無線 1200 MHz 帯", 1260, 1300, GLD, 0, "r"), ("1.5 GHz 帯の携帯電話（上り）", 1427.9, 1462.9, ALI, 1, "l"),
                              ("（下り）", 1475.9, 1510.9, ALI, 2, "l"), ("衛星の電話の受信（例）", 1525, 1559, PUR, 0, "l"), ("イリジウム", 1616, 1626.5, PUR, 1, "r"),
                              ("衛星の電話の送信（例）", 1626.5, 1660.5, PUR, 2, "l")]),
            (1680, 2500, 196, [("1.7 GHz 帯（上り）", 1710, 1785, ALI, 0, "r"), ("（下り）", 1805, 1880, ALI, 1, "r"), ("2 GHz 帯（上り）", 1920, 1980, ALI, 0, "r"),
                               ("（下り）", 2110, 2170, ALI, 1, "r"), ("2.4 GHz 帯（無線 LAN・Bluetooth）", 2400, 2483.5, TEA, 0, "l")])]
    xa, xb = 40, 680
    for k, (f0, f1, y, items) in enumerate(rows):
        X = lambda f, f0=f0, f1=f1: xa + (f - f0) / (f1 - f0) * (xb - xa)
        o.append(W(xa, y + 74, xb, y + 74, c=MUT, lw=1.2))
        step = 50 if k == 0 else 100
        v = int(math.ceil(f0 / step) * step)
        while v <= f1:
            o.append(W(X(v), y + 74, X(v), y + 78, c=MUT, lw=1))
            o.append(T(X(v), y + 90, "%d" % v, "middle", 9, MUT))
            v += step
        if k == 0:
            for nm, lo, hi in gn:
                o.append(RECT(X(lo), y + 6, max(2.5, X(hi) - X(lo)), 68, 1, SSOFT, SIG, 1.2))
            for nm, lo, hi in gn:
                xm = (X(lo) + X(hi)) / 2
                dx = {"B1I": -12, "L1・E1": 4, "G1": 16}.get(nm, 0)
                o.append(T(xm + dx, y + 2, nm, "middle", 9, SIG, True, halo=True))
        for nm, lo, hi, c, lev, side in items:
            yy = y + 22 + lev * 17
            o.append(RECT(X(lo), yy, max(2.5, X(hi) - X(lo)), 13, 2, soft(c), c, 1.1, op=0.85))
            if side == "r":
                o.append(T(X(hi) + 4, yy + 10, nm, "start", 9, c, True, halo=True))
            else:
                o.append(T(X(lo) - 4, yy + 10, nm, "end", 9, c, True, halo=True))
        o.append(T(xb, y + 104, "周波数 f [MHz]", "end", 9.5, MUT))
    # 組み合わせが L1 に落ちる例
    X2 = lambda f: xa + (f - 1680) / (2500 - 1680) * (xb - xa)
    X1 = lambda f: xa + (f - 1150) / (1680 - 1150) * (xb - xa)
    for f in (1712.71, 1850.0):
        o.append(W(X2(f), 196 + 74, X2(f), 196 + 4, c=ALI, lw=1.6))
        o.append(D(X2(f), 196 + 4, ALI, 3.2))
    o.append(CARR(X2(1781), 196 + 2, X1(1575.42) + 4, 40 + 76, 0.12, c=ALI, lw=1.4, head=7))
    o.append(T(xa, 186, "2 × 1712.71 − 1850.00 = 1575.42 MHz（3 次の相互変調。9 章 4 節の例）", "start", 9.5, ALI, True, halo=True))
    o.append(T(xb, 196 + 64, "2412.00 − 836.58 = 1575.42 MHz（2 次の例）", "end", 9.5, ALI, True, halo=True))
    o.append(W(X2(2412), 196 + 74, X2(2412), 196 + 52, c=ALI, lw=1.4, dash="3 2"))
    return SVG(700, 196 + 108, o, "青は GNSS の帯域（2 章 1 節の値）。携帯電話は 3GPP の帯域の例、アマチュア無線は日本の 1200 MHz 帯、衛星の電話は L バンドの移動衛星の例。2 次の例の 836.58 MHz は 800 MHz 帯の送信の例（図の外）。")


F["e20_radios"] = _f20_radios_fig()


# =====================================================================
# 5 節: スプーフィング — 本物と偽の信号の違い
# =====================================================================
def _f20_spoof_fig():
    o = []
    o.append(T(14, 18, "(a) 本物の信号", "start", 11.5, INK, True))
    o.append(T(250, 18, "(b) 1 つの送信機からの偽の信号", "start", 11.5, INK, True))
    o.append(T(486, 18, "(c) 相関の山が 2 つになる", "start", 11.5, INK, True))
    gy = 168
    sats = [(40, 50), (95, 34), (165, 44), (210, 64)]
    cn = [46, 43, 40, 37]
    for k, x0 in enumerate((14, 250)):
        o.append(W(x0, gy, x0 + 216, gy, c=MUT, lw=1.4))
        rx = (x0 + 108, gy)
        o.append(W(rx[0] - 7, gy, rx[0] + 7, gy, c=GRN, lw=2))
        o.append(W(rx[0], gy, rx[0], gy - 9, c=GRN, lw=1.6))
        o.append(D(rx[0], gy - 10, GRN, 3.4))
        o.append(T(rx[0], gy + 14, "受信機", "middle", 9.5, GRN, True))
        for i, (sx, sy) in enumerate(sats):
            o.append(RECT(x0 + sx - 7, sy - 4, 14, 8, 1.5, SIG, SIG, 1))
            o.append(W(x0 + sx - 13, sy, x0 + sx + 13, sy, c=SIG, lw=1.2))
            if k == 0:
                o.append(ARR(x0 + sx, sy + 6, rx[0], gy - 14, c=SIG, lw=1.3, head=6))
        if k == 1:
            tx = (x0 + 24, gy - 2)
            o.append(RECT(tx[0] - 8, tx[1] - 16, 16, 16, 2, ASOFT, ALI, 1.4))
            o.append(W(tx[0], tx[1] - 16, tx[0], tx[1] - 26, c=ALI, lw=1.6))
            o.append(T(tx[0] - 6, gy + 14, "偽の送信機", "start", 9.5, ALI, True))
            for dy in (-6, -2, 2, 6):
                o.append(ARR(tx[0] + 10, tx[1] - 10 + dy * 0.3, rx[0] - 10, gy - 12 + dy, c=ALI, lw=1.2, head=6))
            o.append(T(x0 + 120, 92, "全部が同じ向きから届く", "middle", 9.5, ALI, True, halo=True))
        # C/N0 の棒
        by = 196
        o.append(TX(x0, by + 2, "C/N_0 [dB-Hz]", "start", 9.5, MUT))
        vals = cn if k == 0 else [43.2, 43.0, 43.3, 42.9]
        for i, v in enumerate(vals):
            bx = x0 + 90 + i * 30
            hgt = (v - 30) * 4
            c = SIG if k == 0 else ALI
            o.append(RECT(bx, by + 70 - hgt, 20, hgt, 2, soft(c), c, 1.1))
            o.append(T(bx + 10, by + 70 - hgt - 4, "%d" % round(v), "middle", 9, c, True))
        o.append(W(x0 + 84, by + 70, x0 + 214, by + 70, c=MUT, lw=1))
        o.append(T(x0 + 150, by + 84, "仰角に応じてばらつく" if k == 0 else "そろった強さで届きやすい", "middle", 9.5, SIG if k == 0 else ALI, True))
    # (c) 相関の山
    p = Plot(510, 40, 170, 140, (-2, 3), (0, 1.6))
    o.append(p.axes(xl="符号のずれ [チップ]", yl=None, xt=[-2, -1, 0, 1, 2, 3], yt=[0, 1], xfmt=lambda v: _f20_m(v, 0) if v else "0", yfmt=lambda v: "%d" % v))
    xs = _f20_np.linspace(-2, 3, 201)
    tri = lambda x, c0, a: a * max(0.0, 1 - abs(x - c0))
    o.append(p.line([(x, tri(x, 0, 1.0)) for x in xs], c=SIG, lw=2))
    o.append(p.line([(x, tri(x, 1.2, 1.4)) for x in xs], c=ALI, lw=2))
    o.append(p.line([(x, tri(x, 0, 1.0) + tri(x, 1.2, 1.4)) for x in xs], c=INK, lw=1.2, dash="3 3"))
    o.append(T(p.X(-0.1), p.Y(1.0) - 6, "本物", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.3), p.Y(1.4) - 6, "偽", "start", 9.5, ALI, True, halo=True))
    o.append(ARR(p.X(0.1), p.Y(0.35), p.X(1.0), p.Y(0.35), c=ALI, lw=1.4, head=6))
    o.append(T(p.X(0.55), p.Y(0.35) + 14, "追尾が移る", "middle", 9, ALI, True, halo=True))
    o.append(T(486, by + 30, "偽の山が本物の山に重なって", "start", 9.5, MUT))
    o.append(T(486, by + 44, "から離れていくと、追尾が", "start", 9.5, MUT))
    o.append(T(486, by + 58, "偽の山に移る（概念の図）", "start", 9.5, MUT))
    return SVG(700, by + 92, o, "(a)(b) 空と受信機を横から見た図と、各衛星の C/N0（例の値）。(c) 縦軸は相関の大きさ（本物の山の高さを 1 とした）。")


F["e20_spoof"] = _f20_spoof_fig()


# =====================================================================
# 6 節: 例の機器のモデル（w20.js の _W20_SATS・_W20_FUNCS と同じ。値は例の値）
# =====================================================================
# 衛星: (名前, PRN, 仰角 [°], 妨害が無いときの C/N0 [dB-Hz], ドップラー [Hz])
_F20_HSATS = [("G05", 5, 72, 48.5, -420), ("G13", 13, 61, 47.8, 1210), ("G20", 20, 48, 46.5, -2380), ("G15", 15, 40, 45.2, 2950),
              ("G24", 24, 33, 44.0, -3130), ("G18", 18, 25, 42.3, 3720), ("G29", 29, 17, 40.1, -1650), ("G02", 2, 11, 38.0, 4180)]
# 機能: (名前, 種類, 値)。bb: 帯域に平らな妨害の N_J/N0 [dB]。cw: (L1 からの周波数の差 [Hz], 受信機の入力の電力 [dBm])
_F20_HFUNCS = [("DC-DC", "cw", (580e3, -118.0)), ("カメラ", "bb", 2.0), ("USB", "bb", 6.0), ("ディスプレイ", "cw", (-420e3, -112.0))]


def _f20_hunt(on):
    """機能の入れ切り on（4 つの 0/1）→ (衛星ごとの C/N0 のリスト, AGC の利得の変化 [dB])。"""
    out = []
    for nm, prn, el, base, fd in _F20_HSATS:
        r = 0.0
        for (fn, kind, v), o_ in zip(_F20_HFUNCS, on):
            if not o_:
                continue
            if kind == "bb":
                r += 10 ** (v / 10)
            else:
                r += 10 ** ((v[1] - _F20_N0) / 10) * _f20_st(prn, [v[0] - fd], 1)[0]
        out.append(base - _f20_drop(r))
    p = 0.0
    for (fn, kind, v), o_ in zip(_F20_HFUNCS, on):
        if o_:
            p += 10 ** ((_F20_N0 + v) / 10) * _F20_BW if kind == "bb" else 10 ** (v[1] / 10)
    return out, -_f20_drop(p / 10 ** (_F20_NB / 10))


def _f20_compare_fig():
    o = []
    o.append(TX(14, 18, "(a) 例の機器の C/N_0（8 機の平均。点は衛星ごとの値）", "start", 11.5, INK, True))
    p = Plot(70, 40, 610, 190, (0, 11), (25, 50))
    o.append(p.axes(yl="C/N_0 [dB-Hz]", xt=[], yt=[25, 30, 35, 40, 45, 50], yfmt=lambda v: "%d" % v))
    groups = [("全部を動かして、1 つずつ止める", [1, 1, 1, 1], 0.5), ("全部を止めて、1 つずつ動かす", [0, 0, 0, 0], 6.0)]
    names = ["DC-DC", "カメラ", "USB", "ディスプレイ"]
    for gname, ref, x0 in groups:
        cases = [("全部を動かす" if ref[0] else "全部を止める", ref)]
        for i, nm in enumerate(names):
            on = list(ref); on[i] = 1 - on[i]
            cases.append(((nm + "を止める") if ref[0] else (nm + "だけ"), on))
        base_avg = None
        for j, (lab, on) in enumerate(cases):
            cs, agc = _f20_hunt(on)
            avg = sum(cs) / len(cs)
            if base_avg is None:
                base_avg = avg
            xc = x0 + j * 0.95 + 0.4
            c = MUT if j == 0 else (GRN if ref[0] else ALI)
            o.append(RECT(p.X(xc - 0.33), p.Y(avg), p.X(xc + 0.33) - p.X(xc - 0.33), p.Y(25) - p.Y(avg), 2, soft(c), c, 1.2))
            for v in cs:
                o.append(D(p.X(xc), p.Y(v), INK, 1.8))
            o.append(T(p.X(xc), p.Y(avg) - 5, "%.1f" % avg, "middle", 9.5, c if j else INK, True, halo=True))
            if j:
                o.append(T(p.X(xc), p.y + p.h + 30, ("%+.1f" % (avg - base_avg)).replace("-", "−"), "middle", 9.5, c, True))
            o.append(T(p.X(xc), p.y + p.h + 13, lab if j == 0 else names[j - 1], "middle", 9, INK, j == 0))
        o.append(T(p.X(x0 + 2.3), p.y + p.h + 48, gname, "middle", 10, GRN if ref[0] else ALI, True))
    o.append(T(p.x - 6, p.y + p.h + 30, "差", "end", 9, MUT))
    # (b) AGC と C/N0
    y0 = 330
    o.append(TX(14, y0, "(b) 妨害の電力と、AGC の利得・C/N_0 の下がる量", "start", 11.5, INK, True))
    q = Plot(70, y0 + 20, 610, 170, (-145, -95), (0, 30))
    o.append(q.axes(xl="受信機の入力の妨害の電力 P_J [dBm]", yl="下がる量 [dB]", xt=[-145, -135, -125, -115, -105, -95], yt=[0, 5, 10, 15, 20, 25, 30],
                    xfmt=lambda v: _f20_m(v, 0), yfmt=lambda v: "%d" % v))
    xs = _f20_np.linspace(-145, -95, 201)
    s7b = _f20_db(_f20_st(1, [7000.0], 20)[0])
    o.append(q.clip([(x, _f20_drop(10 ** ((x - _F20_NB) / 10))) for x in xs], c=TEA, lw=3))
    o.append(q.clip([(x, _f20_drop(10 ** ((x - _F20_NB) / 10))) for x in xs], c=PUR, lw=1.8, dash="6 4"))
    o.append(q.clip([(x, _F20_CN0 - _f20_cn0eq(x, s7b)) for x in xs], c=ALI, lw=2.2))
    o.append(LEGL(80, y0 + 20 + 170 + 46, [(PUR, "6 4", "AGC の利得（どの形の妨害でも同じ）"), (TEA, None, "C/N_0（平らな雑音）")], 9.5, 14))
    o.append(LEGL(80, y0 + 20 + 170 + 62, [(ALI, None, "C/N_0（連続波が PRN 1 の線に重なる、20 ms）")], 9.5, 14))
    x1 = -130.0
    v1 = _F20_CN0 - _f20_cn0eq(x1, s7b); a1 = _f20_drop(10 ** ((x1 - _F20_NB) / 10))
    o.append(D(q.X(x1), q.Y(v1), ALI, 3.6)); o.append(D(q.X(x1), q.Y(a1), PUR, 3.6))
    o.append(TX(q.X(x1) + 6, q.Y(v1) + 4, "C/N_0 は %.1f dB 下がる" % v1, "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(x1) + 6, q.Y(a1) - 6, "AGC は %.2f dB しか動かない" % a1, "start", 9.5, PUR, True, halo=True))
    return SVG(700, y0 + 20 + 170 + 72, o, "(a) 6 節の例の機器（例の値: DC-DC は L1 + 0.58 MHz に −118 dBm の連続波、カメラと USB は帯域に平らな妨害 +2 dB・+6 dB、ディスプレイは L1 − 0.42 MHz に −112 dBm の連続波）。(b) 9 章 1 節の例の受信機。")


F["e20_compare"] = _f20_compare_fig()


# =====================================================================
# 6 節: スペクトラムアナライザの表示と、近傍界プローブで探す（例の機器・例の値）
# =====================================================================
# 近傍界プローブで見た源の強さ（基板の上で、源の真上の L1 の帯域の成分。相対値 [dB]）と位置 [mm]（w20.js と同じ）
_F20_PROBE = [("DC-DC", 137, 78, -60.0, "cw", 0.58), ("カメラの線", 15, 85, -52.0, "bb", 0), ("USB", 149, 25, -40.0, "bb", 0),
              ("ディスプレイの線", 90, 93, -46.0, "cw", -0.42), ("マイコン", 90, 50, -72.0, "bb", 0)]


def _f20_probe_level(x, y, only=None):
    t = 0.0
    for i, (nm, px, py, lv, kind, df) in enumerate(_F20_PROBE):
        if only is not None and i not in only:
            continue
        d2 = (x - px) ** 2 + (y - py) ** 2
        t += 10 ** (lv / 10) / (1 + d2 / 64.0) ** 2
    return 10 * math.log10(t + 1e-12)


def _f20_db_sum(*v):
    return 10 * math.log10(sum(10 ** (x / 10) for x in v))


def _f20_measure_fig():
    o = []
    o.append(T(14, 18, "(a) L1 のまわりのスペクトラムアナライザの表示（例の機器、全部の機能を動かしたとき）", "start", 11.5, INK, True))
    p = Plot(70, 36, 610, 180, (-5, 5), (-115, -78))
    o.append(RECT(p.X(-_F20_HB), p.y, p.X(_F20_HB) - p.X(-_F20_HB), p.h, 0, SSOFT, "none", 0))
    o.append(p.axes(xl="L1 からの周波数の差 [MHz]", yl="表示される電力 [dBm]", xt=[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], yt=[-115, -110, -105, -100, -95, -90, -85, -80],
                    xfmt=lambda v: _f20_m(v, 0) if v else "0", yfmt=lambda v: _f20_m(v, 0)))
    bb = _f20_db(10 ** 0.6 + 10 ** 0.2 + 1)            # USB とカメラで上がった床（N0 に対して）
    xs = _f20_np.linspace(-5, 5, 801)
    def trace(gain, rbw, an=-160.0):
        floor = _F20_N0 + bb + gain + 10 * math.log10(rbw)
        anf = an + 10 * math.log10(rbw)
        pts = []
        for x in xs:
            v = [floor, anf]
            for df, pj in ((-0.42, -112.0), (0.58, -118.0)):
                w = rbw / 1e6
                v.append(pj + gain + 10 * math.log10(max(math.exp(-((x - df) / (0.6 * w)) ** 2), 1e-12)))
            pts.append((x, _f20_db_sum(*v)))
        return pts, floor, anf
    t0, f0_, a0 = trace(0.0, 1e5)
    t1, f1_, a1 = trace(28.0, 1e5)
    t2, f2_, a2 = trace(28.0, 1e4)
    o.append(p.clip(t0, c=MUT, lw=1.8))
    o.append(p.clip(t1, c=SIG, lw=2))
    o.append(p.clip(t2, c=GLD, lw=1.6, dash="5 3"))
    o.append(W(p.x, p.Y(a0), p.x + p.w, p.Y(a0), c=FNT, lw=1, dash="2 3"))
    o.append(T(p.X(4.95), p.Y(a0) + 13, "アナライザ自身の雑音 %s dBm（RBW 100 kHz）" % _f20_m(a0, 0), "end", 9, MUT, False, halo=True))
    o.append(T(p.X(-4.9), p.Y(-108) - 2, "アンテナを直接つなぐ: ほとんど見えない", "start", 9.5, MUT, True, halo=True))
    o.append(T(p.X(-4.9), p.Y(f1_) - 6, "LNA（28 dB）を通す: 床 %s dBm" % _f20_m(f1_), "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-4.9), p.Y(f2_) + 14, "RBW を 10 kHz に: 床だけ 10 dB 下がる", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(-0.42) - 6, p.Y(-84) + 4, "ディスプレイ", "end", 9, ALI, True, halo=True))
    o.append(T(p.X(0.58) + 6, p.Y(-90) - 2, "DC-DC", "start", 9, ALI, True, halo=True))
    # (b) 近傍界プローブの地図
    y0 = 270
    o.append(T(14, y0, "(b) 近傍界プローブでなぞった強さ（濃いほど強い）", "start", 11.5, INK, True))
    bx, by, sc = 24, y0 + 14, 2.2
    o.append(RECT(bx, by, 160 * sc, 100 * sc, 4, GSOFT, GRN, 1.2))
    cells = []
    vals = []
    for i in range(32):
        for j in range(20):
            x, y = i * 5 + 2.5, j * 5 + 2.5
            vals.append((x, y, _f20_probe_level(x, y)))
    vmin, vmax = -80.0, -42.0
    for x, y, v in vals:
        a = max(0.0, min(1.0, (v - vmin) / (vmax - vmin)))
        if a > 0.02:
            cells.append(RECT(bx + (x - 2.5) * sc, by + (y - 2.5) * sc, 5 * sc + 0.3, 5 * sc + 0.3, 0, ALI, "none", 0, op=round(0.85 * a, 3)))
    o.append("".join(cells))
    comps = [("アンテナ", 4, 4, 26, 24, SIG), ("GNSS モジュール", 38, 8, 26, 22, SIG), ("マイコン", 80, 40, 22, 20, MUT), ("DC-DC", 126, 66, 24, 24, MUT),
             ("カメラ", 4, 74, 24, 22, MUT), ("ディスプレイ", 66, 86, 46, 12, MUT), ("USB", 140, 14, 18, 22, MUT)]
    for nm, x, y, w, h, c in comps:
        o.append(RECT(bx + x * sc, by + y * sc, w * sc, h * sc, 2, "none", c, 1.3))
        o.append(T(bx + (x + w / 2) * sc, by + (y + h / 2) * sc + 4, nm, "middle", 9, c if c == SIG else INK, True, halo=True))
    # プローブ
    px_, py_ = bx + 149 * sc, by + 25 * sc
    o.append(CIRC(px_ - 18, py_ + 30, 8, c=INK, lw=2))
    o.append(W(px_ - 12, py_ + 36, px_ + 8, py_ + 62, c=INK, lw=3))
    o.append(T(px_ - 30, py_ + 52, "プローブ", "end", 9, INK, True, halo=True))
    # (c) 3 か所のスペクトラム
    o.append(T(410, y0, "(c) プローブの位置ごとのスペクトラム", "start", 11.5, INK, True))
    spots = [("USB の上", [2]), ("ディスプレイの線の上", [3]), ("DC-DC の上", [0])]
    for k, (lab, idx) in enumerate(spots):
        q = Plot(470, y0 + 22 + k * 68, 210, 42, (-5, 5), (-95, -35))
        o.append(RECT(q.X(-_F20_HB), q.y, q.X(_F20_HB) - q.X(-_F20_HB), q.h, 0, SSOFT, "none", 0))
        o.append(RECT(q.x, q.y, q.w, q.h, 0, "none", LIN, 0.8))
        nm, x_, y_, lv, kind, df = _F20_PROBE[idx[0]]
        base = -88.0
        if kind == "bb":
            o.append(q.line([(-5, lv), (5, lv)], c=ALI, lw=2))
        else:
            o.append(q.line([(-5, base), (5, base)], c=MUT, lw=1.2))
            o.append(_f20_spike(q, df, lv, ALI, 2, base=base))
        o.append(T(q.x - 6, q.y + 14, lab, "end", 9, INK, True))
        o.append(T(q.x - 6, q.y + 28, "広い帯域" if kind == "bb" else "連続波", "end", 9, ALI, False))
    o.append(T(575, y0 + 22 + 3 * 68 - 10, "横軸: L1 ±5 MHz、縦軸: 相対の電力", "middle", 9, MUT))
    return SVG(700, by + 100 * sc + 14, o, "(a) RBW は分解能帯域幅。アナライザ自身の雑音は −160 dBm/Hz（代表値）とした。(b)(c) 源ごとの強さと、距離による弱まり方は例のモデル。")


F["e20_measure"] = _f20_measure_fig()
