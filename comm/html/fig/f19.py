# -*- coding: utf-8 -*-
# 19 章 BLE のスループットと消費電力 の図

# ---- 共通: 空中時間と、例として使う電流・時間（代表値） ----
_F19_IFS = 150.0                                   # µs

def _f19_air(P, phy="1M", mic=False):
    """リンク層のパケットの空中時間 [µs]。P はペイロードのバイト数（MIC を除く）。"""
    m = 4 if (mic and P > 0) else 0
    if phy == "1M":
        return (1 + 4 + 2 + P + m + 3) * 8.0
    if phy == "2M":
        return (2 + 4 + 2 + P + m + 3) * 4.0
    S = 8 if phy == "S8" else 2
    return 80 + 296 + S * (8 * (2 + P + m) + 27)

# 例の値（mA・ms）。本文 4 節の表と同じ
_F19_IS = 0.002
_F19_WAKE, _F19_RAMP, _F19_PROC = (0.4, 1.5), (0.1, 4.0), (0.3, 3.0)
_F19_ITX, _F19_IRX, _F19_ISW = 7.0, 6.0, 5.0
_F19_EPS = 100e-6                                  # 両者の時計の誤差の合計（50 + 50 ppm）

def _f19_adv_segs(adv_len=31, conn=True):
    s = [("起床", _F19_WAKE[0], _F19_WAKE[1], "w")]
    for ch in (37, 38, 39):
        s.append(("立ち上げ", _F19_RAMP[0], _F19_RAMP[1], "r"))
        s.append(("送信 %d" % ch, _f19_air(6 + adv_len) / 1000.0, _F19_ITX, "t"))
        if conn:
            s.append(("受信", 0.2, _F19_IRX, "x"))
    s.append(("処理", _F19_PROC[0], _F19_PROC[1], "p"))
    return s

def _f19_conn_segs(Te, P=0):
    w = _F19_EPS * Te * 1000.0                     # ms
    return [("起床", _F19_WAKE[0], _F19_WAKE[1], "w"), ("立ち上げ", _F19_RAMP[0], _F19_RAMP[1], "r"),
            ("受信", w + _f19_air(0) / 1000.0, _F19_IRX, "x"), ("切り替え", 0.15, _F19_ISW, "r"),
            ("送信", _f19_air(P) / 1000.0, _F19_ITX, "t"), ("処理", _F19_PROC[0], _F19_PROC[1], "p")]

def _f19_q(segs):
    return sum(t * i for _, t, i, _ in segs)       # ms × mA = µC

_F19_KC = {"w": GLD, "r": MUT, "t": SIG, "x": TEA, "p": PUR}

# ---- 1 節: パケットの形 ----
def _f19_packet():
    o = []
    cols = [("プリアンブル", 66, MUT), ("アクセスアドレス", 92, SIG), ("ヘッダ", 56, SIG),
            ("ペイロード", 120, INK), ("MIC", 60, TEA), ("CRC", 54, SIG)]
    subs = {"1M": [("1 バイト", "8 µs"), ("4 バイト", "32 µs"), ("2 バイト", "16 µs"), ("P バイト", "8P µs"), ("4 バイト", "32 µs"), ("3 バイト", "24 µs")],
            "2M": [("2 バイト", "8 µs"), ("4 バイト", "16 µs"), ("2 バイト", "8 µs"), ("P バイト", "4P µs"), ("4 バイト", "16 µs"), ("3 バイト", "12 µs")]}
    x0 = 110
    rows = (("LE 1M", "1 ビット 1 µs", "1M", 52, "合計 8(P + 10) µs"), ("LE 2M", "1 ビット 0.5 µs", "2M", 150, "合計 4(P + 11) µs"))
    for name, sub, key, y, tot in rows:
        o.append(T(14, y + 15, name, "start", 12, INK, True))
        o.append(T(14, y + 31, sub, "start", 9.5, MUT))
        xx = x0
        for (nm, w, c), (s1, s2) in zip(cols, subs[key]):
            fill = PAN if c == INK else soft(c)
            o.append(RECT(xx, y, w, 34, 3, fill, c, 1.3, dash="4 3" if nm == "MIC" else None))
            o.append(T(xx + w / 2, y + 21, nm, "middle", 9.5 if len(nm) > 4 else 10.5, c, True))
            o.append(T(xx + w / 2, y + 49, s1, "middle", 9.5, INK))
            o.append(T(xx + w / 2, y + 63, s2, "middle", 9.5, SIG if key == "1M" else PUR, True))
            xx += w
        o.append(T(xx + 10, y + 21, tot, "start", 10, INK, True))
    # PDU の括弧（ヘッダからMIC まで）
    xa = x0 + 66 + 92
    xb = xa + 56 + 120 + 60
    o.append(W(xa, 44, xa, 38, xb, 38, xb, 44, c=SIG, lw=1.2))
    o.append(T((xa + xb) / 2, 32, "PDU（17 章 2 節）", "middle", 9.5, SIG, True))
    o.append(T(14, 244, "P: ペイロードのバイト数（DLE なしは 0〜27、DLE ありは 0〜251。暗号化しているときは MIC の 4 を足す）。", "start", 9.5, MUT))
    o.append(T(14, 260, "MIC は、接続を暗号化しているときに、ペイロードのあるパケットにだけ付く（ペイロードの無いパケットには付かない）。", "start", 9.5, MUT))
    return SVG(700, 270, o, "リンク層のパケットの形と、各部分の時間。LE 1M は 1 バイトを 8 µs、LE 2M は 4 µs で送る。LE 2M のプリアンブルは 2 バイトなので、どちらもプリアンブルは 8 µs になる。接続中のパケットも、17 章のアドバタイズのパケットも、この形をしている。")
F["e19_packet"] = _f19_packet()

def _f19_airtime():
    o = []
    rows = [("ペイロード 0 バイト", "LE 1M", 0, "1M"), ("", "LE 2M", 0, "2M"),
            ("ペイロード 27 バイト", "LE 1M", 27, "1M"), ("", "LE 2M", 27, "2M"),
            ("ペイロード 251 バイト", "LE 1M", 251, "1M"), ("", "LE 2M", 251, "2M"),
            ("ADV_IND（AdvData 31 バイト）", "LE 1M", 37, "1M"),
            ("ペイロード 0 バイト", "LE Coded（S = 2）", 0, "S2"), ("", "LE Coded（S = 8）", 0, "S8")]
    x0, sc, y0, rh = 250, 0.19, 16, 24
    X = lambda t: x0 + t * sc
    for t in (0, 500, 1000, 1500, 2000):
        o.append(W(X(t), y0 - 6, X(t), y0 + len(rows) * rh, c=GRD, lw=1))
        o.append(T(X(t), y0 + len(rows) * rh + 15, "%d" % t, "middle", 9.5, MUT))
    o.append(T(X(1000), y0 + len(rows) * rh + 31, "空中時間 [µs]", "middle", 10, MUT))
    for i, (g, phy, P, key) in enumerate(rows):
        y = y0 + i * rh
        if g:
            o.append(T(14, y + 15, g, "start", 10, INK, True))
        o.append(T(x0 - 8, y + 15, phy, "end", 9.5, MUT))
        tt = _f19_air(P, key)
        if key in ("1M", "2M"):
            fixed = 80.0 if key == "1M" else 44.0
            o.append(RECT(X(0), y + 4, fixed * sc, rh - 8, 2, MSOFT, MUT, 1.0))
            if tt > fixed:
                o.append(RECT(X(fixed), y + 4, (tt - fixed) * sc, rh - 8, 2, SSOFT, SIG, 1.0))
        else:
            o.append(RECT(X(0), y + 4, tt * sc, rh - 8, 2, GOSOFT, GLD, 1.0))
        o.append(T(X(tt) + 6, y + 15, "%g µs" % tt, "start", 9.5, INK, True))
    yl = y0 + len(rows) * rh + 50
    o.append(LEGEND(14, yl, [(MUT, "プリアンブル・アクセスアドレス・ヘッダ・CRC（P によらない）"), (SIG, "ペイロード")]))
    o.append(LEGEND(14, yl + 18, [(GLD, "LE Coded（パケットの形が違う。符号化しない前半と、S 倍の時間で送る後半）")]))
    return SVG(700, yl + 28, o, "パケットの空中時間（暗号化なし）。LE 1M では 10 バイト分（80 µs）、LE 2M では 11 バイト分（44 µs）が、ペイロードの長さによらずにかかる。LE Coded は、ペイロードが 0 バイトでも LE 1M の 5.8〜9 倍の時間がかかる。")
F["e19_airtime"] = _f19_airtime()

# ---- 2 節: ヘッダのビット ----
def _f19_header():
    o = []
    x0, bw = 60, 38
    s, h = BITS(x0, 10, [("LLID", 2, SIG), ("NESN", 1, GRN), ("SN", 1, GRN), ("MD", 1, GLD), ("ほか", 3, MUT), ("長さ", 8, SIG)], bit_w=bw, h=30, row_bits=16, sz=9.5)
    o.append(s)
    yb = 10 + h
    items = [(x0 + 8 * bw + 6, "長さ: ペイロード（と MIC）のバイト数", SIG, None),
             (x0 + 5.5 * bw, "ほか: 予約など（この章では使わない）", MUT, x0 + 6.5 * bw),
             (x0 + 4.5 * bw, "MD（More Data）: まだ送るものがある", GLD, None),
             (x0 + 3.5 * bw, "SN（Sequence Number）: このパケットの 1 ビットの番号", GRN, None),
             (x0 + 2.5 * bw, "NESN（Next Expected SN）: 相手から次に受け取りたい番号", GRN, None),
             (x0 + 1.0 * bw, "LLID: 中身の種類（L2CAP のメッセージの始まり・続き、リンク層の制御）", SIG, None)]
    for k, (xl, txt, c, xt) in enumerate(items):
        yy = yb + 22 + k * 17
        if k == 0:
            o.append(W(xl - 6 + 4, yb, xl - 6 + 4, yy - 4, c=c, lw=1))
            o.append(T(xl + 2, yy, txt, "start", 9.5, c, True))
        else:
            o.append(W(xl, yb, xl, yy - 4, c=c, lw=1))
            o.append(T(xl + 6, yy, txt, "start", 9.5, c, True))
    return SVG(700, yb + 22 + 6 * 17, o, "接続中のパケットのヘッダ（2 バイト）。上の数字はビットの番号で、0 から順に送る。SN と NESN の 2 ビットで確認応答をし、MD でイベントを続けるかどうかを知らせる。")
F["e19_header"] = _f19_header()

# ---- 2 節: 接続イベントの中のやり取り ----
def _f19_event():
    o = []
    s = 0.27
    x0 = 82
    X = lambda t: x0 + t * s
    yC, yP, hh = 64, 142, 24
    o.append(T(14, yC + 16, "セントラル", "start", 10.5, PUR, True))
    o.append(T(14, yP + 16, "ペリフェラル", "start", 10.5, SIG, True))
    for y in (yC, yP):
        o.append(W(x0 - 6, y + hh, 690, y + hh, c=FNT, lw=1))
    # アンカーポイント
    o.append(W(X(0), 26, X(0), yP + hh + 6, c=MUT, lw=1, dash="3 3"))
    o.append(T(X(0) - 2, 22, "アンカーポイント", "start", 9.5, MUT))
    C = [(0, "SN 0・NESN 0"), (676, "SN 1・NESN 1"), (1352, "SN 0・NESN 0")]
    P = [(230, "データ 1", "SN 0・NESN 1・MD 1"), (906, "データ 2", "SN 1・NESN 0・MD 1"), (1582, "データ 3", "SN 0・NESN 1・MD 0")]
    for t, lab in C:
        o.append(RECT(X(t), yC, 80 * s, hh, 2, PSOFT, PUR, 1.2))
        o.append(T(X(t + 40), yC + 16, "空", "middle", 10, PUR, True))
        o.append(T(X(t + 40), yC - 6, lab, "middle", 9, PUR))
    for t, nm, lab in P:
        o.append(RECT(X(t), yP, 296 * s, hh, 2, SSOFT, SIG, 1.2))
        o.append(T(X(t + 148), yP + 16, nm, "middle", 10, SIG, True))
        o.append(T(X(t + 148), yP + hh + 14, lab, "middle", 9, SIG))
    # 受け取って 150 µs 後に答える（斜めの矢印）
    for a, b, down in ((80, 230, True), (526, 676, False), (756, 906, True), (1202, 1352, False), (1432, 1582, True)):
        if down:
            o.append(ARR(X(a), yC + hh + 2, X(b), yP - 2, c=FNT, lw=1.1, head=5))
        else:
            o.append(ARR(X(a), yP - 2, X(b), yC + hh + 2, c=FNT, lw=1.1, head=5))
    o.append(T(X(155) + 4, (yC + hh + yP) / 2 + 4, "IFS 150 µs", "start", 9.5, TEA, True, halo=True))
    # 確認応答の印
    o.append(CARR(X(716), yC + hh + 1, X(400), yP - 3, bend=-0.18, c=GRN, lw=1.3, head=6, dash="4 3"))
    o.append(T(X(560), (yC + hh + yP) / 2 + 4, "データ 1 の確認応答", "middle", 9, GRN, True, halo=True))
    # 1 往復
    yd = yP + hh + 30
    o.append(DIM(X(230), yd, X(906), yd, None, c=INK))
    o.append(T(X(568), yd + 14, "1 往復 = 296 + 150 + 80 + 150 = 676 µs", "middle", 9.5, INK, True))
    # 終わり
    o.append(W(X(1878), 40, X(1878), yP + hh + 6, c=ALI, lw=1.2, dash="4 3"))
    o.append(T(X(1878) + 6, 50, "両方の MD が 0", "start", 9.5, ALI, True))
    o.append(T(X(1878) + 6, 64, "→ イベント終わり。", "start", 9.5, ALI))
    o.append(T(X(1878) + 6, 78, "次のアンカーポイント", "start", 9.5, ALI))
    o.append(T(X(1878) + 6, 92, "まで眠る", "start", 9.5, ALI))
    # 時間軸
    ya = yd + 30
    o.append(W(x0, ya, X(1900), ya, c=MUT, lw=1))
    for t in (0, 500, 1000, 1500):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9.5, MUT))
    o.append(T(X(1900), ya + 16, "µs", "start", 9.5, MUT))
    return SVG(700, ya + 26, o, "ペリフェラルが通知を 3 つ送る接続イベント（LE 1M、ペイロード 27 バイト）。セントラルは送るものが無いので空パケットを送り、そのヘッダの NESN で、前に受け取ったデータの確認応答をする。ペリフェラルは MD を 1 にして、まだ送るものがあることを知らせる。")
F["e19_event"] = _f19_event()

# ---- 2 節: ヘッダの入れ子 ----
def _f19_nest():
    o = []
    def pkt(x, y, parts, h=26):
        xx = x
        for nm, w, c in parts:
            fill = PAN if c == INK else soft(c)
            o.append(RECT(xx, y, w, h, 2, fill, c, 1.1))
            if nm:
                o.append(T(xx + w / 2, y + 17, nm, "middle", 9.5, c, True))
            xx += w
        return xx
    def brace(xa, xb, y, txt, c=SIG):
        o.append(W(xa, y, xa, y + 5, xb, y + 5, xb, y, c=c, lw=1))
        o.append(T((xa + xb) / 2, y + 18, txt, "middle", 9, c))
    rows = [("(a) 4.0 からの大きさ", "DLE なし・ATT_MTU 23"),
            ("(b) 2 つをそろえる", "DLE（251）・ATT_MTU 247"),
            ("(c) ATT_MTU だけ大きい", "DLE なし・ATT_MTU 247"),
            ("(d) DLE だけ使う", "DLE（251）・ATT_MTU 23")]
    y0, rh, xs = 30, 70, 186
    for i, (t1, t2) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(14, y + 12, t1, "start", 10.5, INK, True))
        o.append(T(14, y + 28, t2, "start", 9.5, MUT))
    head = [("リンク層 7", 62, SIG), ("L2CAP 4", 56, GRN), ("ATT 3", 44, PUR)]
    # (a)
    y = y0
    pkt(xs, y, head + [("値 20", 70, INK), ("CRC 3", 44, SIG)])
    brace(xs + 62, xs + 62 + 56 + 44 + 70, y + 30, "ペイロード 27 = 4 + 3 + 20")
    # (b)
    y = y0 + rh
    pkt(xs, y, head + [("値 244", 250, INK), ("CRC 3", 44, SIG)])
    brace(xs + 62, xs + 62 + 56 + 44 + 250, y + 30, "ペイロード 251 = 4 + 3 + 244")
    # (c) 10 個に分かれる
    y = y0 + 2 * rh
    xx = xs
    xx = pkt(xx, y, [("", 7, SIG), ("", 9, GRN), ("", 7, PUR), ("", 20, INK), ("", 5, SIG)]) + 4
    for k in range(8):
        xx = pkt(xx, y, [("", 7, SIG), ("", 27, INK), ("", 5, SIG)]) + 4
    xx = pkt(xx, y, [("", 7, SIG), ("", 8, INK), ("", 5, SIG)])
    o.append(T(xs, y + 44, "L2CAP のメッセージ 251 バイトが、ペイロード 27 バイトずつの 10 個のパケットに分かれる（9 × 27 + 8）", "start", 9, MUT))
    # (d)
    y = y0 + 3 * rh
    xe = pkt(xs, y, head + [("値 20", 70, INK), ("CRC 3", 44, SIG)])
    o.append(RECT(xe + 8, y, 200, 26, 2, "none", ALI, 1.0, dash="4 3"))
    o.append(T(xe + 108, y + 17, "送れるのに使わない 224 バイト", "middle", 9.5, ALI, True))
    brace(xs + 62, xs + 62 + 56 + 44 + 70, y + 30, "ペイロード 27")
    yl = y0 + 4 * rh + 2
    o.append(LEGEND(14, yl, [(SIG, "リンク層（リンク層 7 = プリアンブル 1・アクセスアドレス 4・ヘッダ 2）"), (GRN, "L2CAP"), (PUR, "ATT")]))
    o.append(LEGEND(14, yl + 18, [(INK, "値（アプリケーションのデータ）。長さは縮尺どおりではない")]))
    return SVG(700, yl + 28, o, "通知の値がリンク層のパケットに入る形（LE 1M）。L2CAP のヘッダ 4 バイト（長さとチャネル）と ATT のヘッダ 3 バイト（命令の番号とハンドル）が値の前に付く。DLE と ATT_MTU は、L2CAP のメッセージがちょうど 1 つのパケットに入るように、そろえて大きくする。")
F["e19_nest"] = _f19_nest()

# ---- 2 節: 理論値 ----
def _f19_theory():
    o = []
    rows = [("LE 1M・DLE なし", "1M", 27, False), ("LE 1M・DLE なし・暗号化", "1M", 27, True),
            ("LE 1M・DLE", "1M", 251, False), ("LE 2M・DLE", "2M", 251, False), ("LE 2M・DLE・暗号化", "2M", 251, True)]
    x0, sc, y0, rh = 196, 0.17, 34, 40
    X = lambda t: x0 + t * sc
    for t in (0, 500, 1000, 1500, 2000, 2500):
        o.append(W(X(t), y0 - 6, X(t), y0 + len(rows) * rh - 8, c=GRD, lw=1))
        o.append(T(X(t), y0 - 10, "%d µs" % t if t == 0 else "%d" % t, "middle", 9, MUT))
    for i, (nm, phy, LL, enc) in enumerate(rows):
        y = y0 + i * rh
        bpb = 8.0 if phy == "1M" else 4.0
        fixed = 80.0 if phy == "1M" else 44.0
        D = LL - 7
        td, t0 = _f19_air(LL, phy, enc), _f19_air(0, phy)
        Tex = td + t0 + 2 * _F19_IFS
        k = D * 8 / Tex * 1000
        o.append(T(14, y + 12, nm, "start", 10, INK, True))
        o.append(T(14, y + 27, "%.1f kbps" % k, "start", 10, SIG, True))
        segs = [(fixed, MUT), (7 * bpb, GRN), (D * bpb, SIG)]
        if enc:
            segs.append((4 * bpb, TEA))
        xx = 0.0
        for d, c in segs:
            o.append(RECT(X(xx), y + 2, d * sc, 24, 1, soft(c), c, 0.9))
            xx += d
        o.append(RECT(X(xx), y + 2, _F19_IFS * sc, 24, 1, "none", FNT, 0.8, dash="2 2"))
        xx += _F19_IFS
        o.append(RECT(X(xx), y + 2, t0 * sc, 24, 1, PSOFT, PUR, 0.9))
        xx += t0
        o.append(RECT(X(xx), y + 2, _F19_IFS * sc, 24, 1, "none", FNT, 0.8, dash="2 2"))
        xx += _F19_IFS
        o.append(T(X(xx) + 6, y + 18, "%g µs" % Tex, "start", 9.5, INK, True))
    yl = y0 + len(rows) * rh + 6
    o.append(LEGEND(14, yl, [(SIG, "値"), (GRN, "L2CAP・ATT のヘッダ 7"), (MUT, "リンク層の固定の部分"), (TEA, "MIC"), (PUR, "相手の空のパケット")], gap=12))
    o.append(T(14, yl + 18, "破線の枠は IFS（150 µs）。理論値 = 1 往復に運ぶ値のビット数 ÷ 1 往復の時間。", "start", 9.5, MUT))
    return SVG(700, yl + 28, o, "データのパケット 1 つ分の往復と、スループットの理論値（ペリフェラルが通知を送り続け、何も失われず、接続イベントが途切れない場合）。LE 1M・DLE なしでは、1 往復 676 µs のうち値を送っているのは 160 µs だけである。")
F["e19_theory"] = _f19_theory()

# ---- 2 節: 応答を待つ書き込み ----
def _f19_write():
    o = []
    x0, s = 120, 8.0                      # px/ms
    X = lambda t: x0 + t * s
    ev = [0, 15, 30, 45]
    rows = [("(a) 通知", "ペリフェラル → セントラル", 40), ("(b) 応答付きの書き込み", "セントラル → ペリフェラル", 140)]
    for nm, sub, y in rows:
        o.append(T(14, y + 2, nm, "start", 10.5, INK, True))
        o.append(T(14, y + 17, sub, "start", 9, MUT))
        o.append(T(x0 - 6, y + 37, "セントラル", "end", 9, PUR))
        o.append(T(x0 - 6, y + 61, "ペリフェラル", "end", 9, SIG))
        o.append(W(x0, y + 38, X(60), y + 38, c=FNT, lw=1))
        o.append(W(x0, y + 62, X(60), y + 62, c=FNT, lw=1))
        for e in ev:
            o.append(W(X(e), y + 22, X(e), y + 66, c=MUT, lw=1, dash="3 3"))
    # (a) 間隔に入るだけ（10 往復）
    y = 40
    rt = 1.392
    for e in ev:
        for k in range(10):
            t = e + k * rt
            o.append(RECT(X(t), y + 30, 1.6, 8, 0.5, PSOFT, PUR, 0.8))
            o.append(RECT(X(t + 0.194), y + 50, 1.048 * s, 12, 1, SSOFT, SIG, 0.9))
        o.append(T(X(e + 7.0), y + 26, "10 往復", "middle", 9, SIG))
    o.append(T(X(60) + 6, y + 47, "1 回の間隔で", "start", 9, SIG, True))
    o.append(T(X(60) + 6, y + 60, "244 × 10 バイト", "start", 9, SIG, True))
    # (b) 要求と応答が交互
    y = 140
    for i, e in enumerate(ev):
        if i % 2 == 0:
            o.append(RECT(X(e), y + 26, 1.048 * s, 12, 1, PSOFT, PUR, 0.9))
            o.append(RECT(X(e + 1.198), y + 54, 1.6, 8, 0.5, SSOFT, SIG, 0.8))
            o.append(T(X(e) + 14, y + 35, "書き込み要求（値 244）", "start", 9, PUR, True))
        else:
            o.append(RECT(X(e), y + 30, 1.6, 8, 0.5, PSOFT, PUR, 0.8))
            o.append(RECT(X(e + 0.194), y + 50, 2.0, 12, 0.5, SSOFT, SIG, 0.9))
            o.append(T(X(e) + 8, y + 59, "書き込み応答", "start", 9, SIG, True))
    o.append(T(X(60) + 6, y + 47, "2 回の間隔で", "start", 9, PUR, True))
    o.append(T(X(60) + 6, y + 60, "244 バイト", "start", 9, PUR, True))
    # 時間軸
    ya = 228
    o.append(W(x0, ya, X(60), ya, c=MUT, lw=1))
    for t in (0, 15, 30, 45, 60):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d ms" % t, "middle", 9.5, MUT))
    o.append(T(x0, ya + 34, "破線: アンカーポイント（接続間隔 15 ms）。LE 2M・DLE・ATT_MTU 247。小さな箱は空パケットと書き込み応答。", "start", 9.5, MUT))
    return SVG(700, ya + 44, o, "通知（応答を待たない）と応答付きの書き込み（応答を待つ）。(a) は 1 回のイベントに間隔いっぱいの 10 往復を詰められるので 10 × 244 × 8 ÷ 15 ms ≈ 1301 kbps、(b) は応答が次のイベントで返り、次の要求がさらにその次のイベントになると、244 × 8 ÷ 30 ms ≈ 65 kbps にとどまる。")
F["e19_write"] = _f19_write()

# ---- 3 節: 理論値から実効値への落ち方 ----
def _f19_drop():
    o = []
    panels = [("(a) LE 2M・DLE・ATT_MTU 247・暗号化・接続間隔 15 ms", 1500.0,
               [("理論値（暗号化なし）", 1402.3, "2 節"), ("暗号化（MIC 4 バイト）", 1386.4, "1 往復 1408 µs"),
                ("接続間隔の端数", 1301.3, "15 ms に 10 往復"), ("1 イベント 7 往復まで", 910.9, "コントローラの上限（仮定）"),
                ("5 % の往復が失われる", 865.4, "干渉（仮定）")]),
              ("(b) LE 1M・DLE なし・ATT_MTU 23・暗号化・接続間隔 30 ms", 250.0,
               [("理論値（暗号化なし）", 236.7, "2 節"), ("暗号化（MIC 4 バイト）", 226.0, "1 往復 708 µs"),
                ("接続間隔の端数", 224.0, "30 ms に 42 往復"), ("1 イベント 4 往復まで", 21.3, "コントローラの上限（仮定）"),
                ("5 % の往復が失われる", 20.3, "干渉（仮定）")])]
    y = 22
    xb, bwmax = 200, 300
    for title, vmax, items in panels:
        o.append(T(14, y, title, "start", 10.5, INK, True))
        y += 10
        for k, (nm, v, why) in enumerate(items):
            yy = y + k * 24
            o.append(T(xb - 8, yy + 13, nm, "end", 9.5, INK))
            c = SIG if k == 0 else (ALI if k == len(items) - 1 else GLD)
            o.append(RECT(xb, yy + 2, bwmax * v / vmax, 16, 2, soft(c), c, 1.0))
            o.append(T(xb + bwmax * v / vmax + 6, yy + 14, "%.1f kbps" % v, "start", 9.5, c, True))
            o.append(T(xb + bwmax * v / vmax + 72, yy + 14, why, "start", 9, MUT))
        y += len(items) * 24 + 22
    return SVG(700, y - 8, o, "理論値から実効値の目安までの落ち方（仮定を置いた例。(a) と (b) で横軸の縮尺が違う）。1 回の接続イベントに送る往復の数を、コントローラが接続間隔よりずっと短く切り上げると、スループットはその割合で下がる。(b) のように DLE が無く往復が少ないと、理論値の 1/10 を下回る。")
F["e19_drop"] = _f19_drop()

# ---- 4 節: 電流の波形 ----
def _f19_wavepanel(o, x0, y0, segs, s, title, total_label, h=84, imax=8.0):
    """電流の波形を 1 枚描く。返り値は、段ごとの (中心の x, 電流の高さの y, 段)。"""
    Y = lambda i: y0 + h - i / imax * h
    o.append(T(14, y0 - 10, title, "start", 10.5, INK, True))
    o.append(T(690, y0 - 10, total_label, "end", 10, INK, True))
    o.append(W(x0, y0, x0, y0 + h, x0 + 3.0 * s + 10, y0 + h, c=MUT, lw=1.1))
    for mA in (0, 2, 4, 6, 8):
        o.append(W(x0 - 4, Y(mA), x0, Y(mA), c=MUT, lw=1))
        o.append(T(x0 - 7, Y(mA) + 3.5, "%d" % mA, "end", 9, MUT))
    o.append(T(x0 - 30, y0 + h / 2, "mA", "middle", 9.5, MUT, rot=-90))
    t = 0.0
    pts = [(x0, Y(0.002))]
    out = []
    for nm, d, i, kind in segs:
        xa, xb = x0 + t * s, x0 + (t + d) * s
        c = _F19_KC[kind]
        o.append(RECT(xa, Y(i), xb - xa, Y(0) - Y(i), 0, soft(c), "none", 0))
        pts += [(xa, Y(i)), (xb, Y(i))]
        out.append(((xa + xb) / 2, Y(i), (nm, d, i, kind)))
        t += d
    pts.append((x0 + t * s, Y(0.002)))
    pts.append((x0 + 3.0 * s, Y(0.002)))
    o.append(PL(pts, c=SIG, lw=1.6))
    return out

def _f19_qtxt(q):
    return ("%.2f" % q).rstrip("0").rstrip(".")

def _f19_wave():
    o = []
    x0, s, h = 70, 190.0, 84               # px/ms
    adv = _f19_adv_segs()
    con = _f19_conn_segs(1.0)
    # (a) アドバタイズ
    y0 = 40
    segs = _f19_wavepanel(o, x0, y0, adv, s, "(a) アドバタイズイベント（ADV_IND、AdvData 31 バイト）",
                          "合計 %.1f µC（%.3f ms）" % (_f19_q(adv), sum(d for _, d, _, _ in adv)))
    for k, (xc, yt, (nm, d, i, kind)) in enumerate(segs):
        if kind == "t":
            o.append(T(xc, yt - 4, nm, "middle", 9, SIG, True))
        elif kind == "x":
            o.append(T(xc, yt - 4, "受信", "middle", 9, TEA, True))
        elif kind == "w":
            o.append(T(xc, yt - 4, "起床", "middle", 9, GLD, True))
        elif kind == "p":
            o.append(T(xc, yt - 4, "処理", "middle", 9, PUR, True))
        o.append(T(xc, y0 + h + 13 + (10 if kind == "r" else 0), _f19_qtxt(d * i), "middle", 8.5, _F19_KC[kind]))
    # (b) 接続イベント
    y0 = 214
    segs = _f19_wavepanel(o, x0, y0, con, s, "(b) 接続イベント（ペリフェラル。送るデータなし。前回の起床から 1 s）",
                          "合計 %.2f µC（%.2f ms）" % (_f19_q(con), sum(d for _, d, _, _ in con)))
    notes = {"受信": ("①", "受信（窓 0.1 ms + 空パケット 0.08 ms）", TEA), "切り替え": ("②", "送受信の切り替え（IFS 0.15 ms）", MUT),
             "送信": ("③", "送信（空パケット 0.08 ms）", SIG)}
    row = 0
    for k, (xc, yt, (nm, d, i, kind)) in enumerate(segs):
        if nm in notes:
            mk, txt, c = notes[nm]
            o.append(T(xc, yt - 4, mk, "middle", 10, c, True))
            o.append(T(400, y0 + 14 + row * 16, mk + " " + txt, "start", 9.5, c, True))
            row += 1
        elif nm == "起床":
            o.append(T(xc, yt - 4, "起床", "middle", 9, GLD, True))
        elif nm == "処理":
            o.append(T(xc, yt - 4, "処理", "middle", 9, PUR, True))
        o.append(T(xc, y0 + h + 13 + (10 if k % 2 else 0), _f19_qtxt(d * i), "middle", 8.5, _F19_KC[kind]))
    # 時間軸
    ya = y0 + h + 38
    o.append(W(x0, ya, x0 + 3.0 * s, ya, c=MUT, lw=1))
    for tt in (0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0):
        o.append(W(x0 + tt * s, ya, x0 + tt * s, ya + 4, c=MUT, lw=1))
        o.append(T(x0 + tt * s, ya + 16, "%g" % tt, "middle", 9.5, MUT))
    o.append(T(x0 + 3.0 * s + 8, ya + 16, "ms", "start", 9.5, MUT))
    yl = ya + 36
    o.append(LEGEND(14, yl, [(GLD, "起床（発振器の立ち上がり）"), (MUT, "無線の立ち上げ・切り替え"), (SIG, "送信"), (TEA, "受信"), (PUR, "処理")], gap=12))
    o.append(T(14, yl + 18, "波形の下の数字は各段の電荷 [µC]（電流 × 時間）。電流と時間は代表値の例。眠っている間の 2 µA は細すぎて見えない。", "start", 9.5, MUT))
    return SVG(700, yl + 28, o, "1 回のイベントの電流の波形（例の値）。塗った面積が、そのイベントで使う電荷である。アドバタイズでは 3 本のチャネルで送信と受信を繰り返すので、電荷は送るデータの無い接続イベントの 3 倍を超える。")
F["e19_wave"] = _f19_wave()

def _f19_widen():
    o = []
    x0, s = 150, 0.62                      # px/µs、時刻 0 = 予定のアンカーポイント
    X = lambda t: x0 + 450 * s + t * s
    rows = [(0.03, "30 ms"), (1.0, "1 s"), (4.0, "4 s")]
    o.append(W(X(0), 22, X(0), 40 + 3 * 46, c=PUR, lw=1.2, dash="3 3"))
    o.append(T(X(0), 16, "予定のアンカーポイント", "middle", 9.5, PUR, True))
    for k, (Te, lab) in enumerate(rows):
        y = 40 + k * 46
        w = _F19_EPS * Te * 1e6
        o.append(T(14, y + 12, "前回から " + lab, "start", 10, INK, True))
        o.append(T(14, y + 27, "窓 = %g µs" % w, "start", 9.5, TEA))
        # セントラルのパケット（予定どおりに届いた場合）
        o.append(RECT(X(0), y, 80 * s, 12, 2, PSOFT, PUR, 1.0))
        # 届いてよい範囲
        o.append(W(X(-w), y + 16, X(-w), y + 20, X(w), y + 20, X(w), y + 16, c=GLD, lw=1.2))
        # 受信している時間
        o.append(RECT(X(-w), y + 24, (w + 80) * s, 12, 2, TSOFT, TEA, 1.0))
        o.append(T(X(80) + 8, y + 34, "受信 %g µs" % (w + 80), "start", 9.5, TEA, True))
    yl = 40 + 3 * 46 + 4
    o.append(LEGEND(14, yl, [(PUR, "セントラルの空のパケット（80 µs）"), (GLD, "時計の誤差で、届きうる範囲（± 窓）"), (TEA, "ペリフェラルが受信している時間")], gap=12))
    o.append(T(14, yl + 18, "窓 = 両者の時計の誤差の合計 ε × 前回のアンカーポイントからの時間（例 ε = 50 + 50 = 100 ppm）。", "start", 9.5, MUT))
    return SVG(700, yl + 28, o, "ペリフェラルが受信を始める時刻。前回のアンカーポイントから時間がたつほど、両者の時計のずれの最大の値が大きくなるので、ペリフェラルはそのぶん早く受信を始める。図は、セントラルのパケットが予定どおりに届いた場合。")
F["e19_widen"] = _f19_widen()

# ---- 5 節: 間隔と平均電流 ----
def _f19_avg():
    o = []
    p = Plot(86, 40, 500, 250, (0.01, 20), (1, 2000), xlog=True, ylog=True)
    xt = [0.01, 0.1, 1, 10]
    xf = {0.01: "10 ms", 0.1: "100 ms", 1: "1 s", 10: "10 s"}
    o.append(p.axes(xl="起きる間隔 T_e（アドバタイズは advInterval + 5 ms、接続は (1 + L) × 接続間隔）", yl="平均電流 [µA]", xt=xt, yt=[1, 10, 100, 1000],
                    xfmt=lambda v: xf[v], yfmt=lambda v: "%g" % v))
    Qa = _f19_q(_f19_adv_segs())
    Q0 = _f19_q(_f19_conn_segs(0.0))
    Ia = lambda T_: 2.0 + Qa / T_
    Ic = lambda T_: 2.0 + _F19_EPS * _F19_IRX * 1e3 + Q0 / T_
    pa = [(10 ** (k / 40.0 * math.log10(2000) - 2), 0) for k in range(41)]
    ptsA = [(t, Ia(t)) for t, _ in pa if 0.02 <= t <= 20 and Ia(t) <= 2000]
    ptsC = [(t, Ic(t)) for t, _ in pa if 0.0075 <= t <= 20 and Ic(t) <= 2000]
    o.append(p.line([(0.01, 2.0), (20, 2.0)], c=GRN, lw=1.2, dash="6 4"))
    o.append(p.line([(0.01, 2.6), (20, 2.6)], c=TEA, lw=1.2, dash="3 3"))
    o.append(p.line(ptsA, c=GLD, lw=2.2))
    o.append(p.line(ptsC, c=SIG, lw=2.2))
    o.append(T(p.X(0.034), p.Y(700), "アドバタイズ（1 回 14.2 µC）", "start", 9.5, GLD, True))
    o.append(T(p.X(0.012), p.Y(40), "接続（1 回 3.69 µC + 窓の分）", "start", 9.5, SIG, True))
    o.append(T(p.X(0.011), p.Y(2.0) + 12, "眠りの電流 2 µA", "start", 9, GRN))
    o.append(T(p.X(0.011), p.Y(2.6) - 5, "2 µA + 窓の分 0.6 µA", "start", 9, TEA))
    for t, I, c, side in ((Qa / 2.0, Ia(Qa / 2.0), GLD, 1), (Q0 / 2.6, Ic(Q0 / 2.6), SIG, -1)):
        o.append(W(p.X(t), p.Y(1), p.X(t), p.Y(I), c=c, lw=1, dash="3 3"))
        o.append(D(p.X(t), p.Y(I), c, 4))
        o.append(T(p.X(t) + side * 5, p.Y(1) - 6, "T* = %.1f s" % t, "start" if side > 0 else "end", 9.5, c, True, halo=True))
    for t, I, c, lab, dx, dy in ((0.105, Ia(0.105), GLD, "100 ms", 6, -6), (1.005, Ia(1.005), GLD, "1 s", 6, -6),
                                 (0.03, Ic(0.03), SIG, "30 ms", 7, 14), (0.3, Ic(0.3), SIG, "30 ms・L 9", -7, 4),
                                 (1.0, Ic(1.0), SIG, "1 s", -7, 4), (4.0, Ic(4.0), SIG, "4 s", -7, -7)):
        o.append(D(p.X(t), p.Y(I), c, 3.6))
        o.append(T(p.X(t) + dx, p.Y(I) + dy, "%s: %.1f µA" % (lab, I), "start" if dx > 0 else "end", 9, c, halo=True))
    # 右の目盛: CR2032 の寿命
    o.append(T(600, 14, "CR2032（220 mAh）", "start", 9.5, INK, True))
    o.append(T(600, 28, "の電池寿命", "start", 9.5, INK, True))
    for I, lab in ((1, "25 年"), (10, "2.5 年"), (100, "92 日"), (1000, "9.2 日")):
        o.append(W(p.x + p.w, p.Y(I), p.x + p.w + 4, p.Y(I), c=MUT, lw=1))
        o.append(T(612, p.Y(I) + 4, lab, "start", 9.5, MUT))
    return SVG(700, 346, o, "起きる間隔と平均電流（4 節の例の値。両軸とも対数目盛）。間隔が T* より短い間は、間隔を 10 倍にすると平均電流はほぼ 1/10 になる。T* を超えると、眠りの電流（接続ではさらに窓の分）に近づき、それ以上は減らない。")
F["e19_avg"] = _f19_avg()

# ---- 6 節: 1 秒ごとの報告の比較 ----
def _f19_cases():
    o = []
    Qn = _f19_q(_f19_conn_segs(1.0, 27)) - _f19_q(_f19_conn_segs(1.0))      # 通知 1 つで増える電荷
    rows = [("アドバタイズに値を入れる", "ADV_NONCONN_IND・1 s", 2.0 + _f19_q(_f19_adv_segs(31, False)) / 1.005, GLD,
             "届いたかは分からない。何台でも受け取れる"),
            ("接続して毎回通知", "接続間隔 1 s", 2.0 + _f19_q(_f19_conn_segs(1.0, 27)) / 1.0, SIG,
             "上りの遅れ ≤ 1 s・下り ≤ 1 s"),
            ("レイテンシで起きる回数を減らす", "接続間隔 100 ms・L = 9", 2.0 + _f19_q(_f19_conn_segs(1.0, 27)) / 1.0, SIG,
             "急ぐ上り ≤ 0.1 s・下り ≤ 1 s"),
            ("何も頼まない", "接続間隔 30 ms のまま", 2.0 + _f19_q(_f19_conn_segs(0.03)) / 0.03 + Qn, ALI,
             "上り・下りとも ≤ 30 ms")]
    lo, hi = 1.0, 300.0
    xb, bw = 250, 190
    Xl = lambda v: xb + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * bw
    y0, rh = 34, 46
    for v in (1, 10, 100):
        o.append(W(Xl(v), y0 - 6, Xl(v), y0 + 4 * rh - 8, c=GRD, lw=1))
        o.append(T(Xl(v), y0 - 10, "%g µA" % v, "middle", 9, MUT))
    for k, (nm, sub, I, c, note) in enumerate(rows):
        y = y0 + k * rh
        o.append(T(14, y + 12, nm, "start", 10, INK, True))
        o.append(T(14, y + 27, sub, "start", 9.5, MUT))
        o.append(RECT(xb, y + 4, Xl(I) - xb, 20, 2, soft(c), c, 1.1))
        days = 220.0 / (I * 1e-3) / 24
        life = ("%.1f 年" % (days / 365)) if days >= 365 else ("%.0f 日" % days)
        o.append(T(Xl(I) + 6, y + 18, "%.1f µA" % I, "start", 9.5, c, True))
        o.append(T(476, y + 12, "寿命 " + life, "start", 9.5, INK, True))
        o.append(T(476, y + 27, note, "start", 9, MUT))
    o.append(T(14, y0 + 4 * rh + 6, "値は 4 節の例の電流と時間による（代表値）。電池は CR2032（220 mAh）。L はペリフェラルレイテンシ。", "start", 9.5, MUT))
    return SVG(700, y0 + 4 * rh + 16, o, "1 秒ごとに 20 バイトの値を知らせる 4 つのやり方（横軸は対数目盛）。接続を保つほうがアドバタイズより電流が小さいのは、1 回のイベントで受信と送信を 1 回ずつしかしないからである。スマートフォンが選んだ短い接続間隔のままにすると、寿命は 1/16 になる。")
F["e19_cases"] = _f19_cases()

# ---- 6 節: 大きなデータを送る時間と電荷 ----
def _f19_bulk():
    o = []
    rows = [("LE 1M・DLE なし・ATT_MTU 23", "理論値 236.7 kbps", 17.31, 103.7, SIG),
            ("", "実効の例 20.3 kbps（3 節 (b)）", 202.1, 128.4, ALI),
            ("LE 2M・DLE・ATT_MTU 247", "理論値 1402.3 kbps", 2.92, 19.1, SIG),
            ("", "実効の例 865 kbps（3 節 (a)）", 4.73, 21.0, GLD)]
    lo, hi = 1.0, 300.0
    xb, bw = 270, 300
    Xl = lambda v: xb + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * bw
    y0, rh = 36, 30
    for v, lab in ((1, "1 s"), (10, "10 s"), (100, "100 s")):
        o.append(W(Xl(v), y0 - 6, Xl(v), y0 + 4 * rh, c=GRD, lw=1))
        o.append(T(Xl(v), y0 - 10, lab, "middle", 9, MUT))
    for k, (g, nm, t, q, c) in enumerate(rows):
        y = y0 + k * rh
        if g:
            o.append(T(14, y + 15, g, "start", 10, INK, True))
        o.append(T(xb - 8, y + 15, nm, "end", 9, MUT))
        o.append(RECT(xb, y + 4, Xl(t) - xb, 18, 2, soft(c), c, 1.1))
        o.append(T(Xl(t) + 6, y + 17, "%.3g s・%.0f mC" % (t, q), "start", 9.5, c, True))
    o.append(T(14, y0 + 4 * rh + 18, "500 KB（512,000 バイト）を通知で送る時間（横軸は対数目盛）と、ペリフェラルが使う電荷（4 節の例の電流による）。", "start", 9.5, MUT))
    o.append(T(14, y0 + 4 * rh + 34, "CR2032 の容量 220 mAh は 792 C なので、128 mC でも 0.016 % にすぎない。", "start", 9.5, MUT))
    return SVG(700, y0 + 4 * rh + 44, o, "大きなデータを送るときの、設定による違い。2M・DLE・大きな ATT_MTU にそろえると、時間も電荷も 1/5 以下になる。実効値では、1 回の接続イベントに送る往復の数の上限が、時間の大半を決める。")
F["e19_bulk"] = _f19_bulk()
