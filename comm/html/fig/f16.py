# -*- coding: utf-8 -*-
# 16 章 BLE の全体像 の図
# 色の約束（この章で決め、17〜20 章もこれに合わせる）:
#   BLE のスタック: アプリケーション・GATT・ATT = PUR、L2CAP = GRN、SMP = TEA、GAP = GLD、リンク層 = SIG、物理層 = MUT
#   チャネル: データチャネル = SIG、アドバタイズチャネル = PUR。Wi-Fi の信号（背景）= MUT
#   Wi-Fi との重なり: 重なる = ALI、端にかかる = GLD、重ならない = GRN

def _f16_fidx(i):
    """チャネルの番号（チャネルインデックス）→ 中心の周波数 [MHz]"""
    if i == 37: return 2402
    if i == 38: return 2426
    if i == 39: return 2480
    if i <= 10: return 2404 + 2 * i
    return 2406 + 2 * i

_F16_ADV = (37, 38, 39)

def _f16_hump(p, fc, bw, y_top, y_base, c, op=0.35, dash=None, lw=1.4, fill=True):
    """中心 fc [MHz]、幅 bw [MHz] の信号の形（台形。09 章の図と同じ形）。p は横軸の Plot。"""
    e = min(2.0, bw * 0.12)
    pts = [(p.X(fc - bw / 2), y_base), (p.X(fc - bw / 2 + e), y_top), (p.X(fc + bw / 2 - e), y_top), (p.X(fc + bw / 2), y_base)]
    return PL(pts, c=c, lw=lw, dash=dash, fill=soft(c) if fill else "none", op=op if fill else None)

def _f16_status(f, fc, w=20):
    """BLE のチャネル（中心 f、±1 MHz）と Wi-Fi の信号（中心 fc、幅 w）の関係: over / edge / clear"""
    d = abs(f - fc)
    if d <= w / 2 - 1: return "over"
    if d < w / 2 + 1: return "edge"
    return "clear"

def _f16_wifi_status(i, chans=(1, 6, 11), w=20):
    st = "clear"
    for n in chans:
        s = _f16_status(_f16_fidx(i), 2407 + 5 * n, w)
        if s == "over": return "over"
        if s == "edge": st = "edge"
    return st

# ---- 1 節: Classic と BLE ----
def _f16_classic_le():
    o = []
    xl, xr, cw = 118, 408, 280          # 2 つの列の左端と幅
    o.append(RECT(xl, 8, cw, 34, 7, MSOFT, MUT, 1.3))
    o.append(T(xl + cw / 2, 30, "Bluetooth Classic（BR/EDR）", "middle", 12, MUT, True))
    o.append(RECT(xr, 8, cw, 34, 7, SSOFT, SIG, 1.3))
    o.append(T(xr + cw / 2, 30, "Bluetooth Low Energy（BLE）", "middle", 12, SIG, True))
    rows = [("チャネル", 56, 46), ("物理層の速さ", 112, 30), ("チャネルの使い方", 152, 40), ("主な使い道", 202, 40), ("送受信する時間", 252, 44)]
    for name, y, h in rows:
        o.append(T(xl - 10, y + h / 2 + 4, name, "end", 10.5, INK, True))
        o.append(W(14, y - 5, 690, y - 5, c=GRD, lw=1))
    # チャネルの帯
    y = 56
    for x0, kind in ((xl, "c"), (xr, "l")):
        p = Plot(x0 + 10, y, cw - 20, 22, (2400, 2484), (0, 1))
        o.append(RECT(p.X(2400), y, p.X(2483.5) - p.X(2400), 22, 0, SCR, LIN, 1))
        if kind == "c":
            for k in range(79):
                xx = p.X(2402 + k)
                o.append(W(xx, y + 3, xx, y + 19, c=MUT, lw=1))
            o.append(T(x0 + cw / 2, y + 38, "1 MHz おきに 79 本（2402〜2480 MHz）", "middle", 10, MUT))
        else:
            for i in range(40):
                f = _f16_fidx(i)
                c = PUR if i in _F16_ADV else SIG
                o.append(RECT(p.X(f - 0.85), y + 3, p.X(f + 0.85) - p.X(f - 0.85), 16, 1, soft(c), c, 0.9))
            o.append(T(x0 + cw / 2, y + 38, "2 MHz おきに 40 本（2 節）", "middle", 10, SIG))
    # 速さ
    o.append(T(xl + cw / 2, 112 + 19, "BR 1 Mbps、EDR 2・3 Mbps", "middle", 10.5, INK))
    o.append(T(xr + cw / 2, 112 + 19, "1・2 Mbps、遠くへ届く方式で 500・125 kbps（3 節）", "middle", 10.5, INK))
    # チャネルの使い方
    o.append(T(xl + cw / 2, 152 + 16, "接続中は、送るチャネルを", "middle", 10.5, INK))
    o.append(T(xl + cw / 2, 152 + 31, "1 秒に最大 1600 回替える", "middle", 10.5, INK))
    o.append(T(xr + cw / 2, 152 + 16, "見つけ合うのは 3 本で行い、接続中は", "middle", 10.5, INK))
    o.append(T(xr + cw / 2, 152 + 31, "37 本から 1 回ごとに選ぶ（6 節）", "middle", 10.5, INK))
    # 使い道
    o.append(T(xl + cw / 2, 202 + 16, "途切れずに流れるデータ", "middle", 10.5, INK))
    o.append(T(xl + cw / 2, 202 + 31, "（イヤホンの音声、車のハンズフリー）", "middle", 10, MUT))
    o.append(T(xr + cw / 2, 202 + 16, "少ないデータを、ときどき", "middle", 10.5, INK))
    o.append(T(xr + cw / 2, 202 + 31, "（センサの値、機器の設定、腕時計、タグ）", "middle", 10, MUT))
    # 送受信の時間（模式）
    y = 252
    for x0, kind in ((xl, "c"), (xr, "l")):
        o.append(W(x0 + 6, y + 30, x0 + cw - 6, y + 30, c=MUT, lw=1.1))
        if kind == "c":
            x = x0 + 10
            while x + 6 < x0 + cw - 8:
                o.append(RECT(x, y + 8, 6, 22, 1, soft(MUT), MUT, 0.9))
                x += 9
            o.append(T(x0 + cw / 2, y + 44, "送受信を続ける（典型的な使い方）", "middle", 9.5, MUT))
        else:
            for k in range(4):
                xx = x0 + 22 + k * 76
                o.append(RECT(xx, y + 8, 7, 22, 1, SSOFT, SIG, 1.0))
                if k < 3:
                    o.append(T(xx + 42, y + 24, "眠る", "middle", 9.5, MUT))
            o.append(T(x0 + cw / 2, y + 44, "短く送受信し、その間は眠る", "middle", 9.5, SIG))
    return SVG(700, 304, o, "Bluetooth Classic（BR/EDR）と BLE の比較。同じ 2.4 GHz の帯を使うが、チャネルの分け方も送り方も違う別の方式で、互いには通信できない。いちばん下の段は、典型的な使い方での送受信の時間を模式的に描いたもの（縮尺どおりではない。Classic にも電力を減らす動き方はある）。")
F["e16_classic_le"] = _f16_classic_le()

# ---- 2 節: チャネルの番号 ----
def _f16_chmap():
    o = []
    p = Plot(78, 0, 600, 1, (2400, 2484), (0, 1))
    yc, hc = 62, 30
    o.append(T(70, yc - 10, "番号", "end", 10, INK, True))
    o.append(T(70, yc + hc + 15, "k", "end", 10, MUT, True, True))
    for i in range(40):
        f = _f16_fidx(i)
        c = PUR if i in _F16_ADV else SIG
        x0, x1 = p.X(f - 0.9), p.X(f + 0.9)
        o.append(RECT(x0, yc, x1 - x0, hc, 2, soft(c), c, 1.1))
        o.append(T((x0 + x1) / 2, yc - 6, str(i), "middle", 9, c, i in _F16_ADV, True))
        k = (f - 2402) // 2
        o.append(T((x0 + x1) / 2, yc + hc + 14, str(k), "middle", 8.5, MUT, False, True))
    # 区間の括弧
    def brace(fa, fb, y, text, c):
        xa, xb = p.X(fa - 0.9), p.X(fb + 0.9)
        s = W(xa, y + 6, xa, y, xb, y, xb, y + 6, c=c, lw=1.2)
        return s + T((xa + xb) / 2, y - 5, text, "middle", 10, c, True)
    o.append(brace(2404, 2424, 30, "データチャネル 0〜10 番", SIG))
    o.append(brace(2428, 2478, 30, "データチャネル 11〜36 番", SIG))
    # 周波数の目盛
    ya = yc + hc + 26
    o.append(W(p.X(2400), ya, p.X(2484), ya, c=MUT, lw=1.1))
    for fr in range(2400, 2490, 10):
        o.append(W(p.X(fr), ya, p.X(fr), ya + 4, c=MUT, lw=1))
        o.append(T(p.X(fr), ya + 16, str(fr), "middle", 9.5, MUT))
    o.append(T(p.X(2484), ya + 31, "周波数 [MHz]", "end", 9.5, MUT))
    # 式
    yf = ya + 50
    o.append(LEGEND(78, yf, [(PUR, "アドバタイズチャネル（37・38・39 番）"), (SIG, "データチャネル（0〜36 番）")]))
    o.append(T(78, yf + 22, "中心の周波数 = 2402 + 2k MHz（k は周波数の低い順の番号）。0〜10 番は k = i + 1 で 2404 + 2i MHz、", "start", 10, INK))
    o.append(T(78, yf + 39, "11〜36 番は 38 番を飛ばすので k = i + 2 で 2406 + 2i MHz（i はチャネルの番号）。", "start", 10, INK))
    return SVG(700, yf + 50, o, "BLE の 40 本のチャネルと 2 通りの番号。上の段がチャネルの番号（チャネルインデックス）、下の段が周波数の低い順の番号 k。アドバタイズチャネルの 37・38・39 番は帯の下端・下から 3 分の 1 ほど・上端にあり、データチャネルの番号は、それらを除いた 37 本に周波数の低い順に付ける。")
F["e16_chmap"] = _f16_chmap()

# ---- 2 節: Wi-Fi との重なり ----
def _f16_wifi():
    o = []
    p = Plot(78, 0, 600, 1, (2400, 2484), (0, 1))
    yt, yb = 46, 112
    o.append(RECT(p.X(2400), 30, p.X(2483.5) - p.X(2400), yb - 30, 0, SCR, "none", 0))
    for n in (1, 6, 11):
        fc = 2407 + 5 * n
        o.append(_f16_hump(p, fc, 20, yt, yb, MUT, op=0.5, lw=1.4))
        o.append(T(p.X(fc), yt + 22, "Wi-Fi %d" % n, "middle", 10.5, INK, True))
        o.append(T(p.X(fc), yt + 37, "%d MHz" % fc, "middle", 9.5, MUT))
        for e in (fc - 10, fc + 10):
            o.append(W(p.X(e), yb, p.X(e), yb + 44, c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(2400) + 4, 42, "2.4 GHz 帯", "start", 9.5, MUT))
    col = {"over": ALI, "edge": GLD, "clear": GRN}
    yc, hc = yb + 10, 24
    for i in range(40):
        f = _f16_fidx(i)
        st = _f16_wifi_status(i)
        c = col[st]
        x0, x1 = p.X(f - 0.9), p.X(f + 0.9)
        o.append(RECT(x0, yc, x1 - x0, hc, 2, soft(c), c, 2.0 if i in _F16_ADV else 1.0))
        o.append(T((x0 + x1) / 2, yc + hc + 13, str(i), "middle", 8.5, PUR if i in _F16_ADV else c, i in _F16_ADV, True))
    o.append(T(70, yc + 16, "BLE", "end", 10, INK, True))
    o.append(T(70, yc + hc + 13, "番号", "end", 9, MUT))
    ya = yc + hc + 26
    o.append(W(p.X(2400), ya, p.X(2484), ya, c=MUT, lw=1.1))
    for fr in range(2400, 2490, 10):
        o.append(W(p.X(fr), ya, p.X(fr), ya + 4, c=MUT, lw=1))
        o.append(T(p.X(fr), ya + 16, str(fr), "middle", 9.5, MUT))
    o.append(T(p.X(2484), ya + 31, "周波数 [MHz]", "end", 9.5, MUT))
    yl = ya + 52
    o.append(LEGEND(78, yl, [(ALI, "重なる（データチャネル 28 本）"), (GLD, "端にかかる（9・23・33 番と 37 番）"), (GRN, "重ならない")]))
    o.append(T(78, yl + 22, "重ならないデータチャネルは 10・21・22・34・35・36 番の 6 本だけ。太枠はアドバタイズチャネル（38・39 番は重ならない）。", "start", 10, INK))
    return SVG(700, yl + 34, o, "Wi-Fi のチャネル 1・6・11（20 MHz の幅として描いた）と BLE のチャネルの重なり。BLE の信号は中心から ±1 MHz とみなし、その幅が Wi-Fi の信号の範囲（破線の間）に全部入るものを「重なる」、一部だけ入るものを「端にかかる」とした。3 本のアドバタイズチャネルは Wi-Fi の信号をよけた位置にあるが、データチャネルの多くは重なる。")
F["e16_wifi"] = _f16_wifi()

# ---- 3 節: GFSK ----
_F16_BITS = [1, 0, 1, 1, 0, 0, 1, 0]

def _f16_phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def _f16_gauss_trace(bits, t, bt=0.5):
    """ガウス形のフィルタ（BT = 0.5）を通した周波数のずれ（±1 に正規化）。t はビット時間を単位にした時刻。前後は端のビットを延ばす。"""
    sig = math.sqrt(math.log(2)) / (2 * math.pi * bt)
    ext = [bits[0]] * 3 + list(bits) + [bits[-1]] * 3
    v = 0.0
    for k, b in enumerate(ext):
        a = 1 if b else -1
        t0 = k - 3
        v += a * (_f16_phi((t - t0) / sig) - _f16_phi((t - t0 - 1) / sig))
    return v

def _f16_gfsk():
    o = []
    x0, bw = 132, 64
    n = len(_F16_BITS)
    X = lambda t: x0 + t * bw
    # ビット
    yb = 18
    o.append(T(x0 - 12, yb + 18, "送るビット", "end", 10.5, INK, True))
    for k, b in enumerate(_F16_BITS):
        o.append(RECT(X(k) + 2, yb, bw - 4, 26, 4, SSOFT if b else PAN, SIG if b else LIN, 1.1))
        o.append(T(X(k) + bw / 2, yb + 18, str(b), "middle", 12, SIG if b else MUT, True, True))
    # 周波数のずれ
    yc, A = 118, 38               # 中心の線と、±250 kHz の振れ幅（px）
    o.append(T(x0 - 12, yc - 30, "周波数の", "end", 10.5, INK, True))
    o.append(T(x0 - 12, yc - 15, "ずれ", "end", 10.5, INK, True))
    o.append(W(X(0), yc, X(n), yc, c=MUT, lw=1.1))
    o.append(T(x0 - 12, yc + 4, "中心", "end", 9.5, MUT))
    for s, lab in ((1, "+250 kHz"), (-1, "−250 kHz")):
        o.append(W(X(0), yc - s * A, X(n), yc - s * A, c=FNT, lw=1, dash="3 3"))
        o.append(T(X(n) + 6, yc - s * A + 4, lab, "start", 9.5, MUT))
    nrz = []
    for k, b in enumerate(_F16_BITS):
        yy = yc - (A if b else -A)
        nrz += [(X(k), yy), (X(k + 1), yy)]
    o.append(PL(nrz, c=FNT, lw=1.2, dash="4 3"))
    pts = [(X(t / 40.0), yc - A * _f16_gauss_trace(_F16_BITS, t / 40.0)) for t in range(0, 40 * n + 1)]
    o.append(PL(pts, c=SIG, lw=2.4))
    o.append(T(X(2) + 4, yc - A - 8, "ガウス形のフィルタでなめらかにした変化", "start", 9.5, SIG, halo=True))
    o.append(T(X(4.1), yc + A + 16, "破線: フィルタを通す前", "start", 9.5, FNT))
    # 電波（周波数の違いを誇張して描く）
    yw, Aw = 222, 22
    o.append(T(x0 - 12, yw - 4, "電波", "end", 10.5, INK, True))
    o.append(T(x0 - 12, yw + 11, "（誇張）", "end", 9.5, MUT))
    ph, wpts = 0.0, []
    steps = 90 * n
    for s in range(steps + 1):
        t = s / 90.0
        fr = 3.0 + 1.5 * _f16_gauss_trace(_F16_BITS, t)     # 1 ビットあたりの周期の数
        if s:
            ph += 2 * math.pi * fr / 90.0
        wpts.append((X(t), yw - Aw * math.sin(ph)))
    o.append(PL(wpts, c=SIG, lw=1.4))
    # 1 ビットの寸法
    yd = yw + Aw + 18
    o.append(DIM(X(0), yd, X(1), yd, None, c=MUT))
    o.append(T(X(1) + 8, yd + 4, "1 シンボル = 1 ビット = 1 µs（LE 1M）。1 の間は波が細かく（周波数が高く）、0 の間は粗くなる", "start", 9.5, MUT))
    return SVG(700, yd + 16, o, "GFSK で、ビット 1 0 1 1 0 0 1 0 を送るときの周波数の動き（LE 1M、変調指数 0.5 の場合）。1 なら中心より約 250 kHz 高く、0 なら約 250 kHz 低くする。ビットが変わる所の急な変化（破線）を、ガウス形のフィルタでなめらかにしてから送る。いちばん下の波は、周波数の違いが見えるように大きく誇張して描いたもの（実際の中心の周波数は 2.4 GHz で、ずれは 1 万分の 1 ほど）。")
F["e16_gfsk"] = _f16_gfsk()

# ---- 3 節: PHY ごとの 1 ビットの時間 ----
_F16_PHY = [("LE 2M", "2 Mbps・0.5 µs", 0.5, 1, PUR), ("LE 1M", "1 Mbps・1 µs", 1, 1, SIG),
            ("LE Coded S = 2", "500 kbps・2 µs", 2, 2, TEA), ("LE Coded S = 8", "125 kbps・8 µs", 8, 8, GRN)]

def _f16_phys():
    o = []
    x0, x1, tmax = 160, 676, 32.0
    X = lambda t: x0 + (x1 - x0) * t / tmax
    bits = [1, 0, 1, 1]
    y0, rh = 30, 42
    o.append(T(x0, 18, "同じ 4 ビット（1 0 1 1）を送る時間", "start", 10.5, INK, True))
    for r, (name, sub, tb, S, c) in enumerate(_F16_PHY):
        y = y0 + r * rh
        o.append(T(x0 - 10, y + 13, name, "end", 10.5, c, True))
        o.append(T(x0 - 10, y + 27, sub, "end", 9.5, MUT))
        for k, b in enumerate(bits):
            a, e = X(k * tb), X((k + 1) * tb)
            o.append(RECT(a, y + 4, e - a, 26, 2, soft(c), c, 1.2))
            if S > 1:
                for s in range(1, S):
                    xs = X(k * tb + s * tb / S)
                    o.append(W(xs, y + 8, xs, y + 26, c=c, lw=0.8, dash="2 2"))
            if e - a >= 7:
                o.append(T((a + e) / 2 if S == 1 else a + 7, y + 21, str(b), "middle" if S == 1 else "start", 10 if e - a >= 12 else 9, c, True, True, halo=S > 1))
        o.append(T(X(4 * tb) + 6, y + 21, "%g µs" % (4 * tb), "start", 9.5, c, True) if 4 * tb < 28 else "")
    ya = y0 + 4 * rh + 6
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1.1))
    for t in range(0, 33, 4):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, str(t), "middle", 9.5, MUT))
    o.append(T(x1, ya + 31, "時間 [µs]", "end", 9.5, MUT))
    o.append(T(x0, ya + 31, "細い破線はシンボルの区切り（LE Coded は 1 ビットを S シンボルで送る）", "start", 9.5, MUT))
    return SVG(700, ya + 42, o, "PHY ごとに、同じ 4 ビットを送る時間。LE 2M は LE 1M の半分の時間で送る。LE Coded はシンボルの速さが LE 1M と同じ 1 Msym/s で、1 ビットを 2 シンボル（S = 2）か 8 シンボル（S = 8）で送るので、2 倍か 8 倍の時間がかかる。")
F["e16_phys"] = _f16_phys()

# ---- 3 節: 要る受信電力と届く距離 ----
def _f16_range():
    o = []
    p = Plot(86, 24, 486, 250, (0.25, 8), (-21, 12), xlog=True)
    o.append(p.axes(xl="送り手からの距離（LE 1M で届く距離を 1 とする）", yl="受信電力 [dB]",
                    xt=[0.25, 0.5, 1, 2, 4, 8], yt=[-18, -12, -9, -6, -3, 0, 3, 6, 12],
                    xfmt=lambda v: {0.25: "1/4", 0.5: "1/2"}.get(v, "%g" % v), yfmt=lambda v: ("+%g" % v) if v > 0 else (("−%g" % -v) if v < 0 else "0")))
    # 距離と受信電力
    for n, c, dash, lab, at in ((2, INK, None, "何もない空間（n = 2）", 0.3), (3, MUT, "6 4", "建物の中の目安（n = 3）", 0.33)):
        pts = [(10 ** (k / 100.0 * math.log10(32) + math.log10(0.25)), 0) for k in range(101)]
        pts = [(d, -10 * n * math.log10(d)) for d, _ in pts]
        pts = [(d, v) for d, v in pts if -21 <= v <= 12]
        o.append(p.line(pts, c=c, lw=2.0, dash=dash))
    o.append(T(p.X(5.0) + 6, p.Y(-14) - 8, "何もない空間（n = 2）", "start", 9.5, INK, True, halo=True))
    o.append(T(p.X(3.0) - 8, p.Y(-15.5), "建物の中の目安（n = 3）", "end", 9.5, MUT, True, halo=True))
    # 要る受信電力（LE 1M を 0 dB とする）
    for name, sub, tb, S, c in _F16_PHY:
        req = -10 * math.log10(tb)
        o.append(p.line([(0.25, req), (8, req)], c=c, lw=1.3, dash="5 3"))
        lab = "LE 1M（0 dB）" if tb == 1 else "%s（%s%.0f dB）" % (name.replace("LE Coded ", ""), "+" if req > 0 else "−", abs(req))
        o.append(T(p.X(8) + 6, p.Y(req) + 4, lab, "start", 9.5, c, True))
        d2, d3 = 10 ** (-req / 20), 10 ** (-req / 30)
        o.append(D(p.X(d2), p.Y(req), c, 4))
        o.append(D(p.X(d3), p.Y(req), c, 3))
        if tb == 1:
            o.append(T(p.X(d2) + 7, p.Y(req) - 7, "1", "start", 10, c, True, halo=True))
        elif tb < 1:   # n = 2 の点が左、n = 3 の点が右
            o.append(T(p.X(d2) - 7, p.Y(req) - 7, "%.2f" % d2, "end", 10, c, True, halo=True))
            o.append(T(p.X(d3) + 7, p.Y(req) + 15, "%.2f" % d3, "start", 9.5, c, False, halo=True))
        else:          # n = 3 の点が左、n = 2 の点が右
            o.append(T(p.X(d2) + 7, p.Y(req) - 7, "%.2f" % d2, "start", 10, c, True, halo=True))
            o.append(T(p.X(d3) - 7, p.Y(req) + 15, "%.2f" % d3, "end", 9.5, c, False, halo=True))
    return SVG(700, 316, o, "要る受信電力（点線。LE 1M を 0 dB とし、ビット時間に反比例する）と、距離による受信電力の弱まり（実線と破線）。両者が交わる距離が届く距離で、大きい点が何もない空間（n = 2）、小さい点が建物の中の目安（n = 3）の場合。誤り訂正の符号の効果は含めていない。")
F["e16_range"] = _f16_range()

# ---- 4 節: コントローラの状態と役割 ----
def _f16_llstate():
    o = []
    o.append(T(14, 18, "↔ はホストの命令（HCI）で始める・やめる", "start", 9.5, MUT))
    o.append(STATE(108, 150, 124, 48, "スタンバイ", MUT, "送りも受けもしない", start=True))
    sx, sw, sh = 330, 168, 50
    for y, name, sub in ((56, "アドバタイズ", "この状態の機器: アドバタイザ"), (150, "スキャン", "この状態の機器: スキャナ"), (244, "イニシエート", "この状態の機器: イニシエータ")):
        o.append(STATE(sx, y, sw, sh, name, SIG, sub))
    o.append(DARR(166, 130, sx - sw / 2 - 2, 64, c=MUT, lw=1.3))
    o.append(DARR(172, 150, sx - sw / 2 - 2, 150, c=MUT, lw=1.3))
    o.append(DARR(166, 170, sx - sw / 2 - 2, 236, c=MUT, lw=1.3))
    # 接続の状態
    cx0, cx1, cy0, cy1 = 540, 690, 34, 266
    o.append(RECT(cx0, cy0, cx1 - cx0, cy1 - cy0, 14, GSOFT, GRN, 1.8))
    o.append(T((cx0 + cx1) / 2, cy0 + 20, "接続", "middle", 12, GRN, True))
    o.append(BOX(cx0 + 12, 70, cx1 - cx0 - 24, 62, "ペリフェラル", "アドバタイザだった側", SIG, PAN, SIG, sz=11.5, ssz=9.5))
    o.append(BOX(cx0 + 12, 168, cx1 - cx0 - 24, 62, "セントラル", "イニシエータだった側", PUR, PAN, PUR, sz=11.5, ssz=9.5))
    o.append(ARR(sx + sw / 2 + 2, 56, cx0 + 10, 96, c=SIG, lw=1.6))
    o.append(T(470, 42, "CONNECT_IND を受けた", "middle", 9.5, SIG, halo=True))
    o.append(ARR(sx + sw / 2 + 2, 244, cx0 + 10, 204, c=PUR, lw=1.6))
    o.append(T(470, 270, "CONNECT_IND を送った", "middle", 9.5, PUR, halo=True))
    # 切断
    o.append(W(615, cy1, 615, 292, 108, 292, 108, 182, c=MUT, lw=1.3, dash="5 3"))
    o.append(ARR(108, 190, 108, 176, c=MUT, lw=1.3))
    o.append(T(360, 288, "切断（18 章）", "middle", 9.5, MUT, halo=True))
    return SVG(700, 302, o, "BLE のコントローラの 5 つの状態（新しい版にはほかの状態もある）。アドバタイズ・スキャン・イニシエートの状態にある機器を、それぞれアドバタイザ・スキャナ・イニシエータと呼ぶ。イニシエータが接続を求めるパケット（CONNECT_IND）を送ると、2 台はそろって接続の状態に入り、イニシエータだった側がセントラル、アドバタイザだった側がペリフェラルになる。")
F["e16_llstate"] = _f16_llstate()

def _f16_roles():
    o = []
    # (a) 接続して使う
    o.append(T(120, 20, "(a) 接続して使う", "middle", 11, INK, True))
    o.append(BOX(14, 40, 96, 60, "スマートフォン", "セントラル", PUR, PSOFT, INK, sz=10.5, ssz=10, sc=PUR))
    o.append(BOX(130, 40, 96, 60, "センサ", "ペリフェラル", SIG, SSOFT, INK, sz=10.5, ssz=10, sc=SIG))
    o.append(DARR(112, 70, 128, 70, c=GRN, lw=1.8))
    o.append(T(120, 118, "接続した後、データチャネルで", "middle", 9.5, MUT))
    o.append(T(120, 132, "やり取りする", "middle", 9.5, MUT))
    o.append(T(62, 156, "接続の前:", "middle", 9.5, PUR, True))
    o.append(T(62, 170, "スキャナ →", "middle", 9.5, PUR))
    o.append(T(62, 184, "イニシエータ", "middle", 9.5, PUR))
    o.append(T(178, 156, "接続の前:", "middle", 9.5, SIG, True))
    o.append(T(178, 170, "アドバタイザ", "middle", 9.5, SIG))
    # (b) 接続しない
    o.append(T(355, 20, "(b) 接続しない", "middle", 11, INK, True))
    for k in range(3):
        y = 36 + k * 44
        o.append(BOX(248, y, 100, 34, "センサ", "ブロードキャスタ", SIG, SSOFT, INK, sz=9.5, ssz=9, sc=SIG))
        o.append(ARR(350, y + 17, 384, 102, c=SIG, lw=1.3, dash="4 3"))
    o.append(BOX(386, 72, 82, 60, "ゲートウェイ", "オブザーバ", GLD, GOSOFT, INK, sz=10, ssz=10, sc=GLD))
    o.append(T(355, 184, "アドバタイズを受け取るだけ。確認応答は無い", "middle", 9.5, MUT))
    # (c) 1 台のセントラルと何台ものペリフェラル
    o.append(T(585, 20, "(c) 同時に何台とも接続する", "middle", 11, INK, True))
    o.append(BOX(486, 72, 82, 60, "ゲートウェイ", "セントラル", GLD, GOSOFT, INK, sz=10, ssz=10, sc=GLD))
    for k in range(3):
        y = 36 + k * 44
        o.append(BOX(596, y, 92, 34, "センサ", "ペリフェラル", SIG, SSOFT, INK, sz=9.5, ssz=9, sc=SIG))
        o.append(DARR(570, 102, 594, y + 17, c=GRN, lw=1.4))
    o.append(T(585, 184, "相手ごとに時刻をずらしてやり取りする", "middle", 9.5, MUT))
    o.append(W(14, 200, 690, 200, c=GRD, lw=1))
    o.append(T(350, 222, "値を持つ側と読みに行く側（GATT のサーバとクライアント。18 章）は、この役割とは別に決まる。", "middle", 10, INK))
    return SVG(700, 234, o, "役割の組み合わせの例。(a) スマートフォンがセンサを見つけて接続する。(b) センサが値をアドバタイズに入れて送り続け、ゲートウェイがそれを集める（どちらも接続しない）。(c) 1 台のセントラルが、何台ものペリフェラルと同時に接続する。")
F["e16_roles"] = _f16_roles()

# ---- 5 節: スタックの層 ----
def _f16_stack():
    o = []
    x0, x1 = 160, 520
    def box(xa, xb, y, h, name, desc, c, lines=None):
        s = RECT(xa, y, xb - xa, h, 6, soft(c), c, 1.3)
        s += T(xa + 10, y + 17, name, "start", 11.5, c, True)
        for k, l in enumerate(lines or [desc]):
            s += T(xa + 10, y + 32 + k * 13, l, "start", 9.5, INK)
        return s
    o.append(box(x0, x1, 10, 42, "アプリケーション", "機器ごとの値と動作（18 章 6 節）", PUR))
    o.append(box(x0, 246, 58, 88, "GAP", None, GLD, ["見つける・", "つなぐ手順と", "4 つの役割"]))
    o.append(box(252, x1, 58, 42, "GATT", "値をサービスとキャラクタリスティックに整理（18 章）", PUR))
    o.append(box(252, 382, 104, 42, "ATT", "値を番号で読み書き", PUR))
    o.append(box(388, x1, 104, 42, "SMP", "ペアリング・鍵（20 章）", TEA))
    o.append(box(x0, x1, 152, 42, "L2CAP", "上のプロトコルへの振り分け、長いデータの分割と組み立て", GRN))
    # HCI
    yh = 214
    o.append(W(x0 - 6, yh, x1 + 6, yh, c=INK, lw=1.4, dash="6 4"))
    o.append(T((x0 + x1) / 2, yh - 5, "HCI（06 章 5 節）: 命令・イベント・データ", "middle", 10, INK, True, halo=True))
    o.append(box(x0, x1, 230, 42, "リンク層", "状態・チャネルの選択・確認応答と再送・暗号化（4・6 節）", SIG))
    o.append(box(x0, x1, 278, 42, "物理層", "GFSK。PHY は LE 1M・LE 2M・LE Coded（3 節）", MUT))
    # 右の括弧
    for ya, yb, lab in ((58, 194, "BLE のホスト"), (230, 320, "コントローラ")):
        o.append(W(x1 + 12, ya, x1 + 20, ya, x1 + 20, yb, x1 + 12, yb, c=MUT, lw=1.3))
        o.append(T(x1 + 28, (ya + yb) / 2 + 4, lab, "start", 11, INK, True))
        o.append(T(x1 + 28, (ya + yb) / 2 + 19, "（06 章 1 節）", "start", 9.5, MUT))
    # アドバタイズのデータは L2CAP を通らない
    o.append(W(x0, 120, 142, 120, 142, 250, c=GLD, lw=1.4, dash="4 3"))
    o.append(ARR(142, 250, x0 - 2, 250, c=GLD, lw=1.4))
    o.append(T(132, 168, "アドバタイズの", "end", 9.5, GLD))
    o.append(T(132, 182, "データは L2CAP", "end", 9.5, GLD))
    o.append(T(132, 196, "を通らない", "end", 9.5, GLD))
    return SVG(700, 330, o, "BLE のプロトコルスタックの層と役割。物理層とリンク層がコントローラ、L2CAP から GAP までが BLE のホストで、間を HCI が結ぶ。接続した後のデータは L2CAP で ATT・SMP などに振り分けられ、アドバタイズに入れるデータは HCI からリンク層へ直接渡される。")
F["e16_stack"] = _f16_stack()

def _f16_path():
    o = []
    L = [("アプリケーション", PUR), ("GATT", PUR), ("ATT", PUR), ("L2CAP", GRN), ("リンク層", SIG), ("物理層", MUT)]
    peer = ["温度はいくつか", "温度の値はどの番号か（探す）", "読み出しの要求 → 応答", "ATT のデータだと示す番号", "パケット・確認応答・再送"]
    xl0, xl1, xr0, xr1 = 40, 200, 500, 660
    y0, rh, gap = 44, 30, 10
    o.append(T((xl0 + xl1) / 2, 22, "スマートフォン（セントラル）", "middle", 11, PUR, True))
    o.append(T((xr0 + xr1) / 2, 22, "センサ（ペリフェラル）", "middle", 11, SIG, True))
    for i, (name, c) in enumerate(L):
        y = y0 + i * (rh + gap)
        for xa, xb in ((xl0, xl1), (xr0, xr1)):
            o.append(RECT(xa, y, xb - xa, rh, 5, soft(c), c, 1.2))
            o.append(T((xa + xb) / 2, y + 19, name, "middle", 10.5, c, True))
        if i < len(peer):
            o.append(W(xl1 + 6, y + rh / 2, xr0 - 6, y + rh / 2, c=c, lw=1.1, dash="4 3"))
            o.append(T(350, y + rh / 2 - 4, peer[i], "middle", 9.5, c, False, halo=True))
    yp = y0 + 5 * (rh + gap) + rh / 2
    o.append(DARR(xl1 + 6, yp, xr0 - 6, yp, c=MUT, lw=2.2))
    o.append(T(350, yp - 6, "2.4 GHz の電波（データチャネル）", "middle", 9.5, INK, True, halo=True))
    yb = y0 + 5 * (rh + gap) + rh
    o.append(ARR(24, y0 + 4, 24, yb - 4, c=PUR, lw=1.5))
    o.append(T(18, (y0 + yb) / 2, "送る: 上から順にヘッダを付ける", "middle", 9.5, PUR, rot=-90))
    o.append(ARR(676, yb - 4, 676, y0 + 4, c=SIG, lw=1.5))
    o.append(T(686, (y0 + yb) / 2, "受け取る: 下から順に外す", "middle", 9.5, SIG, rot=90))
    # 応答のパケットの入れ子
    yq = yb + 34
    o.append(T(40, yq - 8, "センサが返す応答のパケット（中身の大きさは 19 章で数える）", "start", 10, INK, True))
    segs = [("プリアンブル・アクセスアドレス", 168, SIG), ("リンク層のヘッダ", 104, SIG), ("L2CAP のヘッダ", 100, GRN), ("ATT のヘッダ", 88, PUR), ("温度の値", 78, INK), ("CRC", 48, SIG)]
    x = 40
    for name, w, c in segs:
        o.append(RECT(x, yq, w, 28, 3, soft(c) if c != INK else PAN, c, 1.2))
        o.append(T(x + w / 2, yq + 18, name, "middle", 9.5, c, True))
        x += w + 2
    return SVG(700, yq + 40, o, "接続したスマートフォンが、センサの温度を読むときのデータの通り道。各層は、相手の機器の同じ層とやり取りする（破線）。実際のデータは、送り手では上の層から順にヘッダを付けられて電波になり、受け手では下の層から順にヘッダを外されて上の層に渡る（07 章 5 節のカプセル化）。応答は逆の向きに通る。")
F["e16_path"] = _f16_path()

# ---- 6 節: チャネル選択アルゴリズム #1 ----
def _f16_csa1(hop, used, n):
    used = sorted(used); N = len(used)
    last, out = 0, []
    for _ in range(n):
        u = (last + hop) % 37
        last = u
        out.append((u, u if u in used else used[u % N], u not in used))
    return out

def _f16_hop():
    o = []
    cx, cy, r = 150, 158, 102
    h = 7
    ang = lambda i: -math.pi / 2 + 2 * math.pi * i / 37
    P = lambda i, rr=r: (cx + rr * math.cos(ang(i)), cy + rr * math.sin(ang(i)))
    o.append(CIRC(cx, cy, r, c=GRD, lw=1))
    seq = [(k * h) % 37 for k in range(38)]
    pts = [P(u) for u in seq]
    o.append(PL(pts, c=SIG, lw=0.9))
    for k in range(4):
        a, b = P(seq[k]), P(seq[k + 1])
        o.append(ARR(a[0], a[1], b[0], b[1], c=ALI, lw=1.8, head=8))
    for i in range(37):
        x, y = P(i)
        o.append(D(x, y, SIG, 2.6))
        lx, ly = P(i, r + 13)
        o.append(T(lx, ly + 3, str(i), "middle", 8.5, INK if i not in (0, 7, 14, 21, 28) else ALI, i in (0, 7, 14, 21, 28), True))
    o.append(T(cx, 290, "0 から 7 ずつ進む（37 以上になったら 37 を引く）。", "middle", 9.5, MUT))
    o.append(T(cx, 304, "赤い矢印が最初の 4 回（7・14・21・28）", "middle", 9.5, ALI))
    p = Plot(348, 26, 322, 238, (0, 38), (-1, 37))
    o.append(p.axes(xl="接続イベント（何回目か）", yl="チャネルの番号", xt=[1, 10, 20, 30, 37], yt=[0, 10, 20, 30, 36],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    s = _f16_csa1(h, range(37), 37)
    o.append(p.line([(k + 1, u) for k, (u, c, rm) in enumerate(s)], c=FNT, lw=1))
    for k, (u, c, rm) in enumerate(s):
        o.append(D(p.X(k + 1), p.Y(c), SIG, 3.4))
    return SVG(700, 316, o, "チャネル選択アルゴリズム #1 の列（ホップ量 h = 7、すべてのデータチャネルを使う場合）。左は 0〜36 の番号を円に並べ、7 ずつ進む様子で、37 回でどの番号もちょうど 1 回ずつ通って 0 に戻る。右は接続イベントごとのチャネルの番号。")
F["e16_hop"] = _f16_hop()

_F16_USED9 = [9, 10, 21, 22, 23, 33, 34, 35, 36]

def _f16_remap():
    o = []
    x0, cw = 92, 16
    yc = 40
    o.append(T(x0, 18, "チャネルマップ（Wi-Fi 1・6・11 に重なる 28 本を外し、9 本を使う）", "start", 10.5, INK, True))
    for i in range(37):
        used = i in _F16_USED9
        c = GRN if used else ALI
        o.append(RECT(x0 + i * cw + 1, yc, cw - 2, 22, 2, soft(c), c, 1.1 if used else 0.8))
        o.append(T(x0 + i * cw + cw / 2, yc + 34, str(i), "middle", 8.5, c, used, True))
        if used:
            o.append(T(x0 + i * cw + cw / 2, yc + 15, str(_F16_USED9.index(i)), "middle", 9, GRN, True, True))
    o.append(T(x0 - 8, yc + 15, "使う順番", "end", 9.5, GRN, True))
    o.append(T(x0 - 8, yc + 34, "番号", "end", 9.5, MUT, True))
    # 筆算の表
    cols = [(68, "接続イベント"), (214, "u = 前の u + 7（37 以上なら −37）"), (380, "u を使うか"), (482, "u mod 9（番目）"), (606, "使うチャネル")]
    yh = 112
    for x, t in cols:
        o.append(T(x, yh, t, "middle", 10, INK, True))
    o.append(W(20, yh + 8, 680, yh + 8, c=MUT, lw=1.2))
    s = _f16_csa1(7, _F16_USED9, 8)
    last = 0
    for k, (u, ch, rm) in enumerate(s):
        y = yh + 28 + k * 22
        raw = last + 7
        calc = ("%d + 7 = %d" % (last, raw)) if raw < 37 else ("%d + 7 = %d → %d − 37 = %d" % (last, raw, raw, u))
        o.append(T(cols[0][0], y, "%d 回目" % (k + 1), "middle", 10, INK))
        o.append(T(cols[1][0], y, calc, "middle", 10, INK, False, True))
        o.append(T(cols[2][0], y, "使わない" if rm else "使う", "middle", 10, ALI if rm else GRN, True))
        o.append(T(cols[3][0], y, ("%d mod 9 = %d" % (u, u % 9)) if rm else "—", "middle", 10, GLD if rm else MUT, False, True))
        o.append(T(cols[4][0], y, str(ch), "middle", 11, GLD if rm else GRN, True, True))
        o.append(W(20, y + 7, 680, y + 7, c=GRD, lw=1))
        last = u
    yn = yh + 28 + 8 * 22 + 8
    o.append(T(20, yn, "割り当て直したもの（金）は、u mod 9 番目の使うチャネル。次の回は、割り当て直す前の u に 7 を足す。", "start", 10, INK))
    return SVG(700, yn + 12, o, "使わないチャネルがあるときの #1 の計算（ホップ量 7、使うチャネル 9 本）。外す前の番号 u が使うチャネルならそのまま使い、使わないチャネルなら、使うチャネルを小さい順に並べた u mod 9 番目に割り当て直す。")
F["e16_remap"] = _f16_remap()

def _f16_afh():
    lanes = [("セントラル", PUR), ("ペリフェラル", SIG)]
    msgs = [
        ("note", 0, "チャネルごとに受け損ないを数え、\nWi-Fi に重なるチャネルを見つける", {"c": ALI}),
        (0, 1, "100 回目: チャネルマップの更新", {"sub": "新しいマップと、使い始める接続イベント（120 回目）"}),
        (1, 0, "確認応答", {"dash": True}),
        ("gap", "101〜119 回目は前のマップのまま"),
        (0, 1, "120 回目: 新しいマップで選んだチャネルで送る", {"c": GRN}),
        (1, 0, "同じチャネルで答える", {"c": GRN, "dash": True}),
    ]
    return SEQFIG(lanes, msgs, "適応型周波数ホッピング（AFH）でチャネルマップを替える流れ（回数は例）。セントラルは新しいチャネルマップと、それを使い始める接続イベントを知らせ、2 台はその接続イベントから新しいマップでチャネルを計算する。", w=700)
F["e16_afh"] = _f16_afh()
