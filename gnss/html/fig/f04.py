# -*- coding: utf-8 -*-
# 04 章 受信機の中 — RF フロントエンドから相関器までの図
import numpy as _f04_np

_F04_C = 299792458.0
_F04_FL1 = 1575.42e6
_F04_RC = 1.023e6
_F04_TC = 1.0 / _F04_RC
_F04_FREF = 16.368e6                 # 基準の発振器（TCXO）の周波数（例の値）
_F04_FLO = 96 * _F04_FREF            # 局部発振器 1571.328 MHz（例の値）
_F04_FIF = _F04_FL1 - _F04_FLO       # 中間周波数 4.092 MHz
_F04_FS = 16.368e6                   # サンプリング周波数（例の値）
_F04_B = 2.046e6                     # 最後のフィルタの幅（例の値）
_F04_PM = _f04_np.array(ca_pm(1), dtype=float)


def _f04_m(v, d=None):
    """目盛・数の文字（負の符号は −）。"""
    if d is None:
        s = "0" if abs(v) < 1e-12 else ("%g" % v)
    else:
        s = ("%." + str(d) + "f") % v
    return s.replace("-", "−")


def _f04_g(v, d=0):
    """3 桁ごとに空白を入れた数。"""
    s = ("%." + str(d) + "f") % abs(v)
    ip, _, fp = s.partition(".")
    ip = "{:,}".format(int(ip)).replace(",", " ")
    return ("−" if v < 0 else "") + ip + ("." + fp if fp else "")


def _f04_box(o, x, y, w, h, title, sub=None, c=SIG, chip=None, fill=PAN, tsz=10.5, ssz=9.5):
    """役割の箱（題・説明・節の札）。"""
    o.append(RECT(x, y, w, h, 7, fill, c, 1.4))
    if sub:
        o.append(T(x + w / 2, y + 17, title, "middle", tsz, INK, True))
        o.append(T(x + w / 2, y + 32, sub, "middle", ssz, MUT))
    else:
        o.append(T(x + w / 2, y + h / 2 + 4, title, "middle", tsz, INK, True))
    if chip:
        s_, _ = CHIP(x + w / 2, y + h - 5, chip, c, 9, 4, "middle")
        o.append(s_)


def _f04_ant(x, y, c=GLD):
    """アンテナの印（地板の上のパッチ）。"""
    return (W(x - 14, y + 10, x + 14, y + 10, c=c, lw=2.0) + RECT(x - 8, y + 2, 16, 7, 1.5, soft(c), c, 1.2)
            + W(x, y + 10, x, y + 18, c=c, lw=1.4))


def _f04_sinc2(x):
    return float(_f04_np.sinc(x)) ** 2


# =====================================================================
# 1 節: 受信機の流れ（役割の言葉・節の番号・数の量）
# =====================================================================
def _f04_chain_fig():
    o = []
    o.append(T(14, 17, "RF フロントエンド（電圧の波形のまま、全部の衛星をまとめて扱う）", "start", 10.5, SIG, True))
    ya, hb = 28, 58
    o.append(_f04_ant(34, ya + 12))
    o.append(T(34, ya + 46, "アンテナ", "middle", 9.5, GLD, True))
    xs = [(70, 128, "1. 増幅する", "雑音を足さずに", "2 節"), (216, 128, "2. 帯域を絞る", "L1 のまわりだけ", "2 節"),
          (362, 150, "3. 周波数を下げる", "1575.42 → 4.092 MHz", "2 節"), (530, 150, "4. 数値に変える", "A/D 変換", "3 節")]
    o.append(ARR(50, ya + 22, 70, ya + 22, c=SIG, lw=1.6))
    for i, (x, w, t1, t2, ch) in enumerate(xs):
        _f04_box(o, x, ya, w, hb, t1, t2, SIG, ch)
        if i + 1 < len(xs):
            o.append(ARR(x + w, ya + 22, xs[i + 1][0], ya + 22, c=SIG, lw=1.6))
    # 折り返し
    o.append(W(605, ya + hb, 605, 112, 158, 112, 158, 150, c=SIG, lw=1.6))
    o.append(ARR(158, 140, 158, 150, c=SIG, lw=1.6))
    o.append(T(604, 124, "数の列", "end", 9.5, SIG, True, halo=True))
    o.append(T(14, 140, "ベースバンド処理（数の計算。衛星ごとに分かれる）", "start", 10.5, PUR, True, halo=True))
    yb = 150
    # 5: 衛星の数だけ重ねた箱
    for k in (2, 1):
        o.append(RECT(70 + 5 * k, yb - 5 * k, 176, hb, 7, PAN, PUR, 1.0))
    _f04_box(o, 70, yb, 176, hb, "5. 掛けて足す（相関）", "衛星の数だけ並べる", PUR, "4・5 節")
    xb = [(286, 128, "6. 見つけて追う", "ずれを測って直す", "5 章"), (444, 130, "7. 位置を解く", "擬似距離 → 位置", "2 章 6 節・6 章"),
          (604, 82, "出力", "文字・数", "12・13 章")]
    o.append(ARR(246, yb + 22, 286, yb + 22, c=PUR, lw=1.6))
    for i, (x, w, t1, t2, ch) in enumerate(xb):
        _f04_box(o, x, yb, w, hb, t1, t2, PUR, ch)
        if i + 1 < len(xb):
            o.append(ARR(x + w, yb + 22, xb[i + 1][0], yb + 22, c=PUR, lw=1.6))
    # 直す向きの輪
    o.append(W(350, yb + hb, 350, yb + hb + 16, 158, yb + hb + 16, c=GLD, lw=1.5))
    o.append(ARR(158, yb + hb + 16, 158, yb + hb + 1, c=GLD, lw=1.5))
    o.append(T(254, yb + hb + 30, "手元の符号と搬送波を直す（1 ms ごと）", "middle", 9.5, GLD, True))
    # 数の量（対数の目盛の棒）
    y0 = 270
    o.append(W(14, y0 - 12, 686, y0 - 12, c=LIN, lw=0.8))
    o.append(T(14, y0 + 4, "1 秒あたりの数の量（例の値）", "start", 10.5, INK, True))
    p = Plot(250, y0 + 14, 400, 60, (1, 1e8), (0, 3), xlog=True)
    o.append(p.axes(xl=None, yl=None, xt=[1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8], yt=[],
                    xfmt=lambda v: {1: "1", 10: "10", 100: "100", 1e3: "1000", 1e4: "1 万", 1e5: "10 万", 1e6: "100 万", 1e7: "1000 万", 1e8: "1 億"}[v], grid=True))
    bars = [("A/D 変換の出力（bit）", 3.2736e7, SIG), ("相関器の出力（衛星 1 つ）", 6000.0, PUR), ("位置（10 Hz の場合）", 10.0, GRN)]
    for i, (lab, v, c) in enumerate(bars):
        yy = p.y + 4 + i * 19
        o.append(RECT(p.X(1), yy, p.X(v) - p.X(1), 13, 2, soft(c), c, 1.1))
        o.append(T(p.x - 8, yy + 10, lab, "end", 9.5, c, True))
        txt = {0: "3274 万", 1: "6000", 2: "10"}[i]
        o.append(T(p.X(v) + 6, yy + 10, txt, "start", 9.5, c, True))
    return SVG(700, 366, o, "受信機の 7 つの段（上）と、1 秒あたりの数の量（下、例の値）。1〜4 の RF フロントエンドは、全部の衛星の電波をまとめて、電圧の波形のまま増幅し、周波数を下げて数の列にする。5〜7 のベースバンド処理は、衛星ごとに、手元で作った符号と搬送波を掛けて足し、ずれを測って直しながら、擬似距離と位置を求める。数の量は A/D 変換の直後が最も多く、掛けて足す計算で大きく減る。")
F["e04_chain"] = _f04_chain_fig()


# =====================================================================
# 1 節: 各段の信号と雑音の電力（例の値）と、相関の後の SN 比
# =====================================================================
_F04_LV = [("アンテナ", -128.5, -115.5, -13.0), ("最初の増幅器", -110.5, -95.1, -15.4), ("フィルタ", -112.0, -96.5, -15.5),
           ("チップの増幅", -92.0, -76.4, -15.6), ("A/D 変換の入力", -23.5, -7.8, -15.7)]


def _f04_levels_fig():
    o = []
    o.append(T(14, 17, "(a) 信号と雑音の電力（雑音は 2.046 MHz の中で数える）", "start", 11, INK, True))
    p = Plot(78, 34, 400, 196, (-0.5, 4.5), (-140, 0))
    o.append(p.axes(xl=None, yl="電力 [dBm]", xt=[], yt=[-140, -120, -100, -80, -60, -40, -20, 0], yfmt=_f04_m))
    for i, (nm, c_, n_, s_) in enumerate(_F04_LV):
        o.append(W(p.X(i), p.y, p.X(i), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(i), p.y + p.h + 15, nm, "middle", 9.5, INK))
    o.append(p.line([(i, v[2]) for i, v in enumerate(_F04_LV)], c=TEA, lw=2.2))
    o.append(p.line([(i, v[1]) for i, v in enumerate(_F04_LV)], c=SIG, lw=2.2))
    for i, (nm, c_, n_, s_) in enumerate(_F04_LV):
        o.append(D(p.X(i), p.Y(n_), TEA, 4))
        o.append(D(p.X(i), p.Y(c_), SIG, 4))
        o.append(T(p.X(i) + (8 if i < 4 else -8), p.Y(n_) - 7, _f04_m(n_, 1), "start" if i < 4 else "end", 9.5, TEA, True, halo=True))
        o.append(T(p.X(i) + (8 if i < 4 else -8), p.Y(c_) + 15, _f04_m(c_, 1), "start" if i < 4 else "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(0.2), p.Y(-62), "利得（例の値）: +18・−1.5・+20・+68.5 dB", "start", 9.5, MUT, False, halo=True))
    o.append(LEGL(p.x, p.y + p.h + 40, [(TEA, None, "雑音の電力"), (SIG, None, "信号の電力")], 9.5, 14))
    # SN 比の行
    yy = p.y + p.h + 62
    o.append(T(p.x - 8, yy, "SN 比", "end", 9.5, ALI, True))
    for i, v in enumerate(_F04_LV):
        o.append(T(p.X(i), yy, _f04_m(v[3], 1) + " dB", "middle", 9.5, ALI, True))
    # (b) 相関の後
    xb = 548
    o.append(T(xb - 30, 17, "(b) SN 比 [dB]", "start", 11, INK, True))
    q = Plot(xb, 34, 136, 196, (0, 3), (-20, 35))
    o.append(q.axes(xl=None, yl=None, xt=[], yt=[-20, -10, 0, 10, 20, 30], yfmt=_f04_m))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1.2))
    items = [("A/D の入力", -15.7, ALI), ("1 ms 足す", 16.7, GRN), ("20 ms 足す", 29.7, GRN)]
    for i, (lab, v, c) in enumerate(items):
        x0 = q.X(i + 0.18); x1 = q.X(i + 0.82)
        o.append(RECT(x0, min(q.Y(v), q.Y(0)), x1 - x0, abs(q.Y(v) - q.Y(0)), 2, soft(c), c, 1.2))
        o.append(T((x0 + x1) / 2, q.Y(v) + (14 if v < 0 else -6), _f04_m(v, 1), "middle", 9.5, c, True, halo=True))
        o.append(T((x0 + x1) / 2, q.y + q.h + 15, lab, "middle", 9, INK))
    o.append(T(q.x + q.w / 2, q.y + q.h + 30, "（量子化の損失を含む）", "middle", 9, MUT))
    return SVG(700, 316, o, "RF フロントエンドの各段の信号と雑音の電力（例の値: アンテナの雑音温度 100 K、最初の増幅器の雑音指数 1 dB・利得 18 dB）。(a) 増幅は信号と雑音を同じだけ大きくするので、帯域の中の SN 比は、最初の増幅器が雑音を足した後は −15 dB ほどのまま変わらない。(b) 信号が雑音の上に出るのは、衛星の符号を掛けて足した後で、1 ms で 16.7 dB、20 ms で 29.7 dB になる（3 節の 2 bit の量子化の損失 0.74 dB を含む）。")
F["e04_levels"] = _f04_levels_fig()


# =====================================================================
# 2 節: 混合器 — 波形（時間の見方）と周波数の軸（周波数の見方）
# =====================================================================
def _f04_mix_fig():
    o = []
    o.append(T(14, 17, "(a) 波形（周波数を縮めて描いた）", "start", 11, INK, True))
    chips = [1, -1, -1, 1]
    ts = _f04_np.linspace(0, 4, 1601)
    a = _f04_np.array([chips[min(3, int(t))] for t in ts])
    psi = 0.6
    rf = a * _f04_np.cos(2 * math.pi * 12 * ts + psi)
    lo = _f04_np.cos(2 * math.pi * 8 * ts)
    prod = rf * 2 * lo
    iff = a * _f04_np.cos(2 * math.pi * 4 * ts + psi)
    rows = [("届いた信号（1 チップに 12 周期）", rf, SIG, 1.15), ("局部発振器（8 周期）", lo, GLD, 1.15),
            ("掛け算の出力（差の 4 周期 + 和の 20 周期）", prod, PUR, 2.3), ("フィルタの後（差の成分）", iff, SIG, 1.15)]
    y0 = 34
    for k, (lab, v, c, rg) in enumerate(rows):
        p = Plot(30, y0 + k * 64 + 12, 340, 40, (0, 4), (-rg, rg))
        o.append(RECT(p.x, p.y, p.w, p.h, 2, SCR, LIN, 0.8))
        for b in (1, 2, 3):
            o.append(W(p.X(b), p.y, p.X(b), p.y + p.h, c=FNT, lw=1, dash="3 3"))
        o.append(p.line(list(zip(ts, v)), c=c, lw=1.3))
        o.append(T(p.x, p.y - 4, lab, "start", 9.5, c, True))
    pb = Plot(30, y0 + 3 * 64 + 12, 340, 40, (0, 4), (-1.15, 1.15))
    for b in range(4):
        o.append(T(pb.X(b + 0.5), pb.y + pb.h + 13, "%+d" % chips[b], "middle", 9.5, MUT))
    o.append(T(pb.x, pb.y + pb.h + 42, "上の数は符号のチップ、破線はチップの境目", "start", 9, MUT))
    o.append(T(pb.X(1), pb.y + pb.h + 27, "反転", "middle", 9, ALI, True))
    o.append(T(pb.X(3), pb.y + pb.h + 27, "反転", "middle", 9, ALI, True))
    # (b) 周波数の軸
    xb = 430
    o.append(T(xb - 20, 17, "(b) 周波数の軸（例の値）", "start", 11, INK, True))
    p1 = Plot(xb, 52, 250, 62, (1560, 1590), (0, 1.25))
    o.append(p1.axes(xl="混合器の入力の周波数 [MHz]", yl=None, xt=[1560, 1565, 1570, 1575, 1580, 1585, 1590], yt=[], grid=False))
    fs_ = _f04_np.linspace(1560, 1590, 600)
    o.append(p1.line([(f, _f04_sinc2((f - 1575.42) / 1.023)) for f in fs_], c=SIG, lw=1.8))
    o.append(W(p1.X(1571.328), p1.Y(0), p1.X(1571.328), p1.Y(1.2), c=GLD, lw=2.2))
    o.append(T(p1.X(1571.328) - 4, p1.Y(1.08), "局部発振器 1571.328", "end", 9, GLD, True, halo=True))
    o.append(T(p1.X(1576.5), p1.Y(0.9), "L1 1575.42", "start", 9, SIG, True, halo=True))
    p2 = Plot(xb, 210, 250, 62, (0, 30), (0, 1.25))
    o.append(p2.axes(xl="混合器の出力の周波数 [MHz]", yl=None, xt=[0, 5, 10, 15, 20, 25, 30], yt=[], grid=False))
    fs2 = _f04_np.linspace(0, 30, 600)
    o.append(p2.line([(f, _f04_sinc2((f - 4.092) / 1.023)) for f in fs2], c=SIG, lw=1.8))
    o.append(T(p2.X(5.6), p2.Y(0.9), "中間周波数 4.092", "start", 9, SIG, True, halo=True))
    o.append(ARR(p1.X(1575.42), p1.y + p1.h + 36, p2.X(4.092) + 8, p2.y - 6, c=MUT, lw=1.4))
    o.append(T(xb + 128, 172, "差: 1575.42 − 1571.328", "start", 9.5, MUT, True))
    o.append(T(xb + 128, 186, "　= 4.092 MHz", "start", 9.5, MUT, True))
    o.append(T(xb, 316, "和の成分（3146.748 MHz）は、", "start", 9.5, PUR, True))
    o.append(T(xb, 330, "低い周波数だけを通すフィルタで除く", "start", 9.5, PUR, True))
    return SVG(700, 340, o, "混合器の働き。(a) 届いた信号に局部発振器の正弦波を掛けると、周波数の差と和の 2 つの成分ができる。和の成分をフィルタで除いた差の成分（中間周波数）にも、チップの境目での位相の反転が、同じ所に残る（周波数の比は描きやすい値にした。実際は 1 チップの間に L1 は 1540 周期、中間周波数は 4 周期）。(b) 例の値では、L1 の 1575.42 MHz のまわりの数 MHz が、形を変えずに 4.092 MHz のまわりに移る。")
F["e04_mix"] = _f04_mix_fig()


# =====================================================================
# 2 節: イメージ周波数 — 反対側の雑音が重なる・弱める量・cos と sin の 2 つの混合
# =====================================================================
def _f04_image_fig():
    o = []
    pk = -12.4   # 信号の電力スペクトル密度の山（雑音の床 = 0 dB、T_sys 175 K の例）
    fim = (_F04_FLO - _F04_FIF) / 1e6
    o.append(T(14, 17, "(a) 混合器の入力（雑音の床を 0 dB とした）", "start", 11, INK, True))
    p = Plot(70, 36, 270, 120, (1562, 1580), (-20, 8))
    o.append(RECT(p.X(fim - 1.023), p.y, p.X(fim + 1.023) - p.X(fim - 1.023), p.h, 0, TSOFT, "none", 0))
    o.append(RECT(p.X(1575.42 - 1.023), p.y, p.X(1575.42 + 1.023) - p.X(1575.42 - 1.023), p.h, 0, SSOFT, "none", 0))
    o.append(p.axes(xl="周波数 [MHz]", yl="密度 [dB]", xt=[1562, 1566, 1570, 1574, 1578], yt=[-20, -10, 0, 8], yfmt=_f04_m))
    o.append(p.line([(1562, 0), (1580, 0)], c=TEA, lw=2.2))
    fs_ = _f04_np.linspace(1562, 1580, 721)
    o.append(p.clip([(f, pk + 10 * math.log10(max(_f04_sinc2((f - 1575.42) / 1.023), 1e-9))) for f in fs_], c=SIG, lw=1.8))
    o.append(W(p.X(_F04_FLO / 1e6), p.y, p.X(_F04_FLO / 1e6), p.y + p.h, c=GLD, lw=2))
    o.append(T(p.X(_F04_FLO / 1e6), p.y - 4, "局部発振器", "middle", 9, GLD, True))
    o.append(DIM(p.X(fim), p.Y(4.5), p.X(_F04_FLO / 1e6), p.Y(4.5), None, c=MUT))
    o.append(DIM(p.X(_F04_FLO / 1e6), p.Y(4.5), p.X(1575.42), p.Y(4.5), None, c=MUT))
    o.append(T((p.X(fim) + p.X(_F04_FLO / 1e6)) / 2, p.Y(4.5) - 5, "4.092", "middle", 9, MUT, True, halo=True))
    o.append(T((p.X(1575.42) + p.X(_F04_FLO / 1e6)) / 2, p.Y(4.5) - 5, "4.092", "middle", 9, MUT, True, halo=True))
    o.append(T(p.X(fim), p.Y(-15), "イメージ 1567.236", "middle", 9, TEA, True, halo=True))
    o.append(T(p.X(1575.42), p.Y(-17.5), "L1", "middle", 9, SIG, True, halo=True))
    # (b) 中間周波数
    xb = 420
    o.append(T(xb - 20, 17, "(b) 混合器の出力（cos だけで混合）", "start", 11, INK, True))
    q = Plot(xb, 36, 260, 120, (0, 10), (-20, 8))
    o.append(RECT(q.X(4.092 - 1.023), q.y, q.X(4.092 + 1.023) - q.X(4.092 - 1.023), q.h, 0, SSOFT, "none", 0))
    o.append(q.axes(xl="周波数 [MHz]", yl=None, xt=[0, 2, 4, 6, 8, 10], yt=[-20, -10, 0, 8], yfmt=_f04_m))
    o.append(q.line([(0, 3.01), (10, 3.01)], c=TEA, lw=2.2))
    o.append(q.line([(0, 0), (10, 0)], c=TEA, lw=1.2, dash="5 3"))
    fs2 = _f04_np.linspace(0, 10, 401)
    o.append(q.clip([(f, pk + 10 * math.log10(max(_f04_sinc2((f - 4.092) / 1.023), 1e-9))) for f in fs2], c=SIG, lw=1.8))
    o.append(T(q.X(9.9), q.Y(3.01) - 5, "L1 の雑音 + イメージの雑音（+3.0 dB）", "end", 9, TEA, True, halo=True))
    o.append(T(q.X(9.9), q.Y(0) + 12, "イメージを除いたとき", "end", 9, TEA, False, halo=True))
    o.append(T(q.X(4.092), q.Y(-17.5), "信号は L1 からだけ", "middle", 9, SIG, True, halo=True))
    # (c) 弱める量と C/N0 の減り
    o.append(T(14, 222, "(c) イメージを弱める量と C/N0 の減り", "start", 11, INK, True))
    r = Plot(70, 240, 270, 120, (0, 30), (0, 3.2))
    o.append(r.axes(xl="混合器の前でイメージを弱める量 A [dB]", yl="C/N0 の減り [dB]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 1, 2, 3], yfmt=_f04_m))
    aa = _f04_np.linspace(0, 30, 121)
    o.append(r.line([(A, 10 * math.log10(1 + 10 ** (-A / 10))) for A in aa], c=ALI, lw=2.2))
    for A, lab in ((0, "3.01"), (10, "0.41"), (20, "0.04")):
        v = 10 * math.log10(1 + 10 ** (-A / 10))
        o.append(D(r.X(A), r.Y(v), ALI, 4))
        o.append(T(r.X(A) + 7, r.Y(v) - 6, lab + " dB", "start", 9.5, ALI, True, halo=True))
    o.append(TX(r.X(29), r.Y(2.6), "10 log_{10}(1 + 10^{−A/10})", "end", 9.5, MUT, False, True))
    # (d) cos と sin の 2 つで混合
    o.append(T(xb - 20, 222, "(d) cos と sin の 2 つで混合（複素数として）", "start", 11, INK, True))
    s_ = Plot(xb, 240, 260, 120, (-10, 10), (0, 1.3))
    o.append(s_.axes(xl="周波数 [MHz]（負の周波数も区別できる）", yl=None, xt=[-10, -8, -4, 0, 4, 8, 10], yt=[], xfmt=_f04_m, grid=False))
    o.append(W(s_.X(0), s_.y, s_.X(0), s_.y + s_.h, c=MUT, lw=1))
    o.append(RECT(s_.X(4.092 - 1.023), s_.Y(1.0), s_.X(4.092 + 1.023) - s_.X(4.092 - 1.023), s_.Y(0) - s_.Y(1.0), 2, SSOFT, SIG, 1.2))
    o.append(RECT(s_.X(-4.092 - 1.023), s_.Y(1.0), s_.X(-4.092 + 1.023) - s_.X(-4.092 - 1.023), s_.Y(0) - s_.Y(1.0), 2, TSOFT, TEA, 1.2))
    o.append(T(s_.X(4.092), s_.Y(1.0) - 6, "L1 → +4.092", "middle", 9, SIG, True))
    o.append(T(s_.X(-4.092), s_.Y(1.0) - 6, "イメージ → −4.092", "middle", 9, TEA, True))
    o.append(T(s_.X(-4.092), s_.Y(0.45), "取り除ける", "middle", 9, TEA, False, halo=True))
    return SVG(700, 400, o, "イメージ周波数（例の値: 局部発振器 1571.328 MHz、中間周波数 4.092 MHz）。(a) 局部発振器を挟んで L1 の反対側 4.092 MHz にある 1567.236 MHz が、イメージ周波数である。そこに信号は無いが、雑音は L1 のまわりと同じ密度で入る。(b) cos だけで混合すると、L1 の雑音とイメージの雑音が同じ中間周波数に重なり、雑音の密度が 2 倍（+3.0 dB）になる。(c) 混合器の前でイメージを A dB 弱めると、C/N0 の減りは 10 log₁₀(1 + 10^(−A/10)) dB で、20 dB 弱めれば 0.04 dB になる。(d) cos と sin の 2 つの出力を複素数とみなすと、L1 は正の周波数、イメージは負の周波数に分かれる。")
F["e04_image"] = _f04_image_fig()


# =====================================================================
# 2 節: TCXO — 1 つの発振器から作る周波数と、温度による周波数のずれ
# =====================================================================
def _f04_xtal(T_):
    """補償しない水晶の発振器の周波数のずれ [ppm]（例の形。AT カットの 3 次の曲線をまねた）。"""
    x = T_ - 25.0
    return 1.5e-4 * x ** 3 - 0.3 * x


def _f04_tcxo_ppm(T_):
    """TCXO の周波数のずれ [ppm]（例の形。±0.5 ppm 以内）。"""
    return 0.38 * math.sin((T_ + 40) / 125 * 2.6 * math.pi) + 0.06 * math.cos((T_ + 40) / 125 * 7 * math.pi)


def _f04_tcxo_fig():
    o = []
    o.append(T(14, 17, "(a) 1 つの基準の発振器から作る周波数（例の値）", "start", 11, INK, True))
    _f04_box(o, 14, 104, 104, 52, "TCXO", "16.368 MHz", GLD, None)
    _f04_box(o, 160, 36, 96, 44, "PLL", "周波数を 96 倍", GLD, None)
    _f04_box(o, 160, 108, 96, 44, "A/D 変換", "標本の時刻", SIG, None)
    _f04_box(o, 160, 180, 96, 44, "ベースバンド", "回路の時計", PUR, None)
    o.append(W(118, 130, 138, 130, c=GLD, lw=1.6))
    o.append(W(138, 58, 138, 202, c=GLD, lw=1.6))
    for yy in (58, 130, 202):
        o.append(ARR(138, yy, 160, yy, c=GLD, lw=1.6))
    o.append(ARR(256, 58, 300, 58, c=GLD, lw=1.6))
    o.append(T(262, 50, "1571.328 MHz", "start", 9.5, GLD, True))
    o.append(T(304, 62, "局部発振器 → 混合器", "start", 9.5, GLD, True))
    o.append(T(262, 122, "16.368 MHz", "start", 9.5, SIG, True))
    o.append(T(262, 194, "16.368 MHz など", "start", 9.5, PUR, True))
    o.append(T(14, 250, "受信機の時計（1 章 2 節）は、この発振器である。", "start", 9.5, INK))
    o.append(T(14, 265, "周波数がずれると、全部が同じ割合でずれる。", "start", 9.5, INK))
    # (b) 温度と周波数のずれ
    xb = 430
    o.append(T(xb - 30, 17, "(b) 温度と周波数のずれ（例の形）", "start", 11, INK, True))
    p = Plot(xb, 40, 220, 190, (-40, 85), (-25, 25))
    band = 5000 / _F04_FL1 * 1e6
    o.append(RECT(p.x, p.Y(band), p.w, p.Y(-band) - p.Y(band), 0, PSOFT, "none", 0))
    o.append(p.axes(xl="温度 [°C]", yl="周波数のずれ [ppm]", xt=[-40, -20, 0, 20, 40, 60, 80], yt=[-20, -10, 0, 10, 20], xfmt=_f04_m, yfmt=_f04_m))
    tt = _f04_np.linspace(-40, 85, 251)
    o.append(p.line([(t, _f04_xtal(t)) for t in tt], c=ALI, lw=2.2))
    o.append(p.line([(t, _f04_tcxo_ppm(t)) for t in tt], c=GRN, lw=2.4))
    o.append(T(p.X(-36), p.Y(21.5), "補償しない水晶", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(48), p.Y(-1.6), "TCXO", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(82), p.Y(band) - 4, "ドップラーの範囲 ±5 kHz", "end", 9, PUR, True, halo=True))
    # 右の目盛（L1 での見かけの周波数のずれ）
    for k in (-30, -15, 0, 15, 30):
        ppm = -k / (_F04_FL1 / 1e9)
        if -25 <= ppm <= 25:
            o.append(W(p.x + p.w, p.Y(ppm), p.x + p.w + 4, p.Y(ppm), c=MUT, lw=1))
            o.append(T(p.x + p.w + 7, p.Y(ppm) + 3.3, _f04_m(k), "start", 9.5, MUT))
    o.append(T(p.x + p.w + 30, p.y + p.h / 2, "L1 での見かけのずれ [kHz]", "middle", 10, MUT, rot=90))
    return SVG(700, 290, o, "TCXO と、1 つの発振器から作る周波数（例の値）。(a) 局部発振器・A/D 変換の標本の時刻・ベースバンド処理の回路の時計は、どれも同じ基準の発振器から作る。(b) 補償しない水晶の発振器の周波数は温度で ±20 ppm ほど変わり（例の形）、L1 では ±30 kHz の見かけのずれになる。TCXO は ±0.5 ppm（±788 Hz）以内に収める。紫の帯は、衛星の動きによるドップラーの範囲（±5 kHz、代表値）を ppm に直したもの。")
F["e04_tcxo"] = _f04_tcxo_fig()


# =====================================================================
# 3 節: 標本をとると周波数が折り返す — 時間の見方・使えるサンプリング周波数・帯域の折り返し
# =====================================================================
def _f04_fold(f, fs):
    """周波数 f を、標本の列で見える 0〜fs/2 の周波数に直す。返り値 (周波数, 裏返ったか)。"""
    r = f % fs
    return (r, False) if r <= fs / 2 else (fs - r, True)


def _f04_alias_fig():
    o = []
    fif = 4.092
    o.append(T(14, 17, "(a) 4.092 MHz の正弦波を 2 通りに標本にする", "start", 11, INK, True))
    p = Plot(62, 34, 300, 120, (0, 1.2), (-1.3, 1.3))
    o.append(p.axes(xl="時間 t [μs]", yl="値", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], yt=[-1, 0, 1], xfmt=_f04_m, yfmt=_f04_m))
    tt = _f04_np.linspace(0, 1.2, 601)
    o.append(p.line([(t, math.cos(2 * math.pi * fif * t)) for t in tt], c=FNT, lw=1.4))
    o.append(p.line([(t, math.cos(2 * math.pi * 1.364 * t)) for t in tt], c=GLD, lw=1.4, dash="5 3"))
    for k in range(int(1.2 * 16.368) + 1):
        t = k / 16.368
        o.append(D(p.X(t), p.Y(math.cos(2 * math.pi * fif * t)), SIG, 3.2))
    for k in range(int(1.2 * 5.456) + 1):
        t = k / 5.456
        o.append(RECT(p.X(t) - 4, p.Y(math.cos(2 * math.pi * fif * t)) - 4, 8, 8, 1, GOSOFT, GLD, 1.4))
    o.append(LEGL(p.x - 40, p.y + p.h + 44, [(SIG, None, "16.368 MHz の標本"), (GLD, "5 3", "5.456 MHz の標本（1.364 MHz に見える）")], 9, 10))
    # (b) 使えるサンプリング周波数
    xb = 430
    o.append(T(xb - 30, 17, "(b) 使えるサンプリング周波数（例の帯域）", "start", 11, INK, True))
    q = Plot(xb, 58, 250, 30, (0, 20), (0, 1))
    zones = [(5.115, 6.138), (10.23, 20.0)]
    o.append(RECT(q.x, q.y, q.w, q.h, 0, ASOFT, "none", 0))
    for a, b in zones:
        o.append(RECT(q.X(a), q.y, q.X(b) - q.X(a), q.h, 0, GSOFT, GRN, 1.2))
    o.append(q.axes(xl="サンプリング周波数 f_s [MHz]", yl=None, xt=[0, 4, 8, 12, 16, 20], yt=[], grid=False))
    for fsv, ok, lab, dy in ((5.456, True, "5.456", -8), (8.184, False, "8.184", -8), (16.368, True, "16.368", -8)):
        c = GRN if ok else ALI
        o.append(W(q.X(fsv), q.y - 4, q.X(fsv), q.y + q.h + 4, c=c, lw=2.2))
        o.append(T(q.X(fsv), q.y + dy - 2, lab, "middle", 9, c, True))
    o.append(T(xb - 30, 136, "緑: 帯域が 1 つの区間に入る", "start", 9.5, GRN, True))
    o.append(T(xb - 30, 150, "（n = 2 で 5.115〜6.138 MHz、n = 1 で 10.23 MHz 以上）", "start", 9.5, GRN))
    o.append(T(xb - 30, 166, "赤: 帯域が自分と重なる", "start", 9.5, ALI, True))
    o.append(TX(xb - 30, 184, "条件 2f_H/n ≤ f_s ≤ 2f_L/(n − 1)", "start", 9.5, INK))
    # (c) 帯域の折り返し（3 通り）
    o.append(T(14, 214, "(c) 帯域（3.069〜5.115 MHz）が標本の列でどこに見えるか（濃い方が高い周波数の側）", "start", 11, INK, True))
    cases = [(16.368, "f_s = 16.368 MHz: そのまま（中間周波数は f_s/4）", GRN), (5.456, "f_s = 5.456 MHz: 0.341〜2.387 MHz に裏返る（帯域通過サンプリング）", GRN),
             (8.184, "f_s = 8.184 MHz: f_s/2 が帯域の中にあり、上と下の半分が重なる", ALI)]
    for i, (fsv, lab, c) in enumerate(cases):
        y0 = 238 + i * 76
        r = Plot(62, y0 + 14, 618, 34, (0, 17), (0, 1))
        o.append(RECT(r.X(0), r.y, r.X(fsv / 2) - r.X(0), r.h, 0, MSOFT, "none", 0))
        o.append(r.axes(xl=None, yl=None, xt=[0, 2, 4, 6, 8, 10, 12, 14, 16], yt=[], grid=False))
        k = 1
        while k * fsv / 2 <= 17:
            o.append(W(r.X(k * fsv / 2), r.y - 2, r.X(k * fsv / 2), r.y + r.h, c=MUT, lw=1, dash="3 3"))
            k += 1
        # もとの帯域（枠）
        o.append(RECT(r.X(3.069), r.y + 3, r.X(4.092) - r.X(3.069), r.h - 6, 1, "none", SIG, 1.0, dash="3 2"))
        o.append(RECT(r.X(4.092), r.y + 3, r.X(5.115) - r.X(4.092), r.h - 6, 1, "none", SIG, 1.0, dash="3 2"))
        # 見える位置（下の半分は薄く、上の半分は濃く）
        lo0, _ = _f04_fold(3.069, fsv); mid, inv = _f04_fold(4.092, fsv); hi0, _ = _f04_fold(5.115, fsv)
        if fsv == 8.184:
            o.append(RECT(r.X(3.069), r.y + 6, r.X(4.092) - r.X(3.069), r.h - 12, 1, ASOFT, ALI, 1.4))
            o.append(T(r.X(3.58), r.y + r.h / 2 + 4, "重なる", "middle", 9, ALI, True))
        else:
            a1, a2 = sorted((lo0, mid)); b1, b2 = sorted((mid, hi0))
            o.append(RECT(r.X(a1), r.y + 6, r.X(a2) - r.X(a1), r.h - 12, 1, SSOFT, SIG, 1.2))
            o.append(RECT(r.X(b1), r.y + 6, r.X(b2) - r.X(b1), r.h - 12, 1, SIG, SIG, 1.2))
        o.append(TX(r.x, r.y - 4, lab, "start", 9.5, c, True))
        o.append(T(r.X(fsv / 2) + 3, r.y + r.h - 4, "f_s/2", "start", 9, MUT, halo=True) if fsv != 8.184 else "")
    o.append(T(680, 238 + 2 * 76 + 80, "周波数 [MHz]（灰色: 0〜f_s/2、破線: f_s/2 の整数倍）", "end", 9.5, MUT))
    return SVG(700, 482, o, "標本をとると周波数が折り返す（例の値: 中間周波数 4.092 MHz、帯域の幅 2.046 MHz）。(a) 4.092 MHz の正弦波を 5.456 MHz で標本にした点は、1.364 MHz の正弦波の上にも乗り、標本の列では区別できない。(b) 帯域が f_s/2 ごとの 1 つの区間に入るサンプリング周波数（緑）なら、折り返しても帯域は自分と重ならない。(c) 16.368 MHz ではそのまま、5.456 MHz では裏返って低い周波数に見える。8.184 MHz では、中間周波数が f_s/2 に来て、帯域の上と下の半分が重なる。")
F["e04_alias"] = _f04_alias_fig()


# =====================================================================
# 3 節: 1 bit の量子化 — 雑音が、小さな信号を ±1 の割合の偏りに変える
# =====================================================================
def _f04_dither_fig():
    from scipy.stats import norm as _nrm
    o = []
    s0 = 0.3
    o.append(T(14, 17, "(a) 雑音の分布を信号の分だけずらす（s = 0.3σ）", "start", 11, INK, True))
    p = Plot(62, 36, 290, 136, (-3.5, 3.5), (0, 0.46))
    xs = _f04_np.linspace(-3.5, 3.5, 281)
    pos = [(x, _nrm.pdf(x - s0)) for x in xs if x >= 0]
    neg = [(x, _nrm.pdf(x - s0)) for x in xs if x <= 0]
    o.append(PL([(p.X(0), p.Y(0))] + [(p.X(a), p.Y(b)) for a, b in pos] + [(p.X(3.5), p.Y(0))], c="none", lw=0, fill=SSOFT))
    o.append(PL([(p.X(-3.5), p.Y(0))] + [(p.X(a), p.Y(b)) for a, b in neg] + [(p.X(0), p.Y(0))], c="none", lw=0, fill=ASOFT))
    o.append(p.axes(xl="標本の値 x/σ", yl="確率の密度", xt=[-3, -2, -1, 0, 1, 2, 3], yt=[0, 0.1, 0.2, 0.3, 0.4], xfmt=_f04_m, yfmt=_f04_m))
    o.append(p.line([(x, _nrm.pdf(x)) for x in xs], c=FNT, lw=1.2, dash="4 3"))
    o.append(p.line([(x, _nrm.pdf(x - s0)) for x in xs], c=TEA, lw=2.0))
    o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=INK, lw=1.4))
    pp = _nrm.cdf(s0)
    o.append(T(p.X(1.55), p.Y(0.15), "q = +1: %.3f" % pp, "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-1.7), p.Y(0.15), "q = −1: %.3f" % (1 - pp), "middle", 9.5, ALI, True, halo=True))
    o.append(T(p.X(-3.3), p.Y(0.43), "破線: 信号が無いとき（0.5 ずつ）", "start", 9, MUT, halo=True))
    # (b) q の平均
    xb = 430
    o.append(T(xb - 30, 17, "(b) 1 bit の出力の平均", "start", 11, INK, True))
    q = Plot(xb, 36, 250, 136, (-3, 3), (-1.25, 1.25))
    o.append(q.axes(xl="信号の値 s/σ", yl="q の平均", xt=[-3, -2, -1, 0, 1, 2, 3], yt=[-1, -0.5, 0, 0.5, 1], xfmt=_f04_m, yfmt=_f04_m))
    xs2 = _f04_np.linspace(-3, 3, 241)
    o.append(q.line([(-3, -1), (0, -1), (0, 1), (3, 1)], c=ALI, lw=1.6))
    o.append(q.clip([(x, math.sqrt(2 / math.pi) * x) for x in xs2], c=GLD, lw=1.6, dash="5 3"))
    o.append(q.line([(x, 2 * _nrm.cdf(x) - 1) for x in xs2], c=SIG, lw=2.4))
    o.append(T(q.X(0.15), q.Y(1.1), "雑音が無いとき（符号だけ）", "start", 9, ALI, True, halo=True))
    o.append(T(q.X(-2.9), q.Y(-0.5), "雑音があるとき", "start", 9, SIG, True, halo=True))
    o.append(TX(q.X(-2.9), q.Y(0.45), "0 の近くの傾き √(2/π) = 0.798", "start", 9, GLD, True, True))
    # (c) 時間の見方
    o.append(T(14, 244, "(c) 雑音より小さい正弦波（振幅 0.2σ）を 1 bit にして、400 周期平均する", "start", 11, INK, True))
    rg = _f04_np.random.default_rng(4)
    nper, K = 400, 64
    ph = 2 * math.pi * _f04_np.arange(2 * K) / K
    sig = 0.2 * _f04_np.sin(ph)
    acc = _f04_np.zeros(2 * K)
    first = None; firstq = None
    for m in range(nper):
        x = sig + rg.standard_normal(2 * K)
        qq = _f04_np.where(x >= 0, 1.0, -1.0)
        if first is None:
            first, firstq = x, qq
        acc += qq
    acc /= nper
    rows = [("1 周期の標本 x = s + w（青の線が s）", first, (-3.2, 3.2), TEA), ("1 bit にした値 q", firstq, (-1.4, 1.4), PUR),
            ("400 周期の q の平均（点）と √(2/π) s/σ（破線）", acc, (-0.3, 0.3), SIG)]
    for i, (lab, v, yr, c) in enumerate(rows):
        r = Plot(62, 264 + i * 66, 618, 42, (0, 2 * K - 1), yr)
        o.append(RECT(r.x, r.y, r.w, r.h, 2, SCR, LIN, 0.8))
        o.append(W(r.x, r.Y(0), r.x + r.w, r.Y(0), c=GRD, lw=1))
        o.append(T(r.x, r.y - 4, lab, "start", 9.5, c, True))
        if i == 0:
            o.append(r.line([(k, sig[k]) for k in range(2 * K)], c=SIG, lw=2))
        if i == 2:
            o.append(r.line([(k, math.sqrt(2 / math.pi) * sig[k]) for k in range(2 * K)], c=GLD, lw=1.6, dash="5 3"))
            o.append(r.line([(k, sig[k]) for k in range(2 * K)], c=FNT, lw=1.0))
        for k in range(2 * K):
            o.append(D(r.X(k), r.Y(max(yr[0], min(yr[1], v[k]))), c, 1.8))
    o.append(T(680, 264 + 2 * 66 + 58, "時間（2 周期分、1 周期に 64 標本）", "end", 9.5, MUT))
    return SVG(700, 470, o, "1 bit の量子化と雑音の働き。(a) 雑音（標準偏差 σ）の分布を、信号の値 s だけずらすと、0 より右の面積が増え、q = +1 の出る割合が 1/2 より大きくなる。(b) q の平均は、s が σ より小さい範囲では s に比例し、傾きは √(2/π) である（青）。雑音が無いと、q は s の符号しか表さない（赤）。(c) 雑音に埋もれた振幅 0.2σ の正弦波も、1 bit にした値を多くの周期で平均すると、√(2/π) 倍の大きさの正弦波として戻る。")
F["e04_dither"] = _f04_dither_fig()


# =====================================================================
# 3 節: 量子化の損失のデータ（$SP/g04/q_curves2.py・q_final.py・q_curves.py で計算した値）
# 前段は幅 2.046 MHz の理想のフィルタ、中間周波数 4.092 MHz、積分の時間 1 ms、PRN 1。損失 [dB] は (C/N0) T_coh に対する値
# _F04_QC*: 弱い信号の近似の計算（線）、_F04_QMC: シミュレーション 400 回（0.0 は白色の雑音をそのまま 16.368 MHz で標本にした、標本が独立な場合）
# =====================================================================
_F04_QFS = [5.15, 5.2, 5.25, 5.3, 5.35, 5.4, 5.45, 5.5, 5.55, 5.6, 5.65, 5.7, 5.75, 5.8, 5.85, 5.9, 5.95, 6.0, 6.05, 6.1, 10.25, 10.5, 10.75, 11.0, 11.25, 11.5, 11.75, 12.0, 12.25, 12.5, 12.75, 13.0, 13.25, 13.5, 13.75, 14.0, 14.25, 14.5, 14.75, 15.0, 15.25, 15.5, 15.75, 16.0, 16.25, 16.5, 16.75, 17.0, 17.25, 17.5, 17.75, 18.0, 18.25, 18.5, 18.75, 19.0, 19.25, 19.5, 19.75, 20.0, 20.25, 20.5, 20.75, 21.0, 21.25, 21.5, 21.75, 22.0, 22.25, 22.5, 22.75, 23.0, 23.25, 23.5, 23.75, 24.0, 24.25, 24.5, 24.75, 25.0, 25.25, 25.5, 25.75, 26.0, 26.25, 26.5, 26.75, 27.0, 27.25, 27.5, 27.75, 28.0, 28.25, 28.5, 28.75, 29.0, 29.25, 29.5, 29.75, 30.0, 30.25, 30.5, 30.75, 31.0, 31.25, 31.5, 31.75, 32.0, 32.25, 32.5, 32.75, 33.0, 33.25, 33.5, 33.75, 34.0]
_F04_QCI = [-0.765, -0.752, -0.741, -0.727, -0.71, -0.7, -0.686, -0.695, -0.687, -0.689, -0.702, -0.702, -0.708, -0.696, -0.717, -0.709, -0.716, -0.716, -0.704, -0.714, -0.634, -0.618, -0.587, -0.551, -0.546, -0.544, -0.528, -0.518, -0.512, -0.515, -0.507, -0.501, -0.499, -0.499, -0.497, -0.495, -0.491, -0.49, -0.489, -0.485, -0.486, -0.485, -0.484, -0.482, -0.482, -0.482, -0.481, -0.48, -0.479, -0.48, -0.479, -0.477, -0.478, -0.478, -0.477, -0.476, -0.476, -0.476, -0.476, -0.475, -0.473, -0.474, -0.474, -0.474, -0.473, -0.473, -0.473, -0.473, -0.473, -0.472, -0.472, -0.472, -0.472, -0.472, -0.472, -0.471, -0.472, -0.47, -0.471, -0.47, -0.47, -0.47, -0.47, -0.47, -0.471, -0.47, -0.47, -0.47, -0.469, -0.47, -0.47, -0.469, -0.47, -0.469, -0.469, -0.469, -0.469, -0.468, -0.469, -0.469, -0.469, -0.468, -0.468, -0.468, -0.469, -0.468, -0.468, -0.468, -0.468, -0.468, -0.468, -0.468, -0.468, -0.468, -0.468, -0.467]
_F04_QC1 = [-2.438, -2.413, -2.394, -2.375, -2.351, -2.335, -2.312, -2.311, -2.293, -2.281, -2.281, -2.268, -2.261, -2.237, -2.245, -2.225, -2.225, -2.215, -2.195, -2.198, -1.789, -1.716, -1.648, -1.582, -1.553, -1.534, -1.507, -1.49, -1.476, -1.47, -1.452, -1.439, -1.43, -1.426, -1.426, -1.431, -1.44, -1.455, -1.475, -1.494, -1.519, -1.541, -1.56, -1.571, -1.576, -1.574, -1.561, -1.542, -1.517, -1.487, -1.456, -1.423, -1.395, -1.368, -1.344, -1.324, -1.309, -1.296, -1.286, -1.278, -1.271, -1.267, -1.263, -1.26, -1.258, -1.257, -1.257, -1.258, -1.259, -1.26, -1.263, -1.265, -1.267, -1.27, -1.272, -1.273, -1.274, -1.273, -1.272, -1.269, -1.265, -1.26, -1.256, -1.25, -1.245, -1.239, -1.232, -1.227, -1.222, -1.218, -1.214, -1.21, -1.207, -1.204, -1.202, -1.2, -1.199, -1.197, -1.197, -1.196, -1.196, -1.195, -1.196, -1.196, -1.196, -1.195, -1.196, -1.196, -1.196, -1.195, -1.194, -1.194, -1.193, -1.192, -1.19, -1.188]
_F04_QC2 = [-1.222, -1.205, -1.192, -1.176, -1.157, -1.145, -1.128, -1.134, -1.123, -1.12, -1.129, -1.126, -1.127, -1.112, -1.129, -1.117, -1.122, -1.118, -1.104, -1.112, -0.914, -0.887, -0.849, -0.808, -0.797, -0.791, -0.771, -0.758, -0.749, -0.749, -0.738, -0.73, -0.725, -0.723, -0.719, -0.717, -0.713, -0.712, -0.713, -0.71, -0.713, -0.715, -0.716, -0.715, -0.714, -0.713, -0.709, -0.704, -0.698, -0.693, -0.687, -0.679, -0.676, -0.671, -0.666, -0.663, -0.66, -0.658, -0.656, -0.654, -0.651, -0.65, -0.649, -0.648, -0.646, -0.646, -0.645, -0.643, -0.643, -0.641, -0.641, -0.64, -0.639, -0.639, -0.638, -0.637, -0.637, -0.636, -0.635, -0.634, -0.633, -0.632, -0.631, -0.63, -0.629, -0.628, -0.626, -0.626, -0.624, -0.624, -0.623, -0.622, -0.621, -0.621, -0.62, -0.619, -0.618, -0.617, -0.617, -0.617, -0.617, -0.615, -0.615, -0.615, -0.615, -0.614, -0.614, -0.613, -0.613, -0.613, -0.612, -0.612, -0.611, -0.611, -0.611, -0.61]
_F04_QC3 = [-0.902, -0.887, -0.876, -0.861, -0.843, -0.833, -0.818, -0.825, -0.817, -0.817, -0.829, -0.828, -0.832, -0.82, -0.839, -0.83, -0.837, -0.835, -0.823, -0.832, -0.714, -0.695, -0.662, -0.625, -0.618, -0.615, -0.597, -0.586, -0.58, -0.582, -0.572, -0.566, -0.563, -0.562, -0.559, -0.557, -0.553, -0.552, -0.551, -0.548, -0.548, -0.548, -0.547, -0.545, -0.544, -0.544, -0.542, -0.54, -0.538, -0.537, -0.535, -0.532, -0.532, -0.53, -0.528, -0.527, -0.526, -0.525, -0.525, -0.523, -0.522, -0.522, -0.521, -0.521, -0.52, -0.52, -0.52, -0.519, -0.519, -0.518, -0.517, -0.517, -0.516, -0.516, -0.516, -0.515, -0.515, -0.514, -0.514, -0.514, -0.513, -0.513, -0.513, -0.512, -0.512, -0.512, -0.511, -0.511, -0.51, -0.511, -0.51, -0.509, -0.509, -0.509, -0.509, -0.508, -0.508, -0.507, -0.508, -0.508, -0.507, -0.507, -0.507, -0.507, -0.506, -0.506, -0.506, -0.505, -0.506, -0.505, -0.505, -0.505, -0.504, -0.505, -0.504, -0.504]
_F04_QMC = {0.0: (0.03, -1.90, -0.51, -0.15), 5.456: (-0.69, -2.33, -1.14, -0.81), 10.912: (-0.55, -1.58, -0.80, -0.62), 16.368: (-0.49, -1.62, -0.72, -0.56), 32.736: (-0.46, -1.20, -0.61, -0.49)}
_F04_QB = [0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0, 1.1, 1.2, 1.35, 1.5, 1.75, 2.0, 2.25, 2.5]
_F04_QB16 = [-0.874, -0.7, -0.54, -0.407, -0.308, -0.262, -0.232, -0.216, -0.213, -0.232, -0.274, -0.383, -0.524, -0.677, -0.817]
_F04_QBMC = {0.5: (-0.58, -0.85), 1.0: (-0.24, -0.57), 1.5: (-0.27, -0.76), 2.0: (-0.54, -1.20)}


def _f04_eta2(beta):
    """2 bit（±1・±3、しきい値 βσ）の損失（真数）。標本が独立で、信号が弱いとき。"""
    from scipy.stats import norm as _nrm
    g = (2 + 4 * math.exp(-beta ** 2 / 2)) / math.sqrt(2 * math.pi)
    v = (2 * _nrm.cdf(beta) - 1) + 9 * 2 * (1 - _nrm.cdf(beta))
    return g * g / v


def _f04_qloss_fig():
    from scipy.stats import norm as _nrm
    o = []
    o.append(T(14, 17, "(a) 量子化の入力と出力（灰色は雑音の分布。損失は標本が独立なとき）", "start", 11, INK, True))
    qs = [("1 bit（±1）", [(-3, -1), (0, -1), (0, 1), (3, 1)], 1.5, "−1.96 dB"),
          ("2 bit（±1・±3、しきい値 1.0σ）", [(-3, -3), (-1, -3), (-1, -1), (0, -1), (0, 1), (1, 1), (1, 3), (3, 3)], 3.6, "−0.55 dB"),
          ("3 bit（±1〜±7、段の幅 0.59σ）", None, 8.0, "−0.17 dB")]
    d3 = 0.586
    st3 = [(-3, -7)]
    for k in range(-3, 4):
        lo = k * d3
        st3 += [(lo, 2 * k - 1 if k <= 0 else 2 * k - 1), (lo, 2 * k + 1)]
    st3 = [(-3, -7), (-3 * d3, -7), (-3 * d3, -5), (-2 * d3, -5), (-2 * d3, -3), (-d3, -3), (-d3, -1), (0, -1), (0, 1), (d3, 1), (d3, 3), (2 * d3, 3), (2 * d3, 5), (3 * d3, 5), (3 * d3, 7), (3, 7)]
    for i, (lab, pts, ym, ls) in enumerate(qs):
        x0 = 62 + i * 214
        p = Plot(x0, 46, 168, 100, (-3, 3), (-ym, ym))
        xs = _f04_np.linspace(-3, 3, 121)
        o.append(PL([(p.X(-3), p.Y(-ym))] + [(p.X(x), p.Y(-ym + 2 * ym * _nrm.pdf(x) / 0.4 * 0.9)) for x in xs] + [(p.X(3), p.Y(-ym))], c="none", lw=0, fill=MSOFT))
        yt = {0: [-1, 0, 1], 1: [-3, -1, 1, 3], 2: [-7, -3, 1, 5]}[i] if i != 2 else [-7, -5, -3, -1, 1, 3, 5, 7]
        o.append(p.axes(xl="入力 x/σ", yl="出力 q" if i == 0 else None, xt=[-3, -2, -1, 0, 1, 2, 3], yt=yt, xfmt=_f04_m, yfmt=_f04_m))
        o.append(p.line(pts if pts else st3, c=SIG, lw=2.2))
        o.append(T(p.x, p.y - 6, lab, "start", 9.5, SIG, True))
        o.append(T(p.x + p.w - 4, p.y + 14, ls, "end", 9.5, ALI, True, halo=True))
    # (b) 2 bit のしきい値
    o.append(T(14, 222, "(b) 2 bit の、しきい値 βσ と損失", "start", 11, INK, True))
    q = Plot(70, 242, 270, 150, (0.2, 2.5), (-1.4, 0))
    o.append(q.axes(xl="しきい値 β（雑音の標準偏差の何倍か）", yl="量子化の損失 [dB]", xt=[0.5, 1.0, 1.5, 2.0, 2.5], yt=[-1.4, -1.2, -1.0, -0.8, -0.6, -0.4, -0.2, 0], xfmt=_f04_m, yfmt=_f04_m))
    bb = _f04_np.linspace(0.2, 2.5, 116)
    o.append(q.line([(b, 10 * math.log10(_f04_eta2(b))) for b in bb], c=SIG, lw=2.2))
    o.append(q.line(list(zip(_F04_QB, _F04_QB16)), c=PUR, lw=2.0, dash="6 3"))
    for b, (v16, vw) in _F04_QBMC.items():
        o.append(CIRC(q.X(b), q.Y(vw), 3.8, c=SIG, lw=1.6, fill=SCR))
        o.append(RECT(q.X(b) - 3.4, q.Y(v16) - 3.4, 6.8, 6.8, 0.5, SCR, PUR, 1.5))
    o.append(T(q.X(1.0), q.Y(-0.55) + 16, "−0.55 dB（β = 1.0）", "middle", 9.5, SIG, True, halo=True))
    o.append(LEGL(q.x - 50, q.y + q.h + 46, [(SIG, None, "標本が独立なとき（式）"), (PUR, "6 3", "16.368 MHz（近似の計算）")], 9, 10))
    o.append(T(q.x + q.w, q.y + q.h + 62, "○・□: シミュレーション（各 300 回）", "end", 9, MUT))
    # (c) サンプリング周波数と損失
    xb = 430
    o.append(T(xb - 30, 222, "(c) サンプリング周波数と損失（フィルタの分を含む）", "start", 11, INK, True))
    r = Plot(xb, 242, 250, 150, (4, 34), (-2.6, 0))
    for a, b in ((4, 5.115), (6.138, 10.23)):
        o.append(RECT(r.X(a), r.y, r.X(b) - r.X(a), r.h, 0, ASOFT, "none", 0))
    o.append(r.axes(xl="サンプリング周波数 f_s [MHz]", yl="損失 [dB]", xt=[5, 10, 15, 20, 25, 30], yt=[-2.5, -2.0, -1.5, -1.0, -0.5, 0], xfmt=_f04_m, yfmt=_f04_m))
    n2 = 20
    for arr, c, dash in ((_F04_QCI, MUT, None), (_F04_QC1, ALI, None), (_F04_QC2, SIG, None), (_F04_QC3, GRN, None)):
        o.append(r.line(list(zip(_F04_QFS[:n2], arr[:n2])), c=c, lw=2.0, dash=dash))
        o.append(r.line(list(zip(_F04_QFS[n2:], arr[n2:])), c=c, lw=2.0, dash=dash))
    for fsv, vals in _F04_QMC.items():
        if fsv == 0.0:
            continue
        for v, c in zip(vals, (MUT, ALI, SIG, GRN)):
            o.append(CIRC(r.X(fsv), r.Y(v), 3.4, c=c, lw=1.5, fill=SCR))
    for v, c in ((-1.96, ALI), (-0.55, SIG), (-0.17, GRN)):
        o.append(W(r.X(30.5), r.Y(v), r.X(34), r.Y(v), c=c, lw=1.6, dash="2 2"))
    o.append(T(r.X(33.8), r.Y(-1.96) + 13, "独立なとき", "end", 9, ALI, True, halo=True))
    o.append(T(r.X(7.8), r.y + 14, "重なる", "middle", 9, ALI, True, halo=True))
    o.append(LEGL(r.x - 50, r.y + r.h + 46, [(ALI, None, "1 bit"), (SIG, None, "2 bit"), (GRN, None, "3 bit"), (MUT, None, "量子化しない")], 9, 8))
    o.append(T(r.x + r.w, r.y + r.h + 62, "○: シミュレーション（各 400 回）", "end", 9, MUT))
    return SVG(700, 466, o, "量子化の損失（中間周波数 4.092 MHz、幅 2.046 MHz の理想のフィルタ、積分の時間 1 ms）。(a) 1・2・3 bit の量子化の入力と出力。損失は、標本どうしが独立なときの式の値。(b) 2 bit の損失は、しきい値が雑音の標準偏差に近いとき最も小さい（線は式と近似の計算、点はシミュレーション）。(c) 帯域の幅より速く標本をとると、量子化の損失は小さくなる。赤い範囲は、帯域が折り返して自分と重なるサンプリング周波数。点線は、標本が独立なときの量子化の損失。")
F["e04_qloss"] = _f04_qloss_fig()
