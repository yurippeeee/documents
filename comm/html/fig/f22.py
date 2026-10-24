# -*- coding: utf-8 -*-
# 22 章 大きなデータを運ぶ の図

# ---- 1 節: 更新の全体の流れ ----
def _f22_layout():
    o = []
    x0, y0, h = 20, 74, 54
    parts = [("ブートローダ", 70, MUT), ("スロット A", 230, SIG), ("スロット B", 230, GLD), ("記録", 50, PUR), ("データ", 80, GRN)]
    xs = []
    x = x0
    for name, w, c in parts:
        o.append(RECT(x, y0, w, h, 4, soft(c), c, 1.4))
        o.append(T(x + w / 2, y0 + 22, name, "middle", 10.5 if w < 100 else 12, c, True))
        xs.append((x, w))
        x += w
    o.append(T(xs[1][0] + 115, y0 + 42, "いま動いているイメージ（版 1.3）", "middle", 10, INK))
    o.append(T(xs[2][0] + 115, y0 + 42, "新しいイメージを書く（版 1.4）", "middle", 10, INK))
    # 下の説明
    yb = y0 + h + 18
    o.append(T(xs[0][0] + 35, yb, "起動する", "middle", 9.5, MUT))
    o.append(T(xs[0][0] + 35, yb + 13, "スロットを選ぶ", "middle", 9.5, MUT))
    o.append(T(xs[3][0] + 25, yb, "進み具合", "middle", 9.5, MUT))
    o.append(T(xs[3][0] + 25, yb + 13, "（2 節）", "middle", 9.5, MUT))
    o.append(T(xs[4][0] + 40, yb, "設定・", "middle", 9.5, MUT))
    o.append(T(xs[4][0] + 40, yb + 13, "送信待ちの列", "middle", 9.5, MUT))
    o.append(T(xs[1][0] + 115, yb, "そのまま動き続ける", "middle", 9.5, SIG))
    o.append(T(xs[2][0] + 115, yb, "受信したチャンクを順に書く（2〜4 節）", "middle", 9.5, GLD))
    # ブートローダから 2 つのスロットへ
    bx = xs[0][0] + 35
    o.append(CARR(bx, y0 - 2, xs[1][0] + 115, y0 - 2, bend=0.32, c=MUT, lw=1.4))
    o.append(CARR(bx, y0 - 2, xs[2][0] + 115, y0 - 2, bend=0.22, c=MUT, lw=1.4, dash="4 3"))
    o.append(T(xs[1][0] + 115, 16, "リセットの後、どちらかを起動する", "middle", 10, MUT, halo=True))
    # 受信の矢印
    o.append(ARR(xs[2][0] + 190, 30, xs[2][0] + 190, y0 - 3, c=GLD, lw=1.8))
    o.append(T(xs[2][0] + 182, 40, "受信", "end", 10, GLD, True))
    yl = yb + 40
    o.append(T(350, yl, "いま動いているイメージの上には書かない。書いている途中で通信や電源が切れても、スロット A から起動できる。", "middle", 10.5, INK))
    return SVG(700, yl + 12, o, "フラッシュメモリの分け方の例（幅の比は例）。新しいイメージは、いま動いているイメージとは別のスロットに書く。ブートローダは、リセットの後に、どちらのスロットのイメージを起動するかを決める。記録の領域には、取り込みの進み具合を書き足していく（2 節）。")
F["e22_layout"] = _f22_layout()

def _f22_flow():
    o = []
    steps = [("① 知る", "マニフェスト（版・大きさ・ハッシュ・URL）を受け取る", PUR),
             ("② 取り込む", "分けて運び、もう一方のスロットに書く（2〜4 節）", SIG),
             ("③ 確かめる", "大きさ・ハッシュ・署名・版を確かめる（5 節）", GRN),
             ("④ 切り替えて起動", "再起動し、新しいイメージを試しに起動する（6 節）", GLD),
             ("⑤ 確定", "自己診断とサーバへの接続に通ったら確定する（6 節）", GRN)]
    w, g, x0, y0, h = 124, 15, 10, 20, 98
    cx = []
    for i, (t, s, c) in enumerate(steps):
        x = x0 + i * (w + g)
        o.append(BOX(x, y0, w, h, t, s, c, soft(c), c, sz=11.5, ssz=9.5))
        cx.append(x + w / 2)
        if i:
            o.append(ARR(x - g + 1, y0 + h / 2, x - 2, y0 + h / 2, c=MUT, lw=1.6))
    yb = y0 + h
    # ③ → ② やり直し
    o.append(CARR(cx[2], yb + 2, cx[1], yb + 2, bend=0.32, c=ALI, lw=1.4, dash="4 3"))
    o.append(T((cx[1] + cx[2]) / 2, yb + 44, "合わない → 捨てて取り込み直す", "middle", 9.5, ALI, halo=True))
    # ⑤ → ① ロールバック
    yr = yb + 66
    o.append(W(cx[4], yb + 2, cx[4], yr, cx[0], yr, cx[0], yb + 9, c=ALI, lw=1.4, dash="4 3"))
    o.append(ARR(cx[0], yb + 12, cx[0], yb + 3, c=ALI, lw=1.4, head=6))
    o.append(T((cx[0] + cx[4]) / 2, yr + 15, "自己診断に通らない・固まる → 元のイメージで動き続ける（ロールバック。6 節）", "middle", 9.5, ALI))
    yt = yr + 40
    o.append(T(14, yt, "② の運び方: Wi-Fi・LTE-M の機器はサーバへ取りに行く（HTTP の Range 要求・CoAP のブロック転送）。", "start", 10, INK))
    o.append(T(14, yt + 17, "BLE の機器には、スマートフォンが送り込む（GATT の Write Command と、アプリケーションの確認）。", "start", 10, INK))
    return SVG(700, yt + 28, o, "更新の 5 つの段。③ で合わなければ捨てて取り込み直し、⑤ で確定できなければ元のイメージに戻る。どの経路でも段は同じで、違うのは ② の運び方である。")
F["e22_flow"] = _f22_flow()

# ---- 2 節: チャンクと再開 ----
def _f22_chunks():
    o = []
    x0, y0, pw = 40, 34, 5.0
    o.append(T(x0, 20, "イメージ 512,000 バイト = 4096 バイトのチャンク × 125", "start", 11, INK, True))
    o.append(RECT(x0, y0, 64 * pw, 24, 2, GSOFT, GRN, 1.2))
    o.append(RECT(x0 + 64 * pw, y0, pw, 24, 0, GOSOFT, GLD, 1.2))
    o.append(RECT(x0 + 65 * pw, y0, 60 * pw, 24, 2, PAN, LIN, 1.2))
    o.append(T(x0 + 32 * pw, y0 + 16, "書き終えた（チャンク 0〜63）", "middle", 9.5, GRN, True))
    o.append(T(x0 + 95 * pw, y0 + 16, "まだ", "middle", 9.5, MUT))
    for off, xx in ((0, x0), (262144, x0 + 64 * pw), (512000, x0 + 125 * pw)):
        o.append(W(xx, y0 + 24, xx, y0 + 30, c=MUT, lw=1))
        o.append(T(xx, y0 + 41, "%d" % off, "middle", 9.5, MUT, False, True))
    # 拡大
    zx, zy, zw, zh = 110, 104, 105, 40
    sx0, sx1 = x0 + 62 * pw, x0 + 67 * pw
    o.append(W(sx0, y0 + 24, zx, zy, c=FNT, lw=1, dash="3 3"))
    o.append(W(sx1, y0 + 24, zx + 5 * zw, zy, c=FNT, lw=1, dash="3 3"))
    kinds = [(62, GRN, "書いた"), (63, GRN, "書いた"), (64, GLD, "書きかけ"), (65, MUT, "まだ"), (66, MUT, "まだ")]
    for i, (k, c, lab) in enumerate(kinds):
        xx = zx + i * zw
        o.append(RECT(xx, zy, zw, zh, 3, soft(c), c, 1.3))
        o.append(T(xx + zw / 2, zy + 17, "チャンク %d" % k, "middle", 10.5, c, True))
        o.append(T(xx + zw / 2, zy + 32, lab, "middle", 9.5, c))
    for i in range(6):
        o.append(T(zx + i * zw, zy + zh + 15, "%d" % ((62 + i) * 4096), "middle", 9.5, MUT, False, True))
    o.append(T(14, zy + zh + 15, "オフセット", "start", 9.5, MUT))
    # 記録
    yr = 200
    o.append(T(20, yr + 15, "記録（書き足す）", "start", 10.5, PUR, True))
    vals = ["1", "2", "3", "…", "62", "63", "64", "", ""]
    for i, v in enumerate(vals):
        xx = 130 + i * 40
        empty = (v == "")
        o.append(RECT(xx, yr, 36, 22, 3, PAN if empty else PSOFT, LIN if empty else PUR, 1.1, dash="3 2" if empty else None))
        o.append(T(xx + 18, yr + 15, v if v else "FF", "middle", 9.5, MUT if empty else PUR, not empty, True))
    o.append(T(130 + 9 * 40 + 6, yr + 15, "← 最後の記録は 64", "start", 10, PUR))
    o.append(T(20, yr + 46, "再開: オフセット 64 × 4096 = 262144 から頼み直し、チャンク 64 を消して書き直す。記録はチャンクを書き終えた後に書く。", "start", 10.5, INK))
    return SVG(700, yr + 58, o, "チャンクとオフセットと記録。機器は、チャンクを書き終えるたびに、書き終えた数を記録の領域に書き足す。チャンク 64 を書いている途中で切れたら、最後の記録 64 から、オフセット 262144 の続きを頼む。")
F["e22_chunks"] = _f22_chunks()

def _f22_range():
    lanes = [("機器", SIG), ("サーバ", GRN)]
    msgs = [
        (0, 1, "GET /fw/1.4.0.bin", {"mono": True, "sub": "（最初は Range なし）"}),
        (1, 0, "200 OK　Content-Length: 512000", {"c": GRN, "mono": True}),
        (1, 0, "本文 0〜262143 を受け取り、チャンク 0〜63 を書く", {"c": GRN, "dash": True}),
        (1, 0, "本文の続き", {"lost": True}),
        ("note", 0, "切れた。記録は 64（262144 バイト）", {"c": ALI}),
        ("gap", "TCP と TLS でつなぎ直す", {"lane": 0}),
        (0, 1, "GET /fw/1.4.0.bin", {"mono": True, "sub": "Range: bytes=262144-"}),
        (1, 0, "206 Partial Content", {"c": GRN, "mono": True, "sub": "Content-Range: bytes 262144-511999/512000"}),
        ("note", 0, "206・始まり 262144・全体 512000 を確かめる", {"c": SIG}),
        (1, 0, "本文 262144〜511999（249,856 バイト）", {"c": GRN, "dash": True}),
    ]
    return SEQFIG(lanes, msgs, "Range 要求による再開。最初の GET の本文を受け取っている途中で切れたら、つなぎ直して、書き終えたオフセットから先だけを Range 要求で頼む。サーバは 206 と Content-Range で、送る範囲と全体の大きさを示す。", w=700, dy=32)
F["e22_range"] = _f22_range()

def _f22_ble():
    lanes = [("スマートフォン", PUR), ("機器", SIG)]
    msgs = [
        (0, 1, "開始: 版 1.4・512,000 バイト", {"c": PUR, "sub": "コントロールポイントに書く"}),
        (0, 1, "チャンク 0（Write Command × 17）", {"c": PUR, "dash": True}),
        (0, 1, "チャンク 1（Write Command × 17）", {"c": PUR, "dash": True}),
        ("note", 0, "確認の無いチャンクが 2 個 → 待つ", {"c": PUR}),
        ("note", 1, "チャンク 0 をフラッシュに書く", {"c": SIG}),
        (1, 0, "通知: 書き終えたのは 1 個", {"c": SIG}),
        (0, 1, "チャンク 2（Write Command × 17）", {"c": PUR, "dash": True}),
        (1, 0, "通知: 書き終えたのは 2 個", {"c": SIG}),
        ("gap", "（チャンク 64 を送っている途中で切断）", {"lane": 0}),
        (0, 1, "どこまで書いた？", {"c": PUR, "sub": "接続し直して、コントロールポイントで聞く"}),
        (1, 0, "64 個", {"c": SIG}),
        (0, 1, "チャンク 64（Write Command × 17）", {"c": PUR, "dash": True}),
    ]
    return SEQFIG(lanes, msgs, "BLE での運び方。スマートフォンは Write Command でチャンクを送り、機器はチャンクを書き終えるたびに、書き終えた数を通知で返す。スマートフォンは、確認の無いチャンクを決めた数（図では 2 個）までしか送らない。切れたら、接続し直して書き終えた数を聞き、その続きから送る。", w=700, dy=30)
F["e22_ble"] = _f22_ble()

def _f22_retry():
    o = []
    n, tc, R = 125, 4096 * 8 / 20300.0, 10.0
    def En(q):
        s = 1 - q; sn = s ** n
        return tc * (1 - sn) / ((1 - s) * sn) + (1 / sn - 1) * R
    def Er(q):
        s = 1 - q
        return n * (tc / s + (1 / s - 1) * R)
    p = Plot(110, 20, 560, 250, (0.2, 6.0), (100, 200000), ylog=True)
    o.append(T(36, 20 + 125, "終わるまでの時間の期待値", "middle", 10, MUT, rot=-90))
    o.append(p.axes(xl="1 チャンクの間に切れる確率 q [%]", xt=[1, 2, 3, 4, 5, 6], yt=[100, 1000, 10000, 100000],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: {100: "100 s", 1000: "1000 s", 10000: "1 万 s", 100000: "10 万 s"}[v]))
    for v, lab in ((3600, "1 時間"), (86400, "1 日")):
        o.append(p.line([(0.2, v), (6.0, v)], c=FNT, lw=1, dash="3 4"))
        o.append(T(p.X(0.25), p.Y(v) - 4, lab, "start", 9.5, MUT))
    o.append(p.line([(0.2, n * tc), (6.0, n * tc)], c=MUT, lw=1, dash="5 3"))
    o.append(T(p.X(2.0), p.Y(n * tc) + 13, "切れないとき 201.8 s", "middle", 9.5, MUT))
    qs = [0.2 + 0.05 * k for k in range(0, 117)]
    o.append(p.line([(q, En(q / 100)) for q in qs], c=ALI, lw=2.2))
    o.append(p.line([(q, Er(q / 100)) for q in qs], c=GRN, lw=2.2))
    o.append(T(p.X(3.3), p.Y(En(0.033)) - 10, "最初からやり直す", "end", 10.5, ALI, True))
    o.append(T(p.X(4.4), p.Y(Er(0.044)) - 10, "続きから運ぶ", "end", 10.5, GRN, True))
    for q, v, c, lab, dx, dy, a in ((1, Er(0.01), GRN, "216 s", 0, 16, "middle"), (1, En(0.01), ALI, "431 s", -8, -6, "end"),
                                    (5, Er(0.05), GRN, "278 s", 0, -9, "middle"), (5, En(0.05), ALI, "25,705 s（7.1 時間）", -8, -2, "end")):
        o.append(D(p.X(q), p.Y(v), c, 4))
        o.append(T(p.X(q) + dx, p.Y(v) + dy, lab, a, 9.5, c, True))
    return SVG(700, 318, o, "500 KB を 20.3 kbps の BLE で運ぶとき（t_c = 1.614 s、つなぎ直しに 10 s）の、終わるまでの時間の期待値（縦軸は対数目盛）。続きから運べば、切れやすくなっても少し延びるだけだが、最初からやり直すと、一度も切れずに最後まで届く確率 s^125 が小さくなるにつれて急に延びる。")
F["e22_retry"] = _f22_retry()

# ---- 3 節: フラッシュに書く ----
def _f22_units():
    o = []
    o.append(T(20, 20, "書き込みは 1 を 0 にするだけ", "start", 11.5, INK, True))
    rows = [("消した状態", "1111 1111", "0xFF", MUT, None),
            ("0x5A を書く", "0101 1010", "0x5A", GRN, "1 を 0 にするだけなので書ける"),
            ("同じ所に 0x0F を書く", "0000 1010", "0x0A", ALI, "0x5A AND 0x0F になり、0x0F にはならない")]
    for i, (lab, bits, hx, c, note) in enumerate(rows):
        y = 40 + i * 46
        o.append(T(150, y + 18, lab, "end", 10.5, INK))
        o.append(RECT(160, y, 100, 28, 4, soft(c), c, 1.3))
        o.append(T(210, y + 19, bits, "middle", 11.5, c, True, True))
        o.append(T(270, y + 19, hx, "start", 10.5, c, True, True))
        if note:
            o.append(T(160, y + 42, note, "start", 9.5, c))
    o.append(T(20, 200, "書き直すには、消去単位ごと消して（全部を 0xFF に戻して）から書く。", "start", 10.5, INK))
    # 右: 消去単位と書き込み単位
    x0, y0, cw, ch = 440, 44, 14, 14
    o.append(T(x0, 20, "消去単位 4 KB（この例）", "start", 11.5, INK, True))
    cols, nrows = 16, 7
    o.append(RECT(x0 - 4, y0 - 4, cols * cw + 8, nrows * ch + 8, 4, SSOFT, SIG, 1.3))
    for r in range(nrows):
        for k in range(cols):
            hl = (r == 1 and k == 3)
            o.append(RECT(x0 + k * cw, y0 + r * ch, cw - 2, ch - 2, 1, GOSOFT if hl else PAN, GLD if hl else LIN, 1.2 if hl else 0.8))
    o.append(T(x0 + cols * cw / 2, y0 + nrows * ch + 20, "書き込み単位 8 バイト × 512（一部を描いた）", "middle", 9.5, MUT))
    o.append(ARR(x0 + 3 * cw + 6, y0 + ch + 30, x0 + 3 * cw + 6, y0 + 2 * ch - 1, c=GLD, lw=1.3, head=6))
    o.append(T(x0 + 3 * cw + 14, y0 + ch + 42, "1 回に書く単位", "start", 9.5, GLD, True, halo=True))
    o.append(T(x0, y0 + nrows * ch + 40, "消すのは、このまとまり全部を一度に。", "start", 9.5, MUT))
    return SVG(700, 212, o, "フラッシュの書き込みと消去。書き込みはビットを 1 から 0 にするだけなので、書いてある所にもう一度書くと、結果は 2 つの値のビットごとの AND になる。0 を 1 に戻すには、消去単位ごと消すしかない。")
F["e22_units"] = _f22_units()

def _f22_stall():
    o = []
    x0, x1 = 150, 680
    X = lambda t: x0 + (x1 - x0) * t / 60.0
    panels = [("(a) 悪い例: プログラムを実行しているバンクを消す", False), ("(b) 良い例: 別のバンク・外付けのフラッシュを消す（または RAM から実行）", True)]
    y = 22
    for title, good in panels:
        o.append(T(14, y, title, "start", 11, GRN if good else ALI, True))
        lanes = [("CPU", 0), ("フラッシュ", 1), ("UART の受信", 2)]
        for name, k in lanes:
            yy = y + 12 + k * 30
            o.append(T(x0 - 10, yy + 16, name, "end", 10, MUT))
            o.append(RECT(x0, yy, x1 - x0, 22, 3, SCR, LIN, 1))
        yc, yf, yu = y + 12, y + 42, y + 72
        if good:
            o.append(RECT(X(0), yc, X(60) - X(0), 22, 3, GSOFT, GRN, 1.1))
            o.append(T(X(30), yc + 15, "動き続ける（割り込みも処理する）", "middle", 9.5, GRN, True))
        else:
            o.append(RECT(X(0), yc, X(10) - X(0), 22, 3, GSOFT, GRN, 1.1))
            o.append(RECT(X(10), yc, X(40) - X(10), 22, 3, ASOFT, ALI, 1.1))
            o.append(RECT(X(40), yc, X(60) - X(40), 22, 3, GSOFT, GRN, 1.1))
            o.append(T(X(25), yc + 15, "止まる（命令を読めない）", "middle", 9.5, ALI, True))
        o.append(RECT(X(10), yf, X(40) - X(10), 22, 3, GOSOFT, GLD, 1.1))
        o.append(T(X(25), yf + 15, "消去 30 ms" + ("（別のバンク）" if good else ""), "middle", 9.5, GLD, True))
        for i in range(30):
            t = 1 + i * 2.0
            bad = (not good) and 10 <= t <= 40
            o.append(W(X(t), yu + 4, X(t), yu + 18, c=ALI if bad else GRN, lw=1.6))
        if not good:
            o.append(T(X(25), yu + 38, "取り出せないバイトがたまり、オーバーランになる", "middle", 9.5, ALI, True))
        y += 136 if not good else 110
    for t in (0, 10, 20, 30, 40, 50, 60):
        o.append(T(X(t), y + 2, "%d ms" % t, "middle", 9, MUT))
    o.append(T(14, y + 22, "UART の縦線は届いたバイト（実際は 86.8 µs ごとで、30 ms に約 345 バイト。図では間引いた）。", "start", 9.5, MUT))
    return SVG(700, y + 32, o, "同じフラッシュのバンクからプログラムを実行していると、消している間は命令を読めずに CPU が止まり、割り込みも処理されない。115200 bps の UART では 30 ms の間に約 345 バイトが届き、受信の回路があふれる。消すのを別のバンクや外付けのフラッシュにすれば、CPU は止まらない。")
F["e22_stall"] = _f22_stall()

# ---- 4 節: 受信と書き込みを重ねる ----
def _f22_pipe():
    o = []
    tr, tw = 37.86, 50.48
    x0, x1 = 110, 670
    X = lambda t: x0 + (x1 - x0) * t / 560.0
    def lane(y, name, c):
        o.append(T(x0 - 10, y + 15, name, "end", 10, c, True))
        o.append(RECT(x0, y, x1 - x0, 22, 3, SCR, LIN, 1))
    def bar(y, a, b, lab, c):
        o.append(RECT(X(a), y, X(b) - X(a), 22, 3, soft(c), c, 1.2))
        o.append(T((X(a) + X(b)) / 2, y + 15, lab, "middle", 10, c, True))
    # (a) バッファ 1 つ
    y = 20
    o.append(T(14, y, "(a) バッファ 1 つ: 1 チャンクごとに t_r + t_w = 88.3 ms", "start", 11, ALI, True))
    lane(y + 10, "受信", SIG); lane(y + 38, "書き込み", GLD)
    t = 0.0
    for k in range(1, 7):
        if X(t + tr + tw) > x1 + 0.5:
            break
        bar(y + 10, t, t + tr, str(k), SIG); bar(y + 38, t + tr, t + tr + tw, str(k), GLD)
        t += tr + tw
    o.append(T(X(530), y + 25, "…", "middle", 11, MUT))
    # (b) ダブルバッファ
    y = 104
    o.append(T(14, y, "(b) ダブルバッファ: 書き込みが休みなく続き、1 チャンクごとに max(t_r, t_w) = t_w = 50.5 ms", "start", 11, GRN, True))
    lane(y + 10, "受信", SIG); lane(y + 38, "書き込み", GLD)
    A = {0: 0.0}; B = {0: 0.0, -1: 0.0}
    for k in range(1, 11):
        A[k] = max(A[k - 1], B[k - 2]) + tr
        B[k] = max(A[k], B[k - 1]) + tw
        if X(B[k]) > x1 + 0.5:
            break
        st = A[k] - tr
        if st > A[k - 1] + 0.5:
            o.append(RECT(X(A[k - 1]), y + 10, X(st) - X(A[k - 1]), 22, 0, ASOFT, "none", 0))
        bar(y + 10, st, A[k], str(k), SIG)
        bar(y + 38, B[k] - tw, B[k], str(k), GLD)
    # 目盛
    ya = y + 66
    for t in range(0, 561, 80):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 15, "%d ms" % t, "middle", 9, MUT))
    o.append(T(14, ya + 34, "薄い赤: 2 つのバッファがどちらも書き込み待ちで、受信を止めている時間", "start", 9.5, ALI))
    o.append(T(14, ya + 56, "例: 受信 865.4 kbps（t_r = 37.9 ms）、書き込み 649.1 kbps（t_w = 50.5 ms）、チャンク 4096 バイト。", "start", 10, INK))
    o.append(T(14, ya + 74, "125 チャンクで (a) は 11.0 s、(b) は B_125 = t_r + t_w + 124 t_w ≈ 6.35 s。速さは min(v_r, v_w) で決まる。", "start", 10, INK))
    return SVG(700, ya + 84, o, "受信と書き込みの時間軸（数字はチャンクの番号）。バッファが 1 つなら、受信と書き込みが交互になり、どちらかがいつも休む。ダブルバッファにすると、一方に受信しながら他方を書けるので、遅いほうの段（この例では書き込み）が休みなく動く。")
F["e22_pipe"] = _f22_pipe()

def _f22_bp():
    o = []
    o.append(BOX(14, 30, 120, 60, "送り手", "サーバ・スマートフォン", PUR, PSOFT, PUR, sz=11.5, ssz=9.5))
    o.append(ARR(136, 60, 196, 60, c=MUT, lw=1.8))
    o.append(T(166, 52, "受信", "middle", 9.5, MUT))
    o.append(RECT(200, 24, 230, 72, 6, SCR, SIG, 1.3))
    o.append(T(315, 40, "機器の RAM", "middle", 10, SIG, True))
    for i in range(2):
        o.append(RECT(212 + i * 108, 50, 98, 36, 4, GOSOFT, GLD, 1.3))
        o.append(T(261 + i * 108, 66, "バッファ %d" % (i + 1), "middle", 10, GLD, True))
        o.append(T(261 + i * 108, 80, "書き込み待ち", "middle", 9, GLD))
    o.append(ARR(432, 60, 492, 60, c=GLD, lw=1.8))
    o.append(BOX(496, 30, 190, 60, "フラッシュ", "1 チャンクに 50.5 ms（例）", GLD, GOSOFT, GLD, sz=11.5, ssz=9.5))
    o.append(W(315, 98, 315, 114, 74, 114, c=ALI, lw=1.6, dash="5 3"))
    o.append(ARR(74, 114, 74, 93, c=ALI, lw=1.6, head=6))
    o.append(T(200, 130, "空きが無い → 送り手を止める", "middle", 10.5, ALI, True))
    boxes = [("TCP（HTTP）", "ソケットから読まない。受信ウィンドウが 0 になり、サーバが止まる（10 章 3 節）", GRN),
             ("BLE", "書き終えるまで確認を返さない。スマートフォンは決めた数より先へ送らない（2 節）", PUR),
             ("CoAP", "バッファが空いてから次のブロックを頼む（1 往復に 1 ブロック）", TEA)]
    for i, (t, s, c) in enumerate(boxes):
        o.append(BOX(14 + i * 226, 148, 216, 76, t, s, c, soft(c), c, sz=11, ssz=9.5))
    return SVG(700, 234, o, "書くのが受信より遅いと、やがて 2 つのバッファがどちらも書き込み待ちになる。それ以上届いても置く場所が無いので、送り手を止める。止め方は経路ごとに違うが、どれも受け手の空きを送り手に伝える仕組みである。")
F["e22_bp"] = _f22_bp()

# ---- 5 節: 確かめる ----
def _f22_checks():
    o = []
    cols = ["大きさ", "CRC", "ハッシュ", "署名", "版"]
    rows = [("通信の途中でビットが化けた", "xoOxx"),
            ("フラッシュへの書き込みに失敗した", "xoOxx"),
            ("再開の位置を誤った（重複・抜け）", "xoOxx"),
            ("別のファイルを受け取った", "toOxx"),
            ("イメージとマニフェストを作り替えられた", "xxxOx"),
            ("正しく署名された古い版を入れられた", "xxxxO")]
    xl, cw, y0, rh = 300, 76, 26, 28
    for j, c in enumerate(cols):
        o.append(T(xl + j * cw + cw / 2, y0 - 6, c, "middle", 10.5, INK, True))
    for i, (lab, marks) in enumerate(rows):
        y = y0 + i * rh
        o.append(RECT(14, y, xl + len(cols) * cw - 14, rh - 2, 3, PAN if i % 2 else SCR, LIN, 0.8))
        o.append(T(xl - 10, y + 18, lab, "end", 10, INK))
        for j, m in enumerate(marks):
            cx = xl + j * cw + cw / 2
            if m == "O":
                o.append(T(cx, y + 19, "●", "middle", 13, GRN, True))
            elif m == "o":
                o.append(T(cx, y + 19, "○", "middle", 13, GRN))
            elif m == "t":
                o.append(T(cx, y + 19, "△", "middle", 12, GLD, True))
            else:
                o.append(T(cx, y + 19, "×", "middle", 11, FNT))
    yb = y0 + len(rows) * rh + 18
    o.append(T(14, yb, "●: それを受け持つ確認　○: 見つかる　△: 大きさが違えば見つかる　×: 見つからない", "start", 10, MUT))
    o.append(T(14, yb + 17, "CRC とハッシュは、マニフェストに書かれた値と比べる。マニフェストが本物であることは、署名で確かめる。", "start", 10, MUT))
    return SVG(700, yb + 28, o, "起こりうることと、それを見つける確認。偶然の誤りは CRC でもハッシュでも見つかるが、わざと作り替えたものは署名でしか見つからない。正しく署名された古い版は、版の確認（ロールバック防止）でしか見つからない。")
F["e22_checks"] = _f22_checks()

def _f22_hash():
    o = []
    o.append(T(14, 20, "(a) ふだん: 受け取ったバイトを、ハッシュの計算とバッファの両方に渡す", "start", 11, INK, True))
    o.append(BOX(14, 34, 110, 44, "ネットワーク", None, PUR, PSOFT, PUR, sz=11))
    o.append(ARR(126, 56, 166, 56, c=MUT, lw=1.6))
    o.append(BOX(170, 34, 110, 44, "dbuf_put", "受け取った分", SIG, SSOFT, SIG, sz=11, ssz=9, mono=True))
    o.append(ARR(282, 50, 352, 40, c=TEA, lw=1.6))
    o.append(ARR(282, 64, 352, 78, c=GLD, lw=1.6))
    o.append(BOX(356, 24, 170, 32, "psa_hash_update", None, TEA, TSOFT, TEA, sz=10.5, mono=True))
    o.append(BOX(356, 64, 170, 32, "バッファ → フラッシュ", None, GLD, GOSOFT, GLD, sz=10.5))
    o.append(T(536, 44, "途中の状態は RAM にある", "start", 9.5, TEA))
    o.append(T(536, 84, "チャンク 0〜m−1 を書いた", "start", 9.5, GLD))
    y = 124
    o.append(T(14, y, "(b) 再開のとき: RAM の途中の状態は失われているので、書き終えた所までをフラッシュから読み直す", "start", 11, INK, True))
    o.append(BOX(14, y + 14, 200, 44, "フラッシュの 0〜off−1", "off = m × 4096", GLD, GOSOFT, GLD, sz=10.5, ssz=9))
    o.append(ARR(216, y + 36, 256, y + 36, c=MUT, lw=1.6))
    o.append(BOX(260, y + 14, 170, 44, "hash_rebuild", "psa_hash_update に入れ直す", TEA, TSOFT, TEA, sz=10.5, ssz=9, mono=True))
    o.append(ARR(432, y + 36, 472, y + 36, c=MUT, lw=1.6))
    o.append(BOX(476, y + 14, 210, 44, "続き（off から）を (a) で", "約 0.5 s（500 KB・1 MB/s）", SIG, SSOFT, SIG, sz=10.5, ssz=9))
    y = 210
    o.append(BOX(14, y, 220, 44, "psa_hash_verify", "最後のチャンクの後で", TEA, TSOFT, TEA, sz=10.5, ssz=9, mono=True))
    o.append(DARR(236, y + 22, 300, y + 22, c=MUT, lw=1.4))
    o.append(T(268, y + 14, "比べる", "middle", 9.5, MUT))
    o.append(BOX(302, y, 230, 44, "マニフェストのハッシュ", "署名で守られている", GRN, GSOFT, GRN, sz=10.5, ssz=9))
    o.append(T(546, y + 18, "一致 → 6 節へ", "start", 10, GRN, True))
    o.append(T(546, y + 36, "不一致 → 捨てる", "start", 10, ALI, True))
    return SVG(700, y + 54, o, "受信しながらハッシュを計算する流れ。ふだんは受け取ったバイトをそのままハッシュの計算に入れる。電源が切れて再開するときは、書き終えた先頭の部分をフラッシュから読み直して計算を作り直し、続きを受け取る。最後に、署名で守られたマニフェストのハッシュと比べる。")
F["e22_hash"] = _f22_hash()

# ---- 6 節: 切り替えと確定 ----
def _f22_slotpair(o, x, y, w, a, b, ca, cb, la, lb):
    o.append(RECT(x, y, w, 26, 3, soft(ca), ca, 1.2))
    o.append(T(x + w / 2, y + 17, a, "middle", 9.5, ca, True))
    o.append(RECT(x, y + 30, w, 26, 3, soft(cb), cb, 1.2))
    o.append(T(x + w / 2, y + 47, b, "middle", 9.5, cb, True))
    o.append(T(x - 4, y + 17, la, "end", 9, MUT))
    o.append(T(x - 4, y + 47, lb, "end", 9, MUT))

def _f22_schemes():
    o = []
    pw = 228
    specs = [("(a) A/B", ("版 1（動作中）", "版 2（新しい）", SIG, GLD), ("版 1（元）", "版 2（動作中）", MUT, SIG), "起動するスロットを替える",
              ["元に戻せる: ○（そのまま残る）", "切り替え: 再起動だけ", "実行: どちらのスロットでも"]),
             ("(b) スワップ", ("版 1（動作中）", "版 2（新しい）", SIG, GLD), ("版 2（動作中）", "版 1（元）", SIG, MUT), "消去単位ごとに入れ替える",
              ["元に戻せる: ○（入れ替え直す）", "切り替え: 長い（例 約 19 s）", "実行: いつも 1 つ目"]),
             ("(c) 上書き", ("版 1（動作中）", "版 2（新しい）", SIG, GLD), ("版 2（動作中）", "版 2（写し元）", SIG, MUT), "1 つ目に写す",
              ["元に戻せる: ×（版 1 は消える）", "切り替え: 例 約 6 s", "実行: いつも 1 つ目"])]
    for i, (title, before, after, how, props) in enumerate(specs):
        x = 14 + i * (pw + 4)
        o.append(T(x + 6, 22, title, "start", 11.5, INK, True))
        bx, sw = x + 22, 80
        o.append(T(bx + sw / 2, 44, "前", "middle", 9.5, MUT))
        o.append(T(bx + sw + 28 + sw / 2, 44, "後", "middle", 9.5, MUT))
        _f22_slotpair(o, bx, 52, sw, before[0], before[1], before[2], before[3], "1", "2")
        _f22_slotpair(o, bx + sw + 28, 52, sw, after[0], after[1], after[2], after[3], "", "")
        o.append(ARR(bx + sw + 4, 80, bx + sw + 24, 80, c=MUT, lw=1.5))
        o.append(T(x + pw / 2, 132, how, "middle", 9.5, GLD, True))
        for k, pr in enumerate(props):
            c = ALI if "×" in pr else INK
            o.append(T(x + 10, 156 + k * 17, pr, "start", 9.5, c))
    return SVG(700, 210, o, "スロットの 3 つの使い方（1・2 はスロットの番号）。(a) は起動するスロットを替えるだけで切り替わる。(b) はブートローダが 2 つのスロットの中身を入れ替え、(c) は新しいイメージを 1 つ目に写す。元のイメージに戻せるのは (a) と (b) である。時間は 3 節の例の値による目安。")
F["e22_schemes"] = _f22_schemes()

def _f22_bootfsm():
    o = []
    W_, H_ = 150, 46
    S = {"s1": (100, 54), "s2": (350, 54), "s3": (590, 54), "s4": (590, 176), "s5": (350, 176)}
    o.append(STATE(S["s1"][0], S["s1"][1], W_, H_, "版 1 で動作", SIG, "B: 印なし"))
    o.append(STATE(S["s2"][0], S["s2"][1], W_, H_, "取り込み・確認", SIG, "B に書いている"))
    o.append(STATE(S["s3"][0], S["s3"][1], W_, H_, "PENDING を書いた", GLD, "B: PENDING"))
    o.append(STATE(S["s4"][0], S["s4"][1], W_, H_, "版 2 を試しに起動", GLD, "B: PENDING・TRIED"))
    o.append(STATE(S["s5"][0], S["s5"][1], W_, H_, "版 2 で動作（確定）", GRN, "B: PENDING・TRIED・OK"))
    o.append(EDGE(176, 54, 274, 54, None, c=MUT))
    o.append(T(225, 46, "新しい版を知る", "middle", 9.5, MUT))
    o.append(EDGE(426, 54, 514, 54, None, c=MUT))
    o.append(T(470, 46, "一致・署名 OK", "middle", 9.5, MUT))
    o.append(EDGE(590, 78, 590, 152, None, c=GLD))
    o.append(T(582, 110, "再起動: ブートローダが", "end", 9.5, GLD))
    o.append(T(582, 124, "TRIED を書いてから起動", "end", 9.5, GLD))
    o.append(EDGE(514, 176, 426, 176, None, c=GRN))
    o.append(T(470, 168, "自己診断に通る", "middle", 9.5, GRN, True))
    o.append(T(470, 194, "OK を書く", "middle", 9.5, GRN))
    o.append(W(590, 200, 590, 246, 100, 246, 100, 84, c=ALI, lw=1.6, dash="5 3"))
    o.append(ARR(100, 90, 100, 79, c=ALI, lw=1.6, head=6))
    o.append(T(345, 262, "固まる（ウォッチドッグ）・自己診断に通らない・試しの途中で電源断 → OK が無いまま再起動", "middle", 9.5, ALI, True))
    o.append(T(345, 277, "→ TRIED があるので試しは繰り返さず、確定済みの版 1 を起動する（ロールバック）", "middle", 9.5, ALI))
    o.append(T(112, 112, "取り込みの途中で", "start", 9.5, MUT))
    o.append(T(112, 126, "電源が切れても、", "start", 9.5, MUT))
    o.append(T(112, 140, "版 1 のまま（2 節で再開）", "start", 9.5, MUT))
    return SVG(700, 290, o, "試しの起動と確定の流れ（スロット B に新しい版 2 を書く場合）。各状態の下は、スロット B に書かれている印。印は消した状態から 1 回だけ書くので、どこで電源が切れても、ブートローダは印から次に何を起動するかを決められる。")
F["e22_bootfsm"] = _f22_bootfsm()

# ---- 7 節: 転送時間 ----
def _f22_ttime():
    o = []
    rows = [("BLE（LE 2M・DLE・ATT_MTU 247）", 6.31, "書き込み"),
            ("Wi-Fi・LAN のサーバ（RTT 20 ms）", 6.31, "書き込み"),
            ("Wi-Fi・クラウドのサーバ（RTT 100 ms）", 8.77, "ウィンドウ"),
            ("LTE-M・TCP（RTT 200 ms）", 17.5, "ウィンドウ"),
            ("LTE-M・CoAP のブロック転送", 113.7, "往復"),
            ("BLE（LE 1M・DLE なし）", 201.8, "回線"),
            ("LoRaWAN（SF7・1 回 242 バイト）", 84559.0, "デューティサイクル"),
            ("LoRaWAN（SF12・1 回 51 バイト）", 2804646.0, "デューティサイクル")]
    cc = {"書き込み": GLD, "ウィンドウ": GRN, "往復": TEA, "回線": SIG, "デューティサイクル": ALI}
    p = Plot(250, 16, 420, len(rows) * 26, (1, 1e7), (0, len(rows)), xlog=True)
    for v in (1, 10, 100, 1000, 1e4, 1e5, 1e6, 1e7):
        o.append(W(p.X(v), 14, p.X(v), 16 + len(rows) * 26, c=GRD, lw=1))
    for v, lab in ((60, "1 分"), (3600, "1 時間"), (86400, "1 日")):
        o.append(W(p.X(v), 14, p.X(v), 16 + len(rows) * 26, c=FNT, lw=1, dash="3 3"))
        o.append(T(p.X(v), 16 + len(rows) * 26 + 30, lab, "middle", 9, MUT))
    for i, (name, t, lim) in enumerate(rows):
        y = 16 + i * 26
        c = cc[lim]
        o.append(T(240, y + 16, name, "end", 10, INK))
        o.append(RECT(p.X(1), y + 4, p.X(t) - p.X(1), 16, 2, soft(c), c, 1.1))
        if t < 60:
            lab = "%.1f s" % t
        elif t < 3600:
            lab = "%.0f s" % t
        elif t < 86400 * 2:
            lab = "%.1f 時間" % (t / 3600)
        else:
            lab = "%.1f 日" % (t / 86400)
        tx = p.X(t) + 6
        if tx + tw(lab, 9.5) > 696:
            o.append(T(p.X(t) - 6, y + 16, lab, "end", 9.5, c, True, halo=True))
        else:
            o.append(T(tx, y + 16, lab, "start", 9.5, c, True))
    ya = 16 + len(rows) * 26
    for v, lab in ((1, "1 s"), (10, "10 s"), (100, "100 s"), (1000, "1000 s"), (1e4, "1 万 s"), (1e5, "10 万 s"), (1e6, "100 万 s"), (1e7, "1000 万 s")):
        o.append(T(p.X(v), ya + 14, lab, "middle", 9, MUT))
    o.append(LEGEND(20, ya + 54, [(GLD, "書く速さで決まる"), (GRN, "受信ウィンドウ"), (TEA, "1 往復に 1 ブロック"), (SIG, "回線の速さ"), (ALI, "デューティサイクル")], sz=9.5, gap=12))
    return SVG(700, ya + 64, o, "500 KB のイメージを取り込む時間（横軸は対数目盛。接続・確認・切り替えの時間を含まない）。棒の色は、取り込みの速さを決めている段。速い経路ではフラッシュに書く速さが上限になり、LoRaWAN では 1 日〜1 か月かかる。")
F["e22_ttime"] = _f22_ttime()

def _f22_lora():
    o = []
    rows = [("SF7・1 回 242 バイト", 0.3996, 39.96, 120, [0, 20, 40, 60, 80, 100, 120], "2116 回 × 40.0 s ≈ 23.5 時間"),
            ("SF12・1 回 51 バイト", 2.7935, 279.35, 900, [0, 150, 300, 450, 600, 750, 900], "10,040 回 × 279.3 s ≈ 32.5 日")]
    y = 24
    for name, toa, per, span, ticks, tot in rows:
        x0, x1 = 150, 680
        X = lambda t: x0 + (x1 - x0) * t / span
        o.append(T(14, y + 16, name, "start", 10.5, INK, True))
        o.append(RECT(x0, y, x1 - x0, 24, 3, SCR, LIN, 1))
        t = 0.0
        while t < span:
            o.append(RECT(X(t), y, max(X(t + toa) - X(t), 2.5), 24, 1, ALI, ALI, 1))
            t += per
        o.append(DIM(X(0), y + 34, X(per), y + 34, None, c=MUT))
        o.append(T((X(0) + X(per)) / 2, y + 48, "%.1f s（空中時間 %.0f ms の 100 倍）" % (per, toa * 1000), "middle", 9.5, MUT))
        for tk in ticks:
            o.append(T(X(tk), y - 5, "%d s" % tk, "middle", 9, MUT))
        o.append(T(x1, y + 66, "500 KB には " + tot, "end", 10, ALI, True))
        y += 104
    o.append(T(14, y - 14, "赤: 送っている時間。デューティサイクル 1 % では、送った後、空中時間の 99 倍の時間は送れない。", "start", 10, MUT))
    return SVG(700, y - 4, o, "LoRaWAN でイメージを運ぶときの送信の間隔（欧州の 868 MHz 帯の、LoRaWAN の機器が必ず使えるチャネルの範囲のデューティサイクル 1 %。1 回に載せるデータは EU868 の上限）。送っている時間はわずかだが、休む時間が長く、500 KB を運ぶのに 1 日〜1 か月かかる。")
F["e22_lora"] = _f22_lora()
