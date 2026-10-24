# -*- coding: utf-8 -*-
# 10 章 TCP の図

# ---- この章の小さな部品 ----
def _f10_lane(o, x, y0, y1, name, c, sz=11, sub=None):
    """ライフライン（上に名前の箱、下へ破線）。sub は箱の下の小さな文字。"""
    bw = max(64, tw(name, sz) + 18)
    o.append(RECT(x - bw / 2, y0, bw, 26, 7, soft(c), c, 1.3))
    o.append(T(x, y0 + 17, name, "middle", sz, c, True))
    ys = y0 + 26
    if sub:
        o.append(T(x, y0 + 40, sub, "middle", 9.5, MUT, False, True))
        ys = y0 + 46
    o.append(W(x, ys, x, y1, c=c, lw=1.2, dash="3 4"))

def _f10_msg(o, x1, y1, x2, y2, label=None, c=INK, lost=None, dash=False, lsz=10, lpos=0.5, ldy=-5,
             la="middle", b=False, mono=False, sub=None, subdy=13, lc=None):
    """(x1, y1) から (x2, y2) への矢印。lost=0〜1 で、その割合の位置で失われる（×）。"""
    if lost is not None:
        fx, fy = x1 + (x2 - x1) * lost, y1 + (y2 - y1) * lost
        o.append(W(x1, y1, fx, fy, c=ALI, lw=1.6, dash="5 3"))
        o.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=2))
        o.append(W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=2))
        c = ALI
    else:
        o.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=7, dash="5 3" if dash else None))
    xm, ym = x1 + (x2 - x1) * lpos, y1 + (y2 - y1) * lpos
    if label:
        o.append(T(xm, ym + ldy, label, la, lsz, lc or c, b, mono))
    if sub:
        o.append(T(xm, ym + subdy, sub, la, lsz - 0.5, MUT, False, True))

def _f10_tag(o, x, y, text, c, a="end", sz=9.5):
    """状態の札。a="end" なら x が右端、"start" なら左端。y は文字のベースライン。"""
    w = tw(text, sz, True) + 10
    x0 = x - w if a == "end" else (x if a == "start" else x - w / 2)
    o.append(RECT(x0, y - sz - 1, w, sz + 6, 4, soft(c), c, 1.0))
    o.append(T(x0 + w / 2, y + 1.5, text, "middle", sz, c, True, True))
    return w

def _f10_span(o, x, y0, y1, label=None, c=TEA, side=-1, sz=9.5, lines=None):
    """ライフラインの横の括弧（待っている区間など）。"""
    xb = x + side * 7
    o.append(W(xb, y0, xb + side * 5, y0, xb + side * 5, y1, xb, y1, c=c, lw=1.3))
    ls = lines or ([label] if label else [])
    for i, l in enumerate(ls):
        o.append(T(xb + side * 9, (y0 + y1) / 2 + 4 + (i - (len(ls) - 1) / 2) * (sz + 3), l, "end" if side < 0 else "start", sz, c))

def _f10_note(o, x, y, lines, c, a="start", sz=9.5, b=False):
    """注記の箱。a は x の基準（start なら x が左端）。返り値は (幅, 高さ)。"""
    w = max(tw(l, sz) for l in lines) + 12
    h = len(lines) * sz * 1.4 + 7
    x0 = x - w if a == "end" else (x - w / 2 if a == "middle" else x)
    o.append(RECT(x0, y, w, h, 5, PAN, "none", 0))
    o.append(RECT(x0, y, w, h, 5, soft(c), c, 1))
    for i, l in enumerate(lines):
        o.append(T(x0 + w / 2, y + 3.5 + sz + i * sz * 1.4, l, "middle", sz, c, b))
    return w, h

# ---- 1 節: フラグ ----
def _f10_flags():
    o = []
    x0, bw, y = 62, 18, 30
    o.append(T(x0, 18, "TCP のヘッダの 4 行目（13〜16 バイト目。07 章 4 節の図）", "start", 10.5, MUT))
    xx = x0
    for name, nb, c in (("ヘッダ長", 4, GRN), ("予約", 4, MUT), ("フラグ", 8, GRN), ("ウィンドウ", 16, GRN)):
        o.append(RECT(xx, y, nb * bw, 26, 3, soft(c), c, 1.4 if name == "フラグ" else 1.1))
        o.append(T(xx + nb * bw / 2, y + 17, name, "middle", 10, c, True))
        xx += nb * bw
    ex0, ew, ye = 30, 80, 104
    o.append(W(x0 + 8 * bw, y + 26, ex0, ye - 16, c=FNT, lw=1, dash="3 3"))
    o.append(W(x0 + 16 * bw, y + 26, ex0 + 8 * ew, ye - 16, c=FNT, lw=1, dash="3 3"))
    names = [("CWR", "0x80"), ("ECE", "0x40"), ("URG", "0x20"), ("ACK", "0x10"), ("PSH", "0x08"), ("RST", "0x04"), ("SYN", "0x02"), ("FIN", "0x01")]
    key = ("ACK", "RST", "SYN", "FIN")
    for i, (nm, v) in enumerate(names):
        c = GRN if nm in key else MUT
        o.append(RECT(ex0 + i * ew, ye, ew, 34, 4, soft(c), c, 1.6 if nm in key else 1.0))
        o.append(T(ex0 + i * ew + ew / 2, ye + 22, nm, "middle", 12.5, c, nm in key, True))
        o.append(T(ex0 + i * ew + ew / 2, ye - 5, v, "middle", 9.5, FNT, False, True))
    # 4 つのフラグの意味
    yl = ye + 62
    rows = [("SYN", "コネクションを始め、自分の番号の始まり（ISN）を知らせる"),
            ("ACK", "確認応答番号の欄が有効（最初の SYN 以外は、すべてこれを立てる）"),
            ("FIN", "こちらからはもう送らない（7 節）"),
            ("RST", "コネクションを直ちに打ち切る（7 節）")]
    for i, (nm, t) in enumerate(rows):
        yy = yl + i * 22
        s, w = CHIP(40, yy, nm, GRN, 10.5, mono=True)
        o.append(s)
        o.append(T(40 + w + 10, yy, t, "start", 10.5, INK))
    o.append(T(40, yl + 4 * 22 + 4, "CWR・ECE: 混雑の通知（5 節） ／ URG: ほとんど使われない ／ PSH: 早く渡すよう求める（多くの実装が自動で付ける）", "start", 9.5, MUT))
    # よく見る組み合わせ
    yc = yl + 4 * 22 + 32
    o.append(T(40, yc, "よく見る値:", "start", 10, INK, True))
    xx = 120
    for t in ("SYN = 0x02", "SYN+ACK = 0x12", "ACK = 0x10", "FIN+ACK = 0x11", "RST = 0x04"):
        s, w = CHIP(xx, yc, t, GRN, 10, mono=True)
        o.append(s); xx += w + 10
    return SVG(700, yc + 14, o, "TCP のヘッダのフラグの 8 ビット。上の数は、フラグの欄の 1 バイトを 16 進で読んだときの各ビットの値。コネクションの始まりと終わりには、緑の 4 つ（SYN・ACK・FIN・RST）を使う。")
F["e10_flags"] = _f10_flags()

# ---- 1 節: なぜ 3 回か ----
def _f10_hs4to3():
    o = []
    for side in range(2):
        px = 6 + side * 350
        xa, xb = px + 52, px + 288
        title = "(a) 両方の向きで「知らせる・確かめる」と 4 つ" if side == 0 else "(b) ② と ③ を 1 つにまとめると 3 つ"
        o.append(T(px + 170, 18, title, "middle", 11, INK if side == 0 else GRN, True))
        _f10_lane(o, xa, 30, 236, "機器", SIG, 10.5)
        _f10_lane(o, xb, 30, 236, "サーバ", GRN, 10.5)
        if side == 0:
            _f10_msg(o, xa, 74, xb, 90, "① SYN（ISN = x）", INK)
            _f10_msg(o, xb, 112, xa, 128, "② ACK（確認応答番号 x + 1）", GRN)
            _f10_msg(o, xb, 150, xa, 166, "③ SYN（ISN = y）", INK)
            _f10_msg(o, xa, 190, xb, 206, "④ ACK（確認応答番号 y + 1）", GRN)
            o.append(RECT(xa + 26, 96, xb - xa - 52, 78, 6, "none", ALI, 1.2, dash="4 3"))
        else:
            _f10_msg(o, xa, 74, xb, 90, "① SYN（ISN = x）", INK)
            _f10_msg(o, xb, 124, xa, 140, "②③ SYN+ACK（ISN = y、確認応答番号 x + 1）", INK, lsz=9.5)
            _f10_msg(o, xa, 174, xb, 190, "④ ACK（確認応答番号 y + 1）", GRN)
    o.append(T(176, 258, "② と ③ はどちらもサーバから送るもので、", "middle", 10, ALI))
    o.append(T(176, 272, "① を受け取った時点で両方送れる（破線の枠）", "middle", 10, ALI))
    o.append(T(526, 258, "① は最初に要り、④ は ③ を受け取ってから", "middle", 10, GRN))
    o.append(T(526, 272, "でないと送れないので、3 つより減らせない", "middle", 10, GRN))
    return SVG(700, 284, o, "両端の ISN を知らせて確かめるのに要るセグメント。(a) 機器の ISN x とサーバの ISN y のそれぞれについて「知らせる」「確かめる」の 2 つが要り、合わせて 4 つになる。(b) サーバが送る ② と ③ を 1 つのセグメント（SYN+ACK）にまとめると 3 つで済む。これが 3 ウェイハンドシェイクである。")
F["e10_hs4to3"] = _f10_hs4to3()

# ---- 1 節: 3 ウェイハンドシェイクの例 ----
def _f10_hs():
    o = []
    xa, xb = 222, 500
    _f10_lane(o, xa, 12, 306, "機器", SIG, 11, sub="192.0.2.10:49500")
    _f10_lane(o, xb, 12, 306, "サーバ", GRN, 11, sub="203.0.113.5:1883")
    # 状態
    _f10_tag(o, xa - 10, 80, "CLOSED", SIG)
    _f10_tag(o, xb + 10, 80, "LISTEN", GRN, a="start")
    _f10_msg(o, xa, 100, xb, 124, "SYN", INK, b=True, sub="seq=1000 ・ MSS=1460", subdy=16)
    _f10_tag(o, xa - 10, 112, "SYN_SENT", SIG)
    _f10_msg(o, xb, 160, xa, 184, "SYN+ACK", INK, b=True, sub="seq=5000 ack=1001 ・ MSS=1460", subdy=16)
    _f10_tag(o, xb + 10, 172, "SYN_RECEIVED", GRN, a="start")
    _f10_msg(o, xa, 218, xb, 242, "ACK", GRN, b=True, sub="seq=1001 ack=5001", subdy=16)
    _f10_tag(o, xa - 10, 214, "ESTABLISHED", SIG)
    _f10_tag(o, xb + 10, 252, "ESTABLISHED", GRN, a="start")
    _f10_msg(o, xa, 270, xb, 294, "データ 300 バイト", SIG, b=True, sub="seq=1001 ack=5001", subdy=16)
    # 1 RTT
    o.append(DIM(70, 100, 70, 184, None, c=TEA))
    o.append(T(62, 146, "1 RTT", "end", 10, TEA, True))
    o.append(T(36, 326, "seq = シーケンス番号の欄、ack = 確認応答番号の欄。SYN は番号を 1 つ使うので、確認応答番号は ISN + 1 になる。", "start", 10, MUT))
    return SVG(700, 338, o, "3 ウェイハンドシェイクの例（ISN は読みやすいように小さな値にした。実際は予測しにくい 32 ビットの値）。両端は、SYN のオプションで受け取れる最大の大きさ（MSS）も知らせる。機器がデータを送れるのは、SYN を送ってから 1 RTT 後である。札は、各時点の両端の状態。")
F["e10_hs"] = _f10_hs()

# ---- 2 節: バイトの番号 ----
def _f10_bytes():
    o = []
    x0, y = 76, 52
    o.append(T(20, 18, "機器が書いた 300 バイトの列（ISN = 1000 の例）", "start", 11, INK, True))
    # SYN の分
    o.append(RECT(x0 - 58, y, 54, 40, 4, MSOFT, MUT, 1.1, dash="3 3"))
    o.append(T(x0 - 31, y + 17, "1000", "middle", 10, MUT, True, True))
    o.append(T(x0 - 31, y + 31, "SYN が使う", "middle", 9, MUT))
    sw = 186
    segs = [("1001", "1101"), ("1101", "1201"), ("1201", "1301")]
    for i, (a, b) in enumerate(segs):
        xx = x0 + i * sw
        o.append(RECT(xx, y, sw, 40, 4, SSOFT, SIG, 1.4))
        o.append(T(xx + sw / 2, y + 17, "セグメント %d" % (i + 1), "middle", 10.5, SIG, True))
        o.append(T(xx + sw / 2, y + 32, "seq=%s ・ 100 バイト" % a, "middle", 9.5, INK, False, True))
        o.append(T(xx, y - 6, a, "middle", 9.5, MUT, False, True))
    o.append(T(x0 + 3 * sw, y - 6, "1301", "middle", 9.5, MUT, False, True))
    # ACK
    ya = y + 62
    for i, (a, b) in enumerate(segs):
        xx = x0 + (i + 1) * sw
        o.append(ARR(xx - 4, y + 44, xx - 4, ya - 4, c=GRN, lw=1.3, head=6))
        o.append(T(xx - 10, ya + 10, "ack=%s" % b, "end", 10, GRN, True, True))
        o.append(T(xx - 10, ya + 24, "%d までを受け取った" % (int(b) - 1), "end", 9.5, MUT))
    # 送り直すときの区切り
    yr = ya + 56
    o.append(T(20, yr - 8, "送り直すときの区切りの例: 2 と 3 をまとめて 1 つにしてよい", "start", 10.5, INK, True))
    o.append(RECT(x0 + sw, yr, 2 * sw, 34, 4, SSOFT, SIG, 1.4, dash="5 3"))
    o.append(T(x0 + 2 * sw, yr + 21, "seq=1101 ・ 200 バイト", "middle", 10, INK, False, True))
    o.append(T(x0 + sw - 8, yr + 21, "番号で置き場所が分かる", "end", 9.5, SIG))
    return SVG(700, yr + 44, o, "TCP のシーケンス番号はバイトの番号である。データの最初のバイトは ISN + 1 で、各セグメントのシーケンス番号の欄には、そのセグメントの最初のバイトの番号が入る。受け手は、次に受け取りたいバイトの番号を確認応答番号として返す。")
F["e10_bytes"] = _f10_bytes()

# ---- 2 節: 累積の確認応答（3 つの場面） ----
def _f10_ack_panel(o, xa, xb, ytop, u, t_end, title, tc, data, acks, lnotes, rnotes, nw=None):
    """data = [(送る時刻, 届く時刻 or None(失う), 色)]、acks = [(送る時刻, 届く時刻 or None, 色)]、
    lnotes / rnotes = [(時刻, 文字, 色)]（送り手の左・受け手の右に書く）。"""
    Y = lambda t: ytop + 58 + t * u
    o.append(T((xa + xb) / 2, ytop + 12, title, "middle", 11, tc, True))
    _f10_lane(o, xa, ytop + 20, Y(t_end) + 10, "送り手", SIG, 10.5)
    _f10_lane(o, xb, ytop + 20, Y(t_end) + 10, "受け手", GRN, 10.5)
    for t0, t1, c in data:
        if t1 is None:
            _f10_msg(o, xa, Y(t0), xb, Y(t0 + 3), None, c, lost=0.55)
        else:
            _f10_msg(o, xa, Y(t0), xb, Y(t1), None, c)
    for t0, t1, c in acks:
        if t1 is None:
            _f10_msg(o, xb, Y(t0), xa, Y(t0 + 3), None, c, lost=0.5)
        else:
            _f10_msg(o, xb, Y(t0), xa, Y(t1), None, c)
    for t, s, c in lnotes:
        o.append(T(xa - 10, Y(t) + 3.5, s, "end", 9.5, c, False))
    for t, s, c in rnotes:
        o.append(T(xb + 10, Y(t) + 3.5, s, "start", 9.5, c, False))
    return Y(t_end) + 10

def _f10_cumack():
    o = []
    # (a) ACK が失われる
    u = 17
    _f10_ack_panel(o, 108, 236, 4, u, 8, "(a) ACK が 1 つ失われる", GRN,
                   [(0, 3, INK), (1, 4, INK)], [(3, None, GRN), (4, 7, GRN)],
                   [(0, "1001〜 を送る", INK), (1, "1101〜 を送る", INK), (7, "ack 1201", GRN), (8, "1200 まで済み", GRN)],
                   [(3, "→ ack 1101", GRN), (4, "→ ack 1201", GRN)])
    # (b) 順番が入れ替わる
    _f10_ack_panel(o, 458, 586, 4, u, 9, "(b) 順番が入れ替わる", GLD,
                   [(0, 3, INK), (1, 6, INK), (2, 5, INK)], [(3, 6, GRN), (5, 8, GLD), (6, 9, GRN)],
                   [(0, "1001〜", INK), (1, "1101〜", INK), (2, "1201〜", INK), (6, "ack 1101", GRN), (8, "ack 1101（重複）", GLD), (9, "ack 1301", GRN)],
                   [(3, "→ ack 1101", GRN), (5, "先に届いた", GLD), (5.75, "→ ack 1101", GLD), (6.8, "→ ack 1301", GRN)])
    # (c) セグメントが失われる
    y2 = 4 + 58 + 9 * u + 34
    u2 = 15
    yb = _f10_ack_panel(o, 236, 456, y2, u2, 16, "(c) セグメントが 1 つ失われる", ALI,
                   [(0, 3, INK), (1, None, INK), (2, 5, INK), (3, 6, INK), (4, 7, INK), (10.4, 13, ALI)],
                   [(3, 6, GRN), (5, 8, GLD), (6, 9, GLD), (7, 10, GLD), (13, 16, GRN)],
                   [(0, "1001〜 を送る", INK), (1, "1101〜 を送る（失われる）", ALI), (2, "1201〜 を送る", INK), (3, "1301〜 を送る", INK), (4, "1401〜 を送る", INK),
                    (6, "ack 1101", GRN), (8, "ack 1101（重複 1）", GLD), (9, "ack 1101（重複 2）", GLD), (10, "ack 1101（重複 3）", GLD),
                    (11, "→ 1101〜 を送り直す（4 節）", ALI), (16, "ack 1501", GRN)],
                   [(3, "1001〜1100 を受け取る → ack 1101", GRN), (5, "1201〜: 間が抜けている → 取っておく", GLD),
                    (6, "1301〜: 取っておく → ack 1101", GLD), (7, "1401〜: 取っておく → ack 1101", GLD),
                    (13, "1101〜: 1500 まで済む → ack 1501", GRN)])
    return SVG(700, yb + 8, o, "累積の確認応答の 3 つの場面（各セグメントは 100 バイト、番号は最初のバイトの番号）。受け手は、どの場合も「次に受け取りたい番号」を確認応答番号として返す。(a) 失われた ACK の分は、後の ACK がまとめて確かめる。(b)(c) 間が抜けると同じ番号の ACK（重複 ACK）が返り、抜けた所が届くと番号が飛ぶ。")
F["e10_cumack"] = _f10_cumack()

# ---- 3 節: ウィンドウ ----
def _f10_window():
    o = []
    x0, cw, n = 40, 62, 10
    starts = [1001 + 536 * i for i in range(n + 1)]
    def row(y, acked, sent, ok, title, una, nxt, edge):
        o.append(T(20, y - 30, title, "start", 11, INK, True))
        for i in range(n):
            xx = x0 + i * cw
            if i < acked:
                o.append(RECT(xx, y, cw, 30, 3, GSOFT, GRN, 1.1))
            elif i < acked + sent:
                o.append(RECT(xx, y, cw, 30, 3, SSOFT, SIG, 1.4))
            elif i < acked + sent + ok:
                o.append(RECT(xx, y, cw, 30, 3, PAN, SIG, 1.4, dash="4 3"))
            else:
                o.append(RECT(xx, y, cw, 30, 3, MSOFT, MUT, 1.0))
            o.append(T(xx + cw / 2, y + 19, "%d〜" % starts[i], "middle", 9, INK if i < acked + sent + ok else MUT, False, True))
        # ウィンドウの括弧
        xa, xb = x0 + acked * cw, x0 + (acked + sent + ok) * cw
        o.append(W(xa, y - 4, xa, y - 10, xb, y - 10, xb, y - 4, c=SIG, lw=1.4))
        o.append(T((xa + xb) / 2, y - 14, "ウィンドウ W = 2144 バイト（536 × 4）", "middle", 9.5, SIG, True))
        # 位置の矢印
        pts = [(acked, "snd_una = %d" % una, 0), (acked + sent, "snd_nxt = %d" % nxt, 1), (acked + sent + ok, "snd_una + W = %d" % edge, 2)]
        for k, lab, lvl in pts:
            xx = x0 + k * cw
            yl = y + 46 + lvl * 13
            o.append(W(xx, y + 32, xx, yl - 9, c=FNT, lw=1))
            o.append(T(xx + 3, yl, lab, "start", 9.5, SIG if lvl else GRN, True, True))
        return y + 46 + 2 * 13
    yb = row(64, 1, 3, 1, "(a) 1001〜1536 が確認された時点", 1537, 3145, 3681)
    o.append(ARR(60, yb + 8, 60, yb + 30, c=GRN, lw=1.6))
    o.append(T(72, yb + 24, "ack=2609 が届く（2 つ分が確認される）→ 窓が 1072 バイト右へ滑る", "start", 10, GRN, True))
    yb2 = row(yb + 84, 3, 1, 3, "(b) ack=2609 を受け取った後", 2609, 3145, 4753)
    yl = yb2 + 26
    xx = 40
    for fill, c, dash, lab in ((GSOFT, GRN, None, "確認された"), (SSOFT, SIG, None, "送ったが確認されていない"), (PAN, SIG, "3 2", "送ってよい"), (MSOFT, MUT, None, "まだ送れない")):
        o.append(RECT(xx, yl - 10, 14, 12, 2, fill, c, 1.2, dash=dash))
        o.append(T(xx + 20, yl, lab, "start", 10, MUT))
        xx += 20 + tw(lab, 10) + 22
    return SVG(700, yl + 10, o, "送り手から見たバイトの列（MSS 536 バイトのセグメントごとに区切った。ウィンドウ 2144 バイトの例）。送り手は、確認されていない最初の番号 snd_una から W バイトの範囲の中でだけ送る。ACK で snd_una が進むと、送ってよい範囲も同じだけ右へ滑る。")
F["e10_window"] = _f10_window()

# ---- 3 節: スループットの上限 W/RTT ----
def _f10_wrtt():
    o = []
    x0, ts, d = 104, 22, 55            # 1 セグメントを送る時間 ts、片道 d（RTT = 2d）
    xmax = 690
    def lane_row(y, title, win, tc):
        o.append(T(20, y - 14, title, "start", 11, tc, True))
        ys, yr = y + 6, y + 60
        o.append(T(x0 - 8, ys + 4, "送り手", "end", 10, SIG, True))
        o.append(T(x0 - 8, yr + 4, "受け手", "end", 10, GRN, True))
        o.append(W(x0, ys, xmax, ys, c=LIN, lw=1))
        o.append(W(x0, yr, xmax, yr, c=LIN, lw=1))
        # 送る時刻を求める: ACK が戻ると窓が 1 つ滑る
        sends, acks = [], []
        t, k = 0.0, 0
        while True:
            if k < win:
                st = k * ts
            else:
                st = max(sends[-1] + ts, sends[k - win] + ts + 2 * d)
            if x0 + st + ts > xmax:
                break
            sends.append(st); k += 1
        for i, st in enumerate(sends):
            xa = x0 + st
            o.append(PL([(xa, ys + 7), (xa + ts, ys + 7), (xa + ts + d, yr - 7), (xa + d, yr - 7)], c=SIG, lw=0.6, fill=SSOFT, op=0.55))
            o.append(RECT(xa, ys - 7, ts, 14, 2, SSOFT, SIG, 1.1))
            o.append(T(xa + ts / 2, ys + 3.5, str(i + 1), "middle", 9, SIG, True))
            xe = xa + ts + d
            if xe + d <= xmax:
                o.append(W(xe, yr, xe + d, ys + 8, c=GRN, lw=1))
        return sends, ys, yr
    s1, ys1, yr1 = lane_row(36, "(a) W = 2 セグメント: 1 周期（T_s + RTT）に 2 つしか送れない", 2, ALI)
    # 周期の寸法
    o.append(DIM(x0, yr1 + 12, x0 + ts + 2 * d, yr1 + 12, None, c=TEA))
    o.append(T(x0 + (ts + 2 * d) / 2, yr1 + 26, "1 周期 = T_s + RTT", "middle", 9.5, TEA, True))
    o.append(T(x0 + 2 * ts + 10, ys1 + 4, "待つ", "start", 9.5, ALI))
    s2, ys2, yr2 = lane_row(162, "(b) W = 6 セグメント（≥ C × (T_s + RTT)）: 休まず送れる", 6, GRN)
    o.append(T(x0, yr2 + 22, "細い緑の線は ACK。ACK が 1 つ戻るたびに窓が 1 つ滑り、次の 1 つを送る。", "start", 9.5, MUT))
    # スループットと W のグラフ
    C, rtt, Ts = 1.25e6, 0.1, 576 * 8 / 10e6
    p = Plot(110, 284, 520, 170, (500, 1e6), (1e3, 3e6), xlog=True, ylog=True)
    o.append(p.axes(xl="ウィンドウ W [バイト]", yl="スループットの上限 [B/s]", xt=[1e3, 1e4, 1e5, 1e6], yt=[1e3, 1e4, 1e5, 1e6],
                    xfmt=lambda v: {1e3: "1000", 1e4: "10⁴", 1e5: "10⁵", 1e6: "10⁶"}[v], yfmt=lambda v: {1e3: "1000", 1e4: "10⁴", 1e5: "10⁵", 1e6: "10⁶"}[v]))
    pts = [(10 ** (2.7 + k * 0.05), min(C, 10 ** (2.7 + k * 0.05) / (Ts + rtt))) for k in range(0, 67)]
    o.append(p.line(pts, c=SIG, lw=2.2))
    o.append(p.line([(500, C), (1e6, C)], c=GRN, lw=1.2, dash="5 4"))
    o.append(T(p.X(500) + 6, p.Y(C) - 6, "回線の速さ C = 10 Mbps（1.25 × 10⁶ B/s）", "start", 9.5, GRN))
    for w, lab, dx, dy, a in ((2144, "W = 2144: 21,300 B/s", 8, 4, "start"), (65535, "W = 65535: 約 651,000 B/s", -10, 14, "end")):
        v = w / (Ts + rtt)
        o.append(D(p.X(w), p.Y(v), ALI if w == 2144 else PUR, 4.2))
        o.append(T(p.X(w) + dx, p.Y(v) + dy, lab, a, 9.5, ALI if w == 2144 else PUR, True))
    bdp = C * (Ts + rtt)
    o.append(W(p.X(bdp), p.Y(C), p.X(bdp), p.Y(1e3), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(bdp) + 5, p.Y(4e3), "帯域幅遅延積", "start", 9.5, MUT))
    o.append(T(p.X(bdp) + 5, p.Y(4e3) + 13, "約 125,600 バイト", "start", 9.5, MUT))
    o.append(T(p.X(800), p.Y(2.2e4) - 10, "W ÷ (T_s + RTT)", "start", 9.5, SIG, True, rot=None))
    return SVG(700, 492, o, "上: ウィンドウ W で送り続けたときの時間の使い方（縮尺は誇張）。W が小さいと、送り手は W を送るたびに最初の ACK を待つ。W が回線の速さ × (T_s + RTT) 以上なら休まず送れる。下: スループットの上限 min(C, W ÷ (T_s + RTT)) と W の関係（RTT 100 ms、10 Mbps、1 セグメント 576 バイトの例。両軸とも対数目盛）。")
F["e10_wrtt"] = _f10_wrtt()

# ---- 3 節: 受信ウィンドウ ----
def _f10_rwnd():
    o = []
    xa, xb, u = 150, 400, 15
    Y = lambda t: 70 + t * u
    _f10_lane(o, xa, 8, Y(15.6), "サーバ（送り手）", GRN, 10.5)
    _f10_lane(o, xb, 8, Y(15.6), "機器（受け手）", SIG, 10.5)
    o.append(T(xb + 168, 22, "機器の受信バッファ（2144 バイト）", "middle", 9.5, SIG, True))
    segs = ["1001〜", "1537〜", "2073〜", "2609〜"]
    for i, sname in enumerate(segs):
        _f10_msg(o, xa, Y(i), xb, Y(i + 3), None, INK)
        o.append(T(xa - 10, Y(i) + 3.5, sname + " を送る", "end", 9.5, INK))
    acks = [("ack=1537 win=1608", 1), ("ack=2073 win=1072", 2), ("ack=2609 win=536", 3), ("ack=3145 win=0", 4)]
    def gauge(y, k):
        gx = xb + 128
        for j in range(4):
            o.append(RECT(gx + j * 20, y - 9, 18, 12, 2, SSOFT if j < k else PAN, SIG, 1.0))
    for i, (lab, k) in enumerate(acks):
        t = i + 3
        _f10_msg(o, xb, Y(t), xa, Y(t + 3), None, GRN)
        o.append(T(xb + 8, Y(t) + 3.5, lab, "start", 9.5, GRN if k < 4 else ALI, k == 4, True))
        gauge(Y(t) + 3.5, k)
    o.append(T(xa - 10, Y(9) + 3.5, "win=0: 止まる", "end", 9.5, ALI, True))
    _f10_span(o, xa, Y(6), Y(9), None, c=GLD, side=-1)
    o.append(T(xa - 22, Y(7) + 3.5, "ack + win は", "end", 9.5, GLD))
    o.append(T(xa - 22, Y(8) + 3.5, "3145 のまま", "end", 9.5, GLD))
    # アプリケーションが読む
    o.append(T(xb + 8, Y(10.6) + 3.5, "アプリケーションが読む", "start", 9.5, PUR, True))
    gauge(Y(10.6) + 3.5, 0)
    _f10_msg(o, xb, Y(11.6), xa, Y(14.6), None, GRN)
    o.append(T(xb + 8, Y(11.6) + 3.5, "ack=3145 win=2144", "start", 9.5, GRN, True, True))
    o.append(T(xa - 10, Y(14.6) + 3.5, "win=2144: 再開する", "end", 9.5, GRN, True))
    _f10_msg(o, xa, Y(15.2), xb, Y(18.2), None, INK)
    yb = Y(18.6) + 14
    o.append(T(20, yb, "この win=2144 の ACK が失われると両方が止まるので、受信ウィンドウが 0 の間、送り手はときどき 1 バイトを送って確かめる。", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "受信ウィンドウによるフロー制御（MSS 536 バイト、受信バッファ 2144 バイトの例）。機器のアプリケーションが読まない間は、受信バッファが埋まるだけ受信ウィンドウ（win）が減り、確認応答番号 + 受信ウィンドウ（送ってよい範囲の右端）は進まない。アプリケーションが読むと、機器は空いた分を知らせ、サーバは送るのを再開する。")
F["e10_rwnd"] = _f10_rwnd()

# ---- 4 節: RTO の推移 ----
def _f10_rto_series(samples, floor=1000.0):
    out, srtt, var = [], None, None
    for r in samples:
        if srtt is None:
            srtt, var = float(r), r / 2.0
        else:
            var = 0.75 * var + 0.25 * abs(srtt - r)
            srtt = 0.875 * srtt + 0.125 * r
        raw = srtt + max(10.0, 4 * var)
        out.append((r, srtt, var, raw, max(raw, floor)))
    return out

def _f10_rto():
    o = []
    ex1 = [800, 600, 1000, 700, 1500, 900, 850, 800, 780, 820, 800, 790]
    ex2 = [100, 120, 90, 110, 140, 95, 105, 100, 98, 102, 100, 101]
    panels = [(70, "(a) 携帯電話の網の例（本文の表の続き）", ex1, (0, 2600), [0, 500, 1000, 1500, 2000, 2500]),
              (420, "(b) RTT 100 ms 前後の経路", ex2, (0, 1100), [0, 250, 500, 750, 1000])]
    for x0, title, ex, yr, yt in panels:
        p = Plot(x0, 34, 250, 190, (0.5, 12.5), yr)
        o.append(T(x0 + 125, 18, title, "middle", 10.5, INK, True))
        o.append(p.axes(xl="何回目の測定か", yl="[ms]", xt=[1, 4, 8, 12], yt=yt, xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
        ser = _f10_rto_series(ex)
        o.append(p.line([(1, 1000), (12, 1000)], c=MUT, lw=1.1, dash="2 3"))
        o.append(p.line([(i + 1, s[3]) for i, s in enumerate(ser)], c=TEA, lw=1.4, dash="5 3"))
        o.append(p.line([(i + 1, s[4]) for i, s in enumerate(ser)], c=TEA, lw=2.4))
        o.append(p.line([(i + 1, s[1]) for i, s in enumerate(ser)], c=GRN, lw=2))
        for i, s in enumerate(ser):
            o.append(D(p.X(i + 1), p.Y(s[0]), INK, 3.4))
        if x0 == 70:
            o.append(T(p.X(5) + 6, p.Y(1500) + 4, "1500", "start", 9, INK))
            o.append(T(p.X(12) - 2, p.Y(ser[-1][4]) - 8, "RTO", "end", 9.5, TEA, True))
            o.append(T(p.X(12) - 2, p.Y(ser[-1][1]) + 16, "SRTT", "end", 9.5, GRN, True))
        else:
            o.append(T(p.X(12) - 2, p.Y(1000) - 7, "RTO = 1 秒（切り上げ）", "end", 9.5, TEA, True))
            o.append(T(p.X(12) - 2, p.Y(ser[-1][3]) - 7, "SRTT + 4 × RTTVAR", "end", 9.5, TEA))
            o.append(T(p.X(12) - 2, p.Y(ser[-1][1]) + 15, "SRTT と測定値", "end", 9.5, GRN, True))
    yl = 34 + 190 + 52
    xx = 70
    o.append(D(xx + 5, yl - 4, INK, 3.4)); o.append(T(xx + 14, yl, "測定値 R", "start", 10, MUT)); xx += 92
    for c, dash, lab in ((GRN, None, "SRTT"), (TEA, None, "RTO"), (TEA, "5 3", "SRTT + 4 × RTTVAR（切り上げる前）"), (MUT, "2 3", "1 秒の下限")):
        o.append(W(xx, yl - 4, xx + 22, yl - 4, c=c, lw=2 if not dash else 1.4, dash=dash))
        o.append(T(xx + 28, yl, lab, "start", 10, MUT))
        xx += 28 + tw(lab, 10) + 18
    return SVG(700, yl + 10, o, "RFC 6298 の計算による SRTT と RTO の推移。(a) 5 回目の大きな測定値で RTTVAR が増えて RTO が上がり、測定値が平均の近くに戻ると、RTTVAR が減って RTO も下がっていく。(b) RTT が 100 ms 程度の経路では、SRTT + 4 × RTTVAR は 300 ms 以下で、RTO は 1 秒の下限に切り上げられる。")
F["e10_rto"] = _f10_rto()

# ---- 4 節: Karn のアルゴリズム ----
def _f10_karn():
    o = []
    for side in range(2):
        px = 4 + side * 348
        xa, xb = px + 150, px + 318
        title = "(a) 最初の分への ACK だった（ACK が遅れた）" if side == 0 else "(b) 再送した分への ACK だった（最初の分が失われた）"
        o.append(T(px + 172, 16, title, "middle", 10.5, INK, True))
        _f10_lane(o, xa, 26, 280, "送り手", SIG, 10.5)
        _f10_lane(o, xb, 26, 280, "受け手", GRN, 10.5)
        _f10_span(o, xa, 72, 168, None, c=TEA, side=1)
        o.append(T(xa + 18, 124, "RTO", "start", 9.5, TEA, True))
        if side == 0:
            _f10_msg(o, xa, 72, xb, 112, "送る", INK, lpos=0.3, ldy=-6)
            _f10_msg(o, xb, 124, xa, 194, "ACK（遅れて届く）", GRN, lpos=0.62, ldy=-6)
            _f10_msg(o, xa, 168, xb, 208, "再送", ALI, lpos=0.62, ldy=14)
            o.append(DIM(xa - 22, 72, xa - 22, 194, None, c=TEA))
            o.append(T(xa - 30, 130, "本当の RTT", "end", 9.5, TEA, True))
            o.append(DIM(xa - 52, 168, xa - 52, 194, None, c=ALI))
            o.append(T(xa - 60, 178, "再送から測ると", "end", 9.5, ALI, True))
            o.append(T(xa - 60, 191, "短すぎる", "end", 9.5, ALI, True))
        else:
            _f10_msg(o, xa, 72, xb, 112, "送る", INK, lost=0.55, lpos=0.3, ldy=-6)
            _f10_msg(o, xa, 168, xb, 208, "再送", INK, lpos=0.3, ldy=-6)
            _f10_msg(o, xb, 208, xa, 248, "ACK", GRN, lpos=0.5, ldy=-6)
            o.append(DIM(xa - 22, 168, xa - 22, 248, None, c=TEA))
            o.append(T(xa - 30, 212, "本当の RTT", "end", 9.5, TEA, True))
            o.append(DIM(xa - 52, 72, xa - 52, 248, None, c=ALI))
            o.append(T(xa - 60, 140, "最初から測ると", "end", 9.5, ALI, True))
            o.append(T(xa - 60, 153, "長すぎる", "end", 9.5, ALI, True))
    o.append(T(350, 302, "送り手に見えるのは、どちらも「送る → RTO で再送 → ACK が届く」だけで、区別がつかない。", "middle", 10.5, INK))
    o.append(T(350, 320, "そこで、再送したセグメントの RTT は測らない（Karn のアルゴリズム）。", "middle", 10.5, GRN, True))
    return SVG(700, 330, o, "再送したセグメントの RTT の測り方の 2 つの誤り。(a) 最初の分への ACK が遅れて届いたのに、再送からの時間を測ると RTT を短く見積もり、RTO が下がってさらに不要な再送を招く。(b) 最初の分が失われて再送した分への ACK なのに、最初からの時間を測ると、RTT を長く見積もる。")
F["e10_karn"] = _f10_karn()

# ---- 4 節: 時間切れが続くとき（SYN の再送） ----
def _f10_backoff():
    o = []
    x0, sc, ya = 50, 19.0, 120
    X = lambda t: x0 + t * sc
    o.append(W(x0, ya, X(33), ya, c=MUT, lw=1.2))
    for t in range(0, 33, 5):
        o.append(W(X(t), ya, X(t), ya + 5, c=MUT, lw=1))
        o.append(T(X(t), ya + 18, "%d s" % t, "middle", 9.5, MUT))
    sends = [0, 1, 3, 7, 15, 31]
    for i, t in enumerate(sends):
        c = INK if t < 10 else FNT
        o.append(ARR(X(t), ya, X(t), ya - 30, c=c, lw=1.6, head=6))
        o.append(T(X(t) + (4 if i else 0), ya - 36, "%d" % (i + 1), "middle" if i else "middle", 10, c, True))
    o.append(T(X(0) - 4, ya - 52, "SYN を送る回", "start", 9.5, MUT))
    for i in range(len(sends) - 1):
        a, b = sends[i], sends[i + 1]
        w = b - a
        yy = ya - 64 - (0 if i % 2 == 0 else 0)
        o.append(DIM(X(a), ya + 32, X(b), ya + 32, None, c=TEA))
        o.append(T((X(a) + X(b)) / 2, ya + 46, "%d s" % w, "middle", 9.5, TEA, True))
    o.append(T(x0, ya + 64, "待つ時間（RTO）: 1 s から始めて、時間切れのたびに 2 倍", "start", 10, TEA))
    xd = X(10)
    o.append(W(xd, 20, xd, ya + 4, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(xd + 6, 30, "接続の期限 10 秒（08 章 7 節の例）", "start", 10, ALI, True))
    o.append(T(xd + 6, 44, "→ SYN を 4 回送ったところで諦める", "start", 10, ALI))
    o.append(T(X(31), ya + 64, "Linux の既定: 7 回送り、127 秒で諦める", "end", 9.5, MUT))
    return SVG(700, ya + 76, o, "SYN が失われ続けたときに、機器が SYN を送る時刻。最初の RTT の測定の前の RTO は 1 秒で、時間切れのたびに 2 倍になるので、0、1、3、7、15、31 秒…に送る。どこで諦めるかは、アプリケーションの側で期限を決めておく。")
F["e10_backoff"] = _f10_backoff()

# ---- 4 節: 高速再送 ----
def _f10_fastrtx():
    o = []
    # (a) 大きなデータを送る途中
    xa, xb, u = 172, 330, 14
    Y = lambda t: 60 + t * u
    o.append(T(200, 16, "(a) 大きなデータを送り続ける途中（ウィンドウ 4 個）", "middle", 10.5, GRN, True))
    _f10_lane(o, xa, 24, Y(18.6), "送り手", SIG, 10.5)
    _f10_lane(o, xb, 24, Y(18.6), "受け手", GRN, 10.5)
    _f10_msg(o, xa, Y(0), xb, Y(3), None, INK)
    _f10_msg(o, xa, Y(1), xb, Y(4), None, INK, lost=0.55)
    _f10_msg(o, xa, Y(2), xb, Y(5), None, INK)
    _f10_msg(o, xa, Y(3), xb, Y(6), None, INK)
    _f10_msg(o, xb, Y(3), xa, Y(6), None, GRN)
    _f10_msg(o, xa, Y(6), xb, Y(9), None, INK)
    for t in (5, 6, 9):
        _f10_msg(o, xb, Y(t), xa, Y(t + 3), None, GLD)
    _f10_msg(o, xa, Y(12.3), xb, Y(15.3), None, ALI)
    _f10_msg(o, xb, Y(15.3), xa, Y(18.3), None, GRN)
    for t, s, c in ((0, "#1 を送る", INK), (1, "#2 を送る（失われる）", ALI), (2, "#3 を送る", INK), (3, "#4 を送る", INK),
                    (6, "ack #2 → 窓が滑り #5 を送る", GRN), (8, "ack #2（重複 1）", GLD), (9, "ack #2（重複 2）", GLD),
                    (12, "ack #2（重複 3）", GLD), (13, "→ #2 を送り直す", ALI), (18.3, "ack #6", GRN)):
        o.append(T(xa - 10, Y(t) + 3.5, s, "end", 9.5, c))
    o.append(DIM(xb + 24, Y(1), xb + 24, Y(12.3), None, c=TEA))
    o.append(T(xb + 30, Y(6.2), "約 2 RTT", "start", 9.5, TEA, True))
    o.append(T(xb + 30, Y(7.3), "で送り直す", "start", 9.5, TEA, True))
    # (b) 1 つのセグメントで終わるメッセージ
    xa2, xb2 = 504, 640
    o.append(T(560, 16, "(b) 1 つのセグメントで終わるメッセージ", "middle", 10.5, ALI, True))
    _f10_lane(o, xa2, 24, Y(18.6), "送り手", SIG, 10.5)
    _f10_lane(o, xb2, 24, Y(18.6), "受け手", GRN, 10.5)
    _f10_msg(o, xa2, Y(0), xb2, Y(3), None, INK, lost=0.55)
    o.append(T(xa2 - 10, Y(0) + 3.5, "#1 を送る", "end", 9.5, INK))
    o.append(T((xa2 + xb2) / 2, Y(5.2), "後に送るものが無い", "middle", 9.5, ALI))
    o.append(T((xa2 + xb2) / 2, Y(6.3), "→ 重複 ACK は来ない", "middle", 9.5, ALI))
    _f10_span(o, xa2, Y(0), Y(12.3), None, c=TEA, side=-1)
    for xx in (xa2, xb2):
        o.append(W(xx - 6, Y(8.6) - 3, xx + 6, Y(8.6) + 3, c=FNT, lw=1.2))
        o.append(W(xx - 6, Y(8.6) + 3, xx + 6, Y(8.6) + 9, c=FNT, lw=1.2))
    o.append(T(xa2 - 22, Y(5.6), "RTO（1 秒以上）", "end", 9.5, TEA, True))
    o.append(T(xa2 - 22, Y(6.7), "待つ", "end", 9.5, TEA, True))
    _f10_msg(o, xa2, Y(12.3), xb2, Y(15.3), None, ALI)
    o.append(T(xa2 - 10, Y(13.3), "送り直す", "end", 9.5, ALI))
    _f10_msg(o, xb2, Y(15.3), xa2, Y(18.3), None, GRN)
    o.append(T(xa2 - 10, Y(18.3) + 3.5, "ack", "end", 9.5, GRN))
    return SVG(700, Y(18.6) + 8, o, "高速再送が働く場合と働かない場合（#k は k 番目のセグメント、ack #k は「#k の先頭が欲しい」という確認応答番号。RTT は図の縦で 6 目盛り分）。(a) 失われたセグメントの後に 3 つが届けば、重複 ACK 3 つで、時間切れを待たずに送り直せる。(b) 後に送るものが無ければ、重複 ACK は来ないので、RTO（1 秒以上。RTT の数十倍のこともある。図では途中を省いた）を待つ。")
F["e10_fastrtx"] = _f10_fastrtx()
