# -*- coding: utf-8 -*-
# 02 章 UART の図

_F02_A = [1, 0, 0, 0, 0, 0, 1, 0]          # 0x41 'A' を最下位ビットから

# ---- 1 節: 並列とシリアル、同期と非同期 ----
def _f02_parallel():
    o = []
    o.append(T(170, 20, "並列通信（8 本の線で同時に）", "middle", 12, INK, True))
    o.append(T(520, 20, "シリアル通信（1 本の線で順に）", "middle", 12, INK, True))
    bits_msb = [0, 1, 0, 0, 0, 0, 0, 1]     # b7 … b0
    for i in range(8):
        y = 42 + i * 20
        o.append(T(40, y + 4, "b%d" % (7 - i), "end", 10, MUT, False, True))
        o.append(W(48, y, 290, y, c=SIG if bits_msb[i] else LIN, lw=2.4 if bits_msb[i] else 1.4))
        o.append(T(300, y + 4, str(bits_msb[i]), "start", 10.5, SIG if bits_msb[i] else MUT, True, True))
    o.append(T(170, 214, "0x41 の 8 ビットが 1 度に届く（線が 8 本要る）", "middle", 10, MUT))
    # シリアル
    o.append(DWAVE(400, 90, _F02_A, bit_w=28, h=30, c=SIG, labels=["b%d" % k for k in range(8)], lsz=9.5))
    o.append(ARR(400, 150, 624, 150, c=MUT, lw=1.3))
    o.append(T(512, 166, "時間", "middle", 10, MUT))
    o.append(T(520, 214, "1 ビットずつ時間をずらして送る（線は 1 本）", "middle", 10, MUT))
    return SVG(700, 228, o, "同じ 1 バイト（0x41）を、並列とシリアルで送る。並列は速いが、線の本数が多く、長い線ではビットごとの届く時刻のずれが問題になる。機器の外との通信では、ほとんどがシリアルである。")
F["e02_parallel"] = _f02_parallel()

def _f02_sync():
    o = []
    data = [1, 0, 1, 1, 0, 0, 1, 0]
    bw = 44
    x0 = 150
    o.append(T(20, 30, "同期式", "start", 12, INK, True))
    o.append(T(130, 58, "クロック", "end", 10.5, GLD))
    clk = []
    for k in range(8):
        clk += [0, 1]
    o.append(DWAVE(x0, 44, clk, bit_w=bw / 2, h=22, c=GLD))
    o.append(T(130, 104, "データ", "end", 10.5, SIG))
    o.append(DWAVE(x0, 90, data, bit_w=bw, h=22, c=SIG))
    for k in range(8):
        xx = x0 + k * bw + bw / 2
        o.append(W(xx, 66, xx, 90, c=GLD, lw=1, dash="2 3"))
        o.append(D(xx, 90 if data[k] else 112, GLD, 3))
    o.append(T(x0 + 8 * bw + 14, 76, "クロックの立ち上がりで", "start", 10, GLD))
    o.append(T(x0 + 8 * bw + 14, 90, "データを読む", "start", 10, GLD))
    o.append(T(20, 160, "非同期式", "start", 12, INK, True))
    o.append(T(130, 196, "データ", "end", 10.5, SIG))
    o.append(DWAVE(x0, 182, [0] + data + [1], bit_w=bw * 0.8, h=22, c=SIG, idle=(30, 0)))
    o.append(T(x0 + 30 + bw * 0.4, 226, "始まりの印", "middle", 10, ALI, True))
    o.append(ARR(x0 + 30 + bw * 0.4, 216, x0 + 30 + bw * 0.4, 207, c=ALI, lw=1.2, head=5))
    o.append(T(x0 + 10 * bw * 0.8 + 50, 190, "クロックの線は無い。", "start", 10, MUT))
    o.append(T(x0 + 10 * bw * 0.8 + 50, 204, "1 ビットの長さを", "start", 10, MUT))
    o.append(T(x0 + 10 * bw * 0.8 + 50, 218, "前もって決めておく", "start", 10, MUT))
    return SVG(700, 240, o, "同期式（上）は、送り手がクロックの線で「いつ読むか」を受け手に知らせる。非同期式（下）はクロックの線を持たず、両者が 1 ビットの長さを前もって決めておき、受け手は始まりの印で時刻を合わせる。UART は非同期式である。")
F["e02_sync"] = _f02_sync()

def _f02_wiring():
    o = []
    o.append(BOX(30, 30, 170, 130, "機器 A", None, SIG, SSOFT, SIG, sz=12.5))
    o.append(BOX(500, 30, 170, 130, "機器 B", None, SIG, SSOFT, SIG, sz=12.5))
    pins = [("TX", 62), ("RX", 102), ("GND", 142)]
    for nm, y in pins:
        o.append(T(190, y + 4, nm, "end", 11, INK, True, True))
        o.append(T(510, y + 4, nm, "start", 11, INK, True, True))
    o.append(ARR(200, 62, 500, 102, c=SIG, lw=2))
    o.append(ARR(500, 62, 200, 102, c=PUR, lw=2))
    o.append(W(200, 142, 500, 142, c=MUT, lw=2))
    o.append(T(350, 50, "A の送信 → B の受信", "middle", 10.5, SIG))
    o.append(T(350, 120, "B の送信 → A の受信", "middle", 10.5, PUR))
    o.append(T(350, 158, "GND（電圧の基準）をつなぐ", "middle", 10.5, MUT))
    o.append(T(350, 186, "TX = 送信、RX = 受信。自分の TX を相手の RX へ、交差させてつなぐ。", "middle", 10.5, INK))
    return SVG(700, 200, o, "UART の配線。送信と受信の線が別なので、両方向に同時に送れる。電圧は GND からの高さで表すので、GND も共通にする。")
F["e02_wiring"] = _f02_wiring()

# ---- 2 節: フレーム ----
def _f02_frame():
    o = []
    bw = 48
    x0, y0, h = 70, 70, 34
    lv = [0] + _F02_A + [1]
    o.append(DWAVE(x0, y0, lv, bit_w=bw, h=h, c=SIG, lw=2.4, idle=(40, 40)))
    xs = x0 + 40
    for k in range(11):
        o.append(W(xs + k * bw, y0 - 18, xs + k * bw, y0 + h + 6, c=GRD, lw=1))
    labs = ["スタート", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "ストップ"]
    for k, lb in enumerate(labs):
        c = ALI if k == 0 else (GRN if k == 9 else SIG)
        o.append(T(xs + (k + 0.5) * bw, y0 + h + 20, lb, "middle", 10 if k in (0, 9) else 10.5, c, k in (0, 9), k not in (0, 9)))
        o.append(T(xs + (k + 0.5) * bw, y0 - 6, str(lv[k]), "middle", 11, INK, True, True))
    o.append(T(x0 + 20, y0 - 6, "1", "middle", 11, FNT, True, True))
    o.append(T(x0 + 20, y0 + h + 20, "アイドル", "middle", 9.5, MUT))
    o.append(T(xs + 10 * bw + 20, y0 + h + 20, "アイドル", "middle", 9.5, MUT))
    o.append(DIM(xs + bw, y0 + h + 34, xs + 9 * bw, y0 + h + 34, None, c=SIG))
    o.append(T(xs + 5 * bw, y0 + h + 50, "データ 8 ビット（最下位ビット b0 から）", "middle", 10.5, SIG))
    o.append(DIM(xs, 26, xs + bw, 26, None, c=MUT))
    o.append(T(xs + bw / 2, 20, "1 ビット時間", "middle", 9.5, MUT))
    o.append(T(xs + bw + 8, 26 + 4, "115200 bps なら 8.68 µs", "start", 9.5, MUT))
    o.append(T(350, y0 + h + 76, "0x41 = 0b0100_0001（文字 'A'）。b0 = 1、b6 = 1、ほかは 0。", "middle", 10.5, INK))
    return SVG(700, y0 + h + 90, o, "文字 'A'（0x41）を 8N1（データ 8 ビット、パリティなし、ストップビット 1）で送ったときの信号。何も送っていない間（アイドル）は 1。スタートビットの 0 で始まり、データを最下位ビットから送り、ストップビットの 1 で終わる。1 バイトに 10 ビット時間かかる。")
F["e02_frame"] = _f02_frame()

def _f02_formats():
    o = []
    rows = [("8N1", [("S", 1, ALI), ("データ 8", 8, SIG), ("P", 1, GLD, 1), ("ストップ", 1, GRN)], 10),
            ("8E1", [("S", 1, ALI), ("データ 8", 8, SIG), ("P", 1, GLD), ("ストップ", 1, GRN)], 11),
            ("8N2", [("S", 1, ALI), ("データ 8", 8, SIG), ("ストップ 2", 2, GRN)], 11),
            ("7E1", [("S", 1, ALI), ("データ 7", 7, SIG), ("P", 1, GLD), ("ストップ", 1, GRN)], 10)]
    u = 40
    for i, (nm, fs, n) in enumerate(rows):
        y = 24 + i * 44
        o.append(T(56, y + 20, nm, "end", 12, INK, True, True))
        x = 70
        for f in fs:
            if len(f) == 4:
                continue
            o.append(RECT(x, y, f[1] * u, 28, 4, soft(f[2]), f[2], 1.2))
            o.append(T(x + f[1] * u / 2, y + 18, f[0], "middle", 9 if f[0] == "ストップ" else 10, f[2], True))
            x += f[1] * u
        data = 7 if nm == "7E1" else 8
        o.append(T(70 + 11 * u + 14, y + 13, "%d ビット時間" % n, "start", 10.5, INK))
        o.append(T(70 + 11 * u + 14, y + 27, "データの割合 %d / %d = %.1f %%" % (data, n, data / n * 100), "start", 10, MUT))
    o.append(T(70, 206, "S = スタートビット、P = パリティビット。記号は「データビット数・パリティ（N なし / E 偶数 / O 奇数）・ストップビット数」。", "start", 10, MUT))
    return SVG(700, 218, o, "フレームの形の書き方と長さ。8N1 が最もよく使われる。パリティやストップビットを足すと、1 バイトを送るのにかかる時間が長くなる。")
F["e02_formats"] = _f02_formats()

# ---- 3 節: 受信の仕組み ----
def _f02_sampling():
    o = []
    x0, y0, h = 60, 46, 30
    bw = 160
    lv = [0, 1, 0]          # スタート, b0, b1
    o.append(DWAVE(x0, y0, lv, bit_w=bw, h=h, c=SIG, lw=2.4, idle=(70, 0)))
    xs = x0 + 70
    labs = ["スタートビット", "b0", "b1"]
    for k, lb in enumerate(labs):
        o.append(T(xs + (k + 0.5) * bw, y0 - 10, lb, "middle", 10.5, ALI if k == 0 else SIG, True))
    # 16 分割の目盛
    yt = y0 + h + 22
    o.append(W(x0, yt, xs + 3 * bw, yt, c=MUT, lw=1))
    tk = bw / 16
    for j in range(int(70 / tk) + 1):
        xx = xs - j * tk
        if xx >= x0:
            o.append(W(xx, yt - 3, xx, yt + 3, c=FNT, lw=1))
    for j in range(3 * 16 + 1):
        xx = xs + j * tk
        o.append(W(xx, yt - (7 if j % 16 == 0 else 3), xx, yt + (7 if j % 16 == 0 else 3), c=MUT if j % 16 == 0 else FNT, lw=1.2 if j % 16 == 0 else 1))
    o.append(T(xs + 3 * bw, yt + 22, "受信側の時計（1 ビットを 16 に分ける）", "end", 10, MUT))
    # 検出と読む点
    o.append(D(xs + tk * 0.4, yt, ALI, 4))
    o.append(T(xs + tk * 0.4 - 6, yt + 40, "① 立ち下がりを見つける", "start", 10, ALI, True))
    o.append(W(xs + tk * 0.4, yt + 4, xs + tk * 0.4, yt + 28, c=ALI, lw=1, dash="2 2"))
    for k in range(3):
        xc = xs + k * bw + 8 * tk
        for j in (7, 8, 9):
            o.append(D(xs + k * bw + j * tk, yt, GRN, 3.2))
        o.append(W(xc, y0 + h + 4, xc, yt - 6, c=GRN, lw=1.2, dash="3 3"))
    o.append(T(xs + 8 * tk, yt + 58, "② 8 目盛後にスタートビットの中央で 0 を確かめる", "middle", 10, GRN, True))
    o.append(T(xs + bw + 8 * tk + 30, yt + 40, "③ そこから 16 目盛ごとに、各ビットの中央で読む", "start", 10, GRN, True))
    o.append(T(xs + 2 * bw + 8 * tk, yt + 58, "（中央の 3 点の多数決にする UART が多い）", "middle", 9.5, MUT))
    return SVG(700, yt + 72, o, "受信側の動き。受信側は 1 ビットを 16 に分けた自分の時計で線を見ており、アイドルの 1 から 0 に変わる所（立ち下がり）でフレームの始まりを知る。そこから半ビット後にスタートビットの中央で 0 であることを確かめ（短い雑音を読み捨てる）、以後 1 ビットごとに各ビットの中央で読む。")
F["e02_sampling"] = _f02_sampling()

# ---- 4 節: 時計のずれ ----
def _f02_drift():
    o = []
    lv = [0] + _F02_A + [1]
    names = ["S", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "ストップ"]
    bw = 50
    x0 = 112
    rows = [(0.0, "ずれ 0 %", None), (0.04, "受信側が 4 % 遅い", None),
            (0.06, "受信側が 6 % 遅い", "b7 の位置でストップビット（1）を読み、データが誤る"),
            (-0.06, "受信側が 6 % 速い", "b7 の位置で b6 を、ストップビットの位置で b7（0）を読む → データの誤りとフレーミングエラー")]
    for i, (e, nm, msg) in enumerate(rows):
        y = 30 + i * 62
        o.append(T(x0 - 10, y + 17, nm, "end", 10.5, INK, True))
        for k in range(10):
            o.append(RECT(x0 + k * bw, y, bw, 24, 2, PAN if lv[k] else SCR, LIN, 1))
            o.append(T(x0 + k * bw + bw / 2, y + 16, names[k] if k == 9 else names[k] + "=" + str(lv[k]), "middle", 9 if k == 9 else 9.5, MUT, False, k != 9))
        o.append(RECT(x0 + 10 * bw, y, 34, 24, 2, ASOFT if e < 0 else SCR, LIN, 1, dash="3 3"))
        o.append(T(x0 + 10 * bw + 17, y + 16, "次", "middle", 9.5, MUT))
        bad = None
        for k in range(10):
            t = (k + 0.5) * (1 + e)
            j = int(t)                     # 読んでしまうビットの番号
            ok = (j == k)
            xx = x0 + t * bw
            o.append(W(xx, y - 4, xx, y + 30, c=GRN if ok else ALI, lw=1.6 if ok else 2.2))
            if not ok and bad is None:
                bad = (k, j, xx)
        if bad:
            o.append(T(x0 + 10 * bw + 40, y + 16, "×", "start", 12, ALI, True))
            o.append(T(x0, y + 44, msg, "start", 10, ALI, True))
        else:
            o.append(T(x0 + 10 * bw + 40, y + 16, "○", "start", 12, GRN, True))
    o.append(T(x0, 30 + 4 * 62 + 4, "縦線: 受信側が読む時刻（立ち下がりから (k + 1/2) × 受信側の 1 ビット時間）。緑は正しいビット、赤は隣のビットを読んだ所。", "start", 9.5, MUT))
    return SVG(700, 30 + 4 * 62 + 16, o, "送信側の 1 ビット時間を基準にした、受信側の読む時刻のずれ。時刻は立ち下がりで合わせるので、ずれはフレームの後ろほど大きくなる。8N1 では最後のストップビットで最も大きくずれる。")
F["e02_drift"] = _f02_drift()

def _f02_offset():
    o = []
    p = Plot(80, 26, 560, 230, (0, 10), (-0.62, 0.62))
    o.append(p.axes(xl="ビットの番号 k（0 = スタートビット、9 = ストップビット）", yl="読む時刻のずれ [ビット時間]", xt=list(range(0, 11)), yt=[-0.5, -0.25, 0, 0.25, 0.5],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%+g" % v) if v else "0"))
    for lim, c, lab in ((0.5, ALI, "±1/2: 隣のビットに入る境目"), (0.5 - 1 / 16, GLD, "±(1/2 − 1/16): 立ち下がりの検出の遅れを引いた境目")):
        o.append(p.line([(0, lim), (10, lim)], c=c, lw=1.3, dash="6 4"))
        o.append(p.line([(0, -lim), (10, -lim)], c=c, lw=1.3, dash="6 4"))
    o.append(T(p.X(0.15), p.Y(0.5) - 6, "±1/2: 隣のビットに入る境目", "start", 9.5, ALI))
    o.append(T(p.X(0.15), p.Y(0.5 - 1 / 16) + 13, "±(1/2 − 1/16): 立ち下がりを見つける遅れの分を引いた境目", "start", 9.5, GLD))
    for e, c in ((0.03, SIG), (0.0461, PUR), (-0.06, ALI)):
        pts = [(k, (k + 0.5) * e) for k in range(0, 10)]
        o.append(p.line(pts, c=c, lw=2))
        for k, v in pts:
            o.append(D(p.X(k), p.Y(v), c, 3))
    o.append(T(p.X(9.15), p.Y(9.5 * 0.03) + 4, "e = +3 %", "start", 10, SIG, True))
    o.append(T(p.X(9.15), p.Y(9.5 * 0.0461) + 14, "e = +4.6 %", "start", 10, PUR, True))
    o.append(T(p.X(9.15), p.Y(-9.5 * 0.06) + 4, "e = −6 %", "start", 10, ALI, True))
    return SVG(700, 300, o, "ビット k を読む時刻のずれ (k + 1/2)e（e は受信側の 1 ビット時間の相対的な誤差）。ずれは k に比例して大きくなる。最後のストップビット（k = 9）のずれ 9.5e が境目の内側にあれば、フレームのすべてのビットを正しく読める。")
F["e02_offset"] = _f02_offset()

def _f02_baud():
    o = []
    rates = [9600, 19200, 38400, 57600, 115200, 230400, 460800]
    errs = []
    for b in rates:
        n = max(1, round(16e6 / (16 * b)))
        errs.append((16e6 / (16 * n) - b) / b * 100)
    p = Plot(110, 24, 540, 220, (-0.5, len(rates) - 0.5), (-10, 10))
    o.append(p.axes(yl="誤差 [%]", xt=[], yt=[-8, -4, -2, 0, 2, 4, 8], yfmt=lambda v: ("%+g" % v) if v else "0", grid=True))
    o.append(RECT(p.x, p.Y(2), p.w, p.Y(-2) - p.Y(2), 0, GSOFT, "none", 0))
    o.append(T(p.x + 6, p.Y(-2) - 4, "±2 %（片側の目安）", "start", 9.5, GRN))
    o.append(p.line([(-0.5, 4.61), (len(rates) - 0.5, 4.61)], c=ALI, lw=1.2, dash="5 4"))
    o.append(p.line([(-0.5, -4.61), (len(rates) - 0.5, -4.61)], c=ALI, lw=1.2, dash="5 4"))
    o.append(T(p.x + 6, p.Y(4.61) - 5, "±4.6 %（両側の合計の限界）", "start", 9.5, ALI))
    for i, (b, e) in enumerate(zip(rates, errs)):
        c = GRN if abs(e) <= 2 else (GLD if abs(e) <= 4.61 else ALI)
        x = p.X(i)
        o.append(RECT(x - 22, min(p.Y(0), p.Y(e)), 44, abs(p.Y(e) - p.Y(0)) or 1, 2, soft(c), c, 1.3))
        o.append(T(x, p.Y(e) + (-6 if e >= 0 else 14), "%+.2f %%" % e, "middle", 9.5, c, True))
        o.append(T(x, p.y + p.h + 16, "%d" % b, "middle", 9.5, INK, False, True))
    o.append(T(p.x + p.w / 2, p.y + p.h + 32, "ボーレート [bps]（クロック 16 MHz、16 倍のオーバーサンプリング、整数の分周）", "middle", 10, MUT))
    return SVG(700, 290, o, "16 MHz のクロックから、16 倍のオーバーサンプリングと整数の分周でボーレートを作ったときの誤差。分周の値 16e6 ÷ (16 × ボーレート) が整数に近いほど誤差は小さい。115200 bps では −3.55 % となり、片側の目安の ±2 % を超える。")
F["e02_baud"] = _f02_baud()

# ---- 5 節: 電気的な形 ----
def _f02_levels():
    o = []
    bits = [1, 0, 1, 1, 0, 1]
    bw = 56
    x0 = 160
    o.append(T(x0 + 3 * bw, 18, "同じビットの列 1 0 1 1 0 1", "middle", 10.5, INK, True))
    for k, b in enumerate(bits):
        o.append(T(x0 + (k + 0.5) * bw, 34, str(b), "middle", 11, INK, True, True))
    # TTL
    y = 50
    o.append(T(20, y + 18, "TTL レベル", "start", 11.5, SIG, True))
    o.append(T(20, y + 33, "（マイコンの端子）", "start", 9.5, MUT))
    o.append(DWAVE(x0, y, bits, bit_w=bw, h=34, c=SIG))
    o.append(T(x0 + 6 * bw + 10, y + 4, "3.3 V", "start", 9.5, MUT))
    o.append(T(x0 + 6 * bw + 10, y + 38, "0 V", "start", 9.5, MUT))
    # RS-232
    y = 120
    o.append(T(20, y + 22, "RS-232", "start", 11.5, PUR, True))
    o.append(T(20, y + 37, "（反転、正負の電圧）", "start", 9.5, MUT))
    o.append(DWAVE(x0, y, [1 - b for b in bits], bit_w=bw, h=44, c=PUR))
    o.append(W(x0, y + 22, x0 + 6 * bw, y + 22, c=FNT, lw=1, dash="3 3"))
    o.append(T(x0 + 6 * bw + 10, y + 4, "+3〜+15 V（0）", "start", 9.5, MUT))
    o.append(T(x0 + 6 * bw + 10, y + 26, "0 V", "start", 9.5, MUT))
    o.append(T(x0 + 6 * bw + 10, y + 48, "−3〜−15 V（1）", "start", 9.5, MUT))
    # RS-485
    y = 200
    o.append(T(20, y + 22, "RS-485", "start", 11.5, GRN, True))
    o.append(T(20, y + 37, "（差動: A と B の差）", "start", 9.5, MUT))
    o.append(DWAVE(x0, y, bits, bit_w=bw, h=36, c=GRN))
    o.append(DWAVE(x0, y + 8, [1 - b for b in bits], bit_w=bw, h=36, c=GLD, lw=1.6))
    o.append(T(x0 + 6 * bw + 10, y + 6, "2 本の差の符号で", "start", 9.5, MUT))
    o.append(T(x0 + 6 * bw + 10, y + 22, "0 と 1 を区別する", "start", 9.5, MUT))
    o.append(T(x0 + 6 * bw + 10, y + 42, "（緑と金が 2 本の線）", "start", 9.5, MUT))
    return SVG(700, 256, o, "同じビットの列の 3 つの電気的な表し方。TTL レベルはマイコンの端子の電圧そのもの。RS-232 は正負の電圧を使い、1 を負の電圧で表す（論理が反転する）。RS-485 は 2 本の線 A と B の電圧の差で 0 と 1 を表す。RS-232 と RS-485 では、マイコンとの間に専用の変換用の IC を置く。")
F["e02_levels"] = _f02_levels()

def _f02_rs485():
    o = []
    yA, yB = 70, 92
    o.append(W(60, yA, 640, yA, c=GRN, lw=2.2))
    o.append(W(60, yB, 640, yB, c=GLD, lw=2.2))
    o.append(T(52, yA + 4, "A", "end", 11, GRN, True))
    o.append(T(52, yB + 4, "B", "end", 11, GLD, True))
    for x in (70, 630):
        o.append(RECT(x - 7, yA + 3, 14, yB - yA - 6, 2, PAN, ALI, 1.4))
        o.append(T(x, yB + 22, "120 Ω", "middle", 10, ALI, True))
    o.append(T(350, 44, "より対線（2 本をより合わせた線）。両端に終端抵抗", "middle", 10.5, MUT))
    for k, (nm, sub) in enumerate((("親機", "マイコン + トランシーバ"), ("子機 1", None), ("子機 2", None), ("子機 3", None))):
        x = 150 + k * 140
        o.append(W(x - 8, yA, x - 8, 130, c=GRN, lw=1.4))
        o.append(W(x + 8, yB, x + 8, 130, c=GLD, lw=1.4))
        o.append(BOX(x - 62, 130, 124, 46, nm, sub, SIG, SSOFT, SIG, sz=11, ssz=9))
    o.append(T(350, 200, "1 組の線を全員で共有する（半二重）。同時に送れるのは 1 台だけなので、誰が送るかをプロトコルで決める。", "middle", 10.5, INK))
    return SVG(700, 214, o, "RS-485 のバスの例。1 組のより対線に複数の機器をつなぎ、線の両端に 120 Ω の終端抵抗を付けて、端での信号の反射を抑える。差動で送るので雑音に強く、低い速さなら 1 km 程度まで届く。")
F["e02_rs485"] = _f02_rs485()

def _f02_de():
    o = []
    bw = 30
    for i, (title, ok) in enumerate((("良い例: 送信完了（最後のストップビットが出終わった）で DE を下げる", True),
                                     ("悪い例: 最後のバイトを送信データレジスタに書いた直後に DE を下げる", False))):
        y = 26 + i * 120
        o.append(T(20, y, title, "start", 11, GRN if ok else ALI, True))
        x0 = 120
        lv = [0, 1, 0, 1, 1, 0, 0, 1, 0, 1]
        o.append(T(110, y + 34, "線の上の信号", "end", 10, MUT))
        if ok:
            o.append(DWAVE(x0, y + 16, lv, bit_w=bw, h=26, c=SIG, idle=(20, 30)))
        else:
            o.append(DWAVE(x0, y + 16, lv[:6], bit_w=bw, h=26, c=SIG, idle=(20, 0)))
            xs = x0 + 20 + 6 * bw
            o.append(W(xs, y + 29, xs + 4 * bw + 30, y + 29, c=ALI, lw=1.6, dash="4 3"))
            o.append(T(xs + 2 * bw + 15, y + 52, "送信が止まり、残りのビットが線に出ない", "middle", 9.5, ALI, True))
        o.append(T(110, y + 78, "DE（送信を有効に）", "end", 10, MUT))
        if ok:
            o.append(DWAVE(x0, y + 66, [1] * 10 + [0], bit_w=bw, h=20, c=GRN, idle=(20, 0)))
        else:
            o.append(DWAVE(x0, y + 66, [1] * 6 + [0] * 5, bit_w=bw, h=20, c=ALI, idle=(20, 0)))
        o.append(W(x0, y + 86, x0 + 20, y + 86, c=GRN if ok else ALI, lw=2))
    return SVG(700, 262, o, "RS-485 の送信で、送信を有効にする信号（DE）を下げる時刻。DE を早く下げると、最後のバイトの残りのビットが線に出ない。送信データレジスタが空いたことではなく、最後のストップビットまで線から出終わったこと（送信完了）を待って下げる（04 章 7 節）。")
F["e02_de"] = _f02_de()

# ---- 6 節: 流れの制御 ----
def _f02_rtscts():
    o = []
    o.append(BOX(20, 30, 150, 110, "送り手", "無線モジュールなど", SIG, SSOFT, SIG, sz=12, ssz=9.5))
    o.append(BOX(530, 30, 150, 110, "受け手", "マイコン", PUR, PSOFT, PUR, sz=12, ssz=9.5))
    o.append(ARR(170, 56, 530, 56, c=SIG, lw=2))
    o.append(T(350, 50, "TX → RX（データ）", "middle", 10.5, SIG))
    o.append(ARR(530, 112, 170, 112, c=PUR, lw=2))
    o.append(T(350, 106, "受け手の RTS → 送り手の CTS", "middle", 10.5, PUR))
    o.append(T(350, 128, "「送ってよい」なら有効、「待って」なら無効にする", "middle", 9.5, MUT))
    # タイミング
    y0 = 170
    o.append(T(20, y0 + 14, "受信バッファ", "start", 10, MUT))
    fill = [(0, 0.1), (60, 0.35), (120, 0.62), (180, 0.82), (240, 0.9), (300, 0.7), (360, 0.45), (420, 0.3), (480, 0.25)]
    p = Plot(120, y0, 480, 50, (0, 480), (0, 1))
    o.append(RECT(120, y0, 480, 50, 3, SCR, LIN, 1))
    o.append(p.line(fill, c=PUR, lw=2))
    o.append(p.line([(0, 0.8), (480, 0.8)], c=ALI, lw=1, dash="4 3"))
    o.append(T(604, p.Y(0.8) + 4, "しきい値", "start", 9.5, ALI))
    o.append(T(20, y0 + 84, "RTS（受け手）", "start", 10, MUT))
    o.append(DWAVE(120, y0 + 70, [1] * 3 + [0] * 2 + [1] * 3, bit_w=60, h=20, c=PUR))
    o.append(T(20, y0 + 124, "データ", "start", 10, MUT))
    for k in range(8):
        x = 120 + k * 60
        if k in (3,):
            o.append(RECT(x + 2, y0 + 106, 26, 22, 3, SSOFT, SIG, 1.1))
            o.append(T(x + 40, y0 + 122, "残り", "start", 9, SIG))
        elif k == 4:
            continue
        else:
            o.append(RECT(x + 2, y0 + 106, 56, 22, 3, SSOFT, SIG, 1.1))
    o.append(T(120 + 4 * 60 + 30, y0 + 122, "止まる", "middle", 9.5, ALI, True))
    o.append(T(350, y0 + 152, "RTS を無効にしてから実際に止まるまでに、送信中のバイトと送り手の FIFO の中身が届く。その分の空きを残してしきい値を決める。", "middle", 9.5, INK))
    return SVG(700, y0 + 166, o, "ハードウェアフロー制御（RTS/CTS）。受け手は受信バッファが埋まってきたら RTS を無効にし、送り手はそれを自分の CTS で見て送るのを止める。空いたら RTS を有効に戻す。")
F["e02_rtscts"] = _f02_rtscts()
