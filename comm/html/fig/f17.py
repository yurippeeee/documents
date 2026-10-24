# -*- coding: utf-8 -*-
# 17 章 アドバタイズとスキャン の図
import random as _f17_random

_F17_CH = ["37", "38", "39"]

def _f17_cells(x, y, hexes, cw, ch, colors, sz=10.5):
    """バイトの列を 1 バイト 1 マスで描く。hexes は "02" のような文字列のリスト。"""
    o = []
    for i, (hx, c) in enumerate(zip(hexes, colors)):
        o.append(RECT(x + i * cw, y, cw, ch, 2, soft(c), c, 1.1))
        o.append(T(x + i * cw + cw / 2, y + ch / 2 + sz * 0.36, hx, "middle", sz, INK, False, True))
    return "".join(o)

def _f17_brace(x1, x2, y, label, c=MUT, up=True, sz=9.5, b=False):
    """横の括弧（x1〜x2）と文字。up=True で括弧の上に文字。"""
    d = -5 if up else 5
    o = [W(x1, y + d, x1, y, x2, y, x2, y + d, c=c, lw=1.1)]
    o.append(T((x1 + x2) / 2, y - 5 if up else y + sz + 4, label, "middle", sz, c, b))
    return "".join(o)

# ---- 1 節: アドバタイズイベント ----
def _f17_event():
    o = []
    ys = [44, 68, 92]
    x0 = 112
    for ch, f, y in zip(_F17_CH, ("2402 MHz", "2426 MHz", "2480 MHz"), ys):
        o.append(T(x0 - 62, y + 4, "ch " + ch, "end", 11, SIG, True))
        o.append(T(x0 - 8, y + 4, f, "end", 9.5, MUT))
        o.append(W(x0, y, 690, y, c=GRD, lw=1))
    evx = [130, 352, 590]
    for k, ex in enumerate(evx):
        for c in range(3):
            px = ex + c * 22
            o.append(RECT(px, ys[c] - 8, 13, 16, 2, SSOFT, SIG, 1.3))
            o.append(RECT(px + 13, ys[c] - 5, 7, 10, 1, "none", SIG, 0.9, dash="2 1.5"))
        o.append(T(ex + 33, 22, "イベント", "middle", 10, INK, True))
    for a, b, lab in ((evx[0], evx[1], "advInterval + advDelay"), (evx[1], evx[2], "advInterval + advDelay")):
        o.append(DIM(a, 114, b, 114, None, c=MUT))
        o.append(T((a + b) / 2, 130, lab, "middle", 10, INK))
        o.append(T((a + 66 + b) / 2, 72, "眠る", "middle", 10, FNT))
    o.append(T(470, 146, "advDelay はイベントごとに 0〜10 ms の乱数（2 つの間隔は少し違う）", "middle", 9.5, MUT))
    # 1 回のイベントの拡大（µs）
    y2 = 196
    sc = 0.235
    xs = 112
    segs = []
    t = 0
    for c in range(3):
        segs.append((t, t + 376, "ch %s で送る" % _F17_CH[c], SIG, True))
        segs.append((t + 376, t + 376 + 300, "受信", SIG, False))
        t += 376 + 300 + 110
    o.append(RECT(evx[0] - 5, 30, 74, 74, 6, "none", FNT, 1, dash="3 3"))
    for a, b, lab, c, tx in segs:
        if tx:
            o.append(RECT(xs + a * sc, y2, (b - a) * sc, 22, 2, SSOFT, SIG, 1.3))
            o.append(T(xs + (a + b) / 2 * sc, y2 + 15, lab, "middle", 9.5, SIG, True))
        else:
            o.append(RECT(xs + a * sc, y2 + 4, (b - a) * sc, 14, 2, "none", SIG, 1, dash="3 2"))
            o.append(T(xs + (a + b) / 2 * sc, y2 + 15, lab, "middle", 9, MUT))
    o.append(DIM(xs, y2 - 8, xs + 376 * sc, y2 - 8, None, c=MUT))
    o.append(T(xs + 188 * sc, y2 - 13, "376 µs", "middle", 9.5, INK))
    o.append(DIM(xs, y2 + 34, xs + (t - 110) * sc, y2 + 34, None, c=MUT))
    o.append(T(xs + (t - 110) / 2 * sc, y2 + 50, "1 回のイベント（1〜数 ms。代表値）", "middle", 10, INK))
    o.append(T(16, y2 - 30, "点線の枠の 1 回を拡大", "start", 10, MUT, True))
    return SVG(700, y2 + 62, o, "アドバタイズイベント。上は 3 回のイベントで、イベントの間は縮尺どおりではない。アドバタイザは 1 回のイベントで、チャネル 37・38・39 に同じパケットを続けて送り、相手が応答してよい種類のパケット（2 節）なら、それぞれの後で少しの間受信して応答を待つ。次のイベントまでは advInterval に乱数の advDelay を足した時間だけ眠る。下は 1 回のイベントの拡大（パケットは AdvData 31 バイトのとき。受信の長さとチャネルを替える時間は一例）。")
F["e17_event"] = _f17_event()

def _f17_collide():
    o = []
    xs = [128 + k * 112 for k in range(5)]
    a_d = [0, 2.1, 7.3, 4.4, 9.2]
    b_d = [0, 8.6, 1.5, 1.0, 0.7]
    def cluster(x, y, c):
        s = []
        for j in range(3):
            s.append(RECT(x + j * 9, y - 7, 7, 14, 1.5, soft(c), c, 1.2))
        return "".join(s)
    for p, (title, delay) in enumerate((("(a) advDelay が無い: 2 台の送り始めのずれは変わらない", False),
                                        ("(b) advDelay がある: ずれがイベントごとに乱数で変わる", True))):
        y0 = 26 + p * 118
        o.append(T(16, y0, title, "start", 11, ALI if not delay else GRN, True))
        ya, yb = y0 + 26, y0 + 52
        o.append(T(100, ya + 4, "機器 A", "end", 10.5, SIG, True))
        o.append(T(100, yb + 4, "機器 B", "end", 10.5, PUR, True))
        o.append(W(108, ya, 690, ya, c=GRD, lw=1))
        o.append(W(108, yb, 690, yb, c=GRD, lw=1))
        for k, x in enumerate(xs):
            da = a_d[k] if delay else 0.0
            db = b_d[k] if delay else 0.0
            o.append(cluster(x + da * 4, ya, SIG))
            o.append(cluster(x + db * 4, yb, PUR))
            diff = abs(da - db)
            hit = diff < 0.376
            xm = x + 30
            if hit:
                o.append(T(xm, y0 + 80, "ずれ 0 → 重なる", "middle", 9.5, ALI, True))
                o.append(W(x - 2, ya + 9, x - 2, yb - 9, c=ALI, lw=1.6))
                o.append(W(x + 27, ya + 9, x + 27, yb - 9, c=ALI, lw=1.6))
            else:
                o.append(T(xm, y0 + 80, "ずれ %.1f ms" % diff, "middle", 9.5, GRN))
    o.append(T(16, 26 + 2 * 118 - 10, "1 つの塊が 1 回のイベント（37・38・39 の 3 つのパケット）。ずれを見やすく広げてあり、横は縮尺どおりではない。", "start", 9.5, MUT))
    return SVG(700, 26 + 2 * 118, o, "同じ advInterval の 2 台が同じ時刻に送り始めた場合。(a) advDelay が無いと、2 台の間隔はどちらもちょうど advInterval なので、送り始めのずれは 0 のまま変わらず、毎回同じチャネルのパケットが重なる。(b) advDelay があると、ずれはイベントごとに 2 台の乱数の差だけ変わり、重なりは続かない。")
F["e17_collide"] = _f17_collide()

def _f17_square():
    o = []
    D, L = 10.0, 0.376
    x0, y0, s = 70, 34, 200
    X = lambda v: x0 + v / D * s
    Y = lambda v: y0 + s - v / D * s
    o.append(PL([(X(L), Y(0)), (X(D), Y(0)), (X(D), Y(D - L))], c=GRN, lw=1.2, fill=GSOFT))
    o.append(PL([(X(0), Y(L)), (X(0), Y(D)), (X(D - L), Y(D))], c=GRN, lw=1.2, fill=GSOFT))
    o.append(PL([(X(0), Y(0)), (X(L), Y(0)), (X(D), Y(D - L)), (X(D), Y(D)), (X(D - L), Y(D)), (X(0), Y(L))], c=ALI, lw=1.2, fill=ASOFT))
    o.append(RECT(x0, y0, s, s, 0, "none", MUT, 1.2))
    for v in (0, 5, 10):
        o.append(T(X(v), y0 + s + 15, "%g" % v, "middle", 9.5, MUT))
        o.append(T(x0 - 6, Y(v) + 3.5, "%g" % v, "end", 9.5, MUT))
    o.append(T(x0 + s / 2, y0 + s + 32, "A の advDelay X [ms]", "middle", 10, MUT))
    o.append(T(x0 - 30, y0 + s / 2, "B の advDelay Y [ms]", "middle", 10, MUT, rot=-90))
    o.append(T(X(7.2), Y(2.2), "Y < X − L", "middle", 10, GRN, True))
    o.append(T(X(7.2), Y(2.2) + 14, "重ならない", "middle", 9.5, GRN))
    o.append(T(X(2.8), Y(7.6), "Y > X + L", "middle", 10, GRN, True))
    o.append(T(X(2.8), Y(7.6) + 14, "重ならない", "middle", 9.5, GRN))
    o.append(ARR(X(8.6), y0 - 8, X(8.0), Y(8.0) - 3, c=ALI, lw=1.2, head=6))
    o.append(T(X(8.6) + 6, y0 - 10, "|X − Y| < L の帯: 重なる", "start", 10, ALI, True))
    tx = 350
    lines = [("帯の外の三角形 2 つの面積", MUT, False),
             ("= 2 × (D − L)² ÷ 2 = (D − L)²", INK, False),
             ("重なる確率 = 帯の面積 ÷ 正方形の面積", MUT, False),
             ("= (D² − (D − L)²) ÷ D²", INK, False),
             ("= 1 − (1 − L/D)²", INK, True),
             ("L = 0.376 ms、D = 10 ms では", MUT, False),
             ("1 − 0.9624² ≈ 0.074（約 7.4 %）", ALI, True)]
    for i, (t_, c, b) in enumerate(lines):
        o.append(T(tx, 70 + i * 24 + (8 if i >= 2 else 0) + (8 if i >= 5 else 0), t_, "start", 11, c, b))
    return SVG(700, y0 + s + 44, o, "2 台の advDelay X と Y（どちらも 0〜10 ms の一様な乱数）の組は、1 辺 D = 10 ms の正方形の中に一様に散らばる。同じチャネルのパケットが重なるのは |X − Y| < L のとき（赤の帯）で、その確率は帯の面積の割合に等しい。帯の幅は L = 0.376 ms のとおりに描いてある。")
F["e17_square"] = _f17_square()

# ---- 2 節: パケットの形 ----
def _f17_packet():
    o = []
    fields = [("プリアンブル", 74, MUT, "0101…", "1 B"), ("アクセスアドレス", 118, SIG, "D6 BE 89 8E", "4 B"),
              ("ヘッダ", 64, PUR, "40 1E", "2 B"), ("AdvA", 122, GRN, "44 9B 20 7A 31 C5", "6 B"),
              ("AdvData", 196, GLD, "02 01 06 06 09 …", "24 B（0〜31）"), ("CRC", 70, ALI, "24 ビット", "3 B")]
    x, y, h = 28, 28, 40
    pos = []
    for name, w, c, val, sz_ in fields:
        o.append(RECT(x, y, w, h, 4, soft(c), c, 1.3))
        o.append(T(x + w / 2, y + 16, name, "middle", 10.5, c, True))
        o.append(T(x + w / 2, y + 32, val, "middle", 9.5, INK, False, val[0].isdigit() or val[0] in "ABCDEF" or val.startswith("0101")))
        o.append(T(x + w / 2, y + h + 13, sz_, "middle", 9, MUT))
        pos.append((x, x + w)); x += w
    o.append(_f17_brace(pos[2][0], pos[4][1], y + h + 30, "PDU", PUR, up=False, sz=10, b=True))
    o.append(_f17_brace(pos[3][0], pos[4][1], y - 6, "ペイロード（AdvA + AdvData）", GLD, up=True, sz=10, b=True))
    o.append(T(350, y + h + 64, "この例は 40 バイトで、LE 1M では 40 × 8 µs = 320 µs。AdvData が 31 バイトなら 47 バイトで 376 µs。", "middle", 10, INK))
    # ヘッダのビット
    yb = y + h + 92
    o.append(T(28, yb + 12, "ヘッダの 16 ビット（ビット 0 から送る）", "start", 10.5, PUR, True))
    bits, hb = BITS(64, yb + 20, [("種類", 4, PUR), ("RFU", 1, MUT), ("ChSel", 1, MUT), ("TxAdd", 1, GLD), ("RxAdd", 1, GLD), ("長さ", 8, PUR)], bit_w=36, h=28, row_bits=16, sz=10)
    o.append(bits)
    vals = [(0, 4, "0000 = ADV_IND", PUR), (4, 1, "0", MUT), (5, 1, "0", MUT), (6, 1, "1", GLD), (7, 1, "0", GLD), (8, 8, "0x1E = 30（ペイロードのバイト数）", PUR)]
    for b0, n, t_, c in vals:
        o.append(T(64 + (b0 + n / 2) * 36, yb + 20 + hb + 14, t_, "middle", 9.5, c, n > 1))
    o.append(T(64 + 6.5 * 36, yb + 20 + hb + 30, "TxAdd = 1: AdvA はランダムアドレス（7 節）", "middle", 9.5, GLD))
    o.append(T(28, yb + 20 + hb + 50, "1 バイト目 = 0b0100_0000 = 0x40、2 バイト目 = 0x1E。RFU は使わない。ChSel はアルゴリズム #2 に対応するか。", "start", 9.5, MUT))
    return SVG(700, yb + 20 + hb + 62, o, "アドバタイズのパケット（LE 1M）。例は 3 節の温湿度センサの ADV_IND で、AdvA はランダムアドレス C5:31:7A:20:9B:44（7 節）。2 バイト以上の値は下位のバイトから送るので、アクセスアドレス 0x8E89BED6 は D6 BE 89 8E、AdvA は 44 9B 20 7A 31 C5 と並ぶ。下はヘッダの 16 ビット。")
F["e17_packet"] = _f17_packet()

def _f17_pdus():
    o = []
    sc, x0 = 0.42, 176
    X = lambda t: x0 + t * sc
    rows = [("ADV_IND", True, True), ("ADV_SCAN_IND", False, True), ("ADV_NONCONN_IND", False, False), ("ADV_DIRECT_IND", "相手だけ", False)]
    y0, rh = 24, 66
    def box(a, b, y, lab, c, dash=None):
        s = RECT(X(a), y, (b - a) * sc, 20, 3, soft(c), c, 1.3, dash=dash)
        return s + T(X((a + b) / 2), y + 14, lab, "middle", 9.5, c, True, True)
    for i, (name, conn, scan) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(12, y + 14, name, "start", 11, SIG, True, True))
        ct = "接続 " + ("○" if conn is True else ("×" if conn is False else "○（相手だけ）"))
        o.append(T(12, y + 31, ct, "start", 9.5, GRN if conn else MUT))
        o.append(T(12, y + 45, "スキャン " + ("○" if scan else "×"), "start", 9.5, GRN if scan else MUT))
        if name == "ADV_DIRECT_IND":
            o.append(box(0, 176, y, "ADV", SIG))
            o.append(box(326, 678, y + 26, "CONNECT_IND", PUR))
            o.append(T(X(176 + 75), y + 40, "150 µs", "middle", 9, MUT))
            o.append(T(X(700), y + 40, "指定された相手だけが送れる", "start", 9.5, PUR))
            continue
        o.append(box(0, 376, y, name.split("_")[0] + "_" + name.split("_")[1] if name != "ADV_NONCONN_IND" else "ADV_NONCONN", SIG))
        if name == "ADV_NONCONN_IND":
            o.append(T(X(420), y + 14, "受信しないで、すぐ次のチャネルへ", "start", 9.5, MUT))
            continue
        o.append(box(526, 702, y + 26, "SCAN_REQ", PUR))
        o.append(box(852, 1228, y, "SCAN_RSP", SIG))
        o.append(T(X(451), y + 40, "150 µs", "middle", 9, MUT))
        o.append(T(X(777), y + 14, "150 µs", "middle", 9, MUT))
        if name == "ADV_IND":
            o.append(T(X(1240), y + 40, "または CONNECT_IND", "end", 9.5, PUR))
            o.append(T(X(1240), y + 54, "で接続へ（18 章）", "end", 9.5, PUR))
    ya = y0 + 4 * rh + 4
    o.append(W(x0, ya, X(1228), ya, c=MUT, lw=1))
    for t in range(0, 1300, 200):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9, MUT))
    o.append(T(X(1228), ya + 30, "時間 [µs]（1 本のチャネルの上）", "end", 9.5, MUT))
    o.append(LEGEND(x0, ya + 30, [(SIG, "アドバタイザが送る"), (PUR, "スキャナ・イニシエータが送る")]))
    return SVG(700, ya + 42, o, "アドバタイザが送る 4 つの PDU と、1 本のチャネルの上で続きうるやり取り（時間は縮尺どおり。パケットは AdvData・スキャン応答とも 31 バイトのとき）。接続可能・スキャン可能な種類では、アドバタイザは送った後に受信して待ち、受け手は 150 µs 後に SCAN_REQ か CONNECT_IND を送る。ADV_NONCONN_IND は受信しない。")
F["e17_pdus"] = _f17_pdus()

# ---- 3 節: AD 構造 ----
def _f17_ad():
    o = []
    x0 = 150
    for i, (title, cells) in enumerate((("03 章の TLV", [("型", 1, PUR), ("長さ", 1, GLD), ("値", 4, SIG)]),
                                        ("AD 構造", [("長さ", 1, GLD), ("AD タイプ", 1, PUR), ("データ", 4, SIG)]))):
        y = 22 + i * 62
        o.append(T(x0 - 14, y + 19, title, "end", 11, INK, True))
        x = x0
        for name, n, c in cells:
            w = n * 58
            o.append(RECT(x, y, w, 28, 4, soft(c), c, 1.3))
            o.append(T(x + w / 2, y + 18.5, name, "middle", 10.5, c, True))
            x += w
        if i == 0:
            o.append(_f17_brace(x0 + 116, x0 + 348, y + 36, "長さ = 値のバイト数", MUT, up=False))
        else:
            o.append(_f17_brace(x0 + 58, x0 + 348, y + 36, "長さ = AD タイプ + データのバイト数（0 なら列の終わり）", GLD, up=False))
    o.append(T(x0 + 370, 41, "型が先", "start", 10, MUT))
    o.append(T(x0 + 370, 103, "長さが先。型を読まずに次へ進める", "start", 10, MUT))
    # 例の 24 バイト
    ex = "02 01 06 06 09 54 48 2D 30 31 03 03 0F 18 02 0A 00 06 FF FF FF 29 09 57".split()
    groups = [("フラグ", 3, SIG), ("名前（完全）TH-01", 7, PUR), ("16 ビット UUID", 4, GRN), ("送信電力", 3, TEA), ("メーカー固有データ", 7, GLD)]
    cw, xs, yc = 27, 26, 196
    cols = []
    for _, n, c in groups:
        cols += [c] * n
    o.append(T(xs, yc - 40, "例: 温湿度センサの AdvData（24 バイト）", "start", 11, INK, True))
    o.append(_f17_cells(xs, yc, ex, cw, 26, cols, 10.5))
    k = 0
    for name, n, c in groups:
        o.append(_f17_brace(xs + k * cw + 2, xs + (k + n) * cw - 2, yc - 6, name, c, up=True, sz=10, b=True))
        o.append(T(xs + k * cw + cw / 2, yc + 39, "長さ", "middle", 9, MUT))
        o.append(T(xs + (k + 1) * cw + cw / 2, yc + 39, "型", "middle", 9, MUT))
        k += n
    notes = [(2, "0x06"), (5, "'T' 'H' '-' '0' '1'"), (12, "0x180F"), (16, "0 dBm")]
    for b0, t_ in notes:
        n_ = 1 if t_ in ("0x06", "0 dBm") else (5 if t_.startswith("'") else 2)
        o.append(T(xs + (b0 + n_ / 2) * cw, yc + 54, t_, "middle", 9.5, INK))
    o.append(_f17_brace(xs + 19 * cw + 2, xs + 21 * cw - 2, yc + 31, "会社 ID", GLD, up=False, sz=9))
    o.append(_f17_brace(xs + 21 * cw + 2, xs + 23 * cw - 2, yc + 31, "温度", GLD, up=False, sz=9))
    o.append(T(xs + 23.5 * cw, yc + 39, "電池", "middle", 9, GLD))
    yn = yc + 80
    o.append(T(xs, yn, "メーカー固有データ: 会社 ID FF FF → 0xFFFF（試験用の値）、温度 29 09 → 0x0929 = 2345 → 23.45 °C、電池 57 → 87 %", "start", 10, INK))
    o.append(T(xs, yn + 18, "2 バイトの値はどれもリトルエンディアン（03 章 6 節）。温度は ×100 の固定小数点。", "start", 10, MUT))
    return SVG(700, yn + 30, o, "上: 03 章 7 節の TLV と AD 構造の並び方の違い。AD 構造は長さが先頭にあり、長さは AD タイプとデータの合計である。下: 3 節のコードで組み立てた AdvData の 24 バイト。5 つの AD 構造が並び、各 AD 構造の先頭の 2 バイトが長さと AD タイプ（型）。")
F["e17_ad"] = _f17_ad()

def _f17_split():
    o = []
    u, x0 = 15, 92
    def bar(y, segs):
        s, x = [], x0
        for name, n, c in segs:
            s.append(RECT(x, y, n * u, 26, 3, soft(c), c, 1.2))
            s.append(T(x + n * u / 2, y + 17.5, name, "middle", 9.5, c, True))
            x += n * u
        return "".join(s), x
    y1 = 40
    o.append(T(x0, y1 - 10, "名前を Thermo-Hygrometer-01 にして全部を AdvData に入れると 39 バイト", "start", 10.5, INK, True))
    s, xe = bar(y1, [("フラグ", 3, SIG), ("名前（完全）Thermo-Hygrometer-01", 22, PUR), ("UUID", 4, GRN), ("送信電力", 3, TEA), ("メーカー固有", 7, GLD)])
    o.append(s)
    xl = x0 + 31 * u
    o.append(RECT(xl, y1 - 3, xe - xl, 32, 3, ASOFT, ALI, 1.4, dash="4 3", op=0.5))
    o.append(W(xl, y1 - 8, xl, y1 - 1, c=ALI, lw=2))
    o.append(W(xl, y1 + 27, xl, y1 + 34, c=ALI, lw=2))
    o.append(T(xl - 4, y1 + 48, "31 バイトの上限", "end", 10, ALI, True))
    o.append(T((xl + xe) / 2, y1 + 48, "入りきらない 8 バイト", "middle", 10, ALI, True))
    y2 = 128
    o.append(T(x0, y2 - 10, "振り分けた例（AdvData はすべてのスキャナに、スキャン応答はアクティブスキャンのスキャナだけに届く）", "start", 10, GRN, True))
    s, xe2 = bar(y2, [("フラグ", 3, SIG), ("短縮名 Thermo-Hygro", 14, PUR), ("UUID", 4, GRN), ("送信電力", 3, TEA), ("メーカー固有", 7, GLD)])
    o.append(s)
    o.append(T(x0 - 8, y2 + 17, "AdvData", "end", 10, INK, True))
    o.append(T(xe2 + 8, y2 + 17, "31 バイト", "start", 10, INK))
    y3 = y2 + 40
    s, xe3 = bar(y3, [("名前（完全）Thermo-Hygrometer-01", 22, PUR)])
    o.append(s)
    o.append(T(x0 - 8, y3 + 17, "スキャン応答", "end", 10, INK, True))
    o.append(T(xe3 + 8, y3 + 17, "22 バイト", "start", 10, INK))
    o.append(T(16, y3 + 50, "1 マス = 1 バイト。名前の AD 構造は 1 + 1 + 20 文字 = 22 バイト。短縮名（0x08）は先頭の 12 文字で 14 バイト。", "start", 9.5, MUT))
    return SVG(700, y3 + 62, o, "31 バイトに収める。名前が長いと AdvData に入りきらない（上）。完全な名前の先頭の 12 文字を短縮した名前として AdvData の残りに入れ、完全な名前をスキャン応答に置けば、AdvData はちょうど 31 バイト、スキャン応答は 22 バイトになる（下）。")
F["e17_split"] = _f17_split()

# ---- 4 節: スキャン ----
def _f17_scan():
    o = []
    x0, x1, t1 = 82, 682, 700.0
    X = lambda t: x0 + t / t1 * (x1 - x0)
    ys = [52, 82, 112]
    Ts, Wd = 100, 30
    for c, y in enumerate(ys):
        o.append(T(x0 - 10, y + 4, "ch " + _F17_CH[c], "end", 10.5, MUT, True))
        o.append(W(x0, y, x1, y, c=GRD, lw=1))
    for j in range(7):
        c = j % 3
        o.append(RECT(X(j * Ts), ys[c] - 11, X(j * Ts + Wd) - X(j * Ts), 22, 3, PSOFT, PUR, 1.1))
    evs = [40, 172, 303, 431, 560, 690]
    for t in evs:
        for c in range(3):
            o.append(RECT(X(t + c * 1.0) - 1.6, ys[c] - 7, 3.2, 14, 1, SIG, SIG, 0.6))
    o.append(CIRC(X(303) + 1, ys[0], 10, c=GRN, lw=2))
    o.append(T(X(303) + 14, ys[0] - 14, "受け取る", "start", 10, GRN, True))
    o.append(T(X(40) + 6, ys[2] + 26, "ウィンドウの外", "middle", 9.5, MUT))
    o.append(T(X(431) + 5, ys[2] + 26, "わずかに外れる", "middle", 9.5, MUT))
    o.append(DIM(X(0), 26, X(Wd), 26, None, c=PUR))
    o.append(T(X(Wd) + 6, 30, "スキャンウィンドウ W = 30 ms", "start", 10, PUR))
    o.append(DIM(X(Ts), ys[2] + 40, X(2 * Ts), ys[2] + 40, None, c=PUR))
    o.append(T(X(1.5 * Ts), ys[2] + 56, "スキャン間隔 T_s = 100 ms", "middle", 10, PUR))
    o.append(DIM(X(431), ys[2] + 40, X(560), ys[2] + 40, None, c=SIG))
    o.append(T(X(495), ys[2] + 56, "イベントの間隔（約 130 ms）", "middle", 10, SIG))
    ya = ys[2] + 70
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for t in range(0, 701, 100):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9, MUT))
    o.append(T(x1, ya + 30, "時間 [ms]", "end", 9.5, MUT))
    o.append(LEGEND(x0, ya + 30, [(PUR, "スキャナが聞いている（ウィンドウ）"), (SIG, "アドバタイザのパケット（3 本に続けて送る）")]))
    return SVG(700, ya + 42, o, "スキャン間隔 100 ms・スキャンウィンドウ 30 ms のスキャナと、約 130 ms ごとのイベント。スキャナはウィンドウごとに聞くチャネルを 37・38・39 と替える。イベントの 3 つのパケットのうち、そのとき聞いているチャネルのものがウィンドウに入ったとき（300 ms 付近の ch 37）だけ受け取れる。")
F["e17_scan"] = _f17_scan()

def _f17_active():
    o = []
    o.append(T(175, 18, "Wi-Fi のアクティブスキャン（09 章）", "middle", 11, INK, True))
    o.append(T(525, 18, "BLE のアクティブスキャン", "middle", 11, INK, True))
    s1, h1 = seq([("機器", SIG), ("AP（ch 6）", GLD)],
                 [("note", 0, "ch 1 でプローブ要求\n答えが無い → 次のチャネル", {"c": SIG}),
                  (0, 1, "プローブ要求（ch 6）", {"c": SIG}),
                  (1, 0, "プローブ応答", {"c": GLD}),
                  ("note", 0, "全部のチャネルを回る", {"c": SIG})], x=10, y=28, w=330)
    s2, h2 = seq([("アドバタイザ", SIG), ("スキャナ", PUR)],
                 [("note", 0, "3 本に自分から送る", {"c": SIG}),
                  (0, 1, "ADV_IND（ch 37）", {"c": SIG}),
                  (1, 0, "SCAN_REQ（150 µs 後）", {"c": PUR}),
                  (0, 1, "SCAN_RSP（150 µs 後）", {"c": SIG})], x=360, y=28, w=330)
    o += [s1, s2]
    yt = 28 + max(h1, h2) + 14
    rows = [("", "Wi-Fi", "BLE"),
            ("先に送るのは", "探す側（プローブ要求）", "見つけてもらう側（アドバタイズ）"),
            ("探す側が送る相手", "まだ見えていない AP", "受け取ったアドバタイズの送り手だけ"),
            ("アクティブにすると", "ビーコンを待たずに見つかる", "見つかる速さは同じ。スキャン応答が増える")]
    cx = [16, 160, 420, 690]
    for i, r in enumerate(rows):
        y = yt + i * 22
        if i == 0:
            o.append(RECT(cx[0], y - 15, cx[3] - cx[0], 21, 3, MSOFT, "none", 0))
        o.append(W(cx[0], y + 6, cx[3], y + 6, c=LIN, lw=1))
        for j in range(3):
            o.append(T(cx[j] + 6, y, r[j], "start", 10, INK if j else MUT, i == 0 or j == 0))
    return SVG(700, yt + 3 * 22 + 14, o, "アクティブスキャンの違い。Wi-Fi の機器は、何も聞こえないうちから各チャネルでプローブ要求を送り、AP に答えさせる。BLE のスキャナは、アドバタイズを受け取った直後に、その送り手にだけ SCAN_REQ を送ってスキャン応答を受け取る。")
F["e17_active"] = _f17_active()

# ---- 5 節: 見つかるまでの時間 ----
_F17_SWEEP = [float(v) for v in (
    "9.8,7.2,6.1,6,5.6,6.2,7.2,9.2,14.2,12.4,8.1,7,6.1,6.7,7.1,7.8,7.1,6.3,6.5,6.8,7,7,8.4,10.5,18.7,40.4,17.5,9.7,"
    "8,7.6,6.7,6.5,6.7,6.8,7.6,8,7.2,6.7,7.1,7,8.4,12.5,14.4,9.8,7.5,6.9,7.3,7.3,7.5,8.3,10.9,8.9,7.3,7.5,7.6,8,8,"
    "7.7,7.2,7,6.8,6.8,6.5,6.7,6.7,6.3,7.2,7.1,7.5,8.3,10.2,11.9,15.5,21.3,38.9,146.6,38.4,21.9,15.1,11.4,9,8.2,7.9,"
    "7,6.8,7,6.7,6.8,7.4,6.8,7.5,7.3,7.2,7.4,7.8,8.5,7.8,7.1,7.8,8.3,10.4,9.4,7.9,7.4,7.1,7.5,8.3,9.8,15.3,13.8,8.5,"
    "7.6,7.5,7.7,7.9,8.3,8.1,7.5,7,7.5,7.3,7,8.3,10.2,17.9,37.6,18.9,10.8,8.6,7.1,7.3,6.8,7.4,7.3,7.7,8.8,8.1,7.5,"
    "7.2,7.8,9,12.7,15.6,10.3,8,7.3,7.2,7.1,7.8,9.1,9.7,9.3,8.2,7.2,8.2,8.1,8.2,7.5,8.2,7.7,7.4,7.2,6.7,7,7.2,6.5,"
    "6.8,7.3,7.9,8.7,9.6,12.1,15.9,22.9,42.4,164.2,41,21.8,15.1,11.6,9.4,8.6,7.8,7.1,7,7,6.8,7,6.9,7.3,7.4,7.4,7.1,"
    "7.7,8.3,8.7,7.8,7.6,7.8,9,10.7,9.3,8.4,7.7,7.2,8.2,8.3,10.8,15.1,14,9.2,7.6,8,7.7,8.1,8.4,8.6,7.1,7,7.7,7.8,"
    "7.7,8.7,11.1,17.9,33.2,17.3,11.1,8.6,7.9,7.2,7.3,7.3,7.6,7.9,7.9,8.2,7.6,7.3,8,8.8,14.3,15.6,10.9,7.9,7.3,7.7,"
    "7.6,7.7,9.1,11.2,9.1,7.8,7.9,8.1,8.6,8.3,7.7,7.4,7.8,7.7,6.8,7,6.9,6.9,6.8,7,7,7.4,8.6,9.5,11.8,14.4,20.8,39.1,"
    "174.6,41,21.9,14.1,11.9,9.7,8.7,8.1,7.2,7,6.7,6.6,6.7,7.1,6.8,7.5,7.5,7.8,7.6,8.4,8.3,8.4,8.1,8.5,9.1,10.7,9.3,"
    "8.3,7.7,7.5,7.7,8.6,9.9,16.8,13.9,10.2,7.7,7.8,7.9,8,8.6,7.8,7.9,7.7,7.7,7.6,8.1,8.9,11,17.4,38.2,17.9,11.7,"
    "8.7,8.1,6.9,7,7.5,7.9,8.2,9,8.2,7.8,7.7,8.2,9.7,13.8,14.8,10.2,8.4,7.9,7.2,7.7,8,9.5,11.3,9.6,8.4,7.6,8.1,8.8,"
    "8.4,7.8,7.4,7.9,6.9,7.2,7.2,7.2,6.7,7.2,7,7.3,8.1,8.6,9.7,11.6,15,22,41.4,153.1,40.2,21.9,15.5,12,9.7"
).split(",")]   # advInterval = 20, 21, …, 400 ms（スキャン間隔 100 ms・ウィンドウ 10 ms、各 600 回。$SP/c17/sweep.py）

def _f17_sweep():
    o = []
    p = Plot(78, 22, 600, 236, (20, 400), (2, 300), ylog=True)
    o.append(p.axes(xl="advInterval [ms]（スキャン間隔 100 ms・スキャンウィンドウ 10 ms）", yl="要ったイベントの数の平均",
                    xt=[20, 50, 95, 145, 195, 245, 295, 345, 400], yt=[2, 5, 10, 20, 50, 100, 200],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    pts = [(20 + i, v) for i, v in enumerate(_F17_SWEEP)]
    o.append(p.line([(20, 10.4), (400, 10.4)], c=ALI, lw=1.4, dash="6 4"))
    o.append(p.line(pts, c=SIG, lw=1.6))
    o.append(T(p.X(400) - 4, p.Y(10.4) - 7, "近似 1/p = 10.4 回", "end", 10, ALI, True, halo=True))   # 線の後に描き、縁取りで線を隠す
    for a, lab, dy in ((95, "95 ms（r = 0）", -8), (195, "195 ms（r = 0）", -8), (145, "145 ms（r = 50 ms）", -8)):
        v = _F17_SWEEP[a - 20]
        o.append(D(p.X(a), p.Y(v), ALI if "r = 0" in lab else GLD, 3.6))
        o.append(T(p.X(a) + 6, p.Y(v) + dy + 4, lab, "start", 9.5, ALI if "r = 0" in lab else GLD, True, halo=True))
    v100 = _F17_SWEEP[80]
    o.append(D(p.X(100), p.Y(v100), GRN, 3.6))
    o.append(W(p.X(100), p.Y(v100) + 4, p.X(108), p.Y(3.3) - 10, c=GRN, lw=1))
    o.append(T(p.X(108) + 2, p.Y(3.3) - 2, "100 ms（r = 5 ms）: 9.0 回", "start", 9.5, GRN, True, halo=True))
    return SVG(700, 300, o, "advInterval を 1 ms ずつ変えて、受け取られるまでに要ったイベントの数の平均をシミュレーションで求めたもの（スキャン間隔 100 ms、ウィンドウ 10 ms、AdvData 31 バイト、それぞれ 600 回。縦軸は対数目盛）。多くの値では近似の 10.4 回以下に収まるが、advInterval + 5 ms がスキャン間隔の整数倍になる 95・195・295・395 ms では 150〜175 回、整数倍 + 半分になる 45・145・245・345 ms では 33〜40 回に増える。")
F["e17_sweep"] = _f17_sweep()

def _f17_phase():
    o = []
    Ts, Wd = 100.0, 9.6
    for pnl, (title, r, ph0, seed, c) in enumerate((("advInterval = 100 ms（r = 5 ms）", 5.0, 32.0, 11, GRN),
                                                    ("advInterval = 95 ms（r = 0）", 0.0, 55.0, 5, ALI))):
        px = 64 + pnl * 330
        p = Plot(px, 34, 280, 190, (0, 40), (0, 100))
        o.append(T(px + 140, 20, title, "middle", 11, c, True))
        o.append(RECT(p.x, p.Y(Wd), p.w, p.Y(0) - p.Y(Wd), 0, GSOFT, "none", 0))
        o.append(p.axes(xl="イベントの番号 k", yl="位相 [ms]" if pnl == 0 else None, xt=[0, 10, 20, 30, 40], yt=[0, 25, 50, 75, 100],
                        xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
        rnd = _f17_random.Random(seed)
        ph, hit = ph0, None
        for k in range(41):
            inside = ph < Wd
            o.append(D(p.X(k), p.Y(ph), GRN if inside else c, 3.4 if inside else 2.6))
            if inside:
                hit = k
                break
            nxt = (ph + r + rnd.uniform(-5, 5)) % Ts
            if abs(nxt - ph) < 50:
                o.append(W(p.X(k), p.Y(ph), p.X(k + 1), p.Y(nxt), c=c, lw=0.9))
            ph = nxt
        if hit is not None:
            o.append(T(p.X(hit) + 6, p.Y(ph) - 8, "%d 回目で受け取る" % (hit + 1), "start", 10, GRN, True))
        else:
            o.append(T(p.X(20), p.Y(92), "40 回たってもウィンドウに入らない", "middle", 10, ALI, True))
        o.append(T(p.x + 6, p.Y(Wd) - 4, "ウィンドウ", "start", 9, GRN))
    return SVG(700, 270, o, "イベントの位相（始まりの時刻をスキャン間隔 100 ms で割った余り）の動きの例。緑の帯がウィンドウで、位相がここに入ったイベントを受け取る（チャネルごとの数 ms のずれは省いた）。左: 位相はほぼ r = 5 ms ずつ進んで間隔の中を一巡するので、やがて帯に入る。右: r = 0 では ±5 ms の乱数で行きつ戻りつするだけで、帯から遠い所で始まると長く入らない。")
F["e17_phase"] = _f17_phase()

# ---- 6 節: 拡張アドバタイズとビーコン ----
def _f17_ext():
    o = []
    rows = [("ch 37", 50), ("ch 38", 74), ("ch 39", 98), ("ch 12", 146), ("ch 25", 178)]
    for name, y in rows:
        o.append(T(96, y + 4, name, "end", 10.5, MUT, True))
        o.append(W(104, y, 690, y, c=GRD, lw=1))
    o.append(T(16, 74 + 4, "主", "start", 10.5, SIG, True))
    o.append(T(16, 162 + 4, "補助", "start", 10.5, GLD, True))
    o.append(W(40, 38, 40, 110, c=SIG, lw=1.4))
    o.append(W(40, 134, 40, 190, c=GLD, lw=1.4))
    pxs = [118, 168, 218]
    ax = 330
    for i, x in enumerate(pxs):
        y = rows[i][1]
        o.append(RECT(x, y - 8, 30, 16, 2, SSOFT, SIG, 1.2))
        xe = ax + (2 - i) * 12
        o.append(W(x + 30, y, xe - 30, y, c=SIG, lw=1.1, dash="3 2"))
        o.append(ARR(xe - 30, y, xe, 134, c=SIG, lw=1.1, head=6))
    o.append(T(168, 32, "ADV_EXT_IND（データ無し）", "middle", 10, SIG, True))
    o.append(T(ax + 40, 62, "AuxPtr で続きの場所と時刻を指す", "start", 9.5, SIG, halo=True))
    o.append(RECT(ax - 10, 136, 190, 20, 3, GOSOFT, GLD, 1.3))
    o.append(T(ax + 85, 150, "AUX_ADV_IND", "middle", 10, GLD, True, True))
    o.append(RECT(540, 168, 140, 20, 3, GOSOFT, GLD, 1.3))
    o.append(T(610, 182, "AUX_CHAIN_IND", "middle", 10, GLD, True, True))
    o.append(W(ax + 180, 146, 520, 146, c=GLD, lw=1.1, dash="3 2"))
    o.append(ARR(520, 146, 540, 170, c=GLD, lw=1.2, head=6))
    o.append(T(530, 140, "AuxPtr", "middle", 9.5, GLD))
    notes = [(SIG, "ADV_EXT_IND: AdvData を持たず、続きのチャネル・送り始めまでの時間・PHY（AuxPtr）を知らせる"),
             (GLD, "AUX_ADV_IND: データの本体（1 つで最大 254 バイト）。LE 2M や LE Coded でも送れる"),
             (GLD, "AUX_CHAIN_IND: 続き。つなげて全体で最大 1650 バイト")]
    for i, (c, t_) in enumerate(notes):
        o.append(T(16, 216 + i * 17, t_, "start", 10, c))
    return SVG(700, 216 + 2 * 17 + 14, o, "拡張アドバタイズ。主チャネル（アドバタイズチャネル 37・38・39）には短い ADV_EXT_IND だけを送り、そこに書いた AuxPtr で、データの本体 AUX_ADV_IND を送る補助のチャネル（データチャネルの 1 本）と時刻を知らせる。チャネルの番号 12・25 は例。4.x の版のスキャナは ADV_EXT_IND を理解できない。")
F["e17_ext"] = _f17_ext()

def _f17_ibeacon():
    o = []
    hx = ("02 01 06 1A FF 4C 00 02 15 0F 1E 2D 3C 4B 5A 49 78 86 95 A4 B3 C2 D1 E0 F0 00 01 00 02 C5").split()
    cols = [SIG] * 3 + [GLD] * 6 + [PUR] * 16 + [GRN] * 4 + [TEA]
    cw, x0, yc = 21, 35, 56
    o.append(_f17_cells(x0, yc, hx, cw, 24, cols, 9.5))
    o.append(_f17_brace(x0 + 1, x0 + 9 * cw - 1, 22, "先頭の 9 バイトは決まった値", INK, up=True, sz=10, b=True))
    up = [(0, 3, "フラグ", SIG), (5, 2, "会社 ID 0x004C", GLD), (9, 16, "UUID（16 バイト。使う人が決める）", PUR), (27, 2, "Minor", GRN)]
    dn = [(3, 2, "長さ 26・メーカー固有", GLD), (7, 2, "形の印", GLD), (25, 2, "Major", GRN), (29, 1, "1 m の RSSI", TEA)]
    for b0, n, t_, c in up:
        o.append(_f17_brace(x0 + b0 * cw + 1, x0 + (b0 + n) * cw - 1, yc - 5, t_, c, up=True, sz=9.5))
    for b0, n, t_, c in dn:
        o.append(_f17_brace(x0 + b0 * cw + 1, x0 + (b0 + n) * cw - 1, yc + 29, t_, c, up=False, sz=9.5))
    o.append(T(x0, yc + 66, "Major = 0x0001・Minor = 0x0002（ビッグエンディアン）。C5 は符号付きで −59 dBm。合計 30 バイト。", "start", 10, INK))
    return SVG(700, yc + 78, o, "iBeacon と呼ばれる形の AdvData の例（UUID は例として作った値）。フラグの AD 構造の後に、長さ 0x1A = 26 のメーカー固有データが続く。会社 ID 0x004C の後の 02 15 はこの形であることを示し、0x15 = 21 は後に続く UUID・Major・Minor・1 m での受信電力のバイト数の合計に等しい。")
F["e17_ibeacon"] = _f17_ibeacon()

# ---- 7 節: アドレスの種類 ----
def _f17_addr():
    o = []
    bx, bw = 64, 9.0
    rows = [("公開アドレス（TxAdd = 0）", [("IEEE が会社に割り当てた番号 24", 24, MUT), ("会社が決める番号 24", 24, MUT)], "00:00:5E:00:53:01"),
            ("静的アドレス（TxAdd = 1）", [("11", 2, GLD), ("乱数 46", 46, SIG)], "C5:31:7A:20:9B:44"),
            ("解決可能なプライベートアドレス（RPA。TxAdd = 1）", [("01", 2, GLD), ("乱数 22", 22, SIG), ("乱数と鍵から計算 24（20 章）", 24, PUR)], "70:81:94:0D:FB:AA"),
            ("解決不能なプライベートアドレス（TxAdd = 1）", [("00", 2, GLD), ("乱数 46", 46, SIG)], "3A:07:6B:91:2E:5C")]
    o.append(T(bx, 18, "最上位（ビット 47）", "start", 9.5, MUT))
    o.append(T(bx + 48 * bw, 18, "最下位（ビット 0）", "end", 9.5, MUT))
    for i, (title, segs, ex) in enumerate(rows):
        y = 40 + i * 50
        o.append(T(bx, y, title, "start", 10.5, INK, True))
        x = bx
        for name, n, c in segs:
            o.append(RECT(x, y + 6, n * bw, 22, 2, soft(c), c, 1.2))
            o.append(T(x + n * bw / 2, y + 21, name, "middle", 9.5 if n > 2 else 10, c, True, n == 2))
            x += n * bw
        o.append(T(bx + 48 * bw + 12, y + 21, ex, "start", 10, INK, False, True))
    o.append(T(bx + 48 * bw + 12, 18, "例（人が読む順）", "start", 9.5, MUT))
    # 並び
    yb = 40 + 4 * 50 + 10
    o.append(T(bx, yb, "書く順と、電波で送る順（AdvA）", "start", 10.5, INK, True))
    wr = "C5 31 7A 20 9B 44".split()
    cw, xa = 44, 230
    for i, h in enumerate(wr):
        o.append(RECT(xa + i * cw, yb + 12, cw - 6, 22, 3, GOSOFT if i == 0 else SSOFT, GLD if i == 0 else SIG, 1.2))
        o.append(T(xa + i * cw + (cw - 6) / 2, yb + 27, h, "middle", 10.5, INK, True, True))
        j = 5 - i
        o.append(RECT(xa + j * cw, yb + 62, cw - 6, 22, 3, GOSOFT if i == 0 else SSOFT, GLD if i == 0 else SIG, 1.2))
        o.append(T(xa + j * cw + (cw - 6) / 2, yb + 77, h, "middle", 10.5, INK, True, True))
        o.append(W(xa + i * cw + (cw - 6) / 2, yb + 35, xa + j * cw + (cw - 6) / 2, yb + 61, c=FNT, lw=1))
    o.append(T(xa - 10, yb + 27, "書く順（最上位から）", "end", 10, MUT))
    o.append(T(xa - 10, yb + 77, "送る順（最下位から）", "end", 10, MUT))
    o.append(T(xa + 6 * cw + 4, yb + 77, "← 種類の 2 ビットは", "start", 10, GLD))
    o.append(T(xa + 6 * cw + 20, yb + 92, "最後のバイトの上位", "start", 10, GLD))
    return SVG(700, yb + 104, o, "48 ビットのアドレスの種類。公開かランダムかはヘッダの TxAdd（宛先は RxAdd）が表し、ランダムアドレスの種類は最上位の 2 ビット（11・01・00。10 は予約）が表す。電波では最下位のバイトから送るので、種類を表す 2 ビットは AdvA の最後のバイトにある。")
F["e17_addr"] = _f17_addr()

def _f17_rpa():
    o = []
    x0, x1 = 196, 684
    X = lambda m: x0 + m / 45.0 * (x1 - x0)
    addrs = [("70:81:94:0D:FB:AA", SIG), ("4C:2A:13:9E:07:D2", PUR), ("63:F0:58:B1:4A:9C", TEA)]
    rows = [("機器が出すアドレス", 34), ("鍵を持たない観測者", 76), ("鍵を受け取った相手（20 章）", 118), ("AdvData に通し番号を載せると", 160)]
    for name, y in rows:
        o.append(T(x0 - 10, y + 15, name, "end", 10.5, INK, True))
    for k, (a, c) in enumerate(addrs):
        xa, xb = X(15 * k) + 2, X(15 * (k + 1)) - 2
        o.append(RECT(xa, 34, xb - xa, 22, 3, soft(c), c, 1.2))
        o.append(T((xa + xb) / 2, 49, a, "middle", 9.5, INK, False, True))
        o.append(RECT(xa, 76, xb - xa, 22, 3, soft(c), c, 1.2))
        o.append(T((xa + xb) / 2, 91, "別の機器 %s？" % "ABC"[k], "middle", 10, c, True))
        o.append(RECT(xa, 160, xb - xa, 22, 3, ASOFT, ALI, 1.2))
        o.append(T((xa + xb) / 2, 175, "通し番号 1234", "middle", 10, ALI, True))
    o.append(RECT(X(0) + 2, 118, X(45) - X(0) - 4, 22, 3, GSOFT, GRN, 1.2))
    o.append(T((X(0) + X(45)) / 2, 133, "同じ機器（TH-01）と分かる", "middle", 10, GRN, True))
    for m in (0, 15, 30, 45):
        o.append(W(X(m), 192, X(m), 196, c=MUT, lw=1))
        o.append(T(X(m), 208, "%d 分" % m, "middle", 9, MUT))
    o.append(T(16, 226, "アドレスは 15 分ごとに作り直すとした。最下段: 変わらない番号があると、3 つのアドレスが結び付く。", "start", 9.5, MUT))
    return SVG(700, 236, o, "解決可能なプライベートアドレスを作り直す機器と、それを聞く相手。鍵を持たない観測者には、アドレスごとに別の機器に見える。鍵を受け取った相手は、どのアドレスも同じ機器のものと分かる（20 章 6 節）。AdvData に変わらない番号を載せると、観測者はその番号でアドレスの異なるパケットを結び付けられる。")
F["e17_rpa"] = _f17_rpa()
