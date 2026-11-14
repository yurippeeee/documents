# -*- coding: utf-8 -*-
# 14 章 HTTP と CoAP の図

# ---- 共通の小さな部品 ----
def _f14_crlf(o, x, y, sz=9, c=MUT):
    """行の終わりの CR LF の札（x は左端、y は文字のベースライン）。返り値は右端の x。"""
    s, w = CHIP(x, y, "CR LF", c, sz, pad=3)
    o.append(s)
    return x + w

def _f14_mono(o, x, y, s, c=INK, sz=11, b=False):
    """等幅の文字を置き、右端の x を返す。"""
    o.append(T(x, y, s, "start", sz, c, b, True))
    return x + len(s) * sz * 0.64

def _f14_lane(o, x, y0, y1, name, c, sz=10.5):
    bw = max(56, tw(name, sz) + 16)
    o.append(RECT(x - bw / 2, y0, bw, 24, 7, soft(c), c, 1.3))
    o.append(T(x, y0 + 16, name, "middle", sz, c, True))
    o.append(W(x, y0 + 24, x, y1, c=c, lw=1.2, dash="3 4"))

def _f14_msg(o, x1, y1, x2, y2, label=None, c=INK, lost=None, lsz=9.5, ldy=-5, mono=False, b=False):
    """矢印。lost=0〜1 で、その割合の位置で失われる（×）。"""
    if lost is not None:
        fx, fy = x1 + (x2 - x1) * lost, y1 + (y2 - y1) * lost
        o.append(W(x1, y1, fx, fy, c=ALI, lw=1.6, dash="5 3"))
        o.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=2))
        o.append(W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=2))
        c = ALI
    else:
        o.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=7))
    if label:
        o.append(T((x1 + x2) / 2, min(y1, y2) + ldy, label, "middle", lsz, c, b, mono))

def _f14_brace(o, x1, x2, y, label, c=MUT, sz=9.5, tc=None, up=False):
    """横の括弧（x1〜x2）と、その下（up=True なら上）の文字。"""
    d = -5 if up else 5
    o.append(W(x1, y, x1, y + d, x2, y + d, x2, y, c=c, lw=1.1))
    if label:
        o.append(T((x1 + x2) / 2, y + d + (-4 if up else sz + 2), label, "middle", sz, tc or c))

def _f14_vbar(o, x, y0, y1, c):
    """部分の色を示す縦の帯。"""
    o.append(RECT(x, y0, 5, y1 - y0, 2, c, "none", 0))

def _f14_spans(o, x, y, parts, sz=11):
    """parts = [(文字, 色, 太字), ...] を、1 つの等幅の text 要素で続けて書く（部分の間に余計な空きを作らない）。
    返り値は各部分の (左端, 右端) の推定値のリスト。"""
    k = 0.615
    pos, xx, sp = [], x, []
    for t, c, b in parts:
        w = len(t) * sz * k
        pos.append((xx, xx + w)); xx += w
        sp.append('<tspan fill="%s" font-weight="%s">%s</tspan>' % (c, "700" if b else "400", E(t)))
    o.append('<text x="%g" y="%g" text-anchor="start" font-size="%g" font-family="%s" xml:space="preserve">%s</text>'
             % (round(x, 2), round(y, 2), sz, MONO, "".join(sp)))
    if _CHECK:
        _BOXES.append((x, y - sz * 0.82, x + sum(len(t) for t, _, _ in parts) * sz * 0.6, y + sz * 0.22, "".join(t for t, _, _ in parts)))
    return pos

def _f14_sub(o, x, y, base, sub, a="middle", sz=10, c=INK, b=False):
    """添字付きの記号（T と 0 で T₀ など）。"""
    w = tw(base, sz) + tw(sub, sz * 0.72)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    o.append('<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s">%s'
             '<tspan dy="3" font-size="%g">%s</tspan></text>' % (round(x0, 2), y, sz, c, "700" if b else "400", E(base), sz * 0.72, E(sub)))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 3, base + sub))

# ---- 1 節: 要求と応答 ----
def _f14_msg_fig():
    o = []
    X, sz, lh = 46, 11, 24
    xa = 372                                  # 注釈の左端
    o.append(T(16, 20, "要求（機器 → サーバ）: 49 バイト", "start", 11.5, INK, True))
    y = 50
    p = _f14_spans(o, X, y, [("GET", PUR, True), (" ", INK, False), ("/dev/1/config", SIG, True), (" ", INK, False), ("HTTP/1.1", MUT, False)], sz)
    _f14_crlf(o, X + 26 * sz * 0.64 + 6, y)
    o.append(T(p[0][0], y + 15, "メソッド", "start", 9.5, PUR))
    o.append(T((p[2][0] + p[2][1]) / 2, y + 15, "パス", "middle", 9.5, SIG))
    o.append(T((p[4][0] + p[4][1]) / 2, y + 15, "版", "middle", 9.5, MUT))
    _f14_vbar(o, X - 16, y - 13, y + 18, PUR)
    o.append(T(xa, y, "要求行: 何を・どれに・どの版で", "start", 10.5, PUR, True))
    y2 = y + 30
    x = _f14_mono(o, X, y2, "Host: example.com", INK, sz)
    _f14_crlf(o, x + 6, y2)
    _f14_vbar(o, X - 16, y2 - 13, y2 + 5, SIG)
    o.append(T(xa, y2, "ヘッダ: 「名前: 値」の行。Host は必須", "start", 10.5, SIG, True))
    y3 = y2 + lh
    _f14_crlf(o, X, y3)
    _f14_vbar(o, X - 16, y3 - 13, y3 + 5, GLD)
    o.append(T(xa, y3, "空行: ヘッダの終わり（この要求に本文は無い）", "start", 10.5, GLD, True))
    y0 = y3 + 44
    o.append(T(16, y0, "応答（サーバ → 機器）: 123 バイト", "start", 11.5, INK, True))
    y = y0 + 30
    p = _f14_spans(o, X, y, [("HTTP/1.1", MUT, False), (" ", INK, False), ("200", GRN, True), (" ", INK, False), ("OK", MUT, False)], sz)
    _f14_crlf(o, X + 15 * sz * 0.64 + 6, y)
    o.append(T(p[2][0] - 2, y + 15, "ステータスコード", "start", 9.5, GRN))
    _f14_vbar(o, X - 16, y - 13, y + 18, PUR)
    o.append(T(xa, y, "ステータス行: 版・ステータスコード・理由の文字", "start", 10.5, PUR, True))
    hs = [("Date: Sat, 24 Oct 2026 06:28:35 GMT", "送った時刻"),
          ("Content-Type: application/json", "本文の形（JSON）"),
          ("Content-Length: 15", "本文のバイト数（2 節）")]
    yy = y + 30
    for i, (line, note) in enumerate(hs):
        x = _f14_mono(o, X, yy + i * lh, line, INK, sz)
        _f14_crlf(o, x + 6, yy + i * lh)
        o.append(T(xa + 14, yy + i * lh, note, "start", 10, MUT))
    _f14_vbar(o, X - 16, yy - 13, yy + 2 * lh + 5, SIG)
    o.append(W(xa + 4, yy - 10, xa, yy - 10, xa, yy + 2 * lh + 3, xa + 4, yy + 2 * lh + 3, c=SIG, lw=1.2))
    yb = yy + 3 * lh
    _f14_crlf(o, X, yb)
    _f14_vbar(o, X - 16, yb - 13, yb + 5, GLD)
    o.append(T(xa, yb, "空行: ここまでがヘッダ", "start", 10.5, GLD, True))
    yd = yb + lh + 4
    _f14_mono(o, X, yd, '{"interval":60}', GRN, sz, True)
    _f14_vbar(o, X - 16, yd - 13, yd + 5, GRN)
    o.append(T(xa, yd, "本文: 15 バイト（Content-Length のとおり）", "start", 10.5, GRN, True))
    o.append(T(xa - 10, yy + lh + 4, "ヘッダ", "end", 10.5, SIG, True))
    return SVG(700, yd + 18, o, "設定を読み出す HTTP/1.1 の要求と応答。どの行も CR LF（0x0D 0x0A）で終わり、何も書かない行（空行）でヘッダが終わる。応答では、空行の後に本文が続く。行頭の色の帯は、開始の行（紫）・ヘッダ（青）・空行（金）・本文（緑）を表す。")
F["e14_msg"] = _f14_msg_fig()

def _f14_status():
    o = []
    rows = [("1xx", MUT, "途中の知らせ", ["100 Continue", "101 Switching Protocols"], ["最後の応答を待つ", "（101 は 3 節の WebSocket で使う）"]),
            ("2xx", GRN, "成功", ["200 OK・201 Created", "204 No Content"], ["完了。201 は、作ったものの URL を", "Location の欄で返す"]),
            ("3xx", SIG, "別の場所へ", ["301 Moved Permanently", "307 Temporary Redirect"], ["Location の欄の URL へ要求し直す", "（扱えない機器は失敗とする）"]),
            ("4xx", ALI, "要求の誤り", ["400 Bad Request・401 Unauthorized", "404 Not Found・429 Too Many Requests"], ["要求を直すまで送り直さない", "（429 だけは、待ってから送り直す）"]),
            ("5xx", GLD, "サーバの失敗", ["500 Internal Server Error", "503 Service Unavailable"], ["間隔をあけて送り直す（指数バックオフ", "+ ジッタ。Retry-After の欄に従う）"])]
    xs = [16, 84, 186, 432]
    for i, h in enumerate(("分類", "意味", "例", "機器がすること")):
        o.append(T(xs[i], 18, h, "start", 10, MUT, True))
    y = 28
    for cls, c, mean, exl, acl in rows:
        h = 12 + 2 * 15
        o.append(RECT(10, y, 680, h, 5, soft(c), "none", 0, op=0.55))
        s, _ = CHIP(xs[0] + 2, y + h / 2 + 4, cls, c, 11, pad=6, mono=True)
        o.append(s)
        o.append(T(xs[1], y + h / 2 + 4, mean, "start", 10.5, c, True))
        for i, l in enumerate(exl):
            o.append(T(xs[2], y + 17 + i * 15, l, "start", 10, INK))
        for i, l in enumerate(acl):
            o.append(T(xs[3], y + 17 + i * 15, l, "start", 10, INK))
        y += h + 5
    return SVG(700, y + 4, o, "ステータスコードの 5 つの分類と、機器がすること。百の位で大きく振り分ける。4xx は要求の側の誤りなので送り直しても同じ結果になり、5xx はサーバの側の失敗なので、間隔をあけて送り直せば成功することがある。")
F["e14_status"] = _f14_status()

# ---- 2 節: 本文の終わり ----
def _f14_end3():
    o = []
    x0 = 152
    def seg(x, w, y, text, c, dash=None, fill=None):
        o.append(RECT(x, y, w, 26, 3, fill or soft(c), c, 1.2, dash))
        if text:
            o.append(T(x + w / 2, y + 17, text, "middle", 9.5, c if c != MUT else INK, True))
        return x + w
    rows = [("(a) Content-Length", GRN), ("(b) チャンク形式", GRN), ("(c) 全部届いた", ALI), ("(c) 途中で切れた", ALI)]
    y = 30
    o.append(T(x0, 16, "届くバイト（左から順に）", "start", 9.5, MUT))
    marks = []
    for i, (lab, c) in enumerate(rows):
        o.append(T(16, y + 17, lab, "start", 10.5, INK, True))
        x = x0
        x = seg(x, 84, y, "ヘッダと空行", SIG)
        if i == 0:
            x = seg(x, 150, y, "本文 15 バイト", GRN)
            x = seg(x, 150, y, "次の応答 HTTP/1.1 …", PUR)
            o.append(T(x0 + 3, y + 40, "Content-Length: 15 → 空行の後を 15 バイト読めばよい", "start", 9.5, GRN))
        elif i == 1:
            for t, w, cc in (("F", 22, GLD), ("15 バイト", 72, GRN), ("F", 22, GLD), ("15 バイト", 72, GRN), ("0", 22, GLD)):
                x = seg(x, w, y, t, cc)
            x = seg(x, 150, y, "次の応答 HTTP/1.1 …", PUR)
            o.append(T(x0 + 3, y + 40, "長さ 0 のチャンクで終わる → 次の応答を同じコネクションで読める", "start", 9.5, GRN))
        else:
            wbody = 300 if i == 2 else 170
            x = seg(x, wbody, y, "本文", ALI if i == 3 else MUT, fill=SCR if i == 2 else ASOFT)
            o.append(W(x + 4, y - 2, x + 4, y + 28, c=ALI, lw=2.2))
            o.append(T(x + 10, y + 17, "閉じた", "start", 9.5, ALI, True))
        marks.append((y + 19, i < 2))
        y += 54 if i < 2 else 36
    for ym, ok in marks:
        o.append(T(672, ym, "○" if ok else "×", "middle", 15, GRN if ok else ALI, True))
    o.append(T(x0 + 3, y + 2, "受け手には、どちらも「閉じたので本文が終わった」に見える。閉じたコネクションは次の要求に使えない。", "start", 9.5, ALI, True))
    return SVG(700, y + 16, o, "本文の終わりの 3 つの示し方。(a) と (b) は、本文が終わる位置がヘッダや長さの行から分かるので、次の応答を同じコネクションで読める。(c) は、コネクションが閉じた所を本文の終わりとするので、途中で切れた場合と区別できない（下の 2 段は悪い例）。")
F["e14_end3"] = _f14_end3()

def _f14_keep():
    o = []
    x, w = 130, 450
    tf = lambda t: "%d" % t
    rows = [("毎回張る", [(0, 1, "TCP", GRN), (1, 2, "TLS", TEA), (2, 3, "要求 1", PUR), (3, 4, "TCP", GRN), (4, 5, "TLS", TEA), (5, 6, "要求 2", PUR), (6, 7, "TCP", GRN), (7, 8, "TLS", TEA), (8, 9, "要求 3", PUR)], "3N = 9 往復", 9),
            ("使い続ける", [(0, 1, "TCP", GRN), (1, 2, "TLS", TEA), (2, 3, "要求 1", PUR), (3, 4, "要求 2", PUR), (4, 5, "要求 3", PUR)], "N + 2 = 5 往復", 5)]
    y = 22
    for i, (lab, segs, res, end) in enumerate(rows):
        o.append(T(16, y + 17, lab, "start", 11, INK, True))
        s, h = TIMEBAR(x, y, w, 0, 9, segs, h=26, sz=10, axis=(i == 1), tfmt=tf, ticks=list(range(0, 10)))
        o.append(s)
        o.append(T(x + w * end / 9 + 10, y + 17, res, "start", 10.5, PUR if i else ALI, True))
        y += 44
    o.append(T(x + w / 2, y + 22, "時間 [RTT]（N = 3 回の要求。TLS を使う場合。計算と送り出す時間は除く）", "middle", 10, MUT))
    o.append(LEGEND(x, y + 46, [(GRN, "TCP の 3 ウェイハンドシェイク"), (TEA, "TLS 1.3 のハンドシェイク"), (PUR, "要求と応答")]))
    return SVG(700, y + 58, o, "TLS を使うコネクションで 3 回の要求を送るときの往復の数。コネクションを毎回張ると、要求ごとに TCP と TLS のハンドシェイクで 2 往復が加わる。持続的接続で使い続けると、ハンドシェイクは最初の 1 回だけで済む。")
F["e14_keep"] = _f14_keep()

def _f14_chunk():
    o = []
    cw, ch = 25, 26
    x0 = 132
    enc = [("F", GLD), ("CR", GLD), ("LF", GLD)] + [(c, GRN) for c in "t=23.5,h=41.2"] + [("CR", GRN), ("LF", GRN), ("CR", MUT), ("LF", MUT)]
    enc2 = [("F", GLD), ("CR", GLD), ("LF", GLD)] + [(c, GRN) for c in "t=23.6,h=41.0"] + [("CR", GRN), ("LF", GRN), ("CR", MUT), ("LF", MUT)]
    enc3 = [("0", PUR), ("CR", PUR), ("LF", PUR), ("CR", PUR), ("LF", PUR)]
    rows = [("チャンク 1", enc), ("チャンク 2", enc2), ("最後のチャンク", enc3)]
    y = 18
    for k, (lab, cells) in enumerate(rows):
        o.append(T(x0 - 10, y + 17, lab, "end", 10.5, INK, True))
        for i, (t, c) in enumerate(cells):
            xx = x0 + i * cw
            small = len(t) > 1
            o.append(RECT(xx + 1, y, cw - 2, ch, 3, soft(c) if c != MUT else SCR, c, 1.0))
            o.append(T(xx + cw / 2, y + (16 if not small else 16.5), t, "middle", 11 if not small else 8.5, INK if not small else (c if c != MUT else MUT), not small, not small))
        if k < 2:
            _f14_brace(o, x0 + 2, x0 + 3 * cw - 2, y + ch + 4, "長さ 0xF = 15", GLD, 9.5)
            _f14_brace(o, x0 + 3 * cw + 2, x0 + 18 * cw - 2, y + ch + 4, "データ 15 バイト（中の CR LF もデータ）", GRN, 9.5)
            _f14_brace(o, x0 + 18 * cw + 2, x0 + 20 * cw - 2, y + ch + 4, "区切り", MUT, 9.5)
        else:
            _f14_brace(o, x0 + 2, x0 + 3 * cw - 2, y + ch + 4, "長さ 0", PUR, 9.5)
            _f14_brace(o, x0 + 3 * cw + 2, x0 + 5 * cw - 2, y + ch + 4, "空行", PUR, 9.5)
            o.append(T(x0 + 5 * cw + 12, y + 17, "← 長さ 0 で終わり。トレーラが無ければ、すぐに空行", "start", 9.5, PUR))
        y += ch + 34
    o.append(T(16, y + 6, "取り出す本文（30 バイト）:", "start", 10.5, INK, True))
    xx = _f14_mono(o, 200, y + 6, "t=23.5,h=41.2", GRN, 11, True)
    xx = _f14_crlf(o, xx + 4, y + 6, 9, GRN)
    xx = _f14_mono(o, xx + 4, y + 6, "t=23.6,h=41.0", GRN, 11, True)
    _f14_crlf(o, xx + 4, y + 6, 9, GRN)
    o.append(T(16, y + 28, "符号化した後は 45 バイト（増えた 15 バイト = 各チャンクの長さの行 3 と区切り 2、最後の 5）", "start", 10, MUT))
    return SVG(700, y + 40, o, "30 バイトの本文（測定値の記録 2 行）を、15 バイトずつのチャンクに分けたチャンク形式。各チャンクは 16 進の長さの行・データ・CR LF からなる。データの中の CR LF は、長さで読むのでデータとして扱われる。長さ 0 のチャンクと空行で本文が終わる。")
F["e14_chunk"] = _f14_chunk()

def _f14_ckfsm():
    o = []
    W_, H_ = 136, 46
    P = {"SIZE": (130, 106), "EXT": (130, 248), "DATA": (360, 106), "DCR": (586, 106),
         "TR": (360, 248), "TRL": (586, 248), "DONE": (360, 346)}
    o.append(STATE(*P["SIZE"], W_, H_, "長さの行", SIG, "CK_SIZE", start=True))
    o.append(STATE(*P["EXT"], W_, H_, "拡張", SIG, "CK_EXT"))
    o.append(STATE(*P["DATA"], W_, H_, "データ", GRN, "CK_DATA"))
    o.append(STATE(*P["DCR"], W_, H_, "データの後", GRN, "CK_DATA_CR"))
    o.append(STATE(*P["TR"], W_, H_, "トレーラ", PUR, "CK_TRAILER"))
    o.append(STATE(*P["TRL"], W_, H_, "トレーラの行", PUR, "CK_TRAILER_LINE"))
    o.append(STATE(*P["DONE"], W_, H_, "終わり", PUR, "CK_DONE", end=True))
    o.append(EDGE(198, 106, 292, 106, None, c=SIG))
    o.append(T(245, 98, "CR LF", "middle", 9.5, SIG))
    o.append(T(245, 126, "（長さ > 0）", "middle", 9.5, SIG))
    o.append(EDGE(428, 106, 518, 106, None, c=GRN))
    o.append(T(473, 98, "長さの分を", "middle", 9.5, GRN))
    o.append(T(473, 126, "渡した", "middle", 9.5, GRN))
    o.append(CARR(586, 83, 150, 83, bend=-0.16, c=GRN, lw=1.5))
    o.append(T(368, 34, "CR LF（次のチャンクの長さの行へ）", "middle", 9.5, GRN))
    o.append(EDGE(150, 129, 150, 225, None, c=SIG))
    o.append(T(158, 182, "; か空白", "start", 9.5, SIG))
    o.append(EDGE(186, 129, 300, 226, None, c=PUR))
    o.append(T(246, 166, "CR LF", "start", 9.5, PUR))
    o.append(T(246, 179, "（長さ = 0）", "start", 9.5, PUR))
    o.append(EDGE(428, 254, 518, 254, None, c=PUR))
    o.append(T(473, 270, "ほかの文字", "middle", 9.5, PUR))
    o.append(CARR(560, 225, 392, 225, bend=-0.2, c=PUR, lw=1.5))
    o.append(T(476, 200, "CR LF", "middle", 9.5, PUR))
    o.append(EDGE(360, 271, 360, 323, None, c=PUR))
    o.append(T(368, 302, "CR LF（空行）", "start", 9.5, PUR))
    o.append(SELF(100, 129, "16 進の数字", c=SIG, side="bottom"))
    o.append(T(130, 299, "拡張の後の CR LF は、", "middle", 9.5, SIG))
    o.append(T(130, 312, "長さの行の後と同じ所へ", "middle", 9.5, SIG))
    n, h = NOTE(474, 310, 214, ["形が規格と違えば、どの状態からでも", "誤り（CK_ERR）にして読むのをやめる"], ALI, 9.5)
    o.append(n)
    return SVG(700, 382, o, "チャンク形式の解析器の状態（括弧の中はコードの名前）。CR の後の LF は、どこでも CK_LF の状態で待ってから次の状態へ進む（図では「CR LF」とまとめて書いた）。データの状態では、中身を見ずに長さの分だけを上へ渡す。")
F["e14_ckfsm"] = _f14_ckfsm()

# ---- 3 節: REST ----
def _f14_url():
    o = []
    sz = 13
    parts = [("https", PUR, True), ("://", MUT, False), ("example.com", GLD, True), (":443", GRN, True),
             ("/dev/1/readings", SIG, True), ("?from=2026-10-24", TEA, True)]
    labs = ["スキーム", None, "ホスト名", None, "パス", "クエリ"]
    x, y = 60, 34
    p = _f14_spans(o, x, y, parts, sz)
    for (a, b), lab, (t, c, _) in zip(p, labs, parts):
        if lab:
            _f14_brace(o, a + 1, b - 2, y + 7, lab, c, 10)
    a, b = p[3]
    o.append(W(a + 1, y + 7, a + 1, y + 12, b - 2, y + 12, b - 2, y + 7, c=GRN, lw=1.1))
    o.append(W((a + b) / 2, y + 12, (a + b) / 2, y + 30, c=GRN, lw=1.1))
    o.append(T((a + b) / 2, y + 42, "ポート（省略可）", "middle", 10, GRN))
    y2 = 116
    o.append(T(16, y2 - 24, "要求ではこう書く（色が同じ部分が対応する）", "start", 10, MUT, True))
    _f14_spans(o, 60, y2, [("GET ", PUR, True), ("/dev/1/readings", SIG, True), ("?from=2026-10-24", TEA, True), (" HTTP/1.1", MUT, False)], 11.5)
    _f14_crlf(o, 60 + 44 * 11.5 * 0.64 + 6, y2)
    _f14_spans(o, 60, y2 + 26, [("Host: ", INK, False), ("example.com", GLD, True)], 11.5)
    _f14_crlf(o, 60 + 17 * 11.5 * 0.64 + 6, y2 + 26)
    o.append(T(16, y2 + 58, "https は TLS の上の HTTP（この節の後半）。ポートを省略すると、http は 80、https は 443 を使う。", "start", 10, MUT))
    return SVG(700, y2 + 70, o, "URL の部分（RFC 3986）。要求行にはパスとクエリを書き、ホスト名は Host の欄に書く。スキームとポートは、どのプロトコルで、どのポートへコネクションを張るかを決める。")
F["e14_url"] = _f14_url()

def _f14_rest():
    o = []
    res = [("/dev/1/config", "設定", [("GET", GRN, "→ 200 {\"interval\":60}"), ("PUT", GLD, "{\"interval\":30} → 204")]),
           ("/dev/1/temp", "最新の測定値", [("GET", GRN, "→ 200 {\"t\":23.5,\"h\":41.25}")]),
           ("/dev/1/readings", "測定値の記録の一覧", [("GET", GRN, "?from=2026-10-24 → 200 [ … ]"), ("POST", PUR, "{\"seq\":1024,\"t\":23.5,…} → 201")]),
           ("/dev/1/readings/1024", "記録 1 つ", [("GET", GRN, "→ 200 {\"seq\":1024,…}"), ("DELETE", ALI, "→ 204")]),
           ("/dev/1/cmd", "機器への命令", [("GET", GRN, "→ 200 {\"interval\":30}（あり）・204（なし）")])]
    o.append(T(20, 18, "リソース（URL のパス）", "start", 10, MUT, True))
    o.append(T(300, 18, "メソッドと、本文の例 → 応答", "start", 10, MUT, True))
    o.append(BOX(20, 28, 150, 30, "/dev/1", None, SIG, SSOFT, SIG, sz=11.5, mono=True))
    o.append(T(178, 48, "機器 1 番", "start", 10, SIG))
    y = 70
    xt = 34
    for k, (path, what, ms) in enumerate(res):
        h = 14 + 22 * len(ms)
        ind = 26 if k == 3 else 0
        ybox = y
        o.append(W(xt + ind, ybox - (12 if k != 3 else 8), xt + ind, ybox + h / 2, xt + ind + 14, ybox + h / 2, c=LIN, lw=1.3))
        o.append(RECT(xt + ind + 14, ybox + h / 2 - 22, 220 - ind, 44, 6, PAN, SIG, 1.2))
        o.append(T(xt + ind + 22, ybox + h / 2 - 4, path, "start", 10.5, SIG, True, True))
        o.append(T(xt + ind + 22, ybox + h / 2 + 13, what, "start", 9.5, MUT))
        for j, (m, c, ex) in enumerate(ms):
            yy = ybox + h / 2 - 11 * (len(ms) - 1) + 22 * j + 4
            s, wd = CHIP(300, yy, m, c, 10, pad=5, mono=True)
            o.append(s)
            o.append(T(300 + 58, yy, ex, "start", 10, INK, False, True))
        y += max(h, 48) + 10
    o.append(T(20, y + 8, "POST に成功すると、サーバは足した記録の URL を Location: /dev/1/readings/1024 の欄で返す。", "start", 10, PUR))
    return SVG(700, y + 20, o, "温湿度センサの機器 1 番のリソースの例。リソースは名詞のパスで表し、読む（GET）・置き換える（PUT）・足す（POST）・消す（DELETE）をメソッドで表す。本文は JSON で書く。")
F["e14_rest"] = _f14_rest()

def _f14_idem():
    o = []
    titles = [("(a) POST をそのまま送り直す", ALI), ("(b) PUT を送り直す", GRN), ("(c) POST に番号を入れる", GRN)]
    sums = [["同じ測定値が 2 つ記録される"], ["何回送っても状態は同じ（冪等）"], ["サーバが同じ番号を捨てる", "（15 章 4 節）"]]
    reqs = [("POST {\"t\":23.5}", "POST（送り直し）"), ("PUT {\"interval\":30}", "PUT（送り直し）"), ("POST {\"seq\":1024,…}", "POST（送り直し）")]
    acts = [(["1024 を", "足す"], ["1025 を", "足す"]), (["間隔を", "30 に"], ["間隔を", "30 に"]), (["1024 を", "足す"], ["1024 は", "ある"])]
    rsp = [("201", "201"), ("204", "204"), ("201", "201")]
    for i in range(3):
        px = 4 + i * 232
        xa, xb = px + 36, px + 168
        c0 = titles[i][1]
        o.append(T(px + 6, 18, titles[i][0], "start", 10.5, c0, True))
        _f14_lane(o, xa, 28, 218, "機器", SIG, 10)
        _f14_lane(o, xb, 28, 218, "サーバ", GRN, 10)
        _f14_msg(o, xa, 72, xb, 84, reqs[i][0], INK, lsz=9)
        for k, l in enumerate(acts[i][0]):
            o.append(T(xb + 6, 84 + k * 12, l, "start", 9, GRN))
        _f14_msg(o, xb, 104, xa, 116, rsp[i][0], GRN, lost=0.5, lsz=9)
        o.append(T(xa + 6, 138, "結果が分からない", "start", 9, ALI))
        _f14_msg(o, xa, 156, xb, 168, reqs[i][1], INK, lsz=9)
        bad = (i == 0)
        for k, l in enumerate(acts[i][1]):
            o.append(T(xb + 6, 168 + k * 12, l, "start", 9, ALI if bad else GRN, bad))
        _f14_msg(o, xb, 188, xa, 200, rsp[i][1], GRN, lsz=9)
        for k, l in enumerate(sums[i]):
            o.append(T(px + 116, 240 + k * 14, l, "middle", 10, c0, True))
    return SVG(700, 270, o, "応答（201・204）が失われ、機器が要求を送り直す場合（時間は上から下）。(a) POST は冪等でないので、同じ測定値が 2 回記録される。(b) PUT は何回処理しても状態が同じなので、送り直してよい。(c) POST でも、機器が付けた番号でサーバが重複を見分ければ、送り直してよい。")
F["e14_idem"] = _f14_idem()

def _f14_push():
    o = []
    x0, x1 = 150, 680
    X = lambda t: x0 + (x1 - x0) * t / 300.0
    rows = [("ポーリング", "T = 60 s ごとに問い合わせる"), ("コネクションを保つ", "WebSocket・MQTT")]
    y = 58
    for r, (lab, sub) in enumerate(rows):
        ys, yd = y, y + 52
        o.append(T(16, ys + 22, lab, "start", 11, INK, True))
        o.append(T(16, ys + 37, sub, "start", 9.5, MUT))
        o.append(T(x0 - 8, ys + 4, "サーバ", "end", 9.5, GRN))
        o.append(T(x0 - 8, yd + 4, "機器", "end", 9.5, SIG))
        o.append(W(x0, ys, x1, ys, c=GRN, lw=1.4))
        o.append(W(x0, yd, x1, yd, c=SIG, lw=1.4))
        for t in range(0, 301, 60):
            o.append(ARR(X(t) - 2, yd - 2, X(t) + 4, ys + 3, c=FNT, lw=1.2, head=5))
            if not (r == 0 and t == 120):
                o.append(ARR(X(t) + 8, ys + 3, X(t) + 13, yd - 3, c=FNT, lw=1.1, head=5))
        o.append(D(X(75), ys, PUR, 5))
        o.append(T(X(75), ys - 9, "命令ができる", "middle", 9.5, PUR, True))
        if r == 0:
            o.append(ARR(X(120) + 8, ys + 3, X(120) + 13, yd - 3, c=PUR, lw=2, head=6))
            o.append(DIM(X(75), ys - 28, X(120) + 8, ys - 28, None, c=PUR))
            o.append(T(X(120) + 16, ys - 24, "待ち 45 s（平均 T/2、最大 T）", "start", 9.5, PUR))
            o.append(T(X(120) + 16, yd + 16, "次の問い合わせへの応答で受け取る", "start", 9.5, PUR))
        else:
            o.append(ARR(X(75), ys + 3, X(75) + 5, yd - 3, c=PUR, lw=2, head=6))
            o.append(T(X(75) + 10, yd + 16, "すぐに届く", "start", 9.5, PUR, True))
            o.append(T(X(150), ys - 9, "灰色の往復: 変換表の行を保つキープアライブ", "start", 9.5, MUT))
        y += 116
    for t in range(0, 301, 60):
        o.append(T(X(t), y - 38, "%d s" % t, "middle", 9, MUT))
    return SVG(700, y - 26, o, "サーバから機器へ命令を届ける 2 つの方法。ポーリングでは、命令は次の問い合わせまで待たされる（間隔 T で平均 T/2、最大 T）。コネクションを保つ方法では、命令はすぐに届くが、NAT の変換表の行が消えないように、保持時間より短い間隔で何かを送り続ける。")
F["e14_push"] = _f14_push()

# ---- 4 節: CoAP ----
def _f14_bits(x, y, fields, bw=19, rh=30, sz=10):
    """32 ビットを 1 行にしたヘッダの図。fields = [(名前, ビット数, 色[, 破線]), ...]。返り値は (svg, 高さ, 1 行目の上端)。"""
    o = []
    for b in (0, 2, 4, 8, 16, 31):
        o.append(T(x + (b + 0.5) * bw, y + 9, str(b), "middle", 8.5, FNT, False, True))
    y0 = y + 14
    pos = 0
    for f in fields:
        name, nb, c = f[0], f[1], f[2]
        dash = f[3] if len(f) > 3 else None
        rem = nb
        while rem > 0:
            r, col = divmod(pos, 32)
            take = min(rem, 32 - col)
            xx, yy = x + col * bw, y0 + r * rh
            o.append(RECT(xx, yy, take * bw, rh, 3, soft(c), c, 1.2, dash))
            if take * bw >= tw(name, sz) + 4:
                o.append(T(xx + take * bw / 2, yy + rh / 2 + sz * 0.38, name, "middle", sz, c, True))
            pos += take; rem -= take
    rows = (pos + 31) // 32
    return "".join(o), (y0 - y) + rows * rh, y0

def _f14_hdr():
    o = []
    x = 64
    f = [("版", 2, PUR), ("型", 2, PUR), ("トークンの長さ", 4, PUR), ("コード", 8, PUR), ("メッセージ ID", 16, PUR),
         ("トークン（0〜8 バイト）", 32, SIG, "4 3"), ("オプション（0 個以上）", 32, GLD, "4 3"),
         ("0xFF", 8, MUT), ("ペイロード（あれば）", 24, GRN, "4 3")]
    s, h, y0 = _f14_bits(x, 16, f, bw=19, rh=30)
    o.append(s)
    o.append(T(x - 8, y0 + 19, "4 バイト", "end", 9.5, PUR, True))
    yb = y0 + 4 * 30 + 26
    o.append(T(16, yb, "型（2 ビット）", "start", 10.5, INK, True))
    xx = 120
    for t, c in (("0 CON: ACK を求める", SIG), ("1 NON: 求めない", SIG), ("2 ACK: 受け取った", GRN), ("3 RST: 処理できない", ALI)):
        cs, w = CHIP(xx, yb, t, c, 10, pad=5)
        o.append(cs); xx += w + 8
    yc = yb + 34
    o.append(T(16, yc, "コード（8 ビット）", "start", 10.5, INK, True))
    o.append(T(16, yc + 16, "c.dd と書く", "start", 9.5, MUT))
    bits = [0, 1, 0, 0, 0, 1, 0, 1]
    bx = 140
    for i, b in enumerate(bits):
        c = PUR if i < 3 else GLD
        o.append(RECT(bx + i * 24, yc - 14, 22, 24, 3, soft(c), c, 1.1))
        o.append(T(bx + i * 24 + 11, yc + 3, str(b), "middle", 11, INK, True, True))
    _f14_brace(o, bx + 1, bx + 3 * 24 - 3, yc + 13, "分類 2", PUR, 9.5)
    _f14_brace(o, bx + 3 * 24 + 1, bx + 8 * 24 - 3, yc + 13, "詳細 05", GLD, 9.5)
    o.append(T(bx + 8 * 24 + 14, yc + 3, "0x45 = 2.05 Content（HTTP の 200 にあたる）", "start", 10.5, INK))
    o.append(T(bx + 8 * 24 + 14, yc + 21, "0x01 = 0.01 GET、0x02 = 0.02 POST、0x84 = 4.04 Not Found", "start", 9.5, MUT))
    return SVG(700, yc + 46, o, "CoAP のメッセージの形（RFC 7252）。先頭の 4 バイトに、版（1）・型・トークンの長さ・コード・メッセージ ID が入る。その後に、トークン・オプション・0xFF・ペイロードが続く（破線の欄は長さが決まっていない）。コードは上位 3 ビットの分類と下位 5 ビットの詳細で、c.dd と書く。")
F["e14_hdr"] = _f14_hdr()

def _f14_opt():
    o = []
    y = 22
    o.append(T(16, y + 18, "1 つのオプション", "start", 10.5, INK, True))
    x = 132
    for t, w, c, dash in (("差分 4 ビット", 96, GLD, None), ("長さ 4 ビット", 96, GLD, None), ("差分の拡張 0〜2 バイト", 134, MUT, "4 3"), ("長さの拡張 0〜2 バイト", 134, MUT, "4 3"), ("値", 100, GRN, "4 3")):
        o.append(RECT(x, y, w, 28, 3, soft(c) if c != MUT else SCR, c, 1.2, dash))
        o.append(T(x + w / 2, y + 18, t, "middle", 9.5 if len(t) > 8 else 10, c if c != MUT else INK, True))
        x += w
    _f14_brace(o, 133, 323, y + 32, "頭の 1 バイト", GLD, 9.5)
    rules = [("0〜12", "そのまま 4 ビットに書く。拡張は無い"), ("13", "拡張 1 バイトに「値 − 13」を書く（13〜268）"),
             ("14", "拡張 2 バイトに「値 − 269」を書く（269〜65804）"), ("15", "使わない（0xFF はペイロードの始まりの印）")]
    yr = y + 70
    o.append(T(16, yr, "4 ビットの欄の値", "start", 10, MUT, True))
    for i, (a, b) in enumerate(rules):
        o.append(T(150, yr + i * 17, a, "middle", 10.5, GLD, True, True))
        o.append(T(190, yr + i * 17, b, "start", 10, INK))
    ye = yr + 4 * 17 + 24
    o.append(T(16, ye, "例: POST /dev/1/temp（JSON）のオプション", "start", 10.5, INK, True))
    hdr = ["番号", "名前", "前との差", "長さ", "頭", "値"]
    xs = [40, 92, 216, 290, 350, 410]
    for i, h_ in enumerate(hdr):
        o.append(T(xs[i], ye + 22, h_, "start", 9.5, MUT, True))
    rows = [("11", "Uri-Path", "11", "3", "B3", "64 65 76  \"dev\""),
            ("11", "Uri-Path", "0", "1", "01", "31  \"1\""),
            ("11", "Uri-Path", "0", "4", "04", "74 65 6D 70  \"temp\""),
            ("12", "Content-Format", "1", "1", "11", "32  （50 = JSON）")]
    for k, r in enumerate(rows):
        yy = ye + 42 + k * 20
        for i, v in enumerate(r):
            c = GLD if i == 4 else (GRN if i == 5 else INK)
            o.append(T(xs[i], yy, v, "start", 10, c, i == 4, i in (0, 2, 3, 4, 5)))
    yf = ye + 42 + 4 * 20 + 6
    o.append(T(16, yf, "並べたバイト: B3 64 65 76 01 31 04 74 65 6D 70 11 32（13 バイト）", "start", 10.5, INK, False))
    return SVG(700, yf + 12, o, "CoAP のオプションの書き方。番号の小さい順に並べ、1 つ前のオプションとの番号の差と、値の長さを、頭の 1 バイトの 4 ビットずつに書く。13 以上は拡張のバイトを足す。同じ番号が続くと差は 0 になる。")
F["e14_opt"] = _f14_opt()

def _f14_get():
    o = []
    req = [("41", PUR, "版 1・CON・トークン 1 バイト"), ("01", PUR, "コード 0.01 GET"), ("7D 34", PUR, "メッセージ ID"),
           ("71", SIG, "トークン"), ("B4", GLD, "Uri-Path（11）・長さ 4"), ("74 65 6D 70", GLD, "\"temp\"")]
    rsp = [("61", PUR, "版 1・ACK・トークン 1 バイト"), ("45", PUR, "コード 2.05 Content"), ("7D 34", PUR, "要求と同じメッセージ ID"),
           ("71", SIG, "要求と同じトークン"), ("C0", GLD, "Content-Format（12）・長さ 0（値 0 = 文字）"),
           ("FF", MUT, "ペイロードの始まり"), ("32 32 2E 35", GRN, "\"22.5\"")]
    def table(x, y, title, rows):
        o.append(T(x, y, title, "start", 10.5, INK, True))
        yy = y + 14
        for hx, c, t in rows:
            w = 32 if len(hx) == 2 else (56 if len(hx) == 5 else 90)
            o.append(RECT(x, yy, w, 22, 3, soft(c) if c != MUT else SCR, c, 1.1))
            o.append(T(x + w / 2, yy + 15, hx, "middle", 10, INK, True, True))
            o.append(T(x + 98, yy + 15, t, "start", 9.5, MUT))
            yy += 26
        return yy
    y1 = table(16, 20, "要求（ゲートウェイ → 機器、CON）: 10 バイト", req)
    y2 = table(366, 20, "応答（機器 → ゲートウェイ、ACK に載せる）: 11 バイト", rsp)
    yb = max(y1, y2) + 30
    o.append(T(16, yb, "同じ要求と応答を HTTP/1.1 で書くと（TCP のコネクションを張る前置きは別）", "start", 10, INK, True))
    bars = [("要求", "CoAP", 10, PUR, PSOFT), ("", "HTTP", 41, MUT, MSOFT), ("応答", "CoAP", 11, PUR, PSOFT), ("", "HTTP", 42, MUT, MSOFT)]
    yy = yb + 12
    for i, (lab, nm, v, c, f) in enumerate(bars):
        if lab:
            o.append(T(16, yy + 24, lab, "start", 10.5, INK, True))
        o.append(T(102, yy + 13, nm, "end", 9.5, c if c != MUT else INK, True))
        o.append(RECT(110, yy, v * 9, 18, 3, f, c, 1.1))
        o.append(T(110 + v * 9 + 6, yy + 13, "%d バイト" % v, "start", 9.5, c if c != MUT else INK, True))
        yy += 22 + (10 if i == 1 else 0)
    return SVG(700, yy + 8, o, "GET /temp の要求と、その応答のバイトの列（メッセージ ID 0x7D34、トークン 0x71 は例）。応答は要求への ACK に載せて返す（ピギーバック応答）。どちらも UDP のデータグラム 1 つに収まる。")
F["e14_get"] = _f14_get()

def _f14_piggy():
    o = []
    ttl = [("(a) ピギーバック応答", GRN), ("(b) 別に送る応答", GLD)]
    for i in range(2):
        px = 6 + i * 350
        o.append(T(px + 4, 18, ttl[i][0], "start", 11, ttl[i][1], True))
        xa, xb = px + 52, px + 280
        yend = 272 if i else 160
        _f14_lane(o, xa, 28, yend, "ゲートウェイ", SIG)
        _f14_lane(o, xb, 28, yend, "機器", GRN)
        if i == 0:
            _f14_msg(o, xa, 74, xb, 86, "CON 7D34  GET /temp", INK, mono=True)
            o.append(T((xa + xb) / 2, 101, "トークン 71", "middle", 9, MUT))
            _f14_msg(o, xb, 126, xa, 138, "ACK 7D34  2.05 \"22.5\"", GRN, mono=True)
            o.append(T((xa + xb) / 2, 153, "トークン 71（応答を ACK に載せる）", "middle", 9, MUT))
            o.append(T(px + 166, 186, "1 往復で要求と応答が済む", "middle", 10, GRN, True))
        else:
            _f14_msg(o, xa, 74, xb, 86, "CON 7D35  GET /temp", INK, mono=True)
            o.append(T((xa + xb) / 2, 101, "トークン 72", "middle", 9, MUT))
            _f14_msg(o, xb, 126, xa, 138, "ACK 7D35（空）", GLD, mono=True)
            o.append(T((xa + xb) / 2, 153, "再送を止めるためだけの ACK", "middle", 9, MUT))
            o.append(T(xb + 8, 174, "測り", "start", 9.5, GRN))
            o.append(T(xb + 8, 187, "終える", "start", 9.5, GRN))
            _f14_msg(o, xb, 196, xa, 208, "CON 23BB  2.05 \"22.5\"", GRN, mono=True)
            o.append(T((xa + xb) / 2, 223, "トークン 72（新しいメッセージ ID）", "middle", 9, MUT))
            _f14_msg(o, xa, 254, xb, 266, "ACK 23BB（空）", INK, mono=True)
            o.append(T(px + 166, 298, "トークンで要求と応答を結び付ける", "middle", 10, GLD, True))
    return SVG(700, 312, o, "CON の要求への応答の返し方（時間は上から下。メッセージ ID とトークンの値は例）。(a) すぐ答えられるときは、応答を ACK に載せる。(b) 時間がかかるときは、まず空の ACK でゲートウェイの再送を止め、応答は新しいメッセージ ID の CON で送る。要求と応答は、トークンで結び付ける。")
F["e14_piggy"] = _f14_piggy()

# ---- 5 節: 再送 ----
def _f14_backoff():
    o = []
    x0, x1 = 120, 680
    X = lambda t: x0 + (x1 - x0) * t / 100.0
    yt = 34
    bands = [(2, 3), (6, 9), (14, 21), (30, 45), (62, 93)]
    rows = [2.0, 2.5, 3.0]
    ytop, ybot = yt, yt + 3 * 46
    for a, b in bands:
        o.append(RECT(X(a), ytop - 8, X(b) - X(a), ybot - ytop + 8, 2, TSOFT, "none", 0))
    for k, T0 in enumerate(rows):
        y = yt + 20 + k * 46
        lab = " = %g s" % T0
        o.append('<text x="%g" y="%g" text-anchor="end" font-size="10.5" fill="%s" font-family="var(--sans)" font-weight="700">'
                 'T<tspan dy="3" font-size="7.6">0</tspan><tspan dy="-3">%s</tspan></text>' % (x0 - 10, y + 4, INK, lab))
        if _CHECK:
            _BOXES.append((x0 - 10 - tw("T0" + lab, 10.5), y + 4 - 9, x0 - 10, y + 4 + 5, "T0" + lab))
        o.append(W(x0, y, X(100), y, c=LIN, lw=1.2))
        ts = [0] + [(2 ** j - 1) * T0 for j in range(1, 5)]
        for j, t in enumerate(ts):
            o.append(D(X(t), y, SIG if j == 0 else GLD, 4.5))
        tg = 31 * T0
        o.append(W(X(tg) - 5, y - 5, X(tg) + 5, y + 5, c=ALI, lw=2.2))
        o.append(W(X(tg) - 5, y + 5, X(tg) + 5, y - 5, c=ALI, lw=2.2))
        if k == 1:
            labs = ["", "2T", "4T", "8T", "16T"]
            pts = ts + [tg]
            for j in range(2, 5):
                _f14_sub(o, (X(pts[j]) + X(pts[j + 1])) / 2, y - 8, labs[j], "0", "middle", 9.5, MUT)
    o.append(W(X(45), ytop - 14, X(45), ybot + 4, c=GLD, lw=1.4, dash="5 3"))
    o.append(W(X(93), ytop - 14, X(93), ybot + 4, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(X(45), ytop - 18, "45 s（MAX_TRANSMIT_SPAN）", "middle", 9.5, GLD, True))
    o.append(T(X(93), ytop - 18, "93 s", "middle", 9.5, ALI, True))
    ya = ybot + 18
    o.append(W(x0, ya, X(100), ya, c=MUT, lw=1.1))
    for t in range(0, 101, 10):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9, MUT))
    o.append(T((x0 + X(100)) / 2, ya + 32, "最初に送ってからの時間 [s]", "middle", 10, MUT))
    o.append(LEGEND(x0, ya + 54, [(SIG, "最初の送信"), (GLD, "再送（1〜4 回目）"), (ALI, "諦める（93 s 以内）"), (TEA, "最初の待ち時間が 2〜3 s でありうる範囲")]))
    return SVG(700, ya + 64, o, "CON の再送の時刻（ACK が 1 度も来ない場合）。最初の待ち時間 T<sub>0</sub> は 2〜3 s の乱数で、再送のたびに待ち時間を 2 倍にする。k 回目の再送は (2<sup>k</sup> − 1)T<sub>0</sub> の時刻で、最後（4 回目）の再送は 45 s 以内、諦めるのは 31T<sub>0</sub> ≤ 93 s（MAX_TRANSMIT_WAIT）である。")
F["e14_backoff"] = _f14_backoff()

def _f14_dedup():
    o = []
    ttl = [("(a) メッセージ ID を覚えない（悪い例）", ALI), ("(b) メッセージ ID を覚える（良い例）", GRN)]
    for i in range(2):
        px = 6 + i * 350
        o.append(T(px + 4, 18, ttl[i][0], "start", 10.5, ttl[i][1], True))
        xa, xb = px + 44, px + 220
        _f14_lane(o, xa, 28, 214, "機器", SIG)
        _f14_lane(o, xb, 28, 214, "サーバ", GRN)
        _f14_msg(o, xa, 70, xb, 82, "CON 7D35  POST", INK, mono=True)
        o.append(T(xb + 8, 86, "記録を足す", "start", 9.5, GRN))
        if i == 1:
            o.append(T(xb + 8, 99, "7D35 を覚える", "start", 9.5, GRN, True))
        _f14_msg(o, xb, 112, xa, 124, "ACK 7D35  2.01", GRN, lost=0.5, mono=True)
        o.append(T(xa - 6, 146, "2〜3 s", "end", 9, TEA))
        o.append(W(xa - 3, 78, xa - 3, 158, c=TEA, lw=1.2))
        _f14_msg(o, xa, 160, xb, 172, "CON 7D35（再送）", INK, mono=True)
        if i == 0:
            o.append(T(xb + 8, 176, "また足す", "start", 9.5, ALI, True))
            o.append(T(xb + 8, 189, "（2 つ目）", "start", 9.5, ALI, True))
        else:
            o.append(T(xb + 8, 176, "覚えている", "start", 9.5, GRN, True))
            o.append(T(xb + 8, 189, "→ 足さない", "start", 9.5, GRN, True))
        _f14_msg(o, xb, 196, xa, 208, "ACK 7D35  2.01", GRN, mono=True)
        o.append(T(px + 172, 238, "記録が 2 つになる" if i == 0 else "前と同じ ACK を返す。記録は 1 つ", "middle", 10, ttl[i][1], True))
        if i == 1:
            o.append(T(px + 172, 254, "247 s（EXCHANGE_LIFETIME）たったら忘れる", "middle", 9.5, MUT))
    return SVG(700, 266, o, "ACK が失われ、同じ CON が再送された場合（時間は上から下）。(a) 受け手がメッセージ ID を覚えていないと、同じ要求を 2 回処理する。(b) 送り手とメッセージ ID の組を覚えていれば、2 回目は処理せずに、前と同じ ACK を返す。")
F["e14_dedup"] = _f14_dedup()

def _f14_obsblk():
    o = []
    px = 6
    o.append(T(px + 4, 18, "(a) Observe — 変わるたびに知らせる", "start", 10.5, PUR, True))
    xa, xb = px + 46, px + 290
    _f14_lane(o, xa, 28, 262, "クライアント", SIG)
    _f14_lane(o, xb, 28, 262, "サーバ", GRN)
    _f14_msg(o, xa, 70, xb, 82, "GET /temp  Observe: 0（登録）", INK)
    o.append(T((xa + xb) / 2, 97, "トークン 4A", "middle", 9, MUT))
    _f14_msg(o, xb, 120, xa, 132, "2.05  Observe: 27  \"22.5\"", GRN)
    o.append(T(xb - 8, 156, "温度が変わる", "end", 9.5, MUT))
    _f14_msg(o, xb, 176, xa, 188, "2.05  Observe: 28  \"22.9\"", GRN)
    _f14_msg(o, xb, 214, xa, 226, "2.05  Observe: 29  \"23.4\"", GRN)
    o.append(T((xa + xb) / 2, 250, "どの通知も同じトークン 4A。番号は増えていく", "middle", 9.5, PUR, True))
    o.append(T((xa + xb) / 2, 266, "NAT を通るなら、変換表の行を保ち続ける", "middle", 9.5, MUT))
    px = 356
    o.append(T(px + 4, 18, "(b) ブロック転送（Block2）— 分けて読む", "start", 10.5, GLD, True))
    xa, xb = px + 46, px + 290
    _f14_lane(o, xa, 28, 262, "クライアント", SIG)
    _f14_lane(o, xb, 28, 262, "サーバ", GRN)
    msgs = [(70, True, "GET /fw"), (100, False, "2.05  Block2: 0・続きあり（1024 B）"), (136, True, "GET /fw  Block2: 1"),
            (166, False, "2.05  Block2: 1・続きあり（1024 B）"), (202, True, "GET /fw  Block2: 2"), (232, False, "2.05  Block2: 2・最後（300 B）")]
    for y, up, t in msgs:
        if up:
            _f14_msg(o, xa, y, xb, y + 10, t, INK)
        else:
            _f14_msg(o, xb, y, xa, y + 10, t, GRN)
    return SVG(700, 278, o, "CoAP に後から加わった 2 つの仕組み（時間は上から下。値は例）。(a) Observe: 登録した後は、リソースが変わるたびに、サーバが同じトークンの応答（通知）を送る。(b) ブロック転送: 大きなペイロードを 16〜1024 バイトのブロックに分け、1 ブロックずつ要求と応答で運ぶ（B はバイト）。")
F["e14_obsblk"] = _f14_obsblk()

# ---- 6 節: 比べる ----
def _f14_bytes():
    o = []
    x0, sc = 214, 1.12
    rows = [("HTTP（POST → 204）", 68, 20, 78, [142, 84], "要求 166 + 応答 142 + ACK 84"),
            ("MQTT QoS 0", 14, 20, 78, [84], "PUBLISH 112 + ブローカの ACK 84"),
            ("MQTT QoS 1", 16, 20, 78, [84, 84], "PUBLISH 114 + PUBACK 84 + ACK 84"),
            ("CoAP NON", 19, 20, 66, [], "要求 105（確認応答なし）"),
            ("CoAP CON", 19, 20, 66, [84], "要求 105 + ACK 84")]
    y = 24
    o.append(T(x0, 14, "1 回の報告で線の上に出るバイト（07 章 5 節の数え方。データ 20 バイト）", "start", 10, MUT))
    for lab, hd, dt, lo, rep, note in rows:
        o.append(T(x0 - 10, y + 15, lab, "end", 10.5, INK, True))
        x = x0
        for v, c, fill in ((hd, PUR, PSOFT), (dt, INK, PAN), (lo, MUT, MSOFT)):
            o.append(RECT(x, y, v * sc, 22, 2, fill, c, 1.1))
            x += v * sc
        for v in rep:
            o.append(RECT(x, y, v * sc, 22, 2, GSOFT, GRN, 1.1))
            x += v * sc
        tot = hd + dt + lo + sum(rep)
        o.append(T(x + 6, y + 15, "%d" % tot, "start", 10.5, INK, True))
        o.append(T(x0, y + 36, note, "start", 9.5, MUT))
        y += 52
    o.append(LEGEND(x0 - 190, y + 6, [(PUR, "アプリケーション層のヘッダ"), (INK, "データ"), (MUT, "下の層のヘッダと線の上の分"), (GRN, "応答・確認応答")]))
    return SVG(700, y + 18, o, "同じ 20 バイトの測定値を名前 dev/1/temp で送ったときの、1 回の報告で線の上に出るバイト（IPv4・Ethernet）。紫の部分がアプリケーション層のヘッダの違いで、HTTP は 68 バイト、MQTT は 14〜16 バイト、CoAP は 19 バイト。応答や確認応答の小さなセグメント・データグラムは、詰め物をして 1 つ 84 バイト分になる。HTTP の応答は、Date の欄だけを付けた 204（64 バイト）とした。")
F["e14_bytes"] = _f14_bytes()
