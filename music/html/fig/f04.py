# 04 章 協和と不協和 の図（figures.py の関数・定数をそのまま使う）

_C4 = 261.6256

# 1. 協和・不協和の伝統的な分け方と、周波数の比
def _f04_classes():
    o = []
    groups = [("完全協和", GRN2, GSOFT, [("完全 8 度", "2:1"), ("完全 5 度", "3:2"), ("完全 4 度", "4:3")]),
              ("不完全協和", BLU, BSOFT, [("長 3 度", "5:4"), ("短 3 度", "6:5"), ("長 6 度", "5:3"), ("短 6 度", "8:5")]),
              ("不協和", ALI, ASOFT, [("長 2 度", "9:8"), ("短 2 度", "16:15"), ("長 7 度", "15:8"), ("短 7 度", "16:9"), ("増 4 度", "45:32")])]
    y = 20
    for title, c, fl, items in groups:
        o.append(T(20, y + 22, title, "start", 13, c, True))
        for i, (nm, r) in enumerate(items):
            x = 130 + i * 112
            o.append(RECT(x, y, 104, 40, 8, fl, c, 1.3))
            o.append(T(x + 52, y + 17, nm, "middle", 11.5, INK, True))
            o.append(T(x + 52, y + 33, r, "middle", 11.5, c, True, True))
        y += 56
    o.append(T(20, y + 14, "比の数字（右下）が小さく単純なものほど、上の段に入っている。比は、それぞれの音程に伝統的に対応づけられてきた整数比（純正な比）。", "start", 10.5, MUT))
    return SVG(712, y + 26, o, "音楽理論で伝統的に使われる、協和・不協和の分け方。どの段に入るかと、周波数の比の単純さがそろっている。")
F["e04_classes"] = _f04_classes()


# 2. うなり: 440 Hz と 444 Hz を重ねる
def _f04_beats():
    o = []
    x0, w = 70, 600
    yc = 90
    T1 = 0.75
    n = 3200
    f1, f2 = 440.0, 444.0
    pts = []
    for i in range(n + 1):
        t = T1 * i / n
        v = 0.5 * (math.sin(2 * math.pi * f1 * t) + math.sin(2 * math.pi * f2 * t))
        pts.append((x0 + w * i / n, yc - 46 * v))
    o.append(PL(pts, SIG, 0.8))
    env = [(x0 + w * i / 300, yc - 46 * abs(math.cos(math.pi * (f2 - f1) * T1 * i / 300))) for i in range(301)]
    env2 = [(px, 2 * yc - py) for px, py in env]
    o.append(PL(env, BLU, 1.8, dash="5,4"))
    o.append(PL(env2, BLU, 1.8, dash="5,4"))
    o.append(W(x0, 160, x0 + w, 160, c=MUT, lw=1))
    for k in range(0, 4):
        t = k * 0.25
        xx = x0 + w * t / T1
        o.append(W(xx, 156, xx, 164, c=MUT, lw=1))
        o.append(T(xx, 178, "%.2f s" % t, "middle", 10, MUT))
    o.append(T(x0 - 8, yc + 4, "440 Hz +", "end", 10.5, INK, True))
    o.append(T(x0 - 8, yc + 18, "444 Hz", "end", 10.5, INK, True))
    o.append(T(x0 + w, 30, "破線: 大きさの変化（1 秒に 4 回ふくらむ）", "end", 11, BLU, True))
    return SVG(700, 190, o, "440 Hz と 444 Hz を同時に鳴らした波形（0.75 秒分）。2 つの周波数の差の 4 Hz で、音が 1 秒に 4 回大きくなったり小さくなったりする。これがうなりである。")
F["e04_beats"] = _f04_beats()


# 3. 純音 2 つの粗さ（周波数の差による変化）
def _f04_rough():
    o = []
    x0, y0, w, h = 70, 214, 560, 140
    f0 = 440.0
    s_ = 0.24 / (0.0207 * f0 + 18.96)
    gmax = _rough_g(0.2203)
    dmax = 150.0
    o.append(T(x0, 22, "440 Hz の純音に、少し高い純音を重ねたとき", "start", 11.5, INK, True))
    o.append(AXES(x0, y0, w + 20, h + 16, None, "粗さ"))
    o.append(T(x0 + w * 6 / dmax, 46, "うなり", "middle", 10, MUT))
    o.append(T(x0 + w * 40 / dmax, 46, "ざらざら（粗い）", "middle", 10, MUT))
    o.append(T(x0 + w * 120 / dmax, 46, "2 つの音に分かれる", "middle", 10, MUT))
    pts = [(x0 + w * d / dmax, y0 - h * _rough_g(s_ * d) / gmax) for d in [dmax * i / 300 for i in range(301)]]
    o.append(PL(pts, ALI, 2.2))
    for d in (0, 25, 50, 75, 100, 125, 150):
        xx = x0 + w * d / dmax
        o.append(W(xx, y0, xx, y0 + 5, c=MUT, lw=1))
        o.append(T(xx, y0 + 18, "%d" % d, "middle", 10, MUT))
    o.append(T(x0 + w / 2, y0 + 38, "2 つの音の周波数の差（Hz）", "middle", 10.5, MUT, True))
    # 半音・全音・短 3 度・長 3 度の位置（440 Hz の上）
    for nm, st, c in [("半音", 1, ALI), ("全音", 2, GLD), ("短 3 度", 3, BLU), ("長 3 度", 4, GRN2)]:
        d = f0 * (2 ** (st / 12) - 1)
        xx = x0 + w * d / dmax
        yy = y0 - h * _rough_g(s_ * d) / gmax
        o.append(CIRC(xx, yy, 4.5, c, 1.4, c))
        o.append(T(xx + 7, yy - 8, "%s（%.0f Hz）" % (nm, d), "start", 10.5, c, True))
    return SVG(680, y0 + 50, o, "純音 2 つの粗さは、周波数の差が 0 から増えるといったん大きくなり、さらに離れると小さくなる（Plomp と Levelt の実験結果を式にしたもの）。"
               "440 Hz 付近では、差が約 26 Hz（ちょうど半音）のときにいちばん粗い。")
F["e04_rough"] = _f04_rough()


# 4. 2 音のスペクトル（純正な比）: 一致する倍音とぶつかる倍音
def _f04_specpair():
    o = []
    rows = [("完全 8 度（2:1）", 2.0, "C5"), ("完全 5 度（3:2）", 1.5, "G4"), ("長 3 度（5:4）", 1.25, "E4"), ("短 2 度（16:15）", 16 / 15.0, "D♭4")]
    y = 30
    for title, r, up in rows:
        o.append(T(16, y - 8, title, "start", 12.5, INK, True))
        svg, st = SPECTRUM(16, y, 680, [dict(f=_C4, label="C4", c=SIG), dict(f=_C4 * r, label=up, c=BLU)],
                           H=8, lane_h=40, fmin=230, fmax=4400, axis=False)
        o.append(svg)
        y += 2 * 40 + 34
    # 下に共通の目盛
    yb = y - 34 + 2
    X = lambda f: 16 + 86 + (680 - 86) * math.log(f / 230) / math.log(4400 / 230)
    o.append(W(16 + 86, yb, 696, yb, c=MUT, lw=1))
    for m, lab in [(60, "C4"), (72, "C5"), (84, "C6"), (96, "C7"), (108, "C8")]:
        xx = X(freq(m))
        if xx <= 696:
            o.append(W(xx, yb, xx, yb + 5, c=MUT, lw=1))
            o.append(T(xx, yb + 17, lab, "middle", 9.5, MUT))
    return SVG(712, yb + 26, o, "下の音（C4、赤）と上の音（青）の第 1〜第 8 倍音を、比の目盛に並べた。棒の高さは振幅（1/n）。"
               "緑の線は周波数が一致する倍音、赤い波線は近いのに一致せずぶつかる倍音（粗さが一定以上の組）。"
               "完全 8 度・5 度は一致が多くぶつかりが無く、短 2 度は一致が無くぶつかりだらけになる。")
F["e04_specpair"] = _f04_specpair()


# 5. 比 p:q のとき、どの倍音が一致するか
def _f04_ratio():
    o = []
    def row(y, title, p, q, nl, color):
        o.append(T(20, y - 52, title, "start", 12, INK, True))
        x0, w = 100, 560
        fmax = nl
        X = lambda v: x0 + w * v / fmax
        o.append(W(x0, y - 12, x0 + w, y - 12, c=LIN, lw=1))
        o.append(W(x0, y + 12, x0 + w, y + 12, c=LIN, lw=1))
        o.append(T(x0 - 10, y - 8, "下の音", "end", 10.5, SIG, True))
        o.append(T(x0 - 10, y + 16, "上の音", "end", 10.5, BLU, True))
        for hh in range(1, nl + 1):
            co = hh % p == 0
            o.append(W(X(hh), y - 12, X(hh), y - 26, c=GRN2 if co else SIG, lw=3 if co else 2))
            o.append(T(X(hh), y - 30, str(hh), "middle", 9.5, GRN2 if co else MUT, co))
        k = 1
        while k * p / q <= nl + 1e-9:
            v = k * p / q
            co = k % q == 0
            o.append(W(X(v), y + 12, X(v), y + 26, c=GRN2 if co else BLU, lw=3 if co else 2))
            o.append(T(X(v), y + 38, str(k), "middle", 9.5, GRN2 if co else MUT, co))
            if co:
                o.append(W(X(v), y - 12, X(v), y + 12, c=GRN2, lw=2, dash="3,2"))
            k += 1
    row(76, "完全 5 度（3:2）: 下の音の 3, 6, 9, 12 番目 = 上の音の 2, 4, 6, 8 番目", 3, 2, 12, GRN2)
    row(200, "長 3 度（5:4）: 下の音の 5, 10 番目 = 上の音の 4, 8 番目", 5, 4, 12, GRN2)
    o.append(T(20, 266, "数字は倍音の番号。横軸は下の音の基本周波数を 1 とした周波数（等間隔）。", "start", 10.5, MUT))
    return SVG(680, 280, o, "上の音の周波数が下の音の p/q 倍（p:q）なら、下の音の p の倍数番目の倍音と、上の音の q の倍数番目の倍音が一致する。"
               "p と q が小さいほど、一致が頻繁に起きる。")
F["e04_ratio"] = _f04_ratio()


# 6. 不協和度の曲線（倍音あり / 純音のみ）
def _curve_vals(H, cents_list):
    out = []
    for c in cents_list:
        f2 = _C4 * 2 ** (c / 1200.0)
        R = 0.0
        for h in range(1, H + 1):
            for k in range(1, H + 1):
                R += rough_pair(_C4 * h, 1.0 / h, f2 * k, 1.0 / k)
        out.append(100 * R / ROUGH_REF)
    return out

def _f04_curve():
    o = []
    x0, y0, w, h = 60, 236, 610, 190
    cs = list(range(0, 1201, 4))
    v8 = _curve_vals(8, cs)
    v1 = _curve_vals(1, cs)
    vmax = 110.0
    o.append(AXES(x0, y0, w + 20, h + 14, None, "粗さ"))
    o.append(T(x0 + w / 2, y0 + 36, "上の音の高さ（C4 からのセント）", "middle", 10.5, MUT, True))
    for st in range(13):
        xx = x0 + w * st / 12
        o.append(W(xx, y0, xx, y0 - h, c=LIN, lw=0.8, dash="2,4"))
        o.append(T(xx, y0 + 16, "%d" % (st * 100), "middle", 9, MUT))
    P = lambda c, v: (x0 + w * c / 1200.0, y0 - h * min(v, vmax) / vmax)
    o.append(PL([P(c, v) for c, v in zip(cs, v1)], MUT, 1.6, dash="5,4"))
    o.append(PL([P(c, v) for c, v in zip(cs, v8)], SIG, 2.2))
    for nm, num, den in [("6:5", 6, 5), ("5:4", 5, 4), ("4:3", 4, 3), ("3:2", 3, 2), ("5:3", 5, 3), ("2:1", 2, 1)]:
        c = 1200 * math.log2(num / den)
        v = _curve_vals(8, [c])[0]
        px, py = P(c, v)
        o.append(CIRC(px, py, 4, GRN2, 1.4, GRN2))
        if num == 2:
            o.append(T(px - 8, py - 9, nm, "end", 10, GRN2, True))
        else:
            o.append(T(px, py + 18, nm, "middle", 10, GRN2, True))
    o.append(T(x0 + w, 24, "実線: 倍音を 8 つ含む音どうし　破線: 純音どうし", "end", 10.5, INK, True))
    return SVG(700, y0 + 48, o, "下の音を C4 に固定し、上の音を 1 オクターブ上まで連続して動かしたときの粗さ（短 2 度を 100 とする）。"
               "倍音を含む音どうし（実線）では、比が 6:5, 5:4, 4:3, 3:2, 5:3, 2:1 のところで粗さが谷になる。純音どうし（破線）には、こうした谷が無い。")
F["e04_curve"] = _f04_curve()


# 7. 3 つの音の組み合わせのスペクトル
def _f04_triads():
    o = []
    sets = [("C・E・G", [("C4", 60, SIG), ("E4", 64, BLU), ("G4", 67, GRN2)]),
            ("C・E・G♯", [("C4", 60, SIG), ("E4", 64, BLU), ("G♯4", 68, GRN2)]),
            ("C・C♯・D", [("C4", 60, SIG), ("C♯4", 61, BLU), ("D4", 62, GRN2)])]
    y = 34
    for title, ns in sets:
        o.append(T(16, y - 10, title + "（平均律）", "start", 12.5, INK, True))
        svg, st = SPECTRUM(16, y, 680, [dict(f=freq(m), label=lab, c=c) for lab, m, c in ns], H=8, lane_h=34, fmin=230, fmax=3900, axis=False)
        o.append(svg)
        y += 3 * 34 + 36
    return SVG(712, y - 16, o, "3 つの音を重ねた場合も、2 つずつの組ごとに一致とぶつかりを数えればよい。C・E・G は一致が多く、"
               "C・C♯・D は一致が無くぶつかりが多い。3 つの音の組み合わせ（和音）は 08 章で詳しく扱う。")
F["e04_triads"] = _f04_triads()


# 8. 純正な比と平均律のずれ
def _f04_justet():
    o = []
    items = [("完全 5 度", 3 / 2, 7), ("完全 4 度", 4 / 3, 5), ("長 3 度", 5 / 4, 4), ("短 3 度", 6 / 5, 3), ("長 6 度", 5 / 3, 9), ("短 6 度", 8 / 5, 8)]
    x0, y0 = 150, 30
    zero = x0 + 230
    sc = 10.0     # 1 セント = 10 px
    o.append(W(zero, y0 - 10, zero, y0 + len(items) * 30, c=MUT, lw=1.2))
    o.append(T(zero, y0 - 14, "純正な比", "middle", 10, MUT))
    for i, (nm, r, st) in enumerate(items):
        y = y0 + i * 30
        dev = st * 100 - 1200 * math.log2(r)
        col = GRN2 if abs(dev) < 5 else ALI
        o.append(T(x0 - 10, y + 15, nm, "end", 11.5, INK, True))
        x1 = zero + dev * sc
        o.append(RECT(min(zero, x1), y + 4, abs(x1 - zero), 16, 3, col, col, 1))
        o.append(T(x1 + (8 if dev > 0 else -8), y + 17, "%+.1f セント" % dev, "start" if dev > 0 else "end", 10.5, col, True))
    o.append(T(zero - 15 * sc, y0 + len(items) * 30 + 22, "平均律のほうが狭い ←", "start", 10, MUT))
    o.append(T(zero + 15 * sc, y0 + len(items) * 30 + 22, "→ 平均律のほうが広い", "end", 10, MUT))
    return SVG(712, y0 + len(items) * 30 + 34, o, "平均律の音程が、純正な比からどれだけずれているか（セント）。5 度・4 度のずれは約 2 セントだが、3 度・6 度は 14〜16 セントずれる。")
F["e04_justet"] = _f04_justet()
