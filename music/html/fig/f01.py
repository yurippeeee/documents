# 01 章 音の正体 の図（figures.py の関数・定数をそのまま使う）

def _f01_curve(x0, y0, w, h, fn, t1, c=SIG, lw=1.8, n=400):
    """関数 fn(t)（t は 0..t1、値は -1..1）を、幅 w・振れ幅 h で描く"""
    pts = [(x0 + w * i / n, y0 - h * fn(t1 * i / n)) for i in range(n + 1)]
    return PL(pts, c, lw)


# 1. 音は空気の圧力の波（スピーカー → 疎密 → 圧力の時間変化）
def _f01_wave():
    o = []
    # スピーカー
    o.append(PL([(40, 70), (62, 82), (62, 118), (40, 130)], INK, 1.6, fill=PAN))
    o.append(RECT(22, 80, 18, 40, 3, PAN, INK, 1.4))
    o.append(T(50, 150, "振動板", "middle", 11, MUT, True))
    o.append(ARR(66, 100, 86, 100, ALI, 1.6))
    o.append(T(76, 62, "押す・引く", "middle", 10.5, ALI))
    # 空気の粒（密度が sin で変わる）
    import random
    rnd = random.Random(3)
    x0, x1 = 100, 700
    xs = []
    x = x0
    while x < x1:
        dens = 1 + 0.8 * math.cos(2 * math.pi * (x - x0) / 150)
        x += 6.5 / dens
        xs.append(x)
    for xx in xs:
        for k in range(4):
            yy = 74 + k * 14 + rnd.uniform(-4, 4)
            o.append(D(xx + rnd.uniform(-1.5, 1.5), yy, MUT, 1.6))
    for k in range(4):
        cx = x0 + k * 150
        o.append(T(cx + 2, 140, "密", "middle", 11.5, ALI, True))
        o.append(T(cx + 77, 140, "疎", "middle", 11.5, BLU, True))
    o.append(ARR(560, 52, 690, 52, MUT, 1.4))
    o.append(T(625, 44, "約 340 m/s で伝わる", "middle", 10.5, MUT))
    # 圧力のグラフ
    y0 = 214
    o.append(W(x0, y0, x1, y0, c=LIN, lw=1))
    o.append(_f01_curve(x0, y0, x1 - x0, 34, lambda t: math.cos(2 * math.pi * t / 150), x1 - x0, SIG, 2))
    o.append(T(x0 - 8, y0 - 30, "圧力", "end", 11, INK, True))
    o.append(T(x0 - 8, y0 + 4, "平均", "end", 10, MUT))
    o.append(T(x1, y0 + 50, "場所 →", "end", 10.5, MUT))
    o.append(T(x0 + 2, y0 - 44, "高い", "middle", 10, ALI))
    o.append(T(x0 + 77, y0 + 50, "低い", "middle", 10, BLU))
    return SVG(720, 272, o, "振動板が空気を押すと圧力が高い所（密）が、引くと低い所（疎）ができ、交互に並んで伝わっていく。"
               "耳に届くのは、この圧力の変化である。")
F["e01_wave"] = _f01_wave()


# 2. 正弦波: 周期 T と振幅 A
def _f01_sine():
    o = []
    x0, y0, w, a = 70, 120, 560, 64
    o.append(AXES(x0, y0, w + 30, 90, "時間", "圧力のずれ"))
    o.append(W(x0, y0 + 90, x0, y0 + 4, c=MUT, lw=1.5))
    o.append(sine(x0, y0, w, 2.5, a, SIG, 2.2))
    T_ = w / 2.5
    # 周期
    p0 = x0 + T_ * 0.25
    o.append(W(p0, y0 - a - 4, p0, y0 - a - 22, c=BLU, lw=1.2))
    o.append(W(p0 + T_, y0 - a - 4, p0 + T_, y0 - a - 22, c=BLU, lw=1.2))
    o.append(DARR(p0, y0 - a - 16, p0 + T_, y0 - a - 16, BLU, 1.4))
    o.append(T(p0 + T_ / 2, y0 - a - 24, "周期 T（1 回分の時間）", "middle", 11.5, BLU, True))
    # 振幅
    xa = x0 + T_ * 1.25
    o.append(DARR(xa, y0, xa, y0 - a, GRN2, 1.4))
    o.append(T(xa + 8, y0 - a / 2 + 4, "振幅 A", "start", 11.5, GRN2, True))
    o.append(T(x0 + w, y0 + 86, "1 秒あたりの回数 = 周波数 f = 1/T", "end", 11.5, INK, True))
    return SVG(680, 228, o, "正弦波は、周期 T（同じ形が 1 回繰り返す時間）と振幅 A（平均からのずれの最大値）の 2 つで決まる。")
F["e01_sine"] = _f01_sine()


# 3. 周波数の違い（10 ms の間に何回繰り返すか）
def _f01_freq():
    o = []
    x0, w = 120, 540
    rows = [(220, BLU, "低い"), (440, SIG, "基準"), (880, ALI, "高い")]
    for i, (fq, c, note) in enumerate(rows):
        y = 52 + i * 70
        o.append(W(x0, y, x0 + w, y, c=LIN, lw=1))
        o.append(_f01_curve(x0, y, w, 24, lambda t, fq=fq: math.sin(2 * math.pi * fq * t), 0.010, c, 2))
        o.append(T(x0 - 14, y - 4, "%d Hz" % fq, "end", 12.5, c, True))
        o.append(T(x0 - 14, y + 13, "%s・%.1f 回" % (note, fq * 0.010), "end", 10.5, MUT))
    o.append(T(x0, 250, "0", "middle", 10, MUT))
    o.append(T(x0 + w, 250, "10 ms", "middle", 10, MUT))
    o.append(W(x0, 238, x0 + w, 238, c=MUT, lw=1))
    return SVG(700, 262, o, "同じ 10 ミリ秒の間に、220 Hz は 2.2 回、440 Hz は 4.4 回、880 Hz は 8.8 回繰り返す。"
               "繰り返しが速い（周波数が高い）ほど、高い音に聞こえる。")
F["e01_freq"] = _f01_freq()


# 4. 周波数が 2 倍だと、合わさった波も同じ周期で繰り返す（比が単純でない場合と比べる）
def _f01_octave():
    o = []
    x0, w = 150, 520
    t1 = 0.0136   # 13.6 ms
    pairs = [((220, 440), "220 Hz と 440 Hz（2 倍）", SIG, True),
             ((220, 311.13), "220 Hz と 311 Hz（約 1.41 倍）", ALI, False)]
    for k, ((fa, fb), title, c, good) in enumerate(pairs):
        yb = 40 + k * 168
        o.append(T(20, yb, title, "start", 12.5, c, True))
        for j, (fq, col) in enumerate([(fa, BLU), (fb, MUT)]):
            y = yb + 28 + j * 30
            o.append(_f01_curve(x0, y, w, 11, lambda t, fq=fq: math.sin(2 * math.pi * fq * t), t1, col, 1.4))
            o.append(T(x0 - 10, y + 4, "%g Hz" % round(fq), "end", 10.5, col))
        y = yb + 116
        o.append(W(x0, y, x0 + w, y, c=LIN, lw=1))
        o.append(_f01_curve(x0, y, w, 26, lambda t: 0.5 * (math.sin(2 * math.pi * fa * t) + math.sin(2 * math.pi * fb * t)), t1, c, 2))
        o.append(T(x0 - 10, y + 4, "合わせた波", "end", 10.5, c, True))
        if good:
            per = 1 / fa
            n = int(t1 / per)
            for q in range(n + 1):
                xx = x0 + w * q * per / t1
                o.append(W(xx, yb + 14, xx, y + 30, c=c, lw=1, dash="3,3"))
            o.append(T(x0 + w, y + 46, "4.55 ms ごとに同じ形を繰り返す", "end", 11, c, True))
        else:
            o.append(T(x0 + w, y + 46, "形がそろわず、はっきりした繰り返しが見えない", "end", 11, c, True))
    return SVG(700, 356, o, "上: 2 倍の周波数の波は、低い波の 1 周期にちょうど 2 周期入るので、合わせた波も低い波と同じ周期（4.55 ms）で繰り返す。"
               "下: 比が単純な整数比でないと、合わせた波の形は毎回ずれていく。")
F["e01_octave"] = _f01_octave()


# 5. 振幅の違い
def _f01_amp():
    o = []
    x0, w = 110, 300
    for i, (a, lab, c) in enumerate([(22, "振幅 A", BLU), (44, "振幅 2A", SIG)]):
        y = 70 + i * 110
        o.append(W(x0, y, x0 + w, y, c=LIN, lw=1))
        o.append(sine(x0, y, w, 3, a, c, 2))
        o.append(T(x0 - 12, y + 4, lab, "end", 12, c, True))
    o.append(T(x0 + w / 2, 236, "同じ周波数（高さは同じ）", "middle", 11, MUT))
    # dB の表
    X = 470
    o.append(T(X, 40, "振幅の比 → 大きさの変化", "start", 12, INK, True))
    rows = [("1/10", "−20 dB"), ("1/2", "−6.0 dB"), ("1", "0 dB"), ("2", "+6.0 dB"), ("10", "+20 dB"), ("100", "+40 dB")]
    for j, (r, db) in enumerate(rows):
        yy = 70 + j * 26
        hl = r == "2"
        if hl:
            o.append(RECT(X - 6, yy - 17, 196, 24, 6, SSOFT, SIG, 1.2))
        o.append(T(X + 40, yy, r, "middle", 12, SIG if hl else INK, hl, True))
        o.append(T(X + 140, yy, db, "middle", 12, SIG if hl else INK, hl, True))
    return SVG(690, 250, o, "振幅だけを 2 倍にすると、高さは変わらず音が大きくなる。大きさの変化はデシベル（dB）で表し、"
               "振幅 2 倍は +6.0 dB、10 倍は +20 dB である。")
F["e01_amp"] = _f01_amp()


# 6. 同じ高さで形が違う波（音色）
_TIMBRES = [
    ("純音", [1], SIG),
    ("オルガン風", [1, 0.55, 0.32, 0.22, 0.12, 0.08], BLU),
    ("のこぎり波", [1 / n for n in range(1, 13)], GLD),
    ("奇数の倍音だけ", [(1 / n if n % 2 else 0) for n in range(1, 13)], GRN2),
]

def _wavefn(amps):
    s = sum(amps)
    return lambda t: sum(a * math.sin(2 * math.pi * (k + 1) * t) for k, a in enumerate(amps)) / max(1.0, s * 0.62)

def _f01_shapes():
    o = []
    x0, w = 150, 520
    for i, (name, amps, c) in enumerate(_TIMBRES):
        y = 44 + i * 66
        o.append(W(x0, y, x0 + w, y, c=LIN, lw=1))
        o.append(_f01_curve(x0, y, w, 24, _wavefn(amps), 3.0, c, 1.9))
        o.append(T(x0 - 14, y + 4, name, "end", 12, c, True))
    o.append(T(x0 + w, 300, "どれも同じ周期（同じ高さ）で、形だけが違う", "end", 11, MUT))
    return SVG(700, 312, o, "4 つの波はどれも同じ周期で繰り返すので、同じ高さに聞こえる。形の違いが音色の違いになる。")
F["e01_shapes"] = _f01_shapes()


# 7. 正弦波を足していくと形が変わる（のこぎり波）
def _f01_sum():
    o = []
    x0, w = 200, 470
    rows = [("基音（振幅 1）", [1], BLU, 1.6),
            ("第 2 倍音（振幅 1/2）", [0, 0.5], MUT, 1.4),
            ("第 3 倍音（振幅 1/3）", [0, 0, 1 / 3], MUT, 1.4),
            ("3 つの和", [1, 0.5, 1 / 3], SIG, 2.0),
            ("第 10 倍音までの和", [1 / n for n in range(1, 11)], SIG, 2.0)]
    for i, (name, amps, c, lw) in enumerate(rows):
        y = 40 + i * 62
        o.append(W(x0, y, x0 + w, y, c=LIN, lw=1))
        fn = lambda t, amps=amps: sum(a * math.sin(2 * math.pi * (k + 1) * t) for k, a in enumerate(amps))
        o.append(_f01_curve(x0, y, w, 15, fn, 2.0, c, lw))
        o.append(T(x0 - 14, y + 4, name, "end", 11.5, c, True))
        if i == 2:
            o.append(W(x0, y + 28, x0 + w, y + 28, c=MUT, lw=1.2, dash="4,4"))
            o.append(T(x0 + w, y + 24, "足す ↓", "end", 10.5, MUT))
    return SVG(700, 330, o, "基音に、振幅 1/2 の第 2 倍音、1/3 の第 3 倍音…を足していくと、波形はのこぎりの歯のような形に近づく。"
               "どの成分も、基音の周期の中にちょうど整数回入っている。")
F["e01_sum"] = _f01_sum()


# 8. 波形とスペクトル
def _f01_spectrum():
    o = []
    cw, X0 = 158, 72
    o.append(T(10, 74, "波形", "start", 11, MUT, True))
    o.append(T(10, 180, "スペクトル", "start", 11, MUT, True))
    for i, (name, amps, c) in enumerate(_TIMBRES):
        x = X0 + i * cw
        o.append(T(x + (cw - 22) / 2, 24, name, "middle", 12, c, True))
        o.append(W(x, 70, x + cw - 22, 70, c=LIN, lw=1))
        o.append(_f01_curve(x, 70, cw - 22, 26, _wavefn(amps), 2.0, c, 1.6))
        yb, hmax = 226, 100
        o.append(W(x, yb, x + cw - 22, yb, c=MUT, lw=1))
        bw = (cw - 22) / 10
        for k in range(10):
            a = amps[k] if k < len(amps) else 0
            xx = x + k * bw + 1.5
            if a > 0:
                o.append(RECT(xx, yb - hmax * a, bw - 3, hmax * a, 1.5, c, c, 0.8))
            if k in (0, 4, 9):
                o.append(T(xx + (bw - 3) / 2, yb + 14, str(k + 1), "middle", 9.5, MUT))
        o.append(T(x + (cw - 22) / 2, yb + 30, "倍音の番号", "middle", 9.5, MUT))
    return SVG(712, 268, o, "上は波形、下はスペクトル（第 n 倍音の振幅を棒で並べたもの）。同じ音を 2 通りに見ている。"
               "音色の違いは、どの倍音がどれだけ含まれるかの違いとして読める。")
F["e01_spectrum"] = _f01_spectrum()


# 9. 倍音列: 周波数の目盛（等間隔）と、比の目盛（対数）で並べる
def _f01_series():
    o = []
    f0 = 110
    x0, w = 90, 580
    # 上段: 周波数をそのまま（等間隔）
    y1 = 70
    o.append(T(20, 30, "周波数の目盛（Hz）で並べる: 間隔はどれも 110 Hz", "start", 12, INK, True))
    o.append(W(x0, y1, x0 + w, y1, c=MUT, lw=1.2))
    for n in range(1, 9):
        xx = x0 + w * (n * f0 - f0) / (8 * f0 - f0)
        o.append(W(xx, y1 - 18, xx, y1, c=SIG, lw=3))
        o.append(T(xx, y1 + 16, "%d" % (n * f0), "middle", 10, MUT))
        o.append(T(xx, y1 - 24, "%d" % n, "middle", 10.5, SIG, True))
    # 下段: 比（対数）の目盛
    y2 = 190
    o.append(T(20, 130, "比の目盛（対数）で並べる: 耳の感じ方に近い", "start", 12, INK, True))
    o.append(W(x0, y2, x0 + w, y2, c=MUT, lw=1.2))
    L = lambda f: x0 + w * math.log(f / f0) / math.log(8)
    for n in range(1, 9):
        xx = L(n * f0)
        o.append(W(xx, y2 - 18, xx, y2, c=SIG, lw=3))
        o.append(T(xx, y2 - 24, "%d" % n, "middle", 10.5, SIG, True))
    for n in range(1, 8):
        xa, xb = L(n * f0), L((n + 1) * f0)
        o.append(T((xa + xb) / 2, y2 + 18, "%d:%d" % (n + 1, n), "middle", 10, BLU, True))
    for k, lab in enumerate(["×2", "×2", "×2"]):
        xa, xb = L(f0 * 2 ** k), L(f0 * 2 ** (k + 1))
        o.append(DARR(xa, y2 + 34, xb, y2 + 34, MUT, 1.1))
        o.append(T((xa + xb) / 2, y2 + 50, "オクターブ", "middle", 10, MUT))
    return SVG(700, 262, o, "基音 110 Hz の倍音列（第 1〜第 8 倍音）。上の段では等間隔に並ぶが、耳が感じる高さの差は周波数の比で決まるので、"
               "比の目盛で並べると、高い倍音ほど隣との間隔が詰まって見える。隣どうしの比は 2:1, 3:2, 4:3, … と 1 に近づく。")
F["e01_series"] = _f01_series()
