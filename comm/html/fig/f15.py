# -*- coding: utf-8 -*-
# 15 章 クラウドとつなぎ続ける の図

def _f15_band(o, x0, x1, y, h, text, c, sz=10, dash=None, tc=None):
    """時間の帯の 1 区間（塗りと文字）。"""
    o.append(RECT(x0, y, x1 - x0, h, 3, soft(c), c, 1.2, dash=dash))
    if text:
        o.append(T((x0 + x1) / 2, y + h / 2 + sz * 0.36, text, "middle", sz, tc or c, True))

# ---- 1 節: 3 つの時計 ----
def _f15_clocks():
    o = []
    ev = [(175, "① 電源を入れる"), (285, "② SNTP で合わせる"), (420, "③ 再起動"), (560, "④ 電源が切れ、入れ直す")]
    xe = 690
    for x, lab in ev:
        o.append(W(x, 34, x, 246, c=FNT, lw=1, dash="3 3"))
        o.append(T(x, 24, lab, "middle", 10.5, INK, True))
    rows = [(64, "本当の時刻", None), (116, "ティック", "（05 章 3 節）"), (168, "RTC", "（電池なし）"), (220, "TLS の検証", "（12 章 4 節）")]
    for y, nm, sub in rows:
        o.append(T(150, y + (0 if sub else 4), nm, "end", 11, INK, True))
        if sub:
            o.append(T(150, y + 14, sub, "end", 9.5, MUT))
    # 本当の時刻
    o.append(ARR(160, 64, xe, 64, c=GRN, lw=1.6, head=6))
    for (x, _), v in zip(ev, ["9:00:00", "9:00:05", "13:20:00", "18:05:00"]):
        o.append(D(x, 64, GRN, 3.2))
        o.append(T(x + 5, 56, v, "start", 10, GRN, False, True))
    # ティック: 再起動と電源断で 0 に戻る
    yb, yt = 132, 100
    pts = [(175, yb), (420, yt + 2), (420, yb), (560, yt + 14), (560, yb), (xe, yt + 18)]
    o.append(PL(pts, c=SIG, lw=2))
    for x in (175, 420, 560):
        o.append(T(x + 4, yb + 12, "0", "start", 10, SIG, True, True))
    o.append(T(300, 140, "起動からの時間を数える", "middle", 9.5, SIG))
    # RTC
    yr, hr = 156, 24
    _f15_band(o, 175, 285, yr, hr, "2000-01-01 から", ALI, 9.5)
    _f15_band(o, 285, 560, yr, hr, "2026-10-24 9:00:05 から（再起動でも止まらない）", GRN, 9.5)
    _f15_band(o, 560, xe, yr, hr, "2000 年に戻る", ALI, 9.5)
    # TLS
    yl = 208
    _f15_band(o, 175, 285, yl, hr, "失敗", ALI, 9.5)
    _f15_band(o, 285, 560, yl, hr, "成功", GRN, 9.5)
    _f15_band(o, 560, xe, yl, hr, "合わせるまで失敗", ALI, 9.5)
    o.append(T(176, 262, "「有効期間の開始前」: RTC が 2000 年のままでは、どの証明書もまだ使えない日付に見える。", "start", 10, ALI))
    return SVG(700, 274, o, "機器の中の 2 つの時計。ティックは起動からの時間を数え、再起動のたびに 0 に戻る。RTC は日付と時刻を数え、再起動では止まらないが、バックアップの電池が無ければ、電源が切れると決まった値（ここでは 2000 年 1 月 1 日）に戻る。戻った RTC のままでは、TLS の証明書の検証が失敗する（横は時間。縮尺どおりではない）。")
F["e15_clocks"] = _f15_clocks()

# ---- 1 節: 4 つの時刻 ----
def _f15_ntp_ts():
    o = []
    yd, ys = 70, 190
    X = lambda ms: 150 + 8 * ms           # 本当の時間（T1 の瞬間から ms）→ x
    t1, t2, t3, t4 = X(0), X(30), X(32), X(42)
    o.append(T(20, yd - 8, "機器の時計", "start", 11, SIG, True))
    o.append(T(20, ys - 8, "サーバの時計", "start", 11, GRN, True))
    o.append(ARR(20, yd, 690, yd, c=SIG, lw=1.6, head=6))
    o.append(ARR(20, ys, 690, ys, c=GRN, lw=1.6, head=6))
    o.append(T(690, ys + 34, "本当の時間 →", "end", 9.5, MUT))
    # 同じ瞬間のずれ
    o.append(W(t1, yd, t1, ys, c=FNT, lw=1.2, dash="3 3"))
    o.append(D(t1, ys, GRN, 3))
    o.append(T(t1 - 6, ys + 16, "このときサーバは 11.500", "end", 9.5, GRN))
    o.append(T(t1 - 6, ys + 30, "（θ = 1.5 s 進んでいる）", "end", 9.5, GRN))
    # 要求と応答
    o.append(ARR(t1, yd, t2, ys, c=SIG, lw=1.8))
    o.append(ARR(t3, ys, t4, yd, c=GRN, lw=1.8))
    o.append(T(238, 118, "要求（T1 を入れる）", "end", 10, SIG, True))
    o.append(T(478, 98, "応答（T1・T2・T3 を入れる）", "start", 10, GRN, True))
    for x, y in ((t1, yd), (t4, yd), (t2, ys), (t3, ys)):
        o.append(D(x, y, INK, 3.6))
    o.append(T(t1, yd - 10, "T1 = 10.000", "middle", 10.5, SIG, True, True))
    o.append(T(t4, yd - 10, "T4 = 10.042", "middle", 10.5, SIG, True, True))
    o.append(T(t2 - 4, ys + 16, "T2 = 11.530", "end", 10.5, GRN, True, True))
    o.append(T(t3 + 4, ys + 16, "T3 = 11.532", "start", 10.5, GRN, True, True))
    # 遅延
    yy = 246
    o.append(DIM(t1, yy, t2, yy, None, c=SIG))
    o.append(T((t1 + t2) / 2, yy - 5, "往きの遅延 d1 = 30 ms", "middle", 10, SIG))
    o.append(DIM(t3, yy, t4, yy, None, c=GRN))
    o.append(T((t3 + t4) / 2, yy + 15, "帰り d2 = 10 ms", "middle", 10, GRN))
    o.append(T((t2 + t3) / 2, ys + 34, "処理 2 ms", "middle", 9.5, MUT))
    # 説明
    o.append(T(530, 122, "T1・T4: 機器の時計で読む", "start", 10, SIG))
    o.append(T(530, 140, "T2・T3: サーバの時計で読む", "start", 10, GRN))
    o.append(T(530, 158, "d1・d2: ネットワークの遅延", "start", 10, MUT))
    o.append(T(530, 176, "（横は 1 ms = 8 px）", "start", 9.5, MUT))
    return SVG(700, 266, o, "1 回のやり取りの 4 つの時刻（例: 機器の時計がサーバより θ = 1.5 s 遅れていて、往きの遅延 30 ms、帰りの遅延 10 ms、サーバの処理 2 ms）。T1 と T4 は機器の時計で、T2 と T3 はサーバの時計で読んだ値なので、2 つの時計のずれと、往きと帰りの遅延の両方が入っている。")
F["e15_ntp_ts"] = _f15_ntp_ts()

# ---- 1 節: 48 バイトのメッセージ ----
def _f15_ntp_pkt():
    o = []
    x0, y0, bw, rh = 40, 6, 13, 24
    fields = [("LI", 2, PUR), ("VN", 3, PUR), ("Mode", 3, PUR), ("Stratum", 8, GLD), ("Poll", 8, MUT), ("Precision", 8, MUT),
              ("Root Delay", 32, MUT), ("Root Dispersion", 32, MUT), ("Reference ID", 32, MUT),
              ("Reference Timestamp", 64, MUT), ("Origin Timestamp", 64, TEA), ("Receive Timestamp", 64, GRN), ("Transmit Timestamp", 64, SIG)]
    s, h = BITS(x0, y0, fields, bit_w=bw, h=rh, row_bits=32, sz=10)
    o.append(s)
    yr = y0 + 14
    for r, off in ((0, 0), (1, 4), (2, 8), (3, 12), (4, 16), (6, 24), (8, 32), (10, 40)):
        o.append(T(x0 - 6, yr + r * rh + rh / 2 + 4, str(off), "end", 9.5, MUT, False, True))
    xa = x0 + 32 * bw + 14
    notes = [(0, "要求は 23 00 00 00（下の 0x23 の内訳）", PUR), (1, "応答: 先頭は 24（Mode 4）、Stratum 1〜15", GLD),
             (2, "要求では、ここから 0 のままでよい", MUT), (6.5, "応答: 要求の Transmit（T1）の写し", TEA),
             (8.5, "応答: T2（要求を受け取った時刻）", GRN), (10.5, "要求: T1 ／ 応答: T3（送った時刻）", SIG)]
    for r, txt, c in notes:
        o.append(T(xa, yr + r * rh + rh / 2 + 4, txt, "start", 10, c, c != MUT))
    o.append(T(x0 - 6, y0 + 9, "バイト", "end", 8.5, FNT))
    # 先頭のバイトと時刻の形
    yb = yr + 12 * rh + 26
    o.append(T(x0, yb, "先頭のバイト 0x23", "start", 10.5, INK, True))
    bits = "00100011"
    groups = [("LI = 0", 0, 2, PUR), ("VN = 4", 2, 5, PUR), ("Mode = 3", 5, 8, PUR)]
    xb = x0 + 120
    for k, ch in enumerate(bits):
        o.append(RECT(xb + k * 20, yb - 15, 20, 22, 2, PSOFT, PUR, 1))
        o.append(T(xb + k * 20 + 10, yb + 1, ch, "middle", 11, INK, True, True))
    for lab, a, b, c in groups:
        o.append(DIM(xb + a * 20 + 1, yb + 14, xb + b * 20 - 1, yb + 14, None, c=c))
        o.append(T(xb + (a + b) * 10, yb + 30, lab, "middle", 9.5, c, True))
    xt = x0 + 330
    o.append(T(xt, yb, "時刻の形（64 ビット）", "start", 10.5, INK, True))
    o.append(RECT(xt, yb + 8, 150, 26, 3, SSOFT, SIG, 1.2))
    o.append(RECT(xt + 150, yb + 8, 150, 26, 3, MSOFT, MUT, 1.2))
    o.append(T(xt + 75, yb + 25, "秒（32 ビット）", "middle", 10, SIG, True))
    o.append(T(xt + 225, yb + 25, "秒の小数（32 ビット）", "middle", 10, MUT, True))
    o.append(T(xt, yb + 50, "1900-01-01 0:00（UTC）からの秒。2036 年に一周する", "start", 9.5, MUT))
    o.append(T(xt, yb + 64, "例: 2026-10-24 9:00:00 = EE 86 F2 10 00 00 00 00", "start", 9.5, MUT, False, True))
    return SVG(700, yb + 76, o, "NTP・SNTP のメッセージ（48 バイト。1 行 32 ビット、左の数字はバイトの位置）。要求は先頭の 0x23 と Transmit Timestamp だけを入れ、ほかは 0 でよい。サーバは、要求の Transmit Timestamp を Origin Timestamp に写し、受け取った時刻 T2 と送った時刻 T3 を入れて返す。値はすべてビッグエンディアン。")
F["e15_ntp_pkt"] = _f15_ntp_pkt()

# ---- 1 節: ドリフト ----
def _f15_drift():
    o = []
    p = Plot(80, 18, 590, 230, (0, 2), (-3.8, 3.8))
    o.append(RECT(p.x, p.Y(1), p.w, p.Y(-1) - p.Y(1), 0, GSOFT, "none", 0))
    o.append(p.axes(xl="経過した時間", yl="時計のずれ [s]", xt=[0, 0.5, 1, 1.5, 2], yt=[-3, -2, -1, 0, 1, 2, 3],
                    xfmt=lambda v: {0: "0", 0.5: "12 時間", 1: "1 日", 1.5: "36 時間", 2: "2 日"}[v],
                    yfmt=lambda v: ("%+d" % v) if v else "0"))
    o.append(T(p.X(2) - 6, p.Y(-1) - 6, "許すずれ E = ±1 s", "end", 9.5, GRN))
    e = 20e-6 * 86400            # 1 日あたりのずれ [s]
    o.append(p.line([(0, 0), (2, 2 * e)], c=ALI, lw=2))
    o.append(p.line([(0, 0), (2, -2 * e)], c=ALI, lw=2, dash="6 4"))
    o.append(T(p.X(2) - 6, p.Y(2 * e) + 16, "+20 ppm（合わせ直さない）", "end", 10, ALI, True))
    o.append(T(p.X(1.6), p.Y(-1.6 * e) + 20, "−20 ppm", "middle", 10, ALI, True))
    o.append(D(p.X(1), p.Y(e), ALI, 4))
    o.append(T(p.X(1) - 8, p.Y(e) - 8, "1 日で 1.728 s", "end", 10.5, ALI, True))
    # 13.2 時間ごとに合わせ直す（合わせた直後のずれは δ/2 = 0.05 s とした）
    Ts = (1 - 0.05) / e
    pts, t = [], 0.0
    while t < 2:
        t1 = min(2, t + Ts)
        pts += [(t, 0.05), (t1, 0.05 + e * (t1 - t))]
        t = t1
    o.append(p.line(pts, c=GRN, lw=2.2))
    o.append(T(p.X(Ts) + 6, p.Y(-0.45), "約 13 時間ごとに合わせ直す", "start", 10, GRN, True))
    return SVG(700, 300, o, "水晶の周波数の誤差による時計のずれ。+20 ppm の時計は 1 日に 1.728 s 進み、合わせ直さなければ、ずれは時間に比例して大きくなる（赤）。約 13 時間ごとに SNTP で合わせ直すと（緑。合わせた直後のずれは δ/2 = 0.05 s とした）、ずれは許す範囲 ±1 s の中に収まる。")
F["e15_drift"] = _f15_drift()

# ---- 2 節: 層ごとの失敗の知らせ ----
_F15_KIND = {"一時的": TEA, "設定の誤り": ALI, "前提の崩れ": GLD}

def _f15_layers():
    o = []
    rows = [("Wi-Fi", "09 章 5 節", SIG, [("ビーコンロス・切断の通知（リンクダウン）", "前提の崩れ", "Wi-Fi から"), ("理由 15（パスフレーズ）が続く", "設定の誤り", "長く待つ・知らせる")]),
            ("DHCP", "08 章 3 節", GLD, [("答えが無い", "一時的", "DHCP"), ("リースが切れた", "前提の崩れ", "DHCP から")]),
            ("DNS", "08 章 4 節", PUR, [("答えが無い", "一時的", "DNS"), ("NXDOMAIN（その名前は無い）", "設定の誤り", "長く待つ・知らせる")]),
            ("SNTP", "1 節", PUR, [("答えが無い・kiss-o'-death", "一時的", "SNTP（間隔を延ばす）")]),
            ("TCP", "11 章 4 節", GRN, [("ECONNREFUSED・ETIMEDOUT・ECONNRESET", "一時的", "TCP（続けば DNS）")]),
            ("TLS", "12 章 4 節", TEA, [("証明書の有効期間の外（時刻が違う）", "前提の崩れ", "SNTP から"), ("知らない CA・ホスト名が違う", "設定の誤り", "長く待つ・知らせる")]),
            ("MQTT", "13 章 5・6 節", PUR, [("PINGRESP が来ない・切れた", "一時的", "TCP から"), ("CONNACK で拒否（ID・権限）", "設定の誤り", "長く待つ・知らせる")])]
    xs = [12, 150, 446, 548]
    y = 22
    for x, h in zip(xs, ["層", "失敗の知らせ（例）", "種類", "やり直す所"]):
        o.append(T(x + 4, y, h, "start", 10.5, INK, True))
    y += 10
    for name, ch, c, ents in rows:
        hh = 16 + 22 * len(ents)
        o.append(RECT(xs[0], y, 128, hh - 6, 6, soft(c), c, 1.3))
        o.append(T(xs[0] + 64, y + (hh - 6) / 2 - 2, name, "middle", 11.5, c, True))
        o.append(T(xs[0] + 64, y + (hh - 6) / 2 + 12, "（%s）" % ch, "middle", 9, MUT))
        for k, (sig, kind, res) in enumerate(ents):
            yy = y + 17 + 22 * k
            o.append(T(xs[1], yy, sig, "start", 10, INK))
            s_, w_ = CHIP(xs[2], yy, kind, _F15_KIND[kind], sz=9.5)
            o.append(s_)
            o.append(T(xs[3], yy, "→ " + res, "start", 10, _F15_KIND[kind], True))
        o.append(W(xs[0], y + hh - 2, 690, y + hh - 2, c=GRD, lw=1))
        y += hh
    o.append(T(12, y + 16, "種類: 一時的（待って同じ層から）・設定の誤り（繰り返しても直らない）・前提の崩れ（崩れた層まで戻る）。TLS・MQTT の失敗では TCP も閉じている。", "start", 9.5, MUT))
    return SVG(700, y + 26, o, "層ごとの失敗の知らせと、その種類、やり直す所の例。同じ「失敗」でも、時間がたてば直りうるもの（一時的）、繰り返しても直らないもの（設定の誤り）、下の層で得たものが使えなくなったもの（前提の崩れ）で、次にすることが違う。")
F["e15_layers"] = _f15_layers()

# ---- 2 節: 再接続の状態機械 ----
def _f15_reconn_sm():
    o = []
    yc, sw, sh = 92, 70, 36
    names = [("Wi-Fi", SIG), ("DHCP", GLD), ("DNS", PUR), ("SNTP", PUR), ("TCP", GRN), ("TLS", TEA), ("MQTT", PUR), ("つながった", GRN)]
    xs = [48 + 86 * i for i in range(8)]
    for (nm, c), x in zip(names, xs):
        o.append(STATE(x, yc, sw, sh, nm, c, end=(nm == "つながった")))
    for i in range(7):
        if i == 2:
            continue                                  # DNS → SNTP は下で（時刻が分からないときだけ）
        o.append(ARR(xs[i] + sw / 2, yc, xs[i + 1] - sw / 2 - 1, yc, c=GRN, lw=1.5, head=6))
    o.append(ARR(xs[2] + sw / 2, yc, xs[3] - sw / 2 - 1, yc, c=GRN, lw=1.5, head=6, dash="3 2"))
    # 上の弧: DNS → TCP（時刻が分かっていれば SNTP を飛ばす）、TLS → SNTP（時刻が違う）
    o.append(CARR(xs[2], yc - sh / 2, xs[4], yc - sh / 2 - 1, 0.32, c=GRN, lw=1.4, head=6))
    o.append(T(xs[3] - 30, 40, "時刻が分かっていれば SNTP を飛ばす", "middle", 9.5, GRN, halo=True))
    o.append(CARR(xs[5], yc - sh / 2, xs[3] + 8, yc - sh / 2 - 1, -0.42, c=GLD, lw=1.4, head=6))
    o.append(T(xs[4] + 26, 18, "証明書の有効期間の外 → SNTP から", "middle", 9.5, GLD, True, halo=True))
    o.append(T(690, 28, "60 秒つながったままなら", "end", 9.5, GRN))
    o.append(T(690, 42, "失敗の回数を 0 に戻す", "end", 9.5, GRN))
    # 失敗を集める線
    yb = 134
    for x in xs:
        o.append(W(x, yc + sh / 2, x, yb, c=ALI, lw=1.2))
    o.append(W(xs[0], yb, xs[7], yb, c=ALI, lw=1.4))
    o.append(T(xs[7] - 4, yb - 6, "切れた", "end", 9.5, ALI))
    o.append(T(xs[0] - 6, yb + 15, "失敗（種類で分ける）", "start", 9.5, ALI, True))
    xw, yw, ww = 300, 196, 180
    xl, wl = 576, 196
    o.append(ARR(xw, yb, xw, yw - 22 - 1, c=TEA, lw=1.6))
    o.append(T(xw + 6, yb + 22, "一時的", "start", 9.5, TEA, True))
    o.append(ARR(xl, yb, xl, yw - 22 - 1, c=ALI, lw=1.6))
    o.append(T(xl + 6, yb + 22, "設定の誤り", "start", 9.5, ALI, True))
    o.append(STATE(xw, yw, ww, 44, "待つ", TEA, "指数バックオフ + ジッタ（05 章 5 節）"))
    o.append(STATE(xl, yw, wl, 44, "長く待つ（例 1 時間）", ALI, "利用者に知らせる"))
    # 待った後
    o.append(T(xw, yw + 40, "待ち終わり: 失敗した層から（TLS・MQTT は TCP から）", "middle", 9.5, TEA, True))
    o.append(T(xw, yw + 55, "続けて 3 回目からは DNS から、6 回目からは Wi-Fi から", "middle", 9.5, TEA))
    o.append(T(xl, yw + 40, "待ち終わり: 同じ層から試す", "middle", 9.5, ALI))
    # 前提の崩れ
    yn = yw + 72
    o.append(RECT(12, yn, 676, 30, 6, GOSOFT, GLD, 1.1))
    o.append(T(24, yn + 19, "前提の崩れは、どの状態からでも:  リンクダウン → Wi-Fi から ・ リースが切れた → DHCP から ・ 時刻が違う → SNTP から", "start", 10, INK))
    return SVG(700, yn + 40, o, "層ごとにやり直す所を決めた再接続の状態機械。成功すれば右へ進み（緑。DNS から SNTP へ進むのは時刻が分からないときだけ）、失敗は種類で分けて、一時的ならバックオフで待ってから、設定の誤りなら長く待って利用者に知らせてから、やり直す。同じ層で続けて失敗するときは、下の層の情報が古いとみて、DNS や Wi-Fi からやり直す。前提の崩れは、どの状態からでも崩れた層に戻る。")
F["e15_reconn_sm"] = _f15_reconn_sm()

# ---- 3 節: ストアアンドフォワード ----
def _f15_cells(o, x, y, nums, n, cw=26, ch=24, c=SIG, sz=9.5):
    """列のます目（nums は入っている通し番号、残りは空き）。"""
    for k in range(n):
        filled = k < len(nums)
        o.append(RECT(x + k * cw, y, cw, ch, 2, soft(c) if filled else PAN, c if filled else LIN, 1.0))
        if filled:
            o.append(T(x + k * cw + cw / 2, y + ch / 2 + 4, str(nums[k]), "middle", sz, c, True, True))

def _f15_sf():
    o = []
    o.append(BOX(14, 52, 100, 50, "測る", "10 分ごと", SIG, SSOFT, SIG, sz=12, ssz=9.5))
    # RAM の列
    o.append(RECT(156, 20, 196, 104, 8, "none", SIG, 1.3))
    o.append(T(166, 38, "RAM の列", "start", 11, SIG, True))
    _f15_cells(o, 166, 48, [41, 42, 43], 7)
    o.append(T(166, 92, "速い・何度でも書ける・小さい", "start", 9.5, MUT))
    o.append(T(166, 110, "リセット・電源断で消える", "start", 9.5, ALI, True))
    # フラッシュの列
    o.append(RECT(156, 168, 196, 92, 8, "none", GRN, 1.3))
    o.append(T(166, 186, "フラッシュの列", "start", 11, GRN, True))
    _f15_cells(o, 166, 196, [37, 38, 39, 40], 7, c=GRN)
    o.append(T(166, 236, "電源が切れても残る", "start", 9.5, GRN, True))
    o.append(T(166, 252, "書ける回数に限りがある", "start", 9.5, MUT))
    o.append(ARR(116, 77, 154, 77, c=SIG, lw=1.6))
    o.append(ARR(254, 126, 254, 166, c=GLD, lw=1.6, dash="4 3"))
    o.append(T(262, 142, "切れている時間が長い・", "start", 9.5, GLD))
    o.append(T(262, 156, "深く眠る前に移す", "start", 9.5, GLD))
    # 送る
    o.append(BOX(400, 90, 130, 64, "古い順に送る", "QoS 1 の PUBLISH（13 章）", SIG, SSOFT, SIG, sz=11.5, ssz=9))
    o.append(ARR(354, 70, 398, 104, c=SIG, lw=1.4))
    o.append(ARR(354, 214, 398, 142, c=GRN, lw=1.4))
    o.append(T(392, 196, "つながったら", "end", 9.5, GRN))
    o.append(BOX(580, 90, 108, 64, "ブローカ", "クラウド", GRN, GSOFT, GRN, sz=11.5, ssz=9.5))
    o.append(ARR(532, 108, 578, 108, c=SIG, lw=1.5))
    o.append(T(555, 101, "37", "middle", 9.5, SIG, True, True))
    o.append(ARR(578, 136, 532, 136, c=GRN, lw=1.5))
    o.append(T(555, 150, "PUBACK", "middle", 9, GRN, True))
    o.append(T(465, 182, "確認が届いたら", "middle", 10, INK, True))
    o.append(T(465, 197, "列から外す（消す）", "middle", 10, INK, True))
    return SVG(700, 270, o, "ストアアンドフォワード。測った値は RAM の送信待ちの列に入り、つながっていればすぐに送られる。切れている時間が長くなったときや深く眠る前は、フラッシュの列に移す。つながったら古い順に送り、確認（PUBACK）が届いてから列から外す。ます目の数字は、1 件ごとに 1 ずつ増やして付ける番号（次の小節で通し番号として定義する）。")
F["e15_sf"] = _f15_sf()

def _f15_record():
    o = []
    x0, y0, u, h = 30, 34, 19, 40
    fields = [("長さ", 1, MUT, "20"), ("種類", 1, MUT, "01"), ("通し番号", 4, SIG, "00 00 00 2A"), ("タイムスタンプ", 4, TEA, "6A DC 73 90"),
              ("データ（温度・湿度など。07 章 5 節の 20 バイト）", 20, PUR, None), ("CRC-16", 2, ALI, None)]
    x = x0
    off = 0
    for nm, nb, c, val in fields:
        w = nb * u
        o.append(RECT(x, y0, w, h, 3, soft(c), c, 1.3))
        if nb == 1:
            left = (off == 0)
            xt = x + w / 2 + (-10 if left else 10)
            o.append(W(x + w / 2, y0 - 1, x + w / 2, y0 - 8, xt, y0 - 12, c=c, lw=1))
            o.append(T(xt + (-2 if left else 2), y0 - 9, nm, "end" if left else "start", 9.5, c, True))
            o.append(T(x + w / 2, y0 + h / 2 + 4, val, "middle", 9.5, INK, False, True))
        else:
            o.append(T(x + w / 2, y0 + (16 if val else h / 2 + 4), nm, "middle", 10 if nb > 2 else 9, c, True))
            if val:
                o.append(T(x + w / 2, y0 + 32, val, "middle", 9.5, INK, False, True))
        o.append(T(x, y0 + h + 14, str(off), "middle", 9, MUT, False, True))
        x += w
        off += nb
    o.append(T(x, y0 + h + 14, str(off), "middle", 9, MUT, False, True))
    o.append(T(x0 - 6, y0 + h + 14, "", "end", 9, MUT))
    yb = y0 + h + 24
    o.append(DIM(x0, yb, x0 + 30 * u, yb, None, c=ALI))
    o.append(T(x0 + 15 * u, yb + 15, "CRC の計算の範囲（30 バイト）。書きかけの件は CRC が合わない", "middle", 9.5, ALI))
    o.append(T(x0, yb + 40, "通し番号: 1 件作るたびに 1 増やし、二度と使わない（例 42 = 0x2A）", "start", 10, SIG))
    o.append(T(x0, yb + 58, "タイムスタンプ: 測った時刻。1970-01-01 0:00（UTC）からの秒（例 2026-10-24 9:00:00）", "start", 10, TEA))
    o.append(T(x0 - 4, y0 + h + 14, "", "end", 9, MUT))
    return SVG(700, yb + 70, o, "フラッシュの列に入れる 1 件の形の例（32 バイト。数字はバイトの位置で、数値はビッグエンディアン）。長さと種類は、空いている所（消した後の 0xFF）と区別するのにも使う。")
F["e15_record"] = _f15_record()

def _f15_full():
    o = []
    x0, x1 = 196, 676
    X = lambda d: x0 + (x1 - x0) * d / 10.0
    rows = [("作ったデータ", [(0, 10, "10 日で 1440 件（10 分おき）", SIG, None)]),
            ("古いものを捨てる", [(0, 3, "失う 432 件", ALI, "4 3"), (3, 10, "残る 1008 件", GRN, None)]),
            ("新しいものを捨てる", [(0, 7, "残る 1008 件", GRN, None), (7, 10, "失う 432 件", ALI, "4 3")]),
            ("間引く", [(0, 7, "残る 504 件（20 分おき）", GRN, "2 2"), (7, 10, "432 件（10 分おき）", GRN, None)])]
    y = 34
    o.append(T(x0 + (x1 - x0) * 0.35, 18, "切れていた 10 日が終わった時点で、列に残っているもの（列は 7 日分 = 1008 件）", "middle", 10.5, INK, True))
    for nm, segs in rows:
        o.append(T(x0 - 10, y + 17, nm, "end", 10.5, INK, True))
        for a, b, lab, c, da in segs:
            o.append(RECT(X(a), y, X(b) - X(a), 26, 3, soft(c), c, 1.3, dash=da))
            o.append(T((X(a) + X(b)) / 2, y + 17, lab, "middle", 10, c, True))
        y += 38
    o.append(W(X(7), 28, X(7), y - 6, c=GLD, lw=1.4, dash="5 3"))
    yt = y + 2
    o.append(W(x0, yt, x1, yt, c=MUT, lw=1.1))
    for d in range(0, 11):
        o.append(W(X(d), yt, X(d), yt + 4, c=MUT, lw=1))
        if d in (0, 3, 7, 10):
            o.append(T(X(d), yt + 16, "%d 日" % d, "middle", 9.5, MUT))
    o.append(T(X(7) + 6, yt + 30, "列が満杯になる（7 日）", "start", 9.5, GLD, True))
    return SVG(700, yt + 40, o, "10 分ごとに測る機器が 10 日間つながらなかったとき、7 日分の列に残るもの。古いものを捨てると最初の 3 日分を、新しいものを捨てると最後の 3 日分を失う。満杯になるたびに 1 件おきに減らす（間引く）と、10 日分のすべてが残る代わりに、古い部分の間隔が粗くなる。")
F["e15_full"] = _f15_full()

def _f15_wear():
    o = []
    o.append(T(14, 22, "(a) 1 件ごとに、同じまとまりを消して書き直す", "start", 11, ALI, True))
    o.append(RECT(40, 34, 90, 48, 4, ASOFT, ALI, 1.4))
    o.append(T(85, 54, "まとまり", "middle", 10, ALI, True))
    o.append(T(85, 70, "4 KB", "middle", 9.5, MUT))
    o.append(T(170, 50, "1 日に 144 回消す", "start", 10.5, INK, True))
    o.append(T(170, 68, "→ 1 万回の上限まで 10,000 ÷ 144 ≈ 69 日。1 年では 52,560 回", "start", 10.5, ALI, True))
    o.append(T(14, 110, "(b) 9 つのまとまりを輪のように並べ、順に書いていく", "start", 11, GRN, True))
    bw, gap, x0, yb = 66, 8, 22, 138
    for k in range(9):
        x = x0 + k * (bw + gap)
        if k < 3:
            c, txt, dash = GRN, "書いた", None
        elif k == 3:
            c, txt, dash = SIG, "書いている", None
        elif k == 4:
            c, txt, dash = ALI, "最も古い", "4 3"
        else:
            c, txt, dash = GRN, "書いた", None
        o.append(RECT(x, yb, bw, 46, 4, soft(c), c, 1.3, dash=dash))
        o.append(T(x + bw / 2, yb + 18, "まとまり %d" % k, "middle", 9.5, c, True))
        o.append(T(x + bw / 2, yb + 35, txt, "middle", 9, c))
        if k == 3:
            o.append(RECT(x + 4, yb + 40, (bw - 8) * 0.55, 3, 1, SIG, "none", 0))
    xs3 = x0 + 3 * (bw + gap) + bw * 0.6
    o.append(ARR(xs3, yb - 12, xs3, yb - 1, c=SIG, lw=1.4, head=5))
    o.append(T(xs3 + 4, yb - 14, "書く位置", "start", 9.5, SIG, True))
    x4 = x0 + 4 * (bw + gap) + bw / 2
    o.append(T(x4, yb + 62, "次に消す（128 件を捨てる）", "middle", 9.5, ALI, True))
    xl = x0 + 8 * (bw + gap) + bw / 2
    o.append(PATH("M%g,%g Q%g,%g %g,%g" % (xl, yb + 48, (xl + x0) / 2, yb + 118, x0 + bw / 2 + 4, yb + 52), c=GRN, lw=1.3, dash="5 4"))
    o.append(T((xl + x0) / 2, yb + 98, "最後まで書いたら、まとまり 0 に戻る（一巡 = 1152 件 = 8 日）", "middle", 10, GRN, True))
    o.append(T(14, yb + 128, "→ 各まとまりを消すのは 8 日に 1 回。1 万回の上限まで 10,000 × 8 日 ≈ 219 年。1 年では各 45〜46 回", "start", 10.5, GRN, True))
    return SVG(700, yb + 140, o, "フラッシュの書き方と、消す回数。同じまとまりを書き直すと、10 分ごとの書き込みでも 69 日で書き込み回数の上限（1 万回とした）に達する。まとまりを順に使えば、1 つのまとまりを消すのは書く位置が一巡したときだけなので、上限に達するまで 200 年以上かかる。")
F["e15_wear"] = _f15_wear()

# ---- 4 節: 重複が生まれる場所 ----
def _f15_badge(o, x, y, k, c=ALI):
    o.append(CIRC(x, y, 9, c, 1.4, soft(c)))
    o.append(T(x, y + 4, str(k), "middle", 10.5, c, True))

def _f15_dupwhere():
    o = []
    bx = [(14, "機器", "列から送る", SIG), (214, "ブローカ", "QoS 1", GRN), (414, "サーバのアプリ", "最後の受け手", PUR), (594, "データベース", "記録", MUT)]
    y0, h = 34, 54
    for x, nm, sub, c in bx:
        w = 96 if nm != "サーバのアプリ" else 120
        o.append(BOX(x, y0, w, h, nm, sub, c, soft(c), c, sz=11.5, ssz=9.5))
    o.append(ARR(112, 61, 212, 61, c=SIG, lw=1.6))
    o.append(T(162, 54, "PUBLISH", "middle", 9.5, SIG))
    o.append(ARR(312, 61, 412, 61, c=GRN, lw=1.6))
    o.append(T(362, 54, "配る", "middle", 9.5, GRN))
    o.append(ARR(536, 61, 592, 61, c=PUR, lw=1.6))
    _f15_badge(o, 162, 76, 1)
    _f15_badge(o, 62, 104, 2)
    _f15_badge(o, 362, 76, 3)
    _f15_badge(o, 474, 104, 4)
    o.append(T(642, 106, "✓", "middle", 15, GRN, True))
    notes = [(1, "機器: PUBACK を待つ間に切れた → つなぎ直して同じものを送り直す（13 章 4 節）"),
             (2, "機器: 再起動で、どこまで確認が済んだかを失った → 列の古い所から送り直す（3 節）"),
             (3, "ブローカ → アプリ: この区間の PUBACK が失われた → ブローカが送り直す（QoS は区間ごと）"),
             (4, "アプリ: 記録の途中で止まって再起動した → 同じものをもう一度受け取って処理する")]
    y = 140
    for k, txt in notes:
        _f15_badge(o, 26, y - 4, k)
        o.append(T(44, y, txt, "start", 10, INK))
        y += 24
    o.append(T(26, y + 8, "✓ 最後の受け手が、機器ごとに受け取った通し番号の最大を覚え、それ以下の番号を捨てる", "start", 10.5, GRN, True))
    return SVG(700, y + 20, o, "同じデータが 2 回以上届く 4 つの場所。どの区間でも重複が生まれうるので、区間ごとの仕組み（QoS）だけでは防ぎきれない。データと一緒に運ばれる通し番号を使って、最後の受け手が重複を捨てる。")
F["e15_dupwhere"] = _f15_dupwhere()

def _f15_dedup():
    lanes = [("機器", SIG), ("ブローカ", GRN), ("サーバのアプリ", PUR)]
    msgs = [(0, 1, "PUBLISH 通し番号 42", {"c": SIG}),
            (1, 2, "42", {"c": GRN}),
            ("note", 2, "最大 41 → 42。記録する", {"c": PUR}),
            (1, 0, "PUBACK", {"c": GRN, "lost": True}),
            ("gap", ""),
            ("note", 0, "接続が切れ、つなぎ直す", {"c": GLD}),
            (0, 1, "PUBLISH 42（DUP = 1）", {"c": SIG}),
            (1, 2, "42（もう一度）", {"c": GRN}),
            ("note", 2, "42 ≤ 最大 42: 重複なので捨てる\n（ブローカへの確認は返す）", {"c": ALI}),
            (1, 0, "PUBACK", {"c": GRN}),
            (0, 1, "PUBLISH 43", {"c": SIG}),
            (1, 2, "43", {"c": GRN}),
            ("note", 2, "最大 42 → 43。記録する", {"c": PUR})]
    return SEQFIG(lanes, msgs, "PUBACK が失われて、機器が通し番号 42 を送り直した場合。ブローカは QoS 1 の約束どおり 42 を 2 回配るが、サーバのアプリは受け取った通し番号の最大（42）を覚えているので、2 回目を捨てる。データベースには 42 が 1 回だけ記録される。", w=680)
F["e15_dedup"] = _f15_dedup()

def _f15_idem():
    o = []
    panels = [(14, ALI, "冪等でない命令: 「目標を 1 °C 上げる」", ["22 °C", "23 °C", "24 °C"], "望んだのは 23 °C。送り直しで 24 °C になった"),
              (360, GRN, "冪等な命令: 「目標を 23 °C にする」", ["22 °C", "23 °C", "23 °C"], "何回届いても 23 °C")]
    for x, c, title, states, res in panels:
        o.append(RECT(x, 8, 326, 172, 8, "none", c, 1.2, dash="4 3"))
        o.append(T(x + 163, 30, title, "middle", 11, c, True))
        for k, st in enumerate(states):
            sx = x + 18 + k * 110
            bad = (c == ALI and k == 2)
            o.append(RECT(sx, 92, 70, 34, 6, soft(ALI if bad else (SIG if k == 0 else c)), ALI if bad else (SIG if k == 0 else c), 1.4))
            o.append(T(sx + 35, 114, st, "middle", 12, ALI if bad else INK, True))
            if k < 2:
                o.append(ARR(sx + 72, 109, sx + 108, 109, c=c, lw=1.5))
                o.append(T(sx + 90, 84, "1 回目" if k == 0 else "2 回目", "middle", 9.5, c, True))
                o.append(T(sx + 90, 70, "届く" if k == 0 else "（送り直し）", "middle", 9.5, MUT))
        o.append(T(x + 18 + 35, 146, "最初", "middle", 9.5, MUT))
        o.append(T(x + 163, 168, ("× " if c == ALI else "○ ") + res, "middle", 10.5, c, True))
    o.append(T(14, 204, "冪等にできない操作（例「1 回分の餌を出す」）は、命令ごとに番号を付け、処理した番号と結果を覚えて、同じ番号には結果だけを返す。", "start", 10, INK))
    return SVG(700, 216, o, "同じ命令が 2 回届いたとき。変化の量で書いた命令（左）は、届いた回数だけ効いてしまう。なってほしい状態で書いた命令（右）は冪等で、何回届いても結果は同じである。")
F["e15_idem"] = _f15_idem()

# ---- 5 節: 機器が持つものと、使う所 ----
def _f15_ident():
    o = []
    o.append(RECT(10, 10, 292, 262, 10, "none", SIG, 1.4))
    o.append(T(24, 30, "機器が持つもの", "start", 11.5, SIG, True))
    rows = [("サーバの名前", "mqtt.example.com", MUT, 44), ("トラストアンカー", "ルート証明書（12 章 4 節）", TEA, 98),
            ("デバイス ID", "dev-0001A2（名乗るための名前。公開してよい）", SIG, 152),
            ("資格情報（秘密）", "秘密鍵とクライアント証明書（12 章 5 節）。守られた場所に置く", ALI, 206)]
    for nm, sub, c, y in rows:
        o.append(BOX(22, y, 268, 46, nm, sub, c, soft(c), c, sz=11, ssz=9.5))
    steps = [("DNS", "名前を引く（08 章 4 節）", PUR, 36), ("TLS", "サーバの証明書を確かめる（ホスト名も）", TEA, 86),
             ("TLS", "クライアント証明書で機器を確かめてもらう", TEA, 136), ("MQTT", "CONNECT のクライアント ID（13 章 3 節）", PUR, 186),
             ("MQTT", "トピックとシャドウの名前（dev-0001A2 を含む）", PUR, 236)]
    for nm, sub, c, y in steps:
        o.append(RECT(404, y, 286, 38, 6, soft(c), c, 1.3))
        o.append(T(414, y + 24, nm, "start", 11, c, True))
        o.append(T(462, y + 24, sub, "start", 9.5, INK))
    links = [(66, 55, MUT), (66, 101, MUT), (121, 109, TEA), (229, 159, ALI), (175, 209, SIG), (175, 253, SIG)]
    for y1, y2, c in links:
        o.append(ARR(292, y1, 402, y2, c=c, lw=1.3, head=6))
    o.append(T(14, 292, "どれも機器ごとに別の値にする（デバイス ID と資格情報）。サーバの名前とトラストアンカーは全部の機器で同じでよい。", "start", 10, INK))
    return SVG(700, 304, o, "機器がクラウドにつなぐために持つものと、それを使う所。デバイス ID は名乗るための名前で、資格情報（ここではクライアント証明書と秘密鍵）がその持ち主であることを示す。")
F["e15_ident"] = _f15_ident()

def _f15_prov():
    o = []
    who = {"工場": GLD, "利用者": PUR, "機器": SIG, "サービス": GRN}
    cols = [(10, "(a) 工場で入れる", [("工場", "機器ごとのデバイス ID・秘密鍵・証明書を入れる（機器の中で鍵を作り、公開鍵に署名してもらう形もある）"),
                                    ("利用者", "Wi-Fi の設定を渡す（09 章 6 節）"),
                                    ("機器", "すぐに自分の資格情報でクラウドへつなぐ")],
             "工場の工程で、機器ごとの秘密を扱う"),
            (356, "(b) 最初の起動で入れる", [("工場", "仮の資格情報だけを入れる（全部に共通か、機器ごと）"),
                                         ("利用者", "Wi-Fi の設定を渡す（09 章 6 節）"),
                                         ("機器", "中で鍵の組を作り、仮の資格情報でプロビジョニング用のサービスにつなぐ"),
                                         ("サービス", "公開鍵に署名した証明書（とデバイス ID）を発行する"),
                                         ("機器", "以後は自分の資格情報でクラウドへつなぐ")],
             "秘密鍵は機器の外に出ない。仮の資格情報の扱いが要る")]
    for x, title, steps, note in cols:
        o.append(T(x + 167, 24, title, "middle", 11.5, INK, True))
        y = 38
        for k, (wh, txt) in enumerate(steps):
            c = who[wh]
            o.append(RECT(x, y, 334, 44, 6, soft(c), c, 1.3))
            o.append(T(x + 10, y + 27, wh, "start", 10.5, c, True))
            lines = wrap(txt, 26)
            for i, l in enumerate(lines):
                o.append(T(x + 76, y + 27 + (i - (len(lines) - 1) / 2) * 14, l, "start", 9.5, INK))
            if k < len(steps) - 1:
                o.append(ARR(x + 167, y + 44, x + 167, y + 55, c=MUT, lw=1.3, head=5))
            y += 56
        o.append(T(x + 167, y + 6, note, "middle", 10, GLD if x < 100 else GRN, True))
    return SVG(700, 38 + 5 * 56 + 20, o, "デバイス ID と資格情報を入れる 2 つの時期。(a) 工場で入れれば箱から出してすぐつなげるが、工場で秘密を扱う。(b) 最初の起動で入れる形では、機器が中で作った鍵に証明書を発行してもらうので秘密鍵は外に出ないが、仮の資格情報とプロビジョニング用のサービスが要る。")
F["e15_prov"] = _f15_prov()

# ---- 6 節: デバイスシャドウ ----
def _f15_shadow_doc():
    o = []
    o.append(T(14, 24, "機器 dev-0001A2 のシャドウ", "start", 11.5, INK, True))
    s_, w_ = CHIP(230, 25, "版番号 8", GLD, sz=10)
    o.append(s_)
    boxes = [(14, "desired", "アプリが書く（望む状態）", PUR, ['"interval": 60,', '"target": 22.0']),
             (244, "reported", "機器が書く（報告した状態）", SIG, ['"interval": 600,', '"target": 22.0']),
             (474, "差分", "サーバが比べる", ALI, ['"interval": 60'])]
    for x, nm, sub, c, lines in boxes:
        o.append(RECT(x, 40, 212, 116, 8, soft(c), c, 1.4))
        o.append(T(x + 12, 62, nm, "start", 12, c, True, nm != "差分"))
        o.append(T(x + 12, 78, sub, "start", 9.5, MUT))
        o.append(T(x + 12, 102, "{", "start", 11, INK, False, True))
        for i, l in enumerate(lines):
            o.append(T(x + 26, 118 + i * 16, l, "start", 11, INK, False, True))
        o.append(T(x + 12, 118 + len(lines) * 16, "}", "start", 11, INK, False, True))
    o.append(T(580, 176, "→ つながったときに機器へ送る", "middle", 10, ALI, True))
    o.append(T(14, 178, "値が違う項目（interval）だけが差分になる。target は同じなので入らない。", "start", 10, INK))
    o.append(T(14, 196, "機器が反映して reported を 60 にすれば、差分は空になる。", "start", 10, INK))
    return SVG(700, 208, o, "デバイスシャドウの例（形は JSON で、項目の名前は例）。アプリは desired に望む状態を書き、機器は reported に自分の状態を書く。サーバは両者の値の違う項目を差分として機器に送る。文書を更新するたびに版番号が 1 増える。")
F["e15_shadow_doc"] = _f15_shadow_doc()

def _f15_shadow_seq():
    lanes = [("アプリ", PUR), ("シャドウ（サーバ）", GRN), ("機器", SIG)]
    msgs = [("note", 2, "眠っている", {"c": MUT}),
            (0, 1, "desired.interval = 60", {"c": PUR, "mono": True}),
            ("note", 1, "版 7。差分 interval = 60", {"c": GRN}),
            (0, 1, "desired.interval = 300", {"c": PUR, "mono": True}),
            ("note", 1, "版 8。差分 interval = 300", {"c": GRN}),
            ("gap", ""),
            ("note", 2, "起きて、つながる", {"c": SIG}),
            (2, 1, "シャドウを読む", {"c": SIG}),
            (1, 2, "差分 interval = 300（版 8）", {"c": GRN}),
            (2, 2, "範囲を確かめて反映", {"c": SIG}),
            (2, 1, "reported.interval = 300", {"c": SIG, "mono": True}),
            ("note", 1, "版 9。差分なし", {"c": GRN}),
            (1, 0, "反映された（reported = desired）", {"c": GRN})]
    return SEQFIG(lanes, msgs, "機器が眠っている間に、アプリが報告の間隔を 2 回変えた場合。機器は起きてつながったときに、最後の desired との差分だけを受け取り、反映してから reported を報告する。途中の値（60）が機器に届くことはなく、アプリは reported が desired と同じになったことで反映を知る。", w=680, lane_w=200)
F["e15_shadow_seq"] = _f15_shadow_seq()

# ---- 7 節: まとめて送る ----
def _f15_batch_tl():
    o = []
    x0, x1, tmax = 170, 680, 120.0
    X = lambda m: x0 + (x1 - x0) * m / tmax
    rows = [("B = 1（測るたびに送る）", [10 * k for k in range(12)], [], "接続 12 回"),
            ("B = 6（6 件ずつ）", [50, 110], [], "接続 2 回"),
            ("B = 6 と、急ぐもの", [50, 110], [73], "接続 3 回")]
    y = 40
    for nm, conns, alarms, cnt in rows:
        o.append(T(x0 - 12, y + 4, nm, "end", 10.5, INK, True))
        o.append(W(x0, y, x1, y, c=LIN, lw=1.2))
        for k in range(12):
            o.append(D(X(10 * k), y, SIG, 3.4))
        for m in conns:
            o.append(RECT(X(m) + 2, y - 15, 9, 30, 2, GSOFT, GRN, 1.3))
        for m in alarms:
            o.append(RECT(X(m) - 4, y - 15, 9, 30, 2, ASOFT, ALI, 1.4))
            o.append(T(X(m) + 8, y - 18, "警報はすぐ送る", "start", 9.5, ALI, True))
        o.append(T(x1, y + 28, cnt, "end", 9.5, GRN, True))
        y += 62
    # 遅れ
    yd = 40 + 62 + 24
    o.append(DIM(X(0), yd, X(50) + 2, yd, None, c=GLD))
    o.append(T(X(25), yd + 15, "最初に測った件の遅れ (B − 1) × 10 分 = 50 分", "middle", 9.5, GLD, True))
    yt = y - 18
    o.append(W(x0, yt, x1, yt, c=MUT, lw=1.1))
    for m in range(0, 121, 10):
        o.append(W(X(m), yt, X(m), yt + 4, c=MUT, lw=1))
        if m % 30 == 0:
            o.append(T(X(m), yt + 16, "%d 分" % m, "middle", 9.5, MUT))
    o.append(D(x0 + 4, yt + 34, SIG, 3.4))
    o.append(T(x0 + 12, yt + 38, "測る（10 分ごと）", "start", 9.5, MUT))
    o.append(RECT(x0 + 140, yt + 26, 9, 16, 2, GSOFT, GRN, 1.2))
    o.append(T(x0 + 156, yt + 38, "接続して、ためた分を送る", "start", 9.5, MUT))
    return SVG(700, yt + 50, o, "2 時間の間に送る様子（測る間隔 10 分）。測るたびに送ると 12 回接続する。6 件ずつまとめると接続は 2 回で済むが、最初に測った件は 50 分待ってから送られる。警報のように急ぐものだけは、まとめずにすぐ接続して送る。")
F["e15_batch_tl"] = _f15_batch_tl()

def _f15_batch_curve():
    o = []
    Tm, Qc, Qm, Is = 600.0, 0.150, 0.0024, 5e-6
    I = lambda B: (Is + (Qc / B + Qm) / Tm) * 1e6       # µA
    p = Plot(90, 20, 560, 230, (8, 2400), (5, 500), xlog=True, ylog=True)
    o.append(p.axes(xl="報告の間隔 B × 10 分（最大の遅れは (B − 1) × 10 分）", yl="平均電流 [µA]", xt=[10, 60, 360, 1440], yt=[10, 30, 100, 300],
                    xfmt=lambda v: {10: "10 分", 60: "1 時間", 360: "6 時間", 1440: "1 日"}[v], yfmt=lambda v: "%g" % v))
    floor = I(1e12)
    o.append(p.line([(8, floor), (2400, floor)], c=GRN, lw=1.3, dash="6 4"))
    o.append(T(p.X(2400) - 4, p.Y(floor) + 14, "下限: 眠っている間の電流 + メッセージの分 = 9 µA", "end", 9.5, GRN, True, halo=True))
    o.append(p.line([(8, 290), (2400, 290)], c=TEA, lw=1.3, dash="6 4"))
    o.append(T(p.X(2400) - 4, p.Y(290) - 6, "つなぎ続ける（09 章 4 節の例）約 290 µA", "end", 9.5, TEA, True))
    pts = [(10 * B, I(B)) for B in [1 + 0.25 * k for k in range(0, 573)]]
    o.append(p.line(pts, c=SIG, lw=2.2))
    Bs = Qc / ((Is + Qm / Tm) * Tm)
    o.append(W(p.X(10 * Bs), p.Y(5), p.X(10 * Bs), p.Y(I(Bs)), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(10 * Bs) - 4, p.Y(13), "B ≈ 28", "end", 9.5, MUT))
    labs = [(1, "B = 1: 259 µA", 4, 26, "start"), (6, "B = 6: 50.7 µA", 8, -6, "start"), (36, "B = 36: 15.9 µA", 8, -8, "start"), (144, "B = 144: 10.7 µA", -2, -10, "end")]
    for B, lab, dx, dy, a in labs:
        o.append(D(p.X(10 * B), p.Y(I(B)), SIG, 4.2))
        o.append(T(p.X(10 * B) + dx, p.Y(I(B)) + dy, lab, a, 10, SIG, True, halo=True))
    return SVG(700, 296, o, "まとめる件数 B と平均電流（測る間隔 10 分、接続 1 回 150 mC、メッセージ 1 つ 2.4 mC、眠っている間 5 µA。両軸とも対数目盛）。B を増やすと接続の分が 1/B になって電流は下がるが、眠っている間の電流とメッセージの分の 9 µA より下には下がらない。B ≈ 28 より先では、遅れが延びるわりに電流は減らない。")
F["e15_batch_curve"] = _f15_batch_curve()
