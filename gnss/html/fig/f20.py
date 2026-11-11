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
    o.append(T(14, yr - 8, "受信機（RF フロントエンドから相関器）", "start", 10, SIG, True))
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
    o.append(T(xs[0] + 54, y2 + 16, "フィルタを通り抜けて相関器まで届き、C/N_0 を下げる（4 節）".replace("C/N_0", "C/N0"), "start", 9.5, MUT))
    return SVG(700, y2 + 26, o, "妨害の源と、受信機までの道。帯域の外の妨害と内の妨害は、受信機の中で効く所が違う。")


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
    o.append(T(q.X(-0.36), q.Y(-145) + 2, "連続波（1 本の線）", "start", 9.5, ALI, True, halo=True))
    o.append(T(q.X(0), q.y + q.h - 6, "受信機の帯域 ±1.023 MHz", "middle", 9.5, SIG, False, halo=True))
    return SVG(700, q.y + q.h + 44, o, "(a) 帯域の外と内の妨害（9 章 4 節の例の電波と相互変調の積）。(b) 雑音の床（9 章 1 節の例の受信機、183.5 K）と衛星の信号、帯域内の妨害の形。連続波は電力が 1 つの周波数に集まるので、密度ではなく線で描いた。")


F["e20_inout"] = _f20_inout_fig()
