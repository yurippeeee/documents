# -*- coding: utf-8 -*-
# 12 章 TLS の図

def _f12_dev(x, y, w=58, h=28, name="機器", c=SIG, sz=10.5):
    return RECT(x, y, w, h, 6, soft(c), c, 1.3) + T(x + w / 2, y + h / 2 + 4, name, "middle", sz, c, True)

def _f12_x(x, y, r=6, c=ALI, lw=2.2):
    return W(x - r, y - r, x + r, y + r, c=c, lw=lw) + W(x - r, y + r, x + r, y - r, c=c, lw=lw)

# ---- 1 節: 3 つの攻撃と TLS ----
def _f12_threats():
    o = []
    cols = ["盗聴（読む）", "改ざん（書き換える）", "なりすまし（ふりをする）"]
    x0, cw, gap = 96, 192, 10
    o.append(T(48, 92, "TLS なし", "middle", 11.5, ALI, True))
    o.append(T(48, 212, "TLS あり", "middle", 11.5, GRN, True))
    for j, name in enumerate(cols):
        x = x0 + j * (cw + gap)
        o.append(T(x + cw / 2, 20, name, "middle", 11.5, INK, True))
        for i in range(2):
            y = 32 + i * 120
            o.append(RECT(x, y, cw, 108, 8, PAN, LIN, 1.1))
            dx, sx, ly = x + 8, x + cw - 56, y + 30
            o.append(_f12_dev(dx, ly - 14, w=48))
            if j == 2:
                o.append(RECT(sx, ly - 14, 48, 28, 6, "none", FNT, 1.2, dash="4 3"))
                o.append(T(sx + 24, ly + 4, "本物", "middle", 10, FNT))
            else:
                o.append(_f12_dev(sx, ly - 14, w=48, name="サーバ", c=GRN))
            ax = x + cw / 2
            if j == 0:
                o.append(ARR(dx + 50, ly, sx - 2, ly, c=INK, lw=1.5))
                lab = "pass=1234" if i == 0 else "9f 3a c1 …"
                o.append(T(ax, ly - 6, lab, "middle", 9.5, INK if i == 0 else TEA, True, True))
                o.append(RECT(ax - 26, ly + 24, 52, 20, 5, ASOFT, ALI, 1.1))
                o.append(T(ax, ly + 38, "途中の者", "middle", 9.5, ALI, True))
                o.append(W(ax, ly + 24, ax, ly + 4, c=ALI, lw=1.2, dash="3 2"))
                if i == 1:
                    o.append(T(ax + 32, ly + 38, "?", "start", 12, ALI, True))
                cap = "中身を読まれる" if i == 0 else "読めない（機密性）"
            elif j == 1:
                o.append(RECT(ax - 24, ly - 10, 48, 20, 5, ASOFT, ALI, 1.1))
                o.append(T(ax, ly + 4, "途中の者", "middle", 9, ALI, True))
                o.append(ARR(sx - 2, ly, ax + 26, ly, c=INK, lw=1.5))
                o.append(ARR(ax - 26, ly, dx + 52, ly, c=ALI, lw=1.5))
                o.append(T((ax + sx) / 2 + 6, ly + 28, "「閉めて」", "middle", 9.5, INK))
                o.append(T((ax + dx + 48) / 2 - 6, ly + 28, "「開けて」", "middle", 9.5, ALI, True))
                if i == 1:
                    o.append(_f12_x(dx + 60, ly - 12, 5))
                cap = "命令を書き換えられる" if i == 0 else "タグが合わず捨てる（完全性）"
            else:
                o.append(RECT(ax - 26, ly + 22, 52, 22, 5, ASOFT, ALI, 1.1))
                o.append(T(ax, ly + 37, "偽のサーバ", "middle", 9, ALI, True))
                o.append(ARR(dx + 48, ly + 6, ax - 28, ly + 28, c=ALI if i == 0 else INK, lw=1.5))
                if i == 1:
                    o.append(_f12_x(ax - 46, ly + 20, 5))
                cap = "偽のサーバにつながる" if i == 0 else "証明書が合わず接続しない（認証）"
            o.append(T(x + cw / 2, y + 98, cap, "middle", 10, ALI if i == 0 else GRN, True))
    o.append(T(96, 272, "なりすましは、DNS の答え（08 章 4 節）や ARP の応答（08 章 2 節）を偽って、機器を偽のサーバへ向けることで起きる。", "start", 9.5, MUT))
    return SVG(700, 284, o, "経路の途中にいる者ができる 3 つのこと（上）と、TLS を使ったときにどうなるか（下）。TLS は、暗号化（機密性）、改ざんの検出（完全性）、相手の確認（認証）の 3 つで、それぞれを防ぐ。")
F["e12_threats"] = _f12_threats()

# ---- 1 節: 守る範囲と守らないもの ----
def _f12_scope():
    o = []
    # 上: 端から端まで
    o.append(BOX(14, 20, 128, 104, None, None, SIG, SSOFT))
    o.append(T(78, 38, "機器", "middle", 11.5, SIG, True))
    o.append(BOX(24, 46, 108, 22, "アプリケーション", None, PUR, PAN, PUR, sz=9.5))
    o.append(BOX(24, 72, 108, 22, "TLS", None, TEA, PAN, TEA, sz=9.5))
    o.append(T(78, 114, "鍵はフラッシュに", "middle", 9.5, ALI))
    o.append(BOX(558, 20, 128, 104, None, None, GRN, GSOFT))
    o.append(T(622, 38, "サーバ", "middle", 11.5, GRN, True))
    o.append(BOX(568, 46, 108, 22, "アプリケーション", None, PUR, PAN, PUR, sz=9.5))
    o.append(BOX(568, 72, 108, 22, "TLS", None, TEA, PAN, TEA, sz=9.5))
    o.append(T(622, 114, "中のデータ", "middle", 9.5, ALI))
    o.append(RECT(132, 74, 436, 18, 9, TSOFT, TEA, 1.4))
    o.append(T(350, 87, "TLS が守る区間（暗号化・改ざんの検出）", "middle", 10, TEA, True))
    for k, nm in enumerate(("AP", "ルータ", "ルータ", "ルータ")):
        x = 196 + k * 90
        o.append(BOX(x, 32, 54, 22, nm, None, GLD, GOSOFT, GLD, sz=9.5))
        o.append(W(x + 27, 54, x + 27, 74, c=GLD, lw=1.1, dash="3 2"))
    o.append(T(350, 24, "途中の機器は、TLS の中身を読めないまま中継する", "middle", 9.5, MUT))
    # 下: 1 つのパケットのどこが読めるか
    y = 150
    o.append(T(14, y - 4, "TLS のデータを運ぶ 1 つのパケット（例）", "start", 10.5, INK, True))
    fl = [("IP 20", 62, GLD), ("TCP 20", 62, GRN), ("TLS 5", 40, TEA), ("暗号化された中身", 168, TEA), ("タグ 16", 62, TEA)]
    xx = 14
    for nm, wpx, c in fl:
        fill = soft(c) if nm != "暗号化された中身" else TEA
        o.append(RECT(xx, y + 4, wpx, 30, 4, fill, c, 1.3))
        o.append(T(xx + wpx / 2, y + 23, nm, "middle", 9.5, PAN if nm == "暗号化された中身" else c, True))
        xx += wpx
    x_enc0 = 14 + 62 + 62 + 40
    o.append(DIM(14, y + 46, x_enc0, y + 46, None, c=ALI))
    o.append(T((14 + x_enc0) / 2, y + 62, "途中から読める: アドレス・ポート・長さ", "middle", 9.5, ALI, True))
    o.append(DIM(x_enc0, y + 46, xx, y + 46, None, c=GRN))
    o.append(T((x_enc0 + xx) / 2, y + 62, "読めない", "middle", 9.5, GRN, True))
    notes = [("TLS が守らないもの", INK, True),
             ("・送った時刻・大きさ・相手のアドレス", MUT, False),
             ("・DNS の問い合わせと SNI（3 節）", MUT, False),
             ("・両端の機器の中（鍵・データ）", MUT, False),
             ("・届くこと（捨てられたら気づくだけ）", MUT, False)]
    for k, (t, c, b) in enumerate(notes):
        o.append(T(458, y + 4 + k * 17, t, "start", 10 if b else 9.5, c, b))
    return SVG(700, y + 86, o, "TLS が守るのは、機器の TLS からサーバの TLS までの間を流れるバイトの中身である（上）。途中の AP やルータは中身を読めないまま中継する。パケットの IP・TCP のヘッダと TLS のヘッダは読めるので、誰がどこと、いつ、どれだけ通信したかは分かる（下）。")
F["e12_scope"] = _f12_scope()

# ---- 2 節: ハンドシェイクとレコードの 2 段 ----
def _f12_twostage():
    o = []
    y = 40
    o.append(ARR(14, y + 62, 690, y + 62, c=MUT, lw=1.2))
    o.append(T(690, y + 78, "時間", "end", 10, MUT))
    o.append(RECT(14, y, 110, 40, 6, GSOFT, GRN, 1.3))
    o.append(T(69, y + 17, "TCP の接続", "middle", 10.5, GRN, True))
    o.append(T(69, y + 32, "3 ウェイ（10 章）", "middle", 9, MUT))
    o.append(RECT(128, y, 200, 40, 6, TSOFT, TEA, 1.6))
    o.append(T(228, y + 17, "ハンドシェイク", "middle", 11, TEA, True))
    o.append(T(228, y + 32, "公開鍵の計算（重い）・最初だけ", "middle", 9.5, INK))
    for k in range(9):
        x = 340 + k * 30
        o.append(RECT(x, y + 8, 24, 24, 4, PAN, TEA, 1.2))
    o.append(T(470, y - 6, "レコード（共通鍵の AEAD。軽い・毎回）", "middle", 10, TEA, True))
    o.append(RECT(612, y, 76, 40, 6, MSOFT, MUT, 1.2))
    o.append(T(650, y + 17, "close_notify", "middle", 9.5, MUT, True, True))
    o.append(T(650, y + 32, "（アラート）", "middle", 9, MUT))
    o.append(CARR(260, y + 42, 360, y + 34, -0.35, c=TEA, lw=1.4))
    o.append(T(316, y + 104, "ハンドシェイクで作った共通鍵（セッション鍵）で、以後のレコードを守る", "middle", 10, TEA))
    o.append(T(228, y - 6, "鍵を作る・相手を確かめる", "middle", 10, TEA, True))
    o.append(T(14, y + 132, "1 回の重さ（代表値）: 公開鍵の計算は、マイコンのソフトウェアで数十 ms〜数百 ms。共通鍵の暗号は、短いレコードなら µs〜ms の桁。", "start", 9.5, MUT))
    return SVG(700, y + 144, o, "TLS の 2 段。TCP の接続ができたら、まずハンドシェイクで暗号の方式を決め、共通鍵を作り、サーバを確かめる。その後のデータは、共通鍵で守ったレコードに包んで送る。重い公開鍵の計算は最初の数回だけで済む。")
F["e12_twostage"] = _f12_twostage()

# ---- 2 節: レコードのバイト図（TLS 1.3 と 1.2） ----
def _f12_fields(x, y, fields, h=40):
    """欄を横に並べる。fields = [(名前, 幅 px, 色, 値), ...]。狭い欄の名前は下に出す。返り値 (svg, 右端)"""
    o = []
    for nm, wpx, c, val in fields:
        o.append(RECT(x, y, wpx, h, 4, soft(c), c, 1.3))
        if wpx >= tw(nm, 9.5) + 4:
            o.append(T(x + wpx / 2, y + 16, nm, "middle", 9.5, c, True))
            if val:
                o.append(T(x + wpx / 2, y + 32, val, "middle", 9, INK, False, True))
        else:
            o.append(T(x + wpx / 2, y + 26, val or "", "middle", 9, INK, False, True))
            o.append(W(x + wpx / 2, y + h, x + wpx / 2, y + h + 8, c=c, lw=1))
            o.append(T(x + wpx / 2, y + h + 19, nm, "middle", 9, c, True))
        x += wpx
    return "".join(o), x

def _f12_record():
    o = []
    u = 8.5
    x0 = 96
    hdr = lambda c, ln: [("種類", 34, c, "17"), ("版", 42, c, "03 03"), ("長さ", 42, c, ln)]
    # TLS 1.3
    y = 40
    o.append(T(14, y + 21, "TLS 1.3", "start", 12, TEA, True))
    o.append(T(14, y + 36, "AES-GCM など", "start", 9, MUT))
    s, xe = _f12_fields(x0, y, hdr(TEA, "00 25") + [("データ 20 バイト", 20 * u, PUR, "暗号化"), ("種類", 14, PUR, "17"), ("タグ 16 バイト", 16 * u, ALI, None)])
    o.append(s)
    o.append(DIM(x0, y - 8, x0 + 118, y - 8, None, c=TEA))
    o.append(T(x0 + 59, y - 13, "ヘッダ 5 バイト", "middle", 9.5, TEA, True))
    o.append(DIM(x0 + 118, y - 8, x0 + 118 + 20 * u + 14, y - 8, None, c=PUR))
    o.append(T(x0 + 118 + (20 * u + 14) / 2, y - 13, "暗号化される部分", "middle", 9.5, PUR, True))
    o.append(T(xe + 10, y + 18, "足すのは", "start", 10, INK))
    o.append(T(xe + 10, y + 34, "5 + 1 + 16 = 22", "start", 10.5, TEA, True))
    o.append(T(x0, y + 80, "ノンス = 通し番号 XOR 接続ごとの値（送らない）。追加のデータ = ヘッダの 5 バイト。外の種類はいつも 23（0x17）。", "start", 9.5, MUT))
    # TLS 1.2
    y = 160
    o.append(T(14, y + 21, "TLS 1.2", "start", 12, GLD, True))
    o.append(T(14, y + 36, "AES-GCM", "start", 9, MUT))
    s, xe = _f12_fields(x0, y, hdr(GLD, "00 2C") + [("ノンス 8", 8 * u, GLD, "送る"), ("データ 20 バイト", 20 * u, PUR, "暗号化"), ("タグ 16 バイト", 16 * u, ALI, None)])
    o.append(s)
    o.append(T(xe + 10, y + 18, "足すのは", "start", 10, INK))
    o.append(T(xe + 10, y + 34, "5 + 8 + 16 = 29", "start", 10.5, GLD, True))
    o.append(T(x0, y + 62, "ノンスの後半 8 バイトをレコードごとに送る。暗号化するのはデータだけで、種類はヘッダに見えたまま。", "start", 9.5, MUT))
    return SVG(700, y + 76, o, "20 バイトのデータを 1 つのレコードで送ったときのバイトの並び（ヘッダの 3 つの欄だけ横に拡大して描いた）。TLS 1.3 は 42 バイト（足すのは 22 バイト）、TLS 1.2 の AES-GCM は 49 バイト（足すのは 29 バイト）になる。長さの欄はヘッダの後ろのバイト数で、0x25 = 37、0x2C = 44。")
F["e12_record"] = _f12_record()

# ---- 2 節: 小さな書き込みを分けるか、まとめるか ----
def _f12_writes():
    o = []
    u = 0.9
    x0 = 120
    def seg(x, y, data, c_ok):
        parts = [("下の層 78", 78, MUT), ("TLS 5", 5, TEA), ("データ %d" % data, data, PUR), ("17", 17, TEA)]
        for nm, n, c in parts:
            o.append(RECT(x, y, n * u, 26, 3, soft(c), c, 1.1))
            if n * u >= tw(nm, 9) + 4:
                o.append(T(x + n * u / 2, y + 17, nm, "middle", 9, c, True))
            x += n * u
        return x
    y = 40
    o.append(T(14, y + 17, "悪い例", "start", 11.5, ALI, True))
    o.append(T(14, y + 32, "20 バイト × 5 回", "start", 9.5, MUT))
    x = x0
    for k in range(5):
        x = seg(x, y, 20, False)
    o.append(T(x0, y + 46, "線の上 600 バイト・効率 16.7 %（書き込み 1 回ごとにレコードとセグメントが 1 つずつ）", "start", 10, ALI, True))
    y = 112
    o.append(T(14, y + 17, "良い例", "start", 11.5, GRN, True))
    o.append(T(14, y + 32, "100 バイト × 1 回", "start", 9.5, MUT))
    x = seg(x0, y, 100, True)
    o.append(T(x0, y + 46, "線の上 200 バイト・効率 50 %", "start", 10, GRN, True))
    o.append(LEGEND(x0, y + 74, [(MUT, "TCP・IP・Ethernet（07 章 6 節の 78 バイト）"), (TEA, "TLS が足す 22 バイト"), (PUR, "データ")]))
    return SVG(700, y + 86, o, "同じ 100 バイトを、20 バイトずつ 5 回書く場合と、まとめて 1 回で書く場合（TLS 1.3、横の長さはバイト数に比例）。1 回の書き込みごとにレコードができ、小さなデータでは、そのたびに TLS の 22 バイトと下の層の 78 バイトが足される。")
F["e12_writes"] = _f12_writes()

# ---- 3 節: シーケンス図の部品（ラベルは送り手の外側に置く） ----
def _f12_heads(o, xc, xs, y=12, names=("機器（クライアント）", "サーバ"), cols=(SIG, GRN), w=128):
    for x, nm, c in ((xc, names[0], cols[0]), (xs, names[1], cols[1])):
        o.append(RECT(x - w / 2, y, w, 26, 6, soft(c), c, 1.3))
        o.append(T(x, y + 17, nm, "middle", 10.5, c, True))

def _f12_life(o, xc, xs, y0, y1, cols=(SIG, GRN)):
    o.append(W(xc, y0, xc, y1, c=cols[0], lw=1.1, dash="3 4"))
    o.append(W(xs, y0, xs, y1, c=cols[1], lw=1.1, dash="3 4"))

def _f12_flight(o, xc, xs, y, to_server, lines, c=INK, dy=28, sz=10, dash=False, lh=13):
    """送り手から受け手への斜めの矢印。ラベルは送り手の外側に、上から並べる。返り値は届いた時刻（y）"""
    x1, x2 = (xc, xs) if to_server else (xs, xc)
    o.append(ARR(x1, y, x2, y + dy, c=c, lw=1.5, head=6, dash="5 3" if dash else None))
    for k, ln in enumerate(lines):
        txt, col, b = ln if isinstance(ln, tuple) else (ln, c, False)
        if to_server:
            o.append(T(xc - 9, y + 4 + k * lh, txt, "end", sz, col, b))
        else:
            o.append(T(xs + 9, y + 4 + k * lh, txt, "start", sz, col, b))
    return y + dy

def _f12_calc(o, x, y0, y1, c=SIG):
    o.append(RECT(x - 4, y0, 8, y1 - y0, 2, soft(c), c, 1.2))

# ---- 3 節: TLS 1.3 のハンドシェイク ----
def _f12_hs13():
    o = []
    xc, xs = 300, 470
    _f12_heads(o, xc, xs)
    _f12_life(o, xc, xs, 38, 346)
    y = 52
    a = _f12_flight(o, xc, xs, y, True, [("SYN", MUT, False)], c=MUT, dy=22)
    b = _f12_flight(o, xc, xs, a + 4, False, [("SYN+ACK", MUT, False)], c=MUT, dy=22)
    _f12_calc(o, xc, b + 2, b + 18)
    y = b + 22
    c1 = _f12_flight(o, xc, xs, y, True, [("ACK と ClientHello", INK, True), ("暗号スイートの一覧・SNI", MUT, False), ("鍵交換の公開鍵", MUT, False)], dy=24)
    _f12_calc(o, xs, c1 + 2, c1 + 16, GRN)
    y = c1 + 20
    lines = [("ServerHello（鍵交換の公開鍵）", INK, True), ("{EncryptedExtensions}", TEA, False), ("{Certificate}", TEA, True),
             ("{CertificateVerify}", TEA, True), ("{Finished}", TEA, False)]
    d1 = _f12_flight(o, xc, xs, y, False, lines, dy=24)
    _f12_calc(o, xc, d1 + 2, d1 + 58)
    o.append(T(xc - 12, d1 + 52, "共有の秘密を計算し、証明書と", "end", 9.5, SIG))
    o.append(T(xc - 12, d1 + 65, "署名と Finished を確かめる", "end", 9.5, SIG))
    y = d1 + 74
    e1 = _f12_flight(o, xc, xs, y, True, [("{Finished}", TEA, True), ("{アプリケーションのデータ}", PUR, True)], dy=24)
    _f12_flight(o, xc, xs, e1 + 30, False, [("{NewSessionTicket}（6 節）", TEA, False)], dy=24, dash=True)
    # 往復の括弧（左端）
    for (y0, y1, l1, col) in ((52, b, "TCP の", GRN), (c1 - 24, d1, "TLS の", TEA)):
        o.append(W(118, y0, 112, y0, 112, y1, 118, y1, c=col, lw=1.3))
        o.append(T(106, (y0 + y1) / 2 - 2, l1, "end", 9.5, col, True))
        o.append(T(106, (y0 + y1) / 2 + 11, "1 往復", "end", 9.5, col, True))
    o.append(T(xc - 12, b + 14, "鍵の組を作る", "end", 9.5, SIG))
    o.append(T(xs + 12, c1 + 12, "選んで計算し、署名する", "start", 9.5, GRN))
    o.append(T(14, 368, "{ } の中は、ハンドシェイク用の鍵で暗号化されて送られる。縦の細い箱は計算している時間（縦の長さは縮尺どおりではない）。", "start", 9.5, MUT))
    return SVG(700, 378, o, "TLS 1.3 のハンドシェイク（TCP の接続から）。クライアントは ClientHello に鍵交換の公開鍵を入れて送り、サーバは ServerHello から Finished までをまとめて返す。クライアントは確かめた後、Finished とアプリケーションのデータを続けて送れる。TLS の部分は 1 往復である。")
F["e12_hs13"] = _f12_hs13()

# ---- 3 節: TLS 1.2 と 1.3 の比較 ----
def _f12_hs12():
    o = []
    panels = [("TLS 1.2（2 往復）", GLD, 150, 252, [
                (True, [("ClientHello", INK, True)]),
                (False, [("ServerHello", INK, True), ("Certificate", INK, True), ("ServerKeyExchange", INK, False), ("ServerHelloDone", INK, False)]),
                (True, [("ClientKeyExchange", INK, False), ("ChangeCipherSpec", INK, False), ("{Finished}", TEA, True)]),
                (False, [("ChangeCipherSpec", INK, False), ("{Finished}", TEA, True)]),
                (True, [("{データ}", PUR, True), ("ここからデータを送れる", GRN, True)])]),
              ("TLS 1.3（1 往復）", TEA, 470, 572, [
                (True, [("ClientHello", INK, True), ("鍵交換の公開鍵", MUT, False)]),
                (False, [("ServerHello", INK, True), ("{EncryptedExtensions}", TEA, False), ("{Certificate}", TEA, True), ("{CertificateVerify}", TEA, False), ("{Finished}", TEA, True)]),
                (True, [("{Finished}", TEA, True), ("{データ}", PUR, True), ("ここからデータを送れる", GRN, True)])])]
    for title, col, xc, xs, flights in panels:
        o.append(T((xc + xs) / 2, 16, title, "middle", 12, col, True))
        _f12_heads(o, xc, xs, y=26, names=("機器", "サーバ"), w=70)
        _f12_life(o, xc, xs, 52, 262)
        y = 64
        first = y
        for k, (to_s, lines) in enumerate(flights):
            last = (k == len(flights) - 1)
            yy = _f12_flight(o, xc, xs, y, to_s, lines, c=PUR if last else INK, dy=30, sz=9.5, lh=12)
            if not last:
                if not to_s:
                    _f12_calc(o, xc, yy + 1, yy + 9)
                y = yy + 10
        o.append(D(xc, y, GRN, 4))
        bx = xc - 112 if xc < 300 else xc - 96
        o.append(W(bx + 6, first, bx, first, bx, y, bx + 6, y, c=col, lw=1.3))
    o.append(T(14, 286, "同じ時間の目盛で描いた（TCP の接続の後から）。TLS 1.2 は鍵交換の値がサーバに届くのが 2 回目の送信なので、データを送れるのが 1 往復遅れる。", "start", 9.5, MUT))
    o.append(T(14, 302, "TLS 1.2 では、証明書（Certificate）も暗号化されずに流れる。", "start", 9.5, MUT))
    return SVG(700, 312, o, "TLS 1.2 と TLS 1.3 のハンドシェイクの比較。TLS 1.3 ではクライアントが最初の ClientHello で鍵交換の公開鍵を送るので、サーバの 1 回の返事で鍵が決まり、1 往復でデータを送れる。")
F["e12_hs12"] = _f12_hs12()

# ---- 3 節: 接続にかかる時間の内訳 ----
def _f12_conntime():
    o = []
    R, tx13, tx12 = 0.1, 0.0125, 0.0132
    rows = [("ソフトウェア", "TLS 1.2", 0.400 + 3 * 0.450, 2, tx12), ("ソフトウェア", "TLS 1.3", 0.400 + 3 * 0.450, 1, tx13),
            ("暗号エンジン", "TLS 1.2", 0.010 + 3 * 0.012, 2, tx12), ("暗号エンジン", "TLS 1.3", 0.010 + 3 * 0.012, 1, tx13)]
    p = Plot(150, 30, 470, 4 * 34, (0, 2.2), (0, 4))
    for v in (0, 0.5, 1.0, 1.5, 2.0):
        xx = p.X(v)
        o.append(W(xx, 26, xx, 30 + 4 * 34, c=GRD, lw=1))
        o.append(T(xx, 30 + 4 * 34 + 15, "%g s" % v, "middle", 9.5, MUT))
    for i, (cpu, ver, Tc, k, Tx) in enumerate(rows):
        y = 34 + i * 34
        o.append(T(142, y + 11, cpu + "（例）", "end", 10, INK, True))
        o.append(T(142, y + 24, ver, "end", 9.5, TEA if ver.endswith("3") else GLD, True))
        segs = [(R, GRN, "TCP"), (k * R, TEA, "TLS"), (Tc, SIG, "計算"), (Tx, GLD, "")]
        x = p.X(0)
        for v, c, lab in segs:
            wpx = p.X(v) - p.X(0)
            o.append(RECT(x, y, max(wpx, 0.8), 24, 2, soft(c), c, 1.1))
            if lab and wpx >= tw(lab, 9) + 4:
                o.append(T(x + wpx / 2, y + 16, lab, "middle", 9, c, True))
            x += wpx
        tot = (1 + k) * R + Tc + Tx
        o.append(T(x + 6, y + 16, "%.2f s" % tot, "start", 10, INK, True))
    yl = 30 + 4 * 34 + 36
    o.append(LEGEND(150, yl, [(GRN, "TCP の 1 往復"), (TEA, "TLS の往復"), (SIG, "クライアントの計算 T_c"), (GLD, "送る時間 T_x（約 13 ms）")]))
    o.append(T(150, yl + 20, "R = 100 ms、チェーン 2 枚（d = 2）、1 Mbps。計算の時間は仮定の例:", "start", 9.5, MUT))
    o.append(T(150, yl + 34, "ソフトウェアは鍵交換 400 ms・確認 1 回 450 ms、暗号エンジンは 10 ms・12 ms。", "start", 9.5, MUT))
    return SVG(700, yl + 44, o, "接続にかかる時間の内訳（TCP の 1 往復、TLS の往復、クライアントの計算 T_c、送る時間 T_x）。計算の遅いマイコンでは時間の大部分が計算で、TLS 1.3 で 1 往復減らしても 5 % ほどしか縮まない。計算が速いと往復の時間が大部分になり、1 往復の差が効く。")
F["e12_conntime"] = _f12_conntime()

# ---- 4 節: 証明書の中身（例として作ったサーバの証明書） ----
def _f12_cert():
    o = []
    rows = [("版", "3（X.509 v3）", 5, INK), ("通し番号", "3c:86:5b:47:…:5a:9c（20 バイト）", 22, INK),
            ("署名の方式", "ecdsa-with-SHA256", 12, INK), ("発行者", "O=Example, CN=Example Issuing CA", 49, GLD),
            ("有効期間", "2026-10-24 06:21:17 〜 2027-10-24 06:21:17（UTC）", 32, ALI), ("主体", "CN=mqtt.example.com", 29, GRN),
            ("公開鍵", "楕円曲線 P-256: 04 e8 75 b6 a6 …（65 バイト）", 91, GRN),
            ("拡張", "subjectAltName DNS:mqtt.example.com", 150, GRN),
            ("", "basicConstraints CA:FALSE ・ keyUsage digitalSignature", None, INK),
            ("", "extendedKeyUsage serverAuth（サーバに使う）", None, INK),
            ("署名の方式", "ecdsa-with-SHA256", 12, INK), ("署名", "30 45 02 21 00 85 0a a5 …（発行者の秘密鍵で作った 71 バイト）", 74, GLD)]
    y0, rh = 40, 21
    o.append(T(24, 24, "欄", "start", 10.5, MUT, True))
    o.append(T(112, 24, "例の値（mqtt.example.com のサーバの証明書）", "start", 10.5, MUT, True))
    o.append(T(572, 24, "バイト", "end", 10.5, MUT, True))
    o.append(RECT(14, y0 - 4, 570, rh * len(rows) + 8, 8, PAN, LIN, 1.2))
    for i, (nm, val, nb, c) in enumerate(rows):
        y = y0 + i * rh
        if i in (10,):
            o.append(W(20, y - 2, 578, y - 2, c=LIN, lw=1))
        if nm:
            o.append(T(24, y + 14, nm, "start", 10, INK, True))
        o.append(T(112, y + 14, val, "start", 9.5, c, c != INK, True if any(ch in val for ch in ":=") and "（" not in val[:3] else False))
        if nb is not None:
            o.append(T(572, y + 14, str(nb), "end", 9.5, MUT, False, True))
    ytb = y0 + 10 * rh - 4
    o.append(W(590, y0 - 2, 598, y0 - 2, 598, ytb, 590, ytb, c=TEA, lw=1.4))
    o.append(T(606, (y0 + ytb) / 2 - 6, "署名される", "start", 10, TEA, True))
    o.append(T(606, (y0 + ytb) / 2 + 8, "部分", "start", 10, TEA, True))
    o.append(T(606, (y0 + ytb) / 2 + 22, "394 バイト", "start", 9.5, TEA))
    ys = y0 + 11 * rh
    o.append(T(606, ys + 14, "全体 484", "start", 9.5, INK, True))
    yb = y0 + len(rows) * rh + 22
    o.append(T(14, yb, "赤: 有効期間の外では使えない。緑: 持ち主（主体・公開鍵・使ってよい名前）。金: 署名した CA に関わる欄。", "start", 9.5, MUT))
    o.append(T(14, yb + 15, "各行のバイト数は、DER という形で書いたときの長さ（欄の見出しを含む）。", "start", 9.5, MUT))
    return SVG(700, yb + 25, o, "例として作ったサーバの証明書（楕円曲線 P-256、DER の形で 484 バイト）の欄。最後の署名は、それより前の 394 バイト（署名される部分）に対して、発行者（中間の CA）が自分の秘密鍵で作ったもの。機器は、発行者の証明書の公開鍵でこれを確かめる。")
F["e12_cert"] = _f12_cert()

# ---- 4 節: チェーンと検証の手順 ----
def _f12_verify():
    o = []
    cards = [("ルート証明書（トラストアンカー）", "Example Root CA・自分で署名", SIG, "機器のフラッシュに前もって入れておく"),
             ("中間の CA の証明書", "Example Issuing CA・ルートが署名", GLD, None),
             ("サーバの証明書", "mqtt.example.com・中間の CA が署名", GRN, None)]
    x, w, h = 56, 252, 50
    ys = [40, 136, 232]
    for (title, sub, c, note), y in zip(cards, ys):
        o.append(RECT(x, y, w, h, 7, soft(c), c, 1.5))
        o.append(T(x + 10, y + 19, title, "start", 10.5, c, True))
        o.append(T(x + 10, y + 36, sub, "start", 9.5, INK))
        o.append(RECT(x + w - 64, y + h - 18, 56, 14, 3, PAN, c, 1))
        o.append(T(x + w - 36, y + h - 7, "公開鍵", "middle", 8.5, c, True))
    for k in range(2):
        y1, y2 = ys[k] + h, ys[k + 1]
        o.append(ARR(x + w - 36, y1 - 4, x + w - 36, y2 - 2, c=TEA, lw=1.5))
        o.append(T(x + w - 44, (y1 + y2) / 2 + 4, "この公開鍵で、下の署名を確かめる（①）", "end", 9, TEA))
    o.append(T(x, ys[0] - 8, cards[0][3], "start", 9.5, SIG, True))
    o.append(W(x - 10, ys[1], x - 16, ys[1], x - 16, ys[2] + h, x - 10, ys[2] + h, c=GRN, lw=1.4))
    o.append(T(x - 22, (ys[1] + ys[2] + h) / 2, "サーバが送る（Certificate）", "middle", 9.5, GRN, True, rot=-90))
    yv = ys[2] + h + 14
    o.append(RECT(x, yv, w, 34, 6, TSOFT, TEA, 1.2))
    o.append(T(x + 10, yv + 14, "CertificateVerify（3 節）", "start", 10, TEA, True))
    o.append(T(x + 10, yv + 28, "サーバの秘密鍵の署名を、この証明書の公開鍵で確かめる", "start", 9, INK))
    # 右: 確かめることと防ぐもの
    xt = 330
    o.append(T(xt, 26, "確かめること", "start", 10.5, INK, True))
    o.append(T(xt + 150, 26, "省くと通ってしまうもの（悪い例）", "start", 10.5, ALI, True))
    items = [("① 署名", "各証明書の署名が、1 つ上の公開鍵で合うか", "内容を書き換えた証明書"),
             ("② 有効期間", "いまの時刻が期間の中か", "期限の切れた古い証明書"),
             ("③ CA であること", "署名した側が CA:TRUE か", "CA でない証明書で作った偽物"),
             ("④ トラストアンカー", "上端が、機器の持つルートにつながるか", "攻撃者が自分で作った CA"),
             ("⑤ ホスト名", "サーバの証明書の SAN に、つなぐ名前があるか", "別の名前で正しく取った証明書"),
             ("⑥ CertificateVerify", "サーバが証明書の秘密鍵を持っているか", "証明書を写しただけの偽のサーバ")]
    for i, (a, b, c) in enumerate(items):
        y = 40 + i * 48
        o.append(RECT(xt, y, 360, 42, 6, PAN, LIN, 1.1))
        o.append(T(xt + 8, y + 17, a, "start", 10, TEA, True))
        o.append(T(xt + 8, y + 34, b, "start", 9, INK))
        o.append(T(xt + 150, y + 17, c, "start", 9.5, ALI))
    return SVG(700, yv + 46, o, "証明書チェーンと、クライアントが確かめること。サーバは自分の証明書と中間の CA の証明書を送り、機器は前もって持っているルート証明書（トラストアンカー）まで、署名を 1 段ずつ確かめる。右の 6 つは、それぞれ別の攻撃を防ぐので、1 つでも省くと穴になる。")
F["e12_verify"] = _f12_verify()

# ---- 5 節: 相互認証 ----
def _f12_mutual():
    o = []
    xc, xs = 300, 470
    _f12_heads(o, xc, xs)
    _f12_life(o, xc, xs, 38, 318)
    y = 52
    a = _f12_flight(o, xc, xs, y, True, [("ClientHello", INK, True)], dy=24)
    lines = [("ServerHello", INK, True), ("{EncryptedExtensions}", TEA, False), ("{CertificateRequest}", PUR, True),
             ("{Certificate}", TEA, False), ("{CertificateVerify}", TEA, False), ("{Finished}", TEA, False)]
    b = _f12_flight(o, xc, xs, a + 6, False, lines, dy=24)
    _f12_calc(o, xc, b + 2, b + 52)
    o.append(T(xc - 12, b + 14, "サーバを確かめ、", "end", 9.5, SIG))
    o.append(T(xc - 12, b + 27, "自分の秘密鍵で署名する", "end", 9.5, SIG))
    c = _f12_flight(o, xc, xs, b + 56, True, [("{Certificate}（機器の証明書）", PUR, True), ("{CertificateVerify}（機器の署名）", PUR, True),
                                               ("{Finished}", TEA, False), ("{データ}", INK, False)], dy=24)
    _f12_calc(o, xs, c + 2, c + 16, GRN)
    o.append(T(xs + 12, c + 13, "機器の証明書を検証する", "start", 9.5, GRN))
    d = _f12_flight(o, xc, xs, c + 24, False, [("受け入れたら、そのまま続く", GRN, True)], c=GRN, dy=24)
    _f12_flight(o, xc, xs, d + 28, False, [("断るときはアラート", ALI, True), ("→ 機器は最初の読み出しで", ALI, False), ("　失敗を知る", ALI, False)], c=ALI, dy=24, dash=True)
    o.append(T(14, 340, "紫が相互認証で加わるもの。往復は増えない。例の証明書では、機器の送信は 80 バイトから 1139 バイトに増えた。", "start", 9.5, MUT))
    return SVG(700, 350, o, "TLS 1.3 の相互認証。サーバは CertificateRequest で機器の証明書を求め、機器は自分の証明書と、自分の秘密鍵による署名（CertificateVerify）を Finished の前に送る。サーバの判断は機器の Finished の後に届くので、断られたことは最初の読み出しで分かる。")
F["e12_mutual"] = _f12_mutual()

# ---- 5 節: 機器を確かめる方法の比較 ----
def _f12_auth():
    o = []
    cols = [("相互認証（証明書）", PUR), ("PSK だけ（psk_ke）", GLD), ("PSK + ECDHE（psk_dhe_ke）", TEA)]
    rows = [("機器が持つ秘密", [("自分の秘密鍵（1 台ずつ）", INK), ("PSK（1 台ずつ）", INK), ("PSK（1 台ずつ）", INK)]),
            ("サーバが持つもの", [("CA の証明書（公開してよい）", GRN), ("全機器の PSK（秘密）", ALI), ("全機器の PSK（秘密）", ALI)]),
            ("サーバから漏れたら", [("困らない", GRN), ("全機器になりすませる", ALI), ("全機器になりすませる", ALI)]),
            ("機器の公開鍵の計算", [("鍵交換 1・確認 3・署名 1", GLD), ("なし", GRN), ("鍵交換 1", GRN)]),
            ("送るバイト（合計）", [("機器 1598・サーバ 1420 B", GLD), ("右の列より少ない", GRN), ("機器 333・サーバ 225 B", GRN)]),
            ("前方秘匿性", [("あり", GRN), ("なし", ALI), ("あり", GRN)])]
    x0, cw, lw_, rh = 14, 182, 130, 30
    for j, (nm, c) in enumerate(cols):
        x = x0 + lw_ + j * cw
        o.append(RECT(x + 2, 10, cw - 4, 28, 6, soft(c), c, 1.3))
        o.append(T(x + cw / 2, 29, nm, "middle", 10, c, True))
    for i, (rn, cells) in enumerate(rows):
        y = 44 + i * rh
        o.append(RECT(x0, y, lw_ + 3 * cw, rh - 2, 4, PAN if i % 2 == 0 else SCR, "none", 0))
        o.append(T(x0 + 8, y + 18, rn, "start", 10, INK, True))
        for j, (txt, c) in enumerate(cells):
            o.append(T(x0 + lw_ + j * cw + cw / 2, y + 18, txt, "middle", 9.5, c, c != INK))
    yb = 44 + len(rows) * rh + 14
    o.append(T(x0, yb, "バイト数は、Mbed TLS の機器と OpenSSL のサーバで測った値（相互認証は ECDSA の証明書）。PSK だけの方式は、OpenSSL のサーバが", "start", 9.5, MUT))
    o.append(T(x0, yb + 14, "受け付けなかったので測っていない（鍵交換の公開鍵が無い分、右の列より少ない）。", "start", 9.5, MUT))
    return SVG(700, yb + 24, o, "機器を TLS の中で確かめる 3 つの方法の比較。証明書はサーバに秘密を置かずに済むが、計算とバイトが多い。PSK は軽いが、サーバが全部の機器の秘密を持つ。PSK だけで鍵を作ると前方秘匿性がない。")
F["e12_auth"] = _f12_auth()

# ---- 6 節: RAM の見積もり（測った値） ----
def _f12_ram():
    o = []
    rows = [("既定", "受信 16 KB・送信 16 KB", 16765, 16765, 59518 - 2 * 16765, None),
            ("送信を小さく", "受信 16 KB・送信 2 KB", 16765, 2429, 35731 - 16765 - 2429, None),
            ("両方を小さく", "受信 4 KB・送信 2 KB", 4477, 2429, 23443 - 4477 - 2429, "相手が 4096 バイトより大きいレコードを送らないときだけ使える")]
    sc = 7.6 / 1024.0      # 1 バイトあたりの px（1 KB = 7.6 px）
    x0 = 150
    for v in (0, 10, 20, 30, 40, 50, 60):
        xx = x0 + v * 1024 * sc
        o.append(W(xx, 30, xx, 30 + 3 * 62, c=GRD, lw=1))
        o.append(T(xx, 30 + 3 * 62 + 15, "%d KB" % v, "middle", 9.5, MUT))
    for i, (nm, sub, rin, rout, rest, note) in enumerate(rows):
        y = 36 + i * 62
        o.append(T(142, y + 13, nm, "end", 10.5, INK, True))
        o.append(T(142, y + 27, sub, "end", 9, MUT))
        x = x0
        for v, c, lab in ((rin, SIG, "受信"), (rout, GLD, "送信"), (rest, MUT, "その他")):
            wpx = v * sc
            o.append(RECT(x, y, wpx, 28, 3, soft(c), c, 1.2))
            if wpx >= tw(lab, 9.5) + 4:
                o.append(T(x + wpx / 2, y + 18, lab, "middle", 9.5, c, True))
            x += wpx
        tot = rin + rout + rest
        o.append(T(x + 8, y + 18, "%.1f KB" % (tot / 1024.0), "start", 10.5, INK, True))
        if note:
            o.append(T(x0, y + 44, note, "start", 9.5, ALI, True))
    yl = 30 + 3 * 62 + 36
    o.append(LEGEND(x0, yl, [(SIG, "受信のバッファ"), (GLD, "送信のバッファ"), (MUT, "その他（ハンドシェイクの間の計算・証明書など）")]))
    o.append(T(x0, yl + 20, "Mbed TLS 3.6.5、TLS 1.3 のハンドシェイクの間のヒープの最大を PC（64 ビット）で測った値。スタックは含まない。", "start", 9.5, MUT))
    return SVG(700, yl + 30, o, "TLS が使う RAM（ヒープ）の見積もり。既定では受信と送信のバッファが 16 KB 余りずつで、合わせて半分以上を占める。送信のバッファは自分で決めて小さくできるが、受信のバッファを小さくできるのは、相手に大きなレコードを送らせない取り決めができたときだけである。")
F["e12_ram"] = _f12_ram()

# ---- 6 節: セッションの再開 ----
def _f12_resume():
    o = []
    cards = [("TLS 1.3 の最初の接続", TEA, ["ClientHello", "250 B"], ["ServerHello", "{EncryptedExtensions}", "{Certificate}", "{CertificateVerify}", "{Finished}"], "1314 B",
              "鍵交換 1・確認 3", "1 往復"),
             ("TLS 1.3 の再開（PSK + ECDHE）", GRN, ["ClientHello + チケット", "521 B"], ["ServerHello", "{EncryptedExtensions}", "{Finished}"], "241 B",
              "鍵交換 1・確認 0", "1 往復"),
             ("TLS 1.2 の再開", GLD, ["ClientHello + チケット", "517 B"], ["ServerHello", "ChangeCipherSpec", "{Finished}"], "141 B",
              "なし", "1 往復")]
    for j, (title, c, ch, srv, sb, calc, rtt) in enumerate(cards):
        x = 14 + j * 228
        o.append(RECT(x, 10, 218, 238, 8, PAN, c, 1.4))
        o.append(T(x + 109, 30, title, "middle", 10.5, c, True))
        o.append(T(x + 12, 52, "機器 → サーバ", "start", 9.5, MUT))
        o.append(T(x + 12, 67, ch[0], "start", 10, INK, True))
        o.append(T(x + 206, 67, ch[1], "end", 9.5, MUT, False, True))
        o.append(T(x + 12, 90, "サーバ → 機器", "start", 9.5, MUT))
        for k, m in enumerate(srv):
            o.append(T(x + 12, 105 + k * 14, m, "start", 9.5, TEA if m.startswith("{") else INK, m in ("{Certificate}", "{CertificateVerify}")))
        o.append(T(x + 206, 105, sb, "end", 9.5, MUT, False, True))
        o.append(W(x + 10, 182, x + 208, 182, c=LIN, lw=1))
        o.append(T(x + 12, 200, "機器の計算: " + calc, "start", 9.5, INK))
        o.append(T(x + 12, 218, "TLS の往復: " + rtt, "start", 9.5, INK))
        if j == 1:
            o.append(T(x + 12, 236, "証明書の送付と検証を省く", "start", 9.5, GRN, True))
        if j == 2:
            o.append(T(x + 12, 236, "鍵交換も署名もない", "start", 9.5, GLD, True))
    o.append(T(14, 266, "バイト数は OpenSSL 同士で、例の ECDSA の証明書を使って測った値（TLS のヘッダを含む）。チケットは前の接続でサーバが送ったもの。", "start", 9.5, MUT))
    return SVG(700, 276, o, "最初の接続と再開の比較。再開では、前の接続でもらったチケットを ClientHello に入れ、前の接続で作った秘密を PSK として使う。サーバは証明書と CertificateVerify を送らないので、送るバイトも機器の計算も減る。TLS 1.3 では往復は 1 のままである。")
F["e12_resume"] = _f12_resume()

# ---- 7 節: Mbed TLS の構成 ----
def _f12_mbed():
    o = []
    x, w = 30, 400
    o.append(BOX(x, 14, w, 34, "アプリケーション（MQTT など。13 章）", None, PUR, PSOFT, PUR, sz=11))
    o.append(RECT(x, 70, w, 92, 8, TSOFT, TEA, 1.5))
    o.append(T(x + 12, 88, "Mbed TLS", "start", 11.5, TEA, True))
    subs = [("ssl", "ハンドシェイクとレコード"), ("x509", "証明書の解析と検証"), ("暗号（PSA）", "AES・ECC・ハッシュ・乱数")]
    for k, (a, b) in enumerate(subs):
        bx = x + 10 + k * 130
        o.append(RECT(bx, 96, 120, 56, 6, PAN, TEA, 1.1))
        o.append(T(bx + 60, 116, a, "middle", 10.5, TEA, True))
        o.append(T(bx + 60, 134, b, "middle", 8.5 if len(b) > 10 else 9, INK))
    o.append(BOX(x, 184, w, 30, "bio_send・bio_recv（この節のコード）", None, SIG, SSOFT, SIG, sz=10.5))
    o.append(BOX(x, 236, w, 30, "ソケット（11 章。lwIP などの TCP/IP スタック）", None, GRN, GSOFT, GRN, sz=10.5))
    o.append(ARR(x + 120, 48, x + 120, 70, c=PUR, lw=1.5))
    o.append(T(x + 128, 63, "mbedtls_ssl_handshake・write・read を呼ぶ", "start", 9.5, PUR))
    o.append(ARR(x + 120, 162, x + 120, 184, c=TEA, lw=1.5))
    o.append(T(x + 128, 177, "レコードを送る・受けるときに呼ぶ", "start", 9.5, TEA))
    o.append(ARR(x + 120, 214, x + 120, 236, c=SIG, lw=1.5))
    o.append(T(x + 128, 229, "send・recv（EAGAIN なら WANT_WRITE・WANT_READ）", "start", 9.5, SIG))
    side = [("乱数の源（乱数の回路など）", 98), ("いまの時刻（RTC・SNTP）", 126), ("トラストアンカーと資格情報", 154), ("暗号エンジン（あれば）", 182)]
    for t, y in side:
        o.append(T(482, y + 4, t, "start", 9.5, GLD, True))
    o.append(RECT(470, 82, 214, 118, 6, "none", GLD, 1.1, dash="4 3"))
    o.append(ARR(470, 141, x + w + 2, 141, c=GLD, lw=1.4))
    o.append(T(577, 218, "移植ごとに用意して渡すもの", "middle", 9.5, GLD))
    return SVG(700, 280, o, "Mbed TLS を組み込んだときの構成。アプリケーションは Mbed TLS の関数を呼び、Mbed TLS はレコードを送受信するときに、アプリケーションが渡した関数（bio_send・bio_recv）を通してソケットを使う。乱数の源・時刻・トラストアンカーなどは、機器ごとに用意して渡す。")
F["e12_mbed"] = _f12_mbed()

# ---- 7 節: ハンドシェイクを進める繰り返し ----
def _f12_loop():
    o = []
    o.append(BOX(14, 20, 184, 40, "設定（1 回）", "初期化・トラストアンカー・ホスト名", SIG, SSOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(198, 40, 236, 40, c=MUT, lw=1.4))
    o.append(BOX(238, 20, 200, 40, "mbedtls_ssl_handshake()", None, TEA, TSOFT, TEA, sz=10.5, mono=True))
    o.append(ARR(438, 40, 494, 40, c=GRN, lw=1.5))
    o.append(T(466, 34, "0", "middle", 10, GRN, True, True))
    o.append(BOX(496, 20, 186, 40, "接続できた", "write・read へ", GRN, GSOFT, GRN, sz=10.5, ssz=9))
    # WANT_READ / WANT_WRITE
    o.append(ARR(300, 60, 300, 104, c=SIG, lw=1.4))
    o.append(T(306, 86, "WANT_READ・WANT_WRITE", "start", 9.5, SIG, True, True))
    o.append(BOX(214, 106, 250, 40, "読める・書けるまで待つ", "poll など。10 秒で来なければ失敗", SIG, PAN, SIG, sz=10.5, ssz=9))
    o.append(W(214, 126, 206, 126, 206, 52, 236, 52, c=SIG, lw=1.4))
    o.append(T(200, 96, "もう一度呼ぶ", "end", 9.5, SIG))
    # その他
    o.append(W(438, 52, 470, 52, 470, 186, 464, 186, c=ALI, lw=1.4))
    o.append(T(476, 120, "それ以外（失敗）", "start", 9.5, ALI, True))
    o.append(BOX(214, 166, 250, 40, "失敗の理由を読む", "-0x2700 なら get_verify_result で理由のビット", ALI, ASOFT, ALI, sz=10.5, ssz=9))
    o.append(ARR(339, 206, 339, 230, c=ALI, lw=1.4))
    o.append(BOX(170, 232, 338, 40, "ログに残し、時刻が原因なら SNTP で合わせ直す", "指数バックオフ（05 章 5 節）で待ってから、TCP からやり直す", ALI, PAN, INK, sz=10, ssz=9))
    return SVG(700, 284, o, "ハンドシェイクを進める繰り返し。mbedtls_ssl_handshake() は、ソケットの用意ができていないと WANT_READ か WANT_WRITE を返すので、待ってからもう一度呼ぶ。0 なら接続できた。それ以外の値は失敗で、理由を読んでから、間をあけてやり直す。")
F["e12_loop"] = _f12_loop()
