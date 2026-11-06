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
    o.append(T(176, 138, "ベースバンド処理（数の計算。衛星ごとに分かれる）", "start", 10.5, PUR, True, halo=True))
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
    items = [("A/D の|入力", -15.7, ALI), ("1 ms|足す", 16.7, GRN), ("20 ms|足す", 29.7, GRN)]
    for i, (lab, v, c) in enumerate(items):
        x0 = q.X(i + 0.18); x1 = q.X(i + 0.82)
        o.append(RECT(x0, min(q.Y(v), q.Y(0)), x1 - x0, abs(q.Y(v) - q.Y(0)), 2, soft(c), c, 1.2))
        o.append(T((x0 + x1) / 2, q.Y(v) + (14 if v < 0 else -6), _f04_m(v, 1), "middle", 9.5, c, True, halo=True))
        for j, ln in enumerate(lab.split("|")):
            o.append(T((x0 + x1) / 2, q.y + q.h + 15 + j * 13, ln, "middle", 9, INK))
    o.append(T(q.x + q.w / 2, q.y + q.h + 46, "（量子化の損失を含む）", "middle", 9, MUT))
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
    o.append(TX(14, 222, "(c) イメージを弱める量と C/N_0 の減り", "start", 11, INK, True))
    r = Plot(70, 240, 270, 120, (0, 30), (0, 3.2))
    o.append(r.axes(xl="混合器の前でイメージを弱める量 A [dB]", yl="C/N_0 の減り [dB]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[0, 1, 2, 3], yfmt=_f04_m))
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
    return SVG(700, 400, o, "イメージ周波数（例の値: 局部発振器 1571.328 MHz、中間周波数 4.092 MHz）。(a) 局部発振器を挟んで L1 の反対側 4.092 MHz にある 1567.236 MHz が、イメージ周波数である。そこに信号は無いが、雑音は L1 のまわりと同じ密度で入る。(b) cos だけで混合すると、L1 の雑音とイメージの雑音が同じ中間周波数に重なり、雑音の密度が 2 倍（+3.0 dB）になる。(c) 混合器の前でイメージを A dB 弱めると、C/N0 の減りは 10 log₁₀(1 + 10<sup>−A/10</sup>) dB で、20 dB 弱めれば 0.04 dB になる。(d) cos と sin の 2 つの出力を複素数とみなすと、L1 は正の周波数、イメージは負の周波数に分かれる。")
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
    o.append(T(p.x + p.w + 40, p.y + p.h / 2, "L1 での見かけのずれ [kHz]", "middle", 10, MUT, rot=90))
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
        o.append(TX(r.X(fsv / 2) + 3, r.y + r.h - 4, "f_s/2", "start", 9, MUT, False, True) if fsv != 8.184 else "")
    o.append(TX(680, 238 + 2 * 76 + 80, "周波数 [MHz]（灰色: 0〜f_s/2、破線: f_s/2 の整数倍）", "end", 9.5, MUT))
    return SVG(700, 482, o, "標本をとると周波数が折り返す（例の値: 中間周波数 4.092 MHz、帯域の幅 2.046 MHz）。(a) 4.092 MHz の正弦波を 5.456 MHz で標本にした点は、1.364 MHz の正弦波の上にも乗り、標本の列では区別できない。(b) 帯域が f<sub>s</sub>/2 ごとの 1 つの区間に入るサンプリング周波数（緑）なら、折り返しても帯域は自分と重ならない。(c) 16.368 MHz ではそのまま、5.456 MHz では裏返って低い周波数に見える。8.184 MHz では、中間周波数が f<sub>s</sub>/2 に来て、帯域の上と下の半分が重なる。")
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
        o.append(T(p.x + p.w - 4, p.y + p.h - 8, ls, "end", 9.5, ALI, True, halo=True))
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
    o.append(W(r.X(26), r.Y(-1.96), r.X(34), r.Y(-1.96), c=ALI, lw=1.6, dash="2 2"))
    o.append(T(r.X(33.8), r.Y(-1.96) + 13, "1 bit・標本が独立なとき", "end", 9, ALI, True, halo=True))
    o.append(T(r.X(7.8), r.y + 14, "重なる", "middle", 9, ALI, True, halo=True))
    o.append(LEGL(r.x - 50, r.y + r.h + 46, [(ALI, None, "1 bit"), (SIG, None, "2 bit"), (GRN, None, "3 bit"), (MUT, None, "量子化しない")], 9, 8))
    o.append(T(r.x + r.w, r.y + r.h + 62, "○: シミュレーション（各 400 回）", "end", 9, MUT))
    return SVG(700, 466, o, "量子化の損失（中間周波数 4.092 MHz、幅 2.046 MHz の理想のフィルタ、積分の時間 1 ms）。(a) 1・2・3 bit の量子化の入力と出力。損失は、標本どうしが独立なときの式の値。(b) 2 bit の損失は、しきい値が雑音の標準偏差に近いとき最も小さい（線は式と近似の計算、点はシミュレーション）。(c) 帯域の幅より速く標本をとると、量子化の損失は小さくなる。赤い範囲は、帯域が折り返して自分と重なるサンプリング周波数。点線は、1 bit で標本が独立なときの損失（−1.96 dB）。")
F["e04_qloss"] = _f04_qloss_fig()


# =====================================================================
# 4 節: NCO — 足し算を繰り返して位相を作る
# =====================================================================
def _f04_nco_fig():
    o = []
    o.append(TX(14, 17, "(a) 位相のレジスタ（1 周期 = 2^{32}）", "start", 11, INK, True))
    p = Plot(56, 40, 196, 150, (0, 20), (0, 1.05))
    o.append(p.axes(xl="標本の番号 k", yl="位相 [周期]", xt=[0, 4, 8, 12, 16, 20], yt=[0, 0.25, 0.5, 0.75, 1], yfmt=_f04_m))
    for frac, c in ((0.25, SIG), (0.3, PUR)):
        pts = []
        for k in range(21):
            ph = (k * frac) % 1.0
            pts.append((k, ph))
            o.append(D(p.X(k), p.Y(ph), c, 3.0))
        for k in range(20):
            a, b = pts[k], pts[k + 1]
            if b[1] > a[1]:
                o.append(W(p.X(a[0]), p.Y(a[1]), p.X(b[0]), p.Y(b[1]), c=c, lw=1.2))
    o.append(TX(p.x + 2, p.y + p.h + 44, "青: K = 2^{30}（1/4 周期ずつ）", "start", 9.5, SIG, True))
    o.append(TX(p.x + 2, p.y + p.h + 58, "紫: K = 0.3 × 2^{32}（0.3 周期ずつ）", "start", 9.5, PUR, True))
    # (b) cos の表を引いた値
    o.append(T(290, 17, "(b) 位相で cos の表を引く", "start", 11, INK, True))
    q = Plot(312, 40, 176, 150, (0, 20), (-1.2, 1.2))
    o.append(q.axes(xl="標本の番号 k", yl=None, xt=[0, 4, 8, 12, 16, 20], yt=[-1, 0, 1], yfmt=_f04_m))
    kk = _f04_np.linspace(0, 20, 401)
    for frac, c in ((0.25, SIG), (0.3, PUR)):
        o.append(q.line([(k, math.cos(2 * math.pi * frac * k)) for k in kk], c=c, lw=1.0, dash="3 3"))
        for k in range(21):
            o.append(D(q.X(k), q.Y(math.cos(2 * math.pi * frac * k)), c, 3.0))
    o.append(TX(q.x + 2, q.y + q.h + 44, "青: 4.092 MHz（f_s/4）", "start", 9.5, SIG, True))
    o.append(TX(q.x + 2, q.y + q.h + 58, "紫: 4.910 MHz（0.3 f_s）", "start", 9.5, PUR, True))
    # (c) 符号の NCO
    o.append(TX(512, 17, "(c) 符号の NCO（K = 2^{28}）", "start", 11, INK, True))
    r = Plot(540, 40, 140, 150, (0, 48), (0, 3.2))
    o.append(r.axes(xl="標本の番号 k", yl=None, xt=[0, 16, 32, 48], yt=[0, 1, 2, 3], yfmt=_f04_m))
    o.append(r.steps([(k, (k // 16)) for k in range(49)], c=GLD, lw=2.0))
    for n in range(3):
        v = int(_F04_PM[n])
        o.append(T(r.X(16 * n + 8), r.Y(n) - 6, "a[%d] = %s" % (n, "+1" if v > 0 else "−1"), "middle", 9, ALI if v < 0 else GRN, True, halo=True))
    o.append(T(r.x + 2, r.y + r.h + 44, "整数部 = チップの番号", "start", 9.5, GLD, True))
    o.append(T(r.x + 2, r.y + r.h + 58, "1 チップに 16 標本", "start", 9.5, GLD, True))
    # 例の値の表
    y0 = 266
    o.append(W(14, y0 - 8, 686, y0 - 8, c=LIN, lw=0.8))
    rows = [("搬送波 4.092 MHz", "K = 2^30 = 1 073 741 824"), ("搬送波 4.093 MHz（ドップラー +1 kHz）", "K = 1 074 004 224（+262 400）"),
            ("符号 1.023 M チップ/s", "K = 2^28 = 268 435 456"), ("周波数の細かさ", "f_s/2^32 = 3.8 mHz")]
    o.append(TX(14, y0 + 8, "f_s = 16.368 MHz、32 ビットのレジスタの例: f_{NCO} = K f_s/2^{32}", "start", 10, INK, True))
    for i, (a, b) in enumerate(rows):
        yy = y0 + 28 + i * 17
        o.append(T(30, yy, a, "start", 9.5, MUT))
        o.append(TX(300, yy, b, "start", 9.5, INK, True))
    return SVG(700, 352, o, "NCO（数値制御発振器、f<sub>s</sub> = 16.368 MHz の例）。(a) 標本ごとにレジスタに K を足し、あふれた桁を捨てると、位相が一定の速さで増える。K が大きいほど速く回り、周波数が高い。(b) 位相で cos と sin の表を引いた値が、局部の搬送波になる。(c) 符号の NCO は、位相の整数部をチップの番号として数え、C/A 符号の表を引く（PRN 1 の最初の 3 チップ）。")
F["e04_nco"] = _f04_nco_fig()


# =====================================================================
# 4 節: 相関器のブロック図
# =====================================================================
def _f04_mult(x, y, c=INK):
    return CIRC(x, y, 13, c=c, lw=1.5, fill=SCR) + W(x - 6, y - 6, x + 6, y + 6, c=c, lw=1.6) + W(x - 6, y + 6, x + 6, y - 6, c=c, lw=1.6)


def _f04_corrblock_fig():
    o = []
    yI, yQ, ym = 84, 236, 160
    o.append(RECT(14, ym - 24, 96, 48, 7, SSOFT, SIG, 1.4))
    o.append(TX(62, ym - 4, "標本 y_k", "middle", 10.5, INK, True))
    o.append(T(62, ym + 12, "A/D 変換から", "middle", 9, MUT))
    o.append(W(110, ym, 130, ym, c=SIG, lw=1.6))
    o.append(W(130, yI, 130, yQ, c=SIG, lw=1.6))
    xc, xk, xs = 230, 380, 486
    for yy in (yI, yQ):
        o.append(ARR(130, yy, xc - 13, yy, c=SIG, lw=1.6))
        o.append(_f04_mult(xc, yy))
        o.append(ARR(xc + 13, yy, xk - 13, yy, c=SIG, lw=1.6))
        o.append(_f04_mult(xk, yy))
        o.append(ARR(xk + 13, yy, xs - 4, yy, c=SIG, lw=1.6))
        for k in (2, 1, 0):
            o.append(RECT(xs + 5 * k, yy - 20 - 5 * k, 62, 40, 6, PAN, PUR, 1.2))
        o.append(TX(xs + 31, yy - 3, "Σ（J 個）", "middle", 10, PUR, True))
        o.append(T(xs + 31, yy + 12, "E・P・L", "middle", 9, PUR))
    # NCO
    _f04_box(o, xc - 56, ym - 22, 112, 44, "搬送波の NCO", "cos・sin の表", GLD, None)
    _f04_box(o, xk - 56, ym - 22, 112, 44, "符号の NCO", "C/A 符号の表", GLD, None)
    o.append(ARR(xc, ym - 22, xc, yI + 14, c=GLD, lw=1.5))
    o.append(ARR(xc, ym + 22, xc, yQ - 14, c=GLD, lw=1.5))
    o.append(ARR(xk, ym - 22, xk, yI + 14, c=GLD, lw=1.5))
    o.append(ARR(xk, ym + 22, xk, yQ - 14, c=GLD, lw=1.5))
    o.append(TX(xc - 8, yI + 34, "2cos ψ̂_k", "end", 10, GLD, True, True))
    o.append(TX(xc - 8, yQ - 26, "2sin ψ̂_k", "end", 10, GLD, True, True))
    o.append(T(xk - 8, yI + 34, "E・P・L の 3 つ", "end", 9.5, GLD, True, halo=True))
    o.append(TX(xk + 8, yQ - 26, "a(t_k − τ̂ ∓ Δ_{EL}T_c/2) など", "start", 9.5, GLD, True, True))
    # 出力
    o.append(TX(xs + 78, yI - 30, "I_E・I_P・I_L", "start", 10.5, SIG, True))
    o.append(TX(xs + 78, yQ + 40, "Q_E・Q_P・Q_L", "start", 10.5, SIG, True))
    _f04_box(o, 600, ym - 30, 90, 60, "追尾の計算", "プログラム", PUR, "5 章")
    o.append(W(xs + 72, yI, 645, yI, c=SIG, lw=1.6))
    o.append(ARR(645, yI, 645, ym - 30, c=SIG, lw=1.6))
    o.append(W(xs + 72, yQ, 645, yQ, c=SIG, lw=1.6))
    o.append(ARR(645, yQ, 645, ym + 30, c=SIG, lw=1.6))
    o.append(T(612, yI - 6, "1 ms ごと", "middle", 9, SIG, True))
    # 直す向き
    o.append(W(600, ym, xk + 56 + 18, ym, c=GLD, lw=1.4, dash="5 3"))
    o.append(ARR(xk + 56 + 18, ym, xk + 58, ym, c=GLD, lw=1.4))
    o.append(W(xk - 56, ym + 8, xc + 58, ym + 8, c=GLD, lw=1.4, dash="5 3"))
    o.append(ARR(xc + 70, ym + 8, xc + 58, ym + 8, c=GLD, lw=1.4))
    o.append(T(xs + 50, ym - 6, "K を書き換える", "middle", 9.5, GLD, True, halo=True))
    o.append(T(14, 300, "上の段（I）は cos、下の段（Q）は sin を掛ける。符号を掛けて足す所は、局部の符号の遅れを少しずつ変えた E・P・L の 3 つがあり、", "start", 9.5, INK))
    o.append(T(14, 315, "全部で 6 つの和（6 つの相関器の出力）ができる。積分の時間（ふつう 1 ms）だけ足したら値を出し、和を 0 に戻す。", "start", 9.5, INK))
    return SVG(700, 326, o, "相関器の組み立て。A/D 変換の標本に、搬送波の NCO が作る cos と sin を掛け（I と Q）、符号の NCO が作る局部の符号を掛けて、積分の時間のあいだ足す。追尾の計算（5 章）が、出力の I・Q からずれを求め、NCO の K を書き換える。")
F["e04_corrblock"] = _f04_corrblock_fig()


# =====================================================================
# 4 節: I・Q の平面 — 位相のずれ・周波数のずれ・雑音（シミュレーション）
# =====================================================================
def _f04_corrsim(n, dtau, dpsi, df, cn0, T_=1e-3, seed=5, fs=16.368e6):
    """中間周波数の標本（√(2C) = 1）から E・P・L の I・Q を n 回計算する（Δ_EL = 1 チップ）。返り値 [n, 3, 2]。"""
    rg = _f04_np.random.default_rng(seed)
    J = int(round(fs * T_)); t = _f04_np.arange(J) / fs
    tau = 100.3 / _F04_RC; psi = 0.7
    sig = _F04_PM[(_f04_np.floor((t - tau) * _F04_RC).astype(int)) % 1023] * _f04_np.cos(2 * math.pi * (_F04_FIF + df) * t + psi)
    sd = math.sqrt(0.5 / 10 ** (cn0 / 10) * fs / 2) if cn0 is not None else 0.0
    th = 2 * math.pi * _F04_FIF * t + psi - math.radians(dpsi)
    c2, s2 = 2 * _f04_np.cos(th), 2 * _f04_np.sin(th)
    loc = [_F04_PM[(_f04_np.floor((t - tau - (dtau + off) / _F04_RC) * _F04_RC).astype(int)) % 1023] for off in (-0.5, 0.0, 0.5)]
    out = _f04_np.zeros((n, 3, 2))
    for i in range(n):
        y = sig + (sd * rg.standard_normal(J) if sd > 0 else 0)
        for j in range(3):
            out[i, j, 0] = (y * loc[j] * c2).sum() / J
            out[i, j, 1] = (y * loc[j] * s2).sum() / J
    return out


def _f04_iq_fig():
    o = []
    def plane(x, y, w, lab):
        p = Plot(x, y, w, w, (-1.25, 1.25), (-1.25, 1.25))
        o.append(p.axes(xl="I（√(2C) = 1）", yl="Q", xt=[-1, 0, 1], yt=[-1, 0, 1], xfmt=_f04_m, yfmt=_f04_m))
        o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=MUT, lw=1))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
        o.append(p.line([(math.cos(a), math.sin(a)) for a in _f04_np.linspace(0, 2 * math.pi, 121)], c=FNT, lw=1.1, dash="4 3"))
        o.append(T(x - 6, 17, lab, "start", 11, INK, True))
        return p
    p = plane(60, 40, 170, "(a) 位相のずれと、データ")
    pts = [(0, 1, SIG, "Δψ = 0°", (6, -8)), (30, 1, GRN, "30°", (6, 14)), (90, 1, GLD, "90°", (8, 4)), (30, -1, ALI, "30°・d = −1", (-6, -8))]
    for dp, d, c, lab, off in pts:
        I_ = d * math.cos(math.radians(dp)); Q_ = -d * math.sin(math.radians(dp))
        o.append(ARR(p.X(0), p.Y(0), p.X(I_), p.Y(Q_), c=c, lw=1.8, head=6))
        o.append(D(p.X(I_), p.Y(Q_), c, 4))
        o.append(TX(p.X(I_) + off[0], p.Y(Q_) + off[1], lab, "start" if off[0] > 0 else "end", 9.5, c, True, True))
    # (b) 周波数のずれ
    q = plane(300, 40, 170, "(b) 周波数のずれ（1 ms）")
    dfs = _f04_np.linspace(0, 1000, 201)
    cur = [(float(_f04_np.sinc(f * 1e-3)) * math.cos(math.pi * f * 1e-3), -float(_f04_np.sinc(f * 1e-3)) * math.sin(math.pi * f * 1e-3)) for f in dfs]
    o.append(q.line(cur, c=PUR, lw=1.8))
    for f, off in ((0, (-4, -10)), (250, (8, -6)), (500, (8, 16)), (750, (-8, 14))):
        sc = float(_f04_np.sinc(f * 1e-3)); I_ = sc * math.cos(math.pi * f * 1e-3); Q_ = -sc * math.sin(math.pi * f * 1e-3)
        o.append(D(q.X(I_), q.Y(Q_), PUR, 4))
        o.append(T(q.X(I_) + off[0], q.Y(Q_) + off[1], "%d Hz（%.2f）" % (f, sc), "start" if off[0] > 0 else "end", 9, PUR, True, halo=True))
    o.append(T(q.X(0) - 6, q.Y(0) - 6, "1000 Hz（0）", "end", 9, PUR, True, halo=True))
    # (c) 雑音のある E・P・L（シミュレーション）
    r = plane(530, 40, 150, "(c) 雑音（45 dB-Hz）")
    sim = _f04_corrsim(60, 0.25, 30, 0, 45.0)
    for j, c in ((0, GRN), (2, GLD), (1, SIG)):
        for i in range(sim.shape[0]):
            o.append(D(r.X(sim[i, j, 0]), r.Y(sim[i, j, 1]), c, 1.8))
    for lab, v, c, off in (("E", 0.75, GRN, (-8, -6)), ("P", 0.75, SIG, (8, 14)), ("L", 0.25, GLD, (-8, 14))):
        I_ = v * math.cos(math.radians(30)); Q_ = -v * math.sin(math.radians(30))
        o.append(CIRC(r.X(I_), r.Y(Q_), 4.5, c=INK, lw=1.6, fill=SCR))
    o.append(T(r.X(0.72), r.Y(0.05), "E と P", "middle", 9, SIG, True, halo=True))
    o.append(T(r.X(0.0), r.Y(-0.5), "L", "middle", 9, GLD, True, halo=True))
    o.append(T(530, 284, "Δτ = +0.25 チップ、Δψ = 30°、60 回", "start", 9, MUT))
    o.append(T(530, 298, "○: 式の値、点: 標本からの計算", "start", 9, MUT))
    return SVG(700, 312, o, "相関器の出力 I・Q を平面の点として見る（√(2C) = 1、積分の時間 1 ms）。(a) 搬送波の位相のずれ Δψ は点を回し、データのビットが −1 になると点は原点の反対側に移る。(b) 周波数のずれは、点を sinc(Δf T<sub>coh</sub>) 倍に縮め、平均の位相 πΔf T<sub>coh</sub> だけ回す。1 kHz で 0 になる。(c) C/N0 = 45 dB-Hz の雑音を足した中間周波数の標本（16.368 MHz、PRN 1）から計算した E・P・L の点（局部の符号が 0.25 チップ遅れ、位相が 30° ずれている場合）。雑音の散らばりの標準偏差は、I と Q のそれぞれで √(N₀/T<sub>coh</sub>) = 0.126 である。")
F["e04_iq"] = _f04_iq_fig()


# =====================================================================
# 4 節: E・P・L の 3 点と三角形
# =====================================================================
def _f04_epl_fig():
    o = []
    lam = lambda x: max(0.0, 1 - abs(x))
    cases = [(0.0, "(a) 合っている（Δτ = 0）"), (0.25, "(b) 局部の符号が 0.25 チップ遅れ"), (-0.5, "(c) 局部の符号が 0.5 チップ早い")]
    for i, (dt, ttl) in enumerate(cases):
        x0 = 56 + i * 222
        p = Plot(x0, 40, 180, 130, (-1.6, 1.6), (0, 1.15))
        o.append(T(x0 - 40, 17, ttl, "start", 10.5, INK, True))
        o.append(p.axes(xl="局部の符号のずれ [チップ]", yl="大きさ" if i == 0 else None, xt=[-1.5, -1, -0.5, 0, 0.5, 1, 1.5], yt=[0, 0.5, 1], xfmt=_f04_m, yfmt=_f04_m))
        o.append(p.line([(-1.6, 0), (-1, 0), (0, 1), (1, 0), (1.6, 0)], c=FNT, lw=1.6))
        vals = []
        for off, lab, c in ((-0.5, "E", GRN), (0.0, "P", SIG), (0.5, "L", GLD)):
            x = dt + off; v = lam(x); vals.append(v)
            o.append(W(p.X(x), p.Y(0), p.X(x), p.Y(v), c=c, lw=1.4, dash="3 2"))
            o.append(D(p.X(x), p.Y(v), c, 4.6))
            ax, dx = {"E": ("end", -6), "P": ("middle", 0), "L": ("start", 6)}[lab]
            o.append(T(p.X(x) + dx, p.Y(v) - (12 if lab == "P" else 6), "%s %.2f" % (lab, v), ax, 9.5, c, True, halo=True))
        dd = vals[0] - vals[2]
        o.append(T(p.x + p.w / 2, p.y + p.h + 48, "E − L = %s" % _f04_m(dd, 2), "middle", 10, ALI if abs(dd) > 1e-9 else GRN, True))
        o.append(T(p.x + p.w / 2, p.y + p.h + 63, ("ずれ (E − L)/2 = %s チップ" % _f04_m(dd / 2, 2)) if abs(dd) > 1e-9 else "ずれなし", "middle", 9.5, MUT))
    return SVG(700, 250, o, "E・P・L の 3 つの相関器の値（E と L の間隔 1 チップ、大きさは √(2C) で割った値）。横軸は、受けた符号に対する局部の符号のずれで、三角形は 2 章 3 節の相関の山である。(a) 合っていると E と L が等しい。(b) 局部の符号が遅れていると E が大きくなり、(c) 早いと L が大きくなる。E − L の半分が、ずれの大きさ（三角形の辺の上にある間）を表す。")
F["e04_epl"] = _f04_epl_fig()


# =====================================================================
# 5 節: 衛星ごとの符号の位相とドップラー（1 章の近似の GPS の配置、東京）
# =====================================================================
_F04_MU = 3.986004418e14; _F04_WE = 7.2921151467e-5; _F04_AW = 6378137.0; _F04_FW = 1 / 298.257223563
_F04_E2 = _F04_FW * (2 - _F04_FW); _F04_D2R = math.pi / 180


def _f04_geod(B, L, h):
    B *= _F04_D2R; L *= _F04_D2R
    N = _F04_AW / math.sqrt(1 - _F04_E2 * math.sin(B) ** 2)
    return _f04_np.array([(N + h) * math.cos(B) * math.cos(L), (N + h) * math.cos(B) * math.sin(L), (N * (1 - _F04_E2) + h) * math.sin(B)])


_F04_RX = (35.681, 139.767, _f04_geod(35.681, 139.767, 40.0))
_F04_SATS = [dict(nm="G%d" % (p * 4 + s + 1), a=26560e3, i=55.0, Om=60.0 * p, M=90.0 * s + 15.0 * p) for p in range(6) for s in range(4)]


def _f04_satpos(s, t):
    """円軌道の衛星の ECEF の位置（1 章のデモと同じ近似の配置）。"""
    n = math.sqrt(_F04_MU / s["a"] ** 3) / _F04_D2R
    u = (s["M"] + n * t) * _F04_D2R; O = s["Om"] * _F04_D2R; inc = s["i"] * _F04_D2R; a = s["a"]
    q = _f04_np.array([a * (math.cos(O) * math.cos(u) - math.sin(O) * math.sin(u) * math.cos(inc)),
                       a * (math.sin(O) * math.cos(u) + math.cos(O) * math.sin(u) * math.cos(inc)), a * math.sin(u) * math.sin(inc)])
    th = _F04_WE * t; c, sn = math.cos(th), math.sin(th)
    return _f04_np.array([q[0] * c + q[1] * sn, -q[0] * sn + q[1] * c, q[2]])


def _f04_elaz(pp):
    B, L, r0 = _F04_RX
    d = pp - r0; b = B * _F04_D2R; l = L * _F04_D2R
    e = -math.sin(l) * d[0] + math.cos(l) * d[1]
    n = -math.sin(b) * math.cos(l) * d[0] - math.sin(b) * math.sin(l) * d[1] + math.cos(b) * d[2]
    u = math.cos(b) * math.cos(l) * d[0] + math.cos(b) * math.sin(l) * d[1] + math.sin(b) * d[2]
    return math.atan2(u, math.hypot(e, n)) / _F04_D2R, (math.atan2(e, n) / _F04_D2R + 360) % 360, float(_f04_np.linalg.norm(d))


def _f04_visible(t, mask=5.0):
    lam = _F04_C / _F04_FL1
    out = []
    for s in _F04_SATS:
        el, az, r = _f04_elaz(_f04_satpos(s, t))
        if el < mask:
            continue
        rr = (_f04_elaz(_f04_satpos(s, t + 0.5))[2] - _f04_elaz(_f04_satpos(s, t - 0.5))[2])
        fd = -rr / lam
        cp = ((r / _F04_C) * 1e3 % 1.0) * 1023
        out.append((s["nm"], el, az, r, fd, cp))
    return sorted(out, key=lambda v: -v[1])


def _f04_skyxy(cx, cy, R, el, az):
    rr = R * (90.0 - el) / 90.0
    return cx + rr * math.sin(az * _F04_D2R), cy - rr * math.cos(az * _F04_D2R)


def _f04_sky(cx, cy, R, sats, trails=(), dot=4.2, sz=9.5):
    """スカイプロット（1 章と同じ見た目: 中心が真上、外の円が仰角 0°、上が北）。sats = [(仰角, 方位角, 名前, 色)]"""
    o = [CIRC(cx, cy, R, c=MUT, lw=1.3, fill=SCR)]
    for az in range(0, 360, 30):
        x, y = _f04_skyxy(cx, cy, R, 0, az)
        o.append(W(cx, cy, x, y, c=GRD, lw=1))
    for e in (30, 60):
        o.append(CIRC(cx, cy, R * (90 - e) / 90, c=FNT, lw=0.9, dash="3 3"))
    for e in (0, 30, 60):
        o.append(T(cx + 3, cy - R * (90 - e) / 90 + 11, "%d°" % e, "start", 9.5, MUT, False, halo=True))
    for az, lab in ((0, "北"), (90, "東"), (180, "南"), (270, "西")):
        x, y = _f04_skyxy(cx, cy, R + 11, 0, az)
        o.append(T(x, y + 4, lab, "middle", 10, INK, True))
    for pts, c in trails:
        seg = [_f04_skyxy(cx, cy, R, el, az) for el, az in pts if el >= 0]
        if len(seg) > 1:
            o.append(PL(seg, c=c, lw=1.2, dash="2 2"))
    for el, az, nm, c in sats:
        x, y = _f04_skyxy(cx, cy, R, el, az)
        o.append(D(x, y, c, dot))
        o.append(T(x + dot + 2, y + 3.5, nm, "start", sz, c, True, halo=True))
    return "".join(o)


_F04_T0 = 3600.0   # 例の時刻（1 章の近似の配置で、初めの位置から 1 時間後）


def _f04_sats_fig():
    o = []
    vis = _f04_visible(_F04_T0)
    o.append(T(14, 17, "(a) 東京の空（GPS、例の時刻）", "start", 11, INK, True))
    trails = []
    for s in _F04_SATS:
        if any(v[0] == s["nm"] for v in vis):
            pts = [(_f04_elaz(_f04_satpos(s, _F04_T0 - k * 120))[:2]) for k in range(16)]
            trails.append((pts, FNT))
    o.append(_f04_sky(150, 150, 112, [(v[1], v[2], v[0], SIG) for v in vis], trails=trails))
    o.append(T(14, 292, "点線: それまでの 30 分の動き", "start", 9, MUT))
    # (b) 符号の位相とドップラーの平面
    xb = 360
    o.append(T(xb - 20, 17, "(b) 衛星ごとの符号の位相とドップラー", "start", 11, INK, True))
    p = Plot(xb + 30, 40, 290, 200, (0, 1023), (-4000, 4000))
    o.append(p.axes(xl="符号の位相 [チップ]", yl="ドップラー f_D [Hz]", xt=[0, 200, 400, 600, 800, 1000], yt=[-4000, -2000, 0, 2000, 4000], xfmt=_f04_m, yfmt=_f04_m))
    shift = -0.5e-6 * _F04_FL1
    for nm, el, az, r, fd, cp in vis:
        o.append(CIRC(p.X(cp), p.Y(fd + shift), 3.6, c=GLD, lw=1.2, dash="2 1.5"))
        o.append(D(p.X(cp), p.Y(fd), SIG, 4.2))
        o.append(T(p.X(cp) + 6, p.Y(fd) + 4, nm, "start", 9, SIG, True, halo=True))
    o.append(T(p.x + p.w, p.y + p.h + 44, "○（金）: TCXO が +0.5 ppm のとき（全部が 788 Hz 下がる）", "end", 9, GLD, True))
    # (c) チャネルの表
    y0 = 320
    o.append(W(14, y0 - 14, 686, y0 - 14, c=LIN, lw=0.8))
    hdr = [("チャネル", 30, "start"), ("衛星", 110, "start"), ("仰角", 200, "end"), ("方位角", 270, "end"), ("符号の位相", 380, "end"),
           ("ドップラー", 480, "end"), ("搬送波の NCO の周波数", 670, "end")]
    for s_, x, a in hdr:
        o.append(T(x, y0, s_, a, 9.5, MUT, True))
    o.append(W(14, y0 + 5, 686, y0 + 5, c=LIN, lw=0.8))
    for i, (nm, el, az, r, fd, cp) in enumerate(vis):
        yy = y0 + 20 + i * 15.5
        o.append(T(30, yy, "%d" % (i + 1), "start", 9.5, INK))
        o.append(T(110, yy, nm, "start", 9.5, SIG, True))
        o.append(T(200, yy, "%.1f°" % el, "end", 9.5, INK))
        o.append(T(270, yy, "%.0f°" % az, "end", 9.5, INK))
        o.append(T(380, yy, "%.2f チップ" % cp, "end", 9.5, INK))
        o.append(T(480, yy, _f04_m(fd, 0).replace("−", "−") + " Hz", "end", 9.5, INK))
        o.append(T(670, yy, _f04_g(4.092e6 + fd, 0) + " Hz", "end", 9.5, GLD))
    yy = y0 + 20 + len(vis) * 15.5
    o.append(T(30, yy, "9〜12", "start", 9.5, MUT))
    o.append(T(110, yy, "（空き。まだ見えない衛星を探すのに使う）", "start", 9.5, MUT))
    return SVG(700, int(yy + 12), o, "1 章の近似の GPS の配置で、東京から見える 8 機（仰角 5° 以上）と、各チャネルが合わせる値（受信機の時計のずれと、基準の発振器の誤差を 0 とした）。(a) 空の衛星の並び。(b) 符号の位相（届いた符号の遅れの 1 ms に満たない端数）は 0〜1023 チップのどこにでもあり、ドップラーは衛星の動く向きで正にも負にもなる。TCXO の周波数が +0.5 ppm ずれると、全部の衛星のドップラーが同じ 788 Hz だけ下がって見える。(c) 各チャネルの搬送波の NCO は、中間周波数 4.092 MHz にドップラーを加えた周波数に合わせる。")
F["e04_sats"] = _f04_sats_fig()


# =====================================================================
# 5 節: チャネルの並びと、1 ms ごとの分担
# =====================================================================
def _f04_bank_fig():
    o = []
    _f04_box(o, 14, 130, 96, 52, "A/D 変換", "16.368 MHz", SIG, None)
    o.append(W(110, 156, 140, 156, c=SIG, lw=2.2))
    o.append(W(140, 44, 140, 284, c=SIG, lw=2.2))
    o.append(T(136, 36, "同じ標本の列", "end", 9.5, SIG, True))
    chs = [("CH 1", "G9"), ("CH 2", "G2"), ("CH 3", "G6"), ("…", ""), ("CH 12", "空き")]
    for i, (c1, c2) in enumerate(chs):
        yy = 44 + i * 52
        if c1 == "…":
            o.append(T(290, yy + 26, "…（チャネルの数だけ並ぶ）", "middle", 10, MUT, True))
            continue
        o.append(ARR(140, yy + 20, 160, yy + 20, c=SIG, lw=1.4))
        o.append(RECT(160, yy, 270, 40, 6, PAN, PUR, 1.3))
        o.append(T(170, yy + 16, c1, "start", 10, PUR, True))
        o.append(T(170, yy + 31, c2 if c2 != "空き" else "空き", "start", 9.5, SIG if c2 != "空き" else MUT, True))
        for k, lab in enumerate(("搬送波 NCO", "符号 NCO", "E・P・L")):
            o.append(RECT(222 + k * 68, yy + 8, 62, 24, 4, SOFT[GLD] if k < 2 else PSOFT, GLD if k < 2 else PUR, 1.0))
            o.append(T(253 + k * 68, yy + 24, lab, "middle", 9, INK))
        o.append(ARR(430, yy + 20, 470, yy + 20, c=SIG, lw=1.4))
    o.append(T(450, 36, "6 つの数", "middle", 9.5, SIG, True))
    o.append(T(484, 298, "1 ms ごと", "start", 9.5, SIG, True))
    o.append(RECT(470, 44, 8, 240, 2, SSOFT, SIG, 1.0))
    o.append(ARR(478, 160, 520, 160, c=SIG, lw=2.0))
    _f04_box(o, 520, 116, 166, 88, "CPU のプログラム", "追尾・擬似距離・位置", PUR, "5・6 章")
    o.append(W(603, 116, 603, 18, 330, 18, c=GLD, lw=1.5, dash="5 3"))
    o.append(ARR(330, 18, 330, 42, c=GLD, lw=1.5, head=6))
    o.append(T(600, 13, "全部のチャネルの NCO の K を書き込む", "end", 9.5, GLD, True, halo=True))
    # 計算の量
    y0 = 318
    o.append(W(14, y0 - 12, 686, y0 - 12, c=LIN, lw=0.8))
    o.append(T(14, y0 + 4, "1 秒あたりの計算（16.368 MHz、12 チャネル）", "start", 10.5, INK, True))
    o.append(T(30, y0 + 24, "相関器（回路）: 6 × 1636.8 万 × 12 ≈ 12 億回の「掛けて足す」", "start", 9.5, PUR, True))
    o.append(T(30, y0 + 42, "プログラム: 6 × 1000 × 12 = 7.2 万個の数から、ずれと擬似距離を計算する", "start", 9.5, GRN, True))
    return SVG(700, 372, o, "チャネルの並び。全部のチャネルが、A/D 変換の同じ標本の列を使う。チャネルごとに、搬送波の NCO・符号の NCO（PRN 番号）・E・P・L の相関器を持ち、1 ms ごとに 6 つの数（I<sub>E</sub>・Q<sub>E</sub>・I<sub>P</sub>・Q<sub>P</sub>・I<sub>L</sub>・Q<sub>L</sub>）を CPU のプログラムに渡す。プログラムはずれを計算して、NCO の K を書き込む。回数の多い単純な計算は回路で、回数の少ない複雑な計算はプログラムで行う。")
F["e04_bank"] = _f04_bank_fig()


# =====================================================================
# 6 節: 受信用のチップ・モジュール・機器の入れ子
# =====================================================================
def _f04_module_fig():
    o = []
    o.append(RECT(10, 10, 680, 330, 12, "none", MUT, 1.2, dash="6 4"))
    o.append(T(22, 30, "機器の基板（自分で設計する）", "start", 10.5, INK, True))
    o.append(RECT(130, 44, 420, 264, 10, SOFT[GLD], GLD, 1.4))
    o.append(T(142, 64, "モジュール（例）", "start", 10.5, GLD, True))
    o.append(RECT(146, 76, 286, 206, 8, PAN, SIG, 1.5))
    o.append(T(158, 96, "受信用のチップ", "start", 10.5, SIG, True))
    for bx, ttl, l1, l2, c in ((158, "RF フロントエンド", "LNA・混合器・PLL", "フィルタ・AGC・A/D", SIG), (294, "ベースバンド処理", "チャネル・探す相関器", "CPU・メモリ", PUR)):
        o.append(RECT(bx, 108, 128, 76, 7, PAN, c, 1.4))
        o.append(T(bx + 64, 128, ttl, "middle", 10.5, INK, True))
        o.append(T(bx + 64, 152, l1, "middle", 9, MUT))
        o.append(T(bx + 64, 167, l2, "middle", 9, MUT))
    o.append(ARR(286, 146, 294, 146, c=SIG, lw=1.4, head=5))
    _f04_box(o, 158, 196, 264, 34, "通信の回路（UART・I2C・SPI）・時計（RTC）", None, MUT, None, tsz=9.5)
    _f04_box(o, 158, 238, 264, 34, "電源の管理・省電力", None, MUT, None, tsz=9.5)
    items = [("TCXO", "基準の発振器"), ("SAW フィルタ", "（と LNA）"), ("フラッシュメモリ", "プログラム・設定"), ("時計の水晶", "32.768 kHz"), ("電源の回路", "LDO など")]
    for i, (a, b) in enumerate(items):
        yy = 80 + i * 41
        o.append(RECT(442, yy, 98, 34, 6, PAN, GLD, 1.1))
        o.append(T(491, yy + 15, a, "middle", 9.5, INK, True))
        o.append(T(491, yy + 28, b, "middle", 8.5, MUT))
    o.append(T(289, 300, "金属のふた（シールド）をかぶせる", "middle", 9, GLD))
    # 外
    o.append(_f04_ant(64, 70))
    o.append(T(64, 112, "アンテナ", "middle", 9.5, GLD, True))
    o.append(T(64, 126, "8・9 章", "middle", 9, MUT))
    o.append(ARR(80, 90, 158, 140, c=SIG, lw=1.6))
    o.append(T(100, 146, "RF の入力", "middle", 9, SIG, True, halo=True))
    o.append(T(100, 160, "（11 章）", "middle", 9, MUT, halo=True))
    outs = [("電源・バックアップ電源", "10 章", 230), ("UART など（マイコンへ）", "10・12〜15 章", 262), ("1PPS（時刻）", "14 章", 294)]
    for a, b, yy in outs:
        o.append(ARR(550, yy - 4, 574, yy - 4, c=PUR, lw=1.4))
        o.append(T(578, yy - 8, a, "start", 9, INK, True))
        o.append(T(578, yy + 5, b, "start", 8.5, MUT))
    o.append(T(22, 330, "（構成は例。どの部品をチップに入れ、どれをモジュールに載せるかは、製品によって違う）", "start", 9, MUT))
    return SVG(700, 350, o, "受信用のチップ・モジュール・機器の入れ子（構成は例）。RF フロントエンドとベースバンド処理を 1 つのチップに入れ、TCXO・SAW フィルタ・フラッシュメモリ・時計の水晶・電源の回路を加えて 1 つの小さな基板にまとめたものが、モジュールである。機器の側では、アンテナから RF の入力まで（8・9・11 章）と、電源・通信・1PPS（10・12〜15 章）を設計する。")
F["e04_module"] = _f04_module_fig()


# =====================================================================
# 6 節: どこまで自分で設計するか
# =====================================================================
def _f04_split_fig():
    o = []
    cols = ["アンテナ", "LNA・|フィルタ", "RF フロント|エンド・A/D", "相関器・|追尾", "位置の|計算", "出力・|設定"]
    rows = [("アンテナ付きのモジュール", [1, 1, 1, 1, 1, 0]), ("モジュール + 外付けのアンテナ", [0, 0, 1, 1, 1, 0]),
            ("受信用のチップを載せる", [0, 0, 1, 1, 1, 0]), ("ソフトウェア受信機", [0, 0, 1, 2, 2, 2])]
    x0, cw, rh, y0 = 190, 82, 34, 46
    for j, c in enumerate(cols):
        ls = c.split("|")
        for q, ln in enumerate(ls):
            o.append(T(x0 + j * cw + cw / 2, y0 - 8 - (len(ls) - 1 - q) * 13, ln, "middle", 9, INK, True))
    col = {0: (GLD, "設計する"), 1: (SIG, "部品に任せる"), 2: (PUR, "プログラム")}
    for i, (nm, v) in enumerate(rows):
        yy = y0 + i * (rh + 8)
        o.append(T(x0 - 10, yy + rh / 2 + 4, nm, "end", 10, INK, True))
        for j, k in enumerate(v):
            c, lab = col[k]
            if i == 2 and j in (2, 3, 4):
                c, lab = SIG, "チップ"
            o.append(RECT(x0 + j * cw + 2, yy, cw - 4, rh, 4, soft(c), c, 1.2))
            o.append(T(x0 + j * cw + cw / 2, yy + rh / 2 + 4, lab, "middle", 9, c, True))
        if i == 2:
            o.append(T(x0 - 10, yy + rh + 2, "（TCXO・フィルタ・メモリも選ぶ）", "end", 8.5, MUT))
    y1 = y0 + 4 * (rh + 8) + 14
    o.append(W(14, y1 - 8, 686, y1 - 8, c=LIN, lw=0.8))
    notes = [("上から下へ: RF の設計の手間が増える（評価の道具と時間も要る）", INK),
             ("下ほど: 大きさ・費用・信号の処理を自由に選べる", INK),
             ("組み込みの機器で多いのは「モジュール + 外付けのアンテナ」（代表的な選び方）", GLD)]
    for i, (s_, c) in enumerate(notes):
        o.append(T(30, y1 + 10 + i * 17, s_, "start", 9.5, c, i == 2))
    return SVG(700, int(y1 + 60), o, "受信機のどこまでを自分で設計し、どこからを部品（モジュール・チップ）やプログラムに任せるか。金: 自分で設計する部分、青: 部品に任せる部分、紫: 計算機のプログラムで行う部分。どの選び方でも、出力の読み方と設定（12〜15 章）は自分で行う。")
F["e04_split"] = _f04_split_fig()
