# -*- coding: utf-8 -*-
# 11 章 ソケットと組み込みの TCP/IP スタック の図

_F11_MSG = [("A", b"T=23.5", SIG), ("B", b"H=41.25,B=87", PUR), ("C", b"ALM=1", GLD)]


def _f11_cells(x, y, unit, h, cells, sz=10):
    """バイトのます目の列。cells = [(文字, 色, 見出しのバイトか), ...]"""
    o = []
    for i, (t, c, hdr) in enumerate(cells):
        xx = x + i * unit
        o.append(RECT(xx, y, unit, h, 2, soft(c) if not hdr else PAN, c, 1.2 if not hdr else 1.6))
        o.append(T(xx + unit / 2, y + h / 2 + 3.6, t, "middle", 8.5 if hdr else sz, c if hdr else INK, hdr, True))
    return "".join(o)


def _f11_stream_cells():
    cells, spans = [], []
    for name, body, c in _F11_MSG:
        s = len(cells)
        L = len(body)
        cells.append(("%02X" % (L >> 8), c, True))
        cells.append(("%02X" % (L & 0xFF), c, True))
        for b in body:
            cells.append((chr(b), c, False))
        spans.append((name, s, len(cells), L, c))
    return cells, spans


# ---- 1 節: ソケットとバッファ ----
def _f11_socket():
    o = []
    o.append(RECT(14, 44, 150, 166, 10, PSOFT, PUR, 1.4))
    o.append(T(89, 64, "アプリケーション", "middle", 12, PUR, True))
    o.append(T(89, 99, "send(fd, データ, n)", "middle", 10, INK, False, True))
    o.append(T(89, 151, "recv(fd, 配列, n)", "middle", 10, INK, False, True))
    o.append(T(89, 192, "close(fd)", "middle", 10, INK, False, True))
    o.append(RECT(196, 16, 382, 226, 10, MSOFT, MUT, 1.2, dash="5 4"))
    o.append(T(208, 34, "TCP/IP スタック（OS の中、またはマイコンのライブラリ）", "start", 10.5, MUT, True))
    o.append(RECT(210, 46, 354, 150, 8, GSOFT, GRN, 1.4))
    o.append(T(222, 64, "ソケット（ファイル記述子 3）", "start", 11, GRN, True))
    bx = 316
    # 送信バッファ
    o.append(T(bx, 84, "送信バッファ", "start", 10, INK, True))
    segs = [(0, 52, "空き", SCR, MUT), (52, 128, "未送信", PSOFT, PUR), (128, 236, "送った・確認待ち", GSOFT, GRN)]
    for a, b, lab, f, c in segs:
        o.append(RECT(bx + a, 90, b - a, 24, 2, f, c, 1.2))
        o.append(T(bx + (a + b) / 2, 106, lab, "middle", 9.5, c if c != MUT else MUT, True))
    o.append(T(bx, 128, "send は空きに写して戻る（戻り値 = 写したバイト数）", "start", 9.5, MUT))
    # 受信バッファ
    o.append(T(bx, 146, "受信バッファ", "start", 10, INK, True))
    segs = [(0, 112, "届いた・未読", GSOFT, GRN), (112, 236, "空き = 受信ウィンドウ", SCR, MUT)]
    for a, b, lab, f, c in segs:
        o.append(RECT(bx + a, 152, b - a, 24, 2, f, c, 1.2))
        o.append(T(bx + (a + b) / 2, 168, lab, "middle", 9.5, c, True))
    o.append(T(bx, 190, "recv は左から取り出す（10 章 3 節）", "start", 9.5, MUT))
    o.append(ARR(166, 102, bx - 3, 102, c=PUR, lw=1.8))
    o.append(T(240, 96, "写す", "middle", 9.5, PUR, True))
    o.append(ARR(bx - 3, 164, 166, 164, c=PUR, lw=1.8))
    o.append(T(240, 158, "取り出す", "middle", 9.5, PUR, True))
    o.append(RECT(610, 70, 78, 116, 8, GSOFT, GRN, 1.4))
    o.append(T(649, 122, "相手", "middle", 11.5, GRN, True))
    o.append(T(649, 138, "（サーバ）", "middle", 9.5, MUT))
    o.append(ARR(bx + 238, 102, 607, 102, c=GRN, lw=1.8))
    o.append(T(584, 96, "送る", "middle", 9.5, GRN, True))
    o.append(ARR(607, 164, bx + 238, 164, c=GRN, lw=1.8))
    o.append(T(584, 158, "届く", "middle", 9.5, GRN, True))
    o.append(T(208, 220, "TCP がセグメントを作り、IP とリンク層を通して送受信する（07 章）。", "start", 10, MUT))
    o.append(T(208, 235, "確認応答が来たデータは、送信バッファから消える（10 章 2 節）。", "start", 10, MUT))
    return SVG(700, 252, o, "ソケットの 2 つのバッファ。send はデータを送信バッファの空きに写して戻り、TCP がそこからセグメントを作って送る。送ったデータは、確認応答が来るまで送信バッファに残る。届いたデータは受信バッファにたまり、recv がそこから取り出す。受信バッファの空きが、相手に知らせる受信ウィンドウになる。")
F["e11_socket"] = _f11_socket()


def _f11_calls():
    lanes = [("アプリケーション", PUR), ("機器の TCP/IP スタック", SIG), ("サーバ（5000 番）", GRN)]
    P = {"c": PUR, "mono": True}
    msgs = [
        (0, 1, 'getaddrinfo("server.example.com", "5000")', P),
        ("note", 1, "DNS で名前を解決する（08 章 4 節）", {"c": MUT}),
        (1, 0, "アドレスの一覧（203.0.113.10 など）", {"c": PUR}),
        (0, 1, "socket(…) → 3（パケットは出ない）", {"c": PUR}),
        (0, 1, "connect(3, 203.0.113.10 の 5000 番)", {"c": PUR}),
        (1, 2, "SYN", {"c": GRN, "b": True}),
        (2, 1, "SYN + ACK", {"c": GRN, "b": True}),
        (1, 2, "ACK", {"c": GRN}),
        ("span", 2, 3, "3 ウェイ\nハンドシェイク", {"c": GRN}),
        (1, 0, "0（つながった）", {"c": PUR}),
        (0, 1, 'send(3, "T=23.5\\n", 7)', P),
        (1, 0, "7（送信バッファに写した）", {"c": PUR}),
        (1, 2, "データ 7 バイト", {"c": GRN, "b": True}),
        (0, 1, "recv(3, buf, 64)", P),
        (2, 1, "ACK + データ 3 バイト", {"c": GRN, "b": True}),
        (1, 0, "3（取り出したバイト数）", {"c": PUR}),
        ("span", 0, 3, "届くまで\n待つ", {"c": TEA, "side": -1}),
        (0, 1, "close(3)", P),
        (1, 2, "FIN", {"c": GRN, "b": True}),
        (2, 1, "ACK・FIN", {"c": GRN}),
        (1, 2, "ACK", {"c": GRN}),
        ("span", 2, 3, "終わりの手順\n（10 章 7 節）", {"c": GRN}),
    ]
    s, h = seq(lanes, msgs, x=10, y=12, w=680, label_sz=10, dy=26)
    return SVG(700, h + 20, [s], "ソケットの関数の呼び出し（左）と、機器のスタックが送受信するパケット（右）の対応。connect は 3 ウェイハンドシェイクが終わると戻る。send はデータを送信バッファに写したら、確認応答を待たずに戻る。recv は、データが届くまで待つ。close で FIN を送る。")
F["e11_calls"] = _f11_calls()


# ---- 2 節: 部分送信と部分受信 ----
def _f11_partial():
    o = []
    s = 0.11
    x0 = 60
    X = lambda b: x0 + b * s
    o.append(T(20, 22, "送信バッファ（4096 バイト）に 2500 バイトが残っているとき、send(fd, データ, 3000) を呼ぶ", "start", 11, INK, True))
    o.append(T(x0 - 8, 54, "送信バッファ", "end", 9.5, MUT))
    o.append(RECT(X(0), 38, X(2500) - X(0), 26, 2, GSOFT, GRN, 1.2))
    o.append(T((X(0) + X(2500)) / 2, 55, "確認応答待ち・未送信 2500", "middle", 9.5, GRN, True))
    o.append(RECT(X(2500), 38, X(4096) - X(2500), 26, 2, SCR, MUT, 1.2))
    o.append(T((X(2500) + X(4096)) / 2, 55, "空き 1596", "middle", 9.5, MUT, True))
    o.append(T(x0 - 8, 92, "渡したデータ", "end", 9.5, MUT))
    o.append(RECT(X(2500), 76, X(4096) - X(2500), 26, 2, PSOFT, PUR, 1.2))
    o.append(T((X(2500) + X(4096)) / 2, 93, "入る 1596", "middle", 9.5, PUR, True))
    o.append(RECT(X(4096), 76, X(5500) - X(4096), 26, 2, ASOFT, ALI, 1.2, dash="4 3"))
    o.append(T((X(4096) + X(5500)) / 2, 93, "入らない 1404", "middle", 9.5, ALI, True))
    o.append(W(X(4096), 32, X(4096), 108, c=MUT, lw=1, dash="3 3"))
    o.append(T(X(4096) + 4, 120, "送信バッファの終わり", "start", 9, MUT))
    o.append(T(X(2500), 124, "send の戻り値は 1596（部分送信）", "start", 10.5, INK, True))
    o.append(BOX(20, 142, 320, 84, "悪い例: 戻り値を見ずに次へ進む", "残りの 1404 バイトは、どこからも送られない。受け手には、メッセージの途中が抜けたバイトの列が届き、以後の区切りを誤る。", ALI, ASOFT, ALI, sz=11, ssz=10))
    o.append(BOX(360, 142, 320, 84, "良い例: 残りを覚えて、また渡す", "ブロッキングなら send_all のように残りを渡し直す。ノンブロッキングなら、書けるようになったときに残りを渡す（3 節）。", GRN, GSOFT, GRN, sz=11, ssz=10))
    return SVG(700, 238, o, "部分送信。send は、送信バッファの空きに入る分しか受け付けず、受け付けたバイト数を返す。戻り値が渡した長さより小さければ、残りをもう一度渡す。")
F["e11_partial"] = _f11_partial()


def _f11_stream():
    o = []
    cells, spans = _f11_stream_cells()
    unit, x0, y0 = 21, 66, 40
    o.append(T(14, 18, "送り手は、長さ 2 バイト + 本体 のメッセージ A・B・C を、send で 1 つずつ渡した", "start", 11, INK, True))
    for name, a, b, L, c in spans:
        o.append(T(x0 + (a + b) / 2 * unit, y0 - 6, "%s（本体 %d バイト）" % (name, L), "middle", 10, c, True))
    o.append(_f11_cells(x0, y0, unit, 24, cells))
    o.append(T(x0 - 6, y0 + 16, "バイト", "end", 9.5, MUT))
    chunks = [(0, 10, "recv 1 回目: 10 バイト"), (10, 25, "recv 2 回目: 15 バイト"), (25, 29, "3 回目: 4")]
    yb = y0 + 32
    for a, b, lab in chunks:
        xa, xb = x0 + a * unit + 2, x0 + b * unit - 2
        o.append(W(xa, yb, xa, yb + 6, xb, yb + 6, xb, yb, c=TEA, lw=1.6))
        o.append(T((xa + xb) / 2, yb + 20, lab, "middle", 10, TEA, True))
    # 表
    cols = [(14, 76, "recv"), (90, 168, "返ったバイト"), (258, 214, "1 回の recv = 1 つのメッセージと読む"), (472, 214, "長さで切り出す（recv_msg）")]
    yt = yb + 36
    hc = [INK, INK, ALI, GRN]
    for (x, w, t), c in zip(cols, hc):
        o.append(RECT(x, yt, w, 22, 3, soft(c) if c != INK else SCR, c if c != INK else LIN, 1.1))
        o.append(T(x + w / 2, yt + 15, t, "middle", 10, c, True))
    rows = [
        ("1 回目", "00 06 T=23.5 00 0C", ["長さ 6 → A を読む（○）", "続く 00 0C を捨ててしまう（×）"], ["A がそろう", "00 0C（B の長さ 12）を残す"]),
        ("2 回目", "H=41.25,B=87 00 05 A", ["先頭の H= を長さと読む", "0x483D = 18493（×）"], ["B がそろう", "00 05 A を残す"]),
        ("3 回目", "LM=1", ["先頭の LM を長さと読む", "0x4C4D = 19533（×）"], ["C がそろう", ""]),
    ]
    y = yt + 26
    for r0, r1, bad, good in rows:
        o.append(RECT(14, y, 676, 40, 3, PAN, LIN, 1))
        o.append(T(14 + 38, y + 25, r0, "middle", 10, INK, True))
        o.append(T(90 + 84, y + 25, r1, "middle", 9.5, INK, False, True))
        for k, l in enumerate(bad):
            o.append(T(258 + 107, y + 17 + k * 14, l, "middle", 9.5, ALI))
        for k, l in enumerate(good):
            if l:
                o.append(T(472 + 107, y + 17 + k * 14, l, "middle", 9.5, GRN))
        y += 44
    o.append(T(258 + 107, y + 14, "正しく読めたのは A だけ", "middle", 10.5, ALI, True))
    o.append(T(472 + 107, y + 14, "A・B・C の 3 つとも読める", "middle", 10.5, GRN, True))
    return SVG(700, y + 26, o, "部分受信の例。TCP は send の区切りを運ばないので、受け手の recv には、メッセージの境目と関係のない区切りでバイトが返る。1 回の recv を 1 つのメッセージと思い込むと、1 回目に B の長さを捨て、その後は本体の文字を長さと読んでしまう。長さの欄を読んで、足りない分を待って切り出せば、どう区切られて届いても正しく読める。")
F["e11_stream"] = _f11_stream()


# ---- 3 節: select ----
def _f11_select():
    o = []
    x0, x1 = 150, 670
    X = lambda t: x0 + (x1 - x0) * t / 1000.0
    ev = [(200, "B にデータ", GLD), (400, "期限", TEA), (700, "A にデータ", SIG)]

    def row(y, title, segs, ok):
        o.append(T(14, y - 10, title, "start", 11, INK, True))
        for t, lab, c in ev:
            o.append(W(X(t), y - 2, X(t), y + 30, c=c, lw=1.4, dash="3 3"))
            o.append(D(X(t), y - 2, c, 3.6))
        for a, b, lab, c in segs:
            o.append(RECT(X(a), y + 4, X(b) - X(a), 22, 3, soft(c), c, 1.2))
            if lab:
                o.append(T((X(a) + X(b)) / 2, y + 19, lab, "middle", 9.5, c, True))
        o.append(T(x0 - 8, y + 19, "通信タスク", "end", 9.5, MUT))
    o.append(T(X(200), 24, "B にデータ（200 ms）", "middle", 9.5, GLD, True))
    o.append(T(X(400), 24, "期限（400 ms）", "middle", 9.5, TEA, True))
    o.append(T(X(700), 24, "A にデータ（700 ms）", "middle", 9.5, SIG, True))
    row(56, "(a) ブロッキングの recv(A) で待つ", [(0, 700, "recv(A) の中で止まっている", ALI), (700, 760, "A", SIG), (760, 800, "B", GLD), (800, 840, "期限", TEA)], False)
    o.append(T(X(450), 104, "B のデータと期限は、A が届くまで扱えない", "middle", 10, ALI, True))
    row(140, "(b) select で、A が読める・B が読める・期限 をまとめて待つ", [(0, 200, "select", MUT), (200, 240, "B", GLD), (240, 400, "select", MUT), (400, 440, "期限", TEA), (440, 700, "select", MUT), (700, 740, "A", SIG)], True)
    o.append(T(X(450), 188, "起きた順に、すぐ扱える（何も無い間は眠っている）", "middle", 10, GRN, True))
    for t in range(0, 1001, 200):
        o.append(W(X(t), 198, X(t), 202, c=MUT, lw=1))
        o.append(T(X(t), 214, "%d ms" % t, "middle", 9, MUT))
    o.append(W(x0, 198, x1, 198, c=MUT, lw=1))
    return SVG(700, 224, o, "1 つの通信タスクが、2 つのソケット A・B と期限を扱う場合。(a) ブロッキングの recv で A だけを待つと、先に起きた B のデータと期限が後回しになる。(b) select は、いくつものソケットが読める・書けるようになるか、期限が来るまで待ち、戻ったら起きたものから扱う。select が待てるのはソケット（ファイル記述子）だけである。")
F["e11_select"] = _f11_select()


def _f11_mini(o, cx, y0, y1, la="機器", lb="相手", d=46):
    xa, xb = cx - d, cx + d
    for x, n, c in ((xa, la, SIG), (xb, lb, GRN)):
        o.append(RECT(x - 26, y0, 52, 18, 5, soft(c), c, 1.1))
        o.append(T(x, y0 + 13, n, "middle", 9.5, c, True))
        o.append(W(x, y0 + 18, x, y1, c=c, lw=1.1, dash="3 4"))
    return xa, xb


def _f11_marr(o, xa, xb, y, lab, c, back=False, lost=False, lsz=9.5):
    x1, x2 = (xb, xa) if back else (xa, xb)
    if lost:
        fx = x1 + (x2 - x1) * 0.62
        o.append(W(x1, y, fx, y + 3, c=ALI, lw=1.5, dash="4 3"))
        o.append(W(fx - 4, y - 1, fx + 4, y + 7, c=ALI, lw=1.8))
        o.append(W(fx - 4, y + 7, fx + 4, y - 1, c=ALI, lw=1.8))
        c = ALI
    else:
        o.append(ARR(x1, y, x2, y + 6, c=c, lw=1.5, head=6))
    o.append(T((xa + xb) / 2, y - 4, lab, "middle", lsz, c, True))


def _f11_nbconnect():
    o = []
    o.append(T(350, 18, "connect は −1 を返し、errno は EINPROGRESS（SYN を送ったところ）", "middle", 11, INK, True))
    cols = [(118, "(1) つながる", GRN), (350, "(2) 拒まれる", ALI), (582, "(3) 答えが無い", TEA)]
    for cx, t, c in cols:
        o.append(T(cx, 44, t, "middle", 11, c, True))
    xa, xb = _f11_mini(o, 118, 54, 160)
    _f11_marr(o, xa, xb, 92, "SYN", GRN)
    _f11_marr(o, xa, xb, 118, "SYN + ACK", GRN, back=True)
    _f11_marr(o, xa, xb, 144, "ACK", GRN)
    xa, xb = _f11_mini(o, 350, 54, 160)
    _f11_marr(o, xa, xb, 92, "SYN", GRN)
    _f11_marr(o, xa, xb, 118, "RST", ALI, back=True)
    xa, xb = _f11_mini(o, 582, 54, 160)
    _f11_marr(o, xa, xb, 92, "SYN", GRN, lost=True)
    _f11_marr(o, xa, xb, 124, "SYN（送り直し）", GRN, lost=True)
    res = [(118, ["select: 書ける", "SO_ERROR = 0", "→ つながった"], GRN),
           (350, ["select: 書ける", "SO_ERROR = ECONNREFUSED", "→ 失敗（4 節）"], ALI),
           (582, ["select: 期限で 0 を返す", "→ close して、", "ETIMEDOUT として扱う"], TEA)]
    for cx, ls, c in res:
        for k, l in enumerate(ls):
            o.append(T(cx, 182 + k * 15, l, "middle", 10, c, k == 0))
    return SVG(700, 232, o, "ノンブロッキングの connect の 3 つの結末。SYN+ACK か RST が返れば、select は「書ける」を返し、getsockopt で SO_ERROR を読むと結果（0 か、失敗の理由）が分かる。何も返らなければ、select は自分で決めた期限で 0 を返す。")
F["e11_nbconnect"] = _f11_nbconnect()


# ---- 4 節: エラー ----
def _f11_errors():
    o = []
    cols = [("ECONNREFUSED", "接続を拒まれた", ALI), ("ETIMEDOUT", "応答が無い", TEA), ("ECONNRESET", "接続中に RST", ALI),
            ("EPIPE", "壊れた接続に送る", ALI), ("recv が 0", "相手が送り終えた", GRN)]
    w = 136
    for i, (n, sub, c) in enumerate(cols):
        cx = 10 + w * i + w / 2
        o.append(T(cx, 20, n, "middle", 10.5, c, True, True))
        o.append(T(cx, 36, sub, "middle", 9.5, MUT))
        xa, xb = _f11_mini(o, cx, 44, 150, d=38)
        if i == 0:
            _f11_marr(o, xa, xb, 82, "SYN", GRN)
            _f11_marr(o, xa, xb, 110, "RST", ALI, back=True)
            res = ["connect が −1"]
        elif i == 1:
            _f11_marr(o, xa, xb, 80, "SYN", GRN, lost=True)
            _f11_marr(o, xa, xb, 102, "SYN", GRN, lost=True)
            _f11_marr(o, xa, xb, 124, "SYN", GRN, lost=True)
            res = ["connect が −1", "（データの再送でも）"]
        elif i == 2:
            _f11_marr(o, xa, xb, 82, "データ", GRN)
            _f11_marr(o, xa, xb, 110, "RST", ALI, back=True)
            res = ["recv・send が −1"]
        elif i == 3:
            _f11_marr(o, xa, xb, 82, "RST", ALI, back=True)
            o.append(T(xa + 2, 120, "send", "middle", 9.5, ALI, True, True))
            o.append(W(xa + 12, 128, xa + 22, 138, c=ALI, lw=1.6))
            o.append(W(xa + 12, 138, xa + 22, 128, c=ALI, lw=1.6))
            o.append(T(xa + 30, 137, "出ない", "start", 9, ALI))
            res = ["send が −1", "SIGPIPE も来る"]
        else:
            _f11_marr(o, xa, xb, 96, "FIN", GRN, back=True)
            res = ["recv が 0", "（エラーではない）"]
        for k, l in enumerate(res):
            o.append(T(cx, 170 + k * 15, l, "middle", 10, cols[i][2], k == 0))
    return SVG(700, 204, o, "よく見るエラーと、それを生むパケットの出来事。ECONNREFUSED は SYN に RST が返ったとき、ETIMEDOUT は送り直しても応答が無かったとき、ECONNRESET は接続の途中で RST が届いたとき、EPIPE は壊れた接続に送ったとき（パケットは出ない）。recv の 0 は相手の FIN で、エラーではない。")
F["e11_errors"] = _f11_errors()


# ---- 5 節: UDP ----
def _f11_dgram():
    o = []
    def blocks(x, y, items, unit=9):
        xx = x
        for name, L, c, lab in items:
            o.append(RECT(xx, y, L * unit, 24, 3, soft(c), c, 1.2))
            o.append(T(xx + L * unit / 2, y + 16, lab or name, "middle", 9.5, c, True))
            xx += L * unit + 6
    o.append(T(175, 20, "TCP（send ×3）", "middle", 11.5, GRN, True))
    o.append(T(525, 20, "UDP（sendto ×3）", "middle", 11.5, GRN, True))
    blocks(30, 34, [("A", 8, SIG, None), ("B", 14, PUR, None), ("C", 7, GLD, None)])
    blocks(380, 34, [("A", 8, SIG, None), ("B", 14, PUR, None), ("C", 7, GLD, None)])
    o.append(T(175, 84, "バイトの列として、順に全部届く", "middle", 10, MUT))
    o.append(ARR(175, 64, 175, 104, c=GRN, lw=1.6))
    # UDP: B は失われ、C が A を追い越す
    o.append(ARR(416, 62, 470, 104, c=SIG, lw=1.5))
    o.append(W(503, 62, 530, 82, c=ALI, lw=1.5, dash="4 3"))
    o.append(W(526, 78, 534, 86, c=ALI, lw=1.8) + W(526, 86, 534, 78, c=ALI, lw=1.8))
    o.append(T(552, 78, "B は失われる", "start", 9.5, ALI, True))
    o.append(ARR(620, 62, 400, 104, c=GLD, lw=1.5))
    o.append(T(552, 94, "C が A を追い越す", "start", 9.5, GLD, True))
    # 受け手
    o.append(T(14, 128, "受け手", "start", 10, INK, True))
    o.append(RECT(30, 112, 8 * 9 + 6 * 9, 24, 3, PAN, TEA, 1.4))
    o.append(T(30 + 63, 128, "A と B の前半", "middle", 9.5, TEA, True))
    o.append(RECT(30 + 126 + 6, 112, 8 * 9 + 7 * 9, 24, 3, PAN, TEA, 1.4))
    o.append(T(162 + 67.5, 128, "B の残りと C", "middle", 9.5, TEA, True))
    o.append(T(30, 152, "recv 1 回目", "start", 9, TEA))
    o.append(T(162, 152, "recv 2 回目", "start", 9, TEA))
    o.append(RECT(380, 112, 7 * 9, 24, 3, GSOFT, GLD, 1.4))
    o.append(T(380 + 31.5, 128, "C", "middle", 9.5, GLD, True))
    o.append(RECT(380 + 63 + 6, 112, 8 * 9, 24, 3, SSOFT, SIG, 1.4))
    o.append(T(449 + 36, 128, "A", "middle", 9.5, SIG, True))
    o.append(T(380, 152, "recvfrom 1 回目", "start", 9, GLD))
    o.append(T(470, 152, "2 回目", "start", 9, SIG))
    o.append(BOX(14, 166, 322, 50, None, "区切りは失われる（長さの欄で自分で区切る）。失われたら TCP が送り直し、順番もそろえる。", GRN, GSOFT, INK, ssz=10, sc=INK))
    o.append(BOX(364, 166, 322, 50, None, "1 回の recvfrom が 1 つのデータグラムを丸ごと返す。ただし、失われることも順番が変わることもある。", GRN, GSOFT, INK, ssz=10, sc=INK))
    return SVG(700, 228, o, "同じ 3 つのメッセージを TCP と UDP で送る。TCP はバイトの列を順に全部届けるが、区切りは保たれない。UDP は 1 回の sendto が 1 つのデータグラムになり、受け手の 1 回の recvfrom がそれを丸ごと返すが、届く保証も順番の保証もない。")
F["e11_dgram"] = _f11_dgram()


def _f11_udparq():
    o = []
    xa, xb = 190, 520
    o.append(RECT(xa - 70, 10, 140, 26, 7, SSOFT, SIG, 1.3))
    o.append(T(xa, 28, "機器（クライアント）", "middle", 11, SIG, True))
    o.append(RECT(xb - 50, 10, 100, 26, 7, GSOFT, GRN, 1.3))
    o.append(T(xb, 28, "サーバ", "middle", 11, GRN, True))
    yend = 452
    o.append(W(xa, 36, xa, yend, c=SIG, lw=1.1, dash="3 4"))
    o.append(W(xb, 36, xb, yend, c=GRN, lw=1.1, dash="3 4"))

    def arr(y1, y2, frm_a, lab, c, lost=False, lab_at=None, lsz=10):
        x1, x2 = (xa, xb) if frm_a else (xb, xa)
        if lost:
            fx, fy = x1 + (x2 - x1) * 0.6, y1 + (y2 - y1) * 0.6
            o.append(W(x1, y1, fx, fy, c=ALI, lw=1.5, dash="5 3"))
            o.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=1.9) + W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=1.9))
        else:
            o.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=6))
        lx, ly = lab_at if lab_at else ((xa + xb) / 2, min(y1, y2) - 4)
        o.append(T(lx, ly, lab, "middle", lsz, ALI if lost else c, True))

    def brace(y1, y2, lab):
        x = xa - 12
        o.append(W(x, y1, x - 6, y1, x - 6, y2, x, y2, c=TEA, lw=1.3))
        o.append(T(x - 10, (y1 + y2) / 2 + 4, lab, "end", 9.5, TEA))

    def note(x, y, txt, c, a="start"):
        o.append(T(x, y, txt, a, 9.5, c, True))
    # 1: 要求が失われる
    arr(58, 66, True, "要求 #1", SIG, lost=True)
    brace(58, 104, "250 ms 待つ")
    arr(104, 112, True, "要求 #1（送り直し）", SIG)
    arr(118, 126, False, "応答 #1", GRN)
    note(xa - 8, 140, "受け取る", GRN, "end")
    # 2: 応答が失われる
    arr(160, 168, True, "要求 #2", SIG)
    arr(174, 182, False, "応答 #2", GRN, lost=True)
    brace(160, 206, "250 ms 待つ")
    arr(206, 214, True, "要求 #2（送り直し）", SIG)
    note(xb + 8, 218, "同じ要求を 2 回処理する", GRN)
    arr(222, 230, False, "応答 #2", GRN)
    note(xa - 8, 244, "受け取る", GRN, "end")
    # 3: 応答が遅れる
    arr(264, 272, True, "要求 #3", SIG)
    o.append(ARR(xb, 280, xa, 352, c=GRN, lw=1.6, head=6))
    o.append(T(xb - 60, 300, "応答 #3（遅れる）", "middle", 10, GRN, True))
    brace(264, 310, "250 ms 待つ")
    arr(310, 318, True, "要求 #3（送り直し）", SIG, lab_at=(285, 306))
    note(xa - 8, 360, "1 回目への応答 #3 を受け取る", GRN, "end")
    o.append(ARR(xb, 326, xa, 412, c=MUT, lw=1.5, head=6, dash="5 3"))
    o.append(T(xb + 8, 334, "送り直しへの応答 #3（遅れる）", "start", 9.5, MUT, True))
    arr(376, 384, True, "要求 #4", SIG, lab_at=(420, 374))
    arr(390, 400, False, "応答 #4", GRN, lab_at=(440, 395))
    note(xa - 8, 404, "応答 #4 を受け取る", GRN, "end")
    note(xa - 8, 420, "#3 は番号が違うので捨てる", ALI, "end")
    o.append(T(350, 446, "番号を見れば、遅れて届いた古い応答を、いまの要求への応答と取り違えない", "middle", 10, INK))
    return SVG(700, 462, o, "UDP の要求と応答に番号を付け、時間切れで送り直す（待ち時間は 250 ms から倍々）。要求が失われても、応答が失われても、送り直しで届く。応答が失われた場合は、サーバに同じ要求が 2 回届く。遅れた応答は、次の要求を待っている間に届くことがあるので、番号が違うものは捨てる。")
F["e11_udparq"] = _f11_udparq()


# ---- 6 節: lwIP ----
def _f11_lwip():
    o = []
    o.append(BOX(40, 14, 190, 50, "測定のタスク", "ソケット API を呼ぶ", PUR, PSOFT, PUR, sz=11.5, ssz=9.5))
    o.append(BOX(250, 14, 190, 50, "設定のタスク", "netconn API を呼ぶ", PUR, PSOFT, PUR, sz=11.5, ssz=9.5))
    o.append(RECT(16, 92, 668, 150, 10, GSOFT, GRN, 1.6))
    o.append(T(28, 110, "tcpip スレッド（スタックの処理はすべてこの中で、1 つずつ行う）", "start", 11, GRN, True))
    # メールボックス
    o.append(T(96, 136, "メールボックス", "middle", 10, INK, True))
    o.append(T(96, 150, "（RTOS のキュー）", "middle", 9, MUT))
    for k in range(4):
        o.append(RECT(46 + k * 26, 160, 22, 26, 3, PAN, GLD, 1.2))
    o.append(T(96, 204, "依頼・受信・タイマを", "middle", 9, MUT))
    o.append(T(96, 217, "1 つずつ取り出す", "middle", 9, MUT))
    o.append(ARR(154, 173, 196, 173, c=GRN, lw=1.6))
    o.append(BOX(200, 124, 280, 104, "スタックの中身", "TCP・UDP・IP・ARP・DHCP・DNS、接続ごとの状態とバッファ。排他の鍵は持たない", GRN, PAN, GRN, sz=11.5, ssz=9.5))
    o.append(BOX(494, 124, 176, 46, "タイマ", "再送・遅延 ACK など", TEA, TSOFT, TEA, sz=10.5, ssz=9))
    o.append(BOX(494, 178, 176, 50, "raw API のコールバック", "アプリケーションのコード", PUR, PSOFT, PUR, sz=10.5, ssz=9))
    o.append(BOX(40, 278, 260, 50, "ドライバ（受信のタスクなど）", "フレームを pbuf に入れて渡す", SIG, SSOFT, SIG, sz=11, ssz=9.5))
    o.append(BOX(420, 278, 250, 50, "MAC・DMA（ハードウェア）", "割り込みで受信を知らせる", MUT, MSOFT, INK, sz=11, ssz=9.5))
    o.append(ARR(135, 64, 90, 157, c=PUR, lw=1.5))
    o.append(T(102, 84, "依頼", "end", 9.5, PUR, True))
    o.append(ARR(345, 64, 132, 157, c=PUR, lw=1.5))
    o.append(T(250, 84, "依頼", "start", 9.5, PUR, True))
    o.append(ARR(110, 278, 100, 189, c=SIG, lw=1.5))
    o.append(T(114, 262, "受信したフレーム", "start", 9.5, SIG, True))
    o.append(ARR(340, 228, 420, 290, c=GRN, lw=1.5))
    o.append(T(392, 252, "送るフレーム", "start", 9.5, GRN, True))
    o.append(DARR(300, 314, 418, 314, c=MUT, lw=1.3))
    # 誤った呼び方
    o.append(W(200, 40, 470, 40, 470, 120, c=ALI, lw=1.5, dash="5 4"))
    o.append(_head(470, 100, 470, 122, ALI, 7))
    o.append(W(464, 72, 476, 84, c=ALI, lw=2) + W(464, 84, 476, 72, c=ALI, lw=2))
    o.append(T(484, 62, "ほかのタスクから raw API を", "start", 9.5, ALI, True))
    o.append(T(484, 76, "直接呼ばない（スタックが壊れる）", "start", 9.5, ALI, True))
    return SVG(700, 340, o, "RTOS の上の lwIP の構成。スタックの中身を読み書きするのは tcpip スレッドだけで、アプリケーションのタスクからの依頼、ドライバからの受信したフレーム、タイマは、メールボックスを通して 1 つずつ処理される。raw API のコールバックも tcpip スレッドの中で動く。ほかのタスクが raw API を直接呼ぶと、tcpip スレッドと同時にスタックの中身を書き換えて壊すおそれがある。")
F["e11_lwip"] = _f11_lwip()


def _f11_sockcall():
    o = []
    o.append(T(175, 18, "LWIP_TCPIP_CORE_LOCKING = 0", "middle", 10.5, INK, True, True))
    o.append(T(525, 18, "LWIP_TCPIP_CORE_LOCKING = 1", "middle", 10.5, INK, True, True))
    # 左: メールボックスで頼む
    xa, xb = 90, 260
    for x, n, c in ((xa, "アプリのタスク", PUR), (xb, "tcpip スレッド", GRN)):
        o.append(RECT(x - 56, 28, 112, 22, 6, soft(c), c, 1.2))
        o.append(T(x, 43, n, "middle", 10, c, True))
        o.append(W(x, 50, x, 236, c=c, lw=1.1, dash="3 4"))
    o.append(T(xa - 6, 72, "send(…)", "end", 9.5, PUR, True, True))
    o.append(ARR(xa, 78, xb, 88, c=PUR, lw=1.5, head=6))
    o.append(T(175, 74, "① 依頼をメールボックスへ", "middle", 9.5, PUR, True))
    o.append(T(xb + 6, 118, "② tcp_write・tcp_output", "start", 9.5, GRN, True, True))
    o.append(T(xb + 6, 132, "（データを写して送る）", "start", 9, MUT))
    o.append(ARR(xb, 158, xa, 168, c=GRN, lw=1.5, head=6))
    o.append(T(175, 154, "③ 終わったと知らせる", "middle", 9.5, GRN, True))
    o.append(W(xa - 10, 80, xa - 16, 80, xa - 16, 168, xa - 10, 168, c=TEA, lw=1.3))
    o.append(T(xa - 20, 128, "待つ", "end", 9.5, TEA, True))
    o.append(T(xa - 6, 192, "send が戻る", "end", 9.5, PUR, True))
    o.append(T(175, 222, "タスクの切り替えが 2 回要る", "middle", 10, MUT))
    # 右: 鍵を取って自分で呼ぶ
    xa, xb = 440, 610
    for x, n, c in ((xa, "アプリのタスク", PUR), (xb, "tcpip スレッド", GRN)):
        o.append(RECT(x - 56, 28, 112, 22, 6, soft(c), c, 1.2))
        o.append(T(x, 43, n, "middle", 10, c, True))
        o.append(W(x, 50, x, 236, c=c, lw=1.1, dash="3 4"))
    o.append(T(xa - 6, 72, "send(…)", "end", 9.5, PUR, True, True))
    o.append(RECT(xa - 4, 84, 8, 84, 2, GSOFT, GRN, 1.2))
    o.append(T(xa + 10, 96, "① 鍵を取る（LOCK_TCPIP_CORE）", "start", 9.5, GRN, True))
    o.append(T(xa + 10, 118, "② tcp_write・tcp_output を", "start", 9.5, GRN, True))
    o.append(T(xa + 10, 132, "自分のタスクの中で呼ぶ", "start", 9.5, GRN, True))
    o.append(T(xa + 10, 160, "③ 鍵を返す", "start", 9.5, GRN, True))
    o.append(T(xa - 6, 192, "send が戻る", "end", 9.5, PUR, True))
    o.append(T(xb, 120, "鍵がある間は", "middle", 9, MUT))
    o.append(T(xb, 134, "スタックに触れない", "middle", 9, MUT))
    o.append(T(525, 222, "どちらでも、スタックに触るのは同時に 1 つだけ", "middle", 10, MUT))
    return SVG(700, 244, o, "lwIP のソケット API の send を 1 回呼んだときの動き（設定 LWIP_TCPIP_CORE_LOCKING による）。0 なら、依頼をメールボックスに入れて tcpip スレッドに処理してもらい、終わるまで待つ。1 なら、スタック全体の鍵を取って、自分のタスクの中でスタックの関数を呼ぶ。どちらも、スタックの中身を同時に触るのは 1 つだけになる。")
F["e11_sockcall"] = _f11_sockcall()


# ---- 7 節: pbuf ----
def _f11_pbuf():
    o = []
    rows = [("(a) 受け取った 1514 バイトのフレーム（PBUF_POOL_BUFSIZE を 512 にした例）", [(512, 1514), (512, 1002), (490, 490)], False),
            ("(b) Ethernet・IP・TCP のヘッダ（54 バイト）を読んで外した後", [(458, 1460), (512, 1002), (490, 490)], True)]
    y = 18
    for title, ps, moved in rows:
        o.append(T(14, y + 4, title, "start", 11, INK, True))
        xs = [20, 250, 480]
        for k, (ln, tot) in enumerate(ps):
            x = xs[k]
            o.append(RECT(x, y + 14, 150, 58, 6, GSOFT, GRN, 1.3))
            o.append(T(x + 8, y + 30, "pbuf %d" % (k + 1), "start", 10, GRN, True))
            o.append(T(x + 8, y + 46, "len = %d" % ln, "start", 9.5, INK, False, True))
            o.append(T(x + 8, y + 62, "tot_len = %d" % tot, "start", 9.5, INK, False, True))
            o.append(T(x + 142, y + 30, "next", "end", 9, MUT, False, True))
            if k < 2:
                o.append(ARR(x + 150, y + 26, xs[k + 1] - 2, y + 26, c=GRN, lw=1.4))
            else:
                o.append(T(x + 142, y + 46, "→ NULL", "end", 9, MUT, False, True))
            # データの置き場所
            dy = y + 92
            o.append(RECT(x, dy, 150, 18, 2, SCR, LIN, 1))
            if k == 0:
                hw = 150 * 54 / 512
                o.append(RECT(x, dy, hw, 18, 2, MSOFT if moved else GOSOFT, MUT if moved else GLD, 1.1, dash="3 2" if moved else None))
                o.append(T(x + hw + 4, dy + 13, "データ" if moved else "← ヘッダ 54 + データ", "start", 9, INK))
                px = x + (hw if moved else 0)
            else:
                o.append(T(x + 6, dy + 13, "データ", "start", 9, INK))
                px = x
            o.append(ARR(px + 3, y + 72, px + 3, dy - 1, c=SIG, lw=1.3, head=5))
            o.append(T(px + 8, y + 85, "payload", "start", 8.5, SIG, False, True))
        y += 132
    o.append(T(14, y + 2, "tot_len = len + 次の pbuf の tot_len。ヘッダを外しても、データは写さず、payload をずらして len と tot_len を減らすだけ。", "start", 10, INK))
    return SVG(700, y + 14, o, "pbuf の連結。1 つの pbuf に入りきらないパケットは、next でつないだ何個かの pbuf に入る。各 pbuf の len はその pbuf のデータの長さ、tot_len はその pbuf から最後までの合計である。層を上がるときは、payload をヘッダの分だけ後ろへずらし、同じ pbuf を上の層に渡す。")
F["e11_pbuf"] = _f11_pbuf()


def _f11_zcopy():
    o = []
    o.append(T(14, 20, "送るとき: 先頭にヘッダの分の空き（54 バイト）を取った pbuf に、データ「T=23.5\\n」（7 バイト）を入れる", "start", 10.5, INK, True))
    unit = 6.4
    x0 = 150
    parts = [("Ethernet", 14, SIG), ("IP", 20, GLD), ("TCP", 20, GRN), ("データ", 7, PUR)]
    steps = [("アプリケーション", 3, "len = 7"), ("TCP が前に 20 バイト", 2, "len = 27"), ("IP が前に 20 バイト", 1, "len = 47"), ("Ethernet が前に 14 バイト", 0, "len = 61")]
    y = 40
    for title, first, lab in steps:
        o.append(T(x0 - 10, y + 15, title, "end", 10, INK))
        xx = x0
        for k, (n, b, c) in enumerate(parts):
            wd = b * unit
            if k >= first:
                o.append(RECT(xx, y, wd, 22, 2, soft(c), c, 1.2))
                o.append(T(xx + wd / 2, y + 15, n, "middle", 9.5, c, True))
            else:
                o.append(RECT(xx, y, wd, 22, 2, SCR, LIN, 1, dash="3 2"))
            xx += wd
        start = x0 + sum(b for _, b, _ in parts[:first]) * unit
        o.append(ARR(start, y - 6, start, y - 1, c=SIG, lw=1.3, head=5))
        o.append(T(xx + 10, y + 15, "payload を前へずらして書く・" + lab, "start", 9.5, SIG))
        y += 36
    o.append(T(x0, y + 8, "↑ ドライバ（DMA）は、この場所からそのまま送る。データは 1 回も写されない（ゼロコピー）。", "start", 10, GRN, True))
    o.append(T(x0, y + 26, "写す作りでは、層ごとに新しい場所を取ってヘッダとデータを写すので、RAM も時間も多く要る。", "start", 10, MUT))
    return SVG(700, y + 40, o, "送るときのゼロコピー。pbuf の先頭にヘッダの分の空きを取っておき、各層は payload を前にずらして、自分のヘッダを書き込む。データを写さずに、Ethernet のフレームが組み上がる。")
F["e11_zcopy"] = _f11_zcopy()


def _f11_ram():
    o = []
    p = Plot(150, 40, 430, 120, (0, 36), (0, 2))
    o.append(T(14, 22, "受信のプールと送信のヒープの RAM（そのほかに PCB・タスクのスタック・ドライバの領域が加わる）", "start", 10.5, INK, True))
    for v in range(0, 37, 6):
        xx = p.X(v)
        o.append(W(xx, 40, xx, 170, c=GRD, lw=1))
        o.append(T(xx, 184, "%d KB" % v, "middle", 9.5, MUT))
    cfg = [("小さな設定", "MSS 536・TCP_WND 2144・プール 8 個・MEM_SIZE 3 KB", 4864, 3072, "受信 ≤ 21440 B/s", "送信 ≤ 10720 B/s"),
           ("例の設定（2 接続）", "MSS 1460・TCP_WND 5840・プール 12 個・MEM_SIZE 16 KB", 18384, 16384, "受信 ≤ 58400 B/s（1 接続）", "送信 ≤ 58400 B/s（1 接続）")]
    y = 52
    for name, sub, pool, heap, r1, r2 in cfg:
        o.append(T(140, y + 13, name, "end", 10.5, INK, True))
        a = pool / 1024.0
        b = heap / 1024.0
        o.append(RECT(p.X(0), y, p.X(a) - p.X(0), 24, 3, GSOFT, GRN, 1.2))
        o.append(RECT(p.X(a), y, p.X(a + b) - p.X(a), 24, 3, PSOFT, PUR, 1.2))
        if p.X(a) - p.X(0) > 70:
            o.append(T((p.X(0) + p.X(a)) / 2, y + 16, "プール %.1f KB" % a, "middle", 9.5, GRN, True))
        if p.X(a + b) - p.X(a) > 70:
            o.append(T((p.X(a) + p.X(a + b)) / 2, y + 16, "ヒープ %.1f KB" % b, "middle", 9.5, PUR, True))
        o.append(T(p.X(a + b) + 6, y + 10, "計 %.1f KB" % (a + b), "start", 9.5, INK, True))
        o.append(T(p.X(a + b) + 6, y + 23, "", "start", 9, MUT))
        o.append(T(150, y + 38, sub, "start", 9, MUT))
        o.append(T(590, y + 10, r1, "start", 9, GRN))
        o.append(T(590, y + 23, r2, "start", 9, PUR))
        y += 58
    o.append(T(590, 40, "RTT 100 ms のとき", "start", 9, MUT, True))
    o.append(LEGEND(150, 206, [(GRN, "受信のプール（PBUF_POOL_SIZE × (PBUF_POOL_BUFSIZE + 16)）"), (PUR, "ヒープ（MEM_SIZE。送るデータの写しなど）")]))
    return SVG(700, 218, o, "lwIP の RAM の見積もりの例（32 ビットのマイコン、IPv4、Ethernet のヘッダ）。受信のプールは、受信ウィンドウの分の pbuf と余裕の分を持つ。速さの上限は、受信がウィンドウ ÷ RTT、送信が送信バッファ ÷ RTT で、RAM を増やすほど速く受け取れる。")
F["e11_ram"] = _f11_ram()
