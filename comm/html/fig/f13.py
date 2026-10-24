# -*- coding: utf-8 -*-
# 13 章 MQTT の図

# ---- この章の小さな部品 ----
def _f13_lane(o, x, y0, y1, name, c, sz=10.5):
    bw = max(64, tw(name, sz) + 18)
    o.append(RECT(x - bw / 2, y0, bw, 26, 7, soft(c), c, 1.3))
    o.append(T(x, y0 + 17, name, "middle", sz, c, True))
    o.append(W(x, y0 + 26, x, y1, c=c, lw=1.2, dash="3 4"))

def _f13_msg(o, x1, y1, x2, y2, label=None, c=INK, lost=None, lsz=10, ldy=-5, b=False, mono=False):
    """x1,y1 から x2,y2 への矢印。lost=0〜1 で、その割合の位置で失われる（×）。"""
    if lost is not None:
        fx, fy = x1 + (x2 - x1) * lost, y1 + (y2 - y1) * lost
        o.append(W(x1, y1, fx, fy, c=ALI, lw=1.6, dash="5 3"))
        o.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=2))
        o.append(W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=2))
        c = ALI
    else:
        o.append(ARR(x1, y1, x2, y2, c=c, lw=1.6, head=7))
    if label:
        o.append(T((x1 + x2) / 2, (y1 + y2) / 2 + ldy, label, "middle", lsz, c, b, mono))

def _f13_note(o, x, y, lines, c, a="start", sz=9.5, b=False):
    """注記の箱。a は x の基準（start なら x が左端）。返り値は箱の高さ。"""
    w = max(tw(l, sz) for l in lines) + 12
    h = len(lines) * sz * 1.4 + 7
    x0 = x - w if a == "end" else (x - w / 2 if a == "middle" else x)
    o.append(RECT(x0, y, w, h, 5, PAN, "none", 0))
    o.append(RECT(x0, y, w, h, 5, soft(c), c, 1))
    for i, l in enumerate(lines):
        o.append(T(x0 + w / 2, y + 3.5 + sz + i * sz * 1.4, l, "middle", sz, c, b))
    return h

def _f13_span(o, x, y0, y1, c, side=-1):
    xb = x + side * 8
    o.append(W(xb, y0, xb + side * 5, y0, xb + side * 5, y1, xb, y1, c=c, lw=1.4))

def _f13_cells(o, x, y, groups, cw, ch=28, sz=10.5, sub=None, subsz=9):
    """バイトの列を 1 バイトずつの箱で描く。groups = [(色, [16 進の文字列, ...]), ...]。
    sub が文字列のリストなら、各バイトの下に小さく書く（None の所は書かない）。返り値は各グループの (左端, 右端)。"""
    xs, k = [], 0
    xx = x
    for c, bs in groups:
        x0 = xx
        for hx in bs:
            o.append(RECT(xx, y, cw, ch, 2, soft(c), c, 1.1))
            o.append(T(xx + cw / 2, y + ch / 2 + sz * 0.36, hx, "middle", sz, INK, False, True))
            if sub is not None and k < len(sub) and sub[k]:
                o.append(T(xx + cw / 2, y + ch + subsz + 3, sub[k], "middle", subsz, c, False, True))
            xx += cw; k += 1
        xs.append((x0, xx))
    return xs

def _f13_brace(o, x0, x1, y, label, c=MUT, sz=9.5, up=False, lines=None):
    """区間 [x0, x1] の下（up なら上）に括弧と文字。"""
    d = -1 if up else 1
    o.append(W(x0 + 1, y, x0 + 1, y + 5 * d, x1 - 1, y + 5 * d, x1 - 1, y, c=c, lw=1.1))
    ls = lines or ([label] if label else [])
    for i, l in enumerate(ls):
        yy = (y + 5 * d + (sz + 4) * d + i * (sz + 3)) if not up else (y - 9 - (len(ls) - 1 - i) * (sz + 3))
        o.append(T((x0 + x1) / 2, yy, l, "middle", sz, c))

# ---- 1 節: ブローカを介す ----
def _f13_direct():
    o = []
    devs = ["機器 1", "機器 2", "機器 3"]
    cons = [("アプリ（スマートフォン）", PUR), ("データベース", GRN), ("警報のサービス", GRN)]
    def panel(y0, good):
        o.append(T(16, y0 + 18, "良い例: 全員がブローカへ接続を張る" if good else "悪い例: 受け手のそれぞれが機器へ直接つなぐ",
                   "start", 11.5, GRN if good else ALI, True))
        ry = y0 + 30
        o.append(RECT(16, ry, 168, 132, 8, "none", MUT, 1.1, dash="5 4"))
        o.append(T(24, ry + 126, "NAT の内側（家の中）", "start", 9.5, MUT))
        ys = [ry + 10 + i * 36 for i in range(3)]
        for nm, yy in zip(devs, ys):
            o.append(BOX(32, yy, 120, 26, nm, None, SIG, SSOFT, SIG, sz=11))
        o.append(RECT(194, ry, 22, 132, 4, GOSOFT, GLD, 1.3))
        o.append(T(205, ry + 66, "NAT", "middle", 10.5, GLD, True, rot=-90))
        xc = 524
        for (nm, c), yy in zip(cons, ys):
            o.append(BOX(xc, yy, 160, 26, nm, None, c, soft(c), c, sz=10.5))
        if not good:
            for yc in ys:
                for yd in ys:
                    o.append(W(xc - 2, yc + 13, 226, yd + 13, c=ALI, lw=1.0, dash="4 3"))
            for yd in ys:
                o.append(W(216, yd + 8, 226, yd + 18, c=ALI, lw=2.2) + W(216, yd + 18, 226, yd + 8, c=ALI, lw=2.2))
            o.append(T(16, ry + 156, "受け手を 1 つ足すたびに、機器の数だけ接続が増える（3 × 3 = 9 本）。", "start", 10.5, INK))
            o.append(T(16, ry + 173, "しかも、NAT の外からは、機器へ接続を始められない（× の所で捨てられる。08 章 5 節）。", "start", 10.5, ALI))
            return ry + 182
        xb, yb, wb, hb = 314, ry + 26, 116, 80
        o.append(BOX(xb, yb, wb, hb, "ブローカ", "トピックで振り分ける", GRN, GSOFT, GRN, sz=12, ssz=9.5))
        for yy in ys:
            o.append(ARR(152, yy + 13, xb - 2, yb + hb / 2 + (yy - ys[1]) * 0.45, c=SIG, lw=1.7))
        for (nm, c), yy in zip(cons, ys):
            o.append(ARR(xc - 2, yy + 13, xb + wb + 2, yb + hb / 2 + (yy - ys[1]) * 0.45, c=c, lw=1.7))
        o.append(T(16, ry + 156, "矢印は接続を張る向き。どの接続も外へ向かうので、NAT の内側の機器も参加できる（3 + 3 = 6 本）。", "start", 10.5, INK))
        o.append(T(16, ry + 173, "下りのデータ（命令）も、機器が張った接続を通って届く。", "start", 10.5, GRN))
        return ry + 182
    h1 = panel(0, False)
    h2 = panel(h1 + 18, True)
    return SVG(700, h2 + 6, o, "受け手が機器へ直接つなぐ形（上）と、ブローカを介す形（下）。上では、受け手の数と機器の数の積だけ接続が要り、そもそも NAT の外からは接続を始められない。下では、全員がブローカへ外向きに接続を張るだけで、上りも下りも届く。")
F["e13_direct"] = _f13_direct()

def _f13_flow():
    lanes = [("機器 dev-1", SIG), ("ブローカ", GRN), ("アプリ", PUR), ("データベース", GRN)]
    msgs = [
        (0, 1, "接続を張る（TCP・TLS・CONNECT）", {"c": SIG}),
        (0, 1, "購読: dev/1/cmd", {"c": SIG}),
        (2, 1, "購読: dev/+/temp", {"c": PUR}),
        (3, 1, "購読: dev/#", {"c": GRN}),
        ("note", 1, "購読の一覧\ndev/1/cmd → 機器\ndev/+/temp → アプリ\ndev/# → データベース", {"c": GRN}),
        (0, 1, "パブリッシュ dev/1/temp {\"t\":23.5,…}", {"c": SIG, "b": True}),
        (1, 2, "写し", {"c": GRN}),
        (1, 3, "写し", {"c": GRN}),
        (2, 1, "パブリッシュ dev/1/cmd {\"interval\":30}", {"c": PUR, "b": True}),
        (1, 0, "写し（機器が張った接続で届く）", {"c": GRN}),
        (1, 3, "写し", {"c": GRN}),
    ]
    return SEQFIG(lanes, msgs, "MQTT のやり取りの例（時間は上から下へ）。クライアントはそれぞれブローカへ接続を張り、受け取りたいトピックを登録しておく。ブローカは、パブリッシュされたメッセージのトピック名を登録と照らし合わせ、一致した購読者のそれぞれへ写しを送る。アプリからの命令も、機器が張った接続を通って届く。", w=700)
F["e13_flow"] = _f13_flow()

# ---- 2 節: トピック ----
def _f13_tree():
    o = []
    leaves = ["temp", "hum", "cmd", "status", "temp", "hum", "uptime"]
    names = ["dev/1/temp", "dev/1/hum", "dev/1/cmd", "dev/1/status", "dev/2/temp", "dev/2/hum", "$SYS/broker/uptime"]
    filters = ["dev/+/temp", "dev/1/#", "dev/+/+", "#"]
    y0, rh, bh = 62, 30, 22
    yc = lambda r: y0 + r * rh + bh / 2
    o.append(T(20, 24, "トピックの木（/ で区切ったレベル）", "start", 11, INK, True))
    o.append(T(20, 42, "1 つ目", "start", 9.5, MUT)); o.append(T(110, 42, "2 つ目", "start", 9.5, MUT)); o.append(T(196, 42, "3 つ目のレベル", "start", 9.5, MUT))
    def node(x, r, w, text, c=SIG):
        o.append(RECT(x, yc(r) - bh / 2, w, bh, 5, soft(c), c, 1.2))
        o.append(T(x + w / 2, yc(r) + 4, text, "middle", 10.5, INK, False, True))
    def edge(x1, r1, x2, r2):
        xm = (x1 + x2) / 2
        o.append(W(x1, yc(r1), xm, yc(r1), xm, yc(r2), x2, yc(r2), c=MUT, lw=1.1))
    node(20, 2.5, 56, "dev"); node(20, 6, 56, "$SYS", GLD)
    node(110, 1.5, 50, "1"); node(110, 4.5, 50, "2"); node(98, 6, 74, "broker", GLD)
    for r in range(4): edge(160, 1.5, 196, r)
    for r in (4, 5): edge(160, 4.5, 196, r)
    edge(76, 2.5, 110, 1.5); edge(76, 2.5, 110, 4.5); edge(76, 6, 98, 6); edge(172, 6, 196, 6)
    for r, lf in enumerate(leaves):
        node(196, r, 70, lf, GLD if r == 6 else SIG)
    # 照合の表
    xm0, cwid = 300, 98
    o.append(T(xm0 + 2 * cwid, 24, "購読のフィルタと、一致するトピック名（✓）", "middle", 11, INK, True))
    for j, f in enumerate(filters):
        o.append(T(xm0 + j * cwid + cwid / 2, 46, f, "middle", 11, PUR, True, True))
    for r, nm in enumerate(names):
        y = y0 + r * rh
        o.append(W(xm0, y - 4, xm0 + 4 * cwid, y - 4, c=GRD, lw=1))
        for j, f in enumerate(filters):
            fl, tl = f.split("/"), nm.split("/")
            ok = True
            if f[0] in "+#" and nm[0] == "$":
                ok = False
            else:
                for i, x in enumerate(fl):
                    if x == "#": break
                    if i >= len(tl) or (x != "+" and x != tl[i]): ok = False; break
                else:
                    ok = len(fl) == len(tl)
            cx = xm0 + j * cwid + cwid / 2
            if ok:
                o.append(RECT(cx - 30, y, 60, bh, 4, GSOFT, GRN, 1))
                o.append(T(cx, y + 16, "✓", "middle", 12, GRN, True))
            else:
                o.append(T(cx, y + 16, "×", "middle", 11, FNT))
    yb = y0 + 7 * rh + 14
    o.append(T(20, yb, "dev/1/# は、dev/1 という名前にも一致する（# は 0 個のレベルにも一致する）。", "start", 10, MUT))
    o.append(T(20, yb + 16, "$SYS で始まる名前（ブローカの情報）は、# にも一致しない。読むには $SYS/# と書く。", "start", 10, GLD))
    return SVG(700, yb + 26, o, "トピックの木と、4 つのフィルタが一致するトピック名（✓）。+ はどの 1 つのレベルにも、# はその位置から後のレベルすべてに一致する。$ で始まる名前に、ワイルドカードで始まるフィルタは一致しない。")
F["e13_tree"] = _f13_tree()

def _f13_design():
    o = []
    for side in range(2):
        good = side == 1
        x0 = 14 + side * 350
        c = GRN if good else ALI
        o.append(T(x0, 22, "良い例" if good else "悪い例", "start", 12, c, True))
        o.append(RECT(x0, 32, 330, 112, 7, soft(c), c, 1.1))
        if good:
            rows = [("dev/1/temp", "機器 → クラウド（測定値）"), ("dev/1/hum", "機器 → クラウド（測定値）"),
                    ("dev/1/status", "機器 → クラウド（状態。5 節）"), ("dev/1/cmd", "クラウド → 機器（命令）")]
        else:
            rows = [("/sensors/temp/1", "先頭に / がある"), ("/sensors/temp/1/23.5", "値を名前に入れている"),
                    ("/sensors/hum/1", "測る量が先、機器の ID が最後"), ("/sensors/cmd/1", "命令も測定値と同じ形")]
        for i, (t, d) in enumerate(rows):
            y = 54 + i * 24
            o.append(T(x0 + 10, y, t, "start", 11, INK, False, True))
            o.append(T(x0 + 322, y, d, "end", 9.5, MUT))
        if good:
            res = [("機器 1 の購読: dev/1/cmd", "命令だけが届く", True),
                   ("アプリの購読: dev/+/temp", "全機器の温度が届く", True),
                   ("機器 1 の権限", "dev/1/ の下だけ（短く書ける）", True)]
        else:
            res = [("機器 1 の購読: /sensors/+/1", "自分の温度も送り返される", False),
                   ("アプリの購読: sensors/#", "/ で始まる名前に一致しない", False),
                   ("温度の保持メッセージ", "値ごとに別のトピックになる", False)]
        for i, (a, b, ok) in enumerate(res):
            y = 168 + i * 40
            o.append(T(x0 + 4, y, a, "start", 10.5, INK, False))
            o.append(T(x0 + 22, y + 17, b, "start", 10.5, GRN if ok else ALI, True))
            o.append(T(x0 + 4, y + 17, "✓" if ok else "×", "start", 12, GRN if ok else ALI, True))
    return SVG(700, 290, o, "同じ機器の同じデータに付けた、2 通りのトピックの名前。上りと下りを分け、機器の ID を前のほうに置き、先頭に / を付けない形（右）なら、購読も権限も短く正しく書ける。")
F["e13_design"] = _f13_design()

# ---- 3 節: パケットの形 ----
_F13_TYPES = [(1, "CONNECT", "10", TEA), (2, "CONNACK", "20", TEA), (3, "PUBLISH", "3x", SIG), (4, "PUBACK", "40", SIG),
              (5, "PUBREC", "50", SIG), (6, "PUBREL", "62", SIG), (7, "PUBCOMP", "70", SIG), (8, "SUBSCRIBE", "82", PUR),
              (9, "SUBACK", "90", PUR), (10, "UNSUBSCRIBE", "A2", PUR), (11, "UNSUBACK", "B0", PUR), (12, "PINGREQ", "C0", TEA),
              (13, "PINGRESP", "D0", TEA), (14, "DISCONNECT", "E0", TEA)]

def _f13_fixhdr():
    o = []
    # 上の段: パケット全体の並び
    y = 44
    parts = [(20, 104, "種類 + フラグ", "1 バイト", TEA), (124, 120, "残りの長さ", "1〜4 バイト", GLD),
             (244, 200, "可変ヘッダ", "種類ごとに決まった欄", PUR), (444, 236, "ペイロード", "種類による（PUBLISH ならデータ）", GRN)]
    for x, w, a, b, c in parts:
        o.append(RECT(x, y, w, 40, 4, soft(c), c, 1.3))
        o.append(T(x + w / 2, y + 17, a, "middle", 11, c, True))
        o.append(T(x + w / 2, y + 32, b, "middle", 9.5, MUT))
    _f13_brace(o, 20, 244, y - 6, "固定ヘッダ（2〜5 バイト）", INK, 10, up=True)
    _f13_brace(o, 244, 680, y + 46, "残りの長さが表すバイト数", GLD, 10)
    # 中の段: PUBLISH の 1 バイト目のビット
    y2 = 150
    o.append(T(20, y2 + 4, "1 バイト目の 8 ビット（PUBLISH、QoS 1 の例 0x32）", "start", 11, INK, True))
    bits = [("0", TEA), ("0", TEA), ("1", TEA), ("1", TEA), ("0", ALI), ("0", SIG), ("1", SIG), ("0", GLD)]
    bw, bx = 52, 150
    for i, (v, c) in enumerate(bits):
        o.append(RECT(bx + i * bw, y2 + 16, bw, 28, 2, soft(c), c, 1.1))
        o.append(T(bx + i * bw + bw / 2, y2 + 35, v, "middle", 12, INK, True, True))
        o.append(T(bx + i * bw + bw / 2, y2 + 12 + 0, "", "middle", 9, MUT))
    for i in range(8):
        o.append(T(bx + i * bw + bw / 2, y2 + 58, "b%d" % (7 - i), "middle", 9, FNT, False, True))
    for x0, x1, lab, c in ((0, 4, "種類 = 3（PUBLISH）", TEA), (4, 5, "DUP", ALI), (5, 7, "QoS = 1", SIG), (7, 8, "RETAIN", GLD)):
        _f13_brace(o, bx + x0 * bw, bx + x1 * bw, y2 + 64, lab, c, 9.5)
    o.append(T(bx + 8 * bw + 14, y2 + 35, "= 0x32", "start", 12, INK, True, True))
    # 下の段: 14 種類
    y3 = 268
    o.append(T(20, y3, "パケットの種類（値と、1 バイト目）", "start", 11, INK, True))
    cw, ch = 94, 40
    for k, (v, nm, hx, c) in enumerate(_F13_TYPES):
        r, col = divmod(k, 7)
        x, yy = 20 + col * (cw + 2), y3 + 12 + r * (ch + 6)
        o.append(RECT(x, yy, cw, ch, 5, soft(c), c, 1.1))
        o.append(T(x + cw / 2, yy + 17, nm, "middle", 9.5 if len(nm) > 9 else 10, c, True))
        o.append(T(x + cw / 2, yy + 33, "%d ・ %s" % (v, hx), "middle", 9.5, INK, False, True))
    yl = y3 + 12 + 2 * (ch + 6) + 14
    o.append(LEGEND(20, yl, [(TEA, "接続の管理（3・5 節）"), (SIG, "メッセージを運ぶ（3・4 節）"), (PUR, "購読（3 節）")]))
    return SVG(700, yl + 10, o, "MQTT のパケットの形（上）と、PUBLISH の 1 バイト目（中）、3.1.1 の 14 種類のパケット（下）。固定ヘッダの後に、残りの長さが表すバイト数だけ、可変ヘッダとペイロードが続く。1 バイト目の上位 4 ビットが種類で、PUBLISH だけは下位 4 ビットを DUP・QoS・RETAIN に使う（3x の x がそれ）。")
F["e13_fixhdr"] = _f13_fixhdr()

def _f13_bitrow(o, x, y, bits, cols, bw=19, h=24, sz=10.5):
    """0/1 の文字列を 1 ビットずつの箱で描く。cols は各ビットの色。"""
    for i, b in enumerate(bits):
        o.append(RECT(x + i * bw, y, bw, h, 2, soft(cols[i]), cols[i], 1))
        o.append(T(x + i * bw + bw / 2, y + h / 2 + sz * 0.36, b, "middle", sz, INK, False, True))

def _f13_remlen():
    o = []
    bw = 19
    # ---- 321 ----
    o.append(T(16, 22, "例 1: 321 を書く", "start", 11.5, INK, True))
    xb, yb = 200, 38
    o.append(T(xb - 10, yb + 17, "321 を 7 ビットずつに分ける", "end", 10, MUT))
    hi, lo = "0000010", "1000001"
    _f13_bitrow(o, xb, yb, hi + lo, [GLD] * 7 + [SIG] * 7, bw)
    _f13_brace(o, xb, xb + 7 * bw, yb + 30, "上の 7 ビット = 2", GLD, 9.5)
    _f13_brace(o, xb + 7 * bw, xb + 14 * bw, yb + 30, "下の 7 ビット = 65", SIG, 9.5)
    o.append(T(xb + 14 * bw + 12, yb + 17, "321 = 2 × 128 + 65", "start", 10.5, INK, False, True))
    # 書く順: 下の桁から
    yo = 128
    x1, x2 = 200, 420
    _f13_bitrow(o, x1, yo, "1" + lo, [ALI] + [SIG] * 7, bw)
    _f13_bitrow(o, x2, yo, "0" + hi, [GRN] + [GLD] * 7, bw)
    o.append(ARR(xb + 10.5 * bw, yb + 52, x1 + 4.5 * bw, yo - 3, c=SIG, lw=1.4))
    o.append(ARR(xb + 3.5 * bw, yb + 52, x2 + 4.5 * bw, yo - 3, c=GLD, lw=1.4))
    o.append(T(x1 - 10, yo + 17, "書く順", "end", 10, MUT))
    o.append(T(x1 + 4 * bw, yo + 44, "1 バイト目 = 0xC1", "middle", 10.5, INK, True, True))
    o.append(T(x2 + 4 * bw, yo + 44, "2 バイト目 = 0x02", "middle", 10.5, INK, True, True))
    o.append(T(x1 + 0.5 * bw, yo + 60, "↑ 続きがある = 1", "start", 9.5, ALI))
    o.append(T(x2 + 0.5 * bw, yo + 60, "↑ 終わり = 0", "start", 9.5, GRN))
    o.append(T(x2 + 8 * bw + 16, yo + 17, "→ C1 02", "start", 12, INK, True, True))
    # ---- 16384 ----
    y2 = 222
    o.append(T(16, y2, "例 2: 16384 = 1 × 128² + 0 × 128 + 0", "start", 11.5, INK, True))
    yb2 = y2 + 12
    for k, (lab, bits, c0, c1) in enumerate((("1 バイト目", "1" + "0000000", ALI, SIG), ("2 バイト目", "1" + "0000000", ALI, PUR), ("3 バイト目", "0" + "0000001", GRN, GLD))):
        xk = 40 + k * 196
        _f13_bitrow(o, xk, yb2, bits, [c0] + [c1] * 7, bw)
        o.append(T(xk + 4 * bw, yb2 + 42, "%s = 0x%02X" % (lab, int(bits, 2)), "middle", 10, INK, True, True))
    o.append(T(40 + 2 * 196 + 8 * bw + 12, yb2 + 17, "→ 80 80 01", "start", 12, INK, True, True))
    # ---- 読み方と範囲 ----
    y3 = y2 + 84
    o.append(T(16, y3, "読むとき: 各バイトの下位 7 ビットに 1, 128, 128², 128³ を掛けて足し、最上位ビットが 0 のバイトで止まる。", "start", 10.5, INK))
    o.append(T(16, y3 + 18, "C1 02 → (0xC1 の下位 7 ビット = 65) × 1 + (0x02 = 2) × 128 = 321", "start", 10.5, MUT, False, True))
    y4 = y3 + 34
    rng = [("1 バイト", "0〜127"), ("2 バイト", "128〜16,383"), ("3 バイト", "16,384〜2,097,151"), ("4 バイト", "2,097,152〜268,435,455")]
    for k, (a, b) in enumerate(rng):
        x = 16 + k * 168
        o.append(RECT(x, y4, 162, 40, 5, PAN, LIN, 1.1))
        o.append(T(x + 81, y4 + 16, a, "middle", 10.5, INK, True))
        o.append(T(x + 81, y4 + 32, b, "middle", 10, SIG, False, True))
    return SVG(700, y4 + 50, o, "残りの長さの書き方。値を下の桁から 7 ビットずつに分け、各バイトの最上位ビットを「続きがある」印（1）にする。最後のバイトだけは 0 にする。下の段は、バイト数ごとに表せる値の範囲。")
F["e13_remlen"] = _f13_remlen()

def _f13_connect():
    o = []
    cw = 34
    x0, y = 31, 46
    g = [(TEA, ["10"]), (GLD, ["11"]), (MUT, ["00", "04"]), (PUR, ["4D", "51", "54", "54"]), (PUR, ["04"]), (SIG, ["02"]),
         (TEA, ["00", "3C"]), (MUT, ["00", "05"]), (GRN, ["64", "65", "76", "2D", "31"])]
    sub = [None, None, None, None, "M", "Q", "T", "T", None, None, None, None, None, None, "d", "e", "v", "-", "1"]
    xs = _f13_cells(o, x0, y, g, cw, 28, 11, sub, 9.5)
    _f13_brace(o, xs[0][0], xs[1][1], y - 6, "固定ヘッダ", INK, 10, up=True)
    _f13_brace(o, xs[2][0], xs[6][1], y - 6, "可変ヘッダ（10 バイト）", PUR, 10, up=True)
    _f13_brace(o, xs[7][0], xs[8][1], y - 6, "ペイロード（7 バイト）", GRN, 10, up=True)
    yl = y + 50
    labs = [(0, ["CONNECT"], TEA, 0), (1, ["残りの長さ 17"], GLD, 1), (2, ["長さ 4"], MUT, 0), (3, ["プロトコル名"], PUR, 0),
            (4, ["レベル 4"], PUR, 1), (5, ["接続", "フラグ"], SIG, 0), (6, ["キープアライブ", "60 s"], TEA, 1), (7, ["長さ 5"], MUT, 0),
            (8, ["クライアント ID"], GRN, 0)]
    for k, ls, c, lv in labs:
        a, b = xs[k]
        o.append(W(a + 2, yl, b - 2, yl, c=c, lw=1.4))
        if lv:
            o.append(W((a + b) / 2, yl, (a + b) / 2, yl + 22, c=c, lw=1))
        for i, l in enumerate(ls):
            o.append(T((a + b) / 2, yl + 14 + lv * 22 + i * 13, l, "middle", 9.5, c))
    # 接続フラグのビット
    y2 = 170
    o.append(T(20, y2, "接続フラグ 0x02 の 8 ビット", "start", 11, INK, True))
    names = [["ユーザ名"], ["パスワード"], ["ウィルの", "保持"], ["ウィルの", "QoS"], [""], ["ウィル"], ["クリーン", "セッション"], ["予約"]]
    vals = "00000010"
    bw, bx = 74, 54
    for i in range(8):
        c = SIG if i == 6 else (TEA if 2 <= i <= 5 else MUT)
        o.append(RECT(bx + i * bw, y2 + 40, bw, 26, 2, soft(c), c, 1.1))
        o.append(T(bx + i * bw + bw / 2, y2 + 58, vals[i], "middle", 12, INK, True, True))
        o.append(T(bx + i * bw + bw / 2, y2 + 80, "b%d" % (7 - i), "middle", 9, FNT, False, True))
    for i, ls in enumerate(names):
        if i == 3:
            ls = ["ウィルの QoS"]
        if i == 4:
            continue
        cx = bx + i * bw + bw / 2 if i != 3 else bx + 3.5 * bw + bw / 2
        for k, l in enumerate(ls):
            o.append(T(cx, y2 + 22 + k * 12 - (6 if len(ls) == 1 else 0), l, "middle", 9.5, SIG if i == 6 else MUT))
    o.append(T(bx + 8 * bw + 8, y2 + 58, "", "start", 10, MUT))
    o.append(T(20, y2 + 104, "ウィルのビットを 1 にすると、ウィルのトピック名とメッセージ（5 節）が、ユーザ名・パスワードのビットを 1 にすると、", "start", 10, MUT))
    o.append(T(20, y2 + 120, "それぞれの文字列が、クライアント ID の後に続く。", "start", 10, MUT))
    # CONNACK
    y3 = y2 + 150
    o.append(T(20, y3, "ブローカの答え: CONNACK（4 バイト）", "start", 11, INK, True))
    xs2 = _f13_cells(o, 40, y3 + 12, [(TEA, ["20"]), (GLD, ["02"]), (SIG, ["00"]), (GRN, ["00"])], 70, 28, 11.5)
    for k, (ls, c) in enumerate(((["CONNACK"], TEA), (["残りの長さ 2"], GLD), (["Session", "Present = 0"], SIG), (["結果 0 =", "受け入れ"], GRN))):
        a, b = xs2[k]
        for i, l in enumerate(ls):
            o.append(T((a + b) / 2, y3 + 56 + i * 13, l, "middle", 9.5, c))
    o.append(T(336, y3 + 24, "結果が 1〜5 なら、断った理由", "start", 10, MUT))
    o.append(T(336, y3 + 39, "（版・ID・使えない・認証・権限）", "start", 10, MUT))
    return SVG(700, y3 + 84, o, "クライアント ID を dev-1、キープアライブを 60 秒、クリーンセッションとした CONNECT（19 バイト）と、ブローカの答えの CONNACK。文字列は、どれも 2 バイトの長さ（ビッグエンディアン）を先に書く。")
F["e13_connect"] = _f13_connect()

def _f13_publish():
    o = []
    cw = 18.5
    topic = "dev/1/temp"
    pay = '{"t":23.5,"h":41.25}'
    th = ["%02X" % ord(ch) for ch in topic]
    ph = ["%02X" % ord(ch) for ch in pay]
    def row(y, qos):
        g = [(TEA, ["32" if qos else "30"]), (GLD, ["22" if qos else "20"]), (MUT, ["00", "0A"]), (PUR, th)]
        sub = [None, None, None, None] + list(topic)
        if qos:
            g.append((ALI, ["00", "01"])); sub += [None, None]
        g.append((GRN, ph)); sub += list(pay)
        xs = _f13_cells(o, 20, y, g, cw, 26, 9.5, sub, 9)
        return xs
    y1 = 58
    o.append(T(20, 18, "QoS 0（34 バイト）", "start", 11, INK, True))
    xs = row(y1, 0)
    _f13_brace(o, xs[0][0], xs[1][1], y1 - 4, "固定ヘッダ", INK, 9.5, up=True)
    _f13_brace(o, xs[2][0], xs[3][1], y1 - 4, "可変ヘッダ（12 バイト）", PUR, 9.5, up=True)
    _f13_brace(o, xs[4][0], xs[4][1], y1 - 4, "ペイロード（20 バイト。長さは書かない）", GRN, 9.5, up=True)
    yl = y1 + 46
    for k, l, c in ((3, "トピック名", PUR), (4, '{"t":23.5,"h":41.25}（20 バイト）', GRN)):
        a, b = xs[k]
        o.append(W(a + 2, yl, b - 2, yl, c=c, lw=1.4))
        o.append(T((a + b) / 2, yl + 14, l, "middle", 9.5, c, False, k == 4))
    for i, (l, c) in enumerate((("30 = PUBLISH（QoS 0）", TEA), ("20 = 残りの長さ 32", GLD), ("00 0A = 長さ 10", MUT))):
        o.append(T(20, yl + 14 + i * 13, l, "start", 9.5, c))
    y2 = 196
    o.append(T(20, y2 - 22, "QoS 1（36 バイト）: 1 バイト目・残りの長さが変わり、パケット識別子が入る", "start", 11, INK, True))
    xs2 = row(y2, 1)
    yl2 = y2 + 46
    for i, (l, c) in enumerate((("32 = PUBLISH（QoS 1）", TEA), ("22 = 残りの長さ 34", GLD))):
        o.append(T(20, yl2 + 14 + i * 13, l, "start", 9.5, c))
    a, b = xs2[4]
    o.append(W(a + 2, yl2, b - 2, yl2, c=ALI, lw=1.4))
    o.append(T((a + b) / 2, yl2 + 14, "パケット識別子 1", "middle", 9.5, ALI, True))
    o.append(T(20, yl2 + 46, "残りの長さ = 長さの欄 2 + トピック名 10（+ パケット識別子 2）+ ペイロード 20。", "start", 10, MUT))
    o.append(T(20, yl2 + 62, "データのほかに足されるのは、QoS 0 で 14 バイト、QoS 1・2 で 16 バイト。", "start", 10, MUT))
    return SVG(700, yl2 + 72, o, "07 章 5 節の例（トピック名 dev/1/temp、データ 20 バイト）を運ぶ PUBLISH。各バイトの下は、文字として読んだもの。ペイロードの長さは書かず、残りの長さから可変ヘッダの長さを引いて求める。QoS 1・2 では、トピック名の後に 2 バイトのパケット識別子が入る。")
F["e13_publish"] = _f13_publish()

# ---- 4 節: QoS ----
def _f13_cut():
    o = []
    xa, xb = 90, 400
    _f13_lane(o, xa, 14, 236, "機器", SIG)
    _f13_lane(o, xb, 14, 236, "ブローカ", GRN)
    _f13_msg(o, xa, 66, xb, 78, "PUBLISH #1", INK, mono=True)
    _f13_note(o, xb + 14, 66, ["受け取って、", "購読者へ渡す"], GRN)
    _f13_msg(o, xa, 108, xb, 120, "PUBLISH #2", INK, lost=0.62, mono=True)
    o.append(T(xa + (xb - xa) * 0.62, 140, "ここで接続が切れる", "middle", 10, ALI, True))
    o.append(W(xa - 40, 156, xb + 150, 156, c=ALI, lw=1.2, dash="6 4"))
    _f13_note(o, xa - 60, 166, ["#1 も #2 も TCP には書き込んだ。", "どこまで届いたかは、機器には分からない"], SIG)
    o.append(T(xa + 6, 222, "つなぎ直した後、#2 を送り直すか？", "start", 10.5, INK, True))
    x0 = 520
    o.append(T(x0, 52, "送り直さなければ", "start", 10.5, INK, True))
    o.append(T(x0, 70, "→ #2 は失われる", "start", 10.5, ALI))
    o.append(T(x0, 112, "送り直せば", "start", 10.5, INK, True))
    o.append(T(x0, 130, "→ #2 が届いていた場合は、", "start", 10.5, ALI))
    o.append(T(x0, 146, "   同じものが 2 回届く", "start", 10.5, ALI))
    o.append(T(x0, 188, "どちらを選ぶかを、", "start", 10.5, INK))
    o.append(T(x0, 204, "メッセージごとに決めるのが QoS", "start", 10.5, SIG, True))
    return SVG(700, 246, o, "TCP の接続が途中で切れると、送り手には、書き込んだメッセージがどこまで届いたかが分からない。この図では #2 が失われているが、#2 は届いていて、その後で切れた場合も、送り手からは同じに見える。")
F["e13_cut"] = _f13_cut()

def _f13_qos():
    o = []
    titles = ["QoS 0（最大 1 回）", "QoS 1（最低 1 回）", "QoS 2（ちょうど 1 回）"]
    for i in range(3):
        px = 4 + i * 232
        xa, xb = px + 54, px + 166
        o.append(T(px + 117, 18, titles[i], "middle", 11.5, SIG, True))
        _f13_lane(o, xa, 30, 250, "送り手", SIG, 10)
        _f13_lane(o, xb, 30, 250, "受け手", GRN, 10)
        if i == 0:
            _f13_msg(o, xa, 82, xb, 94, "PUBLISH", INK)
            o.append(T(xb + 6, 112, "先へ渡す", "start", 9.5, GRN, True))
            o.append(T(xa - 6, 112, "すぐ忘れる", "end", 9.5, SIG))
            foot = ["1 パケット", "確認なし"]
        elif i == 1:
            _f13_msg(o, xa, 82, xb, 94, "PUBLISH（7）", INK)
            o.append(T(xb + 6, 106, "先へ渡す", "start", 9.5, GRN, True))
            _f13_msg(o, xb, 122, xa, 134, "PUBACK（7）", GRN)
            _f13_span(o, xa, 82, 134, TEA)
            o.append(T(xa - 18, 104, "写しを", "end", 9.5, TEA)); o.append(T(xa - 18, 117, "持つ", "end", 9.5, TEA))
            foot = ["2 パケット・1 往復", "重複しうる"]
        else:
            _f13_msg(o, xa, 82, xb, 94, "PUBLISH（7）", INK)
            _f13_msg(o, xb, 122, xa, 134, "PUBREC（7）", GRN)
            _f13_msg(o, xa, 162, xb, 174, "PUBREL（7）", INK)
            _f13_msg(o, xb, 202, xa, 214, "PUBCOMP（7）", GRN)
            _f13_span(o, xa, 82, 134, TEA)
            o.append(T(xa - 18, 104, "写しを", "end", 9.5, TEA)); o.append(T(xa - 18, 117, "持つ", "end", 9.5, TEA))
            _f13_span(o, xa, 140, 214, GLD)
            o.append(T(xa - 18, 176, "番号 7", "end", 9.5, GLD)); o.append(T(xa - 18, 189, "を使用中", "end", 9.5, GLD))
            _f13_span(o, xb, 94, 174, PUR, side=1)
            o.append(T(xb + 18, 128, "番号 7", "start", 9.5, PUR)); o.append(T(xb + 18, 141, "を覚える", "start", 9.5, PUR))
            foot = ["4 パケット・2 往復", "重複しない"]
        for k, l in enumerate(foot):
            o.append(T(px + 117, 268 + k * 15, l, "middle", 10.5, ALI if (k == 1 and i == 1) else (GRN if (k == 1 and i == 2) else INK), k == 1))
    return SVG(700, 296, o, "3 つの QoS の、何も失われないときのやり取り（括弧の中はパケット識別子）。QoS 1 の送り手は PUBACK が届くまで写しを持つ。QoS 2 の受け手は、PUBLISH から PUBREL まで番号を覚え、その間に届いた同じ番号の PUBLISH を重複として扱う。")
F["e13_qos"] = _f13_qos()

def _f13_qosfail():
    o = []
    for side in range(2):
        q2 = side == 1
        px = 4 + side * 352
        xa, xb = px + 56, px + 196
        o.append(T(px + 8, 18, "QoS 2: PUBREC が失われる" if q2 else "QoS 1: PUBACK が失われる", "start", 11.5, GRN if q2 else ALI, True))
        yend = 330 if q2 else 250
        _f13_lane(o, xa, 30, yend, "送り手", SIG, 10)
        _f13_lane(o, xb, 30, yend, "受け手", GRN, 10)
        _f13_msg(o, xa, 80, xb, 92, "PUBLISH（7）", INK)
        _f13_note(o, xb + 10, 74, ["番号 7 を覚えて", "渡す（1 回目）"] if q2 else ["渡す（1 回目）"], GRN, sz=9.5)
        _f13_msg(o, xb, 112, xa, 124, "PUBREC（7）" if q2 else "PUBACK（7）", GRN, lost=0.5)
        o.append(W(px + 10, 146, px + 340, 146, c=FNT, lw=1.1, dash="6 4"))
        o.append(T(px + 340, 141, "切断 → つなぎ直す", "end", 9.5, MUT))
        _f13_msg(o, xa, 172, xb, 184, "PUBLISH（7, DUP = 1）", INK)
        if q2:
            _f13_note(o, xb + 10, 168, ["番号 7 は覚えている", "→ 渡さない"], GRN, sz=9.5, b=True)
            _f13_msg(o, xb, 206, xa, 218, "PUBREC（7）", GRN)
            _f13_msg(o, xa, 240, xb, 252, "PUBREL（7）", INK)
            _f13_note(o, xb + 10, 238, ["番号 7 を忘れる"], PUR, sz=9.5)
            _f13_msg(o, xb, 276, xa, 288, "PUBCOMP（7）", GRN)
            o.append(T(px + 175, 352, "受け手が渡すのは 1 回だけ", "middle", 11, GRN, True))
        else:
            _f13_note(o, xb + 10, 168, ["番号を覚えていない", "→ 新しいメッセージとして渡す", "（2 回目）"], ALI, sz=9.5, b=True)
            _f13_msg(o, xb, 220, xa, 232, "PUBACK（7）", GRN)
            o.append(T(px + 175, 352, "同じメッセージを 2 回渡す", "middle", 11, ALI, True))
    return SVG(700, 366, o, "確認が 1 つ失われ、接続が切れた後に送り直した場合。QoS 1 の受け手は、PUBACK を返した後は番号を覚えていないので、送り直された PUBLISH を新しいメッセージとして渡す。QoS 2 の受け手は PUBREL が来るまで番号を覚えているので、送り直しを見分けて渡さない。")
F["e13_qosfail"] = _f13_qosfail()

def _f13_legs():
    o = []
    o.append(BOX(14, 96, 110, 44, "機器", "送り手", SIG, SSOFT, SIG, sz=11.5, ssz=9.5))
    o.append(BOX(200, 90, 104, 56, "ブローカ", None, GRN, GSOFT, GRN, sz=12))
    o.append(ARR(126, 118, 198, 118, c=SIG, lw=1.8))
    o.append(T(162, 110, "QoS 1", "middle", 10, SIG, True))
    subs = [("アプリ A", "購読 QoS 0", "QoS 0"), ("アプリ B", "購読 QoS 1", "QoS 1"), ("アプリ C", "購読 QoS 2", "QoS 1")]
    for k, (nm, sb, q) in enumerate(subs):
        y = 30 + k * 64
        o.append(BOX(360, y, 108, 44, nm, sb, PUR, PSOFT, PUR, sz=11, ssz=9.5))
        o.append(ARR(306, 118, 358, y + 22, c=GRN, lw=1.6))
        o.append(T(478, y + 26, "→ " + q, "start", 10, GRN if k else ALI, True))
    o.append(T(14, 222, "PUBLISH の QoS 1 と、購読の QoS のうち、小さいほうで配る。", "start", 10.5, INK))
    # 右: 表
    gx, gy, cs = 560, 46, 40
    o.append(T(gx + 1.5 * cs, 20, "配る QoS = 小さいほう", "middle", 10.5, INK, True))
    o.append(T(gx - 6, gy - 8, "", "end", 9, MUT))
    for j in range(3):
        o.append(T(gx + j * cs + cs / 2, gy - 6, str(j), "middle", 10, PUR, True, True))
        o.append(T(gx - 8, gy + j * cs + cs / 2 + 4, str(j), "end", 10, SIG, True, True))
        for i in range(3):
            v = min(i, j)
            o.append(RECT(gx + j * cs, gy + i * cs, cs, cs, 2, soft([ALI, GLD, GRN][v]), LIN, 1))
            o.append(T(gx + j * cs + cs / 2, gy + i * cs + cs / 2 + 4, str(v), "middle", 11, INK, True, True))
    o.append(T(gx + 1.5 * cs, gy + 3 * cs + 16, "列: 購読の QoS", "middle", 9.5, PUR))
    o.append(T(gx + 1.5 * cs, gy + 3 * cs + 30, "行: PUBLISH の QoS", "middle", 9.5, SIG))
    return SVG(700, 232, o, "QoS は区間ごとに決まる。送り手からブローカまでは PUBLISH の QoS で、ブローカから各購読者までは、PUBLISH の QoS と、SUBACK で認めた購読の QoS のうち小さいほうで運ばれる。")
F["e13_legs"] = _f13_legs()

# ---- 5 節: キープアライブとウィル ----
def _f13_ka():
    o = []
    t0, t1, x0, x1 = -10, 232, 130, 684
    X = lambda t: x0 + (t - t0) / (t1 - t0) * (x1 - x0)
    rows = [("機器が送る", 64), ("機器が受け取る", 124), ("ブローカの期限", 185)]
    for nm, y in rows:
        o.append(T(x0 - 14, y + 4, nm, "end", 10.5, INK, True))
        if y != 185:
            o.append(W(X(t0), y, X(t1), y, c=GRD, lw=1))
    # 機器が送るもの
    for t, nm, c in ((0, "PUBLISH", SIG), (60, "PINGREQ", TEA), (120, "PINGREQ", TEA)):
        o.append(D(X(t), 64, c, 5))
        o.append(T(X(t), 52, nm, "middle", 9.5, c, True))
    o.append(W(X(180) - 5, 59, X(180) + 5, 69, c=ALI, lw=2) + W(X(180) - 5, 69, X(180) + 5, 59, c=ALI, lw=2))
    o.append(T(X(180), 52, "PINGREQ（届かない）", "middle", 9.5, ALI, True))
    o.append(DIM(X(0), 80, X(60), 80, "K = 60 s", c=MUT, above=False))
    o.append(DIM(X(120), 80, X(180), 80, "K", c=MUT, above=False))
    # 機器が受け取るもの
    for t in (60, 120):
        o.append(D(X(t), 124, GRN, 4.5))
        o.append(T(X(t) + 7, 118, "PINGRESP", "start", 9, GRN))
    o.append(RECT(X(180), 118, X(190) - X(180), 12, 2, TSOFT, TEA, 1.1))
    o.append(T(X(180) - 6, 128, "T_r = 10 s", "end", 9.5, TEA))
    o.append(D(X(190), 124, ALI, 5))
    o.append(T(X(190) + 9, 117, "機器が気づく", "start", 9.5, ALI, True))
    o.append(T(X(190) + 9, 130, "（故障から 60 s）", "start", 9.5, ALI))
    # ブローカの期限: 受け取るたびに 1.5 K を数え直す
    for k, (a, b) in enumerate(((0, 60), (60, 120), (120, 210))):
        yk = 172 + k * 9
        o.append(RECT(X(a), yk, X(a + 90) - X(a), 7, 2, "none", TEA, 1, dash="3 2"))
        o.append(RECT(X(a), yk, X(b) - X(a), 7, 2, TSOFT, TEA, 1.1))
    o.append(DIM(X(120), 206, X(210), 206, "1.5 K = 90 s", c=TEA, above=False))
    o.append(D(X(210), 193.5, ALI, 5))
    o.append(T(X(210) - 8, 152, "ブローカが切り、ウィルを出す", "end", 9.5, ALI, True))
    o.append(T(X(210) - 8, 165, "（故障から 80 s）", "end", 9.5, ALI))
    # 故障
    o.append(W(X(130), 34, X(130), 196, c=ALI, lw=1.6, dash="5 3"))
    o.append(T(X(130), 26, "回線が切れる（t = 130 s）", "middle", 10, ALI, True))
    # 時間軸
    ya = 232
    o.append(W(X(t0), ya, X(t1), ya, c=MUT, lw=1.1))
    for t in range(0, 231, 30):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9.5, MUT))
    o.append(T(X(t1), ya + 30, "時刻 [s]", "end", 9.5, MUT))
    return SVG(700, ya + 38, o, "キープアライブ K = 60 秒の時間軸の例。機器は、何も送らないまま K たつと PINGREQ を送る。ブローカは、受け取るたびに 1.5 K の期限を数え直し（破線はその期限）、期限までに何も届かなければ接続を切る。t = 130 s に回線が切れると、機器は次の PINGREQ への答えを T_r 待って気づき、ブローカは最後に受け取ってから 1.5 K で気づく。")
F["e13_ka"] = _f13_ka()

def _f13_will():
    lanes = [("機器 dev-1", SIG), ("ブローカ", GRN), ("アプリ A", PUR), ("アプリ B", PUR)]
    msgs = [
        (2, 1, "購読: dev/+/status", {"c": PUR}),
        (0, 1, "CONNECT（ウィル = offline、保持）", {"c": SIG}),
        (0, 1, "PUBLISH dev/1/status online（保持）", {"c": SIG, "b": True}),
        (1, 2, "online", {"c": GRN}),
        ("note", 0, "電源が切れる\n（何も送らずに消える）", {"c": ALI}),
        ("gap", "1.5 K たつ"),
        ("note", 1, "ウィルを出す。保持\nメッセージは offline に", {"c": GRN}),
        (1, 2, "offline", {"c": GRN, "b": True}),
        (3, 1, "購読: dev/+/status", {"c": PUR}),
        (1, 3, "offline（RETAIN = 1: 以前の値）", {"c": GRN, "b": True}),
    ]
    return SEQFIG(lanes, msgs, "ウィルメッセージと保持メッセージで、機器の状態を知らせる例。機器はつないだら online を保持メッセージとして送り、ウィルには同じトピックの offline を入れておく。機器が黙って消えると、ブローカが offline を出し、それが保持メッセージになるので、後から購読したアプリ B にもすぐ届く。", w=700)
F["e13_will"] = _f13_will()

# ---- 6 節: 機器側の実装 ----
def _f13_arch():
    o = []
    o.append(BOX(14, 40, 130, 40, "測定のタスク", None, PUR, PSOFT, PUR, sz=11))
    o.append(BOX(14, 150, 130, 40, "命令を実行するタスク", None, PUR, PSOFT, PUR, sz=10.5))
    o.append(RECT(228, 22, 282, 182, 9, SSOFT, SIG, 1.6))
    o.append(T(369, 42, "MQTT タスク（05 章 2 節の通信タスク）", "middle", 11, SIG, True))
    subs = ["受信: バイトの列をパケットに区切る", "確認待ちの列とパケット識別子", "キープアライブ: 送った・受けた時刻、期限", "接続の状態とつなぎ直し"]
    for k, s_ in enumerate(subs):
        o.append(RECT(240, 54 + k * 36, 258, 28, 5, PAN, LIN, 1.1))
        o.append(T(369, 54 + k * 36 + 18.5, s_, "middle", 10, INK))
    o.append(ARR(146, 60, 226, 72, c=PUR, lw=1.6))
    o.append(T(186, 54, "送るキュー", "middle", 9.5, PUR))
    o.append(ARR(226, 160, 146, 170, c=PUR, lw=1.6))
    o.append(T(186, 190, "受けたキュー", "middle", 9.5, PUR))
    st = [("TLS（12 章）", TEA), ("TCP/IP スタック（11 章）", GRN), ("Wi-Fi のドライバ（09 章）", SIG)]
    for k, (nm, c) in enumerate(st):
        o.append(RECT(228, 212 + k * 30, 282, 26, 5, soft(c), c, 1.2))
        o.append(T(369, 212 + k * 30 + 17.5, nm, "middle", 10.5, c, True))
    o.append(BOX(576, 120, 112, 50, "ブローカ", "クラウド", GRN, GSOFT, GRN, sz=12, ssz=9.5))
    o.append(W(510, 280, 546, 280, 546, 145, 574, 145, c=GLD, lw=1.6))
    o.append(T(552, 220, "インターネット", "start", 9.5, GLD))
    o.append(T(14, 238, "ほかのタスクは", "start", 9.5, MUT))
    o.append(T(14, 252, "接続に触らず、", "start", 9.5, MUT))
    o.append(T(14, 266, "キューで頼む", "start", 9.5, MUT))
    return SVG(700, 306, o, "機器のファームウェアの構成の例。MQTT の接続は 1 つのタスクだけが扱い、ほかのタスクはキューで送るメッセージを頼み、受け取ったメッセージもキューで受け取る。MQTT タスクは、受信の区切り・確認待ち・キープアライブ・接続の状態を管理し、TLS と TCP/IP スタックを通してブローカとやり取りする。")
F["e13_arch"] = _f13_arch()

def _f13_rxsm():
    o = []
    g = [(TEA, ["20", "02", "00", "00"]), (SIG, ["30", "0D", "00", "09", "64", "65", "76", "2F", "31", "2F", "63", "6D", "64", "67", "6F"]), (TEA, ["D0", "00"])]
    cw, x0, y = 30, 35, 44
    xs = _f13_cells(o, x0, y, g, cw, 26, 10)
    for (a, b), nm in zip(xs, ("CONNACK", "PUBLISH dev/1/cmd \"go\"（残りの長さ 13）", "PINGRESP")):
        _f13_brace(o, a, b, y - 5, nm, INK, 9.5, up=True)
    chunks = [(0, 7, "1 回目の受信（7 バイト）"), (7, 16, "2 回目（9 バイト）"), (16, 21, "3 回目（5 バイト）")]
    for a, b, nm in chunks:
        _f13_brace(o, x0 + a * cw, x0 + b * cw, y + 32, nm, GLD, 9.5)
        if a:
            o.append(W(x0 + a * cw, y - 2, x0 + a * cw, y + 30, c=GLD, lw=2.2))
    o.append(T(20, 116, "届く区切り（金）は、パケットの区切りと関係ない。1 バイトずつ状態機械に通して区切る:", "start", 10.5, INK))
    ys = 186
    o.append(STATE(120, ys, 150, 46, "1 バイト目待ち", TEA, "RX_FIRST", start=True))
    o.append(STATE(370, ys, 150, 46, "残りの長さ", GLD, "RX_LEN"))
    o.append(STATE(610, ys, 140, 46, "残りのバイト", SIG, "RX_BODY"))
    o.append(EDGE(196, ys - 10, 294, ys - 10, "1 バイト目を覚える", c=INK, loff=(0, -4)))
    o.append(EDGE(294, ys + 12, 196, ys + 12, "長さ 0 → 渡す", c=TEA, loff=(0, 18)))
    o.append(SELF(370, ys - 23, "続きの印 = 1 → 重みを 128 倍", c=GLD))
    o.append(EDGE(446, ys, 539, ys, "印 = 0、長さ > 0", c=INK, loff=(0, -6)))
    o.append(SELF(610, ys - 23, "1 バイトためる", c=SIG))
    o.append(EDGE(610, ys + 24, 120, ys + 24, None, bend=0.16, c=SIG))
    o.append(T(470, ys + 76, "長さの分そろった → パケットを 1 つ渡す（on_packet）", "middle", 10, SIG))
    o.append(EDGE(370, ys + 24, 370, ys + 98, None, c=ALI))
    o.append(BOX(300, ys + 100, 140, 30, "-1: 接続を閉じる", None, ALI, ASOFT, ALI, sz=10.5))
    o.append(T(290, ys + 116, "4 バイト目でも続く・", "end", 9.5, ALI))
    o.append(T(290, ys + 129, "RX_MAX を超える", "end", 9.5, ALI))
    return SVG(700, ys + 142, o, "TCP（TLS）から届くバイトの区切りは、MQTT のパケットの区切りと関係がない（上）。受け手は 1 バイトずつ 3 つの状態の状態機械に通し、残りの長さの分がそろうたびにパケットを 1 つ取り出す（下）。")
F["e13_rxsm"] = _f13_rxsm()

def _f13_reconn():
    o = []
    def bx(x, y, w, t, s, c, h=46):
        o.append(BOX(x, y, w, h, t, s, c, soft(c), c, sz=10.5, ssz=9))
    bx(10, 30, 116, "待つ", "バックオフとジッタ", TEA)
    bx(142, 30, 118, "TCP・TLS をつなぐ", "11・12 章", GRN)
    bx(276, 30, 106, "CONNECT を送る", None, SIG)
    bx(398, 30, 134, "CONNACK の結果は 0？", None, GLD)
    bx(580, 30, 110, "長く待つか、知らせる", None, ALI)
    for a, b in ((126, 142), (260, 276), (382, 398)):
        o.append(ARR(a, 53, b - 1, 53, c=MUT, lw=1.5))
    o.append(ARR(532, 53, 579, 53, c=ALI, lw=1.5))
    o.append(T(556, 46, "いいえ", "middle", 9.5, ALI, True))
    bx(10, 140, 150, "Session Present は 1？", None, GLD)
    o.append(W(465, 76, 465, 112, 85, 112, c=MUT, lw=1.5) + ARR(85, 112, 85, 139, c=MUT, lw=1.5))
    o.append(T(475, 100, "0（受け入れ）", "start", 9.5, GRN, True))
    bx(190, 140, 170, "確認待ちを送り直す", "送った順に、DUP = 1", SIG)
    bx(390, 140, 150, "online を保持で送る", "5 節", SIG)
    bx(570, 140, 120, "つながった", "受信とキープアライブ", GRN)
    o.append(ARR(160, 163, 189, 163, c=MUT, lw=1.5))
    o.append(T(174, 156, "はい", "middle", 9.5, GRN, True))
    o.append(ARR(360, 163, 389, 163, c=MUT, lw=1.5))
    o.append(ARR(540, 163, 569, 163, c=MUT, lw=1.5))
    bx(10, 232, 150, "購読し直す", "SUBSCRIBE", PUR)
    o.append(ARR(85, 186, 85, 231, c=PUR, lw=1.5))
    o.append(T(93, 214, "いいえ（セッションが無い）", "start", 9.5, PUR, True))
    o.append(W(160, 255, 275, 255, c=PUR, lw=1.5) + ARR(275, 255, 275, 187, c=PUR, lw=1.5))
    return SVG(700, 290, o, "MQTT の層でつなぎ直す手順。CONNACK で断られたら繰り返しても直らないので長く待つ。Session Present が 0 なら、ブローカはセッションを持っていないので購読をやり直す。確認待ちのメッセージは、どちらの場合も送った順に送り直す。")
F["e13_reconn"] = _f13_reconn()

def _f13_payload():
    o = []
    js = '{"t":23.5,"h":41.25}'
    cw = 25
    o.append(T(20, 40, "JSON（20 バイト）", "start", 11, INK, True))
    _f13_cells(o, 170, 22, [(GRN, list(js))], cw, 26, 11)
    o.append(T(20, 92, "バイナリ（4 バイト）", "start", 11, INK, True))
    xs = _f13_cells(o, 170, 74, [(SIG, ["09", "2E"]), (PUR, ["10", "1D"])], cw, 26, 10)
    o.append(T(xs[1][1] + 16, 84, "09 2E: 温度 ×100 = 2350（符号付き 16 ビット）", "start", 10, SIG))
    o.append(T(xs[1][1] + 16, 100, "10 1D: 湿度 ×100 = 4125（符号なし 16 ビット）。どちらもビッグエンディアン", "start", 10, PUR))
    y0 = 158
    o.append(T(20, y0 - 8, "線の上のバイト数（07 章 5 節の数え方。Ethernet・IPv4・TCP）", "start", 11, INK, True))
    sc = 4.0
    for k, (nm, d) in enumerate((("JSON", 20), ("バイナリ", 4))):
        y = y0 + 6 + k * 40
        o.append(T(150, y + 18, nm, "end", 10.5, INK, True))
        x = 160
        for lab, n, c in (("データ %d" % d, d, GRN), ("MQTT 14", 14, PUR), ("TCP・IP・Ethernet 78", 78, GLD)):
            o.append(RECT(x, y, n * sc, 26, 2, soft(c), c, 1.1))
            if n * sc > tw(lab, 9.5) + 6:
                o.append(T(x + n * sc / 2, y + 17, lab, "middle", 9.5, c, True))
            x += n * sc
        o.append(T(x + 8, y + 18, "%d バイト" % (d + 92), "start", 10.5, INK, True))
    o.append(T(160 + 2 * sc, y0 + 6 + 40 + 40, "データ 4", "start", 9.5, GRN))
    return SVG(700, y0 + 96, o, "同じ測定値を、JSON とバイナリで表したペイロード。バイナリは 4 バイトで済むが、トピック名と下の層のヘッダは変わらないので、線の上のバイト数は 112 から 96 に、14 % 減るだけである。")
F["e13_payload"] = _f13_payload()
